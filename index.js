const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// 🔓 Permitir CORS desde cualquier origen
app.use(cors());

// Crear servidor de WebSocket con CORS habilitado
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
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
app.use(express.static('public'));

// Iniciar el servidor
const port = process.env.PORT || 3000;
server.listen(port, "0.0.0.0", () => {
  console.log(`Servidor de señalización corriendo en http://0.0.0.0:${port}`);
});
