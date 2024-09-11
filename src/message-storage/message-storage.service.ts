import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { DatabaseClient } from 'database-client';

type StorageType = 'isdb' | 'redis';

@Injectable()
export class MessageStorageService implements OnModuleInit, OnModuleDestroy {
  private isdbClient: DatabaseClient;
  private isdbDatabase: number;
  private isdbUsername: string;
  private isdbPassword: string;
  private redisClient: Redis;
  private storageType: StorageType;

  constructor() {
    this.storageType = (process.env.STORAGE_TYPE as StorageType) || 'isdb';
    if (this.storageType === 'isdb') {
      this.isdbDatabase = Number(process.env.ISDB_DATABASE || '1');
      this.isdbUsername = process.env.ISDB_USERNAME || 'root';
      this.isdbPassword = process.env.ISDB_PASSWORD || 'root';
    }
  }

  async onModuleInit() {
    if (this.storageType === 'isdb') {
      this.isdbClient = new DatabaseClient('http://localhost:6969');
      await this.isdbClient.createUser(this.isdbUsername, this.isdbPassword);
      await this.isdbClient.login(this.isdbUsername, this.isdbPassword);
      await this.isdbClient.assignUserToDatabase(1)

    } else {
      this.redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      });
    }
  }

  async onModuleDestroy() {
    if (this.storageType === 'redis') {
      await this.redisClient.quit();
    }
  }

  private getQueueKey(exchangeName: string, queueName: string): string {
    return `${exchangeName}:${queueName}`;
  }

  async saveMessage(exchangeName: string, queueName: string, message: any): Promise<void> {
    const queueKey = this.getQueueKey(exchangeName, queueName);
    const messageData = JSON.stringify({
      timestamp: Date.now(),
      content: message
    });

    if (this.storageType === 'isdb') {
      await this.isdbClient.rpush(this.isdbDatabase, queueKey, [messageData]);
    } else {
      await this.redisClient.rpush(queueKey, messageData);
    }
  }

  async getMessages(exchangeName: string, queueName: string, count: number = 1): Promise<any[]> {
    const queueKey = this.getQueueKey(exchangeName, queueName);
    let messages: string[];

    if (this.storageType === 'isdb') {
      messages = await this.isdbClient.lrange(this.isdbDatabase, queueKey, 0, count - 1);
    } else {
      messages = await this.redisClient.lrange(queueKey, 0, count - 1);
    }

    return messages.map(msg => JSON.parse(msg));
  }

  async removeMessage(exchangeName: string, queueName: string): Promise<any> {
    // console.log('removeMessage', exchangeName, queueName);
    const queueKey = this.getQueueKey(exchangeName, queueName);
    let message: string;

    if (this.storageType === 'isdb') {
      message = await this.isdbClient.lpop(this.isdbDatabase, queueKey);
    } else {
      message = await this.redisClient.lpop(queueKey);
      if (message) {
        message = JSON.parse(message);
      }
    }

    return message;
  }

  async getQueueLength(exchangeName: string, queueName: string): Promise<number> {
    const queueKey = this.getQueueKey(exchangeName, queueName);

    if (this.storageType === 'isdb') {
      return await this.isdbClient.llen(this.isdbDatabase, queueKey);
    } else {
      return await this.redisClient.llen(queueKey);
    }
  }
}