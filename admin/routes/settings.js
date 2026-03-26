const express = require('express');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const { deployToGitHub } = require('../utils/auto-publish');
const router = express.Router();

const DATA_PATH = path.join(__dirname, '../../data/settings.json');
const TRANSLATIONS_PATH = path.join(__dirname, '../../data/translations.json');

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return {}; }
}
function writeJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

// Settings
router.get('/', auth, (req, res) => {
  const settings = readJSON(DATA_PATH);
  // Don't send password hash
  const { adminPasswordHash, ...safe } = settings;
  res.json(safe);
});

router.put('/', auth, (req, res) => {
  const current = readJSON(DATA_PATH);
  const updated = { ...current, ...req.body, updatedAt: new Date().toISOString() };
  writeJSON(DATA_PATH, updated);
  deployToGitHub();
  res.json({ success: true });
});

// Translations
router.get('/translations', auth, (req, res) => {
  res.json(readJSON(TRANSLATIONS_PATH));
});

router.put('/translations', auth, (req, res) => {
  writeJSON(TRANSLATIONS_PATH, req.body);
  deployToGitHub();
  res.json({ success: true });
});

// Dashboard stats
router.get('/dashboard', auth, (req, res) => {
  const pages = readJSON(path.join(__dirname, '../../data/pages.json'));
  const blog = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/blog.json'), 'utf8')); } catch { return []; } })();
  const portfolio = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/portfolio.json'), 'utf8')); } catch { return []; } })();

  let mediaCount = 0;
  ['images', 'videos'].forEach(dir => {
    const p = path.join(__dirname, '../../uploads', dir);
    if (fs.existsSync(p)) mediaCount += fs.readdirSync(p).length;
  });

  res.json({
    pages: Object.keys(pages).length,
    blogArticles: blog.length,
    portfolioProjects: portfolio.length,
    mediaFiles: mediaCount,
  });
});

module.exports = router;
