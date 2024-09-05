import axios from 'axios';

const baseUrl = 'http://localhost:3030/message-broker';

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

async function consumeMessage(exchange: string, queue: string): Promise<string | null> {
  try {
    const response = await axios.get(`${baseUrl}/consume/${exchange}/${queue}`);
    if (response.data.status === 'ok') {
      return response.data.message;
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
  return null;
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

    // Publish messages
    await publishMessage('exchange1', 'queue1', 'Message 1 for Queue 1');
    await publishMessage('exchange1', 'queue2', 'Message 1 for Queue 2');
    await publishMessage('exchange2', 'queue3', 'Message 1 for Queue 3');
    await publishMessage('exchange2', 'queue4', 'Message 1 for Queue 4');
    await publishMessage('exchange1', 'queue1', 'Message 2 for Queue 1');
    await publishMessage('exchange1', 'queue2', 'Message 2 for Queue 2');
    await publishMessage('exchange2', 'queue3', 'Message 2 for Queue 3');
    await publishMessage('exchange2', 'queue4', 'Message 2 for Queue 4');

    // Consume and verify messages
    const queues = [
      { exchange: 'exchange1', queue: 'queue1' },
      { exchange: 'exchange1', queue: 'queue2' },
      { exchange: 'exchange2', queue: 'queue3' },
      { exchange: 'exchange2', queue: 'queue4' },
    ];

    for (const { exchange, queue } of queues) {
      console.log(`\nAttempting to consume messages from ${exchange}/${queue}:`);
      let message;
      let messageCount = 0;
      while ((message = await consumeMessage(exchange, queue)) !== null) {
        console.log(`Received: ${message}`);
        messageCount++;
      }
      if (messageCount === 0) {
        console.log(`No messages found in ${exchange}/${queue}`);
      } else {
        console.log(`Consumed ${messageCount} message(s) from ${exchange}/${queue}`);
      }
    }

    console.log('\nMessage routing test completed.');
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testMessageRouting();