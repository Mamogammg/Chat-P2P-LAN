const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  path: '/data', // Socket.IO servirá desde /data
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Servir index.html desde /public al visitar /
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

let peers = {};

io.on('connection', (socket) => {
  console.log('Nuevo peer conectado:', socket.id);

  socket.on('register', (peerId) => {
    peers[peerId] = socket.id;
    io.emit('peers', Object.keys(peers));
  });

  socket.on('disconnect', () => {
    for (let peerId in peers) {
      if (peers[peerId] === socket.id) {
        delete peers[peerId];
        break;
      }
    }
    io.emit('peers', Object.keys(peers));
  });

  socket.on('signal', (data) => {
    const { to, signal } = data;
    const targetSocketId = peers[to];
    const fromSocketId = Object.keys(peers).find(k => peers[k] === socket.id);
    if (targetSocketId) {
      io.to(targetSocketId).emit('signal', {
        from: fromSocketId,
        signal: signal,
      });
    }
  });
});

// Servir archivos estáticos opcionalmente
//app.use(express.static('public'));

// Iniciar el servidor
const port = process.env.PORT || 3000;
server.listen(port, "0.0.0.0", () => {
  console.log(`Servidor de señalización corriendo en http://0.0.0.0:${port}`);
});
