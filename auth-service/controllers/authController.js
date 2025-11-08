const { UserModel } = require("../models/userModel");
const { MembershipModel } = require("../models/membershipModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "LOGIN_FIELDS_REQUIRED" });
    }
    try {
        const user = await UserModel.findUserByEmail(email);
        if (!user || !user.password || !user.email_validated) {
            return res.status(401).json({ error: "INVALID_CREDENTIALS_OR_UNVERIFIED" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "INVALID_CREDENTIALS" });
        }

        const memberships = await MembershipModel.getMembershipsByUserId(user.id);
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
                preferred_language: user.preferred_language,
                company_id: membership.company_id, 
                company_name: membership.company_name, 
                role: membership.role,
                can_cash_out: membership.can_cash_out
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
            return res.status(200).json({ success_code: "LOGIN_SUCCESSFUL", token });
        }

        res.status(200).json({
            success_code: "MULTIPLE_COMPANIES_CHOOSE_ONE",
            userId: user.id,
            memberships: memberships.map(m => ({ company_id: m.company_id, company_name: m.company_name, role: m.role }))
    } catch (err) {
        console.error('DEBUG: DATABASE_URL is:', process.env.DATABASE_URL);
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
        const user = await UserModel.findUserById(userId);
        const memberships = await MembershipModel.getMembershipsByUserId(userId);
        const selectedMembership = memberships.find(m => m.company_id === companyId);
        if (!user || !selectedMembership) {
            return res.status(403).json({ error: "MEMBERSHIP_NOT_FOUND_OR_UNAUTHORIZED" });
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
        res.status(200).json({ success_code: "COMPANY_SELECTED_SUCCESSFULLY", token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

module.exports = {
    login,
    selectCompany,
};