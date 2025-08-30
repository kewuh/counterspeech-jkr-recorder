const express = require('express');
const path = require('path');
const config = require('./config');
const app = express();
const PORT = process.env.PORT || 3000;

// Add JSON body parsing
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the pledge page
app.get('/pledge', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pledge.html'));
});

// Serve Stripe config with actual key
app.get('/stripe-config.js', (req, res) => {
    const configContent = `window.STRIPE_PUBLISHABLE_KEY = '${config.stripe.publishableKey}';`;
    res.setHeader('Content-Type', 'application/javascript');
    res.send(configContent);
});

// Stripe API endpoints (optional)
let stripeAPI = null;
try {
    const StripeAPI = require('./stripe-api');
    stripeAPI = new StripeAPI();
} catch (error) {
    console.log('⚠️  Stripe not available - add your Stripe keys to .env file to enable payment features');
}

// Create pledge endpoint
app.post('/api/create-pledge', async (req, res) => {
    if (!stripeAPI) {
        return res.status(503).json({ 
            success: false, 
            error: 'Payment system not available. Please add Stripe keys to .env file.' 
        });
    }
    try {
        const result = await stripeAPI.createPledge(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get pledge stats endpoint
app.get('/api/pledge-stats', async (req, res) => {
    if (!stripeAPI) {
        return res.json({
            totalPledges: 0,
            totalMonthlyLimit: 0,
            totalCharged: 0,
            availableForCharging: 0
        });
    }
    try {
        const stats = await stripeAPI.getPledgeStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Process transphobic charge endpoint
app.post('/api/process-charge', async (req, res) => {
    if (!stripeAPI) {
        return res.status(503).json({ 
            success: false, 
            error: 'Payment system not available. Please add Stripe keys to .env file.' 
        });
    }
    try {
        const { pledgeId, tweetId } = req.body;
        const result = await stripeAPI.processTransphobicCharge(pledgeId, tweetId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 JK Rowling Tweet Viewer running on http://localhost:${PORT}`);
    console.log(`📱 Open your browser and navigate to the URL above`);
    console.log(`🔧 Make sure to update the Supabase credentials in public/app.js`);
});

module.exports = app;
