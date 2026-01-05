const { CompanyModel } = require('../models/companyModel');

const suspendCompany = async (req, res) => {
    const { companyId } = req.params;
    if (!companyId) {
        return res.status(400).json({ error: "COMPANY_ID_REQUIRED" });
    }

    try {
        const company = await CompanyModel.updateCompanyStatus(companyId, false);
        if (!company) {
            return res.status(404).json({ error: "COMPANY_NOT_FOUND" });
        }
        res.status(200).json({ message: "Company suspended successfully", company });
    } catch (error) {
        console.error('Error suspending company:', error);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const reactivateCompany = async (req, res) => {
    const { companyId } = req.params;
    if (!companyId) {
        return res.status(400).json({ error: "COMPANY_ID_REQUIRED" });
    }

    try {
        const company = await CompanyModel.updateCompanyStatus(companyId, true);
        if (!company) {
            return res.status(404).json({ error: "COMPANY_NOT_FOUND" });
        }
        res.status(200).json({ message: "Company reactivated successfully", company });
    } catch (error) {
        console.error('Error reactivating company:', error);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getAllCompanies = async (req, res) => {
    try {
        const companies = await CompanyModel.getAllCompanies();
        res.status(200).json(companies);
    } catch (error) {
        console.error('Error fetching all companies:', error);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getCompanyById = async (req, res) => {
    const { id } = req.params;
    try {
        const company = await CompanyModel.getCompanyById(id);
        if (!company) {
            return res.status(404).json({ error: "COMPANY_NOT_FOUND" });
        }
        res.status(200).json(company);
    } catch (error) {
        console.error('Error fetching company by ID:', error);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

module.exports = {
    suspendCompany,
    reactivateCompany,
    getAllCompanies,
    getCompanyById,
};
