const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { text, userId } = event;
  if (!text || !text.trim()) return { code: -1, msg: '输入不能为空' };

  // 获取用户分类和账户
  const [categoriesRes, accountsRes, userRes] = await Promise.all([
    db.collection('categories').where({ userId }).get(),
    db.collection('accounts').where({ userId }).get(),
    db.collection('users').doc(userId).get()
  ]);

  const categories = categoriesRes.data;
  const accounts = accountsRes.data;
  const lastAccount = userRes.data.lastAccount || '';

  // 拼接分类和账户列表给 AI
  const categoryList = categories.map(c => `${c.name}(${c.type})`).join(' / ');
  const accountList = accounts.map(a => `${a.name}(${a.type})`).join(' / ');

  const prompt = `你是一个记账助手。请将用户的消费记录文本解析成 JSON 数组。
解析规则：
1. 提取每笔消费的描述、金额(数字)、分类、支付账户、收支类型、日期
2. 分类必须从以下选择：${categoryList}
3. 账户必须从以下选择：${accountList}
4. 用户未指定账户时，使用：${lastAccount}
5. 支出/收入：默认是"支出"，"工资/退款/红包/转账收入"为"收入"
6. 日期默认为今天(${new Date().toISOString().split('T')[0]})，支持"昨天/前天"
7. 只返回 JSON 数组，不要有任何其他文字

用户输入：${text}

返回格式：[{"description":"","amount":0,"category":"","account":"","type":"expense","date":"2026-06-25"}]`;

  try {
    const https = require('https');
    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.deepseek.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        timeout: 8000
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      req.write(JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个精确的记账助手，只返回 JSON，不返回其他任何内容。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }));
      req.end();
    });

    const content = result.choices[0].message.content;
    const cleaned = content.replace(/```json|```/g, '').trim();
    const transactions = JSON.parse(cleaned);

    // 验证并修正分类和账户
    const validated = transactions.map(t => ({
      description: t.description || '未知消费',
      amount: parseFloat(t.amount) || 0,
      category: categories.some(c => c.name === t.category) ? t.category : '其他',
      account: accounts.some(a => a.name === t.account) ? t.account : (accounts[0]?.name || ''),
      type: t.type === 'income' ? 'income' : 'expense',
      date: t.date || new Date().toISOString().split('T')[0]
    }));

    return { code: 0, data: validated };
  } catch (err) {
    console.error('DeepSeek API Error:', err.message);
    return { code: -1, msg: 'AI解析失败，请重试', error: err.message };
  }
};
