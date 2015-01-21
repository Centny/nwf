var netw = require('../../lib/netw/netw.js');
var pool = require('../../lib/pool/buffer.js');
var expect = require('chai').expect;
describe('netw', function() {
	describe("data", function() {
		var bp = pool.NewPool(8, 10240);
		var con = netw.NewCon(bp, {
			OnConn: function(c) {
				console.log(c);
				return true;
			},
			OnErr: function(c, err) {
				console.log(c, err);
			},
			OnClose: function(c) {
				console.log(c);
			},
			OnCmd: function(c) {
				expect("abc").equal(c.D.toString());
				console.log(c.D.toString());
			},
		});
		var buf = new Buffer(16);
		buf.write(netw.H_MOD);
		buf.writeUInt16BE(3, 3);
		buf.write("abc", 5);
		buf.write(netw.H_MOD, 8);
		buf.writeUInt16BE(3, 11);
		buf.write("abc", 13);
		it("ondata", function() {
			console.log("\nlog-->");
			//
			expect(true).equal(con.ondata(buf.slice(0, 8)));
			//
			expect(true).equal(con.ondata(buf.slice(0, 1)));
			expect(true).equal(con.ondata(buf.slice(1, 8)));
			// //
			expect(true).equal(con.ondata(buf.slice(0, 3)));
			expect(true).equal(con.ondata(buf.slice(3, 8)));
			// //
			// //
			expect(true).equal(con.ondata(buf.slice(0, 4)));
			expect(true).equal(con.ondata(buf.slice(4, 8)));
			// //
			expect(true).equal(con.ondata(buf.slice(0, 3)));
			expect(true).equal(con.ondata(buf.slice(3, 5)));
			expect(true).equal(con.ondata(buf.slice(5, 8)));
			// //
			expect(true).equal(con.ondata(buf.slice(0, 4)));
			expect(true).equal(con.ondata(buf.slice(4, 6)));
			expect(true).equal(con.ondata(buf.slice(6, 8)));
			// console.log(con);
			//
			expect(true).equal(con.ondata(buf));
		});
		it("large data error", function() {
			console.log("\nlog-->");
			var ov = con.BSIZE;
			con.BSIZE = 5;
			expect(false).equal(con.ondata(buf.slice(0, 8)));
			// //
			// //
			con.BSIZE = 1022;
			var tbuf = null;
			tbuf = new Buffer(8);
			tbuf.write(netw.H_MOD);
			tbuf.writeUInt16BE(10240, 3);
			tbuf.write("abc", 5);
			expect(false).equal(con.ondata(tbuf));
			//
			tbuf = new Buffer(8);
			tbuf.write("sss");
			tbuf.writeUInt16BE(3, 3);
			tbuf.write("abc", 5);
			expect(false).equal(con.ondata(tbuf));

			//
			con.BSIZE = ov;
		});
		it("on cmd error", function() {
			var tbuf = null;
			tbuf = new Buffer(8);
			tbuf.write(netw.H_MOD);
			tbuf.writeUInt16BE(3, 3);
			tbuf.write("ddd", 5);
			expect(true).equal(con.ondata(tbuf));
		});
	});
	describe("new error", function() {
		try {
			netw.NewCon(null, {});
		} catch (e) {}
		try {
			netw.NewCon(1, {});
		} catch (e) {}
	});
	describe("new CH", function() {
		var ch = netw.NewCH();
		ch.OnConn(null);
		ch.OnClose(null);
		ch.OnErr(null, null);
		ch.OnCmd(null);
	});
	describe("connect", function() {
		var bp = pool.NewPool(8, 10240);
		var con = netw.NewCon(bp, {
			OnConn: function(c) {
				console.log(c);
				return true;
			},
			OnErr: function(c, err) {
				console.log(c, err);
			},
			OnClose: function(c) {
				console.log(c);
			},
			OnCmd: function(c) {
				expect("abc").equal(c.D.toString());
				console.log(c.D.toString());
			},
		});
		con.connect("localhost", "80");
		con.onclose();
		con.onerr();
		con.onconn();
	});
});