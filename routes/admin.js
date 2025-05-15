const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/admin");
const authenticateToken = require("../middleware/authenticateToken");

router.post("/register", register);

router.post("/login", login);

module.exports = router;
