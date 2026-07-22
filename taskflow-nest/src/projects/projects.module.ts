import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createKeyv } from '@keyv/redis';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    CacheModule.registerAsync({
      isGlobal: false,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST');
        const redisPort = configService.get<string>('REDIS_PORT') ?? '6379';

        // If REDIS_HOST isn't set, cache-manager falls back to its
        // default in-memory store automatically — same TTL, no Redis needed.
        // Set REDIS_HOST (and run Redis via Docker) to switch to Redis.
        return {
          ttl: 60000,
          stores: redisHost ? [createKeyv(`redis://${redisHost}:${redisPort}`)] : undefined,
        };
      },
    }),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule { }