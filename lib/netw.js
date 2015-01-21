var net = require('net');
var H_MOD = "^~^";
var H_LEN = 5;

function CH() {}
CH.prototype.OnConn = function(c) {
	console.log(c);
	return true;
};
CH.prototype.OnErr = function(c, err) {
	console.log(c, err);
};
CH.prototype.OnClose = function(c) {
	console.log(c);
};
CH.prototype.OnCmd = function(c) {
	console.log(c);
};

function Con(p, h) {
	if (!p) {
		throw "pool is null";
	}
	if (!(h.OnConn && h.OnErr && h.OnClose && h.OnCmd)) {
		throw "handle must implement OnConn,OnErr,OnClose,OnCmd";
	}
	this.P = p;
	this.H = h;
	this.BSIZE = 102400;
	this.C = new net.Socket();
	this.C.setEncoding('binary');
	this.C.on('data', this.ondata);
	this.C.on('error', this.onerr);
	this.C.on('close', this.onclose);
	this.R = {}; //the receive reference object.
	this.R.wh = true; //whether connection waiting head.
	this.RH = p.Alloc(H_LEN); //
	this.RH.vsize = 0;
	this.RD = {};
	this.RD.buf = null;
	this.RD.vsize = 0;
	this.RD.psize = 0;
}
Con.prototype.connect = function(h, p) {
	this.C.connect(h, p, this.onconn);
};
Con.prototype.onconn = function() {
	this.H.OnConn(this.C);
};
Con.prototype.onerr = function(err) {
	this.H.OnErr(this.C, err);
	this.C.end();
};
Con.prototype.onclose = function() {
	this.H.OnClose(this.C);
	this.C.destroy();
};
Con.prototype.err_tolarge_ = function(l) {
	return this.err("receiving the too large data(" + l + ")", true);
};
Con.prototype.err = function(msg, end) {
	console.log(msg);
	if (end) {
		this.C.end();
	}
	this.reset_();
	return false;
};
Con.prototype.reset_ = function() {
	this.RH.vsize = 0;
	this.RD.buf = null;
	this.RD.vsize = 0;
	this.RD.psize = 0;
	this.RH.vsize = 0;
	this.R.wh = true;
};
Con.prototype.ondata = function(d) {
	if (d.length > this.BSIZE) {
		return this.err_tolarge_(d.length);
	}
	d.vsize = 0;
	if (this.R.wh) {
		//read head data.
		var clen = H_LEN - this.RH.vsize;
		if (clen > d.length) {
			clen = d.length;
		}
		d.copy(this.RH, this.RH.vsize, d.vsize, d.vsize + clen);
		this.RH.vsize += clen;
		d.vsize += clen;
		if (this.RH.vsize < H_LEN) { //if not enough for head,waiting next.
			return true;
		}
		//
		//check head mod whether valid.
		var rh = this.RH.toString('utf8', 0, 3);
		if (H_MOD != rh) {
			return this.err("receive invalid head:" + rh, true);
		}
		this.RD.psize = this.RH.readUInt16BE(3);
		if (this.RD.psize > this.BSIZE) {
			return this.err_tolarge_(this.RD.psize);
		}
		//
		//begin receive the really data.
		this.RD.buf = this.P.Alloc(this.RD.psize);
		this.RD.vsize = 0;
		this.R.wh = false;
		if (d.length === d.vsize) { //if not enough data.
			return true;
		}
	}
	//copy the data.
	var dlen = d.length - d.vsize;
	if (dlen > this.RD.psize - this.RD.vsize) {
		dlen = this.RD.psize - this.RD.vsize;
	}
	d.copy(this.RD.buf, this.RD.vsize, d.vsize, d.vsize + dlen);
	this.RD.vsize += dlen;
	d.vsize += dlen;
	if (this.RD.vsize < this.RD.psize) { //check recieve data whether enough.
		return true;
	}
	//
	try {
		this.H.OnCmd({
			C: this,
			D: this.RD.buf,
		});
	} catch (e) {
		this.err("exec command err:" + e);
	}
	this.P.Free(this.RD.buf);
	this.reset_();
	if (d.length - d.vsize - 1 > 0) { //if having more data.
		return this.ondata(d.slice(d.vsize, d.length));
	}
	return true;
};


module.exports = Con;
module.exports.H_MOD = H_MOD;
module.exports.H_LEN = H_LEN;
module.exports.NewCon = function(p, h) {
	return new Con(p, h);
};
module.exports.NewCH = function() {
	return new CH();
};