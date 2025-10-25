import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseTestService } from './database-test.service';
import { DatabaseHealthController } from './database-health.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DatabaseHealthController],
  providers: [DatabaseTestService],
  exports: [DatabaseTestService],
})
export class DatabaseModule {}