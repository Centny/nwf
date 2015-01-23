var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sio = require('../sio');
var pool = require('../../buffer');
var argv = require('optimist')
	.usage('Usage: $0  -l [listen port] -i [ims server list]')
	.default('l', '3000')
	.default('i', 'http://127.0.0.1:9892/listSrv')
	.demand(['l', 'i'])
	.argv;
/*------*/
app.use(express.static(__dirname + '/../imc/'));
var bp = pool.NewPool(8, 102400);
var ss = sio.NewSIO_j(io.of("/w.io"), bp, argv.i);
ss.H.smsg_v = function(m) {
	m.c = m.c.toString("base64");
	return m;
};
ss.H.rmsg_v = function(m) {
	m.c = new Buffer(m.c, "base64");
	return m;
};
ss.recon();
http.listen(argv.l, function() {
	console.log('listening on *:%d', argv.l);
});