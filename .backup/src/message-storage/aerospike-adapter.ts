import { StorageAdapter } from './storage-adapter.interface';
import Aerospike from 'aerospike';

export class AerospikeAdapter implements StorageAdapter {
  private client: Aerospike.Client;
  private namespace: string;
  private set: string;

  maxRetries = 5;
  initialRetryDelay = 1000;

  constructor(config: { hosts: string[]; namespace: string; set: string }) {
    this.client = Aerospike.client({
      hosts: config.hosts,
    });
    this.namespace = config.namespace;
    this.set = config.set;
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  isConnected(): boolean {
    return this.client.isConnected();
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
        Aerospike.lists.popLeft('messages', 1),
      ]);
      return result.bins.messages[0] as string;
    } catch (error) {
      if (error.code === Aerospike.status.ERR_BIN_NOT_FOUND) {
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