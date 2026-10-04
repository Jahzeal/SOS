const https = require('https');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function findHpName() {
  const html = await fetchPage('https://support.hp.com/wcc-services/cda/productinfo?cc=us&lang=en&sn=5CG8234XMV');
  const matches = html.match(/productTitle[^,}]+|productName[^,}]+|1030|840|EliteBook[^<"'\n\r]+/gi);
  console.log('Matches found:', matches ? matches.slice(0, 10) : 'None');
}

findHpName();
