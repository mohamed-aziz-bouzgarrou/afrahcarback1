const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    images: { type: [String], required: true },
    title: { type: String, required: true },
    reviews: { type: [String], required: true },
    description: { type: String, required: true },
    carType: { type: String, required: true },
    price: { type: Number, required: true },

    gear: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["longueduree", "courteduree"],
    },
    fuel: { type: String, required: true },
    doors: { type: Number, required: true, default: 2 },
    seats: { type: Number, required: true, default: 2 },
    ratings: [
      {
        fullName: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
      },
    ],
    averageRating: { type: Number, default: 0 },
    available: { type: Boolean, required: true, default: true },
    garantie: { type: Number, default: 0 },
    isNewCar: { type: Boolean, required: true, default: true },
    matricules: [
      {
        value: { type: String, required: true, unique: true },
        available: { type: Boolean, default: true },
        unavailablePeriods: [
          {
            startDate: Date,
            endDate: Date,
            source: {
              type: String,
              enum: ["manual", "system"],
              required: true,
            },
          },
        ],
      },
    ],
    airConditionner: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

// Calculate average rating
carSchema.methods.calculateAverageRating = function () {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
  } else {
    const sum = this.ratings.reduce(
      (total, rating) => total + rating.rating,
      0
    );
    this.averageRating = sum / this.ratings.length;
  }
  return this.averageRating;
};

// Add rating
carSchema.methods.addRating = function (fullName, rating, comment) {
  this.ratings.push({ fullName, rating, comment });
  this.calculateAverageRating();
  return this.save();
};

carSchema.methods.isMatriculeAvailable = function (
  matricule,
  startDate,
  endDate
) {
  return this.matricules.some(
    (m) =>
      m.value === matricule &&
      !m.unavailablePeriods?.some(
        (period) => period.startDate <= endDate && period.endDate >= startDate
      )
  );
};
module.exports = mongoose.model("Car", carSchema);
