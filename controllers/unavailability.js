const Unavailability = require("../models/unavailability");

exports.getUnavailability = async (req, res) => {
  const { car, matricule, startDate, endDate } = req.query;

  try {
    const unavailability = await Unavailability.find({
      car,
      matricule,
      startDate: { $lte: new Date(endDate) },
      endDate: { $gte: new Date(startDate) },
    });

    res.status(200).json(unavailability);
  } catch (error) {
    console.error("Error fetching unavailability:", error);
    res.status(500).json({ error: "Failed to fetch unavailability" });
  }
};

exports.createUnavailability = async (req, res) => {
  const { car, matricule, startDate, endDate, source } = req.body;

  try {
    const newUnavailability = new Unavailability({
      car,
      matricule,
      startDate,
      endDate,
      source,
    });

    await newUnavailability.save();
    res.status(201).json(newUnavailability);
  } catch (error) {
    console.error("Error creating unavailability:", error);
    res.status(500).json({ error: "Failed to create unavailability" });
  }
};

exports.deleteUnavailability = async (req, res) => {
  const { id } = req.params;

  try {
    await Unavailability.findByIdAndDelete(id);
    res.status(200).json({ message: "Unavailability deleted successfully" });
  } catch (error) {
    console.error("Error deleting unavailability:", error);
    res.status(500).json({ error: "Failed to delete unavailability" });
  }
};
