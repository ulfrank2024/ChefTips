const { AuthModel } = require("../models/authModel");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

// --- Signup and Initial Company/User Creation ---
const signup = async (req, res) => {
    const { email, password, companyName, firstName, lastName } = req.body;
    if (!email || !password || !companyName || !firstName || !lastName) {
        return res.status(400).json({ error: "SIGNUP_FIELDS_REQUIRED" });
    }
    try {
        const existingUser = await AuthModel.findUserByEmail(email);
        if (existingUser && existingUser.email_validated) {
            return res.status(400).json({ error: "EMAIL_ALREADY_IN_USE" });
        }

        const company = await AuthModel.createCompany(companyName);
        const user = existingUser || await AuthModel.createUser(email, password, firstName, lastName);
        if (!existingUser) { await AuthModel.updatePassword(user.id, password); }

        await AuthModel.createMembership(user.id, company.id, 'manager');

        const otp = await AuthModel.createEmailVerificationOtp(user.id);
        await transporter.sendMail({
            from: process.env.SMTP_FROM_EMAIL,
            to: email,
            subject: "Verify Your Account / Vérifiez votre compte",
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Welcome to ChefTips!</h2>
                    <p>Thank you for signing up. Please use the following One-Time Password (OTP) to verify your account:</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0056b3;">${otp}</p>
                    <p>This OTP is valid for 10 minutes.</p>
                    <hr>
                    <h2>Bienvenue sur ChefTips !</h2>
                    <p>Merci de vous être inscrit. Veuillez utiliser le mot de passe à usage unique (OTP) suivant pour vérifier votre compte :</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0056b3;">${otp}</p>
                    <p>Ce code est valide pour 10 minutes.</p>
                </div>
            `
        });

        res.status(201).json({ success_code: "SIGNUP_SUCCESS_VERIFICATION_SENT" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

// --- Login and Session Management ---
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "LOGIN_FIELDS_REQUIRED" });
    }
    try {
        const user = await AuthModel.findUserByEmail(email);
        if (!user || !user.password || !user.email_validated) {
            return res.status(401).json({ error: "INVALID_CREDENTIALS_OR_UNVERIFIED" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "INVALID_CREDENTIALS" });
        }

        const memberships = await AuthModel.getMembershipsByUserId(user.id);
        if (memberships.length === 0) {
            return res.status(403).json({ error: "NO_COMPANY_MEMBERSHIP" });
        }

        if (memberships.length === 1) {
            const membership = memberships[0];
            const payload = { 
                id: user.id, 
                email: user.email, 
                first_name: user.first_name, 
                last_name: user.last_name, 
                preferred_language: user.preferred_language, // Add language
                company_id: membership.company_id, 
                company_name: membership.company_name, 
                role: membership.role 
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
            return res.status(200).json({ success_code: "LOGIN_SUCCESSFUL", token });
        }

        res.status(200).json({
            success_code: "MULTIPLE_COMPANIES_CHOOSE_ONE",
            userId: user.id,
            memberships: memberships.map(m => ({ company_id: m.company_id, company_name: m.company_name, role: m.role }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const selectCompany = async (req, res) => {
    const { userId, companyId } = req.body;
    if (!userId || !companyId) {
        return res.status(400).json({ error: "USER_ID_AND_COMPANY_ID_REQUIRED" });
    }
    try {
        const user = await AuthModel.findUserById(userId);
        const memberships = await AuthModel.getMembershipsByUserId(userId);
        const selectedMembership = memberships.find(m => m.company_id === companyId);
        if (!user || !selectedMembership) {
            return res.status(403).json({ error: "MEMBERSHIP_NOT_FOUND_OR_UNAUTHORIZED" });
        }
        const payload = { 
            id: user.id, 
            email: user.email, 
            first_name: user.first_name, 
            last_name: user.last_name, 
            preferred_language: user.preferred_language, // Add language
            company_id: selectedMembership.company_id, 
            company_name: selectedMembership.company_name, 
            role: selectedMembership.role 
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.status(200).json({ success_code: "COMPANY_SELECTED_SUCCESSFULLY", token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

// --- Employee Management (Simplified) ---
const inviteEmployee = async (req, res) => {
    const { company_id: managerCompanyId, company_name: managerCompanyName, role: managerRole } = req.user;
    if (managerRole !== 'manager') {
        return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
    }
    const { email, categoryId } = req.body; // Add categoryId
    if (!email) { return res.status(400).json({ error: "EMAIL_REQUIRED" }); }

    try {
        let user = await AuthModel.findUserByEmail(email);
        const isNewUser = !user;
        if (isNewUser) {
            user = await AuthModel.createUser(email, null, null, null);
        }

        const memberships = await AuthModel.getMembershipsByUserId(user.id);
        if (memberships.some(m => m.company_id === managerCompanyId)) {
            return res.status(409).json({ error: "USER_ALREADY_MEMBER_OF_COMPANY" });
        }

        // Create membership with the generic 'employee' role and optional categoryId
        await AuthModel.createMembership(user.id, managerCompanyId, 'employee', categoryId);

        if (isNewUser) {
            const code = await AuthModel.createInvitationCode(user.id);
            const setupPasswordUrl = `${process.env.FRONTEND_URL}/setup-password?token=${code}`;
            await transporter.sendMail({ 
                to: email,
                subject: `Invitation to join ${managerCompanyName} on ChefTips`,
                html: `<p>You have been invited to join ${managerCompanyName} on ChefTips!</p><p>Please click the following link to complete your registration and set your password:</p><p><a href="${setupPasswordUrl}">Complete Registration</a></p><p>Your invitation code is also: <strong>${code}</strong></p>`
            });
        } else {
            await transporter.sendMail({ 
                to: email, 
                subject: `You have been added to ${managerCompanyName} / Vous avez été ajouté à ${managerCompanyName}`,
                html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>You've been added to a new team!</h2>
                    <p>You have been added to the <strong>${managerCompanyName}</strong> team on ChefTips.</p>
                    <p>You can log in with your existing password to see your new team.</p>
                    <hr>
                    <h2>Vous avez été ajouté à une nouvelle équipe !</h2>
                    <p>Vous avez été ajouté à l'équipe <strong>${managerCompanyName}</strong> sur ChefTips.</p>
                    <p>Vous pouvez vous connecter avec votre mot de passe existant pour voir votre nouvelle équipe.</p>
                </div>
            `
            });
        }

        res.status(200).json({ success_code: "INVITATION_SENT_SUCCESSFULLY" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const updateMembership = async (req, res) => {
    const { membershipId } = req.params;
    const { categoryId } = req.body;
    const { company_id: managerCompanyId, role: managerRole } = req.user;

    if (managerRole !== 'manager') {
        return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
    }

    try {
        // Verify the membership belongs to the manager's company
        const membership = await AuthModel.getMembershipById(membershipId);
        if (!membership || membership.company_id !== managerCompanyId) {
            return res.status(404).json({ error: "MEMBERSHIP_NOT_FOUND_IN_COMPANY" });
        }

        await AuthModel.updateMembership(membershipId, categoryId);
        res.status(200).json({ success_code: "MEMBERSHIP_UPDATED_SUCCESSFULLY" });
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
        const user = await AuthModel.findUserByEmail(email);
        if (!user) {
            return res.status(400).json({ error: "INVALID_INVITATION" });
        }

        const invitation = await AuthModel.findInvitationCode(user.id, code);
        if (!invitation) {
            return res.status(400).json({ error: "INVALID_OR_EXPIRED_INVITATION" });
        }

        // If the invitation is valid, create a password setup token
        const setupToken = await AuthModel.createPasswordSetupToken(user.id);
        
        // Delete the invitation code so it can't be used again
        await AuthModel.deleteInvitationCode(user.id, code);

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
        const setup = await AuthModel.findPasswordSetupToken(token);
        if (!setup) {
            return res.status(400).json({ error: "INVALID_OR_EXPIRED_TOKEN" });
        }

        const userId = setup.user_id;
        await AuthModel.updateUserName(userId, firstName, lastName);
        await AuthModel.updatePassword(userId, password);
        await AuthModel.validateUserEmail(userId); // Also validate the email

        // Clean up the token
        await AuthModel.deletePasswordSetupToken(token);

        res.status(200).json({ success_code: "PASSWORD_SETUP_SUCCESSFUL" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const removeEmployee = async (req, res) => {
    const { membershipId } = req.params;
    const { company_id: managerCompanyId, role: managerRole } = req.user;
    if (managerRole !== 'manager') {
        return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
    }
    try {
        const membership = await AuthModel.getMembershipById(membershipId);
        if (!membership || membership.company_id !== managerCompanyId) {
            return res.status(404).json({ error: "MEMBERSHIP_NOT_FOUND_IN_COMPANY" });
        }
        const user = await AuthModel.findUserById(membership.user_id);
        await AuthModel.deleteMembership(membershipId);
        if (user) {
            await transporter.sendMail({ to: user.email, subject: `Votre accès à une entreprise a été révoqué`, html: `<p>Votre accès à l'entreprise a été révoqué sur ChefTips.</p>` });
        }
        res.status(200).json({ success_code: "EMPLOYEE_REMOVED_SUCCESSFULLY" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

// --- OTP, Password, and other User-centric flows ---
const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ error: "EMAIL_AND_OTP_REQUIRED" });
    }
    try {
        const user = await AuthModel.findUserByEmail(email);
        if (!user) {
            return res.status(400).json({ error: "INVALID_OTP_OR_EMAIL" });
        }

        const foundOtp = await AuthModel.findEmailVerificationOtp(user.id, otp);
        if (!foundOtp) {
            return res.status(400).json({ error: "INVALID_OR_EXPIRED_OTP" });
        }

        // OTP is correct, validate the user's email and delete the OTP
        await AuthModel.validateUserEmail(user.id);
        await AuthModel.deleteEmailVerificationOtp(user.id, otp);

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
        const user = await AuthModel.findUserByEmail(email);
        if (!user) {
            // Don't reveal if user exists or not for security reasons
            return res.status(200).json({ success_code: "OTP_SENT_IF_USER_EXISTS" });
        }

        const otp = await AuthModel.createEmailVerificationOtp(user.id);
        
        // Re-use the email template from signup
        await transporter.sendMail({
            from: process.env.SMTP_FROM_EMAIL,
            to: email,
            subject: "Your New Verification Code / Votre nouveau code de vérification",
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>ChefTips Verification</h2>
                    <p>Here is your new One-Time Password (OTP):</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0056b3;">${otp}</p>
                    <p>This OTP is valid for 10 minutes.</p>
                    <hr>
                    <h2>Vérification ChefTips</h2>
                    <p>Voici votre nouveau mot de passe à usage unique (OTP) :</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0056b3;">${otp}</p>
                    <p>Ce code est valide pour 10 minutes.</p>
                </div>
            `
        });

        res.status(200).json({ success_code: "OTP_RESENT_SUCCESSFULLY" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const updateLanguagePreference = async (req, res) => {
    const { id: userId } = req.user;
    const { language } = req.body;

    if (!language) {
        return res.status(400).json({ error: "LANGUAGE_CODE_REQUIRED" });
    }

    try {
        await AuthModel.updateUserLanguage(userId, language);
        res.status(200).json({ success_code: "LANGUAGE_UPDATED_SUCCESSFULLY" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const updateProfile = async (req, res) => {
    const { id: userId, company_id, company_name, role } = req.user;
    const { firstName, lastName } = req.body;

    if (!firstName || !lastName) {
        return res.status(400).json({ error: "NAMES_REQUIRED" });
    }

    try {
        await AuthModel.updateUserName(userId, firstName, lastName);
        
        // Fetch the updated user to get all current data
        const updatedUser = await AuthModel.findUserById(userId);

        // Create a new token with the updated information
        const payload = {
            id: updatedUser.id,
            email: updatedUser.email,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            preferred_language: updatedUser.preferred_language,
            company_id, // Keep from original token
            company_name, // Keep from original token
            role, // Keep from original token
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({ success_code: "PROFILE_UPDATED_SUCCESSFULLY", token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const changePassword = async (req, res) => {
    const { id: userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "PASSWORDS_REQUIRED" });
    }

    try {
        const user = await AuthModel.findUserById(userId);
        if (!user || !user.password) {
            return res.status(401).json({ error: "INVALID_CREDENTIALS" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "INVALID_CURRENT_PASSWORD" });
        }

        await AuthModel.updatePassword(userId, newPassword);
        res.status(200).json({ success_code: "PASSWORD_CHANGED_SUCCESSFULLY" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getCompanyEmployees = async (req, res) => {
    const { company_id } = req.user;
    try {
        const employees = await AuthModel.getCompanyEmployees(company_id);
        res.status(200).json(employees);
    } catch (err) { console.error(err); res.status(500).json({ error: "INTERNAL_SERVER_ERROR" }); }
};

// --- Category endpoints are removed ---

module.exports = {
    signup,
    login,
    selectCompany,
    inviteEmployee,
    removeEmployee,
    getCompanyEmployees,
    verifyOtp,
    resendOtp,
    updateLanguagePreference,
    changePassword,
    updateProfile,
    updateMembership,
    verifyInvitation,
    setupPassword,
};
