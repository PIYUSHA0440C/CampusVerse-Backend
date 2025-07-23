// models/Book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, enum: ['lend','borrow'], required: true },
  title:       { type: String, required: true },
  author:      { type: String },
  description: { type: String },
  reason:      { type: String },
  accepted:    { type: Boolean, default: false },
  acceptedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
