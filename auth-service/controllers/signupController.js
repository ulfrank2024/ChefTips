const { UserModel } = require("../models/userModel");
const { CompanyModel } = require("../models/companyModel");
const { MembershipModel } = require("../models/membershipModel");
const { TokenModel } = require("../models/tokenModel");
const CategoryModel = require("../models/CategoryModel"); // Import CategoryModel
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

        console.log('--- Signup Debug ---');
        console.log('CategoryModel.getCategoriesByCompany called from signupController.js');
        // Check the 'pool' that CategoryModel is using (indirectly)
        try {
            const poolCheck = require('../db');
            console.log('Pool imported in signupController.js:', !!poolCheck);
            // Additionally, check if poolCheck.query is defined
            console.log('poolCheck.query defined:', !!poolCheck.query);
        } catch (e) {
            console.error('Error importing pool in signupController.js:', e.message);
        }
        console.log('--- End Signup Debug ---');

        // Find or create a default "Manager" category for the new company
        let managerCategory = (await CategoryModel.getCategoriesByCompany(company.id))
                                .find(cat => cat.name.toLowerCase() === 'manager');
        
        if (!managerCategory) {
            managerCategory = await CategoryModel.createCategory(company.id, 'Manager', false); // Manager is not a tip distribution pool
            console.log(`Catégorie 'Manager' créée avec l'ID: ${managerCategory.id}`);
        } else {
            console.log(`Catégorie 'Manager' trouvée avec l'ID: ${managerCategory.id}`);
        }

        await MembershipModel.createMembership(user.id, company.id, managerCategory.id, true); // Pass categoryId (UUID) and set can_cash_out to true for managers
        console.log('Adhésion créée avec la catégorie Manager');

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
