var obdh = require('../../lib/netw/obdh.js');
describe('obdh', function() {
	it("cmd", function() {
		console.log("");
		var oh = obdh.NewOBDH();
		oh.addh(1, {
			OnCmd: function(c) {
				console.log("1->", c.D.toString(), c.a);
				// c.Done();
			},
		});
		oh.addh(2, {
			OnCmd: function(c) {
				console.log("2->", c.D.toString(), c.a);
				// c.Done();
			},
		});
		var buf = new Buffer(4);
		buf.write("abc", 1);
		buf.writeUInt8(1, 0);
		oh.OnCmd({
			a: 0,
			D: buf,
		});
		buf.writeUInt8(2, 0);
		oh.OnCmd({
			a: 1,
			D: buf,
		});
		buf.writeUInt8(3, 0);
		oh.OnCmd({
			a: 2,
			D: buf,
		});

		try {
			oh.addh(-1, {});
		} catch (e) {

		}
	});
	it("cmd", function() {
		var oh = obdh.NewCon({
			write_: function(v) {
				console.log(v);
			},
			end: function() {

			},
			destroy: function() {

			},
		}, 1);
		var buf = new Buffer(3);
		buf.write("abc", 0);
		oh.write(buf);
		oh.end();
		oh.destroy();
		try {
			obdh.NewCon(null, null);
		} catch (e) {

		}
		try {
			obdh.NewCon({
				write_: function(v) {
					console.log(v);
				},
			}, 2323234);
		} catch (e) {

		}
	});
});