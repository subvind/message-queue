import { EventEmitter } from 'events';
import { MessageStorageService } from './message-storage.service';

export class Queue {
  private eventEmitter = new EventEmitter();

  constructor(
    private exchangeName: string,
    private queueName: string,
    private messageStorage: MessageStorageService
  ) {}

  async enqueue(message: any) {
    await this.messageStorage.saveMessage(this.exchangeName, this.queueName, message);
    this.eventEmitter.emit('message', message);
  }

  async dequeue(): Promise<any> {
    const message = await this.messageStorage.removeMessage(this.exchangeName, this.queueName);
    if (message) {
      return message.content;
    }
    
    return new Promise((resolve) => {
      this.eventEmitter.once('message', async (newMessage) => {
        await this.messageStorage.removeMessage(this.exchangeName, this.queueName);
        resolve(newMessage);
      });
    });
  }

  subscribe(callback: (message: any) => void) {
    this.eventEmitter.on('message', callback);
  }

  unsubscribe(callback: (message: any) => void) {
    this.eventEmitter.off('message', callback);
  }
}
