-- 在微信交换记录表中添加细分类型名字段
ALTER TABLE wechat_exchange 
ADD COLUMN subcategory_name VARCHAR(100) DEFAULT NULL COMMENT '帖子细分类型名称' AFTER receiver_id;

