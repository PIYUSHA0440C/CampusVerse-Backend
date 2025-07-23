// routes/chat.js
const express = require('express')
const router  = express.Router()
const Chat    = require('../models/Chat')
const User    = require('../models/User')
const { protect } = require('../middleware/authMiddleware')

// GLOBAL CHAT (unchanged)
router.get('/global', protect, async (req, res) => {
  const msgs = await Chat.find({ kind:'global' })
    .sort('createdAt')
    .populate('sender','username')
  res.json(msgs)
})
router.post('/global', protect, async (req, res) => {
  const c = await Chat.create({
    kind:'global', sender:req.userId, text:req.body.text
  })
  res.status(201).json(c)
})

// GROUP CHAT
router.get('/group', protect, async (req, res) => {
  try {
    console.log(`[GROUP CHAT] user ${req.userId} requested group messages`)  // << log here

    // find the user to get college
    const user = await User.findById(req.userId)
    if (!user) {
      console.warn('[GROUP CHAT] no such user:', req.userId)
      return res.status(404).json({ error:'User not found' })
    }

    const msgs = await Chat.find({
      kind:'group', 
      college: user.college
    })
      .sort('createdAt')
      .populate('sender','username')

    console.log(`[GROUP CHAT] returning ${msgs.length} messages for college "${user.college}"`)
    res.json(msgs)
  } catch (err) {
    console.error('[GROUP CHAT] error:', err)
    res.status(500).json({ error:'Server error' })
  }
})

router.post('/group', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    const c = await Chat.create({
      kind:'group',
      sender: req.userId,
      college: user.college,
      text: req.body.text
    })
    console.log(`[GROUP CHAT] user ${req.userId} posted "${req.body.text}"`)
    res.status(201).json(c)
  } catch (err) {
    console.error('[GROUP CHAT] post error:', err)
    res.status(500).json({ error:'Server error' })
  }
})

// ONE-TO-ONE contacts
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

// ONE-TO-ONE fetch messages
router.get('/one-to-one/:username', protect, async (req, res) => {
  const other = await User.findOne({ username: req.params.username })
  if (!other) return res.status(404).json({ message: 'User not found' })

  const msgs = await Chat.find({
    kind: 'one-to-one',
    $or: [
      { sender: req.userId, receiver: other._id },
      { sender: other._id, receiver: req.userId }
    ]
  })
  .sort('createdAt')
  .populate('sender', 'username')

  res.json(msgs)
})

// ONE-TO-ONE send message
router.post('/one-to-one/:username', protect, async (req, res) => {
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
})

module.exports = router
