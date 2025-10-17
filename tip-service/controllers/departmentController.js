const { DepartmentModel } = require("../models/departmentModel");

const createDepartment = async (req, res) => {
    const { company_id, role } = req.user;
    if (role !== 'manager') return res.status(403).json({ error: "UNAUTHORIZED" });

    const { name, department_type, distribution } = req.body;
    if (!name || !department_type) return res.status(400).json({ error: "DEPARTMENT_NAME_AND_TYPE_REQUIRED" });

    if (department_type === 'RECEIVER' && distribution && Object.keys(distribution).length > 0) {
        const totalPercentage = Object.values(distribution).reduce((sum, percent) => sum + percent, 0);
        if (totalPercentage !== 100) {
            return res.status(400).json({ error: "DISTRIBUTION_MUST_EQUAL_100" });
        }
    }

    try {
        const newDepartment = await TipModel.createDepartment(company_id, name, department_type, JSON.stringify(distribution || {}));
        res.status(201).json(newDepartment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getDepartments = async (req, res) => {
    const { company_id } = req.user;
    try {
        const departments = await TipModel.getDepartmentsByCompany(company_id);
        res.status(200).json(departments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const updateDepartment = async (req, res) => {
    const { company_id, role } = req.user;
    if (role !== 'manager') return res.status(403).json({ error: "UNAUTHORIZED" });

    const { departmentId } = req.params;
    const { name, department_type, distribution } = req.body;
    if (!name || !department_type) return res.status(400).json({ error: "DEPARTMENT_NAME_AND_TYPE_REQUIRED" });

    if (department_type === 'RECEIVER') {
        const totalPercentage = Object.values(distribution).reduce((sum, percent) => sum + percent, 0);
        if (totalPercentage !== 100) {
            return res.status(400).json({ error: "DISTRIBUTION_MUST_EQUAL_100" });
        }
    }

    try {
        const updatedDepartment = await TipModel.updateDepartment(departmentId, company_id, name, department_type, JSON.stringify(distribution));
        res.status(200).json(updatedDepartment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const deleteDepartment = async (req, res) => {
    const { company_id, role } = req.user;
    if (role !== 'manager') return res.status(403).json({ error: "UNAUTHORIZED" });

    const { departmentId } = req.params;
    try {
        await TipModel.deleteDepartment(departmentId, company_id);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

module.exports = {
    createDepartment,
    getDepartments,
    updateDepartment,
    deleteDepartment,
};