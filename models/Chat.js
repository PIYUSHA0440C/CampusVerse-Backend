// models/Chat.js
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  type:         { type: String, enum:['global','group','private'], required: true },
  sender:       { type: mongoose.Schema.Types.ObjectId, ref:'User', required: true },
  text:         { type: String, required: true },
  groupName:    { type: String },           // for group chat
  participants: [{ type: String }]          // for private: ["alice_bob"]
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
