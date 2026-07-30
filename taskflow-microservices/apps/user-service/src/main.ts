import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { QueueNames, buildDeadLetterQueueOptions } from '@app/shared';
import { UserServiceModule } from './user-service.module';
import { RpcExceptionFilter } from './rpc-exception.filter';
import { RmqAckInterceptor } from './rmq-ack.interceptor';
import { setupDeadLetterQueue } from './setup-rabbitmq-topology';

const QUEUE_NAME = QueueNames.USER_QUEUE;

async function bootstrap() {
  await setupDeadLetterQueue(QUEUE_NAME);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(UserServiceModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: QUEUE_NAME,
      noAck: false,
      queueOptions: buildDeadLetterQueueOptions(QUEUE_NAME),
    },
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new RpcExceptionFilter());
  app.useGlobalInterceptors(new RmqAckInterceptor());
  await app.listen();
  console.log('user-service is listening for messages on user_queue');
}
bootstrap();