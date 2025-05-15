const mongoose = require("mongoose");

const transfertSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    whatsAppNum: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    pickupLocation: { type: String, required: true },
    dropoffLocation: { type: String, required: true },
    carburant: { type: String, required: true },
    carType: { type: String, required: true },
    fuelFeesOn: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transfert", transfertSchema);
