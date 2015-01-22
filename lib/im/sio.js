var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
	res.send('<h1>Welcome</h1>');
});


io.on('connection', function(con) {
	con.on('login', function(obj) {});
	con.on('disconnect', function() {});
	con.on('message', function(obj) {});

});

http.listen(3000, function() {
	console.log('listening on *:3000');
});