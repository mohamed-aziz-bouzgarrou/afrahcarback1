const nodemailer = require("nodemailer");

/**
 * Creates and configures a reusable nodemailer transporter
 * @returns {object} Configured nodemailer transporter
 */
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true, // true for port 465, false for port 587
    auth: {
      user: process.env.ovhemail,
      pass: process.env.ovhpass,
    },
  });

  return transporter;
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
    from: process.env.ovhemail,
    to,
    subject,
    text,
    attachments,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendEmail,
};
