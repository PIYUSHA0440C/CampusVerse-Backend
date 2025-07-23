// controllers/authController.js
const bcrypt = require('bcryptjs');
const User   = require('../models/User');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res) => {
  const { username, email, college, password } = req.body;
  try {
    // Check if username or email exists
    const exists = await User.findOne({
      $or: [{ username }, { email }]
    });
    if (exists) {
      return res.status(400).json({ message: 'Username or email in use' });
    }

    // Hash password & create user
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, college, password: hash });

    // Issue JWT cookie
    const token = generateToken(user._id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV==='production',
      sameSite: 'lax',
      maxAge: 7*24*60*60*1000
    });

    res.status(201).json({ username: user.username });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV==='production',
      sameSite: 'lax',
      maxAge: 7*24*60*60*1000
    });
    res.json({ username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
};

exports.getUser = (req, res) => {
  const { username, college } = req.user;
  res.json({ username, college });
};

exports.logout = (req, res) => {
  res.clearCookie('token', {
    sameSite: 'lax',
    secure: process.env.NODE_ENV==='production'
  });
  res.json({ message: 'Logged out' });
};
