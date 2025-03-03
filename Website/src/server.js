const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let waitingUsers = [];
const activePairs = new Map();

const logWaitingUsers = () => {
  console.log("Waiting users:", waitingUsers);
};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  logWaitingUsers();

  socket.on("findPartner", (offer) => {
    if (waitingUsers.length > 0) {
      const partnerSocketId = waitingUsers.shift();
      activePairs.set(socket.id, partnerSocketId);
      activePairs.set(partnerSocketId, socket.id);
      // Forward the received offer
      io.to(partnerSocketId).emit("offer", offer);
      logWaitingUsers();
    } else {
      waitingUsers.push(socket.id);
      logWaitingUsers();
    }
  });

  socket.on("answer", (answer) => {
    const partnerSocketId = activePairs.get(socket.id);
    if (partnerSocketId) io.to(partnerSocketId).emit("answer", answer);
  });

  socket.on("candidate", (candidate) => {
    const partnerSocketId = activePairs.get(socket.id);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit("candidate", candidate);
    }
  });

  socket.on("disconnectCall", () => {
    const partnerSocketId = activePairs.get(socket.id);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit("disconnectCall");
      activePairs.delete(socket.id);
      activePairs.delete(partnerSocketId);
    }
    waitingUsers = waitingUsers.filter((id) => id !== socket.id);
    logWaitingUsers();
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    waitingUsers = waitingUsers.filter((id) => id !== socket.id);
    logWaitingUsers();
  });
});

server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
