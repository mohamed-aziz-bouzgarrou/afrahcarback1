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
        price,
        gear,
        fuel,
        doors,
        seats,
        garantie,
        isNewCar,
        airConditionner,
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

      const newCar = new Car({
        title,
        matricules, // Store array of matricules
        description,
        category,
        carType,
        price,
        gear,
        fuel,
        doors,
        seats,
        garantie,
        isNewCar,
        airConditionner,
        images,
      });

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
    const cars = await Car.find({ category });
    if (!cars) {
      return res.status(404).json({ message: "No cars not found" });
    }
    res.status(200).json(cars);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving car", error });
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
        price,
        gear,
        fuel,
        doors,
        seats,
        garantie,
        isNewCar,
        airConditionner,
        existingImages, // Add this to handle existing images
      } = req.body;

      const updatedFields = {
        title,
        description,
        category,
        carType,
        price,
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
