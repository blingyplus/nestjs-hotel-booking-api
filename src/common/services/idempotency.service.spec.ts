import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConflictException } from "@nestjs/common";
import { IdempotencyService } from "./idempotency.service";
import { IdempotencyKey } from "../entities/idempotency-key.entity";

describe("IdempotencyService", () => {
  let service: IdempotencyService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn(),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyService,
        {
          provide: getRepositoryToken(IdempotencyKey),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<IdempotencyService>(IdempotencyService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("generateKey", () => {
    it("should generate a unique key with client ID, request hash, and timestamp", () => {
      const clientId = "client-123";
      const requestBody = { test: "data" };

      const key = service.generateKey(clientId, requestBody);

      expect(key).toContain(clientId);
      expect(key).toMatch(/^[^:]+:[a-f0-9]+:\d+$/);
    });

    it("should generate different keys for different request bodies", () => {
      const clientId = "client-123";
      const body1 = { test: "data1" };
      const body2 = { test: "data2" };

      const key1 = service.generateKey(clientId, body1);
      const key2 = service.generateKey(clientId, body2);

      expect(key1).not.toBe(key2);
    });
  });

  describe("checkAndCache", () => {
    const requestBody = { test: "data" };
    const responseData = { result: "success" };
    const key = "test-key-123";

    it("should return cached response when key exists and request hash matches", async () => {
      // Calculate the actual hash that the service will generate
      const crypto = require("crypto");
      const actualHash = crypto.createHash("sha256").update(JSON.stringify(requestBody)).digest("hex");

      const existingKey = {
        key,
        requestHash: actualHash,
        responseData: JSON.stringify(responseData),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(existingKey);

      const result = await service.checkAndCache(key, requestBody, responseData);

      expect(result).toEqual(responseData);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it("should throw ConflictException when key exists but request hash differs", async () => {
      const existingKey = {
        key,
        requestHash: "different-hash",
        responseData,
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(existingKey);

      await expect(service.checkAndCache(key, requestBody, responseData)).rejects.toThrow(ConflictException);
    });

    it("should cache new response when key does not exist", async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue({});

      const result = await service.checkAndCache(key, requestBody, responseData);

      expect(result).toBeNull();
      expect(mockRepository.save).toHaveBeenCalledWith({
        key,
        requestHash: expect.any(String),
        responseData: JSON.stringify(responseData),
        expiresAt: expect.any(Date),
      });
    });

    it("should use custom TTL when provided", async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue({});

      const customTtl = 48; // 48 hours
      await service.checkAndCache(key, requestBody, responseData, customTtl);

      const savedCall = mockRepository.save.mock.calls[0][0];
      const expectedExpiry = new Date();
      expectedExpiry.setHours(expectedExpiry.getHours() + customTtl);

      // Allow for small time differences in test execution
      expect(savedCall.expiresAt.getTime()).toBeCloseTo(expectedExpiry.getTime(), -2);
    });
  });

  describe("cleanupExpiredKeys", () => {
    it("should delete expired keys", async () => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn(),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.cleanupExpiredKeys();

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith("expires_at < :now", { now: expect.any(Date) });
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });
});
