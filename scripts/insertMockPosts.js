// 设置时区为UTC+8
process.env.TZ = 'Asia/Shanghai';

const mysql = require('mysql2/promise');

const insertMockPosts = async () => {
  let connection;
  
  try {
    // 连接到数据库
    connection = await mysql.createConnection({
      host: 'prod-db-mysql.ns-z580ek8h.svc',
      port: 3306,
      user: 'root',
      password: 'ddqwh95j',
      database: 'social_platform',
      timezone: '+08:00'
    });
    
    console.log('连接到数据库成功');
    
    // 先查询所有subcategory的ID映射
    const [subcategories] = await connection.execute(`
      SELECT id, category_id, name 
      FROM post_subcategories 
      WHERE status = 'active'
      ORDER BY category_id, sort_order
    `);
    
    // 创建映射表：category_id -> name -> subcategory_id
    const subcategoryMap = {};
    subcategories.forEach(sub => {
      if (!subcategoryMap[sub.category_id]) {
        subcategoryMap[sub.category_id] = {};
      }
      subcategoryMap[sub.category_id][sub.name] = sub.id;
    });
    
    console.log('子分类映射表:', JSON.stringify(subcategoryMap, null, 2));
    
    // 检查用户是否存在
    const [users] = await connection.execute(
      'SELECT id, nickname, gender FROM users WHERE id = ?',
      [5]
    );
    
    if (users.length === 0) {
      console.error('错误: 用户ID 5 不存在，请先创建该用户');
      process.exit(1);
    }
    
    const user = users[0];
    const authorNickname = '搞一下';
    const authorGender = user.gender || 'male';
    
    console.log(`使用用户信息: ID=${user.id}, 昵称=${user.nickname}, 性别=${authorGender}`);
    console.log(`帖子作者昵称: ${authorNickname}`);
    
    // 定义mock数据
    const mockPosts = [
      // 干饭搭子分类 (category_id = 1)
      { category: 1, subcategory: '火锅', content: '周末想吃火锅，有没有一起的小伙伴？', location: '北京市朝阳区' },
      { category: 1, subcategory: '烧烤', content: '寻找烧烤搭子，晚上一起撸串！', location: '上海市浦东新区' },
      { category: 1, subcategory: '炒菜', content: '想吃川菜，有一起的吗？', location: '广州市天河区' },
      { category: 1, subcategory: '面条', content: '寻找拉面搭子，一起去吃日式拉面！', location: '深圳市南山区' },
      { category: 1, subcategory: '韩式', content: '想吃韩式烤肉，有一起的吗？', location: '杭州市西湖区' },
      { category: 1, subcategory: '海鲜', content: '寻找海鲜搭子，一起去吃海鲜大餐！', location: '成都市锦江区' },
      { category: 1, subcategory: '日料', content: '想吃日料，有一起的小伙伴吗？', location: '武汉市江汉区' },
      { category: 1, subcategory: '西餐', content: '寻找西餐搭子，一起去吃牛排！', location: '西安市雁塔区' },
      { category: 1, subcategory: '烤肉', content: '想吃烤肉，有一起的吗？', location: '南京市鼓楼区' },
      { category: 1, subcategory: '其他', content: '寻找美食搭子，一起探索好吃的！', location: '重庆市渝中区' },
      
      // 运动搭子分类 (category_id = 2)
      { category: 2, subcategory: '羽毛球', content: '寻找羽毛球搭子，周末一起打球！', location: '北京市海淀区' },
      { category: 2, subcategory: '篮球', content: '想打篮球，有一起的吗？', location: '上海市徐汇区' },
      { category: 2, subcategory: '乒乓球', content: '寻找乒乓球搭子，一起切磋！', location: '广州市越秀区' },
      { category: 2, subcategory: '跑步', content: '想晨跑，有一起的小伙伴吗？', location: '深圳市福田区' },
      { category: 2, subcategory: '游泳', content: '寻找游泳搭子，一起去游泳馆！', location: '杭州市上城区' },
      { category: 2, subcategory: '健身', content: '想健身，有一起的吗？', location: '成都市武侯区' },
      { category: 2, subcategory: '骑行', content: '寻找骑行搭子，周末一起骑行！', location: '武汉市武昌区' },
      { category: 2, subcategory: '其他', content: '想运动，有一起的小伙伴吗？', location: '西安市碑林区' },
      { category: 2, subcategory: '羽毛球', content: '寻找运动搭子，一起保持健康！', location: '南京市建邺区' },
      { category: 2, subcategory: '羽毛球', content: '想打羽毛球，有一起的吗？', location: '重庆市江北区' },
      
      // 学习搭子分类 (category_id = 3)
      { category: 3, subcategory: '编程', content: '寻找编程学习搭子，一起刷题！', location: '北京市西城区' },
      { category: 3, subcategory: '英文', content: '想学英文，有一起的小伙伴吗？', location: '上海市黄浦区' },
      { category: 3, subcategory: '数学', content: '寻找数学学习搭子，一起讨论题目！', location: '广州市荔湾区' },
      { category: 3, subcategory: '物理', content: '想学物理，有一起的吗？', location: '深圳市宝安区' },
      { category: 3, subcategory: '金融', content: '寻找金融学习搭子，一起学习投资！', location: '杭州市拱墅区' },
      { category: 3, subcategory: '创业', content: '想学创业，有一起的小伙伴吗？', location: '成都市青羊区' },
      { category: 3, subcategory: '其他', content: '寻找学习搭子，一起进步！', location: '武汉市洪山区' },
      { category: 3, subcategory: '编程', content: '想学编程，有一起的吗？', location: '西安市新城区' },
      { category: 3, subcategory: '英文', content: '寻找英文学习搭子，一起练习口语！', location: '南京市玄武区' },
      { category: 3, subcategory: '数学', content: '想学习，有一起的小伙伴吗？', location: '重庆市南岸区' },
      
      // 游戏搭子分类 (category_id = 4)
      { category: 4, subcategory: '王者荣耀', content: '寻找王者荣耀搭子，一起上分！', location: '北京市东城区' },
      { category: 4, subcategory: '和平精英', content: '想玩和平精英，有一起的吗？', location: '上海市静安区' },
      { category: 4, subcategory: 'LOL', content: '寻找LOL搭子，一起开黑！', location: '广州市海珠区' },
      { category: 4, subcategory: '元神', content: '想玩原神，有一起的小伙伴吗？', location: '深圳市龙岗区' },
      { category: 4, subcategory: '金铲铲', content: '寻找金铲铲搭子，一起下棋！', location: '杭州市余杭区' },
      { category: 4, subcategory: '其他', content: '想玩游戏，有一起的吗？', location: '成都市成华区' },
      { category: 4, subcategory: '王者荣耀', content: '寻找游戏搭子，一起娱乐！', location: '武汉市江岸区' },
      { category: 4, subcategory: '王者荣耀', content: '想玩王者，有一起的小伙伴吗？', location: '西安市莲湖区' },
      { category: 4, subcategory: '和平精英', content: '寻找和平精英搭子，一起吃鸡！', location: '南京市秦淮区' },
      { category: 4, subcategory: 'LOL', content: '想开黑，有一起的吗？', location: '重庆市沙坪坝区' },
      
      // 旅行搭子分类 (category_id = 5)
      { category: 5, subcategory: '国内游', content: '寻找国内游搭子，一起去旅行！', location: '北京市丰台区' },
      { category: 5, subcategory: '出国游', content: '想出国游，有一起的小伙伴吗？', location: '上海市长宁区' },
      { category: 5, subcategory: '周末游', content: '寻找周末游搭子，一起放松！', location: '广州市白云区' },
      { category: 5, subcategory: '自驾游', content: '想自驾游，有一起的吗？', location: '深圳市龙华区' },
      { category: 5, subcategory: '徒步', content: '寻找徒步搭子，一起去爬山！', location: '杭州市滨江区' },
      { category: 5, subcategory: '摄影', content: '想摄影，有一起的小伙伴吗？', location: '成都市金牛区' },
      { category: 5, subcategory: '露营', content: '寻找露营搭子，一起去露营！', location: '武汉市汉阳区' },
      { category: 5, subcategory: '其他', content: '想旅行，有一起的吗？', location: '西安市未央区' },
      { category: 5, subcategory: '国内游', content: '寻找旅行搭子，一起探索世界！', location: '南京市雨花台区' },
      { category: 5, subcategory: '周末游', content: '想出去玩，有一起的小伙伴吗？', location: '重庆市九龙坡区' }
    ];
    
    console.log(`准备插入 ${mockPosts.length} 条帖子数据...`);
    
    // 插入数据
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < mockPosts.length; i++) {
      const post = mockPosts[i];
      const subcategoryId = subcategoryMap[post.category]?.[post.subcategory];
      
      if (!subcategoryId) {
        console.error(`错误: 找不到子分类 category_id=${post.category}, name=${post.subcategory}`);
        failCount++;
        continue;
      }
      
      const daysAgo = i + 1;
      const createdAt = `DATE_SUB(NOW(), INTERVAL ${daysAgo} DAY)`;
      
      try {
        await connection.execute(
          `INSERT INTO posts (user_id, author_nickname, author_gender, content, location, category_id, subcategory_id, comment_visibility, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'public', ${createdAt})`,
          [5, authorNickname, authorGender, post.content, post.location, post.category, subcategoryId]
        );
        successCount++;
      } catch (err) {
        console.error(`插入第 ${i + 1} 条数据失败:`, err.message);
        failCount++;
      }
    }
    
    console.log('\n插入完成！');
    console.log(`成功: ${successCount} 条`);
    console.log(`失败: ${failCount} 条`);
    
  } catch (error) {
    console.error('执行失败:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

insertMockPosts();
