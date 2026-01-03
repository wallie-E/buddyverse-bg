-- 插入50条帖子mock数据
-- 用户ID: 5, 作者昵称: 搞一下

USE social_platform;

INSERT INTO posts (user_id, author_nickname, author_gender, content, location, category_id, subcategory_id, comment_visibility, created_at) VALUES
-- 干饭搭子分类 (category_id = 1)
(5, '搞一下', 'male', '周末想吃火锅，有没有一起的小伙伴？', '北京市朝阳区', 1, 1, 'public', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5, '搞一下', 'male', '寻找烧烤搭子，晚上一起撸串！', '上海市浦东新区', 1, 2, 'public', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(5, '搞一下', 'male', '想吃川菜，有一起的吗？', '广州市天河区', 1, 3, 'public', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5, '搞一下', 'male', '寻找拉面搭子，一起去吃日式拉面！', '深圳市南山区', 1, 4, 'public', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(5, '搞一下', 'male', '想吃韩式烤肉，有一起的吗？', '杭州市西湖区', 1, 9, 'public', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(5, '搞一下', 'male', '寻找海鲜搭子，一起去吃海鲜大餐！', '成都市锦江区', 1, 7, 'public', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(5, '搞一下', 'male', '想吃日料，有一起的小伙伴吗？', '武汉市江汉区', 1, 8, 'public', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(5, '搞一下', 'male', '寻找西餐搭子，一起去吃牛排！', '西安市雁塔区', 1, 6, 'public', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(5, '搞一下', 'male', '想吃烤肉，有一起的吗？', '南京市鼓楼区', 1, 5, 'public', DATE_SUB(NOW(), INTERVAL 9 DAY)),
(5, '搞一下', 'male', '寻找美食搭子，一起探索好吃的！', '重庆市渝中区', 1, 99, 'public', DATE_SUB(NOW(), INTERVAL 10 DAY)),

-- 运动搭子分类 (category_id = 2)
(5, '搞一下', 'male', '寻找羽毛球搭子，周末一起打球！', '北京市海淀区', 2, 1, 'public', DATE_SUB(NOW(), INTERVAL 11 DAY)),
(5, '搞一下', 'male', '想打篮球，有一起的吗？', '上海市徐汇区', 2, 2, 'public', DATE_SUB(NOW(), INTERVAL 12 DAY)),
(5, '搞一下', 'male', '寻找乒乓球搭子，一起切磋！', '广州市越秀区', 2, 3, 'public', DATE_SUB(NOW(), INTERVAL 13 DAY)),
(5, '搞一下', 'male', '想晨跑，有一起的小伙伴吗？', '深圳市福田区', 2, 4, 'public', DATE_SUB(NOW(), INTERVAL 14 DAY)),
(5, '搞一下', 'male', '寻找游泳搭子，一起去游泳馆！', '杭州市上城区', 2, 5, 'public', DATE_SUB(NOW(), INTERVAL 15 DAY)),
(5, '搞一下', 'male', '想健身，有一起的吗？', '成都市武侯区', 2, 6, 'public', DATE_SUB(NOW(), INTERVAL 16 DAY)),
(5, '搞一下', 'male', '寻找骑行搭子，周末一起骑行！', '武汉市武昌区', 2, 7, 'public', DATE_SUB(NOW(), INTERVAL 17 DAY)),
(5, '搞一下', 'male', '想运动，有一起的小伙伴吗？', '西安市碑林区', 2, 99, 'public', DATE_SUB(NOW(), INTERVAL 18 DAY)),
(5, '搞一下', 'male', '寻找运动搭子，一起保持健康！', '南京市建邺区', 2, 1, 'public', DATE_SUB(NOW(), INTERVAL 19 DAY)),
(5, '搞一下', 'male', '想打羽毛球，有一起的吗？', '重庆市江北区', 2, 1, 'public', DATE_SUB(NOW(), INTERVAL 20 DAY)),

-- 学习搭子分类 (category_id = 3)
(5, '搞一下', 'male', '寻找编程学习搭子，一起刷题！', '北京市西城区', 3, 1, 'public', DATE_SUB(NOW(), INTERVAL 21 DAY)),
(5, '搞一下', 'male', '想学英文，有一起的小伙伴吗？', '上海市黄浦区', 3, 2, 'public', DATE_SUB(NOW(), INTERVAL 22 DAY)),
(5, '搞一下', 'male', '寻找数学学习搭子，一起讨论题目！', '广州市荔湾区', 3, 3, 'public', DATE_SUB(NOW(), INTERVAL 23 DAY)),
(5, '搞一下', 'male', '想学物理，有一起的吗？', '深圳市宝安区', 3, 4, 'public', DATE_SUB(NOW(), INTERVAL 24 DAY)),
(5, '搞一下', 'male', '寻找金融学习搭子，一起学习投资！', '杭州市拱墅区', 3, 5, 'public', DATE_SUB(NOW(), INTERVAL 25 DAY)),
(5, '搞一下', 'male', '想学创业，有一起的小伙伴吗？', '成都市青羊区', 3, 6, 'public', DATE_SUB(NOW(), INTERVAL 26 DAY)),
(5, '搞一下', 'male', '寻找学习搭子，一起进步！', '武汉市洪山区', 3, 99, 'public', DATE_SUB(NOW(), INTERVAL 27 DAY)),
(5, '搞一下', 'male', '想学编程，有一起的吗？', '西安市新城区', 3, 1, 'public', DATE_SUB(NOW(), INTERVAL 28 DAY)),
(5, '搞一下', 'male', '寻找英文学习搭子，一起练习口语！', '南京市玄武区', 3, 2, 'public', DATE_SUB(NOW(), INTERVAL 29 DAY)),
(5, '搞一下', 'male', '想学习，有一起的小伙伴吗？', '重庆市南岸区', 3, 3, 'public', DATE_SUB(NOW(), INTERVAL 30 DAY)),

-- 游戏搭子分类 (category_id = 4)
(5, '搞一下', 'male', '寻找王者荣耀搭子，一起上分！', '北京市东城区', 4, 1, 'public', DATE_SUB(NOW(), INTERVAL 31 DAY)),
(5, '搞一下', 'male', '想玩和平精英，有一起的吗？', '上海市静安区', 4, 2, 'public', DATE_SUB(NOW(), INTERVAL 32 DAY)),
(5, '搞一下', 'male', '寻找LOL搭子，一起开黑！', '广州市海珠区', 4, 3, 'public', DATE_SUB(NOW(), INTERVAL 33 DAY)),
(5, '搞一下', 'male', '想玩原神，有一起的小伙伴吗？', '深圳市龙岗区', 4, 4, 'public', DATE_SUB(NOW(), INTERVAL 34 DAY)),
(5, '搞一下', 'male', '寻找金铲铲搭子，一起下棋！', '杭州市余杭区', 4, 5, 'public', DATE_SUB(NOW(), INTERVAL 35 DAY)),
(5, '搞一下', 'male', '想玩游戏，有一起的吗？', '成都市成华区', 4, 99, 'public', DATE_SUB(NOW(), INTERVAL 36 DAY)),
(5, '搞一下', 'male', '寻找游戏搭子，一起娱乐！', '武汉市江岸区', 4, 1, 'public', DATE_SUB(NOW(), INTERVAL 37 DAY)),
(5, '搞一下', 'male', '想玩王者，有一起的小伙伴吗？', '西安市莲湖区', 4, 1, 'public', DATE_SUB(NOW(), INTERVAL 38 DAY)),
(5, '搞一下', 'male', '寻找和平精英搭子，一起吃鸡！', '南京市秦淮区', 4, 2, 'public', DATE_SUB(NOW(), INTERVAL 39 DAY)),
(5, '搞一下', 'male', '想开黑，有一起的吗？', '重庆市沙坪坝区', 4, 3, 'public', DATE_SUB(NOW(), INTERVAL 40 DAY)),

-- 旅行搭子分类 (category_id = 5)
(5, '搞一下', 'male', '寻找国内游搭子，一起去旅行！', '北京市丰台区', 5, 1, 'public', DATE_SUB(NOW(), INTERVAL 41 DAY)),
(5, '搞一下', 'male', '想出国游，有一起的小伙伴吗？', '上海市长宁区', 5, 2, 'public', DATE_SUB(NOW(), INTERVAL 42 DAY)),
(5, '搞一下', 'male', '寻找周末游搭子，一起放松！', '广州市白云区', 5, 3, 'public', DATE_SUB(NOW(), INTERVAL 43 DAY)),
(5, '搞一下', 'male', '想自驾游，有一起的吗？', '深圳市龙华区', 5, 4, 'public', DATE_SUB(NOW(), INTERVAL 44 DAY)),
(5, '搞一下', 'male', '寻找徒步搭子，一起去爬山！', '杭州市滨江区', 5, 5, 'public', DATE_SUB(NOW(), INTERVAL 45 DAY)),
(5, '搞一下', 'male', '想摄影，有一起的小伙伴吗？', '成都市金牛区', 5, 6, 'public', DATE_SUB(NOW(), INTERVAL 46 DAY)),
(5, '搞一下', 'male', '寻找露营搭子，一起去露营！', '武汉市汉阳区', 5, 7, 'public', DATE_SUB(NOW(), INTERVAL 47 DAY)),
(5, '搞一下', 'male', '想旅行，有一起的吗？', '西安市未央区', 5, 99, 'public', DATE_SUB(NOW(), INTERVAL 48 DAY)),
(5, '搞一下', 'male', '寻找旅行搭子，一起探索世界！', '南京市雨花台区', 5, 1, 'public', DATE_SUB(NOW(), INTERVAL 49 DAY)),
(5, '搞一下', 'male', '想出去玩，有一起的小伙伴吗？', '重庆市九龙坡区', 5, 3, 'public', DATE_SUB(NOW(), INTERVAL 50 DAY));

