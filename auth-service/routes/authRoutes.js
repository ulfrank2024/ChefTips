const express = require('express');
const router = express.Router();
const { signup, login, selectCompany, inviteEmployee, removeEmployee, getCompanyEmployees, verifyOtp, resendOtp, updateLanguagePreference, changePassword, updateProfile, updateMembership, verifyInvitation, setupPassword } = require('../controllers/authController');
const { authenticateToken } = require("../middleware/authMiddleware");

// --- User Account Routes ---
// User signs up, creates a company, and becomes its manager
router.post("/signup", signup);
// User logs in. Can return a final token or a list of companies.
router.post("/login", login);
// After login, if user has multiple companies, they select one to get a session token.
router.post("/select-company", selectCompany);

// --- Password and Verification Routes ---
// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password', resetPassword);
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

// --- Manager: Category Management Routes ---
// router.post("/categories", authenticateToken, createCategory);
// router.get("/categories", authenticateToken, getCompanyCategories);
// router.get("/categories/:categoryId", authenticateToken, getCategoryById);
// router.put("/categories/:categoryId", authenticateToken, updateCategory);
// router.delete("/categories/:categoryId", authenticateToken, deleteCategory);
// // Manager updates an employee's category within their company
// router.put("/memberships/:membershipId/category", authenticateToken, updateUserCategory);


// --- Inter-service Communication Routes ---
// Used by other services to get user details
// router.get('/users/:userId/details', authenticateToken, getUserDetails);


module.exports = router;