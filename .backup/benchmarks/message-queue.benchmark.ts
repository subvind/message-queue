import { Logger } from '@nestjs/common';
import { MessageQueueClient } from '../client/src/index';

const logger = new Logger('MessageQueueBenchmark');

const BASE_URL = 'http://localhost:3030'; // Assuming your NestJS server runs on port 3030

function generateMessage(size: number): string {
  return 'x'.repeat(size);
}

async function runBenchmark(messageSize: number, numMessages: number) {
  const exchange = 'benchmark_exchange';
  const routingKey = 'benchmark_key';
  const queue = 'benchmark_queue';

  console.log(`Starting e2e benchmark with message size ${messageSize} bytes and ${numMessages} messages`);

  const client = new MessageQueueClient(BASE_URL, { verbose: false });

  try {
    // Create exchange and bind queue
    await client.createExchange(exchange);
    await client.bind(exchange, queue, routingKey);
    console.log('Exchange created and queue bound');

    return new Promise<void>(async (resolve, reject) => {
      const message = generateMessage(messageSize);
      let received = 0;
      let published = 0;
      const startTime = Date.now();

      // Set up consumer
      try {
        await client.connectWebSocket();
        await client.subscribeToQueue(exchange, queue, () => {
          received++;
          if (received === numMessages) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            const throughput = (numMessages / duration) * 1000;
            console.log(`E2E Benchmark Results:`);
            console.log(`  Message Size: ${messageSize} bytes`);
            console.log(`  Number of Messages: ${numMessages}`);
            console.log(`  Total Duration: ${duration}ms`);
            console.log(`  Throughput: ${throughput.toFixed(2)} messages/second`);
            resolve();
          }
        });
        console.log('Consumer set up successfully');
      } catch (error) {
        console.error(`Error setting up consumer: ${error.message}`);
        reject(error);
        return;
      }

      // Start publisher
      const publishInterval = setInterval(async () => {
        if (published < numMessages) {
          try {
            await client.publish(exchange, routingKey, message);
            published++;
            if (published % 100 === 0) {
              console.log(`Published ${published} messages`);
            }
          } catch (error) {
            console.error(`Error publishing message: ${error.message}`);
            clearInterval(publishInterval);
            reject(error);
          }
        } else {
          clearInterval(publishInterval);
          console.log(`Finished publishing ${numMessages} messages`);
        }
      }, 10); // Publish a message every 10ms

      // Set a timeout in case the benchmark takes too long
      setTimeout(() => {
        clearInterval(publishInterval);
        reject(new Error(`Benchmark timed out after ${60000}ms`));
      }, 60000);
    });
  } catch (error) {
    console.error(`Error in e2e benchmark: ${error.message}`);
    if (error.stack) {
      console.error(`Stack trace: ${error.stack}`);
    }
    throw error;
  } finally {
    client.disconnectWebSocket();
    console.log('Disconnected from WebSocket');
  }
}

async function runAllBenchmarks() {
  const messageSizes = [10, 100, 1000];
  const numMessages = 500;

  console.log('Starting all e2e benchmarks');

  for (const size of messageSizes) {
    try {
      await runBenchmark(size, numMessages);
      // Add a delay between benchmarks to allow for proper cleanup
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Failed to run e2e benchmark with size ${size}: ${error.message}`);
    }
  }

  console.log('All e2e benchmarks completed');
}

runAllBenchmarks().catch((error) => {
  console.error('E2E Benchmark error:', error);
  process.exit(1);
});