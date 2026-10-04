const { DeviceLookupService } = require('../apps/backend/dist/src/phones/device-lookup.service');

async function testAllBrands() {
  const service = new DeviceLookupService();
  const testList = [
    { label: 'HP Pavilion / Envy', sn: '5CD1234XYZ' },
    { label: 'HP ProDesk Desktop', sn: 'CZC91234AB' },
    { label: 'Lenovo ThinkPad', sn: 'PF2A89BC' },
    { label: 'Dell Latitude / XPS', sn: '9J7X1K2' },
    { label: 'Apple MacBook Pro', sn: 'C02XG123JHD2' },
    { label: 'ASUS ROG / ZenBook', sn: 'M8N0CX123456789' },
    { label: 'Acer Aspire / Predator', sn: 'NXA89123456789012345' },
    { label: 'MSI Gaming Laptop', sn: '9S716W212001' },
    { label: 'Microsoft Surface Pro', sn: '012345678901' },
    { label: 'Samsung Galaxy Book', sn: 'NP950XDB12345' },
    { label: 'Razer Blade Gaming', sn: 'BY2148M12345' },
    { label: 'Gigabyte AORUS', sn: 'SN210512345678' },
    { label: 'Custom / Unlisted PC', sn: 'CUSTOMPC998877' }
  ];

  console.log('Testing across all manufacturers:\n');
  for (const item of testList) {
    const res = await service.lookup(item.sn);
    console.log(`[${item.label}] S/N: ${item.sn}`);
    console.log(`  -> Brand   : ${res.brand}`);
    console.log(`  -> Model   : ${res.model}`);
    console.log(`  -> Specs   : ${res.specs}`);
    console.log(`  -> Category: ${res.deviceCategory}\n`);
  }
}

testAllBrands();
