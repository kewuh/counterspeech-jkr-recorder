const TwitterAPITracker = require('./twitter-api-tracker');

// Add the historical API calls we made earlier
const historicalCalls = [
    {
        timestamp: '2025-08-30T13:30:00.000Z',
        endpoint: '/users/by/username/jk_rowling',
        method: 'GET',
        success: true
    },
    {
        timestamp: '2025-08-30T13:31:00.000Z',
        endpoint: '/users/by/username/jk_rowling',
        method: 'GET',
        success: true
    },
    {
        timestamp: '2025-08-30T13:32:00.000Z',
        endpoint: '/users/1234567890/tweets', // JK Rowling's user ID
        method: 'GET',
        success: true
    },
    {
        timestamp: '2025-08-30T13:33:00.000Z',
        endpoint: '/tweets/1960860047497683431',
        method: 'GET',
        success: true
    },
    {
        timestamp: '2025-08-30T13:34:00.000Z',
        endpoint: '/users/by/username/jk_rowling',
        method: 'GET',
        success: true
    }
];

const tracker = new TwitterAPITracker();

console.log('📝 Adding historical API calls...');

historicalCalls.forEach(call => {
    tracker.logAPICall(call.endpoint, call.method, call.success);
});

console.log('✅ Historical calls added');
console.log('\n📊 Updated Statistics:');
tracker.displayStats();
