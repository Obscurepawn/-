// pages/mainPage/mainPage.js
var utils = require("../../utils/util.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    //page style
    inHomePage: true, // this is for bottom menu
    cashWindowHeight: "",
    defaultCashHeight: "",
    diaryWindowHeight: "",
    defaultDiaryHeight: "",
    // whether to show diary of cashBook
    showCashBook: true,
    showDiary: true,
    // for calender
    noMonth: "",
    year: 0,
    month: 0,
    date: ['日', '一', '二', '三', '四', '五', '六'],
    dateArr: [],
    isToday: 0,
    todayIndex: 0,
    today: "",
    // for cashbook list
    cashList: [],
    cashDate: "",
    // for diary list
    diaryList: []
  },
  // 设置日记栏高度
  setDiaryHeight() {
    let diaryList = this.data.diaryList
    if (diaryList == undefined)
      return;
    // 动态设置高度
    var diaryHeight = Math.min((1 + diaryList.length) * 120, 500);
    this.setData({
      defaultDiaryHeight: diaryHeight + "rpx",
      diaryWindowHeight: diaryHeight + "rpx",
    })
  },
  // 设置账单栏高度
  setCashHeight() {
    let cashList = this.data.cashList
    if (cashList == undefined || cashList.length == 0)
      return;
    // 动态设置高度
    console.log('Cash: ', cashList);
    var cashHeight = Math.min((1 + cashList.detail.length) * 120, 500);
    this.setData({
      defaultCashHeight: cashHeight + "rpx",
      cashWindowHeight: cashHeight + "rpx",
    })
  },
  /**
   * 读取数据库
   */
  getDiaryFromServer() {
    // 从数据库读取
    var that = this
    var openid = getApp().globalData.openId;
    wx.request({
      url: 'http://106.15.198.136:8001/v1/diary/' + openid,
      method: "GET",
      success: res => {
        if (res.data.status != 0) {
          console.log(res.msg);
          return;
        }
        // 将服务器返回数据存入到diarylist中
        var diaryList = res.data.diaries
        for(let i = 0 ; i < diaryList.length; i++) {
          diaryList[i].time = new Date(diaryList[i].time).toLocaleTimeString();
        }
        console.log("nig:", diaryList);
        this.setData({
          diaryList: diaryList
        });
        //将日记List存入本地缓存，方便其他页面读取
        wx.setStorage({
          key: 'diaryList',
          data: diaryList
        });
        that.setDiaryHeight();
      }
    });
  },
  getDiary() {
    var that = this;
    var diaryList = wx.getStorageSync('diaryList');
    // 缓存中有日记
    if (diaryList != undefined) {
      that.setData({
        diaryList: diaryList
      });
      that.setDiaryHeight();
    } else {
      getDiaryFromServer();
    }
    // 设置栏目高度
    that.setDiaryHeight();
  },

  getCashListFromServer() {
    var that = this;
    let uid = getApp().globalData.openId;
    wx.request({
      url: 'http://47.102.203.228:5000/init',
      data: {
        openId: uid
      },
      header: {
        'content-type': 'application/json'
      },
      method: 'POST',
      dataType: 'json',
      success: (res) => {
        if (res.statusCode != 200) {
          console.log(res.message);
          return;
        }
        let billList = res.data.data
        var todayCash;
        for (let i in billList) {
          if (utils.isToday(billList[i].date)) {
            todayCash = billList[i];
            break;
          }
        }
        that.setData({
          "cashList": todayCash
        });
        that.setCashHeight();
      },
      fail: function () {
        console.log("系统错误");
      }
    });
  },
  // 读取账单
  getCashList() {
    var that = this;
    let bills = wx.getStorageSync('bills')
    var cashList;
    for (let i in bills) {
      if (utils.isToday(bills[i].date)) {
        cashList = bills[i];
        break;
      }
    }
    if (cashList != undefined) {
      this.setData({
        cashList: cashList
      });
      that.setCashHeight();
    } else {
      that.getCashListFromServer();
    }
    // 设置栏目高度
    that.setCashHeight();
  },

  /**
   * 初始化时间
   */
  dateInit: function (setYear, setMonth) {
    //全部时间的月份都是按0~11基准,显示月份才+1
    let dateArr = []; //需要遍历的日历数组数据
    let arrLen = 0; //dateArr的数组长度
    let now = setYear ? new Date(setYear, setMonth) : new Date();
    let year = setYear || now.getFullYear();
    let nextYear = 0;
    //没有+1方便后面计算当月总天数
    let month = setMonth || now.getMonth();
    let nextMonth = (month + 1) > 11 ? 1 : (month + 1);
    //本月1号对应的星期
    let startWeek = new Date(year + ',' + (month + 1) + ',' + 1).getDay();
    console.log('startweek: ', startWeek);
    //获取本月有多少天
    let dayNums = new Date(year, nextMonth, 0).getDate();
    console.log('dayNums: ', dayNums);

    let obj = {};
    let num = 0;
    if (month + 1 > 11) {
      nextYear = year + 1;
      dayNums = new Date(nextYear, nextMonth, 0).getDate();
    }
    arrLen = startWeek + dayNums;
    for (let i = 0; i < arrLen; i++) {
      if (i < startWeek) {
        obj = {};
      } else {
        num = i - startWeek + 1;
        obj = {
          isToday: year + (month + 1) + num,
          isTodayWeek: i % 7,
          dateNum: num,
        }
      }
      dateArr.push(obj);
    }

    this.setData({
      dateArr: dateArr,
      todayIndex: new Date().getDay()
    });
  },
  switch_day: function (e) {
    let target_day = e.currentTarget.dataset.datenum;
    let date = new Date();
    let day = date.getFullYear() + (date.getMonth() + 1) + target_day;
    let year = date.getFullYear();
    let month = date.getMonth();
    let startWeek = new Date(year + ',' + (month + 1) + ',' + 1).getDay();
    this.setData({
      isToday: day,
      todayIndex: this.data.dateArr[target_day + startWeek - 1].isTodayWeek
    });
  },
  /** 
   * 页面跳转相关函数
   */
  gotoCashBook: function () {
    wx.navigateTo({
      url: '/pages/cashBook/cashBook',
    })
  },
  gotoHistory: function () {
    wx.navigateTo({
      url: '/pages/hisSearch/hisSearch',
    })
  },
  gotoDiary: function () {
    wx.navigateTo({
      url: '/pages/diary/diary',
    })
  },
  // 跳转到具体日记页面
  gotoDetailDiary: event => {
    let url = "/pages/diary/detail/detail"
    var query = "?id=" + event.currentTarget.dataset.id;
    url += query;
    wx.navigateTo({
      url: url,
    });
  },
  /** 
   * 改变页面状态，收缩展开
   */
  cashBookViewControl: function () {
    var that = this;
    let nextCond = !this.data.showCashBook;
    this.setData({
      showCashBook: nextCond,
      cashWindowHeight: nextCond ? that.data.defaultCashHeight : "80rpx"
    });
  },
  diaryViewControl: function () {
    var that = this;
    let nextCond = !this.data.showDiary;
    this.setData({
      showDiary: nextCond,
      diaryWindowHeight: nextCond ? that.data.defaultDiaryHeight : "80rpx"
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let today = now.toLocaleDateString()
    this.dateInit();
    this.setData({
      year: year,
      month: month,
      today: today,
      isToday: year + month + now.getDate(),
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // obtain diary
    this.getDiaryFromServer();
    // obtain part of bills
    this.getCashListFromServer();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.getDiary();
    this.getCashList();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    ;
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    ;
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})