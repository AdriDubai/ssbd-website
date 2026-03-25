const express = require('express');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const router = express.Router();

const DATA_PATH = path.join(__dirname, '../../data/portfolio.json');

function readPortfolio() {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); }
  catch { return []; }
}
function writePortfolio(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

router.get('/', auth, (req, res) => {
  res.json(readPortfolio());
});

router.post('/', auth, (req, res) => {
  const items = readPortfolio();
  const item = { id: 'proj_' + Date.now(), ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  items.unshift(item);
  writePortfolio(items);
  res.json({ success: true, item });
});

router.put('/:id', auth, (req, res) => {
  const items = readPortfolio();
  const idx = items.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  items[idx] = { ...items[idx], ...req.body, updatedAt: new Date().toISOString() };
  writePortfolio(items);
  res.json({ success: true, item: items[idx] });
});

router.delete('/:id', auth, (req, res) => {
  let items = readPortfolio();
  items = items.filter(p => p.id !== req.params.id);
  writePortfolio(items);
  res.json({ success: true });
});

module.exports = router;
