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
    console.log(`[GROUP CHAT] user ${req.userId} requested group messages`)

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
  try {
    // Find all chat messages where the current user is either sender or receiver
    const msgs = await Chat.find({
      kind: 'one-to-one',
      $or: [{ sender: req.userId }, { receiver: req.userId }]
    });

    const contactIds = new Set();
    msgs.forEach(m => {
      // Add the other participant's ID to the set
      if (m.sender && m.sender.equals(req.userId)) {
        if (m.receiver) contactIds.add(m.receiver.toString());
      } else if (m.receiver && m.receiver.equals(req.userId)) {
        if (m.sender) contactIds.add(m.sender.toString());
      }
    });

    // Fetch user details for the unique contact IDs
    const users = await User.find({ _id: { $in: [...contactIds] } }).select('username');
    res.json(users.map(u => ({ username: u.username })));
  } catch (err) {
    console.error('[ONE-TO-ONE CONTACTS] error:', err);
    res.status(500).json({ message: 'Error fetching contacts' });
  }
});

// NEW: Add a contact for one-to-one chat (implicitly by sending a message or explicitly adding)
router.post('/one-to-one/contacts', protect, async (req, res) => {
  try {
    const { contact } = req.body; // 'contact' is the username of the user to add
    const otherUser = await User.findOne({ username: contact });

    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if a chat already exists between these two users
    const existingChat = await Chat.findOne({
      kind: 'one-to-one',
      $or: [
        { sender: req.userId, receiver: otherUser._id },
        { sender: otherUser._id, receiver: req.userId }
      ]
    });

    if (existingChat) {
      return res.status(200).json({ message: 'Contact already exists' });
    }

    // Create a dummy chat entry to establish the contact, or rely on first message
    // For simplicity, we'll just return success if user exists.
    // The actual chat message creation will establish the 'contact' in the list.
    res.status(200).json({ message: 'Contact can be established' });

  } catch (err) {
    console.error('[ADD CONTACT] error:', err);
    res.status(500).json({ message: 'Error adding contact' });
  }
});


// ONE-TO-ONE fetch messages
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
    .populate('sender', 'username'); // Populate sender's username

    res.json(msgs);
  } catch (err) {
    console.error('[ONE-TO-ONE FETCH] error:', err);
    res.status(500).json({ message: 'Error fetching private messages' });
  }
});

// ONE-TO-ONE send message
router.post('/one-to-one/:username', protect, async (req, res) => {
  try {
    const other = await User.findOne({ username: req.params.username });
    if (!other) {
      return res.status(404).json({ message: 'User not found' });
    }

    const c = await Chat.create({
      kind:     'one-to-one',
      sender:   req.userId,
      receiver: other._id,
      text:     req.body.text
    });
    // Populate sender's username for the response
    await c.populate('sender', 'username');
    res.status(201).json(c);
  } catch (err) {
    console.error('[ONE-TO-ONE SEND] error:', err);
    res.status(500).json({ message: 'Error sending private message' });
  }
});

module.exports = router;
