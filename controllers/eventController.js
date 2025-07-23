// controllers/eventController.js
const Event      = require('../models/Event');
const cloudinary = require('cloudinary').v2;
const multer     = require('multer');

// Configure Cloudinary with correct env var names
cloudinary.config({
  cloud_name:    process.env.CLOUDINARY_CLOUD_NAME,
  api_key:       process.env.CLOUDINARY_API_KEY,
  api_secret:    process.env.CLOUDINARY_API_SECRET
});

// Multer memory storage for single “media” file
const storage = multer.memoryStorage();
exports.uploadMedia = multer({ storage }).single('media');

// Convert multer buffer to Base64 data URI
function toDataURI(file) {
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

// POST /api/events
exports.createEvent = async (req, res) => {
  try {
    const { title, desc, datetime, link } = req.body;
    let mediaUrl = '';

    if (req.file) {
      const dataUri = toDataURI(req.file);
      const uploadRes = await cloudinary.uploader.upload(dataUri);
      mediaUrl = uploadRes.secure_url;
    }

    const event = await Event.create({ title, desc, datetime, link, mediaUrl });
    res.status(201).json(event);
  } catch (err) {
    console.error('Event creation error:', err);
    res.status(500).json({ message: 'Event creation failed' });
  }
};

// GET /api/events
exports.getEvents = async (_req, res) => {
  try {
    const events = await Event.find().sort('-datetime');
    res.json(events);
  } catch (err) {
    console.error('Fetching events error:', err);
    res.status(500).json({ message: 'Fetching events failed' });
  }
};
