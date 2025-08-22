import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProfessionalsService } from '../services/professionals.service';
import { SearchProfessionalsDto } from '../dto/search-professionals.dto';
import { ProfessionalSearchResponseDto } from '../dto/professional-search-response.dto';

@ApiTags('professionals')
@Controller('search')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get('pros')
  @ApiOperation({
    summary: 'Search professionals',
    description: 'Search for professionals with filters for location, category, price, and travel mode',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Professional category (e.g., cleaning, plumbing)',
  })
  @ApiQuery({
    name: 'locationLat',
    required: false,
    description: 'Location latitude for distance-based search',
    type: Number,
  })
  @ApiQuery({
    name: 'locationLng',
    required: false,
    description: 'Location longitude for distance-based search',
    type: Number,
  })
  @ApiQuery({
    name: 'maxHourlyRateCents',
    required: false,
    description: 'Maximum hourly rate in cents',
    type: Number,
  })
  @ApiQuery({
    name: 'travelMode',
    required: false,
    description: 'Travel mode preference (local or travel)',
    enum: ['local', 'travel'],
  })
  @ApiQuery({
    name: 'maxDistanceKm',
    required: false,
    description: 'Maximum distance in kilometers',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Professionals found successfully',
    type: [ProfessionalSearchResponseDto],
  })
  async searchProfessionals(
    @Query() searchDto: SearchProfessionalsDto,
  ): Promise<ProfessionalSearchResponseDto[]> {
    return this.professionalsService.searchProfessionals(searchDto);
  }
}
