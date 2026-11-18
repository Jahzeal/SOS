/**
 * Brands and popular models sold in Nigerian phone and laptop shops. Used as
 * suggestions only: staff can always type a brand or model that is not listed.
 */

export const PHONE_MODELS: Record<string, string[]> = {
  Apple: [
    'iPhone XR', 'iPhone XS', 'iPhone XS Max',
    'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max',
    'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max',
    'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
    'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
    'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
    'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max', 'iPhone 16e',
    'iPhone 17', 'iPhone Air', 'iPhone 17 Pro', 'iPhone 17 Pro Max',
  ],
  Samsung: [
    'Galaxy A05', 'Galaxy A06', 'Galaxy A15', 'Galaxy A16', 'Galaxy A25', 'Galaxy A26',
    'Galaxy A35', 'Galaxy A36', 'Galaxy A55', 'Galaxy A56',
    'Galaxy S21', 'Galaxy S22', 'Galaxy S23', 'Galaxy S23 Ultra', 'Galaxy S24', 'Galaxy S24 Ultra',
    'Galaxy S25', 'Galaxy S25 Ultra', 'Galaxy Note 20 Ultra',
    'Galaxy Z Flip5', 'Galaxy Z Flip6', 'Galaxy Z Fold5', 'Galaxy Z Fold6',
  ],
  Tecno: [
    'Spark 20', 'Spark 20 Pro', 'Spark 30', 'Spark 30 Pro',
    'Camon 20', 'Camon 20 Pro', 'Camon 30', 'Camon 30 Pro', 'Camon 40',
    'Pova 6', 'Pova 6 Pro', 'Phantom V Flip', 'Phantom V Fold',
  ],
  Infinix: [
    'Hot 40', 'Hot 40i', 'Hot 50', 'Hot 50i', 'Note 40', 'Note 40 Pro', 'Note 50',
    'Smart 8', 'Smart 9', 'Zero 30', 'GT 20 Pro',
  ],
  Itel: ['A70', 'A80', 'P55', 'P65', 'S24', 'S25'],
  Xiaomi: [
    'Redmi 13C', 'Redmi 13', 'Redmi 14C', 'Redmi Note 13', 'Redmi Note 13 Pro',
    'Redmi Note 14', 'Redmi Note 14 Pro', 'Xiaomi 14', 'Xiaomi 14T',
  ],
  Google: ['Pixel 6', 'Pixel 6 Pro', 'Pixel 7', 'Pixel 7 Pro', 'Pixel 8', 'Pixel 8 Pro', 'Pixel 9', 'Pixel 9 Pro'],
  Oppo: ['A18', 'A38', 'A58', 'A78', 'Reno 11', 'Reno 12'],
  Vivo: ['Y03', 'Y18', 'Y28', 'V30'],
  Realme: ['C53', 'C55', 'C61', 'Note 50', '12 Pro'],
  Huawei: ['Nova 11', 'Nova 12', 'P60 Pro'],
  OnePlus: ['Nord CE 3', '10 Pro', '11', '12'],
  Nokia: ['C32', 'G42'],
  Motorola: ['Moto G54', 'Moto G84', 'Edge 40'],
  Honor: ['X6', 'X7b', 'X8b', 'X9b', 'Magic6 Pro'],
  Sony: ['Xperia 10 V', 'Xperia 1 V'],
};

export const LAPTOP_MODELS: Record<string, string[]> = {
  HP: [
    'EliteBook 840', 'EliteBook 850', 'ProBook 440', 'ProBook 450', '250 G9', '255 G9',
    'Pavilion 15', 'Envy x360', 'Spectre x360', 'Victus 15', 'Omen 16',
  ],
  Dell: [
    'Latitude 5420', 'Latitude 5440', 'Latitude 7420', 'Inspiron 15 3520', 'Vostro 3520',
    'XPS 13', 'XPS 15', 'Precision 5560',
  ],
  Lenovo: ['ThinkPad T14', 'ThinkPad T480', 'ThinkPad X1 Carbon', 'ThinkPad E14', 'IdeaPad 3', 'IdeaPad 5', 'IdeaPad Slim 3', 'Legion 5', 'Yoga 7'],
  Apple: ['MacBook Air M1', 'MacBook Air M2', 'MacBook Air M3', 'MacBook Pro 13 (M2)', 'MacBook Pro 14', 'MacBook Pro 16'],
  Asus: ['VivoBook 15', 'ZenBook 14', 'TUF Gaming F15', 'ROG Strix G16'],
  Acer: ['Aspire 3', 'Aspire 5', 'Swift 3', 'Nitro 5'],
  Microsoft: ['Surface Laptop 4', 'Surface Laptop 5', 'Surface Pro 8', 'Surface Pro 9'],
  Toshiba: ['Satellite', 'Dynabook Tecra'],
  MSI: ['Modern 14', 'GF63 Thin', 'Katana 15'],
  Samsung: ['Galaxy Book3', 'Galaxy Book4'],
  Huawei: ['MateBook D15', 'MateBook 14'],
  Razer: ['Blade 15'],
};

export function brandsFor(category: 'PHONE' | 'LAPTOP') {
  return Object.keys(category === 'PHONE' ? PHONE_MODELS : LAPTOP_MODELS);
}

/** Models for a brand (matched without caring about capital letters). */
export function modelsFor(category: 'PHONE' | 'LAPTOP', brand: string) {
  const table = category === 'PHONE' ? PHONE_MODELS : LAPTOP_MODELS;
  const key = Object.keys(table).find((b) => b.toLowerCase() === brand.trim().toLowerCase());
  return key ? table[key] : [];
}
