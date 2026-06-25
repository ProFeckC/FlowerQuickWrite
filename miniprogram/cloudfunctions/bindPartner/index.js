const cloud = require('wx-server-sdk'); cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
exports.main = async (event) => {
  const { inviteCode, userId } = event;
  const partnerRes = await db.collection('users').where({ inviteCode }).get();
  if (partnerRes.data.length === 0) return { code: -1, msg: '邀请码不存在' };

  const partner = partnerRes.data[0];
  if (partner._id === userId) return { code: -1, msg: '不能绑定自己' };
  if (partner.partnerId) return { code: -1, msg: '对方已有伴侣' };

  // 双向绑定
  await db.collection('users').doc(userId).update({ data: { partnerId: partner._id } });
  await db.collection('users').doc(partner._id).update({ data: { partnerId: userId } });

  return { code: 0, msg: '绑定成功' };
};
