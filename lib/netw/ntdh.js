//net tick distribute handler.
function NTDH(h) {
	this.H = h;
}
NTDH.prototype.OnCmd = function(c) {
	var self = this;
	process.nextTick(function() {
		self.H.OnCmd(c);
	});
};

module.exports = {};
module.exports.NewNTDH = function(h) {
	return new NTDH(h);
};