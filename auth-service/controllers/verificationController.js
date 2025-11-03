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

        await sendEmail(email, "Bienvenue / Welcome", 'welcome', { firstName: user.first_name, currentYear }, 'en');

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
        
        await sendEmail(email, "Vérification OTP / OTP Verification", 'signup', { otp }, user.preferred_language || 'en');

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
    if (!token || !password || !firstName || !lastName) {
        return res.status(400).json({ error: "ALL_FIELDS_REQUIRED" });
    }

    try {
        const setup = await TokenModel.findPasswordSetupToken(token);
        if (!setup) {
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

        await sendEmail(updatedUser.email, "Bienvenue dans l'équipe / Welcome to the team", 'welcomeEmployee', { firstName: updatedUser.first_name, companyName, currentYear }, 'en');

        await TokenModel.deletePasswordSetupToken(token);

        res.status(200).json({ success_code: "PASSWORD_SETUP_SUCCESSFUL" });
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
};
