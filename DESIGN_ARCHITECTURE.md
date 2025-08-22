# Design & Architecture Document - Hotel Booking API

## Assumptions

- **Database**: SQLite for development/testing, PostgreSQL for production
- **Authentication**: Basic client identification via client ID (no full auth system implemented)
- **Payment**: Stripe integration planned but not fully implemented
- **Scaling**: Single-instance deployment with potential for horizontal scaling
- **Time Zones**: All times stored in UTC, client-side conversion expected

## High-Level Architecture

### Monolithic NestJS Application
- **Framework**: NestJS with TypeORM for database operations
- **Database**: SQLite/PostgreSQL with TypeORM entities and migrations
- **API Layer**: RESTful endpoints with Swagger documentation
- **Validation**: Class-validator for DTO validation
- **Error Handling**: Consistent HTTP status codes and error responses

**Justification**: Monolithic approach chosen for simplicity and rapid development. The modular structure allows for future microservice extraction. NestJS provides excellent dependency injection and modular architecture out of the box.

### Key Components
- **Bookings Module**: Core booking logic with conflict detection
- **Professionals Module**: Professional search and management
- **Clients Module**: Client information management
- **Common Module**: Shared services (idempotency, utilities)
- **Database Module**: TypeORM configuration and migrations

## Database Design

### Main Tables

#### `professionals`
- `id` (UUID, Primary Key)
- `name`, `email`, `category`
- `hourly_rate_cents` (Integer)
- `travel_mode` (VARCHAR - LOCAL/REMOTE)
- `location_lat`, `location_lng` (Decimal)
- `is_active` (Boolean)
- `created_at`, `updated_at` (DateTime)

#### `clients`
- `id` (UUID, Primary Key)
- `name`, `email`, `phone`
- `is_active` (Boolean)
- `created_at`, `updated_at` (DateTime)

#### `bookings`
- `id` (UUID, Primary Key)
- `professional_id`, `client_id` (Foreign Keys)
- `start_time`, `end_time` (DateTime)
- `duration_hours` (Integer)
- `total_price_cents` (Integer)
- `status` (VARCHAR - PENDING/PAID/CANCELLED)
- `stripe_payment_intent_id` (VARCHAR, nullable)
- `idempotency_key` (VARCHAR)
- `notes` (Text, nullable)
- `created_at`, `updated_at` (DateTime)

#### `availabilities`
- `id` (UUID, Primary Key)
- `professional_id` (Foreign Key)
- `day_of_week` (Integer, 0-6)
- `start_time`, `end_time` (Time)
- `is_active` (Boolean)

#### `idempotency_keys`
- `key` (VARCHAR, Primary Key)
- `request_hash` (VARCHAR)
- `response_data` (Text - JSON serialized)
- `expires_at` (DateTime)
- `created_at` (DateTime)

### Key Indexes
- **Bookings**: `(professional_id, start_time, end_time)` - Unique constraint for double-booking prevention
- **Bookings**: `(idempotency_key)` - For idempotency lookups
- **Professionals**: `(category, is_active)` - For search filtering
- **Professionals**: `(location_lat, location_lng)` - For distance calculations
- **Idempotency**: `(expires_at)` - For cleanup operations

## Critical Flows

### Booking Creation Flow
1. **Request Validation**: Validate DTO and check if start time is in the future
2. **Idempotency Check**: Look up existing idempotency key, return cached response if found
3. **Entity Validation**: Verify professional, client, and availability exist
4. **Conflict Detection**: Check for overlapping bookings using database query
5. **Price Calculation**: Calculate total price based on duration and hourly rate
6. **Booking Creation**: Create booking record within database transaction
7. **Response Caching**: Store response data with idempotency key

### Stripe Payment Confirmation Flow
1. **Webhook Reception**: Receive Stripe webhook with payment confirmation
2. **Idempotency Check**: Verify webhook hasn't been processed before
3. **Payment Verification**: Verify payment amount matches booking total
4. **Status Update**: Update booking status to PAID
5. **Event Logging**: Log successful payment for audit trail

## Key Considerations

### Double-Booking Prevention
- **Database Constraints**: Unique index prevents overlapping time slots
- **Application Logic**: Additional validation in service layer
- **Transaction Safety**: All operations wrapped in database transactions
- **Concurrency Handling**: Proper locking mechanisms for high-load scenarios

### Idempotency
- **Key Generation**: `{client_id}:{request_hash}:{timestamp}` format
- **Request Hashing**: SHA-256 hash of request body for conflict detection
- **TTL Management**: Configurable expiration times with background cleanup
- **Response Caching**: Store successful responses for duplicate request handling

### Monitoring & Observability
- **Logging**: Structured logging for all critical operations
- **Error Tracking**: Consistent error responses with appropriate HTTP status codes
- **Performance Metrics**: Response time tracking for key endpoints
- **Health Checks**: Application health endpoint for monitoring

### Security
- **Input Validation**: Comprehensive DTO validation using class-validator
- **SQL Injection Prevention**: TypeORM parameterized queries
- **Rate Limiting**: Consider implementing rate limiting for production
- **Data Sanitization**: Proper escaping of user inputs

## Future Considerations

### Scalability
- **Database Sharding**: Partition tables by date or geographic region
- **Caching Layer**: Redis for frequently accessed data
- **Load Balancing**: Multiple application instances behind load balancer
- **Message Queues**: Async processing for high-volume operations

### Microservices
- **Module Extraction**: Each module can become a separate service
- **Event-Driven Architecture**: Domain events for inter-service communication
- **API Gateway**: Centralized routing and authentication
- **Service Discovery**: Dynamic service registration and discovery
