/**
 * Script to check menus API and see what's returned
 * Run with: node check-menus.js
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || 'https://stage-v2.getinfinitybox.com/v1/api';

// Get token from command line argument or use a placeholder
const token = process.argv[2] || 'YOUR_TOKEN_HERE';

if (token === 'YOUR_TOKEN_HERE') {
	console.log('❌ Please provide a token as argument:');
	console.log('   node check-menus.js YOUR_BEARER_TOKEN');
	console.log('\nOr set it in the script.');
	process.exit(1);
}

const url = new URL(`${API_BASE_URL}/menus`);
const protocol = url.protocol === 'https:' ? https : http;

const options = {
	hostname: url.hostname,
	port: url.port || (url.protocol === 'https:' ? 443 : 80),
	path: url.pathname,
	method: 'GET',
	headers: {
		'Authorization': `Bearer ${token}`,
		'Content-Type': 'application/json',
	},
};

console.log(`🔍 Calling: ${url.toString()}`);
console.log(`📋 Token: ${token.substring(0, 20)}...\n`);

const req = protocol.request(options, (res) => {
	let data = '';

	res.on('data', (chunk) => {
		data += chunk;
	});

	res.on('end', () => {
		try {
			const response = JSON.parse(data);
			
			console.log('📊 Response Status:', res.statusCode);
			console.log('📊 Response Status Text:', response.status || 'N/A');
			console.log('\n📋 All Menus:');
			console.log(JSON.stringify(response, null, 2));
			
			if (response.data && response.data.menus) {
				const menus = response.data.menus;
				console.log(`\n✅ Total menus found: ${menus.length}`);
				
				// Find QC menu
				const qcMenu = menus.find(m => 
					m.name === 'QC' || 
					m.slug === 'ops-admin-QC' || 
					m.slug === 'ops-admin-escalations' ||
					m.slug?.includes('QC')
				);
				
				// Find Escalations menu
				const escalationsMenu = menus.find(m => 
					m.name === 'Escalations' || 
					m.slug === 'ops-admin-client-escalations' ||
					m.slug?.includes('escalation')
				);
				
				console.log('\n🔍 QC Menu:');
				if (qcMenu) {
					console.log(JSON.stringify(qcMenu, null, 2));
				} else {
					console.log('❌ QC menu NOT FOUND');
				}
				
				console.log('\n🔍 Escalations Menu:');
				if (escalationsMenu) {
					console.log(JSON.stringify(escalationsMenu, null, 2));
				} else {
					console.log('❌ Escalations menu NOT FOUND');
				}
				
				// Show all ops-admin related menus
				console.log('\n📋 All Ops Admin related menus:');
				const opsAdminMenus = menus.filter(m => 
					m.slug?.includes('ops-admin') || 
					m.name?.toLowerCase().includes('ops') ||
					m.parent_id === 7 // Assuming 7 is Ops Admin ID
				);
				opsAdminMenus.forEach(menu => {
					console.log(`  - ${menu.name} (id: ${menu.id}, slug: ${menu.slug}, parent_id: ${menu.parent_id}, level: ${menu.level})`);
				});
			}
		} catch (error) {
			console.error('❌ Error parsing response:', error);
			console.log('Raw response:', data);
		}
	});
});

req.on('error', (error) => {
	console.error('❌ Request error:', error);
});

req.end();





