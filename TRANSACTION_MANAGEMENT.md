# Transaction Management Guide

## 🧪 Testing Transaction System

### 1. **Comprehensive System Test**
```bash
# Run complete transaction system test
node test-transaction-system.js
```

This test will:
- ✅ Check current system state
- ✅ Verify payment method validity
- ✅ Simulate transphobic posts
- ✅ Test monthly billing process
- ✅ Provide management recommendations

### 2. **Quick Health Check**
```bash
# Check basic system status
node monitor-pledges.js
```

### 3. **Test Individual Components**
```bash
# Test pledge creation
node test-new-pledge.js

# Test monthly billing
node test-monthly-billing.js

# Check Stripe integration
node test-stripe-complete.js
```

## 💳 Payment Method Validation

### **Why Payment Methods Can Fail:**
- **Expired cards** - Cards expire and become invalid
- **Insufficient funds** - Account doesn't have enough money
- **Card restrictions** - Bank blocks the transaction
- **Stolen/lost cards** - Customer reports card as lost
- **Account closures** - Customer closes their account

### **How to Test Payment Methods:**
```bash
# Test payment method validity
node test-payment-methods.js
```

### **Monitoring Payment Methods:**
- **Weekly checks** - Verify all payment methods are valid
- **Monthly validation** - Before running monthly billing
- **Failed charge alerts** - Set up notifications for failed charges

## 📅 Transaction Management Schedule

### **Daily Tasks:**
- **Monitor transphobic posts** - Check if new posts are being tracked
- **Review system logs** - Check for any errors or issues
- **Verify system health** - Ensure all components are working

### **Weekly Tasks:**
- **Check payment method validity** - Ensure cards are still valid
- **Review pledge statistics** - Monitor pledge growth and activity
- **Backup pledge data** - Export current pledge information

### **Monthly Tasks:**
- **Run monthly billing** - Process charges for all pledges
- **Review failed charges** - Handle any payment failures
- **Update payment methods** - Contact customers with invalid cards
- **Generate monthly report** - Summary of all transactions

## 🔄 Automated Transaction Management

### **1. Cron Job Setup (Recommended)**
```bash
# Add to your server's crontab
crontab -e

# Monthly billing on 1st of each month at 2 AM
0 2 1 * * cd /path/to/your/project && node monthly-billing-cron.js >> /var/log/monthly-billing.log 2>&1

# Weekly payment method validation on Sundays at 3 AM
0 3 * * 0 cd /path/to/your/project && node validate-payment-methods.js >> /var/log/payment-validation.log 2>&1
```

### **2. GitHub Actions (Alternative)**
Create `.github/workflows/transaction-management.yml`:
```yaml
name: Transaction Management

on:
  schedule:
    - cron: '0 2 1 * *'  # Monthly billing
    - cron: '0 3 * * 0'  # Weekly validation
  workflow_dispatch:  # Manual trigger

jobs:
  monthly-billing:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '18'
    - run: npm install
    - run: node monthly-billing-cron.js
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

## 📊 Transaction Monitoring

### **Key Metrics to Track:**
- **Total pledges** - Number of active pledges
- **Monthly limits** - Total potential monthly revenue
- **Transphobic posts** - Number of posts tracked
- **Successful charges** - Amount successfully charged
- **Failed charges** - Amount that failed to charge
- **Payment method validity** - Percentage of valid payment methods

### **Monitoring Tools:**
1. **System Status** - Check server logs and health
2. **Stripe Dashboard** - `https://stripe.com/dashboard`
3. **Supabase Dashboard** - Your Supabase project dashboard
4. **Command line tools** - Various test scripts

## ⚠️ Error Handling & Recovery

### **Common Issues & Solutions:**

#### **1. Failed Payment Methods**
```bash
# Check which payment methods are invalid
node check-payment-methods.js

# Contact customers to update payment methods
# Send email notifications for failed charges
```

#### **2. Insufficient Funds**
- **Retry logic** - Automatically retry failed charges
- **Customer notification** - Email customers about failed charges
- **Grace period** - Allow customers time to add funds

#### **3. System Errors**
- **Log monitoring** - Check logs for system errors
- **Database backups** - Regular backups of pledge data
- **Fallback procedures** - Manual processes for critical failures

### **Recovery Procedures:**
```bash
# Manual monthly billing recovery
node monthly-billing-cron.js

# Reset failed pledge counters
node reset-failed-pledges.js

# Export pledge data for backup
node export-pledge-data.js
```

## 📈 Best Practices

### **1. Regular Testing**
- **Test monthly billing** before the actual billing date
- **Validate payment methods** weekly
- **Monitor system health** daily

### **2. Customer Communication**
- **Email notifications** for failed charges
- **Monthly receipts** for successful charges
- **Pledge updates** when limits are reached

### **3. Data Management**
- **Regular backups** of pledge data
- **Audit trails** for all transactions
- **Compliance** with data protection regulations

### **4. Security**
- **Secure API keys** - Never expose Stripe keys
- **Access control** - Admin dashboard disabled for security
- **Data encryption** - Ensure sensitive data is encrypted

## 🚨 Emergency Procedures

### **If Monthly Billing Fails:**
1. **Check logs** - Review error messages
2. **Verify payment methods** - Ensure cards are valid
3. **Manual processing** - Run billing manually if needed
4. **Customer support** - Contact customers with issues

### **If System Goes Down:**
1. **Check server status** - Verify server is running
2. **Database connectivity** - Ensure Supabase is accessible
3. **Stripe connectivity** - Verify Stripe API is working
4. **Restore from backup** - If necessary, restore from backup

## 📞 Support Resources

### **Stripe Support:**
- **Documentation** - https://stripe.com/docs
- **Support** - https://support.stripe.com
- **Status page** - https://status.stripe.com

### **Supabase Support:**
- **Documentation** - https://supabase.com/docs
- **Support** - https://supabase.com/support
- **Status page** - https://status.supabase.com

### **Your System:**
- **System Monitoring** - Server logs and health checks
- **Test Scripts** - Various `.js` files in the project
- **Logs** - Check server logs for errors
