// models/Chat.js
const mongoose = require('mongoose')
const { Schema } = mongoose

const chatSchema = new Schema({
  kind:     { type:String,
              enum:['global','group','one-to-one'],
              required:true },
  sender:   { type:Schema.Types.ObjectId, ref:'User', required:true },
  college:  { type:String },               // for group
  receiver: { type:Schema.Types.ObjectId, ref:'User' }, // for 1-to-1
  text:     { type:String, required:true },
  createdAt:{ type:Date, default:Date.now }
})

module.exports = mongoose.model('Chat', chatSchema)
