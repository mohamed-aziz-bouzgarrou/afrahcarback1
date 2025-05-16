/**
 * Migration script to update existing cars to use the new categories structure
 *
 * This script will:
 * 1. Find all cars in the database
 * 2. For each car, check if it has categories array
 * 3. If not, create a category based on the legacy category and price fields
 *
 * Run with: node scripts/migrateCarsToCategories.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Car = require("../models/car");

// Connect to MongoDB
mongoose
  .connect(process.env.DB_CONNECTION || process.env.DB_Cluster_Connection, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

async function migrateCars() {
  try {
    console.log("Starting car migration...");

    // Find all cars that need migration (those without categories or with empty categories)
    const cars = await Car.find({
      $or: [{ categories: { $exists: false } }, { categories: { $size: 0 } }],
    });
    console.log(`Found ${cars.length} cars that need migration`);

    let migratedCount = 0;
    let errorCount = 0;

    // Process each car
    for (const car of cars) {
      try {
        // Validate that we have the required legacy fields
        if (!car.category || !car.price) {
          console.log(
            `Car ${car._id} is missing required legacy fields (category or price), skipping`
          );
          errorCount++;
          continue;
        }

        // Migrate the car using the helper method
        await car.migrateToCategories();
        console.log(
          `Migrated car ${car._id} to new categories structure (${car.category} at ${car.price})`
        );
        migratedCount++;
      } catch (carError) {
        console.error(`Error migrating car ${car._id}:`, carError);
        errorCount++;
      }
    }

    console.log("Migration completed!");
    console.log(`${migratedCount} cars successfully migrated`);
    console.log(`${errorCount} cars encountered errors during migration`);

    // Get count of cars that already have categories
    const alreadyMigratedCount = await Car.countDocuments({
      categories: { $exists: true, $not: { $size: 0 } },
    });
    console.log(
      `${alreadyMigratedCount} cars already have categories structure`
    );

    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

// Run the migration
migrateCars();
