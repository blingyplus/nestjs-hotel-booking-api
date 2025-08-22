# NestJS Hotel Booking API

A comprehensive hotel booking API built with NestJS, featuring double-booking prevention, idempotency support, and professional search functionality.

## 🚀 Features

- **Double-Booking Prevention**: Robust conflict detection with database-level constraints
- **Idempotency Support**: Prevents duplicate requests with configurable TTL
- **Professional Search**: Location-based search with distance calculations
- **Availability Management**: Professional availability windows and validation
- **Comprehensive Testing**: Unit tests for conflict detection and idempotency
- **Swagger Documentation**: Interactive API documentation
- **Database Flexibility**: SQLite for development, PostgreSQL for production

## 🏗️ Architecture

The system follows a modular NestJS architecture with:

- **Entities**: Professional, Client, Booking, Availability, IdempotencyKey
- **Services**: Business logic with transaction safety
- **Controllers**: RESTful API endpoints
- **DTOs**: Request/response validation and documentation
- **Database**: TypeORM with SQLite/PostgreSQL support

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- SQLite (for development)
- PostgreSQL (optional, for production)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nestjs-hotel-booking-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Start the application (creates SQLite database)
   npm run start:dev
   
   # In another terminal, seed the database
   npm run db:seed
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

## 📚 API Documentation

Once the application is running, visit:
- **Swagger UI**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## 🔌 API Endpoints

### 1. Create Booking
**POST** `/bookings`

Creates a new booking with double-booking prevention and idempotency support.

**Headers:**
```
Idempotency-Key: <unique-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "professionalId": "uuid",
  "clientId": "uuid", 
  "startTime": "2024-01-15T10:00:00Z",
  "durationHours": 2,
  "notes": "Optional booking notes"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "professionalId": "uuid",
  "clientId": "uuid",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T12:00:00Z",
  "totalPriceCents": 10000,
  "status": "pending",
  "stripePaymentIntentId": null,
  "notes": "Optional booking notes",
  "createdAt": "2024-01-15T09:00:00Z",
  "updatedAt": "2024-01-15T09:00:00Z"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: client-123:abc123:1705312800000" \
  -d '{
    "professionalId": "prof-uuid-here",
    "clientId": "client-uuid-here",
    "startTime": "2024-01-15T10:00:00Z",
    "durationHours": 2,
    "notes": "Deep cleaning required"
  }'
```

### 2. Search Professionals
**GET** `/search/pros`

Search for professionals with various filters.

**Query Parameters:**
- `category` (optional): Professional category (e.g., cleaning, plumbing)
- `locationLat` (optional): Location latitude for distance-based search
- `locationLng` (optional): Location longitude for distance-based search
- `maxHourlyRateCents` (optional): Maximum hourly rate in cents
- `travelMode` (optional): Travel mode preference (local, travel)
- `maxDistanceKm` (optional): Maximum distance in kilometers

**Example cURL:**
```bash
# Search for cleaning professionals within 10km of NYC
curl "http://localhost:3000/search/pros?category=cleaning&locationLat=40.7128&locationLng=-74.0060&maxDistanceKm=10&maxHourlyRateCents=6000"

# Search for all professionals by price
curl "http://localhost:3000/search/pros?maxHourlyRateCents=5000"
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@cleaning.com",
    "category": "cleaning",
    "hourlyRateCents": 5000,
    "travelMode": "local",
    "locationLat": 40.7128,
    "locationLng": -74.0060,
    "distanceKm": 2.5,
    "minPriceCents": 5000,
    "isAvailable": true
  }
]
```

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm test

# Tests with coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

### Test Coverage
The test suite includes:
- **Conflict Detection Test**: Verifies double-booking prevention
- **Idempotency Test**: Ensures duplicate request handling
- **Service Layer Tests**: Comprehensive business logic testing
- **Controller Tests**: API endpoint validation

## 🗄️ Database

### Development (SQLite)
- File: `database.sqlite`
- Auto-created on first run
- Synchronized schema

### Production (PostgreSQL)
- Configure via environment variables
- Run migrations manually
- Optimized indexes for performance

### Key Indexes
- `bookings(professional_id, start_time, end_time)` - Overlap detection
- `bookings(idempotency_key)` - Idempotency lookups
- `professionals(category, location_lat, location_lng)` - Search optimization

## 🔒 Security Features

- **Input Validation**: Comprehensive DTO validation
- **SQL Injection Protection**: Parameterized queries only
- **Idempotency**: Prevents duplicate request processing
- **Transaction Safety**: Database-level consistency

## 📊 Monitoring & Observability

- **Application Metrics**: Response times, error rates
- **Business Metrics**: Booking success rates
- **Database Monitoring**: Connection pools, query performance
- **Error Tracking**: Structured error logging

## 🚀 Deployment

### Docker (Recommended)
```bash
# Build image
docker build -t hotel-booking-api .

# Run container
docker run -p 3000:3000 hotel-booking-api
```

### Manual Deployment
```bash
# Build application
npm run build

# Set production environment
export NODE_ENV=production

# Start application
npm run start:prod
```

## 🔧 Configuration

### Environment Variables
- `DB_TYPE`: Database type (sqlite/postgres)
- `DB_NAME`: Database name
- `PORT`: Application port
- `NODE_ENV`: Environment (development/production)

### Database Configuration
- **SQLite**: Default for development
- **PostgreSQL**: Configure for production with connection pooling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions or issues:
1. Check the API documentation at `/api`
2. Review the test suite for usage examples
3. Check the logs for detailed error information

## 🎯 Assessment Requirements Met

✅ **Part 1 - Software Design & Architecture**: Complete design document with assumptions, architecture, database design, critical flows, and key considerations

✅ **Part 2 - Coding Challenge**: 
- POST /bookings endpoint with double-booking prevention
- GET /search/pros endpoint with filters
- Comprehensive tests for conflict detection and idempotency
- Idempotency-Key header support

✅ **Part 3 - Deep Thinking Questions**: Answered in the design document

✅ **Additional Requirements**:
- Source code with clear structure
- Comprehensive README with setup instructions
- Seed data for quick testing
- Example cURL commands
- Swagger API documentation
- Professional-grade code quality
