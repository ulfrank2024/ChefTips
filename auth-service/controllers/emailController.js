const { sendEmail } = require('../services/emailService');
const userModel = require('../models/userModel');
const frTranslations = require("../locales/fr.json");
const enTranslations = require("../locales/en.json");

const sendCashOutNotification = async (req, res) => {
    const { recipient_user_id, sender_name, amount, role } = req.body;

    if (!recipient_user_id || !sender_name || !amount || !role) {
        return res.status(400).json({ error: 'Missing required fields for cash out notification.' });
    }

    try {
        const recipient = await userModel.findUserById(recipient_user_id);
        if (!recipient) {
            return res.status(404).json({ error: 'Recipient user not found.' });
        }

        const language = recipient.preferred_language || 'en';
        let translations;
        if (language === 'fr') {
            translations = frTranslations;
        } else {
            translations = enTranslations;
        }

        const translatedRole = translations.roles[role.toUpperCase()] || role;

        const emailData = {
            sender_name,
            amount: parseFloat(amount).toFixed(2),
            role: translatedRole,
            recipient_name: recipient.first_name,
        };

        await sendEmail(recipient.email, 'cashOutNotification', emailData, language);

        res.status(200).json({ message: 'Cash out notification sent successfully.' });
    } catch (error) {
        console.error('Error sending cash out notification:', error);
        res.status(500).json({ error: 'Failed to send cash out notification.' });
    }
};

const sendInternalEmail = async (req, res) => {
    const { to, templateName, templateData, language = 'en' } = req.body;

    if (!to || !templateName || !templateData) {
        return res.status(400).json({ error: 'Missing required fields for internal email.' });
    }

    try {
        await sendEmail(to, templateName, templateData, language);
        res.status(200).json({ message: 'Internal email sent successfully.' });
    } catch (error) {
        console.error('Error sending internal email:', error);
        res.status(500).json({ error: 'Failed to send internal email.' });
    }
};

module.exports = {
    sendCashOutNotification,
    sendInternalEmail,
};
