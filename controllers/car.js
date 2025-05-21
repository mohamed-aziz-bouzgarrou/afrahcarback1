const Car = require("../models/car");
const Renting = require("../models/renting");
const CarType = require("../models/carType");

const upload = require("../middleware/fileUpload");

exports.createCar = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err });
    }
    try {
      let matricules;
      try {
        matricules = JSON.parse(req.body.matricules);
      } catch (parseError) {
        return res.status(400).json({ message: "Invalid matricules format" });
      }

      const {
        title,
        description,
        category,
        carType,
        //price,
        gear,
        fuel,
        doors,
        seats,
        garantie,
        isNewCar,
        airConditionner,
        categories,
      } = req.body;

      // Validate matricules array structure
      if (!Array.isArray(matricules)) {
        return res.status(400).json({ message: "Invalid matricules format" });
      }

      const isValidMatricules = matricules.every(
        (m) => m.value && typeof m.available !== "undefined"
      );

      if (!isValidMatricules) {
        return res.status(400).json({
          message:
            "Invalid matricule structure. Each must have value and available status",
        });
      }

      const images = req.files.map((file) => file.originalname);

      // Create car with basic info
      const newCar = new Car({
        title,
        matricules, // Store array of matricules
        description,
        category, // For backward compatibility
        carType,
        // price, // For backward compatibility
        gear,
        fuel,
        doors,
        seats,
        garantie,
        isNewCar,
        airConditionner,
        images,
      });

      // Handle categories if provided
      if (categories) {
        try {
          const parsedCategories = JSON.parse(categories);
          if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
            newCar.categories = parsedCategories.map((cat) => ({
              type: cat.type,
              price: cat.price,
              available: cat.available !== undefined ? cat.available : true,
            }));
          }
        } catch (e) {
          // If categories parsing fails, create a default category based on legacy fields
          newCar.categories = [
            {
              type: category,
              price: price,
              available: true,
            },
          ];
        }
      } else {
        // Create a default category based on legacy fields
        newCar.categories = [
          {
            type: category,
            price: price,
            available: true,
          },
        ];
      }

      await newCar.save();
      res.status(201).json(newCar);
    } catch (error) {
      console.error("Error creating car:", error);
      res.status(500).json({
        message: "Error creating car",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });
};

exports.getCarsByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    // Find cars that have this category in their categories array
    // or match the legacy category field for backward compatibility
    const cars = await Car.find({
      $or: [
        { category }, // Legacy field
        { "categories.type": category, "categories.available": true }, // New structure
      ],
    });

    if (!cars || cars.length === 0) {
      return res
        .status(404)
        .json({ message: "No cars found for this category" });
    }

    // Map through cars to ensure each has the correct price for the requested category
    const carsWithCorrectPrice = cars.map((car) => {
      const carObj = car.toObject();
      // Use the getCategoryPrice method to get the correct price for this category
      carObj.price = car.getCategoryPrice(category);
      return carObj;
    });
    console.log(cars);
    console.log(carsWithCorrectPrice);
    res.status(200).json(carsWithCorrectPrice);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving cars", error });
  }
};

