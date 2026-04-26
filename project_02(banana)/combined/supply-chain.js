// ============================================================
// SUPPLY CHAIN PANEL
// Renders a static breakdown of cost stages alongside each
// item in the Price Volatility panel.
// ============================================================

const DEFAULT_SC_STEPS = [
  { label: 'PRODUCTION',    note: 'raw materials, labor',         share: 0.25 },
  { label: 'TRANSPORT',     note: 'shipping, logistics, fuel',    share: 0.18 },
  { label: 'WHOLESALE',     note: 'distribution, warehousing',    share: 0.17 },
  { label: 'RETAIL',        note: 'markup, overhead, margin',     share: 0.40 },
];

const ITEM_SC_STEPS = {
  15: [ // Banana
    { label: 'PLANTATION',   note: 'labor, land, pesticides',      share: 0.20 },
    { label: 'TRANSPORT',    note: 'refrigerated shipping, fuel',   share: 0.25 },
    { label: 'WHOLESALE',    note: 'import duties, ripening',       share: 0.18 },
    { label: 'RETAIL',       note: 'markup, display, shrinkage',    share: 0.37 },
  ],
  10: [ // Rice
    { label: 'FARMING',      note: 'labor, irrigation, seeds',     share: 0.28 },
    { label: 'MILLING',      note: 'processing, packaging',        share: 0.15 },
    { label: 'TRANSPORT',    note: 'logistics, cold chain',        share: 0.17 },
    { label: 'RETAIL',       note: 'markup, storage, margin',      share: 0.40 },
  ],
  12: [ // Eggs
    { label: 'FARMING',      note: 'feed, labor, facilities',      share: 0.35 },
    { label: 'PROCESSING',   note: 'grading, packaging',           share: 0.15 },
    { label: 'TRANSPORT',    note: 'refrigerated logistics',       share: 0.15 },
    { label: 'RETAIL',       note: 'markup, storage, waste',       share: 0.35 },
  ],
  13: [ // Salmon
    { label: 'AQUACULTURE',  note: 'feed, labor, fish farms',      share: 0.30 },
    { label: 'PROCESSING',   note: 'filleting, packaging',         share: 0.18 },
    { label: 'TRANSPORT',    note: 'cold chain, air freight',      share: 0.20 },
    { label: 'RETAIL',       note: 'markup, display, waste',       share: 0.32 },
  ],
  16: [ // Chicken
    { label: 'FARMING',      note: 'feed, labor, facilities',      share: 0.32 },
    { label: 'PROCESSING',   note: 'slaughter, packaging',         share: 0.18 },
    { label: 'TRANSPORT',    note: 'refrigerated logistics',       share: 0.15 },
    { label: 'RETAIL',       note: 'markup, storage',              share: 0.35 },
  ],
  22: [ // Uniqlo HeatTech
    { label: 'MATERIALS',    note: 'synthetic fibers, yarn',       share: 0.20 },
    { label: 'MANUFACTURING',note: 'factory labor, overhead',      share: 0.22 },
    { label: 'TRANSPORT',    note: 'container shipping',           share: 0.08 },
    { label: 'RETAIL',       note: 'brand, store, margin',         share: 0.50 },
  ],
  23: [ // Uniqlo T-shirt
    { label: 'MATERIALS',    note: 'cotton, yarn, dye',            share: 0.18 },
    { label: 'MANUFACTURING',note: 'factory labor, overhead',      share: 0.20 },
    { label: 'TRANSPORT',    note: 'container shipping',           share: 0.12 },
    { label: 'RETAIL',       note: 'brand, store, margin',         share: 0.50 },
  ],
  24: [ // AirPods
    { label: 'COMPONENTS',   note: 'chips, battery, drivers',      share: 0.22 },
    { label: 'ASSEMBLY',     note: 'factory labor, overhead',      share: 0.10 },
    { label: 'TRANSPORT',    note: 'air freight, customs',         share: 0.08 },
    { label: 'BRAND',        note: 'premium, marketing, margin',   share: 0.60 },
  ],
  25: [ // iPhone
    { label: 'COMPONENTS',   note: 'chips, screen, sensors',       share: 0.30 },
    { label: 'ASSEMBLY',     note: 'Foxconn labor, factory',       share: 0.06 },
    { label: 'TRANSPORT',    note: 'logistics, customs',           share: 0.04 },
    { label: 'BRAND',        note: 'R&D, marketing, margin',       share: 0.60 },
  ],
  5: [ // Starbucks black coffee
    { label: 'INGREDIENTS',  note: 'coffee beans, water',          share: 0.10 },
    { label: 'LABOR',        note: 'barista wages, training',      share: 0.30 },
    { label: 'OCCUPANCY',    note: 'rent, utilities, fixtures',    share: 0.25 },
    { label: 'BRAND',        note: 'franchise fee, margin',        share: 0.35 },
  ],
  6: [ // Starbucks latte
    { label: 'INGREDIENTS',  note: 'coffee, milk, syrup',          share: 0.12 },
    { label: 'LABOR',        note: 'barista wages, training',      share: 0.28 },
    { label: 'OCCUPANCY',    note: 'rent, utilities, fixtures',    share: 0.25 },
    { label: 'BRAND',        note: 'franchise fee, margin',        share: 0.35 },
  ],
  26: [ // Phone bill
    { label: 'NETWORK',      note: 'towers, spectrum, hardware',   share: 0.35 },
    { label: 'OPERATIONS',   note: 'staff, customer service',      share: 0.20 },
    { label: 'REGULATION',   note: 'licensing, compliance',        share: 0.10 },
    { label: 'PROFIT',       note: 'shareholder return',           share: 0.35 },
  ],
  27: [ // Rent
    { label: 'LAND VALUE',   note: 'location, scarcity, zoning',   share: 0.45 },
    { label: 'MORTGAGE',     note: 'loan interest, debt service',  share: 0.30 },
    { label: 'MAINTENANCE',  note: 'repairs, management fees',     share: 0.10 },
    { label: 'PROFIT',       note: 'landlord return on capital',   share: 0.15 },
  ],
  28: [ // Utilities
    { label: 'GENERATION',   note: 'fuel, plant operations',       share: 0.35 },
    { label: 'GRID',         note: 'transmission, infrastructure', share: 0.30 },
    { label: 'REGULATION',   note: 'compliance, safety',           share: 0.15 },
    { label: 'COMPANY',      note: 'admin, profit margin',         share: 0.20 },
  ],
  29: [ // Subway ride
    { label: 'INFRASTRUCTURE',note: 'tracks, stations, trains',   share: 0.40 },
    { label: 'OPERATIONS',   note: 'drivers, maintenance staff',   share: 0.30 },
    { label: 'ENERGY',       note: 'electricity, fuel',            share: 0.15 },
    { label: 'ADMIN',        note: 'management, ticketing',        share: 0.15 },
  ],
};

