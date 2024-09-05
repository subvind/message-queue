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

  private subscriptions: Map<Socket, Set<string>> = new Map();

  constructor(private readonly messageBrokerService: MessageBrokerService) {
    this.subscribeToAllExchanges();
  }

  private subscribeToAllExchanges() {
    this.messageBrokerService.onMessage((exchange, queue, message) => {
      this.server.sockets.sockets.forEach((socket: Socket) => {
        const subscriptionKey = `${exchange}:${queue}`;
        if (this.subscriptions.get(socket)?.has(subscriptionKey)) {
          socket.emit('message', { exchange, queue, message });
        }
      });
    });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { exchange: string; queue: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { exchange, queue } = data;
    const subscriptionKey = `${exchange}:${queue}`;

    if (!this.subscriptions.has(client)) {
      this.subscriptions.set(client, new Set());
    }

    this.subscriptions.get(client).add(subscriptionKey);

    const success = this.messageBrokerService.subscribe(exchange, queue, (message) => {
      client.emit('message', { exchange, queue, message });
    });

    if (success) {
      client.on('disconnect', () => {
        this.subscriptions.delete(client);
        this.messageBrokerService.unsubscribe(exchange, queue, () => {});
      });
      return { status: 'ok', message: 'Subscribed successfully' };
    } else {
      return { status: 'error', message: 'Failed to subscribe' };
    }
  }
}