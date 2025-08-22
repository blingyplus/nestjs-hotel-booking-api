import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TravelMode } from '../entities/professional.entity';

export class SearchProfessionalsDto {
  @ApiPropertyOptional({
    description: 'Professional category',
    example: 'cleaning',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Location latitude',
    example: 40.7128,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  locationLat?: number;

  @ApiPropertyOptional({
    description: 'Location longitude',
    example: -74.0060,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  locationLng?: number;

  @ApiPropertyOptional({
    description: 'Maximum hourly rate in cents',
    example: 5000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxHourlyRateCents?: number;

  @ApiPropertyOptional({
    description: 'Travel mode preference',
    enum: TravelMode,
    example: TravelMode.LOCAL,
  })
  @IsOptional()
  @IsEnum(TravelMode)
  travelMode?: TravelMode;

  @ApiPropertyOptional({
    description: 'Maximum distance in kilometers',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxDistanceKm?: number;
}
