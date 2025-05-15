const express = require("express");
const router = express.Router();
const {
  createTransfert,
  getAllTransferts,
  getTransfert,
  updateTransfert,
  deleteTransfert,
} = require("../controllers/transfert");
const authenticateToken = require("../middleware/authenticateToken");

// Create a new transfert
router.post("/create", createTransfert);

// Get all transferts
router.get("/getall", authenticateToken, getAllTransferts);

// Get a single transfert by ID
router.get("/get/:id", getTransfert);

// Update a transfert by ID
router.patch("/:id", authenticateToken, updateTransfert);

// Delete a transfert by ID
router.delete("/delete/:id", authenticateToken, deleteTransfert);

module.exports = router;
