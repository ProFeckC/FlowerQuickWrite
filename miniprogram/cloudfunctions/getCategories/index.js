const cloud = require('wx-server-sdk'); cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
exports.main = async (event) => {
  const res = await db.collection('categories').where({ userId: event.userId }).orderBy('sortOrder', 'asc').get();
  if (res.data.length === 0) {
    // 首次访问，初始化默认分类
    const defaults = [
      { name: '餐饮', type: 'expense', isDefault: true, sortOrder: 0 },
      { name: '交通', type: 'expense', isDefault: true, sortOrder: 1 },
      { name: '购物', type: 'expense', isDefault: true, sortOrder: 2 },
      { name: '娱乐', type: 'expense', isDefault: true, sortOrder: 3 },
      { name: '居家', type: 'expense', isDefault: true, sortOrder: 4 },
      { name: '医疗', type: 'expense', isDefault: true, sortOrder: 5 },
      { name: '教育', type: 'expense', isDefault: true, sortOrder: 6 },
      { name: '其他', type: 'expense', isDefault: true, sortOrder: 7 },
      { name: '工资', type: 'income', isDefault: true, sortOrder: 100 },
      { name: '退款', type: 'income', isDefault: true, sortOrder: 101 },
      { name: '红包', type: 'income', isDefault: true, sortOrder: 102 },
      { name: '其他收入', type: 'income', isDefault: true, sortOrder: 103 },
    ];
    for (const c of defaults) {
      await db.collection('categories').add({ data: { userId: event.userId, ...c, createdAt: db.serverDate() } });
    }
    const updated = await db.collection('categories').where({ userId: event.userId }).get();
    return { code: 0, data: updated.data };
  }
  return { code: 0, data: res.data };
};
