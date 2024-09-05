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

  constructor(private readonly messageBrokerService: MessageBrokerService) {}

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { exchange: string; queue: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { exchange, queue } = data;
    const callback = (message: any) => {
      client.emit('message', { exchange, queue, message });
    };

    const success = this.messageBrokerService.subscribe(exchange, queue, callback);

    if (success) {
      client.on('disconnect', () => {
        this.messageBrokerService.unsubscribe(exchange, queue, callback);
      });
      return { status: 'ok', message: 'Subscribed successfully' };
    } else {
      return { status: 'error', message: 'Failed to subscribe' };
    }
  }
}
