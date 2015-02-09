var im = require("./im");
var netw = require("../netw");
var request = require("request");
var IMS_OK = "OK"; //in service
var IMS_OOS = "OOS"; //out of service
var IMS_ERR = "ERR"; //out of service

function SIO(io, p, v2b, b2v, iml) {
	var self = this;
	this.P = p;
	this.H = {
		smsg_v: function(m) {
			return m;
		},
		rmsg_v: function(m) {
			return m;
		},
	};
	this.V2B = v2b;
	this.B2V = b2v;
	this.iml = iml;
	this.port = "";
	this.host = "";
	this.ims = {};
	this.s = IMS_OOS;
	this.running = true;
	this.io = io;
	this.IM = null;
	this.cc_id = 1;
	this.dm = {};
	this.rc_t = 5000;
	io.on('connection', function(con) {
		self.onconn(con);
	});
}
SIO.prototype.end = function() {
	this.running = false;
	if (this.IM) {
		this.IM.end();
		this.IM.destroy();
		this.IM = null;
	}
};
SIO.prototype.OnConn = function() {
	var self = this;
	this.IM.nli_(this.ims, {
		id: this.cc_id++,
		cback: function(v) {
			if (v.code === 0) {
				self.s = IMS_OK;
				console.log("login IM server" + self.host + ":" + self.port + " success");
			} else {
				self.s = IMS_ERR;
				console.log("login IM server" + self.host + ":" + self.port + " error", v.res);
			}
		}
	});
	console.log("connect IM server" + this.host + ":" + this.port + " success");
	return true;
};
SIO.prototype.OnErr = function(c, err) {
	var self = this;
	this.s = IMS_ERR;
	console.error("connecting IM server" + this.host + ":" + this.port + "error:", err, " ,try after 5 s");
	setTimeout(function() {
		self.recon();
	}, this.rc_t);
};
SIO.prototype.OnClose = function() {
	this.s = IMS_OOS;
	console.log("the IM connection is closing");
	// this.recon();
};
SIO.prototype.OnCmd = function(c) {
	var v = c.V("PROTO");
	if (!v.d) {
		console.error("receive invalid message:", c.D);
		return -1;
	}
	var tc = this.dm[v.d];
	if (!tc) {
		console.error("receive invalid message, the receiver not found by", v.d);
		return -1;
	}
	// console.log(v.c);
	// v.c = new Buffer(v.c, "base64");
	// console.log(v.c);
	var tv = this.H.rmsg_v(v);
	// console.log(tc);
	for (var con in tc.cons) {
		tc.cons[con].emit("ms", tv);
	}
};
SIO.prototype.dosrv = function(error, response, body) {
	if (error) {
		this.s = IMS_ERR;
		console.error("require ims err:" + error);
		return;
	}
	var tsrv = this.B2V(body);
	if (tsrv.code !== 0) {
		this.s = IMS_ERR;
		console.error("require ims err:" + tsrv);
		return;
	}
	if (tsrv.data.length < 1) {
		this.s = IMS_ERR;
		console.error("the ims server not found");
		return;
	}
	this.ims = tsrv.data[0];
	this.IM.connect(this.ims.port, this.ims.host);
};
SIO.prototype.recon = function() {
	if (this.running) {
		this.IM = im.NewIM(this.P, this, this.V2B, this.B2V);
		var self = this;
		request(this.iml, function(error, response, body) {
			self.dosrv(error, response, body);
		});
	}
};
SIO.prototype.onconn = function(c) {
	console.log("receive connection from " + c.conn.remoteAddress, " server status is " + this.s);
	if (this.s != IMS_OK) {
		c.emit("err", {
			"err": "server status is " + this.s,
		});
		c.conn.close();
		return;
	}
	var self = this;
	c.ccid = this.cc_id++;
	c.on('li', function(args) {
		console.log("login from %s by %s", c.conn.remoteAddress, args);
		self.IM.uli_(args, {
			id: c.ccid,
			cback: function(v) {
				if (v.code === 0) {
					c.R = v.res.r;
					if (!self.dm[c.R]) {
						self.dm[c.R] = {
							cons: {},
							clen: 0,
						};
					}
					self.dm[c.R].cons[c.conn.id] = c;
					self.dm[c.R].clen++;
				}
				c.emit("li", v);
			}
		});
	});

	function clo(args) {
		console.log("user login by ", args);
		if (!c.R || !self.dm[c.R]) {
			return;
		}
		delete self.dm[c.R].cons[c.conn.id];
		self.dm[c.R].clen--;
		if (self.dm[c.R].clen > 1) {
			return;
		}
		self.IM.ulo_(args, {
			id: c.ccid,
			cback: function(v) {
				if (v.code !== 0) {
					console.error("logout error:%s", v.res);
				}
				delete self.dm[c.R];
				delete c.R;
				c.emit("lo", v);
			}
		});
	}
	c.on('lo', function(args) {
		console.log("logout from %s by %s", c.conn.remoteAddress, args);
		if (!c.R) {
			c.emit("err", {
				"err": "not login",
			});
			return;
		}
		args.r = c.R;
		clo(args);
	});
	c.on('ms', function(args) {
		if (!c.R) {
			c.emit("err", {
				"err": "not login",
			});
			console.error("connection not login:", c.conn.remoteAddress);
			return;
		}
		args.s = c.R;
		// args.c = args.c.toString("base64");
		try {
			self.IM.sendv(self.H.smsg_v(args), "PROTO");
		} catch (e) {
			c.emit("err", {
				"err": e,
			});
			console.error("send message error:", args, e);
		}
	});
	c.on('disconnect', function() {
		console.log("disconnect for %s", c.conn.remoteAddress);
		clo({
			r: c.R,
		});
	});
	c.on('error', function() {
		console.log("error occur for %s", c.conn.remoteAddress);
		clo({
			r: c.R,
		});
	});
};

module.exports.NewSIO = function(io, p, v2b, b2v, iml) {
	return new SIO(io, p, v2b, b2v, iml);
};
module.exports.NewSIO_j = function(io, p, iml) {
	return module.exports.NewSIO(io, p, netw.JSON_v2b, netw.JSON_b2v, iml);
};
module.exports.NewSIO_p = function(io, p, iml) {
	return module.exports.NewSIO(io, p, im.IM_V2B, im.IM_B2V, iml);
};