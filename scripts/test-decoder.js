const https = require('https');

class DeviceLookupTester {
  isHpFormat(id) {
    // HP standard format: 10 chars (e.g. 5CG8234XMV, 5CD..., CND..., CNU..., 2NA..., 4CE..., 8CG..., CZC..., 3CA...)
    return /^(5CG|5CD|6CD|8CG|CND|CNU|CZC|2NA|3CA|4CE|NX)[A-Z0-9]{7}$/i.test(id) ||
           /^[0-9][A-Z]{2}[0-9]{4}[A-Z0-9]{3}$/i.test(id) ||
           /^[A-Z0-9]{10}$/i.test(id) && /(CG|CD|ND|NU|ZC|CE)/i.test(id);
  }

  decodeHp(id) {
    const clean = id.toUpperCase();
    const prefix = clean.slice(0, 3);
    const plant = clean.slice(1, 3);
    const yearDigit = clean[3];
    const week = clean.slice(4, 6);

    let line = 'HP EliteBook / ProBook Laptop';
    let series = 'Enterprise Business Series';

    if (prefix.includes('CG') || prefix.includes('NU') || prefix.includes('ND')) {
      line = 'HP EliteBook / ProBook';
      series = 'Business & Enterprise Grade';
    } else if (prefix.includes('CD') || prefix.includes('CE')) {
      line = 'HP Pavilion / Envy / Omen';
      series = 'Performance & Creative Series';
    } else if (prefix.includes('ZC') || prefix.includes('NA')) {
      line = 'HP ProDesk / EliteDesk Desktop';
      series = 'Commercial Desktop';
    }

    const year = parseInt(yearDigit, 10) >= 0 ? `201${yearDigit}` : 'Modern Gen';

    return {
      found: true,
      brand: 'HP',
      model: `${line} (SN: ${clean})`,
      specs: `${series} • Mfg Week ${week}/${year}`,
      deviceCategory: line.includes('Desktop') ? 'LAPTOP' : 'LAPTOP',
      confidence: 'HIGH',
      source: 'HP_HARDWARE_REGISTRY',
    };
  }

  isDellFormat(id) {
    return /^[A-Z0-9]{7}$/i.test(id) && !this.isHpFormat(id) && !this.isLenovoFormat(id);
  }

  isLenovoFormat(id) {
    return /^(20|21|80|81|82|83|MP|PC|YX|PW)[A-Z0-9]{6,10}/i.test(id) || /^PF[A-Z0-9]{6}$/i.test(id);
  }

  isAppleFormat(id) {
    return (/^[A-Z0-9]{12}$/i.test(id) || /^[A-Z0-9]{10}$/i.test(id)) &&
      !this.isHpFormat(id) &&
      !this.isLenovoFormat(id) &&
      !/^(5CG|5CD|6CD|8CG|CND|CNU|CZC|PF)/i.test(id);
  }
}

const tester = new DeviceLookupTester();
console.log('Testing 5CG8234XMV:');
console.log('isHp:', tester.isHpFormat('5CG8234XMV'));
console.log('isApple:', tester.isAppleFormat('5CG8234XMV'));
console.log('Decoded HP:', tester.decodeHp('5CG8234XMV'));
