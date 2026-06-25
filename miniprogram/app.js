App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-d7gtgug3eebab30b2',
        traceUser: true,
      });
    }
    this.autoLogin();
  },

  autoLogin: function () {
    const that = this;
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        that.globalData.openid = res.result.openid;
        that.globalData.userId = res.result.userId;
        wx.setStorageSync('openid', res.result.openid);
        wx.setStorageSync('userId', res.result.userId);
      },
      fail: err => console.error('登录失败', err)
    });
  },

  globalData: {
    openid: '',
    userId: '',
  }
});
