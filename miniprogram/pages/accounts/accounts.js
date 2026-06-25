const api = require('../../utils/api');

Page({
  data: {
    personalAccounts: [],
    sharedAccounts: [],
    showModal: false,
    newName: '',
    newBalance: '',
    newType: 'personal',
  },

  onShow() { this.loadAccounts(); },

  async loadAccounts() {
    const res = await api.getAccounts();
    const data = res.data || [];
    this.setData({
      personalAccounts: data.filter(a => a.type === 'personal'),
      sharedAccounts: data.filter(a => a.type === 'shared'),
    });
  },

  showAddModal() { this.setData({ showModal: true, newName: '', newBalance: '', newType: 'personal' }); },
  hideModal() { this.setData({ showModal: false }); },
  preventBubble() {},

  onNameInput(e) { this.setData({ newName: e.detail.value }); },
  onBalanceInput(e) { this.setData({ newBalance: e.detail.value }); },
  selectType(e) { this.setData({ newType: e.currentTarget.dataset.type }); },

  async addAccount() {
    const { newName, newBalance, newType } = this.data;
    if (!newName.trim()) return wx.showToast({ title: '请输入名称', icon: 'none' });
    if (!newBalance || isNaN(parseFloat(newBalance))) return wx.showToast({ title: '请输入有效余额', icon: 'none' });

    const res = await api.createAccount(newName.trim(), parseFloat(newBalance), newType);
    if (res.code === 0) {
      wx.showToast({ title: '创建成功', icon: 'success' });
      this.hideModal();
      this.loadAccounts();
    }
  },
});
