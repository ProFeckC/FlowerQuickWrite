const cloud = require('wx-server-sdk'); cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
exports.main = async (event) => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  await db.collection('users').doc(event.userId).update({ data: { inviteCode: code } });
  return { code: 0, data: { inviteCode: code } };
};
