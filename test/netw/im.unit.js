var im = require('../../lib/netw/im.js');
var pool = require('../../lib/buffer.js');
var expect = require('chai').expect;

//
function CC(dd, cmd) {
	var self = this;
	this.dd = dd;
	this.cmd = cmd;
	this.bp = pool.NewPool(8, 10240);
	this.ic = im.NewIM_j(this.bp, {
		OnConn: function(c) {
			expect(false).equal(c === null);
			self.nli();
			return true;
		},
		OnErr: function(c, err) {
			expect(false).equal(c === null);
			console.log(err);
		},
		OnClose: function(c) {
			expect(false).equal(c === null);
		},
		OnCmd: function(c) {
			self.cmd(c);
			c.Done();
		},
	});
}
CC.prototype.uli = function() {
	var self = this;
	this.ic.uli_({}, {
		id: "01",
		cback: function(v) {
			self.dd(v);
		}
	});
};
CC.prototype.nli = function() {
	var self = this;
	this.ic.nli_({
		sid: "abbb",
		token: "abc"
	}, {
		id: "01",
		cback: function(v) {
			expect(false).equal(v === null);
			self.uli();
		}
	});
};
describe('im', function() {
	it("im", function(done) {
		console.log("");
		var sc = 0;
		var c2 = null;
		var c1 = new CC(function(v1) {
			c2 = new CC(function(v2) {
				c2.ic.emit(v2.res.r, [v1.res.r], 0, new Buffer("abc", "utf8"));
			}, function(c) {
				var v = c.V();
				c2.ic.emit(v.d, [v.s], 0, new Buffer("ebf", "utf8"));
				sc++;
			});
			c2.ic.connect(9891, '127.0.0.1');
		}, function(c) {
			var v = c.V();
			c1.ic.emit(v.d, [v.s], 0, new Buffer("ebf", "utf8"));
		});
		c1.ic.connect(9891, '127.0.0.1');
		setTimeout(function() {
			c1.ic.ulo_({}, {
				id: "01",
				cback: function(v) {
					console.log(v);
				}
			});
			c2.ic.ulo_({}, {
				id: "01",
				cback: function(v) {
					console.log(v);
				}
			});
		}, 2000);
		setTimeout(function() {
			c1.ic.end();
			c2.ic.end();
			c1.ic.destroy();
			c2.ic.destroy();
			done();
			console.log("SC", sc);
		}, 3000);
	});
	it("err", function() {
		var bp = pool.NewPool(8, 10240);
		var ic = im.NewIM_j(bp, {
			OnConn: function(c) {
				expect(false).equal(c === null);
				return true;
			},
			OnErr: function(c, err) {
				expect(false).equal(c === null);
				console.log(err);
			},
			OnClose: function(c) {
				expect(false).equal(c === null);
			},
			OnCmd: function(c) {
				c.Done();
			},
		});
		try {
			ic.uli_({});
		} catch (e) {}
		try {
			ic.ulo_({});
		} catch (e) {}
		try {
			ic.nli_({});
		} catch (e) {}
		try {
			ic.umsg({
				V: function() {
					return {};
				},
				Done: function() {

				},
			});
		} catch (e) {}
		try {
			ic.umsg({
				V: function() {
					return {
						b: 1,
					};
				},
				Done: function() {

				},
			});
		} catch (e) {}
	});
});