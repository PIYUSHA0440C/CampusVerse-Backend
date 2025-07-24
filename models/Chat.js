const chatSchema = new Schema({
  kind: { // Changed from 'type' to 'kind' for consistency with routes
    type: String,
    enum: ['global','group','one-to-one'],
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // for group chat:
  college: {
    type: String
  },
  // for one-to-one:
  receiver: { // Added receiver field for one-to-one chats
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})
module.exports = mongoose.model('Chat', chatSchema)
