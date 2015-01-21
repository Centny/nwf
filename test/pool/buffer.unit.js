var pool = require('../../lib/pool/buffer.js');
// var expect = require('chai').expect;
describe('pool', function() {
	it("buffer", function() {
		var buf = pool.NewPool(8, 1024, 10000);
		buf.GC();
		console.log("");
		console.log(buf.Size());
		console.log("------->");
		console.time('alloc');
		for (var i = 500 - 1; i >= 0; i--) {
			var ary = [];
			var j = 0;
			for (j = 100 - 1; j >= 0; j--) {
				var tt = buf.Alloc(Math.floor(Math.random() * 1024));
				ary.push(tt);
			}
			for (j = 0; j < ary.length; j++) {
				buf.Free(ary[j]);
			}
		}
		console.log(buf.Size());
		buf.T = 10;
		buf.GC();
		console.timeEnd('alloc');
		buf.Free(null);
		buf.Free(1);
		var tbuf = null;
		tbuf = new Buffer(1026);
		tbuf.tv = tbuf;
		buf.Free(tbuf);
		tbuf = new Buffer(8);
		tbuf.tv = tbuf;
		buf.Free(tbuf);
		try {
			pool.NewPool(1, 2);
		} catch (e) {}
	});
});