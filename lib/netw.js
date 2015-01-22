var net = require('net');
var H_MOD = "^~^";
var H_LEN = 5;

function CH(con, cmd) {
	this.Con = con;
	this.Cmd = cmd;
}
CH.prototype.OnConn = function(c) {
	return this.Con.OnConn(c);
};
CH.prototype.OnErr = function(c, err) {
	this.Con.OnErr(c, err);
};
CH.prototype.OnClose = function(c) {
	this.Con.OnClose(c);
};
CH.prototype.OnCmd = function(c) {
	this.Cmd.OnCmd(c);
};

function Con(p, h, v2b, b2v) {
	if (!p) {
		throw "pool is null";
	}
	if (!(h && h.OnConn && h.OnErr && h.OnClose && h.OnCmd)) {
		throw "handle must implement OnConn,OnErr,OnClose,OnCmd";
	}
	this.P = p;
	this.H = h;
	this.BSIZE = 102400;
	this.C = new net.Socket();
	// this.C.setEncoding('binary');
	this.R = {}; //the receive reference object.
	this.S = {}; //the receive reference object.
	this.S.buf = p.Alloc(H_LEN);
	this.S.buf.write(H_MOD);
	this.R.wh = true; //whether connection waiting head.
	this.RH = p.Alloc(H_LEN); //
	this.RH.vsize = 0;
	this.RD = {};
	this.RD.buf = null;
	this.RD.vsize = 0;
	this.RD.psize = 0;
	if (v2b) {
		this.V2B = v2b;
	} else {
		this.V2B = function() {
			throw "not support";
		};
	}
	if (b2v) {
		this.B2V = b2v;
	} else {
		this.B2V = function() {
			throw "not support";
		};
	}
}
Con.prototype.end = function() {
	this.C.end();
};
Con.prototype.destroy = function() {
	this.C.destroy();
};
Con.prototype.write = function() {
	this.write_(arguments);
};
Con.prototype.writev = function(v) {
	var b = this.V2B(v);
	this.write(b);
};
Con.prototype.write_ = function(ary) {
	var i = 0;
	var blen = 0;
	for (i = 0; i < ary.length; i++) {
		blen += ary[i].length;
	}
	this.S.buf.writeUInt16BE(blen, 3);
	this.C.write(this.S.buf);
	for (i = 0; i < ary.length; i++) {
		this.C.write(ary[i]);
	}
	return blen + 5;
};
Con.prototype.connect = function(port, host) {
	var self = this;
	this.C.on('data', function(d) {
		self.ondata(d);
	});
	this.C.on('error', function(err) {
		self.onerr(err);
	});
	this.C.on('close', function() {
		self.onclose();
	});
	this.C.connect(port, host, function() {
		self.onconn();
	});
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
		var self = this;
		this.H.OnCmd({
			C: this,
			D: this.RD.buf,
			d_: this.RD.buf,
			Done: function() {
				self.P.Free(this.d_);
			},
			V: function() {
				return self.B2V(this.D);
			},
		});
	} catch (e) {
		this.err("exec command err:" + e);
	}
	this.reset_();
	if (d.length - d.vsize - 1 > 0) { //if having more data.
		return this.ondata(d.slice(d.vsize, d.length));
	}
	return true;
};

function JSON_v2b(v) {
	var str = JSON.stringify(v);
	return new Buffer(str, 'utf8');
}

function JSON_b2v(b) {
	return JSON.parse(b.toString('utf8'));
}
module.exports = Con;
module.exports.H_MOD = H_MOD;
module.exports.H_LEN = H_LEN;
module.exports.NewCon = function(p, h, v2b, b2v) {
	return new Con(p, h, v2b, b2v);
};
module.exports.NewCon_j = function(p, h) {
	return new Con(p, h, JSON_v2b, JSON_b2v);
};
module.exports.NewCH = function(con, cmd) {
	return new CH(con, cmd);
};
module.exports.JSON_v2b = JSON_v2b;
module.exports.JSON_b2v = JSON_b2v;
module.exports.desc = 'package netw provide node api to net client for https://github.com/Centny/gwf/netw';