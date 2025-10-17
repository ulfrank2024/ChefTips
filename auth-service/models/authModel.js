// models/authModel.js
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const AuthModel = {
    // --- User Methods ---
    async createUser(email, password, firstName, lastName) {
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
        const result = await pool.query(
            "INSERT INTO users (email, password, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *",
            [email, hashedPassword, firstName, lastName]
        );
        return result.rows[0];
    },

    async findUserByEmail(email) {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    },

    async findUserById(id) {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        return result.rows[0];
    },

    async updatePassword(userId, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, userId]);
    },

    async updateUserName(userId, firstName, lastName) {
        await pool.query("UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3", [firstName, lastName, userId]);
    },

    async validateUserEmail(userId) {
        await pool.query("UPDATE users SET email_validated = true, last_validated_at = NOW() WHERE id = $1", [userId]);
    },

    async updateUserLanguage(userId, language) {
        await pool.query("UPDATE users SET preferred_language = $1 WHERE id = $2", [language, userId]);
    },

    // --- Company Methods ---
    async createCompany(name) {
        const result = await pool.query("INSERT INTO companies (name) VALUES ($1) RETURNING *", [name]);
        return result.rows[0];
    },

    async getCompanyById(companyId) {
        const result = await pool.query("SELECT * FROM companies WHERE id = $1", [companyId]);
        return result.rows[0];
    },

    // --- Membership Methods (Simplified) ---
    async createMembership(userId, companyId, role, categoryId = null) {
        const result = await pool.query(
            "INSERT INTO company_memberships (user_id, company_id, role, category_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [userId, companyId, role, categoryId]
        );
        return result.rows[0];
    },

    async getMembershipsByUserId(userId) {
        const result = await pool.query(
            `SELECT
                cm.id as membership_id,
                cm.role,
                c.id as company_id,
                c.name as company_name
             FROM company_memberships cm
             JOIN companies c ON cm.company_id = c.id
             WHERE cm.user_id = $1`,
            [userId]
        );
        return result.rows;
    },
    
    async getMembershipById(membershipId) {
        const result = await pool.query("SELECT * FROM company_memberships WHERE id = $1", [membershipId]);
        return result.rows[0];
    },

    async deleteMembership(membershipId) {
        await pool.query("DELETE FROM company_memberships WHERE id = $1", [membershipId]);
    },

    async updateMembership(membershipId, categoryId) {
        await pool.query("UPDATE company_memberships SET category_id = $1 WHERE id = $2", [categoryId, membershipId]);
    },

    async getCompanyEmployees(companyId) {
        const result = await pool.query(
            `SELECT
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                u.created_at,
                cm.id as membership_id,
                cm.role,
                cm.category_id
             FROM users u
             JOIN company_memberships cm ON u.id = cm.user_id
             WHERE cm.company_id = $1 AND cm.role != 'manager'
             ORDER BY u.email`,
            [companyId]
        );
        return result.rows;
    },

    // --- Category Methods have been removed from this service ---

    // --- Token/OTP Methods (no change, they are user-centric) ---
    async createPasswordResetToken(userId) {
        const token = uuidv4();
        const expires_at = new Date(Date.now() + 3600000); // 1 hour from now
        await pool.query(
            "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
            [userId, token, expires_at]
        );
        return token;
    },

    async findPasswordResetToken(token) {
        const result = await pool.query(
            "SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()",
            [token]
        );
        return result.rows[0];
    },

    async deletePasswordResetToken(token) {
        await pool.query("DELETE FROM password_reset_tokens WHERE token = $1", [token]);
    },

    async createPasswordSetupToken(userId) {
        const token = uuidv4();
        const expires_at = new Date(Date.now() + 24 * 3600000); // 24 hours from now
        await pool.query(
            "INSERT INTO password_setup_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
            [userId, token, expires_at]
        );
        return token;
    },

    async findPasswordSetupToken(token) {
        const result = await pool.query(
            "SELECT * FROM password_setup_tokens WHERE token = $1 AND expires_at > NOW()",
            [token]
        );
        return result.rows[0];
    },

    async deletePasswordSetupToken(token) {
        await pool.query("DELETE FROM password_setup_tokens WHERE token = $1", [token]);
    },

    async createEmailVerificationOtp(userId) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires_at = new Date(Date.now() + 600000); // 10 minutes from now
        await pool.query(
            "INSERT INTO email_verification_otps (user_id, otp, expires_at) VALUES ($1, $2, $3)",
            [userId, otp, expires_at]
        );
        return otp;
    },

    async findEmailVerificationOtp(userId, otp) {
        const result = await pool.query(
            "SELECT * FROM email_verification_otps WHERE user_id = $1 AND otp = $2 AND expires_at > NOW()",
            [userId, otp]
        );
        return result.rows[0];
    },

    async deleteEmailVerificationOtp(userId, otp) {
        await pool.query("DELETE FROM email_verification_otps WHERE user_id = $1 AND otp = $2", [userId, otp]);
    },

    async createPasswordResetOtp(userId) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires_at = new Date(Date.now() + 600000); // 10 minutes from now
        await pool.query(
            "INSERT INTO password_reset_otps (user_id, otp, expires_at) VALUES ($1, $2, $3)",
            [userId, otp, expires_at]
        );
        return otp;
    },

    async findPasswordResetOtp(userId, otp) {
        const result = await pool.query(
            "SELECT * FROM password_reset_otps WHERE user_id = $1 AND otp = $2 AND expires_at > NOW()",
            [userId, otp]
        );
        return result.rows[0];
    },

    async deletePasswordResetOtp(userId, otp = null) {
        if (otp) {
            await pool.query("DELETE FROM password_reset_otps WHERE user_id = $1 AND otp = $2", [userId, otp]);
        } else {
            await pool.query("DELETE FROM password_reset_otps WHERE user_id = $1", [userId]);
        }
    },

    async createInvitationCode(userId) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires_at = new Date(Date.now() + 24 * 3600000); // 24 hours from now
        await pool.query(
            "INSERT INTO invitation_codes (user_id, code, expires_at) VALUES ($1, $2, $3) RETURNING *",
            [userId, code, expires_at]
        );
        return code;
    },

    async findInvitationCode(userId, code) {
        const result = await pool.query(
            "SELECT * FROM invitation_codes WHERE user_id = $1 AND code = $2 AND expires_at > NOW()",
            [userId, code]
        );
        return result.rows[0];
    },

    async deleteInvitationCode(userId, code) {
        await pool.query("DELETE FROM invitation_codes WHERE user_id = $1 AND code = $2", [userId, code]);
    },
     async findInvitationByToken(token) {
                const result = await pool.query(
                    "SELECT * FROM invitation_codes WHERE code = $1 AND expires_at > NOW()",
                    [token]
                );
                return result.rows[0];
           },

      async deleteInvitation(tokenOrUserId) {
                // Supprime par token si c'est un code d'invitation (VARCHAR(6)), sinon par userId (UUID)
                if (tokenOrUserId && tokenOrUserId.length === 6) { // Assuming invitation code is 6 chars
                    await pool.query("DELETE FROM invitation_codes WHERE code = $1", [tokenOrUserId]);
                } else {
                    await pool.query("DELETE FROM invitation_codes WHERE user_id = $1", [tokenOrUserId]);
                }
            },
};

module.exports = { AuthModel, pool };
