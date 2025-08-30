# Monthly Billing Setup Guide

## Automated Monthly Billing

### Option 1: Server Cron Job (Recommended)

1. **Access your server's crontab:**
   ```bash
   crontab -e
   ```

2. **Add this line to run monthly billing on the 1st of each month at 2 AM:**
   ```bash
   0 2 1 * * cd /path/to/your/counterspeech-jkr-recorder && node monthly-billing-cron.js >> /var/log/monthly-billing.log 2>&1
   ```

3. **Save and exit** (Ctrl+X in nano, or :wq in vim)

### Option 2: GitHub Actions (If hosted on GitHub)

Create `.github/workflows/monthly-billing.yml`:

```yaml
name: Monthly Billing

on:
  schedule:
    - cron: '0 2 1 * *'  # 1st of each month at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  monthly-billing:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Run monthly billing
      run: node monthly-billing-cron.js
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

### Option 3: Manual Monthly Billing

Run this command manually at the end of each month:

```bash
node monthly-billing-cron.js
```

## Billing Process Details

### What Happens During Monthly Billing:

1. **Fetches all active pledges** with transphobic posts
2. **Calculates total charge** for each pledge
3. **Creates PaymentIntent** for the total amount
4. **Charges the customer** using saved payment method
5. **Updates database** with charge details
6. **Resets counters** for next month
7. **Sends email receipts** (if configured)

### Example Output:

```
💰 Processing Monthly Billing...

✅ Monthly billing completed successfully!
📊 Processed 3 pledges:

✅ john@example.com: £3.50 (7 posts)
✅ jane@example.com: £1.00 (2 posts)
✅ bob@example.com: £0.50 (1 post)

📈 Summary:
   Total charged: £5.00
   Successful charges: 3
   Failed charges: 0
```

## Monitoring and Logs

### Check Billing Status:

```bash
# View current pledge stats
curl http://localhost:3000/api/pledge-stats

# Check recent charges
node check-stripe-customers.js
```

### Log Files:

- **Server logs**: Check your server's log files
- **Stripe dashboard**: View all charges and customers
- **Supabase dashboard**: Check pledge and charge tables

## Troubleshooting

### Common Issues:

1. **Failed charges**: Check payment method validity
2. **Missing pledges**: Verify database connectivity
3. **Incorrect amounts**: Check transphobic post counting

### Manual Recovery:

```bash
# Re-run billing for failed charges
node monthly-billing-cron.js

# Check specific pledge
node test-monthly-billing.js
```
