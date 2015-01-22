function OBDH() {
	this.HS = {};
}
OBDH.prototype.addh = function(b, h) {
	if (typeof(b) != "number" || b < 0 || b > 255) {
		throw "invalid OBDH mark byte,it must in 0~255";
	}
	this.HS[b] = h;
};
OBDH.prototype.OnCmd = function(c) {
	var tb = c.D.readUInt8(0);
	var th = this.HS[tb];
	if (th && th.OnCmd) {
		c.D = c.D.slice(1);
		return th.OnCmd(c);
	} else {
		console.log(c.D);
		console.error("handler not found by " + tb + ",data:", c.D, this.HS);
	}
};

function OBDH_Con(con, b) {
	if (!con) {
		throw "con is null";
	}
	if (typeof(b) != "number" || b < 0 || b > 255) {
		throw "invalid OBDH mark byte,it must in 0~255";
	}
	this.P = con.P;
	this.V2B = con.V2B;
	this.B2V = con.B2V;
	this.C = con;
	this.B = new Buffer(1);
	this.B.writeUInt8(b, 0);
}
OBDH_Con.prototype.write_ = function(ary) {
	var args = Array.prototype.slice.call(ary, 0);
	args.unshift(this.B);
	this.C.write_(args);
};
OBDH_Con.prototype.write = function() {
	this.write_(arguments);
};
OBDH_Con.prototype.writev = function(v) {
	this.write(this.C.V2B(v));
};
OBDH_Con.prototype.end = function() {
	this.C.end();
};
OBDH_Con.prototype.destroy = function() {
	this.C.destroy();
};
module.exports = {};
module.exports.NewOBDH = function() {
	return new OBDH();
};
module.exports.NewCon = function(con, b) {
	return new OBDH_Con(con, b);
};