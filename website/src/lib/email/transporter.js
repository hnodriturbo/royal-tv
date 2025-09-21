// lib/email/transporter.js
import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

const username = process.env.EMAIL_USER;
const password = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true, // set to false if using port 587 (STARTTLS)
  auth: {
    user: username,
    pass: password
  }
});

export default transporter;
