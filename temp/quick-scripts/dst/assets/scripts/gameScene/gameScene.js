
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
    this._isWaitingForPlayers = false; // 监听，给其他玩家发牌(内部事件)
    // 【核心】player_node 直接显示 17 张牌背，不再逐张动画

    this.node.on("pushcard_other_event", function () {
      for (var i = 0; i < this.playerNodeList.length; i++) {
        var node = this.playerNodeList[i];

        if (node) {
          node.emit("push_card_event");
        }
      }
    }.bind(this)); // 监听房间状态改变事件

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
    }.bind(this)); // 🔧【新增】监听叫地主结果（第一轮）

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
    }.bind(this)); // 🔧【新增】监听出牌阶段开始

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
    }.bind(this)); // 【新增】监听游戏状态恢复事件

    this.node.on("game_state_restored", function (data) {
      this._onGameStateRestored(data);
    }.bind(this)); // 【新增】监听玩家掉线通知

    myglobal.socket.onPlayerOffline(function (data) {
      this._onPlayerOffline(data);
    }.bind(this)); // 【新增】监听玩家上线通知

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
    this.playerNodeList.push(playernode_inst); // 🔧【修复】将房间类型传递给 player_node（用于区分普通场和竞技场）

    if (!player_data.room_category) {
      player_data.room_category = this._roomCategory || 1;
      console.log("🏟️ [addPlayerNode] 设置 player_data.room_category =", player_data.room_category);
    } // 🔧【新增】将期号传递给 player_node


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
    var roomid = result.roomid || result.room_code || result.roomCode || "WAITING"; // 🔧【新增】检查是否是竞技场模式

    var isArenaMode = result.room_category === 2;

    if (isArenaMode) {
      console.log("🏟️ [_processRoomData] 竞技场模式: room_category=2, playerdata数量=" + playerdata_list.length + ", 期号=" + result.period_no);
    } // 🔧【修复】保存房间类型到实例变量，供 player_node 使用


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
    } // 🔧【修复】竞技场模式下不显示等待玩家UI（所有玩家已分配好）


    if (isArenaMode) {
      console.log("🏟️ [_processRoomData] 竞技场模式：不显示等待玩家UI"); // 竞技场模式下所有玩家应该已经准备好，直接等待游戏开始
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
    } // 隐藏 gamebeforeUI


    var gamebefore_node = this.node.getChildByName("gamebeforeUI");

    if (gamebefore_node) {
      gamebefore_node.active = false;
    } // 显示 gameingUI


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2dhbWVTY2VuZS9nYW1lU2NlbmUuanMiXSwibmFtZXMiOlsiY2MiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJkaV9sYWJlbCIsIkxhYmVsIiwiYmVpc2h1X2xhYmVsIiwicm9vbWlkX2xhYmVsIiwicGxheWVyX25vZGVfcHJlZmFicyIsIlByZWZhYiIsInBsYXllcnNfc2VhdF9wb3MiLCJOb2RlIiwib25Mb2FkIiwibXlnbG9iYWwiLCJ3aW5kb3ciLCJSb29tU3RhdGUiLCJST09NX0lOVkFMSUQiLCJpc29wZW5fc291bmQiLCJwbGF5ZXJEYXRhIiwic29ja2V0IiwiY29uc29sZSIsImVycm9yIiwiX3dhaXRGb3JJbml0IiwiX2luaXRTY2VuZSIsIl9zdGFydE9ubGluZU1vbml0b3JpbmciLCJ3YXJuIiwic2VsZiIsIl9vbmxpbmVTdGF0dXNIYW5kbGVyIiwiaXNPbmxpbmUiLCJfc2hvd09mZmxpbmVNZXNzYWdlIiwiYWRkT25saW5lU3RhdHVzTGlzdGVuZXIiLCJldmVudGxpc3RlciIsIm9uIiwiZGF0YSIsIl9oYW5kbGVGb3JjZUxvZ291dCIsInJlYXNvbiIsInN0b3BPbmxpbmVNb25pdG9yaW5nIiwic2NoZWR1bGVPbmNlIiwiYWxlcnQiLCJkaXJlY3RvciIsImxvYWRTY2VuZSIsIl9zdG9wT25saW5lTW9uaXRvcmluZyIsInJlbW92ZU9ubGluZVN0YXR1c0xpc3RlbmVyIiwiYXR0ZW1wdHMiLCJtYXhBdHRlbXB0cyIsImNoZWNrSW5pdCIsInNldFRpbWVvdXQiLCJwbGF5ZXJOb2RlTGlzdCIsImJvdHRvbSIsInJhdGUiLCJzdHJpbmciLCJyb29tc3RhdGUiLCJfaXNXYWl0aW5nRm9yUGxheWVycyIsIm5vZGUiLCJpIiwibGVuZ3RoIiwiZW1pdCIsImJpbmQiLCJvblJvb21DaGFuZ2VTdGF0ZSIsIl9oaWRlV2FpdGluZ1VJIiwiZXZlbnQiLCJnYW1ldWlfbm9kZSIsImdldENoaWxkQnlOYW1lIiwiY3VycmVudFJvb21Db2RlIiwiZ2V0Q3VycmVudFJvb21Db2RlIiwiaXNJblJvb20iLCJyb29tRGF0YSIsInJvb21pZCIsInJvb21fY29kZSIsInNlYXRpbmRleCIsInBsYXllcmRhdGEiLCJhY2NvdW50aWQiLCJwbGF5ZXJJZCIsIm5pY2tfbmFtZSIsIm5pY2tOYW1lIiwiYXZhdGFyVXJsIiwiZ29sZF9jb3VudCIsImdvYmFsX2NvdW50IiwiZ29sZGNvdW50IiwiaXNyZWFkeSIsIl9wcm9jZXNzUm9vbURhdGEiLCJyZXF1ZXN0X2VudGVyX3Jvb20iLCJlcnIiLCJyZXN1bHQiLCJvblBsYXllckpvaW5Sb29tIiwiam9pbl9wbGF5ZXJkYXRhIiwiYWRkUGxheWVyTm9kZSIsIl9wbGF5ZXJkYXRhTGlzdCIsInB1c2giLCJfc2hvd1dhaXRpbmdVSSIsIl9jdXJyZW50Um9vbUNvZGUiLCJvblBsYXllclJlYWR5Iiwib25HYW1lU3RhcnQiLCJnYW1lYmVmb3JlVUkiLCJhY3RpdmUiLCJvblJvYlN0YXRlIiwiZXZlbnRXaXRoUm91bmQiLCJPYmplY3QiLCJhc3NpZ24iLCJyb3VuZCIsIm9uQmlkUmVzdWx0Iiwib25DaGFuZ2VNYXN0ZXIiLCJtYXN0ZXJfYWNjb3VudGlkIiwib25QbGF5U3RhcnQiLCJST09NX1BMQVlJTkciLCJvblNob3dCb3R0b21DYXJkIiwib25Sb29tUmVzdG9yZWQiLCJyZXN0b3JlZFJvb21EYXRhIiwicGxheWVyX2lkIiwicGxheWVyX25hbWUiLCJfb25HYW1lU3RhdGVSZXN0b3JlZCIsIm9uUGxheWVyT2ZmbGluZSIsIl9vblBsYXllck9mZmxpbmUiLCJvblBsYXllck9ubGluZSIsIl9vblBsYXllck9ubGluZSIsInNldFBsYXllclNlYXRQb3MiLCJzZWF0X2luZGV4IiwicGxheWVyZGF0YV9saXN0X3BvcyIsInBsYXllcl9kYXRhIiwicGxheWVybm9kZV9pbnN0IiwiaW5zdGFudGlhdGUiLCJwYXJlbnQiLCJyb29tX2NhdGVnb3J5IiwiX3Jvb21DYXRlZ29yeSIsImxvZyIsInBlcmlvZF9ubyIsIl9wZXJpb2RObyIsImluZGV4IiwidW5kZWZpbmVkIiwiY2hpbGRyZW4iLCJwb3NpdGlvbiIsInBsYXllck5vZGVTY3JpcHQiLCJnZXRDb21wb25lbnQiLCJpbml0X2RhdGEiLCJzdGFydCIsIm9uRGVzdHJveSIsImdldFVzZXJPdXRDYXJkUG9zQnlBY2NvdW50Iiwibm9kZV9zY3JpcHQiLCJzZWF0X25vZGUiLCJpbmRleF9uYW1lIiwib3V0X2NhcmRfbm9kZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJzZWF0aWQiLCJwbGF5ZXJkYXRhX2xpc3QiLCJyb29tQ29kZSIsImlzQXJlbmFNb2RlIiwiX2lzQXJlbmFNb2RlIiwiaG91c2VtYW5hZ2VpZCIsImNyZWF0b3JfaWQiLCJjcmVhdG9ySWQiLCJnZXRQbGF5ZXJJbmZvIiwicGxheWVySW5mbyIsImF1ZGlvRW5naW5lIiwic3RvcEFsbCIsInJlc291cmNlcyIsImxvYWQiLCJBdWRpb0NsaXAiLCJjbGlwIiwicGxheSIsImdhbWViZWZvcmVfbm9kZSIsInpJbmRleCIsIm5lZWRQbGF5ZXJzIiwiX25lZWRQbGF5ZXJzIiwiY2FudmFzIiwiQ2FudmFzIiwiZmluZCIsInNjcmVlbkhlaWdodCIsImRlc2lnblJlc29sdXRpb24iLCJoZWlnaHQiLCJzY3JlZW5XaWR0aCIsIndpZHRoIiwid2FpdGluZ05vZGUiLCJzZXRDb250ZW50U2l6ZSIsInNpemUiLCJhbmNob3JYIiwiYW5jaG9yWSIsIngiLCJ5IiwiX3dhaXRpbmdVSU5vZGUiLCJyb29tSW5mb05vZGUiLCJyb29tTGFiZWwiLCJhZGRDb21wb25lbnQiLCJmb250U2l6ZSIsImhvcml6b250YWxBbGlnbiIsIkhvcml6b250YWxBbGlnbiIsIkxFRlQiLCJjb2xvciIsInJvb21PdXRsaW5lIiwiTGFiZWxPdXRsaW5lIiwibGVhdmVCdG5Ob2RlIiwibGVhdmVCdG5CZyIsIkdyYXBoaWNzIiwiZmlsbENvbG9yIiwicm91bmRSZWN0IiwiZmlsbCIsInN0cm9rZUNvbG9yIiwibGluZVdpZHRoIiwic3Ryb2tlIiwibGVhdmVCdG5MYWJlbCIsImxlYXZlTGFiZWwiLCJDRU5URVIiLCJsZWF2ZU91dGxpbmUiLCJFdmVudFR5cGUiLCJUT1VDSF9TVEFSVCIsInNjYWxlIiwiVE9VQ0hfRU5EIiwiX2xlYXZlUm9vbSIsIlRPVUNIX0NBTkNFTCIsIl91cGRhdGVXYWl0aW5nQW5pbWF0aW9uIiwiX3VwZGF0ZVdhaXRpbmdVSSIsImN1cnJlbnRQbGF5ZXJzIiwiZGVzdHJveSIsImxlYXZlUm9vbSIsInBsYXllcnMiLCJub2RlU2NyaXB0IiwiaiIsInAiLCJpZCIsInN0YXRlIiwiY2FyZHNfY291bnQiLCJpc19sYW5kbG9yZCIsImdhbWVpbmdfbm9kZSIsInRpbWVvdXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUFBLEVBQUUsQ0FBQ0MsS0FBSCxDQUFTO0VBQ0wsV0FBU0QsRUFBRSxDQUFDRSxTQURQO0VBR0xDLFVBQVUsRUFBRTtJQUNSQyxRQUFRLEVBQUVKLEVBQUUsQ0FBQ0ssS0FETDtJQUVSQyxZQUFZLEVBQUVOLEVBQUUsQ0FBQ0ssS0FGVDtJQUdSRSxZQUFZLEVBQUVQLEVBQUUsQ0FBQ0ssS0FIVDtJQUlSRyxtQkFBbUIsRUFBRVIsRUFBRSxDQUFDUyxNQUpoQjtJQUtSQyxnQkFBZ0IsRUFBRVYsRUFBRSxDQUFDVztFQUxiLENBSFA7RUFXTEMsTUFYSyxvQkFXSTtJQUVMLElBQUlDLFFBQVEsR0FBR0MsTUFBTSxDQUFDRCxRQUF0QjtJQUNBLElBQUlFLFNBQVMsR0FBR0QsTUFBTSxDQUFDQyxTQUFQLElBQW9CO01BQUVDLFlBQVksRUFBRSxDQUFDO0lBQWpCLENBQXBDO0lBQ0EsSUFBSUMsWUFBWSxHQUFHSCxNQUFNLENBQUNHLFlBQVAsSUFBdUIsQ0FBMUM7O0lBRUEsSUFBSSxDQUFDSixRQUFELElBQWEsQ0FBQ0EsUUFBUSxDQUFDSyxVQUF2QixJQUFxQyxDQUFDTCxRQUFRLENBQUNNLE1BQW5ELEVBQTJEO01BQ3ZEQyxPQUFPLENBQUNDLEtBQVIsQ0FBYyw2Q0FBZDs7TUFDQSxLQUFLQyxZQUFMOztNQUNBO0lBQ0g7O0lBRUQsS0FBS0MsVUFBTCxDQUFnQlYsUUFBaEIsRUFBMEJFLFNBQTFCLEVBQXFDRSxZQUFyQzs7SUFDQSxLQUFLTyxzQkFBTDtFQUNILENBekJJO0VBMkJMO0VBQ0E7RUFDQTtFQUVBQSxzQkFBc0IsRUFBRSxrQ0FBVztJQUMvQixJQUFJWCxRQUFRLEdBQUdDLE1BQU0sQ0FBQ0QsUUFBdEI7O0lBQ0EsSUFBSSxDQUFDQSxRQUFMLEVBQWU7TUFDWE8sT0FBTyxDQUFDSyxJQUFSLENBQWEsa0NBQWI7TUFDQTtJQUNIOztJQUdELElBQUlDLElBQUksR0FBRyxJQUFYOztJQUNBLEtBQUtDLG9CQUFMLEdBQTRCLFVBQVNDLFFBQVQsRUFBbUI7TUFDM0MsSUFBSSxDQUFDQSxRQUFMLEVBQWU7UUFDWEYsSUFBSSxDQUFDRyxtQkFBTDtNQUNIO0lBQ0osQ0FKRDs7SUFNQSxJQUFJaEIsUUFBUSxDQUFDaUIsdUJBQWIsRUFBc0M7TUFDbENqQixRQUFRLENBQUNpQix1QkFBVCxDQUFpQyxLQUFLSCxvQkFBdEM7SUFDSDs7SUFFRCxJQUFJZCxRQUFRLENBQUNrQixXQUFiLEVBQTBCO01BQ3RCbEIsUUFBUSxDQUFDa0IsV0FBVCxDQUFxQkMsRUFBckIsQ0FBd0IsY0FBeEIsRUFBd0MsVUFBU0MsSUFBVCxFQUFlO1FBQ25EYixPQUFPLENBQUNLLElBQVIsQ0FBYSxrQkFBYixFQUFpQ1EsSUFBakM7O1FBQ0FQLElBQUksQ0FBQ1Esa0JBQUwsQ0FBd0JELElBQXhCO01BQ0gsQ0FIRDtJQUlIO0VBQ0osQ0F4REk7RUEwRExKLG1CQUFtQixFQUFFLCtCQUFXO0lBQzVCVCxPQUFPLENBQUNLLElBQVIsQ0FBYSxpQkFBYjtFQUNILENBNURJO0VBOERMUyxrQkFBa0IsRUFBRSw0QkFBU0QsSUFBVCxFQUFlO0lBQy9CLElBQUlFLE1BQU0sR0FBR0YsSUFBSSxDQUFDRSxNQUFMLElBQWUsU0FBNUI7SUFDQWYsT0FBTyxDQUFDSyxJQUFSLENBQWEsY0FBYixFQUE2QlUsTUFBN0I7SUFFQSxJQUFJdEIsUUFBUSxHQUFHQyxNQUFNLENBQUNELFFBQXRCOztJQUNBLElBQUlBLFFBQVEsSUFBSUEsUUFBUSxDQUFDdUIsb0JBQXpCLEVBQStDO01BQzNDdkIsUUFBUSxDQUFDdUIsb0JBQVQ7SUFDSDs7SUFFRCxJQUFJVixJQUFJLEdBQUcsSUFBWDtJQUNBLEtBQUtXLFlBQUwsQ0FBa0IsWUFBVztNQUN6QixJQUFJLE9BQU9DLEtBQVAsS0FBaUIsVUFBckIsRUFBaUM7UUFDN0JBLEtBQUssQ0FBQ0gsTUFBTSxHQUFHLFdBQVYsQ0FBTDtNQUNIOztNQUNEbkMsRUFBRSxDQUFDdUMsUUFBSCxDQUFZQyxTQUFaLENBQXNCLFlBQXRCO0lBQ0gsQ0FMRCxFQUtHLEdBTEg7RUFNSCxDQTlFSTtFQWdGTEMscUJBQXFCLEVBQUUsaUNBQVc7SUFDOUIsSUFBSTVCLFFBQVEsR0FBR0MsTUFBTSxDQUFDRCxRQUF0Qjs7SUFFQSxJQUFJQSxRQUFRLElBQUlBLFFBQVEsQ0FBQzZCLDBCQUFyQixJQUFtRCxLQUFLZixvQkFBNUQsRUFBa0Y7TUFDOUVkLFFBQVEsQ0FBQzZCLDBCQUFULENBQW9DLEtBQUtmLG9CQUF6QztNQUNBLEtBQUtBLG9CQUFMLEdBQTRCLElBQTVCO0lBQ0g7RUFDSixDQXZGSTtFQXlGTEwsWUFBWSxFQUFFLHdCQUFXO0lBQ3JCLElBQUlJLElBQUksR0FBRyxJQUFYO0lBQ0EsSUFBSWlCLFFBQVEsR0FBRyxDQUFmO0lBQ0EsSUFBSUMsV0FBVyxHQUFHLEVBQWxCOztJQUVBLElBQUlDLFNBQVMsR0FBRyxTQUFaQSxTQUFZLEdBQVc7TUFDdkJGLFFBQVE7TUFFUixJQUFJOUIsUUFBUSxHQUFHQyxNQUFNLENBQUNELFFBQXRCOztNQUNBLElBQUlBLFFBQVEsSUFBSUEsUUFBUSxDQUFDSyxVQUFyQixJQUFtQ0wsUUFBUSxDQUFDTSxNQUFoRCxFQUF3RDtRQUNwRCxJQUFJSixTQUFTLEdBQUdELE1BQU0sQ0FBQ0MsU0FBUCxJQUFvQjtVQUFFQyxZQUFZLEVBQUUsQ0FBQztRQUFqQixDQUFwQztRQUNBLElBQUlDLFlBQVksR0FBR0gsTUFBTSxDQUFDRyxZQUFQLElBQXVCLENBQTFDOztRQUNBUyxJQUFJLENBQUNILFVBQUwsQ0FBZ0JWLFFBQWhCLEVBQTBCRSxTQUExQixFQUFxQ0UsWUFBckM7TUFDSCxDQUpELE1BSU8sSUFBSTBCLFFBQVEsR0FBR0MsV0FBZixFQUE0QjtRQUMvQkUsVUFBVSxDQUFDRCxTQUFELEVBQVksR0FBWixDQUFWO01BQ0gsQ0FGTSxNQUVBO1FBQ0h6QixPQUFPLENBQUNDLEtBQVIsQ0FBYyxpQkFBZDtNQUNIO0lBQ0osQ0FiRDs7SUFlQXlCLFVBQVUsQ0FBQ0QsU0FBRCxFQUFZLEdBQVosQ0FBVjtFQUNILENBOUdJO0VBZ0hMdEIsVUFBVSxFQUFFLG9CQUFTVixRQUFULEVBQW1CRSxTQUFuQixFQUE4QkUsWUFBOUIsRUFBNEM7SUFDcEQsS0FBSzhCLGNBQUwsR0FBc0IsRUFBdEI7SUFFQSxJQUFJQyxNQUFNLEdBQUduQyxRQUFRLENBQUNLLFVBQVQsQ0FBb0I4QixNQUFwQixJQUE4QixDQUEzQztJQUNBLElBQUlDLElBQUksR0FBR3BDLFFBQVEsQ0FBQ0ssVUFBVCxDQUFvQitCLElBQXBCLElBQTRCLENBQXZDO0lBRUEsS0FBSzdDLFFBQUwsQ0FBYzhDLE1BQWQsR0FBdUIsT0FBT0YsTUFBOUI7SUFDQSxLQUFLMUMsWUFBTCxDQUFrQjRDLE1BQWxCLEdBQTJCLFFBQVFELElBQW5DO0lBQ0EsS0FBS0UsU0FBTCxHQUFpQnBDLFNBQVMsQ0FBQ0MsWUFBM0I7SUFDQSxLQUFLb0Msb0JBQUwsR0FBNEIsS0FBNUIsQ0FUb0QsQ0FZcEQ7SUFDQTs7SUFDQSxLQUFLQyxJQUFMLENBQVVyQixFQUFWLENBQWEsc0JBQWIsRUFBcUMsWUFBVztNQUM1QyxLQUFLLElBQUlzQixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUtQLGNBQUwsQ0FBb0JRLE1BQXhDLEVBQWdERCxDQUFDLEVBQWpELEVBQXFEO1FBQ2pELElBQUlELElBQUksR0FBRyxLQUFLTixjQUFMLENBQW9CTyxDQUFwQixDQUFYOztRQUNBLElBQUlELElBQUosRUFBVTtVQUNOQSxJQUFJLENBQUNHLElBQUwsQ0FBVSxpQkFBVjtRQUNIO01BQ0o7SUFDSixDQVBvQyxDQU9uQ0MsSUFQbUMsQ0FPOUIsSUFQOEIsQ0FBckMsRUFkb0QsQ0F1QnBEOztJQUNBNUMsUUFBUSxDQUFDTSxNQUFULENBQWdCdUMsaUJBQWhCLENBQWtDLFVBQVN6QixJQUFULEVBQWU7TUFDN0MsS0FBS2tCLFNBQUwsR0FBaUJsQixJQUFqQjs7TUFFQSxJQUFJQSxJQUFJLEtBQUtsQixTQUFTLENBQUNDLFlBQW5CLElBQW1DLEtBQUtvQyxvQkFBNUMsRUFBa0U7UUFDOUQsS0FBS08sY0FBTDtNQUNIO0lBQ0osQ0FOaUMsQ0FNaENGLElBTmdDLENBTTNCLElBTjJCLENBQWxDO0lBUUEsS0FBS0osSUFBTCxDQUFVckIsRUFBVixDQUFhLGNBQWIsRUFBNkIsVUFBUzRCLEtBQVQsRUFBZ0I7TUFDekMsS0FBSyxJQUFJTixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUtQLGNBQUwsQ0FBb0JRLE1BQXhDLEVBQWdERCxDQUFDLEVBQWpELEVBQXFEO1FBQ2pELElBQUlELElBQUksR0FBRyxLQUFLTixjQUFMLENBQW9CTyxDQUFwQixDQUFYOztRQUNBLElBQUlELElBQUosRUFBVTtVQUNOQSxJQUFJLENBQUNHLElBQUwsQ0FBVSx5QkFBVixFQUFxQ0ksS0FBckM7UUFDSDtNQUNKO0lBQ0osQ0FQNEIsQ0FPM0JILElBUDJCLENBT3RCLElBUHNCLENBQTdCO0lBU0EsS0FBS0osSUFBTCxDQUFVckIsRUFBVixDQUFhLG1CQUFiLEVBQWtDLFVBQVM0QixLQUFULEVBQWdCO01BQzlDLElBQUlDLFdBQVcsR0FBRyxLQUFLUixJQUFMLENBQVVTLGNBQVYsQ0FBeUIsV0FBekIsQ0FBbEI7O01BQ0EsSUFBSUQsV0FBVyxJQUFJLElBQW5CLEVBQXlCO1FBQ3JCO01BQ0g7O01BQ0RBLFdBQVcsQ0FBQ0wsSUFBWixDQUFpQixtQkFBakIsRUFBc0NJLEtBQXRDO0lBQ0gsQ0FOaUMsQ0FNaENILElBTmdDLENBTTNCLElBTjJCLENBQWxDO0lBUUEsS0FBS0osSUFBTCxDQUFVckIsRUFBVixDQUFhLHFCQUFiLEVBQW9DLFVBQVM0QixLQUFULEVBQWdCO01BQ2hELElBQUlDLFdBQVcsR0FBRyxLQUFLUixJQUFMLENBQVVTLGNBQVYsQ0FBeUIsV0FBekIsQ0FBbEI7O01BQ0EsSUFBSUQsV0FBVyxJQUFJLElBQW5CLEVBQXlCO1FBQ3JCO01BQ0g7O01BQ0RBLFdBQVcsQ0FBQ0wsSUFBWixDQUFpQixxQkFBakIsRUFBd0NJLEtBQXhDO0lBQ0gsQ0FObUMsQ0FNbENILElBTmtDLENBTTdCLElBTjZCLENBQXBDO0lBUUEsSUFBSU0sZUFBZSxHQUFHbEQsUUFBUSxDQUFDTSxNQUFULENBQWdCNkMsa0JBQWhCLEVBQXRCO0lBQ0EsSUFBSUMsUUFBUSxHQUFHcEQsUUFBUSxDQUFDTSxNQUFULENBQWdCOEMsUUFBaEIsRUFBZjtJQUdBLElBQUlDLFFBQVEsR0FBR3JELFFBQVEsQ0FBQ3FELFFBQXhCOztJQUVBLElBQUlELFFBQVEsSUFBSUYsZUFBWixJQUErQixDQUFDRyxRQUFwQyxFQUE4QztNQUMxQ0EsUUFBUSxHQUFHO1FBQ1BDLE1BQU0sRUFBRUosZUFERDtRQUVQSyxTQUFTLEVBQUVMLGVBRko7UUFHUE0sU0FBUyxFQUFFLENBSEo7UUFJUEMsVUFBVSxFQUFFLENBQUM7VUFDVEMsU0FBUyxFQUFFMUQsUUFBUSxDQUFDSyxVQUFULENBQW9CcUQsU0FBcEIsSUFBaUMxRCxRQUFRLENBQUNLLFVBQVQsQ0FBb0JzRCxRQUR2RDtVQUVUQyxTQUFTLEVBQUU1RCxRQUFRLENBQUNLLFVBQVQsQ0FBb0J3RCxRQUZ0QjtVQUdUQyxTQUFTLEVBQUUsVUFIRjtVQUlUQyxVQUFVLEVBQUUvRCxRQUFRLENBQUNLLFVBQVQsQ0FBb0IyRCxXQUFwQixJQUFtQyxJQUp0QztVQUk0QztVQUNyREMsU0FBUyxFQUFFakUsUUFBUSxDQUFDSyxVQUFULENBQW9CMkQsV0FBcEIsSUFBbUMsSUFMckM7VUFLNEM7VUFDckRSLFNBQVMsRUFBRSxDQU5GO1VBT1RVLE9BQU8sRUFBRTtRQVBBLENBQUQ7TUFKTCxDQUFYO0lBY0g7O0lBRUQsSUFBSWIsUUFBSixFQUFjO01BQ1YsS0FBS2MsZ0JBQUwsQ0FBc0JkLFFBQXRCLEVBQWdDckQsUUFBaEMsRUFBMENJLFlBQTFDO0lBQ0gsQ0FGRCxNQUVPO01BQ0hKLFFBQVEsQ0FBQ00sTUFBVCxDQUFnQjhELGtCQUFoQixDQUFtQyxFQUFuQyxFQUF1QyxVQUFTQyxHQUFULEVBQWNDLE1BQWQsRUFBc0I7UUFDekQsSUFBSUQsR0FBRyxJQUFJLENBQVgsRUFBYyxDQUNiLENBREQsTUFDTztVQUNILEtBQUtGLGdCQUFMLENBQXNCRyxNQUF0QixFQUE4QnRFLFFBQTlCLEVBQXdDSSxZQUF4QztRQUNIO01BQ0osQ0FMc0MsQ0FLckN3QyxJQUxxQyxDQUtoQyxJQUxnQyxDQUF2QztJQU1IOztJQUVENUMsUUFBUSxDQUFDTSxNQUFULENBQWdCaUUsZ0JBQWhCLENBQWlDLFVBQVNDLGVBQVQsRUFBMEI7TUFDdkQsS0FBS0MsYUFBTCxDQUFtQkQsZUFBbkI7O01BRUEsSUFBSSxDQUFDLEtBQUtFLGVBQVYsRUFBMkI7UUFDdkIsS0FBS0EsZUFBTCxHQUF1QixFQUF2QjtNQUNIOztNQUNELEtBQUtBLGVBQUwsQ0FBcUJDLElBQXJCLENBQTBCSCxlQUExQjs7TUFFQSxJQUFJLEtBQUtqQyxvQkFBVCxFQUErQjtRQUMzQixLQUFLcUMsY0FBTCxDQUFvQixJQUFJLEtBQUtGLGVBQUwsQ0FBcUJoQyxNQUE3QyxFQUFxRCxLQUFLbUMsZ0JBQTFEO01BQ0g7O01BRUQsSUFBSSxLQUFLM0MsY0FBTCxDQUFvQlEsTUFBcEIsSUFBOEIsQ0FBbEMsRUFBcUM7UUFDakMsS0FBS0ksY0FBTDtNQUNIO0lBQ0osQ0FmZ0MsQ0FlL0JGLElBZitCLENBZTFCLElBZjBCLENBQWpDO0lBaUJBNUMsUUFBUSxDQUFDTSxNQUFULENBQWdCd0UsYUFBaEIsQ0FBOEIsVUFBUzFELElBQVQsRUFBZTtNQUN6QyxLQUFLLElBQUlxQixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUtQLGNBQUwsQ0FBb0JRLE1BQXhDLEVBQWdERCxDQUFDLEVBQWpELEVBQXFEO1FBQ2pELElBQUlELElBQUksR0FBRyxLQUFLTixjQUFMLENBQW9CTyxDQUFwQixDQUFYOztRQUNBLElBQUlELElBQUosRUFBVTtVQUNOQSxJQUFJLENBQUNHLElBQUwsQ0FBVSxxQkFBVixFQUFpQ3ZCLElBQWpDO1FBQ0g7TUFDSjtJQUNKLENBUDZCLENBTzVCd0IsSUFQNEIsQ0FPdkIsSUFQdUIsQ0FBOUI7SUFTQTVDLFFBQVEsQ0FBQ00sTUFBVCxDQUFnQnlFLFdBQWhCLENBQTRCLFlBQVc7TUFDbkMsS0FBSyxJQUFJdEMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxLQUFLUCxjQUFMLENBQW9CUSxNQUF4QyxFQUFnREQsQ0FBQyxFQUFqRCxFQUFxRDtRQUNqRCxJQUFJRCxJQUFJLEdBQUcsS0FBS04sY0FBTCxDQUFvQk8sQ0FBcEIsQ0FBWDs7UUFDQSxJQUFJRCxJQUFKLEVBQVU7VUFDTkEsSUFBSSxDQUFDRyxJQUFMLENBQVUsaUJBQVY7UUFDSDtNQUNKOztNQUVELElBQUlxQyxZQUFZLEdBQUcsS0FBS3hDLElBQUwsQ0FBVVMsY0FBVixDQUF5QixjQUF6QixDQUFuQjs7TUFDQSxJQUFJK0IsWUFBSixFQUFrQjtRQUNkQSxZQUFZLENBQUNDLE1BQWIsR0FBc0IsS0FBdEI7TUFDSDtJQUNKLENBWjJCLENBWTFCckMsSUFaMEIsQ0FZckIsSUFacUIsQ0FBNUI7SUFjQTVDLFFBQVEsQ0FBQ00sTUFBVCxDQUFnQjRFLFVBQWhCLENBQTJCLFVBQVNuQyxLQUFULEVBQWdCO01BQ3ZDO01BQ0EsSUFBSW9DLGNBQWMsR0FBR0MsTUFBTSxDQUFDQyxNQUFQLENBQWMsRUFBZCxFQUFrQnRDLEtBQWxCLEVBQXlCO1FBQUV1QyxLQUFLLEVBQUU7TUFBVCxDQUF6QixDQUFyQjs7TUFDQSxLQUFLLElBQUk3QyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUtQLGNBQUwsQ0FBb0JRLE1BQXhDLEVBQWdERCxDQUFDLEVBQWpELEVBQXFEO1FBQ2pELElBQUlELElBQUksR0FBRyxLQUFLTixjQUFMLENBQW9CTyxDQUFwQixDQUFYOztRQUNBLElBQUlELElBQUosRUFBVTtVQUNOQSxJQUFJLENBQUNHLElBQUwsQ0FBVSw0QkFBVixFQUF3Q3dDLGNBQXhDO1FBQ0g7TUFDSjtJQUNKLENBVDBCLENBU3pCdkMsSUFUeUIsQ0FTcEIsSUFUb0IsQ0FBM0IsRUFuSW9ELENBOElwRDs7SUFDQTVDLFFBQVEsQ0FBQ00sTUFBVCxDQUFnQmlGLFdBQWhCLENBQTRCLFVBQVN4QyxLQUFULEVBQWdCO01BQ3hDO01BQ0EsSUFBSW9DLGNBQWMsR0FBR0MsTUFBTSxDQUFDQyxNQUFQLENBQWMsRUFBZCxFQUFrQnRDLEtBQWxCLEVBQXlCO1FBQUV1QyxLQUFLLEVBQUU7TUFBVCxDQUF6QixDQUFyQjs7TUFDQSxLQUFLLElBQUk3QyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUtQLGNBQUwsQ0FBb0JRLE1BQXhDLEVBQWdERCxDQUFDLEVBQWpELEVBQXFEO1FBQ2pELElBQUlELElBQUksR0FBRyxLQUFLTixjQUFMLENBQW9CTyxDQUFwQixDQUFYOztRQUNBLElBQUlELElBQUosRUFBVTtVQUNOQSxJQUFJLENBQUNHLElBQUwsQ0FBVSw0QkFBVixFQUF3Q3dDLGNBQXhDO1FBQ0g7TUFDSjtJQUNKLENBVDJCLENBUzFCdkMsSUFUMEIsQ0FTckIsSUFUcUIsQ0FBNUI7SUFXQTVDLFFBQVEsQ0FBQ00sTUFBVCxDQUFnQmtGLGNBQWhCLENBQStCLFVBQVN6QyxLQUFULEVBQWdCO01BQzNDL0MsUUFBUSxDQUFDSyxVQUFULENBQW9Cb0YsZ0JBQXBCLEdBQXVDMUMsS0FBdkM7O01BQ0EsS0FBSyxJQUFJTixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUtQLGNBQUwsQ0FBb0JRLE1BQXhDLEVBQWdERCxDQUFDLEVBQWpELEVBQXFEO1FBQ2pELElBQUlELElBQUksR0FBRyxLQUFLTixjQUFMLENBQW9CTyxDQUFwQixDQUFYOztRQUNBLElBQUlELElBQUosRUFBVTtVQUNOQSxJQUFJLENBQUNHLElBQUwsQ0FBVSwrQkFBVixFQUEyQ0ksS0FBM0M7UUFDSDtNQUNKO0lBQ0osQ0FSOEIsQ0FRN0JILElBUjZCLENBUXhCLElBUndCLENBQS9CLEVBMUpvRCxDQW9LcEQ7O0lBQ0E1QyxRQUFRLENBQUNNLE1BQVQsQ0FBZ0JvRixXQUFoQixDQUE0QixVQUFTdEUsSUFBVCxFQUFlO01BQ3ZDO01BQ0EsS0FBS2tCLFNBQUwsR0FBaUJwQyxTQUFTLENBQUN5RixZQUEzQjtJQUNILENBSDJCLENBRzFCL0MsSUFIMEIsQ0FHckIsSUFIcUIsQ0FBNUI7SUFLQSxLQUFLSixJQUFMLENBQVVyQixFQUFWLENBQWEseUJBQWIsRUFBd0MsVUFBU0MsSUFBVCxFQUFlO01BQ25ELEtBQUssSUFBSXFCLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUcsS0FBS1AsY0FBTCxDQUFvQlEsTUFBeEMsRUFBZ0RELENBQUMsRUFBakQsRUFBcUQ7UUFDakQsSUFBSUQsSUFBSSxHQUFHLEtBQUtOLGNBQUwsQ0FBb0JPLENBQXBCLENBQVg7O1FBQ0EsSUFBSUQsSUFBSixFQUFVO1VBQ05BLElBQUksQ0FBQ0csSUFBTCxDQUFVLHlCQUFWLEVBQXFDdkIsSUFBckM7UUFDSDtNQUNKO0lBQ0osQ0FQdUMsQ0FPdEN3QixJQVBzQyxDQU9qQyxJQVBpQyxDQUF4QztJQVNBNUMsUUFBUSxDQUFDTSxNQUFULENBQWdCc0YsZ0JBQWhCLENBQWlDLFVBQVM3QyxLQUFULEVBQWdCO01BQzdDLElBQUlDLFdBQVcsR0FBRyxLQUFLUixJQUFMLENBQVVTLGNBQVYsQ0FBeUIsV0FBekIsQ0FBbEI7O01BQ0EsSUFBSUQsV0FBVyxJQUFJLElBQW5CLEVBQXlCO1FBQ3JCO01BQ0g7O01BQ0RBLFdBQVcsQ0FBQ0wsSUFBWixDQUFpQix3QkFBakIsRUFBMkNJLEtBQTNDO0lBQ0gsQ0FOZ0MsQ0FNL0JILElBTitCLENBTTFCLElBTjBCLENBQWpDO0lBUUE1QyxRQUFRLENBQUNNLE1BQVQsQ0FBZ0J1RixjQUFoQixDQUErQixVQUFTekUsSUFBVCxFQUFlO01BQzFDLElBQUlBLElBQUksQ0FBQ21DLFNBQVQsRUFBb0I7UUFDaEIsSUFBSXVDLGdCQUFnQixHQUFHO1VBQ25CeEMsTUFBTSxFQUFFbEMsSUFBSSxDQUFDbUMsU0FETTtVQUVuQkEsU0FBUyxFQUFFbkMsSUFBSSxDQUFDbUMsU0FGRztVQUduQkMsU0FBUyxFQUFFLENBSFE7VUFJbkJDLFVBQVUsRUFBRSxDQUFDO1lBQ1RDLFNBQVMsRUFBRXRDLElBQUksQ0FBQzJFLFNBRFA7WUFFVG5DLFNBQVMsRUFBRXhDLElBQUksQ0FBQzRFLFdBRlA7WUFHVGxDLFNBQVMsRUFBRSxVQUhGO1lBSVRDLFVBQVUsRUFBRTNDLElBQUksQ0FBQzJDLFVBQUwsSUFBbUIsSUFKdEI7WUFJNEI7WUFDckNFLFNBQVMsRUFBRTdDLElBQUksQ0FBQzJDLFVBQUwsSUFBbUIsSUFMckI7WUFLNEI7WUFDckNQLFNBQVMsRUFBRTtVQU5GLENBQUQ7UUFKTyxDQUF2Qjs7UUFhQSxLQUFLVyxnQkFBTCxDQUFzQjJCLGdCQUF0QixFQUF3QzlGLFFBQXhDLEVBQWtESSxZQUFsRDtNQUNIO0lBQ0osQ0FqQjhCLENBaUI3QndDLElBakI2QixDQWlCeEIsSUFqQndCLENBQS9CLEVBM0xvRCxDQThNcEQ7O0lBQ0EsS0FBS0osSUFBTCxDQUFVckIsRUFBVixDQUFhLHFCQUFiLEVBQW9DLFVBQVNDLElBQVQsRUFBZTtNQUMvQyxLQUFLNkUsb0JBQUwsQ0FBMEI3RSxJQUExQjtJQUNILENBRm1DLENBRWxDd0IsSUFGa0MsQ0FFN0IsSUFGNkIsQ0FBcEMsRUEvTW9ELENBbU5wRDs7SUFDQTVDLFFBQVEsQ0FBQ00sTUFBVCxDQUFnQjRGLGVBQWhCLENBQWdDLFVBQVM5RSxJQUFULEVBQWU7TUFDM0MsS0FBSytFLGdCQUFMLENBQXNCL0UsSUFBdEI7SUFDSCxDQUYrQixDQUU5QndCLElBRjhCLENBRXpCLElBRnlCLENBQWhDLEVBcE5vRCxDQXdOcEQ7O0lBQ0E1QyxRQUFRLENBQUNNLE1BQVQsQ0FBZ0I4RixjQUFoQixDQUErQixVQUFTaEYsSUFBVCxFQUFlO01BQzFDLEtBQUtpRixlQUFMLENBQXFCakYsSUFBckI7SUFDSCxDQUY4QixDQUU3QndCLElBRjZCLENBRXhCLElBRndCLENBQS9CO0VBSUgsQ0E3VUk7RUErVUwwRCxnQkEvVUssNEJBK1VZQyxVQS9VWixFQStVd0I7SUFDekIsSUFBSUEsVUFBVSxHQUFHLENBQWIsSUFBa0JBLFVBQVUsR0FBRyxDQUFuQyxFQUFzQztNQUNsQztJQUNIOztJQUdELFFBQVFBLFVBQVI7TUFDSSxLQUFLLENBQUw7UUFDSSxLQUFLQyxtQkFBTCxDQUF5QixDQUF6QixJQUE4QixDQUE5QjtRQUNBLEtBQUtBLG1CQUFMLENBQXlCLENBQXpCLElBQThCLENBQTlCO1FBQ0EsS0FBS0EsbUJBQUwsQ0FBeUIsQ0FBekIsSUFBOEIsQ0FBOUI7UUFDQTs7TUFDSixLQUFLLENBQUw7UUFDSSxLQUFLQSxtQkFBTCxDQUF5QixDQUF6QixJQUE4QixDQUE5QjtRQUNBLEtBQUtBLG1CQUFMLENBQXlCLENBQXpCLElBQThCLENBQTlCO1FBQ0EsS0FBS0EsbUJBQUwsQ0FBeUIsQ0FBekIsSUFBOEIsQ0FBOUI7UUFDQTs7TUFDSixLQUFLLENBQUw7UUFDSSxLQUFLQSxtQkFBTCxDQUF5QixDQUF6QixJQUE4QixDQUE5QjtRQUNBLEtBQUtBLG1CQUFMLENBQXlCLENBQXpCLElBQThCLENBQTlCO1FBQ0EsS0FBS0EsbUJBQUwsQ0FBeUIsQ0FBekIsSUFBOEIsQ0FBOUI7UUFDQTs7TUFDSjtRQUNJO0lBakJSO0VBbUJILENBeFdJO0VBMFdML0IsYUExV0sseUJBMFdTZ0MsV0ExV1QsRUEwV3NCO0lBRXZCLElBQUksQ0FBQyxLQUFLOUcsbUJBQVYsRUFBK0I7TUFDM0JZLE9BQU8sQ0FBQ0MsS0FBUixDQUFjLDBCQUFkO01BQ0E7SUFDSDs7SUFFRCxJQUFJLENBQUMsS0FBS1gsZ0JBQVYsRUFBNEI7TUFDeEJVLE9BQU8sQ0FBQ0MsS0FBUixDQUFjLHVCQUFkO01BQ0E7SUFDSDs7SUFFRCxJQUFJa0csZUFBZSxHQUFHdkgsRUFBRSxDQUFDd0gsV0FBSCxDQUFlLEtBQUtoSCxtQkFBcEIsQ0FBdEI7O0lBQ0EsSUFBSSxDQUFDK0csZUFBTCxFQUFzQjtNQUNsQm5HLE9BQU8sQ0FBQ0MsS0FBUixDQUFjLDJCQUFkO01BQ0E7SUFDSDs7SUFFRGtHLGVBQWUsQ0FBQ0UsTUFBaEIsR0FBeUIsS0FBS3BFLElBQTlCO0lBQ0EsS0FBS04sY0FBTCxDQUFvQnlDLElBQXBCLENBQXlCK0IsZUFBekIsRUFuQnVCLENBcUJ2Qjs7SUFDQSxJQUFJLENBQUNELFdBQVcsQ0FBQ0ksYUFBakIsRUFBZ0M7TUFDNUJKLFdBQVcsQ0FBQ0ksYUFBWixHQUE0QixLQUFLQyxhQUFMLElBQXNCLENBQWxEO01BQ0F2RyxPQUFPLENBQUN3RyxHQUFSLENBQVksb0RBQVosRUFBa0VOLFdBQVcsQ0FBQ0ksYUFBOUU7SUFDSCxDQXpCc0IsQ0EyQnZCOzs7SUFDQSxJQUFJLENBQUNKLFdBQVcsQ0FBQ08sU0FBYixJQUEwQixLQUFLQyxTQUFuQyxFQUE4QztNQUMxQ1IsV0FBVyxDQUFDTyxTQUFaLEdBQXdCLEtBQUtDLFNBQTdCO0lBQ0g7O0lBRUQsSUFBSUMsS0FBSyxHQUFHLEtBQUtWLG1CQUFMLENBQXlCQyxXQUFXLENBQUNqRCxTQUFyQyxDQUFaOztJQUVBLElBQUkwRCxLQUFLLEtBQUtDLFNBQVYsSUFBdUJELEtBQUssS0FBSyxJQUFyQyxFQUEyQztNQUN2QzNHLE9BQU8sQ0FBQ0MsS0FBUixDQUFjLFVBQWQsRUFBMEJpRyxXQUFXLENBQUNqRCxTQUF0QztNQUNBO0lBQ0g7O0lBRUQsSUFBSSxDQUFDLEtBQUszRCxnQkFBTCxDQUFzQnVILFFBQXZCLElBQW1DLENBQUMsS0FBS3ZILGdCQUFMLENBQXNCdUgsUUFBdEIsQ0FBK0JGLEtBQS9CLENBQXhDLEVBQStFO01BQzNFM0csT0FBTyxDQUFDQyxLQUFSLENBQWMsZ0JBQWQsRUFBZ0MwRyxLQUFoQztNQUNBO0lBQ0g7O0lBRURSLGVBQWUsQ0FBQ1csUUFBaEIsR0FBMkIsS0FBS3hILGdCQUFMLENBQXNCdUgsUUFBdEIsQ0FBK0JGLEtBQS9CLEVBQXNDRyxRQUFqRTtJQUVBLElBQUlDLGdCQUFnQixHQUFHWixlQUFlLENBQUNhLFlBQWhCLENBQTZCLGFBQTdCLENBQXZCOztJQUNBLElBQUksQ0FBQ0QsZ0JBQUwsRUFBdUI7TUFDbkIvRyxPQUFPLENBQUNDLEtBQVIsQ0FBYyxxQkFBZDtNQUNBO0lBQ0g7O0lBRUQ4RyxnQkFBZ0IsQ0FBQ0UsU0FBakIsQ0FBMkJmLFdBQTNCLEVBQXdDUyxLQUF4QztFQUNILENBL1pJO0VBaWFMTyxLQWphSyxtQkFpYUcsQ0FDUCxDQWxhSTtFQW9hTEMsU0FBUyxFQUFFLHFCQUFXO0lBQ2xCLEtBQUs5RixxQkFBTDtFQUNILENBdGFJO0VBd2FMK0YsMEJBeGFLLHNDQXdhc0JqRSxTQXhhdEIsRUF3YWlDO0lBRWxDLElBQUksQ0FBQyxLQUFLeEIsY0FBTixJQUF3QixDQUFDLEtBQUtyQyxnQkFBbEMsRUFBb0Q7TUFDaERVLE9BQU8sQ0FBQ0MsS0FBUixDQUFjLHdDQUFkO01BQ0EsT0FBTyxJQUFQO0lBQ0g7O0lBRUQsS0FBSyxJQUFJaUMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxLQUFLUCxjQUFMLENBQW9CUSxNQUF4QyxFQUFnREQsQ0FBQyxFQUFqRCxFQUFxRDtNQUNqRCxJQUFJRCxJQUFJLEdBQUcsS0FBS04sY0FBTCxDQUFvQk8sQ0FBcEIsQ0FBWDs7TUFDQSxJQUFJRCxJQUFKLEVBQVU7UUFDTixJQUFJb0YsV0FBVyxHQUFHcEYsSUFBSSxDQUFDK0UsWUFBTCxDQUFrQixhQUFsQixDQUFsQjs7UUFDQSxJQUFJSyxXQUFXLElBQUlBLFdBQVcsQ0FBQ2xFLFNBQVosS0FBMEJBLFNBQTdDLEVBQXdEO1VBQ3BELElBQUlrRSxXQUFXLENBQUNyQixVQUFaLEtBQTJCWSxTQUEzQixJQUF3Q1MsV0FBVyxDQUFDckIsVUFBWixLQUEyQixJQUF2RSxFQUE2RTtZQUN6RWhHLE9BQU8sQ0FBQ0MsS0FBUixDQUFjLGdCQUFkO1lBQ0EsT0FBTyxJQUFQO1VBQ0g7O1VBRUQsSUFBSSxDQUFDLEtBQUtYLGdCQUFMLENBQXNCdUgsUUFBdkIsSUFBbUMsQ0FBQyxLQUFLdkgsZ0JBQUwsQ0FBc0J1SCxRQUF0QixDQUErQlEsV0FBVyxDQUFDckIsVUFBM0MsQ0FBeEMsRUFBZ0c7WUFDNUZoRyxPQUFPLENBQUNDLEtBQVIsQ0FBYyxxQkFBZCxFQUFxQ29ILFdBQVcsQ0FBQ3JCLFVBQWpEO1lBQ0EsT0FBTyxJQUFQO1VBQ0g7O1VBRUQsSUFBSXNCLFNBQVMsR0FBRyxLQUFLaEksZ0JBQUwsQ0FBc0J1SCxRQUF0QixDQUErQlEsV0FBVyxDQUFDckIsVUFBM0MsQ0FBaEI7VUFDQSxJQUFJdUIsVUFBVSxHQUFHLGlCQUFpQkYsV0FBVyxDQUFDckIsVUFBOUM7VUFDQSxJQUFJd0IsYUFBYSxHQUFHRixTQUFTLENBQUM1RSxjQUFWLENBQXlCNkUsVUFBekIsQ0FBcEI7VUFDQSxPQUFPQyxhQUFQO1FBQ0g7TUFDSjtJQUNKOztJQUVELE9BQU8sSUFBUDtFQUNILENBdmNJO0VBeWNMNUQsZ0JBQWdCLEVBQUUsMEJBQVNHLE1BQVQsRUFBaUJ0RSxRQUFqQixFQUEyQkksWUFBM0IsRUFBeUM7SUFFdkRHLE9BQU8sQ0FBQ3dHLEdBQVIsQ0FBWSwrQkFBWixFQUE2Q2lCLElBQUksQ0FBQ0MsU0FBTCxDQUFlM0QsTUFBZixDQUE3QztJQUVBLElBQUk0RCxNQUFNLEdBQUc1RCxNQUFNLENBQUNkLFNBQVAsSUFBb0IsQ0FBakM7SUFFQSxLQUFLZ0QsbUJBQUwsR0FBMkIsRUFBM0I7SUFDQSxLQUFLRixnQkFBTCxDQUFzQjRCLE1BQXRCO0lBRUEsSUFBSUMsZUFBZSxHQUFHN0QsTUFBTSxDQUFDYixVQUFQLElBQXFCLEVBQTNDO0lBQ0EsSUFBSUgsTUFBTSxHQUFHZ0IsTUFBTSxDQUFDaEIsTUFBUCxJQUFpQmdCLE1BQU0sQ0FBQ2YsU0FBeEIsSUFBcUNlLE1BQU0sQ0FBQzhELFFBQTVDLElBQXdELFNBQXJFLENBVnVELENBWXZEOztJQUNBLElBQUlDLFdBQVcsR0FBRy9ELE1BQU0sQ0FBQ3VDLGFBQVAsS0FBeUIsQ0FBM0M7O0lBQ0EsSUFBSXdCLFdBQUosRUFBaUI7TUFDYjlILE9BQU8sQ0FBQ3dHLEdBQVIsQ0FBWSxpRUFBaUVvQixlQUFlLENBQUN6RixNQUFqRixHQUEwRixPQUExRixHQUFvRzRCLE1BQU0sQ0FBQzBDLFNBQXZIO0lBQ0gsQ0FoQnNELENBa0J2RDs7O0lBQ0EsS0FBS0YsYUFBTCxHQUFxQnhDLE1BQU0sQ0FBQ3VDLGFBQVAsSUFBd0IsQ0FBN0M7SUFDQSxLQUFLeUIsWUFBTCxHQUFvQkQsV0FBcEI7SUFDQSxLQUFLcEIsU0FBTCxHQUFpQjNDLE1BQU0sQ0FBQzBDLFNBQVAsSUFBb0IsRUFBckMsQ0FyQnVELENBcUJmOztJQUV4QyxLQUFLdEMsZUFBTCxHQUF1QnlELGVBQXZCOztJQUdBLElBQUksS0FBS3pJLFlBQVQsRUFBdUI7TUFDbkIsS0FBS0EsWUFBTCxDQUFrQjJDLE1BQWxCLEdBQTJCLFNBQVNpQixNQUFwQztJQUNILENBRkQsTUFFTztNQUNIL0MsT0FBTyxDQUFDQyxLQUFSLENBQWMsNkJBQWQ7SUFDSDs7SUFFRFIsUUFBUSxDQUFDSyxVQUFULENBQW9Ca0ksYUFBcEIsR0FBb0NqRSxNQUFNLENBQUNpRSxhQUFQLElBQXdCakUsTUFBTSxDQUFDa0UsVUFBL0IsSUFBNkNsRSxNQUFNLENBQUNtRSxTQUFwRCxJQUFpRSxFQUFyRzs7SUFFQSxJQUFJekksUUFBUSxDQUFDTSxNQUFULElBQW1CTixRQUFRLENBQUNNLE1BQVQsQ0FBZ0JvSSxhQUF2QyxFQUFzRDtNQUNsRCxJQUFJQyxVQUFVLEdBQUczSSxRQUFRLENBQUNNLE1BQVQsQ0FBZ0JvSSxhQUFoQixFQUFqQjtJQUNIOztJQUVELEtBQUssSUFBSWpHLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUcwRixlQUFlLENBQUN6RixNQUFwQyxFQUE0Q0QsQ0FBQyxFQUE3QyxFQUFpRDtNQUM3Q2xDLE9BQU8sQ0FBQ3dHLEdBQVIsQ0FBWSxtQ0FBbUNpQixJQUFJLENBQUNDLFNBQUwsQ0FBZUUsZUFBZSxDQUFDMUYsQ0FBRCxDQUE5QixDQUEvQztNQUNBLEtBQUtnQyxhQUFMLENBQW1CMEQsZUFBZSxDQUFDMUYsQ0FBRCxDQUFsQztJQUNIOztJQUdELElBQUlyQyxZQUFKLEVBQWtCO01BQ2RqQixFQUFFLENBQUN5SixXQUFILENBQWVDLE9BQWY7TUFDQTFKLEVBQUUsQ0FBQzJKLFNBQUgsQ0FBYUMsSUFBYixDQUFrQixVQUFsQixFQUE4QjVKLEVBQUUsQ0FBQzZKLFNBQWpDLEVBQTRDLFVBQVMzRSxHQUFULEVBQWM0RSxJQUFkLEVBQW9CO1FBQzVELElBQUk1RSxHQUFKLEVBQVM7VUFDTDtRQUNIOztRQUNEbEYsRUFBRSxDQUFDeUosV0FBSCxDQUFlTSxJQUFmLENBQW9CRCxJQUFwQixFQUEwQixJQUExQixFQUFnQyxDQUFoQztNQUNILENBTEQ7SUFNSDs7SUFFRCxJQUFJRSxlQUFlLEdBQUcsS0FBSzNHLElBQUwsQ0FBVVMsY0FBVixDQUF5QixjQUF6QixDQUF0Qjs7SUFDQSxJQUFJa0csZUFBSixFQUFxQjtNQUNqQkEsZUFBZSxDQUFDbEUsTUFBaEIsR0FBeUIsSUFBekI7TUFDQWtFLGVBQWUsQ0FBQ0MsTUFBaEIsR0FBeUIsSUFBekI7TUFDQUQsZUFBZSxDQUFDeEcsSUFBaEIsQ0FBcUIsTUFBckI7SUFDSCxDQTNEc0QsQ0E2RHZEOzs7SUFDQSxJQUFJMEYsV0FBSixFQUFpQjtNQUNiOUgsT0FBTyxDQUFDd0csR0FBUixDQUFZLHdDQUFaLEVBRGEsQ0FFYjtJQUNILENBSEQsTUFHTyxJQUFJb0IsZUFBZSxDQUFDekYsTUFBaEIsR0FBeUIsQ0FBN0IsRUFBZ0M7TUFDbkMsS0FBS2tDLGNBQUwsQ0FBb0IsSUFBSXVELGVBQWUsQ0FBQ3pGLE1BQXhDLEVBQWdEWSxNQUFoRDtJQUNIO0VBQ0osQ0E3Z0JJO0VBK2dCTHNCLGNBQWMsRUFBRSx3QkFBU3lFLFdBQVQsRUFBc0JqQixRQUF0QixFQUFnQztJQUM1QyxJQUFJdkgsSUFBSSxHQUFHLElBQVg7SUFDQSxLQUFLMEIsb0JBQUwsR0FBNEIsSUFBNUI7SUFDQSxLQUFLK0csWUFBTCxHQUFvQkQsV0FBcEI7SUFDQSxLQUFLeEUsZ0JBQUwsR0FBd0J1RCxRQUFRLElBQUksRUFBcEM7O0lBR0EsS0FBS3RGLGNBQUw7O0lBRUEsSUFBSXlHLE1BQU0sR0FBRyxLQUFLL0csSUFBTCxDQUFVK0UsWUFBVixDQUF1QnBJLEVBQUUsQ0FBQ3FLLE1BQTFCLEtBQXFDckssRUFBRSxDQUFDc0ssSUFBSCxDQUFRLFFBQVIsRUFBa0JsQyxZQUFsQixDQUErQnBJLEVBQUUsQ0FBQ3FLLE1BQWxDLENBQWxEO0lBQ0EsSUFBSUUsWUFBWSxHQUFHSCxNQUFNLEdBQUdBLE1BQU0sQ0FBQ0ksZ0JBQVAsQ0FBd0JDLE1BQTNCLEdBQW9DLEdBQTdEO0lBQ0EsSUFBSUMsV0FBVyxHQUFHTixNQUFNLEdBQUdBLE1BQU0sQ0FBQ0ksZ0JBQVAsQ0FBd0JHLEtBQTNCLEdBQW1DLElBQTNEO0lBRUEsSUFBSUMsV0FBVyxHQUFHLElBQUk1SyxFQUFFLENBQUNXLElBQVAsQ0FBWSxxQkFBWixDQUFsQjtJQUNBaUssV0FBVyxDQUFDQyxjQUFaLENBQTJCN0ssRUFBRSxDQUFDOEssSUFBSCxDQUFRSixXQUFSLEVBQXFCSCxZQUFyQixDQUEzQjtJQUNBSyxXQUFXLENBQUNHLE9BQVosR0FBc0IsR0FBdEI7SUFDQUgsV0FBVyxDQUFDSSxPQUFaLEdBQXNCLEdBQXRCO0lBQ0FKLFdBQVcsQ0FBQ0ssQ0FBWixHQUFnQixDQUFoQjtJQUNBTCxXQUFXLENBQUNNLENBQVosR0FBZ0IsQ0FBaEI7SUFDQU4sV0FBVyxDQUFDbkQsTUFBWixHQUFxQixLQUFLcEUsSUFBMUI7SUFDQSxLQUFLOEgsY0FBTCxHQUFzQlAsV0FBdEI7O0lBRUEsSUFBSTNCLFFBQUosRUFBYztNQUNWLElBQUltQyxZQUFZLEdBQUcsSUFBSXBMLEVBQUUsQ0FBQ1csSUFBUCxDQUFZLFVBQVosQ0FBbkI7TUFDQXlLLFlBQVksQ0FBQ0gsQ0FBYixHQUFpQixDQUFDUCxXQUFELEdBQWEsQ0FBYixHQUFpQixFQUFsQztNQUNBVSxZQUFZLENBQUNGLENBQWIsR0FBaUJYLFlBQVksR0FBQyxDQUFiLEdBQWlCLEVBQWxDO01BQ0FhLFlBQVksQ0FBQ0wsT0FBYixHQUF1QixDQUF2QjtNQUNBSyxZQUFZLENBQUNKLE9BQWIsR0FBdUIsR0FBdkI7TUFFQSxJQUFJSyxTQUFTLEdBQUdELFlBQVksQ0FBQ0UsWUFBYixDQUEwQnRMLEVBQUUsQ0FBQ0ssS0FBN0IsQ0FBaEI7TUFDQWdMLFNBQVMsQ0FBQ25JLE1BQVYsR0FBbUIsVUFBVStGLFFBQTdCO01BQ0FvQyxTQUFTLENBQUNFLFFBQVYsR0FBcUIsRUFBckI7TUFDQUYsU0FBUyxDQUFDRyxlQUFWLEdBQTRCeEwsRUFBRSxDQUFDSyxLQUFILENBQVNvTCxlQUFULENBQXlCQyxJQUFyRDtNQUNBTixZQUFZLENBQUNPLEtBQWIsR0FBcUIzTCxFQUFFLENBQUMyTCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsQ0FBbkIsQ0FBckI7TUFFQSxJQUFJQyxXQUFXLEdBQUdSLFlBQVksQ0FBQ0UsWUFBYixDQUEwQnRMLEVBQUUsQ0FBQzZMLFlBQTdCLENBQWxCO01BQ0FELFdBQVcsQ0FBQ0QsS0FBWixHQUFvQjNMLEVBQUUsQ0FBQzJMLEtBQUgsQ0FBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsQ0FBcEI7TUFDQUMsV0FBVyxDQUFDakIsS0FBWixHQUFvQixDQUFwQjtNQUNBUyxZQUFZLENBQUMzRCxNQUFiLEdBQXNCbUQsV0FBdEI7SUFDSDs7SUFFRCxJQUFJa0IsWUFBWSxHQUFHLElBQUk5TCxFQUFFLENBQUNXLElBQVAsQ0FBWSxVQUFaLENBQW5CO0lBQ0FtTCxZQUFZLENBQUNiLENBQWIsR0FBaUJQLFdBQVcsR0FBQyxDQUFaLEdBQWdCLEdBQWpDO0lBQ0FvQixZQUFZLENBQUNaLENBQWIsR0FBaUIsQ0FBQ1gsWUFBRCxHQUFjLENBQWQsR0FBa0IsRUFBbkM7SUFDQXVCLFlBQVksQ0FBQ2YsT0FBYixHQUF1QixHQUF2QjtJQUNBZSxZQUFZLENBQUNkLE9BQWIsR0FBdUIsR0FBdkI7SUFDQWMsWUFBWSxDQUFDakIsY0FBYixDQUE0QjdLLEVBQUUsQ0FBQzhLLElBQUgsQ0FBUSxHQUFSLEVBQWEsRUFBYixDQUE1QjtJQUVBLElBQUlpQixVQUFVLEdBQUdELFlBQVksQ0FBQ1IsWUFBYixDQUEwQnRMLEVBQUUsQ0FBQ2dNLFFBQTdCLENBQWpCO0lBQ0FELFVBQVUsQ0FBQ0UsU0FBWCxHQUF1QmpNLEVBQUUsQ0FBQzJMLEtBQUgsQ0FBUyxHQUFULEVBQWMsRUFBZCxFQUFrQixFQUFsQixFQUFzQixHQUF0QixDQUF2QjtJQUNBSSxVQUFVLENBQUNHLFNBQVgsQ0FBcUIsQ0FBQyxFQUF0QixFQUEwQixDQUFDLEVBQTNCLEVBQStCLEdBQS9CLEVBQW9DLEVBQXBDLEVBQXdDLENBQXhDO0lBQ0FILFVBQVUsQ0FBQ0ksSUFBWDtJQUNBSixVQUFVLENBQUNLLFdBQVgsR0FBeUJwTSxFQUFFLENBQUMyTCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBekI7SUFDQUksVUFBVSxDQUFDTSxTQUFYLEdBQXVCLENBQXZCO0lBQ0FOLFVBQVUsQ0FBQ0csU0FBWCxDQUFxQixDQUFDLEVBQXRCLEVBQTBCLENBQUMsRUFBM0IsRUFBK0IsR0FBL0IsRUFBb0MsRUFBcEMsRUFBd0MsQ0FBeEM7SUFDQUgsVUFBVSxDQUFDTyxNQUFYO0lBQ0FSLFlBQVksQ0FBQ3JFLE1BQWIsR0FBc0JtRCxXQUF0QjtJQUVBLElBQUkyQixhQUFhLEdBQUcsSUFBSXZNLEVBQUUsQ0FBQ1csSUFBUCxDQUFZLE9BQVosQ0FBcEI7SUFDQTRMLGFBQWEsQ0FBQ3hCLE9BQWQsR0FBd0IsR0FBeEI7SUFDQXdCLGFBQWEsQ0FBQ3ZCLE9BQWQsR0FBd0IsR0FBeEI7SUFDQSxJQUFJd0IsVUFBVSxHQUFHRCxhQUFhLENBQUNqQixZQUFkLENBQTJCdEwsRUFBRSxDQUFDSyxLQUE5QixDQUFqQjtJQUNBbU0sVUFBVSxDQUFDdEosTUFBWCxHQUFvQixNQUFwQjtJQUNBc0osVUFBVSxDQUFDakIsUUFBWCxHQUFzQixFQUF0QjtJQUNBaUIsVUFBVSxDQUFDaEIsZUFBWCxHQUE2QnhMLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTb0wsZUFBVCxDQUF5QmdCLE1BQXREO0lBQ0FGLGFBQWEsQ0FBQ1osS0FBZCxHQUFzQjNMLEVBQUUsQ0FBQzJMLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUF0QjtJQUNBLElBQUllLFlBQVksR0FBR0gsYUFBYSxDQUFDakIsWUFBZCxDQUEyQnRMLEVBQUUsQ0FBQzZMLFlBQTlCLENBQW5CO0lBQ0FhLFlBQVksQ0FBQ2YsS0FBYixHQUFxQjNMLEVBQUUsQ0FBQzJMLEtBQUgsQ0FBUyxHQUFULEVBQWMsRUFBZCxFQUFrQixFQUFsQixDQUFyQjtJQUNBZSxZQUFZLENBQUMvQixLQUFiLEdBQXFCLENBQXJCO0lBQ0E0QixhQUFhLENBQUM5RSxNQUFkLEdBQXVCcUUsWUFBdkI7SUFFQUEsWUFBWSxDQUFDOUosRUFBYixDQUFnQmhDLEVBQUUsQ0FBQ1csSUFBSCxDQUFRZ00sU0FBUixDQUFrQkMsV0FBbEMsRUFBK0MsWUFBVztNQUN0RGQsWUFBWSxDQUFDZSxLQUFiLEdBQXFCLElBQXJCO0lBQ0gsQ0FGRDtJQUdBZixZQUFZLENBQUM5SixFQUFiLENBQWdCaEMsRUFBRSxDQUFDVyxJQUFILENBQVFnTSxTQUFSLENBQWtCRyxTQUFsQyxFQUE2QyxZQUFXO01BQ3BEaEIsWUFBWSxDQUFDZSxLQUFiLEdBQXFCLENBQXJCOztNQUNBbkwsSUFBSSxDQUFDcUwsVUFBTDtJQUNILENBSEQ7SUFJQWpCLFlBQVksQ0FBQzlKLEVBQWIsQ0FBZ0JoQyxFQUFFLENBQUNXLElBQUgsQ0FBUWdNLFNBQVIsQ0FBa0JLLFlBQWxDLEVBQWdELFlBQVc7TUFDdkRsQixZQUFZLENBQUNlLEtBQWIsR0FBcUIsQ0FBckI7SUFDSCxDQUZEOztJQUlBLEtBQUtJLHVCQUFMO0VBQ0gsQ0FsbUJJO0VBb21CTEMsZ0JBQWdCLEVBQUUsNEJBQVc7SUFDekIsSUFBSSxDQUFDLEtBQUs5SixvQkFBVixFQUFnQztJQUVoQyxJQUFJK0osY0FBYyxHQUFHLEtBQUtwSyxjQUFMLENBQW9CUSxNQUF6Qzs7SUFFQSxJQUFJNEosY0FBYyxJQUFJLENBQXRCLEVBQXlCO01BQ3JCLEtBQUt4SixjQUFMO0lBQ0g7RUFDSixDQTVtQkk7RUE4bUJMc0osdUJBQXVCLEVBQUUsbUNBQVc7SUFDaEMsSUFBSXZMLElBQUksR0FBRyxJQUFYO0lBQ0EsSUFBSSxDQUFDLEtBQUswQixvQkFBTixJQUE4QixDQUFDLEtBQUsrSCxjQUF4QyxFQUF3RDtJQUN4RCxLQUFLOUksWUFBTCxDQUFrQixZQUFXO01BQ3pCWCxJQUFJLENBQUN1TCx1QkFBTDtJQUNILENBRkQsRUFFRyxJQUFFLEVBRkw7RUFHSCxDQXBuQkk7RUFzbkJMdEosY0FBYyxFQUFFLDBCQUFXO0lBQ3ZCLEtBQUtQLG9CQUFMLEdBQTRCLEtBQTVCOztJQUVBLElBQUksS0FBSytILGNBQVQsRUFBeUI7TUFDckIsS0FBS0EsY0FBTCxDQUFvQmlDLE9BQXBCOztNQUNBLEtBQUtqQyxjQUFMLEdBQXNCLElBQXRCO0lBQ0g7RUFFSixDQTluQkk7RUFnb0JMNEIsVUFBVSxFQUFFLHNCQUFXO0lBRW5CLElBQUlsTSxRQUFRLEdBQUdDLE1BQU0sQ0FBQ0QsUUFBdEI7O0lBQ0EsSUFBSUEsUUFBUSxJQUFJQSxRQUFRLENBQUNNLE1BQXpCLEVBQWlDO01BQzdCLElBQUlOLFFBQVEsQ0FBQ00sTUFBVCxDQUFnQmtNLFNBQXBCLEVBQStCO1FBQzNCeE0sUUFBUSxDQUFDTSxNQUFULENBQWdCa00sU0FBaEI7TUFDSDtJQUNKOztJQUVELEtBQUsxSixjQUFMOztJQUNBM0QsRUFBRSxDQUFDdUMsUUFBSCxDQUFZQyxTQUFaLENBQXNCLFdBQXRCO0VBQ0gsQ0Ezb0JJO0VBNm9CTDtFQUNBO0VBQ0E7O0VBRUE7QUFDSjtBQUNBO0VBQ0lzRSxvQkFBb0IsRUFBRSw4QkFBUzdFLElBQVQsRUFBZTtJQUVqQztJQUNBLElBQUlBLElBQUksQ0FBQ3FMLE9BQVQsRUFBa0I7TUFDZCxLQUFLLElBQUloSyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUtQLGNBQUwsQ0FBb0JRLE1BQXhDLEVBQWdERCxDQUFDLEVBQWpELEVBQXFEO1FBQ2pELElBQUlELElBQUksR0FBRyxLQUFLTixjQUFMLENBQW9CTyxDQUFwQixDQUFYOztRQUNBLElBQUlELElBQUosRUFBVTtVQUNOLElBQUlrSyxVQUFVLEdBQUdsSyxJQUFJLENBQUMrRSxZQUFMLENBQWtCLGFBQWxCLENBQWpCOztVQUNBLElBQUltRixVQUFKLEVBQWdCO1lBQ1o7WUFDQSxLQUFLLElBQUlDLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUd2TCxJQUFJLENBQUNxTCxPQUFMLENBQWEvSixNQUFqQyxFQUF5Q2lLLENBQUMsRUFBMUMsRUFBOEM7Y0FDMUMsSUFBSUMsQ0FBQyxHQUFHeEwsSUFBSSxDQUFDcUwsT0FBTCxDQUFhRSxDQUFiLENBQVI7O2NBQ0EsSUFBSUMsQ0FBQyxDQUFDQyxFQUFGLEtBQVNILFVBQVUsQ0FBQ2hKLFNBQXhCLEVBQW1DO2dCQUMvQjtnQkFDQWxCLElBQUksQ0FBQ0csSUFBTCxDQUFVLHFCQUFWLEVBQWlDO2tCQUM3Qm1LLEtBQUssRUFBRUYsQ0FBQyxDQUFDRSxLQURvQjtrQkFFN0JDLFdBQVcsRUFBRUgsQ0FBQyxDQUFDRyxXQUZjO2tCQUc3QkMsV0FBVyxFQUFFSixDQUFDLENBQUNJO2dCQUhjLENBQWpDO2dCQUtBO2NBQ0g7WUFDSjtVQUNKO1FBQ0o7TUFDSjtJQUNKLENBekJnQyxDQTJCakM7OztJQUNBLElBQUk3RCxlQUFlLEdBQUcsS0FBSzNHLElBQUwsQ0FBVVMsY0FBVixDQUF5QixjQUF6QixDQUF0Qjs7SUFDQSxJQUFJa0csZUFBSixFQUFxQjtNQUNqQkEsZUFBZSxDQUFDbEUsTUFBaEIsR0FBeUIsS0FBekI7SUFDSCxDQS9CZ0MsQ0FpQ2pDOzs7SUFDQSxJQUFJZ0ksWUFBWSxHQUFHLEtBQUt6SyxJQUFMLENBQVVTLGNBQVYsQ0FBeUIsV0FBekIsQ0FBbkI7O0lBQ0EsSUFBSWdLLFlBQUosRUFBa0I7TUFDZEEsWUFBWSxDQUFDaEksTUFBYixHQUFzQixJQUF0QjtJQUNIO0VBQ0osQ0ExckJJOztFQTRyQkw7QUFDSjtBQUNBO0VBQ0lrQixnQkFBZ0IsRUFBRSwwQkFBUy9FLElBQVQsRUFBZTtJQUU3QjtJQUNBLEtBQUssSUFBSXFCLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUcsS0FBS1AsY0FBTCxDQUFvQlEsTUFBeEMsRUFBZ0RELENBQUMsRUFBakQsRUFBcUQ7TUFDakQsSUFBSUQsSUFBSSxHQUFHLEtBQUtOLGNBQUwsQ0FBb0JPLENBQXBCLENBQVg7O01BQ0EsSUFBSUQsSUFBSixFQUFVO1FBQ04sSUFBSWtLLFVBQVUsR0FBR2xLLElBQUksQ0FBQytFLFlBQUwsQ0FBa0IsYUFBbEIsQ0FBakI7O1FBQ0EsSUFBSW1GLFVBQVUsSUFBSUEsVUFBVSxDQUFDaEosU0FBWCxLQUF5QnRDLElBQUksQ0FBQzJFLFNBQWhELEVBQTJEO1VBQ3ZEdkQsSUFBSSxDQUFDRyxJQUFMLENBQVUscUJBQVYsRUFBaUM7WUFDN0JtSyxLQUFLLEVBQUUsU0FEc0I7WUFFN0JJLE9BQU8sRUFBRTlMLElBQUksQ0FBQzhMO1VBRmUsQ0FBakM7VUFJQTtRQUNIO01BQ0o7SUFDSjtFQUNKLENBL3NCSTs7RUFpdEJMO0FBQ0o7QUFDQTtFQUNJN0csZUFBZSxFQUFFLHlCQUFTakYsSUFBVCxFQUFlO0lBRTVCO0lBQ0EsS0FBSyxJQUFJcUIsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxLQUFLUCxjQUFMLENBQW9CUSxNQUF4QyxFQUFnREQsQ0FBQyxFQUFqRCxFQUFxRDtNQUNqRCxJQUFJRCxJQUFJLEdBQUcsS0FBS04sY0FBTCxDQUFvQk8sQ0FBcEIsQ0FBWDs7TUFDQSxJQUFJRCxJQUFKLEVBQVU7UUFDTixJQUFJa0ssVUFBVSxHQUFHbEssSUFBSSxDQUFDK0UsWUFBTCxDQUFrQixhQUFsQixDQUFqQjs7UUFDQSxJQUFJbUYsVUFBVSxJQUFJQSxVQUFVLENBQUNoSixTQUFYLEtBQXlCdEMsSUFBSSxDQUFDMkUsU0FBaEQsRUFBMkQ7VUFDdkR2RCxJQUFJLENBQUNHLElBQUwsQ0FBVSxxQkFBVixFQUFpQztZQUM3Qm1LLEtBQUssRUFBRTtVQURzQixDQUFqQztVQUdBO1FBQ0g7TUFDSjtJQUNKO0VBQ0o7QUFudUJJLENBQVQiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXNDb250ZW50IjpbIi8vIOS9v+eUqOWFqOWxgOWPmOmHj++8jOS4jeS9v+eUqCByZXF1aXJlXG4vLyDjgJDkv67lpI3niYjmnKzjgJHnroDljJblj5HniYzpgLvovpHvvIzkuI3lho3kvb/nlKjlrprml7blmajosIPluqZcbi8vIOaguOW/g+WOn+WIme+8mlxuLy8gMS4gZ2FtZWluZ1VJLmpzIOiHquW3seWkhOeQhuWPkeeJjOWKqOeUu1xuLy8gMi4gZ2FtZVNjZW5lLmpzIOWPqui0n+i0o+i9rOWPkeS6i+S7tue7mSBwbGF5ZXJfbm9kZVxuLy8gMy4g5LiN5L6d6LWWIHNjaGVkdWxlT25jZSDmjqfliLblj5HniYzoioLlpY9cblxuY2MuQ2xhc3Moe1xuICAgIGV4dGVuZHM6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgZGlfbGFiZWw6IGNjLkxhYmVsLFxuICAgICAgICBiZWlzaHVfbGFiZWw6IGNjLkxhYmVsLFxuICAgICAgICByb29taWRfbGFiZWw6IGNjLkxhYmVsLFxuICAgICAgICBwbGF5ZXJfbm9kZV9wcmVmYWJzOiBjYy5QcmVmYWIsXG4gICAgICAgIHBsYXllcnNfc2VhdF9wb3M6IGNjLk5vZGUsXG4gICAgfSxcblxuICAgIG9uTG9hZCgpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICB2YXIgUm9vbVN0YXRlID0gd2luZG93LlJvb21TdGF0ZSB8fCB7IFJPT01fSU5WQUxJRDogLTEgfVxuICAgICAgICB2YXIgaXNvcGVuX3NvdW5kID0gd2luZG93Lmlzb3Blbl9zb3VuZCB8fCAxXG5cbiAgICAgICAgaWYgKCFteWdsb2JhbCB8fCAhbXlnbG9iYWwucGxheWVyRGF0YSB8fCAhbXlnbG9iYWwuc29ja2V0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiZ2FtZVNjZW5lOiBteWdsb2JhbOOAgXBsYXllckRhdGEg5oiWIHNvY2tldCDmnKrlrprkuYlcIilcbiAgICAgICAgICAgIHRoaXMuX3dhaXRGb3JJbml0KClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9pbml0U2NlbmUobXlnbG9iYWwsIFJvb21TdGF0ZSwgaXNvcGVuX3NvdW5kKVxuICAgICAgICB0aGlzLl9zdGFydE9ubGluZU1vbml0b3JpbmcoKVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDlnKjnur/nm5HmtYvlkozlhbbku5blip/og71cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIF9zdGFydE9ubGluZU1vbml0b3Jpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiZ2FtZVNjZW5lOiBteWdsb2JhbCDmnKrlrprkuYnvvIzml6Dms5XlkK/liqjlnKjnur/nm5HmtYtcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHRoaXMuX29ubGluZVN0YXR1c0hhbmRsZXIgPSBmdW5jdGlvbihpc09ubGluZSkge1xuICAgICAgICAgICAgaWYgKCFpc09ubGluZSkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dPZmZsaW5lTWVzc2FnZSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChteWdsb2JhbC5hZGRPbmxpbmVTdGF0dXNMaXN0ZW5lcikge1xuICAgICAgICAgICAgbXlnbG9iYWwuYWRkT25saW5lU3RhdHVzTGlzdGVuZXIodGhpcy5fb25saW5lU3RhdHVzSGFuZGxlcilcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKG15Z2xvYmFsLmV2ZW50bGlzdGVyKSB7XG4gICAgICAgICAgICBteWdsb2JhbC5ldmVudGxpc3Rlci5vbihcImZvcmNlX2xvZ291dFwiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+aqyDmuLjmiI/lnLrmma/mlLbliLDlvLrliLbkuIvnur/kuovku7Y6XCIsIGRhdGEpXG4gICAgICAgICAgICAgICAgc2VsZi5faGFuZGxlRm9yY2VMb2dvdXQoZGF0YSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIF9zaG93T2ZmbGluZU1lc3NhZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLndhcm4oXCLwn5KUIOa4uOaIj+WcuuaZr++8mue9kee7nOi/nuaOpeW3suaWreW8gFwiKVxuICAgIH0sXG4gICAgXG4gICAgX2hhbmRsZUZvcmNlTG9nb3V0OiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciByZWFzb24gPSBkYXRhLnJlYXNvbiB8fCBcIuaCqOW3suiiq+W8uuWItuS4i+e6v1wiXG4gICAgICAgIGNvbnNvbGUud2FybihcIvCfmqsg5ri45oiP5Zy65pmv5by65Yi25LiL57q/OlwiLCByZWFzb24pXG4gICAgICAgIFxuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKG15Z2xvYmFsICYmIG15Z2xvYmFsLnN0b3BPbmxpbmVNb25pdG9yaW5nKSB7XG4gICAgICAgICAgICBteWdsb2JhbC5zdG9wT25saW5lTW9uaXRvcmluZygpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB0aGlzLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYWxlcnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBhbGVydChyZWFzb24gKyBcIlxcblxcbuivt+mHjeaWsOeZu+W9lVwiKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwibG9naW5TY2VuZVwiKVxuICAgICAgICB9LCAwLjUpXG4gICAgfSxcbiAgICBcbiAgICBfc3RvcE9ubGluZU1vbml0b3Jpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgXG4gICAgICAgIGlmIChteWdsb2JhbCAmJiBteWdsb2JhbC5yZW1vdmVPbmxpbmVTdGF0dXNMaXN0ZW5lciAmJiB0aGlzLl9vbmxpbmVTdGF0dXNIYW5kbGVyKSB7XG4gICAgICAgICAgICBteWdsb2JhbC5yZW1vdmVPbmxpbmVTdGF0dXNMaXN0ZW5lcih0aGlzLl9vbmxpbmVTdGF0dXNIYW5kbGVyKVxuICAgICAgICAgICAgdGhpcy5fb25saW5lU3RhdHVzSGFuZGxlciA9IG51bGxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgX3dhaXRGb3JJbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgYXR0ZW1wdHMgPSAwO1xuICAgICAgICB2YXIgbWF4QXR0ZW1wdHMgPSAyMDtcbiAgICAgICAgXG4gICAgICAgIHZhciBjaGVja0luaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGF0dGVtcHRzKys7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbDtcbiAgICAgICAgICAgIGlmIChteWdsb2JhbCAmJiBteWdsb2JhbC5wbGF5ZXJEYXRhICYmIG15Z2xvYmFsLnNvY2tldCkge1xuICAgICAgICAgICAgICAgIHZhciBSb29tU3RhdGUgPSB3aW5kb3cuUm9vbVN0YXRlIHx8IHsgUk9PTV9JTlZBTElEOiAtMSB9O1xuICAgICAgICAgICAgICAgIHZhciBpc29wZW5fc291bmQgPSB3aW5kb3cuaXNvcGVuX3NvdW5kIHx8IDE7XG4gICAgICAgICAgICAgICAgc2VsZi5faW5pdFNjZW5lKG15Z2xvYmFsLCBSb29tU3RhdGUsIGlzb3Blbl9zb3VuZCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGF0dGVtcHRzIDwgbWF4QXR0ZW1wdHMpIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrSW5pdCwgMTAwKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImdhbWVTY2VuZSDliJ3lp4vljJbotoXml7ZcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrSW5pdCwgMTAwKTtcbiAgICB9LFxuICAgIFxuICAgIF9pbml0U2NlbmU6IGZ1bmN0aW9uKG15Z2xvYmFsLCBSb29tU3RhdGUsIGlzb3Blbl9zb3VuZCkge1xuICAgICAgICB0aGlzLnBsYXllck5vZGVMaXN0ID0gW11cbiAgICAgICAgXG4gICAgICAgIHZhciBib3R0b20gPSBteWdsb2JhbC5wbGF5ZXJEYXRhLmJvdHRvbSB8fCAxXG4gICAgICAgIHZhciByYXRlID0gbXlnbG9iYWwucGxheWVyRGF0YS5yYXRlIHx8IDFcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZGlfbGFiZWwuc3RyaW5nID0gXCLlupU6XCIgKyBib3R0b21cbiAgICAgICAgdGhpcy5iZWlzaHVfbGFiZWwuc3RyaW5nID0gXCLlgI3mlbA6XCIgKyByYXRlXG4gICAgICAgIHRoaXMucm9vbXN0YXRlID0gUm9vbVN0YXRlLlJPT01fSU5WQUxJRFxuICAgICAgICB0aGlzLl9pc1dhaXRpbmdGb3JQbGF5ZXJzID0gZmFsc2VcblxuXG4gICAgICAgIC8vIOebkeWQrO+8jOe7meWFtuS7lueOqeWutuWPkeeJjCjlhoXpg6jkuovku7YpXG4gICAgICAgIC8vIOOAkOaguOW/g+OAkXBsYXllcl9ub2RlIOebtOaOpeaYvuekuiAxNyDlvKDniYzog4zvvIzkuI3lho3pgJDlvKDliqjnlLtcbiAgICAgICAgdGhpcy5ub2RlLm9uKFwicHVzaGNhcmRfb3RoZXJfZXZlbnRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGxheWVyTm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLmVtaXQoXCJwdXNoX2NhcmRfZXZlbnRcIilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDnm5HlkKzmiL/pl7TnirbmgIHmlLnlj5jkuovku7ZcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uUm9vbUNoYW5nZVN0YXRlKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMucm9vbXN0YXRlID0gZGF0YVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoZGF0YSAhPT0gUm9vbVN0YXRlLlJPT01fSU5WQUxJRCAmJiB0aGlzLl9pc1dhaXRpbmdGb3JQbGF5ZXJzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5faGlkZVdhaXRpbmdVSSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICB0aGlzLm5vZGUub24oXCJjYW5yb2JfZXZlbnRcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wbGF5ZXJOb2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInBsYXllcm5vZGVfY2Fucm9iX2V2ZW50XCIsIGV2ZW50KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIHRoaXMubm9kZS5vbihcImNob29zZV9jYXJkX2V2ZW50XCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgZ2FtZXVpX25vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJnYW1laW5nVUlcIilcbiAgICAgICAgICAgIGlmIChnYW1ldWlfbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBnYW1ldWlfbm9kZS5lbWl0KFwiY2hvb3NlX2NhcmRfZXZlbnRcIiwgZXZlbnQpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICB0aGlzLm5vZGUub24oXCJ1bmNob29zZV9jYXJkX2V2ZW50XCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgZ2FtZXVpX25vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJnYW1laW5nVUlcIilcbiAgICAgICAgICAgIGlmIChnYW1ldWlfbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBnYW1ldWlfbm9kZS5lbWl0KFwidW5jaG9vc2VfY2FyZF9ldmVudFwiLCBldmVudClcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIHZhciBjdXJyZW50Um9vbUNvZGUgPSBteWdsb2JhbC5zb2NrZXQuZ2V0Q3VycmVudFJvb21Db2RlKClcbiAgICAgICAgdmFyIGlzSW5Sb29tID0gbXlnbG9iYWwuc29ja2V0LmlzSW5Sb29tKClcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICB2YXIgcm9vbURhdGEgPSBteWdsb2JhbC5yb29tRGF0YVxuICAgICAgICBcbiAgICAgICAgaWYgKGlzSW5Sb29tICYmIGN1cnJlbnRSb29tQ29kZSAmJiAhcm9vbURhdGEpIHtcbiAgICAgICAgICAgIHJvb21EYXRhID0ge1xuICAgICAgICAgICAgICAgIHJvb21pZDogY3VycmVudFJvb21Db2RlLFxuICAgICAgICAgICAgICAgIHJvb21fY29kZTogY3VycmVudFJvb21Db2RlLFxuICAgICAgICAgICAgICAgIHNlYXRpbmRleDogMSxcbiAgICAgICAgICAgICAgICBwbGF5ZXJkYXRhOiBbe1xuICAgICAgICAgICAgICAgICAgICBhY2NvdW50aWQ6IG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudGlkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEucGxheWVySWQsXG4gICAgICAgICAgICAgICAgICAgIG5pY2tfbmFtZTogbXlnbG9iYWwucGxheWVyRGF0YS5uaWNrTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYXZhdGFyVXJsOiBcImF2YXRhcl8xXCIsXG4gICAgICAgICAgICAgICAgICAgIGdvbGRfY291bnQ6IG15Z2xvYmFsLnBsYXllckRhdGEuZ29iYWxfY291bnQgfHwgMTAwMCwgLy8g8J+Up+OAkOS/ruWkjeOAkeS9v+eUqCBnb2xkX2NvdW50IOWtl+autVxuICAgICAgICAgICAgICAgICAgICBnb2xkY291bnQ6IG15Z2xvYmFsLnBsYXllckRhdGEuZ29iYWxfY291bnQgfHwgMTAwMCwgIC8vIOWFvOWuueaXp+WuouaIt+err1xuICAgICAgICAgICAgICAgICAgICBzZWF0aW5kZXg6IDEsXG4gICAgICAgICAgICAgICAgICAgIGlzcmVhZHk6IHRydWVcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAocm9vbURhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NSb29tRGF0YShyb29tRGF0YSwgbXlnbG9iYWwsIGlzb3Blbl9zb3VuZClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG15Z2xvYmFsLnNvY2tldC5yZXF1ZXN0X2VudGVyX3Jvb20oe30sIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGVyciAhPSAwKSB7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc1Jvb21EYXRhKHJlc3VsdCwgbXlnbG9iYWwsIGlzb3Blbl9zb3VuZClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIH1cblxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25QbGF5ZXJKb2luUm9vbShmdW5jdGlvbihqb2luX3BsYXllcmRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkUGxheWVyTm9kZShqb2luX3BsYXllcmRhdGEpXG5cbiAgICAgICAgICAgIGlmICghdGhpcy5fcGxheWVyZGF0YUxpc3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5ZXJkYXRhTGlzdCA9IFtdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9wbGF5ZXJkYXRhTGlzdC5wdXNoKGpvaW5fcGxheWVyZGF0YSlcblxuICAgICAgICAgICAgaWYgKHRoaXMuX2lzV2FpdGluZ0ZvclBsYXllcnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zaG93V2FpdGluZ1VJKDMgLSB0aGlzLl9wbGF5ZXJkYXRhTGlzdC5sZW5ndGgsIHRoaXMuX2N1cnJlbnRSb29tQ29kZSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMucGxheWVyTm9kZUxpc3QubGVuZ3RoID49IDMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9oaWRlV2FpdGluZ1VJKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vblBsYXllclJlYWR5KGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wbGF5ZXJOb2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInBsYXllcl9yZWFkeV9ub3RpZnlcIiwgZGF0YSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25HYW1lU3RhcnQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGxheWVyTm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLmVtaXQoXCJnYW1lc3RhcnRfZXZlbnRcIilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBnYW1lYmVmb3JlVUkgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJnYW1lYmVmb3JlVUlcIilcbiAgICAgICAgICAgIGlmIChnYW1lYmVmb3JlVUkpIHtcbiAgICAgICAgICAgICAgICBnYW1lYmVmb3JlVUkuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vblJvYlN0YXRlKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5re75YqgIHJvdW5kIOWtl+aute+8jOWMuuWIhuWPq+WcsOS4u+WSjOaKouWcsOS4u1xuICAgICAgICAgICAgdmFyIGV2ZW50V2l0aFJvdW5kID0gT2JqZWN0LmFzc2lnbih7fSwgZXZlbnQsIHsgcm91bmQ6IDIgfSlcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wbGF5ZXJOb2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInBsYXllcm5vZGVfcm9iX3N0YXRlX2V2ZW50XCIsIGV2ZW50V2l0aFJvdW5kKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeebkeWQrOWPq+WcsOS4u+e7k+aenO+8iOesrOS4gOi9ru+8iVxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25CaWRSZXN1bHQoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmt7vliqAgcm91bmQg5a2X5q6177yM5Yy65YiG5Y+r5Zyw5Li75ZKM5oqi5Zyw5Li7XG4gICAgICAgICAgICB2YXIgZXZlbnRXaXRoUm91bmQgPSBPYmplY3QuYXNzaWduKHt9LCBldmVudCwgeyByb3VuZDogMSB9KVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLnBsYXllck5vZGVMaXN0W2ldXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5lbWl0KFwicGxheWVybm9kZV9yb2Jfc3RhdGVfZXZlbnRcIiwgZXZlbnRXaXRoUm91bmQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQ2hhbmdlTWFzdGVyKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLm1hc3Rlcl9hY2NvdW50aWQgPSBldmVudFxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLnBsYXllck5vZGVMaXN0W2ldXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5lbWl0KFwicGxheWVybm9kZV9jaGFuZ2VtYXN0ZXJfZXZlbnRcIiwgZXZlbnQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeebkeWQrOWHuueJjOmYtuauteW8gOWni1xuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25QbGF5U3RhcnQoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgLy8g6K6+572u5oi/6Ze054q25oCB5Li65Ye654mM6Zi25q61XG4gICAgICAgICAgICB0aGlzLnJvb21zdGF0ZSA9IFJvb21TdGF0ZS5ST09NX1BMQVlJTkdcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIHRoaXMubm9kZS5vbihcInVwZGF0ZV9jYXJkX2NvdW50X2V2ZW50XCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wbGF5ZXJOb2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInVwZGF0ZV9jYXJkX2NvdW50X2V2ZW50XCIsIGRhdGEpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uU2hvd0JvdHRvbUNhcmQoZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBnYW1ldWlfbm9kZSA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcImdhbWVpbmdVSVwiKVxuICAgICAgICAgICAgaWYgKGdhbWV1aV9ub2RlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdhbWV1aV9ub2RlLmVtaXQoXCJzaG93X2JvdHRvbV9jYXJkX2V2ZW50XCIsIGV2ZW50KVxuICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIFxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25Sb29tUmVzdG9yZWQoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgaWYgKGRhdGEucm9vbV9jb2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3RvcmVkUm9vbURhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgIHJvb21pZDogZGF0YS5yb29tX2NvZGUsXG4gICAgICAgICAgICAgICAgICAgIHJvb21fY29kZTogZGF0YS5yb29tX2NvZGUsXG4gICAgICAgICAgICAgICAgICAgIHNlYXRpbmRleDogMSxcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyZGF0YTogW3tcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjY291bnRpZDogZGF0YS5wbGF5ZXJfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBuaWNrX25hbWU6IGRhdGEucGxheWVyX25hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBhdmF0YXJVcmw6IFwiYXZhdGFyXzFcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvbGRfY291bnQ6IGRhdGEuZ29sZF9jb3VudCB8fCAxMDAwLCAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55SoIGdvbGRfY291bnQg5a2X5q61XG4gICAgICAgICAgICAgICAgICAgICAgICBnb2xkY291bnQ6IGRhdGEuZ29sZF9jb3VudCB8fCAxMDAwLCAgLy8g5YW85a655pen5a6i5oi356uvXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWF0aW5kZXg6IDFcbiAgICAgICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc1Jvb21EYXRhKHJlc3RvcmVkUm9vbURhdGEsIG15Z2xvYmFsLCBpc29wZW5fc291bmQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgXG4gICAgICAgIC8vIOOAkOaWsOWinuOAkeebkeWQrOa4uOaIj+eKtuaAgeaBouWkjeS6i+S7tlxuICAgICAgICB0aGlzLm5vZGUub24oXCJnYW1lX3N0YXRlX3Jlc3RvcmVkXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuX29uR2FtZVN0YXRlUmVzdG9yZWQoZGF0YSlcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICBcbiAgICAgICAgLy8g44CQ5paw5aKe44CR55uR5ZCs546p5a625o6J57q/6YCa55+lXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vblBsYXllck9mZmxpbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5fb25QbGF5ZXJPZmZsaW5lKGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgXG4gICAgICAgIC8vIOOAkOaWsOWinuOAkeebkeWQrOeOqeWutuS4iue6v+mAmuefpVxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25QbGF5ZXJPbmxpbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5fb25QbGF5ZXJPbmxpbmUoZGF0YSlcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICBcbiAgICB9LFxuXG4gICAgc2V0UGxheWVyU2VhdFBvcyhzZWF0X2luZGV4KSB7XG4gICAgICAgIGlmIChzZWF0X2luZGV4IDwgMSB8fCBzZWF0X2luZGV4ID4gMykge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuXG4gICAgICAgIHN3aXRjaCAoc2VhdF9pbmRleCkge1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyZGF0YV9saXN0X3Bvc1sxXSA9IDBcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllcmRhdGFfbGlzdF9wb3NbMl0gPSAxXG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXJkYXRhX2xpc3RfcG9zWzNdID0gMlxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXJkYXRhX2xpc3RfcG9zWzJdID0gMFxuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyZGF0YV9saXN0X3Bvc1szXSA9IDFcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllcmRhdGFfbGlzdF9wb3NbMV0gPSAyXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllcmRhdGFfbGlzdF9wb3NbM10gPSAwXG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXJkYXRhX2xpc3RfcG9zWzFdID0gMVxuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyZGF0YV9saXN0X3Bvc1syXSA9IDJcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFkZFBsYXllck5vZGUocGxheWVyX2RhdGEpIHtcblxuICAgICAgICBpZiAoIXRoaXMucGxheWVyX25vZGVfcHJlZmFicykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcInBsYXllcl9ub2RlX3ByZWZhYnMg5pyq57uR5a6a77yBXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLnBsYXllcnNfc2VhdF9wb3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJwbGF5ZXJzX3NlYXRfcG9zIOacque7keWumu+8gVwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwbGF5ZXJub2RlX2luc3QgPSBjYy5pbnN0YW50aWF0ZSh0aGlzLnBsYXllcl9ub2RlX3ByZWZhYnMpO1xuICAgICAgICBpZiAoIXBsYXllcm5vZGVfaW5zdCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuaXoOazleWunuS+i+WMliBwbGF5ZXJfbm9kZV9wcmVmYWJzXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcGxheWVybm9kZV9pbnN0LnBhcmVudCA9IHRoaXMubm9kZTtcbiAgICAgICAgdGhpcy5wbGF5ZXJOb2RlTGlzdC5wdXNoKHBsYXllcm5vZGVfaW5zdCk7XG5cbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeWwhuaIv+mXtOexu+Wei+S8oOmAkue7mSBwbGF5ZXJfbm9kZe+8iOeUqOS6juWMuuWIhuaZrumAmuWcuuWSjOernuaKgOWcuu+8iVxuICAgICAgICBpZiAoIXBsYXllcl9kYXRhLnJvb21fY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgIHBsYXllcl9kYXRhLnJvb21fY2F0ZWdvcnkgPSB0aGlzLl9yb29tQ2F0ZWdvcnkgfHwgMVxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFthZGRQbGF5ZXJOb2RlXSDorr7nva4gcGxheWVyX2RhdGEucm9vbV9jYXRlZ29yeSA9XCIsIHBsYXllcl9kYXRhLnJvb21fY2F0ZWdvcnkpXG4gICAgICAgIH1cblxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5bCG5pyf5Y+35Lyg6YCS57uZIHBsYXllcl9ub2RlXG4gICAgICAgIGlmICghcGxheWVyX2RhdGEucGVyaW9kX25vICYmIHRoaXMuX3BlcmlvZE5vKSB7XG4gICAgICAgICAgICBwbGF5ZXJfZGF0YS5wZXJpb2Rfbm8gPSB0aGlzLl9wZXJpb2ROb1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5wbGF5ZXJkYXRhX2xpc3RfcG9zW3BsYXllcl9kYXRhLnNlYXRpbmRleF07XG4gICAgICAgIFxuICAgICAgICBpZiAoaW5kZXggPT09IHVuZGVmaW5lZCB8fCBpbmRleCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuaXoOaViOeahOW6p+S9jee0ouW8lTpcIiwgcGxheWVyX2RhdGEuc2VhdGluZGV4KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLnBsYXllcnNfc2VhdF9wb3MuY2hpbGRyZW4gfHwgIXRoaXMucGxheWVyc19zZWF0X3Bvcy5jaGlsZHJlbltpbmRleF0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLluqfkvY3oioLngrnkuI3lrZjlnKjvvIxpbmRleDpcIiwgaW5kZXgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBwbGF5ZXJub2RlX2luc3QucG9zaXRpb24gPSB0aGlzLnBsYXllcnNfc2VhdF9wb3MuY2hpbGRyZW5baW5kZXhdLnBvc2l0aW9uO1xuICAgICAgICBcbiAgICAgICAgdmFyIHBsYXllck5vZGVTY3JpcHQgPSBwbGF5ZXJub2RlX2luc3QuZ2V0Q29tcG9uZW50KFwicGxheWVyX25vZGVcIik7XG4gICAgICAgIGlmICghcGxheWVyTm9kZVNjcmlwdCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuaXoOazleiOt+WPliBwbGF5ZXJfbm9kZSDnu4Tku7ZcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHBsYXllck5vZGVTY3JpcHQuaW5pdF9kYXRhKHBsYXllcl9kYXRhLCBpbmRleCk7XG4gICAgfSxcblxuICAgIHN0YXJ0KCkge1xuICAgIH0sXG5cbiAgICBvbkRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9zdG9wT25saW5lTW9uaXRvcmluZygpXG4gICAgfSxcblxuICAgIGdldFVzZXJPdXRDYXJkUG9zQnlBY2NvdW50KGFjY291bnRpZCkge1xuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLnBsYXllck5vZGVMaXN0IHx8ICF0aGlzLnBsYXllcnNfc2VhdF9wb3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJwbGF5ZXJOb2RlTGlzdCDmiJYgcGxheWVyc19zZWF0X3BvcyDmnKrliJ3lp4vljJZcIik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGVfc2NyaXB0ID0gbm9kZS5nZXRDb21wb25lbnQoXCJwbGF5ZXJfbm9kZVwiKVxuICAgICAgICAgICAgICAgIGlmIChub2RlX3NjcmlwdCAmJiBub2RlX3NjcmlwdC5hY2NvdW50aWQgPT09IGFjY291bnRpZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZV9zY3JpcHQuc2VhdF9pbmRleCA9PT0gdW5kZWZpbmVkIHx8IG5vZGVfc2NyaXB0LnNlYXRfaW5kZXggPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLml6DmlYjnmoQgc2VhdF9pbmRleFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMucGxheWVyc19zZWF0X3Bvcy5jaGlsZHJlbiB8fCAhdGhpcy5wbGF5ZXJzX3NlYXRfcG9zLmNoaWxkcmVuW25vZGVfc2NyaXB0LnNlYXRfaW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi5bqn5L2N6IqC54K55LiN5a2Y5Zyo77yMc2VhdF9pbmRleDpcIiwgbm9kZV9zY3JpcHQuc2VhdF9pbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlYXRfbm9kZSA9IHRoaXMucGxheWVyc19zZWF0X3Bvcy5jaGlsZHJlbltub2RlX3NjcmlwdC5zZWF0X2luZGV4XVxuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXhfbmFtZSA9IFwiY2FyZHNvdXR6b25lXCIgKyBub2RlX3NjcmlwdC5zZWF0X2luZGV4XG4gICAgICAgICAgICAgICAgICAgIHZhciBvdXRfY2FyZF9ub2RlID0gc2VhdF9ub2RlLmdldENoaWxkQnlOYW1lKGluZGV4X25hbWUpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvdXRfY2FyZF9ub2RlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9LFxuICAgIFxuICAgIF9wcm9jZXNzUm9vbURhdGE6IGZ1bmN0aW9uKHJlc3VsdCwgbXlnbG9iYWwsIGlzb3Blbl9zb3VuZCkge1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCLwn46uIFtfcHJvY2Vzc1Jvb21EYXRhXSDmjqXmlLbliLDnmoTmlbDmja46XCIsIEpTT04uc3RyaW5naWZ5KHJlc3VsdCkpXG4gICAgICAgIFxuICAgICAgICB2YXIgc2VhdGlkID0gcmVzdWx0LnNlYXRpbmRleCB8fCAxXG4gICAgICAgIFxuICAgICAgICB0aGlzLnBsYXllcmRhdGFfbGlzdF9wb3MgPSBbXVxuICAgICAgICB0aGlzLnNldFBsYXllclNlYXRQb3Moc2VhdGlkKVxuXG4gICAgICAgIHZhciBwbGF5ZXJkYXRhX2xpc3QgPSByZXN1bHQucGxheWVyZGF0YSB8fCBbXVxuICAgICAgICB2YXIgcm9vbWlkID0gcmVzdWx0LnJvb21pZCB8fCByZXN1bHQucm9vbV9jb2RlIHx8IHJlc3VsdC5yb29tQ29kZSB8fCBcIldBSVRJTkdcIlxuXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHmo4Dmn6XmmK/lkKbmmK/nq57mioDlnLrmqKHlvI9cbiAgICAgICAgdmFyIGlzQXJlbmFNb2RlID0gcmVzdWx0LnJvb21fY2F0ZWdvcnkgPT09IDJcbiAgICAgICAgaWYgKGlzQXJlbmFNb2RlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW19wcm9jZXNzUm9vbURhdGFdIOernuaKgOWcuuaooeW8jzogcm9vbV9jYXRlZ29yeT0yLCBwbGF5ZXJkYXRh5pWw6YePPVwiICsgcGxheWVyZGF0YV9saXN0Lmxlbmd0aCArIFwiLCDmnJ/lj7c9XCIgKyByZXN1bHQucGVyaW9kX25vKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeS/neWtmOaIv+mXtOexu+Wei+WIsOWunuS+i+WPmOmHj++8jOS+myBwbGF5ZXJfbm9kZSDkvb/nlKhcbiAgICAgICAgdGhpcy5fcm9vbUNhdGVnb3J5ID0gcmVzdWx0LnJvb21fY2F0ZWdvcnkgfHwgMVxuICAgICAgICB0aGlzLl9pc0FyZW5hTW9kZSA9IGlzQXJlbmFNb2RlXG4gICAgICAgIHRoaXMuX3BlcmlvZE5vID0gcmVzdWx0LnBlcmlvZF9ubyB8fCBcIlwiIC8vIPCflKfjgJDmlrDlop7jgJHkv53lrZjmnJ/lj7dcblxuICAgICAgICB0aGlzLl9wbGF5ZXJkYXRhTGlzdCA9IHBsYXllcmRhdGFfbGlzdFxuXG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5yb29taWRfbGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMucm9vbWlkX2xhYmVsLnN0cmluZyA9IFwi5oi/6Ze05Y+3OlwiICsgcm9vbWlkXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+OriBb5ri45oiP5Zy65pmvXSByb29taWRfbGFiZWwg5pyq57uR5a6a77yBXCIpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEuaG91c2VtYW5hZ2VpZCA9IHJlc3VsdC5ob3VzZW1hbmFnZWlkIHx8IHJlc3VsdC5jcmVhdG9yX2lkIHx8IHJlc3VsdC5jcmVhdG9ySWQgfHwgXCJcIlxuICAgICAgICBcbiAgICAgICAgaWYgKG15Z2xvYmFsLnNvY2tldCAmJiBteWdsb2JhbC5zb2NrZXQuZ2V0UGxheWVySW5mbykge1xuICAgICAgICAgICAgdmFyIHBsYXllckluZm8gPSBteWdsb2JhbC5zb2NrZXQuZ2V0UGxheWVySW5mbygpXG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBsYXllcmRhdGFfbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn46uIFtfcHJvY2Vzc1Jvb21EYXRhXSDmt7vliqDnjqnlrrboioLngrk6IFwiICsgSlNPTi5zdHJpbmdpZnkocGxheWVyZGF0YV9saXN0W2ldKSlcbiAgICAgICAgICAgIHRoaXMuYWRkUGxheWVyTm9kZShwbGF5ZXJkYXRhX2xpc3RbaV0pXG4gICAgICAgIH1cbiAgICAgICAgXG5cbiAgICAgICAgaWYgKGlzb3Blbl9zb3VuZCkge1xuICAgICAgICAgICAgY2MuYXVkaW9FbmdpbmUuc3RvcEFsbCgpXG4gICAgICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcInNvdW5kL2JnXCIsIGNjLkF1ZGlvQ2xpcCwgZnVuY3Rpb24oZXJyLCBjbGlwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2MuYXVkaW9FbmdpbmUucGxheShjbGlwLCB0cnVlLCAxKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIGdhbWViZWZvcmVfbm9kZSA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcImdhbWViZWZvcmVVSVwiKVxuICAgICAgICBpZiAoZ2FtZWJlZm9yZV9ub2RlKSB7XG4gICAgICAgICAgICBnYW1lYmVmb3JlX25vZGUuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgZ2FtZWJlZm9yZV9ub2RlLnpJbmRleCA9IDEwMDBcbiAgICAgICAgICAgIGdhbWViZWZvcmVfbm9kZS5lbWl0KFwiaW5pdFwiKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR56ue5oqA5Zy65qih5byP5LiL5LiN5pi+56S6562J5b6F546p5a62VUnvvIjmiYDmnInnjqnlrrblt7LliIbphY3lpb3vvIlcbiAgICAgICAgaWYgKGlzQXJlbmFNb2RlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW19wcm9jZXNzUm9vbURhdGFdIOernuaKgOWcuuaooeW8j++8muS4jeaYvuekuuetieW+heeOqeWutlVJXCIpXG4gICAgICAgICAgICAvLyDnq57mioDlnLrmqKHlvI/kuIvmiYDmnInnjqnlrrblupTor6Xlt7Lnu4/lh4blpIflpb3vvIznm7TmjqXnrYnlvoXmuLjmiI/lvIDlp4tcbiAgICAgICAgfSBlbHNlIGlmIChwbGF5ZXJkYXRhX2xpc3QubGVuZ3RoIDwgMykge1xuICAgICAgICAgICAgdGhpcy5fc2hvd1dhaXRpbmdVSSgzIC0gcGxheWVyZGF0YV9saXN0Lmxlbmd0aCwgcm9vbWlkKVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBfc2hvd1dhaXRpbmdVSTogZnVuY3Rpb24obmVlZFBsYXllcnMsIHJvb21Db2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB0aGlzLl9pc1dhaXRpbmdGb3JQbGF5ZXJzID0gdHJ1ZVxuICAgICAgICB0aGlzLl9uZWVkUGxheWVycyA9IG5lZWRQbGF5ZXJzXG4gICAgICAgIHRoaXMuX2N1cnJlbnRSb29tQ29kZSA9IHJvb21Db2RlIHx8IFwiXCJcblxuXG4gICAgICAgIHRoaXMuX2hpZGVXYWl0aW5nVUkoKVxuXG4gICAgICAgIHZhciBjYW52YXMgPSB0aGlzLm5vZGUuZ2V0Q29tcG9uZW50KGNjLkNhbnZhcykgfHwgY2MuZmluZCgnQ2FudmFzJykuZ2V0Q29tcG9uZW50KGNjLkNhbnZhcylcbiAgICAgICAgdmFyIHNjcmVlbkhlaWdodCA9IGNhbnZhcyA/IGNhbnZhcy5kZXNpZ25SZXNvbHV0aW9uLmhlaWdodCA6IDcyMFxuICAgICAgICB2YXIgc2NyZWVuV2lkdGggPSBjYW52YXMgPyBjYW52YXMuZGVzaWduUmVzb2x1dGlvbi53aWR0aCA6IDEyODBcblxuICAgICAgICB2YXIgd2FpdGluZ05vZGUgPSBuZXcgY2MuTm9kZShcIldhaXRpbmdGb3JQbGF5ZXJzVUlcIilcbiAgICAgICAgd2FpdGluZ05vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZShzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSlcbiAgICAgICAgd2FpdGluZ05vZGUuYW5jaG9yWCA9IDAuNVxuICAgICAgICB3YWl0aW5nTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgIHdhaXRpbmdOb2RlLnggPSAwXG4gICAgICAgIHdhaXRpbmdOb2RlLnkgPSAwXG4gICAgICAgIHdhaXRpbmdOb2RlLnBhcmVudCA9IHRoaXMubm9kZVxuICAgICAgICB0aGlzLl93YWl0aW5nVUlOb2RlID0gd2FpdGluZ05vZGVcblxuICAgICAgICBpZiAocm9vbUNvZGUpIHtcbiAgICAgICAgICAgIHZhciByb29tSW5mb05vZGUgPSBuZXcgY2MuTm9kZShcIlJvb21JbmZvXCIpXG4gICAgICAgICAgICByb29tSW5mb05vZGUueCA9IC1zY3JlZW5XaWR0aC8yICsgMjBcbiAgICAgICAgICAgIHJvb21JbmZvTm9kZS55ID0gc2NyZWVuSGVpZ2h0LzIgLSAzMFxuICAgICAgICAgICAgcm9vbUluZm9Ob2RlLmFuY2hvclggPSAwXG4gICAgICAgICAgICByb29tSW5mb05vZGUuYW5jaG9yWSA9IDAuNVxuXG4gICAgICAgICAgICB2YXIgcm9vbUxhYmVsID0gcm9vbUluZm9Ob2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgIHJvb21MYWJlbC5zdHJpbmcgPSBcIuaIv+mXtOWPtzogXCIgKyByb29tQ29kZVxuICAgICAgICAgICAgcm9vbUxhYmVsLmZvbnRTaXplID0gMjRcbiAgICAgICAgICAgIHJvb21MYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uTEVGVFxuICAgICAgICAgICAgcm9vbUluZm9Ob2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyMTUsIDApXG5cbiAgICAgICAgICAgIHZhciByb29tT3V0bGluZSA9IHJvb21JbmZvTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKVxuICAgICAgICAgICAgcm9vbU91dGxpbmUuY29sb3IgPSBjYy5jb2xvcigwLCAwLCAwKVxuICAgICAgICAgICAgcm9vbU91dGxpbmUud2lkdGggPSAyXG4gICAgICAgICAgICByb29tSW5mb05vZGUucGFyZW50ID0gd2FpdGluZ05vZGVcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZWF2ZUJ0bk5vZGUgPSBuZXcgY2MuTm9kZShcIkxlYXZlQnRuXCIpXG4gICAgICAgIGxlYXZlQnRuTm9kZS54ID0gc2NyZWVuV2lkdGgvMiAtIDEwMFxuICAgICAgICBsZWF2ZUJ0bk5vZGUueSA9IC1zY3JlZW5IZWlnaHQvMiArIDUwXG4gICAgICAgIGxlYXZlQnRuTm9kZS5hbmNob3JYID0gMC41XG4gICAgICAgIGxlYXZlQnRuTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgIGxlYXZlQnRuTm9kZS5zZXRDb250ZW50U2l6ZShjYy5zaXplKDE0MCwgNDApKVxuXG4gICAgICAgIHZhciBsZWF2ZUJ0bkJnID0gbGVhdmVCdG5Ob2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgbGVhdmVCdG5CZy5maWxsQ29sb3IgPSBjYy5jb2xvcigxODAsIDYwLCA2MCwgMjMwKVxuICAgICAgICBsZWF2ZUJ0bkJnLnJvdW5kUmVjdCgtNzAsIC0yMCwgMTQwLCA0MCwgOClcbiAgICAgICAgbGVhdmVCdG5CZy5maWxsKClcbiAgICAgICAgbGVhdmVCdG5CZy5zdHJva2VDb2xvciA9IGNjLmNvbG9yKDIyMCwgMTAwLCAxMDApXG4gICAgICAgIGxlYXZlQnRuQmcubGluZVdpZHRoID0gMlxuICAgICAgICBsZWF2ZUJ0bkJnLnJvdW5kUmVjdCgtNzAsIC0yMCwgMTQwLCA0MCwgOClcbiAgICAgICAgbGVhdmVCdG5CZy5zdHJva2UoKVxuICAgICAgICBsZWF2ZUJ0bk5vZGUucGFyZW50ID0gd2FpdGluZ05vZGVcblxuICAgICAgICB2YXIgbGVhdmVCdG5MYWJlbCA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIilcbiAgICAgICAgbGVhdmVCdG5MYWJlbC5hbmNob3JYID0gMC41XG4gICAgICAgIGxlYXZlQnRuTGFiZWwuYW5jaG9yWSA9IDAuNVxuICAgICAgICB2YXIgbGVhdmVMYWJlbCA9IGxlYXZlQnRuTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBsZWF2ZUxhYmVsLnN0cmluZyA9IFwi56a75byA5oi/6Ze0XCJcbiAgICAgICAgbGVhdmVMYWJlbC5mb250U2l6ZSA9IDIwXG4gICAgICAgIGxlYXZlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICBsZWF2ZUJ0bkxhYmVsLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgdmFyIGxlYXZlT3V0bGluZSA9IGxlYXZlQnRuTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSlcbiAgICAgICAgbGVhdmVPdXRsaW5lLmNvbG9yID0gY2MuY29sb3IoMTAwLCAzMCwgMzApXG4gICAgICAgIGxlYXZlT3V0bGluZS53aWR0aCA9IDJcbiAgICAgICAgbGVhdmVCdG5MYWJlbC5wYXJlbnQgPSBsZWF2ZUJ0bk5vZGVcblxuICAgICAgICBsZWF2ZUJ0bk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfU1RBUlQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbGVhdmVCdG5Ob2RlLnNjYWxlID0gMC45NVxuICAgICAgICB9KVxuICAgICAgICBsZWF2ZUJ0bk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGxlYXZlQnRuTm9kZS5zY2FsZSA9IDFcbiAgICAgICAgICAgIHNlbGYuX2xlYXZlUm9vbSgpXG4gICAgICAgIH0pXG4gICAgICAgIGxlYXZlQnRuTm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9DQU5DRUwsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbGVhdmVCdG5Ob2RlLnNjYWxlID0gMVxuICAgICAgICB9KVxuXG4gICAgICAgIHRoaXMuX3VwZGF0ZVdhaXRpbmdBbmltYXRpb24oKVxuICAgIH0sXG5cbiAgICBfdXBkYXRlV2FpdGluZ1VJOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc1dhaXRpbmdGb3JQbGF5ZXJzKSByZXR1cm5cblxuICAgICAgICB2YXIgY3VycmVudFBsYXllcnMgPSB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aFxuXG4gICAgICAgIGlmIChjdXJyZW50UGxheWVycyA+PSAzKSB7XG4gICAgICAgICAgICB0aGlzLl9oaWRlV2FpdGluZ1VJKClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfdXBkYXRlV2FpdGluZ0FuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICBpZiAoIXRoaXMuX2lzV2FpdGluZ0ZvclBsYXllcnMgfHwgIXRoaXMuX3dhaXRpbmdVSU5vZGUpIHJldHVyblxuICAgICAgICB0aGlzLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuX3VwZGF0ZVdhaXRpbmdBbmltYXRpb24oKVxuICAgICAgICB9LCAxLzYwKVxuICAgIH0sXG4gICAgXG4gICAgX2hpZGVXYWl0aW5nVUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9pc1dhaXRpbmdGb3JQbGF5ZXJzID0gZmFsc2VcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLl93YWl0aW5nVUlOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl93YWl0aW5nVUlOb2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgdGhpcy5fd2FpdGluZ1VJTm9kZSA9IG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9LFxuICAgIFxuICAgIF9sZWF2ZVJvb206IGZ1bmN0aW9uKCkge1xuICAgICAgICBcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIGlmIChteWdsb2JhbCAmJiBteWdsb2JhbC5zb2NrZXQpIHtcbiAgICAgICAgICAgIGlmIChteWdsb2JhbC5zb2NrZXQubGVhdmVSb29tKSB7XG4gICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LmxlYXZlUm9vbSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2hpZGVXYWl0aW5nVUkoKVxuICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIilcbiAgICB9LFxuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOOAkOaWsOWinuOAkea4uOaIj+eKtuaAgeaBouWkjeWkhOeQhlxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIOWkhOeQhua4uOaIj+eKtuaAgeaBouWkjeS6i+S7tlxuICAgICAqL1xuICAgIF9vbkdhbWVTdGF0ZVJlc3RvcmVkOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDnjqnlrrboioLngrnnmoTnirbmgIFcbiAgICAgICAgaWYgKGRhdGEucGxheWVycykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLnBsYXllck5vZGVMaXN0W2ldXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vZGVTY3JpcHQgPSBub2RlLmdldENvbXBvbmVudChcInBsYXllcl9ub2RlXCIpXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlU2NyaXB0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmn6Xmib7lr7nlupTnmoTnjqnlrrbmlbDmja5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGF0YS5wbGF5ZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSBkYXRhLnBsYXllcnNbal1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocC5pZCA9PT0gbm9kZVNjcmlwdC5hY2NvdW50aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5pu05paw546p5a6254q25oCBXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInBsYXllcl9zdGF0ZV91cGRhdGVcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGU6IHAuc3RhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXJkc19jb3VudDogcC5jYXJkc19jb3VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzX2xhbmRsb3JkOiBwLmlzX2xhbmRsb3JkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDpmpDol48gZ2FtZWJlZm9yZVVJXG4gICAgICAgIHZhciBnYW1lYmVmb3JlX25vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJnYW1lYmVmb3JlVUlcIilcbiAgICAgICAgaWYgKGdhbWViZWZvcmVfbm9kZSkge1xuICAgICAgICAgICAgZ2FtZWJlZm9yZV9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOaYvuekuiBnYW1laW5nVUlcbiAgICAgICAgdmFyIGdhbWVpbmdfbm9kZSA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcImdhbWVpbmdVSVwiKVxuICAgICAgICBpZiAoZ2FtZWluZ19ub2RlKSB7XG4gICAgICAgICAgICBnYW1laW5nX25vZGUuYWN0aXZlID0gdHJ1ZVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDlpITnkIbnjqnlrrbmjonnur/pgJrnn6VcbiAgICAgKi9cbiAgICBfb25QbGF5ZXJPZmZsaW5lOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIFxuICAgICAgICAvLyDpgJrnn6XmiYDmnInnjqnlrrboioLngrnmm7TmlrDnirbmgIFcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGVTY3JpcHQgPSBub2RlLmdldENvbXBvbmVudChcInBsYXllcl9ub2RlXCIpXG4gICAgICAgICAgICAgICAgaWYgKG5vZGVTY3JpcHQgJiYgbm9kZVNjcmlwdC5hY2NvdW50aWQgPT09IGRhdGEucGxheWVyX2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInBsYXllcl9zdGF0ZV91cGRhdGVcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGU6IFwib2ZmbGluZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dDogZGF0YS50aW1lb3V0XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDlpITnkIbnjqnlrrbkuIrnur/pgJrnn6VcbiAgICAgKi9cbiAgICBfb25QbGF5ZXJPbmxpbmU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIOmAmuefpeaJgOacieeOqeWutuiKgueCueabtOaWsOeKtuaAgVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGxheWVyTm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZVNjcmlwdCA9IG5vZGUuZ2V0Q29tcG9uZW50KFwicGxheWVyX25vZGVcIilcbiAgICAgICAgICAgICAgICBpZiAobm9kZVNjcmlwdCAmJiBub2RlU2NyaXB0LmFjY291bnRpZCA9PT0gZGF0YS5wbGF5ZXJfaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5lbWl0KFwicGxheWVyX3N0YXRlX3VwZGF0ZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZTogXCJvbmxpbmVcIlxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn0pO1xuIl19