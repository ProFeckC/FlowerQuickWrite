const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();

  const userResult = await db.collection('users').where({ openid: OPENID }).get();

  let userId;
  if (userResult.data.length === 0) {
    const createResult = await db.collection('users').add({
      data: {
        openid: OPENID,
        nickName: '',
        avatar: '',
        inviteCode: generateCode(),
        partnerId: '',
        createdAt: db.serverDate(),
      }
    });
    userId = createResult._id;
  } else {
    userId = userResult.data[0]._id;
    if (!userResult.data[0].inviteCode) {
      await db.collection('users').doc(userId).update({
        data: { inviteCode: generateCode() }
      });
    }
  }

  return { openid: OPENID, userId, inviteCode: userResult.data[0]?.inviteCode || '' };
};

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
