const api = require('../../utils/api');

Page({
  data: {
    inputText: '',
    loading: false,
    cards: [],
    categories: [],
    accounts: [],
    lastAccount: '',
    lastAccountType: 'personal',
    budget: 0,
    spent: 0,
    budgetRate: 0,
    recentRecords: [],
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    const userId = wx.getStorageSync('userId');
    if (!userId) return setTimeout(() => this.loadData(), 500);

    const [accRes, catRes, txnRes] = await Promise.all([
      api.getAccounts(userId),
      api.getCategories(userId),
      api.getRecentTransactions(userId),
    ]);

    const accounts = accRes.data || [];
    const categories = catRes.data || [];
    const recent = txnRes.data || [];

    this.setData({
      accounts,
      categories,
      recentRecords: recent.slice(0, 10),
      lastAccount: (accounts[0] && accounts[0].name) || '',
      lastAccountType: (accounts[0] && accounts[0].type) || 'personal',
      spent: recent.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0),
      budget: 3000, // 默认预算，后续从云函数拉
      budgetRate: Math.min(100, (this.data.spent / (this.data.budget || 1)) * 100)
    });
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  async onSend() {
    const text = this.data.inputText.trim();
    if (!text) return wx.showToast({ title: '请输入内容', icon: 'none' });

    this.setData({ loading: true });

    const res = await api.parseTransaction(text);
    this.setData({ loading: false });

    if (res.code !== 0) {
      return wx.showToast({ title: res.msg || '解析失败', icon: 'none' });
    }

    const cards = res.data.map((item, i) => ({
      ...item,
      categoryIndex: this.data.categories.findIndex(c => c.name === item.category),
      accountIndex: this.data.accounts.findIndex(a => a.name === item.account),
    }));

    this.setData({ cards, inputText: '' });
  },

  onCategoryChange(e) {
    const idx = e.currentTarget.dataset.index;
    const catIdx = parseInt(e.detail.value);
    const cards = this.data.cards;
    cards[idx].category = this.data.categories[catIdx].name;
    cards[idx].categoryIndex = catIdx;
    this.setData({ cards });
  },

  onAccountChange(e) {
    const idx = e.currentTarget.dataset.index;
    const accIdx = parseInt(e.detail.value);
    const cards = this.data.cards;
    cards[idx].account = this.data.accounts[accIdx].name;
    cards[idx].accountIndex = accIdx;
    this.setData({ cards });
  },

  onDateChange(e) {
    const idx = e.currentTarget.dataset.index;
    const cards = this.data.cards;
    cards[idx].date = e.detail.value;
    this.setData({ cards });
  },

  async onConfirm() {
    const transactions = this.data.cards.map(c => ({
      description: c.description,
      amount: c.amount,
      category: c.category,
      account: c.account,
      type: c.type,
      date: c.date,
    }));

    const res = await api.saveTransactions(transactions);
    if (res.code === 0) {
      wx.showToast({ title: `已记${transactions.length}笔`, icon: 'success' });
      this.setData({ cards: [] });
      this.loadData();
    } else {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  goAccounts() {
    wx.navigateTo({ url: '/pages/accounts/accounts' });
  },

  goSetBudget() {
    wx.showModal({
      title: '设置月预算',
      editable: true,
      placeholderText: '输入预算金额',
      success: res => {
        if (res.confirm && res.content) {
          const budget = parseFloat(res.content);
          if (budget > 0) this.setData({ budget });
        }
      }
    });
  },
});
