require('dotenv').config();
const pool = require('./db');
const { CompanyModel } = require('./models/companyModel');
const { MembershipModel } = require('./models/membershipModel');

const createAdminCompany = async () => {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminRole = 'admin'; // Role for the admin user in the users table and company membership

    console.log('DATABASE_URL used by script:', process.env.DATABASE_URL); // Added for debugging

    if (!adminEmail) {
        console.error('ADMIN_EMAIL must be set in .env file');
        return;
    }

    try {
        // 1. Find the admin user
        const userResult = await pool.query('SELECT id, role FROM users WHERE email = $1', [adminEmail]);
        let adminUser = userResult.rows[0];

        if (!adminUser) {
            console.error(`Admin user with email ${adminEmail} not found. Please create the user first.`);
            return;
        }

        // 2. Update the user's role to 'admin' if it's not already
        if (adminUser.role !== adminRole) {
            await pool.query('UPDATE users SET role = $1 WHERE id = $2', [adminRole, adminUser.id]);
            console.log(`User ${adminEmail} role updated to '${adminRole}'.`);
            adminUser.role = adminRole; // Update the local object
        }

        // 3. Check if the admin user already has a company membership with the adminRole
        const memberships = await MembershipModel.getMembershipsByUserId(adminUser.id);
        const existingAdminMembership = memberships.find(m => m.role === adminRole);

        if (existingAdminMembership) {
            console.log(`Admin user ${adminEmail} already has an '${adminRole}' company membership. Skipping company creation.`);
            return;
        }

        // 4. Create a new company
        const companyName = "Admin's Company"; // You can change this name
        const newCompany = await CompanyModel.createCompany(companyName);
        console.log('New company created:', newCompany);

        // 5. Create a membership for the admin user in the new company with the adminRole
        const newMembership = await MembershipModel.createMembership(adminUser.id, newCompany.id, adminRole, true);
        console.log(`Admin user '${adminRole}' membership created:`, newMembership);

    } catch (error) {
        console.error('Error creating admin company and membership:', error);
    } finally {
        // Do not close the pool here if it's shared across the application
        // pool.end(); 
    }
};

createAdminCompany();
