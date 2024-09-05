import axios from 'axios';

async function testProducer() {
  const baseUrl = 'http://localhost:3000/message-broker';

  try {
    // Create an exchange
    await axios.post(`${baseUrl}/exchange`, { name: 'test-exchange' });
    console.log('Exchange created');

    // Bind a queue to the exchange
    await axios.post(`${baseUrl}/bind`, {
      exchange: 'test-exchange',
      queue: 'test-queue',
      routingKey: 'test-queue'
    });
    console.log('Queue bound to exchange');

    // Publish messages
    for (let i = 0; i < 5; i++) {
      await axios.post(`${baseUrl}/publish`, {
        exchange: 'test-exchange',
        routingKey: 'test-queue',
        message: `Test message ${i + 1}`
      });
      console.log(`Published message ${i + 1}`);
    }

    // Get queue length
    const response = await axios.get(`${baseUrl}/queue-length/test-exchange/test-queue`);
    console.log(`Queue length: ${response.data.length}`);

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testProducer();
