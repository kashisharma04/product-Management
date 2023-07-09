const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    validate: {
      validator: function (value) {
        return !isNaN(value);
      },
      message: 'Invalid price',
    },
  },
  currencyId: {
    type: String,
    required: true,
    default: 'INR',
  },
  currencyFormat: {
    type: String,
    required: true,
    default: '₹',
  },
  isFreeShipping: {
    type: Boolean,
    default: false,
  },
  productImage: {
    type: String,
    required: true,
  },
  style: {
    type: String,
  },
  availableSizes: {
    type: [String],
    required: true,
    validate: {
      validator: function (value) {
        return value.length > 0;
      },
      message: 'At least one size must be provided',
    },
    enum: ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'],
  },
  installments: {
    type: Number,
  },
  deletedAt: {
    type: Date,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
