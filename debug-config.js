const config = require('./config');

console.log('🔍 Config Debug');
console.log('==============');
console.log('Config object:', config);
console.log('Stripe config:', config.stripe);
console.log('Publishable key:', config.stripe.publishableKey);
console.log('Secret key:', config.stripe.secretKey ? 'Present' : 'Missing');

// Test the exact line that's failing
const configContent = `window.STRIPE_PUBLISHABLE_KEY = '${config.stripe.publishableKey}';`;
console.log('Generated config content:', configContent);
