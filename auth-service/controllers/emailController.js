const { sendEmail } = require('../services/emailService');
const userModel = require('../models/userModel');

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

        const emailData = {
            sender_name,
            amount: parseFloat(amount).toFixed(2),
            role,
            recipient_name: recipient.first_name,
        };

        await sendEmail(recipient.email, 'cashOutNotification', emailData, recipient.preferred_language);

        res.status(200).json({ message: 'Cash out notification sent successfully.' });
    } catch (error) {
        console.error('Error sending cash out notification:', error);
        res.status(500).json({ error: 'Failed to send cash out notification.' });
    }
};

module.exports = {
    sendCashOutNotification,
};
