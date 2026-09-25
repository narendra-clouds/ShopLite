# ShopLite Update Check — September 2026

## Fixed in this build

- Admin can add a product image using a local image file (JPG/PNG/WEBP/etc.).
- Image preview is shown before saving and can be removed.
- Browser image uploads are limited to 2 MB and are sent as a data URL for this in-memory learning stage.
- Product Service accepts the larger JSON payload needed for image data.
- Product images are displayed in the customer catalog, product details, admin catalog, and order items.
- Orders now store a delivery-address snapshot, customer name/email, item name/price/image snapshots, line totals, and order total.
- Admin Orders now show customer information, full delivery address, order items, total, and status controls.
- Customer My Orders now shows the delivery address and an order-status tracker.
- Order stock reservation aggregates duplicate product lines before checking stock.
- Backend stock validation and rollback remain enforced by Product Service / Order Service.
- Existing user-specific cart, wishlist, and saved-address localStorage isolation is preserved.
- Admin API authorization remains backend-enforced through the authenticated ADMIN role.

## Important learning-stage limitation

ShopLite currently keeps product/order data in service memory. Uploaded product images therefore survive while the Product Service process is running, but they are not durable storage. PostgreSQL/object storage can be introduced later when the project reaches the database/AWS phase.

## Validation performed

- Node syntax checks passed for Order Service, Product Service, User Service, and API Gateway.
- Frontend production build could not be completed in this environment because Vite dependencies could not be downloaded/installed within the available execution environment. The source files were checked structurally, but a successful `npm run build` is not claimed.
