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
     * 报名竞技场
     * @param {Number} roomId - 竞技场房间ID
     * @param {Function} callback - 回调函数 (err, result)
     */
    that.signup = function(roomId, callback) {
        var apiUrl = window.defines ? window.defines.apiUrl : '';
        var cryptoKey = window.defines ? window.defines.cryptoKey : '';
        var token = window.myglobal && window.myglobal.playerData ? window.myglobal.playerData.token : '';
        
        if (!apiUrl || !window.HttpAPI) {
            callback && callback('API未配置', null);
            return;
        }
        
        var requestData = {
            room_id: roomId,
            token: token
        };
        
        HttpAPI.post(
            apiUrl + '/api/v1/arena/signup',
            requestData,
            cryptoKey,
            function(err, result) {
                if (err) {
                    callback && callback(err, null);
                    return;
                }
                
                if (result && (result.code === 0 || result.success)) {
                    // 记录报名成功
                    var arenaConfig = that._arenaDetails[roomId] || {};
                    that._signedUpArenas[roomId] = {
                        signupTime: Date.now(),
                        status: 'signed_up',
                        countdownEnd: result.data ? result.data.start_time : null,
                        arenaConfig: arenaConfig,
                        periodNo: result.period_no || result.data?.period_no
                    };
                    
                    // 🔧【新增】保存到本地存储
                    that.saveToLocal();
                    
                    // 通知状态变更
                    that._notifyStatusChange(roomId, 'signed_up');
                    
                    callback && callback(null, {
                        success: true,
                        message: result.message || '报名成功',
                        start_time: result.data ? result.data.start_time : null
                    });
                } else {
                    callback && callback(result ? result.message : '报名失败', null);
                }
            }
        );
    };
    
    /**
     * 取消报名
     * @param {Number} roomId - 竞技场房间ID
     * @param {Function} callback - 回调函数 (err, result)
     */
    that.cancelSignup = function(roomId, callback) {
        var apiUrl = window.defines ? window.defines.apiUrl : '';
        var cryptoKey = window.defines ? window.defines.cryptoKey : '';
        var token = window.myglobal && window.myglobal.playerData ? window.myglobal.playerData.token : '';
        
        if (!apiUrl || !window.HttpAPI) {
            callback && callback('API未配置', null);
            return;
        }
        
        var requestData = {
            room_id: roomId,
            token: token
        };
        
        HttpAPI.post(
            apiUrl + '/api/v1/arena/cancel',
            requestData,
            cryptoKey,
            function(err, result) {
                if (err) {
                    callback && callback(err, null);
                    return;
                }
                
                if (result && (result.code === 0 || result.success)) {
                    // 清除报名记录
                    delete that._signedUpArenas[roomId];
                    
                    // 🔧【新增】保存到本地存储
                    that.saveToLocal();
                    
                    // 清除倒计时定时器
                    if (that._countdownTimers[roomId]) {
                        clearInterval(that._countdownTimers[roomId]);
                        delete that._countdownTimers[roomId];
                    }
                    
                    // 通知状态变更
                    that._notifyStatusChange(roomId, 'cancelled');
                    
                    callback && callback(null, { success: true, message: '取消报名成功' });
                } else {
                    callback && callback(result ? result.message : '取消报名失败', null);
                }
            }
        );
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
