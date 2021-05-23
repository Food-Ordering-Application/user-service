import * as nodemailer from 'nodemailer';

console.log(process.env.HOST_EMAIL);
console.log(process.env.HOST_EMAIL_PASSWORD);

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.HOST_EMAIL,
    pass: process.env.HOST_EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
