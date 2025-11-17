const jwt = require('jsonwebtoken');
const { CompanyModel } = require('../models/companyModel'); // Import CompanyModel

const authenticateToken = (req, res, next) => {
    console.log("Auth middleware: received request.");
    const authHeader = req.headers['authorization'];
    console.log("Auth middleware: Authorization header:", authHeader);
    const token = authHeader && authHeader.split(' ')[1];
    console.log("Auth middleware: extracted token:", token);

    if (token == null) {
        console.log("Auth middleware: No token provided. Sending 401.");
        return res.sendStatus(401); // if there isn't any token
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => { // Make callback async
        if (err) {
            console.log("Auth middleware: Token verification failed. Error:", err.message);
            return res.sendStatus(403); // if the token is no longer valid
        }
        console.log("Auth middleware: Token verified. User:", user);
        req.user = user;

        // Check if the user's company is active
        if (user.company_id) {
            try {
                const company = await CompanyModel.getCompanyById(user.company_id);
                if (!company || !company.is_active) {
                    console.log(`Auth middleware: Company ${user.company_id} is not active. Blocking access.`);
                    return res.status(403).json({ error: "COMPANY_INACTIVE", message: "Your company's account is currently inactive. Please contact your manager." });
                }
            } catch (dbError) {
                console.error('Auth middleware: Error checking company status:', dbError);
                return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to verify company status." });
            }
        }
        
        next(); // proceed to the next middleware or route handler
    });
};

module.exports = { authenticateToken };