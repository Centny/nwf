var argv = require('optimist')
	.usage('Usage: $0  -l [listen port] -h [im host] -p [im port] -t [im token]')
	.default('h', '127.0.0.1')
	.default('t', 'abc')
	.demand(['l', 'h', 'p', 't'])
	.argv;
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sio = require('../sio');
var pool = require('../../buffer');
app.get('/', function(req, res) {
	res.send('<h1>Welcome</h1>');
});
var port = argv.p;
var host = argv.h;
var bp = pool.NewPool(8, 102400);
var ss = sio.NewSIO_j(io, bp, port, host, {
	token: argv.t,
});
ss.recon();
http.listen(argv.l, function() {
	console.log('listening on *:%d', argv.l);
});