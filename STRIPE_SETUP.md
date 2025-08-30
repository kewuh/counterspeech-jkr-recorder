# Stripe Setup Guide

## 1. Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete your business verification
3. Get your API keys from the Dashboard

## 2. Add Environment Variables
Add these to your `.env` file:

```
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 3. Install Stripe Dependencies
```bash
npm install stripe
```

## 4. Set Up Payment Intent System
The system will:
1. Create a PaymentIntent when user pledges
2. Authorize the full monthly amount
3. Capture charges up to the limit when transphobic content is detected
4. Reset monthly limits

## 5. Webhook Setup
Set up webhooks for:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.succeeded`

## 6. Monthly Processing
- Process charges at the end of each month
- Send email receipts to donors
- Update pledge status
