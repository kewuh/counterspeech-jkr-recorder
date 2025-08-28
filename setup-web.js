const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🌐 Setting up JK Rowling Tweet Viewer Web Interface...\n');

// Check if .env file exists and has Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing Supabase credentials in .env file');
    console.log('Please add your Supabase credentials to .env:');
    console.log('SUPABASE_URL=your_supabase_project_url');
    console.log('SUPABASE_ANON_KEY=your_supabase_anon_key');
    process.exit(1);
}

// Read the app.js file
const appJsPath = path.join(__dirname, 'public', 'app.js');
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

// Replace the placeholder values with actual credentials
appJsContent = appJsContent.replace(
    "const SUPABASE_URL = 'https://your-project.supabase.co';",
    `const SUPABASE_URL = '${supabaseUrl}';`
);

appJsContent = appJsContent.replace(
    "const SUPABASE_ANON_KEY = 'your-anon-key';",
    `const SUPABASE_ANON_KEY = '${supabaseAnonKey}';`
);

// Write the updated file
fs.writeFileSync(appJsPath, appJsContent);

console.log('✅ Supabase credentials configured in public/app.js');
console.log('✅ Web interface is ready to use!\n');

console.log('🚀 To start the web interface:');
console.log('   npm run web');
console.log('   or');
console.log('   npm run web:dev (for development with auto-reload)\n');

console.log('📱 Open your browser and go to:');
console.log('   http://localhost:3000\n');

console.log('🔧 Features included:');
console.log('   ✅ Real-time search');
console.log('   ✅ Filter by popularity/recent');
console.log('   ✅ Engagement statistics');
console.log('   ✅ Direct links to Twitter');
console.log('   ✅ Mobile responsive design');
console.log('   ✅ Load more pagination\n');

console.log('💡 Tips:');
console.log('   - The interface will automatically load tweets from your Supabase database');
console.log('   - Search works in real-time as you type');
console.log('   - Use the filter buttons to sort by recent or popular tweets');
console.log('   - Click "View on Twitter" to see the original tweet');
console.log('   - The interface is fully responsive for mobile devices\n');
