# Deep Thinking Questions - Senior Backend Developer Assessment

## 1. Double-Booking Prevention Under Load

**How would you prevent double-booking when multiple users try to book the same professional at the same time?**

- **Database-level constraints**: Unique composite index on `(professional_id, start_time, end_time)` prevents overlapping time slots at the database level
- **Application-level validation**: Check for conflicts before creating booking using a transaction with `SELECT FOR UPDATE` or similar locking mechanism
- **Idempotency keys**: Each booking request gets a unique key, so duplicate requests return the same result instead of creating conflicts
- **Optimistic locking**: Use version numbers or timestamps to detect concurrent modifications
- **Queue-based processing**: For high-load scenarios, implement a message queue to serialize booking requests

## 2. Idempotency Key Scoping and Cleanup

**How would you scope idempotency keys and handle cleanup?**

- **Key scoping**: Use format `{client_id}:{request_hash}:{timestamp}` to scope keys per client and request
- **TTL-based expiration**: Set reasonable expiration times (24-48 hours) based on business requirements
- **Background cleanup job**: Run a scheduled task to delete expired keys using `DELETE FROM idempotency_keys WHERE expires_at < NOW()`
- **Database partitioning**: For high-volume systems, partition the idempotency table by date to improve cleanup performance
- **Monitoring**: Track key usage patterns and adjust TTL based on actual usage

## 3. Scaling Search Traffic 10x

**How would you scale the professional search endpoint to handle 10x more traffic?**

- **Database indexing**: Add composite indexes on `(category, is_active)`, `(location_lat, location_lng)`, and `(hourly_rate_cents)`
- **Caching layer**: Implement Redis caching for search results with appropriate TTL
- **Read replicas**: Use database read replicas to distribute search queries
- **Pagination**: Implement cursor-based pagination instead of offset-based for better performance
- **CDN**: Cache static search results at the edge for frequently searched locations
- **Search optimization**: Use full-text search engines like Elasticsearch for complex queries

## 4. Reliable Stripe Webhook Handling

**How would you make Stripe webhook handling reliable and idempotent?**

- **Idempotency keys**: Use Stripe's built-in idempotency keys for webhook processing
- **Event deduplication**: Store processed webhook event IDs to prevent duplicate processing
- **Retry mechanism**: Implement exponential backoff retry logic for failed webhook processing
- **Dead letter queue**: Route failed webhooks to a separate queue for manual investigation
- **Database transactions**: Wrap webhook processing in database transactions to ensure data consistency
- **Monitoring**: Track webhook success rates and alert on failures

## 5. Module Separation for Future Architecture

**How would you separate modules to allow future architecture splits?**

- **Domain-driven design**: Organize modules by business domain (bookings, professionals, clients, payments)
- **Interface segregation**: Define clear interfaces between modules to minimize coupling
- **Event-driven communication**: Use domain events for cross-module communication instead of direct dependencies
- **Shared kernel**: Extract common entities and utilities into a shared module
- **API gateway pattern**: Implement an API gateway to route requests to appropriate modules
- **Database per module**: Consider separate databases per module for true microservice architecture
