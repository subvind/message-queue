import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const baseUrl = 'http://localhost:3030/message-broker';
const wsUrl = 'http://localhost:3030';

async function createExchange(name: string) {
  await axios.post(`${baseUrl}/exchange`, { name });
  console.log(`Exchange '${name}' created`);
}

async function bindQueue(exchange: string, queue: string) {
  await axios.post(`${baseUrl}/bind`, {
    exchange,
    queue,
    routingKey: queue
  });
  console.log(`Queue '${queue}' bound to exchange '${exchange}'`);
}

async function publishMessage(exchange: string, queue: string, message: string) {
  await axios.post(`${baseUrl}/publish`, {
    exchange,
    routingKey: queue,
    message
  });
  console.log(`Published message to exchange '${exchange}', queue '${queue}': ${message}`);
}

function createWebSocketClient(): Promise<Socket> {
  return new Promise((resolve) => {
    const socket = io(wsUrl);
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      resolve(socket);
    });
  });
}

function subscribeToQueue(socket: Socket, exchange: string, queue: string): Promise<void> {
  return new Promise((resolve) => {
    socket.emit('subscribe', { exchange, queue }, (response) => {
      console.log(`Subscription response for ${exchange}/${queue}:`, response);
      resolve();
    });
  });
}

async function testMessageRouting() {
  try {
    // Create exchanges
    await createExchange('exchange1');
    await createExchange('exchange2');

    // Bind queues
    await bindQueue('exchange1', 'queue1');
    await bindQueue('exchange1', 'queue2');
    await bindQueue('exchange2', 'queue3');
    await bindQueue('exchange2', 'queue4');

    // Create WebSocket client
    const socket = await createWebSocketClient();

    // Subscribe to all queues
    await subscribeToQueue(socket, 'exchange1', 'queue1');
    await subscribeToQueue(socket, 'exchange1', 'queue2');
    await subscribeToQueue(socket, 'exchange2', 'queue3');
    await subscribeToQueue(socket, 'exchange2', 'queue4');

    // Set up message listener
    const receivedMessages: { [key: string]: string[] } = {};
    socket.on('message', (data) => {
      const key = `${data.exchange}/${data.queue}`;
      if (!receivedMessages[key]) {
        receivedMessages[key] = [];
      }
      receivedMessages[key].push(data.message);
      console.log(`Received message via WebSocket from ${key}:`, data.message);
    });

    // Publish messages
    await publishMessage('exchange1', 'queue1', 'Message 1 for Queue 1');
    await publishMessage('exchange1', 'queue2', 'Message 1 for Queue 2');
    await publishMessage('exchange2', 'queue3', 'Message 1 for Queue 3');
    await publishMessage('exchange2', 'queue4', 'Message 1 for Queue 4');
    await publishMessage('exchange1', 'queue1', 'Message 2 for Queue 1');
    await publishMessage('exchange1', 'queue2', 'Message 2 for Queue 2');
    await publishMessage('exchange2', 'queue3', 'Message 2 for Queue 3');
    await publishMessage('exchange2', 'queue4', 'Message 2 for Queue 4');
    await publishMessage('exchange1', 'queue1', 'Message 3 for Queue 1');
    await publishMessage('exchange1', 'queue2', 'Message 3 for Queue 2');
    await publishMessage('exchange2', 'queue3', 'Message 3 for Queue 3');
    await publishMessage('exchange1', 'queue1', 'Message 4 for Queue 1');
    await publishMessage('exchange1', 'queue2', 'Message 4 for Queue 2');
    await publishMessage('exchange1', 'queue1', 'Message 5 for Queue 1');

    // Wait for messages to be received
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Print summary of received messages
    console.log('\nSummary of received messages:');
    for (const [key, messages] of Object.entries(receivedMessages)) {
      console.log(`${key}: ${messages.length} message(s)`);
      messages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });
    }

    // Close WebSocket connection
    socket.close();
    console.log('\nMessage routing test completed.');
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testMessageRouting();