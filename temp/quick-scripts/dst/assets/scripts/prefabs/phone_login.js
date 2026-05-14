
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
          console.log("【手机登录】用户数据已保存, nickName =", window.myglobal.playerData.nickName);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL3ByZWZhYnMvcGhvbmVfbG9naW4uanMiXSwibmFtZXMiOlsiY2MiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJwaG9uZV9pbnB1dCIsInR5cGUiLCJFZGl0Qm94IiwiY29kZV9pbnB1dCIsInNlbmRfY29kZV9idG4iLCJCdXR0b24iLCJsb2dpbl9idG4iLCJjbG9zZV9idG4iLCJ3eF9sb2dpbl9idG4iLCJTcHJpdGUiLCJzZW5kX2NvZGVfbGFiZWwiLCJMYWJlbCIsIm1lc3NhZ2VfbGFiZWwiLCJjb3VudGRvd25fdGltZSIsIkJBU0VfV0lEVEgiLCJCQVNFX0hFSUdIVCIsIm9uTG9hZCIsIl9jb3VudGRvd24iLCJfcGhvbmUiLCJfY29kZSIsImFkYXB0RGlhbG9nIiwic2VsZiIsInZpZXciLCJzZXRSZXNpemVDYWxsYmFjayIsIl9pbml0UGFuZWxBbmltYXRpb24iLCJfZHJhd0lucHV0Qm9yZGVycyIsIl9pbml0RWRpdEJveGVzIiwiX2luaXRCdXR0b25zIiwiX2luaXRXZWNoYXRCdXR0b24iLCJfaGlkZU1lc3NhZ2UiLCJzdHJpbmciLCJzdGF5T25Ub3AiLCJmb250U2l6ZSIsImxpbmVIZWlnaHQiLCJmb250Q29sb3IiLCJDb2xvciIsInBsYWNlaG9sZGVyRm9udENvbG9yIiwibm9kZSIsIm9uIiwiX29uUGhvbmVJbnB1dEZvY3VzIiwiX29uUGhvbmVJbnB1dEJsdXIiLCJlZGl0Ym94IiwiX29uQ29kZUlucHV0Rm9jdXMiLCJfb25Db2RlSW5wdXRCbHVyIiwicGFuZWwiLCJnZXRDaGlsZEJ5TmFtZSIsIndpblciLCJ3aW5TaXplIiwid2lkdGgiLCJ3aW5IIiwiaGVpZ2h0IiwidGFyZ2V0V2lkdGgiLCJNYXRoIiwibWF4IiwibWluIiwic2NhbGUiLCJtYXhTY2FsZVkiLCJjb25zb2xlIiwibG9nIiwicm91bmQiLCJ0b0ZpeGVkIiwiY29udGVudFBhbmVsIiwidGFyZ2V0U2NhbGUiLCJvcGFjaXR5IiwidHdlZW4iLCJ0byIsImVhc2luZyIsInN0YXJ0IiwicGhvbmVCZyIsImdyYXBoaWNzIiwiZ2V0Q29tcG9uZW50IiwiR3JhcGhpY3MiLCJjbGVhciIsImZpbGxDb2xvciIsIl9kcmF3Um91bmRSZWN0IiwiZmlsbCIsInN0cm9rZUNvbG9yIiwibGluZVdpZHRoIiwic3Ryb2tlIiwicGhvbmVJbnB1dCIsInpJbmRleCIsImNvZGVSb3ciLCJjb2RlQmciLCJjb2RlSW5wdXQiLCJkaXZpZGVyIiwibW92ZVRvIiwibGluZVRvIiwieCIsInkiLCJ3IiwiaCIsInIiLCJhcmNUbyIsInd4Q29udGFpbmVyIiwid3hCdG4iLCJOb2RlIiwiRXZlbnRUeXBlIiwiVE9VQ0hfU1RBUlQiLCJUT1VDSF9FTkQiLCJfb25XZWNoYXRMb2dpbkNsaWNrIiwiVE9VQ0hfQ0FOQ0VMIiwiX2NyZWF0ZVdlY2hhdExhYmVsIiwiY29udGFpbmVyIiwiZXhpc3RMYWJlbCIsImxhYmVsTm9kZSIsInBhcmVudCIsImxhYmVsIiwiYWRkQ29tcG9uZW50IiwiZm9udEZhbWlseSIsImhvcml6b250YWxBbGlnbiIsIkhvcml6b250YWxBbGlnbiIsIkNFTlRFUiIsIm9mZiIsIl9vbkNsb3NlQ2xpY2siLCJfb25TZW5kQ29kZUNsaWNrIiwiX29uTG9naW5DbGljayIsIndpbmRvdyIsIm15Z2xvYmFsIiwid2VjaGF0TG9naW4iLCJfc2hvd01lc3NhZ2UiLCJvblBob25lSW5wdXRDaGFuZ2VkIiwiY3VzdG9tRXZlbnREYXRhIiwib25Db2RlSW5wdXRDaGFuZ2VkIiwiX3ZhbGlkYXRlUGhvbmUiLCJfc2V0SW50ZXJhY3RhYmxlIiwiX3NlbmRDb2RlUmVxdWVzdCIsInN1Y2Nlc3MiLCJtZXNzYWdlIiwiX3N0YXJ0Q291bnRkb3duIiwiX3ZhbGlkYXRlQ29kZSIsIl9waG9uZUxvZ2luUmVxdWVzdCIsImRhdGEiLCJwbGF5ZXJEYXRhIiwidW5pcXVlSUQiLCJhY2NvdW50SUQiLCJuaWNrTmFtZSIsImF2YXRhclVybCIsImdvYmFsX2NvdW50IiwiZ29sZGNvdW50IiwidG9rZW4iLCJzYXZlVG9Mb2NhbCIsInNjaGVkdWxlT25jZSIsImRpcmVjdG9yIiwibG9hZFNjZW5lIiwiaXNWYWxpZCIsInVuc2NoZWR1bGUiLCJfY291bnRkb3duVGljayIsImRlc3Ryb3kiLCJwaG9uZSIsImxlbmd0aCIsInJlZyIsInRlc3QiLCJjb2RlIiwiX3VwZGF0ZUNvdW50ZG93bkxhYmVsIiwic2NoZWR1bGUiLCJfcmVzZXRTZW5kQ29kZUJ0biIsImludGVyYWN0YWJsZSIsImlzRXJyb3IiLCJhY3RpdmUiLCJjb2xvciIsImNhbGxiYWNrIiwiZGVmaW5lcyIsImFwaVVybCIsInVybCIsImNyeXB0b0tleSIsIkh0dHBBUEkiLCJwb3N0RW5jcnlwdGVkIiwiZXJyIiwicmVzdWx0IiwiZXJyb3IiLCJtc2ciLCJ3YXJuIiwieGhyIiwiWE1MSHR0cFJlcXVlc3QiLCJvcGVuIiwic2V0UmVxdWVzdEhlYWRlciIsInRpbWVvdXQiLCJvbnJlYWR5c3RhdGVjaGFuZ2UiLCJyZWFkeVN0YXRlIiwic3RhdHVzIiwicmVzcG9uc2UiLCJKU09OIiwicGFyc2UiLCJyZXNwb25zZVRleHQiLCJ0aW1lc3RhbXAiLCJlIiwib250aW1lb3V0Iiwib25lcnJvciIsInNlbmQiLCJzdHJpbmdpZnkiLCJzdWJzdHIiLCJEYXRlIiwibm93IiwicmVxdWVzdERhdGEiLCJfZ2V0RGV2aWNlSUQiLCJfZ2V0RGV2aWNlVHlwZSIsImRlY3J5cHRBRVNHQ00iLCJ0aGVuIiwiZGVjcnlwdGVkIiwiZGVjcnlwdEVyciIsIkRFVklDRV9JRF9LRVkiLCJkZXZpY2VJZCIsInN5cyIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJfZ2VuZXJhdGVVVUlEIiwic2V0SXRlbSIsInBsYXRmb3JtIiwib3MiLCJkZXZpY2VUeXBlIiwiV0VDSEFUX0dBTUUiLCJBTkRST0lEIiwiSVBIT05FIiwiSVBBRCIsIk1BQ19PUyIsIldJTkRPV1MiLCJMSU5VWCIsIk1PQklMRV9CUk9XU0VSIiwiT1NfSU9TIiwiT1NfQU5EUk9JRCIsIkRFU0tUT1BfQlJPV1NFUiIsIk9TX1dJTkRPV1MiLCJPU19PU1giLCJPU19MSU5VWCIsImJyb3dzZXJUeXBlIiwiZCIsImdldFRpbWUiLCJ1dWlkIiwicmVwbGFjZSIsImMiLCJyYW5kb20iLCJmbG9vciIsInRvU3RyaW5nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUVBQSxFQUFFLENBQUNDLEtBQUgsQ0FBUztFQUNMLFdBQVNELEVBQUUsQ0FBQ0UsU0FEUDtFQUdMQyxVQUFVLEVBQUU7SUFDUjtJQUNBQyxXQUFXLEVBQUU7TUFDVEMsSUFBSSxFQUFFTCxFQUFFLENBQUNNLE9BREE7TUFFVCxXQUFTO0lBRkEsQ0FGTDtJQU1SQyxVQUFVLEVBQUU7TUFDUkYsSUFBSSxFQUFFTCxFQUFFLENBQUNNLE9BREQ7TUFFUixXQUFTO0lBRkQsQ0FOSjtJQVdSO0lBQ0FFLGFBQWEsRUFBRTtNQUNYSCxJQUFJLEVBQUVMLEVBQUUsQ0FBQ1MsTUFERTtNQUVYLFdBQVM7SUFGRSxDQVpQO0lBZ0JSQyxTQUFTLEVBQUU7TUFDUEwsSUFBSSxFQUFFTCxFQUFFLENBQUNTLE1BREY7TUFFUCxXQUFTO0lBRkYsQ0FoQkg7SUFvQlJFLFNBQVMsRUFBRTtNQUNQTixJQUFJLEVBQUVMLEVBQUUsQ0FBQ1MsTUFERjtNQUVQLFdBQVM7SUFGRixDQXBCSDtJQXlCUjtJQUNBRyxZQUFZLEVBQUU7TUFDVlAsSUFBSSxFQUFFTCxFQUFFLENBQUNhLE1BREM7TUFFVixXQUFTO0lBRkMsQ0ExQk47SUErQlI7SUFDQUMsZUFBZSxFQUFFO01BQ2JULElBQUksRUFBRUwsRUFBRSxDQUFDZSxLQURJO01BRWIsV0FBUztJQUZJLENBaENUO0lBb0NSQyxhQUFhLEVBQUU7TUFDWFgsSUFBSSxFQUFFTCxFQUFFLENBQUNlLEtBREU7TUFFWCxXQUFTO0lBRkUsQ0FwQ1A7SUF5Q1I7SUFDQUUsY0FBYyxFQUFFLEVBMUNSO0lBNENSO0lBQ0FDLFVBQVUsRUFBRSxHQTdDSjtJQThDUkMsV0FBVyxFQUFFO0VBOUNMLENBSFA7RUFv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Q0FBVCIsInNvdXJjZVJvb3QiOiIvIiwic291cmNlc0NvbnRlbnQiOlsiLy8g5omL5py65Y+355m75b2V5by556qX5o6n5Yi25ZmoXG4vLyDnlKjkuo7lpITnkIbmiYvmnLrlj7fpqozor4HnoIHnmbvlvZXlip/og71cbi8vIOiuvuiuoemjjuagvO+8muS4reWbvemjjuWVhuS4muaji+eJjO+8iOWTjeW6lOW8j+mAgumFje+8muWuveW6pjYwJe+8jOmrmOW6puiHqumAguW6lO+8iVxuXG5jYy5DbGFzcyh7XG4gICAgZXh0ZW5kczogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICAvLyDovpPlhaXmoYZcbiAgICAgICAgcGhvbmVfaW5wdXQ6IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLkVkaXRCb3gsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIGNvZGVfaW5wdXQ6IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLkVkaXRCb3gsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g5oyJ6ZKuXG4gICAgICAgIHNlbmRfY29kZV9idG46IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLkJ1dHRvbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgbG9naW5fYnRuOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5CdXR0b24sXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIGNsb3NlX2J0bjoge1xuICAgICAgICAgICAgdHlwZTogY2MuQnV0dG9uLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIOW+ruS/oeeZu+W9leaMiemSrlxuICAgICAgICB3eF9sb2dpbl9idG46IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLlNwcml0ZSxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcblxuICAgICAgICAvLyDmoIfnrb5cbiAgICAgICAgc2VuZF9jb2RlX2xhYmVsOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5MYWJlbCxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgbWVzc2FnZV9sYWJlbDoge1xuICAgICAgICAgICAgdHlwZTogY2MuTGFiZWwsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g5YCS6K6h5pe25pe26Ze0XG4gICAgICAgIGNvdW50ZG93bl90aW1lOiA2MCxcblxuICAgICAgICAvLyDln7rlh4borr7orqHlsLrlr7jvvIjnlKjkuo7orqHnrpdzY2FsZe+8iVxuICAgICAgICBCQVNFX1dJRFRIOiA0MDAsXG4gICAgICAgIEJBU0VfSEVJR0hUOiA1MjBcbiAgICB9LFxuXG4gICAgb25Mb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fY291bnRkb3duID0gMDtcbiAgICAgICAgdGhpcy5fcGhvbmUgPSBcIlwiO1xuICAgICAgICB0aGlzLl9jb2RlID0gXCJcIjtcblxuICAgICAgICAvLyDnq4vljbPmiafooYzlvLnnqpflsLrlr7jpgILphY1cbiAgICAgICAgdGhpcy5hZGFwdERpYWxvZygpO1xuXG4gICAgICAgIC8vIOebkeWQrOWxj+W5leWwuuWvuOWPmOWMllxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGNjLnZpZXcuc2V0UmVzaXplQ2FsbGJhY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLmFkYXB0RGlhbG9nKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOWIneWni+WMluW8ueeql+WKqOeUu1xuICAgICAgICB0aGlzLl9pbml0UGFuZWxBbmltYXRpb24oKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOe7mOWItuWchuinkui+k+WFpeahhui+ueahhlxuICAgICAgICB0aGlzLl9kcmF3SW5wdXRCb3JkZXJzKCk7XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDliJ3lp4vljJYgRWRpdEJveCDmoLflvI/lkozkuovku7YgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdGhpcy5faW5pdEVkaXRCb3hlcygpO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yid5aeL5YyW5oyJ6ZKu5LqL5Lu2XG4gICAgICAgIHRoaXMuX2luaXRCdXR0b25zKCk7XG4gICAgICAgIFxuICAgICAgICAvLyDliJ3lp4vljJblvq7kv6HnmbvlvZXmjInpkq5cbiAgICAgICAgdGhpcy5faW5pdFdlY2hhdEJ1dHRvbigpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5faGlkZU1lc3NhZ2UoKTtcblxuICAgICAgICAvLyDojrflj5bovpPlhaXmoYbliJ3lp4vlgLxcbiAgICAgICAgaWYgKHRoaXMucGhvbmVfaW5wdXQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Bob25lID0gdGhpcy5waG9uZV9pbnB1dC5zdHJpbmcgfHwgXCJcIjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jb2RlX2lucHV0KSB7XG4gICAgICAgICAgICB0aGlzLl9jb2RlID0gdGhpcy5jb2RlX2lucHV0LnN0cmluZyB8fCBcIlwiO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09IOWIneWni+WMliBFZGl0Qm94ID09PT09PT09PT09PT09PT09PT09XG4gICAgX2luaXRFZGl0Qm94ZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICAvLyDmiYvmnLrlj7fovpPlhaXmoYbliJ3lp4vljJZcbiAgICAgICAgaWYgKHRoaXMucGhvbmVfaW5wdXQpIHtcbiAgICAgICAgICAgIC8vIOiuvue9riBzdGF5T25Ub3Ag5Li6IHRydWXvvIznoa7kv53mloflrZflp4vnu4jlj6/op4FcbiAgICAgICAgICAgIHRoaXMucGhvbmVfaW5wdXQuc3RheU9uVG9wID0gdHJ1ZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6K6+572u5a2X5L2T5qC35byPXG4gICAgICAgICAgICB0aGlzLnBob25lX2lucHV0LmZvbnRTaXplID0gMjA7XG4gICAgICAgICAgICB0aGlzLnBob25lX2lucHV0LmxpbmVIZWlnaHQgPSA0MDtcbiAgICAgICAgICAgIHRoaXMucGhvbmVfaW5wdXQuZm9udENvbG9yID0gbmV3IGNjLkNvbG9yKDUwLCA1MCwgNTAsIDI1NSk7XG4gICAgICAgICAgICB0aGlzLnBob25lX2lucHV0LnBsYWNlaG9sZGVyRm9udENvbG9yID0gbmV3IGNjLkNvbG9yKDE1MCwgMTUwLCAxNTAsIDI1NSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOebkeWQrOi+k+WFpeS6i+S7tlxuICAgICAgICAgICAgdGhpcy5waG9uZV9pbnB1dC5ub2RlLm9uKCdlZGl0aW5nLWRpZC1iZWdhbicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX29uUGhvbmVJbnB1dEZvY3VzKCk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5waG9uZV9pbnB1dC5ub2RlLm9uKCdlZGl0aW5nLWRpZC1lbmRlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX29uUGhvbmVJbnB1dEJsdXIoKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnBob25lX2lucHV0Lm5vZGUub24oJ3RleHQtY2hhbmdlZCcsIGZ1bmN0aW9uKGVkaXRib3gpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9waG9uZSA9IGVkaXRib3guc3RyaW5nO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmqjOivgeeggei+k+WFpeahhuWIneWni+WMllxuICAgICAgICBpZiAodGhpcy5jb2RlX2lucHV0KSB7XG4gICAgICAgICAgICAvLyDorr7nva4gc3RheU9uVG9wIOS4uiB0cnVl77yM56Gu5L+d5paH5a2X5aeL57uI5Y+v6KeBXG4gICAgICAgICAgICB0aGlzLmNvZGVfaW5wdXQuc3RheU9uVG9wID0gdHJ1ZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6K6+572u5a2X5L2T5qC35byPXG4gICAgICAgICAgICB0aGlzLmNvZGVfaW5wdXQuZm9udFNpemUgPSAyMDtcbiAgICAgICAgICAgIHRoaXMuY29kZV9pbnB1dC5saW5lSGVpZ2h0ID0gNDA7XG4gICAgICAgICAgICB0aGlzLmNvZGVfaW5wdXQuZm9udENvbG9yID0gbmV3IGNjLkNvbG9yKDUwLCA1MCwgNTAsIDI1NSk7XG4gICAgICAgICAgICB0aGlzLmNvZGVfaW5wdXQucGxhY2Vob2xkZXJGb250Q29sb3IgPSBuZXcgY2MuQ29sb3IoMTUwLCAxNTAsIDE1MCwgMjU1KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g55uR5ZCs6L6T5YWl5LqL5Lu2XG4gICAgICAgICAgICB0aGlzLmNvZGVfaW5wdXQubm9kZS5vbignZWRpdGluZy1kaWQtYmVnYW4nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9vbkNvZGVJbnB1dEZvY3VzKCk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5jb2RlX2lucHV0Lm5vZGUub24oJ2VkaXRpbmctZGlkLWVuZGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fb25Db2RlSW5wdXRCbHVyKCk7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5jb2RlX2lucHV0Lm5vZGUub24oJ3RleHQtY2hhbmdlZCcsIGZ1bmN0aW9uKGVkaXRib3gpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9jb2RlID0gZWRpdGJveC5zdHJpbmc7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLy8g5omL5py65Y+36L6T5YWl5qGG6I635b6X54Sm54K5XG4gICAgX29uUGhvbmVJbnB1dEZvY3VzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g5Y+v5Lul5re75Yqg54Sm54K55pWI5p6cXG4gICAgfSxcbiAgICBcbiAgICAvLyDmiYvmnLrlj7fovpPlhaXmoYblpLHljrvnhKbngrlcbiAgICBfb25QaG9uZUlucHV0Qmx1cjogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOehruS/neaWh+Wtl+aYvuekulxuICAgICAgICBpZiAodGhpcy5waG9uZV9pbnB1dCAmJiB0aGlzLnBob25lX2lucHV0LnN0cmluZykge1xuICAgICAgICAgICAgdGhpcy5fcGhvbmUgPSB0aGlzLnBob25lX2lucHV0LnN0cmluZztcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLy8g6aqM6K+B56CB6L6T5YWl5qGG6I635b6X54Sm54K5XG4gICAgX29uQ29kZUlucHV0Rm9jdXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDlj6/ku6Xmt7vliqDnhKbngrnmlYjmnpxcbiAgICB9LFxuICAgIFxuICAgIC8vIOmqjOivgeeggei+k+WFpeahhuWkseWOu+eEpueCuVxuICAgIF9vbkNvZGVJbnB1dEJsdXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDnoa7kv53mloflrZfmmL7npLpcbiAgICAgICAgaWYgKHRoaXMuY29kZV9pbnB1dCAmJiB0aGlzLmNvZGVfaW5wdXQuc3RyaW5nKSB7XG4gICAgICAgICAgICB0aGlzLl9jb2RlID0gdGhpcy5jb2RlX2lucHV0LnN0cmluZztcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDlk43lupTlvI/pgILphY3vvJrlrr3luqY95bGP5bmVNjAl77yM5pyA5bCPMzAw77yM6auY5bqm5oyJ5q+U5L6LXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgYWRhcHREaWFsb2c6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGFuZWwgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoJ2NvbnRlbnRfcGFuZWwnKTtcbiAgICAgICAgaWYgKCFwYW5lbCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciB3aW5XID0gY2Mud2luU2l6ZS53aWR0aDtcbiAgICAgICAgdmFyIHdpbkggPSBjYy53aW5TaXplLmhlaWdodDtcblxuICAgICAgICAvLyDnm67moIflrr3luqYgPSDlsY/luZXlrr3luqYgKiA2MCVcbiAgICAgICAgdmFyIHRhcmdldFdpZHRoID0gd2luVyAqIDAuNjtcbiAgICAgICAgXG4gICAgICAgIC8vIOacgOWwj+WuveW6pjMwMO+8jOacgOWkp+WuveW6puS4jei2hei/h+Wxj+W5lTgwJVxuICAgICAgICB0YXJnZXRXaWR0aCA9IE1hdGgubWF4KDMwMCwgTWF0aC5taW4odGFyZ2V0V2lkdGgsIHdpblcgKiAwLjgpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOiuoeeul+e8qeaUvuavlOS+i1xuICAgICAgICB2YXIgc2NhbGUgPSB0YXJnZXRXaWR0aCAvIHRoaXMuQkFTRV9XSURUSDtcbiAgICAgICAgXG4gICAgICAgIC8vIOehruS/nemrmOW6puS4jei2heWHuuWxj+W5le+8iOeVmeWHujEwJei+uei3ne+8iVxuICAgICAgICB2YXIgbWF4U2NhbGVZID0gKHdpbkggKiAwLjgpIC8gdGhpcy5CQVNFX0hFSUdIVDtcbiAgICAgICAgc2NhbGUgPSBNYXRoLm1pbihzY2FsZSwgbWF4U2NhbGVZKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOmZkOWItue8qeaUvuiMg+WbtCBbMC43LCAxLjNdXG4gICAgICAgIHNjYWxlID0gTWF0aC5tYXgoMC43LCBNYXRoLm1pbihzY2FsZSwgMS4zKSk7XG5cbiAgICAgICAgLy8g5bqU55So57yp5pS+XG4gICAgICAgIHBhbmVsLnNjYWxlID0gc2NhbGU7XG5cbiAgICAgICAgY29uc29sZS5sb2coJ+OAkOeZu+W9leW8ueeql+OAkeWxj+W5lTonLCB3aW5XLCAneCcsIHdpbkgsIFxuICAgICAgICAgICAgICAgICAgICAn55uu5qCH5a695bqmOicsIE1hdGgucm91bmQodGFyZ2V0V2lkdGgpLCBcbiAgICAgICAgICAgICAgICAgICAgJ+e8qeaUvjonLCBzY2FsZS50b0ZpeGVkKDIpLFxuICAgICAgICAgICAgICAgICAgICAn5a6e6ZmF5bC65a+4OicsIE1hdGgucm91bmQodGhpcy5CQVNFX1dJRFRIICogc2NhbGUpLCAneCcsIE1hdGgucm91bmQodGhpcy5CQVNFX0hFSUdIVCAqIHNjYWxlKSk7XG4gICAgfSxcblxuICAgIC8vIOWIneWni+WMluW8ueeql+i/m+WFpeWKqOeUu1xuICAgIF9pbml0UGFuZWxBbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29udGVudFBhbmVsID0gdGhpcy5ub2RlLmdldENoaWxkQnlOYW1lKCdjb250ZW50X3BhbmVsJyk7XG4gICAgICAgIGlmIChjb250ZW50UGFuZWwpIHtcbiAgICAgICAgICAgIC8vIOS/neWtmOebruagh+e8qeaUvuWAvO+8iOW3sueUsV9pbml0UGFuZWxTY2FsZeiuvue9ru+8iVxuICAgICAgICAgICAgdmFyIHRhcmdldFNjYWxlID0gY29udGVudFBhbmVsLnNjYWxlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDku47lsI/lsLrlr7jlvIDlp4vliqjnlLtcbiAgICAgICAgICAgIGNvbnRlbnRQYW5lbC5zY2FsZSA9IHRhcmdldFNjYWxlICogMC43O1xuICAgICAgICAgICAgY29udGVudFBhbmVsLm9wYWNpdHkgPSAwO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjYy50d2Vlbihjb250ZW50UGFuZWwpXG4gICAgICAgICAgICAgICAgLnRvKDAuMjUsIHsgc2NhbGU6IHRhcmdldFNjYWxlLCBvcGFjaXR5OiAyNTUgfSwgeyBlYXNpbmc6ICdiYWNrT3V0JyB9KVxuICAgICAgICAgICAgICAgIC5zdGFydCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOe7mOWItui+k+WFpeahhuWchuinkui+ueahhiAtIOS/ruWkjeeJiO+8mue7mOWItuiDjOaZryArIOi+ueahhlxuICAgIF9kcmF3SW5wdXRCb3JkZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNvbnRlbnRQYW5lbCA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZSgnY29udGVudF9wYW5lbCcpO1xuICAgICAgICBpZiAoIWNvbnRlbnRQYW5lbCkgcmV0dXJuO1xuXG4gICAgICAgIC8vIOe7mOWItuaJi+acuuWPt+i+k+WFpeahhuiDjOaZr+WSjOi+ueahhiAoMzIweDUwKVxuICAgICAgICB2YXIgcGhvbmVCZyA9IGNvbnRlbnRQYW5lbC5nZXRDaGlsZEJ5TmFtZSgncGhvbmVfYmcnKTtcbiAgICAgICAgaWYgKHBob25lQmcpIHtcbiAgICAgICAgICAgIHZhciBncmFwaGljcyA9IHBob25lQmcuZ2V0Q29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgICAgIGlmIChncmFwaGljcykge1xuICAgICAgICAgICAgICAgIGdyYXBoaWNzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgLy8g5YWI57uY5Yi25aGr5YWF6IOM5pmv77yI5Y2K6YCP5piO55m96Imy77yJXG4gICAgICAgICAgICAgICAgZ3JhcGhpY3MuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjUyLCAyNDAsIDIzMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fZHJhd1JvdW5kUmVjdChncmFwaGljcywgLTE2MCwgLTI1LCAzMjAsIDUwLCAxNCk7XG4gICAgICAgICAgICAgICAgZ3JhcGhpY3MuZmlsbCgpO1xuICAgICAgICAgICAgICAgIC8vIOWGjee7mOWItui+ueahhu+8iOmHkeiJsu+8iVxuICAgICAgICAgICAgICAgIGdyYXBoaWNzLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDIxOCwgMTY1LCAzMiwgMjU1KTtcbiAgICAgICAgICAgICAgICBncmFwaGljcy5saW5lV2lkdGggPSAyO1xuICAgICAgICAgICAgICAgIHRoaXMuX2RyYXdSb3VuZFJlY3QoZ3JhcGhpY3MsIC0xNjAsIC0yNSwgMzIwLCA1MCwgMTQpO1xuICAgICAgICAgICAgICAgIGdyYXBoaWNzLnN0cm9rZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDnoa7kv50gcGhvbmVfYmcg6IqC54K55ZyoIGlucHV0IOiKgueCueS4i+aWuVxuICAgICAgICAgICAgdmFyIHBob25lSW5wdXQgPSBwaG9uZUJnLmdldENoaWxkQnlOYW1lKCdwaG9uZV9pbnB1dCcpO1xuICAgICAgICAgICAgaWYgKHBob25lSW5wdXQpIHtcbiAgICAgICAgICAgICAgICBwaG9uZUlucHV0LnpJbmRleCA9IDEwO1xuICAgICAgICAgICAgICAgIHBob25lQmcuekluZGV4ID0gNTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOe7mOWItumqjOivgeeggei+k+WFpeahhuiDjOaZr+WSjOi+ueahhiAoMTkweDUwKVxuICAgICAgICB2YXIgY29kZVJvdyA9IGNvbnRlbnRQYW5lbC5nZXRDaGlsZEJ5TmFtZSgnY29kZV9yb3cnKTtcbiAgICAgICAgaWYgKGNvZGVSb3cpIHtcbiAgICAgICAgICAgIHZhciBjb2RlQmcgPSBjb2RlUm93LmdldENoaWxkQnlOYW1lKCdjb2RlX2JnJyk7XG4gICAgICAgICAgICBpZiAoY29kZUJnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGdyYXBoaWNzID0gY29kZUJnLmdldENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgICAgICAgICAgaWYgKGdyYXBoaWNzKSB7XG4gICAgICAgICAgICAgICAgICAgIGdyYXBoaWNzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWFiOe7mOWItuWhq+WFheiDjOaZr++8iOWNiumAj+aYjueZveiJsu+8iVxuICAgICAgICAgICAgICAgICAgICBncmFwaGljcy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTIsIDI0MCwgMjMwKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZHJhd1JvdW5kUmVjdChncmFwaGljcywgLTk1LCAtMjUsIDE5MCwgNTAsIDE0KTtcbiAgICAgICAgICAgICAgICAgICAgZ3JhcGhpY3MuZmlsbCgpO1xuICAgICAgICAgICAgICAgICAgICAvLyDlho3nu5jliLbovrnmoYbvvIjph5HoibLvvIlcbiAgICAgICAgICAgICAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjE4LCAxNjUsIDMyLCAyNTUpO1xuICAgICAgICAgICAgICAgICAgICBncmFwaGljcy5saW5lV2lkdGggPSAyO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kcmF3Um91bmRSZWN0KGdyYXBoaWNzLCAtOTUsIC0yNSwgMTkwLCA1MCwgMTQpO1xuICAgICAgICAgICAgICAgICAgICBncmFwaGljcy5zdHJva2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g56Gu5L+dIGNvZGVfYmcg6IqC54K55ZyoIGlucHV0IOiKgueCueS4i+aWuVxuICAgICAgICAgICAgICAgIHZhciBjb2RlSW5wdXQgPSBjb2RlQmcuZ2V0Q2hpbGRCeU5hbWUoJ2NvZGVfaW5wdXQnKTtcbiAgICAgICAgICAgICAgICBpZiAoY29kZUlucHV0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGVJbnB1dC56SW5kZXggPSAxMDtcbiAgICAgICAgICAgICAgICAgICAgY29kZUJnLnpJbmRleCA9IDU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g57uY5Yi25YiG5Ymy57q/XG4gICAgICAgIHZhciBkaXZpZGVyID0gY29udGVudFBhbmVsLmdldENoaWxkQnlOYW1lKCdkaXZpZGVyJyk7XG4gICAgICAgIGlmIChkaXZpZGVyKSB7XG4gICAgICAgICAgICB2YXIgZ3JhcGhpY3MgPSBkaXZpZGVyLmdldENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgICAgICBpZiAoZ3JhcGhpY3MpIHtcbiAgICAgICAgICAgICAgICBncmFwaGljcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgIGdyYXBoaWNzLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDIwMCwgMTgwLCAxNDAsIDE4MCk7XG4gICAgICAgICAgICAgICAgZ3JhcGhpY3MubGluZVdpZHRoID0gMTtcbiAgICAgICAgICAgICAgICBncmFwaGljcy5tb3ZlVG8oLTE3MCwgMCk7XG4gICAgICAgICAgICAgICAgZ3JhcGhpY3MubGluZVRvKDE3MCwgMCk7XG4gICAgICAgICAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g57uY5Yi25ZyG6KeS55+p5b2iXG4gICAgX2RyYXdSb3VuZFJlY3Q6IGZ1bmN0aW9uKGdyYXBoaWNzLCB4LCB5LCB3LCBoLCByKSB7XG4gICAgICAgIGdyYXBoaWNzLm1vdmVUbyh4ICsgciwgeSk7XG4gICAgICAgIGdyYXBoaWNzLmxpbmVUbyh4ICsgdyAtIHIsIHkpO1xuICAgICAgICBncmFwaGljcy5hcmNUbyh4ICsgdywgeSwgeCArIHcsIHkgKyByLCByKTtcbiAgICAgICAgZ3JhcGhpY3MubGluZVRvKHggKyB3LCB5ICsgaCAtIHIpO1xuICAgICAgICBncmFwaGljcy5hcmNUbyh4ICsgdywgeSArIGgsIHggKyB3IC0gciwgeSArIGgsIHIpO1xuICAgICAgICBncmFwaGljcy5saW5lVG8oeCArIHIsIHkgKyBoKTtcbiAgICAgICAgZ3JhcGhpY3MuYXJjVG8oeCwgeSArIGgsIHgsIHkgKyBoIC0gciwgcik7XG4gICAgICAgIGdyYXBoaWNzLmxpbmVUbyh4LCB5ICsgcik7XG4gICAgICAgIGdyYXBoaWNzLmFyY1RvKHgsIHksIHggKyByLCB5LCByKTtcbiAgICB9LFxuXG4gICAgLy8g5Yid5aeL5YyW5b6u5L+h55m75b2V5oyJ6ZKuXG4gICAgX2luaXRXZWNoYXRCdXR0b246IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29udGVudFBhbmVsID0gdGhpcy5ub2RlLmdldENoaWxkQnlOYW1lKCdjb250ZW50X3BhbmVsJyk7XG4gICAgICAgIGlmICghY29udGVudFBhbmVsKSByZXR1cm47XG5cbiAgICAgICAgdmFyIHd4Q29udGFpbmVyID0gY29udGVudFBhbmVsLmdldENoaWxkQnlOYW1lKCd3eF9sb2dpbl9jb250YWluZXInKTtcbiAgICAgICAgaWYgKHd4Q29udGFpbmVyKSB7XG4gICAgICAgICAgICB2YXIgd3hCdG4gPSB3eENvbnRhaW5lci5nZXRDaGlsZEJ5TmFtZSgnd3hfbG9naW5fYnRuJyk7XG4gICAgICAgICAgICBpZiAod3hCdG4pIHtcbiAgICAgICAgICAgICAgICAvLyDmt7vliqDmjInpkq7ngrnlh7vmlYjmnpxcbiAgICAgICAgICAgICAgICB3eEJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9TVEFSVCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHd4QnRuLnNjYWxlID0gMC45NTtcbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB3eEJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB3eEJ0bi5zY2FsZSA9IDE7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX29uV2VjaGF0TG9naW5DbGljaygpO1xuICAgICAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHd4QnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0NBTkNFTCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHd4QnRuLnNjYWxlID0gMTtcbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICAgICAgICAgIC8vIOa3u+WKoFwi5b6u5L+h55m75b2VXCLmloflrZfmoIfnrb5cbiAgICAgICAgICAgICAgICB0aGlzLl9jcmVhdGVXZWNoYXRMYWJlbCh3eENvbnRhaW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g5Yib5bu65b6u5L+h55m75b2V5paH5a2X5qCH562+XG4gICAgX2NyZWF0ZVdlY2hhdExhYmVsOiBmdW5jdGlvbihjb250YWluZXIpIHtcbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm5bey5a2Y5Zyo5qCH562+XG4gICAgICAgIHZhciBleGlzdExhYmVsID0gY29udGFpbmVyLmdldENoaWxkQnlOYW1lKCd3eF9sb2dpbl9sYWJlbCcpO1xuICAgICAgICBpZiAoZXhpc3RMYWJlbCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBsYWJlbE5vZGUgPSBuZXcgY2MuTm9kZSgnd3hfbG9naW5fbGFiZWwnKTtcbiAgICAgICAgbGFiZWxOb2RlLnBhcmVudCA9IGNvbnRhaW5lcjtcbiAgICAgICAgbGFiZWxOb2RlLnkgPSAtMzU7XG5cbiAgICAgICAgdmFyIGxhYmVsID0gbGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGxhYmVsLnN0cmluZyA9ICflvq7kv6HnmbvlvZUnO1xuICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDE4O1xuICAgICAgICBsYWJlbC5saW5lSGVpZ2h0ID0gMjI7XG4gICAgICAgIGxhYmVsLmZvbnRGYW1pbHkgPSAnQXJpYWwnO1xuICAgICAgICBsYWJlbC5mb250Q29sb3IgPSBuZXcgY2MuQ29sb3IoMTIwLCAxMDAsIDgwLCAyNTUpO1xuICAgICAgICBsYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgIH0sXG5cbiAgICBfaW5pdEJ1dHRvbnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgLy8g5YWz6Zet5oyJ6ZKuXG4gICAgICAgIGlmICh0aGlzLmNsb3NlX2J0bikge1xuICAgICAgICAgICAgdGhpcy5jbG9zZV9idG4ubm9kZS5vZmYoY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5EKTtcbiAgICAgICAgICAgIHRoaXMuY2xvc2VfYnRuLm5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9vbkNsb3NlQ2xpY2soKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Y+R6YCB6aqM6K+B56CB5oyJ6ZKuXG4gICAgICAgIGlmICh0aGlzLnNlbmRfY29kZV9idG4pIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZF9jb2RlX2J0bi5ub2RlLm9mZihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQpO1xuICAgICAgICAgICAgdGhpcy5zZW5kX2NvZGVfYnRuLm5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9vblNlbmRDb2RlQ2xpY2soKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g55m75b2V5oyJ6ZKuXG4gICAgICAgIGlmICh0aGlzLmxvZ2luX2J0bikge1xuICAgICAgICAgICAgdGhpcy5sb2dpbl9idG4ubm9kZS5vZmYoY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5EKTtcbiAgICAgICAgICAgIHRoaXMubG9naW5fYnRuLm5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9vbkxvZ2luQ2xpY2soKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOW+ruS/oeeZu+W9leeCueWHu1xuICAgIF9vbldlY2hhdExvZ2luQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZygn44CQ5b6u5L+h55m75b2V44CR54K55Ye75b6u5L+h55m75b2V5oyJ6ZKuJyk7XG4gICAgICAgIFxuICAgICAgICAvLyDmo4Dmn6XmmK/lkKbmnInlhajlsYDnmoTlvq7kv6HnmbvlvZXmlrnms5VcbiAgICAgICAgaWYgKHdpbmRvdy5teWdsb2JhbCAmJiB3aW5kb3cubXlnbG9iYWwud2VjaGF0TG9naW4pIHtcbiAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC53ZWNoYXRMb2dpbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g6ZmN57qn77ya5o+Q56S655So5oi3XG4gICAgICAgICAgICB0aGlzLl9zaG93TWVzc2FnZSgn5b6u5L+h55m75b2V5Yqf6IO95pqC5pyq5byA5pS+JywgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g5omL5py65Y+36L6T5YWl5Y+Y5YyWXG4gICAgb25QaG9uZUlucHV0Q2hhbmdlZDogZnVuY3Rpb24oZWRpdGJveCwgY3VzdG9tRXZlbnREYXRhKSB7XG4gICAgICAgIHRoaXMuX3Bob25lID0gZWRpdGJveC5zdHJpbmc7XG4gICAgfSxcblxuICAgIC8vIOmqjOivgeeggei+k+WFpeWPmOWMllxuICAgIG9uQ29kZUlucHV0Q2hhbmdlZDogZnVuY3Rpb24oZWRpdGJveCwgY3VzdG9tRXZlbnREYXRhKSB7XG4gICAgICAgIHRoaXMuX2NvZGUgPSBlZGl0Ym94LnN0cmluZztcbiAgICB9LFxuXG4gICAgLy8g5Y+R6YCB6aqM6K+B56CBXG4gICAgX29uU2VuZENvZGVDbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBpZiAodGhpcy5fY291bnRkb3duID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5LuO6L6T5YWl5qGG6I635Y+W5omL5py65Y+3XG4gICAgICAgIGlmICh0aGlzLnBob25lX2lucHV0KSB7XG4gICAgICAgICAgICB0aGlzLl9waG9uZSA9IHRoaXMucGhvbmVfaW5wdXQuc3RyaW5nIHx8IFwiXCI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDpqozor4HmiYvmnLrlj7dcbiAgICAgICAgaWYgKCF0aGlzLl92YWxpZGF0ZVBob25lKHRoaXMuX3Bob25lKSkge1xuICAgICAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2UoXCLor7fovpPlhaXmraPnoa7nmoTmiYvmnLrlj7dcIiwgdHJ1ZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zaG93TWVzc2FnZShcIuato+WcqOWPkemAgS4uLlwiLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuX3NldEludGVyYWN0YWJsZShmYWxzZSk7XG5cbiAgICAgICAgLy8g6LCD55So5Y+R6YCB6aqM6K+B56CB5o6l5Y+jXG4gICAgICAgIHRoaXMuX3NlbmRDb2RlUmVxdWVzdCh0aGlzLl9waG9uZSwgZnVuY3Rpb24oc3VjY2VzcywgbWVzc2FnZSkge1xuICAgICAgICAgICAgc2VsZi5fc2V0SW50ZXJhY3RhYmxlKHRydWUpO1xuXG4gICAgICAgICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIHNlbGYuX3N0YXJ0Q291bnRkb3duKCk7XG4gICAgICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2UoXCLpqozor4HnoIHlt7Llj5HpgIFcIiwgZmFsc2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZShtZXNzYWdlIHx8IFwi5Y+R6YCB5aSx6LSl77yM6K+36YeN6K+VXCIsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8g55m75b2VXG4gICAgX29uTG9naW5DbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAvLyDku47ovpPlhaXmoYbojrflj5blgLxcbiAgICAgICAgaWYgKHRoaXMucGhvbmVfaW5wdXQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Bob25lID0gdGhpcy5waG9uZV9pbnB1dC5zdHJpbmcgfHwgXCJcIjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5jb2RlX2lucHV0KSB7XG4gICAgICAgICAgICB0aGlzLl9jb2RlID0gdGhpcy5jb2RlX2lucHV0LnN0cmluZyB8fCBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6aqM6K+B6L6T5YWlXG4gICAgICAgIGlmICghdGhpcy5fdmFsaWRhdGVQaG9uZSh0aGlzLl9waG9uZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dNZXNzYWdlKFwi6K+36L6T5YWl5q2j56Gu55qE5omL5py65Y+3XCIsIHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLl92YWxpZGF0ZUNvZGUodGhpcy5fY29kZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dNZXNzYWdlKFwi6K+36L6T5YWl6aqM6K+B56CBXCIsIHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2UoXCLmraPlnKjnmbvlvZUuLi5cIiwgZmFsc2UpO1xuICAgICAgICB0aGlzLl9zZXRJbnRlcmFjdGFibGUoZmFsc2UpO1xuXG4gICAgICAgIC8vIOiwg+eUqOeZu+W9leaOpeWPo1xuICAgICAgICB0aGlzLl9waG9uZUxvZ2luUmVxdWVzdCh0aGlzLl9waG9uZSwgdGhpcy5fY29kZSwgZnVuY3Rpb24oc3VjY2VzcywgbWVzc2FnZSwgZGF0YSkge1xuICAgICAgICAgICAgc2VsZi5fc2V0SW50ZXJhY3RhYmxlKHRydWUpO1xuXG4gICAgICAgICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlKFwi55m75b2V5oiQ5YqfXCIsIGZhbHNlKTtcblxuICAgICAgICAgICAgICAgIC8vIOS/neWtmOeUqOaIt+aVsOaNrlxuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cubXlnbG9iYWwgJiYgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEgJiYgZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS51bmlxdWVJRCA9IGRhdGEudW5pcXVlSUQgfHwgXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEID0gZGF0YS5hY2NvdW50SUQgfHwgXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEubmlja05hbWUgPSBkYXRhLm5pY2tOYW1lIHx8IFwi546p5a62XCI7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLmF2YXRhclVybCA9IGRhdGEuYXZhdGFyVXJsIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLmdvYmFsX2NvdW50ID0gZGF0YS5nb2xkY291bnQgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEudG9rZW4gPSBkYXRhLnRva2VuIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS/neWtmOWIsOacrOWcsOWtmOWCqFxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5zYXZlVG9Mb2NhbCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIuOAkOaJi+acuueZu+W9leOAkeeUqOaIt+aVsOaNruW3suS/neWtmCwgbmlja05hbWUgPVwiLCB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5uaWNrTmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g6Lez6L2s5Yiw5aSn5Y6F5Zy65pmvXG4gICAgICAgICAgICAgICAgc2VsZi5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX29uQ2xvc2VDbGljaygpO1xuICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIik7XG4gICAgICAgICAgICAgICAgfSwgMC41KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2UobWVzc2FnZSB8fCBcIueZu+W9leWksei0pe+8jOivt+mHjeivlVwiLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8vIOWFs+mXreW8ueeql1xuICAgIF9vbkNsb3NlQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMubm9kZSB8fCAhdGhpcy5ub2RlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fY291bnRkb3duID4gMCkge1xuICAgICAgICAgICAgdGhpcy51bnNjaGVkdWxlKHRoaXMuX2NvdW50ZG93blRpY2spO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubm9kZS5kZXN0cm95KCk7XG4gICAgfSxcblxuICAgIC8vIOmqjOivgeaJi+acuuWPt1xuICAgIF92YWxpZGF0ZVBob25lOiBmdW5jdGlvbihwaG9uZSkge1xuICAgICAgICBpZiAoIXBob25lIHx8IHBob25lLmxlbmd0aCAhPT0gMTEpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyDnroDljZXpqozor4HvvJrku6Ux5byA5aS055qEMTHkvY3mlbDlrZdcbiAgICAgICAgdmFyIHJlZyA9IC9eMVszLTldXFxkezl9JC87XG4gICAgICAgIHJldHVybiByZWcudGVzdChwaG9uZSk7XG4gICAgfSxcblxuICAgIC8vIOmqjOivgemqjOivgeeggVxuICAgIF92YWxpZGF0ZUNvZGU6IGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgICAgLy8g5L+d55WZ6Z2e56m65qOA5rWL77yM5rWL6K+V6Zi25q615LiN6aqM6K+B5qC85byPXG4gICAgICAgIHJldHVybiBjb2RlICYmIGNvZGUubGVuZ3RoID4gMDtcbiAgICB9LFxuXG4gICAgLy8g5byA5aeL5YCS6K6h5pe2XG4gICAgX3N0YXJ0Q291bnRkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fY291bnRkb3duID0gdGhpcy5jb3VudGRvd25fdGltZTtcbiAgICAgICAgdGhpcy5fdXBkYXRlQ291bnRkb3duTGFiZWwoKTtcblxuICAgICAgICB0aGlzLnNjaGVkdWxlKHRoaXMuX2NvdW50ZG93blRpY2ssIDEpO1xuICAgIH0sXG5cbiAgICAvLyDlgJLorqHml7bmr4/np5Llm57osINcbiAgICBfY291bnRkb3duVGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX2NvdW50ZG93bi0tO1xuXG4gICAgICAgIGlmICh0aGlzLl9jb3VudGRvd24gPD0gMCkge1xuICAgICAgICAgICAgdGhpcy51bnNjaGVkdWxlKHRoaXMuX2NvdW50ZG93blRpY2spO1xuICAgICAgICAgICAgdGhpcy5fcmVzZXRTZW5kQ29kZUJ0bigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlQ291bnRkb3duTGFiZWwoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDmm7TmlrDlgJLorqHml7bmoIfnrb5cbiAgICBfdXBkYXRlQ291bnRkb3duTGFiZWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5zZW5kX2NvZGVfbGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZF9jb2RlX2xhYmVsLnN0cmluZyA9IHRoaXMuX2NvdW50ZG93biArIFwi56eS5ZCO6YeN6K+VXCI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zZW5kX2NvZGVfYnRuKSB7XG4gICAgICAgICAgICB0aGlzLnNlbmRfY29kZV9idG4uaW50ZXJhY3RhYmxlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g6YeN572u5Y+R6YCB6aqM6K+B56CB5oyJ6ZKuXG4gICAgX3Jlc2V0U2VuZENvZGVCdG46IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5zZW5kX2NvZGVfbGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZF9jb2RlX2xhYmVsLnN0cmluZyA9IFwi6I635Y+W6aqM6K+B56CBXCI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zZW5kX2NvZGVfYnRuKSB7XG4gICAgICAgICAgICB0aGlzLnNlbmRfY29kZV9idG4uaW50ZXJhY3RhYmxlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDmmL7npLrmtojmga9cbiAgICBfc2hvd01lc3NhZ2U6IGZ1bmN0aW9uKG1lc3NhZ2UsIGlzRXJyb3IpIHtcbiAgICAgICAgaWYgKHRoaXMubWVzc2FnZV9sYWJlbCkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlX2xhYmVsLm5vZGUuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZV9sYWJlbC5zdHJpbmcgPSBtZXNzYWdlO1xuXG4gICAgICAgICAgICBpZiAoaXNFcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZV9sYWJlbC5ub2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMTAwLCAxMDApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VfbGFiZWwubm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigxMDAsIDIwMCwgMTAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGlzRXJyb3IgPyAnW+mUmeivr10nIDogJ1vkv6Hmga9dJywgbWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g6ZqQ6JeP5raI5oGvXG4gICAgX2hpZGVNZXNzYWdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMubWVzc2FnZV9sYWJlbCkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlX2xhYmVsLm5vZGUuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g6K6+572u5oyJ6ZKu5Lqk5LqS54q25oCBXG4gICAgX3NldEludGVyYWN0YWJsZTogZnVuY3Rpb24oaW50ZXJhY3RhYmxlKSB7XG4gICAgICAgIGlmICh0aGlzLmxvZ2luX2J0bikge1xuICAgICAgICAgICAgdGhpcy5sb2dpbl9idG4uaW50ZXJhY3RhYmxlID0gaW50ZXJhY3RhYmxlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2VuZF9jb2RlX2J0biAmJiB0aGlzLl9jb3VudGRvd24gPD0gMCkge1xuICAgICAgICAgICAgdGhpcy5zZW5kX2NvZGVfYnRuLmludGVyYWN0YWJsZSA9IGludGVyYWN0YWJsZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDlj5HpgIHpqozor4HnoIHor7fmsYIgLSDkvb/nlKhIdHRwQVBJ5pSv5oyB5Yqg5a+G6Kej5a+GXG4gICAgX3NlbmRDb2RlUmVxdWVzdDogZnVuY3Rpb24ocGhvbmUsIGNhbGxiYWNrKSB7XG5cbiAgICAgICAgdmFyIGRlZmluZXMgPSB3aW5kb3cuZGVmaW5lcztcbiAgICAgICAgaWYgKCFkZWZpbmVzIHx8ICFkZWZpbmVzLmFwaVVybCkge1xuICAgICAgICAgICAgY2FsbGJhY2sodHJ1ZSwgXCLlj5HpgIHmiJDlip9cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdXJsID0gZGVmaW5lcy5hcGlVcmwgKyAnL2FwaS92MS9hdXRoL3NlbmQtY29kZSc7XG4gICAgICAgIHZhciBjcnlwdG9LZXkgPSBkZWZpbmVzLmNyeXB0b0tleSB8fCBcIlwiO1xuXG4gICAgICAgIC8vIOS9v+eUqEh0dHBBUEkucG9zdEVuY3J5cHRlZOWPkemAgeWKoOWvhuivt+axglxuICAgICAgICBpZiAod2luZG93Lkh0dHBBUEkgJiYgd2luZG93Lkh0dHBBUEkucG9zdEVuY3J5cHRlZCkge1xuICAgICAgICAgICAgd2luZG93Lkh0dHBBUEkucG9zdEVuY3J5cHRlZCh1cmwsICdzZW5kX2NvZGUnLCB7IHBob25lOiBwaG9uZSB9LCBjcnlwdG9LZXksIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi5Y+R6YCB6aqM6K+B56CB5aSx6LSlOlwiLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LmNvZGUgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwi6aqM6K+B56CB5bey5Y+R6YCBXCI7XG4gICAgICAgICAgICAgICAgICAgIC8vIOW8gOWPkeeOr+Wig++8muaYvuekuumqjOivgeeggVxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmRhdGEgJiYgcmVzdWx0LmRhdGEuY29kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXNnID0gXCLpqozor4HnoIE6IFwiICsgcmVzdWx0LmRhdGEuY29kZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh0cnVlLCBtc2cpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCByZXN1bHQgPyByZXN1bHQubWVzc2FnZSA6IFwi5Y+R6YCB5aSx6LSlXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g6ZmN57qn77ya55u05o6l5Y+R6YCB6K+35rGC77yI5LiN5pSv5oyB6Kej5a+G77yJXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJIdHRwQVBJ5pyq5Yqg6L2977yM5L2/55So5Y6f5aeL6K+35rGCXCIpO1xuICAgICAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICAgeGhyLm9wZW4oJ1BPU1QnLCB1cmwsIHRydWUpO1xuICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICB4aHIudGltZW91dCA9IDEwMDAwO1xuXG4gICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5qOA5p+l5piv5ZCm5piv5Yqg5a+G5ZON5bqUXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UudGltZXN0YW1wICYmIHR5cGVvZiByZXNwb25zZS5kYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgXCLmnI3liqHlmajov5Tlm57liqDlr4bmlbDmja7vvIzor7fliLfmlrDpobXpnaLph43or5VcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5jb2RlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHRydWUsIFwi6aqM6K+B56CB5bey5Y+R6YCBXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCByZXNwb25zZS5tZXNzYWdlIHx8IFwi5Y+R6YCB5aSx6LSlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgXCLop6PmnpDlk43lupTlpLHotKVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgXCLnvZHnu5zor7fmsYLlpLHotKVcIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB4aHIub250aW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIFwi6K+35rGC6LaF5pe2XCIpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgXCLnvZHnu5zplJnor69cIik7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB4aHIuc2VuZChKU09OLnN0cmluZ2lmeSh7IHBob25lOiBwaG9uZSB9KSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g5omL5py65Y+355m75b2V6K+35rGCIC0g5L2/55SoSHR0cEFQSeaUr+aMgeWKoOWvhuino+WvhlxuICAgIF9waG9uZUxvZ2luUmVxdWVzdDogZnVuY3Rpb24ocGhvbmUsIGNvZGUsIGNhbGxiYWNrKSB7XG5cbiAgICAgICAgdmFyIGRlZmluZXMgPSB3aW5kb3cuZGVmaW5lcztcbiAgICAgICAgaWYgKCFkZWZpbmVzIHx8ICFkZWZpbmVzLmFwaVVybCkge1xuICAgICAgICAgICAgY2FsbGJhY2sodHJ1ZSwgXCLnmbvlvZXmiJDlip9cIiwge1xuICAgICAgICAgICAgICAgIHVuaXF1ZUlEOiBcInBob25lX1wiICsgcGhvbmUsXG4gICAgICAgICAgICAgICAgYWNjb3VudElEOiBcInBob25lX1wiICsgcGhvbmUsXG4gICAgICAgICAgICAgICAgbmlja05hbWU6IFwi546p5a62XCIgKyBwaG9uZS5zdWJzdHIoLTQpLFxuICAgICAgICAgICAgICAgIGF2YXRhclVybDogXCJcIixcbiAgICAgICAgICAgICAgICBnb2xkY291bnQ6IDEwMDAsXG4gICAgICAgICAgICAgICAgdG9rZW46IFwibW9ja190b2tlbl9cIiArIERhdGUubm93KClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHVybCA9IGRlZmluZXMuYXBpVXJsICsgJy9hcGkvdjEvYXV0aC9waG9uZS1sb2dpbic7XG4gICAgICAgIHZhciBjcnlwdG9LZXkgPSBkZWZpbmVzLmNyeXB0b0tleSB8fCBcIlwiO1xuXG4gICAgICAgIC8vIOWHhuWkh+ivt+axguaVsOaNrlxuICAgICAgICB2YXIgcmVxdWVzdERhdGEgPSB7XG4gICAgICAgICAgICBwaG9uZTogcGhvbmUsXG4gICAgICAgICAgICBjb2RlOiBjb2RlXG4gICAgICAgIH07XG5cblxuICAgICAgICAvLyDkvb/nlKhIdHRwQVBJLnBvc3RFbmNyeXB0ZWTlj5HpgIHliqDlr4bor7fmsYJcbiAgICAgICAgaWYgKHdpbmRvdy5IdHRwQVBJICYmIHdpbmRvdy5IdHRwQVBJLnBvc3RFbmNyeXB0ZWQpIHtcbiAgICAgICAgICAgIHdpbmRvdy5IdHRwQVBJLnBvc3RFbmNyeXB0ZWQodXJsLCAncGhvbmVfbG9naW4nLCByZXF1ZXN0RGF0YSwgY3J5cHRvS2V5LCBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIueZu+W9leivt+axguWksei0pTpcIiwgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIGVyciwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICYmIHJlc3VsdC5jb2RlID09PSAwICYmIHJlc3VsdC5kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHRydWUsIFwi55m75b2V5oiQ5YqfXCIsIHJlc3VsdC5kYXRhKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgcmVzdWx0ID8gcmVzdWx0Lm1lc3NhZ2UgOiBcIueZu+W9leWksei0pVwiLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOmZjee6p++8muebtOaOpeWPkemAgeivt+axglxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiSHR0cEFQSeacquWKoOi9ve+8jOS9v+eUqOWOn+Wni+ivt+axglwiKTtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIHhoci5vcGVuKCdQT1NUJywgdXJsLCB0cnVlKTtcbiAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ1gtRGV2aWNlLUlEJywgdGhpcy5fZ2V0RGV2aWNlSUQoKSk7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignWC1EZXZpY2UtVHlwZScsIHRoaXMuX2dldERldmljZVR5cGUoKSk7XG4gICAgICAgICAgICB4aHIudGltZW91dCA9IDEwMDAwO1xuXG4gICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwb25zZSA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEgJiYgcmVzcG9uc2UudGltZXN0YW1wICYmIHR5cGVvZiByZXNwb25zZS5kYXRhID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDliqDlr4blk43lupTvvIzpnIDopoHop6Plr4ZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5IdHRwQVBJICYmIHdpbmRvdy5IdHRwQVBJLmRlY3J5cHRBRVNHQ00pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5IdHRwQVBJLmRlY3J5cHRBRVNHQ00ocmVzcG9uc2UuZGF0YSwgY3J5cHRvS2V5KS50aGVuKGZ1bmN0aW9uKGRlY3J5cHRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZWNyeXB0ZWQgJiYgZGVjcnlwdGVkLmNvZGUgPT09IDAgJiYgZGVjcnlwdGVkLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodHJ1ZSwgXCLnmbvlvZXmiJDlip9cIiwgZGVjcnlwdGVkLmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCBkZWNyeXB0ZWQgPyBkZWNyeXB0ZWQubWVzc2FnZSA6IFwi55m75b2V5aSx6LSlXCIsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGRlY3J5cHRFcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi6Kej5a+G5aSx6LSlOlwiLCBkZWNyeXB0RXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgXCLop6Plr4blk43lupTlpLHotKVcIiwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCBcIuacjeWKoeWZqOi/lOWbnuWKoOWvhuaVsOaNru+8jOivt+WIt+aWsOmhtemdoumHjeivlVwiLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UuY29kZSA9PT0gMCAmJiByZXNwb25zZS5kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHRydWUsIFwi55m75b2V5oiQ5YqfXCIsIHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCByZXNwb25zZS5tZXNzYWdlIHx8IFwi55m75b2V5aSx6LSlXCIsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi6Kej5p6Q5ZON5bqU5aSx6LSlOlwiLCBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgXCLop6PmnpDlk43lupTlpLHotKVcIiwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgXCLnvZHnu5zor7fmsYLlpLHotKU6IEhUVFAgXCIgKyB4aHIuc3RhdHVzLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHhoci5vbnRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgXCLor7fmsYLotoXml7ZcIiwgbnVsbCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCBcIue9kee7nOmUmeivr1wiLCBudWxsKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KHJlcXVlc3REYXRhKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g6K6+5aSH5L+h5oGv6I635Y+WXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvLyDojrflj5borr7lpIfllK/kuIDmoIfor4ZcbiAgICBfZ2V0RGV2aWNlSUQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgREVWSUNFX0lEX0tFWSA9IFwiZGR6X2RldmljZV9pZFwiO1xuICAgICAgICB2YXIgZGV2aWNlSWQgPSBcIlwiO1xuXG4gICAgICAgIC8vIOWwneivleS7juacrOWcsOWtmOWCqOiOt+WPllxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZGV2aWNlSWQgPSBjYy5zeXMubG9jYWxTdG9yYWdlLmdldEl0ZW0oREVWSUNFX0lEX0tFWSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWmguaenOS4jeWtmOWcqO+8jOeUn+aIkOaWsOeahOiuvuWkh0lEXG4gICAgICAgIGlmICghZGV2aWNlSWQpIHtcbiAgICAgICAgICAgIGRldmljZUlkID0gdGhpcy5fZ2VuZXJhdGVVVUlEKCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNjLnN5cy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShERVZJQ0VfSURfS0VZLCBkZXZpY2VJZCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGV2aWNlSWQ7XG4gICAgfSxcblxuICAgIC8vIOiOt+WPluiuvuWkh+exu+Wei1xuICAgIF9nZXREZXZpY2VUeXBlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBsYXRmb3JtID0gY2Muc3lzLnBsYXRmb3JtO1xuICAgICAgICB2YXIgb3MgPSBjYy5zeXMub3M7XG4gICAgICAgIHZhciBkZXZpY2VUeXBlID0gXCJVbmtub3duXCI7XG5cbiAgICAgICAgLy8g5qC55o2u5bmz5Y+w5Yik5patXG4gICAgICAgIGlmIChwbGF0Zm9ybSA9PT0gY2Muc3lzLldFQ0hBVF9HQU1FKSB7XG4gICAgICAgICAgICBkZXZpY2VUeXBlID0gXCJXZUNoYXRcIjtcbiAgICAgICAgfSBlbHNlIGlmIChwbGF0Zm9ybSA9PT0gY2Muc3lzLkFORFJPSUQpIHtcbiAgICAgICAgICAgIGRldmljZVR5cGUgPSBcIkFuZHJvaWRcIjtcbiAgICAgICAgfSBlbHNlIGlmIChwbGF0Zm9ybSA9PT0gY2Muc3lzLklQSE9ORSkge1xuICAgICAgICAgICAgZGV2aWNlVHlwZSA9IFwiaVBob25lXCI7XG4gICAgICAgIH0gZWxzZSBpZiAocGxhdGZvcm0gPT09IGNjLnN5cy5JUEFEKSB7XG4gICAgICAgICAgICBkZXZpY2VUeXBlID0gXCJpUGFkXCI7XG4gICAgICAgIH0gZWxzZSBpZiAocGxhdGZvcm0gPT09IGNjLnN5cy5NQUNfT1MpIHtcbiAgICAgICAgICAgIGRldmljZVR5cGUgPSBcIk1hY1wiO1xuICAgICAgICB9IGVsc2UgaWYgKHBsYXRmb3JtID09PSBjYy5zeXMuV0lORE9XUykge1xuICAgICAgICAgICAgZGV2aWNlVHlwZSA9IFwiV2luZG93c1wiO1xuICAgICAgICB9IGVsc2UgaWYgKHBsYXRmb3JtID09PSBjYy5zeXMuTElOVVgpIHtcbiAgICAgICAgICAgIGRldmljZVR5cGUgPSBcIkxpbnV4XCI7XG4gICAgICAgIH0gZWxzZSBpZiAocGxhdGZvcm0gPT09IGNjLnN5cy5NT0JJTEVfQlJPV1NFUikge1xuICAgICAgICAgICAgaWYgKG9zID09PSBjYy5zeXMuT1NfSU9TKSB7XG4gICAgICAgICAgICAgICAgZGV2aWNlVHlwZSA9IFwiaU9TIEJyb3dzZXJcIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob3MgPT09IGNjLnN5cy5PU19BTkRST0lEKSB7XG4gICAgICAgICAgICAgICAgZGV2aWNlVHlwZSA9IFwiQW5kcm9pZCBCcm93c2VyXCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRldmljZVR5cGUgPSBcIk1vYmlsZSBCcm93c2VyXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAocGxhdGZvcm0gPT09IGNjLnN5cy5ERVNLVE9QX0JST1dTRVIpIHtcbiAgICAgICAgICAgIGlmIChvcyA9PT0gY2Muc3lzLk9TX1dJTkRPV1MpIHtcbiAgICAgICAgICAgICAgICBkZXZpY2VUeXBlID0gXCJXaW5kb3dzIEJyb3dzZXJcIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAob3MgPT09IGNjLnN5cy5PU19PU1gpIHtcbiAgICAgICAgICAgICAgICBkZXZpY2VUeXBlID0gXCJNYWMgQnJvd3NlclwiO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChvcyA9PT0gY2Muc3lzLk9TX0xJTlVYKSB7XG4gICAgICAgICAgICAgICAgZGV2aWNlVHlwZSA9IFwiTGludXggQnJvd3NlclwiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZXZpY2VUeXBlID0gXCJEZXNrdG9wIEJyb3dzZXJcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOa3u+WKoOa1j+iniOWZqOS/oeaBr1xuICAgICAgICB2YXIgYnJvd3NlclR5cGUgPSBjYy5zeXMuYnJvd3NlclR5cGU7XG4gICAgICAgIGlmIChicm93c2VyVHlwZSkge1xuICAgICAgICAgICAgZGV2aWNlVHlwZSArPSBcIiAoXCIgKyBicm93c2VyVHlwZSArIFwiKVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRldmljZVR5cGU7XG4gICAgfSxcblxuICAgIC8vIOeUn+aIkFVVSURcbiAgICBfZ2VuZXJhdGVVVUlEOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgdmFyIHV1aWQgPSAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgIHZhciByID0gKGQgKyBNYXRoLnJhbmRvbSgpICogMTYpICUgMTYgfCAwO1xuICAgICAgICAgICAgZCA9IE1hdGguZmxvb3IoZCAvIDE2KTtcbiAgICAgICAgICAgIHJldHVybiAoYyA9PT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KSkudG9TdHJpbmcoMTYpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHV1aWQ7XG4gICAgfVxufSk7XG4iXX0=