// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.user   = await User.findById(req.userId).select('-password');
    if (!req.user) throw new Error('User not found');
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};
