// routes/chat.js
const express = require('express')
const router  = express.Router()
const Chat    = require('../models/Chat')
const User    = require('../models/User')
const { protect } = require('../middleware/authMiddleware')

// GLOBAL CHAT
router.get('/global', protect, async (req, res) => {
  const msgs = await Chat.find({ kind: 'global' })
    .sort('createdAt')
    .populate('sender', 'username')
  res.json(msgs)
})

router.post('/global', protect, async (req, res) => {
  const c = await Chat.create({
    kind:   'global',
    sender: req.userId,
    text:   req.body.text
  })
  res.status(201).json(c)
})

// GROUP CHAT
router.get('/group', protect, async (req, res) => {
  const user = await User.findById(req.userId)
  const msgs = await Chat.find({
    kind:    'group',
    college: user.college
  })
    .sort('createdAt')
    .populate('sender', 'username')
  res.json(msgs)
})

router.post('/group', protect, async (req, res) => {
  const user = await User.findById(req.userId)
  const c = await Chat.create({
    kind:    'group',
    sender:  req.userId,
    college: user.college,
    text:    req.body.text
  })
  res.status(201).json(c)
})

// ONE-TO-ONE CHAT (kept for completeness)
router.get('/one-to-one/contacts', protect, async (req, res) => {
  const userId = req.userId
  const msgs = await Chat.find({
    kind: { $eq: 'one-to-one' },
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

router.get('/one-to-one/:username', protect, async (req, res) => {
  const other = await User.findOne({ username: req.params.username })
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

router.post('/one-to-one/:username', protect, async (req, res) => {
  const other = await User.findOne({ username: req.params.username })
  const c = await Chat.create({
    kind:     'one-to-one',
    sender:   req.userId,
    receiver: other._id,
    text:     req.body.text
  })
  res.status(201).json(c)
})

module.exports = router
