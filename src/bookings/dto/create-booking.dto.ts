import { IsUUID, IsDateString, IsString, IsOptional, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Professional ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  professionalId: string;

  @ApiProperty({
    description: 'Client ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  clientId: string;

  @ApiProperty({
    description: 'Booking start time (ISO 8601 format)',
    example: '2024-01-15T10:00:00Z',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: 'Duration in hours',
    example: 2,
    minimum: 0.5,
  })
  @Min(0.5)
  durationHours: number;

  @ApiPropertyOptional({
    description: 'Additional notes for the booking',
    example: 'Please bring cleaning supplies',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
