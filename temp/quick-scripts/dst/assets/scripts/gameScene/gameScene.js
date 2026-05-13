
                (function() {
                    var nodeEnv = typeof require !== 'undefined' && typeof process !== 'undefined';
                    var __module = nodeEnv ? module : {exports:{}};
                    var __filename = 'preview-scripts/assets/scripts/gameScene/gameScene.js';
                    var __require = nodeEnv ? function (request) {
                        return cc.require(request);
                    } : function (request) {
                        return __quick_compile_project__.require(request, __filename);
                    };
                    function __define (exports, require, module) {
                        if (!nodeEnv) {__quick_compile_project__.registerModule(__filename, module);}"use strict";
cc._RF.push(module, 'e2b3cTV5veJAavN7xI0Vnkx', 'gameScene');
// scripts/gameScene/gameScene.js

"use strict";

// 使用全局变量，不使用 require
// 【修复版本】简化发牌逻辑，不再使用定时器调度
// 核心原则：
// 1. gameingUI.js 自己处理发牌动画
// 2. gameScene.js 只负责转发事件给 player_node
// 3. 不依赖 scheduleOnce 控制发牌节奏

cc.Class({
  "extends": cc.Component,
  properties: {
    di_label: cc.Label,
    beishu_label: cc.Label,
    roomid_label: cc.Label,
    player_node_prefabs: cc.Prefab,
    players_seat_pos: cc.Node
  },
  onLoad: function onLoad() {
    var myglobal = window.myglobal;
    var RoomState = window.RoomState || {
      ROOM_INVALID: -1
    };
    var isopen_sound = window.isopen_sound || 1;
    if (!myglobal || !myglobal.playerData || !myglobal.socket) {
      console.error("gameScene: myglobal、playerData 或 socket 未定义");
      this._waitForInit();
      return;
    }
    this._initScene(myglobal, RoomState, isopen_sound);
    this._startOnlineMonitoring();
  },
  // ============================================================
  // 在线监测和其他功能
  // ============================================================

  _startOnlineMonitoring: function _startOnlineMonitoring() {
    var myglobal = window.myglobal;
    if (!myglobal) {
      console.warn("gameScene: myglobal 未定义，无法启动在线监测");
      return;
    }
    var self = this;
    this._onlineStatusHandler = function (isOnline) {
      if (!isOnline) {
        self._showOfflineMessage();
      }
    };
    if (myglobal.addOnlineStatusListener) {
      myglobal.addOnlineStatusListener(this._onlineStatusHandler);
    }
    if (myglobal.eventlister) {
      myglobal.eventlister.on("force_logout", function (data) {
        console.warn("🚫 游戏场景收到强制下线事件:", data);
        self._handleForceLogout(data);
      });
    }
  },
  _showOfflineMessage: function _showOfflineMessage() {
    console.warn("💔 游戏场景：网络连接已断开");
  },
  _handleForceLogout: function _handleForceLogout(data) {
    var reason = data.reason || "您已被强制下线";
    console.warn("🚫 游戏场景强制下线:", reason);
    var myglobal = window.myglobal;
    if (myglobal && myglobal.stopOnlineMonitoring) {
      myglobal.stopOnlineMonitoring();
    }
    var self = this;
    this.scheduleOnce(function () {
      if (typeof alert === 'function') {
        alert(reason + "\n\n请重新登录");
      }
      cc.director.loadScene("loginScene");
    }, 0.5);
  },
  _stopOnlineMonitoring: function _stopOnlineMonitoring() {
    var myglobal = window.myglobal;
    if (myglobal && myglobal.removeOnlineStatusListener && this._onlineStatusHandler) {
      myglobal.removeOnlineStatusListener(this._onlineStatusHandler);
      this._onlineStatusHandler = null;
    }
  },
  _waitForInit: function _waitForInit() {
    var self = this;
    var attempts = 0;
    var maxAttempts = 20;
    var checkInit = function checkInit() {
      attempts++;
      var myglobal = window.myglobal;
      if (myglobal && myglobal.playerData && myglobal.socket) {
        var RoomState = window.RoomState || {
          ROOM_INVALID: -1
        };
        var isopen_sound = window.isopen_sound || 1;
        self._initScene(myglobal, RoomState, isopen_sound);
      } else if (attempts < maxAttempts) {
        setTimeout(checkInit, 100);
      } else {
        console.error("gameScene 初始化超时");
      }
    };
    setTimeout(checkInit, 100);
  },
  _initScene: function _initScene(myglobal, RoomState, isopen_sound) {
    this.playerNodeList = [];
    var bottom = myglobal.playerData.bottom || 1;
    var rate = myglobal.playerData.rate || 1;
    this.di_label.string = "底:" + bottom;
    this.beishu_label.string = "倍数:" + rate;
    this.roomstate = RoomState.ROOM_INVALID;
    this._isWaitingForPlayers = false;

    // 监听，给其他玩家发牌(内部事件)
    // 【核心】player_node 直接显示 17 张牌背，不再逐张动画
    this.node.on("pushcard_other_event", function () {
      for (var i = 0; i < this.playerNodeList.length; i++) {
        var node = this.playerNodeList[i];
        if (node) {
          node.emit("push_card_event");
        }
      }
    }.bind(this));

    // 监听房间状态改变事件
    myglobal.socket.onRoomChangeState(function (data) {
      this.roomstate = data;
      if (data !== RoomState.ROOM_INVALID && this._isWaitingForPlayers) {
        this._hideWaitingUI();
      }
    }.bind(this));
    this.node.on("canrob_event", function (event) {
      for (var i = 0; i < this.playerNodeList.length; i++) {
        var node = this.playerNodeList[i];
        if (node) {
          node.emit("playernode_canrob_event", event);
        }
      }
    }.bind(this));
    this.node.on("choose_card_event", function (event) {
      var gameui_node = this.node.getChildByName("gameingUI");
      if (gameui_node == null) {
        return;
      }
      gameui_node.emit("choose_card_event", event);
    }.bind(this));
    this.node.on("unchoose_card_event", function (event) {
      var gameui_node = this.node.getChildByName("gameingUI");
      if (gameui_node == null) {
        return;
      }
      gameui_node.emit("unchoose_card_event", event);
    }.bind(this));
    var currentRoomCode = myglobal.socket.getCurrentRoomCode();
    var isInRoom = myglobal.socket.isInRoom();
    var roomData = myglobal.roomData;
    if (isInRoom && currentRoomCode && !roomData) {
      roomData = {
        roomid: currentRoomCode,
        room_code: currentRoomCode,
        seatindex: 1,
        playerdata: [{
          accountid: myglobal.playerData.accountid || myglobal.playerData.playerId,
          nick_name: myglobal.playerData.nickName,
          avatarUrl: "avatar_1",
          gold_count: myglobal.playerData.gobal_count || 1000,
          // 🔧【修复】使用 gold_count 字段
          goldcount: myglobal.playerData.gobal_count || 1000,
          // 兼容旧客户端
          seatindex: 1,
          isready: true
        }]
      };
    }
    if (roomData) {
      this._processRoomData(roomData, myglobal, isopen_sound);
    } else {
      myglobal.socket.request_enter_room({}, function (err, result) {
        if (err != 0) {} else {
          this._processRoomData(result, myglobal, isopen_sound);
        }
      }.bind(this));
    }
    myglobal.socket.onPlayerJoinRoom(function (join_playerdata) {
      this.addPlayerNode(join_playerdata);
      if (!this._playerdataList) {
        this._playerdataList = [];
      }
      this._playerdataList.push(join_playerdata);
      if (this._isWaitingForPlayers) {
        this._showWaitingUI(3 - this._playerdataList.length, this._currentRoomCode);
      }
      if (this.playerNodeList.length >= 3) {
        this._hideWaitingUI();
      }
    }.bind(this));
    myglobal.socket.onPlayerReady(function (data) {
      for (var i = 0; i < this.playerNodeList.length; i++) {
        var node = this.playerNodeList[i];
        if (node) {
          node.emit("player_ready_notify", data);
        }
      }
    }.bind(this));
    myglobal.socket.onGameStart(function () {
      for (var i = 0; i < this.playerNodeList.length; i++) {
        var node = this.playerNodeList[i];
        if (node) {
          node.emit("gamestart_event");
        }
      }
      var gamebeforeUI = this.node.getChildByName("gamebeforeUI");
      if (gamebeforeUI) {
        gamebeforeUI.active = false;
      }
    }.bind(this));
    myglobal.socket.onRobState(function (event) {
      // 🔧【修复】添加 round 字段，区分叫地主和抢地主
      var eventWithRound = Object.assign({}, event, {
        round: 2
      });
      for (var i = 0; i < this.playerNodeList.length; i++) {
        var node = this.playerNodeList[i];
        if (node) {
          node.emit("playernode_rob_state_event", eventWithRound);
        }
      }
    }.bind(this));

    // 🔧【新增】监听叫地主结果（第一轮）
    myglobal.socket.onBidResult(function (event) {
      // 🔧【修复】添加 round 字段，区分叫地主和抢地主
      var eventWithRound = Object.assign({}, event, {
        round: 1
      });
      for (var i = 0; i < this.playerNodeList.length; i++) {
        var node = this.playerNodeList[i];
        if (node) {
          node.emit("playernode_rob_state_event", eventWithRound);
        }
      }
    }.bind(this));
    myglobal.socket.onChangeMaster(function (event) {
      myglobal.playerData.master_accountid = event;
      for (var i = 0; i < this.playerNodeList.length; i++) {
        var node = this.playerNodeList[i];
        if (node) {
          node.emit("playernode_changemaster_event", event);
        }
      }
    }.bind(this));

    // 🔧【新增】监听出牌阶段开始
    myglobal.socket.onPlayStart(function (data) {
      // 设置房间状态为出牌阶段
      this.roomstate = RoomState.ROOM_PLAYING;
    }.bind(this));
    this.node.on("update_card_count_event", function (data) {
      for (var i = 0; i < this.playerNodeList.length; i++) {
        var node = this.playerNodeList[i];
        if (node) {
          node.emit("update_card_count_event", data);
        }
      }
    }.bind(this));
    myglobal.socket.onShowBottomCard(function (event) {
      var gameui_node = this.node.getChildByName("gameingUI");
      if (gameui_node == null) {
        return;
      }
      gameui_node.emit("show_bottom_card_event", event);
    }.bind(this));
    myglobal.socket.onRoomRestored(function (data) {
      if (data.room_code) {
        var restoredRoomData = {
          roomid: data.room_code,
          room_code: data.room_code,
          seatindex: 1,
          playerdata: [{
            accountid: data.player_id,
            nick_name: data.player_name,
            avatarUrl: "avatar_1",
            gold_count: data.gold_count || 1000,
            // 🔧【修复】使用 gold_count 字段
            goldcount: data.gold_count || 1000,
            // 兼容旧客户端
            seatindex: 1
          }]
        };
        this._processRoomData(restoredRoomData, myglobal, isopen_sound);
      }
    }.bind(this));

    // 【新增】监听游戏状态恢复事件
    this.node.on("game_state_restored", function (data) {
      this._onGameStateRestored(data);
    }.bind(this));

    // 【新增】监听玩家掉线通知
    myglobal.socket.onPlayerOffline(function (data) {
      this._onPlayerOffline(data);
    }.bind(this));

    // 【新增】监听玩家上线通知
    myglobal.socket.onPlayerOnline(function (data) {
      this._onPlayerOnline(data);
    }.bind(this));
  },
  setPlayerSeatPos: function setPlayerSeatPos(seat_index) {
    if (seat_index < 1 || seat_index > 3) {
      return;
    }
    switch (seat_index) {
      case 1:
        this.playerdata_list_pos[1] = 0;
        this.playerdata_list_pos[2] = 1;
        this.playerdata_list_pos[3] = 2;
        break;
      case 2:
        this.playerdata_list_pos[2] = 0;
        this.playerdata_list_pos[3] = 1;
        this.playerdata_list_pos[1] = 2;
        break;
      case 3:
        this.playerdata_list_pos[3] = 0;
        this.playerdata_list_pos[1] = 1;
        this.playerdata_list_pos[2] = 2;
        break;
      default:
        break;
    }
  },
  addPlayerNode: function addPlayerNode(player_data) {
    if (!this.player_node_prefabs) {
      console.error("player_node_prefabs 未绑定！");
      return;
    }
    if (!this.players_seat_pos) {
      console.error("players_seat_pos 未绑定！");
      return;
    }
    var playernode_inst = cc.instantiate(this.player_node_prefabs);
    if (!playernode_inst) {
      console.error("无法实例化 player_node_prefabs");
      return;
    }
    playernode_inst.parent = this.node;
    this.playerNodeList.push(playernode_inst);

    // 🔧【修复】将房间类型传递给 player_node（用于区分普通场和竞技场）
    if (!player_data.room_category) {
      player_data.room_category = this._roomCategory || 1;
      console.log("🏟️ [addPlayerNode] 设置 player_data.room_category =", player_data.room_category);
    }

    // 🔧【新增】将期号传递给 player_node
    if (!player_data.period_no && this._periodNo) {
      player_data.period_no = this._periodNo;
    }
    var index = this.playerdata_list_pos[player_data.seatindex];
    if (index === undefined || index === null) {
      console.error("无效的座位索引:", player_data.seatindex);
      return;
    }
    if (!this.players_seat_pos.children || !this.players_seat_pos.children[index]) {
      console.error("座位节点不存在，index:", index);
      return;
    }
    playernode_inst.position = this.players_seat_pos.children[index].position;
    var playerNodeScript = playernode_inst.getComponent("player_node");
    if (!playerNodeScript) {
      console.error("无法获取 player_node 组件");
      return;
    }
    playerNodeScript.init_data(player_data, index);
  },
  start: function start() {},
  onDestroy: function onDestroy() {
    this._stopOnlineMonitoring();
  },
  getUserOutCardPosByAccount: function getUserOutCardPosByAccount(accountid) {
    if (!this.playerNodeList || !this.players_seat_pos) {
      console.error("playerNodeList 或 players_seat_pos 未初始化");
      return null;
    }
    for (var i = 0; i < this.playerNodeList.length; i++) {
      var node = this.playerNodeList[i];
      if (node) {
        var node_script = node.getComponent("player_node");
        if (node_script && node_script.accountid === accountid) {
          if (node_script.seat_index === undefined || node_script.seat_index === null) {
            console.error("无效的 seat_index");
            return null;
          }
          if (!this.players_seat_pos.children || !this.players_seat_pos.children[node_script.seat_index]) {
            console.error("座位节点不存在，seat_index:", node_script.seat_index);
            return null;
          }
          var seat_node = this.players_seat_pos.children[node_script.seat_index];
          var index_name = "cardsoutzone" + node_script.seat_index;
          var out_card_node = seat_node.getChildByName(index_name);
          return out_card_node;
        }
      }
    }
    return null;
  },
  _processRoomData: function _processRoomData(result, myglobal, isopen_sound) {
    console.log("🎮 [_processRoomData] 接收到的数据:", JSON.stringify(result));
    var seatid = result.seatindex || 1;
    this.playerdata_list_pos = [];
    this.setPlayerSeatPos(seatid);
    var playerdata_list = result.playerdata || [];
    var roomid = result.roomid || result.room_code || result.roomCode || "WAITING";

    // 🔧【新增】检查是否是竞技场模式
    var isArenaMode = result.room_category === 2;
    if (isArenaMode) {
      console.log("🏟️ [_processRoomData] 竞技场模式: room_category=2, playerdata数量=" + playerdata_list.length + ", 期号=" + result.period_no);
    }

    // 🔧【修复】保存房间类型到实例变量，供 player_node 使用
    this._roomCategory = result.room_category || 1;
    this._isArenaMode = isArenaMode;
    this._periodNo = result.period_no || ""; // 🔧【新增】保存期号

    this._playerdataList = playerdata_list;
    if (this.roomid_label) {
      this.roomid_label.string = "房间号:" + roomid;
    } else {
      console.error("🎮 [游戏场景] roomid_label 未绑定！");
    }
    myglobal.playerData.housemanageid = result.housemanageid || result.creator_id || result.creatorId || "";
    if (myglobal.socket && myglobal.socket.getPlayerInfo) {
      var playerInfo = myglobal.socket.getPlayerInfo();
    }
    for (var i = 0; i < playerdata_list.length; i++) {
      console.log("🎮 [_processRoomData] 添加玩家节点: " + JSON.stringify(playerdata_list[i]));
      this.addPlayerNode(playerdata_list[i]);
    }
    if (isopen_sound) {
      cc.audioEngine.stopAll();
      cc.resources.load("sound/bg", cc.AudioClip, function (err, clip) {
        if (err) {
          return;
        }
        cc.audioEngine.play(clip, true, 1);
      });
    }
    var gamebefore_node = this.node.getChildByName("gamebeforeUI");
    if (gamebefore_node) {
      gamebefore_node.active = true;
      gamebefore_node.zIndex = 1000;
      gamebefore_node.emit("init");
    }

    // 🔧【修复】竞技场模式下不显示等待玩家UI（所有玩家已分配好）
    if (isArenaMode) {
      console.log("🏟️ [_processRoomData] 竞技场模式：不显示等待玩家UI");
      // 竞技场模式下所有玩家应该已经准备好，直接等待游戏开始
    } else if (playerdata_list.length < 3) {
      this._showWaitingUI(3 - playerdata_list.length, roomid);
    }
  },
  _showWaitingUI: function _showWaitingUI(needPlayers, roomCode) {
    var self = this;
    this._isWaitingForPlayers = true;
    this._needPlayers = needPlayers;
    this._currentRoomCode = roomCode || "";
    this._hideWaitingUI();
    var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
    var screenHeight = canvas ? canvas.designResolution.height : 720;
    var screenWidth = canvas ? canvas.designResolution.width : 1280;
    var waitingNode = new cc.Node("WaitingForPlayersUI");
    waitingNode.setContentSize(cc.size(screenWidth, screenHeight));
    waitingNode.anchorX = 0.5;
    waitingNode.anchorY = 0.5;
    waitingNode.x = 0;
    waitingNode.y = 0;
    waitingNode.parent = this.node;
    this._waitingUINode = waitingNode;
    if (roomCode) {
      var roomInfoNode = new cc.Node("RoomInfo");
      roomInfoNode.x = -screenWidth / 2 + 20;
      roomInfoNode.y = screenHeight / 2 - 30;
      roomInfoNode.anchorX = 0;
      roomInfoNode.anchorY = 0.5;
      var roomLabel = roomInfoNode.addComponent(cc.Label);
      roomLabel.string = "房间号: " + roomCode;
      roomLabel.fontSize = 24;
      roomLabel.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
      roomInfoNode.color = cc.color(255, 215, 0);
      var roomOutline = roomInfoNode.addComponent(cc.LabelOutline);
      roomOutline.color = cc.color(0, 0, 0);
      roomOutline.width = 2;
      roomInfoNode.parent = waitingNode;
    }
    var leaveBtnNode = new cc.Node("LeaveBtn");
    leaveBtnNode.x = screenWidth / 2 - 100;
    leaveBtnNode.y = -screenHeight / 2 + 50;
    leaveBtnNode.anchorX = 0.5;
    leaveBtnNode.anchorY = 0.5;
    leaveBtnNode.setContentSize(cc.size(140, 40));
    var leaveBtnBg = leaveBtnNode.addComponent(cc.Graphics);
    leaveBtnBg.fillColor = cc.color(180, 60, 60, 230);
    leaveBtnBg.roundRect(-70, -20, 140, 40, 8);
    leaveBtnBg.fill();
    leaveBtnBg.strokeColor = cc.color(220, 100, 100);
    leaveBtnBg.lineWidth = 2;
    leaveBtnBg.roundRect(-70, -20, 140, 40, 8);
    leaveBtnBg.stroke();
    leaveBtnNode.parent = waitingNode;
    var leaveBtnLabel = new cc.Node("Label");
    leaveBtnLabel.anchorX = 0.5;
    leaveBtnLabel.anchorY = 0.5;
    var leaveLabel = leaveBtnLabel.addComponent(cc.Label);
    leaveLabel.string = "离开房间";
    leaveLabel.fontSize = 20;
    leaveLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    leaveBtnLabel.color = cc.color(255, 255, 255);
    var leaveOutline = leaveBtnLabel.addComponent(cc.LabelOutline);
    leaveOutline.color = cc.color(100, 30, 30);
    leaveOutline.width = 2;
    leaveBtnLabel.parent = leaveBtnNode;
    leaveBtnNode.on(cc.Node.EventType.TOUCH_START, function () {
      leaveBtnNode.scale = 0.95;
    });
    leaveBtnNode.on(cc.Node.EventType.TOUCH_END, function () {
      leaveBtnNode.scale = 1;
      self._leaveRoom();
    });
    leaveBtnNode.on(cc.Node.EventType.TOUCH_CANCEL, function () {
      leaveBtnNode.scale = 1;
    });
    this._updateWaitingAnimation();
  },
  _updateWaitingUI: function _updateWaitingUI() {
    if (!this._isWaitingForPlayers) return;
    var currentPlayers = this.playerNodeList.length;
    if (currentPlayers >= 3) {
      this._hideWaitingUI();
    }
  },
  _updateWaitingAnimation: function _updateWaitingAnimation() {
    var self = this;
    if (!this._isWaitingForPlayers || !this._waitingUINode) return;
    this.scheduleOnce(function () {
      self._updateWaitingAnimation();
    }, 1 / 60);
  },
  _hideWaitingUI: function _hideWaitingUI() {
    this._isWaitingForPlayers = false;
    if (this._waitingUINode) {
      this._waitingUINode.destroy();
      this._waitingUINode = null;
    }
  },
  _leaveRoom: function _leaveRoom() {
    var myglobal = window.myglobal;
    if (myglobal && myglobal.socket) {
      if (myglobal.socket.leaveRoom) {
        myglobal.socket.leaveRoom();
      }
    }
    this._hideWaitingUI();
    cc.director.loadScene("hallScene");
  },
  // ============================================================
  // 【新增】游戏状态恢复处理
  // ============================================================

  /**
   * 处理游戏状态恢复事件
   */
  _onGameStateRestored: function _onGameStateRestored(data) {
    // 更新玩家节点的状态
    if (data.players) {
      for (var i = 0; i < this.playerNodeList.length; i++) {
        var node = this.playerNodeList[i];
        if (node) {
          var nodeScript = node.getComponent("player_node");
          if (nodeScript) {
            // 查找对应的玩家数据
            for (var j = 0; j < data.players.length; j++) {
              var p = data.players[j];
              if (p.id === nodeScript.accountid) {
                // 更新玩家状态
                node.emit("player_state_update", {
                  state: p.state,
                  cards_count: p.cards_count,
                  is_landlord: p.is_landlord
                });
                break;
              }
            }
          }
        }
      }
    }

    // 隐藏 gamebeforeUI
    var gamebefore_node = this.node.getChildByName("gamebeforeUI");
    if (gamebefore_node) {
      gamebefore_node.active = false;
    }

    // 显示 gameingUI
    var gameing_node = this.node.getChildByName("gameingUI");
    if (gameing_node) {
      gameing_node.active = true;
    }
  },
  /**
   * 处理玩家掉线通知
   */
  _onPlayerOffline: function _onPlayerOffline(data) {
    // 通知所有玩家节点更新状态
    for (var i = 0; i < this.playerNodeList.length; i++) {
      var node = this.playerNodeList[i];
      if (node) {
        var nodeScript = node.getComponent("player_node");
        if (nodeScript && nodeScript.accountid === data.player_id) {
          node.emit("player_state_update", {
            state: "offline",
            timeout: data.timeout
          });
          break;
        }
      }
    }
  },
  /**
   * 处理玩家上线通知
   */
  _onPlayerOnline: function _onPlayerOnline(data) {
    // 通知所有玩家节点更新状态
    for (var i = 0; i < this.playerNodeList.length; i++) {
      var node = this.playerNodeList[i];
      if (node) {
        var nodeScript = node.getComponent("player_node");
        if (nodeScript && nodeScript.accountid === data.player_id) {
          node.emit("player_state_update", {
            state: "online"
          });
          break;
        }
      }
    }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0c1xcc2NyaXB0c1xcZ2FtZVNjZW5lXFxnYW1lU2NlbmUuanMiXSwibmFtZXMiOlsiY2MiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJkaV9sYWJlbCIsIkxhYmVsIiwiYmVpc2h1X2xhYmVsIiwicm9vbWlkX2xhYmVsIiwicGxheWVyX25vZGVfcHJlZmFicyIsIlByZWZhYiIsInBsYXllcnNfc2VhdF9wb3MiLCJOb2RlIiwib25Mb2FkIiwibXlnbG9iYWwiLCJ3aW5kb3ciLCJSb29tU3RhdGUiLCJST09NX0lOVkFMSUQiLCJpc29wZW5fc291bmQiLCJwbGF5ZXJEYXRhIiwic29ja2V0IiwiY29uc29sZSIsImVycm9yIiwiX3dhaXRGb3JJbml0IiwiX2luaXRTY2VuZSIsIl9zdGFydE9ubGluZU1vbml0b3JpbmciLCJ3YXJuIiwic2VsZiIsIl9vbmxpbmVTdGF0dXNIYW5kbGVyIiwiaXNPbmxpbmUiLCJfc2hvd09mZmxpbmVNZXNzYWdlIiwiYWRkT25saW5lU3RhdHVzTGlzdGVuZXIiLCJldmVudGxpc3RlciIsIm9uIiwiZGF0YSIsIl9oYW5kbGVGb3JjZUxvZ291dCIsInJlYXNvbiIsInN0b3BPbmxpbmVNb25pdG9yaW5nIiwic2NoZWR1bGVPbmNlIiwiYWxlcnQiLCJkaXJlY3RvciIsImxvYWRTY2VuZSIsIl9zdG9wT25saW5lTW9uaXRvcmluZyIsInJlbW92ZU9ubGluZVN0YXR1c0xpc3RlbmVyIiwiYXR0ZW1wdHMiLCJtYXhBdHRlbXB0cyIsImNoZWNrSW5pdCIsInNldFRpbWVvdXQiLCJwbGF5ZXJOb2RlTGlzdCIsImJvdHRvbSIsInJhdGUiLCJzdHJpbmciLCJyb29tc3RhdGUiLCJfaXNXYWl0aW5nRm9yUGxheWVycyIsIm5vZGUiLCJpIiwibGVuZ3RoIiwiZW1pdCIsImJpbmQiLCJvblJvb21DaGFuZ2VTdGF0ZSIsIl9oaWRlV2FpdGluZ1VJIiwiZXZlbnQiLCJnYW1ldWlfbm9kZSIsImdldENoaWxkQnlOYW1lIiwiY3VycmVudFJvb21Db2RlIiwiZ2V0Q3VycmVudFJvb21Db2RlIiwiaXNJblJvb20iLCJyb29tRGF0YSIsInJvb21pZCIsInJvb21fY29kZSIsInNlYXRpbmRleCIsInBsYXllcmRhdGEiLCJhY2NvdW50aWQiLCJwbGF5ZXJJZCIsIm5pY2tfbmFtZSIsIm5pY2tOYW1lIiwiYXZhdGFyVXJsIiwiZ29sZF9jb3VudCIsImdvYmFsX2NvdW50IiwiZ29sZGNvdW50IiwiaXNyZWFkeSIsIl9wcm9jZXNzUm9vbURhdGEiLCJyZXF1ZXN0X2VudGVyX3Jvb20iLCJlcnIiLCJyZXN1bHQiLCJvblBsYXllckpvaW5Sb29tIiwiam9pbl9wbGF5ZXJkYXRhIiwiYWRkUGxheWVyTm9kZSIsIl9wbGF5ZXJkYXRhTGlzdCIsInB1c2giLCJfc2hvd1dhaXRpbmdVSSIsIl9jdXJyZW50Um9vbUNvZGUiLCJvblBsYXllclJlYWR5Iiwib25HYW1lU3RhcnQiLCJnYW1lYmVmb3JlVUkiLCJhY3RpdmUiLCJvblJvYlN0YXRlIiwiZXZlbnRXaXRoUm91bmQiLCJPYmplY3QiLCJhc3NpZ24iLCJyb3VuZCIsIm9uQmlkUmVzdWx0Iiwib25DaGFuZ2VNYXN0ZXIiLCJtYXN0ZXJfYWNjb3VudGlkIiwib25QbGF5U3RhcnQiLCJST09NX1BMQVlJTkciLCJvblNob3dCb3R0b21DYXJkIiwib25Sb29tUmVzdG9yZWQiLCJyZXN0b3JlZFJvb21EYXRhIiwicGxheWVyX2lkIiwicGxheWVyX25hbWUiLCJfb25HYW1lU3RhdGVSZXN0b3JlZCIsIm9uUGxheWVyT2ZmbGluZSIsIl9vblBsYXllck9mZmxpbmUiLCJvblBsYXllck9ubGluZSIsIl9vblBsYXllck9ubGluZSIsInNldFBsYXllclNlYXRQb3MiLCJzZWF0X2luZGV4IiwicGxheWVyZGF0YV9saXN0X3BvcyIsInBsYXllcl9kYXRhIiwicGxheWVybm9kZV9pbnN0IiwiaW5zdGFudGlhdGUiLCJwYXJlbnQiLCJyb29tX2NhdGVnb3J5IiwiX3Jvb21DYXRlZ29yeSIsImxvZyIsInBlcmlvZF9ubyIsIl9wZXJpb2RObyIsImluZGV4IiwidW5kZWZpbmVkIiwiY2hpbGRyZW4iLCJwb3NpdGlvbiIsInBsYXllck5vZGVTY3JpcHQiLCJnZXRDb21wb25lbnQiLCJpbml0X2RhdGEiLCJzdGFydCIsIm9uRGVzdHJveSIsImdldFVzZXJPdXRDYXJkUG9zQnlBY2NvdW50Iiwibm9kZV9zY3JpcHQiLCJzZWF0X25vZGUiLCJpbmRleF9uYW1lIiwib3V0X2NhcmRfbm9kZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJzZWF0aWQiLCJwbGF5ZXJkYXRhX2xpc3QiLCJyb29tQ29kZSIsImlzQXJlbmFNb2RlIiwiX2lzQXJlbmFNb2RlIiwiaG91c2VtYW5hZ2VpZCIsImNyZWF0b3JfaWQiLCJjcmVhdG9ySWQiLCJnZXRQbGF5ZXJJbmZvIiwicGxheWVySW5mbyIsImF1ZGlvRW5naW5lIiwic3RvcEFsbCIsInJlc291cmNlcyIsImxvYWQiLCJBdWRpb0NsaXAiLCJjbGlwIiwicGxheSIsImdhbWViZWZvcmVfbm9kZSIsInpJbmRleCIsIm5lZWRQbGF5ZXJzIiwiX25lZWRQbGF5ZXJzIiwiY2FudmFzIiwiQ2FudmFzIiwiZmluZCIsInNjcmVlbkhlaWdodCIsImRlc2lnblJlc29sdXRpb24iLCJoZWlnaHQiLCJzY3JlZW5XaWR0aCIsIndpZHRoIiwid2FpdGluZ05vZGUiLCJzZXRDb250ZW50U2l6ZSIsInNpemUiLCJhbmNob3JYIiwiYW5jaG9yWSIsIngiLCJ5IiwiX3dhaXRpbmdVSU5vZGUiLCJyb29tSW5mb05vZGUiLCJyb29tTGFiZWwiLCJhZGRDb21wb25lbnQiLCJmb250U2l6ZSIsImhvcml6b250YWxBbGlnbiIsIkhvcml6b250YWxBbGlnbiIsIkxFRlQiLCJjb2xvciIsInJvb21PdXRsaW5lIiwiTGFiZWxPdXRsaW5lIiwibGVhdmVCdG5Ob2RlIiwibGVhdmVCdG5CZyIsIkdyYXBoaWNzIiwiZmlsbENvbG9yIiwicm91bmRSZWN0IiwiZmlsbCIsInN0cm9rZUNvbG9yIiwibGluZVdpZHRoIiwic3Ryb2tlIiwibGVhdmVCdG5MYWJlbCIsImxlYXZlTGFiZWwiLCJDRU5URVIiLCJsZWF2ZU91dGxpbmUiLCJFdmVudFR5cGUiLCJUT1VDSF9TVEFSVCIsInNjYWxlIiwiVE9VQ0hfRU5EIiwiX2xlYXZlUm9vbSIsIlRPVUNIX0NBTkNFTCIsIl91cGRhdGVXYWl0aW5nQW5pbWF0aW9uIiwiX3VwZGF0ZVdhaXRpbmdVSSIsImN1cnJlbnRQbGF5ZXJzIiwiZGVzdHJveSIsImxlYXZlUm9vbSIsInBsYXllcnMiLCJub2RlU2NyaXB0IiwiaiIsInAiLCJpZCIsInN0YXRlIiwiY2FyZHNfY291bnQiLCJpc19sYW5kbG9yZCIsImdhbWVpbmdfbm9kZSIsInRpbWVvdXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBQSxFQUFFLENBQUNDLEtBQUssQ0FBQztFQUNMLFdBQVNELEVBQUUsQ0FBQ0UsU0FBUztFQUVyQkMsVUFBVSxFQUFFO0lBQ1JDLFFBQVEsRUFBRUosRUFBRSxDQUFDSyxLQUFLO0lBQ2xCQyxZQUFZLEVBQUVOLEVBQUUsQ0FBQ0ssS0FBSztJQUN0QkUsWUFBWSxFQUFFUCxFQUFFLENBQUNLLEtBQUs7SUFDdEJHLG1CQUFtQixFQUFFUixFQUFFLENBQUNTLE1BQU07SUFDOUJDLGdCQUFnQixFQUFFVixFQUFFLENBQUNXO0VBQ3pCLENBQUM7RUFFREMsTUFBTSxXQUFBQSxPQUFBLEVBQUc7SUFFTCxJQUFJQyxRQUFRLEdBQUdDLE1BQU0sQ0FBQ0QsUUFBUTtJQUM5QixJQUFJRSxTQUFTLEdBQUdELE1BQU0sQ0FBQ0MsU0FBUyxJQUFJO01BQUVDLFlBQVksRUFBRSxDQUFDO0lBQUUsQ0FBQztJQUN4RCxJQUFJQyxZQUFZLEdBQUdILE1BQU0sQ0FBQ0csWUFBWSxJQUFJLENBQUM7SUFFM0MsSUFBSSxDQUFDSixRQUFRLElBQUksQ0FBQ0EsUUFBUSxDQUFDSyxVQUFVLElBQUksQ0FBQ0wsUUFBUSxDQUFDTSxNQUFNLEVBQUU7TUFDdkRDLE9BQU8s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SSxDQUFDK0UsWUFBWSxDQUFDLGFBQWEsQ0FBQztRQUNqRCxJQUFJbUYsVUFBVSxJQUFJQSxVQUFVLENBQUNoSixTQUFTLEtBQUt0QyxJQUFJLENBQUMyRSxTQUFTLEVBQUU7VUFDdkR2RCxJQUFJLENBQUNHLElBQUksQ0FBQyxxQkFBcUIsRUFBRTtZQUM3Qm1LLEtBQUssRUFBRSxTQUFTO1lBQ2hCSSxPQUFPLEVBQUU5TCxJQUFJLENBQUM4TDtVQUNsQixDQUFDLENBQUM7VUFDRjtRQUNKO01BQ0o7SUFDSjtFQUNKLENBQUM7RUFFRDtBQUNKO0FBQ0E7RUFDSTdHLGVBQWUsRUFBRSxTQUFBQSxnQkFBU2pGLElBQUksRUFBRTtJQUU1QjtJQUNBLEtBQUssSUFBSXFCLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBRyxJQUFJLENBQUNQLGNBQWMsQ0FBQ1EsTUFBTSxFQUFFRCxDQUFDLEVBQUUsRUFBRTtNQUNqRCxJQUFJRCxJQUFJLEdBQUcsSUFBSSxDQUFDTixjQUFjLENBQUNPLENBQUMsQ0FBQztNQUNqQyxJQUFJRCxJQUFJLEVBQUU7UUFDTixJQUFJa0ssVUFBVSxHQUFHbEssSUFBSSxDQUFDK0UsWUFBWSxDQUFDLGFBQWEsQ0FBQztRQUNqRCxJQUFJbUYsVUFBVSxJQUFJQSxVQUFVLENBQUNoSixTQUFTLEtBQUt0QyxJQUFJLENBQUMyRSxTQUFTLEVBQUU7VUFDdkR2RCxJQUFJLENBQUNHLElBQUksQ0FBQyxxQkFBcUIsRUFBRTtZQUM3Qm1LLEtBQUssRUFBRTtVQUNYLENBQUMsQ0FBQztVQUNGO1FBQ0o7TUFDSjtJQUNKO0VBQ0o7QUFDSixDQUFDLENBQUMiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXNDb250ZW50IjpbIi8vIOS9v+eUqOWFqOWxgOWPmOmHj++8jOS4jeS9v+eUqCByZXF1aXJlXG4vLyDjgJDkv67lpI3niYjmnKzjgJHnroDljJblj5HniYzpgLvovpHvvIzkuI3lho3kvb/nlKjlrprml7blmajosIPluqZcbi8vIOaguOW/g+WOn+WIme+8mlxuLy8gMS4gZ2FtZWluZ1VJLmpzIOiHquW3seWkhOeQhuWPkeeJjOWKqOeUu1xuLy8gMi4gZ2FtZVNjZW5lLmpzIOWPqui0n+i0o+i9rOWPkeS6i+S7tue7mSBwbGF5ZXJfbm9kZVxuLy8gMy4g5LiN5L6d6LWWIHNjaGVkdWxlT25jZSDmjqfliLblj5HniYzoioLlpY9cblxuY2MuQ2xhc3Moe1xuICAgIGV4dGVuZHM6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgZGlfbGFiZWw6IGNjLkxhYmVsLFxuICAgICAgICBiZWlzaHVfbGFiZWw6IGNjLkxhYmVsLFxuICAgICAgICByb29taWRfbGFiZWw6IGNjLkxhYmVsLFxuICAgICAgICBwbGF5ZXJfbm9kZV9wcmVmYWJzOiBjYy5QcmVmYWIsXG4gICAgICAgIHBsYXllcnNfc2VhdF9wb3M6IGNjLk5vZGUsXG4gICAgfSxcblxuICAgIG9uTG9hZCgpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICB2YXIgUm9vbVN0YXRlID0gd2luZG93LlJvb21TdGF0ZSB8fCB7IFJPT01fSU5WQUxJRDogLTEgfVxuICAgICAgICB2YXIgaXNvcGVuX3NvdW5kID0gd2luZG93Lmlzb3Blbl9zb3VuZCB8fCAxXG5cbiAgICAgICAgaWYgKCFteWdsb2JhbCB8fCAhbXlnbG9iYWwucGxheWVyRGF0YSB8fCAhbXlnbG9iYWwuc29ja2V0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiZ2FtZVNjZW5lOiBteWdsb2JhbOOAgXBsYXllckRhdGEg5oiWIHNvY2tldCDmnKrlrprkuYlcIilcbiAgICAgICAgICAgIHRoaXMuX3dhaXRGb3JJbml0KClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9pbml0U2NlbmUobXlnbG9iYWwsIFJvb21TdGF0ZSwgaXNvcGVuX3NvdW5kKVxuICAgICAgICB0aGlzLl9zdGFydE9ubGluZU1vbml0b3JpbmcoKVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDlnKjnur/nm5HmtYvlkozlhbbku5blip/og71cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIF9zdGFydE9ubGluZU1vbml0b3Jpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiZ2FtZVNjZW5lOiBteWdsb2JhbCDmnKrlrprkuYnvvIzml6Dms5XlkK/liqjlnKjnur/nm5HmtYtcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHRoaXMuX29ubGluZVN0YXR1c0hhbmRsZXIgPSBmdW5jdGlvbihpc09ubGluZSkge1xuICAgICAgICAgICAgaWYgKCFpc09ubGluZSkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dPZmZsaW5lTWVzc2FnZSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChteWdsb2JhbC5hZGRPbmxpbmVTdGF0dXNMaXN0ZW5lcikge1xuICAgICAgICAgICAgbXlnbG9iYWwuYWRkT25saW5lU3RhdHVzTGlzdGVuZXIodGhpcy5fb25saW5lU3RhdHVzSGFuZGxlcilcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKG15Z2xvYmFsLmV2ZW50bGlzdGVyKSB7XG4gICAgICAgICAgICBteWdsb2JhbC5ldmVudGxpc3Rlci5vbihcImZvcmNlX2xvZ291dFwiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+aqyDmuLjmiI/lnLrmma/mlLbliLDlvLrliLbkuIvnur/kuovku7Y6XCIsIGRhdGEpXG4gICAgICAgICAgICAgICAgc2VsZi5faGFuZGxlRm9yY2VMb2dvdXQoZGF0YSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIF9zaG93T2ZmbGluZU1lc3NhZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLndhcm4oXCLwn5KUIOa4uOaIj+WcuuaZr++8mue9kee7nOi/nuaOpeW3suaWreW8gFwiKVxuICAgIH0sXG4gICAgXG4gICAgX2hhbmRsZUZvcmNlTG9nb3V0OiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciByZWFzb24gPSBkYXRhLnJlYXNvbiB8fCBcIuaCqOW3suiiq+W8uuWItuS4i+e6v1wiXG4gICAgICAgIGNvbnNvbGUud2FybihcIvCfmqsg5ri45oiP5Zy65pmv5by65Yi25LiL57q/OlwiLCByZWFzb24pXG4gICAgICAgIFxuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKG15Z2xvYmFsICYmIG15Z2xvYmFsLnN0b3BPbmxpbmVNb25pdG9yaW5nKSB7XG4gICAgICAgICAgICBteWdsb2JhbC5zdG9wT25saW5lTW9uaXRvcmluZygpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB0aGlzLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYWxlcnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBhbGVydChyZWFzb24gKyBcIlxcblxcbuivt+mHjeaWsOeZu+W9lVwiKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwibG9naW5TY2VuZVwiKVxuICAgICAgICB9LCAwLjUpXG4gICAgfSxcbiAgICBcbiAgICBfc3RvcE9ubGluZU1vbml0b3Jpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgXG4gICAgICAgIGlmIChteWdsb2JhbCAmJiBteWdsb2JhbC5yZW1vdmVPbmxpbmVTdGF0dXNMaXN0ZW5lciAmJiB0aGlzLl9vbmxpbmVTdGF0dXNIYW5kbGVyKSB7XG4gICAgICAgICAgICBteWdsb2JhbC5yZW1vdmVPbmxpbmVTdGF0dXNMaXN0ZW5lcih0aGlzLl9vbmxpbmVTdGF0dXNIYW5kbGVyKVxuICAgICAgICAgICAgdGhpcy5fb25saW5lU3RhdHVzSGFuZGxlciA9IG51bGxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgX3dhaXRGb3JJbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgYXR0ZW1wdHMgPSAwO1xuICAgICAgICB2YXIgbWF4QXR0ZW1wdHMgPSAyMDtcbiAgICAgICAgXG4gICAgICAgIHZhciBjaGVja0luaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGF0dGVtcHRzKys7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbDtcbiAgICAgICAgICAgIGlmIChteWdsb2JhbCAmJiBteWdsb2JhbC5wbGF5ZXJEYXRhICYmIG15Z2xvYmFsLnNvY2tldCkge1xuICAgICAgICAgICAgICAgIHZhciBSb29tU3RhdGUgPSB3aW5kb3cuUm9vbVN0YXRlIHx8IHsgUk9PTV9JTlZBTElEOiAtMSB9O1xuICAgICAgICAgICAgICAgIHZhciBpc29wZW5fc291bmQgPSB3aW5kb3cuaXNvcGVuX3NvdW5kIHx8IDE7XG4gICAgICAgICAgICAgICAgc2VsZi5faW5pdFNjZW5lKG15Z2xvYmFsLCBSb29tU3RhdGUsIGlzb3Blbl9zb3VuZCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGF0dGVtcHRzIDwgbWF4QXR0ZW1wdHMpIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrSW5pdCwgMTAwKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImdhbWVTY2VuZSDliJ3lp4vljJbotoXml7ZcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrSW5pdCwgMTAwKTtcbiAgICB9LFxuICAgIFxuICAgIF9pbml0U2NlbmU6IGZ1bmN0aW9uKG15Z2xvYmFsLCBSb29tU3RhdGUsIGlzb3Blbl9zb3VuZCkge1xuICAgICAgICB0aGlzLnBsYXllck5vZGVMaXN0ID0gW11cbiAgICAgICAgXG4gICAgICAgIHZhciBib3R0b20gPSBteWdsb2JhbC5wbGF5ZXJEYXRhLmJvdHRvbSB8fCAxXG4gICAgICAgIHZhciByYXRlID0gbXlnbG9iYWwucGxheWVyRGF0YS5yYXRlIHx8IDFcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZGlfbGFiZWwuc3RyaW5nID0gXCLlupU6XCIgKyBib3R0b21cbiAgICAgICAgdGhpcy5iZWlzaHVfbGFiZWwuc3RyaW5nID0gXCLlgI3mlbA6XCIgKyByYXRlXG4gICAgICAgIHRoaXMucm9vbXN0YXRlID0gUm9vbVN0YXRlLlJPT01fSU5WQUxJRFxuICAgICAgICB0aGlzLl9pc1dhaXRpbmdGb3JQbGF5ZXJzID0gZmFsc2VcblxuXG4gICAgICAgIC8vIOebkeWQrO+8jOe7meWFtuS7lueOqeWutuWPkeeJjCjlhoXpg6jkuovku7YpXG4gICAgICAgIC8vIOOAkOaguOW/g+OAkXBsYXllcl9ub2RlIOebtOaOpeaYvuekuiAxNyDlvKDniYzog4zvvIzkuI3lho3pgJDlvKDliqjnlLtcbiAgICAgICAgdGhpcy5ub2RlLm9uKFwicHVzaGNhcmRfb3RoZXJfZXZlbnRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGxheWVyTm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLmVtaXQoXCJwdXNoX2NhcmRfZXZlbnRcIilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDnm5HlkKzmiL/pl7TnirbmgIHmlLnlj5jkuovku7ZcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uUm9vbUNoYW5nZVN0YXRlKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMucm9vbXN0YXRlID0gZGF0YVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoZGF0YSAhPT0gUm9vbVN0YXRlLlJPT01fSU5WQUxJRCAmJiB0aGlzLl9pc1dhaXRpbmdGb3JQbGF5ZXJzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faGlkZVdhaXRpbmdVSSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICB0aGlzLm5vZGUub24oXCJjYW5yb2JfZXZlbnRcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wbGF5ZXJOb2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInBsYXllcm5vZGVfY2Fucm9iX2V2ZW50XCIsIGV2ZW50KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIHRoaXMubm9kZS5vbihcImNob29zZV9jYXJkX2V2ZW50XCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgZ2FtZXVpX25vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJnYW1laW5nVUlcIilcbiAgICAgICAgICAgIGlmIChnYW1ldWlfbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBnYW1ldWlfbm9kZS5lbWl0KFwiY2hvb3NlX2NhcmRfZXZlbnRcIiwgZXZlbnQpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICB0aGlzLm5vZGUub24oXCJ1bmNob29zZV9jYXJkX2V2ZW50XCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgZ2FtZXVpX25vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJnYW1laW5nVUlcIilcbiAgICAgICAgICAgIGlmIChnYW1ldWlfbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBnYW1ldWlfbm9kZS5lbWl0KFwidW5jaG9vc2VfY2FyZF9ldmVudFwiLCBldmVudClcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIHZhciBjdXJyZW50Um9vbUNvZGUgPSBteWdsb2JhbC5zb2NrZXQuZ2V0Q3VycmVudFJvb21Db2RlKClcbiAgICAgICAgdmFyIGlzSW5Sb29tID0gbXlnbG9iYWwuc29ja2V0LmlzSW5Sb29tKClcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICB2YXIgcm9vbURhdGEgPSBteWdsb2JhbC5yb29tRGF0YVxuICAgICAgICBcbiAgICAgICAgaWYgKGlzSW5Sb29tICYmIGN1cnJlbnRSb29tQ29kZSAmJiAhcm9vbURhdGEpIHtcbiAgICAgICAgICAgIHJvb21EYXRhID0ge1xuICAgICAgICAgICAgICAgIHJvb21pZDogY3VycmVudFJvb21Db2RlLFxuICAgICAgICAgICAgICAgIHJvb21fY29kZTogY3VycmVudFJvb21Db2RlLFxuICAgICAgICAgICAgICAgIHNlYXRpbmRleDogMSxcbiAgICAgICAgICAgICAgICBwbGF5ZXJkYXRhOiBbe1xuICAgICAgICAgICAgICAgICAgICBhY2NvdW50aWQ6IG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudGlkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEucGxheWVySWQsXG4gICAgICAgICAgICAgICAgICAgIG5pY2tfbmFtZTogbXlnbG9iYWwucGxheWVyRGF0YS5uaWNrTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYXZhdGFyVXJsOiBcImF2YXRhcl8xXCIsXG4gICAgICAgICAgICAgICAgICAgIGdvbGRfY291bnQ6IG15Z2xvYmFsLnBsYXllckRhdGEuZ29iYWxfY291bnQgfHwgMTAwMCwgLy8g8J+Up+OAkOS/ruWkjeOAkeS9v+eUqCBnb2xkX2NvdW50IOWtl+autVxuICAgICAgICAgICAgICAgICAgICBnb2xkY291bnQ6IG15Z2xvYmFsLnBsYXllckRhdGEuZ29iYWxfY291bnQgfHwgMTAwMCwgIC8vIOWFvOWuueaXp+WuouaIt+err1xuICAgICAgICAgICAgICAgICAgICBzZWF0aW5kZXg6IDEsXG4gICAgICAgICAgICAgICAgICAgIGlzcmVhZHk6IHRydWVcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAocm9vbURhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NSb29tRGF0YShyb29tRGF0YSwgbXlnbG9iYWwsIGlzb3Blbl9zb3VuZClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG15Z2xvYmFsLnNvY2tldC5yZXF1ZXN0X2VudGVyX3Jvb20oe30sIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGVyciAhPSAwKSB7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc1Jvb21EYXRhKHJlc3VsdCwgbXlnbG9iYWwsIGlzb3Blbl9zb3VuZClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIH1cblxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25QbGF5ZXJKb2luUm9vbShmdW5jdGlvbihqb2luX3BsYXllcmRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkUGxheWVyTm9kZShqb2luX3BsYXllcmRhdGEpXG5cbiAgICAgICAgICAgIGlmICghdGhpcy5fcGxheWVyZGF0YUxpc3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5ZXJkYXRhTGlzdCA9IFtdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9wbGF5ZXJkYXRhTGlzdC5wdXNoKGpvaW5fcGxheWVyZGF0YSlcblxuICAgICAgICAgICAgaWYgKHRoaXMuX2lzV2FpdGluZ0ZvclBsYXllcnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zaG93V2FpdGluZ1VJKDMgLSB0aGlzLl9wbGF5ZXJkYXRhTGlzdC5sZW5ndGgsIHRoaXMuX2N1cnJlbnRSb29tQ29kZSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMucGxheWVyTm9kZUxpc3QubGVuZ3RoID49IDMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9oaWRlV2FpdGluZ1VJKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vblBsYXllclJlYWR5KGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wbGF5ZXJOb2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInBsYXllcl9yZWFkeV9ub3RpZnlcIiwgZGF0YSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25HYW1lU3RhcnQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGxheWVyTm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLmVtaXQoXCJnYW1lc3RhcnRfZXZlbnRcIilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBnYW1lYmVmb3JlVUkgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJnYW1lYmVmb3JlVUlcIilcbiAgICAgICAgICAgIGlmIChnYW1lYmVmb3JlVUkpIHtcbiAgICAgICAgICAgICAgICBnYW1lYmVmb3JlVUkuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vblJvYlN0YXRlKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5re75YqgIHJvdW5kIOWtl+aute+8jOWMuuWIhuWPq+WcsOS4u+WSjOaKouWcsOS4u1xuICAgICAgICAgICAgdmFyIGV2ZW50V2l0aFJvdW5kID0gT2JqZWN0LmFzc2lnbih7fSwgZXZlbnQsIHsgcm91bmQ6IDIgfSlcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wbGF5ZXJOb2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInBsYXllcm5vZGVfcm9iX3N0YXRlX2V2ZW50XCIsIGV2ZW50V2l0aFJvdW5kKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeebkeWQrOWPq+WcsOS4u+e7k+aenO+8iOesrOS4gOi9ru+8iVxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25CaWRSZXN1bHQoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmt7vliqAgcm91bmQg5a2X5q6177yM5Yy65YiG5Y+r5Zyw5Li75ZKM5oqi5Zyw5Li7XG4gICAgICAgICAgICB2YXIgZXZlbnRXaXRoUm91bmQgPSBPYmplY3QuYXNzaWduKHt9LCBldmVudCwgeyByb3VuZDogMSB9KVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLnBsYXllck5vZGVMaXN0W2ldXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5lbWl0KFwicGxheWVybm9kZV9yb2Jfc3RhdGVfZXZlbnRcIiwgZXZlbnRXaXRoUm91bmQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQ2hhbmdlTWFzdGVyKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLm1hc3Rlcl9hY2NvdW50aWQgPSBldmVudFxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLnBsYXllck5vZGVMaXN0W2ldXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5lbWl0KFwicGxheWVybm9kZV9jaGFuZ2VtYXN0ZXJfZXZlbnRcIiwgZXZlbnQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeebkeWQrOWHuueJjOmYtuauteW8gOWni1xuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25QbGF5U3RhcnQoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgLy8g6K6+572u5oi/6Ze054q25oCB5Li65Ye654mM6Zi25q61XG4gICAgICAgICAgICB0aGlzLnJvb21zdGF0ZSA9IFJvb21TdGF0ZS5ST09NX1BMQVlJTkdcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIHRoaXMubm9kZS5vbihcInVwZGF0ZV9jYXJkX2NvdW50X2V2ZW50XCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wbGF5ZXJOb2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInVwZGF0ZV9jYXJkX2NvdW50X2V2ZW50XCIsIGRhdGEpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uU2hvd0JvdHRvbUNhcmQoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBnYW1ldWlfbm9kZSA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcImdhbWVpbmdVSVwiKVxuICAgICAgICAgICAgaWYgKGdhbWV1aV9ub2RlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdhbWV1aV9ub2RlLmVtaXQoXCJzaG93X2JvdHRvbV9jYXJkX2V2ZW50XCIsIGV2ZW50KVxuICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIFxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25Sb29tUmVzdG9yZWQoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgaWYgKGRhdGEucm9vbV9jb2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3RvcmVkUm9vbURhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgIHJvb21pZDogZGF0YS5yb29tX2NvZGUsXG4gICAgICAgICAgICAgICAgICAgIHJvb21fY29kZTogZGF0YS5yb29tX2NvZGUsXG4gICAgICAgICAgICAgICAgICAgIHNlYXRpbmRleDogMSxcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyZGF0YTogW3tcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjY291bnRpZDogZGF0YS5wbGF5ZXJfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBuaWNrX25hbWU6IGRhdGEucGxheWVyX25hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhdmF0YXJVcmw6IFwiYXZhdGFyXzFcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvbGRfY291bnQ6IGRhdGEuZ29sZF9jb3VudCB8fCAxMDAwLCAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55SoIGdvbGRfY291bnQg5a2X5q61XG4gICAgICAgICAgICAgICAgICAgICAgICBnb2xkY291bnQ6IGRhdGEuZ29sZF9jb3VudCB8fCAxMDAwLCAgLy8g5YW85a655pen5a6i5oi356uvXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWF0aW5kZXg6IDFcbiAgICAgICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc1Jvb21EYXRhKHJlc3RvcmVkUm9vbURhdGEsIG15Z2xvYmFsLCBpc29wZW5fc291bmQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgXG4gICAgICAgIC8vIOOAkOaWsOWinuOAkeebkeWQrOa4uOaIj+eKtuaAgeaBouWkjeS6i+S7tlxuICAgICAgICB0aGlzLm5vZGUub24oXCJnYW1lX3N0YXRlX3Jlc3RvcmVkXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuX29uR2FtZVN0YXRlUmVzdG9yZWQoZGF0YSlcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICBcbiAgICAgICAgLy8g44CQ5paw5aKe44CR55uR5ZCs546p5a625o6J57q/6YCa55+lXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vblBsYXllck9mZmxpbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5fb25QbGF5ZXJPZmZsaW5lKGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgXG4gICAgICAgIC8vIOOAkOaWsOWinuOAkeebkeWQrOeOqeWutuS4iue6v+mAmuefpVxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25QbGF5ZXJPbmxpbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5fb25QbGF5ZXJPbmxpbmUoZGF0YSlcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICBcbiAgICB9LFxuXG4gICAgc2V0UGxheWVyU2VhdFBvcyhzZWF0X2luZGV4KSB7XG4gICAgICAgIGlmIChzZWF0X2luZGV4IDwgMSB8fCBzZWF0X2luZGV4ID4gMykge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuXG4gICAgICAgIHN3aXRjaCAoc2VhdF9pbmRleCkge1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyZGF0YV9saXN0X3Bvc1sxXSA9IDBcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllcmRhdGFfbGlzdF9wb3NbMl0gPSAxXG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXJkYXRhX2xpc3RfcG9zWzNdID0gMlxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXJkYXRhX2xpc3RfcG9zWzJdID0gMFxuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyZGF0YV9saXN0X3Bvc1szXSA9IDFcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllcmRhdGFfbGlzdF9wb3NbMV0gPSAyXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllcmRhdGFfbGlzdF9wb3NbM10gPSAwXG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXJkYXRhX2xpc3RfcG9zWzFdID0gMVxuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyZGF0YV9saXN0X3Bvc1syXSA9IDJcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFkZFBsYXllck5vZGUocGxheWVyX2RhdGEpIHtcblxuICAgICAgICBpZiAoIXRoaXMucGxheWVyX25vZGVfcHJlZmFicykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcInBsYXllcl9ub2RlX3ByZWZhYnMg5pyq57uR5a6a77yBXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLnBsYXllcnNfc2VhdF9wb3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJwbGF5ZXJzX3NlYXRfcG9zIOacque7keWumu+8gVwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwbGF5ZXJub2RlX2luc3QgPSBjYy5pbnN0YW50aWF0ZSh0aGlzLnBsYXllcl9ub2RlX3ByZWZhYnMpO1xuICAgICAgICBpZiAoIXBsYXllcm5vZGVfaW5zdCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuaXoOazleWunuS+i+WMliBwbGF5ZXJfbm9kZV9wcmVmYWJzXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcGxheWVybm9kZV9pbnN0LnBhcmVudCA9IHRoaXMubm9kZTtcbiAgICAgICAgdGhpcy5wbGF5ZXJOb2RlTGlzdC5wdXNoKHBsYXllcm5vZGVfaW5zdCk7XG5cbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeWwhuaIv+mXtOexu+Wei+S8oOmAkue7mSBwbGF5ZXJfbm9kZe+8iOeUqOS6juWMuuWIhuaZrumAmuWcuuWSjOernuaKgOWcuu+8iVxuICAgICAgICBpZiAoIXBsYXllcl9kYXRhLnJvb21fY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgIHBsYXllcl9kYXRhLnJvb21fY2F0ZWdvcnkgPSB0aGlzLl9yb29tQ2F0ZWdvcnkgfHwgMVxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFthZGRQbGF5ZXJOb2RlXSDorr7nva4gcGxheWVyX2RhdGEucm9vbV9jYXRlZ29yeSA9XCIsIHBsYXllcl9kYXRhLnJvb21fY2F0ZWdvcnkpXG4gICAgICAgIH1cblxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5bCG5pyf5Y+35Lyg6YCS57uZIHBsYXllcl9ub2RlXG4gICAgICAgIGlmICghcGxheWVyX2RhdGEucGVyaW9kX25vICYmIHRoaXMuX3BlcmlvZE5vKSB7XG4gICAgICAgICAgICBwbGF5ZXJfZGF0YS5wZXJpb2Rfbm8gPSB0aGlzLl9wZXJpb2ROb1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5wbGF5ZXJkYXRhX2xpc3RfcG9zW3BsYXllcl9kYXRhLnNlYXRpbmRleF07XG4gICAgICAgIFxuICAgICAgICBpZiAoaW5kZXggPT09IHVuZGVmaW5lZCB8fCBpbmRleCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuaXoOaViOeahOW6p+S9jee0ouW8lTpcIiwgcGxheWVyX2RhdGEuc2VhdGluZGV4KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLnBsYXllcnNfc2VhdF9wb3MuY2hpbGRyZW4gfHwgIXRoaXMucGxheWVyc19zZWF0X3Bvcy5jaGlsZHJlbltpbmRleF0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLluqfkvY3oioLngrnkuI3lrZjlnKjvvIxpbmRleDpcIiwgaW5kZXgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBwbGF5ZXJub2RlX2luc3QucG9zaXRpb24gPSB0aGlzLnBsYXllcnNfc2VhdF9wb3MuY2hpbGRyZW5baW5kZXhdLnBvc2l0aW9uO1xuICAgICAgICBcbiAgICAgICAgdmFyIHBsYXllck5vZGVTY3JpcHQgPSBwbGF5ZXJub2RlX2luc3QuZ2V0Q29tcG9uZW50KFwicGxheWVyX25vZGVcIik7XG4gICAgICAgIGlmICghcGxheWVyTm9kZVNjcmlwdCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuaXoOazleiOt+WPliBwbGF5ZXJfbm9kZSDnu4Tku7ZcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHBsYXllck5vZGVTY3JpcHQuaW5pdF9kYXRhKHBsYXllcl9kYXRhLCBpbmRleCk7XG4gICAgfSxcblxuICAgIHN0YXJ0KCkge1xuICAgIH0sXG5cbiAgICBvbkRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9zdG9wT25saW5lTW9uaXRvcmluZygpXG4gICAgfSxcblxuICAgIGdldFVzZXJPdXRDYXJkUG9zQnlBY2NvdW50KGFjY291bnRpZCkge1xuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLnBsYXllck5vZGVMaXN0IHx8ICF0aGlzLnBsYXllcnNfc2VhdF9wb3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJwbGF5ZXJOb2RlTGlzdCDmiJYgcGxheWVyc19zZWF0X3BvcyDmnKrliJ3lp4vljJZcIik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGVfc2NyaXB0ID0gbm9kZS5nZXRDb21wb25lbnQoXCJwbGF5ZXJfbm9kZVwiKVxuICAgICAgICAgICAgICAgIGlmIChub2RlX3NjcmlwdCAmJiBub2RlX3NjcmlwdC5hY2NvdW50aWQgPT09IGFjY291bnRpZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZV9zY3JpcHQuc2VhdF9pbmRleCA9PT0gdW5kZWZpbmVkIHx8IG5vZGVfc2NyaXB0LnNlYXRfaW5kZXggPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLml6DmlYjnmoQgc2VhdF9pbmRleFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMucGxheWVyc19zZWF0X3Bvcy5jaGlsZHJlbiB8fCAhdGhpcy5wbGF5ZXJzX3NlYXRfcG9zLmNoaWxkcmVuW25vZGVfc2NyaXB0LnNlYXRfaW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi5bqn5L2N6IqC54K55LiN5a2Y5Zyo77yMc2VhdF9pbmRleDpcIiwgbm9kZV9zY3JpcHQuc2VhdF9pbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlYXRfbm9kZSA9IHRoaXMucGxheWVyc19zZWF0X3Bvcy5jaGlsZHJlbltub2RlX3NjcmlwdC5zZWF0X2luZGV4XVxuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXhfbmFtZSA9IFwiY2FyZHNvdXR6b25lXCIgKyBub2RlX3NjcmlwdC5zZWF0X2luZGV4XG4gICAgICAgICAgICAgICAgICAgIHZhciBvdXRfY2FyZF9ub2RlID0gc2VhdF9ub2RlLmdldENoaWxkQnlOYW1lKGluZGV4X25hbWUpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvdXRfY2FyZF9ub2RlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9LFxuICAgIFxuICAgIF9wcm9jZXNzUm9vbURhdGE6IGZ1bmN0aW9uKHJlc3VsdCwgbXlnbG9iYWwsIGlzb3Blbl9zb3VuZCkge1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCLwn46uIFtfcHJvY2Vzc1Jvb21EYXRhXSDmjqXmlLbliLDnmoTmlbDmja46XCIsIEpTT04uc3RyaW5naWZ5KHJlc3VsdCkpXG4gICAgICAgIFxuICAgICAgICB2YXIgc2VhdGlkID0gcmVzdWx0LnNlYXRpbmRleCB8fCAxXG4gICAgICAgIFxuICAgICAgICB0aGlzLnBsYXllcmRhdGFfbGlzdF9wb3MgPSBbXVxuICAgICAgICB0aGlzLnNldFBsYXllclNlYXRQb3Moc2VhdGlkKVxuXG4gICAgICAgIHZhciBwbGF5ZXJkYXRhX2xpc3QgPSByZXN1bHQucGxheWVyZGF0YSB8fCBbXVxuICAgICAgICB2YXIgcm9vbWlkID0gcmVzdWx0LnJvb21pZCB8fCByZXN1bHQucm9vbV9jb2RlIHx8IHJlc3VsdC5yb29tQ29kZSB8fCBcIldBSVRJTkdcIlxuXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHmo4Dmn6XmmK/lkKbmmK/nq57mioDlnLrmqKHlvI9cbiAgICAgICAgdmFyIGlzQXJlbmFNb2RlID0gcmVzdWx0LnJvb21fY2F0ZWdvcnkgPT09IDJcbiAgICAgICAgaWYgKGlzQXJlbmFNb2RlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW19wcm9jZXNzUm9vbURhdGFdIOernuaKgOWcuuaooeW8jzogcm9vbV9jYXRlZ29yeT0yLCBwbGF5ZXJkYXRh5pWw6YePPVwiICsgcGxheWVyZGF0YV9saXN0Lmxlbmd0aCArIFwiLCDmnJ/lj7c9XCIgKyByZXN1bHQucGVyaW9kX25vKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeS/neWtmOaIv+mXtOexu+Wei+WIsOWunuS+i+WPmOmHj++8jOS+myBwbGF5ZXJfbm9kZSDkvb/nlKhcbiAgICAgICAgdGhpcy5fcm9vbUNhdGVnb3J5ID0gcmVzdWx0LnJvb21fY2F0ZWdvcnkgfHwgMVxuICAgICAgICB0aGlzLl9pc0FyZW5hTW9kZSA9IGlzQXJlbmFNb2RlXG4gICAgICAgIHRoaXMuX3BlcmlvZE5vID0gcmVzdWx0LnBlcmlvZF9ubyB8fCBcIlwiIC8vIPCflKfjgJDmlrDlop7jgJHkv53lrZjmnJ/lj7dcblxuICAgICAgICB0aGlzLl9wbGF5ZXJkYXRhTGlzdCA9IHBsYXllcmRhdGFfbGlzdFxuXG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5yb29taWRfbGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMucm9vbWlkX2xhYmVsLnN0cmluZyA9IFwi5oi/6Ze05Y+3OlwiICsgcm9vbWlkXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+OriBb5ri45oiP5Zy65pmvXSByb29taWRfbGFiZWwg5pyq57uR5a6a77yBXCIpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEuaG91c2VtYW5hZ2VpZCA9IHJlc3VsdC5ob3VzZW1hbmFnZWlkIHx8IHJlc3VsdC5jcmVhdG9yX2lkIHx8IHJlc3VsdC5jcmVhdG9ySWQgfHwgXCJcIlxuICAgICAgICBcbiAgICAgICAgaWYgKG15Z2xvYmFsLnNvY2tldCAmJiBteWdsb2JhbC5zb2NrZXQuZ2V0UGxheWVySW5mbykge1xuICAgICAgICAgICAgdmFyIHBsYXllckluZm8gPSBteWdsb2JhbC5zb2NrZXQuZ2V0UGxheWVySW5mbygpXG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBsYXllcmRhdGFfbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn46uIFtfcHJvY2Vzc1Jvb21EYXRhXSDmt7vliqDnjqnlrrboioLngrk6IFwiICsgSlNPTi5zdHJpbmdpZnkocGxheWVyZGF0YV9saXN0W2ldKSlcbiAgICAgICAgICAgIHRoaXMuYWRkUGxheWVyTm9kZShwbGF5ZXJkYXRhX2xpc3RbaV0pXG4gICAgICAgIH1cbiAgICAgICAgXG5cbiAgICAgICAgaWYgKGlzb3Blbl9zb3VuZCkge1xuICAgICAgICAgICAgY2MuYXVkaW9FbmdpbmUuc3RvcEFsbCgpXG4gICAgICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcInNvdW5kL2JnXCIsIGNjLkF1ZGlvQ2xpcCwgZnVuY3Rpb24oZXJyLCBjbGlwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2MuYXVkaW9FbmdpbmUucGxheShjbGlwLCB0cnVlLCAxKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIGdhbWViZWZvcmVfbm9kZSA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcImdhbWViZWZvcmVVSVwiKVxuICAgICAgICBpZiAoZ2FtZWJlZm9yZV9ub2RlKSB7XG4gICAgICAgICAgICBnYW1lYmVmb3JlX25vZGUuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgZ2FtZWJlZm9yZV9ub2RlLnpJbmRleCA9IDEwMDBcbiAgICAgICAgICAgIGdhbWViZWZvcmVfbm9kZS5lbWl0KFwiaW5pdFwiKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR56ue5oqA5Zy65qih5byP5LiL5LiN5pi+56S6562J5b6F546p5a62VUnvvIjmiYDmnInnjqnlrrblt7LliIbphY3lpb3vvIlcbiAgICAgICAgaWYgKGlzQXJlbmFNb2RlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW19wcm9jZXNzUm9vbURhdGFdIOernuaKgOWcuuaooeW8j++8muS4jeaYvuekuuetieW+heeOqeWutlVJXCIpXG4gICAgICAgICAgICAvLyDnq57mioDlnLrmqKHlvI/kuIvmiYDmnInnjqnlrrblupTor6Xlt7Lnu4/lh4blpIflpb3vvIznm7TmjqXnrYnlvoXmuLjmiI/lvIDlp4tcbiAgICAgICAgfSBlbHNlIGlmIChwbGF5ZXJkYXRhX2xpc3QubGVuZ3RoIDwgMykge1xuICAgICAgICAgICAgdGhpcy5fc2hvd1dhaXRpbmdVSSgzIC0gcGxheWVyZGF0YV9saXN0Lmxlbmd0aCwgcm9vbWlkKVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBfc2hvd1dhaXRpbmdVSTogZnVuY3Rpb24obmVlZFBsYXllcnMsIHJvb21Db2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB0aGlzLl9pc1dhaXRpbmdGb3JQbGF5ZXJzID0gdHJ1ZVxuICAgICAgICB0aGlzLl9uZWVkUGxheWVycyA9IG5lZWRQbGF5ZXJzXG4gICAgICAgIHRoaXMuX2N1cnJlbnRSb29tQ29kZSA9IHJvb21Db2RlIHx8IFwiXCJcblxuXG4gICAgICAgIHRoaXMuX2hpZGVXYWl0aW5nVUkoKVxuXG4gICAgICAgIHZhciBjYW52YXMgPSB0aGlzLm5vZGUuZ2V0Q29tcG9uZW50KGNjLkNhbnZhcykgfHwgY2MuZmluZCgnQ2FudmFzJykuZ2V0Q29tcG9uZW50KGNjLkNhbnZhcylcbiAgICAgICAgdmFyIHNjcmVlbkhlaWdodCA9IGNhbnZhcyA/IGNhbnZhcy5kZXNpZ25SZXNvbHV0aW9uLmhlaWdodCA6IDcyMFxuICAgICAgICB2YXIgc2NyZWVuV2lkdGggPSBjYW52YXMgPyBjYW52YXMuZGVzaWduUmVzb2x1dGlvbi53aWR0aCA6IDEyODBcblxuICAgICAgICB2YXIgd2FpdGluZ05vZGUgPSBuZXcgY2MuTm9kZShcIldhaXRpbmdGb3JQbGF5ZXJzVUlcIilcbiAgICAgICAgd2FpdGluZ05vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZShzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSlcbiAgICAgICAgd2FpdGluZ05vZGUuYW5jaG9yWCA9IDAuNVxuICAgICAgICB3YWl0aW5nTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgIHdhaXRpbmdOb2RlLnggPSAwXG4gICAgICAgIHdhaXRpbmdOb2RlLnkgPSAwXG4gICAgICAgIHdhaXRpbmdOb2RlLnBhcmVudCA9IHRoaXMubm9kZVxuICAgICAgICB0aGlzLl93YWl0aW5nVUlOb2RlID0gd2FpdGluZ05vZGVcblxuICAgICAgICBpZiAocm9vbUNvZGUpIHtcbiAgICAgICAgICAgIHZhciByb29tSW5mb05vZGUgPSBuZXcgY2MuTm9kZShcIlJvb21JbmZvXCIpXG4gICAgICAgICAgICByb29tSW5mb05vZGUueCA9IC1zY3JlZW5XaWR0aC8yICsgMjBcbiAgICAgICAgICAgIHJvb21JbmZvTm9kZS55ID0gc2NyZWVuSGVpZ2h0LzIgLSAzMFxuICAgICAgICAgICAgcm9vbUluZm9Ob2RlLmFuY2hvclggPSAwXG4gICAgICAgICAgICByb29tSW5mb05vZGUuYW5jaG9yWSA9IDAuNVxuXG4gICAgICAgICAgICB2YXIgcm9vbUxhYmVsID0gcm9vbUluZm9Ob2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgIHJvb21MYWJlbC5zdHJpbmcgPSBcIuaIv+mXtOWPtzogXCIgKyByb29tQ29kZVxuICAgICAgICAgICAgcm9vbUxhYmVsLmZvbnRTaXplID0gMjRcbiAgICAgICAgICAgIHJvb21MYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uTEVGVFxuICAgICAgICAgICAgcm9vbUluZm9Ob2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyMTUsIDApXG5cbiAgICAgICAgICAgIHZhciByb29tT3V0bGluZSA9IHJvb21JbmZvTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKVxuICAgICAgICAgICAgcm9vbU91dGxpbmUuY29sb3IgPSBjYy5jb2xvcigwLCAwLCAwKVxuICAgICAgICAgICAgcm9vbU91dGxpbmUud2lkdGggPSAyXG4gICAgICAgICAgICByb29tSW5mb05vZGUucGFyZW50ID0gd2FpdGluZ05vZGVcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZWF2ZUJ0bk5vZGUgPSBuZXcgY2MuTm9kZShcIkxlYXZlQnRuXCIpXG4gICAgICAgIGxlYXZlQnRuTm9kZS54ID0gc2NyZWVuV2lkdGgvMiAtIDEwMFxuICAgICAgICBsZWF2ZUJ0bk5vZGUueSA9IC1zY3JlZW5IZWlnaHQvMiArIDUwXG4gICAgICAgIGxlYXZlQnRuTm9kZS5hbmNob3JYID0gMC41XG4gICAgICAgIGxlYXZlQnRuTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgIGxlYXZlQnRuTm9kZS5zZXRDb250ZW50U2l6ZShjYy5zaXplKDE0MCwgNDApKVxuXG4gICAgICAgIHZhciBsZWF2ZUJ0bkJnID0gbGVhdmVCdG5Ob2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgbGVhdmVCdG5CZy5maWxsQ29sb3IgPSBjYy5jb2xvcigxODAsIDYwLCA2MCwgMjMwKVxuICAgICAgICBsZWF2ZUJ0bkJnLnJvdW5kUmVjdCgtNzAsIC0yMCwgMTQwLCA0MCwgOClcbiAgICAgICAgbGVhdmVCdG5CZy5maWxsKClcbiAgICAgICAgbGVhdmVCdG5CZy5zdHJva2VDb2xvciA9IGNjLmNvbG9yKDIyMCwgMTAwLCAxMDApXG4gICAgICAgIGxlYXZlQnRuQmcubGluZVdpZHRoID0gMlxuICAgICAgICBsZWF2ZUJ0bkJnLnJvdW5kUmVjdCgtNzAsIC0yMCwgMTQwLCA0MCwgOClcbiAgICAgICAgbGVhdmVCdG5CZy5zdHJva2UoKVxuICAgICAgICBsZWF2ZUJ0bk5vZGUucGFyZW50ID0gd2FpdGluZ05vZGVcblxuICAgICAgICB2YXIgbGVhdmVCdG5MYWJlbCA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIilcbiAgICAgICAgbGVhdmVCdG5MYWJlbC5hbmNob3JYID0gMC41XG4gICAgICAgIGxlYXZlQnRuTGFiZWwuYW5jaG9yWSA9IDAuNVxuICAgICAgICB2YXIgbGVhdmVMYWJlbCA9IGxlYXZlQnRuTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBsZWF2ZUxhYmVsLnN0cmluZyA9IFwi56a75byA5oi/6Ze0XCJcbiAgICAgICAgbGVhdmVMYWJlbC5mb250U2l6ZSA9IDIwXG4gICAgICAgIGxlYXZlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICBsZWF2ZUJ0bkxhYmVsLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgdmFyIGxlYXZlT3V0bGluZSA9IGxlYXZlQnRuTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSlcbiAgICAgICAgbGVhdmVPdXRsaW5lLmNvbG9yID0gY2MuY29sb3IoMTAwLCAzMCwgMzApXG4gICAgICAgIGxlYXZlT3V0bGluZS53aWR0aCA9IDJcbiAgICAgICAgbGVhdmVCdG5MYWJlbC5wYXJlbnQgPSBsZWF2ZUJ0bk5vZGVcblxuICAgICAgICBsZWF2ZUJ0bk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfU1RBUlQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbGVhdmVCdG5Ob2RlLnNjYWxlID0gMC45NVxuICAgICAgICB9KVxuICAgICAgICBsZWF2ZUJ0bk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGxlYXZlQnRuTm9kZS5zY2FsZSA9IDFcbiAgICAgICAgICAgIHNlbGYuX2xlYXZlUm9vbSgpXG4gICAgICAgIH0pXG4gICAgICAgIGxlYXZlQnRuTm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9DQU5DRUwsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbGVhdmVCdG5Ob2RlLnNjYWxlID0gMVxuICAgICAgICB9KVxuXG4gICAgICAgIHRoaXMuX3VwZGF0ZVdhaXRpbmdBbmltYXRpb24oKVxuICAgIH0sXG5cbiAgICBfdXBkYXRlV2FpdGluZ1VJOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc1dhaXRpbmdGb3JQbGF5ZXJzKSByZXR1cm5cblxuICAgICAgICB2YXIgY3VycmVudFBsYXllcnMgPSB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aFxuXG4gICAgICAgIGlmIChjdXJyZW50UGxheWVycyA+PSAzKSB7XG4gICAgICAgICAgICB0aGlzLl9oaWRlV2FpdGluZ1VJKClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfdXBkYXRlV2FpdGluZ0FuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICBpZiAoIXRoaXMuX2lzV2FpdGluZ0ZvclBsYXllcnMgfHwgIXRoaXMuX3dhaXRpbmdVSU5vZGUpIHJldHVyblxuICAgICAgICB0aGlzLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuX3VwZGF0ZVdhaXRpbmdBbmltYXRpb24oKVxuICAgICAgICB9LCAxLzYwKVxuICAgIH0sXG4gICAgXG4gICAgX2hpZGVXYWl0aW5nVUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9pc1dhaXRpbmdGb3JQbGF5ZXJzID0gZmFsc2VcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLl93YWl0aW5nVUlOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl93YWl0aW5nVUlOb2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgdGhpcy5fd2FpdGluZ1VJTm9kZSA9IG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9LFxuICAgIFxuICAgIF9sZWF2ZVJvb206IGZ1bmN0aW9uKCkge1xuICAgICAgICBcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIGlmIChteWdsb2JhbCAmJiBteWdsb2JhbC5zb2NrZXQpIHtcbiAgICAgICAgICAgIGlmIChteWdsb2JhbC5zb2NrZXQubGVhdmVSb29tKSB7XG4gICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LmxlYXZlUm9vbSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2hpZGVXYWl0aW5nVUkoKVxuICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIilcbiAgICB9LFxuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOOAkOaWsOWinuOAkea4uOaIj+eKtuaAgeaBouWkjeWkhOeQhlxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIOWkhOeQhua4uOaIj+eKtuaAgeaBouWkjeS6i+S7tlxuICAgICAqL1xuICAgIF9vbkdhbWVTdGF0ZVJlc3RvcmVkOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDnjqnlrrboioLngrnnmoTnirbmgIFcbiAgICAgICAgaWYgKGRhdGEucGxheWVycykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLnBsYXllck5vZGVMaXN0W2ldXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vZGVTY3JpcHQgPSBub2RlLmdldENvbXBvbmVudChcInBsYXllcl9ub2RlXCIpXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlU2NyaXB0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmn6Xmib7lr7nlupTnmoTnjqnlrrbmlbDmja5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGF0YS5wbGF5ZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSBkYXRhLnBsYXllcnNbal1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocC5pZCA9PT0gbm9kZVNjcmlwdC5hY2NvdW50aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5pu05paw546p5a6254q25oCBXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInBsYXllcl9zdGF0ZV91cGRhdGVcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGU6IHAuc3RhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXJkc19jb3VudDogcC5jYXJkc19jb3VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzX2xhbmRsb3JkOiBwLmlzX2xhbmRsb3JkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDpmpDol48gZ2FtZWJlZm9yZVVJXG4gICAgICAgIHZhciBnYW1lYmVmb3JlX25vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJnYW1lYmVmb3JlVUlcIilcbiAgICAgICAgaWYgKGdhbWViZWZvcmVfbm9kZSkge1xuICAgICAgICAgICAgZ2FtZWJlZm9yZV9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOaYvuekuiBnYW1laW5nVUlcbiAgICAgICAgdmFyIGdhbWVpbmdfbm9kZSA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcImdhbWVpbmdVSVwiKVxuICAgICAgICBpZiAoZ2FtZWluZ19ub2RlKSB7XG4gICAgICAgICAgICBnYW1laW5nX25vZGUuYWN0aXZlID0gdHJ1ZVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDlpITnkIbnjqnlrrbmjonnur/pgJrnn6VcbiAgICAgKi9cbiAgICBfb25QbGF5ZXJPZmZsaW5lOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIFxuICAgICAgICAvLyDpgJrnn6XmiYDmnInnjqnlrrboioLngrnmm7TmlrDnirbmgIFcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGVTY3JpcHQgPSBub2RlLmdldENvbXBvbmVudChcInBsYXllcl9ub2RlXCIpXG4gICAgICAgICAgICAgICAgaWYgKG5vZGVTY3JpcHQgJiYgbm9kZVNjcmlwdC5hY2NvdW50aWQgPT09IGRhdGEucGxheWVyX2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInBsYXllcl9zdGF0ZV91cGRhdGVcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGU6IFwib2ZmbGluZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dDogZGF0YS50aW1lb3V0XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDlpITnkIbnjqnlrrbkuIrnur/pgJrnn6VcbiAgICAgKi9cbiAgICBfb25QbGF5ZXJPbmxpbmU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIOmAmuefpeaJgOacieeOqeWutuiKgueCueabtOaWsOeKtuaAgVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGxheWVyTm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZVNjcmlwdCA9IG5vZGUuZ2V0Q29tcG9uZW50KFwicGxheWVyX25vZGVcIilcbiAgICAgICAgICAgICAgICBpZiAobm9kZVNjcmlwdCAmJiBub2RlU2NyaXB0LmFjY291bnRpZCA9PT0gZGF0YS5wbGF5ZXJfaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5lbWl0KFwicGxheWVyX3N0YXRlX3VwZGF0ZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZTogXCJvbmxpbmVcIlxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn0pO1xuIl19