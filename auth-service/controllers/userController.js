const { UserModel } = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const updateLanguagePreference = async (req, res) => {
    const { id: userId } = req.user;
    const { language } = req.body;

    if (!language) {
        return res.status(400).json({ error: "LANGUAGE_CODE_REQUIRED" });
    }

    try {
        await UserModel.updateUserLanguage(userId, language);
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
        await UserModel.updateUserName(userId, firstName, lastName);
        
        const updatedUser = await UserModel.findUserById(userId);

        const payload = {
            id: updatedUser.id,
            email: updatedUser.email,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            preferred_language: updatedUser.preferred_language,
            company_id, 
            company_name, 
            role, 
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
        const user = await UserModel.findUserById(userId);
        if (!user || !user.password) {
            return res.status(401).json({ error: "INVALID_CREDENTIALS" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "INVALID_CURRENT_PASSWORD" });
        }

        await UserModel.updatePassword(userId, newPassword);
        res.status(200).json({ success_code: "PASSWORD_CHANGED_SUCCESSFULLY" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getUserDetails = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await UserModel.findUserById(userId);
        if (!user) {
            return res.status(404).json({ error: "USER_NOT_FOUND" });
        }
        res.status(200).json({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

module.exports = {
    updateLanguagePreference,
    updateProfile,
    changePassword,
    getUserDetails,
};
