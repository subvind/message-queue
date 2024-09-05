import axios from 'axios';

async function testConsumer() {
  const baseUrl = 'http://localhost:3000/message-broker';

  try {
    while (true) {
      const response = await axios.get(`${baseUrl}/consume/test-exchange/test-queue`);
      if (response.data.status === 'ok') {
        console.log('Received message:', response.data.message);
      } else {
        console.log('No message available');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before trying again
      }
    }
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testConsumer();
