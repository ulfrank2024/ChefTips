const authenticateAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'FORBIDDEN' });
    }
    next();
};

module.exports = {
    authenticateAdmin,
};
