// API 统一封装层
// 所有云函数调用集中在此，便于未来迁移到 HTTP 接口

const call = (name, data = {}) => {
  return new Promise((resolve) => {
    wx.cloud.callFunction({
      name,
      data: { ...data, userId: wx.getStorageSync('userId') },
      success: res => resolve(res.result),
      fail: err => resolve({ code: -1, msg: err.errMsg })
    });
  });
};

module.exports = {
  // 账户
  getAccounts: (userId) => call('getAccounts', { userId }),
  createAccount: (name, balance, type) => call('createAccount', { name, balance, type }),
  updateAccount: (id, data) => call('updateAccount', { id, ...data }),
  deleteAccount: (id) => call('deleteAccount', { id }),

  // 分类
  getCategories: (userId) => call('getCategories', { userId }),

  // AI 解析
  parseTransaction: (text) => call('parseTransaction', { text }),

  // 保存交易
  saveTransactions: (transactions) => call('saveTransactions', { transactions }),

  // 查询记录
  getRecentTransactions: (userId) => call('getRecentTransactions', { userId }),

  // 邀请绑定
  generateInviteCode: () => call('generateInviteCode'),
  bindPartner: (inviteCode) => call('bindPartner', { inviteCode }),
};
