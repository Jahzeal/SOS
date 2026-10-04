const https = require('https');

function fetch(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function testHp() {
  const urls = [
    'https://support.hp.com/wcc-services/cda/productinfo?cc=us&lang=en&sn=5CG8234XMV',
    'https://support.hp.com/wcc-services/cda/warranty?cc=us&lang=en&sn=5CG8234XMV',
    'https://support.hp.com/wcc-services/cda/search-product?searchTerm=5CG8234XMV',
    'https://support.hp.com/wcc-services/cda/device?sn=5CG8234XMV'
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u);
      console.log('=== URL:', u, 'Status:', res.status);
      console.log('Data sample:', res.data.slice(0, 300));
    } catch(e) {
      console.log('Err for', u, e.message);
    }
  }
}

testHp();
