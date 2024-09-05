
import { MessageStorageService } from './message-storage.service';

import { Queue } from './queue';

export class Exchange {
  private queues: Map<string, Queue> = new Map();

  constructor(
    private name: string,
    private messageStorage: MessageStorageService
  ) {}

  bind(queueName: string, routingKey: string) {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, new Queue(this.name, queueName, this.messageStorage));
    }
  }

  async publish(routingKey: string, message: any) {
    this.queues.forEach((queue, queueName) => {
      if (queueName === routingKey) {
        queue.enqueue(message);
      }
    });
  }

  async consume(queueName: string): Promise<any> {
    const queue = this.queues.get(queueName);
    if (queue) {
      return await queue.dequeue();
    }
    return null;
  }

  subscribe(queueName: string, callback: (message: any) => void) {
    const queue = this.queues.get(queueName);
    if (queue) {
      queue.subscribe(callback);
    }
  }

  unsubscribe(queueName: string, callback: (message: any) => void) {
    const queue = this.queues.get(queueName);
    if (queue) {
      queue.unsubscribe(callback);
    }
  }
}