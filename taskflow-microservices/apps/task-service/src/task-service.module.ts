import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { QueueNames, buildDeadLetterQueueOptions } from '@app/shared';
import { TaskServiceController } from './task-service.controller';
import { TasksMessageController } from './tasks.controller';
import { ProjectsService } from './projects.service';
import { TasksService } from './tasks.service';
import { Project } from './entities/project.entity';
import { Task } from './entities/task.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') ?? '127.0.0.1',
        port: Number(configService.get('DB_PORT')),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [Project, Task],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Project, Task]),
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: QueueNames.NOTIFICATION_QUEUE,
          queueOptions: buildDeadLetterQueueOptions(QueueNames.NOTIFICATION_QUEUE),
        },
      },
    ]),
  ],
  controllers: [TaskServiceController, TasksMessageController],
  providers: [ProjectsService, TasksService],
})
export class TaskServiceModule { }