
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
    var self = this; // 监听等待状态推送

    if (window.myglobal && window.myglobal.socket) {
      var socket = window.myglobal.socket; // 等待状态推送

      socket.on("arena_waiting_status", function (data) {
        console.log("🏟️ [ArenaEnterWaiting] 收到等待状态:", JSON.stringify(data));

        self._onWaitingStatus(data);
      }); // 倒计时更新

      socket.on("arena_waiting_tick", function (data) {
        console.log("🏟️ [ArenaEnterWaiting] 倒计时更新:", data.countdown);

        self._onWaitingTick(data);
      }); // 分配阶段开始

      socket.on("arena_assign_start", function (data) {
        console.log("🏟️ [ArenaEnterWaiting] 分配阶段开始:", JSON.stringify(data));

        self._onAssignStart(data);
      });
    }
  },
  _unregisterEvents: function _unregisterEvents() {// 事件会随节点销毁自动取消
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
    label.lineHeight = 24;
    nameLabel.color = player.is_robot ? new cc.Color(150, 150, 150) : new cc.Color(255, 255, 255);
    nameLabel.setPosition(-40, 0);
    nameLabel.anchorX = 0;
    nameLabel.parent = itemNode; // 机器人标识

    if (player.is_robot) {
      var robotLabel = new cc.Node("RobotLabel");
      var rLabel = robotLabel.addComponent(cc.Label);
      rLabel.string = "[机器人]";
      rLabel.fontSize = 14;
      rLabel.lineHeight = 18;
      robotLabel.color = new cc.Color(255, 200, 100);
      robotLabel.setPosition(70, 0);
      robotLabel.parent = itemNode;
    } // 添加到容器


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2Rkei90b3VybmFtZW50L0FyZW5hRW50ZXJXYWl0aW5nU2NlbmUuanMiXSwibmFtZXMiOlsiV2FpdGluZ1BoYXNlIiwiV0FJVElORyIsIkFTU0lHTklORyIsIkVOVEVSSU5HIiwiY2MiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJwZXJpb2ROb0xhYmVsIiwidHlwZSIsIkxhYmVsIiwicm9vbU5hbWVMYWJlbCIsImNvdW50ZG93bkxhYmVsIiwibWVzc2FnZUxhYmVsIiwicGxheWVyQ291bnRMYWJlbCIsInBsYXllckxpc3RDb250YWluZXIiLCJOb2RlIiwicGxheWVySXRlbVByZWZhYiIsIlByZWZhYiIsImxvYWRpbmdOb2RlIiwicGhhc2VMYWJlbCIsInByb2dyZXNzQmFyIiwiUHJvZ3Jlc3NCYXIiLCJvbkxvYWQiLCJfcGVyaW9kTm8iLCJfcm9vbUlkIiwiX3Jvb21OYW1lIiwiX3BoYXNlIiwiX2NvdW50ZG93biIsIl90b3RhbFBsYXllcnMiLCJfZW50ZXJlZFBsYXllcnMiLCJfcGxheWVycyIsIl9zdGFydFRpbWUiLCJfcmVnaXN0ZXJFdmVudHMiLCJjb25zb2xlIiwibG9nIiwic3RhcnQiLCJfc3RhcnRMb2FkaW5nQW5pbWF0aW9uIiwib25EZXN0cm95IiwiX3VucmVnaXN0ZXJFdmVudHMiLCJfc3RvcExvYWRpbmdBbmltYXRpb24iLCJzZWxmIiwid2luZG93IiwibXlnbG9iYWwiLCJzb2NrZXQiLCJvbiIsImRhdGEiLCJKU09OIiwic3RyaW5naWZ5IiwiX29uV2FpdGluZ1N0YXR1cyIsImNvdW50ZG93biIsIl9vbldhaXRpbmdUaWNrIiwiX29uQXNzaWduU3RhcnQiLCJzZXREYXRhIiwicGVyaW9kX25vIiwicm9vbV9pZCIsInJvb21fbmFtZSIsInBoYXNlIiwidG90YWxfcGxheWVycyIsImVudGVyZWRfcGxheWVycyIsInBsYXllcnMiLCJzdGFydF90aW1lIiwiRGF0ZSIsIm5vdyIsIl91cGRhdGVVSSIsIl91cGRhdGVDb3VudGRvd25VSSIsIl91cGRhdGVQbGF5ZXJDb3VudFVJIiwic3RyaW5nIiwibWVzc2FnZSIsIm5vZGUiLCJjb2xvciIsIkNvbG9yIiwiX3VwZGF0ZVBoYXNlVUkiLCJfdXBkYXRlUGxheWVyTGlzdFVJIiwiX3VwZGF0ZVByb2dyZXNzQmFyIiwiX3N0YXJ0Q291bnRkb3duRmxhc2giLCJfc3RvcENvdW50ZG93bkZsYXNoIiwicmVtb3ZlQWxsQ2hpbGRyZW4iLCJpIiwibGVuZ3RoIiwicGxheWVyIiwiX2NyZWF0ZVBsYXllckl0ZW0iLCJpbmRleCIsIml0ZW1Ob2RlIiwic2V0Q29udGVudFNpemUiLCJzaXplIiwiYmdOb2RlIiwiZ3JhcGhpY3MiLCJhZGRDb21wb25lbnQiLCJHcmFwaGljcyIsImZpbGxDb2xvciIsInJvdW5kUmVjdCIsImZpbGwiLCJwYXJlbnQiLCJuYW1lTGFiZWwiLCJsYWJlbCIsInBsYXllcl9uYW1lIiwicGxheWVyX2lkIiwiZm9udFNpemUiLCJsaW5lSGVpZ2h0IiwiaXNfcm9ib3QiLCJzZXRQb3NpdGlvbiIsImFuY2hvclgiLCJyb2JvdExhYmVsIiwickxhYmVsIiwieVBvcyIsImNoaWxkcmVuIiwibGFzdENoaWxkIiwieSIsInByb2dyZXNzIiwiTWF0aCIsIm1pbiIsInJvdGF0ZUFjdGlvbiIsInJvdGF0ZUJ5IiwicmVwZWF0QWN0aW9uIiwicmVwZWF0Rm9yZXZlciIsInJ1bkFjdGlvbiIsInN0b3BBbGxBY3Rpb25zIiwiX2ZsYXNoQWN0aW9uIiwic2VxdWVuY2UiLCJmYWRlVG8iLCJzdG9wQWN0aW9uIiwib3BhY2l0eSIsIm9uQ2FuY2VsQ2xpY2siLCJlbWl0IiwiZGlyZWN0b3IiLCJsb2FkU2NlbmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQSxJQUFNQSxZQUFZLEdBQUc7RUFDakJDLE9BQU8s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QXpCLENBQW1DLEtBQUtFLFlBQXhDO0VBQ0gsQ0FqWUk7RUFtWUwxQyxtQkFBbUIsRUFBRSwrQkFBVztJQUM1QixJQUFJLEtBQUtoRSxjQUFMLElBQXVCLEtBQUswRyxZQUFoQyxFQUE4QztNQUMxQyxLQUFLMUcsY0FBTCxDQUFvQnlELElBQXBCLENBQXlCb0QsVUFBekIsQ0FBb0MsS0FBS0gsWUFBekM7TUFDQSxLQUFLMUcsY0FBTCxDQUFvQnlELElBQXBCLENBQXlCcUQsT0FBekIsR0FBbUMsR0FBbkM7SUFDSDtFQUNKLENBeFlJO0VBMFlMO0VBQ0E7RUFDQTs7RUFFQTtBQUNKO0FBQ0E7RUFDSUMsYUFBYSxFQUFFLHlCQUFXO0lBQ3RCekYsT0FBTyxDQUFDQyxHQUFSLENBQVksZ0NBQVosRUFEc0IsQ0FHdEI7O0lBQ0EsSUFBSU8sTUFBTSxDQUFDQyxRQUFQLElBQW1CRCxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JDLE1BQXZDLEVBQStDO01BQzNDRixNQUFNLENBQUNDLFFBQVAsQ0FBZ0JDLE1BQWhCLENBQXVCZ0YsSUFBdkIsQ0FBNEIsb0JBQTVCLEVBQWtEO1FBQzlDdEUsU0FBUyxFQUFFLEtBQUs5QixTQUQ4QjtRQUU5QytCLE9BQU8sRUFBRSxLQUFLOUI7TUFGZ0MsQ0FBbEQ7SUFJSCxDQVRxQixDQVd0Qjs7O0lBQ0FyQixFQUFFLENBQUN5SCxRQUFILENBQVlDLFNBQVosQ0FBc0IsV0FBdEI7RUFDSDtBQTlaSSxDQUFUIiwic291cmNlUm9vdCI6Ii8iLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFyZW5hRW50ZXJXYWl0aW5nU2NlbmUgLSDnq57mioDlnLrov5vlhaXnrYnlvoXnlYzpnaJcbiAqIFxuICog5Yqf6IO977yaXG4gKiAxLiDnjqnlrrbngrnlh7tcIui/m+WFpVwi5oyJ6ZKu5ZCO5pi+56S65q2k55WM6Z2iXG4gKiAyLiDmmL7npLo2MOenkuetieW+heWAkuiuoeaXtu+8iOacjeWKoeerr+aOp+WItu+8iVxuICogMy4g5pi+56S65bey6L+b5YWl546p5a625YiX6KGoXG4gKiA0LiDnrYnlvoXpmLbmrrXnu5PmnZ/lkI7mmL7npLrliIbphY3pmLbmrrXvvIgxMOenku+8iVxuICogNS4g5YiG6YWN6Zi25q6157uT5p2f5ZCO6Ieq5Yqo6L+b5YWl5ri45oiPXG4gKiBcbiAqIOa2iOaBr+ebkeWQrO+8mlxuICogLSBhcmVuYV93YWl0aW5nX3N0YXR1czog562J5b6F6Zi25q6154q25oCB5o6o6YCBXG4gKiAtIGFyZW5hX3dhaXRpbmdfdGljazog5YCS6K6h5pe25q+P56eS5pu05pawXG4gKiAtIGFyZW5hX2Fzc2lnbl9zdGFydDog5YiG6YWN6Zi25q615byA5aeLXG4gKi9cblxuLy8g562J5b6F6Zi25q6157G75Z6LXG5jb25zdCBXYWl0aW5nUGhhc2UgPSB7XG4gICAgV0FJVElORzogXCJ3YWl0aW5nXCIsICAgICAgIC8vIOetieW+heeOqeWutui/m+WFpemYtuaute+8iDYw56eS77yJXG4gICAgQVNTSUdOSU5HOiBcImFzc2lnbmluZ1wiLCAgIC8vIOWIhumFjemYtuaute+8iDEw56eS77yJXG4gICAgRU5URVJJTkc6IFwiZW50ZXJpbmdcIiAgICAgIC8vIOi/m+WFpea4uOaIj+mYtuautVxufTtcblxuY2MuQ2xhc3Moe1xuICAgIGV4dGVuZHM6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgLy8g5pyf5Y+35qCH562+XG4gICAgICAgIHBlcmlvZE5vTGFiZWw6IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLkxhYmVsLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICAvLyDmiL/pl7TlkI3np7DmoIfnrb5cbiAgICAgICAgcm9vbU5hbWVMYWJlbDoge1xuICAgICAgICAgICAgdHlwZTogY2MuTGFiZWwsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOWAkuiuoeaXtuagh+etvlxuICAgICAgICBjb3VudGRvd25MYWJlbDoge1xuICAgICAgICAgICAgdHlwZTogY2MuTGFiZWwsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOaPkOekuua2iOaBr+agh+etvlxuICAgICAgICBtZXNzYWdlTGFiZWw6IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLkxhYmVsLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICAvLyDnjqnlrrbmlbDph4/moIfnrb5cbiAgICAgICAgcGxheWVyQ291bnRMYWJlbDoge1xuICAgICAgICAgICAgdHlwZTogY2MuTGFiZWwsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOeOqeWutuWIl+ihqOWuueWZqFxuICAgICAgICBwbGF5ZXJMaXN0Q29udGFpbmVyOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5Ob2RlLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICAvLyDnjqnlrrbpobnpooTliLbkvZNcbiAgICAgICAgcGxheWVySXRlbVByZWZhYjoge1xuICAgICAgICAgICAgdHlwZTogY2MuUHJlZmFiLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICAvLyBsb2FkaW5n5Yqo55S76IqC54K5XG4gICAgICAgIGxvYWRpbmdOb2RlOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5Ob2RlLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICAvLyDpmLbmrrXmoIfnrb5cbiAgICAgICAgcGhhc2VMYWJlbDoge1xuICAgICAgICAgICAgdHlwZTogY2MuTGFiZWwsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIC8vIOi/m+W6puadoVxuICAgICAgICBwcm9ncmVzc0Jhcjoge1xuICAgICAgICAgICAgdHlwZTogY2MuUHJvZ3Jlc3NCYXIsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gTElGRS1DWUNMRSBDQUxMQkFDS1M6XG5cbiAgICBvbkxvYWQgKCkge1xuICAgICAgICAvLyDliJ3lp4vljJbmlbDmja5cbiAgICAgICAgdGhpcy5fcGVyaW9kTm8gPSBcIlwiXG4gICAgICAgIHRoaXMuX3Jvb21JZCA9IDBcbiAgICAgICAgdGhpcy5fcm9vbU5hbWUgPSBcIlwiXG4gICAgICAgIHRoaXMuX3BoYXNlID0gV2FpdGluZ1BoYXNlLldBSVRJTkdcbiAgICAgICAgdGhpcy5fY291bnRkb3duID0gNjBcbiAgICAgICAgdGhpcy5fdG90YWxQbGF5ZXJzID0gMFxuICAgICAgICB0aGlzLl9lbnRlcmVkUGxheWVycyA9IDBcbiAgICAgICAgdGhpcy5fcGxheWVycyA9IFtdXG4gICAgICAgIHRoaXMuX3N0YXJ0VGltZSA9IDBcbiAgICAgICAgXG4gICAgICAgIC8vIOazqOWGjOS6i+S7tuebkeWQrFxuICAgICAgICB0aGlzLl9yZWdpc3RlckV2ZW50cygpXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hRW50ZXJXYWl0aW5nXSDnrYnlvoXnlYzpnaLliqDovb3lrozmiJBcIilcbiAgICB9LFxuXG4gICAgc3RhcnQgKCkge1xuICAgICAgICAvLyDlkK/liqhsb2FkaW5n5Yqo55S7XG4gICAgICAgIHRoaXMuX3N0YXJ0TG9hZGluZ0FuaW1hdGlvbigpXG4gICAgfSxcblxuICAgIG9uRGVzdHJveSAoKSB7XG4gICAgICAgIC8vIOWPlua2iOS6i+S7tuebkeWQrFxuICAgICAgICB0aGlzLl91bnJlZ2lzdGVyRXZlbnRzKClcbiAgICAgICAgXG4gICAgICAgIC8vIOWBnOatouWKqOeUu1xuICAgICAgICB0aGlzLl9zdG9wTG9hZGluZ0FuaW1hdGlvbigpXG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOS6i+S7tuebkeWQrFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgX3JlZ2lzdGVyRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIFxuICAgICAgICAvLyDnm5HlkKznrYnlvoXnirbmgIHmjqjpgIFcbiAgICAgICAgaWYgKHdpbmRvdy5teWdsb2JhbCAmJiB3aW5kb3cubXlnbG9iYWwuc29ja2V0KSB7XG4gICAgICAgICAgICB2YXIgc29ja2V0ID0gd2luZG93Lm15Z2xvYmFsLnNvY2tldFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDnrYnlvoXnirbmgIHmjqjpgIFcbiAgICAgICAgICAgIHNvY2tldC5vbihcImFyZW5hX3dhaXRpbmdfc3RhdHVzXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hRW50ZXJXYWl0aW5nXSDmlLbliLDnrYnlvoXnirbmgIE6XCIsIEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICAgICAgICAgICAgIHNlbGYuX29uV2FpdGluZ1N0YXR1cyhkYXRhKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5YCS6K6h5pe25pu05pawXG4gICAgICAgICAgICBzb2NrZXQub24oXCJhcmVuYV93YWl0aW5nX3RpY2tcIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFFbnRlcldhaXRpbmddIOWAkuiuoeaXtuabtOaWsDpcIiwgZGF0YS5jb3VudGRvd24pXG4gICAgICAgICAgICAgICAgc2VsZi5fb25XYWl0aW5nVGljayhkYXRhKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5YiG6YWN6Zi25q615byA5aeLXG4gICAgICAgICAgICBzb2NrZXQub24oXCJhcmVuYV9hc3NpZ25fc3RhcnRcIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFFbnRlcldhaXRpbmddIOWIhumFjemYtuauteW8gOWnizpcIiwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgICAgICAgICAgICAgc2VsZi5fb25Bc3NpZ25TdGFydChkYXRhKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfdW5yZWdpc3RlckV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOS6i+S7tuS8mumaj+iKgueCuemUgOavgeiHquWKqOWPlua2iFxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDlhazlhbHmlrnms5VcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIOiuvue9ruWIneWni+aVsOaNrlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0geyBwZXJpb2Rfbm8sIHJvb21faWQsIHJvb21fbmFtZSwgcGhhc2UsIGNvdW50ZG93biwgdG90YWxfcGxheWVycywgZW50ZXJlZF9wbGF5ZXJzLCBwbGF5ZXJzLCBtZXNzYWdlIH1cbiAgICAgKi9cbiAgICBzZXREYXRhOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRoaXMuX3BlcmlvZE5vID0gZGF0YS5wZXJpb2Rfbm8gfHwgXCJcIlxuICAgICAgICB0aGlzLl9yb29tSWQgPSBkYXRhLnJvb21faWQgfHwgMFxuICAgICAgICB0aGlzLl9yb29tTmFtZSA9IGRhdGEucm9vbV9uYW1lIHx8IFwiXCJcbiAgICAgICAgdGhpcy5fcGhhc2UgPSBkYXRhLnBoYXNlIHx8IFdhaXRpbmdQaGFzZS5XQUlUSU5HXG4gICAgICAgIHRoaXMuX2NvdW50ZG93biA9IGRhdGEuY291bnRkb3duIHx8IDYwXG4gICAgICAgIHRoaXMuX3RvdGFsUGxheWVycyA9IGRhdGEudG90YWxfcGxheWVycyB8fCAwXG4gICAgICAgIHRoaXMuX2VudGVyZWRQbGF5ZXJzID0gZGF0YS5lbnRlcmVkX3BsYXllcnMgfHwgMFxuICAgICAgICB0aGlzLl9wbGF5ZXJzID0gZGF0YS5wbGF5ZXJzIHx8IFtdXG4gICAgICAgIHRoaXMuX3N0YXJ0VGltZSA9IGRhdGEuc3RhcnRfdGltZSB8fCBEYXRlLm5vdygpXG4gICAgICAgIFxuICAgICAgICB0aGlzLl91cGRhdGVVSSgpXG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOS6i+S7tuWkhOeQhlxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgX29uV2FpdGluZ1N0YXR1czogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAvLyDmo4Dmn6XmnJ/lj7fmmK/lkKbljLnphY1cbiAgICAgICAgaWYgKHRoaXMuX3BlcmlvZE5vICYmIGRhdGEucGVyaW9kX25vICE9PSB0aGlzLl9wZXJpb2RObykge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX3BlcmlvZE5vID0gZGF0YS5wZXJpb2Rfbm9cbiAgICAgICAgdGhpcy5fcm9vbUlkID0gZGF0YS5yb29tX2lkXG4gICAgICAgIHRoaXMuX3Jvb21OYW1lID0gZGF0YS5yb29tX25hbWVcbiAgICAgICAgdGhpcy5fcGhhc2UgPSBkYXRhLnBoYXNlXG4gICAgICAgIHRoaXMuX2NvdW50ZG93biA9IGRhdGEuY291bnRkb3duXG4gICAgICAgIHRoaXMuX3RvdGFsUGxheWVycyA9IGRhdGEudG90YWxfcGxheWVyc1xuICAgICAgICB0aGlzLl9lbnRlcmVkUGxheWVycyA9IGRhdGEuZW50ZXJlZF9wbGF5ZXJzXG4gICAgICAgIHRoaXMuX3BsYXllcnMgPSBkYXRhLnBsYXllcnNcbiAgICAgICAgdGhpcy5fc3RhcnRUaW1lID0gZGF0YS5zdGFydF90aW1lXG4gICAgICAgIFxuICAgICAgICB0aGlzLl91cGRhdGVVSSgpXG4gICAgfSxcblxuICAgIF9vbldhaXRpbmdUaWNrOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIC8vIOajgOafpeacn+WPt+aYr+WQpuWMuemFjVxuICAgICAgICBpZiAodGhpcy5fcGVyaW9kTm8gJiYgZGF0YS5wZXJpb2Rfbm8gIT09IHRoaXMuX3BlcmlvZE5vKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5fY291bnRkb3duID0gZGF0YS5jb3VudGRvd25cbiAgICAgICAgdGhpcy5fZW50ZXJlZFBsYXllcnMgPSBkYXRhLmVudGVyZWRfcGxheWVyc1xuICAgICAgICBcbiAgICAgICAgdGhpcy5fdXBkYXRlQ291bnRkb3duVUkoKVxuICAgICAgICB0aGlzLl91cGRhdGVQbGF5ZXJDb3VudFVJKClcbiAgICB9LFxuXG4gICAgX29uQXNzaWduU3RhcnQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgLy8g5qOA5p+l5pyf5Y+35piv5ZCm5Yy56YWNXG4gICAgICAgIGlmICh0aGlzLl9wZXJpb2RObyAmJiBkYXRhLnBlcmlvZF9ubyAhPT0gdGhpcy5fcGVyaW9kTm8pIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9waGFzZSA9IFdhaXRpbmdQaGFzZS5BU1NJR05JTkdcbiAgICAgICAgdGhpcy5fY291bnRkb3duID0gZGF0YS5jb3VudGRvd25cbiAgICAgICAgdGhpcy5fdG90YWxQbGF5ZXJzID0gZGF0YS50b3RhbF9wbGF5ZXJzXG4gICAgICAgIHRoaXMuX2VudGVyZWRQbGF5ZXJzID0gZGF0YS50b3RhbF9wbGF5ZXJzIC8vIOWIhumFjemYtuauteaJgOacieeOqeWutumDveW3sui/m+WFpVxuICAgICAgICBcbiAgICAgICAgdGhpcy5fdXBkYXRlVUkoKVxuICAgICAgICBcbiAgICAgICAgLy8g5pi+56S65YiG6YWN5raI5oGvXG4gICAgICAgIGlmICh0aGlzLm1lc3NhZ2VMYWJlbCkge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlTGFiZWwuc3RyaW5nID0gZGF0YS5tZXNzYWdlIHx8IFwi5q2j5Zyo5YiG6YWN546p5a6277yM5Y2z5bCG6L+b5YWl5ri45oiPLi4uXCJcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZUxhYmVsLm5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMjAsIDEwMClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBVSeabtOaWsFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgX3VwZGF0ZVVJOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g5pu05paw5pyf5Y+3XG4gICAgICAgIGlmICh0aGlzLnBlcmlvZE5vTGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMucGVyaW9kTm9MYWJlbC5zdHJpbmcgPSBcIuacn+WPtzogXCIgKyB0aGlzLl9wZXJpb2ROb1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDmiL/pl7TlkI3np7BcbiAgICAgICAgaWYgKHRoaXMucm9vbU5hbWVMYWJlbCkge1xuICAgICAgICAgICAgdGhpcy5yb29tTmFtZUxhYmVsLnN0cmluZyA9IHRoaXMuX3Jvb21OYW1lIHx8IFwi56ue5oqA5Zy6XCJcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw5YCS6K6h5pe2XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNvdW50ZG93blVJKClcbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOeOqeWutuaVsOmHj1xuICAgICAgICB0aGlzLl91cGRhdGVQbGF5ZXJDb3VudFVJKClcbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOmYtuauteaYvuekulxuICAgICAgICB0aGlzLl91cGRhdGVQaGFzZVVJKClcbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOeOqeWutuWIl+ihqFxuICAgICAgICB0aGlzLl91cGRhdGVQbGF5ZXJMaXN0VUkoKVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw6L+b5bqm5p2hXG4gICAgICAgIHRoaXMuX3VwZGF0ZVByb2dyZXNzQmFyKClcbiAgICB9LFxuXG4gICAgX3VwZGF0ZUNvdW50ZG93blVJOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuY291bnRkb3duTGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRkb3duTGFiZWwuc3RyaW5nID0gdGhpcy5fY291bnRkb3duICsgXCLnp5JcIlxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmnIDlkI4xMOenkuWPmOe6oumXqueDgVxuICAgICAgICAgICAgaWYgKHRoaXMuX2NvdW50ZG93biA8PSAxMCAmJiB0aGlzLl9jb3VudGRvd24gPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudGRvd25MYWJlbC5ub2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMTAwLCAxMDApXG4gICAgICAgICAgICAgICAgLy8g6Zeq54OB5pWI5p6cXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRDb3VudGRvd25GbGFzaCgpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY291bnRkb3duTGFiZWwubm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BDb3VudGRvd25GbGFzaCgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3VwZGF0ZVBsYXllckNvdW50VUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5wbGF5ZXJDb3VudExhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLnBsYXllckNvdW50TGFiZWwuc3RyaW5nID0gXCLlt7Lov5vlhaU6IFwiICsgdGhpcy5fZW50ZXJlZFBsYXllcnMgKyBcIiAvIFwiICsgdGhpcy5fdG90YWxQbGF5ZXJzXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3VwZGF0ZVBoYXNlVUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5waGFzZUxhYmVsKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHRoaXMuX3BoYXNlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBXYWl0aW5nUGhhc2UuV0FJVElORzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5waGFzZUxhYmVsLnN0cmluZyA9IFwi562J5b6F546p5a626L+b5YWlXCJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5waGFzZUxhYmVsLm5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMTAwLCAyMDAsIDI1NSlcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBjYXNlIFdhaXRpbmdQaGFzZS5BU1NJR05JTkc6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGhhc2VMYWJlbC5zdHJpbmcgPSBcIuato+WcqOWIhumFjeeOqeWutlwiXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGhhc2VMYWJlbC5ub2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjIwLCAxMDApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgY2FzZSBXYWl0aW5nUGhhc2UuRU5URVJJTkc6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGhhc2VMYWJlbC5zdHJpbmcgPSBcIuWNs+Wwhui/m+WFpea4uOaIj1wiXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGhhc2VMYWJlbC5ub2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDEwMCwgMjU1LCAxMDApXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOaPkOekuua2iOaBr1xuICAgICAgICBpZiAodGhpcy5tZXNzYWdlTGFiZWwpIHtcbiAgICAgICAgICAgIHN3aXRjaCAodGhpcy5fcGhhc2UpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFdhaXRpbmdQaGFzZS5XQUlUSU5HOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VMYWJlbC5zdHJpbmcgPSBcIuetieW+heWFtuS7lueOqeWutui/m+WFpS4uLlwiXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZUxhYmVsLm5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjAwLCAyMDAsIDIyMClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBjYXNlIFdhaXRpbmdQaGFzZS5BU1NJR05JTkc6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZUxhYmVsLnN0cmluZyA9IFwi5q2j5Zyo5YiG6YWN546p5a625Yiw5ZCE5qGMLi4uXCJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlTGFiZWwubm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIyMCwgMTAwKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIGNhc2UgV2FpdGluZ1BoYXNlLkVOVEVSSU5HOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VMYWJlbC5zdHJpbmcgPSBcIuato+WcqOi/m+WFpea4uOaIjy4uLlwiXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZUxhYmVsLm5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMTAwLCAyNTUsIDEwMClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfdXBkYXRlUGxheWVyTGlzdFVJOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLnBsYXllckxpc3RDb250YWluZXIpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgLy8g5riF56m6546w5pyJ5YiX6KGoXG4gICAgICAgIHRoaXMucGxheWVyTGlzdENvbnRhaW5lci5yZW1vdmVBbGxDaGlsZHJlbigpXG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDnjqnlrrbpoblcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9wbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGxheWVyID0gdGhpcy5fcGxheWVyc1tpXVxuICAgICAgICAgICAgdGhpcy5fY3JlYXRlUGxheWVySXRlbShwbGF5ZXIsIGkpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2NyZWF0ZVBsYXllckl0ZW06IGZ1bmN0aW9uKHBsYXllciwgaW5kZXgpIHtcbiAgICAgICAgdmFyIGl0ZW1Ob2RlID0gbmV3IGNjLk5vZGUoXCJQbGF5ZXJJdGVtX1wiICsgaW5kZXgpXG4gICAgICAgIGl0ZW1Ob2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoMjAwLCA0MCkpXG4gICAgICAgIFxuICAgICAgICAvLyDog4zmma/oibJcbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmdcIilcbiAgICAgICAgdmFyIGdyYXBoaWNzID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgZ3JhcGhpY3MuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDUwLCA1MCwgNzAsIDE1MClcbiAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC0xMDAsIC0yMCwgMjAwLCA0MCwgNSlcbiAgICAgICAgZ3JhcGhpY3MuZmlsbCgpXG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSBpdGVtTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g546p5a625ZCN56ewXG4gICAgICAgIHZhciBuYW1lTGFiZWwgPSBuZXcgY2MuTm9kZShcIk5hbWVMYWJlbFwiKVxuICAgICAgICB2YXIgbGFiZWwgPSBuYW1lTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBsYWJlbC5zdHJpbmcgPSBwbGF5ZXIucGxheWVyX25hbWUgfHwgXCLnjqnlrrZcIiArIHBsYXllci5wbGF5ZXJfaWRcbiAgICAgICAgbGFiZWwuZm9udFNpemUgPSAxOFxuICAgICAgICBsYWJlbC5saW5lSGVpZ2h0ID0gMjRcbiAgICAgICAgbmFtZUxhYmVsLmNvbG9yID0gcGxheWVyLmlzX3JvYm90ID8gbmV3IGNjLkNvbG9yKDE1MCwgMTUwLCAxNTApIDogbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIG5hbWVMYWJlbC5zZXRQb3NpdGlvbigtNDAsIDApXG4gICAgICAgIG5hbWVMYWJlbC5hbmNob3JYID0gMFxuICAgICAgICBuYW1lTGFiZWwucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOacuuWZqOS6uuagh+ivhlxuICAgICAgICBpZiAocGxheWVyLmlzX3JvYm90KSB7XG4gICAgICAgICAgICB2YXIgcm9ib3RMYWJlbCA9IG5ldyBjYy5Ob2RlKFwiUm9ib3RMYWJlbFwiKVxuICAgICAgICAgICAgdmFyIHJMYWJlbCA9IHJvYm90TGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgckxhYmVsLnN0cmluZyA9IFwiW+acuuWZqOS6ul1cIlxuICAgICAgICAgICAgckxhYmVsLmZvbnRTaXplID0gMTRcbiAgICAgICAgICAgIHJMYWJlbC5saW5lSGVpZ2h0ID0gMThcbiAgICAgICAgICAgIHJvYm90TGFiZWwuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDEwMClcbiAgICAgICAgICAgIHJvYm90TGFiZWwuc2V0UG9zaXRpb24oNzAsIDApXG4gICAgICAgICAgICByb2JvdExhYmVsLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOWIsOWuueWZqFxuICAgICAgICB2YXIgeVBvcyA9IC1pbmRleCAqIDUwXG4gICAgICAgIGlmICh0aGlzLnBsYXllckxpc3RDb250YWluZXIuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIGxhc3RDaGlsZCA9IHRoaXMucGxheWVyTGlzdENvbnRhaW5lci5jaGlsZHJlblt0aGlzLnBsYXllckxpc3RDb250YWluZXIuY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbiAgICAgICAgICAgIHlQb3MgPSBsYXN0Q2hpbGQueSAtIDUwXG4gICAgICAgIH1cbiAgICAgICAgaXRlbU5vZGUuc2V0UG9zaXRpb24oMCwgeVBvcyA+IDAgPyAwIDogeVBvcylcbiAgICAgICAgaXRlbU5vZGUucGFyZW50ID0gdGhpcy5wbGF5ZXJMaXN0Q29udGFpbmVyXG4gICAgfSxcblxuICAgIF91cGRhdGVQcm9ncmVzc0JhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnByb2dyZXNzQmFyICYmIHRoaXMuX3RvdGFsUGxheWVycyA+IDApIHtcbiAgICAgICAgICAgIHZhciBwcm9ncmVzcyA9IHRoaXMuX2VudGVyZWRQbGF5ZXJzIC8gdGhpcy5fdG90YWxQbGF5ZXJzXG4gICAgICAgICAgICB0aGlzLnByb2dyZXNzQmFyLnByb2dyZXNzID0gTWF0aC5taW4ocHJvZ3Jlc3MsIDEuMClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDliqjnlLtcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIF9zdGFydExvYWRpbmdBbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMubG9hZGluZ05vZGUpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgdmFyIHJvdGF0ZUFjdGlvbiA9IGNjLnJvdGF0ZUJ5KDIsIDM2MClcbiAgICAgICAgdmFyIHJlcGVhdEFjdGlvbiA9IGNjLnJlcGVhdEZvcmV2ZXIocm90YXRlQWN0aW9uKVxuICAgICAgICB0aGlzLmxvYWRpbmdOb2RlLnJ1bkFjdGlvbihyZXBlYXRBY3Rpb24pXG4gICAgfSxcblxuICAgIF9zdG9wTG9hZGluZ0FuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLmxvYWRpbmdOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLmxvYWRpbmdOb2RlLnN0b3BBbGxBY3Rpb25zKClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfc3RhcnRDb3VudGRvd25GbGFzaDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5jb3VudGRvd25MYWJlbCkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICAvLyDpl6rng4HmlYjmnpxcbiAgICAgICAgdGhpcy5fZmxhc2hBY3Rpb24gPSBjYy5zZXF1ZW5jZShcbiAgICAgICAgICAgIGNjLmZhZGVUbygwLjMsIDEyOCksXG4gICAgICAgICAgICBjYy5mYWRlVG8oMC4zLCAyNTUpXG4gICAgICAgIClcbiAgICAgICAgdGhpcy5fZmxhc2hBY3Rpb24gPSBjYy5yZXBlYXRGb3JldmVyKHRoaXMuX2ZsYXNoQWN0aW9uKVxuICAgICAgICB0aGlzLmNvdW50ZG93bkxhYmVsLm5vZGUucnVuQWN0aW9uKHRoaXMuX2ZsYXNoQWN0aW9uKVxuICAgIH0sXG5cbiAgICBfc3RvcENvdW50ZG93bkZsYXNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuY291bnRkb3duTGFiZWwgJiYgdGhpcy5fZmxhc2hBY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRkb3duTGFiZWwubm9kZS5zdG9wQWN0aW9uKHRoaXMuX2ZsYXNoQWN0aW9uKVxuICAgICAgICAgICAgdGhpcy5jb3VudGRvd25MYWJlbC5ub2RlLm9wYWNpdHkgPSAyNTVcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDmjInpkq7kuovku7ZcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIOWPlua2iOi/m+WFpe+8iOi/lOWbnuWkp+WOhe+8iVxuICAgICAqL1xuICAgIG9uQ2FuY2VsQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hRW50ZXJXYWl0aW5nXSDnjqnlrrbngrnlh7vlj5bmtohcIilcbiAgICAgICAgXG4gICAgICAgIC8vIOWPkemAgeWPlua2iOi/m+WFpeivt+axglxuICAgICAgICBpZiAod2luZG93Lm15Z2xvYmFsICYmIHdpbmRvdy5teWdsb2JhbC5zb2NrZXQpIHtcbiAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5zb2NrZXQuZW1pdChcImFyZW5hX2NhbmNlbF9lbnRlclwiLCB7XG4gICAgICAgICAgICAgICAgcGVyaW9kX25vOiB0aGlzLl9wZXJpb2RObyxcbiAgICAgICAgICAgICAgICByb29tX2lkOiB0aGlzLl9yb29tSWRcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOi/lOWbnuWkp+WOhVxuICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIilcbiAgICB9XG59KTtcbiJdfQ==