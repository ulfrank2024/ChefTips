const express = require('express');
const router = express.Router();
const { signup } = require('../controllers/signupController');
const { login, selectCompany } = require('../controllers/authController');
const { inviteEmployee, removeEmployee, getCompanyEmployees, updateMembership } = require('../controllers/employeeController');
const { verifyOtp, resendOtp, verifyInvitation, setupPassword, forgotPassword, resetPassword } = require('../controllers/verificationController');
const { updateLanguagePreference, changePassword, updateProfile, getUserDetails } = require('../controllers/userController');
const { sendCashOutNotification, sendInternalEmail } = require('../controllers/emailController');
const { getAllCompanies, getCompanyById, suspendCompany, reactivateCompany } = require('../controllers/companyController'); // getCompanyDepartments removed
const { createCategory, getCategories, updateCategory, deleteCategory } = require('../controllers/categoryController'); // New Category Controller
const { authenticateToken } = require("../middleware/authMiddleware");
const { authenticateAdmin } = require('../middleware/adminMiddleware');

// --- Admin Routes ---
router.get("/companies", authenticateToken, authenticateAdmin, getAllCompanies);
router.get("/companies/:id", authenticateToken, authenticateAdmin, getCompanyById);

// --- User Account Routes ---
// User signs up, creates a company, and becomes its manager
router.post("/signup", signup);
// User logs in. Can return a final token or a list of companies.
router.post("/login", login);
// After login, if user has multiple companies, they select one to get a session token.
router.post("/select-company", selectCompany);

// --- Password and Verification Routes ---
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/verify-invitation", verifyInvitation);
router.post("/setup-password", setupPassword);

// --- Authenticated User Routes ---
router.put("/profile/language", authenticateToken, updateLanguagePreference);
// User changes their own password
router.post("/change-password", authenticateToken, changePassword);
// User updates their own profile (name)
router.put("/profile", authenticateToken, updateProfile);

// --- Manager: Employee Management Routes ---
// Manager invites a user to their company
router.post("/invite-employee", authenticateToken, inviteEmployee);
// Manager updates a user's membership (e.g., category)
router.put("/memberships/:membershipId", authenticateToken, updateMembership);
// Manager removes a user from their company (deletes the membership)
router.delete("/memberships/:membershipId", authenticateToken, removeEmployee);
// Manager gets all employees in their company
router.get("/employees", authenticateToken, getCompanyEmployees);
// Manager gets all categories in their company
router.get("/categories", authenticateToken, getCategories); // Changed from /departments
router.post("/categories", authenticateToken, createCategory); // New
router.put("/categories/:categoryId", authenticateToken, updateCategory); // New
router.delete("/categories/:categoryId", authenticateToken, deleteCategory); // New

// --- Inter-service Communication Routes ---
// Used by other services to get user details
router.get('/users/:userId/details', authenticateToken, getUserDetails);
// Used by tip-service to notify user of a cashout
router.post('/notify-cashout', authenticateToken, sendCashOutNotification);
// Used by billing-service to suspend a company
router.post('/internal/companies/:companyId/suspend', suspendCompany);
// Used by billing-service to reactivate a company
router.post('/internal/companies/:companyId/reactivate', reactivateCompany);
// Used by other services to send emails
router.post('/internal/send-email', sendInternalEmail);


module.exports = router;