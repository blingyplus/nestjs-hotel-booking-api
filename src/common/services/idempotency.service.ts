import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdempotencyKey } from '../entities/idempotency-key.entity';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectRepository(IdempotencyKey)
    private idempotencyKeyRepository: Repository<IdempotencyKey>,
  ) {}

  /**
   * Generate a unique idempotency key
   */
  generateKey(clientId: string, requestBody: any): string {
    const requestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(requestBody))
      .digest('hex');
    
    return `${clientId}:${requestHash}:${Date.now()}`;
  }

  /**
   * Check if an idempotency key exists and return cached response if it does
   */
  async checkAndCache(
    key: string,
    requestBody: any,
    responseData: any,
    ttlHours: number = 24,
  ): Promise<any | null> {
    const requestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(requestBody))
      .digest('hex');

    // Check if key exists
    const existingKey = await this.idempotencyKeyRepository.findOne({
      where: { key },
    });

    if (existingKey) {
      // If request hash matches, return cached response
      if (existingKey.requestHash === requestHash) {
        return JSON.parse(existingKey.responseData);
      }
      
      // If request hash doesn't match, it's a conflict
      throw new ConflictException('Idempotency key conflict: request body differs');
    }

    // Cache the new response
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    await this.idempotencyKeyRepository.save({
      key,
      requestHash,
      responseData: JSON.stringify(responseData),
      expiresAt,
    });

    return null; // No cached response, proceed with normal flow
  }

  /**
   * Clean up expired idempotency keys
   */
  async cleanupExpiredKeys(): Promise<void> {
    await this.idempotencyKeyRepository
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute();
  }
}
