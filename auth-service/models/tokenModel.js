const pool = require('../db');
const { v4: uuidv4 } = require("uuid");

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
        const expires_at = new Date(Date.now() + 7 * 24 * 3600000); // 7 days from now
        await pool.query(
            "INSERT INTO password_setup_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
            [userId, token, expires_at]
        );
        return token;
    },

    async findPasswordSetupToken(token) {
        console.log('[TokenModel.findPasswordSetupToken] Looking for token:', token);
        const query = "SELECT * FROM password_setup_tokens WHERE token = $1 AND expires_at > NOW()";
        console.log('[TokenModel.findPasswordSetupToken] Query:', query, 'with params:', [token]);
        const result = await pool.query(query, [token]);
        console.log('[TokenModel.findPasswordSetupToken] Query result:', result.rows[0]);
        if (result.rows[0]) {
            // Fetch current time from DB to compare, to check for clock skew issues
            const dbTimeResult = await pool.query("SELECT NOW()");
            const dbNow = dbTimeResult.rows[0].now;
            console.log('[TokenModel.findPasswordSetupToken] Token expires_at:', result.rows[0].expires_at);
            console.log('[TokenModel.findPasswordSetupToken] DB NOW():', dbNow);
            console.log('[TokenModel.findPasswordSetupToken] Is expires_at > NOW()?:', result.rows[0].expires_at > dbNow);
        }
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
