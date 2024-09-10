import { MessageQueueClient } from "../src/index";

const client = new MessageQueueClient('http://localhost:3030', {
  verbose: true
});

async function main() {
  console.log('Creating exchange...');
  await client.createExchange('multi-sub-exchange');

  console.log('Binding queues to exchange...');
  await client.bind('multi-sub-exchange', 'queue1', 'routing-key1');
  await client.bind('multi-sub-exchange', 'queue2', 'routing-key2');

  console.log('Connecting WebSocket...');
  await client.connectWebSocket();

  console.log('Subscribing to queues...');
  await client.subscribeToQueue('multi-sub-exchange', 'queue1', (message) => {
    console.log('Received message in queue1:', message);
  });
  await client.subscribeToQueue('multi-sub-exchange', 'queue2', (message) => {
    console.log('Received message in queue2:', message);
  });

  console.log('Publishing messages...');
  await client.publish('multi-sub-exchange', 'routing-key1', 'Message for queue1');
  await client.publish('multi-sub-exchange', 'routing-key2', 'Message for queue2');
  await client.publish('multi-sub-exchange', 'routing-key1', 'Another message for queue1');
  await client.publish('multi-sub-exchange', 'routing-key2', 'Another message for queue2');

  // Wait for WebSocket messages
  console.log('Waiting for WebSocket messages...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('Disconnecting WebSocket...');
  client.disconnectWebSocket();

  console.log('All operations completed successfully.');
}

main().catch(error => console.error('Error:', error));