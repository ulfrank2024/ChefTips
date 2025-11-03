const nodemailer = require("nodemailer");
require("dotenv").config();
const { generateEmailTemplate } = require("../utils/emailTemplates");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

const sendEmail = async (to, subject, templateName, templateData, language = 'en') => {
    try {
        const { html } = await generateEmailTemplate(templateName, templateData, language);

        await transporter.sendMail({
            from: process.env.SMTP_FROM_EMAIL,
            to,
            subject,
            html,
        });
        console.log(`Email sent to ${to} with subject: ${subject}`);
    } catch (error) {
        console.error(`Error sending email to ${to} with subject ${subject}:`, error);
        throw new Error('Failed to send email.');
    }
};

module.exports = {
    sendEmail,
};