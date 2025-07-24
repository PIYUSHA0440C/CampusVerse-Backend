// routes/chat.js
const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// GLOBAL CHAT (unchanged)
router.get('/global', protect, async (req, res) => {
  const msgs = await Chat.find({ kind: 'global' })
    .sort('createdAt')
    .populate('sender', 'username');
  res.json(msgs);
});

router.post('/global', protect, async (req, res) => {
  const c = await Chat.create({
    kind: 'global',
    sender: req.userId,
    text: req.body.text
  });
  res.status(201).json(c);
});

// GROUP CHAT
router.get('/group', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const msgs = await Chat.find({
      kind: 'group',
      college: user.college
    })
      .sort('createdAt')
      .populate('sender', 'username');

    res.json(msgs);
  } catch (err) {
    console.error('[GROUP CHAT] error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/group', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const c = await Chat.create({
      kind: 'group',
      sender: req.userId,
      college: user.college,
      text: req.body.text
    });
    res.status(201).json(c);
  } catch (err) {
    console.error('[GROUP CHAT] post error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ONE-TO-ONE: Fetch contacts
router.get('/one-to-one/contacts', protect, async (req, res) => {
  try {
    const msgs = await Chat.find({
      kind: 'one-to-one',
      $or: [{ sender: req.userId }, { receiver: req.userId }]
    });

    const contactIds = new Set();
    msgs.forEach(m => {
      if (m.sender && m.sender.equals(req.userId)) {
        if (m.receiver) contactIds.add(m.receiver.toString());
      } else if (m.receiver && m.receiver.equals(req.userId)) {
        if (m.sender) contactIds.add(m.sender.toString());
      }
    });

    const users = await User.find({ _id: { $in: [...contactIds] } }).select('username');
    res.json(users.map(u => ({ username: u.username })));
  } catch (err) {
    console.error('[ONE-TO-ONE CONTACTS] error:', err);
    res.status(500).json({ message: 'Error fetching contacts' });
  }
});

// ONE-TO-ONE: Add contact
router.post('/one-to-one/contacts', protect, async (req, res) => {
  try {
    const { contact } = req.body;
    const otherUser = await User.findOne({ username: contact });

    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if a chat already exists
    const existingChat = await Chat.findOne({
      kind: 'one-to-one',
      $or: [
        { sender: req.userId, receiver: otherUser._id },
        { sender: otherUser._id, receiver: req.userId }
      ]
    });

    // If chat doesn't exist, create a dummy invisible one to trigger contact addition
    if (!existingChat) {
      await Chat.create({
        kind: 'one-to-one',
        sender: req.userId,
        receiver: otherUser._id,
        text: '[contact-init]'
      });
    }

    res.status(200).json({ message: 'Contact added' });
  } catch (err) {
    console.error('[ADD CONTACT] error:', err);
    res.status(500).json({ message: 'Error adding contact' });
  }
});

// ONE-TO-ONE: Fetch messages
router.get('/one-to-one/:username', protect, async (req, res) => {
  try {
    const other = await User.findOne({ username: req.params.username });
    if (!other) {
      return res.status(404).json({ message: 'User not found' });
    }

    const msgs = await Chat.find({
      kind: 'one-to-one',
      $or: [
        { sender: req.userId, receiver: other._id },
        { sender: other._id, receiver: req.userId }
      ]
    })
      .sort('createdAt')
      .populate('sender', 'username');

    // Filter out system-generated empty messages (optional)
    const filtered = msgs.filter(m => m.text !== '[contact-init]');
    res.json(filtered);
  } catch (err) {
    console.error('[ONE-TO-ONE FETCH] error:', err);
    res.status(500).json({ message: 'Error fetching private messages' });
  }
});

// ONE-TO-ONE: Send message
router.post('/one-to-one/:username', protect, async (req, res) => {
  try {
    const other = await User.findOne({ username: req.params.username });
    if (!other) {
      return res.status(404).json({ message: 'User not found' });
    }

    const c = await Chat.create({
      kind: 'one-to-one',
      sender: req.userId,
      receiver: other._id,
      text: req.body.text
    });

    await c.populate('sender', 'username');
    res.status(201).json(c);
  } catch (err) {
    console.error('[ONE-TO-ONE SEND] error:', err);
    res.status(500).json({ message: 'Error sending private message' });
  }
});

module.exports = router;
