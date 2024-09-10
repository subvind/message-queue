import { MessageQueueClient } from "../src/index";

const client = new MessageQueueClient('http://localhost:3030', {
  verbose: true
});

async function main() {
  console.log('Creating exchange...');
  await client.createExchange('test-exchange');

  console.log('Binding queue to exchange with different routing key...');
  await client.bind('test-exchange', 'test-queue', 'custom-routing-key');

  console.log('Publishing messages...');
  await client.publish('test-exchange', 'custom-routing-key', 'Test message 1');
  await client.publish('test-exchange', 'custom-routing-key', 'Test message 2');
  await client.publish('test-exchange', 'custom-routing-key', 'Test message 3');

  console.log('Checking queue length...');
  const queueLength = await client.getQueueLength('test-exchange', 'test-queue');
  console.log('Queue length:', queueLength);

  console.log('Consuming messages...');
  for (let i = 0; i < 3; i++) {
    const message = await client.consume('test-exchange', 'test-queue');
    console.log('Consumed message:', message);
  }

  console.log('Connecting WebSocket...');
  await client.connectWebSocket();

  console.log('Subscribing to queue...');
  await client.subscribeToQueue('test-exchange', 'test-queue', (message) => {
    console.log('Received message via WebSocket:', message);
  });

  console.log('Publishing more messages...');
  await client.publish('test-exchange', 'test-queue', 'Test message 4');
  await client.publish('test-exchange', 'test-queue', 'Test message 5');

  // Wait for WebSocket messages
  console.log('Waiting for WebSocket messages...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Disconnecting WebSocket...');
  client.disconnectWebSocket();

  console.log('All operations completed successfully.');
}

main().catch(error => console.error('Error:', error));