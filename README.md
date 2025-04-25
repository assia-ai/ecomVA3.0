# ecommva - Email Assistant for Shopify Merchants

## Stripe Integration Setup

### Test Mode Configuration (Current Setup)

The application is currently configured to use Stripe in **TEST MODE** for development and testing purposes.

1. Environment variables:
   - `VITE_STRIPE_PUBLISHABLE_KEY` - Your Stripe **test** publishable key
   - `STRIPE_SECRET_KEY` - Your Stripe **test** secret key (server-side only)
   - `STRIPE_WEBHOOK_SECRET` - Your Stripe **test** webhook signing secret

2. Test cards:
   - Success: `4242 4242 4242 4242`
   - Requires Authentication: `4000 0025 0000 3155`
   - Declined: `4000 0000 0000 0002`

### Prerequisites

1. Stripe account with API keys
2. Supabase project with the Edge Functions enabled

### Configuration

1. Set environment variables:
   - `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
   - `STRIPE_SECRET_KEY` - Your Stripe secret key (only on the server)
   - `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret

2. Create products and prices in the Stripe Dashboard:
   - Create a product for the Pro plan
   - Set up a recurring price of €49/month

3. Update the price IDs in the application code:
   - The price ID should match the ID from your Stripe dashboard
   - Update the `priceInCents` value to match your pricing

### Webhook Setup

1. In your Stripe Dashboard, go to Developers > Webhooks
2. Add an endpoint pointing to: `https://your-supabase-project.functions.supabase.co/stripe-webhook`
3. Select the following events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Testing

1. Use Stripe test mode for development
2. Test cards:
   - Success: `4242 4242 4242 4242`
   - Requires Authentication: `4000 0025 0000 3155`
   - Declined: `4000 0000 0000 0002`

### Deployment

1. Deploy the Supabase Edge Functions:
   ```
   supabase functions deploy create-checkout-session
   supabase functions deploy create-customer-portal-session
   supabase functions deploy stripe-webhook
   ```

2. Configure the environment variables in your Supabase project:
   ```
   supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

### Going Live

When you're ready to go live with real payments:

1. Switch to Stripe live mode in the Stripe Dashboard
2. Update environment variables with live keys in `.env.production`
3. Update webhook endpoints to point to production URLs
4. Test end-to-end with a real payment

## Database Setup

Run the included migration in your Supabase project to create the necessary tables for Stripe integration.