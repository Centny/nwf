var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sio = require('../../lib/im/sio');
var pool = require('../../lib/buffer');
var sic = require('socket.io-client');

app.get('/', function(req, res) {
	res.send('<h1>Welcome</h1>');
});
var port = 9891;
var host = '127.0.0.1';
var bp = pool.NewPool(8, 102400);
var ss = sio.NewSIO_j(io, bp, port, host, {
	sid: "abbb",
	token: "abc"
});
setTimeout(function() {
	http.listen(3000, function() {
		console.log('listening on *:3000');
	});
}, 1);

function ddd(done) {
	ss.recon();
	var IM = ss.IM;
	var mc = 0;
	var sc = sic('http://localhost:3000');
	sc.on('connect', function() {
		sc.emit("ms", {
			t: 0,
			r: ["abcc"],
			c: new Buffer("bbb"),
		});
		sc.emit('li', {});
	});
	sc.on("li", function(v) {
		IM.uli_({}, {
			id: "aa-1",
			cback: function(tv) {
				// console.log(tv, v);
				for (var i = 10000; i > 0; i--) {
					IM.sendv({
						s: tv.res.r,
						t: 0,
						r: [v.res.r],
						c: new Buffer("aaa"),
					});
				}
				sc.emit("ms", {
					t: 0,
					r: [tv.res.r],
					c: new Buffer("bbb"),
				});
			},
		});
	});
	sc.on("ms", function() {
		mc++;
		if (mc >= 10000) {
			console.log("mc", mc);
			sc.emit("lo", {});
			setTimeout(function() {
				sc.close();
				ss.running = false;
				ss.end();
				ss.end();
				setTimeout(done, 500);
			}, 500);
		}
	});
}

//
describe('sio', function() {
	it("im", function(done) {
		console.log("");
		//
		// var mg = sic.Manager();
		// var sc = sic('http://localhost:3000');
		// sc.on('connect', function() {
		// 	sc.close();
		// 	sc.destroy();
		// 	sc.disconnect();
		// 	mg.close();
		// 	console.log(sc);
		// });
		// setTimeout(function() {
		ddd(done);
		// }, 1000);
	});
	it("imerr", function() {
		sio.NewSIO_j(io, bp, "sdfsf", "2", {
			sid: "abbb",
			token: "abc"
		});
		sio.NewSIO_j(io, bp, port, host, {
			sid: "abbb",
			token: "sddd"
		});
	});
});