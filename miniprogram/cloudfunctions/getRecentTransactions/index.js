const cloud = require('wx-server-sdk'); cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
exports.main = async (event) => {
  const res = await db.collection('transactions')
    .where({ userId: event.userId })
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();
  return { code: 0, data: res.data };
};
