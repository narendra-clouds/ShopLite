
## Current learning milestone

This version adds the first administration and correctness layer while keeping the project intentionally simple.

### Customer data isolation

Cart, wishlist and saved addresses are now stored using user-scoped browser keys:

- `shopliteCart_<userId>`
- `shopliteWishlist_<userId>`
- `shopliteAddresses_<userId>`

A customer's local data is not reused by the next logged-in customer.

### Authentication and roles

The User Service now returns a short-lived-in-process session token and a role (`USER` or `ADMIN`). The browser keeps the user profile in localStorage and the session token in sessionStorage. Passwords are never stored in browser storage.

For this learning build, the default admin account is:

- Email: `admin@shoplite.com`
- Password: `admin123`

For any non-demo deployment, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` as environment variables and replace the temporary in-memory authentication with a persistent identity system.

### Admin Dashboard

Admin users can open **Admin Dashboard** from the account menu and manage:

- Dashboard statistics
- Users
- Products
- Orders
- Inventory view

Product changes go through Product Service. Products are still API-driven on the customer frontend.

### Product management

Admin APIs support:

- Add product
- Edit product
- Update price
- Update stock
- Update category/description/image
- Deactivate product instead of permanently deleting it

### Stock protection

Customer quantity controls stop at available stock. Order Service also checks current product stock and reserves stock through Product Service. Internal stock changes require the service-to-service internal key. Failed reservations attempt a rollback.

### User-specific orders

The Order Service derives the customer identity from the authenticated session rather than trusting a `userId` supplied by the browser. Admins can view all orders; normal users receive only their own orders.

### Important limitation

The current project still uses in-memory backend data. Restarting a service resets users, products, orders and sessions. PostgreSQL, database-per-service persistence, Inventory Service, message broker, observability, Docker, Kubernetes, Jenkins and AWS remain later learning phases.
