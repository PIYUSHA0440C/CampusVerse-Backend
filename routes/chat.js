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

module.exports = router
