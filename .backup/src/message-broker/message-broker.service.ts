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
    const exchange = new Exchange(name, this.messageStorage);
    this.exchanges.set(name, exchange);
    return exchange;
  }

  getExchange(name: string): Exchange | undefined {
    return this.exchanges.get(name);
  }

  async publish(exchangeName: string, routingKey: string, message: any): Promise<boolean> {
    const exchange = this.getExchange(exchangeName);
    if (exchange) {
      await exchange.publish(routingKey, message);
      this.eventEmitter.emit('message', exchangeName, routingKey, message);
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

  subscribe(exchangeName: string, queueName: string, callback: (message: any) => void): boolean {
    const exchange = this.getExchange(exchangeName);
    if (exchange) {
      exchange.subscribe(queueName, callback);
      return true;
    }
    return false;
  }

  unsubscribe(exchangeName: string, queueName: string, callback: (message: any) => void): boolean {
    const exchange = this.getExchange(exchangeName);
    if (exchange) {
      exchange.unsubscribe(queueName, callback);
      return true;
    }
    return false;
  }

  async getQueueLength(exchangeName: string, queueName: string): Promise<number> {
    return await this.messageStorage.getQueueLength(exchangeName, queueName);
  }

  onMessage(callback: (exchange: string, queue: string, message: any) => void) {
    this.eventEmitter.on('message', callback);
  }
}