// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  desc:     { type: String, required: true },
  datetime: { type: Date,   required: true },
  link:     { type: String, default: '' },
  mediaUrl: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
