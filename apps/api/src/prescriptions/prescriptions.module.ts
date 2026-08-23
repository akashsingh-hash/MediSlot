import { Module } from '@nestjs/common';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { LlmModule } from '../llm/llm.module';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    LlmModule,
    CalendarModule,
    BullModule.registerQueue({
      name: 'outbox',
    }),
  ],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
