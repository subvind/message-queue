import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class MessageStorageService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  async onModuleInit() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  private getQueueKey(exchangeName: string, queueName: string): string {
    return `${exchangeName}:${queueName}`;
  }

  async saveMessage(exchangeName: string, queueName: string, message: any): Promise<void> {
    const queueKey = this.getQueueKey(exchangeName, queueName);
    await this.redisClient.rpush(queueKey, JSON.stringify({
      timestamp: Date.now(),
      content: message
    }));
  }

  async getMessages(exchangeName: string, queueName: string, count: number = 1): Promise<any[]> {
    const queueKey = this.getQueueKey(exchangeName, queueName);
    const messages = await this.redisClient.lrange(queueKey, 0, count - 1);
    return messages.map(msg => JSON.parse(msg));
  }

  async removeMessage(exchangeName: string, queueName: string): Promise<any> {
    const queueKey = this.getQueueKey(exchangeName, queueName);
    return JSON.parse(await this.redisClient.lpop(queueKey));
  }

  async getQueueLength(exchangeName: string, queueName: string): Promise<number> {
    const queueKey = this.getQueueKey(exchangeName, queueName);
    return await this.redisClient.llen(queueKey);
  }
}
