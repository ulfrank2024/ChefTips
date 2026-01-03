const { UserModel } = require("../models/userModel");
const { MembershipModel } = require("../models/membershipModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const login = async (req, res) => {
    console.log('Requête POST /api/auth/login reçue');
    const { email, password, app_context } = req.body; // app_context can be 'admin' or 'manager'
    if (!email || !password || !app_context) {
        console.log('Erreur: LOGIN_FIELDS_REQUIRED');
        return res.status(400).json({ error: "LOGIN_FIELDS_REQUIRED" });
    }

    try {
        const user = await UserModel.findUserByEmail(email);
        if (!user || !user.password || !user.email_validated) {
            console.log(`Utilisateur non trouvé, non validé ou sans mot de passe pour l'email: ${email}`);
            return res.status(401).json({ error: "INVALID_CREDENTIALS_OR_UNVERIFIED" });
        }
        console.log(`Utilisateur trouvé: ${user.email}, Validé: ${user.email_validated}`);
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Erreur: Mot de passe incorrect');
            return res.status(401).json({ error: "INVALID_CREDENTIALS" });
        }
        console.log('Mot de passe correct');

        let memberships = await MembershipModel.getMembershipsByUserId(user.id);
        if (memberships.length === 0) {
            console.log('Erreur: NO_COMPANY_MEMBERSHIP');
            return res.status(403).json({ error: "NO_COMPANY_MEMBERSHIP" });
        }

        // Filter memberships based on app_context
        if (app_context === 'admin') {
            memberships = memberships.filter(m => m.role === 'admin');
        } else if (app_context === 'manager') {
            memberships = memberships.filter(m => m.role !== 'admin');
        }

        if (memberships.length === 0) {
            console.log('Erreur: Rôle non autorisé pour cette application');
            return res.status(403).json({ error: "ACCESS_DENIED_FOR_APP_CONTEXT" });
        }

        if (memberships.length === 1) {
            const membership = memberships[0];
            const payload = { 
                id: user.id, 
                email: user.email, 
                first_name: user.first_name, 
                last_name: user.last_name, 
                preferred_language: user.preferred_language,
                company_id: membership.company_id, 
                company_name: membership.company_name, 
                role: membership.role,
                can_cash_out: membership.can_cash_out
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
            console.log('Connexion réussie (une seule entreprise)');
            return res.status(200).json({ success_code: "LOGIN_SUCCESSFUL", token });
        }

        console.log('Connexion réussie (plusieurs entreprises)');
        res.status(200).json({
            success_code: "MULTIPLE_COMPANIES_CHOOSE_ONE",
            userId: user.id,
            memberships: memberships.map(m => ({ company_id: m.company_id, company_name: m.company_name, role: m.role }))
        });
    } catch (err) {
        console.error('Erreur interne du serveur lors de la connexion:', err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const selectCompany = async (req, res) => {
    console.log('Requête POST /api/auth/selectCompany reçue');
    const { userId, companyId, app_context } = req.body;
    if (!userId || !companyId || !app_context) {
        console.log('Erreur: USER_ID_COMPANY_ID_AND_APP_CONTEXT_REQUIRED');
        return res.status(400).json({ error: "USER_ID_COMPANY_ID_AND_APP_CONTEXT_REQUIRED" });
    }
    try {
        const user = await UserModel.findUserById(userId);
        const memberships = await MembershipModel.getMembershipsByUserId(userId);
        const selectedMembership = memberships.find(m => m.company_id === companyId);

        if (!user || !selectedMembership) {
            console.log('Erreur: MEMBERSHIP_NOT_FOUND_OR_UNAUTHORIZED');
            return res.status(403).json({ error: "MEMBERSHIP_NOT_FOUND_OR_UNAUTHORIZED" });
        }

        // Validate role against app_context
        if (app_context === 'admin' && selectedMembership.role !== 'admin') {
            console.log('Erreur: Rôle non-admin tentant d\'accéder à l\'application admin');
            return res.status(403).json({ error: "ACCESS_DENIED_FOR_APP_CONTEXT" });
        }
        if (app_context === 'manager' && selectedMembership.role === 'admin') {
            console.log('Erreur: Rôle admin tentant d\'accéder à l\'application manager');
            return res.status(403).json({ error: "ACCESS_DENIED_FOR_APP_CONTEXT" });
        }

        const payload = { 
            id: user.id, 
            email: user.email, 
            first_name: user.first_name, 
            last_name: user.last_name, 
            preferred_language: user.preferred_language,
            company_id: selectedMembership.company_id, 
            company_name: selectedMembership.company_name, 
            role: selectedMembership.role, 
            can_cash_out: selectedMembership.can_cash_out
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
        console.log('Sélection de l\'entreprise réussie');
        res.status(200).json({ success_code: "COMPANY_SELECTED_SUCCESSFULLY", token });
    } catch (err) {
        console.error('Erreur interne du serveur lors de la sélection de l\'entreprise:', err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

module.exports = {
    login,
    selectCompany,
};