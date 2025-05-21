const mongoose = require("mongoose");

const rentingSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: Number, required: true },
    city: { type: String, required: true },

    category: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalPrice: { type: Number, required: true },
    pickupLocation: { type: String, required: true },
    dropoffLocation: { type: String, required: true },
    whatsapp: { type: String, required: true },
    siegeAuto: { type: Boolean, required: true },
    numVol: { type: String, required: false },
    carModel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },
    assignedMatricule: { type: String, default: null },
    assignmentDate: { type: Date, default: null },
    paymentType: {
      type: String,
      enum: ["online", "onsite"],
      required: true,
      default: "online",
    },
    paymentPercentage: {
      type: Number,
      enum: [30, 50, 100],
      default: 100,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    processingAmount: {
      type: Number,
      default: undefined,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "partially_paid"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Renting", rentingSchema);
