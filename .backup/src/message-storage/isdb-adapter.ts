import { StorageAdapter } from './storage-adapter.interface';
import { DatabaseClient } from 'database-client';

export class IsdbAdapter implements StorageAdapter {
  private client: DatabaseClient;
  private database: number;
  private username: string;
  private password: string;

  maxRetries = 5;
  initialRetryDelay = 1000;

  constructor(config: { database: number; username: string; password: string }) {
    this.database = config.database;
    this.username = config.username;
    this.password = config.password;
  }

  async connect(): Promise<void> {
    this.client = new DatabaseClient('http://localhost:6969');
    await this.client.createUser(this.username, this.password);
    await this.client.login(this.username, this.password);
    await this.client.assignUserToDatabase(this.database);
  }

  async disconnect(): Promise<void> {
    // Implement disconnect if needed
  }

  isConnected(): boolean {
    return this.client ? true : false;
  }

  async rpush(key: string, value: string): Promise<void> {
    await this.client.rpush(this.database, key, [value]);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.lrange(this.database, key, start, stop);
  }

  async lpop(key: string): Promise<string | null> {
    return await this.client.lpop(this.database, key);
  }

  async llen(key: string): Promise<number> {
    return await this.client.llen(this.database, key);
  }
}