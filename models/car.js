const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    images: { type: [String], required: true },
    title: { type: String, required: true },
    reviews: { type: [String], required: true },
    description: { type: String, required: true },
    carType: { type: String, required: true },
    //price: { type: Number, required: true }, // Keeping for backward compatibility

    gear: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["longueduree", "courteduree"],
    }, // Keeping for backward compatibility
    categories: [
      {
        type: {
          type: String,
          required: true,
          enum: ["longueduree", "courteduree"],
        },
        price: { type: Number, required: true },
        available: { type: Boolean, default: true },
      },
    ],
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

// Migrate legacy data to new categories structure
carSchema.methods.migrateToCategories = function () {
  // Only migrate if categories array is empty
  if (!this.categories || this.categories.length === 0) {
    // Validate required fields
    if (!this.category || this.category.trim() === "") {
      throw new Error("Cannot migrate: Missing category field");
    }

    if (typeof this.price !== "number" || isNaN(this.price)) {
      throw new Error("Cannot migrate: Invalid price field");
    }

    // Add the current category with the current price
    this.categories = [
      {
        type: this.category,
        price: this.price,
        available: typeof this.available === "boolean" ? this.available : true,
      },
    ];
    return this.save();
  }
  return Promise.resolve(this);
};

// Add a category with price
carSchema.methods.addCategory = function (
  categoryType,
  price,
  isAvailable = true
) {
  // Check if category already exists
  const existingCategory = this.categories.find(
    (cat) => cat.type === categoryType
  );

  if (existingCategory) {
    // Update existing category
    existingCategory.price = price;
    existingCategory.available = isAvailable;
  } else {
    // Add new category
    this.categories.push({
      type: categoryType,
      price: price,
      available: isAvailable,
    });
  }

  return this.save();
};

carSchema.methods.isMatriculeAvailable = function (
  matricule,
  startDate,
  endDate,
  categoryType
) {
  // Check if the matricule exists and is available for the given time period
  return this.matricules.some(
    (m) =>
      m.value === matricule &&
      !m.unavailablePeriods?.some(
        (period) => period.startDate <= endDate && period.endDate >= startDate
      )
  );
};

// Check if a car is available in a specific category
carSchema.methods.isCategoryAvailable = function (categoryType) {
  // Check if the category exists in the categories array and is available
  return this.categories.some(
    (cat) => cat.type === categoryType && cat.available
  );
};

// Get price for a specific category
carSchema.methods.getCategoryPrice = function (categoryType) {
  const category = this.categories.find((cat) => cat.type === categoryType);
  return category ? category.price : this.price; // Fallback to the legacy price field
};

// Set availability for a specific category
carSchema.methods.setCategoryAvailability = function (
  categoryType,
  isAvailable
) {
  const category = this.categories.find((cat) => cat.type === categoryType);
  if (category) {
    category.available = isAvailable;
    return this.save();
  }
  return Promise.resolve(this);
};
module.exports = mongoose.model("Car", carSchema);
