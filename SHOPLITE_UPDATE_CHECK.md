# ShopLite Update Check

## This update
- Admin Product Catalog now uses temporary toast notifications instead of persistent success messages.
- Added Active/Inactive product lifecycle with a dedicated Activate action.
- Added product status control while editing.
- Added Admin product search, status filters, low-stock and out-of-stock filters, and sorting.
- Improved product stock/status presentation in the Inventory view.
- Kept inactive products in the admin catalog instead of deleting them.
- Customer-facing Product Service continues to return only active products.
- Added backend `PATCH /admin/products/:id/status` with ADMIN authorization and status validation.
- Existing DELETE admin product action remains a safe deactivation operation for compatibility.

## Validation performed
- Product Service JavaScript syntax checked with `node --check`.
- Balanced-brace/parenthesis/bracket checks passed for the modified JSX/CSS/JS files.
- Frontend `npm run build` was attempted, but this environment does not have the frontend dependencies installed and package downloads were unavailable. Therefore a successful Vite build could not be claimed here.

## Run locally
```bash
cd frontend
npm install
npm run build
npm run dev
```

Start the existing backend services and API Gateway as before.
