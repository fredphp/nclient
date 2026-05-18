
                (function() {
                    var nodeEnv = typeof require !== 'undefined' && typeof process !== 'undefined';
                    var __module = nodeEnv ? module : {exports:{}};
                    var __filename = 'preview-scripts/assets/scripts/prefabs/phone_login.js';
                    var __require = nodeEnv ? function (request) {
                        return cc.require(request);
                    } : function (request) {
                        return __quick_compile_project__.require(request, __filename);
                    };
                    function __define (exports, require, module) {
                        if (!nodeEnv) {__quick_compile_project__.registerModule(__filename, module);}"use strict";
cc._RF.push(module, 'd8d26bcwexC2ICpbya9WK0B', 'phone_login');
// scripts/prefabs/phone_login.js

"use strict";

// 手机号登录弹窗控制器
// 用于处理手机号验证码登录功能
// 设计风格：中国风商业棋牌（响应式适配：宽度60%，高度自适应）
cc.Class({
  "extends": cc.Component,
  properties: {
    // 输入框
    phone_input: {
      type: cc.EditBox,
      "default": null
    },
    code_input: {
      type: cc.EditBox,
      "default": null
    },
    // 按钮
    send_code_btn: {
      type: cc.Button,
      "default": null
    },
    login_btn: {
      type: cc.Button,
      "default": null
    },
    close_btn: {
      type: cc.Button,
      "default": null
    },
    // 微信登录按钮
    wx_login_btn: {
      type: cc.Sprite,
      "default": null
    },
    // 标签
    send_code_label: {
      type: cc.Label,
      "default": null
    },
    message_label: {
      type: cc.Label,
      "default": null
    },
    // 倒计时时间
    countdown_time: 60,
    // 基准设计尺寸（用于计算scale）
    BASE_WIDTH: 400,
    BASE_HEIGHT: 520
  },
  onLoad: function onLoad() {
    this._countdown = 0;
    this._phone = "";
    this._code = ""; // 立即执行弹窗尺寸适配

    this.adaptDialog(); // 监听屏幕尺寸变化

    var self = this;
    cc.view.setResizeCallback(function () {
      self.adaptDialog();
    }); // 初始化弹窗动画

    this._initPanelAnimation(); // 绘制圆角输入框边框


    this._drawInputBorders(); // ==================== 初始化 EditBox 样式和事件 ====================


    this._initEditBoxes(); // 初始化按钮事件


    this._initButtons(); // 初始化微信登录按钮


    this._initWechatButton();

    this._hideMessage(); // 获取输入框初始值


    if (this.phone_input) {
      this._phone = this.phone_input.string || "";
    }

    if (this.code_input) {
      this._code = this.code_input.string || "";
    }
  },
  // ==================== 初始化 EditBox ====================
  _initEditBoxes: function _initEditBoxes() {
    var self = this; // 手机号输入框初始化

    if (this.phone_input) {
      // 设置 stayOnTop 为 true，确保文字始终可见
      this.phone_input.stayOnTop = true; // 设置字体样式

      this.phone_input.fontSize = 20;
      this.phone_input.lineHeight = 40;
      this.phone_input.fontColor = new cc.Color(50, 50, 50, 255);
      this.phone_input.placeholderFontColor = new cc.Color(150, 150, 150, 255); // 监听输入事件

      this.phone_input.node.on('editing-did-began', function () {
        self._onPhoneInputFocus();
      }, this);
      this.phone_input.node.on('editing-did-ended', function () {
        self._onPhoneInputBlur();
      }, this);
      this.phone_input.node.on('text-changed', function (editbox) {
        self._phone = editbox.string;
      }, this);
    } // 验证码输入框初始化


    if (this.code_input) {
      // 设置 stayOnTop 为 true，确保文字始终可见
      this.code_input.stayOnTop = true; // 设置字体样式

      this.code_input.fontSize = 20;
      this.code_input.lineHeight = 40;
      this.code_input.fontColor = new cc.Color(50, 50, 50, 255);
      this.code_input.placeholderFontColor = new cc.Color(150, 150, 150, 255); // 监听输入事件

      this.code_input.node.on('editing-did-began', function () {
        self._onCodeInputFocus();
      }, this);
      this.code_input.node.on('editing-did-ended', function () {
        self._onCodeInputBlur();
      }, this);
      this.code_input.node.on('text-changed', function (editbox) {
        self._code = editbox.string;
      }, this);
    }
  },
  // 手机号输入框获得焦点
  _onPhoneInputFocus: function _onPhoneInputFocus() {// 可以添加焦点效果
  },
  // 手机号输入框失去焦点
  _onPhoneInputBlur: function _onPhoneInputBlur() {
    // 确保文字显示
    if (this.phone_input && this.phone_input.string) {
      this._phone = this.phone_input.string;
    }
  },
  // 验证码输入框获得焦点
  _onCodeInputFocus: function _onCodeInputFocus() {// 可以添加焦点效果
  },
  // 验证码输入框失去焦点
  _onCodeInputBlur: function _onCodeInputBlur() {
    // 确保文字显示
    if (this.code_input && this.code_input.string) {
      this._code = this.code_input.string;
    }
  },
  // =============================================
  // 响应式适配：宽度=屏幕60%，最小300，高度按比例
  // =============================================
  adaptDialog: function adaptDialog() {
    var panel = this.node.getChildByName('content_panel');
    if (!panel) return;
    var winW = cc.winSize.width;
    var winH = cc.winSize.height; // 目标宽度 = 屏幕宽度 * 60%

    var targetWidth = winW * 0.6; // 最小宽度300，最大宽度不超过屏幕80%

    targetWidth = Math.max(300, Math.min(targetWidth, winW * 0.8)); // 计算缩放比例

    var scale = targetWidth / this.BASE_WIDTH; // 确保高度不超出屏幕（留出10%边距）

    var maxScaleY = winH * 0.8 / this.BASE_HEIGHT;
    scale = Math.min(scale, maxScaleY); // 限制缩放范围 [0.7, 1.3]

    scale = Math.max(0.7, Math.min(scale, 1.3)); // 应用缩放

    panel.scale = scale;
    console.log('【登录弹窗】屏幕:', winW, 'x', winH, '目标宽度:', Math.round(targetWidth), '缩放:', scale.toFixed(2), '实际尺寸:', Math.round(this.BASE_WIDTH * scale), 'x', Math.round(this.BASE_HEIGHT * scale));
  },
  // 初始化弹窗进入动画
  _initPanelAnimation: function _initPanelAnimation() {
    var contentPanel = this.node.getChildByName('content_panel');

    if (contentPanel) {
      // 保存目标缩放值（已由_initPanelScale设置）
      var targetScale = contentPanel.scale; // 从小尺寸开始动画

      contentPanel.scale = targetScale * 0.7;
      contentPanel.opacity = 0;
      cc.tween(contentPanel).to(0.25, {
        scale: targetScale,
        opacity: 255
      }, {
        easing: 'backOut'
      }).start();
    }
  },
  // 绘制输入框圆角边框 - 修复版：绘制背景 + 边框
  _drawInputBorders: function _drawInputBorders() {
    var contentPanel = this.node.getChildByName('content_panel');
    if (!contentPanel) return; // 绘制手机号输入框背景和边框 (320x50)

    var phoneBg = contentPanel.getChildByName('phone_bg');

    if (phoneBg) {
      var graphics = phoneBg.getComponent(cc.Graphics);

      if (graphics) {
        graphics.clear(); // 先绘制填充背景（半透明白色）

        graphics.fillColor = new cc.Color(255, 252, 240, 230);

        this._drawRoundRect(graphics, -160, -25, 320, 50, 14);

        graphics.fill(); // 再绘制边框（金色）

        graphics.strokeColor = new cc.Color(218, 165, 32, 255);
        graphics.lineWidth = 2;

        this._drawRoundRect(graphics, -160, -25, 320, 50, 14);

        graphics.stroke();
      } // 确保 phone_bg 节点在 input 节点下方


      var phoneInput = phoneBg.getChildByName('phone_input');

      if (phoneInput) {
        phoneInput.zIndex = 10;
        phoneBg.zIndex = 5;
      }
    } // 绘制验证码输入框背景和边框 (190x50)


    var codeRow = contentPanel.getChildByName('code_row');

    if (codeRow) {
      var codeBg = codeRow.getChildByName('code_bg');

      if (codeBg) {
        var graphics = codeBg.getComponent(cc.Graphics);

        if (graphics) {
          graphics.clear(); // 先绘制填充背景（半透明白色）

          graphics.fillColor = new cc.Color(255, 252, 240, 230);

          this._drawRoundRect(graphics, -95, -25, 190, 50, 14);

          graphics.fill(); // 再绘制边框（金色）

          graphics.strokeColor = new cc.Color(218, 165, 32, 255);
          graphics.lineWidth = 2;

          this._drawRoundRect(graphics, -95, -25, 190, 50, 14);

          graphics.stroke();
        } // 确保 code_bg 节点在 input 节点下方


        var codeInput = codeBg.getChildByName('code_input');

        if (codeInput) {
          codeInput.zIndex = 10;
          codeBg.zIndex = 5;
        }
      }
    } // 绘制分割线


    var divider = contentPanel.getChildByName('divider');

    if (divider) {
      var graphics = divider.getComponent(cc.Graphics);

      if (graphics) {
        graphics.clear();
        graphics.strokeColor = new cc.Color(200, 180, 140, 180);
        graphics.lineWidth = 1;
        graphics.moveTo(-170, 0);
        graphics.lineTo(170, 0);
        graphics.stroke();
      }
    }
  },
  // 绘制圆角矩形
  _drawRoundRect: function _drawRoundRect(graphics, x, y, w, h, r) {
    graphics.moveTo(x + r, y);
    graphics.lineTo(x + w - r, y);
    graphics.arcTo(x + w, y, x + w, y + r, r);
    graphics.lineTo(x + w, y + h - r);
    graphics.arcTo(x + w, y + h, x + w - r, y + h, r);
    graphics.lineTo(x + r, y + h);
    graphics.arcTo(x, y + h, x, y + h - r, r);
    graphics.lineTo(x, y + r);
    graphics.arcTo(x, y, x + r, y, r);
  },
  // 初始化微信登录按钮
  _initWechatButton: function _initWechatButton() {
    var contentPanel = this.node.getChildByName('content_panel');
    if (!contentPanel) return;
    var wxContainer = contentPanel.getChildByName('wx_login_container');

    if (wxContainer) {
      var wxBtn = wxContainer.getChildByName('wx_login_btn');

      if (wxBtn) {
        // 添加按钮点击效果
        wxBtn.on(cc.Node.EventType.TOUCH_START, function () {
          wxBtn.scale = 0.95;
        }, this);
        wxBtn.on(cc.Node.EventType.TOUCH_END, function () {
          wxBtn.scale = 1;

          this._onWechatLoginClick();
        }, this);
        wxBtn.on(cc.Node.EventType.TOUCH_CANCEL, function () {
          wxBtn.scale = 1;
        }, this); // 添加"微信登录"文字标签

        this._createWechatLabel(wxContainer);
      }
    }
  },
  // 创建微信登录文字标签
  _createWechatLabel: function _createWechatLabel(container) {
    // 检查是否已存在标签
    var existLabel = container.getChildByName('wx_login_label');
    if (existLabel) return;
    var labelNode = new cc.Node('wx_login_label');
    labelNode.parent = container;
    labelNode.y = -35;
    var label = labelNode.addComponent(cc.Label);
    label.string = '微信登录';
    label.fontSize = 18;
    label.lineHeight = 22;
    label.fontFamily = 'Arial';
    label.fontColor = new cc.Color(120, 100, 80, 255);
    label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  },
  _initButtons: function _initButtons() {
    var self = this; // 关闭按钮

    if (this.close_btn) {
      this.close_btn.node.off(cc.Node.EventType.TOUCH_END);
      this.close_btn.node.on(cc.Node.EventType.TOUCH_END, function () {
        self._onCloseClick();
      }, this);
    } // 发送验证码按钮


    if (this.send_code_btn) {
      this.send_code_btn.node.off(cc.Node.EventType.TOUCH_END);
      this.send_code_btn.node.on(cc.Node.EventType.TOUCH_END, function () {
        self._onSendCodeClick();
      }, this);
    } // 登录按钮


    if (this.login_btn) {
      this.login_btn.node.off(cc.Node.EventType.TOUCH_END);
      this.login_btn.node.on(cc.Node.EventType.TOUCH_END, function () {
        self._onLoginClick();
      }, this);
    }
  },
  // 微信登录点击
  _onWechatLoginClick: function _onWechatLoginClick() {
    console.log('【微信登录】点击微信登录按钮'); // 检查是否有全局的微信登录方法

    if (window.myglobal && window.myglobal.wechatLogin) {
      window.myglobal.wechatLogin();
    } else {
      // 降级：提示用户
      this._showMessage('微信登录功能暂未开放', true);
    }
  },
  // 手机号输入变化
  onPhoneInputChanged: function onPhoneInputChanged(editbox, customEventData) {
    this._phone = editbox.string;
  },
  // 验证码输入变化
  onCodeInputChanged: function onCodeInputChanged(editbox, customEventData) {
    this._code = editbox.string;
  },
  // 发送验证码
  _onSendCodeClick: function _onSendCodeClick() {
    var self = this;

    if (this._countdown > 0) {
      return;
    } // 从输入框获取手机号


    if (this.phone_input) {
      this._phone = this.phone_input.string || "";
    } // 验证手机号


    if (!this._validatePhone(this._phone)) {
      this._showMessage("请输入正确的手机号", true);

      return;
    }

    this._showMessage("正在发送...", false);

    this._setInteractable(false); // 调用发送验证码接口


    this._sendCodeRequest(this._phone, function (success, message) {
      self._setInteractable(true);

      if (success) {
        self._startCountdown();

        self._showMessage("验证码已发送", false);
      } else {
        self._showMessage(message || "发送失败，请重试", true);
      }
    });
  },
  // 登录
  _onLoginClick: function _onLoginClick() {
    var self = this; // 从输入框获取值

    if (this.phone_input) {
      this._phone = this.phone_input.string || "";
    }

    if (this.code_input) {
      this._code = this.code_input.string || "";
    } // 验证输入


    if (!this._validatePhone(this._phone)) {
      this._showMessage("请输入正确的手机号", true);

      return;
    }

    if (!this._validateCode(this._code)) {
      this._showMessage("请输入验证码", true);

      return;
    }

    this._showMessage("正在登录...", false);

    this._setInteractable(false); // 调用登录接口


    this._phoneLoginRequest(this._phone, this._code, function (success, message, data) {
      self._setInteractable(true);

      if (success) {
        self._showMessage("登录成功", false); // 保存用户数据


        if (window.myglobal && window.myglobal.playerData && data) {
          window.myglobal.playerData.uniqueID = data.uniqueID || "";
          window.myglobal.playerData.accountID = data.accountID || "";
          window.myglobal.playerData.nickName = data.nickName || "玩家";
          window.myglobal.playerData.avatarUrl = data.avatarUrl || "";
          window.myglobal.playerData.gobal_count = data.goldcount || 0;
          window.myglobal.playerData.token = data.token || ""; // 保存到本地存储

          window.myglobal.playerData.saveToLocal();
          console.log("【手机登录】用户数据已保存, nickName =", window.myglobal.playerData.nickName); // 🔧【关键修复】登录成功后重新建立带Token的WebSocket连接
          // 解决WebSocket在登录前建立导致PlayerID为0的问题

          if (window.myglobal.socket && window.myglobal.socket.reconnectWithToken) {
            console.log("🔄 【手机登录】重新建立带Token的WebSocket连接...");
            window.myglobal.socket.reconnectWithToken();
          }
        } // 跳转到大厅场景


        self.scheduleOnce(function () {
          self._onCloseClick();

          cc.director.loadScene("hallScene");
        }, 0.5);
      } else {
        self._showMessage(message || "登录失败，请重试", true);
      }
    });
  },
  // 关闭弹窗
  _onCloseClick: function _onCloseClick() {
    if (!this.node || !this.node.isValid) {
      return;
    }

    if (this._countdown > 0) {
      this.unschedule(this._countdownTick);
    }

    this.node.destroy();
  },
  // 验证手机号
  _validatePhone: function _validatePhone(phone) {
    if (!phone || phone.length !== 11) {
      return false;
    } // 简单验证：以1开头的11位数字


    var reg = /^1[3-9]\d{9}$/;
    return reg.test(phone);
  },
  // 验证验证码
  _validateCode: function _validateCode(code) {
    // 保留非空检测，测试阶段不验证格式
    return code && code.length > 0;
  },
  // 开始倒计时
  _startCountdown: function _startCountdown() {
    this._countdown = this.countdown_time;

    this._updateCountdownLabel();

    this.schedule(this._countdownTick, 1);
  },
  // 倒计时每秒回调
  _countdownTick: function _countdownTick() {
    this._countdown--;

    if (this._countdown <= 0) {
      this.unschedule(this._countdownTick);

      this._resetSendCodeBtn();
    } else {
      this._updateCountdownLabel();
    }
  },
  // 更新倒计时标签
  _updateCountdownLabel: function _updateCountdownLabel() {
    if (this.send_code_label) {
      this.send_code_label.string = this._countdown + "秒后重试";
    }

    if (this.send_code_btn) {
      this.send_code_btn.interactable = false;
    }
  },
  // 重置发送验证码按钮
  _resetSendCodeBtn: function _resetSendCodeBtn() {
    if (this.send_code_label) {
      this.send_code_label.string = "获取验证码";
    }

    if (this.send_code_btn) {
      this.send_code_btn.interactable = true;
    }
  },
  // 显示消息
  _showMessage: function _showMessage(message, isError) {
    if (this.message_label) {
      this.message_label.node.active = true;
      this.message_label.string = message;

      if (isError) {
        this.message_label.node.color = new cc.Color(255, 100, 100);
      } else {
        this.message_label.node.color = new cc.Color(100, 200, 100);
      }
    } else {
      console.log(isError ? '[错误]' : '[信息]', message);
    }
  },
  // 隐藏消息
  _hideMessage: function _hideMessage() {
    if (this.message_label) {
      this.message_label.node.active = false;
    }
  },
  // 设置按钮交互状态
  _setInteractable: function _setInteractable(interactable) {
    if (this.login_btn) {
      this.login_btn.interactable = interactable;
    }

    if (this.send_code_btn && this._countdown <= 0) {
      this.send_code_btn.interactable = interactable;
    }
  },
  // 发送验证码请求 - 使用HttpAPI支持加密解密
  _sendCodeRequest: function _sendCodeRequest(phone, callback) {
    var defines = window.defines;

    if (!defines || !defines.apiUrl) {
      callback(true, "发送成功");
      return;
    }

    var url = defines.apiUrl + '/api/v1/auth/send-code';
    var cryptoKey = defines.cryptoKey || ""; // 使用HttpAPI.postEncrypted发送加密请求

    if (window.HttpAPI && window.HttpAPI.postEncrypted) {
      window.HttpAPI.postEncrypted(url, 'send_code', {
        phone: phone
      }, cryptoKey, function (err, result) {
        if (err) {
          console.error("发送验证码失败:", err);
          callback(false, err);
          return;
        }

        if (result && result.code === 0) {
          var msg = "验证码已发送"; // 开发环境：显示验证码

          if (result.data && result.data.code) {
            msg = "验证码: " + result.data.code;
          }

          callback(true, msg);
        } else {
          callback(false, result ? result.message : "发送失败");
        }
      });
    } else {
      // 降级：直接发送请求（不支持解密）
      console.warn("HttpAPI未加载，使用原始请求");
      var xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.timeout = 10000;

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              var response = JSON.parse(xhr.responseText); // 检查是否是加密响应

              if (response.data && response.timestamp && typeof response.data === 'string') {
                callback(false, "服务器返回加密数据，请刷新页面重试");
              } else if (response.code === 0) {
                callback(true, "验证码已发送");
              } else {
                callback(false, response.message || "发送失败");
              }
            } catch (e) {
              callback(false, "解析响应失败");
            }
          } else {
            callback(false, "网络请求失败");
          }
        }
      };

      xhr.ontimeout = function () {
        callback(false, "请求超时");
      };

      xhr.onerror = function () {
        callback(false, "网络错误");
      };

      xhr.send(JSON.stringify({
        phone: phone
      }));
    }
  },
  // 手机号登录请求 - 使用HttpAPI支持加密解密
  _phoneLoginRequest: function _phoneLoginRequest(phone, code, callback) {
    var defines = window.defines;

    if (!defines || !defines.apiUrl) {
      callback(true, "登录成功", {
        uniqueID: "phone_" + phone,
        accountID: "phone_" + phone,
        nickName: "玩家" + phone.substr(-4),
        avatarUrl: "",
        goldcount: 1000,
        token: "mock_token_" + Date.now()
      });
      return;
    }

    var url = defines.apiUrl + '/api/v1/auth/phone-login';
    var cryptoKey = defines.cryptoKey || ""; // 准备请求数据

    var requestData = {
      phone: phone,
      code: code
    }; // 使用HttpAPI.postEncrypted发送加密请求

    if (window.HttpAPI && window.HttpAPI.postEncrypted) {
      window.HttpAPI.postEncrypted(url, 'phone_login', requestData, cryptoKey, function (err, result) {
        if (err) {
          console.error("登录请求失败:", err);
          callback(false, err, null);
          return;
        }

        if (result && result.code === 0 && result.data) {
          callback(true, "登录成功", result.data);
        } else {
          callback(false, result ? result.message : "登录失败", null);
        }
      });
    } else {
      // 降级：直接发送请求
      console.warn("HttpAPI未加载，使用原始请求");
      var self = this;
      var xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-Device-ID', this._getDeviceID());
      xhr.setRequestHeader('X-Device-Type', this._getDeviceType());
      xhr.timeout = 10000;

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              var response = JSON.parse(xhr.responseText);

              if (response.data && response.timestamp && typeof response.data === 'string') {
                // 加密响应，需要解密
                if (window.HttpAPI && window.HttpAPI.decryptAESGCM) {
                  window.HttpAPI.decryptAESGCM(response.data, cryptoKey).then(function (decrypted) {
                    if (decrypted && decrypted.code === 0 && decrypted.data) {
                      callback(true, "登录成功", decrypted.data);
                    } else {
                      callback(false, decrypted ? decrypted.message : "登录失败", null);
                    }
                  })["catch"](function (decryptErr) {
                    console.error("解密失败:", decryptErr);
                    callback(false, "解密响应失败", null);
                  });
                } else {
                  callback(false, "服务器返回加密数据，请刷新页面重试", null);
                }
              } else if (response.code === 0 && response.data) {
                callback(true, "登录成功", response.data);
              } else {
                callback(false, response.message || "登录失败", null);
              }
            } catch (e) {
              console.error("解析响应失败:", e);
              callback(false, "解析响应失败", null);
            }
          } else {
            callback(false, "网络请求失败: HTTP " + xhr.status, null);
          }
        }
      };

      xhr.ontimeout = function () {
        callback(false, "请求超时", null);
      };

      xhr.onerror = function () {
        callback(false, "网络错误", null);
      };

      xhr.send(JSON.stringify(requestData));
    }
  },
  // =============================================
  // 设备信息获取
  // =============================================
  // 获取设备唯一标识
  _getDeviceID: function _getDeviceID() {
    var DEVICE_ID_KEY = "ddz_device_id";
    var deviceId = ""; // 尝试从本地存储获取

    try {
      deviceId = cc.sys.localStorage.getItem(DEVICE_ID_KEY);
    } catch (e) {} // 如果不存在，生成新的设备ID


    if (!deviceId) {
      deviceId = this._generateUUID();

      try {
        cc.sys.localStorage.setItem(DEVICE_ID_KEY, deviceId);
      } catch (e) {}
    }

    return deviceId;
  },
  // 获取设备类型
  _getDeviceType: function _getDeviceType() {
    var platform = cc.sys.platform;
    var os = cc.sys.os;
    var deviceType = "Unknown"; // 根据平台判断

    if (platform === cc.sys.WECHAT_GAME) {
      deviceType = "WeChat";
    } else if (platform === cc.sys.ANDROID) {
      deviceType = "Android";
    } else if (platform === cc.sys.IPHONE) {
      deviceType = "iPhone";
    } else if (platform === cc.sys.IPAD) {
      deviceType = "iPad";
    } else if (platform === cc.sys.MAC_OS) {
      deviceType = "Mac";
    } else if (platform === cc.sys.WINDOWS) {
      deviceType = "Windows";
    } else if (platform === cc.sys.LINUX) {
      deviceType = "Linux";
    } else if (platform === cc.sys.MOBILE_BROWSER) {
      if (os === cc.sys.OS_IOS) {
        deviceType = "iOS Browser";
      } else if (os === cc.sys.OS_ANDROID) {
        deviceType = "Android Browser";
      } else {
        deviceType = "Mobile Browser";
      }
    } else if (platform === cc.sys.DESKTOP_BROWSER) {
      if (os === cc.sys.OS_WINDOWS) {
        deviceType = "Windows Browser";
      } else if (os === cc.sys.OS_OSX) {
        deviceType = "Mac Browser";
      } else if (os === cc.sys.OS_LINUX) {
        deviceType = "Linux Browser";
      } else {
        deviceType = "Desktop Browser";
      }
    } // 添加浏览器信息


    var browserType = cc.sys.browserType;

    if (browserType) {
      deviceType += " (" + browserType + ")";
    }

    return deviceType;
  },
  // 生成UUID
  _generateUUID: function _generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : r & 0x3 | 0x8).toString(16);
    });
    return uuid;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL3ByZWZhYnMvcGhvbmVfbG9naW4uanMiXSwibmFtZXMiOlsiY2MiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJwaG9uZV9pbnB1dCIsInR5cGUiLCJFZGl0Qm94IiwiY29kZV9pbnB1dCIsInNlbmRfY29kZV9idG4iLCJCdXR0b24iLCJsb2dpbl9idG4iLCJjbG9zZV9idG4iLCJ3eF9sb2dpbl9idG4iLCJTcHJpdGUiLCJzZW5kX2NvZGVfbGFiZWwiLCJMYWJlbCIsIm1lc3NhZ2VfbGFiZWwiLCJjb3VudGRvd25fdGltZSIsIkJBU0VfV0lEVEgiLCJCQVNFX0hFSUdIVCIsIm9uTG9hZCIsIl9jb3VudGRvd24iLCJfcGhvbmUiLCJfY29kZSIsImFkYXB0RGlhbG9nIiwic2VsZiIsInZpZXciLCJzZXRSZXNpemVDYWxsYmFjayIsIl9pbml0UGFuZWxBbmltYXRpb24iLCJfZHJhd0lucHV0Qm9yZGVycyIsIl9pbml0RWRpdEJveGVzIiwiX2luaXRCdXR0b25zIiwiX2luaXRXZWNoYXRCdXR0b24iLCJfaGlkZU1lc3NhZ2UiLCJzdHJpbmciLCJzdGF5T25Ub3AiLCJmb250U2l6ZSIsImxpbmVIZWlnaHQiLCJmb250Q29sb3IiLCJDb2xvciIsInBsYWNlaG9sZGVyRm9udENvbG9yIiwibm9kZSIsIm9uIiwiX29uUGhvbmVJbnB1dEZvY3VzIiwiX29uUGhvbmVJbnB1dEJsdXIiLCJlZGl0Ym94IiwiX29uQ29kZUlucHV0Rm9jdXMiLCJfb25Db2RlSW5wdXRCbHVyIiwicGFuZWwiLCJnZXRDaGlsZEJ5TmFtZSIsIndpblciLCJ3aW5TaXplIiwid2lkdGgiLCJ3aW5IIiwiaGVpZ2h0IiwidGFyZ2V0V2lkdGgiLCJNYXRoIiwibWF4IiwibWluIiwic2NhbGUiLCJtYXhTY2FsZVkiLCJjb25zb2xlIiwibG9nIiwicm91bmQiLCJ0b0ZpeGVkIiwiY29udGVudFBhbmVsIiwidGFyZ2V0U2NhbGUiLCJvcGFjaXR5IiwidHdlZW4iLCJ0byIsImVhc2luZyIsInN0YXJ0IiwicGhvbmVCZyIsImdyYXBoaWNzIiwiZ2V0Q29tcG9uZW50IiwiR3JhcGhpY3MiLCJjbGVhciIsImZpbGxDb2xvciIsIl9kcmF3Um91bmRSZWN0IiwiZmlsbCIsInN0cm9rZUNvbG9yIiwibGluZVdpZHRoIiwic3Ryb2tlIiwicGhvbmVJbnB1dCIsInpJbmRleCIsImNvZGVSb3ciLCJjb2RlQmciLCJjb2RlSW5wdXQiLCJkaXZpZGVyIiwibW92ZVRvIiwibGluZVRvIiwieCIsInkiLCJ3IiwiaCIsInIiLCJhcmNUbyIsInd4Q29udGFpbmVyIiwid3hCdG4iLCJOb2RlIiwiRXZlbnRUeXBlIiwiVE9VQ0hfU1RBUlQiLCJUT1VDSF9FTkQiLCJfb25XZWNoYXRMb2dpbkNsaWNrIiwiVE9VQ0hfQ0FOQ0VMIiwiX2NyZWF0ZVdlY2hhdExhYmVsIiwiY29udGFpbmVyIiwiZXhpc3RMYWJlbCIsImxhYmVsTm9kZSIsInBhcmVudCIsImxhYmVsIiwiYWRkQ29tcG9uZW50IiwiZm9udEZhbWlseSIsImhvcml6b250YWxBbGlnbiIsIkhvcml6b250YWxBbGlnbiIsIkNFTlRFUiIsIm9mZiIsIl9vbkNsb3NlQ2xpY2siLCJfb25TZW5kQ29kZUNsaWNrIiwiX29uTG9naW5DbGljayIsIndpbmRvdyIsIm15Z2xvYmFsIiwid2VjaGF0TG9naW4iLCJfc2hvd01lc3NhZ2UiLCJvblBob25lSW5wdXRDaGFuZ2VkIiwiY3VzdG9tRXZlbnREYXRhIiwib25Db2RlSW5wdXRDaGFuZ2VkIiwiX3ZhbGlkYXRlUGhvbmUiLCJfc2V0SW50ZXJhY3RhYmxlIiwiX3NlbmRDb2RlUmVxdWVzdCIsInN1Y2Nlc3MiLCJtZXNzYWdlIiwiX3N0YXJ0Q291bnRkb3duIiwiX3ZhbGlkYXRlQ29kZSIsIl9waG9uZUxvZ2luUmVxdWVzdCIsImRhdGEiLCJwbGF5ZXJEYXRhIiwidW5pcXVlSUQiLCJhY2NvdW50SUQiLCJuaWNrTmFtZSIsImF2YXRhclVybCIsImdvYmFsX2NvdW50IiwiZ29sZGNvdW50IiwidG9rZW4iLCJzYXZlVG9Mb2NhbCIsInNvY2tldCIsInJlY29ubmVjdFdpdGhUb2tlbiIsInNjaGVkdWxlT25jZSIsImRpcmVjdG9yIiwibG9hZFNjZW5lIiwiaXNWYWxpZCIsInVuc2NoZWR1bGUiLCJfY291bnRkb3duVGljayIsImRlc3Ryb3kiLCJwaG9uZSIsImxlbmd0aCIsInJlZyIsInRlc3QiLCJjb2RlIiwiX3VwZGF0ZUNvdW50ZG93bkxhYmVsIiwic2NoZWR1bGUiLCJfcmVzZXRTZW5kQ29kZUJ0biIsImludGVyYWN0YWJsZSIsImlzRXJyb3IiLCJhY3RpdmUiLCJjb2xvciIsImNhbGxiYWNrIiwiZGVmaW5lcyIsImFwaVVybCIsInVybCIsImNyeXB0b0tleSIsIkh0dHBBUEkiLCJwb3N0RW5jcnlwdGVkIiwiZXJyIiwicmVzdWx0IiwiZXJyb3IiLCJtc2ciLCJ3YXJuIiwieGhyIiwiWE1MSHR0cFJlcXVlc3QiLCJvcGVuIiwic2V0UmVxdWVzdEhlYWRlciIsInRpbWVvdXQiLCJvbnJlYWR5c3RhdGVjaGFuZ2UiLCJyZWFkeVN0YXRlIiwic3RhdHVzIiwicmVzcG9uc2UiLCJKU09OIiwicGFyc2UiLCJyZXNwb25zZVRleHQiLCJ0aW1lc3RhbXAiLCJlIiwib250aW1lb3V0Iiwib25lcnJvciIsInNlbmQiLCJzdHJpbmdpZnkiLCJzdWJzdHIiLCJEYXRlIiwibm93IiwicmVxdWVzdERhdGEiLCJfZ2V0RGV2aWNlSUQiLCJfZ2V0RGV2aWNlVHlwZSIsImRlY3J5cHRBRVNHQ00iLCJ0aGVuIiwiZGVjcnlwdGVkIiwiZGVjcnlwdEVyciIsIkRFVklDRV9JRF9LRVkiLCJkZXZpY2VJZCIsInN5cyIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJfZ2VuZXJhdGVVVUlEIiwic2V0SXRlbSIsInBsYXRmb3JtIiwib3MiLCJkZXZpY2VUeXBlIiwiV0VDSEFUX0dBTUUiLCJBTkRST0lEIiwiSVBIT05FIiwiSVBBRCIsIk1BQ19PUyIsIldJTkRPV1MiLCJMSU5VWCIsIk1PQklMRV9CUk9XU0VSIiwiT1NfSU9TIiwiT1NfQU5EUk9JRCIsIkRFU0tUT1BfQlJPV1NFUiIsIk9TX1dJTkRPV1MiLCJPU19PU1giLCJPU19MSU5VWCIsImJyb3dzZXJUeXBlIiwiZCIsImdldFRpbWUiLCJ1dWlkIiwicmVwbGFjZSIsImMiLCJyYW5kb20iLCJmbG9vciIsInRvU3RyaW5nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUVBQSxFQUFFLENBQUNDLEtBQUgsQ0FBUztFQUNMLFdBQVNELEVBQUUsQ0FBQ0UsU0FEUDtFQUdMQyxVQUFVLEVBQUU7SUFDUjtJQUNBQyxXQUFXLEVBQUU7TUFDVEMsSUFBSSxFQUFFTCxFQUFFLENBQUNNLE9BREE7TUFFVCxXQUFTO0lBRkEsQ0FGTDtJQU1SQyxVQUFVLEVBQUU7TUFDUkYsSUFBSSxFQUFFTCxFQUFFLENBQUNNLE9BREQ7TUFFUixXQUFTO0lBRkQsQ0FOSjtJQVdSO0lBQ0FFLGFBQWEsRUFBRTtNQUNYSCxJQUFJLEVBQUVMLEVBQUUsQ0FBQ1MsTUFERTtNQUVYLFdBQVM7SUFGRSxDQVpQO0lBZ0JSQyxTQUFTLEVBQUU7TUFDUEwsSUFBSSxFQUFFTCxFQUFFLENBQUNTLE1BREY7TUFFUCxXQUFTO0lBRkYsQ0FoQkg7SUFvQlJFLFNBQVMsRUFBRTtNQUNQTixJQUFJLEVBQUVMLEVBQUUsQ0FBQ1MsTUFERjtNQUVQLFdBQVM7SUFGRixDQXBCSDtJQXlCUjtJQUNBRyxZQUFZLEVBQUU7TUFDVlAsSUFBSSxFQUFFTCxFQUFFLENBQUNhLE1BREM7TUFFVixXQUFTO0lBRkMsQ0ExQk47SUErQlI7SUFDQUMsZUFBZSxFQUFFO01BQ2JULElBQUksRUFBRUwsRUFBRSxDQUFDZSxLQURJO01BRWIsV0FBUztJQUZJLENBaENUO0lBb0NSQyxhQUFhLEVBQUU7TUFDWFgsSUFBSSxFQUFFTCxFQUFFLENBQUNlLEtBREU7TUFFWCxXQUFTO0lBRkUsQ0FwQ1A7SUF5Q1I7SUFDQUUsY0FBYyxFQUFFLEVBMUNSO0lBNENSO0lBQ0FDLFVBQVUsRUFBRSxHQTdDSjtJ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Z0IsRUFBckIsSUFBMkIsRUFBM0IsR0FBZ0MsQ0FBeEM7TUFDQUwsQ0FBQyxHQUFHL0ssSUFBSSxDQUFDcUwsS0FBTCxDQUFXTixDQUFDLEdBQUcsRUFBZixDQUFKO01BQ0EsT0FBTyxDQUFDSSxDQUFDLEtBQUssR0FBTixHQUFZNUksQ0FBWixHQUFpQkEsQ0FBQyxHQUFHLEdBQUosR0FBVSxHQUE1QixFQUFrQytJLFFBQWxDLENBQTJDLEVBQTNDLENBQVA7SUFDSCxDQUpVLENBQVg7SUFLQSxPQUFPTCxJQUFQO0VBQ0g7QUF6MkJJLENBQVQiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXNDb250ZW50IjpbIi8vIOaJi+acuuWPt+eZu+W9leW8ueeql+aOp+WItuWZqFxuLy8g55So5LqO5aSE55CG5omL5py65Y+36aqM6K+B56CB55m75b2V5Yqf6IO9XG4vLyDorr7orqHpo47moLzvvJrkuK3lm73po47llYbkuJrmo4vniYzvvIjlk43lupTlvI/pgILphY3vvJrlrr3luqY2MCXvvIzpq5jluqboh6rpgILlupTvvIlcblxuY2MuQ2xhc3Moe1xuICAgIGV4dGVuZHM6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgLy8g6L6T5YWl5qGGXG4gICAgICAgIHBob25lX2lucHV0OiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5FZGl0Qm94LFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICBjb2RlX2lucHV0OiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5FZGl0Qm94LFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIOaMiemSrlxuICAgICAgICBzZW5kX2NvZGVfYnRuOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5CdXR0b24sXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIGxvZ2luX2J0bjoge1xuICAgICAgICAgICAgdHlwZTogY2MuQnV0dG9uLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICBjbG9zZV9idG46IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLkJ1dHRvbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcblxuICAgICAgICAvLyDlvq7kv6HnmbvlvZXmjInpkq5cbiAgICAgICAgd3hfbG9naW5fYnRuOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5TcHJpdGUsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g5qCH562+XG4gICAgICAgIHNlbmRfY29kZV9sYWJlbDoge1xuICAgICAgICAgICAgdHlwZTogY2MuTGFiZWwsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIG1lc3NhZ2VfbGFiZWw6IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLkxhYmVsLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIOWAkuiuoeaXtuaXtumXtFxuICAgICAgICBjb3VudGRvd25fdGltZTogNjAsXG5cbiAgICAgICAgLy8g5Z+65YeG6K6+6K6h5bC65a+477yI55So5LqO6K6h566Xc2NhbGXvvIlcbiAgICAgICAgQkFTRV9XSURUSDogNDAwLFxuICAgICAgICBCQVNFX0hFSUdIVDogNTIwXG4gICAgfSxcblxuICAgIG9uTG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX2NvdW50ZG93biA9IDA7XG4gICAgICAgIHRoaXMuX3Bob25lID0gXCJcIjtcbiAgICAgICAgdGhpcy5fY29kZSA9IFwiXCI7XG5cbiAgICAgICAgLy8g56uL5Y2z5omn6KGM5by556qX5bC65a+46YCC6YWNXG4gICAgICAgIHRoaXMuYWRhcHREaWFsb2coKTtcblxuICAgICAgICAvLyDnm5HlkKzlsY/luZXlsLrlr7jlj5jljJZcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBjYy52aWV3LnNldFJlc2l6ZUNhbGxiYWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5hZGFwdERpYWxvZygpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyDliJ3lp4vljJblvLnnqpfliqjnlLtcbiAgICAgICAgdGhpcy5faW5pdFBhbmVsQW5pbWF0aW9uKCk7XG4gICAgICAgIFxuICAgICAgICAvLyDnu5jliLblnIbop5LovpPlhaXmoYbovrnmoYZcbiAgICAgICAgdGhpcy5fZHJhd0lucHV0Qm9yZGVycygpO1xuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5Yid5aeL5YyWIEVkaXRCb3gg5qC35byP5ZKM5LqL5Lu2ID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHRoaXMuX2luaXRFZGl0Qm94ZXMoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWIneWni+WMluaMiemSruS6i+S7tlxuICAgICAgICB0aGlzLl9pbml0QnV0dG9ucygpO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yid5aeL5YyW5b6u5L+h55m75b2V5oyJ6ZKuXG4gICAgICAgIHRoaXMuX2luaXRXZWNoYXRCdXR0b24oKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2hpZGVNZXNzYWdlKCk7XG5cbiAgICAgICAgLy8g6I635Y+W6L6T5YWl5qGG5Yid5aeL5YC8XG4gICAgICAgIGlmICh0aGlzLnBob25lX2lucHV0KSB7XG4gICAgICAgICAgICB0aGlzLl9waG9uZSA9IHRoaXMucGhvbmVfaW5wdXQuc3RyaW5nIHx8IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY29kZV9pbnB1dCkge1xuICAgICAgICAgICAgdGhpcy5fY29kZSA9IHRoaXMuY29kZV9pbnB1dC5zdHJpbmcgfHwgXCJcIjtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDliJ3lp4vljJYgRWRpdEJveCA9PT09PT09PT09PT09PT09PT09PVxuICAgIF9pbml0RWRpdEJveGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgLy8g5omL5py65Y+36L6T5YWl5qGG5Yid5aeL5YyWXG4gICAgICAgIGlmICh0aGlzLnBob25lX2lucHV0KSB7XG4gICAgICAgICAgICAvLyDorr7nva4gc3RheU9uVG9wIOS4uiB0cnVl77yM56Gu5L+d5paH5a2X5aeL57uI5Y+v6KeBXG4gICAgICAgICAgICB0aGlzLnBob25lX2lucHV0LnN0YXlPblRvcCA9IHRydWU7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOiuvue9ruWtl+S9k+agt+W8j1xuICAgICAgICAgICAgdGhpcy5waG9uZV9pbnB1dC5mb250U2l6ZSA9IDIwO1xuICAgICAgICAgICAgdGhpcy5waG9uZV9pbnB1dC5saW5lSGVpZ2h0ID0gNDA7XG4gICAgICAgICAgICB0aGlzLnBob25lX2lucHV0LmZvbnRDb2xvciA9IG5ldyBjYy5Db2xvcig1MCwgNTAsIDUwLCAyNTUpO1xuICAgICAgICAgICAgdGhpcy5waG9uZV9pbnB1dC5wbGFjZWhvbGRlckZvbnRDb2xvciA9IG5ldyBjYy5Db2xvcigxNTAsIDE1MCwgMTUwLCAyNTUpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDnm5HlkKzovpPlhaXkuovku7ZcbiAgICAgICAgICAgIHRoaXMucGhvbmVfaW5wdXQubm9kZS5vbignZWRpdGluZy1kaWQtYmVnYW4nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9vblBob25lSW5wdXRGb2N1cygpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMucGhvbmVfaW5wdXQubm9kZS5vbignZWRpdGluZy1kaWQtZW5kZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9vblBob25lSW5wdXRCbHVyKCk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5waG9uZV9pbnB1dC5ub2RlLm9uKCd0ZXh0LWNoYW5nZWQnLCBmdW5jdGlvbihlZGl0Ym94KSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fcGhvbmUgPSBlZGl0Ym94LnN0cmluZztcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDpqozor4HnoIHovpPlhaXmoYbliJ3lp4vljJZcbiAgICAgICAgaWYgKHRoaXMuY29kZV9pbnB1dCkge1xuICAgICAgICAgICAgLy8g6K6+572uIHN0YXlPblRvcCDkuLogdHJ1Ze+8jOehruS/neaWh+Wtl+Wni+e7iOWPr+ingVxuICAgICAgICAgICAgdGhpcy5jb2RlX2lucHV0LnN0YXlPblRvcCA9IHRydWU7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOiuvue9ruWtl+S9k+agt+W8j1xuICAgICAgICAgICAgdGhpcy5jb2RlX2lucHV0LmZvbnRTaXplID0gMjA7XG4gICAgICAgICAgICB0aGlzLmNvZGVfaW5wdXQubGluZUhlaWdodCA9IDQwO1xuICAgICAgICAgICAgdGhpcy5jb2RlX2lucHV0LmZvbnRDb2xvciA9IG5ldyBjYy5Db2xvcig1MCwgNTAsIDUwLCAyNTUpO1xuICAgICAgICAgICAgdGhpcy5jb2RlX2lucHV0LnBsYWNlaG9sZGVyRm9udENvbG9yID0gbmV3IGNjLkNvbG9yKDE1MCwgMTUwLCAxNTAsIDI1NSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOebkeWQrOi+k+WFpeS6i+S7tlxuICAgICAgICAgICAgdGhpcy5jb2RlX2lucHV0Lm5vZGUub24oJ2VkaXRpbmctZGlkLWJlZ2FuJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fb25Db2RlSW5wdXRGb2N1cygpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuY29kZV9pbnB1dC5ub2RlLm9uKCdlZGl0aW5nLWRpZC1lbmRlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX29uQ29kZUlucHV0Qmx1cigpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuY29kZV9pbnB1dC5ub2RlLm9uKCd0ZXh0LWNoYW5nZWQnLCBmdW5jdGlvbihlZGl0Ym94KSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fY29kZSA9IGVkaXRib3guc3RyaW5nO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vIOaJi+acuuWPt+i+k+WFpeahhuiOt+W+l+eEpueCuVxuICAgIF9vblBob25lSW5wdXRGb2N1czogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOWPr+S7pea3u+WKoOeEpueCueaViOaenFxuICAgIH0sXG4gICAgXG4gICAgLy8g5omL5py65Y+36L6T5YWl5qGG5aSx5Y6754Sm54K5XG4gICAgX29uUGhvbmVJbnB1dEJsdXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDnoa7kv53mloflrZfmmL7npLpcbiAgICAgICAgaWYgKHRoaXMucGhvbmVfaW5wdXQgJiYgdGhpcy5waG9uZV9pbnB1dC5zdHJpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuX3Bob25lID0gdGhpcy5waG9uZV9pbnB1dC5zdHJpbmc7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vIOmqjOivgeeggei+k+WFpeahhuiOt+W+l+eEpueCuVxuICAgIF9vbkNvZGVJbnB1dEZvY3VzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g5Y+v5Lul5re75Yqg54Sm54K55pWI5p6cXG4gICAgfSxcbiAgICBcbiAgICAvLyDpqozor4HnoIHovpPlhaXmoYblpLHljrvnhKbngrlcbiAgICBfb25Db2RlSW5wdXRCbHVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g56Gu5L+d5paH5a2X5pi+56S6XG4gICAgICAgIGlmICh0aGlzLmNvZGVfaW5wdXQgJiYgdGhpcy5jb2RlX2lucHV0LnN0cmluZykge1xuICAgICAgICAgICAgdGhpcy5fY29kZSA9IHRoaXMuY29kZV9pbnB1dC5zdHJpbmc7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g5ZON5bqU5byP6YCC6YWN77ya5a695bqmPeWxj+W5lTYwJe+8jOacgOWwjzMwMO+8jOmrmOW6puaMieavlOS+i1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGFkYXB0RGlhbG9nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBhbmVsID0gdGhpcy5ub2RlLmdldENoaWxkQnlOYW1lKCdjb250ZW50X3BhbmVsJyk7XG4gICAgICAgIGlmICghcGFuZWwpIHJldHVybjtcblxuICAgICAgICB2YXIgd2luVyA9IGNjLndpblNpemUud2lkdGg7XG4gICAgICAgIHZhciB3aW5IID0gY2Mud2luU2l6ZS5oZWlnaHQ7XG5cbiAgICAgICAgLy8g55uu5qCH5a695bqmID0g5bGP5bmV5a695bqmICogNjAlXG4gICAgICAgIHZhciB0YXJnZXRXaWR0aCA9IHdpblcgKiAwLjY7XG4gICAgICAgIFxuICAgICAgICAvLyDmnIDlsI/lrr3luqYzMDDvvIzmnIDlpKflrr3luqbkuI3otoXov4flsY/luZU4MCVcbiAgICAgICAgdGFyZ2V0V2lkdGggPSBNYXRoLm1heCgzMDAsIE1hdGgubWluKHRhcmdldFdpZHRoLCB3aW5XICogMC44KSk7XG4gICAgICAgIFxuICAgICAgICAvLyDorqHnrpfnvKnmlL7mr5TkvotcbiAgICAgICAgdmFyIHNjYWxlID0gdGFyZ2V0V2lkdGggLyB0aGlzLkJBU0VfV0lEVEg7XG4gICAgICAgIFxuICAgICAgICAvLyDnoa7kv53pq5jluqbkuI3otoXlh7rlsY/luZXvvIjnlZnlh7oxMCXovrnot53vvIlcbiAgICAgICAgdmFyIG1heFNjYWxlWSA9ICh3aW5IICogMC44KSAvIHRoaXMuQkFTRV9IRUlHSFQ7XG4gICAgICAgIHNjYWxlID0gTWF0aC5taW4oc2NhbGUsIG1heFNjYWxlWSk7XG4gICAgICAgIFxuICAgICAgICAvLyDpmZDliLbnvKnmlL7ojIPlm7QgWzAuNywgMS4zXVxuICAgICAgICBzY2FsZSA9IE1hdGgubWF4KDAuNywgTWF0aC5taW4oc2NhbGUsIDEuMykpO1xuXG4gICAgICAgIC8vIOW6lOeUqOe8qeaUvlxuICAgICAgICBwYW5lbC5zY2FsZSA9IHNjYWxlO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKCfjgJDnmbvlvZXlvLnnqpfjgJHlsY/luZU6Jywgd2luVywgJ3gnLCB3aW5ILCBcbiAgICAgICAgICAgICAgICAgICAgJ+ebruagh+WuveW6pjonLCBNYXRoLnJvdW5kKHRhcmdldFdpZHRoKSwgXG4gICAgICAgICAgICAgICAgICAgICfnvKnmlL46Jywgc2NhbGUudG9GaXhlZCgyKSxcbiAgICAgICAgICAgICAgICAgICAgJ+WunumZheWwuuWvuDonLCBNYXRoLnJvdW5kKHRoaXMuQkFTRV9XSURUSCAqIHNjYWxlKSwgJ3gnLCBNYXRoLnJvdW5kKHRoaXMuQkFTRV9IRUlHSFQgKiBzY2FsZSkpO1xuICAgIH0sXG5cbiAgICAvLyDliJ3lp4vljJblvLnnqpfov5vlhaXliqjnlLtcbiAgICBfaW5pdFBhbmVsQW5pbWF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNvbnRlbnRQYW5lbCA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZSgnY29udGVudF9wYW5lbCcpO1xuICAgICAgICBpZiAoY29udGVudFBhbmVsKSB7XG4gICAgICAgICAgICAvLyDkv53lrZjnm67moIfnvKnmlL7lgLzvvIjlt7LnlLFfaW5pdFBhbmVsU2NhbGXorr7nva7vvIlcbiAgICAgICAgICAgIHZhciB0YXJnZXRTY2FsZSA9IGNvbnRlbnRQYW5lbC5zY2FsZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5LuO5bCP5bC65a+45byA5aeL5Yqo55S7XG4gICAgICAgICAgICBjb250ZW50UGFuZWwuc2NhbGUgPSB0YXJnZXRTY2FsZSAqIDAuNztcbiAgICAgICAgICAgIGNvbnRlbnRQYW5lbC5vcGFjaXR5ID0gMDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2MudHdlZW4oY29udGVudFBhbmVsKVxuICAgICAgICAgICAgICAgIC50bygwLjI1LCB7IHNjYWxlOiB0YXJnZXRTY2FsZSwgb3BhY2l0eTogMjU1IH0sIHsgZWFzaW5nOiAnYmFja091dCcgfSlcbiAgICAgICAgICAgICAgICAuc3RhcnQoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDnu5jliLbovpPlhaXmoYblnIbop5LovrnmoYYgLSDkv67lpI3niYjvvJrnu5jliLbog4zmma8gKyDovrnmoYZcbiAgICBfZHJhd0lucHV0Qm9yZGVyczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb250ZW50UGFuZWwgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoJ2NvbnRlbnRfcGFuZWwnKTtcbiAgICAgICAgaWYgKCFjb250ZW50UGFuZWwpIHJldHVybjtcblxuICAgICAgICAvLyDnu5jliLbmiYvmnLrlj7fovpPlhaXmoYbog4zmma/lkozovrnmoYYgKDMyMHg1MClcbiAgICAgICAgdmFyIHBob25lQmcgPSBjb250ZW50UGFuZWwuZ2V0Q2hpbGRCeU5hbWUoJ3Bob25lX2JnJyk7XG4gICAgICAgIGlmIChwaG9uZUJnKSB7XG4gICAgICAgICAgICB2YXIgZ3JhcGhpY3MgPSBwaG9uZUJnLmdldENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgICAgICBpZiAoZ3JhcGhpY3MpIHtcbiAgICAgICAgICAgICAgICBncmFwaGljcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgIC8vIOWFiOe7mOWItuWhq+WFheiDjOaZr++8iOWNiumAj+aYjueZveiJsu+8iVxuICAgICAgICAgICAgICAgIGdyYXBoaWNzLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1MiwgMjQwLCAyMzApO1xuICAgICAgICAgICAgICAgIHRoaXMuX2RyYXdSb3VuZFJlY3QoZ3JhcGhpY3MsIC0xNjAsIC0yNSwgMzIwLCA1MCwgMTQpO1xuICAgICAgICAgICAgICAgIGdyYXBoaWNzLmZpbGwoKTtcbiAgICAgICAgICAgICAgICAvLyDlho3nu5jliLbovrnmoYbvvIjph5HoibLvvIlcbiAgICAgICAgICAgICAgICBncmFwaGljcy5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigyMTgsIDE2NSwgMzIsIDI1NSk7XG4gICAgICAgICAgICAgICAgZ3JhcGhpY3MubGluZVdpZHRoID0gMjtcbiAgICAgICAgICAgICAgICB0aGlzLl9kcmF3Um91bmRSZWN0KGdyYXBoaWNzLCAtMTYwLCAtMjUsIDMyMCwgNTAsIDE0KTtcbiAgICAgICAgICAgICAgICBncmFwaGljcy5zdHJva2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g56Gu5L+dIHBob25lX2JnIOiKgueCueWcqCBpbnB1dCDoioLngrnkuIvmlrlcbiAgICAgICAgICAgIHZhciBwaG9uZUlucHV0ID0gcGhvbmVCZy5nZXRDaGlsZEJ5TmFtZSgncGhvbmVfaW5wdXQnKTtcbiAgICAgICAgICAgIGlmIChwaG9uZUlucHV0KSB7XG4gICAgICAgICAgICAgICAgcGhvbmVJbnB1dC56SW5kZXggPSAxMDtcbiAgICAgICAgICAgICAgICBwaG9uZUJnLnpJbmRleCA9IDU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDnu5jliLbpqozor4HnoIHovpPlhaXmoYbog4zmma/lkozovrnmoYYgKDE5MHg1MClcbiAgICAgICAgdmFyIGNvZGVSb3cgPSBjb250ZW50UGFuZWwuZ2V0Q2hpbGRCeU5hbWUoJ2NvZGVfcm93Jyk7XG4gICAgICAgIGlmIChjb2RlUm93KSB7XG4gICAgICAgICAgICB2YXIgY29kZUJnID0gY29kZVJvdy5nZXRDaGlsZEJ5TmFtZSgnY29kZV9iZycpO1xuICAgICAgICAgICAgaWYgKGNvZGVCZykge1xuICAgICAgICAgICAgICAgIHZhciBncmFwaGljcyA9IGNvZGVCZy5nZXRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICAgICAgICAgIGlmIChncmFwaGljcykge1xuICAgICAgICAgICAgICAgICAgICBncmFwaGljcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAvLyDlhYjnu5jliLbloavlhYXog4zmma/vvIjljYrpgI/mmI7nmb3oibLvvIlcbiAgICAgICAgICAgICAgICAgICAgZ3JhcGhpY3MuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjUyLCAyNDAsIDIzMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2RyYXdSb3VuZFJlY3QoZ3JhcGhpY3MsIC05NSwgLTI1LCAxOTAsIDUwLCAxNCk7XG4gICAgICAgICAgICAgICAgICAgIGdyYXBoaWNzLmZpbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8g5YaN57uY5Yi26L655qGG77yI6YeR6Imy77yJXG4gICAgICAgICAgICAgICAgICAgIGdyYXBoaWNzLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDIxOCwgMTY1LCAzMiwgMjU1KTtcbiAgICAgICAgICAgICAgICAgICAgZ3JhcGhpY3MubGluZVdpZHRoID0gMjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZHJhd1JvdW5kUmVjdChncmFwaGljcywgLTk1LCAtMjUsIDE5MCwgNTAsIDE0KTtcbiAgICAgICAgICAgICAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOehruS/nSBjb2RlX2JnIOiKgueCueWcqCBpbnB1dCDoioLngrnkuIvmlrlcbiAgICAgICAgICAgICAgICB2YXIgY29kZUlucHV0ID0gY29kZUJnLmdldENoaWxkQnlOYW1lKCdjb2RlX2lucHV0Jyk7XG4gICAgICAgICAgICAgICAgaWYgKGNvZGVJbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICBjb2RlSW5wdXQuekluZGV4ID0gMTA7XG4gICAgICAgICAgICAgICAgICAgIGNvZGVCZy56SW5kZXggPSA1O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOe7mOWItuWIhuWJsue6v1xuICAgICAgICB2YXIgZGl2aWRlciA9IGNvbnRlbnRQYW5lbC5nZXRDaGlsZEJ5TmFtZSgnZGl2aWRlcicpO1xuICAgICAgICBpZiAoZGl2aWRlcikge1xuICAgICAgICAgICAgdmFyIGdyYXBoaWNzID0gZGl2aWRlci5nZXRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICAgICAgaWYgKGdyYXBoaWNzKSB7XG4gICAgICAgICAgICAgICAgZ3JhcGhpY3MuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICBncmFwaGljcy5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigyMDAsIDE4MCwgMTQwLCAxODApO1xuICAgICAgICAgICAgICAgIGdyYXBoaWNzLmxpbmVXaWR0aCA9IDE7XG4gICAgICAgICAgICAgICAgZ3JhcGhpY3MubW92ZVRvKC0xNzAsIDApO1xuICAgICAgICAgICAgICAgIGdyYXBoaWNzLmxpbmVUbygxNzAsIDApO1xuICAgICAgICAgICAgICAgIGdyYXBoaWNzLnN0cm9rZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOe7mOWItuWchuinkuefqeW9olxuICAgIF9kcmF3Um91bmRSZWN0OiBmdW5jdGlvbihncmFwaGljcywgeCwgeSwgdywgaCwgcikge1xuICAgICAgICBncmFwaGljcy5tb3ZlVG8oeCArIHIsIHkpO1xuICAgICAgICBncmFwaGljcy5saW5lVG8oeCArIHcgLSByLCB5KTtcbiAgICAgICAgZ3JhcGhpY3MuYXJjVG8oeCArIHcsIHksIHggKyB3LCB5ICsgciwgcik7XG4gICAgICAgIGdyYXBoaWNzLmxpbmVUbyh4ICsgdywgeSArIGggLSByKTtcbiAgICAgICAgZ3JhcGhpY3MuYXJjVG8oeCArIHcsIHkgKyBoLCB4ICsgdyAtIHIsIHkgKyBoLCByKTtcbiAgICAgICAgZ3JhcGhpY3MubGluZVRvKHggKyByLCB5ICsgaCk7XG4gICAgICAgIGdyYXBoaWNzLmFyY1RvKHgsIHkgKyBoLCB4LCB5ICsgaCAtIHIsIHIpO1xuICAgICAgICBncmFwaGljcy5saW5lVG8oeCwgeSArIHIpO1xuICAgICAgICBncmFwaGljcy5hcmNUbyh4LCB5LCB4ICsgciwgeSwgcik7XG4gICAgfSxcblxuICAgIC8vIOWIneWni+WMluW+ruS/oeeZu+W9leaMiemSrlxuICAgIF9pbml0V2VjaGF0QnV0dG9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNvbnRlbnRQYW5lbCA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZSgnY29udGVudF9wYW5lbCcpO1xuICAgICAgICBpZiAoIWNvbnRlbnRQYW5lbCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciB3eENvbnRhaW5lciA9IGNvbnRlbnRQYW5lbC5nZXRDaGlsZEJ5TmFtZSgnd3hfbG9naW5fY29udGFpbmVyJyk7XG4gICAgICAgIGlmICh3eENvbnRhaW5lcikge1xuICAgICAgICAgICAgdmFyIHd4QnRuID0gd3hDb250YWluZXIuZ2V0Q2hpbGRCeU5hbWUoJ3d4X2xvZ2luX2J0bicpO1xuICAgICAgICAgICAgaWYgKHd4QnRuKSB7XG4gICAgICAgICAgICAgICAgLy8g5re75Yqg5oyJ6ZKu54K55Ye75pWI5p6cXG4gICAgICAgICAgICAgICAgd3hCdG4ub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfU1RBUlQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB3eEJ0bi5zY2FsZSA9IDAuOTU7XG4gICAgICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd3hCdG4ub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgd3hCdG4uc2NhbGUgPSAxO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9vbldlY2hhdExvZ2luQ2xpY2soKTtcbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3eEJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9DQU5DRUwsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB3eEJ0bi5zY2FsZSA9IDE7XG4gICAgICAgICAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgICAgICAgICAvLyDmt7vliqBcIuW+ruS/oeeZu+W9lVwi5paH5a2X5qCH562+XG4gICAgICAgICAgICAgICAgdGhpcy5fY3JlYXRlV2VjaGF0TGFiZWwod3hDb250YWluZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOWIm+W7uuW+ruS/oeeZu+W9leaWh+Wtl+agh+etvlxuICAgIF9jcmVhdGVXZWNoYXRMYWJlbDogZnVuY3Rpb24oY29udGFpbmVyKSB7XG4gICAgICAgIC8vIOajgOafpeaYr+WQpuW3suWtmOWcqOagh+etvlxuICAgICAgICB2YXIgZXhpc3RMYWJlbCA9IGNvbnRhaW5lci5nZXRDaGlsZEJ5TmFtZSgnd3hfbG9naW5fbGFiZWwnKTtcbiAgICAgICAgaWYgKGV4aXN0TGFiZWwpIHJldHVybjtcblxuICAgICAgICB2YXIgbGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoJ3d4X2xvZ2luX2xhYmVsJyk7XG4gICAgICAgIGxhYmVsTm9kZS5wYXJlbnQgPSBjb250YWluZXI7XG4gICAgICAgIGxhYmVsTm9kZS55ID0gLTM1O1xuXG4gICAgICAgIHZhciBsYWJlbCA9IGxhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBsYWJlbC5zdHJpbmcgPSAn5b6u5L+h55m75b2VJztcbiAgICAgICAgbGFiZWwuZm9udFNpemUgPSAxODtcbiAgICAgICAgbGFiZWwubGluZUhlaWdodCA9IDIyO1xuICAgICAgICBsYWJlbC5mb250RmFtaWx5ID0gJ0FyaWFsJztcbiAgICAgICAgbGFiZWwuZm9udENvbG9yID0gbmV3IGNjLkNvbG9yKDEyMCwgMTAwLCA4MCwgMjU1KTtcbiAgICAgICAgbGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICB9LFxuXG4gICAgX2luaXRCdXR0b25zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIC8vIOWFs+mXreaMiemSrlxuICAgICAgICBpZiAodGhpcy5jbG9zZV9idG4pIHtcbiAgICAgICAgICAgIHRoaXMuY2xvc2VfYnRuLm5vZGUub2ZmKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCk7XG4gICAgICAgICAgICB0aGlzLmNsb3NlX2J0bi5ub2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fb25DbG9zZUNsaWNrKCk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWPkemAgemqjOivgeeggeaMiemSrlxuICAgICAgICBpZiAodGhpcy5zZW5kX2NvZGVfYnRuKSB7XG4gICAgICAgICAgICB0aGlzLnNlbmRfY29kZV9idG4ubm9kZS5vZmYoY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5EKTtcbiAgICAgICAgICAgIHRoaXMuc2VuZF9jb2RlX2J0bi5ub2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fb25TZW5kQ29kZUNsaWNrKCk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOeZu+W9leaMiemSrlxuICAgICAgICBpZiAodGhpcy5sb2dpbl9idG4pIHtcbiAgICAgICAgICAgIHRoaXMubG9naW5fYnRuLm5vZGUub2ZmKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCk7XG4gICAgICAgICAgICB0aGlzLmxvZ2luX2J0bi5ub2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fb25Mb2dpbkNsaWNrKCk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDlvq7kv6HnmbvlvZXngrnlh7tcbiAgICBfb25XZWNoYXRMb2dpbkNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ+OAkOW+ruS/oeeZu+W9leOAkeeCueWHu+W+ruS/oeeZu+W9leaMiemSricpO1xuICAgICAgICBcbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm5pyJ5YWo5bGA55qE5b6u5L+h55m75b2V5pa55rOVXG4gICAgICAgIGlmICh3aW5kb3cubXlnbG9iYWwgJiYgd2luZG93Lm15Z2xvYmFsLndlY2hhdExvZ2luKSB7XG4gICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwud2VjaGF0TG9naW4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOmZjee6p++8muaPkOekuueUqOaIt1xuICAgICAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2UoJ+W+ruS/oeeZu+W9leWKn+iDveaaguacquW8gOaUvicsIHRydWUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOaJi+acuuWPt+i+k+WFpeWPmOWMllxuICAgIG9uUGhvbmVJbnB1dENoYW5nZWQ6IGZ1bmN0aW9uKGVkaXRib3gsIGN1c3RvbUV2ZW50RGF0YSkge1xuICAgICAgICB0aGlzLl9waG9uZSA9IGVkaXRib3guc3RyaW5nO1xuICAgIH0sXG5cbiAgICAvLyDpqozor4HnoIHovpPlhaXlj5jljJZcbiAgICBvbkNvZGVJbnB1dENoYW5nZWQ6IGZ1bmN0aW9uKGVkaXRib3gsIGN1c3RvbUV2ZW50RGF0YSkge1xuICAgICAgICB0aGlzLl9jb2RlID0gZWRpdGJveC5zdHJpbmc7XG4gICAgfSxcblxuICAgIC8vIOWPkemAgemqjOivgeeggVxuICAgIF9vblNlbmRDb2RlQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgaWYgKHRoaXMuX2NvdW50ZG93biA+IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS7jui+k+WFpeahhuiOt+WPluaJi+acuuWPt1xuICAgICAgICBpZiAodGhpcy5waG9uZV9pbnB1dCkge1xuICAgICAgICAgICAgdGhpcy5fcGhvbmUgPSB0aGlzLnBob25lX2lucHV0LnN0cmluZyB8fCBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6aqM6K+B5omL5py65Y+3XG4gICAgICAgIGlmICghdGhpcy5fdmFsaWRhdGVQaG9uZSh0aGlzLl9waG9uZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dNZXNzYWdlKFwi6K+36L6T5YWl5q2j56Gu55qE5omL5py65Y+3XCIsIHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2UoXCLmraPlnKjlj5HpgIEuLi5cIiwgZmFsc2UpO1xuICAgICAgICB0aGlzLl9zZXRJbnRlcmFjdGFibGUoZmFsc2UpO1xuXG4gICAgICAgIC8vIOiwg+eUqOWPkemAgemqjOivgeeggeaOpeWPo1xuICAgICAgICB0aGlzLl9zZW5kQ29kZVJlcXVlc3QodGhpcy5fcGhvbmUsIGZ1bmN0aW9uKHN1Y2Nlc3MsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHNlbGYuX3NldEludGVyYWN0YWJsZSh0cnVlKTtcblxuICAgICAgICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdGFydENvdW50ZG93bigpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlKFwi6aqM6K+B56CB5bey5Y+R6YCBXCIsIGZhbHNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2UobWVzc2FnZSB8fCBcIuWPkemAgeWksei0pe+8jOivt+mHjeivlVwiLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8vIOeZu+W9lVxuICAgIF9vbkxvZ2luQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgLy8g5LuO6L6T5YWl5qGG6I635Y+W5YC8XG4gICAgICAgIGlmICh0aGlzLnBob25lX2lucHV0KSB7XG4gICAgICAgICAgICB0aGlzLl9waG9uZSA9IHRoaXMucGhvbmVfaW5wdXQuc3RyaW5nIHx8IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY29kZV9pbnB1dCkge1xuICAgICAgICAgICAgdGhpcy5fY29kZSA9IHRoaXMuY29kZV9pbnB1dC5zdHJpbmcgfHwgXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOmqjOivgei+k+WFpVxuICAgICAgICBpZiAoIXRoaXMuX3ZhbGlkYXRlUGhvbmUodGhpcy5fcGhvbmUpKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93TWVzc2FnZShcIuivt+i+k+WFpeato+ehrueahOaJi+acuuWPt1wiLCB0cnVlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5fdmFsaWRhdGVDb2RlKHRoaXMuX2NvZGUpKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93TWVzc2FnZShcIuivt+i+k+WFpemqjOivgeeggVwiLCB0cnVlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3Nob3dNZXNzYWdlKFwi5q2j5Zyo55m75b2VLi4uXCIsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5fc2V0SW50ZXJhY3RhYmxlKGZhbHNlKTtcblxuICAgICAgICAvLyDosIPnlKjnmbvlvZXmjqXlj6NcbiAgICAgICAgdGhpcy5fcGhvbmVMb2dpblJlcXVlc3QodGhpcy5fcGhvbmUsIHRoaXMuX2NvZGUsIGZ1bmN0aW9uKHN1Y2Nlc3MsIG1lc3NhZ2UsIGRhdGEpIHtcbiAgICAgICAgICAgIHNlbGYuX3NldEludGVyYWN0YWJsZSh0cnVlKTtcblxuICAgICAgICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZShcIueZu+W9leaIkOWKn1wiLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAvLyDkv53lrZjnlKjmiLfmlbDmja5cbiAgICAgICAgICAgICAgICBpZiAod2luZG93Lm15Z2xvYmFsICYmIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhICYmIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEudW5pcXVlSUQgPSBkYXRhLnVuaXF1ZUlEIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRCA9IGRhdGEuYWNjb3VudElEIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLm5pY2tOYW1lID0gZGF0YS5uaWNrTmFtZSB8fCBcIueOqeWutlwiO1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5hdmF0YXJVcmwgPSBkYXRhLmF2YXRhclVybCB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5nb2JhbF9jb3VudCA9IGRhdGEuZ29sZGNvdW50IHx8IDA7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnRva2VuID0gZGF0YS50b2tlbiB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAvLyDkv53lrZjliLDmnKzlnLDlrZjlgqhcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuc2F2ZVRvTG9jYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLjgJDmiYvmnLrnmbvlvZXjgJHnlKjmiLfmlbDmja7lt7Lkv53lrZgsIG5pY2tOYW1lID1cIiwgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEubmlja05hbWUpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeeZu+W9leaIkOWKn+WQjumHjeaWsOW7uueri+W4plRva2Vu55qEV2ViU29ja2V06L+e5o6lXG4gICAgICAgICAgICAgICAgICAgIC8vIOino+WGs1dlYlNvY2tldOWcqOeZu+W9leWJjeW7uueri+WvvOiHtFBsYXllcklE5Li6MOeahOmXrumimFxuICAgICAgICAgICAgICAgICAgICBpZiAod2luZG93Lm15Z2xvYmFsLnNvY2tldCAmJiB3aW5kb3cubXlnbG9iYWwuc29ja2V0LnJlY29ubmVjdFdpdGhUb2tlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn5SEIOOAkOaJi+acuueZu+W9leOAkemHjeaWsOW7uueri+W4plRva2Vu55qEV2ViU29ja2V06L+e5o6lLi4uXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnNvY2tldC5yZWNvbm5lY3RXaXRoVG9rZW4oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOi3s+i9rOWIsOWkp+WOheWcuuaZr1xuICAgICAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9vbkNsb3NlQ2xpY2soKTtcbiAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwiaGFsbFNjZW5lXCIpO1xuICAgICAgICAgICAgICAgIH0sIDAuNSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlKG1lc3NhZ2UgfHwgXCLnmbvlvZXlpLHotKXvvIzor7fph43or5VcIiwgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvLyDlhbPpl63lvLnnqpdcbiAgICBfb25DbG9zZUNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLm5vZGUgfHwgIXRoaXMubm9kZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2NvdW50ZG93biA+IDApIHtcbiAgICAgICAgICAgIHRoaXMudW5zY2hlZHVsZSh0aGlzLl9jb3VudGRvd25UaWNrKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm5vZGUuZGVzdHJveSgpO1xuICAgIH0sXG5cbiAgICAvLyDpqozor4HmiYvmnLrlj7dcbiAgICBfdmFsaWRhdGVQaG9uZTogZnVuY3Rpb24ocGhvbmUpIHtcbiAgICAgICAgaWYgKCFwaG9uZSB8fCBwaG9uZS5sZW5ndGggIT09IDExKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8g566A5Y2V6aqM6K+B77ya5LulMeW8gOWktOeahDEx5L2N5pWw5a2XXG4gICAgICAgIHZhciByZWcgPSAvXjFbMy05XVxcZHs5fSQvO1xuICAgICAgICByZXR1cm4gcmVnLnRlc3QocGhvbmUpO1xuICAgIH0sXG5cbiAgICAvLyDpqozor4Hpqozor4HnoIFcbiAgICBfdmFsaWRhdGVDb2RlOiBmdW5jdGlvbihjb2RlKSB7XG4gICAgICAgIC8vIOS/neeVmemdnuepuuajgOa1i++8jOa1i+ivlemYtuauteS4jemqjOivgeagvOW8j1xuICAgICAgICByZXR1cm4gY29kZSAmJiBjb2RlLmxlbmd0aCA+IDA7XG4gICAgfSxcblxuICAgIC8vIOW8gOWni+WAkuiuoeaXtlxuICAgIF9zdGFydENvdW50ZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX2NvdW50ZG93biA9IHRoaXMuY291bnRkb3duX3RpbWU7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNvdW50ZG93bkxhYmVsKCk7XG5cbiAgICAgICAgdGhpcy5zY2hlZHVsZSh0aGlzLl9jb3VudGRvd25UaWNrLCAxKTtcbiAgICB9LFxuXG4gICAgLy8g5YCS6K6h5pe25q+P56eS5Zue6LCDXG4gICAgX2NvdW50ZG93blRpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9jb3VudGRvd24tLTtcblxuICAgICAgICBpZiAodGhpcy5fY291bnRkb3duIDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMudW5zY2hlZHVsZSh0aGlzLl9jb3VudGRvd25UaWNrKTtcbiAgICAgICAgICAgIHRoaXMuX3Jlc2V0U2VuZENvZGVCdG4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZUNvdW50ZG93bkxhYmVsKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g5pu05paw5YCS6K6h5pe25qCH562+XG4gICAgX3VwZGF0ZUNvdW50ZG93bkxhYmVsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuc2VuZF9jb2RlX2xhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLnNlbmRfY29kZV9sYWJlbC5zdHJpbmcgPSB0aGlzLl9jb3VudGRvd24gKyBcIuenkuWQjumHjeivlVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2VuZF9jb2RlX2J0bikge1xuICAgICAgICAgICAgdGhpcy5zZW5kX2NvZGVfYnRuLmludGVyYWN0YWJsZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOmHjee9ruWPkemAgemqjOivgeeggeaMiemSrlxuICAgIF9yZXNldFNlbmRDb2RlQnRuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuc2VuZF9jb2RlX2xhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLnNlbmRfY29kZV9sYWJlbC5zdHJpbmcgPSBcIuiOt+WPlumqjOivgeeggVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2VuZF9jb2RlX2J0bikge1xuICAgICAgICAgICAgdGhpcy5zZW5kX2NvZGVfYnRuLmludGVyYWN0YWJsZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g5pi+56S65raI5oGvXG4gICAgX3Nob3dNZXNzYWdlOiBmdW5jdGlvbihtZXNzYWdlLCBpc0Vycm9yKSB7XG4gICAgICAgIGlmICh0aGlzLm1lc3NhZ2VfbGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZV9sYWJlbC5ub2RlLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VfbGFiZWwuc3RyaW5nID0gbWVzc2FnZTtcblxuICAgICAgICAgICAgaWYgKGlzRXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VfbGFiZWwubm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDEwMCwgMTAwKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlX2xhYmVsLm5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMTAwLCAyMDAsIDEwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhpc0Vycm9yID8gJ1vplJnor69dJyA6ICdb5L+h5oGvXScsIG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOmakOiXj+a2iOaBr1xuICAgIF9oaWRlTWVzc2FnZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLm1lc3NhZ2VfbGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZV9sYWJlbC5ub2RlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOiuvue9ruaMiemSruS6pOS6kueKtuaAgVxuICAgIF9zZXRJbnRlcmFjdGFibGU6IGZ1bmN0aW9uKGludGVyYWN0YWJsZSkge1xuICAgICAgICBpZiAodGhpcy5sb2dpbl9idG4pIHtcbiAgICAgICAgICAgIHRoaXMubG9naW5fYnRuLmludGVyYWN0YWJsZSA9IGludGVyYWN0YWJsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNlbmRfY29kZV9idG4gJiYgdGhpcy5fY291bnRkb3duIDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZF9jb2RlX2J0bi5pbnRlcmFjdGFibGUgPSBpbnRlcmFjdGFibGU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g5Y+R6YCB6aqM6K+B56CB6K+35rGCIC0g5L2/55SoSHR0cEFQSeaUr+aMgeWKoOWvhuino+WvhlxuICAgIF9zZW5kQ29kZVJlcXVlc3Q6IGZ1bmN0aW9uKHBob25lLCBjYWxsYmFjaykge1xuXG4gICAgICAgIHZhciBkZWZpbmVzID0gd2luZG93LmRlZmluZXM7XG4gICAgICAgIGlmICghZGVmaW5lcyB8fCAhZGVmaW5lcy5hcGlVcmwpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRydWUsIFwi5Y+R6YCB5oiQ5YqfXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHVybCA9IGRlZmluZXMuYXBpVXJsICsgJy9hcGkvdjEvYXV0aC9zZW5kLWNvZGUnO1xuICAgICAgICB2YXIgY3J5cHRvS2V5ID0gZGVmaW5lcy5jcnlwdG9LZXkgfHwgXCJcIjtcblxuICAgICAgICAvLyDkvb/nlKhIdHRwQVBJLnBvc3RFbmNyeXB0ZWTlj5HpgIHliqDlr4bor7fmsYJcbiAgICAgICAgaWYgKHdpbmRvdy5IdHRwQVBJICYmIHdpbmRvdy5IdHRwQVBJLnBvc3RFbmNyeXB0ZWQpIHtcbiAgICAgICAgICAgIHdpbmRvdy5IdHRwQVBJLnBvc3RFbmNyeXB0ZWQodXJsLCAnc2VuZF9jb2RlJywgeyBwaG9uZTogcGhvbmUgfSwgY3J5cHRvS2V5LCBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuWPkemAgemqjOivgeeggeWksei0pTpcIiwgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICYmIHJlc3VsdC5jb2RlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtc2cgPSBcIumqjOivgeeggeW3suWPkemAgVwiO1xuICAgICAgICAgICAgICAgICAgICAvLyDlvIDlj5Hnjq/looPvvJrmmL7npLrpqozor4HnoIFcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kYXRhICYmIHJlc3VsdC5kYXRhLmNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1zZyA9IFwi6aqM6K+B56CBOiBcIiArIHJlc3VsdC5kYXRhLmNvZGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodHJ1ZSwgbXNnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgcmVzdWx0ID8gcmVzdWx0Lm1lc3NhZ2UgOiBcIuWPkemAgeWksei0pVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOmZjee6p++8muebtOaOpeWPkemAgeivt+axgu+8iOS4jeaUr+aMgeino+Wvhu+8iVxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiSHR0cEFQSeacquWKoOi9ve+8jOS9v+eUqOWOn+Wni+ivt+axglwiKTtcbiAgICAgICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIHhoci5vcGVuKCdQT1NUJywgdXJsLCB0cnVlKTtcbiAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgeGhyLnRpbWVvdXQgPSAxMDAwMDtcblxuICAgICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA+PSAyMDAgJiYgeGhyLnN0YXR1cyA8IDMwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpuaYr+WKoOWvhuWTjeW6lFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLnRpbWVzdGFtcCAmJiB0eXBlb2YgcmVzcG9uc2UuZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIFwi5pyN5Yqh5Zmo6L+U5Zue5Yqg5a+G5pWw5o2u77yM6K+35Yi35paw6aG16Z2i6YeN6K+VXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UuY29kZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh0cnVlLCBcIumqjOivgeeggeW3suWPkemAgVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgcmVzcG9uc2UubWVzc2FnZSB8fCBcIuWPkemAgeWksei0pVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIFwi6Kej5p6Q5ZON5bqU5aSx6LSlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIFwi572R57uc6K+35rGC5aSx6LSlXCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgeGhyLm9udGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCBcIuivt+axgui2heaXtlwiKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIFwi572R57uc6ZSZ6K+vXCIpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgeGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBwaG9uZTogcGhvbmUgfSkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOaJi+acuuWPt+eZu+W9leivt+axgiAtIOS9v+eUqEh0dHBBUEnmlK/mjIHliqDlr4bop6Plr4ZcbiAgICBfcGhvbmVMb2dpblJlcXVlc3Q6IGZ1bmN0aW9uKHBob25lLCBjb2RlLCBjYWxsYmFjaykge1xuXG4gICAgICAgIHZhciBkZWZpbmVzID0gd2luZG93LmRlZmluZXM7XG4gICAgICAgIGlmICghZGVmaW5lcyB8fCAhZGVmaW5lcy5hcGlVcmwpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRydWUsIFwi55m75b2V5oiQ5YqfXCIsIHtcbiAgICAgICAgICAgICAgICB1bmlxdWVJRDogXCJwaG9uZV9cIiArIHBob25lLFxuICAgICAgICAgICAgICAgIGFjY291bnRJRDogXCJwaG9uZV9cIiArIHBob25lLFxuICAgICAgICAgICAgICAgIG5pY2tOYW1lOiBcIueOqeWutlwiICsgcGhvbmUuc3Vic3RyKC00KSxcbiAgICAgICAgICAgICAgICBhdmF0YXJVcmw6IFwiXCIsXG4gICAgICAgICAgICAgICAgZ29sZGNvdW50OiAxMDAwLFxuICAgICAgICAgICAgICAgIHRva2VuOiBcIm1vY2tfdG9rZW5fXCIgKyBEYXRlLm5vdygpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB1cmwgPSBkZWZpbmVzLmFwaVVybCArICcvYXBpL3YxL2F1dGgvcGhvbmUtbG9naW4nO1xuICAgICAgICB2YXIgY3J5cHRvS2V5ID0gZGVmaW5lcy5jcnlwdG9LZXkgfHwgXCJcIjtcblxuICAgICAgICAvLyDlh4blpIfor7fmsYLmlbDmja5cbiAgICAgICAgdmFyIHJlcXVlc3REYXRhID0ge1xuICAgICAgICAgICAgcGhvbmU6IHBob25lLFxuICAgICAgICAgICAgY29kZTogY29kZVxuICAgICAgICB9O1xuXG5cbiAgICAgICAgLy8g5L2/55SoSHR0cEFQSS5wb3N0RW5jcnlwdGVk5Y+R6YCB5Yqg5a+G6K+35rGCXG4gICAgICAgIGlmICh3aW5kb3cuSHR0cEFQSSAmJiB3aW5kb3cuSHR0cEFQSS5wb3N0RW5jcnlwdGVkKSB7XG4gICAgICAgICAgICB3aW5kb3cuSHR0cEFQSS5wb3N0RW5jcnlwdGVkKHVybCwgJ3Bob25lX2xvZ2luJywgcmVxdWVzdERhdGEsIGNyeXB0b0tleSwgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLnmbvlvZXor7fmsYLlpLHotKU6XCIsIGVycik7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCBlcnIsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuY29kZSA9PT0gMCAmJiByZXN1bHQuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh0cnVlLCBcIueZu+W9leaIkOWKn1wiLCByZXN1bHQuZGF0YSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIHJlc3VsdCA/IHJlc3VsdC5tZXNzYWdlIDogXCLnmbvlvZXlpLHotKVcIiwgbnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDpmY3nuqfvvJrnm7TmjqXlj5HpgIHor7fmsYJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkh0dHBBUEnmnKrliqDovb3vvIzkvb/nlKjljp/lp4vor7fmsYJcIik7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICB4aHIub3BlbignUE9TVCcsIHVybCwgdHJ1ZSk7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdYLURldmljZS1JRCcsIHRoaXMuX2dldERldmljZUlEKCkpO1xuICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ1gtRGV2aWNlLVR5cGUnLCB0aGlzLl9nZXREZXZpY2VUeXBlKCkpO1xuICAgICAgICAgICAgeGhyLnRpbWVvdXQgPSAxMDAwMDtcblxuICAgICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA+PSAyMDAgJiYgeGhyLnN0YXR1cyA8IDMwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLnRpbWVzdGFtcCAmJiB0eXBlb2YgcmVzcG9uc2UuZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Yqg5a+G5ZON5bqU77yM6ZyA6KaB6Kej5a+GXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuSHR0cEFQSSAmJiB3aW5kb3cuSHR0cEFQSS5kZWNyeXB0QUVTR0NNKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuSHR0cEFQSS5kZWNyeXB0QUVTR0NNKHJlc3BvbnNlLmRhdGEsIGNyeXB0b0tleSkudGhlbihmdW5jdGlvbihkZWNyeXB0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGVjcnlwdGVkICYmIGRlY3J5cHRlZC5jb2RlID09PSAwICYmIGRlY3J5cHRlZC5kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHRydWUsIFwi55m75b2V5oiQ5YqfXCIsIGRlY3J5cHRlZC5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgZGVjcnlwdGVkID8gZGVjcnlwdGVkLm1lc3NhZ2UgOiBcIueZu+W9leWksei0pVwiLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihkZWNyeXB0RXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuino+WvhuWksei0pTpcIiwgZGVjcnlwdEVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIFwi6Kej5a+G5ZON5bqU5aSx6LSlXCIsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgXCLmnI3liqHlmajov5Tlm57liqDlr4bmlbDmja7vvIzor7fliLfmlrDpobXpnaLph43or5VcIiwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLmNvZGUgPT09IDAgJiYgcmVzcG9uc2UuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh0cnVlLCBcIueZu+W9leaIkOWKn1wiLCByZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgcmVzcG9uc2UubWVzc2FnZSB8fCBcIueZu+W9leWksei0pVwiLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuino+aekOWTjeW6lOWksei0pTpcIiwgZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIFwi6Kej5p6Q5ZON5bqU5aSx6LSlXCIsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIFwi572R57uc6K+35rGC5aSx6LSlOiBIVFRQIFwiICsgeGhyLnN0YXR1cywgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB4aHIub250aW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIFwi6K+35rGC6LaF5pe2XCIsIG51bGwpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgXCLnvZHnu5zplJnor69cIiwgbnVsbCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB4aHIuc2VuZChKU09OLnN0cmluZ2lmeShyZXF1ZXN0RGF0YSkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOiuvuWkh+S/oeaBr+iOt+WPllxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLy8g6I635Y+W6K6+5aSH5ZSv5LiA5qCH6K+GXG4gICAgX2dldERldmljZUlEOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIERFVklDRV9JRF9LRVkgPSBcImRkel9kZXZpY2VfaWRcIjtcbiAgICAgICAgdmFyIGRldmljZUlkID0gXCJcIjtcblxuICAgICAgICAvLyDlsJ3or5Xku47mnKzlnLDlrZjlgqjojrflj5ZcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGRldmljZUlkID0gY2Muc3lzLmxvY2FsU3RvcmFnZS5nZXRJdGVtKERFVklDRV9JRF9LRVkpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpoLmnpzkuI3lrZjlnKjvvIznlJ/miJDmlrDnmoTorr7lpIdJRFxuICAgICAgICBpZiAoIWRldmljZUlkKSB7XG4gICAgICAgICAgICBkZXZpY2VJZCA9IHRoaXMuX2dlbmVyYXRlVVVJRCgpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjYy5zeXMubG9jYWxTdG9yYWdlLnNldEl0ZW0oREVWSUNFX0lEX0tFWSwgZGV2aWNlSWQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRldmljZUlkO1xuICAgIH0sXG5cbiAgICAvLyDojrflj5borr7lpIfnsbvlnotcbiAgICBfZ2V0RGV2aWNlVHlwZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBwbGF0Zm9ybSA9IGNjLnN5cy5wbGF0Zm9ybTtcbiAgICAgICAgdmFyIG9zID0gY2Muc3lzLm9zO1xuICAgICAgICB2YXIgZGV2aWNlVHlwZSA9IFwiVW5rbm93blwiO1xuXG4gICAgICAgIC8vIOagueaNruW5s+WPsOWIpOaWrVxuICAgICAgICBpZiAocGxhdGZvcm0gPT09IGNjLnN5cy5XRUNIQVRfR0FNRSkge1xuICAgICAgICAgICAgZGV2aWNlVHlwZSA9IFwiV2VDaGF0XCI7XG4gICAgICAgIH0gZWxzZSBpZiAocGxhdGZvcm0gPT09IGNjLnN5cy5BTkRST0lEKSB7XG4gICAgICAgICAgICBkZXZpY2VUeXBlID0gXCJBbmRyb2lkXCI7XG4gICAgICAgIH0gZWxzZSBpZiAocGxhdGZvcm0gPT09IGNjLnN5cy5JUEhPTkUpIHtcbiAgICAgICAgICAgIGRldmljZVR5cGUgPSBcImlQaG9uZVwiO1xuICAgICAgICB9IGVsc2UgaWYgKHBsYXRmb3JtID09PSBjYy5zeXMuSVBBRCkge1xuICAgICAgICAgICAgZGV2aWNlVHlwZSA9IFwiaVBhZFwiO1xuICAgICAgICB9IGVsc2UgaWYgKHBsYXRmb3JtID09PSBjYy5zeXMuTUFDX09TKSB7XG4gICAgICAgICAgICBkZXZpY2VUeXBlID0gXCJNYWNcIjtcbiAgICAgICAgfSBlbHNlIGlmIChwbGF0Zm9ybSA9PT0gY2Muc3lzLldJTkRPV1MpIHtcbiAgICAgICAgICAgIGRldmljZVR5cGUgPSBcIldpbmRvd3NcIjtcbiAgICAgICAgfSBlbHNlIGlmIChwbGF0Zm9ybSA9PT0gY2Muc3lzLkxJTlVYKSB7XG4gICAgICAgICAgICBkZXZpY2VUeXBlID0gXCJMaW51eFwiO1xuICAgICAgICB9IGVsc2UgaWYgKHBsYXRmb3JtID09PSBjYy5zeXMuTU9CSUxFX0JST1dTRVIpIHtcbiAgICAgICAgICAgIGlmIChvcyA9PT0gY2Muc3lzLk9TX0lPUykge1xuICAgICAgICAgICAgICAgIGRldmljZVR5cGUgPSBcImlPUyBCcm93c2VyXCI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG9zID09PSBjYy5zeXMuT1NfQU5EUk9JRCkge1xuICAgICAgICAgICAgICAgIGRldmljZVR5cGUgPSBcIkFuZHJvaWQgQnJvd3NlclwiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXZpY2VUeXBlID0gXCJNb2JpbGUgQnJvd3NlclwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHBsYXRmb3JtID09PSBjYy5zeXMuREVTS1RPUF9CUk9XU0VSKSB7XG4gICAgICAgICAgICBpZiAob3MgPT09IGNjLnN5cy5PU19XSU5ET1dTKSB7XG4gICAgICAgICAgICAgICAgZGV2aWNlVHlwZSA9IFwiV2luZG93cyBCcm93c2VyXCI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG9zID09PSBjYy5zeXMuT1NfT1NYKSB7XG4gICAgICAgICAgICAgICAgZGV2aWNlVHlwZSA9IFwiTWFjIEJyb3dzZXJcIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob3MgPT09IGNjLnN5cy5PU19MSU5VWCkge1xuICAgICAgICAgICAgICAgIGRldmljZVR5cGUgPSBcIkxpbnV4IEJyb3dzZXJcIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGV2aWNlVHlwZSA9IFwiRGVza3RvcCBCcm93c2VyXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmt7vliqDmtY/op4jlmajkv6Hmga9cbiAgICAgICAgdmFyIGJyb3dzZXJUeXBlID0gY2Muc3lzLmJyb3dzZXJUeXBlO1xuICAgICAgICBpZiAoYnJvd3NlclR5cGUpIHtcbiAgICAgICAgICAgIGRldmljZVR5cGUgKz0gXCIgKFwiICsgYnJvd3NlclR5cGUgKyBcIilcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZXZpY2VUeXBlO1xuICAgIH0sXG5cbiAgICAvLyDnlJ/miJBVVUlEXG4gICAgX2dlbmVyYXRlVVVJRDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBkID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciB1dWlkID0gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICB2YXIgciA9IChkICsgTWF0aC5yYW5kb20oKSAqIDE2KSAlIDE2IHwgMDtcbiAgICAgICAgICAgIGQgPSBNYXRoLmZsb29yKGQgLyAxNik7XG4gICAgICAgICAgICByZXR1cm4gKGMgPT09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCkpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB1dWlkO1xuICAgIH1cbn0pO1xuIl19