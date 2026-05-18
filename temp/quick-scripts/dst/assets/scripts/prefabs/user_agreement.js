
                (function() {
                    var nodeEnv = typeof require !== 'undefined' && typeof process !== 'undefined';
                    var __module = nodeEnv ? module : {exports:{}};
                    var __filename = 'preview-scripts/assets/scripts/prefabs/user_agreement.js';
                    var __require = nodeEnv ? function (request) {
                        return cc.require(request);
                    } : function (request) {
                        return __quick_compile_project__.require(request, __filename);
                    };
                    function __define (exports, require, module) {
                        if (!nodeEnv) {__quick_compile_project__.registerModule(__filename, module);}"use strict";
cc._RF.push(module, '7e1ccYbD5xDzpnVEE2yJxYX', 'user_agreement');
// scripts/prefabs/user_agreement.js

"use strict";

// 用户协议弹窗控制器
// 用于显示用户协议内容
cc.Class({
  "extends": cc.Component,
  properties: {
    // 标题标签
    title_label: {
      type: cc.Label,
      "default": null
    },
    // 内容标签
    content_label: {
      type: cc.Label,
      "default": null
    },
    // 版本标签
    version_label: {
      type: cc.Label,
      "default": null
    },
    // 加载提示节点
    loading_node: {
      type: cc.Node,
      "default": null
    },
    // 滚动视图
    scroll_view: {
      type: cc.ScrollView,
      "default": null
    },
    // 确认按钮
    confirm_btn: {
      type: cc.Button,
      "default": null
    },
    // 头部节点
    header_node: {
      type: cc.Node,
      "default": null
    },
    // 黑桃图标
    spade_icon: {
      type: cc.Node,
      "default": null
    }
  },
  onLoad: function onLoad() {
    // 初始化
    this.loadUserAgreement();
  },
  start: function start() {
    // 设置版本号
    if (this.version_label) {
      this.version_label.string = '版本 V1.0.0';
    }
  },
  // 加载用户协议内容
  loadUserAgreement: function loadUserAgreement() {
    // 显示加载中
    if (this.loading_node) {
      this.loading_node.active = true;
    } // 从服务器加载用户协议


    this.fetchUserAgreement();
  },
  // 从服务器获取用户协议
  fetchUserAgreement: function fetchUserAgreement() {
    var self = this; // 构建API URL

    var apiUrl = '/api/user-agreement';
    fetch(apiUrl).then(function (response) {
      if (!response.ok) {
        throw new Error('网络请求失败');
      }

      return response.json();
    }).then(function (data) {
      if (data && data.content) {
        self.setContent(data.content);
      } else {
        self.setContent('暂无用户协议内容');
      }
    })["catch"](function (error) {
      console.error('加载用户协议失败:', error);
      self.setContent('加载失败，请稍后重试');
    });
  },
  // 设置内容
  setContent: function setContent(content) {
    // 隐藏加载中
    if (this.loading_node) {
      this.loading_node.active = false;
    } // 设置内容


    if (this.content_label) {
      this.content_label.string = content;
    }
  },
  // 按钮点击事件
  onButtonClick: function onButtonClick(event, customEventData) {
    switch (customEventData) {
      case 'close':
        this.closePanel();
        break;

      case 'confirm':
        this.confirmAgreement();
        break;
    }
  },
  // 关闭面板
  closePanel: function closePanel() {
    // 播放音效
    this.playClickSound(); // 关闭弹窗

    this.node.destroy();
  },
  // 确认协议
  confirmAgreement: function confirmAgreement() {
    // 播放音效
    this.playClickSound(); // 存储用户已同意协议

    try {
      localStorage.setItem('user_agreement_accepted', 'true');
    } catch (e) {
      console.warn('无法存储用户协议状态:', e);
    } // 关闭弹窗


    this.node.destroy();
  },
  // 播放点击音效
  playClickSound: function playClickSound() {// TODO: 添加音效播放逻辑
    // cc.audioEngine.playEffect(this.clickAudio, false);
  }
});

cc._RF.pop();
                    }
                    if (nodeEnv) {
                        __define(__module.exports, __require, __module);
                    }
                    else {
                        __quick_compile_project__.registerModuleFunc(__filename, function () {
                            __define(__module.exports, __require, __module);
                        });
                    }
                })();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL3ByZWZhYnMvdXNlcl9hZ3JlZW1lbnQuanMiXSwibmFtZXMiOlsiY2MiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJ0aXRsZV9sYWJlbCIsInR5cGUiLCJMYWJlbCIsImNvbnRlbnRfbGFiZWwiLCJ2ZXJzaW9uX2xhYmVsIiwibG9hZGluZ19ub2RlIiwiTm9kZSIsInNjcm9sbF92aWV3IiwiU2Nyb2xsVmlldyIsImNvbmZpcm1fYnRuIiwiQnV0dG9uIiwiaGVhZGVyX25vZGUiLCJzcGFkZV9pY29uIiwib25Mb2FkIiwibG9hZFVzZXJBZ3JlZW1lbnQiLCJzdGFydCIsInN0cmluZyIsImFjdGl2ZSIsImZldGNoVXNlckFncmVlbWVudCIsInNlbGYiLCJhcGlVcmwiLCJmZXRjaCIsInRoZW4iLCJyZXNwb25zZSIsIm9rIiwiRXJyb3IiLCJqc29uIiwiZGF0YSIsImNvbnRlbnQiLCJzZXRDb250ZW50IiwiZXJyb3IiLCJjb25zb2xlIiwib25CdXR0b25DbGljayIsImV2ZW50IiwiY3VzdG9tRXZlbnREYXRhIiwiY2xvc2VQYW5lbCIsImNvbmZpcm1BZ3JlZW1lbnQiLCJwbGF5Q2xpY2tTb3VuZCIsIm5vZGUiLCJkZXN0cm95IiwibG9jYWxTdG9yYWdlIiwic2V0SXRlbSIsImUiLCJ3YXJuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFFQUEsRUFBRSxDQUFDQyxLQUFILENBQVM7RUFDTCxXQUFTRCxFQUFFLENBQUNFLFNBRFA7RUFHTEMsVUFBVSxFQUFFO0lBQ1I7SUFDQUMsV0FBVyxFQUFFO01BQ1RDLElBQUksRUFBRUwsRUFBRSxDQUFDTSxLQURBO01BRVQsV0FBUztJQUZBLENBRkw7SUFNUjtJQUNBQyxhQUFhLEVBQUU7TUFDWEYsSUFBSSxFQUFFTCxFQUFFLENBQUNNLEtBREU7TUFFWCxXQUFTO0lBRkUsQ0FQUDtJQVdSO0lBQ0FFLGFBQWEsRUFBRTtNQUNYSCxJQUFJLEVBQUVM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Q0FILGdCQW5JSyw4QkFtSWM7SUFDZjtJQUNBLEtBQUtDLGNBQUwsR0FGZSxDQUlmOztJQUNBLElBQUk7TUFDQUcsWUFBWSxDQUFDQyxPQUFiLENBQXFCLHlCQUFyQixFQUFnRCxNQUFoRDtJQUNILENBRkQsQ0FFRSxPQUFPQyxDQUFQLEVBQVU7TUFDUlgsT0FBTyxDQUFDWSxJQUFSLENBQWEsYUFBYixFQUE0QkQsQ0FBNUI7SUFDSCxDQVRjLENBV2Y7OztJQUNBLEtBQUtKLElBQUwsQ0FBVUMsT0FBVjtFQUNILENBaEpJO0VBa0pMO0VBQ0FGLGNBbkpLLDRCQW1KWSxDQUNiO0lBQ0E7RUFDSDtBQXRKSSxDQUFUIiwic291cmNlUm9vdCI6Ii8iLCJzb3VyY2VzQ29udGVudCI6WyIvLyDnlKjmiLfljY/orq7lvLnnqpfmjqfliLblmahcbi8vIOeUqOS6juaYvuekuueUqOaIt+WNj+iuruWGheWuuVxuXG5jYy5DbGFzcyh7XG4gICAgZXh0ZW5kczogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICAvLyDmoIfpopjmoIfnrb5cbiAgICAgICAgdGl0bGVfbGFiZWw6IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLkxhYmVsLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICAvLyDlhoXlrrnmoIfnrb5cbiAgICAgICAgY29udGVudF9sYWJlbDoge1xuICAgICAgICAgICAgdHlwZTogY2MuTGFiZWwsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOeJiOacrOagh+etvlxuICAgICAgICB2ZXJzaW9uX2xhYmVsOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5MYWJlbCxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgLy8g5Yqg6L295o+Q56S66IqC54K5XG4gICAgICAgIGxvYWRpbmdfbm9kZToge1xuICAgICAgICAgICAgdHlwZTogY2MuTm9kZSxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgLy8g5rua5Yqo6KeG5Zu+XG4gICAgICAgIHNjcm9sbF92aWV3OiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5TY3JvbGxWaWV3LFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICAvLyDnoa7orqTmjInpkq5cbiAgICAgICAgY29uZmlybV9idG46IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLkJ1dHRvbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgLy8g5aS06YOo6IqC54K5XG4gICAgICAgIGhlYWRlcl9ub2RlOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5Ob2RlLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICAvLyDpu5HmoYPlm77moIdcbiAgICAgICAgc3BhZGVfaWNvbjoge1xuICAgICAgICAgICAgdHlwZTogY2MuTm9kZSxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbkxvYWQoKSB7XG4gICAgICAgIC8vIOWIneWni+WMllxuICAgICAgICB0aGlzLmxvYWRVc2VyQWdyZWVtZW50KCk7XG4gICAgfSxcblxuICAgIHN0YXJ0KCkge1xuICAgICAgICAvLyDorr7nva7niYjmnKzlj7dcbiAgICAgICAgaWYgKHRoaXMudmVyc2lvbl9sYWJlbCkge1xuICAgICAgICAgICAgdGhpcy52ZXJzaW9uX2xhYmVsLnN0cmluZyA9ICfniYjmnKwgVjEuMC4wJztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDliqDovb3nlKjmiLfljY/orq7lhoXlrrlcbiAgICBsb2FkVXNlckFncmVlbWVudCgpIHtcbiAgICAgICAgLy8g5pi+56S65Yqg6L295LitXG4gICAgICAgIGlmICh0aGlzLmxvYWRpbmdfbm9kZSkge1xuICAgICAgICAgICAgdGhpcy5sb2FkaW5nX25vZGUuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS7juacjeWKoeWZqOWKoOi9veeUqOaIt+WNj+iurlxuICAgICAgICB0aGlzLmZldGNoVXNlckFncmVlbWVudCgpO1xuICAgIH0sXG5cbiAgICAvLyDku47mnI3liqHlmajojrflj5bnlKjmiLfljY/orq5cbiAgICBmZXRjaFVzZXJBZ3JlZW1lbnQoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIC8vIOaehOW7ukFQSSBVUkxcbiAgICAgICAgY29uc3QgYXBpVXJsID0gJy9hcGkvdXNlci1hZ3JlZW1lbnQnO1xuXG4gICAgICAgIGZldGNoKGFwaVVybClcbiAgICAgICAgICAgIC50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign572R57uc6K+35rGC5aSx6LSlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5jb250ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0Q29udGVudChkYXRhLmNvbnRlbnQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0Q29udGVudCgn5pqC5peg55So5oi35Y2P6K6u5YaF5a65Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcign5Yqg6L2955So5oi35Y2P6K6u5aSx6LSlOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBzZWxmLnNldENvbnRlbnQoJ+WKoOi9veWksei0pe+8jOivt+eojeWQjumHjeivlScpO1xuICAgICAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8vIOiuvue9ruWGheWuuVxuICAgIHNldENvbnRlbnQoY29udGVudCkge1xuICAgICAgICAvLyDpmpDol4/liqDovb3kuK1cbiAgICAgICAgaWYgKHRoaXMubG9hZGluZ19ub2RlKSB7XG4gICAgICAgICAgICB0aGlzLmxvYWRpbmdfbm9kZS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOiuvue9ruWGheWuuVxuICAgICAgICBpZiAodGhpcy5jb250ZW50X2xhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRfbGFiZWwuc3RyaW5nID0gY29udGVudDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDmjInpkq7ngrnlh7vkuovku7ZcbiAgICBvbkJ1dHRvbkNsaWNrKGV2ZW50LCBjdXN0b21FdmVudERhdGEpIHtcbiAgICAgICAgc3dpdGNoIChjdXN0b21FdmVudERhdGEpIHtcbiAgICAgICAgICAgIGNhc2UgJ2Nsb3NlJzpcbiAgICAgICAgICAgICAgICB0aGlzLmNsb3NlUGFuZWwoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2NvbmZpcm0nOlxuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlybUFncmVlbWVudCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOWFs+mXremdouadv1xuICAgIGNsb3NlUGFuZWwoKSB7XG4gICAgICAgIC8vIOaSreaUvumfs+aViFxuICAgICAgICB0aGlzLnBsYXlDbGlja1NvdW5kKCk7XG5cbiAgICAgICAgLy8g5YWz6Zet5by556qXXG4gICAgICAgIHRoaXMubm9kZS5kZXN0cm95KCk7XG4gICAgfSxcblxuICAgIC8vIOehruiupOWNj+iurlxuICAgIGNvbmZpcm1BZ3JlZW1lbnQoKSB7XG4gICAgICAgIC8vIOaSreaUvumfs+aViFxuICAgICAgICB0aGlzLnBsYXlDbGlja1NvdW5kKCk7XG5cbiAgICAgICAgLy8g5a2Y5YKo55So5oi35bey5ZCM5oSP5Y2P6K6uXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlcl9hZ3JlZW1lbnRfYWNjZXB0ZWQnLCAndHJ1ZScpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ+aXoOazleWtmOWCqOeUqOaIt+WNj+iurueKtuaAgTonLCBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWFs+mXreW8ueeql1xuICAgICAgICB0aGlzLm5vZGUuZGVzdHJveSgpO1xuICAgIH0sXG5cbiAgICAvLyDmkq3mlL7ngrnlh7vpn7PmlYhcbiAgICBwbGF5Q2xpY2tTb3VuZCgpIHtcbiAgICAgICAgLy8gVE9ETzog5re75Yqg6Z+z5pWI5pKt5pS+6YC76L6RXG4gICAgICAgIC8vIGNjLmF1ZGlvRW5naW5lLnBsYXlFZmZlY3QodGhpcy5jbGlja0F1ZGlvLCBmYWxzZSk7XG4gICAgfVxufSk7XG4iXX0=