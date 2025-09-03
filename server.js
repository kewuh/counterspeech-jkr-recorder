const express = require('express');
const path = require('path');
const config = require('./config');
const app = express();
const PORT = process.env.PORT || 3000;

// Add JSON body parsing
app.use(express.json());

// Enable CORS for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve the pledge page at root (main domain)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pledge.html'));
});

// Serve the AI analysis page at /ai route
app.get('/ai', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Keep the original pledge route for backward compatibility
app.get('/pledge', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pledge.html'));
});

// Handle www subdomain routing (for when deployed)
app.get('/www', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pledge.html'));
});

// Serve pledge page version 2
app.get('/pledge-v2', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pledge-v2.html'));
});

// Serve the admin dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve static files from public directory (after custom routes)
app.use(express.static(path.join(__dirname, 'public')));

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

// Admin API endpoints
app.get('/api/admin/pledges', async (req, res) => {
    try {
        if (!stripeAPI || !stripeAPI.supabase) {
            return res.status(500).json({ success: false, error: 'Database not connected' });
        }
        
        const { data: pledges, error } = await stripeAPI.supabase
            .from('pledges')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });
            
        if (error) {
            throw new Error(error.message);
        }
        
        res.json({ success: true, pledges: pledges || [] });
    } catch (error) {
        console.error('Error fetching pledges:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/admin/recent-posts', async (req, res) => {
    try {
        if (!stripeAPI || !stripeAPI.supabase) {
            return res.status(500).json({ success: false, error: 'Database not connected' });
        }
        
        const { data: posts, error } = await stripeAPI.supabase
            .from('transphobic_posts')
            .select('*, pledges(email)')
            .order('created_at', { ascending: false })
            .limit(20);
            
        if (error) {
            throw new Error(error.message);
        }
        
        res.json({ success: true, posts: posts || [] });
    } catch (error) {
        console.error('Error fetching recent posts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/admin/run-monthly-billing', async (req, res) => {
    if (!stripeAPI) {
        return res.status(503).json({ 
            success: false, 
            error: 'Payment system not available. Please add Stripe keys to .env file.' 
        });
    }
    try {
        const result = await stripeAPI.processMonthlyCharges();
        res.json(result);
    } catch (error) {
        console.error('Error running monthly billing:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/admin/test-tracking', async (req, res) => {
    try {
        if (!stripeAPI || !stripeAPI.supabase) {
            return res.status(500).json({ success: false, error: 'Database not connected' });
        }
        
        // Get first active pledge
        const { data: pledges, error: pledgeError } = await stripeAPI.supabase
            .from('pledges')
            .select('*')
            .eq('status', 'active')
            .limit(1);
            
        if (pledgeError || !pledges || pledges.length === 0) {
            return res.status(404).json({ success: false, error: 'No active pledges found' });
        }
        
        const pledge = pledges[0];
        const tweetId = `test_tweet_${Date.now()}`;
        
        const result = await stripeAPI.trackTransphobicPost(pledge.id, tweetId);
        res.json(result);
    } catch (error) {
        console.error('Error testing tracking:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get recent public pledgers
app.get('/api/recent-public-pledgers', async (req, res) => {
    try {
        if (!stripeAPI) {
            return res.status(503).json({ 
                success: false, 
                error: 'Payment system not available. Please add Stripe keys to .env file.' 
            });
        }
        
        const result = await stripeAPI.getRecentPublicPledgers(3);
        res.json(result);
    } catch (error) {
        console.error('Error fetching recent public pledgers:', error);
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
