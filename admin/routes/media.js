const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../../uploads/images');
const VIDEO_DIR = path.join(__dirname, '../../uploads/videos');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];
const MAX_SIZE = 200 * 1024 * 1024; // 200MB

const upload = multer({
  dest: path.join(__dirname, '../tmp'),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
});

// List all uploads
router.get('/', auth, (req, res) => {
  const files = [];
  const dirs = ['images', 'videos'];
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, '../../uploads', dir);
    if (!fs.existsSync(dirPath)) return;
    fs.readdirSync(dirPath).forEach(file => {
      const stat = fs.statSync(path.join(dirPath, file));
      files.push({
        name: file,
        path: `/uploads/${dir}/${file}`,
        size: stat.size,
        uploadedAt: stat.mtime.toISOString(),
        type: dir,
      });
    });
  });
  files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  res.json(files);
});

// Upload
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    const baseName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();

    if (req.file.mimetype.startsWith('image/')) {
      const outName = `${baseName}_${timestamp}.webp`;
      const outPath = path.join(UPLOAD_DIR, outName);
      await sharp(req.file.path)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outPath);
      fs.unlinkSync(req.file.path);
      res.json({ success: true, file: { name: outName, path: `/uploads/images/${outName}` } });
    } else {
      // Video — move as-is
      const outName = `${baseName}_${timestamp}${ext}`;
      const outPath = path.join(__dirname, '../../uploads/videos', outName);
      fs.renameSync(req.file.path, outPath);
      res.json({ success: true, file: { name: outName, path: `/uploads/videos/${outName}` } });
    }
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:type/:name', auth, (req, res) => {
  const filePath = path.join(__dirname, '../../uploads', req.params.type, req.params.name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

module.exports = router;
