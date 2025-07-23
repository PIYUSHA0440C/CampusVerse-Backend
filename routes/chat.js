// routes/chat.js
const express = require('express')
const router  = express.Router()
const Chat    = require('../models/Chat')
const User    = require('../models/User')
const { protect } = require('../middleware/authMiddleware')

// -------------------
// GLOBAL CHAT
// -------------------

// GET  /api/chat/global
router.get('/global', protect, async (req, res) => {
  try {
    const msgs = await Chat.find({ kind: 'global' })
      .sort({ createdAt: 1 })
      .populate('sender', 'username')
    res.json(msgs)
  } catch (err) {
    console.error(err)
    res.status(500).end()
  }
})

// POST /api/chat/global
router.post('/global', protect, async (req, res) => {
  try {
    const c = await Chat.create({
      kind: 'global',
      sender: req.userId,
      text:   req.body.text
    })
    res.status(201).json(c)
  } catch (err) {
    console.error(err)
    res.status(500).end()
  }
})


// -------------------
// GROUP CHAT
// -------------------

// GET  /api/chat/group
router.get('/group', protect, async (req, res) => {
  try {
    // fetch the user so we know their college
    const user = await User.findById(req.userId)
    const msgs = await Chat.find({
      kind:    'group',
      college: user.college
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username')
    res.json(msgs)
  } catch (err) {
    console.error(err)
    res.status(500).end()
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
    res.status(201).json(c)
  } catch (err) {
    console.error(err)
    res.status(500).end()
  }
})


// -------------------
// ONE-TO-ONE CHAT
// -------------------

// GET contacts list
// GET  /api/chat/one-to-one/contacts
router.get('/one-to-one/contacts', protect, async (req, res) => {
  try {
    const userId = req.userId
    const msgs = await Chat.find({
      kind: { $eq: 'one-to-one' },
      $or: [
        { sender:   userId },
        { receiver: userId }
      ]
    })

    // collect unique other-user IDs
    const set = new Set()
    msgs.forEach(m => {
      const other = m.sender.equals(userId) ? m.receiver : m.sender
      set.add(other.toString())
    })

    const users = await User.find({ _id: { $in: [...set] } })
    res.json(users.map(u => ({ username: u.username })))
  } catch (err) {
    console.error(err)
    res.status(500).end()
  }
})

// GET conversation
// GET  /api/chat/one-to-one/:username
router.get('/one-to-one/:username', protect, async (req, res) => {
  try {
    const other = await User.findOne({ username: req.params.username })
    if (!other) return res.status(404).end()

    const msgs = await Chat.find({
      kind: 'one-to-one',
      $or: [
        { sender: req.userId,    receiver: other._id },
        { sender: other._id,     receiver: req.userId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username')

    res.json(msgs)
  } catch (err) {
    console.error(err)
    res.status(500).end()
  }
})

// POST send message
// POST /api/chat/one-to-one/:username
router.post('/one-to-one/:username', protect, async (req, res) => {
  try {
    const other = await User.findOne({ username: req.params.username })
    if (!other) return res.status(404).end()

    const c = await Chat.create({
      kind:     'one-to-one',
      sender:   req.userId,
      receiver: other._id,
      text:     req.body.text
    })
    res.status(201).json(c)
  } catch (err) {
    console.error(err)
    res.status(500).end()
  }
})

module.exports = router
