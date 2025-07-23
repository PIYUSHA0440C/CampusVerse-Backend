// routes/chat.js
const express = require('express')
const router  = express.Router()
const Chat    = require('../models/Chat')
const User    = require('../models/User')
const { protect } = require('../middleware/authMiddleware')

// … (global & group routes unchanged) …

// ONE-TO-ONE – contacts list
router.get('/one-to-one/contacts', protect, async (req, res) => {
  const userId = req.userId
  const msgs = await Chat.find({
    kind: 'one-to-one',
    $or: [{ sender: userId }, { receiver: userId }]
  })
  const set = new Set()
  msgs.forEach(m => {
    const other = m.sender.equals(userId) ? m.receiver : m.sender
    set.add(other.toString())
  })
  const users = await User.find({ _id: { $in: [...set] } })
  res.json(users.map(u => ({ username: u.username })))
})

// ONE-TO-ONE – fetch conversation
router.get('/one-to-one/:username', protect, async (req, res) => {
  const other = await User.findOne({ username: req.params.username })
  if (!other) return res.status(404).json({ message: 'User not found' })

  const msgs = await Chat.find({
    kind: 'one-to-one',
    $or: [
      { sender: req.userId,    receiver: other._id },
      { sender: other._id,     receiver: req.userId }
    ]
  })
    .sort('createdAt')
    .populate('sender', 'username')

  res.json(msgs)
})

// ONE-TO-ONE – send message
router.post('/one-to-one/:username', protect, async (req, res) => {
  try {
    const other = await User.findOne({ username: req.params.username })
    if (!other) return res.status(404).json({ message: 'User not found' })

    console.log(`[ONE-TO-ONE] ${req.userId} → ${other._id}:`, req.body.text)

    const c = await Chat.create({
      kind:     'one-to-one',
      sender:   req.userId,
      receiver: other._id,
      text:     req.body.text
    })

    // populate for frontend convenience
    await c.populate('sender', 'username')
    res.status(201).json(c)
  } catch (err) {
    console.error('[ONE-TO-ONE] send error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
