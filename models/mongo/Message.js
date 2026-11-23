const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: { type: String, required: true, index: true },
  text: { type: String, required: true },
  user: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'messages' });

messageSchema.index({ room: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
