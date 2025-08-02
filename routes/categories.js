const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// 获取所有分类及其细分类型
router.get('/', categoryController.getCategories);

// 获取指定分类的细分类型
router.get('/:categoryId/subcategories', categoryController.getSubcategories);

module.exports = router; 