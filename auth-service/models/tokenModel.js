const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const TokenModel = {
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
                if (tokenOrUserId && tokenOrUserId.length === 6) {
                    await pool.query("DELETE FROM invitation_codes WHERE code = $1", [tokenOrUserId]);
                } else {
                    await pool.query("DELETE FROM invitation_codes WHERE user_id = $1", [tokenOrUserId]);
                }
            },
};

module.exports = { TokenModel };
