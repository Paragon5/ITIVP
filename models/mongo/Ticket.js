const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  amount: { type: Number, default: 0 },
  date: { type: Date }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const ticketSchema = new mongoose.Schema({
  owner: { type: String, required: true },
  userId: { type: String },
  numbers: { type: [Number], required: true },
  purchaseDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'winner', 'expired'],
    default: 'active'
  },
  prizeAmount: { type: Number, default: 0 },
  tags: { type: [String], default: [] },
  payment: { type: paymentSchema },
  reviews: { type: [reviewSchema], default: [] }
}, {
  collection: 'tickets',
  timestamps: true
});

ticketSchema.index({ owner: 1, status: 1 });
ticketSchema.index({ userId: 1 });

ticketSchema.statics.findByTag = function (tag) {
  return this.find({ tags: tag });
};

ticketSchema.methods.addReview = function (review) {
  this.reviews.push(review);
  return this.save();
};

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;
