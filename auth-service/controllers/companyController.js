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
    getCompanyDepartments,
    suspendCompany,
    reactivateCompany,
    getAllCompanies,
    getCompanyById,
};
