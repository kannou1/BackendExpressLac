// backend/models/conversation.js
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conversationId: { type: String, required: true },
  message: { type: String, required: true },
  response: { type: mongoose.Schema.Types.Mixed, required: true }, // <- accepts object or string
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Conversation', conversationSchema);
