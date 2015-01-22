var ntdh = require('../../lib/netw/ntdh.js');
describe('ntdh', function() {
	it("cmd", function(done) {
		var nh = ntdh.NewNTDH({
			OnCmd: function(c) {
				console.log(c);
				done();
			}
		});
		nh.OnCmd({
			A: 1,
		});
	});
});