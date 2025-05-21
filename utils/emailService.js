const nodemailer = require("nodemailer");

/**
 * Creates and configures a reusable nodemailer transporter
 * @returns {object} Configured nodemailer transporter
 */
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: "ssl0.ovh.net",
    port: 465,
    secure: true, // true for port 465, false for port 587
    auth: {
      user: process.env.ovhemail,
      pass: process.env.ovhpass,
    },
  });
  const transporter1 = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  if (process.env.NODE_ENV == "development") {
    return transporter1;
  } else {
    return transporter;
  }
};

/**
 * Sends an email with optional attachments
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Email body text
 * @param {Array} attachments - Optional array of attachment objects
 * @returns {Promise} - Promise that resolves when email is sent
 */
const sendEmail = async (to, subject, text, attachments = []) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to,
    subject,
    text,
    attachments,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  createTransporter,
  sendEmail,
};
