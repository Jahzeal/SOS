class UniversalPCLookupTester {
  lookup(rawId) {
    const cleanId = (rawId || '').trim().toUpperCase().replace(/[\s-_]/g, '');
    if (!cleanId || cleanId.length < 3) return { found: false };

    // 1. HP
    if (this.isHp(cleanId)) return this.decodeHp(cleanId);
    // 2. Lenovo
    if (this.isLenovo(cleanId)) return this.decodeLenovo(cleanId);
    // 3. Dell
    if (this.isDell(cleanId)) return this.decodeDell(cleanId);
    // 4. Apple
    if (this.isApple(cleanId)) return this.decodeApple(cleanId);
    // 5. ASUS
    if (this.isAsus(cleanId)) return this.decodeAsus(cleanId);
    // 6. Acer
    if (this.isAcer(cleanId)) return this.decodeAcer(cleanId);
    // 7. MSI
    if (this.isMsi(cleanId)) return this.decodeMsi(cleanId);
    // 8. Microsoft Surface
    if (this.isMicrosoft(cleanId)) return this.decodeMicrosoft(cleanId);
    // 9. Samsung Galaxy Book
    if (this.isSamsung(cleanId)) return this.decodeSamsung(cleanId);
    // 10. Razer
    if (this.isRazer(cleanId)) return this.decodeRazer(cleanId);
    // 11. Gigabyte / AORUS
    if (this.isGigabyte(cleanId)) return this.decodeGigabyte(cleanId);
    // 12. LG Gram
    if (this.isLg(cleanId)) return this.decodeLg(cleanId);
    // 13. Huawei / Honor
    if (this.isHuawei(cleanId)) return this.decodeHuawei(cleanId);
    // 14. Toshiba / Dynabook
    if (this.isToshiba(cleanId)) return this.decodeToshiba(cleanId);
    // 15. Universal PC Fallback
    if (this.isGenericPcSerial(cleanId)) return this.decodeGenericPc(cleanId);

    return { found: false };
  }

  isHp(id) {
    return /^(5CG|5CD|6CD|8CG|CND|CNU|CZC|2NA|3CA|4CE|7CE|NX)[A-Z0-9]{7}$/i.test(id) ||
      (/^[0-9][A-Z]{2}[0-9]{4}[A-Z0-9]{3}$/i.test(id) && !/^35/i.test(id)) ||
      (/^[A-Z0-9]{10}$/i.test(id) && /^(5CG|5CD|6CD|8CG|CND|CNU|CZC|2NA|4CE|7CE|3CA)/i.test(id));
  }
  decodeHp(id) {
    const clean = id.toUpperCase();
    const prefix = clean.slice(0, 3);
    const yearDigit = clean[3];
    const week = clean.slice(4, 6);
    let line = 'HP EliteBook / ProBook Laptop';
    let series = 'Enterprise Business Series';
    if (prefix.includes('CG') || prefix.includes('NU') || prefix.includes('ND')) {
      line = 'HP EliteBook / ProBook';
      series = 'Business & Enterprise Grade';
    } else if (prefix.includes('CD') || prefix.includes('CE')) {
      line = 'HP Pavilion / Envy / Omen';
      series = 'Performance & Gaming Series';
    } else if (prefix.includes('ZC') || prefix.includes('NA')) {
      line = 'HP ProDesk / EliteDesk Desktop';
      series = 'Commercial Desktop Architecture';
    }
    const year = parseInt(yearDigit, 10) >= 0 ? `201${yearDigit}` : 'Modern Gen';
    return { found: true, brand: 'HP', model: `${line} (SN: ${clean})`, specs: `${series} • Mfg Week ${week}/${year}`, deviceCategory: 'LAPTOP' };
  }

  isLenovo(id) {
    return /^(20|21|80|81|82|83|MP|PC|YX|PW|10|11|12)[A-Z0-9]{6,10}/i.test(id) || /^PF[A-Z0-9]{6}$/i.test(id);
  }
  decodeLenovo(id) {
    let line = 'Lenovo ThinkPad / IdeaPad Series';
    if (/^PF/i.test(id) || /^(20|21)/.test(id)) line = 'Lenovo ThinkPad X1 / T / L Series';
    else if (/^(80|81|82|83)/.test(id)) line = 'Lenovo IdeaPad / Legion / Yoga Series';
    return { found: true, brand: 'Lenovo', model: `${line} (SN: ${id})`, specs: 'Lenovo Commercial/Consumer Architecture', deviceCategory: 'LAPTOP' };
  }

  isDell(id) {
    return (/^[A-Z0-9]{7}$/i.test(id) && !this.isHp(id) && !this.isLenovo(id)) || /^\d{10,11}$/.test(id);
  }
  decodeDell(id) {
    return { found: true, brand: 'Dell', model: `Dell Latitude / XPS / Inspiron (ST: ${id})`, specs: 'Dell Service Tag Verified Architecture', deviceCategory: 'LAPTOP' };
  }

  isApple(id) {
    return (/^[A-Z0-9]{12}$/i.test(id) || /^[A-Z0-9]{10}$/i.test(id)) &&
      !this.isHp(id) && !this.isLenovo(id) && !/^(5CG|5CD|6CD|8CG|CND|CNU|CZC|2NA|4CE|PF|MP|YX)/i.test(id) && !/^\d+$/.test(id);
  }
  decodeApple(id) {
    return { found: true, brand: 'Apple', model: `MacBook Pro / MacBook Air / iMac (SN: ${id})`, specs: 'Apple Silicon / Retina Architecture', deviceCategory: 'LAPTOP' };
  }

  isAsus(id) {
    return /^[A-N][0-9A-Z]N0[A-Z0-9]{10,12}$/i.test(id) || (/^[A-Z0-9]{15}$/i.test(id) && /N0/i.test(id));
  }
  decodeAsus(id) {
    return { found: true, brand: 'Asus', model: `ASUS ZenBook / VivoBook / ROG (SN: ${id})`, specs: 'ASUS Performance System Architecture', deviceCategory: 'LAPTOP' };
  }

  isAcer(id) {
    return /^NX[A-Z0-9]{18,22}$/i.test(id) || (/^\d{10,11}$/.test(id) && !this.isDell(id));
  }
  decodeAcer(id) {
    return { found: true, brand: 'Acer', model: `Acer Aspire / Swift / Predator (SN: ${id})`, specs: 'Acer Mobile Architecture', deviceCategory: 'LAPTOP' };
  }

  isMsi(id) {
    return /^K[0-9]{6,12}$/i.test(id) || /^9S7[A-Z0-9]{10,14}$/i.test(id) || (/^[A-Z0-9]{14,18}$/i.test(id) && /^(MS|MSI)/i.test(id));
  }
  decodeMsi(id) {
    return { found: true, brand: 'MSI', model: `MSI Stealth / Raider / Katana Gaming (SN: ${id})`, specs: 'MSI High-Performance Gaming Architecture', deviceCategory: 'LAPTOP' };
  }

  isMicrosoft(id) {
    return /^(01|02|03|04|05|06|07|08)\d{10}$/.test(id);
  }
  decodeMicrosoft(id) {
    return { found: true, brand: 'Microsoft', model: `Microsoft Surface Pro / Laptop (SN: ${id})`, specs: 'PixelSense Display / Windows 11 Pro', deviceCategory: 'LAPTOP' };
  }

  isSamsung(id) {
    return (/^[A-Z0-9]{11,15}$/i.test(id) && /^(NP|NT|SM)/i.test(id));
  }
  decodeSamsung(id) {
    return { found: true, brand: 'Samsung', model: `Samsung Galaxy Book / Notebook (SN: ${id})`, specs: 'Samsung AMOLED / Intel Evo Architecture', deviceCategory: 'LAPTOP' };
  }

  isRazer(id) {
    return (/^[A-Z0-9]{12,14}$/i.test(id) && /^(BY|PM|RZ)/i.test(id));
  }
  decodeRazer(id) {
    return { found: true, brand: 'Razer', model: `Razer Blade Gaming Laptop (SN: ${id})`, specs: 'Razer Chroma CNC Aluminum Architecture', deviceCategory: 'LAPTOP' };
  }

  isGigabyte(id) {
    return (/^SN[0-9]{10,14}$/i.test(id) || /^(AORUS|GB)[A-Z0-9]{8,14}$/i.test(id));
  }
  decodeGigabyte(id) {
    return { found: true, brand: 'Gigabyte', model: `Gigabyte AORUS / AERO Laptop (SN: ${id})`, specs: 'Gigabyte High-Performance PC Architecture', deviceCategory: 'LAPTOP' };
  }

  isLg(id) {
    return /^[0-9]{3}[A-Z]{4}[0-9]{5}$/i.test(id) || (/^[0-9A-Z]{12}$/i.test(id) && /^(14Z|15Z|16Z|17Z)/i.test(id));
  }
  decodeLg(id) {
    return { found: true, brand: 'LG', model: `LG Gram Ultralight Laptop (SN: ${id})`, specs: 'LG Magnesium-Alloy Ultralight Architecture', deviceCategory: 'LAPTOP' };
  }

  isHuawei(id) {
    return /^[A-Z0-9]{16}$/i.test(id) && /^(HN|HW|MATE)/i.test(id);
  }
  decodeHuawei(id) {
    return { found: true, brand: 'Huawei', model: `Huawei MateBook / MagicBook (SN: ${id})`, specs: 'Huawei FullView Display Architecture', deviceCategory: 'LAPTOP' };
  }

  isToshiba(id) {
    return /^[0-9A-Z]{9,12}$/i.test(id) && /^(PS|PR|PT|DY)/i.test(id);
  }
  decodeToshiba(id) {
    return { found: true, brand: 'Dynabook / Toshiba', model: `Dynabook Portégé / Tecra (SN: ${id})`, specs: 'Dynabook Business System Architecture', deviceCategory: 'LAPTOP' };
  }

  isGenericPcSerial(id) {
    // 6 to 24 alphanumeric chars, not a pure 15-digit Luhn phone IMEI
    return /^[A-Z0-9]{6,24}$/i.test(id) && !(id.length === 15 && /^\d+$/.test(id));
  }
  decodeGenericPc(id) {
    return {
      found: true,
      brand: 'PC / Personal Computer',
      model: `Workstation / Laptop System (SN: ${id})`,
      specs: 'Universal PC Hardware Architecture',
      deviceCategory: 'LAPTOP'
    };
  }
}

const tester = new UniversalPCLookupTester();
const testCases = [
  '5CG8234XMV',       // HP
  'PF2A89BC',         // Lenovo
  '9J7X1K2',          // Dell
  'C02XG123JHD2',     // Apple
  'M8N0CX123456789',  // ASUS
  'NXA89123456789012345', // Acer
  '9S716W212001',     // MSI
  '012345678901',     // Surface
  'NP950XDB12345',    // Samsung
  'BY2148M12345',     // Razer
  'SN210512345678',   // Gigabyte
  '16Z90P12345',      // LG Gram
  'HW123456789ABCDE', // Huawei
  'PR123456789',      // Toshiba
  'CUSTOMPC998877',   // Custom PC
];

testCases.forEach(tc => {
  const res = tester.lookup(tc);
  console.log(`[${tc}] -> Brand: ${res.brand} | Model: ${res.model}`);
});
