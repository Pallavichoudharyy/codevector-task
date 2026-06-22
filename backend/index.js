const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── Encode/decode cursor ──────────────────────────────
// Cursor = base64 of "created_at,id"
// This lets the frontend pass a stable "bookmark" for the next page
function encodeCursor(created_at, id) {
  return Buffer.from(`${created_at.toISOString()},${id}`).toString('base64');
}

function decodeCursor(cursor) {
  const decoded = Buffer.from(cursor, 'base64').toString('utf8');
  const commaIndex = decoded.indexOf(',');
  const created_at = decoded.slice(0, commaIndex);
  const id = decoded.slice(commaIndex + 1);
  return { created_at, id };
}

// ─── GET /products ─────────────────────────────────────
// Query params: cursor, category, limit
app.get('/products', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const { cursor, category } = req.query;

    const conditions = [];
    const params = [];

    // Filter by category
    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    // Cursor condition — "give me products older than this cursor"
    // Uses (created_at, id) tuple comparison for stability
    if (cursor) {
      const { created_at, id } = decodeCursor(cursor);
      params.push(created_at, id);
      conditions.push(
        `(created_at, id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Fetch limit+1 rows — the extra one tells us if there's a next page
    params.push(limit + 1);
    const query = `
      SELECT id, name, category, price, created_at, updated_at
      FROM products
      ${where}
      ORDER BY created_at DESC, id DESC
      LIMIT $${params.length}
    `;

    const result = await pool.query(query, params);
    const rows = result.rows;

    const hasNext = rows.length > limit;
    const data = hasNext ? rows.slice(0, limit) : rows;

    let next_cursor = null;
    if (hasNext) {
      const last = data[data.length - 1];
      next_cursor = encodeCursor(last.created_at, last.id);
    }

    res.json({ data, next_cursor, count: data.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /categories ───────────────────────────────────
app.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM products ORDER BY category'
    );
    res.json(result.rows.map(r => r.category));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Health check ──────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));