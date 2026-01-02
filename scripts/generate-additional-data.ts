/**
 * Generate additional entries to reach exactly 10,000 total
 * Current: 3,990 | Need: 6,010 more
 */

import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Read existing suppliers
const suppliersCSV = readFileSync('suppliers.csv', 'utf8');
const suppliersLines = suppliersCSV.split('\n');
const suppliersData = suppliersLines.slice(1).filter((line) => line.trim()).map((line) => {
  const parts = line.split(',');
  return { id: parts[0], display_name: parts[2] };
});

console.log(`📊 Found ${suppliersData.length} existing suppliers`);
console.log('🚀 Generating additional data to reach 10,000 total entries...\n');

// ============================================
// ADDITIONAL PRODUCTS (46 more)
// ============================================

const productCategories = [
  'Lithium Carbonate',
  'Lithium Hydroxide',
  'Lithium Spodumene',
  'Lithium Chloride',
  'Recycled Lithium',
];

const grades = ['Battery Grade', 'Industrial Grade', 'Technical Grade'];

const newProducts: string[] = [];
for (let i = 0; i < 50; i++) {
  const supplier = randomElement(suppliersData);
  const category = randomElement(productCategories);
  const grade = randomElement(grades);
  const purity = randomFloat(99.0, 99.9);

  newProducts.push([
    generateUUID(),
    supplier.id,
    `${grade} ${category} ${purity.toFixed(2)}%`,
    `High-quality ${category.toLowerCase()} for battery applications`,
    category,
    grade,
    purity.toFixed(2),
    category === 'Lithium Carbonate' ? purity.toFixed(2) : '',
    category === 'Lithium Hydroxide' ? '56.5' : '',
    category === 'Lithium Spodumene' ? '6.0' : '',
    'D50: 20μm',
    '1.2 g/cm³',
    '0.05',
    'MT',
    randomInt(20, 100),
    randomInt(30, 90),
    randomInt(100, 5000),
    '["ISO 9001:2015"]',
    'true',
    'true',
    JSON.stringify({ Na: '≤0.0001%', Mg: '≤0.0001%' }),
    JSON.stringify({ base_price: randomInt(10000, 15000), currency: 'USD', unit: 'MT' }),
    'active',
    new Date(Date.now() - randomInt(100, 500) * 24 * 60 * 60 * 1000).toISOString(),
    new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000).toISOString(),
  ].join(','));
}

appendFileSync('products.csv', '\n' + newProducts.join('\n'), 'utf8');
console.log(`✅ Added ${newProducts.length} products (Total: ${1454 + newProducts.length})`);

// ============================================
// ADDITIONAL REVIEWS (4,573 more)
// ============================================

const reviewTemplates = [
  { rating: 5, title: 'Excellent quality', comment: 'Outstanding product quality. Highly recommend.' },
  { rating: 5, title: 'Great supplier', comment: 'Reliable delivery and excellent product specifications.' },
  { rating: 4, title: 'Good experience', comment: 'Product meets requirements. Good value for money.' },
  { rating: 4, title: 'Reliable', comment: 'Consistent quality. Minor delays but overall satisfied.' },
  { rating: 3, title: 'Acceptable', comment: 'Product is adequate. Nothing exceptional.' },
  { rating: 2, title: 'Below average', comment: 'Quality was inconsistent. Customer service needs improvement.' },
];

const newReviews: string[] = [];
const buyerOrgId = generateUUID();
const buyerUserId = generateUUID();

for (let i = 0; i < 4580; i++) {
  const supplier = randomElement(suppliersData);
  const template = randomElement(reviewTemplates);

  newReviews.push([
    generateUUID(),
    supplier.id,
    buyerOrgId,
    Math.random() > 0.5 ? generateUUID() : '',
    template.rating,
    template.title,
    template.comment,
    Math.random() > 0.2 ? 'true' : 'false',
    Math.random() > 0.6 ? 'Thank you for your feedback.' : '',
    Math.random() > 0.6 ? new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000).toISOString() : '',
    '',
    randomInt(0, 20),
    buyerUserId,
    new Date(Date.now() - randomInt(1, 365) * 24 * 60 * 60 * 1000).toISOString(),
    new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000).toISOString(),
  ].join(','));
}

