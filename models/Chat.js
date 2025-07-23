// models/Chat.js
const mongoose = require('mongoose')
const { Schema } = mongoose

const chatSchema = new Schema({
  kind:     { type: String, enum: ['global','group','one-to-one'], required: true },
  sender:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  college:  { type: String },   // for group chat
  receiver: { type: Schema.Types.ObjectId, ref: 'User' }, // for one-to-one
  text:     { type: String, required: true },
  createdAt:{ type: Date, default: Date.now }
})

module.exports = mongoose.model('Chat', chatSchema)
