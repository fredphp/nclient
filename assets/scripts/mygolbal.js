/**
 * 全局模块
 * 纯全局变量方式，延迟初始化
 * 确保所有依赖都已加载
 * 支持自动登录和强制下线检测
 * 支持跨平台存储（Web/App）
 * 支持心跳检测和在线状态监听
 */

(function() {
    'use strict';
    
    // ========== 屏蔽 Cocos Creator 引擎调试日志 ==========
    // 屏蔽 "[Action update]. override me" 日志
    // 这个日志来自 Cocos Creator 引擎内部 CCDebug.js，当 Action 系统运行时会持续打印
    // 原因：引擎的 Action 基类 update 方法默认打印这个日志，子类没有重写时会触发
    (function suppressEngineLogs() {
        // 方法1: 屏蔽 console.log 中的特定日志
        var originalLog = console.log;
        console.log = function() {
            var args = Array.prototype.slice.call(arguments);
            // 检查是否包含 Action update 相关的调试日志
            for (var i = 0; i < args.length; i++) {
                if (typeof args[i] === 'string' && 
                    (args[i].indexOf('[Action update]') !== -1 || 
                     args[i].indexOf('override me') !== -1 ||
                     args[i].indexOf('032CCDebug') !== -1)) {
                    return; // 不打印这个日志
                }
            }
            return originalLog.apply(console, arguments);
        };
        
        // 方法2: 在 Cocos Creator 引擎加载后，覆盖 cc.Action 的 update 方法
        var suppressActionLog = function() {
            if (typeof cc !== 'undefined' && cc.Action) {
                // 检查是否已经有默认的 update 方法（打印日志的那个）
                if (cc.Action.prototype.update) {
                    // 保存原始方法
                    var originalUpdate = cc.Action.prototype.update;
                    // 检查原始方法是否是打印日志的版本
                    var fnStr = originalUpdate.toString();
                    if (fnStr.indexOf('override me') !== -1 || fnStr.indexOf('CCDebug') !== -1) {
                        // 替换为空函数，不再打印日志
                        cc.Action.prototype.update = function(dt) {
                            // 静默执行，不打印日志
                        };
                    }
                }
            } else {
                // 延迟重试，等待 cc 对象加载
                setTimeout(suppressActionLog, 100);
            }
        };
        
        // 在 DOM 加载后执行
        if (document.readyState === 'complete') {
            setTimeout(suppressActionLog, 500);
        } else {
            window.addEventListener('load', function() {
                setTimeout(suppressActionLog, 500);
            });
        }
    })();
    
    // 如果已存在则不重复定义
    if (window.myglobal) {
        return;
    }
    
    var myglobal = {
        socket: null,
        playerData: null,
        eventlister: null,
        _initialized: false,
        _forceLogout: false,  // 是否被强制下线
        _forceLogoutReason: "",  // 强制下线原因
        
        // ========== 在线状态监听 ==========
        _onlineStatusListeners: [],     // 在线状态监听器列表
        _isOnline: true,                // 当前是否在线
        _connectionCheckInterval: null, // 连接检查定时器
        _tokenCheckInterval: null,      // Token 检查定时器
        _lastActivityTime: Date.now(),  // 最后活动时间
        _inactiveTimeout: 30 * 60 * 1000, // 不活动超时时间（30分钟）
    };
    
    // 检查依赖是否都已加载
    myglobal._checkDependencies = function() {
        var missing = [];
        
        if (typeof window.socketCtr === 'undefined') {
            missing.push('socketCtr (socket_ctr.js)');
        }
        if (typeof window.playerData === 'undefined') {
            missing.push('playerData (player.js)');
        }
        if (typeof window.eventLister === 'undefined') {
            missing.push('eventLister (event_lister.js)');
        }
        
        if (missing.length > 0) {
            // 使用 console.log 而不是 console.error，避免显示错误（依赖可能正在加载中）
            return false;
        }
        return true;
    };
    
    // 初始化函数 - 在其他脚本加载后调用
    myglobal.init = function() {
        if (this._initialized) {
            return true;
        }
        
        
        // 检查依赖
        if (!this._checkDependencies()) {
            return false;
        }
        
        try {
            // 初始化全局对象
            this.socket = window.socketCtr();
            this.playerData = window.playerData();
            this.eventlister = window.eventLister({});
            this._initialized = true;
            
            // 尝试从本地存储恢复玩家数据
            if (this.playerData.loadFromLocal()) {
                console.log("【myglobal】从本地存储恢复玩家数据成功, nickName =", this.playerData.nickName);
            } else {
                console.log("【myglobal】本地存储无玩家数据");
            }
            
            
            return true;
        } catch(e) {
            console.error("myglobal 初始化失败:", e);
            return false;
        }
    };
    
    // 自动初始化（延迟执行，确保所有插件脚本都已加载）
    myglobal.autoInit = function() {
        var self = this;
        var attempts = 0;
        var maxAttempts = 20;  // 增加重试次数
        
        var tryInit = function() {
            attempts++;
            
            if (self.init()) {
            } else if (attempts < maxAttempts) {
                // 延迟重试
                setTimeout(tryInit, 100);
            } else {
                console.error("myglobal 自动初始化失败，请检查依赖脚本是否正确加载");
            }
        };
        
        // 延迟执行，确保所有插件脚本都已加载
        setTimeout(tryInit, 100);
    };
    
    // ==================== 登录状态管理 ====================
    
    // 检查是否有本地登录会话
    myglobal.hasLocalSession = function() {
        if (!this.playerData) return false;
        return this.playerData.hasLocalSession();
    };
    
    // 检查是否已登录
    myglobal.isLoggedIn = function() {
        if (!this.playerData) return false;
        return this.playerData.isLoggedIn();
    };
    
    // 登录成功后调用
    myglobal.onLoginSuccess = function(loginData) {
        if (this.playerData) {
            this.playerData.updateFromLogin(loginData);
        }
        this._forceLogout = false;
        this._forceLogoutReason = "";
    };
    
    // 登出
    myglobal.logout = function() {
        if (this.playerData) {
            this.playerData.logout();
        }
        this._forceLogout = false;
        this._forceLogoutReason = "";
        
        // 断开 WebSocket 连接
        if (this.socket && this.socket.disconnect) {
            this.socket.disconnect();
        }
        
        
        // 跳转到登录场景
        if (typeof cc !== 'undefined' && cc.director) {
            cc.director.loadScene("loginScene");
        }
    };
    
    // 被强制下线
    myglobal.onForceLogout = function(reason) {
        this._forceLogout = true;
        this._forceLogoutReason = reason || "您已被强制下线";
        
        console.warn("⚠️ 用户被强制下线:", reason);
        
        // 清除本地登录状态
        if (this.playerData) {
            this.playerData.clearLocal();
        }
        
        // 断开 WebSocket 连接
        if (this.socket && this.socket.disconnect) {
            this.socket.disconnect();
        }
        
        // 显示提示并跳转到登录场景
        this.showForceLogoutMessage(reason);
    };
    
    // 显示强制下线提示
    myglobal.showForceLogoutMessage = function(reason) {
        var message = reason || "您已被管理员强制下线";
        
        // 在游戏中显示提示
        if (typeof cc !== 'undefined') {
            // 创建提示弹窗
            var self = this;
            setTimeout(function() {
                alert(message + "\n\n请重新登录");
                if (cc.director) {
                    cc.director.loadScene("loginScene");
                }
            }, 100);
        } else {
            alert(message + "\n\n请重新登录");
            window.location.reload();
        }
    };
    
    // 检查是否被强制下线
    myglobal.wasForceLoggedOut = function() {
        return this._forceLogout;
    };
    
    // 获取强制下线原因
    myglobal.getForceLogoutReason = function() {
        return this._forceLogoutReason;
    };
    
    // ==================== Token 验证 ====================
    
    // 验证 Token 是否有效（通过 API）
    myglobal.verifyToken = function(callback) {
        var self = this;
        
        if (!this.playerData || !this.playerData.token) {
            callback(false, "无登录凭证");
            return;
        }
        
        var defines = window.defines;
        if (!defines || !defines.apiUrl) {
            // 无API配置，使用本地缓存登录
            callback(true, "无API配置，使用本地缓存");
            return;
        }
        
        
        // 使用 HttpAPI 发送请求（支持自动解密）
        var HttpAPI = window.HttpAPI;
        if (!HttpAPI) {
            this._verifyTokenWithXHR(callback);
            return;
        }
        
        var cryptoKey = defines.cryptoKey || "";
        
        // 使用 HttpAPI.post 发送请求（会自动解密响应）
        HttpAPI.post(
            defines.apiUrl + '/api/v1/auth/verify-token',
            {
                token: this.playerData.token,
                player_id: this.playerData.uniqueID
            },
            cryptoKey,
            function(err, resp) {
                if (err) {
                    // 请求失败，使用本地缓存
                    callback(true, "使用本地缓存");
                    return;
                }
                
                
                // resp 已经是解密后的数据
                if (resp && resp.code === 0 && resp.data) {
                    if (resp.data.valid) {
                        // Token 有效，更新用户信息
                        if (resp.data.player) {
                            self.playerData.updateFromLogin(resp.data.player);
                        }
                        callback(true, "Token有效");
                    } else {
                        // Token 明确无效，需要重新登录
                        self.playerData.clearLocal();
                        callback(false, resp.data.message || "Token无效");
                    }
                } else {
                    // API返回错误
                    // 检查是否是解密后的直接数据
                    if (resp && resp.valid !== undefined) {
                        if (resp.valid) {
                            if (resp.player) {
                                self.playerData.updateFromLogin(resp.player);
                            }
                            callback(true, "Token有效");
                        } else {
                            self.playerData.clearLocal();
                            callback(false, resp.message || "Token无效");
                        }
                    } else {
                        // 其他情况，使用本地缓存继续
                        callback(true, "使用本地缓存");
                    }
                }
            }
        );
    };
    
    // 使用原生 XMLHttpRequest 验证 Token（降级方案）
    myglobal._verifyTokenWithXHR = function(callback) {
        var self = this;
        var defines = window.defines;
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', defines.apiUrl + '/api/v1/auth/verify-token', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 10000;
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        var resp = JSON.parse(xhr.responseText);
                        
                        // 检查是否是加密响应
                        if (resp.data && resp.timestamp && typeof resp.data === 'string') {
                            // 加密响应，无法解密，使用本地缓存
                            callback(true, "使用本地缓存");
                            return;
                        }
                        
                        if (resp.code === 0 && resp.data) {
                            if (resp.data.valid) {
                                if (resp.data.player) {
                                    self.playerData.updateFromLogin(resp.data.player);
                                }
                                callback(true, "Token有效");
                            } else {
                                self.playerData.clearLocal();
                                callback(false, resp.data.message || "Token无效");
                            }
                        } else {
                            callback(true, "使用本地缓存");
                        }
                    } catch (e) {
                        callback(true, "使用本地缓存");
                    }
                } else if (xhr.status === 404) {
                    callback(true, "使用本地缓存");
                } else if (xhr.status === 401 || xhr.status === 403) {
                    self.playerData.clearLocal();
                    callback(false, "Token无效或已过期");
                } else {
                    callback(true, "使用本地缓存");
                }
            }
        };
        
        xhr.onerror = function() {
            callback(true, "使用本地缓存");
        };
        
        xhr.ontimeout = function() {
            callback(true, "使用本地缓存");
        };
        
        xhr.send(JSON.stringify({
            token: this.playerData.token,
            player_id: this.playerData.uniqueID
        }));
    };

    // ==================== 在线状态监听 ====================

    // 启动在线状态监测
    myglobal.startOnlineMonitoring = function() {
        var self = this;
        
        
        // 停止之前的监测
        this.stopOnlineMonitoring();
        
        // 记录最后活动时间
        this._lastActivityTime = Date.now();
        
        // 标记正在初始化连接，给WebSocket连接时间
        this._isInitializing = true;
        this._initTimeout = setTimeout(function() {
            self._isInitializing = false;
        }, 10000); // 10秒缓冲时间
        
        // 监听用户活动（Web端）
        if (typeof window !== 'undefined') {
            // 监听用户交互
            var updateActivity = function() {
                self._lastActivityTime = Date.now();
            };
            
            window.addEventListener('mousedown', updateActivity);
            window.addEventListener('keydown', updateActivity);
            window.addEventListener('touchstart', updateActivity);
            window.addEventListener('scroll', updateActivity);
            
            this._activityListeners = {
                mousedown: updateActivity,
                keydown: updateActivity,
                touchstart: updateActivity,
                scroll: updateActivity
            };
        }
        
        // 定时检查连接状态
        this._connectionCheckInterval = setInterval(function() {
            self._checkOnlineStatus();
        }, 5000); // 每5秒检查一次
        
        // 定时检查 Token 有效性（每5分钟）
        this._tokenCheckInterval = setInterval(function() {
            self._checkTokenValidity();
        }, 5 * 60 * 1000);
        
        // 监听 WebSocket 状态变化
        if (this.socket && this.socket.addStateListener) {
            this._socketStateListener = function(state, oldState) {
                if (state === "connected") {
                    // 连接成功，结束初始化状态
                    self._isInitializing = false;
                    if (self._initTimeout) {
                        clearTimeout(self._initTimeout);
                        self._initTimeout = null;
                    }
                    self._setOnlineStatus(true);
                } else if (state === "disconnected") {
                    // 只有在非初始化状态下才判定离线
                    if (!self._isInitializing) {
                        self._setOnlineStatus(false);
                    } else {
                    }
                }
            };
            this.socket.addStateListener(this._socketStateListener);
        }
        
        // 监听心跳成功
        if (this.eventlister) {
            this.eventlister.on("heartbeat_success", function(data) {
                self._lastActivityTime = Date.now();
                self._setOnlineStatus(true);
            });
            
            // 监听连接丢失
            this.eventlister.on("connection_lost", function(data) {
                console.warn("💔 连接丢失:", data.reason);
                self._setOnlineStatus(false);
                self._handleConnectionLost();
            });
        }
        
    };
    
    // 停止在线状态监测
    myglobal.stopOnlineMonitoring = function() {
        // 清理初始化超时
        if (this._initTimeout) {
            clearTimeout(this._initTimeout);
            this._initTimeout = null;
        }
        this._isInitializing = false;
        
        if (this._connectionCheckInterval) {
            clearInterval(this._connectionCheckInterval);
            this._connectionCheckInterval = null;
        }
        
        if (this._tokenCheckInterval) {
            clearInterval(this._tokenCheckInterval);
            this._tokenCheckInterval = null;
        }
        
        // 移除活动监听器
        if (typeof window !== 'undefined' && this._activityListeners) {
            window.removeEventListener('mousedown', this._activityListeners.mousedown);
            window.removeEventListener('keydown', this._activityListeners.keydown);
            window.removeEventListener('touchstart', this._activityListeners.touchstart);
            window.removeEventListener('scroll', this._activityListeners.scroll);
            this._activityListeners = null;
        }
        
        // 移除 Socket 状态监听器
        if (this.socket && this.socket.removeStateListener && this._socketStateListener) {
            this.socket.removeStateListener(this._socketStateListener);
            this._socketStateListener = null;
        }
        
    };
    
    // 检查在线状态
    myglobal._checkOnlineStatus = function() {
        // 初始化期间不检查
        if (this._isInitializing) {
            return;
        }
        
        // 检查 WebSocket 物理连接状态（readyState === OPEN）
        var isWebSocketOpen = false;
        if (this.socket && this.socket.isWebSocketOpen) {
            isWebSocketOpen = this.socket.isWebSocketOpen();
        }
        
        // 也检查逻辑连接状态（服务器确认）
        var isServerConfirmed = this.socket && this.socket.isConnected && this.socket.isConnected();
        
        // 检查是否超时不活动
        var inactiveTime = Date.now() - this._lastActivityTime;
        var isInactive = inactiveTime > this._inactiveTimeout;
        
        // 调试信息
        
        // 在线条件：
        // 1. WebSocket 物理连接成功（readyState === OPEN）
        // 2. 或者服务器已确认连接（_isConnected === true）
        // 3. 且用户在活动
        var isOnline = (isWebSocketOpen || isServerConfirmed) && !isInactive;
        
        
        // 更新在线状态
        this._setOnlineStatus(isOnline);
        
        // 如果不活动时间过长，提示用户
        if (isInactive && (isWebSocketOpen || isServerConfirmed)) {
            console.warn("⚠️ 用户长时间不活动，可能需要重新验证");
        }
    };
    
    // 检查 Token 有效性
    myglobal._checkTokenValidity = function() {
        var self = this;
        
        if (!this.playerData || !this.playerData.token) {
            return;
        }
        
        
        this.verifyToken(function(valid, message) {
            if (!valid) {
                console.warn("⚠️ Token 已失效:", message);
                self._handleTokenExpired();
            } else {
            }
        });
    };
    
    // 设置在线状态
    myglobal._setOnlineStatus = function(isOnline) {
        if (this._isOnline !== isOnline) {
            this._isOnline = isOnline;
            
            // 通知所有监听器
            for (var i = 0; i < this._onlineStatusListeners.length; i++) {
                try {
                    this._onlineStatusListeners[i](isOnline);
                } catch (e) {
                    console.error("在线状态监听器执行错误:", e);
                }
            }
            
            // 触发事件
            if (this.eventlister) {
                this.eventlister.fire("online_status_changed", { isOnline: isOnline });
            }
        }
    };
    
    // 添加在线状态监听器
    myglobal.addOnlineStatusListener = function(listener) {
        if (typeof listener === 'function') {
            this._onlineStatusListeners.push(listener);
            // 立即通知当前状态
            // 但在初始化期间，始终报告为在线（避免误报）
            if (this._isInitializing) {
                listener(true);  // 初始化期间报告在线
            } else {
                listener(this._isOnline);
            }
        }
    };
    
    // 移除在线状态监听器
    myglobal.removeOnlineStatusListener = function(listener) {
        for (var i = this._onlineStatusListeners.length - 1; i >= 0; i--) {
            if (this._onlineStatusListeners[i] === listener) {
                this._onlineStatusListeners.splice(i, 1);
            }
        }
    };
    
    // 获取在线状态
    myglobal.isOnline = function() {
        return this._isOnline;
    };
    
    // 处理连接丢失
    myglobal.onConnectionLost = function() {
        console.warn("💔 检测到连接丢失");
        this._setOnlineStatus(false);
        
        // 显示提示
        this.showConnectionLostMessage();
    };
    
    // 显示连接丢失提示
    myglobal.showConnectionLostMessage = function() {
        var message = "网络连接已断开，请检查网络后重试";
        
        if (typeof cc !== 'undefined') {
            // 游戏中显示提示
            if (typeof alert === 'function') {
                alert(message);
            }
            // 尝试重新连接
            this._tryReconnect();
        } else {
            alert(message);
            window.location.reload();
        }
    };
    
    // 尝试重新连接
    myglobal._tryReconnect = function() {
        var self = this;
        var maxAttempts = 3;
        var attempt = 0;
        
        var tryConnect = function() {
            attempt++;
            
            if (self.socket && self.socket.initSocket) {
                self.socket.initSocket();
                
                // 等待连接结果
                setTimeout(function() {
                    if (self.socket.isConnected && self.socket.isConnected()) {
                        self._setOnlineStatus(true);
                    } else if (attempt < maxAttempts) {
                        setTimeout(tryConnect, 2000);
                    } else {
                        console.error("❌ 重新连接失败");
                        // 跳转到登录页面
                        if (typeof cc !== 'undefined' && cc.director) {
                            cc.director.loadScene("loginScene");
                        }
                    }
                }, 3000);
            }
        };
        
        tryConnect();
    };
    
    // 处理 Token 过期
    myglobal._handleTokenExpired = function() {
        console.warn("⚠️ Token 已过期，需要重新登录");
        
        // 清除本地状态
        if (this.playerData) {
            this.playerData.clearLocal();
        }
        
        // 显示提示并跳转登录
        var message = "登录已过期，请重新登录";
        if (typeof alert === 'function') {
            alert(message);
        }
        
        // 停止监测
        this.stopOnlineMonitoring();
        
        // 跳转到登录页面
        if (typeof cc !== 'undefined' && cc.director) {
            cc.director.loadScene("loginScene");
        }
    };
    
    // 更新活动时间
    myglobal.updateActivity = function() {
        this._lastActivityTime = Date.now();
    };

    // 设置全局变量
    window.myglobal = myglobal;
    
    // 尝试自动初始化
    if (typeof window !== 'undefined') {
        // 在 DOM 加载完成后自动初始化
        if (document.readyState === 'complete') {
            myglobal.autoInit();
        } else {
            window.addEventListener('load', function() {
                myglobal.autoInit();
            });
        }
    }
    
})();
