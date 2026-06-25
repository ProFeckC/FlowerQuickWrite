const cloud = require('wx-server-sdk'); cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
exports.main = async (event) => {
  const { name, balance, type, userId } = event;
  const count = await db.collection('accounts').where({ userId }).count();
  await db.collection('accounts').add({
    data: { userId, name, type: type || 'personal', balance: balance || 0, initialBalance: balance || 0, sortOrder: count.total, createdAt: db.serverDate() }
  });
  return { code: 0 };
};
