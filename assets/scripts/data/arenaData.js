/**
 * 竞技场数据管理模块
 * 用于管理竞技场报名、倒计时、奖励等数据
 * 
 * 功能：
 * 1. 获取竞技场房间列表
 * 2. 报名/取消报名
 * 3. 获取开赛倒计时
 * 4. 获取已报名状态
 */

window.arenaData = function() {
    var that = {};
    
    // ==================== 竞技场状态数据 ====================
    
    // 已报名的竞技场列表 { roomId: { signupTime, status, countdownEnd } }
    that._signedUpArenas = {};
    
    // 竞技场详情缓存 { roomId: arenaConfig }
    that._arenaDetails = {};
    
    // 倒计时定时器
    that._countdownTimers = {};
    
    // 状态变更监听器
    that._statusListeners = [];
    
    // ==================== API 方法 ====================
    
    /**
     * 获取竞技场房间列表
     * @param {Function} callback - 回调函数 (err, arenaList)
     */
    that.getArenaList = function(callback) {
        var apiUrl = window.defines ? window.defines.apiUrl : '';
        var cryptoKey = window.defines ? window.defines.cryptoKey : '';
        
        if (!apiUrl || !window.HttpAPI) {
            callback && callback('API未配置', null);
            return;
        }
        
        HttpAPI.get(
            apiUrl + '/api/v1/arena/list',
            cryptoKey,
            function(err, result) {
                if (err) {
                    callback && callback(err, null);
                    return;
                }
                
                var arenaList = null;
                if (result && result.code === 0 && result.data) {
                    arenaList = result.data;
                } else if (result && Array.isArray(result)) {
                    arenaList = result;
                }
                
                if (arenaList) {
                    // 缓存竞技场详情
                    for (var i = 0; i < arenaList.length; i++) {
                        var arena = arenaList[i];
                        that._arenaDetails[arena.id] = arena;
                    }
                    callback && callback(null, arenaList);
                } else {
                    callback && callback('获取竞技场列表失败', null);
                }
            }
        );
    };
    
    /**
     * 报名竞技场（使用 WebSocket 指令）
     * @param {Number} roomId - 竞技场房间ID
     * @param {Function} callback - 回调函数 (err, result)
     */
    that.signup = function(roomId, callback) {
        // 🔧【修复】使用 myglobal.socket 获取已连接的实例，而不是每次创建新实例
        var socketCtrInstance = window.myglobal && window.myglobal.socket ? window.myglobal.socket : null;
        if (!socketCtrInstance) {
            callback && callback('WebSocket未初始化，请刷新页面重试', null);
            return;
        }
        
        // 检查 WebSocket 连接状态
        if (!socketCtrInstance.isConnected || typeof socketCtrInstance.isConnected !== 'function') {
            console.error("🏟️ [ArenaData] socketCtr.isConnected 不是函数");
            callback && callback('WebSocket连接状态异常，请刷新页面重试', null);
            return;
        }
        
        // 🔧【关键修复】WebSocket 未连接时，自动等待连接完成后重试
        if (!socketCtrInstance.isConnected() || !socketCtrInstance.isWebSocketOpen()) {
            console.log("🏟️ [ArenaData] WebSocket 未连接，等待连接完成后重试...");
            
            // 检查是否正在连接中
            var connectionState = socketCtrInstance.getConnectionState ? socketCtrInstance.getConnectionState() : "unknown";
            console.log("🏟️ [ArenaData] 当前连接状态:", connectionState);
            
            if (connectionState === "connecting") {
                // 正在连接中，等待连接完成后自动重试
                var retryCount = 0;
                var maxRetries = 10; // 最多等待 5 秒（每次 500ms）
                var retryInterval = 500;
                
                var trySignup = function() {
                    retryCount++;
                    if (socketCtrInstance.isConnected() && socketCtrInstance.isWebSocketOpen()) {
                        console.log("🏟️ [ArenaData] WebSocket 已连接，执行报名请求");
                        // 连接成功，执行报名
                        that._doSignup(socketCtrInstance, roomId, callback);
                    } else if (retryCount < maxRetries) {
                        console.log("🏟️ [ArenaData] 等待连接... 重试次数:", retryCount);
                        setTimeout(trySignup, retryInterval);
                    } else {
                        // 等待超时
                        console.warn("🏟️ [ArenaData] 等待 WebSocket 连接超时");
                        callback && callback('连接超时，请稍后重试', null);
                    }
                };
                
                setTimeout(trySignup, retryInterval);
                return;
            } else {
                // 未在连接中，尝试初始化连接
                console.log("🏟️ [ArenaData] WebSocket 未连接，尝试初始化连接...");
                if (socketCtrInstance.initSocket) {
                    socketCtrInstance.initSocket();
                }
                // 等待连接完成后重试
                var retryCount = 0;
                var maxRetries = 10;
                var retryInterval = 500;
                
                var trySignup = function() {
                    retryCount++;
                    if (socketCtrInstance.isConnected() && socketCtrInstance.isWebSocketOpen()) {
                        console.log("🏟️ [ArenaData] WebSocket 已连接，执行报名请求");
                        that._doSignup(socketCtrInstance, roomId, callback);
                    } else if (retryCount < maxRetries) {
                        setTimeout(trySignup, retryInterval);
                    } else {
                        callback && callback('连接超时，请稍后重试', null);
                    }
                };
                
                setTimeout(trySignup, retryInterval);
                return;
            }
        }
        
        // WebSocket 已连接，直接执行报名
        that._doSignup(socketCtrInstance, roomId, callback);
    };
    
    /**
     * 执行报名请求（内部方法）
     * @param {Object} socketCtrInstance - WebSocket 实例
     * @param {Number} roomId - 竞技场房间ID
     * @param {Function} callback - 回调函数
     */
    that._doSignup = function(socketCtrInstance, roomId, callback) {
        
        console.log("🏟️ [ArenaData] 通过 WebSocket 发送报名请求, roomId:", roomId);
        
        // 标记是否已响应（防止重复回调）
        var responded = false;
        var timeoutId = null;
        
        // 清理函数（移除监听器和超时）
        var cleanup = function() {
            if (timeoutId) clearTimeout(timeoutId);
            // 移除监听器，防止内存泄漏
            socketCtrInstance.offArenaSignupSuccess(successHandler);
            socketCtrInstance.offArenaSignupFailed(failedHandler);
        };
        
        // 成功回调
        var successHandler = function(data) {
            if (responded) return;
            if (data.room_id !== roomId) return; // 不是当前房间的响应
            
            responded = true;
            cleanup();
            
            // 记录报名成功
            var arenaConfig = that._arenaDetails[roomId] || {};
            that._signedUpArenas[roomId] = {
                signupTime: data.signup_time || Date.now(),
                status: 'signed_up',
                arenaConfig: arenaConfig,
                periodNo: data.period_no,
                signupFee: data.signup_fee
            };
            
            // 保存到本地存储
            that.saveToLocal();
            
            // 更新玩家竞技币余额
            if (window.myglobal && window.myglobal.playerData && data.balance_after !== undefined) {
                window.myglobal.playerData.arena_coin = data.balance_after;
                window.myglobal.playerData.saveToLocal();
                
                // 🔧【新增】触发全局事件，通知大厅刷新UI
                if (window.myglobal.eventlister) {
                    window.myglobal.eventlister.fire('arena_coin_updated', {
                        arena_coin: data.balance_after
                    });
                }
            }
            
            // 通知状态变更
            that._notifyStatusChange(roomId, 'signed_up');
            
            callback && callback(null, {
                success: true,
                message: '报名成功',
                period_no: data.period_no,
                signup_fee: data.signup_fee,
                balance_after: data.balance_after
            });
        };
        
        // 失败回调
        var failedHandler = function(data) {
            if (responded) return;
            responded = true;
            cleanup();
            callback && callback(data.message || '报名失败', null);
        };
        
        // 注册监听
        socketCtrInstance.onArenaSignupSuccess(successHandler);
        socketCtrInstance.onArenaSignupFailed(failedHandler);
        
        // 设置超时（10秒）
        timeoutId = setTimeout(function() {
            if (responded) return;
            responded = true;
            callback && callback('报名请求超时，请重试', null);
        }, 10000);
        
        // 发送报名请求
        socketCtrInstance.sendArenaSignup({ room_id: roomId });
    };
    
    /**
     * 取消报名（使用 WebSocket 指令）
     * @param {Number} roomId - 竞技场房间ID
     * @param {Function} callback - 回调函数 (err, result)
     */
    that.cancelSignup = function(roomId, callback) {
        // 🔧【修复】使用 myglobal.socket 获取已连接的实例，而不是每次创建新实例
        var socketCtrInstance = window.myglobal && window.myglobal.socket ? window.myglobal.socket : null;
        if (!socketCtrInstance) {
            callback && callback('WebSocket未初始化，请刷新页面重试', null);
            return;
        }
        
        // 检查 WebSocket 连接状态
        if (!socketCtrInstance.isConnected || typeof socketCtrInstance.isConnected !== 'function') {
            console.error("🏟️ [ArenaData] socketCtr.isConnected 不是函数");
            callback && callback('WebSocket连接状态异常，请刷新页面重试', null);
            return;
        }
        
        // 🔧【关键修复】WebSocket 未连接时，自动等待连接完成后重试
        if (!socketCtrInstance.isConnected() || !socketCtrInstance.isWebSocketOpen()) {
            console.log("🏟️ [ArenaData] WebSocket 未连接，等待连接完成后重试...");
            
            var connectionState = socketCtrInstance.getConnectionState ? socketCtrInstance.getConnectionState() : "unknown";
            
            if (connectionState === "connecting") {
                var retryCount = 0;
                var maxRetries = 10;
                var retryInterval = 500;
                
                var tryCancel = function() {
                    retryCount++;
                    if (socketCtrInstance.isConnected() && socketCtrInstance.isWebSocketOpen()) {
                        that._doCancelSignup(socketCtrInstance, roomId, callback);
                    } else if (retryCount < maxRetries) {
                        setTimeout(tryCancel, retryInterval);
                    } else {
                        callback && callback('连接超时，请稍后重试', null);
                    }
                };
                
                setTimeout(tryCancel, retryInterval);
                return;
            } else {
                if (socketCtrInstance.initSocket) {
                    socketCtrInstance.initSocket();
                }
                var retryCount = 0;
                var maxRetries = 10;
                var retryInterval = 500;
                
                var tryCancel = function() {
                    retryCount++;
                    if (socketCtrInstance.isConnected() && socketCtrInstance.isWebSocketOpen()) {
                        that._doCancelSignup(socketCtrInstance, roomId, callback);
                    } else if (retryCount < maxRetries) {
                        setTimeout(tryCancel, retryInterval);
                    } else {
                        callback && callback('连接超时，请稍后重试', null);
                    }
                };
                
                setTimeout(tryCancel, retryInterval);
                return;
            }
        }
        
        // WebSocket 已连接，直接执行
        that._doCancelSignup(socketCtrInstance, roomId, callback);
    };
    
    /**
     * 执行取消报名请求（内部方法）
     * @param {Object} socketCtrInstance - WebSocket 实例
     * @param {Number} roomId - 竞技场房间ID
     * @param {Function} callback - 回调函数
     */
    that._doCancelSignup = function(socketCtrInstance, roomId, callback) {
        
        console.log("🏟️ [ArenaData] 通过 WebSocket 发送取消报名请求, roomId:", roomId);
        
        // 标记是否已响应（防止重复回调）
        var responded = false;
        var timeoutId = null;
        
        // 清理函数（移除监听器和超时）
        var cleanup = function() {
            if (timeoutId) clearTimeout(timeoutId);
            // 移除监听器，防止内存泄漏
            socketCtrInstance.offArenaCancelSuccess(successHandler);
            socketCtrInstance.offArenaCancelFailed(failedHandler);
        };
        
        // 成功回调
        var successHandler = function(data) {
            if (responded) return;
            if (data.room_id !== roomId) return; // 不是当前房间的响应
            
            responded = true;
            cleanup();
            
            // 清除报名记录
            delete that._signedUpArenas[roomId];
            
            // 保存到本地存储
            that.saveToLocal();
            
            // 更新玩家竞技币余额
            if (window.myglobal && window.myglobal.playerData && data.balance_after !== undefined) {
                window.myglobal.playerData.arena_coin = data.balance_after;
                window.myglobal.playerData.saveToLocal();
                
                // 🔧【新增】触发全局事件，通知大厅刷新UI
                if (window.myglobal.eventlister) {
                    window.myglobal.eventlister.fire('arena_coin_updated', {
                        arena_coin: data.balance_after
                    });
                }
            }
            
            // 清除倒计时定时器
            if (that._countdownTimers[roomId]) {
                clearInterval(that._countdownTimers[roomId]);
                delete that._countdownTimers[roomId];
            }
            
            // 通知状态变更
            that._notifyStatusChange(roomId, 'cancelled');
            
            callback && callback(null, { 
                success: true, 
                message: '取消报名成功',
                refund_amount: data.refund_amount,
                balance_after: data.balance_after
            });
        };
        
        // 失败回调
        var failedHandler = function(data) {
            if (responded) return;
            responded = true;
            cleanup();
            callback && callback(data.message || '取消报名失败', null);
        };
        
        // 注册监听
        socketCtrInstance.onArenaCancelSuccess(successHandler);
        socketCtrInstance.onArenaCancelFailed(failedHandler);
        
        // 设置超时（10秒）
        timeoutId = setTimeout(function() {
            if (responded) return;
            responded = true;
            callback && callback('取消报名请求超时，请重试', null);
        }, 10000);
        
        // 发送取消报名请求
        socketCtrInstance.sendArenaCancelSignup({ room_id: roomId });
    };
    
    /**
     * 获取已报名状态
     * @param {Number} roomId - 竞技场房间ID
     * @returns {Object|null} 报名信息或null
     */
    that.getSignupStatus = function(roomId) {
        return that._signedUpArenas[roomId] || null;
    };
    
    /**
     * 检查是否已报名
     * @param {Number} roomId - 竞技场房间ID
     * @returns {Boolean}
     */
    that.isSignedUp = function(roomId) {
        return !!that._signedUpArenas[roomId];
    };
    
    /**
     * 获取开赛倒计时（秒）
     * @param {Number} roomId - 竞技场房间ID
     * @returns {Number} 倒计时秒数，-1表示未报名或无倒计时
     */
    that.getCountdown = function(roomId) {
        var signup = that._signedUpArenas[roomId];
        if (!signup || !signup.countdownEnd) {
            return -1;
        }
        
        var now = Date.now();
        var remaining = Math.floor((signup.countdownEnd - now) / 1000);
        return remaining > 0 ? remaining : 0;
    };
    
    /**
     * 格式化倒计时显示
     * @param {Number} seconds - 秒数
     * @returns {String} 格式化后的时间字符串
     */
    that.formatCountdown = function(seconds) {
        if (seconds < 0) return '';
        if (seconds === 0) return '即将开赛';
        
        var hours = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds % 3600) / 60);
        var secs = seconds % 60;
        
        if (hours > 0) {
            return hours + ':' + (minutes < 10 ? '0' : '') + minutes + ':' + (secs < 10 ? '0' : '') + secs;
        } else {
            return (minutes < 10 ? '0' : '') + minutes + ':' + (secs < 10 ? '0' : '') + secs;
        }
    };
    
    /**
     * 获取竞技场配置
     * @param {Number} roomId - 竞技场房间ID
     * @returns {Object|null}
     */
    that.getArenaConfig = function(roomId) {
        return that._arenaDetails[roomId] || null;
    };
    
    /**
     * 获取报名费
     * @param {Object} roomConfig - 房间配置
     * @returns {Number} 报名费（竞技币）
     */
    that.getSignupFee = function(roomConfig) {
        return roomConfig.signup_fee || roomConfig.signupFee || 0;
    };
    
    /**
     * 获取冠军奖励预览
     * @param {Object} roomConfig - 房间配置
     * @returns {Object} { coins: Number, items: Array }
     */
    that.getChampionReward = function(roomConfig) {
        return roomConfig.champion_reward || roomConfig.championReward || { coins: 0, items: [] };
    };
    
    /**
     * 观看广告获取奖励
     * @param {String} type - 奖励类型 ('gold' 或 'arena_coin')
     * @param {Function} callback - 回调函数 (err, result)
     */
    that.watchAdForReward = function(type, callback) {
        var apiUrl = window.defines ? window.defines.apiUrl : '';
        var cryptoKey = window.defines ? window.defines.cryptoKey : '';
        var token = window.myglobal && window.myglobal.playerData ? window.myglobal.playerData.token : '';
        
        if (!apiUrl || !window.HttpAPI) {
            callback && callback('API未配置', null);
            return;
        }
        
        var requestData = {
            token: token,
            type: type,
            ad_type: 'reward_video'
        };
        
        HttpAPI.post(
            apiUrl + '/api/ad/reward',
            requestData,
            cryptoKey,
            function(err, result) {
                if (err) {
                    callback && callback(err, null);
                    return;
                }
                
                if (result && (result.code === 0 || result.success)) {
                    // 更新玩家数据
                    if (window.myglobal && window.myglobal.playerData) {
                        if (result.data) {
                            if (result.data.gold) {
                                window.myglobal.playerData.gobal_count = result.data.gold;
                            }
                            if (result.data.arena_coin) {
                                window.myglobal.playerData.arena_coin = result.data.arena_coin;
                            }
                            window.myglobal.playerData.saveToLocal();
                        }
                    }
                    
                    callback && callback(null, {
                        success: true,
                        reward: result.data || {}
                    });
                } else {
                    callback && callback(result ? result.message : '获取奖励失败', null);
                }
            }
        );
    };
    
    /**
     * 刷新玩家货币余额
     * @param {Function} callback - 回调函数 (err, data)
     */
    that.refreshBalance = function(callback) {
        var apiUrl = window.defines ? window.defines.apiUrl : '';
        var cryptoKey = window.defines ? window.defines.cryptoKey : '';
        var token = window.myglobal && window.myglobal.playerData ? window.myglobal.playerData.token : '';
        
        if (!apiUrl || !window.HttpAPI) {
            callback && callback('API未配置', null);
            return;
        }
        
        HttpAPI.get(
            apiUrl + '/api/v1/player/balance?token=' + encodeURIComponent(token),
            cryptoKey,
            function(err, result) {
                if (err) {
                    callback && callback(err, null);
                    return;
                }
                
                if (result && (result.code === 0 || result.data)) {
                    var data = result.data || result;
                    
                    // 更新玩家数据
                    if (window.myglobal && window.myglobal.playerData) {
                        if (data.gold !== undefined) {
                            window.myglobal.playerData.gobal_count = data.gold;
                        }
                        if (data.arena_coin !== undefined) {
                            window.myglobal.playerData.arena_coin = data.arena_coin;
                        }
                        window.myglobal.playerData.saveToLocal();
                    }
                    
                    callback && callback(null, data);
                } else {
                    callback && callback(result ? result.message : '获取余额失败', null);
                }
            }
        );
    };
    
    // ==================== 状态监听 ====================
    
    /**
     * 添加状态变更监听器
     * @param {Function} listener - 监听函数 (roomId, status)
     */
    that.addStatusListener = function(listener) {
        that._statusListeners.push(listener);
    };
    
    /**
     * 移除状态变更监听器
     * @param {Function} listener - 监听函数
     */
    that.removeStatusListener = function(listener) {
        var index = that._statusListeners.indexOf(listener);
        if (index > -1) {
            that._statusListeners.splice(index, 1);
        }
    };
    
    /**
     * 通知状态变更
     * @param {Number} roomId - 房间ID
     * @param {String} status - 新状态
     */
    that._notifyStatusChange = function(roomId, status) {
        for (var i = 0; i < that._statusListeners.length; i++) {
            try {
                that._statusListeners[i](roomId, status);
            } catch (e) {
                console.error('状态监听器执行错误:', e);
            }
        }
    };
    
    // ==================== 倒计时管理 ====================
    
    /**
     * 启动倒计时更新
     * @param {Number} roomId - 房间ID
     * @param {Function} onUpdate - 更新回调 (seconds)
     */
    that.startCountdown = function(roomId, onUpdate) {
        // 清除旧的定时器
        if (that._countdownTimers[roomId]) {
            clearInterval(that._countdownTimers[roomId]);
        }
        
        that._countdownTimers[roomId] = setInterval(function() {
            var seconds = that.getCountdown(roomId);
            onUpdate && onUpdate(seconds);
            
            // 倒计时结束
            if (seconds <= 0) {
                clearInterval(that._countdownTimers[roomId]);
                delete that._countdownTimers[roomId];
                that._notifyStatusChange(roomId, 'starting');
            }
        }, 1000);
    };
    
    /**
     * 停止倒计时
     * @param {Number} roomId - 房间ID
     */
    that.stopCountdown = function(roomId) {
        if (that._countdownTimers[roomId]) {
            clearInterval(that._countdownTimers[roomId]);
            delete that._countdownTimers[roomId];
        }
    };
    
    /**
     * 清除所有倒计时
     */
    that.clearAllCountdowns = function() {
        for (var roomId in that._countdownTimers) {
            clearInterval(that._countdownTimers[roomId]);
        }
        that._countdownTimers = {};
    };
    
    // ==================== 本地存储 ====================
    
    /**
     * 保存报名状态到本地
     */
    that.saveToLocal = function() {
        try {
            var data = {
                signedUpArenas: that._signedUpArenas,
                savedAt: Date.now()
            };
            localStorage.setItem('arena_data', JSON.stringify(data));
        } catch (e) {
            console.error('保存竞技场数据失败:', e);
        }
    };
    
    /**
     * 从本地加载报名状态
     */
    that.loadFromLocal = function() {
        try {
            var dataStr = localStorage.getItem('arena_data');
            if (dataStr) {
                var data = JSON.parse(dataStr);
                // 检查数据是否过期（1天）
                if (Date.now() - (data.savedAt || 0) < 24 * 60 * 60 * 1000) {
                    that._signedUpArenas = data.signedUpArenas || {};
                }
            }
        } catch (e) {
            console.error('加载竞技场数据失败:', e);
        }
    };
    
    /**
     * 🔧【新增】从服务端获取报名状态
     * @param {Function} callback - 回调函数 (err, signedUpRooms)
     */
    that.fetchSignupStatusFromServer = function(callback) {
        var apiUrl = window.defines ? window.defines.apiUrl : '';
        var cryptoKey = window.defines ? window.defines.cryptoKey : '';
        var token = window.myglobal && window.myglobal.playerData ? window.myglobal.playerData.token : '';
        
        if (!apiUrl || !window.HttpAPI) {
            callback && callback('API未配置', null);
            return;
        }
        
        HttpAPI.get(
            apiUrl + '/api/v1/arena/signup-status?token=' + encodeURIComponent(token),
            cryptoKey,
            function(err, result) {
                if (err) {
                    console.error("🏟️ [arenaData] 获取报名状态失败:", err);
                    callback && callback(err, null);
                    return;
                }
                
                var signedUpRooms = [];
                if (result && (result.code === 0 || result.data)) {
                    var data = result.data || result;
                    signedUpRooms = data.signed_up_rooms || [];
                    
                    // 更新本地缓存
                    that._signedUpArenas = {};
                    for (var i = 0; i < signedUpRooms.length; i++) {
                        var room = signedUpRooms[i];
                        that._signedUpArenas[room.room_id] = {
                            signupTime: room.signup_time,
                            status: 'signed_up',
                            periodNo: room.period_no,
                            signupFee: room.signup_fee
                        };
                    }
                    
                    // 保存到本地
                    that.saveToLocal();
                }
                
                callback && callback(null, signedUpRooms);
            }
        );
    };
    
    /**
     * 清除所有报名状态（用于测试或重置）
     */
    that.clearAllSignupStatus = function() {
        that._signedUpArenas = {};
        that.saveToLocal();
    };
    
    // 初始化时加载本地数据
    that.loadFromLocal();
    
    return that;
}();
