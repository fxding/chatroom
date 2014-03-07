var express = require("express"),
    app = express(),
    server = require("http").createServer(app),
    io = require("socket.io").listen(server),
    socket = require('./routes/socket.js');;

app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));

app.get('*', function (req, rsp) {
    rsp.sendfile(__dirname + '/public/index.html');

});

io.sockets.on('connection', socket);

server.listen(3000); // must http server listen the port.
console.log('Server listen on port: 3000\n');