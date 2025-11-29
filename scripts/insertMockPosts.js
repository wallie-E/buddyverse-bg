// 设置时区为UTC+8
process.env.TZ = 'Asia/Shanghai';

const { pool } = require('../config/database');

// Mock内容模板
const mockContents = [
  '今天天气真好，想找个搭子一起出去走走！',
  '有没有人想一起看电影的？最近有几部不错的片子',
  '周末想找个地方放松一下，有推荐的吗？',
  '想找个学习伙伴，一起互相监督进步',
  '有没有喜欢打篮球的朋友？周末可以约一场',
  '想找个一起健身的伙伴，互相鼓励',
  '最近在学编程，想找个小伙伴一起讨论',
  '有没有人想一起学英语的？可以互相练习口语',
  '想找个游戏搭子，一起上分！',
  '周末想找个地方吃饭，有推荐的吗？',
  '有没有喜欢跑步的朋友？可以一起晨跑',
  '想找个一起旅行的伙伴，计划下个月出发',
  '有没有人想一起学做菜的？可以互相交流',
  '想找个一起看书的伙伴，可以互相分享心得',
  '有没有喜欢摄影的朋友？可以一起出去拍照',
  '想找个一起运动的伙伴，互相督促',
  '有没有人想一起学乐器的？可以互相交流',
  '想找个一起逛街的伙伴，周末可以约',
  '有没有喜欢唱歌的朋友？可以一起去KTV',
  '想找个一起学习的伙伴，互相监督',
  '有没有人想一起做项目的？可以合作',
  '想找个一起看电影的伙伴，可以互相推荐',
  '有没有喜欢打游戏的朋友？可以一起组队',
  '想找个一起吃饭的伙伴，可以尝试新餐厅',
  '有没有人想一起运动的？可以互相鼓励',
  '想找个一起学习的伙伴，可以互相帮助',
  '有没有喜欢旅行的朋友？可以一起规划',
  '想找个一起健身的伙伴，可以互相督促',
  '有没有人想一起学新技能的？可以互相交流',
  '想找个一起放松的伙伴，可以一起聊天',
  '有没有喜欢阅读的朋友？可以互相推荐书籍',
  '想找个一起做运动的伙伴，可以互相鼓励',
  '有没有人想一起学语言的？可以互相练习',
  '想找个一起看电影的伙伴，可以一起讨论',
  '有没有喜欢音乐的朋友？可以一起分享',
  '想找个一起学习的伙伴，可以互相监督',
  '有没有人想一起做运动的？可以互相督促',
  '想找个一起吃饭的伙伴，可以尝试新口味',
  '有没有喜欢旅行的朋友？可以一起探索',
  '想找个一起学习的伙伴，可以互相进步',
  '有没有人想一起做项目的？可以一起合作',
  '想找个一起运动的伙伴，可以互相鼓励',
  '有没有喜欢游戏的朋友？可以一起组队',
  '想找个一起学习的伙伴，可以互相帮助',
  '有没有人想一起放松的？可以一起聊天',
  '想找个一起健身的伙伴，可以互相督促',
  '有没有喜欢阅读的朋友？可以互相分享',
  '想找个一起做运动的伙伴，可以互相鼓励',
  '有没有人想一起学新东西的？可以互相交流',
  '想找个一起吃饭的伙伴，可以一起探索美食'
];

// Mock地点
const mockLocations = [
  '北京市朝阳区',
  '上海市浦东新区',
  '广州市天河区',
  '深圳市南山区',
  '杭州市西湖区',
  '成都市锦江区',
  '西安市雁塔区',
  '南京市鼓楼区',
  '武汉市江汉区',
  '重庆市渝中区',
  null, // 有些帖子可能没有地点
  null,
  null
];

/**
 * 插入50条mock帖子数据
 */
const insertMockPosts = async () => {
  try {
    console.log('开始插入mock帖子数据...\n');

    // 1. 获取所有活跃用户ID
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE status = "active" ORDER BY id'
    );

    if (users.length === 0) {
      console.error('错误: 数据库中没有活跃用户，请先创建用户');
      return;
    }

    console.log(`找到 ${users.length} 个活跃用户`);

    // 2. 获取所有活跃分类及其子分类
    const [categories] = await pool.execute(
      'SELECT id FROM post_categories WHERE status = "active" ORDER BY id'
    );

    if (categories.length === 0) {
      console.error('错误: 数据库中没有活跃分类，请先初始化分类数据');
      return;
    }

    console.log(`找到 ${categories.length} 个活跃分类`);

    // 获取每个分类的子分类
    const categorySubcategoriesMap = {};
    for (const category of categories) {
      const [subcategories] = await pool.execute(
        'SELECT id FROM post_subcategories WHERE category_id = ? AND status = "active" ORDER BY id',
        [category.id]
      );
      categorySubcategoriesMap[category.id] = subcategories.map(s => s.id);
    }

    // 检查是否有子分类
    const allSubcategories = Object.values(categorySubcategoriesMap).flat();
    if (allSubcategories.length === 0) {
      console.error('错误: 数据库中没有活跃的子分类，请先初始化子分类数据');
      return;
    }

    console.log(`找到 ${allSubcategories.length} 个活跃子分类\n`);

    // 3. 生成并插入50条mock数据
    const postsToInsert = [];
    const commentVisibilityOptions = ['public', 'private'];

    for (let i = 0; i < 50; i++) {
      // 随机选择用户
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      // 随机选择分类
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      // 从该分类的子分类中随机选择一个
      const subcategories = categorySubcategoriesMap[randomCategory.id];
      const randomSubcategory = subcategories[Math.floor(Math.random() * subcategories.length)];
      
      // 随机选择内容
      const content = mockContents[Math.floor(Math.random() * mockContents.length)];
      
      // 随机选择地点（70%概率有地点，30%概率为null）
      const location = Math.random() < 0.7 
        ? mockLocations[Math.floor(Math.random() * mockLocations.length)]
        : null;
      
      // 随机选择评论可见性（80%为public，20%为private）
      const commentVisibility = Math.random() < 0.8 ? 'public' : 'private';

      postsToInsert.push({
        user_id: randomUser.id,
        content: content,
        location: location,
        category_id: randomCategory.id,
        subcategory_id: randomSubcategory,
        comment_visibility: commentVisibility
      });
    }

    // 4. 批量插入数据
    console.log('开始批量插入数据...');
    let successCount = 0;
    let failCount = 0;

    for (const post of postsToInsert) {
      try {
        await pool.execute(
          'INSERT INTO posts (user_id, content, location, category_id, subcategory_id, comment_visibility) VALUES (?, ?, ?, ?, ?, ?)',
          [post.user_id, post.content, post.location, post.category_id, post.subcategory_id, post.comment_visibility]
        );
        successCount++;
      } catch (error) {
        console.error(`插入失败 (用户ID: ${post.user_id}, 内容: ${post.content.substring(0, 20)}...):`, error.message);
        failCount++;
      }
    }

    console.log('\n插入完成！');
    console.log(`成功: ${successCount} 条`);
    console.log(`失败: ${failCount} 条`);
    console.log(`总计: ${postsToInsert.length} 条`);

  } catch (error) {
    console.error('插入mock数据失败:', error);
    throw error;
  } finally {
    // 关闭连接池（脚本执行完成后不再需要连接）
    await pool.end();
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  insertMockPosts()
    .then(() => {
      console.log('\n脚本执行完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = insertMockPosts;

