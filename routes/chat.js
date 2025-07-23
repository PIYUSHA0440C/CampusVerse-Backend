// routes/chat.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getGlobal,   sendGlobal,
  getGroup,    sendGroup,
  getPrivate,  sendPrivate
} = require('../controllers/chatController');

// Global
router.get('/global', protect, getGlobal);
router.post('/global', protect, sendGlobal);

// Group
router.get('/group/:groupName', protect, getGroup);
router.post('/group',           protect, sendGroup);

// Private
router.get('/private/:withUser', protect, getPrivate);
router.post('/private',          protect, sendPrivate);

module.exports = router;
