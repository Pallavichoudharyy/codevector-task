// Change this to your deployed backend URL when hosted
const API_BASE = 'http://localhost:3000';

let cursorStack = [null]; // stack of cursors, index 0 = page 1
let currentPage = 0;
let currentCategory = '';

const grid = document.getElementById('productGrid');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const pageInfo = document.getElementById('pageInfo');
const categoryFilter = document.getElementById('categoryFilter');

async function loadCategories() {
  const res = await fetch(`${API_BASE}/categories`);
  const cats = await res.json();
  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
}

async function loadProducts(cursor = null) {
  grid.innerHTML = '<p>Loading...</p>';
  let url = `${API_BASE}/products?limit=20`;
  if (cursor) url += `&cursor=${cursor}`;
  if (currentCategory) url += `&category=${encodeURIComponent(currentCategory)}`;

  const res = await fetch(url);
  const { data, next_cursor } = await res.json();

  grid.innerHTML = '';
  data.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${p.name}</h3>
      <span class="category">${p.category}</span>
      <div class="price">₹${parseFloat(p.price).toLocaleString('en-IN')}</div>
    `;
    grid.appendChild(card);
  });

  // Update next cursor in stack
  cursorStack[currentPage + 1] = next_cursor;

  nextBtn.disabled = !next_cursor;
  prevBtn.disabled = currentPage === 0;
  pageInfo.textContent = `Page ${currentPage + 1}`;
}

nextBtn.addEventListener('click', () => {
  const nextCursor = cursorStack[currentPage + 1];
  currentPage++;
  loadProducts(nextCursor);
});

prevBtn.addEventListener('click', () => {
  currentPage--;
  loadProducts(cursorStack[currentPage] || null);
});

categoryFilter.addEventListener('change', () => {
  currentCategory = categoryFilter.value;
  cursorStack = [null];
  currentPage = 0;
  loadProducts(null);
});

// Init
loadCategories();
loadProducts();