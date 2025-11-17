require('dotenv').config();
const pool = require('./db');
const { CompanyModel } = require('./models/companyModel');
const { MembershipModel } = require('./models/membershipModel');

const createAdminCompany = async () => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminRole = 'manager'; // Role within the company for the admin user

    if (!adminEmail) {
        console.error('ADMIN_EMAIL must be set in .env file');
        return;
    }

    try {
        // 1. Find the admin user
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
        const adminUser = userResult.rows[0];

        if (!adminUser) {
            console.error(`Admin user with email ${adminEmail} not found.`);
            return;
        }

        // 2. Check if the admin user already has a company membership
        const memberships = await MembershipModel.getMembershipsByUserId(adminUser.id);
        if (memberships.length > 0) {
            console.log(`Admin user ${adminEmail} already has a company membership. Skipping company creation.`);
            return;
        }

        // 3. Create a new company
        const companyName = "Admin's Company"; // You can change this name
        const newCompany = await CompanyModel.createCompany(companyName);
        console.log('New company created:', newCompany);

        // 4. Create a membership for the admin user in the new company
        const newMembership = await MembershipModel.createMembership(adminUser.id, newCompany.id, adminRole, true);
        console.log('Admin user membership created:', newMembership);

    } catch (error) {
        console.error('Error creating admin company and membership:', error);
    } finally {
        await pool.end(); // Close the database connection
    }
};

createAdminCompany();
