import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../entities/booking.entity';

export class BookingResponseDto {
  @ApiProperty({
    description: 'Unique booking ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Professional ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  professionalId: string;

  @ApiProperty({
    description: 'Client ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  clientId: string;

  @ApiProperty({
    description: 'Booking start time',
    example: '2024-01-15T10:00:00Z',
  })
  startTime: Date;

  @ApiProperty({
    description: 'Booking end time',
    example: '2024-01-15T12:00:00Z',
  })
  endTime: Date;

  @ApiProperty({
    description: 'Total price in cents',
    example: 10000,
  })
  totalPriceCents: number;

  @ApiProperty({
    description: 'Booking status',
    enum: BookingStatus,
    example: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @ApiProperty({
    description: 'Stripe payment intent ID',
    example: 'pi_1234567890',
    nullable: true,
  })
  stripePaymentIntentId: string | null;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Please bring cleaning supplies',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T09:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T09:00:00Z',
  })
  updatedAt: Date;
}
