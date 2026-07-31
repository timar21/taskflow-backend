import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { QueueNames, buildDeadLetterQueueOptions, getRabbitMqUrl } from '@app/shared';
import { TaskServiceModule } from './task-service.module';
import { RpcExceptionFilter } from './rpc-exception.filter';
import { RmqAckInterceptor } from './rmq-ack.interceptor';
import { setupDeadLetterQueue } from './setup-rabbitmq-topology';

const QUEUE_NAME = QueueNames.TASK_QUEUE;

async function bootstrap() {
  await setupDeadLetterQueue(QUEUE_NAME);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(TaskServiceModule, {
    transport: Transport.RMQ,
    options: {
      urls: [getRabbitMqUrl()],
      queue: QUEUE_NAME,
      noAck: false,
      queueOptions: buildDeadLetterQueueOptions(QUEUE_NAME),
    },
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new RpcExceptionFilter());
  app.useGlobalInterceptors(new RmqAckInterceptor());
  await app.listen();
  console.log('task-service is listening for messages on task_queue');
}
bootstrap();