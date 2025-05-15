const express = require("express");
const router = express.Router();
const {
  createCarType,
  getAllCarTypes,
  getCarType,
  updateCarType,
  deleteCarType,
} = require("../controllers/carTypes");
const authenticateToken = require("../middleware/authenticateToken");

// Create a new car type
router.post("/create", authenticateToken, createCarType);

// Get all car types
router.get("/getall", getAllCarTypes);

// Get a single car type by ID
router.get("/:id", getCarType);

// Update a car type by ID
router.patch("/:id", authenticateToken, updateCarType);

// Delete a car type by ID
router.delete("/:id", authenticateToken, deleteCarType);

module.exports = router;
