import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ProjectsModule } from '../../src/projects/projects.module';
import { UsersModule } from '../../src/users/users.module';
import { AuthModule } from '../../src/auth/auth.module';
import { TasksModule } from '../../src/tasks/tasks.module';
import { User } from '../../src/users/entities/user.entity';
import { Project } from '../../src/projects/entities/project.entity';
import { Task } from '../../src/tasks/entities/task.entity';

// Mirrors AppModule, but points TypeORM at an in-memory SQLite database
// instead of Postgres, so e2e tests never touch real dev/prod data and
// each test run starts from a clean, empty schema.
//
// TasksModule depends on NotificationsModule, which registers a Bull queue —
// that queue needs a real Redis connection to initialize, so e2e tests that
// touch tasks require Redis running (e.g. via `docker run ... redis:latest`,
// same container used in dev). REDIS_HOST/REDIS_PORT come from .env.test.
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
            type: 'better-sqlite3',
            database: ':memory:',
            entities: [User, Project, Task],
            synchronize: true,
            dropSchema: true,
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                redis: {
                    host: configService.get<string>('REDIS_HOST') ?? 'localhost',
                    port: Number(configService.get<string>('REDIS_PORT') ?? '6379'),
                },
            }),
        }),
        ProjectsModule,
        UsersModule,
        AuthModule,
        TasksModule,
    ],
})
export class TestAppModule { }