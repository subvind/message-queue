
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { MessageBrokerService } from './message-broker.service';

@Controller('message-broker')
export class MessageBrokerController {
  constructor(private readonly messageBrokerService: MessageBrokerService) {}

  @Post('exchange')
  createExchange(@Body('name') name: string) {
    this.messageBrokerService.createExchange(name);
    return { status: 'ok', message: `Exchange ${name} created` };
  }

  @Post('bind')
  bind(
    @Body('exchange') exchange: string,
    @Body('queue') queue: string,
    @Body('routingKey') routingKey: string,
  ) {
    const result = this.messageBrokerService.bind(exchange, queue, routingKey);
    return result
      ? { status: 'ok', message: 'Binding created' }
      : { status: 'error', message: 'Exchange not found' };
  }

  @Post('publish')
  publish(
    @Body('exchange') exchange: string,
    @Body('routingKey') routingKey: string,
    @Body('message') message: any,
  ) {
    const result = this.messageBrokerService.publish(exchange, routingKey, message);
    return result
      ? { status: 'ok', message: 'Message published' }
      : { status: 'error', message: 'Exchange not found' };
  }

  @Get('consume/:exchange/:queue')
  async consume(
    @Param('exchange') exchange: string,
    @Param('queue') queue: string,
  ) {
    const message = await this.messageBrokerService.consume(exchange, queue);
    return message
      ? { status: 'ok', message }
      : { status: 'error', message: 'No message available or exchange/queue not found' };
  }

  @Get('queue-length/:exchange/:queue')
  async getQueueLength(
    @Param('exchange') exchange: string,
    @Param('queue') queue: string,
  ) {
    const length = await this.messageBrokerService.getQueueLength(exchange, queue);
    return { status: 'ok', length };
  }
}