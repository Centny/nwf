module.exports = {};
module.exports.version = "0.0.1";
module.exports.author = "Centny";
module.exports.buffer = require("./lib/buffer");
module.exports.netw = require("./lib/netw");
module.exports.desc = function() {
	console.log("<<------------ buffer ------------>>");
	console.log(this.buffer.desc);
	console.log("<<------------ netw ------------>>");
	console.log(this.netw.desc);
};