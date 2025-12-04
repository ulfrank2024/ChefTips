const { UserModel } = require("../models/userModel");
const { MembershipModel } = require("../models/membershipModel");
const { TokenModel } = require("../models/tokenModel");
const { sendEmail } = require("../services/emailService");

const inviteEmployee = async (req, res) => {
    const { company_id: managerCompanyId, company_name: managerCompanyName, role: managerRole, preferred_language: managerLang } = req.user;
    if (managerRole !== 'manager') {
        return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
    }
    const { email, role, can_cash_out } = req.body;
    if (!email || !role) { return res.status(400).json({ error: "EMAIL_AND_ROLE_REQUIRED" }); }

    try {
        let user = await UserModel.findUserByEmail(email);
        const isNewUser = !user;
        if (isNewUser) {
            user = await UserModel.createUser(email, null, null, null);
        }

        const memberships = await MembershipModel.getMembershipsByUserId(user.id);
        if (memberships.some(m => m.company_id === managerCompanyId)) {
            return res.status(409).json({ error: "USER_ALREADY_MEMBER_OF_COMPANY" });
        }

        await MembershipModel.createMembership(user.id, managerCompanyId, role, can_cash_out);

        if (isNewUser) {
            const code = await TokenModel.createInvitationCode(user.id);
            const frontendUrl = process.env.FRONTEND_URL || 'https://www.cheftips.app';
            const setupPasswordUrl = `${frontendUrl}/verify-invitation?email=${encodeURIComponent(email)}&code=${code}`;
            const loginPageUrl = `${frontendUrl}/login`;
            await sendEmail(email, 'inviteNewUser', { setupPasswordUrl, code, managerCompanyName, loginPageUrl }, managerLang);
        } else {
            await sendEmail(email, 'inviteExistingUser', { managerCompanyName }, user.preferred_language || managerLang);
        }

        res.status(200).json({ success_code: "INVITATION_SENT_SUCCESSFULLY" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const updateMembership = async (req, res) => {
    const { membershipId } = req.params;
    const { role, can_cash_out } = req.body;
    const { company_id: managerCompanyId, role: managerRole } = req.user;

    if (managerRole !== 'manager') {
        return res.status(403).json({ error: "UNAUTHORIZED_ACCESS" });
    }

    try {
        const membership = await MembershipModel.getMembershipById(membershipId);
        if (!membership || membership.company_id !== managerCompanyId) {
            return res.status(404).json({ error: "MEMBERSHIP_NOT_FOUND_IN_COMPANY" });
        }

        await MembershipModel.updateMembership(membershipId, { role, can_cash_out });
        res.status(200).json({ success_code: "MEMBERSHIP_UPDATED_SUCCESSFULLY" });
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
        const membership = await MembershipModel.getMembershipById(membershipId);
        if (!membership || membership.company_id !== managerCompanyId) {
            return res.status(404).json({ error: "MEMBERSHIP_NOT_FOUND_IN_COMPANY" });
        }
        const user = await UserModel.findUserById(membership.user_id);
        await MembershipModel.deleteMembership(membershipId);
        if (user) {
            await sendEmail(user.email, 'removeEmployee', { managerCompanyName: req.user.company_name }, user.preferred_language || req.user.preferred_language);
        }
        res.status(200).json({ success_code: "EMPLOYEE_REMOVED_SUCCESSFULLY" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getCompanyEmployees = async (req, res) => {
    const { company_id } = req.user;
    try {
        const employees = await MembershipModel.getCompanyEmployees(company_id);
        res.status(200).json(employees);
    } catch (err) { console.error(err); res.status(500).json({ error: "INTERNAL_SERVER_ERROR" }); }
};

module.exports = {
    inviteEmployee,
    updateMembership,
    removeEmployee,
    getCompanyEmployees,
};

