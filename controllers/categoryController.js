const { pool } = require('../config/database');
const { success, error } = require('../utils/response');

/**
 * 获取所有分类及其细分类型
 */
const getCategories = async (req, res) => {
  try {
    // 获取主分类
    const [categories] = await pool.execute(`
      SELECT id, name, description, sort_order
      FROM post_categories 
      WHERE status = "active"
      ORDER BY sort_order ASC, id ASC
    `);

    // 为每个分类获取细分类型
    for (let category of categories) {
      const [subcategories] = await pool.execute(`
        SELECT id, name, description, sort_order
        FROM post_subcategories 
        WHERE category_id = ? AND status = "active"
        ORDER BY sort_order ASC, id ASC
      `, [category.id]);

      category.subcategories = subcategories;
    }

    return success(res, categories, '获取成功');
  } catch (err) {
    console.error('获取分类失败:', err);
    return error(res, '获取失败', 500);
  }
};

/**
 * 获取指定分类的细分类型
 */
const getSubcategories = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    // 验证分类是否存在
    const [categories] = await pool.execute(
      'SELECT id, name FROM post_categories WHERE id = ? AND status = "active"',
      [categoryId]
    );

    if (categories.length === 0) {
      return error(res, '分类不存在', 404);
    }

    // 获取细分类型
    const [subcategories] = await pool.execute(`
      SELECT id, name, description, sort_order
      FROM post_subcategories 
      WHERE category_id = ? AND status = "active"
      ORDER BY sort_order ASC, id ASC
    `, [categoryId]);

    return success(res, {
      category: categories[0],
      subcategories
    }, '获取成功');
  } catch (err) {
    console.error('获取细分类型失败:', err);
    return error(res, '获取失败', 500);
  }
};

module.exports = {
  getCategories,
  getSubcategories
}; 