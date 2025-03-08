import express from 'express';
import multer from 'multer';
import { Image } from 'image-js';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size is too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Please upload an image file with field name "image".' });
    }
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Resize image endpoint
app.post('/api/resize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const width = parseInt(req.query.width) || 300;
    const height = parseInt(req.query.height) || 300;

    const image = await Image.load(req.file.buffer);
    const resizedImage = await image.resize({ width, height });
    const imageBuffer = await resizedImage.toBuffer();

    res.set('Content-Type', 'image/jpeg');
    res.send(imageBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Grayscale conversion endpoint
app.post('/api/grayscale', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const image = await Image.load(req.file.buffer);
    const grayscaleImage = image.grey();
    const imageBuffer = await grayscaleImage.toBuffer();

    res.set('Content-Type', 'image/jpeg');
    res.send(imageBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rotate image endpoint
app.post('/api/rotate', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const degrees = parseInt(req.query.degrees) || 90;
    const image = await Image.load(req.file.buffer);
    const rotatedImage = image.rotate(degrees);
    const imageBuffer = await rotatedImage.toBuffer();

    res.set('Content-Type', 'image/jpeg');
    res.send(imageBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Blur image endpoint
app.post('/api/blur', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const sigma = parseFloat(req.query.sigma) || 5;
    const image = await Image.load(req.file.buffer);
    const blurredImage = image.gaussianFilter({ sigma });
    const imageBuffer = await blurredImage.toBuffer();

    res.set('Content-Type', 'image/jpeg');
    res.send(imageBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log(`Image processing API server running on http://localhost:${PORT}`);
});