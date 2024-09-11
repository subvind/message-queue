import { Logger } from '@nestjs/common';
import { MessageQueueClient } from '../client/src/index';

const logger = new Logger('MessageQueueBenchmark');

const BASE_URL = 'http://localhost:3030';

function generateMessage(size: number): string {
  return 'x'.repeat(size);
}

async function runBenchmark(messageSize: number, numMessages: number): Promise<{ messageSize: number; throughput: number }> {
  const exchange = 'benchmark_exchange';
  const routingKey = 'benchmark_key';
  const queue = 'benchmark_queue';

  console.log(`Starting e2e benchmark with message size ${messageSize} bytes and ${numMessages} messages`);

  const client = new MessageQueueClient(BASE_URL, { verbose: false });

  try {
    await client.createExchange(exchange);
    await client.bind(exchange, queue, routingKey);
    console.log('Exchange created and queue bound');

    await client.connectWebSocket();
    console.log('WebSocket connected');

    let received = 0;
    const startTime = Date.now();
    let throughput = 0;

    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 30000); // 30 seconds timeout
    });

    const benchmarkPromise = new Promise<void>((resolve) => {
      client.subscribeToQueue(exchange, queue, (message) => {
        received++;
        if (received === numMessages) {
          resolve();
        }
      });
    });

    const message = generateMessage(messageSize);
    for (let i = 0; i < numMessages + 1; i++) {
      await client.publish(exchange, routingKey, message);
      if ((i + 1) % 100 === 0) {
        console.log(`Published ${i + 1} messages`);
      }
    }

    console.log(`Finished publishing ${numMessages} messages`);

    await Promise.race([benchmarkPromise, timeoutPromise]);

    const endTime = Date.now();
    const duration = endTime - startTime;
    throughput = (received / duration) * 1000;

    console.log(`E2E Benchmark Results:`);
    console.log(`  Message Size: ${messageSize} bytes`);
    console.log(`  Number of Messages: ${numMessages}`);
    console.log(`  Messages Received: ${received}`);
    console.log(`  Total Duration: ${duration}ms`);
    console.log(`  Throughput: ${throughput.toFixed(2)} messages/second`);

    return { messageSize, throughput };

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

async function runAllBenchmarks(): Promise<void> {
  const messageSizes = [1, 100, 1000, 10000, 100000];
  const numMessages = 1000;

  console.log('Starting all e2e benchmarks');

  const results: { messageSize: number; throughput: number }[] = [];

  for (const size of messageSizes) {
    try {
      const result = await runBenchmark(size, numMessages);
      results.push(result);
      // Add a delay between benchmarks to allow for proper cleanup
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Failed to run e2e benchmark with size ${size}: ${error.message}`);
    }
  }

  console.log('All e2e benchmarks completed');

  // Output summary
  console.log('\nBenchmark Summary:');
  console.log('------------------');
  results.forEach(({ messageSize, throughput }) => {
    console.log(`Message Size: ${messageSize} bytes, Throughput: ${throughput.toFixed(2)} messages/second`);
  });

  const averageThroughput = results.reduce((sum, { throughput }) => sum + throughput, 0) / results.length;
  console.log(`\nAverage Throughput: ${averageThroughput.toFixed(2)} messages/second`);
}

runAllBenchmarks().catch((error) => {
  console.error('E2E Benchmark error:', error);
  process.exit(1);
});