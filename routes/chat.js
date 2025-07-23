// routes/chat.js
const express = require('express')
const router  = express.Router()
const Chat    = require('../models/Chat')
const User    = require('../models/User')
const { protect } = require('../middleware/authMiddleware')

// GLOBAL
router.get('/global', protect, async (req,res) => {
  const msgs = await Chat.find({ kind:'global' })
    .sort('createdAt')
    .populate('sender','username')
  res.json(msgs)
})
router.post('/global', protect, async (req,res) => {
  const c = await Chat.create({
    kind:'global', sender:req.userId, text:req.body.text
  })
  await c.populate('sender','username')
  res.status(201).json(c)
})

// COLLEGE GROUP
router.get('/group', protect, async (req,res) => {
  const u = await User.findById(req.userId)
  const msgs = await Chat.find({
    kind:'group', college:u.college
  })
    .sort('createdAt')
    .populate('sender','username')
  res.json(msgs)
})
router.post('/group', protect, async (req,res) => {
  const u = await User.findById(req.userId)
  const c = await Chat.create({
    kind:'group',
    sender:req.userId,
    college:u.college,
    text:req.body.text
  })
  await c.populate('sender','username')
  res.status(201).json(c)
})

// ONE-TO-ONE contacts
router.get('/one-to-one/contacts', protect, async (req,res) => {
  const msgs = await Chat.find({
    kind:'one-to-one',
    $or:[{ sender:req.userId },{ receiver:req.userId }]
  })
  const set = new Set()
  msgs.forEach(m => {
    const other = m.sender.equals(req.userId)?m.receiver:m.sender
    set.add(other.toString())
  })
  const users = await User.find({ _id: { $in:[...set] } })
  res.json(users.map(u=>({ username:u.username })))
})

// ONE-TO-ONE conversation
router.get('/one-to-one/:username', protect, async (req,res) => {
  const other = await User.findOne({ username:req.params.username })
  if (!other) return res.status(404).json({ message:'User not found' })
  const msgs = await Chat.find({
    kind:'one-to-one',
    $or:[
      { sender:req.userId,    receiver:other._id },
      { sender:other._id,     receiver:req.userId }
    ]
  })
    .sort('createdAt')
    .populate('sender','username')
  res.json(msgs)
})

// ONE-TO-ONE send
router.post('/one-to-one/:username', protect, async (req,res) => {
  const other = await User.findOne({ username:req.params.username })
  if (!other) return res.status(404).json({ message:'User not found' })
  const c = await Chat.create({
    kind:'one-to-one',
    sender:req.userId,
    receiver:other._id,
    text:req.body.text
  })
  await c.populate('sender','username')
  res.status(201).json(c)
})

module.exports = router
