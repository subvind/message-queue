import { MessageStorageService } from '../message-storage/message-storage.service';
import { Queue } from '../queue/queue';

export class Exchange {
  private queues: Map<string, Queue> = new Map();
  private bindings: Map<string, Set<string>> = new Map();
  private subscriptions: Map<string, Set<(message: any) => void>> = new Map();

  constructor(
    private name: string,
    private messageStorage: MessageStorageService
  ) {}

  bind(queueName: string, routingKey: string) {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, new Queue(this.name, queueName, this.messageStorage));
    }
    if (!this.bindings.has(routingKey)) {
      this.bindings.set(routingKey, new Set());
    }
    this.bindings.get(routingKey).add(queueName);
  }

  async publish(routingKey: string, message: any) {
    const boundQueues = this.bindings.get(routingKey) || new Set();
    for (const queueName of boundQueues) {
      const queue = this.queues.get(queueName);
      if (queue) {
        await queue.enqueue(message);
      }
    }
    
    // Notify subscribers
    const subscribers = this.subscriptions.get(routingKey) || new Set();
    subscribers.forEach(callback => callback(message));
  }

  async consume(queueName: string): Promise<any> {
    const queue = this.queues.get(queueName);
    if (queue) {
      return await queue.dequeue();
    }
    return null;
  }

  subscribe(routingKey: string, callback: (message: any) => void) {
    if (!this.subscriptions.has(routingKey)) {
      this.subscriptions.set(routingKey, new Set());
    }
    this.subscriptions.get(routingKey).add(callback);
  }

  unsubscribe(routingKey: string, callback: (message: any) => void) {
    const subscribers = this.subscriptions.get(routingKey);
    if (subscribers) {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscriptions.delete(routingKey);
      }
    }
  }

  async getQueueLength(queueName: string): Promise<number> {
    return await this.messageStorage.getQueueLength(this.name, queueName);
  }
}