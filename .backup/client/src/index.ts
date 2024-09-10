import axios, { AxiosInstance } from 'axios';
import { io, Socket } from 'socket.io-client';

export class MessageQueueClient {
  private axiosInstance: AxiosInstance;
  private socket: Socket | null = null;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async createExchange(name: string): Promise<any> {
    const response = await this.axiosInstance.post('/message-broker/exchange', { name });
    return response.data;
  }

  async bind(exchange: string, queue: string, routingKey: string): Promise<any> {
    const response = await this.axiosInstance.post('/message-broker/bind', { exchange, queue, routingKey });
    return response.data;
  }

  async publish(exchange: string, routingKey: string, message: any): Promise<any> {
    const response = await this.axiosInstance.post('/message-broker/publish', { exchange, routingKey, message });
    return response.data;
  }

  async consume(exchange: string, queue: string): Promise<any> {
    const response = await this.axiosInstance.get(`/message-broker/consume/${exchange}/${queue}`);
    return response.data;
  }

  async getQueueLength(exchange: string, queue: string): Promise<any> {
    const response = await this.axiosInstance.get(`/message-broker/queue-length/${exchange}/${queue}`);
    return response.data;
  }

  connectWebSocket(): Promise<void> {
    return new Promise((resolve) => {
      this.socket = io(this.axiosInstance.defaults.baseURL);
      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        resolve();
      });
    });
  }

  subscribeToQueue(exchange: string, queue: string, callback: (message: any) => void): Promise<void> {
    return new Promise((resolve) => {
      if (!this.socket) {
        throw new Error('WebSocket is not connected. Call connectWebSocket() first.');
      }
      this.socket.emit('subscribe', { exchange, queue }, (response: any) => {
        console.log(`Subscription response for ${exchange}/${queue}:`, response);
        this.socket!.on('message', (data) => {
          if (data.exchange === exchange && data.queue === queue) {
            callback(data.message);
          }
        });
        resolve();
      });
    });
  }

  disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}