var util = require('../lib/util.js');
describe('util', function() {
	it("dl_g", function(done) {
		util.dl_g("http://www.baidu.com/index.html", ".", function(f) {
			console.log(f);
			done();
		});
	});
	it("sha1", function(done) {
		util.SHA1("index.html", function(sha1) {
			console.log(sha1);
			done();
		});
	});
});