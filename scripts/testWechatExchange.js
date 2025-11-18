const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:8080';
let user1Token = ''; // 需要替换为真实的 token
let user2Token = ''; // 需要替换为真实的 token
const user1Id = 1;
const user2Id = 2;

// 设置颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试函数
async function testWechatExchange() {
  try {
    log('\n=== 微信交换功能测试 ===\n', 'blue');

    // 检查 token
    if (!user1Token || !user2Token) {
      log('错误: 请先设置 user1Token 和 user2Token', 'red');
      log('你可以通过登录接口获取 token，然后在脚本中设置', 'yellow');
      return;
    }

    // 测试1: 用户1查询与用户2的交换信息
    log('测试1: 用户1查询交换信息...', 'yellow');
    try {
      const response1 = await axios.get(`${BASE_URL}/api/wechat-exchange/info`, {
        params: { targetUserId: user2Id },
        headers: { Authorization: `Bearer ${user1Token}` }
      });
      log('✓ 查询成功', 'green');
      console.log(JSON.stringify(response1.data, null, 2));
    } catch (err) {
      log(`✗ 查询失败: ${err.response?.data?.message || err.message}`, 'red');
    }

    // 测试2: 用户1发起交换请求
    log('\n测试2: 用户1发起交换请求...', 'yellow');
    let exchangeNo = '';
    try {
      const response2 = await axios.post(
        `${BASE_URL}/api/wechat-exchange/request`,
        {
          targetUserId: user2Id,
          wechatId: 'user1_wechat_123'
        },
        {
          headers: { Authorization: `Bearer ${user1Token}` }
        }
      );
      log('✓ 发起成功', 'green');
      console.log(JSON.stringify(response2.data, null, 2));
      exchangeNo = response2.data.data.exchangeNo;
      log(`Exchange No: ${exchangeNo}`, 'blue');
    } catch (err) {
      log(`✗ 发起失败: ${err.response?.data?.message || err.message}`, 'red');
      // 如果已存在记录，尝试获取 exchangeNo
      if (err.response?.data?.message?.includes('已存在')) {
        log('提示: 已存在交换记录，继续后续测试...', 'yellow');
      }
    }

    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 测试3: 用户2查询交换信息
    log('\n测试3: 用户2查询交换信息...', 'yellow');
    try {
      const response3 = await axios.get(`${BASE_URL}/api/wechat-exchange/info`, {
        params: { targetUserId: user1Id },
        headers: { Authorization: `Bearer ${user2Token}` }
      });
      log('✓ 查询成功', 'green');
      console.log(JSON.stringify(response3.data, null, 2));
      if (response3.data.data.exchangeNo) {
        exchangeNo = response3.data.data.exchangeNo;
      }
    } catch (err) {
      log(`✗ 查询失败: ${err.response?.data?.message || err.message}`, 'red');
    }

    if (!exchangeNo) {
      log('\n无法继续测试：未获取到 exchangeNo', 'red');
      return;
    }

    // 测试4: 用户2确认交换（接受）
    log('\n测试4: 用户2确认交换（接受）...', 'yellow');
    try {
      const response4 = await axios.post(
        `${BASE_URL}/api/wechat-exchange/confirm`,
        {
          exchangeNo,
          wechatId: 'user2_wechat_456',
          action: 'accept'
        },
        {
          headers: { Authorization: `Bearer ${user2Token}` }
        }
      );
      log('✓ 确认成功', 'green');
      console.log(JSON.stringify(response4.data, null, 2));
      log(`用户2获得用户1的微信号: ${response4.data.data.otherWechat}`, 'blue');
    } catch (err) {
      log(`✗ 确认失败: ${err.response?.data?.message || err.message}`, 'red');
    }

    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 测试5: 用户1再次查询，应该能看到用户2的微信号
    log('\n测试5: 用户1查询完成的交换信息...', 'yellow');
    try {
      const response5 = await axios.get(`${BASE_URL}/api/wechat-exchange/info`, {
        params: { targetUserId: user2Id },
        headers: { Authorization: `Bearer ${user1Token}` }
      });
      log('✓ 查询成功', 'green');
      console.log(JSON.stringify(response5.data, null, 2));
      if (response5.data.data.otherWechat) {
        log(`用户1获得用户2的微信号: ${response5.data.data.otherWechat}`, 'blue');
      }
    } catch (err) {
      log(`✗ 查询失败: ${err.response?.data?.message || err.message}`, 'red');
    }

    // 测试6: 用户1获取交换记录列表
    log('\n测试6: 用户1获取交换记录列表...', 'yellow');
    try {
      const response6 = await axios.get(`${BASE_URL}/api/wechat-exchange/my-exchanges`, {
        params: { page: 1, limit: 10 },
        headers: { Authorization: `Bearer ${user1Token}` }
      });
      log('✓ 获取成功', 'green');
      console.log(JSON.stringify(response6.data, null, 2));
    } catch (err) {
      log(`✗ 获取失败: ${err.response?.data?.message || err.message}`, 'red');
    }

    // 测试7: 用户2获取通知列表
    log('\n测试7: 用户2获取通知列表...', 'yellow');
    try {
      const response7 = await axios.get(`${BASE_URL}/api/notifications`, {
        params: { page: 1, limit: 10 },
        headers: { Authorization: `Bearer ${user2Token}` }
      });
      log('✓ 获取成功', 'green');
      const wechatNotifications = response7.data.data.list.filter(n => 
        n.type === 'wechat_exchange_request' || n.type === 'wechat_exchange_confirmed'
      );
      console.log('微信交换相关通知:', JSON.stringify(wechatNotifications, null, 2));
    } catch (err) {
      log(`✗ 获取失败: ${err.response?.data?.message || err.message}`, 'red');
    }

    log('\n=== 测试完成 ===\n', 'blue');

  } catch (error) {
    log(`测试过程中发生错误: ${error.message}`, 'red');
    console.error(error);
  }
}

// 辅助函数：登录并获取 token
async function login(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email,
      password
    });
    if (response.data.success) {
      return response.data.data.token;
    }
  } catch (err) {
    log(`登录失败: ${err.response?.data?.message || err.message}`, 'red');
  }
  return null;
}

// 主函数
async function main() {
  log('微信交换功能测试脚本', 'blue');
  log('请确保以下条件满足:', 'yellow');
  log('1. 服务已启动 (http://localhost:8080)', 'yellow');
  log('2. 数据库已迁移', 'yellow');
  log('3. 至少有两个测试用户', 'yellow');
  log('4. 已在脚本中设置 user1Token 和 user2Token\n', 'yellow');

  // 如果需要自动登录获取 token，可以取消下面的注释
  /*
  log('尝试自动登录获取 token...', 'yellow');
  user1Token = await login('user1@example.com', 'password123');
  user2Token = await login('user2@example.com', 'password123');
  
  if (user1Token && user2Token) {
    log('✓ 登录成功，已获取 token\n', 'green');
    await testWechatExchange();
  } else {
    log('✗ 登录失败，请手动设置 token', 'red');
  }
  */

  // 如果已经手动设置了 token，直接运行测试
  if (user1Token && user2Token) {
    await testWechatExchange();
  } else {
    log('\n请在脚本中设置 user1Token 和 user2Token 后再运行', 'red');
    log('或取消注释自动登录代码', 'yellow');
  }
}

// 运行测试
main();

