const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { transactions, userId } = event;
  if (!transactions || !transactions.length) return { code: -1, msg: '无数据' };

  const results = [];

  for (const t of transactions) {
    // 查找账户
    const accountRes = await db.collection('accounts')
      .where({ userId, name: t.account }).get();
    if (accountRes.data.length === 0) continue;

    const account = accountRes.data[0];
    const amount = Math.abs(t.amount);
    const delta = t.type === 'expense' ? -amount : amount;
    const newBalance = (account.balance || 0) + delta;

    // 写入交易记录
    const record = {
      userId,
      description: t.description,
      amount,
      category: t.category,
      accountId: account._id,
      accountName: t.account,
      accountType: account.type,
      type: t.type,
      date: t.date,
      createdAt: db.serverDate(),
    };
    const addResult = await db.collection('transactions').add({ data: record });

    // 更新账户余额
    await db.collection('accounts').doc(account._id).update({
      data: { balance: newBalance }
    });

    results.push({
      id: addResult._id,
      ...record,
      balance: newBalance
    });

    // 更新用户最后使用的账户
    await db.collection('users').doc(userId).update({
      data: { lastAccount: t.account }
    });
  }

  return { code: 0, data: results };
};
