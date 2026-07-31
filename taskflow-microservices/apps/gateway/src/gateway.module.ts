import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { QueueNames, buildDeadLetterQueueOptions, getRabbitMqUrl } from '@app/shared';
import { GatewayController } from './gateway.controller';
import { GatewayAuthController } from './auth.controller';
import { GatewayProjectsController } from './projects.controller';
import { GatewayTasksController } from './tasks.controller';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PassportModule,
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [getRabbitMqUrl()],
          queue: QueueNames.USER_QUEUE,
          // Must match user-service's own queue arguments exactly — RabbitMQ
          // rejects any party that tries to (re)declare an existing queue
          // with different arguments than the ones it was created with.
          queueOptions: buildDeadLetterQueueOptions(QueueNames.USER_QUEUE),
        },
      },
      {
        name: 'TASK_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: QueueNames.TASK_QUEUE,
          queueOptions: buildDeadLetterQueueOptions(QueueNames.TASK_QUEUE),
        },
      },
    ]),
  ],
  controllers: [
    GatewayController,
    GatewayAuthController,
    GatewayProjectsController,
    GatewayTasksController,
  ],
  providers: [JwtStrategy, RolesGuard],
})
export class GatewayModule { }