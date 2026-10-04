const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (!loc.startsWith('http')) {
          const u = new URL(url);
          loc = `${u.origin}${loc.startsWith('/') ? '' : '/'}${loc}`;
        }
        return fetchUrl(loc).then(resolve).catch(reject);
      }
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, data: raw, url }));
    }).on('error', reject);
  });
}

async function testHp(sn) {
  try {
    const res = await fetchUrl(`https://support.hp.com/us-en/product/setup-user-guide/serialnumber/${encodeURIComponent(sn)}`);
    console.log('Final URL:', res.url);
    const titleMatch = res.data.match(/<title>([^<]+)<\/title>/i);
    console.log('Title:', titleMatch ? titleMatch[1] : 'None');
    const prodMatch = res.data.match(/product-title[^\>]*>([^<]+)<\/h1>/i) || res.data.match(/\"productTitle\":\"([^\"]+)\"/i);
    console.log('Product Match:', prodMatch ? prodMatch[1] : 'None');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testHp('5CG8234XMV');
