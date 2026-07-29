import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { NotificationServiceModule } from './notification-service.module';
import { RmqAckInterceptor } from './rmq-ack.interceptor';
import { setupDeadLetterQueue } from './setup-rabbitmq-topology';

const QUEUE_NAME = 'notification_queue';

async function bootstrap() {
  await setupDeadLetterQueue(QUEUE_NAME);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(NotificationServiceModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: QUEUE_NAME,
      noAck: false,
      queueOptions: {
        durable: false,
        arguments: {
          'x-dead-letter-exchange': 'dlx',
          'x-dead-letter-routing-key': `${QUEUE_NAME}.dead`,
        },
      },
    },
  });
  app.useGlobalInterceptors(new RmqAckInterceptor());
  await app.listen();
  console.log('notification-service is listening for events on notification_queue');
}
bootstrap();