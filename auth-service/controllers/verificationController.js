const { UserModel } = require("../models/userModel");
const { MembershipModel } = require("../models/membershipModel");
const { TokenModel } = require("../models/tokenModel");
const { sendEmail } = require("../services/emailService");
require("dotenv").config();

const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ error: "EMAIL_AND_OTP_REQUIRED" });
    }
    try {
        const user = await UserModel.findUserByEmail(email);
        if (!user) {
            return res.status(400).json({ error: "INVALID_OTP_OR_EMAIL" });
        }

        const foundOtp = await TokenModel.findEmailVerificationOtp(user.id, otp);
        if (!foundOtp) {
            return res.status(400).json({ error: "INVALID_OR_EXPIRED_OTP" });
        }

        await UserModel.validateUserEmail(user.id);
        await TokenModel.deleteEmailVerificationOtp(user.id, otp);

        const currentYear = new Date().getFullYear();

        await sendEmail(email, 'welcome', { firstName: user.first_name, currentYear }, user.preferred_language || 'en');

        res.status(200).json({ success_code: "EMAIL_VERIFIED_SUCCESSFULLY" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const resendOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: "EMAIL_REQUIRED" });
    }
    try {
        const user = await UserModel.findUserByEmail(email);
        if (!user) {
            return res.status(200).json({ success_code: "OTP_SENT_IF_USER_EXISTS" });
        }

        const otp = await TokenModel.createEmailVerificationOtp(user.id);
        
        await sendEmail(email, 'signup', { otp }, user.preferred_language || 'en');

        res.status(200).json({ success_code: "OTP_RESENT_SUCCESSFULLY" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const verifyInvitation = async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ error: "EMAIL_AND_CODE_REQUIRED" });
    }
    try {
        const user = await UserModel.findUserByEmail(email);
        if (!user) {
            return res.status(400).json({ error: "INVALID_INVITATION" });
        }

        const invitation = await TokenModel.findInvitationCode(user.id, code);
        if (!invitation) {
            return res.status(400).json({ error: "INVALID_OR_EXPIRED_INVITATION" });
        }

        const setupToken = await TokenModel.createPasswordSetupToken(user.id);
        
        await TokenModel.deleteInvitationCode(user.id, code);

        res.status(200).json({ success_code: "INVITATION_VERIFIED", setupToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const setupPassword = async (req, res) => {
    const { token, password, firstName, lastName } = req.body;
    console.log('[setupPassword] Received token:', token);
    console.log('[setupPassword] Received password (length):', password ? password.length : 0);
    console.log('[setupPassword] Received firstName:', firstName);
    console.log('[setupPassword] Received lastName:', lastName);

    if (!token || !password || !firstName || !lastName) {
        console.log('[setupPassword] Error: ALL_FIELDS_REQUIRED');
        return res.status(400).json({ error: "ALL_FIELDS_REQUIRED" });
    }

    try {
        const setup = await TokenModel.findPasswordSetupToken(token);
        console.log('[setupPassword] TokenModel.findPasswordSetupToken result:', setup);
        if (!setup) {
            console.log('[setupPassword] Error: INVALID_OR_EXPIRED_TOKEN - Token not found or expired in DB');
            return res.status(400).json({ error: "INVALID_OR_EXPIRED_TOKEN" });
        }

        const userId = setup.user_id;
        await UserModel.updateUserName(userId, firstName, lastName);
        await UserModel.updatePassword(userId, password);
        await UserModel.validateUserEmail(userId);

        const updatedUser = await UserModel.findUserById(userId);
        const memberships = await MembershipModel.getMembershipsByUserId(userId);
        const primaryMembership = memberships.find(m => m.role === 'employee' || m.role === 'manager');
        const companyName = primaryMembership ? primaryMembership.company_name : '';

        const currentYear = new Date().getFullYear();
        const frontendUrl = process.env.FRONTEND_URL || 'https://www.cheftips.app'; // Ensure frontendUrl is available
        const loginPageUrl = `${frontendUrl}/login`;

        await sendEmail(updatedUser.email, 'welcomeEmployee', { firstName: updatedUser.first_name, companyName, currentYear, loginPageUrl }, updatedUser.preferred_language || 'en');

        await TokenModel.deletePasswordSetupToken(token);

        res.status(200).json({ success_code: "PASSWORD_SETUP_SUCCESSFUL" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: "EMAIL_REQUIRED" });
    }
    try {
        const user = await UserModel.findUserByEmail(email);
        if (user) {
            const currentYear = new Date().getFullYear();
            // User exists but has not set a password (invited user flow)
            if (user.password === null) {
                const token = await TokenModel.createPasswordSetupToken(user.id);
                const setupLink = `https://www.cheftips.app/setup-password?token=${token}`;
                // Send an email that leads back to the setup page
                await sendEmail(email, 'finishInvitationSetup', { setupLink, currentYear }, user.preferred_language || 'en');
                // Return a specific success code for this case
                return res.status(200).json({ success_code: "SETUP_EMAIL_SENT" });
            } else {
                // Standard password reset flow for existing users
                const token = await TokenModel.createPasswordResetToken(user.id);
                const resetLink = `https://www.cheftips.app/reset-password?token=${token}`;
                await sendEmail(email, 'passwordReset', { resetLink, currentYear }, user.preferred_language || 'en');
            }
        }
        // Always return success to prevent email enumeration
        res.status(200).json({ success_code: "PASSWORD_RESET_LINK_SENT" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ error: "TOKEN_AND_PASSWORD_REQUIRED" });
    }
    try {
        const resetRequest = await TokenModel.findPasswordResetToken(token);
        if (!resetRequest) {
            return res.status(400).json({ error: "INVALID_OR_EXPIRED_TOKEN" });
        }

        await UserModel.updatePassword(resetRequest.user_id, password);
        await TokenModel.deletePasswordResetToken(token);

        res.status(200).json({ success_code: "PASSWORD_RESET_SUCCESSFUL" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};


module.exports = {
    verifyOtp,
    resendOtp,
    verifyInvitation,
    setupPassword,
    forgotPassword,
    resetPassword,
};
