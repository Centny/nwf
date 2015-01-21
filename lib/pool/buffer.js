var GC_T = 300000;

function Buf(p, s) {
	this.P = p;
	this.bsize = s;
	this.ls = [];
	this.zero = 0;
	this.ls.push({});
	this.ls_m = {};
}
Buf.prototype.Alloc = function() {
	var obj = {};
	if (this.zero === 0) {
		var buf = new Buffer(this.bsize);
		obj.buf = buf;
		obj.T = new Date().getTime();
	} else {
		obj = this.ls.shift();
		obj.T = new Date().getTime();
		this.zero--;
	}
	this.ls.push(obj);
	this.ls_m[obj.buf] = this.ls.length - 1;
	return obj.buf;
};
Buf.prototype.Free = function(buf) {
	var idx = this.ls_m[buf];
	if (idx) {
		var obj = this.ls[idx];
		this.ls.splice(idx, 1);
		obj.T = new Date().getTime();
		this.ls.splice(this.zero, 0, obj);
		this.zero++;
		return true;
	} else {
		return false;
	}
};
Buf.prototype.Size = function() {
	return (this.ls.length - 1) * this.bsize;
};
Buf.prototype.GC = function() {
	if (this.zero === 0) {
		return 0;
	}
	var rc = 0;
	var tn = new Date().getTime();
	while (true) {
		var obj = this.ls[0];
		if ((tn - obj.T) > this.P.T) {
			this.ls.shift();
			rc++;
		} else {
			break;
		}
	}
	return rc;
};

function Pool(beg, end, t) {
	if (t) {
		this.T = t;
	} else {
		this.T = GC_T;
	}
	this.beg = beg;
	this.end = end;
	if (beg < 1 || end < 1 || (beg % 8) !== 0 || (end % 8) !== 0) {
		throw "beg/end must be a multiple of 8";
	}
	this.ms_ = {};
	for (var i = (beg / 8); i <= (end / 8); i++) {
		var size_ = i * 8;
		this.ms_[size_] = new Buf(this, size_);
	}
}
Pool.prototype.Alloc = function(l) {
	if (l < 1 || l > this.end) {
		return null;
	}
	var tl = 8 * parseInt(l / 8, 10);
	if (tl < l) {
		tl += 8;
	}
	var tv = this.ms_[tl].Alloc();
	var rv = tv;
	if (tl > l) {
		rv = tv.slice(0, l);
	}
	rv.tv = tv;
	return rv;
};

Pool.prototype.Free = function(buf) {
	if (!buf || !buf.tv) {
		return false;
	}
	var tl = parseInt(buf.length / 8, 10) * 8;
	if (tl < buf.length) {
		tl += 8;
	}
	if (tl > this.end) {
		return false;
	}
	return this.ms_[tl].Free(buf.tv);
};

Pool.prototype.Size = function() {
	var tsize = 0;
	for (var s in this.ms_) {
		tsize += this.ms_[s].Size();
	}
	return tsize;
};

Pool.prototype.GC = function() {
	var tsize = 0;
	for (var s in this.ms_) {
		tsize += this.ms_[s].GC();
	}
	return tsize;
};

module.exports = Pool;
module.exports.GC_T = GC_T;
//
module.exports.NewPool = function(beg, end, t) {
	return new Pool(beg, end, t);
};