const { UserModel } = require("../models/userModel");
const { CompanyModel } = require("../models/companyModel");
const { MembershipModel } = require("../models/membershipModel");
const { TokenModel } = require("../models/tokenModel");
const { sendEmail } = require("../services/emailService");

const signup = async (req, res) => {
    const { email, password, companyName, firstName, lastName } = req.body;
    if (!email || !password || !companyName || !firstName || !lastName) {
        return res.status(400).json({ error: "SIGNUP_FIELDS_REQUIRED" });
    }
    try {
        const existingUser = await UserModel.findUserByEmail(email);
        if (existingUser && existingUser.email_validated) {
            return res.status(400).json({ error: "EMAIL_ALREADY_IN_USE" });
        }

        const company = await CompanyModel.createCompany(companyName);
        const user = existingUser || await UserModel.createUser(email, password, firstName, lastName);
        if (!existingUser) { await UserModel.updatePassword(user.id, password); }

        await MembershipModel.createMembership(user.id, company.id, 'manager');

        const otp = await TokenModel.createEmailVerificationOtp(user.id);
        const verificationLink = `${process.env.FRONTEND_URL}/verify-otp?email=${encodeURIComponent(email)}`;

        const templateData = {
            otp,
            verificationLink,
            currentYear: new Date().getFullYear(),
        };

        await sendEmail(email, "Bienvenue / Welcome", 'signup', templateData, 'en');

        res.status(201).json({ success_code: "SIGNUP_SUCCESS_VERIFICATION_SENT" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

module.exports = {
    signup,
};
