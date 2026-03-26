const express = require('express');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const { publishAfterContentSave } = require('../utils/auto-publish');
const router = express.Router();

const DATA_PATH = path.join(__dirname, '../../data/pages.json');

function readPages() {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); }
  catch { return {}; }
}

function writePages(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

router.get('/', auth, (req, res) => {
  res.json(readPages());
});

router.get('/:slug', auth, (req, res) => {
  const pages = readPages();
  const page = pages[req.params.slug];
  if (!page) return res.status(404).json({ error: 'Page not found' });
  res.json(page);
});

router.put('/:slug', auth, (req, res) => {
  const pages = readPages();
  pages[req.params.slug] = { ...pages[req.params.slug], ...req.body, updatedAt: new Date().toISOString() };
  writePages(pages);
  publishAfterContentSave('pages');
  res.json({ success: true, page: pages[req.params.slug] });
});

module.exports = router;
