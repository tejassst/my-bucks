const mongoose = require('mongoose');
const { Schema, model } = require('mongoose');

const TransactionSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: false, default: '' },
  datetime: { type: Date, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const TransactionModel = model('Transaction', TransactionSchema);

module.exports = TransactionModel;
