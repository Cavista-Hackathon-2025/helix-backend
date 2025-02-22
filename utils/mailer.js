import nodemailer from 'nodemailer';
import ejs from 'ejs';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async ({ to, subject, template, data, attachments = [] }) => {
  try {
    const html = await ejs.renderFile(template, data);

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log({ info })
    return info;
  } catch (error) {
    throw new Error(`Error sending email: ${error.message}`);
  }
};

export {
  sendEmail
};