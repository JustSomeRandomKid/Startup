const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let waitingUser = null;

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('findPartner', (offer) => {
    if (waitingUser) {
      io.to(waitingUser).emit('offer', offer);
      waitingUser = null;
    } else {
      waitingUser = socket.id;
    }
  });

  socket.on('answer', (answer) => {
    io.emit('answer', answer);
  });

  socket.on('candidate', (candidate) => {
    io.emit('candidate', candidate);
  });

  socket.on('disconnectCall', () => {
    io.emit('disconnectCall');
  });

  socket.on('disconnect', () => {
    if (waitingUser === socket.id) {
      waitingUser = null;
    }
  });
});

server.listen(5000, () => console.log('Server running on port 5000'));
