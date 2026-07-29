import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { UserServiceModule } from './user-service.module';
import { RpcExceptionFilter } from './rpc-exception.filter';
import { RmqAckInterceptor } from './rmq-ack.interceptor';
import { setupDeadLetterQueue } from './setup-rabbitmq-topology';

const QUEUE_NAME = 'user_queue';

async function bootstrap() {
  await setupDeadLetterQueue(QUEUE_NAME);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(UserServiceModule, {
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
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new RpcExceptionFilter());
  app.useGlobalInterceptors(new RmqAckInterceptor());
  await app.listen();
  console.log('user-service is listening for messages on user_queue');
}
bootstrap();