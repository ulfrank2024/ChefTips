const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const UserModel = {
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
};

module.exports = { UserModel };
