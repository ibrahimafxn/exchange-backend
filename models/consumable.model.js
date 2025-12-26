const mongoose = require('mongoose');

const consumableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    unit: { type: String, default: 'pcs' },

    quantity: { type: Number, default: 0, min: 0 },
    assignedQuantity: { type: Number, default: 0, min: 0 },
    minQuantity: { type: Number, default: 0, min: 0 },

    idDepot: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot', default: null }
  },
  { timestamps: true }
);

// Index
consumableSchema.index({ name: 1, idDepot: 1 }, { unique: true });
consumableSchema.index({ idDepot: 1 });

// Virtual
consumableSchema.virtual('availableQuantity').get(function () {
  return Math.max(0, this.quantity - this.assignedQuantity);
});

consumableSchema.set('toJSON', { virtuals: true });
consumableSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Consumable', consumableSchema);
