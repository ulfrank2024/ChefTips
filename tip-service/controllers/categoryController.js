const { CategoryModel } = require("../models/categoryModel");

const createCategory = async (req, res) => {
    const { company_id, role } = req.user;
    if (role !== 'manager') return res.status(403).json({ error: "UNAUTHORIZED" });

    const { department_id, name, is_dual_role = false } = req.body;
    if (!department_id || !name) return res.status(400).json({ error: "FIELDS_REQUIRED" });

    try {
        const newCategory = await TipModel.createCategory(company_id, department_id, name, is_dual_role);
        res.status(201).json(newCategory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getCategories = async (req, res) => {
    const { company_id } = req.user;
    try {
        const categories = await TipModel.getCategoriesByCompany(company_id);
        res.status(200).json(categories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const updateCategory = async (req, res) => {
    const { company_id, role } = req.user;
    if (role !== 'manager') return res.status(403).json({ error: "UNAUTHORIZED" });

    const { categoryId } = req.params;
    try {
        const updatedCategory = await TipModel.updateCategory(categoryId, req.body);
        res.status(200).json(updatedCategory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const deleteCategory = async (req, res) => {
    const { company_id, role } = req.user;
    if (role !== 'manager') return res.status(403).json({ error: "UNAUTHORIZED" });

    const { categoryId } = req.params;
    try {
        await TipModel.deleteCategory(categoryId);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
};