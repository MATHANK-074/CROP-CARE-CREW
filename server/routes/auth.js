const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();

// Google OAuth client (optional)
const googleClientId = process.env.GOOGLE_CLIENT_ID;
let googleClient = null;
if (googleClientId) {
  googleClient = new OAuth2Client(googleClientId);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.params.id}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, phone, location } = req.body;
  if (!name || !email || !password || !phone) return res.status(400).json({ message: 'All fields required' });
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });
    const hash = await bcrypt.hash(password, 10);
    const userData = { name, email, password: hash, phone, profile_img: '', preferred_language: 'en', notifications_enabled: true, farm_size: 0, soilType: 'Loam', primaryCrop: 'Corn', farmingExperience: 'Beginner' };
    if (location && location.type === 'Point' && Array.isArray(location.coordinates)) {
      userData.location = location;
    }
    const user = await User.create(userData);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, location: user.location } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'All fields required' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, location: user.location } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/user/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/user/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    Object.assign(user, req.body);
    await user.save();
    res.json({ user });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile image
router.post('/user/:id/profile-image', auth, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create URL for the uploaded image
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

    // Update user profile with the new image URL
    user.profile_img = imageUrl;
    await user.save();

    res.json({ message: 'Profile image uploaded successfully', imageUrl });
  } catch (err) {
    console.error('Error uploading profile image:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
// --------------------
// OAuth endpoints
// --------------------

// Google Sign-In (Token-based from frontend)
// Frontend sends: { id_token: string }
router.post('/google', async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(400).json({ message: 'Google OAuth not configured' });
    }
    const { id_token } = req.body || {};
    if (!id_token) return res.status(400).json({ message: 'Missing id_token' });

    const ticket = await googleClient.verifyIdToken({ idToken: id_token, audience: googleClientId });
    const payload = ticket.getPayload();
    const email = payload?.email;
    const emailVerified = payload?.email_verified;
    const name = payload?.name || 'User';
    const picture = payload?.picture || '';

    if (!email || !emailVerified) {
      return res.status(400).json({ message: 'Google email not verified' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      // Ask client to complete minimal profile (e.g., phone) via /oauth/register
      return res.status(409).json({
        needsRegistration: true,
        suggested: { name, email, profile_img: picture }
      });
    }

    // Optionally update profile image if empty
    if (!user.profile_img && picture) {
      user.profile_img = picture;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '7d' });
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, location: user.location, profile_img: user.profile_img } });
  } catch (err) {
    console.error('Google OAuth error:', err.message);
    return res.status(500).json({ message: 'OAuth error' });
  }
});

// Complete registration for OAuth users (collect required fields like phone and location)
// Body: { name, email, phone, profile_img, location }
router.post('/oauth/register', async (req, res) => {
  try {
    const { name, email, phone, profile_img, location } = req.body || {};
    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'name, email, phone are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists. Please sign in.' });
    }

    // Generate a random password (not used, but required by schema)
    const randomPass = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    const hash = await bcrypt.hash(randomPass, 10);

    const userData = {
      name,
      email,
      password: hash,
      phone,
      profile_img: profile_img || '',
      preferred_language: 'en',
      notifications_enabled: true,
      farm_size: 0,
      soilType: 'Loam',
      primaryCrop: 'Corn',
      farmingExperience: 'Beginner'
    };

    // Add location data if provided
    if (location && location.type === 'Point' && Array.isArray(location.coordinates)) {
      userData.location = location;
    }

    const user = await User.create(userData);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '7d' });
    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        profile_img: user.profile_img
      }
    });
  } catch (err) {
    console.error('OAuth register error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});