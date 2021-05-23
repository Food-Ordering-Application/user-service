import * as nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'smtp.gmail.com',
  auth: {
    type: 'login',
    user: process.env.HOST_EMAIL,
    pass: process.env.HOST_EMAIL_PASSWORD,
  },
});
