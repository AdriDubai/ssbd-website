const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const SETTINGS_PATH = path.join(__dirname, '../../data/settings.json');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Initialize hashed password on first run
let passwordHash = null;

function getPasswordHash() {
  if (passwordHash) return passwordHash;
  // Check if there's a custom hash in settings
  try {
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    if (settings.adminPasswordHash) {
      passwordHash = settings.adminPasswordHash;
      return passwordHash;
    }
  } catch (e) { /* no settings yet */ }
  // Fall back to env
  passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
  return passwordHash;
}

router.post('/login', loginLimiter, (req, res) => {
  const { login, password } = req.body;

  if (login !== process.env.ADMIN_LOGIN) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const hash = getPasswordHash();
  if (!bcrypt.compareSync(password, hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ user: login }, process.env.JWT_SECRET, { expiresIn: '24h' });

  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  });

  res.json({ success: true, token });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

router.get('/check', (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.json({ authenticated: false });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ authenticated: true });
  } catch {
    res.json({ authenticated: false });
  }
});

router.post('/change-password', require('../middleware/auth'), (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const hash = getPasswordHash();

  if (!bcrypt.compareSync(currentPassword, hash)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  passwordHash = newHash;

  // Save to settings
  let settings = {};
  try { settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')); } catch (e) {}
  settings.adminPasswordHash = newHash;
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));

  res.json({ success: true });
});

module.exports = router;
