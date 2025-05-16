const express = require("express");
const router = express.Router();
const {
  createCar,
  getCars,
  getCar,
  update,
  deleteCar,
  getCarsByCategory,
  updateCarStatus,
  getCarsCollection,
  addRating,
  manageCategoryForCar,
  updateCategoryAvailability,
} = require("../controllers/car");
const authenticateToken = require("../middleware/authenticateToken");

// Create a new car
router.post("/add", authenticateToken, createCar);

// Get cars by category
router.get("/getcarsbycategory/:category", getCarsByCategory);

// Get all cars
router.get("/getcollectioncars", getCarsCollection);

// Get all cars
router.get("/getcars", getCars);

// Get a single car by ID
router.get("/getcar/:id", getCar);

// Update a car status by ID
router.patch("/:id/status", authenticateToken, updateCarStatus);

// Category management routes
router.post("/:id/category", authenticateToken, manageCategoryForCar);
router.patch(
  "/:id/category/availability",
  authenticateToken,
  updateCategoryAvailability
);

// Update a car by ID
router.patch("/edit/:id", authenticateToken, update);

// Delete a car by ID
router.delete("/delete/:id", authenticateToken, deleteCar);

// Add rating to a car
router.post("/:id/rating", addRating);

module.exports = router;
