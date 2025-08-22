# Hotel Booking System - Design & Architecture Document

## 1. Assumptions

- **Business Rules**: 
  - Professionals have fixed hourly rates and availability windows
  - Bookings are time-bound with start_time and calculated end_time
  - Travel mode affects pricing (local vs. travel required)
  - Stripe handles payment processing with webhook confirmations
  - System operates in a single timezone initially

- **Technical Constraints**:
  - NestJS backend with SQLite for development, Postgres for production
  - RESTful API design
  - Stateless application architecture
  - Eventual consistency acceptable for search results

## 2. High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps  │    │   Load Balancer │    │   NestJS API    │
│   (Web/Mobile) │───▶│   (Nginx/ALB)   │───▶│   (Multiple    │
└─────────────────┘    └─────────────────┘    │   Instances)    │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   Database      │
                                              │   (PostgreSQL)  │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   Redis Cache   │
                                              │   (Sessions,   │
                                              │   Idempotency)  │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   Stripe API    │
                                              │   (Payments)    │
                                              └─────────────────┘
```

**Architecture Justification**:
- **Microservices-ready**: Modular design allows future service separation
- **Scalable**: Stateless API instances can be horizontally scaled
- **Resilient**: Redis provides caching and idempotency key storage
- **Secure**: Stripe handles sensitive payment data
- **Maintainable**: Clear separation of concerns with NestJS modules

## 3. Database Design

### Core Tables

**professionals**
```sql
- id (UUID, PK)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- category (VARCHAR)
- hourly_rate_cents (INTEGER)
- travel_mode (ENUM: 'local', 'travel')
- location_lat (DECIMAL)
- location_lng (DECIMAL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**availabilities**
```sql
- id (UUID, PK)
- professional_id (UUID, FK)
- day_of_week (INTEGER, 0-6)
- start_time (TIME)
- end_time (TIME)
- is_active (BOOLEAN)
```

**bookings**
```sql
- id (UUID, PK)
- professional_id (UUID, FK)
- client_id (UUID, FK)
- start_time (TIMESTAMP)
- end_time (TIMESTAMP)
- total_price_cents (INTEGER)
- status (ENUM: 'pending', 'confirmed', 'cancelled')
- stripe_payment_intent_id (VARCHAR)
- idempotency_key (VARCHAR, UNIQUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**clients**
```sql
- id (UUID, PK)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- phone (VARCHAR)
- created_at (TIMESTAMP)
```

**idempotency_keys**
```sql
- key (VARCHAR, PK)
- request_hash (VARCHAR)
- response_data (JSONB)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

### Key Indexes
- `bookings(professional_id, start_time, end_time)` - For overlap detection
- `bookings(idempotency_key)` - For idempotency lookups
- `professionals(category, location_lat, location_lng)` - For search optimization
- `availabilities(professional_id, day_of_week)` - For availability checks

## 4. Critical Flows

### Booking Creation Flow
```
1. Client → POST /bookings
2. Validate idempotency key
3. Check professional availability
4. Detect booking conflicts (overlapping times)
5. Calculate end_time and total_price_cents
6. Create booking record (status: 'pending')
7. Create Stripe PaymentIntent
8. Return booking details + payment_intent_client_secret
```

### Stripe Payment Confirmation Flow
```
1. Stripe → Webhook /stripe/webhook
2. Validate webhook signature
3. Extract payment_intent_id
4. Update booking status to 'confirmed'
5. Send confirmation email to client
6. Update professional calendar
```

## 5. Key Considerations

### Double-Booking Prevention
- **Database-level constraints**: Unique constraint on (professional_id, start_time, end_time)
- **Application-level validation**: Check for overlaps before insertion
- **Optimistic locking**: Use version numbers for concurrent updates
- **Transaction isolation**: SERIALIZABLE level for critical booking operations

### Idempotency
- **Key scope**: Global across all endpoints
- **Storage**: Redis with TTL (24 hours)
- **Key format**: `{client_id}:{request_hash}:{timestamp}`
- **Cleanup**: Automatic expiration + background job for cleanup

### Monitoring
- **Application metrics**: Response times, error rates, throughput
- **Business metrics**: Booking success rate, payment conversion
- **Infrastructure**: CPU, memory, database connections
- **Alerts**: High error rates, payment failures, double-booking attempts

### Security
- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control (client, professional, admin)
- **Input validation**: Strict schema validation for all inputs
- **Rate limiting**: Per-client and per-endpoint limits
- **SQL injection**: Parameterized queries only
- **XSS protection**: Input sanitization and output encoding
