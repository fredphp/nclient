"use strict";
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