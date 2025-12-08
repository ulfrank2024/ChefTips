const CategoryModel = require('../models/CategoryModel');

const createCategory = async (req, res) => {
    const { company_id } = req.user;
    const { name, is_tip_distribution_pool = false } = req.body;

    if (!name) {
        return res.status(400).json({ error: "CATEGORY_NAME_REQUIRED" });
    }

    try {
        const category = await CategoryModel.createCategory(company_id, name, is_tip_distribution_pool);
        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ error: "CATEGORY_NAME_ALREADY_EXISTS" });
        }
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const getCategories = async (req, res) => {
    const { company_id } = req.user;

    try {
        const categories = await CategoryModel.getCategoriesByCompany(company_id);
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const updateCategory = async (req, res) => {
    const { categoryId } = req.params;
    const { company_id } = req.user;
    const { name, is_tip_distribution_pool } = req.body;

    if (!name || is_tip_distribution_pool === undefined) {
        return res.status(400).json({ error: "CATEGORY_NAME_AND_POOL_STATUS_REQUIRED" });
    }

    try {
        const category = await CategoryModel.getCategoryById(categoryId);
        if (!category || category.company_id !== company_id) {
            return res.status(404).json({ error: "CATEGORY_NOT_FOUND" });
        }

        const updatedCategory = await CategoryModel.updateCategory(categoryId, name, is_tip_distribution_pool);
        res.status(200).json(updatedCategory);
    } catch (error) {
        console.error('Error updating category:', error);
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ error: "CATEGORY_NAME_ALREADY_EXISTS" });
        }
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

const deleteCategory = async (req, res) => {
    const { categoryId } = req.params;
    const { company_id } = req.user;

    try {
        const category = await CategoryModel.getCategoryById(categoryId);
        if (!category || category.company_id !== company_id) {
            return res.status(404).json({ error: "CATEGORY_NOT_FOUND" });
        }

        await CategoryModel.deleteCategory(categoryId);
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error('Error deleting category:', error);
        // Handle potential foreign key constraint violations if memberships still point to it
        if (error.code === '23503') { 
            return res.status(409).json({ error: "CATEGORY_IN_USE" });
        }
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    }
};

module.exports = {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
};