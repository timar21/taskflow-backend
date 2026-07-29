import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ClientsModule, Transport } from '@nestjs/microservices';
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
          urls: ['amqp://localhost:5672'],
          queue: 'user_queue',
          // Must match user-service's own queue arguments exactly — RabbitMQ
          // rejects any party that tries to (re)declare an existing queue
          // with different arguments than the ones it was created with.
          queueOptions: {
            durable: false,
            arguments: {
              'x-dead-letter-exchange': 'dlx',
              'x-dead-letter-routing-key': 'user_queue.dead',
            },
          },
        },
      },
      {
        name: 'TASK_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'task_queue',
          queueOptions: {
            durable: false,
            arguments: {
              'x-dead-letter-exchange': 'dlx',
              'x-dead-letter-routing-key': 'task_queue.dead',
            },
          },
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