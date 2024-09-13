import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { StorageAdapter } from './storage-adapter.interface';
import { IsdbAdapter } from './isdb-adapter';
import { RedisAdapter } from './redis-adapter';
import { AerospikeAdapter } from './aerospike-adapter';
import { protocol } from 'socket.io-client';

type StorageType = 'isdb' | 'redis' | 'asd';

@Injectable()
export class MessageStorageService implements OnModuleInit, OnModuleDestroy {
  private storageAdapter: StorageAdapter;
  private logger = new Logger(MessageStorageService.name);
  private reconnectionInterval: NodeJS.Timeout;

  constructor() {
    const storageType = (process.env.STORAGE_TYPE as StorageType) || 'asd';
    this.storageAdapter = this.createStorageAdapter(storageType);
  }

  private createStorageAdapter(storageType: StorageType): StorageAdapter {
    let asdHosts;
    if (process.env.AEROSPIKE_HOSTS) {
      asdHosts = JSON.parse(process.env.AEROSPIKE_HOSTS);
    } else {
      asdHosts = [
        {
          protocol: 'http',
          addr: '127.0.0.1',
          port: 4242
        }
      ];
    }
    console.log('storageType', storageType);
    switch (storageType) {
      case 'isdb':
        return new IsdbAdapter({
          database: Number(process.env.ISDB_DATABASE || '1'),
          username: process.env.ISDB_USERNAME || 'root',
          password: process.env.ISDB_PASSWORD || 'root',
        });
      case 'redis':
        return new RedisAdapter({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        });
      case 'asd':
        return new AerospikeAdapter({
          hosts: asdHosts,
          namespace: process.env.AEROSPIKE_NAMESPACE || 'test',
          set: process.env.AEROSPIKE_SET || 'message-queue'
        });
      default:
        throw new Error(`Unsupported storage type: ${storageType}`);
    }
  }

  async onModuleInit() {
    await this.connectWithRetry();
    this.startReconnectionInterval();
  }

  private startReconnectionInterval() {
    this.reconnectionInterval = setInterval(async () => {
      if (!this.storageAdapter.isConnected()) {
        this.logger.warn('Connection lost. Attempting to reconnect...');
        await this.connectWithRetry();
      }
    }, 5000);
  }

  private async connectWithRetry(retryCount = 0): Promise<void> {
    try {
      await this.storageAdapter.connect();
      this.logger.log('Successfully connected to the database');
    } catch (error) {
      if (retryCount < this.storageAdapter.maxRetries) {
        const delay = this.storageAdapter.initialRetryDelay * Math.pow(2, retryCount);
        this.logger.warn(`Failed to connect. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.connectWithRetry(retryCount + 1);
      } else {
        this.logger.error('Max retries reached. Unable to connect to the database.');
        this.logger.error(error);
      }
    }
  }

  async onModuleDestroy() {
    clearInterval(this.reconnectionInterval);
    await this.storageAdapter.disconnect();
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
      await this.storageAdapter.rpush(queueKey, messageData);
    } catch (error) {
      this.logger.error(`Failed to save message: ${error.message}`);
    }
  }

  async getMessages(exchangeName: string, queueName: string, count: number = 1): Promise<any[]> {
    const queueKey = this.getQueueKey(exchangeName, queueName);
    try {
      const messages = await this.storageAdapter.lrange(queueKey, 0, count - 1);
      return messages.map(msg => JSON.parse(msg));
    } catch (error) {
      this.logger.error(`Failed to get messages: ${error.message}`);
      return [];
    }
  }

  async removeMessage(exchangeName: string, queueName: string): Promise<any> {
    const queueKey = this.getQueueKey(exchangeName, queueName);
    try {
      const message = await this.storageAdapter.lpop(queueKey);
      return message ? JSON.parse(message) : null;
    } catch (error) {
      this.logger.error(`Failed to remove message: ${error.message}`);
      return null;
    }
  }

  async getQueueLength(exchangeName: string, queueName: string): Promise<number> {
    const queueKey = this.getQueueKey(exchangeName, queueName);
    try {
      return await this.storageAdapter.llen(queueKey);
    } catch (error) {
      this.logger.error(`Failed to get queue length: ${error.message}`);
      return 0;
    }
  }
}