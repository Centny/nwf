var netw = require('../lib/netw.js');
var pool = require('../lib/buffer.js');
var expect = require('chai').expect;
var net = require('net');
describe('netw', function() {
	var buf = new Buffer(16);
	buf.write(netw.H_MOD);
	buf.writeUInt16BE(3, 3);
	buf.write("abc", 5);
	buf.write(netw.H_MOD, 8);
	buf.writeUInt16BE(3, 11);
	buf.write("abc", 13);
	describe("connect", function() {
		it("conn", function(done) {
			var s = net.createServer(function(socket) {
				socket.on("data", function(d) {
					console.log("data:", d.toString());
					socket.destroy();
				});
				socket.write(buf);
			});
			s.listen(30200);
			// done();
			var bp = pool.NewPool(8, 10240);
			var con = netw.NewCon(bp, {
				II: 0,
				OnConn: function(c) {
					console.log("onconn");
					expect(false).equal(c === null);
					return true;
				},
				OnErr: function(c, err) {
					expect(false).equal(c === null);
					console.log(err, "--->");
				},
				OnClose: function(c) {
					expect(false).equal(c === null);
					console.log("--->close");
					done();
				},
				OnCmd: function(c) {
					expect("abc").equal(c.D.toString());
					console.log(c.D.toString());
					this.II++;
					if (this.II > 1) {
						con.write("abccc");
					}
				},
			});
			con.connect(30200, '127.0.0.1');
		});
		it("err", function(done) {
			// done();
			var bp = pool.NewPool(8, 10240);
			var con = netw.NewCon(bp, {
				II: 0,
				OnConn: function(c) {
					expect(true).equal(c);
					return true;
				},
				OnErr: function(c, err) {
					expect(false).equal(c === null);
					console.log(err, "--->");
					done();
				},
				OnClose: function(c) {
					expect(true).equal(c !== null);
				},
				OnCmd: function(c) {
					expect(true).equal(c);
				},
			});
			con.connect('127.0.0.x', 22222);
		});
	});
	describe("data", function() {
		var bp = pool.NewPool(8, 10240);
		var con = netw.NewCon(bp, {
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
				expect("abc").equal(c.D.toString());
				console.log(c.D.toString());
				c.Done();
			},
		});
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
});