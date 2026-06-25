const cloud = require('wx-server-sdk'); cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
exports.main = async (event) => {
  const res = await db.collection('accounts').where({ userId: event.userId }).orderBy('sortOrder', 'asc').get();
  return { code: 0, data: res.data };
};
