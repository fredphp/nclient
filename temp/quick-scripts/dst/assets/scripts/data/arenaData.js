
                (function() {
                    var nodeEnv = typeof require !== 'undefined' && typeof process !== 'undefined';
                    var __module = nodeEnv ? module : {exports:{}};
                    var __filename = 'preview-scripts/assets/scripts/data/arenaData.js';
                    var __require = nodeEnv ? function (request) {
                        return cc.require(request);
                    } : function (request) {
                        return __quick_compile_project__.require(request, __filename);
                    };
                    function __define (exports, require, module) {
                        if (!nodeEnv) {__quick_compile_project__.registerModule(__filename, module);}"use strict";
cc._RF.push(module, '813dcvepIxFjad6cNQB7j3m', 'arenaData');
// scripts/data/arenaData.js

"use strict";

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
window.arenaData = function () {
  var that = {}; // ==================== 竞技场状态数据 ====================
  // 已报名的竞技场列表 { roomId: { signupTime, status, countdownEnd } }

  that._signedUpArenas = {}; // 竞技场详情缓存 { roomId: arenaConfig }

  that._arenaDetails = {}; // 倒计时定时器

  that._countdownTimers = {}; // 状态变更监听器

  that._statusListeners = []; // ==================== API 方法 ====================

  /**
   * 获取竞技场房间列表
   * @param {Function} callback - 回调函数 (err, arenaList)
   */

  that.getArenaList = function (callback) {
    var apiUrl = window.defines ? window.defines.apiUrl : '';
    var cryptoKey = window.defines ? window.defines.cryptoKey : '';

    if (!apiUrl || !window.HttpAPI) {
      callback && callback('API未配置', null);
      return;
    }

    HttpAPI.get(apiUrl + '/api/v1/arena/list', cryptoKey, function (err, result) {
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
    });
  };
  /**
   * 报名竞技场（使用 WebSocket 指令）
   * @param {Number} roomId - 竞技场房间ID
   * @param {Function} callback - 回调函数 (err, result)
   */


  that.signup = function (roomId, callback) {
    // 🔧【修复】使用 myglobal.socket 获取已连接的实例，而不是每次创建新实例
    var socketCtrInstance = window.myglobal && window.myglobal.socket ? window.myglobal.socket : null;

    if (!socketCtrInstance) {
      callback && callback('WebSocket未初始化，请刷新页面重试', null);
      return;
    } // 检查 WebSocket 连接状态


    if (!socketCtrInstance.isConnected || typeof socketCtrInstance.isConnected !== 'function') {
      console.error("🏟️ [ArenaData] socketCtr.isConnected 不是函数");
      callback && callback('WebSocket连接状态异常，请刷新页面重试', null);
      return;
    } // 🔧【关键修复】等待认证完成后再发送请求
    // 问题：登录后立即发送请求时，connected 消息可能还没处理完成


    var waitForAuth = function waitForAuth(onReady) {
      // 检查是否已认证
      if (socketCtrInstance.isAuthenticated && socketCtrInstance.isAuthenticated()) {
        console.log("🏟️ [ArenaData] WebSocket 已认证，可以发送请求");
        onReady();
        return;
      } // 未认证，等待认证完成


      console.log("🏟️ [ArenaData] WebSocket 未认证，等待认证完成...");
      var retryCount = 0;
      var maxRetries = 20; // 最多等待 10 秒（每次 500ms）

      var retryInterval = 500;

      var tryAuth = function tryAuth() {
        retryCount++;

        if (socketCtrInstance.isAuthenticated && socketCtrInstance.isAuthenticated()) {
          console.log("🏟️ [ArenaData] WebSocket 认证完成，可以发送请求");
          onReady();
        } else if (retryCount < maxRetries) {
          console.log("🏟️ [ArenaData] 等待认证... 重试次数:", retryCount);
          setTimeout(tryAuth, retryInterval);
        } else {
          // 等待超时
          console.warn("🏟️ [ArenaData] 等待 WebSocket 认证超时");
          callback && callback('认证超时，请刷新页面重试', null);
        }
      };

      setTimeout(tryAuth, retryInterval);
    }; // 🔧【关键修复】WebSocket 未连接时，自动等待连接完成后重试


    if (!socketCtrInstance.isConnected() || !socketCtrInstance.isWebSocketOpen()) {
      console.log("🏟️ [ArenaData] WebSocket 未连接，等待连接完成后重试..."); // 检查是否正在连接中

      var connectionState = socketCtrInstance.getConnectionState ? socketCtrInstance.getConnectionState() : "unknown";
      console.log("🏟️ [ArenaData] 当前连接状态:", connectionState);

      if (connectionState === "connecting") {
        // 正在连接中，等待连接完成后自动重试
        var retryCount = 0;
        var maxRetries = 10; // 最多等待 5 秒（每次 500ms）

        var retryInterval = 500;

        var _trySignup2 = function trySignup() {
          retryCount++;

          if (socketCtrInstance.isConnected() && socketCtrInstance.isWebSocketOpen()) {
            console.log("🏟️ [ArenaData] WebSocket 已连接，等待认证完成"); // 🔧【修复】连接成功后，还需要等待认证完成

            waitForAuth(function () {
              that._doSignup(socketCtrInstance, roomId, callback);
            });
          } else if (retryCount < maxRetries) {
            console.log("🏟️ [ArenaData] 等待连接... 重试次数:", retryCount);
            setTimeout(_trySignup2, retryInterval);
          } else {
            // 等待超时
            console.warn("🏟️ [ArenaData] 等待 WebSocket 连接超时");
            callback && callback('连接超时，请稍后重试', null);
          }
        };

        setTimeout(_trySignup2, retryInterval);
        return;
      } else {
        // 未在连接中，尝试初始化连接
        console.log("🏟️ [ArenaData] WebSocket 未连接，尝试初始化连接...");

        if (socketCtrInstance.initSocket) {
          socketCtrInstance.initSocket();
        } // 等待连接完成后重试


        var retryCount = 0;
        var maxRetries = 10;
        var retryInterval = 500;

        var _trySignup2 = function _trySignup() {
          retryCount++;

          if (socketCtrInstance.isConnected() && socketCtrInstance.isWebSocketOpen()) {
            console.log("🏟️ [ArenaData] WebSocket 已连接，等待认证完成"); // 🔧【修复】连接成功后，还需要等待认证完成

            waitForAuth(function () {
              that._doSignup(socketCtrInstance, roomId, callback);
            });
          } else if (retryCount < maxRetries) {
            setTimeout(_trySignup2, retryInterval);
          } else {
            callback && callback('连接超时，请稍后重试', null);
          }
        };

        setTimeout(_trySignup2, retryInterval);
        return;
      }
    } // 🔧【修复】WebSocket 已连接，但需要等待认证完成


    waitForAuth(function () {
      that._doSignup(socketCtrInstance, roomId, callback);
    });
  };
  /**
   * 执行报名请求（内部方法）
   * @param {Object} socketCtrInstance - WebSocket 实例
   * @param {Number} roomId - 竞技场房间ID
   * @param {Function} callback - 回调函数
   */


  that._doSignup = function (socketCtrInstance, roomId, callback) {
    console.log("🏟️ [ArenaData] 通过 WebSocket 发送报名请求, roomId:", roomId); // 标记是否已响应（防止重复回调）

    var responded = false;
    var timeoutId = null; // 清理函数（移除监听器和超时）

    var cleanup = function cleanup() {
      if (timeoutId) clearTimeout(timeoutId); // 移除监听器，防止内存泄漏

      socketCtrInstance.offArenaSignupSuccess(successHandler);
      socketCtrInstance.offArenaSignupFailed(failedHandler);
    }; // 成功回调


    var successHandler = function successHandler(data) {
      if (responded) return;
      if (data.room_id !== roomId) return; // 不是当前房间的响应

      responded = true;
      cleanup(); // 记录报名成功

      var arenaConfig = that._arenaDetails[roomId] || {};
      that._signedUpArenas[roomId] = {
        signupTime: data.signup_time || Date.now(),
        status: 'signed_up',
        arenaConfig: arenaConfig,
        periodNo: data.period_no,
        signupFee: data.signup_fee
      }; // 保存到本地存储

      that.saveToLocal(); // 更新玩家竞技币余额

      if (window.myglobal && window.myglobal.playerData && data.balance_after !== undefined) {
        window.myglobal.playerData.arena_coin = data.balance_after;
        window.myglobal.playerData.saveToLocal(); // 🔧【新增】触发全局事件，通知大厅刷新UI

        if (window.myglobal.eventlister) {
          window.myglobal.eventlister.fire('arena_coin_updated', {
            arena_coin: data.balance_after
          });
        }
      } // 通知状态变更


      that._notifyStatusChange(roomId, 'signed_up');

      callback && callback(null, {
        success: true,
        message: '报名成功',
        period_no: data.period_no,
        signup_fee: data.signup_fee,
        balance_after: data.balance_after
      });
    }; // 失败回调


    var failedHandler = function failedHandler(data) {
      if (responded) return;
      responded = true;
      cleanup();
      callback && callback(data.message || '报名失败', null);
    }; // 注册监听


    socketCtrInstance.onArenaSignupSuccess(successHandler);
    socketCtrInstance.onArenaSignupFailed(failedHandler); // 设置超时（10秒）

    timeoutId = setTimeout(function () {
      if (responded) return;
      responded = true;
      callback && callback('报名请求超时，请重试', null);
    }, 10000); // 发送报名请求

    socketCtrInstance.sendArenaSignup({
      room_id: roomId
    });
  };
  /**
   * 取消报名（使用 WebSocket 指令）
   * @param {Number} roomId - 竞技场房间ID
   * @param {Function} callback - 回调函数 (err, result)
   */


  that.cancelSignup = function (roomId, callback) {
    // 🔧【修复】使用 myglobal.socket 获取已连接的实例，而不是每次创建新实例
    var socketCtrInstance = window.myglobal && window.myglobal.socket ? window.myglobal.socket : null;

    if (!socketCtrInstance) {
      callback && callback('WebSocket未初始化，请刷新页面重试', null);
      return;
    } // 检查 WebSocket 连接状态


    if (!socketCtrInstance.isConnected || typeof socketCtrInstance.isConnected !== 'function') {
      console.error("🏟️ [ArenaData] socketCtr.isConnected 不是函数");
      callback && callback('WebSocket连接状态异常，请刷新页面重试', null);
      return;
    } // 🔧【关键修复】WebSocket 未连接时，自动等待连接完成后重试


    if (!socketCtrInstance.isConnected() || !socketCtrInstance.isWebSocketOpen()) {
      console.log("🏟️ [ArenaData] WebSocket 未连接，等待连接完成后重试...");
      var connectionState = socketCtrInstance.getConnectionState ? socketCtrInstance.getConnectionState() : "unknown";

      if (connectionState === "connecting") {
        var retryCount = 0;
        var maxRetries = 10;
        var retryInterval = 500;

        var _tryCancel2 = function tryCancel() {
          retryCount++;

          if (socketCtrInstance.isConnected() && socketCtrInstance.isWebSocketOpen()) {
            that._doCancelSignup(socketCtrInstance, roomId, callback);
          } else if (retryCount < maxRetries) {
            setTimeout(_tryCancel2, retryInterval);
          } else {
            callback && callback('连接超时，请稍后重试', null);
          }
        };

        setTimeout(_tryCancel2, retryInterval);
        return;
      } else {
        if (socketCtrInstance.initSocket) {
          socketCtrInstance.initSocket();
        }

        var retryCount = 0;
        var maxRetries = 10;
        var retryInterval = 500;

        var _tryCancel2 = function _tryCancel() {
          retryCount++;

          if (socketCtrInstance.isConnected() && socketCtrInstance.isWebSocketOpen()) {
            that._doCancelSignup(socketCtrInstance, roomId, callback);
          } else if (retryCount < maxRetries) {
            setTimeout(_tryCancel2, retryInterval);
          } else {
            callback && callback('连接超时，请稍后重试', null);
          }
        };

        setTimeout(_tryCancel2, retryInterval);
        return;
      }
    } // WebSocket 已连接，直接执行


    that._doCancelSignup(socketCtrInstance, roomId, callback);
  };
  /**
   * 执行取消报名请求（内部方法）
   * @param {Object} socketCtrInstance - WebSocket 实例
   * @param {Number} roomId - 竞技场房间ID
   * @param {Function} callback - 回调函数
   */


  that._doCancelSignup = function (socketCtrInstance, roomId, callback) {
    console.log("🏟️ [ArenaData] 通过 WebSocket 发送取消报名请求, roomId:", roomId); // 标记是否已响应（防止重复回调）

    var responded = false;
    var timeoutId = null; // 清理函数（移除监听器和超时）

    var cleanup = function cleanup() {
      if (timeoutId) clearTimeout(timeoutId); // 移除监听器，防止内存泄漏

      socketCtrInstance.offArenaCancelSuccess(successHandler);
      socketCtrInstance.offArenaCancelFailed(failedHandler);
    }; // 成功回调


    var successHandler = function successHandler(data) {
      if (responded) return;
      if (data.room_id !== roomId) return; // 不是当前房间的响应

      responded = true;
      cleanup(); // 清除报名记录

      delete that._signedUpArenas[roomId]; // 保存到本地存储

      that.saveToLocal(); // 更新玩家竞技币余额

      if (window.myglobal && window.myglobal.playerData && data.balance_after !== undefined) {
        window.myglobal.playerData.arena_coin = data.balance_after;
        window.myglobal.playerData.saveToLocal(); // 🔧【新增】触发全局事件，通知大厅刷新UI

        if (window.myglobal.eventlister) {
          window.myglobal.eventlister.fire('arena_coin_updated', {
            arena_coin: data.balance_after
          });
        }
      } // 清除倒计时定时器


      if (that._countdownTimers[roomId]) {
        clearInterval(that._countdownTimers[roomId]);
        delete that._countdownTimers[roomId];
      } // 通知状态变更


      that._notifyStatusChange(roomId, 'cancelled');

      callback && callback(null, {
        success: true,
        message: '取消报名成功',
        refund_amount: data.refund_amount,
        balance_after: data.balance_after
      });
    }; // 失败回调


    var failedHandler = function failedHandler(data) {
      if (responded) return;
      responded = true;
      cleanup();
      callback && callback(data.message || '取消报名失败', null);
    }; // 注册监听


    socketCtrInstance.onArenaCancelSuccess(successHandler);
    socketCtrInstance.onArenaCancelFailed(failedHandler); // 设置超时（10秒）

    timeoutId = setTimeout(function () {
      if (responded) return;
      responded = true;
      callback && callback('取消报名请求超时，请重试', null);
    }, 10000); // 发送取消报名请求

    socketCtrInstance.sendArenaCancelSignup({
      room_id: roomId
    });
  };
  /**
   * 获取已报名状态
   * @param {Number} roomId - 竞技场房间ID
   * @returns {Object|null} 报名信息或null
   */


  that.getSignupStatus = function (roomId) {
    return that._signedUpArenas[roomId] || null;
  };
  /**
   * 检查是否已报名
   * @param {Number} roomId - 竞技场房间ID
   * @returns {Boolean}
   */


  that.isSignedUp = function (roomId) {
    return !!that._signedUpArenas[roomId];
  };
  /**
   * 获取开赛倒计时（秒）
   * @param {Number} roomId - 竞技场房间ID
   * @returns {Number} 倒计时秒数，-1表示未报名或无倒计时
   */


  that.getCountdown = function (roomId) {
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


  that.formatCountdown = function (seconds) {
    if (seconds < 0) return '';
    if (seconds === 0) return '即将开赛';
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor(seconds % 3600 / 60);
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


  that.getArenaConfig = function (roomId) {
    return that._arenaDetails[roomId] || null;
  };
  /**
   * 获取报名费
   * @param {Object} roomConfig - 房间配置
   * @returns {Number} 报名费（竞技币）
   */


  that.getSignupFee = function (roomConfig) {
    return roomConfig.signup_fee || roomConfig.signupFee || 0;
  };
  /**
   * 获取冠军奖励预览
   * @param {Object} roomConfig - 房间配置
   * @returns {Object} { coins: Number, items: Array }
   */


  that.getChampionReward = function (roomConfig) {
    return roomConfig.champion_reward || roomConfig.championReward || {
      coins: 0,
      items: []
    };
  };
  /**
   * 观看广告获取奖励
   * @param {String} type - 奖励类型 ('gold' 或 'arena_coin')
   * @param {Function} callback - 回调函数 (err, result)
   */


  that.watchAdForReward = function (type, callback) {
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
    HttpAPI.post(apiUrl + '/api/ad/reward', requestData, cryptoKey, function (err, result) {
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
    });
  };
  /**
   * 刷新玩家货币余额
   * @param {Function} callback - 回调函数 (err, data)
   */


  that.refreshBalance = function (callback) {
    var apiUrl = window.defines ? window.defines.apiUrl : '';
    var cryptoKey = window.defines ? window.defines.cryptoKey : '';
    var token = window.myglobal && window.myglobal.playerData ? window.myglobal.playerData.token : '';

    if (!apiUrl || !window.HttpAPI) {
      callback && callback('API未配置', null);
      return;
    }

    HttpAPI.get(apiUrl + '/api/v1/player/balance?token=' + encodeURIComponent(token), cryptoKey, function (err, result) {
      if (err) {
        callback && callback(err, null);
        return;
      }

      if (result && (result.code === 0 || result.data)) {
        var data = result.data || result; // 更新玩家数据

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
    });
  }; // ==================== 状态监听 ====================

  /**
   * 添加状态变更监听器
   * @param {Function} listener - 监听函数 (roomId, status)
   */


  that.addStatusListener = function (listener) {
    that._statusListeners.push(listener);
  };
  /**
   * 移除状态变更监听器
   * @param {Function} listener - 监听函数
   */


  that.removeStatusListener = function (listener) {
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


  that._notifyStatusChange = function (roomId, status) {
    for (var i = 0; i < that._statusListeners.length; i++) {
      try {
        that._statusListeners[i](roomId, status);
      } catch (e) {
        console.error('状态监听器执行错误:', e);
      }
    }
  }; // ==================== 倒计时管理 ====================

  /**
   * 启动倒计时更新
   * @param {Number} roomId - 房间ID
   * @param {Function} onUpdate - 更新回调 (seconds)
   */


  that.startCountdown = function (roomId, onUpdate) {
    // 清除旧的定时器
    if (that._countdownTimers[roomId]) {
      clearInterval(that._countdownTimers[roomId]);
    }

    that._countdownTimers[roomId] = setInterval(function () {
      var seconds = that.getCountdown(roomId);
      onUpdate && onUpdate(seconds); // 倒计时结束

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


  that.stopCountdown = function (roomId) {
    if (that._countdownTimers[roomId]) {
      clearInterval(that._countdownTimers[roomId]);
      delete that._countdownTimers[roomId];
    }
  };
  /**
   * 清除所有倒计时
   */


  that.clearAllCountdowns = function () {
    for (var roomId in that._countdownTimers) {
      clearInterval(that._countdownTimers[roomId]);
    }

    that._countdownTimers = {};
  }; // ==================== 本地存储 ====================

  /**
   * 保存报名状态到本地
   */


  that.saveToLocal = function () {
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


  that.loadFromLocal = function () {
    try {
      var dataStr = localStorage.getItem('arena_data');

      if (dataStr) {
        var data = JSON.parse(dataStr); // 检查数据是否过期（1天）

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


  that.fetchSignupStatusFromServer = function (callback) {
    var apiUrl = window.defines ? window.defines.apiUrl : '';
    var cryptoKey = window.defines ? window.defines.cryptoKey : '';
    var token = window.myglobal && window.myglobal.playerData ? window.myglobal.playerData.token : '';

    if (!apiUrl || !window.HttpAPI) {
      callback && callback('API未配置', null);
      return;
    }

    HttpAPI.get(apiUrl + '/api/v1/arena/signup-status?token=' + encodeURIComponent(token), cryptoKey, function (err, result) {
      if (err) {
        console.error("🏟️ [arenaData] 获取报名状态失败:", err);
        callback && callback(err, null);
        return;
      }

      var signedUpRooms = [];

      if (result && (result.code === 0 || result.data)) {
        var data = result.data || result;
        signedUpRooms = data.signed_up_rooms || []; // 更新本地缓存

        that._signedUpArenas = {};

        for (var i = 0; i < signedUpRooms.length; i++) {
          var room = signedUpRooms[i];
          that._signedUpArenas[room.room_id] = {
            signupTime: room.signup_time,
            status: 'signed_up',
            periodNo: room.period_no,
            signupFee: room.signup_fee
          };
        } // 保存到本地


        that.saveToLocal();
      }

      callback && callback(null, signedUpRooms);
    });
  };
  /**
   * 清除所有报名状态（用于测试或重置）
   */


  that.clearAllSignupStatus = function () {
    that._signedUpArenas = {};
    that.saveToLocal();
  }; // 初始化时加载本地数据


  that.loadFromLocal();
  return that;
}();

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2RhdGEvYXJlbmFEYXRhLmpzIl0sIm5hbWVzIjpbIndpbmRvdyIsImFyZW5hRGF0YSIsInRoYXQiLCJfc2lnbmVkVXBBcmVuYXMiLCJfYXJlbmFEZXRhaWxzIiwiX2NvdW50ZG93blRpbWVycyIsIl9zdGF0dXNMaXN0ZW5lcnMiLCJnZXRBcmVuYUxpc3QiLCJjYWxsYmFjayIsImFwaVVybCIsImRlZmluZXMiLCJjcnlwdG9LZXkiLCJIdHRwQVBJIiwiZ2V0IiwiZXJyIiwicmVzdWx0IiwiYXJlbmFMaXN0IiwiY29kZSIsImRhdGEiLCJBcnJheSIsImlzQXJyYXkiLCJpIiwibGVuZ3RoIiwiYXJlbmEiLCJpZCIsInNpZ251cCIsInJvb21JZCIsInNvY2tldEN0ckluc3RhbmNlIiwibXlnbG9iYWwiLCJzb2NrZXQiLCJpc0Nvbm5lY3RlZCIsImNvbnNvbGUiLCJlcnJvciIsIndhaXRGb3JBdXRoIiwib25SZWFkeSIsImlzQXV0aGVudGljYXRlZCIsImxvZyIsInJldHJ5Q291bnQiLCJtYXhSZXRyaWVzIiwicmV0cnlJbnRlcnZhbCIsInRyeUF1dGgiLCJzZXRUaW1lb3V0Iiwid2FybiIsImlzV2ViU29ja2V0T3BlbiIsImNvbm5lY3Rpb25TdGF0ZSIsImdldENvbm5lY3Rpb25TdGF0ZSIsInRyeVNpZ251cCIsIl9kb1NpZ251cCIsImluaXRTb2NrZXQiLCJyZXNwb25kZWQiLCJ0aW1lb3V0SWQiLCJjbGVhbnVwIiwiY2xlYXJUaW1lb3V0Iiwib2ZmQXJlbmFTaWdudXBTdWNjZXNzIiwic3VjY2Vzc0hhbmRsZXIiLCJvZmZBcmVuYVNpZ251cEZhaWxlZCIsImZhaWxlZEhhbmRsZXIiLCJyb29tX2lkIiwiYXJlbmFDb25maWciLCJzaWdudXBUaW1lIiwic2lnbnVwX3RpbWUiLCJEYXRlIiwibm93Iiwic3RhdHVzIiwicGVyaW9kTm8iLCJwZXJpb2Rfbm8iLCJzaWdudXBGZWUiLCJzaWdudXBfZmVlIiwic2F2ZVRvTG9jYWwiLCJwbGF5ZXJEYXRhIiwiYmFsYW5jZV9hZnRlciIsInVuZGVmaW5lZCIsImFyZW5hX2NvaW4iLCJldmVudGxpc3RlciIsImZpcmUiLCJfbm90aWZ5U3RhdHVzQ2hhbmdlIiwic3VjY2VzcyIsIm1lc3NhZ2UiLCJvbkFyZW5hU2lnbnVwU3VjY2VzcyIsIm9uQXJlbmFTaWdudXBGYWlsZWQiLCJzZW5kQXJlbmFTaWdudXAiLCJjYW5jZWxTaWdudXAiLCJ0cnlDYW5jZWwiLCJfZG9DYW5jZWxTaWdudXAiLCJvZmZBcmVuYUNhbmNlbFN1Y2Nlc3MiLCJvZmZBcmVuYUNhbmNlbEZhaWxlZCIsImNsZWFySW50ZXJ2YWwiLCJyZWZ1bmRfYW1vdW50Iiwib25BcmVuYUNhbmNlbFN1Y2Nlc3MiLCJvbkFyZW5hQ2FuY2VsRmFpbGVkIiwic2VuZEFyZW5hQ2FuY2VsU2lnbnVwIiwiZ2V0U2lnbnVwU3RhdHVzIiwiaXNTaWduZWRVcCIsImdldENvdW50ZG93biIsImNvdW50ZG93bkVuZCIsInJlbWFpbmluZyIsIk1hdGgiLCJmbG9vciIsImZvcm1hdENvdW50ZG93biIsInNlY29uZHMiLCJob3VycyIsIm1pbnV0ZXMiLCJzZWNzIiwiZ2V0QXJlbmFDb25maWciLCJnZXRTaWdudXBGZWUiLCJyb29tQ29uZmlnIiwiZ2V0Q2hhbXBpb25SZXdhcmQiLCJjaGFtcGlvbl9yZXdhcmQiLCJjaGFtcGlvblJld2FyZCIsImNvaW5zIiwiaXRlbXMiLCJ3YXRjaEFkRm9yUmV3YXJkIiwidHlwZSIsInRva2VuIiwicmVxdWVzdERhdGEiLCJhZF90eXBlIiwicG9zdCIsImdvbGQiLCJnb2JhbF9jb3VudCIsInJld2FyZCIsInJlZnJlc2hCYWxhbmNlIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiYWRkU3RhdHVzTGlzdGVuZXIiLCJsaXN0ZW5lciIsInB1c2giLCJyZW1vdmVTdGF0dXNMaXN0ZW5lciIsImluZGV4IiwiaW5kZXhPZiIsInNwbGljZSIsImUiLCJzdGFydENvdW50ZG93biIsIm9uVXBkYXRlIiwic2V0SW50ZXJ2YWwiLCJzdG9wQ291bnRkb3duIiwiY2xlYXJBbGxDb3VudGRvd25zIiwic2lnbmVkVXBBcmVuYXMiLCJzYXZlZEF0IiwibG9jYWxTdG9yYWdlIiwic2V0SXRlbSIsIkpTT04iLCJzdHJpbmdpZnkiLCJsb2FkRnJvbUxvY2FsIiwiZGF0YVN0ciIsImdldEl0ZW0iLCJwYXJzZSIsImZldGNoU2lnbnVwU3RhdHVzRnJvbVNlcnZlciIsInNpZ25lZFVwUm9vbXMiLCJzaWduZWRfdXBfcm9vbXMiLCJyb29tIiwiY2xlYXJBbGxTaWdudXBTdGF0dXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQUEsTUFBTSxDQUFDQyxTQUFQLEdBQW1CLFlBQVc7RUFDMUIsSUFBSUMsSUFBSSxHQUFHLEVBQVgsQ0FEMEIsQ0FHMUI7RUFFQTs7RUFDQUEsSUFBSSxDQUFDQyxlQUFMLEdBQXVCLEVBQXZCLENBTjBCLENBUTFCOztFQUNBRCxJQUFJLENBQUNFLGFBQUwsR0FBcUIsRUFBckIsQ0FUMEIsQ0FXMUI7O0VBQ0FGLElBQUksQ0FBQ0csZ0JBQUwsR0FBd0IsRUFBeEIsQ0FaMEIsQ0FjMUI7O0VBQ0FILElBQUksQ0FBQ0ksZ0JBQUwsR0FBd0IsRUFBeEIsQ0FmMEIsQ0FpQjFCOztFQUVBO0FBQ0o7QUFDQTtBQUNBOztFQUNJSixJQUFJLENBQUNLLFlBQUwsR0FBb0IsVUFBU0MsUUFBVCxFQUFtQjtJQUNuQyxJQUFJQyxNQUFNLEdBQUdULE1BQU0sQ0FBQ1UsT0FBUCxHQUFpQlYsTUFBTSxDQUFDVSxPQUFQLENBQWVELE1BQWhDLEdBQXlDLEVBQXREO0lBQ0EsSUFBSUUsU0FBUyxHQUFHWCxNQUFNLENBQUNVLE9BQVAsR0FBaUJWLE1BQU0sQ0FBQ1UsT0FBUCxDQUFlQyxTQUFoQyxHQUE0QyxFQUE1RDs7SUFFQSxJQUFJLENBQUNGLE1BQUQsSUFBVyxDQUFDVCxNQUFNLENBQUNZLE9BQXZCLEVBQWdDO01BQzVCSixRQUFRLElBQUlBLFFB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QkEsQ0FBQyxHQUFHNkgsYUFBYSxDQUFDNUgsTUFBbEMsRUFBMENELENBQUMsRUFBM0MsRUFBK0M7VUFDM0MsSUFBSStILElBQUksR0FBR0YsYUFBYSxDQUFDN0gsQ0FBRCxDQUF4QjtVQUNBbkIsSUFBSSxDQUFDQyxlQUFMLENBQXFCaUosSUFBSSxDQUFDM0YsT0FBMUIsSUFBcUM7WUFDakNFLFVBQVUsRUFBRXlGLElBQUksQ0FBQ3hGLFdBRGdCO1lBRWpDRyxNQUFNLEVBQUUsV0FGeUI7WUFHakNDLFFBQVEsRUFBRW9GLElBQUksQ0FBQ25GLFNBSGtCO1lBSWpDQyxTQUFTLEVBQUVrRixJQUFJLENBQUNqRjtVQUppQixDQUFyQztRQU1ILENBZDZDLENBZ0I5Qzs7O1FBQ0FqRSxJQUFJLENBQUNrRSxXQUFMO01BQ0g7O01BRUQ1RCxRQUFRLElBQUlBLFFBQVEsQ0FBQyxJQUFELEVBQU8wSSxhQUFQLENBQXBCO0lBQ0gsQ0FoQ0w7RUFrQ0gsQ0E1Q0Q7RUE4Q0E7QUFDSjtBQUNBOzs7RUFDSWhKLElBQUksQ0FBQ21KLG9CQUFMLEdBQTRCLFlBQVc7SUFDbkNuSixJQUFJLENBQUNDLGVBQUwsR0FBdUIsRUFBdkI7SUFDQUQsSUFBSSxDQUFDa0UsV0FBTDtFQUNILENBSEQsQ0F6eEIwQixDQTh4QjFCOzs7RUFDQWxFLElBQUksQ0FBQzJJLGFBQUw7RUFFQSxPQUFPM0ksSUFBUDtBQUNILENBbHlCa0IsRUFBbkIiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog56ue5oqA5Zy65pWw5o2u566h55CG5qih5Z2XXG4gKiDnlKjkuo7nrqHnkIbnq57mioDlnLrmiqXlkI3jgIHlgJLorqHml7bjgIHlpZblirHnrYnmlbDmja5cbiAqIFxuICog5Yqf6IO977yaXG4gKiAxLiDojrflj5bnq57mioDlnLrmiL/pl7TliJfooahcbiAqIDIuIOaKpeWQjS/lj5bmtojmiqXlkI1cbiAqIDMuIOiOt+WPluW8gOi1m+WAkuiuoeaXtlxuICogNC4g6I635Y+W5bey5oql5ZCN54q25oCBXG4gKi9cblxud2luZG93LmFyZW5hRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0ge307XG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT0g56ue5oqA5Zy654q25oCB5pWw5o2uID09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLy8g5bey5oql5ZCN55qE56ue5oqA5Zy65YiX6KGoIHsgcm9vbUlkOiB7IHNpZ251cFRpbWUsIHN0YXR1cywgY291bnRkb3duRW5kIH0gfVxuICAgIHRoYXQuX3NpZ25lZFVwQXJlbmFzID0ge307XG4gICAgXG4gICAgLy8g56ue5oqA5Zy66K+m5oOF57yT5a2YIHsgcm9vbUlkOiBhcmVuYUNvbmZpZyB9XG4gICAgdGhhdC5fYXJlbmFEZXRhaWxzID0ge307XG4gICAgXG4gICAgLy8g5YCS6K6h5pe25a6a5pe25ZmoXG4gICAgdGhhdC5fY291bnRkb3duVGltZXJzID0ge307XG4gICAgXG4gICAgLy8g54q25oCB5Y+Y5pu055uR5ZCs5ZmoXG4gICAgdGhhdC5fc3RhdHVzTGlzdGVuZXJzID0gW107XG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT0gQVBJIOaWueazlSA9PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIOiOt+WPluernuaKgOWcuuaIv+mXtOWIl+ihqFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0g5Zue6LCD5Ye95pWwIChlcnIsIGFyZW5hTGlzdClcbiAgICAgKi9cbiAgICB0aGF0LmdldEFyZW5hTGlzdCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBhcGlVcmwgPSB3aW5kb3cuZGVmaW5lcyA/IHdpbmRvdy5kZWZpbmVzLmFwaVVybCA6ICcnO1xuICAgICAgICB2YXIgY3J5cHRvS2V5ID0gd2luZG93LmRlZmluZXMgPyB3aW5kb3cuZGVmaW5lcy5jcnlwdG9LZXkgOiAnJztcbiAgICAgICAgXG4gICAgICAgIGlmICghYXBpVXJsIHx8ICF3aW5kb3cuSHR0cEFQSSkge1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soJ0FQSeacqumFjee9ricsIG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBIdHRwQVBJLmdldChcbiAgICAgICAgICAgIGFwaVVybCArICcvYXBpL3YxL2FyZW5hL2xpc3QnLFxuICAgICAgICAgICAgY3J5cHRvS2V5LFxuICAgICAgICAgICAgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIGFyZW5hTGlzdCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuY29kZSA9PT0gMCAmJiByZXN1bHQuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBhcmVuYUxpc3QgPSByZXN1bHQuZGF0YTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdCAmJiBBcnJheS5pc0FycmF5KHJlc3VsdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJlbmFMaXN0ID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoYXJlbmFMaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe8k+WtmOernuaKgOWcuuivpuaDhVxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZW5hTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFyZW5hID0gYXJlbmFMaXN0W2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fYXJlbmFEZXRhaWxzW2FyZW5hLmlkXSA9IGFyZW5hO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKG51bGwsIGFyZW5hTGlzdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soJ+iOt+WPluernuaKgOWcuuWIl+ihqOWksei0pScsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOaKpeWQjeernuaKgOWcuu+8iOS9v+eUqCBXZWJTb2NrZXQg5oyH5Luk77yJXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHJvb21JZCAtIOernuaKgOWcuuaIv+mXtElEXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSDlm57osIPlh73mlbAgKGVyciwgcmVzdWx0KVxuICAgICAqL1xuICAgIHRoYXQuc2lnbnVwID0gZnVuY3Rpb24ocm9vbUlkLCBjYWxsYmFjaykge1xuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55SoIG15Z2xvYmFsLnNvY2tldCDojrflj5blt7Lov57mjqXnmoTlrp7kvovvvIzogIzkuI3mmK/mr4/mrKHliJvlu7rmlrDlrp7kvotcbiAgICAgICAgdmFyIHNvY2tldEN0ckluc3RhbmNlID0gd2luZG93Lm15Z2xvYmFsICYmIHdpbmRvdy5teWdsb2JhbC5zb2NrZXQgPyB3aW5kb3cubXlnbG9iYWwuc29ja2V0IDogbnVsbDtcbiAgICAgICAgaWYgKCFzb2NrZXRDdHJJbnN0YW5jZSkge1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soJ1dlYlNvY2tldOacquWIneWni+WMlu+8jOivt+WIt+aWsOmhtemdoumHjeivlScsIG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmo4Dmn6UgV2ViU29ja2V0IOi/nuaOpeeKtuaAgVxuICAgICAgICBpZiAoIXNvY2tldEN0ckluc3RhbmNlLmlzQ29ubmVjdGVkIHx8IHR5cGVvZiBzb2NrZXRDdHJJbnN0YW5jZS5pc0Nvbm5lY3RlZCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfj5/vuI8gW0FyZW5hRGF0YV0gc29ja2V0Q3RyLmlzQ29ubmVjdGVkIOS4jeaYr+WHveaVsFwiKTtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCdXZWJTb2NrZXTov57mjqXnirbmgIHlvILluLjvvIzor7fliLfmlrDpobXpnaLph43or5UnLCBudWxsKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeetieW+heiupOivgeWujOaIkOWQjuWGjeWPkemAgeivt+axglxuICAgICAgICAvLyDpl67popjvvJrnmbvlvZXlkI7nq4vljbPlj5HpgIHor7fmsYLml7bvvIxjb25uZWN0ZWQg5raI5oGv5Y+v6IO96L+Y5rKh5aSE55CG5a6M5oiQXG4gICAgICAgIHZhciB3YWl0Rm9yQXV0aCA9IGZ1bmN0aW9uKG9uUmVhZHkpIHtcbiAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpuW3suiupOivgVxuICAgICAgICAgICAgaWYgKHNvY2tldEN0ckluc3RhbmNlLmlzQXV0aGVudGljYXRlZCAmJiBzb2NrZXRDdHJJbnN0YW5jZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFEYXRhXSBXZWJTb2NrZXQg5bey6K6k6K+B77yM5Y+v5Lul5Y+R6YCB6K+35rGCXCIpO1xuICAgICAgICAgICAgICAgIG9uUmVhZHkoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOacquiupOivge+8jOetieW+heiupOivgeWujOaIkFxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYURhdGFdIFdlYlNvY2tldCDmnKrorqTor4HvvIznrYnlvoXorqTor4HlrozmiJAuLi5cIik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciByZXRyeUNvdW50ID0gMDtcbiAgICAgICAgICAgIHZhciBtYXhSZXRyaWVzID0gMjA7IC8vIOacgOWkmuetieW+hSAxMCDnp5LvvIjmr4/mrKEgNTAwbXPvvIlcbiAgICAgICAgICAgIHZhciByZXRyeUludGVydmFsID0gNTAwO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgdHJ5QXV0aCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHJ5Q291bnQrKztcbiAgICAgICAgICAgICAgICBpZiAoc29ja2V0Q3RySW5zdGFuY2UuaXNBdXRoZW50aWNhdGVkICYmIHNvY2tldEN0ckluc3RhbmNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFEYXRhXSBXZWJTb2NrZXQg6K6k6K+B5a6M5oiQ77yM5Y+v5Lul5Y+R6YCB6K+35rGCXCIpO1xuICAgICAgICAgICAgICAgICAgICBvblJlYWR5KCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXRyeUNvdW50IDwgbWF4UmV0cmllcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hRGF0YV0g562J5b6F6K6k6K+BLi4uIOmHjeivleasoeaVsDpcIiwgcmV0cnlDb3VudCk7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQodHJ5QXV0aCwgcmV0cnlJbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g562J5b6F6LaF5pe2XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCfj5/vuI8gW0FyZW5hRGF0YV0g562J5b6FIFdlYlNvY2tldCDorqTor4HotoXml7ZcIik7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCforqTor4HotoXml7bvvIzor7fliLfmlrDpobXpnaLph43or5UnLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzZXRUaW1lb3V0KHRyeUF1dGgsIHJldHJ5SW50ZXJ2YWwpO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkVdlYlNvY2tldCDmnKrov57mjqXml7bvvIzoh6rliqjnrYnlvoXov57mjqXlrozmiJDlkI7ph43or5VcbiAgICAgICAgaWYgKCFzb2NrZXRDdHJJbnN0YW5jZS5pc0Nvbm5lY3RlZCgpIHx8ICFzb2NrZXRDdHJJbnN0YW5jZS5pc1dlYlNvY2tldE9wZW4oKSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYURhdGFdIFdlYlNvY2tldCDmnKrov57mjqXvvIznrYnlvoXov57mjqXlrozmiJDlkI7ph43or5UuLi5cIik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpuato+WcqOi/nuaOpeS4rVxuICAgICAgICAgICAgdmFyIGNvbm5lY3Rpb25TdGF0ZSA9IHNvY2tldEN0ckluc3RhbmNlLmdldENvbm5lY3Rpb25TdGF0ZSA/IHNvY2tldEN0ckluc3RhbmNlLmdldENvbm5lY3Rpb25TdGF0ZSgpIDogXCJ1bmtub3duXCI7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hRGF0YV0g5b2T5YmN6L+e5o6l54q25oCBOlwiLCBjb25uZWN0aW9uU3RhdGUpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvblN0YXRlID09PSBcImNvbm5lY3RpbmdcIikge1xuICAgICAgICAgICAgICAgIC8vIOato+WcqOi/nuaOpeS4re+8jOetieW+hei/nuaOpeWujOaIkOWQjuiHquWKqOmHjeivlVxuICAgICAgICAgICAgICAgIHZhciByZXRyeUNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgbWF4UmV0cmllcyA9IDEwOyAvLyDmnIDlpJrnrYnlvoUgNSDnp5LvvIjmr4/mrKEgNTAwbXPvvIlcbiAgICAgICAgICAgICAgICB2YXIgcmV0cnlJbnRlcnZhbCA9IDUwMDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgdHJ5U2lnbnVwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHJ5Q291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNvY2tldEN0ckluc3RhbmNlLmlzQ29ubmVjdGVkKCkgJiYgc29ja2V0Q3RySW5zdGFuY2UuaXNXZWJTb2NrZXRPcGVuKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFEYXRhXSBXZWJTb2NrZXQg5bey6L+e5o6l77yM562J5b6F6K6k6K+B5a6M5oiQXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkei/nuaOpeaIkOWKn+WQju+8jOi/mOmcgOimgeetieW+heiupOivgeWujOaIkFxuICAgICAgICAgICAgICAgICAgICAgICAgd2FpdEZvckF1dGgoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fZG9TaWdudXAoc29ja2V0Q3RySW5zdGFuY2UsIHJvb21JZCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmV0cnlDb3VudCA8IG1heFJldHJpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFEYXRhXSDnrYnlvoXov57mjqUuLi4g6YeN6K+V5qyh5pWwOlwiLCByZXRyeUNvdW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQodHJ5U2lnbnVwLCByZXRyeUludGVydmFsKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOetieW+hei2heaXtlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+Pn++4jyBbQXJlbmFEYXRhXSDnrYnlvoUgV2ViU29ja2V0IOi/nuaOpei2heaXtlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCfov57mjqXotoXml7bvvIzor7fnqI3lkI7ph43or5UnLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCh0cnlTaWdudXAsIHJldHJ5SW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8g5pyq5Zyo6L+e5o6l5Lit77yM5bCd6K+V5Yid5aeL5YyW6L+e5o6lXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYURhdGFdIFdlYlNvY2tldCDmnKrov57mjqXvvIzlsJ3or5XliJ3lp4vljJbov57mjqUuLi5cIik7XG4gICAgICAgICAgICAgICAgaWYgKHNvY2tldEN0ckluc3RhbmNlLmluaXRTb2NrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgc29ja2V0Q3RySW5zdGFuY2UuaW5pdFNvY2tldCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDnrYnlvoXov57mjqXlrozmiJDlkI7ph43or5VcbiAgICAgICAgICAgICAgICB2YXIgcmV0cnlDb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIG1heFJldHJpZXMgPSAxMDtcbiAgICAgICAgICAgICAgICB2YXIgcmV0cnlJbnRlcnZhbCA9IDUwMDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgdHJ5U2lnbnVwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHJ5Q291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNvY2tldEN0ckluc3RhbmNlLmlzQ29ubmVjdGVkKCkgJiYgc29ja2V0Q3RySW5zdGFuY2UuaXNXZWJTb2NrZXRPcGVuKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFEYXRhXSBXZWJTb2NrZXQg5bey6L+e5o6l77yM562J5b6F6K6k6K+B5a6M5oiQXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkei/nuaOpeaIkOWKn+WQju+8jOi/mOmcgOimgeetieW+heiupOivgeWujOaIkFxuICAgICAgICAgICAgICAgICAgICAgICAgd2FpdEZvckF1dGgoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fZG9TaWdudXAoc29ja2V0Q3RySW5zdGFuY2UsIHJvb21JZCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmV0cnlDb3VudCA8IG1heFJldHJpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQodHJ5U2lnbnVwLCByZXRyeUludGVydmFsKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCfov57mjqXotoXml7bvvIzor7fnqI3lkI7ph43or5UnLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCh0cnlTaWdudXAsIHJldHJ5SW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkVdlYlNvY2tldCDlt7Lov57mjqXvvIzkvYbpnIDopoHnrYnlvoXorqTor4HlrozmiJBcbiAgICAgICAgd2FpdEZvckF1dGgoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGF0Ll9kb1NpZ251cChzb2NrZXRDdHJJbnN0YW5jZSwgcm9vbUlkLCBjYWxsYmFjayk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICog5omn6KGM5oql5ZCN6K+35rGC77yI5YaF6YOo5pa55rOV77yJXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNvY2tldEN0ckluc3RhbmNlIC0gV2ViU29ja2V0IOWunuS+i1xuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb29tSWQgLSDnq57mioDlnLrmiL/pl7RJRFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0g5Zue6LCD5Ye95pWwXG4gICAgICovXG4gICAgdGhhdC5fZG9TaWdudXAgPSBmdW5jdGlvbihzb2NrZXRDdHJJbnN0YW5jZSwgcm9vbUlkLCBjYWxsYmFjaykge1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYURhdGFdIOmAmui/hyBXZWJTb2NrZXQg5Y+R6YCB5oql5ZCN6K+35rGCLCByb29tSWQ6XCIsIHJvb21JZCk7XG4gICAgICAgIFxuICAgICAgICAvLyDmoIforrDmmK/lkKblt7Llk43lupTvvIjpmLLmraLph43lpI3lm57osIPvvIlcbiAgICAgICAgdmFyIHJlc3BvbmRlZCA9IGZhbHNlO1xuICAgICAgICB2YXIgdGltZW91dElkID0gbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8vIOa4heeQhuWHveaVsO+8iOenu+mZpOebkeWQrOWZqOWSjOi2heaXtu+8iVxuICAgICAgICB2YXIgY2xlYW51cCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHRpbWVvdXRJZCkgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICAgICAgICAvLyDnp7vpmaTnm5HlkKzlmajvvIzpmLLmraLlhoXlrZjms4TmvI9cbiAgICAgICAgICAgIHNvY2tldEN0ckluc3RhbmNlLm9mZkFyZW5hU2lnbnVwU3VjY2VzcyhzdWNjZXNzSGFuZGxlcik7XG4gICAgICAgICAgICBzb2NrZXRDdHJJbnN0YW5jZS5vZmZBcmVuYVNpZ251cEZhaWxlZChmYWlsZWRIYW5kbGVyKTtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIC8vIOaIkOWKn+Wbnuiwg1xuICAgICAgICB2YXIgc3VjY2Vzc0hhbmRsZXIgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBpZiAocmVzcG9uZGVkKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoZGF0YS5yb29tX2lkICE9PSByb29tSWQpIHJldHVybjsgLy8g5LiN5piv5b2T5YmN5oi/6Ze055qE5ZON5bqUXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJlc3BvbmRlZCA9IHRydWU7XG4gICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOiusOW9leaKpeWQjeaIkOWKn1xuICAgICAgICAgICAgdmFyIGFyZW5hQ29uZmlnID0gdGhhdC5fYXJlbmFEZXRhaWxzW3Jvb21JZF0gfHwge307XG4gICAgICAgICAgICB0aGF0Ll9zaWduZWRVcEFyZW5hc1tyb29tSWRdID0ge1xuICAgICAgICAgICAgICAgIHNpZ251cFRpbWU6IGRhdGEuc2lnbnVwX3RpbWUgfHwgRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdzaWduZWRfdXAnLFxuICAgICAgICAgICAgICAgIGFyZW5hQ29uZmlnOiBhcmVuYUNvbmZpZyxcbiAgICAgICAgICAgICAgICBwZXJpb2RObzogZGF0YS5wZXJpb2Rfbm8sXG4gICAgICAgICAgICAgICAgc2lnbnVwRmVlOiBkYXRhLnNpZ251cF9mZWVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOS/neWtmOWIsOacrOWcsOWtmOWCqFxuICAgICAgICAgICAgdGhhdC5zYXZlVG9Mb2NhbCgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmm7TmlrDnjqnlrrbnq57mioDluIHkvZnpop1cbiAgICAgICAgICAgIGlmICh3aW5kb3cubXlnbG9iYWwgJiYgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEgJiYgZGF0YS5iYWxhbmNlX2FmdGVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5hcmVuYV9jb2luID0gZGF0YS5iYWxhbmNlX2FmdGVyO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnNhdmVUb0xvY2FsKCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeinpuWPkeWFqOWxgOS6i+S7tu+8jOmAmuefpeWkp+WOheWIt+aWsFVJXG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5teWdsb2JhbC5ldmVudGxpc3Rlcikge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwuZXZlbnRsaXN0ZXIuZmlyZSgnYXJlbmFfY29pbl91cGRhdGVkJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJlbmFfY29pbjogZGF0YS5iYWxhbmNlX2FmdGVyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6YCa55+l54q25oCB5Y+Y5pu0XG4gICAgICAgICAgICB0aGF0Ll9ub3RpZnlTdGF0dXNDaGFuZ2Uocm9vbUlkLCAnc2lnbmVkX3VwJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKG51bGwsIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICfmiqXlkI3miJDlip8nLFxuICAgICAgICAgICAgICAgIHBlcmlvZF9ubzogZGF0YS5wZXJpb2Rfbm8sXG4gICAgICAgICAgICAgICAgc2lnbnVwX2ZlZTogZGF0YS5zaWdudXBfZmVlLFxuICAgICAgICAgICAgICAgIGJhbGFuY2VfYWZ0ZXI6IGRhdGEuYmFsYW5jZV9hZnRlclxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyDlpLHotKXlm57osINcbiAgICAgICAgdmFyIGZhaWxlZEhhbmRsZXIgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBpZiAocmVzcG9uZGVkKSByZXR1cm47XG4gICAgICAgICAgICByZXNwb25kZWQgPSB0cnVlO1xuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soZGF0YS5tZXNzYWdlIHx8ICfmiqXlkI3lpLHotKUnLCBudWxsKTtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIC8vIOazqOWGjOebkeWQrFxuICAgICAgICBzb2NrZXRDdHJJbnN0YW5jZS5vbkFyZW5hU2lnbnVwU3VjY2VzcyhzdWNjZXNzSGFuZGxlcik7XG4gICAgICAgIHNvY2tldEN0ckluc3RhbmNlLm9uQXJlbmFTaWdudXBGYWlsZWQoZmFpbGVkSGFuZGxlcik7XG4gICAgICAgIFxuICAgICAgICAvLyDorr7nva7otoXml7bvvIgxMOenku+8iVxuICAgICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHJlc3BvbmRlZCkgcmV0dXJuO1xuICAgICAgICAgICAgcmVzcG9uZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCfmiqXlkI3or7fmsYLotoXml7bvvIzor7fph43or5UnLCBudWxsKTtcbiAgICAgICAgfSwgMTAwMDApO1xuICAgICAgICBcbiAgICAgICAgLy8g5Y+R6YCB5oql5ZCN6K+35rGCXG4gICAgICAgIHNvY2tldEN0ckluc3RhbmNlLnNlbmRBcmVuYVNpZ251cCh7IHJvb21faWQ6IHJvb21JZCB9KTtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOWPlua2iOaKpeWQje+8iOS9v+eUqCBXZWJTb2NrZXQg5oyH5Luk77yJXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHJvb21JZCAtIOernuaKgOWcuuaIv+mXtElEXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSDlm57osIPlh73mlbAgKGVyciwgcmVzdWx0KVxuICAgICAqL1xuICAgIHRoYXQuY2FuY2VsU2lnbnVwID0gZnVuY3Rpb24ocm9vbUlkLCBjYWxsYmFjaykge1xuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55SoIG15Z2xvYmFsLnNvY2tldCDojrflj5blt7Lov57mjqXnmoTlrp7kvovvvIzogIzkuI3mmK/mr4/mrKHliJvlu7rmlrDlrp7kvotcbiAgICAgICAgdmFyIHNvY2tldEN0ckluc3RhbmNlID0gd2luZG93Lm15Z2xvYmFsICYmIHdpbmRvdy5teWdsb2JhbC5zb2NrZXQgPyB3aW5kb3cubXlnbG9iYWwuc29ja2V0IDogbnVsbDtcbiAgICAgICAgaWYgKCFzb2NrZXRDdHJJbnN0YW5jZSkge1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soJ1dlYlNvY2tldOacquWIneWni+WMlu+8jOivt+WIt+aWsOmhtemdoumHjeivlScsIG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmo4Dmn6UgV2ViU29ja2V0IOi/nuaOpeeKtuaAgVxuICAgICAgICBpZiAoIXNvY2tldEN0ckluc3RhbmNlLmlzQ29ubmVjdGVkIHx8IHR5cGVvZiBzb2NrZXRDdHJJbnN0YW5jZS5pc0Nvbm5lY3RlZCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfj5/vuI8gW0FyZW5hRGF0YV0gc29ja2V0Q3RyLmlzQ29ubmVjdGVkIOS4jeaYr+WHveaVsFwiKTtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCdXZWJTb2NrZXTov57mjqXnirbmgIHlvILluLjvvIzor7fliLfmlrDpobXpnaLph43or5UnLCBudWxsKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkVdlYlNvY2tldCDmnKrov57mjqXml7bvvIzoh6rliqjnrYnlvoXov57mjqXlrozmiJDlkI7ph43or5VcbiAgICAgICAgaWYgKCFzb2NrZXRDdHJJbnN0YW5jZS5pc0Nvbm5lY3RlZCgpIHx8ICFzb2NrZXRDdHJJbnN0YW5jZS5pc1dlYlNvY2tldE9wZW4oKSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYURhdGFdIFdlYlNvY2tldCDmnKrov57mjqXvvIznrYnlvoXov57mjqXlrozmiJDlkI7ph43or5UuLi5cIik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBjb25uZWN0aW9uU3RhdGUgPSBzb2NrZXRDdHJJbnN0YW5jZS5nZXRDb25uZWN0aW9uU3RhdGUgPyBzb2NrZXRDdHJJbnN0YW5jZS5nZXRDb25uZWN0aW9uU3RhdGUoKSA6IFwidW5rbm93blwiO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvblN0YXRlID09PSBcImNvbm5lY3RpbmdcIikge1xuICAgICAgICAgICAgICAgIHZhciByZXRyeUNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgbWF4UmV0cmllcyA9IDEwO1xuICAgICAgICAgICAgICAgIHZhciByZXRyeUludGVydmFsID0gNTAwO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciB0cnlDYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0cnlDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc29ja2V0Q3RySW5zdGFuY2UuaXNDb25uZWN0ZWQoKSAmJiBzb2NrZXRDdHJJbnN0YW5jZS5pc1dlYlNvY2tldE9wZW4oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fZG9DYW5jZWxTaWdudXAoc29ja2V0Q3RySW5zdGFuY2UsIHJvb21JZCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJldHJ5Q291bnQgPCBtYXhSZXRyaWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KHRyeUNhbmNlbCwgcmV0cnlJbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygn6L+e5o6l6LaF5pe277yM6K+356iN5ZCO6YeN6K+VJywgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQodHJ5Q2FuY2VsLCByZXRyeUludGVydmFsKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChzb2NrZXRDdHJJbnN0YW5jZS5pbml0U29ja2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHNvY2tldEN0ckluc3RhbmNlLmluaXRTb2NrZXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHJldHJ5Q291bnQgPSAwO1xuICAgICAgICAgICAgICAgIHZhciBtYXhSZXRyaWVzID0gMTA7XG4gICAgICAgICAgICAgICAgdmFyIHJldHJ5SW50ZXJ2YWwgPSA1MDA7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHRyeUNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICByZXRyeUNvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzb2NrZXRDdHJJbnN0YW5jZS5pc0Nvbm5lY3RlZCgpICYmIHNvY2tldEN0ckluc3RhbmNlLmlzV2ViU29ja2V0T3BlbigpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9kb0NhbmNlbFNpZ251cChzb2NrZXRDdHJJbnN0YW5jZSwgcm9vbUlkLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmV0cnlDb3VudCA8IG1heFJldHJpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQodHJ5Q2FuY2VsLCByZXRyeUludGVydmFsKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCfov57mjqXotoXml7bvvIzor7fnqI3lkI7ph43or5UnLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCh0cnlDYW5jZWwsIHJldHJ5SW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gV2ViU29ja2V0IOW3sui/nuaOpe+8jOebtOaOpeaJp+ihjFxuICAgICAgICB0aGF0Ll9kb0NhbmNlbFNpZ251cChzb2NrZXRDdHJJbnN0YW5jZSwgcm9vbUlkLCBjYWxsYmFjayk7XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDmiafooYzlj5bmtojmiqXlkI3or7fmsYLvvIjlhoXpg6jmlrnms5XvvIlcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc29ja2V0Q3RySW5zdGFuY2UgLSBXZWJTb2NrZXQg5a6e5L6LXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHJvb21JZCAtIOernuaKgOWcuuaIv+mXtElEXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSDlm57osIPlh73mlbBcbiAgICAgKi9cbiAgICB0aGF0Ll9kb0NhbmNlbFNpZ251cCA9IGZ1bmN0aW9uKHNvY2tldEN0ckluc3RhbmNlLCByb29tSWQsIGNhbGxiYWNrKSB7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hRGF0YV0g6YCa6L+HIFdlYlNvY2tldCDlj5HpgIHlj5bmtojmiqXlkI3or7fmsYIsIHJvb21JZDpcIiwgcm9vbUlkKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOagh+iusOaYr+WQpuW3suWTjeW6lO+8iOmYsuatoumHjeWkjeWbnuiwg++8iVxuICAgICAgICB2YXIgcmVzcG9uZGVkID0gZmFsc2U7XG4gICAgICAgIHZhciB0aW1lb3V0SWQgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgLy8g5riF55CG5Ye95pWw77yI56e76Zmk55uR5ZCs5Zmo5ZKM6LaF5pe277yJXG4gICAgICAgIHZhciBjbGVhbnVwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGltZW91dElkKSBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgICAgIC8vIOenu+mZpOebkeWQrOWZqO+8jOmYsuatouWGheWtmOazhOa8j1xuICAgICAgICAgICAgc29ja2V0Q3RySW5zdGFuY2Uub2ZmQXJlbmFDYW5jZWxTdWNjZXNzKHN1Y2Nlc3NIYW5kbGVyKTtcbiAgICAgICAgICAgIHNvY2tldEN0ckluc3RhbmNlLm9mZkFyZW5hQ2FuY2VsRmFpbGVkKGZhaWxlZEhhbmRsZXIpO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLy8g5oiQ5Yqf5Zue6LCDXG4gICAgICAgIHZhciBzdWNjZXNzSGFuZGxlciA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChyZXNwb25kZWQpIHJldHVybjtcbiAgICAgICAgICAgIGlmIChkYXRhLnJvb21faWQgIT09IHJvb21JZCkgcmV0dXJuOyAvLyDkuI3mmK/lvZPliY3miL/pl7TnmoTlk43lupRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmVzcG9uZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5riF6Zmk5oql5ZCN6K6w5b2VXG4gICAgICAgICAgICBkZWxldGUgdGhhdC5fc2lnbmVkVXBBcmVuYXNbcm9vbUlkXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5L+d5a2Y5Yiw5pys5Zyw5a2Y5YKoXG4gICAgICAgICAgICB0aGF0LnNhdmVUb0xvY2FsKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOabtOaWsOeOqeWutuernuaKgOW4geS9meminVxuICAgICAgICAgICAgaWYgKHdpbmRvdy5teWdsb2JhbCAmJiB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YSAmJiBkYXRhLmJhbGFuY2VfYWZ0ZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLmFyZW5hX2NvaW4gPSBkYXRhLmJhbGFuY2VfYWZ0ZXI7XG4gICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuc2F2ZVRvTG9jYWwoKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR6Kem5Y+R5YWo5bGA5LqL5Lu277yM6YCa55+l5aSn5Y6F5Yi35pawVUlcbiAgICAgICAgICAgICAgICBpZiAod2luZG93Lm15Z2xvYmFsLmV2ZW50bGlzdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5ldmVudGxpc3Rlci5maXJlKCdhcmVuYV9jb2luX3VwZGF0ZWQnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmVuYV9jb2luOiBkYXRhLmJhbGFuY2VfYWZ0ZXJcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmuIXpmaTlgJLorqHml7blrprml7blmahcbiAgICAgICAgICAgIGlmICh0aGF0Ll9jb3VudGRvd25UaW1lcnNbcm9vbUlkXSkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhhdC5fY291bnRkb3duVGltZXJzW3Jvb21JZF0pO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGF0Ll9jb3VudGRvd25UaW1lcnNbcm9vbUlkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6YCa55+l54q25oCB5Y+Y5pu0XG4gICAgICAgICAgICB0aGF0Ll9ub3RpZnlTdGF0dXNDaGFuZ2Uocm9vbUlkLCAnY2FuY2VsbGVkJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKG51bGwsIHsgXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSwgXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ+WPlua2iOaKpeWQjeaIkOWKnycsXG4gICAgICAgICAgICAgICAgcmVmdW5kX2Ftb3VudDogZGF0YS5yZWZ1bmRfYW1vdW50LFxuICAgICAgICAgICAgICAgIGJhbGFuY2VfYWZ0ZXI6IGRhdGEuYmFsYW5jZV9hZnRlclxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyDlpLHotKXlm57osINcbiAgICAgICAgdmFyIGZhaWxlZEhhbmRsZXIgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBpZiAocmVzcG9uZGVkKSByZXR1cm47XG4gICAgICAgICAgICByZXNwb25kZWQgPSB0cnVlO1xuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soZGF0YS5tZXNzYWdlIHx8ICflj5bmtojmiqXlkI3lpLHotKUnLCBudWxsKTtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIC8vIOazqOWGjOebkeWQrFxuICAgICAgICBzb2NrZXRDdHJJbnN0YW5jZS5vbkFyZW5hQ2FuY2VsU3VjY2VzcyhzdWNjZXNzSGFuZGxlcik7XG4gICAgICAgIHNvY2tldEN0ckluc3RhbmNlLm9uQXJlbmFDYW5jZWxGYWlsZWQoZmFpbGVkSGFuZGxlcik7XG4gICAgICAgIFxuICAgICAgICAvLyDorr7nva7otoXml7bvvIgxMOenku+8iVxuICAgICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHJlc3BvbmRlZCkgcmV0dXJuO1xuICAgICAgICAgICAgcmVzcG9uZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCflj5bmtojmiqXlkI3or7fmsYLotoXml7bvvIzor7fph43or5UnLCBudWxsKTtcbiAgICAgICAgfSwgMTAwMDApO1xuICAgICAgICBcbiAgICAgICAgLy8g5Y+R6YCB5Y+W5raI5oql5ZCN6K+35rGCXG4gICAgICAgIHNvY2tldEN0ckluc3RhbmNlLnNlbmRBcmVuYUNhbmNlbFNpZ251cCh7IHJvb21faWQ6IHJvb21JZCB9KTtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOiOt+WPluW3suaKpeWQjeeKtuaAgVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb29tSWQgLSDnq57mioDlnLrmiL/pl7RJRFxuICAgICAqIEByZXR1cm5zIHtPYmplY3R8bnVsbH0g5oql5ZCN5L+h5oGv5oiWbnVsbFxuICAgICAqL1xuICAgIHRoYXQuZ2V0U2lnbnVwU3RhdHVzID0gZnVuY3Rpb24ocm9vbUlkKSB7XG4gICAgICAgIHJldHVybiB0aGF0Ll9zaWduZWRVcEFyZW5hc1tyb29tSWRdIHx8IG51bGw7XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDmo4Dmn6XmmK/lkKblt7LmiqXlkI1cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gcm9vbUlkIC0g56ue5oqA5Zy65oi/6Ze0SURcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICB0aGF0LmlzU2lnbmVkVXAgPSBmdW5jdGlvbihyb29tSWQpIHtcbiAgICAgICAgcmV0dXJuICEhdGhhdC5fc2lnbmVkVXBBcmVuYXNbcm9vbUlkXTtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOiOt+WPluW8gOi1m+WAkuiuoeaXtu+8iOenku+8iVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb29tSWQgLSDnq57mioDlnLrmiL/pl7RJRFxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9IOWAkuiuoeaXtuenkuaVsO+8jC0x6KGo56S65pyq5oql5ZCN5oiW5peg5YCS6K6h5pe2XG4gICAgICovXG4gICAgdGhhdC5nZXRDb3VudGRvd24gPSBmdW5jdGlvbihyb29tSWQpIHtcbiAgICAgICAgdmFyIHNpZ251cCA9IHRoYXQuX3NpZ25lZFVwQXJlbmFzW3Jvb21JZF07XG4gICAgICAgIGlmICghc2lnbnVwIHx8ICFzaWdudXAuY291bnRkb3duRW5kKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICB2YXIgcmVtYWluaW5nID0gTWF0aC5mbG9vcigoc2lnbnVwLmNvdW50ZG93bkVuZCAtIG5vdykgLyAxMDAwKTtcbiAgICAgICAgcmV0dXJuIHJlbWFpbmluZyA+IDAgPyByZW1haW5pbmcgOiAwO1xuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICog5qC85byP5YyW5YCS6K6h5pe25pi+56S6XG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHNlY29uZHMgLSDnp5LmlbBcbiAgICAgKiBAcmV0dXJucyB7U3RyaW5nfSDmoLzlvI/ljJblkI7nmoTml7bpl7TlrZfnrKbkuLJcbiAgICAgKi9cbiAgICB0aGF0LmZvcm1hdENvdW50ZG93biA9IGZ1bmN0aW9uKHNlY29uZHMpIHtcbiAgICAgICAgaWYgKHNlY29uZHMgPCAwKSByZXR1cm4gJyc7XG4gICAgICAgIGlmIChzZWNvbmRzID09PSAwKSByZXR1cm4gJ+WNs+WwhuW8gOi1myc7XG4gICAgICAgIFxuICAgICAgICB2YXIgaG91cnMgPSBNYXRoLmZsb29yKHNlY29uZHMgLyAzNjAwKTtcbiAgICAgICAgdmFyIG1pbnV0ZXMgPSBNYXRoLmZsb29yKChzZWNvbmRzICUgMzYwMCkgLyA2MCk7XG4gICAgICAgIHZhciBzZWNzID0gc2Vjb25kcyAlIDYwO1xuICAgICAgICBcbiAgICAgICAgaWYgKGhvdXJzID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGhvdXJzICsgJzonICsgKG1pbnV0ZXMgPCAxMCA/ICcwJyA6ICcnKSArIG1pbnV0ZXMgKyAnOicgKyAoc2VjcyA8IDEwID8gJzAnIDogJycpICsgc2VjcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAobWludXRlcyA8IDEwID8gJzAnIDogJycpICsgbWludXRlcyArICc6JyArIChzZWNzIDwgMTAgPyAnMCcgOiAnJykgKyBzZWNzO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDojrflj5bnq57mioDlnLrphY3nva5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gcm9vbUlkIC0g56ue5oqA5Zy65oi/6Ze0SURcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fG51bGx9XG4gICAgICovXG4gICAgdGhhdC5nZXRBcmVuYUNvbmZpZyA9IGZ1bmN0aW9uKHJvb21JZCkge1xuICAgICAgICByZXR1cm4gdGhhdC5fYXJlbmFEZXRhaWxzW3Jvb21JZF0gfHwgbnVsbDtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOiOt+WPluaKpeWQjei0uVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb29tQ29uZmlnIC0g5oi/6Ze06YWN572uXG4gICAgICogQHJldHVybnMge051bWJlcn0g5oql5ZCN6LS577yI56ue5oqA5biB77yJXG4gICAgICovXG4gICAgdGhhdC5nZXRTaWdudXBGZWUgPSBmdW5jdGlvbihyb29tQ29uZmlnKSB7XG4gICAgICAgIHJldHVybiByb29tQ29uZmlnLnNpZ251cF9mZWUgfHwgcm9vbUNvbmZpZy5zaWdudXBGZWUgfHwgMDtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOiOt+WPluWGoOWGm+WlluWKsemihOiniFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb29tQ29uZmlnIC0g5oi/6Ze06YWN572uXG4gICAgICogQHJldHVybnMge09iamVjdH0geyBjb2luczogTnVtYmVyLCBpdGVtczogQXJyYXkgfVxuICAgICAqL1xuICAgIHRoYXQuZ2V0Q2hhbXBpb25SZXdhcmQgPSBmdW5jdGlvbihyb29tQ29uZmlnKSB7XG4gICAgICAgIHJldHVybiByb29tQ29uZmlnLmNoYW1waW9uX3Jld2FyZCB8fCByb29tQ29uZmlnLmNoYW1waW9uUmV3YXJkIHx8IHsgY29pbnM6IDAsIGl0ZW1zOiBbXSB9O1xuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICog6KeC55yL5bm/5ZGK6I635Y+W5aWW5YqxXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgLSDlpZblirHnsbvlnosgKCdnb2xkJyDmiJYgJ2FyZW5hX2NvaW4nKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0g5Zue6LCD5Ye95pWwIChlcnIsIHJlc3VsdClcbiAgICAgKi9cbiAgICB0aGF0LndhdGNoQWRGb3JSZXdhcmQgPSBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgYXBpVXJsID0gd2luZG93LmRlZmluZXMgPyB3aW5kb3cuZGVmaW5lcy5hcGlVcmwgOiAnJztcbiAgICAgICAgdmFyIGNyeXB0b0tleSA9IHdpbmRvdy5kZWZpbmVzID8gd2luZG93LmRlZmluZXMuY3J5cHRvS2V5IDogJyc7XG4gICAgICAgIHZhciB0b2tlbiA9IHdpbmRvdy5teWdsb2JhbCAmJiB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YSA/IHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnRva2VuIDogJyc7XG4gICAgICAgIFxuICAgICAgICBpZiAoIWFwaVVybCB8fCAhd2luZG93Lkh0dHBBUEkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCdBUEnmnKrphY3nva4nLCBudWxsKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIHJlcXVlc3REYXRhID0ge1xuICAgICAgICAgICAgdG9rZW46IHRva2VuLFxuICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgIGFkX3R5cGU6ICdyZXdhcmRfdmlkZW8nXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBIdHRwQVBJLnBvc3QoXG4gICAgICAgICAgICBhcGlVcmwgKyAnL2FwaS9hZC9yZXdhcmQnLFxuICAgICAgICAgICAgcmVxdWVzdERhdGEsXG4gICAgICAgICAgICBjcnlwdG9LZXksXG4gICAgICAgICAgICBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICYmIChyZXN1bHQuY29kZSA9PT0gMCB8fCByZXN1bHQuc3VjY2VzcykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5pu05paw546p5a625pWw5o2uXG4gICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cubXlnbG9iYWwgJiYgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZGF0YS5nb2xkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLmdvYmFsX2NvdW50ID0gcmVzdWx0LmRhdGEuZ29sZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kYXRhLmFyZW5hX2NvaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYXJlbmFfY29pbiA9IHJlc3VsdC5kYXRhLmFyZW5hX2NvaW47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnNhdmVUb0xvY2FsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXdhcmQ6IHJlc3VsdC5kYXRhIHx8IHt9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHJlc3VsdCA/IHJlc3VsdC5tZXNzYWdlIDogJ+iOt+WPluWlluWKseWksei0pScsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOWIt+aWsOeOqeWutui0p+W4geS9meminVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0g5Zue6LCD5Ye95pWwIChlcnIsIGRhdGEpXG4gICAgICovXG4gICAgdGhhdC5yZWZyZXNoQmFsYW5jZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBhcGlVcmwgPSB3aW5kb3cuZGVmaW5lcyA/IHdpbmRvdy5kZWZpbmVzLmFwaVVybCA6ICcnO1xuICAgICAgICB2YXIgY3J5cHRvS2V5ID0gd2luZG93LmRlZmluZXMgPyB3aW5kb3cuZGVmaW5lcy5jcnlwdG9LZXkgOiAnJztcbiAgICAgICAgdmFyIHRva2VuID0gd2luZG93Lm15Z2xvYmFsICYmIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhID8gd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEudG9rZW4gOiAnJztcbiAgICAgICAgXG4gICAgICAgIGlmICghYXBpVXJsIHx8ICF3aW5kb3cuSHR0cEFQSSkge1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soJ0FQSeacqumFjee9ricsIG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBIdHRwQVBJLmdldChcbiAgICAgICAgICAgIGFwaVVybCArICcvYXBpL3YxL3BsYXllci9iYWxhbmNlP3Rva2VuPScgKyBlbmNvZGVVUklDb21wb25lbnQodG9rZW4pLFxuICAgICAgICAgICAgY3J5cHRvS2V5LFxuICAgICAgICAgICAgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiAocmVzdWx0LmNvZGUgPT09IDAgfHwgcmVzdWx0LmRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gcmVzdWx0LmRhdGEgfHwgcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5pu05paw546p5a625pWw5o2uXG4gICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cubXlnbG9iYWwgJiYgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLmdvbGQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLmdvYmFsX2NvdW50ID0gZGF0YS5nb2xkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuYXJlbmFfY29pbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYXJlbmFfY29pbiA9IGRhdGEuYXJlbmFfY29pbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnNhdmVUb0xvY2FsKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKG51bGwsIGRhdGEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHJlc3VsdCA/IHJlc3VsdC5tZXNzYWdlIDogJ+iOt+WPluS9memineWksei0pScsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9O1xuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09IOeKtuaAgeebkeWQrCA9PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIOa3u+WKoOeKtuaAgeWPmOabtOebkeWQrOWZqFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIC0g55uR5ZCs5Ye95pWwIChyb29tSWQsIHN0YXR1cylcbiAgICAgKi9cbiAgICB0aGF0LmFkZFN0YXR1c0xpc3RlbmVyID0gZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgdGhhdC5fc3RhdHVzTGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICog56e76Zmk54q25oCB5Y+Y5pu055uR5ZCs5ZmoXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgLSDnm5HlkKzlh73mlbBcbiAgICAgKi9cbiAgICB0aGF0LnJlbW92ZVN0YXR1c0xpc3RlbmVyID0gZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdGhhdC5fc3RhdHVzTGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhhdC5fc3RhdHVzTGlzdGVuZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOmAmuefpeeKtuaAgeWPmOabtFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb29tSWQgLSDmiL/pl7RJRFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdGF0dXMgLSDmlrDnirbmgIFcbiAgICAgKi9cbiAgICB0aGF0Ll9ub3RpZnlTdGF0dXNDaGFuZ2UgPSBmdW5jdGlvbihyb29tSWQsIHN0YXR1cykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoYXQuX3N0YXR1c0xpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGF0Ll9zdGF0dXNMaXN0ZW5lcnNbaV0ocm9vbUlkLCBzdGF0dXMpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+eKtuaAgeebkeWQrOWZqOaJp+ihjOmUmeivrzonLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5YCS6K6h5pe2566h55CGID09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLyoqXG4gICAgICog5ZCv5Yqo5YCS6K6h5pe25pu05pawXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHJvb21JZCAtIOaIv+mXtElEXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gb25VcGRhdGUgLSDmm7TmlrDlm57osIMgKHNlY29uZHMpXG4gICAgICovXG4gICAgdGhhdC5zdGFydENvdW50ZG93biA9IGZ1bmN0aW9uKHJvb21JZCwgb25VcGRhdGUpIHtcbiAgICAgICAgLy8g5riF6Zmk5pen55qE5a6a5pe25ZmoXG4gICAgICAgIGlmICh0aGF0Ll9jb3VudGRvd25UaW1lcnNbcm9vbUlkXSkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGF0Ll9jb3VudGRvd25UaW1lcnNbcm9vbUlkXSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoYXQuX2NvdW50ZG93blRpbWVyc1tyb29tSWRdID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc2Vjb25kcyA9IHRoYXQuZ2V0Q291bnRkb3duKHJvb21JZCk7XG4gICAgICAgICAgICBvblVwZGF0ZSAmJiBvblVwZGF0ZShzZWNvbmRzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5YCS6K6h5pe257uT5p2fXG4gICAgICAgICAgICBpZiAoc2Vjb25kcyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGF0Ll9jb3VudGRvd25UaW1lcnNbcm9vbUlkXSk7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoYXQuX2NvdW50ZG93blRpbWVyc1tyb29tSWRdO1xuICAgICAgICAgICAgICAgIHRoYXQuX25vdGlmeVN0YXR1c0NoYW5nZShyb29tSWQsICdzdGFydGluZycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAxMDAwKTtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOWBnOatouWAkuiuoeaXtlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb29tSWQgLSDmiL/pl7RJRFxuICAgICAqL1xuICAgIHRoYXQuc3RvcENvdW50ZG93biA9IGZ1bmN0aW9uKHJvb21JZCkge1xuICAgICAgICBpZiAodGhhdC5fY291bnRkb3duVGltZXJzW3Jvb21JZF0pIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhhdC5fY291bnRkb3duVGltZXJzW3Jvb21JZF0pO1xuICAgICAgICAgICAgZGVsZXRlIHRoYXQuX2NvdW50ZG93blRpbWVyc1tyb29tSWRdO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDmuIXpmaTmiYDmnInlgJLorqHml7ZcbiAgICAgKi9cbiAgICB0aGF0LmNsZWFyQWxsQ291bnRkb3ducyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IgKHZhciByb29tSWQgaW4gdGhhdC5fY291bnRkb3duVGltZXJzKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoYXQuX2NvdW50ZG93blRpbWVyc1tyb29tSWRdKTtcbiAgICAgICAgfVxuICAgICAgICB0aGF0Ll9jb3VudGRvd25UaW1lcnMgPSB7fTtcbiAgICB9O1xuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09IOacrOWcsOWtmOWCqCA9PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIOS/neWtmOaKpeWQjeeKtuaAgeWIsOacrOWcsFxuICAgICAqL1xuICAgIHRoYXQuc2F2ZVRvTG9jYWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgICAgIHNpZ25lZFVwQXJlbmFzOiB0aGF0Ll9zaWduZWRVcEFyZW5hcyxcbiAgICAgICAgICAgICAgICBzYXZlZEF0OiBEYXRlLm5vdygpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FyZW5hX2RhdGEnLCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+S/neWtmOernuaKgOWcuuaVsOaNruWksei0pTonLCBlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICog5LuO5pys5Zyw5Yqg6L295oql5ZCN54q25oCBXG4gICAgICovXG4gICAgdGhhdC5sb2FkRnJvbUxvY2FsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgZGF0YVN0ciA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhcmVuYV9kYXRhJyk7XG4gICAgICAgICAgICBpZiAoZGF0YVN0cikge1xuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gSlNPTi5wYXJzZShkYXRhU3RyKTtcbiAgICAgICAgICAgICAgICAvLyDmo4Dmn6XmlbDmja7mmK/lkKbov4fmnJ/vvIgx5aSp77yJXG4gICAgICAgICAgICAgICAgaWYgKERhdGUubm93KCkgLSAoZGF0YS5zYXZlZEF0IHx8IDApIDwgMjQgKiA2MCAqIDYwICogMTAwMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9zaWduZWRVcEFyZW5hcyA9IGRhdGEuc2lnbmVkVXBBcmVuYXMgfHwge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfliqDovb3nq57mioDlnLrmlbDmja7lpLHotKU6JywgZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHku47mnI3liqHnq6/ojrflj5bmiqXlkI3nirbmgIFcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIOWbnuiwg+WHveaVsCAoZXJyLCBzaWduZWRVcFJvb21zKVxuICAgICAqL1xuICAgIHRoYXQuZmV0Y2hTaWdudXBTdGF0dXNGcm9tU2VydmVyID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGFwaVVybCA9IHdpbmRvdy5kZWZpbmVzID8gd2luZG93LmRlZmluZXMuYXBpVXJsIDogJyc7XG4gICAgICAgIHZhciBjcnlwdG9LZXkgPSB3aW5kb3cuZGVmaW5lcyA/IHdpbmRvdy5kZWZpbmVzLmNyeXB0b0tleSA6ICcnO1xuICAgICAgICB2YXIgdG9rZW4gPSB3aW5kb3cubXlnbG9iYWwgJiYgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEgPyB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS50b2tlbiA6ICcnO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFhcGlVcmwgfHwgIXdpbmRvdy5IdHRwQVBJKSB7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygnQVBJ5pyq6YWN572uJywgbnVsbCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIEh0dHBBUEkuZ2V0KFxuICAgICAgICAgICAgYXBpVXJsICsgJy9hcGkvdjEvYXJlbmEvc2lnbnVwLXN0YXR1cz90b2tlbj0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHRva2VuKSxcbiAgICAgICAgICAgIGNyeXB0b0tleSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+Pn++4jyBbYXJlbmFEYXRhXSDojrflj5bmiqXlkI3nirbmgIHlpLHotKU6XCIsIGVycik7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHNpZ25lZFVwUm9vbXMgPSBbXTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICYmIChyZXN1bHQuY29kZSA9PT0gMCB8fCByZXN1bHQuZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSByZXN1bHQuZGF0YSB8fCByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIHNpZ25lZFVwUm9vbXMgPSBkYXRhLnNpZ25lZF91cF9yb29tcyB8fCBbXTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOabtOaWsOacrOWcsOe8k+WtmFxuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9zaWduZWRVcEFyZW5hcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpZ25lZFVwUm9vbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByb29tID0gc2lnbmVkVXBSb29tc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3NpZ25lZFVwQXJlbmFzW3Jvb20ucm9vbV9pZF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lnbnVwVGltZTogcm9vbS5zaWdudXBfdGltZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6ICdzaWduZWRfdXAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcmlvZE5vOiByb29tLnBlcmlvZF9ubyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWdudXBGZWU6IHJvb20uc2lnbnVwX2ZlZVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5L+d5a2Y5Yiw5pys5ZywXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2F2ZVRvTG9jYWwoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2sobnVsbCwgc2lnbmVkVXBSb29tcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDmuIXpmaTmiYDmnInmiqXlkI3nirbmgIHvvIjnlKjkuo7mtYvor5XmiJbph43nva7vvIlcbiAgICAgKi9cbiAgICB0aGF0LmNsZWFyQWxsU2lnbnVwU3RhdHVzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoYXQuX3NpZ25lZFVwQXJlbmFzID0ge307XG4gICAgICAgIHRoYXQuc2F2ZVRvTG9jYWwoKTtcbiAgICB9O1xuICAgIFxuICAgIC8vIOWIneWni+WMluaXtuWKoOi9veacrOWcsOaVsOaNrlxuICAgIHRoYXQubG9hZEZyb21Mb2NhbCgpO1xuICAgIFxuICAgIHJldHVybiB0aGF0O1xufSgpO1xuIl19