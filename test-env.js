require('dotenv').config();

console.log('🔍 Environment Variables Test');
console.log('=============================');
console.log('STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Not set');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Not set');

if (process.env.STRIPE_PUBLISHABLE_KEY) {
    console.log('Publishable key starts with:', process.env.STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...');
} else {
    console.log('❌ No publishable key found in .env file');
}

if (process.env.STRIPE_SECRET_KEY) {
    console.log('Secret key starts with:', process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...');
} else {
    console.log('❌ No secret key found in .env file');
}
