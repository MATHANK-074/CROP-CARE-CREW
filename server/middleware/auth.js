const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  // Only log in development mode
  const isDev = process.env.NODE_ENV === 'development';

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (isDev) console.log('❌ No valid authorization header found');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      if (isDev) console.log('❌ User not found in database for ID:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }

    // Only log successful auth in development mode occasionally
    if (isDev && Math.random() < 0.1) {
      console.log('🔐 Auth successful for user:', user._id);
    }

    req.user = user;
    next();
  } catch (err) {
    if (isDev) console.error('❌ Auth error:', err.message);
    res.status(401).json({ message: 'Token is not valid', error: err.message });
  }
};
