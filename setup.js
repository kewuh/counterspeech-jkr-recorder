const fs = require('fs');
const path = require('path');

console.log('🚀 Junkipedia to Supabase Connector Setup');
console.log('==========================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  
  const envContent = `# Junkipedia API Configuration
JUNKIPEDIA_API_KEY=hCzEWpaVgifMgURArfJNVurG
JUNKIPEDIA_BASE_URL=https://api.junkipedia.org
JUNKIPEDIA_CHANNEL_ID=10595539

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Database table name
SUPABASE_TABLE_NAME=jk_rowling_posts
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created!');
} else {
  console.log('✅ .env file already exists');
}

console.log('\n📋 Next Steps:');
console.log('1. Edit the .env file and add your Supabase credentials:');
console.log('   - SUPABASE_URL: Your Supabase project URL');
console.log('   - SUPABASE_ANON_KEY: Your Supabase anon/public key');
console.log('   - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (optional)');
console.log('\n2. Set up your Supabase database:');
console.log('   - Go to your Supabase project dashboard');
console.log('   - Open the SQL editor');
console.log('   - Copy and paste the contents of database-setup.sql');
console.log('   - Run the SQL to create the required table');
console.log('\n3. Test your connections:');
console.log('   node test-connection.js');
console.log('\n4. Run the main script:');
console.log('   npm start');
console.log('\n📖 For more information, see README.md');
