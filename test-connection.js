const JunkipediaAPI = require('./junkipedia-api');
const SupabaseClient = require('./supabase-client');

async function testConnections() {
  console.log('🧪 Testing connections...\n');

  // Test Junkipedia API
  console.log('🔍 Testing Junkipedia API connection...');
  try {
    const junkipedia = new JunkipediaAPI();
    
    // Test channel info
    console.log('📡 Fetching channel information...');
    const channelInfo = await junkipedia.getChannelInfo();
    console.log('✅ Junkipedia API connection successful!');
    console.log(`📊 Channel: ${channelInfo.name || 'JK Rowling'}`);
    console.log(`🆔 Channel ID: ${channelInfo.id || '10595539'}\n`);
  } catch (error) {
    console.error('❌ Junkipedia API connection failed:', error.message);
    console.log('💡 Make sure your API key is correct and you have access to the channel.\n');
  }

  // Test Supabase connection
  console.log('🗄️  Testing Supabase connection...');
  try {
    const supabase = new SupabaseClient();
    
    // Test table access
    console.log('📋 Checking table access...');
    const tableExists = await supabase.initializeTable();
    
    if (tableExists) {
      console.log('✅ Supabase connection successful!');
      console.log('✅ Table access confirmed!\n');
    } else {
      console.log('⚠️  Supabase connection successful, but table needs to be created.');
      console.log('📋 Please run the SQL provided above in your Supabase SQL editor.\n');
    }
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    console.log('💡 Make sure your Supabase URL and API key are correct.\n');
  }

  console.log('🎯 Test completed!');
  console.log('📝 If both connections are successful, you can run the main script with:');
  console.log('   npm start');
}

// Run the test
if (require.main === module) {
  testConnections().catch(console.error);
}

module.exports = testConnections;
