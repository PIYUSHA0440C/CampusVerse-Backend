// routes/auth.js
const express    = require('express')
const bcrypt     = require('bcryptjs')
const jwt        = require('jsonwebtoken')
const User       = require('../models/User')     // adjust path if needed
const authMiddleware = require('../middleware/auth') // your auth guard
const router     = express.Router()

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password, college } = req.body
  if (!username || !email || !password || !college) {
    return res.status(400).json({ message: 'Missing fields' })
  }
  try {
    const hash = await bcrypt.hash(password, 12)
    await User.create({ username, email, password: hash, college })
    res.status(201).json({ message: 'Registered' })
  } catch (err) {
    res.status(400).json({
      message: err.code === 11000
        ? 'Username or email already taken'
        : 'Registration error'
    })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  // 1) Find user
  const user = await User.findOne({ username })
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  // 2) Verify password
  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  // 3) Generate JWT
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  // 4) Set secure, cross-site cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure:   true,
    sameSite: 'none',
    domain:   'campusverse-backend.onrender.com', // <-- adjust to your backend host
    path:     '/',
    maxAge:   7 * 24 * 60 * 60 * 1000           // 7 days
  })

  // 5) Send success
  res.json({ message: 'Logged in' })
})

// GET /api/auth/logout
router.get('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure:   true,
    sameSite: 'none',
    domain:   'campusverse-backend.onrender.com', // match above
    path:     '/'
  })
  res.json({ message: 'Logged out' })
})

// GET /api/auth/user
router.get('/user', authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId)
  res.json({ username: user.username, college: user.college })
})

module.exports = router
