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

// ONE-TO-ONE (unchanged)
router.get('/one-to-one/contacts', protect, async (req, res) => { /* ... */ })
router.get('/one-to-one/:username', protect, async (req, res) => { /* ... */ })
router.post('/one-to-one/:username', protect, async (req, res) => { /* ... */ })

module.exports = router
