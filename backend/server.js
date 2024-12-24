const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
console.log('Starting server...');

const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3000', // Update with your frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Video Schema
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: { type: [String], default: [] },
  fileSize: { type: Number, required: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const Video = mongoose.model('Video', videoSchema);

// Middleware: Authentication
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Extract token
  if (!token) return res.status(401).send('Access Denied'); // No token provided

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET); // Verify token
    req.user = verified; // Attach user info to request
    next();
  } catch (err) {
    console.error('Token Verification Failed:', err.message);
    res.status(400).send('Invalid Token');
  }
};

// Video Upload
const upload = multer({ dest: 'uploads/' });
app.post('/upload', authenticate, upload.single('video'), async (req, res) => {
  console.log('File:', req.file); // Logs the uploaded file details
  console.log('Body:', req.body); // Logs the form fields

  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const { title, description, tags } = req.body;
    const video = new Video({
      title,
      description,
      tags: tags ? tags.split(',') : [],
      fileSize: req.file.size,
      uploadedBy: req.user.id,
    });

    // Save video metadata in MongoDB
    await video.save();
    res.send('Video uploaded successfully!');
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Fetch Videos
app.get('/videos', authenticate, async (req, res) => {
  try {
    const videos = await Video.find({ uploadedBy: req.user.id });
    res.json(videos);
  } catch (err) {
    console.error('Error fetching videos:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Start Server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
