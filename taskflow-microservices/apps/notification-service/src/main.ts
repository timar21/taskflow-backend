import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { QueueNames, buildDeadLetterQueueOptions, getRabbitMqUrl } from '@app/shared';
import { NotificationServiceModule } from './notification-service.module';
import { RmqAckInterceptor } from './rmq-ack.interceptor';
import { setupDeadLetterQueue } from './setup-rabbitmq-topology';

const QUEUE_NAME = QueueNames.NOTIFICATION_QUEUE;

async function bootstrap() {
  await setupDeadLetterQueue(QUEUE_NAME);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(NotificationServiceModule, {
    transport: Transport.RMQ,
    options: {
      urls: [getRabbitMqUrl()],
      queue: QUEUE_NAME,
      noAck: false,
      queueOptions: buildDeadLetterQueueOptions(QUEUE_NAME),
    },
  });
  app.useGlobalInterceptors(new RmqAckInterceptor());
  await app.listen();
  console.log('notification-service is listening for events on notification_queue');
}
bootstrap();