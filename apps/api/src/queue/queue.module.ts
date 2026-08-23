import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { OutboxProcessor } from './outbox.processor';
import { CleanupProcessor } from './cleanup.processor';
import { LlmModule } from '../llm/llm.module';
import { CalendarModule } from '../calendar/calendar.module';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          url: configService.get('redisUrl'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'outbox',
    }),
    LlmModule,
    CalendarModule,
    EmailModule,
    PrismaModule,
  ],
  providers: [OutboxProcessor, CleanupProcessor],
  exports: [BullModule],
})
export class QueueModule {}
