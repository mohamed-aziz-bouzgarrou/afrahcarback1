const express = require("express");
const router = express.Router();
const unavailabilityController = require("../controllers/unavailability");
const authenticateToken = require("../middleware/authenticateToken");

router.get("/", authenticateToken, unavailabilityController.getUnavailability);
router.post(
  "/",
  authenticateToken,
  unavailabilityController.createUnavailability
);
router.delete(
  "/:id",
  authenticateToken,
  unavailabilityController.deleteUnavailability
);

module.exports = router;
