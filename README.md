# Hotel Booking API

A NestJS-based REST API for managing hotel service bookings between clients and professionals.

## Features

- **Booking Management**: Create bookings with automatic conflict detection
- **Professional Search**: Find professionals by location, category, and price
- **Idempotency**: Prevent duplicate requests with idempotency keys
- **Double-booking Prevention**: Multi-layered approach to prevent scheduling conflicts
- **Location-based Search**: Haversine formula for distance calculations

## Tech Stack

- **Framework**: NestJS
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: TypeORM
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI

## Additional Documentation

- **[DESIGN_ARCHITECTURE.md](./DESIGN_ARCHITECTURE.md)** - System design and architecture decisions
- **[DEEP_THINKING_ANSWERS.md](./DEEP_THINKING_ANSWERS.md)** - Answers to architectural scalability questions

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

Copy the example environment file:

```bash
cp env.example .env
```

### Database Setup

The application uses SQLite by default. For production, configure PostgreSQL in `.env`.

### Run the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

### Seed Database

```bash
npm run db:seed
```

## API Endpoints

### Bookings

#### Create Booking
```bash
POST /bookings
Headers: Idempotency-Key: <unique-key>
Body: {
  "professionalId": "uuid",
  "clientId": "uuid", 
  "startTime": "2025-08-25T10:00:00Z",
  "durationHours": 2,
  "notes": "Optional notes"
}
```

### Professionals

#### Search Professionals
```bash
GET /search/pros?category=cleaning&locationLat=40.7128&locationLng=-74.0060&maxDistanceKm=10
```

Query Parameters:
- `category`: Service category (e.g., cleaning, plumbing)
- `locationLat`: Search location latitude
- `locationLng`: Search location longitude  
- `maxDistanceKm`: Maximum distance in kilometers
- `maxHourlyRateCents`: Maximum hourly rate
- `travelMode`: local or travel

### Clients

#### Get Client
```bash
GET /clients/:id
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

## Database Schema

### Core Tables

- **professionals**: Service providers with location and pricing
- **clients**: Customers who book services
- **bookings**: Service appointments with conflict prevention
- **availabilities**: Professional working hours
- **idempotency_keys**: Request deduplication

### Key Indexes

- `bookings(professional_id, start_time, end_time)` - Conflict detection
- `bookings(idempotency_key)` - Idempotency lookups
- `professionals(category, location_lat, location_lng)` - Search optimization

## Architecture

- **Modular Design**: Feature-based module organization
- **Service Layer**: Business logic separation
- **Repository Pattern**: Data access abstraction
- **DTO Validation**: Input/output data validation
- **Transaction Safety**: Database transaction management

## Development

### Project Structure

```
src/
├── bookings/          # Booking management
├── professionals/     # Professional search
├── clients/          # Client management
├── availabilities/   # Availability management
├── common/           # Shared services
└── database/         # Database configuration
```

### Key Services

- **BookingsService**: Core booking logic with conflict prevention
- **ProfessionalsService**: Search with location-based filtering
- **IdempotencyService**: Request deduplication
- **ClientsService**: Client data management


## Production Considerations

- **Database**: Use PostgreSQL for production
- **Caching**: Implement Redis for idempotency keys
- **Monitoring**: Add application and business metrics
- **Security**: Implement authentication and rate limiting
- **Scaling**: Horizontal scaling with load balancers

## License

Private - Assessment Project
