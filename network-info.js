const os = require('os');

function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const networkInfo = {
    localhost: 'http://localhost:3000',
    networks: []
  };
  
  console.log('🌐 Network Information for DebtManage API:');
  console.log('==========================================');
  console.log(`📍 Localhost: ${networkInfo.localhost}`);
  console.log('');
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        const url = `http://${interface.address}:3000`;
        networkInfo.networks.push({
          name,
          address: interface.address,
          url
        });
        console.log(`📡 ${name}: ${url}`);
      }
    }
  }
  
  console.log('');
  console.log('💡 Tips:');
  console.log('- Use localhost URL for local development');
  console.log('- Use network IP for testing on mobile devices');
  console.log('- Update api-config.js with your preferred URLs');
  console.log('');
  
  return networkInfo;
}

// Run if called directly
if (require.main === module) {
  getNetworkInfo();
}

module.exports = { getNetworkInfo };