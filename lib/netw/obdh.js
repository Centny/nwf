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
		console.error("handler not found by " + tb);
	}
};

function OBDH_Con(con, b) {
	if (!con) {
		throw "con is null";
	}
	if (typeof(b) != "number" || b < 0 || b > 255) {
		throw "invalid OBDH mark byte,it must in 0~255";
	}
	this.C = con;
	this.B = new Buffer(1);
	this.B.writeUInt8(b, 0);
}
OBDH_Con.prototype.write = function() {
	var args = Array.prototype.slice.call(arguments, 0);
	args.unshift(this.B);
	this.C.write_(args);
};
module.exports = {};
module.exports.NewOBDH = function() {
	return new OBDH();
};
module.exports.NewCon = function(con, b) {
	return new OBDH_Con(con, b);
};