// pages/cashBook/cashBook.js
var util = require('../../utils/util.js');
var app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    useList: [
      "book",
      "financial",
      "food",
      "house",
      "play",
      "other",
      "transpotation",
    ],
    openId: undefined,
    useIndex: 0,
    inputAmount: undefined,
    inputComment: undefined,
    inputPayer: undefined,
    list: [{
      "text": "统计图",
      "iconPath": "/images/cashBook/line-chart.jpg",
      "selectedIconPath": "/images/cashBook/line-chart.jpg",
      dot: 'true'
    },
    {
      "text": "AA分账",
      "iconPath": "/images/cashBook/calculator.jpg",
      "selectedIconPath": "/images/cashBook/calculator.jpg",
      dot: 'true'
    },
    {
      "text": "增加记录",
      "iconPath": "/images/cashBook/add.png",
      "selectedIconPath": "/images/cashBook/add.png",
      dot: 'true'
    },
    ],
    icon_path: {
      "transpotation": "/images/cashBook/transpotation.png",
      "financial": "/images/cashBook/financial.png",
      "book": "/images/cashBook/book.png",
      "food": "/images/cashBook/food.png",
      "house": "/images/cashBook/house.png",
      "play": "/images/cashBook/play.png"
    },
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    date: new Date().getDate(),
    time: undefined,
    showTime: undefined,
    expenditrue: 0,
    income: 0,
    groups: [],
    show: [],
    billAttributes: [
      "usefulness",
      "amount",
      "comments",
      "payer"
    ],
    chooseList: [],
    tab: -1,
    AATextList: [],
  },

  makeList: function (val, groups) {
    let list = val.split(" ");
    console.log("list in makeList: ", list);
    console.log("groups in makeList: ", groups);
    let count = 0;
    let temp = [];
    groups.forEach(element => {
      count = 0;
      list.forEach(lex => {
        if (element.date.search(lex) != -1 || lex == element.date) {
          count += 1;
        }
        if (element.income == lex || lex == element.income) {
          count += 1;
        }
        if (element.expenditrue == lex || lex == element.expenditrue) {
          count += 1;
        }
        element.detail.forEach(bill => {
          this.data.billAttributes.forEach(attribute => {
            if (lex == bill[attribute]) {
              count += 1;
            } else if (typeof bill[attribute] == "string") {
              if (bill[attribute].search(lex) != -1) {
                count += 1;
              }
            }
          });
        });
      });
      if (count != 0) {
        temp.push(element);
        temp[temp.length - 1].count = count;
      }
    });
    return temp.sort(function (a, b) { return b.count - a.count });
  },

  makeText: function (list) {
    console.log("List in makeText: ", list)
    let ret = [];
    let temp;
    list.forEach(element => {
      temp = ""
      temp += element.date + ";";
      element.detail.forEach(bill => {
        temp += bill.comments + ";";
      })
      ret.push({ text: temp });
    });
    console.log("ret in makeText: ", ret);
    return ret;
  },

  cancelTheChoice:function(){
    this.data.chooseList.forEach(element => {
      let dataPath = 'show[' + element.outsideIndex + '].detail[' + element.insideIndex + '].isChosen';
      this.setData({
        [dataPath]: false
      })
    })
    this.setData({
      chooseList: []
    })
  },

  tabChange(e) {
    console.log('tab change: ', e.detail.index);
    this.setData({
      tab: e.detail.index
    })
    if (e.detail.index == 2) {
      this.setData({
        showTime: this.data.time,
      })
    } else if (e.detail.index == 1) {
      this.AAcost();
      let content = "";
      this.data.AATextList.forEach(element => {
        content += element + "\n";
      })
      wx.showModal({
        title: 'AA大法好',
        content: content,
        showCancel: false,
        confirmText: '确定',
        confirmColor: '#3CC51F',
        success: (result) => {
          if (result.confirm) {
            this.setData({
              AATextList: [],
            })
            this.cancelTheChoice();
          }
        },
        fail: () => { },
        complete: () => { }
      });
    } else if (e.detail.index == 0) {
      let sumInfo = new Array();
      let amountList = [];
      let dateList = [];
      let typeInfo = [];
      this.data.chooseList.forEach(element => {
        this.findKey(typeInfo, this.data.show[element.outsideIndex].detail[element.insideIndex]);
        if (sumInfo[this.data.show[element.outsideIndex].date]) {
          sumInfo[this.data.show[element.outsideIndex].date] += this.data.show[element.outsideIndex].detail[element.insideIndex].amount;
        } else {
          sumInfo[this.data.show[element.outsideIndex].date] = this.data.show[element.outsideIndex].detail[element.insideIndex].amount;
        }
      })
      dateList = Object.keys(sumInfo);
      dateList.forEach(key => { amountList.push(sumInfo[key]); });
      console.log(typeInfo);
      console.log(sumInfo);
      console.log(dateList);
      console.log(amountList);
      let object = [typeInfo, dateList, amountList];
      console.log(object);
      wx.navigateTo({
        url: './charts/charts?data=' + JSON.stringify(object),
        success: (result) => {
          this.setData({
            tab: -1
          })
          this.cancelTheChoice();
        },
        fail: () => { },
        complete: () => { }
      });
    }
  },

  findKey: function (list, object) {
    if (list.length == 0 && object.amount < 0) {
      list.push({ "name": object.usefulness, "data": -object.amount });
      return;
    }
    list.forEach(element => {
      if (element.name == object.usefulness && object.amount < 0) {
        element.amount -= object.amount;
        return;
      }
    })
    if (object.amount < 0) {
      list.push({ "name": object.usefulness, "data": -object.amount });
    }
  },

  getMonth: function (val) {
    if (val.length < 8 || val.length > 10) {
      return "Unknown";
    }
    if (val[4] == "-") {
      return (val[6] == "-") ? val[5] : val.substring(5, 7);
    }
    return "Unknown";
  },

  getNowMonth: function () {
    var myDate = new Date();
    var month = myDate.getMonth();
    var nowMonth = month + 1;
    return nowMonth;
  },

  getSum: function (val) {
    var Expenditrue = 0;
    var Income = 0;
    var expendTemp = 0;
    var incomeTemp = 0;
    var str1 = ".expenditrue";
    var str2 = ".income";
    var str3 = "groups"
    var index = 0;
    var path1 = "";
    var path2 = "";
    var basePath = "";
    val.forEach(element => {
      element.detail.forEach(bill => {
        if (bill.amount < 0) {
          expendTemp += bill.amount;
        } else if (bill.amount > 0) {
          incomeTemp += bill.amount;
        }
      });
      basePath = str3 + '[' + index + ']' + '.';
      path1 = basePath + str1;
      path2 = basePath + str2;
      this.setData({
        [path1]: expendTemp,
        [path2]: incomeTemp
      })
      if (this.getMonth(element.date) == this.getNowMonth()) {
        Expenditrue += expendTemp;
        Income += incomeTemp;
      }
      expendTemp = 0;
      incomeTemp = 0;
      index += 1
    })
    console.log("expenditure in getSum: ", Expenditrue);
    console.log("income in getSum: ", Income);
    this.setData({
      expenditrue: Expenditrue,
      income: Income
    })
  },

  search: function (value) {
    return new Promise((resolve, reject) => {
      resolve(this.makeText(this.makeList(value, JSON.parse(JSON.stringify(this.data.groups)))))
    });
    // JSON.parse(JSON.stringify(object)) //对象深拷贝
  },

  inputAmount(e) {
    // console.log(e.detail.value)
    this.setData({
      inputAmount: Number(e.detail.value)
    })
  },

  inputPayer(e) {
    // console.log(e.detail.value)
    this.setData({
      inputPayer: e.detail.value
    })
  },

  inputComment(e) {
    // console.log(e.detail.value)
    this.setData({
      inputComment: e.detail.value
    })
  },

  bindDateChange(e) {
    2
    // console.log(e.detail.value);
    this.setData({
      showTime: e.detail.value
    })
    console.log("shwoTime in makeText: ", this.data.showTime);
  },

  bindUseChange(e) {
    this.setData({
      useIndex: e.detail.value
    })
  },

  selectResult: function (e) {
    let list = e.detail.item.text.split(";");
    console.log("list in selectResult: ", list);
    let date = list[0];
    console.log("date in selectResult: ", date);
    let temp = [];
    this.data.groups.forEach(element => {
      console.log("element in selectResult: ", element);
      if (element.date == date) {
        temp.push(element);
        this.setData({
          show: temp
        });
        return;
      }
    })
    console.log('select result', e.detail.item.text)
  },

  modalCancel() {
    this.setData({
      tab: -1
    })
  },

  dateCompare: function (a, b) {
    let date1 = a.date;
    let date2 = b.date;
    let year1 = parseInt(date1.substring(0, 4));
    let year2 = parseInt(date2.substring(0, 4));
    if (year1 != year2) {
      return year2 - year1;
    }
    let month1 = parseInt(date1.substring(5, 7));
    let month2 = parseInt(date2.substring(5, 7));
    if (month1 != month2) {
      return month2 - month1;
    }
    let Date1 = parseInt(date1.substring(8));
    let Date2 = parseInt(date2.substring(8));
    if (Date1 != Date2) {
      return Date2 - Date1;
    }
    return 0;
  },

  //格式如下:
  // usefulness: "transpotation",
  // amount: -15,
  // comments: "回学校",
  // payer: "Jankos",
  // date: "2020-03-09",
  // income: undefined,
  // expenditrue: undefined,
  // detail:[]
  modalConfirm(e) {
    this.setData({
      tab: -1
    })
    let newItem = new Object();
    let temp;
    newItem.usefulness = this.data.useList[this.data.useIndex];
    newItem.amount = this.data.inputAmount;
    newItem.comments = this.data.inputComment;
    newItem.payer = this.data.inputPayer;
    let isDateExist = false;
    console.log("showTime in modalConfirm: ", this.data.showTime);
    this.data.groups.forEach(element => {
      if (element.date == this.data.showTime) {
        element.detail.push(newItem);
        isDateExist = true;
        if (newItem.amount < 0) {
          element.expenditrue += newItem.amount;
        } else {
          element.income += newItem.amount;
        }
        temp = element;
      }
      this.setData({
        show: this.data.groups,
      })
    })
    if (isDateExist == false) {
      let dateBill = new Object();
      let detail = [];
      detail.push(newItem);
      console.log("new showTime in modalConfirm: ", this.data.showTime);
      dateBill.date = this.data.showTime;
      dateBill.expenditrue = 0;
      dateBill.income = 0;
      if (newItem.amount < 0) {
        dateBill.expenditrue += newItem.amount;
      } else {
        dateBill.income += newItem.amount;
      }
      dateBill.detail = detail;
      this.data.groups.push(dateBill);
      console.log("groups in modalConfirm: ", this.data.groups);
      this.data.groups.sort(this.dateCompare);
      console.log("dateBill in modalConfirm: ", dateBill);
      this.setData({
        show: this.data.groups,
      })
      temp = dateBill
    }
    temp.openId = this.data.openId;
    //oldDate在该函数中没有意义,只是为了保持格式一致,方便后端api编写。
    temp.old_date = temp.date;
    console.log("tempBill: ", temp);
    wx.request({
      url: 'http://47.102.203.228:5000/update',
      data: temp,
      header: { 'content-type': 'application/json' },
      method: 'PUT',
      success: (result) => {
        console.log(temp);
        if (result.statusCode != 200) {
          wx.request({
            url: 'http://47.102.203.228:5000/add',
            data: temp,
            header: { 'content-type': 'application/json' },
            method: 'PUT',
            success: (res) => {
              if (res.statusCode != 200) {
                console.log(res.message);
              } else {
                console.log("update data successfully");
              }
              console.log(res);
            }
          });
        } else {
          console.log("update data successfully");
        }
        console.log(result);
      }
    });
    wx.setStorageSync("bills", this.data.groups);
  },

  timeAssign: function () {
    return this.data.year + ((this.data.month < 10) ? "-0" : "-") + this.data.month + ((this.data.date < 10) ? "-0" : "-") + this.data.date;
  },

  showAll: function () {
    this.setData({
      show: this.data.groups
    })
  },

  objectEqual(object1, object2) {
    return JSON.stringify(object1) === JSON.stringify(object2);
  },

  listFind(list, object) {
    for (let i = 0; i < list.length; ++i) {
      if (this.objectEqual(list[i], object)) {
        return i;
      }
    }
    return -1;
  },

  chooseBill: function (e) {
    let object = { "insideIndex": e.currentTarget.dataset.insideindex, "outsideIndex": e.currentTarget.dataset.outsideindex };
    let index = this.listFind(this.data.chooseList, object);
    if (index == -1) {
      console.log(object);
      this.data.chooseList.push(object);
    }
    let dataPath = 'show[' + object.outsideIndex + '].detail[' + object.insideIndex + '].isChosen';
    if (this.data.show[object.outsideIndex].detail[object.insideIndex].isChosen != true) {
      this.setData({
        [dataPath]: true
      })
    } else {
      this.setData({
        [dataPath]: false
      })
      this.data.chooseList.splice(index, 1);
    }
    this.setData({
      show: this.data.show
    })
    console.log(this.data.show[object.outsideIndex].detail[object.insideIndex]);
    console.log(this.data.chooseList);
  },


  AAcost: function () {
    let info = [];
    let persons = [];
    let collectMoney = [];
    let giveMoney = [];
    let collect_give = [];
    let name;
    let amount;
    let sum = 0;
    let personNum = 0;
    let averageCost;
    let object;
    let index = 0;
    this.data.chooseList.forEach(element => {
      name = this.data.show[element.outsideIndex].detail[element.insideIndex].payer;
      amount = this.data.show[element.outsideIndex].detail[element.insideIndex].amount;
      info.push({ "payer": name, "amount": amount });
      sum += amount
      if (this.listFind(persons, name) == -1) {
        personNum += 1;
        persons.push(name);
      }
    })
    if (personNum == 1) {
      this.setData({
        AATextList: ["AA分账中只有一名用户进行了支出或收入，至少要两名用户才可进行AA,请检查账单中付款人的用户名是否正确输入"]
      })
    }
    averageCost = (sum / personNum).toFixed(2);
    info.forEach(element => {
      if (element.amount != averageCost) {
        object = { "amount": averageCost - element.amount, "payer": element.payer };
        if (object.amount > 0) {
          collectMoney.push(object);
        } else {
          object.amount = -object.amount;
          giveMoney.push(object);
        }
      }
    })
    collectMoney.forEach(element => {
      while (giveMoney[index]) {
        if (element.amount == 0) {
          break;
        }
        if (giveMoney[index].amount == 0) {
          index++;
          continue;
        }
        if (element.amount <= giveMoney[index].amount) {
          collect_give.push({ "payer": giveMoney[index].payer, "collector": element.payer, "amount": element.amount });
          giveMoney[index].amount -= element.amount;
          element.amount = 0;
        } else if (element.amount > giveMoney[index].amount) {
          collect_give.push({ "payer": giveMoney[index].payer, "collector": element.payer, "amount": giveMoney[index].amount });
          giveMoney[index].amount = 0;
          element.amount -= giveMoney[index].amount;
        }
      }
    })
    collect_give.forEach(element => {
      this.data.AATextList.push(element.payer + "---" + element.amount + "--->" + element.collector);
    })
    console.log("TextList:", this.data.AATextList);
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.clearStorageSync();
    this.setData({
      search: this.search.bind(this),
      time: this.timeAssign()
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    var App = getApp();
    console.log("App.js:", App.globalData.openId);
    this.setData({
      openId: App.globalData.openId
    })
    console.log("cashBook.js:", this.data.openId);
    let groups = wx.getStorageSync("bills");
    if (!groups) {
      wx.request({
        url: 'http://47.102.203.228:5000/init',
        data: { openId: this.data.openId },
        header: { 'content-type': 'application/json' },
        method: 'POST',
        dataType: 'json',
        success: (result) => {
          if (result.statusCode != 200) {
            console.log(result.message);
          } else {
            console.log(result.data.data);
            this.setData({
              groups: result.data.data,
            })
            this.getSum(this.data.groups);
            console.log(this.data.groups);
            this.data.groups.sort(this.dateCompare);
            this.setData({
              show: this.data.groups
            })
            wx.setStorageSync("bills", result.data.data);
            console.log("Init Successfully");
          }
        },
        fail: function () {
          console.log("系统错误");
        }
      });
    } else {
      this.setData({
        groups: groups,
      })
      console.log(this.data.groups);
      this.getSum(this.data.groups);
      this.data.groups.sort(this.dateCompare);
      this.setData({
        show: this.data.groups
      })
      console.log("Init Successfully");
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

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