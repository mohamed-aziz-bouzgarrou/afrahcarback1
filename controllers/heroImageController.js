const HeroImage = require("../models/HeroImage");
const fs = require("fs");
const path = require("path");

exports.uploadHeroImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Delete previous hero image if exists
    const previousHeroImage = await HeroImage.findOne();
    if (previousHeroImage) {
      // Delete previous file
      const previousImagePath = path.join(
        __dirname,
        "..",
        "uploads",
        previousHeroImage.imageUrl
      );
      if (fs.existsSync(previousImagePath)) {
        fs.unlinkSync(previousImagePath);
      }
      await HeroImage.deleteOne({ _id: previousHeroImage._id });
    }

    // Create new hero image record
    const heroImage = new HeroImage({
      imageUrl: req.file.filename,
    });

    await heroImage.save();

    res.status(201).json({
      message: "Hero image uploaded successfully",
      imageUrl: heroImage.imageUrl,
    });
  } catch (error) {
    console.error("Error uploading hero image:", error);
    res.status(500).json({ message: "Error uploading hero image" });
  }
};

exports.getHeroImage = async (req, res) => {
  try {
    const heroImage = await HeroImage.findOne();
    if (!heroImage) {
      return res.status(404).json({ message: "No hero image found" });
    }

    res.json({ imageUrl: heroImage.imageUrl });
  } catch (error) {
    console.error("Error retrieving hero image:", error);
    res.status(500).json({ message: "Error retrieving hero image" });
  }
};
