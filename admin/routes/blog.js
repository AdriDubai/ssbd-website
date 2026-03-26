const express = require('express');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const { deployToGitHub } = require('../utils/auto-publish');
const router = express.Router();

const DATA_PATH = path.join(__dirname, '../../data/blog.json');

function readBlog() {
  try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); }
  catch { return []; }
}
function writeBlog(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

router.get('/', auth, (req, res) => {
  res.json(readBlog());
});

router.get('/:id', auth, (req, res) => {
  const articles = readBlog();
  const article = articles.find(a => a.id === req.params.id);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  res.json(article);
});

router.post('/', auth, (req, res) => {
  const articles = readBlog();
  const article = {
    id: 'art_' + Date.now(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  articles.unshift(article);
  writeBlog(articles);
  deployToGitHub();
  res.json({ success: true, article });
});

router.put('/:id', auth, (req, res) => {
  const articles = readBlog();
  const idx = articles.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Article not found' });
  articles[idx] = { ...articles[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeBlog(articles);
  deployToGitHub();
  res.json({ success: true, article: articles[idx] });
});

router.delete('/:id', auth, (req, res) => {
  let articles = readBlog();
  articles = articles.filter(a => a.id !== req.params.id);
  writeBlog(articles);
  deployToGitHub();
  res.json({ success: true });
});

module.exports = router;
