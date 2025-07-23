// routes/event.js
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadMedia, createEvent, getEvents } = require('../controllers/eventController');

// Public: fetch all events
router.get('/', getEvents);

// Protected: create a new event (with optional media upload)
router.post('/', protect, uploadMedia, createEvent);

module.exports = router;
