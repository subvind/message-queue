import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
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
  private logger = new Logger(MessageStorageService.name);
  private maxRetries = 5;
  private initialRetryDelay = 1000; // 1 second
  private reconnectionInterval: NodeJS.Timeout;

  constructor() {
    this.storageType = (process.env.STORAGE_TYPE as StorageType) || 'isdb';
    if (this.storageType === 'isdb') {
      this.isdbDatabase = Number(process.env.ISDB_DATABASE || '1');
      this.isdbUsername = process.env.ISDB_USERNAME || 'root';
      this.isdbPassword = process.env.ISDB_PASSWORD || 'root';
    }
  }

  async onModuleInit() {
    await this.connectWithRetry();
    this.startReconnectionInterval();
  }

  private startReconnectionInterval() {
    this.reconnectionInterval = setInterval(async () => {
      if (!this.isConnected()) {
        this.logger.warn('Connection lost. Attempting to reconnect...');
        await this.connectWithRetry();
      }
    }, 5000); // Check connection every 5 seconds
  }

  private isConnected(): boolean {
    if (this.storageType === 'isdb') {
      return this.isdbClient && this.isdbClient.isConnected();
    } else {
      return this.redisClient && this.redisClient.status === 'ready';
    }
  }

  private async connectWithRetry(retryCount = 0): Promise<void> {
    try {
      if (this.storageType === 'isdb') {
        this.isdbClient = new DatabaseClient('http://localhost:6969');
        await this.isdbClient.createUser(this.isdbUsername, this.isdbPassword);
        await this.isdbClient.login(this.isdbUsername, this.isdbPassword);
        await this.isdbClient.assignUserToDatabase(1);
      } else {
        this.redisClient = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        });
      }
      this.logger.log('Successfully connected to the database');
    } catch (error) {
      if (retryCount < this.maxRetries) {
        const delay = this.initialRetryDelay * Math.pow(2, retryCount);
        this.logger.warn(`Failed to connect. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.connectWithRetry(retryCount + 1);
      } else {
        this.logger.error('Max retries reached. Unable to connect to the database.');
        // Instead of throwing, we'll log the error and allow the reconnection interval to handle it
        this.logger.error(error);
      }
    }
  }

  async onModuleDestroy() {
    clearInterval(this.reconnectionInterval);
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

    try {
      if (this.storageType === 'isdb') {
        await this.isdbClient.rpush(this.isdbDatabase, queueKey, [messageData]);
      } else {
        await this.redisClient.rpush(queueKey, messageData);
      }
    } catch (error) {
      this.logger.error(`Failed to save message: ${error.message}`);
      // Instead of immediately retrying, we'll allow the reconnection interval to handle it
    }
  }

  async getMessages(exchangeName: string, queueName: string, count: number = 1): Promise<any[]> {
    const queueKey = this.getQueueKey(exchangeName, queueName);
    try {
      let messages: string[];
      if (this.storageType === 'isdb') {
        messages = await this.isdbClient.lrange(this.isdbDatabase, queueKey, 0, count - 1);
      } else {
        messages = await this.redisClient.lrange(queueKey, 0, count - 1);
      }
      return messages.map(msg => JSON.parse(msg));
    } catch (error) {
      this.logger.error(`Failed to get messages: ${error.message}`);
      return [];
    }
  }

  async removeMessage(exchangeName: string, queueName: string): Promise<any> {
    const queueKey = this.getQueueKey(exchangeName, queueName);
    try {
      let message: string;
      if (this.storageType === 'isdb') {
        message = await this.isdbClient.lpop(this.isdbDatabase, queueKey);
      } else {
        message = await this.redisClient.lpop(queueKey);
      }
      return message ? JSON.parse(message) : null;
    } catch (error) {
      this.logger.error(`Failed to remove message: ${error.message}`);
      return null;
    }
  }

  async getQueueLength(exchangeName: string, queueName: string): Promise<number> {
    const queueKey = this.getQueueKey(exchangeName, queueName);
    try {
      if (this.storageType === 'isdb') {
        return await this.isdbClient.llen(this.isdbDatabase, queueKey);
      } else {
        return await this.redisClient.llen(queueKey);
      }
    } catch (error) {
      this.logger.error(`Failed to get queue length: ${error.message}`);
      return 0;
    }
  }
}