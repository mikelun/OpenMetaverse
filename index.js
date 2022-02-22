const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var players = {};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.use("/static", express.static('./static/'));

io.on('connection', (socket) => {
    players[socket.id] = {
        rotation: 0,
        x: Math.floor(Math.random() * 700) + 50,
        y: Math.floor(Math.random() * 500) + 50,
        playerId: socket.id,
        team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
    };
    socket.emit('currentPlayers', players);
    // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('disconnect', function () {
        // remove this player from our players object
        delete players[socket.id];
        // emit a message to all players to remove this player
    });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});