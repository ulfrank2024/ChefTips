const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
require("dotenv").config();
const { generateEmailTemplate } = require("../utils/emailTemplates");
const frTranslations = require("../locales/fr.json");
const enTranslations = require("../locales/en.json");

const sesClient = new SESClient({ region: process.env.AWS_REGION || "us-east-1" });

const getSubject = (templateName, language) => {
    let translations;
    if (language === 'fr') {
        translations = frTranslations;
    } else {
        translations = enTranslations;
    }
    return translations.subjects[templateName] || templateName;
};

const sendEmail = async (to, templateName, templateData, language = 'en') => {
    try {
        const { html } = await generateEmailTemplate(templateName, templateData, language);
        const subject = getSubject(templateName, language);

        const sendCommand = new SendEmailCommand({
            Destination: {
                ToAddresses: [to],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: html,
                    },
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: subject,
                },
            },
            Source: process.env.SES_FROM_EMAIL,
        });

        await sesClient.send(sendCommand);
        console.log(`Email sent to ${to} with subject: ${subject}`);
    } catch (error) {
        console.error(`Error sending email to ${to} with template ${templateName}:`, error);
        throw new Error('Failed to send email.');
    }
};

module.exports = {
    sendEmail,
    getSubject, // Export getSubject for potential use in controllers if needed
};