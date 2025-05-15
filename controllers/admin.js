const Admin = require("../models/admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register a new admin
exports.register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if the admin already exists
    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Create a new admin
    admin = new Admin({ fullName, email, password });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(password, salt);

    // Save the admin
    await admin.save();

    // Generate a token
    const token = admin.generateTokens();

    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Error registering admin", error });
  }
};

// Login an admin
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check the password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate a token
    const token = admin.generateTokens();

    res.status(200).json({ admin, token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in admin", error });
  }
};
