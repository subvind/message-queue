import { Injectable } from '@nestjs/common';
import { MessageStorageService } from '../message-storage/message-storage.service';
import { Exchange } from '../exchange/exchange';
import { EventEmitter } from 'events';

@Injectable()
export class MessageBrokerService {
  private exchanges: Map<string, Exchange> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();

  constructor(private messageStorage: MessageStorageService) {}

  createExchange(name: string): Exchange {
    if (!this.exchanges.has(name)) {
      const exchange = new Exchange(name, this.messageStorage);
      this.exchanges.set(name, exchange);
      return exchange;
    }
    return this.exchanges.get(name);
  }

  getExchange(name: string): Exchange | undefined {
    return this.exchanges.get(name);
  }

  async publish(exchangeName: string, routingKey: string, message: any): Promise<boolean> {
    const exchange = this.getExchange(exchangeName);
    if (exchange) {
      await exchange.publish(routingKey, message);
      this.eventEmitter.emit('message', exchangeName, routingKey, message);
      console.log(`Published message to ${exchangeName}/${routingKey}:`, message);
      return true;
    }
    return false;
  }

  async consume(exchangeName: string, queueName: string): Promise<any> {
    const exchange = this.getExchange(exchangeName);
    if (exchange) {
      return await exchange.consume(queueName);
    }
    return null;
  }

  bind(exchangeName: string, queueName: string, routingKey: string): boolean {
    const exchange = this.getExchange(exchangeName);
    if (exchange) {
      exchange.bind(queueName, routingKey);
      return true;
    }
    return false;
  }

  subscribe(exchangeName: string, routingKey: string, callback: (message: any) => void): boolean {
    console.log(`Subscribing to ${exchangeName}/${routingKey}`);
    const exchange = this.getExchange(exchangeName);
    if (exchange) {
      exchange.subscribe(routingKey, callback);
      return true;
    }
    return false;
  }

  unsubscribe(exchangeName: string, routingKey: string, callback: (message: any) => void): boolean {
    const exchange = this.getExchange(exchangeName);
    if (exchange) {
      exchange.unsubscribe(routingKey, callback);
      return true;
    }
    return false;
  }

  async getQueueLength(exchangeName: string, queueName: string): Promise<number> {
    const exchange = this.getExchange(exchangeName);
    if (exchange) {
      return await exchange.getQueueLength(queueName);
    }
    return 0;
  }

  onMessage(callback: (exchange: string, queue: string, message: any) => void) {
    this.eventEmitter.on('message', callback);
  }
}