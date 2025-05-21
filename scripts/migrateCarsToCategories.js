/**
 * Migration script to update existing cars to use the new categories structure
 *
 * This script will:
 * 1. Find all cars in the database
 * 2. For each car, check if it has categories array
 * 3. If not, create a category based on the legacy category and price fields
 * 4. Ensure the 'type' field is used instead of 'categoryType'
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
  .then(() => {
    console.log("Connected to MongoDB");
    // Run migration after successful connection
    migrateCars()
      .then(() => {
        // Close connection when done
        mongoose.connection.close();
      })
      .catch((err) => {
        console.error("Migration failed:", err);
        process.exit(1);
      });
  })
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
        if (!car.category || typeof car.price !== "number") {
          console.log(
            `Car ${car._id} is missing required legacy fields (category: ${car.category}, price: ${car.price}), skipping`
          );
          errorCount++;
          continue;
        }

        try {
          // Validate category value
          if (!["longueduree", "courteduree"].includes(car.category)) {
            console.log(
              `Car ${car._id} has invalid category value: ${car.category}, fixing to 'courteduree'`
            );
            car.category = "courteduree";
          }

          // Create the category object with the 'type' field
          car.categories = [
            {
              type: car.category, // Using 'type' as per the schema
              price: car.price,
              available:
                typeof car.available === "boolean" ? car.available : true,
            },
          ];

          // Save the updated car
          await car.save();
        } catch (saveError) {
          console.error(`Error saving car ${car._id}:`, saveError.message);
          throw saveError;
        }

        console.log(
          `Migrated car ${car._id} to new categories structure (${car.category} at ${car.price})`
        );
        migratedCount++;
      } catch (carError) {
        console.error(`Error migrating car ${car._id}:`, carError);
        errorCount++;
      }
    }

    // Check for cars with existing categories but using wrong field name
    const carsWithCategories = await Car.find({
      categories: { $exists: true, $not: { $size: 0 } },
    });

    let fixedCategoryCount = 0;

    // Check if any categories use 'categoryType' instead of 'type'
    for (const car of carsWithCategories) {
      let needsUpdate = false;

      for (const category of car.categories) {
        // Check if category has categoryType but not type
        if (category.categoryType && !category.type) {
          category.type = category.categoryType;
          delete category.categoryType;
          needsUpdate = true;
        }

        // Validate that type is one of the allowed values
        if (
          category.type &&
          !["longueduree", "courteduree"].includes(category.type)
        ) {
          console.log(
            `Car ${car._id} has invalid category type: ${category.type}, fixing to 'courteduree'`
          );
          category.type = "courteduree";
          needsUpdate = true;
        }

        // Ensure price is a number
        if (typeof category.price !== "number" || isNaN(category.price)) {
          console.log(
            `Car ${car._id} has invalid price: ${category.price}, fixing to 0`
          );
          category.price = 0;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await car.save();
        fixedCategoryCount++;
        console.log(`Fixed category field names for car ${car._id}`);
      }
    }

    console.log("Migration completed!");
    console.log(`${migratedCount} cars successfully migrated`);
    console.log(`${errorCount} cars encountered errors during migration`);
    console.log(`${fixedCategoryCount} cars had category field names fixed`);

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

// Migration is now called after successful database connection
