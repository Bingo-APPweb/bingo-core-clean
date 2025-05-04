const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
  res.send('BingoCore rodando!');
});

let availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
let drawnNumbers = [];

function drawNumber() {
  if (availableNumbers.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * availableNumbers.length);
  const number = availableNumbers[randomIndex];
  availableNumbers.splice(randomIndex, 1);
  drawnNumbers.push(number);
  return number;
}

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  socket.emit('drawnNumbers', drawnNumbers);

  socket.on('draw', () => {
    const number = drawNumber();
    if (number !== null) {
      io.emit('newNumber', number);
      console.log(`Número sorteado: ${number}`);
    } else {
      io.emit('gameOver', 'Todos os números foram sorteados!');
      console.log('Jogo encerrado: todos os números foram sorteados.');
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});