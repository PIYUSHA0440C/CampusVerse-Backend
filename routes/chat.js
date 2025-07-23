// routes/chat.js
const express = require('express')
const router  = express.Router()
const Chat    = require('../models/Chat')
const User    = require('../models/User')
const { protect } = require('../middleware/authMiddleware')

// GLOBAL chat omitted for brevity…

// GROUP chat omitted for brevity…

// ONE-TO-ONE – contacts list
router.get('/one-to-one/contacts', protect, async (req, res) => {
  const msgs = await Chat.find({
    kind: 'one-to-one',
    $or: [{ sender: req.userId }, { receiver: req.userId }]
  })
  const set = new Set()
  msgs.forEach(m => {
    const other = m.sender.equals(req.userId) ? m.receiver : m.sender
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
    .populate('sender','username')

  console.log(`[CONVO] ${req.userId} ↔ ${other._id}: ${msgs.length} messages`)
  res.json(msgs)
})

// ONE-TO-ONE – send message
router.post('/one-to-one/:username', protect, async (req, res) => {
  const other = await User.findOne({ username: req.params.username })
  if (!other) return res.status(404).json({ message: 'User not found' })

  console.log(`[SEND] ${req.userId} → ${other._id}: "${req.body.text}"`)
  const c = await Chat.create({
    kind:     'one-to-one',
    sender:   req.userId,
    receiver: other._id,
    text:     req.body.text
  })
  await c.populate('sender','username')
  res.status(201).json(c)
})

module.exports = router
