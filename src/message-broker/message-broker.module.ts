import { Module } from '@nestjs/common';
import { MessageBrokerService } from './message-broker.service';
import { MessageBrokerController } from './message-broker.controller';
import { MessageBrokerGateway } from './message-broker.gateway';
import { MessageStorageService } from './message-storage.service';

@Module({
  providers: [MessageBrokerService, MessageBrokerGateway, MessageStorageService],
  controllers: [MessageBrokerController],
})
export class MessageBrokerModule {}
