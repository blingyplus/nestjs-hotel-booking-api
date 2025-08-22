import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { ConflictException, BadRequestException, NotFoundException } from "@nestjs/common";
import { BookingsService } from "./bookings.service";
import { Booking, BookingStatus } from "../entities/booking.entity";
import { Professional } from "../../professionals/entities/professional.entity";
import { Client } from "../../clients/entities/client.entity";
import { Availability } from "../../availabilities/entities/availability.entity";
import { IdempotencyService } from "../../common/services/idempotency.service";
import { CreateBookingDto } from "../dto/create-booking.dto";
import { TravelMode } from "../../professionals/entities/professional.entity";

describe("BookingsService", () => {
  let service: BookingsService;
  let mockBookingRepository: any;
  let mockProfessionalRepository: any;
  let mockClientRepository: any;
  let mockAvailabilityRepository: any;
  let mockDataSource: any;
  let mockIdempotencyService: any;

  const mockProfessional: Professional = {
    id: "prof-123",
    name: "John Doe",
    email: "john@example.com",
    category: "cleaning",
    hourlyRateCents: 5000,
    travelMode: TravelMode.LOCAL,
    locationLat: 40.7128,
    locationLng: -74.006,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    availabilities: [],
    bookings: [],
  };

  const mockClient: Client = {
    id: "client-123",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+1234567890",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    bookings: [],
  };

  const mockAvailability: Availability = {
    id: "avail-123",
    professionalId: "prof-123",
    dayOfWeek: 1, // Monday
    startTime: "09:00:00",
    endTime: "17:00:00",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    professional: mockProfessional,
  };

  beforeEach(async () => {
    mockBookingRepository = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      })),
      findOne: jest.fn(),
    };

    mockProfessionalRepository = {
      findOne: jest.fn().mockResolvedValue(mockProfessional),
    };

    mockClientRepository = {
      findOne: jest.fn().mockResolvedValue(mockClient),
    };

    mockAvailabilityRepository = {
      findOne: jest.fn().mockResolvedValue(mockAvailability),
    };

    mockDataSource = {
      transaction: jest.fn((callback) =>
        callback({
          createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getCount: jest.fn().mockResolvedValue(0),
          })),
          create: jest.fn(),
          save: jest.fn(),
        })
      ),
    };

    mockIdempotencyService = {
      checkAndCache: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
        {
          provide: getRepositoryToken(Professional),
          useValue: mockProfessionalRepository,
        },
        {
          provide: getRepositoryToken(Client),
          useValue: mockClientRepository,
        },
        {
          provide: getRepositoryToken(Availability),
          useValue: mockAvailabilityRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: IdempotencyService,
          useValue: mockIdempotencyService,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createBooking", () => {
    const createBookingDto: CreateBookingDto = {
      professionalId: "prof-123",
      clientId: "client-123",
      startTime: "2025-12-15T10:00:00Z",
      durationHours: 2,
      notes: "Test booking",
    };

    const idempotencyKey = "test-key-123";

    it("should create a booking successfully", async () => {
      const mockTransactionManager = {
        createQueryBuilder: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(0),
        })),
        create: jest.fn().mockReturnValue({
          id: "booking-123",
          ...createBookingDto,
          startTime: new Date(createBookingDto.startTime),
          endTime: new Date("2024-01-15T12:00:00Z"),
          totalPriceCents: 10000,
          status: BookingStatus.PENDING,
          idempotencyKey,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        save: jest.fn().mockImplementation((booking) => Promise.resolve(booking)),
      };

      mockDataSource.transaction.mockImplementation((callback) => callback(mockTransactionManager));

      const result = await service.createBooking(createBookingDto, idempotencyKey);

      expect(result).toBeDefined();
      expect(result.professionalId).toBe(createBookingDto.professionalId);
      expect(result.clientId).toBe(createBookingDto.clientId);
      expect(result.totalPriceCents).toBe(10000);
      expect(result.status).toBe(BookingStatus.PENDING);
    });

    it("should throw ConflictException when double-booking is detected", async () => {
      mockDataSource.transaction.mockImplementation((callback) => {
        const mockTransactionManager = {
          createQueryBuilder: jest.fn(() => ({
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getCount: jest.fn().mockResolvedValue(1), // Overlapping booking found
          })),
        };
        return callback(mockTransactionManager);
      });

      await expect(service.createBooking(createBookingDto, idempotencyKey)).rejects.toThrow(ConflictException);
    });

    it("should throw BadRequestException when booking time is in the past", async () => {
      const pastTimeDto = {
        ...createBookingDto,
        startTime: "2020-01-15T10:00:00Z",
      };

      await expect(service.createBooking(pastTimeDto, idempotencyKey)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when professional is not available", async () => {
      mockAvailabilityRepository.findOne.mockResolvedValue(null);

      await expect(service.createBooking(createBookingDto, idempotencyKey)).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException when professional not found", async () => {
      mockProfessionalRepository.findOne.mockResolvedValue(null);

      await expect(service.createBooking(createBookingDto, idempotencyKey)).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException when client not found", async () => {
      mockClientRepository.findOne.mockResolvedValue(null);

      await expect(service.createBooking(createBookingDto, idempotencyKey)).rejects.toThrow(NotFoundException);
    });
  });

  describe("getBooking", () => {
    it("should return a booking when found", async () => {
      const mockBooking = {
        id: "booking-123",
        professionalId: "prof-123",
        clientId: "client-123",
        startTime: new Date(),
        endTime: new Date(),
        totalPriceCents: 10000,
        status: BookingStatus.PENDING,
        stripePaymentIntentId: null,
        notes: "Test booking",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBookingRepository.findOne = jest.fn().mockResolvedValue(mockBooking);

      const result = await service.getBooking("booking-123");

      expect(result).toBeDefined();
      expect(result.id).toBe("booking-123");
    });

    it("should throw NotFoundException when booking not found", async () => {
      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(service.getBooking("non-existent")).rejects.toThrow(NotFoundException);
    });
  });
});
