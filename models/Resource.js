// models/Resource.js
const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  link:      { type: String, required: true },
  subject:   { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
