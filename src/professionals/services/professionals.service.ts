import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Professional, TravelMode } from '../entities/professional.entity';
import { SearchProfessionalsDto } from '../dto/search-professionals.dto';
import { ProfessionalSearchResponseDto } from '../dto/professional-search-response.dto';

@Injectable()
export class ProfessionalsService {
  constructor(
    @InjectRepository(Professional)
    private professionalRepository: Repository<Professional>,
  ) {}

  /**
   * Search professionals with filters
   */
  async searchProfessionals(
    searchDto: SearchProfessionalsDto,
  ): Promise<ProfessionalSearchResponseDto[]> {
    let query = this.professionalRepository
      .createQueryBuilder('professional')
      .where('professional.isActive = :isActive', { isActive: true });

    // Apply category filter
    if (searchDto.category) {
      query = query.andWhere('professional.category = :category', {
        category: searchDto.category,
      });
    }

    // Apply travel mode filter
    if (searchDto.travelMode) {
      query = query.andWhere('professional.travelMode = :travelMode', {
        travelMode: searchDto.travelMode,
      });
    }

    // Apply price filter
    if (searchDto.maxHourlyRateCents) {
      query = query.andWhere('professional.hourlyRateCents <= :maxHourlyRateCents', {
        maxHourlyRateCents: searchDto.maxHourlyRateCents,
      });
    }

    // Apply location-based filtering if coordinates provided
    if (searchDto.locationLat && searchDto.locationLng) {
      // Calculate distance using Haversine formula
      const distanceFormula = `
        (6371 * acos(
          cos(radians(:lat)) * cos(radians(professional.location_lat)) *
          cos(radians(professional.location_lng) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(professional.location_lat))
        )) as distance
      `;

      query = query.addSelect(distanceFormula, 'distance');

      // Apply distance filter if specified
      if (searchDto.maxDistanceKm) {
        query = query.having('distance <= :maxDistance', {
          maxDistance: searchDto.maxDistanceKm,
        });
      }

      // Order by distance
      query = query.orderBy('distance', 'ASC');
    }

    // Order by hourly rate if no location sorting
    if (!searchDto.locationLat || !searchDto.locationLng) {
      query = query.orderBy('professional.hourlyRateCents', 'ASC');
    }

    const professionals = await query.getRawAndEntities();

    // Map to response DTOs
    return professionals.entities.map((professional, index) => {
      const raw = professionals.raw[index];
      return {
        id: professional.id,
        name: professional.name,
        email: professional.email,
        category: professional.category,
        hourlyRateCents: professional.hourlyRateCents,
        travelMode: professional.travelMode,
        locationLat: professional.locationLat,
        locationLng: professional.locationLng,
        distanceKm: raw.distance ? parseFloat(raw.distance) : null,
        minPriceCents: professional.hourlyRateCents,
        isAvailable: true, // This could be enhanced with real-time availability checking
      };
    });
  }

  /**
   * Get professional by ID
   */
  async getProfessional(id: string): Promise<Professional> {
    return this.professionalRepository.findOne({
      where: { id, isActive: true },
    });
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
