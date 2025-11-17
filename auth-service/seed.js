require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./db'); // Assuming db.js exports the query function

const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file');
    return;
  }

  try {
    // Check if user already exists
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    if (rows.length > 0) {
      console.log('Admin user already exists.');
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Insert the new admin user
    // Note: We are not creating a company membership for the admin
    const insertResult = await db.query(
      `INSERT INTO users (first_name, last_name, email, password, email_validated, role) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role`,
      ['Admin', 'User', adminEmail, hashedPassword, true, 'admin']
    );

    if (insertResult.rows.length > 0) {
      console.log('Admin user created successfully:', insertResult.rows[0]);
    } else {
      console.error('Failed to create admin user.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    // In a real script, you might want to end the pool connection
    // For a simple script, we can let it exit.
  }
};

seedAdmin();
