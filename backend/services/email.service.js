const nodemailer = require("nodemailer");

exports.sendVerificationEmail = async (user, token) => {
  const verificationLink = `http://localhost:5000/api/auth/verify/${token}`;
  
  // For local development, log the link to console so you can verify without email setup
  console.log(`\n=== Verification Link ===\n${verificationLink}\n=========================\n`);

  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === "your_email@gmail.com") {
    console.log("Email credentials not configured in .env. Skipping actual email sending.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    to: user.email,
    subject: "Verify Account",
    html: `<a href="${verificationLink}">Verify Account</a>`
  });
};