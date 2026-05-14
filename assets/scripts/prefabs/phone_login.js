// 手机号登录弹窗控制器
// 用于处理手机号验证码登录功能
// 设计风格：中国风商业棋牌（响应式适配：宽度60%，高度自适应）

cc.Class({
    extends: cc.Component,

    properties: {
        // 输入框
        phone_input: {
            type: cc.EditBox,
            default: null
        },
        code_input: {
            type: cc.EditBox,
            default: null
        },

        // 按钮
        send_code_btn: {
            type: cc.Button,
            default: null
        },
        login_btn: {
            type: cc.Button,
            default: null
        },
        close_btn: {
            type: cc.Button,
            default: null
        },

        // 微信登录按钮
        wx_login_btn: {
            type: cc.Sprite,
            default: null
        },

        // 标签
        send_code_label: {
            type: cc.Label,
            default: null
        },
        message_label: {
            type: cc.Label,
            default: null
        },

        // 倒计时时间
        countdown_time: 60,

        // 基准设计尺寸（用于计算scale）
        BASE_WIDTH: 400,
        BASE_HEIGHT: 520
    },

    onLoad: function() {
        this._countdown = 0;
        this._phone = "";
        this._code = "";

        // 立即执行弹窗尺寸适配
        this.adaptDialog();

        // 监听屏幕尺寸变化
        var self = this;
        cc.view.setResizeCallback(function() {
            self.adaptDialog();
        });

        // 初始化弹窗动画
        this._initPanelAnimation();
        
        // 绘制圆角输入框边框
        this._drawInputBorders();
        
        // ==================== 初始化 EditBox 样式和事件 ====================
        this._initEditBoxes();
        
        // 初始化按钮事件
        this._initButtons();
        
        // 初始化微信登录按钮
        this._initWechatButton();
        
        this._hideMessage();

        // 获取输入框初始值
        if (this.phone_input) {
            this._phone = this.phone_input.string || "";
        }
        if (this.code_input) {
            this._code = this.code_input.string || "";
        }
    },

    // ==================== 初始化 EditBox ====================
    _initEditBoxes: function() {
        var self = this;
        
        // 手机号输入框初始化
        if (this.phone_input) {
            // 设置 stayOnTop 为 true，确保文字始终可见
            this.phone_input.stayOnTop = true;
            
            // 设置字体样式
            this.phone_input.fontSize = 20;
            this.phone_input.lineHeight = 40;
            this.phone_input.fontColor = new cc.Color(50, 50, 50, 255);
            this.phone_input.placeholderFontColor = new cc.Color(150, 150, 150, 255);
            
            // 监听输入事件
            this.phone_input.node.on('editing-did-began', function() {
                self._onPhoneInputFocus();
            }, this);
            
            this.phone_input.node.on('editing-did-ended', function() {
                self._onPhoneInputBlur();
            }, this);
            
            this.phone_input.node.on('text-changed', function(editbox) {
                self._phone = editbox.string;
            }, this);
        }
        
        // 验证码输入框初始化
        if (this.code_input) {
            // 设置 stayOnTop 为 true，确保文字始终可见
            this.code_input.stayOnTop = true;
            
            // 设置字体样式
            this.code_input.fontSize = 20;
            this.code_input.lineHeight = 40;
            this.code_input.fontColor = new cc.Color(50, 50, 50, 255);
            this.code_input.placeholderFontColor = new cc.Color(150, 150, 150, 255);
            
            // 监听输入事件
            this.code_input.node.on('editing-did-began', function() {
                self._onCodeInputFocus();
            }, this);
            
            this.code_input.node.on('editing-did-ended', function() {
                self._onCodeInputBlur();
            }, this);
            
            this.code_input.node.on('text-changed', function(editbox) {
                self._code = editbox.string;
            }, this);
        }
    },
    
    // 手机号输入框获得焦点
    _onPhoneInputFocus: function() {
        // 可以添加焦点效果
    },
    
    // 手机号输入框失去焦点
    _onPhoneInputBlur: function() {
        // 确保文字显示
        if (this.phone_input && this.phone_input.string) {
            this._phone = this.phone_input.string;
        }
    },
    
    // 验证码输入框获得焦点
    _onCodeInputFocus: function() {
        // 可以添加焦点效果
    },
    
    // 验证码输入框失去焦点
    _onCodeInputBlur: function() {
        // 确保文字显示
        if (this.code_input && this.code_input.string) {
            this._code = this.code_input.string;
        }
    },

    // =============================================
    // 响应式适配：宽度=屏幕60%，最小300，高度按比例
    // =============================================
    adaptDialog: function() {
        var panel = this.node.getChildByName('content_panel');
        if (!panel) return;

        var winW = cc.winSize.width;
        var winH = cc.winSize.height;

        // 目标宽度 = 屏幕宽度 * 60%
        var targetWidth = winW * 0.6;
        
        // 最小宽度300，最大宽度不超过屏幕80%
        targetWidth = Math.max(300, Math.min(targetWidth, winW * 0.8));
        
        // 计算缩放比例
        var scale = targetWidth / this.BASE_WIDTH;
        
        // 确保高度不超出屏幕（留出10%边距）
        var maxScaleY = (winH * 0.8) / this.BASE_HEIGHT;
        scale = Math.min(scale, maxScaleY);
        
        // 限制缩放范围 [0.7, 1.3]
        scale = Math.max(0.7, Math.min(scale, 1.3));

        // 应用缩放
        panel.scale = scale;

        console.log('【登录弹窗】屏幕:', winW, 'x', winH, 
                    '目标宽度:', Math.round(targetWidth), 
                    '缩放:', scale.toFixed(2),
                    '实际尺寸:', Math.round(this.BASE_WIDTH * scale), 'x', Math.round(this.BASE_HEIGHT * scale));
    },

    // 初始化弹窗进入动画
    _initPanelAnimation: function() {
        var contentPanel = this.node.getChildByName('content_panel');
        if (contentPanel) {
            // 保存目标缩放值（已由_initPanelScale设置）
            var targetScale = contentPanel.scale;
            
            // 从小尺寸开始动画
            contentPanel.scale = targetScale * 0.7;
            contentPanel.opacity = 0;
            
            cc.tween(contentPanel)
                .to(0.25, { scale: targetScale, opacity: 255 }, { easing: 'backOut' })
                .start();
        }
    },

    // 绘制输入框圆角边框 - 修复版：绘制背景 + 边框
    _drawInputBorders: function() {
        var contentPanel = this.node.getChildByName('content_panel');
        if (!contentPanel) return;

        // 绘制手机号输入框背景和边框 (320x50)
        var phoneBg = contentPanel.getChildByName('phone_bg');
        if (phoneBg) {
            var graphics = phoneBg.getComponent(cc.Graphics);
            if (graphics) {
                graphics.clear();
                // 先绘制填充背景（半透明白色）
                graphics.fillColor = new cc.Color(255, 252, 240, 230);
                this._drawRoundRect(graphics, -160, -25, 320, 50, 14);
                graphics.fill();
                // 再绘制边框（金色）
                graphics.strokeColor = new cc.Color(218, 165, 32, 255);
                graphics.lineWidth = 2;
                this._drawRoundRect(graphics, -160, -25, 320, 50, 14);
                graphics.stroke();
            }
            
            // 确保 phone_bg 节点在 input 节点下方
            var phoneInput = phoneBg.getChildByName('phone_input');
            if (phoneInput) {
                phoneInput.zIndex = 10;
                phoneBg.zIndex = 5;
            }
        }

        // 绘制验证码输入框背景和边框 (190x50)
        var codeRow = contentPanel.getChildByName('code_row');
        if (codeRow) {
            var codeBg = codeRow.getChildByName('code_bg');
            if (codeBg) {
                var graphics = codeBg.getComponent(cc.Graphics);
                if (graphics) {
                    graphics.clear();
                    // 先绘制填充背景（半透明白色）
                    graphics.fillColor = new cc.Color(255, 252, 240, 230);
                    this._drawRoundRect(graphics, -95, -25, 190, 50, 14);
                    graphics.fill();
                    // 再绘制边框（金色）
                    graphics.strokeColor = new cc.Color(218, 165, 32, 255);
                    graphics.lineWidth = 2;
                    this._drawRoundRect(graphics, -95, -25, 190, 50, 14);
                    graphics.stroke();
                }
                
                // 确保 code_bg 节点在 input 节点下方
                var codeInput = codeBg.getChildByName('code_input');
                if (codeInput) {
                    codeInput.zIndex = 10;
                    codeBg.zIndex = 5;
                }
            }
        }

        // 绘制分割线
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
    _drawRoundRect: function(graphics, x, y, w, h, r) {
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
    _initWechatButton: function() {
        var contentPanel = this.node.getChildByName('content_panel');
        if (!contentPanel) return;

        var wxContainer = contentPanel.getChildByName('wx_login_container');
        if (wxContainer) {
            var wxBtn = wxContainer.getChildByName('wx_login_btn');
            if (wxBtn) {
                // 添加按钮点击效果
                wxBtn.on(cc.Node.EventType.TOUCH_START, function() {
                    wxBtn.scale = 0.95;
                }, this);
                
                wxBtn.on(cc.Node.EventType.TOUCH_END, function() {
                    wxBtn.scale = 1;
                    this._onWechatLoginClick();
                }, this);
                
                wxBtn.on(cc.Node.EventType.TOUCH_CANCEL, function() {
                    wxBtn.scale = 1;
                }, this);

                // 添加"微信登录"文字标签
                this._createWechatLabel(wxContainer);
            }
        }
    },

    // 创建微信登录文字标签
    _createWechatLabel: function(container) {
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

    _initButtons: function() {
        var self = this;

        // 关闭按钮
        if (this.close_btn) {
            this.close_btn.node.off(cc.Node.EventType.TOUCH_END);
            this.close_btn.node.on(cc.Node.EventType.TOUCH_END, function() {
                self._onCloseClick();
            }, this);
        }

        // 发送验证码按钮
        if (this.send_code_btn) {
            this.send_code_btn.node.off(cc.Node.EventType.TOUCH_END);
            this.send_code_btn.node.on(cc.Node.EventType.TOUCH_END, function() {
                self._onSendCodeClick();
            }, this);
        }

        // 登录按钮
        if (this.login_btn) {
            this.login_btn.node.off(cc.Node.EventType.TOUCH_END);
            this.login_btn.node.on(cc.Node.EventType.TOUCH_END, function() {
                self._onLoginClick();
            }, this);
        }
    },

    // 微信登录点击
    _onWechatLoginClick: function() {
        console.log('【微信登录】点击微信登录按钮');
        
        // 检查是否有全局的微信登录方法
        if (window.myglobal && window.myglobal.wechatLogin) {
            window.myglobal.wechatLogin();
        } else {
            // 降级：提示用户
            this._showMessage('微信登录功能暂未开放', true);
        }
    },

    // 手机号输入变化
    onPhoneInputChanged: function(editbox, customEventData) {
        this._phone = editbox.string;
    },

    // 验证码输入变化
    onCodeInputChanged: function(editbox, customEventData) {
        this._code = editbox.string;
    },

    // 发送验证码
    _onSendCodeClick: function() {
        var self = this;

        if (this._countdown > 0) {
            return;
        }

        // 从输入框获取手机号
        if (this.phone_input) {
            this._phone = this.phone_input.string || "";
        }

        // 验证手机号
        if (!this._validatePhone(this._phone)) {
            this._showMessage("请输入正确的手机号", true);
            return;
        }

        this._showMessage("正在发送...", false);
        this._setInteractable(false);

        // 调用发送验证码接口
        this._sendCodeRequest(this._phone, function(success, message) {
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
    _onLoginClick: function() {
        var self = this;

        // 从输入框获取值
        if (this.phone_input) {
            this._phone = this.phone_input.string || "";
        }
        if (this.code_input) {
            this._code = this.code_input.string || "";
        }

        // 验证输入
        if (!this._validatePhone(this._phone)) {
            this._showMessage("请输入正确的手机号", true);
            return;
        }

        if (!this._validateCode(this._code)) {
            this._showMessage("请输入验证码", true);
            return;
        }

        this._showMessage("正在登录...", false);
        this._setInteractable(false);

        // 调用登录接口
        this._phoneLoginRequest(this._phone, this._code, function(success, message, data) {
            self._setInteractable(true);

            if (success) {
                self._showMessage("登录成功", false);

                // 保存用户数据
                if (window.myglobal && window.myglobal.playerData && data) {
                    window.myglobal.playerData.uniqueID = data.uniqueID || "";
                    window.myglobal.playerData.accountID = data.accountID || "";
                    window.myglobal.playerData.nickName = data.nickName || "玩家";
                    window.myglobal.playerData.avatarUrl = data.avatarUrl || "";
                    window.myglobal.playerData.gobal_count = data.goldcount || 0;
                    window.myglobal.playerData.token = data.token || "";
                    // 保存到本地存储
                    window.myglobal.playerData.saveToLocal();
                    console.log("【手机登录】用户数据已保存, nickName =", window.myglobal.playerData.nickName);
                }

                // 跳转到大厅场景
                self.scheduleOnce(function() {
                    self._onCloseClick();
                    cc.director.loadScene("hallScene");
                }, 0.5);
            } else {
                self._showMessage(message || "登录失败，请重试", true);
            }
        });
    },

    // 关闭弹窗
    _onCloseClick: function() {
        if (!this.node || !this.node.isValid) {
            return;
        }
        if (this._countdown > 0) {
            this.unschedule(this._countdownTick);
        }
        this.node.destroy();
    },

    // 验证手机号
    _validatePhone: function(phone) {
        if (!phone || phone.length !== 11) {
            return false;
        }
        // 简单验证：以1开头的11位数字
        var reg = /^1[3-9]\d{9}$/;
        return reg.test(phone);
    },

    // 验证验证码
    _validateCode: function(code) {
        // 保留非空检测，测试阶段不验证格式
        return code && code.length > 0;
    },

    // 开始倒计时
    _startCountdown: function() {
        this._countdown = this.countdown_time;
        this._updateCountdownLabel();

        this.schedule(this._countdownTick, 1);
    },

    // 倒计时每秒回调
    _countdownTick: function() {
        this._countdown--;

        if (this._countdown <= 0) {
            this.unschedule(this._countdownTick);
            this._resetSendCodeBtn();
        } else {
            this._updateCountdownLabel();
        }
    },

    // 更新倒计时标签
    _updateCountdownLabel: function() {
        if (this.send_code_label) {
            this.send_code_label.string = this._countdown + "秒后重试";
        }

        if (this.send_code_btn) {
            this.send_code_btn.interactable = false;
        }
    },

    // 重置发送验证码按钮
    _resetSendCodeBtn: function() {
        if (this.send_code_label) {
            this.send_code_label.string = "获取验证码";
        }

        if (this.send_code_btn) {
            this.send_code_btn.interactable = true;
        }
    },

    // 显示消息
    _showMessage: function(message, isError) {
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
    _hideMessage: function() {
        if (this.message_label) {
            this.message_label.node.active = false;
        }
    },

    // 设置按钮交互状态
    _setInteractable: function(interactable) {
        if (this.login_btn) {
            this.login_btn.interactable = interactable;
        }

        if (this.send_code_btn && this._countdown <= 0) {
            this.send_code_btn.interactable = interactable;
        }
    },

    // 发送验证码请求 - 使用HttpAPI支持加密解密
    _sendCodeRequest: function(phone, callback) {

        var defines = window.defines;
        if (!defines || !defines.apiUrl) {
            callback(true, "发送成功");
            return;
        }

        var url = defines.apiUrl + '/api/v1/auth/send-code';
        var cryptoKey = defines.cryptoKey || "";

        // 使用HttpAPI.postEncrypted发送加密请求
        if (window.HttpAPI && window.HttpAPI.postEncrypted) {
            window.HttpAPI.postEncrypted(url, 'send_code', { phone: phone }, cryptoKey, function(err, result) {
                if (err) {
                    console.error("发送验证码失败:", err);
                    callback(false, err);
                    return;
                }

                if (result && result.code === 0) {
                    var msg = "验证码已发送";
                    // 开发环境：显示验证码
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

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            var response = JSON.parse(xhr.responseText);
                            // 检查是否是加密响应
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

            xhr.ontimeout = function() {
                callback(false, "请求超时");
            };

            xhr.onerror = function() {
                callback(false, "网络错误");
            };

            xhr.send(JSON.stringify({ phone: phone }));
        }
    },

    // 手机号登录请求 - 使用HttpAPI支持加密解密
    _phoneLoginRequest: function(phone, code, callback) {

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
        var cryptoKey = defines.cryptoKey || "";

        // 准备请求数据
        var requestData = {
            phone: phone,
            code: code
        };


        // 使用HttpAPI.postEncrypted发送加密请求
        if (window.HttpAPI && window.HttpAPI.postEncrypted) {
            window.HttpAPI.postEncrypted(url, 'phone_login', requestData, cryptoKey, function(err, result) {
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

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            var response = JSON.parse(xhr.responseText);
                            
                            if (response.data && response.timestamp && typeof response.data === 'string') {
                                // 加密响应，需要解密
                                if (window.HttpAPI && window.HttpAPI.decryptAESGCM) {
                                    window.HttpAPI.decryptAESGCM(response.data, cryptoKey).then(function(decrypted) {
                                        if (decrypted && decrypted.code === 0 && decrypted.data) {
                                            callback(true, "登录成功", decrypted.data);
                                        } else {
                                            callback(false, decrypted ? decrypted.message : "登录失败", null);
                                        }
                                    }).catch(function(decryptErr) {
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

            xhr.ontimeout = function() {
                callback(false, "请求超时", null);
            };

            xhr.onerror = function() {
                callback(false, "网络错误", null);
            };

            xhr.send(JSON.stringify(requestData));
        }
    },

    // =============================================
    // 设备信息获取
    // =============================================

    // 获取设备唯一标识
    _getDeviceID: function() {
        var DEVICE_ID_KEY = "ddz_device_id";
        var deviceId = "";

        // 尝试从本地存储获取
        try {
            deviceId = cc.sys.localStorage.getItem(DEVICE_ID_KEY);
        } catch (e) {
        }

        // 如果不存在，生成新的设备ID
        if (!deviceId) {
            deviceId = this._generateUUID();
            try {
                cc.sys.localStorage.setItem(DEVICE_ID_KEY, deviceId);
            } catch (e) {
            }
        }

        return deviceId;
    },

    // 获取设备类型
    _getDeviceType: function() {
        var platform = cc.sys.platform;
        var os = cc.sys.os;
        var deviceType = "Unknown";

        // 根据平台判断
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
        }

        // 添加浏览器信息
        var browserType = cc.sys.browserType;
        if (browserType) {
            deviceType += " (" + browserType + ")";
        }

        return deviceType;
    },

    // 生成UUID
    _generateUUID: function() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }
});
