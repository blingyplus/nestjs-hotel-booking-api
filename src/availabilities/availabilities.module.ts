import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Availability } from './entities/availability.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Availability])],
  exports: [TypeOrmModule],
})
export class AvailabilitiesModule {}
