var obdh = require("../netw/obdh");
var netw = require("../netw");
var ntdh = require("../netw/ntdh");
var ProtoBuf = require("protobufjs");
//
var MK_NDC_NLI = 0;
var MK_NDC_ULI = 10;
var MK_NDC_ULO = 11;
var MK_NDC_UUR = 12;
//
var MK_NODE_C = 30;
var MK_NODE_M = 31;
var MK_NIM = 0;
var _imb_ = ProtoBuf.loadProtoFile(__dirname + "/msg.proto");
var _Msg_ = _imb_.build("ImMsg");

function IM_B2V(bys, t) {
	// console.log("B2V", bys, t)
	if ("PROTO" == t) {
		var m = _Msg_.decode(bys);
		m.c = m.c.buffer.slice(m.c.offset, m.c.limit);
		return m;
	} else {
		return netw.JSON_b2v(bys);
	}
}

function IM_V2B(v, t) {
	if ("PROTO" == t) {
		return new _Msg_(v).toBuffer();
	} else {
		return netw.JSON_v2b(v);
	}
}

function IM(p, ch, v2b, b2v) {
	var self = this;
	this.H = ch;
	this.ob = obdh.NewOBDH();
	//
	this.C = netw.NewCon(p, netw.NewCH(ch, ntdh.NewNTDH(this.ob)), v2b, b2v);
	this.MC = obdh.NewCon(this.C, MK_NODE_M);
	//
	this.NC = obdh.NewCon(this.C, MK_NODE_C);
	this.nli_c = obdh.NewCon(this.NC, MK_NDC_NLI);
	this.uli_c = obdh.NewCon(this.NC, MK_NDC_ULI);
	this.ulo_c = obdh.NewCon(this.NC, MK_NDC_ULO);
	this.uur_c = obdh.NewCon(this.NC, MK_NDC_UUR);
	//
	this.cob = obdh.NewOBDH();
	this.cob.addh(MK_NDC_NLI, {
		OnCmd: function(v) {
			self.umsg(v);
		},
	});
	this.cob.addh(MK_NDC_ULI, {
		OnCmd: function(v) {
			self.umsg(v);
		},
	});
	this.cob.addh(MK_NDC_ULO, {
		OnCmd: function(v) {
			self.umsg(v);
		},
	});
	this.cob.addh(MK_NDC_UUR, {
		OnCmd: function(v) {
			self.umsg(v);
		},
	});
	this.ob.addh(MK_NODE_C, this.cob);
	//
	this.ob.addh(MK_NIM, {
		OnCmd: function(v) {
			self.mmsg(v);
		},
	});
	//
	this.cm = {}; //con id
}
IM.prototype.connect = function(port, host) {
	this.C.connect(port, host);
};
IM.prototype.send = function() {
	this.MC.write_(arguments);
};
IM.prototype.sendv = function(v, t) {
	this.send(this.MC.V2B(v, t));
};
IM.prototype.emit = function(s, r, t, c) {
	this.send(this.MC.V2B({
		s: s,
		r: r,
		t: t,
		c: c
	}, "PROTO"));
};
IM.prototype.mmsg = function(c) {
	this.H.OnCmd(c);
};
IM.prototype.umsg = function(c) {
	var vm = c.V("JSON");
	c.Done();
	if (!(vm && vm.b)) {
		console.error("receive invalid message", c.D);
		return -1;
	}
	var tc = this.cm[vm.b];
	if (!tc) {
		console.error("message back connect is not found");
		return -1;
	}
	tc.cback(vm.v);
};
IM.prototype.chk_tc_ = function(tc) {
	if (!this.cm[tc.id]) {
		this.cm[tc.id] = {
			i: 0
		};
	}
};
IM.prototype.nli_ = function(args, tc) {
	if (!(tc && tc.id && tc.cback)) {
		throw "tc or tc.id or tc.cback is null";
	}
	this.chk_tc_(tc);
	var tid = tc.id + "" + this.cm[tc.id].i;
	this.cm[tid] = tc;
	this.cm[tc.id].i++;
	this.nli_c.writev({
		v: args,
		b: tid,
	});
};
IM.prototype.uli_ = function(args, tc) {
	if (!(tc && tc.id && tc.cback)) {
		throw "tc or tc.id or tc.cback is null";
	}
	this.chk_tc_(tc);
	var tid = tc.id + "" + this.cm[tc.id].i;
	this.cm[tid] = tc;
	this.cm[tc.id].i++;
	this.uli_c.writev({
		v: args,
		b: tid,
	});
};
IM.prototype.ulo_ = function(args, tc) {
	if (!(tc && tc.id && tc.cback)) {
		throw "tc or tc.id or tc.cback is null";
	}
	this.chk_tc_(tc);
	var tid = tc.id + "" + this.cm[tc.id].i;
	this.cm[tid] = tc;
	this.cm[tc.id].i++;
	this.ulo_c.writev({
		v: args,
		b: tid,
	});
};
IM.prototype.uur_ = function(args, tc) {
	if (!(tc && tc.id && tc.cback)) {
		throw "tc or tc.id or tc.cback is null";
	}
	this.chk_tc_(tc);
	var tid = tc.id + "" + this.cm[tc.id].i;
	this.cm[tid] = tc;
	this.cm[tc.id].i++;
	this.uur_c.writev({
		v: args,
		b: tid,
	});
};
IM.prototype.end = function() {
	this.C.end();
};
IM.prototype.destroy = function() {
	this.C.destroy();
};
module.exports = {};
module.exports.MK_NDC_NLI = MK_NDC_NLI;
module.exports.MK_NDC_ULI = MK_NDC_ULI;
module.exports.MK_NDC_ULO = MK_NDC_ULO;
module.exports.MK_NODE_C = MK_NODE_C;
module.exports.MK_NODE_M = MK_NODE_M;
module.exports.MK_NIM = MK_NODE_M;
module.exports.IM_V2B = IM_V2B;
module.exports.IM_B2V = IM_B2V;
module.exports.NewIM = function(p, ch, v2b, b2v) {
	return new IM(p, ch, v2b, b2v);
};
module.exports.NewIM_j = function(p, ch) {
	return module.exports.NewIM(p, ch, netw.JSON_v2b, netw.JSON_b2v);
};
module.exports.NewIM_p = function(p, ch) {
	return module.exports.NewIM(p, ch, IM_V2B, IM_B2V);
};