function getSteps(itemId) {
  return ITEM_SC_STEPS[itemId] || DEFAULT_SC_STEPS;
}

function fmtPrice(val, isTokyo) {
  return isTokyo ? `¥${Math.round(val).toLocaleString()}` : `$${val.toFixed(2)}`;
}

// Called from volatility.js whenever the displayed item/city changes
function updateSupplyChainPanel(item, city) {
  const rowsEl  = document.getElementById('sc-panel-rows');
  const totalEl = document.getElementById('sc-panel-total');
  const barEl   = document.getElementById('sc-panel-bar');
  const cityEl  = document.getElementById('sc-panel-city');
  if (!rowsEl) return;

  const steps   = getSteps(item.id);
  const isTokyo = city === 'tokyo';
  const price   = isTokyo ? item.tokyoPrice : item.nycPrice;

  if (cityEl) cityEl.textContent = isTokyo ? 'TOKYO' : 'NEW YORK CITY';

  // Rows
  rowsEl.innerHTML = '';
  steps.forEach(step => {
    const partial = price * step.share;
    const row = document.createElement('div');
    row.className = 'sc-p-row';
    row.innerHTML = `
      <span class="sc-p-label">${step.label}</span>
      <span class="sc-p-note">${step.note}</span>
      <span class="sc-p-price">${fmtPrice(partial, isTokyo)}</span>
    `;
    rowsEl.appendChild(row);
  });

  // Total
  if (totalEl) {
    totalEl.innerHTML = `
      <span class="sc-p-label">TOTAL</span>
      <span class="sc-p-note"></span>
      <span class="sc-p-price">${fmtPrice(price, isTokyo)}</span>
    `;
  }

  // Proportion bar — segments sized by share
  if (barEl) {
    barEl.innerHTML = '';
    steps.forEach((step, i) => {
      const seg = document.createElement('div');
      seg.className = `sc-bar-seg sc-bar-seg-${i}`;
      seg.style.flex = step.share;
      seg.setAttribute('title', `${step.label} ${Math.round(step.share * 100)}%`);
      const pct = document.createElement('span');
      pct.className = 'sc-bar-pct';
      pct.textContent = Math.round(step.share * 100) + '%';
      seg.appendChild(pct);
      barEl.appendChild(seg);
    });
  }
}