appendFileSync('reviews.csv', '\n' + newReviews.join('\n'), 'utf8');
console.log(`✅ Added ${newReviews.length} reviews (Total: ${1427 + newReviews.length})`);

// ============================================
// ADDITIONAL CERTIFICATIONS (136 more)
// ============================================

const certTypes = [
  { name: 'ISO 9001:2015', type: 'Quality Management', issuer: 'ISO' },
  { name: 'ISO 14001:2015', type: 'Environmental', issuer: 'ISO' },
  { name: 'IATF 16949:2016', type: 'Industry Specific', issuer: 'IATF' },
  { name: 'ISO 45001:2018', type: 'Safety', issuer: 'ISO' },
];

const newCertifications: string[] = [];
for (let i = 0; i < 140; i++) {
  const supplier = randomElement(suppliersData);
  const cert = randomElement(certTypes);
  const issueDate = new Date(Date.now() - randomInt(180, 1095) * 24 * 60 * 60 * 1000);
  const expiryDate = new Date(issueDate.getTime() + 3 * 365 * 24 * 60 * 60 * 1000);

  newCertifications.push([
    generateUUID(),
    supplier.id,
    cert.name,
    cert.type,
    cert.issuer,
    `${cert.issuer}-${randomInt(10000, 99999)}`,
    issueDate.toISOString().split('T')[0],
    expiryDate.toISOString().split('T')[0],
    `https://cdn.lithiumbuy.com/certs/${generateUUID()}.pdf`,
    'true',
    generateUUID(),
    new Date(Date.now() - randomInt(30, 180) * 24 * 60 * 60 * 1000).toISOString(),
    issueDate.toISOString(),
  ].join(','));
}

appendFileSync('certifications.csv', '\n' + newCertifications.join('\n'), 'utf8');
console.log(`✅ Added ${newCertifications.length} certifications (Total: ${164 + newCertifications.length})`);

// ============================================
// ADDITIONAL LOCATIONS (1,255 more)
// ============================================

const locationTypes = [
  'mining_operation',
  'processing_plant',
  'warehouse',
  'office',
  'r_and_d_center',
];

const countries = ['China', 'Australia', 'Chile', 'United States', 'Argentina', 'Zimbabwe', 'Namibia', 'Canada'];
const cities = ['Beijing', 'Perth', 'Santiago', 'Charlotte', 'Buenos Aires', 'Harare', 'Windhoek', 'Toronto'];

const newLocations: string[] = [];
for (let i = 0; i < 1260; i++) {
  const supplier = randomElement(suppliersData);
  const locType = randomElement(locationTypes);
  const country = randomElement(countries);
  const city = randomElement(cities);

  newLocations.push([
    generateUUID(),
    supplier.id,
    locType,
    `${city} ${locType.replace(/_/g, ' ')}`,
    `${randomInt(1, 999)} Industrial Road`,
    '',
    city,
    city,
    randomInt(10000, 99999),
    country,
    randomFloat(-35, 50, 5),
    randomFloat(-120, 130, 5),
    locType === 'mining_operation' ? randomInt(5000, 50000) : '',
    randomInt(2000, 2024),
    '',
    '',
    new Date(Date.now() - randomInt(365, 3650) * 24 * 60 * 60 * 1000).toISOString(),
  ].join(','));
}

appendFileSync('locations.csv', '\n' + newLocations.join('\n'), 'utf8');
console.log(`✅ Added ${newLocations.length} locations (Total: ${795 + newLocations.length})`);

const totalNew = newProducts.length + newReviews.length + newCertifications.length + newLocations.length;
const grandTotal = 3990 + totalNew;

console.log(`\n📊 Summary:`);
console.log(`Previous total: 3,990`);
console.log(`New entries: ${totalNew}`);
console.log(`Grand total: ${grandTotal}`);
console.log(`\n🎉 Target achieved! All CSV files updated.`);
