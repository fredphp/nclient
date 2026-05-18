
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
    }.bind(this)); // 🔧【新增】监听玩家离开事件

    myglobal.socket.onPlayerLeft(function (data) {
      console.log("👋 [gameScene] 收到玩家离开通知:", JSON.stringify(data));

      this._onPlayerLeft(data);
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
    }.bind(this)); // 🔧【新增】监听重新发牌（所有人都不叫地主）

    myglobal.socket.onRestartGame(function (data) {
      console.log("🔄 [gameScene] 收到重新发牌消息，清理玩家节点的抢地主/不抢图标"); // 清理所有玩家节点的抢地主/不抢图标

      for (var i = 0; i < this.playerNodeList.length; i++) {
        var node = this.playerNodeList[i];

        if (node) {
          node.emit("clear_rob_state_event");
        }
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
    }.bind(this)); // ============================================================
    // 【新增】竞技场等待UI相关事件监听
    // ============================================================
    // 监听竞技场等待进度更新

    myglobal.socket.onTournamentWaitProgress(function (data) {
      this._onArenaWaitProgress(data);
    }.bind(this)); // 监听竞技场轮次晋级

    myglobal.socket.onTournamentRoundAdvance(function (data) {
      this._onArenaRoundAdvance(data);
    }.bind(this)); // 监听竞技场最终榜单

    myglobal.socket.onTournamentFinalRank(function (data) {
      this._onArenaFinalRank(data);
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
    } // 🔧【修复】使用字符串比较，避免类型不匹配问题


    var targetAccountId = String(accountid || "");

    for (var i = 0; i < this.playerNodeList.length; i++) {
      var node = this.playerNodeList[i];

      if (node) {
        var node_script = node.getComponent("player_node"); // 🔧【修复】使用字符串比较，确保类型一致

        if (node_script && String(node_script.accountid || "") === targetAccountId) {
          if (node_script.seat_index === undefined || node_script.seat_index === null) {
            console.error("无效的 seat_index");
            return null;
          }

          if (!this.players_seat_pos.children || !this.players_seat_pos.children[node_script.seat_index]) {
            console.error("座位节点不存在，seat_index:", node_script.seat_index);
            return null;
          }

          var seat_node = this.players_seat_pos.children[node_script.seat_index]; // 🔧【修复】检查 seat_node 是否存在

          if (!seat_node) {
            console.error("seat_node 为空，seat_index:", node_script.seat_index);
            return null;
          }

          var index_name = "cardsoutzone" + node_script.seat_index;
          var out_card_node = seat_node.getChildByName(index_name); // 🔧【调试】输出找到的出牌区域

          console.log("🃏 [getUserOutCardPosByAccount] accountid:", accountid, "seat_index:", node_script.seat_index, "out_card_node:", out_card_node ? out_card_node.name : "null");
          return out_card_node;
        }
      }
    } // 🔧【调试】未找到玩家节点


    console.warn("🃏 [getUserOutCardPosByAccount] 未找到玩家节点, accountid:", accountid, "playerNodeList.length:", this.playerNodeList.length);
    return null;
  },
  _processRoomData: function _processRoomData(result, myglobal, isopen_sound) {
    console.log("🎮 [_processRoomData] 接收到的数据:", JSON.stringify(result));
    var seatid = result.seatindex || 1;
    this.playerdata_list_pos = [];
    this.setPlayerSeatPos(seatid);
    var playerdata_list = result.playerdata || [];
    var roomid = result.roomid || result.room_code || result.roomCode || "WAITING"; // 🔧【新增】检查是否是竞技场模式

    var isArenaMode = result.room_category === 2; // 🔧【优化】竞技场模式下，优先使用预加载的数据

    if (isArenaMode && myglobal.arenaMatchData) {
      console.log("🏟️ [_processRoomData] 使用预加载的竞技场数据:", JSON.stringify(myglobal.arenaMatchData)); // 使用预加载的数据补充缺失字段

      if (!result.base_score && myglobal.arenaMatchData.base_score) {
        result.base_score = myglobal.arenaMatchData.base_score;
      }

      if (!result.multiplier && myglobal.arenaMatchData.multiplier) {
        result.multiplier = myglobal.arenaMatchData.multiplier;
      }

      if (!result.match_rounds && myglobal.arenaMatchData.match_rounds) {
        result.match_rounds = myglobal.arenaMatchData.match_rounds;
      }

      if (!result.match_duration && myglobal.arenaMatchData.match_duration) {
        result.match_duration = myglobal.arenaMatchData.match_duration;
      }

      if (!result.initial_arena_gold && myglobal.arenaMatchData.initial_arena_gold) {
        result.initial_arena_gold = myglobal.arenaMatchData.initial_arena_gold;
      }
    }

    if (isArenaMode) {
      console.log("🏟️ [_processRoomData] 竞技场模式: room_category=2, playerdata数量=" + playerdata_list.length + ", 期号=" + result.period_no);
    } // 🔧【修复】保存房间类型到实例变量，供 player_node 使用


    this._roomCategory = result.room_category || 1;
    this._isArenaMode = isArenaMode;
    this._periodNo = result.period_no || ""; // 🔧【新增】保存期号
    // 🔧【新增】保存底分和倍数

    this._baseScore = result.base_score || 1;
    this._multiplier = result.multiplier || 1;
    this._matchRounds = result.match_rounds || 1;
    this._initialArenaGold = result.initial_arena_gold || 1000;
    this._playerdataList = playerdata_list;

    if (this.roomid_label) {
      this.roomid_label.string = "房间号:" + roomid;
    } else {
      console.error("🎮 [游戏场景] roomid_label 未绑定！");
    } // 🔧【优化】更新底分和倍数标签


    if (this.di_label && result.base_score) {
      this.di_label.string = "底:" + result.base_score;
    }

    if (this.beishu_label && result.multiplier) {
      this.beishu_label.string = "倍数:" + result.multiplier;
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
      console.log("🏟️ [_processRoomData] 竞技场模式：不显示等待玩家UI，玩家数量=" + playerdata_list.length); // 竞技场模式下所有玩家应该已经准备好，直接等待游戏开始
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
  },

  /**
   * 🔧【新增】处理玩家离开通知
   * 当收到服务端的 player_left 消息时，移除对应的玩家节点
   */
  _onPlayerLeft: function _onPlayerLeft(data) {
    console.log("👋 [_onPlayerLeft] 处理玩家离开, player_id:", data.player_id, "player_name:", data.player_name);
    var playerId = data.player_id;

    if (!playerId) {
      console.warn("👋 [_onPlayerLeft] 缺少 player_id");
      return;
    } // 从 playerNodeList 中查找并移除玩家节点


    var removedIndex = -1;

    for (var i = 0; i < this.playerNodeList.length; i++) {
      var node = this.playerNodeList[i];

      if (node) {
        var nodeScript = node.getComponent("player_node");

        if (nodeScript && nodeScript.accountid === playerId) {
          console.log("👋 [_onPlayerLeft] 找到离开的玩家节点，准备移除:", playerId); // 销毁节点

          node.destroy(); // 从列表中移除

          this.playerNodeList.splice(i, 1);
          removedIndex = i;
          break;
        }
      }
    } // 从 _playerdataList 中移除玩家数据


    if (this._playerdataList) {
      for (var i = 0; i < this._playerdataList.length; i++) {
        if (this._playerdataList[i].accountid === playerId) {
          this._playerdataList.splice(i, 1);

          console.log("👋 [_onPlayerLeft] 从玩家数据列表中移除:", playerId);
          break;
        }
      }
    } // 如果当前玩家数量不足3人，显示等待UI


    var currentCount = this.playerNodeList.length;
    console.log("👋 [_onPlayerLeft] 当前玩家数量:", currentCount); // 检查是否是竞技场模式

    var isArenaMode = this._isArenaMode || false;

    if (!isArenaMode && currentCount < 3 && !this._isWaitingForPlayers) {
      // 普通模式下，玩家离开后显示等待UI
      var roomCode = this._currentRoomCode || "";

      if (this.roomid_label) {
        roomCode = this.roomid_label.string.replace("房间号:", "");
      }

      this._showWaitingUI(3 - currentCount, roomCode);
    } // 更新房主信息（如果离开的是房主）


    var myglobal = window.myglobal;

    if (myglobal && myglobal.playerData) {
      // 服务端会在 player_left 消息中包含新的房主ID（如果需要）
      if (data.new_creator_id) {
        myglobal.playerData.housemanageid = data.new_creator_id;
        console.log("👋 [_onPlayerLeft] 新房主ID:", data.new_creator_id);
      }
    }
  },
  // ============================================================
  // 【新增】竞技场等待UI - 在游戏场景中显示
  // 仅用于竞技场模式（room_category === 2）
  // 普通场不使用此等待界面
  // ============================================================

  /**
   * 显示竞技场等待UI
   * @param {Object} data - { period_no, round, total_rounds, finished_tables, total_tables, status }
   */
  _showArenaWaitingUI: function _showArenaWaitingUI(data) {
    // 仅在竞技场模式下显示
    if (!this._isArenaMode) {
      console.log("🏟️ [_showArenaWaitingUI] 非竞技场模式，不显示等待UI");
      return;
    }

    console.log("🏟️ [_showArenaWaitingUI] 显示竞技场等待UI:", JSON.stringify(data));
    var self = this; // 先隐藏已有的等待UI

    this._hideArenaWaitingUI(); // 获取画布尺寸


    var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
    var screenHeight = canvas ? canvas.designResolution.height : 720;
    var screenWidth = canvas ? canvas.designResolution.width : 1280; // 创建等待UI容器

    var waitingNode = new cc.Node("ArenaWaitingUI");
    waitingNode.setContentSize(cc.size(screenWidth, screenHeight));
    waitingNode.anchorX = 0.5;
    waitingNode.anchorY = 0.5;
    waitingNode.x = 0;
    waitingNode.y = 0;
    waitingNode.zIndex = 2000; // 确保在最上层

    waitingNode.parent = this.node;
    this._arenaWaitingUINode = waitingNode; // 存储数据

    this._arenaWaitingData = {
      periodNo: data.period_no || "",
      round: data.round || 1,
      totalRounds: data.total_rounds || 1,
      finishedTables: data.finished_tables || 0,
      totalTables: data.total_tables || 0,
      status: data.status || "WAITING"
    }; // ========== 1. 半透明背景 ==========

    var bgNode = new cc.Node("Bg");
    var bgGraphics = bgNode.addComponent(cc.Graphics);
    bgGraphics.fillColor = cc.color(0, 0, 0, 180);
    bgGraphics.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
    bgGraphics.fill();
    bgNode.parent = waitingNode; // ========== 2. 中央卡片背景 ==========

    var cardWidth = 400;
    var cardHeight = 280;
    var cardNode = new cc.Node("Card");
    cardNode.setContentSize(cc.size(cardWidth, cardHeight));
    cardNode.anchorX = 0.5;
    cardNode.anchorY = 0.5;
    cardNode.x = 0;
    cardNode.y = 0;
    var cardBg = cardNode.addComponent(cc.Graphics);
    cardBg.fillColor = cc.color(30, 60, 100, 230);
    cardBg.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 15);
    cardBg.fill();
    cardBg.strokeColor = cc.color(255, 215, 0);
    cardBg.lineWidth = 3;
    cardBg.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 15);
    cardBg.stroke();
    cardNode.parent = waitingNode; // ========== 3. 标题 ==========

    var titleNode = new cc.Node("Title");
    titleNode.y = cardHeight / 2 - 35;
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = "🏆 竞技场等待中";
    titleLabel.fontSize = 28;
    titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    titleNode.color = cc.color(255, 215, 0);
    var titleOutline = titleNode.addComponent(cc.LabelOutline);
    titleOutline.color = cc.color(0, 0, 0);
    titleOutline.width = 2;
    titleNode.parent = cardNode; // ========== 4. 期号标签 ==========

    this._arenaPeriodLabel = new cc.Node("PeriodLabel");
    this._arenaPeriodLabel.y = cardHeight / 2 - 80;

    var periodLabel = this._arenaPeriodLabel.addComponent(cc.Label);

    periodLabel.string = "第 " + (data.period_no || "--") + " 期";
    periodLabel.fontSize = 20;
    periodLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    this._arenaPeriodLabel.color = cc.color(200, 200, 220);
    this._arenaPeriodLabel.parent = cardNode; // ========== 5. 轮次标签 ==========

    this._arenaRoundLabel = new cc.Node("RoundLabel");
    this._arenaRoundLabel.y = cardHeight / 2 - 110;

    var roundLabel = this._arenaRoundLabel.addComponent(cc.Label);

    roundLabel.string = "第 " + (data.round || 1) + " 轮 / 共 " + (data.total_rounds || 1) + " 轮";
    roundLabel.fontSize = 18;
    roundLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    this._arenaRoundLabel.color = cc.color(180, 180, 200);
    this._arenaRoundLabel.parent = cardNode; // ========== 5.5 金币显示 ==========

    this._arenaCoinLabel = new cc.Node("CoinLabel");
    this._arenaCoinLabel.y = cardHeight / 2 - 140;

    var coinLabel = this._arenaCoinLabel.addComponent(cc.Label); // 获取当前玩家的竞技金币


    var myMatchCoin = this._getMyMatchCoin ? this._getMyMatchCoin() : 0;
    coinLabel.string = "💰 当前金币: " + myMatchCoin;
    coinLabel.fontSize = 18;
    coinLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    this._arenaCoinLabel.color = cc.color(255, 215, 0);
    this._arenaCoinLabel.parent = cardNode; // ========== 6. 进度条 ==========

    this._arenaProgressBar = new cc.Node("ProgressBar");

    this._arenaProgressBar.setContentSize(cc.size(320, 20));

    this._arenaProgressBar.y = 0; // 进度条背景

    var progressBg = this._arenaProgressBar.addComponent(cc.Graphics);

    progressBg.fillColor = cc.color(50, 50, 70, 200);
    progressBg.roundRect(-160, -10, 320, 20, 5);
    progressBg.fill();
    this._arenaProgressBar.parent = cardNode; // 进度条填充（初始为0）

    this._arenaProgressFill = new cc.Node("ProgressFill");
    this._arenaProgressFill.y = 0;

    var fillGraphics = this._arenaProgressFill.addComponent(cc.Graphics);

    this._arenaProgressFill._graphics = fillGraphics;
    this._arenaProgressFill.parent = cardNode; // ========== 7. 进度文字 ==========

    this._arenaProgressLabel = new cc.Node("ProgressLabel");
    this._arenaProgressLabel.y = -40;

    var progressLabel = this._arenaProgressLabel.addComponent(cc.Label);

    progressLabel.string = (data.finished_tables || 0) + " / " + (data.total_tables || 0);
    progressLabel.fontSize = 24;
    progressLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    this._arenaProgressLabel.color = cc.color(255, 255, 255);
    this._arenaProgressLabel.parent = cardNode; // ========== 8. 状态提示 ==========

    this._arenaStatusLabel = new cc.Node("StatusLabel");
    this._arenaStatusLabel.y = -80;

    var statusLabel = this._arenaStatusLabel.addComponent(cc.Label);

    statusLabel.string = "正在等待其他玩家完成...";
    statusLabel.fontSize = 16;
    statusLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    this._arenaStatusLabel.color = cc.color(150, 200, 255);
    this._arenaStatusLabel.parent = cardNode; // ========== 9. Loading动画（旋转扑克牌）==========

    this._arenaLoadingNode = new cc.Node("LoadingNode");
    this._arenaLoadingNode.y = -120;

    var loadingSprite = this._arenaLoadingNode.addComponent(cc.Sprite); // 尝试加载扑克牌图片


    cc.resources.load('UI/card_back', cc.SpriteFrame, function (err, spriteFrame) {
      if (!err && spriteFrame && loadingSprite) {
        loadingSprite.spriteFrame = spriteFrame;
      }
    });
    this._arenaLoadingNode.scale = 0.5;
    this._arenaLoadingNode.parent = cardNode; // 启动旋转动画

    this._startArenaLoadingAnimation(); // 更新UI


    this._updateArenaWaitingUI(data);

    console.log("🏟️ [_showArenaWaitingUI] 竞技场等待UI已创建");
  },

  /**
   * 隐藏竞技场等待UI
   */
  _hideArenaWaitingUI: function _hideArenaWaitingUI() {
    // 停止动画
    this._stopArenaLoadingAnimation(); // 销毁节点


    if (this._arenaWaitingUINode) {
      this._arenaWaitingUINode.destroy();

      this._arenaWaitingUINode = null;
    } // 清理引用


    this._arenaPeriodLabel = null;
    this._arenaRoundLabel = null;
    this._arenaCoinLabel = null;
    this._arenaProgressBar = null;
    this._arenaProgressFill = null;
    this._arenaProgressLabel = null;
    this._arenaStatusLabel = null;
    this._arenaLoadingNode = null;
    this._arenaWaitingData = null;
    console.log("🏟️ [_hideArenaWaitingUI] 竞技场等待UI已隐藏");
  },

  /**
   * 更新竞技场等待UI
   */
  _updateArenaWaitingUI: function _updateArenaWaitingUI(data) {
    if (!this._arenaWaitingUINode) return; // 更新存储的数据

    if (data) {
      this._arenaWaitingData = {
        periodNo: data.period_no || this._arenaWaitingData.periodNo,
        round: data.round || this._arenaWaitingData.round,
        totalRounds: data.total_rounds || this._arenaWaitingData.totalRounds,
        finishedTables: data.finished_tables || this._arenaWaitingData.finishedTables,
        totalTables: data.total_tables || this._arenaWaitingData.totalTables,
        status: data.status || this._arenaWaitingData.status
      };
    }

    var d = this._arenaWaitingData; // 更新期号

    if (this._arenaPeriodLabel) {
      var periodLabel = this._arenaPeriodLabel.getComponent(cc.Label);

      if (periodLabel) {
        periodLabel.string = "第 " + (d.periodNo || "--") + " 期";
      }
    } // 更新轮次


    if (this._arenaRoundLabel) {
      var roundLabel = this._arenaRoundLabel.getComponent(cc.Label);

      if (roundLabel) {
        roundLabel.string = "第 " + d.round + " 轮 / 共 " + d.totalRounds + " 轮";
      }
    } // 更新进度文字


    if (this._arenaProgressLabel) {
      var progressLabel = this._arenaProgressLabel.getComponent(cc.Label);

      if (progressLabel) {
        progressLabel.string = d.finishedTables + " / " + d.totalTables;
      }
    } // 更新进度条


    if (this._arenaProgressFill && d.totalTables > 0) {
      var progress = Math.min(d.finishedTables / d.totalTables, 1.0);
      var barWidth = 320 * progress;
      var graphics = this._arenaProgressFill._graphics;

      if (graphics) {
        graphics.clear();

        if (barWidth > 0) {
          graphics.fillColor = cc.color(100, 200, 100, 255);
          graphics.roundRect(-160, -8, barWidth, 16, 3);
          graphics.fill();
        }
      }
    } // 更新状态提示


    if (this._arenaStatusLabel) {
      var statusLabel = this._arenaStatusLabel.getComponent(cc.Label);

      if (statusLabel) {
        if (d.finishedTables >= d.totalTables) {
          statusLabel.string = "全部完成，即将进入下一轮...";
          this._arenaStatusLabel.color = cc.color(100, 255, 100);
        } else {
          var remaining = d.totalTables - d.finishedTables;
          statusLabel.string = "正在等待其他玩家完成... (剩余 " + remaining + " 桌)";
          this._arenaStatusLabel.color = cc.color(150, 200, 255);
        }
      }
    }
  },

  /**
   * 启动Loading旋转动画
   */
  _startArenaLoadingAnimation: function _startArenaLoadingAnimation() {
    if (!this._arenaLoadingNode) return;

    this._stopArenaLoadingAnimation();

    var self = this;
    this._arenaLoadingAnimation = true;

    var rotate = function rotate() {
      if (!self._arenaLoadingAnimation || !self._arenaLoadingNode) return;
      self._arenaLoadingNode.angle += 3;
      setTimeout(rotate, 16);
    };

    rotate();
  },

  /**
   * 停止Loading旋转动画
   */
  _stopArenaLoadingAnimation: function _stopArenaLoadingAnimation() {
    this._arenaLoadingAnimation = false;

    if (this._arenaLoadingNode) {
      this._arenaLoadingNode.angle = 0;
    }
  },

  /**
   * 获取当前玩家的竞技金币
   * 🔧【新增】用于等待界面显示金币
   */
  _getMyMatchCoin: function _getMyMatchCoin() {
    var myglobal = window.myglobal;

    if (!myglobal || !myglobal.playerData) {
      return 0;
    } // 从玩家数据中获取竞技金币
    // 在游戏场景中，玩家的竞技金币存储在 myglobal.playerData.match_coin 或通过 player_node 获取


    var matchCoin = 0; // 方式1：从 player_node_prefabs 获取

    if (this.player_node_prefabs && this.player_node_prefabs.length > 0) {
      for (var i = 0; i < this.player_node_prefabs.length; i++) {
        var playerNode = this.player_node_prefabs[i];

        if (playerNode && playerNode.player_data) {
          // 找到当前玩家
          var playerData = playerNode.player_data;
          var myPlayerId = myglobal.playerData.accountID || myglobal.playerData.uniqueID;

          if (playerData.accountid === myPlayerId || playerData.accountid === String(myPlayerId)) {
            matchCoin = playerData.match_coin || playerData.arena_gold || 0;
            break;
          }
        }
      }
    } // 方式2：从全局数据获取


    if (matchCoin === 0 && myglobal.arenaMatchData) {
      matchCoin = myglobal.arenaMatchData.myMatchCoin || 0;
    }

    return matchCoin;
  },

  /**
   * 处理竞技场等待进度更新
   */
  _onArenaWaitProgress: function _onArenaWaitProgress(data) {
    console.log("🏟️ [_onArenaWaitProgress] 收到进度更新:", JSON.stringify(data)); // 检查期号是否匹配

    if (this._arenaWaitingData && this._arenaWaitingData.periodNo && data.period_no && data.period_no !== this._arenaWaitingData.periodNo) {
      return;
    } // 如果等待UI不存在，先创建


    if (!this._arenaWaitingUINode && this._isArenaMode) {
      this._showArenaWaitingUI(data);
    } else {
      this._updateArenaWaitingUI(data);
    }
  },

  /**
   * 处理竞技场轮次晋级
   */
  _onArenaRoundAdvance: function _onArenaRoundAdvance(data) {
    console.log("🏟️ [_onArenaRoundAdvance] 进入下一轮:", JSON.stringify(data)); // 检查期号是否匹配

    if (this._arenaWaitingData && this._arenaWaitingData.periodNo && data.period_no && data.period_no !== this._arenaWaitingData.periodNo) {
      return;
    } // 更新轮次信息


    if (this._arenaWaitingData) {
      this._arenaWaitingData.round = data.new_round || this._arenaWaitingData.round + 1;
      this._arenaWaitingData.totalRounds = data.total_rounds || this._arenaWaitingData.totalRounds;
      this._arenaWaitingData.finishedTables = 0;
    } // 更新UI


    if (this._arenaRoundLabel) {
      var roundLabel = this._arenaRoundLabel.getComponent(cc.Label);

      if (roundLabel) {
        roundLabel.string = "第 " + (data.new_round || 1) + " 轮 / 共 " + (data.total_rounds || 1) + " 轮"; // 播放放大动画

        var scaleUp = cc.scaleTo(0.2, 1.3);
        var scaleDown = cc.scaleTo(0.2, 1.0);
        var sequence = cc.sequence(scaleUp, scaleDown);

        this._arenaRoundLabel.runAction(sequence);
      }
    } // 更新状态提示


    if (this._arenaStatusLabel) {
      var statusLabel = this._arenaStatusLabel.getComponent(cc.Label);

      if (statusLabel) {
        statusLabel.string = data.message || "晋级成功！正在匹配下一轮...";
        this._arenaStatusLabel.color = cc.color(100, 255, 100);
      }
    }
  },

  /**
   * 处理竞技场最终榜单
   */
  _onArenaFinalRank: function _onArenaFinalRank(data) {
    console.log("🏟️ [_onArenaFinalRank] 比赛结束，显示最终榜单:", JSON.stringify(data)); // 检查期号是否匹配

    if (this._arenaWaitingData && this._arenaWaitingData.periodNo && data.period_no && data.period_no !== this._arenaWaitingData.periodNo) {
      return;
    } // 停止动画


    this._stopArenaLoadingAnimation(); // 隐藏等待UI


    this._hideArenaWaitingUI(); // 显示最终榜单弹窗


    this._showArenaFinalRankDialog(data);
  },

  /**
   * 显示最终榜单弹窗
   * 🔧【修复】直接创建弹窗UI，避免依赖外部组件类注册问题
   */
  _showArenaFinalRankDialog: function _showArenaFinalRankDialog(data) {
    var self = this;
    console.log("🏆 [_showArenaFinalRankDialog] 显示完整排行榜弹窗, data:", JSON.stringify(data)); // 🔧【修复】直接创建弹窗UI，不使用 addComponent("TournamentFinalRankDialog")
    // 因为 Cocos 在运行时可能无法正确找到注册的类

    var dialogNode = this._createFinalRankDialog(data);

    if (!dialogNode) {
      console.error("🏆 [_showArenaFinalRankDialog] 创建弹窗失败");
      return;
    } // 添加到当前场景


    this.node.addChild(dialogNode);
    dialogNode.zIndex = 3000;
    this._arenaFinalRankDialog = dialogNode;
    console.log("🏆 [_showArenaFinalRankDialog] 完整排行榜弹窗已创建");
  },

  /**
   * 🔧【新增】创建最终榜单弹窗UI
   * 直接创建UI，避免组件类注册问题
   */
  _createFinalRankDialog: function _createFinalRankDialog(data) {
    var screenWidth = 1280;
    var screenHeight = 720; // 创建弹窗容器

    var dialogNode = new cc.Node("TournamentFinalRankDialog");
    dialogNode.setPosition(0, 0);
    dialogNode.setContentSize(screenWidth, screenHeight); // 半透明背景遮罩

    var bgNode = new cc.Node("Background");
    bgNode.setContentSize(screenWidth, screenHeight);
    var bgGraphics = bgNode.addComponent(cc.Graphics);
    bgGraphics.fillColor = new cc.Color(0, 0, 0, 180);
    bgGraphics.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
    bgGraphics.fill();
    bgNode.parent = dialogNode; // 主弹窗容器

    var dialogContainer = new cc.Node("DialogContainer");
    dialogContainer.setContentSize(1000, 650);
    dialogContainer.setPosition(0, 0); // 弹窗背景

    var dialogBg = new cc.Node("DialogBg");
    var dialogBgGraphics = dialogBg.addComponent(cc.Graphics);
    dialogBgGraphics.fillColor = new cc.Color(25, 35, 60, 250);
    dialogBgGraphics.roundRect(-500, -325, 1000, 650, 25);
    dialogBgGraphics.fill();
    dialogBgGraphics.strokeColor = new cc.Color(180, 140, 60);
    dialogBgGraphics.lineWidth = 4;
    dialogBgGraphics.roundRect(-500, -325, 1000, 650, 25);
    dialogBgGraphics.stroke();
    dialogBg.parent = dialogContainer;
    dialogContainer.parent = dialogNode; // 标题

    var titleNode = new cc.Node("Title");
    titleNode.setPosition(0, 270);
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = "🏆 比赛结束 🏆";
    titleLabel.fontSize = 40;
    titleLabel.lineHeight = 48;
    titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    titleNode.color = new cc.Color(255, 215, 0);
    var titleOutline = titleNode.addComponent(cc.LabelOutline);
    titleOutline.color = new cc.Color(100, 60, 0);
    titleOutline.width = 3;
    titleNode.parent = dialogContainer; // 期号和参赛人数

    var periodNo = data.period_no || "---";
    var totalPlayers = data.total_players || 0;
    var periodNode = new cc.Node("PeriodNo");
    periodNode.setPosition(0, 220);
    var periodLabel = periodNode.addComponent(cc.Label);
    periodLabel.string = "第" + periodNo + "期赛事结束  共" + totalPlayers + "人参赛";
    periodLabel.fontSize = 24;
    periodLabel.lineHeight = 30;
    periodLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    periodNode.color = new cc.Color(200, 200, 220);
    periodNode.parent = dialogContainer; // TOP3 领奖台

    var top3 = data.top3 || [];
    var podiumY = 40;
    var spacingX = 280; // 冠军

    if (top3.length >= 1) {
      this._createPodiumItem(dialogContainer, top3[0], 1, 0, podiumY + 40, 1.15);
    } // 亚军


    if (top3.length >= 2) {
      this._createPodiumItem(dialogContainer, top3[1], 2, -spacingX, podiumY, 1.0);
    } // 季军


    if (top3.length >= 3) {
      this._createPodiumItem(dialogContainer, top3[2], 3, spacingX, podiumY, 1.0);
    } // 我的排名区域


    var myRank = data.my_rank || 0;
    var myCoin = data.my_match_coin || 0;
    var myRankContainer = new cc.Node("MyRankContainer");
    myRankContainer.setPosition(0, -200);
    myRankContainer.setContentSize(600, 50);
    var myRankBg = new cc.Node("Bg");
    var myRankBgGraphics = myRankBg.addComponent(cc.Graphics);
    myRankBgGraphics.fillColor = new cc.Color(40, 50, 80, 230);
    myRankBgGraphics.roundRect(-300, -25, 600, 50, 12);
    myRankBgGraphics.fill();
    myRankBgGraphics.strokeColor = new cc.Color(100, 120, 160);
    myRankBgGraphics.lineWidth = 2;
    myRankBgGraphics.roundRect(-300, -25, 600, 50, 12);
    myRankBgGraphics.stroke();
    myRankBg.parent = myRankContainer;
    var myRankLabel = new cc.Node("MyRankLabel");
    myRankLabel.setPosition(-140, 0);
    var myRankText = myRankLabel.addComponent(cc.Label);
    myRankText.string = myRank > 0 ? "我的排名：第" + myRank + "名" : "我的排名：未上榜";
    myRankText.fontSize = 22;
    myRankText.lineHeight = 28;
    myRankText.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    myRankLabel.color = new cc.Color(100, 200, 255);
    myRankLabel.parent = myRankContainer;
    var myCoinLabel = new cc.Node("MyCoinLabel");
    myCoinLabel.setPosition(140, 0);
    var myCoinText = myCoinLabel.addComponent(cc.Label);
    myCoinText.string = "比赛金币：" + myCoin;
    myCoinText.fontSize = 22;
    myCoinText.lineHeight = 28;
    myCoinText.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    myCoinLabel.color = new cc.Color(255, 200, 100);
    myCoinLabel.parent = myRankContainer;
    myRankContainer.parent = dialogContainer; // 确认按钮

    var confirmBtn = new cc.Node("ConfirmBtn");
    confirmBtn.setPosition(0, -270);
    confirmBtn.setContentSize(200, 50);
    var btnBg = confirmBtn.addComponent(cc.Graphics);
    btnBg.fillColor = new cc.Color(80, 160, 80);
    btnBg.roundRect(-100, -25, 200, 50, 12);
    btnBg.fill();
    btnBg.strokeColor = new cc.Color(120, 200, 120);
    btnBg.lineWidth = 3;
    btnBg.roundRect(-100, -25, 200, 50, 12);
    btnBg.stroke();
    var btnLabel = new cc.Node("Label");
    var btnLabelText = btnLabel.addComponent(cc.Label);
    btnLabelText.string = "确 定";
    btnLabelText.fontSize = 26;
    btnLabelText.lineHeight = 32;
    btnLabelText.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    btnLabel.color = new cc.Color(255, 255, 255);
    var btnOutline = btnLabel.addComponent(cc.LabelOutline);
    btnOutline.color = new cc.Color(30, 80, 30);
    btnOutline.width = 2;
    btnLabel.parent = confirmBtn;
    var btn = confirmBtn.addComponent(cc.Button);
    confirmBtn.on('click', function () {
      console.log("🏆 [TournamentFinalRank] 点击确认，返回大厅");
      dialogNode.destroy();
      cc.director.loadScene("hallScene");
    }, this);
    confirmBtn.parent = dialogContainer;
    return dialogNode;
  },

  /**
   * 🔧【新增】创建领奖台项目
   */
  _createPodiumItem: function _createPodiumItem(parentNode, playerData, rank, x, y, scale) {
    var node = new cc.Node("PodiumItem_" + rank);
    node.setPosition(x, y);
    node.scale = scale || 1; // 排名标签

    var rankLabelNode = new cc.Node("RankLabel");
    rankLabelNode.setPosition(0, 60);
    var rankLabel = rankLabelNode.addComponent(cc.Label);
    var rankTexts = {
      1: "🥇 冠军",
      2: "🥈 亚军",
      3: "🥉 季军"
    };
    rankLabel.string = rankTexts[rank] || "第" + rank + "名";
    rankLabel.fontSize = 22;
    rankLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    rankLabelNode.color = rank === 1 ? new cc.Color(255, 215, 0) : new cc.Color(200, 200, 220);
    var rankOutline = rankLabelNode.addComponent(cc.LabelOutline);
    rankOutline.color = new cc.Color(50, 50, 80);
    rankOutline.width = 2;
    rankLabelNode.parent = node; // 头像容器

    var avatarSize = rank === 1 ? 70 : 60;
    var avatarContainer = new cc.Node("AvatarContainer");
    avatarContainer.setPosition(0, 0);
    avatarContainer.setContentSize(avatarSize, avatarSize);
    var avatarBg = new cc.Node("AvatarBg");
    var avatarBgGraphics = avatarBg.addComponent(cc.Graphics);
    avatarBgGraphics.fillColor = new cc.Color(60, 70, 100);
    avatarBgGraphics.circle(0, 0, avatarSize / 2 + 2);
    avatarBgGraphics.fill();
    avatarBgGraphics.strokeColor = rank === 1 ? new cc.Color(255, 215, 0) : new cc.Color(150, 150, 180);
    avatarBgGraphics.lineWidth = rank === 1 ? 3 : 2;
    avatarBgGraphics.circle(0, 0, avatarSize / 2 + 2);
    avatarBgGraphics.stroke();
    avatarBg.parent = avatarContainer; // 🔧【修复】不使用 Mask 组件，直接显示头像（避免遮罩导致的不显示问题）
    // 头像精灵（直接放在容器内）

    var avatarSpriteNode = new cc.Node("AvatarSprite");
    avatarSpriteNode.setPosition(0, 0);
    avatarSpriteNode.setContentSize(avatarSize - 4, avatarSize - 4);
    var avatarSprite = avatarSpriteNode.addComponent(cc.Sprite);
    avatarSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM; // 🔧【关键修复】显式设置节点颜色为白色，确保图片可见

    avatarSpriteNode.color = new cc.Color(255, 255, 255);
    avatarSpriteNode.parent = avatarContainer;
    console.log("🖼️ [_createPodiumItem] 创建头像节点, rank:", rank, "avatarUrl:", playerData.avatar); // 加载头像（🔧【修复】机器人也使用服务端传来的正确头像）

    this._loadAvatarForPodium(avatarSprite, avatarSpriteNode, playerData.avatar, playerData.is_robot, avatarSize - 4);

    avatarContainer.parent = node; // 昵称 - 直接使用真实昵称，机器人也一样

    var nameLabelNode = new cc.Node("NameLabel");
    nameLabelNode.setPosition(0, -55);
    nameLabelNode.setContentSize(120, 30);
    var nameLabel = nameLabelNode.addComponent(cc.Label);
    var displayName = playerData.player_name || "玩家"; // 🔧【修复】机器人也使用真实昵称，不做特殊处理
    // 🔧【修复】昵称过长时截断显示，超出部分用"..."

    var maxNameLength = 6; // 最多显示6个字符

    if (displayName.length > maxNameLength) {
      displayName = displayName.substring(0, maxNameLength) + "...";
    }

    nameLabel.string = displayName;
    nameLabel.fontSize = rank === 1 ? 20 : 18;
    nameLabel.lineHeight = 24;
    nameLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    nameLabel.overflow = cc.Label.Overflow.CLAMP;
    nameLabelNode.color = new cc.Color(255, 255, 255);
    var nameOutline = nameLabelNode.addComponent(cc.LabelOutline);
    nameOutline.color = new cc.Color(30, 30, 50);
    nameOutline.width = 1;
    nameLabelNode.parent = node; // 金币

    var coinLabelNode = new cc.Node("CoinLabel");
    coinLabelNode.setPosition(0, -85);
    var coinLabel = coinLabelNode.addComponent(cc.Label);
    coinLabel.string = this._formatMatchCoin(playerData.match_coin || 0) + "金币";
    coinLabel.fontSize = rank === 1 ? 18 : 16;
    coinLabel.lineHeight = 20;
    coinLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    coinLabelNode.color = rank === 1 ? new cc.Color(255, 215, 0) : new cc.Color(255, 200, 100);
    var coinOutline = coinLabelNode.addComponent(cc.LabelOutline);
    coinOutline.color = new cc.Color(80, 50, 0);
    coinOutline.width = 1;
    coinLabelNode.parent = node;
    node.parent = parentNode;
    return node;
  },

  /**
   * 🔧【新增】为领奖台加载头像
   * 🔧【修复】机器人也使用服务端传来的正确头像，不再使用随机本地头像
   * @param {cc.Sprite} sprite - Sprite组件
   * @param {cc.Node} spriteNode - Sprite节点
   * @param {string} avatarUrl - 头像URL
   * @param {boolean} isRobot - 是否机器人
   * @param {number} size - 头像尺寸
   */
  _loadAvatarForPodium: function _loadAvatarForPodium(sprite, spriteNode, avatarUrl, isRobot, size) {
    if (!sprite) {
      console.error("🖼️ [_loadAvatarForPodium] sprite 为空，无法加载头像");
      return;
    }

    console.log("🖼️ [_loadAvatarForPodium] 开始加载头像, URL:", avatarUrl, "isRobot:", isRobot, "size:", size);
    var self = this;
    var nodeSize = size || 60; // 🔧【关键】设置默认状态，确保节点可见

    if (spriteNode) {
      spriteNode.active = true;
      spriteNode.opacity = 255;
      spriteNode.color = new cc.Color(255, 255, 255);
    } // 🔧【修复】统一处理头像加载，不再区分机器人和真人
    // 机器人也使用服务端传来的正确头像URL


    if (!avatarUrl || avatarUrl === "") {
      console.log("🖼️ [_loadAvatarForPodium] 头像URL为空，使用默认头像"); // 头像URL为空时使用默认头像

      cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function (err, spriteFrame) {
        if (!err && spriteFrame && sprite && sprite.isValid) {
          sprite.spriteFrame = spriteFrame;
          console.log("🖼️ [_loadAvatarForPodium] 默认头像设置成功");
        }
      });
      return;
    }

    if (avatarUrl.indexOf("http") === 0 || avatarUrl.indexOf("//") === 0) {
      console.log("🖼️ [_loadAvatarForPodium] 加载远程头像..."); // 🔧【修复】使用 cc.assetManager.loadRemote 加载远程图片

      cc.assetManager.loadRemote(avatarUrl, function (err, texture) {
        if (err) {
          console.error("🖼️ [_loadAvatarForPodium] 加载远程头像失败:", err); // 尝试使用内置头像

          cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function (err2, fallbackSprite) {
            if (!err2 && fallbackSprite && sprite && sprite.isValid) {
              sprite.spriteFrame = fallbackSprite;
              console.log("🖼️ [_loadAvatarForPodium] 使用默认头像");
            }
          });
          return;
        }

        if (!texture) {
          console.error("🖼️ [_loadAvatarForPodium] texture 为空");
          return;
        } // 🔧【关键检查】确保 sprite 组件仍然有效


        if (!sprite || !sprite.isValid) {
          console.warn("🖼️ [_loadAvatarForPodium] sprite 组件已失效，跳过设置");
          return;
        }

        console.log("🖼️ [_loadAvatarForPodium] 远程头像加载成功, texture:", texture.width, "x", texture.height); // 🔧【关键修复】创建 SpriteFrame 并设置

        var spriteFrame = new cc.SpriteFrame(texture); // 设置 spriteFrame

        sprite.spriteFrame = spriteFrame; // 🔧【关键修复】确保节点尺寸正确

        if (spriteNode && spriteNode.isValid) {
          spriteNode.setContentSize(nodeSize, nodeSize);
          spriteNode.opacity = 255;
          spriteNode.active = true;
          console.log("🖼️ [_loadAvatarForPodium] 节点尺寸已设置为:", nodeSize);
        } // 🔧【关键修复】强制刷新 Sprite 组件


        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        sprite.markForRender();
        console.log("🖼️ [_loadAvatarForPodium] 头像设置完成！");
      });
    } else {
      var localPath = "UI/headimage/" + avatarUrl;
      console.log("🖼️ [_loadAvatarForPodium] 加载本地头像:", localPath);
      cc.resources.load(localPath, cc.SpriteFrame, function (err, spriteFrame) {
        if (err || !spriteFrame) {
          console.error("🖼️ [_loadAvatarForPodium] 加载本地头像失败:", err);
          cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function (err2, fallbackSprite) {
            if (!err2 && fallbackSprite && sprite && sprite.isValid) {
              sprite.spriteFrame = fallbackSprite;
            }
          });
          return;
        }

        if (sprite && sprite.isValid) {
          sprite.spriteFrame = spriteFrame;
          console.log("🖼️ [_loadAvatarForPodium] 本地头像设置成功");
        }
      });
    }
  },

  /**
   * 🔧【新增】获取机器人显示名称
   */
  _getRobotDisplayName: function _getRobotDisplayName(playerId, originalName) {
    if (originalName && originalName.indexOf("智能陪练") === 0) {
      return originalName;
    }

    var robotIndex = 1;

    if (playerId) {
      var lastChar = playerId.toString().slice(-1);
      robotIndex = parseInt(lastChar) || 1;
    }

    return "智能陪练" + robotIndex + "号";
  },

  /**
   * 🔧【新增】格式化金币显示
   */
  _formatMatchCoin: function _formatMatchCoin(coin) {
    if (coin >= 10000) {
      return (coin / 10000).toFixed(1) + "万";
    }

    return coin.toString();
  },

  /**
   * 隐藏最终榜单弹窗
   */
  _hideArenaFinalRankDialog: function _hideArenaFinalRankDialog() {
    if (this._arenaFinalRankDialog) {
      this._arenaFinalRankDialog.destroy();

      this._arenaFinalRankDialog = null;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2dhbWVTY2VuZS9nYW1lU2NlbmUuanMiXSwibmFtZXMiOlsiY2MiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJkaV9sYWJlbCIsIkxhYmVsIiwiYmVpc2h1X2xhYmVsIiwicm9vbWlkX2xhYmVsIiwicGxheWVyX25vZGVfcHJlZmFicyIsIlByZWZhYiIsInBsYXllcnNfc2VhdF9wb3MiLCJOb2RlIiwib25Mb2FkIiwibXlnbG9iYWwiLCJ3aW5kb3ciLCJSb29tU3RhdGUiLCJST09NX0lOVkFMSUQiLCJpc29wZW5fc291bmQiLCJwbGF5ZXJEYXRhIiwic29ja2V0IiwiY29uc29sZSIsImVycm9yIiwiX3dhaXRGb3JJbml0IiwiX2luaXRTY2VuZSIsIl9zdGFydE9ubGluZU1vbml0b3JpbmciLCJ3YXJuIiwic2VsZiIsIl9vbmxpbmVTdGF0dXNIYW5kbGVyIiwiaXNPbmxpbmUiLCJfc2hvd09mZmxpbmVNZXNzYWdlIiwiYWRkT25saW5lU3RhdHVzTGlzdGVuZXIiLCJldmVudGxpc3RlciIsIm9uIiwiZGF0YSIsIl9oYW5kbGVGb3JjZUxvZ291dCIsInJlYXNvbiIsInN0b3BPbmxpbmVNb25pdG9yaW5nIiwic2NoZWR1bGVPbmNlIiwiYWxlcnQiLCJkaXJlY3RvciIsImxvYWRTY2VuZSIsIl9zdG9wT25saW5lTW9uaXRvcmluZyIsInJlbW92ZU9ubGluZVN0YXR1c0xpc3RlbmVyIiwiYXR0ZW1wdHMiLCJtYXhBdHRlbXB0cyIsImNoZWNrSW5pdCIsInNldFRpbWVvdXQiLCJwbGF5ZXJOb2RlTGlzdCIsImJvdHRvbSIsInJhdGUiLCJzdHJpbmciLCJyb29tc3RhdGUiLCJfaXNXYWl0aW5nRm9yUGxheWVycyIsIm5vZGUiLCJpIiwibGVuZ3RoIiwiZW1pdCIsImJpbmQiLCJvblJvb21DaGFuZ2VTdGF0ZSIsIl9oaWRlV2FpdGluZ1VJIiwiZXZlbnQiLCJnYW1ldWlfbm9kZSIsImdldENoaWxkQnlOYW1lIiwiY3VycmVudFJvb21Db2RlIiwiZ2V0Q3VycmVudFJvb21Db2RlIiwiaXNJblJvb20iLCJyb29tRGF0YSIsInJvb21pZCIsInJvb21fY29kZSIsInNlYXRpbmRleCIsInBsYXllcmRhdGEiLCJhY2NvdW50aWQiLCJwbGF5ZXJJZCIsIm5pY2tfbmFtZSIsIm5pY2tOYW1lIiwiYXZhdGFyVXJsIiwiZ29sZF9jb3VudCIsImdvYmFsX2NvdW50IiwiZ29sZGNvdW50IiwiaXNyZWFkeSIsIl9wcm9jZXNzUm9vbURhdGEiLCJyZXF1ZXN0X2VudGVyX3Jvb20iLCJlcnIiLCJyZXN1bHQiLCJvblBsYXllckpvaW5Sb29tIiwiam9pbl9wbGF5ZXJkYXRhIiwiYWRkUGxheWVyTm9kZSIsIl9wbGF5ZXJkYXRhTGlzdCIsInB1c2giLCJfc2hvd1dhaXRpbmdVSSIsIl9jdXJyZW50Um9vbUNvZGUiLCJvblBsYXllckxlZnQiLCJsb2ciLCJKU09OIiwic3RyaW5naWZ5IiwiX29uUGxheWVyTGVmdCIsIm9uUGxheWVyUmVhZHkiLCJvbkdhbWVTdGFydCIsImdhbWViZWZvcmVVSSIsImFjdGl2ZSIsIm9uUmVzdGFydEdhbWUiLCJvblJvYlN0YXRlIiwiZXZlbnRXaXRoUm91bmQiLCJPYmplY3QiLCJhc3NpZ24iLCJyb3VuZCIsIm9uQmlkUmVzdWx0Iiwib25DaGFuZ2VNYXN0ZXIiLCJtYXN0ZXJfYWNjb3VudGlkIiwib25QbGF5U3RhcnQiLCJST09NX1BMQVlJTkciLCJvblNob3dCb3R0b21DYXJkIiwib25Sb29tUmVzdG9yZWQiLCJyZXN0b3JlZFJvb21EYXRhIiwicGxheWVyX2lkIiwicGxheWVyX25hbWUiLCJfb25HYW1lU3RhdGVSZXN0b3JlZCIsIm9uUGxheWVyT2ZmbGluZSIsIl9vblBsYXllck9mZmxpbmUiLCJvblBsYXllck9ubGluZSIsIl9vblBsYXllck9ubGluZSIsIm9uVG91cm5hbWVudFdhaXRQcm9ncmVzcyIsIl9vbkFyZW5hV2FpdFByb2dyZXNzIiwib25Ub3VybmFtZW50Um91bmRBZHZhbmNlIiwiX29uQXJlbmFSb3VuZEFkdmFuY2UiLCJvblRvdXJuYW1lbnRGaW5hbFJhbmsiLCJfb25BcmVuYUZpbmFsUmFuayIsInNldFBsYXllclNlYXRQb3MiLCJzZWF0X2luZGV4IiwicGxheWVyZGF0YV9saXN0X3BvcyIsInBsYXllcl9kYXRhIiwicGxheWVybm9kZV9pbnN0IiwiaW5zdGFudGlhdGUiLCJwYXJlbnQiLCJyb29tX2NhdGVnb3J5IiwiX3Jvb21DYXRlZ29yeSIsInBlcmlvZF9ubyIsIl9wZXJpb2RObyIsImluZGV4IiwidW5kZWZpbmVkIiwiY2hpbGRyZW4iLCJwb3NpdGlvbiIsInBsYXllck5vZGVTY3JpcHQiLCJnZXRDb21wb25lbnQiLCJpbml0X2RhdGEiLCJzdGFydCIsIm9uRGVzdHJveSIsImdldFVzZXJPdXRDYXJkUG9zQnlBY2NvdW50IiwidGFyZ2V0QWNjb3VudElkIiwiU3RyaW5nIiwibm9kZV9zY3JpcHQiLCJzZWF0X25vZGUiLCJpbmRleF9uYW1lIiwib3V0X2NhcmRfbm9kZSIsIm5hbWUiLCJzZWF0aWQiLCJwbGF5ZXJkYXRhX2xpc3QiLCJyb29tQ29kZSIsImlzQXJlbmFNb2RlIiwiYXJlbmFNYXRjaERhdGEiLCJiYXNlX3Njb3JlIiwibXVsdGlwbGllciIsIm1hdGNoX3JvdW5kcyIsIm1hdGNoX2R1cmF0aW9uIiwiaW5pdGlhbF9hcmVuYV9nb2xkIiwiX2lzQXJlbmFNb2RlIiwiX2Jhc2VTY29yZSIsIl9tdWx0aXBsaWVyIiwiX21hdGNoUm91bmRzIiwiX2luaXRpYWxBcmVuYUdvbGQiLCJob3VzZW1hbmFnZWlkIiwiY3JlYXRvcl9pZCIsImNyZWF0b3JJZCIsImdldFBsYXllckluZm8iLCJwbGF5ZXJJbmZvIiwiYXVkaW9FbmdpbmUiLCJzdG9wQWxsIiwicmVzb3VyY2VzIiwibG9hZCIsIkF1ZGlvQ2xpcCIsImNsaXAiLCJwbGF5IiwiZ2FtZWJlZm9yZV9ub2RlIiwiekluZGV4IiwibmVlZFBsYXllcnMiLCJfbmVlZFBsYXllcnMiLCJjYW52YXMiLCJDYW52YXMiLCJmaW5kIiwic2NyZWVuSGVpZ2h0IiwiZGVzaWduUmVzb2x1dGlvbiIsImhlaWdodCIsInNjcmVlbldpZHRoIiwid2lkdGgiLCJ3YWl0aW5nTm9kZSIsInNldENvbnRlbnRTaXplIiwic2l6ZSIsImFuY2hvclgiLCJhbmNob3JZIiwieCIsInkiLCJfd2FpdGluZ1VJTm9kZSIsInJvb21JbmZvTm9kZSIsInJvb21MYWJlbCIsImFkZENvbXBvbmVudCIsImZvbnRTaXplIiwiaG9yaXpvbnRhbEFsaWduIiwiSG9yaXpvbnRhbEFsaWduIiwiTEVGVCIsImNvbG9yIiwicm9vbU91dGxpbmUiLCJMYWJlbE91dGxpbmUiLCJsZWF2ZUJ0bk5vZGUiLCJsZWF2ZUJ0bkJnIiwiR3JhcGhpY3MiLCJmaWxsQ29sb3IiLCJyb3VuZFJlY3QiLCJmaWxsIiwic3Ryb2tlQ29sb3IiLCJsaW5lV2lkdGgiLCJzdHJva2UiLCJsZWF2ZUJ0bkxhYmVsIiwibGVhdmVMYWJlbCIsIkNFTlRFUiIsImxlYXZlT3V0bGluZSIsIkV2ZW50VHlwZSIsIlRPVUNIX1NUQVJUIiwic2NhbGUiLCJUT1VDSF9FTkQiLCJfbGVhdmVSb29tIiwiVE9VQ0hfQ0FOQ0VMIiwiX3VwZGF0ZVdhaXRpbmdBbmltYXRpb24iLCJfdXBkYXRlV2FpdGluZ1VJIiwiY3VycmVudFBsYXllcnMiLCJkZXN0cm95IiwibGVhdmVSb29tIiwicGxheWVycyIsIm5vZGVTY3JpcHQiLCJqIiwicCIsImlkIiwic3RhdGUiLCJjYXJkc19jb3VudCIsImlzX2xhbmRsb3JkIiwiZ2FtZWluZ19ub2RlIiwidGltZW91dCIsInJlbW92ZWRJbmRleCIsInNwbGljZSIsImN1cnJlbnRDb3VudCIsInJlcGxhY2UiLCJuZXdfY3JlYXRvcl9pZCIsIl9zaG93QXJlbmFXYWl0aW5nVUkiLCJfaGlkZUFyZW5hV2FpdGluZ1VJIiwiX2FyZW5hV2FpdGluZ1VJTm9kZSIsIl9hcmVuYVdhaXRpbmdEYXRhIiwicGVyaW9kTm8iLCJ0b3RhbFJvdW5kcyIsInRvdGFsX3JvdW5kcyIsImZpbmlzaGVkVGFibGVzIiwiZmluaXNoZWRfdGFibGVzIiwidG90YWxUYWJsZXMiLCJ0b3RhbF90YWJsZXMiLCJzdGF0dXMiLCJiZ05vZGUiLCJiZ0dyYXBoaWNzIiwicmVjdCIsImNhcmRXaWR0aCIsImNhcmRIZWlnaHQiLCJjYXJkTm9kZSIsImNhcmRCZyIsInRpdGxlTm9kZSIsInRpdGxlTGFiZWwiLCJ0aXRsZU91dGxpbmUiLCJfYXJlbmFQZXJpb2RMYWJlbCIsInBlcmlvZExhYmVsIiwiX2FyZW5hUm91bmRMYWJlbCIsInJvdW5kTGFiZWwiLCJfYXJlbmFDb2luTGFiZWwiLCJjb2luTGFiZWwiLCJteU1hdGNoQ29pbiIsIl9nZXRNeU1hdGNoQ29pbiIsIl9hcmVuYVByb2dyZXNzQmFyIiwicHJvZ3Jlc3NCZyIsIl9hcmVuYVByb2dyZXNzRmlsbCIsImZpbGxHcmFwaGljcyIsIl9ncmFwaGljcyIsIl9hcmVuYVByb2dyZXNzTGFiZWwiLCJwcm9ncmVzc0xhYmVsIiwiX2FyZW5hU3RhdHVzTGFiZWwiLCJzdGF0dXNMYWJlbCIsIl9hcmVuYUxvYWRpbmdOb2RlIiwibG9hZGluZ1Nwcml0ZSIsIlNwcml0ZSIsIlNwcml0ZUZyYW1lIiwic3ByaXRlRnJhbWUiLCJfc3RhcnRBcmVuYUxvYWRpbmdBbmltYXRpb24iLCJfdXBkYXRlQXJlbmFXYWl0aW5nVUkiLCJfc3RvcEFyZW5hTG9hZGluZ0FuaW1hdGlvbiIsImQiLCJwcm9ncmVzcyIsIk1hdGgiLCJtaW4iLCJiYXJXaWR0aCIsImdyYXBoaWNzIiwiY2xlYXIiLCJyZW1haW5pbmciLCJfYXJlbmFMb2FkaW5nQW5pbWF0aW9uIiwicm90YXRlIiwiYW5nbGUiLCJtYXRjaENvaW4iLCJwbGF5ZXJOb2RlIiwibXlQbGF5ZXJJZCIsImFjY291bnRJRCIsInVuaXF1ZUlEIiwibWF0Y2hfY29pbiIsImFyZW5hX2dvbGQiLCJuZXdfcm91bmQiLCJzY2FsZVVwIiwic2NhbGVUbyIsInNjYWxlRG93biIsInNlcXVlbmNlIiwicnVuQWN0aW9uIiwibWVzc2FnZSIsIl9zaG93QXJlbmFGaW5hbFJhbmtEaWFsb2ciLCJkaWFsb2dOb2RlIiwiX2NyZWF0ZUZpbmFsUmFua0RpYWxvZyIsImFkZENoaWxkIiwiX2FyZW5hRmluYWxSYW5rRGlhbG9nIiwic2V0UG9zaXRpb24iLCJDb2xvciIsImRpYWxvZ0NvbnRhaW5lciIsImRpYWxvZ0JnIiwiZGlhbG9nQmdHcmFwaGljcyIsImxpbmVIZWlnaHQiLCJ0b3RhbFBsYXllcnMiLCJ0b3RhbF9wbGF5ZXJzIiwicGVyaW9kTm9kZSIsInRvcDMiLCJwb2RpdW1ZIiwic3BhY2luZ1giLCJfY3JlYXRlUG9kaXVtSXRlbSIsIm15UmFuayIsIm15X3JhbmsiLCJteUNvaW4iLCJteV9tYXRjaF9jb2luIiwibXlSYW5rQ29udGFpbmVyIiwibXlSYW5rQmciLCJteVJhbmtCZ0dyYXBoaWNzIiwibXlSYW5rTGFiZWwiLCJteVJhbmtUZXh0IiwibXlDb2luTGFiZWwiLCJteUNvaW5UZXh0IiwiY29uZmlybUJ0biIsImJ0bkJnIiwiYnRuTGFiZWwiLCJidG5MYWJlbFRleHQiLCJidG5PdXRsaW5lIiwiYnRuIiwiQnV0dG9uIiwicGFyZW50Tm9kZSIsInJhbmsiLCJyYW5rTGFiZWxOb2RlIiwicmFua0xhYmVsIiwicmFua1RleHRzIiwicmFua091dGxpbmUiLCJhdmF0YXJTaXplIiwiYXZhdGFyQ29udGFpbmVyIiwiYXZhdGFyQmciLCJhdmF0YXJCZ0dyYXBoaWNzIiwiY2lyY2xlIiwiYXZhdGFyU3ByaXRlTm9kZSIsImF2YXRhclNwcml0ZSIsInNpemVNb2RlIiwiU2l6ZU1vZGUiLCJDVVNUT00iLCJhdmF0YXIiLCJfbG9hZEF2YXRhckZvclBvZGl1bSIsImlzX3JvYm90IiwibmFtZUxhYmVsTm9kZSIsIm5hbWVMYWJlbCIsImRpc3BsYXlOYW1lIiwibWF4TmFtZUxlbmd0aCIsInN1YnN0cmluZyIsIm92ZXJmbG93IiwiT3ZlcmZsb3ciLCJDTEFNUCIsIm5hbWVPdXRsaW5lIiwiY29pbkxhYmVsTm9kZSIsIl9mb3JtYXRNYXRjaENvaW4iLCJjb2luT3V0bGluZSIsInNwcml0ZSIsInNwcml0ZU5vZGUiLCJpc1JvYm90Iiwibm9kZVNpemUiLCJvcGFjaXR5IiwiaXNWYWxpZCIsImluZGV4T2YiLCJhc3NldE1hbmFnZXIiLCJsb2FkUmVtb3RlIiwidGV4dHVyZSIsImVycjIiLCJmYWxsYmFja1Nwcml0ZSIsIm1hcmtGb3JSZW5kZXIiLCJsb2NhbFBhdGgiLCJfZ2V0Um9ib3REaXNwbGF5TmFtZSIsIm9yaWdpbmFsTmFtZSIsInJvYm90SW5kZXgiLCJsYXN0Q2hhciIsInRvU3RyaW5nIiwic2xpY2UiLCJwYXJzZUludCIsImNvaW4iLCJ0b0ZpeGVkIiwiX2hpZGVBcmVuYUZpbmFsUmFua0RpYWxvZyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQUEsRUFBRSxDQUFDQyxLQUFILENBQVM7RUFDTCxXQUFTRCxFQUFFLENBQUNFLFNBRFA7RUFHTEMsVUFBVSxFQUFFO0lBQ1JDLFFBQVEsRUFBRUosRUFBRSxDQUFDSyxLQURMO0lBRVJDLFlBQVksRUFBRU4sRUFBRSxDQUFDSyxLQUZUO0lBR1JFLFlBQVksRUFBRVAsRUFBRSxDQUFDSyxLQUhUO0lBSVJHLG1CQUFtQixFQUFFUixFQUFFLENBQUNTLE1BSmhCO0lBS1JDLGdCQUFnQixFQUFFVixFQUFFLENBQUNXO0VBTGIsQ0FIUDtFQVdMQyxNQVhLLG9CQVdJO0lBRUwsSUFBSUMsUUFBUSxHQUFHQyxNQUFNLENBQUNELFFBQXRCO0lBQ0EsSUFBSUUsU0FBUyxHQUFHRCxNQUFNLENBQUNDLFNBQVAsSUFBb0I7TUFBRUMsWUFBWSxFQUFFLENBQUM7SUFBakIsQ0FBcEM7SUFDQSxJQUFJQyxZQUFZLEdBQUdILE1BQU0sQ0FBQ0csWUFBUCxJQUF1QixDQUExQzs7SUFFQSxJQUFJLENBQUNKLFFBQUQsSUFBYSxDQUFDQSxRQUFRLENBQUNLLFVBQXZCLElBQXFDLENBQUNMLFFBQVEsQ0FBQ00sTUFBbkQsRUFBMkQ7TUFDdkRDLE9BQU8sQ0FBQ0MsS0FBUixDQUFjLDZDQUFkOztN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RCxDQUFSLElBQXNCLENBQW5DO0lBQ0g7O0lBQ0QsT0FBTyxTQUFTRCxVQUFULEdBQXNCLEdBQTdCO0VBQ0gsQ0EvdERJOztFQWl1REw7QUFDSjtBQUNBO0VBQ0lsQixnQkFBZ0IsRUFBRSwwQkFBU3VCLElBQVQsRUFBZTtJQUM3QixJQUFJQSxJQUFJLElBQUksS0FBWixFQUFtQjtNQUNmLE9BQU8sQ0FBQ0EsSUFBSSxHQUFHLEtBQVIsRUFBZUMsT0FBZixDQUF1QixDQUF2QixJQUE0QixHQUFuQztJQUNIOztJQUNELE9BQU9ELElBQUksQ0FBQ0gsUUFBTCxFQUFQO0VBQ0gsQ0F6dURJOztFQTJ1REw7QUFDSjtBQUNBO0VBQ0lLLHlCQUF5QixFQUFFLHFDQUFXO0lBQ2xDLElBQUksS0FBS3RGLHFCQUFULEVBQWdDO01BQzVCLEtBQUtBLHFCQUFMLENBQTJCN0YsT0FBM0I7O01BQ0EsS0FBSzZGLHFCQUFMLEdBQTZCLElBQTdCO0lBQ0g7RUFDSjtBQW52REksQ0FBVCIsInNvdXJjZVJvb3QiOiIvIiwic291cmNlc0NvbnRlbnQiOlsiLy8g5L2/55So5YWo5bGA5Y+Y6YeP77yM5LiN5L2/55SoIHJlcXVpcmVcbi8vIOOAkOS/ruWkjeeJiOacrOOAkeeugOWMluWPkeeJjOmAu+i+ke+8jOS4jeWGjeS9v+eUqOWumuaXtuWZqOiwg+W6plxuLy8g5qC45b+D5Y6f5YiZ77yaXG4vLyAxLiBnYW1laW5nVUkuanMg6Ieq5bex5aSE55CG5Y+R54mM5Yqo55S7XG4vLyAyLiBnYW1lU2NlbmUuanMg5Y+q6LSf6LSj6L2s5Y+R5LqL5Lu257uZIHBsYXllcl9ub2RlXG4vLyAzLiDkuI3kvp3otZYgc2NoZWR1bGVPbmNlIOaOp+WItuWPkeeJjOiKguWlj1xuXG5jYy5DbGFzcyh7XG4gICAgZXh0ZW5kczogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBkaV9sYWJlbDogY2MuTGFiZWwsXG4gICAgICAgIGJlaXNodV9sYWJlbDogY2MuTGFiZWwsXG4gICAgICAgIHJvb21pZF9sYWJlbDogY2MuTGFiZWwsXG4gICAgICAgIHBsYXllcl9ub2RlX3ByZWZhYnM6IGNjLlByZWZhYixcbiAgICAgICAgcGxheWVyc19zZWF0X3BvczogY2MuTm9kZSxcbiAgICB9LFxuXG4gICAgb25Mb2FkKCkge1xuICAgICAgICBcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIHZhciBSb29tU3RhdGUgPSB3aW5kb3cuUm9vbVN0YXRlIHx8IHsgUk9PTV9JTlZBTElEOiAtMSB9XG4gICAgICAgIHZhciBpc29wZW5fc291bmQgPSB3aW5kb3cuaXNvcGVuX3NvdW5kIHx8IDFcblxuICAgICAgICBpZiAoIW15Z2xvYmFsIHx8ICFteWdsb2JhbC5wbGF5ZXJEYXRhIHx8ICFteWdsb2JhbC5zb2NrZXQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJnYW1lU2NlbmU6IG15Z2xvYmFs44CBcGxheWVyRGF0YSDmiJYgc29ja2V0IOacquWumuS5iVwiKVxuICAgICAgICAgICAgdGhpcy5fd2FpdEZvckluaXQoKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2luaXRTY2VuZShteWdsb2JhbCwgUm9vbVN0YXRlLCBpc29wZW5fc291bmQpXG4gICAgICAgIHRoaXMuX3N0YXJ0T25saW5lTW9uaXRvcmluZygpXG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOWcqOe6v+ebkea1i+WSjOWFtuS7luWKn+iDvVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgX3N0YXJ0T25saW5lTW9uaXRvcmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAoIW15Z2xvYmFsKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJnYW1lU2NlbmU6IG15Z2xvYmFsIOacquWumuS5ie+8jOaXoOazleWQr+WKqOWcqOe6v+ebkea1i1wiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgdGhpcy5fb25saW5lU3RhdHVzSGFuZGxlciA9IGZ1bmN0aW9uKGlzT25saW5lKSB7XG4gICAgICAgICAgICBpZiAoIWlzT25saW5lKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc2hvd09mZmxpbmVNZXNzYWdlKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKG15Z2xvYmFsLmFkZE9ubGluZVN0YXR1c0xpc3RlbmVyKSB7XG4gICAgICAgICAgICBteWdsb2JhbC5hZGRPbmxpbmVTdGF0dXNMaXN0ZW5lcih0aGlzLl9vbmxpbmVTdGF0dXNIYW5kbGVyKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAobXlnbG9iYWwuZXZlbnRsaXN0ZXIpIHtcbiAgICAgICAgICAgIG15Z2xvYmFsLmV2ZW50bGlzdGVyLm9uKFwiZm9yY2VfbG9nb3V0XCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn5qrIOa4uOaIj+WcuuaZr+aUtuWIsOW8uuWItuS4i+e6v+S6i+S7tjpcIiwgZGF0YSlcbiAgICAgICAgICAgICAgICBzZWxmLl9oYW5kbGVGb3JjZUxvZ291dChkYXRhKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgX3Nob3dPZmZsaW5lTWVzc2FnZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIvCfkpQg5ri45oiP5Zy65pmv77ya572R57uc6L+e5o6l5bey5pat5byAXCIpXG4gICAgfSxcbiAgICBcbiAgICBfaGFuZGxlRm9yY2VMb2dvdXQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHJlYXNvbiA9IGRhdGEucmVhc29uIHx8IFwi5oKo5bey6KKr5by65Yi25LiL57q/XCJcbiAgICAgICAgY29uc29sZS53YXJuKFwi8J+aqyDmuLjmiI/lnLrmma/lvLrliLbkuIvnur86XCIsIHJlYXNvbilcbiAgICAgICAgXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAobXlnbG9iYWwgJiYgbXlnbG9iYWwuc3RvcE9ubGluZU1vbml0b3JpbmcpIHtcbiAgICAgICAgICAgIG15Z2xvYmFsLnN0b3BPbmxpbmVNb25pdG9yaW5nKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHRoaXMuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhbGVydCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGFsZXJ0KHJlYXNvbiArIFwiXFxuXFxu6K+36YeN5paw55m75b2VXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJsb2dpblNjZW5lXCIpXG4gICAgICAgIH0sIDAuNSlcbiAgICB9LFxuICAgIFxuICAgIF9zdG9wT25saW5lTW9uaXRvcmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBcbiAgICAgICAgaWYgKG15Z2xvYmFsICYmIG15Z2xvYmFsLnJlbW92ZU9ubGluZVN0YXR1c0xpc3RlbmVyICYmIHRoaXMuX29ubGluZVN0YXR1c0hhbmRsZXIpIHtcbiAgICAgICAgICAgIG15Z2xvYmFsLnJlbW92ZU9ubGluZVN0YXR1c0xpc3RlbmVyKHRoaXMuX29ubGluZVN0YXR1c0hhbmRsZXIpXG4gICAgICAgICAgICB0aGlzLl9vbmxpbmVTdGF0dXNIYW5kbGVyID0gbnVsbFxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBfd2FpdEZvckluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBhdHRlbXB0cyA9IDA7XG4gICAgICAgIHZhciBtYXhBdHRlbXB0cyA9IDIwO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNoZWNrSW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYXR0ZW1wdHMrKztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICAgICAgaWYgKG15Z2xvYmFsICYmIG15Z2xvYmFsLnBsYXllckRhdGEgJiYgbXlnbG9iYWwuc29ja2V0KSB7XG4gICAgICAgICAgICAgICAgdmFyIFJvb21TdGF0ZSA9IHdpbmRvdy5Sb29tU3RhdGUgfHwgeyBST09NX0lOVkFMSUQ6IC0xIH07XG4gICAgICAgICAgICAgICAgdmFyIGlzb3Blbl9zb3VuZCA9IHdpbmRvdy5pc29wZW5fc291bmQgfHwgMTtcbiAgICAgICAgICAgICAgICBzZWxmLl9pbml0U2NlbmUobXlnbG9iYWwsIFJvb21TdGF0ZSwgaXNvcGVuX3NvdW5kKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYXR0ZW1wdHMgPCBtYXhBdHRlbXB0cykge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY2hlY2tJbml0LCAxMDApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiZ2FtZVNjZW5lIOWIneWni+WMlui2heaXtlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIHNldFRpbWVvdXQoY2hlY2tJbml0LCAxMDApO1xuICAgIH0sXG4gICAgXG4gICAgX2luaXRTY2VuZTogZnVuY3Rpb24obXlnbG9iYWwsIFJvb21TdGF0ZSwgaXNvcGVuX3NvdW5kKSB7XG4gICAgICAgIHRoaXMucGxheWVyTm9kZUxpc3QgPSBbXVxuICAgICAgICBcbiAgICAgICAgdmFyIGJvdHRvbSA9IG15Z2xvYmFsLnBsYXllckRhdGEuYm90dG9tIHx8IDFcbiAgICAgICAgdmFyIHJhdGUgPSBteWdsb2JhbC5wbGF5ZXJEYXRhLnJhdGUgfHwgMVxuICAgICAgICBcbiAgICAgICAgdGhpcy5kaV9sYWJlbC5zdHJpbmcgPSBcIuW6lTpcIiArIGJvdHRvbVxuICAgICAgICB0aGlzLmJlaXNodV9sYWJlbC5zdHJpbmcgPSBcIuWAjeaVsDpcIiArIHJhdGVcbiAgICAgICAgdGhpcy5yb29tc3RhdGUgPSBSb29tU3RhdGUuUk9PTV9JTlZBTElEXG4gICAgICAgIHRoaXMuX2lzV2FpdGluZ0ZvclBsYXllcnMgPSBmYWxzZVxuXG5cbiAgICAgICAgLy8g55uR5ZCs77yM57uZ5YW25LuW546p5a625Y+R54mMKOWGhemDqOS6i+S7tilcbiAgICAgICAgLy8g44CQ5qC45b+D44CRcGxheWVyX25vZGUg55u05o6l5pi+56S6IDE3IOW8oOeJjOiDjO+8jOS4jeWGjemAkOW8oOWKqOeUu1xuICAgICAgICB0aGlzLm5vZGUub24oXCJwdXNoY2FyZF9vdGhlcl9ldmVudFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wbGF5ZXJOb2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInB1c2hfY2FyZF9ldmVudFwiKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIOebkeWQrOaIv+mXtOeKtuaAgeaUueWPmOS6i+S7tlxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25Sb29tQ2hhbmdlU3RhdGUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5yb29tc3RhdGUgPSBkYXRhXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChkYXRhICE9PSBSb29tU3RhdGUuUk9PTV9JTlZBTElEICYmIHRoaXMuX2lzV2FpdGluZ0ZvclBsYXllcnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9oaWRlV2FpdGluZ1VJKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIHRoaXMubm9kZS5vbihcImNhbnJvYl9ldmVudFwiLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLnBsYXllck5vZGVMaXN0W2ldXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5lbWl0KFwicGxheWVybm9kZV9jYW5yb2JfZXZlbnRcIiwgZXZlbnQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgdGhpcy5ub2RlLm9uKFwiY2hvb3NlX2NhcmRfZXZlbnRcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBnYW1ldWlfbm9kZSA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcImdhbWVpbmdVSVwiKVxuICAgICAgICAgICAgaWYgKGdhbWV1aV9ub2RlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdhbWV1aV9ub2RlLmVtaXQoXCJjaG9vc2VfY2FyZF9ldmVudFwiLCBldmVudClcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIHRoaXMubm9kZS5vbihcInVuY2hvb3NlX2NhcmRfZXZlbnRcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBnYW1ldWlfbm9kZSA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcImdhbWVpbmdVSVwiKVxuICAgICAgICAgICAgaWYgKGdhbWV1aV9ub2RlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdhbWV1aV9ub2RlLmVtaXQoXCJ1bmNob29zZV9jYXJkX2V2ZW50XCIsIGV2ZW50KVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgdmFyIGN1cnJlbnRSb29tQ29kZSA9IG15Z2xvYmFsLnNvY2tldC5nZXRDdXJyZW50Um9vbUNvZGUoKVxuICAgICAgICB2YXIgaXNJblJvb20gPSBteWdsb2JhbC5zb2NrZXQuaXNJblJvb20oKVxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIHZhciByb29tRGF0YSA9IG15Z2xvYmFsLnJvb21EYXRhXG4gICAgICAgIFxuICAgICAgICBpZiAoaXNJblJvb20gJiYgY3VycmVudFJvb21Db2RlICYmICFyb29tRGF0YSkge1xuICAgICAgICAgICAgcm9vbURhdGEgPSB7XG4gICAgICAgICAgICAgICAgcm9vbWlkOiBjdXJyZW50Um9vbUNvZGUsXG4gICAgICAgICAgICAgICAgcm9vbV9jb2RlOiBjdXJyZW50Um9vbUNvZGUsXG4gICAgICAgICAgICAgICAgc2VhdGluZGV4OiAxLFxuICAgICAgICAgICAgICAgIHBsYXllcmRhdGE6IFt7XG4gICAgICAgICAgICAgICAgICAgIGFjY291bnRpZDogbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50aWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5wbGF5ZXJJZCxcbiAgICAgICAgICAgICAgICAgICAgbmlja19uYW1lOiBteWdsb2JhbC5wbGF5ZXJEYXRhLm5pY2tOYW1lLFxuICAgICAgICAgICAgICAgICAgICBhdmF0YXJVcmw6IFwiYXZhdGFyXzFcIixcbiAgICAgICAgICAgICAgICAgICAgZ29sZF9jb3VudDogbXlnbG9iYWwucGxheWVyRGF0YS5nb2JhbF9jb3VudCB8fCAxMDAwLCAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55SoIGdvbGRfY291bnQg5a2X5q61XG4gICAgICAgICAgICAgICAgICAgIGdvbGRjb3VudDogbXlnbG9iYWwucGxheWVyRGF0YS5nb2JhbF9jb3VudCB8fCAxMDAwLCAgLy8g5YW85a655pen5a6i5oi356uvXG4gICAgICAgICAgICAgICAgICAgIHNlYXRpbmRleDogMSxcbiAgICAgICAgICAgICAgICAgICAgaXNyZWFkeTogdHJ1ZVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChyb29tRGF0YSkge1xuICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc1Jvb21EYXRhKHJvb21EYXRhLCBteWdsb2JhbCwgaXNvcGVuX3NvdW5kKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LnJlcXVlc3RfZW50ZXJfcm9vbSh7fSwgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyICE9IDApIHtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9jZXNzUm9vbURhdGEocmVzdWx0LCBteWdsb2JhbCwgaXNvcGVuX3NvdW5kKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgfVxuXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vblBsYXllckpvaW5Sb29tKGZ1bmN0aW9uKGpvaW5fcGxheWVyZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5hZGRQbGF5ZXJOb2RlKGpvaW5fcGxheWVyZGF0YSlcblxuICAgICAgICAgICAgaWYgKCF0aGlzLl9wbGF5ZXJkYXRhTGlzdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXllcmRhdGFMaXN0ID0gW11cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3BsYXllcmRhdGFMaXN0LnB1c2goam9pbl9wbGF5ZXJkYXRhKVxuXG4gICAgICAgICAgICBpZiAodGhpcy5faXNXYWl0aW5nRm9yUGxheWVycykge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3dXYWl0aW5nVUkoMyAtIHRoaXMuX3BsYXllcmRhdGFMaXN0Lmxlbmd0aCwgdGhpcy5fY3VycmVudFJvb21Db2RlKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5wbGF5ZXJOb2RlTGlzdC5sZW5ndGggPj0gMykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2hpZGVXYWl0aW5nVUkoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeebkeWQrOeOqeWutuemu+W8gOS6i+S7tlxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25QbGF5ZXJMZWZ0KGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+RiyBbZ2FtZVNjZW5lXSDmlLbliLDnjqnlrrbnprvlvIDpgJrnn6U6XCIsIEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICAgICAgICAgdGhpcy5fb25QbGF5ZXJMZWZ0KGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25QbGF5ZXJSZWFkeShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGxheWVyTm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLmVtaXQoXCJwbGF5ZXJfcmVhZHlfbm90aWZ5XCIsIGRhdGEpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uR2FtZVN0YXJ0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLnBsYXllck5vZGVMaXN0W2ldXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5lbWl0KFwiZ2FtZXN0YXJ0X2V2ZW50XCIpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZ2FtZWJlZm9yZVVJID0gdGhpcy5ub2RlLmdldENoaWxkQnlOYW1lKFwiZ2FtZWJlZm9yZVVJXCIpXG4gICAgICAgICAgICBpZiAoZ2FtZWJlZm9yZVVJKSB7XG4gICAgICAgICAgICAgICAgZ2FtZWJlZm9yZVVJLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR55uR5ZCs6YeN5paw5Y+R54mM77yI5omA5pyJ5Lq66YO95LiN5Y+r5Zyw5Li777yJXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vblJlc3RhcnRHYW1lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+UhCBbZ2FtZVNjZW5lXSDmlLbliLDph43mlrDlj5HniYzmtojmga/vvIzmuIXnkIbnjqnlrrboioLngrnnmoTmiqLlnLDkuLsv5LiN5oqi5Zu+5qCHXCIpXG4gICAgICAgICAgICAvLyDmuIXnkIbmiYDmnInnjqnlrrboioLngrnnmoTmiqLlnLDkuLsv5LiN5oqi5Zu+5qCHXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGxheWVyTm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLmVtaXQoXCJjbGVhcl9yb2Jfc3RhdGVfZXZlbnRcIilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25Sb2JTdGF0ZShmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkea3u+WKoCByb3VuZCDlrZfmrrXvvIzljLrliIblj6vlnLDkuLvlkozmiqLlnLDkuLtcbiAgICAgICAgICAgIHZhciBldmVudFdpdGhSb3VuZCA9IE9iamVjdC5hc3NpZ24oe30sIGV2ZW50LCB7IHJvdW5kOiAyIH0pXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGxheWVyTm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLmVtaXQoXCJwbGF5ZXJub2RlX3JvYl9zdGF0ZV9ldmVudFwiLCBldmVudFdpdGhSb3VuZClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHnm5HlkKzlj6vlnLDkuLvnu5PmnpzvvIjnrKzkuIDova7vvIlcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQmlkUmVzdWx0KGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5re75YqgIHJvdW5kIOWtl+aute+8jOWMuuWIhuWPq+WcsOS4u+WSjOaKouWcsOS4u1xuICAgICAgICAgICAgdmFyIGV2ZW50V2l0aFJvdW5kID0gT2JqZWN0LmFzc2lnbih7fSwgZXZlbnQsIHsgcm91bmQ6IDEgfSlcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wbGF5ZXJOb2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInBsYXllcm5vZGVfcm9iX3N0YXRlX2V2ZW50XCIsIGV2ZW50V2l0aFJvdW5kKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkNoYW5nZU1hc3RlcihmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YS5tYXN0ZXJfYWNjb3VudGlkID0gZXZlbnRcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wbGF5ZXJOb2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInBsYXllcm5vZGVfY2hhbmdlbWFzdGVyX2V2ZW50XCIsIGV2ZW50KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHnm5HlkKzlh7rniYzpmLbmrrXlvIDlp4tcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uUGxheVN0YXJ0KGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIC8vIOiuvue9ruaIv+mXtOeKtuaAgeS4uuWHuueJjOmYtuautVxuICAgICAgICAgICAgdGhpcy5yb29tc3RhdGUgPSBSb29tU3RhdGUuUk9PTV9QTEFZSU5HXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICB0aGlzLm5vZGUub24oXCJ1cGRhdGVfY2FyZF9jb3VudF9ldmVudFwiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGxheWVyTm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLmVtaXQoXCJ1cGRhdGVfY2FyZF9jb3VudF9ldmVudFwiLCBkYXRhKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vblNob3dCb3R0b21DYXJkKGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgZ2FtZXVpX25vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJnYW1laW5nVUlcIilcbiAgICAgICAgICAgIGlmIChnYW1ldWlfbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBnYW1ldWlfbm9kZS5lbWl0KFwic2hvd19ib3R0b21fY2FyZF9ldmVudFwiLCBldmVudClcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICBcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uUm9vbVJlc3RvcmVkKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLnJvb21fY29kZSkge1xuICAgICAgICAgICAgICAgIHZhciByZXN0b3JlZFJvb21EYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICByb29taWQ6IGRhdGEucm9vbV9jb2RlLFxuICAgICAgICAgICAgICAgICAgICByb29tX2NvZGU6IGRhdGEucm9vbV9jb2RlLFxuICAgICAgICAgICAgICAgICAgICBzZWF0aW5kZXg6IDEsXG4gICAgICAgICAgICAgICAgICAgIHBsYXllcmRhdGE6IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2NvdW50aWQ6IGRhdGEucGxheWVyX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmlja19uYW1lOiBkYXRhLnBsYXllcl9uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXZhdGFyVXJsOiBcImF2YXRhcl8xXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBnb2xkX2NvdW50OiBkYXRhLmdvbGRfY291bnQgfHwgMTAwMCwgLy8g8J+Up+OAkOS/ruWkjeOAkeS9v+eUqCBnb2xkX2NvdW50IOWtl+autVxuICAgICAgICAgICAgICAgICAgICAgICAgZ29sZGNvdW50OiBkYXRhLmdvbGRfY291bnQgfHwgMTAwMCwgIC8vIOWFvOWuueaXp+WuouaIt+err1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VhdGluZGV4OiAxXG4gICAgICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2Nlc3NSb29tRGF0YShyZXN0b3JlZFJvb21EYXRhLCBteWdsb2JhbCwgaXNvcGVuX3NvdW5kKVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIFxuICAgICAgICAvLyDjgJDmlrDlop7jgJHnm5HlkKzmuLjmiI/nirbmgIHmgaLlpI3kuovku7ZcbiAgICAgICAgdGhpcy5ub2RlLm9uKFwiZ2FtZV9zdGF0ZV9yZXN0b3JlZFwiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB0aGlzLl9vbkdhbWVTdGF0ZVJlc3RvcmVkKGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgXG4gICAgICAgIC8vIOOAkOaWsOWinuOAkeebkeWQrOeOqeWutuaOiee6v+mAmuefpVxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25QbGF5ZXJPZmZsaW5lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuX29uUGxheWVyT2ZmbGluZShkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIFxuICAgICAgICAvLyDjgJDmlrDlop7jgJHnm5HlkKznjqnlrrbkuIrnur/pgJrnn6VcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uUGxheWVyT25saW5lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuX29uUGxheWVyT25saW5lKGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyDjgJDmlrDlop7jgJHnq57mioDlnLrnrYnlvoVVSeebuOWFs+S6i+S7tuebkeWQrFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgXG4gICAgICAgIC8vIOebkeWQrOernuaKgOWcuuetieW+hei/m+W6puabtOaWsFxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25Ub3VybmFtZW50V2FpdFByb2dyZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuX29uQXJlbmFXYWl0UHJvZ3Jlc3MoZGF0YSlcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICBcbiAgICAgICAgLy8g55uR5ZCs56ue5oqA5Zy66L2u5qyh5pmL57qnXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vblRvdXJuYW1lbnRSb3VuZEFkdmFuY2UoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5fb25BcmVuYVJvdW5kQWR2YW5jZShkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIFxuICAgICAgICAvLyDnm5HlkKznq57mioDlnLrmnIDnu4jmppzljZVcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uVG91cm5hbWVudEZpbmFsUmFuayhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB0aGlzLl9vbkFyZW5hRmluYWxSYW5rKGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgXG4gICAgfSxcblxuICAgIHNldFBsYXllclNlYXRQb3Moc2VhdF9pbmRleCkge1xuICAgICAgICBpZiAoc2VhdF9pbmRleCA8IDEgfHwgc2VhdF9pbmRleCA+IDMpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cblxuICAgICAgICBzd2l0Y2ggKHNlYXRfaW5kZXgpIHtcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllcmRhdGFfbGlzdF9wb3NbMV0gPSAwXG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXJkYXRhX2xpc3RfcG9zWzJdID0gMVxuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyZGF0YV9saXN0X3Bvc1szXSA9IDJcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyZGF0YV9saXN0X3Bvc1syXSA9IDBcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllcmRhdGFfbGlzdF9wb3NbM10gPSAxXG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXJkYXRhX2xpc3RfcG9zWzFdID0gMlxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5ZXJkYXRhX2xpc3RfcG9zWzNdID0gMFxuICAgICAgICAgICAgICAgIHRoaXMucGxheWVyZGF0YV9saXN0X3Bvc1sxXSA9IDFcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXllcmRhdGFfbGlzdF9wb3NbMl0gPSAyXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhZGRQbGF5ZXJOb2RlKHBsYXllcl9kYXRhKSB7XG5cbiAgICAgICAgaWYgKCF0aGlzLnBsYXllcl9ub2RlX3ByZWZhYnMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJwbGF5ZXJfbm9kZV9wcmVmYWJzIOacque7keWumu+8gVwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5wbGF5ZXJzX3NlYXRfcG9zKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwicGxheWVyc19zZWF0X3BvcyDmnKrnu5HlrprvvIFcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcGxheWVybm9kZV9pbnN0ID0gY2MuaW5zdGFudGlhdGUodGhpcy5wbGF5ZXJfbm9kZV9wcmVmYWJzKTtcbiAgICAgICAgaWYgKCFwbGF5ZXJub2RlX2luc3QpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLml6Dms5Xlrp7kvovljJYgcGxheWVyX25vZGVfcHJlZmFic1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHBsYXllcm5vZGVfaW5zdC5wYXJlbnQgPSB0aGlzLm5vZGU7XG4gICAgICAgIHRoaXMucGxheWVyTm9kZUxpc3QucHVzaChwbGF5ZXJub2RlX2luc3QpO1xuXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlsIbmiL/pl7TnsbvlnovkvKDpgJLnu5kgcGxheWVyX25vZGXvvIjnlKjkuo7ljLrliIbmma7pgJrlnLrlkoznq57mioDlnLrvvIlcbiAgICAgICAgaWYgKCFwbGF5ZXJfZGF0YS5yb29tX2NhdGVnb3J5KSB7XG4gICAgICAgICAgICBwbGF5ZXJfZGF0YS5yb29tX2NhdGVnb3J5ID0gdGhpcy5fcm9vbUNhdGVnb3J5IHx8IDFcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbYWRkUGxheWVyTm9kZV0g6K6+572uIHBsYXllcl9kYXRhLnJvb21fY2F0ZWdvcnkgPVwiLCBwbGF5ZXJfZGF0YS5yb29tX2NhdGVnb3J5KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeWwhuacn+WPt+S8oOmAkue7mSBwbGF5ZXJfbm9kZVxuICAgICAgICBpZiAoIXBsYXllcl9kYXRhLnBlcmlvZF9ubyAmJiB0aGlzLl9wZXJpb2RObykge1xuICAgICAgICAgICAgcGxheWVyX2RhdGEucGVyaW9kX25vID0gdGhpcy5fcGVyaW9kTm9cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMucGxheWVyZGF0YV9saXN0X3Bvc1twbGF5ZXJfZGF0YS5zZWF0aW5kZXhdO1xuICAgICAgICBcbiAgICAgICAgaWYgKGluZGV4ID09PSB1bmRlZmluZWQgfHwgaW5kZXggPT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLml6DmlYjnmoTluqfkvY3ntKLlvJU6XCIsIHBsYXllcl9kYXRhLnNlYXRpbmRleCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcy5wbGF5ZXJzX3NlYXRfcG9zLmNoaWxkcmVuIHx8ICF0aGlzLnBsYXllcnNfc2VhdF9wb3MuY2hpbGRyZW5baW5kZXhdKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi5bqn5L2N6IqC54K55LiN5a2Y5Zyo77yMaW5kZXg6XCIsIGluZGV4KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcGxheWVybm9kZV9pbnN0LnBvc2l0aW9uID0gdGhpcy5wbGF5ZXJzX3NlYXRfcG9zLmNoaWxkcmVuW2luZGV4XS5wb3NpdGlvbjtcbiAgICAgICAgXG4gICAgICAgIHZhciBwbGF5ZXJOb2RlU2NyaXB0ID0gcGxheWVybm9kZV9pbnN0LmdldENvbXBvbmVudChcInBsYXllcl9ub2RlXCIpO1xuICAgICAgICBpZiAoIXBsYXllck5vZGVTY3JpcHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLml6Dms5Xojrflj5YgcGxheWVyX25vZGUg57uE5Lu2XCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBwbGF5ZXJOb2RlU2NyaXB0LmluaXRfZGF0YShwbGF5ZXJfZGF0YSwgaW5kZXgpO1xuICAgIH0sXG5cbiAgICBzdGFydCgpIHtcbiAgICB9LFxuXG4gICAgb25EZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fc3RvcE9ubGluZU1vbml0b3JpbmcoKVxuICAgIH0sXG5cbiAgICBnZXRVc2VyT3V0Q2FyZFBvc0J5QWNjb3VudChhY2NvdW50aWQpIHtcbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcy5wbGF5ZXJOb2RlTGlzdCB8fCAhdGhpcy5wbGF5ZXJzX3NlYXRfcG9zKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwicGxheWVyTm9kZUxpc3Qg5oiWIHBsYXllcnNfc2VhdF9wb3Mg5pyq5Yid5aeL5YyWXCIpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkvb/nlKjlrZfnrKbkuLLmr5TovoPvvIzpgb/lhY3nsbvlnovkuI3ljLnphY3pl67pophcbiAgICAgICAgdmFyIHRhcmdldEFjY291bnRJZCA9IFN0cmluZyhhY2NvdW50aWQgfHwgXCJcIilcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wbGF5ZXJOb2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLnBsYXllck5vZGVMaXN0W2ldXG4gICAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBub2RlX3NjcmlwdCA9IG5vZGUuZ2V0Q29tcG9uZW50KFwicGxheWVyX25vZGVcIilcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55So5a2X56ym5Liy5q+U6L6D77yM56Gu5L+d57G75Z6L5LiA6Ie0XG4gICAgICAgICAgICAgICAgaWYgKG5vZGVfc2NyaXB0ICYmIFN0cmluZyhub2RlX3NjcmlwdC5hY2NvdW50aWQgfHwgXCJcIikgPT09IHRhcmdldEFjY291bnRJZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZV9zY3JpcHQuc2VhdF9pbmRleCA9PT0gdW5kZWZpbmVkIHx8IG5vZGVfc2NyaXB0LnNlYXRfaW5kZXggPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLml6DmlYjnmoQgc2VhdF9pbmRleFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMucGxheWVyc19zZWF0X3Bvcy5jaGlsZHJlbiB8fCAhdGhpcy5wbGF5ZXJzX3NlYXRfcG9zLmNoaWxkcmVuW25vZGVfc2NyaXB0LnNlYXRfaW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi5bqn5L2N6IqC54K55LiN5a2Y5Zyo77yMc2VhdF9pbmRleDpcIiwgbm9kZV9zY3JpcHQuc2VhdF9pbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlYXRfbm9kZSA9IHRoaXMucGxheWVyc19zZWF0X3Bvcy5jaGlsZHJlbltub2RlX3NjcmlwdC5zZWF0X2luZGV4XVxuICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5qOA5p+lIHNlYXRfbm9kZSDmmK/lkKblrZjlnKhcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzZWF0X25vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzZWF0X25vZGUg5Li656m677yMc2VhdF9pbmRleDpcIiwgbm9kZV9zY3JpcHQuc2VhdF9pbmRleCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXhfbmFtZSA9IFwiY2FyZHNvdXR6b25lXCIgKyBub2RlX3NjcmlwdC5zZWF0X2luZGV4XG4gICAgICAgICAgICAgICAgICAgIHZhciBvdXRfY2FyZF9ub2RlID0gc2VhdF9ub2RlLmdldENoaWxkQnlOYW1lKGluZGV4X25hbWUpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ6LCD6K+V44CR6L6T5Ye65om+5Yiw55qE5Ye654mM5Yy65Z+fXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyBbZ2V0VXNlck91dENhcmRQb3NCeUFjY291bnRdIGFjY291bnRpZDpcIiwgYWNjb3VudGlkLCBcInNlYXRfaW5kZXg6XCIsIG5vZGVfc2NyaXB0LnNlYXRfaW5kZXgsIFwib3V0X2NhcmRfbm9kZTpcIiwgb3V0X2NhcmRfbm9kZSA/IG91dF9jYXJkX25vZGUubmFtZSA6IFwibnVsbFwiKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG91dF9jYXJkX25vZGVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDosIPor5XjgJHmnKrmib7liLDnjqnlrrboioLngrlcbiAgICAgICAgY29uc29sZS53YXJuKFwi8J+DjyBbZ2V0VXNlck91dENhcmRQb3NCeUFjY291bnRdIOacquaJvuWIsOeOqeWutuiKgueCuSwgYWNjb3VudGlkOlwiLCBhY2NvdW50aWQsIFwicGxheWVyTm9kZUxpc3QubGVuZ3RoOlwiLCB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aClcblxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIH0sXG4gICAgXG4gICAgX3Byb2Nlc3NSb29tRGF0YTogZnVuY3Rpb24ocmVzdWx0LCBteWdsb2JhbCwgaXNvcGVuX3NvdW5kKSB7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfjq4gW19wcm9jZXNzUm9vbURhdGFdIOaOpeaUtuWIsOeahOaVsOaNrjpcIiwgSlNPTi5zdHJpbmdpZnkocmVzdWx0KSlcbiAgICAgICAgXG4gICAgICAgIHZhciBzZWF0aWQgPSByZXN1bHQuc2VhdGluZGV4IHx8IDFcbiAgICAgICAgXG4gICAgICAgIHRoaXMucGxheWVyZGF0YV9saXN0X3BvcyA9IFtdXG4gICAgICAgIHRoaXMuc2V0UGxheWVyU2VhdFBvcyhzZWF0aWQpXG5cbiAgICAgICAgdmFyIHBsYXllcmRhdGFfbGlzdCA9IHJlc3VsdC5wbGF5ZXJkYXRhIHx8IFtdXG4gICAgICAgIHZhciByb29taWQgPSByZXN1bHQucm9vbWlkIHx8IHJlc3VsdC5yb29tX2NvZGUgfHwgcmVzdWx0LnJvb21Db2RlIHx8IFwiV0FJVElOR1wiXG5cbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeajgOafpeaYr+WQpuaYr+ernuaKgOWcuuaooeW8j1xuICAgICAgICB2YXIgaXNBcmVuYU1vZGUgPSByZXN1bHQucm9vbV9jYXRlZ29yeSA9PT0gMlxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS8mOWMluOAkeernuaKgOWcuuaooeW8j+S4i++8jOS8mOWFiOS9v+eUqOmihOWKoOi9veeahOaVsOaNrlxuICAgICAgICBpZiAoaXNBcmVuYU1vZGUgJiYgbXlnbG9iYWwuYXJlbmFNYXRjaERhdGEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbX3Byb2Nlc3NSb29tRGF0YV0g5L2/55So6aKE5Yqg6L2955qE56ue5oqA5Zy65pWw5o2uOlwiLCBKU09OLnN0cmluZ2lmeShteWdsb2JhbC5hcmVuYU1hdGNoRGF0YSkpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOS9v+eUqOmihOWKoOi9veeahOaVsOaNruihpeWFhee8uuWkseWtl+autVxuICAgICAgICAgICAgaWYgKCFyZXN1bHQuYmFzZV9zY29yZSAmJiBteWdsb2JhbC5hcmVuYU1hdGNoRGF0YS5iYXNlX3Njb3JlKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmJhc2Vfc2NvcmUgPSBteWdsb2JhbC5hcmVuYU1hdGNoRGF0YS5iYXNlX3Njb3JlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXJlc3VsdC5tdWx0aXBsaWVyICYmIG15Z2xvYmFsLmFyZW5hTWF0Y2hEYXRhLm11bHRpcGxpZXIpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQubXVsdGlwbGllciA9IG15Z2xvYmFsLmFyZW5hTWF0Y2hEYXRhLm11bHRpcGxpZXJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghcmVzdWx0Lm1hdGNoX3JvdW5kcyAmJiBteWdsb2JhbC5hcmVuYU1hdGNoRGF0YS5tYXRjaF9yb3VuZHMpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQubWF0Y2hfcm91bmRzID0gbXlnbG9iYWwuYXJlbmFNYXRjaERhdGEubWF0Y2hfcm91bmRzXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXJlc3VsdC5tYXRjaF9kdXJhdGlvbiAmJiBteWdsb2JhbC5hcmVuYU1hdGNoRGF0YS5tYXRjaF9kdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5tYXRjaF9kdXJhdGlvbiA9IG15Z2xvYmFsLmFyZW5hTWF0Y2hEYXRhLm1hdGNoX2R1cmF0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXJlc3VsdC5pbml0aWFsX2FyZW5hX2dvbGQgJiYgbXlnbG9iYWwuYXJlbmFNYXRjaERhdGEuaW5pdGlhbF9hcmVuYV9nb2xkKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmluaXRpYWxfYXJlbmFfZ29sZCA9IG15Z2xvYmFsLmFyZW5hTWF0Y2hEYXRhLmluaXRpYWxfYXJlbmFfZ29sZFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoaXNBcmVuYU1vZGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbX3Byb2Nlc3NSb29tRGF0YV0g56ue5oqA5Zy65qih5byPOiByb29tX2NhdGVnb3J5PTIsIHBsYXllcmRhdGHmlbDph489XCIgKyBwbGF5ZXJkYXRhX2xpc3QubGVuZ3RoICsgXCIsIOacn+WPtz1cIiArIHJlc3VsdC5wZXJpb2Rfbm8pXG4gICAgICAgIH1cblxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5L+d5a2Y5oi/6Ze057G75Z6L5Yiw5a6e5L6L5Y+Y6YeP77yM5L6bIHBsYXllcl9ub2RlIOS9v+eUqFxuICAgICAgICB0aGlzLl9yb29tQ2F0ZWdvcnkgPSByZXN1bHQucm9vbV9jYXRlZ29yeSB8fCAxXG4gICAgICAgIHRoaXMuX2lzQXJlbmFNb2RlID0gaXNBcmVuYU1vZGVcbiAgICAgICAgdGhpcy5fcGVyaW9kTm8gPSByZXN1bHQucGVyaW9kX25vIHx8IFwiXCIgLy8g8J+Up+OAkOaWsOWinuOAkeS/neWtmOacn+WPt1xuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeS/neWtmOW6leWIhuWSjOWAjeaVsFxuICAgICAgICB0aGlzLl9iYXNlU2NvcmUgPSByZXN1bHQuYmFzZV9zY29yZSB8fCAxXG4gICAgICAgIHRoaXMuX211bHRpcGxpZXIgPSByZXN1bHQubXVsdGlwbGllciB8fCAxXG4gICAgICAgIHRoaXMuX21hdGNoUm91bmRzID0gcmVzdWx0Lm1hdGNoX3JvdW5kcyB8fCAxXG4gICAgICAgIHRoaXMuX2luaXRpYWxBcmVuYUdvbGQgPSByZXN1bHQuaW5pdGlhbF9hcmVuYV9nb2xkIHx8IDEwMDBcblxuICAgICAgICB0aGlzLl9wbGF5ZXJkYXRhTGlzdCA9IHBsYXllcmRhdGFfbGlzdFxuXG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5yb29taWRfbGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMucm9vbWlkX2xhYmVsLnN0cmluZyA9IFwi5oi/6Ze05Y+3OlwiICsgcm9vbWlkXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+OriBb5ri45oiP5Zy65pmvXSByb29taWRfbGFiZWwg5pyq57uR5a6a77yBXCIpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkvJjljJbjgJHmm7TmlrDlupXliIblkozlgI3mlbDmoIfnrb5cbiAgICAgICAgaWYgKHRoaXMuZGlfbGFiZWwgJiYgcmVzdWx0LmJhc2Vfc2NvcmUpIHtcbiAgICAgICAgICAgIHRoaXMuZGlfbGFiZWwuc3RyaW5nID0gXCLlupU6XCIgKyByZXN1bHQuYmFzZV9zY29yZVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmJlaXNodV9sYWJlbCAmJiByZXN1bHQubXVsdGlwbGllcikge1xuICAgICAgICAgICAgdGhpcy5iZWlzaHVfbGFiZWwuc3RyaW5nID0gXCLlgI3mlbA6XCIgKyByZXN1bHQubXVsdGlwbGllclxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLmhvdXNlbWFuYWdlaWQgPSByZXN1bHQuaG91c2VtYW5hZ2VpZCB8fCByZXN1bHQuY3JlYXRvcl9pZCB8fCByZXN1bHQuY3JlYXRvcklkIHx8IFwiXCJcbiAgICAgICAgXG4gICAgICAgIGlmIChteWdsb2JhbC5zb2NrZXQgJiYgbXlnbG9iYWwuc29ja2V0LmdldFBsYXllckluZm8pIHtcbiAgICAgICAgICAgIHZhciBwbGF5ZXJJbmZvID0gbXlnbG9iYWwuc29ja2V0LmdldFBsYXllckluZm8oKVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwbGF5ZXJkYXRhX2xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+OriBbX3Byb2Nlc3NSb29tRGF0YV0g5re75Yqg546p5a626IqC54K5OiBcIiArIEpTT04uc3RyaW5naWZ5KHBsYXllcmRhdGFfbGlzdFtpXSkpXG4gICAgICAgICAgICB0aGlzLmFkZFBsYXllck5vZGUocGxheWVyZGF0YV9saXN0W2ldKVxuICAgICAgICB9XG4gICAgICAgIFxuXG4gICAgICAgIGlmIChpc29wZW5fc291bmQpIHtcbiAgICAgICAgICAgIGNjLmF1ZGlvRW5naW5lLnN0b3BBbGwoKVxuICAgICAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoXCJzb3VuZC9iZ1wiLCBjYy5BdWRpb0NsaXAsIGZ1bmN0aW9uKGVyciwgY2xpcCkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNjLmF1ZGlvRW5naW5lLnBsYXkoY2xpcCwgdHJ1ZSwgMSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBnYW1lYmVmb3JlX25vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJnYW1lYmVmb3JlVUlcIilcbiAgICAgICAgaWYgKGdhbWViZWZvcmVfbm9kZSkge1xuICAgICAgICAgICAgZ2FtZWJlZm9yZV9ub2RlLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgIGdhbWViZWZvcmVfbm9kZS56SW5kZXggPSAxMDAwXG4gICAgICAgICAgICBnYW1lYmVmb3JlX25vZGUuZW1pdChcImluaXRcIilcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeernuaKgOWcuuaooeW8j+S4i+S4jeaYvuekuuetieW+heeOqeWutlVJ77yI5omA5pyJ546p5a625bey5YiG6YWN5aW977yJXG4gICAgICAgIGlmIChpc0FyZW5hTW9kZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtfcHJvY2Vzc1Jvb21EYXRhXSDnq57mioDlnLrmqKHlvI/vvJrkuI3mmL7npLrnrYnlvoXnjqnlrrZVSe+8jOeOqeWutuaVsOmHjz1cIiArIHBsYXllcmRhdGFfbGlzdC5sZW5ndGgpXG4gICAgICAgICAgICAvLyDnq57mioDlnLrmqKHlvI/kuIvmiYDmnInnjqnlrrblupTor6Xlt7Lnu4/lh4blpIflpb3vvIznm7TmjqXnrYnlvoXmuLjmiI/lvIDlp4tcbiAgICAgICAgfSBlbHNlIGlmIChwbGF5ZXJkYXRhX2xpc3QubGVuZ3RoIDwgMykge1xuICAgICAgICAgICAgdGhpcy5fc2hvd1dhaXRpbmdVSSgzIC0gcGxheWVyZGF0YV9saXN0Lmxlbmd0aCwgcm9vbWlkKVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBfc2hvd1dhaXRpbmdVSTogZnVuY3Rpb24obmVlZFBsYXllcnMsIHJvb21Db2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB0aGlzLl9pc1dhaXRpbmdGb3JQbGF5ZXJzID0gdHJ1ZVxuICAgICAgICB0aGlzLl9uZWVkUGxheWVycyA9IG5lZWRQbGF5ZXJzXG4gICAgICAgIHRoaXMuX2N1cnJlbnRSb29tQ29kZSA9IHJvb21Db2RlIHx8IFwiXCJcblxuXG4gICAgICAgIHRoaXMuX2hpZGVXYWl0aW5nVUkoKVxuXG4gICAgICAgIHZhciBjYW52YXMgPSB0aGlzLm5vZGUuZ2V0Q29tcG9uZW50KGNjLkNhbnZhcykgfHwgY2MuZmluZCgnQ2FudmFzJykuZ2V0Q29tcG9uZW50KGNjLkNhbnZhcylcbiAgICAgICAgdmFyIHNjcmVlbkhlaWdodCA9IGNhbnZhcyA/IGNhbnZhcy5kZXNpZ25SZXNvbHV0aW9uLmhlaWdodCA6IDcyMFxuICAgICAgICB2YXIgc2NyZWVuV2lkdGggPSBjYW52YXMgPyBjYW52YXMuZGVzaWduUmVzb2x1dGlvbi53aWR0aCA6IDEyODBcblxuICAgICAgICB2YXIgd2FpdGluZ05vZGUgPSBuZXcgY2MuTm9kZShcIldhaXRpbmdGb3JQbGF5ZXJzVUlcIilcbiAgICAgICAgd2FpdGluZ05vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZShzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSlcbiAgICAgICAgd2FpdGluZ05vZGUuYW5jaG9yWCA9IDAuNVxuICAgICAgICB3YWl0aW5nTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgIHdhaXRpbmdOb2RlLnggPSAwXG4gICAgICAgIHdhaXRpbmdOb2RlLnkgPSAwXG4gICAgICAgIHdhaXRpbmdOb2RlLnBhcmVudCA9IHRoaXMubm9kZVxuICAgICAgICB0aGlzLl93YWl0aW5nVUlOb2RlID0gd2FpdGluZ05vZGVcblxuICAgICAgICBpZiAocm9vbUNvZGUpIHtcbiAgICAgICAgICAgIHZhciByb29tSW5mb05vZGUgPSBuZXcgY2MuTm9kZShcIlJvb21JbmZvXCIpXG4gICAgICAgICAgICByb29tSW5mb05vZGUueCA9IC1zY3JlZW5XaWR0aC8yICsgMjBcbiAgICAgICAgICAgIHJvb21JbmZvTm9kZS55ID0gc2NyZWVuSGVpZ2h0LzIgLSAzMFxuICAgICAgICAgICAgcm9vbUluZm9Ob2RlLmFuY2hvclggPSAwXG4gICAgICAgICAgICByb29tSW5mb05vZGUuYW5jaG9yWSA9IDAuNVxuXG4gICAgICAgICAgICB2YXIgcm9vbUxhYmVsID0gcm9vbUluZm9Ob2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgIHJvb21MYWJlbC5zdHJpbmcgPSBcIuaIv+mXtOWPtzogXCIgKyByb29tQ29kZVxuICAgICAgICAgICAgcm9vbUxhYmVsLmZvbnRTaXplID0gMjRcbiAgICAgICAgICAgIHJvb21MYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uTEVGVFxuICAgICAgICAgICAgcm9vbUluZm9Ob2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyMTUsIDApXG5cbiAgICAgICAgICAgIHZhciByb29tT3V0bGluZSA9IHJvb21JbmZvTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKVxuICAgICAgICAgICAgcm9vbU91dGxpbmUuY29sb3IgPSBjYy5jb2xvcigwLCAwLCAwKVxuICAgICAgICAgICAgcm9vbU91dGxpbmUud2lkdGggPSAyXG4gICAgICAgICAgICByb29tSW5mb05vZGUucGFyZW50ID0gd2FpdGluZ05vZGVcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZWF2ZUJ0bk5vZGUgPSBuZXcgY2MuTm9kZShcIkxlYXZlQnRuXCIpXG4gICAgICAgIGxlYXZlQnRuTm9kZS54ID0gc2NyZWVuV2lkdGgvMiAtIDEwMFxuICAgICAgICBsZWF2ZUJ0bk5vZGUueSA9IC1zY3JlZW5IZWlnaHQvMiArIDUwXG4gICAgICAgIGxlYXZlQnRuTm9kZS5hbmNob3JYID0gMC41XG4gICAgICAgIGxlYXZlQnRuTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgIGxlYXZlQnRuTm9kZS5zZXRDb250ZW50U2l6ZShjYy5zaXplKDE0MCwgNDApKVxuXG4gICAgICAgIHZhciBsZWF2ZUJ0bkJnID0gbGVhdmVCdG5Ob2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgbGVhdmVCdG5CZy5maWxsQ29sb3IgPSBjYy5jb2xvcigxODAsIDYwLCA2MCwgMjMwKVxuICAgICAgICBsZWF2ZUJ0bkJnLnJvdW5kUmVjdCgtNzAsIC0yMCwgMTQwLCA0MCwgOClcbiAgICAgICAgbGVhdmVCdG5CZy5maWxsKClcbiAgICAgICAgbGVhdmVCdG5CZy5zdHJva2VDb2xvciA9IGNjLmNvbG9yKDIyMCwgMTAwLCAxMDApXG4gICAgICAgIGxlYXZlQnRuQmcubGluZVdpZHRoID0gMlxuICAgICAgICBsZWF2ZUJ0bkJnLnJvdW5kUmVjdCgtNzAsIC0yMCwgMTQwLCA0MCwgOClcbiAgICAgICAgbGVhdmVCdG5CZy5zdHJva2UoKVxuICAgICAgICBsZWF2ZUJ0bk5vZGUucGFyZW50ID0gd2FpdGluZ05vZGVcblxuICAgICAgICB2YXIgbGVhdmVCdG5MYWJlbCA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIilcbiAgICAgICAgbGVhdmVCdG5MYWJlbC5hbmNob3JYID0gMC41XG4gICAgICAgIGxlYXZlQnRuTGFiZWwuYW5jaG9yWSA9IDAuNVxuICAgICAgICB2YXIgbGVhdmVMYWJlbCA9IGxlYXZlQnRuTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBsZWF2ZUxhYmVsLnN0cmluZyA9IFwi56a75byA5oi/6Ze0XCJcbiAgICAgICAgbGVhdmVMYWJlbC5mb250U2l6ZSA9IDIwXG4gICAgICAgIGxlYXZlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICBsZWF2ZUJ0bkxhYmVsLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgdmFyIGxlYXZlT3V0bGluZSA9IGxlYXZlQnRuTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSlcbiAgICAgICAgbGVhdmVPdXRsaW5lLmNvbG9yID0gY2MuY29sb3IoMTAwLCAzMCwgMzApXG4gICAgICAgIGxlYXZlT3V0bGluZS53aWR0aCA9IDJcbiAgICAgICAgbGVhdmVCdG5MYWJlbC5wYXJlbnQgPSBsZWF2ZUJ0bk5vZGVcblxuICAgICAgICBsZWF2ZUJ0bk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfU1RBUlQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbGVhdmVCdG5Ob2RlLnNjYWxlID0gMC45NVxuICAgICAgICB9KVxuICAgICAgICBsZWF2ZUJ0bk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGxlYXZlQnRuTm9kZS5zY2FsZSA9IDFcbiAgICAgICAgICAgIHNlbGYuX2xlYXZlUm9vbSgpXG4gICAgICAgIH0pXG4gICAgICAgIGxlYXZlQnRuTm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9DQU5DRUwsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbGVhdmVCdG5Ob2RlLnNjYWxlID0gMVxuICAgICAgICB9KVxuXG4gICAgICAgIHRoaXMuX3VwZGF0ZVdhaXRpbmdBbmltYXRpb24oKVxuICAgIH0sXG5cbiAgICBfdXBkYXRlV2FpdGluZ1VJOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc1dhaXRpbmdGb3JQbGF5ZXJzKSByZXR1cm5cblxuICAgICAgICB2YXIgY3VycmVudFBsYXllcnMgPSB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aFxuXG4gICAgICAgIGlmIChjdXJyZW50UGxheWVycyA+PSAzKSB7XG4gICAgICAgICAgICB0aGlzLl9oaWRlV2FpdGluZ1VJKClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfdXBkYXRlV2FpdGluZ0FuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICBpZiAoIXRoaXMuX2lzV2FpdGluZ0ZvclBsYXllcnMgfHwgIXRoaXMuX3dhaXRpbmdVSU5vZGUpIHJldHVyblxuICAgICAgICB0aGlzLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuX3VwZGF0ZVdhaXRpbmdBbmltYXRpb24oKVxuICAgICAgICB9LCAxLzYwKVxuICAgIH0sXG4gICAgXG4gICAgX2hpZGVXYWl0aW5nVUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9pc1dhaXRpbmdGb3JQbGF5ZXJzID0gZmFsc2VcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLl93YWl0aW5nVUlOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl93YWl0aW5nVUlOb2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgdGhpcy5fd2FpdGluZ1VJTm9kZSA9IG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9LFxuICAgIFxuICAgIF9sZWF2ZVJvb206IGZ1bmN0aW9uKCkge1xuICAgICAgICBcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIGlmIChteWdsb2JhbCAmJiBteWdsb2JhbC5zb2NrZXQpIHtcbiAgICAgICAgICAgIGlmIChteWdsb2JhbC5zb2NrZXQubGVhdmVSb29tKSB7XG4gICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LmxlYXZlUm9vbSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2hpZGVXYWl0aW5nVUkoKVxuICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIilcbiAgICB9LFxuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOOAkOaWsOWinuOAkea4uOaIj+eKtuaAgeaBouWkjeWkhOeQhlxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIOWkhOeQhua4uOaIj+eKtuaAgeaBouWkjeS6i+S7tlxuICAgICAqL1xuICAgIF9vbkdhbWVTdGF0ZVJlc3RvcmVkOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDnjqnlrrboioLngrnnmoTnirbmgIFcbiAgICAgICAgaWYgKGRhdGEucGxheWVycykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLnBsYXllck5vZGVMaXN0W2ldXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vZGVTY3JpcHQgPSBub2RlLmdldENvbXBvbmVudChcInBsYXllcl9ub2RlXCIpXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlU2NyaXB0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmn6Xmib7lr7nlupTnmoTnjqnlrrbmlbDmja5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGF0YS5wbGF5ZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSBkYXRhLnBsYXllcnNbal1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocC5pZCA9PT0gbm9kZVNjcmlwdC5hY2NvdW50aWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5pu05paw546p5a6254q25oCBXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInBsYXllcl9zdGF0ZV91cGRhdGVcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGU6IHAuc3RhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXJkc19jb3VudDogcC5jYXJkc19jb3VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzX2xhbmRsb3JkOiBwLmlzX2xhbmRsb3JkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDpmpDol48gZ2FtZWJlZm9yZVVJXG4gICAgICAgIHZhciBnYW1lYmVmb3JlX25vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJnYW1lYmVmb3JlVUlcIilcbiAgICAgICAgaWYgKGdhbWViZWZvcmVfbm9kZSkge1xuICAgICAgICAgICAgZ2FtZWJlZm9yZV9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOaYvuekuiBnYW1laW5nVUlcbiAgICAgICAgdmFyIGdhbWVpbmdfbm9kZSA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcImdhbWVpbmdVSVwiKVxuICAgICAgICBpZiAoZ2FtZWluZ19ub2RlKSB7XG4gICAgICAgICAgICBnYW1laW5nX25vZGUuYWN0aXZlID0gdHJ1ZVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDlpITnkIbnjqnlrrbmjonnur/pgJrnn6VcbiAgICAgKi9cbiAgICBfb25QbGF5ZXJPZmZsaW5lOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIFxuICAgICAgICAvLyDpgJrnn6XmiYDmnInnjqnlrrboioLngrnmm7TmlrDnirbmgIFcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGVTY3JpcHQgPSBub2RlLmdldENvbXBvbmVudChcInBsYXllcl9ub2RlXCIpXG4gICAgICAgICAgICAgICAgaWYgKG5vZGVTY3JpcHQgJiYgbm9kZVNjcmlwdC5hY2NvdW50aWQgPT09IGRhdGEucGxheWVyX2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuZW1pdChcInBsYXllcl9zdGF0ZV91cGRhdGVcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGU6IFwib2ZmbGluZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dDogZGF0YS50aW1lb3V0XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDlpITnkIbnjqnlrrbkuIrnur/pgJrnn6VcbiAgICAgKi9cbiAgICBfb25QbGF5ZXJPbmxpbmU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIOmAmuefpeaJgOacieeOqeWutuiKgueCueabtOaWsOeKtuaAgVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGxheWVyTm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZVNjcmlwdCA9IG5vZGUuZ2V0Q29tcG9uZW50KFwicGxheWVyX25vZGVcIilcbiAgICAgICAgICAgICAgICBpZiAobm9kZVNjcmlwdCAmJiBub2RlU2NyaXB0LmFjY291bnRpZCA9PT0gZGF0YS5wbGF5ZXJfaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5lbWl0KFwicGxheWVyX3N0YXRlX3VwZGF0ZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZTogXCJvbmxpbmVcIlxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5aSE55CG546p5a6256a75byA6YCa55+lXG4gICAgICog5b2T5pS25Yiw5pyN5Yqh56uv55qEIHBsYXllcl9sZWZ0IOa2iOaBr+aXtu+8jOenu+mZpOWvueW6lOeahOeOqeWutuiKgueCuVxuICAgICAqL1xuICAgIF9vblBsYXllckxlZnQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCLwn5GLIFtfb25QbGF5ZXJMZWZ0XSDlpITnkIbnjqnlrrbnprvlvIAsIHBsYXllcl9pZDpcIiwgZGF0YS5wbGF5ZXJfaWQsIFwicGxheWVyX25hbWU6XCIsIGRhdGEucGxheWVyX25hbWUpXG4gICAgICAgIFxuICAgICAgICB2YXIgcGxheWVySWQgPSBkYXRhLnBsYXllcl9pZFxuICAgICAgICBpZiAoIXBsYXllcklkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn5GLIFtfb25QbGF5ZXJMZWZ0XSDnvLrlsJEgcGxheWVyX2lkXCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5LuOIHBsYXllck5vZGVMaXN0IOS4reafpeaJvuW5tuenu+mZpOeOqeWutuiKgueCuVxuICAgICAgICB2YXIgcmVtb3ZlZEluZGV4ID0gLTFcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGVTY3JpcHQgPSBub2RlLmdldENvbXBvbmVudChcInBsYXllcl9ub2RlXCIpXG4gICAgICAgICAgICAgICAgaWYgKG5vZGVTY3JpcHQgJiYgbm9kZVNjcmlwdC5hY2NvdW50aWQgPT09IHBsYXllcklkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+RiyBbX29uUGxheWVyTGVmdF0g5om+5Yiw56a75byA55qE546p5a626IqC54K577yM5YeG5aSH56e76ZmkOlwiLCBwbGF5ZXJJZClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOmUgOavgeiKgueCuVxuICAgICAgICAgICAgICAgICAgICBub2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5LuO5YiX6KGo5Lit56e76ZmkXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGxheWVyTm9kZUxpc3Quc3BsaWNlKGksIDEpXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZWRJbmRleCA9IGlcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOS7jiBfcGxheWVyZGF0YUxpc3Qg5Lit56e76Zmk546p5a625pWw5o2uXG4gICAgICAgIGlmICh0aGlzLl9wbGF5ZXJkYXRhTGlzdCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9wbGF5ZXJkYXRhTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9wbGF5ZXJkYXRhTGlzdFtpXS5hY2NvdW50aWQgPT09IHBsYXllcklkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BsYXllcmRhdGFMaXN0LnNwbGljZShpLCAxKVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfkYsgW19vblBsYXllckxlZnRdIOS7jueOqeWutuaVsOaNruWIl+ihqOS4reenu+mZpDpcIiwgcGxheWVySWQpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlpoLmnpzlvZPliY3njqnlrrbmlbDph4/kuI3otrMz5Lq677yM5pi+56S6562J5b6FVUlcbiAgICAgICAgdmFyIGN1cnJlbnRDb3VudCA9IHRoaXMucGxheWVyTm9kZUxpc3QubGVuZ3RoXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+RiyBbX29uUGxheWVyTGVmdF0g5b2T5YmN546p5a625pWw6YePOlwiLCBjdXJyZW50Q291bnQpXG4gICAgICAgIFxuICAgICAgICAvLyDmo4Dmn6XmmK/lkKbmmK/nq57mioDlnLrmqKHlvI9cbiAgICAgICAgdmFyIGlzQXJlbmFNb2RlID0gdGhpcy5faXNBcmVuYU1vZGUgfHwgZmFsc2VcbiAgICAgICAgXG4gICAgICAgIGlmICghaXNBcmVuYU1vZGUgJiYgY3VycmVudENvdW50IDwgMyAmJiAhdGhpcy5faXNXYWl0aW5nRm9yUGxheWVycykge1xuICAgICAgICAgICAgLy8g5pmu6YCa5qih5byP5LiL77yM546p5a6256a75byA5ZCO5pi+56S6562J5b6FVUlcbiAgICAgICAgICAgIHZhciByb29tQ29kZSA9IHRoaXMuX2N1cnJlbnRSb29tQ29kZSB8fCBcIlwiXG4gICAgICAgICAgICBpZiAodGhpcy5yb29taWRfbGFiZWwpIHtcbiAgICAgICAgICAgICAgICByb29tQ29kZSA9IHRoaXMucm9vbWlkX2xhYmVsLnN0cmluZy5yZXBsYWNlKFwi5oi/6Ze05Y+3OlwiLCBcIlwiKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc2hvd1dhaXRpbmdVSSgzIC0gY3VycmVudENvdW50LCByb29tQ29kZSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw5oi/5Li75L+h5oGv77yI5aaC5p6c56a75byA55qE5piv5oi/5Li777yJXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAobXlnbG9iYWwgJiYgbXlnbG9iYWwucGxheWVyRGF0YSkge1xuICAgICAgICAgICAgLy8g5pyN5Yqh56uv5Lya5ZyoIHBsYXllcl9sZWZ0IOa2iOaBr+S4reWMheWQq+aWsOeahOaIv+S4u0lE77yI5aaC5p6c6ZyA6KaB77yJXG4gICAgICAgICAgICBpZiAoZGF0YS5uZXdfY3JlYXRvcl9pZCkge1xuICAgICAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEuaG91c2VtYW5hZ2VpZCA9IGRhdGEubmV3X2NyZWF0b3JfaWRcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfkYsgW19vblBsYXllckxlZnRdIOaWsOaIv+S4u0lEOlwiLCBkYXRhLm5ld19jcmVhdG9yX2lkKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDjgJDmlrDlop7jgJHnq57mioDlnLrnrYnlvoVVSSAtIOWcqOa4uOaIj+WcuuaZr+S4reaYvuekulxuICAgIC8vIOS7heeUqOS6juernuaKgOWcuuaooeW8j++8iHJvb21fY2F0ZWdvcnkgPT09IDLvvIlcbiAgICAvLyDmma7pgJrlnLrkuI3kvb/nlKjmraTnrYnlvoXnlYzpnaJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICAvKipcbiAgICAgKiDmmL7npLrnq57mioDlnLrnrYnlvoVVSVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0geyBwZXJpb2Rfbm8sIHJvdW5kLCB0b3RhbF9yb3VuZHMsIGZpbmlzaGVkX3RhYmxlcywgdG90YWxfdGFibGVzLCBzdGF0dXMgfVxuICAgICAqL1xuICAgIF9zaG93QXJlbmFXYWl0aW5nVUk6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgLy8g5LuF5Zyo56ue5oqA5Zy65qih5byP5LiL5pi+56S6XG4gICAgICAgIGlmICghdGhpcy5faXNBcmVuYU1vZGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbX3Nob3dBcmVuYVdhaXRpbmdVSV0g6Z2e56ue5oqA5Zy65qih5byP77yM5LiN5pi+56S6562J5b6FVUlcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW19zaG93QXJlbmFXYWl0aW5nVUldIOaYvuekuuernuaKgOWcuuetieW+hVVJOlwiLCBKU09OLnN0cmluZ2lmeShkYXRhKSlcbiAgICAgICAgXG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICBcbiAgICAgICAgLy8g5YWI6ZqQ6JeP5bey5pyJ55qE562J5b6FVUlcbiAgICAgICAgdGhpcy5faGlkZUFyZW5hV2FpdGluZ1VJKClcbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPlueUu+W4g+WwuuWvuFxuICAgICAgICB2YXIgY2FudmFzID0gdGhpcy5ub2RlLmdldENvbXBvbmVudChjYy5DYW52YXMpIHx8IGNjLmZpbmQoJ0NhbnZhcycpLmdldENvbXBvbmVudChjYy5DYW52YXMpXG4gICAgICAgIHZhciBzY3JlZW5IZWlnaHQgPSBjYW52YXMgPyBjYW52YXMuZGVzaWduUmVzb2x1dGlvbi5oZWlnaHQgOiA3MjBcbiAgICAgICAgdmFyIHNjcmVlbldpZHRoID0gY2FudmFzID8gY2FudmFzLmRlc2lnblJlc29sdXRpb24ud2lkdGggOiAxMjgwXG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7rnrYnlvoVVSeWuueWZqFxuICAgICAgICB2YXIgd2FpdGluZ05vZGUgPSBuZXcgY2MuTm9kZShcIkFyZW5hV2FpdGluZ1VJXCIpXG4gICAgICAgIHdhaXRpbmdOb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCkpXG4gICAgICAgIHdhaXRpbmdOb2RlLmFuY2hvclggPSAwLjVcbiAgICAgICAgd2FpdGluZ05vZGUuYW5jaG9yWSA9IDAuNVxuICAgICAgICB3YWl0aW5nTm9kZS54ID0gMFxuICAgICAgICB3YWl0aW5nTm9kZS55ID0gMFxuICAgICAgICB3YWl0aW5nTm9kZS56SW5kZXggPSAyMDAwICAvLyDnoa7kv53lnKjmnIDkuIrlsYJcbiAgICAgICAgd2FpdGluZ05vZGUucGFyZW50ID0gdGhpcy5ub2RlXG4gICAgICAgIHRoaXMuX2FyZW5hV2FpdGluZ1VJTm9kZSA9IHdhaXRpbmdOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDlrZjlgqjmlbDmja5cbiAgICAgICAgdGhpcy5fYXJlbmFXYWl0aW5nRGF0YSA9IHtcbiAgICAgICAgICAgIHBlcmlvZE5vOiBkYXRhLnBlcmlvZF9ubyB8fCBcIlwiLFxuICAgICAgICAgICAgcm91bmQ6IGRhdGEucm91bmQgfHwgMSxcbiAgICAgICAgICAgIHRvdGFsUm91bmRzOiBkYXRhLnRvdGFsX3JvdW5kcyB8fCAxLFxuICAgICAgICAgICAgZmluaXNoZWRUYWJsZXM6IGRhdGEuZmluaXNoZWRfdGFibGVzIHx8IDAsXG4gICAgICAgICAgICB0b3RhbFRhYmxlczogZGF0YS50b3RhbF90YWJsZXMgfHwgMCxcbiAgICAgICAgICAgIHN0YXR1czogZGF0YS5zdGF0dXMgfHwgXCJXQUlUSU5HXCJcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSAxLiDljYrpgI/mmI7og4zmma8gPT09PT09PT09PVxuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCZ1wiKVxuICAgICAgICB2YXIgYmdHcmFwaGljcyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGJnR3JhcGhpY3MuZmlsbENvbG9yID0gY2MuY29sb3IoMCwgMCwgMCwgMTgwKVxuICAgICAgICBiZ0dyYXBoaWNzLnJlY3QoLXNjcmVlbldpZHRoLzIsIC1zY3JlZW5IZWlnaHQvMiwgc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodClcbiAgICAgICAgYmdHcmFwaGljcy5maWxsKClcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IHdhaXRpbmdOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IDIuIOS4reWkruWNoeeJh+iDjOaZryA9PT09PT09PT09XG4gICAgICAgIHZhciBjYXJkV2lkdGggPSA0MDBcbiAgICAgICAgdmFyIGNhcmRIZWlnaHQgPSAyODBcbiAgICAgICAgdmFyIGNhcmROb2RlID0gbmV3IGNjLk5vZGUoXCJDYXJkXCIpXG4gICAgICAgIGNhcmROb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoY2FyZFdpZHRoLCBjYXJkSGVpZ2h0KSlcbiAgICAgICAgY2FyZE5vZGUuYW5jaG9yWCA9IDAuNVxuICAgICAgICBjYXJkTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgIGNhcmROb2RlLnggPSAwXG4gICAgICAgIGNhcmROb2RlLnkgPSAwXG4gICAgICAgIFxuICAgICAgICB2YXIgY2FyZEJnID0gY2FyZE5vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBjYXJkQmcuZmlsbENvbG9yID0gY2MuY29sb3IoMzAsIDYwLCAxMDAsIDIzMClcbiAgICAgICAgY2FyZEJnLnJvdW5kUmVjdCgtY2FyZFdpZHRoLzIsIC1jYXJkSGVpZ2h0LzIsIGNhcmRXaWR0aCwgY2FyZEhlaWdodCwgMTUpXG4gICAgICAgIGNhcmRCZy5maWxsKClcbiAgICAgICAgY2FyZEJnLnN0cm9rZUNvbG9yID0gY2MuY29sb3IoMjU1LCAyMTUsIDApXG4gICAgICAgIGNhcmRCZy5saW5lV2lkdGggPSAzXG4gICAgICAgIGNhcmRCZy5yb3VuZFJlY3QoLWNhcmRXaWR0aC8yLCAtY2FyZEhlaWdodC8yLCBjYXJkV2lkdGgsIGNhcmRIZWlnaHQsIDE1KVxuICAgICAgICBjYXJkQmcuc3Ryb2tlKClcbiAgICAgICAgY2FyZE5vZGUucGFyZW50ID0gd2FpdGluZ05vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0gMy4g5qCH6aKYID09PT09PT09PT1cbiAgICAgICAgdmFyIHRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIilcbiAgICAgICAgdGl0bGVOb2RlLnkgPSBjYXJkSGVpZ2h0LzIgLSAzNVxuICAgICAgICB2YXIgdGl0bGVMYWJlbCA9IHRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHRpdGxlTGFiZWwuc3RyaW5nID0gXCLwn4+GIOernuaKgOWcuuetieW+heS4rVwiXG4gICAgICAgIHRpdGxlTGFiZWwuZm9udFNpemUgPSAyOFxuICAgICAgICB0aXRsZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgdGl0bGVOb2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyMTUsIDApXG4gICAgICAgIHZhciB0aXRsZU91dGxpbmUgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSlcbiAgICAgICAgdGl0bGVPdXRsaW5lLmNvbG9yID0gY2MuY29sb3IoMCwgMCwgMClcbiAgICAgICAgdGl0bGVPdXRsaW5lLndpZHRoID0gMlxuICAgICAgICB0aXRsZU5vZGUucGFyZW50ID0gY2FyZE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0gNC4g5pyf5Y+35qCH562+ID09PT09PT09PT1cbiAgICAgICAgdGhpcy5fYXJlbmFQZXJpb2RMYWJlbCA9IG5ldyBjYy5Ob2RlKFwiUGVyaW9kTGFiZWxcIilcbiAgICAgICAgdGhpcy5fYXJlbmFQZXJpb2RMYWJlbC55ID0gY2FyZEhlaWdodC8yIC0gODBcbiAgICAgICAgdmFyIHBlcmlvZExhYmVsID0gdGhpcy5fYXJlbmFQZXJpb2RMYWJlbC5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHBlcmlvZExhYmVsLnN0cmluZyA9IFwi56ysIFwiICsgKGRhdGEucGVyaW9kX25vIHx8IFwiLS1cIikgKyBcIiDmnJ9cIlxuICAgICAgICBwZXJpb2RMYWJlbC5mb250U2l6ZSA9IDIwXG4gICAgICAgIHBlcmlvZExhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgdGhpcy5fYXJlbmFQZXJpb2RMYWJlbC5jb2xvciA9IGNjLmNvbG9yKDIwMCwgMjAwLCAyMjApXG4gICAgICAgIHRoaXMuX2FyZW5hUGVyaW9kTGFiZWwucGFyZW50ID0gY2FyZE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0gNS4g6L2u5qyh5qCH562+ID09PT09PT09PT1cbiAgICAgICAgdGhpcy5fYXJlbmFSb3VuZExhYmVsID0gbmV3IGNjLk5vZGUoXCJSb3VuZExhYmVsXCIpXG4gICAgICAgIHRoaXMuX2FyZW5hUm91bmRMYWJlbC55ID0gY2FyZEhlaWdodC8yIC0gMTEwXG4gICAgICAgIHZhciByb3VuZExhYmVsID0gdGhpcy5fYXJlbmFSb3VuZExhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgcm91bmRMYWJlbC5zdHJpbmcgPSBcIuesrCBcIiArIChkYXRhLnJvdW5kIHx8IDEpICsgXCIg6L2uIC8g5YWxIFwiICsgKGRhdGEudG90YWxfcm91bmRzIHx8IDEpICsgXCIg6L2uXCJcbiAgICAgICAgcm91bmRMYWJlbC5mb250U2l6ZSA9IDE4XG4gICAgICAgIHJvdW5kTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICB0aGlzLl9hcmVuYVJvdW5kTGFiZWwuY29sb3IgPSBjYy5jb2xvcigxODAsIDE4MCwgMjAwKVxuICAgICAgICB0aGlzLl9hcmVuYVJvdW5kTGFiZWwucGFyZW50ID0gY2FyZE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0gNS41IOmHkeW4geaYvuekuiA9PT09PT09PT09XG4gICAgICAgIHRoaXMuX2FyZW5hQ29pbkxhYmVsID0gbmV3IGNjLk5vZGUoXCJDb2luTGFiZWxcIilcbiAgICAgICAgdGhpcy5fYXJlbmFDb2luTGFiZWwueSA9IGNhcmRIZWlnaHQvMiAtIDE0MFxuICAgICAgICB2YXIgY29pbkxhYmVsID0gdGhpcy5fYXJlbmFDb2luTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAvLyDojrflj5blvZPliY3njqnlrrbnmoTnq57mioDph5HluIFcbiAgICAgICAgdmFyIG15TWF0Y2hDb2luID0gdGhpcy5fZ2V0TXlNYXRjaENvaW4gPyB0aGlzLl9nZXRNeU1hdGNoQ29pbigpIDogMFxuICAgICAgICBjb2luTGFiZWwuc3RyaW5nID0gXCLwn5KwIOW9k+WJjemHkeW4gTogXCIgKyBteU1hdGNoQ29pblxuICAgICAgICBjb2luTGFiZWwuZm9udFNpemUgPSAxOFxuICAgICAgICBjb2luTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICB0aGlzLl9hcmVuYUNvaW5MYWJlbC5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjE1LCAwKVxuICAgICAgICB0aGlzLl9hcmVuYUNvaW5MYWJlbC5wYXJlbnQgPSBjYXJkTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSA2LiDov5vluqbmnaEgPT09PT09PT09PVxuICAgICAgICB0aGlzLl9hcmVuYVByb2dyZXNzQmFyID0gbmV3IGNjLk5vZGUoXCJQcm9ncmVzc0JhclwiKVxuICAgICAgICB0aGlzLl9hcmVuYVByb2dyZXNzQmFyLnNldENvbnRlbnRTaXplKGNjLnNpemUoMzIwLCAyMCkpXG4gICAgICAgIHRoaXMuX2FyZW5hUHJvZ3Jlc3NCYXIueSA9IDBcbiAgICAgICAgXG4gICAgICAgIC8vIOi/m+W6puadoeiDjOaZr1xuICAgICAgICB2YXIgcHJvZ3Jlc3NCZyA9IHRoaXMuX2FyZW5hUHJvZ3Jlc3NCYXIuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBwcm9ncmVzc0JnLmZpbGxDb2xvciA9IGNjLmNvbG9yKDUwLCA1MCwgNzAsIDIwMClcbiAgICAgICAgcHJvZ3Jlc3NCZy5yb3VuZFJlY3QoLTE2MCwgLTEwLCAzMjAsIDIwLCA1KVxuICAgICAgICBwcm9ncmVzc0JnLmZpbGwoKVxuICAgICAgICB0aGlzLl9hcmVuYVByb2dyZXNzQmFyLnBhcmVudCA9IGNhcmROb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDov5vluqbmnaHloavlhYXvvIjliJ3lp4vkuLow77yJXG4gICAgICAgIHRoaXMuX2FyZW5hUHJvZ3Jlc3NGaWxsID0gbmV3IGNjLk5vZGUoXCJQcm9ncmVzc0ZpbGxcIilcbiAgICAgICAgdGhpcy5fYXJlbmFQcm9ncmVzc0ZpbGwueSA9IDBcbiAgICAgICAgdmFyIGZpbGxHcmFwaGljcyA9IHRoaXMuX2FyZW5hUHJvZ3Jlc3NGaWxsLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgdGhpcy5fYXJlbmFQcm9ncmVzc0ZpbGwuX2dyYXBoaWNzID0gZmlsbEdyYXBoaWNzXG4gICAgICAgIHRoaXMuX2FyZW5hUHJvZ3Jlc3NGaWxsLnBhcmVudCA9IGNhcmROb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IDcuIOi/m+W6puaWh+WtlyA9PT09PT09PT09XG4gICAgICAgIHRoaXMuX2FyZW5hUHJvZ3Jlc3NMYWJlbCA9IG5ldyBjYy5Ob2RlKFwiUHJvZ3Jlc3NMYWJlbFwiKVxuICAgICAgICB0aGlzLl9hcmVuYVByb2dyZXNzTGFiZWwueSA9IC00MFxuICAgICAgICB2YXIgcHJvZ3Jlc3NMYWJlbCA9IHRoaXMuX2FyZW5hUHJvZ3Jlc3NMYWJlbC5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHByb2dyZXNzTGFiZWwuc3RyaW5nID0gKGRhdGEuZmluaXNoZWRfdGFibGVzIHx8IDApICsgXCIgLyBcIiArIChkYXRhLnRvdGFsX3RhYmxlcyB8fCAwKVxuICAgICAgICBwcm9ncmVzc0xhYmVsLmZvbnRTaXplID0gMjRcbiAgICAgICAgcHJvZ3Jlc3NMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHRoaXMuX2FyZW5hUHJvZ3Jlc3NMYWJlbC5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIHRoaXMuX2FyZW5hUHJvZ3Jlc3NMYWJlbC5wYXJlbnQgPSBjYXJkTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSA4LiDnirbmgIHmj5DnpLogPT09PT09PT09PVxuICAgICAgICB0aGlzLl9hcmVuYVN0YXR1c0xhYmVsID0gbmV3IGNjLk5vZGUoXCJTdGF0dXNMYWJlbFwiKVxuICAgICAgICB0aGlzLl9hcmVuYVN0YXR1c0xhYmVsLnkgPSAtODBcbiAgICAgICAgdmFyIHN0YXR1c0xhYmVsID0gdGhpcy5fYXJlbmFTdGF0dXNMYWJlbC5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHN0YXR1c0xhYmVsLnN0cmluZyA9IFwi5q2j5Zyo562J5b6F5YW25LuW546p5a625a6M5oiQLi4uXCJcbiAgICAgICAgc3RhdHVzTGFiZWwuZm9udFNpemUgPSAxNlxuICAgICAgICBzdGF0dXNMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHRoaXMuX2FyZW5hU3RhdHVzTGFiZWwuY29sb3IgPSBjYy5jb2xvcigxNTAsIDIwMCwgMjU1KVxuICAgICAgICB0aGlzLl9hcmVuYVN0YXR1c0xhYmVsLnBhcmVudCA9IGNhcmROb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IDkuIExvYWRpbmfliqjnlLvvvIjml4vovazmiZHlhYvniYzvvIk9PT09PT09PT09XG4gICAgICAgIHRoaXMuX2FyZW5hTG9hZGluZ05vZGUgPSBuZXcgY2MuTm9kZShcIkxvYWRpbmdOb2RlXCIpXG4gICAgICAgIHRoaXMuX2FyZW5hTG9hZGluZ05vZGUueSA9IC0xMjBcbiAgICAgICAgdmFyIGxvYWRpbmdTcHJpdGUgPSB0aGlzLl9hcmVuYUxvYWRpbmdOb2RlLmFkZENvbXBvbmVudChjYy5TcHJpdGUpXG4gICAgICAgIC8vIOWwneivleWKoOi9veaJkeWFi+eJjOWbvueJh1xuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZCgnVUkvY2FyZF9iYWNrJywgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVyciwgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgIGlmICghZXJyICYmIHNwcml0ZUZyYW1lICYmIGxvYWRpbmdTcHJpdGUpIHtcbiAgICAgICAgICAgICAgICBsb2FkaW5nU3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgdGhpcy5fYXJlbmFMb2FkaW5nTm9kZS5zY2FsZSA9IDAuNVxuICAgICAgICB0aGlzLl9hcmVuYUxvYWRpbmdOb2RlLnBhcmVudCA9IGNhcmROb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDlkK/liqjml4vovazliqjnlLtcbiAgICAgICAgdGhpcy5fc3RhcnRBcmVuYUxvYWRpbmdBbmltYXRpb24oKVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05pawVUlcbiAgICAgICAgdGhpcy5fdXBkYXRlQXJlbmFXYWl0aW5nVUkoZGF0YSlcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbX3Nob3dBcmVuYVdhaXRpbmdVSV0g56ue5oqA5Zy6562J5b6FVUnlt7LliJvlu7pcIilcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOmakOiXj+ernuaKgOWcuuetieW+hVVJXG4gICAgICovXG4gICAgX2hpZGVBcmVuYVdhaXRpbmdVSTogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOWBnOatouWKqOeUu1xuICAgICAgICB0aGlzLl9zdG9wQXJlbmFMb2FkaW5nQW5pbWF0aW9uKClcbiAgICAgICAgXG4gICAgICAgIC8vIOmUgOavgeiKgueCuVxuICAgICAgICBpZiAodGhpcy5fYXJlbmFXYWl0aW5nVUlOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9hcmVuYVdhaXRpbmdVSU5vZGUuZGVzdHJveSgpXG4gICAgICAgICAgICB0aGlzLl9hcmVuYVdhaXRpbmdVSU5vZGUgPSBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOa4heeQhuW8leeUqFxuICAgICAgICB0aGlzLl9hcmVuYVBlcmlvZExhYmVsID0gbnVsbFxuICAgICAgICB0aGlzLl9hcmVuYVJvdW5kTGFiZWwgPSBudWxsXG4gICAgICAgIHRoaXMuX2FyZW5hQ29pbkxhYmVsID0gbnVsbFxuICAgICAgICB0aGlzLl9hcmVuYVByb2dyZXNzQmFyID0gbnVsbFxuICAgICAgICB0aGlzLl9hcmVuYVByb2dyZXNzRmlsbCA9IG51bGxcbiAgICAgICAgdGhpcy5fYXJlbmFQcm9ncmVzc0xhYmVsID0gbnVsbFxuICAgICAgICB0aGlzLl9hcmVuYVN0YXR1c0xhYmVsID0gbnVsbFxuICAgICAgICB0aGlzLl9hcmVuYUxvYWRpbmdOb2RlID0gbnVsbFxuICAgICAgICB0aGlzLl9hcmVuYVdhaXRpbmdEYXRhID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtfaGlkZUFyZW5hV2FpdGluZ1VJXSDnq57mioDlnLrnrYnlvoVVSeW3sumakOiXj1wiKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog5pu05paw56ue5oqA5Zy6562J5b6FVUlcbiAgICAgKi9cbiAgICBfdXBkYXRlQXJlbmFXYWl0aW5nVUk6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9hcmVuYVdhaXRpbmdVSU5vZGUpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw5a2Y5YKo55qE5pWw5o2uXG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICB0aGlzLl9hcmVuYVdhaXRpbmdEYXRhID0ge1xuICAgICAgICAgICAgICAgIHBlcmlvZE5vOiBkYXRhLnBlcmlvZF9ubyB8fCB0aGlzLl9hcmVuYVdhaXRpbmdEYXRhLnBlcmlvZE5vLFxuICAgICAgICAgICAgICAgIHJvdW5kOiBkYXRhLnJvdW5kIHx8IHRoaXMuX2FyZW5hV2FpdGluZ0RhdGEucm91bmQsXG4gICAgICAgICAgICAgICAgdG90YWxSb3VuZHM6IGRhdGEudG90YWxfcm91bmRzIHx8IHRoaXMuX2FyZW5hV2FpdGluZ0RhdGEudG90YWxSb3VuZHMsXG4gICAgICAgICAgICAgICAgZmluaXNoZWRUYWJsZXM6IGRhdGEuZmluaXNoZWRfdGFibGVzIHx8IHRoaXMuX2FyZW5hV2FpdGluZ0RhdGEuZmluaXNoZWRUYWJsZXMsXG4gICAgICAgICAgICAgICAgdG90YWxUYWJsZXM6IGRhdGEudG90YWxfdGFibGVzIHx8IHRoaXMuX2FyZW5hV2FpdGluZ0RhdGEudG90YWxUYWJsZXMsXG4gICAgICAgICAgICAgICAgc3RhdHVzOiBkYXRhLnN0YXR1cyB8fCB0aGlzLl9hcmVuYVdhaXRpbmdEYXRhLnN0YXR1c1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgZCA9IHRoaXMuX2FyZW5hV2FpdGluZ0RhdGFcbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOacn+WPt1xuICAgICAgICBpZiAodGhpcy5fYXJlbmFQZXJpb2RMYWJlbCkge1xuICAgICAgICAgICAgdmFyIHBlcmlvZExhYmVsID0gdGhpcy5fYXJlbmFQZXJpb2RMYWJlbC5nZXRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICBpZiAocGVyaW9kTGFiZWwpIHtcbiAgICAgICAgICAgICAgICBwZXJpb2RMYWJlbC5zdHJpbmcgPSBcIuesrCBcIiArIChkLnBlcmlvZE5vIHx8IFwiLS1cIikgKyBcIiDmnJ9cIlxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDova7mrKFcbiAgICAgICAgaWYgKHRoaXMuX2FyZW5hUm91bmRMYWJlbCkge1xuICAgICAgICAgICAgdmFyIHJvdW5kTGFiZWwgPSB0aGlzLl9hcmVuYVJvdW5kTGFiZWwuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgaWYgKHJvdW5kTGFiZWwpIHtcbiAgICAgICAgICAgICAgICByb3VuZExhYmVsLnN0cmluZyA9IFwi56ysIFwiICsgZC5yb3VuZCArIFwiIOi9riAvIOWFsSBcIiArIGQudG90YWxSb3VuZHMgKyBcIiDova5cIlxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDov5vluqbmloflrZdcbiAgICAgICAgaWYgKHRoaXMuX2FyZW5hUHJvZ3Jlc3NMYWJlbCkge1xuICAgICAgICAgICAgdmFyIHByb2dyZXNzTGFiZWwgPSB0aGlzLl9hcmVuYVByb2dyZXNzTGFiZWwuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgaWYgKHByb2dyZXNzTGFiZWwpIHtcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0xhYmVsLnN0cmluZyA9IGQuZmluaXNoZWRUYWJsZXMgKyBcIiAvIFwiICsgZC50b3RhbFRhYmxlc1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDov5vluqbmnaFcbiAgICAgICAgaWYgKHRoaXMuX2FyZW5hUHJvZ3Jlc3NGaWxsICYmIGQudG90YWxUYWJsZXMgPiAwKSB7XG4gICAgICAgICAgICB2YXIgcHJvZ3Jlc3MgPSBNYXRoLm1pbihkLmZpbmlzaGVkVGFibGVzIC8gZC50b3RhbFRhYmxlcywgMS4wKVxuICAgICAgICAgICAgdmFyIGJhcldpZHRoID0gMzIwICogcHJvZ3Jlc3NcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGdyYXBoaWNzID0gdGhpcy5fYXJlbmFQcm9ncmVzc0ZpbGwuX2dyYXBoaWNzXG4gICAgICAgICAgICBpZiAoZ3JhcGhpY3MpIHtcbiAgICAgICAgICAgICAgICBncmFwaGljcy5jbGVhcigpXG4gICAgICAgICAgICAgICAgaWYgKGJhcldpZHRoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBncmFwaGljcy5maWxsQ29sb3IgPSBjYy5jb2xvcigxMDAsIDIwMCwgMTAwLCAyNTUpXG4gICAgICAgICAgICAgICAgICAgIGdyYXBoaWNzLnJvdW5kUmVjdCgtMTYwLCAtOCwgYmFyV2lkdGgsIDE2LCAzKVxuICAgICAgICAgICAgICAgICAgICBncmFwaGljcy5maWxsKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOeKtuaAgeaPkOekulxuICAgICAgICBpZiAodGhpcy5fYXJlbmFTdGF0dXNMYWJlbCkge1xuICAgICAgICAgICAgdmFyIHN0YXR1c0xhYmVsID0gdGhpcy5fYXJlbmFTdGF0dXNMYWJlbC5nZXRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICBpZiAoc3RhdHVzTGFiZWwpIHtcbiAgICAgICAgICAgICAgICBpZiAoZC5maW5pc2hlZFRhYmxlcyA+PSBkLnRvdGFsVGFibGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c0xhYmVsLnN0cmluZyA9IFwi5YWo6YOo5a6M5oiQ77yM5Y2z5bCG6L+b5YWl5LiL5LiA6L2uLi4uXCJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXJlbmFTdGF0dXNMYWJlbC5jb2xvciA9IGNjLmNvbG9yKDEwMCwgMjU1LCAxMDApXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlbWFpbmluZyA9IGQudG90YWxUYWJsZXMgLSBkLmZpbmlzaGVkVGFibGVzXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c0xhYmVsLnN0cmluZyA9IFwi5q2j5Zyo562J5b6F5YW25LuW546p5a625a6M5oiQLi4uICjliankvZkgXCIgKyByZW1haW5pbmcgKyBcIiDmoYwpXCJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXJlbmFTdGF0dXNMYWJlbC5jb2xvciA9IGNjLmNvbG9yKDE1MCwgMjAwLCAyNTUpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDlkK/liqhMb2FkaW5n5peL6L2s5Yqo55S7XG4gICAgICovXG4gICAgX3N0YXJ0QXJlbmFMb2FkaW5nQW5pbWF0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9hcmVuYUxvYWRpbmdOb2RlKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX3N0b3BBcmVuYUxvYWRpbmdBbmltYXRpb24oKVxuICAgICAgICBcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHRoaXMuX2FyZW5hTG9hZGluZ0FuaW1hdGlvbiA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIHZhciByb3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICghc2VsZi5fYXJlbmFMb2FkaW5nQW5pbWF0aW9uIHx8ICFzZWxmLl9hcmVuYUxvYWRpbmdOb2RlKSByZXR1cm5cbiAgICAgICAgICAgIHNlbGYuX2FyZW5hTG9hZGluZ05vZGUuYW5nbGUgKz0gM1xuICAgICAgICAgICAgc2V0VGltZW91dChyb3RhdGUsIDE2KVxuICAgICAgICB9XG4gICAgICAgIHJvdGF0ZSgpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDlgZzmraJMb2FkaW5n5peL6L2s5Yqo55S7XG4gICAgICovXG4gICAgX3N0b3BBcmVuYUxvYWRpbmdBbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9hcmVuYUxvYWRpbmdBbmltYXRpb24gPSBmYWxzZVxuICAgICAgICBpZiAodGhpcy5fYXJlbmFMb2FkaW5nTm9kZSkge1xuICAgICAgICAgICAgdGhpcy5fYXJlbmFMb2FkaW5nTm9kZS5hbmdsZSA9IDBcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog6I635Y+W5b2T5YmN546p5a6255qE56ue5oqA6YeR5biBXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeeUqOS6juetieW+heeVjOmdouaYvuekuumHkeW4gVxuICAgICAqL1xuICAgIF9nZXRNeU1hdGNoQ29pbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAoIW15Z2xvYmFsIHx8ICFteWdsb2JhbC5wbGF5ZXJEYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDku47njqnlrrbmlbDmja7kuK3ojrflj5bnq57mioDph5HluIFcbiAgICAgICAgLy8g5Zyo5ri45oiP5Zy65pmv5Lit77yM546p5a6255qE56ue5oqA6YeR5biB5a2Y5YKo5ZyoIG15Z2xvYmFsLnBsYXllckRhdGEubWF0Y2hfY29pbiDmiJbpgJrov4cgcGxheWVyX25vZGUg6I635Y+WXG4gICAgICAgIHZhciBtYXRjaENvaW4gPSAwXG4gICAgICAgIFxuICAgICAgICAvLyDmlrnlvI8x77ya5LuOIHBsYXllcl9ub2RlX3ByZWZhYnMg6I635Y+WXG4gICAgICAgIGlmICh0aGlzLnBsYXllcl9ub2RlX3ByZWZhYnMgJiYgdGhpcy5wbGF5ZXJfbm9kZV9wcmVmYWJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wbGF5ZXJfbm9kZV9wcmVmYWJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBsYXllck5vZGUgPSB0aGlzLnBsYXllcl9ub2RlX3ByZWZhYnNbaV1cbiAgICAgICAgICAgICAgICBpZiAocGxheWVyTm9kZSAmJiBwbGF5ZXJOb2RlLnBsYXllcl9kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOaJvuWIsOW9k+WJjeeOqeWutlxuICAgICAgICAgICAgICAgICAgICB2YXIgcGxheWVyRGF0YSA9IHBsYXllck5vZGUucGxheWVyX2RhdGFcbiAgICAgICAgICAgICAgICAgICAgdmFyIG15UGxheWVySWQgPSBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLnVuaXF1ZUlEXG4gICAgICAgICAgICAgICAgICAgIGlmIChwbGF5ZXJEYXRhLmFjY291bnRpZCA9PT0gbXlQbGF5ZXJJZCB8fCBwbGF5ZXJEYXRhLmFjY291bnRpZCA9PT0gU3RyaW5nKG15UGxheWVySWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaENvaW4gPSBwbGF5ZXJEYXRhLm1hdGNoX2NvaW4gfHwgcGxheWVyRGF0YS5hcmVuYV9nb2xkIHx8IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOaWueW8jzLvvJrku47lhajlsYDmlbDmja7ojrflj5ZcbiAgICAgICAgaWYgKG1hdGNoQ29pbiA9PT0gMCAmJiBteWdsb2JhbC5hcmVuYU1hdGNoRGF0YSkge1xuICAgICAgICAgICAgbWF0Y2hDb2luID0gbXlnbG9iYWwuYXJlbmFNYXRjaERhdGEubXlNYXRjaENvaW4gfHwgMFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbWF0Y2hDb2luXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDlpITnkIbnq57mioDlnLrnrYnlvoXov5vluqbmm7TmlrBcbiAgICAgKi9cbiAgICBfb25BcmVuYVdhaXRQcm9ncmVzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW19vbkFyZW5hV2FpdFByb2dyZXNzXSDmlLbliLDov5vluqbmm7TmlrA6XCIsIEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICAgICBcbiAgICAgICAgLy8g5qOA5p+l5pyf5Y+35piv5ZCm5Yy56YWNXG4gICAgICAgIGlmICh0aGlzLl9hcmVuYVdhaXRpbmdEYXRhICYmIHRoaXMuX2FyZW5hV2FpdGluZ0RhdGEucGVyaW9kTm8gJiYgXG4gICAgICAgICAgICBkYXRhLnBlcmlvZF9ubyAmJiBkYXRhLnBlcmlvZF9ubyAhPT0gdGhpcy5fYXJlbmFXYWl0aW5nRGF0YS5wZXJpb2RObykge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenOetieW+hVVJ5LiN5a2Y5Zyo77yM5YWI5Yib5bu6XG4gICAgICAgIGlmICghdGhpcy5fYXJlbmFXYWl0aW5nVUlOb2RlICYmIHRoaXMuX2lzQXJlbmFNb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93QXJlbmFXYWl0aW5nVUkoZGF0YSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZUFyZW5hV2FpdGluZ1VJKGRhdGEpXG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOWkhOeQhuernuaKgOWcuui9ruasoeaZi+e6p1xuICAgICAqL1xuICAgIF9vbkFyZW5hUm91bmRBZHZhbmNlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbX29uQXJlbmFSb3VuZEFkdmFuY2VdIOi/m+WFpeS4i+S4gOi9rjpcIiwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgICAgIFxuICAgICAgICAvLyDmo4Dmn6XmnJ/lj7fmmK/lkKbljLnphY1cbiAgICAgICAgaWYgKHRoaXMuX2FyZW5hV2FpdGluZ0RhdGEgJiYgdGhpcy5fYXJlbmFXYWl0aW5nRGF0YS5wZXJpb2RObyAmJiBcbiAgICAgICAgICAgIGRhdGEucGVyaW9kX25vICYmIGRhdGEucGVyaW9kX25vICE9PSB0aGlzLl9hcmVuYVdhaXRpbmdEYXRhLnBlcmlvZE5vKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw6L2u5qyh5L+h5oGvXG4gICAgICAgIGlmICh0aGlzLl9hcmVuYVdhaXRpbmdEYXRhKSB7XG4gICAgICAgICAgICB0aGlzLl9hcmVuYVdhaXRpbmdEYXRhLnJvdW5kID0gZGF0YS5uZXdfcm91bmQgfHwgdGhpcy5fYXJlbmFXYWl0aW5nRGF0YS5yb3VuZCArIDFcbiAgICAgICAgICAgIHRoaXMuX2FyZW5hV2FpdGluZ0RhdGEudG90YWxSb3VuZHMgPSBkYXRhLnRvdGFsX3JvdW5kcyB8fCB0aGlzLl9hcmVuYVdhaXRpbmdEYXRhLnRvdGFsUm91bmRzXG4gICAgICAgICAgICB0aGlzLl9hcmVuYVdhaXRpbmdEYXRhLmZpbmlzaGVkVGFibGVzID0gMFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrBVSVxuICAgICAgICBpZiAodGhpcy5fYXJlbmFSb3VuZExhYmVsKSB7XG4gICAgICAgICAgICB2YXIgcm91bmRMYWJlbCA9IHRoaXMuX2FyZW5hUm91bmRMYWJlbC5nZXRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICBpZiAocm91bmRMYWJlbCkge1xuICAgICAgICAgICAgICAgIHJvdW5kTGFiZWwuc3RyaW5nID0gXCLnrKwgXCIgKyAoZGF0YS5uZXdfcm91bmQgfHwgMSkgKyBcIiDova4gLyDlhbEgXCIgKyAoZGF0YS50b3RhbF9yb3VuZHMgfHwgMSkgKyBcIiDova5cIlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOaSreaUvuaUvuWkp+WKqOeUu1xuICAgICAgICAgICAgICAgIHZhciBzY2FsZVVwID0gY2Muc2NhbGVUbygwLjIsIDEuMylcbiAgICAgICAgICAgICAgICB2YXIgc2NhbGVEb3duID0gY2Muc2NhbGVUbygwLjIsIDEuMClcbiAgICAgICAgICAgICAgICB2YXIgc2VxdWVuY2UgPSBjYy5zZXF1ZW5jZShzY2FsZVVwLCBzY2FsZURvd24pXG4gICAgICAgICAgICAgICAgdGhpcy5fYXJlbmFSb3VuZExhYmVsLnJ1bkFjdGlvbihzZXF1ZW5jZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw54q25oCB5o+Q56S6XG4gICAgICAgIGlmICh0aGlzLl9hcmVuYVN0YXR1c0xhYmVsKSB7XG4gICAgICAgICAgICB2YXIgc3RhdHVzTGFiZWwgPSB0aGlzLl9hcmVuYVN0YXR1c0xhYmVsLmdldENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgIGlmIChzdGF0dXNMYWJlbCkge1xuICAgICAgICAgICAgICAgIHN0YXR1c0xhYmVsLnN0cmluZyA9IGRhdGEubWVzc2FnZSB8fCBcIuaZi+e6p+aIkOWKn++8geato+WcqOWMuemFjeS4i+S4gOi9ri4uLlwiXG4gICAgICAgICAgICAgICAgdGhpcy5fYXJlbmFTdGF0dXNMYWJlbC5jb2xvciA9IGNjLmNvbG9yKDEwMCwgMjU1LCAxMDApXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOWkhOeQhuernuaKgOWcuuacgOe7iOamnOWNlVxuICAgICAqL1xuICAgIF9vbkFyZW5hRmluYWxSYW5rOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbX29uQXJlbmFGaW5hbFJhbmtdIOavlOi1m+e7k+adn++8jOaYvuekuuacgOe7iOamnOWNlTpcIiwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgICAgIFxuICAgICAgICAvLyDmo4Dmn6XmnJ/lj7fmmK/lkKbljLnphY1cbiAgICAgICAgaWYgKHRoaXMuX2FyZW5hV2FpdGluZ0RhdGEgJiYgdGhpcy5fYXJlbmFXYWl0aW5nRGF0YS5wZXJpb2RObyAmJiBcbiAgICAgICAgICAgIGRhdGEucGVyaW9kX25vICYmIGRhdGEucGVyaW9kX25vICE9PSB0aGlzLl9hcmVuYVdhaXRpbmdEYXRhLnBlcmlvZE5vKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5YGc5q2i5Yqo55S7XG4gICAgICAgIHRoaXMuX3N0b3BBcmVuYUxvYWRpbmdBbmltYXRpb24oKVxuICAgICAgICBcbiAgICAgICAgLy8g6ZqQ6JeP562J5b6FVUlcbiAgICAgICAgdGhpcy5faGlkZUFyZW5hV2FpdGluZ1VJKClcbiAgICAgICAgXG4gICAgICAgIC8vIOaYvuekuuacgOe7iOamnOWNleW8ueeql1xuICAgICAgICB0aGlzLl9zaG93QXJlbmFGaW5hbFJhbmtEaWFsb2coZGF0YSlcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOaYvuekuuacgOe7iOamnOWNleW8ueeql1xuICAgICAqIPCflKfjgJDkv67lpI3jgJHnm7TmjqXliJvlu7rlvLnnqpdVSe+8jOmBv+WFjeS+nei1luWklumDqOe7hOS7tuexu+azqOWGjOmXrumimFxuICAgICAqL1xuICAgIF9zaG93QXJlbmFGaW5hbFJhbmtEaWFsb2c6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj4YgW19zaG93QXJlbmFGaW5hbFJhbmtEaWFsb2ddIOaYvuekuuWujOaVtOaOkuihjOamnOW8ueeqlywgZGF0YTpcIiwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR55u05o6l5Yib5bu65by556qXVUnvvIzkuI3kvb/nlKggYWRkQ29tcG9uZW50KFwiVG91cm5hbWVudEZpbmFsUmFua0RpYWxvZ1wiKVxuICAgICAgICAvLyDlm6DkuLogQ29jb3Mg5Zyo6L+Q6KGM5pe25Y+v6IO95peg5rOV5q2j56Gu5om+5Yiw5rOo5YaM55qE57G7XG4gICAgICAgIHZhciBkaWFsb2dOb2RlID0gdGhpcy5fY3JlYXRlRmluYWxSYW5rRGlhbG9nKGRhdGEpXG4gICAgICAgIFxuICAgICAgICBpZiAoIWRpYWxvZ05vZGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn4+GIFtfc2hvd0FyZW5hRmluYWxSYW5rRGlhbG9nXSDliJvlu7rlvLnnqpflpLHotKVcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDliLDlvZPliY3lnLrmma9cbiAgICAgICAgdGhpcy5ub2RlLmFkZENoaWxkKGRpYWxvZ05vZGUpXG4gICAgICAgIGRpYWxvZ05vZGUuekluZGV4ID0gMzAwMFxuICAgICAgICBcbiAgICAgICAgdGhpcy5fYXJlbmFGaW5hbFJhbmtEaWFsb2cgPSBkaWFsb2dOb2RlXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj4YgW19zaG93QXJlbmFGaW5hbFJhbmtEaWFsb2ddIOWujOaVtOaOkuihjOamnOW8ueeql+W3suWIm+W7ulwiKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeWIm+W7uuacgOe7iOamnOWNleW8ueeql1VJXG4gICAgICog55u05o6l5Yib5bu6VUnvvIzpgb/lhY3nu4Tku7bnsbvms6jlhozpl67pophcbiAgICAgKi9cbiAgICBfY3JlYXRlRmluYWxSYW5rRGlhbG9nOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBzY3JlZW5XaWR0aCA9IDEyODBcbiAgICAgICAgdmFyIHNjcmVlbkhlaWdodCA9IDcyMFxuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65by556qX5a655ZmoXG4gICAgICAgIHZhciBkaWFsb2dOb2RlID0gbmV3IGNjLk5vZGUoXCJUb3VybmFtZW50RmluYWxSYW5rRGlhbG9nXCIpXG4gICAgICAgIGRpYWxvZ05vZGUuc2V0UG9zaXRpb24oMCwgMClcbiAgICAgICAgZGlhbG9nTm9kZS5zZXRDb250ZW50U2l6ZShzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KVxuICAgICAgICBcbiAgICAgICAgLy8g5Y2K6YCP5piO6IOM5pmv6YGu572pXG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkJhY2tncm91bmRcIilcbiAgICAgICAgYmdOb2RlLnNldENvbnRlbnRTaXplKHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpXG4gICAgICAgIHZhciBiZ0dyYXBoaWNzID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgYmdHcmFwaGljcy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMCwgMCwgMCwgMTgwKVxuICAgICAgICBiZ0dyYXBoaWNzLnJlY3QoLXNjcmVlbldpZHRoLzIsIC1zY3JlZW5IZWlnaHQvMiwgc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodClcbiAgICAgICAgYmdHcmFwaGljcy5maWxsKClcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IGRpYWxvZ05vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOS4u+W8ueeql+WuueWZqFxuICAgICAgICB2YXIgZGlhbG9nQ29udGFpbmVyID0gbmV3IGNjLk5vZGUoXCJEaWFsb2dDb250YWluZXJcIilcbiAgICAgICAgZGlhbG9nQ29udGFpbmVyLnNldENvbnRlbnRTaXplKDEwMDAsIDY1MClcbiAgICAgICAgZGlhbG9nQ29udGFpbmVyLnNldFBvc2l0aW9uKDAsIDApXG4gICAgICAgIFxuICAgICAgICAvLyDlvLnnqpfog4zmma9cbiAgICAgICAgdmFyIGRpYWxvZ0JnID0gbmV3IGNjLk5vZGUoXCJEaWFsb2dCZ1wiKVxuICAgICAgICB2YXIgZGlhbG9nQmdHcmFwaGljcyA9IGRpYWxvZ0JnLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgZGlhbG9nQmdHcmFwaGljcy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjUsIDM1LCA2MCwgMjUwKVxuICAgICAgICBkaWFsb2dCZ0dyYXBoaWNzLnJvdW5kUmVjdCgtNTAwLCAtMzI1LCAxMDAwLCA2NTAsIDI1KVxuICAgICAgICBkaWFsb2dCZ0dyYXBoaWNzLmZpbGwoKVxuICAgICAgICBkaWFsb2dCZ0dyYXBoaWNzLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDE4MCwgMTQwLCA2MClcbiAgICAgICAgZGlhbG9nQmdHcmFwaGljcy5saW5lV2lkdGggPSA0XG4gICAgICAgIGRpYWxvZ0JnR3JhcGhpY3Mucm91bmRSZWN0KC01MDAsIC0zMjUsIDEwMDAsIDY1MCwgMjUpXG4gICAgICAgIGRpYWxvZ0JnR3JhcGhpY3Muc3Ryb2tlKClcbiAgICAgICAgZGlhbG9nQmcucGFyZW50ID0gZGlhbG9nQ29udGFpbmVyXG4gICAgICAgIGRpYWxvZ0NvbnRhaW5lci5wYXJlbnQgPSBkaWFsb2dOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmoIfpophcbiAgICAgICAgdmFyIHRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIilcbiAgICAgICAgdGl0bGVOb2RlLnNldFBvc2l0aW9uKDAsIDI3MClcbiAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB0aXRsZUxhYmVsLnN0cmluZyA9IFwi8J+PhiDmr5TotZvnu5PmnZ8g8J+PhlwiXG4gICAgICAgIHRpdGxlTGFiZWwuZm9udFNpemUgPSA0MFxuICAgICAgICB0aXRsZUxhYmVsLmxpbmVIZWlnaHQgPSA0OFxuICAgICAgICB0aXRsZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgdGl0bGVOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjE1LCAwKVxuICAgICAgICB2YXIgdGl0bGVPdXRsaW5lID0gdGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpXG4gICAgICAgIHRpdGxlT3V0bGluZS5jb2xvciA9IG5ldyBjYy5Db2xvcigxMDAsIDYwLCAwKVxuICAgICAgICB0aXRsZU91dGxpbmUud2lkdGggPSAzXG4gICAgICAgIHRpdGxlTm9kZS5wYXJlbnQgPSBkaWFsb2dDb250YWluZXJcbiAgICAgICAgXG4gICAgICAgIC8vIOacn+WPt+WSjOWPgui1m+S6uuaVsFxuICAgICAgICB2YXIgcGVyaW9kTm8gPSBkYXRhLnBlcmlvZF9ubyB8fCBcIi0tLVwiXG4gICAgICAgIHZhciB0b3RhbFBsYXllcnMgPSBkYXRhLnRvdGFsX3BsYXllcnMgfHwgMFxuICAgICAgICBcbiAgICAgICAgdmFyIHBlcmlvZE5vZGUgPSBuZXcgY2MuTm9kZShcIlBlcmlvZE5vXCIpXG4gICAgICAgIHBlcmlvZE5vZGUuc2V0UG9zaXRpb24oMCwgMjIwKVxuICAgICAgICB2YXIgcGVyaW9kTGFiZWwgPSBwZXJpb2ROb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgcGVyaW9kTGFiZWwuc3RyaW5nID0gXCLnrKxcIiArIHBlcmlvZE5vICsgXCLmnJ/otZvkuovnu5PmnZ8gIOWFsVwiICsgdG90YWxQbGF5ZXJzICsgXCLkurrlj4LotZtcIlxuICAgICAgICBwZXJpb2RMYWJlbC5mb250U2l6ZSA9IDI0XG4gICAgICAgIHBlcmlvZExhYmVsLmxpbmVIZWlnaHQgPSAzMFxuICAgICAgICBwZXJpb2RMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHBlcmlvZE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjAwLCAyMDAsIDIyMClcbiAgICAgICAgcGVyaW9kTm9kZS5wYXJlbnQgPSBkaWFsb2dDb250YWluZXJcbiAgICAgICAgXG4gICAgICAgIC8vIFRPUDMg6aKG5aWW5Y+wXG4gICAgICAgIHZhciB0b3AzID0gZGF0YS50b3AzIHx8IFtdXG4gICAgICAgIHZhciBwb2RpdW1ZID0gNDBcbiAgICAgICAgdmFyIHNwYWNpbmdYID0gMjgwXG4gICAgICAgIFxuICAgICAgICAvLyDlhqDlhptcbiAgICAgICAgaWYgKHRvcDMubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVBvZGl1bUl0ZW0oZGlhbG9nQ29udGFpbmVyLCB0b3AzWzBdLCAxLCAwLCBwb2RpdW1ZICsgNDAsIDEuMTUpXG4gICAgICAgIH1cbiAgICAgICAgLy8g5Lqa5YabXG4gICAgICAgIGlmICh0b3AzLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVQb2RpdW1JdGVtKGRpYWxvZ0NvbnRhaW5lciwgdG9wM1sxXSwgMiwgLXNwYWNpbmdYLCBwb2RpdW1ZLCAxLjApXG4gICAgICAgIH1cbiAgICAgICAgLy8g5a2j5YabXG4gICAgICAgIGlmICh0b3AzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVQb2RpdW1JdGVtKGRpYWxvZ0NvbnRhaW5lciwgdG9wM1syXSwgMywgc3BhY2luZ1gsIHBvZGl1bVksIDEuMClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5oiR55qE5o6S5ZCN5Yy65Z+fXG4gICAgICAgIHZhciBteVJhbmsgPSBkYXRhLm15X3JhbmsgfHwgMFxuICAgICAgICB2YXIgbXlDb2luID0gZGF0YS5teV9tYXRjaF9jb2luIHx8IDBcbiAgICAgICAgXG4gICAgICAgIHZhciBteVJhbmtDb250YWluZXIgPSBuZXcgY2MuTm9kZShcIk15UmFua0NvbnRhaW5lclwiKVxuICAgICAgICBteVJhbmtDb250YWluZXIuc2V0UG9zaXRpb24oMCwgLTIwMClcbiAgICAgICAgbXlSYW5rQ29udGFpbmVyLnNldENvbnRlbnRTaXplKDYwMCwgNTApXG4gICAgICAgIFxuICAgICAgICB2YXIgbXlSYW5rQmcgPSBuZXcgY2MuTm9kZShcIkJnXCIpXG4gICAgICAgIHZhciBteVJhbmtCZ0dyYXBoaWNzID0gbXlSYW5rQmcuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBteVJhbmtCZ0dyYXBoaWNzLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig0MCwgNTAsIDgwLCAyMzApXG4gICAgICAgIG15UmFua0JnR3JhcGhpY3Mucm91bmRSZWN0KC0zMDAsIC0yNSwgNjAwLCA1MCwgMTIpXG4gICAgICAgIG15UmFua0JnR3JhcGhpY3MuZmlsbCgpXG4gICAgICAgIG15UmFua0JnR3JhcGhpY3Muc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMTAwLCAxMjAsIDE2MClcbiAgICAgICAgbXlSYW5rQmdHcmFwaGljcy5saW5lV2lkdGggPSAyXG4gICAgICAgIG15UmFua0JnR3JhcGhpY3Mucm91bmRSZWN0KC0zMDAsIC0yNSwgNjAwLCA1MCwgMTIpXG4gICAgICAgIG15UmFua0JnR3JhcGhpY3Muc3Ryb2tlKClcbiAgICAgICAgbXlSYW5rQmcucGFyZW50ID0gbXlSYW5rQ29udGFpbmVyXG4gICAgICAgIFxuICAgICAgICB2YXIgbXlSYW5rTGFiZWwgPSBuZXcgY2MuTm9kZShcIk15UmFua0xhYmVsXCIpXG4gICAgICAgIG15UmFua0xhYmVsLnNldFBvc2l0aW9uKC0xNDAsIDApXG4gICAgICAgIHZhciBteVJhbmtUZXh0ID0gbXlSYW5rTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBteVJhbmtUZXh0LnN0cmluZyA9IG15UmFuayA+IDAgPyBcIuaIkeeahOaOkuWQje+8muesrFwiICsgbXlSYW5rICsgXCLlkI1cIiA6IFwi5oiR55qE5o6S5ZCN77ya5pyq5LiK5qacXCJcbiAgICAgICAgbXlSYW5rVGV4dC5mb250U2l6ZSA9IDIyXG4gICAgICAgIG15UmFua1RleHQubGluZUhlaWdodCA9IDI4XG4gICAgICAgIG15UmFua1RleHQuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICBteVJhbmtMYWJlbC5jb2xvciA9IG5ldyBjYy5Db2xvcigxMDAsIDIwMCwgMjU1KVxuICAgICAgICBteVJhbmtMYWJlbC5wYXJlbnQgPSBteVJhbmtDb250YWluZXJcbiAgICAgICAgXG4gICAgICAgIHZhciBteUNvaW5MYWJlbCA9IG5ldyBjYy5Ob2RlKFwiTXlDb2luTGFiZWxcIilcbiAgICAgICAgbXlDb2luTGFiZWwuc2V0UG9zaXRpb24oMTQwLCAwKVxuICAgICAgICB2YXIgbXlDb2luVGV4dCA9IG15Q29pbkxhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgbXlDb2luVGV4dC5zdHJpbmcgPSBcIuavlOi1m+mHkeW4ge+8mlwiICsgbXlDb2luXG4gICAgICAgIG15Q29pblRleHQuZm9udFNpemUgPSAyMlxuICAgICAgICBteUNvaW5UZXh0LmxpbmVIZWlnaHQgPSAyOFxuICAgICAgICBteUNvaW5UZXh0Lmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgbXlDb2luTGFiZWwuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDEwMClcbiAgICAgICAgbXlDb2luTGFiZWwucGFyZW50ID0gbXlSYW5rQ29udGFpbmVyXG4gICAgICAgIFxuICAgICAgICBteVJhbmtDb250YWluZXIucGFyZW50ID0gZGlhbG9nQ29udGFpbmVyXG4gICAgICAgIFxuICAgICAgICAvLyDnoa7orqTmjInpkq5cbiAgICAgICAgdmFyIGNvbmZpcm1CdG4gPSBuZXcgY2MuTm9kZShcIkNvbmZpcm1CdG5cIilcbiAgICAgICAgY29uZmlybUJ0bi5zZXRQb3NpdGlvbigwLCAtMjcwKVxuICAgICAgICBjb25maXJtQnRuLnNldENvbnRlbnRTaXplKDIwMCwgNTApXG4gICAgICAgIFxuICAgICAgICB2YXIgYnRuQmcgPSBjb25maXJtQnRuLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgYnRuQmcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDgwLCAxNjAsIDgwKVxuICAgICAgICBidG5CZy5yb3VuZFJlY3QoLTEwMCwgLTI1LCAyMDAsIDUwLCAxMilcbiAgICAgICAgYnRuQmcuZmlsbCgpXG4gICAgICAgIGJ0bkJnLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDEyMCwgMjAwLCAxMjApXG4gICAgICAgIGJ0bkJnLmxpbmVXaWR0aCA9IDNcbiAgICAgICAgYnRuQmcucm91bmRSZWN0KC0xMDAsIC0yNSwgMjAwLCA1MCwgMTIpXG4gICAgICAgIGJ0bkJnLnN0cm9rZSgpXG4gICAgICAgIFxuICAgICAgICB2YXIgYnRuTGFiZWwgPSBuZXcgY2MuTm9kZShcIkxhYmVsXCIpXG4gICAgICAgIHZhciBidG5MYWJlbFRleHQgPSBidG5MYWJlbC5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGJ0bkxhYmVsVGV4dC5zdHJpbmcgPSBcIuehriDlrppcIlxuICAgICAgICBidG5MYWJlbFRleHQuZm9udFNpemUgPSAyNlxuICAgICAgICBidG5MYWJlbFRleHQubGluZUhlaWdodCA9IDMyXG4gICAgICAgIGJ0bkxhYmVsVGV4dC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIGJ0bkxhYmVsLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIHZhciBidG5PdXRsaW5lID0gYnRuTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSlcbiAgICAgICAgYnRuT3V0bGluZS5jb2xvciA9IG5ldyBjYy5Db2xvcigzMCwgODAsIDMwKVxuICAgICAgICBidG5PdXRsaW5lLndpZHRoID0gMlxuICAgICAgICBidG5MYWJlbC5wYXJlbnQgPSBjb25maXJtQnRuXG4gICAgICAgIFxuICAgICAgICB2YXIgYnRuID0gY29uZmlybUJ0bi5hZGRDb21wb25lbnQoY2MuQnV0dG9uKVxuICAgICAgICBjb25maXJtQnRuLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+GIFtUb3VybmFtZW50RmluYWxSYW5rXSDngrnlh7vnoa7orqTvvIzov5Tlm57lpKfljoVcIilcbiAgICAgICAgICAgIGRpYWxvZ05vZGUuZGVzdHJveSgpXG4gICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIilcbiAgICAgICAgfSwgdGhpcylcbiAgICAgICAgXG4gICAgICAgIGNvbmZpcm1CdG4ucGFyZW50ID0gZGlhbG9nQ29udGFpbmVyXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZGlhbG9nTm9kZVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeWIm+W7uumihuWlluWPsOmhueebrlxuICAgICAqL1xuICAgIF9jcmVhdGVQb2RpdW1JdGVtOiBmdW5jdGlvbihwYXJlbnROb2RlLCBwbGF5ZXJEYXRhLCByYW5rLCB4LCB5LCBzY2FsZSkge1xuICAgICAgICB2YXIgbm9kZSA9IG5ldyBjYy5Ob2RlKFwiUG9kaXVtSXRlbV9cIiArIHJhbmspXG4gICAgICAgIG5vZGUuc2V0UG9zaXRpb24oeCwgeSlcbiAgICAgICAgbm9kZS5zY2FsZSA9IHNjYWxlIHx8IDFcbiAgICAgICAgXG4gICAgICAgIC8vIOaOkuWQjeagh+etvlxuICAgICAgICB2YXIgcmFua0xhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUmFua0xhYmVsXCIpXG4gICAgICAgIHJhbmtMYWJlbE5vZGUuc2V0UG9zaXRpb24oMCwgNjApXG4gICAgICAgIHZhciByYW5rTGFiZWwgPSByYW5rTGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdmFyIHJhbmtUZXh0cyA9IHsgMTogXCLwn6WHIOWGoOWGm1wiLCAyOiBcIvCfpYgg5Lqa5YabXCIsIDM6IFwi8J+liSDlraPlhptcIiB9XG4gICAgICAgIHJhbmtMYWJlbC5zdHJpbmcgPSByYW5rVGV4dHNbcmFua10gfHwgKFwi56ysXCIgKyByYW5rICsgXCLlkI1cIilcbiAgICAgICAgcmFua0xhYmVsLmZvbnRTaXplID0gMjJcbiAgICAgICAgcmFua0xhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgcmFua0xhYmVsTm9kZS5jb2xvciA9IHJhbmsgPT09IDEgPyBuZXcgY2MuQ29sb3IoMjU1LCAyMTUsIDApIDogbmV3IGNjLkNvbG9yKDIwMCwgMjAwLCAyMjApXG4gICAgICAgIHZhciByYW5rT3V0bGluZSA9IHJhbmtMYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSlcbiAgICAgICAgcmFua091dGxpbmUuY29sb3IgPSBuZXcgY2MuQ29sb3IoNTAsIDUwLCA4MClcbiAgICAgICAgcmFua091dGxpbmUud2lkdGggPSAyXG4gICAgICAgIHJhbmtMYWJlbE5vZGUucGFyZW50ID0gbm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5aS05YOP5a655ZmoXG4gICAgICAgIHZhciBhdmF0YXJTaXplID0gcmFuayA9PT0gMSA/IDcwIDogNjBcbiAgICAgICAgdmFyIGF2YXRhckNvbnRhaW5lciA9IG5ldyBjYy5Ob2RlKFwiQXZhdGFyQ29udGFpbmVyXCIpXG4gICAgICAgIGF2YXRhckNvbnRhaW5lci5zZXRQb3NpdGlvbigwLCAwKVxuICAgICAgICBhdmF0YXJDb250YWluZXIuc2V0Q29udGVudFNpemUoYXZhdGFyU2l6ZSwgYXZhdGFyU2l6ZSlcbiAgICAgICAgXG4gICAgICAgIHZhciBhdmF0YXJCZyA9IG5ldyBjYy5Ob2RlKFwiQXZhdGFyQmdcIilcbiAgICAgICAgdmFyIGF2YXRhckJnR3JhcGhpY3MgPSBhdmF0YXJCZy5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGF2YXRhckJnR3JhcGhpY3MuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDYwLCA3MCwgMTAwKVxuICAgICAgICBhdmF0YXJCZ0dyYXBoaWNzLmNpcmNsZSgwLCAwLCBhdmF0YXJTaXplLzIgKyAyKVxuICAgICAgICBhdmF0YXJCZ0dyYXBoaWNzLmZpbGwoKVxuICAgICAgICBhdmF0YXJCZ0dyYXBoaWNzLnN0cm9rZUNvbG9yID0gcmFuayA9PT0gMSA/IG5ldyBjYy5Db2xvcigyNTUsIDIxNSwgMCkgOiBuZXcgY2MuQ29sb3IoMTUwLCAxNTAsIDE4MClcbiAgICAgICAgYXZhdGFyQmdHcmFwaGljcy5saW5lV2lkdGggPSByYW5rID09PSAxID8gMyA6IDJcbiAgICAgICAgYXZhdGFyQmdHcmFwaGljcy5jaXJjbGUoMCwgMCwgYXZhdGFyU2l6ZS8yICsgMilcbiAgICAgICAgYXZhdGFyQmdHcmFwaGljcy5zdHJva2UoKVxuICAgICAgICBhdmF0YXJCZy5wYXJlbnQgPSBhdmF0YXJDb250YWluZXJcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkuI3kvb/nlKggTWFzayDnu4Tku7bvvIznm7TmjqXmmL7npLrlpLTlg4/vvIjpgb/lhY3pga7nvanlr7zoh7TnmoTkuI3mmL7npLrpl67popjvvIlcbiAgICAgICAgLy8g5aS05YOP57K+54G177yI55u05o6l5pS+5Zyo5a655Zmo5YaF77yJXG4gICAgICAgIHZhciBhdmF0YXJTcHJpdGVOb2RlID0gbmV3IGNjLk5vZGUoXCJBdmF0YXJTcHJpdGVcIilcbiAgICAgICAgYXZhdGFyU3ByaXRlTm9kZS5zZXRQb3NpdGlvbigwLCAwKVxuICAgICAgICBhdmF0YXJTcHJpdGVOb2RlLnNldENvbnRlbnRTaXplKGF2YXRhclNpemUgLSA0LCBhdmF0YXJTaXplIC0gNClcbiAgICAgICAgdmFyIGF2YXRhclNwcml0ZSA9IGF2YXRhclNwcml0ZU5vZGUuYWRkQ29tcG9uZW50KGNjLlNwcml0ZSlcbiAgICAgICAgYXZhdGFyU3ByaXRlLnNpemVNb2RlID0gY2MuU3ByaXRlLlNpemVNb2RlLkNVU1RPTVxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5pi+5byP6K6+572u6IqC54K56aKc6Imy5Li655m96Imy77yM56Gu5L+d5Zu+54mH5Y+v6KeBXG4gICAgICAgIGF2YXRhclNwcml0ZU5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgYXZhdGFyU3ByaXRlTm9kZS5wYXJlbnQgPSBhdmF0YXJDb250YWluZXJcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+WvO+4jyBbX2NyZWF0ZVBvZGl1bUl0ZW1dIOWIm+W7uuWktOWDj+iKgueCuSwgcmFuazpcIiwgcmFuaywgXCJhdmF0YXJVcmw6XCIsIHBsYXllckRhdGEuYXZhdGFyKVxuICAgICAgICBcbiAgICAgICAgLy8g5Yqg6L295aS05YOP77yI8J+Up+OAkOS/ruWkjeOAkeacuuWZqOS6uuS5n+S9v+eUqOacjeWKoeerr+S8oOadpeeahOato+ehruWktOWDj++8iVxuICAgICAgICB0aGlzLl9sb2FkQXZhdGFyRm9yUG9kaXVtKGF2YXRhclNwcml0ZSwgYXZhdGFyU3ByaXRlTm9kZSwgcGxheWVyRGF0YS5hdmF0YXIsIHBsYXllckRhdGEuaXNfcm9ib3QsIGF2YXRhclNpemUgLSA0KVxuICAgICAgICBcbiAgICAgICAgYXZhdGFyQ29udGFpbmVyLnBhcmVudCA9IG5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOaYteensCAtIOebtOaOpeS9v+eUqOecn+WunuaYteensO+8jOacuuWZqOS6uuS5n+S4gOagt1xuICAgICAgICB2YXIgbmFtZUxhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTmFtZUxhYmVsXCIpXG4gICAgICAgIG5hbWVMYWJlbE5vZGUuc2V0UG9zaXRpb24oMCwgLTU1KVxuICAgICAgICBuYW1lTGFiZWxOb2RlLnNldENvbnRlbnRTaXplKDEyMCwgMzApXG4gICAgICAgIHZhciBuYW1lTGFiZWwgPSBuYW1lTGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdmFyIGRpc3BsYXlOYW1lID0gcGxheWVyRGF0YS5wbGF5ZXJfbmFtZSB8fCBcIueOqeWutlwiXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmnLrlmajkurrkuZ/kvb/nlKjnnJ/lrp7mmLXnp7DvvIzkuI3lgZrnibnmrorlpITnkIZcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmmLXnp7Dov4fplb/ml7bmiKrmlq3mmL7npLrvvIzotoXlh7rpg6jliIbnlKhcIi4uLlwiXG4gICAgICAgIHZhciBtYXhOYW1lTGVuZ3RoID0gNiAgLy8g5pyA5aSa5pi+56S6NuS4quWtl+esplxuICAgICAgICBpZiAoZGlzcGxheU5hbWUubGVuZ3RoID4gbWF4TmFtZUxlbmd0aCkge1xuICAgICAgICAgICAgZGlzcGxheU5hbWUgPSBkaXNwbGF5TmFtZS5zdWJzdHJpbmcoMCwgbWF4TmFtZUxlbmd0aCkgKyBcIi4uLlwiXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIG5hbWVMYWJlbC5zdHJpbmcgPSBkaXNwbGF5TmFtZVxuICAgICAgICBuYW1lTGFiZWwuZm9udFNpemUgPSByYW5rID09PSAxID8gMjAgOiAxOFxuICAgICAgICBuYW1lTGFiZWwubGluZUhlaWdodCA9IDI0XG4gICAgICAgIG5hbWVMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIG5hbWVMYWJlbC5vdmVyZmxvdyA9IGNjLkxhYmVsLk92ZXJmbG93LkNMQU1QXG4gICAgICAgIG5hbWVMYWJlbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgdmFyIG5hbWVPdXRsaW5lID0gbmFtZUxhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKVxuICAgICAgICBuYW1lT3V0bGluZS5jb2xvciA9IG5ldyBjYy5Db2xvcigzMCwgMzAsIDUwKVxuICAgICAgICBuYW1lT3V0bGluZS53aWR0aCA9IDFcbiAgICAgICAgbmFtZUxhYmVsTm9kZS5wYXJlbnQgPSBub2RlXG4gICAgICAgIFxuICAgICAgICAvLyDph5HluIFcbiAgICAgICAgdmFyIGNvaW5MYWJlbE5vZGUgPSBuZXcgY2MuTm9kZShcIkNvaW5MYWJlbFwiKVxuICAgICAgICBjb2luTGFiZWxOb2RlLnNldFBvc2l0aW9uKDAsIC04NSlcbiAgICAgICAgdmFyIGNvaW5MYWJlbCA9IGNvaW5MYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBjb2luTGFiZWwuc3RyaW5nID0gdGhpcy5fZm9ybWF0TWF0Y2hDb2luKHBsYXllckRhdGEubWF0Y2hfY29pbiB8fCAwKSArIFwi6YeR5biBXCJcbiAgICAgICAgY29pbkxhYmVsLmZvbnRTaXplID0gcmFuayA9PT0gMSA/IDE4IDogMTZcbiAgICAgICAgY29pbkxhYmVsLmxpbmVIZWlnaHQgPSAyMFxuICAgICAgICBjb2luTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICBjb2luTGFiZWxOb2RlLmNvbG9yID0gcmFuayA9PT0gMSA/IG5ldyBjYy5Db2xvcigyNTUsIDIxNSwgMCkgOiBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDEwMClcbiAgICAgICAgdmFyIGNvaW5PdXRsaW5lID0gY29pbkxhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKVxuICAgICAgICBjb2luT3V0bGluZS5jb2xvciA9IG5ldyBjYy5Db2xvcig4MCwgNTAsIDApXG4gICAgICAgIGNvaW5PdXRsaW5lLndpZHRoID0gMVxuICAgICAgICBjb2luTGFiZWxOb2RlLnBhcmVudCA9IG5vZGVcbiAgICAgICAgXG4gICAgICAgIG5vZGUucGFyZW50ID0gcGFyZW50Tm9kZVxuICAgICAgICByZXR1cm4gbm9kZVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeS4uumihuWlluWPsOWKoOi9veWktOWDj1xuICAgICAqIPCflKfjgJDkv67lpI3jgJHmnLrlmajkurrkuZ/kvb/nlKjmnI3liqHnq6/kvKDmnaXnmoTmraPnoa7lpLTlg4/vvIzkuI3lho3kvb/nlKjpmo/mnLrmnKzlnLDlpLTlg49cbiAgICAgKiBAcGFyYW0ge2NjLlNwcml0ZX0gc3ByaXRlIC0gU3ByaXRl57uE5Lu2XG4gICAgICogQHBhcmFtIHtjYy5Ob2RlfSBzcHJpdGVOb2RlIC0gU3ByaXRl6IqC54K5XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGF2YXRhclVybCAtIOWktOWDj1VSTFxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNSb2JvdCAtIOaYr+WQpuacuuWZqOS6ulxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzaXplIC0g5aS05YOP5bC65a+4XG4gICAgICovXG4gICAgX2xvYWRBdmF0YXJGb3JQb2RpdW06IGZ1bmN0aW9uKHNwcml0ZSwgc3ByaXRlTm9kZSwgYXZhdGFyVXJsLCBpc1JvYm90LCBzaXplKSB7XG4gICAgICAgIGlmICghc3ByaXRlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+WvO+4jyBbX2xvYWRBdmF0YXJGb3JQb2RpdW1dIHNwcml0ZSDkuLrnqbrvvIzml6Dms5XliqDovb3lpLTlg49cIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCflrzvuI8gW19sb2FkQXZhdGFyRm9yUG9kaXVtXSDlvIDlp4vliqDovb3lpLTlg48sIFVSTDpcIiwgYXZhdGFyVXJsLCBcImlzUm9ib3Q6XCIsIGlzUm9ib3QsIFwic2l6ZTpcIiwgc2l6ZSlcbiAgICAgICAgXG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB2YXIgbm9kZVNpemUgPSBzaXplIHx8IDYwXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu44CR6K6+572u6buY6K6k54q25oCB77yM56Gu5L+d6IqC54K55Y+v6KeBXG4gICAgICAgIGlmIChzcHJpdGVOb2RlKSB7XG4gICAgICAgICAgICBzcHJpdGVOb2RlLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgIHNwcml0ZU5vZGUub3BhY2l0eSA9IDI1NVxuICAgICAgICAgICAgc3ByaXRlTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR57uf5LiA5aSE55CG5aS05YOP5Yqg6L2977yM5LiN5YaN5Yy65YiG5py65Zmo5Lq65ZKM55yf5Lq6XG4gICAgICAgIC8vIOacuuWZqOS6uuS5n+S9v+eUqOacjeWKoeerr+S8oOadpeeahOato+ehruWktOWDj1VSTFxuICAgICAgICBpZiAoIWF2YXRhclVybCB8fCBhdmF0YXJVcmwgPT09IFwiXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+WvO+4jyBbX2xvYWRBdmF0YXJGb3JQb2RpdW1dIOWktOWDj1VSTOS4uuepuu+8jOS9v+eUqOm7mOiupOWktOWDj1wiKVxuICAgICAgICAgICAgLy8g5aS05YOPVVJM5Li656m65pe25L2/55So6buY6K6k5aS05YOPXG4gICAgICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcIlVJL2hlYWRpbWFnZS9hdmF0YXJfMVwiLCBjYy5TcHJpdGVGcmFtZSwgZnVuY3Rpb24oZXJyLCBzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgICAgIGlmICghZXJyICYmIHNwcml0ZUZyYW1lICYmIHNwcml0ZSAmJiBzcHJpdGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICBzcHJpdGUuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCflrzvuI8gW19sb2FkQXZhdGFyRm9yUG9kaXVtXSDpu5jorqTlpLTlg4/orr7nva7miJDlip9cIilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChhdmF0YXJVcmwuaW5kZXhPZihcImh0dHBcIikgPT09IDAgfHwgYXZhdGFyVXJsLmluZGV4T2YoXCIvL1wiKSA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn5a877iPIFtfbG9hZEF2YXRhckZvclBvZGl1bV0g5Yqg6L296L+c56iL5aS05YOPLi4uXCIpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkvb/nlKggY2MuYXNzZXRNYW5hZ2VyLmxvYWRSZW1vdGUg5Yqg6L296L+c56iL5Zu+54mHXG4gICAgICAgICAgICBjYy5hc3NldE1hbmFnZXIubG9hZFJlbW90ZShhdmF0YXJVcmwsIGZ1bmN0aW9uKGVyciwgdGV4dHVyZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCflrzvuI8gW19sb2FkQXZhdGFyRm9yUG9kaXVtXSDliqDovb3ov5znqIvlpLTlg4/lpLHotKU6XCIsIGVycilcbiAgICAgICAgICAgICAgICAgICAgLy8g5bCd6K+V5L2/55So5YaF572u5aS05YOPXG4gICAgICAgICAgICAgICAgICAgIGNjLnJlc291cmNlcy5sb2FkKFwiVUkvaGVhZGltYWdlL2F2YXRhcl8xXCIsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIyLCBmYWxsYmFja1Nwcml0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlcnIyICYmIGZhbGxiYWNrU3ByaXRlICYmIHNwcml0ZSAmJiBzcHJpdGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwcml0ZS5zcHJpdGVGcmFtZSA9IGZhbGxiYWNrU3ByaXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn5a877iPIFtfbG9hZEF2YXRhckZvclBvZGl1bV0g5L2/55So6buY6K6k5aS05YOPXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoIXRleHR1cmUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCflrzvuI8gW19sb2FkQXZhdGFyRm9yUG9kaXVtXSB0ZXh0dXJlIOS4uuepulwiKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruajgOafpeOAkeehruS/nSBzcHJpdGUg57uE5Lu25LuN54S25pyJ5pWIXG4gICAgICAgICAgICAgICAgaWYgKCFzcHJpdGUgfHwgIXNwcml0ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCflrzvuI8gW19sb2FkQXZhdGFyRm9yUG9kaXVtXSBzcHJpdGUg57uE5Lu25bey5aSx5pWI77yM6Lez6L+H6K6+572uXCIpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCflrzvuI8gW19sb2FkQXZhdGFyRm9yUG9kaXVtXSDov5znqIvlpLTlg4/liqDovb3miJDlip8sIHRleHR1cmU6XCIsIHRleHR1cmUud2lkdGgsIFwieFwiLCB0ZXh0dXJlLmhlaWdodClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5Yib5bu6IFNwcml0ZUZyYW1lIOW5tuiuvue9rlxuICAgICAgICAgICAgICAgIHZhciBzcHJpdGVGcmFtZSA9IG5ldyBjYy5TcHJpdGVGcmFtZSh0ZXh0dXJlKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOiuvue9riBzcHJpdGVGcmFtZVxuICAgICAgICAgICAgICAgIHNwcml0ZS5zcHJpdGVGcmFtZSA9IHNwcml0ZUZyYW1lXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeehruS/neiKgueCueWwuuWvuOato+ehrlxuICAgICAgICAgICAgICAgIGlmIChzcHJpdGVOb2RlICYmIHNwcml0ZU5vZGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICBzcHJpdGVOb2RlLnNldENvbnRlbnRTaXplKG5vZGVTaXplLCBub2RlU2l6ZSlcbiAgICAgICAgICAgICAgICAgICAgc3ByaXRlTm9kZS5vcGFjaXR5ID0gMjU1XG4gICAgICAgICAgICAgICAgICAgIHNwcml0ZU5vZGUuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCflrzvuI8gW19sb2FkQXZhdGFyRm9yUG9kaXVtXSDoioLngrnlsLrlr7jlt7Lorr7nva7kuLo6XCIsIG5vZGVTaXplKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5by65Yi25Yi35pawIFNwcml0ZSDnu4Tku7ZcbiAgICAgICAgICAgICAgICBzcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NXG4gICAgICAgICAgICAgICAgc3ByaXRlLm1hcmtGb3JSZW5kZXIoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+WvO+4jyBbX2xvYWRBdmF0YXJGb3JQb2RpdW1dIOWktOWDj+iuvue9ruWujOaIkO+8gVwiKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBsb2NhbFBhdGggPSBcIlVJL2hlYWRpbWFnZS9cIiArIGF2YXRhclVybFxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn5a877iPIFtfbG9hZEF2YXRhckZvclBvZGl1bV0g5Yqg6L295pys5Zyw5aS05YOPOlwiLCBsb2NhbFBhdGgpXG4gICAgICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChsb2NhbFBhdGgsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVyciB8fCAhc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCflrzvuI8gW19sb2FkQXZhdGFyRm9yUG9kaXVtXSDliqDovb3mnKzlnLDlpLTlg4/lpLHotKU6XCIsIGVycilcbiAgICAgICAgICAgICAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoXCJVSS9oZWFkaW1hZ2UvYXZhdGFyXzFcIiwgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVycjIsIGZhbGxiYWNrU3ByaXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVycjIgJiYgZmFsbGJhY2tTcHJpdGUgJiYgc3ByaXRlICYmIHNwcml0ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ByaXRlLnNwcml0ZUZyYW1lID0gZmFsbGJhY2tTcHJpdGVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChzcHJpdGUgJiYgc3ByaXRlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWVcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn5a877iPIFtfbG9hZEF2YXRhckZvclBvZGl1bV0g5pys5Zyw5aS05YOP6K6+572u5oiQ5YqfXCIpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeiOt+WPluacuuWZqOS6uuaYvuekuuWQjeensFxuICAgICAqL1xuICAgIF9nZXRSb2JvdERpc3BsYXlOYW1lOiBmdW5jdGlvbihwbGF5ZXJJZCwgb3JpZ2luYWxOYW1lKSB7XG4gICAgICAgIGlmIChvcmlnaW5hbE5hbWUgJiYgb3JpZ2luYWxOYW1lLmluZGV4T2YoXCLmmbrog73pmarnu4NcIikgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbE5hbWVcbiAgICAgICAgfVxuICAgICAgICB2YXIgcm9ib3RJbmRleCA9IDFcbiAgICAgICAgaWYgKHBsYXllcklkKSB7XG4gICAgICAgICAgICB2YXIgbGFzdENoYXIgPSBwbGF5ZXJJZC50b1N0cmluZygpLnNsaWNlKC0xKVxuICAgICAgICAgICAgcm9ib3RJbmRleCA9IHBhcnNlSW50KGxhc3RDaGFyKSB8fCAxXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFwi5pm66IO96Zmq57uDXCIgKyByb2JvdEluZGV4ICsgXCLlj7dcIlxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeagvOW8j+WMlumHkeW4geaYvuekulxuICAgICAqL1xuICAgIF9mb3JtYXRNYXRjaENvaW46IGZ1bmN0aW9uKGNvaW4pIHtcbiAgICAgICAgaWYgKGNvaW4gPj0gMTAwMDApIHtcbiAgICAgICAgICAgIHJldHVybiAoY29pbiAvIDEwMDAwKS50b0ZpeGVkKDEpICsgXCLkuIdcIlxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb2luLnRvU3RyaW5nKClcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOmakOiXj+acgOe7iOamnOWNleW8ueeql1xuICAgICAqL1xuICAgIF9oaWRlQXJlbmFGaW5hbFJhbmtEaWFsb2c6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fYXJlbmFGaW5hbFJhbmtEaWFsb2cpIHtcbiAgICAgICAgICAgIHRoaXMuX2FyZW5hRmluYWxSYW5rRGlhbG9nLmRlc3Ryb3koKVxuICAgICAgICAgICAgdGhpcy5fYXJlbmFGaW5hbFJhbmtEaWFsb2cgPSBudWxsXG4gICAgICAgIH1cbiAgICB9XG59KTtcbiJdfQ==