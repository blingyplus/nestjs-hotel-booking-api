import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './controllers/bookings.controller';
import { BookingsService } from './services/bookings.service';
import { Booking } from './entities/booking.entity';
import { Professional } from '../professionals/entities/professional.entity';
import { Client } from '../clients/entities/client.entity';
import { Availability } from '../availabilities/entities/availability.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Professional, Client, Availability]),
    CommonModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
