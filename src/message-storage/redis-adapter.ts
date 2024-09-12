import { StorageAdapter } from './storage-adapter.interface';
import Redis from 'ioredis';

export class RedisAdapter implements StorageAdapter {
  private client: Redis;

  maxRetries = 5;
  initialRetryDelay = 1000;

  constructor(config: { host: string; port: number }) {
    this.client = new Redis(config);
  }

  async connect(): Promise<void> {
    // Redis client automatically connects when created
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  isConnected(): boolean {
    return this.client.status === 'ready';
  }

  async rpush(key: string, value: string): Promise<void> {
    await this.client.rpush(key, value);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.lrange(key, start, stop);
  }

  async lpop(key: string): Promise<string | null> {
    return await this.client.lpop(key);
  }

  async llen(key: string): Promise<number> {
    return await this.client.llen(key);
  }
}