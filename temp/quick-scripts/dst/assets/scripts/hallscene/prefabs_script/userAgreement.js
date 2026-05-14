
                (function() {
                    var nodeEnv = typeof require !== 'undefined' && typeof process !== 'undefined';
                    var __module = nodeEnv ? module : {exports:{}};
                    var __filename = 'preview-scripts/assets/scripts/hallscene/prefabs_script/userAgreement.js';
                    var __require = nodeEnv ? function (request) {
                        return cc.require(request);
                    } : function (request) {
                        return __quick_compile_project__.require(request, __filename);
                    };
                    function __define (exports, require, module) {
                        if (!nodeEnv) {__quick_compile_project__.registerModule(__filename, module);}"use strict";
cc._RF.push(module, 'b2c3dTl9niQq83vEjRWeJq8', 'userAgreement');
// scripts/hallscene/prefabs_script/userAgreement.js

"use strict";

// 用户协议弹窗脚本
// 功能：从 API 获取用户协议内容并显示，无论 API 成功失败都必须显示弹窗
// 设计：绿色头部 + 黑桃图标 + 米色内容区 + 黄色确认按钮
cc.Class({
  "extends": cc.Component,
  properties: {
    // 标题标签（在绿色头部中）
    title_label: {
      type: cc.Label,
      "default": null
    },
    // 内容标签（在滚动视图中）
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
    // 内容滚动视图
    scroll_view: {
      type: cc.ScrollView,
      "default": null
    },
    // 确认按钮节点
    confirm_btn: {
      type: cc.Node,
      "default": null
    },
    // 头部节点（用于设置绿色背景）
    header_node: {
      type: cc.Node,
      "default": null
    },
    // 黑桃图标节点
    spade_icon: {
      type: cc.Node,
      "default": null
    }
  },
  // LIFE-CYCLE CALLBACKS:
  onLoad: function onLoad() {
    // 标记节点是否有效
    this._isValid = true; // 默认协议内容（API 失败时显示）

    this._defaultContent = "欢迎使用本游戏！在使用前，请您仔细阅读以下用户协议：\n\n1. 服务条款：本游戏提供的服务仅供娱乐目的，用户需遵守相关法律法规。\n\n2. 账号安全：用户应妥善保管账号信息，因个人原因导致的账号损失由用户自行承担。\n\n3. 游戏规则：禁止使用外挂、作弊等违规行为，违者将受到封号等处罚。\n\n4. 隐私保护：我们重视用户隐私，相关信息仅用于提供和优化服务。";
    this._defaultTitle = "用户协议";
    this._defaultVersion = ""; // 添加鼠标滚轮支持

    this._setupMouseWheel(); // 初始化弹窗（先显示默认内容）


    this._initPopup(); // 调用 API 获取用户协议


    this._fetchUserAgreement();
  },
  // 设置鼠标滚轮支持
  _setupMouseWheel: function _setupMouseWheel() {
    var self = this;

    if (this.scroll_view && this.scroll_view.node) {
      this.scroll_view.node.on(cc.Node.EventType.MOUSE_WHEEL, function (event) {
        var scrollY = event.getScrollY();
        var scrollView = self.scroll_view;

        if (scrollView) {
          var currentOffset = scrollView.getScrollOffset();
          var newOffsetY = currentOffset.y + scrollY * 0.5;
          scrollView.scrollToOffset(cc.v2(currentOffset.x, newOffsetY), 0.1);
        }
      }, this);
    }
  },
  // 初始化弹窗 - 显示加载中状态
  _initPopup: function _initPopup() {
    if (this.title_label) {
      this.title_label.string = this._defaultTitle;
    }

    if (this.content_label) {
      this.content_label.string = "正在加载...";
    }

    if (this.version_label) {
      this.version_label.string = "";
    }

    this._showLoading(true);
  },
  onDestroy: function onDestroy() {
    // 标记节点已销毁
    this._isValid = false;
  },
  start: function start() {// 空实现
  },
  // 获取用户协议数据
  _fetchUserAgreement: function _fetchUserAgreement() {
    var self = this;
    var defines = window.defines;
    var HttpAPI = window.HttpAPI; // 检查配置

    if (!defines || !defines.apiUrl) {
      console.warn("API配置未定义，使用默认内容");

      self._showDefaultContent();

      return;
    }

    if (!HttpAPI) {
      console.warn("HttpAPI未加载，使用默认内容");

      self._showDefaultContent();

      return;
    } // 获取用户协议（带加密解密）


    HttpAPI.getUserAgreement(defines.apiUrl, defines.cryptoKey || '', function (err, data) {
      // 检查节点是否仍然有效
      if (!self._isValid || !self.node) {
        return;
      }

      self._showLoading(false);

      if (err) {
        console.warn("获取用户协议失败:", err); // API 失败时显示默认内容（弹窗必须显示）

        self._showDefaultContent();

        return;
      }

      if (data) {
        self._updateContent(data);
      } else {
        // 无数据时显示默认内容
        self._showDefaultContent();
      }
    });
  },
  // 显示默认内容（API 失败时）
  _showDefaultContent: function _showDefaultContent() {
    if (!this._isValid || !this.node) return;

    if (this.title_label) {
      this.title_label.string = this._defaultTitle;
    }

    if (this.content_label) {
      this.content_label.string = this._defaultContent;

      this._updateContentHeight();
    }

    if (this.version_label) {
      this.version_label.string = "";
    }

    this._showLoading(false);

    if (this.scroll_view) {
      this.scroll_view.node.active = true;
    }
  },
  // 更新内容显示
  _updateContent: function _updateContent(data) {
    if (!this._isValid || !this.node) return;

    if (this.title_label && data.title) {
      this.title_label.string = data.title;
    }

    if (this.content_label && data.content) {
      this.content_label.string = data.content;

      this._updateContentHeight();
    }

    if (this.version_label && data.version) {
      this.version_label.string = "版本: " + data.version;
    }
  },
  // 更新 content 容器高度
  _updateContentHeight: function _updateContentHeight() {
    if (!this._isValid || !this.node) return;

    if (this.content_label) {
      // 设置左对齐，文字颜色为黑色
      this.content_label.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
      this.content_label.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
      this.content_label.wrapWidth = 680; // 调整宽度以增加左右边距
      // 确保文字颜色为黑色

      this.content_label.node.color = cc.color(0, 0, 0, 255);
      var contentNode = this.content_label.node; // 延迟更新高度

      var self = this;
      this.scheduleOnce(function () {
        if (!self._isValid || !self.node) return;
        var labelHeight = contentNode.height;
        var minHeight = 400;
        var newHeight = Math.max(labelHeight + 60, minHeight); // 增加底部空间

        contentNode.height = newHeight; // 重置滚动位置到顶部

        if (self.scroll_view) {
          self.scroll_view.scrollToTop(0);
        }
      }, 0.1);
    }
  },
  // 显示加载状态
  _showLoading: function _showLoading(show) {
    if (!this._isValid || !this.node) return;

    if (this.loading_node) {
      this.loading_node.active = show;
    }

    if (this.scroll_view) {
      this.scroll_view.node.active = !show;
    }
  },
  // 显示错误信息（仍然显示弹窗）
  _showError: function _showError(message) {
    if (!this._isValid || !this.node) return;

    this._showLoading(false);

    if (this.content_label) {
      this.content_label.string = message || this._defaultContent;
    }

    if (this.scroll_view) {
      this.scroll_view.node.active = true;
    }
  },
  // 按钮点击事件
  onButtonClick: function onButtonClick(event, customData) {
    if (!this._isValid || !this.node) {
      return;
    }

    switch (customData) {
      case "close":
        // 关闭按钮（头部右侧的X按钮）
        this._isValid = false;
        this.node.destroy();
        break;

      case "confirm":
        // "我知道了"按钮（底部黄色按钮）
        this._isValid = false;
        this.node.destroy();
        break;

      default:
        break;
    }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2hhbGxzY2VuZS9wcmVmYWJzX3NjcmlwdC91c2VyQWdyZWVtZW50LmpzIl0sIm5hbWVzIjpbImNjIiwiQ2xhc3MiLCJDb21wb25lbnQiLCJwcm9wZXJ0aWVzIiwidGl0bGVfbGFiZWwiLCJ0eXBlIiwiTGFiZWwiLCJjb250ZW50X2xhYmVsIiwidmVyc2lvbl9sYWJlbCIsImxvYWRpbmdfbm9kZSIsIk5vZGUiLCJzY3JvbGxfdmlldyIsIlNjcm9sbFZpZXciLCJjb25maXJtX2J0biIsImhlYWRlcl9ub2RlIiwic3BhZGVfaWNvbiIsIm9uTG9hZCIsIl9pc1ZhbGlkIiwiX2RlZmF1bHRDb250ZW50IiwiX2RlZmF1bHRUaXRsZSIsIl9kZWZhdWx0VmVyc2lvbiIsIl9zZXR1cE1vdXNlV2hlZWwiLCJfaW5pdFBvcHVwIiwiX2ZldGNoVXNlckFncmVlbWVudCIsInNlbGYiLCJub2RlIiwib24iLCJFdmVudFR5cGUiLCJNT1VTRV9XSEVFTCIsImV2ZW50Iiwic2Nyb2xsWSIsImdldFNjcm9sbFkiLCJzY3JvbGxWaWV3IiwiY3VycmVudE9mZnNldCIsImdldFNjcm9sbE9mZnNldCIsIm5ld09mZnNldFkiLCJ5Iiwic2Nyb2xsVG9PZmZzZXQiLCJ2MiIsIngiLCJzdHJpbmciLCJfc2hvd0xvYWRpbmciLCJvbkRlc3Ryb3kiLCJzdGFydCIsImRlZmluZXMiLCJ3aW5kb3ciLCJIdHRwQVBJIiwiYXBpVXJsIiwiY29uc29sZSIsIndhcm4iLCJfc2hvd0RlZmF1bHRDb250ZW50IiwiZ2V0VXNlckFncmVlbWVudCIsImNyeXB0b0tleSIsImVyciIsImRhdGEiLCJfdXBkYXRlQ29udGVudCIsIl91cGRhdGVDb250ZW50SGVpZ2h0IiwiYWN0aXZlIiwidGl0bGUiLCJjb250ZW50IiwidmVyc2lvbiIsImhvcml6b250YWxBbGlnbiIsIkhvcml6b250YWxBbGlnbiIsIkxFRlQiLCJvdmVyZmxvdyIsIk92ZXJmbG93IiwiUkVTSVpFX0hFSUdIVCIsIndyYXBXaWR0aCIsImNvbG9yIiwiY29udGVudE5vZGUiLCJzY2hlZHVsZU9uY2UiLCJsYWJlbEhlaWdodCIsImhlaWdodCIsIm1pbkhlaWdodCIsIm5ld0hlaWdodCIsIk1hdGgiLCJtYXgiLCJzY3JvbGxUb1RvcCIsInNob3ciLCJfc2hvd0Vycm9yIiwibWVzc2FnZSIsIm9uQnV0dG9uQ2xpY2siLCJjdXN0b21EYXRhIiwiZGVzdHJveSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFFQUEsRUFBRSxDQUFDQyxLQUFILENBQVM7RUFDTCxXQUFTRCxFQUFFLENBQUNFLFNBRFA7RUFHTEMsVUFBVSxFQUFFO0lBQ1I7SUFDQUMsV0FBVyxFQUFFO01BQ1RDLElBQUksRUFBRUwsRUFBRSxDQUFDTSxLQURBO01BRVQsV0FBUztJQUZBLENBRkw7SUFNUjtJQUNBQyxhQUFhLEVBQUU7TUFDWEYsSUFBSSxFQUFFTCxFQUFFLENBQUNNLEtBREU7TUFFWCxXQUFTO0lBRkUsQ0FQUDtJQVdSO0lBQ0FFLGFBQWEsRUFBRTtNQUNYSCxJQUFJLEVBQUVMLEVBQUUsQ0FBQ00sS0FERTtNQUVYLFdBQVM7SUFGRSxDQVpQO0lBZ0JSO0lBQ0FHLFlBQVksRUFBRTtNQUNWSixJQUFJLEVBQUVMLEVBQUUsQ0FBQ1UsSUFEQztNQUVWLFdBQVM7SUFGQyxDQWpCTjtJQXFCUjtJQUNBQyxXQUFXLEVBQUU7TUFDVE4sSUFBSSxFQUFFTCxFQUFFLENBQUNZLFVBREE7TUFFVCxXQUFTO0lBRkEsQ0F0Qkw7SUEwQlI7SUFDQUMsV0FBVyxFQUFFO01BQ1RSLElBQUksRUFBRUwsRUFBRSxDQUFDVSxJQURBO01BRVQsV0FBUztJQUZBLENBM0JMO0lBK0JSO0lBQ0FJLFdBQVcsRUFBRTtNQUNUVCxJQUFJLEVBQUVMLEVBQUUsQ0FBQ1UsSUFEQTtNQUVULFdBQVM7SUFGQSxDQWhDTDtJQW9DUjtJQUNBSyxVQUFVLEVBQUU7TUFDUlYsSUFBSSxFQUFFTCxFQUFFLENBQUNVLElBREQ7TUFFUixXQUFTO0lBRkQ7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Q3BCLEtBQUtBLGFBQUwsQ0FBbUJpQyxNQUFuQixHQUE0QndDLE9BQU8sSUFBSSxLQUFLOUQsZUFBNUM7SUFDSDs7SUFDRCxJQUFJLEtBQUtQLFdBQVQsRUFBc0I7TUFDbEIsS0FBS0EsV0FBTCxDQUFpQmMsSUFBakIsQ0FBc0JnQyxNQUF0QixHQUErQixJQUEvQjtJQUNIO0VBQ0osQ0E5UEk7RUFnUUw7RUFDQXdCLGFBalFLLHlCQWlRU3BELEtBalFULEVBaVFnQnFELFVBalFoQixFQWlRNEI7SUFDN0IsSUFBSSxDQUFDLEtBQUtqRSxRQUFOLElBQWtCLENBQUMsS0FBS1EsSUFBNUIsRUFBa0M7TUFDOUI7SUFDSDs7SUFFRCxRQUFReUQsVUFBUjtNQUNJLEtBQUssT0FBTDtRQUNJO1FBQ0EsS0FBS2pFLFFBQUwsR0FBZ0IsS0FBaEI7UUFDQSxLQUFLUSxJQUFMLENBQVUwRCxPQUFWO1FBQ0E7O01BQ0osS0FBSyxTQUFMO1FBQ0k7UUFDQSxLQUFLbEUsUUFBTCxHQUFnQixLQUFoQjtRQUNBLEtBQUtRLElBQUwsQ0FBVTBELE9BQVY7UUFDQTs7TUFDSjtRQUNJO0lBWlI7RUFjSDtBQXBSSSxDQUFUIiwic291cmNlUm9vdCI6Ii8iLCJzb3VyY2VzQ29udGVudCI6WyIvLyDnlKjmiLfljY/orq7lvLnnqpfohJrmnKxcbi8vIOWKn+iDve+8muS7jiBBUEkg6I635Y+W55So5oi35Y2P6K6u5YaF5a655bm25pi+56S677yM5peg6K66IEFQSSDmiJDlip/lpLHotKXpg73lv4XpobvmmL7npLrlvLnnqpdcbi8vIOiuvuiuoe+8mue7v+iJsuWktOmDqCArIOm7keahg+WbvuaghyArIOexs+iJsuWGheWuueWMuiArIOm7hOiJsuehruiupOaMiemSrlxuXG5jYy5DbGFzcyh7XG4gICAgZXh0ZW5kczogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICAvLyDmoIfpopjmoIfnrb7vvIjlnKjnu7/oibLlpLTpg6jkuK3vvIlcbiAgICAgICAgdGl0bGVfbGFiZWw6IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLkxhYmVsLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICAvLyDlhoXlrrnmoIfnrb7vvIjlnKjmu5rliqjop4blm77kuK3vvIlcbiAgICAgICAgY29udGVudF9sYWJlbDoge1xuICAgICAgICAgICAgdHlwZTogY2MuTGFiZWwsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOeJiOacrOagh+etvlxuICAgICAgICB2ZXJzaW9uX2xhYmVsOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5MYWJlbCxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgLy8g5Yqg6L295o+Q56S66IqC54K5XG4gICAgICAgIGxvYWRpbmdfbm9kZToge1xuICAgICAgICAgICAgdHlwZTogY2MuTm9kZSxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgLy8g5YaF5a655rua5Yqo6KeG5Zu+XG4gICAgICAgIHNjcm9sbF92aWV3OiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5TY3JvbGxWaWV3LFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICAvLyDnoa7orqTmjInpkq7oioLngrlcbiAgICAgICAgY29uZmlybV9idG46IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLk5vZGUsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOWktOmDqOiKgueCue+8iOeUqOS6juiuvue9rue7v+iJsuiDjOaZr++8iVxuICAgICAgICBoZWFkZXJfbm9kZToge1xuICAgICAgICAgICAgdHlwZTogY2MuTm9kZSxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgLy8g6buR5qGD5Zu+5qCH6IqC54K5XG4gICAgICAgIHNwYWRlX2ljb246IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLk5vZGUsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gTElGRS1DWUNMRSBDQUxMQkFDS1M6XG5cbiAgICBvbkxvYWQoKSB7XG4gICAgICAgIC8vIOagh+iusOiKgueCueaYr+WQpuacieaViFxuICAgICAgICB0aGlzLl9pc1ZhbGlkID0gdHJ1ZTtcbiAgICAgICAgXG4gICAgICAgIC8vIOm7mOiupOWNj+iuruWGheWuue+8iEFQSSDlpLHotKXml7bmmL7npLrvvIlcbiAgICAgICAgdGhpcy5fZGVmYXVsdENvbnRlbnQgPSBcIuasoui/juS9v+eUqOacrOa4uOaIj++8geWcqOS9v+eUqOWJje+8jOivt+aCqOS7lOe7humYheivu+S7peS4i+eUqOaIt+WNj+iuru+8mlxcblxcbjEuIOacjeWKoeadoeasvu+8muacrOa4uOaIj+aPkOS+m+eahOacjeWKoeS7heS+m+WoseS5kOebrueahO+8jOeUqOaIt+mcgOmBteWuiOebuOWFs+azleW+i+azleinhOOAglxcblxcbjIuIOi0puWPt+WuieWFqO+8mueUqOaIt+W6lOWmpeWWhOS/neeuoei0puWPt+S/oeaBr++8jOWboOS4quS6uuWOn+WboOWvvOiHtOeahOi0puWPt+aNn+WkseeUseeUqOaIt+iHquihjOaJv+aLheOAglxcblxcbjMuIOa4uOaIj+inhOWIme+8muemgeatouS9v+eUqOWkluaMguOAgeS9nOW8iuetiei/neinhOihjOS4uu+8jOi/neiAheWwhuWPl+WIsOWwgeWPt+etieWkhOe9muOAglxcblxcbjQuIOmakOengeS/neaKpO+8muaIkeS7rOmHjeinhueUqOaIt+makOenge+8jOebuOWFs+S/oeaBr+S7heeUqOS6juaPkOS+m+WSjOS8mOWMluacjeWKoeOAglwiO1xuICAgICAgICB0aGlzLl9kZWZhdWx0VGl0bGUgPSBcIueUqOaIt+WNj+iurlwiO1xuICAgICAgICB0aGlzLl9kZWZhdWx0VmVyc2lvbiA9IFwiXCI7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDpvKDmoIfmu5rova7mlK/mjIFcbiAgICAgICAgdGhpcy5fc2V0dXBNb3VzZVdoZWVsKCk7XG4gICAgICAgIFxuICAgICAgICAvLyDliJ3lp4vljJblvLnnqpfvvIjlhYjmmL7npLrpu5jorqTlhoXlrrnvvIlcbiAgICAgICAgdGhpcy5faW5pdFBvcHVwKCk7XG4gICAgICAgIFxuICAgICAgICAvLyDosIPnlKggQVBJIOiOt+WPlueUqOaIt+WNj+iurlxuICAgICAgICB0aGlzLl9mZXRjaFVzZXJBZ3JlZW1lbnQoKTtcbiAgICB9LFxuICAgIFxuICAgIC8vIOiuvue9rum8oOagh+a7mui9ruaUr+aMgVxuICAgIF9zZXR1cE1vdXNlV2hlZWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbF92aWV3ICYmIHRoaXMuc2Nyb2xsX3ZpZXcubm9kZSkge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxfdmlldy5ub2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLk1PVVNFX1dIRUVMLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxZID0gZXZlbnQuZ2V0U2Nyb2xsWSgpO1xuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxWaWV3ID0gc2VsZi5zY3JvbGxfdmlldztcbiAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsVmlldykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudE9mZnNldCA9IHNjcm9sbFZpZXcuZ2V0U2Nyb2xsT2Zmc2V0KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdPZmZzZXRZID0gY3VycmVudE9mZnNldC55ICsgc2Nyb2xsWSAqIDAuNTtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsVmlldy5zY3JvbGxUb09mZnNldChjYy52MihjdXJyZW50T2Zmc2V0LngsIG5ld09mZnNldFkpLCAwLjEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOWIneWni+WMluW8ueeqlyAtIOaYvuekuuWKoOi9veS4reeKtuaAgVxuICAgIF9pbml0UG9wdXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy50aXRsZV9sYWJlbCkge1xuICAgICAgICAgICAgdGhpcy50aXRsZV9sYWJlbC5zdHJpbmcgPSB0aGlzLl9kZWZhdWx0VGl0bGU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLmNvbnRlbnRfbGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGVudF9sYWJlbC5zdHJpbmcgPSBcIuato+WcqOWKoOi9vS4uLlwiO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy52ZXJzaW9uX2xhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLnZlcnNpb25fbGFiZWwuc3RyaW5nID0gXCJcIjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5fc2hvd0xvYWRpbmcodHJ1ZSk7XG4gICAgfSxcblxuICAgIG9uRGVzdHJveSgpIHtcbiAgICAgICAgLy8g5qCH6K6w6IqC54K55bey6ZSA5q+BXG4gICAgICAgIHRoaXMuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIC8vIOepuuWunueOsFxuICAgIH0sXG5cbiAgICAvLyDojrflj5bnlKjmiLfljY/orq7mlbDmja5cbiAgICBfZmV0Y2hVc2VyQWdyZWVtZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgZGVmaW5lcyA9IHdpbmRvdy5kZWZpbmVzO1xuICAgICAgICB2YXIgSHR0cEFQSSA9IHdpbmRvdy5IdHRwQVBJO1xuICAgICAgICBcbiAgICAgICAgLy8g5qOA5p+l6YWN572uXG4gICAgICAgIGlmICghZGVmaW5lcyB8fCAhZGVmaW5lcy5hcGlVcmwpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkFQSemFjee9ruacquWumuS5ie+8jOS9v+eUqOm7mOiupOWGheWuuVwiKTtcbiAgICAgICAgICAgIHNlbGYuX3Nob3dEZWZhdWx0Q29udGVudCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFIdHRwQVBJKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJIdHRwQVBJ5pyq5Yqg6L2977yM5L2/55So6buY6K6k5YaF5a65XCIpO1xuICAgICAgICAgICAgc2VsZi5fc2hvd0RlZmF1bHRDb250ZW50KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDojrflj5bnlKjmiLfljY/orq7vvIjluKbliqDlr4bop6Plr4bvvIlcbiAgICAgICAgSHR0cEFQSS5nZXRVc2VyQWdyZWVtZW50KFxuICAgICAgICAgICAgZGVmaW5lcy5hcGlVcmwsXG4gICAgICAgICAgICBkZWZpbmVzLmNyeXB0b0tleSB8fCAnJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vIOajgOafpeiKgueCueaYr+WQpuS7jeeEtuacieaViFxuICAgICAgICAgICAgICAgIGlmICghc2VsZi5faXNWYWxpZCB8fCAhc2VsZi5ub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc2VsZi5fc2hvd0xvYWRpbmcoZmFsc2UpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi6I635Y+W55So5oi35Y2P6K6u5aSx6LSlOlwiLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICAvLyBBUEkg5aSx6LSl5pe25pi+56S66buY6K6k5YaF5a6577yI5by556qX5b+F6aG75pi+56S677yJXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dEZWZhdWx0Q29udGVudCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3VwZGF0ZUNvbnRlbnQoZGF0YSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5peg5pWw5o2u5pe25pi+56S66buY6K6k5YaF5a65XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dEZWZhdWx0Q29udGVudCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgLy8g5pi+56S66buY6K6k5YaF5a6577yIQVBJIOWksei0peaXtu+8iVxuICAgIF9zaG93RGVmYXVsdENvbnRlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzVmFsaWQgfHwgIXRoaXMubm9kZSkgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMudGl0bGVfbGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMudGl0bGVfbGFiZWwuc3RyaW5nID0gdGhpcy5fZGVmYXVsdFRpdGxlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5jb250ZW50X2xhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRfbGFiZWwuc3RyaW5nID0gdGhpcy5fZGVmYXVsdENvbnRlbnQ7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVDb250ZW50SGVpZ2h0KCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLnZlcnNpb25fbGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMudmVyc2lvbl9sYWJlbC5zdHJpbmcgPSBcIlwiO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9zaG93TG9hZGluZyhmYWxzZSk7XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbF92aWV3KSB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbF92aWV3Lm5vZGUuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDmm7TmlrDlhoXlrrnmmL7npLpcbiAgICBfdXBkYXRlQ29udGVudDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzVmFsaWQgfHwgIXRoaXMubm9kZSkgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMudGl0bGVfbGFiZWwgJiYgZGF0YS50aXRsZSkge1xuICAgICAgICAgICAgdGhpcy50aXRsZV9sYWJlbC5zdHJpbmcgPSBkYXRhLnRpdGxlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5jb250ZW50X2xhYmVsICYmIGRhdGEuY29udGVudCkge1xuICAgICAgICAgICAgdGhpcy5jb250ZW50X2xhYmVsLnN0cmluZyA9IGRhdGEuY29udGVudDtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZUNvbnRlbnRIZWlnaHQoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMudmVyc2lvbl9sYWJlbCAmJiBkYXRhLnZlcnNpb24pIHtcbiAgICAgICAgICAgIHRoaXMudmVyc2lvbl9sYWJlbC5zdHJpbmcgPSBcIueJiOacrDogXCIgKyBkYXRhLnZlcnNpb247XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vIOabtOaWsCBjb250ZW50IOWuueWZqOmrmOW6plxuICAgIF91cGRhdGVDb250ZW50SGVpZ2h0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc1ZhbGlkIHx8ICF0aGlzLm5vZGUpIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLmNvbnRlbnRfbGFiZWwpIHtcbiAgICAgICAgICAgIC8vIOiuvue9ruW3puWvuem9kO+8jOaWh+Wtl+minOiJsuS4uum7keiJslxuICAgICAgICAgICAgdGhpcy5jb250ZW50X2xhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5MRUZUO1xuICAgICAgICAgICAgdGhpcy5jb250ZW50X2xhYmVsLm92ZXJmbG93ID0gY2MuTGFiZWwuT3ZlcmZsb3cuUkVTSVpFX0hFSUdIVDtcbiAgICAgICAgICAgIHRoaXMuY29udGVudF9sYWJlbC53cmFwV2lkdGggPSA2ODA7ICAvLyDosIPmlbTlrr3luqbku6Xlop7liqDlt6blj7Povrnot51cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g56Gu5L+d5paH5a2X6aKc6Imy5Li66buR6ImyXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRfbGFiZWwubm9kZS5jb2xvciA9IGNjLmNvbG9yKDAsIDAsIDAsIDI1NSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBjb250ZW50Tm9kZSA9IHRoaXMuY29udGVudF9sYWJlbC5ub2RlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlu7bov5/mm7TmlrDpq5jluqZcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHRoaXMuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICghc2VsZi5faXNWYWxpZCB8fCAhc2VsZi5ub2RlKSByZXR1cm47XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIGxhYmVsSGVpZ2h0ID0gY29udGVudE5vZGUuaGVpZ2h0O1xuICAgICAgICAgICAgICAgIHZhciBtaW5IZWlnaHQgPSA0MDA7XG4gICAgICAgICAgICAgICAgdmFyIG5ld0hlaWdodCA9IE1hdGgubWF4KGxhYmVsSGVpZ2h0ICsgNjAsIG1pbkhlaWdodCk7ICAvLyDlop7liqDlupXpg6jnqbrpl7RcbiAgICAgICAgICAgICAgICBjb250ZW50Tm9kZS5oZWlnaHQgPSBuZXdIZWlnaHQ7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g6YeN572u5rua5Yqo5L2N572u5Yiw6aG26YOoXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuc2Nyb2xsX3ZpZXcpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zY3JvbGxfdmlldy5zY3JvbGxUb1RvcCgwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAwLjEpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOaYvuekuuWKoOi9veeKtuaAgVxuICAgIF9zaG93TG9hZGluZzogZnVuY3Rpb24oc2hvdykge1xuICAgICAgICBpZiAoIXRoaXMuX2lzVmFsaWQgfHwgIXRoaXMubm9kZSkgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMubG9hZGluZ19ub2RlKSB7XG4gICAgICAgICAgICB0aGlzLmxvYWRpbmdfbm9kZS5hY3RpdmUgPSBzaG93O1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnNjcm9sbF92aWV3KSB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbF92aWV3Lm5vZGUuYWN0aXZlID0gIXNob3c7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g5pi+56S66ZSZ6K+v5L+h5oGv77yI5LuN54S25pi+56S65by556qX77yJXG4gICAgX3Nob3dFcnJvcjogZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzVmFsaWQgfHwgIXRoaXMubm9kZSkgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5fc2hvd0xvYWRpbmcoZmFsc2UpO1xuICAgICAgICBpZiAodGhpcy5jb250ZW50X2xhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRfbGFiZWwuc3RyaW5nID0gbWVzc2FnZSB8fCB0aGlzLl9kZWZhdWx0Q29udGVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zY3JvbGxfdmlldykge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxfdmlldy5ub2RlLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g5oyJ6ZKu54K55Ye75LqL5Lu2XG4gICAgb25CdXR0b25DbGljayhldmVudCwgY3VzdG9tRGF0YSkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzVmFsaWQgfHwgIXRoaXMubm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggKGN1c3RvbURhdGEpIHtcbiAgICAgICAgICAgIGNhc2UgXCJjbG9zZVwiOlxuICAgICAgICAgICAgICAgIC8vIOWFs+mXreaMiemSru+8iOWktOmDqOWPs+S+p+eahFjmjInpkq7vvIlcbiAgICAgICAgICAgICAgICB0aGlzLl9pc1ZhbGlkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgdGhpcy5ub2RlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJjb25maXJtXCI6XG4gICAgICAgICAgICAgICAgLy8gXCLmiJHnn6XpgZPkuoZcIuaMiemSru+8iOW6lemDqOm7hOiJsuaMiemSru+8iVxuICAgICAgICAgICAgICAgIHRoaXMuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB0aGlzLm5vZGUuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuIl19