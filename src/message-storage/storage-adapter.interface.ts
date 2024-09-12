export interface StorageAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  rpush(key: string, value: string): Promise<void>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  lpop(key: string): Promise<string | null>;
  llen(key: string): Promise<number>;
  maxRetries: number;
  initialRetryDelay: number;
}