import { StorageAdapter } from './storage-adapter.interface';
import * as Aerospike from 'aerospike';

export class AerospikeAdapter implements StorageAdapter {
  private config;
  private aerospike = Aerospike;
  private client;
  private namespace: string;
  private set: string;

  maxRetries = 5;
  initialRetryDelay = 1000;

  constructor(config: { hosts: string[]; namespace: string; set: string }) {
    this.config = config;
    this.namespace = config.namespace;
    this.set = config.set;
  }

  async connect(): Promise<void> {
    await this.aerospike.connect({
      hosts: this.config.hosts,
    })
    .then(async client => {
      this.client = client;
    })
    .catch(err => console.error(err))
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    this.client = null;
  }

  isConnected(): boolean {
    return this.client ? true : false;
  }

  async rpush(key: string, value: string): Promise<void> {
    const aeroKey = new Aerospike.Key(this.namespace, this.set, key);
    await this.client.operate(aeroKey, [
      Aerospike.lists.append('messages', value),
    ]);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const aeroKey = new Aerospike.Key(this.namespace, this.set, key);
    const result = await this.client.operate(aeroKey, [
      Aerospike.lists.getRange('messages', start, stop - start + 1),
    ]);
    return result.bins.messages as string[];
  }

  async lpop(key: string): Promise<string | null> {
    const aeroKey = new Aerospike.Key(this.namespace, this.set, key);
    try {
      const result = await this.client.operate(aeroKey, [
        Aerospike.lists.removeByIndex('messages', 0, 1),
      ]);
      return result.bins.messages[0] as string;
    } catch (error) {
      if (error.code === Aerospike.status.ERR_BIN_NOT_FOUND || 
          error.code === Aerospike.status.ERR_OP_NOT_APPLICABLE) {
        return null;
      }
      throw error;
    }
  }

  async llen(key: string): Promise<number> {
    const aeroKey = new Aerospike.Key(this.namespace, this.set, key);
    try {
      const result = await this.client.operate(aeroKey, [
        Aerospike.lists.size('messages'),
      ]);
      return result.bins.messages as number;
    } catch (error) {
      if (error.code === Aerospike.status.ERR_BIN_NOT_FOUND) {
        return 0;
      }
      throw error;
    }
  }
}