import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { BookingsService } from '../services/bookings.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { BookingResponseDto } from '../dto/booking-response.dto';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new booking',
    description: 'Creates a new booking with double-booking prevention and idempotency support',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Unique key to prevent duplicate requests',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data or booking time',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - booking time conflicts or idempotency key conflict',
  })
  @ApiResponse({
    status: 404,
    description: 'Professional or client not found',
  })
  async createBooking(
    @Body() createBookingDto: CreateBookingDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<BookingResponseDto> {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    return this.bookingsService.createBooking(createBookingDto, idempotencyKey);
  }
}
