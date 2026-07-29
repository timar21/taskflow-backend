import { Module } from '@nestjs/common';
import { NotificationServiceController } from './notification-service.controller';

@Module({
  imports: [],
  controllers: [NotificationServiceController],
  providers: [],
})
export class NotificationServiceModule { }