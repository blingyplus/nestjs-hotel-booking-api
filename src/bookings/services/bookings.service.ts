import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { Professional } from '../../professionals/entities/professional.entity';
import { Client } from '../../clients/entities/client.entity';
import { Availability } from '../../availabilities/entities/availability.entity';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { BookingResponseDto } from '../dto/booking-response.dto';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Professional)
    private professionalRepository: Repository<Professional>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
    private dataSource: DataSource,
    private idempotencyService: IdempotencyService,
  ) {}

  /**
   * Create a new booking with double-booking prevention
   */
  async createBooking(
    createBookingDto: CreateBookingDto,
    idempotencyKey: string,
  ): Promise<BookingResponseDto> {
    // Check idempotency first
    const cachedResponse = await this.idempotencyService.checkAndCache(
      idempotencyKey,
      createBookingDto,
      null,
    );

    if (cachedResponse) {
      return cachedResponse;
    }

    // Validate entities exist
    const [professional, client] = await Promise.all([
      this.professionalRepository.findOne({
        where: { id: createBookingDto.professionalId, isActive: true },
      }),
      this.clientRepository.findOne({
        where: { id: createBookingDto.clientId, isActive: true },
      }),
    ]);

    if (!professional) {
      throw new NotFoundException('Professional not found or inactive');
    }

    if (!client) {
      throw new NotFoundException('Client not found or inactive');
    }

    // Calculate end time
    const startTime = new Date(createBookingDto.startTime);
    const endTime = new Date(startTime.getTime() + createBookingDto.durationHours * 60 * 60 * 1000);

    // Validate booking time
    if (startTime <= new Date()) {
      throw new BadRequestException('Booking start time must be in the future');
    }

    // Check availability
    await this.checkAvailability(professional.id, startTime, endTime);

    // Check for overlapping bookings
    await this.checkForOverlaps(professional.id, startTime, endTime);

    // Calculate total price
    const totalPriceCents = Math.round(
      createBookingDto.durationHours * professional.hourlyRateCents
    );

    // Create booking within transaction
    const booking = await this.dataSource.transaction(async (manager) => {
      // Double-check for overlaps within transaction (concurrency safety)
      const overlappingBookings = await manager
        .createQueryBuilder(Booking, 'booking')
        .where('booking.professionalId = :professionalId', { professionalId: professional.id })
        .andWhere('booking.status != :cancelledStatus', { cancelledStatus: BookingStatus.CANCELLED })
        .andWhere(
          '(booking.startTime < :endTime AND booking.endTime > :startTime)',
          { startTime, endTime }
        )
        .getCount();

      if (overlappingBookings > 0) {
        throw new ConflictException('Booking time conflict detected');
      }

      // Create the booking
      const newBooking = manager.create(Booking, {
        id: uuidv4(),
        professionalId: professional.id,
        clientId: client.id,
        startTime,
        endTime,
        totalPriceCents,
        status: BookingStatus.PENDING,
        idempotencyKey,
        notes: createBookingDto.notes,
      });

      return manager.save(newBooking);
    });

    // Cache the response
    const responseDto = this.mapToResponseDto(booking);
    await this.idempotencyService.checkAndCache(
      idempotencyKey,
      createBookingDto,
      responseDto,
    );

    return responseDto;
  }

  /**
   * Check if the professional is available during the requested time
   */
  private async checkAvailability(
    professionalId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    const dayOfWeek = startTime.getDay();
    const startTimeStr = startTime.toTimeString().slice(0, 5);
    const endTimeStr = endTime.toTimeString().slice(0, 5);

    const availability = await this.availabilityRepository.findOne({
      where: {
        professionalId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (!availability) {
      throw new BadRequestException('Professional not available on this day');
    }

    if (startTimeStr < availability.startTime || endTimeStr > availability.endTime) {
      throw new BadRequestException('Booking time outside professional availability');
    }
  }

  /**
   * Check for overlapping bookings
   */
  private async checkForOverlaps(
    professionalId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    const overlappingBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.professionalId = :professionalId', { professionalId })
      .andWhere('booking.status != :cancelledStatus', { cancelledStatus: BookingStatus.CANCELLED })
      .andWhere(
        '(booking.startTime < :endTime AND booking.endTime > :startTime)',
        { startTime, endTime }
      )
      .getCount();

    if (overlappingBookings > 0) {
      throw new ConflictException('Booking time conflicts with existing booking');
    }
  }

  /**
   * Get booking by ID
   */
  async getBooking(id: string): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['professional', 'client'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.mapToResponseDto(booking);
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(booking: Booking): BookingResponseDto {
    return {
      id: booking.id,
      professionalId: booking.professionalId,
      clientId: booking.clientId,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPriceCents: booking.totalPriceCents,
      status: booking.status,
      stripePaymentIntentId: booking.stripePaymentIntentId,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }
}
