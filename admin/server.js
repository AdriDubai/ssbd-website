require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

// Ensure data dir exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
['pages.json', 'blog.json', 'portfolio.json', 'settings.json', 'translations.json'].forEach(f => {
  const fp = path.join(dataDir, f);
  if (!fs.existsSync(fp)) {
    const initial = (f === 'blog.json' || f === 'portfolio.json') ? '[]' : '{}';
    fs.writeFileSync(fp, initial);
  }
});

// Ensure upload dirs
['uploads/images', 'uploads/videos', 'admin/tmp'].forEach(d => {
  const fp = path.join(__dirname, '..', d);
  if (!fs.existsSync(fp)) fs.mkdirSync(fp, { recursive: true });
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Serve admin SPA
app.use('/admin', express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pages', require('./routes/pages'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/media', require('./routes/media'));
app.use('/api/settings', require('./routes/settings'));

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// SPA fallback for admin routes
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`SSBD Admin running on port ${PORT}`);
});
