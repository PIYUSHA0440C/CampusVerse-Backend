// routes/user.js
const express = require('express')
const router  = express.Router()
const User    = require('../models/User')
const { protect } = require('../middleware/authMiddleware')

// GET /api/users?search=abc
router.get('/', protect, async (req, res) => {
  try {
    const { search } = req.query
    const filter = search
      ? { username: { $regex: search, $options: 'i' } }
      : {}
    const users = await User.find(filter)
      .select('username')
      .limit(10)
    res.json(users)
  } catch (err) {
    console.error('User search error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
