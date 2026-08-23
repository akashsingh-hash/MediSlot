import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue.module';
import { LlmModule } from './llm/llm.module';
import { MedicationsModule } from './medications/medications.module';
import { AdminModule } from './admin/admin.module';
import { MessagesModule } from './messages/messages.module';
import { CalendarModule } from './calendar/calendar.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule, 
    DoctorsModule, 
    AppointmentsModule,
    AuthModule,
    QueueModule,
    LlmModule,
    MedicationsModule,
    AdminModule,
    MessagesModule,
    CalendarModule,
    PrescriptionsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
