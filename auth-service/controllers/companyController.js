const { CompanyModel } = require('../models/companyModel');

const getCompanyDepartments = async (req, res) => {
    const { company_id } = req.user;

    if (!company_id) {
        return res.status(400).json({ error: "COMPANY_ID_REQUIRED" });
    }

    try {
        const departments = await CompanyModel.getDepartmentsByCompanyId(company_id);
        res.status(200).json(departments);
    } catch (error) {
        console.error('Error fetching company departments:', error);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

module.exports = {
    getCompanyDepartments,
};
