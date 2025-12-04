const { UserModel } = require("../models/userModel");
const { CompanyModel } = require("../models/companyModel");
const { MembershipModel } = require("../models/membershipModel");
const { TokenModel } = require("../models/tokenModel");
const { sendEmail } = require("../services/emailService");
const { createTrialSubscription } = require("../services/billingService"); // Import billingService

const signup = async (req, res) => {
    console.log('Requête POST /api/auth/signup reçue');
    const { email, password, companyName, firstName, lastName } = req.body;
    if (!email || !password || !companyName || !firstName || !lastName) {
        console.log('Erreur: SIGNUP_FIELDS_REQUIRED');
        return res.status(400).json({ error: "SIGNUP_FIELDS_REQUIRED" });
    }
    try {
        const existingUser = await UserModel.findUserByEmail(email);
        if (existingUser && existingUser.email_validated) {
            console.log(`Erreur: EMAIL_ALREADY_IN_USE pour l'email: ${email}`);
            return res.status(400).json({ error: "EMAIL_ALREADY_IN_USE" });
        }
        console.log(`Utilisateur existant: ${existingUser ? 'Oui' : 'Non'}`);

        const company = await CompanyModel.createCompany(companyName);
        console.log(`Entreprise créée avec l'ID: ${company.id}`);
        const user = existingUser || await UserModel.createUser(email, password, firstName, lastName);
        console.log(`Utilisateur créé/récupéré avec l'ID: ${user.id}`);
        if (!existingUser) { await UserModel.updatePassword(user.id, password); }

        await MembershipModel.createMembership(user.id, company.id, 'manager');
        console.log('Adhésion créée');

        // Call billingService to create a trial subscription for the new company
        await createTrialSubscription(company.id, company.name, email);
        console.log(`Abonnement d'essai créé pour l'entreprise ${company.id}`);

        const otp = await TokenModel.createEmailVerificationOtp(user.id);
        const frontendUrl = process.env.FRONTEND_URL || 'https://www.cheftips.app'; // Valeur par défaut
        const verificationLink = `${frontendUrl}/verify-otp?email=${encodeURIComponent(email)}`;
        const loginPageUrl = `${frontendUrl}/login`;

        const templateData = {
            otp,
            verificationLink,
            loginPageUrl,
            currentYear: new Date().getFullYear(),
        };

                await sendEmail(email, 'signup', templateData, 'en');
        console.log('Email de vérification envoyé');

        res.status(201).json({ success_code: "SIGNUP_SUCCESS_VERIFICATION_SENT" });
    } catch (err) {
        console.error('Erreur interne du serveur lors de l\'inscription:', err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

module.exports = {
    signup,
};
