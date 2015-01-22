var im = require("./im");
var netw = require("../netw");
var IMS_OK = "OK"; //in service
var IMS_OOS = "OOS"; //out of service
var IMS_ERR = "ERR"; //out of service

function SIO(io, p, v2b, b2v, port, host, nla) {
	var self = this;
	this.P = p;
	this.V2B = v2b;
	this.B2V = b2v;
	this.port = port;
	this.host = host;
	this.s = IMS_OOS;
	this.running = true;
	this.io = io;
	this.IM = null;
	this.cc_id = 1;
	this.dm = {};
	this.nla = nla;
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
	this.IM.nli_(this.nla, {
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
	}, 5000);
};
SIO.prototype.OnClose = function() {
	this.s = IMS_OOS;
	console.log("the IM connection is closing");
	this.recon();
};
SIO.prototype.OnCmd = function(c) {
	var v = c.V();
	if (!v.d) {
		console.error("receive invalid message:", v, c.D);
		return -1;
	}
	var tc = this.dm[v.d];
	if (!tc) {
		console.error("receive invalid message, the receiver not found by", v.d);
		return -1;
	}
	tc.emit("ms", v);
};
SIO.prototype.recon = function() {
	if (this.running) {
		this.IM = im.NewIM(this.P, this, this.V2B, this.B2V);
		this.IM.connect(this.port, this.host);
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
		console.log(args);
		self.IM.uli_(args, {
			id: c.ccid,
			cback: function(v) {
				if (v.code === 0) {
					c.R = v.res.r;
					self.dm[c.R] = c;
				}
				c.emit("li", v);
			}
		});
	});
	c.on('lo', function(args) {
		self.IM.ulo_(args, {
			id: c.ccid,
			cback: function(v) {
				delete self.dm[c.R];
				delete c.R;
				c.emit("lo", v);
			}
		});
	});
	c.on('ms', function(args) {
		if (!c.R) {
			console.error("connection not login:", c.conn.remoteAddress);
			return;
		}
		args.s = c.R;
		self.IM.sendv(args);
	});
};

module.exports.NewSIO = function(io, p, v2b, b2v, port, host, nla) {
	return new SIO(io, p, v2b, b2v, port, host, nla);
};
module.exports.NewSIO_j = function(io, p, port, host, nla) {
	return module.exports.NewSIO(io, p, netw.JSON_v2b, netw.JSON_b2v, port, host, nla);
};