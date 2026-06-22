const pool = require('./db');

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Toys', 'Food', 'Beauty'];
const TOTAL = 200000;
const BATCH_SIZE = 5000;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomDate() {
  const now = Date.now();
  const twoYearsAgo = now - 2 * 365 * 24 * 60 * 60 * 1000;
  return new Date(twoYearsAgo + Math.random() * (now - twoYearsAgo));
}

function randomCategory() {
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}

function randomName(i) {
  const adjectives = ['Premium', 'Deluxe', 'Basic', 'Pro', 'Lite', 'Ultra', 'Smart', 'Classic'];
  const nouns = ['Widget', 'Gadget', 'Item', 'Product', 'Thing', 'Device', 'Tool', 'Pack'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun} ${i}`;
}

async function seed() {
  console.log(`Seeding ${TOTAL} products in batches of ${BATCH_SIZE}...`);

  for (let start = 0; start < TOTAL; start += BATCH_SIZE) {
    const values = [];
    const placeholders = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      const idx = start + i;
      const created = randomDate();
      const col = i * 6;
      placeholders.push(
        `($${col+1}, $${col+2}, $${col+3}, $${col+4}, $${col+5}, $${col+6})`
      );
      values.push(
        `product-${idx}-${Math.random().toString(36).slice(2)}`, // unique-ish name via id embedded
        randomName(idx),
        randomCategory(),
        parseFloat(randomBetween(1, 10000).toFixed(2)),
        created,
        created
      );
    }

    // Rebuild — simpler approach that actually works:
    await insertBatch(start, BATCH_SIZE);

    console.log(`✓ Inserted ${Math.min(start + BATCH_SIZE, TOTAL)} / ${TOTAL}`);
  }

  console.log('✅ Seeding complete!');
  await pool.end();
}

async function insertBatch(start, size) {
  const rows = [];
  for (let i = 0; i < size; i++) {
    const idx = start + i;
    const created = randomDate();
    rows.push([
      randomName(idx),
      randomCategory(),
      parseFloat(randomBetween(1, 10000).toFixed(2)),
      created,
      created
    ]);
  }

  // Build one big INSERT with multiple value rows
  const placeholders = rows.map(
    (_, i) => `($${i*5+1}, $${i*5+2}, $${i*5+3}, $${i*5+4}, $${i*5+5})`
  ).join(', ');

  const flat = rows.flat();

  await pool.query(
    `INSERT INTO products (name, category, price, created_at, updated_at) VALUES ${placeholders}`,
    flat
  );
}

seed().catch(console.error);