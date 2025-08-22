import { ApiProperty } from '@nestjs/swagger';
import { TravelMode } from '../entities/professional.entity';

export class ProfessionalSearchResponseDto {
  @ApiProperty({
    description: 'Professional ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Professional name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'Professional email',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Professional category',
    example: 'cleaning',
  })
  category: string;

  @ApiProperty({
    description: 'Hourly rate in cents',
    example: 5000,
  })
  hourlyRateCents: number;

  @ApiProperty({
    description: 'Travel mode',
    enum: TravelMode,
    example: TravelMode.LOCAL,
  })
  travelMode: TravelMode;

  @ApiProperty({
    description: 'Location latitude',
    example: 40.7128,
  })
  locationLat: number;

  @ApiProperty({
    description: 'Location longitude',
    example: -74.0060,
  })
  locationLng: number;

  @ApiProperty({
    description: 'Distance from search location in kilometers',
    example: 2.5,
    nullable: true,
  })
  distanceKm: number | null;

  @ApiProperty({
    description: 'Minimum price for this professional',
    example: 5000,
  })
  minPriceCents: number;

  @ApiProperty({
    description: 'Whether the professional is available',
    example: true,
  })
  isAvailable: boolean;
}
