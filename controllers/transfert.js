const Transfert = require("../models/transfert");
const PDFDocument = require("pdfkit");
const { sendEmail } = require("../utils/emailService");

async function createTransfertPDF(transfertData) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 30, size: "A4", bufferPages: true });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    doc.image("public/logo1.jpg", 450, 30, { width: 100 });

    // Header
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("CONTRAT DE TRANSFERT", { align: "center" })
      .moveDown(0.3);

    // Horizontal line
    doc.moveTo(30, 90).lineTo(570, 90).strokeColor("#cccccc").stroke();

    let yPosition = 110;

    // Client Information Section
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("INFORMATIONS CLIENT:", 30, yPosition);
    yPosition += 20;

    const clientInfo = [
      `Nom Complet: ${transfertData.firstName} ${transfertData.lastName}`,
      `Email: ${transfertData.email}`,
      `Téléphone: ${transfertData.phone}`,
      `WhatsApp: ${transfertData.whatsAppNum}`,
      `Adresse: ${transfertData.address}`,
    ];

    clientInfo.forEach((info) => {
      doc.font("Helvetica").fontSize(10).text(`• ${info}`, 40, yPosition);
      yPosition += 15;
    });

    // Transfer Information Section
    yPosition += 10;
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("DÉTAILS DU TRANSFERT:", 30, yPosition);
    yPosition += 20;

    const transfertInfo = [
      ["Type de voiture:", transfertData.carType],
      ["Lieu de prise en charge:", transfertData.pickupLocation],
      ["Lieu de restitution:", transfertData.dropoffLocation],
      ["Date de prise en charge:", formatFrenchDate(transfertData.startDate)],
      ["Date de restitution:", formatFrenchDate(transfertData.endDate)],
      ["Type de carburant:", transfertData.carburant],
      [
        "Frais de carburant:",
        transfertData.fuelFeesOn === "client"
          ? "À la charge du client"
          : "À la charge de l'entreprise",
      ],
    ];

    transfertInfo.forEach(([label, value]) => {
      doc.font("Helvetica-Bold").text(label, 50, yPosition);
      doc.font("Helvetica").text(value, 200, yPosition);
      yPosition += 20;
    });

    // Footer
    const footerY = 700;

    // Add a line above the agencies section
    doc
      .moveTo(30, footerY - 10)
      .lineTo(570, footerY - 10)
      .strokeColor("#cccccc")
      .stroke();

    // Title with some styling
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#333333")
      .text("NOS AGENCES", 30, footerY, { align: "center" })
      .moveDown(0.5);

    // Contact information in two columns
    const leftColumn = 50;
    const rightColumn = 300;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#666666")
      .text("Agence Ennozha:", leftColumn, footerY + 25);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#333333")
      .text("+216 26 107 537, +216 54 546 653", leftColumn + 90, footerY + 25);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#666666")
      .text("Agence Mégrine:", rightColumn, footerY + 25);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#333333")
      .text("+216 29 717 071", rightColumn + 90, footerY + 25);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#666666")
      .text("Agence Ariana:", leftColumn, footerY + 45);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#333333")
      .text("+216 26 207 537", leftColumn + 90, footerY + 45);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#666666")
      .text("Atelier:", rightColumn, footerY + 45);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#333333")
      .text("+216 26 107 537", rightColumn + 90, footerY + 45);
    doc.end();
  });
}

function formatFrenchDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

exports.createTransfert = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      address,
      phone,
      whatsAppNum,
      startDate,
      endDate,
      pickupLocation,
      dropoffLocation,
      carburant,
      carType,
      fuelFeesOn,
    } = req.body;

    const newTransfert = new Transfert({
      firstName,
      lastName,
      email,
      address,
      phone,
      whatsAppNum,
      startDate,
      endDate,
      pickupLocation,
      dropoffLocation,
      carburant,
      carType,
      fuelFeesOn,
    });

    // Generate PDF
    const pdfBuffer = await createTransfertPDF({
      firstName,
      lastName,
      email,
      address,
      phone,
      whatsAppNum,
      startDate,
      endDate,
      pickupLocation,
      dropoffLocation,
      carburant,
      carType,
      fuelFeesOn,
    });

    await sendEmail(
      email,
      "Détails du transfert",
      `Bonjour ${firstName},\n\nVeuillez trouver ci-joint les détails de votre transfert.\n\nCordialement,\nL'équipe de location`,
      [
        {
          filename: `Contrat_Transfert_${firstName}_${lastName}.pdf`,
          content: pdfBuffer,
        },
      ]
    );

    await newTransfert.save();
    res.status(201).json({
      success: true,
      data: newTransfert,
      message: "Transfert créé et contrat envoyé avec succès",
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du transfert",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get all transferts
exports.getAllTransferts = async (req, res) => {
  try {
    const transferts = await Transfert.find();
    res.status(200).json(transferts);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving transferts", error });
  }
};

// Get a single transfert by ID
exports.getTransfert = async (req, res) => {
  try {
    const transfert = await Transfert.findById(req.params.id);
    if (!transfert) {
      return res.status(404).json({ message: "Transfert not found" });
    }
    res.status(200).json(transfert);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving transfert", error });
  }
};

// Update a transfert by ID
exports.updateTransfert = async (req, res) => {
  try {
    const updatedTransfert = await Transfert.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedTransfert) {
      return res.status(404).json({ message: "Transfert not found" });
    }

    res.status(200).json(updatedTransfert);
  } catch (error) {
    res.status(500).json({ message: "Error updating transfert", error });
  }
};

// Delete a transfert by ID
exports.deleteTransfert = async (req, res) => {
  try {
    const deletedTransfert = await Transfert.findByIdAndDelete(req.params.id);

    if (!deletedTransfert) {
      return res.status(404).json({ message: "Transfert not found" });
    }

    res.status(200).json({ message: "Transfert deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting transfert", error });
  }
};