// New endpoint to manage car categories
exports.manageCategoryForCar = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryType, price, available } = req.body;

    if (!categoryType || typeof price !== "number") {
      return res.status(400).json({
        message:
          "Category type and price are required. Price must be a number.",
      });
    }

    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Ensure the car has the categories array initialized
    await car.migrateToCategories();

    // Add or update the category
    await car.addCategory(
      categoryType,
      price,
      available !== undefined ? available : true
    );

    res.status(200).json(car);
  } catch (error) {
    res.status(500).json({
      message: "Error managing car category",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update category availability
exports.updateCategoryAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryType, available } = req.body;

    if (!categoryType || typeof available !== "boolean") {
      return res.status(400).json({
        message: "Category type and availability status are required",
      });
    }

    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Set availability for the specific category
    await car.setCategoryAvailability(categoryType, available);

    res.status(200).json(car);
  } catch (error) {
    res.status(500).json({
      message: "Error updating category availability",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getCars = async (req, res) => {
  try {
    const { seats, carType, steering } = req.query;

    const filter = {};
    if (seats) filter.seats = seats;
    if (carType) filter.carType = carType;
    if (steering) filter.steering = steering;

    const cars = await Car.find(filter);
    res.status(200).json(cars);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving cars", error });
  }
};

exports.getCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }
    res.status(200).json(car);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving car", error });
  }
};

exports.update = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err });
    }
    try {
      const {
        title,
        matricules,
        description,
        category,
        carType,
        //price,
        gear,
        fuel,
        doors,
        seats,
        garantie,
        isNewCar,
        airConditionner,
        existingImages, // Add this to handle existing images
        categories, // Add support for categories
      } = req.body;

      const updatedFields = {
        title,
        description,
        category, // Keep for backward compatibility
        carType,
        //price: price ? Number(price) : undefined, // Ensure price is a number for backward compatibility
        gear,
        fuel,
        doors,
        seats,
        garantie,
        isNewCar,
        airConditionner,
      };

      // Handle matricules update if provided
      if (matricules) {
        try {
          const parsedMatricules = JSON.parse(matricules);
          // Validate matricules structure
          const isValid =
            Array.isArray(parsedMatricules) &&
            parsedMatricules.every(
              (m) => m.value && typeof m.available !== "undefined"
            );

          if (!isValid) {
            return res.status(400).json({
              message:
                "Invalid matricules format. Expected array of { value: string, available: boolean }",
            });
          }

          updatedFields.matricules = parsedMatricules;
        } catch (e) {
          return res.status(400).json({
            message: "Invalid matricules format. Must be a valid JSON array",
          });
        }
      }

      // Handle categories update if provided
      if (categories) {
        try {
          const parsedCategories = JSON.parse(categories);
          if (Array.isArray(parsedCategories)) {
            updatedFields.categories = parsedCategories.map((cat) => ({
              type: cat.type,
              price: cat.price,
              available: cat.available !== undefined ? cat.available : true,
            }));
          } else {
            return res.status(400).json({
              message:
                "Invalid categories format. Expected array of { type: string, price: number, available: boolean }",
            });
          }
        } catch (e) {
          return res.status(400).json({
            message: "Invalid categories format. Must be a valid JSON array",
          });
        }
      }

      // Improved image handling
      let finalImages = [];

      // Add existing images if provided
      if (existingImages) {
        try {
          const parsedExistingImages = JSON.parse(existingImages);
          if (Array.isArray(parsedExistingImages)) {
            finalImages = [...parsedExistingImages];
          }
        } catch (e) {
          return res.status(400).json({
            message:
              "Invalid existing images format. Must be a valid JSON array",
          });
        }
      }

      // Add new uploaded images
      if (req.files?.length > 0) {
        const newImages = req.files.map((file) => file.originalname);
        finalImages = [...finalImages, ...newImages];
      }

      // Update the images field only if we have images
      if (finalImages.length > 0) {
        updatedFields.images = finalImages;
      }

      const updatedCar = await Car.findByIdAndUpdate(
        req.params.id,
        updatedFields,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedCar) {
        return res.status(404).json({ message: "Car not found" });
      }

      res.status(200).json(updatedCar);
    } catch (error) {
      console.error("Error updating car:", error);
      res.status(500).json({
        message: "Error updating car",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });
};

exports.deleteCar = async (req, res) => {
  try {
    const deletedCar = await Car.findByIdAndDelete(req.params.id);

    if (!deletedCar) {
      return res.status(404).json({ message: "Car not found" });
    }

    await Renting.deleteMany({ car: req.params.id });

    res
      .status(200)
      .json({ message: "Car and related rentings deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting car", error });
  }
};
exports.updateCarStatus = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    car.available = !car.available;
    await car.save();
    res.status(200).json(car);
  } catch (error) {
    res.status(500).json({ message: "Error updating car status", error });
  }
};

exports.getCarsCollection = async (req, res) => {
  try {
    // Get 3 random car types
    const carTypes = await CarType.aggregate([{ $sample: { size: 3 } }]);

    // Find cars for each type
    const carsCollection = await Promise.all(
      carTypes.map(async (type) => {
        const cars = await Car.find({ carType: type.name }).limit(2);
        return {
          type: type.name,
          cars: cars,
        };
      })
    );

    res.status(200).json(carsCollection);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving cars by type", error });
  }
};

exports.addRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, rating, comment } = req.body;

    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    await car.addRating(fullName, rating, comment);

    res.status(200).json(car);
  } catch (error) {
    res.status(500).json({ message: "Error adding rating", error });
  }
};
