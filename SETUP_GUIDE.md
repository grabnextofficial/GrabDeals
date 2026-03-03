# E-Store Setup Guide

## Prerequisites

Before deploying, ensure you have the following environment variables configured:

### 1. Telegram Configuration (Optional)
If you want file uploads to work with Telegram storage:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### 2. Database Configuration
The app uses Cloudflare D1 database. The database binding is configured in `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "estore-db"
database_id = "54271b5e-319c-4f43-81c6-ce4dd44bc1b6"
```

## Running the Application

### Local Development

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Open browser to `http://localhost:3000`

4. **Initialize the database** by visiting:
   ```
   http://localhost:3000/api/init
   ```
   This creates all necessary tables.

### Deployment to Vercel/Cloudflare Pages

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard (if using Telegram uploads)
4. Deploy

After deployment, initialize the database by visiting the `/api/init` endpoint once.

## Database Initialization

The `/api/init` endpoint creates these tables:
- **categories** - Product categories
- **products** - Product listings
- **orders** - Customer orders

You can call it manually:
```bash
curl https://your-domain.com/api/init
```

## API Endpoints

### Products
- `GET /api/products` - Fetch all active products
- `POST /api/products` - Create new product (admin)

### Categories
- `GET /api/categories` - Fetch all categories
- `POST /api/categories` - Create new category (admin)

### Orders
- `GET /api/orders` - Fetch all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/user/[userId]` - Fetch user's orders

### Upload
- `POST /api/upload` - Upload file to Telegram (requires TELEGRAM env vars)

## Features

### Customer Features
- ✅ Browse products by category
- ✅ Search products
- ✅ Add to cart
- ✅ Checkout with Stripe (optional)
- ✅ Download purchased items
- ✅ View order history

### Admin Features
- ✅ Dashboard with statistics
- ✅ Product management (create, edit, delete)
- ✅ Category management
- ✅ Order management
- ✅ User management
- ✅ Analytics and reports

## Troubleshooting

### "API returning 500 errors"
1. Make sure database is initialized via `/api/init`
2. Check Cloudflare D1 configuration
3. Verify database name and ID in `wrangler.toml`

### "Images not loading"
1. If using Telegram uploads, ensure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set
2. Otherwise, app will use placeholder images automatically

### "Blank page or no products showing"
1. Check browser console for errors (should be none now)
2. Try refreshing the page
3. Ensure database tables exist (visit `/api/init`)

## File Structure

```
/app
  /admin - Admin dashboard pages
  /api - API routes
  /auth - Authentication pages
  /cart - Cart page
  /categories - Category browsing
  /products - Product listings
  /profile - User profile
  /dashboard - User dashboard

/components
  - UI components
  - Product cards
  - Cart drawer
  - Admin components

/lib
  - Database client
  - Types and interfaces
  - Utility functions

/contexts
  - Auth context
  - Cart context

/styles
  - Tailwind CSS configuration
```

## Performance Notes

- Database queries use indexes for fast lookups
- Products are cached where possible
- Images are lazy-loaded
- Admin routes are protected with authentication

## Security Features

- Row-level security (RLS) ready for Supabase migration
- Password hashing for authentication
- API rate limiting
- CSRF protection
- Input validation

## Next Steps

1. Initialize the database: `/api/init`
2. Configure Stripe (optional) for payments
3. Set up Telegram (optional) for file uploads
4. Add admin user via admin panel
5. Start adding products and categories
6. Configure email for order notifications (future feature)

For more details, check individual component documentation and API comments in the codebase.
