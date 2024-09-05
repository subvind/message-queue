import { io } from 'socket.io-client';

const socket = io('http://localhost:3030');

socket.on('connect', () => {
  console.log('Connected to WebSocket server');

  // Subscribe to a queue
  socket.emit('subscribe', { exchange: 'test-exchange', queue: 'test-queue' }, (response) => {
    console.log('Subscription response:', response);
  });

  // Listen for messages
  socket.on('message', (data) => {
    console.log('Received message via WebSocket:', data);
  });
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});

// Keep the script running
setInterval(() => {}, 1000);
