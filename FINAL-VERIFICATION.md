# ShopLite Final Verification

This version includes the Admin Reviews route fix.

## Core URLs
- Frontend: http://localhost:5173
- Gateway: http://localhost:8080
- Gateway health: http://localhost:8080/health
- Service health: http://localhost:8080/health/services

## Review flow
1. Customer submits a review through Review Service via `POST /reviews`.
2. Admin opens the Admin Dashboard > Reviews.
3. Frontend requests `GET /admin/reviews` through the API Gateway.
4. Gateway forwards `/admin/reviews` to Review Service.
5. Review Service requires an authenticated ADMIN role.
6. Admin can search/filter and delete reviews through `DELETE /reviews/:id`.

## Important
Use a fresh extraction of this ZIP. Do not mix files from previous ShopLite ZIPs. Run `INSTALL-ALL.bat` once, then `start-all.bat`.
