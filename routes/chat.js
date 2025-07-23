// routes/chat.js
const express = require('express')
const router  = express.Router()
const Chat    = require('../models/Chat')
const User    = require('../models/User')
const { protect } = require('../middleware/authMiddleware')

// -------------------
// GLOBAL CHAT
// GET  /api/chat/global
router.get('/global', protect, async (req, res) => {
  try {
    const msgs = await Chat.find({ kind: 'global' })
      .sort('createdAt')
      .populate('sender', 'username')
    res.json(msgs)
  } catch (err) {
    console.error('[GLOBAL] fetch error', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/chat/global
router.post('/global', protect, async (req, res) => {
  try {
    const c = await Chat.create({
      kind:   'global',
      sender: req.userId,
      text:   req.body.text
    })
    await c.populate('sender', 'username')
    res.status(201).json(c)
  } catch (err) {
    console.error('[GLOBAL] send error', err)
    res.status(500).json({ message: 'Server error' })
  }
})


// -------------------
// GROUP CHAT
// GET  /api/chat/group
router.get('/group', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    const msgs = await Chat.find({
      kind:    'group',
      college: user.college
    })
      .sort('createdAt')
      .populate('sender', 'username')
    res.json(msgs)
  } catch (err) {
    console.error('[GROUP] fetch error', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/chat/group
router.post('/group', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    const c = await Chat.create({
      kind:    'group',
      sender:  req.userId,
      college: user.college,
      text:    req.body.text
    })
    await c.populate('sender', 'username')
    res.status(201).json(c)
  } catch (err) {
    console.error('[GROUP] send error', err)
    res.status(500).json({ message: 'Server error' })
  }
})


// -------------------
// ONE-TO-ONE CHAT
// GET contacts
router.get('/one-to-one/contacts', protect, async (req, res) => {
  try {
    const msgs = await Chat.find({
      kind: { $eq: 'one-to-one' },
      $or: [{ sender: req.userId }, { receiver: req.userId }]
    })
    const set = new Set()
    msgs.forEach(m => {
      const other = m.sender.equals(req.userId) ? m.receiver : m.sender
      set.add(other.toString())
    })
    const users = await User.find({ _id: { $in: [...set] } })
    res.json(users.map(u => ({ username: u.username })))
  } catch (err) {
    console.error('[1-1] contacts error', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// GET conversation
router.get('/one-to-one/:username', protect, async (req, res) => {
  try {
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
  } catch (err) {
    console.error('[1-1] fetch convo error', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// POST send message
router.post('/one-to-one/:username', protect, async (req, res) => {
  try {
    const other = await User.findOne({ username: req.params.username })
    if (!other) return res.status(404).json({ message: 'User not found' })

    const c = await Chat.create({
      kind:     'one-to-one',
      sender:   req.userId,
      receiver: other._id,
      text:     req.body.text
    })
    await c.populate('sender', 'username')
    res.status(201).json(c)
  } catch (err) {
    console.error('[1-1] send error', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
