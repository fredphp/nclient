
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
        }; // 🔧【新增】保存到本地存储

        that.saveToLocal(); // 通知状态变更

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
        delete that._signedUpArenas[roomId]; // 🔧【新增】保存到本地存储

        that.saveToLocal(); // 清除倒计时定时器

        if (that._countdownTimers[roomId]) {
          clearInterval(that._countdownTimers[roomId]);
          delete that._countdownTimers[roomId];
        } // 通知状态变更


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2RhdGEvYXJlbmFEYXRhLmpzIl0sIm5hbWVzIjpbIndpbmRvdyIsImFyZW5hRGF0YSIsInRoYXQiLCJfc2lnbmVkVXBBcmVuYXMiLCJfYXJlbmFEZXRhaWxzIiwiX2NvdW50ZG93blRpbWVycyIsIl9zdGF0dXNMaXN0ZW5lcnMiLCJnZXRBcmVuYUxpc3QiLCJjYWxsYmFjayIsImFwaVVybCIsImRlZmluZXMiLCJjcnlwdG9LZXkiLCJIdHRwQVBJIiwiZ2V0IiwiZXJyIiwicmVzdWx0IiwiYXJlbmFMaXN0IiwiY29kZSIsImRhdGEiLCJBcnJheSIsImlzQXJyYXkiLCJpIiwibGVuZ3RoIiwiYXJlbmEiLCJpZCIsInNpZ251cCIsInJvb21JZCIsInRva2VuIiwibXlnbG9iYWwiLCJwbGF5ZXJEYXRhIiwicmVxdWVzdERhdGEiLCJyb29tX2lkIiwicG9zdCIsInN1Y2Nlc3MiLCJhcmVuYUNvbmZpZyIsInNpZ251cFRpbWUiLCJEYXRlIiwibm93Iiwic3RhdHVzIiwiY291bnRkb3duRW5kIiwic3RhcnRfdGltZSIsInBlcmlvZE5vIiwicGVyaW9kX25vIiwic2F2ZVRvTG9jYWwiLCJfbm90aWZ5U3RhdHVzQ2hhbmdlIiwibWVzc2FnZSIsImNhbmNlbFNpZ251cCIsImNsZWFySW50ZXJ2YWwiLCJnZXRTaWdudXBTdGF0dXMiLCJpc1NpZ25lZFVwIiwiZ2V0Q291bnRkb3duIiwicmVtYWluaW5nIiwiTWF0aCIsImZsb29yIiwiZm9ybWF0Q291bnRkb3duIiwic2Vjb25kcyIsImhvdXJzIiwibWludXRlcyIsInNlY3MiLCJnZXRBcmVuYUNvbmZpZyIsImdldFNpZ251cEZlZSIsInJvb21Db25maWciLCJzaWdudXBfZmVlIiwic2lnbnVwRmVlIiwiZ2V0Q2hhbXBpb25SZXdhcmQiLCJjaGFtcGlvbl9yZXdhcmQiLCJjaGFtcGlvblJld2FyZCIsImNvaW5zIiwiaXRlbXMiLCJ3YXRjaEFkRm9yUmV3YXJkIiwidHlwZSIsImFkX3R5cGUiLCJnb2xkIiwiZ29iYWxfY291bnQiLCJhcmVuYV9jb2luIiwicmV3YXJkIiwicmVmcmVzaEJhbGFuY2UiLCJlbmNvZGVVUklDb21wb25lbnQiLCJ1bmRlZmluZWQiLCJhZGRTdGF0dXNMaXN0ZW5lciIsImxpc3RlbmVyIiwicHVzaCIsInJlbW92ZVN0YXR1c0xpc3RlbmVyIiwiaW5kZXgiLCJpbmRleE9mIiwic3BsaWNlIiwiZSIsImNvbnNvbGUiLCJlcnJvciIsInN0YXJ0Q291bnRkb3duIiwib25VcGRhdGUiLCJzZXRJbnRlcnZhbCIsInN0b3BDb3VudGRvd24iLCJjbGVhckFsbENvdW50ZG93bnMiLCJzaWduZWRVcEFyZW5hcyIsInNhdmVkQXQiLCJsb2NhbFN0b3JhZ2UiLCJzZXRJdGVtIiwiSlNPTiIsInN0cmluZ2lmeSIsImxvYWRGcm9tTG9jYWwiLCJkYXRhU3RyIiwiZ2V0SXRlbSIsInBhcnNlIiwiZmV0Y2hTaWdudXBTdGF0dXNGcm9tU2VydmVyIiwic2lnbmVkVXBSb29tcyIsInNpZ25lZF91cF9yb29tcyIsInJvb20iLCJzaWdudXBfdGltZSIsImNsZWFyQWxsU2lnbnVwU3RhdHVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUFBLE1BQU0sQ0FBQ0MsU0FBUCxHQUFtQixZQUFXO0VBQzFCLElBQUlDLElBQUksR0FBRyxFQUFYLENBRDBCLENBRzFCO0VBRUE7O0VBQ0FBLElBQUksQ0FBQ0MsZUFBTCxHQUF1QixFQUF2QixDQU4wQixDQVExQjs7RUFDQUQsSUFBSSxDQUFDRSxhQUFMLEdBQXFCLEVBQXJCLENBVDBCLENBVzFCOztFQUNBRixJQUFJLENBQUNHLGdCQUFMLEdBQXdCLEVBQXhCLENBWjBCLENBYzFCOztFQUNBSCxJQUFJLENBQUNJLGdCQUFMLEdBQXdCLEVBQXhCLENBZjBCLENBaUIxQjs7RUFFQTtBQUNKO0FBQ0E7QUFDQTs7RUFDSUosSUFBSSxDQUFDSyxZQUFMLEdBQW9C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KiDnq57mioDlnLrmlbDmja7nrqHnkIbmqKHlnZdcbiAqIOeUqOS6jueuoeeQhuernuaKgOWcuuaKpeWQjeOAgeWAkuiuoeaXtuOAgeWlluWKseetieaVsOaNrlxuICogXG4gKiDlip/og73vvJpcbiAqIDEuIOiOt+WPluernuaKgOWcuuaIv+mXtOWIl+ihqFxuICogMi4g5oql5ZCNL+WPlua2iOaKpeWQjVxuICogMy4g6I635Y+W5byA6LWb5YCS6K6h5pe2XG4gKiA0LiDojrflj5blt7LmiqXlkI3nirbmgIFcbiAqL1xuXG53aW5kb3cuYXJlbmFEYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRoYXQgPSB7fTtcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDnq57mioDlnLrnirbmgIHmlbDmja4gPT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICAvLyDlt7LmiqXlkI3nmoTnq57mioDlnLrliJfooaggeyByb29tSWQ6IHsgc2lnbnVwVGltZSwgc3RhdHVzLCBjb3VudGRvd25FbmQgfSB9XG4gICAgdGhhdC5fc2lnbmVkVXBBcmVuYXMgPSB7fTtcbiAgICBcbiAgICAvLyDnq57mioDlnLror6bmg4XnvJPlrZggeyByb29tSWQ6IGFyZW5hQ29uZmlnIH1cbiAgICB0aGF0Ll9hcmVuYURldGFpbHMgPSB7fTtcbiAgICBcbiAgICAvLyDlgJLorqHml7blrprml7blmahcbiAgICB0aGF0Ll9jb3VudGRvd25UaW1lcnMgPSB7fTtcbiAgICBcbiAgICAvLyDnirbmgIHlj5jmm7Tnm5HlkKzlmahcbiAgICB0aGF0Ll9zdGF0dXNMaXN0ZW5lcnMgPSBbXTtcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PSBBUEkg5pa55rOVID09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLyoqXG4gICAgICog6I635Y+W56ue5oqA5Zy65oi/6Ze05YiX6KGoXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSDlm57osIPlh73mlbAgKGVyciwgYXJlbmFMaXN0KVxuICAgICAqL1xuICAgIHRoYXQuZ2V0QXJlbmFMaXN0ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGFwaVVybCA9IHdpbmRvdy5kZWZpbmVzID8gd2luZG93LmRlZmluZXMuYXBpVXJsIDogJyc7XG4gICAgICAgIHZhciBjcnlwdG9LZXkgPSB3aW5kb3cuZGVmaW5lcyA/IHdpbmRvdy5kZWZpbmVzLmNyeXB0b0tleSA6ICcnO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFhcGlVcmwgfHwgIXdpbmRvdy5IdHRwQVBJKSB7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygnQVBJ5pyq6YWN572uJywgbnVsbCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIEh0dHBBUEkuZ2V0KFxuICAgICAgICAgICAgYXBpVXJsICsgJy9hcGkvdjEvYXJlbmEvbGlzdCcsXG4gICAgICAgICAgICBjcnlwdG9LZXksXG4gICAgICAgICAgICBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgYXJlbmFMaXN0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICYmIHJlc3VsdC5jb2RlID09PSAwICYmIHJlc3VsdC5kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZW5hTGlzdCA9IHJlc3VsdC5kYXRhO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0ICYmIEFycmF5LmlzQXJyYXkocmVzdWx0KSkge1xuICAgICAgICAgICAgICAgICAgICBhcmVuYUxpc3QgPSByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChhcmVuYUxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g57yT5a2Y56ue5oqA5Zy66K+m5oOFXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJlbmFMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJlbmEgPSBhcmVuYUxpc3RbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Ll9hcmVuYURldGFpbHNbYXJlbmEuaWRdID0gYXJlbmE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2sobnVsbCwgYXJlbmFMaXN0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygn6I635Y+W56ue5oqA5Zy65YiX6KGo5aSx6LSlJywgbnVsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICog5oql5ZCN56ue5oqA5Zy6XG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHJvb21JZCAtIOernuaKgOWcuuaIv+mXtElEXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSDlm57osIPlh73mlbAgKGVyciwgcmVzdWx0KVxuICAgICAqL1xuICAgIHRoYXQuc2lnbnVwID0gZnVuY3Rpb24ocm9vbUlkLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgYXBpVXJsID0gd2luZG93LmRlZmluZXMgPyB3aW5kb3cuZGVmaW5lcy5hcGlVcmwgOiAnJztcbiAgICAgICAgdmFyIGNyeXB0b0tleSA9IHdpbmRvdy5kZWZpbmVzID8gd2luZG93LmRlZmluZXMuY3J5cHRvS2V5IDogJyc7XG4gICAgICAgIHZhciB0b2tlbiA9IHdpbmRvdy5teWdsb2JhbCAmJiB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YSA/IHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnRva2VuIDogJyc7XG4gICAgICAgIFxuICAgICAgICBpZiAoIWFwaVVybCB8fCAhd2luZG93Lkh0dHBBUEkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCdBUEnmnKrphY3nva4nLCBudWxsKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIHJlcXVlc3REYXRhID0ge1xuICAgICAgICAgICAgcm9vbV9pZDogcm9vbUlkLFxuICAgICAgICAgICAgdG9rZW46IHRva2VuXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBIdHRwQVBJLnBvc3QoXG4gICAgICAgICAgICBhcGlVcmwgKyAnL2FwaS92MS9hcmVuYS9zaWdudXAnLFxuICAgICAgICAgICAgcmVxdWVzdERhdGEsXG4gICAgICAgICAgICBjcnlwdG9LZXksXG4gICAgICAgICAgICBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICYmIChyZXN1bHQuY29kZSA9PT0gMCB8fCByZXN1bHQuc3VjY2VzcykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g6K6w5b2V5oql5ZCN5oiQ5YqfXG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmVuYUNvbmZpZyA9IHRoYXQuX2FyZW5hRGV0YWlsc1tyb29tSWRdIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9zaWduZWRVcEFyZW5hc1tyb29tSWRdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbnVwVGltZTogRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogJ3NpZ25lZF91cCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudGRvd25FbmQ6IHJlc3VsdC5kYXRhID8gcmVzdWx0LmRhdGEuc3RhcnRfdGltZSA6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmVuYUNvbmZpZzogYXJlbmFDb25maWcsXG4gICAgICAgICAgICAgICAgICAgICAgICBwZXJpb2RObzogcmVzdWx0LnBlcmlvZF9ubyB8fCByZXN1bHQuZGF0YT8ucGVyaW9kX25vXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5L+d5a2Y5Yiw5pys5Zyw5a2Y5YKoXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2F2ZVRvTG9jYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOmAmuefpeeKtuaAgeWPmOabtFxuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9ub3RpZnlTdGF0dXNDaGFuZ2Uocm9vbUlkLCAnc2lnbmVkX3VwJyk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogcmVzdWx0Lm1lc3NhZ2UgfHwgJ+aKpeWQjeaIkOWKnycsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydF90aW1lOiByZXN1bHQuZGF0YSA/IHJlc3VsdC5kYXRhLnN0YXJ0X3RpbWUgOiBudWxsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHJlc3VsdCA/IHJlc3VsdC5tZXNzYWdlIDogJ+aKpeWQjeWksei0pScsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOWPlua2iOaKpeWQjVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb29tSWQgLSDnq57mioDlnLrmiL/pl7RJRFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0g5Zue6LCD5Ye95pWwIChlcnIsIHJlc3VsdClcbiAgICAgKi9cbiAgICB0aGF0LmNhbmNlbFNpZ251cCA9IGZ1bmN0aW9uKHJvb21JZCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGFwaVVybCA9IHdpbmRvdy5kZWZpbmVzID8gd2luZG93LmRlZmluZXMuYXBpVXJsIDogJyc7XG4gICAgICAgIHZhciBjcnlwdG9LZXkgPSB3aW5kb3cuZGVmaW5lcyA/IHdpbmRvdy5kZWZpbmVzLmNyeXB0b0tleSA6ICcnO1xuICAgICAgICB2YXIgdG9rZW4gPSB3aW5kb3cubXlnbG9iYWwgJiYgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEgPyB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS50b2tlbiA6ICcnO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFhcGlVcmwgfHwgIXdpbmRvdy5IdHRwQVBJKSB7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygnQVBJ5pyq6YWN572uJywgbnVsbCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciByZXF1ZXN0RGF0YSA9IHtcbiAgICAgICAgICAgIHJvb21faWQ6IHJvb21JZCxcbiAgICAgICAgICAgIHRva2VuOiB0b2tlblxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgSHR0cEFQSS5wb3N0KFxuICAgICAgICAgICAgYXBpVXJsICsgJy9hcGkvdjEvYXJlbmEvY2FuY2VsJyxcbiAgICAgICAgICAgIHJlcXVlc3REYXRhLFxuICAgICAgICAgICAgY3J5cHRvS2V5LFxuICAgICAgICAgICAgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiAocmVzdWx0LmNvZGUgPT09IDAgfHwgcmVzdWx0LnN1Y2Nlc3MpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOa4hemZpOaKpeWQjeiusOW9lVxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhhdC5fc2lnbmVkVXBBcmVuYXNbcm9vbUlkXTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHkv53lrZjliLDmnKzlnLDlrZjlgqhcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYXZlVG9Mb2NhbCgpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5riF6Zmk5YCS6K6h5pe25a6a5pe25ZmoXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGF0Ll9jb3VudGRvd25UaW1lcnNbcm9vbUlkXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGF0Ll9jb3VudGRvd25UaW1lcnNbcm9vbUlkXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhhdC5fY291bnRkb3duVGltZXJzW3Jvb21JZF07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOmAmuefpeeKtuaAgeWPmOabtFxuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9ub3RpZnlTdGF0dXNDaGFuZ2Uocm9vbUlkLCAnY2FuY2VsbGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjayhudWxsLCB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICflj5bmtojmiqXlkI3miJDlip8nIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHJlc3VsdCA/IHJlc3VsdC5tZXNzYWdlIDogJ+WPlua2iOaKpeWQjeWksei0pScsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOiOt+WPluW3suaKpeWQjeeKtuaAgVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb29tSWQgLSDnq57mioDlnLrmiL/pl7RJRFxuICAgICAqIEByZXR1cm5zIHtPYmplY3R8bnVsbH0g5oql5ZCN5L+h5oGv5oiWbnVsbFxuICAgICAqL1xuICAgIHRoYXQuZ2V0U2lnbnVwU3RhdHVzID0gZnVuY3Rpb24ocm9vbUlkKSB7XG4gICAgICAgIHJldHVybiB0aGF0Ll9zaWduZWRVcEFyZW5hc1tyb29tSWRdIHx8IG51bGw7XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDmo4Dmn6XmmK/lkKblt7LmiqXlkI1cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gcm9vbUlkIC0g56ue5oqA5Zy65oi/6Ze0SURcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICB0aGF0LmlzU2lnbmVkVXAgPSBmdW5jdGlvbihyb29tSWQpIHtcbiAgICAgICAgcmV0dXJuICEhdGhhdC5fc2lnbmVkVXBBcmVuYXNbcm9vbUlkXTtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOiOt+WPluW8gOi1m+WAkuiuoeaXtu+8iOenku+8iVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb29tSWQgLSDnq57mioDlnLrmiL/pl7RJRFxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9IOWAkuiuoeaXtuenkuaVsO+8jC0x6KGo56S65pyq5oql5ZCN5oiW5peg5YCS6K6h5pe2XG4gICAgICovXG4gICAgdGhhdC5nZXRDb3VudGRvd24gPSBmdW5jdGlvbihyb29tSWQpIHtcbiAgICAgICAgdmFyIHNpZ251cCA9IHRoYXQuX3NpZ25lZFVwQXJlbmFzW3Jvb21JZF07XG4gICAgICAgIGlmICghc2lnbnVwIHx8ICFzaWdudXAuY291bnRkb3duRW5kKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICB2YXIgcmVtYWluaW5nID0gTWF0aC5mbG9vcigoc2lnbnVwLmNvdW50ZG93bkVuZCAtIG5vdykgLyAxMDAwKTtcbiAgICAgICAgcmV0dXJuIHJlbWFpbmluZyA+IDAgPyByZW1haW5pbmcgOiAwO1xuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICog5qC85byP5YyW5YCS6K6h5pe25pi+56S6XG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHNlY29uZHMgLSDnp5LmlbBcbiAgICAgKiBAcmV0dXJucyB7U3RyaW5nfSDmoLzlvI/ljJblkI7nmoTml7bpl7TlrZfnrKbkuLJcbiAgICAgKi9cbiAgICB0aGF0LmZvcm1hdENvdW50ZG93biA9IGZ1bmN0aW9uKHNlY29uZHMpIHtcbiAgICAgICAgaWYgKHNlY29uZHMgPCAwKSByZXR1cm4gJyc7XG4gICAgICAgIGlmIChzZWNvbmRzID09PSAwKSByZXR1cm4gJ+WNs+WwhuW8gOi1myc7XG4gICAgICAgIFxuICAgICAgICB2YXIgaG91cnMgPSBNYXRoLmZsb29yKHNlY29uZHMgLyAzNjAwKTtcbiAgICAgICAgdmFyIG1pbnV0ZXMgPSBNYXRoLmZsb29yKChzZWNvbmRzICUgMzYwMCkgLyA2MCk7XG4gICAgICAgIHZhciBzZWNzID0gc2Vjb25kcyAlIDYwO1xuICAgICAgICBcbiAgICAgICAgaWYgKGhvdXJzID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGhvdXJzICsgJzonICsgKG1pbnV0ZXMgPCAxMCA/ICcwJyA6ICcnKSArIG1pbnV0ZXMgKyAnOicgKyAoc2VjcyA8IDEwID8gJzAnIDogJycpICsgc2VjcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAobWludXRlcyA8IDEwID8gJzAnIDogJycpICsgbWludXRlcyArICc6JyArIChzZWNzIDwgMTAgPyAnMCcgOiAnJykgKyBzZWNzO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDojrflj5bnq57mioDlnLrphY3nva5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gcm9vbUlkIC0g56ue5oqA5Zy65oi/6Ze0SURcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fG51bGx9XG4gICAgICovXG4gICAgdGhhdC5nZXRBcmVuYUNvbmZpZyA9IGZ1bmN0aW9uKHJvb21JZCkge1xuICAgICAgICByZXR1cm4gdGhhdC5fYXJlbmFEZXRhaWxzW3Jvb21JZF0gfHwgbnVsbDtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOiOt+WPluaKpeWQjei0uVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb29tQ29uZmlnIC0g5oi/6Ze06YWN572uXG4gICAgICogQHJldHVybnMge051bWJlcn0g5oql5ZCN6LS577yI56ue5oqA5biB77yJXG4gICAgICovXG4gICAgdGhhdC5nZXRTaWdudXBGZWUgPSBmdW5jdGlvbihyb29tQ29uZmlnKSB7XG4gICAgICAgIHJldHVybiByb29tQ29uZmlnLnNpZ251cF9mZWUgfHwgcm9vbUNvbmZpZy5zaWdudXBGZWUgfHwgMDtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOiOt+WPluWGoOWGm+WlluWKsemihOiniFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByb29tQ29uZmlnIC0g5oi/6Ze06YWN572uXG4gICAgICogQHJldHVybnMge09iamVjdH0geyBjb2luczogTnVtYmVyLCBpdGVtczogQXJyYXkgfVxuICAgICAqL1xuICAgIHRoYXQuZ2V0Q2hhbXBpb25SZXdhcmQgPSBmdW5jdGlvbihyb29tQ29uZmlnKSB7XG4gICAgICAgIHJldHVybiByb29tQ29uZmlnLmNoYW1waW9uX3Jld2FyZCB8fCByb29tQ29uZmlnLmNoYW1waW9uUmV3YXJkIHx8IHsgY29pbnM6IDAsIGl0ZW1zOiBbXSB9O1xuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICog6KeC55yL5bm/5ZGK6I635Y+W5aWW5YqxXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgLSDlpZblirHnsbvlnosgKCdnb2xkJyDmiJYgJ2FyZW5hX2NvaW4nKVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0g5Zue6LCD5Ye95pWwIChlcnIsIHJlc3VsdClcbiAgICAgKi9cbiAgICB0aGF0LndhdGNoQWRGb3JSZXdhcmQgPSBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgYXBpVXJsID0gd2luZG93LmRlZmluZXMgPyB3aW5kb3cuZGVmaW5lcy5hcGlVcmwgOiAnJztcbiAgICAgICAgdmFyIGNyeXB0b0tleSA9IHdpbmRvdy5kZWZpbmVzID8gd2luZG93LmRlZmluZXMuY3J5cHRvS2V5IDogJyc7XG4gICAgICAgIHZhciB0b2tlbiA9IHdpbmRvdy5teWdsb2JhbCAmJiB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YSA/IHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnRva2VuIDogJyc7XG4gICAgICAgIFxuICAgICAgICBpZiAoIWFwaVVybCB8fCAhd2luZG93Lkh0dHBBUEkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCdBUEnmnKrphY3nva4nLCBudWxsKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIHJlcXVlc3REYXRhID0ge1xuICAgICAgICAgICAgdG9rZW46IHRva2VuLFxuICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgIGFkX3R5cGU6ICdyZXdhcmRfdmlkZW8nXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBIdHRwQVBJLnBvc3QoXG4gICAgICAgICAgICBhcGlVcmwgKyAnL2FwaS9hZC9yZXdhcmQnLFxuICAgICAgICAgICAgcmVxdWVzdERhdGEsXG4gICAgICAgICAgICBjcnlwdG9LZXksXG4gICAgICAgICAgICBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICYmIChyZXN1bHQuY29kZSA9PT0gMCB8fCByZXN1bHQuc3VjY2VzcykpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5pu05paw546p5a625pWw5o2uXG4gICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cubXlnbG9iYWwgJiYgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZGF0YS5nb2xkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLmdvYmFsX2NvdW50ID0gcmVzdWx0LmRhdGEuZ29sZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kYXRhLmFyZW5hX2NvaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYXJlbmFfY29pbiA9IHJlc3VsdC5kYXRhLmFyZW5hX2NvaW47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnNhdmVUb0xvY2FsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXdhcmQ6IHJlc3VsdC5kYXRhIHx8IHt9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHJlc3VsdCA/IHJlc3VsdC5tZXNzYWdlIDogJ+iOt+WPluWlluWKseWksei0pScsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOWIt+aWsOeOqeWutui0p+W4geS9meminVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0g5Zue6LCD5Ye95pWwIChlcnIsIGRhdGEpXG4gICAgICovXG4gICAgdGhhdC5yZWZyZXNoQmFsYW5jZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBhcGlVcmwgPSB3aW5kb3cuZGVmaW5lcyA/IHdpbmRvdy5kZWZpbmVzLmFwaVVybCA6ICcnO1xuICAgICAgICB2YXIgY3J5cHRvS2V5ID0gd2luZG93LmRlZmluZXMgPyB3aW5kb3cuZGVmaW5lcy5jcnlwdG9LZXkgOiAnJztcbiAgICAgICAgdmFyIHRva2VuID0gd2luZG93Lm15Z2xvYmFsICYmIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhID8gd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEudG9rZW4gOiAnJztcbiAgICAgICAgXG4gICAgICAgIGlmICghYXBpVXJsIHx8ICF3aW5kb3cuSHR0cEFQSSkge1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soJ0FQSeacqumFjee9ricsIG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBIdHRwQVBJLmdldChcbiAgICAgICAgICAgIGFwaVVybCArICcvYXBpL3YxL3BsYXllci9iYWxhbmNlP3Rva2VuPScgKyBlbmNvZGVVUklDb21wb25lbnQodG9rZW4pLFxuICAgICAgICAgICAgY3J5cHRvS2V5LFxuICAgICAgICAgICAgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiAocmVzdWx0LmNvZGUgPT09IDAgfHwgcmVzdWx0LmRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gcmVzdWx0LmRhdGEgfHwgcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5pu05paw546p5a625pWw5o2uXG4gICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cubXlnbG9iYWwgJiYgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLmdvbGQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLmdvYmFsX2NvdW50ID0gZGF0YS5nb2xkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuYXJlbmFfY29pbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYXJlbmFfY29pbiA9IGRhdGEuYXJlbmFfY29pbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnNhdmVUb0xvY2FsKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKG51bGwsIGRhdGEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHJlc3VsdCA/IHJlc3VsdC5tZXNzYWdlIDogJ+iOt+WPluS9memineWksei0pScsIG51bGwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9O1xuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09IOeKtuaAgeebkeWQrCA9PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIOa3u+WKoOeKtuaAgeWPmOabtOebkeWQrOWZqFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIC0g55uR5ZCs5Ye95pWwIChyb29tSWQsIHN0YXR1cylcbiAgICAgKi9cbiAgICB0aGF0LmFkZFN0YXR1c0xpc3RlbmVyID0gZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgdGhhdC5fc3RhdHVzTGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICog56e76Zmk54q25oCB5Y+Y5pu055uR5ZCs5ZmoXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgLSDnm5HlkKzlh73mlbBcbiAgICAgKi9cbiAgICB0aGF0LnJlbW92ZVN0YXR1c0xpc3RlbmVyID0gZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdGhhdC5fc3RhdHVzTGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhhdC5fc3RhdHVzTGlzdGVuZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOmAmuefpeeKtuaAgeWPmOabtFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb29tSWQgLSDmiL/pl7RJRFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdGF0dXMgLSDmlrDnirbmgIFcbiAgICAgKi9cbiAgICB0aGF0Ll9ub3RpZnlTdGF0dXNDaGFuZ2UgPSBmdW5jdGlvbihyb29tSWQsIHN0YXR1cykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoYXQuX3N0YXR1c0xpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGF0Ll9zdGF0dXNMaXN0ZW5lcnNbaV0ocm9vbUlkLCBzdGF0dXMpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+eKtuaAgeebkeWQrOWZqOaJp+ihjOmUmeivrzonLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5YCS6K6h5pe2566h55CGID09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLyoqXG4gICAgICog5ZCv5Yqo5YCS6K6h5pe25pu05pawXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHJvb21JZCAtIOaIv+mXtElEXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gb25VcGRhdGUgLSDmm7TmlrDlm57osIMgKHNlY29uZHMpXG4gICAgICovXG4gICAgdGhhdC5zdGFydENvdW50ZG93biA9IGZ1bmN0aW9uKHJvb21JZCwgb25VcGRhdGUpIHtcbiAgICAgICAgLy8g5riF6Zmk5pen55qE5a6a5pe25ZmoXG4gICAgICAgIGlmICh0aGF0Ll9jb3VudGRvd25UaW1lcnNbcm9vbUlkXSkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGF0Ll9jb3VudGRvd25UaW1lcnNbcm9vbUlkXSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoYXQuX2NvdW50ZG93blRpbWVyc1tyb29tSWRdID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc2Vjb25kcyA9IHRoYXQuZ2V0Q291bnRkb3duKHJvb21JZCk7XG4gICAgICAgICAgICBvblVwZGF0ZSAmJiBvblVwZGF0ZShzZWNvbmRzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5YCS6K6h5pe257uT5p2fXG4gICAgICAgICAgICBpZiAoc2Vjb25kcyA8PSAwKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGF0Ll9jb3VudGRvd25UaW1lcnNbcm9vbUlkXSk7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoYXQuX2NvdW50ZG93blRpbWVyc1tyb29tSWRdO1xuICAgICAgICAgICAgICAgIHRoYXQuX25vdGlmeVN0YXR1c0NoYW5nZShyb29tSWQsICdzdGFydGluZycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAxMDAwKTtcbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIOWBnOatouWAkuiuoeaXtlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByb29tSWQgLSDmiL/pl7RJRFxuICAgICAqL1xuICAgIHRoYXQuc3RvcENvdW50ZG93biA9IGZ1bmN0aW9uKHJvb21JZCkge1xuICAgICAgICBpZiAodGhhdC5fY291bnRkb3duVGltZXJzW3Jvb21JZF0pIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhhdC5fY291bnRkb3duVGltZXJzW3Jvb21JZF0pO1xuICAgICAgICAgICAgZGVsZXRlIHRoYXQuX2NvdW50ZG93blRpbWVyc1tyb29tSWRdO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDmuIXpmaTmiYDmnInlgJLorqHml7ZcbiAgICAgKi9cbiAgICB0aGF0LmNsZWFyQWxsQ291bnRkb3ducyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IgKHZhciByb29tSWQgaW4gdGhhdC5fY291bnRkb3duVGltZXJzKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoYXQuX2NvdW50ZG93blRpbWVyc1tyb29tSWRdKTtcbiAgICAgICAgfVxuICAgICAgICB0aGF0Ll9jb3VudGRvd25UaW1lcnMgPSB7fTtcbiAgICB9O1xuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09IOacrOWcsOWtmOWCqCA9PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIOS/neWtmOaKpeWQjeeKtuaAgeWIsOacrOWcsFxuICAgICAqL1xuICAgIHRoYXQuc2F2ZVRvTG9jYWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBkYXRhID0ge1xuICAgICAgICAgICAgICAgIHNpZ25lZFVwQXJlbmFzOiB0aGF0Ll9zaWduZWRVcEFyZW5hcyxcbiAgICAgICAgICAgICAgICBzYXZlZEF0OiBEYXRlLm5vdygpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2FyZW5hX2RhdGEnLCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+S/neWtmOernuaKgOWcuuaVsOaNruWksei0pTonLCBlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgLyoqXG4gICAgICog5LuO5pys5Zyw5Yqg6L295oql5ZCN54q25oCBXG4gICAgICovXG4gICAgdGhhdC5sb2FkRnJvbUxvY2FsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgZGF0YVN0ciA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhcmVuYV9kYXRhJyk7XG4gICAgICAgICAgICBpZiAoZGF0YVN0cikge1xuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gSlNPTi5wYXJzZShkYXRhU3RyKTtcbiAgICAgICAgICAgICAgICAvLyDmo4Dmn6XmlbDmja7mmK/lkKbov4fmnJ/vvIgx5aSp77yJXG4gICAgICAgICAgICAgICAgaWYgKERhdGUubm93KCkgLSAoZGF0YS5zYXZlZEF0IHx8IDApIDwgMjQgKiA2MCAqIDYwICogMTAwMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9zaWduZWRVcEFyZW5hcyA9IGRhdGEuc2lnbmVkVXBBcmVuYXMgfHwge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfliqDovb3nq57mioDlnLrmlbDmja7lpLHotKU6JywgZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHku47mnI3liqHnq6/ojrflj5bmiqXlkI3nirbmgIFcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIOWbnuiwg+WHveaVsCAoZXJyLCBzaWduZWRVcFJvb21zKVxuICAgICAqL1xuICAgIHRoYXQuZmV0Y2hTaWdudXBTdGF0dXNGcm9tU2VydmVyID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGFwaVVybCA9IHdpbmRvdy5kZWZpbmVzID8gd2luZG93LmRlZmluZXMuYXBpVXJsIDogJyc7XG4gICAgICAgIHZhciBjcnlwdG9LZXkgPSB3aW5kb3cuZGVmaW5lcyA/IHdpbmRvdy5kZWZpbmVzLmNyeXB0b0tleSA6ICcnO1xuICAgICAgICB2YXIgdG9rZW4gPSB3aW5kb3cubXlnbG9iYWwgJiYgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEgPyB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS50b2tlbiA6ICcnO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFhcGlVcmwgfHwgIXdpbmRvdy5IdHRwQVBJKSB7XG4gICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygnQVBJ5pyq6YWN572uJywgbnVsbCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIEh0dHBBUEkuZ2V0KFxuICAgICAgICAgICAgYXBpVXJsICsgJy9hcGkvdjEvYXJlbmEvc2lnbnVwLXN0YXR1cz90b2tlbj0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHRva2VuKSxcbiAgICAgICAgICAgIGNyeXB0b0tleSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+Pn++4jyBbYXJlbmFEYXRhXSDojrflj5bmiqXlkI3nirbmgIHlpLHotKU6XCIsIGVycik7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHNpZ25lZFVwUm9vbXMgPSBbXTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ICYmIChyZXN1bHQuY29kZSA9PT0gMCB8fCByZXN1bHQuZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSByZXN1bHQuZGF0YSB8fCByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgIHNpZ25lZFVwUm9vbXMgPSBkYXRhLnNpZ25lZF91cF9yb29tcyB8fCBbXTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOabtOaWsOacrOWcsOe8k+WtmFxuICAgICAgICAgICAgICAgICAgICB0aGF0Ll9zaWduZWRVcEFyZW5hcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpZ25lZFVwUm9vbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByb29tID0gc2lnbmVkVXBSb29tc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuX3NpZ25lZFVwQXJlbmFzW3Jvb20ucm9vbV9pZF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lnbnVwVGltZTogcm9vbS5zaWdudXBfdGltZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6ICdzaWduZWRfdXAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcmlvZE5vOiByb29tLnBlcmlvZF9ubyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWdudXBGZWU6IHJvb20uc2lnbnVwX2ZlZVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5L+d5a2Y5Yiw5pys5ZywXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2F2ZVRvTG9jYWwoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2sobnVsbCwgc2lnbmVkVXBSb29tcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfTtcbiAgICBcbiAgICAvKipcbiAgICAgKiDmuIXpmaTmiYDmnInmiqXlkI3nirbmgIHvvIjnlKjkuo7mtYvor5XmiJbph43nva7vvIlcbiAgICAgKi9cbiAgICB0aGF0LmNsZWFyQWxsU2lnbnVwU3RhdHVzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoYXQuX3NpZ25lZFVwQXJlbmFzID0ge307XG4gICAgICAgIHRoYXQuc2F2ZVRvTG9jYWwoKTtcbiAgICB9O1xuICAgIFxuICAgIC8vIOWIneWni+WMluaXtuWKoOi9veacrOWcsOaVsOaNrlxuICAgIHRoYXQubG9hZEZyb21Mb2NhbCgpO1xuICAgIFxuICAgIHJldHVybiB0aGF0O1xufSgpO1xuIl19