const http = require('http');

const testEndpoints = [
  { path: '/api/health', description: 'Health Check' },
  { path: '/api/plugins', description: 'List Plugins' },
  { path: '/admin', description: 'Admin Interface' },
  { path: '/webdav/plugins', description: 'WebDAV Plugins Directory' }
];

const baseUrl = process.env.TEST_URL || 'http://localhost:3000';

console.log('🧪 Testing Plugin Vault Server...\n');

testEndpoints.forEach(({ path, description }) => {
  const url = `${baseUrl}${path}`;
  
  http.get(url, (res) => {
    console.log(`✅ ${description}: ${res.statusCode} ${res.statusMessage}`);
    if (res.statusCode === 200 || res.statusCode === 301) {
      console.log(`   URL: ${url}`);
    }
  }).on('error', (err) => {
    console.log(`❌ ${description}: ${err.message}`);
  });
});

console.log('\n🌐 WebDAV Connection Info:');
console.log(`   URL: ${baseUrl}/webdav/plugins`);
console.log('   Username: admin');
console.log('   Password: password');
console.log('\n📱 To connect from macOS:');
console.log('   1. Open Finder');
console.log('   2. Press Cmd + K');
console.log('   3. Enter the WebDAV URL above');
console.log('   4. Use the credentials above');
console.log('\n🔧 Alternative connection methods:');
console.log('   - Use any WebDAV client (Cyberduck, FileZilla, etc.)');
console.log('   - Access via web browser with credentials');
console.log('   - Use curl: curl -u admin:password http://localhost:3000/webdav/plugins/'); 