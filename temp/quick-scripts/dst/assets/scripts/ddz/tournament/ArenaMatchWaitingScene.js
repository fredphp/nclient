
                (function() {
                    var nodeEnv = typeof require !== 'undefined' && typeof process !== 'undefined';
                    var __module = nodeEnv ? module : {exports:{}};
                    var __filename = 'preview-scripts/assets/scripts/ddz/tournament/ArenaMatchWaitingScene.js';
                    var __require = nodeEnv ? function (request) {
                        return cc.require(request);
                    } : function (request) {
                        return __quick_compile_project__.require(request, __filename);
                    };
                    function __define (exports, require, module) {
                        if (!nodeEnv) {__quick_compile_project__.registerModule(__filename, module);}"use strict";
cc._RF.push(module, '38a3d0afaecf439abdfa63', 'ArenaMatchWaitingScene');
// scripts/ddz/tournament/ArenaMatchWaitingScene.js

"use strict";

/**
 * ArenaMatchWaitingScene - 竞技场比赛等待界面
 * 
 * 功能：
 * 1. 显示所有报名玩家列表（头像+昵称）
 * 2. 实时更新玩家加入信息
 * 3. 显示倒计时
 * 4. 等待阶段结束后自动进入游戏
 * 
 * 🔧【重要】此脚本完全动态创建 UI，不依赖场景文件中的组件引用
 */
cc.Class({
  "extends": cc.Component,
  properties: {// 无属性定义，所有 UI 动态创建
  },
  // LIFE-CYCLE CALLBACKS:
  onLoad: function onLoad() {
    // 初始化数据
    this._periodNo = "";
    this._roomId = 0;
    this._roomName = "";
    this._countdown = 60;
    this._totalPlayers = 0;
    this._enteredPlayers = 0;
    this._players = [];
    this._startTime = 0; // 创建整个 UI

    this._createUI(); // 注册事件监听


    this._registerEvents(); // 从全局变量获取初始数据


    this._initFromGlobalData(); // 监听 room_joined 消息以进入游戏场景


    this._registerRoomJoinedHandler();

    console.log("🏟️ [ArenaMatchWaiting] 等待界面加载完成");
  },

  /**
   * 创建完整 UI
   */
  _createUI: function _createUI() {
    var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
    var screenHeight = canvas ? canvas.designResolution.height : 720;
    var screenWidth = canvas ? canvas.designResolution.width : 1280; // 1. 创建背景（使用 join_bk.png）

    this._createBackground(screenWidth, screenHeight); // 2. 创建顶部信息栏


    this._createTopBar(screenWidth, screenHeight); // 3. 创建玩家列表容器


    this._createPlayerListContainer(screenWidth, screenHeight);
  },

  /**
   * 创建背景（使用 join_bk.png）
   */
  _createBackground: function _createBackground(width, height) {
    // 创建背景节点
    var bgNode = new cc.Node("Background");
    bgNode.setContentSize(cc.size(width, height));
    bgNode.setPosition(0, 0);
    bgNode.zIndex = -100;
    var sprite = bgNode.addComponent(cc.Sprite);
    sprite.type = cc.Sprite.Type.SIMPLE;
    sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM; // 加载背景图片

    cc.resources.load('join_bk', cc.SpriteFrame, function (err, spriteFrame) {
      if (err) {
        console.warn("🏟️ [ArenaMatchWaiting] 无法加载背景图 join_bk.png，使用纯色背景"); // 使用深色背景作为后备

        var graphics = bgNode.addComponent(cc.Graphics);
        graphics.fillColor = cc.color(25, 30, 50, 255);
        graphics.rect(-width / 2, -height / 2, width, height);
        graphics.fill();
        return;
      }

      if (sprite && sprite.node && sprite.node.isValid) {
        sprite.spriteFrame = spriteFrame;
      }
    });
    bgNode.parent = this.node;
    this._bgNode = bgNode;
  },

  /**
   * 创建顶部信息栏
   */
  _createTopBar: function _createTopBar(width, height) {
    // 顶部信息栏容器
    var topBar = new cc.Node("TopBar");
    topBar.setContentSize(cc.size(width - 100, 100));
    topBar.setPosition(0, height / 2 - 80); // 半透明背景

    var bg = new cc.Node("Bg");
    bg.setContentSize(cc.size(width - 100, 100));
    var graphics = bg.addComponent(cc.Graphics);
    graphics.fillColor = cc.color(0, 0, 0, 150);
    graphics.roundRect(-(width - 100) / 2, -50, width - 100, 100, 10);
    graphics.fill();
    bg.parent = topBar; // 期号

    var periodNode = new cc.Node("PeriodNo");
    periodNode.setPosition(-width / 2 + 150, 25);
    var periodLabel = periodNode.addComponent(cc.Label);
    periodLabel.string = "期号: --";
    periodLabel.fontSize = 22;
    periodLabel.lineHeight = 28;
    periodNode.color = cc.color(255, 215, 0);
    var periodOutline = periodNode.addComponent(cc.LabelOutline);
    periodOutline.color = cc.color(0, 0, 0);
    periodOutline.width = 2;
    periodNode.parent = topBar;
    this._periodNoLabel = periodLabel; // 房间名称

    var roomNode = new cc.Node("RoomName");
    roomNode.setPosition(0, 25);
    var roomLabel = roomNode.addComponent(cc.Label);
    roomLabel.string = "竞技场";
    roomLabel.fontSize = 28;
    roomLabel.lineHeight = 36;
    roomNode.color = cc.color(255, 215, 0); // 金色，与期号一致

    var roomOutline = roomNode.addComponent(cc.LabelOutline);
    roomOutline.color = cc.color(0, 0, 0);
    roomOutline.width = 2;
    roomNode.parent = topBar;
    this._roomNameLabel = roomLabel; // 倒计时

    var countdownNode = new cc.Node("Countdown");
    countdownNode.setPosition(width / 2 - 150, 25);
    var countdownLabel = countdownNode.addComponent(cc.Label);
    countdownLabel.string = "60秒";
    countdownLabel.fontSize = 24;
    countdownLabel.lineHeight = 32;
    countdownNode.color = cc.color(100, 255, 100);
    var countdownOutline = countdownNode.addComponent(cc.LabelOutline);
    countdownOutline.color = cc.color(0, 0, 0);
    countdownOutline.width = 2;
    countdownNode.parent = topBar;
    this._countdownLabel = countdownLabel; // 玩家数量

    var playerCountNode = new cc.Node("PlayerCount");
    playerCountNode.setPosition(0, -15);
    var playerCountLabel = playerCountNode.addComponent(cc.Label);
    playerCountLabel.string = "已进入: 0 / 0";
    playerCountLabel.fontSize = 20;
    playerCountLabel.lineHeight = 28;
    playerCountNode.color = cc.color(200, 200, 220);
    playerCountNode.parent = topBar;
    this._playerCountLabel = playerCountLabel; // 提示消息

    var msgNode = new cc.Node("Message");
    msgNode.setPosition(0, -45);
    var msgLabel = msgNode.addComponent(cc.Label);
    msgLabel.string = "等待其他玩家进入...";
    msgLabel.fontSize = 16;
    msgLabel.lineHeight = 24;
    msgNode.color = cc.color(255, 200, 100);
    msgNode.parent = topBar;
    this._messageLabel = msgLabel;
    topBar.parent = this.node;
    this._topBar = topBar;
  },

  /**
   * 创建玩家列表容器（一排10个，从左上角开始排列）
   */
  _createPlayerListContainer: function _createPlayerListContainer(width, height) {
    // 玩家区域容器
    var containerNode = new cc.Node("PlayerArea");
    containerNode.setContentSize(cc.size(1160, 440));
    containerNode.setPosition(0, -25); // 半透明背景

    var bgNode = new cc.Node("Bg");
    bgNode.setContentSize(cc.size(1160, 440));
    var bgGraphics = bgNode.addComponent(cc.Graphics);
    bgGraphics.fillColor = cc.color(0, 0, 0, 80);
    bgGraphics.roundRect(-580, -220, 1160, 440, 10);
    bgGraphics.fill();
    bgNode.parent = containerNode; // 内容容器（锚点设在左上角，从左上角开始排列）

    var contentNode = new cc.Node("Content");
    contentNode.setContentSize(cc.size(1150, 420));
    contentNode.anchorX = 0; // 左锚点

    contentNode.anchorY = 1; // 上锚点

    contentNode.setPosition(-575, 210); // 对应左上角位置

    contentNode.parent = containerNode;
    containerNode.parent = this.node;
    this._playerListContent = contentNode;
    this._playerListContainer = containerNode;
  },

  /**
   * 从全局变量初始化数据
   */
  _initFromGlobalData: function _initFromGlobalData() {
    var myglobal = window.myglobal; // 优先检查缓存的状态数据（服务端推送的最新数据）

    if (myglobal && myglobal.arenaWaitingStatusCache) {
      var cachedData = myglobal.arenaWaitingStatusCache;
      console.log("🏟️ [ArenaMatchWaiting] 发现缓存的等待状态数据，玩家数量:", cachedData.players ? cachedData.players.length : 0); // 检查期号是否匹配

      var expectedPeriodNo = myglobal.arenaWaitingData ? myglobal.arenaWaitingData.period_no : "";

      if (!expectedPeriodNo || cachedData.period_no === expectedPeriodNo) {
        this._periodNo = cachedData.period_no || "";
        this._roomId = cachedData.room_id || 0;
        this._roomName = cachedData.room_name || "";
        this._countdown = cachedData.countdown || 60;
        this._totalPlayers = cachedData.total_players || 0;
        this._enteredPlayers = cachedData.entered_players || 1;
        this._players = cachedData.players || [];
        this._startTime = cachedData.start_time || Date.now();

        this._updateUI();

        console.log("🏟️ [ArenaMatchWaiting] 从缓存数据初始化完成，显示玩家:", this._players.length); // 清除缓存

        myglobal.arenaWaitingStatusCache = null;
        return;
      }
    } // 使用 arenaWaitingData（点击进入时设置的数据）


    if (myglobal && myglobal.arenaWaitingData) {
      var data = myglobal.arenaWaitingData;
      this._periodNo = data.period_no || "";
      this._roomId = data.room_id || 0;
      this._roomName = data.room_name || "";
      this._countdown = data.countdown || 60;
      this._totalPlayers = data.total_players || 0;
      this._enteredPlayers = data.entered_players || 1;
      this._players = data.players || [];
      this._startTime = data.start_time || Date.now();

      this._updateUI();

      console.log("🏟️ [ArenaMatchWaiting] 从全局变量初始化数据完成"); // 如果玩家列表为空，请求服务端推送状态

      if (this._players.length === 0) {
        console.log("🏟️ [ArenaMatchWaiting] 玩家列表为空，请求服务端推送状态");

        this._requestWaitingStatus();
      }
    }
  },

  /**
   * 请求服务端推送等待状态
   */
  _requestWaitingStatus: function _requestWaitingStatus() {
    var myglobal = window.myglobal;
    var socket = myglobal && myglobal.socket;

    if (socket && socket.sendArenaEnter) {
      // 重新发送 arena_enter 请求，服务端会推送当前状态
      socket.sendArenaEnter({
        period_no: this._periodNo,
        room_id: this._roomId
      });
      console.log("🏟️ [ArenaMatchWaiting] 已请求服务端推送等待状态");
    }
  },

  /**
   * 监听 room_joined 消息以进入游戏场景
   * 🔧【关键修改】
   * 1. 停止加载动画
   * 2. 保存预加载数据到 myglobal.roomData 和 myglobal.arenaMatchData
   * 3. 直接进入游戏场景，无需重新请求数据
   * 🔧【修复】添加防重复加载机制，避免多个监听器同时处理导致场景状态混乱
   */
  _registerRoomJoinedHandler: function _registerRoomJoinedHandler() {
    var self = this;
    var myglobal = window.myglobal;
    var socket = myglobal && myglobal.socket;

    if (socket && socket.onRoomJoined) {
      socket.onRoomJoined(function (roomData) {
        console.log("🏟️ [ArenaMatchWaiting] 收到 room_joined，准备进入游戏场景:", JSON.stringify(roomData)); // 🔧【关键修复】防止重复加载游戏场景
        // 检查全局标志，如果已经在加载中则跳过

        if (myglobal && myglobal._isEnteringGameScene) {
          console.log("🏟️ [ArenaMatchWaiting] 已在加载游戏场景中，跳过重复请求");
          return;
        } // 检查是否是竞技场房间


        var roomCategory = roomData.room_category || 1;

        if (roomCategory !== 2) {
          console.log("🏟️ [ArenaMatchWaiting] 不是竞技场房间，忽略");
          return;
        } // 🔧【关键修复】设置全局标志，防止其他监听器重复加载


        if (myglobal) {
          myglobal._isEnteringGameScene = true;
        } // 🔧【关键修复】停止加载动画


        self._stopLoadingAnimation(); // 转换数据格式


        var players = roomData.players || [];
        var convertedRoomData = {
          roomid: roomData.room_code || "ARENA",
          room_code: roomData.room_code || "ARENA",
          seatindex: roomData.player ? roomData.player.seat + 1 : 1,
          playerdata: players.map(function (p, idx) {
            return {
              accountid: p.id,
              nick_name: p.name,
              avatarUrl: p.avatar || "avatar_1",
              gold_count: p.gold_count || 0,
              goldcount: p.gold_count || 0,
              seatindex: (p.seat !== undefined ? p.seat : idx) + 1,
              isready: p.ready || false,
              arena_gold: p.arena_gold || 0,
              match_coin: p.match_coin || 0,
              period_no: p.period_no || ""
            };
          }),
          housemanageid: roomData.creator_id || "",
          creator_id: roomData.creator_id || "",
          room_category: 2,
          period_no: self._periodNo
        }; // 🔧【关键修复】保存预加载数据到 myglobal

        if (myglobal) {
          // 保存房间数据
          myglobal.roomData = convertedRoomData; // 🔧【新增】保存竞技场比赛数据（用于游戏场景）

          myglobal.arenaMatchData = {
            periodNo: self._periodNo,
            roomId: self._roomId,
            roomName: self._roomName,
            totalPlayers: self._totalPlayers,
            totalTables: self._totalTables || 0,
            players: self._players,
            matchRounds: roomData.match_rounds || 0,
            currentRound: roomData.current_round || 1
          };
          console.log("🏟️ [ArenaMatchWaiting] 预加载数据已保存:");
          console.log("  - myglobal.roomData.playerdata:", convertedRoomData.playerdata.length, "人");
          console.log("  - myglobal.arenaMatchData.periodNo:", self._periodNo);
          console.log("  - 头像缓存数量:", myglobal._avatarCache ? Object.keys(myglobal._avatarCache).length : 0);
        } // 🔧【优化】直接进入游戏场景，无需重新请求数据
        // 游戏场景会从 myglobal.roomData 读取预加载数据


        console.log("🏟️ [ArenaMatchWaiting] 进入游戏场景...");
        cc.director.loadScene("gameScene", function (err) {
          if (err) {
            console.error("🏟️ [ArenaMatchWaiting] 加载游戏场景失败:", err);

            if (myglobal) {
              myglobal._isEnteringGameScene = false;
            }

            return;
          } // 🔧【关键修复】延迟重置标志，确保场景完全加载


          setTimeout(function () {
            if (myglobal) {
              myglobal._isEnteringGameScene = false;
            }
          }, 2000);
        });
      });
    }
  },
  onDestroy: function onDestroy() {
    // 停止加载动画
    this._stopLoadingAnimation(); // 取消事件监听


    this._unregisterEvents();

    console.log("🏟️ [ArenaMatchWaiting] 场景销毁，已停止加载动画");
  },
  // ============================================================
  // 事件监听
  // ============================================================
  _registerEvents: function _registerEvents() {
    var self = this;
    var myglobal = window.myglobal;
    var evt = myglobal && myglobal.eventlister;
    console.log("🏟️ [ArenaMatchWaiting] 注册事件监听, evt:", evt ? "存在" : "不存在");

    if (!evt) {
      console.warn("🏟️ [ArenaMatchWaiting] eventlister 不存在，无法注册事件");
      return;
    } // 等待状态推送


    this._waitingStatusHandler = function (data) {
      console.log("🏟️ [ArenaMatchWaiting] ✅ 收到等待状态:", JSON.stringify(data));

      self._onWaitingStatus(data);
    };

    evt.on("arena_waiting_status_notify", this._waitingStatusHandler); // 倒计时更新

    this._waitingTickHandler = function (data) {
      console.log("🏟️ [ArenaMatchWaiting] 倒计时更新:", data.countdown);

      self._onWaitingTick(data);
    };

    evt.on("arena_waiting_tick_notify", this._waitingTickHandler); // 玩家加入广播

    this._playerJoinedHandler = function (data) {
      console.log("🏟️ [ArenaMatchWaiting] 玩家加入:", JSON.stringify(data));

      self._onPlayerJoined(data);
    };

    evt.on("arena_player_joined_notify", this._playerJoinedHandler); // 分配阶段开始

    this._assignStartHandler = function (data) {
      console.log("🏟️ [ArenaMatchWaiting] 分配阶段开始:", JSON.stringify(data));

      self._onAssignStart(data);
    };

    evt.on("arena_assign_start_notify", this._assignStartHandler);
    console.log("🏟️ [ArenaMatchWaiting] ✅ 事件监听注册完成");
  },
  _unregisterEvents: function _unregisterEvents() {
    var myglobal = window.myglobal;
    var evt = myglobal && myglobal.eventlister;
    if (!evt) return;

    if (this._waitingStatusHandler) {
      evt.off("arena_waiting_status_notify", this._waitingStatusHandler);
    }

    if (this._waitingTickHandler) {
      evt.off("arena_waiting_tick_notify", this._waitingTickHandler);
    }

    if (this._playerJoinedHandler) {
      evt.off("arena_player_joined_notify", this._playerJoinedHandler);
    }

    if (this._assignStartHandler) {
      evt.off("arena_assign_start_notify", this._assignStartHandler);
    }

    console.log("🏟️ [ArenaMatchWaiting] 事件监听已取消");
  },
  // ============================================================
  // 公共方法
  // ============================================================

  /**
   * 设置初始数据
   * @param {Object} data - { period_no, room_id, room_name, countdown, total_players, entered_players, players, message }
   */
  setData: function setData(data) {
    this._periodNo = data.period_no || "";
    this._roomId = data.room_id || 0;
    this._roomName = data.room_name || "";
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
  _onPlayerJoined: function _onPlayerJoined(data) {
    // 检查期号是否匹配
    if (this._periodNo && data.period_no !== this._periodNo) {
      return;
    } // 更新玩家列表


    this._players = data.players || [];
    this._enteredPlayers = data.entered_players;
    this._totalPlayers = data.total_players; // 显示加入提示

    var newPlayer = data.player;

    if (newPlayer && newPlayer.player_name) {
      this._showJoinMessage(newPlayer.player_name + " 进入了比赛");
    } // 更新UI


    this._updatePlayerListUI();

    this._updatePlayerCountUI();
  },
  _onAssignStart: function _onAssignStart(data) {
    // 检查期号是否匹配
    if (this._periodNo && data.period_no !== this._periodNo) {
      return;
    }

    console.log("🏟️ [ArenaMatchWaiting] 分配阶段开始:", JSON.stringify(data));
    this._countdown = data.countdown;
    this._totalPlayers = data.total_players;
    this._enteredPlayers = data.total_players;
    this._totalTables = data.total_tables || 0; // 🔧【关键修改】显示"系统分配中"加载动画

    this._showAssigningLoadingUI(data); // 🔧【关键修改】预加载所有玩家头像资源


    this._preloadAllPlayerAvatars(); // 更新UI


    this._updateUI();
  },

  /**
   * 🔧【新增】显示"系统分配中"加载动画
   */
  _showAssigningLoadingUI: function _showAssigningLoadingUI(data) {
    var self = this; // 显示分配消息

    if (this._messageLabel) {
      this._messageLabel.string = data.message || "系统分配中...";
      this._messageLabel.node.color = cc.color(255, 220, 100);
    } // 创建加载动画覆盖层


    var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
    var screenHeight = canvas ? canvas.designResolution.height : 720;
    var screenWidth = canvas ? canvas.designResolution.width : 1280; // 创建加载覆盖层

    var loadingOverlay = new cc.Node("AssigningLoadingOverlay");
    loadingOverlay.setContentSize(cc.size(screenWidth, screenHeight));
    loadingOverlay.setPosition(0, 0);
    loadingOverlay.zIndex = 1000; // 半透明背景

    var bgNode = new cc.Node("Bg");
    bgNode.setContentSize(cc.size(screenWidth, screenHeight));
    var bgGraphics = bgNode.addComponent(cc.Graphics);
    bgGraphics.fillColor = cc.color(0, 0, 0, 150);
    bgGraphics.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
    bgGraphics.fill();
    bgNode.parent = loadingOverlay; // 创建加载图标容器（旋转动画）

    var loadingContainer = new cc.Node("LoadingContainer");
    loadingContainer.setPosition(0, 50);
    loadingContainer.parent = loadingOverlay; // 加载图标（使用简单的圆形旋转动画）

    var loadingIcon = new cc.Node("LoadingIcon");
    loadingIcon.setContentSize(cc.size(60, 60));
    var iconGraphics = loadingIcon.addComponent(cc.Graphics); // 绘制加载圆环

    iconGraphics.strokeColor = cc.color(255, 215, 0);
    iconGraphics.lineWidth = 4;
    iconGraphics.arc(0, 0, 25, 0, Math.PI * 1.5, false);
    iconGraphics.stroke();
    loadingIcon.parent = loadingContainer; // 保存引用以便旋转动画

    this._loadingIconNode = loadingIcon; // 加载文字

    var loadingLabel = new cc.Node("LoadingLabel");
    loadingLabel.setPosition(0, -30);
    var label = loadingLabel.addComponent(cc.Label);
    label.string = "系统分配中...";
    label.fontSize = 28;
    label.lineHeight = 36;
    label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    loadingLabel.color = cc.color(255, 220, 100);
    var outline = loadingLabel.addComponent(cc.LabelOutline);
    outline.color = cc.color(0, 0, 0);
    outline.width = 2;
    loadingLabel.parent = loadingContainer;
    this._assigningLoadingLabel = label;
    loadingOverlay.parent = this.node;
    this._assigningLoadingOverlay = loadingOverlay; // 启动旋转动画

    this._startLoadingAnimation();

    console.log("🏟️ [ArenaMatchWaiting] 显示'系统分配中'加载动画");
  },

  /**
   * 🔧【新增】启动加载动画
   */
  _startLoadingAnimation: function _startLoadingAnimation() {
    var self = this;
    this._loadingAnimScheduled = true; // 使用 schedule 更新旋转角度

    this.schedule(function () {
      if (self._loadingIconNode && self._loadingIconNode.isValid) {
        self._loadingIconNode.angle += 5;
      }
    }, 0.016); // 约60fps
  },

  /**
   * 🔧【新增】停止加载动画
   */
  _stopLoadingAnimation: function _stopLoadingAnimation() {
    if (this._loadingAnimScheduled) {
      this.unschedule(this._startLoadingAnimation);
      this._loadingAnimScheduled = false;
    }

    if (this._assigningLoadingOverlay && this._assigningLoadingOverlay.isValid) {
      this._assigningLoadingOverlay.destroy();

      this._assigningLoadingOverlay = null;
    }

    this._loadingIconNode = null;
  },

  /**
   * 🔧【新增】预加载所有玩家头像资源
   */
  _preloadAllPlayerAvatars: function _preloadAllPlayerAvatars() {
    var self = this;

    if (!this._players || this._players.length === 0) {
      console.log("🏟️ [ArenaMatchWaiting] 没有玩家头像需要预加载");
      return;
    } // 收集所有头像URL


    var avatarUrls = [];

    for (var i = 0; i < this._players.length; i++) {
      var player = this._players[i];
      var avatarUrl = player.avatar || player.avatarUrl || "avatar_1";

      if (avatarUrl && avatarUrls.indexOf(avatarUrl) === -1) {
        avatarUrls.push(avatarUrl);
      }
    }

    console.log("🏟️ [ArenaMatchWaiting] 预加载玩家头像数量:", avatarUrls.length); // 初始化头像缓存

    var myglobal = window.myglobal;

    if (myglobal && !myglobal._avatarCache) {
      myglobal._avatarCache = {};
    } // 预加载头像


    var loadedCount = 0;
    var totalCount = avatarUrls.length;

    var onLoaded = function onLoaded() {
      loadedCount++;

      if (loadedCount >= totalCount) {
        console.log("🏟️ [ArenaMatchWaiting] 所有玩家头像预加载完成");
      }
    };

    for (var j = 0; j < avatarUrls.length; j++) {
      this._preloadSingleAvatar(avatarUrls[j], onLoaded);
    }
  },

  /**
   * 🔧【新增】预加载单个头像
   */
  _preloadSingleAvatar: function _preloadSingleAvatar(avatarUrl, callback) {
    var myglobal = window.myglobal; // 如果已缓存，直接返回

    if (myglobal && myglobal._avatarCache && myglobal._avatarCache[avatarUrl]) {
      if (callback) callback();
      return;
    } // 判断是否是远程URL


    if (avatarUrl.indexOf('http://') === 0 || avatarUrl.indexOf('https://') === 0) {
      cc.assetManager.loadRemote(avatarUrl, {
        ext: '.png'
      }, function (err, texture) {
        if (!err && texture && myglobal && myglobal._avatarCache) {
          try {
            myglobal._avatarCache[avatarUrl] = new cc.SpriteFrame(texture);
            console.log("🏟️ [ArenaMatchWaiting] 远程头像预加载成功:", avatarUrl);
          } catch (e) {
            console.warn("🏟️ [ArenaMatchWaiting] 缓存头像失败:", e);
          }
        }

        if (callback) callback();
      });
    } else {
      // 本地资源
      cc.resources.load('UI/headimage/' + avatarUrl, cc.SpriteFrame, function (err, spriteFrame) {
        if (!err && spriteFrame && myglobal && myglobal._avatarCache) {
          myglobal._avatarCache[avatarUrl] = spriteFrame;
          console.log("🏟️ [ArenaMatchWaiting] 本地头像预加载成功:", avatarUrl);
        }

        if (callback) callback();
      });
    }
  },
  // ============================================================
  // UI更新
  // ============================================================
  _updateUI: function _updateUI() {
    // 更新期号
    if (this._periodNoLabel) {
      this._periodNoLabel.string = "期号: " + this._periodNo;
    } // 更新房间名称


    if (this._roomNameLabel) {
      this._roomNameLabel.string = this._roomName || "竞技场";
    } // 更新倒计时


    this._updateCountdownUI(); // 更新玩家数量


    this._updatePlayerCountUI(); // 更新玩家列表


    this._updatePlayerListUI();
  },
  _updateCountdownUI: function _updateCountdownUI() {
    if (this._countdownLabel) {
      this._countdownLabel.string = this._countdown + "秒"; // 最后10秒变红

      if (this._countdown <= 10 && this._countdown > 0) {
        this._countdownLabel.node.color = cc.color(255, 100, 100);
      } else {
        this._countdownLabel.node.color = cc.color(100, 255, 100);
      }
    }
  },
  _updatePlayerCountUI: function _updatePlayerCountUI() {
    if (this._playerCountLabel) {
      this._playerCountLabel.string = "已进入: " + this._enteredPlayers + " / " + this._totalPlayers;
    }
  },
  // ============================================================
  // 玩家列表渲染（一排10个，从左上角开始排列）
  // ============================================================
  _updatePlayerListUI: function _updatePlayerListUI() {
    if (!this._playerListContent) return; // 清空现有列表

    this._playerListContent.removeAllChildren();

    var players = this._players || [];
    console.log("🏟️ [ArenaMatchWaiting] 更新玩家列表，玩家数量:", players.length);

    if (players.length === 0) {
      console.log("🏟️ [ArenaMatchWaiting] 没有玩家数据，跳过渲染");
      return;
    } // 排序：已进入的玩家（entered_at > 0）排在前面，等待中的排在后面


    var sortedPlayers = players.slice().sort(function (a, b) {
      var aEntered = a.entered_at && a.entered_at > 0;
      var bEntered = b.entered_at && b.entered_at > 0; // 已进入的排在前面

      if (aEntered && !bEntered) return -1;
      if (!aEntered && bEntered) return 1; // 同状态按进入时间排序

      return (a.entered_at || 0) - (b.entered_at || 0);
    });
    console.log("🏟️ [ArenaMatchWaiting] 排序后玩家:", sortedPlayers.map(function (p) {
      return p.player_name + (p.entered_at > 0 ? '(已进入)' : '(等待中)');
    }).join(', ')); // 布局参数：一排10个，从左上角开始排列
    // 🔧【修改】更新布局参数以适应新的卡片高度

    var itemWidth = 100; // 卡片宽度

    var itemHeight = 140; // 卡片高度（增加了20px以容纳金币）

    var spacingX = 10; // 水平间距

    var spacingY = 10; // 垂直间距

    var cols = 10; // 一排10个

    var marginX = 10; // 左边距

    var marginY = 10; // 上边距
    // 添加玩家项

    for (var i = 0; i < sortedPlayers.length; i++) {
      var player = sortedPlayers[i];
      var statusText = player.entered_at && player.entered_at > 0 ? '(已进入)' : '(等待中)';
      console.log("🏟️ [ArenaMatchWaiting] 创建玩家卡片:", i, player.player_name, statusText);

      var itemNode = this._createPlayerItem(player, i); // 计算位置（从左上角开始，锚点为左上角）
      // contentNode 的锚点是 (0, 1)，即左上角
      // (0, 0) 是左上角，x 向右增加，y 向下减少


      var col = i % cols;
      var row = Math.floor(i / cols);
      var x = marginX + col * (itemWidth + spacingX) + itemWidth / 2; // 卡片中心位置

      var y = -marginY - row * (itemHeight + spacingY) - itemHeight / 2; // Y向下为负

      itemNode.setPosition(x, y);
      itemNode.parent = this._playerListContent;
    }
  },

  /**
   * 创建玩家卡片（紧凑卡片，圆形头像，与原大厅界面一致）
   * 🔧【修复】添加金币和排名显示
   */
  _createPlayerItem: function _createPlayerItem(player, index) {
    var itemNode = new cc.Node("PlayerCard_" + index);
    itemNode.setContentSize(cc.size(100, 140)); // 🔧【修改】增加高度以容纳金币
    // 卡片背景（圆角矩形）

    var bgNode = new cc.Node("Bg");
    bgNode.setContentSize(cc.size(95, 135)); // 🔧【修改】增加高度

    var bgGraphics = bgNode.addComponent(cc.Graphics); // 🔧【修复】机器人和真人使用相同背景色，不再区分

    bgGraphics.fillColor = cc.color(40, 60, 80, 230); // 统一蓝色调

    bgGraphics.roundRect(-47.5, -67.5, 95, 135, 8); // 🔧【修改】调整圆角矩形

    bgGraphics.fill();
    bgNode.parent = itemNode; // ========== 排名标签（左上角）==========
    // 🔧【新增】显示排名

    var rankNode = new cc.Node("Rank");
    rankNode.setPosition(-30, 55); // 左上角

    var rankLabel = rankNode.addComponent(cc.Label);
    rankLabel.string = "#" + (player.rank || index + 1);
    rankLabel.fontSize = 12;
    rankLabel.lineHeight = 14;
    rankNode.color = cc.color(255, 215, 0); // 金色

    var rankOutline = rankNode.addComponent(cc.LabelOutline);
    rankOutline.color = cc.color(0, 0, 0);
    rankOutline.width = 1;
    rankNode.parent = itemNode; // ========== 圆形头像（使用 Mask 实现圆形裁剪）==========
    // 创建遮罩节点

    var maskNode = new cc.Node("AvatarMask");
    maskNode.setPosition(0, 30); // 🔧【修改】上移

    maskNode.setContentSize(cc.size(50, 50)); // 🔧【修改】缩小头像
    // 添加 Mask 组件

    var mask = maskNode.addComponent(cc.Mask);
    mask.type = cc.Mask.Type.ELLIPSE; // 椭圆形遮罩（圆形）

    mask.segements = 64; // 圆滑度
    // 头像背景圆圈

    var avatarBg = new cc.Node("AvatarBg");
    var avatarBgGraphics = avatarBg.addComponent(cc.Graphics);
    avatarBgGraphics.fillColor = cc.color(80, 80, 100, 255);
    avatarBgGraphics.circle(0, 0, 28);
    avatarBgGraphics.fill();
    avatarBg.parent = maskNode; // 头像节点（在遮罩内部，会被裁剪成圆形）

    var avatarNode = new cc.Node("Avatar");
    avatarNode.setContentSize(cc.size(50, 50));
    var avatarSprite = avatarNode.addComponent(cc.Sprite);
    avatarSprite.type = cc.Sprite.Type.SIMPLE;
    avatarSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM; // 加载头像

    this._loadPlayerAvatar(player.avatar, avatarSprite);

    avatarNode.parent = maskNode;
    maskNode.parent = itemNode; // 昵称

    var nameNode = new cc.Node("Name");
    nameNode.setPosition(0, -10); // 🔧【修改】调整位置

    var nameLabel = nameNode.addComponent(cc.Label);
    nameLabel.string = player.player_name || player.name || "玩家" + (index + 1);
    nameLabel.fontSize = 12;
    nameLabel.lineHeight = 16;
    nameNode.setContentSize(cc.size(90, 16));
    nameLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER; // 🔧【修复】机器人和真人使用相同颜色，不再区分

    nameNode.color = cc.color(150, 220, 255); // 统一浅蓝色

    nameNode.parent = itemNode; // ========== 金币显示 ==========
    // 🔧【新增】显示金币

    var coinNode = new cc.Node("Coin");
    coinNode.setPosition(0, -28);
    var coinLabel = coinNode.addComponent(cc.Label);
    var matchCoin = player.match_coin || 0;

    if (matchCoin >= 10000) {
      coinLabel.string = (matchCoin / 10000).toFixed(1) + "万";
    } else {
      coinLabel.string = matchCoin.toString();
    }

    coinLabel.fontSize = 11;
    coinLabel.lineHeight = 14;
    coinNode.color = cc.color(255, 215, 0); // 金色

    coinNode.parent = itemNode; // 状态标签
    // 规则：根据 entered_at 判断是否已进入

    var statusNode = new cc.Node("Status");
    statusNode.setPosition(0, -48); // 🔧【修改】调整位置

    var statusLabel = statusNode.addComponent(cc.Label);
    statusLabel.fontSize = 10;
    statusLabel.lineHeight = 12;
    statusLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER; // 判断是否已进入：有 entered_at 且值大于0表示已进入

    if (player.entered_at && player.entered_at > 0) {
      statusLabel.string = "已进入";
      statusNode.color = cc.color(100, 255, 150); // 绿色
    } else {
      statusLabel.string = "等待中";
      statusNode.color = cc.color(255, 200, 100); // 橙色
    }

    statusNode.parent = itemNode;
    return itemNode;
  },

  /**
   * 加载玩家头像
   */
  _loadPlayerAvatar: function _loadPlayerAvatar(avatarUrl, sprite) {
    if (!sprite) return; // 如果没有头像URL，使用默认头像

    if (!avatarUrl) {
      cc.resources.load('UI/headimage/avatar_1', cc.SpriteFrame, function (err, spriteFrame) {
        if (!err && spriteFrame && sprite && sprite.node && sprite.node.isValid) {
          sprite.spriteFrame = spriteFrame;
        }
      });
      return;
    } // 如果是完整网络URL


    if (avatarUrl.indexOf('http://') === 0 || avatarUrl.indexOf('https://') === 0) {
      cc.assetManager.loadRemote(avatarUrl, {
        ext: '.png'
      }, function (err, texture) {
        if (!err && texture && sprite && sprite.node && sprite.node.isValid) {
          try {
            var sf = new cc.SpriteFrame(texture);
            sprite.spriteFrame = sf;
          } catch (e) {}
        }
      });
      return;
    } // 服务端上传的头像路径处理（相对路径）
    // 支持格式: "/uploads/file/avatar/..." 


    var myglobal = window.myglobal;
    var cdnUrl = myglobal && myglobal.cdnUrl ? myglobal.cdnUrl : "https://apis.hongxiu88.com";

    if (avatarUrl.indexOf('/uploads/') === 0) {
      // 相对路径，需要添加域名前缀
      var fullUrl = cdnUrl + avatarUrl;
      console.log("🏟️ [ArenaMatchWaiting] 加载头像(相对路径):", fullUrl);
      cc.assetManager.loadRemote(fullUrl, {
        ext: '.png'
      }, function (err, texture) {
        if (!err && texture && sprite && sprite.node && sprite.node.isValid) {
          try {
            var sf = new cc.SpriteFrame(texture);
            sprite.spriteFrame = sf;
          } catch (e) {
            console.warn("🏟️ [ArenaMatchWaiting] 头像加载失败:", fullUrl);
          }
        } else if (err) {
          console.warn("🏟️ [ArenaMatchWaiting] 头像加载错误:", err); // 加载失败，使用默认头像

          cc.resources.load('UI/headimage/avatar_1', cc.SpriteFrame, function (err2, spriteFrame) {
            if (!err2 && spriteFrame && sprite && sprite.node && sprite.node.isValid) {
              sprite.spriteFrame = spriteFrame;
            }
          });
        }
      });
      return;
    } // 本地资源路径


    cc.resources.load('UI/headimage/' + avatarUrl, cc.SpriteFrame, function (err, spriteFrame) {
      if (!err && spriteFrame && sprite && sprite.node && sprite.node.isValid) {
        sprite.spriteFrame = spriteFrame;
      }
    });
  },
  // ============================================================
  // 提示消息
  // ============================================================
  _showJoinMessage: function _showJoinMessage(message) {
    // 创建浮动提示
    var tipNode = new cc.Node("JoinTip");
    tipNode.setPosition(0, 100);
    var label = tipNode.addComponent(cc.Label);
    label.string = message;
    label.fontSize = 24;
    label.lineHeight = 32;
    label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    tipNode.color = cc.color(100, 255, 100);
    var outline = tipNode.addComponent(cc.LabelOutline);
    outline.color = cc.color(0, 0, 0);
    outline.width = 2;
    tipNode.parent = this.node; // 淡出动画

    tipNode.runAction(cc.sequence(cc.moveBy(1.5, cc.v2(0, 50)), cc.fadeOut(0.5), cc.removeSelf()));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2Rkei90b3VybmFtZW50L0FyZW5hTWF0Y2hXYWl0aW5nU2NlbmUuanMiXSwibmFtZXMiOlsiY2MiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJvbkxvYWQiLCJfcGVyaW9kTm8iLCJfcm9vbUlkIiwiX3Jvb21OYW1lIiwiX2NvdW50ZG93biIsIl90b3RhbFBsYXllcnMiLCJfZW50ZXJlZFBsYXllcnMiLCJfcGxheWVycyIsIl9zdGFydFRpbWUiLCJfY3JlYXRlVUkiLCJfcmVnaXN0ZXJFdmVudHMiLCJfaW5pdEZyb21HbG9iYWxEYXRhIiwiX3JlZ2lzdGVyUm9vbUpvaW5lZEhhbmRsZXIiLCJjb25zb2xlIiwibG9nIiwiY2FudmFzIiwibm9kZSIsImdldENvbXBvbmVudCIsIkNhbnZhcyIsImZpbmQiLCJzY3JlZW5IZWlnaHQiLCJkZXNpZ25SZXNvbHV0aW9uIiwiaGVpZ2h0Iiwic2NyZWVuV2lkdGgiLCJ3aWR0aCIsIl9jcmVhdGVCYWNrZ3JvdW5kIiwiX2NyZWF0ZVRvcEJhciIsIl9jcmVhdGVQbGF5ZXJMaXN0Q29udGFpbmVyIiwiYmdOb2RlIiwiTm9kZSIsInNldENvbnRlbnRTaXplIiwic2l6ZSIsInNldFBvc2l0aW9uIiwiekluZGV4Iiwic3ByaXRlIiwiYWRkQ29tcG9uZW50IiwiU3ByaXRlIiwidHlwZSIsIlR5cGUiLCJTSU1QTEUiLCJzaXplTW9kZSIsIlNpemVNb2RlIiwiQ1VTVE9NIiwicmVzb3VyY2VzIiwibG9hZCIsIlNwcml0ZUZyYW1lIiwiZXJyIiwic3ByaXRlRnJhbWUiLCJ3YXJuIiwiZ3JhcGhpY3MiLCJHcmFwaGljcyIsImZpbGxDb2xvciIsImNvbG9yIiwicmVjdCIsImZpbGwiLCJpc1ZhbGlkIiwicGFyZW50IiwiX2JnTm9kZSIsInRvcEJhciIsImJnIiwicm91bmRSZWN0IiwicGVyaW9kTm9kZSIsInBlcmlvZExhYmVsIiwiTGFiZWwiLCJzdHJpbmciLCJmb250U2l6ZSIsImxpbmVIZWlnaHQiLCJwZXJpb2RPdXRsaW5lIiwiTGFiZWxPdXRsaW5lIiwiX3BlcmlvZE5vTGFiZWwiLCJyb29tTm9kZSIsInJvb21MYWJlbCIsInJvb21PdXRsaW5lIiwiX3Jvb21OYW1lTGFiZWwiLCJjb3VudGRvd25Ob2RlIiwiY291bnRkb3duTGFiZWwiLCJjb3VudGRvd25PdXRsaW5lIiwiX2NvdW50ZG93bkxhYmVsIiwicGxheWVyQ291bnROb2RlIiwicGxheWVyQ291bnRMYWJlbCIsIl9wbGF5ZXJDb3VudExhYmVsIiwibXNnTm9kZSIsIm1zZ0xhYmVsIiwiX21lc3NhZ2VMYWJlbCIsIl90b3BCYXIiLCJjb250YWluZXJOb2RlIiwiYmdHcmFwaGljcyIsImNvbnRlbnROb2RlIiwiYW5jaG9yWCIsImFuY2hvclkiLCJfcGxheWVyTGlzdENvbnRlbnQiLCJfcGxheWVyTGlzdENvbnRhaW5lciIsIm15Z2xvYmFsIiwid2luZG93IiwiYXJlbmFXYWl0aW5nU3RhdHVzQ2FjaGUiLCJjYWNoZWREYXRhIiwicGxheWVycyIsImxlbmd0aCIsImV4cGVjdGVkUGVyaW9kTm8iLCJhcmVuYVdhaXRpbmdEYXRhIiwicGVyaW9kX25vIiwicm9vbV9pZCIsInJvb21fbmFtZSIsImNvdW50ZG93biIsInRvdGFsX3BsYXllcnMiLCJlbnRlcmVkX3BsYXllcnMiLCJzdGFydF90aW1lIiwiRGF0ZSIsIm5vdyIsIl91cGRhdGVVSSIsImRhdGEiLCJfcmVxdWVzdFdhaXRpbmdTdGF0dXMiLCJzb2NrZXQiLCJzZW5kQXJlbmFFbnRlciIsInNlbGYiLCJvblJvb21Kb2luZWQiLCJyb29tRGF0YSIsIkpTT04iLCJzdHJpbmdpZnkiLCJfaXNFbnRlcmluZ0dhbWVTY2VuZSIsInJvb21DYXRlZ29yeSIsInJvb21fY2F0ZWdvcnkiLCJfc3RvcExvYWRpbmdBbmltYXRpb24iLCJjb252ZXJ0ZWRSb29tRGF0YSIsInJvb21pZCIsInJvb21fY29kZSIsInNlYXRpbmRleCIsInBsYXllciIsInNlYXQiLCJwbGF5ZXJkYXRhIiwibWFwIiwicCIsImlkeCIsImFjY291bnRpZCIsImlkIiwibmlja19uYW1lIiwibmFtZSIsImF2YXRhclVybCIsImF2YXRhciIsImdvbGRfY291bnQiLCJnb2xkY291bnQiLCJ1bmRlZmluZWQiLCJpc3JlYWR5IiwicmVhZHkiLCJhcmVuYV9nb2xkIiwibWF0Y2hfY29pbiIsImhvdXNlbWFuYWdlaWQiLCJjcmVhdG9yX2lkIiwiYXJlbmFNYXRjaERhdGEiLCJwZXJpb2RObyIsInJvb21JZCIsInJvb21OYW1lIiwidG90YWxQbGF5ZXJzIiwidG90YWxUYWJsZXMiLCJfdG90YWxUYWJsZXMiLCJtYXRjaFJvdW5kcyIsIm1hdGNoX3JvdW5kcyIsImN1cnJlbnRSb3VuZCIsImN1cnJlbnRfcm91bmQiLCJfYXZhdGFyQ2FjaGUiLCJPYmplY3QiLCJrZXlzIiwiZGlyZWN0b3IiLCJsb2FkU2NlbmUiLCJlcnJvciIsInNldFRpbWVvdXQiLCJvbkRlc3Ryb3kiLCJfdW5yZWdpc3RlckV2ZW50cyIsImV2dCIsImV2ZW50bGlzdGVyIiwiX3dhaXRpbmdTdGF0dXNIYW5kbGVyIiwiX29uV2FpdGluZ1N0YXR1cyIsIm9uIiwiX3dhaXRpbmdUaWNrSGFuZGxlciIsIl9vbldhaXRpbmdUaWNrIiwiX3BsYXllckpvaW5lZEhhbmRsZXIiLCJfb25QbGF5ZXJKb2luZWQiLCJfYXNzaWduU3RhcnRIYW5kbGVyIiwiX29uQXNzaWduU3RhcnQiLCJvZmYiLCJzZXREYXRhIiwiX3VwZGF0ZUNvdW50ZG93blVJIiwiX3VwZGF0ZVBsYXllckNvdW50VUkiLCJuZXdQbGF5ZXIiLCJwbGF5ZXJfbmFtZSIsIl9zaG93Sm9pbk1lc3NhZ2UiLCJfdXBkYXRlUGxheWVyTGlzdFVJIiwidG90YWxfdGFibGVzIiwiX3Nob3dBc3NpZ25pbmdMb2FkaW5nVUkiLCJfcHJlbG9hZEFsbFBsYXllckF2YXRhcnMiLCJtZXNzYWdlIiwibG9hZGluZ092ZXJsYXkiLCJsb2FkaW5nQ29udGFpbmVyIiwibG9hZGluZ0ljb24iLCJpY29uR3JhcGhpY3MiLCJzdHJva2VDb2xvciIsImxpbmVXaWR0aCIsImFyYyIsIk1hdGgiLCJQSSIsInN0cm9rZSIsIl9sb2FkaW5nSWNvbk5vZGUiLCJsb2FkaW5nTGFiZWwiLCJsYWJlbCIsImhvcml6b250YWxBbGlnbiIsIkhvcml6b250YWxBbGlnbiIsIkNFTlRFUiIsIm91dGxpbmUiLCJfYXNzaWduaW5nTG9hZGluZ0xhYmVsIiwiX2Fzc2lnbmluZ0xvYWRpbmdPdmVybGF5IiwiX3N0YXJ0TG9hZGluZ0FuaW1hdGlvbiIsIl9sb2FkaW5nQW5pbVNjaGVkdWxlZCIsInNjaGVkdWxlIiwiYW5nbGUiLCJ1bnNjaGVkdWxlIiwiZGVzdHJveSIsImF2YXRhclVybHMiLCJpIiwiaW5kZXhPZiIsInB1c2giLCJsb2FkZWRDb3VudCIsInRvdGFsQ291bnQiLCJvbkxvYWRlZCIsImoiLCJfcHJlbG9hZFNpbmdsZUF2YXRhciIsImNhbGxiYWNrIiwiYXNzZXRNYW5hZ2VyIiwibG9hZFJlbW90ZSIsImV4dCIsInRleHR1cmUiLCJlIiwicmVtb3ZlQWxsQ2hpbGRyZW4iLCJzb3J0ZWRQbGF5ZXJzIiwic2xpY2UiLCJzb3J0IiwiYSIsImIiLCJhRW50ZXJlZCIsImVudGVyZWRfYXQiLCJiRW50ZXJlZCIsImpvaW4iLCJpdGVtV2lkdGgiLCJpdGVtSGVpZ2h0Iiwic3BhY2luZ1giLCJzcGFjaW5nWSIsImNvbHMiLCJtYXJnaW5YIiwibWFyZ2luWSIsInN0YXR1c1RleHQiLCJpdGVtTm9kZSIsIl9jcmVhdGVQbGF5ZXJJdGVtIiwiY29sIiwicm93IiwiZmxvb3IiLCJ4IiwieSIsImluZGV4IiwicmFua05vZGUiLCJyYW5rTGFiZWwiLCJyYW5rIiwicmFua091dGxpbmUiLCJtYXNrTm9kZSIsIm1hc2siLCJNYXNrIiwiRUxMSVBTRSIsInNlZ2VtZW50cyIsImF2YXRhckJnIiwiYXZhdGFyQmdHcmFwaGljcyIsImNpcmNsZSIsImF2YXRhck5vZGUiLCJhdmF0YXJTcHJpdGUiLCJfbG9hZFBsYXllckF2YXRhciIsIm5hbWVOb2RlIiwibmFtZUxhYmVsIiwiY29pbk5vZGUiLCJjb2luTGFiZWwiLCJtYXRjaENvaW4iLCJ0b0ZpeGVkIiwidG9TdHJpbmciLCJzdGF0dXNOb2RlIiwic3RhdHVzTGFiZWwiLCJzZiIsImNkblVybCIsImZ1bGxVcmwiLCJlcnIyIiwidGlwTm9kZSIsInJ1bkFjdGlvbiIsInNlcXVlbmNlIiwibW92ZUJ5IiwidjIiLCJmYWRlT3V0IiwicmVtb3ZlU2VsZiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUFBLEVBQUUsQ0FBQ0MsS0FBSCxDQUFTO0VBQ0wsV0FBU0QsRUFBRSxDQUFDRSxTQURQO0VBR0xDLFVBQVUsRUFBRSxDQUNSO0VBRFEsQ0FIUDtFQU9MO0VBRUFDLE1BVEssb0JBU0s7SUFDTjtJQUNBLEtBQUtDLFNBQUwsR0FBaUIsRUFBakI7SUFDQSxLQUFLQyxPQUFMLEdBQWUsQ0FBZjtJQUNBLEtBQUtDLFNBQUwsR0FBaUIsRUFBakI7SUFDQSxLQUFLQyxVQUFMLEdBQWtCLEVBQWxCO0lBQ0EsS0FBS0MsYUFBTCxHQUFxQixDQUFyQjtJQUNBLEtBQUtDLGVBQUwsR0FBdUIsQ0FBdkI7SUFDQSxLQUFLQyxRQUFMLEdBQWdCLEVBQWhCO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQixDQUFsQixDQVRNLENBV047O0lBQ0EsS0FBS0MsU0FBTCxHQVpNLENBY047OztJQUNBLEtBQUtDLGVBQUwsR0FmTSxDQWlCTjs7O0lBQ0EsS0FBS0MsbUJBQUwsR0FsQk0sQ0FvQk47OztJQUNBLEtBQUtDLDBCQUFMOztJQUVBQyxPQUFPLENBQUNDLEdBQVIsQ0FBWSxrQ0FBWjtFQUNILENBakNJOztFQW1DTDtBQUNKO0FBQ0E7RUFDSUwsU0FBUyxFQUFFLHFCQUFXO0lBQ2xCLElBQUlNLE1BQU0sR0FBRyxLQUFLQyxJQUFMLENBQVVDLFlBQVYsQ0FBdUJyQixFQUFFLENBQUNzQixNQUExQixLQUFxQ3RCLEVBQUUsQ0FBQ3VCLElBQUgsQ0FB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QVMsRUFBVCxDQUFmLENBRGMsRUFFZHJTLEVBQUUsQ0FBQ3NTLE9BQUgsQ0FBVyxHQUFYLENBRmMsRUFHZHRTLEVBQUUsQ0FBQ3VTLFVBQUgsRUFIYyxDQUFsQjtFQUtIO0FBdGpDSSxDQUFUIiwic291cmNlUm9vdCI6Ii8iLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFyZW5hTWF0Y2hXYWl0aW5nU2NlbmUgLSDnq57mioDlnLrmr5TotZvnrYnlvoXnlYzpnaJcbiAqIFxuICog5Yqf6IO977yaXG4gKiAxLiDmmL7npLrmiYDmnInmiqXlkI3njqnlrrbliJfooajvvIjlpLTlg48r5pi156ew77yJXG4gKiAyLiDlrp7ml7bmm7TmlrDnjqnlrrbliqDlhaXkv6Hmga9cbiAqIDMuIOaYvuekuuWAkuiuoeaXtlxuICogNC4g562J5b6F6Zi25q6157uT5p2f5ZCO6Ieq5Yqo6L+b5YWl5ri45oiPXG4gKiBcbiAqIPCflKfjgJDph43opoHjgJHmraTohJrmnKzlrozlhajliqjmgIHliJvlu7ogVUnvvIzkuI3kvp3otZblnLrmma/mlofku7bkuK3nmoTnu4Tku7blvJXnlKhcbiAqL1xuXG5jYy5DbGFzcyh7XG4gICAgZXh0ZW5kczogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICAvLyDml6DlsZ7mgKflrprkuYnvvIzmiYDmnIkgVUkg5Yqo5oCB5Yib5bu6XG4gICAgfSxcblxuICAgIC8vIExJRkUtQ1lDTEUgQ0FMTEJBQ0tTOlxuXG4gICAgb25Mb2FkICgpIHtcbiAgICAgICAgLy8g5Yid5aeL5YyW5pWw5o2uXG4gICAgICAgIHRoaXMuX3BlcmlvZE5vID0gXCJcIlxuICAgICAgICB0aGlzLl9yb29tSWQgPSAwXG4gICAgICAgIHRoaXMuX3Jvb21OYW1lID0gXCJcIlxuICAgICAgICB0aGlzLl9jb3VudGRvd24gPSA2MFxuICAgICAgICB0aGlzLl90b3RhbFBsYXllcnMgPSAwXG4gICAgICAgIHRoaXMuX2VudGVyZWRQbGF5ZXJzID0gMFxuICAgICAgICB0aGlzLl9wbGF5ZXJzID0gW11cbiAgICAgICAgdGhpcy5fc3RhcnRUaW1lID0gMFxuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65pW05LiqIFVJXG4gICAgICAgIHRoaXMuX2NyZWF0ZVVJKClcbiAgICAgICAgXG4gICAgICAgIC8vIOazqOWGjOS6i+S7tuebkeWQrFxuICAgICAgICB0aGlzLl9yZWdpc3RlckV2ZW50cygpXG4gICAgICAgIFxuICAgICAgICAvLyDku47lhajlsYDlj5jph4/ojrflj5bliJ3lp4vmlbDmja5cbiAgICAgICAgdGhpcy5faW5pdEZyb21HbG9iYWxEYXRhKClcbiAgICAgICAgXG4gICAgICAgIC8vIOebkeWQrCByb29tX2pvaW5lZCDmtojmga/ku6Xov5vlhaXmuLjmiI/lnLrmma9cbiAgICAgICAgdGhpcy5fcmVnaXN0ZXJSb29tSm9pbmVkSGFuZGxlcigpXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hTWF0Y2hXYWl0aW5nXSDnrYnlvoXnlYzpnaLliqDovb3lrozmiJBcIilcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog5Yib5bu65a6M5pW0IFVJXG4gICAgICovXG4gICAgX2NyZWF0ZVVJOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNhbnZhcyA9IHRoaXMubm9kZS5nZXRDb21wb25lbnQoY2MuQ2FudmFzKSB8fCBjYy5maW5kKCdDYW52YXMnKS5nZXRDb21wb25lbnQoY2MuQ2FudmFzKVxuICAgICAgICB2YXIgc2NyZWVuSGVpZ2h0ID0gY2FudmFzID8gY2FudmFzLmRlc2lnblJlc29sdXRpb24uaGVpZ2h0IDogNzIwXG4gICAgICAgIHZhciBzY3JlZW5XaWR0aCA9IGNhbnZhcyA/IGNhbnZhcy5kZXNpZ25SZXNvbHV0aW9uLndpZHRoIDogMTI4MFxuICAgICAgICBcbiAgICAgICAgLy8gMS4g5Yib5bu66IOM5pmv77yI5L2/55SoIGpvaW5fYmsucG5n77yJXG4gICAgICAgIHRoaXMuX2NyZWF0ZUJhY2tncm91bmQoc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodClcbiAgICAgICAgXG4gICAgICAgIC8vIDIuIOWIm+W7uumhtumDqOS/oeaBr+agj1xuICAgICAgICB0aGlzLl9jcmVhdGVUb3BCYXIoc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodClcbiAgICAgICAgXG4gICAgICAgIC8vIDMuIOWIm+W7uueOqeWutuWIl+ihqOWuueWZqFxuICAgICAgICB0aGlzLl9jcmVhdGVQbGF5ZXJMaXN0Q29udGFpbmVyKHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWIm+W7uuiDjOaZr++8iOS9v+eUqCBqb2luX2JrLnBuZ++8iVxuICAgICAqL1xuICAgIF9jcmVhdGVCYWNrZ3JvdW5kOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIC8vIOWIm+W7uuiDjOaZr+iKgueCuVxuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCYWNrZ3JvdW5kXCIpXG4gICAgICAgIGJnTm9kZS5zZXRDb250ZW50U2l6ZShjYy5zaXplKHdpZHRoLCBoZWlnaHQpKVxuICAgICAgICBiZ05vZGUuc2V0UG9zaXRpb24oMCwgMClcbiAgICAgICAgYmdOb2RlLnpJbmRleCA9IC0xMDBcbiAgICAgICAgXG4gICAgICAgIHZhciBzcHJpdGUgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLlNwcml0ZSlcbiAgICAgICAgc3ByaXRlLnR5cGUgPSBjYy5TcHJpdGUuVHlwZS5TSU1QTEVcbiAgICAgICAgc3ByaXRlLnNpemVNb2RlID0gY2MuU3ByaXRlLlNpemVNb2RlLkNVU1RPTVxuICAgICAgICBcbiAgICAgICAgLy8g5Yqg6L296IOM5pmv5Zu+54mHXG4gICAgICAgIGNjLnJlc291cmNlcy5sb2FkKCdqb2luX2JrJywgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVyciwgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn4+f77iPIFtBcmVuYU1hdGNoV2FpdGluZ10g5peg5rOV5Yqg6L296IOM5pmv5Zu+IGpvaW5fYmsucG5n77yM5L2/55So57qv6Imy6IOM5pmvXCIpXG4gICAgICAgICAgICAgICAgLy8g5L2/55So5rex6Imy6IOM5pmv5L2c5Li65ZCO5aSHXG4gICAgICAgICAgICAgICAgdmFyIGdyYXBoaWNzID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgICAgICAgICBncmFwaGljcy5maWxsQ29sb3IgPSBjYy5jb2xvcigyNSwgMzAsIDUwLCAyNTUpXG4gICAgICAgICAgICAgICAgZ3JhcGhpY3MucmVjdCgtd2lkdGgvMiwgLWhlaWdodC8yLCB3aWR0aCwgaGVpZ2h0KVxuICAgICAgICAgICAgICAgIGdyYXBoaWNzLmZpbGwoKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNwcml0ZSAmJiBzcHJpdGUubm9kZSAmJiBzcHJpdGUubm9kZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgc3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSB0aGlzLm5vZGVcbiAgICAgICAgdGhpcy5fYmdOb2RlID0gYmdOb2RlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWIm+W7uumhtumDqOS/oeaBr+agj1xuICAgICAqL1xuICAgIF9jcmVhdGVUb3BCYXI6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgLy8g6aG26YOo5L+h5oGv5qCP5a655ZmoXG4gICAgICAgIHZhciB0b3BCYXIgPSBuZXcgY2MuTm9kZShcIlRvcEJhclwiKVxuICAgICAgICB0b3BCYXIuc2V0Q29udGVudFNpemUoY2Muc2l6ZSh3aWR0aCAtIDEwMCwgMTAwKSlcbiAgICAgICAgdG9wQmFyLnNldFBvc2l0aW9uKDAsIGhlaWdodC8yIC0gODApXG4gICAgICAgIFxuICAgICAgICAvLyDljYrpgI/mmI7og4zmma9cbiAgICAgICAgdmFyIGJnID0gbmV3IGNjLk5vZGUoXCJCZ1wiKVxuICAgICAgICBiZy5zZXRDb250ZW50U2l6ZShjYy5zaXplKHdpZHRoIC0gMTAwLCAxMDApKVxuICAgICAgICB2YXIgZ3JhcGhpY3MgPSBiZy5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGdyYXBoaWNzLmZpbGxDb2xvciA9IGNjLmNvbG9yKDAsIDAsIDAsIDE1MClcbiAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC0od2lkdGgtMTAwKS8yLCAtNTAsIHdpZHRoLTEwMCwgMTAwLCAxMClcbiAgICAgICAgZ3JhcGhpY3MuZmlsbCgpXG4gICAgICAgIGJnLnBhcmVudCA9IHRvcEJhclxuICAgICAgICBcbiAgICAgICAgLy8g5pyf5Y+3XG4gICAgICAgIHZhciBwZXJpb2ROb2RlID0gbmV3IGNjLk5vZGUoXCJQZXJpb2ROb1wiKVxuICAgICAgICBwZXJpb2ROb2RlLnNldFBvc2l0aW9uKC13aWR0aC8yICsgMTUwLCAyNSlcbiAgICAgICAgdmFyIHBlcmlvZExhYmVsID0gcGVyaW9kTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHBlcmlvZExhYmVsLnN0cmluZyA9IFwi5pyf5Y+3OiAtLVwiXG4gICAgICAgIHBlcmlvZExhYmVsLmZvbnRTaXplID0gMjJcbiAgICAgICAgcGVyaW9kTGFiZWwubGluZUhlaWdodCA9IDI4XG4gICAgICAgIHBlcmlvZE5vZGUuY29sb3IgPSBjYy5jb2xvcigyNTUsIDIxNSwgMClcbiAgICAgICAgdmFyIHBlcmlvZE91dGxpbmUgPSBwZXJpb2ROb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpXG4gICAgICAgIHBlcmlvZE91dGxpbmUuY29sb3IgPSBjYy5jb2xvcigwLCAwLCAwKVxuICAgICAgICBwZXJpb2RPdXRsaW5lLndpZHRoID0gMlxuICAgICAgICBwZXJpb2ROb2RlLnBhcmVudCA9IHRvcEJhclxuICAgICAgICB0aGlzLl9wZXJpb2ROb0xhYmVsID0gcGVyaW9kTGFiZWxcbiAgICAgICAgXG4gICAgICAgIC8vIOaIv+mXtOWQjeensFxuICAgICAgICB2YXIgcm9vbU5vZGUgPSBuZXcgY2MuTm9kZShcIlJvb21OYW1lXCIpXG4gICAgICAgIHJvb21Ob2RlLnNldFBvc2l0aW9uKDAsIDI1KVxuICAgICAgICB2YXIgcm9vbUxhYmVsID0gcm9vbU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICByb29tTGFiZWwuc3RyaW5nID0gXCLnq57mioDlnLpcIlxuICAgICAgICByb29tTGFiZWwuZm9udFNpemUgPSAyOFxuICAgICAgICByb29tTGFiZWwubGluZUhlaWdodCA9IDM2XG4gICAgICAgIHJvb21Ob2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyMTUsIDApICAvLyDph5HoibLvvIzkuI7mnJ/lj7fkuIDoh7RcbiAgICAgICAgdmFyIHJvb21PdXRsaW5lID0gcm9vbU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSlcbiAgICAgICAgcm9vbU91dGxpbmUuY29sb3IgPSBjYy5jb2xvcigwLCAwLCAwKVxuICAgICAgICByb29tT3V0bGluZS53aWR0aCA9IDJcbiAgICAgICAgcm9vbU5vZGUucGFyZW50ID0gdG9wQmFyXG4gICAgICAgIHRoaXMuX3Jvb21OYW1lTGFiZWwgPSByb29tTGFiZWxcbiAgICAgICAgXG4gICAgICAgIC8vIOWAkuiuoeaXtlxuICAgICAgICB2YXIgY291bnRkb3duTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ291bnRkb3duXCIpXG4gICAgICAgIGNvdW50ZG93bk5vZGUuc2V0UG9zaXRpb24od2lkdGgvMiAtIDE1MCwgMjUpXG4gICAgICAgIHZhciBjb3VudGRvd25MYWJlbCA9IGNvdW50ZG93bk5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBjb3VudGRvd25MYWJlbC5zdHJpbmcgPSBcIjYw56eSXCJcbiAgICAgICAgY291bnRkb3duTGFiZWwuZm9udFNpemUgPSAyNFxuICAgICAgICBjb3VudGRvd25MYWJlbC5saW5lSGVpZ2h0ID0gMzJcbiAgICAgICAgY291bnRkb3duTm9kZS5jb2xvciA9IGNjLmNvbG9yKDEwMCwgMjU1LCAxMDApXG4gICAgICAgIHZhciBjb3VudGRvd25PdXRsaW5lID0gY291bnRkb3duTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKVxuICAgICAgICBjb3VudGRvd25PdXRsaW5lLmNvbG9yID0gY2MuY29sb3IoMCwgMCwgMClcbiAgICAgICAgY291bnRkb3duT3V0bGluZS53aWR0aCA9IDJcbiAgICAgICAgY291bnRkb3duTm9kZS5wYXJlbnQgPSB0b3BCYXJcbiAgICAgICAgdGhpcy5fY291bnRkb3duTGFiZWwgPSBjb3VudGRvd25MYWJlbFxuICAgICAgICBcbiAgICAgICAgLy8g546p5a625pWw6YePXG4gICAgICAgIHZhciBwbGF5ZXJDb3VudE5vZGUgPSBuZXcgY2MuTm9kZShcIlBsYXllckNvdW50XCIpXG4gICAgICAgIHBsYXllckNvdW50Tm9kZS5zZXRQb3NpdGlvbigwLCAtMTUpXG4gICAgICAgIHZhciBwbGF5ZXJDb3VudExhYmVsID0gcGxheWVyQ291bnROb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgcGxheWVyQ291bnRMYWJlbC5zdHJpbmcgPSBcIuW3sui/m+WFpTogMCAvIDBcIlxuICAgICAgICBwbGF5ZXJDb3VudExhYmVsLmZvbnRTaXplID0gMjBcbiAgICAgICAgcGxheWVyQ291bnRMYWJlbC5saW5lSGVpZ2h0ID0gMjhcbiAgICAgICAgcGxheWVyQ291bnROb2RlLmNvbG9yID0gY2MuY29sb3IoMjAwLCAyMDAsIDIyMClcbiAgICAgICAgcGxheWVyQ291bnROb2RlLnBhcmVudCA9IHRvcEJhclxuICAgICAgICB0aGlzLl9wbGF5ZXJDb3VudExhYmVsID0gcGxheWVyQ291bnRMYWJlbFxuICAgICAgICBcbiAgICAgICAgLy8g5o+Q56S65raI5oGvXG4gICAgICAgIHZhciBtc2dOb2RlID0gbmV3IGNjLk5vZGUoXCJNZXNzYWdlXCIpXG4gICAgICAgIG1zZ05vZGUuc2V0UG9zaXRpb24oMCwgLTQ1KVxuICAgICAgICB2YXIgbXNnTGFiZWwgPSBtc2dOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgbXNnTGFiZWwuc3RyaW5nID0gXCLnrYnlvoXlhbbku5bnjqnlrrbov5vlhaUuLi5cIlxuICAgICAgICBtc2dMYWJlbC5mb250U2l6ZSA9IDE2XG4gICAgICAgIG1zZ0xhYmVsLmxpbmVIZWlnaHQgPSAyNFxuICAgICAgICBtc2dOb2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyMDAsIDEwMClcbiAgICAgICAgbXNnTm9kZS5wYXJlbnQgPSB0b3BCYXJcbiAgICAgICAgdGhpcy5fbWVzc2FnZUxhYmVsID0gbXNnTGFiZWxcbiAgICAgICAgXG4gICAgICAgIHRvcEJhci5wYXJlbnQgPSB0aGlzLm5vZGVcbiAgICAgICAgdGhpcy5fdG9wQmFyID0gdG9wQmFyXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWIm+W7uueOqeWutuWIl+ihqOWuueWZqO+8iOS4gOaOkjEw5Liq77yM5LuO5bem5LiK6KeS5byA5aeL5o6S5YiX77yJXG4gICAgICovXG4gICAgX2NyZWF0ZVBsYXllckxpc3RDb250YWluZXI6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgLy8g546p5a625Yy65Z+f5a655ZmoXG4gICAgICAgIHZhciBjb250YWluZXJOb2RlID0gbmV3IGNjLk5vZGUoXCJQbGF5ZXJBcmVhXCIpXG4gICAgICAgIGNvbnRhaW5lck5vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZSgxMTYwLCA0NDApKVxuICAgICAgICBjb250YWluZXJOb2RlLnNldFBvc2l0aW9uKDAsIC0yNSlcbiAgICAgICAgXG4gICAgICAgIC8vIOWNiumAj+aYjuiDjOaZr1xuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCZ1wiKVxuICAgICAgICBiZ05vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZSgxMTYwLCA0NDApKVxuICAgICAgICB2YXIgYmdHcmFwaGljcyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGJnR3JhcGhpY3MuZmlsbENvbG9yID0gY2MuY29sb3IoMCwgMCwgMCwgODApXG4gICAgICAgIGJnR3JhcGhpY3Mucm91bmRSZWN0KC01ODAsIC0yMjAsIDExNjAsIDQ0MCwgMTApXG4gICAgICAgIGJnR3JhcGhpY3MuZmlsbCgpXG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSBjb250YWluZXJOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDlhoXlrrnlrrnlmajvvIjplJrngrnorr7lnKjlt6bkuIrop5LvvIzku47lt6bkuIrop5LlvIDlp4vmjpLliJfvvIlcbiAgICAgICAgdmFyIGNvbnRlbnROb2RlID0gbmV3IGNjLk5vZGUoXCJDb250ZW50XCIpXG4gICAgICAgIGNvbnRlbnROb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoMTE1MCwgNDIwKSlcbiAgICAgICAgY29udGVudE5vZGUuYW5jaG9yWCA9IDAgIC8vIOW3pumUmueCuVxuICAgICAgICBjb250ZW50Tm9kZS5hbmNob3JZID0gMSAgLy8g5LiK6ZSa54K5XG4gICAgICAgIGNvbnRlbnROb2RlLnNldFBvc2l0aW9uKC01NzUsIDIxMCkgIC8vIOWvueW6lOW3puS4iuinkuS9jee9rlxuICAgICAgICBjb250ZW50Tm9kZS5wYXJlbnQgPSBjb250YWluZXJOb2RlXG4gICAgICAgIFxuICAgICAgICBjb250YWluZXJOb2RlLnBhcmVudCA9IHRoaXMubm9kZVxuICAgICAgICB0aGlzLl9wbGF5ZXJMaXN0Q29udGVudCA9IGNvbnRlbnROb2RlXG4gICAgICAgIHRoaXMuX3BsYXllckxpc3RDb250YWluZXIgPSBjb250YWluZXJOb2RlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOS7juWFqOWxgOWPmOmHj+WIneWni+WMluaVsOaNrlxuICAgICAqL1xuICAgIF9pbml0RnJvbUdsb2JhbERhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgXG4gICAgICAgIC8vIOS8mOWFiOajgOafpee8k+WtmOeahOeKtuaAgeaVsOaNru+8iOacjeWKoeerr+aOqOmAgeeahOacgOaWsOaVsOaNru+8iVxuICAgICAgICBpZiAobXlnbG9iYWwgJiYgbXlnbG9iYWwuYXJlbmFXYWl0aW5nU3RhdHVzQ2FjaGUpIHtcbiAgICAgICAgICAgIHZhciBjYWNoZWREYXRhID0gbXlnbG9iYWwuYXJlbmFXYWl0aW5nU3RhdHVzQ2FjaGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFNYXRjaFdhaXRpbmddIOWPkeeOsOe8k+WtmOeahOetieW+heeKtuaAgeaVsOaNru+8jOeOqeWutuaVsOmHjzpcIiwgY2FjaGVkRGF0YS5wbGF5ZXJzID8gY2FjaGVkRGF0YS5wbGF5ZXJzLmxlbmd0aCA6IDApXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOajgOafpeacn+WPt+aYr+WQpuWMuemFjVxuICAgICAgICAgICAgdmFyIGV4cGVjdGVkUGVyaW9kTm8gPSBteWdsb2JhbC5hcmVuYVdhaXRpbmdEYXRhID8gbXlnbG9iYWwuYXJlbmFXYWl0aW5nRGF0YS5wZXJpb2Rfbm8gOiBcIlwiXG4gICAgICAgICAgICBpZiAoIWV4cGVjdGVkUGVyaW9kTm8gfHwgY2FjaGVkRGF0YS5wZXJpb2Rfbm8gPT09IGV4cGVjdGVkUGVyaW9kTm8pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wZXJpb2RObyA9IGNhY2hlZERhdGEucGVyaW9kX25vIHx8IFwiXCJcbiAgICAgICAgICAgICAgICB0aGlzLl9yb29tSWQgPSBjYWNoZWREYXRhLnJvb21faWQgfHwgMFxuICAgICAgICAgICAgICAgIHRoaXMuX3Jvb21OYW1lID0gY2FjaGVkRGF0YS5yb29tX25hbWUgfHwgXCJcIlxuICAgICAgICAgICAgICAgIHRoaXMuX2NvdW50ZG93biA9IGNhY2hlZERhdGEuY291bnRkb3duIHx8IDYwXG4gICAgICAgICAgICAgICAgdGhpcy5fdG90YWxQbGF5ZXJzID0gY2FjaGVkRGF0YS50b3RhbF9wbGF5ZXJzIHx8IDBcbiAgICAgICAgICAgICAgICB0aGlzLl9lbnRlcmVkUGxheWVycyA9IGNhY2hlZERhdGEuZW50ZXJlZF9wbGF5ZXJzIHx8IDFcbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5ZXJzID0gY2FjaGVkRGF0YS5wbGF5ZXJzIHx8IFtdXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRUaW1lID0gY2FjaGVkRGF0YS5zdGFydF90aW1lIHx8IERhdGUubm93KClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVVSSgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYU1hdGNoV2FpdGluZ10g5LuO57yT5a2Y5pWw5o2u5Yid5aeL5YyW5a6M5oiQ77yM5pi+56S6546p5a62OlwiLCB0aGlzLl9wbGF5ZXJzLmxlbmd0aClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDmuIXpmaTnvJPlrZhcbiAgICAgICAgICAgICAgICBteWdsb2JhbC5hcmVuYVdhaXRpbmdTdGF0dXNDYWNoZSA9IG51bGxcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5L2/55SoIGFyZW5hV2FpdGluZ0RhdGHvvIjngrnlh7vov5vlhaXml7borr7nva7nmoTmlbDmja7vvIlcbiAgICAgICAgaWYgKG15Z2xvYmFsICYmIG15Z2xvYmFsLmFyZW5hV2FpdGluZ0RhdGEpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gbXlnbG9iYWwuYXJlbmFXYWl0aW5nRGF0YVxuICAgICAgICAgICAgdGhpcy5fcGVyaW9kTm8gPSBkYXRhLnBlcmlvZF9ubyB8fCBcIlwiXG4gICAgICAgICAgICB0aGlzLl9yb29tSWQgPSBkYXRhLnJvb21faWQgfHwgMFxuICAgICAgICAgICAgdGhpcy5fcm9vbU5hbWUgPSBkYXRhLnJvb21fbmFtZSB8fCBcIlwiXG4gICAgICAgICAgICB0aGlzLl9jb3VudGRvd24gPSBkYXRhLmNvdW50ZG93biB8fCA2MFxuICAgICAgICAgICAgdGhpcy5fdG90YWxQbGF5ZXJzID0gZGF0YS50b3RhbF9wbGF5ZXJzIHx8IDBcbiAgICAgICAgICAgIHRoaXMuX2VudGVyZWRQbGF5ZXJzID0gZGF0YS5lbnRlcmVkX3BsYXllcnMgfHwgMVxuICAgICAgICAgICAgdGhpcy5fcGxheWVycyA9IGRhdGEucGxheWVycyB8fCBbXVxuICAgICAgICAgICAgdGhpcy5fc3RhcnRUaW1lID0gZGF0YS5zdGFydF90aW1lIHx8IERhdGUubm93KClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVUkoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hTWF0Y2hXYWl0aW5nXSDku47lhajlsYDlj5jph4/liJ3lp4vljJbmlbDmja7lrozmiJBcIilcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5aaC5p6c546p5a625YiX6KGo5Li656m677yM6K+35rGC5pyN5Yqh56uv5o6o6YCB54q25oCBXG4gICAgICAgICAgICBpZiAodGhpcy5fcGxheWVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hTWF0Y2hXYWl0aW5nXSDnjqnlrrbliJfooajkuLrnqbrvvIzor7fmsYLmnI3liqHnq6/mjqjpgIHnirbmgIFcIilcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXF1ZXN0V2FpdGluZ1N0YXR1cygpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog6K+35rGC5pyN5Yqh56uv5o6o6YCB562J5b6F54q25oCBXG4gICAgICovXG4gICAgX3JlcXVlc3RXYWl0aW5nU3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIHZhciBzb2NrZXQgPSBteWdsb2JhbCAmJiBteWdsb2JhbC5zb2NrZXRcbiAgICAgICAgXG4gICAgICAgIGlmIChzb2NrZXQgJiYgc29ja2V0LnNlbmRBcmVuYUVudGVyKSB7XG4gICAgICAgICAgICAvLyDph43mlrDlj5HpgIEgYXJlbmFfZW50ZXIg6K+35rGC77yM5pyN5Yqh56uv5Lya5o6o6YCB5b2T5YmN54q25oCBXG4gICAgICAgICAgICBzb2NrZXQuc2VuZEFyZW5hRW50ZXIoe1xuICAgICAgICAgICAgICAgIHBlcmlvZF9ubzogdGhpcy5fcGVyaW9kTm8sXG4gICAgICAgICAgICAgICAgcm9vbV9pZDogdGhpcy5fcm9vbUlkXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYU1hdGNoV2FpdGluZ10g5bey6K+35rGC5pyN5Yqh56uv5o6o6YCB562J5b6F54q25oCBXCIpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog55uR5ZCsIHJvb21fam9pbmVkIOa2iOaBr+S7pei/m+WFpea4uOaIj+WcuuaZr1xuICAgICAqIPCflKfjgJDlhbPplK7kv67mlLnjgJFcbiAgICAgKiAxLiDlgZzmraLliqDovb3liqjnlLtcbiAgICAgKiAyLiDkv53lrZjpooTliqDovb3mlbDmja7liLAgbXlnbG9iYWwucm9vbURhdGEg5ZKMIG15Z2xvYmFsLmFyZW5hTWF0Y2hEYXRhXG4gICAgICogMy4g55u05o6l6L+b5YWl5ri45oiP5Zy65pmv77yM5peg6ZyA6YeN5paw6K+35rGC5pWw5o2uXG4gICAgICog8J+Up+OAkOS/ruWkjeOAkea3u+WKoOmYsumHjeWkjeWKoOi9veacuuWItu+8jOmBv+WFjeWkmuS4quebkeWQrOWZqOWQjOaXtuWkhOeQhuWvvOiHtOWcuuaZr+eKtuaAgea3t+S5sVxuICAgICAqL1xuICAgIF9yZWdpc3RlclJvb21Kb2luZWRIYW5kbGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICB2YXIgc29ja2V0ID0gbXlnbG9iYWwgJiYgbXlnbG9iYWwuc29ja2V0XG4gICAgICAgIFxuICAgICAgICBpZiAoc29ja2V0ICYmIHNvY2tldC5vblJvb21Kb2luZWQpIHtcbiAgICAgICAgICAgIHNvY2tldC5vblJvb21Kb2luZWQoZnVuY3Rpb24ocm9vbURhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hTWF0Y2hXYWl0aW5nXSDmlLbliLAgcm9vbV9qb2luZWTvvIzlh4blpIfov5vlhaXmuLjmiI/lnLrmma86XCIsIEpTT04uc3RyaW5naWZ5KHJvb21EYXRhKSlcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR6Ziy5q2i6YeN5aSN5Yqg6L295ri45oiP5Zy65pmvXG4gICAgICAgICAgICAgICAgLy8g5qOA5p+l5YWo5bGA5qCH5b+X77yM5aaC5p6c5bey57uP5Zyo5Yqg6L295Lit5YiZ6Lez6L+HXG4gICAgICAgICAgICAgICAgaWYgKG15Z2xvYmFsICYmIG15Z2xvYmFsLl9pc0VudGVyaW5nR2FtZVNjZW5lKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFNYXRjaFdhaXRpbmddIOW3suWcqOWKoOi9vea4uOaIj+WcuuaZr+S4re+8jOi3s+i/h+mHjeWkjeivt+axglwiKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5qOA5p+l5piv5ZCm5piv56ue5oqA5Zy65oi/6Ze0XG4gICAgICAgICAgICAgICAgdmFyIHJvb21DYXRlZ29yeSA9IHJvb21EYXRhLnJvb21fY2F0ZWdvcnkgfHwgMVxuICAgICAgICAgICAgICAgIGlmIChyb29tQ2F0ZWdvcnkgIT09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYU1hdGNoV2FpdGluZ10g5LiN5piv56ue5oqA5Zy65oi/6Ze077yM5b+955WlXCIpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR6K6+572u5YWo5bGA5qCH5b+X77yM6Ziy5q2i5YW25LuW55uR5ZCs5Zmo6YeN5aSN5Yqg6L29XG4gICAgICAgICAgICAgICAgaWYgKG15Z2xvYmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLl9pc0VudGVyaW5nR2FtZVNjZW5lID0gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5YGc5q2i5Yqg6L295Yqo55S7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3RvcExvYWRpbmdBbmltYXRpb24oKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOi9rOaNouaVsOaNruagvOW8j1xuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJzID0gcm9vbURhdGEucGxheWVycyB8fCBbXVxuICAgICAgICAgICAgICAgIHZhciBjb252ZXJ0ZWRSb29tRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcm9vbWlkOiByb29tRGF0YS5yb29tX2NvZGUgfHwgXCJBUkVOQVwiLFxuICAgICAgICAgICAgICAgICAgICByb29tX2NvZGU6IHJvb21EYXRhLnJvb21fY29kZSB8fCBcIkFSRU5BXCIsXG4gICAgICAgICAgICAgICAgICAgIHNlYXRpbmRleDogcm9vbURhdGEucGxheWVyID8gcm9vbURhdGEucGxheWVyLnNlYXQgKyAxIDogMSxcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyZGF0YTogcGxheWVycy5tYXAoZnVuY3Rpb24ocCwgaWR4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY291bnRpZDogcC5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuaWNrX25hbWU6IHAubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdmF0YXJVcmw6IHAuYXZhdGFyIHx8IFwiYXZhdGFyXzFcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2xkX2NvdW50OiBwLmdvbGRfY291bnQgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2xkY291bnQ6IHAuZ29sZF9jb3VudCB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlYXRpbmRleDogKHAuc2VhdCAhPT0gdW5kZWZpbmVkID8gcC5zZWF0IDogaWR4KSArIDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNyZWFkeTogcC5yZWFkeSB8fCBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmVuYV9nb2xkOiBwLmFyZW5hX2dvbGQgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaF9jb2luOiBwLm1hdGNoX2NvaW4gfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJpb2Rfbm86IHAucGVyaW9kX25vIHx8IFwiXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgIGhvdXNlbWFuYWdlaWQ6IHJvb21EYXRhLmNyZWF0b3JfaWQgfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRvcl9pZDogcm9vbURhdGEuY3JlYXRvcl9pZCB8fCBcIlwiLFxuICAgICAgICAgICAgICAgICAgICByb29tX2NhdGVnb3J5OiAyLFxuICAgICAgICAgICAgICAgICAgICBwZXJpb2Rfbm86IHNlbGYuX3BlcmlvZE5vXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHkv53lrZjpooTliqDovb3mlbDmja7liLAgbXlnbG9iYWxcbiAgICAgICAgICAgICAgICBpZiAobXlnbG9iYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5L+d5a2Y5oi/6Ze05pWw5o2uXG4gICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnJvb21EYXRhID0gY29udmVydGVkUm9vbURhdGFcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHkv53lrZjnq57mioDlnLrmr5TotZvmlbDmja7vvIjnlKjkuo7muLjmiI/lnLrmma/vvIlcbiAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwuYXJlbmFNYXRjaERhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwZXJpb2RObzogc2VsZi5fcGVyaW9kTm8sXG4gICAgICAgICAgICAgICAgICAgICAgICByb29tSWQ6IHNlbGYuX3Jvb21JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvb21OYW1lOiBzZWxmLl9yb29tTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsUGxheWVyczogc2VsZi5fdG90YWxQbGF5ZXJzLFxuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxUYWJsZXM6IHNlbGYuX3RvdGFsVGFibGVzIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGF5ZXJzOiBzZWxmLl9wbGF5ZXJzLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hSb3VuZHM6IHJvb21EYXRhLm1hdGNoX3JvdW5kcyB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFJvdW5kOiByb29tRGF0YS5jdXJyZW50X3JvdW5kIHx8IDFcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYU1hdGNoV2FpdGluZ10g6aKE5Yqg6L295pWw5o2u5bey5L+d5a2YOlwiKVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiAgLSBteWdsb2JhbC5yb29tRGF0YS5wbGF5ZXJkYXRhOlwiLCBjb252ZXJ0ZWRSb29tRGF0YS5wbGF5ZXJkYXRhLmxlbmd0aCwgXCLkurpcIilcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCIgIC0gbXlnbG9iYWwuYXJlbmFNYXRjaERhdGEucGVyaW9kTm86XCIsIHNlbGYuX3BlcmlvZE5vKVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIiAgLSDlpLTlg4/nvJPlrZjmlbDph486XCIsIG15Z2xvYmFsLl9hdmF0YXJDYWNoZSA/IE9iamVjdC5rZXlzKG15Z2xvYmFsLl9hdmF0YXJDYWNoZSkubGVuZ3RoIDogMClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOS8mOWMluOAkeebtOaOpei/m+WFpea4uOaIj+WcuuaZr++8jOaXoOmcgOmHjeaWsOivt+axguaVsOaNrlxuICAgICAgICAgICAgICAgIC8vIOa4uOaIj+WcuuaZr+S8muS7jiBteWdsb2JhbC5yb29tRGF0YSDor7vlj5bpooTliqDovb3mlbDmja5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hTWF0Y2hXYWl0aW5nXSDov5vlhaXmuLjmiI/lnLrmma8uLi5cIilcbiAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJnYW1lU2NlbmVcIiwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn4+f77iPIFtBcmVuYU1hdGNoV2FpdGluZ10g5Yqg6L295ri45oiP5Zy65pmv5aSx6LSlOlwiLCBlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobXlnbG9iYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5faXNFbnRlcmluZ0dhbWVTY2VuZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5bu26L+f6YeN572u5qCH5b+X77yM56Gu5L+d5Zy65pmv5a6M5YWo5Yqg6L29XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobXlnbG9iYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5faXNFbnRlcmluZ0dhbWVTY2VuZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIDIwMDApXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25EZXN0cm95ICgpIHtcbiAgICAgICAgLy8g5YGc5q2i5Yqg6L295Yqo55S7XG4gICAgICAgIHRoaXMuX3N0b3BMb2FkaW5nQW5pbWF0aW9uKClcbiAgICAgICAgXG4gICAgICAgIC8vIOWPlua2iOS6i+S7tuebkeWQrFxuICAgICAgICB0aGlzLl91bnJlZ2lzdGVyRXZlbnRzKClcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFNYXRjaFdhaXRpbmddIOWcuuaZr+mUgOavge+8jOW3suWBnOatouWKoOi9veWKqOeUu1wiKVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDkuovku7bnm5HlkKxcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIF9yZWdpc3RlckV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgdmFyIGV2dCA9IG15Z2xvYmFsICYmIG15Z2xvYmFsLmV2ZW50bGlzdGVyXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hTWF0Y2hXYWl0aW5nXSDms6jlhozkuovku7bnm5HlkKwsIGV2dDpcIiwgZXZ0ID8gXCLlrZjlnKhcIiA6IFwi5LiN5a2Y5ZyoXCIpXG4gICAgICAgIFxuICAgICAgICBpZiAoIWV2dCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+Pn++4jyBbQXJlbmFNYXRjaFdhaXRpbmddIGV2ZW50bGlzdGVyIOS4jeWtmOWcqO+8jOaXoOazleazqOWGjOS6i+S7tlwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOetieW+heeKtuaAgeaOqOmAgVxuICAgICAgICB0aGlzLl93YWl0aW5nU3RhdHVzSGFuZGxlciA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFNYXRjaFdhaXRpbmddIOKchSDmlLbliLDnrYnlvoXnirbmgIE6XCIsIEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICAgICAgICAgc2VsZi5fb25XYWl0aW5nU3RhdHVzKGRhdGEpXG4gICAgICAgIH1cbiAgICAgICAgZXZ0Lm9uKFwiYXJlbmFfd2FpdGluZ19zdGF0dXNfbm90aWZ5XCIsIHRoaXMuX3dhaXRpbmdTdGF0dXNIYW5kbGVyKVxuICAgICAgICBcbiAgICAgICAgLy8g5YCS6K6h5pe25pu05pawXG4gICAgICAgIHRoaXMuX3dhaXRpbmdUaWNrSGFuZGxlciA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFNYXRjaFdhaXRpbmddIOWAkuiuoeaXtuabtOaWsDpcIiwgZGF0YS5jb3VudGRvd24pXG4gICAgICAgICAgICBzZWxmLl9vbldhaXRpbmdUaWNrKGRhdGEpXG4gICAgICAgIH1cbiAgICAgICAgZXZ0Lm9uKFwiYXJlbmFfd2FpdGluZ190aWNrX25vdGlmeVwiLCB0aGlzLl93YWl0aW5nVGlja0hhbmRsZXIpXG4gICAgICAgIFxuICAgICAgICAvLyDnjqnlrrbliqDlhaXlub/mkq1cbiAgICAgICAgdGhpcy5fcGxheWVySm9pbmVkSGFuZGxlciA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFNYXRjaFdhaXRpbmddIOeOqeWutuWKoOWFpTpcIiwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgICAgICAgICBzZWxmLl9vblBsYXllckpvaW5lZChkYXRhKVxuICAgICAgICB9XG4gICAgICAgIGV2dC5vbihcImFyZW5hX3BsYXllcl9qb2luZWRfbm90aWZ5XCIsIHRoaXMuX3BsYXllckpvaW5lZEhhbmRsZXIpXG4gICAgICAgIFxuICAgICAgICAvLyDliIbphY3pmLbmrrXlvIDlp4tcbiAgICAgICAgdGhpcy5fYXNzaWduU3RhcnRIYW5kbGVyID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYU1hdGNoV2FpdGluZ10g5YiG6YWN6Zi25q615byA5aeLOlwiLCBKU09OLnN0cmluZ2lmeShkYXRhKSlcbiAgICAgICAgICAgIHNlbGYuX29uQXNzaWduU3RhcnQoZGF0YSlcbiAgICAgICAgfVxuICAgICAgICBldnQub24oXCJhcmVuYV9hc3NpZ25fc3RhcnRfbm90aWZ5XCIsIHRoaXMuX2Fzc2lnblN0YXJ0SGFuZGxlcilcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFNYXRjaFdhaXRpbmddIOKchSDkuovku7bnm5HlkKzms6jlhozlrozmiJBcIilcbiAgICB9LFxuXG4gICAgX3VucmVnaXN0ZXJFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgdmFyIGV2dCA9IG15Z2xvYmFsICYmIG15Z2xvYmFsLmV2ZW50bGlzdGVyXG4gICAgICAgIFxuICAgICAgICBpZiAoIWV2dCkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5fd2FpdGluZ1N0YXR1c0hhbmRsZXIpIHtcbiAgICAgICAgICAgIGV2dC5vZmYoXCJhcmVuYV93YWl0aW5nX3N0YXR1c19ub3RpZnlcIiwgdGhpcy5fd2FpdGluZ1N0YXR1c0hhbmRsZXIpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3dhaXRpbmdUaWNrSGFuZGxlcikge1xuICAgICAgICAgICAgZXZ0Lm9mZihcImFyZW5hX3dhaXRpbmdfdGlja19ub3RpZnlcIiwgdGhpcy5fd2FpdGluZ1RpY2tIYW5kbGVyKVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9wbGF5ZXJKb2luZWRIYW5kbGVyKSB7XG4gICAgICAgICAgICBldnQub2ZmKFwiYXJlbmFfcGxheWVyX2pvaW5lZF9ub3RpZnlcIiwgdGhpcy5fcGxheWVySm9pbmVkSGFuZGxlcilcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fYXNzaWduU3RhcnRIYW5kbGVyKSB7XG4gICAgICAgICAgICBldnQub2ZmKFwiYXJlbmFfYXNzaWduX3N0YXJ0X25vdGlmeVwiLCB0aGlzLl9hc3NpZ25TdGFydEhhbmRsZXIpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFNYXRjaFdhaXRpbmddIOS6i+S7tuebkeWQrOW3suWPlua2iFwiKVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDlhazlhbHmlrnms5VcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIOiuvue9ruWIneWni+aVsOaNrlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0geyBwZXJpb2Rfbm8sIHJvb21faWQsIHJvb21fbmFtZSwgY291bnRkb3duLCB0b3RhbF9wbGF5ZXJzLCBlbnRlcmVkX3BsYXllcnMsIHBsYXllcnMsIG1lc3NhZ2UgfVxuICAgICAqL1xuICAgIHNldERhdGE6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdGhpcy5fcGVyaW9kTm8gPSBkYXRhLnBlcmlvZF9ubyB8fCBcIlwiXG4gICAgICAgIHRoaXMuX3Jvb21JZCA9IGRhdGEucm9vbV9pZCB8fCAwXG4gICAgICAgIHRoaXMuX3Jvb21OYW1lID0gZGF0YS5yb29tX25hbWUgfHwgXCJcIlxuICAgICAgICB0aGlzLl9jb3VudGRvd24gPSBkYXRhLmNvdW50ZG93biB8fCA2MFxuICAgICAgICB0aGlzLl90b3RhbFBsYXllcnMgPSBkYXRhLnRvdGFsX3BsYXllcnMgfHwgMFxuICAgICAgICB0aGlzLl9lbnRlcmVkUGxheWVycyA9IGRhdGEuZW50ZXJlZF9wbGF5ZXJzIHx8IDBcbiAgICAgICAgdGhpcy5fcGxheWVycyA9IGRhdGEucGxheWVycyB8fCBbXVxuICAgICAgICB0aGlzLl9zdGFydFRpbWUgPSBkYXRhLnN0YXJ0X3RpbWUgfHwgRGF0ZS5ub3coKVxuICAgICAgICBcbiAgICAgICAgdGhpcy5fdXBkYXRlVUkoKVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDkuovku7blpITnkIZcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIF9vbldhaXRpbmdTdGF0dXM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgLy8g5qOA5p+l5pyf5Y+35piv5ZCm5Yy56YWNXG4gICAgICAgIGlmICh0aGlzLl9wZXJpb2RObyAmJiBkYXRhLnBlcmlvZF9ubyAhPT0gdGhpcy5fcGVyaW9kTm8pIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9wZXJpb2RObyA9IGRhdGEucGVyaW9kX25vXG4gICAgICAgIHRoaXMuX3Jvb21JZCA9IGRhdGEucm9vbV9pZFxuICAgICAgICB0aGlzLl9yb29tTmFtZSA9IGRhdGEucm9vbV9uYW1lXG4gICAgICAgIHRoaXMuX2NvdW50ZG93biA9IGRhdGEuY291bnRkb3duXG4gICAgICAgIHRoaXMuX3RvdGFsUGxheWVycyA9IGRhdGEudG90YWxfcGxheWVyc1xuICAgICAgICB0aGlzLl9lbnRlcmVkUGxheWVycyA9IGRhdGEuZW50ZXJlZF9wbGF5ZXJzXG4gICAgICAgIHRoaXMuX3BsYXllcnMgPSBkYXRhLnBsYXllcnNcbiAgICAgICAgdGhpcy5fc3RhcnRUaW1lID0gZGF0YS5zdGFydF90aW1lXG4gICAgICAgIFxuICAgICAgICB0aGlzLl91cGRhdGVVSSgpXG4gICAgfSxcblxuICAgIF9vbldhaXRpbmdUaWNrOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIC8vIOajgOafpeacn+WPt+aYr+WQpuWMuemFjVxuICAgICAgICBpZiAodGhpcy5fcGVyaW9kTm8gJiYgZGF0YS5wZXJpb2Rfbm8gIT09IHRoaXMuX3BlcmlvZE5vKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5fY291bnRkb3duID0gZGF0YS5jb3VudGRvd25cbiAgICAgICAgdGhpcy5fZW50ZXJlZFBsYXllcnMgPSBkYXRhLmVudGVyZWRfcGxheWVyc1xuICAgICAgICBcbiAgICAgICAgdGhpcy5fdXBkYXRlQ291bnRkb3duVUkoKVxuICAgICAgICB0aGlzLl91cGRhdGVQbGF5ZXJDb3VudFVJKClcbiAgICB9LFxuXG4gICAgX29uUGxheWVySm9pbmVkOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIC8vIOajgOafpeacn+WPt+aYr+WQpuWMuemFjVxuICAgICAgICBpZiAodGhpcy5fcGVyaW9kTm8gJiYgZGF0YS5wZXJpb2Rfbm8gIT09IHRoaXMuX3BlcmlvZE5vKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw546p5a625YiX6KGoXG4gICAgICAgIHRoaXMuX3BsYXllcnMgPSBkYXRhLnBsYXllcnMgfHwgW11cbiAgICAgICAgdGhpcy5fZW50ZXJlZFBsYXllcnMgPSBkYXRhLmVudGVyZWRfcGxheWVyc1xuICAgICAgICB0aGlzLl90b3RhbFBsYXllcnMgPSBkYXRhLnRvdGFsX3BsYXllcnNcbiAgICAgICAgXG4gICAgICAgIC8vIOaYvuekuuWKoOWFpeaPkOekulxuICAgICAgICB2YXIgbmV3UGxheWVyID0gZGF0YS5wbGF5ZXJcbiAgICAgICAgaWYgKG5ld1BsYXllciAmJiBuZXdQbGF5ZXIucGxheWVyX25hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dKb2luTWVzc2FnZShuZXdQbGF5ZXIucGxheWVyX25hbWUgKyBcIiDov5vlhaXkuobmr5TotZtcIilcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05pawVUlcbiAgICAgICAgdGhpcy5fdXBkYXRlUGxheWVyTGlzdFVJKClcbiAgICAgICAgdGhpcy5fdXBkYXRlUGxheWVyQ291bnRVSSgpXG4gICAgfSxcblxuICAgIF9vbkFzc2lnblN0YXJ0OiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIC8vIOajgOafpeacn+WPt+aYr+WQpuWMuemFjVxuICAgICAgICBpZiAodGhpcy5fcGVyaW9kTm8gJiYgZGF0YS5wZXJpb2Rfbm8gIT09IHRoaXMuX3BlcmlvZE5vKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYU1hdGNoV2FpdGluZ10g5YiG6YWN6Zi25q615byA5aeLOlwiLCBKU09OLnN0cmluZ2lmeShkYXRhKSlcbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2NvdW50ZG93biA9IGRhdGEuY291bnRkb3duXG4gICAgICAgIHRoaXMuX3RvdGFsUGxheWVycyA9IGRhdGEudG90YWxfcGxheWVyc1xuICAgICAgICB0aGlzLl9lbnRlcmVkUGxheWVycyA9IGRhdGEudG90YWxfcGxheWVyc1xuICAgICAgICB0aGlzLl90b3RhbFRhYmxlcyA9IGRhdGEudG90YWxfdGFibGVzIHx8IDBcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67mlLnjgJHmmL7npLpcIuezu+e7n+WIhumFjeS4rVwi5Yqg6L295Yqo55S7XG4gICAgICAgIHRoaXMuX3Nob3dBc3NpZ25pbmdMb2FkaW5nVUkoZGF0YSlcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67mlLnjgJHpooTliqDovb3miYDmnInnjqnlrrblpLTlg4/otYTmupBcbiAgICAgICAgdGhpcy5fcHJlbG9hZEFsbFBsYXllckF2YXRhcnMoKVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05pawVUlcbiAgICAgICAgdGhpcy5fdXBkYXRlVUkoKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeaYvuekulwi57O757uf5YiG6YWN5LitXCLliqDovb3liqjnlLtcbiAgICAgKi9cbiAgICBfc2hvd0Fzc2lnbmluZ0xvYWRpbmdVSTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgXG4gICAgICAgIC8vIOaYvuekuuWIhumFjea2iOaBr1xuICAgICAgICBpZiAodGhpcy5fbWVzc2FnZUxhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLl9tZXNzYWdlTGFiZWwuc3RyaW5nID0gZGF0YS5tZXNzYWdlIHx8IFwi57O757uf5YiG6YWN5LitLi4uXCJcbiAgICAgICAgICAgIHRoaXMuX21lc3NhZ2VMYWJlbC5ub2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyMjAsIDEwMClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65Yqg6L295Yqo55S76KaG55uW5bGCXG4gICAgICAgIHZhciBjYW52YXMgPSB0aGlzLm5vZGUuZ2V0Q29tcG9uZW50KGNjLkNhbnZhcykgfHwgY2MuZmluZCgnQ2FudmFzJykuZ2V0Q29tcG9uZW50KGNjLkNhbnZhcylcbiAgICAgICAgdmFyIHNjcmVlbkhlaWdodCA9IGNhbnZhcyA/IGNhbnZhcy5kZXNpZ25SZXNvbHV0aW9uLmhlaWdodCA6IDcyMFxuICAgICAgICB2YXIgc2NyZWVuV2lkdGggPSBjYW52YXMgPyBjYW52YXMuZGVzaWduUmVzb2x1dGlvbi53aWR0aCA6IDEyODBcbiAgICAgICAgXG4gICAgICAgIC8vIOWIm+W7uuWKoOi9veimhuebluWxglxuICAgICAgICB2YXIgbG9hZGluZ092ZXJsYXkgPSBuZXcgY2MuTm9kZShcIkFzc2lnbmluZ0xvYWRpbmdPdmVybGF5XCIpXG4gICAgICAgIGxvYWRpbmdPdmVybGF5LnNldENvbnRlbnRTaXplKGNjLnNpemUoc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCkpXG4gICAgICAgIGxvYWRpbmdPdmVybGF5LnNldFBvc2l0aW9uKDAsIDApXG4gICAgICAgIGxvYWRpbmdPdmVybGF5LnpJbmRleCA9IDEwMDBcbiAgICAgICAgXG4gICAgICAgIC8vIOWNiumAj+aYjuiDjOaZr1xuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCZ1wiKVxuICAgICAgICBiZ05vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZShzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSlcbiAgICAgICAgdmFyIGJnR3JhcGhpY3MgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBiZ0dyYXBoaWNzLmZpbGxDb2xvciA9IGNjLmNvbG9yKDAsIDAsIDAsIDE1MClcbiAgICAgICAgYmdHcmFwaGljcy5yZWN0KC1zY3JlZW5XaWR0aC8yLCAtc2NyZWVuSGVpZ2h0LzIsIHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpXG4gICAgICAgIGJnR3JhcGhpY3MuZmlsbCgpXG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSBsb2FkaW5nT3ZlcmxheVxuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65Yqg6L295Zu+5qCH5a655Zmo77yI5peL6L2s5Yqo55S777yJXG4gICAgICAgIHZhciBsb2FkaW5nQ29udGFpbmVyID0gbmV3IGNjLk5vZGUoXCJMb2FkaW5nQ29udGFpbmVyXCIpXG4gICAgICAgIGxvYWRpbmdDb250YWluZXIuc2V0UG9zaXRpb24oMCwgNTApXG4gICAgICAgIGxvYWRpbmdDb250YWluZXIucGFyZW50ID0gbG9hZGluZ092ZXJsYXlcbiAgICAgICAgXG4gICAgICAgIC8vIOWKoOi9veWbvuagh++8iOS9v+eUqOeugOWNleeahOWchuW9ouaXi+i9rOWKqOeUu++8iVxuICAgICAgICB2YXIgbG9hZGluZ0ljb24gPSBuZXcgY2MuTm9kZShcIkxvYWRpbmdJY29uXCIpXG4gICAgICAgIGxvYWRpbmdJY29uLnNldENvbnRlbnRTaXplKGNjLnNpemUoNjAsIDYwKSlcbiAgICAgICAgdmFyIGljb25HcmFwaGljcyA9IGxvYWRpbmdJY29uLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgLy8g57uY5Yi25Yqg6L295ZyG546vXG4gICAgICAgIGljb25HcmFwaGljcy5zdHJva2VDb2xvciA9IGNjLmNvbG9yKDI1NSwgMjE1LCAwKVxuICAgICAgICBpY29uR3JhcGhpY3MubGluZVdpZHRoID0gNFxuICAgICAgICBpY29uR3JhcGhpY3MuYXJjKDAsIDAsIDI1LCAwLCBNYXRoLlBJICogMS41LCBmYWxzZSlcbiAgICAgICAgaWNvbkdyYXBoaWNzLnN0cm9rZSgpXG4gICAgICAgIGxvYWRpbmdJY29uLnBhcmVudCA9IGxvYWRpbmdDb250YWluZXJcbiAgICAgICAgXG4gICAgICAgIC8vIOS/neWtmOW8leeUqOS7peS+v+aXi+i9rOWKqOeUu1xuICAgICAgICB0aGlzLl9sb2FkaW5nSWNvbk5vZGUgPSBsb2FkaW5nSWNvblxuICAgICAgICBcbiAgICAgICAgLy8g5Yqg6L295paH5a2XXG4gICAgICAgIHZhciBsb2FkaW5nTGFiZWwgPSBuZXcgY2MuTm9kZShcIkxvYWRpbmdMYWJlbFwiKVxuICAgICAgICBsb2FkaW5nTGFiZWwuc2V0UG9zaXRpb24oMCwgLTMwKVxuICAgICAgICB2YXIgbGFiZWwgPSBsb2FkaW5nTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBsYWJlbC5zdHJpbmcgPSBcIuezu+e7n+WIhumFjeS4rS4uLlwiXG4gICAgICAgIGxhYmVsLmZvbnRTaXplID0gMjhcbiAgICAgICAgbGFiZWwubGluZUhlaWdodCA9IDM2XG4gICAgICAgIGxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgbG9hZGluZ0xhYmVsLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyMjAsIDEwMClcbiAgICAgICAgdmFyIG91dGxpbmUgPSBsb2FkaW5nTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSlcbiAgICAgICAgb3V0bGluZS5jb2xvciA9IGNjLmNvbG9yKDAsIDAsIDApXG4gICAgICAgIG91dGxpbmUud2lkdGggPSAyXG4gICAgICAgIGxvYWRpbmdMYWJlbC5wYXJlbnQgPSBsb2FkaW5nQ29udGFpbmVyXG4gICAgICAgIHRoaXMuX2Fzc2lnbmluZ0xvYWRpbmdMYWJlbCA9IGxhYmVsXG4gICAgICAgIFxuICAgICAgICBsb2FkaW5nT3ZlcmxheS5wYXJlbnQgPSB0aGlzLm5vZGVcbiAgICAgICAgdGhpcy5fYXNzaWduaW5nTG9hZGluZ092ZXJsYXkgPSBsb2FkaW5nT3ZlcmxheVxuICAgICAgICBcbiAgICAgICAgLy8g5ZCv5Yqo5peL6L2s5Yqo55S7XG4gICAgICAgIHRoaXMuX3N0YXJ0TG9hZGluZ0FuaW1hdGlvbigpXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hTWF0Y2hXYWl0aW5nXSDmmL7npLon57O757uf5YiG6YWN5LitJ+WKoOi9veWKqOeUu1wiKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeWQr+WKqOWKoOi9veWKqOeUu1xuICAgICAqL1xuICAgIF9zdGFydExvYWRpbmdBbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgdGhpcy5fbG9hZGluZ0FuaW1TY2hlZHVsZWQgPSB0cnVlXG4gICAgICAgIFxuICAgICAgICAvLyDkvb/nlKggc2NoZWR1bGUg5pu05paw5peL6L2s6KeS5bqmXG4gICAgICAgIHRoaXMuc2NoZWR1bGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoc2VsZi5fbG9hZGluZ0ljb25Ob2RlICYmIHNlbGYuX2xvYWRpbmdJY29uTm9kZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fbG9hZGluZ0ljb25Ob2RlLmFuZ2xlICs9IDVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMC4wMTYpICAvLyDnuqY2MGZwc1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeWBnOatouWKoOi9veWKqOeUu1xuICAgICAqL1xuICAgIF9zdG9wTG9hZGluZ0FuaW1hdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9sb2FkaW5nQW5pbVNjaGVkdWxlZCkge1xuICAgICAgICAgICAgdGhpcy51bnNjaGVkdWxlKHRoaXMuX3N0YXJ0TG9hZGluZ0FuaW1hdGlvbilcbiAgICAgICAgICAgIHRoaXMuX2xvYWRpbmdBbmltU2NoZWR1bGVkID0gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMuX2Fzc2lnbmluZ0xvYWRpbmdPdmVybGF5ICYmIHRoaXMuX2Fzc2lnbmluZ0xvYWRpbmdPdmVybGF5LmlzVmFsaWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2Fzc2lnbmluZ0xvYWRpbmdPdmVybGF5LmRlc3Ryb3koKVxuICAgICAgICAgICAgdGhpcy5fYXNzaWduaW5nTG9hZGluZ092ZXJsYXkgPSBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2xvYWRpbmdJY29uTm9kZSA9IG51bGxcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHpooTliqDovb3miYDmnInnjqnlrrblpLTlg4/otYTmupBcbiAgICAgKi9cbiAgICBfcHJlbG9hZEFsbFBsYXllckF2YXRhcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcy5fcGxheWVycyB8fCB0aGlzLl9wbGF5ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYU1hdGNoV2FpdGluZ10g5rKh5pyJ546p5a625aS05YOP6ZyA6KaB6aKE5Yqg6L29XCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pS26ZuG5omA5pyJ5aS05YOPVVJMXG4gICAgICAgIHZhciBhdmF0YXJVcmxzID0gW11cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9wbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGxheWVyID0gdGhpcy5fcGxheWVyc1tpXVxuICAgICAgICAgICAgdmFyIGF2YXRhclVybCA9IHBsYXllci5hdmF0YXIgfHwgcGxheWVyLmF2YXRhclVybCB8fCBcImF2YXRhcl8xXCJcbiAgICAgICAgICAgIGlmIChhdmF0YXJVcmwgJiYgYXZhdGFyVXJscy5pbmRleE9mKGF2YXRhclVybCkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgYXZhdGFyVXJscy5wdXNoKGF2YXRhclVybClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYU1hdGNoV2FpdGluZ10g6aKE5Yqg6L29546p5a625aS05YOP5pWw6YePOlwiLCBhdmF0YXJVcmxzLmxlbmd0aClcbiAgICAgICAgXG4gICAgICAgIC8vIOWIneWni+WMluWktOWDj+e8k+WtmFxuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKG15Z2xvYmFsICYmICFteWdsb2JhbC5fYXZhdGFyQ2FjaGUpIHtcbiAgICAgICAgICAgIG15Z2xvYmFsLl9hdmF0YXJDYWNoZSA9IHt9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmihOWKoOi9veWktOWDj1xuICAgICAgICB2YXIgbG9hZGVkQ291bnQgPSAwXG4gICAgICAgIHZhciB0b3RhbENvdW50ID0gYXZhdGFyVXJscy5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIHZhciBvbkxvYWRlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbG9hZGVkQ291bnQrK1xuICAgICAgICAgICAgaWYgKGxvYWRlZENvdW50ID49IHRvdGFsQ291bnQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hTWF0Y2hXYWl0aW5nXSDmiYDmnInnjqnlrrblpLTlg4/pooTliqDovb3lrozmiJBcIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBhdmF0YXJVcmxzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB0aGlzLl9wcmVsb2FkU2luZ2xlQXZhdGFyKGF2YXRhclVybHNbal0sIG9uTG9hZGVkKVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR6aKE5Yqg6L295Y2V5Liq5aS05YOPXG4gICAgICovXG4gICAgX3ByZWxvYWRTaW5nbGVBdmF0YXI6IGZ1bmN0aW9uKGF2YXRhclVybCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIFxuICAgICAgICAvLyDlpoLmnpzlt7LnvJPlrZjvvIznm7TmjqXov5Tlm55cbiAgICAgICAgaWYgKG15Z2xvYmFsICYmIG15Z2xvYmFsLl9hdmF0YXJDYWNoZSAmJiBteWdsb2JhbC5fYXZhdGFyQ2FjaGVbYXZhdGFyVXJsXSkge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjaygpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5Yik5pat5piv5ZCm5piv6L+c56iLVVJMXG4gICAgICAgIGlmIChhdmF0YXJVcmwuaW5kZXhPZignaHR0cDovLycpID09PSAwIHx8IGF2YXRhclVybC5pbmRleE9mKCdodHRwczovLycpID09PSAwKSB7XG4gICAgICAgICAgICBjYy5hc3NldE1hbmFnZXIubG9hZFJlbW90ZShhdmF0YXJVcmwsIHsgZXh0OiAnLnBuZycgfSwgZnVuY3Rpb24oZXJyLCB0ZXh0dXJlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFlcnIgJiYgdGV4dHVyZSAmJiBteWdsb2JhbCAmJiBteWdsb2JhbC5fYXZhdGFyQ2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLl9hdmF0YXJDYWNoZVthdmF0YXJVcmxdID0gbmV3IGNjLlNwcml0ZUZyYW1lKHRleHR1cmUpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hTWF0Y2hXYWl0aW5nXSDov5znqIvlpLTlg4/pooTliqDovb3miJDlip86XCIsIGF2YXRhclVybClcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+Pn++4jyBbQXJlbmFNYXRjaFdhaXRpbmddIOe8k+WtmOWktOWDj+Wksei0pTpcIiwgZSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDmnKzlnLDotYTmupBcbiAgICAgICAgICAgIGNjLnJlc291cmNlcy5sb2FkKCdVSS9oZWFkaW1hZ2UvJyArIGF2YXRhclVybCwgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVyciwgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWVyciAmJiBzcHJpdGVGcmFtZSAmJiBteWdsb2JhbCAmJiBteWdsb2JhbC5fYXZhdGFyQ2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwuX2F2YXRhckNhY2hlW2F2YXRhclVybF0gPSBzcHJpdGVGcmFtZVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hTWF0Y2hXYWl0aW5nXSDmnKzlnLDlpLTlg4/pooTliqDovb3miJDlip86XCIsIGF2YXRhclVybClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjaygpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIFVJ5pu05pawXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBfdXBkYXRlVUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDmm7TmlrDmnJ/lj7dcbiAgICAgICAgaWYgKHRoaXMuX3BlcmlvZE5vTGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMuX3BlcmlvZE5vTGFiZWwuc3RyaW5nID0gXCLmnJ/lj7c6IFwiICsgdGhpcy5fcGVyaW9kTm9cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw5oi/6Ze05ZCN56ewXG4gICAgICAgIGlmICh0aGlzLl9yb29tTmFtZUxhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLl9yb29tTmFtZUxhYmVsLnN0cmluZyA9IHRoaXMuX3Jvb21OYW1lIHx8IFwi56ue5oqA5Zy6XCJcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw5YCS6K6h5pe2XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNvdW50ZG93blVJKClcbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOeOqeWutuaVsOmHj1xuICAgICAgICB0aGlzLl91cGRhdGVQbGF5ZXJDb3VudFVJKClcbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOeOqeWutuWIl+ihqFxuICAgICAgICB0aGlzLl91cGRhdGVQbGF5ZXJMaXN0VUkoKVxuICAgIH0sXG5cbiAgICBfdXBkYXRlQ291bnRkb3duVUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fY291bnRkb3duTGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvdW50ZG93bkxhYmVsLnN0cmluZyA9IHRoaXMuX2NvdW50ZG93biArIFwi56eSXCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5pyA5ZCOMTDnp5Llj5jnuqJcbiAgICAgICAgICAgIGlmICh0aGlzLl9jb3VudGRvd24gPD0gMTAgJiYgdGhpcy5fY291bnRkb3duID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvdW50ZG93bkxhYmVsLm5vZGUuY29sb3IgPSBjYy5jb2xvcigyNTUsIDEwMCwgMTAwKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jb3VudGRvd25MYWJlbC5ub2RlLmNvbG9yID0gY2MuY29sb3IoMTAwLCAyNTUsIDEwMClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfdXBkYXRlUGxheWVyQ291bnRVSTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9wbGF5ZXJDb3VudExhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLl9wbGF5ZXJDb3VudExhYmVsLnN0cmluZyA9IFwi5bey6L+b5YWlOiBcIiArIHRoaXMuX2VudGVyZWRQbGF5ZXJzICsgXCIgLyBcIiArIHRoaXMuX3RvdGFsUGxheWVyc1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOeOqeWutuWIl+ihqOa4suafk++8iOS4gOaOkjEw5Liq77yM5LuO5bem5LiK6KeS5byA5aeL5o6S5YiX77yJXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBfdXBkYXRlUGxheWVyTGlzdFVJOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9wbGF5ZXJMaXN0Q29udGVudCkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICAvLyDmuIXnqbrnjrDmnInliJfooahcbiAgICAgICAgdGhpcy5fcGxheWVyTGlzdENvbnRlbnQucmVtb3ZlQWxsQ2hpbGRyZW4oKVxuICAgICAgICBcbiAgICAgICAgdmFyIHBsYXllcnMgPSB0aGlzLl9wbGF5ZXJzIHx8IFtdXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFNYXRjaFdhaXRpbmddIOabtOaWsOeOqeWutuWIl+ihqO+8jOeOqeWutuaVsOmHjzpcIiwgcGxheWVycy5sZW5ndGgpXG4gICAgICAgIFxuICAgICAgICBpZiAocGxheWVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFNYXRjaFdhaXRpbmddIOayoeacieeOqeWutuaVsOaNru+8jOi3s+i/h+a4suafk1wiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOaOkuW6j++8muW3sui/m+WFpeeahOeOqeWutu+8iGVudGVyZWRfYXQgPiAw77yJ5o6S5Zyo5YmN6Z2i77yM562J5b6F5Lit55qE5o6S5Zyo5ZCO6Z2iXG4gICAgICAgIHZhciBzb3J0ZWRQbGF5ZXJzID0gcGxheWVycy5zbGljZSgpLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgdmFyIGFFbnRlcmVkID0gYS5lbnRlcmVkX2F0ICYmIGEuZW50ZXJlZF9hdCA+IDBcbiAgICAgICAgICAgIHZhciBiRW50ZXJlZCA9IGIuZW50ZXJlZF9hdCAmJiBiLmVudGVyZWRfYXQgPiAwXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOW3sui/m+WFpeeahOaOkuWcqOWJjemdolxuICAgICAgICAgICAgaWYgKGFFbnRlcmVkICYmICFiRW50ZXJlZCkgcmV0dXJuIC0xXG4gICAgICAgICAgICBpZiAoIWFFbnRlcmVkICYmIGJFbnRlcmVkKSByZXR1cm4gMVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlkIznirbmgIHmjInov5vlhaXml7bpl7TmjpLluo9cbiAgICAgICAgICAgIHJldHVybiAoYS5lbnRlcmVkX2F0IHx8IDApIC0gKGIuZW50ZXJlZF9hdCB8fCAwKVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYU1hdGNoV2FpdGluZ10g5o6S5bqP5ZCO546p5a62OlwiLCBzb3J0ZWRQbGF5ZXJzLm1hcChmdW5jdGlvbihwKSB7IFxuICAgICAgICAgICAgcmV0dXJuIHAucGxheWVyX25hbWUgKyAocC5lbnRlcmVkX2F0ID4gMCA/ICco5bey6L+b5YWlKScgOiAnKOetieW+heS4rSknKSBcbiAgICAgICAgfSkuam9pbignLCAnKSlcbiAgICAgICAgXG4gICAgICAgIC8vIOW4g+WxgOWPguaVsO+8muS4gOaOkjEw5Liq77yM5LuO5bem5LiK6KeS5byA5aeL5o6S5YiXXG4gICAgICAgIC8vIPCflKfjgJDkv67mlLnjgJHmm7TmlrDluIPlsYDlj4LmlbDku6XpgILlupTmlrDnmoTljaHniYfpq5jluqZcbiAgICAgICAgdmFyIGl0ZW1XaWR0aCA9IDEwMCAgIC8vIOWNoeeJh+WuveW6plxuICAgICAgICB2YXIgaXRlbUhlaWdodCA9IDE0MCAgLy8g5Y2h54mH6auY5bqm77yI5aKe5Yqg5LqGMjBweOS7peWuuee6s+mHkeW4ge+8iVxuICAgICAgICB2YXIgc3BhY2luZ1ggPSAxMCAgICAgLy8g5rC05bmz6Ze06LedXG4gICAgICAgIHZhciBzcGFjaW5nWSA9IDEwICAgICAvLyDlnoLnm7Tpl7Tot51cbiAgICAgICAgdmFyIGNvbHMgPSAxMCAgICAgICAgIC8vIOS4gOaOkjEw5LiqXG4gICAgICAgIHZhciBtYXJnaW5YID0gMTAgICAgICAvLyDlt6bovrnot51cbiAgICAgICAgdmFyIG1hcmdpblkgPSAxMCAgICAgIC8vIOS4iui+uei3nVxuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg546p5a626aG5XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc29ydGVkUGxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHBsYXllciA9IHNvcnRlZFBsYXllcnNbaV1cbiAgICAgICAgICAgIHZhciBzdGF0dXNUZXh0ID0gKHBsYXllci5lbnRlcmVkX2F0ICYmIHBsYXllci5lbnRlcmVkX2F0ID4gMCkgPyAnKOW3sui/m+WFpSknIDogJyjnrYnlvoXkuK0pJ1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYU1hdGNoV2FpdGluZ10g5Yib5bu6546p5a625Y2h54mHOlwiLCBpLCBwbGF5ZXIucGxheWVyX25hbWUsIHN0YXR1c1RleHQpXG4gICAgICAgICAgICB2YXIgaXRlbU5vZGUgPSB0aGlzLl9jcmVhdGVQbGF5ZXJJdGVtKHBsYXllciwgaSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6K6h566X5L2N572u77yI5LuO5bem5LiK6KeS5byA5aeL77yM6ZSa54K55Li65bem5LiK6KeS77yJXG4gICAgICAgICAgICAvLyBjb250ZW50Tm9kZSDnmoTplJrngrnmmK8gKDAsIDEp77yM5Y2z5bem5LiK6KeSXG4gICAgICAgICAgICAvLyAoMCwgMCkg5piv5bem5LiK6KeS77yMeCDlkJHlj7Plop7liqDvvIx5IOWQkeS4i+WHj+WwkVxuICAgICAgICAgICAgdmFyIGNvbCA9IGkgJSBjb2xzXG4gICAgICAgICAgICB2YXIgcm93ID0gTWF0aC5mbG9vcihpIC8gY29scylcbiAgICAgICAgICAgIHZhciB4ID0gbWFyZ2luWCArIGNvbCAqIChpdGVtV2lkdGggKyBzcGFjaW5nWCkgKyBpdGVtV2lkdGggLyAyICAvLyDljaHniYfkuK3lv4PkvY3nva5cbiAgICAgICAgICAgIHZhciB5ID0gLW1hcmdpblkgLSByb3cgKiAoaXRlbUhlaWdodCArIHNwYWNpbmdZKSAtIGl0ZW1IZWlnaHQgLyAyICAvLyBZ5ZCR5LiL5Li66LSfXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGl0ZW1Ob2RlLnNldFBvc2l0aW9uKHgsIHkpXG4gICAgICAgICAgICBpdGVtTm9kZS5wYXJlbnQgPSB0aGlzLl9wbGF5ZXJMaXN0Q29udGVudFxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWIm+W7uueOqeWutuWNoeeJh++8iOe0p+WHkeWNoeeJh++8jOWchuW9ouWktOWDj++8jOS4juWOn+Wkp+WOheeVjOmdouS4gOiHtO+8iVxuICAgICAqIPCflKfjgJDkv67lpI3jgJHmt7vliqDph5HluIHlkozmjpLlkI3mmL7npLpcbiAgICAgKi9cbiAgICBfY3JlYXRlUGxheWVySXRlbTogZnVuY3Rpb24ocGxheWVyLCBpbmRleCkge1xuICAgICAgICB2YXIgaXRlbU5vZGUgPSBuZXcgY2MuTm9kZShcIlBsYXllckNhcmRfXCIgKyBpbmRleClcbiAgICAgICAgaXRlbU5vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZSgxMDAsIDE0MCkpICAvLyDwn5Sn44CQ5L+u5pS544CR5aKe5Yqg6auY5bqm5Lul5a6557qz6YeR5biBXG4gICAgICAgIFxuICAgICAgICAvLyDljaHniYfog4zmma/vvIjlnIbop5Lnn6nlvaLvvIlcbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmdcIilcbiAgICAgICAgYmdOb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoOTUsIDEzNSkpICAvLyDwn5Sn44CQ5L+u5pS544CR5aKe5Yqg6auY5bqmXG4gICAgICAgIHZhciBiZ0dyYXBoaWNzID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmnLrlmajkurrlkoznnJ/kurrkvb/nlKjnm7jlkIzog4zmma/oibLvvIzkuI3lho3ljLrliIZcbiAgICAgICAgYmdHcmFwaGljcy5maWxsQ29sb3IgPSBjYy5jb2xvcig0MCwgNjAsIDgwLCAyMzApICAvLyDnu5/kuIDok53oibLosINcbiAgICAgICAgYmdHcmFwaGljcy5yb3VuZFJlY3QoLTQ3LjUsIC02Ny41LCA5NSwgMTM1LCA4KSAgLy8g8J+Up+OAkOS/ruaUueOAkeiwg+aVtOWchuinkuefqeW9olxuICAgICAgICBiZ0dyYXBoaWNzLmZpbGwoKVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0g5o6S5ZCN5qCH562+77yI5bem5LiK6KeS77yJPT09PT09PT09PVxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5pi+56S65o6S5ZCNXG4gICAgICAgIHZhciByYW5rTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUmFua1wiKVxuICAgICAgICByYW5rTm9kZS5zZXRQb3NpdGlvbigtMzAsIDU1KSAgLy8g5bem5LiK6KeSXG4gICAgICAgIHZhciByYW5rTGFiZWwgPSByYW5rTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHJhbmtMYWJlbC5zdHJpbmcgPSBcIiNcIiArIChwbGF5ZXIucmFuayB8fCAoaW5kZXggKyAxKSlcbiAgICAgICAgcmFua0xhYmVsLmZvbnRTaXplID0gMTJcbiAgICAgICAgcmFua0xhYmVsLmxpbmVIZWlnaHQgPSAxNFxuICAgICAgICByYW5rTm9kZS5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjE1LCAwKSAgLy8g6YeR6ImyXG4gICAgICAgIHZhciByYW5rT3V0bGluZSA9IHJhbmtOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpXG4gICAgICAgIHJhbmtPdXRsaW5lLmNvbG9yID0gY2MuY29sb3IoMCwgMCwgMClcbiAgICAgICAgcmFua091dGxpbmUud2lkdGggPSAxXG4gICAgICAgIHJhbmtOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOWchuW9ouWktOWDj++8iOS9v+eUqCBNYXNrIOWunueOsOWchuW9ouijgeWJqu+8iT09PT09PT09PT1cbiAgICAgICAgLy8g5Yib5bu66YGu572p6IqC54K5XG4gICAgICAgIHZhciBtYXNrTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQXZhdGFyTWFza1wiKVxuICAgICAgICBtYXNrTm9kZS5zZXRQb3NpdGlvbigwLCAzMCkgIC8vIPCflKfjgJDkv67mlLnjgJHkuIrnp7tcbiAgICAgICAgbWFza05vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZSg1MCwgNTApKSAgLy8g8J+Up+OAkOS/ruaUueOAkee8qeWwj+WktOWDj1xuICAgICAgICBcbiAgICAgICAgLy8g5re75YqgIE1hc2sg57uE5Lu2XG4gICAgICAgIHZhciBtYXNrID0gbWFza05vZGUuYWRkQ29tcG9uZW50KGNjLk1hc2spXG4gICAgICAgIG1hc2sudHlwZSA9IGNjLk1hc2suVHlwZS5FTExJUFNFICAvLyDmpK3lnIblvaLpga7nvanvvIjlnIblvaLvvIlcbiAgICAgICAgbWFzay5zZWdlbWVudHMgPSA2NCAgLy8g5ZyG5ruR5bqmXG4gICAgICAgIFxuICAgICAgICAvLyDlpLTlg4/og4zmma/lnIblnIhcbiAgICAgICAgdmFyIGF2YXRhckJnID0gbmV3IGNjLk5vZGUoXCJBdmF0YXJCZ1wiKVxuICAgICAgICB2YXIgYXZhdGFyQmdHcmFwaGljcyA9IGF2YXRhckJnLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgYXZhdGFyQmdHcmFwaGljcy5maWxsQ29sb3IgPSBjYy5jb2xvcig4MCwgODAsIDEwMCwgMjU1KVxuICAgICAgICBhdmF0YXJCZ0dyYXBoaWNzLmNpcmNsZSgwLCAwLCAyOClcbiAgICAgICAgYXZhdGFyQmdHcmFwaGljcy5maWxsKClcbiAgICAgICAgYXZhdGFyQmcucGFyZW50ID0gbWFza05vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOWktOWDj+iKgueCue+8iOWcqOmBrue9qeWGhemDqO+8jOS8muiiq+ijgeWJquaIkOWchuW9ou+8iVxuICAgICAgICB2YXIgYXZhdGFyTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQXZhdGFyXCIpXG4gICAgICAgIGF2YXRhck5vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZSg1MCwgNTApKVxuICAgICAgICB2YXIgYXZhdGFyU3ByaXRlID0gYXZhdGFyTm9kZS5hZGRDb21wb25lbnQoY2MuU3ByaXRlKVxuICAgICAgICBhdmF0YXJTcHJpdGUudHlwZSA9IGNjLlNwcml0ZS5UeXBlLlNJTVBMRVxuICAgICAgICBhdmF0YXJTcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NXG4gICAgICAgIFxuICAgICAgICAvLyDliqDovb3lpLTlg49cbiAgICAgICAgdGhpcy5fbG9hZFBsYXllckF2YXRhcihwbGF5ZXIuYXZhdGFyLCBhdmF0YXJTcHJpdGUpXG4gICAgICAgIGF2YXRhck5vZGUucGFyZW50ID0gbWFza05vZGVcbiAgICAgICAgXG4gICAgICAgIG1hc2tOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmmLXnp7BcbiAgICAgICAgdmFyIG5hbWVOb2RlID0gbmV3IGNjLk5vZGUoXCJOYW1lXCIpXG4gICAgICAgIG5hbWVOb2RlLnNldFBvc2l0aW9uKDAsIC0xMCkgIC8vIPCflKfjgJDkv67mlLnjgJHosIPmlbTkvY3nva5cbiAgICAgICAgdmFyIG5hbWVMYWJlbCA9IG5hbWVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgbmFtZUxhYmVsLnN0cmluZyA9IHBsYXllci5wbGF5ZXJfbmFtZSB8fCBwbGF5ZXIubmFtZSB8fCAoXCLnjqnlrrZcIiArIChpbmRleCArIDEpKVxuICAgICAgICBuYW1lTGFiZWwuZm9udFNpemUgPSAxMlxuICAgICAgICBuYW1lTGFiZWwubGluZUhlaWdodCA9IDE2XG4gICAgICAgIG5hbWVOb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoOTAsIDE2KSlcbiAgICAgICAgbmFtZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmnLrlmajkurrlkoznnJ/kurrkvb/nlKjnm7jlkIzpopzoibLvvIzkuI3lho3ljLrliIZcbiAgICAgICAgbmFtZU5vZGUuY29sb3IgPSBjYy5jb2xvcigxNTAsIDIyMCwgMjU1KSAgLy8g57uf5LiA5rWF6JOd6ImyXG4gICAgICAgIG5hbWVOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOmHkeW4geaYvuekuiA9PT09PT09PT09XG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHmmL7npLrph5HluIFcbiAgICAgICAgdmFyIGNvaW5Ob2RlID0gbmV3IGNjLk5vZGUoXCJDb2luXCIpXG4gICAgICAgIGNvaW5Ob2RlLnNldFBvc2l0aW9uKDAsIC0yOClcbiAgICAgICAgdmFyIGNvaW5MYWJlbCA9IGNvaW5Ob2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdmFyIG1hdGNoQ29pbiA9IHBsYXllci5tYXRjaF9jb2luIHx8IDBcbiAgICAgICAgaWYgKG1hdGNoQ29pbiA+PSAxMDAwMCkge1xuICAgICAgICAgICAgY29pbkxhYmVsLnN0cmluZyA9IChtYXRjaENvaW4gLyAxMDAwMCkudG9GaXhlZCgxKSArIFwi5LiHXCJcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvaW5MYWJlbC5zdHJpbmcgPSBtYXRjaENvaW4udG9TdHJpbmcoKVxuICAgICAgICB9XG4gICAgICAgIGNvaW5MYWJlbC5mb250U2l6ZSA9IDExXG4gICAgICAgIGNvaW5MYWJlbC5saW5lSGVpZ2h0ID0gMTRcbiAgICAgICAgY29pbk5vZGUuY29sb3IgPSBjYy5jb2xvcigyNTUsIDIxNSwgMCkgIC8vIOmHkeiJslxuICAgICAgICBjb2luTm9kZS5wYXJlbnQgPSBpdGVtTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g54q25oCB5qCH562+XG4gICAgICAgIC8vIOinhOWIme+8muagueaNriBlbnRlcmVkX2F0IOWIpOaWreaYr+WQpuW3sui/m+WFpVxuICAgICAgICB2YXIgc3RhdHVzTm9kZSA9IG5ldyBjYy5Ob2RlKFwiU3RhdHVzXCIpXG4gICAgICAgIHN0YXR1c05vZGUuc2V0UG9zaXRpb24oMCwgLTQ4KSAgLy8g8J+Up+OAkOS/ruaUueOAkeiwg+aVtOS9jee9rlxuICAgICAgICB2YXIgc3RhdHVzTGFiZWwgPSBzdGF0dXNOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgc3RhdHVzTGFiZWwuZm9udFNpemUgPSAxMFxuICAgICAgICBzdGF0dXNMYWJlbC5saW5lSGVpZ2h0ID0gMTJcbiAgICAgICAgc3RhdHVzTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICBcbiAgICAgICAgLy8g5Yik5pat5piv5ZCm5bey6L+b5YWl77ya5pyJIGVudGVyZWRfYXQg5LiU5YC85aSn5LqOMOihqOekuuW3sui/m+WFpVxuICAgICAgICBpZiAocGxheWVyLmVudGVyZWRfYXQgJiYgcGxheWVyLmVudGVyZWRfYXQgPiAwKSB7XG4gICAgICAgICAgICBzdGF0dXNMYWJlbC5zdHJpbmcgPSBcIuW3sui/m+WFpVwiXG4gICAgICAgICAgICBzdGF0dXNOb2RlLmNvbG9yID0gY2MuY29sb3IoMTAwLCAyNTUsIDE1MCkgIC8vIOe7v+iJslxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhdHVzTGFiZWwuc3RyaW5nID0gXCLnrYnlvoXkuK1cIlxuICAgICAgICAgICAgc3RhdHVzTm9kZS5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjAwLCAxMDApICAvLyDmqZnoibJcbiAgICAgICAgfVxuICAgICAgICBzdGF0dXNOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaXRlbU5vZGVcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog5Yqg6L29546p5a625aS05YOPXG4gICAgICovXG4gICAgX2xvYWRQbGF5ZXJBdmF0YXI6IGZ1bmN0aW9uKGF2YXRhclVybCwgc3ByaXRlKSB7XG4gICAgICAgIGlmICghc3ByaXRlKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenOayoeacieWktOWDj1VSTO+8jOS9v+eUqOm7mOiupOWktOWDj1xuICAgICAgICBpZiAoIWF2YXRhclVybCkge1xuICAgICAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoJ1VJL2hlYWRpbWFnZS9hdmF0YXJfMScsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFlcnIgJiYgc3ByaXRlRnJhbWUgJiYgc3ByaXRlICYmIHNwcml0ZS5ub2RlICYmIHNwcml0ZS5ub2RlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenOaYr+WujOaVtOe9kee7nFVSTFxuICAgICAgICBpZiAoYXZhdGFyVXJsLmluZGV4T2YoJ2h0dHA6Ly8nKSA9PT0gMCB8fCBhdmF0YXJVcmwuaW5kZXhPZignaHR0cHM6Ly8nKSA9PT0gMCkge1xuICAgICAgICAgICAgY2MuYXNzZXRNYW5hZ2VyLmxvYWRSZW1vdGUoYXZhdGFyVXJsLCB7IGV4dDogJy5wbmcnIH0sIGZ1bmN0aW9uKGVyciwgdGV4dHVyZSkge1xuICAgICAgICAgICAgICAgIGlmICghZXJyICYmIHRleHR1cmUgJiYgc3ByaXRlICYmIHNwcml0ZS5ub2RlICYmIHNwcml0ZS5ub2RlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZiA9IG5ldyBjYy5TcHJpdGVGcmFtZSh0ZXh0dXJlKVxuICAgICAgICAgICAgICAgICAgICAgICAgc3ByaXRlLnNwcml0ZUZyYW1lID0gc2ZcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOacjeWKoeerr+S4iuS8oOeahOWktOWDj+i3r+W+hOWkhOeQhu+8iOebuOWvuei3r+W+hO+8iVxuICAgICAgICAvLyDmlK/mjIHmoLzlvI86IFwiL3VwbG9hZHMvZmlsZS9hdmF0YXIvLi4uXCIgXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICB2YXIgY2RuVXJsID0gbXlnbG9iYWwgJiYgbXlnbG9iYWwuY2RuVXJsID8gbXlnbG9iYWwuY2RuVXJsIDogXCJodHRwczovL2FwaXMuaG9uZ3hpdTg4LmNvbVwiXG4gICAgICAgIFxuICAgICAgICBpZiAoYXZhdGFyVXJsLmluZGV4T2YoJy91cGxvYWRzLycpID09PSAwKSB7XG4gICAgICAgICAgICAvLyDnm7jlr7not6/lvoTvvIzpnIDopoHmt7vliqDln5/lkI3liY3nvIBcbiAgICAgICAgICAgIHZhciBmdWxsVXJsID0gY2RuVXJsICsgYXZhdGFyVXJsXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hTWF0Y2hXYWl0aW5nXSDliqDovb3lpLTlg48o55u45a+56Lev5b6EKTpcIiwgZnVsbFVybClcbiAgICAgICAgICAgIGNjLmFzc2V0TWFuYWdlci5sb2FkUmVtb3RlKGZ1bGxVcmwsIHsgZXh0OiAnLnBuZycgfSwgZnVuY3Rpb24oZXJyLCB0ZXh0dXJlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFlcnIgJiYgdGV4dHVyZSAmJiBzcHJpdGUgJiYgc3ByaXRlLm5vZGUgJiYgc3ByaXRlLm5vZGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNmID0gbmV3IGNjLlNwcml0ZUZyYW1lKHRleHR1cmUpXG4gICAgICAgICAgICAgICAgICAgICAgICBzcHJpdGUuc3ByaXRlRnJhbWUgPSBzZlxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn4+f77iPIFtBcmVuYU1hdGNoV2FpdGluZ10g5aS05YOP5Yqg6L295aSx6LSlOlwiLCBmdWxsVXJsKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+Pn++4jyBbQXJlbmFNYXRjaFdhaXRpbmddIOWktOWDj+WKoOi9vemUmeivrzpcIiwgZXJyKVxuICAgICAgICAgICAgICAgICAgICAvLyDliqDovb3lpLHotKXvvIzkvb/nlKjpu5jorqTlpLTlg49cbiAgICAgICAgICAgICAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoJ1VJL2hlYWRpbWFnZS9hdmF0YXJfMScsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIyLCBzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlcnIyICYmIHNwcml0ZUZyYW1lICYmIHNwcml0ZSAmJiBzcHJpdGUubm9kZSAmJiBzcHJpdGUubm9kZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOacrOWcsOi1hOa6kOi3r+W+hFxuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZCgnVUkvaGVhZGltYWdlLycgKyBhdmF0YXJVcmwsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoIWVyciAmJiBzcHJpdGVGcmFtZSAmJiBzcHJpdGUgJiYgc3ByaXRlLm5vZGUgJiYgc3ByaXRlLm5vZGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgIHNwcml0ZS5zcHJpdGVGcmFtZSA9IHNwcml0ZUZyYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOaPkOekuua2iOaBr1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgX3Nob3dKb2luTWVzc2FnZTogZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAvLyDliJvlu7rmta7liqjmj5DnpLpcbiAgICAgICAgdmFyIHRpcE5vZGUgPSBuZXcgY2MuTm9kZShcIkpvaW5UaXBcIilcbiAgICAgICAgdGlwTm9kZS5zZXRQb3NpdGlvbigwLCAxMDApXG4gICAgICAgIFxuICAgICAgICB2YXIgbGFiZWwgPSB0aXBOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgbGFiZWwuc3RyaW5nID0gbWVzc2FnZVxuICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDI0XG4gICAgICAgIGxhYmVsLmxpbmVIZWlnaHQgPSAzMlxuICAgICAgICBsYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHRpcE5vZGUuY29sb3IgPSBjYy5jb2xvcigxMDAsIDI1NSwgMTAwKVxuICAgICAgICBcbiAgICAgICAgdmFyIG91dGxpbmUgPSB0aXBOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpXG4gICAgICAgIG91dGxpbmUuY29sb3IgPSBjYy5jb2xvcigwLCAwLCAwKVxuICAgICAgICBvdXRsaW5lLndpZHRoID0gMlxuICAgICAgICBcbiAgICAgICAgdGlwTm9kZS5wYXJlbnQgPSB0aGlzLm5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOa3oeWHuuWKqOeUu1xuICAgICAgICB0aXBOb2RlLnJ1bkFjdGlvbihjYy5zZXF1ZW5jZShcbiAgICAgICAgICAgIGNjLm1vdmVCeSgxLjUsIGNjLnYyKDAsIDUwKSksXG4gICAgICAgICAgICBjYy5mYWRlT3V0KDAuNSksXG4gICAgICAgICAgICBjYy5yZW1vdmVTZWxmKClcbiAgICAgICAgKSlcbiAgICB9XG59KTtcbiJdfQ==