# ShopLite

Simple Shopping. Better Experience.

ShopLite is a local learning project for React, Node.js microservices, API Gateway, authentication, product management, orders, inventory protection, cancellation, reviews and later Docker/Kubernetes/Jenkins/AWS.

## Services

- Frontend: http://localhost:5173
- API Gateway: http://localhost:8080
- User Service: http://localhost:3001
- Product Service: http://localhost:3002
- Order Service: http://localhost:3003
- Notification Service: http://localhost:3004
- Review Service: http://localhost:3005

Gateway health:

- http://localhost:8080/health
- http://localhost:8080/health/services

## Fresh setup on Windows

Use Node.js 20.19+ (or Node.js 22.12+) and npm. Extract this ZIP into a fresh ShopLite folder. Do not mix files with an older ShopLite copy.

Run `INSTALL-ALL.bat` once, or run `npm install` once in each folder:

```text
frontend
 gateway
services/user-service
services/product-service
services/order-service
services/notification-service
services/review-service
```

Then double-click `start-all.bat`.

Or run `npm run dev` manually in each folder.

## Demo admin account

- Email: `admin@shoplite.com`
- Password: `admin123`

For a non-demo deployment, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` as environment variables and replace the temporary in-memory authentication before production use.

## Current behavior

- User data is isolated by user id for cart, wishlist and addresses in the browser.
- Orders are isolated by authenticated user identity in Order Service.
- Admin access is enforced by backend authorization.
- Product stock is validated by Product Service and reserved by Order Service.
- Customer cancellation is allowed for `PLACED`, `CONFIRMED`, and `PACKED` orders.
- Cancellation restores reserved inventory and cancelled orders are excluded from Admin Net Sales.
- Cancelled orders cannot be reopened.
- Customer orders contain product-name/price/image snapshots, so My Orders does not depend on Product Service to render historical order details.
- Product reviews are available through Review Service.
- Coupons and discount codes are intentionally not included.
- Backend data is still in memory for learning. Restarting a service resets its in-memory data.

## Important

ShopLite is a development/learning project. Authentication, storage, payment processing and service-to-service security are intentionally simplified. The next major learning phases are PostgreSQL/database-per-service, Inventory Service, RabbitMQ/Kafka, Docker, Kubernetes, observability, Jenkins and AWS.
