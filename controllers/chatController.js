// controllers/chatController.js
const Chat = require('../models/Chat');

// GLOBAL
exports.sendGlobal = async (req, res) => {
  try {
    const msg = await Chat.create({
      type: 'global',
      sender: req.userId,
      text: req.body.text
    });
    res.status(201).json(msg);
  } catch (err) {
    console.error('sendGlobal error:', err);
    res.status(500).json({ message: 'Send global failed' });
  }
};

exports.getGlobal = async (_req, res) => {
  try {
    const msgs = await Chat.find({ type:'global' })
      .sort('createdAt').populate('sender','username');
    res.json(msgs);
  } catch (err) {
    console.error('getGlobal error:', err);
    res.status(500).json({ message: 'Fetch global failed' });
  }
};

// GROUP
exports.sendGroup = async (req, res) => {
  try {
    const { text, groupName } = req.body;
    const msg = await Chat.create({
      type: 'group',
      sender: req.userId,
      text,
      groupName
    });
    res.status(201).json(msg);
  } catch (err) {
    console.error('sendGroup error:', err);
    res.status(500).json({ message: 'Send group failed' });
  }
};

exports.getGroup = async (req, res) => {
  try {
    const msgs = await Chat.find({
      type:'group', groupName: req.params.groupName
    })
    .sort('createdAt').populate('sender','username');
    res.json(msgs);
  } catch (err) {
    console.error('getGroup error:', err);
    res.status(500).json({ message: 'Fetch group failed' });
  }
};

// PRIVATE
exports.sendPrivate = async (req, res) => {
  try {
    const { text, toUsername } = req.body;
    const participants = [req.user.username, toUsername].sort().join('_');
    const msg = await Chat.create({
      type: 'private',
      sender: req.userId,
      text,
      participants: [participants]
    });
    res.status(201).json(msg);
  } catch (err) {
    console.error('sendPrivate error:', err);
    res.status(500).json({ message: 'Send private failed' });
  }
};

exports.getPrivate = async (req, res) => {
  try {
    const participants = [req.user.username, req.params.withUser]
                           .sort().join('_');
    const msgs = await Chat.find({
      type:'private', participants
    })
    .sort('createdAt').populate('sender','username');
    res.json(msgs);
  } catch (err) {
    console.error('getPrivate error:', err);
    res.status(500).json({ message: 'Fetch private failed' });
  }
};
