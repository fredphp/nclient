
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
   * 报名竞技场
   * @param {Number} roomId - 竞技场房间ID
   * @param {Function} callback - 回调函数 (err, result)
   */
  that.signup = function (roomId, callback) {
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
    HttpAPI.post(apiUrl + '/api/v1/arena/signup', requestData, cryptoKey, function (err, result) {
      if (err) {
        callback && callback(err, null);
        return;
      }
      if (result && (result.code === 0 || result.success)) {
        var _result$data;
        // 记录报名成功
        var arenaConfig = that._arenaDetails[roomId] || {};
        that._signedUpArenas[roomId] = {
          signupTime: Date.now(),
          status: 'signed_up',
          countdownEnd: result.data ? result.data.start_time : null,
          arenaConfig: arenaConfig,
          periodNo: result.period_no || ((_result$data = result.data) == null ? void 0 : _result$data.period_no)
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
    });
  };

  /**
   * 取消报名
   * @param {Number} roomId - 竞技场房间ID
   * @param {Function} callback - 回调函数 (err, result)
   */
  that.cancelSignup = function (roomId, callback) {
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
    HttpAPI.post(apiUrl + '/api/v1/arena/cancel', requestData, cryptoKey, function (err, result) {
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
        callback && callback(null, {
          success: true,
          message: '取消报名成功'
        });
      } else {
        callback && callback(result ? result.message : '取消报名失败', null);
      }
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
    });
  };

  // ==================== 状态监听 ====================

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
  };

  // ==================== 倒计时管理 ====================

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
  };

  // ==================== 本地存储 ====================

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
    });
  };

  /**
   * 清除所有报名状态（用于测试或重置）
   */
  that.clearAllSignupStatus = function () {
    that._signedUpArenas = {};
    that.saveToLocal();
  };

  // 初始化时加载本地数据
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0c1xcc2NyaXB0c1xcZGF0YVxcYXJlbmFEYXRhLmpzIl0sIm5hbWVzIjpbIndpbmRvdyIsImFyZW5hRGF0YSIsInRoYXQiLCJfc2lnbmVkVXBBcmVuYXMiLCJfYXJlbmFEZXRhaWxzIiwiX2NvdW50ZG93blRpbWVycyIsIl9zdGF0dXNMaXN0ZW5lcnMiLCJnZXRBcmVuYUxpc3QiLCJjYWxsYmFjayIsImFwaVVybCIsImRlZmluZXMiLCJjcnlwdG9LZXkiLCJIdHRwQVBJIiwiZ2V0IiwiZXJyIiwicmVzdWx0IiwiYXJlbmFMaXN0IiwiY29kZSIsImRhdGEiLCJBcnJheSIsImlzQXJyYXkiLCJpIiwibGVuZ3RoIiwiYXJlbmEiLCJpZCIsInNpZ251cCIsInJvb21JZCIsInRva2VuIiwibXlnbG9iYWwiLCJwbGF5ZXJEYXRhIiwicmVxdWVzdERhdGEiLCJyb29tX2lkIiwicG9zdCIsInN1Y2Nlc3MiLCJfcmVzdWx0JGRhdGEiLCJhcmVuYUNvbmZpZyIsInNpZ251cFRpbWUiLCJEYXRlIiwibm93Iiwic3RhdHVzIiwiY291bnRkb3duRW5kIiwic3RhcnRfdGltZSIsInBlcmlvZE5vIiwicGVyaW9kX25vIiwic2F2ZVRvTG9jYWwiLCJfbm90aWZ5U3RhdHVzQ2hhbmdlIiwibWVzc2FnZSIsImNhbmNlbFNpZ251cCIsImNsZWFySW50ZXJ2YWwiLCJnZXRTaWdudXBTdGF0dXMiLCJpc1NpZ25lZFVwIiwiZ2V0Q291bnRkb3duIiwicmVtYWluaW5nIiwiTWF0aCIsImZsb29yIiwiZm9ybWF0Q291bnRkb3duIiwic2Vjb25kcyIsImhvdXJzIiwibWludXRlcyIsInNlY3MiLCJnZXRBcmVuYUNvbmZpZyIsImdldFNpZ251cEZlZSIsInJvb21Db25maWciLCJzaWdudXBfZmVlIiwic2lnbnVwRmVlIiwiZ2V0Q2hhbXBpb25SZXdhcmQiLCJjaGFtcGlvbl9yZXdhcmQiLCJjaGFtcGlvblJld2FyZCIsImNvaW5zIiwiaXRlbXMiLCJ3YXRjaEFkRm9yUmV3YXJkIiwidHlwZSIsImFkX3R5cGUiLCJnb2xkIiwiZ29iYWxfY291bnQiLCJhcmVuYV9jb2luIiwicmV3YXJkIiwicmVmcmVzaEJhbGFuY2UiLCJlbmNvZGVVUklDb21wb25lbnQiLCJ1bmRlZmluZWQiLCJhZGRTdGF0dXNMaXN0ZW5lciIsImxpc3RlbmVyIiwicHVzaCIsInJlbW92ZVN0YXR1c0xpc3RlbmVyIiwiaW5kZXgiLCJpbmRleE9mIiwic3BsaWNlIiwiZSIsImNvbnNvbGUiLCJlcnJvciIsInN0YXJ0Q291bnRkb3duIiwib25VcGRhdGUiLCJzZXRJbnRlcnZhbCIsInN0b3BDb3VudGRvd24iLCJjbGVhckFsbENvdW50ZG93bnMiLCJzaWduZWRVcEFyZW5hcyIsInNhdmVkQXQiLCJsb2NhbFN0b3JhZ2UiLCJzZXRJdGVtIiwiSlNPTiIsInN0cmluZ2lmeSIsImxvYWRGcm9tTG9jYWwiLCJkYXRhU3RyIiwiZ2V0SXRlbSIsInBhcnNlIiwiZmV0Y2hTaWdudXBTdGF0dXNGcm9tU2VydmVyIiwic2lnbmVkVXBSb29tcyIsInNpZ25lZF91cF9yb29tcyIsInJvb20iLCJzaWdudXBfdGltZSIsImNsZWFyQWxsU2lnbnVwU3RhdHVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBQSxNQUFNLENBQUNDLFNBQVMsR0FBRyxZQUFXO0VBQzFCLElBQUlDLElBQUksR0FBRyxDQUFDLENBQUM7O0VBRWI7O0VBRUE7RUFDQUEsSUFBSSxDQUFDQyxlQUFlLEdBQUcsQ0FBQyxDQUFDOztFQUV6QjtFQUNBRCxJQUFJLENBQUNFLGFBQWEsR0FBRyxDQUFDLENBQUM7O0VBRXZCO0VBQ0FGLElBQUksQ0FBQ0csZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDOztFQUUxQjtFQUNBSCxJQUFJLENBQUNJLGdCQUFnQixHQUFHLEVBQUU7O0VBRTFCOztFQUVBO0FBQ0o7QUFDQTtBQUNBO0VBQ0lKLElBQUksQ0FBQ0ssWUFBWSxHQUFH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LENBQUNyRixDQUFDLENBQUM7VUFDM0JuQixJQUFJLENBQUNDLGVBQWUsQ0FBQ3lHLElBQUksQ0FBQzdFLE9BQU8sQ0FBQyxHQUFHO1lBQ2pDSyxVQUFVLEVBQUV3RSxJQUFJLENBQUNDLFdBQVc7WUFDNUJ0RSxNQUFNLEVBQUUsV0FBVztZQUNuQkcsUUFBUSxFQUFFa0UsSUFBSSxDQUFDakUsU0FBUztZQUN4QnFCLFNBQVMsRUFBRTRDLElBQUksQ0FBQzdDO1VBQ3BCLENBQUM7UUFDTDs7UUFFQTtRQUNBN0QsSUFBSSxDQUFDMEMsV0FBVyxFQUFFO01BQ3RCO01BRUFwQyxRQUFRLElBQUlBLFFBQVEsQ0FBQyxJQUFJLEVBQUVrRyxhQUFhLENBQUM7SUFDN0MsQ0FBQyxDQUNKO0VBQ0wsQ0FBQzs7RUFFRDtBQUNKO0FBQ0E7RUFDSXhHLElBQUksQ0FBQzRHLG9CQUFvQixHQUFHLFlBQVc7SUFDbkM1RyxJQUFJLENBQUNDLGVBQWUsR0FBRyxDQUFDLENBQUM7SUFDekJELElBQUksQ0FBQzBDLFdBQVcsRUFBRTtFQUN0QixDQUFDOztFQUVEO0VBQ0ExQyxJQUFJLENBQUNtRyxhQUFhLEVBQUU7RUFFcEIsT0FBT25HLElBQUk7QUFDZixDQUFDLEVBQUUiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICog56ue5oqA5Zy65pWw5o2u566h55CG5qih5Z2XXG4gKiDnlKjkuo7nrqHnkIbnq57mioDlnLrmiqXlkI3jgIHlgJLorqHml7bjgIHlpZblirHnrYnmlbDmja5cbiAqIFxuICog5Yqf6IO977yaXG4gKiAxLiDojrflj5bnq57mioDlnLrmiL/pl7TliJfooahcbiAqIDIuIOaKpeWQjS/lj5bmtojmiqXlkI1cbiAqIDMuIOiOt+WPluW8gOi1m+WAkuiuoeaXtlxuICogNC4g6I635Y+W5bey5oql5ZCN54q25oCBXG4gKi9cblxud2luZG93LmFyZW5hRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciB0aGF0ID0ge307XG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT0g56ue5oqA5Zy654q25oCB5pWw5o2uID09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLy8g5bey5oql5ZCN55qE56ue5oqA5Zy65YiX6KGoIHsgcm9vbUlkOiB7IHNpZ251cFRpbWUsIHN0YXR1cywgY291bnRkb3duRW5kIH0gfVxuICAgIHRoYXQuX3NpZ25lZFVwQXJlbmFzID0ge307XG4gICAgXG4gICAgLy8g56ue5oqA5Zy66K+m5oOF57yT5a2YIHsgcm9vbUlkOiBhcmVuYUNvbmZpZyB9XG4gICAgdGhhdC5fYXJlbmFEZXRhaWxzID0ge307XG4gICAgXG4gICAgLy8g5YCS6K6h5pe25a6a5pe25ZmoXG4gICAgdGhhdC5fY291bnRkb3duVGltZXJzID0ge307XG4gICAgXG4gICAgLy8g54q25oCB5Y+Y5pu055uR5ZCs5ZmoXG4gICAgdGhhdC5fc3RhdHVzTGlzdGVuZXJzID0gW107XG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT0gQVBJIOaWueazlSA9PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIOiOt+WPluernuaKgOWcuuaIv+mXtOWIl+ihqFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0g5Zue6LCD5Ye95pWwIChlcnIsIGFyZW5hTGlzdClcbiAgICAgKi9cbiAgICB0aGF0LmdldEFyZW5hTGlzdCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBhcGlVcmwgPSB3aW5kb3cuZGVmaW5lcyA/IHdpbmRvdy5kZWZpbmVzLmFwaVVybCA6ICcnO1xuICAgICAgICB2YXIgY3J5cHRvS2V5ID0gd2luZG93LmRlZmluZXMgPyB3aW5kb3cuZGVmaW5lcy5jcnlwdG9LZXkgOiAnJztcbiAgICAgICAgXG4gICAgICAgIGlmICghYXBpVXJsIHx8ICF3aW5kb3cuSHR0cEFQSSkge1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soJ0FQSeacqumFjee9ricsIG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBIdHRwQVBJLmdldChcbiAgICAgICAgICAgIGFwaVVybCArICcvYXBpL3YxL2FyZW5hL2xpc3QnLFxuICAgICAgICAgICAgY3J5cHRvS2V5LFxuICAgICAgICAgICAgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIGFyZW5hTGlzdCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuY29kZSA9PT0gMCAmJiByZXN1bHQuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBhcmVuYUxpc3QgPSByZXN1bHQuZGF0YTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdCAmJiBBcnJheS5pc0FycmF5KHJlc3VsdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJlbmFMaXN0ID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoYXJlbmFMaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOe8k+WtmOernuaKgOWcuuivpuaDhVxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZW5hTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFyZW5hID0gYXJlbmFMaXN0W2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5fYXJlbmFEZXRhaWxzW2FyZW5hLmlkXSA9IGFyZW5hO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKG51bGwsIGFyZW5hTGlzdCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soJ+iOt+WPluernuaKgOWcuuWIl+ihqOWksei0pScsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOaKpeWQjeernuaKgOWculxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb29tSWQgLSDnq57mioDlnLrmiL/pl7RJRFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0g5Zue6LCD5Ye95pWwIChlcnIsIHJlc3VsdClcbiAgICAgKi9cbiAgICB0aGF0LnNpZ251cCA9IGZ1bmN0aW9uKHJvb21JZCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGFwaVVybCA9IHdpbmRvdy5kZWZpbmVzID8gd2luZG93LmRlZmluZXMuYXBpVXJsIDogJyc7XG4gICAgICAgIHZhciBjcnlwdG9LZXkgPSB3aW5kb3cuZGVmaW5lcyA/IHdpbmRvdy5kZWZpbmVzLmNyeXB0b0tleSA6ICcnO1xuICAgICAgICB2YXIgdG9rZW4gPSB3aW5kb3cubXlnbG9iYWwgJiYgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEgPyB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS50b2tlbiA6ICcnO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFhcGlVcmwgfHwgIXdpbmRvdy5IdHRwQVBJKSB7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygnQVBJ5pyq6YWN572uJywgbnVsbCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciByZXF1ZXN0RGF0YSA9IHtcbiAgICAgICAgICAgIHJvb21faWQ6IHJvb21JZCxcbiAgICAgICAgICAgIHRva2VuOiB0b2tlblxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgSHR0cEFQSS5wb3N0KFxuICAgICAgICAgICAgYXBpVXJsICsgJy9hcGkvdjEvYXJlbmEvc2lnbnVwJyxcbiAgICAgICAgICAgIHJlcXVlc3REYXRhLFxuICAgICAgICAgICAgY3J5cHRvS2V5LFxuICAgICAgICAgICAgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiAocmVzdWx0LmNvZGUgPT09IDAgfHwgcmVzdWx0LnN1Y2Nlc3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOiusOW9leaKpeWQjeaIkOWKn1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJlbmFDb25maWcgPSB0aGF0Ll9hcmVuYURldGFpbHNbcm9vbUlkXSB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fc2lnbmVkVXBBcmVuYXNbcm9vbUlkXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZ251cFRpbWU6IERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6ICdzaWduZWRfdXAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRkb3duRW5kOiByZXN1bHQuZGF0YSA/IHJlc3VsdC5kYXRhLnN0YXJ0X3RpbWUgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXJlbmFDb25maWc6IGFyZW5hQ29uZmlnLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGVyaW9kTm86IHJlc3VsdC5wZXJpb2Rfbm8gfHwgcmVzdWx0LmRhdGE/LnBlcmlvZF9ub1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeS/neWtmOWIsOacrOWcsOWtmOWCqFxuICAgICAgICAgICAgICAgICAgICB0aGF0LnNhdmVUb0xvY2FsKCk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDpgJrnn6XnirbmgIHlj5jmm7RcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fbm90aWZ5U3RhdHVzQ2hhbmdlKHJvb21JZCwgJ3NpZ25lZF91cCcpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2sobnVsbCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHJlc3VsdC5tZXNzYWdlIHx8ICfmiqXlkI3miJDlip8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRfdGltZTogcmVzdWx0LmRhdGEgPyByZXN1bHQuZGF0YS5zdGFydF90aW1lIDogbnVsbFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhyZXN1bHQgPyByZXN1bHQubWVzc2FnZSA6ICfmiqXlkI3lpLHotKUnLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDlj5bmtojmiqXlkI1cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gcm9vbUlkIC0g56ue5oqA5Zy65oi/6Ze0SURcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIOWbnuiwg+WHveaVsCAoZXJyLCByZXN1bHQpXG4gICAgICovXG4gICAgdGhhdC5jYW5jZWxTaWdudXAgPSBmdW5jdGlvbihyb29tSWQsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBhcGlVcmwgPSB3aW5kb3cuZGVmaW5lcyA/IHdpbmRvdy5kZWZpbmVzLmFwaVVybCA6ICcnO1xuICAgICAgICB2YXIgY3J5cHRvS2V5ID0gd2luZG93LmRlZmluZXMgPyB3aW5kb3cuZGVmaW5lcy5jcnlwdG9LZXkgOiAnJztcbiAgICAgICAgdmFyIHRva2VuID0gd2luZG93Lm15Z2xvYmFsICYmIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhID8gd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEudG9rZW4gOiAnJztcbiAgICAgICAgXG4gICAgICAgIGlmICghYXBpVXJsIHx8ICF3aW5kb3cuSHR0cEFQSSkge1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soJ0FQSeacqumFjee9ricsIG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgcmVxdWVzdERhdGEgPSB7XG4gICAgICAgICAgICByb29tX2lkOiByb29tSWQsXG4gICAgICAgICAgICB0b2tlbjogdG9rZW5cbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIEh0dHBBUEkucG9zdChcbiAgICAgICAgICAgIGFwaVVybCArICcvYXBpL3YxL2FyZW5hL2NhbmNlbCcsXG4gICAgICAgICAgICByZXF1ZXN0RGF0YSxcbiAgICAgICAgICAgIGNyeXB0b0tleSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgKHJlc3VsdC5jb2RlID09PSAwIHx8IHJlc3VsdC5zdWNjZXNzKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyDmuIXpmaTmiqXlkI3orrDlvZVcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoYXQuX3NpZ25lZFVwQXJlbmFzW3Jvb21JZF07XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5L+d5a2Y5Yiw5pys5Zyw5a2Y5YKoXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2F2ZVRvTG9jYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOa4hemZpOWAkuiuoeaXtuWumuaXtuWZqFxuICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5fY291bnRkb3duVGltZXJzW3Jvb21JZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhhdC5fY291bnRkb3duVGltZXJzW3Jvb21JZF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoYXQuX2NvdW50ZG93blRpbWVyc1tyb29tSWRdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDpgJrnn6XnirbmgIHlj5jmm7RcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fbm90aWZ5U3RhdHVzQ2hhbmdlKHJvb21JZCwgJ2NhbmNlbGxlZCcpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2sobnVsbCwgeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAn5Y+W5raI5oql5ZCN5oiQ5YqfJyB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhyZXN1bHQgPyByZXN1bHQubWVzc2FnZSA6ICflj5bmtojmiqXlkI3lpLHotKUnLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDojrflj5blt7LmiqXlkI3nirbmgIFcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gcm9vbUlkIC0g56ue5oqA5Zy65oi/6Ze0SURcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fG51bGx9IOaKpeWQjeS/oeaBr+aIlm51bGxcbiAgICAgKi9cbiAgICB0aGF0LmdldFNpZ251cFN0YXR1cyA9IGZ1bmN0aW9uKHJvb21JZCkge1xuICAgICAgICByZXR1cm4gdGhhdC5fc2lnbmVkVXBBcmVuYXNbcm9vbUlkXSB8fCBudWxsO1xuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICog5qOA5p+l5piv5ZCm5bey5oql5ZCNXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHJvb21JZCAtIOernuaKgOWcuuaIv+mXtElEXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAgICovXG4gICAgdGhhdC5pc1NpZ25lZFVwID0gZnVuY3Rpb24ocm9vbUlkKSB7XG4gICAgICAgIHJldHVybiAhIXRoYXQuX3NpZ25lZFVwQXJlbmFzW3Jvb21JZF07XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDojrflj5blvIDotZvlgJLorqHml7bvvIjnp5LvvIlcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gcm9vbUlkIC0g56ue5oqA5Zy65oi/6Ze0SURcbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfSDlgJLorqHml7bnp5LmlbDvvIwtMeihqOekuuacquaKpeWQjeaIluaXoOWAkuiuoeaXtlxuICAgICAqL1xuICAgIHRoYXQuZ2V0Q291bnRkb3duID0gZnVuY3Rpb24ocm9vbUlkKSB7XG4gICAgICAgIHZhciBzaWdudXAgPSB0aGF0Ll9zaWduZWRVcEFyZW5hc1tyb29tSWRdO1xuICAgICAgICBpZiAoIXNpZ251cCB8fCAhc2lnbnVwLmNvdW50ZG93bkVuZCkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdmFyIHJlbWFpbmluZyA9IE1hdGguZmxvb3IoKHNpZ251cC5jb3VudGRvd25FbmQgLSBub3cpIC8gMTAwMCk7XG4gICAgICAgIHJldHVybiByZW1haW5pbmcgPiAwID8gcmVtYWluaW5nIDogMDtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOagvOW8j+WMluWAkuiuoeaXtuaYvuekulxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBzZWNvbmRzIC0g56eS5pWwXG4gICAgICogQHJldHVybnMge1N0cmluZ30g5qC85byP5YyW5ZCO55qE5pe26Ze05a2X56ym5LiyXG4gICAgICovXG4gICAgdGhhdC5mb3JtYXRDb3VudGRvd24gPSBmdW5jdGlvbihzZWNvbmRzKSB7XG4gICAgICAgIGlmIChzZWNvbmRzIDwgMCkgcmV0dXJuICcnO1xuICAgICAgICBpZiAoc2Vjb25kcyA9PT0gMCkgcmV0dXJuICfljbPlsIblvIDotZsnO1xuICAgICAgICBcbiAgICAgICAgdmFyIGhvdXJzID0gTWF0aC5mbG9vcihzZWNvbmRzIC8gMzYwMCk7XG4gICAgICAgIHZhciBtaW51dGVzID0gTWF0aC5mbG9vcigoc2Vjb25kcyAlIDM2MDApIC8gNjApO1xuICAgICAgICB2YXIgc2VjcyA9IHNlY29uZHMgJSA2MDtcbiAgICAgICAgXG4gICAgICAgIGlmIChob3VycyA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBob3VycyArICc6JyArIChtaW51dGVzIDwgMTAgPyAnMCcgOiAnJykgKyBtaW51dGVzICsgJzonICsgKHNlY3MgPCAxMCA/ICcwJyA6ICcnKSArIHNlY3M7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gKG1pbnV0ZXMgPCAxMCA/ICcwJyA6ICcnKSArIG1pbnV0ZXMgKyAnOicgKyAoc2VjcyA8IDEwID8gJzAnIDogJycpICsgc2VjcztcbiAgICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICog6I635Y+W56ue5oqA5Zy66YWN572uXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHJvb21JZCAtIOernuaKgOWcuuaIv+mXtElEXG4gICAgICogQHJldHVybnMge09iamVjdHxudWxsfVxuICAgICAqL1xuICAgIHRoYXQuZ2V0QXJlbmFDb25maWcgPSBmdW5jdGlvbihyb29tSWQpIHtcbiAgICAgICAgcmV0dXJuIHRoYXQuX2FyZW5hRGV0YWlsc1tyb29tSWRdIHx8IG51bGw7XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDojrflj5bmiqXlkI3otLlcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm9vbUNvbmZpZyAtIOaIv+mXtOmFjee9rlxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9IOaKpeWQjei0ue+8iOernuaKgOW4ge+8iVxuICAgICAqL1xuICAgIHRoYXQuZ2V0U2lnbnVwRmVlID0gZnVuY3Rpb24ocm9vbUNvbmZpZykge1xuICAgICAgICByZXR1cm4gcm9vbUNvbmZpZy5zaWdudXBfZmVlIHx8IHJvb21Db25maWcuc2lnbnVwRmVlIHx8IDA7XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDojrflj5blhqDlhpvlpZblirHpooTop4hcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcm9vbUNvbmZpZyAtIOaIv+mXtOmFjee9rlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IHsgY29pbnM6IE51bWJlciwgaXRlbXM6IEFycmF5IH1cbiAgICAgKi9cbiAgICB0aGF0LmdldENoYW1waW9uUmV3YXJkID0gZnVuY3Rpb24ocm9vbUNvbmZpZykge1xuICAgICAgICByZXR1cm4gcm9vbUNvbmZpZy5jaGFtcGlvbl9yZXdhcmQgfHwgcm9vbUNvbmZpZy5jaGFtcGlvblJld2FyZCB8fCB7IGNvaW5zOiAwLCBpdGVtczogW10gfTtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOingueci+W5v+WRiuiOt+WPluWlluWKsVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIC0g5aWW5Yqx57G75Z6LICgnZ29sZCcg5oiWICdhcmVuYV9jb2luJylcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIOWbnuiwg+WHveaVsCAoZXJyLCByZXN1bHQpXG4gICAgICovXG4gICAgdGhhdC53YXRjaEFkRm9yUmV3YXJkID0gZnVuY3Rpb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGFwaVVybCA9IHdpbmRvdy5kZWZpbmVzID8gd2luZG93LmRlZmluZXMuYXBpVXJsIDogJyc7XG4gICAgICAgIHZhciBjcnlwdG9LZXkgPSB3aW5kb3cuZGVmaW5lcyA/IHdpbmRvdy5kZWZpbmVzLmNyeXB0b0tleSA6ICcnO1xuICAgICAgICB2YXIgdG9rZW4gPSB3aW5kb3cubXlnbG9iYWwgJiYgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEgPyB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS50b2tlbiA6ICcnO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFhcGlVcmwgfHwgIXdpbmRvdy5IdHRwQVBJKSB7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygnQVBJ5pyq6YWN572uJywgbnVsbCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciByZXF1ZXN0RGF0YSA9IHtcbiAgICAgICAgICAgIHRva2VuOiB0b2tlbixcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICBhZF90eXBlOiAncmV3YXJkX3ZpZGVvJ1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgSHR0cEFQSS5wb3N0KFxuICAgICAgICAgICAgYXBpVXJsICsgJy9hcGkvYWQvcmV3YXJkJyxcbiAgICAgICAgICAgIHJlcXVlc3REYXRhLFxuICAgICAgICAgICAgY3J5cHRvS2V5LFxuICAgICAgICAgICAgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiAocmVzdWx0LmNvZGUgPT09IDAgfHwgcmVzdWx0LnN1Y2Nlc3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOabtOaWsOeOqeWutuaVsOaNrlxuICAgICAgICAgICAgICAgICAgICBpZiAod2luZG93Lm15Z2xvYmFsICYmIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmRhdGEuZ29sZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5nb2JhbF9jb3VudCA9IHJlc3VsdC5kYXRhLmdvbGQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZGF0YS5hcmVuYV9jb2luKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLmFyZW5hX2NvaW4gPSByZXN1bHQuZGF0YS5hcmVuYV9jb2luO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5zYXZlVG9Mb2NhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV3YXJkOiByZXN1bHQuZGF0YSB8fCB7fVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhyZXN1bHQgPyByZXN1bHQubWVzc2FnZSA6ICfojrflj5blpZblirHlpLHotKUnLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDliLfmlrDnjqnlrrbotKfluIHkvZnpop1cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIOWbnuiwg+WHveaVsCAoZXJyLCBkYXRhKVxuICAgICAqL1xuICAgIHRoYXQucmVmcmVzaEJhbGFuY2UgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgYXBpVXJsID0gd2luZG93LmRlZmluZXMgPyB3aW5kb3cuZGVmaW5lcy5hcGlVcmwgOiAnJztcbiAgICAgICAgdmFyIGNyeXB0b0tleSA9IHdpbmRvdy5kZWZpbmVzID8gd2luZG93LmRlZmluZXMuY3J5cHRvS2V5IDogJyc7XG4gICAgICAgIHZhciB0b2tlbiA9IHdpbmRvdy5teWdsb2JhbCAmJiB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YSA/IHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnRva2VuIDogJyc7XG4gICAgICAgIFxuICAgICAgICBpZiAoIWFwaVVybCB8fCAhd2luZG93Lkh0dHBBUEkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCdBUEnmnKrphY3nva4nLCBudWxsKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgSHR0cEFQSS5nZXQoXG4gICAgICAgICAgICBhcGlVcmwgKyAnL2FwaS92MS9wbGF5ZXIvYmFsYW5jZT90b2tlbj0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHRva2VuKSxcbiAgICAgICAgICAgIGNyeXB0b0tleSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgKHJlc3VsdC5jb2RlID09PSAwIHx8IHJlc3VsdC5kYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3VsdC5kYXRhIHx8IHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOabtOaWsOeOqeWutuaVsOaNrlxuICAgICAgICAgICAgICAgICAgICBpZiAod2luZG93Lm15Z2xvYmFsICYmIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5nb2xkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5nb2JhbF9jb3VudCA9IGRhdGEuZ29sZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLmFyZW5hX2NvaW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLmFyZW5hX2NvaW4gPSBkYXRhLmFyZW5hX2NvaW47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5zYXZlVG9Mb2NhbCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhudWxsLCBkYXRhKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhyZXN1bHQgPyByZXN1bHQubWVzc2FnZSA6ICfojrflj5bkvZnpop3lpLHotKUnLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfTtcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDnirbmgIHnm5HlkKwgPT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICAvKipcbiAgICAgKiDmt7vliqDnirbmgIHlj5jmm7Tnm5HlkKzlmahcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciAtIOebkeWQrOWHveaVsCAocm9vbUlkLCBzdGF0dXMpXG4gICAgICovXG4gICAgdGhhdC5hZGRTdGF0dXNMaXN0ZW5lciA9IGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgICAgIHRoYXQuX3N0YXR1c0xpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOenu+mZpOeKtuaAgeWPmOabtOebkeWQrOWZqFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIC0g55uR5ZCs5Ye95pWwXG4gICAgICovXG4gICAgdGhhdC5yZW1vdmVTdGF0dXNMaXN0ZW5lciA9IGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoYXQuX3N0YXR1c0xpc3RlbmVycy5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoYXQuX3N0YXR1c0xpc3RlbmVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDpgJrnn6XnirbmgIHlj5jmm7RcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gcm9vbUlkIC0g5oi/6Ze0SURcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RhdHVzIC0g5paw54q25oCBXG4gICAgICovXG4gICAgdGhhdC5fbm90aWZ5U3RhdHVzQ2hhbmdlID0gZnVuY3Rpb24ocm9vbUlkLCBzdGF0dXMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGF0Ll9zdGF0dXNMaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhhdC5fc3RhdHVzTGlzdGVuZXJzW2ldKHJvb21JZCwgc3RhdHVzKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCfnirbmgIHnm5HlkKzlmajmiafooYzplJnor686JywgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09IOWAkuiuoeaXtueuoeeQhiA9PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIOWQr+WKqOWAkuiuoeaXtuabtOaWsFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb29tSWQgLSDmiL/pl7RJRFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG9uVXBkYXRlIC0g5pu05paw5Zue6LCDIChzZWNvbmRzKVxuICAgICAqL1xuICAgIHRoYXQuc3RhcnRDb3VudGRvd24gPSBmdW5jdGlvbihyb29tSWQsIG9uVXBkYXRlKSB7XG4gICAgICAgIC8vIOa4hemZpOaXp+eahOWumuaXtuWZqFxuICAgICAgICBpZiAodGhhdC5fY291bnRkb3duVGltZXJzW3Jvb21JZF0pIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhhdC5fY291bnRkb3duVGltZXJzW3Jvb21JZF0pO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGF0Ll9jb3VudGRvd25UaW1lcnNbcm9vbUlkXSA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHNlY29uZHMgPSB0aGF0LmdldENvdW50ZG93bihyb29tSWQpO1xuICAgICAgICAgICAgb25VcGRhdGUgJiYgb25VcGRhdGUoc2Vjb25kcyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWAkuiuoeaXtue7k+adn1xuICAgICAgICAgICAgaWYgKHNlY29uZHMgPD0gMCkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhhdC5fY291bnRkb3duVGltZXJzW3Jvb21JZF0pO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGF0Ll9jb3VudGRvd25UaW1lcnNbcm9vbUlkXTtcbiAgICAgICAgICAgICAgICB0aGF0Ll9ub3RpZnlTdGF0dXNDaGFuZ2Uocm9vbUlkLCAnc3RhcnRpbmcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDlgZzmraLlgJLorqHml7ZcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gcm9vbUlkIC0g5oi/6Ze0SURcbiAgICAgKi9cbiAgICB0aGF0LnN0b3BDb3VudGRvd24gPSBmdW5jdGlvbihyb29tSWQpIHtcbiAgICAgICAgaWYgKHRoYXQuX2NvdW50ZG93blRpbWVyc1tyb29tSWRdKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoYXQuX2NvdW50ZG93blRpbWVyc1tyb29tSWRdKTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGF0Ll9jb3VudGRvd25UaW1lcnNbcm9vbUlkXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICog5riF6Zmk5omA5pyJ5YCS6K6h5pe2XG4gICAgICovXG4gICAgdGhhdC5jbGVhckFsbENvdW50ZG93bnMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yICh2YXIgcm9vbUlkIGluIHRoYXQuX2NvdW50ZG93blRpbWVycykge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGF0Ll9jb3VudGRvd25UaW1lcnNbcm9vbUlkXSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhhdC5fY291bnRkb3duVGltZXJzID0ge307XG4gICAgfTtcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDmnKzlnLDlrZjlgqggPT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICAvKipcbiAgICAgKiDkv53lrZjmiqXlkI3nirbmgIHliLDmnKzlnLBcbiAgICAgKi9cbiAgICB0aGF0LnNhdmVUb0xvY2FsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICBzaWduZWRVcEFyZW5hczogdGhhdC5fc2lnbmVkVXBBcmVuYXMsXG4gICAgICAgICAgICAgICAgc2F2ZWRBdDogRGF0ZS5ub3coKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhcmVuYV9kYXRhJywgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfkv53lrZjnq57mioDlnLrmlbDmja7lpLHotKU6JywgZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOS7juacrOWcsOWKoOi9veaKpeWQjeeKtuaAgVxuICAgICAqL1xuICAgIHRoYXQubG9hZEZyb21Mb2NhbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIGRhdGFTdHIgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXJlbmFfZGF0YScpO1xuICAgICAgICAgICAgaWYgKGRhdGFTdHIpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IEpTT04ucGFyc2UoZGF0YVN0cik7XG4gICAgICAgICAgICAgICAgLy8g5qOA5p+l5pWw5o2u5piv5ZCm6L+H5pyf77yIMeWkqe+8iVxuICAgICAgICAgICAgICAgIGlmIChEYXRlLm5vdygpIC0gKGRhdGEuc2F2ZWRBdCB8fCAwKSA8IDI0ICogNjAgKiA2MCAqIDEwMDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fc2lnbmVkVXBBcmVuYXMgPSBkYXRhLnNpZ25lZFVwQXJlbmFzIHx8IHt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcign5Yqg6L2956ue5oqA5Zy65pWw5o2u5aSx6LSlOicsIGUpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5LuO5pyN5Yqh56uv6I635Y+W5oql5ZCN54q25oCBXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSDlm57osIPlh73mlbAgKGVyciwgc2lnbmVkVXBSb29tcylcbiAgICAgKi9cbiAgICB0aGF0LmZldGNoU2lnbnVwU3RhdHVzRnJvbVNlcnZlciA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBhcGlVcmwgPSB3aW5kb3cuZGVmaW5lcyA/IHdpbmRvdy5kZWZpbmVzLmFwaVVybCA6ICcnO1xuICAgICAgICB2YXIgY3J5cHRvS2V5ID0gd2luZG93LmRlZmluZXMgPyB3aW5kb3cuZGVmaW5lcy5jcnlwdG9LZXkgOiAnJztcbiAgICAgICAgdmFyIHRva2VuID0gd2luZG93Lm15Z2xvYmFsICYmIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhID8gd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEudG9rZW4gOiAnJztcbiAgICAgICAgXG4gICAgICAgIGlmICghYXBpVXJsIHx8ICF3aW5kb3cuSHR0cEFQSSkge1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soJ0FQSeacqumFjee9ricsIG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBIdHRwQVBJLmdldChcbiAgICAgICAgICAgIGFwaVVybCArICcvYXBpL3YxL2FyZW5hL3NpZ251cC1zdGF0dXM/dG9rZW49JyArIGVuY29kZVVSSUNvbXBvbmVudCh0b2tlbiksXG4gICAgICAgICAgICBjcnlwdG9LZXksXG4gICAgICAgICAgICBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfj5/vuI8gW2FyZW5hRGF0YV0g6I635Y+W5oql5ZCN54q25oCB5aSx6LSlOlwiLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBzaWduZWRVcFJvb21zID0gW107XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiAocmVzdWx0LmNvZGUgPT09IDAgfHwgcmVzdWx0LmRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gcmVzdWx0LmRhdGEgfHwgcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICBzaWduZWRVcFJvb21zID0gZGF0YS5zaWduZWRfdXBfcm9vbXMgfHwgW107XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDmm7TmlrDmnKzlnLDnvJPlrZhcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5fc2lnbmVkVXBBcmVuYXMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaWduZWRVcFJvb21zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcm9vbSA9IHNpZ25lZFVwUm9vbXNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9zaWduZWRVcEFyZW5hc1tyb29tLnJvb21faWRdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZ251cFRpbWU6IHJvb20uc2lnbnVwX3RpbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiAnc2lnbmVkX3VwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJpb2RObzogcm9vbS5wZXJpb2Rfbm8sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lnbnVwRmVlOiByb29tLnNpZ251cF9mZWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOS/neWtmOWIsOacrOWcsFxuICAgICAgICAgICAgICAgICAgICB0aGF0LnNhdmVUb0xvY2FsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKG51bGwsIHNpZ25lZFVwUm9vbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICog5riF6Zmk5omA5pyJ5oql5ZCN54q25oCB77yI55So5LqO5rWL6K+V5oiW6YeN572u77yJXG4gICAgICovXG4gICAgdGhhdC5jbGVhckFsbFNpZ251cFN0YXR1cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGF0Ll9zaWduZWRVcEFyZW5hcyA9IHt9O1xuICAgICAgICB0aGF0LnNhdmVUb0xvY2FsKCk7XG4gICAgfTtcbiAgICBcbiAgICAvLyDliJ3lp4vljJbml7bliqDovb3mnKzlnLDmlbDmja5cbiAgICB0aGF0LmxvYWRGcm9tTG9jYWwoKTtcbiAgICBcbiAgICByZXR1cm4gdGhhdDtcbn0oKTtcbiJdfQ==