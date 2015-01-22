var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sio = require('../sio');
var pool = require('../../buffer');

app.get('/', function(req, res) {
	res.send('<h1>Welcome</h1>');
});
var port = 9891;
var host = '127.0.0.1';
var bp = pool.NewPool(8, 102400);
var ss = sio.NewSIO_j(io, bp, port, host);
ss.recon();
http.listen(3000, function() {
	console.log('listening on *:3000');
});