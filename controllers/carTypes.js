const CarType = require("../models/carType");

// Create a new car type
exports.createCarType = async (req, res) => {
  try {
    const { name } = req.body;

    const newCarType = new CarType({ name });
    await newCarType.save();

    res.status(201).json(newCarType);
  } catch (error) {
    res.status(500).json({ message: "Error creating car type", error });
  }
};

// Get all car types
exports.getAllCarTypes = async (req, res) => {
  try {
    const carTypes = await CarType.find();
    res.status(200).json(carTypes);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving car types", error });
  }
};

// Get a single car type by ID
exports.getCarType = async (req, res) => {
  try {
    const carType = await CarType.findById(req.params.id);
    if (!carType) {
      return res.status(404).json({ message: "Car type not found" });
    }
    res.status(200).json(carType);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving car type", error });
  }
};

// Update a car type by ID
exports.updateCarType = async (req, res) => {
  try {
    const updatedCarType = await CarType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCarType) {
      return res.status(404).json({ message: "Car type not found" });
    }

    res.status(200).json(updatedCarType);
  } catch (error) {
    res.status(500).json({ message: "Error updating car type", error });
  }
};

// Delete a car type by ID
exports.deleteCarType = async (req, res) => {
  try {
    const deletedCarType = await CarType.findByIdAndDelete(req.params.id);

    if (!deletedCarType) {
      return res.status(404).json({ message: "Car type not found" });
    }

    res.status(200).json({ message: "Car type deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting car type", error });
  }
};
