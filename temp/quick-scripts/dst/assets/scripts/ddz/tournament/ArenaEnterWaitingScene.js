
                (function() {
                    var nodeEnv = typeof require !== 'undefined' && typeof process !== 'undefined';
                    var __module = nodeEnv ? module : {exports:{}};
                    var __filename = 'preview-scripts/assets/scripts/ddz/tournament/ArenaEnterWaitingScene.js';
                    var __require = nodeEnv ? function (request) {
                        return cc.require(request);
                    } : function (request) {
                        return __quick_compile_project__.require(request, __filename);
                    };
                    function __define (exports, require, module) {
                        if (!nodeEnv) {__quick_compile_project__.registerModule(__filename, module);}"use strict";
cc._RF.push(module, 'becf0KiEm1GR5ggywQq+KZw', 'ArenaEnterWaitingScene');
// scripts/ddz/tournament/ArenaEnterWaitingScene.js

"use strict";

/**
 * ArenaEnterWaitingScene - 竞技场进入等待界面
 * 
 * 功能：
 * 1. 玩家点击"进入"按钮后显示此界面
 * 2. 显示60秒等待倒计时（服务端控制）
 * 3. 显示已进入玩家列表
 * 4. 等待阶段结束后显示分配阶段（10秒）
 * 5. 分配阶段结束后自动进入游戏
 * 
 * 消息监听：
 * - arena_waiting_status: 等待阶段状态推送
 * - arena_waiting_tick: 倒计时每秒更新
 * - arena_assign_start: 分配阶段开始
 */
// 等待阶段类型
var WaitingPhase = {
  WAITING: "waiting",
  // 等待玩家进入阶段（60秒）
  ASSIGNING: "assigning",
  // 分配阶段（10秒）
  ENTERING: "entering" // 进入游戏阶段

};
cc.Class({
  "extends": cc.Component,
  properties: {
    // 期号标签
    periodNoLabel: {
      type: cc.Label,
      "default": null
    },
    // 房间名称标签
    roomNameLabel: {
      type: cc.Label,
      "default": null
    },
    // 倒计时标签
    countdownLabel: {
      type: cc.Label,
      "default": null
    },
    // 提示消息标签
    messageLabel: {
      type: cc.Label,
      "default": null
    },
    // 玩家数量标签
    playerCountLabel: {
      type: cc.Label,
      "default": null
    },
    // 玩家列表容器
    playerListContainer: {
      type: cc.Node,
      "default": null
    },
    // 玩家项预制体
    playerItemPrefab: {
      type: cc.Prefab,
      "default": null
    },
    // loading动画节点
    loadingNode: {
      type: cc.Node,
      "default": null
    },
    // 阶段标签
    phaseLabel: {
      type: cc.Label,
      "default": null
    },
    // 进度条
    progressBar: {
      type: cc.ProgressBar,
      "default": null
    }
  },
  // LIFE-CYCLE CALLBACKS:
  onLoad: function onLoad() {
    // 初始化数据
    this._periodNo = "";
    this._roomId = 0;
    this._roomName = "";
    this._phase = WaitingPhase.WAITING;
    this._countdown = 60;
    this._totalPlayers = 0;
    this._enteredPlayers = 0;
    this._players = [];
    this._startTime = 0; // 注册事件监听

    this._registerEvents();

    console.log("🏟️ [ArenaEnterWaiting] 等待界面加载完成");
  },
  start: function start() {
    // 启动loading动画
    this._startLoadingAnimation();
  },
  onDestroy: function onDestroy() {
    // 取消事件监听
    this._unregisterEvents(); // 停止动画


    this._stopLoadingAnimation();
  },
  // ============================================================
  // 事件监听
  // ============================================================
  _registerEvents: function _registerEvents() {
    var self = this; // 🔧【修复】使用正确的事件监听方式
    // 获取全局事件监听器

    var myglobal = window.myglobal;
    var evt = myglobal && myglobal.eventlister;

    if (!evt) {
      console.error("🏟️ [ArenaEnterWaiting] 事件监听器不可用");
      return;
    } // 等待状态推送


    this._waitingStatusHandler = function (data) {
      console.log("🏟️ [ArenaEnterWaiting] 收到等待状态:", JSON.stringify(data));

      self._onWaitingStatus(data);
    };

    evt.on("arena_waiting_status_notify", this._waitingStatusHandler); // 倒计时更新

    this._waitingTickHandler = function (data) {
      console.log("🏟️ [ArenaEnterWaiting] 倒计时更新:", data.countdown);

      self._onWaitingTick(data);
    };

    evt.on("arena_waiting_tick_notify", this._waitingTickHandler); // 分配阶段开始

    this._assignStartHandler = function (data) {
      console.log("🏟️ [ArenaEnterWaiting] 分配阶段开始:", JSON.stringify(data));

      self._onAssignStart(data);
    };

    evt.on("arena_assign_start_notify", this._assignStartHandler);
    console.log("🏟️ [ArenaEnterWaiting] 事件监听注册完成");
  },
  _unregisterEvents: function _unregisterEvents() {
    // 🔧【修复】正确取消事件监听
    var myglobal = window.myglobal;
    var evt = myglobal && myglobal.eventlister;
    if (!evt) return;

    if (this._waitingStatusHandler) {
      evt.off("arena_waiting_status_notify", this._waitingStatusHandler);
    }

    if (this._waitingTickHandler) {
      evt.off("arena_waiting_tick_notify", this._waitingTickHandler);
    }

    if (this._assignStartHandler) {
      evt.off("arena_assign_start_notify", this._assignStartHandler);
    }

    console.log("🏟️ [ArenaEnterWaiting] 事件监听已取消");
  },
  // ============================================================
  // 公共方法
  // ============================================================

  /**
   * 设置初始数据
   * @param {Object} data - { period_no, room_id, room_name, phase, countdown, total_players, entered_players, players, message }
   */
  setData: function setData(data) {
    this._periodNo = data.period_no || "";
    this._roomId = data.room_id || 0;
    this._roomName = data.room_name || "";
    this._phase = data.phase || WaitingPhase.WAITING;
    this._countdown = data.countdown || 60;
    this._totalPlayers = data.total_players || 0;
    this._enteredPlayers = data.entered_players || 0;
    this._players = data.players || [];
    this._startTime = data.start_time || Date.now();

    this._updateUI();
  },
  // ============================================================
  // 事件处理
  // ============================================================
  _onWaitingStatus: function _onWaitingStatus(data) {
    // 检查期号是否匹配
    if (this._periodNo && data.period_no !== this._periodNo) {
      return;
    }

    this._periodNo = data.period_no;
    this._roomId = data.room_id;
    this._roomName = data.room_name;
    this._phase = data.phase;
    this._countdown = data.countdown;
    this._totalPlayers = data.total_players;
    this._enteredPlayers = data.entered_players;
    this._players = data.players;
    this._startTime = data.start_time;

    this._updateUI();
  },
  _onWaitingTick: function _onWaitingTick(data) {
    // 检查期号是否匹配
    if (this._periodNo && data.period_no !== this._periodNo) {
      return;
    }

    this._countdown = data.countdown;
    this._enteredPlayers = data.entered_players;

    this._updateCountdownUI();

    this._updatePlayerCountUI();
  },
  _onAssignStart: function _onAssignStart(data) {
    // 检查期号是否匹配
    if (this._periodNo && data.period_no !== this._periodNo) {
      return;
    }

    this._phase = WaitingPhase.ASSIGNING;
    this._countdown = data.countdown;
    this._totalPlayers = data.total_players;
    this._enteredPlayers = data.total_players; // 分配阶段所有玩家都已进入

    this._updateUI(); // 显示分配消息


    if (this.messageLabel) {
      this.messageLabel.string = data.message || "正在分配玩家，即将进入游戏...";
      this.messageLabel.node.color = new cc.Color(255, 220, 100);
    }
  },
  // ============================================================
  // UI更新
  // ============================================================
  _updateUI: function _updateUI() {
    // 更新期号
    if (this.periodNoLabel) {
      this.periodNoLabel.string = "期号: " + this._periodNo;
    } // 更新房间名称


    if (this.roomNameLabel) {
      this.roomNameLabel.string = this._roomName || "竞技场";
    } // 更新倒计时


    this._updateCountdownUI(); // 更新玩家数量


    this._updatePlayerCountUI(); // 更新阶段显示


    this._updatePhaseUI(); // 更新玩家列表


    this._updatePlayerListUI(); // 更新进度条


    this._updateProgressBar();
  },
  _updateCountdownUI: function _updateCountdownUI() {
    if (this.countdownLabel) {
      this.countdownLabel.string = this._countdown + "秒"; // 最后10秒变红闪烁

      if (this._countdown <= 10 && this._countdown > 0) {
        this.countdownLabel.node.color = new cc.Color(255, 100, 100); // 闪烁效果

        this._startCountdownFlash();
      } else {
        this.countdownLabel.node.color = new cc.Color(255, 255, 255);

        this._stopCountdownFlash();
      }
    }
  },
  _updatePlayerCountUI: function _updatePlayerCountUI() {
    if (this.playerCountLabel) {
      this.playerCountLabel.string = "已进入: " + this._enteredPlayers + " / " + this._totalPlayers;
    }
  },
  _updatePhaseUI: function _updatePhaseUI() {
    if (this.phaseLabel) {
      switch (this._phase) {
        case WaitingPhase.WAITING:
          this.phaseLabel.string = "等待玩家进入";
          this.phaseLabel.node.color = new cc.Color(100, 200, 255);
          break;

        case WaitingPhase.ASSIGNING:
          this.phaseLabel.string = "正在分配玩家";
          this.phaseLabel.node.color = new cc.Color(255, 220, 100);
          break;

        case WaitingPhase.ENTERING:
          this.phaseLabel.string = "即将进入游戏";
          this.phaseLabel.node.color = new cc.Color(100, 255, 100);
          break;
      }
    } // 更新提示消息


    if (this.messageLabel) {
      switch (this._phase) {
        case WaitingPhase.WAITING:
          this.messageLabel.string = "等待其他玩家进入...";
          this.messageLabel.node.color = new cc.Color(200, 200, 220);
          break;

        case WaitingPhase.ASSIGNING:
          this.messageLabel.string = "正在分配玩家到各桌...";
          this.messageLabel.node.color = new cc.Color(255, 220, 100);
          break;

        case WaitingPhase.ENTERING:
          this.messageLabel.string = "正在进入游戏...";
          this.messageLabel.node.color = new cc.Color(100, 255, 100);
          break;
      }
    }
  },
  _updatePlayerListUI: function _updatePlayerListUI() {
    if (!this.playerListContainer) return; // 清空现有列表

    this.playerListContainer.removeAllChildren(); // 添加玩家项

    for (var i = 0; i < this._players.length; i++) {
      var player = this._players[i];

      this._createPlayerItem(player, i);
    }
  },
  _createPlayerItem: function _createPlayerItem(player, index) {
    var itemNode = new cc.Node("PlayerItem_" + index);
    itemNode.setContentSize(cc.size(200, 40)); // 背景色

    var bgNode = new cc.Node("Bg");
    var graphics = bgNode.addComponent(cc.Graphics);
    graphics.fillColor = new cc.Color(50, 50, 70, 150);
    graphics.roundRect(-100, -20, 200, 40, 5);
    graphics.fill();
    bgNode.parent = itemNode; // 玩家名称

    var nameLabel = new cc.Node("NameLabel");
    var label = nameLabel.addComponent(cc.Label);
    label.string = player.player_name || "玩家" + player.player_id;
    label.fontSize = 18;
    label.lineHeight = 24; // 🔧【修复】机器人和真人使用相同颜色，不再区分

    nameLabel.color = new cc.Color(255, 255, 255);
    nameLabel.setPosition(-40, 0);
    nameLabel.anchorX = 0;
    nameLabel.parent = itemNode; // 🔧【移除】不再显示机器人标识，让机器人看起来跟真人一样
    // 添加到容器

    var yPos = -index * 50;

    if (this.playerListContainer.children.length > 0) {
      var lastChild = this.playerListContainer.children[this.playerListContainer.children.length - 1];
      yPos = lastChild.y - 50;
    }

    itemNode.setPosition(0, yPos > 0 ? 0 : yPos);
    itemNode.parent = this.playerListContainer;
  },
  _updateProgressBar: function _updateProgressBar() {
    if (this.progressBar && this._totalPlayers > 0) {
      var progress = this._enteredPlayers / this._totalPlayers;
      this.progressBar.progress = Math.min(progress, 1.0);
    }
  },
  // ============================================================
  // 动画
  // ============================================================
  _startLoadingAnimation: function _startLoadingAnimation() {
    if (!this.loadingNode) return;
    var rotateAction = cc.rotateBy(2, 360);
    var repeatAction = cc.repeatForever(rotateAction);
    this.loadingNode.runAction(repeatAction);
  },
  _stopLoadingAnimation: function _stopLoadingAnimation() {
    if (this.loadingNode) {
      this.loadingNode.stopAllActions();
    }
  },
  _startCountdownFlash: function _startCountdownFlash() {
    if (!this.countdownLabel) return; // 闪烁效果

    this._flashAction = cc.sequence(cc.fadeTo(0.3, 128), cc.fadeTo(0.3, 255));
    this._flashAction = cc.repeatForever(this._flashAction);
    this.countdownLabel.node.runAction(this._flashAction);
  },
  _stopCountdownFlash: function _stopCountdownFlash() {
    if (this.countdownLabel && this._flashAction) {
      this.countdownLabel.node.stopAction(this._flashAction);
      this.countdownLabel.node.opacity = 255;
    }
  },
  // ============================================================
  // 按钮事件
  // ============================================================

  /**
   * 取消进入（返回大厅）
   */
  onCancelClick: function onCancelClick() {
    console.log("🏟️ [ArenaEnterWaiting] 玩家点击取消"); // 发送取消进入请求

    if (window.myglobal && window.myglobal.socket) {
      window.myglobal.socket.emit("arena_cancel_enter", {
        period_no: this._periodNo,
        room_id: this._roomId
      });
    } // 返回大厅


    cc.director.loadScene("hallScene");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2Rkei90b3VybmFtZW50L0FyZW5hRW50ZXJXYWl0aW5nU2NlbmUuanMiXSwibmFtZXMiOlsiV2FpdGluZ1BoYXNlIiwiV0FJVElORyIsIkFTU0lHTklORyIsIkVOVEVSSU5HIiwiY2MiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJwZXJpb2ROb0xhYmVsIiwidHlwZSIsIkxhYmVsIiwicm9vbU5hbWVMYWJlbCIsImNvdW50ZG93bkxhYmVsIiwibWVzc2FnZUxhYmVsIiwicGxheWVyQ291bnRMYWJlbCIsInBsYXllckxpc3RDb250YWluZXIiLCJOb2RlIiwicGxheWVySXRlbVByZWZhYiIsIlByZWZhYiIsImxvYWRpbmdOb2RlIiwicGhhc2VMYWJlbCIsInByb2dyZXNzQmFyIiwiUHJvZ3Jlc3NCYXIiLCJvbkxvYWQiLCJfcGVyaW9kTm8iLCJfcm9vbUlkIiwiX3Jvb21OYW1lIiwiX3BoYXNlIiwiX2NvdW50ZG93biIsIl90b3RhbFBsYXllcnMiLCJfZW50ZXJlZFBsYXllcnMiLCJfcGxheWVycyIsIl9zdGFydFRpbWUiLCJfcmVnaXN0ZXJFdmVudHMiLCJjb25zb2xlIiwibG9nIiwic3RhcnQiLCJfc3RhcnRMb2FkaW5nQW5pbWF0aW9uIiwib25EZXN0cm95IiwiX3VucmVnaXN0ZXJFdmVudHMiLCJfc3RvcExvYWRpbmdBbmltYXRpb24iLCJzZWxmIiwibXlnbG9iYWwiLCJ3aW5kb3ciLCJldnQiLCJldmVudGxpc3RlciIsImVycm9yIiwiX3dhaXRpbmdTdGF0dXNIYW5kbGVyIiwiZGF0YSIsIkpTT04iLCJzdHJpbmdpZnkiLCJfb25XYWl0aW5nU3RhdHVzIiwib24iLCJfd2FpdGluZ1RpY2tIYW5kbGVyIiwiY291bnRkb3duIiwiX29uV2FpdGluZ1RpY2siLCJfYXNzaWduU3RhcnRIYW5kbGVyIiwiX29uQXNzaWduU3RhcnQiLCJvZmYiLCJzZXREYXRhIiwicGVyaW9kX25vIiwicm9vbV9pZCIsInJvb21fbmFtZSIsInBoYXNlIiwidG90YWxfcGxheWVycyIsImVudGVyZWRfcGxheWVycyIsInBsYXllcnMiLCJzdGFydF90aW1lIiwiRGF0ZSIsIm5vdyIsIl91cGRhdGVVSSIsIl91cGRhdGVDb3VudGRvd25VSSIsIl91cGRhdGVQbGF5ZXJDb3VudFVJIiwic3RyaW5nIiwibWVzc2FnZSIsIm5vZGUiLCJjb2xvciIsIkNvbG9yIiwiX3VwZGF0ZVBoYXNlVUkiLCJfdXBkYXRlUGxheWVyTGlzdFVJIiwiX3VwZGF0ZVByb2dyZXNzQmFyIiwiX3N0YXJ0Q291bnRkb3duRmxhc2giLCJfc3RvcENvdW50ZG93bkZsYXNoIiwicmVtb3ZlQWxsQ2hpbGRyZW4iLCJpIiwibGVuZ3RoIiwicGxheWVyIiwiX2NyZWF0ZVBsYXllckl0ZW0iLCJpbmRleCIsIml0ZW1Ob2RlIiwic2V0Q29udGVudFNpemUiLCJzaXplIiwiYmdOb2RlIiwiZ3JhcGhpY3MiLCJhZGRDb21wb25lbnQiLCJHcmFwaGljcyIsImZpbGxDb2xvciIsInJvdW5kUmVjdCIsImZpbGwiLCJwYXJlbnQiLCJuYW1lTGFiZWwiLCJsYWJlbCIsInBsYXllcl9uYW1lIiwicGxheWVyX2lkIiwiZm9udFNpemUiLCJsaW5lSGVpZ2h0Iiwic2V0UG9zaXRpb24iLCJhbmNob3JYIiwieVBvcyIsImNoaWxkcmVuIiwibGFzdENoaWxkIiwieSIsInByb2dyZXNzIiwiTWF0aCIsIm1pbiIsInJvdGF0ZUFjdGlvbiIsInJvdGF0ZUJ5IiwicmVwZWF0QWN0aW9uIiwicmVwZWF0Rm9yZXZlciIsInJ1bkFjdGlvbiIsInN0b3BBbGxBY3Rpb25zIiwiX2ZsYXNoQWN0aW9uIiwic2VxdWVuY2UiLCJmYWRlVG8iLCJzdG9wQWN0aW9uIiwib3BhY2l0eSIsIm9uQ2FuY2VsQ2xpY2siLCJzb2NrZXQiLCJlbWl0IiwiZGlyZWN0b3IiLCJsb2FkU2NlbmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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Q3VILE1BQUgsQ0FBVSxHQUFWLEVBQWUsR0FBZixDQUZnQixDQUFwQjtJQUlBLEtBQUtGLFlBQUwsR0FBb0JySCxFQUFFLENBQUNrSCxhQUFILENBQWlCLEtBQUtHLFlBQXRCLENBQXBCO0lBQ0EsS0FBSzdHLGNBQUwsQ0FBb0IrRCxJQUFwQixDQUF5QjRDLFNBQXpCLENBQW1DLEtBQUtFLFlBQXhDO0VBQ0gsQ0FsWkk7RUFvWkx2QyxtQkFBbUIsRUFBRSwrQkFBVztJQUM1QixJQUFJLEtBQUt0RSxjQUFMLElBQXVCLEtBQUs2RyxZQUFoQyxFQUE4QztNQUMxQyxLQUFLN0csY0FBTCxDQUFvQitELElBQXBCLENBQXlCaUQsVUFBekIsQ0FBb0MsS0FBS0gsWUFBekM7TUFDQSxLQUFLN0csY0FBTCxDQUFvQitELElBQXBCLENBQXlCa0QsT0FBekIsR0FBbUMsR0FBbkM7SUFDSDtFQUNKLENBelpJO0VBMlpMO0VBQ0E7RUFDQTs7RUFFQTtBQUNKO0FBQ0E7RUFDSUMsYUFBYSxFQUFFLHlCQUFXO0lBQ3RCNUYsT0FBTyxDQUFDQyxHQUFSLENBQVksZ0NBQVosRUFEc0IsQ0FHdEI7O0lBQ0EsSUFBSVEsTUFBTSxDQUFDRCxRQUFQLElBQW1CQyxNQUFNLENBQUNELFFBQVAsQ0FBZ0JxRixNQUF2QyxFQUErQztNQUMzQ3BGLE1BQU0sQ0FBQ0QsUUFBUCxDQUFnQnFGLE1BQWhCLENBQXVCQyxJQUF2QixDQUE0QixvQkFBNUIsRUFBa0Q7UUFDOUNwRSxTQUFTLEVBQUUsS0FBS3BDLFNBRDhCO1FBRTlDcUMsT0FBTyxFQUFFLEtBQUtwQztNQUZnQyxDQUFsRDtJQUlILENBVHFCLENBV3RCOzs7SUFDQXJCLEVBQUUsQ0FBQzZILFFBQUgsQ0FBWUMsU0FBWixDQUFzQixXQUF0QjtFQUNIO0FBL2FJLENBQVQiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQXJlbmFFbnRlcldhaXRpbmdTY2VuZSAtIOernuaKgOWcuui/m+WFpeetieW+heeVjOmdolxuICogXG4gKiDlip/og73vvJpcbiAqIDEuIOeOqeWutueCueWHu1wi6L+b5YWlXCLmjInpkq7lkI7mmL7npLrmraTnlYzpnaJcbiAqIDIuIOaYvuekujYw56eS562J5b6F5YCS6K6h5pe277yI5pyN5Yqh56uv5o6n5Yi277yJXG4gKiAzLiDmmL7npLrlt7Lov5vlhaXnjqnlrrbliJfooahcbiAqIDQuIOetieW+hemYtuautee7k+adn+WQjuaYvuekuuWIhumFjemYtuaute+8iDEw56eS77yJXG4gKiA1LiDliIbphY3pmLbmrrXnu5PmnZ/lkI7oh6rliqjov5vlhaXmuLjmiI9cbiAqIFxuICog5raI5oGv55uR5ZCs77yaXG4gKiAtIGFyZW5hX3dhaXRpbmdfc3RhdHVzOiDnrYnlvoXpmLbmrrXnirbmgIHmjqjpgIFcbiAqIC0gYXJlbmFfd2FpdGluZ190aWNrOiDlgJLorqHml7bmr4/np5Lmm7TmlrBcbiAqIC0gYXJlbmFfYXNzaWduX3N0YXJ0OiDliIbphY3pmLbmrrXlvIDlp4tcbiAqL1xuXG4vLyDnrYnlvoXpmLbmrrXnsbvlnotcbmNvbnN0IFdhaXRpbmdQaGFzZSA9IHtcbiAgICBXQUlUSU5HOiBcIndhaXRpbmdcIiwgICAgICAgLy8g562J5b6F546p5a626L+b5YWl6Zi25q6177yINjDnp5LvvIlcbiAgICBBU1NJR05JTkc6IFwiYXNzaWduaW5nXCIsICAgLy8g5YiG6YWN6Zi25q6177yIMTDnp5LvvIlcbiAgICBFTlRFUklORzogXCJlbnRlcmluZ1wiICAgICAgLy8g6L+b5YWl5ri45oiP6Zi25q61XG59O1xuXG5jYy5DbGFzcyh7XG4gICAgZXh0ZW5kczogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICAvLyDmnJ/lj7fmoIfnrb5cbiAgICAgICAgcGVyaW9kTm9MYWJlbDoge1xuICAgICAgICAgICAgdHlwZTogY2MuTGFiZWwsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOaIv+mXtOWQjeensOagh+etvlxuICAgICAgICByb29tTmFtZUxhYmVsOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5MYWJlbCxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgLy8g5YCS6K6h5pe25qCH562+XG4gICAgICAgIGNvdW50ZG93bkxhYmVsOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5MYWJlbCxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgLy8g5o+Q56S65raI5oGv5qCH562+XG4gICAgICAgIG1lc3NhZ2VMYWJlbDoge1xuICAgICAgICAgICAgdHlwZTogY2MuTGFiZWwsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOeOqeWutuaVsOmHj+agh+etvlxuICAgICAgICBwbGF5ZXJDb3VudExhYmVsOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5MYWJlbCxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgLy8g546p5a625YiX6KGo5a655ZmoXG4gICAgICAgIHBsYXllckxpc3RDb250YWluZXI6IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLk5vZGUsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOeOqeWutumhuemihOWItuS9k1xuICAgICAgICBwbGF5ZXJJdGVtUHJlZmFiOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5QcmVmYWIsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIGxvYWRpbmfliqjnlLvoioLngrlcbiAgICAgICAgbG9hZGluZ05vZGU6IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLk5vZGUsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOmYtuauteagh+etvlxuICAgICAgICBwaGFzZUxhYmVsOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5MYWJlbCxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgLy8g6L+b5bqm5p2hXG4gICAgICAgIHByb2dyZXNzQmFyOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5Qcm9ncmVzc0JhcixcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBMSUZFLUNZQ0xFIENBTExCQUNLUzpcblxuICAgIG9uTG9hZCAoKSB7XG4gICAgICAgIC8vIOWIneWni+WMluaVsOaNrlxuICAgICAgICB0aGlzLl9wZXJpb2RObyA9IFwiXCJcbiAgICAgICAgdGhpcy5fcm9vbUlkID0gMFxuICAgICAgICB0aGlzLl9yb29tTmFtZSA9IFwiXCJcbiAgICAgICAgdGhpcy5fcGhhc2UgPSBXYWl0aW5nUGhhc2UuV0FJVElOR1xuICAgICAgICB0aGlzLl9jb3VudGRvd24gPSA2MFxuICAgICAgICB0aGlzLl90b3RhbFBsYXllcnMgPSAwXG4gICAgICAgIHRoaXMuX2VudGVyZWRQbGF5ZXJzID0gMFxuICAgICAgICB0aGlzLl9wbGF5ZXJzID0gW11cbiAgICAgICAgdGhpcy5fc3RhcnRUaW1lID0gMFxuICAgICAgICBcbiAgICAgICAgLy8g5rOo5YaM5LqL5Lu255uR5ZCsXG4gICAgICAgIHRoaXMuX3JlZ2lzdGVyRXZlbnRzKClcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFFbnRlcldhaXRpbmddIOetieW+heeVjOmdouWKoOi9veWujOaIkFwiKVxuICAgIH0sXG5cbiAgICBzdGFydCAoKSB7XG4gICAgICAgIC8vIOWQr+WKqGxvYWRpbmfliqjnlLtcbiAgICAgICAgdGhpcy5fc3RhcnRMb2FkaW5nQW5pbWF0aW9uKClcbiAgICB9LFxuXG4gICAgb25EZXN0cm95ICgpIHtcbiAgICAgICAgLy8g5Y+W5raI5LqL5Lu255uR5ZCsXG4gICAgICAgIHRoaXMuX3VucmVnaXN0ZXJFdmVudHMoKVxuICAgICAgICBcbiAgICAgICAgLy8g5YGc5q2i5Yqo55S7XG4gICAgICAgIHRoaXMuX3N0b3BMb2FkaW5nQW5pbWF0aW9uKClcbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g5LqL5Lu255uR5ZCsXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBfcmVnaXN0ZXJFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkvb/nlKjmraPnoa7nmoTkuovku7bnm5HlkKzmlrnlvI9cbiAgICAgICAgLy8g6I635Y+W5YWo5bGA5LqL5Lu255uR5ZCs5ZmoXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICB2YXIgZXZ0ID0gbXlnbG9iYWwgJiYgbXlnbG9iYWwuZXZlbnRsaXN0ZXJcbiAgICAgICAgXG4gICAgICAgIGlmICghZXZ0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+Pn++4jyBbQXJlbmFFbnRlcldhaXRpbmddIOS6i+S7tuebkeWQrOWZqOS4jeWPr+eUqFwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOetieW+heeKtuaAgeaOqOmAgVxuICAgICAgICB0aGlzLl93YWl0aW5nU3RhdHVzSGFuZGxlciA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFFbnRlcldhaXRpbmddIOaUtuWIsOetieW+heeKtuaAgTpcIiwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgICAgICAgICBzZWxmLl9vbldhaXRpbmdTdGF0dXMoZGF0YSlcbiAgICAgICAgfVxuICAgICAgICBldnQub24oXCJhcmVuYV93YWl0aW5nX3N0YXR1c19ub3RpZnlcIiwgdGhpcy5fd2FpdGluZ1N0YXR1c0hhbmRsZXIpXG4gICAgICAgIFxuICAgICAgICAvLyDlgJLorqHml7bmm7TmlrBcbiAgICAgICAgdGhpcy5fd2FpdGluZ1RpY2tIYW5kbGVyID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYUVudGVyV2FpdGluZ10g5YCS6K6h5pe25pu05pawOlwiLCBkYXRhLmNvdW50ZG93bilcbiAgICAgICAgICAgIHNlbGYuX29uV2FpdGluZ1RpY2soZGF0YSlcbiAgICAgICAgfVxuICAgICAgICBldnQub24oXCJhcmVuYV93YWl0aW5nX3RpY2tfbm90aWZ5XCIsIHRoaXMuX3dhaXRpbmdUaWNrSGFuZGxlcilcbiAgICAgICAgXG4gICAgICAgIC8vIOWIhumFjemYtuauteW8gOWni1xuICAgICAgICB0aGlzLl9hc3NpZ25TdGFydEhhbmRsZXIgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hRW50ZXJXYWl0aW5nXSDliIbphY3pmLbmrrXlvIDlp4s6XCIsIEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICAgICAgICAgc2VsZi5fb25Bc3NpZ25TdGFydChkYXRhKVxuICAgICAgICB9XG4gICAgICAgIGV2dC5vbihcImFyZW5hX2Fzc2lnbl9zdGFydF9ub3RpZnlcIiwgdGhpcy5fYXNzaWduU3RhcnRIYW5kbGVyKVxuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYUVudGVyV2FpdGluZ10g5LqL5Lu255uR5ZCs5rOo5YaM5a6M5oiQXCIpXG4gICAgfSxcblxuICAgIF91bnJlZ2lzdGVyRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeato+ehruWPlua2iOS6i+S7tuebkeWQrFxuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgdmFyIGV2dCA9IG15Z2xvYmFsICYmIG15Z2xvYmFsLmV2ZW50bGlzdGVyXG4gICAgICAgIFxuICAgICAgICBpZiAoIWV2dCkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5fd2FpdGluZ1N0YXR1c0hhbmRsZXIpIHtcbiAgICAgICAgICAgIGV2dC5vZmYoXCJhcmVuYV93YWl0aW5nX3N0YXR1c19ub3RpZnlcIiwgdGhpcy5fd2FpdGluZ1N0YXR1c0hhbmRsZXIpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3dhaXRpbmdUaWNrSGFuZGxlcikge1xuICAgICAgICAgICAgZXZ0Lm9mZihcImFyZW5hX3dhaXRpbmdfdGlja19ub3RpZnlcIiwgdGhpcy5fd2FpdGluZ1RpY2tIYW5kbGVyKVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9hc3NpZ25TdGFydEhhbmRsZXIpIHtcbiAgICAgICAgICAgIGV2dC5vZmYoXCJhcmVuYV9hc3NpZ25fc3RhcnRfbm90aWZ5XCIsIHRoaXMuX2Fzc2lnblN0YXJ0SGFuZGxlcilcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYUVudGVyV2FpdGluZ10g5LqL5Lu255uR5ZCs5bey5Y+W5raIXCIpXG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOWFrOWFseaWueazlVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICog6K6+572u5Yid5aeL5pWw5o2uXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSB7IHBlcmlvZF9ubywgcm9vbV9pZCwgcm9vbV9uYW1lLCBwaGFzZSwgY291bnRkb3duLCB0b3RhbF9wbGF5ZXJzLCBlbnRlcmVkX3BsYXllcnMsIHBsYXllcnMsIG1lc3NhZ2UgfVxuICAgICAqL1xuICAgIHNldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGhpcy5fcGVyaW9kTm8gPSBkYXRhLnBlcmlvZF9ubyB8fCBcIlwiXG4gICAgICAgIHRoaXMuX3Jvb21JZCA9IGRhdGEucm9vbV9pZCB8fCAwXG4gICAgICAgIHRoaXMuX3Jvb21OYW1lID0gZGF0YS5yb29tX25hbWUgfHwgXCJcIlxuICAgICAgICB0aGlzLl9waGFzZSA9IGRhdGEucGhhc2UgfHwgV2FpdGluZ1BoYXNlLldBSVRJTkdcbiAgICAgICAgdGhpcy5fY291bnRkb3duID0gZGF0YS5jb3VudGRvd24gfHwgNjBcbiAgICAgICAgdGhpcy5fdG90YWxQbGF5ZXJzID0gZGF0YS50b3RhbF9wbGF5ZXJzIHx8IDBcbiAgICAgICAgdGhpcy5fZW50ZXJlZFBsYXllcnMgPSBkYXRhLmVudGVyZWRfcGxheWVycyB8fCAwXG4gICAgICAgIHRoaXMuX3BsYXllcnMgPSBkYXRhLnBsYXllcnMgfHwgW11cbiAgICAgICAgdGhpcy5fc3RhcnRUaW1lID0gZGF0YS5zdGFydF90aW1lIHx8IERhdGUubm93KClcbiAgICAgICAgXG4gICAgICAgIHRoaXMuX3VwZGF0ZVVJKClcbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g5LqL5Lu25aSE55CGXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBfb25XYWl0aW5nU3RhdHVzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIC8vIOajgOafpeacn+WPt+aYr+WQpuWMuemFjVxuICAgICAgICBpZiAodGhpcy5fcGVyaW9kTm8gJiYgZGF0YS5wZXJpb2Rfbm8gIT09IHRoaXMuX3BlcmlvZE5vKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5fcGVyaW9kTm8gPSBkYXRhLnBlcmlvZF9ub1xuICAgICAgICB0aGlzLl9yb29tSWQgPSBkYXRhLnJvb21faWRcbiAgICAgICAgdGhpcy5fcm9vbU5hbWUgPSBkYXRhLnJvb21fbmFtZVxuICAgICAgICB0aGlzLl9waGFzZSA9IGRhdGEucGhhc2VcbiAgICAgICAgdGhpcy5fY291bnRkb3duID0gZGF0YS5jb3VudGRvd25cbiAgICAgICAgdGhpcy5fdG90YWxQbGF5ZXJzID0gZGF0YS50b3RhbF9wbGF5ZXJzXG4gICAgICAgIHRoaXMuX2VudGVyZWRQbGF5ZXJzID0gZGF0YS5lbnRlcmVkX3BsYXllcnNcbiAgICAgICAgdGhpcy5fcGxheWVycyA9IGRhdGEucGxheWVyc1xuICAgICAgICB0aGlzLl9zdGFydFRpbWUgPSBkYXRhLnN0YXJ0X3RpbWVcbiAgICAgICAgXG4gICAgICAgIHRoaXMuX3VwZGF0ZVVJKClcbiAgICB9LFxuXG4gICAgX29uV2FpdGluZ1RpY2s6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgLy8g5qOA5p+l5pyf5Y+35piv5ZCm5Yy56YWNXG4gICAgICAgIGlmICh0aGlzLl9wZXJpb2RObyAmJiBkYXRhLnBlcmlvZF9ubyAhPT0gdGhpcy5fcGVyaW9kTm8pIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9jb3VudGRvd24gPSBkYXRhLmNvdW50ZG93blxuICAgICAgICB0aGlzLl9lbnRlcmVkUGxheWVycyA9IGRhdGEuZW50ZXJlZF9wbGF5ZXJzXG4gICAgICAgIFxuICAgICAgICB0aGlzLl91cGRhdGVDb3VudGRvd25VSSgpXG4gICAgICAgIHRoaXMuX3VwZGF0ZVBsYXllckNvdW50VUkoKVxuICAgIH0sXG5cbiAgICBfb25Bc3NpZ25TdGFydDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAvLyDmo4Dmn6XmnJ/lj7fmmK/lkKbljLnphY1cbiAgICAgICAgaWYgKHRoaXMuX3BlcmlvZE5vICYmIGRhdGEucGVyaW9kX25vICE9PSB0aGlzLl9wZXJpb2RObykge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX3BoYXNlID0gV2FpdGluZ1BoYXNlLkFTU0lHTklOR1xuICAgICAgICB0aGlzLl9jb3VudGRvd24gPSBkYXRhLmNvdW50ZG93blxuICAgICAgICB0aGlzLl90b3RhbFBsYXllcnMgPSBkYXRhLnRvdGFsX3BsYXllcnNcbiAgICAgICAgdGhpcy5fZW50ZXJlZFBsYXllcnMgPSBkYXRhLnRvdGFsX3BsYXllcnMgLy8g5YiG6YWN6Zi25q615omA5pyJ546p5a626YO95bey6L+b5YWlXG4gICAgICAgIFxuICAgICAgICB0aGlzLl91cGRhdGVVSSgpXG4gICAgICAgIFxuICAgICAgICAvLyDmmL7npLrliIbphY3mtojmga9cbiAgICAgICAgaWYgKHRoaXMubWVzc2FnZUxhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VMYWJlbC5zdHJpbmcgPSBkYXRhLm1lc3NhZ2UgfHwgXCLmraPlnKjliIbphY3njqnlrrbvvIzljbPlsIbov5vlhaXmuLjmiI8uLi5cIlxuICAgICAgICAgICAgdGhpcy5tZXNzYWdlTGFiZWwubm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIyMCwgMTAwKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIFVJ5pu05pawXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBfdXBkYXRlVUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDmm7TmlrDmnJ/lj7dcbiAgICAgICAgaWYgKHRoaXMucGVyaW9kTm9MYWJlbCkge1xuICAgICAgICAgICAgdGhpcy5wZXJpb2ROb0xhYmVsLnN0cmluZyA9IFwi5pyf5Y+3OiBcIiArIHRoaXMuX3BlcmlvZE5vXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOaIv+mXtOWQjeensFxuICAgICAgICBpZiAodGhpcy5yb29tTmFtZUxhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLnJvb21OYW1lTGFiZWwuc3RyaW5nID0gdGhpcy5fcm9vbU5hbWUgfHwgXCLnq57mioDlnLpcIlxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDlgJLorqHml7ZcbiAgICAgICAgdGhpcy5fdXBkYXRlQ291bnRkb3duVUkoKVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw546p5a625pWw6YePXG4gICAgICAgIHRoaXMuX3VwZGF0ZVBsYXllckNvdW50VUkoKVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw6Zi25q615pi+56S6XG4gICAgICAgIHRoaXMuX3VwZGF0ZVBoYXNlVUkoKVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw546p5a625YiX6KGoXG4gICAgICAgIHRoaXMuX3VwZGF0ZVBsYXllckxpc3RVSSgpXG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDov5vluqbmnaFcbiAgICAgICAgdGhpcy5fdXBkYXRlUHJvZ3Jlc3NCYXIoKVxuICAgIH0sXG5cbiAgICBfdXBkYXRlQ291bnRkb3duVUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5jb3VudGRvd25MYWJlbCkge1xuICAgICAgICAgICAgdGhpcy5jb3VudGRvd25MYWJlbC5zdHJpbmcgPSB0aGlzLl9jb3VudGRvd24gKyBcIuenklwiXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOacgOWQjjEw56eS5Y+Y57qi6Zeq54OBXG4gICAgICAgICAgICBpZiAodGhpcy5fY291bnRkb3duIDw9IDEwICYmIHRoaXMuX2NvdW50ZG93biA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvdW50ZG93bkxhYmVsLm5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAxMDAsIDEwMClcbiAgICAgICAgICAgICAgICAvLyDpl6rng4HmlYjmnpxcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGFydENvdW50ZG93bkZsYXNoKClcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudGRvd25MYWJlbC5ub2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcENvdW50ZG93bkZsYXNoKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfdXBkYXRlUGxheWVyQ291bnRVSTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnBsYXllckNvdW50TGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMucGxheWVyQ291bnRMYWJlbC5zdHJpbmcgPSBcIuW3sui/m+WFpTogXCIgKyB0aGlzLl9lbnRlcmVkUGxheWVycyArIFwiIC8gXCIgKyB0aGlzLl90b3RhbFBsYXllcnNcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfdXBkYXRlUGhhc2VVSTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnBoYXNlTGFiZWwpIHtcbiAgICAgICAgICAgIHN3aXRjaCAodGhpcy5fcGhhc2UpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFdhaXRpbmdQaGFzZS5XQUlUSU5HOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBoYXNlTGFiZWwuc3RyaW5nID0gXCLnrYnlvoXnjqnlrrbov5vlhaVcIlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBoYXNlTGFiZWwubm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigxMDAsIDIwMCwgMjU1KVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIGNhc2UgV2FpdGluZ1BoYXNlLkFTU0lHTklORzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5waGFzZUxhYmVsLnN0cmluZyA9IFwi5q2j5Zyo5YiG6YWN546p5a62XCJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5waGFzZUxhYmVsLm5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMjAsIDEwMClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBjYXNlIFdhaXRpbmdQaGFzZS5FTlRFUklORzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5waGFzZUxhYmVsLnN0cmluZyA9IFwi5Y2z5bCG6L+b5YWl5ri45oiPXCJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5waGFzZUxhYmVsLm5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMTAwLCAyNTUsIDEwMClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw5o+Q56S65raI5oGvXG4gICAgICAgIGlmICh0aGlzLm1lc3NhZ2VMYWJlbCkge1xuICAgICAgICAgICAgc3dpdGNoICh0aGlzLl9waGFzZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgV2FpdGluZ1BoYXNlLldBSVRJTkc6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZUxhYmVsLnN0cmluZyA9IFwi562J5b6F5YW25LuW546p5a626L+b5YWlLi4uXCJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlTGFiZWwubm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyMDAsIDIwMCwgMjIwKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIGNhc2UgV2FpdGluZ1BoYXNlLkFTU0lHTklORzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlTGFiZWwuc3RyaW5nID0gXCLmraPlnKjliIbphY3njqnlrrbliLDlkITmoYwuLi5cIlxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VMYWJlbC5ub2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjIwLCAxMDApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgY2FzZSBXYWl0aW5nUGhhc2UuRU5URVJJTkc6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZUxhYmVsLnN0cmluZyA9IFwi5q2j5Zyo6L+b5YWl5ri45oiPLi4uXCJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlTGFiZWwubm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigxMDAsIDI1NSwgMTAwKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIF91cGRhdGVQbGF5ZXJMaXN0VUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMucGxheWVyTGlzdENvbnRhaW5lcikgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICAvLyDmuIXnqbrnjrDmnInliJfooahcbiAgICAgICAgdGhpcy5wbGF5ZXJMaXN0Q29udGFpbmVyLnJlbW92ZUFsbENoaWxkcmVuKClcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOeOqeWutumhuVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX3BsYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwbGF5ZXIgPSB0aGlzLl9wbGF5ZXJzW2ldXG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVQbGF5ZXJJdGVtKHBsYXllciwgaSlcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfY3JlYXRlUGxheWVySXRlbTogZnVuY3Rpb24ocGxheWVyLCBpbmRleCkge1xuICAgICAgICB2YXIgaXRlbU5vZGUgPSBuZXcgY2MuTm9kZShcIlBsYXllckl0ZW1fXCIgKyBpbmRleClcbiAgICAgICAgaXRlbU5vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZSgyMDAsIDQwKSlcbiAgICAgICAgXG4gICAgICAgIC8vIOiDjOaZr+iJslxuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCZ1wiKVxuICAgICAgICB2YXIgZ3JhcGhpY3MgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBncmFwaGljcy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoNTAsIDUwLCA3MCwgMTUwKVxuICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLTEwMCwgLTIwLCAyMDAsIDQwLCA1KVxuICAgICAgICBncmFwaGljcy5maWxsKClcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDnjqnlrrblkI3np7BcbiAgICAgICAgdmFyIG5hbWVMYWJlbCA9IG5ldyBjYy5Ob2RlKFwiTmFtZUxhYmVsXCIpXG4gICAgICAgIHZhciBsYWJlbCA9IG5hbWVMYWJlbC5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGxhYmVsLnN0cmluZyA9IHBsYXllci5wbGF5ZXJfbmFtZSB8fCBcIueOqeWutlwiICsgcGxheWVyLnBsYXllcl9pZFxuICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDE4XG4gICAgICAgIGxhYmVsLmxpbmVIZWlnaHQgPSAyNFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5py65Zmo5Lq65ZKM55yf5Lq65L2/55So55u45ZCM6aKc6Imy77yM5LiN5YaN5Yy65YiGXG4gICAgICAgIG5hbWVMYWJlbC5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICBuYW1lTGFiZWwuc2V0UG9zaXRpb24oLTQwLCAwKVxuICAgICAgICBuYW1lTGFiZWwuYW5jaG9yWCA9IDBcbiAgICAgICAgbmFtZUxhYmVsLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ56e76Zmk44CR5LiN5YaN5pi+56S65py65Zmo5Lq65qCH6K+G77yM6K6p5py65Zmo5Lq655yL6LW35p2l6Lef55yf5Lq65LiA5qC3XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDliLDlrrnlmahcbiAgICAgICAgdmFyIHlQb3MgPSAtaW5kZXggKiA1MFxuICAgICAgICBpZiAodGhpcy5wbGF5ZXJMaXN0Q29udGFpbmVyLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciBsYXN0Q2hpbGQgPSB0aGlzLnBsYXllckxpc3RDb250YWluZXIuY2hpbGRyZW5bdGhpcy5wbGF5ZXJMaXN0Q29udGFpbmVyLmNoaWxkcmVuLmxlbmd0aCAtIDFdXG4gICAgICAgICAgICB5UG9zID0gbGFzdENoaWxkLnkgLSA1MFxuICAgICAgICB9XG4gICAgICAgIGl0ZW1Ob2RlLnNldFBvc2l0aW9uKDAsIHlQb3MgPiAwID8gMCA6IHlQb3MpXG4gICAgICAgIGl0ZW1Ob2RlLnBhcmVudCA9IHRoaXMucGxheWVyTGlzdENvbnRhaW5lclxuICAgIH0sXG5cbiAgICBfdXBkYXRlUHJvZ3Jlc3NCYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5wcm9ncmVzc0JhciAmJiB0aGlzLl90b3RhbFBsYXllcnMgPiAwKSB7XG4gICAgICAgICAgICB2YXIgcHJvZ3Jlc3MgPSB0aGlzLl9lbnRlcmVkUGxheWVycyAvIHRoaXMuX3RvdGFsUGxheWVyc1xuICAgICAgICAgICAgdGhpcy5wcm9ncmVzc0Jhci5wcm9ncmVzcyA9IE1hdGgubWluKHByb2dyZXNzLCAxLjApXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g5Yqo55S7XG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBfc3RhcnRMb2FkaW5nQW5pbWF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLmxvYWRpbmdOb2RlKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHZhciByb3RhdGVBY3Rpb24gPSBjYy5yb3RhdGVCeSgyLCAzNjApXG4gICAgICAgIHZhciByZXBlYXRBY3Rpb24gPSBjYy5yZXBlYXRGb3JldmVyKHJvdGF0ZUFjdGlvbilcbiAgICAgICAgdGhpcy5sb2FkaW5nTm9kZS5ydW5BY3Rpb24ocmVwZWF0QWN0aW9uKVxuICAgIH0sXG5cbiAgICBfc3RvcExvYWRpbmdBbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5sb2FkaW5nTm9kZSkge1xuICAgICAgICAgICAgdGhpcy5sb2FkaW5nTm9kZS5zdG9wQWxsQWN0aW9ucygpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3N0YXJ0Q291bnRkb3duRmxhc2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuY291bnRkb3duTGFiZWwpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgLy8g6Zeq54OB5pWI5p6cXG4gICAgICAgIHRoaXMuX2ZsYXNoQWN0aW9uID0gY2Muc2VxdWVuY2UoXG4gICAgICAgICAgICBjYy5mYWRlVG8oMC4zLCAxMjgpLFxuICAgICAgICAgICAgY2MuZmFkZVRvKDAuMywgMjU1KVxuICAgICAgICApXG4gICAgICAgIHRoaXMuX2ZsYXNoQWN0aW9uID0gY2MucmVwZWF0Rm9yZXZlcih0aGlzLl9mbGFzaEFjdGlvbilcbiAgICAgICAgdGhpcy5jb3VudGRvd25MYWJlbC5ub2RlLnJ1bkFjdGlvbih0aGlzLl9mbGFzaEFjdGlvbilcbiAgICB9LFxuXG4gICAgX3N0b3BDb3VudGRvd25GbGFzaDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLmNvdW50ZG93bkxhYmVsICYmIHRoaXMuX2ZsYXNoQWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50ZG93bkxhYmVsLm5vZGUuc3RvcEFjdGlvbih0aGlzLl9mbGFzaEFjdGlvbilcbiAgICAgICAgICAgIHRoaXMuY291bnRkb3duTGFiZWwubm9kZS5vcGFjaXR5ID0gMjU1XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g5oyJ6ZKu5LqL5Lu2XG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiDlj5bmtojov5vlhaXvvIjov5Tlm57lpKfljoXvvIlcbiAgICAgKi9cbiAgICBvbkNhbmNlbENsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYUVudGVyV2FpdGluZ10g546p5a6254K55Ye75Y+W5raIXCIpXG4gICAgICAgIFxuICAgICAgICAvLyDlj5HpgIHlj5bmtojov5vlhaXor7fmsYJcbiAgICAgICAgaWYgKHdpbmRvdy5teWdsb2JhbCAmJiB3aW5kb3cubXlnbG9iYWwuc29ja2V0KSB7XG4gICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwuc29ja2V0LmVtaXQoXCJhcmVuYV9jYW5jZWxfZW50ZXJcIiwge1xuICAgICAgICAgICAgICAgIHBlcmlvZF9ubzogdGhpcy5fcGVyaW9kTm8sXG4gICAgICAgICAgICAgICAgcm9vbV9pZDogdGhpcy5fcm9vbUlkXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDov5Tlm57lpKfljoVcbiAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwiaGFsbFNjZW5lXCIpXG4gICAgfVxufSk7XG4iXX0=