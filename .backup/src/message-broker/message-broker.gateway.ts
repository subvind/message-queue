import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageBrokerService } from './message-broker.service';

@WebSocketGateway()
export class MessageBrokerGateway {
  @WebSocketServer()
  server: Server;

  private subscriptions: Map<string, Set<Socket>> = new Map();

  constructor(private readonly messageBrokerService: MessageBrokerService) {
    this.subscribeToAllExchanges();
  }

  private subscribeToAllExchanges() {
    this.messageBrokerService.onMessage((exchange, queue, message) => {
      // console.log(`Received message for ${exchange}/${queue}:`, message);
      const subscriptionKey = `${exchange}:${queue}`;
      const subscribers = this.subscriptions.get(subscriptionKey);
      if (subscribers) {
        subscribers.forEach(subscriber => {
          subscriber.emit('message', { exchange, queue, message });
        });
      }
    });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { exchange: string; queue: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { exchange, queue } = data;
    const subscriptionKey = `${exchange}:${queue}`;

    if (!this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.set(subscriptionKey, new Set());
    }

    this.subscriptions.get(subscriptionKey).add(client);

    const success = this.messageBrokerService.subscribe(exchange, queue, (message) => {
      // this emit is already in messageBrokerService.onMessage
      // adding it will only cause duplicate messages
      // client.emit('message', { exchange, queue, message });
    });

    if (success) {
      client.on('disconnect', () => {
        const subscribers = this.subscriptions.get(subscriptionKey);
        if (subscribers) {
          subscribers.delete(client);
          if (subscribers.size === 0) {
            this.subscriptions.delete(subscriptionKey);
          }
        }
        this.messageBrokerService.unsubscribe(exchange, queue, () => {});
      });
      return { status: 'ok', message: 'Subscribed successfully' };
    } else {
      return { status: 'error', message: 'Failed to subscribe' };
    }
  }
}