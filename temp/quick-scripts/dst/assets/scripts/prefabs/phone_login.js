
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
    var cryptoKey = defines.cryptoKey || ""; // 使用HttpAPI.post发送请求（支持加密解密）

    if (window.HttpAPI) {
      window.HttpAPI.post(url, {
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
    }; // 使用HttpAPI.post发送请求（支持加密解密）

    if (window.HttpAPI && window.HttpAPI.post) {
      window.HttpAPI.post(url, requestData, cryptoKey, function (err, result) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL3ByZWZhYnMvcGhvbmVfbG9naW4uanMiXSwibmFtZXMiOlsiY2MiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJwaG9uZV9pbnB1dCIsInR5cGUiLCJFZGl0Qm94IiwiY29kZV9pbnB1dCIsInNlbmRfY29kZV9idG4iLCJCdXR0b24iLCJsb2dpbl9idG4iLCJjbG9zZV9idG4iLCJ3eF9sb2dpbl9idG4iLCJTcHJpdGUiLCJzZW5kX2NvZGVfbGFiZWwiLCJMYWJlbCIsIm1lc3NhZ2VfbGFiZWwiLCJjb3VudGRvd25fdGltZSIsIkJBU0VfV0lEVEgiLCJCQVNFX0hFSUdIVCIsIm9uTG9hZCIsIl9jb3VudGRvd24iLCJfcGhvbmUiLCJfY29kZSIsImFkYXB0RGlhbG9nIiwic2VsZiIsInZpZXciLCJzZXRSZXNpemVDYWxsYmFjayIsIl9pbml0UGFuZWxBbmltYXRpb24iLCJfZHJhd0lucHV0Qm9yZGVycyIsIl9pbml0RWRpdEJveGVzIiwiX2luaXRCdXR0b25zIiwiX2luaXRXZWNoYXRCdXR0b24iLCJfaGlkZU1lc3NhZ2UiLCJzdHJpbmciLCJzdGF5T25Ub3AiLCJmb250U2l6ZSIsImxpbmVIZWlnaHQiLCJmb250Q29sb3IiLCJDb2xvciIsInBsYWNlaG9sZGVyRm9udENvbG9yIiwibm9kZSIsIm9uIiwiX29uUGhvbmVJbnB1dEZvY3VzIiwiX29uUGhvbmVJbnB1dEJsdXIiLCJlZGl0Ym94IiwiX29uQ29kZUlucHV0Rm9jdXMiLCJfb25Db2RlSW5wdXRCbHVyIiwicGFuZWwiLCJnZXRDaGlsZEJ5TmFtZSIsIndpblciLCJ3aW5TaXplIiwid2lkdGgiLCJ3aW5IIiwiaGVpZ2h0IiwidGFyZ2V0V2lkdGgiLCJNYXRoIiwibWF4IiwibWluIiwic2NhbGUiLCJtYXhTY2FsZVkiLCJjb25zb2xlIiwibG9nIiwicm91bmQiLCJ0b0ZpeGVkIiwiY29udGVudFBhbmVsIiwidGFyZ2V0U2NhbGUiLCJvcGFjaXR5IiwidHdlZW4iLCJ0byIsImVhc2luZyIsInN0YXJ0IiwicGhvbmVCZyIsImdyYXBoaWNzIiwiZ2V0Q29tcG9uZW50IiwiR3JhcGhpY3MiLCJjbGVhciIsImZpbGxDb2xvciIsIl9kcmF3Um91bmRSZWN0IiwiZmlsbCIsInN0cm9rZUNvbG9yIiwibGluZVdpZHRoIiwic3Ryb2tlIiwicGhvbmVJbnB1dCIsInpJbmRleCIsImNvZGVSb3ciLCJjb2RlQmciLCJjb2RlSW5wdXQiLCJkaXZpZGVyIiwibW92ZVRvIiwibGluZVRvIiwieCIsInkiLCJ3IiwiaCIsInIiLCJhcmNUbyIsInd4Q29udGFpbmVyIiwid3hCdG4iLCJOb2RlIiwiRXZlbnRUeXBlIiwiVE9VQ0hfU1RBUlQiLCJUT1VDSF9FTkQiLCJfb25XZWNoYXRMb2dpbkNsaWNrIiwiVE9VQ0hfQ0FOQ0VMIiwiX2NyZWF0ZVdlY2hhdExhYmVsIiwiY29udGFpbmVyIiwiZXhpc3RMYWJlbCIsImxhYmVsTm9kZSIsInBhcmVudCIsImxhYmVsIiwiYWRkQ29tcG9uZW50IiwiZm9udEZhbWlseSIsImhvcml6b250YWxBbGlnbiIsIkhvcml6b250YWxBbGlnbiIsIkNFTlRFUiIsIm9mZiIsIl9vbkNsb3NlQ2xpY2siLCJfb25TZW5kQ29kZUNsaWNrIiwiX29uTG9naW5DbGljayIsIndpbmRvdyIsIm15Z2xvYmFsIiwid2VjaGF0TG9naW4iLCJfc2hvd01lc3NhZ2UiLCJvblBob25lSW5wdXRDaGFuZ2VkIiwiY3VzdG9tRXZlbnREYXRhIiwib25Db2RlSW5wdXRDaGFuZ2VkIiwiX3ZhbGlkYXRlUGhvbmUiLCJfc2V0SW50ZXJhY3RhYmxlIiwiX3NlbmRDb2RlUmVxdWVzdCIsInN1Y2Nlc3MiLCJtZXNzYWdlIiwiX3N0YXJ0Q291bnRkb3duIiwiX3ZhbGlkYXRlQ29kZSIsIl9waG9uZUxvZ2luUmVxdWVzdCIsImRhdGEiLCJwbGF5ZXJEYXRhIiwidW5pcXVlSUQiLCJhY2NvdW50SUQiLCJuaWNrTmFtZSIsImF2YXRhclVybCIsImdvYmFsX2NvdW50IiwiZ29sZGNvdW50IiwidG9rZW4iLCJzYXZlVG9Mb2NhbCIsInNjaGVkdWxlT25jZSIsImRpcmVjdG9yIiwibG9hZFNjZW5lIiwiaXNWYWxpZCIsInVuc2NoZWR1bGUiLCJfY291bnRkb3duVGljayIsImRlc3Ryb3kiLCJwaG9uZSIsImxlbmd0aCIsInJlZyIsInRlc3QiLCJjb2RlIiwiX3VwZGF0ZUNvdW50ZG93bkxhYmVsIiwic2NoZWR1bGUiLCJfcmVzZXRTZW5kQ29kZUJ0biIsImludGVyYWN0YWJsZSIsImlzRXJyb3IiLCJhY3RpdmUiLCJjb2xvciIsImNhbGxiYWNrIiwiZGVmaW5lcyIsImFwaVVybCIsInVybCIsImNyeXB0b0tleSIsIkh0dHBBUEkiLCJwb3N0IiwiZXJyIiwicmVzdWx0IiwiZXJyb3IiLCJtc2ciLCJ3YXJuIiwieGhyIiwiWE1MSHR0cFJlcXVlc3QiLCJvcGVuIiwic2V0UmVxdWVzdEhlYWRlciIsInRpbWVvdXQiLCJvbnJlYWR5c3RhdGVjaGFuZ2UiLCJyZWFkeVN0YXRlIiwic3RhdHVzIiwicmVzcG9uc2UiLCJKU09OIiwicGFyc2UiLCJyZXNwb25zZVRleHQiLCJ0aW1lc3RhbXAiLCJlIiwib250aW1lb3V0Iiwib25lcnJvciIsInNlbmQiLCJzdHJpbmdpZnkiLCJzdWJzdHIiLCJEYXRlIiwibm93IiwicmVxdWVzdERhdGEiLCJfZ2V0RGV2aWNlSUQiLCJfZ2V0RGV2aWNlVHlwZSIsImRlY3J5cHRBRVNHQ00iLCJ0aGVuIiwiZGVjcnlwdGVkIiwiZGVjcnlwdEVyciIsIkRFVklDRV9JRF9LRVkiLCJkZXZpY2VJZCIsInN5cyIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJfZ2VuZXJhdGVVVUlEIiwic2V0SXRlbSIsInBsYXRmb3JtIiwib3MiLCJkZXZpY2VUeXBlIiwiV0VDSEFUX0dBTUUiLCJBTkRST0lEIiwiSVBIT05FIiwiSVBBRCIsIk1BQ19PUyIsIldJTkRPV1MiLCJMSU5VWCIsIk1PQklMRV9CUk9XU0VSIiwiT1NfSU9TIiwiT1NfQU5EUk9JRCIsIkRFU0tUT1BfQlJPV1NFUiIsIk9TX1dJTkRPV1MiLCJPU19PU1giLCJPU19MSU5VWCIsImJyb3dzZXJUeXBlIiwiZCIsImdldFRpbWUiLCJ1dWlkIiwicmVwbGFjZSIsImMiLCJyYW5kb20iLCJmbG9vciIsInRvU3RyaW5nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUVBQSxFQUFFLENBQUNDLEtBQUgsQ0FBUztFQUNMLFdBQVNELEVBQUUsQ0FBQ0UsU0FEUDtFQUdMQyxVQUFVLEVBQUU7SUFDUjtJQUNBQyxXQUFXLEVBQUU7TUFDVEMsSUFBSSxFQUFFTCxFQUFFLENBQUNNLE9BREE7TUFFVCxXQUFTO0lBRkEsQ0FGTDtJQU1SQyxVQUFVLEVBQUU7TUFDUkYsSUFBSSxFQUFFTCxFQUFFLENBQUNNLE9BREQ7TUFFUixXQUFTO0lBRkQsQ0FOSjtJQVdSO0lBQ0FFLGFBQWEsRUFBRTtNQUNYSCxJQUFJLEVBQUVMLEVBQUUsQ0FBQ1MsTUFERTtNQUVYLFdBQVM7SUFGRSxDQVpQO0lBZ0JSQyxTQUFTLEVBQUU7TUFDUEwsSUFBSSxFQUFFTCxFQUFFLENBQUNTLE1BREY7TUFFUCxXQUFTO0lBRkYsQ0FoQkg7SUFvQlJFLFNBQVMsRUFBRTtNQUNQTixJQUFJLEVBQUVMLEVBQUUsQ0FBQ1MsTUFERjtNQUVQLFdBQVM7SUFGRixDQXBCSDtJQXlCUjtJQUNBRyxZQUFZLEVBQUU7TUFDVlAsSUFBSSxFQUFFTCxFQUFFLENBQUNhLE1BREM7TUFFVixXQUFTO0lBRkMsQ0ExQk47SUErQlI7SUFDQUMsZUFBZSxFQUFFO01BQ2JULElBQUksRUFBRUwsRUFBRSxDQUFDZSxLQURJO01BRWIsV0FBUztJQUZJLENBaENUO0lBb0NSQyxhQUFhLEVBQUU7TUFDWFgsSUFBSSxFQUFFTCxFQUFFLENBQUNlLEtBREU7TUFFWCxXQUFTO0lBRkUsQ0FwQ1A7SUF5Q1I7SUFDQUUsY0FBYyxFQUFFLEVBMUNSO0lBNENSO0lBQ0FDLFVBQVUsRUFBRSxHQTdDSjtJQThDUkMsV0FBVyxFQUFFO0VBOUNMLENBSFA7RUFvRExDLE1BQU0s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iLblmahcbi8vIOeUqOS6juWkhOeQhuaJi+acuuWPt+mqjOivgeeggeeZu+W9leWKn+iDvVxuLy8g6K6+6K6h6aOO5qC877ya5Lit5Zu96aOO5ZWG5Lia5qOL54mM77yI5ZON5bqU5byP6YCC6YWN77ya5a695bqmNjAl77yM6auY5bqm6Ieq6YCC5bqU77yJXG5cbmNjLkNsYXNzKHtcbiAgICBleHRlbmRzOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIC8vIOi+k+WFpeahhlxuICAgICAgICBwaG9uZV9pbnB1dDoge1xuICAgICAgICAgICAgdHlwZTogY2MuRWRpdEJveCxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgY29kZV9pbnB1dDoge1xuICAgICAgICAgICAgdHlwZTogY2MuRWRpdEJveCxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcblxuICAgICAgICAvLyDmjInpkq5cbiAgICAgICAgc2VuZF9jb2RlX2J0bjoge1xuICAgICAgICAgICAgdHlwZTogY2MuQnV0dG9uLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICBsb2dpbl9idG46IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLkJ1dHRvbixcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgY2xvc2VfYnRuOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5CdXR0b24sXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8g5b6u5L+h55m75b2V5oyJ6ZKuXG4gICAgICAgIHd4X2xvZ2luX2J0bjoge1xuICAgICAgICAgICAgdHlwZTogY2MuU3ByaXRlLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIOagh+etvlxuICAgICAgICBzZW5kX2NvZGVfbGFiZWw6IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLkxhYmVsLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICBtZXNzYWdlX2xhYmVsOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5MYWJlbCxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcblxuICAgICAgICAvLyDlgJLorqHml7bml7bpl7RcbiAgICAgICAgY291bnRkb3duX3RpbWU6IDYwLFxuXG4gICAgICAgIC8vIOWfuuWHhuiuvuiuoeWwuuWvuO+8iOeUqOS6juiuoeeul3NjYWxl77yJXG4gICAgICAgIEJBU0VfV0lEVEg6IDQwMCxcbiAgICAgICAgQkFTRV9IRUlHSFQ6IDUyMFxuICAgIH0sXG5cbiAgICBvbkxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9jb3VudGRvd24gPSAwO1xuICAgICAgICB0aGlzLl9waG9uZSA9IFwiXCI7XG4gICAgICAgIHRoaXMuX2NvZGUgPSBcIlwiO1xuXG4gICAgICAgIC8vIOeri+WNs+aJp+ihjOW8ueeql+WwuuWvuOmAgumFjVxuICAgICAgICB0aGlzLmFkYXB0RGlhbG9nKCk7XG5cbiAgICAgICAgLy8g55uR5ZCs5bGP5bmV5bC65a+45Y+Y5YyWXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgY2Mudmlldy5zZXRSZXNpemVDYWxsYmFjayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuYWRhcHREaWFsb2coKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5Yid5aeL5YyW5by556qX5Yqo55S7XG4gICAgICAgIHRoaXMuX2luaXRQYW5lbEFuaW1hdGlvbigpO1xuICAgICAgICBcbiAgICAgICAgLy8g57uY5Yi25ZyG6KeS6L6T5YWl5qGG6L655qGGXG4gICAgICAgIHRoaXMuX2RyYXdJbnB1dEJvcmRlcnMoKTtcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOWIneWni+WMliBFZGl0Qm94IOagt+W8j+WSjOS6i+S7tiA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB0aGlzLl9pbml0RWRpdEJveGVzKCk7XG4gICAgICAgIFxuICAgICAgICAvLyDliJ3lp4vljJbmjInpkq7kuovku7ZcbiAgICAgICAgdGhpcy5faW5pdEJ1dHRvbnMoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWIneWni+WMluW+ruS/oeeZu+W9leaMiemSrlxuICAgICAgICB0aGlzLl9pbml0V2VjaGF0QnV0dG9uKCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9oaWRlTWVzc2FnZSgpO1xuXG4gICAgICAgIC8vIOiOt+WPlui+k+WFpeahhuWIneWni+WAvFxuICAgICAgICBpZiAodGhpcy5waG9uZV9pbnB1dCkge1xuICAgICAgICAgICAgdGhpcy5fcGhvbmUgPSB0aGlzLnBob25lX2lucHV0LnN0cmluZyB8fCBcIlwiO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmNvZGVfaW5wdXQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvZGUgPSB0aGlzLmNvZGVfaW5wdXQuc3RyaW5nIHx8IFwiXCI7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5Yid5aeL5YyWIEVkaXRCb3ggPT09PT09PT09PT09PT09PT09PT1cbiAgICBfaW5pdEVkaXRCb3hlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIC8vIOaJi+acuuWPt+i+k+WFpeahhuWIneWni+WMllxuICAgICAgICBpZiAodGhpcy5waG9uZV9pbnB1dCkge1xuICAgICAgICAgICAgLy8g6K6+572uIHN0YXlPblRvcCDkuLogdHJ1Ze+8jOehruS/neaWh+Wtl+Wni+e7iOWPr+ingVxuICAgICAgICAgICAgdGhpcy5waG9uZV9pbnB1dC5zdGF5T25Ub3AgPSB0cnVlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDorr7nva7lrZfkvZPmoLflvI9cbiAgICAgICAgICAgIHRoaXMucGhvbmVfaW5wdXQuZm9udFNpemUgPSAyMDtcbiAgICAgICAgICAgIHRoaXMucGhvbmVfaW5wdXQubGluZUhlaWdodCA9IDQwO1xuICAgICAgICAgICAgdGhpcy5waG9uZV9pbnB1dC5mb250Q29sb3IgPSBuZXcgY2MuQ29sb3IoNTAsIDUwLCA1MCwgMjU1KTtcbiAgICAgICAgICAgIHRoaXMucGhvbmVfaW5wdXQucGxhY2Vob2xkZXJGb250Q29sb3IgPSBuZXcgY2MuQ29sb3IoMTUwLCAxNTAsIDE1MCwgMjU1KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g55uR5ZCs6L6T5YWl5LqL5Lu2XG4gICAgICAgICAgICB0aGlzLnBob25lX2lucHV0Lm5vZGUub24oJ2VkaXRpbmctZGlkLWJlZ2FuJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fb25QaG9uZUlucHV0Rm9jdXMoKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnBob25lX2lucHV0Lm5vZGUub24oJ2VkaXRpbmctZGlkLWVuZGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fb25QaG9uZUlucHV0Qmx1cigpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMucGhvbmVfaW5wdXQubm9kZS5vbigndGV4dC1jaGFuZ2VkJywgZnVuY3Rpb24oZWRpdGJveCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3Bob25lID0gZWRpdGJveC5zdHJpbmc7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6aqM6K+B56CB6L6T5YWl5qGG5Yid5aeL5YyWXG4gICAgICAgIGlmICh0aGlzLmNvZGVfaW5wdXQpIHtcbiAgICAgICAgICAgIC8vIOiuvue9riBzdGF5T25Ub3Ag5Li6IHRydWXvvIznoa7kv53mloflrZflp4vnu4jlj6/op4FcbiAgICAgICAgICAgIHRoaXMuY29kZV9pbnB1dC5zdGF5T25Ub3AgPSB0cnVlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDorr7nva7lrZfkvZPmoLflvI9cbiAgICAgICAgICAgIHRoaXMuY29kZV9pbnB1dC5mb250U2l6ZSA9IDIwO1xuICAgICAgICAgICAgdGhpcy5jb2RlX2lucHV0LmxpbmVIZWlnaHQgPSA0MDtcbiAgICAgICAgICAgIHRoaXMuY29kZV9pbnB1dC5mb250Q29sb3IgPSBuZXcgY2MuQ29sb3IoNTAsIDUwLCA1MCwgMjU1KTtcbiAgICAgICAgICAgIHRoaXMuY29kZV9pbnB1dC5wbGFjZWhvbGRlckZvbnRDb2xvciA9IG5ldyBjYy5Db2xvcigxNTAsIDE1MCwgMTUwLCAyNTUpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDnm5HlkKzovpPlhaXkuovku7ZcbiAgICAgICAgICAgIHRoaXMuY29kZV9pbnB1dC5ub2RlLm9uKCdlZGl0aW5nLWRpZC1iZWdhbicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX29uQ29kZUlucHV0Rm9jdXMoKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmNvZGVfaW5wdXQubm9kZS5vbignZWRpdGluZy1kaWQtZW5kZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9vbkNvZGVJbnB1dEJsdXIoKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmNvZGVfaW5wdXQubm9kZS5vbigndGV4dC1jaGFuZ2VkJywgZnVuY3Rpb24oZWRpdGJveCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX2NvZGUgPSBlZGl0Ym94LnN0cmluZztcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyDmiYvmnLrlj7fovpPlhaXmoYbojrflvpfnhKbngrlcbiAgICBfb25QaG9uZUlucHV0Rm9jdXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDlj6/ku6Xmt7vliqDnhKbngrnmlYjmnpxcbiAgICB9LFxuICAgIFxuICAgIC8vIOaJi+acuuWPt+i+k+WFpeahhuWkseWOu+eEpueCuVxuICAgIF9vblBob25lSW5wdXRCbHVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g56Gu5L+d5paH5a2X5pi+56S6XG4gICAgICAgIGlmICh0aGlzLnBob25lX2lucHV0ICYmIHRoaXMucGhvbmVfaW5wdXQuc3RyaW5nKSB7XG4gICAgICAgICAgICB0aGlzLl9waG9uZSA9IHRoaXMucGhvbmVfaW5wdXQuc3RyaW5nO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyDpqozor4HnoIHovpPlhaXmoYbojrflvpfnhKbngrlcbiAgICBfb25Db2RlSW5wdXRGb2N1czogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOWPr+S7pea3u+WKoOeEpueCueaViOaenFxuICAgIH0sXG4gICAgXG4gICAgLy8g6aqM6K+B56CB6L6T5YWl5qGG5aSx5Y6754Sm54K5XG4gICAgX29uQ29kZUlucHV0Qmx1cjogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOehruS/neaWh+Wtl+aYvuekulxuICAgICAgICBpZiAodGhpcy5jb2RlX2lucHV0ICYmIHRoaXMuY29kZV9pbnB1dC5zdHJpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvZGUgPSB0aGlzLmNvZGVfaW5wdXQuc3RyaW5nO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOWTjeW6lOW8j+mAgumFje+8muWuveW6pj3lsY/luZU2MCXvvIzmnIDlsI8zMDDvvIzpq5jluqbmjInmr5TkvotcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBhZGFwdERpYWxvZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBwYW5lbCA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZSgnY29udGVudF9wYW5lbCcpO1xuICAgICAgICBpZiAoIXBhbmVsKSByZXR1cm47XG5cbiAgICAgICAgdmFyIHdpblcgPSBjYy53aW5TaXplLndpZHRoO1xuICAgICAgICB2YXIgd2luSCA9IGNjLndpblNpemUuaGVpZ2h0O1xuXG4gICAgICAgIC8vIOebruagh+WuveW6piA9IOWxj+W5leWuveW6piAqIDYwJVxuICAgICAgICB2YXIgdGFyZ2V0V2lkdGggPSB3aW5XICogMC42O1xuICAgICAgICBcbiAgICAgICAgLy8g5pyA5bCP5a695bqmMzAw77yM5pyA5aSn5a695bqm5LiN6LaF6L+H5bGP5bmVODAlXG4gICAgICAgIHRhcmdldFdpZHRoID0gTWF0aC5tYXgoMzAwLCBNYXRoLm1pbih0YXJnZXRXaWR0aCwgd2luVyAqIDAuOCkpO1xuICAgICAgICBcbiAgICAgICAgLy8g6K6h566X57yp5pS+5q+U5L6LXG4gICAgICAgIHZhciBzY2FsZSA9IHRhcmdldFdpZHRoIC8gdGhpcy5CQVNFX1dJRFRIO1xuICAgICAgICBcbiAgICAgICAgLy8g56Gu5L+d6auY5bqm5LiN6LaF5Ye65bGP5bmV77yI55WZ5Ye6MTAl6L656Led77yJXG4gICAgICAgIHZhciBtYXhTY2FsZVkgPSAod2luSCAqIDAuOCkgLyB0aGlzLkJBU0VfSEVJR0hUO1xuICAgICAgICBzY2FsZSA9IE1hdGgubWluKHNjYWxlLCBtYXhTY2FsZVkpO1xuICAgICAgICBcbiAgICAgICAgLy8g6ZmQ5Yi257yp5pS+6IyD5Zu0IFswLjcsIDEuM11cbiAgICAgICAgc2NhbGUgPSBNYXRoLm1heCgwLjcsIE1hdGgubWluKHNjYWxlLCAxLjMpKTtcblxuICAgICAgICAvLyDlupTnlKjnvKnmlL5cbiAgICAgICAgcGFuZWwuc2NhbGUgPSBzY2FsZTtcblxuICAgICAgICBjb25zb2xlLmxvZygn44CQ55m75b2V5by556qX44CR5bGP5bmVOicsIHdpblcsICd4Jywgd2luSCwgXG4gICAgICAgICAgICAgICAgICAgICfnm67moIflrr3luqY6JywgTWF0aC5yb3VuZCh0YXJnZXRXaWR0aCksIFxuICAgICAgICAgICAgICAgICAgICAn57yp5pS+OicsIHNjYWxlLnRvRml4ZWQoMiksXG4gICAgICAgICAgICAgICAgICAgICflrp7pmYXlsLrlr7g6JywgTWF0aC5yb3VuZCh0aGlzLkJBU0VfV0lEVEggKiBzY2FsZSksICd4JywgTWF0aC5yb3VuZCh0aGlzLkJBU0VfSEVJR0hUICogc2NhbGUpKTtcbiAgICB9LFxuXG4gICAgLy8g5Yid5aeL5YyW5by556qX6L+b5YWl5Yqo55S7XG4gICAgX2luaXRQYW5lbEFuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb250ZW50UGFuZWwgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoJ2NvbnRlbnRfcGFuZWwnKTtcbiAgICAgICAgaWYgKGNvbnRlbnRQYW5lbCkge1xuICAgICAgICAgICAgLy8g5L+d5a2Y55uu5qCH57yp5pS+5YC877yI5bey55SxX2luaXRQYW5lbFNjYWxl6K6+572u77yJXG4gICAgICAgICAgICB2YXIgdGFyZ2V0U2NhbGUgPSBjb250ZW50UGFuZWwuc2NhbGU7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOS7juWwj+WwuuWvuOW8gOWni+WKqOeUu1xuICAgICAgICAgICAgY29udGVudFBhbmVsLnNjYWxlID0gdGFyZ2V0U2NhbGUgKiAwLjc7XG4gICAgICAgICAgICBjb250ZW50UGFuZWwub3BhY2l0eSA9IDA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNjLnR3ZWVuKGNvbnRlbnRQYW5lbClcbiAgICAgICAgICAgICAgICAudG8oMC4yNSwgeyBzY2FsZTogdGFyZ2V0U2NhbGUsIG9wYWNpdHk6IDI1NSB9LCB7IGVhc2luZzogJ2JhY2tPdXQnIH0pXG4gICAgICAgICAgICAgICAgLnN0YXJ0KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g57uY5Yi26L6T5YWl5qGG5ZyG6KeS6L655qGGIC0g5L+u5aSN54mI77ya57uY5Yi26IOM5pmvICsg6L655qGGXG4gICAgX2RyYXdJbnB1dEJvcmRlcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29udGVudFBhbmVsID0gdGhpcy5ub2RlLmdldENoaWxkQnlOYW1lKCdjb250ZW50X3BhbmVsJyk7XG4gICAgICAgIGlmICghY29udGVudFBhbmVsKSByZXR1cm47XG5cbiAgICAgICAgLy8g57uY5Yi25omL5py65Y+36L6T5YWl5qGG6IOM5pmv5ZKM6L655qGGICgzMjB4NTApXG4gICAgICAgIHZhciBwaG9uZUJnID0gY29udGVudFBhbmVsLmdldENoaWxkQnlOYW1lKCdwaG9uZV9iZycpO1xuICAgICAgICBpZiAocGhvbmVCZykge1xuICAgICAgICAgICAgdmFyIGdyYXBoaWNzID0gcGhvbmVCZy5nZXRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICAgICAgaWYgKGdyYXBoaWNzKSB7XG4gICAgICAgICAgICAgICAgZ3JhcGhpY3MuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAvLyDlhYjnu5jliLbloavlhYXog4zmma/vvIjljYrpgI/mmI7nmb3oibLvvIlcbiAgICAgICAgICAgICAgICBncmFwaGljcy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTIsIDI0MCwgMjMwKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kcmF3Um91bmRSZWN0KGdyYXBoaWNzLCAtMTYwLCAtMjUsIDMyMCwgNTAsIDE0KTtcbiAgICAgICAgICAgICAgICBncmFwaGljcy5maWxsKCk7XG4gICAgICAgICAgICAgICAgLy8g5YaN57uY5Yi26L655qGG77yI6YeR6Imy77yJXG4gICAgICAgICAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjE4LCAxNjUsIDMyLCAyNTUpO1xuICAgICAgICAgICAgICAgIGdyYXBoaWNzLmxpbmVXaWR0aCA9IDI7XG4gICAgICAgICAgICAgICAgdGhpcy5fZHJhd1JvdW5kUmVjdChncmFwaGljcywgLTE2MCwgLTI1LCAzMjAsIDUwLCAxNCk7XG4gICAgICAgICAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOehruS/nSBwaG9uZV9iZyDoioLngrnlnKggaW5wdXQg6IqC54K55LiL5pa5XG4gICAgICAgICAgICB2YXIgcGhvbmVJbnB1dCA9IHBob25lQmcuZ2V0Q2hpbGRCeU5hbWUoJ3Bob25lX2lucHV0Jyk7XG4gICAgICAgICAgICBpZiAocGhvbmVJbnB1dCkge1xuICAgICAgICAgICAgICAgIHBob25lSW5wdXQuekluZGV4ID0gMTA7XG4gICAgICAgICAgICAgICAgcGhvbmVCZy56SW5kZXggPSA1O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g57uY5Yi26aqM6K+B56CB6L6T5YWl5qGG6IOM5pmv5ZKM6L655qGGICgxOTB4NTApXG4gICAgICAgIHZhciBjb2RlUm93ID0gY29udGVudFBhbmVsLmdldENoaWxkQnlOYW1lKCdjb2RlX3JvdycpO1xuICAgICAgICBpZiAoY29kZVJvdykge1xuICAgICAgICAgICAgdmFyIGNvZGVCZyA9IGNvZGVSb3cuZ2V0Q2hpbGRCeU5hbWUoJ2NvZGVfYmcnKTtcbiAgICAgICAgICAgIGlmIChjb2RlQmcpIHtcbiAgICAgICAgICAgICAgICB2YXIgZ3JhcGhpY3MgPSBjb2RlQmcuZ2V0Q29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgICAgICAgICBpZiAoZ3JhcGhpY3MpIHtcbiAgICAgICAgICAgICAgICAgICAgZ3JhcGhpY3MuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8g5YWI57uY5Yi25aGr5YWF6IOM5pmv77yI5Y2K6YCP5piO55m96Imy77yJXG4gICAgICAgICAgICAgICAgICAgIGdyYXBoaWNzLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1MiwgMjQwLCAyMzApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kcmF3Um91bmRSZWN0KGdyYXBoaWNzLCAtOTUsIC0yNSwgMTkwLCA1MCwgMTQpO1xuICAgICAgICAgICAgICAgICAgICBncmFwaGljcy5maWxsKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWGjee7mOWItui+ueahhu+8iOmHkeiJsu+8iVxuICAgICAgICAgICAgICAgICAgICBncmFwaGljcy5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigyMTgsIDE2NSwgMzIsIDI1NSk7XG4gICAgICAgICAgICAgICAgICAgIGdyYXBoaWNzLmxpbmVXaWR0aCA9IDI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2RyYXdSb3VuZFJlY3QoZ3JhcGhpY3MsIC05NSwgLTI1LCAxOTAsIDUwLCAxNCk7XG4gICAgICAgICAgICAgICAgICAgIGdyYXBoaWNzLnN0cm9rZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDnoa7kv50gY29kZV9iZyDoioLngrnlnKggaW5wdXQg6IqC54K55LiL5pa5XG4gICAgICAgICAgICAgICAgdmFyIGNvZGVJbnB1dCA9IGNvZGVCZy5nZXRDaGlsZEJ5TmFtZSgnY29kZV9pbnB1dCcpO1xuICAgICAgICAgICAgICAgIGlmIChjb2RlSW5wdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29kZUlucHV0LnpJbmRleCA9IDEwO1xuICAgICAgICAgICAgICAgICAgICBjb2RlQmcuekluZGV4ID0gNTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDnu5jliLbliIblibLnur9cbiAgICAgICAgdmFyIGRpdmlkZXIgPSBjb250ZW50UGFuZWwuZ2V0Q2hpbGRCeU5hbWUoJ2RpdmlkZXInKTtcbiAgICAgICAgaWYgKGRpdmlkZXIpIHtcbiAgICAgICAgICAgIHZhciBncmFwaGljcyA9IGRpdmlkZXIuZ2V0Q29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgICAgIGlmIChncmFwaGljcykge1xuICAgICAgICAgICAgICAgIGdyYXBoaWNzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjAwLCAxODAsIDE0MCwgMTgwKTtcbiAgICAgICAgICAgICAgICBncmFwaGljcy5saW5lV2lkdGggPSAxO1xuICAgICAgICAgICAgICAgIGdyYXBoaWNzLm1vdmVUbygtMTcwLCAwKTtcbiAgICAgICAgICAgICAgICBncmFwaGljcy5saW5lVG8oMTcwLCAwKTtcbiAgICAgICAgICAgICAgICBncmFwaGljcy5zdHJva2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDnu5jliLblnIbop5Lnn6nlvaJcbiAgICBfZHJhd1JvdW5kUmVjdDogZnVuY3Rpb24oZ3JhcGhpY3MsIHgsIHksIHcsIGgsIHIpIHtcbiAgICAgICAgZ3JhcGhpY3MubW92ZVRvKHggKyByLCB5KTtcbiAgICAgICAgZ3JhcGhpY3MubGluZVRvKHggKyB3IC0gciwgeSk7XG4gICAgICAgIGdyYXBoaWNzLmFyY1RvKHggKyB3LCB5LCB4ICsgdywgeSArIHIsIHIpO1xuICAgICAgICBncmFwaGljcy5saW5lVG8oeCArIHcsIHkgKyBoIC0gcik7XG4gICAgICAgIGdyYXBoaWNzLmFyY1RvKHggKyB3LCB5ICsgaCwgeCArIHcgLSByLCB5ICsgaCwgcik7XG4gICAgICAgIGdyYXBoaWNzLmxpbmVUbyh4ICsgciwgeSArIGgpO1xuICAgICAgICBncmFwaGljcy5hcmNUbyh4LCB5ICsgaCwgeCwgeSArIGggLSByLCByKTtcbiAgICAgICAgZ3JhcGhpY3MubGluZVRvKHgsIHkgKyByKTtcbiAgICAgICAgZ3JhcGhpY3MuYXJjVG8oeCwgeSwgeCArIHIsIHksIHIpO1xuICAgIH0sXG5cbiAgICAvLyDliJ3lp4vljJblvq7kv6HnmbvlvZXmjInpkq5cbiAgICBfaW5pdFdlY2hhdEJ1dHRvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb250ZW50UGFuZWwgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoJ2NvbnRlbnRfcGFuZWwnKTtcbiAgICAgICAgaWYgKCFjb250ZW50UGFuZWwpIHJldHVybjtcblxuICAgICAgICB2YXIgd3hDb250YWluZXIgPSBjb250ZW50UGFuZWwuZ2V0Q2hpbGRCeU5hbWUoJ3d4X2xvZ2luX2NvbnRhaW5lcicpO1xuICAgICAgICBpZiAod3hDb250YWluZXIpIHtcbiAgICAgICAgICAgIHZhciB3eEJ0biA9IHd4Q29udGFpbmVyLmdldENoaWxkQnlOYW1lKCd3eF9sb2dpbl9idG4nKTtcbiAgICAgICAgICAgIGlmICh3eEJ0bikge1xuICAgICAgICAgICAgICAgIC8vIOa3u+WKoOaMiemSrueCueWHu+aViOaenFxuICAgICAgICAgICAgICAgIHd4QnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX1NUQVJULCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgd3hCdG4uc2NhbGUgPSAwLjk1O1xuICAgICAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHd4QnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHd4QnRuLnNjYWxlID0gMTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fb25XZWNoYXRMb2dpbkNsaWNrKCk7XG4gICAgICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgd3hCdG4ub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfQ0FOQ0VMLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgd3hCdG4uc2NhbGUgPSAxO1xuICAgICAgICAgICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgICAgICAgICAgLy8g5re75YqgXCLlvq7kv6HnmbvlvZVcIuaWh+Wtl+agh+etvlxuICAgICAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVdlY2hhdExhYmVsKHd4Q29udGFpbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDliJvlu7rlvq7kv6HnmbvlvZXmloflrZfmoIfnrb5cbiAgICBfY3JlYXRlV2VjaGF0TGFiZWw6IGZ1bmN0aW9uKGNvbnRhaW5lcikge1xuICAgICAgICAvLyDmo4Dmn6XmmK/lkKblt7LlrZjlnKjmoIfnrb5cbiAgICAgICAgdmFyIGV4aXN0TGFiZWwgPSBjb250YWluZXIuZ2V0Q2hpbGRCeU5hbWUoJ3d4X2xvZ2luX2xhYmVsJyk7XG4gICAgICAgIGlmIChleGlzdExhYmVsKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGxhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKCd3eF9sb2dpbl9sYWJlbCcpO1xuICAgICAgICBsYWJlbE5vZGUucGFyZW50ID0gY29udGFpbmVyO1xuICAgICAgICBsYWJlbE5vZGUueSA9IC0zNTtcblxuICAgICAgICB2YXIgbGFiZWwgPSBsYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgbGFiZWwuc3RyaW5nID0gJ+W+ruS/oeeZu+W9lSc7XG4gICAgICAgIGxhYmVsLmZvbnRTaXplID0gMTg7XG4gICAgICAgIGxhYmVsLmxpbmVIZWlnaHQgPSAyMjtcbiAgICAgICAgbGFiZWwuZm9udEZhbWlseSA9ICdBcmlhbCc7XG4gICAgICAgIGxhYmVsLmZvbnRDb2xvciA9IG5ldyBjYy5Db2xvcigxMjAsIDEwMCwgODAsIDI1NSk7XG4gICAgICAgIGxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgfSxcblxuICAgIF9pbml0QnV0dG9uczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAvLyDlhbPpl63mjInpkq5cbiAgICAgICAgaWYgKHRoaXMuY2xvc2VfYnRuKSB7XG4gICAgICAgICAgICB0aGlzLmNsb3NlX2J0bi5ub2RlLm9mZihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQpO1xuICAgICAgICAgICAgdGhpcy5jbG9zZV9idG4ubm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX29uQ2xvc2VDbGljaygpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlj5HpgIHpqozor4HnoIHmjInpkq5cbiAgICAgICAgaWYgKHRoaXMuc2VuZF9jb2RlX2J0bikge1xuICAgICAgICAgICAgdGhpcy5zZW5kX2NvZGVfYnRuLm5vZGUub2ZmKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCk7XG4gICAgICAgICAgICB0aGlzLnNlbmRfY29kZV9idG4ubm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX29uU2VuZENvZGVDbGljaygpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDnmbvlvZXmjInpkq5cbiAgICAgICAgaWYgKHRoaXMubG9naW5fYnRuKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2luX2J0bi5ub2RlLm9mZihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQpO1xuICAgICAgICAgICAgdGhpcy5sb2dpbl9idG4ubm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX29uTG9naW5DbGljaygpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g5b6u5L+h55m75b2V54K55Ye7XG4gICAgX29uV2VjaGF0TG9naW5DbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfjgJDlvq7kv6HnmbvlvZXjgJHngrnlh7vlvq7kv6HnmbvlvZXmjInpkq4nKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOajgOafpeaYr+WQpuacieWFqOWxgOeahOW+ruS/oeeZu+W9leaWueazlVxuICAgICAgICBpZiAod2luZG93Lm15Z2xvYmFsICYmIHdpbmRvdy5teWdsb2JhbC53ZWNoYXRMb2dpbikge1xuICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLndlY2hhdExvZ2luKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDpmY3nuqfvvJrmj5DnpLrnlKjmiLdcbiAgICAgICAgICAgIHRoaXMuX3Nob3dNZXNzYWdlKCflvq7kv6HnmbvlvZXlip/og73mmoLmnKrlvIDmlL4nLCB0cnVlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDmiYvmnLrlj7fovpPlhaXlj5jljJZcbiAgICBvblBob25lSW5wdXRDaGFuZ2VkOiBmdW5jdGlvbihlZGl0Ym94LCBjdXN0b21FdmVudERhdGEpIHtcbiAgICAgICAgdGhpcy5fcGhvbmUgPSBlZGl0Ym94LnN0cmluZztcbiAgICB9LFxuXG4gICAgLy8g6aqM6K+B56CB6L6T5YWl5Y+Y5YyWXG4gICAgb25Db2RlSW5wdXRDaGFuZ2VkOiBmdW5jdGlvbihlZGl0Ym94LCBjdXN0b21FdmVudERhdGEpIHtcbiAgICAgICAgdGhpcy5fY29kZSA9IGVkaXRib3guc3RyaW5nO1xuICAgIH0sXG5cbiAgICAvLyDlj5HpgIHpqozor4HnoIFcbiAgICBfb25TZW5kQ29kZUNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmICh0aGlzLl9jb3VudGRvd24gPiAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDku47ovpPlhaXmoYbojrflj5bmiYvmnLrlj7dcbiAgICAgICAgaWYgKHRoaXMucGhvbmVfaW5wdXQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Bob25lID0gdGhpcy5waG9uZV9pbnB1dC5zdHJpbmcgfHwgXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOmqjOivgeaJi+acuuWPt1xuICAgICAgICBpZiAoIXRoaXMuX3ZhbGlkYXRlUGhvbmUodGhpcy5fcGhvbmUpKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93TWVzc2FnZShcIuivt+i+k+WFpeato+ehrueahOaJi+acuuWPt1wiLCB0cnVlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3Nob3dNZXNzYWdlKFwi5q2j5Zyo5Y+R6YCBLi4uXCIsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5fc2V0SW50ZXJhY3RhYmxlKGZhbHNlKTtcblxuICAgICAgICAvLyDosIPnlKjlj5HpgIHpqozor4HnoIHmjqXlj6NcbiAgICAgICAgdGhpcy5fc2VuZENvZGVSZXF1ZXN0KHRoaXMuX3Bob25lLCBmdW5jdGlvbihzdWNjZXNzLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICBzZWxmLl9zZXRJbnRlcmFjdGFibGUodHJ1ZSk7XG5cbiAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3RhcnRDb3VudGRvd24oKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZShcIumqjOivgeeggeW3suWPkemAgVwiLCBmYWxzZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlKG1lc3NhZ2UgfHwgXCLlj5HpgIHlpLHotKXvvIzor7fph43or5VcIiwgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvLyDnmbvlvZVcbiAgICBfb25Mb2dpbkNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIC8vIOS7jui+k+WFpeahhuiOt+WPluWAvFxuICAgICAgICBpZiAodGhpcy5waG9uZV9pbnB1dCkge1xuICAgICAgICAgICAgdGhpcy5fcGhvbmUgPSB0aGlzLnBob25lX2lucHV0LnN0cmluZyB8fCBcIlwiO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmNvZGVfaW5wdXQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvZGUgPSB0aGlzLmNvZGVfaW5wdXQuc3RyaW5nIHx8IFwiXCI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDpqozor4HovpPlhaVcbiAgICAgICAgaWYgKCF0aGlzLl92YWxpZGF0ZVBob25lKHRoaXMuX3Bob25lKSkge1xuICAgICAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2UoXCLor7fovpPlhaXmraPnoa7nmoTmiYvmnLrlj7dcIiwgdHJ1ZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuX3ZhbGlkYXRlQ29kZSh0aGlzLl9jb2RlKSkge1xuICAgICAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2UoXCLor7fovpPlhaXpqozor4HnoIFcIiwgdHJ1ZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zaG93TWVzc2FnZShcIuato+WcqOeZu+W9lS4uLlwiLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuX3NldEludGVyYWN0YWJsZShmYWxzZSk7XG5cbiAgICAgICAgLy8g6LCD55So55m75b2V5o6l5Y+jXG4gICAgICAgIHRoaXMuX3Bob25lTG9naW5SZXF1ZXN0KHRoaXMuX3Bob25lLCB0aGlzLl9jb2RlLCBmdW5jdGlvbihzdWNjZXNzLCBtZXNzYWdlLCBkYXRhKSB7XG4gICAgICAgICAgICBzZWxmLl9zZXRJbnRlcmFjdGFibGUodHJ1ZSk7XG5cbiAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2UoXCLnmbvlvZXmiJDlip9cIiwgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgLy8g5L+d5a2Y55So5oi35pWw5o2uXG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5teWdsb2JhbCAmJiB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YSAmJiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnVuaXF1ZUlEID0gZGF0YS51bmlxdWVJRCB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SUQgPSBkYXRhLmFjY291bnRJRCB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5uaWNrTmFtZSA9IGRhdGEubmlja05hbWUgfHwgXCLnjqnlrrZcIjtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYXZhdGFyVXJsID0gZGF0YS5hdmF0YXJVcmwgfHwgXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuZ29iYWxfY291bnQgPSBkYXRhLmdvbGRjb3VudCB8fCAwO1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS50b2tlbiA9IGRhdGEudG9rZW4gfHwgXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgLy8g5L+d5a2Y5Yiw5pys5Zyw5a2Y5YKoXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnNhdmVUb0xvY2FsKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi44CQ5omL5py655m75b2V44CR55So5oi35pWw5o2u5bey5L+d5a2YLCBuaWNrTmFtZSA9XCIsIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLm5pY2tOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDot7PovazliLDlpKfljoXlnLrmma9cbiAgICAgICAgICAgICAgICBzZWxmLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fb25DbG9zZUNsaWNrKCk7XG4gICAgICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZShcImhhbGxTY2VuZVwiKTtcbiAgICAgICAgICAgICAgICB9LCAwLjUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZShtZXNzYWdlIHx8IFwi55m75b2V5aSx6LSl77yM6K+36YeN6K+VXCIsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLy8g5YWz6Zet5by556qXXG4gICAgX29uQ2xvc2VDbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5ub2RlIHx8ICF0aGlzLm5vZGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9jb3VudGRvd24gPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnVuc2NoZWR1bGUodGhpcy5fY291bnRkb3duVGljayk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ub2RlLmRlc3Ryb3koKTtcbiAgICB9LFxuXG4gICAgLy8g6aqM6K+B5omL5py65Y+3XG4gICAgX3ZhbGlkYXRlUGhvbmU6IGZ1bmN0aW9uKHBob25lKSB7XG4gICAgICAgIGlmICghcGhvbmUgfHwgcGhvbmUubGVuZ3RoICE9PSAxMSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIOeugOWNlemqjOivge+8muS7pTHlvIDlpLTnmoQxMeS9jeaVsOWtl1xuICAgICAgICB2YXIgcmVnID0gL14xWzMtOV1cXGR7OX0kLztcbiAgICAgICAgcmV0dXJuIHJlZy50ZXN0KHBob25lKTtcbiAgICB9LFxuXG4gICAgLy8g6aqM6K+B6aqM6K+B56CBXG4gICAgX3ZhbGlkYXRlQ29kZTogZnVuY3Rpb24oY29kZSkge1xuICAgICAgICAvLyDkv53nlZnpnZ7nqbrmo4DmtYvvvIzmtYvor5XpmLbmrrXkuI3pqozor4HmoLzlvI9cbiAgICAgICAgcmV0dXJuIGNvZGUgJiYgY29kZS5sZW5ndGggPiAwO1xuICAgIH0sXG5cbiAgICAvLyDlvIDlp4vlgJLorqHml7ZcbiAgICBfc3RhcnRDb3VudGRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9jb3VudGRvd24gPSB0aGlzLmNvdW50ZG93bl90aW1lO1xuICAgICAgICB0aGlzLl91cGRhdGVDb3VudGRvd25MYWJlbCgpO1xuXG4gICAgICAgIHRoaXMuc2NoZWR1bGUodGhpcy5fY291bnRkb3duVGljaywgMSk7XG4gICAgfSxcblxuICAgIC8vIOWAkuiuoeaXtuavj+enkuWbnuiwg1xuICAgIF9jb3VudGRvd25UaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fY291bnRkb3duLS07XG5cbiAgICAgICAgaWYgKHRoaXMuX2NvdW50ZG93biA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnVuc2NoZWR1bGUodGhpcy5fY291bnRkb3duVGljayk7XG4gICAgICAgICAgICB0aGlzLl9yZXNldFNlbmRDb2RlQnRuKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVDb3VudGRvd25MYWJlbCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOabtOaWsOWAkuiuoeaXtuagh+etvlxuICAgIF91cGRhdGVDb3VudGRvd25MYWJlbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnNlbmRfY29kZV9sYWJlbCkge1xuICAgICAgICAgICAgdGhpcy5zZW5kX2NvZGVfbGFiZWwuc3RyaW5nID0gdGhpcy5fY291bnRkb3duICsgXCLnp5LlkI7ph43or5VcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNlbmRfY29kZV9idG4pIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZF9jb2RlX2J0bi5pbnRlcmFjdGFibGUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDph43nva7lj5HpgIHpqozor4HnoIHmjInpkq5cbiAgICBfcmVzZXRTZW5kQ29kZUJ0bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnNlbmRfY29kZV9sYWJlbCkge1xuICAgICAgICAgICAgdGhpcy5zZW5kX2NvZGVfbGFiZWwuc3RyaW5nID0gXCLojrflj5bpqozor4HnoIFcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNlbmRfY29kZV9idG4pIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZF9jb2RlX2J0bi5pbnRlcmFjdGFibGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOaYvuekuua2iOaBr1xuICAgIF9zaG93TWVzc2FnZTogZnVuY3Rpb24obWVzc2FnZSwgaXNFcnJvcikge1xuICAgICAgICBpZiAodGhpcy5tZXNzYWdlX2xhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VfbGFiZWwubm9kZS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlX2xhYmVsLnN0cmluZyA9IG1lc3NhZ2U7XG5cbiAgICAgICAgICAgIGlmIChpc0Vycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlX2xhYmVsLm5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAxMDAsIDEwMCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZV9sYWJlbC5ub2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDEwMCwgMjAwLCAxMDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coaXNFcnJvciA/ICdb6ZSZ6K+vXScgOiAnW+S/oeaBr10nLCBtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDpmpDol4/mtojmga9cbiAgICBfaGlkZU1lc3NhZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5tZXNzYWdlX2xhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VfbGFiZWwubm9kZS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDorr7nva7mjInpkq7kuqTkupLnirbmgIFcbiAgICBfc2V0SW50ZXJhY3RhYmxlOiBmdW5jdGlvbihpbnRlcmFjdGFibGUpIHtcbiAgICAgICAgaWYgKHRoaXMubG9naW5fYnRuKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ2luX2J0bi5pbnRlcmFjdGFibGUgPSBpbnRlcmFjdGFibGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zZW5kX2NvZGVfYnRuICYmIHRoaXMuX2NvdW50ZG93biA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnNlbmRfY29kZV9idG4uaW50ZXJhY3RhYmxlID0gaW50ZXJhY3RhYmxlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOWPkemAgemqjOivgeeggeivt+axgiAtIOS9v+eUqEh0dHBBUEnmlK/mjIHliqDlr4bop6Plr4ZcbiAgICBfc2VuZENvZGVSZXF1ZXN0OiBmdW5jdGlvbihwaG9uZSwgY2FsbGJhY2spIHtcblxuICAgICAgICB2YXIgZGVmaW5lcyA9IHdpbmRvdy5kZWZpbmVzO1xuICAgICAgICBpZiAoIWRlZmluZXMgfHwgIWRlZmluZXMuYXBpVXJsKSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0cnVlLCBcIuWPkemAgeaIkOWKn1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB1cmwgPSBkZWZpbmVzLmFwaVVybCArICcvYXBpL3YxL2F1dGgvc2VuZC1jb2RlJztcbiAgICAgICAgdmFyIGNyeXB0b0tleSA9IGRlZmluZXMuY3J5cHRvS2V5IHx8IFwiXCI7XG5cbiAgICAgICAgLy8g5L2/55SoSHR0cEFQSS5wb3N05Y+R6YCB6K+35rGC77yI5pSv5oyB5Yqg5a+G6Kej5a+G77yJXG4gICAgICAgIGlmICh3aW5kb3cuSHR0cEFQSSkge1xuICAgICAgICAgICAgd2luZG93Lkh0dHBBUEkucG9zdCh1cmwsIHsgcGhvbmU6IHBob25lIH0sIGNyeXB0b0tleSwgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLlj5HpgIHpqozor4HnoIHlpLHotKU6XCIsIGVycik7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuY29kZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbXNnID0gXCLpqozor4HnoIHlt7Llj5HpgIFcIjtcbiAgICAgICAgICAgICAgICAgICAgLy8g5byA5Y+R546v5aKD77ya5pi+56S66aqM6K+B56CBXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZGF0YSAmJiByZXN1bHQuZGF0YS5jb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtc2cgPSBcIumqjOivgeeggTogXCIgKyByZXN1bHQuZGF0YS5jb2RlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHRydWUsIG1zZyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIHJlc3VsdCA/IHJlc3VsdC5tZXNzYWdlIDogXCLlj5HpgIHlpLHotKVcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDpmY3nuqfvvJrnm7TmjqXlj5HpgIHor7fmsYLvvIjkuI3mlK/mjIHop6Plr4bvvIlcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkh0dHBBUEnmnKrliqDovb3vvIzkvb/nlKjljp/lp4vor7fmsYJcIik7XG4gICAgICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICB4aHIub3BlbignUE9TVCcsIHVybCwgdHJ1ZSk7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHhoci50aW1lb3V0ID0gMTAwMDA7XG5cbiAgICAgICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDmo4Dmn6XmmK/lkKbmmK/liqDlr4blk43lupRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS50aW1lc3RhbXAgJiYgdHlwZW9mIHJlc3BvbnNlLmRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCBcIuacjeWKoeWZqOi/lOWbnuWKoOWvhuaVsOaNru+8jOivt+WIt+aWsOmhtemdoumHjeivlVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLmNvZGUgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodHJ1ZSwgXCLpqozor4HnoIHlt7Llj5HpgIFcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIHJlc3BvbnNlLm1lc3NhZ2UgfHwgXCLlj5HpgIHlpLHotKVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCBcIuino+aekOWTjeW6lOWksei0pVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCBcIue9kee7nOivt+axguWksei0pVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHhoci5vbnRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgXCLor7fmsYLotoXml7ZcIik7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCBcIue9kee7nOmUmeivr1wiKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KHsgcGhvbmU6IHBob25lIH0pKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDmiYvmnLrlj7fnmbvlvZXor7fmsYIgLSDkvb/nlKhIdHRwQVBJ5pSv5oyB5Yqg5a+G6Kej5a+GXG4gICAgX3Bob25lTG9naW5SZXF1ZXN0OiBmdW5jdGlvbihwaG9uZSwgY29kZSwgY2FsbGJhY2spIHtcblxuICAgICAgICB2YXIgZGVmaW5lcyA9IHdpbmRvdy5kZWZpbmVzO1xuICAgICAgICBpZiAoIWRlZmluZXMgfHwgIWRlZmluZXMuYXBpVXJsKSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0cnVlLCBcIueZu+W9leaIkOWKn1wiLCB7XG4gICAgICAgICAgICAgICAgdW5pcXVlSUQ6IFwicGhvbmVfXCIgKyBwaG9uZSxcbiAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IFwicGhvbmVfXCIgKyBwaG9uZSxcbiAgICAgICAgICAgICAgICBuaWNrTmFtZTogXCLnjqnlrrZcIiArIHBob25lLnN1YnN0cigtNCksXG4gICAgICAgICAgICAgICAgYXZhdGFyVXJsOiBcIlwiLFxuICAgICAgICAgICAgICAgIGdvbGRjb3VudDogMTAwMCxcbiAgICAgICAgICAgICAgICB0b2tlbjogXCJtb2NrX3Rva2VuX1wiICsgRGF0ZS5ub3coKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdXJsID0gZGVmaW5lcy5hcGlVcmwgKyAnL2FwaS92MS9hdXRoL3Bob25lLWxvZ2luJztcbiAgICAgICAgdmFyIGNyeXB0b0tleSA9IGRlZmluZXMuY3J5cHRvS2V5IHx8IFwiXCI7XG5cbiAgICAgICAgLy8g5YeG5aSH6K+35rGC5pWw5o2uXG4gICAgICAgIHZhciByZXF1ZXN0RGF0YSA9IHtcbiAgICAgICAgICAgIHBob25lOiBwaG9uZSxcbiAgICAgICAgICAgIGNvZGU6IGNvZGVcbiAgICAgICAgfTtcblxuXG4gICAgICAgIC8vIOS9v+eUqEh0dHBBUEkucG9zdOWPkemAgeivt+axgu+8iOaUr+aMgeWKoOWvhuino+Wvhu+8iVxuICAgICAgICBpZiAod2luZG93Lkh0dHBBUEkgJiYgd2luZG93Lkh0dHBBUEkucG9zdCkge1xuICAgICAgICAgICAgd2luZG93Lkh0dHBBUEkucG9zdCh1cmwsIHJlcXVlc3REYXRhLCBjcnlwdG9LZXksIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi55m75b2V6K+35rGC5aSx6LSlOlwiLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSwgZXJyLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LmNvZGUgPT09IDAgJiYgcmVzdWx0LmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodHJ1ZSwgXCLnmbvlvZXmiJDlip9cIiwgcmVzdWx0LmRhdGEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCByZXN1bHQgPyByZXN1bHQubWVzc2FnZSA6IFwi55m75b2V5aSx6LSlXCIsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g6ZmN57qn77ya55u05o6l5Y+R6YCB6K+35rGCXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJIdHRwQVBJ5pyq5Yqg6L2977yM5L2/55So5Y6f5aeL6K+35rGCXCIpO1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICAgeGhyLm9wZW4oJ1BPU1QnLCB1cmwsIHRydWUpO1xuICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignWC1EZXZpY2UtSUQnLCB0aGlzLl9nZXREZXZpY2VJRCgpKTtcbiAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdYLURldmljZS1UeXBlJywgdGhpcy5fZ2V0RGV2aWNlVHlwZSgpKTtcbiAgICAgICAgICAgIHhoci50aW1lb3V0ID0gMTAwMDA7XG5cbiAgICAgICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS50aW1lc3RhbXAgJiYgdHlwZW9mIHJlc3BvbnNlLmRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWKoOWvhuWTjeW6lO+8jOmcgOimgeino+WvhlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAod2luZG93Lkh0dHBBUEkgJiYgd2luZG93Lkh0dHBBUEkuZGVjcnlwdEFFU0dDTSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lkh0dHBBUEkuZGVjcnlwdEFFU0dDTShyZXNwb25zZS5kYXRhLCBjcnlwdG9LZXkpLnRoZW4oZnVuY3Rpb24oZGVjcnlwdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlY3J5cHRlZCAmJiBkZWNyeXB0ZWQuY29kZSA9PT0gMCAmJiBkZWNyeXB0ZWQuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh0cnVlLCBcIueZu+W9leaIkOWKn1wiLCBkZWNyeXB0ZWQuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIGRlY3J5cHRlZCA/IGRlY3J5cHRlZC5tZXNzYWdlIDogXCLnmbvlvZXlpLHotKVcIiwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZGVjcnlwdEVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLop6Plr4blpLHotKU6XCIsIGRlY3J5cHRFcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCBcIuino+WvhuWTjeW6lOWksei0pVwiLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIFwi5pyN5Yqh5Zmo6L+U5Zue5Yqg5a+G5pWw5o2u77yM6K+35Yi35paw6aG16Z2i6YeN6K+VXCIsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5jb2RlID09PSAwICYmIHJlc3BvbnNlLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodHJ1ZSwgXCLnmbvlvZXmiJDlip9cIiwgcmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIHJlc3BvbnNlLm1lc3NhZ2UgfHwgXCLnmbvlvZXlpLHotKVcIiwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLop6PmnpDlk43lupTlpLHotKU6XCIsIGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCBcIuino+aekOWTjeW6lOWksei0pVwiLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCBcIue9kee7nOivt+axguWksei0pTogSFRUUCBcIiArIHhoci5zdGF0dXMsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgeGhyLm9udGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlLCBcIuivt+axgui2heaXtlwiLCBudWxsKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZmFsc2UsIFwi572R57uc6ZSZ6K+vXCIsIG51bGwpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgeGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkocmVxdWVzdERhdGEpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDorr7lpIfkv6Hmga/ojrflj5ZcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8vIOiOt+WPluiuvuWkh+WUr+S4gOagh+ivhlxuICAgIF9nZXREZXZpY2VJRDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBERVZJQ0VfSURfS0VZID0gXCJkZHpfZGV2aWNlX2lkXCI7XG4gICAgICAgIHZhciBkZXZpY2VJZCA9IFwiXCI7XG5cbiAgICAgICAgLy8g5bCd6K+V5LuO5pys5Zyw5a2Y5YKo6I635Y+WXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBkZXZpY2VJZCA9IGNjLnN5cy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShERVZJQ0VfSURfS0VZKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5aaC5p6c5LiN5a2Y5Zyo77yM55Sf5oiQ5paw55qE6K6+5aSHSURcbiAgICAgICAgaWYgKCFkZXZpY2VJZCkge1xuICAgICAgICAgICAgZGV2aWNlSWQgPSB0aGlzLl9nZW5lcmF0ZVVVSUQoKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2Muc3lzLmxvY2FsU3RvcmFnZS5zZXRJdGVtKERFVklDRV9JRF9LRVksIGRldmljZUlkKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZXZpY2VJZDtcbiAgICB9LFxuXG4gICAgLy8g6I635Y+W6K6+5aSH57G75Z6LXG4gICAgX2dldERldmljZVR5cGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGxhdGZvcm0gPSBjYy5zeXMucGxhdGZvcm07XG4gICAgICAgIHZhciBvcyA9IGNjLnN5cy5vcztcbiAgICAgICAgdmFyIGRldmljZVR5cGUgPSBcIlVua25vd25cIjtcblxuICAgICAgICAvLyDmoLnmja7lubPlj7DliKTmlq1cbiAgICAgICAgaWYgKHBsYXRmb3JtID09PSBjYy5zeXMuV0VDSEFUX0dBTUUpIHtcbiAgICAgICAgICAgIGRldmljZVR5cGUgPSBcIldlQ2hhdFwiO1xuICAgICAgICB9IGVsc2UgaWYgKHBsYXRmb3JtID09PSBjYy5zeXMuQU5EUk9JRCkge1xuICAgICAgICAgICAgZGV2aWNlVHlwZSA9IFwiQW5kcm9pZFwiO1xuICAgICAgICB9IGVsc2UgaWYgKHBsYXRmb3JtID09PSBjYy5zeXMuSVBIT05FKSB7XG4gICAgICAgICAgICBkZXZpY2VUeXBlID0gXCJpUGhvbmVcIjtcbiAgICAgICAgfSBlbHNlIGlmIChwbGF0Zm9ybSA9PT0gY2Muc3lzLklQQUQpIHtcbiAgICAgICAgICAgIGRldmljZVR5cGUgPSBcImlQYWRcIjtcbiAgICAgICAgfSBlbHNlIGlmIChwbGF0Zm9ybSA9PT0gY2Muc3lzLk1BQ19PUykge1xuICAgICAgICAgICAgZGV2aWNlVHlwZSA9IFwiTWFjXCI7XG4gICAgICAgIH0gZWxzZSBpZiAocGxhdGZvcm0gPT09IGNjLnN5cy5XSU5ET1dTKSB7XG4gICAgICAgICAgICBkZXZpY2VUeXBlID0gXCJXaW5kb3dzXCI7XG4gICAgICAgIH0gZWxzZSBpZiAocGxhdGZvcm0gPT09IGNjLnN5cy5MSU5VWCkge1xuICAgICAgICAgICAgZGV2aWNlVHlwZSA9IFwiTGludXhcIjtcbiAgICAgICAgfSBlbHNlIGlmIChwbGF0Zm9ybSA9PT0gY2Muc3lzLk1PQklMRV9CUk9XU0VSKSB7XG4gICAgICAgICAgICBpZiAob3MgPT09IGNjLnN5cy5PU19JT1MpIHtcbiAgICAgICAgICAgICAgICBkZXZpY2VUeXBlID0gXCJpT1MgQnJvd3NlclwiO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChvcyA9PT0gY2Muc3lzLk9TX0FORFJPSUQpIHtcbiAgICAgICAgICAgICAgICBkZXZpY2VUeXBlID0gXCJBbmRyb2lkIEJyb3dzZXJcIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGV2aWNlVHlwZSA9IFwiTW9iaWxlIEJyb3dzZXJcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChwbGF0Zm9ybSA9PT0gY2Muc3lzLkRFU0tUT1BfQlJPV1NFUikge1xuICAgICAgICAgICAgaWYgKG9zID09PSBjYy5zeXMuT1NfV0lORE9XUykge1xuICAgICAgICAgICAgICAgIGRldmljZVR5cGUgPSBcIldpbmRvd3MgQnJvd3NlclwiO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChvcyA9PT0gY2Muc3lzLk9TX09TWCkge1xuICAgICAgICAgICAgICAgIGRldmljZVR5cGUgPSBcIk1hYyBCcm93c2VyXCI7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKG9zID09PSBjYy5zeXMuT1NfTElOVVgpIHtcbiAgICAgICAgICAgICAgICBkZXZpY2VUeXBlID0gXCJMaW51eCBCcm93c2VyXCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRldmljZVR5cGUgPSBcIkRlc2t0b3AgQnJvd3NlclwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5re75Yqg5rWP6KeI5Zmo5L+h5oGvXG4gICAgICAgIHZhciBicm93c2VyVHlwZSA9IGNjLnN5cy5icm93c2VyVHlwZTtcbiAgICAgICAgaWYgKGJyb3dzZXJUeXBlKSB7XG4gICAgICAgICAgICBkZXZpY2VUeXBlICs9IFwiIChcIiArIGJyb3dzZXJUeXBlICsgXCIpXCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGV2aWNlVHlwZTtcbiAgICB9LFxuXG4gICAgLy8g55Sf5oiQVVVJRFxuICAgIF9nZW5lcmF0ZVVVSUQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgdXVpZCA9ICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgdmFyIHIgPSAoZCArIE1hdGgucmFuZG9tKCkgKiAxNikgJSAxNiB8IDA7XG4gICAgICAgICAgICBkID0gTWF0aC5mbG9vcihkIC8gMTYpO1xuICAgICAgICAgICAgcmV0dXJuIChjID09PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpKS50b1N0cmluZygxNik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdXVpZDtcbiAgICB9XG59KTtcbiJdfQ==