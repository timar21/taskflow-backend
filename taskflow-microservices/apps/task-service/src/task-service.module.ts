import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
  ],
  controllers: [TaskServiceController, TasksMessageController],
  providers: [ProjectsService, TasksService],
})
export class TaskServiceModule { }