
                (function() {
                    var nodeEnv = typeof require !== 'undefined' && typeof process !== 'undefined';
                    var __module = nodeEnv ? module : {exports:{}};
                    var __filename = 'preview-scripts/assets/scripts/hallscene/hallScene.js';
                    var __require = nodeEnv ? function (request) {
                        return cc.require(request);
                    } : function (request) {
                        return __quick_compile_project__.require(request, __filename);
                    };
                    function __define (exports, require, module) {
                        if (!nodeEnv) {__quick_compile_project__.registerModule(__filename, module);}"use strict";
cc._RF.push(module, 'd2b3cTV5veJAavN7xI0Vnkh', 'hallScene');
// scripts/hallscene/hallScene.js

"use strict";

var _cc$Class;

// 使用全局变量，不使用 require
// 脚本加载日志
cc.Class((_cc$Class = {
  "extends": cc.Component,
  properties: {
    nickname_label: cc.Label,
    headimage: cc.Sprite,
    gobal_count: cc.Label,
    // 竞技币显示Label（可选，如果场景中没有则动态创建）
    arena_coin_label: cc.Label,
    creatroom_prefabs: cc.Prefab,
    joinroom_prefabs: cc.Prefab,
    user_agreement_prefabs: cc.Prefab
  },
  onLoad: function onLoad() {
    if (!window.myglobal) {
      console.warn("myglobal 未定义，等待初始化...");

      this._waitForMyglobal();

      return;
    }

    this._initWithPlayerData();
  },
  // 加载图片旋转动画
  update: function update(dt) {
    // _showMessageCenter 的加载图片旋转
    if (this._loadingImageAnimating && this._loadingImageNode && this._loadingImageNode.isValid) {
      this._loadingImageNode.angle += dt * 180;
    } // _showQuickEnterAnimation 的加载图片旋转


    if (this._quickEnterAnimating && this._quickEnterLoadingNode && this._quickEnterLoadingNode.isValid) {
      this._quickEnterLoadingNode.angle += dt * 180;
    }
  },
  _waitForMyglobal: function _waitForMyglobal() {
    var self = this;
    var attempts = 0;
    var maxAttempts = 20;

    var check = function check() {
      attempts++;

      if (window.myglobal && window.myglobal.playerData) {
        self._initWithPlayerData();
      } else if (attempts < maxAttempts) {
        setTimeout(check, 100);
      } else {
        console.error("myglobal 初始化超时");
        cc.director.loadScene("loginScene");
      }
    };

    setTimeout(check, 100);
  },
  _initWithPlayerData: function _initWithPlayerData() {
    var myglobal = window.myglobal;

    if (!myglobal || !myglobal.playerData) {
      console.error("myglobal 或 playerData 未定义");
      cc.director.loadScene("loginScene");
      return;
    }

    var playerData = myglobal.playerData;

    if (!playerData.token) {
      cc.director.loadScene("loginScene");
      return;
    }

    var self = this; // 检查 verifyToken 是否存在

    if (typeof myglobal.verifyToken !== 'function') {
      console.warn("verifyToken 方法不存在，跳过验证");

      self._initUIAfterAuth();

      return;
    }

    try {
      myglobal.verifyToken(function (valid, message) {
        if (!valid) {
          cc.director.loadScene("loginScene");
          return;
        }

        self._initUIAfterAuth();
      });
    } catch (e) {
      console.error("verifyToken 调用失败:", e);

      self._initUIAfterAuth();
    }
  },
  _initUIAfterAuth: function _initUIAfterAuth() {
    try {
      var myglobal = window.myglobal;
      var playerData = myglobal ? myglobal.playerData : null;

      if (!playerData) {
        console.warn("playerData 为空，使用默认值");
        playerData = {
          nickName: "游客",
          gobal_count: 0,
          avatarUrl: null
        };
      } // 设置昵称
      // 优先使用属性关联的 Label，如果没有则通过节点名查找


      var nicknameLabel = this.nickname_label; // 如果属性关联的 Label 无效，尝试通过节点名查找

      if (!nicknameLabel || nicknameLabel.string === undefined) {
        // 递归查找 nickname_label 节点
        var nicknameNode = this._findNodeByName(this.node, "nickname_label");

        if (nicknameNode) {
          nicknameLabel = nicknameNode.getComponent(cc.Label);
        }
      }

      if (nicknameLabel) {
        nicknameLabel.string = playerData.nickName || "游客";
      } else {
        console.warn("【大厅】nickname_label 未找到，请检查场景文件");
      } // 设置金币/欢乐豆显示
      // 默认显示欢乐豆，根据当前选中的房间类型切换显示


      this._currentRoomCategory = 1; // 默认普通场

      this._updateCurrencyDisplay();

      this._adjustGoldElementsPosition();

      this._loadUserAvatar(playerData.avatarUrl);

      this.roomConfigs = []; // 初始化竞技币显示

      this._initArenaCoinDisplay(); // 获取最新的玩家余额（金币和竞技币）


      this._refreshPlayerBalance();

      this._playHallBackgroundMusic();

      this._adjustBottomButtons();

      this._hideBackgroundCharacters();

      this._initWebSocket(); // 初始化 WebSocket 连接


      this._startOnlineMonitoring(); // 启动在线状态监测


      this._fetchRoomConfigs();

      this._removeNoticeBoard(); // 注释掉：大厅不需要加入房间按钮，该功能在房间列表场景中使用
      // this._createEnterRoomButton();  // 创建加入房间按钮
      // 🚀【性能优化】预加载游戏场景


      this._preloadGameScene();
    } catch (e) {
      console.error("_initUIAfterAuth 异常:", e);
    }
  },
  // 启动在线状态监测
  _startOnlineMonitoring: function _startOnlineMonitoring() {
    var myglobal = window.myglobal;

    if (!myglobal) {
      console.warn("myglobal 未定义，无法启动在线监测");
      return;
    } // 启动全局在线监测


    if (myglobal.startOnlineMonitoring) {
      myglobal.startOnlineMonitoring();
    } // 监听在线状态变化


    var self = this;

    this._onlineStatusHandler = function (isOnline) {
      // 只有在非初始化状态下才显示离线提示
      if (!isOnline && !myglobal._isInitializing) {
        self._showOfflineMessage();
      } else if (!isOnline && myglobal._isInitializing) {}
    };

    if (myglobal.addOnlineStatusListener) {
      myglobal.addOnlineStatusListener(this._onlineStatusHandler);
    } // 监听强制下线事件


    if (myglobal.eventlister) {
      myglobal.eventlister.on("force_logout", function (data) {
        console.warn("🚫 收到强制下线事件:", data);

        self._handleForceLogout(data);
      });
    }
  },
  // 显示离线提示
  _showOfflineMessage: function _showOfflineMessage() {
    this._showMessage("网络连接已断开，正在重新连接...");
  },
  // 处理强制下线
  _handleForceLogout: function _handleForceLogout(data) {
    var reason = data.reason || "您已被强制下线";

    this._showMessage(reason); // 停止监测


    var myglobal = window.myglobal;

    if (myglobal && myglobal.stopOnlineMonitoring) {
      myglobal.stopOnlineMonitoring();
    } // 延迟跳转到登录页面


    this.scheduleOnce(function () {
      cc.director.loadScene("loginScene");
    }, 2);
  },
  // 停止在线状态监测
  _stopOnlineMonitoring: function _stopOnlineMonitoring() {
    var myglobal = window.myglobal;

    if (myglobal && myglobal.stopOnlineMonitoring) {
      myglobal.stopOnlineMonitoring();
    }

    if (myglobal && myglobal.removeOnlineStatusListener && this._onlineStatusHandler) {
      myglobal.removeOnlineStatusListener(this._onlineStatusHandler);
      this._onlineStatusHandler = null;
    }
  },
  // 🚀【性能优化】预加载游戏场景
  _preloadGameScene: function _preloadGameScene() {
    var self = this;
    var startTime = Date.now(); // 🔧【优化】预加载场景资源

    cc.director.preloadScene("gameScene", function (err) {
      if (err) {
        console.error("🚀 [预加载] 游戏场景预加载失败:", err);
        return;
      }

      var elapsed = Date.now() - startTime; // 🔧【新增】标记场景已预加载

      self._gameScenePreloaded = true;
    });
  },
  // 初始化 WebSocket 连接
  _initWebSocket: function _initWebSocket() {
    var myglobal = window.myglobal;

    if (!myglobal || !myglobal.socket) {
      console.warn("socket 未初始化");
      return;
    } // 检查是否已连接


    if (myglobal.socket.isWebSocketOpen && myglobal.socket.isWebSocketOpen()) {
      return;
    } // 检查逻辑连接状态


    if (myglobal.socket.isConnected && myglobal.socket.isConnected()) {
      return;
    } // 初始化 WebSocket


    if (myglobal.socket.initSocket) {
      myglobal.socket.initSocket();
    }
  },
  // 递归查找节点
  _findNodeByName: function _findNodeByName(parentNode, nodeName) {
    // 先检查直接子节点
    var found = parentNode.getChildByName(nodeName);
    if (found) return found; // 递归查找

    var children = parentNode.children;

    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      found = this._findNodeByName(child, nodeName);
      if (found) return found;
    }

    return null;
  },
  _hideBackgroundCharacters: function _hideBackgroundCharacters() {
    var xiongmao1 = this.node.getChildByName("xiongmao1");
    var xiongmao2 = this.node.getChildByName("xiongmao2");
    if (xiongmao1) xiongmao1.active = false;
    if (xiongmao2) xiongmao2.active = false;
  },
  // 调整底部按钮 - 调小并靠右排列
  _adjustBottomButtons: function _adjustBottomButtons() {
    var self = this;
    var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
    var screenHeight = canvas ? canvas.designResolution.height : 720;
    var screenWidth = canvas ? canvas.designResolution.width : 1280; // 底部按钮名称列表

    var buttonNames = ["btn_create_room", "btn_join_room", "btn_user_agreement", "user_agreement", "btn_setting", "btn_help"]; // 收集存在的按钮

    var buttons = [];

    for (var i = 0; i < buttonNames.length; i++) {
      var btn = this.node.getChildByName(buttonNames[i]);

      if (btn && btn.active !== false) {
        buttons.push(btn);
      }
    } // 如果没找到，尝试查找其他可能的按钮


    if (buttons.length === 0) {
      var allChildren = this.node.children;

      for (var i = 0; i < allChildren.length; i++) {
        var child = allChildren[i];

        if (child.name && child.name.toLowerCase().indexOf('btn') >= 0) {
          // 检查是否在底部区域
          if (child.y < 0) {
            buttons.push(child);
          }
        }
      }
    } // 调整每个按钮


    var btnWidth = 120; // 按钮宽度

    var btnHeight = 50; // 按钮高度

    var btnGap = 15; // 按钮间距

    var rightMargin = 30; // 右边距

    var bottomMargin = 30; // 底边距

    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i]; // 禁用 Widget 组件

      var widget = btn.getComponent(cc.Widget);
      if (widget) widget.enabled = false; // 缩小按钮

      btn.scale = 0.7; // 设置锚点

      btn.anchorX = 1; // 右锚点

      btn.anchorY = 0; // 底锚点
      // 计算位置 - 从右往左排列

      var xPos = screenWidth / 2 - rightMargin - i * (btnWidth * 0.7 + btnGap);
      var yPos = -screenHeight / 2 + bottomMargin;
      btn.x = xPos;
      btn.y = yPos;
    }
  },
  _loadUserAvatar: function _loadUserAvatar(avatarUrl) {
    var self = this;
    if (!this.headimage) return;

    if (!avatarUrl) {
      this._loadDefaultAvatar();

      return;
    }

    if (avatarUrl.indexOf('http://') === 0 || avatarUrl.indexOf('https://') === 0) {
      cc.assetManager.loadRemote(avatarUrl, {
        ext: '.png'
      }, function (err, texture) {
        if (err || !texture) {
          self._loadDefaultAvatar();

          return;
        }

        try {
          var spriteFrame = new cc.SpriteFrame(texture);
          if (spriteFrame) self.headimage.spriteFrame = spriteFrame;
        } catch (e) {
          self._loadDefaultAvatar();
        }
      });
    } else {
      cc.resources.load('UI/headimage/' + avatarUrl, cc.SpriteFrame, function (err, spriteFrame) {
        if (err || !spriteFrame) {
          self._loadDefaultAvatar();

          return;
        }

        try {
          self.headimage.spriteFrame = spriteFrame;
        } catch (e) {
          self._loadDefaultAvatar();
        }
      });
    }
  },
  _loadDefaultAvatar: function _loadDefaultAvatar() {
    var self = this;
    cc.resources.load('UI/headimage/avatar_1', cc.SpriteFrame, function (err, spriteFrame) {
      if (!err && spriteFrame) {
        try {
          self.headimage.spriteFrame = spriteFrame;
        } catch (e) {}
      }
    });
  },
  _playHallBackgroundMusic: function _playHallBackgroundMusic() {
    var isopen_sound = window.isopen_sound || 1;
    if (!isopen_sound) return;

    try {
      cc.audioEngine.stopMusic();
      cc.audioEngine.stopAllEffects();
      cc.resources.load("sound/login_bg", cc.AudioClip, function (err, clip) {
        if (!err && clip) {
          try {
            cc.audioEngine.playMusic(clip, true);
          } catch (e) {}
        }
      });
    } catch (e) {}
  },
  _fetchRoomConfigs: function _fetchRoomConfigs() {
    var self = this;
    var apiUrl = window.defines ? window.defines.apiUrl : '';
    var cryptoKey = window.defines ? window.defines.cryptoKey : ''; // 如果没有配置 API，使用默认配置

    if (!apiUrl || !window.HttpAPI) {
      self._initRoomButtons(self._getDefaultRoomConfigs());

      return;
    }

    try {
      // 清除缓存
      if (HttpAPI._roomConfigCache) {
        HttpAPI._roomConfigCache = null;
      }

      try {
        localStorage.removeItem('room_config_cache');
      } catch (e) {} // 请求 API


      HttpAPI.get(apiUrl + '/api/v1/room/config/list', cryptoKey, function (err, result) {
        if (err) {
          console.warn("API请求失败:", err);

          self._initRoomButtons(self._getDefaultRoomConfigs());

          return;
        }

        var configs = null;

        if (result && result.code === 0 && result.data) {
          configs = result.data;
        } else if (result && Array.isArray(result)) {
          configs = result;
        } // 🔧【调试】输出获取到的房间配置


        if (configs) {
          for (var i = 0; i < configs.length; i++) {
            var c = configs[i];
          }
        }

        if (configs && configs.length > 0) {
          self.roomConfigs = configs;

          self._initRoomButtons(configs);
        } else {
          self._initRoomButtons(self._getDefaultRoomConfigs());
        }
      });
    } catch (e) {
      console.error("_fetchRoomConfigs 异常:", e);

      self._initRoomButtons(self._getDefaultRoomConfigs());
    }
  },
  _getDefaultRoomConfigs: function _getDefaultRoomConfigs() {
    return [{
      id: 1,
      room_name: "初级房",
      room_type: 2,
      base_score: 1,
      multiplier: 1,
      min_gold: 0,
      max_gold: 50000,
      description: "底分1",
      status: 1,
      sort_order: 0,
      room_category: 1
    }, {
      id: 2,
      room_name: "中级房",
      room_type: 3,
      base_score: 2,
      multiplier: 1,
      min_gold: 50000,
      max_gold: 200000,
      description: "底分2",
      status: 1,
      sort_order: 1,
      room_category: 1
    }, {
      id: 3,
      room_name: "高级房",
      room_type: 4,
      base_score: 5,
      multiplier: 2,
      min_gold: 200000,
      max_gold: 1000000,
      description: "底分5",
      status: 1,
      sort_order: 2,
      room_category: 2
    }, {
      id: 4,
      room_name: "娱乐房",
      room_type: 5,
      base_score: 10,
      multiplier: 3,
      min_gold: 1000000,
      max_gold: 5000000,
      description: "底分10",
      status: 1,
      sort_order: 3,
      room_category: 2
    }, {
      id: 5,
      room_name: "娱乐房",
      room_type: 6,
      base_score: 20,
      multiplier: 5,
      min_gold: 5000000,
      max_gold: 0,
      description: "底分20",
      status: 1,
      sort_order: 4,
      room_category: 2
    }];
  },
  _hideUnwantedButtons: function _hideUnwantedButtons() {
    var createRoomBtn = this.node.getChildByName("btn_create_room");
    var joinRoomBtn = this.node.getChildByName("btn_join_room");
    if (createRoomBtn) createRoomBtn.active = false;
    if (joinRoomBtn) joinRoomBtn.active = false;
  },
  // ============================================================
  // 核心方法：初始化房间按钮
  // ============================================================
  _initRoomButtons: function _initRoomButtons(rooms) {
    var self = this; // 按钮名称映射

    var buttonNameMap = {
      2: "btn_room_junior",
      3: "btn_room_middle",
      4: "btn_room_senior",
      5: "btn_room_master",
      6: "btn_room_supreme"
    }; // 先隐藏所有房间按钮

    for (var key in buttonNameMap) {
      var btnNode = this.node.getChildByName(buttonNameMap[key]);
      if (btnNode) btnNode.active = false;
    } // ============================================================
    // 【一、数据处理】所有房间合并到一个数组，按 sort_order 排序
    // ============================================================


    var allRooms = [];

    for (var i = 0; i < rooms.length; i++) {
      var config = rooms[i];
      var sortOrder = config.sort_order || config.sortOrder || config.sort || 0;
      var roomType = config.room_type || config.roomType;
      var buttonName = buttonNameMap[roomType];
      if (!buttonName) continue;
      var btnNode = this.node.getChildByName(buttonName);
      if (!btnNode) continue;
      var roomData = {
        node: btnNode,
        config: config,
        roomType: roomType,
        sortOrder: sortOrder,
        roomName: config.room_name || config.roomName || "未知房间",
        minGold: config.min_gold || config.minGold || 0,
        maxGold: config.max_gold || config.maxGold || 0,
        roomCategory: config.room_category || config.roomCategory || 1
      };
      allRooms.push(roomData);
    } // 按 sort_order 升序排序


    allRooms.sort(function (a, b) {
      return a.sortOrder - b.sortOrder;
    }); // 配置所有卡片

    for (var i = 0; i < allRooms.length; i++) {
      var room = allRooms[i];
      room.node.active = true;
      room.node.roomConfig = room.config;

      self._loadRoomButtonBg(room.node, room.roomType);

      self._updateMinGoldLabel(room.node, room.config);

      var button = room.node.getComponent(cc.Button);

      if (button) {
        button.transition = cc.Button.Transition.SCALE;
        button.duration = 0.1;
        button.zoomScale = 1.1;
      } // 收集竞技场房间


      if (room.roomCategory === 2) {
        if (!self._arenaRooms) self._arenaRooms = [];

        self._arenaRooms.push(room);
      }

      (function (config, node, roomName, roomCategory) {
        node.off(cc.Node.EventType.TOUCH_END);
        node.on(cc.Node.EventType.TOUCH_END, function (event) {
          event.stopPropagation(); // 竞技场房间：不再响应整个卡片的点击，由报名按钮处理

          if (roomCategory === 2) {
            return;
          }

          self._onRoomButtonClick(config);
        });
      })(room.config, room.node, room.roomName, room.roomCategory);
    } // 渲染布局 - 所有卡片排成一行


    this._renderRoomLayout(allRooms); // 为竞技场房间添加报名按钮


    this._addArenaSignupButtons(); // 🔧【新增】先从服务端获取报名状态，再更新UI


    this._fetchSignupStatusAndUpdateUI();
  },
  // 🔧【新增】从服务端获取报名状态并更新UI
  _fetchSignupStatusAndUpdateUI: function _fetchSignupStatusAndUpdateUI() {
    var self = this;

    if (window.arenaData && window.arenaData.fetchSignupStatusFromServer) {
      window.arenaData.fetchSignupStatusFromServer(function (err, signedUpRooms) {
        if (err) {
          console.warn("🏟️ 获取报名状态失败，使用本地缓存:", err);
        } else {} // 无论成功失败，都更新UI（使用本地缓存）


        self._updateArenaSignupStatus();
      });
    } else {
      // 没有API支持，直接使用本地缓存
      this._updateArenaSignupStatus();
    }
  },
  // ============================================================
  // 布局渲染 - 所有卡片水平排成一行
  // ============================================================
  _renderRoomLayout: function _renderRoomLayout(allRooms) {
    var self = this; // 清理旧容器

    var oldPanel = this.node.getChildByName("CardContainer");
    var oldLeftPanel = this.node.getChildByName("LeftArea");
    var oldRightPanel = this.node.getChildByName("RightArea");
    if (oldPanel) oldPanel.destroy();
    if (oldLeftPanel) oldLeftPanel.destroy();
    if (oldRightPanel) oldRightPanel.destroy();

    if (allRooms.length === 0) {
      return;
    } // ============================================================
    // 参数设置
    // ============================================================


    var cardWidth = 180; // 卡片宽度

    var cardHeight = 120; // 卡片高度

    var gapX = 30; // 卡片水平间距
    // 画布尺寸

    var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
    var screenHeight = canvas ? canvas.designResolution.height : 720;
    var screenWidth = canvas ? canvas.designResolution.width : 1280; // 计算容器宽度

    var totalCardsWidth = allRooms.length * cardWidth + (allRooms.length - 1) * gapX;
    var panelWidth = Math.max(totalCardsWidth + 40, screenWidth - 100);
    var panelHeight = cardHeight + 40; // 容器位置

    var verticalOffset = 20; // 垂直偏移（下移）
    // ============================================================
    // 创建容器 - 所有卡片水平排成一行
    // ============================================================

    var cardPanel = new cc.Node("CardContainer");
    cardPanel.setContentSize(panelWidth, panelHeight);
    cardPanel.anchorX = 0.5;
    cardPanel.anchorY = 0.5;
    cardPanel.x = 0; // 居中

    cardPanel.y = verticalOffset;
    cardPanel.parent = this.node; // 放置所有卡片 - 水平排列

    var startX = -totalCardsWidth / 2 + cardWidth / 2;

    for (var i = 0; i < allRooms.length; i++) {
      var room = allRooms[i];
      var widget = room.node.getComponent(cc.Widget);
      if (widget) widget.enabled = false;
      room.node.anchorX = 0.5;
      room.node.anchorY = 0.5;
      room.node.scale = 1;
      room.node.active = true;
      room.node.parent = cardPanel; // 卡片水平位置：从左到右排列

      room.node.x = startX + i * (cardWidth + gapX); // 卡片垂直位置：居中

      room.node.y = 0;
    }
  },
  // 添加区域标题
  _addAreaTitle: function _addAreaTitle(panel, titleText, x, y) {
    var titleNode = new cc.Node("AreaTitle");
    titleNode.setPosition(x, y);
    titleNode.anchorX = 0.5;
    titleNode.anchorY = 0.5;
    var label = titleNode.addComponent(cc.Label);
    label.string = titleText;
    label.fontSize = 28;
    label.lineHeight = 36;
    label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    titleNode.color = cc.color(255, 215, 0);
    var outline = titleNode.addComponent(cc.LabelOutline);
    outline.color = cc.color(0, 0, 0);
    outline.width = 2;
    titleNode.parent = panel;
  },
  // 准备卡片节点（响应式，支持缩放）
  _prepareCardNodeResponsive: function _prepareCardNodeResponsive(node, cardScale) {
    // 禁用 Widget 组件（防止自动拉伸）
    var widget = node.getComponent(cc.Widget);

    if (widget) {
      widget.enabled = false;
    } // 锚点设为中心


    node.anchorX = 0.5;
    node.anchorY = 0.5; // 应用缩放（不拉伸，保持比例）

    node.scale = cardScale || 1;
  }
}, _cc$Class["_addAreaTitle"] = function _addAreaTitle(panel, title, x, y) {
  var titleNode = new cc.Node("Title");
  titleNode.setPosition(x, y);
  titleNode.anchorX = 0;
  titleNode.anchorY = 0.5;
  var label = titleNode.addComponent(cc.Label);
  label.string = title;
  label.fontSize = 28;
  label.lineHeight = 36;
  label.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
  titleNode.color = cc.color(255, 215, 0);
  var outline = titleNode.addComponent(cc.LabelOutline);
  outline.color = cc.color(0, 0, 0);
  outline.width = 2;
  titleNode.parent = panel;
}, _cc$Class._loadRoomButtonBg = function _loadRoomButtonBg(btnNode, roomType) {
  var self = this;
  var sprite = btnNode.getComponent(cc.Sprite);
  if (!sprite) return;
  cc.resources.load('UI/btn_happy_' + roomType, cc.SpriteFrame, function (err, spriteFrame) {
    if (err || !spriteFrame) {
      self._loadDefaultRoomButtonBg(btnNode);

      return;
    }

    try {
      sprite.spriteFrame = spriteFrame;
    } catch (e) {
      self._loadDefaultRoomButtonBg(btnNode);
    }
  });
}, _cc$Class._loadDefaultRoomButtonBg = function _loadDefaultRoomButtonBg(btnNode) {
  var sprite = btnNode.getComponent(cc.Sprite);
  if (!sprite) return;
  cc.resources.load('UI/btn_happy_2', cc.SpriteFrame, function (err, spriteFrame) {
    if (!err && spriteFrame) {
      try {
        sprite.spriteFrame = spriteFrame;
      } catch (e) {}
    }
  });
}, _cc$Class._updateMinGoldLabel = function _updateMinGoldLabel(btnNode, config) {
  var goldLabelNode = btnNode.getChildByName("min_gold_label"); // 获取房间分类，默认为普通场(1)

  var roomCategory = config.room_category || config.roomCategory || 1;

  if (!goldLabelNode) {
    goldLabelNode = new cc.Node("min_gold_label");
    var label = goldLabelNode.addComponent(cc.Label);
    label.fontSize = 22; // 字体大小

    label.lineHeight = 28; // 行高

    label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    goldLabelNode.anchorX = 0.5;
    goldLabelNode.anchorY = 0.5;
    var outline = goldLabelNode.addComponent(cc.LabelOutline);
    outline.color = cc.color(0, 0, 0);
    outline.width = 2; // 设置更高的 zIndex 确保显示在最上层

    goldLabelNode.zIndex = 100;
    goldLabelNode.parent = btnNode;
  }

  var label = goldLabelNode.getComponent(cc.Label); // 根据房间类型获取不同的字段值
  // room_category: 1-普通场(使用min_gold), 2-竞技场(使用min_arena_coin)

  var minValue;
  var currencyName;

  if (roomCategory === 2) {
    // 竞技场 - 使用 min_arena_coin 字段
    minValue = config.min_arena_coin || config.minArenaCoin || 0;
    currencyName = "币";
    goldLabelNode.color = cc.color(255, 255, 255); // 竞技场：白色
    // 竞技场：不显示"最低"

    label.string = this._formatGold(minValue) + " " + currencyName;
  } else {
    // 普通场 - 使用 min_gold 字段
    minValue = config.min_gold || config.minGold || 0;
    currencyName = "豆";
    goldLabelNode.color = cc.color(255, 255, 255); // 普通场：白色
    // 普通场：保留"最低"

    label.string = "最低 " + this._formatGold(minValue) + " " + currencyName;
  } // 修正位置：按钮图片底部有豆子图标在左侧，文字应显示在图标右侧
  // 按钮高度 375px，底部蓝色渐变条约占 1/4（约在75%-100%位置）
  // 图标在底部左侧约10%-20%宽度位置，文字应偏右显示


  var btnHeight = btnNode.height || 375; // Y坐标：从底部边缘向上约16%的位置（在渐变条内）

  var yOffset = -btnHeight / 2 + btnHeight * 0.16; // X坐标：居中显示

  var xOffset = 0; // 居中

  goldLabelNode.setPosition(xOffset, yOffset);
}, _cc$Class._onRoomButtonClick = function _onRoomButtonClick(roomConfig) {
  var self = this;
  var myglobal = window.myglobal;
  var roomCategory = roomConfig.room_category || roomConfig.roomCategory || 1; // 更新货币显示

  this._currentRoomCategory = roomCategory;

  this._updateCurrencyDisplay(); // 根据房间类型处理


  if (roomCategory === 2) {
    // 竞技场房间 - 显示报名弹窗
    this._onArenaRoomButtonClick(roomConfig);
  } else {
    // 普通场房间 - 原有逻辑
    this._onNormalRoomButtonClick(roomConfig);
  }
}, _cc$Class._onNormalRoomButtonClick = function _onNormalRoomButtonClick(roomConfig) {
  var self = this;
  var myglobal = window.myglobal;
  var playerGold = myglobal && myglobal.playerData ? myglobal.playerData.gobal_count : 0;
  var minGold = roomConfig.min_gold || roomConfig.minGold || 0;
  var maxGold = roomConfig.max_gold || roomConfig.maxGold || 0;

  if (playerGold < minGold) {
    this._showAdRewardDialog('gold', minGold - playerGold);

    return;
  }

  if (maxGold > 0 && playerGold > maxGold) {
    this._showMessage("欢乐豆超过上限，请前往更高级房间");

    return;
  } // 保存当前房间配置


  if (myglobal) {
    myglobal.currentRoomConfig = roomConfig;
    myglobal.currentRoomLevel = roomConfig.room_type;
    myglobal.currentRoomName = roomConfig.room_name;
  } // 直接快速匹配进入游戏


  this._quickMatch(roomConfig, playerGold);
}, _cc$Class._onArenaRoomButtonClick = function _onArenaRoomButtonClick(roomConfig, btnNode) {
  var self = this;
  var myglobal = window.myglobal; // 检查是否已报名

  var roomId = roomConfig.id;

  if (window.arenaData && window.arenaData.isSignedUp(roomId)) {
    // 已报名，不做处理
    this._showMessage("您已报名此竞技场");

    return;
  } // 检查是否已报名其他竞技场（初级、中级、高级场只能报一个）


  if (window.arenaData && this._hasSignedUpOtherArena(roomId)) {
    this._showMessage("您已报名其他竞技场，每场只能报名一个级别");

    return;
  } // 🔧【修复】不使用本地缓存的竞技币余额判断，直接调用服务端报名API
  // 原因：后台添加竞技币后，客户端本地缓存的值没有更新，会导致误判
  // 服务端会检查竞技币余额并返回详细错误信息
  // 直接执行报名


  this._doArenaSignup(roomConfig, btnNode);
}, _cc$Class._hasSignedUpOtherArena = function _hasSignedUpOtherArena(currentRoomId) {
  if (!window.arenaData || !this._arenaRooms) return false;

  for (var i = 0; i < this._arenaRooms.length; i++) {
    var room = this._arenaRooms[i];
    var roomId = room.config.id;

    if (roomId !== currentRoomId && window.arenaData.isSignedUp(roomId)) {
      return true;
    }
  }

  return false;
}, _cc$Class._doArenaSignup = function _doArenaSignup(roomConfig, btnNode) {
  var self = this; // 显示加载中

  this._showMessage("正在报名..."); // 调用报名API


  if (window.arenaData) {
    window.arenaData.signup(roomConfig.id, function (err, result) {
      if (err) {
        self._showMessage(err || "报名失败");

        return;
      } // 报名成功


      self._showMessage("报名成功！"); // 刷新玩家余额


      if (window.arenaData.refreshBalance) {
        window.arenaData.refreshBalance();
      } // 更新UI


      self._updateArenaSignupStatus();
    });
  }
}, _cc$Class._addArenaSignupButtons = function _addArenaSignupButtons() {
  var self = this;
  if (!this._arenaRooms) return; // 获取卡片容器

  var cardPanel = this.node.getChildByName("CardContainer");

  if (!cardPanel) {
    console.warn("CardContainer not found");
    return;
  } // 清理旧的报名按钮和倒计时显示


  var oldButtons = cardPanel.getChildByName("ArenaSignupButtons");
  if (oldButtons) oldButtons.destroy();
  var oldTimers = cardPanel.getChildByName("ArenaCountdowns");
  if (oldTimers) oldTimers.destroy(); // 创建报名按钮容器

  var buttonContainer = new cc.Node("ArenaSignupButtons");
  buttonContainer.parent = cardPanel; // 创建倒计时显示容器

  var countdownContainer = new cc.Node("ArenaCountdowns");
  countdownContainer.parent = cardPanel;

  for (var i = 0; i < this._arenaRooms.length; i++) {
    var room = this._arenaRooms[i];
    var btnNode = room.node;
    var config = room.config; // ============================================================
    // 【重构】创建竞技场状态项 - 单一背景结构
    // 结构: RoomStatusItem > [Bg, TitleLabel, DescLabel]
    // ============================================================
    // 状态栏尺寸（用户指定）

    var statusBarHeight = 72; // 状态栏总高度

    var itemWidth = 180; // 每个状态项宽度

    var itemHeight = 54; // 每个状态项高度

    var itemGap = 12; // 间距

    var leftRightMargin = 24; // 左右留白
    // 背景尺寸 - 文字框宽度只适配文字内容+适当内边距
    // "报名截止 HH:MM" 约12个字符(16px字体)约96px，加上左右内边距

    var bgWidth = 160; // 宽度: 160px，适配文字显示

    var bgHeight = 72; // 高度: 72（两行文字需要更高）

    var bgRadius = 5; // 圆角: 5

    var bgColor = cc.color(255, 180, 100, 140); // 颜色: 淡橘色, 更透明(alpha=140)
    // 创建状态项容器（RoomStatusItem）

    var roomStatusItem = new cc.Node("RoomStatusItem_" + config.id);
    roomStatusItem.setContentSize(cc.size(btnNode.width, bgHeight));
    roomStatusItem.anchorX = 0.5;
    roomStatusItem.anchorY = 0.5; // 位置：相对于房间卡片居中对齐，显示在卡片顶部

    roomStatusItem.x = btnNode.x; // 水平居中

    roomStatusItem.y = btnNode.y + btnNode.height / 2 - bgHeight / 2 + 10; // 垂直位置：卡片顶部
    // 存储配置引用

    roomStatusItem.roomConfig = config;
    roomStatusItem.cardNode = btnNode; // ========== 1. 绘制唯一背景（Bg）==========
    // 删除了: OuterBg, InnerBg, CapsuleBg - 只保留一个Bg

    var bgNode = new cc.Node("Bg");
    var bgGraphics = bgNode.addComponent(cc.Graphics);
    bgGraphics.fillColor = bgColor;
    bgGraphics.roundRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, bgRadius);
    bgGraphics.fill();
    bgNode.parent = roomStatusItem; // ========== 2. 第一行文字：期号（PeriodLabel）==========

    var periodLabel = new cc.Node("PeriodLabel");
    var periodLabelComp = periodLabel.addComponent(cc.Label);
    periodLabelComp.string = "期号: --";
    periodLabelComp.fontSize = 16;
    periodLabelComp.lineHeight = 20;
    periodLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    periodLabelComp.verticalAlign = cc.Label.VerticalAlign.CENTER;
    periodLabelComp.enableBold = true; // 加粗

    periodLabel.color = cc.color(255, 255, 255); // 白色

    periodLabel.anchorX = 0.5;
    periodLabel.anchorY = 0.5;
    periodLabel.y = 14; // 上方位置（增加间距）

    periodLabel.parent = roomStatusItem; // 描边: #8A4200, 宽度2

    var periodOutline = periodLabel.addComponent(cc.LabelOutline);
    periodOutline.color = cc.color(138, 66, 0); // #8A4200

    periodOutline.width = 2; // ========== 3. 第二行文字：报名截止时间（TitleLabel）==========

    var titleLabel = new cc.Node("TitleLabel");
    var titleLabelComp = titleLabel.addComponent(cc.Label);
    titleLabelComp.string = "暂未开放";
    titleLabelComp.fontSize = 16;
    titleLabelComp.lineHeight = 20;
    titleLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    titleLabelComp.verticalAlign = cc.Label.VerticalAlign.CENTER;
    titleLabelComp.enableBold = true; // 加粗

    titleLabel.color = cc.color(255, 255, 255); // 白色

    titleLabel.anchorX = 0.5;
    titleLabel.anchorY = 0.5;
    titleLabel.y = -14; // 下方位置（增加间距）

    titleLabel.parent = roomStatusItem; // 描边: #8A4200, 宽度2

    var titleOutline = titleLabel.addComponent(cc.LabelOutline);
    titleOutline.color = cc.color(138, 66, 0); // #8A4200

    titleOutline.width = 2;
    roomStatusItem.parent = countdownContainer; // ============================================================
    // 创建报名按钮
    // ============================================================

    var signupBtn = new cc.Node("SignupBtn_" + config.id); // 添加 Sprite 组件用于显示按钮图片

    var sprite = signupBtn.addComponent(cc.Sprite);
    sprite.type = cc.Sprite.Type.SIMPLE;
    sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM; // 按钮尺寸：160x65

    var fixedWidth = 160; // 宽度

    var fixedHeight = 65; // 高度

    signupBtn.setContentSize(cc.size(fixedWidth, fixedHeight));
    signupBtn.anchorX = 0.5;
    signupBtn.anchorY = 0.5; // 位置：按钮在卡片底部，向下移动

    signupBtn.x = btnNode.x;
    signupBtn.y = btnNode.y - btnNode.height / 2 + fixedHeight / 2 - 10; // 向下移动10px
    // 存储配置信息和卡片节点引用

    signupBtn.roomConfig = config;
    signupBtn.roomId = config.id;
    signupBtn.cardNode = btnNode; // 添加按钮组件

    var button = signupBtn.addComponent(cc.Button);
    button.transition = cc.Button.Transition.SCALE;
    button.duration = 0.1;
    button.zoomScale = 1.08; // 点击事件

    (function (config, cardNode, signupBtnNode) {
      signupBtnNode.on(cc.Node.EventType.TOUCH_END, function (event) {
        event.stopPropagation();

        self._onArenaSignupButtonClick(config, cardNode, signupBtnNode);
      });
    })(config, btnNode, signupBtn);

    signupBtn.parent = buttonContainer;
  } // 扩展容器高度以容纳按钮


  var originalHeight = cardPanel.height;
  cardPanel.setContentSize(cardPanel.width, originalHeight + 70); // 加载按钮图片并更新状态

  this._loadSignupButtonImages(); // 启动倒计时更新定时器


  this._startCountdownTimer();
}, _cc$Class._loadSignupButtonImages = function _loadSignupButtonImages() {
  var self = this; // 预加载三张按钮图片

  var imagePaths = ['UI/button/btn_baoming', 'UI/button/btn_quxiaobaoming', 'UI/button/btn_no_baoming'];
  this._signupBtnFrames = {};
  var loadedCount = 0;

  for (var i = 0; i < imagePaths.length; i++) {
    (function (index) {
      cc.resources.load(imagePaths[index], cc.SpriteFrame, function (err, spriteFrame) {
        if (!err && spriteFrame) {
          var key = imagePaths[index].split('/').pop();
          self._signupBtnFrames[key] = spriteFrame;
        }

        loadedCount++; // 所有图片加载完成后更新按钮状态

        if (loadedCount === imagePaths.length) {
          self._updateArenaSignupStatus();
        }
      });
    })(i);
  }
}, _cc$Class._isInMatchTime = function _isInMatchTime(config) {
  var matchTimeRanges = config.match_time_ranges || config.matchTimeRanges;
  if (!matchTimeRanges) return true; // 没有配置时间段，默认开放
  // 解析时间段 JSON

  try {
    var ranges = typeof matchTimeRanges === 'string' ? JSON.parse(matchTimeRanges) : matchTimeRanges;
    if (!ranges || ranges.length === 0) return true;
    var now = new Date();
    var currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (var i = 0; i < ranges.length; i++) {
      var range = ranges[i];
      var startParts = range.start.split(':');
      var endParts = range.end.split(':');
      var startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      var endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

      if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        return true;
      }
    }

    return false;
  } catch (e) {
    console.error("🕐 [_isInMatchTime] parse error:", e);
    return true; // 解析失败，默认开放
  }
}, _cc$Class._canSignupArena = function _canSignupArena(config) {
  var matchTimeRanges = config.match_time_ranges || config.matchTimeRanges;
  var matchDuration = config.match_duration || config.matchDuration || config.interval_minutes || config.intervalMinutes; // 必须同时有开赛时间和每场时长才能报名

  if (!matchTimeRanges || !matchDuration) {
    return false;
  } // 检查是否在开赛时间段内


  var result = this._isInMatchTime(config);

  return result;
}, _cc$Class._getNextSignupDeadline = function _getNextSignupDeadline(config) {
  var matchTimeRanges = config.match_time_ranges || config.matchTimeRanges;
  var matchDuration = config.match_duration || config.matchDuration || config.interval_minutes || config.intervalMinutes; // 必须有配置

  if (!matchTimeRanges || !matchDuration) return null; // 检查是否在开赛时间段内

  if (!this._isInMatchTime(config)) return null;

  try {
    var ranges = typeof matchTimeRanges === 'string' ? JSON.parse(matchTimeRanges) : matchTimeRanges;
    if (!ranges || ranges.length === 0) return null;
    var now = new Date();
    var currentMinutes = now.getHours() * 60 + now.getMinutes(); // 找到当前所在的时间段

    var currentRange = null;
    var rangeStartMinutes = 0;

    for (var i = 0; i < ranges.length; i++) {
      var range = ranges[i];
      var startParts = range.start.split(':');
      var endParts = range.end.split(':');
      var startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      var endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

      if (currentMinutes >= startMin && currentMinutes <= endMin) {
        currentRange = range;
        rangeStartMinutes = startMin;
        break;
      }
    }

    if (!currentRange) return null; // 计算下一场比赛时间（从开赛时间开始，每隔 matchDuration 分钟一场）
    // 报名截止时间是比赛开始前1分钟

    var minutesSinceStart = currentMinutes - rangeStartMinutes;
    var remainder = minutesSinceStart % matchDuration;
    var nextMatchMinutes;

    if (remainder >= matchDuration - 1) {
      // 当前在报名截止时间内，下一场是下一个时间点
      nextMatchMinutes = currentMinutes + (matchDuration - remainder);
    } else {
      // 当前可以报名，下一场是当前时间点向上取整
      nextMatchMinutes = rangeStartMinutes + Math.ceil(minutesSinceStart / matchDuration) * matchDuration;

      if (nextMatchMinutes <= currentMinutes) {
        nextMatchMinutes += matchDuration;
      }
    } // 报名截止时间是比赛开始前1分钟


    var deadlineMinutes = nextMatchMinutes - 1; // 格式化时间

    var hours = Math.floor(deadlineMinutes / 60) % 24;
    var mins = deadlineMinutes % 60;
    var timeStr = (hours < 10 ? '0' : '') + hours + ':' + (mins < 10 ? '0' : '') + mins;
    return timeStr;
  } catch (e) {
    console.error("⏰ [_getNextSignupDeadline] error:", e);
    return null;
  }
}, _cc$Class._getSignupCountdownSeconds = function _getSignupCountdownSeconds(config) {
  var matchTimeRanges = config.match_time_ranges || config.matchTimeRanges;
  var matchDuration = config.match_duration || config.matchDuration || config.interval_minutes || config.intervalMinutes;
  if (!matchTimeRanges || !matchDuration) return -1;
  if (!this._isInMatchTime(config)) return -1;

  try {
    var ranges = typeof matchTimeRanges === 'string' ? JSON.parse(matchTimeRanges) : matchTimeRanges;
    if (!ranges || ranges.length === 0) return -1;
    var now = new Date();
    var currentMinutes = now.getHours() * 60 + now.getMinutes();
    var currentSeconds = now.getSeconds();
    var currentTotalSeconds = currentMinutes * 60 + currentSeconds; // 找到当前所在的时间段

    var currentRange = null;
    var rangeStartMinutes = 0;

    for (var i = 0; i < ranges.length; i++) {
      var range = ranges[i];
      var startParts = range.start.split(':');
      var endParts = range.end.split(':');
      var startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      var endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

      if (currentMinutes >= startMin && currentMinutes <= endMin) {
        currentRange = range;
        rangeStartMinutes = startMin;
        break;
      }
    }

    if (!currentRange) return -1; // 计算下一场比赛时间

    var rangeStartSeconds = rangeStartMinutes * 60;
    var matchDurationSeconds = matchDuration * 60;
    var currentTotalSeconds = currentMinutes * 60 + currentSeconds; // 计算从开赛时间到现在经过的秒数

    var elapsedSeconds = currentTotalSeconds - rangeStartSeconds;
    var remainder = elapsedSeconds % matchDurationSeconds; // 倒计时 = 本期剩余时间（与服务端一致，不减60秒）

    var countdown = matchDurationSeconds - remainder; // 返回倒计时

    return countdown;
  } catch (e) {
    console.error("⏰ [_getSignupCountdownSeconds] error:", e);
    return -1;
  }
}, _cc$Class._getNearestMatchTimeRange = function _getNearestMatchTimeRange(config) {
  var matchTimeRanges = config.match_time_ranges || config.matchTimeRanges; // 没有配置时间段，返回null表示全天开放

  if (!matchTimeRanges) {
    return null;
  }

  try {
    var ranges = typeof matchTimeRanges === 'string' ? JSON.parse(matchTimeRanges) : matchTimeRanges;
    if (!ranges || ranges.length === 0) return null;
    var now = new Date();
    var currentMinutes = now.getHours() * 60 + now.getMinutes();
    var currentSeconds = now.getSeconds(); // 解析所有时间段

    var parsedRanges = [];

    for (var i = 0; i < ranges.length; i++) {
      var range = ranges[i];
      var startParts = range.start.split(':');
      var endParts = range.end.split(':');
      var startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      var endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
      parsedRanges.push({
        start: range.start,
        end: range.end,
        startMinutes: startMinutes,
        endMinutes: endMinutes
      });
    } // 检查当前是否在某个时间段内


    for (var i = 0; i < parsedRanges.length; i++) {
      var r = parsedRanges[i];

      if (currentMinutes >= r.startMinutes && currentMinutes <= r.endMinutes) {
        return {
          inRange: true,
          range: r
        };
      }
    } // 不在任何时间段内，找最近的下一个时间段


    var nearestRange = null;
    var minDiff = Infinity;

    for (var i = 0; i < parsedRanges.length; i++) {
      var r = parsedRanges[i]; // 计算距离这个时间段开始的分钟数

      var diff;

      if (r.startMinutes > currentMinutes) {
        // 今天还没到
        diff = r.startMinutes - currentMinutes;
      } else {
        // 需要等到明天
        diff = 24 * 60 - currentMinutes + r.startMinutes;
      }

      if (diff < minDiff) {
        minDiff = diff;
        nearestRange = r;
      }
    }

    return {
      inRange: false,
      range: nearestRange,
      minutesUntilStart: minDiff
    };
  } catch (e) {
    return null;
  }
}, _cc$Class._getNextMatchCountdown = function _getNextMatchCountdown(config) {
  var matchTimeRanges = config.match_time_ranges || config.matchTimeRanges;
  var matchDuration = config.match_duration || config.matchDuration || config.interval_minutes || config.intervalMinutes || 10; // 默认10分钟

  var now = new Date();
  var currentMinutes = now.getHours() * 60 + now.getMinutes();
  var currentSeconds = now.getSeconds();
  var currentTotalSeconds = currentMinutes * 60 + currentSeconds; // 没有配置开赛时间，每 matchDuration 分钟开赛一次

  if (!matchTimeRanges) {
    // 计算距离下一个 matchDuration 周期的秒数
    var intervalSeconds = matchDuration * 60;
    var secondsInCycle = currentTotalSeconds % intervalSeconds;
    var remainingSeconds = intervalSeconds - secondsInCycle;
    return {
      inMatchTime: true,
      seconds: remainingSeconds,
      matchDuration: matchDuration
    };
  } // 有配置开赛时间


  try {
    var ranges = typeof matchTimeRanges === 'string' ? JSON.parse(matchTimeRanges) : matchTimeRanges;

    if (!ranges || ranges.length === 0) {
      // 解析失败，使用默认逻辑
      var intervalSeconds = matchDuration * 60;
      var secondsInCycle = currentTotalSeconds % intervalSeconds;
      var remainingSeconds = intervalSeconds - secondsInCycle;
      return {
        inMatchTime: true,
        seconds: remainingSeconds,
        matchDuration: matchDuration
      };
    } // 检查当前是否在某个开赛时间段内


    for (var i = 0; i < ranges.length; i++) {
      var range = ranges[i];
      var startParts = range.start.split(':');
      var endParts = range.end.split(':');
      var startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      var endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

      if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        // 在开赛时间段内，计算距离下一场的倒计时
        var rangeStartSeconds = startMinutes * 60;
        var elapsedSeconds = currentTotalSeconds - rangeStartSeconds;
        var intervalSeconds = matchDuration * 60;
        var remainder = elapsedSeconds % intervalSeconds;
        var remainingSeconds = intervalSeconds - remainder;
        return {
          inMatchTime: true,
          seconds: remainingSeconds,
          matchDuration: matchDuration,
          currentRange: range
        };
      }
    } // 不在任何开赛时间段内


    return {
      inMatchTime: false,
      seconds: 0,
      matchDuration: matchDuration
    };
  } catch (e) {
    return {
      inMatchTime: false,
      seconds: 0,
      matchDuration: matchDuration
    };
  }
}, _cc$Class._formatCountdown = function _formatCountdown(totalSeconds) {
  var minutes = Math.floor(totalSeconds / 60);
  var seconds = Math.floor(totalSeconds % 60);
  return (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}, _cc$Class._formatMatchTimeRange = function _formatMatchTimeRange(range) {
  if (!range) return '';
  return range.start + '-' + range.end;
}, _cc$Class._getCurrentPeriodNo = function _getCurrentPeriodNo(config) {
  var matchTimeRanges = config.match_time_ranges || config.matchTimeRanges;
  var matchDuration = config.match_duration || config.matchDuration || config.interval_minutes || config.intervalMinutes || 5;

  if (!matchTimeRanges || !matchDuration) {
    return 0;
  }

  try {
    var ranges = typeof matchTimeRanges === 'string' ? JSON.parse(matchTimeRanges) : matchTimeRanges;
    if (!ranges || ranges.length === 0) return 0;
    var now = new Date();
    var currentMinutes = now.getHours() * 60 + now.getMinutes();
    var currentSeconds = now.getSeconds();
    var currentTotalSeconds = currentMinutes * 60 + currentSeconds; // 找到当前所在的时间段

    var currentRange = null;
    var rangeStartMinutes = 0;

    for (var i = 0; i < ranges.length; i++) {
      var range = ranges[i];
      var startParts = range.start.split(':');
      var endParts = range.end.split(':');
      var startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      var endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

      if (currentMinutes >= startMin && currentMinutes <= endMin) {
        currentRange = range;
        rangeStartMinutes = startMin;
        break;
      }
    }

    if (!currentRange) return 0; // 计算从开赛时间到现在经过的秒数（与服务端一致）

    var rangeStartSeconds = rangeStartMinutes * 60;
    var elapsedSeconds = currentTotalSeconds - rangeStartSeconds;
    var matchDurationSeconds = matchDuration * 60; // 计算当前是第几期（从1开始，与服务端一致）

    var periodNo = Math.floor(elapsedSeconds / matchDurationSeconds) + 1;
    return periodNo;
  } catch (e) {
    return 0;
  }
}, _cc$Class._onArenaSignupButtonClick = function _onArenaSignupButtonClick(roomConfig, btnNode, signupBtnNode) {
  var self = this;
  var myglobal = window.myglobal;
  var playerArenaCoin = myglobal && myglobal.playerData ? myglobal.playerData.arena_coin : 0;
  var roomId = roomConfig.id; // 检查是否已报名

  if (window.arenaData && window.arenaData.isSignedUp(roomId)) {
    // 已报名，执行取消报名
    this._doCancelSignup(roomConfig, btnNode, signupBtnNode);

    return;
  } // 检查是否可以报名（有开赛时间且有每场时长）


  if (!this._canSignupArena(roomConfig)) {
    var matchTimeRanges = roomConfig.match_time_ranges || roomConfig.matchTimeRanges;
    var matchDuration = roomConfig.match_duration || roomConfig.matchDuration || roomConfig.interval_minutes || roomConfig.intervalMinutes;

    if (!matchTimeRanges && !matchDuration) {
      this._showMessage("该房间暂未配置开赛时间");
    } else if (matchTimeRanges && !matchDuration) {
      this._showMessage("该房间暂未配置每场时长");
    } else if (!this._isInMatchTime(roomConfig)) {
      this._showMessage("当前不在开赛时间段，无法报名");
    } else {
      this._showMessage("暂不可报名");
    }

    return;
  } // 检查是否已报名其他竞技场


  if (this._hasSignedUpOtherArena(roomId)) {
    this._showMessage("您已报名其他竞技场，每场只能报名一个级别");

    return;
  } // 获取报名费


  var signupFee = roomConfig.min_arena_coin || roomConfig.minArenaCoin || 0; // 检查竞技币是否足够

  if (playerArenaCoin < signupFee) {
    this._showMessage("竞技币不足，需要 " + signupFee + " 竞技币");

    return;
  } // 执行报名


  this._doArenaSignup(roomConfig, btnNode, signupBtnNode);
}, _cc$Class._doCancelSignup = function _doCancelSignup(roomConfig, btnNode, signupBtnNode) {
  var self = this;

  this._showMessage("正在取消报名...");

  if (window.arenaData) {
    window.arenaData.cancelSignup(roomConfig.id, function (err, result) {
      if (err) {
        self._showMessage(err || "取消报名失败");

        return;
      }

      self._showMessage("取消报名成功，竞技币已返还"); // 刷新玩家余额


      if (window.arenaData.refreshBalance) {
        window.arenaData.refreshBalance();
      } // 更新UI


      self._updateArenaSignupStatus();
    });
  }
}, _cc$Class._startCountdownTimer = function _startCountdownTimer() {
  var self = this; // 清理旧的定时器

  if (this._countdownTimer) {
    clearInterval(this._countdownTimer);
  } // 🔧【新增】初始化本地倒计时状态缓存
  // 格式: { roomId: { periodNo, countdown, canSignup, lastUpdate } }


  this._localArenaStatus = {}; // 监听服务端推送的竞技场状态
  // 🔧【修复】使用 myglobal.socket 实例，而不是 window.socketCtr 函数

  var socket = window.myglobal && window.myglobal.socket;

  if (socket && socket.onArenaStatus) {
    socket.onArenaStatus(function (data) {
      if (self.node && self.node.isValid && data && data.arenas) {
        // 🔧【修改】收到服务端推送时，保存到本地状态
        self._onArenaStatusPush(data.arenas);
      }
    });
  } else {
    console.warn("🏟️ [Arena] socket 或 onArenaStatus 方法不可用，无法监听竞技场状态");
  } // 🔧【新增】监听竞技场比赛开始通知


  if (socket && socket.onArenaMatchStart) {
    socket.onArenaMatchStart(function (data) {
      if (self.node && self.node.isValid) {
        self._onArenaMatchStart(data);
      }
    });
  } // 🔧【新增】监听竞技场关闭弹窗通知（新期号开始时关闭上一轮弹窗）


  if (socket && socket.onArenaCloseDialog) {
    socket.onArenaCloseDialog(function (data) {
      if (self.node && self.node.isValid) {
        self._onArenaCloseDialog(data);
      }
    });
  } // 🔧【新增】立即初始化本地状态（使用本地计算作为初始值）


  this._initLocalArenaStatusFromConfig(); // 🔧【修改】每秒更新本地倒计时（减1）


  this._countdownTimer = setInterval(function () {
    if (self.node && self.node.isValid) {
      self._updateLocalCountdown();
    }
  }, 1000);
}, _cc$Class._onArenaMatchStart = function _onArenaMatchStart(data) {
  var self = this; // 🔧【修复】先关闭之前可能存在的弹窗

  this._closeArenaMatchStartDialog(); // 保存比赛信息供后续使用


  this._currentMatchData = data; // 弹出进入游戏弹窗

  this._showArenaMatchStartDialog(data);
}, _cc$Class._closeArenaMatchStartDialog = function _closeArenaMatchStartDialog() {
  // 关闭并销毁之前显示的弹窗
  if (this._arenaMatchStartDialog && this._arenaMatchStartDialog.isValid) {
    this._arenaMatchStartDialog.destroy();

    this._arenaMatchStartDialog = null;
  } // 清除当前比赛数据


  this._currentMatchData = null;
}, _cc$Class._onArenaCloseDialog = function _onArenaCloseDialog(data) {
  console.log("🏟️ [Arena] 收到关闭弹窗通知:", JSON.stringify(data)); // 检查是否与当前弹窗匹配

  if (this._arenaMatchStartDialog && this._arenaMatchStartDialog.isValid) {
    // 如果指定了房间ID，检查是否匹配
    if (data.room_id && this._arenaMatchStartDialogRoomId) {
      if (data.room_id === this._arenaMatchStartDialogRoomId) {
        console.log("🏟️ [Arena] 关闭匹配的弹窗，room_id:", data.room_id);

        this._closeArenaMatchStartDialog();
      }
    } else {
      // 没有指定房间ID，关闭所有弹窗
      console.log("🏟️ [Arena] 关闭所有竞技场弹窗");

      this._closeArenaMatchStartDialog();
    }
  }
}, _cc$Class._showArenaMatchStartDialog = function _showArenaMatchStartDialog(data) {
  var self = this; // 获取画布尺寸

  var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
  var screenHeight = canvas ? canvas.designResolution.height : 720;
  var screenWidth = canvas ? canvas.designResolution.width : 1280; // 创建弹窗容器

  var dialogNode = new cc.Node("ArenaMatchStartDialog");
  dialogNode.setContentSize(cc.size(screenWidth, screenHeight));
  dialogNode.anchorX = 0.5;
  dialogNode.anchorY = 0.5;
  dialogNode.x = 0;
  dialogNode.y = 0;
  dialogNode.zIndex = 5000;
  dialogNode.parent = this.node; // 🔧【修复】保存弹窗引用，用于后续关闭

  this._arenaMatchStartDialog = dialogNode;
  this._arenaMatchStartDialogRoomId = data.room_id; // 保存对应的房间ID

  this._arenaMatchStartDialogPeriodNo = data.period_no; // 保存对应的期号
  // 半透明黑色背景

  var bgNode = new cc.Node("Bg");
  bgNode.setContentSize(cc.size(screenWidth, screenHeight));
  var bgGraphics = bgNode.addComponent(cc.Graphics);
  bgGraphics.fillColor = cc.color(0, 0, 0, 180);
  bgGraphics.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
  bgGraphics.fill();
  bgNode.parent = dialogNode; // 弹窗卡片

  var cardWidth = 450;
  var cardHeight = 380;
  var cardNode = new cc.Node("Card");
  cardNode.setContentSize(cc.size(cardWidth, cardHeight));
  var cardGraphics = cardNode.addComponent(cc.Graphics);
  cardGraphics.fillColor = cc.color(40, 45, 65, 255);
  cardGraphics.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 15);
  cardGraphics.fill();
  cardGraphics.strokeColor = cc.color(255, 215, 0);
  cardGraphics.lineWidth = 3;
  cardGraphics.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 15);
  cardGraphics.stroke();
  cardNode.parent = dialogNode; // 标题

  var titleNode = new cc.Node("Title");
  titleNode.y = cardHeight / 2 - 45;
  var titleLabel = titleNode.addComponent(cc.Label);
  titleLabel.string = "🏆 竞技场比赛开始";
  titleLabel.fontSize = 32;
  titleLabel.lineHeight = 40;
  titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  titleNode.color = cc.color(255, 215, 0);
  var titleOutline = titleNode.addComponent(cc.LabelOutline);
  titleOutline.color = cc.color(100, 80, 0);
  titleOutline.width = 2;
  titleNode.parent = cardNode; // 期号信息

  var periodNode = new cc.Node("Period");
  periodNode.y = cardHeight / 2 - 95;
  var periodLabel = periodNode.addComponent(cc.Label);
  periodLabel.string = "期号: " + (data.period_no || "--");
  periodLabel.fontSize = 22;
  periodLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  periodNode.color = cc.color(200, 200, 220);
  periodNode.parent = cardNode; // 房间信息

  var roomNode = new cc.Node("Room");
  roomNode.y = cardHeight / 2 - 130;
  var roomLabel = roomNode.addComponent(cc.Label);
  roomLabel.string = "房间: " + (data.room_name || "未知房间");
  roomLabel.fontSize = 20;
  roomLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  roomNode.color = cc.color(180, 180, 200);
  roomNode.parent = cardNode; // 参赛人数

  var playersNode = new cc.Node("Players");
  playersNode.y = cardHeight / 2 - 165;
  var playersLabel = playersNode.addComponent(cc.Label);
  playersLabel.string = "参赛人数: " + (data.total_players || 0) + " 人";
  playersLabel.fontSize = 20;
  playersLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  playersNode.color = cc.color(100, 200, 100);
  playersNode.parent = cardNode; // 提示消息

  var msgNode = new cc.Node("Message");
  msgNode.y = cardHeight / 2 - 240;
  var msgLabel = msgNode.addComponent(cc.Label);
  msgLabel.string = data.message || "比赛即将开始，请准备进入游戏！";
  msgLabel.fontSize = 16;
  msgLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  msgNode.color = cc.color(255, 200, 100);
  msgNode.parent = cardNode; // 按钮区域

  var btnY = -cardHeight / 2 + 55; // ========== 进入游戏按钮 ==========

  var enterBtn = new cc.Node("EnterBtn");
  enterBtn.setContentSize(cc.size(180, 50));
  enterBtn.setPosition(-100, btnY);
  enterBtn.anchorX = 0.5;
  enterBtn.anchorY = 0.5; // 绘制按钮背景

  var enterBg = enterBtn.addComponent(cc.Graphics);
  enterBg.fillColor = cc.color(76, 175, 80); // 绿色

  enterBg.roundRect(-90, -25, 180, 50, 8);
  enterBg.fill(); // 创建文字子节点

  var enterLabelNode = new cc.Node("Label");
  enterLabelNode.anchorX = 0.5;
  enterLabelNode.anchorY = 0.5;
  var enterBtnLabel = enterLabelNode.addComponent(cc.Label);
  enterBtnLabel.string = "进入比赛";
  enterBtnLabel.fontSize = 22;
  enterBtnLabel.lineHeight = 28;
  enterBtnLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  enterLabelNode.color = cc.color(255, 255, 255);
  enterLabelNode.parent = enterBtn; // 添加 Button 组件提供交互反馈

  var enterButtonComp = enterBtn.addComponent(cc.Button);
  enterButtonComp.transition = cc.Button.Transition.SCALE;
  enterButtonComp.duration = 0.1;
  enterButtonComp.zoomScale = 1.1;
  enterBtn.parent = cardNode; // 添加点击事件

  enterBtn.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation(); // 清除弹窗引用后再销毁

    self._arenaMatchStartDialog = null;
    self._arenaMatchStartDialogRoomId = null;
    self._arenaMatchStartDialogPeriodNo = null;
    dialogNode.destroy();

    self._enterArenaMatch(data);
  }); // ========== 取消按钮 ==========

  var cancelBtn = new cc.Node("CancelBtn");
  cancelBtn.setContentSize(cc.size(120, 50));
  cancelBtn.setPosition(100, btnY); // 修正位置，两按钮间距合理

  cancelBtn.anchorX = 0.5;
  cancelBtn.anchorY = 0.5; // 绘制按钮背景

  var cancelBg = cancelBtn.addComponent(cc.Graphics);
  cancelBg.fillColor = cc.color(180, 80, 80); // 红色

  cancelBg.roundRect(-60, -25, 120, 50, 8);
  cancelBg.fill(); // 创建文字子节点

  var cancelLabelNode = new cc.Node("Label");
  cancelLabelNode.anchorX = 0.5;
  cancelLabelNode.anchorY = 0.5;
  var cancelBtnLabel = cancelLabelNode.addComponent(cc.Label);
  cancelBtnLabel.string = "取消";
  cancelBtnLabel.fontSize = 20;
  cancelBtnLabel.lineHeight = 26;
  cancelBtnLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  cancelLabelNode.color = cc.color(255, 255, 255);
  cancelLabelNode.parent = cancelBtn; // 添加 Button 组件提供交互反馈

  var cancelButtonComp = cancelBtn.addComponent(cc.Button);
  cancelButtonComp.transition = cc.Button.Transition.SCALE;
  cancelButtonComp.duration = 0.1;
  cancelButtonComp.zoomScale = 1.1;
  cancelBtn.parent = cardNode; // 添加点击事件

  cancelBtn.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation(); // 取消按钮：取消报名并退还竞技币

    self._cancelArenaSignup(data); // 清除弹窗引用后再销毁


    self._arenaMatchStartDialog = null;
    self._arenaMatchStartDialogRoomId = null;
    self._arenaMatchStartDialogPeriodNo = null;
    dialogNode.destroy();
  });
}, _cc$Class._cancelArenaSignup = function _cancelArenaSignup(data) {
  var self = this;
  var myglobal = window.myglobal;
  console.log("🏟️ [Arena] 取消报名，退还竞技币，room_id:", data.room_id); // 发送取消报名请求到服务端

  var socket = myglobal && myglobal.socket;

  if (socket && socket.sendArenaCancelSignup) {
    socket.sendArenaCancelSignup({
      room_id: data.room_id
    });
  } // 清除本地报名状态


  if (window.arenaData && window.arenaData._signedUpArenas) {
    delete window.arenaData._signedUpArenas[data.room_id];
    window.arenaData.saveToLocal && window.arenaData.saveToLocal();
  } // 清除当前比赛数据


  this._currentMatchData = null;
}, _cc$Class._enterArenaMatch = function _enterArenaMatch(data) {
  var self = this;
  var myglobal = window.myglobal;
  console.log("🏟️ [Arena] 进入竞技场比赛，data:", JSON.stringify(data)); // 保存比赛信息

  if (myglobal) {
    myglobal.currentArenaMatch = data;
  } // 清除报名状态


  if (window.arenaData && window.arenaData._signedUpArenas) {
    delete window.arenaData._signedUpArenas[data.room_id];
    window.arenaData.saveToLocal && window.arenaData.saveToLocal();
  } // 🔧【关键修复】发送 arena_enter 请求，等待 room_joined 消息后再进入游戏场景


  var socket = myglobal && myglobal.socket;

  if (socket && socket.sendArenaEnter) {
    // 显示加载提示
    this._showMessageCenter("正在进入竞技场..."); // 注册一次性 room_joined 监听器


    var roomJoinedHandler = function roomJoinedHandler(roomData) {
      console.log("🏟️ [Arena] 收到 room_joined，准备进入游戏场景:", JSON.stringify(roomData)); // 取消超时定时器

      if (self._arenaEnterTimeout) {
        clearTimeout(self._arenaEnterTimeout);
        self._arenaEnterTimeout = null;
      } // 🔧【关键修复】转换数据格式：players → playerdata
      // 游戏场景期望的数据格式与普通场一致


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
            // 🔧【修复】使用实际头像URL
            gold_count: p.gold_count || 0,
            goldcount: p.gold_count || 0,
            seatindex: (p.seat !== undefined ? p.seat : idx) + 1,
            isready: p.ready || false,
            arena_gold: p.arena_gold || 0,
            // 🔧【修复】添加竞技场金币
            match_coin: p.match_coin || 0,
            // 兼容字段
            period_no: p.period_no || "" // 期号

          };
        }),
        housemanageid: roomData.creator_id || "",
        creator_id: roomData.creator_id || "",
        room_category: 2,
        // 竞技场
        period_no: data.period_no
      };
      console.log("🏟️ [Arena] 转换后的房间数据:", JSON.stringify(convertedRoomData)); // 保存转换后的房间数据

      if (myglobal) {
        myglobal.roomData = convertedRoomData;
      } // 进入游戏场景


      self._enterGameScene(convertedRoomData);
    }; // 注册监听器


    socket.onRoomJoined(roomJoinedHandler); // 设置超时（10秒后如果没收到 room_joined，也进入场景）

    this._arenaEnterTimeout = setTimeout(function () {
      console.log("🏟️ [Arena] 等待 room_joined 超时，直接进入游戏场景");
      self._arenaEnterTimeout = null; // 构造临时房间数据

      var tempRoomData = {
        room_code: "arena_" + data.period_no,
        room_id: data.room_id,
        room_name: data.room_name,
        room_category: 2,
        period_no: data.period_no
      };

      if (myglobal) {
        myglobal.roomData = tempRoomData;
      }

      self._enterGameScene(tempRoomData);
    }, 10000); // 发送 arena_enter 请求

    socket.sendArenaEnter({
      period_no: data.period_no,
      room_id: data.room_id
    });
  } else {
    console.warn("🏟️ [Arena] socket 或 sendArenaEnter 方法不可用"); // 降级处理：直接进入游戏场景

    var roomConfig = {
      id: data.room_id,
      room_name: data.room_name,
      room_config_id: data.room_config_id,
      room_category: 2,
      min_arena_coin: data.signup_fee,
      match_rounds: data.match_rounds,
      match_duration: data.match_duration
    };

    if (myglobal) {
      myglobal.currentRoomConfig = roomConfig;
      myglobal.currentRoomLevel = data.room_id;
      myglobal.currentRoomName = data.room_name;
    }

    this._enterArenaGameScene(data, roomConfig);
  }
}, _cc$Class._enterArenaGameScene = function _enterArenaGameScene(matchData, roomConfig) {
  var self = this;
  var myglobal = window.myglobal; // 显示简短加载提示

  this._showMessageCenter("正在进入竞技场..."); // 构造房间数据


  var roomData = {
    room_code: matchData.room_code || "arena_" + matchData.period_no,
    room_id: matchData.room_id,
    room_name: matchData.room_name,
    room_category: 2,
    // 竞技场
    base_score: roomConfig.base_score || 1,
    multiplier: roomConfig.multiplier || 1,
    period_no: matchData.period_no,
    match_rounds: matchData.match_rounds
  }; // 保存房间数据

  if (myglobal) {
    myglobal.roomData = roomData;
    myglobal.playerData = myglobal.playerData || {};
    myglobal.playerData.bottom = roomConfig.base_score || 1;
    myglobal.playerData.rate = roomConfig.multiplier || 1;
  } // 🔧【关键】最多等待2秒后直接进入游戏场景


  var enterDelay = 500; // 默认等待500ms
  // 如果有等待数据，可以适当延长

  if (matchData.wait_time && matchData.wait_time > 0) {
    enterDelay = Math.min(matchData.wait_time * 1000, 2000); // 最多2秒
  }

  console.log("🏟️ [Arena] 将在 " + enterDelay + "ms 后进入游戏场景"); // 设置定时器，延迟进入游戏场景

  this._arenaEnterTimer = setTimeout(function () {
    self._arenaEnterTimer = null;
    console.log("🏟️ [Arena] 进入游戏场景");

    self._enterGameScene(roomData);
  }, enterDelay);
}, _cc$Class._initLocalArenaStatusFromConfig = function _initLocalArenaStatusFromConfig() {
  if (!this._arenaRooms) return;
  var now = Date.now();

  for (var i = 0; i < this._arenaRooms.length; i++) {
    var room = this._arenaRooms[i];
    var config = room.config;
    var roomId = config.id; // 如果已经有服务端推送的数据，跳过

    if (this._localArenaStatus[roomId]) continue; // 使用本地计算作为初始值

    var phaseInfo = this._calculatePhaseInfo(config);

    this._localArenaStatus[roomId] = {
      periodNo: phaseInfo.periodNo,
      periodNoStr: phaseInfo.periodNoStr,
      // 新增：字符串格式期号
      phase: phaseInfo.phase,
      countdown: phaseInfo.countdown,
      canSignup: phaseInfo.canSignup,
      totalPlayers: 0,
      // 🔧【修复】初始化报名人数为0
      statusText: "",
      lastUpdate: now,
      isLocalCalculated: true // 标记为本地计算

    };
  } // 更新显示


  this._updateCountdownFromLocalCache();
}, _cc$Class._onArenaStatusPush = function _onArenaStatusPush(arenas) {
  if (!arenas) return;
  var now = Date.now(); // 🔧 调试：打印收到的完整数据
  // 更新本地状态缓存

  for (var i = 0; i < arenas.length; i++) {
    var arena = arenas[i];
    var roomId = arena.room_id;
    var newPeriodNoStr = arena.period_no_str || arena.periodNoStr || ""; // 🔧 调试：打印每个竞技场的 total_players
    // 🔧【新增】检查期号是否变化，如果变化则清除用户报名状态

    var oldStatus = this._localArenaStatus[roomId];

    if (oldStatus && oldStatus.periodNoStr && newPeriodNoStr && oldStatus.periodNoStr !== newPeriodNoStr) {
      // 🔧【修复】不在期号变化时关闭弹窗
      // 弹窗应该只在以下情况关闭：
      // 1. 玩家点击"进入"或"取消"按钮
      // 2. 服务端发送 arena_close_dialog 消息（进入阶段倒计时结束）
      // 3. 玩家手动关闭弹窗
      // 清除用户在该房间的报名状态
      if (window.arenaData && window.arenaData._signedUpArenas && window.arenaData._signedUpArenas[roomId]) {
        var oldPeriodNo = window.arenaData._signedUpArenas[roomId].periodNo;
        delete window.arenaData._signedUpArenas[roomId];
        window.arenaData.saveToLocal && window.arenaData.saveToLocal();
      }
    } // 保存服务端推送的状态（支持新字段）


    this._localArenaStatus[roomId] = {
      periodNo: arena.period_no,
      periodNoStr: newPeriodNoStr,
      phase: arena.phase || 0,
      countdown: arena.countdown,
      canSignup: arena.can_signup,
      totalPlayers: arena.total_players || arena.totalPlayers || 0,
      statusText: arena.status_text || arena.statusText || "",
      lastUpdate: now,
      isLocalCalculated: false // 服务端推送

    };
  } // 立即更新显示


  this._updateCountdownFromLocalCache();
}, _cc$Class._updateLocalCountdown = function _updateLocalCountdown() {
  if (!this._localArenaStatus) return;
  var now = Date.now();
  var needUpdate = false; // 遍历所有竞技场，每秒减1

  for (var roomId in this._localArenaStatus) {
    var status = this._localArenaStatus[roomId]; // 🔧【新增】容错机制：如果超过35秒没收到服务端推送，使用本地计算校准

    var timeSinceLastUpdate = (now - status.lastUpdate) / 1000;

    if (timeSinceLastUpdate > 35) {
      // 找到对应的配置
      var config = this._getArenaConfigByRoomId(parseInt(roomId));

      if (config) {
        var phaseInfo = this._calculatePhaseInfo(config); // 🔧【修复】检查期号是否变化，如果变化则重置报名人数和用户报名状态


        if (status.periodNoStr !== phaseInfo.periodNoStr && phaseInfo.periodNoStr !== "") {
          status.totalPlayers = 0; // 期号变化，重置报名人数
          // 🔧【修复】不在期号变化时关闭弹窗
          // 弹窗应该只在进入阶段倒计时结束后由服务端的 arena_close_dialog 消息关闭
          // 🔧【新增】清除用户在该房间的报名状态

          if (window.arenaData && window.arenaData._signedUpArenas && window.arenaData._signedUpArenas[roomId]) {
            var oldPeriodNo = window.arenaData._signedUpArenas[roomId].periodNo;
            delete window.arenaData._signedUpArenas[roomId];
            window.arenaData.saveToLocal && window.arenaData.saveToLocal();
          }
        }

        status.phase = phaseInfo.phase;
        status.countdown = phaseInfo.countdown;
        status.canSignup = phaseInfo.canSignup;
        status.periodNo = phaseInfo.periodNo;
        status.periodNoStr = phaseInfo.periodNoStr;
        status.isLocalCalculated = true;
        needUpdate = true;
      }

      continue;
    } // 只对有倒计时的减1


    if (status.countdown > 0) {
      status.countdown--;
      needUpdate = true; // 如果倒计时刚刚变为0，立即使用本地计算切换阶段

      if (status.countdown === 0) {
        var config = this._getArenaConfigByRoomId(parseInt(roomId));

        if (config) {
          var phaseInfo = this._calculatePhaseInfo(config); // 🔧【修复】检查期号是否变化，如果变化则重置报名人数和用户报名状态


          if (status.periodNoStr !== phaseInfo.periodNoStr && phaseInfo.periodNoStr !== "") {
            status.totalPlayers = 0; // 期号变化，重置报名人数
            // 🔧【修复】不在期号变化时关闭弹窗
            // 弹窗应该只在进入阶段倒计时结束后由服务端的 arena_close_dialog 消息关闭
            // 🔧【新增】清除用户在该房间的报名状态

            if (window.arenaData && window.arenaData._signedUpArenas && window.arenaData._signedUpArenas[roomId]) {
              var oldPeriodNo = window.arenaData._signedUpArenas[roomId].periodNo;
              delete window.arenaData._signedUpArenas[roomId];
              window.arenaData.saveToLocal && window.arenaData.saveToLocal();
            }
          }

          status.phase = phaseInfo.phase;
          status.countdown = phaseInfo.countdown;
          status.canSignup = phaseInfo.canSignup;
          status.periodNo = phaseInfo.periodNo;
          status.periodNoStr = phaseInfo.periodNoStr;
        }
      }
    }
  } // 如果有变化，更新显示


  if (needUpdate) {
    this._updateCountdownFromLocalCache();
  }
}, _cc$Class._calculatePhaseInfo = function _calculatePhaseInfo(config) {
  var result = {
    phase: 0,
    countdown: -1,
    canSignup: false,
    periodNo: 0,
    periodNoStr: "" // 新增：字符串格式期号

  };
  var matchTimeRanges = config.match_time_ranges || config.matchTimeRanges;
  var matchDuration = config.match_duration || config.matchDuration || config.interval_minutes || config.intervalMinutes || 5;
  var roomType = config.room_type || config.roomType || 0;

  if (!matchTimeRanges || !matchDuration) {
    return result;
  }

  try {
    var ranges = typeof matchTimeRanges === 'string' ? JSON.parse(matchTimeRanges) : matchTimeRanges;

    if (!ranges || ranges.length === 0) {
      return result;
    }

    var now = new Date();
    var currentMinutes = now.getHours() * 60 + now.getMinutes();
    var currentSeconds = now.getSeconds();
    var currentTotalSeconds = currentMinutes * 60 + currentSeconds; // 找到当前所在的时间段

    var currentRange = null;
    var rangeStartMinutes = 0;

    for (var i = 0; i < ranges.length; i++) {
      var range = ranges[i];
      var startParts = range.start.split(':');
      var endParts = range.end.split(':');
      var startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      var endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

      if (currentMinutes >= startMin && currentMinutes <= endMin) {
        currentRange = range;
        rangeStartMinutes = startMin;
        break;
      }
    }

    if (!currentRange) {
      return result;
    } // 计算从开赛时间到现在经过的秒数


    var rangeStartSeconds = rangeStartMinutes * 60;
    var elapsedSeconds = currentTotalSeconds - rangeStartSeconds; // 🔧【修复】使用配置的 matchDuration（分钟），与服务端保持一致
    // 服务端已修改为使用 matchDuration 配置，客户端也必须一致
    // 每期总时长（秒）= matchDuration（分钟）* 60

    var periodTotalSeconds = matchDuration * 60; // 准备阶段：固定60秒（1分钟）

    var prepareSeconds = 60; // 计算当前期号

    var periodNo = Math.floor(elapsedSeconds / periodTotalSeconds) + 1; // 计算本期内经过的秒数

    var periodElapsed = elapsedSeconds % periodTotalSeconds; // 🔧【新增】生成字符串格式期号
    // 新格式: YYMMDD + 房间ID(2位) + 期序号(4位) = 12位
    // 示例: 260506010034 = 2026年5月6日，房间ID=1，第0034期

    var year = String(now.getFullYear()).slice(-2); // 取后两位

    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    var dateStr = year + month + day; // YYMMDD (6位)
    // 房间ID (2位)

    var roomId = config.id || config.room_id || 0;
    var roomIdStr = String(roomId % 100).padStart(2, '0'); // 取后两位
    // 期序号 (4位)

    var seqStr = String(periodNo).padStart(4, '0');
    var periodNoStr = dateStr + roomIdStr + seqStr; // 总共12位
    // 确定阶段

    if (periodElapsed < prepareSeconds) {
      // 准备阶段
      result.phase = 1;
      result.countdown = prepareSeconds - periodElapsed;
      result.canSignup = false;
    } else {
      // 报名阶段
      result.phase = 2;
      result.countdown = periodTotalSeconds - periodElapsed;
      result.canSignup = result.countdown > 0;
    }

    result.periodNo = periodNo;
    result.periodNoStr = periodNoStr;
  } catch (e) {
    console.error("⏰ [_calculatePhaseInfo] error:", e);
  }

  return result;
}, _cc$Class._getArenaConfigByRoomId = function _getArenaConfigByRoomId(roomId) {
  if (!this._arenaRooms) return null;

  for (var i = 0; i < this._arenaRooms.length; i++) {
    if (this._arenaRooms[i].config.id === roomId) {
      return this._arenaRooms[i].config;
    }
  }

  return null;
}, _cc$Class._updateCountdownFromLocalCache = function _updateCountdownFromLocalCache() {
  if (!this._arenaRooms || !this._localArenaStatus) return;
  var cardPanel = this.node.getChildByName("CardContainer");
  var countdownContainer = cardPanel ? cardPanel.getChildByName("ArenaCountdowns") : null;
  var buttonContainer = cardPanel ? cardPanel.getChildByName("ArenaSignupButtons") : null;

  for (var i = 0; i < this._arenaRooms.length; i++) {
    var room = this._arenaRooms[i];
    var config = room.config;
    var roomId = config.id; // 获取本地缓存的状态

    var localStatus = this._localArenaStatus[roomId];
    if (!localStatus) continue; // 获取状态项节点

    var roomStatusItem = countdownContainer ? countdownContainer.getChildByName("RoomStatusItem_" + roomId) : null;
    if (!roomStatusItem) continue;
    var periodLabel = roomStatusItem.getChildByName("PeriodLabel");
    var titleLabel = roomStatusItem.getChildByName("TitleLabel"); // 获取报名按钮

    var signupBtn = buttonContainer ? buttonContainer.getChildByName("SignupBtn_" + roomId) : null; // 更新时期号显示（使用新的字符串格式期号）

    if (periodLabel) {
      var periodLabelComp = periodLabel.getComponent(cc.Label);
      var periodNoStr = localStatus.period_no_str || localStatus.periodNoStr || localStatus.periodNo;

      if (periodNoStr && localStatus.phase !== 0) {
        periodLabelComp.string = "期号: " + periodNoStr;
        periodLabel.color = cc.color(255, 215, 0); // 金色
      } else {
        periodLabelComp.string = "期号: --";
        periodLabel.color = cc.color(180, 180, 180); // 灰色
      }
    } // 更新倒计时显示


    if (titleLabel) {
      var titleLabelComp = titleLabel.getComponent(cc.Label);
      var phase = localStatus.phase || 0;
      var totalPlayers = localStatus.total_players || localStatus.totalPlayers || 0;

      if (phase === 1) {
        // 准备阶段
        var secs = localStatus.countdown || 0;
        titleLabelComp.string = "准备中 " + secs + "秒";
        titleLabel.color = cc.color(255, 200, 100); // 橙色
      } else if (phase === 2) {
        // 报名阶段
        var mins = Math.floor((localStatus.countdown || 0) / 60);
        var secs = (localStatus.countdown || 0) % 60;
        var countdownStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
        titleLabelComp.string = "报名中 " + countdownStr + " (" + totalPlayers + "人)";
        titleLabel.color = cc.color(0, 255, 100); // 绿色
      } else {
        // 未配置比赛时间或轮次
        titleLabelComp.string = "暂未开放";
        titleLabel.color = cc.color(200, 200, 200); // 浅灰色
      }
    } // 更新报名按钮状态


    if (signupBtn) {
      var sprite = signupBtn.getComponent(cc.Sprite);
      var button = signupBtn.getComponent(cc.Button); // 按钮尺寸：160x65

      sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
      var fixedWidth = 160;
      var fixedHeight = 65;
      signupBtn.setContentSize(cc.size(fixedWidth, fixedHeight));
      var phase = localStatus.phase || 0;

      if (phase !== 2 || !localStatus.canSignup) {
        // 不在报名阶段或不能报名：显示禁用按钮
        if (this._signupBtnFrames && this._signupBtnFrames['btn_no_baoming']) {
          sprite.spriteFrame = this._signupBtnFrames['btn_no_baoming'];
        }

        signupBtn.active = true;
        if (button) button.enabled = false;
      } else {
        // 检查是否已报名
        var isSignedUp = window.arenaData && window.arenaData.isSignedUp(roomId);

        if (isSignedUp) {
          // 已报名：显示取消报名
          if (this._signupBtnFrames && this._signupBtnFrames['btn_quxiaobaoming']) {
            sprite.spriteFrame = this._signupBtnFrames['btn_quxiaobaoming'];
          }

          signupBtn.active = true;
          if (button) button.enabled = true;
        } else {
          // 未报名：显示报名按钮
          if (this._signupBtnFrames && this._signupBtnFrames['btn_baoming']) {
            sprite.spriteFrame = this._signupBtnFrames['btn_baoming'];
          }

          signupBtn.active = true;
          if (button) button.enabled = true;
        }
      }
    }
  }
}, _cc$Class._updateCountdownFromServer = function _updateCountdownFromServer(arenas) {
  // 直接调用新的处理函数
  this._onArenaStatusPush(arenas);
}, _cc$Class._updateCountdownDisplay = function _updateCountdownDisplay() {
  // 直接使用本地缓存更新显示
  this._updateCountdownFromLocalCache();
}, _cc$Class._updateArenaSignupStatus = function _updateArenaSignupStatus() {
  // 直接调用倒计时更新函数，它已经包含了按钮状态更新
  this._updateCountdownDisplay();
}, _cc$Class._showLoadingProgress = function _showLoadingProgress(roomConfig, playerGold) {
  var self = this; // 获取画布尺寸

  var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
  var screenHeight = canvas ? canvas.designResolution.height : 720;
  var screenWidth = canvas ? canvas.designResolution.width : 1280; // 创建加载界面容器（全屏）

  var loadingNode = new cc.Node("LoadingProgressNode");
  loadingNode.setContentSize(cc.size(screenWidth, screenHeight));
  loadingNode.anchorX = 0.5;
  loadingNode.anchorY = 0.5;
  loadingNode.x = 0;
  loadingNode.y = 0;
  loadingNode.zIndex = 3000;
  loadingNode.parent = this.node; // 添加半透明黑色背景

  var bgNode = new cc.Node("Bg");
  bgNode.setContentSize(cc.size(screenWidth, screenHeight));
  var bgGraphics = bgNode.addComponent(cc.Graphics);
  bgGraphics.fillColor = cc.color(20, 20, 40, 250);
  bgGraphics.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
  bgGraphics.fill();
  bgNode.parent = loadingNode; // 添加装饰性背景图案

  this._addLoadingDecorations(loadingNode, screenWidth, screenHeight); // 标题文字


  var titleNode = new cc.Node("Title");
  titleNode.y = 150;
  var titleLabel = titleNode.addComponent(cc.Label);
  titleLabel.string = "斗地主";
  titleLabel.fontSize = 56;
  titleLabel.lineHeight = 72;
  titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  titleNode.color = cc.color(255, 215, 0); // 添加标题描边

  var titleOutline = titleNode.addComponent(cc.LabelOutline);
  titleOutline.color = cc.color(139, 69, 19);
  titleOutline.width = 3;
  titleNode.parent = loadingNode; // 房间名称

  var roomNameNode = new cc.Node("RoomName");
  roomNameNode.y = 80;
  var roomNameLabel = roomNameNode.addComponent(cc.Label);
  roomNameLabel.string = "进入【" + roomConfig.room_name + "】";
  roomNameLabel.fontSize = 32;
  roomNameLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  roomNameNode.color = cc.color(200, 200, 220);
  roomNameNode.parent = loadingNode; // 加载提示文字

  var tipNode = new cc.Node("Tip");
  tipNode.y = -100;
  var tipLabel = tipNode.addComponent(cc.Label);
  tipLabel.string = "正在加载资源...";
  tipLabel.fontSize = 24;
  tipLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  tipNode.color = cc.color(150, 150, 170);
  tipNode.parent = loadingNode; // 进度条背景

  var progressBg = new cc.Node("ProgressBg");
  progressBg.setContentSize(cc.size(500, 30));
  progressBg.y = -160;
  var progressBgGraphics = progressBg.addComponent(cc.Graphics);
  progressBgGraphics.fillColor = cc.color(40, 40, 60, 255);
  progressBgGraphics.roundRect(-250, -15, 500, 30, 15);
  progressBgGraphics.fill();
  progressBgGraphics.strokeColor = cc.color(80, 80, 100);
  progressBgGraphics.lineWidth = 2;
  progressBgGraphics.roundRect(-250, -15, 500, 30, 15);
  progressBgGraphics.stroke();
  progressBg.parent = loadingNode; // 进度条填充

  var progressFill = new cc.Node("ProgressFill");
  progressFill.y = -160;
  var progressFillGraphics = progressFill.addComponent(cc.Graphics);
  progressFill.parent = loadingNode; // 进度百分比文字

  var percentNode = new cc.Node("Percent");
  percentNode.y = -160;
  var percentLabel = percentNode.addComponent(cc.Label);
  percentLabel.string = "0%";
  percentLabel.fontSize = 20;
  percentLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  percentNode.color = cc.color(255, 255, 255);
  percentNode.parent = loadingNode; // 底部提示

  var bottomTipNode = new cc.Node("BottomTip");
  bottomTipNode.y = -220;
  var bottomTipLabel = bottomTipNode.addComponent(cc.Label);
  bottomTipLabel.string = "正在连接服务器...";
  bottomTipLabel.fontSize = 18;
  bottomTipLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  bottomTipNode.color = cc.color(100, 100, 120);
  bottomTipNode.parent = loadingNode; // 加载提示文字数组

  var loadingTips = ["正在加载资源...", "正在连接服务器...", "正在获取房间列表...", "正在准备游戏数据...", "即将进入房间..."]; // 进度动画

  var progress = 0;
  var targetProgress = 100;
  var tipIndex = 0;

  var updateProgress = function updateProgress() {
    if (progress >= targetProgress) {
      // 进度完成，显示房间列表场景
      self.scheduleOnce(function () {
        if (loadingNode && loadingNode.isValid) {
          loadingNode.destroy();
        }

        self._showRoomListScene(roomConfig, playerGold);
      }, 0.3);
      return;
    } // 增加进度


    progress += 2;
    if (progress > targetProgress) progress = targetProgress; // 更新进度条填充

    var fillWidth = progress / 100 * 480;
    progressFillGraphics.clear();

    if (fillWidth > 0) {
      // 渐变色效果
      progressFillGraphics.fillColor = cc.color(76, 175, 80);
      progressFillGraphics.roundRect(-240, -12, fillWidth, 24, 12);
      progressFillGraphics.fill();
    } // 更新百分比文字


    percentLabel.string = progress + "%"; // 更新加载提示文字

    var newTipIndex = Math.floor(progress / 20);

    if (newTipIndex < loadingTips.length && newTipIndex !== tipIndex) {
      tipIndex = newTipIndex;
      tipLabel.string = loadingTips[tipIndex];
      bottomTipLabel.string = loadingTips[tipIndex];
    }

    self.scheduleOnce(updateProgress, 0.05);
  }; // 开始进度动画


  updateProgress();
}, _cc$Class._addLoadingDecorations = function _addLoadingDecorations(parentNode, screenWidth, screenHeight) {
  // 添加扑克牌装饰（四角）
  var cardSymbols = ["♠", "♥", "♣", "♦"];
  var cardColors = [cc.color(50, 50, 70, 100), cc.color(180, 50, 50, 100), cc.color(50, 50, 70, 100), cc.color(180, 50, 50, 100)];
  var positions = [cc.v2(-screenWidth / 2 + 80, screenHeight / 2 - 80), cc.v2(screenWidth / 2 - 80, screenHeight / 2 - 80), cc.v2(-screenWidth / 2 + 80, -screenHeight / 2 + 80), cc.v2(screenWidth / 2 - 80, -screenHeight / 2 + 80)];

  for (var i = 0; i < 4; i++) {
    var symbolNode = new cc.Node("CardSymbol" + i);
    symbolNode.setPosition(positions[i]);
    var symbolLabel = symbolNode.addComponent(cc.Label);
    symbolLabel.string = cardSymbols[i];
    symbolLabel.fontSize = 60;
    symbolNode.color = cardColors[i];
    symbolNode.parent = parentNode;
  }
}, _cc$Class._showRoomListScene = function _showRoomListScene(roomConfig, playerGold) {
  var self = this;
  var myglobal = window.myglobal; // 移除旧的界面

  var oldScene = this.node.getChildByName("RoomListScene");
  if (oldScene) oldScene.destroy(); // 获取画布尺寸

  var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
  var screenHeight = canvas ? canvas.designResolution.height : 720;
  var screenWidth = canvas ? canvas.designResolution.width : 1280; // 创建全屏房间列表场景

  var sceneNode = new cc.Node("RoomListScene");
  sceneNode.setContentSize(cc.size(screenWidth, screenHeight));
  sceneNode.anchorX = 0.5;
  sceneNode.anchorY = 0.5;
  sceneNode.x = 0;
  sceneNode.y = 0;
  sceneNode.zIndex = 2500;
  sceneNode.parent = this.node; // ===== 背景层 =====

  this._createRoomListBackground(sceneNode, screenWidth, screenHeight); // ===== 顶部标题区域 =====


  this._createRoomListHeader(sceneNode, screenWidth, screenHeight, roomConfig); // ===== 操作按钮区域 =====


  this._createRoomListActions(sceneNode, screenWidth, screenHeight, roomConfig, playerGold); // ===== 房间列表区域 =====


  this._createRoomListContent(sceneNode, screenWidth, screenHeight, roomConfig, playerGold); // ===== 底部信息栏 =====


  this._createRoomListFooter(sceneNode, screenWidth, screenHeight, playerGold, roomConfig);
}, _cc$Class._createRoomListBackground = function _createRoomListBackground(parentNode, screenWidth, screenHeight) {
  // 主背景
  var bgNode = new cc.Node("BgLayer");
  bgNode.setContentSize(cc.size(screenWidth, screenHeight));
  var bgGraphics = bgNode.addComponent(cc.Graphics);
  bgGraphics.fillColor = cc.color(20, 25, 45, 255);
  bgGraphics.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
  bgGraphics.fill();
  bgNode.parent = parentNode; // 装饰边框

  var borderNode = new cc.Node("Border");
  var borderGraphics = borderNode.addComponent(cc.Graphics);
  borderGraphics.strokeColor = cc.color(180, 140, 60, 150);
  borderGraphics.lineWidth = 3;
  borderGraphics.roundRect(-screenWidth / 2 + 5, -screenHeight / 2 + 5, screenWidth - 10, screenHeight - 10, 10);
  borderGraphics.stroke();
  borderNode.parent = parentNode; // 角落装饰

  var corners = [{
    x: -screenWidth / 2 + 30,
    y: screenHeight / 2 - 30,
    rot: 0
  }, {
    x: screenWidth / 2 - 30,
    y: screenHeight / 2 - 30,
    rot: 90
  }, {
    x: screenWidth / 2 - 30,
    y: -screenHeight / 2 + 30,
    rot: 180
  }, {
    x: -screenWidth / 2 + 30,
    y: -screenHeight / 2 + 30,
    rot: 270
  }];

  for (var i = 0; i < corners.length; i++) {
    var corner = corners[i];
    var cornerNode = new cc.Node("Corner" + i);
    cornerNode.setPosition(corner.x, corner.y);
    cornerNode.angle = -corner.rot;
    var cg = cornerNode.addComponent(cc.Graphics);
    cg.strokeColor = cc.color(220, 180, 80, 200);
    cg.lineWidth = 2;
    cg.moveTo(0, 0);
    cg.lineTo(40, 0);
    cg.lineTo(40, 15);
    cg.moveTo(0, 0);
    cg.lineTo(0, 40);
    cg.lineTo(15, 40);
    cg.stroke();
    cornerNode.parent = parentNode;
  }
}, _cc$Class._createRoomListHeader = function _createRoomListHeader(parentNode, screenWidth, screenHeight, roomConfig) {
  var headerY = screenHeight / 2 - 55;
  var headerHeight = 80; // 增加标题栏高度
  // 标题背景

  var headerBg = new cc.Node("HeaderBg");
  headerBg.setContentSize(cc.size(screenWidth - 60, headerHeight));
  headerBg.setPosition(0, headerY);
  var hg = headerBg.addComponent(cc.Graphics);
  hg.fillColor = cc.color(35, 30, 50, 240);
  hg.roundRect(-(screenWidth - 60) / 2, -headerHeight / 2, screenWidth - 60, headerHeight, 8);
  hg.fill();
  hg.strokeColor = cc.color(180, 140, 60, 200);
  hg.lineWidth = 2;
  hg.roundRect(-(screenWidth - 60) / 2, -headerHeight / 2, screenWidth - 60, headerHeight, 8);
  hg.stroke();
  headerBg.parent = parentNode; // 左侧装饰

  var leftDeco = new cc.Node("LeftDeco");
  leftDeco.setPosition(-screenWidth / 2 + 80, headerY);
  var ld = leftDeco.addComponent(cc.Graphics);
  ld.fillColor = cc.color(200, 160, 60, 220);
  ld.circle(0, 0, 8);
  ld.fill();
  leftDeco.parent = parentNode; // 右侧装饰

  var rightDeco = new cc.Node("RightDeco");
  rightDeco.setPosition(screenWidth / 2 - 80, headerY);
  var rd = rightDeco.addComponent(cc.Graphics);
  rd.fillColor = cc.color(200, 160, 60, 220);
  rd.circle(0, 0, 8);
  rd.fill();
  rightDeco.parent = parentNode; // 房间名称 - 位于标题栏上半部分

  var titleText = new cc.Node("TitleText");
  titleText.setPosition(0, headerY + 12); // 上移到标题栏上半部分

  titleText.anchorX = 0.5;
  titleText.anchorY = 0.5;
  var titleLabel = titleText.addComponent(cc.Label);
  titleLabel.string = roomConfig.room_name || "游戏房间";
  titleLabel.fontSize = 28; // 调整字体大小

  titleLabel.lineHeight = 36;
  titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  titleText.color = cc.color(255, 220, 100);
  var titleOutline = titleText.addComponent(cc.LabelOutline);
  titleOutline.color = cc.color(80, 50, 0);
  titleOutline.width = 2;
  titleText.parent = parentNode; // 副标题 - 位于标题栏下半部分，与标题分开

  var subText = new cc.Node("SubText");
  subText.setPosition(0, headerY - 14); // 下移到标题栏下半部分

  subText.anchorX = 0.5;
  subText.anchorY = 0.5;
  var subLabel = subText.addComponent(cc.Label);
  subLabel.string = "底分 " + (roomConfig.base_score || 1) + "  ·  倍率 " + (roomConfig.multiplier || 1) + "x";
  subLabel.fontSize = 18; // 增大字体

  subLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  subText.color = cc.color(200, 180, 140);
  subText.parent = parentNode;
}, _cc$Class._createRoomListActions = function _createRoomListActions(parentNode, screenWidth, screenHeight, roomConfig, playerGold) {
  var self = this; // 操作栏背景 - 增加高度以容纳更大的元素

  var actionBarY = screenHeight / 2 - 125;
  var actionBarHeight = 65; // 增加高度

  var actionBarBg = new cc.Node("ActionBarBg");
  actionBarBg.setPosition(0, actionBarY);
  var abg = actionBarBg.addComponent(cc.Graphics);
  abg.fillColor = cc.color(30, 27, 45, 230);
  abg.roundRect(-screenWidth / 2 + 30, -actionBarHeight / 2, screenWidth - 60, actionBarHeight, 6);
  abg.fill();
  actionBarBg.parent = parentNode; // ===== 左侧：房间号输入和加入按钮 =====

  var leftX = -screenWidth / 2 + 200; // 调整位置
  // 输入框 - 增加宽度

  var roomCodeInput = this._createSimpleInputBox("输入房间号", leftX, actionBarY, 180, 44 // 增加尺寸
  );

  roomCodeInput.parent = parentNode; // 加入房间按钮 - 增加宽度

  var joinBtn = this._createActionButton("加入房间", cc.color(76, 175, 80), // 绿色
  leftX + 160, actionBarY, 110, 44, // 增加尺寸
  function () {
    var input = parentNode.getChildByName("RoomCodeInput");
    var editBox = input ? input.getComponent(cc.EditBox) : null;
    var code = editBox ? editBox.string : "";

    if (code && code.length > 0) {
      self._joinRoom(code, roomConfig, playerGold);
    } else {
      self._showTipInScene(parentNode, "请输入房间号");
    }
  });

  joinBtn.parent = parentNode; // ===== 右侧：创建房间和快速开始按钮 =====

  var rightX = screenWidth / 2 - 170; // 创建房间按钮 - 增加宽度

  var createBtn = this._createActionButton("创建房间", cc.color(255, 152, 0), // 橙色
  rightX - 85, actionBarY, 120, 44, // 增加尺寸
  function () {
    self._showCreateRoomDialog(parentNode, roomConfig, playerGold);
  });

  createBtn.parent = parentNode; // 快速开始按钮 - 增加宽度

  var quickBtn = this._createActionButton("快速开始", cc.color(33, 150, 243), // 蓝色
  rightX + 85, actionBarY, 120, 44, // 增加尺寸
  function () {
    var scene = parentNode.getChildByName("RoomListScene") || parentNode;
    if (scene.destroy) scene.destroy();

    self._quickMatch(roomConfig, playerGold);
  });

  quickBtn.parent = parentNode;
}, _cc$Class._createSimpleInputBox = function _createSimpleInputBox(placeholder, x, y, width, height) {
  var inputNode = new cc.Node("RoomCodeInput");
  inputNode.setContentSize(cc.size(width, height));
  inputNode.setPosition(x, y);
  inputNode.anchorX = 0.5;
  inputNode.anchorY = 0.5; // 背景

  var bg = inputNode.addComponent(cc.Graphics);
  bg.fillColor = cc.color(45, 40, 60, 255);
  bg.roundRect(-width / 2, -height / 2, width, height, 6);
  bg.fill();
  bg.strokeColor = cc.color(120, 100, 70, 220);
  bg.lineWidth = 2;
  bg.roundRect(-width / 2, -height / 2, width, height, 6);
  bg.stroke(); // 使用 EditBox 组件实现真正的输入框

  var editBox = inputNode.addComponent(cc.EditBox);
  editBox.string = "";
  editBox.placeholder = placeholder;
  editBox.fontSize = 18;
  editBox.fontColor = cc.color(255, 255, 255);
  editBox.placeholderFontSize = 16;
  editBox.placeholderFontColor = cc.color(130, 120, 110);
  editBox.maxLength = 20;
  editBox.inputMode = cc.EditBox.InputMode.NUMERIC;
  editBox.returnType = cc.EditBox.KeyboardReturnType.DONE;
  editBox.lineHeight = height - 8; // 添加内边距效果（通过调整背景）

  editBox.node.on('editing-did-begin', function () {
    bg.clear();
    bg.fillColor = cc.color(55, 50, 75, 255);
    bg.roundRect(-width / 2, -height / 2, width, height, 6);
    bg.fill();
    bg.strokeColor = cc.color(180, 150, 80, 255);
    bg.lineWidth = 2;
    bg.roundRect(-width / 2, -height / 2, width, height, 6);
    bg.stroke();
  });
  editBox.node.on('editing-did-end', function () {
    bg.clear();
    bg.fillColor = cc.color(45, 40, 60, 255);
    bg.roundRect(-width / 2, -height / 2, width, height, 6);
    bg.fill();
    bg.strokeColor = cc.color(120, 100, 70, 220);
    bg.lineWidth = 2;
    bg.roundRect(-width / 2, -height / 2, width, height, 6);
    bg.stroke();
  });
  return inputNode;
}, _cc$Class._createActionButton = function _createActionButton(text, bgColor, x, y, width, height, callback) {
  var btn = new cc.Node("ActionBtn_" + text);
  btn.setContentSize(cc.size(width, height));
  btn.setPosition(x, y);
  btn.anchorX = 0.5;
  btn.anchorY = 0.5; // 背景 - 增加圆角

  var bg = btn.addComponent(cc.Graphics);
  bg.fillColor = bgColor;
  bg.roundRect(-width / 2, -height / 2, width, height, 8);
  bg.fill(); // 添加高光效果

  bg.fillColor = cc.color(255, 255, 255, 40);
  bg.roundRect(-width / 2 + 2, 2, width - 4, height / 2 - 2, 6);
  bg.fill(); // 文字 - 增大字体

  var textNode = new cc.Node("Text");
  textNode.anchorX = 0.5;
  textNode.anchorY = 0.5;
  var label = textNode.addComponent(cc.Label);
  label.string = text;
  label.fontSize = 18; // 增大字体

  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  label.verticalAlign = cc.Label.VerticalAlign.CENTER;
  textNode.color = cc.color(255, 255, 255); // 添加文字描边

  var outline = textNode.addComponent(cc.LabelOutline);
  outline.color = cc.color(0, 0, 0, 150);
  outline.width = 1;
  textNode.parent = btn; // 触摸效果

  btn.on(cc.Node.EventType.TOUCH_START, function (event) {
    event.stopPropagation();
    btn.scale = 0.95;
  });
  btn.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation();
    btn.scale = 1;
    if (callback) callback();
  });
  btn.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
    btn.scale = 1;
  });
  return btn;
}, _cc$Class._createRoomListContent = function _createRoomListContent(parentNode, screenWidth, screenHeight, roomConfig, playerGold) {
  var self = this; // 列表区域位置和尺寸 - 调整以适应新的操作栏高度

  var listY = -30; // 调整位置

  var listHeight = screenHeight - 280; // 调整高度

  var listWidth = screenWidth - 60; // 列表背景

  var listBg = new cc.Node("ListBg");
  listBg.setContentSize(cc.size(listWidth, listHeight));
  listBg.setPosition(0, listY);
  var lg = listBg.addComponent(cc.Graphics);
  lg.fillColor = cc.color(25, 22, 40, 240);
  lg.roundRect(-listWidth / 2, -listHeight / 2, listWidth, listHeight, 8);
  lg.fill();
  lg.strokeColor = cc.color(80, 65, 50, 150);
  lg.lineWidth = 1;
  lg.roundRect(-listWidth / 2, -listHeight / 2, listWidth, listHeight, 8);
  lg.stroke();
  listBg.parent = parentNode; // ===== 表头 =====

  var headerY = listY + listHeight / 2 - 25; // 表头背景

  var headerBg = new cc.Node("TableHeader");
  headerBg.setPosition(0, headerY);
  var hbg = headerBg.addComponent(cc.Graphics);
  hbg.fillColor = cc.color(40, 35, 55, 255);
  hbg.roundRect(-listWidth / 2 + 5, -20, listWidth - 10, 40, 4);
  hbg.fill();
  headerBg.parent = parentNode; // 表头文字 - 增大字体

  var colWidth = listWidth / 5;
  var headers = ["房间号", "人数", "底分", "状态", "操作"];

  for (var i = 0; i < headers.length; i++) {
    var hNode = new cc.Node("H" + i);
    hNode.x = -listWidth / 2 + colWidth * (i + 0.5);
    hNode.y = headerY;
    hNode.anchorX = 0.5;
    hNode.anchorY = 0.5;
    var hl = hNode.addComponent(cc.Label);
    hl.string = headers[i];
    hl.fontSize = 16; // 增大字体

    hl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    hNode.color = cc.color(240, 200, 120); // 添加描边

    var outline = hNode.addComponent(cc.LabelOutline);
    outline.color = cc.color(60, 50, 40);
    outline.width = 1;
    hNode.parent = parentNode;
  } // ===== 房间列表容器 =====


  var roomContainer = new cc.Node("RoomListContainer");
  roomContainer.setContentSize(cc.size(listWidth - 20, listHeight - 70));
  roomContainer.y = listY - 20;
  roomContainer.parent = parentNode; // 加载提示

  var loadingNode = new cc.Node("LoadingLabel");
  loadingNode.anchorX = 0.5;
  loadingNode.anchorY = 0.5;
  var ll = loadingNode.addComponent(cc.Label);
  ll.string = "正在加载房间列表...";
  ll.fontSize = 18; // 增大字体

  ll.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  loadingNode.color = cc.color(160, 150, 140);
  loadingNode.parent = roomContainer; // 获取房间列表

  this._fetchAndRenderRoomListForScene(roomContainer, loadingNode, roomConfig, playerGold, parentNode);
}, _cc$Class._createRoomListFooter = function _createRoomListFooter(parentNode, screenWidth, screenHeight, playerGold, roomConfig) {
  var self = this;
  var footerY = -screenHeight / 2 + 50; // 调整位置
  // 底部背景

  var footerBg = new cc.Node("FooterBg");
  footerBg.setPosition(0, footerY);
  var fg = footerBg.addComponent(cc.Graphics);
  fg.fillColor = cc.color(28, 25, 42, 240);
  fg.roundRect(-screenWidth / 2 + 30, -25, screenWidth - 60, 50, 6);
  fg.fill();
  footerBg.parent = parentNode; // 返回按钮 - 增大尺寸

  var backBtn = this._createActionButton("返回大厅", cc.color(90, 85, 100), -screenWidth / 2 + 120, footerY, 110, 40, // 增加尺寸
  function () {
    var scene = parentNode.getChildByName("RoomListScene") || parentNode;
    if (scene.destroy) scene.destroy();
  });

  backBtn.parent = parentNode; // 金币显示

  var goldIcon = new cc.Node("GoldIcon");
  goldIcon.setPosition(30, footerY);
  var gg = goldIcon.addComponent(cc.Graphics);
  gg.fillColor = cc.color(230, 180, 50);
  gg.circle(0, 0, 10);
  gg.fill();
  gg.fillColor = cc.color(250, 210, 80);
  gg.circle(0, 0, 6);
  gg.fill();
  goldIcon.parent = parentNode;
  var goldText = new cc.Node("GoldText");
  goldText.setPosition(50, footerY);
  goldText.anchorX = 0;
  goldText.anchorY = 0.5;
  var gl = goldText.addComponent(cc.Label);
  gl.string = this._formatGold(playerGold);
  gl.fontSize = 16;
  goldText.color = cc.color(230, 190, 80);
  goldText.parent = parentNode; // 刷新按钮 - 增大尺寸

  var refreshBtn = this._createActionButton("刷新列表", cc.color(60, 130, 180), screenWidth / 2 - 100, footerY, 100, 40, // 增加尺寸
  function () {
    var container = parentNode.getChildByName("RoomListContainer");
    if (!container) return;
    var loading = container.getChildByName("LoadingLabel");

    if (loading) {
      loading.active = true;
      loading.getComponent(cc.Label).string = "正在刷新...";
    }

    var children = container.children.slice();

    for (var i = 0; i < children.length; i++) {
      if (children[i].name !== "LoadingLabel") {
        children[i].destroy();
      }
    }

    self._fetchAndRenderRoomListForScene(container, loading, roomConfig, playerGold, parentNode);
  });

  refreshBtn.parent = parentNode;
}, _cc$Class._createButtonNode = function _createButtonNode(text, bgColor, x, y, width, height, callback, isPrimary) {
  var btn = new cc.Node("Btn_" + text);
  btn.setContentSize(cc.size(width, height));
  btn.setPosition(x, y);
  btn.anchorX = 0.5;
  btn.anchorY = 0.5; // 按钮背景节点

  var bgNode = new cc.Node("BgNode");
  bgNode.setPosition(0, 0);
  bgNode.anchorX = 0.5;
  bgNode.anchorY = 0.5;
  var bg = bgNode.addComponent(cc.Graphics); // 绘制按钮背景

  bg.fillColor = bgColor;
  bg.roundRect(-width / 2, -height / 2, width, height, 5);
  bg.fill(); // 边框

  var borderColor = cc.color(Math.min(255, bgColor.r + 40), Math.min(255, bgColor.g + 40), Math.min(255, bgColor.b + 40));
  bg.strokeColor = borderColor;
  bg.lineWidth = 1;
  bg.roundRect(-width / 2, -height / 2, width, height, 5);
  bg.stroke(); // 主按钮高光

  if (isPrimary) {
    bg.fillColor = cc.color(255, 255, 255, 50);
    bg.roundRect(-width / 2 + 2, 2, width - 4, height / 2 - 2, 3);
    bg.fill();
  }

  bgNode.parent = btn; // 按钮文字节点（独立的子节点）

  var textNode = new cc.Node("TextNode");
  textNode.setPosition(0, 0); // 必须设置位置为按钮中心

  textNode.anchorX = 0.5;
  textNode.anchorY = 0.5;
  textNode.width = width;
  textNode.height = height;
  var label = textNode.addComponent(cc.Label);
  label.string = text;
  label.fontSize = Math.floor(height * 0.42);
  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  label.verticalAlign = cc.Label.VerticalAlign.CENTER;
  label.overflow = cc.Label.Overflow.NONE;
  textNode.color = cc.color(255, 255, 255);
  var outline = textNode.addComponent(cc.LabelOutline);
  outline.color = cc.color(0, 0, 0, 120);
  outline.width = 1;
  textNode.parent = btn; // 触摸事件

  btn.on(cc.Node.EventType.TOUCH_START, function (event) {
    event.stopPropagation();
    btn.scale = 0.95;
  });
  btn.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation();
    btn.scale = 1;
    if (callback) callback();
  });
  btn.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
    btn.scale = 1;
  });
  return btn;
}, _cc$Class._createImageButtonNode = function _createImageButtonNode(imagePath, text, x, y, width, height, callback) {
  var self = this;
  var btn = new cc.Node("Btn_" + text);
  btn.setContentSize(cc.size(width, height));
  btn.setPosition(x, y);
  btn.anchorX = 0.5;
  btn.anchorY = 0.5; // 添加 Sprite 组件

  var sprite = btn.addComponent(cc.Sprite);
  sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM; // 加载按钮图片

  cc.resources.load(imagePath, cc.SpriteFrame, function (err, spriteFrame) {
    if (err) {
      console.warn("加载按钮图片失败:", imagePath); // 使用备用样式

      self._createButtonFallback(btn, text, width, height);

      return;
    }

    sprite.spriteFrame = spriteFrame;
  }); // 添加 Button 组件

  var button = btn.addComponent(cc.Button);
  button.transition = cc.Button.Transition.SCALE;
  button.duration = 0.1;
  button.zoomScale = 0.95; // 触摸事件

  btn.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation();
    if (callback) callback();
  });
  return btn;
}, _cc$Class._createButtonFallback = function _createButtonFallback(btn, text, width, height) {
  // 绘制按钮背景
  var graphics = btn.addComponent(cc.Graphics); // 根据按钮文字选择颜色

  var bgColor;

  if (text.indexOf("创建") >= 0) {
    bgColor = cc.color(30, 90, 160); // 蓝色
  } else if (text.indexOf("加入") >= 0 || text.indexOf("进入") >= 0) {
    bgColor = cc.color(40, 130, 60); // 绿色
  } else if (text.indexOf("快速") >= 0) {
    bgColor = cc.color(200, 120, 40); // 橙色
  } else {
    bgColor = cc.color(80, 80, 80); // 灰色
  }

  graphics.fillColor = bgColor;
  graphics.roundRect(-width / 2, -height / 2, width, height, 6);
  graphics.fill();
  graphics.strokeColor = cc.color(255, 255, 255, 80);
  graphics.lineWidth = 2;
  graphics.roundRect(-width / 2, -height / 2, width, height, 6);
  graphics.stroke(); // 添加文字

  var labelNode = new cc.Node("Label");
  var label = labelNode.addComponent(cc.Label);
  label.string = text;
  label.fontSize = Math.floor(height * 0.4);
  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  labelNode.color = cc.color(255, 255, 255);
  labelNode.parent = btn;
}, _cc$Class._createInputNode = function _createInputNode(placeholder, x, y, width, height) {
  var inputNode = new cc.Node("InputNode");
  inputNode.setContentSize(cc.size(width, height));
  inputNode.setPosition(x, y);
  inputNode.anchorX = 0.5;
  inputNode.anchorY = 0.5;
  inputNode.name = "RoomCodeInput"; // 输入框背景

  var bgNode = new cc.Node("InputBg");
  bgNode.setPosition(0, 0);
  bgNode.anchorX = 0.5;
  bgNode.anchorY = 0.5;
  var bg = bgNode.addComponent(cc.Graphics);
  bg.fillColor = cc.color(45, 40, 60, 255);
  bg.roundRect(-width / 2, -height / 2, width, height, 5);
  bg.fill();
  bg.strokeColor = cc.color(100, 90, 70, 200);
  bg.lineWidth = 1;
  bg.roundRect(-width / 2, -height / 2, width, height, 5);
  bg.stroke();
  bgNode.parent = inputNode; // placeholder文字节点

  var placeholderNode = new cc.Node("Placeholder");
  placeholderNode.setPosition(0, 0);
  placeholderNode.anchorX = 0.5;
  placeholderNode.anchorY = 0.5;
  placeholderNode.width = width - 20;
  placeholderNode.height = height;
  var label = placeholderNode.addComponent(cc.Label);
  label.string = placeholder;
  label.fontSize = Math.floor(height * 0.4);
  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  label.verticalAlign = cc.Label.VerticalAlign.CENTER;
  placeholderNode.color = cc.color(130, 120, 110);
  placeholderNode.parent = inputNode;
  return inputNode;
}, _cc$Class._createStyledButton = function _createStyledButton(text, color, x, callback, width, height) {
  width = width || 100;
  height = height || 40;
  var btn = new cc.Node("Btn_" + text);
  btn.setContentSize(cc.size(width, height));
  btn.setPosition(x, 0); // 按钮背景

  var bg = btn.addComponent(cc.Graphics);
  bg.fillColor = color;
  bg.roundRect(-width / 2, -height / 2, width, height, 8);
  bg.fill(); // 按钮文字

  var label = btn.addComponent(cc.Label);
  label.string = text;
  label.fontSize = 18;
  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  label.verticalAlign = cc.Label.VerticalAlign.CENTER;
  btn.color = cc.color(255, 255, 255); // 触摸效果

  btn.on(cc.Node.EventType.TOUCH_START, function (event) {
    event.stopPropagation();
    btn.scale = 0.95;
  });
  btn.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation();
    btn.scale = 1;
    if (callback) callback();
  });
  btn.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
    btn.scale = 1;
  });
  return btn;
}, _cc$Class._showTipInScene = function _showTipInScene(sceneNode, message) {
  var tipNode = sceneNode.getChildByName("SceneTip");
  if (tipNode) tipNode.destroy();
  tipNode = new cc.Node("SceneTip");
  tipNode.y = 100;
  var bg = tipNode.addComponent(cc.Graphics);
  bg.fillColor = cc.color(0, 0, 0, 180);
  bg.roundRect(-150, -20, 300, 40, 8);
  bg.fill();
  var label = tipNode.addComponent(cc.Label);
  label.string = message;
  label.fontSize = 20;
  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  tipNode.color = cc.color(255, 255, 0);
  tipNode.parent = sceneNode;
  this.scheduleOnce(function () {
    if (tipNode && tipNode.isValid) tipNode.destroy();
  }, 2);
}, _cc$Class._showCreateRoomDialog = function _showCreateRoomDialog(parentNode, roomConfig, playerGold) {
  var self = this; // 移除旧弹窗

  var oldDialog = parentNode.getChildByName("CreateRoomDialog");
  if (oldDialog) oldDialog.destroy(); // 获取画布尺寸

  var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
  var screenHeight = canvas ? canvas.designResolution.height : 720;
  var screenWidth = canvas ? canvas.designResolution.width : 1280; // 弹窗容器

  var dialog = new cc.Node("CreateRoomDialog");
  dialog.setContentSize(cc.size(screenWidth, screenHeight));
  dialog.setPosition(0, 0);
  dialog.zIndex = 3000;
  dialog.parent = parentNode; // 半透明遮罩

  var mask = new cc.Node("Mask");
  mask.setContentSize(cc.size(screenWidth, screenHeight));
  var maskG = mask.addComponent(cc.Graphics);
  maskG.fillColor = cc.color(0, 0, 0, 180);
  maskG.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
  maskG.fill();
  mask.parent = dialog; // 点击遮罩关闭

  mask.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation();
    dialog.destroy();
  }); // ===== 弹窗主体 =====

  var dialogWidth = 480; // 增加宽度

  var dialogHeight = 420; // 增加高度
  // 弹窗背景

  var dialogBg = new cc.Node("DialogBg");
  dialogBg.setContentSize(cc.size(dialogWidth, dialogHeight));
  var dbg = dialogBg.addComponent(cc.Graphics); // 阴影

  dbg.fillColor = cc.color(0, 0, 0, 80);
  dbg.roundRect(-dialogWidth / 2 + 5, -dialogHeight / 2 - 5, dialogWidth, dialogHeight, 12);
  dbg.fill(); // 主背景

  dbg.fillColor = cc.color(35, 32, 50, 255);
  dbg.roundRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, 12);
  dbg.fill(); // 边框

  dbg.strokeColor = cc.color(255, 180, 60, 200);
  dbg.lineWidth = 2;
  dbg.roundRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, 12);
  dbg.stroke();
  dialogBg.parent = dialog; // ===== 顶部标题栏 =====

  var headerBar = new cc.Node("HeaderBar");
  headerBar.y = dialogHeight / 2 - 30;
  var hbg = headerBar.addComponent(cc.Graphics);
  hbg.fillColor = cc.color(255, 152, 0); // 橙色主题

  hbg.roundRect(-dialogWidth / 2, -25, dialogWidth, 50, [12, 12, 0, 0]);
  hbg.fill();
  headerBar.parent = dialog; // 标题文字

  var titleText = new cc.Node("Title");
  titleText.y = dialogHeight / 2 - 30;
  titleText.anchorX = 0.5;
  titleText.anchorY = 0.5;
  var ttl = titleText.addComponent(cc.Label);
  ttl.string = "创建房间";
  ttl.fontSize = 24;
  ttl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  titleText.color = cc.color(255, 255, 255);
  var titleOutline = titleText.addComponent(cc.LabelOutline);
  titleOutline.color = cc.color(120, 60, 0);
  titleOutline.width = 2;
  titleText.parent = dialog; // 关闭按钮

  var closeBtn = new cc.Node("CloseBtn");
  closeBtn.setContentSize(cc.size(30, 30));
  closeBtn.x = dialogWidth / 2 - 25;
  closeBtn.y = dialogHeight / 2 - 30;
  var cbg = closeBtn.addComponent(cc.Graphics);
  cbg.fillColor = cc.color(0, 0, 0, 80);
  cbg.circle(0, 0, 15);
  cbg.fill();
  closeBtn.parent = dialog;
  var closeX = new cc.Node("X");
  closeX.anchorX = 0.5;
  closeX.anchorY = 0.5;
  var closeLabel = closeX.addComponent(cc.Label);
  closeLabel.string = "×";
  closeLabel.fontSize = 24;
  closeLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  closeX.color = cc.color(255, 255, 255);
  closeX.parent = closeBtn;
  closeBtn.on(cc.Node.EventType.TOUCH_END, function () {
    dialog.destroy();
  }); // ===== 房间类型显示 =====

  var roomTypeBg = new cc.Node("RoomTypeBg");
  roomTypeBg.y = dialogHeight / 2 - 80;
  var rtbg = roomTypeBg.addComponent(cc.Graphics);
  rtbg.fillColor = cc.color(60, 55, 80, 200);
  rtbg.roundRect(-80, -16, 160, 32, 16);
  rtbg.fill();
  roomTypeBg.parent = dialog;
  var roomTypeText = new cc.Node("RoomType");
  roomTypeText.y = dialogHeight / 2 - 80;
  roomTypeText.anchorX = 0.5;
  roomTypeText.anchorY = 0.5;
  var rtl = roomTypeText.addComponent(cc.Label);
  rtl.string = roomConfig.room_name || "初级房";
  rtl.fontSize = 16;
  rtl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  roomTypeText.color = cc.color(255, 220, 120);
  roomTypeText.parent = dialog; // ===== 房间名称输入 =====

  var nameLabel = new cc.Node("NameLabel");
  nameLabel.x = -dialogWidth / 2 + 30;
  nameLabel.y = dialogHeight / 2 - 130;
  nameLabel.anchorX = 0;
  nameLabel.anchorY = 0.5;
  var nll = nameLabel.addComponent(cc.Label);
  nll.string = "房间名称:";
  nll.fontSize = 18; // 增大字体

  nameLabel.color = cc.color(220, 210, 190);
  nameLabel.parent = dialog;
  var nameInputData = {
    value: ""
  };

  var nameInputBtn = this._createEditBoxInput("输入房间名称（可选）", 40, dialogHeight / 2 - 165, dialogWidth - 80, 48, // 增加尺寸
  "NameInput", nameInputData);

  nameInputBtn.parent = dialog; // ===== 房间密码输入 =====

  var pwdLabel = new cc.Node("PwdLabel");
  pwdLabel.x = -dialogWidth / 2 + 30;
  pwdLabel.y = dialogHeight / 2 - 235;
  pwdLabel.anchorX = 0;
  pwdLabel.anchorY = 0.5;
  var pll = pwdLabel.addComponent(cc.Label);
  pll.string = "房间密码:";
  pll.fontSize = 18; // 增大字体

  pwdLabel.color = cc.color(220, 210, 190);
  pwdLabel.parent = dialog;
  var pwdInputData = {
    value: ""
  };

  var pwdInputBtn = this._createEditBoxInput("设置密码（可选）", 40, dialogHeight / 2 - 270, dialogWidth - 80, 48, // 增加尺寸
  "PwdInput", pwdInputData);

  pwdInputBtn.parent = dialog; // ===== 提示文字 =====

  var tipNode = new cc.Node("Tip");
  tipNode.y = -dialogHeight / 2 + 100;
  tipNode.anchorX = 0.5;
  tipNode.anchorY = 0.5;
  var tipLabel = tipNode.addComponent(cc.Label);
  tipLabel.string = "留空密码则创建公开房间，任何人可直接加入";
  tipLabel.fontSize = 14; // 增大字体

  tipLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  tipNode.color = cc.color(160, 150, 140);
  tipNode.parent = dialog; // ===== 按钮区域 =====

  var btnY = -dialogHeight / 2 + 50; // 取消按钮

  var cancelBtn = this._createDialogButton("取消", cc.color(80, 75, 95), -90, btnY, 130, 48, // 增加尺寸
  function () {
    dialog.destroy();
  });

  cancelBtn.parent = dialog; // 创建按钮

  var createBtn = this._createDialogButton("创建房间", cc.color(255, 152, 0), // 橙色
  90, btnY, 150, 48, // 增加尺寸
  function () {
    // 获取输入内容 - 从 EditBox 获取
    var nameInput = dialog.getChildByName("NameInput");
    var pwdInput = dialog.getChildByName("PwdInput");
    var nameEditBox = nameInput ? nameInput.getComponent(cc.EditBox) : null;
    var pwdEditBox = pwdInput ? pwdInput.getComponent(cc.EditBox) : null;
    var roomName = nameEditBox && nameEditBox.string || roomConfig.room_name || "我的房间";
    var password = pwdEditBox && pwdEditBox.string || ""; // 保存房间信息

    var myglobal = window.myglobal;

    if (myglobal) {
      myglobal.createRoomInfo = {
        roomName: roomName,
        password: password,
        roomConfig: roomConfig
      };
    }

    dialog.destroy(); // 关闭房间列表界面并创建房间

    var scene = parentNode.getChildByName("RoomListScene") || parentNode;
    if (scene.destroy) scene.destroy(); // 调用原来的创建房间方法

    self._createRoom(roomConfig, playerGold);
  });

  createBtn.parent = dialog;
}, _cc$Class._createEditBoxInput = function _createEditBoxInput(placeholder, x, y, width, height, nodeName, dataRef) {
  var inputNode = new cc.Node(nodeName);
  inputNode.setContentSize(cc.size(width, height));
  inputNode.setPosition(x, y);
  inputNode.anchorX = 0;
  inputNode.anchorY = 0.5; // 背景

  var bg = inputNode.addComponent(cc.Graphics);
  bg.fillColor = cc.color(50, 45, 65, 255);
  bg.roundRect(0, -height / 2, width, height, 8);
  bg.fill();
  bg.strokeColor = cc.color(120, 100, 70, 220);
  bg.lineWidth = 2;
  bg.roundRect(0, -height / 2, width, height, 8);
  bg.stroke(); // 使用 EditBox 组件

  var editBox = inputNode.addComponent(cc.EditBox);
  editBox.string = "";
  editBox.placeholder = placeholder;
  editBox.fontSize = 18;
  editBox.fontColor = cc.color(255, 255, 255);
  editBox.placeholderFontSize = 16;
  editBox.placeholderFontColor = cc.color(130, 120, 110);
  editBox.maxLength = 30;
  editBox.inputMode = cc.EditBox.InputMode.ANY;
  editBox.returnType = cc.EditBox.KeyboardReturnType.DONE;
  editBox.lineHeight = height - 10; // 输入事件

  editBox.node.on('text-changed', function (editbox) {
    if (dataRef) {
      dataRef.value = editbox.string;
    }
  }); // 焦点事件 - 更新背景样式

  editBox.node.on('editing-did-begin', function () {
    bg.clear();
    bg.fillColor = cc.color(60, 55, 80, 255);
    bg.roundRect(0, -height / 2, width, height, 8);
    bg.fill();
    bg.strokeColor = cc.color(255, 180, 80, 255);
    bg.lineWidth = 2;
    bg.roundRect(0, -height / 2, width, height, 8);
    bg.stroke();
  });
  editBox.node.on('editing-did-end', function () {
    bg.clear();
    bg.fillColor = cc.color(50, 45, 65, 255);
    bg.roundRect(0, -height / 2, width, height, 8);
    bg.fill();
    bg.strokeColor = cc.color(120, 100, 70, 220);
    bg.lineWidth = 2;
    bg.roundRect(0, -height / 2, width, height, 8);
    bg.stroke();
  });
  return inputNode;
}, _cc$Class._createInputDialogInput = function _createInputDialogInput(placeholder, x, y, width, height, nodeName, dataRef) {
  var self = this;
  var inputNode = new cc.Node(nodeName);
  inputNode.setContentSize(cc.size(width, height));
  inputNode.setPosition(x, y);
  inputNode.anchorX = 0.5;
  inputNode.anchorY = 0.5; // 背景

  var bg = inputNode.addComponent(cc.Graphics);
  bg.fillColor = cc.color(50, 45, 65, 255);
  bg.roundRect(-width / 2, -height / 2, width, height, 6);
  bg.fill();
  bg.strokeColor = cc.color(120, 100, 70, 200);
  bg.lineWidth = 1;
  bg.roundRect(-width / 2, -height / 2, width, height, 6);
  bg.stroke(); // placeholder/值显示

  var textNode = new cc.Node("Text");
  textNode.anchorX = 0.5;
  textNode.anchorY = 0.5;
  textNode.parent = inputNode;
  var label = textNode.addComponent(cc.Label);
  label.string = placeholder;
  label.fontSize = 14;
  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  textNode.color = cc.color(130, 120, 110); // 使用系统提示输入

  inputNode.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation(); // 使用 prompt 获取输入（Web端可用）

    var input = "";

    try {
      if (typeof window !== 'undefined' && window.prompt) {
        input = window.prompt(placeholder, dataRef.value || "") || "";
      }
    } catch (e) {}

    if (input) {
      dataRef.value = input;
      label.string = input;
      textNode.color = cc.color(255, 255, 255);
    } else if (dataRef.value) {
      label.string = dataRef.value;
      textNode.color = cc.color(255, 255, 255);
    } else {
      label.string = placeholder;
      textNode.color = cc.color(130, 120, 110);
    }
  });
  return inputNode;
}, _cc$Class._createDialogButton = function _createDialogButton(text, bgColor, x, y, width, height, callback) {
  var btn = new cc.Node("Btn_" + text);
  btn.setContentSize(cc.size(width, height));
  btn.setPosition(x, y);
  btn.anchorX = 0.5;
  btn.anchorY = 0.5; // 背景

  var bg = btn.addComponent(cc.Graphics);
  bg.fillColor = bgColor;
  bg.roundRect(-width / 2, -height / 2, width, height, 8);
  bg.fill(); // 边框

  bg.strokeColor = cc.color(Math.min(255, bgColor.r + 30), Math.min(255, bgColor.g + 30), Math.min(255, bgColor.b + 30));
  bg.lineWidth = 2;
  bg.roundRect(-width / 2, -height / 2, width, height, 8);
  bg.stroke(); // 文字

  var textNode = new cc.Node("Text");
  textNode.anchorX = 0.5;
  textNode.anchorY = 0.5;
  var label = textNode.addComponent(cc.Label);
  label.string = text;
  label.fontSize = 18;
  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  textNode.color = cc.color(255, 255, 255);
  textNode.parent = btn; // 触摸效果

  btn.on(cc.Node.EventType.TOUCH_START, function (event) {
    event.stopPropagation();
    btn.scale = 0.95;
  });
  btn.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation();
    btn.scale = 1;
    if (callback) callback();
  });
  btn.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
    btn.scale = 1;
  });
  return btn;
}, _cc$Class._createBeautifulInput = function _createBeautifulInput(placeholder, x, y, width, height, nodeName) {
  var inputNode = new cc.Node(nodeName || "BeautifulInput");
  inputNode.setContentSize(cc.size(width, height));
  inputNode.setPosition(x, y);
  inputNode.anchorX = 0.5;
  inputNode.anchorY = 0.5; // 输入框背景

  var bgNode = new cc.Node("InputBg");
  bgNode.setPosition(0, 0);
  bgNode.anchorX = 0.5;
  bgNode.anchorY = 0.5;
  var bg = bgNode.addComponent(cc.Graphics); // 内部填充

  bg.fillColor = cc.color(55, 45, 70, 255);
  bg.roundRect(-width / 2, -height / 2, width, height, 6);
  bg.fill(); // 边框

  bg.strokeColor = cc.color(150, 120, 80, 200);
  bg.lineWidth = 2;
  bg.roundRect(-width / 2, -height / 2, width, height, 6);
  bg.stroke(); // 内部高光

  bg.strokeColor = cc.color(80, 70, 100, 100);
  bg.lineWidth = 1;
  bg.roundRect(-width / 2 + 3, -height / 2 + 3, width - 6, height - 6, 4);
  bg.stroke();
  bgNode.parent = inputNode; // placeholder文字

  var placeholderNode = new cc.Node("Placeholder");
  placeholderNode.setPosition(0, 0);
  placeholderNode.anchorX = 0.5;
  placeholderNode.anchorY = 0.5;
  placeholderNode.width = width - 20;
  placeholderNode.height = height;
  var label = placeholderNode.addComponent(cc.Label);
  label.string = placeholder;
  label.fontSize = 14;
  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  label.verticalAlign = cc.Label.VerticalAlign.CENTER;
  placeholderNode.color = cc.color(140, 130, 120);
  placeholderNode.parent = inputNode;
  return inputNode;
}, _cc$Class._createBeautifulButton = function _createBeautifulButton(text, bgColor, borderColor, x, y, width, height, callback, isPrimary) {
  var btn = new cc.Node("BeautifulBtn_" + text);
  btn.setContentSize(cc.size(width, height));
  btn.setPosition(x, y);
  btn.anchorX = 0.5;
  btn.anchorY = 0.5; // 按钮背景节点

  var bgNode = new cc.Node("BgNode");
  bgNode.setPosition(0, 0);
  bgNode.anchorX = 0.5;
  bgNode.anchorY = 0.5;
  var bg = bgNode.addComponent(cc.Graphics); // 绘制按钮背景

  bg.fillColor = bgColor;
  bg.roundRect(-width / 2, -height / 2, width, height, 8);
  bg.fill(); // 外边框

  bg.strokeColor = borderColor;
  bg.lineWidth = 2;
  bg.roundRect(-width / 2, -height / 2, width, height, 8);
  bg.stroke(); // 主按钮高光效果

  if (isPrimary) {
    // 顶部高光
    bg.fillColor = cc.color(255, 255, 255, 40);
    bg.roundRect(-width / 2 + 3, 3, width - 6, height / 2 - 3, 5);
    bg.fill(); // 底部阴影

    bg.fillColor = cc.color(0, 0, 0, 30);
    bg.roundRect(-width / 2 + 3, -height / 2 + 3, width - 6, height / 3, 3);
    bg.fill();
  }

  bgNode.parent = btn; // 按钮文字节点

  var textNode = new cc.Node("TextNode");
  textNode.setPosition(0, 0);
  textNode.anchorX = 0.5;
  textNode.anchorY = 0.5;
  textNode.width = width;
  textNode.height = height;
  var label = textNode.addComponent(cc.Label);
  label.string = text;
  label.fontSize = Math.floor(height * 0.4);
  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  label.verticalAlign = cc.Label.VerticalAlign.CENTER;
  textNode.color = cc.color(255, 255, 255);
  var outline = textNode.addComponent(cc.LabelOutline);
  outline.color = cc.color(0, 0, 0, 150);
  outline.width = 2;
  textNode.parent = btn; // 触摸事件

  btn.on(cc.Node.EventType.TOUCH_START, function (event) {
    event.stopPropagation();
    btn.scale = 0.95;
  });
  btn.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation();
    btn.scale = 1;
    if (callback) callback();
  });
  btn.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
    btn.scale = 1;
  });
  return btn;
}, _cc$Class._createDialogInput = function _createDialogInput(placeholder, x, y, width, height, nodeName) {
  var inputNode = new cc.Node(nodeName || "DialogInput");
  inputNode.setContentSize(cc.size(width, height));
  inputNode.setPosition(x, y);
  inputNode.anchorX = 0.5;
  inputNode.anchorY = 0.5; // 输入框背景

  var bgNode = new cc.Node("InputBg");
  bgNode.setPosition(0, 0);
  bgNode.anchorX = 0.5;
  bgNode.anchorY = 0.5;
  var bg = bgNode.addComponent(cc.Graphics);
  bg.fillColor = cc.color(50, 45, 65, 255);
  bg.roundRect(-width / 2, -height / 2, width, height, 5);
  bg.fill();
  bg.strokeColor = cc.color(100, 90, 70, 200);
  bg.lineWidth = 1;
  bg.roundRect(-width / 2, -height / 2, width, height, 5);
  bg.stroke();
  bgNode.parent = inputNode; // placeholder文字

  var placeholderNode = new cc.Node("Placeholder");
  placeholderNode.setPosition(0, 0);
  placeholderNode.anchorX = 0.5;
  placeholderNode.anchorY = 0.5;
  placeholderNode.width = width - 20;
  placeholderNode.height = height;
  var label = placeholderNode.addComponent(cc.Label);
  label.string = placeholder;
  label.fontSize = Math.floor(height * 0.4);
  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  label.verticalAlign = cc.Label.VerticalAlign.CENTER;
  placeholderNode.color = cc.color(120, 110, 100);
  placeholderNode.parent = inputNode;
  return inputNode;
}, _cc$Class._showPasswordDialog = function _showPasswordDialog(roomCode, roomConfig, playerGold, callback) {
  var self = this; // 获取画布尺寸

  var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
  var screenHeight = canvas ? canvas.designResolution.height : 720;
  var screenWidth = canvas ? canvas.designResolution.width : 1280; // 弹窗容器

  var dialog = new cc.Node("PasswordDialog");
  dialog.setContentSize(cc.size(screenWidth, screenHeight));
  dialog.setPosition(0, 0);
  dialog.zIndex = 3500;
  dialog.parent = this.node; // 半透明遮罩

  var mask = new cc.Node("Mask");
  var maskG = mask.addComponent(cc.Graphics);
  maskG.fillColor = cc.color(0, 0, 0, 180);
  maskG.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
  maskG.fill();
  mask.parent = dialog;
  mask.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation();
  }); // 弹窗主体

  var dialogWidth = 350;
  var dialogHeight = 220;
  var dialogBg = new cc.Node("DialogBg");
  dialogBg.setContentSize(cc.size(dialogWidth, dialogHeight));
  var dbg = dialogBg.addComponent(cc.Graphics);
  dbg.fillColor = cc.color(35, 30, 50, 250);
  dbg.roundRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, 12);
  dbg.fill();
  dbg.strokeColor = cc.color(180, 140, 60, 200);
  dbg.lineWidth = 3;
  dbg.roundRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, 12);
  dbg.stroke();
  dialogBg.parent = dialog; // 标题

  var titleText = new cc.Node("Title");
  titleText.setPosition(0, dialogHeight / 2 - 40);
  titleText.anchorX = 0.5;
  titleText.anchorY = 0.5;
  var ttl = titleText.addComponent(cc.Label);
  ttl.string = "该房间需要密码";
  ttl.fontSize = 22;
  ttl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  titleText.color = cc.color(255, 220, 100);
  titleText.parent = dialog; // 房间号显示

  var codeText = new cc.Node("RoomCode");
  codeText.setPosition(0, dialogHeight / 2 - 75);
  codeText.anchorX = 0.5;
  codeText.anchorY = 0.5;
  var ctl = codeText.addComponent(cc.Label);
  ctl.string = "房间号: " + roomCode;
  ctl.fontSize = 14;
  ctl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  codeText.color = cc.color(160, 150, 130);
  codeText.parent = dialog; // 密码输入框

  var pwdInput = this._createDialogInput("请输入密码", 0, 10, 200, 36, "PwdInput");

  pwdInput.parent = dialog; // 按钮区域

  var btnY = -dialogHeight / 2 + 45; // 取消按钮

  var cancelBtn = this._createButtonNode("取消", cc.color(80, 75, 90), -70, btnY, 80, 34, function () {
    dialog.destroy();
  });

  cancelBtn.parent = dialog; // 确认按钮

  var confirmBtn = this._createButtonNode("确认", cc.color(40, 130, 70), 70, btnY, 80, 34, function () {
    var pwdInputNode = dialog.getChildByName("PwdInput");
    var placeholder = pwdInputNode ? pwdInputNode.getChildByName("Placeholder") : null;
    var password = placeholder ? placeholder.getComponent(cc.Label).string : "";

    if (!password || password === "请输入密码") {
      self._showTipInDialog(dialog, "请输入密码");

      return;
    } // 验证密码（这里需要调用服务端验证）


    dialog.destroy();

    if (callback) {
      callback(password);
    }
  }, true);

  confirmBtn.parent = dialog;
  return dialog;
}, _cc$Class._showTipInDialog = function _showTipInDialog(dialog, message) {
  var tip = dialog.getChildByName("TipText");
  if (tip) tip.destroy();
  tip = new cc.Node("TipText");
  tip.setPosition(0, -50);
  tip.anchorX = 0.5;
  tip.anchorY = 0.5;
  var label = tip.addComponent(cc.Label);
  label.string = message;
  label.fontSize = 14;
  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  tip.color = cc.color(255, 150, 100);
  tip.parent = dialog;
  this.scheduleOnce(function () {
    if (tip && tip.isValid) tip.destroy();
  }, 2);
}, _cc$Class._fetchAndRenderRoomListForScene = function _fetchAndRenderRoomListForScene(container, loadingLabel, roomConfig, playerGold, sceneNode) {
  var self = this;
  var myglobal = window.myglobal;
  var socket = myglobal && myglobal.socket ? myglobal.socket : null; // 检查WebSocket是否已连接

  var isConnected = socket && socket.isConnected && socket.isConnected();
  var isWebSocketOpen = socket && socket.isWebSocketOpen && socket.isWebSocketOpen(); // 存储当前房间列表，用于实时更新

  var currentRooms = []; // 设置实时房间列表更新监听器

  var roomListUpdateHandler = function roomListUpdateHandler(data) {
    var actionType = data.action_type;
    var roomCode = data.room_code;
    var room = data.room;

    if (actionType === "add" && room) {
      // 添加新房间
      var exists = currentRooms.some(function (r) {
        return (r.room_code || r.roomCode) === (room.room_code || room.roomCode);
      });

      if (!exists) {
        currentRooms.push(room);
      }
    } else if (actionType === "update" && room) {
      // 更新房间信息
      for (var i = 0; i < currentRooms.length; i++) {
        if ((currentRooms[i].room_code || currentRooms[i].roomCode) === (room.room_code || room.roomCode)) {
          currentRooms[i] = room;
          break;
        }
      }
    } else if (actionType === "remove") {
      // 移除房间
      currentRooms = currentRooms.filter(function (r) {
        return (r.room_code || r.roomCode) !== roomCode;
      });
    } // 重新渲染房间列表


    var filteredRooms = currentRooms.filter(function (r) {
      var count = r.player_count || r.playerCount || 0;
      return count > 0 && count < 3;
    });

    self._renderRoomListInScene(container, filteredRooms, roomConfig, playerGold, sceneNode);
  }; // 注册监听器


  if (socket && socket.onRoomListUpdate) {
    socket.onRoomListUpdate(roomListUpdateHandler);
  } // 保存监听器引用，用于后续取消注册


  sceneNode._roomListUpdateHandler = roomListUpdateHandler; // 如果WebSocket未连接，显示空列表

  if (!socket || !isConnected || !isWebSocketOpen) {
    this.scheduleOnce(function () {
      if (loadingLabel && loadingLabel.isValid) {
        loadingLabel.active = false;
      } // 显示空列表提示


      self._renderRoomListInScene(container, [], roomConfig, playerGold, sceneNode);
    }, 0.5);
    return;
  } // 设置超时


  var timeoutId = setTimeout(function () {
    if (loadingLabel && loadingLabel.isValid) {
      loadingLabel.active = false;
    } // 显示空列表提示


    self._renderRoomListInScene(container, [], roomConfig, playerGold, sceneNode);
  }, 5000);
  socket.getRoomList(function (result, rooms) {
    clearTimeout(timeoutId);

    if (loadingLabel && loadingLabel.isValid) {
      loadingLabel.active = false;
    }

    if (result === 0 && rooms && rooms.length > 0) {
      // 存储房间列表用于实时更新
      currentRooms = rooms; // 过滤：只显示人数少于3人的房间

      var filteredRooms = rooms.filter(function (room) {
        var count = room.player_count || room.playerCount || 0;
        return count > 0 && count < 3;
      });

      self._renderRoomListInScene(container, filteredRooms, roomConfig, playerGold, sceneNode);
    } else {
      // 没有房间或请求失败，显示空列表
      self._renderRoomListInScene(container, [], roomConfig, playerGold, sceneNode);
    }
  });
}, _cc$Class._renderRoomListInScene = function _renderRoomListInScene(container, rooms, roomConfig, playerGold, sceneNode) {
  var self = this; // 清空容器中非LoadingLabel的子节点

  var children = container.children.slice();

  for (var i = 0; i < children.length; i++) {
    if (children[i].name !== "LoadingLabel") {
      children[i].destroy();
    }
  }

  var containerWidth = container.width;
  var colWidth = containerWidth / 5;
  var itemHeight = 50; // 增加列表项高度

  var startY = container.height / 2 - 15; // 空列表处理

  if (!rooms || rooms.length === 0) {
    var emptyNode = new cc.Node("EmptyTip");
    emptyNode.anchorX = 0.5;
    emptyNode.anchorY = 0.5;
    var el = emptyNode.addComponent(cc.Label);
    el.string = "暂无可加入的房间";
    el.fontSize = 18; // 增大字体

    el.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    emptyNode.color = cc.color(160, 150, 140);
    emptyNode.parent = container;
    return;
  } // 渲染房间列表项


  for (var i = 0; i < rooms.length && i < 8; i++) {
    var room = rooms[i];
    var itemY = startY - i * itemHeight; // 列表项背景

    var itemBg = new cc.Node("RoomItem_" + i);
    itemBg.setContentSize(cc.size(containerWidth - 5, itemHeight - 4));
    itemBg.setPosition(0, itemY);
    var ig = itemBg.addComponent(cc.Graphics);
    ig.fillColor = i % 2 === 0 ? cc.color(35, 30, 50, 220) : cc.color(30, 28, 45, 220);
    ig.roundRect(-(containerWidth - 5) / 2, -(itemHeight - 4) / 2, containerWidth - 5, itemHeight - 4, 4);
    ig.fill();
    itemBg.parent = container;
    var playerCount = room.player_count || room.playerCount || 0;
    var roomCode = room.room_code || room.roomCode || "未知"; // 房间号 - 增大字体

    var codeText = new cc.Node("CodeText");
    codeText.x = -containerWidth / 2 + colWidth * 0.5;
    codeText.anchorX = 0.5;
    codeText.anchorY = 0.5;
    var cl = codeText.addComponent(cc.Label);
    cl.string = roomCode;
    cl.fontSize = 16; // 增大字体

    cl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    codeText.color = cc.color(220, 200, 160);
    codeText.parent = itemBg; // 人数 - 增大字体

    var countText = new cc.Node("CountText");
    countText.x = -containerWidth / 2 + colWidth * 1.5;
    countText.anchorX = 0.5;
    countText.anchorY = 0.5;
    var ctl = countText.addComponent(cc.Label);
    ctl.string = playerCount + "/3";
    ctl.fontSize = 16; // 增大字体

    ctl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    countText.color = playerCount >= 3 ? cc.color(220, 100, 80) : cc.color(100, 200, 100);
    countText.parent = itemBg; // 底分 - 增大字体

    var scoreText = new cc.Node("ScoreText");
    scoreText.x = -containerWidth / 2 + colWidth * 2.5;
    scoreText.anchorX = 0.5;
    scoreText.anchorY = 0.5;
    var sl = scoreText.addComponent(cc.Label);
    sl.string = "" + (room.base_score || roomConfig.base_score || 1);
    sl.fontSize = 16; // 增大字体

    sl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    scoreText.color = cc.color(220, 180, 80);
    scoreText.parent = itemBg; // 状态 - 增大字体

    var statusText = new cc.Node("StatusText");
    statusText.x = -containerWidth / 2 + colWidth * 3.5;
    statusText.anchorX = 0.5;
    statusText.anchorY = 0.5;
    var stl = statusText.addComponent(cc.Label);
    stl.string = playerCount >= 3 ? "已满" : "等待中";
    stl.fontSize = 16; // 增大字体

    stl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    statusText.color = playerCount >= 3 ? cc.color(220, 100, 80) : cc.color(100, 200, 100);
    statusText.parent = itemBg; // 加入按钮 - 增大尺寸

    (function (roomData) {
      var joinBtn = self._createActionButton("加入", cc.color(76, 175, 80), -containerWidth / 2 + colWidth * 4.5, 0, 70, 36, // 增加尺寸
      function () {
        var code = roomData.room_code || roomData.roomCode;
        var scene = sceneNode.getChildByName("RoomListScene") || sceneNode;
        if (scene.destroy) scene.destroy();

        self._joinRoom(code, roomConfig, playerGold);
      });

      joinBtn.parent = itemBg;
    })(room);
  }
}, _cc$Class._showRoomListDialog = function _showRoomListDialog(roomConfig, playerGold) {
  var self = this;
  var myglobal = window.myglobal; // 移除旧的弹窗

  var oldDialog = this.node.getChildByName("RoomListDialog");
  if (oldDialog) oldDialog.destroy(); // 移除旧的提示

  var oldTip = this.node.getChildByName("room_tip");
  if (oldTip) oldTip.destroy(); // 获取画布尺寸

  var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
  var screenHeight = canvas ? canvas.designResolution.height : 720;
  var screenWidth = canvas ? canvas.designResolution.width : 1280; // 创建弹窗容器

  var dialog = new cc.Node("RoomListDialog");
  dialog.setContentSize(cc.size(650, 450));
  dialog.anchorX = 0.5;
  dialog.anchorY = 0.5;
  dialog.x = 0;
  dialog.y = 50; // 稍微上移

  dialog.zIndex = 1000; // 确保在最上层

  dialog.parent = this.node; // 添加背景遮罩（半透明黑色）

  var mask = new cc.Node("Mask");
  mask.setContentSize(cc.size(screenWidth, screenHeight));
  mask.anchorX = 0.5;
  mask.anchorY = 0.5;
  mask.x = 0;
  mask.y = -50;
  var maskGraphics = mask.addComponent(cc.Graphics);
  maskGraphics.fillColor = cc.color(0, 0, 0, 180);
  maskGraphics.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
  maskGraphics.fill();
  mask.parent = dialog; // 点击遮罩关闭弹窗

  mask.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation();
    dialog.destroy();
  }); // 添加弹窗背景（白色圆角矩形）

  var bgNode = new cc.Node("BgNode");
  bgNode.setContentSize(cc.size(620, 420));
  var bgGraphics = bgNode.addComponent(cc.Graphics);
  bgGraphics.fillColor = cc.color(45, 45, 65, 255);
  bgGraphics.roundRect(-310, -210, 620, 420, 15);
  bgGraphics.fill();
  bgGraphics.strokeColor = cc.color(100, 100, 140, 255);
  bgGraphics.lineWidth = 3;
  bgGraphics.roundRect(-310, -210, 620, 420, 15);
  bgGraphics.stroke();
  bgNode.parent = dialog; // 标题

  var titleNode = new cc.Node("Title");
  titleNode.y = 170;
  var titleLabel = titleNode.addComponent(cc.Label);
  titleLabel.string = "【" + roomConfig.room_name + "】";
  titleLabel.fontSize = 36;
  titleLabel.lineHeight = 44;
  titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  titleNode.color = cc.color(255, 215, 0);
  titleNode.parent = dialog; // 副标题

  var subTitleNode = new cc.Node("SubTitle");
  subTitleNode.y = 130;
  var subTitleLabel = subTitleNode.addComponent(cc.Label);
  subTitleLabel.string = "选择游戏方式";
  subTitleLabel.fontSize = 24;
  subTitleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  subTitleNode.color = cc.color(180, 180, 200);
  subTitleNode.parent = dialog; // 房间列表容器

  var listContainer = new cc.Node("ListContainer");
  listContainer.setContentSize(cc.size(580, 120));
  listContainer.y = 50;
  listContainer.parent = dialog; // 加载中的提示

  var loadingLabel = new cc.Node("LoadingLabel");
  loadingLabel.y = 0;
  var loading = loadingLabel.addComponent(cc.Label);
  loading.string = "正在获取房间列表...";
  loading.fontSize = 22;
  loading.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  loadingLabel.color = cc.color(150, 150, 170);
  loadingLabel.parent = listContainer; // 按钮容器 - 放在中间显眼位置

  var btnContainer = new cc.Node("BtnContainer");
  btnContainer.y = -60;
  btnContainer.parent = dialog; // 快速匹配按钮（绿色，最大）

  var quickMatchBtn = this._createButton("🎮 快速匹配", cc.color(46, 125, 50), -200, function () {
    dialog.destroy();

    self._quickMatch(roomConfig, playerGold);
  }, 180, 55);

  quickMatchBtn.parent = btnContainer; // 创建房间按钮（蓝色）

  var createRoomBtn = this._createButton("🏠 创建房间", cc.color(21, 101, 192), 0, function () {
    dialog.destroy();

    self._createRoom(roomConfig, playerGold);
  }, 180, 55);

  createRoomBtn.parent = btnContainer; // 关闭按钮（灰色）

  var closeBtn = this._createButton("✖ 关闭", cc.color(120, 120, 120), 200, function () {
    dialog.destroy();
  }, 100, 45);

  closeBtn.parent = btnContainer; // 输入房间号区域

  var inputContainer = new cc.Node("InputContainer");
  inputContainer.y = -140;
  inputContainer.parent = dialog;
  var inputLabel = new cc.Node("InputLabel");
  inputLabel.x = -250;
  var inputLabelComp = inputLabel.addComponent(cc.Label);
  inputLabelComp.string = "房间号:";
  inputLabelComp.fontSize = 22;
  inputLabel.color = cc.color(200, 200, 200);
  inputLabel.parent = inputContainer; // 房间号输入框背景

  var inputBgNode = new cc.Node("InputBg");
  inputBgNode.setContentSize(cc.size(180, 40));
  inputBgNode.x = -110;
  var inputBg = inputBgNode.addComponent(cc.Graphics);
  inputBg.fillColor = cc.color(60, 60, 80, 255);
  inputBg.roundRect(-90, -20, 180, 40, 5);
  inputBg.fill();
  inputBgNode.parent = inputContainer;
  var inputText = inputBgNode.addComponent(cc.Label);
  inputText.string = "点击输入房间号";
  inputText.fontSize = 18;
  inputText.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  inputText.verticalAlign = cc.Label.VerticalAlign.CENTER; // 加入房间按钮

  var joinBtn = this._createButton("➤ 加入", cc.color(230, 126, 34), 100, function () {
    var roomCode = inputText.string;

    if (roomCode && roomCode !== "点击输入房间号") {
      dialog.destroy();

      self._joinRoom(roomCode, roomConfig, playerGold);
    } else {
      self._showMessageCenter("请输入房间号");
    }
  }, 90, 40);

  joinBtn.parent = inputContainer; // 底部提示

  var tipNode = new cc.Node("Tip");
  tipNode.y = -185;
  var tipLabel = tipNode.addComponent(cc.Label);
  tipLabel.string = "提示：快速匹配将自动为您分配房间";
  tipLabel.fontSize = 16;
  tipLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  tipNode.color = cc.color(120, 120, 140);
  tipNode.parent = dialog; // 获取房间列表

  this._fetchRoomList(listContainer, loadingLabel);
}, _cc$Class._createButton = function _createButton(text, color, x, callback, width, height) {
  width = width || 140;
  height = height || 50;
  var btn = new cc.Node(text + "Btn");
  btn.setContentSize(cc.size(width, height));
  btn.x = x; // 按钮背景

  var bg = btn.addComponent(cc.Graphics);
  bg.fillColor = color;
  bg.roundRect(-width / 2, -height / 2, width, height, 8);
  bg.fill(); // 按钮文字

  var label = btn.addComponent(cc.Label);
  label.string = text;
  label.fontSize = 20;
  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  label.verticalAlign = cc.Label.VerticalAlign.CENTER;
  btn.color = cc.color(255, 255, 255); // 触摸效果

  btn.on(cc.Node.EventType.TOUCH_START, function (event) {
    event.stopPropagation();
    btn.scale = 0.95;
  });
  btn.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation();
    btn.scale = 1;
    if (callback) callback();
  });
  btn.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
    btn.scale = 1;
  });
  return btn;
}, _cc$Class._fetchRoomList = function _fetchRoomList(container, loadingLabel) {
  var self = this;
  var myglobal = window.myglobal;
  var socket = myglobal && myglobal.socket ? myglobal.socket : null; // 检查WebSocket是否已连接

  var isConnected = socket && socket.isConnected && socket.isConnected();
  var isWebSocketOpen = socket && socket.isWebSocketOpen && socket.isWebSocketOpen(); // 如果WebSocket未连接，显示空列表

  if (!socket || !isConnected || !isWebSocketOpen) {
    loadingLabel.getComponent(cc.Label).string = "未连接服务器";
    this.scheduleOnce(function () {
      if (loadingLabel && loadingLabel.isValid) {
        loadingLabel.destroy();
      } // 显示空列表提示


      self._renderRoomList(container, []);
    }, 0.5);
    return;
  } // 设置超时


  var timeoutId = setTimeout(function () {
    if (loadingLabel && loadingLabel.isValid) {
      loadingLabel.destroy();
    } // 显示空列表提示


    self._renderRoomList(container, []);
  }, 5000);
  socket.getRoomList(function (result, rooms) {
    clearTimeout(timeoutId);

    if (loadingLabel && loadingLabel.isValid) {
      loadingLabel.destroy();
    }

    if (result === 0 && rooms && rooms.length > 0) {
      self._renderRoomList(container, rooms);
    } else {
      // 服务端返回空列表或失败，显示空列表
      self._renderRoomList(container, []);
    }
  });
}, _cc$Class._renderRoomList = function _renderRoomList(container, rooms) {
  var self = this; // 如果没有房间，显示空列表提示

  if (!rooms || rooms.length === 0) {
    var emptyNode = new cc.Node("EmptyTip");
    emptyNode.y = 0;
    var emptyBg = emptyNode.addComponent(cc.Graphics);
    emptyBg.fillColor = cc.color(35, 30, 50, 200);
    emptyBg.roundRect(-150, -25, 300, 50, 8);
    emptyBg.fill();
    emptyBg.strokeColor = cc.color(100, 80, 50, 150);
    emptyBg.lineWidth = 1;
    emptyBg.roundRect(-150, -25, 300, 50, 8);
    emptyBg.stroke();
    var emptyLabel = new cc.Node("Label");
    emptyLabel.anchorX = 0.5;
    emptyLabel.anchorY = 0.5;
    var el = emptyLabel.addComponent(cc.Label);
    el.string = "暂无房间，请创建或刷新";
    el.fontSize = 16;
    el.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    emptyLabel.color = cc.color(180, 160, 120);
    emptyLabel.parent = emptyNode;
    emptyNode.parent = container;
    return;
  }

  for (var i = 0; i < rooms.length && i < 5; i++) {
    var room = rooms[i];
    var item = new cc.Node("RoomItem_" + i);
    item.setContentSize(cc.size(540, 35));
    item.y = 70 - i * 40;
    var bg = item.addComponent(cc.Sprite);
    bg.color = i % 2 === 0 ? cc.color(50, 50, 70) : cc.color(45, 45, 65); // 房间号

    var codeLabel = new cc.Node();
    codeLabel.x = -200;
    var code = codeLabel.addComponent(cc.Label);
    code.string = "房间: " + (room.room_code || room.roomCode || "未知");
    code.fontSize = 18;
    codeLabel.color = cc.color(200, 200, 200);
    codeLabel.parent = item; // 人数

    var countLabel = new cc.Node();
    countLabel.x = 50;
    var count = countLabel.addComponent(cc.Label);
    count.string = "人数: " + (room.player_count || room.playerCount || 0) + "/3";
    count.fontSize = 18;
    countLabel.color = cc.color(150, 200, 150);
    countLabel.parent = item; // 加入按钮

    var joinBtn = this._createButton("加入", cc.color(76, 175, 80), 200, function () {
      var roomCode = room.room_code || room.roomCode;

      self._joinRoom(roomCode, myglobal.currentRoomConfig, myglobal.playerData.gobal_count);
    });

    joinBtn.setContentSize(cc.size(70, 30));
    joinBtn.x = 220;
    joinBtn.parent = item;
    item.parent = container;
  }
}, _cc$Class._quickMatch = function _quickMatch(roomConfig, playerGold) {
  var self = this;
  var myglobal = window.myglobal;
  var socket = myglobal && myglobal.socket ? myglobal.socket : null; // 检查WebSocket物理连接是否打开

  var isWebSocketOpen = socket && socket.isWebSocketOpen && socket.isWebSocketOpen();

  this._showMessageCenter("正在智能匹配..."); // 如果WebSocket未打开，等待连接


  if (!socket || !isWebSocketOpen) {
    // 尝试初始化WebSocket连接
    if (socket && socket.initSocket) {
      socket.initSocket();
    } // 等待WebSocket连接后进行智能匹配


    this._waitForConnectionAndSmartMatch(roomConfig, playerGold);

    return;
  } // WebSocket已连接，执行智能匹配


  this._smartMatch(roomConfig, playerGold);
}, _cc$Class._smartMatch = function _smartMatch(roomConfig, playerGold) {
  var self = this;
  var myglobal = window.myglobal;
  var socket = myglobal && myglobal.socket ? myglobal.socket : null;

  if (!socket) {
    self._hideMessageCenter();

    self._showMessage("服务器连接异常，请稍后重试");

    return;
  } // 第一步：获取可加入的房间列表


  if (socket.getRoomList) {
    socket.getRoomList(function (result, rooms) {
      if (rooms && rooms.length > 0) {}

      if (result === 0 && rooms && rooms.length > 0) {
        // 找到人数不足3人的等待房间
        // 注意：服务器返回的字段名是 room_code 和 player_count（蛇形命名）
        var waitingRoom = null;

        for (var i = 0; i < rooms.length; i++) {
          var room = rooms[i]; // 兼容两种命名方式

          var playerCount = room.player_count !== undefined ? room.player_count : room.playerCount;
          var roomCode = room.room_code || room.roomCode;

          if (playerCount < 3) {
            waitingRoom = room;
            break;
          }
        }

        if (waitingRoom) {
          // 有等待中的房间，加入该房间
          var waitingRoomCode = waitingRoom.room_code || waitingRoom.roomCode;

          self._showMessageCenter("找到等待房间，正在加入...");

          self._joinRoom(waitingRoomCode, roomConfig, playerGold);

          return;
        }
      } // 没有可加入的房间，创建新房间


      self._showMessageCenter("创建新房间，等待其他玩家...");

      self._createRoom(roomConfig, playerGold);
    });
  } else {
    // 没有获取房间列表的方法，直接创建房间
    self._createRoom(roomConfig, playerGold);
  }
}, _cc$Class._waitForConnectionAndSmartMatch = function _waitForConnectionAndSmartMatch(roomConfig, playerGold) {
  var self = this;
  var socket = window.myglobal && window.myglobal.socket ? window.myglobal.socket : null;
  var attempts = 0;
  var maxAttempts = 15; // 🔧【优化】增加尝试次数，但减少每次间隔

  var tryConnect = function tryConnect() {
    attempts++;
    var isWebSocketOpen = socket && socket.isWebSocketOpen ? socket.isWebSocketOpen() : false;

    if (isWebSocketOpen) {
      self._smartMatch(roomConfig, playerGold);
    } else if (attempts < maxAttempts) {
      setTimeout(tryConnect, 200); // 🔧【优化】减少间隔到200ms
    } else {
      self._hideMessageCenter();

      self._showMessage("连接服务器失败，请检查网络后重试");
    }
  };

  setTimeout(tryConnect, 100); // 🔧【优化】首次尝试只需100ms
}, _cc$Class._sendQuickMatchRequest = function _sendQuickMatchRequest(roomConfig, playerGold) {
  var self = this;
  var myglobal = window.myglobal;
  var socket = myglobal && myglobal.socket ? myglobal.socket : null;

  if (!socket || !socket.request_enter_room) {
    self._hideMessageCenter();

    self._showMessage("服务器连接异常，请稍后重试");

    return;
  } // 清除之前的超时计时器


  if (this._enterRoomTimeout) {
    clearTimeout(this._enterRoomTimeout);
    this._enterRoomTimeout = null;
  }

  socket.request_enter_room({
    room_level: roomConfig.room_type
  }, function (result, data) {
    // 清除超时计时器
    if (self._enterRoomTimeout) {
      clearTimeout(self._enterRoomTimeout);
      self._enterRoomTimeout = null;
    }

    if (result === 0 && data) {
      if (myglobal) {
        myglobal.roomData = data;
        myglobal.playerData.bottom = roomConfig.base_score || 1;
        myglobal.playerData.rate = roomConfig.multiplier || 1;
      }

      self._enterGameScene(data);
    } else {
      self._hideMessageCenter();

      self._showMessage("匹配失败，请稍后重试");
    }
  }); // 设置超时

  this._enterRoomTimeout = setTimeout(function () {
    self._enterRoomTimeout = null;

    self._hideMessageCenter();

    self._showMessage("匹配超时，请检查网络连接");
  }, 15000); // 增加超时时间到15秒
}, _cc$Class._createRoom = function _createRoom(roomConfig, playerGold) {
  var self = this;
  var myglobal = window.myglobal;
  var socket = myglobal && myglobal.socket ? myglobal.socket : null; // 检查WebSocket物理连接是否打开

  var isWebSocketOpen = socket && socket.isWebSocketOpen && socket.isWebSocketOpen();

  this._showMessageCenter("正在进入游戏..."); // 如果WebSocket未打开，尝试连接


  if (!socket || !isWebSocketOpen) {
    if (socket && socket.initSocket) {
      socket.initSocket();
    }

    this._waitForConnectionAndCreateRoom(roomConfig, playerGold);

    return;
  } // 发送创建房间请求


  this._sendCreateRoomRequest(roomConfig, playerGold);
}, _cc$Class._sendCreateRoomRequest = function _sendCreateRoomRequest(roomConfig, playerGold) {
  var self = this;
  var myglobal = window.myglobal;
  var socket = myglobal && myglobal.socket ? myglobal.socket : null;

  if (!socket || !socket.createRoom) {
    self._hideMessageCenter();

    self._showMessage("服务器连接异常，请稍后重试");

    return;
  } // 获取当前玩家的服务端ID（用于房主判断）


  var playerId = "";

  if (socket.getPlayerInfo) {
    var playerInfo = socket.getPlayerInfo();
    playerId = playerInfo.id;
  } // 注意：socket.createRoom 的第一个参数是 roomConfigId，第二个参数是 callback


  var roomConfigId = roomConfig ? roomConfig.id : null;
  socket.createRoom(roomConfigId, function (result, data) {
    if (result === 0 && data) {
      // 🔧【修复】优先使用服务端返回的玩家数据
      var serverPlayer = data.player || {};
      var playerData = {
        accountid: serverPlayer.id || playerId || myglobal.playerData.accountID || myglobal.playerData.uniqueID,
        nick_name: serverPlayer.name || myglobal.playerData.nickName,
        avatarUrl: myglobal.playerData.avatarUrl || "avatar_1",
        gold_count: serverPlayer.gold_count || playerGold || 0,
        // 🔧【修复】优先使用服务端返回的金币
        goldcount: serverPlayer.gold_count || playerGold || 0,
        // 兼容旧客户端
        seatindex: (serverPlayer.seat !== undefined ? serverPlayer.seat : 0) + 1,
        isready: serverPlayer.ready || true // 房主创建房间默认已准备

      }; // 转换数据格式

      var roomData = {
        roomid: data.room_code || data.roomCode || "NEW_ROOM",
        room_code: data.room_code || data.roomCode || "NEW_ROOM",
        seatindex: (serverPlayer.seat !== undefined ? serverPlayer.seat : 0) + 1,
        playerdata: [playerData],
        housemanageid: serverPlayer.id || playerId || myglobal.playerData.accountID || myglobal.playerData.uniqueID
      };
      myglobal.roomData = roomData;
      myglobal.playerData.bottom = roomConfig.base_score || 1;
      myglobal.playerData.rate = roomConfig.multiplier || 1;
      myglobal.playerData.roomid = roomData.room_code; // 保存重连信息

      if (myglobal.socket && myglobal.socket.saveReconnectInfo) {
        myglobal.socket.saveReconnectInfo();
      }

      self._enterGameScene(roomData);
    } else {
      self._hideMessageCenter();

      self._showMessage("创建房间失败，请稍后重试");
    }
  });
}, _cc$Class._waitForConnectionAndCreateRoom = function _waitForConnectionAndCreateRoom(roomConfig, playerGold) {
  var self = this;
  var socket = window.myglobal && window.myglobal.socket ? window.myglobal.socket : null;
  var attempts = 0;
  var maxAttempts = 15; // 🔧【优化】增加尝试次数

  var tryConnect = function tryConnect() {
    attempts++;
    var isWebSocketOpen = socket && socket.isWebSocketOpen ? socket.isWebSocketOpen() : false;

    if (isWebSocketOpen) {
      self._sendCreateRoomRequest(roomConfig, playerGold);
    } else if (attempts < maxAttempts) {
      setTimeout(tryConnect, 200); // 🔧【优化】减少间隔到200ms
    } else {
      self._hideMessageCenter();

      self._showMessage("连接服务器失败，请检查网络后重试");
    }
  };

  setTimeout(tryConnect, 100); // 🔧【优化】首次尝试只需100ms
}, _cc$Class._joinRoom = function _joinRoom(roomCode, roomConfig, playerGold) {
  var self = this;
  var myglobal = window.myglobal;
  var socket = myglobal && myglobal.socket ? myglobal.socket : null; // 检查WebSocket物理连接是否打开

  var isWebSocketOpen = socket && socket.isWebSocketOpen && socket.isWebSocketOpen();

  this._showMessageCenter("正在加入房间 " + roomCode + "..."); // 如果WebSocket未打开，尝试连接


  if (!socket || !isWebSocketOpen) {
    if (socket && socket.initSocket) {
      socket.initSocket();
    }

    this._waitForConnectionAndJoinRoom(roomCode, roomConfig, playerGold);

    return;
  } // 发送加入房间请求


  this._sendJoinRoomRequest(roomCode, roomConfig, playerGold);
}, _cc$Class._sendJoinRoomRequest = function _sendJoinRoomRequest(roomCode, roomConfig, playerGold) {
  var self = this;
  var myglobal = window.myglobal;
  var socket = myglobal && myglobal.socket ? myglobal.socket : null;

  if (!socket || !socket.joinRoom) {
    self._hideMessageCenter();

    self._showMessage("服务器连接异常，请稍后重试");

    return;
  }

  socket.joinRoom(roomCode, function (result, data) {
    if (result === 0 && data) {
      // 检查 players 数组是否存在
      var players = data.players || []; // 获取房主ID

      var creatorId = data.creator_id || data.creatorId || ""; // 获取当前玩家的 socket playerInfo

      if (myglobal.socket && myglobal.socket.getPlayerInfo) {
        var playerInfo = myglobal.socket.getPlayerInfo();
      } // 转换数据格式


      var roomData = {
        roomid: data.room_code || data.roomCode || roomCode,
        room_code: data.room_code || data.roomCode || roomCode,
        seatindex: data.player ? data.player.seat + 1 : 1,
        // 座位索引从1开始
        playerdata: players.map(function (p, idx) {
          return {
            accountid: p.id,
            nick_name: p.name,
            avatarUrl: p.avatar || "avatar_1",
            // 🔧【修复】使用实际头像URL
            gold_count: p.gold_count || 0,
            // 🔧【修复】使用服务端发送的金币数量
            goldcount: p.gold_count || 0,
            // 兼容旧客户端
            seatindex: (p.seat !== undefined ? p.seat : idx) + 1,
            // 座位索引从1开始
            isready: p.ready || false // 准备状态

          };
        }),
        housemanageid: creatorId,
        creator_id: creatorId
      };
      myglobal.roomData = roomData;
      myglobal.playerData.bottom = roomConfig.base_score || 1;
      myglobal.playerData.rate = roomConfig.multiplier || 1;

      self._enterGameScene(roomData);
    } else {
      self._hideMessageCenter();

      self._showMessage("加入房间失败，房间可能不存在");
    }
  });
}, _cc$Class._waitForConnectionAndJoinRoom = function _waitForConnectionAndJoinRoom(roomCode, roomConfig, playerGold) {
  var self = this;
  var socket = window.myglobal && window.myglobal.socket ? window.myglobal.socket : null;
  var attempts = 0;
  var maxAttempts = 15; // 🔧【优化】增加尝试次数

  var tryConnect = function tryConnect() {
    attempts++;
    var isWebSocketOpen = socket && socket.isWebSocketOpen ? socket.isWebSocketOpen() : false;

    if (isWebSocketOpen) {
      self._sendJoinRoomRequest(roomCode, roomConfig, playerGold);
    } else if (attempts < maxAttempts) {
      setTimeout(tryConnect, 200); // 🔧【优化】减少间隔到200ms
    } else {
      self._hideMessageCenter();

      self._showMessage("连接服务器失败，请检查网络后重试");
    }
  };

  setTimeout(tryConnect, 100); // 🔧【优化】首次尝试只需100ms
}, _cc$Class._waitForConnectionAndEnterRoom = function _waitForConnectionAndEnterRoom(roomConfig, socket, playerGold) {
  var self = this;
  var myglobal = window.myglobal;
  var attempts = 0;
  var maxAttempts = 10; // 最多等待5秒

  var tryEnter = function tryEnter() {
    attempts++;
    var isWebSocketOpen = socket && socket.isWebSocketOpen ? socket.isWebSocketOpen() : false;

    if (isWebSocketOpen) {
      self._sendQuickMatchRequest(roomConfig, playerGold);
    } else if (attempts < maxAttempts) {
      setTimeout(tryEnter, 500);
    } else {
      // 连接超时，提示用户检查网络
      console.error("WebSocket 连接超时");

      self._hideMessageCenter();

      self._showMessage("连接服务器超时，请检查网络设置");
    }
  };

  setTimeout(tryEnter, 500);
}, _cc$Class._formatGold = function _formatGold(gold) {
  if (gold >= 10000) {
    return (gold / 10000).toFixed(1) + "万";
  }

  return gold.toString();
}, _cc$Class._enterGameScene = function _enterGameScene(roomData) {
  var startTime = Date.now(); // 隐藏加载提示

  this._hideMessageCenter(); // 🔧【优化】显示快速进入动画


  this._showQuickEnterAnimation(); // 🔧【优化】使用预加载的场景，切换更快


  if (this._gameScenePreloaded) {
    cc.director.runSceneImmediate(new cc.Scene(), function () {
      cc.director.loadScene("gameScene", function (err) {
        if (err) {
          console.error("🚀 [进入场景] 加载游戏场景失败:", err);
          return;
        }

        var elapsed = Date.now() - startTime;
      });
    });
  } else {
    cc.director.loadScene("gameScene", function (err) {
      if (err) {
        console.error("🚀 [进入场景] 加载游戏场景失败:", err);
        return;
      }

      var elapsed = Date.now() - startTime;
    });
  }
}, _cc$Class._showQuickEnterAnimation = function _showQuickEnterAnimation() {
  var self = this; // 获取画布尺寸

  var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
  var screenHeight = canvas ? canvas.designResolution.height : 720;
  var screenWidth = canvas ? canvas.designResolution.width : 1280; // 创建快速进入遮罩

  var maskNode = new cc.Node("QuickEnterMask");
  maskNode.setContentSize(cc.size(screenWidth * 2, screenHeight * 2));
  maskNode.color = cc.color(0, 0, 0);
  maskNode.opacity = 0;
  maskNode.zIndex = 9999; // 添加 BlockInputEvents 防止点击穿透

  maskNode.addComponent(cc.BlockInputEvents);
  maskNode.parent = this.node; // 🔧【修复】使用加载图片替代文字

  cc.resources.load('UI/loading_image', cc.SpriteFrame, function (err, spriteFrame) {
    // 🔧【关键修复】检查节点是否仍然有效
    if (!maskNode || !maskNode.isValid) {
      console.log("加载图片回调时节点已销毁，跳过");
      return;
    }

    if (err || !spriteFrame) {
      console.warn("加载 loading_image.png 失败，使用文字提示"); // 降级：使用文字提示

      var loadingNode = new cc.Node("LoadingText");
      loadingNode.y = 0;
      var loadingLabel = loadingNode.addComponent(cc.Label);
      loadingLabel.string = "正在进入游戏...";
      loadingLabel.fontSize = 32;
      loadingLabel.lineHeight = 40;
      loadingLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
      loadingNode.color = cc.color(255, 255, 255);
      loadingNode.parent = maskNode;
      return;
    } // 创建加载图片节点


    var loadingImageNode = new cc.Node("LoadingImage");
    loadingImageNode.setContentSize(cc.size(120, 120));
    loadingImageNode.anchorX = 0.5;
    loadingImageNode.anchorY = 0.5;
    var sprite = loadingImageNode.addComponent(cc.Sprite);
    sprite.spriteFrame = spriteFrame;
    sprite.type = cc.Sprite.Type.SIMPLE;
    sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    loadingImageNode.parent = maskNode; // 添加旋转动画（180度/秒）

    self._quickEnterLoadingNode = loadingImageNode;
    self._quickEnterAnimating = true;
  }); // 淡入动画

  cc.tween(maskNode).to(0.15, {
    opacity: 200
  }).start(); // 保存引用，进入场景后销毁

  this._quickEnterMask = maskNode;
}, _cc$Class._showMessage = function _showMessage(message) {
  // 安全检查：确保节点存在
  if (!this.node || !this.node.isValid) {
    console.warn("_showMessage: 节点不存在或已销毁");
    return;
  }

  var tipNode = this.node.getChildByName("room_tip");
  if (tipNode) tipNode.destroy();
  tipNode = new cc.Node("room_tip");
  tipNode.anchorX = 0.5; // 水平居中

  tipNode.anchorY = 0.5; // 垂直居中

  tipNode.x = 0; // 水平居中（相对于父节点中心）

  tipNode.y = 311; // 显示在顶部中间的方框区域内（与消息/帮助/设置按钮同一高度）

  var label = tipNode.addComponent(cc.Label);
  label.string = message;
  label.fontSize = 22;
  label.lineHeight = 28;
  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER; // 文字居中

  tipNode.color = cc.color(255, 255, 0); // 黄色文字

  tipNode.parent = this.node;
  this.scheduleOnce(function () {
    if (tipNode && tipNode.isValid) tipNode.destroy();
  }, 2);
}, _cc$Class._showMessageCenter = function _showMessageCenter(message) {
  // 安全检查：确保节点存在
  if (!this.node || !this.node.isValid) {
    console.warn("_showMessageCenter: 节点不存在或已销毁");
    return;
  }

  var self = this;
  var tipNode = this.node.getChildByName("center_tip");
  if (tipNode) tipNode.destroy(); // 获取画布尺寸

  var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
  var screenHeight = canvas ? canvas.designResolution.height : 720;
  var screenWidth = canvas ? canvas.designResolution.width : 1280; // 创建提示容器

  tipNode = new cc.Node("center_tip");
  tipNode.zIndex = 2000;
  tipNode.parent = this.node; // 添加半透明背景遮罩

  var maskNode = new cc.Node("Mask");
  maskNode.setContentSize(cc.size(screenWidth, screenHeight));
  var maskGraphics = maskNode.addComponent(cc.Graphics);
  maskGraphics.fillColor = cc.color(0, 0, 0, 100); // 半透明黑色背景

  maskGraphics.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
  maskGraphics.fill();
  maskNode.parent = tipNode; // 加载 loading_image.png 图片

  cc.resources.load('UI/loading_image', cc.SpriteFrame, function (err, spriteFrame) {
    if (err || !spriteFrame) {
      console.warn("加载 loading_image.png 失败，使用文字提示"); // 降级：使用文字提示

      var labelNode = new cc.Node("Label");
      var label = labelNode.addComponent(cc.Label);
      label.string = message;
      label.fontSize = 26;
      label.lineHeight = 36;
      label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
      labelNode.color = cc.color(255, 255, 255);
      labelNode.parent = tipNode;
      return;
    } // 创建加载图片节点


    var loadingNode = new cc.Node("LoadingImage");
    loadingNode.setContentSize(cc.size(120, 120)); // 设置加载图片大小

    loadingNode.anchorX = 0.5;
    loadingNode.anchorY = 0.5;
    var sprite = loadingNode.addComponent(cc.Sprite);
    sprite.spriteFrame = spriteFrame;
    sprite.type = cc.Sprite.Type.SIMPLE;
    sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    loadingNode.parent = tipNode; // 标记正在动画中

    self._loadingImageAnimating = true;
    self._loadingImageNode = loadingNode;
  }); // 不自动消失，需要手动调用 _hideMessageCenter 隐藏
  // 保存引用以便后续销毁

  this._centerTipNode = tipNode;
}, _cc$Class._hideMessageCenter = function _hideMessageCenter() {
  this._loadingImageAnimating = false;
  this._loadingImageNode = null;

  if (this._centerTipNode && this._centerTipNode.isValid) {
    this._centerTipNode.destroy();

    this._centerTipNode = null;
  }

  var tipNode = this.node.getChildByName("center_tip");

  if (tipNode && tipNode.isValid) {
    tipNode.destroy();
  }
}, _cc$Class._removeNoticeBoard = function _removeNoticeBoard() {
  var noticeNames = ["notice", "gonggao", "公告", "notice_board", "dingbuuibantoumingdi", "xiongmao3", "title", "Title", "标签"];

  for (var i = 0; i < noticeNames.length; i++) {
    var node = this.node.getChildByName(noticeNames[i]);
    if (node) node.active = false;
  }

  this._hideNodesWithText(this.node, "游戏公告");

  this._hideNodesWithText(this.node, "娱乐休闲"); // 隐藏背景上的区域标签文字（不隐藏动态创建的 AreaTitle）


  this._hideBackgroundLabels();
}, _cc$Class._hideBackgroundLabels = function _hideBackgroundLabels() {
  // 隐藏背景上原有的标签节点
  var labelsToHide = ["竞技场", "普通场", "初级场", "中级场", "高级场", "选择房间", "房间选择"];

  for (var i = 0; i < labelsToHide.length; i++) {
    var nodes = this._findNodesByName(this.node, labelsToHide[i]);

    for (var j = 0; j < nodes.length; j++) {
      // 只隐藏非 AreaTitle 的节点
      if (nodes[j].name !== "AreaTitle") {
        nodes[j].active = false;
      }
    }
  }
}, _cc$Class._findNodesByName = function _findNodesByName(parentNode, name) {
  var result = [];
  if (!parentNode || !parentNode.children) return result;

  for (var i = 0; i < parentNode.children.length; i++) {
    var child = parentNode.children[i];

    if (child.name === name) {
      result.push(child);
    } // 递归查找子节点


    var subResults = this._findNodesByName(child, name);

    result = result.concat(subResults);
  }

  return result;
}, _cc$Class._adjustGoldElementsPosition = function _adjustGoldElementsPosition() {
  var playerNode = this.node.getChildByName("player_node");
  if (!playerNode) return;
  var yuanbaoIcon = playerNode.getChildByName("yuanbaoIcon");
  var goldFrame = playerNode.getChildByName("gold_frame"); // 调整金豆图标位置

  if (yuanbaoIcon) {
    yuanbaoIcon.y = 80;
    yuanbaoIcon.x = -50; // 向左偏移
  }

  if (goldFrame) {
    goldFrame.y = 80;
  } // 调整金币文字位置 - 放在金豆图标后面


  if (this.gobal_count && this.gobal_count.node) {
    var labelNode = this.gobal_count.node;
    var widget = labelNode.getComponent(cc.Widget);
    if (widget) widget.enabled = false; // 文字放在金豆图标右侧

    labelNode.anchorX = 0; // 左锚点，从左侧开始

    labelNode.x = 20; // 金豆图标后面20px

    labelNode.y = 80; // 与金豆图标同一高度
  }
}, _cc$Class._hideNodesWithText = function _hideNodesWithText(parentNode, searchText) {
  if (!parentNode) return;
  var children = parentNode.children;
  if (!children) return;

  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    var label = child.getComponent(cc.Label);

    if (label && label.string && label.string.indexOf(searchText) >= 0) {
      child.active = false;
    }

    this._hideNodesWithText(child, searchText);
  }
}, _cc$Class._createEnterRoomButton = function _createEnterRoomButton() {
  var self = this; // 移除旧的按钮

  var oldBtn = this.node.getChildByName("EnterRoomButton");
  if (oldBtn) oldBtn.destroy(); // 获取画布尺寸

  var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
  var screenHeight = canvas ? canvas.designResolution.height : 720;
  var screenWidth = canvas ? canvas.designResolution.width : 1280; // 创建按钮节点

  var btnNode = new cc.Node("EnterRoomButton");
  btnNode.setContentSize(cc.size(180, 60));
  btnNode.anchorX = 0.5;
  btnNode.anchorY = 0.5; // 放在左侧中间位置

  btnNode.x = -screenWidth / 2 + 120;
  btnNode.y = 0;
  btnNode.zIndex = 1000;
  btnNode.parent = this.node; // 加载按钮图片

  var sprite = btnNode.addComponent(cc.Sprite);
  sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
  cc.resources.load('UI/btn_enter_room', cc.SpriteFrame, function (err, spriteFrame) {
    if (err) {
      console.warn("加载 btn_enter_room 失败，使用备用样式");

      self._createEnterRoomButtonFallback(btnNode);

      return;
    }

    sprite.spriteFrame = spriteFrame;
  }); // 添加按钮组件

  var button = btnNode.addComponent(cc.Button);
  button.transition = cc.Button.Transition.SCALE;
  button.duration = 0.1;
  button.zoomScale = 1.1; // 添加点击事件

  btnNode.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation();

    self._showEnterRoomPopup();
  }, this);
}, _cc$Class._createEnterRoomButtonFallback = function _createEnterRoomButtonFallback(btnNode) {
  var sprite = btnNode.getComponent(cc.Sprite);

  if (!sprite) {
    sprite = btnNode.addComponent(cc.Sprite);
  }

  sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM; // 绘制按钮背景 - 橙色渐变风格

  var graphics = btnNode.addComponent(cc.Graphics);
  graphics.fillColor = cc.color(255, 140, 0); // 橙色

  graphics.roundRect(-90, -30, 180, 60, 12);
  graphics.fill();
  graphics.strokeColor = cc.color(255, 200, 100); // 金色边框

  graphics.lineWidth = 3;
  graphics.roundRect(-90, -30, 180, 60, 12);
  graphics.stroke(); // 添加图标和文字

  var iconNode = new cc.Node("Icon");
  var iconLabel = iconNode.addComponent(cc.Label);
  iconLabel.string = "🚪";
  iconLabel.fontSize = 22;
  iconNode.x = -45;
  iconNode.parent = btnNode;
  var labelNode = new cc.Node("Label");
  var label = labelNode.addComponent(cc.Label);
  label.string = "输入房号";
  label.fontSize = 22;
  label.lineHeight = 30;
  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  labelNode.color = cc.color(255, 255, 255);
  labelNode.parent = btnNode;
}, _cc$Class._showEnterRoomPopup = function _showEnterRoomPopup() {
  var self = this; // 移除旧的弹窗

  var oldPopup = this.node.getChildByName("EnterRoomPopup");
  if (oldPopup) oldPopup.destroy(); // 获取画布尺寸

  var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
  var screenHeight = canvas ? canvas.designResolution.height : 720;
  var screenWidth = canvas ? canvas.designResolution.width : 1280; // 创建弹窗容器

  var popup = new cc.Node("EnterRoomPopup");
  popup.setContentSize(cc.size(screenWidth, screenHeight));
  popup.anchorX = 0.5;
  popup.anchorY = 0.5;
  popup.x = 0;
  popup.y = 0;
  popup.zIndex = 2000;
  popup.parent = this.node; // 添加 BlockInputEvents 组件阻止底层点击

  popup.addComponent(cc.BlockInputEvents); // ===== 半透明背景遮罩 =====

  var bgMask = new cc.Node("BgMask");
  bgMask.setContentSize(cc.size(screenWidth, screenHeight));
  var bgGfx = bgMask.addComponent(cc.Graphics);
  bgGfx.fillColor = cc.color(0, 0, 0, 180);
  bgGfx.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
  bgGfx.fill();
  bgMask.parent = popup; // 点击遮罩关闭

  bgMask.on(cc.Node.EventType.TOUCH_END, function () {
    popup.destroy();
  }, this); // ===== 弹窗面板 - 更大的尺寸 =====

  var panelWidth = 500;
  var panelHeight = 380;
  var panel = new cc.Node("Panel");
  panel.setContentSize(cc.size(panelWidth, panelHeight));
  panel.parent = popup; // 外层阴影

  var shadow = new cc.Node("Shadow");
  var shadowGfx = shadow.addComponent(cc.Graphics);
  shadowGfx.fillColor = cc.color(0, 0, 0, 60);
  shadowGfx.roundRect(-panelWidth / 2 + 8, -panelHeight / 2 - 8, panelWidth, panelHeight, 16);
  shadowGfx.fill();
  shadow.parent = panel; // 主背景 - 深色优雅风格

  var mainBg = new cc.Node("MainBg");
  mainBg.setContentSize(cc.size(panelWidth, panelHeight));
  var mainGfx = mainBg.addComponent(cc.Graphics);
  mainGfx.fillColor = cc.color(30, 28, 45, 255);
  mainGfx.roundRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);
  mainGfx.fill();
  mainGfx.strokeColor = cc.color(100, 85, 60);
  mainGfx.lineWidth = 3;
  mainGfx.roundRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);
  mainGfx.stroke();
  mainBg.parent = panel; // ===== 顶部装饰条 =====

  var topBar = new cc.Node("TopBar");
  topBar.setContentSize(cc.size(panelWidth, 8));
  topBar.y = panelHeight / 2 - 4;
  var topGfx = topBar.addComponent(cc.Graphics);
  topGfx.fillColor = cc.color(76, 175, 80); // 绿色主题色

  topGfx.roundRect(-panelWidth / 2, -4, panelWidth, 8, [16, 16, 0, 0]);
  topGfx.fill();
  topBar.parent = panel; // ===== 标题区域 =====

  var titleBg = new cc.Node("TitleBg");
  titleBg.setContentSize(cc.size(panelWidth - 40, 60));
  titleBg.y = panelHeight / 2 - 50;
  var titleBgGfx = titleBg.addComponent(cc.Graphics);
  titleBgGfx.fillColor = cc.color(45, 42, 65, 250);
  titleBgGfx.roundRect(-(panelWidth - 40) / 2, -30, panelWidth - 40, 60, 10);
  titleBgGfx.fill();
  titleBg.parent = panel; // 图标

  var iconNode = new cc.Node("Icon");
  var iconLabel = iconNode.addComponent(cc.Label);
  iconLabel.string = "🔑";
  iconLabel.fontSize = 32;
  iconNode.x = -100;
  iconNode.y = panelHeight / 2 - 50;
  iconNode.parent = panel; // 标题文字

  var titleNode = new cc.Node("Title");
  var titleLabel = titleNode.addComponent(cc.Label);
  titleLabel.string = "加入房间";
  titleLabel.fontSize = 28;
  titleLabel.lineHeight = 40;
  titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  titleNode.color = cc.color(255, 255, 255);
  titleNode.y = panelHeight / 2 - 50;
  titleNode.parent = panel; // 副标题说明

  var subtitleNode = new cc.Node("Subtitle");
  var subtitleLabel = subtitleNode.addComponent(cc.Label);
  subtitleLabel.string = "输入好友分享的房间号即可加入游戏";
  subtitleLabel.fontSize = 14;
  subtitleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  subtitleNode.color = cc.color(180, 170, 150);
  subtitleNode.y = panelHeight / 2 - 95;
  subtitleNode.parent = panel; // ===== 房间号输入区域 =====

  var inputAreaY = 20; // 输入框标签

  var inputLabel = new cc.Node("InputLabel");
  var inputLabelComp = inputLabel.addComponent(cc.Label);
  inputLabelComp.string = "房间号";
  inputLabelComp.fontSize = 16;
  inputLabel.color = cc.color(200, 190, 160);
  inputLabel.x = -panelWidth / 2 + 70;
  inputLabel.y = inputAreaY + 45;
  inputLabel.parent = panel; // 输入框背景

  var inputBg = new cc.Node("InputBg");
  inputBg.setContentSize(cc.size(360, 55));
  inputBg.y = inputAreaY;
  var inputGfx = inputBg.addComponent(cc.Graphics);
  inputGfx.fillColor = cc.color(50, 45, 70, 255);
  inputGfx.roundRect(-180, -27.5, 360, 55, 10);
  inputGfx.fill();
  inputGfx.strokeColor = cc.color(76, 175, 80);
  inputGfx.lineWidth = 2;
  inputGfx.roundRect(-180, -27.5, 360, 55, 10);
  inputGfx.stroke();
  inputBg.parent = panel; // 输入框

  var inputNode = new cc.Node("RoomIdInput");
  inputNode.setContentSize(cc.size(340, 50));
  var editBox = inputNode.addComponent(cc.EditBox);
  editBox.placeholder = "请输入6位数字房间号";
  editBox.fontSize = 24;
  editBox.placeholderFontSize = 18;
  editBox.fontColor = cc.color(255, 255, 255);
  editBox.placeholderFontColor = cc.color(120, 115, 100);
  editBox.inputFlag = cc.EditBox.InputFlag.SENSITIVE;
  editBox.inputMode = cc.EditBox.InputMode.NUMERIC;
  editBox.maxLength = 10;
  editBox.backgroundColor = cc.color(0, 0, 0, 0);
  inputNode.parent = inputBg; // ===== 提示信息 =====

  var tipBg = new cc.Node("TipBg");
  tipBg.setContentSize(cc.size(360, 35));
  tipBg.y = inputAreaY - 55;
  var tipGfx = tipBg.addComponent(cc.Graphics);
  tipGfx.fillColor = cc.color(40, 35, 55, 200);
  tipGfx.roundRect(-180, -17.5, 360, 35, 8);
  tipGfx.fill();
  tipBg.parent = panel;
  var tipIcon = new cc.Node("TipIcon");
  var tipIconLabel = tipIcon.addComponent(cc.Label);
  tipIconLabel.string = "💡";
  tipIconLabel.fontSize = 16;
  tipIcon.x = -150;
  tipIcon.y = inputAreaY - 55;
  tipIcon.parent = panel;
  var tipNode = new cc.Node("Tip");
  var tipLabel = tipNode.addComponent(cc.Label);
  tipLabel.string = "房间号由好友创建房间后获取，为6位数字";
  tipLabel.fontSize = 13;
  tipLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  tipNode.color = cc.color(150, 145, 130);
  tipNode.y = inputAreaY - 55;
  tipNode.parent = panel; // ===== 按钮区域 =====

  var btnY = -panelHeight / 2 + 55; // 取消按钮

  var cancelBtn = new cc.Node("CancelBtn");
  cancelBtn.setContentSize(cc.size(140, 48));
  cancelBtn.x = -90;
  cancelBtn.y = btnY;
  var cancelGfx = cancelBtn.addComponent(cc.Graphics);
  cancelGfx.fillColor = cc.color(70, 65, 85);
  cancelGfx.roundRect(-70, -24, 140, 48, 10);
  cancelGfx.fill();
  cancelGfx.strokeColor = cc.color(100, 95, 115);
  cancelGfx.lineWidth = 2;
  cancelGfx.roundRect(-70, -24, 140, 48, 10);
  cancelGfx.stroke();
  cancelBtn.parent = panel;
  var cancelLabel = new cc.Node("Label");
  var cancelLabelComp = cancelLabel.addComponent(cc.Label);
  cancelLabelComp.string = "取消";
  cancelLabelComp.fontSize = 20;
  cancelLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  cancelLabel.color = cc.color(200, 195, 180);
  cancelLabel.parent = cancelBtn;
  var cancelBtnComp = cancelBtn.addComponent(cc.Button);
  cancelBtnComp.transition = cc.Button.Transition.SCALE;
  cancelBtnComp.zoomScale = 0.95;
  cancelBtn.on(cc.Node.EventType.TOUCH_END, function () {
    popup.destroy();
  }, this); // 确认加入按钮 - 绿色主题

  var confirmBtn = new cc.Node("ConfirmBtn");
  confirmBtn.setContentSize(cc.size(160, 48));
  confirmBtn.x = 100;
  confirmBtn.y = btnY;
  var confirmGfx = confirmBtn.addComponent(cc.Graphics);
  confirmGfx.fillColor = cc.color(76, 175, 80); // 绿色

  confirmGfx.roundRect(-80, -24, 160, 48, 10);
  confirmGfx.fill();
  confirmGfx.strokeColor = cc.color(100, 200, 105);
  confirmGfx.lineWidth = 2;
  confirmGfx.roundRect(-80, -24, 160, 48, 10);
  confirmGfx.stroke();
  confirmBtn.parent = panel;
  var confirmIcon = new cc.Node("Icon");
  var confirmIconLabel = confirmIcon.addComponent(cc.Label);
  confirmIconLabel.string = "✓";
  confirmIconLabel.fontSize = 20;
  confirmIcon.x = -50;
  confirmIcon.color = cc.color(255, 255, 255);
  confirmIcon.parent = confirmBtn;
  var confirmLabel = new cc.Node("Label");
  var confirmLabelComp = confirmLabel.addComponent(cc.Label);
  confirmLabelComp.string = "加入房间";
  confirmLabelComp.fontSize = 20;
  confirmLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  confirmLabel.color = cc.color(255, 255, 255);
  confirmLabel.parent = confirmBtn;
  var confirmBtnComp = confirmBtn.addComponent(cc.Button);
  confirmBtnComp.transition = cc.Button.Transition.SCALE;
  confirmBtnComp.zoomScale = 0.95; // 确认按钮点击事件

  confirmBtn.on(cc.Node.EventType.TOUCH_END, function () {
    var roomId = editBox.string;

    if (!roomId || roomId.length === 0) {
      self._showMessage("请输入房间号");

      return;
    } // 发送加入房间请求


    self._joinRoomById(roomId, popup);
  }, this); // ===== 关闭按钮（右上角） =====

  var closeBtn = new cc.Node("CloseBtn");
  closeBtn.setContentSize(cc.size(40, 40));
  closeBtn.x = panelWidth / 2 - 25;
  closeBtn.y = panelHeight / 2 - 25;
  var closeGfx = closeBtn.addComponent(cc.Graphics);
  closeGfx.fillColor = cc.color(60, 55, 75);
  closeGfx.circle(0, 0, 20);
  closeGfx.fill();
  closeBtn.parent = panel;
  var closeX = new cc.Node("X");
  var closeLabel = closeX.addComponent(cc.Label);
  closeLabel.string = "×";
  closeLabel.fontSize = 28;
  closeLabel.lineHeight = 36;
  closeLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  closeX.color = cc.color(180, 170, 160);
  closeX.parent = closeBtn;
  closeBtn.on(cc.Node.EventType.TOUCH_END, function () {
    popup.destroy();
  }, this);
}, _cc$Class._joinRoomById = function _joinRoomById(roomId, popup) {
  var self = this;
  var myglobal = window.myglobal;

  if (!myglobal || !myglobal.socket) {
    this._showMessage("网络未连接，请稍后重试");

    return;
  }

  this._showMessage("正在加入房间..."); // 发送加入房间请求


  myglobal.socket.request_joinRoom({
    roomId: roomId
  }, function (err, result) {
    if (err !== 0) {
      self._showMessage("加入房间失败: " + (result || "房间不存在"));

      return;
    }

    self._showMessage("加入成功！"); // 关闭弹窗


    if (popup) popup.destroy(); // 跳转到游戏场景

    if (result && result.roomId) {
      myglobal.currentRoomId = result.roomId;
    } // 延迟跳转


    self.scheduleOnce(function () {
      cc.director.loadScene("gameScene");
    }, 0.5);
  });
}, _cc$Class._updateCurrencyDisplay = function _updateCurrencyDisplay() {
  var myglobal = window.myglobal;
  var playerData = myglobal ? myglobal.playerData : null;
  if (!playerData) return;
  var roomCategory = this._currentRoomCategory || 1;

  if (roomCategory === 2) {
    // 竞技场 - 显示竞技币
    if (this.gobal_count) {
      this.gobal_count.string = ":" + this._formatGold(playerData.arena_coin || 0);
    } // 隐藏欢乐豆图标，显示竞技币图标（如果有）


    this._updateCurrencyIcon(2);
  } else {
    // 普通场 - 显示欢乐豆
    if (this.gobal_count) {
      this.gobal_count.string = ":" + this._formatGold(playerData.gobal_count || 0);
    }

    this._updateCurrencyIcon(1);
  }
}, _cc$Class._updateCurrencyIcon = function _updateCurrencyIcon(roomCategory) {
  // 查找或创建货币图标节点
  var playerNode = this.node.getChildByName("player_node");
  if (!playerNode) return; // 尝试找到货币图标

  var currencyIcon = playerNode.getChildByName("currency_icon");

  if (!currencyIcon) {
    // 如果没有现有图标，创建一个
    currencyIcon = new cc.Node("currency_icon");
    currencyIcon.setPosition(-100, 80);
    currencyIcon.zIndex = 10;
    currencyIcon.parent = playerNode;
  } // 根据类型显示不同图标（这里用文字代替，实际项目可以换图片）


  var label = currencyIcon.getComponent(cc.Label);

  if (!label) {
    label = currencyIcon.addComponent(cc.Label);
  }

  label.string = roomCategory === 2 ? "币" : "豆";
  label.fontSize = 24;
  currencyIcon.color = cc.color(255, 215, 0);
  var outline = currencyIcon.getComponent(cc.LabelOutline);

  if (!outline) {
    outline = currencyIcon.addComponent(cc.LabelOutline);
  }

  outline.color = cc.color(0, 0, 0);
  outline.width = 2;
}, _cc$Class._initArenaCoinDisplay = function _initArenaCoinDisplay() {
  var myglobal = window.myglobal;
  var playerData = myglobal ? myglobal.playerData : null; // 如果有竞技币Label，初始化显示

  if (this.arena_coin_label && playerData) {
    this.arena_coin_label.string = "竞技币: " + this._formatGold(playerData.arena_coin || 0);
    this.arena_coin_label.node.active = false; // 默认隐藏
  }
}, _cc$Class._refreshPlayerBalance = function _refreshPlayerBalance() {
  var self = this;

  if (window.arenaData && window.arenaData.refreshBalance) {
    window.arenaData.refreshBalance(function (err, data) {
      if (err) {
        console.warn("获取玩家余额失败:", err);
        return;
      } // 更新UI显示


      self._updateCurrencyDisplay();

      if (self.arena_coin_label && data.arena_coin !== undefined) {
        self.arena_coin_label.string = "竞技币: " + self._formatGold(data.arena_coin);
      }
    });
  }
}, _cc$Class._showSignupDialog = function _showSignupDialog(roomConfig) {
  var self = this;
  var myglobal = window.myglobal;
  var playerData = myglobal ? myglobal.playerData : null;
  var playerArenaCoin = playerData ? playerData.arena_coin || 0 : 0; // 获取报名费

  var signupFee = roomConfig.signup_fee || roomConfig.signupFee || 0; // 移除旧弹窗

  var oldDialog = this.node.getChildByName("SignupDialog");
  if (oldDialog) oldDialog.destroy(); // 获取画布尺寸

  var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
  var screenHeight = canvas ? canvas.designResolution.height : 720;
  var screenWidth = canvas ? canvas.designResolution.width : 1280; // 创建弹窗容器

  var dialog = new cc.Node("SignupDialog");
  dialog.setContentSize(cc.size(screenWidth, screenHeight));
  dialog.setPosition(0, 0);
  dialog.zIndex = 3000;
  dialog.parent = this.node; // 半透明遮罩

  var mask = new cc.Node("Mask");
  var maskG = mask.addComponent(cc.Graphics);
  maskG.fillColor = cc.color(0, 0, 0, 180);
  maskG.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
  maskG.fill();
  mask.parent = dialog;
  mask.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation();
  }); // 弹窗主体

  var dialogWidth = 420;
  var dialogHeight = 380;
  var dialogBg = new cc.Node("DialogBg");
  dialogBg.setContentSize(cc.size(dialogWidth, dialogHeight));
  var dbg = dialogBg.addComponent(cc.Graphics);
  dbg.fillColor = cc.color(35, 30, 50, 250);
  dbg.roundRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, 12);
  dbg.fill();
  dbg.strokeColor = cc.color(180, 140, 60, 200);
  dbg.lineWidth = 3;
  dbg.roundRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, 12);
  dbg.stroke();
  dialogBg.parent = dialog; // 标题

  var titleText = new cc.Node("Title");
  titleText.setPosition(0, dialogHeight / 2 - 40);
  titleText.anchorX = 0.5;
  titleText.anchorY = 0.5;
  var ttl = titleText.addComponent(cc.Label);
  ttl.string = "竞技场报名";
  ttl.fontSize = 26;
  ttl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  titleText.color = cc.color(255, 220, 100);
  var titleOutline = titleText.addComponent(cc.LabelOutline);
  titleOutline.color = cc.color(80, 50, 0);
  titleOutline.width = 2;
  titleText.parent = dialog; // 房间名称

  var roomNameText = new cc.Node("RoomName");
  roomNameText.setPosition(0, dialogHeight / 2 - 80);
  roomNameText.anchorX = 0.5;
  roomNameText.anchorY = 0.5;
  var rnl = roomNameText.addComponent(cc.Label);
  rnl.string = roomConfig.room_name || "竞技场";
  rnl.fontSize = 20;
  rnl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  roomNameText.color = cc.color(200, 180, 140);
  roomNameText.parent = dialog; // 报名费信息

  var feeLabel = new cc.Node("FeeLabel");
  feeLabel.setPosition(-dialogWidth / 2 + 30, dialogHeight / 2 - 130);
  feeLabel.anchorX = 0;
  feeLabel.anchorY = 0.5;
  var fl = feeLabel.addComponent(cc.Label);
  fl.string = "报名费：";
  fl.fontSize = 18;
  feeLabel.color = cc.color(220, 210, 190);
  feeLabel.parent = dialog;
  var feeValue = new cc.Node("FeeValue");
  feeValue.setPosition(60, dialogHeight / 2 - 130);
  feeValue.anchorX = 0;
  feeValue.anchorY = 0.5;
  var fv = feeValue.addComponent(cc.Label);
  fv.string = this._formatGold(signupFee) + " 竞技币";
  fv.fontSize = 20;
  feeValue.color = cc.color(255, 215, 0);
  feeValue.parent = dialog; // 当前余额

  var balanceLabel = new cc.Node("BalanceLabel");
  balanceLabel.setPosition(-dialogWidth / 2 + 30, dialogHeight / 2 - 170);
  balanceLabel.anchorX = 0;
  balanceLabel.anchorY = 0.5;
  var bl = balanceLabel.addComponent(cc.Label);
  bl.string = "当前余额：";
  bl.fontSize = 18;
  balanceLabel.color = cc.color(220, 210, 190);
  balanceLabel.parent = dialog;
  var balanceValue = new cc.Node("BalanceValue");
  balanceValue.setPosition(60, dialogHeight / 2 - 170);
  balanceValue.anchorX = 0;
  balanceValue.anchorY = 0.5;
  var bv = balanceValue.addComponent(cc.Label);
  bv.string = this._formatGold(playerArenaCoin) + " 竞技币";
  bv.fontSize = 20;
  balanceValue.color = playerArenaCoin >= signupFee ? cc.color(100, 220, 100) : cc.color(255, 100, 100);
  balanceValue.parent = dialog; // 冠军奖励预览

  var rewardLabel = new cc.Node("RewardLabel");
  rewardLabel.setPosition(-dialogWidth / 2 + 30, dialogHeight / 2 - 210);
  rewardLabel.anchorX = 0;
  rewardLabel.anchorY = 0.5;
  var rl = rewardLabel.addComponent(cc.Label);
  rl.string = "冠军奖励：";
  rl.fontSize = 18;
  rewardLabel.color = cc.color(220, 210, 190);
  rewardLabel.parent = dialog;
  var championReward = roomConfig.champion_reward || roomConfig.championReward || {
    coins: 0
  };
  var rewardValue = new cc.Node("RewardValue");
  rewardValue.setPosition(60, dialogHeight / 2 - 210);
  rewardValue.anchorX = 0;
  rewardValue.anchorY = 0.5;
  var rv = rewardValue.addComponent(cc.Label);
  rv.string = this._formatGold(championReward.coins || 0) + " 竞技币";
  rv.fontSize = 20;
  rewardValue.color = cc.color(255, 180, 50);
  rewardValue.parent = dialog; // 按钮区域

  var btnY = -dialogHeight / 2 + 55; // 判断余额是否足够

  var isEnough = playerArenaCoin >= signupFee; // 取消按钮

  var cancelBtn = this._createDialogButton("取消", cc.color(80, 75, 95), -90, btnY, 130, 48, function () {
    dialog.destroy();
  });

  cancelBtn.parent = dialog;

  if (isEnough) {
    // 报名按钮
    var signupBtn = this._createDialogButton("确认报名", cc.color(76, 175, 80), // 绿色
    90, btnY, 150, 48, function () {
      // 调用报名接口
      self._doSignup(roomConfig, dialog);
    });

    signupBtn.parent = dialog;
  } else {
    // 余额不足 - 显示观看广告按钮
    var adBtn = this._createDialogButton("观看广告获取", cc.color(255, 152, 0), // 橙色
    90, btnY, 150, 48, function () {
      dialog.destroy();

      self._showAdRewardDialog('arena_coin', signupFee - playerArenaCoin);
    });

    adBtn.parent = dialog; // 提示余额不足

    var tipNode = new cc.Node("Tip");
    tipNode.setPosition(0, btnY + 45);
    tipNode.anchorX = 0.5;
    tipNode.anchorY = 0.5;
    var tipLabel = tipNode.addComponent(cc.Label);
    tipLabel.string = "竞技币不足，观看广告获取更多";
    tipLabel.fontSize = 14;
    tipLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    tipNode.color = cc.color(255, 150, 100);
    tipNode.parent = dialog;
  } // 关闭按钮


  var closeBtn = new cc.Node("CloseBtn");
  closeBtn.setContentSize(cc.size(30, 30));
  closeBtn.x = dialogWidth / 2 - 25;
  closeBtn.y = dialogHeight / 2 - 30;
  var cbg = closeBtn.addComponent(cc.Graphics);
  cbg.fillColor = cc.color(0, 0, 0, 80);
  cbg.circle(0, 0, 15);
  cbg.fill();
  closeBtn.parent = dialog;
  var closeX = new cc.Node("X");
  closeX.anchorX = 0.5;
  closeX.anchorY = 0.5;
  var closeLabel = closeX.addComponent(cc.Label);
  closeLabel.string = "×";
  closeLabel.fontSize = 24;
  closeLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  closeX.color = cc.color(255, 255, 255);
  closeX.parent = closeBtn;
  closeBtn.on(cc.Node.EventType.TOUCH_END, function () {
    dialog.destroy();
  });
}, _cc$Class._doSignup = function _doSignup(roomConfig, dialog) {
  var self = this;

  if (!window.arenaData) {
    this._showMessage("竞技场数据未初始化");

    return;
  }

  this._showMessageCenter("正在报名...");

  window.arenaData.signup(roomConfig.id, function (err, result) {
    if (err) {
      self._showMessageCenter("报名失败: " + err);

      return;
    }

    self._showMessageCenter("报名成功！"); // 关闭弹窗


    if (dialog) dialog.destroy(); // 更新货币显示

    if (window.arenaData.refreshBalance) {
      window.arenaData.refreshBalance();
    }

    self._updateCurrencyDisplay(); // 显示已报名状态弹窗


    self.scheduleOnce(function () {
      self._showSignedUpDialog(roomConfig);
    }, 0.5);
  });
}, _cc$Class._showSignedUpDialog = function _showSignedUpDialog(roomConfig) {
  var self = this; // 移除旧弹窗

  var oldDialog = this.node.getChildByName("SignedUpDialog");
  if (oldDialog) oldDialog.destroy(); // 获取画布尺寸

  var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
  var screenHeight = canvas ? canvas.designResolution.height : 720;
  var screenWidth = canvas ? canvas.designResolution.width : 1280; // 创建弹窗容器

  var dialog = new cc.Node("SignedUpDialog");
  dialog.setContentSize(cc.size(screenWidth, screenHeight));
  dialog.setPosition(0, 0);
  dialog.zIndex = 3000;
  dialog.parent = this.node; // 半透明遮罩

  var mask = new cc.Node("Mask");
  var maskG = mask.addComponent(cc.Graphics);
  maskG.fillColor = cc.color(0, 0, 0, 180);
  maskG.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
  maskG.fill();
  mask.parent = dialog;
  mask.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation();
  }); // 弹窗主体

  var dialogWidth = 380;
  var dialogHeight = 320;
  var dialogBg = new cc.Node("DialogBg");
  dialogBg.setContentSize(cc.size(dialogWidth, dialogHeight));
  var dbg = dialogBg.addComponent(cc.Graphics);
  dbg.fillColor = cc.color(35, 30, 50, 250);
  dbg.roundRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, 12);
  dbg.fill();
  dbg.strokeColor = cc.color(76, 175, 80, 200);
  dbg.lineWidth = 3;
  dbg.roundRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, 12);
  dbg.stroke();
  dialogBg.parent = dialog; // 标题

  var titleText = new cc.Node("Title");
  titleText.setPosition(0, dialogHeight / 2 - 40);
  titleText.anchorX = 0.5;
  titleText.anchorY = 0.5;
  var ttl = titleText.addComponent(cc.Label);
  ttl.string = "已报名";
  ttl.fontSize = 26;
  ttl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  titleText.color = cc.color(100, 220, 100);
  titleText.parent = dialog; // 房间名称

  var roomNameText = new cc.Node("RoomName");
  roomNameText.setPosition(0, dialogHeight / 2 - 80);
  roomNameText.anchorX = 0.5;
  roomNameText.anchorY = 0.5;
  var rnl = roomNameText.addComponent(cc.Label);
  rnl.string = roomConfig.room_name || "竞技场";
  rnl.fontSize = 20;
  rnl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  roomNameText.color = cc.color(200, 180, 140);
  roomNameText.parent = dialog; // 倒计时显示

  var countdownLabel = new cc.Node("CountdownLabel");
  countdownLabel.setPosition(0, dialogHeight / 2 - 130);
  countdownLabel.anchorX = 0.5;
  countdownLabel.anchorY = 0.5;
  var cl = countdownLabel.addComponent(cc.Label);
  cl.string = "开赛倒计时：计算中...";
  cl.fontSize = 18;
  cl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  countdownLabel.color = cc.color(255, 220, 100);
  countdownLabel.parent = dialog; // 更新倒计时

  var updateCountdown = function updateCountdown() {
    if (!dialog || !dialog.isValid) return;
    var countdown = window.arenaData ? window.arenaData.getCountdown(roomConfig.id) : -1;

    if (countdown >= 0) {
      cl.string = "开赛倒计时：" + (window.arenaData.formatCountdown ? window.arenaData.formatCountdown(countdown) : countdown + "秒");
    } else {
      cl.string = "等待开赛...";
    }

    if (countdown === 0) {
      // 倒计时结束，自动进入比赛
      self._showMessageCenter("比赛即将开始！");

      dialog.destroy(); // 这里可以调用进入比赛的方法
    } else {
      self.scheduleOnce(updateCountdown, 1);
    }
  };

  updateCountdown(); // 按钮区域

  var btnY = -dialogHeight / 2 + 55; // 取消报名按钮

  var cancelSignupBtn = this._createDialogButton("取消报名", cc.color(200, 100, 80), // 红色
  -80, btnY, 130, 48, function () {
    self._cancelSignup(roomConfig, dialog);
  });

  cancelSignupBtn.parent = dialog; // 关闭按钮

  var closeBtn = this._createDialogButton("关闭", cc.color(80, 75, 95), 80, btnY, 100, 48, function () {
    dialog.destroy();
  });

  closeBtn.parent = dialog;
}, _cc$Class._cancelSignup = function _cancelSignup(roomConfig, dialog) {
  var self = this;

  if (!window.arenaData) {
    this._showMessage("竞技场数据未初始化");

    return;
  }

  window.arenaData.cancelSignup(roomConfig.id, function (err, result) {
    if (err) {
      self._showMessageCenter("取消报名失败: " + err);

      return;
    }

    self._showMessageCenter("已取消报名"); // 关闭弹窗


    if (dialog) dialog.destroy(); // 更新货币显示

    self._updateCurrencyDisplay();
  });
}, _cc$Class._showAdRewardDialog = function _showAdRewardDialog(type, neededAmount) {
  var self = this; // 移除旧弹窗

  var oldDialog = this.node.getChildByName("AdRewardDialog");
  if (oldDialog) oldDialog.destroy(); // 获取画布尺寸

  var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
  var screenHeight = canvas ? canvas.designResolution.height : 720;
  var screenWidth = canvas ? canvas.designResolution.width : 1280; // 创建弹窗容器

  var dialog = new cc.Node("AdRewardDialog");
  dialog.setContentSize(cc.size(screenWidth, screenHeight));
  dialog.setPosition(0, 0);
  dialog.zIndex = 3000;
  dialog.parent = this.node; // 半透明遮罩

  var mask = new cc.Node("Mask");
  var maskG = mask.addComponent(cc.Graphics);
  maskG.fillColor = cc.color(0, 0, 0, 180);
  maskG.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
  maskG.fill();
  mask.parent = dialog;
  mask.on(cc.Node.EventType.TOUCH_END, function (event) {
    event.stopPropagation();
  }); // 弹窗主体

  var dialogWidth = 380;
  var dialogHeight = 300;
  var dialogBg = new cc.Node("DialogBg");
  dialogBg.setContentSize(cc.size(dialogWidth, dialogHeight));
  var dbg = dialogBg.addComponent(cc.Graphics);
  dbg.fillColor = cc.color(35, 30, 50, 250);
  dbg.roundRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, 12);
  dbg.fill();
  dbg.strokeColor = cc.color(255, 152, 0, 200);
  dbg.lineWidth = 3;
  dbg.roundRect(-dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight, 12);
  dbg.stroke();
  dialogBg.parent = dialog; // 标题

  var titleText = new cc.Node("Title");
  titleText.setPosition(0, dialogHeight / 2 - 40);
  titleText.anchorX = 0.5;
  titleText.anchorY = 0.5;
  var ttl = titleText.addComponent(cc.Label);
  ttl.string = type === 'arena_coin' ? "竞技币不足" : "欢乐豆不足";
  ttl.fontSize = 26;
  ttl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  titleText.color = cc.color(255, 150, 100);
  titleText.parent = dialog; // 说明文字

  var descText = new cc.Node("Desc");
  descText.setPosition(0, dialogHeight / 2 - 90);
  descText.anchorX = 0.5;
  descText.anchorY = 0.5;
  var dl = descText.addComponent(cc.Label);
  dl.string = "观看激励视频领取" + this._formatGold(neededAmount) + (type === 'arena_coin' ? "竞技币" : "欢乐豆") + "继续游戏";
  dl.fontSize = 16;
  dl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  descText.color = cc.color(200, 190, 170);
  descText.parent = dialog; // 广告图标/提示

  var adIcon = new cc.Node("AdIcon");
  adIcon.setPosition(0, 0);
  adIcon.anchorX = 0.5;
  adIcon.anchorY = 0.5;
  var ail = adIcon.addComponent(cc.Label);
  ail.string = "🎬";
  ail.fontSize = 48;
  adIcon.parent = dialog; // 按钮区域

  var btnY = -dialogHeight / 2 + 55; // 取消按钮

  var cancelBtn = this._createDialogButton("取消", cc.color(80, 75, 95), -80, btnY, 120, 48, function () {
    dialog.destroy();
  });

  cancelBtn.parent = dialog; // 观看领取按钮

  var watchBtn = this._createDialogButton("观看领取", cc.color(255, 152, 0), // 橙色
  80, btnY, 140, 48, function () {
    self._watchAdAndGetReward(type, dialog);
  });

  watchBtn.parent = dialog;
}, _cc$Class._watchAdAndGetReward = function _watchAdAndGetReward(type, dialog) {
  var self = this; // 这里应该调用广告SDK显示激励视频
  // 目前模拟观看完成

  this._showMessageCenter("正在加载广告..."); // 模拟广告观看完成


  this.scheduleOnce(function () {
    if (!window.arenaData) {
      self._showMessageCenter("数据未初始化");

      return;
    }

    window.arenaData.watchAdForReward(type, function (err, result) {
      if (err) {
        self._showMessageCenter("获取奖励失败: " + err);

        return;
      }

      self._showMessageCenter("获得奖励！"); // 关闭弹窗


      if (dialog) dialog.destroy(); // 更新货币显示

      self._updateCurrencyDisplay();
    });
  }, 1.5);
}, _cc$Class.onDestroy = function onDestroy() {
  // 清理倒计时定时器
  if (this._countdownTimer) {
    clearInterval(this._countdownTimer);
    this._countdownTimer = null;
  } // 清理竞技场倒计时


  if (window.arenaData && window.arenaData.clearAllCountdowns) {
    window.arenaData.clearAllCountdowns();
  } // 停止在线状态监测（大厅场景需要持续监测，所以只有场景销毁时才停止）
  // 注意：通常大厅场景不会销毁，除非切换到游戏场景
  // 如果需要保持监测，可以注释掉下面这行
  // this._stopOnlineMonitoring();

}, _cc$Class.start = function start() {}, _cc$Class));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2hhbGxzY2VuZS9oYWxsU2NlbmUuanMiXSwibmFtZXMiOlsiY2MiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJuaWNrbmFtZV9sYWJlbCIsIkxhYmVsIiwiaGVhZGltYWdlIiwiU3ByaXRlIiwiZ29iYWxfY291bnQiLCJhcmVuYV9jb2luX2xhYmVsIiwiY3JlYXRyb29tX3ByZWZhYnMiLCJQcmVmYWIiLCJqb2lucm9vbV9wcmVmYWJzIiwidXNlcl9hZ3JlZW1lbnRfcHJlZmFicyIsIm9uTG9hZCIsIndpbmRvdyIsIm15Z2xvYmFsIiwiY29uc29sZSIsIndhcm4iLCJfd2FpdEZvck15Z2xvYmFsIiwiX2luaXRXaXRoUGxheWVyRGF0YSIsInVwZGF0ZSIsImR0IiwiX2xvYWRpbmdJbWFnZUFuaW1hdGluZyIsIl9sb2FkaW5nSW1hZ2VOb2RlIiwiaXNWYWxpZCIsImFuZ2xlIiwiX3F1aWNrRW50ZXJBbmltYXRpbmciLCJfcXVpY2tFbnRlckxvYWRpbmdOb2RlIiwic2VsZiIsImF0dGVtcHRzIiwibWF4QXR0ZW1wdHMiLCJjaGVjayIsInBsYXllckRhdGEiLCJzZXRUaW1lb3V0IiwiZXJyb3IiLCJkaXJlY3RvciIsImxvYWRTY2VuZSIsInRva2VuIiwidmVyaWZ5VG9rZW4iLCJfaW5pdFVJQWZ0ZXJBdXRoIiwidmFsaWQiLCJtZXNzYWdlIiwiZSIsIm5pY2tOYW1lIiwiYXZhdGFyVXJsIiwibmlja25hbWVMYWJlbCIsInN0cmluZyIsInVuZGVmaW5lZCIsIm5pY2tuYW1lTm9kZSIsIl9maW5kTm9kZUJ5TmFtZSIsIm5vZGUiLCJnZXRDb21wb25lbnQiLCJfY3VycmVudFJvb21DYXRlZ29yeSIsIl91cGRhdGVDdXJyZW5jeURpc3BsYXkiLCJfYWRqdXN0R29sZEVsZW1lbnRzUG9zaXRpb24iLCJfbG9hZFVzZXJBdmF0YXIiLCJyb29tQ29uZmlncyIsIl9pbml0QXJlbmFDb2luRGlzcGxheSIsIl9yZWZyZXNoUGxheWVyQmFsYW5jZSIsIl9wbGF5SGFsbEJhY2tncm91bmRNdXNpYyIsIl9hZGp1c3RCb3R0b21CdXR0b25zIiwiX2hpZGVCYWNrZ3JvdW5kQ2hhcmFjdGVycyIsIl9pbml0V2ViU29ja2V0IiwiX3N0YXJ0T25saW5lTW9uaXRvcmluZyIsIl9mZXRjaFJvb21Db25maWdzIiwiX3JlbW92ZU5vdGljZUJvYXJkIiwiX3ByZWxvYWRHYW1lU2NlbmUiLCJzdGFydE9ubGluZU1vbml0b3JpbmciLCJfb25saW5lU3RhdHVzSGFuZGxlciIsImlzT25saW5lIiwiX2lzSW5pdGlhbGl6aW5nIiwiX3Nob3dPZmZsaW5lTWVzc2FnZSIsImFkZE9ubGluZVN0YXR1c0xpc3RlbmVyIiwiZXZlbnRsaXN0ZXIiLCJvbiIsImRhdGEiLCJfaGFuZGxlRm9yY2VMb2dvdXQiLCJfc2hvd01lc3NhZ2UiLCJyZWFzb24iLCJzdG9wT25saW5lTW9uaXRvcmluZyIsInNjaGVkdWxlT25jZSIsIl9zdG9wT25saW5lTW9uaXRvcmluZyIsInJlbW92ZU9ubGluZVN0YXR1c0xpc3RlbmVyIiwic3RhcnRUaW1lIiwiRGF0ZSIsIm5vdyIsInByZWxvYWRTY2VuZSIsImVyciIsImVsYXBzZWQiLCJfZ2FtZVNjZW5lUHJlbG9hZGVkIiwic29ja2V0IiwiaXNXZWJTb2NrZXRPcGVuIiwiaXNDb25uZWN0ZWQiLCJpbml0U29ja2V0IiwicGFyZW50Tm9kZSIsIm5vZGVOYW1lIiwiZm91bmQiLCJnZXRDaGlsZEJ5TmFtZSIsImNoaWxkcmVuIiwiaSIsImxlbmd0aCIsImNoaWxkIiwieGlvbmdtYW8xIiwieGlvbmdtYW8yIiwiYWN0aXZlIiwiY2FudmFzIiwiQ2FudmFzIiwiZmluZCIsInNjcmVlbkhlaWdodCIsImRlc2lnblJlc29sdXRpb24iLCJoZWlnaHQiLCJzY3JlZW5XaWR0aCIsIndpZHRoIiwiYnV0dG9uTmFtZXMiLCJidXR0b25zIiwiYnRuIiwicHVzaCIsImFsbENoaWxkcmVuIiwibmFtZSIsInRvTG93ZXJDYXNlIiwiaW5kZXhPZiIsInkiLCJidG5XaWR0aCIsImJ0bkhlaWdodCIsImJ0bkdhcCIsInJpZ2h0TWFyZ2luIiwiYm90dG9tTWFyZ2luIiwid2lkZ2V0IiwiV2lkZ2V0IiwiZW5hYmxlZCIsInNjYWxlIiwiYW5jaG9yWCIsImFuY2hvclkiLCJ4UG9zIiwieVBvcyIsIngiLCJfbG9hZERlZmF1bHRBdmF0YXIiLCJhc3NldE1hbmFnZXIiLCJsb2FkUmVtb3RlIiwiZXh0IiwidGV4dHVyZSIsInNwcml0ZUZyYW1lIiwiU3ByaXRlRnJhbWUiLCJyZXNvdXJjZXMiLCJsb2FkIiwiaXNvcGVuX3NvdW5kIiwiYXVkaW9FbmdpbmUiLCJzdG9wTXVzaWMiLCJzdG9wQWxsRWZmZWN0cyIsIkF1ZGlvQ2xpcCIsImNsaXAiLCJwbGF5TXVzaWMiLCJhcGlVcmwiLCJkZWZpbmVzIiwiY3J5cHRvS2V5IiwiSHR0cEFQSSIsIl9pbml0Um9vbUJ1dHRvbnMiLCJfZ2V0RGVmYXVsdFJvb21Db25maWdzIiwiX3Jvb21Db25maWdDYWNoZSIsImxvY2FsU3RvcmFnZSIsInJlbW92ZUl0ZW0iLCJnZXQiLCJyZXN1bHQiLCJjb25maWdzIiwiY29kZSIsIkFycmF5IiwiaXNBcnJheSIsImMiLCJpZCIsInJvb21fbmFtZSIsInJvb21fdHlwZSIsImJhc2Vfc2NvcmUiLCJtdWx0aXBsaWVyIiwibWluX2dvbGQiLCJtYXhfZ29sZCIsImRlc2NyaXB0aW9uIiwic3RhdHVzIiwic29ydF9vcmRlciIsInJvb21fY2F0ZWdvcnkiLCJfaGlkZVVud2FudGVkQnV0dG9ucyIsImNyZWF0ZVJvb21CdG4iLCJqb2luUm9vbUJ0biIsInJvb21zIiwiYnV0dG9uTmFtZU1hcCIsImtleSIsImJ0bk5vZGUiLCJhbGxSb29tcyIsImNvbmZpZyIsInNvcnRPcmRlciIsInNvcnQiLCJyb29tVHlwZSIsImJ1dHRvbk5hbWUiLCJyb29tRGF0YSIsInJvb21OYW1lIiwibWluR29sZCIsIm1heEdvbGQiLCJyb29tQ2F0ZWdvcnkiLCJhIiwiYiIsInJvb20iLCJyb29tQ29uZmlnIiwiX2xvYWRSb29tQnV0dG9uQmciLCJfdXBkYXRlTWluR29sZExhYmVsIiwiYnV0dG9uIiwiQnV0dG9uIiwidHJhbnNpdGlvbiIsIlRyYW5zaXRpb24iLCJTQ0FMRSIsImR1cmF0aW9uIiwiem9vbVNjYWxlIiwiX2FyZW5hUm9vbXMiLCJvZmYiLCJOb2RlIiwiRXZlbnRUeXBlIiwiVE9VQ0hfRU5EIiwiZXZlbnQiLCJzdG9wUHJvcGFnYXRpb24iLCJfb25Sb29tQnV0dG9uQ2xpY2siLCJfcmVuZGVyUm9vbUxheW91dCIsIl9hZGRBcmVuYVNpZ251cEJ1dHRvbnMiLCJfZmV0Y2hTaWdudXBTdGF0dXNBbmRVcGRhdGVVSSIsImFyZW5hRGF0YSIsImZldGNoU2lnbnVwU3RhdHVzRnJvbVNlcnZlciIsInNpZ25lZFVwUm9vbXMiLCJfdXBkYXRlQXJlbmFTaWdudXBTdGF0dXMiLCJvbGRQYW5lbCIsIm9sZExlZnRQYW5lbCIsIm9sZFJpZ2h0UGFuZWwiLCJkZXN0cm95IiwiY2FyZFdpZHRoIiwiY2FyZEhlaWdodCIsImdhcFgiLCJ0b3RhbENhcmRzV2lkdGgiLCJwYW5lbFdpZHRoIiwiTWF0aCIsIm1heCIsInBhbmVsSGVpZ2h0IiwidmVydGljYWxPZmZzZXQiLCJjYXJkUGFuZWwiLCJzZXRDb250ZW50U2l6ZSIsInBhcmVudCIsInN0YXJ0WCIsIl9hZGRBcmVhVGl0bGUiLCJwYW5lbCIsInRpdGxlVGV4dCIsInRpdGxlTm9kZSIsInNldFBvc2l0aW9uIiwibGFiZWwiLCJhZGRDb21wb25lbnQiLCJmb250U2l6ZSIsImxpbmVIZWlnaHQiLCJob3Jpem9udGFsQWxpZ24iLCJIb3Jpem9udGFsQWxpZ24iLCJDRU5URVIiLCJjb2xvciIsIm91dGxpbmUiLCJMYWJlbE91dGxpbmUiLCJfcHJlcGFyZUNhcmROb2RlUmVzcG9uc2l2ZSIsImNhcmRTY2FsZSIsInRpdGxlIiwiTEVGVCIsInNwcml0ZSIsIl9sb2FkRGVmYXVsdFJvb21CdXR0b25CZyIsImdvbGRMYWJlbE5vZGUiLCJ6SW5kZXgiLCJtaW5WYWx1ZSIsImN1cnJlbmN5TmFtZSIsIm1pbl9hcmVuYV9jb2luIiwibWluQXJlbmFDb2luIiwiX2Zvcm1hdEdvbGQiLCJ5T2Zmc2V0IiwieE9mZnNldCIsIl9vbkFyZW5hUm9vbUJ1dHRvbkNsaWNrIiwiX29uTm9ybWFsUm9vbUJ1dHRvbkNsaWNrIiwicGxheWVyR29sZCIsIl9zaG93QWRSZXdhcmREaWFsb2ciLCJjdXJyZW50Um9vbUNvbmZpZyIsImN1cnJlbnRSb29tTGV2ZWwiLCJjdXJyZW50Um9vbU5hbWUiLCJfcXVpY2tNYXRjaCIsInJvb21JZCIsImlzU2lnbmVkVXAiLCJfaGFzU2lnbmVkVXBPdGhlckFyZW5hIiwiX2RvQXJlbmFTaWdudXAiLCJjdXJyZW50Um9vbUlkIiwic2lnbnVwIiwicmVmcmVzaEJhbGFuY2UiLCJvbGRCdXR0b25zIiwib2xkVGltZXJzIiwiYnV0dG9uQ29udGFpbmVyIiwiY291bnRkb3duQ29udGFpbmVyIiwic3RhdHVzQmFySGVpZ2h0IiwiaXRlbVdpZHRoIiwiaXRlbUhlaWdodCIsIml0ZW1HYXAiLCJsZWZ0UmlnaHRNYXJnaW4iLCJiZ1dpZHRoIiwiYmdIZWlnaHQiLCJiZ1JhZGl1cyIsImJnQ29sb3IiLCJyb29tU3RhdHVzSXRlbSIsInNpemUiLCJjYXJkTm9kZSIsImJnTm9kZSIsImJnR3JhcGhpY3MiLCJHcmFwaGljcyIsImZpbGxDb2xvciIsInJvdW5kUmVjdCIsImZpbGwiLCJwZXJpb2RMYWJlbCIsInBlcmlvZExhYmVsQ29tcCIsInZlcnRpY2FsQWxpZ24iLCJWZXJ0aWNhbEFsaWduIiwiZW5hYmxlQm9sZCIsInBlcmlvZE91dGxpbmUiLCJ0aXRsZUxhYmVsIiwidGl0bGVMYWJlbENvbXAiLCJ0aXRsZU91dGxpbmUiLCJzaWdudXBCdG4iLCJ0eXBlIiwiVHlwZSIsIlNJTVBMRSIsInNpemVNb2RlIiwiU2l6ZU1vZGUiLCJDVVNUT00iLCJmaXhlZFdpZHRoIiwiZml4ZWRIZWlnaHQiLCJzaWdudXBCdG5Ob2RlIiwiX29uQXJlbmFTaWdudXBCdXR0b25DbGljayIsIm9yaWdpbmFsSGVpZ2h0IiwiX2xvYWRTaWdudXBCdXR0b25JbWFnZXMiLCJfc3RhcnRDb3VudGRvd25UaW1lciIsImltYWdlUGF0aHMiLCJfc2lnbnVwQnRuRnJhbWVzIiwibG9hZGVkQ291bnQiLCJpbmRleCIsInNwbGl0IiwicG9wIiwiX2lzSW5NYXRjaFRpbWUiLCJtYXRjaFRpbWVSYW5nZXMiLCJtYXRjaF90aW1lX3JhbmdlcyIsInJhbmdlcyIsIkpTT04iLCJwYXJzZSIsImN1cnJlbnRNaW51dGVzIiwiZ2V0SG91cnMiLCJnZXRNaW51dGVzIiwicmFuZ2UiLCJzdGFydFBhcnRzIiwic3RhcnQiLCJlbmRQYXJ0cyIsImVuZCIsInN0YXJ0TWludXRlcyIsInBhcnNlSW50IiwiZW5kTWludXRlcyIsIl9jYW5TaWdudXBBcmVuYSIsIm1hdGNoRHVyYXRpb24iLCJtYXRjaF9kdXJhdGlvbiIsImludGVydmFsX21pbnV0ZXMiLCJpbnRlcnZhbE1pbnV0ZXMiLCJfZ2V0TmV4dFNpZ251cERlYWRsaW5lIiwiY3VycmVudFJhbmdlIiwicmFuZ2VTdGFydE1pbnV0ZXMiLCJzdGFydE1pbiIsImVuZE1pbiIsIm1pbnV0ZXNTaW5jZVN0YXJ0IiwicmVtYWluZGVyIiwibmV4dE1hdGNoTWludXRlcyIsImNlaWwiLCJkZWFkbGluZU1pbnV0ZXMiLCJob3VycyIsImZsb29yIiwibWlucyIsInRpbWVTdHIiLCJfZ2V0U2lnbnVwQ291bnRkb3duU2Vjb25kcyIsImN1cnJlbnRTZWNvbmRzIiwiZ2V0U2Vjb25kcyIsImN1cnJlbnRUb3RhbFNlY29uZHMiLCJyYW5nZVN0YXJ0U2Vjb25kcyIsIm1hdGNoRHVyYXRpb25TZWNvbmRzIiwiZWxhcHNlZFNlY29uZHMiLCJjb3VudGRvd24iLCJfZ2V0TmVhcmVzdE1hdGNoVGltZVJhbmdlIiwicGFyc2VkUmFuZ2VzIiwiciIsImluUmFuZ2UiLCJuZWFyZXN0UmFuZ2UiLCJtaW5EaWZmIiwiSW5maW5pdHkiLCJkaWZmIiwibWludXRlc1VudGlsU3RhcnQiLCJfZ2V0TmV4dE1hdGNoQ291bnRkb3duIiwiaW50ZXJ2YWxTZWNvbmRzIiwic2Vjb25kc0luQ3ljbGUiLCJyZW1haW5pbmdTZWNvbmRzIiwiaW5NYXRjaFRpbWUiLCJzZWNvbmRzIiwiX2Zvcm1hdENvdW50ZG93biIsInRvdGFsU2Vjb25kcyIsIm1pbnV0ZXMiLCJfZm9ybWF0TWF0Y2hUaW1lUmFuZ2UiLCJfZ2V0Q3VycmVudFBlcmlvZE5vIiwicGVyaW9kTm8iLCJwbGF5ZXJBcmVuYUNvaW4iLCJhcmVuYV9jb2luIiwiX2RvQ2FuY2VsU2lnbnVwIiwic2lnbnVwRmVlIiwiY2FuY2VsU2lnbnVwIiwiX2NvdW50ZG93blRpbWVyIiwiY2xlYXJJbnRlcnZhbCIsIl9sb2NhbEFyZW5hU3RhdHVzIiwib25BcmVuYVN0YXR1cyIsImFyZW5hcyIsIl9vbkFyZW5hU3RhdHVzUHVzaCIsIm9uQXJlbmFNYXRjaFN0YXJ0IiwiX29uQXJlbmFNYXRjaFN0YXJ0Iiwib25BcmVuYUNsb3NlRGlhbG9nIiwiX29uQXJlbmFDbG9zZURpYWxvZyIsIl9pbml0TG9jYWxBcmVuYVN0YXR1c0Zyb21Db25maWciLCJzZXRJbnRlcnZhbCIsIl91cGRhdGVMb2NhbENvdW50ZG93biIsIl9jbG9zZUFyZW5hTWF0Y2hTdGFydERpYWxvZyIsIl9jdXJyZW50TWF0Y2hEYXRhIiwiX3Nob3dBcmVuYU1hdGNoU3RhcnREaWFsb2ciLCJfYXJlbmFNYXRjaFN0YXJ0RGlhbG9nIiwibG9nIiwic3RyaW5naWZ5Iiwicm9vbV9pZCIsIl9hcmVuYU1hdGNoU3RhcnREaWFsb2dSb29tSWQiLCJkaWFsb2dOb2RlIiwiX2FyZW5hTWF0Y2hTdGFydERpYWxvZ1BlcmlvZE5vIiwicGVyaW9kX25vIiwicmVjdCIsImNhcmRHcmFwaGljcyIsInN0cm9rZUNvbG9yIiwibGluZVdpZHRoIiwic3Ryb2tlIiwicGVyaW9kTm9kZSIsInJvb21Ob2RlIiwicm9vbUxhYmVsIiwicGxheWVyc05vZGUiLCJwbGF5ZXJzTGFiZWwiLCJ0b3RhbF9wbGF5ZXJzIiwibXNnTm9kZSIsIm1zZ0xhYmVsIiwiYnRuWSIsImVudGVyQnRuIiwiZW50ZXJCZyIsImVudGVyTGFiZWxOb2RlIiwiZW50ZXJCdG5MYWJlbCIsImVudGVyQnV0dG9uQ29tcCIsIl9lbnRlckFyZW5hTWF0Y2giLCJjYW5jZWxCdG4iLCJjYW5jZWxCZyIsImNhbmNlbExhYmVsTm9kZSIsImNhbmNlbEJ0bkxhYmVsIiwiY2FuY2VsQnV0dG9uQ29tcCIsIl9jYW5jZWxBcmVuYVNpZ251cCIsInNlbmRBcmVuYUNhbmNlbFNpZ251cCIsIl9zaWduZWRVcEFyZW5hcyIsInNhdmVUb0xvY2FsIiwiY3VycmVudEFyZW5hTWF0Y2giLCJzZW5kQXJlbmFFbnRlciIsIl9zaG93TWVzc2FnZUNlbnRlciIsInJvb21Kb2luZWRIYW5kbGVyIiwiX2FyZW5hRW50ZXJUaW1lb3V0IiwiY2xlYXJUaW1lb3V0IiwicGxheWVycyIsImNvbnZlcnRlZFJvb21EYXRhIiwicm9vbWlkIiwicm9vbV9jb2RlIiwic2VhdGluZGV4IiwicGxheWVyIiwic2VhdCIsInBsYXllcmRhdGEiLCJtYXAiLCJwIiwiaWR4IiwiYWNjb3VudGlkIiwibmlja19uYW1lIiwiYXZhdGFyIiwiZ29sZF9jb3VudCIsImdvbGRjb3VudCIsImlzcmVhZHkiLCJyZWFkeSIsImFyZW5hX2dvbGQiLCJtYXRjaF9jb2luIiwiaG91c2VtYW5hZ2VpZCIsImNyZWF0b3JfaWQiLCJfZW50ZXJHYW1lU2NlbmUiLCJvblJvb21Kb2luZWQiLCJ0ZW1wUm9vbURhdGEiLCJyb29tX2NvbmZpZ19pZCIsInNpZ251cF9mZWUiLCJtYXRjaF9yb3VuZHMiLCJfZW50ZXJBcmVuYUdhbWVTY2VuZSIsIm1hdGNoRGF0YSIsImJvdHRvbSIsInJhdGUiLCJlbnRlckRlbGF5Iiwid2FpdF90aW1lIiwibWluIiwiX2FyZW5hRW50ZXJUaW1lciIsInBoYXNlSW5mbyIsIl9jYWxjdWxhdGVQaGFzZUluZm8iLCJwZXJpb2ROb1N0ciIsInBoYXNlIiwiY2FuU2lnbnVwIiwidG90YWxQbGF5ZXJzIiwic3RhdHVzVGV4dCIsImxhc3RVcGRhdGUiLCJpc0xvY2FsQ2FsY3VsYXRlZCIsIl91cGRhdGVDb3VudGRvd25Gcm9tTG9jYWxDYWNoZSIsImFyZW5hIiwibmV3UGVyaW9kTm9TdHIiLCJwZXJpb2Rfbm9fc3RyIiwib2xkU3RhdHVzIiwib2xkUGVyaW9kTm8iLCJjYW5fc2lnbnVwIiwic3RhdHVzX3RleHQiLCJuZWVkVXBkYXRlIiwidGltZVNpbmNlTGFzdFVwZGF0ZSIsIl9nZXRBcmVuYUNvbmZpZ0J5Um9vbUlkIiwicGVyaW9kVG90YWxTZWNvbmRzIiwicHJlcGFyZVNlY29uZHMiLCJwZXJpb2RFbGFwc2VkIiwieWVhciIsIlN0cmluZyIsImdldEZ1bGxZZWFyIiwic2xpY2UiLCJtb250aCIsImdldE1vbnRoIiwicGFkU3RhcnQiLCJkYXkiLCJnZXREYXRlIiwiZGF0ZVN0ciIsInJvb21JZFN0ciIsInNlcVN0ciIsImxvY2FsU3RhdHVzIiwic2VjcyIsImNvdW50ZG93blN0ciIsIl91cGRhdGVDb3VudGRvd25Gcm9tU2VydmVyIiwiX3VwZGF0ZUNvdW50ZG93bkRpc3BsYXkiLCJfc2hvd0xvYWRpbmdQcm9ncmVzcyIsImxvYWRpbmdOb2RlIiwiX2FkZExvYWRpbmdEZWNvcmF0aW9ucyIsInJvb21OYW1lTm9kZSIsInJvb21OYW1lTGFiZWwiLCJ0aXBOb2RlIiwidGlwTGFiZWwiLCJwcm9ncmVzc0JnIiwicHJvZ3Jlc3NCZ0dyYXBoaWNzIiwicHJvZ3Jlc3NGaWxsIiwicHJvZ3Jlc3NGaWxsR3JhcGhpY3MiLCJwZXJjZW50Tm9kZSIsInBlcmNlbnRMYWJlbCIsImJvdHRvbVRpcE5vZGUiLCJib3R0b21UaXBMYWJlbCIsImxvYWRpbmdUaXBzIiwicHJvZ3Jlc3MiLCJ0YXJnZXRQcm9ncmVzcyIsInRpcEluZGV4IiwidXBkYXRlUHJvZ3Jlc3MiLCJfc2hvd1Jvb21MaXN0U2NlbmUiLCJmaWxsV2lkdGgiLCJjbGVhciIsIm5ld1RpcEluZGV4IiwiY2FyZFN5bWJvbHMiLCJjYXJkQ29sb3JzIiwicG9zaXRpb25zIiwidjIiLCJzeW1ib2xOb2RlIiwic3ltYm9sTGFiZWwiLCJvbGRTY2VuZSIsInNjZW5lTm9kZSIsIl9jcmVhdGVSb29tTGlzdEJhY2tncm91bmQiLCJfY3JlYXRlUm9vbUxpc3RIZWFkZXIiLCJfY3JlYXRlUm9vbUxpc3RBY3Rpb25zIiwiX2NyZWF0ZVJvb21MaXN0Q29udGVudCIsIl9jcmVhdGVSb29tTGlzdEZvb3RlciIsImJvcmRlck5vZGUiLCJib3JkZXJHcmFwaGljcyIsImNvcm5lcnMiLCJyb3QiLCJjb3JuZXIiLCJjb3JuZXJOb2RlIiwiY2ciLCJtb3ZlVG8iLCJsaW5lVG8iLCJoZWFkZXJZIiwiaGVhZGVySGVpZ2h0IiwiaGVhZGVyQmciLCJoZyIsImxlZnREZWNvIiwibGQiLCJjaXJjbGUiLCJyaWdodERlY28iLCJyZCIsInN1YlRleHQiLCJzdWJMYWJlbCIsImFjdGlvbkJhclkiLCJhY3Rpb25CYXJIZWlnaHQiLCJhY3Rpb25CYXJCZyIsImFiZyIsImxlZnRYIiwicm9vbUNvZGVJbnB1dCIsIl9jcmVhdGVTaW1wbGVJbnB1dEJveCIsImpvaW5CdG4iLCJfY3JlYXRlQWN0aW9uQnV0dG9uIiwiaW5wdXQiLCJlZGl0Qm94IiwiRWRpdEJveCIsIl9qb2luUm9vbSIsIl9zaG93VGlwSW5TY2VuZSIsInJpZ2h0WCIsImNyZWF0ZUJ0biIsIl9zaG93Q3JlYXRlUm9vbURpYWxvZyIsInF1aWNrQnRuIiwic2NlbmUiLCJwbGFjZWhvbGRlciIsImlucHV0Tm9kZSIsImJnIiwiZm9udENvbG9yIiwicGxhY2Vob2xkZXJGb250U2l6ZSIsInBsYWNlaG9sZGVyRm9udENvbG9yIiwibWF4TGVuZ3RoIiwiaW5wdXRNb2RlIiwiSW5wdXRNb2RlIiwiTlVNRVJJQyIsInJldHVyblR5cGUiLCJLZXlib2FyZFJldHVyblR5cGUiLCJET05FIiwidGV4dCIsImNhbGxiYWNrIiwidGV4dE5vZGUiLCJUT1VDSF9TVEFSVCIsIlRPVUNIX0NBTkNFTCIsImxpc3RZIiwibGlzdEhlaWdodCIsImxpc3RXaWR0aCIsImxpc3RCZyIsImxnIiwiaGJnIiwiY29sV2lkdGgiLCJoZWFkZXJzIiwiaE5vZGUiLCJobCIsInJvb21Db250YWluZXIiLCJsbCIsIl9mZXRjaEFuZFJlbmRlclJvb21MaXN0Rm9yU2NlbmUiLCJmb290ZXJZIiwiZm9vdGVyQmciLCJmZyIsImJhY2tCdG4iLCJnb2xkSWNvbiIsImdnIiwiZ29sZFRleHQiLCJnbCIsInJlZnJlc2hCdG4iLCJjb250YWluZXIiLCJsb2FkaW5nIiwiX2NyZWF0ZUJ1dHRvbk5vZGUiLCJpc1ByaW1hcnkiLCJib3JkZXJDb2xvciIsImciLCJvdmVyZmxvdyIsIk92ZXJmbG93IiwiTk9ORSIsIl9jcmVhdGVJbWFnZUJ1dHRvbk5vZGUiLCJpbWFnZVBhdGgiLCJfY3JlYXRlQnV0dG9uRmFsbGJhY2siLCJncmFwaGljcyIsImxhYmVsTm9kZSIsIl9jcmVhdGVJbnB1dE5vZGUiLCJwbGFjZWhvbGRlck5vZGUiLCJfY3JlYXRlU3R5bGVkQnV0dG9uIiwib2xkRGlhbG9nIiwiZGlhbG9nIiwibWFzayIsIm1hc2tHIiwiZGlhbG9nV2lkdGgiLCJkaWFsb2dIZWlnaHQiLCJkaWFsb2dCZyIsImRiZyIsImhlYWRlckJhciIsInR0bCIsImNsb3NlQnRuIiwiY2JnIiwiY2xvc2VYIiwiY2xvc2VMYWJlbCIsInJvb21UeXBlQmciLCJydGJnIiwicm9vbVR5cGVUZXh0IiwicnRsIiwibmFtZUxhYmVsIiwibmxsIiwibmFtZUlucHV0RGF0YSIsInZhbHVlIiwibmFtZUlucHV0QnRuIiwiX2NyZWF0ZUVkaXRCb3hJbnB1dCIsInB3ZExhYmVsIiwicGxsIiwicHdkSW5wdXREYXRhIiwicHdkSW5wdXRCdG4iLCJfY3JlYXRlRGlhbG9nQnV0dG9uIiwibmFtZUlucHV0IiwicHdkSW5wdXQiLCJuYW1lRWRpdEJveCIsInB3ZEVkaXRCb3giLCJwYXNzd29yZCIsImNyZWF0ZVJvb21JbmZvIiwiX2NyZWF0ZVJvb20iLCJkYXRhUmVmIiwiQU5ZIiwiZWRpdGJveCIsIl9jcmVhdGVJbnB1dERpYWxvZ0lucHV0IiwicHJvbXB0IiwiX2NyZWF0ZUJlYXV0aWZ1bElucHV0IiwiX2NyZWF0ZUJlYXV0aWZ1bEJ1dHRvbiIsIl9jcmVhdGVEaWFsb2dJbnB1dCIsIl9zaG93UGFzc3dvcmREaWFsb2ciLCJyb29tQ29kZSIsImNvZGVUZXh0IiwiY3RsIiwiY29uZmlybUJ0biIsInB3ZElucHV0Tm9kZSIsIl9zaG93VGlwSW5EaWFsb2ciLCJ0aXAiLCJsb2FkaW5nTGFiZWwiLCJjdXJyZW50Um9vbXMiLCJyb29tTGlzdFVwZGF0ZUhhbmRsZXIiLCJhY3Rpb25UeXBlIiwiYWN0aW9uX3R5cGUiLCJleGlzdHMiLCJzb21lIiwiZmlsdGVyIiwiZmlsdGVyZWRSb29tcyIsImNvdW50IiwicGxheWVyX2NvdW50IiwicGxheWVyQ291bnQiLCJfcmVuZGVyUm9vbUxpc3RJblNjZW5lIiwib25Sb29tTGlzdFVwZGF0ZSIsIl9yb29tTGlzdFVwZGF0ZUhhbmRsZXIiLCJ0aW1lb3V0SWQiLCJnZXRSb29tTGlzdCIsImNvbnRhaW5lcldpZHRoIiwic3RhcnRZIiwiZW1wdHlOb2RlIiwiZWwiLCJpdGVtWSIsIml0ZW1CZyIsImlnIiwiY2wiLCJjb3VudFRleHQiLCJzY29yZVRleHQiLCJzbCIsInN0bCIsIl9zaG93Um9vbUxpc3REaWFsb2ciLCJvbGRUaXAiLCJtYXNrR3JhcGhpY3MiLCJzdWJUaXRsZU5vZGUiLCJzdWJUaXRsZUxhYmVsIiwibGlzdENvbnRhaW5lciIsImJ0bkNvbnRhaW5lciIsInF1aWNrTWF0Y2hCdG4iLCJfY3JlYXRlQnV0dG9uIiwiaW5wdXRDb250YWluZXIiLCJpbnB1dExhYmVsIiwiaW5wdXRMYWJlbENvbXAiLCJpbnB1dEJnTm9kZSIsImlucHV0QmciLCJpbnB1dFRleHQiLCJfZmV0Y2hSb29tTGlzdCIsIl9yZW5kZXJSb29tTGlzdCIsImVtcHR5QmciLCJlbXB0eUxhYmVsIiwiaXRlbSIsImNvZGVMYWJlbCIsImNvdW50TGFiZWwiLCJfd2FpdEZvckNvbm5lY3Rpb25BbmRTbWFydE1hdGNoIiwiX3NtYXJ0TWF0Y2giLCJfaGlkZU1lc3NhZ2VDZW50ZXIiLCJ3YWl0aW5nUm9vbSIsIndhaXRpbmdSb29tQ29kZSIsInRyeUNvbm5lY3QiLCJfc2VuZFF1aWNrTWF0Y2hSZXF1ZXN0IiwicmVxdWVzdF9lbnRlcl9yb29tIiwiX2VudGVyUm9vbVRpbWVvdXQiLCJyb29tX2xldmVsIiwiX3dhaXRGb3JDb25uZWN0aW9uQW5kQ3JlYXRlUm9vbSIsIl9zZW5kQ3JlYXRlUm9vbVJlcXVlc3QiLCJjcmVhdGVSb29tIiwicGxheWVySWQiLCJnZXRQbGF5ZXJJbmZvIiwicGxheWVySW5mbyIsInJvb21Db25maWdJZCIsInNlcnZlclBsYXllciIsImFjY291bnRJRCIsInVuaXF1ZUlEIiwic2F2ZVJlY29ubmVjdEluZm8iLCJfd2FpdEZvckNvbm5lY3Rpb25BbmRKb2luUm9vbSIsIl9zZW5kSm9pblJvb21SZXF1ZXN0Iiwiam9pblJvb20iLCJjcmVhdG9ySWQiLCJfd2FpdEZvckNvbm5lY3Rpb25BbmRFbnRlclJvb20iLCJ0cnlFbnRlciIsImdvbGQiLCJ0b0ZpeGVkIiwidG9TdHJpbmciLCJfc2hvd1F1aWNrRW50ZXJBbmltYXRpb24iLCJydW5TY2VuZUltbWVkaWF0ZSIsIlNjZW5lIiwibWFza05vZGUiLCJvcGFjaXR5IiwiQmxvY2tJbnB1dEV2ZW50cyIsImxvYWRpbmdJbWFnZU5vZGUiLCJ0d2VlbiIsInRvIiwiX3F1aWNrRW50ZXJNYXNrIiwiX2NlbnRlclRpcE5vZGUiLCJub3RpY2VOYW1lcyIsIl9oaWRlTm9kZXNXaXRoVGV4dCIsIl9oaWRlQmFja2dyb3VuZExhYmVscyIsImxhYmVsc1RvSGlkZSIsIm5vZGVzIiwiX2ZpbmROb2Rlc0J5TmFtZSIsImoiLCJzdWJSZXN1bHRzIiwiY29uY2F0IiwicGxheWVyTm9kZSIsInl1YW5iYW9JY29uIiwiZ29sZEZyYW1lIiwic2VhcmNoVGV4dCIsIl9jcmVhdGVFbnRlclJvb21CdXR0b24iLCJvbGRCdG4iLCJfY3JlYXRlRW50ZXJSb29tQnV0dG9uRmFsbGJhY2siLCJfc2hvd0VudGVyUm9vbVBvcHVwIiwiaWNvbk5vZGUiLCJpY29uTGFiZWwiLCJvbGRQb3B1cCIsInBvcHVwIiwiYmdNYXNrIiwiYmdHZngiLCJzaGFkb3ciLCJzaGFkb3dHZngiLCJtYWluQmciLCJtYWluR2Z4IiwidG9wQmFyIiwidG9wR2Z4IiwidGl0bGVCZyIsInRpdGxlQmdHZngiLCJzdWJ0aXRsZU5vZGUiLCJzdWJ0aXRsZUxhYmVsIiwiaW5wdXRBcmVhWSIsImlucHV0R2Z4IiwiaW5wdXRGbGFnIiwiSW5wdXRGbGFnIiwiU0VOU0lUSVZFIiwiYmFja2dyb3VuZENvbG9yIiwidGlwQmciLCJ0aXBHZngiLCJ0aXBJY29uIiwidGlwSWNvbkxhYmVsIiwiY2FuY2VsR2Z4IiwiY2FuY2VsTGFiZWwiLCJjYW5jZWxMYWJlbENvbXAiLCJjYW5jZWxCdG5Db21wIiwiY29uZmlybUdmeCIsImNvbmZpcm1JY29uIiwiY29uZmlybUljb25MYWJlbCIsImNvbmZpcm1MYWJlbCIsImNvbmZpcm1MYWJlbENvbXAiLCJjb25maXJtQnRuQ29tcCIsIl9qb2luUm9vbUJ5SWQiLCJjbG9zZUdmeCIsInJlcXVlc3Rfam9pblJvb20iLCJfdXBkYXRlQ3VycmVuY3lJY29uIiwiY3VycmVuY3lJY29uIiwiX3Nob3dTaWdudXBEaWFsb2ciLCJyb29tTmFtZVRleHQiLCJybmwiLCJmZWVMYWJlbCIsImZsIiwiZmVlVmFsdWUiLCJmdiIsImJhbGFuY2VMYWJlbCIsImJsIiwiYmFsYW5jZVZhbHVlIiwiYnYiLCJyZXdhcmRMYWJlbCIsInJsIiwiY2hhbXBpb25SZXdhcmQiLCJjaGFtcGlvbl9yZXdhcmQiLCJjb2lucyIsInJld2FyZFZhbHVlIiwicnYiLCJpc0Vub3VnaCIsIl9kb1NpZ251cCIsImFkQnRuIiwiX3Nob3dTaWduZWRVcERpYWxvZyIsImNvdW50ZG93bkxhYmVsIiwidXBkYXRlQ291bnRkb3duIiwiZ2V0Q291bnRkb3duIiwiZm9ybWF0Q291bnRkb3duIiwiY2FuY2VsU2lnbnVwQnRuIiwiX2NhbmNlbFNpZ251cCIsIm5lZWRlZEFtb3VudCIsImRlc2NUZXh0IiwiZGwiLCJhZEljb24iLCJhaWwiLCJ3YXRjaEJ0biIsIl93YXRjaEFkQW5kR2V0UmV3YXJkIiwid2F0Y2hBZEZvclJld2FyZCIsIm9uRGVzdHJveSIsImNsZWFyQWxsQ291bnRkb3ducyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBRUE7QUFFQUEsRUFBRSxDQUFDQyxLQUFIO0VBQ0ksV0FBU0QsRUFBRSxDQUFDRSxTQURoQjtFQUdJQyxVQUFVLEVBQUU7SUFDUkMsY0FBYyxFQUFFSixFQUFFLENBQUNLLEtBRFg7SUFFUkMsU0FBUyxFQUFFTixFQUFFLENBQUNPLE1BRk47SUFHUkMsV0FBVyxFQUFFUixFQUFFLENBQUNLLEtBSFI7SUFJUjtJQUNBSSxnQkFBZ0IsRUFBRVQsRUFBRSxDQUFDSyxLQUxiO0lBTVJLLGlCQUFpQixFQUFFVixFQUFFLENBQUNXLE1BTmQ7SUFPUkMsZ0JBQWdCLEVBQUVaLEVBQUUsQ0FBQ1csTUFQYjtJQVFSRSxzQkFBc0IsRUFBRWIsRUFBRSxDQUFDVztFQVJuQixDQUhoQjtFQWNJRyxNQWRKLG9CQWNjO0lBRU4sSUFBSSxDQUFDQyxNQUFNLENBQUNDLFFBQVosRUFBc0I7TUFDbEJDLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLHVCQUFiOztNQUNBLEtBQUtDLGdCQUFMOztNQUNBO0lBQ0g7O0lBRUQsS0FBS0MsbUJBQUw7RUFDSCxDQXZCTDtFQXlCSTtFQUNBQyxNQUFNLEVBQUUsZ0JBQVNDLEVBQVQsRUFBYTtJQUNqQjtJQUNBLElBQUksS0FBS0Msc0JBQUwsSUFBK0IsS0FBS0MsaUJBQXBDLElBQXlELEtBQUtBLGlCQUFMLENBQXVCQyxPQUFwRixFQUE2RjtNQUN6RixLQUFLRCxpQkFBTCxDQUF1QkUsS0FBdkIsSUFBZ0NKLEVBQUUsR0FBRyxHQUFyQztJQUNILENBSmdCLENBS2pCOzs7SUFDQSxJQUFJLEtBQUtLLG9CQUFMLElBQTZCLEtBQUtDLHNCQUFsQyxJQUE0RCxLQUFLQSxzQkFBTCxDQUE0QkgsT0FBNUYsRUFBcUc7TUFDakcsS0FBS0csc0JBQUwsQ0FBNEJGLEtBQTVCLElBQXFDSixFQUFFLEdBQUcsR0FBMUM7SUFDSDtFQUNKLENBbkNMO0VBcUNJSCxnQkFBZ0IsRUFBRSw0QkFBVztJQUN6QixJQUFJVSxJQUFJLEdBQUcsSUFBWDtJQUNBLElBQUlDLFFBQVEsR0FBRyxDQUFmO0lBQ0EsSUFBSUMsV0FBVyxHQUFHLEVBQWxCOztJQUVBLElBQUlDLEtBQUssR0FBRyxTQUFSQSxLQUFRLEdBQVc7TUFDbkJGLFFBQVE7O01BQ1IsSUFBSWYsTUFBTSxDQUFDQyxRQUFQLElBQW1CRCxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JpQixVQUF2QyxFQUFtRDtRQUMvQ0osSUFBSSxDQUFDVCxtQkFBTDtNQUNILENBRkQsTUFFTyxJQUFJVSxRQUFRLEdBQUdDLFdBQWYsRUFBNEI7UUFDL0JHLFVBQVUsQ0FBQ0YsS0FBRCxFQUFRLEdBQVIsQ0FBVjtNQUNILENBRk0sTUFFQTtRQUNIZixPQUFPLENBQUNrQixLQUFSLENBQWMsZ0JBQWQ7UUFDQW5DLEVBQUUsQ0FBQ29DLFFBQUgsQ0FBWUMsU0FBWixDQUFzQixZQUF0QjtNQUNIO0lBQ0osQ0FWRDs7SUFZQUgsVUFBVSxDQUFDRixLQUFELEVBQVEsR0FBUixDQUFWO0VBQ0gsQ0F2REw7RUF5RElaLG1CQUFtQixFQUFFLCtCQUFXO0lBQzVCLElBQUlKLFFBQVEsR0FBR0QsTUFBTSxDQUFDQyxRQUF0Qjs7SUFFQSxJQUFJLENBQUNBLFFBQUQsSUFBYSxDQUFDQSxRQUFRLENBQUNpQixVQUEzQixFQUF1QztNQUNuQ2hCLE9BQU8sQ0FBQ2tCLEtBQVIsQ0FBYywyQkFBZDtNQUNBbkMsRUFBRSxDQUFDb0MsUUFBSCxDQUFZQyxTQUFaLENBQXNCLFlBQXRCO01BQ0E7SUFDSDs7SUFFRCxJQUFJSixVQUFVLEdBQUdqQixRQUFRLENBQUNpQixVQUExQjs7SUFFQSxJQUFJLENBQUNBLFVBQVUsQ0FBQ0ssS0FBaEIsRUFBdUI7TUFDbkJ0QyxFQUFFLENBQUNvQyxRQUFILENBQVlDLFNBQVosQ0FBc0IsWUFBdEI7TUFDQTtJQUNIOztJQUVELElBQUlSLElBQUksR0FBRyxJQUFYLENBaEI0QixDQWtCNUI7O0lBQ0EsSUFBSSxPQUFPYixRQUFRLENBQUN1QixXQUFoQixLQUFnQyxVQUFwQyxFQUFnRDtNQUM1Q3RCLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLHdCQUFiOztNQUNBVyxJQUFJLENBQUNXLGdCQUFMOztNQUNBO0lBQ0g7O0lBRUQsSUFBSTtNQUNBeEIsUUFBUSxDQUFDdUIsV0FBVCxDQUFxQixVQUFTRSxLQUFULEVBQWdCQyxPQUFoQixFQUF5QjtRQUMxQyxJQUFJLENBQUNELEtBQUwsRUFBWTtVQUNSekMsRUFBRSxDQUFDb0MsUUFBSCxDQUFZQyxTQUFaLENBQXNCLFlBQXRCO1VBQ0E7UUFDSDs7UUFDRFIsSUFBSSxDQUFDVyxnQkFBTDtNQUNILENBTkQ7SUFPSCxDQVJELENBUUUsT0FBT0csQ0FBUCxFQUFVO01BQ1IxQixPQUFPLENBQUNrQixLQUFSLENBQWMsbUJBQWQsRUFBbUNRLENBQW5DOztNQUNBZCxJQUFJLENBQUNXLGdCQUFMO0lBQ0g7RUFDSixDQTlGTDtFQWdHSUEsZ0JBQWdCLEVBQUUsNEJBQVc7SUFFekIsSUFBSTtNQUNBLElBQUl4QixRQUFRLEdBQUdELE1BQU0sQ0FBQ0MsUUFBdEI7TUFDQSxJQUFJaUIsVUFBVSxHQUFHakIsUUFBUSxHQUFHQSxRQUFRLENBQUNpQixVQUFaLEdBQXlCLElBQWxEOztNQUVBLElBQUksQ0FBQ0EsVUFBTCxFQUFpQjtRQUNiaEIsT0FBTyxDQUFDQyxJQUFSLENBQWEscUJBQWI7UUFDQWUsVUFBVSxHQUFHO1VBQUVXLFFBQVEsRUFBRSxJQUFaO1VBQWtCcEMsV0FBVyxFQUFFLENBQS9CO1VBQWtDcUMsU0FBUyxFQUFFO1FBQTdDLENBQWI7TUFDSCxDQVBELENBU0E7TUFDQTs7O01BQ0EsSUFBSUMsYUFBYSxHQUFHLEtBQUsxQyxjQUF6QixDQVhBLENBYUE7O01BQ0EsSUFBSSxDQUFDMEMsYUFBRCxJQUFrQkEsYUFBYSxDQUFDQyxNQUFkLEtBQXlCQyxTQUEvQyxFQUEwRDtRQUN0RDtRQUNBLElBQUlDLFlBQVksR0FBRyxLQUFLQyxlQUFMLENBQXFCLEtBQUtDLElBQTFCLEVBQWdDLGdCQUFoQyxDQUFuQjs7UUFDQSxJQUFJRixZQUFKLEVBQWtCO1VBQ2RILGFBQWEsR0FBR0csWUFBWSxDQUFDRyxZQUFiLENBQTBCcEQsRUFBRSxDQUFDSyxLQUE3QixDQUFoQjtRQUNIO01BQ0o7O01BQ0QsSUFBSXlDLGFBQUosRUFBbUI7UUFDZkEsYUFBYSxDQUFDQyxNQUFkLEdBQXVCZCxVQUFVLENBQUNXLFFBQVgsSUFBdUIsSUFBOUM7TUFDSCxDQUZELE1BRU87UUFDSDNCLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLGdDQUFiO01BQ0gsQ0F6QkQsQ0EyQkE7TUFDQTs7O01BQ0EsS0FBS21DLG9CQUFMLEdBQTRCLENBQTVCLENBN0JBLENBNkJnQzs7TUFDaEMsS0FBS0Msc0JBQUw7O01BRUEsS0FBS0MsMkJBQUw7O01BQ0EsS0FBS0MsZUFBTCxDQUFxQnZCLFVBQVUsQ0FBQ1ksU0FBaEM7O01BQ0EsS0FBS1ksV0FBTCxHQUFtQixFQUFuQixDQWxDQSxDQW9DQTs7TUFDQSxLQUFLQyxxQkFBTCxHQXJDQSxDQXVDQTs7O01BQ0EsS0FBS0MscUJBQUw7O01BRUEsS0FBS0Msd0JBQUw7O01BQ0EsS0FBS0Msb0JBQUw7O01BQ0EsS0FBS0MseUJBQUw7O01BQ0EsS0FBS0MsY0FBTCxHQTdDQSxDQTZDd0I7OztNQUN4QixLQUFLQyxzQkFBTCxHQTlDQSxDQThDZ0M7OztNQUNoQyxLQUFLQyxpQkFBTDs7TUFDQSxLQUFLQyxrQkFBTCxHQWhEQSxDQWlEQTtNQUNBO01BRUE7OztNQUNBLEtBQUtDLGlCQUFMO0lBRUgsQ0F2REQsQ0F1REUsT0FBT3hCLENBQVAsRUFBVTtNQUNSMUIsT0FBTyxDQUFDa0IsS0FBUixDQUFjLHNCQUFkLEVBQXNDUSxDQUF0QztJQUNIO0VBQ0osQ0E1Skw7RUE4Skk7RUFDQXFCLHNCQUFzQixFQUFFLGtDQUFXO0lBQy9CLElBQUloRCxRQUFRLEdBQUdELE1BQU0sQ0FBQ0MsUUFBdEI7O0lBQ0EsSUFBSSxDQUFDQSxRQUFMLEVBQWU7TUFDWEMsT0FBTyxDQUFDQyxJQUFSLENBQWEsdUJBQWI7TUFDQTtJQUNILENBTDhCLENBUS9COzs7SUFDQSxJQUFJRixRQUFRLENBQUNvRCxxQkFBYixFQUFvQztNQUNoQ3BELFFBQVEsQ0FBQ29ELHFCQUFUO0lBQ0gsQ0FYOEIsQ0FhL0I7OztJQUNBLElBQUl2QyxJQUFJLEdBQUcsSUFBWDs7SUFDQSxLQUFLd0Msb0JBQUwsR0FBNEIsVUFBU0MsUUFBVCxFQUFtQjtNQUMzQztNQUNBLElBQUksQ0FBQ0EsUUFBRCxJQUFhLENBQUN0RCxRQUFRLENBQUN1RCxlQUEzQixFQUE0QztRQUN4QzFDLElBQUksQ0FBQzJDLG1CQUFMO01BQ0gsQ0FGRCxNQUVPLElBQUksQ0FBQ0YsUUFBRCxJQUFhdEQsUUFBUSxDQUFDdUQsZUFBMUIsRUFBMkMsQ0FDakQ7SUFDSixDQU5EOztJQVFBLElBQUl2RCxRQUFRLENBQUN5RCx1QkFBYixFQUFzQztNQUNsQ3pELFFBQVEsQ0FBQ3lELHVCQUFULENBQWlDLEtBQUtKLG9CQUF0QztJQUNILENBekI4QixDQTJCL0I7OztJQUNBLElBQUlyRCxRQUFRLENBQUMwRCxXQUFiLEVBQTBCO01BQ3RCMUQsUUFBUSxDQUFDMEQsV0FBVCxDQUFxQkMsRUFBckIsQ0FBd0IsY0FBeEIsRUFBd0MsVUFBU0MsSUFBVCxFQUFlO1FBQ25EM0QsT0FBTyxDQUFDQyxJQUFSLENBQWEsY0FBYixFQUE2QjBELElBQTdCOztRQUNBL0MsSUFBSSxDQUFDZ0Qsa0JBQUwsQ0FBd0JELElBQXhCO01BQ0gsQ0FIRDtJQUlIO0VBQ0osQ0FqTUw7RUFtTUk7RUFDQUosbUJBQW1CLEVBQUUsK0JBQVc7SUFDNUIsS0FBS00sWUFBTCxDQUFrQixtQkFBbEI7RUFDSCxDQXRNTDtFQXdNSTtFQUNBRCxrQkFBa0IsRUFBRSw0QkFBU0QsSUFBVCxFQUFlO0lBQy9CLElBQUlHLE1BQU0sR0FBR0gsSUFBSSxDQUFDRyxNQUFMLElBQWUsU0FBNUI7O0lBQ0EsS0FBS0QsWUFBTCxDQUFrQkMsTUFBbEIsRUFGK0IsQ0FJL0I7OztJQUNBLElBQUkvRCxRQUFRLEdBQUdELE1BQU0sQ0FBQ0MsUUFBdEI7O0lBQ0EsSUFBSUEsUUFBUSxJQUFJQSxRQUFRLENBQUNnRSxvQkFBekIsRUFBK0M7TUFDM0NoRSxRQUFRLENBQUNnRSxvQkFBVDtJQUNILENBUjhCLENBVS9COzs7SUFDQSxLQUFLQyxZQUFMLENBQWtCLFlBQVc7TUFDekJqRixFQUFFLENBQUNvQyxRQUFILENBQVlDLFNBQVosQ0FBc0IsWUFBdEI7SUFDSCxDQUZELEVBRUcsQ0FGSDtFQUdILENBdk5MO0VBeU5JO0VBQ0E2QyxxQkFBcUIsRUFBRSxpQ0FBVztJQUM5QixJQUFJbEUsUUFBUSxHQUFHRCxNQUFNLENBQUNDLFFBQXRCOztJQUVBLElBQUlBLFFBQVEsSUFBSUEsUUFBUSxDQUFDZ0Usb0JBQXpCLEVBQStDO01BQzNDaEUsUUFBUSxDQUFDZ0Usb0JBQVQ7SUFDSDs7SUFFRCxJQUFJaEUsUUFBUSxJQUFJQSxRQUFRLENBQUNtRSwwQkFBckIsSUFBbUQsS0FBS2Qsb0JBQTVELEVBQWtGO01BQzlFckQsUUFBUSxDQUFDbUUsMEJBQVQsQ0FBb0MsS0FBS2Qsb0JBQXpDO01BQ0EsS0FBS0Esb0JBQUwsR0FBNEIsSUFBNUI7SUFDSDtFQUNKLENBck9MO0VBdU9JO0VBQ0FGLGlCQUFpQixFQUFFLDZCQUFXO0lBQzFCLElBQUl0QyxJQUFJLEdBQUcsSUFBWDtJQUNBLElBQUl1RCxTQUFTLEdBQUdDLElBQUksQ0FBQ0MsR0FBTCxFQUFoQixDQUYwQixDQUkxQjs7SUFDQXRGLEVBQUUsQ0FBQ29DLFFBQUgsQ0FBWW1ELFlBQVosQ0FBeUIsV0FBekIsRUFBc0MsVUFBU0MsR0FBVCxFQUFjO01BQ2hELElBQUlBLEdBQUosRUFBUztRQUNMdkUsT0FBTyxDQUFDa0IsS0FBUixDQUFjLHFCQUFkLEVBQXFDcUQsR0FBckM7UUFDQTtNQUNIOztNQUNELElBQUlDLE9BQU8sR0FBR0osSUFBSSxDQUFDQyxHQUFMLEtBQWFGLFNBQTNCLENBTGdELENBTWhEOztNQUNBdkQsSUFBSSxDQUFDNkQsbUJBQUwsR0FBMkIsSUFBM0I7SUFDSCxDQVJEO0VBU0gsQ0F0UEw7RUF3UEk7RUFDQTNCLGNBQWMsRUFBRSwwQkFBVztJQUN2QixJQUFJL0MsUUFBUSxHQUFHRCxNQUFNLENBQUNDLFFBQXRCOztJQUNBLElBQUksQ0FBQ0EsUUFBRCxJQUFhLENBQUNBLFFBQVEsQ0FBQzJFLE1BQTNCLEVBQW1DO01BQy9CMUUsT0FBTyxDQUFDQyxJQUFSLENBQWEsYUFBYjtNQUNBO0lBQ0gsQ0FMc0IsQ0FPdkI7OztJQUNBLElBQUlGLFFBQVEsQ0FBQzJFLE1BQVQsQ0FBZ0JDLGVBQWhCLElBQW1DNUUsUUFBUSxDQUFDMkUsTUFBVCxDQUFnQkMsZUFBaEIsRUFBdkMsRUFBMEU7TUFDdEU7SUFDSCxDQVZzQixDQVl2Qjs7O0lBQ0EsSUFBSTVFLFFBQVEsQ0FBQzJFLE1BQVQsQ0FBZ0JFLFdBQWhCLElBQStCN0UsUUFBUSxDQUFDMkUsTUFBVCxDQUFnQkUsV0FBaEIsRUFBbkMsRUFBa0U7TUFDOUQ7SUFDSCxDQWZzQixDQWtCdkI7OztJQUNBLElBQUk3RSxRQUFRLENBQUMyRSxNQUFULENBQWdCRyxVQUFwQixFQUFnQztNQUM1QjlFLFFBQVEsQ0FBQzJFLE1BQVQsQ0FBZ0JHLFVBQWhCO0lBQ0g7RUFDSixDQS9RTDtFQWlSSTtFQUNBNUMsZUFBZSxFQUFFLHlCQUFTNkMsVUFBVCxFQUFxQkMsUUFBckIsRUFBK0I7SUFDNUM7SUFDQSxJQUFJQyxLQUFLLEdBQUdGLFVBQVUsQ0FBQ0csY0FBWCxDQUEwQkYsUUFBMUIsQ0FBWjtJQUNBLElBQUlDLEtBQUosRUFBVyxPQUFPQSxLQUFQLENBSGlDLENBSzVDOztJQUNBLElBQUlFLFFBQVEsR0FBR0osVUFBVSxDQUFDSSxRQUExQjs7SUFDQSxLQUFLLElBQUlDLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdELFFBQVEsQ0FBQ0UsTUFBN0IsRUFBcUNELENBQUMsRUFBdEMsRUFBMEM7TUFDdEMsSUFBSUUsS0FBSyxHQUFHSCxRQUFRLENBQUNDLENBQUQsQ0FBcEI7TUFDQUgsS0FBSyxHQUFHLEtBQUsvQyxlQUFMLENBQXFCb0QsS0FBckIsRUFBNEJOLFFBQTVCLENBQVI7TUFDQSxJQUFJQyxLQUFKLEVBQVcsT0FBT0EsS0FBUDtJQUNkOztJQUNELE9BQU8sSUFBUDtFQUNILENBL1JMO0VBaVNJbkMseUJBQXlCLEVBQUUscUNBQVc7SUFDbEMsSUFBSXlDLFNBQVMsR0FBRyxLQUFLcEQsSUFBTCxDQUFVK0MsY0FBVixDQUF5QixXQUF6QixDQUFoQjtJQUNBLElBQUlNLFNBQVMsR0FBRyxLQUFLckQsSUFBTCxDQUFVK0MsY0FBVixDQUF5QixXQUF6QixDQUFoQjtJQUNBLElBQUlLLFNBQUosRUFBZUEsU0FBUyxDQUFDRSxNQUFWLEdBQW1CLEtBQW5CO0lBQ2YsSUFBSUQsU0FBSixFQUFlQSxTQUFTLENBQUNDLE1BQVYsR0FBbUIsS0FBbkI7RUFDbEIsQ0F0U0w7RUF3U0k7RUFDQTVDLG9CQUFvQixFQUFFLGdDQUFXO0lBQzdCLElBQUloQyxJQUFJLEdBQUcsSUFBWDtJQUNBLElBQUk2RSxNQUFNLEdBQUcsS0FBS3ZELElBQUwsQ0FBVUMsWUFBVixDQUF1QnBELEVBQUUsQ0FBQzJHLE1BQTFCLEtBQXFDM0csRUFBRSxDQUFDNEcsSUFBSCxDQUFRLFFBQVIsRUFBa0J4RCxZQUFsQixDQUErQnBELEVBQUUsQ0FBQzJHLE1BQWxDLENBQWxEO0lBQ0EsSUFBSUUsWUFBWSxHQUFHSCxNQUFNLEdBQUdBLE1BQU0sQ0FBQ0ksZ0JBQVAsQ0FBd0JDLE1BQTNCLEdBQW9DLEdBQTdEO0lBQ0EsSUFBSUMsV0FBVyxHQUFHTixNQUFNLEdBQUdBLE1BQU0sQ0FBQ0ksZ0JBQVAsQ0FBd0JHLEtBQTNCLEdBQW1DLElBQTNELENBSjZCLENBTTdCOztJQUNBLElBQUlDLFdBQVcsR0FBRyxDQUNkLGlCQURjLEVBRWQsZUFGYyxFQUdkLG9CQUhjLEVBSWQsZ0JBSmMsRUFLZCxhQUxjLEVBTWQsVUFOYyxDQUFsQixDQVA2QixDQWdCN0I7O0lBQ0EsSUFBSUMsT0FBTyxHQUFHLEVBQWQ7O0lBQ0EsS0FBSyxJQUFJZixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHYyxXQUFXLENBQUNiLE1BQWhDLEVBQXdDRCxDQUFDLEVBQXpDLEVBQTZDO01BQ3pDLElBQUlnQixHQUFHLEdBQUcsS0FBS2pFLElBQUwsQ0FBVStDLGNBQVYsQ0FBeUJnQixXQUFXLENBQUNkLENBQUQsQ0FBcEMsQ0FBVjs7TUFDQSxJQUFJZ0IsR0FBRyxJQUFJQSxHQUFHLENBQUNYLE1BQUosS0FBZSxLQUExQixFQUFpQztRQUM3QlUsT0FBTyxDQUFDRSxJQUFSLENBQWFELEdBQWI7TUFDSDtJQUNKLENBdkI0QixDQXlCN0I7OztJQUNBLElBQUlELE9BQU8sQ0FBQ2QsTUFBUixLQUFtQixDQUF2QixFQUEwQjtNQUN0QixJQUFJaUIsV0FBVyxHQUFHLEtBQUtuRSxJQUFMLENBQVVnRCxRQUE1Qjs7TUFDQSxLQUFLLElBQUlDLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdrQixXQUFXLENBQUNqQixNQUFoQyxFQUF3Q0QsQ0FBQyxFQUF6QyxFQUE2QztRQUN6QyxJQUFJRSxLQUFLLEdBQUdnQixXQUFXLENBQUNsQixDQUFELENBQXZCOztRQUNBLElBQUlFLEtBQUssQ0FBQ2lCLElBQU4sSUFBY2pCLEtBQUssQ0FBQ2lCLElBQU4sQ0FBV0MsV0FBWCxHQUF5QkMsT0FBekIsQ0FBaUMsS0FBakMsS0FBMkMsQ0FBN0QsRUFBZ0U7VUFDNUQ7VUFDQSxJQUFJbkIsS0FBSyxDQUFDb0IsQ0FBTixHQUFVLENBQWQsRUFBaUI7WUFDYlAsT0FBTyxDQUFDRSxJQUFSLENBQWFmLEtBQWI7VUFDSDtRQUNKO01BQ0o7SUFDSixDQXJDNEIsQ0F3QzdCOzs7SUFDQSxJQUFJcUIsUUFBUSxHQUFHLEdBQWYsQ0F6QzZCLENBeUNQOztJQUN0QixJQUFJQyxTQUFTLEdBQUcsRUFBaEIsQ0ExQzZCLENBMENQOztJQUN0QixJQUFJQyxNQUFNLEdBQUcsRUFBYixDQTNDNkIsQ0EyQ1A7O0lBQ3RCLElBQUlDLFdBQVcsR0FBRyxFQUFsQixDQTVDNkIsQ0E0Q1A7O0lBQ3RCLElBQUlDLFlBQVksR0FBRyxFQUFuQixDQTdDNkIsQ0E2Q047O0lBRXZCLEtBQUssSUFBSTNCLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdlLE9BQU8sQ0FBQ2QsTUFBNUIsRUFBb0NELENBQUMsRUFBckMsRUFBeUM7TUFDckMsSUFBSWdCLEdBQUcsR0FBR0QsT0FBTyxDQUFDZixDQUFELENBQWpCLENBRHFDLENBR3JDOztNQUNBLElBQUk0QixNQUFNLEdBQUdaLEdBQUcsQ0FBQ2hFLFlBQUosQ0FBaUJwRCxFQUFFLENBQUNpSSxNQUFwQixDQUFiO01BQ0EsSUFBSUQsTUFBSixFQUFZQSxNQUFNLENBQUNFLE9BQVAsR0FBaUIsS0FBakIsQ0FMeUIsQ0FPckM7O01BQ0FkLEdBQUcsQ0FBQ2UsS0FBSixHQUFZLEdBQVosQ0FScUMsQ0FVckM7O01BQ0FmLEdBQUcsQ0FBQ2dCLE9BQUosR0FBYyxDQUFkLENBWHFDLENBV25COztNQUNsQmhCLEdBQUcsQ0FBQ2lCLE9BQUosR0FBYyxDQUFkLENBWnFDLENBWW5CO01BRWxCOztNQUNBLElBQUlDLElBQUksR0FBR3RCLFdBQVcsR0FBRyxDQUFkLEdBQWtCYyxXQUFsQixHQUFnQzFCLENBQUMsSUFBSXVCLFFBQVEsR0FBRyxHQUFYLEdBQWlCRSxNQUFyQixDQUE1QztNQUNBLElBQUlVLElBQUksR0FBRyxDQUFDMUIsWUFBRCxHQUFnQixDQUFoQixHQUFvQmtCLFlBQS9CO01BRUFYLEdBQUcsQ0FBQ29CLENBQUosR0FBUUYsSUFBUjtNQUNBbEIsR0FBRyxDQUFDTSxDQUFKLEdBQVFhLElBQVI7SUFFSDtFQUNKLENBOVdMO0VBZ1hJL0UsZUFBZSxFQUFFLHlCQUFTWCxTQUFULEVBQW9CO0lBQ2pDLElBQUloQixJQUFJLEdBQUcsSUFBWDtJQUNBLElBQUksQ0FBQyxLQUFLdkIsU0FBVixFQUFxQjs7SUFFckIsSUFBSSxDQUFDdUMsU0FBTCxFQUFnQjtNQUNaLEtBQUs0RixrQkFBTDs7TUFDQTtJQUNIOztJQUVELElBQUk1RixTQUFTLENBQUM0RSxPQUFWLENBQWtCLFNBQWxCLE1BQWlDLENBQWpDLElBQXNDNUUsU0FBUyxDQUFDNEUsT0FBVixDQUFrQixVQUFsQixNQUFrQyxDQUE1RSxFQUErRTtNQUMzRXpILEVBQUUsQ0FBQzBJLFlBQUgsQ0FBZ0JDLFVBQWhCLENBQTJCOUYsU0FBM0IsRUFBc0M7UUFBRStGLEdBQUcsRUFBRTtNQUFQLENBQXRDLEVBQXVELFVBQVNwRCxHQUFULEVBQWNxRCxPQUFkLEVBQXVCO1FBQzFFLElBQUlyRCxHQUFHLElBQUksQ0FBQ3FELE9BQVosRUFBcUI7VUFDakJoSCxJQUFJLENBQUM0RyxrQkFBTDs7VUFDQTtRQUNIOztRQUNELElBQUk7VUFDQSxJQUFJSyxXQUFXLEdBQUcsSUFBSTlJLEVBQUUsQ0FBQytJLFdBQVAsQ0FBbUJGLE9BQW5CLENBQWxCO1VBQ0EsSUFBSUMsV0FBSixFQUFpQmpILElBQUksQ0FBQ3ZCLFNBQUwsQ0FBZXdJLFdBQWYsR0FBNkJBLFdBQTdCO1FBQ3BCLENBSEQsQ0FHRSxPQUFPbkcsQ0FBUCxFQUFVO1VBQ1JkLElBQUksQ0FBQzRHLGtCQUFMO1FBQ0g7TUFDSixDQVhEO0lBWUgsQ0FiRCxNQWFPO01BQ0h6SSxFQUFFLENBQUNnSixTQUFILENBQWFDLElBQWIsQ0FBa0Isa0JBQWtCcEcsU0FBcEMsRUFBK0M3QyxFQUFFLENBQUMrSSxXQUFsRCxFQUErRCxVQUFTdkQsR0FBVCxFQUFjc0QsV0FBZCxFQUEyQjtRQUN0RixJQUFJdEQsR0FBRyxJQUFJLENBQUNzRCxXQUFaLEVBQXlCO1VBQ3JCakgsSUFBSSxDQUFDNEcsa0JBQUw7O1VBQ0E7UUFDSDs7UUFDRCxJQUFJO1VBQ0E1RyxJQUFJLENBQUN2QixTQUFMLENBQWV3SSxXQUFmLEdBQTZCQSxXQUE3QjtRQUNILENBRkQsQ0FFRSxPQUFPbkcsQ0FBUCxFQUFVO1VBQ1JkLElBQUksQ0FBQzRHLGtCQUFMO1FBQ0g7TUFDSixDQVZEO0lBV0g7RUFDSixDQW5aTDtFQXFaSUEsa0JBQWtCLEVBQUUsOEJBQVc7SUFDM0IsSUFBSTVHLElBQUksR0FBRyxJQUFYO0lBQ0E3QixFQUFFLENBQUNnSixTQUFILENBQWFDLElBQWIsQ0FBa0IsdUJBQWxCLEVBQTJDakosRUFBRSxDQUFDK0ksV0FBOUMsRUFBMkQsVUFBU3ZELEdBQVQsRUFBY3NELFdBQWQsRUFBMkI7TUFDbEYsSUFBSSxDQUFDdEQsR0FBRCxJQUFRc0QsV0FBWixFQUF5QjtRQUNyQixJQUFJO1VBQ0FqSCxJQUFJLENBQUN2QixTQUFMLENBQWV3SSxXQUFmLEdBQTZCQSxXQUE3QjtRQUNILENBRkQsQ0FFRSxPQUFPbkcsQ0FBUCxFQUFVLENBQUU7TUFDakI7SUFDSixDQU5EO0VBT0gsQ0E5Wkw7RUFnYUlpQix3QkFBd0IsRUFBRSxvQ0FBVztJQUNqQyxJQUFJc0YsWUFBWSxHQUFHbkksTUFBTSxDQUFDbUksWUFBUCxJQUF1QixDQUExQztJQUNBLElBQUksQ0FBQ0EsWUFBTCxFQUFtQjs7SUFFbkIsSUFBSTtNQUNBbEosRUFBRSxDQUFDbUosV0FBSCxDQUFlQyxTQUFmO01BQ0FwSixFQUFFLENBQUNtSixXQUFILENBQWVFLGNBQWY7TUFDQXJKLEVBQUUsQ0FBQ2dKLFNBQUgsQ0FBYUMsSUFBYixDQUFrQixnQkFBbEIsRUFBb0NqSixFQUFFLENBQUNzSixTQUF2QyxFQUFrRCxVQUFTOUQsR0FBVCxFQUFjK0QsSUFBZCxFQUFvQjtRQUNsRSxJQUFJLENBQUMvRCxHQUFELElBQVErRCxJQUFaLEVBQWtCO1VBQ2QsSUFBSTtZQUNBdkosRUFBRSxDQUFDbUosV0FBSCxDQUFlSyxTQUFmLENBQXlCRCxJQUF6QixFQUErQixJQUEvQjtVQUNILENBRkQsQ0FFRSxPQUFNNUcsQ0FBTixFQUFTLENBQUU7UUFDaEI7TUFDSixDQU5EO0lBT0gsQ0FWRCxDQVVFLE9BQU1BLENBQU4sRUFBUyxDQUFFO0VBQ2hCLENBL2FMO0VBaWJJc0IsaUJBQWlCLEVBQUUsNkJBQVc7SUFDMUIsSUFBSXBDLElBQUksR0FBRyxJQUFYO0lBQ0EsSUFBSTRILE1BQU0sR0FBRzFJLE1BQU0sQ0FBQzJJLE9BQVAsR0FBaUIzSSxNQUFNLENBQUMySSxPQUFQLENBQWVELE1BQWhDLEdBQXlDLEVBQXREO0lBQ0EsSUFBSUUsU0FBUyxHQUFHNUksTUFBTSxDQUFDMkksT0FBUCxHQUFpQjNJLE1BQU0sQ0FBQzJJLE9BQVAsQ0FBZUMsU0FBaEMsR0FBNEMsRUFBNUQsQ0FIMEIsQ0FLMUI7O0lBQ0EsSUFBSSxDQUFDRixNQUFELElBQVcsQ0FBQzFJLE1BQU0sQ0FBQzZJLE9BQXZCLEVBQWdDO01BQzVCL0gsSUFBSSxDQUFDZ0ksZ0JBQUwsQ0FBc0JoSSxJQUFJLENBQUNpSSxzQkFBTCxFQUF0Qjs7TUFDQTtJQUNIOztJQUVELElBQUk7TUFDQTtNQUNBLElBQUlGLE9BQU8sQ0FBQ0csZ0JBQVosRUFBOEI7UUFDMUJILE9BQU8sQ0FBQ0csZ0JBQVIsR0FBMkIsSUFBM0I7TUFDSDs7TUFDRCxJQUFJO1FBQUVDLFlBQVksQ0FBQ0MsVUFBYixDQUF3QixtQkFBeEI7TUFBK0MsQ0FBckQsQ0FBc0QsT0FBT3RILENBQVAsRUFBVSxDQUFFLENBTGxFLENBT0E7OztNQUNBaUgsT0FBTyxDQUFDTSxHQUFSLENBQ0lULE1BQU0sR0FBRywwQkFEYixFQUVJRSxTQUZKLEVBR0ksVUFBU25FLEdBQVQsRUFBYzJFLE1BQWQsRUFBc0I7UUFDbEIsSUFBSTNFLEdBQUosRUFBUztVQUNMdkUsT0FBTyxDQUFDQyxJQUFSLENBQWEsVUFBYixFQUF5QnNFLEdBQXpCOztVQUNBM0QsSUFBSSxDQUFDZ0ksZ0JBQUwsQ0FBc0JoSSxJQUFJLENBQUNpSSxzQkFBTCxFQUF0Qjs7VUFDQTtRQUNIOztRQUVELElBQUlNLE9BQU8sR0FBRyxJQUFkOztRQUNBLElBQUlELE1BQU0sSUFBSUEsTUFBTSxDQUFDRSxJQUFQLEtBQWdCLENBQTFCLElBQStCRixNQUFNLENBQUN2RixJQUExQyxFQUFnRDtVQUM1Q3dGLE9BQU8sR0FBR0QsTUFBTSxDQUFDdkYsSUFBakI7UUFDSCxDQUZELE1BRU8sSUFBSXVGLE1BQU0sSUFBSUcsS0FBSyxDQUFDQyxPQUFOLENBQWNKLE1BQWQsQ0FBZCxFQUFxQztVQUN4Q0MsT0FBTyxHQUFHRCxNQUFWO1FBQ0gsQ0FaaUIsQ0FjbEI7OztRQUNBLElBQUlDLE9BQUosRUFBYTtVQUNULEtBQUssSUFBSWhFLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdnRSxPQUFPLENBQUMvRCxNQUE1QixFQUFvQ0QsQ0FBQyxFQUFyQyxFQUF5QztZQUNyQyxJQUFJb0UsQ0FBQyxHQUFHSixPQUFPLENBQUNoRSxDQUFELENBQWY7VUFDSDtRQUNKOztRQUVELElBQUlnRSxPQUFPLElBQUlBLE9BQU8sQ0FBQy9ELE1BQVIsR0FBaUIsQ0FBaEMsRUFBbUM7VUFDL0J4RSxJQUFJLENBQUM0QixXQUFMLEdBQW1CMkcsT0FBbkI7O1VBQ0F2SSxJQUFJLENBQUNnSSxnQkFBTCxDQUFzQk8sT0FBdEI7UUFDSCxDQUhELE1BR087VUFDSHZJLElBQUksQ0FBQ2dJLGdCQUFMLENBQXNCaEksSUFBSSxDQUFDaUksc0JBQUwsRUFBdEI7UUFDSDtNQUNKLENBOUJMO0lBZ0NILENBeENELENBd0NFLE9BQU9uSCxDQUFQLEVBQVU7TUFDUjFCLE9BQU8sQ0FBQ2tCLEtBQVIsQ0FBYyx1QkFBZCxFQUF1Q1EsQ0FBdkM7O01BQ0FkLElBQUksQ0FBQ2dJLGdCQUFMLENBQXNCaEksSUFBSSxDQUFDaUksc0JBQUwsRUFBdEI7SUFDSDtFQUNKLENBeGVMO0VBMGVJQSxzQkFBc0IsRUFBRSxrQ0FBVztJQUMvQixPQUFPLENBQ0g7TUFBRVcsRUFBRSxFQUFFLENBQU47TUFBU0MsU0FBUyxFQUFFLEtBQXBCO01BQTJCQyxTQUFTLEVBQUUsQ0FBdEM7TUFBeUNDLFVBQVUsRUFBRSxDQUFyRDtNQUF3REMsVUFBVSxFQUFFLENBQXBFO01BQXVFQyxRQUFRLEVBQUUsQ0FBakY7TUFBb0ZDLFFBQVEsRUFBRSxLQUE5RjtNQUFxR0MsV0FBVyxFQUFFLEtBQWxIO01BQXlIQyxNQUFNLEVBQUUsQ0FBakk7TUFBb0lDLFVBQVUsRUFBRSxDQUFoSjtNQUFtSkMsYUFBYSxFQUFFO0lBQWxLLENBREcsRUFFSDtNQUFFVixFQUFFLEVBQUUsQ0FBTjtNQUFTQyxTQUFTLEVBQUUsS0FBcEI7TUFBMkJDLFNBQVMsRUFBRSxDQUF0QztNQUF5Q0MsVUFBVSxFQUFFLENBQXJEO01BQXdEQyxVQUFVLEVBQUUsQ0FBcEU7TUFBdUVDLFFBQVEsRUFBRSxLQUFqRjtNQUF3RkMsUUFBUSxFQUFFLE1BQWxHO01BQTBHQyxXQUFXLEVBQUUsS0FBdkg7TUFBOEhDLE1BQU0sRUFBRSxDQUF0STtNQUF5SUMsVUFBVSxFQUFFLENBQXJKO01BQXdKQyxhQUFhLEVBQUU7SUFBdkssQ0FGRyxFQUdIO01BQUVWLEVBQUUsRUFBRSxDQUFOO01BQVNDLFNBQVMsRUFBRSxLQUFwQjtNQUEyQkMsU0FBUyxFQUFFLENBQXRDO01BQXlDQyxVQUFVLEVBQUUsQ0FBckQ7TUFBd0RDLFVBQVUsRUFBRSxDQUFwRTtNQUF1RUMsUUFBUSxFQUFFLE1BQWpGO01BQXlGQyxRQUFRLEVBQUUsT0FBbkc7TUFBNEdDLFdBQVcsRUFBRSxLQUF6SDtNQUFnSUMsTUFBTSxFQUFFLENBQXhJO01BQTJJQyxVQUFVLEVBQUUsQ0FBdko7TUFBMEpDLGFBQWEsRUFBRTtJQUF6SyxDQUhHLEVBSUg7TUFBRVYsRUFBRSxFQUFFLENBQU47TUFBU0MsU0FBUyxFQUFFLEtBQXBCO01BQTJCQyxTQUFTLEVBQUUsQ0FBdEM7TUFBeUNDLFVBQVUsRUFBRSxFQUFyRDtNQUF5REMsVUFBVSxFQUFFLENBQXJFO01BQXdFQyxRQUFRLEVBQUUsT0FBbEY7TUFBMkZDLFFBQVEsRUFBRSxPQUFyRztNQUE4R0MsV0FBVyxFQUFFLE1BQTNIO01BQW1JQyxNQUFNLEVBQUUsQ0FBM0k7TUFBOElDLFVBQVUsRUFBRSxDQUExSjtNQUE2SkMsYUFBYSxFQUFFO0lBQTVLLENBSkcsRUFLSDtNQUFFVixFQUFFLEVBQUUsQ0FBTjtNQUFTQyxTQUFTLEVBQUUsS0FBcEI7TUFBMkJDLFNBQVMsRUFBRSxDQUF0QztNQUF5Q0MsVUFBVSxFQUFFLEVBQXJEO01BQXlEQyxVQUFVLEVBQUUsQ0FBckU7TUFBd0VDLFFBQVEsRUFBRSxPQUFsRjtNQUEyRkMsUUFBUSxFQUFFLENBQXJHO01BQXdHQyxXQUFXLEVBQUUsTUFBckg7TUFBNkhDLE1BQU0sRUFBRSxDQUFySTtNQUF3SUMsVUFBVSxFQUFFLENBQXBKO01BQXVKQyxhQUFhLEVBQUU7SUFBdEssQ0FMRyxDQUFQO0VBT0gsQ0FsZkw7RUFvZklDLG9CQUFvQixFQUFFLGdDQUFXO0lBQzdCLElBQUlDLGFBQWEsR0FBRyxLQUFLbEksSUFBTCxDQUFVK0MsY0FBVixDQUF5QixpQkFBekIsQ0FBcEI7SUFDQSxJQUFJb0YsV0FBVyxHQUFHLEtBQUtuSSxJQUFMLENBQVUrQyxjQUFWLENBQXlCLGVBQXpCLENBQWxCO0lBQ0EsSUFBSW1GLGFBQUosRUFBbUJBLGFBQWEsQ0FBQzVFLE1BQWQsR0FBdUIsS0FBdkI7SUFDbkIsSUFBSTZFLFdBQUosRUFBaUJBLFdBQVcsQ0FBQzdFLE1BQVosR0FBcUIsS0FBckI7RUFDcEIsQ0F6Zkw7RUEyZkk7RUFDQTtFQUNBO0VBQ0FvRCxnQkFBZ0IsRUFBRSwwQkFBUzBCLEtBQVQsRUFBZ0I7SUFDOUIsSUFBSTFKLElBQUksR0FBRyxJQUFYLENBRDhCLENBSTlCOztJQUNBLElBQUkySixhQUFhLEdBQUc7TUFDaEIsR0FBRyxpQkFEYTtNQUVoQixHQUFHLGlCQUZhO01BR2hCLEdBQUcsaUJBSGE7TUFJaEIsR0FBRyxpQkFKYTtNQUtoQixHQUFHO0lBTGEsQ0FBcEIsQ0FMOEIsQ0FhOUI7O0lBQ0EsS0FBSyxJQUFJQyxHQUFULElBQWdCRCxhQUFoQixFQUErQjtNQUMzQixJQUFJRSxPQUFPLEdBQUcsS0FBS3ZJLElBQUwsQ0FBVStDLGNBQVYsQ0FBeUJzRixhQUFhLENBQUNDLEdBQUQsQ0FBdEMsQ0FBZDtNQUNBLElBQUlDLE9BQUosRUFBYUEsT0FBTyxDQUFDakYsTUFBUixHQUFpQixLQUFqQjtJQUNoQixDQWpCNkIsQ0FtQjlCO0lBQ0E7SUFDQTs7O0lBRUEsSUFBSWtGLFFBQVEsR0FBRyxFQUFmOztJQUVBLEtBQUssSUFBSXZGLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdtRixLQUFLLENBQUNsRixNQUExQixFQUFrQ0QsQ0FBQyxFQUFuQyxFQUF1QztNQUNuQyxJQUFJd0YsTUFBTSxHQUFHTCxLQUFLLENBQUNuRixDQUFELENBQWxCO01BQ0EsSUFBSXlGLFNBQVMsR0FBR0QsTUFBTSxDQUFDVixVQUFQLElBQXFCVSxNQUFNLENBQUNDLFNBQTVCLElBQXlDRCxNQUFNLENBQUNFLElBQWhELElBQXdELENBQXhFO01BQ0EsSUFBSUMsUUFBUSxHQUFHSCxNQUFNLENBQUNqQixTQUFQLElBQW9CaUIsTUFBTSxDQUFDRyxRQUExQztNQUNBLElBQUlDLFVBQVUsR0FBR1IsYUFBYSxDQUFDTyxRQUFELENBQTlCO01BRUEsSUFBSSxDQUFDQyxVQUFMLEVBQWlCO01BRWpCLElBQUlOLE9BQU8sR0FBRyxLQUFLdkksSUFBTCxDQUFVK0MsY0FBVixDQUF5QjhGLFVBQXpCLENBQWQ7TUFDQSxJQUFJLENBQUNOLE9BQUwsRUFBYztNQUVkLElBQUlPLFFBQVEsR0FBRztRQUNYOUksSUFBSSxFQUFFdUksT0FESztRQUVYRSxNQUFNLEVBQUVBLE1BRkc7UUFHWEcsUUFBUSxFQUFFQSxRQUhDO1FBSVhGLFNBQVMsRUFBRUEsU0FKQTtRQUtYSyxRQUFRLEVBQUVOLE1BQU0sQ0FBQ2xCLFNBQVAsSUFBb0JrQixNQUFNLENBQUNNLFFBQTNCLElBQXVDLE1BTHRDO1FBTVhDLE9BQU8sRUFBRVAsTUFBTSxDQUFDZCxRQUFQLElBQW1CYyxNQUFNLENBQUNPLE9BQTFCLElBQXFDLENBTm5DO1FBT1hDLE9BQU8sRUFBRVIsTUFBTSxDQUFDYixRQUFQLElBQW1CYSxNQUFNLENBQUNRLE9BQTFCLElBQXFDLENBUG5DO1FBUVhDLFlBQVksRUFBRVQsTUFBTSxDQUFDVCxhQUFQLElBQXdCUyxNQUFNLENBQUNTLFlBQS9CLElBQStDO01BUmxELENBQWY7TUFXQVYsUUFBUSxDQUFDdEUsSUFBVCxDQUFjNEUsUUFBZDtJQUNILENBaEQ2QixDQWtEOUI7OztJQUNBTixRQUFRLENBQUNHLElBQVQsQ0FBYyxVQUFTUSxDQUFULEVBQVlDLENBQVosRUFBZTtNQUFFLE9BQU9ELENBQUMsQ0FBQ1QsU0FBRixHQUFjVSxDQUFDLENBQUNWLFNBQXZCO0lBQW1DLENBQWxFLEVBbkQ4QixDQXNEOUI7O0lBQ0EsS0FBSyxJQUFJekYsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR3VGLFFBQVEsQ0FBQ3RGLE1BQTdCLEVBQXFDRCxDQUFDLEVBQXRDLEVBQTBDO01BQ3RDLElBQUlvRyxJQUFJLEdBQUdiLFFBQVEsQ0FBQ3ZGLENBQUQsQ0FBbkI7TUFDQW9HLElBQUksQ0FBQ3JKLElBQUwsQ0FBVXNELE1BQVYsR0FBbUIsSUFBbkI7TUFDQStGLElBQUksQ0FBQ3JKLElBQUwsQ0FBVXNKLFVBQVYsR0FBdUJELElBQUksQ0FBQ1osTUFBNUI7O01BRUEvSixJQUFJLENBQUM2SyxpQkFBTCxDQUF1QkYsSUFBSSxDQUFDckosSUFBNUIsRUFBa0NxSixJQUFJLENBQUNULFFBQXZDOztNQUNBbEssSUFBSSxDQUFDOEssbUJBQUwsQ0FBeUJILElBQUksQ0FBQ3JKLElBQTlCLEVBQW9DcUosSUFBSSxDQUFDWixNQUF6Qzs7TUFFQSxJQUFJZ0IsTUFBTSxHQUFHSixJQUFJLENBQUNySixJQUFMLENBQVVDLFlBQVYsQ0FBdUJwRCxFQUFFLENBQUM2TSxNQUExQixDQUFiOztNQUNBLElBQUlELE1BQUosRUFBWTtRQUNSQSxNQUFNLENBQUNFLFVBQVAsR0FBb0I5TSxFQUFFLENBQUM2TSxNQUFILENBQVVFLFVBQVYsQ0FBcUJDLEtBQXpDO1FBQ0FKLE1BQU0sQ0FBQ0ssUUFBUCxHQUFrQixHQUFsQjtRQUNBTCxNQUFNLENBQUNNLFNBQVAsR0FBbUIsR0FBbkI7TUFDSCxDQWJxQyxDQWV0Qzs7O01BQ0EsSUFBSVYsSUFBSSxDQUFDSCxZQUFMLEtBQXNCLENBQTFCLEVBQTZCO1FBQ3pCLElBQUksQ0FBQ3hLLElBQUksQ0FBQ3NMLFdBQVYsRUFBdUJ0TCxJQUFJLENBQUNzTCxXQUFMLEdBQW1CLEVBQW5COztRQUN2QnRMLElBQUksQ0FBQ3NMLFdBQUwsQ0FBaUI5RixJQUFqQixDQUFzQm1GLElBQXRCO01BQ0g7O01BRUQsQ0FBQyxVQUFTWixNQUFULEVBQWlCekksSUFBakIsRUFBdUIrSSxRQUF2QixFQUFpQ0csWUFBakMsRUFBK0M7UUFDNUNsSixJQUFJLENBQUNpSyxHQUFMLENBQVNwTixFQUFFLENBQUNxTixJQUFILENBQVFDLFNBQVIsQ0FBa0JDLFNBQTNCO1FBQ0FwSyxJQUFJLENBQUN3QixFQUFMLENBQVEzRSxFQUFFLENBQUNxTixJQUFILENBQVFDLFNBQVIsQ0FBa0JDLFNBQTFCLEVBQXFDLFVBQVNDLEtBQVQsRUFBZ0I7VUFDakRBLEtBQUssQ0FBQ0MsZUFBTixHQURpRCxDQUVqRDs7VUFDQSxJQUFJcEIsWUFBWSxLQUFLLENBQXJCLEVBQXdCO1lBQ3BCO1VBQ0g7O1VBQ0R4SyxJQUFJLENBQUM2TCxrQkFBTCxDQUF3QjlCLE1BQXhCO1FBQ0gsQ0FQRDtNQVFILENBVkQsRUFVR1ksSUFBSSxDQUFDWixNQVZSLEVBVWdCWSxJQUFJLENBQUNySixJQVZyQixFQVUyQnFKLElBQUksQ0FBQ04sUUFWaEMsRUFVMENNLElBQUksQ0FBQ0gsWUFWL0M7SUFXSCxDQXZGNkIsQ0F5RjlCOzs7SUFDQSxLQUFLc0IsaUJBQUwsQ0FBdUJoQyxRQUF2QixFQTFGOEIsQ0E0RjlCOzs7SUFDQSxLQUFLaUMsc0JBQUwsR0E3RjhCLENBK0Y5Qjs7O0lBQ0EsS0FBS0MsNkJBQUw7RUFDSCxDQS9sQkw7RUFpbUJJO0VBQ0FBLDZCQUE2QixFQUFFLHlDQUFXO0lBQ3RDLElBQUloTSxJQUFJLEdBQUcsSUFBWDs7SUFFQSxJQUFJZCxNQUFNLENBQUMrTSxTQUFQLElBQW9CL00sTUFBTSxDQUFDK00sU0FBUCxDQUFpQkMsMkJBQXpDLEVBQXNFO01BQ2xFaE4sTUFBTSxDQUFDK00sU0FBUCxDQUFpQkMsMkJBQWpCLENBQTZDLFVBQVN2SSxHQUFULEVBQWN3SSxhQUFkLEVBQTZCO1FBQ3RFLElBQUl4SSxHQUFKLEVBQVM7VUFDTHZFLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLHNCQUFiLEVBQXFDc0UsR0FBckM7UUFDSCxDQUZELE1BRU8sQ0FDTixDQUpxRSxDQUt0RTs7O1FBQ0EzRCxJQUFJLENBQUNvTSx3QkFBTDtNQUNILENBUEQ7SUFRSCxDQVRELE1BU087TUFDSDtNQUNBLEtBQUtBLHdCQUFMO0lBQ0g7RUFDSixDQWxuQkw7RUFvbkJJO0VBQ0E7RUFDQTtFQUNBTixpQkFBaUIsRUFBRSwyQkFBU2hDLFFBQVQsRUFBbUI7SUFDbEMsSUFBSTlKLElBQUksR0FBRyxJQUFYLENBRGtDLENBR2xDOztJQUNBLElBQUlxTSxRQUFRLEdBQUcsS0FBSy9LLElBQUwsQ0FBVStDLGNBQVYsQ0FBeUIsZUFBekIsQ0FBZjtJQUNBLElBQUlpSSxZQUFZLEdBQUcsS0FBS2hMLElBQUwsQ0FBVStDLGNBQVYsQ0FBeUIsVUFBekIsQ0FBbkI7SUFDQSxJQUFJa0ksYUFBYSxHQUFHLEtBQUtqTCxJQUFMLENBQVUrQyxjQUFWLENBQXlCLFdBQXpCLENBQXBCO0lBQ0EsSUFBSWdJLFFBQUosRUFBY0EsUUFBUSxDQUFDRyxPQUFUO0lBQ2QsSUFBSUYsWUFBSixFQUFrQkEsWUFBWSxDQUFDRSxPQUFiO0lBQ2xCLElBQUlELGFBQUosRUFBbUJBLGFBQWEsQ0FBQ0MsT0FBZDs7SUFFbkIsSUFBSTFDLFFBQVEsQ0FBQ3RGLE1BQVQsS0FBb0IsQ0FBeEIsRUFBMkI7TUFDdkI7SUFDSCxDQWJpQyxDQWVsQztJQUNBO0lBQ0E7OztJQUNBLElBQUlpSSxTQUFTLEdBQUcsR0FBaEIsQ0FsQmtDLENBa0JQOztJQUMzQixJQUFJQyxVQUFVLEdBQUcsR0FBakIsQ0FuQmtDLENBbUJQOztJQUMzQixJQUFJQyxJQUFJLEdBQUcsRUFBWCxDQXBCa0MsQ0FvQlA7SUFFM0I7O0lBQ0EsSUFBSTlILE1BQU0sR0FBRyxLQUFLdkQsSUFBTCxDQUFVQyxZQUFWLENBQXVCcEQsRUFBRSxDQUFDMkcsTUFBMUIsS0FBcUMzRyxFQUFFLENBQUM0RyxJQUFILENBQVEsUUFBUixFQUFrQnhELFlBQWxCLENBQStCcEQsRUFBRSxDQUFDMkcsTUFBbEMsQ0FBbEQ7SUFDQSxJQUFJRSxZQUFZLEdBQUdILE1BQU0sR0FBR0EsTUFBTSxDQUFDSSxnQkFBUCxDQUF3QkMsTUFBM0IsR0FBb0MsR0FBN0Q7SUFDQSxJQUFJQyxXQUFXLEdBQUdOLE1BQU0sR0FBR0EsTUFBTSxDQUFDSSxnQkFBUCxDQUF3QkcsS0FBM0IsR0FBbUMsSUFBM0QsQ0F6QmtDLENBMkJsQzs7SUFDQSxJQUFJd0gsZUFBZSxHQUFHOUMsUUFBUSxDQUFDdEYsTUFBVCxHQUFrQmlJLFNBQWxCLEdBQThCLENBQUMzQyxRQUFRLENBQUN0RixNQUFULEdBQWtCLENBQW5CLElBQXdCbUksSUFBNUU7SUFDQSxJQUFJRSxVQUFVLEdBQUdDLElBQUksQ0FBQ0MsR0FBTCxDQUFTSCxlQUFlLEdBQUcsRUFBM0IsRUFBK0J6SCxXQUFXLEdBQUcsR0FBN0MsQ0FBakI7SUFDQSxJQUFJNkgsV0FBVyxHQUFHTixVQUFVLEdBQUcsRUFBL0IsQ0E5QmtDLENBZ0NsQzs7SUFDQSxJQUFJTyxjQUFjLEdBQUcsRUFBckIsQ0FqQ2tDLENBaUNQO0lBRzNCO0lBQ0E7SUFDQTs7SUFDQSxJQUFJQyxTQUFTLEdBQUcsSUFBSS9PLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxlQUFaLENBQWhCO0lBQ0EwQixTQUFTLENBQUNDLGNBQVYsQ0FBeUJOLFVBQXpCLEVBQXFDRyxXQUFyQztJQUNBRSxTQUFTLENBQUMzRyxPQUFWLEdBQW9CLEdBQXBCO0lBQ0EyRyxTQUFTLENBQUMxRyxPQUFWLEdBQW9CLEdBQXBCO0lBQ0EwRyxTQUFTLENBQUN2RyxDQUFWLEdBQWMsQ0FBZCxDQTNDa0MsQ0EyQ2hCOztJQUNsQnVHLFNBQVMsQ0FBQ3JILENBQVYsR0FBY29ILGNBQWQ7SUFDQUMsU0FBUyxDQUFDRSxNQUFWLEdBQW1CLEtBQUs5TCxJQUF4QixDQTdDa0MsQ0ErQ2xDOztJQUNBLElBQUkrTCxNQUFNLEdBQUcsQ0FBQ1QsZUFBRCxHQUFtQixDQUFuQixHQUF1QkgsU0FBUyxHQUFHLENBQWhEOztJQUNBLEtBQUssSUFBSWxJLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUd1RixRQUFRLENBQUN0RixNQUE3QixFQUFxQ0QsQ0FBQyxFQUF0QyxFQUEwQztNQUN0QyxJQUFJb0csSUFBSSxHQUFHYixRQUFRLENBQUN2RixDQUFELENBQW5CO01BRUEsSUFBSTRCLE1BQU0sR0FBR3dFLElBQUksQ0FBQ3JKLElBQUwsQ0FBVUMsWUFBVixDQUF1QnBELEVBQUUsQ0FBQ2lJLE1BQTFCLENBQWI7TUFDQSxJQUFJRCxNQUFKLEVBQVlBLE1BQU0sQ0FBQ0UsT0FBUCxHQUFpQixLQUFqQjtNQUNac0UsSUFBSSxDQUFDckosSUFBTCxDQUFVaUYsT0FBVixHQUFvQixHQUFwQjtNQUNBb0UsSUFBSSxDQUFDckosSUFBTCxDQUFVa0YsT0FBVixHQUFvQixHQUFwQjtNQUNBbUUsSUFBSSxDQUFDckosSUFBTCxDQUFVZ0YsS0FBVixHQUFrQixDQUFsQjtNQUVBcUUsSUFBSSxDQUFDckosSUFBTCxDQUFVc0QsTUFBVixHQUFtQixJQUFuQjtNQUNBK0YsSUFBSSxDQUFDckosSUFBTCxDQUFVOEwsTUFBVixHQUFtQkYsU0FBbkIsQ0FWc0MsQ0FZdEM7O01BQ0F2QyxJQUFJLENBQUNySixJQUFMLENBQVVxRixDQUFWLEdBQWMwRyxNQUFNLEdBQUc5SSxDQUFDLElBQUlrSSxTQUFTLEdBQUdFLElBQWhCLENBQXhCLENBYnNDLENBY3RDOztNQUNBaEMsSUFBSSxDQUFDckosSUFBTCxDQUFVdUUsQ0FBVixHQUFjLENBQWQ7SUFFSDtFQUVKLENBM3JCTDtFQTZyQkk7RUFDQXlILGFBQWEsRUFBRSx1QkFBU0MsS0FBVCxFQUFnQkMsU0FBaEIsRUFBMkI3RyxDQUEzQixFQUE4QmQsQ0FBOUIsRUFBaUM7SUFDNUMsSUFBSTRILFNBQVMsR0FBRyxJQUFJdFAsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFdBQVosQ0FBaEI7SUFDQWlDLFNBQVMsQ0FBQ0MsV0FBVixDQUFzQi9HLENBQXRCLEVBQXlCZCxDQUF6QjtJQUNBNEgsU0FBUyxDQUFDbEgsT0FBVixHQUFvQixHQUFwQjtJQUNBa0gsU0FBUyxDQUFDakgsT0FBVixHQUFvQixHQUFwQjtJQUVBLElBQUltSCxLQUFLLEdBQUdGLFNBQVMsQ0FBQ0csWUFBVixDQUF1QnpQLEVBQUUsQ0FBQ0ssS0FBMUIsQ0FBWjtJQUNBbVAsS0FBSyxDQUFDek0sTUFBTixHQUFlc00sU0FBZjtJQUNBRyxLQUFLLENBQUNFLFFBQU4sR0FBaUIsRUFBakI7SUFDQUYsS0FBSyxDQUFDRyxVQUFOLEdBQW1CLEVBQW5CO0lBQ0FILEtBQUssQ0FBQ0ksZUFBTixHQUF3QjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBakQ7SUFFQVIsU0FBUyxDQUFDUyxLQUFWLEdBQWtCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLENBQW5CLENBQWxCO0lBRUEsSUFBSUMsT0FBTyxHQUFHVixTQUFTLENBQUNHLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUNpUSxZQUExQixDQUFkO0lBQ0FELE9BQU8sQ0FBQ0QsS0FBUixHQUFnQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsQ0FBaEI7SUFDQUMsT0FBTyxDQUFDL0ksS0FBUixHQUFnQixDQUFoQjtJQUVBcUksU0FBUyxDQUFDTCxNQUFWLEdBQW1CRyxLQUFuQjtFQUNILENBanRCTDtFQW10Qkk7RUFDQWMsMEJBQTBCLEVBQUUsb0NBQVMvTSxJQUFULEVBQWVnTixTQUFmLEVBQTBCO0lBQ2xEO0lBQ0EsSUFBSW5JLE1BQU0sR0FBRzdFLElBQUksQ0FBQ0MsWUFBTCxDQUFrQnBELEVBQUUsQ0FBQ2lJLE1BQXJCLENBQWI7O0lBQ0EsSUFBSUQsTUFBSixFQUFZO01BQ1JBLE1BQU0sQ0FBQ0UsT0FBUCxHQUFpQixLQUFqQjtJQUNILENBTGlELENBT2xEOzs7SUFDQS9FLElBQUksQ0FBQ2lGLE9BQUwsR0FBZSxHQUFmO0lBQ0FqRixJQUFJLENBQUNrRixPQUFMLEdBQWUsR0FBZixDQVRrRCxDQVdsRDs7SUFDQWxGLElBQUksQ0FBQ2dGLEtBQUwsR0FBYWdJLFNBQVMsSUFBSSxDQUExQjtFQUNIO0FBanVCTCxnQ0FvdUJtQix1QkFBU2YsS0FBVCxFQUFnQmdCLEtBQWhCLEVBQXVCNUgsQ0FBdkIsRUFBMEJkLENBQTFCLEVBQTZCO0VBQ3hDLElBQUk0SCxTQUFTLEdBQUcsSUFBSXRQLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxPQUFaLENBQWhCO0VBQ0FpQyxTQUFTLENBQUNDLFdBQVYsQ0FBc0IvRyxDQUF0QixFQUF5QmQsQ0FBekI7RUFDQTRILFNBQVMsQ0FBQ2xILE9BQVYsR0FBb0IsQ0FBcEI7RUFDQWtILFNBQVMsQ0FBQ2pILE9BQVYsR0FBb0IsR0FBcEI7RUFFQSxJQUFJbUgsS0FBSyxHQUFHRixTQUFTLENBQUNHLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUNLLEtBQTFCLENBQVo7RUFDQW1QLEtBQUssQ0FBQ3pNLE1BQU4sR0FBZXFOLEtBQWY7RUFDQVosS0FBSyxDQUFDRSxRQUFOLEdBQWlCLEVBQWpCO0VBQ0FGLEtBQUssQ0FBQ0csVUFBTixHQUFtQixFQUFuQjtFQUNBSCxLQUFLLENBQUNJLGVBQU4sR0FBd0I1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJRLElBQWpEO0VBRUFmLFNBQVMsQ0FBQ1MsS0FBVixHQUFrQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixDQUFuQixDQUFsQjtFQUVBLElBQUlDLE9BQU8sR0FBR1YsU0FBUyxDQUFDRyxZQUFWLENBQXVCelAsRUFBRSxDQUFDaVEsWUFBMUIsQ0FBZDtFQUNBRCxPQUFPLENBQUNELEtBQVIsR0FBZ0IvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxDQUFmLENBQWhCO0VBQ0FDLE9BQU8sQ0FBQy9JLEtBQVIsR0FBZ0IsQ0FBaEI7RUFFQXFJLFNBQVMsQ0FBQ0wsTUFBVixHQUFtQkcsS0FBbkI7QUFDSCxDQXZ2QkwsWUEwdkJJMUMsaUJBMXZCSixHQTB2QnVCLDJCQUFTaEIsT0FBVCxFQUFrQkssUUFBbEIsRUFBNEI7RUFDM0MsSUFBSWxLLElBQUksR0FBRyxJQUFYO0VBQ0EsSUFBSXlPLE1BQU0sR0FBRzVFLE9BQU8sQ0FBQ3RJLFlBQVIsQ0FBcUJwRCxFQUFFLENBQUNPLE1BQXhCLENBQWI7RUFDQSxJQUFJLENBQUMrUCxNQUFMLEVBQWE7RUFFYnRRLEVBQUUsQ0FBQ2dKLFNBQUgsQ0FBYUMsSUFBYixDQUFrQixrQkFBa0I4QyxRQUFwQyxFQUE4Qy9MLEVBQUUsQ0FBQytJLFdBQWpELEVBQThELFVBQVN2RCxHQUFULEVBQWNzRCxXQUFkLEVBQTJCO0lBQ3JGLElBQUl0RCxHQUFHLElBQUksQ0FBQ3NELFdBQVosRUFBeUI7TUFDckJqSCxJQUFJLENBQUMwTyx3QkFBTCxDQUE4QjdFLE9BQTlCOztNQUNBO0lBQ0g7O0lBQ0QsSUFBSTtNQUNBNEUsTUFBTSxDQUFDeEgsV0FBUCxHQUFxQkEsV0FBckI7SUFDSCxDQUZELENBRUUsT0FBT25HLENBQVAsRUFBVTtNQUNSZCxJQUFJLENBQUMwTyx3QkFBTCxDQUE4QjdFLE9BQTlCO0lBQ0g7RUFDSixDQVZEO0FBV0gsQ0Exd0JMLFlBNHdCSTZFLHdCQTV3QkosR0E0d0I4QixrQ0FBUzdFLE9BQVQsRUFBa0I7RUFDeEMsSUFBSTRFLE1BQU0sR0FBRzVFLE9BQU8sQ0FBQ3RJLFlBQVIsQ0FBcUJwRCxFQUFFLENBQUNPLE1BQXhCLENBQWI7RUFDQSxJQUFJLENBQUMrUCxNQUFMLEVBQWE7RUFFYnRRLEVBQUUsQ0FBQ2dKLFNBQUgsQ0FBYUMsSUFBYixDQUFrQixnQkFBbEIsRUFBb0NqSixFQUFFLENBQUMrSSxXQUF2QyxFQUFvRCxVQUFTdkQsR0FBVCxFQUFjc0QsV0FBZCxFQUEyQjtJQUMzRSxJQUFJLENBQUN0RCxHQUFELElBQVFzRCxXQUFaLEVBQXlCO01BQ3JCLElBQUk7UUFDQXdILE1BQU0sQ0FBQ3hILFdBQVAsR0FBcUJBLFdBQXJCO01BQ0gsQ0FGRCxDQUVFLE9BQU9uRyxDQUFQLEVBQVUsQ0FBRTtJQUNqQjtFQUNKLENBTkQ7QUFPSCxDQXZ4QkwsWUEyeEJJZ0ssbUJBM3hCSixHQTJ4QnlCLDZCQUFTakIsT0FBVCxFQUFrQkUsTUFBbEIsRUFBMEI7RUFDM0MsSUFBSTRFLGFBQWEsR0FBRzlFLE9BQU8sQ0FBQ3hGLGNBQVIsQ0FBdUIsZ0JBQXZCLENBQXBCLENBRDJDLENBRzNDOztFQUNBLElBQUltRyxZQUFZLEdBQUdULE1BQU0sQ0FBQ1QsYUFBUCxJQUF3QlMsTUFBTSxDQUFDUyxZQUEvQixJQUErQyxDQUFsRTs7RUFFQSxJQUFJLENBQUNtRSxhQUFMLEVBQW9CO0lBQ2hCQSxhQUFhLEdBQUcsSUFBSXhRLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxnQkFBWixDQUFoQjtJQUNBLElBQUltQyxLQUFLLEdBQUdnQixhQUFhLENBQUNmLFlBQWQsQ0FBMkJ6UCxFQUFFLENBQUNLLEtBQTlCLENBQVo7SUFDQW1QLEtBQUssQ0FBQ0UsUUFBTixHQUFpQixFQUFqQixDQUhnQixDQUdXOztJQUMzQkYsS0FBSyxDQUFDRyxVQUFOLEdBQW1CLEVBQW5CLENBSmdCLENBSVk7O0lBQzVCSCxLQUFLLENBQUNJLGVBQU4sR0FBd0I1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQWpEO0lBQ0FVLGFBQWEsQ0FBQ3BJLE9BQWQsR0FBd0IsR0FBeEI7SUFDQW9JLGFBQWEsQ0FBQ25JLE9BQWQsR0FBd0IsR0FBeEI7SUFFQSxJQUFJMkgsT0FBTyxHQUFHUSxhQUFhLENBQUNmLFlBQWQsQ0FBMkJ6UCxFQUFFLENBQUNpUSxZQUE5QixDQUFkO0lBQ0FELE9BQU8sQ0FBQ0QsS0FBUixHQUFnQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsQ0FBaEI7SUFDQUMsT0FBTyxDQUFDL0ksS0FBUixHQUFnQixDQUFoQixDQVhnQixDQWFoQjs7SUFDQXVKLGFBQWEsQ0FBQ0MsTUFBZCxHQUF1QixHQUF2QjtJQUVBRCxhQUFhLENBQUN2QixNQUFkLEdBQXVCdkQsT0FBdkI7RUFDSDs7RUFFRCxJQUFJOEQsS0FBSyxHQUFHZ0IsYUFBYSxDQUFDcE4sWUFBZCxDQUEyQnBELEVBQUUsQ0FBQ0ssS0FBOUIsQ0FBWixDQXpCMkMsQ0EyQjNDO0VBQ0E7O0VBQ0EsSUFBSXFRLFFBQUo7RUFDQSxJQUFJQyxZQUFKOztFQUVBLElBQUl0RSxZQUFZLEtBQUssQ0FBckIsRUFBd0I7SUFDcEI7SUFDQXFFLFFBQVEsR0FBRzlFLE1BQU0sQ0FBQ2dGLGNBQVAsSUFBeUJoRixNQUFNLENBQUNpRixZQUFoQyxJQUFnRCxDQUEzRDtJQUNBRixZQUFZLEdBQUcsR0FBZjtJQUNBSCxhQUFhLENBQUNULEtBQWQsR0FBc0IvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBdEIsQ0FKb0IsQ0FJOEI7SUFDbEQ7O0lBQ0FQLEtBQUssQ0FBQ3pNLE1BQU4sR0FBZSxLQUFLK04sV0FBTCxDQUFpQkosUUFBakIsSUFBNkIsR0FBN0IsR0FBbUNDLFlBQWxEO0VBQ0gsQ0FQRCxNQU9PO0lBQ0g7SUFDQUQsUUFBUSxHQUFHOUUsTUFBTSxDQUFDZCxRQUFQLElBQW1CYyxNQUFNLENBQUNPLE9BQTFCLElBQXFDLENBQWhEO0lBQ0F3RSxZQUFZLEdBQUcsR0FBZjtJQUNBSCxhQUFhLENBQUNULEtBQWQsR0FBc0IvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBdEIsQ0FKRyxDQUkrQztJQUNsRDs7SUFDQVAsS0FBSyxDQUFDek0sTUFBTixHQUFlLFFBQVEsS0FBSytOLFdBQUwsQ0FBaUJKLFFBQWpCLENBQVIsR0FBcUMsR0FBckMsR0FBMkNDLFlBQTFEO0VBQ0gsQ0E5QzBDLENBZ0QzQztFQUNBO0VBQ0E7OztFQUNBLElBQUkvSSxTQUFTLEdBQUc4RCxPQUFPLENBQUMzRSxNQUFSLElBQWtCLEdBQWxDLENBbkQyQyxDQW9EM0M7O0VBQ0EsSUFBSWdLLE9BQU8sR0FBRyxDQUFDbkosU0FBRCxHQUFXLENBQVgsR0FBZUEsU0FBUyxHQUFHLElBQXpDLENBckQyQyxDQXNEM0M7O0VBQ0EsSUFBSW9KLE9BQU8sR0FBRyxDQUFkLENBdkQyQyxDQXVEekI7O0VBQ2xCUixhQUFhLENBQUNqQixXQUFkLENBQTBCeUIsT0FBMUIsRUFBbUNELE9BQW5DO0FBQ0gsQ0FwMUJMLFlBdzFCSXJELGtCQXgxQkosR0F3MUJ3Qiw0QkFBU2pCLFVBQVQsRUFBcUI7RUFDckMsSUFBSTVLLElBQUksR0FBRyxJQUFYO0VBQ0EsSUFBSWIsUUFBUSxHQUFHRCxNQUFNLENBQUNDLFFBQXRCO0VBQ0EsSUFBSXFMLFlBQVksR0FBR0ksVUFBVSxDQUFDdEIsYUFBWCxJQUE0QnNCLFVBQVUsQ0FBQ0osWUFBdkMsSUFBdUQsQ0FBMUUsQ0FIcUMsQ0FLckM7O0VBQ0EsS0FBS2hKLG9CQUFMLEdBQTRCZ0osWUFBNUI7O0VBQ0EsS0FBSy9JLHNCQUFMLEdBUHFDLENBU3JDOzs7RUFDQSxJQUFJK0ksWUFBWSxLQUFLLENBQXJCLEVBQXdCO0lBQ3BCO0lBQ0EsS0FBSzRFLHVCQUFMLENBQTZCeEUsVUFBN0I7RUFDSCxDQUhELE1BR087SUFDSDtJQUNBLEtBQUt5RSx3QkFBTCxDQUE4QnpFLFVBQTlCO0VBQ0g7QUFDSixDQXoyQkwsWUE0MkJJeUUsd0JBNTJCSixHQTQyQjhCLGtDQUFTekUsVUFBVCxFQUFxQjtFQUMzQyxJQUFJNUssSUFBSSxHQUFHLElBQVg7RUFDQSxJQUFJYixRQUFRLEdBQUdELE1BQU0sQ0FBQ0MsUUFBdEI7RUFDQSxJQUFJbVEsVUFBVSxHQUFHblEsUUFBUSxJQUFJQSxRQUFRLENBQUNpQixVQUFyQixHQUFrQ2pCLFFBQVEsQ0FBQ2lCLFVBQVQsQ0FBb0J6QixXQUF0RCxHQUFvRSxDQUFyRjtFQUVBLElBQUkyTCxPQUFPLEdBQUdNLFVBQVUsQ0FBQzNCLFFBQVgsSUFBdUIyQixVQUFVLENBQUNOLE9BQWxDLElBQTZDLENBQTNEO0VBQ0EsSUFBSUMsT0FBTyxHQUFHSyxVQUFVLENBQUMxQixRQUFYLElBQXVCMEIsVUFBVSxDQUFDTCxPQUFsQyxJQUE2QyxDQUEzRDs7RUFFQSxJQUFJK0UsVUFBVSxHQUFHaEYsT0FBakIsRUFBMEI7SUFDdEIsS0FBS2lGLG1CQUFMLENBQXlCLE1BQXpCLEVBQWlDakYsT0FBTyxHQUFHZ0YsVUFBM0M7O0lBQ0E7RUFDSDs7RUFFRCxJQUFJL0UsT0FBTyxHQUFHLENBQVYsSUFBZStFLFVBQVUsR0FBRy9FLE9BQWhDLEVBQXlDO0lBQ3JDLEtBQUt0SCxZQUFMLENBQWtCLGtCQUFsQjs7SUFDQTtFQUNILENBaEIwQyxDQWtCM0M7OztFQUNBLElBQUk5RCxRQUFKLEVBQWM7SUFDVkEsUUFBUSxDQUFDcVEsaUJBQVQsR0FBNkI1RSxVQUE3QjtJQUNBekwsUUFBUSxDQUFDc1EsZ0JBQVQsR0FBNEI3RSxVQUFVLENBQUM5QixTQUF2QztJQUNBM0osUUFBUSxDQUFDdVEsZUFBVCxHQUEyQjlFLFVBQVUsQ0FBQy9CLFNBQXRDO0VBQ0gsQ0F2QjBDLENBeUIzQzs7O0VBQ0EsS0FBSzhHLFdBQUwsQ0FBaUIvRSxVQUFqQixFQUE2QjBFLFVBQTdCO0FBQ0gsQ0F2NEJMLFlBMDRCSUYsdUJBMTRCSixHQTA0QjZCLGlDQUFTeEUsVUFBVCxFQUFxQmYsT0FBckIsRUFBOEI7RUFDbkQsSUFBSTdKLElBQUksR0FBRyxJQUFYO0VBQ0EsSUFBSWIsUUFBUSxHQUFHRCxNQUFNLENBQUNDLFFBQXRCLENBRm1ELENBSW5EOztFQUNBLElBQUl5USxNQUFNLEdBQUdoRixVQUFVLENBQUNoQyxFQUF4Qjs7RUFDQSxJQUFJMUosTUFBTSxDQUFDK00sU0FBUCxJQUFvQi9NLE1BQU0sQ0FBQytNLFNBQVAsQ0FBaUI0RCxVQUFqQixDQUE0QkQsTUFBNUIsQ0FBeEIsRUFBNkQ7SUFDekQ7SUFDQSxLQUFLM00sWUFBTCxDQUFrQixVQUFsQjs7SUFDQTtFQUNILENBVmtELENBWW5EOzs7RUFDQSxJQUFJL0QsTUFBTSxDQUFDK00sU0FBUCxJQUFvQixLQUFLNkQsc0JBQUwsQ0FBNEJGLE1BQTVCLENBQXhCLEVBQTZEO0lBQ3pELEtBQUszTSxZQUFMLENBQWtCLHNCQUFsQjs7SUFDQTtFQUNILENBaEJrRCxDQWtCbkQ7RUFDQTtFQUNBO0VBRUE7OztFQUNBLEtBQUs4TSxjQUFMLENBQW9CbkYsVUFBcEIsRUFBZ0NmLE9BQWhDO0FBQ0gsQ0FsNkJMLFlBcTZCSWlHLHNCQXI2QkosR0FxNkI0QixnQ0FBU0UsYUFBVCxFQUF3QjtFQUM1QyxJQUFJLENBQUM5USxNQUFNLENBQUMrTSxTQUFSLElBQXFCLENBQUMsS0FBS1gsV0FBL0IsRUFBNEMsT0FBTyxLQUFQOztFQUU1QyxLQUFLLElBQUkvRyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUsrRyxXQUFMLENBQWlCOUcsTUFBckMsRUFBNkNELENBQUMsRUFBOUMsRUFBa0Q7SUFDOUMsSUFBSW9HLElBQUksR0FBRyxLQUFLVyxXQUFMLENBQWlCL0csQ0FBakIsQ0FBWDtJQUNBLElBQUlxTCxNQUFNLEdBQUdqRixJQUFJLENBQUNaLE1BQUwsQ0FBWW5CLEVBQXpCOztJQUNBLElBQUlnSCxNQUFNLEtBQUtJLGFBQVgsSUFBNEI5USxNQUFNLENBQUMrTSxTQUFQLENBQWlCNEQsVUFBakIsQ0FBNEJELE1BQTVCLENBQWhDLEVBQXFFO01BQ2pFLE9BQU8sSUFBUDtJQUNIO0VBQ0o7O0VBQ0QsT0FBTyxLQUFQO0FBQ0gsQ0FoN0JMLFlBbTdCSUcsY0FuN0JKLEdBbTdCb0Isd0JBQVNuRixVQUFULEVBQXFCZixPQUFyQixFQUE4QjtFQUMxQyxJQUFJN0osSUFBSSxHQUFHLElBQVgsQ0FEMEMsQ0FHMUM7O0VBQ0EsS0FBS2lELFlBQUwsQ0FBa0IsU0FBbEIsRUFKMEMsQ0FNMUM7OztFQUNBLElBQUkvRCxNQUFNLENBQUMrTSxTQUFYLEVBQXNCO0lBQ2xCL00sTUFBTSxDQUFDK00sU0FBUCxDQUFpQmdFLE1BQWpCLENBQXdCckYsVUFBVSxDQUFDaEMsRUFBbkMsRUFBdUMsVUFBU2pGLEdBQVQsRUFBYzJFLE1BQWQsRUFBc0I7TUFDekQsSUFBSTNFLEdBQUosRUFBUztRQUNMM0QsSUFBSSxDQUFDaUQsWUFBTCxDQUFrQlUsR0FBRyxJQUFJLE1BQXpCOztRQUNBO01BQ0gsQ0FKd0QsQ0FNekQ7OztNQUNBM0QsSUFBSSxDQUFDaUQsWUFBTCxDQUFrQixPQUFsQixFQVB5RCxDQVN6RDs7O01BQ0EsSUFBSS9ELE1BQU0sQ0FBQytNLFNBQVAsQ0FBaUJpRSxjQUFyQixFQUFxQztRQUNqQ2hSLE1BQU0sQ0FBQytNLFNBQVAsQ0FBaUJpRSxjQUFqQjtNQUNILENBWndELENBY3pEOzs7TUFDQWxRLElBQUksQ0FBQ29NLHdCQUFMO0lBQ0gsQ0FoQkQ7RUFpQkg7QUFDSixDQTc4QkwsWUFpOUJJTCxzQkFqOUJKLEdBaTlCNEIsa0NBQVc7RUFDL0IsSUFBSS9MLElBQUksR0FBRyxJQUFYO0VBQ0EsSUFBSSxDQUFDLEtBQUtzTCxXQUFWLEVBQXVCLE9BRlEsQ0FJL0I7O0VBQ0EsSUFBSTRCLFNBQVMsR0FBRyxLQUFLNUwsSUFBTCxDQUFVK0MsY0FBVixDQUF5QixlQUF6QixDQUFoQjs7RUFDQSxJQUFJLENBQUM2SSxTQUFMLEVBQWdCO0lBQ1o5TixPQUFPLENBQUNDLElBQVIsQ0FBYSx5QkFBYjtJQUNBO0VBQ0gsQ0FUOEIsQ0FXL0I7OztFQUNBLElBQUk4USxVQUFVLEdBQUdqRCxTQUFTLENBQUM3SSxjQUFWLENBQXlCLG9CQUF6QixDQUFqQjtFQUNBLElBQUk4TCxVQUFKLEVBQWdCQSxVQUFVLENBQUMzRCxPQUFYO0VBQ2hCLElBQUk0RCxTQUFTLEdBQUdsRCxTQUFTLENBQUM3SSxjQUFWLENBQXlCLGlCQUF6QixDQUFoQjtFQUNBLElBQUkrTCxTQUFKLEVBQWVBLFNBQVMsQ0FBQzVELE9BQVYsR0FmZ0IsQ0FpQi9COztFQUNBLElBQUk2RCxlQUFlLEdBQUcsSUFBSWxTLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxvQkFBWixDQUF0QjtFQUNBNkUsZUFBZSxDQUFDakQsTUFBaEIsR0FBeUJGLFNBQXpCLENBbkIrQixDQXFCL0I7O0VBQ0EsSUFBSW9ELGtCQUFrQixHQUFHLElBQUluUyxFQUFFLENBQUNxTixJQUFQLENBQVksaUJBQVosQ0FBekI7RUFDQThFLGtCQUFrQixDQUFDbEQsTUFBbkIsR0FBNEJGLFNBQTVCOztFQUVBLEtBQUssSUFBSTNJLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUcsS0FBSytHLFdBQUwsQ0FBaUI5RyxNQUFyQyxFQUE2Q0QsQ0FBQyxFQUE5QyxFQUFrRDtJQUM5QyxJQUFJb0csSUFBSSxHQUFHLEtBQUtXLFdBQUwsQ0FBaUIvRyxDQUFqQixDQUFYO0lBQ0EsSUFBSXNGLE9BQU8sR0FBR2MsSUFBSSxDQUFDckosSUFBbkI7SUFDQSxJQUFJeUksTUFBTSxHQUFHWSxJQUFJLENBQUNaLE1BQWxCLENBSDhDLENBSzlDO0lBQ0E7SUFDQTtJQUNBO0lBRUE7O0lBQ0EsSUFBSXdHLGVBQWUsR0FBRyxFQUF0QixDQVg4QyxDQVdmOztJQUMvQixJQUFJQyxTQUFTLEdBQUcsR0FBaEIsQ0FaOEMsQ0FZZjs7SUFDL0IsSUFBSUMsVUFBVSxHQUFHLEVBQWpCLENBYjhDLENBYWY7O0lBQy9CLElBQUlDLE9BQU8sR0FBRyxFQUFkLENBZDhDLENBY2Y7O0lBQy9CLElBQUlDLGVBQWUsR0FBRyxFQUF0QixDQWY4QyxDQWVmO0lBRS9CO0lBQ0E7O0lBQ0EsSUFBSUMsT0FBTyxHQUFHLEdBQWQsQ0FuQjhDLENBbUJUOztJQUNyQyxJQUFJQyxRQUFRLEdBQUcsRUFBZixDQXBCOEMsQ0FvQlQ7O0lBQ3JDLElBQUlDLFFBQVEsR0FBRyxDQUFmLENBckI4QyxDQXFCVDs7SUFDckMsSUFBSUMsT0FBTyxHQUFHNVMsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLEVBQXdCLEdBQXhCLENBQWQsQ0F0QjhDLENBc0JEO0lBRTdDOztJQUNBLElBQUk4QyxjQUFjLEdBQUcsSUFBSTdTLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxvQkFBb0J6QixNQUFNLENBQUNuQixFQUF2QyxDQUFyQjtJQUNBb0ksY0FBYyxDQUFDN0QsY0FBZixDQUE4QmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUXBILE9BQU8sQ0FBQ3pFLEtBQWhCLEVBQXVCeUwsUUFBdkIsQ0FBOUI7SUFDQUcsY0FBYyxDQUFDekssT0FBZixHQUF5QixHQUF6QjtJQUNBeUssY0FBYyxDQUFDeEssT0FBZixHQUF5QixHQUF6QixDQTVCOEMsQ0E4QjlDOztJQUNBd0ssY0FBYyxDQUFDckssQ0FBZixHQUFtQmtELE9BQU8sQ0FBQ2xELENBQTNCLENBL0I4QyxDQStCZjs7SUFDL0JxSyxjQUFjLENBQUNuTCxDQUFmLEdBQW1CZ0UsT0FBTyxDQUFDaEUsQ0FBUixHQUFZZ0UsT0FBTyxDQUFDM0UsTUFBUixHQUFpQixDQUE3QixHQUFpQzJMLFFBQVEsR0FBRyxDQUE1QyxHQUFnRCxFQUFuRSxDQWhDOEMsQ0FnQzBCO0lBRXhFOztJQUNBRyxjQUFjLENBQUNwRyxVQUFmLEdBQTRCYixNQUE1QjtJQUNBaUgsY0FBYyxDQUFDRSxRQUFmLEdBQTBCckgsT0FBMUIsQ0FwQzhDLENBc0M5QztJQUNBOztJQUNBLElBQUlzSCxNQUFNLEdBQUcsSUFBSWhULEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxJQUFaLENBQWI7SUFDQSxJQUFJNEYsVUFBVSxHQUFHRCxNQUFNLENBQUN2RCxZQUFQLENBQW9CelAsRUFBRSxDQUFDa1QsUUFBdkIsQ0FBakI7SUFDQUQsVUFBVSxDQUFDRSxTQUFYLEdBQXVCUCxPQUF2QjtJQUNBSyxVQUFVLENBQUNHLFNBQVgsQ0FBcUIsQ0FBQ1gsT0FBRCxHQUFTLENBQTlCLEVBQWlDLENBQUNDLFFBQUQsR0FBVSxDQUEzQyxFQUE4Q0QsT0FBOUMsRUFBdURDLFFBQXZELEVBQWlFQyxRQUFqRTtJQUNBTSxVQUFVLENBQUNJLElBQVg7SUFDQUwsTUFBTSxDQUFDL0QsTUFBUCxHQUFnQjRELGNBQWhCLENBN0M4QyxDQStDOUM7O0lBQ0EsSUFBSVMsV0FBVyxHQUFHLElBQUl0VCxFQUFFLENBQUNxTixJQUFQLENBQVksYUFBWixDQUFsQjtJQUNBLElBQUlrRyxlQUFlLEdBQUdELFdBQVcsQ0FBQzdELFlBQVosQ0FBeUJ6UCxFQUFFLENBQUNLLEtBQTVCLENBQXRCO0lBQ0FrVCxlQUFlLENBQUN4USxNQUFoQixHQUF5QixRQUF6QjtJQUNBd1EsZUFBZSxDQUFDN0QsUUFBaEIsR0FBMkIsRUFBM0I7SUFDQTZELGVBQWUsQ0FBQzVELFVBQWhCLEdBQTZCLEVBQTdCO0lBQ0E0RCxlQUFlLENBQUMzRCxlQUFoQixHQUFrQzVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBM0Q7SUFDQXlELGVBQWUsQ0FBQ0MsYUFBaEIsR0FBZ0N4VCxFQUFFLENBQUNLLEtBQUgsQ0FBU29ULGFBQVQsQ0FBdUIzRCxNQUF2RDtJQUNBeUQsZUFBZSxDQUFDRyxVQUFoQixHQUE2QixJQUE3QixDQXZEOEMsQ0F1RFY7O0lBQ3BDSixXQUFXLENBQUN2RCxLQUFaLEdBQW9CL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQXBCLENBeEQ4QyxDQXdEQTs7SUFDOUN1RCxXQUFXLENBQUNsTCxPQUFaLEdBQXNCLEdBQXRCO0lBQ0FrTCxXQUFXLENBQUNqTCxPQUFaLEdBQXNCLEdBQXRCO0lBQ0FpTCxXQUFXLENBQUM1TCxDQUFaLEdBQWdCLEVBQWhCLENBM0Q4QyxDQTJEekI7O0lBQ3JCNEwsV0FBVyxDQUFDckUsTUFBWixHQUFxQjRELGNBQXJCLENBNUQ4QyxDQThEOUM7O0lBQ0EsSUFBSWMsYUFBYSxHQUFHTCxXQUFXLENBQUM3RCxZQUFaLENBQXlCelAsRUFBRSxDQUFDaVEsWUFBNUIsQ0FBcEI7SUFDQTBELGFBQWEsQ0FBQzVELEtBQWQsR0FBc0IvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEVBQWQsRUFBa0IsQ0FBbEIsQ0FBdEIsQ0FoRThDLENBZ0VEOztJQUM3QzRELGFBQWEsQ0FBQzFNLEtBQWQsR0FBc0IsQ0FBdEIsQ0FqRThDLENBbUU5Qzs7SUFDQSxJQUFJMk0sVUFBVSxHQUFHLElBQUk1VCxFQUFFLENBQUNxTixJQUFQLENBQVksWUFBWixDQUFqQjtJQUNBLElBQUl3RyxjQUFjLEdBQUdELFVBQVUsQ0FBQ25FLFlBQVgsQ0FBd0J6UCxFQUFFLENBQUNLLEtBQTNCLENBQXJCO0lBQ0F3VCxjQUFjLENBQUM5USxNQUFmLEdBQXdCLE1BQXhCO0lBQ0E4USxjQUFjLENBQUNuRSxRQUFmLEdBQTBCLEVBQTFCO0lBQ0FtRSxjQUFjLENBQUNsRSxVQUFmLEdBQTRCLEVBQTVCO0lBQ0FrRSxjQUFjLENBQUNqRSxlQUFmLEdBQWlDNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUExRDtJQUNBK0QsY0FBYyxDQUFDTCxhQUFmLEdBQStCeFQsRUFBRSxDQUFDSyxLQUFILENBQVNvVCxhQUFULENBQXVCM0QsTUFBdEQ7SUFDQStELGNBQWMsQ0FBQ0gsVUFBZixHQUE0QixJQUE1QixDQTNFOEMsQ0EyRVg7O0lBQ25DRSxVQUFVLENBQUM3RCxLQUFYLEdBQW1CL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQW5CLENBNUU4QyxDQTRFRDs7SUFDN0M2RCxVQUFVLENBQUN4TCxPQUFYLEdBQXFCLEdBQXJCO0lBQ0F3TCxVQUFVLENBQUN2TCxPQUFYLEdBQXFCLEdBQXJCO0lBQ0F1TCxVQUFVLENBQUNsTSxDQUFYLEdBQWUsQ0FBQyxFQUFoQixDQS9FOEMsQ0ErRXpCOztJQUNyQmtNLFVBQVUsQ0FBQzNFLE1BQVgsR0FBb0I0RCxjQUFwQixDQWhGOEMsQ0FrRjlDOztJQUNBLElBQUlpQixZQUFZLEdBQUdGLFVBQVUsQ0FBQ25FLFlBQVgsQ0FBd0J6UCxFQUFFLENBQUNpUSxZQUEzQixDQUFuQjtJQUNBNkQsWUFBWSxDQUFDL0QsS0FBYixHQUFxQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsRUFBZCxFQUFrQixDQUFsQixDQUFyQixDQXBGOEMsQ0FvRkY7O0lBQzVDK0QsWUFBWSxDQUFDN00sS0FBYixHQUFxQixDQUFyQjtJQUVBNEwsY0FBYyxDQUFDNUQsTUFBZixHQUF3QmtELGtCQUF4QixDQXZGOEMsQ0F5RjlDO0lBQ0E7SUFDQTs7SUFDQSxJQUFJNEIsU0FBUyxHQUFHLElBQUkvVCxFQUFFLENBQUNxTixJQUFQLENBQVksZUFBZXpCLE1BQU0sQ0FBQ25CLEVBQWxDLENBQWhCLENBNUY4QyxDQThGOUM7O0lBQ0EsSUFBSTZGLE1BQU0sR0FBR3lELFNBQVMsQ0FBQ3RFLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUNPLE1BQTFCLENBQWI7SUFDQStQLE1BQU0sQ0FBQzBELElBQVAsR0FBY2hVLEVBQUUsQ0FBQ08sTUFBSCxDQUFVMFQsSUFBVixDQUFlQyxNQUE3QjtJQUNBNUQsTUFBTSxDQUFDNkQsUUFBUCxHQUFrQm5VLEVBQUUsQ0FBQ08sTUFBSCxDQUFVNlQsUUFBVixDQUFtQkMsTUFBckMsQ0FqRzhDLENBbUc5Qzs7SUFDQSxJQUFJQyxVQUFVLEdBQUcsR0FBakIsQ0FwRzhDLENBb0d0Qjs7SUFDeEIsSUFBSUMsV0FBVyxHQUFHLEVBQWxCLENBckc4QyxDQXFHdEI7O0lBQ3hCUixTQUFTLENBQUMvRSxjQUFWLENBQXlCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFRd0IsVUFBUixFQUFvQkMsV0FBcEIsQ0FBekI7SUFDQVIsU0FBUyxDQUFDM0wsT0FBVixHQUFvQixHQUFwQjtJQUNBMkwsU0FBUyxDQUFDMUwsT0FBVixHQUFvQixHQUFwQixDQXhHOEMsQ0EwRzlDOztJQUNBMEwsU0FBUyxDQUFDdkwsQ0FBVixHQUFja0QsT0FBTyxDQUFDbEQsQ0FBdEI7SUFDQXVMLFNBQVMsQ0FBQ3JNLENBQVYsR0FBY2dFLE9BQU8sQ0FBQ2hFLENBQVIsR0FBWWdFLE9BQU8sQ0FBQzNFLE1BQVIsR0FBaUIsQ0FBN0IsR0FBaUN3TixXQUFXLEdBQUcsQ0FBL0MsR0FBbUQsRUFBakUsQ0E1RzhDLENBNEd3QjtJQUV0RTs7SUFDQVIsU0FBUyxDQUFDdEgsVUFBVixHQUF1QmIsTUFBdkI7SUFDQW1JLFNBQVMsQ0FBQ3RDLE1BQVYsR0FBbUI3RixNQUFNLENBQUNuQixFQUExQjtJQUNBc0osU0FBUyxDQUFDaEIsUUFBVixHQUFxQnJILE9BQXJCLENBakg4QyxDQW1IOUM7O0lBQ0EsSUFBSWtCLE1BQU0sR0FBR21ILFNBQVMsQ0FBQ3RFLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUM2TSxNQUExQixDQUFiO0lBQ0FELE1BQU0sQ0FBQ0UsVUFBUCxHQUFvQjlNLEVBQUUsQ0FBQzZNLE1BQUgsQ0FBVUUsVUFBVixDQUFxQkMsS0FBekM7SUFDQUosTUFBTSxDQUFDSyxRQUFQLEdBQWtCLEdBQWxCO0lBQ0FMLE1BQU0sQ0FBQ00sU0FBUCxHQUFtQixJQUFuQixDQXZIOEMsQ0F5SDlDOztJQUNBLENBQUMsVUFBU3RCLE1BQVQsRUFBaUJtSCxRQUFqQixFQUEyQnlCLGFBQTNCLEVBQTBDO01BQ3ZDQSxhQUFhLENBQUM3UCxFQUFkLENBQWlCM0UsRUFBRSxDQUFDcU4sSUFBSCxDQUFRQyxTQUFSLENBQWtCQyxTQUFuQyxFQUE4QyxVQUFTQyxLQUFULEVBQWdCO1FBQzFEQSxLQUFLLENBQUNDLGVBQU47O1FBQ0E1TCxJQUFJLENBQUM0Uyx5QkFBTCxDQUErQjdJLE1BQS9CLEVBQXVDbUgsUUFBdkMsRUFBaUR5QixhQUFqRDtNQUNILENBSEQ7SUFJSCxDQUxELEVBS0c1SSxNQUxILEVBS1dGLE9BTFgsRUFLb0JxSSxTQUxwQjs7SUFPQUEsU0FBUyxDQUFDOUUsTUFBVixHQUFtQmlELGVBQW5CO0VBQ0gsQ0EzSjhCLENBNkovQjs7O0VBQ0EsSUFBSXdDLGNBQWMsR0FBRzNGLFNBQVMsQ0FBQ2hJLE1BQS9CO0VBQ0FnSSxTQUFTLENBQUNDLGNBQVYsQ0FBeUJELFNBQVMsQ0FBQzlILEtBQW5DLEVBQTBDeU4sY0FBYyxHQUFHLEVBQTNELEVBL0orQixDQWlLL0I7O0VBQ0EsS0FBS0MsdUJBQUwsR0FsSytCLENBb0svQjs7O0VBQ0EsS0FBS0Msb0JBQUw7QUFDSCxDQXZuQ0wsWUEwbkNJRCx1QkExbkNKLEdBMG5DNkIsbUNBQVc7RUFDaEMsSUFBSTlTLElBQUksR0FBRyxJQUFYLENBRGdDLENBR2hDOztFQUNBLElBQUlnVCxVQUFVLEdBQUcsQ0FDYix1QkFEYSxFQUViLDZCQUZhLEVBR2IsMEJBSGEsQ0FBakI7RUFNQSxLQUFLQyxnQkFBTCxHQUF3QixFQUF4QjtFQUNBLElBQUlDLFdBQVcsR0FBRyxDQUFsQjs7RUFFQSxLQUFLLElBQUkzTyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHeU8sVUFBVSxDQUFDeE8sTUFBL0IsRUFBdUNELENBQUMsRUFBeEMsRUFBNEM7SUFDeEMsQ0FBQyxVQUFTNE8sS0FBVCxFQUFnQjtNQUNiaFYsRUFBRSxDQUFDZ0osU0FBSCxDQUFhQyxJQUFiLENBQWtCNEwsVUFBVSxDQUFDRyxLQUFELENBQTVCLEVBQXFDaFYsRUFBRSxDQUFDK0ksV0FBeEMsRUFBcUQsVUFBU3ZELEdBQVQsRUFBY3NELFdBQWQsRUFBMkI7UUFDNUUsSUFBSSxDQUFDdEQsR0FBRCxJQUFRc0QsV0FBWixFQUF5QjtVQUNyQixJQUFJMkMsR0FBRyxHQUFHb0osVUFBVSxDQUFDRyxLQUFELENBQVYsQ0FBa0JDLEtBQWxCLENBQXdCLEdBQXhCLEVBQTZCQyxHQUE3QixFQUFWO1VBQ0FyVCxJQUFJLENBQUNpVCxnQkFBTCxDQUFzQnJKLEdBQXRCLElBQTZCM0MsV0FBN0I7UUFDSDs7UUFDRGlNLFdBQVcsR0FMaUUsQ0FNNUU7O1FBQ0EsSUFBSUEsV0FBVyxLQUFLRixVQUFVLENBQUN4TyxNQUEvQixFQUF1QztVQUNuQ3hFLElBQUksQ0FBQ29NLHdCQUFMO1FBQ0g7TUFDSixDQVZEO0lBV0gsQ0FaRCxFQVlHN0gsQ0FaSDtFQWFIO0FBQ0osQ0F0cENMLFlBeXBDSStPLGNBenBDSixHQXlwQ29CLHdCQUFTdkosTUFBVCxFQUFpQjtFQUM3QixJQUFJd0osZUFBZSxHQUFHeEosTUFBTSxDQUFDeUosaUJBQVAsSUFBNEJ6SixNQUFNLENBQUN3SixlQUF6RDtFQUNBLElBQUksQ0FBQ0EsZUFBTCxFQUFzQixPQUFPLElBQVAsQ0FGTyxDQUVNO0VBRW5DOztFQUNBLElBQUk7SUFDQSxJQUFJRSxNQUFNLEdBQUcsT0FBT0YsZUFBUCxLQUEyQixRQUEzQixHQUFzQ0csSUFBSSxDQUFDQyxLQUFMLENBQVdKLGVBQVgsQ0FBdEMsR0FBb0VBLGVBQWpGO0lBQ0EsSUFBSSxDQUFDRSxNQUFELElBQVdBLE1BQU0sQ0FBQ2pQLE1BQVAsS0FBa0IsQ0FBakMsRUFBb0MsT0FBTyxJQUFQO0lBRXBDLElBQUlmLEdBQUcsR0FBRyxJQUFJRCxJQUFKLEVBQVY7SUFDQSxJQUFJb1EsY0FBYyxHQUFHblEsR0FBRyxDQUFDb1EsUUFBSixLQUFpQixFQUFqQixHQUFzQnBRLEdBQUcsQ0FBQ3FRLFVBQUosRUFBM0M7O0lBRUEsS0FBSyxJQUFJdlAsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR2tQLE1BQU0sQ0FBQ2pQLE1BQTNCLEVBQW1DRCxDQUFDLEVBQXBDLEVBQXdDO01BQ3BDLElBQUl3UCxLQUFLLEdBQUdOLE1BQU0sQ0FBQ2xQLENBQUQsQ0FBbEI7TUFDQSxJQUFJeVAsVUFBVSxHQUFHRCxLQUFLLENBQUNFLEtBQU4sQ0FBWWIsS0FBWixDQUFrQixHQUFsQixDQUFqQjtNQUNBLElBQUljLFFBQVEsR0FBR0gsS0FBSyxDQUFDSSxHQUFOLENBQVVmLEtBQVYsQ0FBZ0IsR0FBaEIsQ0FBZjtNQUNBLElBQUlnQixZQUFZLEdBQUdDLFFBQVEsQ0FBQ0wsVUFBVSxDQUFDLENBQUQsQ0FBWCxDQUFSLEdBQTBCLEVBQTFCLEdBQStCSyxRQUFRLENBQUNMLFVBQVUsQ0FBQyxDQUFELENBQVgsQ0FBMUQ7TUFDQSxJQUFJTSxVQUFVLEdBQUdELFFBQVEsQ0FBQ0gsUUFBUSxDQUFDLENBQUQsQ0FBVCxDQUFSLEdBQXdCLEVBQXhCLEdBQTZCRyxRQUFRLENBQUNILFFBQVEsQ0FBQyxDQUFELENBQVQsQ0FBdEQ7O01BRUEsSUFBSU4sY0FBYyxJQUFJUSxZQUFsQixJQUFrQ1IsY0FBYyxJQUFJVSxVQUF4RCxFQUFvRTtRQUNoRSxPQUFPLElBQVA7TUFDSDtJQUNKOztJQUNELE9BQU8sS0FBUDtFQUNILENBbkJELENBbUJFLE9BQU94VCxDQUFQLEVBQVU7SUFDUjFCLE9BQU8sQ0FBQ2tCLEtBQVIsQ0FBYyxrQ0FBZCxFQUFrRFEsQ0FBbEQ7SUFDQSxPQUFPLElBQVAsQ0FGUSxDQUVLO0VBQ2hCO0FBQ0osQ0FyckNMLFlBNHJDSXlULGVBNXJDSixHQTRyQ3FCLHlCQUFTeEssTUFBVCxFQUFpQjtFQUM5QixJQUFJd0osZUFBZSxHQUFHeEosTUFBTSxDQUFDeUosaUJBQVAsSUFBNEJ6SixNQUFNLENBQUN3SixlQUF6RDtFQUNBLElBQUlpQixhQUFhLEdBQUd6SyxNQUFNLENBQUMwSyxjQUFQLElBQXlCMUssTUFBTSxDQUFDeUssYUFBaEMsSUFBaUR6SyxNQUFNLENBQUMySyxnQkFBeEQsSUFBNEUzSyxNQUFNLENBQUM0SyxlQUF2RyxDQUY4QixDQUk5Qjs7RUFDQSxJQUFJLENBQUNwQixlQUFELElBQW9CLENBQUNpQixhQUF6QixFQUF3QztJQUNwQyxPQUFPLEtBQVA7RUFDSCxDQVA2QixDQVM5Qjs7O0VBQ0EsSUFBSWxNLE1BQU0sR0FBRyxLQUFLZ0wsY0FBTCxDQUFvQnZKLE1BQXBCLENBQWI7O0VBQ0EsT0FBT3pCLE1BQVA7QUFDSCxDQXhzQ0wsWUE0c0NJc00sc0JBNXNDSixHQTRzQzRCLGdDQUFTN0ssTUFBVCxFQUFpQjtFQUNyQyxJQUFJd0osZUFBZSxHQUFHeEosTUFBTSxDQUFDeUosaUJBQVAsSUFBNEJ6SixNQUFNLENBQUN3SixlQUF6RDtFQUNBLElBQUlpQixhQUFhLEdBQUd6SyxNQUFNLENBQUMwSyxjQUFQLElBQXlCMUssTUFBTSxDQUFDeUssYUFBaEMsSUFBaUR6SyxNQUFNLENBQUMySyxnQkFBeEQsSUFBNEUzSyxNQUFNLENBQUM0SyxlQUF2RyxDQUZxQyxDQUlyQzs7RUFDQSxJQUFJLENBQUNwQixlQUFELElBQW9CLENBQUNpQixhQUF6QixFQUF3QyxPQUFPLElBQVAsQ0FMSCxDQU9yQzs7RUFDQSxJQUFJLENBQUMsS0FBS2xCLGNBQUwsQ0FBb0J2SixNQUFwQixDQUFMLEVBQWtDLE9BQU8sSUFBUDs7RUFFbEMsSUFBSTtJQUNBLElBQUkwSixNQUFNLEdBQUcsT0FBT0YsZUFBUCxLQUEyQixRQUEzQixHQUFzQ0csSUFBSSxDQUFDQyxLQUFMLENBQVdKLGVBQVgsQ0FBdEMsR0FBb0VBLGVBQWpGO0lBQ0EsSUFBSSxDQUFDRSxNQUFELElBQVdBLE1BQU0sQ0FBQ2pQLE1BQVAsS0FBa0IsQ0FBakMsRUFBb0MsT0FBTyxJQUFQO0lBRXBDLElBQUlmLEdBQUcsR0FBRyxJQUFJRCxJQUFKLEVBQVY7SUFDQSxJQUFJb1EsY0FBYyxHQUFHblEsR0FBRyxDQUFDb1EsUUFBSixLQUFpQixFQUFqQixHQUFzQnBRLEdBQUcsQ0FBQ3FRLFVBQUosRUFBM0MsQ0FMQSxDQU9BOztJQUNBLElBQUllLFlBQVksR0FBRyxJQUFuQjtJQUNBLElBQUlDLGlCQUFpQixHQUFHLENBQXhCOztJQUNBLEtBQUssSUFBSXZRLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdrUCxNQUFNLENBQUNqUCxNQUEzQixFQUFtQ0QsQ0FBQyxFQUFwQyxFQUF3QztNQUNwQyxJQUFJd1AsS0FBSyxHQUFHTixNQUFNLENBQUNsUCxDQUFELENBQWxCO01BQ0EsSUFBSXlQLFVBQVUsR0FBR0QsS0FBSyxDQUFDRSxLQUFOLENBQVliLEtBQVosQ0FBa0IsR0FBbEIsQ0FBakI7TUFDQSxJQUFJYyxRQUFRLEdBQUdILEtBQUssQ0FBQ0ksR0FBTixDQUFVZixLQUFWLENBQWdCLEdBQWhCLENBQWY7TUFDQSxJQUFJMkIsUUFBUSxHQUFHVixRQUFRLENBQUNMLFVBQVUsQ0FBQyxDQUFELENBQVgsQ0FBUixHQUEwQixFQUExQixHQUErQkssUUFBUSxDQUFDTCxVQUFVLENBQUMsQ0FBRCxDQUFYLENBQXREO01BQ0EsSUFBSWdCLE1BQU0sR0FBR1gsUUFBUSxDQUFDSCxRQUFRLENBQUMsQ0FBRCxDQUFULENBQVIsR0FBd0IsRUFBeEIsR0FBNkJHLFFBQVEsQ0FBQ0gsUUFBUSxDQUFDLENBQUQsQ0FBVCxDQUFsRDs7TUFFQSxJQUFJTixjQUFjLElBQUltQixRQUFsQixJQUE4Qm5CLGNBQWMsSUFBSW9CLE1BQXBELEVBQTREO1FBQ3hESCxZQUFZLEdBQUdkLEtBQWY7UUFDQWUsaUJBQWlCLEdBQUdDLFFBQXBCO1FBQ0E7TUFDSDtJQUNKOztJQUVELElBQUksQ0FBQ0YsWUFBTCxFQUFtQixPQUFPLElBQVAsQ0F4Qm5CLENBMEJBO0lBQ0E7O0lBQ0EsSUFBSUksaUJBQWlCLEdBQUdyQixjQUFjLEdBQUdrQixpQkFBekM7SUFDQSxJQUFJSSxTQUFTLEdBQUdELGlCQUFpQixHQUFHVCxhQUFwQztJQUVBLElBQUlXLGdCQUFKOztJQUNBLElBQUlELFNBQVMsSUFBSVYsYUFBYSxHQUFHLENBQWpDLEVBQW9DO01BQ2hDO01BQ0FXLGdCQUFnQixHQUFHdkIsY0FBYyxJQUFJWSxhQUFhLEdBQUdVLFNBQXBCLENBQWpDO0lBQ0gsQ0FIRCxNQUdPO01BQ0g7TUFDQUMsZ0JBQWdCLEdBQUdMLGlCQUFpQixHQUFHaEksSUFBSSxDQUFDc0ksSUFBTCxDQUFVSCxpQkFBaUIsR0FBR1QsYUFBOUIsSUFBK0NBLGFBQXRGOztNQUNBLElBQUlXLGdCQUFnQixJQUFJdkIsY0FBeEIsRUFBd0M7UUFDcEN1QixnQkFBZ0IsSUFBSVgsYUFBcEI7TUFDSDtJQUNKLENBekNELENBMkNBOzs7SUFDQSxJQUFJYSxlQUFlLEdBQUdGLGdCQUFnQixHQUFHLENBQXpDLENBNUNBLENBOENBOztJQUNBLElBQUlHLEtBQUssR0FBR3hJLElBQUksQ0FBQ3lJLEtBQUwsQ0FBV0YsZUFBZSxHQUFHLEVBQTdCLElBQW1DLEVBQS9DO0lBQ0EsSUFBSUcsSUFBSSxHQUFHSCxlQUFlLEdBQUcsRUFBN0I7SUFDQSxJQUFJSSxPQUFPLEdBQUcsQ0FBQ0gsS0FBSyxHQUFHLEVBQVIsR0FBYSxHQUFiLEdBQW1CLEVBQXBCLElBQTBCQSxLQUExQixHQUFrQyxHQUFsQyxJQUF5Q0UsSUFBSSxHQUFHLEVBQVAsR0FBWSxHQUFaLEdBQWtCLEVBQTNELElBQWlFQSxJQUEvRTtJQUNBLE9BQU9DLE9BQVA7RUFFSCxDQXBERCxDQW9ERSxPQUFPM1UsQ0FBUCxFQUFVO0lBQ1IxQixPQUFPLENBQUNrQixLQUFSLENBQWMsbUNBQWQsRUFBbURRLENBQW5EO0lBQ0EsT0FBTyxJQUFQO0VBQ0g7QUFDSixDQTl3Q0wsWUFreENJNFUsMEJBbHhDSixHQWt4Q2dDLG9DQUFTM0wsTUFBVCxFQUFpQjtFQUN6QyxJQUFJd0osZUFBZSxHQUFHeEosTUFBTSxDQUFDeUosaUJBQVAsSUFBNEJ6SixNQUFNLENBQUN3SixlQUF6RDtFQUNBLElBQUlpQixhQUFhLEdBQUd6SyxNQUFNLENBQUMwSyxjQUFQLElBQXlCMUssTUFBTSxDQUFDeUssYUFBaEMsSUFBaUR6SyxNQUFNLENBQUMySyxnQkFBeEQsSUFBNEUzSyxNQUFNLENBQUM0SyxlQUF2RztFQUVBLElBQUksQ0FBQ3BCLGVBQUQsSUFBb0IsQ0FBQ2lCLGFBQXpCLEVBQXdDLE9BQU8sQ0FBQyxDQUFSO0VBQ3hDLElBQUksQ0FBQyxLQUFLbEIsY0FBTCxDQUFvQnZKLE1BQXBCLENBQUwsRUFBa0MsT0FBTyxDQUFDLENBQVI7O0VBRWxDLElBQUk7SUFDQSxJQUFJMEosTUFBTSxHQUFHLE9BQU9GLGVBQVAsS0FBMkIsUUFBM0IsR0FBc0NHLElBQUksQ0FBQ0MsS0FBTCxDQUFXSixlQUFYLENBQXRDLEdBQW9FQSxlQUFqRjtJQUNBLElBQUksQ0FBQ0UsTUFBRCxJQUFXQSxNQUFNLENBQUNqUCxNQUFQLEtBQWtCLENBQWpDLEVBQW9DLE9BQU8sQ0FBQyxDQUFSO0lBRXBDLElBQUlmLEdBQUcsR0FBRyxJQUFJRCxJQUFKLEVBQVY7SUFDQSxJQUFJb1EsY0FBYyxHQUFHblEsR0FBRyxDQUFDb1EsUUFBSixLQUFpQixFQUFqQixHQUFzQnBRLEdBQUcsQ0FBQ3FRLFVBQUosRUFBM0M7SUFDQSxJQUFJNkIsY0FBYyxHQUFHbFMsR0FBRyxDQUFDbVMsVUFBSixFQUFyQjtJQUNBLElBQUlDLG1CQUFtQixHQUFHakMsY0FBYyxHQUFHLEVBQWpCLEdBQXNCK0IsY0FBaEQsQ0FQQSxDQVNBOztJQUNBLElBQUlkLFlBQVksR0FBRyxJQUFuQjtJQUNBLElBQUlDLGlCQUFpQixHQUFHLENBQXhCOztJQUNBLEtBQUssSUFBSXZRLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdrUCxNQUFNLENBQUNqUCxNQUEzQixFQUFtQ0QsQ0FBQyxFQUFwQyxFQUF3QztNQUNwQyxJQUFJd1AsS0FBSyxHQUFHTixNQUFNLENBQUNsUCxDQUFELENBQWxCO01BQ0EsSUFBSXlQLFVBQVUsR0FBR0QsS0FBSyxDQUFDRSxLQUFOLENBQVliLEtBQVosQ0FBa0IsR0FBbEIsQ0FBakI7TUFDQSxJQUFJYyxRQUFRLEdBQUdILEtBQUssQ0FBQ0ksR0FBTixDQUFVZixLQUFWLENBQWdCLEdBQWhCLENBQWY7TUFDQSxJQUFJMkIsUUFBUSxHQUFHVixRQUFRLENBQUNMLFVBQVUsQ0FBQyxDQUFELENBQVgsQ0FBUixHQUEwQixFQUExQixHQUErQkssUUFBUSxDQUFDTCxVQUFVLENBQUMsQ0FBRCxDQUFYLENBQXREO01BQ0EsSUFBSWdCLE1BQU0sR0FBR1gsUUFBUSxDQUFDSCxRQUFRLENBQUMsQ0FBRCxDQUFULENBQVIsR0FBd0IsRUFBeEIsR0FBNkJHLFFBQVEsQ0FBQ0gsUUFBUSxDQUFDLENBQUQsQ0FBVCxDQUFsRDs7TUFFQSxJQUFJTixjQUFjLElBQUltQixRQUFsQixJQUE4Qm5CLGNBQWMsSUFBSW9CLE1BQXBELEVBQTREO1FBQ3hESCxZQUFZLEdBQUdkLEtBQWY7UUFDQWUsaUJBQWlCLEdBQUdDLFFBQXBCO1FBQ0E7TUFDSDtJQUNKOztJQUVELElBQUksQ0FBQ0YsWUFBTCxFQUFtQixPQUFPLENBQUMsQ0FBUixDQTFCbkIsQ0E0QkE7O0lBQ0EsSUFBSWlCLGlCQUFpQixHQUFHaEIsaUJBQWlCLEdBQUcsRUFBNUM7SUFDQSxJQUFJaUIsb0JBQW9CLEdBQUd2QixhQUFhLEdBQUcsRUFBM0M7SUFDQSxJQUFJcUIsbUJBQW1CLEdBQUdqQyxjQUFjLEdBQUcsRUFBakIsR0FBc0IrQixjQUFoRCxDQS9CQSxDQWlDQTs7SUFDQSxJQUFJSyxjQUFjLEdBQUdILG1CQUFtQixHQUFHQyxpQkFBM0M7SUFDQSxJQUFJWixTQUFTLEdBQUdjLGNBQWMsR0FBR0Qsb0JBQWpDLENBbkNBLENBcUNBOztJQUNBLElBQUlFLFNBQVMsR0FBR0Ysb0JBQW9CLEdBQUdiLFNBQXZDLENBdENBLENBd0NBOztJQUNBLE9BQU9lLFNBQVA7RUFFSCxDQTNDRCxDQTJDRSxPQUFPblYsQ0FBUCxFQUFVO0lBQ1IxQixPQUFPLENBQUNrQixLQUFSLENBQWMsdUNBQWQsRUFBdURRLENBQXZEO0lBQ0EsT0FBTyxDQUFDLENBQVI7RUFDSDtBQUNKLENBeDBDTCxZQTIwQ0lvVix5QkEzMENKLEdBMjBDK0IsbUNBQVNuTSxNQUFULEVBQWlCO0VBQ3hDLElBQUl3SixlQUFlLEdBQUd4SixNQUFNLENBQUN5SixpQkFBUCxJQUE0QnpKLE1BQU0sQ0FBQ3dKLGVBQXpELENBRHdDLENBR3hDOztFQUNBLElBQUksQ0FBQ0EsZUFBTCxFQUFzQjtJQUNsQixPQUFPLElBQVA7RUFDSDs7RUFFRCxJQUFJO0lBQ0EsSUFBSUUsTUFBTSxHQUFHLE9BQU9GLGVBQVAsS0FBMkIsUUFBM0IsR0FBc0NHLElBQUksQ0FBQ0MsS0FBTCxDQUFXSixlQUFYLENBQXRDLEdBQW9FQSxlQUFqRjtJQUNBLElBQUksQ0FBQ0UsTUFBRCxJQUFXQSxNQUFNLENBQUNqUCxNQUFQLEtBQWtCLENBQWpDLEVBQW9DLE9BQU8sSUFBUDtJQUVwQyxJQUFJZixHQUFHLEdBQUcsSUFBSUQsSUFBSixFQUFWO0lBQ0EsSUFBSW9RLGNBQWMsR0FBR25RLEdBQUcsQ0FBQ29RLFFBQUosS0FBaUIsRUFBakIsR0FBc0JwUSxHQUFHLENBQUNxUSxVQUFKLEVBQTNDO0lBQ0EsSUFBSTZCLGNBQWMsR0FBR2xTLEdBQUcsQ0FBQ21TLFVBQUosRUFBckIsQ0FOQSxDQVFBOztJQUNBLElBQUlPLFlBQVksR0FBRyxFQUFuQjs7SUFDQSxLQUFLLElBQUk1UixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHa1AsTUFBTSxDQUFDalAsTUFBM0IsRUFBbUNELENBQUMsRUFBcEMsRUFBd0M7TUFDcEMsSUFBSXdQLEtBQUssR0FBR04sTUFBTSxDQUFDbFAsQ0FBRCxDQUFsQjtNQUNBLElBQUl5UCxVQUFVLEdBQUdELEtBQUssQ0FBQ0UsS0FBTixDQUFZYixLQUFaLENBQWtCLEdBQWxCLENBQWpCO01BQ0EsSUFBSWMsUUFBUSxHQUFHSCxLQUFLLENBQUNJLEdBQU4sQ0FBVWYsS0FBVixDQUFnQixHQUFoQixDQUFmO01BQ0EsSUFBSWdCLFlBQVksR0FBR0MsUUFBUSxDQUFDTCxVQUFVLENBQUMsQ0FBRCxDQUFYLENBQVIsR0FBMEIsRUFBMUIsR0FBK0JLLFFBQVEsQ0FBQ0wsVUFBVSxDQUFDLENBQUQsQ0FBWCxDQUExRDtNQUNBLElBQUlNLFVBQVUsR0FBR0QsUUFBUSxDQUFDSCxRQUFRLENBQUMsQ0FBRCxDQUFULENBQVIsR0FBd0IsRUFBeEIsR0FBNkJHLFFBQVEsQ0FBQ0gsUUFBUSxDQUFDLENBQUQsQ0FBVCxDQUF0RDtNQUNBaUMsWUFBWSxDQUFDM1EsSUFBYixDQUFrQjtRQUNkeU8sS0FBSyxFQUFFRixLQUFLLENBQUNFLEtBREM7UUFFZEUsR0FBRyxFQUFFSixLQUFLLENBQUNJLEdBRkc7UUFHZEMsWUFBWSxFQUFFQSxZQUhBO1FBSWRFLFVBQVUsRUFBRUE7TUFKRSxDQUFsQjtJQU1ILENBdEJELENBd0JBOzs7SUFDQSxLQUFLLElBQUkvUCxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHNFIsWUFBWSxDQUFDM1IsTUFBakMsRUFBeUNELENBQUMsRUFBMUMsRUFBOEM7TUFDMUMsSUFBSTZSLENBQUMsR0FBR0QsWUFBWSxDQUFDNVIsQ0FBRCxDQUFwQjs7TUFDQSxJQUFJcVAsY0FBYyxJQUFJd0MsQ0FBQyxDQUFDaEMsWUFBcEIsSUFBb0NSLGNBQWMsSUFBSXdDLENBQUMsQ0FBQzlCLFVBQTVELEVBQXdFO1FBQ3BFLE9BQU87VUFDSCtCLE9BQU8sRUFBRSxJQUROO1VBRUh0QyxLQUFLLEVBQUVxQztRQUZKLENBQVA7TUFJSDtJQUNKLENBakNELENBbUNBOzs7SUFDQSxJQUFJRSxZQUFZLEdBQUcsSUFBbkI7SUFDQSxJQUFJQyxPQUFPLEdBQUdDLFFBQWQ7O0lBRUEsS0FBSyxJQUFJalMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRzRSLFlBQVksQ0FBQzNSLE1BQWpDLEVBQXlDRCxDQUFDLEVBQTFDLEVBQThDO01BQzFDLElBQUk2UixDQUFDLEdBQUdELFlBQVksQ0FBQzVSLENBQUQsQ0FBcEIsQ0FEMEMsQ0FFMUM7O01BQ0EsSUFBSWtTLElBQUo7O01BQ0EsSUFBSUwsQ0FBQyxDQUFDaEMsWUFBRixHQUFpQlIsY0FBckIsRUFBcUM7UUFDakM7UUFDQTZDLElBQUksR0FBR0wsQ0FBQyxDQUFDaEMsWUFBRixHQUFpQlIsY0FBeEI7TUFDSCxDQUhELE1BR087UUFDSDtRQUNBNkMsSUFBSSxHQUFJLEtBQUssRUFBTCxHQUFVN0MsY0FBWCxHQUE2QndDLENBQUMsQ0FBQ2hDLFlBQXRDO01BQ0g7O01BRUQsSUFBSXFDLElBQUksR0FBR0YsT0FBWCxFQUFvQjtRQUNoQkEsT0FBTyxHQUFHRSxJQUFWO1FBQ0FILFlBQVksR0FBR0YsQ0FBZjtNQUNIO0lBQ0o7O0lBRUQsT0FBTztNQUNIQyxPQUFPLEVBQUUsS0FETjtNQUVIdEMsS0FBSyxFQUFFdUMsWUFGSjtNQUdISSxpQkFBaUIsRUFBRUg7SUFIaEIsQ0FBUDtFQUtILENBOURELENBOERFLE9BQU96VixDQUFQLEVBQVU7SUFDUixPQUFPLElBQVA7RUFDSDtBQUNKLENBcDVDTCxZQXU1Q0k2VixzQkF2NUNKLEdBdTVDNEIsZ0NBQVM1TSxNQUFULEVBQWlCO0VBQ3JDLElBQUl3SixlQUFlLEdBQUd4SixNQUFNLENBQUN5SixpQkFBUCxJQUE0QnpKLE1BQU0sQ0FBQ3dKLGVBQXpEO0VBQ0EsSUFBSWlCLGFBQWEsR0FBR3pLLE1BQU0sQ0FBQzBLLGNBQVAsSUFBeUIxSyxNQUFNLENBQUN5SyxhQUFoQyxJQUFpRHpLLE1BQU0sQ0FBQzJLLGdCQUF4RCxJQUE0RTNLLE1BQU0sQ0FBQzRLLGVBQW5GLElBQXNHLEVBQTFILENBRnFDLENBRXlGOztFQUU5SCxJQUFJbFIsR0FBRyxHQUFHLElBQUlELElBQUosRUFBVjtFQUNBLElBQUlvUSxjQUFjLEdBQUduUSxHQUFHLENBQUNvUSxRQUFKLEtBQWlCLEVBQWpCLEdBQXNCcFEsR0FBRyxDQUFDcVEsVUFBSixFQUEzQztFQUNBLElBQUk2QixjQUFjLEdBQUdsUyxHQUFHLENBQUNtUyxVQUFKLEVBQXJCO0VBQ0EsSUFBSUMsbUJBQW1CLEdBQUdqQyxjQUFjLEdBQUcsRUFBakIsR0FBc0IrQixjQUFoRCxDQVBxQyxDQVNyQzs7RUFDQSxJQUFJLENBQUNwQyxlQUFMLEVBQXNCO0lBQ2xCO0lBQ0EsSUFBSXFELGVBQWUsR0FBR3BDLGFBQWEsR0FBRyxFQUF0QztJQUNBLElBQUlxQyxjQUFjLEdBQUdoQixtQkFBbUIsR0FBR2UsZUFBM0M7SUFDQSxJQUFJRSxnQkFBZ0IsR0FBR0YsZUFBZSxHQUFHQyxjQUF6QztJQUVBLE9BQU87TUFDSEUsV0FBVyxFQUFFLElBRFY7TUFFSEMsT0FBTyxFQUFFRixnQkFGTjtNQUdIdEMsYUFBYSxFQUFFQTtJQUhaLENBQVA7RUFLSCxDQXJCb0MsQ0F1QnJDOzs7RUFDQSxJQUFJO0lBQ0EsSUFBSWYsTUFBTSxHQUFHLE9BQU9GLGVBQVAsS0FBMkIsUUFBM0IsR0FBc0NHLElBQUksQ0FBQ0MsS0FBTCxDQUFXSixlQUFYLENBQXRDLEdBQW9FQSxlQUFqRjs7SUFDQSxJQUFJLENBQUNFLE1BQUQsSUFBV0EsTUFBTSxDQUFDalAsTUFBUCxLQUFrQixDQUFqQyxFQUFvQztNQUNoQztNQUNBLElBQUlvUyxlQUFlLEdBQUdwQyxhQUFhLEdBQUcsRUFBdEM7TUFDQSxJQUFJcUMsY0FBYyxHQUFHaEIsbUJBQW1CLEdBQUdlLGVBQTNDO01BQ0EsSUFBSUUsZ0JBQWdCLEdBQUdGLGVBQWUsR0FBR0MsY0FBekM7TUFDQSxPQUFPO1FBQ0hFLFdBQVcsRUFBRSxJQURWO1FBRUhDLE9BQU8sRUFBRUYsZ0JBRk47UUFHSHRDLGFBQWEsRUFBRUE7TUFIWixDQUFQO0lBS0gsQ0FaRCxDQWNBOzs7SUFDQSxLQUFLLElBQUlqUSxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHa1AsTUFBTSxDQUFDalAsTUFBM0IsRUFBbUNELENBQUMsRUFBcEMsRUFBd0M7TUFDcEMsSUFBSXdQLEtBQUssR0FBR04sTUFBTSxDQUFDbFAsQ0FBRCxDQUFsQjtNQUNBLElBQUl5UCxVQUFVLEdBQUdELEtBQUssQ0FBQ0UsS0FBTixDQUFZYixLQUFaLENBQWtCLEdBQWxCLENBQWpCO01BQ0EsSUFBSWMsUUFBUSxHQUFHSCxLQUFLLENBQUNJLEdBQU4sQ0FBVWYsS0FBVixDQUFnQixHQUFoQixDQUFmO01BQ0EsSUFBSWdCLFlBQVksR0FBR0MsUUFBUSxDQUFDTCxVQUFVLENBQUMsQ0FBRCxDQUFYLENBQVIsR0FBMEIsRUFBMUIsR0FBK0JLLFFBQVEsQ0FBQ0wsVUFBVSxDQUFDLENBQUQsQ0FBWCxDQUExRDtNQUNBLElBQUlNLFVBQVUsR0FBR0QsUUFBUSxDQUFDSCxRQUFRLENBQUMsQ0FBRCxDQUFULENBQVIsR0FBd0IsRUFBeEIsR0FBNkJHLFFBQVEsQ0FBQ0gsUUFBUSxDQUFDLENBQUQsQ0FBVCxDQUF0RDs7TUFFQSxJQUFJTixjQUFjLElBQUlRLFlBQWxCLElBQWtDUixjQUFjLElBQUlVLFVBQXhELEVBQW9FO1FBQ2hFO1FBQ0EsSUFBSXdCLGlCQUFpQixHQUFHMUIsWUFBWSxHQUFHLEVBQXZDO1FBQ0EsSUFBSTRCLGNBQWMsR0FBR0gsbUJBQW1CLEdBQUdDLGlCQUEzQztRQUNBLElBQUljLGVBQWUsR0FBR3BDLGFBQWEsR0FBRyxFQUF0QztRQUNBLElBQUlVLFNBQVMsR0FBR2MsY0FBYyxHQUFHWSxlQUFqQztRQUNBLElBQUlFLGdCQUFnQixHQUFHRixlQUFlLEdBQUcxQixTQUF6QztRQUVBLE9BQU87VUFDSDZCLFdBQVcsRUFBRSxJQURWO1VBRUhDLE9BQU8sRUFBRUYsZ0JBRk47VUFHSHRDLGFBQWEsRUFBRUEsYUFIWjtVQUlISyxZQUFZLEVBQUVkO1FBSlgsQ0FBUDtNQU1IO0lBQ0osQ0FyQ0QsQ0F1Q0E7OztJQUNBLE9BQU87TUFDSGdELFdBQVcsRUFBRSxLQURWO01BRUhDLE9BQU8sRUFBRSxDQUZOO01BR0h4QyxhQUFhLEVBQUVBO0lBSFosQ0FBUDtFQUtILENBN0NELENBNkNFLE9BQU8xVCxDQUFQLEVBQVU7SUFDUixPQUFPO01BQ0hpVyxXQUFXLEVBQUUsS0FEVjtNQUVIQyxPQUFPLEVBQUUsQ0FGTjtNQUdIeEMsYUFBYSxFQUFFQTtJQUhaLENBQVA7RUFLSDtBQUNKLENBbitDTCxZQXMrQ0l5QyxnQkF0K0NKLEdBcytDc0IsMEJBQVNDLFlBQVQsRUFBdUI7RUFDckMsSUFBSUMsT0FBTyxHQUFHckssSUFBSSxDQUFDeUksS0FBTCxDQUFXMkIsWUFBWSxHQUFHLEVBQTFCLENBQWQ7RUFDQSxJQUFJRixPQUFPLEdBQUdsSyxJQUFJLENBQUN5SSxLQUFMLENBQVcyQixZQUFZLEdBQUcsRUFBMUIsQ0FBZDtFQUNBLE9BQU8sQ0FBQ0MsT0FBTyxHQUFHLEVBQVYsR0FBZSxHQUFmLEdBQXFCLEVBQXRCLElBQTRCQSxPQUE1QixHQUFzQyxHQUF0QyxJQUE2Q0gsT0FBTyxHQUFHLEVBQVYsR0FBZSxHQUFmLEdBQXFCLEVBQWxFLElBQXdFQSxPQUEvRTtBQUNILENBMStDTCxZQTYrQ0lJLHFCQTcrQ0osR0E2K0MyQiwrQkFBU3JELEtBQVQsRUFBZ0I7RUFDbkMsSUFBSSxDQUFDQSxLQUFMLEVBQVksT0FBTyxFQUFQO0VBQ1osT0FBT0EsS0FBSyxDQUFDRSxLQUFOLEdBQWMsR0FBZCxHQUFvQkYsS0FBSyxDQUFDSSxHQUFqQztBQUNILENBaC9DTCxZQXEvQ0lrRCxtQkFyL0NKLEdBcS9DeUIsNkJBQVN0TixNQUFULEVBQWlCO0VBQ2xDLElBQUl3SixlQUFlLEdBQUd4SixNQUFNLENBQUN5SixpQkFBUCxJQUE0QnpKLE1BQU0sQ0FBQ3dKLGVBQXpEO0VBQ0EsSUFBSWlCLGFBQWEsR0FBR3pLLE1BQU0sQ0FBQzBLLGNBQVAsSUFBeUIxSyxNQUFNLENBQUN5SyxhQUFoQyxJQUFpRHpLLE1BQU0sQ0FBQzJLLGdCQUF4RCxJQUE0RTNLLE1BQU0sQ0FBQzRLLGVBQW5GLElBQXNHLENBQTFIOztFQUVBLElBQUksQ0FBQ3BCLGVBQUQsSUFBb0IsQ0FBQ2lCLGFBQXpCLEVBQXdDO0lBQ3BDLE9BQU8sQ0FBUDtFQUNIOztFQUVELElBQUk7SUFDQSxJQUFJZixNQUFNLEdBQUcsT0FBT0YsZUFBUCxLQUEyQixRQUEzQixHQUFzQ0csSUFBSSxDQUFDQyxLQUFMLENBQVdKLGVBQVgsQ0FBdEMsR0FBb0VBLGVBQWpGO0lBQ0EsSUFBSSxDQUFDRSxNQUFELElBQVdBLE1BQU0sQ0FBQ2pQLE1BQVAsS0FBa0IsQ0FBakMsRUFBb0MsT0FBTyxDQUFQO0lBRXBDLElBQUlmLEdBQUcsR0FBRyxJQUFJRCxJQUFKLEVBQVY7SUFDQSxJQUFJb1EsY0FBYyxHQUFHblEsR0FBRyxDQUFDb1EsUUFBSixLQUFpQixFQUFqQixHQUFzQnBRLEdBQUcsQ0FBQ3FRLFVBQUosRUFBM0M7SUFDQSxJQUFJNkIsY0FBYyxHQUFHbFMsR0FBRyxDQUFDbVMsVUFBSixFQUFyQjtJQUNBLElBQUlDLG1CQUFtQixHQUFHakMsY0FBYyxHQUFHLEVBQWpCLEdBQXNCK0IsY0FBaEQsQ0FQQSxDQVNBOztJQUNBLElBQUlkLFlBQVksR0FBRyxJQUFuQjtJQUNBLElBQUlDLGlCQUFpQixHQUFHLENBQXhCOztJQUNBLEtBQUssSUFBSXZRLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdrUCxNQUFNLENBQUNqUCxNQUEzQixFQUFtQ0QsQ0FBQyxFQUFwQyxFQUF3QztNQUNwQyxJQUFJd1AsS0FBSyxHQUFHTixNQUFNLENBQUNsUCxDQUFELENBQWxCO01BQ0EsSUFBSXlQLFVBQVUsR0FBR0QsS0FBSyxDQUFDRSxLQUFOLENBQVliLEtBQVosQ0FBa0IsR0FBbEIsQ0FBakI7TUFDQSxJQUFJYyxRQUFRLEdBQUdILEtBQUssQ0FBQ0ksR0FBTixDQUFVZixLQUFWLENBQWdCLEdBQWhCLENBQWY7TUFDQSxJQUFJMkIsUUFBUSxHQUFHVixRQUFRLENBQUNMLFVBQVUsQ0FBQyxDQUFELENBQVgsQ0FBUixHQUEwQixFQUExQixHQUErQkssUUFBUSxDQUFDTCxVQUFVLENBQUMsQ0FBRCxDQUFYLENBQXREO01BQ0EsSUFBSWdCLE1BQU0sR0FBR1gsUUFBUSxDQUFDSCxRQUFRLENBQUMsQ0FBRCxDQUFULENBQVIsR0FBd0IsRUFBeEIsR0FBNkJHLFFBQVEsQ0FBQ0gsUUFBUSxDQUFDLENBQUQsQ0FBVCxDQUFsRDs7TUFFQSxJQUFJTixjQUFjLElBQUltQixRQUFsQixJQUE4Qm5CLGNBQWMsSUFBSW9CLE1BQXBELEVBQTREO1FBQ3hESCxZQUFZLEdBQUdkLEtBQWY7UUFDQWUsaUJBQWlCLEdBQUdDLFFBQXBCO1FBQ0E7TUFDSDtJQUNKOztJQUVELElBQUksQ0FBQ0YsWUFBTCxFQUFtQixPQUFPLENBQVAsQ0ExQm5CLENBNEJBOztJQUNBLElBQUlpQixpQkFBaUIsR0FBR2hCLGlCQUFpQixHQUFHLEVBQTVDO0lBQ0EsSUFBSWtCLGNBQWMsR0FBR0gsbUJBQW1CLEdBQUdDLGlCQUEzQztJQUNBLElBQUlDLG9CQUFvQixHQUFHdkIsYUFBYSxHQUFHLEVBQTNDLENBL0JBLENBaUNBOztJQUNBLElBQUk4QyxRQUFRLEdBQUd4SyxJQUFJLENBQUN5SSxLQUFMLENBQVdTLGNBQWMsR0FBR0Qsb0JBQTVCLElBQW9ELENBQW5FO0lBRUEsT0FBT3VCLFFBQVA7RUFDSCxDQXJDRCxDQXFDRSxPQUFPeFcsQ0FBUCxFQUFVO0lBQ1IsT0FBTyxDQUFQO0VBQ0g7QUFDSixDQXJpREwsWUF3aURJOFIseUJBeGlESixHQXdpRCtCLG1DQUFTaEksVUFBVCxFQUFxQmYsT0FBckIsRUFBOEI4SSxhQUE5QixFQUE2QztFQUNwRSxJQUFJM1MsSUFBSSxHQUFHLElBQVg7RUFDQSxJQUFJYixRQUFRLEdBQUdELE1BQU0sQ0FBQ0MsUUFBdEI7RUFDQSxJQUFJb1ksZUFBZSxHQUFHcFksUUFBUSxJQUFJQSxRQUFRLENBQUNpQixVQUFyQixHQUFrQ2pCLFFBQVEsQ0FBQ2lCLFVBQVQsQ0FBb0JvWCxVQUF0RCxHQUFtRSxDQUF6RjtFQUNBLElBQUk1SCxNQUFNLEdBQUdoRixVQUFVLENBQUNoQyxFQUF4QixDQUpvRSxDQU1wRTs7RUFDQSxJQUFJMUosTUFBTSxDQUFDK00sU0FBUCxJQUFvQi9NLE1BQU0sQ0FBQytNLFNBQVAsQ0FBaUI0RCxVQUFqQixDQUE0QkQsTUFBNUIsQ0FBeEIsRUFBNkQ7SUFDekQ7SUFDQSxLQUFLNkgsZUFBTCxDQUFxQjdNLFVBQXJCLEVBQWlDZixPQUFqQyxFQUEwQzhJLGFBQTFDOztJQUNBO0VBQ0gsQ0FYbUUsQ0FhcEU7OztFQUNBLElBQUksQ0FBQyxLQUFLNEIsZUFBTCxDQUFxQjNKLFVBQXJCLENBQUwsRUFBdUM7SUFDbkMsSUFBSTJJLGVBQWUsR0FBRzNJLFVBQVUsQ0FBQzRJLGlCQUFYLElBQWdDNUksVUFBVSxDQUFDMkksZUFBakU7SUFDQSxJQUFJaUIsYUFBYSxHQUFHNUosVUFBVSxDQUFDNkosY0FBWCxJQUE2QjdKLFVBQVUsQ0FBQzRKLGFBQXhDLElBQXlENUosVUFBVSxDQUFDOEosZ0JBQXBFLElBQXdGOUosVUFBVSxDQUFDK0osZUFBdkg7O0lBRUEsSUFBSSxDQUFDcEIsZUFBRCxJQUFvQixDQUFDaUIsYUFBekIsRUFBd0M7TUFDcEMsS0FBS3ZSLFlBQUwsQ0FBa0IsYUFBbEI7SUFDSCxDQUZELE1BRU8sSUFBSXNRLGVBQWUsSUFBSSxDQUFDaUIsYUFBeEIsRUFBdUM7TUFDMUMsS0FBS3ZSLFlBQUwsQ0FBa0IsYUFBbEI7SUFDSCxDQUZNLE1BRUEsSUFBSSxDQUFDLEtBQUtxUSxjQUFMLENBQW9CMUksVUFBcEIsQ0FBTCxFQUFzQztNQUN6QyxLQUFLM0gsWUFBTCxDQUFrQixnQkFBbEI7SUFDSCxDQUZNLE1BRUE7TUFDSCxLQUFLQSxZQUFMLENBQWtCLE9BQWxCO0lBQ0g7O0lBQ0Q7RUFDSCxDQTVCbUUsQ0E4QnBFOzs7RUFDQSxJQUFJLEtBQUs2TSxzQkFBTCxDQUE0QkYsTUFBNUIsQ0FBSixFQUF5QztJQUNyQyxLQUFLM00sWUFBTCxDQUFrQixzQkFBbEI7O0lBQ0E7RUFDSCxDQWxDbUUsQ0FvQ3BFOzs7RUFDQSxJQUFJeVUsU0FBUyxHQUFHOU0sVUFBVSxDQUFDbUUsY0FBWCxJQUE2Qm5FLFVBQVUsQ0FBQ29FLFlBQXhDLElBQXdELENBQXhFLENBckNvRSxDQXVDcEU7O0VBQ0EsSUFBSXVJLGVBQWUsR0FBR0csU0FBdEIsRUFBaUM7SUFDN0IsS0FBS3pVLFlBQUwsQ0FBa0IsY0FBY3lVLFNBQWQsR0FBMEIsTUFBNUM7O0lBQ0E7RUFDSCxDQTNDbUUsQ0E2Q3BFOzs7RUFDQSxLQUFLM0gsY0FBTCxDQUFvQm5GLFVBQXBCLEVBQWdDZixPQUFoQyxFQUF5QzhJLGFBQXpDO0FBQ0gsQ0F2bERMLFlBMGxESThFLGVBMWxESixHQTBsRHFCLHlCQUFTN00sVUFBVCxFQUFxQmYsT0FBckIsRUFBOEI4SSxhQUE5QixFQUE2QztFQUMxRCxJQUFJM1MsSUFBSSxHQUFHLElBQVg7O0VBRUEsS0FBS2lELFlBQUwsQ0FBa0IsV0FBbEI7O0VBRUEsSUFBSS9ELE1BQU0sQ0FBQytNLFNBQVgsRUFBc0I7SUFDbEIvTSxNQUFNLENBQUMrTSxTQUFQLENBQWlCMEwsWUFBakIsQ0FBOEIvTSxVQUFVLENBQUNoQyxFQUF6QyxFQUE2QyxVQUFTakYsR0FBVCxFQUFjMkUsTUFBZCxFQUFzQjtNQUMvRCxJQUFJM0UsR0FBSixFQUFTO1FBQ0wzRCxJQUFJLENBQUNpRCxZQUFMLENBQWtCVSxHQUFHLElBQUksUUFBekI7O1FBQ0E7TUFDSDs7TUFFRDNELElBQUksQ0FBQ2lELFlBQUwsQ0FBa0IsZUFBbEIsRUFOK0QsQ0FRL0Q7OztNQUNBLElBQUkvRCxNQUFNLENBQUMrTSxTQUFQLENBQWlCaUUsY0FBckIsRUFBcUM7UUFDakNoUixNQUFNLENBQUMrTSxTQUFQLENBQWlCaUUsY0FBakI7TUFDSCxDQVg4RCxDQWEvRDs7O01BQ0FsUSxJQUFJLENBQUNvTSx3QkFBTDtJQUNILENBZkQ7RUFnQkg7QUFDSixDQWpuREwsWUFxbkRJMkcsb0JBcm5ESixHQXFuRDBCLGdDQUFXO0VBQzdCLElBQUkvUyxJQUFJLEdBQUcsSUFBWCxDQUQ2QixDQUc3Qjs7RUFDQSxJQUFJLEtBQUs0WCxlQUFULEVBQTBCO0lBQ3RCQyxhQUFhLENBQUMsS0FBS0QsZUFBTixDQUFiO0VBQ0gsQ0FONEIsQ0FRN0I7RUFDQTs7O0VBQ0EsS0FBS0UsaUJBQUwsR0FBeUIsRUFBekIsQ0FWNkIsQ0FZN0I7RUFDQTs7RUFDQSxJQUFJaFUsTUFBTSxHQUFHNUUsTUFBTSxDQUFDQyxRQUFQLElBQW1CRCxNQUFNLENBQUNDLFFBQVAsQ0FBZ0IyRSxNQUFoRDs7RUFDQSxJQUFJQSxNQUFNLElBQUlBLE1BQU0sQ0FBQ2lVLGFBQXJCLEVBQW9DO0lBQ2hDalUsTUFBTSxDQUFDaVUsYUFBUCxDQUFxQixVQUFTaFYsSUFBVCxFQUFlO01BQ2hDLElBQUkvQyxJQUFJLENBQUNzQixJQUFMLElBQWF0QixJQUFJLENBQUNzQixJQUFMLENBQVUxQixPQUF2QixJQUFrQ21ELElBQWxDLElBQTBDQSxJQUFJLENBQUNpVixNQUFuRCxFQUEyRDtRQUN2RDtRQUNBaFksSUFBSSxDQUFDaVksa0JBQUwsQ0FBd0JsVixJQUFJLENBQUNpVixNQUE3QjtNQUNIO0lBQ0osQ0FMRDtFQU1ILENBUEQsTUFPTztJQUNINVksT0FBTyxDQUFDQyxJQUFSLENBQWEsb0RBQWI7RUFDSCxDQXhCNEIsQ0EwQjdCOzs7RUFDQSxJQUFJeUUsTUFBTSxJQUFJQSxNQUFNLENBQUNvVSxpQkFBckIsRUFBd0M7SUFDcENwVSxNQUFNLENBQUNvVSxpQkFBUCxDQUF5QixVQUFTblYsSUFBVCxFQUFlO01BQ3BDLElBQUkvQyxJQUFJLENBQUNzQixJQUFMLElBQWF0QixJQUFJLENBQUNzQixJQUFMLENBQVUxQixPQUEzQixFQUFvQztRQUNoQ0ksSUFBSSxDQUFDbVksa0JBQUwsQ0FBd0JwVixJQUF4QjtNQUNIO0lBQ0osQ0FKRDtFQUtILENBakM0QixDQW1DN0I7OztFQUNBLElBQUllLE1BQU0sSUFBSUEsTUFBTSxDQUFDc1Usa0JBQXJCLEVBQXlDO0lBQ3JDdFUsTUFBTSxDQUFDc1Usa0JBQVAsQ0FBMEIsVUFBU3JWLElBQVQsRUFBZTtNQUNyQyxJQUFJL0MsSUFBSSxDQUFDc0IsSUFBTCxJQUFhdEIsSUFBSSxDQUFDc0IsSUFBTCxDQUFVMUIsT0FBM0IsRUFBb0M7UUFDaENJLElBQUksQ0FBQ3FZLG1CQUFMLENBQXlCdFYsSUFBekI7TUFDSDtJQUNKLENBSkQ7RUFLSCxDQTFDNEIsQ0E0QzdCOzs7RUFDQSxLQUFLdVYsK0JBQUwsR0E3QzZCLENBK0M3Qjs7O0VBQ0EsS0FBS1YsZUFBTCxHQUF1QlcsV0FBVyxDQUFDLFlBQVc7SUFDMUMsSUFBSXZZLElBQUksQ0FBQ3NCLElBQUwsSUFBYXRCLElBQUksQ0FBQ3NCLElBQUwsQ0FBVTFCLE9BQTNCLEVBQW9DO01BQ2hDSSxJQUFJLENBQUN3WSxxQkFBTDtJQUNIO0VBQ0osQ0FKaUMsRUFJL0IsSUFKK0IsQ0FBbEM7QUFLSCxDQTFxREwsWUE2cURJTCxrQkE3cURKLEdBNnFEd0IsNEJBQVNwVixJQUFULEVBQWU7RUFDL0IsSUFBSS9DLElBQUksR0FBRyxJQUFYLENBRCtCLENBRy9COztFQUNBLEtBQUt5WSwyQkFBTCxHQUorQixDQU0vQjs7O0VBQ0EsS0FBS0MsaUJBQUwsR0FBeUIzVixJQUF6QixDQVArQixDQVMvQjs7RUFDQSxLQUFLNFYsMEJBQUwsQ0FBZ0M1VixJQUFoQztBQUNILENBeHJETCxZQTJyREkwViwyQkEzckRKLEdBMnJEaUMsdUNBQVc7RUFDcEM7RUFDQSxJQUFJLEtBQUtHLHNCQUFMLElBQStCLEtBQUtBLHNCQUFMLENBQTRCaFosT0FBL0QsRUFBd0U7SUFDcEUsS0FBS2daLHNCQUFMLENBQTRCcE0sT0FBNUI7O0lBQ0EsS0FBS29NLHNCQUFMLEdBQThCLElBQTlCO0VBQ0gsQ0FMbUMsQ0FNcEM7OztFQUNBLEtBQUtGLGlCQUFMLEdBQXlCLElBQXpCO0FBQ0gsQ0Fuc0RMLFlBc3NESUwsbUJBdHNESixHQXNzRHlCLDZCQUFTdFYsSUFBVCxFQUFlO0VBQ2hDM0QsT0FBTyxDQUFDeVosR0FBUixDQUFZLHVCQUFaLEVBQXFDbkYsSUFBSSxDQUFDb0YsU0FBTCxDQUFlL1YsSUFBZixDQUFyQyxFQURnQyxDQUdoQzs7RUFDQSxJQUFJLEtBQUs2VixzQkFBTCxJQUErQixLQUFLQSxzQkFBTCxDQUE0QmhaLE9BQS9ELEVBQXdFO0lBQ3BFO0lBQ0EsSUFBSW1ELElBQUksQ0FBQ2dXLE9BQUwsSUFBZ0IsS0FBS0MsNEJBQXpCLEVBQXVEO01BQ25ELElBQUlqVyxJQUFJLENBQUNnVyxPQUFMLEtBQWlCLEtBQUtDLDRCQUExQixFQUF3RDtRQUNwRDVaLE9BQU8sQ0FBQ3laLEdBQVIsQ0FBWSw4QkFBWixFQUE0QzlWLElBQUksQ0FBQ2dXLE9BQWpEOztRQUNBLEtBQUtOLDJCQUFMO01BQ0g7SUFDSixDQUxELE1BS087TUFDSDtNQUNBclosT0FBTyxDQUFDeVosR0FBUixDQUFZLHVCQUFaOztNQUNBLEtBQUtKLDJCQUFMO0lBQ0g7RUFDSjtBQUNKLENBdnRETCxZQTB0RElFLDBCQTF0REosR0EwdERnQyxvQ0FBUzVWLElBQVQsRUFBZTtFQUN2QyxJQUFJL0MsSUFBSSxHQUFHLElBQVgsQ0FEdUMsQ0FHdkM7O0VBQ0EsSUFBSTZFLE1BQU0sR0FBRyxLQUFLdkQsSUFBTCxDQUFVQyxZQUFWLENBQXVCcEQsRUFBRSxDQUFDMkcsTUFBMUIsS0FBcUMzRyxFQUFFLENBQUM0RyxJQUFILENBQVEsUUFBUixFQUFrQnhELFlBQWxCLENBQStCcEQsRUFBRSxDQUFDMkcsTUFBbEMsQ0FBbEQ7RUFDQSxJQUFJRSxZQUFZLEdBQUdILE1BQU0sR0FBR0EsTUFBTSxDQUFDSSxnQkFBUCxDQUF3QkMsTUFBM0IsR0FBb0MsR0FBN0Q7RUFDQSxJQUFJQyxXQUFXLEdBQUdOLE1BQU0sR0FBR0EsTUFBTSxDQUFDSSxnQkFBUCxDQUF3QkcsS0FBM0IsR0FBbUMsSUFBM0QsQ0FOdUMsQ0FRdkM7O0VBQ0EsSUFBSTZULFVBQVUsR0FBRyxJQUFJOWEsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLHVCQUFaLENBQWpCO0VBQ0F5TixVQUFVLENBQUM5TCxjQUFYLENBQTBCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFROUwsV0FBUixFQUFxQkgsWUFBckIsQ0FBMUI7RUFDQWlVLFVBQVUsQ0FBQzFTLE9BQVgsR0FBcUIsR0FBckI7RUFDQTBTLFVBQVUsQ0FBQ3pTLE9BQVgsR0FBcUIsR0FBckI7RUFDQXlTLFVBQVUsQ0FBQ3RTLENBQVgsR0FBZSxDQUFmO0VBQ0FzUyxVQUFVLENBQUNwVCxDQUFYLEdBQWUsQ0FBZjtFQUNBb1QsVUFBVSxDQUFDckssTUFBWCxHQUFvQixJQUFwQjtFQUNBcUssVUFBVSxDQUFDN0wsTUFBWCxHQUFvQixLQUFLOUwsSUFBekIsQ0FoQnVDLENBa0J2Qzs7RUFDQSxLQUFLc1gsc0JBQUwsR0FBOEJLLFVBQTlCO0VBQ0EsS0FBS0QsNEJBQUwsR0FBb0NqVyxJQUFJLENBQUNnVyxPQUF6QyxDQXBCdUMsQ0FvQlk7O0VBQ25ELEtBQUtHLDhCQUFMLEdBQXNDblcsSUFBSSxDQUFDb1csU0FBM0MsQ0FyQnVDLENBcUJnQjtFQUV2RDs7RUFDQSxJQUFJaEksTUFBTSxHQUFHLElBQUloVCxFQUFFLENBQUNxTixJQUFQLENBQVksSUFBWixDQUFiO0VBQ0EyRixNQUFNLENBQUNoRSxjQUFQLENBQXNCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFROUwsV0FBUixFQUFxQkgsWUFBckIsQ0FBdEI7RUFDQSxJQUFJb00sVUFBVSxHQUFHRCxNQUFNLENBQUN2RCxZQUFQLENBQW9CelAsRUFBRSxDQUFDa1QsUUFBdkIsQ0FBakI7RUFDQUQsVUFBVSxDQUFDRSxTQUFYLEdBQXVCblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixHQUFsQixDQUF2QjtFQUNBa0QsVUFBVSxDQUFDZ0ksSUFBWCxDQUFnQixDQUFDalUsV0FBRCxHQUFhLENBQTdCLEVBQWdDLENBQUNILFlBQUQsR0FBYyxDQUE5QyxFQUFpREcsV0FBakQsRUFBOERILFlBQTlEO0VBQ0FvTSxVQUFVLENBQUNJLElBQVg7RUFDQUwsTUFBTSxDQUFDL0QsTUFBUCxHQUFnQjZMLFVBQWhCLENBOUJ1QyxDQWdDdkM7O0VBQ0EsSUFBSXhNLFNBQVMsR0FBRyxHQUFoQjtFQUNBLElBQUlDLFVBQVUsR0FBRyxHQUFqQjtFQUNBLElBQUl3RSxRQUFRLEdBQUcsSUFBSS9TLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxNQUFaLENBQWY7RUFDQTBGLFFBQVEsQ0FBQy9ELGNBQVQsQ0FBd0JoUCxFQUFFLENBQUM4UyxJQUFILENBQVF4RSxTQUFSLEVBQW1CQyxVQUFuQixDQUF4QjtFQUNBLElBQUkyTSxZQUFZLEdBQUduSSxRQUFRLENBQUN0RCxZQUFULENBQXNCelAsRUFBRSxDQUFDa1QsUUFBekIsQ0FBbkI7RUFDQWdJLFlBQVksQ0FBQy9ILFNBQWIsR0FBeUJuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakIsRUFBcUIsR0FBckIsQ0FBekI7RUFDQW1MLFlBQVksQ0FBQzlILFNBQWIsQ0FBdUIsQ0FBQzlFLFNBQUQsR0FBVyxDQUFsQyxFQUFxQyxDQUFDQyxVQUFELEdBQVksQ0FBakQsRUFBb0RELFNBQXBELEVBQStEQyxVQUEvRCxFQUEyRSxFQUEzRTtFQUNBMk0sWUFBWSxDQUFDN0gsSUFBYjtFQUNBNkgsWUFBWSxDQUFDQyxXQUFiLEdBQTJCbmIsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLENBQW5CLENBQTNCO0VBQ0FtTCxZQUFZLENBQUNFLFNBQWIsR0FBeUIsQ0FBekI7RUFDQUYsWUFBWSxDQUFDOUgsU0FBYixDQUF1QixDQUFDOUUsU0FBRCxHQUFXLENBQWxDLEVBQXFDLENBQUNDLFVBQUQsR0FBWSxDQUFqRCxFQUFvREQsU0FBcEQsRUFBK0RDLFVBQS9ELEVBQTJFLEVBQTNFO0VBQ0EyTSxZQUFZLENBQUNHLE1BQWI7RUFDQXRJLFFBQVEsQ0FBQzlELE1BQVQsR0FBa0I2TCxVQUFsQixDQTdDdUMsQ0ErQ3ZDOztFQUNBLElBQUl4TCxTQUFTLEdBQUcsSUFBSXRQLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxPQUFaLENBQWhCO0VBQ0FpQyxTQUFTLENBQUM1SCxDQUFWLEdBQWM2RyxVQUFVLEdBQUMsQ0FBWCxHQUFlLEVBQTdCO0VBQ0EsSUFBSXFGLFVBQVUsR0FBR3RFLFNBQVMsQ0FBQ0csWUFBVixDQUF1QnpQLEVBQUUsQ0FBQ0ssS0FBMUIsQ0FBakI7RUFDQXVULFVBQVUsQ0FBQzdRLE1BQVgsR0FBb0IsWUFBcEI7RUFDQTZRLFVBQVUsQ0FBQ2xFLFFBQVgsR0FBc0IsRUFBdEI7RUFDQWtFLFVBQVUsQ0FBQ2pFLFVBQVgsR0FBd0IsRUFBeEI7RUFDQWlFLFVBQVUsQ0FBQ2hFLGVBQVgsR0FBNkI1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQXREO0VBQ0FSLFNBQVMsQ0FBQ1MsS0FBVixHQUFrQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixDQUFuQixDQUFsQjtFQUNBLElBQUkrRCxZQUFZLEdBQUd4RSxTQUFTLENBQUNHLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUNpUSxZQUExQixDQUFuQjtFQUNBNkQsWUFBWSxDQUFDL0QsS0FBYixHQUFxQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsRUFBZCxFQUFrQixDQUFsQixDQUFyQjtFQUNBK0QsWUFBWSxDQUFDN00sS0FBYixHQUFxQixDQUFyQjtFQUNBcUksU0FBUyxDQUFDTCxNQUFWLEdBQW1COEQsUUFBbkIsQ0EzRHVDLENBNkR2Qzs7RUFDQSxJQUFJdUksVUFBVSxHQUFHLElBQUl0YixFQUFFLENBQUNxTixJQUFQLENBQVksUUFBWixDQUFqQjtFQUNBaU8sVUFBVSxDQUFDNVQsQ0FBWCxHQUFlNkcsVUFBVSxHQUFDLENBQVgsR0FBZSxFQUE5QjtFQUNBLElBQUkrRSxXQUFXLEdBQUdnSSxVQUFVLENBQUM3TCxZQUFYLENBQXdCelAsRUFBRSxDQUFDSyxLQUEzQixDQUFsQjtFQUNBaVQsV0FBVyxDQUFDdlEsTUFBWixHQUFxQixVQUFVNkIsSUFBSSxDQUFDb1csU0FBTCxJQUFrQixJQUE1QixDQUFyQjtFQUNBMUgsV0FBVyxDQUFDNUQsUUFBWixHQUF1QixFQUF2QjtFQUNBNEQsV0FBVyxDQUFDMUQsZUFBWixHQUE4QjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBdkQ7RUFDQXdMLFVBQVUsQ0FBQ3ZMLEtBQVgsR0FBbUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBbkI7RUFDQXVMLFVBQVUsQ0FBQ3JNLE1BQVgsR0FBb0I4RCxRQUFwQixDQXJFdUMsQ0F1RXZDOztFQUNBLElBQUl3SSxRQUFRLEdBQUcsSUFBSXZiLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxNQUFaLENBQWY7RUFDQWtPLFFBQVEsQ0FBQzdULENBQVQsR0FBYTZHLFVBQVUsR0FBQyxDQUFYLEdBQWUsR0FBNUI7RUFDQSxJQUFJaU4sU0FBUyxHQUFHRCxRQUFRLENBQUM5TCxZQUFULENBQXNCelAsRUFBRSxDQUFDSyxLQUF6QixDQUFoQjtFQUNBbWIsU0FBUyxDQUFDelksTUFBVixHQUFtQixVQUFVNkIsSUFBSSxDQUFDOEYsU0FBTCxJQUFrQixNQUE1QixDQUFuQjtFQUNBOFEsU0FBUyxDQUFDOUwsUUFBVixHQUFxQixFQUFyQjtFQUNBOEwsU0FBUyxDQUFDNUwsZUFBVixHQUE0QjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBckQ7RUFDQXlMLFFBQVEsQ0FBQ3hMLEtBQVQsR0FBaUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBakI7RUFDQXdMLFFBQVEsQ0FBQ3RNLE1BQVQsR0FBa0I4RCxRQUFsQixDQS9FdUMsQ0FpRnZDOztFQUNBLElBQUkwSSxXQUFXLEdBQUcsSUFBSXpiLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxTQUFaLENBQWxCO0VBQ0FvTyxXQUFXLENBQUMvVCxDQUFaLEdBQWdCNkcsVUFBVSxHQUFDLENBQVgsR0FBZSxHQUEvQjtFQUNBLElBQUltTixZQUFZLEdBQUdELFdBQVcsQ0FBQ2hNLFlBQVosQ0FBeUJ6UCxFQUFFLENBQUNLLEtBQTVCLENBQW5CO0VBQ0FxYixZQUFZLENBQUMzWSxNQUFiLEdBQXNCLFlBQVk2QixJQUFJLENBQUMrVyxhQUFMLElBQXNCLENBQWxDLElBQXVDLElBQTdEO0VBQ0FELFlBQVksQ0FBQ2hNLFFBQWIsR0FBd0IsRUFBeEI7RUFDQWdNLFlBQVksQ0FBQzlMLGVBQWIsR0FBK0I1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQXhEO0VBQ0EyTCxXQUFXLENBQUMxTCxLQUFaLEdBQW9CL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQXBCO0VBQ0EwTCxXQUFXLENBQUN4TSxNQUFaLEdBQXFCOEQsUUFBckIsQ0F6RnVDLENBMkZ2Qzs7RUFDQSxJQUFJNkksT0FBTyxHQUFHLElBQUk1YixFQUFFLENBQUNxTixJQUFQLENBQVksU0FBWixDQUFkO0VBQ0F1TyxPQUFPLENBQUNsVSxDQUFSLEdBQVk2RyxVQUFVLEdBQUMsQ0FBWCxHQUFlLEdBQTNCO0VBQ0EsSUFBSXNOLFFBQVEsR0FBR0QsT0FBTyxDQUFDbk0sWUFBUixDQUFxQnpQLEVBQUUsQ0FBQ0ssS0FBeEIsQ0FBZjtFQUNBd2IsUUFBUSxDQUFDOVksTUFBVCxHQUFrQjZCLElBQUksQ0FBQ2xDLE9BQUwsSUFBZ0IsaUJBQWxDO0VBQ0FtWixRQUFRLENBQUNuTSxRQUFULEdBQW9CLEVBQXBCO0VBQ0FtTSxRQUFRLENBQUNqTSxlQUFULEdBQTJCNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUFwRDtFQUNBOEwsT0FBTyxDQUFDN0wsS0FBUixHQUFnQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFoQjtFQUNBNkwsT0FBTyxDQUFDM00sTUFBUixHQUFpQjhELFFBQWpCLENBbkd1QyxDQXFHdkM7O0VBQ0EsSUFBSStJLElBQUksR0FBRyxDQUFDdk4sVUFBRCxHQUFZLENBQVosR0FBZ0IsRUFBM0IsQ0F0R3VDLENBd0d2Qzs7RUFDQSxJQUFJd04sUUFBUSxHQUFHLElBQUkvYixFQUFFLENBQUNxTixJQUFQLENBQVksVUFBWixDQUFmO0VBQ0EwTyxRQUFRLENBQUMvTSxjQUFULENBQXdCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFRLEdBQVIsRUFBYSxFQUFiLENBQXhCO0VBQ0FpSixRQUFRLENBQUN4TSxXQUFULENBQXFCLENBQUMsR0FBdEIsRUFBMkJ1TSxJQUEzQjtFQUNBQyxRQUFRLENBQUMzVCxPQUFULEdBQW1CLEdBQW5CO0VBQ0EyVCxRQUFRLENBQUMxVCxPQUFULEdBQW1CLEdBQW5CLENBN0d1QyxDQStHdkM7O0VBQ0EsSUFBSTJULE9BQU8sR0FBR0QsUUFBUSxDQUFDdE0sWUFBVCxDQUFzQnpQLEVBQUUsQ0FBQ2tULFFBQXpCLENBQWQ7RUFDQThJLE9BQU8sQ0FBQzdJLFNBQVIsR0FBb0JuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEdBQWIsRUFBa0IsRUFBbEIsQ0FBcEIsQ0FqSHVDLENBaUhLOztFQUM1Q2lNLE9BQU8sQ0FBQzVJLFNBQVIsQ0FBa0IsQ0FBQyxFQUFuQixFQUF1QixDQUFDLEVBQXhCLEVBQTRCLEdBQTVCLEVBQWlDLEVBQWpDLEVBQXFDLENBQXJDO0VBQ0E0SSxPQUFPLENBQUMzSSxJQUFSLEdBbkh1QyxDQXFIdkM7O0VBQ0EsSUFBSTRJLGNBQWMsR0FBRyxJQUFJamMsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLE9BQVosQ0FBckI7RUFDQTRPLGNBQWMsQ0FBQzdULE9BQWYsR0FBeUIsR0FBekI7RUFDQTZULGNBQWMsQ0FBQzVULE9BQWYsR0FBeUIsR0FBekI7RUFDQSxJQUFJNlQsYUFBYSxHQUFHRCxjQUFjLENBQUN4TSxZQUFmLENBQTRCelAsRUFBRSxDQUFDSyxLQUEvQixDQUFwQjtFQUNBNmIsYUFBYSxDQUFDblosTUFBZCxHQUF1QixNQUF2QjtFQUNBbVosYUFBYSxDQUFDeE0sUUFBZCxHQUF5QixFQUF6QjtFQUNBd00sYUFBYSxDQUFDdk0sVUFBZCxHQUEyQixFQUEzQjtFQUNBdU0sYUFBYSxDQUFDdE0sZUFBZCxHQUFnQzVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBekQ7RUFDQW1NLGNBQWMsQ0FBQ2xNLEtBQWYsR0FBdUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBdkI7RUFDQWtNLGNBQWMsQ0FBQ2hOLE1BQWYsR0FBd0I4TSxRQUF4QixDQS9IdUMsQ0FpSXZDOztFQUNBLElBQUlJLGVBQWUsR0FBR0osUUFBUSxDQUFDdE0sWUFBVCxDQUFzQnpQLEVBQUUsQ0FBQzZNLE1BQXpCLENBQXRCO0VBQ0FzUCxlQUFlLENBQUNyUCxVQUFoQixHQUE2QjlNLEVBQUUsQ0FBQzZNLE1BQUgsQ0FBVUUsVUFBVixDQUFxQkMsS0FBbEQ7RUFDQW1QLGVBQWUsQ0FBQ2xQLFFBQWhCLEdBQTJCLEdBQTNCO0VBQ0FrUCxlQUFlLENBQUNqUCxTQUFoQixHQUE0QixHQUE1QjtFQUVBNk8sUUFBUSxDQUFDOU0sTUFBVCxHQUFrQjhELFFBQWxCLENBdkl1QyxDQXlJdkM7O0VBQ0FnSixRQUFRLENBQUNwWCxFQUFULENBQVkzRSxFQUFFLENBQUNxTixJQUFILENBQVFDLFNBQVIsQ0FBa0JDLFNBQTlCLEVBQXlDLFVBQVNDLEtBQVQsRUFBZ0I7SUFDckRBLEtBQUssQ0FBQ0MsZUFBTixHQURxRCxDQUVyRDs7SUFDQTVMLElBQUksQ0FBQzRZLHNCQUFMLEdBQThCLElBQTlCO0lBQ0E1WSxJQUFJLENBQUNnWiw0QkFBTCxHQUFvQyxJQUFwQztJQUNBaFosSUFBSSxDQUFDa1osOEJBQUwsR0FBc0MsSUFBdEM7SUFDQUQsVUFBVSxDQUFDek0sT0FBWDs7SUFDQXhNLElBQUksQ0FBQ3VhLGdCQUFMLENBQXNCeFgsSUFBdEI7RUFDSCxDQVJELEVBMUl1QyxDQW9KdkM7O0VBQ0EsSUFBSXlYLFNBQVMsR0FBRyxJQUFJcmMsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFdBQVosQ0FBaEI7RUFDQWdQLFNBQVMsQ0FBQ3JOLGNBQVYsQ0FBeUJoUCxFQUFFLENBQUM4UyxJQUFILENBQVEsR0FBUixFQUFhLEVBQWIsQ0FBekI7RUFDQXVKLFNBQVMsQ0FBQzlNLFdBQVYsQ0FBc0IsR0FBdEIsRUFBMkJ1TSxJQUEzQixFQXZKdUMsQ0F1Sko7O0VBQ25DTyxTQUFTLENBQUNqVSxPQUFWLEdBQW9CLEdBQXBCO0VBQ0FpVSxTQUFTLENBQUNoVSxPQUFWLEdBQW9CLEdBQXBCLENBekp1QyxDQTJKdkM7O0VBQ0EsSUFBSWlVLFFBQVEsR0FBR0QsU0FBUyxDQUFDNU0sWUFBVixDQUF1QnpQLEVBQUUsQ0FBQ2tULFFBQTFCLENBQWY7RUFDQW9KLFFBQVEsQ0FBQ25KLFNBQVQsR0FBcUJuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEVBQWQsRUFBa0IsRUFBbEIsQ0FBckIsQ0E3SnVDLENBNkpNOztFQUM3Q3VNLFFBQVEsQ0FBQ2xKLFNBQVQsQ0FBbUIsQ0FBQyxFQUFwQixFQUF3QixDQUFDLEVBQXpCLEVBQTZCLEdBQTdCLEVBQWtDLEVBQWxDLEVBQXNDLENBQXRDO0VBQ0FrSixRQUFRLENBQUNqSixJQUFULEdBL0p1QyxDQWlLdkM7O0VBQ0EsSUFBSWtKLGVBQWUsR0FBRyxJQUFJdmMsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLE9BQVosQ0FBdEI7RUFDQWtQLGVBQWUsQ0FBQ25VLE9BQWhCLEdBQTBCLEdBQTFCO0VBQ0FtVSxlQUFlLENBQUNsVSxPQUFoQixHQUEwQixHQUExQjtFQUNBLElBQUltVSxjQUFjLEdBQUdELGVBQWUsQ0FBQzlNLFlBQWhCLENBQTZCelAsRUFBRSxDQUFDSyxLQUFoQyxDQUFyQjtFQUNBbWMsY0FBYyxDQUFDelosTUFBZixHQUF3QixJQUF4QjtFQUNBeVosY0FBYyxDQUFDOU0sUUFBZixHQUEwQixFQUExQjtFQUNBOE0sY0FBYyxDQUFDN00sVUFBZixHQUE0QixFQUE1QjtFQUNBNk0sY0FBYyxDQUFDNU0sZUFBZixHQUFpQzVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBMUQ7RUFDQXlNLGVBQWUsQ0FBQ3hNLEtBQWhCLEdBQXdCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQXhCO0VBQ0F3TSxlQUFlLENBQUN0TixNQUFoQixHQUF5Qm9OLFNBQXpCLENBM0t1QyxDQTZLdkM7O0VBQ0EsSUFBSUksZ0JBQWdCLEdBQUdKLFNBQVMsQ0FBQzVNLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUM2TSxNQUExQixDQUF2QjtFQUNBNFAsZ0JBQWdCLENBQUMzUCxVQUFqQixHQUE4QjlNLEVBQUUsQ0FBQzZNLE1BQUgsQ0FBVUUsVUFBVixDQUFxQkMsS0FBbkQ7RUFDQXlQLGdCQUFnQixDQUFDeFAsUUFBakIsR0FBNEIsR0FBNUI7RUFDQXdQLGdCQUFnQixDQUFDdlAsU0FBakIsR0FBNkIsR0FBN0I7RUFFQW1QLFNBQVMsQ0FBQ3BOLE1BQVYsR0FBbUI4RCxRQUFuQixDQW5MdUMsQ0FxTHZDOztFQUNBc0osU0FBUyxDQUFDMVgsRUFBVixDQUFhM0UsRUFBRSxDQUFDcU4sSUFBSCxDQUFRQyxTQUFSLENBQWtCQyxTQUEvQixFQUEwQyxVQUFTQyxLQUFULEVBQWdCO0lBQ3REQSxLQUFLLENBQUNDLGVBQU4sR0FEc0QsQ0FHdEQ7O0lBQ0E1TCxJQUFJLENBQUM2YSxrQkFBTCxDQUF3QjlYLElBQXhCLEVBSnNELENBTXREOzs7SUFDQS9DLElBQUksQ0FBQzRZLHNCQUFMLEdBQThCLElBQTlCO0lBQ0E1WSxJQUFJLENBQUNnWiw0QkFBTCxHQUFvQyxJQUFwQztJQUNBaFosSUFBSSxDQUFDa1osOEJBQUwsR0FBc0MsSUFBdEM7SUFDQUQsVUFBVSxDQUFDek0sT0FBWDtFQUNILENBWEQ7QUFZSCxDQTU1REwsWUErNURJcU8sa0JBLzVESixHQSs1RHdCLDRCQUFTOVgsSUFBVCxFQUFlO0VBQy9CLElBQUkvQyxJQUFJLEdBQUcsSUFBWDtFQUNBLElBQUliLFFBQVEsR0FBR0QsTUFBTSxDQUFDQyxRQUF0QjtFQUVBQyxPQUFPLENBQUN5WixHQUFSLENBQVksaUNBQVosRUFBK0M5VixJQUFJLENBQUNnVyxPQUFwRCxFQUorQixDQU0vQjs7RUFDQSxJQUFJalYsTUFBTSxHQUFHM0UsUUFBUSxJQUFJQSxRQUFRLENBQUMyRSxNQUFsQzs7RUFDQSxJQUFJQSxNQUFNLElBQUlBLE1BQU0sQ0FBQ2dYLHFCQUFyQixFQUE0QztJQUN4Q2hYLE1BQU0sQ0FBQ2dYLHFCQUFQLENBQTZCO01BQ3pCL0IsT0FBTyxFQUFFaFcsSUFBSSxDQUFDZ1c7SUFEVyxDQUE3QjtFQUdILENBWjhCLENBYy9COzs7RUFDQSxJQUFJN1osTUFBTSxDQUFDK00sU0FBUCxJQUFvQi9NLE1BQU0sQ0FBQytNLFNBQVAsQ0FBaUI4TyxlQUF6QyxFQUEwRDtJQUN0RCxPQUFPN2IsTUFBTSxDQUFDK00sU0FBUCxDQUFpQjhPLGVBQWpCLENBQWlDaFksSUFBSSxDQUFDZ1csT0FBdEMsQ0FBUDtJQUNBN1osTUFBTSxDQUFDK00sU0FBUCxDQUFpQitPLFdBQWpCLElBQWdDOWIsTUFBTSxDQUFDK00sU0FBUCxDQUFpQitPLFdBQWpCLEVBQWhDO0VBQ0gsQ0FsQjhCLENBb0IvQjs7O0VBQ0EsS0FBS3RDLGlCQUFMLEdBQXlCLElBQXpCO0FBQ0gsQ0FyN0RMLFlBdzdESTZCLGdCQXg3REosR0F3N0RzQiwwQkFBU3hYLElBQVQsRUFBZTtFQUM3QixJQUFJL0MsSUFBSSxHQUFHLElBQVg7RUFDQSxJQUFJYixRQUFRLEdBQUdELE1BQU0sQ0FBQ0MsUUFBdEI7RUFFQUMsT0FBTyxDQUFDeVosR0FBUixDQUFZLDJCQUFaLEVBQXlDbkYsSUFBSSxDQUFDb0YsU0FBTCxDQUFlL1YsSUFBZixDQUF6QyxFQUo2QixDQU03Qjs7RUFDQSxJQUFJNUQsUUFBSixFQUFjO0lBQ1ZBLFFBQVEsQ0FBQzhiLGlCQUFULEdBQTZCbFksSUFBN0I7RUFDSCxDQVQ0QixDQVc3Qjs7O0VBQ0EsSUFBSTdELE1BQU0sQ0FBQytNLFNBQVAsSUFBb0IvTSxNQUFNLENBQUMrTSxTQUFQLENBQWlCOE8sZUFBekMsRUFBMEQ7SUFDdEQsT0FBTzdiLE1BQU0sQ0FBQytNLFNBQVAsQ0FBaUI4TyxlQUFqQixDQUFpQ2hZLElBQUksQ0FBQ2dXLE9BQXRDLENBQVA7SUFDQTdaLE1BQU0sQ0FBQytNLFNBQVAsQ0FBaUIrTyxXQUFqQixJQUFnQzliLE1BQU0sQ0FBQytNLFNBQVAsQ0FBaUIrTyxXQUFqQixFQUFoQztFQUNILENBZjRCLENBaUI3Qjs7O0VBQ0EsSUFBSWxYLE1BQU0sR0FBRzNFLFFBQVEsSUFBSUEsUUFBUSxDQUFDMkUsTUFBbEM7O0VBQ0EsSUFBSUEsTUFBTSxJQUFJQSxNQUFNLENBQUNvWCxjQUFyQixFQUFxQztJQUNqQztJQUNBLEtBQUtDLGtCQUFMLENBQXdCLFlBQXhCLEVBRmlDLENBSWpDOzs7SUFDQSxJQUFJQyxpQkFBaUIsR0FBRyxTQUFwQkEsaUJBQW9CLENBQVNoUixRQUFULEVBQW1CO01BQ3ZDaEwsT0FBTyxDQUFDeVosR0FBUixDQUFZLHNDQUFaLEVBQW9EbkYsSUFBSSxDQUFDb0YsU0FBTCxDQUFlMU8sUUFBZixDQUFwRCxFQUR1QyxDQUd2Qzs7TUFDQSxJQUFJcEssSUFBSSxDQUFDcWIsa0JBQVQsRUFBNkI7UUFDekJDLFlBQVksQ0FBQ3RiLElBQUksQ0FBQ3FiLGtCQUFOLENBQVo7UUFDQXJiLElBQUksQ0FBQ3FiLGtCQUFMLEdBQTBCLElBQTFCO01BQ0gsQ0FQc0MsQ0FTdkM7TUFDQTs7O01BQ0EsSUFBSUUsT0FBTyxHQUFHblIsUUFBUSxDQUFDbVIsT0FBVCxJQUFvQixFQUFsQztNQUNBLElBQUlDLGlCQUFpQixHQUFHO1FBQ3BCQyxNQUFNLEVBQUVyUixRQUFRLENBQUNzUixTQUFULElBQXNCLE9BRFY7UUFFcEJBLFNBQVMsRUFBRXRSLFFBQVEsQ0FBQ3NSLFNBQVQsSUFBc0IsT0FGYjtRQUdwQkMsU0FBUyxFQUFFdlIsUUFBUSxDQUFDd1IsTUFBVCxHQUFrQnhSLFFBQVEsQ0FBQ3dSLE1BQVQsQ0FBZ0JDLElBQWhCLEdBQXVCLENBQXpDLEdBQTZDLENBSHBDO1FBSXBCQyxVQUFVLEVBQUVQLE9BQU8sQ0FBQ1EsR0FBUixDQUFZLFVBQVNDLENBQVQsRUFBWUMsR0FBWixFQUFpQjtVQUNyQyxPQUFPO1lBQ0hDLFNBQVMsRUFBRUYsQ0FBQyxDQUFDcFQsRUFEVjtZQUVIdVQsU0FBUyxFQUFFSCxDQUFDLENBQUN0VyxJQUZWO1lBR0gxRSxTQUFTLEVBQUVnYixDQUFDLENBQUNJLE1BQUYsSUFBWSxVQUhwQjtZQUdpQztZQUNwQ0MsVUFBVSxFQUFFTCxDQUFDLENBQUNLLFVBQUYsSUFBZ0IsQ0FKekI7WUFLSEMsU0FBUyxFQUFFTixDQUFDLENBQUNLLFVBQUYsSUFBZ0IsQ0FMeEI7WUFNSFYsU0FBUyxFQUFFLENBQUNLLENBQUMsQ0FBQ0gsSUFBRixLQUFXMWEsU0FBWCxHQUF1QjZhLENBQUMsQ0FBQ0gsSUFBekIsR0FBZ0NJLEdBQWpDLElBQXdDLENBTmhEO1lBT0hNLE9BQU8sRUFBRVAsQ0FBQyxDQUFDUSxLQUFGLElBQVcsS0FQakI7WUFRSEMsVUFBVSxFQUFFVCxDQUFDLENBQUNTLFVBQUYsSUFBZ0IsQ0FSekI7WUFRNkI7WUFDaENDLFVBQVUsRUFBRVYsQ0FBQyxDQUFDVSxVQUFGLElBQWdCLENBVHpCO1lBUzZCO1lBQ2hDdkQsU0FBUyxFQUFFNkMsQ0FBQyxDQUFDN0MsU0FBRixJQUFlLEVBVnZCLENBVTZCOztVQVY3QixDQUFQO1FBWUgsQ0FiVyxDQUpRO1FBa0JwQndELGFBQWEsRUFBRXZTLFFBQVEsQ0FBQ3dTLFVBQVQsSUFBdUIsRUFsQmxCO1FBbUJwQkEsVUFBVSxFQUFFeFMsUUFBUSxDQUFDd1MsVUFBVCxJQUF1QixFQW5CZjtRQW9CcEJ0VCxhQUFhLEVBQUUsQ0FwQks7UUFvQkQ7UUFDbkI2UCxTQUFTLEVBQUVwVyxJQUFJLENBQUNvVztNQXJCSSxDQUF4QjtNQXdCQS9aLE9BQU8sQ0FBQ3laLEdBQVIsQ0FBWSx1QkFBWixFQUFxQ25GLElBQUksQ0FBQ29GLFNBQUwsQ0FBZTBDLGlCQUFmLENBQXJDLEVBcEN1QyxDQXNDdkM7O01BQ0EsSUFBSXJjLFFBQUosRUFBYztRQUNWQSxRQUFRLENBQUNpTCxRQUFULEdBQW9Cb1IsaUJBQXBCO01BQ0gsQ0F6Q3NDLENBMkN2Qzs7O01BQ0F4YixJQUFJLENBQUM2YyxlQUFMLENBQXFCckIsaUJBQXJCO0lBQ0gsQ0E3Q0QsQ0FMaUMsQ0FvRGpDOzs7SUFDQTFYLE1BQU0sQ0FBQ2daLFlBQVAsQ0FBb0IxQixpQkFBcEIsRUFyRGlDLENBdURqQzs7SUFDQSxLQUFLQyxrQkFBTCxHQUEwQmhiLFVBQVUsQ0FBQyxZQUFXO01BQzVDakIsT0FBTyxDQUFDeVosR0FBUixDQUFZLHdDQUFaO01BQ0E3WSxJQUFJLENBQUNxYixrQkFBTCxHQUEwQixJQUExQixDQUY0QyxDQUk1Qzs7TUFDQSxJQUFJMEIsWUFBWSxHQUFHO1FBQ2ZyQixTQUFTLEVBQUUsV0FBVzNZLElBQUksQ0FBQ29XLFNBRFo7UUFFZkosT0FBTyxFQUFFaFcsSUFBSSxDQUFDZ1csT0FGQztRQUdmbFEsU0FBUyxFQUFFOUYsSUFBSSxDQUFDOEYsU0FIRDtRQUlmUyxhQUFhLEVBQUUsQ0FKQTtRQUtmNlAsU0FBUyxFQUFFcFcsSUFBSSxDQUFDb1c7TUFMRCxDQUFuQjs7TUFRQSxJQUFJaGEsUUFBSixFQUFjO1FBQ1ZBLFFBQVEsQ0FBQ2lMLFFBQVQsR0FBb0IyUyxZQUFwQjtNQUNIOztNQUVEL2MsSUFBSSxDQUFDNmMsZUFBTCxDQUFxQkUsWUFBckI7SUFDSCxDQWxCbUMsRUFrQmpDLEtBbEJpQyxDQUFwQyxDQXhEaUMsQ0E0RWpDOztJQUNBalosTUFBTSxDQUFDb1gsY0FBUCxDQUFzQjtNQUNsQi9CLFNBQVMsRUFBRXBXLElBQUksQ0FBQ29XLFNBREU7TUFFbEJKLE9BQU8sRUFBRWhXLElBQUksQ0FBQ2dXO0lBRkksQ0FBdEI7RUFJSCxDQWpGRCxNQWlGTztJQUNIM1osT0FBTyxDQUFDQyxJQUFSLENBQWEsMkNBQWIsRUFERyxDQUVIOztJQUNBLElBQUl1TCxVQUFVLEdBQUc7TUFDYmhDLEVBQUUsRUFBRTdGLElBQUksQ0FBQ2dXLE9BREk7TUFFYmxRLFNBQVMsRUFBRTlGLElBQUksQ0FBQzhGLFNBRkg7TUFHYm1VLGNBQWMsRUFBRWphLElBQUksQ0FBQ2lhLGNBSFI7TUFJYjFULGFBQWEsRUFBRSxDQUpGO01BS2J5RixjQUFjLEVBQUVoTSxJQUFJLENBQUNrYSxVQUxSO01BTWJDLFlBQVksRUFBRW5hLElBQUksQ0FBQ21hLFlBTk47TUFPYnpJLGNBQWMsRUFBRTFSLElBQUksQ0FBQzBSO0lBUFIsQ0FBakI7O0lBVUEsSUFBSXRWLFFBQUosRUFBYztNQUNWQSxRQUFRLENBQUNxUSxpQkFBVCxHQUE2QjVFLFVBQTdCO01BQ0F6TCxRQUFRLENBQUNzUSxnQkFBVCxHQUE0QjFNLElBQUksQ0FBQ2dXLE9BQWpDO01BQ0E1WixRQUFRLENBQUN1USxlQUFULEdBQTJCM00sSUFBSSxDQUFDOEYsU0FBaEM7SUFDSDs7SUFFRCxLQUFLc1Usb0JBQUwsQ0FBMEJwYSxJQUExQixFQUFnQzZILFVBQWhDO0VBQ0g7QUFDSixDQWpqRUwsWUFvakVJdVMsb0JBcGpFSixHQW9qRTBCLDhCQUFTQyxTQUFULEVBQW9CeFMsVUFBcEIsRUFBZ0M7RUFDbEQsSUFBSTVLLElBQUksR0FBRyxJQUFYO0VBQ0EsSUFBSWIsUUFBUSxHQUFHRCxNQUFNLENBQUNDLFFBQXRCLENBRmtELENBSWxEOztFQUNBLEtBQUtnYyxrQkFBTCxDQUF3QixZQUF4QixFQUxrRCxDQU9sRDs7O0VBQ0EsSUFBSS9RLFFBQVEsR0FBRztJQUNYc1IsU0FBUyxFQUFFMEIsU0FBUyxDQUFDMUIsU0FBVixJQUF3QixXQUFXMEIsU0FBUyxDQUFDakUsU0FEN0M7SUFFWEosT0FBTyxFQUFFcUUsU0FBUyxDQUFDckUsT0FGUjtJQUdYbFEsU0FBUyxFQUFFdVUsU0FBUyxDQUFDdlUsU0FIVjtJQUlYUyxhQUFhLEVBQUUsQ0FKSjtJQUlRO0lBQ25CUCxVQUFVLEVBQUU2QixVQUFVLENBQUM3QixVQUFYLElBQXlCLENBTDFCO0lBTVhDLFVBQVUsRUFBRTRCLFVBQVUsQ0FBQzVCLFVBQVgsSUFBeUIsQ0FOMUI7SUFPWG1RLFNBQVMsRUFBRWlFLFNBQVMsQ0FBQ2pFLFNBUFY7SUFRWCtELFlBQVksRUFBRUUsU0FBUyxDQUFDRjtFQVJiLENBQWYsQ0FSa0QsQ0FtQmxEOztFQUNBLElBQUkvZCxRQUFKLEVBQWM7SUFDVkEsUUFBUSxDQUFDaUwsUUFBVCxHQUFvQkEsUUFBcEI7SUFDQWpMLFFBQVEsQ0FBQ2lCLFVBQVQsR0FBc0JqQixRQUFRLENBQUNpQixVQUFULElBQXVCLEVBQTdDO0lBQ0FqQixRQUFRLENBQUNpQixVQUFULENBQW9CaWQsTUFBcEIsR0FBNkJ6UyxVQUFVLENBQUM3QixVQUFYLElBQXlCLENBQXREO0lBQ0E1SixRQUFRLENBQUNpQixVQUFULENBQW9Ca2QsSUFBcEIsR0FBMkIxUyxVQUFVLENBQUM1QixVQUFYLElBQXlCLENBQXBEO0VBQ0gsQ0F6QmlELENBMkJsRDs7O0VBQ0EsSUFBSXVVLFVBQVUsR0FBRyxHQUFqQixDQTVCa0QsQ0E0QjNCO0VBRXZCOztFQUNBLElBQUlILFNBQVMsQ0FBQ0ksU0FBVixJQUF1QkosU0FBUyxDQUFDSSxTQUFWLEdBQXNCLENBQWpELEVBQW9EO0lBQ2hERCxVQUFVLEdBQUd6USxJQUFJLENBQUMyUSxHQUFMLENBQVNMLFNBQVMsQ0FBQ0ksU0FBVixHQUFzQixJQUEvQixFQUFxQyxJQUFyQyxDQUFiLENBRGdELENBQ1U7RUFDN0Q7O0VBRURwZSxPQUFPLENBQUN5WixHQUFSLENBQVksb0JBQW9CMEUsVUFBcEIsR0FBaUMsWUFBN0MsRUFuQ2tELENBcUNsRDs7RUFDQSxLQUFLRyxnQkFBTCxHQUF3QnJkLFVBQVUsQ0FBQyxZQUFXO0lBQzFDTCxJQUFJLENBQUMwZCxnQkFBTCxHQUF3QixJQUF4QjtJQUNBdGUsT0FBTyxDQUFDeVosR0FBUixDQUFZLG9CQUFaOztJQUNBN1ksSUFBSSxDQUFDNmMsZUFBTCxDQUFxQnpTLFFBQXJCO0VBQ0gsQ0FKaUMsRUFJL0JtVCxVQUorQixDQUFsQztBQUtILENBL2xFTCxZQWttRUlqRiwrQkFsbUVKLEdBa21FcUMsMkNBQVc7RUFDeEMsSUFBSSxDQUFDLEtBQUtoTixXQUFWLEVBQXVCO0VBRXZCLElBQUk3SCxHQUFHLEdBQUdELElBQUksQ0FBQ0MsR0FBTCxFQUFWOztFQUVBLEtBQUssSUFBSWMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxLQUFLK0csV0FBTCxDQUFpQjlHLE1BQXJDLEVBQTZDRCxDQUFDLEVBQTlDLEVBQWtEO0lBQzlDLElBQUlvRyxJQUFJLEdBQUcsS0FBS1csV0FBTCxDQUFpQi9HLENBQWpCLENBQVg7SUFDQSxJQUFJd0YsTUFBTSxHQUFHWSxJQUFJLENBQUNaLE1BQWxCO0lBQ0EsSUFBSTZGLE1BQU0sR0FBRzdGLE1BQU0sQ0FBQ25CLEVBQXBCLENBSDhDLENBSzlDOztJQUNBLElBQUksS0FBS2tQLGlCQUFMLENBQXVCbEksTUFBdkIsQ0FBSixFQUFvQyxTQU5VLENBUTlDOztJQUNBLElBQUkrTixTQUFTLEdBQUcsS0FBS0MsbUJBQUwsQ0FBeUI3VCxNQUF6QixDQUFoQjs7SUFFQSxLQUFLK04saUJBQUwsQ0FBdUJsSSxNQUF2QixJQUFpQztNQUM3QjBILFFBQVEsRUFBRXFHLFNBQVMsQ0FBQ3JHLFFBRFM7TUFFN0J1RyxXQUFXLEVBQUVGLFNBQVMsQ0FBQ0UsV0FGTTtNQUVRO01BQ3JDQyxLQUFLLEVBQUVILFNBQVMsQ0FBQ0csS0FIWTtNQUk3QjdILFNBQVMsRUFBRTBILFNBQVMsQ0FBQzFILFNBSlE7TUFLN0I4SCxTQUFTLEVBQUVKLFNBQVMsQ0FBQ0ksU0FMUTtNQU03QkMsWUFBWSxFQUFFLENBTmU7TUFNWDtNQUNsQkMsVUFBVSxFQUFFLEVBUGlCO01BUTdCQyxVQUFVLEVBQUV6YSxHQVJpQjtNQVM3QjBhLGlCQUFpQixFQUFFLElBVFUsQ0FTSjs7SUFUSSxDQUFqQztFQVdILENBM0J1QyxDQTZCeEM7OztFQUNBLEtBQUtDLDhCQUFMO0FBQ0gsQ0Fqb0VMLFlBb29FSW5HLGtCQXBvRUosR0Fvb0V3Qiw0QkFBU0QsTUFBVCxFQUFpQjtFQUNqQyxJQUFJLENBQUNBLE1BQUwsRUFBYTtFQUViLElBQUl2VSxHQUFHLEdBQUdELElBQUksQ0FBQ0MsR0FBTCxFQUFWLENBSGlDLENBS2pDO0VBRUE7O0VBQ0EsS0FBSyxJQUFJYyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHeVQsTUFBTSxDQUFDeFQsTUFBM0IsRUFBbUNELENBQUMsRUFBcEMsRUFBd0M7SUFDcEMsSUFBSThaLEtBQUssR0FBR3JHLE1BQU0sQ0FBQ3pULENBQUQsQ0FBbEI7SUFDQSxJQUFJcUwsTUFBTSxHQUFHeU8sS0FBSyxDQUFDdEYsT0FBbkI7SUFDQSxJQUFJdUYsY0FBYyxHQUFHRCxLQUFLLENBQUNFLGFBQU4sSUFBdUJGLEtBQUssQ0FBQ1IsV0FBN0IsSUFBNEMsRUFBakUsQ0FIb0MsQ0FLcEM7SUFFQTs7SUFDQSxJQUFJVyxTQUFTLEdBQUcsS0FBSzFHLGlCQUFMLENBQXVCbEksTUFBdkIsQ0FBaEI7O0lBQ0EsSUFBSTRPLFNBQVMsSUFBSUEsU0FBUyxDQUFDWCxXQUF2QixJQUFzQ1MsY0FBdEMsSUFBd0RFLFNBQVMsQ0FBQ1gsV0FBVixLQUEwQlMsY0FBdEYsRUFBc0c7TUFDbEc7TUFDQTtNQUNBO01BQ0E7TUFDQTtNQUVBO01BQ0EsSUFBSXBmLE1BQU0sQ0FBQytNLFNBQVAsSUFBb0IvTSxNQUFNLENBQUMrTSxTQUFQLENBQWlCOE8sZUFBckMsSUFBd0Q3YixNQUFNLENBQUMrTSxTQUFQLENBQWlCOE8sZUFBakIsQ0FBaUNuTCxNQUFqQyxDQUE1RCxFQUFzRztRQUNsRyxJQUFJNk8sV0FBVyxHQUFHdmYsTUFBTSxDQUFDK00sU0FBUCxDQUFpQjhPLGVBQWpCLENBQWlDbkwsTUFBakMsRUFBeUMwSCxRQUEzRDtRQUNBLE9BQU9wWSxNQUFNLENBQUMrTSxTQUFQLENBQWlCOE8sZUFBakIsQ0FBaUNuTCxNQUFqQyxDQUFQO1FBQ0ExUSxNQUFNLENBQUMrTSxTQUFQLENBQWlCK08sV0FBakIsSUFBZ0M5YixNQUFNLENBQUMrTSxTQUFQLENBQWlCK08sV0FBakIsRUFBaEM7TUFDSDtJQUNKLENBdEJtQyxDQXdCcEM7OztJQUNBLEtBQUtsRCxpQkFBTCxDQUF1QmxJLE1BQXZCLElBQWlDO01BQzdCMEgsUUFBUSxFQUFFK0csS0FBSyxDQUFDbEYsU0FEYTtNQUU3QjBFLFdBQVcsRUFBRVMsY0FGZ0I7TUFHN0JSLEtBQUssRUFBRU8sS0FBSyxDQUFDUCxLQUFOLElBQWUsQ0FITztNQUk3QjdILFNBQVMsRUFBRW9JLEtBQUssQ0FBQ3BJLFNBSlk7TUFLN0I4SCxTQUFTLEVBQUVNLEtBQUssQ0FBQ0ssVUFMWTtNQU03QlYsWUFBWSxFQUFFSyxLQUFLLENBQUN2RSxhQUFOLElBQXVCdUUsS0FBSyxDQUFDTCxZQUE3QixJQUE2QyxDQU45QjtNQU83QkMsVUFBVSxFQUFFSSxLQUFLLENBQUNNLFdBQU4sSUFBcUJOLEtBQUssQ0FBQ0osVUFBM0IsSUFBeUMsRUFQeEI7TUFRN0JDLFVBQVUsRUFBRXphLEdBUmlCO01BUzdCMGEsaUJBQWlCLEVBQUUsS0FUVSxDQVNIOztJQVRHLENBQWpDO0VBV0gsQ0E1Q2dDLENBOENqQzs7O0VBQ0EsS0FBS0MsOEJBQUw7QUFDSCxDQXByRUwsWUF1ckVJNUYscUJBdnJFSixHQXVyRTJCLGlDQUFXO0VBQzlCLElBQUksQ0FBQyxLQUFLVixpQkFBVixFQUE2QjtFQUU3QixJQUFJclUsR0FBRyxHQUFHRCxJQUFJLENBQUNDLEdBQUwsRUFBVjtFQUNBLElBQUltYixVQUFVLEdBQUcsS0FBakIsQ0FKOEIsQ0FNOUI7O0VBQ0EsS0FBSyxJQUFJaFAsTUFBVCxJQUFtQixLQUFLa0ksaUJBQXhCLEVBQTJDO0lBQ3ZDLElBQUkxTyxNQUFNLEdBQUcsS0FBSzBPLGlCQUFMLENBQXVCbEksTUFBdkIsQ0FBYixDQUR1QyxDQUd2Qzs7SUFDQSxJQUFJaVAsbUJBQW1CLEdBQUcsQ0FBQ3BiLEdBQUcsR0FBRzJGLE1BQU0sQ0FBQzhVLFVBQWQsSUFBNEIsSUFBdEQ7O0lBQ0EsSUFBSVcsbUJBQW1CLEdBQUcsRUFBMUIsRUFBOEI7TUFDMUI7TUFDQSxJQUFJOVUsTUFBTSxHQUFHLEtBQUsrVSx1QkFBTCxDQUE2QnpLLFFBQVEsQ0FBQ3pFLE1BQUQsQ0FBckMsQ0FBYjs7TUFDQSxJQUFJN0YsTUFBSixFQUFZO1FBQ1IsSUFBSTRULFNBQVMsR0FBRyxLQUFLQyxtQkFBTCxDQUF5QjdULE1BQXpCLENBQWhCLENBRFEsQ0FFUjs7O1FBQ0EsSUFBSVgsTUFBTSxDQUFDeVUsV0FBUCxLQUF1QkYsU0FBUyxDQUFDRSxXQUFqQyxJQUFnREYsU0FBUyxDQUFDRSxXQUFWLEtBQTBCLEVBQTlFLEVBQWtGO1VBQzlFelUsTUFBTSxDQUFDNFUsWUFBUCxHQUFzQixDQUF0QixDQUQ4RSxDQUNwRDtVQUUxQjtVQUNBO1VBRUE7O1VBQ0EsSUFBSTllLE1BQU0sQ0FBQytNLFNBQVAsSUFBb0IvTSxNQUFNLENBQUMrTSxTQUFQLENBQWlCOE8sZUFBckMsSUFBd0Q3YixNQUFNLENBQUMrTSxTQUFQLENBQWlCOE8sZUFBakIsQ0FBaUNuTCxNQUFqQyxDQUE1RCxFQUFzRztZQUNsRyxJQUFJNk8sV0FBVyxHQUFHdmYsTUFBTSxDQUFDK00sU0FBUCxDQUFpQjhPLGVBQWpCLENBQWlDbkwsTUFBakMsRUFBeUMwSCxRQUEzRDtZQUNBLE9BQU9wWSxNQUFNLENBQUMrTSxTQUFQLENBQWlCOE8sZUFBakIsQ0FBaUNuTCxNQUFqQyxDQUFQO1lBQ0ExUSxNQUFNLENBQUMrTSxTQUFQLENBQWlCK08sV0FBakIsSUFBZ0M5YixNQUFNLENBQUMrTSxTQUFQLENBQWlCK08sV0FBakIsRUFBaEM7VUFDSDtRQUNKOztRQUNENVIsTUFBTSxDQUFDMFUsS0FBUCxHQUFlSCxTQUFTLENBQUNHLEtBQXpCO1FBQ0ExVSxNQUFNLENBQUM2TSxTQUFQLEdBQW1CMEgsU0FBUyxDQUFDMUgsU0FBN0I7UUFDQTdNLE1BQU0sQ0FBQzJVLFNBQVAsR0FBbUJKLFNBQVMsQ0FBQ0ksU0FBN0I7UUFDQTNVLE1BQU0sQ0FBQ2tPLFFBQVAsR0FBa0JxRyxTQUFTLENBQUNyRyxRQUE1QjtRQUNBbE8sTUFBTSxDQUFDeVUsV0FBUCxHQUFxQkYsU0FBUyxDQUFDRSxXQUEvQjtRQUNBelUsTUFBTSxDQUFDK1UsaUJBQVAsR0FBMkIsSUFBM0I7UUFDQVMsVUFBVSxHQUFHLElBQWI7TUFDSDs7TUFDRDtJQUNILENBakNzQyxDQW1DdkM7OztJQUNBLElBQUl4VixNQUFNLENBQUM2TSxTQUFQLEdBQW1CLENBQXZCLEVBQTBCO01BQ3RCN00sTUFBTSxDQUFDNk0sU0FBUDtNQUNBMkksVUFBVSxHQUFHLElBQWIsQ0FGc0IsQ0FJdEI7O01BQ0EsSUFBSXhWLE1BQU0sQ0FBQzZNLFNBQVAsS0FBcUIsQ0FBekIsRUFBNEI7UUFDeEIsSUFBSWxNLE1BQU0sR0FBRyxLQUFLK1UsdUJBQUwsQ0FBNkJ6SyxRQUFRLENBQUN6RSxNQUFELENBQXJDLENBQWI7O1FBQ0EsSUFBSTdGLE1BQUosRUFBWTtVQUNSLElBQUk0VCxTQUFTLEdBQUcsS0FBS0MsbUJBQUwsQ0FBeUI3VCxNQUF6QixDQUFoQixDQURRLENBRVI7OztVQUNBLElBQUlYLE1BQU0sQ0FBQ3lVLFdBQVAsS0FBdUJGLFNBQVMsQ0FBQ0UsV0FBakMsSUFBZ0RGLFNBQVMsQ0FBQ0UsV0FBVixLQUEwQixFQUE5RSxFQUFrRjtZQUM5RXpVLE1BQU0sQ0FBQzRVLFlBQVAsR0FBc0IsQ0FBdEIsQ0FEOEUsQ0FDcEQ7WUFFMUI7WUFDQTtZQUVBOztZQUNBLElBQUk5ZSxNQUFNLENBQUMrTSxTQUFQLElBQW9CL00sTUFBTSxDQUFDK00sU0FBUCxDQUFpQjhPLGVBQXJDLElBQXdEN2IsTUFBTSxDQUFDK00sU0FBUCxDQUFpQjhPLGVBQWpCLENBQWlDbkwsTUFBakMsQ0FBNUQsRUFBc0c7Y0FDbEcsSUFBSTZPLFdBQVcsR0FBR3ZmLE1BQU0sQ0FBQytNLFNBQVAsQ0FBaUI4TyxlQUFqQixDQUFpQ25MLE1BQWpDLEVBQXlDMEgsUUFBM0Q7Y0FDQSxPQUFPcFksTUFBTSxDQUFDK00sU0FBUCxDQUFpQjhPLGVBQWpCLENBQWlDbkwsTUFBakMsQ0FBUDtjQUNBMVEsTUFBTSxDQUFDK00sU0FBUCxDQUFpQitPLFdBQWpCLElBQWdDOWIsTUFBTSxDQUFDK00sU0FBUCxDQUFpQitPLFdBQWpCLEVBQWhDO1lBQ0g7VUFDSjs7VUFDRDVSLE1BQU0sQ0FBQzBVLEtBQVAsR0FBZUgsU0FBUyxDQUFDRyxLQUF6QjtVQUNBMVUsTUFBTSxDQUFDNk0sU0FBUCxHQUFtQjBILFNBQVMsQ0FBQzFILFNBQTdCO1VBQ0E3TSxNQUFNLENBQUMyVSxTQUFQLEdBQW1CSixTQUFTLENBQUNJLFNBQTdCO1VBQ0EzVSxNQUFNLENBQUNrTyxRQUFQLEdBQWtCcUcsU0FBUyxDQUFDckcsUUFBNUI7VUFDQWxPLE1BQU0sQ0FBQ3lVLFdBQVAsR0FBcUJGLFNBQVMsQ0FBQ0UsV0FBL0I7UUFDSDtNQUNKO0lBQ0o7RUFDSixDQTFFNkIsQ0E0RTlCOzs7RUFDQSxJQUFJZSxVQUFKLEVBQWdCO0lBQ1osS0FBS1IsOEJBQUw7RUFDSDtBQUNKLENBdndFTCxZQTB3RUlSLG1CQTF3RUosR0Ewd0V5Qiw2QkFBUzdULE1BQVQsRUFBaUI7RUFDbEMsSUFBSXpCLE1BQU0sR0FBRztJQUNUd1YsS0FBSyxFQUFFLENBREU7SUFFVDdILFNBQVMsRUFBRSxDQUFDLENBRkg7SUFHVDhILFNBQVMsRUFBRSxLQUhGO0lBSVR6RyxRQUFRLEVBQUUsQ0FKRDtJQUtUdUcsV0FBVyxFQUFFLEVBTEosQ0FLUTs7RUFMUixDQUFiO0VBUUEsSUFBSXRLLGVBQWUsR0FBR3hKLE1BQU0sQ0FBQ3lKLGlCQUFQLElBQTRCekosTUFBTSxDQUFDd0osZUFBekQ7RUFDQSxJQUFJaUIsYUFBYSxHQUFHekssTUFBTSxDQUFDMEssY0FBUCxJQUF5QjFLLE1BQU0sQ0FBQ3lLLGFBQWhDLElBQWlEekssTUFBTSxDQUFDMkssZ0JBQXhELElBQTRFM0ssTUFBTSxDQUFDNEssZUFBbkYsSUFBc0csQ0FBMUg7RUFDQSxJQUFJekssUUFBUSxHQUFHSCxNQUFNLENBQUNqQixTQUFQLElBQW9CaUIsTUFBTSxDQUFDRyxRQUEzQixJQUF1QyxDQUF0RDs7RUFFQSxJQUFJLENBQUNxSixlQUFELElBQW9CLENBQUNpQixhQUF6QixFQUF3QztJQUNwQyxPQUFPbE0sTUFBUDtFQUNIOztFQUVELElBQUk7SUFDQSxJQUFJbUwsTUFBTSxHQUFHLE9BQU9GLGVBQVAsS0FBMkIsUUFBM0IsR0FBc0NHLElBQUksQ0FBQ0MsS0FBTCxDQUFXSixlQUFYLENBQXRDLEdBQW9FQSxlQUFqRjs7SUFDQSxJQUFJLENBQUNFLE1BQUQsSUFBV0EsTUFBTSxDQUFDalAsTUFBUCxLQUFrQixDQUFqQyxFQUFvQztNQUNoQyxPQUFPOEQsTUFBUDtJQUNIOztJQUVELElBQUk3RSxHQUFHLEdBQUcsSUFBSUQsSUFBSixFQUFWO0lBQ0EsSUFBSW9RLGNBQWMsR0FBR25RLEdBQUcsQ0FBQ29RLFFBQUosS0FBaUIsRUFBakIsR0FBc0JwUSxHQUFHLENBQUNxUSxVQUFKLEVBQTNDO0lBQ0EsSUFBSTZCLGNBQWMsR0FBR2xTLEdBQUcsQ0FBQ21TLFVBQUosRUFBckI7SUFDQSxJQUFJQyxtQkFBbUIsR0FBR2pDLGNBQWMsR0FBRyxFQUFqQixHQUFzQitCLGNBQWhELENBVEEsQ0FXQTs7SUFDQSxJQUFJZCxZQUFZLEdBQUcsSUFBbkI7SUFDQSxJQUFJQyxpQkFBaUIsR0FBRyxDQUF4Qjs7SUFDQSxLQUFLLElBQUl2USxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHa1AsTUFBTSxDQUFDalAsTUFBM0IsRUFBbUNELENBQUMsRUFBcEMsRUFBd0M7TUFDcEMsSUFBSXdQLEtBQUssR0FBR04sTUFBTSxDQUFDbFAsQ0FBRCxDQUFsQjtNQUNBLElBQUl5UCxVQUFVLEdBQUdELEtBQUssQ0FBQ0UsS0FBTixDQUFZYixLQUFaLENBQWtCLEdBQWxCLENBQWpCO01BQ0EsSUFBSWMsUUFBUSxHQUFHSCxLQUFLLENBQUNJLEdBQU4sQ0FBVWYsS0FBVixDQUFnQixHQUFoQixDQUFmO01BQ0EsSUFBSTJCLFFBQVEsR0FBR1YsUUFBUSxDQUFDTCxVQUFVLENBQUMsQ0FBRCxDQUFYLENBQVIsR0FBMEIsRUFBMUIsR0FBK0JLLFFBQVEsQ0FBQ0wsVUFBVSxDQUFDLENBQUQsQ0FBWCxDQUF0RDtNQUNBLElBQUlnQixNQUFNLEdBQUdYLFFBQVEsQ0FBQ0gsUUFBUSxDQUFDLENBQUQsQ0FBVCxDQUFSLEdBQXdCLEVBQXhCLEdBQTZCRyxRQUFRLENBQUNILFFBQVEsQ0FBQyxDQUFELENBQVQsQ0FBbEQ7O01BRUEsSUFBSU4sY0FBYyxJQUFJbUIsUUFBbEIsSUFBOEJuQixjQUFjLElBQUlvQixNQUFwRCxFQUE0RDtRQUN4REgsWUFBWSxHQUFHZCxLQUFmO1FBQ0FlLGlCQUFpQixHQUFHQyxRQUFwQjtRQUNBO01BQ0g7SUFDSjs7SUFFRCxJQUFJLENBQUNGLFlBQUwsRUFBbUI7TUFDZixPQUFPdk0sTUFBUDtJQUNILENBOUJELENBZ0NBOzs7SUFDQSxJQUFJd04saUJBQWlCLEdBQUdoQixpQkFBaUIsR0FBRyxFQUE1QztJQUNBLElBQUlrQixjQUFjLEdBQUdILG1CQUFtQixHQUFHQyxpQkFBM0MsQ0FsQ0EsQ0FvQ0E7SUFDQTtJQUNBOztJQUNBLElBQUlpSixrQkFBa0IsR0FBR3ZLLGFBQWEsR0FBRyxFQUF6QyxDQXZDQSxDQXlDQTs7SUFDQSxJQUFJd0ssY0FBYyxHQUFHLEVBQXJCLENBMUNBLENBNENBOztJQUNBLElBQUkxSCxRQUFRLEdBQUd4SyxJQUFJLENBQUN5SSxLQUFMLENBQVdTLGNBQWMsR0FBRytJLGtCQUE1QixJQUFrRCxDQUFqRSxDQTdDQSxDQStDQTs7SUFDQSxJQUFJRSxhQUFhLEdBQUdqSixjQUFjLEdBQUcrSSxrQkFBckMsQ0FoREEsQ0FrREE7SUFDQTtJQUNBOztJQUNBLElBQUlHLElBQUksR0FBR0MsTUFBTSxDQUFDMWIsR0FBRyxDQUFDMmIsV0FBSixFQUFELENBQU4sQ0FBMEJDLEtBQTFCLENBQWdDLENBQUMsQ0FBakMsQ0FBWCxDQXJEQSxDQXFEaUQ7O0lBQ2pELElBQUlDLEtBQUssR0FBR0gsTUFBTSxDQUFDMWIsR0FBRyxDQUFDOGIsUUFBSixLQUFpQixDQUFsQixDQUFOLENBQTJCQyxRQUEzQixDQUFvQyxDQUFwQyxFQUF1QyxHQUF2QyxDQUFaO0lBQ0EsSUFBSUMsR0FBRyxHQUFHTixNQUFNLENBQUMxYixHQUFHLENBQUNpYyxPQUFKLEVBQUQsQ0FBTixDQUFzQkYsUUFBdEIsQ0FBK0IsQ0FBL0IsRUFBa0MsR0FBbEMsQ0FBVjtJQUNBLElBQUlHLE9BQU8sR0FBR1QsSUFBSSxHQUFHSSxLQUFQLEdBQWVHLEdBQTdCLENBeERBLENBd0RtQztJQUVuQzs7SUFDQSxJQUFJN1AsTUFBTSxHQUFHN0YsTUFBTSxDQUFDbkIsRUFBUCxJQUFhbUIsTUFBTSxDQUFDZ1AsT0FBcEIsSUFBK0IsQ0FBNUM7SUFDQSxJQUFJNkcsU0FBUyxHQUFHVCxNQUFNLENBQUN2UCxNQUFNLEdBQUcsR0FBVixDQUFOLENBQXFCNFAsUUFBckIsQ0FBOEIsQ0FBOUIsRUFBaUMsR0FBakMsQ0FBaEIsQ0E1REEsQ0E0RHdEO0lBRXhEOztJQUNBLElBQUlLLE1BQU0sR0FBR1YsTUFBTSxDQUFDN0gsUUFBRCxDQUFOLENBQWlCa0ksUUFBakIsQ0FBMEIsQ0FBMUIsRUFBNkIsR0FBN0IsQ0FBYjtJQUVBLElBQUkzQixXQUFXLEdBQUc4QixPQUFPLEdBQUdDLFNBQVYsR0FBc0JDLE1BQXhDLENBakVBLENBaUVpRDtJQUVqRDs7SUFDQSxJQUFJWixhQUFhLEdBQUdELGNBQXBCLEVBQW9DO01BQ2hDO01BQ0ExVyxNQUFNLENBQUN3VixLQUFQLEdBQWUsQ0FBZjtNQUNBeFYsTUFBTSxDQUFDMk4sU0FBUCxHQUFtQitJLGNBQWMsR0FBR0MsYUFBcEM7TUFDQTNXLE1BQU0sQ0FBQ3lWLFNBQVAsR0FBbUIsS0FBbkI7SUFDSCxDQUxELE1BS087TUFDSDtNQUNBelYsTUFBTSxDQUFDd1YsS0FBUCxHQUFlLENBQWY7TUFDQXhWLE1BQU0sQ0FBQzJOLFNBQVAsR0FBbUI4SSxrQkFBa0IsR0FBR0UsYUFBeEM7TUFDQTNXLE1BQU0sQ0FBQ3lWLFNBQVAsR0FBbUJ6VixNQUFNLENBQUMyTixTQUFQLEdBQW1CLENBQXRDO0lBQ0g7O0lBQ0QzTixNQUFNLENBQUNnUCxRQUFQLEdBQWtCQSxRQUFsQjtJQUNBaFAsTUFBTSxDQUFDdVYsV0FBUCxHQUFxQkEsV0FBckI7RUFFSCxDQWxGRCxDQWtGRSxPQUFPL2MsQ0FBUCxFQUFVO0lBQ1IxQixPQUFPLENBQUNrQixLQUFSLENBQWMsZ0NBQWQsRUFBZ0RRLENBQWhEO0VBQ0g7O0VBRUQsT0FBT3dILE1BQVA7QUFDSCxDQWwzRUwsWUFxM0VJd1csdUJBcjNFSixHQXEzRTZCLGlDQUFTbFAsTUFBVCxFQUFpQjtFQUN0QyxJQUFJLENBQUMsS0FBS3RFLFdBQVYsRUFBdUIsT0FBTyxJQUFQOztFQUV2QixLQUFLLElBQUkvRyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUsrRyxXQUFMLENBQWlCOUcsTUFBckMsRUFBNkNELENBQUMsRUFBOUMsRUFBa0Q7SUFDOUMsSUFBSSxLQUFLK0csV0FBTCxDQUFpQi9HLENBQWpCLEVBQW9Cd0YsTUFBcEIsQ0FBMkJuQixFQUEzQixLQUFrQ2dILE1BQXRDLEVBQThDO01BQzFDLE9BQU8sS0FBS3RFLFdBQUwsQ0FBaUIvRyxDQUFqQixFQUFvQndGLE1BQTNCO0lBQ0g7RUFDSjs7RUFDRCxPQUFPLElBQVA7QUFDSCxDQTkzRUwsWUFpNEVJcVUsOEJBajRFSixHQWk0RW9DLDBDQUFXO0VBQ3ZDLElBQUksQ0FBQyxLQUFLOVMsV0FBTixJQUFxQixDQUFDLEtBQUt3TSxpQkFBL0IsRUFBa0Q7RUFFbEQsSUFBSTVLLFNBQVMsR0FBRyxLQUFLNUwsSUFBTCxDQUFVK0MsY0FBVixDQUF5QixlQUF6QixDQUFoQjtFQUNBLElBQUlpTSxrQkFBa0IsR0FBR3BELFNBQVMsR0FBR0EsU0FBUyxDQUFDN0ksY0FBVixDQUF5QixpQkFBekIsQ0FBSCxHQUFpRCxJQUFuRjtFQUNBLElBQUlnTSxlQUFlLEdBQUduRCxTQUFTLEdBQUdBLFNBQVMsQ0FBQzdJLGNBQVYsQ0FBeUIsb0JBQXpCLENBQUgsR0FBb0QsSUFBbkY7O0VBRUEsS0FBSyxJQUFJRSxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUsrRyxXQUFMLENBQWlCOUcsTUFBckMsRUFBNkNELENBQUMsRUFBOUMsRUFBa0Q7SUFDOUMsSUFBSW9HLElBQUksR0FBRyxLQUFLVyxXQUFMLENBQWlCL0csQ0FBakIsQ0FBWDtJQUNBLElBQUl3RixNQUFNLEdBQUdZLElBQUksQ0FBQ1osTUFBbEI7SUFDQSxJQUFJNkYsTUFBTSxHQUFHN0YsTUFBTSxDQUFDbkIsRUFBcEIsQ0FIOEMsQ0FLOUM7O0lBQ0EsSUFBSWtYLFdBQVcsR0FBRyxLQUFLaEksaUJBQUwsQ0FBdUJsSSxNQUF2QixDQUFsQjtJQUNBLElBQUksQ0FBQ2tRLFdBQUwsRUFBa0IsU0FQNEIsQ0FTOUM7O0lBQ0EsSUFBSTlPLGNBQWMsR0FBR1Ysa0JBQWtCLEdBQUdBLGtCQUFrQixDQUFDak0sY0FBbkIsQ0FBa0Msb0JBQW9CdUwsTUFBdEQsQ0FBSCxHQUFtRSxJQUExRztJQUNBLElBQUksQ0FBQ29CLGNBQUwsRUFBcUI7SUFFckIsSUFBSVMsV0FBVyxHQUFHVCxjQUFjLENBQUMzTSxjQUFmLENBQThCLGFBQTlCLENBQWxCO0lBQ0EsSUFBSTBOLFVBQVUsR0FBR2YsY0FBYyxDQUFDM00sY0FBZixDQUE4QixZQUE5QixDQUFqQixDQWQ4QyxDQWdCOUM7O0lBQ0EsSUFBSTZOLFNBQVMsR0FBRzdCLGVBQWUsR0FBR0EsZUFBZSxDQUFDaE0sY0FBaEIsQ0FBK0IsZUFBZXVMLE1BQTlDLENBQUgsR0FBMkQsSUFBMUYsQ0FqQjhDLENBbUI5Qzs7SUFDQSxJQUFJNkIsV0FBSixFQUFpQjtNQUNiLElBQUlDLGVBQWUsR0FBR0QsV0FBVyxDQUFDbFEsWUFBWixDQUF5QnBELEVBQUUsQ0FBQ0ssS0FBNUIsQ0FBdEI7TUFDQSxJQUFJcWYsV0FBVyxHQUFHaUMsV0FBVyxDQUFDdkIsYUFBWixJQUE2QnVCLFdBQVcsQ0FBQ2pDLFdBQXpDLElBQXdEaUMsV0FBVyxDQUFDeEksUUFBdEY7O01BQ0EsSUFBSXVHLFdBQVcsSUFBSWlDLFdBQVcsQ0FBQ2hDLEtBQVosS0FBc0IsQ0FBekMsRUFBNEM7UUFDeENwTSxlQUFlLENBQUN4USxNQUFoQixHQUF5QixTQUFTMmMsV0FBbEM7UUFDQXBNLFdBQVcsQ0FBQ3ZELEtBQVosR0FBb0IvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsQ0FBbkIsQ0FBcEIsQ0FGd0MsQ0FFSTtNQUMvQyxDQUhELE1BR087UUFDSHdELGVBQWUsQ0FBQ3hRLE1BQWhCLEdBQXlCLFFBQXpCO1FBQ0F1USxXQUFXLENBQUN2RCxLQUFaLEdBQW9CL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQXBCLENBRkcsQ0FFMkM7TUFDakQ7SUFDSixDQTlCNkMsQ0FnQzlDOzs7SUFDQSxJQUFJNkQsVUFBSixFQUFnQjtNQUNaLElBQUlDLGNBQWMsR0FBR0QsVUFBVSxDQUFDeFEsWUFBWCxDQUF3QnBELEVBQUUsQ0FBQ0ssS0FBM0IsQ0FBckI7TUFDQSxJQUFJc2YsS0FBSyxHQUFHZ0MsV0FBVyxDQUFDaEMsS0FBWixJQUFxQixDQUFqQztNQUNBLElBQUlFLFlBQVksR0FBRzhCLFdBQVcsQ0FBQ2hHLGFBQVosSUFBNkJnRyxXQUFXLENBQUM5QixZQUF6QyxJQUF5RCxDQUE1RTs7TUFFQSxJQUFJRixLQUFLLEtBQUssQ0FBZCxFQUFpQjtRQUNiO1FBQ0EsSUFBSWlDLElBQUksR0FBR0QsV0FBVyxDQUFDN0osU0FBWixJQUF5QixDQUFwQztRQUNBakUsY0FBYyxDQUFDOVEsTUFBZixHQUF3QixTQUFTNmUsSUFBVCxHQUFnQixHQUF4QztRQUNBaE8sVUFBVSxDQUFDN0QsS0FBWCxHQUFtQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFuQixDQUphLENBSWdDO01BQ2hELENBTEQsTUFLTyxJQUFJNFAsS0FBSyxLQUFLLENBQWQsRUFBaUI7UUFDcEI7UUFDQSxJQUFJdEksSUFBSSxHQUFHMUksSUFBSSxDQUFDeUksS0FBTCxDQUFXLENBQUN1SyxXQUFXLENBQUM3SixTQUFaLElBQXlCLENBQTFCLElBQStCLEVBQTFDLENBQVg7UUFDQSxJQUFJOEosSUFBSSxHQUFHLENBQUNELFdBQVcsQ0FBQzdKLFNBQVosSUFBeUIsQ0FBMUIsSUFBK0IsRUFBMUM7UUFDQSxJQUFJK0osWUFBWSxHQUFHLENBQUN4SyxJQUFJLEdBQUcsRUFBUCxHQUFZLEdBQVosR0FBa0IsRUFBbkIsSUFBeUJBLElBQXpCLEdBQWdDLEdBQWhDLElBQXVDdUssSUFBSSxHQUFHLEVBQVAsR0FBWSxHQUFaLEdBQWtCLEVBQXpELElBQStEQSxJQUFsRjtRQUNBL04sY0FBYyxDQUFDOVEsTUFBZixHQUF3QixTQUFTOGUsWUFBVCxHQUF3QixJQUF4QixHQUErQmhDLFlBQS9CLEdBQThDLElBQXRFO1FBQ0FqTSxVQUFVLENBQUM3RCxLQUFYLEdBQW1CL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLENBQVQsRUFBWSxHQUFaLEVBQWlCLEdBQWpCLENBQW5CLENBTm9CLENBTXVCO01BQzlDLENBUE0sTUFPQTtRQUNIO1FBQ0E4RCxjQUFjLENBQUM5USxNQUFmLEdBQXdCLE1BQXhCO1FBQ0E2USxVQUFVLENBQUM3RCxLQUFYLEdBQW1CL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQW5CLENBSEcsQ0FHMEM7TUFDaEQ7SUFDSixDQXZENkMsQ0F5RDlDOzs7SUFDQSxJQUFJZ0UsU0FBSixFQUFlO01BQ1gsSUFBSXpELE1BQU0sR0FBR3lELFNBQVMsQ0FBQzNRLFlBQVYsQ0FBdUJwRCxFQUFFLENBQUNPLE1BQTFCLENBQWI7TUFDQSxJQUFJcU0sTUFBTSxHQUFHbUgsU0FBUyxDQUFDM1EsWUFBVixDQUF1QnBELEVBQUUsQ0FBQzZNLE1BQTFCLENBQWIsQ0FGVyxDQUlYOztNQUNBeUQsTUFBTSxDQUFDNkQsUUFBUCxHQUFrQm5VLEVBQUUsQ0FBQ08sTUFBSCxDQUFVNlQsUUFBVixDQUFtQkMsTUFBckM7TUFDQSxJQUFJQyxVQUFVLEdBQUcsR0FBakI7TUFDQSxJQUFJQyxXQUFXLEdBQUcsRUFBbEI7TUFDQVIsU0FBUyxDQUFDL0UsY0FBVixDQUF5QmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUXdCLFVBQVIsRUFBb0JDLFdBQXBCLENBQXpCO01BRUEsSUFBSW9MLEtBQUssR0FBR2dDLFdBQVcsQ0FBQ2hDLEtBQVosSUFBcUIsQ0FBakM7O01BRUEsSUFBSUEsS0FBSyxLQUFLLENBQVYsSUFBZSxDQUFDZ0MsV0FBVyxDQUFDL0IsU0FBaEMsRUFBMkM7UUFDdkM7UUFDQSxJQUFJLEtBQUs5SyxnQkFBTCxJQUF5QixLQUFLQSxnQkFBTCxDQUFzQixnQkFBdEIsQ0FBN0IsRUFBc0U7VUFDbEV4RSxNQUFNLENBQUN4SCxXQUFQLEdBQXFCLEtBQUtnTSxnQkFBTCxDQUFzQixnQkFBdEIsQ0FBckI7UUFDSDs7UUFDRGYsU0FBUyxDQUFDdE4sTUFBVixHQUFtQixJQUFuQjtRQUNBLElBQUltRyxNQUFKLEVBQVlBLE1BQU0sQ0FBQzFFLE9BQVAsR0FBaUIsS0FBakI7TUFDZixDQVBELE1BT087UUFDSDtRQUNBLElBQUl3SixVQUFVLEdBQUczUSxNQUFNLENBQUMrTSxTQUFQLElBQW9CL00sTUFBTSxDQUFDK00sU0FBUCxDQUFpQjRELFVBQWpCLENBQTRCRCxNQUE1QixDQUFyQzs7UUFFQSxJQUFJQyxVQUFKLEVBQWdCO1VBQ1o7VUFDQSxJQUFJLEtBQUtvRCxnQkFBTCxJQUF5QixLQUFLQSxnQkFBTCxDQUFzQixtQkFBdEIsQ0FBN0IsRUFBeUU7WUFDckV4RSxNQUFNLENBQUN4SCxXQUFQLEdBQXFCLEtBQUtnTSxnQkFBTCxDQUFzQixtQkFBdEIsQ0FBckI7VUFDSDs7VUFDRGYsU0FBUyxDQUFDdE4sTUFBVixHQUFtQixJQUFuQjtVQUNBLElBQUltRyxNQUFKLEVBQVlBLE1BQU0sQ0FBQzFFLE9BQVAsR0FBaUIsSUFBakI7UUFDZixDQVBELE1BT087VUFDSDtVQUNBLElBQUksS0FBSzRNLGdCQUFMLElBQXlCLEtBQUtBLGdCQUFMLENBQXNCLGFBQXRCLENBQTdCLEVBQW1FO1lBQy9EeEUsTUFBTSxDQUFDeEgsV0FBUCxHQUFxQixLQUFLZ00sZ0JBQUwsQ0FBc0IsYUFBdEIsQ0FBckI7VUFDSDs7VUFDRGYsU0FBUyxDQUFDdE4sTUFBVixHQUFtQixJQUFuQjtVQUNBLElBQUltRyxNQUFKLEVBQVlBLE1BQU0sQ0FBQzFFLE9BQVAsR0FBaUIsSUFBakI7UUFDZjtNQUNKO0lBQ0o7RUFDSjtBQUNKLENBMytFTCxZQSsrRUk0WiwwQkEvK0VKLEdBKytFZ0Msb0NBQVNqSSxNQUFULEVBQWlCO0VBQ3pDO0VBQ0EsS0FBS0Msa0JBQUwsQ0FBd0JELE1BQXhCO0FBQ0gsQ0FsL0VMLFlBcy9FSWtJLHVCQXQvRUosR0FzL0U2QixtQ0FBVztFQUNoQztFQUNBLEtBQUs5Qiw4QkFBTDtBQUNILENBei9FTCxZQTQvRUloUyx3QkE1L0VKLEdBNC9FOEIsb0NBQVc7RUFDakM7RUFDQSxLQUFLOFQsdUJBQUw7QUFDSCxDQS8vRUwsWUFvZ0ZJQyxvQkFwZ0ZKLEdBb2dGMEIsOEJBQVN2VixVQUFULEVBQXFCMEUsVUFBckIsRUFBaUM7RUFDbkQsSUFBSXRQLElBQUksR0FBRyxJQUFYLENBRG1ELENBSW5EOztFQUNBLElBQUk2RSxNQUFNLEdBQUcsS0FBS3ZELElBQUwsQ0FBVUMsWUFBVixDQUF1QnBELEVBQUUsQ0FBQzJHLE1BQTFCLEtBQXFDM0csRUFBRSxDQUFDNEcsSUFBSCxDQUFRLFFBQVIsRUFBa0J4RCxZQUFsQixDQUErQnBELEVBQUUsQ0FBQzJHLE1BQWxDLENBQWxEO0VBQ0EsSUFBSUUsWUFBWSxHQUFHSCxNQUFNLEdBQUdBLE1BQU0sQ0FBQ0ksZ0JBQVAsQ0FBd0JDLE1BQTNCLEdBQW9DLEdBQTdEO0VBQ0EsSUFBSUMsV0FBVyxHQUFHTixNQUFNLEdBQUdBLE1BQU0sQ0FBQ0ksZ0JBQVAsQ0FBd0JHLEtBQTNCLEdBQW1DLElBQTNELENBUG1ELENBU25EOztFQUNBLElBQUlnYixXQUFXLEdBQUcsSUFBSWppQixFQUFFLENBQUNxTixJQUFQLENBQVkscUJBQVosQ0FBbEI7RUFDQTRVLFdBQVcsQ0FBQ2pULGNBQVosQ0FBMkJoUCxFQUFFLENBQUM4UyxJQUFILENBQVE5TCxXQUFSLEVBQXFCSCxZQUFyQixDQUEzQjtFQUNBb2IsV0FBVyxDQUFDN1osT0FBWixHQUFzQixHQUF0QjtFQUNBNlosV0FBVyxDQUFDNVosT0FBWixHQUFzQixHQUF0QjtFQUNBNFosV0FBVyxDQUFDelosQ0FBWixHQUFnQixDQUFoQjtFQUNBeVosV0FBVyxDQUFDdmEsQ0FBWixHQUFnQixDQUFoQjtFQUNBdWEsV0FBVyxDQUFDeFIsTUFBWixHQUFxQixJQUFyQjtFQUNBd1IsV0FBVyxDQUFDaFQsTUFBWixHQUFxQixLQUFLOUwsSUFBMUIsQ0FqQm1ELENBbUJuRDs7RUFDQSxJQUFJNlAsTUFBTSxHQUFHLElBQUloVCxFQUFFLENBQUNxTixJQUFQLENBQVksSUFBWixDQUFiO0VBQ0EyRixNQUFNLENBQUNoRSxjQUFQLENBQXNCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFROUwsV0FBUixFQUFxQkgsWUFBckIsQ0FBdEI7RUFDQSxJQUFJb00sVUFBVSxHQUFHRCxNQUFNLENBQUN2RCxZQUFQLENBQW9CelAsRUFBRSxDQUFDa1QsUUFBdkIsQ0FBakI7RUFDQUQsVUFBVSxDQUFDRSxTQUFYLEdBQXVCblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCLEVBQXFCLEdBQXJCLENBQXZCO0VBQ0FrRCxVQUFVLENBQUNnSSxJQUFYLENBQWdCLENBQUNqVSxXQUFELEdBQWEsQ0FBN0IsRUFBZ0MsQ0FBQ0gsWUFBRCxHQUFjLENBQTlDLEVBQWlERyxXQUFqRCxFQUE4REgsWUFBOUQ7RUFDQW9NLFVBQVUsQ0FBQ0ksSUFBWDtFQUNBTCxNQUFNLENBQUMvRCxNQUFQLEdBQWdCZ1QsV0FBaEIsQ0ExQm1ELENBNEJuRDs7RUFDQSxLQUFLQyxzQkFBTCxDQUE0QkQsV0FBNUIsRUFBeUNqYixXQUF6QyxFQUFzREgsWUFBdEQsRUE3Qm1ELENBK0JuRDs7O0VBQ0EsSUFBSXlJLFNBQVMsR0FBRyxJQUFJdFAsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLE9BQVosQ0FBaEI7RUFDQWlDLFNBQVMsQ0FBQzVILENBQVYsR0FBYyxHQUFkO0VBQ0EsSUFBSWtNLFVBQVUsR0FBR3RFLFNBQVMsQ0FBQ0csWUFBVixDQUF1QnpQLEVBQUUsQ0FBQ0ssS0FBMUIsQ0FBakI7RUFDQXVULFVBQVUsQ0FBQzdRLE1BQVgsR0FBb0IsS0FBcEI7RUFDQTZRLFVBQVUsQ0FBQ2xFLFFBQVgsR0FBc0IsRUFBdEI7RUFDQWtFLFVBQVUsQ0FBQ2pFLFVBQVgsR0FBd0IsRUFBeEI7RUFDQWlFLFVBQVUsQ0FBQ2hFLGVBQVgsR0FBNkI1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQXREO0VBQ0FSLFNBQVMsQ0FBQ1MsS0FBVixHQUFrQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixDQUFuQixDQUFsQixDQXZDbUQsQ0F5Q25EOztFQUNBLElBQUkrRCxZQUFZLEdBQUd4RSxTQUFTLENBQUNHLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUNpUSxZQUExQixDQUFuQjtFQUNBNkQsWUFBWSxDQUFDL0QsS0FBYixHQUFxQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsRUFBZCxFQUFrQixFQUFsQixDQUFyQjtFQUNBK0QsWUFBWSxDQUFDN00sS0FBYixHQUFxQixDQUFyQjtFQUNBcUksU0FBUyxDQUFDTCxNQUFWLEdBQW1CZ1QsV0FBbkIsQ0E3Q21ELENBK0NuRDs7RUFDQSxJQUFJRSxZQUFZLEdBQUcsSUFBSW5pQixFQUFFLENBQUNxTixJQUFQLENBQVksVUFBWixDQUFuQjtFQUNBOFUsWUFBWSxDQUFDemEsQ0FBYixHQUFpQixFQUFqQjtFQUNBLElBQUkwYSxhQUFhLEdBQUdELFlBQVksQ0FBQzFTLFlBQWIsQ0FBMEJ6UCxFQUFFLENBQUNLLEtBQTdCLENBQXBCO0VBQ0EraEIsYUFBYSxDQUFDcmYsTUFBZCxHQUF1QixRQUFRMEosVUFBVSxDQUFDL0IsU0FBbkIsR0FBK0IsR0FBdEQ7RUFDQTBYLGFBQWEsQ0FBQzFTLFFBQWQsR0FBeUIsRUFBekI7RUFDQTBTLGFBQWEsQ0FBQ3hTLGVBQWQsR0FBZ0M1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQXpEO0VBQ0FxUyxZQUFZLENBQUNwUyxLQUFiLEdBQXFCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQXJCO0VBQ0FvUyxZQUFZLENBQUNsVCxNQUFiLEdBQXNCZ1QsV0FBdEIsQ0F2RG1ELENBeURuRDs7RUFDQSxJQUFJSSxPQUFPLEdBQUcsSUFBSXJpQixFQUFFLENBQUNxTixJQUFQLENBQVksS0FBWixDQUFkO0VBQ0FnVixPQUFPLENBQUMzYSxDQUFSLEdBQVksQ0FBQyxHQUFiO0VBQ0EsSUFBSTRhLFFBQVEsR0FBR0QsT0FBTyxDQUFDNVMsWUFBUixDQUFxQnpQLEVBQUUsQ0FBQ0ssS0FBeEIsQ0FBZjtFQUNBaWlCLFFBQVEsQ0FBQ3ZmLE1BQVQsR0FBa0IsV0FBbEI7RUFDQXVmLFFBQVEsQ0FBQzVTLFFBQVQsR0FBb0IsRUFBcEI7RUFDQTRTLFFBQVEsQ0FBQzFTLGVBQVQsR0FBMkI1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQXBEO0VBQ0F1UyxPQUFPLENBQUN0UyxLQUFSLEdBQWdCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWhCO0VBQ0FzUyxPQUFPLENBQUNwVCxNQUFSLEdBQWlCZ1QsV0FBakIsQ0FqRW1ELENBbUVuRDs7RUFDQSxJQUFJTSxVQUFVLEdBQUcsSUFBSXZpQixFQUFFLENBQUNxTixJQUFQLENBQVksWUFBWixDQUFqQjtFQUNBa1YsVUFBVSxDQUFDdlQsY0FBWCxDQUEwQmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUSxHQUFSLEVBQWEsRUFBYixDQUExQjtFQUNBeVAsVUFBVSxDQUFDN2EsQ0FBWCxHQUFlLENBQUMsR0FBaEI7RUFDQSxJQUFJOGEsa0JBQWtCLEdBQUdELFVBQVUsQ0FBQzlTLFlBQVgsQ0FBd0J6UCxFQUFFLENBQUNrVCxRQUEzQixDQUF6QjtFQUNBc1Asa0JBQWtCLENBQUNyUCxTQUFuQixHQUErQm5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixHQUFyQixDQUEvQjtFQUNBeVMsa0JBQWtCLENBQUNwUCxTQUFuQixDQUE2QixDQUFDLEdBQTlCLEVBQW1DLENBQUMsRUFBcEMsRUFBd0MsR0FBeEMsRUFBNkMsRUFBN0MsRUFBaUQsRUFBakQ7RUFDQW9QLGtCQUFrQixDQUFDblAsSUFBbkI7RUFDQW1QLGtCQUFrQixDQUFDckgsV0FBbkIsR0FBaUNuYixFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsR0FBakIsQ0FBakM7RUFDQXlTLGtCQUFrQixDQUFDcEgsU0FBbkIsR0FBK0IsQ0FBL0I7RUFDQW9ILGtCQUFrQixDQUFDcFAsU0FBbkIsQ0FBNkIsQ0FBQyxHQUE5QixFQUFtQyxDQUFDLEVBQXBDLEVBQXdDLEdBQXhDLEVBQTZDLEVBQTdDLEVBQWlELEVBQWpEO0VBQ0FvUCxrQkFBa0IsQ0FBQ25ILE1BQW5CO0VBQ0FrSCxVQUFVLENBQUN0VCxNQUFYLEdBQW9CZ1QsV0FBcEIsQ0EvRW1ELENBaUZuRDs7RUFDQSxJQUFJUSxZQUFZLEdBQUcsSUFBSXppQixFQUFFLENBQUNxTixJQUFQLENBQVksY0FBWixDQUFuQjtFQUNBb1YsWUFBWSxDQUFDL2EsQ0FBYixHQUFpQixDQUFDLEdBQWxCO0VBQ0EsSUFBSWdiLG9CQUFvQixHQUFHRCxZQUFZLENBQUNoVCxZQUFiLENBQTBCelAsRUFBRSxDQUFDa1QsUUFBN0IsQ0FBM0I7RUFDQXVQLFlBQVksQ0FBQ3hULE1BQWIsR0FBc0JnVCxXQUF0QixDQXJGbUQsQ0F1Rm5EOztFQUNBLElBQUlVLFdBQVcsR0FBRyxJQUFJM2lCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxTQUFaLENBQWxCO0VBQ0FzVixXQUFXLENBQUNqYixDQUFaLEdBQWdCLENBQUMsR0FBakI7RUFDQSxJQUFJa2IsWUFBWSxHQUFHRCxXQUFXLENBQUNsVCxZQUFaLENBQXlCelAsRUFBRSxDQUFDSyxLQUE1QixDQUFuQjtFQUNBdWlCLFlBQVksQ0FBQzdmLE1BQWIsR0FBc0IsSUFBdEI7RUFDQTZmLFlBQVksQ0FBQ2xULFFBQWIsR0FBd0IsRUFBeEI7RUFDQWtULFlBQVksQ0FBQ2hULGVBQWIsR0FBK0I1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQXhEO0VBQ0E2UyxXQUFXLENBQUM1UyxLQUFaLEdBQW9CL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQXBCO0VBQ0E0UyxXQUFXLENBQUMxVCxNQUFaLEdBQXFCZ1QsV0FBckIsQ0EvRm1ELENBaUduRDs7RUFDQSxJQUFJWSxhQUFhLEdBQUcsSUFBSTdpQixFQUFFLENBQUNxTixJQUFQLENBQVksV0FBWixDQUFwQjtFQUNBd1YsYUFBYSxDQUFDbmIsQ0FBZCxHQUFrQixDQUFDLEdBQW5CO0VBQ0EsSUFBSW9iLGNBQWMsR0FBR0QsYUFBYSxDQUFDcFQsWUFBZCxDQUEyQnpQLEVBQUUsQ0FBQ0ssS0FBOUIsQ0FBckI7RUFDQXlpQixjQUFjLENBQUMvZixNQUFmLEdBQXdCLFlBQXhCO0VBQ0ErZixjQUFjLENBQUNwVCxRQUFmLEdBQTBCLEVBQTFCO0VBQ0FvVCxjQUFjLENBQUNsVCxlQUFmLEdBQWlDNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUExRDtFQUNBK1MsYUFBYSxDQUFDOVMsS0FBZCxHQUFzQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUF0QjtFQUNBOFMsYUFBYSxDQUFDNVQsTUFBZCxHQUF1QmdULFdBQXZCLENBekdtRCxDQTJHbkQ7O0VBQ0EsSUFBSWMsV0FBVyxHQUFHLENBQ2QsV0FEYyxFQUVkLFlBRmMsRUFHZCxhQUhjLEVBSWQsYUFKYyxFQUtkLFdBTGMsQ0FBbEIsQ0E1R21ELENBb0huRDs7RUFDQSxJQUFJQyxRQUFRLEdBQUcsQ0FBZjtFQUNBLElBQUlDLGNBQWMsR0FBRyxHQUFyQjtFQUNBLElBQUlDLFFBQVEsR0FBRyxDQUFmOztFQUVBLElBQUlDLGNBQWMsR0FBRyxTQUFqQkEsY0FBaUIsR0FBVztJQUM1QixJQUFJSCxRQUFRLElBQUlDLGNBQWhCLEVBQWdDO01BQzVCO01BQ0FwaEIsSUFBSSxDQUFDb0QsWUFBTCxDQUFrQixZQUFXO1FBQ3pCLElBQUlnZCxXQUFXLElBQUlBLFdBQVcsQ0FBQ3hnQixPQUEvQixFQUF3QztVQUNwQ3dnQixXQUFXLENBQUM1VCxPQUFaO1FBQ0g7O1FBQ0R4TSxJQUFJLENBQUN1aEIsa0JBQUwsQ0FBd0IzVyxVQUF4QixFQUFvQzBFLFVBQXBDO01BQ0gsQ0FMRCxFQUtHLEdBTEg7TUFNQTtJQUNILENBVjJCLENBWTVCOzs7SUFDQTZSLFFBQVEsSUFBSSxDQUFaO0lBQ0EsSUFBSUEsUUFBUSxHQUFHQyxjQUFmLEVBQStCRCxRQUFRLEdBQUdDLGNBQVgsQ0FkSCxDQWdCNUI7O0lBQ0EsSUFBSUksU0FBUyxHQUFJTCxRQUFRLEdBQUcsR0FBWixHQUFtQixHQUFuQztJQUNBTixvQkFBb0IsQ0FBQ1ksS0FBckI7O0lBQ0EsSUFBSUQsU0FBUyxHQUFHLENBQWhCLEVBQW1CO01BQ2Y7TUFDQVgsb0JBQW9CLENBQUN2UCxTQUFyQixHQUFpQ25ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsR0FBYixFQUFrQixFQUFsQixDQUFqQztNQUNBMlMsb0JBQW9CLENBQUN0UCxTQUFyQixDQUErQixDQUFDLEdBQWhDLEVBQXFDLENBQUMsRUFBdEMsRUFBMENpUSxTQUExQyxFQUFxRCxFQUFyRCxFQUF5RCxFQUF6RDtNQUNBWCxvQkFBb0IsQ0FBQ3JQLElBQXJCO0lBQ0gsQ0F4QjJCLENBMEI1Qjs7O0lBQ0F1UCxZQUFZLENBQUM3ZixNQUFiLEdBQXNCaWdCLFFBQVEsR0FBRyxHQUFqQyxDQTNCNEIsQ0E2QjVCOztJQUNBLElBQUlPLFdBQVcsR0FBRzVVLElBQUksQ0FBQ3lJLEtBQUwsQ0FBVzRMLFFBQVEsR0FBRyxFQUF0QixDQUFsQjs7SUFDQSxJQUFJTyxXQUFXLEdBQUdSLFdBQVcsQ0FBQzFjLE1BQTFCLElBQW9Da2QsV0FBVyxLQUFLTCxRQUF4RCxFQUFrRTtNQUM5REEsUUFBUSxHQUFHSyxXQUFYO01BQ0FqQixRQUFRLENBQUN2ZixNQUFULEdBQWtCZ2dCLFdBQVcsQ0FBQ0csUUFBRCxDQUE3QjtNQUNBSixjQUFjLENBQUMvZixNQUFmLEdBQXdCZ2dCLFdBQVcsQ0FBQ0csUUFBRCxDQUFuQztJQUNIOztJQUVEcmhCLElBQUksQ0FBQ29ELFlBQUwsQ0FBa0JrZSxjQUFsQixFQUFrQyxJQUFsQztFQUNILENBdENELENBekhtRCxDQWlLbkQ7OztFQUNBQSxjQUFjO0FBQ2pCLENBdnFGTCxZQTBxRklqQixzQkExcUZKLEdBMHFGNEIsZ0NBQVNuYyxVQUFULEVBQXFCaUIsV0FBckIsRUFBa0NILFlBQWxDLEVBQWdEO0VBQ3BFO0VBQ0EsSUFBSTJjLFdBQVcsR0FBRyxDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxFQUFnQixHQUFoQixDQUFsQjtFQUNBLElBQUlDLFVBQVUsR0FBRyxDQUNiempCLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixHQUFyQixDQURhLEVBRWIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEVBQWQsRUFBa0IsRUFBbEIsRUFBc0IsR0FBdEIsQ0FGYSxFQUdiL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCLEVBQXFCLEdBQXJCLENBSGEsRUFJYi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsRUFBZCxFQUFrQixFQUFsQixFQUFzQixHQUF0QixDQUphLENBQWpCO0VBT0EsSUFBSTJULFNBQVMsR0FBRyxDQUNaMWpCLEVBQUUsQ0FBQzJqQixFQUFILENBQU0sQ0FBQzNjLFdBQUQsR0FBYSxDQUFiLEdBQWlCLEVBQXZCLEVBQTJCSCxZQUFZLEdBQUMsQ0FBYixHQUFpQixFQUE1QyxDQURZLEVBRVo3RyxFQUFFLENBQUMyakIsRUFBSCxDQUFNM2MsV0FBVyxHQUFDLENBQVosR0FBZ0IsRUFBdEIsRUFBMEJILFlBQVksR0FBQyxDQUFiLEdBQWlCLEVBQTNDLENBRlksRUFHWjdHLEVBQUUsQ0FBQzJqQixFQUFILENBQU0sQ0FBQzNjLFdBQUQsR0FBYSxDQUFiLEdBQWlCLEVBQXZCLEVBQTJCLENBQUNILFlBQUQsR0FBYyxDQUFkLEdBQWtCLEVBQTdDLENBSFksRUFJWjdHLEVBQUUsQ0FBQzJqQixFQUFILENBQU0zYyxXQUFXLEdBQUMsQ0FBWixHQUFnQixFQUF0QixFQUEwQixDQUFDSCxZQUFELEdBQWMsQ0FBZCxHQUFrQixFQUE1QyxDQUpZLENBQWhCOztFQU9BLEtBQUssSUFBSVQsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxDQUFwQixFQUF1QkEsQ0FBQyxFQUF4QixFQUE0QjtJQUN4QixJQUFJd2QsVUFBVSxHQUFHLElBQUk1akIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLGVBQWVqSCxDQUEzQixDQUFqQjtJQUNBd2QsVUFBVSxDQUFDclUsV0FBWCxDQUF1Qm1VLFNBQVMsQ0FBQ3RkLENBQUQsQ0FBaEM7SUFDQSxJQUFJeWQsV0FBVyxHQUFHRCxVQUFVLENBQUNuVSxZQUFYLENBQXdCelAsRUFBRSxDQUFDSyxLQUEzQixDQUFsQjtJQUNBd2pCLFdBQVcsQ0FBQzlnQixNQUFaLEdBQXFCeWdCLFdBQVcsQ0FBQ3BkLENBQUQsQ0FBaEM7SUFDQXlkLFdBQVcsQ0FBQ25VLFFBQVosR0FBdUIsRUFBdkI7SUFDQWtVLFVBQVUsQ0FBQzdULEtBQVgsR0FBbUIwVCxVQUFVLENBQUNyZCxDQUFELENBQTdCO0lBQ0F3ZCxVQUFVLENBQUMzVSxNQUFYLEdBQW9CbEosVUFBcEI7RUFDSDtBQUNKLENBcHNGTCxZQXlzRklxZCxrQkF6c0ZKLEdBeXNGd0IsNEJBQVMzVyxVQUFULEVBQXFCMEUsVUFBckIsRUFBaUM7RUFDakQsSUFBSXRQLElBQUksR0FBRyxJQUFYO0VBQ0EsSUFBSWIsUUFBUSxHQUFHRCxNQUFNLENBQUNDLFFBQXRCLENBRmlELENBS2pEOztFQUNBLElBQUk4aUIsUUFBUSxHQUFHLEtBQUszZ0IsSUFBTCxDQUFVK0MsY0FBVixDQUF5QixlQUF6QixDQUFmO0VBQ0EsSUFBSTRkLFFBQUosRUFBY0EsUUFBUSxDQUFDelYsT0FBVCxHQVBtQyxDQVNqRDs7RUFDQSxJQUFJM0gsTUFBTSxHQUFHLEtBQUt2RCxJQUFMLENBQVVDLFlBQVYsQ0FBdUJwRCxFQUFFLENBQUMyRyxNQUExQixLQUFxQzNHLEVBQUUsQ0FBQzRHLElBQUgsQ0FBUSxRQUFSLEVBQWtCeEQsWUFBbEIsQ0FBK0JwRCxFQUFFLENBQUMyRyxNQUFsQyxDQUFsRDtFQUNBLElBQUlFLFlBQVksR0FBR0gsTUFBTSxHQUFHQSxNQUFNLENBQUNJLGdCQUFQLENBQXdCQyxNQUEzQixHQUFvQyxHQUE3RDtFQUNBLElBQUlDLFdBQVcsR0FBR04sTUFBTSxHQUFHQSxNQUFNLENBQUNJLGdCQUFQLENBQXdCRyxLQUEzQixHQUFtQyxJQUEzRCxDQVppRCxDQWNqRDs7RUFDQSxJQUFJOGMsU0FBUyxHQUFHLElBQUkvakIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLGVBQVosQ0FBaEI7RUFDQTBXLFNBQVMsQ0FBQy9VLGNBQVYsQ0FBeUJoUCxFQUFFLENBQUM4UyxJQUFILENBQVE5TCxXQUFSLEVBQXFCSCxZQUFyQixDQUF6QjtFQUNBa2QsU0FBUyxDQUFDM2IsT0FBVixHQUFvQixHQUFwQjtFQUNBMmIsU0FBUyxDQUFDMWIsT0FBVixHQUFvQixHQUFwQjtFQUNBMGIsU0FBUyxDQUFDdmIsQ0FBVixHQUFjLENBQWQ7RUFDQXViLFNBQVMsQ0FBQ3JjLENBQVYsR0FBYyxDQUFkO0VBQ0FxYyxTQUFTLENBQUN0VCxNQUFWLEdBQW1CLElBQW5CO0VBQ0FzVCxTQUFTLENBQUM5VSxNQUFWLEdBQW1CLEtBQUs5TCxJQUF4QixDQXRCaUQsQ0F3QmpEOztFQUNBLEtBQUs2Z0IseUJBQUwsQ0FBK0JELFNBQS9CLEVBQTBDL2MsV0FBMUMsRUFBdURILFlBQXZELEVBekJpRCxDQTJCakQ7OztFQUNBLEtBQUtvZCxxQkFBTCxDQUEyQkYsU0FBM0IsRUFBc0MvYyxXQUF0QyxFQUFtREgsWUFBbkQsRUFBaUU0RixVQUFqRSxFQTVCaUQsQ0E4QmpEOzs7RUFDQSxLQUFLeVgsc0JBQUwsQ0FBNEJILFNBQTVCLEVBQXVDL2MsV0FBdkMsRUFBb0RILFlBQXBELEVBQWtFNEYsVUFBbEUsRUFBOEUwRSxVQUE5RSxFQS9CaUQsQ0FpQ2pEOzs7RUFDQSxLQUFLZ1Qsc0JBQUwsQ0FBNEJKLFNBQTVCLEVBQXVDL2MsV0FBdkMsRUFBb0RILFlBQXBELEVBQWtFNEYsVUFBbEUsRUFBOEUwRSxVQUE5RSxFQWxDaUQsQ0FvQ2pEOzs7RUFDQSxLQUFLaVQscUJBQUwsQ0FBMkJMLFNBQTNCLEVBQXNDL2MsV0FBdEMsRUFBbURILFlBQW5ELEVBQWlFc0ssVUFBakUsRUFBNkUxRSxVQUE3RTtBQUNILENBL3VGTCxZQWt2Rkl1WCx5QkFsdkZKLEdBa3ZGK0IsbUNBQVNqZSxVQUFULEVBQXFCaUIsV0FBckIsRUFBa0NILFlBQWxDLEVBQWdEO0VBQ3ZFO0VBQ0EsSUFBSW1NLE1BQU0sR0FBRyxJQUFJaFQsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFNBQVosQ0FBYjtFQUNBMkYsTUFBTSxDQUFDaEUsY0FBUCxDQUFzQmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUTlMLFdBQVIsRUFBcUJILFlBQXJCLENBQXRCO0VBRUEsSUFBSW9NLFVBQVUsR0FBR0QsTUFBTSxDQUFDdkQsWUFBUCxDQUFvQnpQLEVBQUUsQ0FBQ2tULFFBQXZCLENBQWpCO0VBQ0FELFVBQVUsQ0FBQ0UsU0FBWCxHQUF1Qm5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixHQUFyQixDQUF2QjtFQUNBa0QsVUFBVSxDQUFDZ0ksSUFBWCxDQUFnQixDQUFDalUsV0FBRCxHQUFhLENBQTdCLEVBQWdDLENBQUNILFlBQUQsR0FBYyxDQUE5QyxFQUFpREcsV0FBakQsRUFBOERILFlBQTlEO0VBQ0FvTSxVQUFVLENBQUNJLElBQVg7RUFDQUwsTUFBTSxDQUFDL0QsTUFBUCxHQUFnQmxKLFVBQWhCLENBVHVFLENBV3ZFOztFQUNBLElBQUlzZSxVQUFVLEdBQUcsSUFBSXJrQixFQUFFLENBQUNxTixJQUFQLENBQVksUUFBWixDQUFqQjtFQUNBLElBQUlpWCxjQUFjLEdBQUdELFVBQVUsQ0FBQzVVLFlBQVgsQ0FBd0J6UCxFQUFFLENBQUNrVCxRQUEzQixDQUFyQjtFQUNBb1IsY0FBYyxDQUFDbkosV0FBZixHQUE2Qm5iLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixFQUFuQixFQUF1QixHQUF2QixDQUE3QjtFQUNBdVUsY0FBYyxDQUFDbEosU0FBZixHQUEyQixDQUEzQjtFQUNBa0osY0FBYyxDQUFDbFIsU0FBZixDQUF5QixDQUFDcE0sV0FBRCxHQUFhLENBQWIsR0FBaUIsQ0FBMUMsRUFBNkMsQ0FBQ0gsWUFBRCxHQUFjLENBQWQsR0FBa0IsQ0FBL0QsRUFBa0VHLFdBQVcsR0FBRyxFQUFoRixFQUFvRkgsWUFBWSxHQUFHLEVBQW5HLEVBQXVHLEVBQXZHO0VBQ0F5ZCxjQUFjLENBQUNqSixNQUFmO0VBQ0FnSixVQUFVLENBQUNwVixNQUFYLEdBQW9CbEosVUFBcEIsQ0FsQnVFLENBb0J2RTs7RUFDQSxJQUFJd2UsT0FBTyxHQUFHLENBQ1Y7SUFBRS9iLENBQUMsRUFBRSxDQUFDeEIsV0FBRCxHQUFhLENBQWIsR0FBaUIsRUFBdEI7SUFBMEJVLENBQUMsRUFBRWIsWUFBWSxHQUFDLENBQWIsR0FBaUIsRUFBOUM7SUFBa0QyZCxHQUFHLEVBQUU7RUFBdkQsQ0FEVSxFQUVWO0lBQUVoYyxDQUFDLEVBQUV4QixXQUFXLEdBQUMsQ0FBWixHQUFnQixFQUFyQjtJQUF5QlUsQ0FBQyxFQUFFYixZQUFZLEdBQUMsQ0FBYixHQUFpQixFQUE3QztJQUFpRDJkLEdBQUcsRUFBRTtFQUF0RCxDQUZVLEVBR1Y7SUFBRWhjLENBQUMsRUFBRXhCLFdBQVcsR0FBQyxDQUFaLEdBQWdCLEVBQXJCO0lBQXlCVSxDQUFDLEVBQUUsQ0FBQ2IsWUFBRCxHQUFjLENBQWQsR0FBa0IsRUFBOUM7SUFBa0QyZCxHQUFHLEVBQUU7RUFBdkQsQ0FIVSxFQUlWO0lBQUVoYyxDQUFDLEVBQUUsQ0FBQ3hCLFdBQUQsR0FBYSxDQUFiLEdBQWlCLEVBQXRCO0lBQTBCVSxDQUFDLEVBQUUsQ0FBQ2IsWUFBRCxHQUFjLENBQWQsR0FBa0IsRUFBL0M7SUFBbUQyZCxHQUFHLEVBQUU7RUFBeEQsQ0FKVSxDQUFkOztFQU9BLEtBQUssSUFBSXBlLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdtZSxPQUFPLENBQUNsZSxNQUE1QixFQUFvQ0QsQ0FBQyxFQUFyQyxFQUF5QztJQUNyQyxJQUFJcWUsTUFBTSxHQUFHRixPQUFPLENBQUNuZSxDQUFELENBQXBCO0lBQ0EsSUFBSXNlLFVBQVUsR0FBRyxJQUFJMWtCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxXQUFXakgsQ0FBdkIsQ0FBakI7SUFDQXNlLFVBQVUsQ0FBQ25WLFdBQVgsQ0FBdUJrVixNQUFNLENBQUNqYyxDQUE5QixFQUFpQ2ljLE1BQU0sQ0FBQy9jLENBQXhDO0lBQ0FnZCxVQUFVLENBQUNoakIsS0FBWCxHQUFtQixDQUFDK2lCLE1BQU0sQ0FBQ0QsR0FBM0I7SUFFQSxJQUFJRyxFQUFFLEdBQUdELFVBQVUsQ0FBQ2pWLFlBQVgsQ0FBd0J6UCxFQUFFLENBQUNrVCxRQUEzQixDQUFUO0lBQ0F5UixFQUFFLENBQUN4SixXQUFILEdBQWlCbmIsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEVBQW5CLEVBQXVCLEdBQXZCLENBQWpCO0lBQ0E0VSxFQUFFLENBQUN2SixTQUFILEdBQWUsQ0FBZjtJQUNBdUosRUFBRSxDQUFDQyxNQUFILENBQVUsQ0FBVixFQUFhLENBQWI7SUFDQUQsRUFBRSxDQUFDRSxNQUFILENBQVUsRUFBVixFQUFjLENBQWQ7SUFDQUYsRUFBRSxDQUFDRSxNQUFILENBQVUsRUFBVixFQUFjLEVBQWQ7SUFDQUYsRUFBRSxDQUFDQyxNQUFILENBQVUsQ0FBVixFQUFhLENBQWI7SUFDQUQsRUFBRSxDQUFDRSxNQUFILENBQVUsQ0FBVixFQUFhLEVBQWI7SUFDQUYsRUFBRSxDQUFDRSxNQUFILENBQVUsRUFBVixFQUFjLEVBQWQ7SUFDQUYsRUFBRSxDQUFDdEosTUFBSDtJQUVBcUosVUFBVSxDQUFDelYsTUFBWCxHQUFvQmxKLFVBQXBCO0VBQ0g7QUFDSixDQWp5RkwsWUFveUZJa2UscUJBcHlGSixHQW95RjJCLCtCQUFTbGUsVUFBVCxFQUFxQmlCLFdBQXJCLEVBQWtDSCxZQUFsQyxFQUFnRDRGLFVBQWhELEVBQTREO0VBQy9FLElBQUlxWSxPQUFPLEdBQUdqZSxZQUFZLEdBQUMsQ0FBYixHQUFpQixFQUEvQjtFQUNBLElBQUlrZSxZQUFZLEdBQUcsRUFBbkIsQ0FGK0UsQ0FFdkQ7RUFFeEI7O0VBQ0EsSUFBSUMsUUFBUSxHQUFHLElBQUlobEIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFVBQVosQ0FBZjtFQUNBMlgsUUFBUSxDQUFDaFcsY0FBVCxDQUF3QmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUTlMLFdBQVcsR0FBRyxFQUF0QixFQUEwQitkLFlBQTFCLENBQXhCO0VBQ0FDLFFBQVEsQ0FBQ3pWLFdBQVQsQ0FBcUIsQ0FBckIsRUFBd0J1VixPQUF4QjtFQUVBLElBQUlHLEVBQUUsR0FBR0QsUUFBUSxDQUFDdlYsWUFBVCxDQUFzQnpQLEVBQUUsQ0FBQ2tULFFBQXpCLENBQVQ7RUFDQStSLEVBQUUsQ0FBQzlSLFNBQUgsR0FBZW5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixHQUFyQixDQUFmO0VBQ0FrVixFQUFFLENBQUM3UixTQUFILENBQWEsRUFBRXBNLFdBQVcsR0FBRyxFQUFoQixJQUFvQixDQUFqQyxFQUFvQyxDQUFDK2QsWUFBRCxHQUFjLENBQWxELEVBQXFEL2QsV0FBVyxHQUFHLEVBQW5FLEVBQXVFK2QsWUFBdkUsRUFBcUYsQ0FBckY7RUFDQUUsRUFBRSxDQUFDNVIsSUFBSDtFQUNBNFIsRUFBRSxDQUFDOUosV0FBSCxHQUFpQm5iLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixFQUFuQixFQUF1QixHQUF2QixDQUFqQjtFQUNBa1YsRUFBRSxDQUFDN0osU0FBSCxHQUFlLENBQWY7RUFDQTZKLEVBQUUsQ0FBQzdSLFNBQUgsQ0FBYSxFQUFFcE0sV0FBVyxHQUFHLEVBQWhCLElBQW9CLENBQWpDLEVBQW9DLENBQUMrZCxZQUFELEdBQWMsQ0FBbEQsRUFBcUQvZCxXQUFXLEdBQUcsRUFBbkUsRUFBdUUrZCxZQUF2RSxFQUFxRixDQUFyRjtFQUNBRSxFQUFFLENBQUM1SixNQUFIO0VBQ0EySixRQUFRLENBQUMvVixNQUFULEdBQWtCbEosVUFBbEIsQ0FqQitFLENBbUIvRTs7RUFDQSxJQUFJbWYsUUFBUSxHQUFHLElBQUlsbEIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFVBQVosQ0FBZjtFQUNBNlgsUUFBUSxDQUFDM1YsV0FBVCxDQUFxQixDQUFDdkksV0FBRCxHQUFhLENBQWIsR0FBaUIsRUFBdEMsRUFBMEM4ZCxPQUExQztFQUNBLElBQUlLLEVBQUUsR0FBR0QsUUFBUSxDQUFDelYsWUFBVCxDQUFzQnpQLEVBQUUsQ0FBQ2tULFFBQXpCLENBQVQ7RUFDQWlTLEVBQUUsQ0FBQ2hTLFNBQUgsR0FBZW5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixFQUFuQixFQUF1QixHQUF2QixDQUFmO0VBQ0FvVixFQUFFLENBQUNDLE1BQUgsQ0FBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQjtFQUNBRCxFQUFFLENBQUM5UixJQUFIO0VBQ0E2UixRQUFRLENBQUNqVyxNQUFULEdBQWtCbEosVUFBbEIsQ0ExQitFLENBNEIvRTs7RUFDQSxJQUFJc2YsU0FBUyxHQUFHLElBQUlybEIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFdBQVosQ0FBaEI7RUFDQWdZLFNBQVMsQ0FBQzlWLFdBQVYsQ0FBc0J2SSxXQUFXLEdBQUMsQ0FBWixHQUFnQixFQUF0QyxFQUEwQzhkLE9BQTFDO0VBQ0EsSUFBSVEsRUFBRSxHQUFHRCxTQUFTLENBQUM1VixZQUFWLENBQXVCelAsRUFBRSxDQUFDa1QsUUFBMUIsQ0FBVDtFQUNBb1MsRUFBRSxDQUFDblMsU0FBSCxHQUFlblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEVBQW5CLEVBQXVCLEdBQXZCLENBQWY7RUFDQXVWLEVBQUUsQ0FBQ0YsTUFBSCxDQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCLENBQWhCO0VBQ0FFLEVBQUUsQ0FBQ2pTLElBQUg7RUFDQWdTLFNBQVMsQ0FBQ3BXLE1BQVYsR0FBbUJsSixVQUFuQixDQW5DK0UsQ0FxQy9FOztFQUNBLElBQUlzSixTQUFTLEdBQUcsSUFBSXJQLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxXQUFaLENBQWhCO0VBQ0FnQyxTQUFTLENBQUNFLFdBQVYsQ0FBc0IsQ0FBdEIsRUFBeUJ1VixPQUFPLEdBQUcsRUFBbkMsRUF2QytFLENBdUN0Qzs7RUFDekN6VixTQUFTLENBQUNqSCxPQUFWLEdBQW9CLEdBQXBCO0VBQ0FpSCxTQUFTLENBQUNoSCxPQUFWLEdBQW9CLEdBQXBCO0VBRUEsSUFBSXVMLFVBQVUsR0FBR3ZFLFNBQVMsQ0FBQ0ksWUFBVixDQUF1QnpQLEVBQUUsQ0FBQ0ssS0FBMUIsQ0FBakI7RUFDQXVULFVBQVUsQ0FBQzdRLE1BQVgsR0FBb0IwSixVQUFVLENBQUMvQixTQUFYLElBQXdCLE1BQTVDO0VBQ0FrSixVQUFVLENBQUNsRSxRQUFYLEdBQXNCLEVBQXRCLENBN0MrRSxDQTZDcEQ7O0VBQzNCa0UsVUFBVSxDQUFDakUsVUFBWCxHQUF3QixFQUF4QjtFQUNBaUUsVUFBVSxDQUFDaEUsZUFBWCxHQUE2QjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBdEQ7RUFDQVQsU0FBUyxDQUFDVSxLQUFWLEdBQWtCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWxCO0VBRUEsSUFBSStELFlBQVksR0FBR3pFLFNBQVMsQ0FBQ0ksWUFBVixDQUF1QnpQLEVBQUUsQ0FBQ2lRLFlBQTFCLENBQW5CO0VBQ0E2RCxZQUFZLENBQUMvRCxLQUFiLEdBQXFCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLENBQWpCLENBQXJCO0VBQ0ErRCxZQUFZLENBQUM3TSxLQUFiLEdBQXFCLENBQXJCO0VBQ0FvSSxTQUFTLENBQUNKLE1BQVYsR0FBbUJsSixVQUFuQixDQXJEK0UsQ0F1RC9FOztFQUNBLElBQUl3ZixPQUFPLEdBQUcsSUFBSXZsQixFQUFFLENBQUNxTixJQUFQLENBQVksU0FBWixDQUFkO0VBQ0FrWSxPQUFPLENBQUNoVyxXQUFSLENBQW9CLENBQXBCLEVBQXVCdVYsT0FBTyxHQUFHLEVBQWpDLEVBekQrRSxDQXlEeEM7O0VBQ3ZDUyxPQUFPLENBQUNuZCxPQUFSLEdBQWtCLEdBQWxCO0VBQ0FtZCxPQUFPLENBQUNsZCxPQUFSLEdBQWtCLEdBQWxCO0VBRUEsSUFBSW1kLFFBQVEsR0FBR0QsT0FBTyxDQUFDOVYsWUFBUixDQUFxQnpQLEVBQUUsQ0FBQ0ssS0FBeEIsQ0FBZjtFQUNBbWxCLFFBQVEsQ0FBQ3ppQixNQUFULEdBQWtCLFNBQVMwSixVQUFVLENBQUM3QixVQUFYLElBQXlCLENBQWxDLElBQXVDLFVBQXZDLElBQXFENkIsVUFBVSxDQUFDNUIsVUFBWCxJQUF5QixDQUE5RSxJQUFtRixHQUFyRztFQUNBMmEsUUFBUSxDQUFDOVYsUUFBVCxHQUFvQixFQUFwQixDQS9EK0UsQ0ErRHREOztFQUN6QjhWLFFBQVEsQ0FBQzVWLGVBQVQsR0FBMkI1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQXBEO0VBQ0F5VixPQUFPLENBQUN4VixLQUFSLEdBQWdCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWhCO0VBQ0F3VixPQUFPLENBQUN0VyxNQUFSLEdBQWlCbEosVUFBakI7QUFDSCxDQXYyRkwsWUEwMkZJbWUsc0JBMTJGSixHQTAyRjRCLGdDQUFTbmUsVUFBVCxFQUFxQmlCLFdBQXJCLEVBQWtDSCxZQUFsQyxFQUFnRDRGLFVBQWhELEVBQTREMEUsVUFBNUQsRUFBd0U7RUFDNUYsSUFBSXRQLElBQUksR0FBRyxJQUFYLENBRDRGLENBRzVGOztFQUNBLElBQUk0akIsVUFBVSxHQUFHNWUsWUFBWSxHQUFDLENBQWIsR0FBaUIsR0FBbEM7RUFDQSxJQUFJNmUsZUFBZSxHQUFHLEVBQXRCLENBTDRGLENBS2pFOztFQUUzQixJQUFJQyxXQUFXLEdBQUcsSUFBSTNsQixFQUFFLENBQUNxTixJQUFQLENBQVksYUFBWixDQUFsQjtFQUNBc1ksV0FBVyxDQUFDcFcsV0FBWixDQUF3QixDQUF4QixFQUEyQmtXLFVBQTNCO0VBQ0EsSUFBSUcsR0FBRyxHQUFHRCxXQUFXLENBQUNsVyxZQUFaLENBQXlCelAsRUFBRSxDQUFDa1QsUUFBNUIsQ0FBVjtFQUNBMFMsR0FBRyxDQUFDelMsU0FBSixHQUFnQm5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixHQUFyQixDQUFoQjtFQUNBNlYsR0FBRyxDQUFDeFMsU0FBSixDQUFjLENBQUNwTSxXQUFELEdBQWEsQ0FBYixHQUFpQixFQUEvQixFQUFtQyxDQUFDMGUsZUFBRCxHQUFpQixDQUFwRCxFQUF1RDFlLFdBQVcsR0FBRyxFQUFyRSxFQUF5RTBlLGVBQXpFLEVBQTBGLENBQTFGO0VBQ0FFLEdBQUcsQ0FBQ3ZTLElBQUo7RUFDQXNTLFdBQVcsQ0FBQzFXLE1BQVosR0FBcUJsSixVQUFyQixDQWI0RixDQWU1Rjs7RUFDQSxJQUFJOGYsS0FBSyxHQUFHLENBQUM3ZSxXQUFELEdBQWEsQ0FBYixHQUFpQixHQUE3QixDQWhCNEYsQ0FnQnpEO0VBRW5DOztFQUNBLElBQUk4ZSxhQUFhLEdBQUcsS0FBS0MscUJBQUwsQ0FDaEIsT0FEZ0IsRUFFaEJGLEtBRmdCLEVBRVRKLFVBRlMsRUFHaEIsR0FIZ0IsRUFHWCxFQUhXLENBR1A7RUFITyxDQUFwQjs7RUFLQUssYUFBYSxDQUFDN1csTUFBZCxHQUF1QmxKLFVBQXZCLENBeEI0RixDQTBCNUY7O0VBQ0EsSUFBSWlnQixPQUFPLEdBQUcsS0FBS0MsbUJBQUwsQ0FDVixNQURVLEVBRVZqbUIsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxHQUFiLEVBQWtCLEVBQWxCLENBRlUsRUFFYztFQUN4QjhWLEtBQUssR0FBRyxHQUhFLEVBR0dKLFVBSEgsRUFJVixHQUpVLEVBSUwsRUFKSyxFQUlBO0VBQ1YsWUFBVztJQUNQLElBQUlTLEtBQUssR0FBR25nQixVQUFVLENBQUNHLGNBQVgsQ0FBMEIsZUFBMUIsQ0FBWjtJQUNBLElBQUlpZ0IsT0FBTyxHQUFHRCxLQUFLLEdBQUdBLEtBQUssQ0FBQzlpQixZQUFOLENBQW1CcEQsRUFBRSxDQUFDb21CLE9BQXRCLENBQUgsR0FBb0MsSUFBdkQ7SUFDQSxJQUFJL2IsSUFBSSxHQUFHOGIsT0FBTyxHQUFHQSxPQUFPLENBQUNwakIsTUFBWCxHQUFvQixFQUF0Qzs7SUFDQSxJQUFJc0gsSUFBSSxJQUFJQSxJQUFJLENBQUNoRSxNQUFMLEdBQWMsQ0FBMUIsRUFBNkI7TUFDekJ4RSxJQUFJLENBQUN3a0IsU0FBTCxDQUFlaGMsSUFBZixFQUFxQm9DLFVBQXJCLEVBQWlDMEUsVUFBakM7SUFDSCxDQUZELE1BRU87TUFDSHRQLElBQUksQ0FBQ3lrQixlQUFMLENBQXFCdmdCLFVBQXJCLEVBQWlDLFFBQWpDO0lBQ0g7RUFDSixDQWRTLENBQWQ7O0VBZ0JBaWdCLE9BQU8sQ0FBQy9XLE1BQVIsR0FBaUJsSixVQUFqQixDQTNDNEYsQ0E2QzVGOztFQUNBLElBQUl3Z0IsTUFBTSxHQUFHdmYsV0FBVyxHQUFDLENBQVosR0FBZ0IsR0FBN0IsQ0E5QzRGLENBZ0Q1Rjs7RUFDQSxJQUFJd2YsU0FBUyxHQUFHLEtBQUtQLG1CQUFMLENBQ1osTUFEWSxFQUVaam1CLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixDQUFuQixDQUZZLEVBRVk7RUFDeEJ3VyxNQUFNLEdBQUcsRUFIRyxFQUdDZCxVQUhELEVBSVosR0FKWSxFQUlQLEVBSk8sRUFJRjtFQUNWLFlBQVc7SUFDUDVqQixJQUFJLENBQUM0a0IscUJBQUwsQ0FBMkIxZ0IsVUFBM0IsRUFBdUMwRyxVQUF2QyxFQUFtRDBFLFVBQW5EO0VBQ0gsQ0FQVyxDQUFoQjs7RUFTQXFWLFNBQVMsQ0FBQ3ZYLE1BQVYsR0FBbUJsSixVQUFuQixDQTFENEYsQ0E0RDVGOztFQUNBLElBQUkyZ0IsUUFBUSxHQUFHLEtBQUtULG1CQUFMLENBQ1gsTUFEVyxFQUVYam1CLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsR0FBYixFQUFrQixHQUFsQixDQUZXLEVBRWM7RUFDekJ3VyxNQUFNLEdBQUcsRUFIRSxFQUdFZCxVQUhGLEVBSVgsR0FKVyxFQUlOLEVBSk0sRUFJRDtFQUNWLFlBQVc7SUFDUCxJQUFJa0IsS0FBSyxHQUFHNWdCLFVBQVUsQ0FBQ0csY0FBWCxDQUEwQixlQUExQixLQUE4Q0gsVUFBMUQ7SUFDQSxJQUFJNGdCLEtBQUssQ0FBQ3RZLE9BQVYsRUFBbUJzWSxLQUFLLENBQUN0WSxPQUFOOztJQUNuQnhNLElBQUksQ0FBQzJQLFdBQUwsQ0FBaUIvRSxVQUFqQixFQUE2QjBFLFVBQTdCO0VBQ0gsQ0FUVSxDQUFmOztFQVdBdVYsUUFBUSxDQUFDelgsTUFBVCxHQUFrQmxKLFVBQWxCO0FBQ0gsQ0FuN0ZMLFlBczdGSWdnQixxQkF0N0ZKLEdBczdGMkIsK0JBQVNhLFdBQVQsRUFBc0JwZSxDQUF0QixFQUF5QmQsQ0FBekIsRUFBNEJULEtBQTVCLEVBQW1DRixNQUFuQyxFQUEyQztFQUM5RCxJQUFJOGYsU0FBUyxHQUFHLElBQUk3bUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLGVBQVosQ0FBaEI7RUFDQXdaLFNBQVMsQ0FBQzdYLGNBQVYsQ0FBeUJoUCxFQUFFLENBQUM4UyxJQUFILENBQVE3TCxLQUFSLEVBQWVGLE1BQWYsQ0FBekI7RUFDQThmLFNBQVMsQ0FBQ3RYLFdBQVYsQ0FBc0IvRyxDQUF0QixFQUF5QmQsQ0FBekI7RUFDQW1mLFNBQVMsQ0FBQ3plLE9BQVYsR0FBb0IsR0FBcEI7RUFDQXllLFNBQVMsQ0FBQ3hlLE9BQVYsR0FBb0IsR0FBcEIsQ0FMOEQsQ0FPOUQ7O0VBQ0EsSUFBSXllLEVBQUUsR0FBR0QsU0FBUyxDQUFDcFgsWUFBVixDQUF1QnpQLEVBQUUsQ0FBQ2tULFFBQTFCLENBQVQ7RUFDQTRULEVBQUUsQ0FBQzNULFNBQUgsR0FBZW5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixHQUFyQixDQUFmO0VBQ0ErVyxFQUFFLENBQUMxVCxTQUFILENBQWEsQ0FBQ25NLEtBQUQsR0FBTyxDQUFwQixFQUF1QixDQUFDRixNQUFELEdBQVEsQ0FBL0IsRUFBa0NFLEtBQWxDLEVBQXlDRixNQUF6QyxFQUFpRCxDQUFqRDtFQUNBK2YsRUFBRSxDQUFDelQsSUFBSDtFQUNBeVQsRUFBRSxDQUFDM0wsV0FBSCxHQUFpQm5iLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixFQUFuQixFQUF1QixHQUF2QixDQUFqQjtFQUNBK1csRUFBRSxDQUFDMUwsU0FBSCxHQUFlLENBQWY7RUFDQTBMLEVBQUUsQ0FBQzFULFNBQUgsQ0FBYSxDQUFDbk0sS0FBRCxHQUFPLENBQXBCLEVBQXVCLENBQUNGLE1BQUQsR0FBUSxDQUEvQixFQUFrQ0UsS0FBbEMsRUFBeUNGLE1BQXpDLEVBQWlELENBQWpEO0VBQ0ErZixFQUFFLENBQUN6TCxNQUFILEdBZjhELENBaUI5RDs7RUFDQSxJQUFJOEssT0FBTyxHQUFHVSxTQUFTLENBQUNwWCxZQUFWLENBQXVCelAsRUFBRSxDQUFDb21CLE9BQTFCLENBQWQ7RUFDQUQsT0FBTyxDQUFDcGpCLE1BQVIsR0FBaUIsRUFBakI7RUFDQW9qQixPQUFPLENBQUNTLFdBQVIsR0FBc0JBLFdBQXRCO0VBQ0FULE9BQU8sQ0FBQ3pXLFFBQVIsR0FBbUIsRUFBbkI7RUFDQXlXLE9BQU8sQ0FBQ1ksU0FBUixHQUFvQi9tQixFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBcEI7RUFDQW9XLE9BQU8sQ0FBQ2EsbUJBQVIsR0FBOEIsRUFBOUI7RUFDQWIsT0FBTyxDQUFDYyxvQkFBUixHQUErQmpuQixFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBL0I7RUFDQW9XLE9BQU8sQ0FBQ2UsU0FBUixHQUFvQixFQUFwQjtFQUNBZixPQUFPLENBQUNnQixTQUFSLEdBQW9Cbm5CLEVBQUUsQ0FBQ29tQixPQUFILENBQVdnQixTQUFYLENBQXFCQyxPQUF6QztFQUNBbEIsT0FBTyxDQUFDbUIsVUFBUixHQUFxQnRuQixFQUFFLENBQUNvbUIsT0FBSCxDQUFXbUIsa0JBQVgsQ0FBOEJDLElBQW5EO0VBQ0FyQixPQUFPLENBQUN4VyxVQUFSLEdBQXFCNUksTUFBTSxHQUFHLENBQTlCLENBNUI4RCxDQThCOUQ7O0VBQ0FvZixPQUFPLENBQUNoakIsSUFBUixDQUFhd0IsRUFBYixDQUFnQixtQkFBaEIsRUFBcUMsWUFBVztJQUM1Q21pQixFQUFFLENBQUN4RCxLQUFIO0lBQ0F3RCxFQUFFLENBQUMzVCxTQUFILEdBQWVuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakIsRUFBcUIsR0FBckIsQ0FBZjtJQUNBK1csRUFBRSxDQUFDMVQsU0FBSCxDQUFhLENBQUNuTSxLQUFELEdBQU8sQ0FBcEIsRUFBdUIsQ0FBQ0YsTUFBRCxHQUFRLENBQS9CLEVBQWtDRSxLQUFsQyxFQUF5Q0YsTUFBekMsRUFBaUQsQ0FBakQ7SUFDQStmLEVBQUUsQ0FBQ3pULElBQUg7SUFDQXlULEVBQUUsQ0FBQzNMLFdBQUgsR0FBaUJuYixFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsRUFBbkIsRUFBdUIsR0FBdkIsQ0FBakI7SUFDQStXLEVBQUUsQ0FBQzFMLFNBQUgsR0FBZSxDQUFmO0lBQ0EwTCxFQUFFLENBQUMxVCxTQUFILENBQWEsQ0FBQ25NLEtBQUQsR0FBTyxDQUFwQixFQUF1QixDQUFDRixNQUFELEdBQVEsQ0FBL0IsRUFBa0NFLEtBQWxDLEVBQXlDRixNQUF6QyxFQUFpRCxDQUFqRDtJQUNBK2YsRUFBRSxDQUFDekwsTUFBSDtFQUNILENBVEQ7RUFXQThLLE9BQU8sQ0FBQ2hqQixJQUFSLENBQWF3QixFQUFiLENBQWdCLGlCQUFoQixFQUFtQyxZQUFXO0lBQzFDbWlCLEVBQUUsQ0FBQ3hELEtBQUg7SUFDQXdELEVBQUUsQ0FBQzNULFNBQUgsR0FBZW5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixHQUFyQixDQUFmO0lBQ0ErVyxFQUFFLENBQUMxVCxTQUFILENBQWEsQ0FBQ25NLEtBQUQsR0FBTyxDQUFwQixFQUF1QixDQUFDRixNQUFELEdBQVEsQ0FBL0IsRUFBa0NFLEtBQWxDLEVBQXlDRixNQUF6QyxFQUFpRCxDQUFqRDtJQUNBK2YsRUFBRSxDQUFDelQsSUFBSDtJQUNBeVQsRUFBRSxDQUFDM0wsV0FBSCxHQUFpQm5iLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixFQUFuQixFQUF1QixHQUF2QixDQUFqQjtJQUNBK1csRUFBRSxDQUFDMUwsU0FBSCxHQUFlLENBQWY7SUFDQTBMLEVBQUUsQ0FBQzFULFNBQUgsQ0FBYSxDQUFDbk0sS0FBRCxHQUFPLENBQXBCLEVBQXVCLENBQUNGLE1BQUQsR0FBUSxDQUEvQixFQUFrQ0UsS0FBbEMsRUFBeUNGLE1BQXpDLEVBQWlELENBQWpEO0lBQ0ErZixFQUFFLENBQUN6TCxNQUFIO0VBQ0gsQ0FURDtFQVdBLE9BQU93TCxTQUFQO0FBQ0gsQ0E1K0ZMLFlBKytGSVosbUJBLytGSixHQSsrRnlCLDZCQUFTd0IsSUFBVCxFQUFlN1UsT0FBZixFQUF3QnBLLENBQXhCLEVBQTJCZCxDQUEzQixFQUE4QlQsS0FBOUIsRUFBcUNGLE1BQXJDLEVBQTZDMmdCLFFBQTdDLEVBQXVEO0VBQ3hFLElBQUl0Z0IsR0FBRyxHQUFHLElBQUlwSCxFQUFFLENBQUNxTixJQUFQLENBQVksZUFBZW9hLElBQTNCLENBQVY7RUFDQXJnQixHQUFHLENBQUM0SCxjQUFKLENBQW1CaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFRN0wsS0FBUixFQUFlRixNQUFmLENBQW5CO0VBQ0FLLEdBQUcsQ0FBQ21JLFdBQUosQ0FBZ0IvRyxDQUFoQixFQUFtQmQsQ0FBbkI7RUFDQU4sR0FBRyxDQUFDZ0IsT0FBSixHQUFjLEdBQWQ7RUFDQWhCLEdBQUcsQ0FBQ2lCLE9BQUosR0FBYyxHQUFkLENBTHdFLENBT3hFOztFQUNBLElBQUl5ZSxFQUFFLEdBQUcxZixHQUFHLENBQUNxSSxZQUFKLENBQWlCelAsRUFBRSxDQUFDa1QsUUFBcEIsQ0FBVDtFQUNBNFQsRUFBRSxDQUFDM1QsU0FBSCxHQUFlUCxPQUFmO0VBQ0FrVSxFQUFFLENBQUMxVCxTQUFILENBQWEsQ0FBQ25NLEtBQUQsR0FBTyxDQUFwQixFQUF1QixDQUFDRixNQUFELEdBQVEsQ0FBL0IsRUFBa0NFLEtBQWxDLEVBQXlDRixNQUF6QyxFQUFpRCxDQUFqRDtFQUNBK2YsRUFBRSxDQUFDelQsSUFBSCxHQVh3RSxDQVl4RTs7RUFDQXlULEVBQUUsQ0FBQzNULFNBQUgsR0FBZW5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixFQUF3QixFQUF4QixDQUFmO0VBQ0ErVyxFQUFFLENBQUMxVCxTQUFILENBQWEsQ0FBQ25NLEtBQUQsR0FBTyxDQUFQLEdBQVcsQ0FBeEIsRUFBMkIsQ0FBM0IsRUFBOEJBLEtBQUssR0FBRyxDQUF0QyxFQUF5Q0YsTUFBTSxHQUFDLENBQVAsR0FBVyxDQUFwRCxFQUF1RCxDQUF2RDtFQUNBK2YsRUFBRSxDQUFDelQsSUFBSCxHQWZ3RSxDQWlCeEU7O0VBQ0EsSUFBSXNVLFFBQVEsR0FBRyxJQUFJM25CLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxNQUFaLENBQWY7RUFDQXNhLFFBQVEsQ0FBQ3ZmLE9BQVQsR0FBbUIsR0FBbkI7RUFDQXVmLFFBQVEsQ0FBQ3RmLE9BQVQsR0FBbUIsR0FBbkI7RUFDQSxJQUFJbUgsS0FBSyxHQUFHbVksUUFBUSxDQUFDbFksWUFBVCxDQUFzQnpQLEVBQUUsQ0FBQ0ssS0FBekIsQ0FBWjtFQUNBbVAsS0FBSyxDQUFDek0sTUFBTixHQUFlMGtCLElBQWY7RUFDQWpZLEtBQUssQ0FBQ0UsUUFBTixHQUFpQixFQUFqQixDQXZCd0UsQ0F1QmxEOztFQUN0QkYsS0FBSyxDQUFDSSxlQUFOLEdBQXdCNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUFqRDtFQUNBTixLQUFLLENBQUNnRSxhQUFOLEdBQXNCeFQsRUFBRSxDQUFDSyxLQUFILENBQVNvVCxhQUFULENBQXVCM0QsTUFBN0M7RUFDQTZYLFFBQVEsQ0FBQzVYLEtBQVQsR0FBaUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBakIsQ0ExQndFLENBNEJ4RTs7RUFDQSxJQUFJQyxPQUFPLEdBQUcyWCxRQUFRLENBQUNsWSxZQUFULENBQXNCelAsRUFBRSxDQUFDaVEsWUFBekIsQ0FBZDtFQUNBRCxPQUFPLENBQUNELEtBQVIsR0FBZ0IvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxDQUFmLEVBQWtCLEdBQWxCLENBQWhCO0VBQ0FDLE9BQU8sQ0FBQy9JLEtBQVIsR0FBZ0IsQ0FBaEI7RUFDQTBnQixRQUFRLENBQUMxWSxNQUFULEdBQWtCN0gsR0FBbEIsQ0FoQ3dFLENBa0N4RTs7RUFDQUEsR0FBRyxDQUFDekMsRUFBSixDQUFPM0UsRUFBRSxDQUFDcU4sSUFBSCxDQUFRQyxTQUFSLENBQWtCc2EsV0FBekIsRUFBc0MsVUFBU3BhLEtBQVQsRUFBZ0I7SUFDbERBLEtBQUssQ0FBQ0MsZUFBTjtJQUNBckcsR0FBRyxDQUFDZSxLQUFKLEdBQVksSUFBWjtFQUNILENBSEQ7RUFJQWYsR0FBRyxDQUFDekMsRUFBSixDQUFPM0UsRUFBRSxDQUFDcU4sSUFBSCxDQUFRQyxTQUFSLENBQWtCQyxTQUF6QixFQUFvQyxVQUFTQyxLQUFULEVBQWdCO0lBQ2hEQSxLQUFLLENBQUNDLGVBQU47SUFDQXJHLEdBQUcsQ0FBQ2UsS0FBSixHQUFZLENBQVo7SUFDQSxJQUFJdWYsUUFBSixFQUFjQSxRQUFRO0VBQ3pCLENBSkQ7RUFLQXRnQixHQUFHLENBQUN6QyxFQUFKLENBQU8zRSxFQUFFLENBQUNxTixJQUFILENBQVFDLFNBQVIsQ0FBa0J1YSxZQUF6QixFQUF1QyxVQUFTcmEsS0FBVCxFQUFnQjtJQUNuRHBHLEdBQUcsQ0FBQ2UsS0FBSixHQUFZLENBQVo7RUFDSCxDQUZEO0VBSUEsT0FBT2YsR0FBUDtBQUNILENBaGlHTCxZQW1pR0krYyxzQkFuaUdKLEdBbWlHNEIsZ0NBQVNwZSxVQUFULEVBQXFCaUIsV0FBckIsRUFBa0NILFlBQWxDLEVBQWdENEYsVUFBaEQsRUFBNEQwRSxVQUE1RCxFQUF3RTtFQUM1RixJQUFJdFAsSUFBSSxHQUFHLElBQVgsQ0FENEYsQ0FHNUY7O0VBQ0EsSUFBSWltQixLQUFLLEdBQUcsQ0FBQyxFQUFiLENBSjRGLENBSTFFOztFQUNsQixJQUFJQyxVQUFVLEdBQUdsaEIsWUFBWSxHQUFHLEdBQWhDLENBTDRGLENBS3REOztFQUN0QyxJQUFJbWhCLFNBQVMsR0FBR2hoQixXQUFXLEdBQUcsRUFBOUIsQ0FONEYsQ0FRNUY7O0VBQ0EsSUFBSWloQixNQUFNLEdBQUcsSUFBSWpvQixFQUFFLENBQUNxTixJQUFQLENBQVksUUFBWixDQUFiO0VBQ0E0YSxNQUFNLENBQUNqWixjQUFQLENBQXNCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFRa1YsU0FBUixFQUFtQkQsVUFBbkIsQ0FBdEI7RUFDQUUsTUFBTSxDQUFDMVksV0FBUCxDQUFtQixDQUFuQixFQUFzQnVZLEtBQXRCO0VBRUEsSUFBSUksRUFBRSxHQUFHRCxNQUFNLENBQUN4WSxZQUFQLENBQW9CelAsRUFBRSxDQUFDa1QsUUFBdkIsQ0FBVDtFQUNBZ1YsRUFBRSxDQUFDL1UsU0FBSCxHQUFlblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCLEVBQXFCLEdBQXJCLENBQWY7RUFDQW1ZLEVBQUUsQ0FBQzlVLFNBQUgsQ0FBYSxDQUFDNFUsU0FBRCxHQUFXLENBQXhCLEVBQTJCLENBQUNELFVBQUQsR0FBWSxDQUF2QyxFQUEwQ0MsU0FBMUMsRUFBcURELFVBQXJELEVBQWlFLENBQWpFO0VBQ0FHLEVBQUUsQ0FBQzdVLElBQUg7RUFDQTZVLEVBQUUsQ0FBQy9NLFdBQUgsR0FBaUJuYixFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakIsRUFBcUIsR0FBckIsQ0FBakI7RUFDQW1ZLEVBQUUsQ0FBQzlNLFNBQUgsR0FBZSxDQUFmO0VBQ0E4TSxFQUFFLENBQUM5VSxTQUFILENBQWEsQ0FBQzRVLFNBQUQsR0FBVyxDQUF4QixFQUEyQixDQUFDRCxVQUFELEdBQVksQ0FBdkMsRUFBMENDLFNBQTFDLEVBQXFERCxVQUFyRCxFQUFpRSxDQUFqRTtFQUNBRyxFQUFFLENBQUM3TSxNQUFIO0VBQ0E0TSxNQUFNLENBQUNoWixNQUFQLEdBQWdCbEosVUFBaEIsQ0FyQjRGLENBdUI1Rjs7RUFDQSxJQUFJK2UsT0FBTyxHQUFHZ0QsS0FBSyxHQUFHQyxVQUFVLEdBQUMsQ0FBbkIsR0FBdUIsRUFBckMsQ0F4QjRGLENBMEI1Rjs7RUFDQSxJQUFJL0MsUUFBUSxHQUFHLElBQUlobEIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLGFBQVosQ0FBZjtFQUNBMlgsUUFBUSxDQUFDelYsV0FBVCxDQUFxQixDQUFyQixFQUF3QnVWLE9BQXhCO0VBQ0EsSUFBSXFELEdBQUcsR0FBR25ELFFBQVEsQ0FBQ3ZWLFlBQVQsQ0FBc0J6UCxFQUFFLENBQUNrVCxRQUF6QixDQUFWO0VBQ0FpVixHQUFHLENBQUNoVixTQUFKLEdBQWdCblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCLEVBQXFCLEdBQXJCLENBQWhCO0VBQ0FvWSxHQUFHLENBQUMvVSxTQUFKLENBQWMsQ0FBQzRVLFNBQUQsR0FBVyxDQUFYLEdBQWUsQ0FBN0IsRUFBZ0MsQ0FBQyxFQUFqQyxFQUFxQ0EsU0FBUyxHQUFHLEVBQWpELEVBQXFELEVBQXJELEVBQXlELENBQXpEO0VBQ0FHLEdBQUcsQ0FBQzlVLElBQUo7RUFDQTJSLFFBQVEsQ0FBQy9WLE1BQVQsR0FBa0JsSixVQUFsQixDQWpDNEYsQ0FtQzVGOztFQUNBLElBQUlxaUIsUUFBUSxHQUFHSixTQUFTLEdBQUcsQ0FBM0I7RUFDQSxJQUFJSyxPQUFPLEdBQUcsQ0FBQyxLQUFELEVBQVEsSUFBUixFQUFjLElBQWQsRUFBb0IsSUFBcEIsRUFBMEIsSUFBMUIsQ0FBZDs7RUFDQSxLQUFLLElBQUlqaUIsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR2lpQixPQUFPLENBQUNoaUIsTUFBNUIsRUFBb0NELENBQUMsRUFBckMsRUFBeUM7SUFDckMsSUFBSWtpQixLQUFLLEdBQUcsSUFBSXRvQixFQUFFLENBQUNxTixJQUFQLENBQVksTUFBTWpILENBQWxCLENBQVo7SUFDQWtpQixLQUFLLENBQUM5ZixDQUFOLEdBQVUsQ0FBQ3dmLFNBQUQsR0FBVyxDQUFYLEdBQWVJLFFBQVEsSUFBSWhpQixDQUFDLEdBQUcsR0FBUixDQUFqQztJQUNBa2lCLEtBQUssQ0FBQzVnQixDQUFOLEdBQVVvZCxPQUFWO0lBQ0F3RCxLQUFLLENBQUNsZ0IsT0FBTixHQUFnQixHQUFoQjtJQUNBa2dCLEtBQUssQ0FBQ2pnQixPQUFOLEdBQWdCLEdBQWhCO0lBRUEsSUFBSWtnQixFQUFFLEdBQUdELEtBQUssQ0FBQzdZLFlBQU4sQ0FBbUJ6UCxFQUFFLENBQUNLLEtBQXRCLENBQVQ7SUFDQWtvQixFQUFFLENBQUN4bEIsTUFBSCxHQUFZc2xCLE9BQU8sQ0FBQ2ppQixDQUFELENBQW5CO0lBQ0FtaUIsRUFBRSxDQUFDN1ksUUFBSCxHQUFjLEVBQWQsQ0FUcUMsQ0FTbEI7O0lBQ25CNlksRUFBRSxDQUFDM1ksZUFBSCxHQUFxQjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBOUM7SUFDQXdZLEtBQUssQ0FBQ3ZZLEtBQU4sR0FBYy9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFkLENBWHFDLENBYXJDOztJQUNBLElBQUlDLE9BQU8sR0FBR3NZLEtBQUssQ0FBQzdZLFlBQU4sQ0FBbUJ6UCxFQUFFLENBQUNpUSxZQUF0QixDQUFkO0lBQ0FELE9BQU8sQ0FBQ0QsS0FBUixHQUFnQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixDQUFoQjtJQUNBQyxPQUFPLENBQUMvSSxLQUFSLEdBQWdCLENBQWhCO0lBQ0FxaEIsS0FBSyxDQUFDclosTUFBTixHQUFlbEosVUFBZjtFQUNILENBeEQyRixDQTBENUY7OztFQUNBLElBQUl5aUIsYUFBYSxHQUFHLElBQUl4b0IsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLG1CQUFaLENBQXBCO0VBQ0FtYixhQUFhLENBQUN4WixjQUFkLENBQTZCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFRa1YsU0FBUyxHQUFHLEVBQXBCLEVBQXdCRCxVQUFVLEdBQUcsRUFBckMsQ0FBN0I7RUFDQVMsYUFBYSxDQUFDOWdCLENBQWQsR0FBa0JvZ0IsS0FBSyxHQUFHLEVBQTFCO0VBQ0FVLGFBQWEsQ0FBQ3ZaLE1BQWQsR0FBdUJsSixVQUF2QixDQTlENEYsQ0FnRTVGOztFQUNBLElBQUlrYyxXQUFXLEdBQUcsSUFBSWppQixFQUFFLENBQUNxTixJQUFQLENBQVksY0FBWixDQUFsQjtFQUNBNFUsV0FBVyxDQUFDN1osT0FBWixHQUFzQixHQUF0QjtFQUNBNlosV0FBVyxDQUFDNVosT0FBWixHQUFzQixHQUF0QjtFQUNBLElBQUlvZ0IsRUFBRSxHQUFHeEcsV0FBVyxDQUFDeFMsWUFBWixDQUF5QnpQLEVBQUUsQ0FBQ0ssS0FBNUIsQ0FBVDtFQUNBb29CLEVBQUUsQ0FBQzFsQixNQUFILEdBQVksYUFBWjtFQUNBMGxCLEVBQUUsQ0FBQy9ZLFFBQUgsR0FBYyxFQUFkLENBdEU0RixDQXNFekU7O0VBQ25CK1ksRUFBRSxDQUFDN1ksZUFBSCxHQUFxQjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBOUM7RUFDQW1TLFdBQVcsQ0FBQ2xTLEtBQVosR0FBb0IvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBcEI7RUFDQWtTLFdBQVcsQ0FBQ2hULE1BQVosR0FBcUJ1WixhQUFyQixDQXpFNEYsQ0EyRTVGOztFQUNBLEtBQUtFLCtCQUFMLENBQXFDRixhQUFyQyxFQUFvRHZHLFdBQXBELEVBQWlFeFYsVUFBakUsRUFBNkUwRSxVQUE3RSxFQUF5RnBMLFVBQXpGO0FBQ0gsQ0FobkdMLFlBbW5HSXFlLHFCQW5uR0osR0FtbkcyQiwrQkFBU3JlLFVBQVQsRUFBcUJpQixXQUFyQixFQUFrQ0gsWUFBbEMsRUFBZ0RzSyxVQUFoRCxFQUE0RDFFLFVBQTVELEVBQXdFO0VBQzNGLElBQUk1SyxJQUFJLEdBQUcsSUFBWDtFQUNBLElBQUk4bUIsT0FBTyxHQUFHLENBQUM5aEIsWUFBRCxHQUFjLENBQWQsR0FBa0IsRUFBaEMsQ0FGMkYsQ0FFdEQ7RUFFckM7O0VBQ0EsSUFBSStoQixRQUFRLEdBQUcsSUFBSTVvQixFQUFFLENBQUNxTixJQUFQLENBQVksVUFBWixDQUFmO0VBQ0F1YixRQUFRLENBQUNyWixXQUFULENBQXFCLENBQXJCLEVBQXdCb1osT0FBeEI7RUFDQSxJQUFJRSxFQUFFLEdBQUdELFFBQVEsQ0FBQ25aLFlBQVQsQ0FBc0J6UCxFQUFFLENBQUNrVCxRQUF6QixDQUFUO0VBQ0EyVixFQUFFLENBQUMxVixTQUFILEdBQWVuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakIsRUFBcUIsR0FBckIsQ0FBZjtFQUNBOFksRUFBRSxDQUFDelYsU0FBSCxDQUFhLENBQUNwTSxXQUFELEdBQWEsQ0FBYixHQUFpQixFQUE5QixFQUFrQyxDQUFDLEVBQW5DLEVBQXVDQSxXQUFXLEdBQUcsRUFBckQsRUFBeUQsRUFBekQsRUFBNkQsQ0FBN0Q7RUFDQTZoQixFQUFFLENBQUN4VixJQUFIO0VBQ0F1VixRQUFRLENBQUMzWixNQUFULEdBQWtCbEosVUFBbEIsQ0FYMkYsQ0FhM0Y7O0VBQ0EsSUFBSStpQixPQUFPLEdBQUcsS0FBSzdDLG1CQUFMLENBQ1YsTUFEVSxFQUVWam1CLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixHQUFqQixDQUZVLEVBR1YsQ0FBQy9JLFdBQUQsR0FBYSxDQUFiLEdBQWlCLEdBSFAsRUFHWTJoQixPQUhaLEVBSVYsR0FKVSxFQUlMLEVBSkssRUFJQTtFQUNWLFlBQVc7SUFDUCxJQUFJaEMsS0FBSyxHQUFHNWdCLFVBQVUsQ0FBQ0csY0FBWCxDQUEwQixlQUExQixLQUE4Q0gsVUFBMUQ7SUFDQSxJQUFJNGdCLEtBQUssQ0FBQ3RZLE9BQVYsRUFBbUJzWSxLQUFLLENBQUN0WSxPQUFOO0VBQ3RCLENBUlMsQ0FBZDs7RUFVQXlhLE9BQU8sQ0FBQzdaLE1BQVIsR0FBaUJsSixVQUFqQixDQXhCMkYsQ0EwQjNGOztFQUNBLElBQUlnakIsUUFBUSxHQUFHLElBQUkvb0IsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFVBQVosQ0FBZjtFQUNBMGIsUUFBUSxDQUFDeFosV0FBVCxDQUFxQixFQUFyQixFQUF5Qm9aLE9BQXpCO0VBQ0EsSUFBSUssRUFBRSxHQUFHRCxRQUFRLENBQUN0WixZQUFULENBQXNCelAsRUFBRSxDQUFDa1QsUUFBekIsQ0FBVDtFQUNBOFYsRUFBRSxDQUFDN1YsU0FBSCxHQUFlblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEVBQW5CLENBQWY7RUFDQWlaLEVBQUUsQ0FBQzVELE1BQUgsQ0FBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixFQUFoQjtFQUNBNEQsRUFBRSxDQUFDM1YsSUFBSDtFQUNBMlYsRUFBRSxDQUFDN1YsU0FBSCxHQUFlblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEVBQW5CLENBQWY7RUFDQWlaLEVBQUUsQ0FBQzVELE1BQUgsQ0FBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQixDQUFoQjtFQUNBNEQsRUFBRSxDQUFDM1YsSUFBSDtFQUNBMFYsUUFBUSxDQUFDOVosTUFBVCxHQUFrQmxKLFVBQWxCO0VBRUEsSUFBSWtqQixRQUFRLEdBQUcsSUFBSWpwQixFQUFFLENBQUNxTixJQUFQLENBQVksVUFBWixDQUFmO0VBQ0E0YixRQUFRLENBQUMxWixXQUFULENBQXFCLEVBQXJCLEVBQXlCb1osT0FBekI7RUFDQU0sUUFBUSxDQUFDN2dCLE9BQVQsR0FBbUIsQ0FBbkI7RUFDQTZnQixRQUFRLENBQUM1Z0IsT0FBVCxHQUFtQixHQUFuQjtFQUNBLElBQUk2Z0IsRUFBRSxHQUFHRCxRQUFRLENBQUN4WixZQUFULENBQXNCelAsRUFBRSxDQUFDSyxLQUF6QixDQUFUO0VBQ0E2b0IsRUFBRSxDQUFDbm1CLE1BQUgsR0FBWSxLQUFLK04sV0FBTCxDQUFpQkssVUFBakIsQ0FBWjtFQUNBK1gsRUFBRSxDQUFDeFosUUFBSCxHQUFjLEVBQWQ7RUFDQXVaLFFBQVEsQ0FBQ2xaLEtBQVQsR0FBaUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsRUFBbkIsQ0FBakI7RUFDQWtaLFFBQVEsQ0FBQ2hhLE1BQVQsR0FBa0JsSixVQUFsQixDQTlDMkYsQ0FnRDNGOztFQUNBLElBQUlvakIsVUFBVSxHQUFHLEtBQUtsRCxtQkFBTCxDQUNiLE1BRGEsRUFFYmptQixFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEdBQWIsRUFBa0IsR0FBbEIsQ0FGYSxFQUdiL0ksV0FBVyxHQUFDLENBQVosR0FBZ0IsR0FISCxFQUdRMmhCLE9BSFIsRUFJYixHQUphLEVBSVIsRUFKUSxFQUlIO0VBQ1YsWUFBVztJQUNQLElBQUlTLFNBQVMsR0FBR3JqQixVQUFVLENBQUNHLGNBQVgsQ0FBMEIsbUJBQTFCLENBQWhCO0lBQ0EsSUFBSSxDQUFDa2pCLFNBQUwsRUFBZ0I7SUFFaEIsSUFBSUMsT0FBTyxHQUFHRCxTQUFTLENBQUNsakIsY0FBVixDQUF5QixjQUF6QixDQUFkOztJQUNBLElBQUltakIsT0FBSixFQUFhO01BQ1RBLE9BQU8sQ0FBQzVpQixNQUFSLEdBQWlCLElBQWpCO01BQ0E0aUIsT0FBTyxDQUFDam1CLFlBQVIsQ0FBcUJwRCxFQUFFLENBQUNLLEtBQXhCLEVBQStCMEMsTUFBL0IsR0FBd0MsU0FBeEM7SUFDSDs7SUFFRCxJQUFJb0QsUUFBUSxHQUFHaWpCLFNBQVMsQ0FBQ2pqQixRQUFWLENBQW1CK2EsS0FBbkIsRUFBZjs7SUFDQSxLQUFLLElBQUk5YSxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHRCxRQUFRLENBQUNFLE1BQTdCLEVBQXFDRCxDQUFDLEVBQXRDLEVBQTBDO01BQ3RDLElBQUlELFFBQVEsQ0FBQ0MsQ0FBRCxDQUFSLENBQVltQixJQUFaLEtBQXFCLGNBQXpCLEVBQXlDO1FBQ3JDcEIsUUFBUSxDQUFDQyxDQUFELENBQVIsQ0FBWWlJLE9BQVo7TUFDSDtJQUNKOztJQUNEeE0sSUFBSSxDQUFDNm1CLCtCQUFMLENBQXFDVSxTQUFyQyxFQUFnREMsT0FBaEQsRUFBeUQ1YyxVQUF6RCxFQUFxRTBFLFVBQXJFLEVBQWlGcEwsVUFBakY7RUFDSCxDQXRCWSxDQUFqQjs7RUF3QkFvakIsVUFBVSxDQUFDbGEsTUFBWCxHQUFvQmxKLFVBQXBCO0FBQ0gsQ0E3ckdMLFlBZ3NHSXVqQixpQkFoc0dKLEdBZ3NHdUIsMkJBQVM3QixJQUFULEVBQWU3VSxPQUFmLEVBQXdCcEssQ0FBeEIsRUFBMkJkLENBQTNCLEVBQThCVCxLQUE5QixFQUFxQ0YsTUFBckMsRUFBNkMyZ0IsUUFBN0MsRUFBdUQ2QixTQUF2RCxFQUFrRTtFQUNqRixJQUFJbmlCLEdBQUcsR0FBRyxJQUFJcEgsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFNBQVNvYSxJQUFyQixDQUFWO0VBQ0FyZ0IsR0FBRyxDQUFDNEgsY0FBSixDQUFtQmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUTdMLEtBQVIsRUFBZUYsTUFBZixDQUFuQjtFQUNBSyxHQUFHLENBQUNtSSxXQUFKLENBQWdCL0csQ0FBaEIsRUFBbUJkLENBQW5CO0VBQ0FOLEdBQUcsQ0FBQ2dCLE9BQUosR0FBYyxHQUFkO0VBQ0FoQixHQUFHLENBQUNpQixPQUFKLEdBQWMsR0FBZCxDQUxpRixDQU9qRjs7RUFDQSxJQUFJMkssTUFBTSxHQUFHLElBQUloVCxFQUFFLENBQUNxTixJQUFQLENBQVksUUFBWixDQUFiO0VBQ0EyRixNQUFNLENBQUN6RCxXQUFQLENBQW1CLENBQW5CLEVBQXNCLENBQXRCO0VBQ0F5RCxNQUFNLENBQUM1SyxPQUFQLEdBQWlCLEdBQWpCO0VBQ0E0SyxNQUFNLENBQUMzSyxPQUFQLEdBQWlCLEdBQWpCO0VBRUEsSUFBSXllLEVBQUUsR0FBRzlULE1BQU0sQ0FBQ3ZELFlBQVAsQ0FBb0J6UCxFQUFFLENBQUNrVCxRQUF2QixDQUFULENBYmlGLENBZWpGOztFQUNBNFQsRUFBRSxDQUFDM1QsU0FBSCxHQUFlUCxPQUFmO0VBQ0FrVSxFQUFFLENBQUMxVCxTQUFILENBQWEsQ0FBQ25NLEtBQUQsR0FBTyxDQUFwQixFQUF1QixDQUFDRixNQUFELEdBQVEsQ0FBL0IsRUFBa0NFLEtBQWxDLEVBQXlDRixNQUF6QyxFQUFpRCxDQUFqRDtFQUNBK2YsRUFBRSxDQUFDelQsSUFBSCxHQWxCaUYsQ0FvQmpGOztFQUNBLElBQUltVyxXQUFXLEdBQUd4cEIsRUFBRSxDQUFDK1AsS0FBSCxDQUNkcEIsSUFBSSxDQUFDMlEsR0FBTCxDQUFTLEdBQVQsRUFBYzFNLE9BQU8sQ0FBQ3FGLENBQVIsR0FBWSxFQUExQixDQURjLEVBRWR0SixJQUFJLENBQUMyUSxHQUFMLENBQVMsR0FBVCxFQUFjMU0sT0FBTyxDQUFDNlcsQ0FBUixHQUFZLEVBQTFCLENBRmMsRUFHZDlhLElBQUksQ0FBQzJRLEdBQUwsQ0FBUyxHQUFULEVBQWMxTSxPQUFPLENBQUNyRyxDQUFSLEdBQVksRUFBMUIsQ0FIYyxDQUFsQjtFQUtBdWEsRUFBRSxDQUFDM0wsV0FBSCxHQUFpQnFPLFdBQWpCO0VBQ0ExQyxFQUFFLENBQUMxTCxTQUFILEdBQWUsQ0FBZjtFQUNBMEwsRUFBRSxDQUFDMVQsU0FBSCxDQUFhLENBQUNuTSxLQUFELEdBQU8sQ0FBcEIsRUFBdUIsQ0FBQ0YsTUFBRCxHQUFRLENBQS9CLEVBQWtDRSxLQUFsQyxFQUF5Q0YsTUFBekMsRUFBaUQsQ0FBakQ7RUFDQStmLEVBQUUsQ0FBQ3pMLE1BQUgsR0E3QmlGLENBK0JqRjs7RUFDQSxJQUFJa08sU0FBSixFQUFlO0lBQ1h6QyxFQUFFLENBQUMzVCxTQUFILEdBQWVuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsRUFBd0IsRUFBeEIsQ0FBZjtJQUNBK1csRUFBRSxDQUFDMVQsU0FBSCxDQUFhLENBQUNuTSxLQUFELEdBQU8sQ0FBUCxHQUFXLENBQXhCLEVBQTJCLENBQTNCLEVBQThCQSxLQUFLLEdBQUcsQ0FBdEMsRUFBeUNGLE1BQU0sR0FBQyxDQUFQLEdBQVcsQ0FBcEQsRUFBdUQsQ0FBdkQ7SUFDQStmLEVBQUUsQ0FBQ3pULElBQUg7RUFDSDs7RUFDREwsTUFBTSxDQUFDL0QsTUFBUCxHQUFnQjdILEdBQWhCLENBckNpRixDQXVDakY7O0VBQ0EsSUFBSXVnQixRQUFRLEdBQUcsSUFBSTNuQixFQUFFLENBQUNxTixJQUFQLENBQVksVUFBWixDQUFmO0VBQ0FzYSxRQUFRLENBQUNwWSxXQUFULENBQXFCLENBQXJCLEVBQXdCLENBQXhCLEVBekNpRixDQXlDcEQ7O0VBQzdCb1ksUUFBUSxDQUFDdmYsT0FBVCxHQUFtQixHQUFuQjtFQUNBdWYsUUFBUSxDQUFDdGYsT0FBVCxHQUFtQixHQUFuQjtFQUNBc2YsUUFBUSxDQUFDMWdCLEtBQVQsR0FBaUJBLEtBQWpCO0VBQ0EwZ0IsUUFBUSxDQUFDNWdCLE1BQVQsR0FBa0JBLE1BQWxCO0VBRUEsSUFBSXlJLEtBQUssR0FBR21ZLFFBQVEsQ0FBQ2xZLFlBQVQsQ0FBc0J6UCxFQUFFLENBQUNLLEtBQXpCLENBQVo7RUFDQW1QLEtBQUssQ0FBQ3pNLE1BQU4sR0FBZTBrQixJQUFmO0VBQ0FqWSxLQUFLLENBQUNFLFFBQU4sR0FBaUJmLElBQUksQ0FBQ3lJLEtBQUwsQ0FBV3JRLE1BQU0sR0FBRyxJQUFwQixDQUFqQjtFQUNBeUksS0FBSyxDQUFDSSxlQUFOLEdBQXdCNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUFqRDtFQUNBTixLQUFLLENBQUNnRSxhQUFOLEdBQXNCeFQsRUFBRSxDQUFDSyxLQUFILENBQVNvVCxhQUFULENBQXVCM0QsTUFBN0M7RUFDQU4sS0FBSyxDQUFDa2EsUUFBTixHQUFpQjFwQixFQUFFLENBQUNLLEtBQUgsQ0FBU3NwQixRQUFULENBQWtCQyxJQUFuQztFQUNBakMsUUFBUSxDQUFDNVgsS0FBVCxHQUFpQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFqQjtFQUVBLElBQUlDLE9BQU8sR0FBRzJYLFFBQVEsQ0FBQ2xZLFlBQVQsQ0FBc0J6UCxFQUFFLENBQUNpUSxZQUF6QixDQUFkO0VBQ0FELE9BQU8sQ0FBQ0QsS0FBUixHQUFnQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsR0FBbEIsQ0FBaEI7RUFDQUMsT0FBTyxDQUFDL0ksS0FBUixHQUFnQixDQUFoQjtFQUNBMGdCLFFBQVEsQ0FBQzFZLE1BQVQsR0FBa0I3SCxHQUFsQixDQTFEaUYsQ0E0RGpGOztFQUNBQSxHQUFHLENBQUN6QyxFQUFKLENBQU8zRSxFQUFFLENBQUNxTixJQUFILENBQVFDLFNBQVIsQ0FBa0JzYSxXQUF6QixFQUFzQyxVQUFTcGEsS0FBVCxFQUFnQjtJQUNsREEsS0FBSyxDQUFDQyxlQUFOO0lBQ0FyRyxHQUFHLENBQUNlLEtBQUosR0FBWSxJQUFaO0VBQ0gsQ0FIRDtFQUlBZixHQUFHLENBQUN6QyxFQUFKLENBQU8zRSxFQUFFLENBQUNxTixJQUFILENBQVFDLFNBQVIsQ0FBa0JDLFNBQXpCLEVBQW9DLFVBQVNDLEtBQVQsRUFBZ0I7SUFDaERBLEtBQUssQ0FBQ0MsZUFBTjtJQUNBckcsR0FBRyxDQUFDZSxLQUFKLEdBQVksQ0FBWjtJQUNBLElBQUl1ZixRQUFKLEVBQWNBLFFBQVE7RUFDekIsQ0FKRDtFQUtBdGdCLEdBQUcsQ0FBQ3pDLEVBQUosQ0FBTzNFLEVBQUUsQ0FBQ3FOLElBQUgsQ0FBUUMsU0FBUixDQUFrQnVhLFlBQXpCLEVBQXVDLFVBQVNyYSxLQUFULEVBQWdCO0lBQ25EcEcsR0FBRyxDQUFDZSxLQUFKLEdBQVksQ0FBWjtFQUNILENBRkQ7RUFJQSxPQUFPZixHQUFQO0FBQ0gsQ0Ezd0dMLFlBOHdHSXlpQixzQkE5d0dKLEdBOHdHNEIsZ0NBQVNDLFNBQVQsRUFBb0JyQyxJQUFwQixFQUEwQmpmLENBQTFCLEVBQTZCZCxDQUE3QixFQUFnQ1QsS0FBaEMsRUFBdUNGLE1BQXZDLEVBQStDMmdCLFFBQS9DLEVBQXlEO0VBQzdFLElBQUk3bEIsSUFBSSxHQUFHLElBQVg7RUFDQSxJQUFJdUYsR0FBRyxHQUFHLElBQUlwSCxFQUFFLENBQUNxTixJQUFQLENBQVksU0FBU29hLElBQXJCLENBQVY7RUFDQXJnQixHQUFHLENBQUM0SCxjQUFKLENBQW1CaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFRN0wsS0FBUixFQUFlRixNQUFmLENBQW5CO0VBQ0FLLEdBQUcsQ0FBQ21JLFdBQUosQ0FBZ0IvRyxDQUFoQixFQUFtQmQsQ0FBbkI7RUFDQU4sR0FBRyxDQUFDZ0IsT0FBSixHQUFjLEdBQWQ7RUFDQWhCLEdBQUcsQ0FBQ2lCLE9BQUosR0FBYyxHQUFkLENBTjZFLENBUTdFOztFQUNBLElBQUlpSSxNQUFNLEdBQUdsSixHQUFHLENBQUNxSSxZQUFKLENBQWlCelAsRUFBRSxDQUFDTyxNQUFwQixDQUFiO0VBQ0ErUCxNQUFNLENBQUM2RCxRQUFQLEdBQWtCblUsRUFBRSxDQUFDTyxNQUFILENBQVU2VCxRQUFWLENBQW1CQyxNQUFyQyxDQVY2RSxDQVk3RTs7RUFDQXJVLEVBQUUsQ0FBQ2dKLFNBQUgsQ0FBYUMsSUFBYixDQUFrQjZnQixTQUFsQixFQUE2QjlwQixFQUFFLENBQUMrSSxXQUFoQyxFQUE2QyxVQUFTdkQsR0FBVCxFQUFjc0QsV0FBZCxFQUEyQjtJQUNwRSxJQUFJdEQsR0FBSixFQUFTO01BQ0x2RSxPQUFPLENBQUNDLElBQVIsQ0FBYSxXQUFiLEVBQTBCNG9CLFNBQTFCLEVBREssQ0FFTDs7TUFDQWpvQixJQUFJLENBQUNrb0IscUJBQUwsQ0FBMkIzaUIsR0FBM0IsRUFBZ0NxZ0IsSUFBaEMsRUFBc0N4Z0IsS0FBdEMsRUFBNkNGLE1BQTdDOztNQUNBO0lBQ0g7O0lBQ0R1SixNQUFNLENBQUN4SCxXQUFQLEdBQXFCQSxXQUFyQjtFQUNILENBUkQsRUFiNkUsQ0F1QjdFOztFQUNBLElBQUk4RCxNQUFNLEdBQUd4RixHQUFHLENBQUNxSSxZQUFKLENBQWlCelAsRUFBRSxDQUFDNk0sTUFBcEIsQ0FBYjtFQUNBRCxNQUFNLENBQUNFLFVBQVAsR0FBb0I5TSxFQUFFLENBQUM2TSxNQUFILENBQVVFLFVBQVYsQ0FBcUJDLEtBQXpDO0VBQ0FKLE1BQU0sQ0FBQ0ssUUFBUCxHQUFrQixHQUFsQjtFQUNBTCxNQUFNLENBQUNNLFNBQVAsR0FBbUIsSUFBbkIsQ0EzQjZFLENBNkI3RTs7RUFDQTlGLEdBQUcsQ0FBQ3pDLEVBQUosQ0FBTzNFLEVBQUUsQ0FBQ3FOLElBQUgsQ0FBUUMsU0FBUixDQUFrQkMsU0FBekIsRUFBb0MsVUFBU0MsS0FBVCxFQUFnQjtJQUNoREEsS0FBSyxDQUFDQyxlQUFOO0lBQ0EsSUFBSWlhLFFBQUosRUFBY0EsUUFBUTtFQUN6QixDQUhEO0VBS0EsT0FBT3RnQixHQUFQO0FBQ0gsQ0FsekdMLFlBcXpHSTJpQixxQkFyekdKLEdBcXpHMkIsK0JBQVMzaUIsR0FBVCxFQUFjcWdCLElBQWQsRUFBb0J4Z0IsS0FBcEIsRUFBMkJGLE1BQTNCLEVBQW1DO0VBQ3REO0VBQ0EsSUFBSWlqQixRQUFRLEdBQUc1aUIsR0FBRyxDQUFDcUksWUFBSixDQUFpQnpQLEVBQUUsQ0FBQ2tULFFBQXBCLENBQWYsQ0FGc0QsQ0FJdEQ7O0VBQ0EsSUFBSU4sT0FBSjs7RUFDQSxJQUFJNlUsSUFBSSxDQUFDaGdCLE9BQUwsQ0FBYSxJQUFiLEtBQXNCLENBQTFCLEVBQTZCO0lBQ3pCbUwsT0FBTyxHQUFHNVMsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEdBQWpCLENBQVYsQ0FEeUIsQ0FDUztFQUNyQyxDQUZELE1BRU8sSUFBSTBYLElBQUksQ0FBQ2hnQixPQUFMLENBQWEsSUFBYixLQUFzQixDQUF0QixJQUEyQmdnQixJQUFJLENBQUNoZ0IsT0FBTCxDQUFhLElBQWIsS0FBc0IsQ0FBckQsRUFBd0Q7SUFDM0RtTCxPQUFPLEdBQUc1UyxFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEdBQWIsRUFBa0IsRUFBbEIsQ0FBVixDQUQyRCxDQUN6QjtFQUNyQyxDQUZNLE1BRUEsSUFBSTBYLElBQUksQ0FBQ2hnQixPQUFMLENBQWEsSUFBYixLQUFzQixDQUExQixFQUE2QjtJQUNoQ21MLE9BQU8sR0FBRzVTLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixFQUFuQixDQUFWLENBRGdDLENBQ0c7RUFDdEMsQ0FGTSxNQUVBO0lBQ0g2QyxPQUFPLEdBQUc1UyxFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakIsQ0FBVixDQURHLENBQzhCO0VBQ3BDOztFQUVEaWEsUUFBUSxDQUFDN1csU0FBVCxHQUFxQlAsT0FBckI7RUFDQW9YLFFBQVEsQ0FBQzVXLFNBQVQsQ0FBbUIsQ0FBQ25NLEtBQUQsR0FBTyxDQUExQixFQUE2QixDQUFDRixNQUFELEdBQVEsQ0FBckMsRUFBd0NFLEtBQXhDLEVBQStDRixNQUEvQyxFQUF1RCxDQUF2RDtFQUNBaWpCLFFBQVEsQ0FBQzNXLElBQVQ7RUFDQTJXLFFBQVEsQ0FBQzdPLFdBQVQsR0FBdUJuYixFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsRUFBd0IsRUFBeEIsQ0FBdkI7RUFDQWlhLFFBQVEsQ0FBQzVPLFNBQVQsR0FBcUIsQ0FBckI7RUFDQTRPLFFBQVEsQ0FBQzVXLFNBQVQsQ0FBbUIsQ0FBQ25NLEtBQUQsR0FBTyxDQUExQixFQUE2QixDQUFDRixNQUFELEdBQVEsQ0FBckMsRUFBd0NFLEtBQXhDLEVBQStDRixNQUEvQyxFQUF1RCxDQUF2RDtFQUNBaWpCLFFBQVEsQ0FBQzNPLE1BQVQsR0F0QnNELENBd0J0RDs7RUFDQSxJQUFJNE8sU0FBUyxHQUFHLElBQUlqcUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLE9BQVosQ0FBaEI7RUFDQSxJQUFJbUMsS0FBSyxHQUFHeWEsU0FBUyxDQUFDeGEsWUFBVixDQUF1QnpQLEVBQUUsQ0FBQ0ssS0FBMUIsQ0FBWjtFQUNBbVAsS0FBSyxDQUFDek0sTUFBTixHQUFlMGtCLElBQWY7RUFDQWpZLEtBQUssQ0FBQ0UsUUFBTixHQUFpQmYsSUFBSSxDQUFDeUksS0FBTCxDQUFXclEsTUFBTSxHQUFHLEdBQXBCLENBQWpCO0VBQ0F5SSxLQUFLLENBQUNJLGVBQU4sR0FBd0I1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQWpEO0VBQ0FtYSxTQUFTLENBQUNsYSxLQUFWLEdBQWtCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWxCO0VBQ0FrYSxTQUFTLENBQUNoYixNQUFWLEdBQW1CN0gsR0FBbkI7QUFDSCxDQXIxR0wsWUF3MUdJOGlCLGdCQXgxR0osR0F3MUdzQiwwQkFBU3RELFdBQVQsRUFBc0JwZSxDQUF0QixFQUF5QmQsQ0FBekIsRUFBNEJULEtBQTVCLEVBQW1DRixNQUFuQyxFQUEyQztFQUN6RCxJQUFJOGYsU0FBUyxHQUFHLElBQUk3bUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFdBQVosQ0FBaEI7RUFDQXdaLFNBQVMsQ0FBQzdYLGNBQVYsQ0FBeUJoUCxFQUFFLENBQUM4UyxJQUFILENBQVE3TCxLQUFSLEVBQWVGLE1BQWYsQ0FBekI7RUFDQThmLFNBQVMsQ0FBQ3RYLFdBQVYsQ0FBc0IvRyxDQUF0QixFQUF5QmQsQ0FBekI7RUFDQW1mLFNBQVMsQ0FBQ3plLE9BQVYsR0FBb0IsR0FBcEI7RUFDQXllLFNBQVMsQ0FBQ3hlLE9BQVYsR0FBb0IsR0FBcEI7RUFDQXdlLFNBQVMsQ0FBQ3RmLElBQVYsR0FBaUIsZUFBakIsQ0FOeUQsQ0FRekQ7O0VBQ0EsSUFBSXlMLE1BQU0sR0FBRyxJQUFJaFQsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFNBQVosQ0FBYjtFQUNBMkYsTUFBTSxDQUFDekQsV0FBUCxDQUFtQixDQUFuQixFQUFzQixDQUF0QjtFQUNBeUQsTUFBTSxDQUFDNUssT0FBUCxHQUFpQixHQUFqQjtFQUNBNEssTUFBTSxDQUFDM0ssT0FBUCxHQUFpQixHQUFqQjtFQUVBLElBQUl5ZSxFQUFFLEdBQUc5VCxNQUFNLENBQUN2RCxZQUFQLENBQW9CelAsRUFBRSxDQUFDa1QsUUFBdkIsQ0FBVDtFQUNBNFQsRUFBRSxDQUFDM1QsU0FBSCxHQUFlblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCLEVBQXFCLEdBQXJCLENBQWY7RUFDQStXLEVBQUUsQ0FBQzFULFNBQUgsQ0FBYSxDQUFDbk0sS0FBRCxHQUFPLENBQXBCLEVBQXVCLENBQUNGLE1BQUQsR0FBUSxDQUEvQixFQUFrQ0UsS0FBbEMsRUFBeUNGLE1BQXpDLEVBQWlELENBQWpEO0VBQ0ErZixFQUFFLENBQUN6VCxJQUFIO0VBQ0F5VCxFQUFFLENBQUMzTCxXQUFILEdBQWlCbmIsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxFQUFkLEVBQWtCLEVBQWxCLEVBQXNCLEdBQXRCLENBQWpCO0VBQ0ErVyxFQUFFLENBQUMxTCxTQUFILEdBQWUsQ0FBZjtFQUNBMEwsRUFBRSxDQUFDMVQsU0FBSCxDQUFhLENBQUNuTSxLQUFELEdBQU8sQ0FBcEIsRUFBdUIsQ0FBQ0YsTUFBRCxHQUFRLENBQS9CLEVBQWtDRSxLQUFsQyxFQUF5Q0YsTUFBekMsRUFBaUQsQ0FBakQ7RUFDQStmLEVBQUUsQ0FBQ3pMLE1BQUg7RUFDQXJJLE1BQU0sQ0FBQy9ELE1BQVAsR0FBZ0I0WCxTQUFoQixDQXRCeUQsQ0F3QnpEOztFQUNBLElBQUlzRCxlQUFlLEdBQUcsSUFBSW5xQixFQUFFLENBQUNxTixJQUFQLENBQVksYUFBWixDQUF0QjtFQUNBOGMsZUFBZSxDQUFDNWEsV0FBaEIsQ0FBNEIsQ0FBNUIsRUFBK0IsQ0FBL0I7RUFDQTRhLGVBQWUsQ0FBQy9oQixPQUFoQixHQUEwQixHQUExQjtFQUNBK2hCLGVBQWUsQ0FBQzloQixPQUFoQixHQUEwQixHQUExQjtFQUNBOGhCLGVBQWUsQ0FBQ2xqQixLQUFoQixHQUF3QkEsS0FBSyxHQUFHLEVBQWhDO0VBQ0FrakIsZUFBZSxDQUFDcGpCLE1BQWhCLEdBQXlCQSxNQUF6QjtFQUVBLElBQUl5SSxLQUFLLEdBQUcyYSxlQUFlLENBQUMxYSxZQUFoQixDQUE2QnpQLEVBQUUsQ0FBQ0ssS0FBaEMsQ0FBWjtFQUNBbVAsS0FBSyxDQUFDek0sTUFBTixHQUFlNmpCLFdBQWY7RUFDQXBYLEtBQUssQ0FBQ0UsUUFBTixHQUFpQmYsSUFBSSxDQUFDeUksS0FBTCxDQUFXclEsTUFBTSxHQUFHLEdBQXBCLENBQWpCO0VBQ0F5SSxLQUFLLENBQUNJLGVBQU4sR0FBd0I1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQWpEO0VBQ0FOLEtBQUssQ0FBQ2dFLGFBQU4sR0FBc0J4VCxFQUFFLENBQUNLLEtBQUgsQ0FBU29ULGFBQVQsQ0FBdUIzRCxNQUE3QztFQUNBcWEsZUFBZSxDQUFDcGEsS0FBaEIsR0FBd0IvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBeEI7RUFDQW9hLGVBQWUsQ0FBQ2xiLE1BQWhCLEdBQXlCNFgsU0FBekI7RUFFQSxPQUFPQSxTQUFQO0FBQ0gsQ0FqNEdMLFlBbzRHSXVELG1CQXA0R0osR0FvNEd5Qiw2QkFBUzNDLElBQVQsRUFBZTFYLEtBQWYsRUFBc0J2SCxDQUF0QixFQUF5QmtmLFFBQXpCLEVBQW1DemdCLEtBQW5DLEVBQTBDRixNQUExQyxFQUFrRDtFQUNuRUUsS0FBSyxHQUFHQSxLQUFLLElBQUksR0FBakI7RUFDQUYsTUFBTSxHQUFHQSxNQUFNLElBQUksRUFBbkI7RUFFQSxJQUFJSyxHQUFHLEdBQUcsSUFBSXBILEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxTQUFTb2EsSUFBckIsQ0FBVjtFQUNBcmdCLEdBQUcsQ0FBQzRILGNBQUosQ0FBbUJoUCxFQUFFLENBQUM4UyxJQUFILENBQVE3TCxLQUFSLEVBQWVGLE1BQWYsQ0FBbkI7RUFDQUssR0FBRyxDQUFDbUksV0FBSixDQUFnQi9HLENBQWhCLEVBQW1CLENBQW5CLEVBTm1FLENBUW5FOztFQUNBLElBQUlzZSxFQUFFLEdBQUcxZixHQUFHLENBQUNxSSxZQUFKLENBQWlCelAsRUFBRSxDQUFDa1QsUUFBcEIsQ0FBVDtFQUNBNFQsRUFBRSxDQUFDM1QsU0FBSCxHQUFlcEQsS0FBZjtFQUNBK1csRUFBRSxDQUFDMVQsU0FBSCxDQUFhLENBQUNuTSxLQUFELEdBQU8sQ0FBcEIsRUFBdUIsQ0FBQ0YsTUFBRCxHQUFRLENBQS9CLEVBQWtDRSxLQUFsQyxFQUF5Q0YsTUFBekMsRUFBaUQsQ0FBakQ7RUFDQStmLEVBQUUsQ0FBQ3pULElBQUgsR0FabUUsQ0FjbkU7O0VBQ0EsSUFBSTdELEtBQUssR0FBR3BJLEdBQUcsQ0FBQ3FJLFlBQUosQ0FBaUJ6UCxFQUFFLENBQUNLLEtBQXBCLENBQVo7RUFDQW1QLEtBQUssQ0FBQ3pNLE1BQU4sR0FBZTBrQixJQUFmO0VBQ0FqWSxLQUFLLENBQUNFLFFBQU4sR0FBaUIsRUFBakI7RUFDQUYsS0FBSyxDQUFDSSxlQUFOLEdBQXdCNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUFqRDtFQUNBTixLQUFLLENBQUNnRSxhQUFOLEdBQXNCeFQsRUFBRSxDQUFDSyxLQUFILENBQVNvVCxhQUFULENBQXVCM0QsTUFBN0M7RUFDQTFJLEdBQUcsQ0FBQzJJLEtBQUosR0FBWS9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFaLENBcEJtRSxDQXNCbkU7O0VBQ0EzSSxHQUFHLENBQUN6QyxFQUFKLENBQU8zRSxFQUFFLENBQUNxTixJQUFILENBQVFDLFNBQVIsQ0FBa0JzYSxXQUF6QixFQUFzQyxVQUFTcGEsS0FBVCxFQUFnQjtJQUNsREEsS0FBSyxDQUFDQyxlQUFOO0lBQ0FyRyxHQUFHLENBQUNlLEtBQUosR0FBWSxJQUFaO0VBQ0gsQ0FIRDtFQUlBZixHQUFHLENBQUN6QyxFQUFKLENBQU8zRSxFQUFFLENBQUNxTixJQUFILENBQVFDLFNBQVIsQ0FBa0JDLFNBQXpCLEVBQW9DLFVBQVNDLEtBQVQsRUFBZ0I7SUFDaERBLEtBQUssQ0FBQ0MsZUFBTjtJQUNBckcsR0FBRyxDQUFDZSxLQUFKLEdBQVksQ0FBWjtJQUNBLElBQUl1ZixRQUFKLEVBQWNBLFFBQVE7RUFDekIsQ0FKRDtFQUtBdGdCLEdBQUcsQ0FBQ3pDLEVBQUosQ0FBTzNFLEVBQUUsQ0FBQ3FOLElBQUgsQ0FBUUMsU0FBUixDQUFrQnVhLFlBQXpCLEVBQXVDLFVBQVNyYSxLQUFULEVBQWdCO0lBQ25EcEcsR0FBRyxDQUFDZSxLQUFKLEdBQVksQ0FBWjtFQUNILENBRkQ7RUFJQSxPQUFPZixHQUFQO0FBQ0gsQ0F6NkdMLFlBNDZHSWtmLGVBNTZHSixHQTQ2R3FCLHlCQUFTdkMsU0FBVCxFQUFvQnJoQixPQUFwQixFQUE2QjtFQUMxQyxJQUFJMmYsT0FBTyxHQUFHMEIsU0FBUyxDQUFDN2QsY0FBVixDQUF5QixVQUF6QixDQUFkO0VBQ0EsSUFBSW1jLE9BQUosRUFBYUEsT0FBTyxDQUFDaFUsT0FBUjtFQUViZ1UsT0FBTyxHQUFHLElBQUlyaUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFVBQVosQ0FBVjtFQUNBZ1YsT0FBTyxDQUFDM2EsQ0FBUixHQUFZLEdBQVo7RUFFQSxJQUFJb2YsRUFBRSxHQUFHekUsT0FBTyxDQUFDNVMsWUFBUixDQUFxQnpQLEVBQUUsQ0FBQ2tULFFBQXhCLENBQVQ7RUFDQTRULEVBQUUsQ0FBQzNULFNBQUgsR0FBZW5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsR0FBbEIsQ0FBZjtFQUNBK1csRUFBRSxDQUFDMVQsU0FBSCxDQUFhLENBQUMsR0FBZCxFQUFtQixDQUFDLEVBQXBCLEVBQXdCLEdBQXhCLEVBQTZCLEVBQTdCLEVBQWlDLENBQWpDO0VBQ0EwVCxFQUFFLENBQUN6VCxJQUFIO0VBRUEsSUFBSTdELEtBQUssR0FBRzZTLE9BQU8sQ0FBQzVTLFlBQVIsQ0FBcUJ6UCxFQUFFLENBQUNLLEtBQXhCLENBQVo7RUFDQW1QLEtBQUssQ0FBQ3pNLE1BQU4sR0FBZUwsT0FBZjtFQUNBOE0sS0FBSyxDQUFDRSxRQUFOLEdBQWlCLEVBQWpCO0VBQ0FGLEtBQUssQ0FBQ0ksZUFBTixHQUF3QjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBakQ7RUFDQXVTLE9BQU8sQ0FBQ3RTLEtBQVIsR0FBZ0IvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsQ0FBbkIsQ0FBaEI7RUFDQXNTLE9BQU8sQ0FBQ3BULE1BQVIsR0FBaUI4VSxTQUFqQjtFQUVBLEtBQUs5ZSxZQUFMLENBQWtCLFlBQVc7SUFDekIsSUFBSW9kLE9BQU8sSUFBSUEsT0FBTyxDQUFDNWdCLE9BQXZCLEVBQWdDNGdCLE9BQU8sQ0FBQ2hVLE9BQVI7RUFDbkMsQ0FGRCxFQUVHLENBRkg7QUFHSCxDQWw4R0wsWUF1OEdJb1kscUJBdjhHSixHQXU4RzJCLCtCQUFTMWdCLFVBQVQsRUFBcUIwRyxVQUFyQixFQUFpQzBFLFVBQWpDLEVBQTZDO0VBQ2hFLElBQUl0UCxJQUFJLEdBQUcsSUFBWCxDQURnRSxDQUloRTs7RUFDQSxJQUFJd29CLFNBQVMsR0FBR3RrQixVQUFVLENBQUNHLGNBQVgsQ0FBMEIsa0JBQTFCLENBQWhCO0VBQ0EsSUFBSW1rQixTQUFKLEVBQWVBLFNBQVMsQ0FBQ2hjLE9BQVYsR0FOaUQsQ0FRaEU7O0VBQ0EsSUFBSTNILE1BQU0sR0FBRyxLQUFLdkQsSUFBTCxDQUFVQyxZQUFWLENBQXVCcEQsRUFBRSxDQUFDMkcsTUFBMUIsS0FBcUMzRyxFQUFFLENBQUM0RyxJQUFILENBQVEsUUFBUixFQUFrQnhELFlBQWxCLENBQStCcEQsRUFBRSxDQUFDMkcsTUFBbEMsQ0FBbEQ7RUFDQSxJQUFJRSxZQUFZLEdBQUdILE1BQU0sR0FBR0EsTUFBTSxDQUFDSSxnQkFBUCxDQUF3QkMsTUFBM0IsR0FBb0MsR0FBN0Q7RUFDQSxJQUFJQyxXQUFXLEdBQUdOLE1BQU0sR0FBR0EsTUFBTSxDQUFDSSxnQkFBUCxDQUF3QkcsS0FBM0IsR0FBbUMsSUFBM0QsQ0FYZ0UsQ0FhaEU7O0VBQ0EsSUFBSXFqQixNQUFNLEdBQUcsSUFBSXRxQixFQUFFLENBQUNxTixJQUFQLENBQVksa0JBQVosQ0FBYjtFQUNBaWQsTUFBTSxDQUFDdGIsY0FBUCxDQUFzQmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUTlMLFdBQVIsRUFBcUJILFlBQXJCLENBQXRCO0VBQ0F5akIsTUFBTSxDQUFDL2EsV0FBUCxDQUFtQixDQUFuQixFQUFzQixDQUF0QjtFQUNBK2EsTUFBTSxDQUFDN1osTUFBUCxHQUFnQixJQUFoQjtFQUNBNlosTUFBTSxDQUFDcmIsTUFBUCxHQUFnQmxKLFVBQWhCLENBbEJnRSxDQW9CaEU7O0VBQ0EsSUFBSXdrQixJQUFJLEdBQUcsSUFBSXZxQixFQUFFLENBQUNxTixJQUFQLENBQVksTUFBWixDQUFYO0VBQ0FrZCxJQUFJLENBQUN2YixjQUFMLENBQW9CaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFROUwsV0FBUixFQUFxQkgsWUFBckIsQ0FBcEI7RUFDQSxJQUFJMmpCLEtBQUssR0FBR0QsSUFBSSxDQUFDOWEsWUFBTCxDQUFrQnpQLEVBQUUsQ0FBQ2tULFFBQXJCLENBQVo7RUFDQXNYLEtBQUssQ0FBQ3JYLFNBQU4sR0FBa0JuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxDQUFmLEVBQWtCLEdBQWxCLENBQWxCO0VBQ0F5YSxLQUFLLENBQUN2UCxJQUFOLENBQVcsQ0FBQ2pVLFdBQUQsR0FBYSxDQUF4QixFQUEyQixDQUFDSCxZQUFELEdBQWMsQ0FBekMsRUFBNENHLFdBQTVDLEVBQXlESCxZQUF6RDtFQUNBMmpCLEtBQUssQ0FBQ25YLElBQU47RUFDQWtYLElBQUksQ0FBQ3RiLE1BQUwsR0FBY3FiLE1BQWQsQ0EzQmdFLENBNkJoRTs7RUFDQUMsSUFBSSxDQUFDNWxCLEVBQUwsQ0FBUTNFLEVBQUUsQ0FBQ3FOLElBQUgsQ0FBUUMsU0FBUixDQUFrQkMsU0FBMUIsRUFBcUMsVUFBU0MsS0FBVCxFQUFnQjtJQUNqREEsS0FBSyxDQUFDQyxlQUFOO0lBQ0E2YyxNQUFNLENBQUNqYyxPQUFQO0VBQ0gsQ0FIRCxFQTlCZ0UsQ0FtQ2hFOztFQUNBLElBQUlvYyxXQUFXLEdBQUcsR0FBbEIsQ0FwQ2dFLENBb0N4Qzs7RUFDeEIsSUFBSUMsWUFBWSxHQUFHLEdBQW5CLENBckNnRSxDQXFDdkM7RUFFekI7O0VBQ0EsSUFBSUMsUUFBUSxHQUFHLElBQUkzcUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFVBQVosQ0FBZjtFQUNBc2QsUUFBUSxDQUFDM2IsY0FBVCxDQUF3QmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUTJYLFdBQVIsRUFBcUJDLFlBQXJCLENBQXhCO0VBRUEsSUFBSUUsR0FBRyxHQUFHRCxRQUFRLENBQUNsYixZQUFULENBQXNCelAsRUFBRSxDQUFDa1QsUUFBekIsQ0FBVixDQTNDZ0UsQ0E0Q2hFOztFQUNBMFgsR0FBRyxDQUFDelgsU0FBSixHQUFnQm5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsRUFBbEIsQ0FBaEI7RUFDQTZhLEdBQUcsQ0FBQ3hYLFNBQUosQ0FBYyxDQUFDcVgsV0FBRCxHQUFhLENBQWIsR0FBaUIsQ0FBL0IsRUFBa0MsQ0FBQ0MsWUFBRCxHQUFjLENBQWQsR0FBa0IsQ0FBcEQsRUFBdURELFdBQXZELEVBQW9FQyxZQUFwRSxFQUFrRixFQUFsRjtFQUNBRSxHQUFHLENBQUN2WCxJQUFKLEdBL0NnRSxDQWdEaEU7O0VBQ0F1WCxHQUFHLENBQUN6WCxTQUFKLEdBQWdCblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCLEVBQXFCLEdBQXJCLENBQWhCO0VBQ0E2YSxHQUFHLENBQUN4WCxTQUFKLENBQWMsQ0FBQ3FYLFdBQUQsR0FBYSxDQUEzQixFQUE4QixDQUFDQyxZQUFELEdBQWMsQ0FBNUMsRUFBK0NELFdBQS9DLEVBQTREQyxZQUE1RCxFQUEwRSxFQUExRTtFQUNBRSxHQUFHLENBQUN2WCxJQUFKLEdBbkRnRSxDQW9EaEU7O0VBQ0F1WCxHQUFHLENBQUN6UCxXQUFKLEdBQWtCbmIsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEVBQW5CLEVBQXVCLEdBQXZCLENBQWxCO0VBQ0E2YSxHQUFHLENBQUN4UCxTQUFKLEdBQWdCLENBQWhCO0VBQ0F3UCxHQUFHLENBQUN4WCxTQUFKLENBQWMsQ0FBQ3FYLFdBQUQsR0FBYSxDQUEzQixFQUE4QixDQUFDQyxZQUFELEdBQWMsQ0FBNUMsRUFBK0NELFdBQS9DLEVBQTREQyxZQUE1RCxFQUEwRSxFQUExRTtFQUNBRSxHQUFHLENBQUN2UCxNQUFKO0VBQ0FzUCxRQUFRLENBQUMxYixNQUFULEdBQWtCcWIsTUFBbEIsQ0F6RGdFLENBMkRoRTs7RUFDQSxJQUFJTyxTQUFTLEdBQUcsSUFBSTdxQixFQUFFLENBQUNxTixJQUFQLENBQVksV0FBWixDQUFoQjtFQUNBd2QsU0FBUyxDQUFDbmpCLENBQVYsR0FBY2dqQixZQUFZLEdBQUMsQ0FBYixHQUFpQixFQUEvQjtFQUVBLElBQUl2QyxHQUFHLEdBQUcwQyxTQUFTLENBQUNwYixZQUFWLENBQXVCelAsRUFBRSxDQUFDa1QsUUFBMUIsQ0FBVjtFQUNBaVYsR0FBRyxDQUFDaFYsU0FBSixHQUFnQm5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixDQUFuQixDQUFoQixDQWhFZ0UsQ0FnRXhCOztFQUN4Q29ZLEdBQUcsQ0FBQy9VLFNBQUosQ0FBYyxDQUFDcVgsV0FBRCxHQUFhLENBQTNCLEVBQThCLENBQUMsRUFBL0IsRUFBbUNBLFdBQW5DLEVBQWdELEVBQWhELEVBQW9ELENBQUMsRUFBRCxFQUFLLEVBQUwsRUFBUyxDQUFULEVBQVksQ0FBWixDQUFwRDtFQUNBdEMsR0FBRyxDQUFDOVUsSUFBSjtFQUNBd1gsU0FBUyxDQUFDNWIsTUFBVixHQUFtQnFiLE1BQW5CLENBbkVnRSxDQXFFaEU7O0VBQ0EsSUFBSWpiLFNBQVMsR0FBRyxJQUFJclAsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLE9BQVosQ0FBaEI7RUFDQWdDLFNBQVMsQ0FBQzNILENBQVYsR0FBY2dqQixZQUFZLEdBQUMsQ0FBYixHQUFpQixFQUEvQjtFQUNBcmIsU0FBUyxDQUFDakgsT0FBVixHQUFvQixHQUFwQjtFQUNBaUgsU0FBUyxDQUFDaEgsT0FBVixHQUFvQixHQUFwQjtFQUNBLElBQUl5aUIsR0FBRyxHQUFHemIsU0FBUyxDQUFDSSxZQUFWLENBQXVCelAsRUFBRSxDQUFDSyxLQUExQixDQUFWO0VBQ0F5cUIsR0FBRyxDQUFDL25CLE1BQUosR0FBYSxNQUFiO0VBQ0ErbkIsR0FBRyxDQUFDcGIsUUFBSixHQUFlLEVBQWY7RUFDQW9iLEdBQUcsQ0FBQ2xiLGVBQUosR0FBc0I1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQS9DO0VBQ0FULFNBQVMsQ0FBQ1UsS0FBVixHQUFrQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFsQjtFQUVBLElBQUkrRCxZQUFZLEdBQUd6RSxTQUFTLENBQUNJLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUNpUSxZQUExQixDQUFuQjtFQUNBNkQsWUFBWSxDQUFDL0QsS0FBYixHQUFxQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsRUFBZCxFQUFrQixDQUFsQixDQUFyQjtFQUNBK0QsWUFBWSxDQUFDN00sS0FBYixHQUFxQixDQUFyQjtFQUNBb0ksU0FBUyxDQUFDSixNQUFWLEdBQW1CcWIsTUFBbkIsQ0FuRmdFLENBcUZoRTs7RUFDQSxJQUFJUyxRQUFRLEdBQUcsSUFBSS9xQixFQUFFLENBQUNxTixJQUFQLENBQVksVUFBWixDQUFmO0VBQ0EwZCxRQUFRLENBQUMvYixjQUFULENBQXdCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFRLEVBQVIsRUFBWSxFQUFaLENBQXhCO0VBQ0FpWSxRQUFRLENBQUN2aUIsQ0FBVCxHQUFhaWlCLFdBQVcsR0FBQyxDQUFaLEdBQWdCLEVBQTdCO0VBQ0FNLFFBQVEsQ0FBQ3JqQixDQUFULEdBQWFnakIsWUFBWSxHQUFDLENBQWIsR0FBaUIsRUFBOUI7RUFFQSxJQUFJTSxHQUFHLEdBQUdELFFBQVEsQ0FBQ3RiLFlBQVQsQ0FBc0J6UCxFQUFFLENBQUNrVCxRQUF6QixDQUFWO0VBQ0E4WCxHQUFHLENBQUM3WCxTQUFKLEdBQWdCblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixFQUFsQixDQUFoQjtFQUNBaWIsR0FBRyxDQUFDNUYsTUFBSixDQUFXLENBQVgsRUFBYyxDQUFkLEVBQWlCLEVBQWpCO0VBQ0E0RixHQUFHLENBQUMzWCxJQUFKO0VBQ0EwWCxRQUFRLENBQUM5YixNQUFULEdBQWtCcWIsTUFBbEI7RUFFQSxJQUFJVyxNQUFNLEdBQUcsSUFBSWpyQixFQUFFLENBQUNxTixJQUFQLENBQVksR0FBWixDQUFiO0VBQ0E0ZCxNQUFNLENBQUM3aUIsT0FBUCxHQUFpQixHQUFqQjtFQUNBNmlCLE1BQU0sQ0FBQzVpQixPQUFQLEdBQWlCLEdBQWpCO0VBQ0EsSUFBSTZpQixVQUFVLEdBQUdELE1BQU0sQ0FBQ3hiLFlBQVAsQ0FBb0J6UCxFQUFFLENBQUNLLEtBQXZCLENBQWpCO0VBQ0E2cUIsVUFBVSxDQUFDbm9CLE1BQVgsR0FBb0IsR0FBcEI7RUFDQW1vQixVQUFVLENBQUN4YixRQUFYLEdBQXNCLEVBQXRCO0VBQ0F3YixVQUFVLENBQUN0YixlQUFYLEdBQTZCNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUF0RDtFQUNBbWIsTUFBTSxDQUFDbGIsS0FBUCxHQUFlL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWY7RUFDQWtiLE1BQU0sQ0FBQ2hjLE1BQVAsR0FBZ0I4YixRQUFoQjtFQUVBQSxRQUFRLENBQUNwbUIsRUFBVCxDQUFZM0UsRUFBRSxDQUFDcU4sSUFBSCxDQUFRQyxTQUFSLENBQWtCQyxTQUE5QixFQUF5QyxZQUFXO0lBQ2hEK2MsTUFBTSxDQUFDamMsT0FBUDtFQUNILENBRkQsRUEzR2dFLENBK0doRTs7RUFDQSxJQUFJOGMsVUFBVSxHQUFHLElBQUluckIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFlBQVosQ0FBakI7RUFDQThkLFVBQVUsQ0FBQ3pqQixDQUFYLEdBQWVnakIsWUFBWSxHQUFDLENBQWIsR0FBaUIsRUFBaEM7RUFDQSxJQUFJVSxJQUFJLEdBQUdELFVBQVUsQ0FBQzFiLFlBQVgsQ0FBd0J6UCxFQUFFLENBQUNrVCxRQUEzQixDQUFYO0VBQ0FrWSxJQUFJLENBQUNqWSxTQUFMLEdBQWlCblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCLEVBQXFCLEdBQXJCLENBQWpCO0VBQ0FxYixJQUFJLENBQUNoWSxTQUFMLENBQWUsQ0FBQyxFQUFoQixFQUFvQixDQUFDLEVBQXJCLEVBQXlCLEdBQXpCLEVBQThCLEVBQTlCLEVBQWtDLEVBQWxDO0VBQ0FnWSxJQUFJLENBQUMvWCxJQUFMO0VBQ0E4WCxVQUFVLENBQUNsYyxNQUFYLEdBQW9CcWIsTUFBcEI7RUFFQSxJQUFJZSxZQUFZLEdBQUcsSUFBSXJyQixFQUFFLENBQUNxTixJQUFQLENBQVksVUFBWixDQUFuQjtFQUNBZ2UsWUFBWSxDQUFDM2pCLENBQWIsR0FBaUJnakIsWUFBWSxHQUFDLENBQWIsR0FBaUIsRUFBbEM7RUFDQVcsWUFBWSxDQUFDampCLE9BQWIsR0FBdUIsR0FBdkI7RUFDQWlqQixZQUFZLENBQUNoakIsT0FBYixHQUF1QixHQUF2QjtFQUNBLElBQUlpakIsR0FBRyxHQUFHRCxZQUFZLENBQUM1YixZQUFiLENBQTBCelAsRUFBRSxDQUFDSyxLQUE3QixDQUFWO0VBQ0FpckIsR0FBRyxDQUFDdm9CLE1BQUosR0FBYTBKLFVBQVUsQ0FBQy9CLFNBQVgsSUFBd0IsS0FBckM7RUFDQTRnQixHQUFHLENBQUM1YixRQUFKLEdBQWUsRUFBZjtFQUNBNGIsR0FBRyxDQUFDMWIsZUFBSixHQUFzQjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBL0M7RUFDQXViLFlBQVksQ0FBQ3RiLEtBQWIsR0FBcUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBckI7RUFDQXNiLFlBQVksQ0FBQ3BjLE1BQWIsR0FBc0JxYixNQUF0QixDQWpJZ0UsQ0FtSWhFOztFQUNBLElBQUlpQixTQUFTLEdBQUcsSUFBSXZyQixFQUFFLENBQUNxTixJQUFQLENBQVksV0FBWixDQUFoQjtFQUNBa2UsU0FBUyxDQUFDL2lCLENBQVYsR0FBYyxDQUFDaWlCLFdBQUQsR0FBYSxDQUFiLEdBQWlCLEVBQS9CO0VBQ0FjLFNBQVMsQ0FBQzdqQixDQUFWLEdBQWNnakIsWUFBWSxHQUFDLENBQWIsR0FBaUIsR0FBL0I7RUFDQWEsU0FBUyxDQUFDbmpCLE9BQVYsR0FBb0IsQ0FBcEI7RUFDQW1qQixTQUFTLENBQUNsakIsT0FBVixHQUFvQixHQUFwQjtFQUNBLElBQUltakIsR0FBRyxHQUFHRCxTQUFTLENBQUM5YixZQUFWLENBQXVCelAsRUFBRSxDQUFDSyxLQUExQixDQUFWO0VBQ0FtckIsR0FBRyxDQUFDem9CLE1BQUosR0FBYSxPQUFiO0VBQ0F5b0IsR0FBRyxDQUFDOWIsUUFBSixHQUFlLEVBQWYsQ0EzSWdFLENBMkk1Qzs7RUFDcEI2YixTQUFTLENBQUN4YixLQUFWLEdBQWtCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWxCO0VBQ0F3YixTQUFTLENBQUN0YyxNQUFWLEdBQW1CcWIsTUFBbkI7RUFFQSxJQUFJbUIsYUFBYSxHQUFHO0lBQUVDLEtBQUssRUFBRTtFQUFULENBQXBCOztFQUNBLElBQUlDLFlBQVksR0FBRyxLQUFLQyxtQkFBTCxDQUNmLFlBRGUsRUFFZixFQUZlLEVBRVhsQixZQUFZLEdBQUMsQ0FBYixHQUFpQixHQUZOLEVBR2ZELFdBQVcsR0FBRyxFQUhDLEVBR0csRUFISCxFQUdRO0VBQ3ZCLFdBSmUsRUFLZmdCLGFBTGUsQ0FBbkI7O0VBT0FFLFlBQVksQ0FBQzFjLE1BQWIsR0FBc0JxYixNQUF0QixDQXZKZ0UsQ0F5SmhFOztFQUNBLElBQUl1QixRQUFRLEdBQUcsSUFBSTdyQixFQUFFLENBQUNxTixJQUFQLENBQVksVUFBWixDQUFmO0VBQ0F3ZSxRQUFRLENBQUNyakIsQ0FBVCxHQUFhLENBQUNpaUIsV0FBRCxHQUFhLENBQWIsR0FBaUIsRUFBOUI7RUFDQW9CLFFBQVEsQ0FBQ25rQixDQUFULEdBQWFnakIsWUFBWSxHQUFDLENBQWIsR0FBaUIsR0FBOUI7RUFDQW1CLFFBQVEsQ0FBQ3pqQixPQUFULEdBQW1CLENBQW5CO0VBQ0F5akIsUUFBUSxDQUFDeGpCLE9BQVQsR0FBbUIsR0FBbkI7RUFDQSxJQUFJeWpCLEdBQUcsR0FBR0QsUUFBUSxDQUFDcGMsWUFBVCxDQUFzQnpQLEVBQUUsQ0FBQ0ssS0FBekIsQ0FBVjtFQUNBeXJCLEdBQUcsQ0FBQy9vQixNQUFKLEdBQWEsT0FBYjtFQUNBK29CLEdBQUcsQ0FBQ3BjLFFBQUosR0FBZSxFQUFmLENBaktnRSxDQWlLNUM7O0VBQ3BCbWMsUUFBUSxDQUFDOWIsS0FBVCxHQUFpQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFqQjtFQUNBOGIsUUFBUSxDQUFDNWMsTUFBVCxHQUFrQnFiLE1BQWxCO0VBRUEsSUFBSXlCLFlBQVksR0FBRztJQUFFTCxLQUFLLEVBQUU7RUFBVCxDQUFuQjs7RUFDQSxJQUFJTSxXQUFXLEdBQUcsS0FBS0osbUJBQUwsQ0FDZCxVQURjLEVBRWQsRUFGYyxFQUVWbEIsWUFBWSxHQUFDLENBQWIsR0FBaUIsR0FGUCxFQUdkRCxXQUFXLEdBQUcsRUFIQSxFQUdJLEVBSEosRUFHUztFQUN2QixVQUpjLEVBS2RzQixZQUxjLENBQWxCOztFQU9BQyxXQUFXLENBQUMvYyxNQUFaLEdBQXFCcWIsTUFBckIsQ0E3S2dFLENBK0toRTs7RUFDQSxJQUFJakksT0FBTyxHQUFHLElBQUlyaUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLEtBQVosQ0FBZDtFQUNBZ1YsT0FBTyxDQUFDM2EsQ0FBUixHQUFZLENBQUNnakIsWUFBRCxHQUFjLENBQWQsR0FBa0IsR0FBOUI7RUFDQXJJLE9BQU8sQ0FBQ2phLE9BQVIsR0FBa0IsR0FBbEI7RUFDQWlhLE9BQU8sQ0FBQ2hhLE9BQVIsR0FBa0IsR0FBbEI7RUFDQSxJQUFJaWEsUUFBUSxHQUFHRCxPQUFPLENBQUM1UyxZQUFSLENBQXFCelAsRUFBRSxDQUFDSyxLQUF4QixDQUFmO0VBQ0FpaUIsUUFBUSxDQUFDdmYsTUFBVCxHQUFrQixzQkFBbEI7RUFDQXVmLFFBQVEsQ0FBQzVTLFFBQVQsR0FBb0IsRUFBcEIsQ0F0TGdFLENBc0x2Qzs7RUFDekI0UyxRQUFRLENBQUMxUyxlQUFULEdBQTJCNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUFwRDtFQUNBdVMsT0FBTyxDQUFDdFMsS0FBUixHQUFnQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFoQjtFQUNBc1MsT0FBTyxDQUFDcFQsTUFBUixHQUFpQnFiLE1BQWpCLENBekxnRSxDQTJMaEU7O0VBQ0EsSUFBSXhPLElBQUksR0FBRyxDQUFDNE8sWUFBRCxHQUFjLENBQWQsR0FBa0IsRUFBN0IsQ0E1TGdFLENBOExoRTs7RUFDQSxJQUFJck8sU0FBUyxHQUFHLEtBQUs0UCxtQkFBTCxDQUNaLElBRFksRUFFWmpzQixFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakIsQ0FGWSxFQUdaLENBQUMsRUFIVyxFQUdQK0wsSUFITyxFQUlaLEdBSlksRUFJUCxFQUpPLEVBSUY7RUFDVixZQUFXO0lBQ1B3TyxNQUFNLENBQUNqYyxPQUFQO0VBQ0gsQ0FQVyxDQUFoQjs7RUFTQWdPLFNBQVMsQ0FBQ3BOLE1BQVYsR0FBbUJxYixNQUFuQixDQXhNZ0UsQ0EwTWhFOztFQUNBLElBQUk5RCxTQUFTLEdBQUcsS0FBS3lGLG1CQUFMLENBQ1osTUFEWSxFQUVaanNCLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixDQUFuQixDQUZZLEVBRVk7RUFDeEIsRUFIWSxFQUdSK0wsSUFIUSxFQUlaLEdBSlksRUFJUCxFQUpPLEVBSUY7RUFDVixZQUFXO0lBQ1A7SUFDQSxJQUFJb1EsU0FBUyxHQUFHNUIsTUFBTSxDQUFDcGtCLGNBQVAsQ0FBc0IsV0FBdEIsQ0FBaEI7SUFDQSxJQUFJaW1CLFFBQVEsR0FBRzdCLE1BQU0sQ0FBQ3BrQixjQUFQLENBQXNCLFVBQXRCLENBQWY7SUFDQSxJQUFJa21CLFdBQVcsR0FBR0YsU0FBUyxHQUFHQSxTQUFTLENBQUM5b0IsWUFBVixDQUF1QnBELEVBQUUsQ0FBQ29tQixPQUExQixDQUFILEdBQXdDLElBQW5FO0lBQ0EsSUFBSWlHLFVBQVUsR0FBR0YsUUFBUSxHQUFHQSxRQUFRLENBQUMvb0IsWUFBVCxDQUFzQnBELEVBQUUsQ0FBQ29tQixPQUF6QixDQUFILEdBQXVDLElBQWhFO0lBRUEsSUFBSWxhLFFBQVEsR0FBSWtnQixXQUFXLElBQUlBLFdBQVcsQ0FBQ3JwQixNQUE1QixJQUF1QzBKLFVBQVUsQ0FBQy9CLFNBQWxELElBQStELE1BQTlFO0lBQ0EsSUFBSTRoQixRQUFRLEdBQUlELFVBQVUsSUFBSUEsVUFBVSxDQUFDdHBCLE1BQTFCLElBQXFDLEVBQXBELENBUk8sQ0FVUDs7SUFDQSxJQUFJL0IsUUFBUSxHQUFHRCxNQUFNLENBQUNDLFFBQXRCOztJQUNBLElBQUlBLFFBQUosRUFBYztNQUNWQSxRQUFRLENBQUN1ckIsY0FBVCxHQUEwQjtRQUN0QnJnQixRQUFRLEVBQUVBLFFBRFk7UUFFdEJvZ0IsUUFBUSxFQUFFQSxRQUZZO1FBR3RCN2YsVUFBVSxFQUFFQTtNQUhVLENBQTFCO0lBS0g7O0lBR0Q2ZCxNQUFNLENBQUNqYyxPQUFQLEdBckJPLENBdUJQOztJQUNBLElBQUlzWSxLQUFLLEdBQUc1Z0IsVUFBVSxDQUFDRyxjQUFYLENBQTBCLGVBQTFCLEtBQThDSCxVQUExRDtJQUNBLElBQUk0Z0IsS0FBSyxDQUFDdFksT0FBVixFQUFtQnNZLEtBQUssQ0FBQ3RZLE9BQU4sR0F6QlosQ0EyQlA7O0lBQ0F4TSxJQUFJLENBQUMycUIsV0FBTCxDQUFpQi9mLFVBQWpCLEVBQTZCMEUsVUFBN0I7RUFDSCxDQWxDVyxDQUFoQjs7RUFvQ0FxVixTQUFTLENBQUN2WCxNQUFWLEdBQW1CcWIsTUFBbkI7QUFDSCxDQXZySEwsWUEwckhJc0IsbUJBMXJISixHQTBySHlCLDZCQUFTaEYsV0FBVCxFQUFzQnBlLENBQXRCLEVBQXlCZCxDQUF6QixFQUE0QlQsS0FBNUIsRUFBbUNGLE1BQW5DLEVBQTJDZixRQUEzQyxFQUFxRHltQixPQUFyRCxFQUE4RDtFQUMvRSxJQUFJNUYsU0FBUyxHQUFHLElBQUk3bUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZckgsUUFBWixDQUFoQjtFQUNBNmdCLFNBQVMsQ0FBQzdYLGNBQVYsQ0FBeUJoUCxFQUFFLENBQUM4UyxJQUFILENBQVE3TCxLQUFSLEVBQWVGLE1BQWYsQ0FBekI7RUFDQThmLFNBQVMsQ0FBQ3RYLFdBQVYsQ0FBc0IvRyxDQUF0QixFQUF5QmQsQ0FBekI7RUFDQW1mLFNBQVMsQ0FBQ3plLE9BQVYsR0FBb0IsQ0FBcEI7RUFDQXllLFNBQVMsQ0FBQ3hlLE9BQVYsR0FBb0IsR0FBcEIsQ0FMK0UsQ0FPL0U7O0VBQ0EsSUFBSXllLEVBQUUsR0FBR0QsU0FBUyxDQUFDcFgsWUFBVixDQUF1QnpQLEVBQUUsQ0FBQ2tULFFBQTFCLENBQVQ7RUFDQTRULEVBQUUsQ0FBQzNULFNBQUgsR0FBZW5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixHQUFyQixDQUFmO0VBQ0ErVyxFQUFFLENBQUMxVCxTQUFILENBQWEsQ0FBYixFQUFnQixDQUFDck0sTUFBRCxHQUFRLENBQXhCLEVBQTJCRSxLQUEzQixFQUFrQ0YsTUFBbEMsRUFBMEMsQ0FBMUM7RUFDQStmLEVBQUUsQ0FBQ3pULElBQUg7RUFDQXlULEVBQUUsQ0FBQzNMLFdBQUgsR0FBaUJuYixFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsRUFBbkIsRUFBdUIsR0FBdkIsQ0FBakI7RUFDQStXLEVBQUUsQ0FBQzFMLFNBQUgsR0FBZSxDQUFmO0VBQ0EwTCxFQUFFLENBQUMxVCxTQUFILENBQWEsQ0FBYixFQUFnQixDQUFDck0sTUFBRCxHQUFRLENBQXhCLEVBQTJCRSxLQUEzQixFQUFrQ0YsTUFBbEMsRUFBMEMsQ0FBMUM7RUFDQStmLEVBQUUsQ0FBQ3pMLE1BQUgsR0FmK0UsQ0FpQi9FOztFQUNBLElBQUk4SyxPQUFPLEdBQUdVLFNBQVMsQ0FBQ3BYLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUNvbUIsT0FBMUIsQ0FBZDtFQUNBRCxPQUFPLENBQUNwakIsTUFBUixHQUFpQixFQUFqQjtFQUNBb2pCLE9BQU8sQ0FBQ1MsV0FBUixHQUFzQkEsV0FBdEI7RUFDQVQsT0FBTyxDQUFDelcsUUFBUixHQUFtQixFQUFuQjtFQUNBeVcsT0FBTyxDQUFDWSxTQUFSLEdBQW9CL21CLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFwQjtFQUNBb1csT0FBTyxDQUFDYSxtQkFBUixHQUE4QixFQUE5QjtFQUNBYixPQUFPLENBQUNjLG9CQUFSLEdBQStCam5CLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUEvQjtFQUNBb1csT0FBTyxDQUFDZSxTQUFSLEdBQW9CLEVBQXBCO0VBQ0FmLE9BQU8sQ0FBQ2dCLFNBQVIsR0FBb0JubkIsRUFBRSxDQUFDb21CLE9BQUgsQ0FBV2dCLFNBQVgsQ0FBcUJzRixHQUF6QztFQUNBdkcsT0FBTyxDQUFDbUIsVUFBUixHQUFxQnRuQixFQUFFLENBQUNvbUIsT0FBSCxDQUFXbUIsa0JBQVgsQ0FBOEJDLElBQW5EO0VBQ0FyQixPQUFPLENBQUN4VyxVQUFSLEdBQXFCNUksTUFBTSxHQUFHLEVBQTlCLENBNUIrRSxDQThCL0U7O0VBQ0FvZixPQUFPLENBQUNoakIsSUFBUixDQUFhd0IsRUFBYixDQUFnQixjQUFoQixFQUFnQyxVQUFTZ29CLE9BQVQsRUFBa0I7SUFDOUMsSUFBSUYsT0FBSixFQUFhO01BQ1RBLE9BQU8sQ0FBQ2YsS0FBUixHQUFnQmlCLE9BQU8sQ0FBQzVwQixNQUF4QjtJQUNIO0VBQ0osQ0FKRCxFQS9CK0UsQ0FxQy9FOztFQUNBb2pCLE9BQU8sQ0FBQ2hqQixJQUFSLENBQWF3QixFQUFiLENBQWdCLG1CQUFoQixFQUFxQyxZQUFXO0lBQzVDbWlCLEVBQUUsQ0FBQ3hELEtBQUg7SUFDQXdELEVBQUUsQ0FBQzNULFNBQUgsR0FBZW5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixHQUFyQixDQUFmO0lBQ0ErVyxFQUFFLENBQUMxVCxTQUFILENBQWEsQ0FBYixFQUFnQixDQUFDck0sTUFBRCxHQUFRLENBQXhCLEVBQTJCRSxLQUEzQixFQUFrQ0YsTUFBbEMsRUFBMEMsQ0FBMUM7SUFDQStmLEVBQUUsQ0FBQ3pULElBQUg7SUFDQXlULEVBQUUsQ0FBQzNMLFdBQUgsR0FBaUJuYixFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsRUFBbkIsRUFBdUIsR0FBdkIsQ0FBakI7SUFDQStXLEVBQUUsQ0FBQzFMLFNBQUgsR0FBZSxDQUFmO0lBQ0EwTCxFQUFFLENBQUMxVCxTQUFILENBQWEsQ0FBYixFQUFnQixDQUFDck0sTUFBRCxHQUFRLENBQXhCLEVBQTJCRSxLQUEzQixFQUFrQ0YsTUFBbEMsRUFBMEMsQ0FBMUM7SUFDQStmLEVBQUUsQ0FBQ3pMLE1BQUg7RUFDSCxDQVREO0VBV0E4SyxPQUFPLENBQUNoakIsSUFBUixDQUFhd0IsRUFBYixDQUFnQixpQkFBaEIsRUFBbUMsWUFBVztJQUMxQ21pQixFQUFFLENBQUN4RCxLQUFIO0lBQ0F3RCxFQUFFLENBQUMzVCxTQUFILEdBQWVuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakIsRUFBcUIsR0FBckIsQ0FBZjtJQUNBK1csRUFBRSxDQUFDMVQsU0FBSCxDQUFhLENBQWIsRUFBZ0IsQ0FBQ3JNLE1BQUQsR0FBUSxDQUF4QixFQUEyQkUsS0FBM0IsRUFBa0NGLE1BQWxDLEVBQTBDLENBQTFDO0lBQ0ErZixFQUFFLENBQUN6VCxJQUFIO0lBQ0F5VCxFQUFFLENBQUMzTCxXQUFILEdBQWlCbmIsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEVBQW5CLEVBQXVCLEdBQXZCLENBQWpCO0lBQ0ErVyxFQUFFLENBQUMxTCxTQUFILEdBQWUsQ0FBZjtJQUNBMEwsRUFBRSxDQUFDMVQsU0FBSCxDQUFhLENBQWIsRUFBZ0IsQ0FBQ3JNLE1BQUQsR0FBUSxDQUF4QixFQUEyQkUsS0FBM0IsRUFBa0NGLE1BQWxDLEVBQTBDLENBQTFDO0lBQ0ErZixFQUFFLENBQUN6TCxNQUFIO0VBQ0gsQ0FURDtFQVdBLE9BQU93TCxTQUFQO0FBQ0gsQ0F2dkhMLFlBMHZISStGLHVCQTF2SEosR0Ewdkg2QixpQ0FBU2hHLFdBQVQsRUFBc0JwZSxDQUF0QixFQUF5QmQsQ0FBekIsRUFBNEJULEtBQTVCLEVBQW1DRixNQUFuQyxFQUEyQ2YsUUFBM0MsRUFBcUR5bUIsT0FBckQsRUFBOEQ7RUFDbkYsSUFBSTVxQixJQUFJLEdBQUcsSUFBWDtFQUNBLElBQUlnbEIsU0FBUyxHQUFHLElBQUk3bUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZckgsUUFBWixDQUFoQjtFQUNBNmdCLFNBQVMsQ0FBQzdYLGNBQVYsQ0FBeUJoUCxFQUFFLENBQUM4UyxJQUFILENBQVE3TCxLQUFSLEVBQWVGLE1BQWYsQ0FBekI7RUFDQThmLFNBQVMsQ0FBQ3RYLFdBQVYsQ0FBc0IvRyxDQUF0QixFQUF5QmQsQ0FBekI7RUFDQW1mLFNBQVMsQ0FBQ3plLE9BQVYsR0FBb0IsR0FBcEI7RUFDQXllLFNBQVMsQ0FBQ3hlLE9BQVYsR0FBb0IsR0FBcEIsQ0FObUYsQ0FRbkY7O0VBQ0EsSUFBSXllLEVBQUUsR0FBR0QsU0FBUyxDQUFDcFgsWUFBVixDQUF1QnpQLEVBQUUsQ0FBQ2tULFFBQTFCLENBQVQ7RUFDQTRULEVBQUUsQ0FBQzNULFNBQUgsR0FBZW5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixHQUFyQixDQUFmO0VBQ0ErVyxFQUFFLENBQUMxVCxTQUFILENBQWEsQ0FBQ25NLEtBQUQsR0FBTyxDQUFwQixFQUF1QixDQUFDRixNQUFELEdBQVEsQ0FBL0IsRUFBa0NFLEtBQWxDLEVBQXlDRixNQUF6QyxFQUFpRCxDQUFqRDtFQUNBK2YsRUFBRSxDQUFDelQsSUFBSDtFQUNBeVQsRUFBRSxDQUFDM0wsV0FBSCxHQUFpQm5iLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixFQUFuQixFQUF1QixHQUF2QixDQUFqQjtFQUNBK1csRUFBRSxDQUFDMUwsU0FBSCxHQUFlLENBQWY7RUFDQTBMLEVBQUUsQ0FBQzFULFNBQUgsQ0FBYSxDQUFDbk0sS0FBRCxHQUFPLENBQXBCLEVBQXVCLENBQUNGLE1BQUQsR0FBUSxDQUEvQixFQUFrQ0UsS0FBbEMsRUFBeUNGLE1BQXpDLEVBQWlELENBQWpEO0VBQ0ErZixFQUFFLENBQUN6TCxNQUFILEdBaEJtRixDQWtCbkY7O0VBQ0EsSUFBSXNNLFFBQVEsR0FBRyxJQUFJM25CLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxNQUFaLENBQWY7RUFDQXNhLFFBQVEsQ0FBQ3ZmLE9BQVQsR0FBbUIsR0FBbkI7RUFDQXVmLFFBQVEsQ0FBQ3RmLE9BQVQsR0FBbUIsR0FBbkI7RUFDQXNmLFFBQVEsQ0FBQzFZLE1BQVQsR0FBa0I0WCxTQUFsQjtFQUVBLElBQUlyWCxLQUFLLEdBQUdtWSxRQUFRLENBQUNsWSxZQUFULENBQXNCelAsRUFBRSxDQUFDSyxLQUF6QixDQUFaO0VBQ0FtUCxLQUFLLENBQUN6TSxNQUFOLEdBQWU2akIsV0FBZjtFQUNBcFgsS0FBSyxDQUFDRSxRQUFOLEdBQWlCLEVBQWpCO0VBQ0FGLEtBQUssQ0FBQ0ksZUFBTixHQUF3QjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBakQ7RUFDQTZYLFFBQVEsQ0FBQzVYLEtBQVQsR0FBaUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBakIsQ0E1Qm1GLENBOEJuRjs7RUFDQThXLFNBQVMsQ0FBQ2xpQixFQUFWLENBQWEzRSxFQUFFLENBQUNxTixJQUFILENBQVFDLFNBQVIsQ0FBa0JDLFNBQS9CLEVBQTBDLFVBQVNDLEtBQVQsRUFBZ0I7SUFDdERBLEtBQUssQ0FBQ0MsZUFBTixHQURzRCxDQUd0RDs7SUFDQSxJQUFJeVksS0FBSyxHQUFHLEVBQVo7O0lBQ0EsSUFBSTtNQUNBLElBQUksT0FBT25sQixNQUFQLEtBQWtCLFdBQWxCLElBQWlDQSxNQUFNLENBQUM4ckIsTUFBNUMsRUFBb0Q7UUFDaEQzRyxLQUFLLEdBQUdubEIsTUFBTSxDQUFDOHJCLE1BQVAsQ0FBY2pHLFdBQWQsRUFBMkI2RixPQUFPLENBQUNmLEtBQVIsSUFBaUIsRUFBNUMsS0FBbUQsRUFBM0Q7TUFDSDtJQUNKLENBSkQsQ0FJRSxPQUFPL29CLENBQVAsRUFBVSxDQUNYOztJQUVELElBQUl1akIsS0FBSixFQUFXO01BQ1B1RyxPQUFPLENBQUNmLEtBQVIsR0FBZ0J4RixLQUFoQjtNQUNBMVcsS0FBSyxDQUFDek0sTUFBTixHQUFlbWpCLEtBQWY7TUFDQXlCLFFBQVEsQ0FBQzVYLEtBQVQsR0FBaUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBakI7SUFDSCxDQUpELE1BSU8sSUFBSTBjLE9BQU8sQ0FBQ2YsS0FBWixFQUFtQjtNQUN0QmxjLEtBQUssQ0FBQ3pNLE1BQU4sR0FBZTBwQixPQUFPLENBQUNmLEtBQXZCO01BQ0EvRCxRQUFRLENBQUM1WCxLQUFULEdBQWlCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWpCO0lBQ0gsQ0FITSxNQUdBO01BQ0hQLEtBQUssQ0FBQ3pNLE1BQU4sR0FBZTZqQixXQUFmO01BQ0FlLFFBQVEsQ0FBQzVYLEtBQVQsR0FBaUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBakI7SUFDSDtFQUNKLENBdkJEO0VBeUJBLE9BQU84VyxTQUFQO0FBQ0gsQ0FuekhMLFlBc3pISW9GLG1CQXR6SEosR0Fzekh5Qiw2QkFBU3hFLElBQVQsRUFBZTdVLE9BQWYsRUFBd0JwSyxDQUF4QixFQUEyQmQsQ0FBM0IsRUFBOEJULEtBQTlCLEVBQXFDRixNQUFyQyxFQUE2QzJnQixRQUE3QyxFQUF1RDtFQUN4RSxJQUFJdGdCLEdBQUcsR0FBRyxJQUFJcEgsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFNBQVNvYSxJQUFyQixDQUFWO0VBQ0FyZ0IsR0FBRyxDQUFDNEgsY0FBSixDQUFtQmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUTdMLEtBQVIsRUFBZUYsTUFBZixDQUFuQjtFQUNBSyxHQUFHLENBQUNtSSxXQUFKLENBQWdCL0csQ0FBaEIsRUFBbUJkLENBQW5CO0VBQ0FOLEdBQUcsQ0FBQ2dCLE9BQUosR0FBYyxHQUFkO0VBQ0FoQixHQUFHLENBQUNpQixPQUFKLEdBQWMsR0FBZCxDQUx3RSxDQU94RTs7RUFDQSxJQUFJeWUsRUFBRSxHQUFHMWYsR0FBRyxDQUFDcUksWUFBSixDQUFpQnpQLEVBQUUsQ0FBQ2tULFFBQXBCLENBQVQ7RUFDQTRULEVBQUUsQ0FBQzNULFNBQUgsR0FBZVAsT0FBZjtFQUNBa1UsRUFBRSxDQUFDMVQsU0FBSCxDQUFhLENBQUNuTSxLQUFELEdBQU8sQ0FBcEIsRUFBdUIsQ0FBQ0YsTUFBRCxHQUFRLENBQS9CLEVBQWtDRSxLQUFsQyxFQUF5Q0YsTUFBekMsRUFBaUQsQ0FBakQ7RUFDQStmLEVBQUUsQ0FBQ3pULElBQUgsR0FYd0UsQ0FheEU7O0VBQ0F5VCxFQUFFLENBQUMzTCxXQUFILEdBQWlCbmIsRUFBRSxDQUFDK1AsS0FBSCxDQUNicEIsSUFBSSxDQUFDMlEsR0FBTCxDQUFTLEdBQVQsRUFBYzFNLE9BQU8sQ0FBQ3FGLENBQVIsR0FBWSxFQUExQixDQURhLEVBRWJ0SixJQUFJLENBQUMyUSxHQUFMLENBQVMsR0FBVCxFQUFjMU0sT0FBTyxDQUFDNlcsQ0FBUixHQUFZLEVBQTFCLENBRmEsRUFHYjlhLElBQUksQ0FBQzJRLEdBQUwsQ0FBUyxHQUFULEVBQWMxTSxPQUFPLENBQUNyRyxDQUFSLEdBQVksRUFBMUIsQ0FIYSxDQUFqQjtFQUtBdWEsRUFBRSxDQUFDMUwsU0FBSCxHQUFlLENBQWY7RUFDQTBMLEVBQUUsQ0FBQzFULFNBQUgsQ0FBYSxDQUFDbk0sS0FBRCxHQUFPLENBQXBCLEVBQXVCLENBQUNGLE1BQUQsR0FBUSxDQUEvQixFQUFrQ0UsS0FBbEMsRUFBeUNGLE1BQXpDLEVBQWlELENBQWpEO0VBQ0ErZixFQUFFLENBQUN6TCxNQUFILEdBckJ3RSxDQXVCeEU7O0VBQ0EsSUFBSXNNLFFBQVEsR0FBRyxJQUFJM25CLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxNQUFaLENBQWY7RUFDQXNhLFFBQVEsQ0FBQ3ZmLE9BQVQsR0FBbUIsR0FBbkI7RUFDQXVmLFFBQVEsQ0FBQ3RmLE9BQVQsR0FBbUIsR0FBbkI7RUFDQSxJQUFJbUgsS0FBSyxHQUFHbVksUUFBUSxDQUFDbFksWUFBVCxDQUFzQnpQLEVBQUUsQ0FBQ0ssS0FBekIsQ0FBWjtFQUNBbVAsS0FBSyxDQUFDek0sTUFBTixHQUFlMGtCLElBQWY7RUFDQWpZLEtBQUssQ0FBQ0UsUUFBTixHQUFpQixFQUFqQjtFQUNBRixLQUFLLENBQUNJLGVBQU4sR0FBd0I1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQWpEO0VBQ0E2WCxRQUFRLENBQUM1WCxLQUFULEdBQWlCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWpCO0VBQ0E0WCxRQUFRLENBQUMxWSxNQUFULEdBQWtCN0gsR0FBbEIsQ0FoQ3dFLENBa0N4RTs7RUFDQUEsR0FBRyxDQUFDekMsRUFBSixDQUFPM0UsRUFBRSxDQUFDcU4sSUFBSCxDQUFRQyxTQUFSLENBQWtCc2EsV0FBekIsRUFBc0MsVUFBU3BhLEtBQVQsRUFBZ0I7SUFDbERBLEtBQUssQ0FBQ0MsZUFBTjtJQUNBckcsR0FBRyxDQUFDZSxLQUFKLEdBQVksSUFBWjtFQUNILENBSEQ7RUFJQWYsR0FBRyxDQUFDekMsRUFBSixDQUFPM0UsRUFBRSxDQUFDcU4sSUFBSCxDQUFRQyxTQUFSLENBQWtCQyxTQUF6QixFQUFvQyxVQUFTQyxLQUFULEVBQWdCO0lBQ2hEQSxLQUFLLENBQUNDLGVBQU47SUFDQXJHLEdBQUcsQ0FBQ2UsS0FBSixHQUFZLENBQVo7SUFDQSxJQUFJdWYsUUFBSixFQUFjQSxRQUFRO0VBQ3pCLENBSkQ7RUFLQXRnQixHQUFHLENBQUN6QyxFQUFKLENBQU8zRSxFQUFFLENBQUNxTixJQUFILENBQVFDLFNBQVIsQ0FBa0J1YSxZQUF6QixFQUF1QyxVQUFTcmEsS0FBVCxFQUFnQjtJQUNuRHBHLEdBQUcsQ0FBQ2UsS0FBSixHQUFZLENBQVo7RUFDSCxDQUZEO0VBSUEsT0FBT2YsR0FBUDtBQUNILENBdjJITCxZQTAySEkwbEIscUJBMTJISixHQTAySDJCLCtCQUFTbEcsV0FBVCxFQUFzQnBlLENBQXRCLEVBQXlCZCxDQUF6QixFQUE0QlQsS0FBNUIsRUFBbUNGLE1BQW5DLEVBQTJDZixRQUEzQyxFQUFxRDtFQUN4RSxJQUFJNmdCLFNBQVMsR0FBRyxJQUFJN21CLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWXJILFFBQVEsSUFBSSxnQkFBeEIsQ0FBaEI7RUFDQTZnQixTQUFTLENBQUM3WCxjQUFWLENBQXlCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFRN0wsS0FBUixFQUFlRixNQUFmLENBQXpCO0VBQ0E4ZixTQUFTLENBQUN0WCxXQUFWLENBQXNCL0csQ0FBdEIsRUFBeUJkLENBQXpCO0VBQ0FtZixTQUFTLENBQUN6ZSxPQUFWLEdBQW9CLEdBQXBCO0VBQ0F5ZSxTQUFTLENBQUN4ZSxPQUFWLEdBQW9CLEdBQXBCLENBTHdFLENBT3hFOztFQUNBLElBQUkySyxNQUFNLEdBQUcsSUFBSWhULEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxTQUFaLENBQWI7RUFDQTJGLE1BQU0sQ0FBQ3pELFdBQVAsQ0FBbUIsQ0FBbkIsRUFBc0IsQ0FBdEI7RUFDQXlELE1BQU0sQ0FBQzVLLE9BQVAsR0FBaUIsR0FBakI7RUFDQTRLLE1BQU0sQ0FBQzNLLE9BQVAsR0FBaUIsR0FBakI7RUFFQSxJQUFJeWUsRUFBRSxHQUFHOVQsTUFBTSxDQUFDdkQsWUFBUCxDQUFvQnpQLEVBQUUsQ0FBQ2tULFFBQXZCLENBQVQsQ0Fid0UsQ0FjeEU7O0VBQ0E0VCxFQUFFLENBQUMzVCxTQUFILEdBQWVuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakIsRUFBcUIsR0FBckIsQ0FBZjtFQUNBK1csRUFBRSxDQUFDMVQsU0FBSCxDQUFhLENBQUNuTSxLQUFELEdBQU8sQ0FBcEIsRUFBdUIsQ0FBQ0YsTUFBRCxHQUFRLENBQS9CLEVBQWtDRSxLQUFsQyxFQUF5Q0YsTUFBekMsRUFBaUQsQ0FBakQ7RUFDQStmLEVBQUUsQ0FBQ3pULElBQUgsR0FqQndFLENBa0J4RTs7RUFDQXlULEVBQUUsQ0FBQzNMLFdBQUgsR0FBaUJuYixFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsRUFBbkIsRUFBdUIsR0FBdkIsQ0FBakI7RUFDQStXLEVBQUUsQ0FBQzFMLFNBQUgsR0FBZSxDQUFmO0VBQ0EwTCxFQUFFLENBQUMxVCxTQUFILENBQWEsQ0FBQ25NLEtBQUQsR0FBTyxDQUFwQixFQUF1QixDQUFDRixNQUFELEdBQVEsQ0FBL0IsRUFBa0NFLEtBQWxDLEVBQXlDRixNQUF6QyxFQUFpRCxDQUFqRDtFQUNBK2YsRUFBRSxDQUFDekwsTUFBSCxHQXRCd0UsQ0F1QnhFOztFQUNBeUwsRUFBRSxDQUFDM0wsV0FBSCxHQUFpQm5iLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixHQUFqQixFQUFzQixHQUF0QixDQUFqQjtFQUNBK1csRUFBRSxDQUFDMUwsU0FBSCxHQUFlLENBQWY7RUFDQTBMLEVBQUUsQ0FBQzFULFNBQUgsQ0FBYSxDQUFDbk0sS0FBRCxHQUFPLENBQVAsR0FBVyxDQUF4QixFQUEyQixDQUFDRixNQUFELEdBQVEsQ0FBUixHQUFZLENBQXZDLEVBQTBDRSxLQUFLLEdBQUcsQ0FBbEQsRUFBcURGLE1BQU0sR0FBRyxDQUE5RCxFQUFpRSxDQUFqRTtFQUNBK2YsRUFBRSxDQUFDekwsTUFBSDtFQUNBckksTUFBTSxDQUFDL0QsTUFBUCxHQUFnQjRYLFNBQWhCLENBNUJ3RSxDQThCeEU7O0VBQ0EsSUFBSXNELGVBQWUsR0FBRyxJQUFJbnFCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxhQUFaLENBQXRCO0VBQ0E4YyxlQUFlLENBQUM1YSxXQUFoQixDQUE0QixDQUE1QixFQUErQixDQUEvQjtFQUNBNGEsZUFBZSxDQUFDL2hCLE9BQWhCLEdBQTBCLEdBQTFCO0VBQ0EraEIsZUFBZSxDQUFDOWhCLE9BQWhCLEdBQTBCLEdBQTFCO0VBQ0E4aEIsZUFBZSxDQUFDbGpCLEtBQWhCLEdBQXdCQSxLQUFLLEdBQUcsRUFBaEM7RUFDQWtqQixlQUFlLENBQUNwakIsTUFBaEIsR0FBeUJBLE1BQXpCO0VBRUEsSUFBSXlJLEtBQUssR0FBRzJhLGVBQWUsQ0FBQzFhLFlBQWhCLENBQTZCelAsRUFBRSxDQUFDSyxLQUFoQyxDQUFaO0VBQ0FtUCxLQUFLLENBQUN6TSxNQUFOLEdBQWU2akIsV0FBZjtFQUNBcFgsS0FBSyxDQUFDRSxRQUFOLEdBQWlCLEVBQWpCO0VBQ0FGLEtBQUssQ0FBQ0ksZUFBTixHQUF3QjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBakQ7RUFDQU4sS0FBSyxDQUFDZ0UsYUFBTixHQUFzQnhULEVBQUUsQ0FBQ0ssS0FBSCxDQUFTb1QsYUFBVCxDQUF1QjNELE1BQTdDO0VBQ0FxYSxlQUFlLENBQUNwYSxLQUFoQixHQUF3Qi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUF4QjtFQUNBb2EsZUFBZSxDQUFDbGIsTUFBaEIsR0FBeUI0WCxTQUF6QjtFQUVBLE9BQU9BLFNBQVA7QUFDSCxDQXo1SEwsWUE0NUhJa0csc0JBNTVISixHQTQ1SDRCLGdDQUFTdEYsSUFBVCxFQUFlN1UsT0FBZixFQUF3QjRXLFdBQXhCLEVBQXFDaGhCLENBQXJDLEVBQXdDZCxDQUF4QyxFQUEyQ1QsS0FBM0MsRUFBa0RGLE1BQWxELEVBQTBEMmdCLFFBQTFELEVBQW9FNkIsU0FBcEUsRUFBK0U7RUFDbkcsSUFBSW5pQixHQUFHLEdBQUcsSUFBSXBILEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxrQkFBa0JvYSxJQUE5QixDQUFWO0VBQ0FyZ0IsR0FBRyxDQUFDNEgsY0FBSixDQUFtQmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUTdMLEtBQVIsRUFBZUYsTUFBZixDQUFuQjtFQUNBSyxHQUFHLENBQUNtSSxXQUFKLENBQWdCL0csQ0FBaEIsRUFBbUJkLENBQW5CO0VBQ0FOLEdBQUcsQ0FBQ2dCLE9BQUosR0FBYyxHQUFkO0VBQ0FoQixHQUFHLENBQUNpQixPQUFKLEdBQWMsR0FBZCxDQUxtRyxDQU9uRzs7RUFDQSxJQUFJMkssTUFBTSxHQUFHLElBQUloVCxFQUFFLENBQUNxTixJQUFQLENBQVksUUFBWixDQUFiO0VBQ0EyRixNQUFNLENBQUN6RCxXQUFQLENBQW1CLENBQW5CLEVBQXNCLENBQXRCO0VBQ0F5RCxNQUFNLENBQUM1SyxPQUFQLEdBQWlCLEdBQWpCO0VBQ0E0SyxNQUFNLENBQUMzSyxPQUFQLEdBQWlCLEdBQWpCO0VBRUEsSUFBSXllLEVBQUUsR0FBRzlULE1BQU0sQ0FBQ3ZELFlBQVAsQ0FBb0J6UCxFQUFFLENBQUNrVCxRQUF2QixDQUFULENBYm1HLENBZW5HOztFQUNBNFQsRUFBRSxDQUFDM1QsU0FBSCxHQUFlUCxPQUFmO0VBQ0FrVSxFQUFFLENBQUMxVCxTQUFILENBQWEsQ0FBQ25NLEtBQUQsR0FBTyxDQUFwQixFQUF1QixDQUFDRixNQUFELEdBQVEsQ0FBL0IsRUFBa0NFLEtBQWxDLEVBQXlDRixNQUF6QyxFQUFpRCxDQUFqRDtFQUNBK2YsRUFBRSxDQUFDelQsSUFBSCxHQWxCbUcsQ0FvQm5HOztFQUNBeVQsRUFBRSxDQUFDM0wsV0FBSCxHQUFpQnFPLFdBQWpCO0VBQ0ExQyxFQUFFLENBQUMxTCxTQUFILEdBQWUsQ0FBZjtFQUNBMEwsRUFBRSxDQUFDMVQsU0FBSCxDQUFhLENBQUNuTSxLQUFELEdBQU8sQ0FBcEIsRUFBdUIsQ0FBQ0YsTUFBRCxHQUFRLENBQS9CLEVBQWtDRSxLQUFsQyxFQUF5Q0YsTUFBekMsRUFBaUQsQ0FBakQ7RUFDQStmLEVBQUUsQ0FBQ3pMLE1BQUgsR0F4Qm1HLENBMEJuRzs7RUFDQSxJQUFJa08sU0FBSixFQUFlO0lBQ1g7SUFDQXpDLEVBQUUsQ0FBQzNULFNBQUgsR0FBZW5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixFQUF3QixFQUF4QixDQUFmO0lBQ0ErVyxFQUFFLENBQUMxVCxTQUFILENBQWEsQ0FBQ25NLEtBQUQsR0FBTyxDQUFQLEdBQVcsQ0FBeEIsRUFBMkIsQ0FBM0IsRUFBOEJBLEtBQUssR0FBRyxDQUF0QyxFQUF5Q0YsTUFBTSxHQUFDLENBQVAsR0FBVyxDQUFwRCxFQUF1RCxDQUF2RDtJQUNBK2YsRUFBRSxDQUFDelQsSUFBSCxHQUpXLENBS1g7O0lBQ0F5VCxFQUFFLENBQUMzVCxTQUFILEdBQWVuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxDQUFmLEVBQWtCLEVBQWxCLENBQWY7SUFDQStXLEVBQUUsQ0FBQzFULFNBQUgsQ0FBYSxDQUFDbk0sS0FBRCxHQUFPLENBQVAsR0FBVyxDQUF4QixFQUEyQixDQUFDRixNQUFELEdBQVEsQ0FBUixHQUFZLENBQXZDLEVBQTBDRSxLQUFLLEdBQUcsQ0FBbEQsRUFBcURGLE1BQU0sR0FBQyxDQUE1RCxFQUErRCxDQUEvRDtJQUNBK2YsRUFBRSxDQUFDelQsSUFBSDtFQUNIOztFQUNETCxNQUFNLENBQUMvRCxNQUFQLEdBQWdCN0gsR0FBaEIsQ0FyQ21HLENBdUNuRzs7RUFDQSxJQUFJdWdCLFFBQVEsR0FBRyxJQUFJM25CLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxVQUFaLENBQWY7RUFDQXNhLFFBQVEsQ0FBQ3BZLFdBQVQsQ0FBcUIsQ0FBckIsRUFBd0IsQ0FBeEI7RUFDQW9ZLFFBQVEsQ0FBQ3ZmLE9BQVQsR0FBbUIsR0FBbkI7RUFDQXVmLFFBQVEsQ0FBQ3RmLE9BQVQsR0FBbUIsR0FBbkI7RUFDQXNmLFFBQVEsQ0FBQzFnQixLQUFULEdBQWlCQSxLQUFqQjtFQUNBMGdCLFFBQVEsQ0FBQzVnQixNQUFULEdBQWtCQSxNQUFsQjtFQUVBLElBQUl5SSxLQUFLLEdBQUdtWSxRQUFRLENBQUNsWSxZQUFULENBQXNCelAsRUFBRSxDQUFDSyxLQUF6QixDQUFaO0VBQ0FtUCxLQUFLLENBQUN6TSxNQUFOLEdBQWUwa0IsSUFBZjtFQUNBalksS0FBSyxDQUFDRSxRQUFOLEdBQWlCZixJQUFJLENBQUN5SSxLQUFMLENBQVdyUSxNQUFNLEdBQUcsR0FBcEIsQ0FBakI7RUFDQXlJLEtBQUssQ0FBQ0ksZUFBTixHQUF3QjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBakQ7RUFDQU4sS0FBSyxDQUFDZ0UsYUFBTixHQUFzQnhULEVBQUUsQ0FBQ0ssS0FBSCxDQUFTb1QsYUFBVCxDQUF1QjNELE1BQTdDO0VBQ0E2WCxRQUFRLENBQUM1WCxLQUFULEdBQWlCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWpCO0VBRUEsSUFBSUMsT0FBTyxHQUFHMlgsUUFBUSxDQUFDbFksWUFBVCxDQUFzQnpQLEVBQUUsQ0FBQ2lRLFlBQXpCLENBQWQ7RUFDQUQsT0FBTyxDQUFDRCxLQUFSLEdBQWdCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixHQUFsQixDQUFoQjtFQUNBQyxPQUFPLENBQUMvSSxLQUFSLEdBQWdCLENBQWhCO0VBQ0EwZ0IsUUFBUSxDQUFDMVksTUFBVCxHQUFrQjdILEdBQWxCLENBekRtRyxDQTJEbkc7O0VBQ0FBLEdBQUcsQ0FBQ3pDLEVBQUosQ0FBTzNFLEVBQUUsQ0FBQ3FOLElBQUgsQ0FBUUMsU0FBUixDQUFrQnNhLFdBQXpCLEVBQXNDLFVBQVNwYSxLQUFULEVBQWdCO0lBQ2xEQSxLQUFLLENBQUNDLGVBQU47SUFDQXJHLEdBQUcsQ0FBQ2UsS0FBSixHQUFZLElBQVo7RUFDSCxDQUhEO0VBSUFmLEdBQUcsQ0FBQ3pDLEVBQUosQ0FBTzNFLEVBQUUsQ0FBQ3FOLElBQUgsQ0FBUUMsU0FBUixDQUFrQkMsU0FBekIsRUFBb0MsVUFBU0MsS0FBVCxFQUFnQjtJQUNoREEsS0FBSyxDQUFDQyxlQUFOO0lBQ0FyRyxHQUFHLENBQUNlLEtBQUosR0FBWSxDQUFaO0lBQ0EsSUFBSXVmLFFBQUosRUFBY0EsUUFBUTtFQUN6QixDQUpEO0VBS0F0Z0IsR0FBRyxDQUFDekMsRUFBSixDQUFPM0UsRUFBRSxDQUFDcU4sSUFBSCxDQUFRQyxTQUFSLENBQWtCdWEsWUFBekIsRUFBdUMsVUFBU3JhLEtBQVQsRUFBZ0I7SUFDbkRwRyxHQUFHLENBQUNlLEtBQUosR0FBWSxDQUFaO0VBQ0gsQ0FGRDtFQUlBLE9BQU9mLEdBQVA7QUFDSCxDQXQrSEwsWUF5K0hJNGxCLGtCQXorSEosR0F5K0h3Qiw0QkFBU3BHLFdBQVQsRUFBc0JwZSxDQUF0QixFQUF5QmQsQ0FBekIsRUFBNEJULEtBQTVCLEVBQW1DRixNQUFuQyxFQUEyQ2YsUUFBM0MsRUFBcUQ7RUFDckUsSUFBSTZnQixTQUFTLEdBQUcsSUFBSTdtQixFQUFFLENBQUNxTixJQUFQLENBQVlySCxRQUFRLElBQUksYUFBeEIsQ0FBaEI7RUFDQTZnQixTQUFTLENBQUM3WCxjQUFWLENBQXlCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFRN0wsS0FBUixFQUFlRixNQUFmLENBQXpCO0VBQ0E4ZixTQUFTLENBQUN0WCxXQUFWLENBQXNCL0csQ0FBdEIsRUFBeUJkLENBQXpCO0VBQ0FtZixTQUFTLENBQUN6ZSxPQUFWLEdBQW9CLEdBQXBCO0VBQ0F5ZSxTQUFTLENBQUN4ZSxPQUFWLEdBQW9CLEdBQXBCLENBTHFFLENBT3JFOztFQUNBLElBQUkySyxNQUFNLEdBQUcsSUFBSWhULEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxTQUFaLENBQWI7RUFDQTJGLE1BQU0sQ0FBQ3pELFdBQVAsQ0FBbUIsQ0FBbkIsRUFBc0IsQ0FBdEI7RUFDQXlELE1BQU0sQ0FBQzVLLE9BQVAsR0FBaUIsR0FBakI7RUFDQTRLLE1BQU0sQ0FBQzNLLE9BQVAsR0FBaUIsR0FBakI7RUFFQSxJQUFJeWUsRUFBRSxHQUFHOVQsTUFBTSxDQUFDdkQsWUFBUCxDQUFvQnpQLEVBQUUsQ0FBQ2tULFFBQXZCLENBQVQ7RUFDQTRULEVBQUUsQ0FBQzNULFNBQUgsR0FBZW5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixHQUFyQixDQUFmO0VBQ0ErVyxFQUFFLENBQUMxVCxTQUFILENBQWEsQ0FBQ25NLEtBQUQsR0FBTyxDQUFwQixFQUF1QixDQUFDRixNQUFELEdBQVEsQ0FBL0IsRUFBa0NFLEtBQWxDLEVBQXlDRixNQUF6QyxFQUFpRCxDQUFqRDtFQUNBK2YsRUFBRSxDQUFDelQsSUFBSDtFQUNBeVQsRUFBRSxDQUFDM0wsV0FBSCxHQUFpQm5iLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsRUFBZCxFQUFrQixFQUFsQixFQUFzQixHQUF0QixDQUFqQjtFQUNBK1csRUFBRSxDQUFDMUwsU0FBSCxHQUFlLENBQWY7RUFDQTBMLEVBQUUsQ0FBQzFULFNBQUgsQ0FBYSxDQUFDbk0sS0FBRCxHQUFPLENBQXBCLEVBQXVCLENBQUNGLE1BQUQsR0FBUSxDQUEvQixFQUFrQ0UsS0FBbEMsRUFBeUNGLE1BQXpDLEVBQWlELENBQWpEO0VBQ0ErZixFQUFFLENBQUN6TCxNQUFIO0VBQ0FySSxNQUFNLENBQUMvRCxNQUFQLEdBQWdCNFgsU0FBaEIsQ0FyQnFFLENBdUJyRTs7RUFDQSxJQUFJc0QsZUFBZSxHQUFHLElBQUlucUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLGFBQVosQ0FBdEI7RUFDQThjLGVBQWUsQ0FBQzVhLFdBQWhCLENBQTRCLENBQTVCLEVBQStCLENBQS9CO0VBQ0E0YSxlQUFlLENBQUMvaEIsT0FBaEIsR0FBMEIsR0FBMUI7RUFDQStoQixlQUFlLENBQUM5aEIsT0FBaEIsR0FBMEIsR0FBMUI7RUFDQThoQixlQUFlLENBQUNsakIsS0FBaEIsR0FBd0JBLEtBQUssR0FBRyxFQUFoQztFQUNBa2pCLGVBQWUsQ0FBQ3BqQixNQUFoQixHQUF5QkEsTUFBekI7RUFFQSxJQUFJeUksS0FBSyxHQUFHMmEsZUFBZSxDQUFDMWEsWUFBaEIsQ0FBNkJ6UCxFQUFFLENBQUNLLEtBQWhDLENBQVo7RUFDQW1QLEtBQUssQ0FBQ3pNLE1BQU4sR0FBZTZqQixXQUFmO0VBQ0FwWCxLQUFLLENBQUNFLFFBQU4sR0FBaUJmLElBQUksQ0FBQ3lJLEtBQUwsQ0FBV3JRLE1BQU0sR0FBRyxHQUFwQixDQUFqQjtFQUNBeUksS0FBSyxDQUFDSSxlQUFOLEdBQXdCNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUFqRDtFQUNBTixLQUFLLENBQUNnRSxhQUFOLEdBQXNCeFQsRUFBRSxDQUFDSyxLQUFILENBQVNvVCxhQUFULENBQXVCM0QsTUFBN0M7RUFDQXFhLGVBQWUsQ0FBQ3BhLEtBQWhCLEdBQXdCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQXhCO0VBQ0FvYSxlQUFlLENBQUNsYixNQUFoQixHQUF5QjRYLFNBQXpCO0VBRUEsT0FBT0EsU0FBUDtBQUNILENBamhJTCxZQXNoSUlvRyxtQkF0aElKLEdBc2hJeUIsNkJBQVNDLFFBQVQsRUFBbUJ6Z0IsVUFBbkIsRUFBK0IwRSxVQUEvQixFQUEyQ3VXLFFBQTNDLEVBQXFEO0VBQ3RFLElBQUk3bEIsSUFBSSxHQUFHLElBQVgsQ0FEc0UsQ0FJdEU7O0VBQ0EsSUFBSTZFLE1BQU0sR0FBRyxLQUFLdkQsSUFBTCxDQUFVQyxZQUFWLENBQXVCcEQsRUFBRSxDQUFDMkcsTUFBMUIsS0FBcUMzRyxFQUFFLENBQUM0RyxJQUFILENBQVEsUUFBUixFQUFrQnhELFlBQWxCLENBQStCcEQsRUFBRSxDQUFDMkcsTUFBbEMsQ0FBbEQ7RUFDQSxJQUFJRSxZQUFZLEdBQUdILE1BQU0sR0FBR0EsTUFBTSxDQUFDSSxnQkFBUCxDQUF3QkMsTUFBM0IsR0FBb0MsR0FBN0Q7RUFDQSxJQUFJQyxXQUFXLEdBQUdOLE1BQU0sR0FBR0EsTUFBTSxDQUFDSSxnQkFBUCxDQUF3QkcsS0FBM0IsR0FBbUMsSUFBM0QsQ0FQc0UsQ0FTdEU7O0VBQ0EsSUFBSXFqQixNQUFNLEdBQUcsSUFBSXRxQixFQUFFLENBQUNxTixJQUFQLENBQVksZ0JBQVosQ0FBYjtFQUNBaWQsTUFBTSxDQUFDdGIsY0FBUCxDQUFzQmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUTlMLFdBQVIsRUFBcUJILFlBQXJCLENBQXRCO0VBQ0F5akIsTUFBTSxDQUFDL2EsV0FBUCxDQUFtQixDQUFuQixFQUFzQixDQUF0QjtFQUNBK2EsTUFBTSxDQUFDN1osTUFBUCxHQUFnQixJQUFoQjtFQUNBNlosTUFBTSxDQUFDcmIsTUFBUCxHQUFnQixLQUFLOUwsSUFBckIsQ0Fkc0UsQ0FnQnRFOztFQUNBLElBQUlvbkIsSUFBSSxHQUFHLElBQUl2cUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLE1BQVosQ0FBWDtFQUNBLElBQUltZCxLQUFLLEdBQUdELElBQUksQ0FBQzlhLFlBQUwsQ0FBa0J6UCxFQUFFLENBQUNrVCxRQUFyQixDQUFaO0VBQ0FzWCxLQUFLLENBQUNyWCxTQUFOLEdBQWtCblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixHQUFsQixDQUFsQjtFQUNBeWEsS0FBSyxDQUFDdlAsSUFBTixDQUFXLENBQUNqVSxXQUFELEdBQWEsQ0FBeEIsRUFBMkIsQ0FBQ0gsWUFBRCxHQUFjLENBQXpDLEVBQTRDRyxXQUE1QyxFQUF5REgsWUFBekQ7RUFDQTJqQixLQUFLLENBQUNuWCxJQUFOO0VBQ0FrWCxJQUFJLENBQUN0YixNQUFMLEdBQWNxYixNQUFkO0VBRUFDLElBQUksQ0FBQzVsQixFQUFMLENBQVEzRSxFQUFFLENBQUNxTixJQUFILENBQVFDLFNBQVIsQ0FBa0JDLFNBQTFCLEVBQXFDLFVBQVNDLEtBQVQsRUFBZ0I7SUFDakRBLEtBQUssQ0FBQ0MsZUFBTjtFQUNILENBRkQsRUF4QnNFLENBNEJ0RTs7RUFDQSxJQUFJZ2QsV0FBVyxHQUFHLEdBQWxCO0VBQ0EsSUFBSUMsWUFBWSxHQUFHLEdBQW5CO0VBQ0EsSUFBSUMsUUFBUSxHQUFHLElBQUkzcUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFVBQVosQ0FBZjtFQUNBc2QsUUFBUSxDQUFDM2IsY0FBVCxDQUF3QmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUTJYLFdBQVIsRUFBcUJDLFlBQXJCLENBQXhCO0VBRUEsSUFBSUUsR0FBRyxHQUFHRCxRQUFRLENBQUNsYixZQUFULENBQXNCelAsRUFBRSxDQUFDa1QsUUFBekIsQ0FBVjtFQUNBMFgsR0FBRyxDQUFDelgsU0FBSixHQUFnQm5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixHQUFyQixDQUFoQjtFQUNBNmEsR0FBRyxDQUFDeFgsU0FBSixDQUFjLENBQUNxWCxXQUFELEdBQWEsQ0FBM0IsRUFBOEIsQ0FBQ0MsWUFBRCxHQUFjLENBQTVDLEVBQStDRCxXQUEvQyxFQUE0REMsWUFBNUQsRUFBMEUsRUFBMUU7RUFDQUUsR0FBRyxDQUFDdlgsSUFBSjtFQUNBdVgsR0FBRyxDQUFDelAsV0FBSixHQUFrQm5iLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixFQUFuQixFQUF1QixHQUF2QixDQUFsQjtFQUNBNmEsR0FBRyxDQUFDeFAsU0FBSixHQUFnQixDQUFoQjtFQUNBd1AsR0FBRyxDQUFDeFgsU0FBSixDQUFjLENBQUNxWCxXQUFELEdBQWEsQ0FBM0IsRUFBOEIsQ0FBQ0MsWUFBRCxHQUFjLENBQTVDLEVBQStDRCxXQUEvQyxFQUE0REMsWUFBNUQsRUFBMEUsRUFBMUU7RUFDQUUsR0FBRyxDQUFDdlAsTUFBSjtFQUNBc1AsUUFBUSxDQUFDMWIsTUFBVCxHQUFrQnFiLE1BQWxCLENBMUNzRSxDQTRDdEU7O0VBQ0EsSUFBSWpiLFNBQVMsR0FBRyxJQUFJclAsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLE9BQVosQ0FBaEI7RUFDQWdDLFNBQVMsQ0FBQ0UsV0FBVixDQUFzQixDQUF0QixFQUF5Qm1iLFlBQVksR0FBQyxDQUFiLEdBQWlCLEVBQTFDO0VBQ0FyYixTQUFTLENBQUNqSCxPQUFWLEdBQW9CLEdBQXBCO0VBQ0FpSCxTQUFTLENBQUNoSCxPQUFWLEdBQW9CLEdBQXBCO0VBQ0EsSUFBSXlpQixHQUFHLEdBQUd6YixTQUFTLENBQUNJLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUNLLEtBQTFCLENBQVY7RUFDQXlxQixHQUFHLENBQUMvbkIsTUFBSixHQUFhLFNBQWI7RUFDQStuQixHQUFHLENBQUNwYixRQUFKLEdBQWUsRUFBZjtFQUNBb2IsR0FBRyxDQUFDbGIsZUFBSixHQUFzQjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBL0M7RUFDQVQsU0FBUyxDQUFDVSxLQUFWLEdBQWtCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWxCO0VBQ0FWLFNBQVMsQ0FBQ0osTUFBVixHQUFtQnFiLE1BQW5CLENBdERzRSxDQXdEdEU7O0VBQ0EsSUFBSTZDLFFBQVEsR0FBRyxJQUFJbnRCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxVQUFaLENBQWY7RUFDQThmLFFBQVEsQ0FBQzVkLFdBQVQsQ0FBcUIsQ0FBckIsRUFBd0JtYixZQUFZLEdBQUMsQ0FBYixHQUFpQixFQUF6QztFQUNBeUMsUUFBUSxDQUFDL2tCLE9BQVQsR0FBbUIsR0FBbkI7RUFDQStrQixRQUFRLENBQUM5a0IsT0FBVCxHQUFtQixHQUFuQjtFQUNBLElBQUkra0IsR0FBRyxHQUFHRCxRQUFRLENBQUMxZCxZQUFULENBQXNCelAsRUFBRSxDQUFDSyxLQUF6QixDQUFWO0VBQ0Erc0IsR0FBRyxDQUFDcnFCLE1BQUosR0FBYSxVQUFVbXFCLFFBQXZCO0VBQ0FFLEdBQUcsQ0FBQzFkLFFBQUosR0FBZSxFQUFmO0VBQ0EwZCxHQUFHLENBQUN4ZCxlQUFKLEdBQXNCNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUEvQztFQUNBcWQsUUFBUSxDQUFDcGQsS0FBVCxHQUFpQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFqQjtFQUNBb2QsUUFBUSxDQUFDbGUsTUFBVCxHQUFrQnFiLE1BQWxCLENBbEVzRSxDQW9FdEU7O0VBQ0EsSUFBSTZCLFFBQVEsR0FBRyxLQUFLYSxrQkFBTCxDQUF3QixPQUF4QixFQUFpQyxDQUFqQyxFQUFvQyxFQUFwQyxFQUF3QyxHQUF4QyxFQUE2QyxFQUE3QyxFQUFpRCxVQUFqRCxDQUFmOztFQUNBYixRQUFRLENBQUNsZCxNQUFULEdBQWtCcWIsTUFBbEIsQ0F0RXNFLENBd0V0RTs7RUFDQSxJQUFJeE8sSUFBSSxHQUFHLENBQUM0TyxZQUFELEdBQWMsQ0FBZCxHQUFrQixFQUE3QixDQXpFc0UsQ0EyRXRFOztFQUNBLElBQUlyTyxTQUFTLEdBQUcsS0FBS2lOLGlCQUFMLENBQXVCLElBQXZCLEVBQTZCdHBCLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixDQUE3QixFQUFtRCxDQUFDLEVBQXBELEVBQXdEK0wsSUFBeEQsRUFBOEQsRUFBOUQsRUFBa0UsRUFBbEUsRUFBc0UsWUFBVztJQUM3RndPLE1BQU0sQ0FBQ2pjLE9BQVA7RUFDSCxDQUZlLENBQWhCOztFQUdBZ08sU0FBUyxDQUFDcE4sTUFBVixHQUFtQnFiLE1BQW5CLENBL0VzRSxDQWlGdEU7O0VBQ0EsSUFBSStDLFVBQVUsR0FBRyxLQUFLL0QsaUJBQUwsQ0FBdUIsSUFBdkIsRUFBNkJ0cEIsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxHQUFiLEVBQWtCLEVBQWxCLENBQTdCLEVBQW9ELEVBQXBELEVBQXdEK0wsSUFBeEQsRUFBOEQsRUFBOUQsRUFBa0UsRUFBbEUsRUFBc0UsWUFBVztJQUM5RixJQUFJd1IsWUFBWSxHQUFHaEQsTUFBTSxDQUFDcGtCLGNBQVAsQ0FBc0IsVUFBdEIsQ0FBbkI7SUFDQSxJQUFJMGdCLFdBQVcsR0FBRzBHLFlBQVksR0FBR0EsWUFBWSxDQUFDcG5CLGNBQWIsQ0FBNEIsYUFBNUIsQ0FBSCxHQUFnRCxJQUE5RTtJQUNBLElBQUlvbUIsUUFBUSxHQUFHMUYsV0FBVyxHQUFHQSxXQUFXLENBQUN4akIsWUFBWixDQUF5QnBELEVBQUUsQ0FBQ0ssS0FBNUIsRUFBbUMwQyxNQUF0QyxHQUErQyxFQUF6RTs7SUFFQSxJQUFJLENBQUN1cEIsUUFBRCxJQUFhQSxRQUFRLEtBQUssT0FBOUIsRUFBdUM7TUFDbkN6cUIsSUFBSSxDQUFDMHJCLGdCQUFMLENBQXNCakQsTUFBdEIsRUFBOEIsT0FBOUI7O01BQ0E7SUFDSCxDQVI2RixDQVU5Rjs7O0lBRUFBLE1BQU0sQ0FBQ2pjLE9BQVA7O0lBRUEsSUFBSXFaLFFBQUosRUFBYztNQUNWQSxRQUFRLENBQUM0RSxRQUFELENBQVI7SUFDSDtFQUNKLENBakJnQixFQWlCZCxJQWpCYyxDQUFqQjs7RUFrQkFlLFVBQVUsQ0FBQ3BlLE1BQVgsR0FBb0JxYixNQUFwQjtFQUVBLE9BQU9BLE1BQVA7QUFDSCxDQTduSUwsWUFnb0lJaUQsZ0JBaG9JSixHQWdvSXNCLDBCQUFTakQsTUFBVCxFQUFpQjVuQixPQUFqQixFQUEwQjtFQUN4QyxJQUFJOHFCLEdBQUcsR0FBR2xELE1BQU0sQ0FBQ3BrQixjQUFQLENBQXNCLFNBQXRCLENBQVY7RUFDQSxJQUFJc25CLEdBQUosRUFBU0EsR0FBRyxDQUFDbmYsT0FBSjtFQUVUbWYsR0FBRyxHQUFHLElBQUl4dEIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFNBQVosQ0FBTjtFQUNBbWdCLEdBQUcsQ0FBQ2plLFdBQUosQ0FBZ0IsQ0FBaEIsRUFBbUIsQ0FBQyxFQUFwQjtFQUNBaWUsR0FBRyxDQUFDcGxCLE9BQUosR0FBYyxHQUFkO0VBQ0FvbEIsR0FBRyxDQUFDbmxCLE9BQUosR0FBYyxHQUFkO0VBRUEsSUFBSW1ILEtBQUssR0FBR2dlLEdBQUcsQ0FBQy9kLFlBQUosQ0FBaUJ6UCxFQUFFLENBQUNLLEtBQXBCLENBQVo7RUFDQW1QLEtBQUssQ0FBQ3pNLE1BQU4sR0FBZUwsT0FBZjtFQUNBOE0sS0FBSyxDQUFDRSxRQUFOLEdBQWlCLEVBQWpCO0VBQ0FGLEtBQUssQ0FBQ0ksZUFBTixHQUF3QjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBakQ7RUFDQTBkLEdBQUcsQ0FBQ3pkLEtBQUosR0FBWS9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFaO0VBQ0F5ZCxHQUFHLENBQUN2ZSxNQUFKLEdBQWFxYixNQUFiO0VBRUEsS0FBS3JsQixZQUFMLENBQWtCLFlBQVc7SUFDekIsSUFBSXVvQixHQUFHLElBQUlBLEdBQUcsQ0FBQy9yQixPQUFmLEVBQXdCK3JCLEdBQUcsQ0FBQ25mLE9BQUo7RUFDM0IsQ0FGRCxFQUVHLENBRkg7QUFHSCxDQW5wSUwsWUFzcElJcWEsK0JBdHBJSixHQXNwSXFDLHlDQUFTVSxTQUFULEVBQW9CcUUsWUFBcEIsRUFBa0NoaEIsVUFBbEMsRUFBOEMwRSxVQUE5QyxFQUEwRDRTLFNBQTFELEVBQXFFO0VBQ2xHLElBQUlsaUIsSUFBSSxHQUFHLElBQVg7RUFDQSxJQUFJYixRQUFRLEdBQUdELE1BQU0sQ0FBQ0MsUUFBdEI7RUFDQSxJQUFJMkUsTUFBTSxHQUFHM0UsUUFBUSxJQUFJQSxRQUFRLENBQUMyRSxNQUFyQixHQUE4QjNFLFFBQVEsQ0FBQzJFLE1BQXZDLEdBQWdELElBQTdELENBSGtHLENBS2xHOztFQUNBLElBQUlFLFdBQVcsR0FBR0YsTUFBTSxJQUFJQSxNQUFNLENBQUNFLFdBQWpCLElBQWdDRixNQUFNLENBQUNFLFdBQVAsRUFBbEQ7RUFDQSxJQUFJRCxlQUFlLEdBQUdELE1BQU0sSUFBSUEsTUFBTSxDQUFDQyxlQUFqQixJQUFvQ0QsTUFBTSxDQUFDQyxlQUFQLEVBQTFELENBUGtHLENBVWxHOztFQUNBLElBQUk4bkIsWUFBWSxHQUFHLEVBQW5CLENBWGtHLENBYWxHOztFQUNBLElBQUlDLHFCQUFxQixHQUFHLFNBQXhCQSxxQkFBd0IsQ0FBUy9vQixJQUFULEVBQWU7SUFFdkMsSUFBSWdwQixVQUFVLEdBQUdocEIsSUFBSSxDQUFDaXBCLFdBQXRCO0lBQ0EsSUFBSVgsUUFBUSxHQUFHdG9CLElBQUksQ0FBQzJZLFNBQXBCO0lBQ0EsSUFBSS9RLElBQUksR0FBRzVILElBQUksQ0FBQzRILElBQWhCOztJQUVBLElBQUlvaEIsVUFBVSxLQUFLLEtBQWYsSUFBd0JwaEIsSUFBNUIsRUFBa0M7TUFDOUI7TUFDQSxJQUFJc2hCLE1BQU0sR0FBR0osWUFBWSxDQUFDSyxJQUFiLENBQWtCLFVBQVM5VixDQUFULEVBQVk7UUFDdkMsT0FBTyxDQUFDQSxDQUFDLENBQUNzRixTQUFGLElBQWV0RixDQUFDLENBQUNpVixRQUFsQixPQUFpQzFnQixJQUFJLENBQUMrUSxTQUFMLElBQWtCL1EsSUFBSSxDQUFDMGdCLFFBQXhELENBQVA7TUFDSCxDQUZZLENBQWI7O01BR0EsSUFBSSxDQUFDWSxNQUFMLEVBQWE7UUFDVEosWUFBWSxDQUFDcm1CLElBQWIsQ0FBa0JtRixJQUFsQjtNQUNIO0lBQ0osQ0FSRCxNQVFPLElBQUlvaEIsVUFBVSxLQUFLLFFBQWYsSUFBMkJwaEIsSUFBL0IsRUFBcUM7TUFDeEM7TUFDQSxLQUFLLElBQUlwRyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHc25CLFlBQVksQ0FBQ3JuQixNQUFqQyxFQUF5Q0QsQ0FBQyxFQUExQyxFQUE4QztRQUMxQyxJQUFJLENBQUNzbkIsWUFBWSxDQUFDdG5CLENBQUQsQ0FBWixDQUFnQm1YLFNBQWhCLElBQTZCbVEsWUFBWSxDQUFDdG5CLENBQUQsQ0FBWixDQUFnQjhtQixRQUE5QyxPQUE2RDFnQixJQUFJLENBQUMrUSxTQUFMLElBQWtCL1EsSUFBSSxDQUFDMGdCLFFBQXBGLENBQUosRUFBbUc7VUFDL0ZRLFlBQVksQ0FBQ3RuQixDQUFELENBQVosR0FBa0JvRyxJQUFsQjtVQUNBO1FBQ0g7TUFDSjtJQUNKLENBUk0sTUFRQSxJQUFJb2hCLFVBQVUsS0FBSyxRQUFuQixFQUE2QjtNQUNoQztNQUNBRixZQUFZLEdBQUdBLFlBQVksQ0FBQ00sTUFBYixDQUFvQixVQUFTL1YsQ0FBVCxFQUFZO1FBQzNDLE9BQU8sQ0FBQ0EsQ0FBQyxDQUFDc0YsU0FBRixJQUFldEYsQ0FBQyxDQUFDaVYsUUFBbEIsTUFBZ0NBLFFBQXZDO01BQ0gsQ0FGYyxDQUFmO0lBR0gsQ0EzQnNDLENBNkJ2Qzs7O0lBQ0EsSUFBSWUsYUFBYSxHQUFHUCxZQUFZLENBQUNNLE1BQWIsQ0FBb0IsVUFBUy9WLENBQVQsRUFBWTtNQUNoRCxJQUFJaVcsS0FBSyxHQUFHalcsQ0FBQyxDQUFDa1csWUFBRixJQUFrQmxXLENBQUMsQ0FBQ21XLFdBQXBCLElBQW1DLENBQS9DO01BQ0EsT0FBT0YsS0FBSyxHQUFHLENBQVIsSUFBYUEsS0FBSyxHQUFHLENBQTVCO0lBQ0gsQ0FIbUIsQ0FBcEI7O0lBSUFyc0IsSUFBSSxDQUFDd3NCLHNCQUFMLENBQTRCakYsU0FBNUIsRUFBdUM2RSxhQUF2QyxFQUFzRHhoQixVQUF0RCxFQUFrRTBFLFVBQWxFLEVBQThFNFMsU0FBOUU7RUFDSCxDQW5DRCxDQWRrRyxDQW1EbEc7OztFQUNBLElBQUlwZSxNQUFNLElBQUlBLE1BQU0sQ0FBQzJvQixnQkFBckIsRUFBdUM7SUFDbkMzb0IsTUFBTSxDQUFDMm9CLGdCQUFQLENBQXdCWCxxQkFBeEI7RUFDSCxDQXREaUcsQ0F3RGxHOzs7RUFDQTVKLFNBQVMsQ0FBQ3dLLHNCQUFWLEdBQW1DWixxQkFBbkMsQ0F6RGtHLENBMkRsRzs7RUFDQSxJQUFJLENBQUNob0IsTUFBRCxJQUFXLENBQUNFLFdBQVosSUFBMkIsQ0FBQ0QsZUFBaEMsRUFBaUQ7SUFFN0MsS0FBS1gsWUFBTCxDQUFrQixZQUFXO01BQ3pCLElBQUl3b0IsWUFBWSxJQUFJQSxZQUFZLENBQUNoc0IsT0FBakMsRUFBMEM7UUFDdENnc0IsWUFBWSxDQUFDaG5CLE1BQWIsR0FBc0IsS0FBdEI7TUFDSCxDQUh3QixDQUl6Qjs7O01BQ0E1RSxJQUFJLENBQUN3c0Isc0JBQUwsQ0FBNEJqRixTQUE1QixFQUF1QyxFQUF2QyxFQUEyQzNjLFVBQTNDLEVBQXVEMEUsVUFBdkQsRUFBbUU0UyxTQUFuRTtJQUNILENBTkQsRUFNRyxHQU5IO0lBT0E7RUFDSCxDQXRFaUcsQ0F3RWxHOzs7RUFDQSxJQUFJeUssU0FBUyxHQUFHdHNCLFVBQVUsQ0FBQyxZQUFXO0lBQ2xDLElBQUl1ckIsWUFBWSxJQUFJQSxZQUFZLENBQUNoc0IsT0FBakMsRUFBMEM7TUFDdENnc0IsWUFBWSxDQUFDaG5CLE1BQWIsR0FBc0IsS0FBdEI7SUFDSCxDQUhpQyxDQUlsQzs7O0lBQ0E1RSxJQUFJLENBQUN3c0Isc0JBQUwsQ0FBNEJqRixTQUE1QixFQUF1QyxFQUF2QyxFQUEyQzNjLFVBQTNDLEVBQXVEMEUsVUFBdkQsRUFBbUU0UyxTQUFuRTtFQUNILENBTnlCLEVBTXZCLElBTnVCLENBQTFCO0VBUUFwZSxNQUFNLENBQUM4b0IsV0FBUCxDQUFtQixVQUFTdGtCLE1BQVQsRUFBaUJvQixLQUFqQixFQUF3QjtJQUN2QzRSLFlBQVksQ0FBQ3FSLFNBQUQsQ0FBWjs7SUFHQSxJQUFJZixZQUFZLElBQUlBLFlBQVksQ0FBQ2hzQixPQUFqQyxFQUEwQztNQUN0Q2dzQixZQUFZLENBQUNobkIsTUFBYixHQUFzQixLQUF0QjtJQUNIOztJQUVELElBQUkwRCxNQUFNLEtBQUssQ0FBWCxJQUFnQm9CLEtBQWhCLElBQXlCQSxLQUFLLENBQUNsRixNQUFOLEdBQWUsQ0FBNUMsRUFBK0M7TUFDM0M7TUFDQXFuQixZQUFZLEdBQUduaUIsS0FBZixDQUYyQyxDQUkzQzs7TUFDQSxJQUFJMGlCLGFBQWEsR0FBRzFpQixLQUFLLENBQUN5aUIsTUFBTixDQUFhLFVBQVN4aEIsSUFBVCxFQUFlO1FBQzVDLElBQUkwaEIsS0FBSyxHQUFHMWhCLElBQUksQ0FBQzJoQixZQUFMLElBQXFCM2hCLElBQUksQ0FBQzRoQixXQUExQixJQUF5QyxDQUFyRDtRQUNBLE9BQU9GLEtBQUssR0FBRyxDQUFSLElBQWFBLEtBQUssR0FBRyxDQUE1QjtNQUNILENBSG1CLENBQXBCOztNQUtBcnNCLElBQUksQ0FBQ3dzQixzQkFBTCxDQUE0QmpGLFNBQTVCLEVBQXVDNkUsYUFBdkMsRUFBc0R4aEIsVUFBdEQsRUFBa0UwRSxVQUFsRSxFQUE4RTRTLFNBQTlFO0lBQ0gsQ0FYRCxNQVdPO01BQ0g7TUFDQWxpQixJQUFJLENBQUN3c0Isc0JBQUwsQ0FBNEJqRixTQUE1QixFQUF1QyxFQUF2QyxFQUEyQzNjLFVBQTNDLEVBQXVEMEUsVUFBdkQsRUFBbUU0UyxTQUFuRTtJQUNIO0VBQ0osQ0F2QkQ7QUF3QkgsQ0EvdklMLFlBb3dJSXNLLHNCQXB3SUosR0Fvd0k0QixnQ0FBU2pGLFNBQVQsRUFBb0I3ZCxLQUFwQixFQUEyQmtCLFVBQTNCLEVBQXVDMEUsVUFBdkMsRUFBbUQ0UyxTQUFuRCxFQUE4RDtFQUNsRixJQUFJbGlCLElBQUksR0FBRyxJQUFYLENBRGtGLENBR2xGOztFQUNBLElBQUlzRSxRQUFRLEdBQUdpakIsU0FBUyxDQUFDampCLFFBQVYsQ0FBbUIrYSxLQUFuQixFQUFmOztFQUNBLEtBQUssSUFBSTlhLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdELFFBQVEsQ0FBQ0UsTUFBN0IsRUFBcUNELENBQUMsRUFBdEMsRUFBMEM7SUFDdEMsSUFBSUQsUUFBUSxDQUFDQyxDQUFELENBQVIsQ0FBWW1CLElBQVosS0FBcUIsY0FBekIsRUFBeUM7TUFDckNwQixRQUFRLENBQUNDLENBQUQsQ0FBUixDQUFZaUksT0FBWjtJQUNIO0VBQ0o7O0VBRUQsSUFBSXFnQixjQUFjLEdBQUd0RixTQUFTLENBQUNuaUIsS0FBL0I7RUFDQSxJQUFJbWhCLFFBQVEsR0FBR3NHLGNBQWMsR0FBRyxDQUFoQztFQUNBLElBQUlwYyxVQUFVLEdBQUcsRUFBakIsQ0Fia0YsQ0FhNUQ7O0VBQ3RCLElBQUlxYyxNQUFNLEdBQUd2RixTQUFTLENBQUNyaUIsTUFBVixHQUFpQixDQUFqQixHQUFxQixFQUFsQyxDQWRrRixDQWdCbEY7O0VBQ0EsSUFBSSxDQUFDd0UsS0FBRCxJQUFVQSxLQUFLLENBQUNsRixNQUFOLEtBQWlCLENBQS9CLEVBQWtDO0lBQzlCLElBQUl1b0IsU0FBUyxHQUFHLElBQUk1dUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFVBQVosQ0FBaEI7SUFDQXVoQixTQUFTLENBQUN4bUIsT0FBVixHQUFvQixHQUFwQjtJQUNBd21CLFNBQVMsQ0FBQ3ZtQixPQUFWLEdBQW9CLEdBQXBCO0lBQ0EsSUFBSXdtQixFQUFFLEdBQUdELFNBQVMsQ0FBQ25mLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUNLLEtBQTFCLENBQVQ7SUFDQXd1QixFQUFFLENBQUM5ckIsTUFBSCxHQUFZLFVBQVo7SUFDQThyQixFQUFFLENBQUNuZixRQUFILEdBQWMsRUFBZCxDQU44QixDQU1YOztJQUNuQm1mLEVBQUUsQ0FBQ2pmLGVBQUgsR0FBcUI1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQTlDO0lBQ0E4ZSxTQUFTLENBQUM3ZSxLQUFWLEdBQWtCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWxCO0lBQ0E2ZSxTQUFTLENBQUMzZixNQUFWLEdBQW1CbWEsU0FBbkI7SUFDQTtFQUNILENBNUJpRixDQThCbEY7OztFQUNBLEtBQUssSUFBSWhqQixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHbUYsS0FBSyxDQUFDbEYsTUFBVixJQUFvQkQsQ0FBQyxHQUFHLENBQXhDLEVBQTJDQSxDQUFDLEVBQTVDLEVBQWdEO0lBQzVDLElBQUlvRyxJQUFJLEdBQUdqQixLQUFLLENBQUNuRixDQUFELENBQWhCO0lBQ0EsSUFBSTBvQixLQUFLLEdBQUdILE1BQU0sR0FBR3ZvQixDQUFDLEdBQUdrTSxVQUF6QixDQUY0QyxDQUk1Qzs7SUFDQSxJQUFJeWMsTUFBTSxHQUFHLElBQUkvdUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLGNBQWNqSCxDQUExQixDQUFiO0lBQ0Eyb0IsTUFBTSxDQUFDL2YsY0FBUCxDQUFzQmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUTRiLGNBQWMsR0FBRyxDQUF6QixFQUE0QnBjLFVBQVUsR0FBRyxDQUF6QyxDQUF0QjtJQUNBeWMsTUFBTSxDQUFDeGYsV0FBUCxDQUFtQixDQUFuQixFQUFzQnVmLEtBQXRCO0lBRUEsSUFBSUUsRUFBRSxHQUFHRCxNQUFNLENBQUN0ZixZQUFQLENBQW9CelAsRUFBRSxDQUFDa1QsUUFBdkIsQ0FBVDtJQUNBOGIsRUFBRSxDQUFDN2IsU0FBSCxHQUFlL00sQ0FBQyxHQUFHLENBQUosS0FBVSxDQUFWLEdBQWNwRyxFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakIsRUFBcUIsR0FBckIsQ0FBZCxHQUEwQy9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixHQUFyQixDQUF6RDtJQUNBaWYsRUFBRSxDQUFDNWIsU0FBSCxDQUFhLEVBQUVzYixjQUFjLEdBQUcsQ0FBbkIsSUFBc0IsQ0FBbkMsRUFBc0MsRUFBRXBjLFVBQVUsR0FBRyxDQUFmLElBQWtCLENBQXhELEVBQTJEb2MsY0FBYyxHQUFHLENBQTVFLEVBQStFcGMsVUFBVSxHQUFHLENBQTVGLEVBQStGLENBQS9GO0lBQ0EwYyxFQUFFLENBQUMzYixJQUFIO0lBQ0EwYixNQUFNLENBQUM5ZixNQUFQLEdBQWdCbWEsU0FBaEI7SUFFQSxJQUFJZ0YsV0FBVyxHQUFHNWhCLElBQUksQ0FBQzJoQixZQUFMLElBQXFCM2hCLElBQUksQ0FBQzRoQixXQUExQixJQUF5QyxDQUEzRDtJQUNBLElBQUlsQixRQUFRLEdBQUcxZ0IsSUFBSSxDQUFDK1EsU0FBTCxJQUFrQi9RLElBQUksQ0FBQzBnQixRQUF2QixJQUFtQyxJQUFsRCxDQWhCNEMsQ0FrQjVDOztJQUNBLElBQUlDLFFBQVEsR0FBRyxJQUFJbnRCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxVQUFaLENBQWY7SUFDQThmLFFBQVEsQ0FBQzNrQixDQUFULEdBQWEsQ0FBQ2ttQixjQUFELEdBQWdCLENBQWhCLEdBQW9CdEcsUUFBUSxHQUFHLEdBQTVDO0lBQ0ErRSxRQUFRLENBQUMva0IsT0FBVCxHQUFtQixHQUFuQjtJQUNBK2tCLFFBQVEsQ0FBQzlrQixPQUFULEdBQW1CLEdBQW5CO0lBQ0EsSUFBSTRtQixFQUFFLEdBQUc5QixRQUFRLENBQUMxZCxZQUFULENBQXNCelAsRUFBRSxDQUFDSyxLQUF6QixDQUFUO0lBQ0E0dUIsRUFBRSxDQUFDbHNCLE1BQUgsR0FBWW1xQixRQUFaO0lBQ0ErQixFQUFFLENBQUN2ZixRQUFILEdBQWMsRUFBZCxDQXpCNEMsQ0F5QnpCOztJQUNuQnVmLEVBQUUsQ0FBQ3JmLGVBQUgsR0FBcUI1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQTlDO0lBQ0FxZCxRQUFRLENBQUNwZCxLQUFULEdBQWlCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWpCO0lBQ0FvZCxRQUFRLENBQUNsZSxNQUFULEdBQWtCOGYsTUFBbEIsQ0E1QjRDLENBOEI1Qzs7SUFDQSxJQUFJRyxTQUFTLEdBQUcsSUFBSWx2QixFQUFFLENBQUNxTixJQUFQLENBQVksV0FBWixDQUFoQjtJQUNBNmhCLFNBQVMsQ0FBQzFtQixDQUFWLEdBQWMsQ0FBQ2ttQixjQUFELEdBQWdCLENBQWhCLEdBQW9CdEcsUUFBUSxHQUFHLEdBQTdDO0lBQ0E4RyxTQUFTLENBQUM5bUIsT0FBVixHQUFvQixHQUFwQjtJQUNBOG1CLFNBQVMsQ0FBQzdtQixPQUFWLEdBQW9CLEdBQXBCO0lBQ0EsSUFBSStrQixHQUFHLEdBQUc4QixTQUFTLENBQUN6ZixZQUFWLENBQXVCelAsRUFBRSxDQUFDSyxLQUExQixDQUFWO0lBQ0Erc0IsR0FBRyxDQUFDcnFCLE1BQUosR0FBYXFyQixXQUFXLEdBQUcsSUFBM0I7SUFDQWhCLEdBQUcsQ0FBQzFkLFFBQUosR0FBZSxFQUFmLENBckM0QyxDQXFDeEI7O0lBQ3BCMGQsR0FBRyxDQUFDeGQsZUFBSixHQUFzQjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBL0M7SUFDQW9mLFNBQVMsQ0FBQ25mLEtBQVYsR0FBa0JxZSxXQUFXLElBQUksQ0FBZixHQUFtQnB1QixFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsRUFBbkIsQ0FBbkIsR0FBNEMvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBOUQ7SUFDQW1mLFNBQVMsQ0FBQ2pnQixNQUFWLEdBQW1COGYsTUFBbkIsQ0F4QzRDLENBMEM1Qzs7SUFDQSxJQUFJSSxTQUFTLEdBQUcsSUFBSW52QixFQUFFLENBQUNxTixJQUFQLENBQVksV0FBWixDQUFoQjtJQUNBOGhCLFNBQVMsQ0FBQzNtQixDQUFWLEdBQWMsQ0FBQ2ttQixjQUFELEdBQWdCLENBQWhCLEdBQW9CdEcsUUFBUSxHQUFHLEdBQTdDO0lBQ0ErRyxTQUFTLENBQUMvbUIsT0FBVixHQUFvQixHQUFwQjtJQUNBK21CLFNBQVMsQ0FBQzltQixPQUFWLEdBQW9CLEdBQXBCO0lBQ0EsSUFBSSttQixFQUFFLEdBQUdELFNBQVMsQ0FBQzFmLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUNLLEtBQTFCLENBQVQ7SUFDQSt1QixFQUFFLENBQUNyc0IsTUFBSCxHQUFZLE1BQU15SixJQUFJLENBQUM1QixVQUFMLElBQW1CNkIsVUFBVSxDQUFDN0IsVUFBOUIsSUFBNEMsQ0FBbEQsQ0FBWjtJQUNBd2tCLEVBQUUsQ0FBQzFmLFFBQUgsR0FBYyxFQUFkLENBakQ0QyxDQWlEekI7O0lBQ25CMGYsRUFBRSxDQUFDeGYsZUFBSCxHQUFxQjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBOUM7SUFDQXFmLFNBQVMsQ0FBQ3BmLEtBQVYsR0FBa0IvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsRUFBbkIsQ0FBbEI7SUFDQW9mLFNBQVMsQ0FBQ2xnQixNQUFWLEdBQW1COGYsTUFBbkIsQ0FwRDRDLENBc0Q1Qzs7SUFDQSxJQUFJalAsVUFBVSxHQUFHLElBQUk5ZixFQUFFLENBQUNxTixJQUFQLENBQVksWUFBWixDQUFqQjtJQUNBeVMsVUFBVSxDQUFDdFgsQ0FBWCxHQUFlLENBQUNrbUIsY0FBRCxHQUFnQixDQUFoQixHQUFvQnRHLFFBQVEsR0FBRyxHQUE5QztJQUNBdEksVUFBVSxDQUFDMVgsT0FBWCxHQUFxQixHQUFyQjtJQUNBMFgsVUFBVSxDQUFDelgsT0FBWCxHQUFxQixHQUFyQjtJQUNBLElBQUlnbkIsR0FBRyxHQUFHdlAsVUFBVSxDQUFDclEsWUFBWCxDQUF3QnpQLEVBQUUsQ0FBQ0ssS0FBM0IsQ0FBVjtJQUNBZ3ZCLEdBQUcsQ0FBQ3RzQixNQUFKLEdBQWFxckIsV0FBVyxJQUFJLENBQWYsR0FBbUIsSUFBbkIsR0FBMEIsS0FBdkM7SUFDQWlCLEdBQUcsQ0FBQzNmLFFBQUosR0FBZSxFQUFmLENBN0Q0QyxDQTZEeEI7O0lBQ3BCMmYsR0FBRyxDQUFDemYsZUFBSixHQUFzQjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBL0M7SUFDQWdRLFVBQVUsQ0FBQy9QLEtBQVgsR0FBbUJxZSxXQUFXLElBQUksQ0FBZixHQUFtQnB1QixFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsRUFBbkIsQ0FBbkIsR0FBNEMvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBL0Q7SUFDQStQLFVBQVUsQ0FBQzdRLE1BQVgsR0FBb0I4ZixNQUFwQixDQWhFNEMsQ0FrRTVDOztJQUNBLENBQUMsVUFBUzlpQixRQUFULEVBQW1CO01BQ2hCLElBQUkrWixPQUFPLEdBQUdua0IsSUFBSSxDQUFDb2tCLG1CQUFMLENBQ1YsSUFEVSxFQUVWam1CLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsR0FBYixFQUFrQixFQUFsQixDQUZVLEVBR1YsQ0FBQzJlLGNBQUQsR0FBZ0IsQ0FBaEIsR0FBb0J0RyxRQUFRLEdBQUcsR0FIckIsRUFJVixDQUpVLEVBS1YsRUFMVSxFQUtOLEVBTE0sRUFLRDtNQUNULFlBQVc7UUFDUCxJQUFJL2QsSUFBSSxHQUFHNEIsUUFBUSxDQUFDc1IsU0FBVCxJQUFzQnRSLFFBQVEsQ0FBQ2loQixRQUExQztRQUNBLElBQUl2RyxLQUFLLEdBQUc1QyxTQUFTLENBQUM3ZCxjQUFWLENBQXlCLGVBQXpCLEtBQTZDNmQsU0FBekQ7UUFDQSxJQUFJNEMsS0FBSyxDQUFDdFksT0FBVixFQUFtQnNZLEtBQUssQ0FBQ3RZLE9BQU47O1FBQ25CeE0sSUFBSSxDQUFDd2tCLFNBQUwsQ0FBZWhjLElBQWYsRUFBcUJvQyxVQUFyQixFQUFpQzBFLFVBQWpDO01BQ0gsQ0FYUyxDQUFkOztNQWFBNlUsT0FBTyxDQUFDL1csTUFBUixHQUFpQjhmLE1BQWpCO0lBQ0gsQ0FmRCxFQWVHdmlCLElBZkg7RUFnQkg7QUFDSixDQXYzSUwsWUEwM0lJOGlCLG1CQTEzSUosR0EwM0l5Qiw2QkFBUzdpQixVQUFULEVBQXFCMEUsVUFBckIsRUFBaUM7RUFDbEQsSUFBSXRQLElBQUksR0FBRyxJQUFYO0VBQ0EsSUFBSWIsUUFBUSxHQUFHRCxNQUFNLENBQUNDLFFBQXRCLENBRmtELENBS2xEOztFQUNBLElBQUlxcEIsU0FBUyxHQUFHLEtBQUtsbkIsSUFBTCxDQUFVK0MsY0FBVixDQUF5QixnQkFBekIsQ0FBaEI7RUFDQSxJQUFJbWtCLFNBQUosRUFBZUEsU0FBUyxDQUFDaGMsT0FBVixHQVBtQyxDQVNsRDs7RUFDQSxJQUFJa2hCLE1BQU0sR0FBRyxLQUFLcHNCLElBQUwsQ0FBVStDLGNBQVYsQ0FBeUIsVUFBekIsQ0FBYjtFQUNBLElBQUlxcEIsTUFBSixFQUFZQSxNQUFNLENBQUNsaEIsT0FBUCxHQVhzQyxDQWFsRDs7RUFDQSxJQUFJM0gsTUFBTSxHQUFHLEtBQUt2RCxJQUFMLENBQVVDLFlBQVYsQ0FBdUJwRCxFQUFFLENBQUMyRyxNQUExQixLQUFxQzNHLEVBQUUsQ0FBQzRHLElBQUgsQ0FBUSxRQUFSLEVBQWtCeEQsWUFBbEIsQ0FBK0JwRCxFQUFFLENBQUMyRyxNQUFsQyxDQUFsRDtFQUNBLElBQUlFLFlBQVksR0FBR0gsTUFBTSxHQUFHQSxNQUFNLENBQUNJLGdCQUFQLENBQXdCQyxNQUEzQixHQUFvQyxHQUE3RDtFQUNBLElBQUlDLFdBQVcsR0FBR04sTUFBTSxHQUFHQSxNQUFNLENBQUNJLGdCQUFQLENBQXdCRyxLQUEzQixHQUFtQyxJQUEzRCxDQWhCa0QsQ0FrQmxEOztFQUNBLElBQUlxakIsTUFBTSxHQUFHLElBQUl0cUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLGdCQUFaLENBQWI7RUFDQWlkLE1BQU0sQ0FBQ3RiLGNBQVAsQ0FBc0JoUCxFQUFFLENBQUM4UyxJQUFILENBQVEsR0FBUixFQUFhLEdBQWIsQ0FBdEI7RUFDQXdYLE1BQU0sQ0FBQ2xpQixPQUFQLEdBQWlCLEdBQWpCO0VBQ0FraUIsTUFBTSxDQUFDamlCLE9BQVAsR0FBaUIsR0FBakI7RUFDQWlpQixNQUFNLENBQUM5aEIsQ0FBUCxHQUFXLENBQVg7RUFDQThoQixNQUFNLENBQUM1aUIsQ0FBUCxHQUFXLEVBQVgsQ0F4QmtELENBd0JsQzs7RUFDaEI0aUIsTUFBTSxDQUFDN1osTUFBUCxHQUFnQixJQUFoQixDQXpCa0QsQ0F5QjNCOztFQUN2QjZaLE1BQU0sQ0FBQ3JiLE1BQVAsR0FBZ0IsS0FBSzlMLElBQXJCLENBMUJrRCxDQTRCbEQ7O0VBQ0EsSUFBSW9uQixJQUFJLEdBQUcsSUFBSXZxQixFQUFFLENBQUNxTixJQUFQLENBQVksTUFBWixDQUFYO0VBQ0FrZCxJQUFJLENBQUN2YixjQUFMLENBQW9CaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFROUwsV0FBUixFQUFxQkgsWUFBckIsQ0FBcEI7RUFDQTBqQixJQUFJLENBQUNuaUIsT0FBTCxHQUFlLEdBQWY7RUFDQW1pQixJQUFJLENBQUNsaUIsT0FBTCxHQUFlLEdBQWY7RUFDQWtpQixJQUFJLENBQUMvaEIsQ0FBTCxHQUFTLENBQVQ7RUFDQStoQixJQUFJLENBQUM3aUIsQ0FBTCxHQUFTLENBQUMsRUFBVjtFQUNBLElBQUk4bkIsWUFBWSxHQUFHakYsSUFBSSxDQUFDOWEsWUFBTCxDQUFrQnpQLEVBQUUsQ0FBQ2tULFFBQXJCLENBQW5CO0VBQ0FzYyxZQUFZLENBQUNyYyxTQUFiLEdBQXlCblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixHQUFsQixDQUF6QjtFQUNBeWYsWUFBWSxDQUFDdlUsSUFBYixDQUFrQixDQUFDalUsV0FBRCxHQUFhLENBQS9CLEVBQWtDLENBQUNILFlBQUQsR0FBYyxDQUFoRCxFQUFtREcsV0FBbkQsRUFBZ0VILFlBQWhFO0VBQ0Eyb0IsWUFBWSxDQUFDbmMsSUFBYjtFQUNBa1gsSUFBSSxDQUFDdGIsTUFBTCxHQUFjcWIsTUFBZCxDQXZDa0QsQ0F5Q2xEOztFQUNBQyxJQUFJLENBQUM1bEIsRUFBTCxDQUFRM0UsRUFBRSxDQUFDcU4sSUFBSCxDQUFRQyxTQUFSLENBQWtCQyxTQUExQixFQUFxQyxVQUFTQyxLQUFULEVBQWdCO0lBQ2pEQSxLQUFLLENBQUNDLGVBQU47SUFDQTZjLE1BQU0sQ0FBQ2pjLE9BQVA7RUFDSCxDQUhELEVBMUNrRCxDQStDbEQ7O0VBQ0EsSUFBSTJFLE1BQU0sR0FBRyxJQUFJaFQsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFFBQVosQ0FBYjtFQUNBMkYsTUFBTSxDQUFDaEUsY0FBUCxDQUFzQmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUSxHQUFSLEVBQWEsR0FBYixDQUF0QjtFQUNBLElBQUlHLFVBQVUsR0FBR0QsTUFBTSxDQUFDdkQsWUFBUCxDQUFvQnpQLEVBQUUsQ0FBQ2tULFFBQXZCLENBQWpCO0VBQ0FELFVBQVUsQ0FBQ0UsU0FBWCxHQUF1Qm5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixHQUFyQixDQUF2QjtFQUNBa0QsVUFBVSxDQUFDRyxTQUFYLENBQXFCLENBQUMsR0FBdEIsRUFBMkIsQ0FBQyxHQUE1QixFQUFpQyxHQUFqQyxFQUFzQyxHQUF0QyxFQUEyQyxFQUEzQztFQUNBSCxVQUFVLENBQUNJLElBQVg7RUFDQUosVUFBVSxDQUFDa0ksV0FBWCxHQUF5Qm5iLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixFQUF3QixHQUF4QixDQUF6QjtFQUNBa0QsVUFBVSxDQUFDbUksU0FBWCxHQUF1QixDQUF2QjtFQUNBbkksVUFBVSxDQUFDRyxTQUFYLENBQXFCLENBQUMsR0FBdEIsRUFBMkIsQ0FBQyxHQUE1QixFQUFpQyxHQUFqQyxFQUFzQyxHQUF0QyxFQUEyQyxFQUEzQztFQUNBSCxVQUFVLENBQUNvSSxNQUFYO0VBQ0FySSxNQUFNLENBQUMvRCxNQUFQLEdBQWdCcWIsTUFBaEIsQ0ExRGtELENBNERsRDs7RUFDQSxJQUFJaGIsU0FBUyxHQUFHLElBQUl0UCxFQUFFLENBQUNxTixJQUFQLENBQVksT0FBWixDQUFoQjtFQUNBaUMsU0FBUyxDQUFDNUgsQ0FBVixHQUFjLEdBQWQ7RUFDQSxJQUFJa00sVUFBVSxHQUFHdEUsU0FBUyxDQUFDRyxZQUFWLENBQXVCelAsRUFBRSxDQUFDSyxLQUExQixDQUFqQjtFQUNBdVQsVUFBVSxDQUFDN1EsTUFBWCxHQUFvQixNQUFNMEosVUFBVSxDQUFDL0IsU0FBakIsR0FBNkIsR0FBakQ7RUFDQWtKLFVBQVUsQ0FBQ2xFLFFBQVgsR0FBc0IsRUFBdEI7RUFDQWtFLFVBQVUsQ0FBQ2pFLFVBQVgsR0FBd0IsRUFBeEI7RUFDQWlFLFVBQVUsQ0FBQ2hFLGVBQVgsR0FBNkI1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQXREO0VBQ0FSLFNBQVMsQ0FBQ1MsS0FBVixHQUFrQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixDQUFuQixDQUFsQjtFQUNBVCxTQUFTLENBQUNMLE1BQVYsR0FBbUJxYixNQUFuQixDQXJFa0QsQ0F1RWxEOztFQUNBLElBQUltRixZQUFZLEdBQUcsSUFBSXp2QixFQUFFLENBQUNxTixJQUFQLENBQVksVUFBWixDQUFuQjtFQUNBb2lCLFlBQVksQ0FBQy9uQixDQUFiLEdBQWlCLEdBQWpCO0VBQ0EsSUFBSWdvQixhQUFhLEdBQUdELFlBQVksQ0FBQ2hnQixZQUFiLENBQTBCelAsRUFBRSxDQUFDSyxLQUE3QixDQUFwQjtFQUNBcXZCLGFBQWEsQ0FBQzNzQixNQUFkLEdBQXVCLFFBQXZCO0VBQ0Eyc0IsYUFBYSxDQUFDaGdCLFFBQWQsR0FBeUIsRUFBekI7RUFDQWdnQixhQUFhLENBQUM5ZixlQUFkLEdBQWdDNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUF6RDtFQUNBMmYsWUFBWSxDQUFDMWYsS0FBYixHQUFxQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFyQjtFQUNBMGYsWUFBWSxDQUFDeGdCLE1BQWIsR0FBc0JxYixNQUF0QixDQS9Fa0QsQ0FpRmxEOztFQUNBLElBQUlxRixhQUFhLEdBQUcsSUFBSTN2QixFQUFFLENBQUNxTixJQUFQLENBQVksZUFBWixDQUFwQjtFQUNBc2lCLGFBQWEsQ0FBQzNnQixjQUFkLENBQTZCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFRLEdBQVIsRUFBYSxHQUFiLENBQTdCO0VBQ0E2YyxhQUFhLENBQUNqb0IsQ0FBZCxHQUFrQixFQUFsQjtFQUNBaW9CLGFBQWEsQ0FBQzFnQixNQUFkLEdBQXVCcWIsTUFBdkIsQ0FyRmtELENBdUZsRDs7RUFDQSxJQUFJbUQsWUFBWSxHQUFHLElBQUl6dEIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLGNBQVosQ0FBbkI7RUFDQW9nQixZQUFZLENBQUMvbEIsQ0FBYixHQUFpQixDQUFqQjtFQUNBLElBQUkyaEIsT0FBTyxHQUFHb0UsWUFBWSxDQUFDaGUsWUFBYixDQUEwQnpQLEVBQUUsQ0FBQ0ssS0FBN0IsQ0FBZDtFQUNBZ3BCLE9BQU8sQ0FBQ3RtQixNQUFSLEdBQWlCLGFBQWpCO0VBQ0FzbUIsT0FBTyxDQUFDM1osUUFBUixHQUFtQixFQUFuQjtFQUNBMlosT0FBTyxDQUFDelosZUFBUixHQUEwQjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBbkQ7RUFDQTJkLFlBQVksQ0FBQzFkLEtBQWIsR0FBcUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBckI7RUFDQTBkLFlBQVksQ0FBQ3hlLE1BQWIsR0FBc0IwZ0IsYUFBdEIsQ0EvRmtELENBaUdsRDs7RUFDQSxJQUFJQyxZQUFZLEdBQUcsSUFBSTV2QixFQUFFLENBQUNxTixJQUFQLENBQVksY0FBWixDQUFuQjtFQUNBdWlCLFlBQVksQ0FBQ2xvQixDQUFiLEdBQWlCLENBQUMsRUFBbEI7RUFDQWtvQixZQUFZLENBQUMzZ0IsTUFBYixHQUFzQnFiLE1BQXRCLENBcEdrRCxDQXNHbEQ7O0VBQ0EsSUFBSXVGLGFBQWEsR0FBRyxLQUFLQyxhQUFMLENBQW1CLFNBQW5CLEVBQThCOXZCLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsR0FBYixFQUFrQixFQUFsQixDQUE5QixFQUFxRCxDQUFDLEdBQXRELEVBQTJELFlBQVc7SUFDdEZ1YSxNQUFNLENBQUNqYyxPQUFQOztJQUNBeE0sSUFBSSxDQUFDMlAsV0FBTCxDQUFpQi9FLFVBQWpCLEVBQTZCMEUsVUFBN0I7RUFDSCxDQUhtQixFQUdqQixHQUhpQixFQUdaLEVBSFksQ0FBcEI7O0VBSUEwZSxhQUFhLENBQUM1Z0IsTUFBZCxHQUF1QjJnQixZQUF2QixDQTNHa0QsQ0E2R2xEOztFQUNBLElBQUl2a0IsYUFBYSxHQUFHLEtBQUt5a0IsYUFBTCxDQUFtQixTQUFuQixFQUE4Qjl2QixFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEdBQWIsRUFBa0IsR0FBbEIsQ0FBOUIsRUFBc0QsQ0FBdEQsRUFBeUQsWUFBVztJQUNwRnVhLE1BQU0sQ0FBQ2pjLE9BQVA7O0lBQ0F4TSxJQUFJLENBQUMycUIsV0FBTCxDQUFpQi9mLFVBQWpCLEVBQTZCMEUsVUFBN0I7RUFDSCxDQUhtQixFQUdqQixHQUhpQixFQUdaLEVBSFksQ0FBcEI7O0VBSUE5RixhQUFhLENBQUM0RCxNQUFkLEdBQXVCMmdCLFlBQXZCLENBbEhrRCxDQW9IbEQ7O0VBQ0EsSUFBSTdFLFFBQVEsR0FBRyxLQUFLK0UsYUFBTCxDQUFtQixNQUFuQixFQUEyQjl2QixFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBM0IsRUFBb0QsR0FBcEQsRUFBeUQsWUFBVztJQUMvRXVhLE1BQU0sQ0FBQ2pjLE9BQVA7RUFDSCxDQUZjLEVBRVosR0FGWSxFQUVQLEVBRk8sQ0FBZjs7RUFHQTBjLFFBQVEsQ0FBQzliLE1BQVQsR0FBa0IyZ0IsWUFBbEIsQ0F4SGtELENBMEhsRDs7RUFDQSxJQUFJRyxjQUFjLEdBQUcsSUFBSS92QixFQUFFLENBQUNxTixJQUFQLENBQVksZ0JBQVosQ0FBckI7RUFDQTBpQixjQUFjLENBQUNyb0IsQ0FBZixHQUFtQixDQUFDLEdBQXBCO0VBQ0Fxb0IsY0FBYyxDQUFDOWdCLE1BQWYsR0FBd0JxYixNQUF4QjtFQUVBLElBQUkwRixVQUFVLEdBQUcsSUFBSWh3QixFQUFFLENBQUNxTixJQUFQLENBQVksWUFBWixDQUFqQjtFQUNBMmlCLFVBQVUsQ0FBQ3huQixDQUFYLEdBQWUsQ0FBQyxHQUFoQjtFQUNBLElBQUl5bkIsY0FBYyxHQUFHRCxVQUFVLENBQUN2Z0IsWUFBWCxDQUF3QnpQLEVBQUUsQ0FBQ0ssS0FBM0IsQ0FBckI7RUFDQTR2QixjQUFjLENBQUNsdEIsTUFBZixHQUF3QixNQUF4QjtFQUNBa3RCLGNBQWMsQ0FBQ3ZnQixRQUFmLEdBQTBCLEVBQTFCO0VBQ0FzZ0IsVUFBVSxDQUFDamdCLEtBQVgsR0FBbUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBbkI7RUFDQWlnQixVQUFVLENBQUMvZ0IsTUFBWCxHQUFvQjhnQixjQUFwQixDQXJJa0QsQ0F1SWxEOztFQUNBLElBQUlHLFdBQVcsR0FBRyxJQUFJbHdCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxTQUFaLENBQWxCO0VBQ0E2aUIsV0FBVyxDQUFDbGhCLGNBQVosQ0FBMkJoUCxFQUFFLENBQUM4UyxJQUFILENBQVEsR0FBUixFQUFhLEVBQWIsQ0FBM0I7RUFDQW9kLFdBQVcsQ0FBQzFuQixDQUFaLEdBQWdCLENBQUMsR0FBakI7RUFDQSxJQUFJMm5CLE9BQU8sR0FBR0QsV0FBVyxDQUFDemdCLFlBQVosQ0FBeUJ6UCxFQUFFLENBQUNrVCxRQUE1QixDQUFkO0VBQ0FpZCxPQUFPLENBQUNoZCxTQUFSLEdBQW9CblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCLEVBQXFCLEdBQXJCLENBQXBCO0VBQ0FvZ0IsT0FBTyxDQUFDL2MsU0FBUixDQUFrQixDQUFDLEVBQW5CLEVBQXVCLENBQUMsRUFBeEIsRUFBNEIsR0FBNUIsRUFBaUMsRUFBakMsRUFBcUMsQ0FBckM7RUFDQStjLE9BQU8sQ0FBQzljLElBQVI7RUFDQTZjLFdBQVcsQ0FBQ2poQixNQUFaLEdBQXFCOGdCLGNBQXJCO0VBRUEsSUFBSUssU0FBUyxHQUFHRixXQUFXLENBQUN6Z0IsWUFBWixDQUF5QnpQLEVBQUUsQ0FBQ0ssS0FBNUIsQ0FBaEI7RUFDQSt2QixTQUFTLENBQUNydEIsTUFBVixHQUFtQixTQUFuQjtFQUNBcXRCLFNBQVMsQ0FBQzFnQixRQUFWLEdBQXFCLEVBQXJCO0VBQ0EwZ0IsU0FBUyxDQUFDeGdCLGVBQVYsR0FBNEI1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQXJEO0VBQ0FzZ0IsU0FBUyxDQUFDNWMsYUFBVixHQUEwQnhULEVBQUUsQ0FBQ0ssS0FBSCxDQUFTb1QsYUFBVCxDQUF1QjNELE1BQWpELENBckprRCxDQXVKbEQ7O0VBQ0EsSUFBSWtXLE9BQU8sR0FBRyxLQUFLOEosYUFBTCxDQUFtQixNQUFuQixFQUEyQjl2QixFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsRUFBbkIsQ0FBM0IsRUFBbUQsR0FBbkQsRUFBd0QsWUFBVztJQUM3RSxJQUFJbWQsUUFBUSxHQUFHa0QsU0FBUyxDQUFDcnRCLE1BQXpCOztJQUNBLElBQUltcUIsUUFBUSxJQUFJQSxRQUFRLEtBQUssU0FBN0IsRUFBd0M7TUFDcEM1QyxNQUFNLENBQUNqYyxPQUFQOztNQUNBeE0sSUFBSSxDQUFDd2tCLFNBQUwsQ0FBZTZHLFFBQWYsRUFBeUJ6Z0IsVUFBekIsRUFBcUMwRSxVQUFyQztJQUNILENBSEQsTUFHTztNQUNIdFAsSUFBSSxDQUFDbWIsa0JBQUwsQ0FBd0IsUUFBeEI7SUFDSDtFQUNKLENBUmEsRUFRWCxFQVJXLEVBUVAsRUFSTyxDQUFkOztFQVNBZ0osT0FBTyxDQUFDL1csTUFBUixHQUFpQjhnQixjQUFqQixDQWpLa0QsQ0FtS2xEOztFQUNBLElBQUkxTixPQUFPLEdBQUcsSUFBSXJpQixFQUFFLENBQUNxTixJQUFQLENBQVksS0FBWixDQUFkO0VBQ0FnVixPQUFPLENBQUMzYSxDQUFSLEdBQVksQ0FBQyxHQUFiO0VBQ0EsSUFBSTRhLFFBQVEsR0FBR0QsT0FBTyxDQUFDNVMsWUFBUixDQUFxQnpQLEVBQUUsQ0FBQ0ssS0FBeEIsQ0FBZjtFQUNBaWlCLFFBQVEsQ0FBQ3ZmLE1BQVQsR0FBa0Isa0JBQWxCO0VBQ0F1ZixRQUFRLENBQUM1UyxRQUFULEdBQW9CLEVBQXBCO0VBQ0E0UyxRQUFRLENBQUMxUyxlQUFULEdBQTJCNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUFwRDtFQUNBdVMsT0FBTyxDQUFDdFMsS0FBUixHQUFnQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFoQjtFQUNBc1MsT0FBTyxDQUFDcFQsTUFBUixHQUFpQnFiLE1BQWpCLENBM0trRCxDQTZLbEQ7O0VBQ0EsS0FBSytGLGNBQUwsQ0FBb0JWLGFBQXBCLEVBQW1DbEMsWUFBbkM7QUFDSCxDQXppSkwsWUE0aUpJcUMsYUE1aUpKLEdBNGlKbUIsdUJBQVNySSxJQUFULEVBQWUxWCxLQUFmLEVBQXNCdkgsQ0FBdEIsRUFBeUJrZixRQUF6QixFQUFtQ3pnQixLQUFuQyxFQUEwQ0YsTUFBMUMsRUFBa0Q7RUFDN0RFLEtBQUssR0FBR0EsS0FBSyxJQUFJLEdBQWpCO0VBQ0FGLE1BQU0sR0FBR0EsTUFBTSxJQUFJLEVBQW5CO0VBRUEsSUFBSUssR0FBRyxHQUFHLElBQUlwSCxFQUFFLENBQUNxTixJQUFQLENBQVlvYSxJQUFJLEdBQUcsS0FBbkIsQ0FBVjtFQUNBcmdCLEdBQUcsQ0FBQzRILGNBQUosQ0FBbUJoUCxFQUFFLENBQUM4UyxJQUFILENBQVE3TCxLQUFSLEVBQWVGLE1BQWYsQ0FBbkI7RUFDQUssR0FBRyxDQUFDb0IsQ0FBSixHQUFRQSxDQUFSLENBTjZELENBUTdEOztFQUNBLElBQUlzZSxFQUFFLEdBQUcxZixHQUFHLENBQUNxSSxZQUFKLENBQWlCelAsRUFBRSxDQUFDa1QsUUFBcEIsQ0FBVDtFQUNBNFQsRUFBRSxDQUFDM1QsU0FBSCxHQUFlcEQsS0FBZjtFQUNBK1csRUFBRSxDQUFDMVQsU0FBSCxDQUFhLENBQUNuTSxLQUFELEdBQU8sQ0FBcEIsRUFBdUIsQ0FBQ0YsTUFBRCxHQUFRLENBQS9CLEVBQWtDRSxLQUFsQyxFQUF5Q0YsTUFBekMsRUFBaUQsQ0FBakQ7RUFDQStmLEVBQUUsQ0FBQ3pULElBQUgsR0FaNkQsQ0FjN0Q7O0VBQ0EsSUFBSTdELEtBQUssR0FBR3BJLEdBQUcsQ0FBQ3FJLFlBQUosQ0FBaUJ6UCxFQUFFLENBQUNLLEtBQXBCLENBQVo7RUFDQW1QLEtBQUssQ0FBQ3pNLE1BQU4sR0FBZTBrQixJQUFmO0VBQ0FqWSxLQUFLLENBQUNFLFFBQU4sR0FBaUIsRUFBakI7RUFDQUYsS0FBSyxDQUFDSSxlQUFOLEdBQXdCNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUFqRDtFQUNBTixLQUFLLENBQUNnRSxhQUFOLEdBQXNCeFQsRUFBRSxDQUFDSyxLQUFILENBQVNvVCxhQUFULENBQXVCM0QsTUFBN0M7RUFDQTFJLEdBQUcsQ0FBQzJJLEtBQUosR0FBWS9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFaLENBcEI2RCxDQXNCN0Q7O0VBQ0EzSSxHQUFHLENBQUN6QyxFQUFKLENBQU8zRSxFQUFFLENBQUNxTixJQUFILENBQVFDLFNBQVIsQ0FBa0JzYSxXQUF6QixFQUFzQyxVQUFTcGEsS0FBVCxFQUFnQjtJQUNsREEsS0FBSyxDQUFDQyxlQUFOO0lBQ0FyRyxHQUFHLENBQUNlLEtBQUosR0FBWSxJQUFaO0VBQ0gsQ0FIRDtFQUlBZixHQUFHLENBQUN6QyxFQUFKLENBQU8zRSxFQUFFLENBQUNxTixJQUFILENBQVFDLFNBQVIsQ0FBa0JDLFNBQXpCLEVBQW9DLFVBQVNDLEtBQVQsRUFBZ0I7SUFDaERBLEtBQUssQ0FBQ0MsZUFBTjtJQUNBckcsR0FBRyxDQUFDZSxLQUFKLEdBQVksQ0FBWjtJQUNBLElBQUl1ZixRQUFKLEVBQWNBLFFBQVE7RUFDekIsQ0FKRDtFQUtBdGdCLEdBQUcsQ0FBQ3pDLEVBQUosQ0FBTzNFLEVBQUUsQ0FBQ3FOLElBQUgsQ0FBUUMsU0FBUixDQUFrQnVhLFlBQXpCLEVBQXVDLFVBQVNyYSxLQUFULEVBQWdCO0lBQ25EcEcsR0FBRyxDQUFDZSxLQUFKLEdBQVksQ0FBWjtFQUNILENBRkQ7RUFJQSxPQUFPZixHQUFQO0FBQ0gsQ0FqbEpMLFlBb2xKSWlwQixjQXBsSkosR0FvbEpvQix3QkFBU2pILFNBQVQsRUFBb0JxRSxZQUFwQixFQUFrQztFQUM5QyxJQUFJNXJCLElBQUksR0FBRyxJQUFYO0VBQ0EsSUFBSWIsUUFBUSxHQUFHRCxNQUFNLENBQUNDLFFBQXRCO0VBQ0EsSUFBSTJFLE1BQU0sR0FBRzNFLFFBQVEsSUFBSUEsUUFBUSxDQUFDMkUsTUFBckIsR0FBOEIzRSxRQUFRLENBQUMyRSxNQUF2QyxHQUFnRCxJQUE3RCxDQUg4QyxDQUs5Qzs7RUFDQSxJQUFJRSxXQUFXLEdBQUdGLE1BQU0sSUFBSUEsTUFBTSxDQUFDRSxXQUFqQixJQUFnQ0YsTUFBTSxDQUFDRSxXQUFQLEVBQWxEO0VBQ0EsSUFBSUQsZUFBZSxHQUFHRCxNQUFNLElBQUlBLE1BQU0sQ0FBQ0MsZUFBakIsSUFBb0NELE1BQU0sQ0FBQ0MsZUFBUCxFQUExRCxDQVA4QyxDQVU5Qzs7RUFDQSxJQUFJLENBQUNELE1BQUQsSUFBVyxDQUFDRSxXQUFaLElBQTJCLENBQUNELGVBQWhDLEVBQWlEO0lBQzdDNm5CLFlBQVksQ0FBQ3JxQixZQUFiLENBQTBCcEQsRUFBRSxDQUFDSyxLQUE3QixFQUFvQzBDLE1BQXBDLEdBQTZDLFFBQTdDO0lBRUEsS0FBS2tDLFlBQUwsQ0FBa0IsWUFBVztNQUN6QixJQUFJd29CLFlBQVksSUFBSUEsWUFBWSxDQUFDaHNCLE9BQWpDLEVBQTBDO1FBQ3RDZ3NCLFlBQVksQ0FBQ3BmLE9BQWI7TUFDSCxDQUh3QixDQUl6Qjs7O01BQ0F4TSxJQUFJLENBQUN5dUIsZUFBTCxDQUFxQmxILFNBQXJCLEVBQWdDLEVBQWhDO0lBQ0gsQ0FORCxFQU1HLEdBTkg7SUFPQTtFQUNILENBdEI2QyxDQXdCOUM7OztFQUNBLElBQUlvRixTQUFTLEdBQUd0c0IsVUFBVSxDQUFDLFlBQVc7SUFDbEMsSUFBSXVyQixZQUFZLElBQUlBLFlBQVksQ0FBQ2hzQixPQUFqQyxFQUEwQztNQUN0Q2dzQixZQUFZLENBQUNwZixPQUFiO0lBQ0gsQ0FIaUMsQ0FJbEM7OztJQUNBeE0sSUFBSSxDQUFDeXVCLGVBQUwsQ0FBcUJsSCxTQUFyQixFQUFnQyxFQUFoQztFQUNILENBTnlCLEVBTXZCLElBTnVCLENBQTFCO0VBUUF6akIsTUFBTSxDQUFDOG9CLFdBQVAsQ0FBbUIsVUFBU3RrQixNQUFULEVBQWlCb0IsS0FBakIsRUFBd0I7SUFDdkM0UixZQUFZLENBQUNxUixTQUFELENBQVo7O0lBRUEsSUFBSWYsWUFBWSxJQUFJQSxZQUFZLENBQUNoc0IsT0FBakMsRUFBMEM7TUFDdENnc0IsWUFBWSxDQUFDcGYsT0FBYjtJQUNIOztJQUVELElBQUlsRSxNQUFNLEtBQUssQ0FBWCxJQUFnQm9CLEtBQWhCLElBQXlCQSxLQUFLLENBQUNsRixNQUFOLEdBQWUsQ0FBNUMsRUFBK0M7TUFDM0N4RSxJQUFJLENBQUN5dUIsZUFBTCxDQUFxQmxILFNBQXJCLEVBQWdDN2QsS0FBaEM7SUFDSCxDQUZELE1BRU87TUFDSDtNQUNBMUosSUFBSSxDQUFDeXVCLGVBQUwsQ0FBcUJsSCxTQUFyQixFQUFnQyxFQUFoQztJQUNIO0VBQ0osQ0FiRDtBQWNILENBbm9KTCxZQXNvSklrSCxlQXRvSkosR0Fzb0pxQix5QkFBU2xILFNBQVQsRUFBb0I3ZCxLQUFwQixFQUEyQjtFQUN4QyxJQUFJMUosSUFBSSxHQUFHLElBQVgsQ0FEd0MsQ0FHeEM7O0VBQ0EsSUFBSSxDQUFDMEosS0FBRCxJQUFVQSxLQUFLLENBQUNsRixNQUFOLEtBQWlCLENBQS9CLEVBQWtDO0lBQzlCLElBQUl1b0IsU0FBUyxHQUFHLElBQUk1dUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFVBQVosQ0FBaEI7SUFDQXVoQixTQUFTLENBQUNsbkIsQ0FBVixHQUFjLENBQWQ7SUFFQSxJQUFJNm9CLE9BQU8sR0FBRzNCLFNBQVMsQ0FBQ25mLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUNrVCxRQUExQixDQUFkO0lBQ0FxZCxPQUFPLENBQUNwZCxTQUFSLEdBQW9CblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCLEVBQXFCLEdBQXJCLENBQXBCO0lBQ0F3Z0IsT0FBTyxDQUFDbmQsU0FBUixDQUFrQixDQUFDLEdBQW5CLEVBQXdCLENBQUMsRUFBekIsRUFBNkIsR0FBN0IsRUFBa0MsRUFBbEMsRUFBc0MsQ0FBdEM7SUFDQW1kLE9BQU8sQ0FBQ2xkLElBQVI7SUFDQWtkLE9BQU8sQ0FBQ3BWLFdBQVIsR0FBc0JuYixFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEVBQWQsRUFBa0IsRUFBbEIsRUFBc0IsR0FBdEIsQ0FBdEI7SUFDQXdnQixPQUFPLENBQUNuVixTQUFSLEdBQW9CLENBQXBCO0lBQ0FtVixPQUFPLENBQUNuZCxTQUFSLENBQWtCLENBQUMsR0FBbkIsRUFBd0IsQ0FBQyxFQUF6QixFQUE2QixHQUE3QixFQUFrQyxFQUFsQyxFQUFzQyxDQUF0QztJQUNBbWQsT0FBTyxDQUFDbFYsTUFBUjtJQUVBLElBQUltVixVQUFVLEdBQUcsSUFBSXh3QixFQUFFLENBQUNxTixJQUFQLENBQVksT0FBWixDQUFqQjtJQUNBbWpCLFVBQVUsQ0FBQ3BvQixPQUFYLEdBQXFCLEdBQXJCO0lBQ0Fvb0IsVUFBVSxDQUFDbm9CLE9BQVgsR0FBcUIsR0FBckI7SUFDQSxJQUFJd21CLEVBQUUsR0FBRzJCLFVBQVUsQ0FBQy9nQixZQUFYLENBQXdCelAsRUFBRSxDQUFDSyxLQUEzQixDQUFUO0lBQ0F3dUIsRUFBRSxDQUFDOXJCLE1BQUgsR0FBWSxhQUFaO0lBQ0E4ckIsRUFBRSxDQUFDbmYsUUFBSCxHQUFjLEVBQWQ7SUFDQW1mLEVBQUUsQ0FBQ2pmLGVBQUgsR0FBcUI1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQTlDO0lBQ0EwZ0IsVUFBVSxDQUFDemdCLEtBQVgsR0FBbUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBbkI7SUFDQXlnQixVQUFVLENBQUN2aEIsTUFBWCxHQUFvQjJmLFNBQXBCO0lBRUFBLFNBQVMsQ0FBQzNmLE1BQVYsR0FBbUJtYSxTQUFuQjtJQUNBO0VBQ0g7O0VBRUQsS0FBSyxJQUFJaGpCLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdtRixLQUFLLENBQUNsRixNQUFWLElBQW9CRCxDQUFDLEdBQUcsQ0FBeEMsRUFBMkNBLENBQUMsRUFBNUMsRUFBZ0Q7SUFDNUMsSUFBSW9HLElBQUksR0FBR2pCLEtBQUssQ0FBQ25GLENBQUQsQ0FBaEI7SUFDQSxJQUFJcXFCLElBQUksR0FBRyxJQUFJendCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxjQUFjakgsQ0FBMUIsQ0FBWDtJQUNBcXFCLElBQUksQ0FBQ3poQixjQUFMLENBQW9CaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFRLEdBQVIsRUFBYSxFQUFiLENBQXBCO0lBQ0EyZCxJQUFJLENBQUMvb0IsQ0FBTCxHQUFTLEtBQUt0QixDQUFDLEdBQUcsRUFBbEI7SUFFQSxJQUFJMGdCLEVBQUUsR0FBRzJKLElBQUksQ0FBQ2hoQixZQUFMLENBQWtCelAsRUFBRSxDQUFDTyxNQUFyQixDQUFUO0lBQ0F1bUIsRUFBRSxDQUFDL1csS0FBSCxHQUFXM0osQ0FBQyxHQUFHLENBQUosS0FBVSxDQUFWLEdBQWNwRyxFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakIsQ0FBZCxHQUFxQy9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixDQUFoRCxDQVA0QyxDQVM1Qzs7SUFDQSxJQUFJMmdCLFNBQVMsR0FBRyxJQUFJMXdCLEVBQUUsQ0FBQ3FOLElBQVAsRUFBaEI7SUFDQXFqQixTQUFTLENBQUNsb0IsQ0FBVixHQUFjLENBQUMsR0FBZjtJQUNBLElBQUk2QixJQUFJLEdBQUdxbUIsU0FBUyxDQUFDamhCLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUNLLEtBQTFCLENBQVg7SUFDQWdLLElBQUksQ0FBQ3RILE1BQUwsR0FBYyxVQUFVeUosSUFBSSxDQUFDK1EsU0FBTCxJQUFrQi9RLElBQUksQ0FBQzBnQixRQUF2QixJQUFtQyxJQUE3QyxDQUFkO0lBQ0E3aUIsSUFBSSxDQUFDcUYsUUFBTCxHQUFnQixFQUFoQjtJQUNBZ2hCLFNBQVMsQ0FBQzNnQixLQUFWLEdBQWtCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWxCO0lBQ0EyZ0IsU0FBUyxDQUFDemhCLE1BQVYsR0FBbUJ3aEIsSUFBbkIsQ0FoQjRDLENBa0I1Qzs7SUFDQSxJQUFJRSxVQUFVLEdBQUcsSUFBSTN3QixFQUFFLENBQUNxTixJQUFQLEVBQWpCO0lBQ0FzakIsVUFBVSxDQUFDbm9CLENBQVgsR0FBZSxFQUFmO0lBQ0EsSUFBSTBsQixLQUFLLEdBQUd5QyxVQUFVLENBQUNsaEIsWUFBWCxDQUF3QnpQLEVBQUUsQ0FBQ0ssS0FBM0IsQ0FBWjtJQUNBNnRCLEtBQUssQ0FBQ25yQixNQUFOLEdBQWUsVUFBVXlKLElBQUksQ0FBQzJoQixZQUFMLElBQXFCM2hCLElBQUksQ0FBQzRoQixXQUExQixJQUF5QyxDQUFuRCxJQUF3RCxJQUF2RTtJQUNBRixLQUFLLENBQUN4ZSxRQUFOLEdBQWlCLEVBQWpCO0lBQ0FpaEIsVUFBVSxDQUFDNWdCLEtBQVgsR0FBbUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBbkI7SUFDQTRnQixVQUFVLENBQUMxaEIsTUFBWCxHQUFvQndoQixJQUFwQixDQXpCNEMsQ0EyQjVDOztJQUNBLElBQUl6SyxPQUFPLEdBQUcsS0FBSzhKLGFBQUwsQ0FBbUIsSUFBbkIsRUFBeUI5dkIsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxHQUFiLEVBQWtCLEVBQWxCLENBQXpCLEVBQWdELEdBQWhELEVBQXFELFlBQVc7TUFDMUUsSUFBSW1kLFFBQVEsR0FBRzFnQixJQUFJLENBQUMrUSxTQUFMLElBQWtCL1EsSUFBSSxDQUFDMGdCLFFBQXRDOztNQUNBcnJCLElBQUksQ0FBQ3drQixTQUFMLENBQWU2RyxRQUFmLEVBQXlCbHNCLFFBQVEsQ0FBQ3FRLGlCQUFsQyxFQUFxRHJRLFFBQVEsQ0FBQ2lCLFVBQVQsQ0FBb0J6QixXQUF6RTtJQUNILENBSGEsQ0FBZDs7SUFJQXdsQixPQUFPLENBQUNoWCxjQUFSLENBQXVCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFRLEVBQVIsRUFBWSxFQUFaLENBQXZCO0lBQ0FrVCxPQUFPLENBQUN4ZCxDQUFSLEdBQVksR0FBWjtJQUNBd2QsT0FBTyxDQUFDL1csTUFBUixHQUFpQndoQixJQUFqQjtJQUVBQSxJQUFJLENBQUN4aEIsTUFBTCxHQUFjbWEsU0FBZDtFQUNIO0FBQ0osQ0Ezc0pMLFlBOHNKSTVYLFdBOXNKSixHQThzSmlCLHFCQUFTL0UsVUFBVCxFQUFxQjBFLFVBQXJCLEVBQWlDO0VBQzFDLElBQUl0UCxJQUFJLEdBQUcsSUFBWDtFQUNBLElBQUliLFFBQVEsR0FBR0QsTUFBTSxDQUFDQyxRQUF0QjtFQUNBLElBQUkyRSxNQUFNLEdBQUczRSxRQUFRLElBQUlBLFFBQVEsQ0FBQzJFLE1BQXJCLEdBQThCM0UsUUFBUSxDQUFDMkUsTUFBdkMsR0FBZ0QsSUFBN0QsQ0FIMEMsQ0FLMUM7O0VBQ0EsSUFBSUMsZUFBZSxHQUFHRCxNQUFNLElBQUlBLE1BQU0sQ0FBQ0MsZUFBakIsSUFBb0NELE1BQU0sQ0FBQ0MsZUFBUCxFQUExRDs7RUFFQSxLQUFLb1gsa0JBQUwsQ0FBd0IsV0FBeEIsRUFSMEMsQ0FVMUM7OztFQUNBLElBQUksQ0FBQ3JYLE1BQUQsSUFBVyxDQUFDQyxlQUFoQixFQUFpQztJQUU3QjtJQUNBLElBQUlELE1BQU0sSUFBSUEsTUFBTSxDQUFDRyxVQUFyQixFQUFpQztNQUM3QkgsTUFBTSxDQUFDRyxVQUFQO0lBQ0gsQ0FMNEIsQ0FPN0I7OztJQUNBLEtBQUs4cUIsK0JBQUwsQ0FBcUNua0IsVUFBckMsRUFBaUQwRSxVQUFqRDs7SUFDQTtFQUNILENBckJ5QyxDQXVCMUM7OztFQUNBLEtBQUswZixXQUFMLENBQWlCcGtCLFVBQWpCLEVBQTZCMEUsVUFBN0I7QUFDSCxDQXZ1SkwsWUEwdUpJMGYsV0ExdUpKLEdBMHVKaUIscUJBQVNwa0IsVUFBVCxFQUFxQjBFLFVBQXJCLEVBQWlDO0VBQzFDLElBQUl0UCxJQUFJLEdBQUcsSUFBWDtFQUNBLElBQUliLFFBQVEsR0FBR0QsTUFBTSxDQUFDQyxRQUF0QjtFQUNBLElBQUkyRSxNQUFNLEdBQUczRSxRQUFRLElBQUlBLFFBQVEsQ0FBQzJFLE1BQXJCLEdBQThCM0UsUUFBUSxDQUFDMkUsTUFBdkMsR0FBZ0QsSUFBN0Q7O0VBRUEsSUFBSSxDQUFDQSxNQUFMLEVBQWE7SUFDVDlELElBQUksQ0FBQ2l2QixrQkFBTDs7SUFDQWp2QixJQUFJLENBQUNpRCxZQUFMLENBQWtCLGVBQWxCOztJQUNBO0VBQ0gsQ0FUeUMsQ0FZMUM7OztFQUNBLElBQUlhLE1BQU0sQ0FBQzhvQixXQUFYLEVBQXdCO0lBQ3BCOW9CLE1BQU0sQ0FBQzhvQixXQUFQLENBQW1CLFVBQVN0a0IsTUFBVCxFQUFpQm9CLEtBQWpCLEVBQXdCO01BQ3ZDLElBQUlBLEtBQUssSUFBSUEsS0FBSyxDQUFDbEYsTUFBTixHQUFlLENBQTVCLEVBQStCLENBQzlCOztNQUVELElBQUk4RCxNQUFNLEtBQUssQ0FBWCxJQUFnQm9CLEtBQWhCLElBQXlCQSxLQUFLLENBQUNsRixNQUFOLEdBQWUsQ0FBNUMsRUFBK0M7UUFDM0M7UUFDQTtRQUNBLElBQUkwcUIsV0FBVyxHQUFHLElBQWxCOztRQUNBLEtBQUssSUFBSTNxQixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHbUYsS0FBSyxDQUFDbEYsTUFBMUIsRUFBa0NELENBQUMsRUFBbkMsRUFBdUM7VUFDbkMsSUFBSW9HLElBQUksR0FBR2pCLEtBQUssQ0FBQ25GLENBQUQsQ0FBaEIsQ0FEbUMsQ0FFbkM7O1VBQ0EsSUFBSWdvQixXQUFXLEdBQUc1aEIsSUFBSSxDQUFDMmhCLFlBQUwsS0FBc0JuckIsU0FBdEIsR0FBa0N3SixJQUFJLENBQUMyaEIsWUFBdkMsR0FBc0QzaEIsSUFBSSxDQUFDNGhCLFdBQTdFO1VBQ0EsSUFBSWxCLFFBQVEsR0FBRzFnQixJQUFJLENBQUMrUSxTQUFMLElBQWtCL1EsSUFBSSxDQUFDMGdCLFFBQXRDOztVQUdBLElBQUlrQixXQUFXLEdBQUcsQ0FBbEIsRUFBcUI7WUFDakIyQyxXQUFXLEdBQUd2a0IsSUFBZDtZQUNBO1VBQ0g7UUFDSjs7UUFFRCxJQUFJdWtCLFdBQUosRUFBaUI7VUFDYjtVQUNBLElBQUlDLGVBQWUsR0FBR0QsV0FBVyxDQUFDeFQsU0FBWixJQUF5QndULFdBQVcsQ0FBQzdELFFBQTNEOztVQUNBcnJCLElBQUksQ0FBQ21iLGtCQUFMLENBQXdCLGdCQUF4Qjs7VUFDQW5iLElBQUksQ0FBQ3drQixTQUFMLENBQWUySyxlQUFmLEVBQWdDdmtCLFVBQWhDLEVBQTRDMEUsVUFBNUM7O1VBQ0E7UUFDSDtNQUNKLENBNUJzQyxDQThCdkM7OztNQUNBdFAsSUFBSSxDQUFDbWIsa0JBQUwsQ0FBd0IsaUJBQXhCOztNQUNBbmIsSUFBSSxDQUFDMnFCLFdBQUwsQ0FBaUIvZixVQUFqQixFQUE2QjBFLFVBQTdCO0lBQ0gsQ0FqQ0Q7RUFrQ0gsQ0FuQ0QsTUFtQ087SUFDSDtJQUNBdFAsSUFBSSxDQUFDMnFCLFdBQUwsQ0FBaUIvZixVQUFqQixFQUE2QjBFLFVBQTdCO0VBQ0g7QUFDSixDQTl4SkwsWUFpeUpJeWYsK0JBanlKSixHQWl5SnFDLHlDQUFTbmtCLFVBQVQsRUFBcUIwRSxVQUFyQixFQUFpQztFQUM5RCxJQUFJdFAsSUFBSSxHQUFHLElBQVg7RUFDQSxJQUFJOEQsTUFBTSxHQUFHNUUsTUFBTSxDQUFDQyxRQUFQLElBQW1CRCxNQUFNLENBQUNDLFFBQVAsQ0FBZ0IyRSxNQUFuQyxHQUE0QzVFLE1BQU0sQ0FBQ0MsUUFBUCxDQUFnQjJFLE1BQTVELEdBQXFFLElBQWxGO0VBQ0EsSUFBSTdELFFBQVEsR0FBRyxDQUFmO0VBQ0EsSUFBSUMsV0FBVyxHQUFHLEVBQWxCLENBSjhELENBSXZDOztFQUV2QixJQUFJa3ZCLFVBQVUsR0FBRyxTQUFiQSxVQUFhLEdBQVc7SUFDeEJudkIsUUFBUTtJQUNSLElBQUk4RCxlQUFlLEdBQUdELE1BQU0sSUFBSUEsTUFBTSxDQUFDQyxlQUFqQixHQUFtQ0QsTUFBTSxDQUFDQyxlQUFQLEVBQW5DLEdBQThELEtBQXBGOztJQUdBLElBQUlBLGVBQUosRUFBcUI7TUFDakIvRCxJQUFJLENBQUNndkIsV0FBTCxDQUFpQnBrQixVQUFqQixFQUE2QjBFLFVBQTdCO0lBQ0gsQ0FGRCxNQUVPLElBQUlyUCxRQUFRLEdBQUdDLFdBQWYsRUFBNEI7TUFDL0JHLFVBQVUsQ0FBQyt1QixVQUFELEVBQWEsR0FBYixDQUFWLENBRCtCLENBQ0Q7SUFDakMsQ0FGTSxNQUVBO01BQ0hwdkIsSUFBSSxDQUFDaXZCLGtCQUFMOztNQUNBanZCLElBQUksQ0FBQ2lELFlBQUwsQ0FBa0Isa0JBQWxCO0lBQ0g7RUFDSixDQWJEOztFQWVBNUMsVUFBVSxDQUFDK3VCLFVBQUQsRUFBYSxHQUFiLENBQVYsQ0FyQjhELENBcUJoQztBQUNqQyxDQXZ6SkwsWUEwekpJQyxzQkExekpKLEdBMHpKNEIsZ0NBQVN6a0IsVUFBVCxFQUFxQjBFLFVBQXJCLEVBQWlDO0VBQ3JELElBQUl0UCxJQUFJLEdBQUcsSUFBWDtFQUNBLElBQUliLFFBQVEsR0FBR0QsTUFBTSxDQUFDQyxRQUF0QjtFQUNBLElBQUkyRSxNQUFNLEdBQUczRSxRQUFRLElBQUlBLFFBQVEsQ0FBQzJFLE1BQXJCLEdBQThCM0UsUUFBUSxDQUFDMkUsTUFBdkMsR0FBZ0QsSUFBN0Q7O0VBRUEsSUFBSSxDQUFDQSxNQUFELElBQVcsQ0FBQ0EsTUFBTSxDQUFDd3JCLGtCQUF2QixFQUEyQztJQUN2Q3R2QixJQUFJLENBQUNpdkIsa0JBQUw7O0lBQ0FqdkIsSUFBSSxDQUFDaUQsWUFBTCxDQUFrQixlQUFsQjs7SUFDQTtFQUNILENBVG9ELENBWXJEOzs7RUFDQSxJQUFJLEtBQUtzc0IsaUJBQVQsRUFBNEI7SUFDeEJqVSxZQUFZLENBQUMsS0FBS2lVLGlCQUFOLENBQVo7SUFDQSxLQUFLQSxpQkFBTCxHQUF5QixJQUF6QjtFQUNIOztFQUVEenJCLE1BQU0sQ0FBQ3dyQixrQkFBUCxDQUEwQjtJQUFFRSxVQUFVLEVBQUU1a0IsVUFBVSxDQUFDOUI7RUFBekIsQ0FBMUIsRUFBZ0UsVUFBU1IsTUFBVCxFQUFpQnZGLElBQWpCLEVBQXVCO0lBQ25GO0lBQ0EsSUFBSS9DLElBQUksQ0FBQ3V2QixpQkFBVCxFQUE0QjtNQUN4QmpVLFlBQVksQ0FBQ3RiLElBQUksQ0FBQ3V2QixpQkFBTixDQUFaO01BQ0F2dkIsSUFBSSxDQUFDdXZCLGlCQUFMLEdBQXlCLElBQXpCO0lBQ0g7O0lBR0QsSUFBSWpuQixNQUFNLEtBQUssQ0FBWCxJQUFnQnZGLElBQXBCLEVBQTBCO01BQ3RCLElBQUk1RCxRQUFKLEVBQWM7UUFDVkEsUUFBUSxDQUFDaUwsUUFBVCxHQUFvQnJILElBQXBCO1FBQ0E1RCxRQUFRLENBQUNpQixVQUFULENBQW9CaWQsTUFBcEIsR0FBNkJ6UyxVQUFVLENBQUM3QixVQUFYLElBQXlCLENBQXREO1FBQ0E1SixRQUFRLENBQUNpQixVQUFULENBQW9Ca2QsSUFBcEIsR0FBMkIxUyxVQUFVLENBQUM1QixVQUFYLElBQXlCLENBQXBEO01BQ0g7O01BQ0RoSixJQUFJLENBQUM2YyxlQUFMLENBQXFCOVosSUFBckI7SUFDSCxDQVBELE1BT087TUFDSC9DLElBQUksQ0FBQ2l2QixrQkFBTDs7TUFDQWp2QixJQUFJLENBQUNpRCxZQUFMLENBQWtCLFlBQWxCO0lBQ0g7RUFDSixDQW5CRCxFQWxCcUQsQ0F1Q3JEOztFQUNBLEtBQUtzc0IsaUJBQUwsR0FBeUJsdkIsVUFBVSxDQUFDLFlBQVc7SUFDM0NMLElBQUksQ0FBQ3V2QixpQkFBTCxHQUF5QixJQUF6Qjs7SUFDQXZ2QixJQUFJLENBQUNpdkIsa0JBQUw7O0lBQ0FqdkIsSUFBSSxDQUFDaUQsWUFBTCxDQUFrQixjQUFsQjtFQUNILENBSmtDLEVBSWhDLEtBSmdDLENBQW5DLENBeENxRCxDQTRDekM7QUFDZixDQXYySkwsWUEwMkpJMG5CLFdBMTJKSixHQTAySmlCLHFCQUFTL2YsVUFBVCxFQUFxQjBFLFVBQXJCLEVBQWlDO0VBQzFDLElBQUl0UCxJQUFJLEdBQUcsSUFBWDtFQUNBLElBQUliLFFBQVEsR0FBR0QsTUFBTSxDQUFDQyxRQUF0QjtFQUNBLElBQUkyRSxNQUFNLEdBQUczRSxRQUFRLElBQUlBLFFBQVEsQ0FBQzJFLE1BQXJCLEdBQThCM0UsUUFBUSxDQUFDMkUsTUFBdkMsR0FBZ0QsSUFBN0QsQ0FIMEMsQ0FLMUM7O0VBQ0EsSUFBSUMsZUFBZSxHQUFHRCxNQUFNLElBQUlBLE1BQU0sQ0FBQ0MsZUFBakIsSUFBb0NELE1BQU0sQ0FBQ0MsZUFBUCxFQUExRDs7RUFFQSxLQUFLb1gsa0JBQUwsQ0FBd0IsV0FBeEIsRUFSMEMsQ0FVMUM7OztFQUNBLElBQUksQ0FBQ3JYLE1BQUQsSUFBVyxDQUFDQyxlQUFoQixFQUFpQztJQUM3QixJQUFJRCxNQUFNLElBQUlBLE1BQU0sQ0FBQ0csVUFBckIsRUFBaUM7TUFDN0JILE1BQU0sQ0FBQ0csVUFBUDtJQUNIOztJQUNELEtBQUt3ckIsK0JBQUwsQ0FBcUM3a0IsVUFBckMsRUFBaUQwRSxVQUFqRDs7SUFDQTtFQUNILENBakJ5QyxDQW1CMUM7OztFQUNBLEtBQUtvZ0Isc0JBQUwsQ0FBNEI5a0IsVUFBNUIsRUFBd0MwRSxVQUF4QztBQUNILENBLzNKTCxZQWs0SklvZ0Isc0JBbDRKSixHQWs0SjRCLGdDQUFTOWtCLFVBQVQsRUFBcUIwRSxVQUFyQixFQUFpQztFQUNyRCxJQUFJdFAsSUFBSSxHQUFHLElBQVg7RUFDQSxJQUFJYixRQUFRLEdBQUdELE1BQU0sQ0FBQ0MsUUFBdEI7RUFDQSxJQUFJMkUsTUFBTSxHQUFHM0UsUUFBUSxJQUFJQSxRQUFRLENBQUMyRSxNQUFyQixHQUE4QjNFLFFBQVEsQ0FBQzJFLE1BQXZDLEdBQWdELElBQTdEOztFQUVBLElBQUksQ0FBQ0EsTUFBRCxJQUFXLENBQUNBLE1BQU0sQ0FBQzZyQixVQUF2QixFQUFtQztJQUMvQjN2QixJQUFJLENBQUNpdkIsa0JBQUw7O0lBQ0FqdkIsSUFBSSxDQUFDaUQsWUFBTCxDQUFrQixlQUFsQjs7SUFDQTtFQUNILENBVG9ELENBWXJEOzs7RUFDQSxJQUFJMnNCLFFBQVEsR0FBRyxFQUFmOztFQUNBLElBQUk5ckIsTUFBTSxDQUFDK3JCLGFBQVgsRUFBMEI7SUFDdEIsSUFBSUMsVUFBVSxHQUFHaHNCLE1BQU0sQ0FBQytyQixhQUFQLEVBQWpCO0lBQ0FELFFBQVEsR0FBR0UsVUFBVSxDQUFDbG5CLEVBQXRCO0VBQ0gsQ0FqQm9ELENBbUJyRDs7O0VBQ0EsSUFBSW1uQixZQUFZLEdBQUdubEIsVUFBVSxHQUFHQSxVQUFVLENBQUNoQyxFQUFkLEdBQW1CLElBQWhEO0VBQ0E5RSxNQUFNLENBQUM2ckIsVUFBUCxDQUFrQkksWUFBbEIsRUFBZ0MsVUFBU3puQixNQUFULEVBQWlCdkYsSUFBakIsRUFBdUI7SUFDbkQsSUFBSXVGLE1BQU0sS0FBSyxDQUFYLElBQWdCdkYsSUFBcEIsRUFBMEI7TUFDdEI7TUFDQSxJQUFJaXRCLFlBQVksR0FBR2p0QixJQUFJLENBQUM2WSxNQUFMLElBQWUsRUFBbEM7TUFDQSxJQUFJeGIsVUFBVSxHQUFHO1FBQ2I4YixTQUFTLEVBQUU4VCxZQUFZLENBQUNwbkIsRUFBYixJQUFtQmduQixRQUFuQixJQUErQnp3QixRQUFRLENBQUNpQixVQUFULENBQW9CNnZCLFNBQW5ELElBQWdFOXdCLFFBQVEsQ0FBQ2lCLFVBQVQsQ0FBb0I4dkIsUUFEbEY7UUFFYi9ULFNBQVMsRUFBRTZULFlBQVksQ0FBQ3RxQixJQUFiLElBQXFCdkcsUUFBUSxDQUFDaUIsVUFBVCxDQUFvQlcsUUFGdkM7UUFHYkMsU0FBUyxFQUFFN0IsUUFBUSxDQUFDaUIsVUFBVCxDQUFvQlksU0FBcEIsSUFBaUMsVUFIL0I7UUFJYnFiLFVBQVUsRUFBRTJULFlBQVksQ0FBQzNULFVBQWIsSUFBMkIvTSxVQUEzQixJQUF5QyxDQUp4QztRQUk0QztRQUN6RGdOLFNBQVMsRUFBRTBULFlBQVksQ0FBQzNULFVBQWIsSUFBMkIvTSxVQUEzQixJQUF5QyxDQUx2QztRQUs0QztRQUN6RHFNLFNBQVMsRUFBRSxDQUFDcVUsWUFBWSxDQUFDblUsSUFBYixLQUFzQjFhLFNBQXRCLEdBQWtDNnVCLFlBQVksQ0FBQ25VLElBQS9DLEdBQXNELENBQXZELElBQTRELENBTjFEO1FBT2JVLE9BQU8sRUFBRXlULFlBQVksQ0FBQ3hULEtBQWIsSUFBc0IsSUFQbEIsQ0FPd0I7O01BUHhCLENBQWpCLENBSHNCLENBYXRCOztNQUNBLElBQUlwUyxRQUFRLEdBQUc7UUFDWHFSLE1BQU0sRUFBRTFZLElBQUksQ0FBQzJZLFNBQUwsSUFBa0IzWSxJQUFJLENBQUNzb0IsUUFBdkIsSUFBbUMsVUFEaEM7UUFFWDNQLFNBQVMsRUFBRTNZLElBQUksQ0FBQzJZLFNBQUwsSUFBa0IzWSxJQUFJLENBQUNzb0IsUUFBdkIsSUFBbUMsVUFGbkM7UUFHWDFQLFNBQVMsRUFBRSxDQUFDcVUsWUFBWSxDQUFDblUsSUFBYixLQUFzQjFhLFNBQXRCLEdBQWtDNnVCLFlBQVksQ0FBQ25VLElBQS9DLEdBQXNELENBQXZELElBQTRELENBSDVEO1FBSVhDLFVBQVUsRUFBRSxDQUFDMWIsVUFBRCxDQUpEO1FBS1h1YyxhQUFhLEVBQUVxVCxZQUFZLENBQUNwbkIsRUFBYixJQUFtQmduQixRQUFuQixJQUErQnp3QixRQUFRLENBQUNpQixVQUFULENBQW9CNnZCLFNBQW5ELElBQWdFOXdCLFFBQVEsQ0FBQ2lCLFVBQVQsQ0FBb0I4dkI7TUFMeEYsQ0FBZjtNQU9BL3dCLFFBQVEsQ0FBQ2lMLFFBQVQsR0FBb0JBLFFBQXBCO01BQ0FqTCxRQUFRLENBQUNpQixVQUFULENBQW9CaWQsTUFBcEIsR0FBNkJ6UyxVQUFVLENBQUM3QixVQUFYLElBQXlCLENBQXREO01BQ0E1SixRQUFRLENBQUNpQixVQUFULENBQW9Ca2QsSUFBcEIsR0FBMkIxUyxVQUFVLENBQUM1QixVQUFYLElBQXlCLENBQXBEO01BQ0E3SixRQUFRLENBQUNpQixVQUFULENBQW9CcWIsTUFBcEIsR0FBNkJyUixRQUFRLENBQUNzUixTQUF0QyxDQXhCc0IsQ0EwQnRCOztNQUNBLElBQUl2YyxRQUFRLENBQUMyRSxNQUFULElBQW1CM0UsUUFBUSxDQUFDMkUsTUFBVCxDQUFnQnFzQixpQkFBdkMsRUFBMEQ7UUFDdERoeEIsUUFBUSxDQUFDMkUsTUFBVCxDQUFnQnFzQixpQkFBaEI7TUFDSDs7TUFFRG53QixJQUFJLENBQUM2YyxlQUFMLENBQXFCelMsUUFBckI7SUFDSCxDQWhDRCxNQWdDTztNQUNIcEssSUFBSSxDQUFDaXZCLGtCQUFMOztNQUNBanZCLElBQUksQ0FBQ2lELFlBQUwsQ0FBa0IsY0FBbEI7SUFDSDtFQUNKLENBckNEO0FBc0NILENBNzdKTCxZQWc4Skl3c0IsK0JBaDhKSixHQWc4SnFDLHlDQUFTN2tCLFVBQVQsRUFBcUIwRSxVQUFyQixFQUFpQztFQUM5RCxJQUFJdFAsSUFBSSxHQUFHLElBQVg7RUFDQSxJQUFJOEQsTUFBTSxHQUFHNUUsTUFBTSxDQUFDQyxRQUFQLElBQW1CRCxNQUFNLENBQUNDLFFBQVAsQ0FBZ0IyRSxNQUFuQyxHQUE0QzVFLE1BQU0sQ0FBQ0MsUUFBUCxDQUFnQjJFLE1BQTVELEdBQXFFLElBQWxGO0VBQ0EsSUFBSTdELFFBQVEsR0FBRyxDQUFmO0VBQ0EsSUFBSUMsV0FBVyxHQUFHLEVBQWxCLENBSjhELENBSXZDOztFQUV2QixJQUFJa3ZCLFVBQVUsR0FBRyxTQUFiQSxVQUFhLEdBQVc7SUFDeEJudkIsUUFBUTtJQUNSLElBQUk4RCxlQUFlLEdBQUdELE1BQU0sSUFBSUEsTUFBTSxDQUFDQyxlQUFqQixHQUFtQ0QsTUFBTSxDQUFDQyxlQUFQLEVBQW5DLEdBQThELEtBQXBGOztJQUdBLElBQUlBLGVBQUosRUFBcUI7TUFDakIvRCxJQUFJLENBQUMwdkIsc0JBQUwsQ0FBNEI5a0IsVUFBNUIsRUFBd0MwRSxVQUF4QztJQUNILENBRkQsTUFFTyxJQUFJclAsUUFBUSxHQUFHQyxXQUFmLEVBQTRCO01BQy9CRyxVQUFVLENBQUMrdUIsVUFBRCxFQUFhLEdBQWIsQ0FBVixDQUQrQixDQUNEO0lBQ2pDLENBRk0sTUFFQTtNQUNIcHZCLElBQUksQ0FBQ2l2QixrQkFBTDs7TUFDQWp2QixJQUFJLENBQUNpRCxZQUFMLENBQWtCLGtCQUFsQjtJQUNIO0VBQ0osQ0FiRDs7RUFlQTVDLFVBQVUsQ0FBQyt1QixVQUFELEVBQWEsR0FBYixDQUFWLENBckI4RCxDQXFCaEM7QUFDakMsQ0F0OUpMLFlBeTlKSTVLLFNBejlKSixHQXk5SmUsbUJBQVM2RyxRQUFULEVBQW1CemdCLFVBQW5CLEVBQStCMEUsVUFBL0IsRUFBMkM7RUFDbEQsSUFBSXRQLElBQUksR0FBRyxJQUFYO0VBQ0EsSUFBSWIsUUFBUSxHQUFHRCxNQUFNLENBQUNDLFFBQXRCO0VBQ0EsSUFBSTJFLE1BQU0sR0FBRzNFLFFBQVEsSUFBSUEsUUFBUSxDQUFDMkUsTUFBckIsR0FBOEIzRSxRQUFRLENBQUMyRSxNQUF2QyxHQUFnRCxJQUE3RCxDQUhrRCxDQUtsRDs7RUFDQSxJQUFJQyxlQUFlLEdBQUdELE1BQU0sSUFBSUEsTUFBTSxDQUFDQyxlQUFqQixJQUFvQ0QsTUFBTSxDQUFDQyxlQUFQLEVBQTFEOztFQUVBLEtBQUtvWCxrQkFBTCxDQUF3QixZQUFZa1EsUUFBWixHQUF1QixLQUEvQyxFQVJrRCxDQVVsRDs7O0VBQ0EsSUFBSSxDQUFDdm5CLE1BQUQsSUFBVyxDQUFDQyxlQUFoQixFQUFpQztJQUM3QixJQUFJRCxNQUFNLElBQUlBLE1BQU0sQ0FBQ0csVUFBckIsRUFBaUM7TUFDN0JILE1BQU0sQ0FBQ0csVUFBUDtJQUNIOztJQUNELEtBQUttc0IsNkJBQUwsQ0FBbUMvRSxRQUFuQyxFQUE2Q3pnQixVQUE3QyxFQUF5RDBFLFVBQXpEOztJQUNBO0VBQ0gsQ0FqQmlELENBbUJsRDs7O0VBQ0EsS0FBSytnQixvQkFBTCxDQUEwQmhGLFFBQTFCLEVBQW9DemdCLFVBQXBDLEVBQWdEMEUsVUFBaEQ7QUFDSCxDQTkrSkwsWUFpL0pJK2dCLG9CQWovSkosR0FpL0owQiw4QkFBU2hGLFFBQVQsRUFBbUJ6Z0IsVUFBbkIsRUFBK0IwRSxVQUEvQixFQUEyQztFQUM3RCxJQUFJdFAsSUFBSSxHQUFHLElBQVg7RUFDQSxJQUFJYixRQUFRLEdBQUdELE1BQU0sQ0FBQ0MsUUFBdEI7RUFDQSxJQUFJMkUsTUFBTSxHQUFHM0UsUUFBUSxJQUFJQSxRQUFRLENBQUMyRSxNQUFyQixHQUE4QjNFLFFBQVEsQ0FBQzJFLE1BQXZDLEdBQWdELElBQTdEOztFQUVBLElBQUksQ0FBQ0EsTUFBRCxJQUFXLENBQUNBLE1BQU0sQ0FBQ3dzQixRQUF2QixFQUFpQztJQUM3QnR3QixJQUFJLENBQUNpdkIsa0JBQUw7O0lBQ0FqdkIsSUFBSSxDQUFDaUQsWUFBTCxDQUFrQixlQUFsQjs7SUFDQTtFQUNIOztFQUdEYSxNQUFNLENBQUN3c0IsUUFBUCxDQUFnQmpGLFFBQWhCLEVBQTBCLFVBQVMvaUIsTUFBVCxFQUFpQnZGLElBQWpCLEVBQXVCO0lBRTdDLElBQUl1RixNQUFNLEtBQUssQ0FBWCxJQUFnQnZGLElBQXBCLEVBQTBCO01BQ3RCO01BQ0EsSUFBSXdZLE9BQU8sR0FBR3hZLElBQUksQ0FBQ3dZLE9BQUwsSUFBZ0IsRUFBOUIsQ0FGc0IsQ0FJdEI7O01BQ0EsSUFBSWdWLFNBQVMsR0FBR3h0QixJQUFJLENBQUM2WixVQUFMLElBQW1CN1osSUFBSSxDQUFDd3RCLFNBQXhCLElBQXFDLEVBQXJELENBTHNCLENBT3RCOztNQUNBLElBQUlweEIsUUFBUSxDQUFDMkUsTUFBVCxJQUFtQjNFLFFBQVEsQ0FBQzJFLE1BQVQsQ0FBZ0IrckIsYUFBdkMsRUFBc0Q7UUFDbEQsSUFBSUMsVUFBVSxHQUFHM3dCLFFBQVEsQ0FBQzJFLE1BQVQsQ0FBZ0IrckIsYUFBaEIsRUFBakI7TUFDSCxDQVZxQixDQVl0Qjs7O01BQ0EsSUFBSXpsQixRQUFRLEdBQUc7UUFDWHFSLE1BQU0sRUFBRTFZLElBQUksQ0FBQzJZLFNBQUwsSUFBa0IzWSxJQUFJLENBQUNzb0IsUUFBdkIsSUFBbUNBLFFBRGhDO1FBRVgzUCxTQUFTLEVBQUUzWSxJQUFJLENBQUMyWSxTQUFMLElBQWtCM1ksSUFBSSxDQUFDc29CLFFBQXZCLElBQW1DQSxRQUZuQztRQUdYMVAsU0FBUyxFQUFFNVksSUFBSSxDQUFDNlksTUFBTCxHQUFjN1ksSUFBSSxDQUFDNlksTUFBTCxDQUFZQyxJQUFaLEdBQW1CLENBQWpDLEdBQXFDLENBSHJDO1FBR3lDO1FBQ3BEQyxVQUFVLEVBQUVQLE9BQU8sQ0FBQ1EsR0FBUixDQUFZLFVBQVNDLENBQVQsRUFBWUMsR0FBWixFQUFpQjtVQUNyQyxPQUFPO1lBQ0hDLFNBQVMsRUFBRUYsQ0FBQyxDQUFDcFQsRUFEVjtZQUVIdVQsU0FBUyxFQUFFSCxDQUFDLENBQUN0VyxJQUZWO1lBR0gxRSxTQUFTLEVBQUVnYixDQUFDLENBQUNJLE1BQUYsSUFBWSxVQUhwQjtZQUdpQztZQUNwQ0MsVUFBVSxFQUFFTCxDQUFDLENBQUNLLFVBQUYsSUFBZ0IsQ0FKekI7WUFJNkI7WUFDaENDLFNBQVMsRUFBRU4sQ0FBQyxDQUFDSyxVQUFGLElBQWdCLENBTHhCO1lBSzZCO1lBQ2hDVixTQUFTLEVBQUUsQ0FBQ0ssQ0FBQyxDQUFDSCxJQUFGLEtBQVcxYSxTQUFYLEdBQXVCNmEsQ0FBQyxDQUFDSCxJQUF6QixHQUFnQ0ksR0FBakMsSUFBd0MsQ0FOaEQ7WUFNb0Q7WUFDdkRNLE9BQU8sRUFBRVAsQ0FBQyxDQUFDUSxLQUFGLElBQVcsS0FQakIsQ0FPd0I7O1VBUHhCLENBQVA7UUFTSCxDQVZXLENBSkQ7UUFlWEcsYUFBYSxFQUFFNFQsU0FmSjtRQWdCWDNULFVBQVUsRUFBRTJUO01BaEJELENBQWY7TUFxQkFweEIsUUFBUSxDQUFDaUwsUUFBVCxHQUFvQkEsUUFBcEI7TUFDQWpMLFFBQVEsQ0FBQ2lCLFVBQVQsQ0FBb0JpZCxNQUFwQixHQUE2QnpTLFVBQVUsQ0FBQzdCLFVBQVgsSUFBeUIsQ0FBdEQ7TUFDQTVKLFFBQVEsQ0FBQ2lCLFVBQVQsQ0FBb0JrZCxJQUFwQixHQUEyQjFTLFVBQVUsQ0FBQzVCLFVBQVgsSUFBeUIsQ0FBcEQ7O01BQ0FoSixJQUFJLENBQUM2YyxlQUFMLENBQXFCelMsUUFBckI7SUFDSCxDQXRDRCxNQXNDTztNQUNIcEssSUFBSSxDQUFDaXZCLGtCQUFMOztNQUNBanZCLElBQUksQ0FBQ2lELFlBQUwsQ0FBa0IsZ0JBQWxCO0lBQ0g7RUFDSixDQTVDRDtBQTZDSCxDQTFpS0wsWUE2aUtJbXRCLDZCQTdpS0osR0E2aUttQyx1Q0FBUy9FLFFBQVQsRUFBbUJ6Z0IsVUFBbkIsRUFBK0IwRSxVQUEvQixFQUEyQztFQUN0RSxJQUFJdFAsSUFBSSxHQUFHLElBQVg7RUFDQSxJQUFJOEQsTUFBTSxHQUFHNUUsTUFBTSxDQUFDQyxRQUFQLElBQW1CRCxNQUFNLENBQUNDLFFBQVAsQ0FBZ0IyRSxNQUFuQyxHQUE0QzVFLE1BQU0sQ0FBQ0MsUUFBUCxDQUFnQjJFLE1BQTVELEdBQXFFLElBQWxGO0VBQ0EsSUFBSTdELFFBQVEsR0FBRyxDQUFmO0VBQ0EsSUFBSUMsV0FBVyxHQUFHLEVBQWxCLENBSnNFLENBSS9DOztFQUV2QixJQUFJa3ZCLFVBQVUsR0FBRyxTQUFiQSxVQUFhLEdBQVc7SUFDeEJudkIsUUFBUTtJQUNSLElBQUk4RCxlQUFlLEdBQUdELE1BQU0sSUFBSUEsTUFBTSxDQUFDQyxlQUFqQixHQUFtQ0QsTUFBTSxDQUFDQyxlQUFQLEVBQW5DLEdBQThELEtBQXBGOztJQUdBLElBQUlBLGVBQUosRUFBcUI7TUFDakIvRCxJQUFJLENBQUNxd0Isb0JBQUwsQ0FBMEJoRixRQUExQixFQUFvQ3pnQixVQUFwQyxFQUFnRDBFLFVBQWhEO0lBQ0gsQ0FGRCxNQUVPLElBQUlyUCxRQUFRLEdBQUdDLFdBQWYsRUFBNEI7TUFDL0JHLFVBQVUsQ0FBQyt1QixVQUFELEVBQWEsR0FBYixDQUFWLENBRCtCLENBQ0Q7SUFDakMsQ0FGTSxNQUVBO01BQ0hwdkIsSUFBSSxDQUFDaXZCLGtCQUFMOztNQUNBanZCLElBQUksQ0FBQ2lELFlBQUwsQ0FBa0Isa0JBQWxCO0lBQ0g7RUFDSixDQWJEOztFQWVBNUMsVUFBVSxDQUFDK3VCLFVBQUQsRUFBYSxHQUFiLENBQVYsQ0FyQnNFLENBcUJ4QztBQUNqQyxDQW5rS0wsWUFza0tJb0IsOEJBdGtLSixHQXNrS29DLHdDQUFTNWxCLFVBQVQsRUFBcUI5RyxNQUFyQixFQUE2QndMLFVBQTdCLEVBQXlDO0VBQ3JFLElBQUl0UCxJQUFJLEdBQUcsSUFBWDtFQUNBLElBQUliLFFBQVEsR0FBR0QsTUFBTSxDQUFDQyxRQUF0QjtFQUNBLElBQUljLFFBQVEsR0FBRyxDQUFmO0VBQ0EsSUFBSUMsV0FBVyxHQUFHLEVBQWxCLENBSnFFLENBSTlDOztFQUV2QixJQUFJdXdCLFFBQVEsR0FBRyxTQUFYQSxRQUFXLEdBQVc7SUFDdEJ4d0IsUUFBUTtJQUNSLElBQUk4RCxlQUFlLEdBQUdELE1BQU0sSUFBSUEsTUFBTSxDQUFDQyxlQUFqQixHQUFtQ0QsTUFBTSxDQUFDQyxlQUFQLEVBQW5DLEdBQThELEtBQXBGOztJQUdBLElBQUlBLGVBQUosRUFBcUI7TUFDakIvRCxJQUFJLENBQUNxdkIsc0JBQUwsQ0FBNEJ6a0IsVUFBNUIsRUFBd0MwRSxVQUF4QztJQUNILENBRkQsTUFFTyxJQUFJclAsUUFBUSxHQUFHQyxXQUFmLEVBQTRCO01BQy9CRyxVQUFVLENBQUNvd0IsUUFBRCxFQUFXLEdBQVgsQ0FBVjtJQUNILENBRk0sTUFFQTtNQUNIO01BQ0FyeEIsT0FBTyxDQUFDa0IsS0FBUixDQUFjLGdCQUFkOztNQUNBTixJQUFJLENBQUNpdkIsa0JBQUw7O01BQ0FqdkIsSUFBSSxDQUFDaUQsWUFBTCxDQUFrQixpQkFBbEI7SUFDSDtFQUNKLENBZkQ7O0VBaUJBNUMsVUFBVSxDQUFDb3dCLFFBQUQsRUFBVyxHQUFYLENBQVY7QUFDSCxDQTlsS0wsWUFnbUtJeGhCLFdBaG1LSixHQWdtS2lCLHFCQUFTeWhCLElBQVQsRUFBZTtFQUN4QixJQUFJQSxJQUFJLElBQUksS0FBWixFQUFtQjtJQUNmLE9BQU8sQ0FBQ0EsSUFBSSxHQUFHLEtBQVIsRUFBZUMsT0FBZixDQUF1QixDQUF2QixJQUE0QixHQUFuQztFQUNIOztFQUNELE9BQU9ELElBQUksQ0FBQ0UsUUFBTCxFQUFQO0FBQ0gsQ0FybUtMLFlBdW1LSS9ULGVBdm1LSixHQXVtS3FCLHlCQUFTelMsUUFBVCxFQUFtQjtFQUNoQyxJQUFJN0csU0FBUyxHQUFHQyxJQUFJLENBQUNDLEdBQUwsRUFBaEIsQ0FEZ0MsQ0FHaEM7O0VBQ0EsS0FBS3dyQixrQkFBTCxHQUpnQyxDQU1oQzs7O0VBQ0EsS0FBSzRCLHdCQUFMLEdBUGdDLENBU2hDOzs7RUFDQSxJQUFJLEtBQUtodEIsbUJBQVQsRUFBOEI7SUFDMUIxRixFQUFFLENBQUNvQyxRQUFILENBQVl1d0IsaUJBQVosQ0FBOEIsSUFBSTN5QixFQUFFLENBQUM0eUIsS0FBUCxFQUE5QixFQUE4QyxZQUFXO01BQ3JENXlCLEVBQUUsQ0FBQ29DLFFBQUgsQ0FBWUMsU0FBWixDQUFzQixXQUF0QixFQUFtQyxVQUFTbUQsR0FBVCxFQUFjO1FBQzdDLElBQUlBLEdBQUosRUFBUztVQUNMdkUsT0FBTyxDQUFDa0IsS0FBUixDQUFjLHFCQUFkLEVBQXFDcUQsR0FBckM7VUFDQTtRQUNIOztRQUNELElBQUlDLE9BQU8sR0FBR0osSUFBSSxDQUFDQyxHQUFMLEtBQWFGLFNBQTNCO01BQ0gsQ0FORDtJQU9ILENBUkQ7RUFTSCxDQVZELE1BVU87SUFDSHBGLEVBQUUsQ0FBQ29DLFFBQUgsQ0FBWUMsU0FBWixDQUFzQixXQUF0QixFQUFtQyxVQUFTbUQsR0FBVCxFQUFjO01BQzdDLElBQUlBLEdBQUosRUFBUztRQUNMdkUsT0FBTyxDQUFDa0IsS0FBUixDQUFjLHFCQUFkLEVBQXFDcUQsR0FBckM7UUFDQTtNQUNIOztNQUNELElBQUlDLE9BQU8sR0FBR0osSUFBSSxDQUFDQyxHQUFMLEtBQWFGLFNBQTNCO0lBQ0gsQ0FORDtFQU9IO0FBQ0osQ0Fwb0tMLFlBdW9LSXN0Qix3QkF2b0tKLEdBdW9LOEIsb0NBQVc7RUFDakMsSUFBSTd3QixJQUFJLEdBQUcsSUFBWCxDQURpQyxDQUdqQzs7RUFDQSxJQUFJNkUsTUFBTSxHQUFHLEtBQUt2RCxJQUFMLENBQVVDLFlBQVYsQ0FBdUJwRCxFQUFFLENBQUMyRyxNQUExQixLQUFxQzNHLEVBQUUsQ0FBQzRHLElBQUgsQ0FBUSxRQUFSLEVBQWtCeEQsWUFBbEIsQ0FBK0JwRCxFQUFFLENBQUMyRyxNQUFsQyxDQUFsRDtFQUNBLElBQUlFLFlBQVksR0FBR0gsTUFBTSxHQUFHQSxNQUFNLENBQUNJLGdCQUFQLENBQXdCQyxNQUEzQixHQUFvQyxHQUE3RDtFQUNBLElBQUlDLFdBQVcsR0FBR04sTUFBTSxHQUFHQSxNQUFNLENBQUNJLGdCQUFQLENBQXdCRyxLQUEzQixHQUFtQyxJQUEzRCxDQU5pQyxDQVFqQzs7RUFDQSxJQUFJNHJCLFFBQVEsR0FBRyxJQUFJN3lCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxnQkFBWixDQUFmO0VBQ0F3bEIsUUFBUSxDQUFDN2pCLGNBQVQsQ0FBd0JoUCxFQUFFLENBQUM4UyxJQUFILENBQVE5TCxXQUFXLEdBQUcsQ0FBdEIsRUFBeUJILFlBQVksR0FBRyxDQUF4QyxDQUF4QjtFQUNBZ3NCLFFBQVEsQ0FBQzlpQixLQUFULEdBQWlCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixDQUFqQjtFQUNBOGlCLFFBQVEsQ0FBQ0MsT0FBVCxHQUFtQixDQUFuQjtFQUNBRCxRQUFRLENBQUNwaUIsTUFBVCxHQUFrQixJQUFsQixDQWJpQyxDQWVqQzs7RUFDQW9pQixRQUFRLENBQUNwakIsWUFBVCxDQUFzQnpQLEVBQUUsQ0FBQyt5QixnQkFBekI7RUFDQUYsUUFBUSxDQUFDNWpCLE1BQVQsR0FBa0IsS0FBSzlMLElBQXZCLENBakJpQyxDQW1CakM7O0VBQ0FuRCxFQUFFLENBQUNnSixTQUFILENBQWFDLElBQWIsQ0FBa0Isa0JBQWxCLEVBQXNDakosRUFBRSxDQUFDK0ksV0FBekMsRUFBc0QsVUFBU3ZELEdBQVQsRUFBY3NELFdBQWQsRUFBMkI7SUFDN0U7SUFDQSxJQUFJLENBQUMrcEIsUUFBRCxJQUFhLENBQUNBLFFBQVEsQ0FBQ3B4QixPQUEzQixFQUFvQztNQUNoQ1IsT0FBTyxDQUFDeVosR0FBUixDQUFZLGlCQUFaO01BQ0E7SUFDSDs7SUFFRCxJQUFJbFYsR0FBRyxJQUFJLENBQUNzRCxXQUFaLEVBQXlCO01BQ3JCN0gsT0FBTyxDQUFDQyxJQUFSLENBQWEsZ0NBQWIsRUFEcUIsQ0FFckI7O01BQ0EsSUFBSStnQixXQUFXLEdBQUcsSUFBSWppQixFQUFFLENBQUNxTixJQUFQLENBQVksYUFBWixDQUFsQjtNQUNBNFUsV0FBVyxDQUFDdmEsQ0FBWixHQUFnQixDQUFoQjtNQUNBLElBQUkrbEIsWUFBWSxHQUFHeEwsV0FBVyxDQUFDeFMsWUFBWixDQUF5QnpQLEVBQUUsQ0FBQ0ssS0FBNUIsQ0FBbkI7TUFDQW90QixZQUFZLENBQUMxcUIsTUFBYixHQUFzQixXQUF0QjtNQUNBMHFCLFlBQVksQ0FBQy9kLFFBQWIsR0FBd0IsRUFBeEI7TUFDQStkLFlBQVksQ0FBQzlkLFVBQWIsR0FBMEIsRUFBMUI7TUFDQThkLFlBQVksQ0FBQzdkLGVBQWIsR0FBK0I1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQXhEO01BQ0FtUyxXQUFXLENBQUNsUyxLQUFaLEdBQW9CL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQXBCO01BQ0FrUyxXQUFXLENBQUNoVCxNQUFaLEdBQXFCNGpCLFFBQXJCO01BQ0E7SUFDSCxDQXBCNEUsQ0FzQjdFOzs7SUFDQSxJQUFJRyxnQkFBZ0IsR0FBRyxJQUFJaHpCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxjQUFaLENBQXZCO0lBQ0EybEIsZ0JBQWdCLENBQUNoa0IsY0FBakIsQ0FBZ0NoUCxFQUFFLENBQUM4UyxJQUFILENBQVEsR0FBUixFQUFhLEdBQWIsQ0FBaEM7SUFDQWtnQixnQkFBZ0IsQ0FBQzVxQixPQUFqQixHQUEyQixHQUEzQjtJQUNBNHFCLGdCQUFnQixDQUFDM3FCLE9BQWpCLEdBQTJCLEdBQTNCO0lBRUEsSUFBSWlJLE1BQU0sR0FBRzBpQixnQkFBZ0IsQ0FBQ3ZqQixZQUFqQixDQUE4QnpQLEVBQUUsQ0FBQ08sTUFBakMsQ0FBYjtJQUNBK1AsTUFBTSxDQUFDeEgsV0FBUCxHQUFxQkEsV0FBckI7SUFDQXdILE1BQU0sQ0FBQzBELElBQVAsR0FBY2hVLEVBQUUsQ0FBQ08sTUFBSCxDQUFVMFQsSUFBVixDQUFlQyxNQUE3QjtJQUNBNUQsTUFBTSxDQUFDNkQsUUFBUCxHQUFrQm5VLEVBQUUsQ0FBQ08sTUFBSCxDQUFVNlQsUUFBVixDQUFtQkMsTUFBckM7SUFFQTJlLGdCQUFnQixDQUFDL2pCLE1BQWpCLEdBQTBCNGpCLFFBQTFCLENBakM2RSxDQW1DN0U7O0lBQ0FoeEIsSUFBSSxDQUFDRCxzQkFBTCxHQUE4Qm94QixnQkFBOUI7SUFDQW54QixJQUFJLENBQUNGLG9CQUFMLEdBQTRCLElBQTVCO0VBQ0gsQ0F0Q0QsRUFwQmlDLENBNERqQzs7RUFDQTNCLEVBQUUsQ0FBQ2l6QixLQUFILENBQVNKLFFBQVQsRUFDS0ssRUFETCxDQUNRLElBRFIsRUFDYztJQUFFSixPQUFPLEVBQUU7RUFBWCxDQURkLEVBRUtoZCxLQUZMLEdBN0RpQyxDQWlFakM7O0VBQ0EsS0FBS3FkLGVBQUwsR0FBdUJOLFFBQXZCO0FBQ0gsQ0Exc0tMLFlBNHNLSS90QixZQTVzS0osR0E0c0trQixzQkFBU3BDLE9BQVQsRUFBa0I7RUFDNUI7RUFDQSxJQUFJLENBQUMsS0FBS1MsSUFBTixJQUFjLENBQUMsS0FBS0EsSUFBTCxDQUFVMUIsT0FBN0IsRUFBc0M7SUFDbENSLE9BQU8sQ0FBQ0MsSUFBUixDQUFhLHlCQUFiO0lBQ0E7RUFDSDs7RUFFRCxJQUFJbWhCLE9BQU8sR0FBRyxLQUFLbGYsSUFBTCxDQUFVK0MsY0FBVixDQUF5QixVQUF6QixDQUFkO0VBQ0EsSUFBSW1jLE9BQUosRUFBYUEsT0FBTyxDQUFDaFUsT0FBUjtFQUViZ1UsT0FBTyxHQUFHLElBQUlyaUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFVBQVosQ0FBVjtFQUNBZ1YsT0FBTyxDQUFDamEsT0FBUixHQUFrQixHQUFsQixDQVg0QixDQVdKOztFQUN4QmlhLE9BQU8sQ0FBQ2hhLE9BQVIsR0FBa0IsR0FBbEIsQ0FaNEIsQ0FZSjs7RUFDeEJnYSxPQUFPLENBQUM3WixDQUFSLEdBQVksQ0FBWixDQWI0QixDQWFaOztFQUNoQjZaLE9BQU8sQ0FBQzNhLENBQVIsR0FBWSxHQUFaLENBZDRCLENBY1Y7O0VBRWxCLElBQUk4SCxLQUFLLEdBQUc2UyxPQUFPLENBQUM1UyxZQUFSLENBQXFCelAsRUFBRSxDQUFDSyxLQUF4QixDQUFaO0VBQ0FtUCxLQUFLLENBQUN6TSxNQUFOLEdBQWVMLE9BQWY7RUFDQThNLEtBQUssQ0FBQ0UsUUFBTixHQUFpQixFQUFqQjtFQUNBRixLQUFLLENBQUNHLFVBQU4sR0FBbUIsRUFBbkI7RUFDQUgsS0FBSyxDQUFDSSxlQUFOLEdBQXdCNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUFqRCxDQXBCNEIsQ0FvQjhCOztFQUMxRHVTLE9BQU8sQ0FBQ3RTLEtBQVIsR0FBZ0IvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsQ0FBbkIsQ0FBaEIsQ0FyQjRCLENBcUJZOztFQUV4Q3NTLE9BQU8sQ0FBQ3BULE1BQVIsR0FBaUIsS0FBSzlMLElBQXRCO0VBRUEsS0FBSzhCLFlBQUwsQ0FBa0IsWUFBVztJQUN6QixJQUFJb2QsT0FBTyxJQUFJQSxPQUFPLENBQUM1Z0IsT0FBdkIsRUFBZ0M0Z0IsT0FBTyxDQUFDaFUsT0FBUjtFQUNuQyxDQUZELEVBRUcsQ0FGSDtBQUdILENBeHVLTCxZQTJ1S0kyTyxrQkEzdUtKLEdBMnVLd0IsNEJBQVN0YSxPQUFULEVBQWtCO0VBQ2xDO0VBQ0EsSUFBSSxDQUFDLEtBQUtTLElBQU4sSUFBYyxDQUFDLEtBQUtBLElBQUwsQ0FBVTFCLE9BQTdCLEVBQXNDO0lBQ2xDUixPQUFPLENBQUNDLElBQVIsQ0FBYSwrQkFBYjtJQUNBO0VBQ0g7O0VBRUQsSUFBSVcsSUFBSSxHQUFHLElBQVg7RUFDQSxJQUFJd2dCLE9BQU8sR0FBRyxLQUFLbGYsSUFBTCxDQUFVK0MsY0FBVixDQUF5QixZQUF6QixDQUFkO0VBQ0EsSUFBSW1jLE9BQUosRUFBYUEsT0FBTyxDQUFDaFUsT0FBUixHQVRxQixDQVdsQzs7RUFDQSxJQUFJM0gsTUFBTSxHQUFHLEtBQUt2RCxJQUFMLENBQVVDLFlBQVYsQ0FBdUJwRCxFQUFFLENBQUMyRyxNQUExQixLQUFxQzNHLEVBQUUsQ0FBQzRHLElBQUgsQ0FBUSxRQUFSLEVBQWtCeEQsWUFBbEIsQ0FBK0JwRCxFQUFFLENBQUMyRyxNQUFsQyxDQUFsRDtFQUNBLElBQUlFLFlBQVksR0FBR0gsTUFBTSxHQUFHQSxNQUFNLENBQUNJLGdCQUFQLENBQXdCQyxNQUEzQixHQUFvQyxHQUE3RDtFQUNBLElBQUlDLFdBQVcsR0FBR04sTUFBTSxHQUFHQSxNQUFNLENBQUNJLGdCQUFQLENBQXdCRyxLQUEzQixHQUFtQyxJQUEzRCxDQWRrQyxDQWdCbEM7O0VBQ0FvYixPQUFPLEdBQUcsSUFBSXJpQixFQUFFLENBQUNxTixJQUFQLENBQVksWUFBWixDQUFWO0VBQ0FnVixPQUFPLENBQUM1UixNQUFSLEdBQWlCLElBQWpCO0VBQ0E0UixPQUFPLENBQUNwVCxNQUFSLEdBQWlCLEtBQUs5TCxJQUF0QixDQW5Ca0MsQ0FxQmxDOztFQUNBLElBQUkwdkIsUUFBUSxHQUFHLElBQUk3eUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLE1BQVosQ0FBZjtFQUNBd2xCLFFBQVEsQ0FBQzdqQixjQUFULENBQXdCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFROUwsV0FBUixFQUFxQkgsWUFBckIsQ0FBeEI7RUFDQSxJQUFJMm9CLFlBQVksR0FBR3FELFFBQVEsQ0FBQ3BqQixZQUFULENBQXNCelAsRUFBRSxDQUFDa1QsUUFBekIsQ0FBbkI7RUFDQXNjLFlBQVksQ0FBQ3JjLFNBQWIsR0FBeUJuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxDQUFmLEVBQWtCLEdBQWxCLENBQXpCLENBekJrQyxDQXlCZ0I7O0VBQ2xEeWYsWUFBWSxDQUFDdlUsSUFBYixDQUFrQixDQUFDalUsV0FBRCxHQUFhLENBQS9CLEVBQWtDLENBQUNILFlBQUQsR0FBYyxDQUFoRCxFQUFtREcsV0FBbkQsRUFBZ0VILFlBQWhFO0VBQ0Eyb0IsWUFBWSxDQUFDbmMsSUFBYjtFQUNBd2YsUUFBUSxDQUFDNWpCLE1BQVQsR0FBa0JvVCxPQUFsQixDQTVCa0MsQ0E4QmxDOztFQUNBcmlCLEVBQUUsQ0FBQ2dKLFNBQUgsQ0FBYUMsSUFBYixDQUFrQixrQkFBbEIsRUFBc0NqSixFQUFFLENBQUMrSSxXQUF6QyxFQUFzRCxVQUFTdkQsR0FBVCxFQUFjc0QsV0FBZCxFQUEyQjtJQUM3RSxJQUFJdEQsR0FBRyxJQUFJLENBQUNzRCxXQUFaLEVBQXlCO01BQ3JCN0gsT0FBTyxDQUFDQyxJQUFSLENBQWEsZ0NBQWIsRUFEcUIsQ0FFckI7O01BQ0EsSUFBSStvQixTQUFTLEdBQUcsSUFBSWpxQixFQUFFLENBQUNxTixJQUFQLENBQVksT0FBWixDQUFoQjtNQUNBLElBQUltQyxLQUFLLEdBQUd5YSxTQUFTLENBQUN4YSxZQUFWLENBQXVCelAsRUFBRSxDQUFDSyxLQUExQixDQUFaO01BQ0FtUCxLQUFLLENBQUN6TSxNQUFOLEdBQWVMLE9BQWY7TUFDQThNLEtBQUssQ0FBQ0UsUUFBTixHQUFpQixFQUFqQjtNQUNBRixLQUFLLENBQUNHLFVBQU4sR0FBbUIsRUFBbkI7TUFDQUgsS0FBSyxDQUFDSSxlQUFOLEdBQXdCNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUFqRDtNQUNBbWEsU0FBUyxDQUFDbGEsS0FBVixHQUFrQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFsQjtNQUNBa2EsU0FBUyxDQUFDaGIsTUFBVixHQUFtQm9ULE9BQW5CO01BQ0E7SUFDSCxDQWI0RSxDQWU3RTs7O0lBQ0EsSUFBSUosV0FBVyxHQUFHLElBQUlqaUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLGNBQVosQ0FBbEI7SUFDQTRVLFdBQVcsQ0FBQ2pULGNBQVosQ0FBMkJoUCxFQUFFLENBQUM4UyxJQUFILENBQVEsR0FBUixFQUFhLEdBQWIsQ0FBM0IsRUFqQjZFLENBaUI3Qjs7SUFDaERtUCxXQUFXLENBQUM3WixPQUFaLEdBQXNCLEdBQXRCO0lBQ0E2WixXQUFXLENBQUM1WixPQUFaLEdBQXNCLEdBQXRCO0lBRUEsSUFBSWlJLE1BQU0sR0FBRzJSLFdBQVcsQ0FBQ3hTLFlBQVosQ0FBeUJ6UCxFQUFFLENBQUNPLE1BQTVCLENBQWI7SUFDQStQLE1BQU0sQ0FBQ3hILFdBQVAsR0FBcUJBLFdBQXJCO0lBQ0F3SCxNQUFNLENBQUMwRCxJQUFQLEdBQWNoVSxFQUFFLENBQUNPLE1BQUgsQ0FBVTBULElBQVYsQ0FBZUMsTUFBN0I7SUFDQTVELE1BQU0sQ0FBQzZELFFBQVAsR0FBa0JuVSxFQUFFLENBQUNPLE1BQUgsQ0FBVTZULFFBQVYsQ0FBbUJDLE1BQXJDO0lBRUE0TixXQUFXLENBQUNoVCxNQUFaLEdBQXFCb1QsT0FBckIsQ0ExQjZFLENBNEI3RTs7SUFDQXhnQixJQUFJLENBQUNOLHNCQUFMLEdBQThCLElBQTlCO0lBQ0FNLElBQUksQ0FBQ0wsaUJBQUwsR0FBeUJ5Z0IsV0FBekI7RUFDSCxDQS9CRCxFQS9Ca0MsQ0FnRWxDO0VBQ0E7O0VBQ0EsS0FBS21SLGNBQUwsR0FBc0IvUSxPQUF0QjtBQUNILENBOXlLTCxZQWl6S0l5TyxrQkFqektKLEdBaXpLd0IsOEJBQVc7RUFDM0IsS0FBS3Z2QixzQkFBTCxHQUE4QixLQUE5QjtFQUNBLEtBQUtDLGlCQUFMLEdBQXlCLElBQXpCOztFQUVBLElBQUksS0FBSzR4QixjQUFMLElBQXVCLEtBQUtBLGNBQUwsQ0FBb0IzeEIsT0FBL0MsRUFBd0Q7SUFDcEQsS0FBSzJ4QixjQUFMLENBQW9CL2tCLE9BQXBCOztJQUNBLEtBQUsra0IsY0FBTCxHQUFzQixJQUF0QjtFQUNIOztFQUVELElBQUkvUSxPQUFPLEdBQUcsS0FBS2xmLElBQUwsQ0FBVStDLGNBQVYsQ0FBeUIsWUFBekIsQ0FBZDs7RUFDQSxJQUFJbWMsT0FBTyxJQUFJQSxPQUFPLENBQUM1Z0IsT0FBdkIsRUFBZ0M7SUFDNUI0Z0IsT0FBTyxDQUFDaFUsT0FBUjtFQUNIO0FBQ0osQ0E5ektMLFlBZzBLSW5LLGtCQWgwS0osR0FnMEt3Qiw4QkFBVztFQUMzQixJQUFJbXZCLFdBQVcsR0FBRyxDQUFDLFFBQUQsRUFBVyxTQUFYLEVBQXNCLElBQXRCLEVBQTRCLGNBQTVCLEVBQTRDLHNCQUE1QyxFQUFvRSxXQUFwRSxFQUFpRixPQUFqRixFQUEwRixPQUExRixFQUFtRyxJQUFuRyxDQUFsQjs7RUFDQSxLQUFLLElBQUlqdEIsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR2l0QixXQUFXLENBQUNodEIsTUFBaEMsRUFBd0NELENBQUMsRUFBekMsRUFBNkM7SUFDekMsSUFBSWpELElBQUksR0FBRyxLQUFLQSxJQUFMLENBQVUrQyxjQUFWLENBQXlCbXRCLFdBQVcsQ0FBQ2p0QixDQUFELENBQXBDLENBQVg7SUFDQSxJQUFJakQsSUFBSixFQUFVQSxJQUFJLENBQUNzRCxNQUFMLEdBQWMsS0FBZDtFQUNiOztFQUNELEtBQUs2c0Isa0JBQUwsQ0FBd0IsS0FBS253QixJQUE3QixFQUFtQyxNQUFuQzs7RUFDQSxLQUFLbXdCLGtCQUFMLENBQXdCLEtBQUtud0IsSUFBN0IsRUFBbUMsTUFBbkMsRUFQMkIsQ0FRM0I7OztFQUNBLEtBQUtvd0IscUJBQUw7QUFDSCxDQTEwS0wsWUE0MEtJQSxxQkE1MEtKLEdBNDBLMkIsaUNBQVc7RUFDOUI7RUFDQSxJQUFJQyxZQUFZLEdBQUcsQ0FBQyxLQUFELEVBQVEsS0FBUixFQUFlLEtBQWYsRUFBc0IsS0FBdEIsRUFBNkIsS0FBN0IsRUFBb0MsTUFBcEMsRUFBNEMsTUFBNUMsQ0FBbkI7O0VBQ0EsS0FBSyxJQUFJcHRCLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdvdEIsWUFBWSxDQUFDbnRCLE1BQWpDLEVBQXlDRCxDQUFDLEVBQTFDLEVBQThDO0lBQzFDLElBQUlxdEIsS0FBSyxHQUFHLEtBQUtDLGdCQUFMLENBQXNCLEtBQUt2d0IsSUFBM0IsRUFBaUNxd0IsWUFBWSxDQUFDcHRCLENBQUQsQ0FBN0MsQ0FBWjs7SUFDQSxLQUFLLElBQUl1dEIsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR0YsS0FBSyxDQUFDcHRCLE1BQTFCLEVBQWtDc3RCLENBQUMsRUFBbkMsRUFBdUM7TUFDbkM7TUFDQSxJQUFJRixLQUFLLENBQUNFLENBQUQsQ0FBTCxDQUFTcHNCLElBQVQsS0FBa0IsV0FBdEIsRUFBbUM7UUFDL0Jrc0IsS0FBSyxDQUFDRSxDQUFELENBQUwsQ0FBU2x0QixNQUFULEdBQWtCLEtBQWxCO01BQ0g7SUFDSjtFQUNKO0FBQ0osQ0F4MUtMLFlBMDFLSWl0QixnQkExMUtKLEdBMDFLc0IsMEJBQVMzdEIsVUFBVCxFQUFxQndCLElBQXJCLEVBQTJCO0VBQ3pDLElBQUk0QyxNQUFNLEdBQUcsRUFBYjtFQUNBLElBQUksQ0FBQ3BFLFVBQUQsSUFBZSxDQUFDQSxVQUFVLENBQUNJLFFBQS9CLEVBQXlDLE9BQU9nRSxNQUFQOztFQUV6QyxLQUFLLElBQUkvRCxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHTCxVQUFVLENBQUNJLFFBQVgsQ0FBb0JFLE1BQXhDLEVBQWdERCxDQUFDLEVBQWpELEVBQXFEO0lBQ2pELElBQUlFLEtBQUssR0FBR1AsVUFBVSxDQUFDSSxRQUFYLENBQW9CQyxDQUFwQixDQUFaOztJQUNBLElBQUlFLEtBQUssQ0FBQ2lCLElBQU4sS0FBZUEsSUFBbkIsRUFBeUI7TUFDckI0QyxNQUFNLENBQUM5QyxJQUFQLENBQVlmLEtBQVo7SUFDSCxDQUpnRCxDQUtqRDs7O0lBQ0EsSUFBSXN0QixVQUFVLEdBQUcsS0FBS0YsZ0JBQUwsQ0FBc0JwdEIsS0FBdEIsRUFBNkJpQixJQUE3QixDQUFqQjs7SUFDQTRDLE1BQU0sR0FBR0EsTUFBTSxDQUFDMHBCLE1BQVAsQ0FBY0QsVUFBZCxDQUFUO0VBQ0g7O0VBQ0QsT0FBT3pwQixNQUFQO0FBQ0gsQ0F4MktMLFlBMDJLSTVHLDJCQTEyS0osR0EwMktpQyx1Q0FBVztFQUNwQyxJQUFJdXdCLFVBQVUsR0FBRyxLQUFLM3dCLElBQUwsQ0FBVStDLGNBQVYsQ0FBeUIsYUFBekIsQ0FBakI7RUFDQSxJQUFJLENBQUM0dEIsVUFBTCxFQUFpQjtFQUVqQixJQUFJQyxXQUFXLEdBQUdELFVBQVUsQ0FBQzV0QixjQUFYLENBQTBCLGFBQTFCLENBQWxCO0VBQ0EsSUFBSTh0QixTQUFTLEdBQUdGLFVBQVUsQ0FBQzV0QixjQUFYLENBQTBCLFlBQTFCLENBQWhCLENBTG9DLENBT3BDOztFQUNBLElBQUk2dEIsV0FBSixFQUFpQjtJQUNiQSxXQUFXLENBQUNyc0IsQ0FBWixHQUFnQixFQUFoQjtJQUNBcXNCLFdBQVcsQ0FBQ3ZyQixDQUFaLEdBQWdCLENBQUMsRUFBakIsQ0FGYSxDQUVTO0VBQ3pCOztFQUNELElBQUl3ckIsU0FBSixFQUFlO0lBQ1hBLFNBQVMsQ0FBQ3RzQixDQUFWLEdBQWMsRUFBZDtFQUNILENBZG1DLENBZ0JwQzs7O0VBQ0EsSUFBSSxLQUFLbEgsV0FBTCxJQUFvQixLQUFLQSxXQUFMLENBQWlCMkMsSUFBekMsRUFBK0M7SUFDM0MsSUFBSThtQixTQUFTLEdBQUcsS0FBS3pwQixXQUFMLENBQWlCMkMsSUFBakM7SUFDQSxJQUFJNkUsTUFBTSxHQUFHaWlCLFNBQVMsQ0FBQzdtQixZQUFWLENBQXVCcEQsRUFBRSxDQUFDaUksTUFBMUIsQ0FBYjtJQUNBLElBQUlELE1BQUosRUFBWUEsTUFBTSxDQUFDRSxPQUFQLEdBQWlCLEtBQWpCLENBSCtCLENBSzNDOztJQUNBK2hCLFNBQVMsQ0FBQzdoQixPQUFWLEdBQW9CLENBQXBCLENBTjJDLENBTW5COztJQUN4QjZoQixTQUFTLENBQUN6aEIsQ0FBVixHQUFjLEVBQWQsQ0FQMkMsQ0FPbkI7O0lBQ3hCeWhCLFNBQVMsQ0FBQ3ZpQixDQUFWLEdBQWMsRUFBZCxDQVIyQyxDQVFuQjtFQUMzQjtBQUNKLENBcjRLTCxZQXU0S0k0ckIsa0JBdjRLSixHQXU0S3dCLDRCQUFTdnRCLFVBQVQsRUFBcUJrdUIsVUFBckIsRUFBaUM7RUFDakQsSUFBSSxDQUFDbHVCLFVBQUwsRUFBaUI7RUFDakIsSUFBSUksUUFBUSxHQUFHSixVQUFVLENBQUNJLFFBQTFCO0VBQ0EsSUFBSSxDQUFDQSxRQUFMLEVBQWU7O0VBRWYsS0FBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHRCxRQUFRLENBQUNFLE1BQTdCLEVBQXFDRCxDQUFDLEVBQXRDLEVBQTBDO0lBQ3RDLElBQUlFLEtBQUssR0FBR0gsUUFBUSxDQUFDQyxDQUFELENBQXBCO0lBQ0EsSUFBSW9KLEtBQUssR0FBR2xKLEtBQUssQ0FBQ2xELFlBQU4sQ0FBbUJwRCxFQUFFLENBQUNLLEtBQXRCLENBQVo7O0lBQ0EsSUFBSW1QLEtBQUssSUFBSUEsS0FBSyxDQUFDek0sTUFBZixJQUF5QnlNLEtBQUssQ0FBQ3pNLE1BQU4sQ0FBYTBFLE9BQWIsQ0FBcUJ3c0IsVUFBckIsS0FBb0MsQ0FBakUsRUFBb0U7TUFDaEUzdEIsS0FBSyxDQUFDRyxNQUFOLEdBQWUsS0FBZjtJQUNIOztJQUNELEtBQUs2c0Isa0JBQUwsQ0FBd0JodEIsS0FBeEIsRUFBK0IydEIsVUFBL0I7RUFDSDtBQUNKLENBcDVLTCxZQXk1S0lDLHNCQXo1S0osR0F5NUs0QixrQ0FBVztFQUMvQixJQUFJcnlCLElBQUksR0FBRyxJQUFYLENBRCtCLENBSS9COztFQUNBLElBQUlzeUIsTUFBTSxHQUFHLEtBQUtoeEIsSUFBTCxDQUFVK0MsY0FBVixDQUF5QixpQkFBekIsQ0FBYjtFQUNBLElBQUlpdUIsTUFBSixFQUFZQSxNQUFNLENBQUM5bEIsT0FBUCxHQU5tQixDQVEvQjs7RUFDQSxJQUFJM0gsTUFBTSxHQUFHLEtBQUt2RCxJQUFMLENBQVVDLFlBQVYsQ0FBdUJwRCxFQUFFLENBQUMyRyxNQUExQixLQUFxQzNHLEVBQUUsQ0FBQzRHLElBQUgsQ0FBUSxRQUFSLEVBQWtCeEQsWUFBbEIsQ0FBK0JwRCxFQUFFLENBQUMyRyxNQUFsQyxDQUFsRDtFQUNBLElBQUlFLFlBQVksR0FBR0gsTUFBTSxHQUFHQSxNQUFNLENBQUNJLGdCQUFQLENBQXdCQyxNQUEzQixHQUFvQyxHQUE3RDtFQUNBLElBQUlDLFdBQVcsR0FBR04sTUFBTSxHQUFHQSxNQUFNLENBQUNJLGdCQUFQLENBQXdCRyxLQUEzQixHQUFtQyxJQUEzRCxDQVgrQixDQWEvQjs7RUFDQSxJQUFJeUUsT0FBTyxHQUFHLElBQUkxTCxFQUFFLENBQUNxTixJQUFQLENBQVksaUJBQVosQ0FBZDtFQUNBM0IsT0FBTyxDQUFDc0QsY0FBUixDQUF1QmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUSxHQUFSLEVBQWEsRUFBYixDQUF2QjtFQUNBcEgsT0FBTyxDQUFDdEQsT0FBUixHQUFrQixHQUFsQjtFQUNBc0QsT0FBTyxDQUFDckQsT0FBUixHQUFrQixHQUFsQixDQWpCK0IsQ0FtQi9COztFQUNBcUQsT0FBTyxDQUFDbEQsQ0FBUixHQUFZLENBQUN4QixXQUFELEdBQWUsQ0FBZixHQUFtQixHQUEvQjtFQUNBMEUsT0FBTyxDQUFDaEUsQ0FBUixHQUFZLENBQVo7RUFDQWdFLE9BQU8sQ0FBQytFLE1BQVIsR0FBaUIsSUFBakI7RUFDQS9FLE9BQU8sQ0FBQ3VELE1BQVIsR0FBaUIsS0FBSzlMLElBQXRCLENBdkIrQixDQXlCL0I7O0VBQ0EsSUFBSW1OLE1BQU0sR0FBRzVFLE9BQU8sQ0FBQytELFlBQVIsQ0FBcUJ6UCxFQUFFLENBQUNPLE1BQXhCLENBQWI7RUFDQStQLE1BQU0sQ0FBQzZELFFBQVAsR0FBa0JuVSxFQUFFLENBQUNPLE1BQUgsQ0FBVTZULFFBQVYsQ0FBbUJDLE1BQXJDO0VBRUFyVSxFQUFFLENBQUNnSixTQUFILENBQWFDLElBQWIsQ0FBa0IsbUJBQWxCLEVBQXVDakosRUFBRSxDQUFDK0ksV0FBMUMsRUFBdUQsVUFBU3ZELEdBQVQsRUFBY3NELFdBQWQsRUFBMkI7SUFDOUUsSUFBSXRELEdBQUosRUFBUztNQUNMdkUsT0FBTyxDQUFDQyxJQUFSLENBQWEsNkJBQWI7O01BQ0FXLElBQUksQ0FBQ3V5Qiw4QkFBTCxDQUFvQzFvQixPQUFwQzs7TUFDQTtJQUNIOztJQUNENEUsTUFBTSxDQUFDeEgsV0FBUCxHQUFxQkEsV0FBckI7RUFDSCxDQVBELEVBN0IrQixDQXNDL0I7O0VBQ0EsSUFBSThELE1BQU0sR0FBR2xCLE9BQU8sQ0FBQytELFlBQVIsQ0FBcUJ6UCxFQUFFLENBQUM2TSxNQUF4QixDQUFiO0VBQ0FELE1BQU0sQ0FBQ0UsVUFBUCxHQUFvQjlNLEVBQUUsQ0FBQzZNLE1BQUgsQ0FBVUUsVUFBVixDQUFxQkMsS0FBekM7RUFDQUosTUFBTSxDQUFDSyxRQUFQLEdBQWtCLEdBQWxCO0VBQ0FMLE1BQU0sQ0FBQ00sU0FBUCxHQUFtQixHQUFuQixDQTFDK0IsQ0E0Qy9COztFQUNBeEIsT0FBTyxDQUFDL0csRUFBUixDQUFXM0UsRUFBRSxDQUFDcU4sSUFBSCxDQUFRQyxTQUFSLENBQWtCQyxTQUE3QixFQUF3QyxVQUFTQyxLQUFULEVBQWdCO0lBQ3BEQSxLQUFLLENBQUNDLGVBQU47O0lBQ0E1TCxJQUFJLENBQUN3eUIsbUJBQUw7RUFDSCxDQUhELEVBR0csSUFISDtBQUtILENBMzhLTCxZQTg4S0lELDhCQTk4S0osR0E4OEtvQyx3Q0FBUzFvQixPQUFULEVBQWtCO0VBQzlDLElBQUk0RSxNQUFNLEdBQUc1RSxPQUFPLENBQUN0SSxZQUFSLENBQXFCcEQsRUFBRSxDQUFDTyxNQUF4QixDQUFiOztFQUNBLElBQUksQ0FBQytQLE1BQUwsRUFBYTtJQUNUQSxNQUFNLEdBQUc1RSxPQUFPLENBQUMrRCxZQUFSLENBQXFCelAsRUFBRSxDQUFDTyxNQUF4QixDQUFUO0VBQ0g7O0VBQ0QrUCxNQUFNLENBQUM2RCxRQUFQLEdBQWtCblUsRUFBRSxDQUFDTyxNQUFILENBQVU2VCxRQUFWLENBQW1CQyxNQUFyQyxDQUw4QyxDQU85Qzs7RUFDQSxJQUFJMlYsUUFBUSxHQUFHdGUsT0FBTyxDQUFDK0QsWUFBUixDQUFxQnpQLEVBQUUsQ0FBQ2tULFFBQXhCLENBQWY7RUFDQThXLFFBQVEsQ0FBQzdXLFNBQVQsR0FBcUJuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsQ0FBbkIsQ0FBckIsQ0FUOEMsQ0FTRDs7RUFDN0NpYSxRQUFRLENBQUM1VyxTQUFULENBQW1CLENBQUMsRUFBcEIsRUFBd0IsQ0FBQyxFQUF6QixFQUE2QixHQUE3QixFQUFrQyxFQUFsQyxFQUFzQyxFQUF0QztFQUNBNFcsUUFBUSxDQUFDM1csSUFBVDtFQUNBMlcsUUFBUSxDQUFDN08sV0FBVCxHQUF1Qm5iLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUF2QixDQVo4QyxDQVlHOztFQUNqRGlhLFFBQVEsQ0FBQzVPLFNBQVQsR0FBcUIsQ0FBckI7RUFDQTRPLFFBQVEsQ0FBQzVXLFNBQVQsQ0FBbUIsQ0FBQyxFQUFwQixFQUF3QixDQUFDLEVBQXpCLEVBQTZCLEdBQTdCLEVBQWtDLEVBQWxDLEVBQXNDLEVBQXRDO0VBQ0E0VyxRQUFRLENBQUMzTyxNQUFULEdBZjhDLENBaUI5Qzs7RUFDQSxJQUFJaVosUUFBUSxHQUFHLElBQUl0MEIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLE1BQVosQ0FBZjtFQUNBLElBQUlrbkIsU0FBUyxHQUFHRCxRQUFRLENBQUM3a0IsWUFBVCxDQUFzQnpQLEVBQUUsQ0FBQ0ssS0FBekIsQ0FBaEI7RUFDQWswQixTQUFTLENBQUN4eEIsTUFBVixHQUFtQixJQUFuQjtFQUNBd3hCLFNBQVMsQ0FBQzdrQixRQUFWLEdBQXFCLEVBQXJCO0VBQ0E0a0IsUUFBUSxDQUFDOXJCLENBQVQsR0FBYSxDQUFDLEVBQWQ7RUFDQThyQixRQUFRLENBQUNybEIsTUFBVCxHQUFrQnZELE9BQWxCO0VBRUEsSUFBSXVlLFNBQVMsR0FBRyxJQUFJanFCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxPQUFaLENBQWhCO0VBQ0EsSUFBSW1DLEtBQUssR0FBR3lhLFNBQVMsQ0FBQ3hhLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUNLLEtBQTFCLENBQVo7RUFDQW1QLEtBQUssQ0FBQ3pNLE1BQU4sR0FBZSxNQUFmO0VBQ0F5TSxLQUFLLENBQUNFLFFBQU4sR0FBaUIsRUFBakI7RUFDQUYsS0FBSyxDQUFDRyxVQUFOLEdBQW1CLEVBQW5CO0VBQ0FILEtBQUssQ0FBQ0ksZUFBTixHQUF3QjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBakQ7RUFDQW1hLFNBQVMsQ0FBQ2xhLEtBQVYsR0FBa0IvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBbEI7RUFDQWthLFNBQVMsQ0FBQ2hiLE1BQVYsR0FBbUJ2RCxPQUFuQjtBQUNILENBLytLTCxZQW8vS0kyb0IsbUJBcC9LSixHQW8vS3lCLCtCQUFXO0VBQzVCLElBQUl4eUIsSUFBSSxHQUFHLElBQVgsQ0FENEIsQ0FJNUI7O0VBQ0EsSUFBSTJ5QixRQUFRLEdBQUcsS0FBS3J4QixJQUFMLENBQVUrQyxjQUFWLENBQXlCLGdCQUF6QixDQUFmO0VBQ0EsSUFBSXN1QixRQUFKLEVBQWNBLFFBQVEsQ0FBQ25tQixPQUFULEdBTmMsQ0FRNUI7O0VBQ0EsSUFBSTNILE1BQU0sR0FBRyxLQUFLdkQsSUFBTCxDQUFVQyxZQUFWLENBQXVCcEQsRUFBRSxDQUFDMkcsTUFBMUIsS0FBcUMzRyxFQUFFLENBQUM0RyxJQUFILENBQVEsUUFBUixFQUFrQnhELFlBQWxCLENBQStCcEQsRUFBRSxDQUFDMkcsTUFBbEMsQ0FBbEQ7RUFDQSxJQUFJRSxZQUFZLEdBQUdILE1BQU0sR0FBR0EsTUFBTSxDQUFDSSxnQkFBUCxDQUF3QkMsTUFBM0IsR0FBb0MsR0FBN0Q7RUFDQSxJQUFJQyxXQUFXLEdBQUdOLE1BQU0sR0FBR0EsTUFBTSxDQUFDSSxnQkFBUCxDQUF3QkcsS0FBM0IsR0FBbUMsSUFBM0QsQ0FYNEIsQ0FhNUI7O0VBQ0EsSUFBSXd0QixLQUFLLEdBQUcsSUFBSXowQixFQUFFLENBQUNxTixJQUFQLENBQVksZ0JBQVosQ0FBWjtFQUNBb25CLEtBQUssQ0FBQ3psQixjQUFOLENBQXFCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFROUwsV0FBUixFQUFxQkgsWUFBckIsQ0FBckI7RUFDQTR0QixLQUFLLENBQUNyc0IsT0FBTixHQUFnQixHQUFoQjtFQUNBcXNCLEtBQUssQ0FBQ3BzQixPQUFOLEdBQWdCLEdBQWhCO0VBQ0Fvc0IsS0FBSyxDQUFDanNCLENBQU4sR0FBVSxDQUFWO0VBQ0Fpc0IsS0FBSyxDQUFDL3NCLENBQU4sR0FBVSxDQUFWO0VBQ0Erc0IsS0FBSyxDQUFDaGtCLE1BQU4sR0FBZSxJQUFmO0VBQ0Fna0IsS0FBSyxDQUFDeGxCLE1BQU4sR0FBZSxLQUFLOUwsSUFBcEIsQ0FyQjRCLENBdUI1Qjs7RUFDQXN4QixLQUFLLENBQUNobEIsWUFBTixDQUFtQnpQLEVBQUUsQ0FBQyt5QixnQkFBdEIsRUF4QjRCLENBMEI1Qjs7RUFDQSxJQUFJMkIsTUFBTSxHQUFHLElBQUkxMEIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFFBQVosQ0FBYjtFQUNBcW5CLE1BQU0sQ0FBQzFsQixjQUFQLENBQXNCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFROUwsV0FBUixFQUFxQkgsWUFBckIsQ0FBdEI7RUFDQSxJQUFJOHRCLEtBQUssR0FBR0QsTUFBTSxDQUFDamxCLFlBQVAsQ0FBb0J6UCxFQUFFLENBQUNrVCxRQUF2QixDQUFaO0VBQ0F5aEIsS0FBSyxDQUFDeGhCLFNBQU4sR0FBa0JuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxDQUFmLEVBQWtCLEdBQWxCLENBQWxCO0VBQ0E0a0IsS0FBSyxDQUFDMVosSUFBTixDQUFXLENBQUNqVSxXQUFELEdBQWEsQ0FBeEIsRUFBMkIsQ0FBQ0gsWUFBRCxHQUFjLENBQXpDLEVBQTRDRyxXQUE1QyxFQUF5REgsWUFBekQ7RUFDQTh0QixLQUFLLENBQUN0aEIsSUFBTjtFQUNBcWhCLE1BQU0sQ0FBQ3psQixNQUFQLEdBQWdCd2xCLEtBQWhCLENBakM0QixDQW1DNUI7O0VBQ0FDLE1BQU0sQ0FBQy92QixFQUFQLENBQVUzRSxFQUFFLENBQUNxTixJQUFILENBQVFDLFNBQVIsQ0FBa0JDLFNBQTVCLEVBQXVDLFlBQVc7SUFDOUNrbkIsS0FBSyxDQUFDcG1CLE9BQU47RUFDSCxDQUZELEVBRUcsSUFGSCxFQXBDNEIsQ0F3QzVCOztFQUNBLElBQUlLLFVBQVUsR0FBRyxHQUFqQjtFQUNBLElBQUlHLFdBQVcsR0FBRyxHQUFsQjtFQUNBLElBQUlPLEtBQUssR0FBRyxJQUFJcFAsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLE9BQVosQ0FBWjtFQUNBK0IsS0FBSyxDQUFDSixjQUFOLENBQXFCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFRcEUsVUFBUixFQUFvQkcsV0FBcEIsQ0FBckI7RUFDQU8sS0FBSyxDQUFDSCxNQUFOLEdBQWV3bEIsS0FBZixDQTdDNEIsQ0ErQzVCOztFQUNBLElBQUlHLE1BQU0sR0FBRyxJQUFJNTBCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxRQUFaLENBQWI7RUFDQSxJQUFJd25CLFNBQVMsR0FBR0QsTUFBTSxDQUFDbmxCLFlBQVAsQ0FBb0J6UCxFQUFFLENBQUNrVCxRQUF2QixDQUFoQjtFQUNBMmhCLFNBQVMsQ0FBQzFoQixTQUFWLEdBQXNCblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixFQUFsQixDQUF0QjtFQUNBOGtCLFNBQVMsQ0FBQ3poQixTQUFWLENBQW9CLENBQUMxRSxVQUFELEdBQVksQ0FBWixHQUFnQixDQUFwQyxFQUF1QyxDQUFDRyxXQUFELEdBQWEsQ0FBYixHQUFpQixDQUF4RCxFQUEyREgsVUFBM0QsRUFBdUVHLFdBQXZFLEVBQW9GLEVBQXBGO0VBQ0FnbUIsU0FBUyxDQUFDeGhCLElBQVY7RUFDQXVoQixNQUFNLENBQUMzbEIsTUFBUCxHQUFnQkcsS0FBaEIsQ0FyRDRCLENBdUQ1Qjs7RUFDQSxJQUFJMGxCLE1BQU0sR0FBRyxJQUFJOTBCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxRQUFaLENBQWI7RUFDQXluQixNQUFNLENBQUM5bEIsY0FBUCxDQUFzQmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUXBFLFVBQVIsRUFBb0JHLFdBQXBCLENBQXRCO0VBQ0EsSUFBSWttQixPQUFPLEdBQUdELE1BQU0sQ0FBQ3JsQixZQUFQLENBQW9CelAsRUFBRSxDQUFDa1QsUUFBdkIsQ0FBZDtFQUNBNmhCLE9BQU8sQ0FBQzVoQixTQUFSLEdBQW9CblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCLEVBQXFCLEdBQXJCLENBQXBCO0VBQ0FnbEIsT0FBTyxDQUFDM2hCLFNBQVIsQ0FBa0IsQ0FBQzFFLFVBQUQsR0FBWSxDQUE5QixFQUFpQyxDQUFDRyxXQUFELEdBQWEsQ0FBOUMsRUFBaURILFVBQWpELEVBQTZERyxXQUE3RCxFQUEwRSxFQUExRTtFQUNBa21CLE9BQU8sQ0FBQzFoQixJQUFSO0VBQ0EwaEIsT0FBTyxDQUFDNVosV0FBUixHQUFzQm5iLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsRUFBZCxFQUFrQixFQUFsQixDQUF0QjtFQUNBZ2xCLE9BQU8sQ0FBQzNaLFNBQVIsR0FBb0IsQ0FBcEI7RUFDQTJaLE9BQU8sQ0FBQzNoQixTQUFSLENBQWtCLENBQUMxRSxVQUFELEdBQVksQ0FBOUIsRUFBaUMsQ0FBQ0csV0FBRCxHQUFhLENBQTlDLEVBQWlESCxVQUFqRCxFQUE2REcsV0FBN0QsRUFBMEUsRUFBMUU7RUFDQWttQixPQUFPLENBQUMxWixNQUFSO0VBQ0F5WixNQUFNLENBQUM3bEIsTUFBUCxHQUFnQkcsS0FBaEIsQ0FsRTRCLENBb0U1Qjs7RUFDQSxJQUFJNGxCLE1BQU0sR0FBRyxJQUFJaDFCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxRQUFaLENBQWI7RUFDQTJuQixNQUFNLENBQUNobUIsY0FBUCxDQUFzQmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUXBFLFVBQVIsRUFBb0IsQ0FBcEIsQ0FBdEI7RUFDQXNtQixNQUFNLENBQUN0dEIsQ0FBUCxHQUFXbUgsV0FBVyxHQUFDLENBQVosR0FBZ0IsQ0FBM0I7RUFDQSxJQUFJb21CLE1BQU0sR0FBR0QsTUFBTSxDQUFDdmxCLFlBQVAsQ0FBb0J6UCxFQUFFLENBQUNrVCxRQUF2QixDQUFiO0VBQ0EraEIsTUFBTSxDQUFDOWhCLFNBQVAsR0FBbUJuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEdBQWIsRUFBa0IsRUFBbEIsQ0FBbkIsQ0F6RTRCLENBeUVlOztFQUMzQ2tsQixNQUFNLENBQUM3aEIsU0FBUCxDQUFpQixDQUFDMUUsVUFBRCxHQUFZLENBQTdCLEVBQWdDLENBQUMsQ0FBakMsRUFBb0NBLFVBQXBDLEVBQWdELENBQWhELEVBQW1ELENBQUMsRUFBRCxFQUFLLEVBQUwsRUFBUyxDQUFULEVBQVksQ0FBWixDQUFuRDtFQUNBdW1CLE1BQU0sQ0FBQzVoQixJQUFQO0VBQ0EyaEIsTUFBTSxDQUFDL2xCLE1BQVAsR0FBZ0JHLEtBQWhCLENBNUU0QixDQThFNUI7O0VBQ0EsSUFBSThsQixPQUFPLEdBQUcsSUFBSWwxQixFQUFFLENBQUNxTixJQUFQLENBQVksU0FBWixDQUFkO0VBQ0E2bkIsT0FBTyxDQUFDbG1CLGNBQVIsQ0FBdUJoUCxFQUFFLENBQUM4UyxJQUFILENBQVFwRSxVQUFVLEdBQUcsRUFBckIsRUFBeUIsRUFBekIsQ0FBdkI7RUFDQXdtQixPQUFPLENBQUN4dEIsQ0FBUixHQUFZbUgsV0FBVyxHQUFDLENBQVosR0FBZ0IsRUFBNUI7RUFDQSxJQUFJc21CLFVBQVUsR0FBR0QsT0FBTyxDQUFDemxCLFlBQVIsQ0FBcUJ6UCxFQUFFLENBQUNrVCxRQUF4QixDQUFqQjtFQUNBaWlCLFVBQVUsQ0FBQ2hpQixTQUFYLEdBQXVCblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCLEVBQXFCLEdBQXJCLENBQXZCO0VBQ0FvbEIsVUFBVSxDQUFDL2hCLFNBQVgsQ0FBcUIsRUFBRTFFLFVBQVUsR0FBRyxFQUFmLElBQW1CLENBQXhDLEVBQTJDLENBQUMsRUFBNUMsRUFBZ0RBLFVBQVUsR0FBRyxFQUE3RCxFQUFpRSxFQUFqRSxFQUFxRSxFQUFyRTtFQUNBeW1CLFVBQVUsQ0FBQzloQixJQUFYO0VBQ0E2aEIsT0FBTyxDQUFDam1CLE1BQVIsR0FBaUJHLEtBQWpCLENBdEY0QixDQXdGNUI7O0VBQ0EsSUFBSWtsQixRQUFRLEdBQUcsSUFBSXQwQixFQUFFLENBQUNxTixJQUFQLENBQVksTUFBWixDQUFmO0VBQ0EsSUFBSWtuQixTQUFTLEdBQUdELFFBQVEsQ0FBQzdrQixZQUFULENBQXNCelAsRUFBRSxDQUFDSyxLQUF6QixDQUFoQjtFQUNBazBCLFNBQVMsQ0FBQ3h4QixNQUFWLEdBQW1CLElBQW5CO0VBQ0F3eEIsU0FBUyxDQUFDN2tCLFFBQVYsR0FBcUIsRUFBckI7RUFDQTRrQixRQUFRLENBQUM5ckIsQ0FBVCxHQUFhLENBQUMsR0FBZDtFQUNBOHJCLFFBQVEsQ0FBQzVzQixDQUFULEdBQWFtSCxXQUFXLEdBQUMsQ0FBWixHQUFnQixFQUE3QjtFQUNBeWxCLFFBQVEsQ0FBQ3JsQixNQUFULEdBQWtCRyxLQUFsQixDQS9GNEIsQ0FpRzVCOztFQUNBLElBQUlFLFNBQVMsR0FBRyxJQUFJdFAsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLE9BQVosQ0FBaEI7RUFDQSxJQUFJdUcsVUFBVSxHQUFHdEUsU0FBUyxDQUFDRyxZQUFWLENBQXVCelAsRUFBRSxDQUFDSyxLQUExQixDQUFqQjtFQUNBdVQsVUFBVSxDQUFDN1EsTUFBWCxHQUFvQixNQUFwQjtFQUNBNlEsVUFBVSxDQUFDbEUsUUFBWCxHQUFzQixFQUF0QjtFQUNBa0UsVUFBVSxDQUFDakUsVUFBWCxHQUF3QixFQUF4QjtFQUNBaUUsVUFBVSxDQUFDaEUsZUFBWCxHQUE2QjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBdEQ7RUFDQVIsU0FBUyxDQUFDUyxLQUFWLEdBQWtCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWxCO0VBQ0FULFNBQVMsQ0FBQzVILENBQVYsR0FBY21ILFdBQVcsR0FBQyxDQUFaLEdBQWdCLEVBQTlCO0VBQ0FTLFNBQVMsQ0FBQ0wsTUFBVixHQUFtQkcsS0FBbkIsQ0ExRzRCLENBNEc1Qjs7RUFDQSxJQUFJZ21CLFlBQVksR0FBRyxJQUFJcDFCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxVQUFaLENBQW5CO0VBQ0EsSUFBSWdvQixhQUFhLEdBQUdELFlBQVksQ0FBQzNsQixZQUFiLENBQTBCelAsRUFBRSxDQUFDSyxLQUE3QixDQUFwQjtFQUNBZzFCLGFBQWEsQ0FBQ3R5QixNQUFkLEdBQXVCLGtCQUF2QjtFQUNBc3lCLGFBQWEsQ0FBQzNsQixRQUFkLEdBQXlCLEVBQXpCO0VBQ0EybEIsYUFBYSxDQUFDemxCLGVBQWQsR0FBZ0M1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQXpEO0VBQ0FzbEIsWUFBWSxDQUFDcmxCLEtBQWIsR0FBcUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBckI7RUFDQXFsQixZQUFZLENBQUMxdEIsQ0FBYixHQUFpQm1ILFdBQVcsR0FBQyxDQUFaLEdBQWdCLEVBQWpDO0VBQ0F1bUIsWUFBWSxDQUFDbm1CLE1BQWIsR0FBc0JHLEtBQXRCLENBcEg0QixDQXNINUI7O0VBQ0EsSUFBSWttQixVQUFVLEdBQUcsRUFBakIsQ0F2SDRCLENBeUg1Qjs7RUFDQSxJQUFJdEYsVUFBVSxHQUFHLElBQUlod0IsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFlBQVosQ0FBakI7RUFDQSxJQUFJNGlCLGNBQWMsR0FBR0QsVUFBVSxDQUFDdmdCLFlBQVgsQ0FBd0J6UCxFQUFFLENBQUNLLEtBQTNCLENBQXJCO0VBQ0E0dkIsY0FBYyxDQUFDbHRCLE1BQWYsR0FBd0IsS0FBeEI7RUFDQWt0QixjQUFjLENBQUN2Z0IsUUFBZixHQUEwQixFQUExQjtFQUNBc2dCLFVBQVUsQ0FBQ2pnQixLQUFYLEdBQW1CL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQW5CO0VBQ0FpZ0IsVUFBVSxDQUFDeG5CLENBQVgsR0FBZSxDQUFDa0csVUFBRCxHQUFZLENBQVosR0FBZ0IsRUFBL0I7RUFDQXNoQixVQUFVLENBQUN0b0IsQ0FBWCxHQUFlNHRCLFVBQVUsR0FBRyxFQUE1QjtFQUNBdEYsVUFBVSxDQUFDL2dCLE1BQVgsR0FBb0JHLEtBQXBCLENBakk0QixDQW1JNUI7O0VBQ0EsSUFBSStnQixPQUFPLEdBQUcsSUFBSW53QixFQUFFLENBQUNxTixJQUFQLENBQVksU0FBWixDQUFkO0VBQ0E4aUIsT0FBTyxDQUFDbmhCLGNBQVIsQ0FBdUJoUCxFQUFFLENBQUM4UyxJQUFILENBQVEsR0FBUixFQUFhLEVBQWIsQ0FBdkI7RUFDQXFkLE9BQU8sQ0FBQ3pvQixDQUFSLEdBQVk0dEIsVUFBWjtFQUNBLElBQUlDLFFBQVEsR0FBR3BGLE9BQU8sQ0FBQzFnQixZQUFSLENBQXFCelAsRUFBRSxDQUFDa1QsUUFBeEIsQ0FBZjtFQUNBcWlCLFFBQVEsQ0FBQ3BpQixTQUFULEdBQXFCblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCLEVBQXFCLEdBQXJCLENBQXJCO0VBQ0F3bEIsUUFBUSxDQUFDbmlCLFNBQVQsQ0FBbUIsQ0FBQyxHQUFwQixFQUF5QixDQUFDLElBQTFCLEVBQWdDLEdBQWhDLEVBQXFDLEVBQXJDLEVBQXlDLEVBQXpDO0VBQ0FtaUIsUUFBUSxDQUFDbGlCLElBQVQ7RUFDQWtpQixRQUFRLENBQUNwYSxXQUFULEdBQXVCbmIsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxHQUFiLEVBQWtCLEVBQWxCLENBQXZCO0VBQ0F3bEIsUUFBUSxDQUFDbmEsU0FBVCxHQUFxQixDQUFyQjtFQUNBbWEsUUFBUSxDQUFDbmlCLFNBQVQsQ0FBbUIsQ0FBQyxHQUFwQixFQUF5QixDQUFDLElBQTFCLEVBQWdDLEdBQWhDLEVBQXFDLEVBQXJDLEVBQXlDLEVBQXpDO0VBQ0FtaUIsUUFBUSxDQUFDbGEsTUFBVDtFQUNBOFUsT0FBTyxDQUFDbGhCLE1BQVIsR0FBaUJHLEtBQWpCLENBL0k0QixDQWlKNUI7O0VBQ0EsSUFBSXlYLFNBQVMsR0FBRyxJQUFJN21CLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxhQUFaLENBQWhCO0VBQ0F3WixTQUFTLENBQUM3WCxjQUFWLENBQXlCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFRLEdBQVIsRUFBYSxFQUFiLENBQXpCO0VBQ0EsSUFBSXFULE9BQU8sR0FBR1UsU0FBUyxDQUFDcFgsWUFBVixDQUF1QnpQLEVBQUUsQ0FBQ29tQixPQUExQixDQUFkO0VBQ0FELE9BQU8sQ0FBQ1MsV0FBUixHQUFzQixZQUF0QjtFQUNBVCxPQUFPLENBQUN6VyxRQUFSLEdBQW1CLEVBQW5CO0VBQ0F5VyxPQUFPLENBQUNhLG1CQUFSLEdBQThCLEVBQTlCO0VBQ0FiLE9BQU8sQ0FBQ1ksU0FBUixHQUFvQi9tQixFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBcEI7RUFDQW9XLE9BQU8sQ0FBQ2Msb0JBQVIsR0FBK0JqbkIsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQS9CO0VBQ0FvVyxPQUFPLENBQUNxUCxTQUFSLEdBQW9CeDFCLEVBQUUsQ0FBQ29tQixPQUFILENBQVdxUCxTQUFYLENBQXFCQyxTQUF6QztFQUNBdlAsT0FBTyxDQUFDZ0IsU0FBUixHQUFvQm5uQixFQUFFLENBQUNvbUIsT0FBSCxDQUFXZ0IsU0FBWCxDQUFxQkMsT0FBekM7RUFDQWxCLE9BQU8sQ0FBQ2UsU0FBUixHQUFvQixFQUFwQjtFQUNBZixPQUFPLENBQUN3UCxlQUFSLEdBQTBCMzFCLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsQ0FBbEIsQ0FBMUI7RUFDQThXLFNBQVMsQ0FBQzVYLE1BQVYsR0FBbUJraEIsT0FBbkIsQ0E5SjRCLENBZ0s1Qjs7RUFDQSxJQUFJeUYsS0FBSyxHQUFHLElBQUk1MUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLE9BQVosQ0FBWjtFQUNBdW9CLEtBQUssQ0FBQzVtQixjQUFOLENBQXFCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFRLEdBQVIsRUFBYSxFQUFiLENBQXJCO0VBQ0E4aUIsS0FBSyxDQUFDbHVCLENBQU4sR0FBVTR0QixVQUFVLEdBQUcsRUFBdkI7RUFDQSxJQUFJTyxNQUFNLEdBQUdELEtBQUssQ0FBQ25tQixZQUFOLENBQW1CelAsRUFBRSxDQUFDa1QsUUFBdEIsQ0FBYjtFQUNBMmlCLE1BQU0sQ0FBQzFpQixTQUFQLEdBQW1CblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCLEVBQXFCLEdBQXJCLENBQW5CO0VBQ0E4bEIsTUFBTSxDQUFDemlCLFNBQVAsQ0FBaUIsQ0FBQyxHQUFsQixFQUF1QixDQUFDLElBQXhCLEVBQThCLEdBQTlCLEVBQW1DLEVBQW5DLEVBQXVDLENBQXZDO0VBQ0F5aUIsTUFBTSxDQUFDeGlCLElBQVA7RUFDQXVpQixLQUFLLENBQUMzbUIsTUFBTixHQUFlRyxLQUFmO0VBRUEsSUFBSTBtQixPQUFPLEdBQUcsSUFBSTkxQixFQUFFLENBQUNxTixJQUFQLENBQVksU0FBWixDQUFkO0VBQ0EsSUFBSTBvQixZQUFZLEdBQUdELE9BQU8sQ0FBQ3JtQixZQUFSLENBQXFCelAsRUFBRSxDQUFDSyxLQUF4QixDQUFuQjtFQUNBMDFCLFlBQVksQ0FBQ2h6QixNQUFiLEdBQXNCLElBQXRCO0VBQ0FnekIsWUFBWSxDQUFDcm1CLFFBQWIsR0FBd0IsRUFBeEI7RUFDQW9tQixPQUFPLENBQUN0dEIsQ0FBUixHQUFZLENBQUMsR0FBYjtFQUNBc3RCLE9BQU8sQ0FBQ3B1QixDQUFSLEdBQVk0dEIsVUFBVSxHQUFHLEVBQXpCO0VBQ0FRLE9BQU8sQ0FBQzdtQixNQUFSLEdBQWlCRyxLQUFqQjtFQUVBLElBQUlpVCxPQUFPLEdBQUcsSUFBSXJpQixFQUFFLENBQUNxTixJQUFQLENBQVksS0FBWixDQUFkO0VBQ0EsSUFBSWlWLFFBQVEsR0FBR0QsT0FBTyxDQUFDNVMsWUFBUixDQUFxQnpQLEVBQUUsQ0FBQ0ssS0FBeEIsQ0FBZjtFQUNBaWlCLFFBQVEsQ0FBQ3ZmLE1BQVQsR0FBa0IscUJBQWxCO0VBQ0F1ZixRQUFRLENBQUM1UyxRQUFULEdBQW9CLEVBQXBCO0VBQ0E0UyxRQUFRLENBQUMxUyxlQUFULEdBQTJCNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUFwRDtFQUNBdVMsT0FBTyxDQUFDdFMsS0FBUixHQUFnQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFoQjtFQUNBc1MsT0FBTyxDQUFDM2EsQ0FBUixHQUFZNHRCLFVBQVUsR0FBRyxFQUF6QjtFQUNBalQsT0FBTyxDQUFDcFQsTUFBUixHQUFpQkcsS0FBakIsQ0F6TDRCLENBMkw1Qjs7RUFDQSxJQUFJME0sSUFBSSxHQUFHLENBQUNqTixXQUFELEdBQWEsQ0FBYixHQUFpQixFQUE1QixDQTVMNEIsQ0E4TDVCOztFQUNBLElBQUl3TixTQUFTLEdBQUcsSUFBSXJjLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxXQUFaLENBQWhCO0VBQ0FnUCxTQUFTLENBQUNyTixjQUFWLENBQXlCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFRLEdBQVIsRUFBYSxFQUFiLENBQXpCO0VBQ0F1SixTQUFTLENBQUM3VCxDQUFWLEdBQWMsQ0FBQyxFQUFmO0VBQ0E2VCxTQUFTLENBQUMzVSxDQUFWLEdBQWNvVSxJQUFkO0VBQ0EsSUFBSWthLFNBQVMsR0FBRzNaLFNBQVMsQ0FBQzVNLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUNrVCxRQUExQixDQUFoQjtFQUNBOGlCLFNBQVMsQ0FBQzdpQixTQUFWLEdBQXNCblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCLENBQXRCO0VBQ0FpbUIsU0FBUyxDQUFDNWlCLFNBQVYsQ0FBb0IsQ0FBQyxFQUFyQixFQUF5QixDQUFDLEVBQTFCLEVBQThCLEdBQTlCLEVBQW1DLEVBQW5DLEVBQXVDLEVBQXZDO0VBQ0E0aUIsU0FBUyxDQUFDM2lCLElBQVY7RUFDQTJpQixTQUFTLENBQUM3YSxXQUFWLEdBQXdCbmIsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxFQUFkLEVBQWtCLEdBQWxCLENBQXhCO0VBQ0FpbUIsU0FBUyxDQUFDNWEsU0FBVixHQUFzQixDQUF0QjtFQUNBNGEsU0FBUyxDQUFDNWlCLFNBQVYsQ0FBb0IsQ0FBQyxFQUFyQixFQUF5QixDQUFDLEVBQTFCLEVBQThCLEdBQTlCLEVBQW1DLEVBQW5DLEVBQXVDLEVBQXZDO0VBQ0E0aUIsU0FBUyxDQUFDM2EsTUFBVjtFQUNBZ0IsU0FBUyxDQUFDcE4sTUFBVixHQUFtQkcsS0FBbkI7RUFFQSxJQUFJNm1CLFdBQVcsR0FBRyxJQUFJajJCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxPQUFaLENBQWxCO0VBQ0EsSUFBSTZvQixlQUFlLEdBQUdELFdBQVcsQ0FBQ3htQixZQUFaLENBQXlCelAsRUFBRSxDQUFDSyxLQUE1QixDQUF0QjtFQUNBNjFCLGVBQWUsQ0FBQ256QixNQUFoQixHQUF5QixJQUF6QjtFQUNBbXpCLGVBQWUsQ0FBQ3htQixRQUFoQixHQUEyQixFQUEzQjtFQUNBd21CLGVBQWUsQ0FBQ3RtQixlQUFoQixHQUFrQzVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBM0Q7RUFDQW1tQixXQUFXLENBQUNsbUIsS0FBWixHQUFvQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFwQjtFQUNBa21CLFdBQVcsQ0FBQ2huQixNQUFaLEdBQXFCb04sU0FBckI7RUFFQSxJQUFJOFosYUFBYSxHQUFHOVosU0FBUyxDQUFDNU0sWUFBVixDQUF1QnpQLEVBQUUsQ0FBQzZNLE1BQTFCLENBQXBCO0VBQ0FzcEIsYUFBYSxDQUFDcnBCLFVBQWQsR0FBMkI5TSxFQUFFLENBQUM2TSxNQUFILENBQVVFLFVBQVYsQ0FBcUJDLEtBQWhEO0VBQ0FtcEIsYUFBYSxDQUFDanBCLFNBQWQsR0FBMEIsSUFBMUI7RUFFQW1QLFNBQVMsQ0FBQzFYLEVBQVYsQ0FBYTNFLEVBQUUsQ0FBQ3FOLElBQUgsQ0FBUUMsU0FBUixDQUFrQkMsU0FBL0IsRUFBMEMsWUFBVztJQUNqRGtuQixLQUFLLENBQUNwbUIsT0FBTjtFQUNILENBRkQsRUFFRyxJQUZILEVBek40QixDQTZONUI7O0VBQ0EsSUFBSWdmLFVBQVUsR0FBRyxJQUFJcnRCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxZQUFaLENBQWpCO0VBQ0FnZ0IsVUFBVSxDQUFDcmUsY0FBWCxDQUEwQmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUSxHQUFSLEVBQWEsRUFBYixDQUExQjtFQUNBdWEsVUFBVSxDQUFDN2tCLENBQVgsR0FBZSxHQUFmO0VBQ0E2a0IsVUFBVSxDQUFDM2xCLENBQVgsR0FBZW9VLElBQWY7RUFDQSxJQUFJc2EsVUFBVSxHQUFHL0ksVUFBVSxDQUFDNWQsWUFBWCxDQUF3QnpQLEVBQUUsQ0FBQ2tULFFBQTNCLENBQWpCO0VBQ0FrakIsVUFBVSxDQUFDampCLFNBQVgsR0FBdUJuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEdBQWIsRUFBa0IsRUFBbEIsQ0FBdkIsQ0FuTzRCLENBbU9tQjs7RUFDL0NxbUIsVUFBVSxDQUFDaGpCLFNBQVgsQ0FBcUIsQ0FBQyxFQUF0QixFQUEwQixDQUFDLEVBQTNCLEVBQStCLEdBQS9CLEVBQW9DLEVBQXBDLEVBQXdDLEVBQXhDO0VBQ0FnakIsVUFBVSxDQUFDL2lCLElBQVg7RUFDQStpQixVQUFVLENBQUNqYixXQUFYLEdBQXlCbmIsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQXpCO0VBQ0FxbUIsVUFBVSxDQUFDaGIsU0FBWCxHQUF1QixDQUF2QjtFQUNBZ2IsVUFBVSxDQUFDaGpCLFNBQVgsQ0FBcUIsQ0FBQyxFQUF0QixFQUEwQixDQUFDLEVBQTNCLEVBQStCLEdBQS9CLEVBQW9DLEVBQXBDLEVBQXdDLEVBQXhDO0VBQ0FnakIsVUFBVSxDQUFDL2EsTUFBWDtFQUNBZ1MsVUFBVSxDQUFDcGUsTUFBWCxHQUFvQkcsS0FBcEI7RUFFQSxJQUFJaW5CLFdBQVcsR0FBRyxJQUFJcjJCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxNQUFaLENBQWxCO0VBQ0EsSUFBSWlwQixnQkFBZ0IsR0FBR0QsV0FBVyxDQUFDNW1CLFlBQVosQ0FBeUJ6UCxFQUFFLENBQUNLLEtBQTVCLENBQXZCO0VBQ0FpMkIsZ0JBQWdCLENBQUN2ekIsTUFBakIsR0FBMEIsR0FBMUI7RUFDQXV6QixnQkFBZ0IsQ0FBQzVtQixRQUFqQixHQUE0QixFQUE1QjtFQUNBMm1CLFdBQVcsQ0FBQzd0QixDQUFaLEdBQWdCLENBQUMsRUFBakI7RUFDQTZ0QixXQUFXLENBQUN0bUIsS0FBWixHQUFvQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFwQjtFQUNBc21CLFdBQVcsQ0FBQ3BuQixNQUFaLEdBQXFCb2UsVUFBckI7RUFFQSxJQUFJa0osWUFBWSxHQUFHLElBQUl2MkIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLE9BQVosQ0FBbkI7RUFDQSxJQUFJbXBCLGdCQUFnQixHQUFHRCxZQUFZLENBQUM5bUIsWUFBYixDQUEwQnpQLEVBQUUsQ0FBQ0ssS0FBN0IsQ0FBdkI7RUFDQW0yQixnQkFBZ0IsQ0FBQ3p6QixNQUFqQixHQUEwQixNQUExQjtFQUNBeXpCLGdCQUFnQixDQUFDOW1CLFFBQWpCLEdBQTRCLEVBQTVCO0VBQ0E4bUIsZ0JBQWdCLENBQUM1bUIsZUFBakIsR0FBbUM1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQTVEO0VBQ0F5bUIsWUFBWSxDQUFDeG1CLEtBQWIsR0FBcUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBckI7RUFDQXdtQixZQUFZLENBQUN0bkIsTUFBYixHQUFzQm9lLFVBQXRCO0VBRUEsSUFBSW9KLGNBQWMsR0FBR3BKLFVBQVUsQ0FBQzVkLFlBQVgsQ0FBd0J6UCxFQUFFLENBQUM2TSxNQUEzQixDQUFyQjtFQUNBNHBCLGNBQWMsQ0FBQzNwQixVQUFmLEdBQTRCOU0sRUFBRSxDQUFDNk0sTUFBSCxDQUFVRSxVQUFWLENBQXFCQyxLQUFqRDtFQUNBeXBCLGNBQWMsQ0FBQ3ZwQixTQUFmLEdBQTJCLElBQTNCLENBOVA0QixDQWdRNUI7O0VBQ0FtZ0IsVUFBVSxDQUFDMW9CLEVBQVgsQ0FBYzNFLEVBQUUsQ0FBQ3FOLElBQUgsQ0FBUUMsU0FBUixDQUFrQkMsU0FBaEMsRUFBMkMsWUFBVztJQUNsRCxJQUFJa0UsTUFBTSxHQUFHMFUsT0FBTyxDQUFDcGpCLE1BQXJCOztJQUVBLElBQUksQ0FBQzBPLE1BQUQsSUFBV0EsTUFBTSxDQUFDcEwsTUFBUCxLQUFrQixDQUFqQyxFQUFvQztNQUNoQ3hFLElBQUksQ0FBQ2lELFlBQUwsQ0FBa0IsUUFBbEI7O01BQ0E7SUFDSCxDQU5pRCxDQVFsRDs7O0lBQ0FqRCxJQUFJLENBQUM2MEIsYUFBTCxDQUFtQmpsQixNQUFuQixFQUEyQmdqQixLQUEzQjtFQUNILENBVkQsRUFVRyxJQVZILEVBalE0QixDQTZRNUI7O0VBQ0EsSUFBSTFKLFFBQVEsR0FBRyxJQUFJL3FCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxVQUFaLENBQWY7RUFDQTBkLFFBQVEsQ0FBQy9iLGNBQVQsQ0FBd0JoUCxFQUFFLENBQUM4UyxJQUFILENBQVEsRUFBUixFQUFZLEVBQVosQ0FBeEI7RUFDQWlZLFFBQVEsQ0FBQ3ZpQixDQUFULEdBQWFrRyxVQUFVLEdBQUMsQ0FBWCxHQUFlLEVBQTVCO0VBQ0FxYyxRQUFRLENBQUNyakIsQ0FBVCxHQUFhbUgsV0FBVyxHQUFDLENBQVosR0FBZ0IsRUFBN0I7RUFDQSxJQUFJOG5CLFFBQVEsR0FBRzVMLFFBQVEsQ0FBQ3RiLFlBQVQsQ0FBc0J6UCxFQUFFLENBQUNrVCxRQUF6QixDQUFmO0VBQ0F5akIsUUFBUSxDQUFDeGpCLFNBQVQsR0FBcUJuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakIsQ0FBckI7RUFDQTRtQixRQUFRLENBQUN2UixNQUFULENBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLEVBQXRCO0VBQ0F1UixRQUFRLENBQUN0akIsSUFBVDtFQUNBMFgsUUFBUSxDQUFDOWIsTUFBVCxHQUFrQkcsS0FBbEI7RUFFQSxJQUFJNmIsTUFBTSxHQUFHLElBQUlqckIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLEdBQVosQ0FBYjtFQUNBLElBQUk2ZCxVQUFVLEdBQUdELE1BQU0sQ0FBQ3hiLFlBQVAsQ0FBb0J6UCxFQUFFLENBQUNLLEtBQXZCLENBQWpCO0VBQ0E2cUIsVUFBVSxDQUFDbm9CLE1BQVgsR0FBb0IsR0FBcEI7RUFDQW1vQixVQUFVLENBQUN4YixRQUFYLEdBQXNCLEVBQXRCO0VBQ0F3YixVQUFVLENBQUN2YixVQUFYLEdBQXdCLEVBQXhCO0VBQ0F1YixVQUFVLENBQUN0YixlQUFYLEdBQTZCNVAsRUFBRSxDQUFDSyxLQUFILENBQVN3UCxlQUFULENBQXlCQyxNQUF0RDtFQUNBbWIsTUFBTSxDQUFDbGIsS0FBUCxHQUFlL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWY7RUFDQWtiLE1BQU0sQ0FBQ2hjLE1BQVAsR0FBZ0I4YixRQUFoQjtFQUVBQSxRQUFRLENBQUNwbUIsRUFBVCxDQUFZM0UsRUFBRSxDQUFDcU4sSUFBSCxDQUFRQyxTQUFSLENBQWtCQyxTQUE5QixFQUF5QyxZQUFXO0lBQ2hEa25CLEtBQUssQ0FBQ3BtQixPQUFOO0VBQ0gsQ0FGRCxFQUVHLElBRkg7QUFJSCxDQXp4TEwsWUE4eExJcW9CLGFBOXhMSixHQTh4TG1CLHVCQUFTamxCLE1BQVQsRUFBaUJnakIsS0FBakIsRUFBd0I7RUFDbkMsSUFBSTV5QixJQUFJLEdBQUcsSUFBWDtFQUNBLElBQUliLFFBQVEsR0FBR0QsTUFBTSxDQUFDQyxRQUF0Qjs7RUFFQSxJQUFJLENBQUNBLFFBQUQsSUFBYSxDQUFDQSxRQUFRLENBQUMyRSxNQUEzQixFQUFtQztJQUMvQixLQUFLYixZQUFMLENBQWtCLGFBQWxCOztJQUNBO0VBQ0g7O0VBRUQsS0FBS0EsWUFBTCxDQUFrQixXQUFsQixFQVRtQyxDQVduQzs7O0VBQ0E5RCxRQUFRLENBQUMyRSxNQUFULENBQWdCaXhCLGdCQUFoQixDQUFpQztJQUM3Qm5sQixNQUFNLEVBQUVBO0VBRHFCLENBQWpDLEVBRUcsVUFBU2pNLEdBQVQsRUFBYzJFLE1BQWQsRUFBc0I7SUFDckIsSUFBSTNFLEdBQUcsS0FBSyxDQUFaLEVBQWU7TUFDWDNELElBQUksQ0FBQ2lELFlBQUwsQ0FBa0IsY0FBY3FGLE1BQU0sSUFBSSxPQUF4QixDQUFsQjs7TUFDQTtJQUNIOztJQUVEdEksSUFBSSxDQUFDaUQsWUFBTCxDQUFrQixPQUFsQixFQU5xQixDQVFyQjs7O0lBQ0EsSUFBSTJ2QixLQUFKLEVBQVdBLEtBQUssQ0FBQ3BtQixPQUFOLEdBVFUsQ0FXckI7O0lBQ0EsSUFBSWxFLE1BQU0sSUFBSUEsTUFBTSxDQUFDc0gsTUFBckIsRUFBNkI7TUFDekJ6USxRQUFRLENBQUM2USxhQUFULEdBQXlCMUgsTUFBTSxDQUFDc0gsTUFBaEM7SUFDSCxDQWRvQixDQWdCckI7OztJQUNBNVAsSUFBSSxDQUFDb0QsWUFBTCxDQUFrQixZQUFXO01BQ3pCakYsRUFBRSxDQUFDb0MsUUFBSCxDQUFZQyxTQUFaLENBQXNCLFdBQXRCO0lBQ0gsQ0FGRCxFQUVHLEdBRkg7RUFHSCxDQXRCRDtBQXVCSCxDQWowTEwsWUFzMExJaUIsc0JBdDBMSixHQXMwTDRCLGtDQUFXO0VBQy9CLElBQUl0QyxRQUFRLEdBQUdELE1BQU0sQ0FBQ0MsUUFBdEI7RUFDQSxJQUFJaUIsVUFBVSxHQUFHakIsUUFBUSxHQUFHQSxRQUFRLENBQUNpQixVQUFaLEdBQXlCLElBQWxEO0VBRUEsSUFBSSxDQUFDQSxVQUFMLEVBQWlCO0VBRWpCLElBQUlvSyxZQUFZLEdBQUcsS0FBS2hKLG9CQUFMLElBQTZCLENBQWhEOztFQUVBLElBQUlnSixZQUFZLEtBQUssQ0FBckIsRUFBd0I7SUFDcEI7SUFDQSxJQUFJLEtBQUs3TCxXQUFULEVBQXNCO01BQ2xCLEtBQUtBLFdBQUwsQ0FBaUJ1QyxNQUFqQixHQUEwQixNQUFNLEtBQUsrTixXQUFMLENBQWlCN08sVUFBVSxDQUFDb1gsVUFBWCxJQUF5QixDQUExQyxDQUFoQztJQUNILENBSm1CLENBS3BCOzs7SUFDQSxLQUFLd2QsbUJBQUwsQ0FBeUIsQ0FBekI7RUFDSCxDQVBELE1BT087SUFDSDtJQUNBLElBQUksS0FBS3IyQixXQUFULEVBQXNCO01BQ2xCLEtBQUtBLFdBQUwsQ0FBaUJ1QyxNQUFqQixHQUEwQixNQUFNLEtBQUsrTixXQUFMLENBQWlCN08sVUFBVSxDQUFDekIsV0FBWCxJQUEwQixDQUEzQyxDQUFoQztJQUNIOztJQUNELEtBQUtxMkIsbUJBQUwsQ0FBeUIsQ0FBekI7RUFDSDtBQUNKLENBNTFMTCxZQSsxTElBLG1CQS8xTEosR0ErMUx5Qiw2QkFBU3hxQixZQUFULEVBQXVCO0VBQ3hDO0VBQ0EsSUFBSXluQixVQUFVLEdBQUcsS0FBSzN3QixJQUFMLENBQVUrQyxjQUFWLENBQXlCLGFBQXpCLENBQWpCO0VBQ0EsSUFBSSxDQUFDNHRCLFVBQUwsRUFBaUIsT0FIdUIsQ0FLeEM7O0VBQ0EsSUFBSWdELFlBQVksR0FBR2hELFVBQVUsQ0FBQzV0QixjQUFYLENBQTBCLGVBQTFCLENBQW5COztFQUNBLElBQUksQ0FBQzR3QixZQUFMLEVBQW1CO0lBQ2Y7SUFDQUEsWUFBWSxHQUFHLElBQUk5MkIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLGVBQVosQ0FBZjtJQUNBeXBCLFlBQVksQ0FBQ3ZuQixXQUFiLENBQXlCLENBQUMsR0FBMUIsRUFBK0IsRUFBL0I7SUFDQXVuQixZQUFZLENBQUNybUIsTUFBYixHQUFzQixFQUF0QjtJQUNBcW1CLFlBQVksQ0FBQzduQixNQUFiLEdBQXNCNmtCLFVBQXRCO0VBQ0gsQ0FidUMsQ0FleEM7OztFQUNBLElBQUl0a0IsS0FBSyxHQUFHc25CLFlBQVksQ0FBQzF6QixZQUFiLENBQTBCcEQsRUFBRSxDQUFDSyxLQUE3QixDQUFaOztFQUNBLElBQUksQ0FBQ21QLEtBQUwsRUFBWTtJQUNSQSxLQUFLLEdBQUdzbkIsWUFBWSxDQUFDcm5CLFlBQWIsQ0FBMEJ6UCxFQUFFLENBQUNLLEtBQTdCLENBQVI7RUFDSDs7RUFDRG1QLEtBQUssQ0FBQ3pNLE1BQU4sR0FBZXNKLFlBQVksS0FBSyxDQUFqQixHQUFxQixHQUFyQixHQUEyQixHQUExQztFQUNBbUQsS0FBSyxDQUFDRSxRQUFOLEdBQWlCLEVBQWpCO0VBQ0FvbkIsWUFBWSxDQUFDL21CLEtBQWIsR0FBcUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsQ0FBbkIsQ0FBckI7RUFFQSxJQUFJQyxPQUFPLEdBQUc4bUIsWUFBWSxDQUFDMXpCLFlBQWIsQ0FBMEJwRCxFQUFFLENBQUNpUSxZQUE3QixDQUFkOztFQUNBLElBQUksQ0FBQ0QsT0FBTCxFQUFjO0lBQ1ZBLE9BQU8sR0FBRzhtQixZQUFZLENBQUNybkIsWUFBYixDQUEwQnpQLEVBQUUsQ0FBQ2lRLFlBQTdCLENBQVY7RUFDSDs7RUFDREQsT0FBTyxDQUFDRCxLQUFSLEdBQWdCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixDQUFoQjtFQUNBQyxPQUFPLENBQUMvSSxLQUFSLEdBQWdCLENBQWhCO0FBQ0gsQ0E3M0xMLFlBZzRMSXZELHFCQWg0TEosR0FnNEwyQixpQ0FBVztFQUM5QixJQUFJMUMsUUFBUSxHQUFHRCxNQUFNLENBQUNDLFFBQXRCO0VBQ0EsSUFBSWlCLFVBQVUsR0FBR2pCLFFBQVEsR0FBR0EsUUFBUSxDQUFDaUIsVUFBWixHQUF5QixJQUFsRCxDQUY4QixDQUk5Qjs7RUFDQSxJQUFJLEtBQUt4QixnQkFBTCxJQUF5QndCLFVBQTdCLEVBQXlDO0lBQ3JDLEtBQUt4QixnQkFBTCxDQUFzQnNDLE1BQXRCLEdBQStCLFVBQVUsS0FBSytOLFdBQUwsQ0FBaUI3TyxVQUFVLENBQUNvWCxVQUFYLElBQXlCLENBQTFDLENBQXpDO0lBQ0EsS0FBSzVZLGdCQUFMLENBQXNCMEMsSUFBdEIsQ0FBMkJzRCxNQUEzQixHQUFvQyxLQUFwQyxDQUZxQyxDQUVNO0VBQzlDO0FBQ0osQ0F6NExMLFlBNDRMSTlDLHFCQTU0TEosR0E0NEwyQixpQ0FBVztFQUM5QixJQUFJOUIsSUFBSSxHQUFHLElBQVg7O0VBRUEsSUFBSWQsTUFBTSxDQUFDK00sU0FBUCxJQUFvQi9NLE1BQU0sQ0FBQytNLFNBQVAsQ0FBaUJpRSxjQUF6QyxFQUF5RDtJQUNyRGhSLE1BQU0sQ0FBQytNLFNBQVAsQ0FBaUJpRSxjQUFqQixDQUFnQyxVQUFTdk0sR0FBVCxFQUFjWixJQUFkLEVBQW9CO01BQ2hELElBQUlZLEdBQUosRUFBUztRQUNMdkUsT0FBTyxDQUFDQyxJQUFSLENBQWEsV0FBYixFQUEwQnNFLEdBQTFCO1FBQ0E7TUFDSCxDQUorQyxDQU1oRDs7O01BQ0EzRCxJQUFJLENBQUN5QixzQkFBTDs7TUFDQSxJQUFJekIsSUFBSSxDQUFDcEIsZ0JBQUwsSUFBeUJtRSxJQUFJLENBQUN5VSxVQUFMLEtBQW9CclcsU0FBakQsRUFBNEQ7UUFDeERuQixJQUFJLENBQUNwQixnQkFBTCxDQUFzQnNDLE1BQXRCLEdBQStCLFVBQVVsQixJQUFJLENBQUNpUCxXQUFMLENBQWlCbE0sSUFBSSxDQUFDeVUsVUFBdEIsQ0FBekM7TUFDSDtJQUNKLENBWEQ7RUFZSDtBQUNKLENBNzVMTCxZQWs2TEkwZCxpQkFsNkxKLEdBazZMdUIsMkJBQVN0cUIsVUFBVCxFQUFxQjtFQUNwQyxJQUFJNUssSUFBSSxHQUFHLElBQVg7RUFDQSxJQUFJYixRQUFRLEdBQUdELE1BQU0sQ0FBQ0MsUUFBdEI7RUFDQSxJQUFJaUIsVUFBVSxHQUFHakIsUUFBUSxHQUFHQSxRQUFRLENBQUNpQixVQUFaLEdBQXlCLElBQWxEO0VBQ0EsSUFBSW1YLGVBQWUsR0FBR25YLFVBQVUsR0FBSUEsVUFBVSxDQUFDb1gsVUFBWCxJQUF5QixDQUE3QixHQUFrQyxDQUFsRSxDQUpvQyxDQU1wQzs7RUFDQSxJQUFJRSxTQUFTLEdBQUc5TSxVQUFVLENBQUNxUyxVQUFYLElBQXlCclMsVUFBVSxDQUFDOE0sU0FBcEMsSUFBaUQsQ0FBakUsQ0FQb0MsQ0FTcEM7O0VBQ0EsSUFBSThRLFNBQVMsR0FBRyxLQUFLbG5CLElBQUwsQ0FBVStDLGNBQVYsQ0FBeUIsY0FBekIsQ0FBaEI7RUFDQSxJQUFJbWtCLFNBQUosRUFBZUEsU0FBUyxDQUFDaGMsT0FBVixHQVhxQixDQWFwQzs7RUFDQSxJQUFJM0gsTUFBTSxHQUFHLEtBQUt2RCxJQUFMLENBQVVDLFlBQVYsQ0FBdUJwRCxFQUFFLENBQUMyRyxNQUExQixLQUFxQzNHLEVBQUUsQ0FBQzRHLElBQUgsQ0FBUSxRQUFSLEVBQWtCeEQsWUFBbEIsQ0FBK0JwRCxFQUFFLENBQUMyRyxNQUFsQyxDQUFsRDtFQUNBLElBQUlFLFlBQVksR0FBR0gsTUFBTSxHQUFHQSxNQUFNLENBQUNJLGdCQUFQLENBQXdCQyxNQUEzQixHQUFvQyxHQUE3RDtFQUNBLElBQUlDLFdBQVcsR0FBR04sTUFBTSxHQUFHQSxNQUFNLENBQUNJLGdCQUFQLENBQXdCRyxLQUEzQixHQUFtQyxJQUEzRCxDQWhCb0MsQ0FrQnBDOztFQUNBLElBQUlxakIsTUFBTSxHQUFHLElBQUl0cUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLGNBQVosQ0FBYjtFQUNBaWQsTUFBTSxDQUFDdGIsY0FBUCxDQUFzQmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUTlMLFdBQVIsRUFBcUJILFlBQXJCLENBQXRCO0VBQ0F5akIsTUFBTSxDQUFDL2EsV0FBUCxDQUFtQixDQUFuQixFQUFzQixDQUF0QjtFQUNBK2EsTUFBTSxDQUFDN1osTUFBUCxHQUFnQixJQUFoQjtFQUNBNlosTUFBTSxDQUFDcmIsTUFBUCxHQUFnQixLQUFLOUwsSUFBckIsQ0F2Qm9DLENBeUJwQzs7RUFDQSxJQUFJb25CLElBQUksR0FBRyxJQUFJdnFCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxNQUFaLENBQVg7RUFDQSxJQUFJbWQsS0FBSyxHQUFHRCxJQUFJLENBQUM5YSxZQUFMLENBQWtCelAsRUFBRSxDQUFDa1QsUUFBckIsQ0FBWjtFQUNBc1gsS0FBSyxDQUFDclgsU0FBTixHQUFrQm5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsR0FBbEIsQ0FBbEI7RUFDQXlhLEtBQUssQ0FBQ3ZQLElBQU4sQ0FBVyxDQUFDalUsV0FBRCxHQUFhLENBQXhCLEVBQTJCLENBQUNILFlBQUQsR0FBYyxDQUF6QyxFQUE0Q0csV0FBNUMsRUFBeURILFlBQXpEO0VBQ0EyakIsS0FBSyxDQUFDblgsSUFBTjtFQUNBa1gsSUFBSSxDQUFDdGIsTUFBTCxHQUFjcWIsTUFBZDtFQUVBQyxJQUFJLENBQUM1bEIsRUFBTCxDQUFRM0UsRUFBRSxDQUFDcU4sSUFBSCxDQUFRQyxTQUFSLENBQWtCQyxTQUExQixFQUFxQyxVQUFTQyxLQUFULEVBQWdCO0lBQ2pEQSxLQUFLLENBQUNDLGVBQU47RUFDSCxDQUZELEVBakNvQyxDQXFDcEM7O0VBQ0EsSUFBSWdkLFdBQVcsR0FBRyxHQUFsQjtFQUNBLElBQUlDLFlBQVksR0FBRyxHQUFuQjtFQUNBLElBQUlDLFFBQVEsR0FBRyxJQUFJM3FCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxVQUFaLENBQWY7RUFDQXNkLFFBQVEsQ0FBQzNiLGNBQVQsQ0FBd0JoUCxFQUFFLENBQUM4UyxJQUFILENBQVEyWCxXQUFSLEVBQXFCQyxZQUFyQixDQUF4QjtFQUVBLElBQUlFLEdBQUcsR0FBR0QsUUFBUSxDQUFDbGIsWUFBVCxDQUFzQnpQLEVBQUUsQ0FBQ2tULFFBQXpCLENBQVY7RUFDQTBYLEdBQUcsQ0FBQ3pYLFNBQUosR0FBZ0JuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakIsRUFBcUIsR0FBckIsQ0FBaEI7RUFDQTZhLEdBQUcsQ0FBQ3hYLFNBQUosQ0FBYyxDQUFDcVgsV0FBRCxHQUFhLENBQTNCLEVBQThCLENBQUNDLFlBQUQsR0FBYyxDQUE1QyxFQUErQ0QsV0FBL0MsRUFBNERDLFlBQTVELEVBQTBFLEVBQTFFO0VBQ0FFLEdBQUcsQ0FBQ3ZYLElBQUo7RUFDQXVYLEdBQUcsQ0FBQ3pQLFdBQUosR0FBa0JuYixFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsRUFBbkIsRUFBdUIsR0FBdkIsQ0FBbEI7RUFDQTZhLEdBQUcsQ0FBQ3hQLFNBQUosR0FBZ0IsQ0FBaEI7RUFDQXdQLEdBQUcsQ0FBQ3hYLFNBQUosQ0FBYyxDQUFDcVgsV0FBRCxHQUFhLENBQTNCLEVBQThCLENBQUNDLFlBQUQsR0FBYyxDQUE1QyxFQUErQ0QsV0FBL0MsRUFBNERDLFlBQTVELEVBQTBFLEVBQTFFO0VBQ0FFLEdBQUcsQ0FBQ3ZQLE1BQUo7RUFDQXNQLFFBQVEsQ0FBQzFiLE1BQVQsR0FBa0JxYixNQUFsQixDQW5Eb0MsQ0FxRHBDOztFQUNBLElBQUlqYixTQUFTLEdBQUcsSUFBSXJQLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxPQUFaLENBQWhCO0VBQ0FnQyxTQUFTLENBQUNFLFdBQVYsQ0FBc0IsQ0FBdEIsRUFBeUJtYixZQUFZLEdBQUMsQ0FBYixHQUFpQixFQUExQztFQUNBcmIsU0FBUyxDQUFDakgsT0FBVixHQUFvQixHQUFwQjtFQUNBaUgsU0FBUyxDQUFDaEgsT0FBVixHQUFvQixHQUFwQjtFQUNBLElBQUl5aUIsR0FBRyxHQUFHemIsU0FBUyxDQUFDSSxZQUFWLENBQXVCelAsRUFBRSxDQUFDSyxLQUExQixDQUFWO0VBQ0F5cUIsR0FBRyxDQUFDL25CLE1BQUosR0FBYSxPQUFiO0VBQ0ErbkIsR0FBRyxDQUFDcGIsUUFBSixHQUFlLEVBQWY7RUFDQW9iLEdBQUcsQ0FBQ2xiLGVBQUosR0FBc0I1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQS9DO0VBQ0FULFNBQVMsQ0FBQ1UsS0FBVixHQUFrQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFsQjtFQUVBLElBQUkrRCxZQUFZLEdBQUd6RSxTQUFTLENBQUNJLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUNpUSxZQUExQixDQUFuQjtFQUNBNkQsWUFBWSxDQUFDL0QsS0FBYixHQUFxQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixDQUFqQixDQUFyQjtFQUNBK0QsWUFBWSxDQUFDN00sS0FBYixHQUFxQixDQUFyQjtFQUNBb0ksU0FBUyxDQUFDSixNQUFWLEdBQW1CcWIsTUFBbkIsQ0FuRW9DLENBcUVwQzs7RUFDQSxJQUFJME0sWUFBWSxHQUFHLElBQUloM0IsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFVBQVosQ0FBbkI7RUFDQTJwQixZQUFZLENBQUN6bkIsV0FBYixDQUF5QixDQUF6QixFQUE0Qm1iLFlBQVksR0FBQyxDQUFiLEdBQWlCLEVBQTdDO0VBQ0FzTSxZQUFZLENBQUM1dUIsT0FBYixHQUF1QixHQUF2QjtFQUNBNHVCLFlBQVksQ0FBQzN1QixPQUFiLEdBQXVCLEdBQXZCO0VBQ0EsSUFBSTR1QixHQUFHLEdBQUdELFlBQVksQ0FBQ3ZuQixZQUFiLENBQTBCelAsRUFBRSxDQUFDSyxLQUE3QixDQUFWO0VBQ0E0MkIsR0FBRyxDQUFDbDBCLE1BQUosR0FBYTBKLFVBQVUsQ0FBQy9CLFNBQVgsSUFBd0IsS0FBckM7RUFDQXVzQixHQUFHLENBQUN2bkIsUUFBSixHQUFlLEVBQWY7RUFDQXVuQixHQUFHLENBQUNybkIsZUFBSixHQUFzQjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBL0M7RUFDQWtuQixZQUFZLENBQUNqbkIsS0FBYixHQUFxQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFyQjtFQUNBaW5CLFlBQVksQ0FBQy9uQixNQUFiLEdBQXNCcWIsTUFBdEIsQ0EvRW9DLENBaUZwQzs7RUFDQSxJQUFJNE0sUUFBUSxHQUFHLElBQUlsM0IsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFVBQVosQ0FBZjtFQUNBNnBCLFFBQVEsQ0FBQzNuQixXQUFULENBQXFCLENBQUNrYixXQUFELEdBQWEsQ0FBYixHQUFpQixFQUF0QyxFQUEwQ0MsWUFBWSxHQUFDLENBQWIsR0FBaUIsR0FBM0Q7RUFDQXdNLFFBQVEsQ0FBQzl1QixPQUFULEdBQW1CLENBQW5CO0VBQ0E4dUIsUUFBUSxDQUFDN3VCLE9BQVQsR0FBbUIsR0FBbkI7RUFDQSxJQUFJOHVCLEVBQUUsR0FBR0QsUUFBUSxDQUFDem5CLFlBQVQsQ0FBc0J6UCxFQUFFLENBQUNLLEtBQXpCLENBQVQ7RUFDQTgyQixFQUFFLENBQUNwMEIsTUFBSCxHQUFZLE1BQVo7RUFDQW8wQixFQUFFLENBQUN6bkIsUUFBSCxHQUFjLEVBQWQ7RUFDQXduQixRQUFRLENBQUNubkIsS0FBVCxHQUFpQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFqQjtFQUNBbW5CLFFBQVEsQ0FBQ2pvQixNQUFULEdBQWtCcWIsTUFBbEI7RUFFQSxJQUFJOE0sUUFBUSxHQUFHLElBQUlwM0IsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFVBQVosQ0FBZjtFQUNBK3BCLFFBQVEsQ0FBQzduQixXQUFULENBQXFCLEVBQXJCLEVBQXlCbWIsWUFBWSxHQUFDLENBQWIsR0FBaUIsR0FBMUM7RUFDQTBNLFFBQVEsQ0FBQ2h2QixPQUFULEdBQW1CLENBQW5CO0VBQ0FndkIsUUFBUSxDQUFDL3VCLE9BQVQsR0FBbUIsR0FBbkI7RUFDQSxJQUFJZ3ZCLEVBQUUsR0FBR0QsUUFBUSxDQUFDM25CLFlBQVQsQ0FBc0J6UCxFQUFFLENBQUNLLEtBQXpCLENBQVQ7RUFDQWczQixFQUFFLENBQUN0MEIsTUFBSCxHQUFZLEtBQUsrTixXQUFMLENBQWlCeUksU0FBakIsSUFBOEIsTUFBMUM7RUFDQThkLEVBQUUsQ0FBQzNuQixRQUFILEdBQWMsRUFBZDtFQUNBMG5CLFFBQVEsQ0FBQ3JuQixLQUFULEdBQWlCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLENBQW5CLENBQWpCO0VBQ0FxbkIsUUFBUSxDQUFDbm9CLE1BQVQsR0FBa0JxYixNQUFsQixDQXBHb0MsQ0FzR3BDOztFQUNBLElBQUlnTixZQUFZLEdBQUcsSUFBSXQzQixFQUFFLENBQUNxTixJQUFQLENBQVksY0FBWixDQUFuQjtFQUNBaXFCLFlBQVksQ0FBQy9uQixXQUFiLENBQXlCLENBQUNrYixXQUFELEdBQWEsQ0FBYixHQUFpQixFQUExQyxFQUE4Q0MsWUFBWSxHQUFDLENBQWIsR0FBaUIsR0FBL0Q7RUFDQTRNLFlBQVksQ0FBQ2x2QixPQUFiLEdBQXVCLENBQXZCO0VBQ0FrdkIsWUFBWSxDQUFDanZCLE9BQWIsR0FBdUIsR0FBdkI7RUFDQSxJQUFJa3ZCLEVBQUUsR0FBR0QsWUFBWSxDQUFDN25CLFlBQWIsQ0FBMEJ6UCxFQUFFLENBQUNLLEtBQTdCLENBQVQ7RUFDQWszQixFQUFFLENBQUN4MEIsTUFBSCxHQUFZLE9BQVo7RUFDQXcwQixFQUFFLENBQUM3bkIsUUFBSCxHQUFjLEVBQWQ7RUFDQTRuQixZQUFZLENBQUN2bkIsS0FBYixHQUFxQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFyQjtFQUNBdW5CLFlBQVksQ0FBQ3JvQixNQUFiLEdBQXNCcWIsTUFBdEI7RUFFQSxJQUFJa04sWUFBWSxHQUFHLElBQUl4M0IsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLGNBQVosQ0FBbkI7RUFDQW1xQixZQUFZLENBQUNqb0IsV0FBYixDQUF5QixFQUF6QixFQUE2Qm1iLFlBQVksR0FBQyxDQUFiLEdBQWlCLEdBQTlDO0VBQ0E4TSxZQUFZLENBQUNwdkIsT0FBYixHQUF1QixDQUF2QjtFQUNBb3ZCLFlBQVksQ0FBQ252QixPQUFiLEdBQXVCLEdBQXZCO0VBQ0EsSUFBSW92QixFQUFFLEdBQUdELFlBQVksQ0FBQy9uQixZQUFiLENBQTBCelAsRUFBRSxDQUFDSyxLQUE3QixDQUFUO0VBQ0FvM0IsRUFBRSxDQUFDMTBCLE1BQUgsR0FBWSxLQUFLK04sV0FBTCxDQUFpQnNJLGVBQWpCLElBQW9DLE1BQWhEO0VBQ0FxZSxFQUFFLENBQUMvbkIsUUFBSCxHQUFjLEVBQWQ7RUFDQThuQixZQUFZLENBQUN6bkIsS0FBYixHQUFxQnFKLGVBQWUsSUFBSUcsU0FBbkIsR0FBK0J2WixFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBL0IsR0FBeUQvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBOUU7RUFDQXluQixZQUFZLENBQUN2b0IsTUFBYixHQUFzQnFiLE1BQXRCLENBekhvQyxDQTJIcEM7O0VBQ0EsSUFBSW9OLFdBQVcsR0FBRyxJQUFJMTNCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxhQUFaLENBQWxCO0VBQ0FxcUIsV0FBVyxDQUFDbm9CLFdBQVosQ0FBd0IsQ0FBQ2tiLFdBQUQsR0FBYSxDQUFiLEdBQWlCLEVBQXpDLEVBQTZDQyxZQUFZLEdBQUMsQ0FBYixHQUFpQixHQUE5RDtFQUNBZ04sV0FBVyxDQUFDdHZCLE9BQVosR0FBc0IsQ0FBdEI7RUFDQXN2QixXQUFXLENBQUNydkIsT0FBWixHQUFzQixHQUF0QjtFQUNBLElBQUlzdkIsRUFBRSxHQUFHRCxXQUFXLENBQUNqb0IsWUFBWixDQUF5QnpQLEVBQUUsQ0FBQ0ssS0FBNUIsQ0FBVDtFQUNBczNCLEVBQUUsQ0FBQzUwQixNQUFILEdBQVksT0FBWjtFQUNBNDBCLEVBQUUsQ0FBQ2pvQixRQUFILEdBQWMsRUFBZDtFQUNBZ29CLFdBQVcsQ0FBQzNuQixLQUFaLEdBQW9CL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQXBCO0VBQ0EybkIsV0FBVyxDQUFDem9CLE1BQVosR0FBcUJxYixNQUFyQjtFQUVBLElBQUlzTixjQUFjLEdBQUduckIsVUFBVSxDQUFDb3JCLGVBQVgsSUFBOEJwckIsVUFBVSxDQUFDbXJCLGNBQXpDLElBQTJEO0lBQUVFLEtBQUssRUFBRTtFQUFULENBQWhGO0VBQ0EsSUFBSUMsV0FBVyxHQUFHLElBQUkvM0IsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLGFBQVosQ0FBbEI7RUFDQTBxQixXQUFXLENBQUN4b0IsV0FBWixDQUF3QixFQUF4QixFQUE0Qm1iLFlBQVksR0FBQyxDQUFiLEdBQWlCLEdBQTdDO0VBQ0FxTixXQUFXLENBQUMzdkIsT0FBWixHQUFzQixDQUF0QjtFQUNBMnZCLFdBQVcsQ0FBQzF2QixPQUFaLEdBQXNCLEdBQXRCO0VBQ0EsSUFBSTJ2QixFQUFFLEdBQUdELFdBQVcsQ0FBQ3RvQixZQUFaLENBQXlCelAsRUFBRSxDQUFDSyxLQUE1QixDQUFUO0VBQ0EyM0IsRUFBRSxDQUFDajFCLE1BQUgsR0FBWSxLQUFLK04sV0FBTCxDQUFpQjhtQixjQUFjLENBQUNFLEtBQWYsSUFBd0IsQ0FBekMsSUFBOEMsTUFBMUQ7RUFDQUUsRUFBRSxDQUFDdG9CLFFBQUgsR0FBYyxFQUFkO0VBQ0Fxb0IsV0FBVyxDQUFDaG9CLEtBQVosR0FBb0IvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsRUFBbkIsQ0FBcEI7RUFDQWdvQixXQUFXLENBQUM5b0IsTUFBWixHQUFxQnFiLE1BQXJCLENBL0lvQyxDQWlKcEM7O0VBQ0EsSUFBSXhPLElBQUksR0FBRyxDQUFDNE8sWUFBRCxHQUFjLENBQWQsR0FBa0IsRUFBN0IsQ0FsSm9DLENBb0pwQzs7RUFDQSxJQUFJdU4sUUFBUSxHQUFHN2UsZUFBZSxJQUFJRyxTQUFsQyxDQXJKb0MsQ0F1SnBDOztFQUNBLElBQUk4QyxTQUFTLEdBQUcsS0FBSzRQLG1CQUFMLENBQ1osSUFEWSxFQUVaanNCLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixDQUZZLEVBR1osQ0FBQyxFQUhXLEVBR1ArTCxJQUhPLEVBSVosR0FKWSxFQUlQLEVBSk8sRUFLWixZQUFXO0lBQ1B3TyxNQUFNLENBQUNqYyxPQUFQO0VBQ0gsQ0FQVyxDQUFoQjs7RUFTQWdPLFNBQVMsQ0FBQ3BOLE1BQVYsR0FBbUJxYixNQUFuQjs7RUFFQSxJQUFJMk4sUUFBSixFQUFjO0lBQ1Y7SUFDQSxJQUFJbGtCLFNBQVMsR0FBRyxLQUFLa1ksbUJBQUwsQ0FDWixNQURZLEVBRVpqc0IsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEVBQVQsRUFBYSxHQUFiLEVBQWtCLEVBQWxCLENBRlksRUFFWTtJQUN4QixFQUhZLEVBR1IrTCxJQUhRLEVBSVosR0FKWSxFQUlQLEVBSk8sRUFLWixZQUFXO01BQ1A7TUFDQWphLElBQUksQ0FBQ3EyQixTQUFMLENBQWV6ckIsVUFBZixFQUEyQjZkLE1BQTNCO0lBQ0gsQ0FSVyxDQUFoQjs7SUFVQXZXLFNBQVMsQ0FBQzlFLE1BQVYsR0FBbUJxYixNQUFuQjtFQUNILENBYkQsTUFhTztJQUNIO0lBQ0EsSUFBSTZOLEtBQUssR0FBRyxLQUFLbE0sbUJBQUwsQ0FDUixRQURRLEVBRVJqc0IsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLENBQW5CLENBRlEsRUFFZ0I7SUFDeEIsRUFIUSxFQUdKK0wsSUFISSxFQUlSLEdBSlEsRUFJSCxFQUpHLEVBS1IsWUFBVztNQUNQd08sTUFBTSxDQUFDamMsT0FBUDs7TUFDQXhNLElBQUksQ0FBQ3VQLG1CQUFMLENBQXlCLFlBQXpCLEVBQXVDbUksU0FBUyxHQUFHSCxlQUFuRDtJQUNILENBUk8sQ0FBWjs7SUFVQStlLEtBQUssQ0FBQ2xwQixNQUFOLEdBQWVxYixNQUFmLENBWkcsQ0FjSDs7SUFDQSxJQUFJakksT0FBTyxHQUFHLElBQUlyaUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLEtBQVosQ0FBZDtJQUNBZ1YsT0FBTyxDQUFDOVMsV0FBUixDQUFvQixDQUFwQixFQUF1QnVNLElBQUksR0FBRyxFQUE5QjtJQUNBdUcsT0FBTyxDQUFDamEsT0FBUixHQUFrQixHQUFsQjtJQUNBaWEsT0FBTyxDQUFDaGEsT0FBUixHQUFrQixHQUFsQjtJQUNBLElBQUlpYSxRQUFRLEdBQUdELE9BQU8sQ0FBQzVTLFlBQVIsQ0FBcUJ6UCxFQUFFLENBQUNLLEtBQXhCLENBQWY7SUFDQWlpQixRQUFRLENBQUN2ZixNQUFULEdBQWtCLGdCQUFsQjtJQUNBdWYsUUFBUSxDQUFDNVMsUUFBVCxHQUFvQixFQUFwQjtJQUNBNFMsUUFBUSxDQUFDMVMsZUFBVCxHQUEyQjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBcEQ7SUFDQXVTLE9BQU8sQ0FBQ3RTLEtBQVIsR0FBZ0IvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBaEI7SUFDQXNTLE9BQU8sQ0FBQ3BULE1BQVIsR0FBaUJxYixNQUFqQjtFQUNILENBek1tQyxDQTJNcEM7OztFQUNBLElBQUlTLFFBQVEsR0FBRyxJQUFJL3FCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxVQUFaLENBQWY7RUFDQTBkLFFBQVEsQ0FBQy9iLGNBQVQsQ0FBd0JoUCxFQUFFLENBQUM4UyxJQUFILENBQVEsRUFBUixFQUFZLEVBQVosQ0FBeEI7RUFDQWlZLFFBQVEsQ0FBQ3ZpQixDQUFULEdBQWFpaUIsV0FBVyxHQUFDLENBQVosR0FBZ0IsRUFBN0I7RUFDQU0sUUFBUSxDQUFDcmpCLENBQVQsR0FBYWdqQixZQUFZLEdBQUMsQ0FBYixHQUFpQixFQUE5QjtFQUNBLElBQUlNLEdBQUcsR0FBR0QsUUFBUSxDQUFDdGIsWUFBVCxDQUFzQnpQLEVBQUUsQ0FBQ2tULFFBQXpCLENBQVY7RUFDQThYLEdBQUcsQ0FBQzdYLFNBQUosR0FBZ0JuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxDQUFmLEVBQWtCLEVBQWxCLENBQWhCO0VBQ0FpYixHQUFHLENBQUM1RixNQUFKLENBQVcsQ0FBWCxFQUFjLENBQWQsRUFBaUIsRUFBakI7RUFDQTRGLEdBQUcsQ0FBQzNYLElBQUo7RUFDQTBYLFFBQVEsQ0FBQzliLE1BQVQsR0FBa0JxYixNQUFsQjtFQUVBLElBQUlXLE1BQU0sR0FBRyxJQUFJanJCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxHQUFaLENBQWI7RUFDQTRkLE1BQU0sQ0FBQzdpQixPQUFQLEdBQWlCLEdBQWpCO0VBQ0E2aUIsTUFBTSxDQUFDNWlCLE9BQVAsR0FBaUIsR0FBakI7RUFDQSxJQUFJNmlCLFVBQVUsR0FBR0QsTUFBTSxDQUFDeGIsWUFBUCxDQUFvQnpQLEVBQUUsQ0FBQ0ssS0FBdkIsQ0FBakI7RUFDQTZxQixVQUFVLENBQUNub0IsTUFBWCxHQUFvQixHQUFwQjtFQUNBbW9CLFVBQVUsQ0FBQ3hiLFFBQVgsR0FBc0IsRUFBdEI7RUFDQXdiLFVBQVUsQ0FBQ3RiLGVBQVgsR0FBNkI1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQXREO0VBQ0FtYixNQUFNLENBQUNsYixLQUFQLEdBQWUvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBZjtFQUNBa2IsTUFBTSxDQUFDaGMsTUFBUCxHQUFnQjhiLFFBQWhCO0VBRUFBLFFBQVEsQ0FBQ3BtQixFQUFULENBQVkzRSxFQUFFLENBQUNxTixJQUFILENBQVFDLFNBQVIsQ0FBa0JDLFNBQTlCLEVBQXlDLFlBQVc7SUFDaEQrYyxNQUFNLENBQUNqYyxPQUFQO0VBQ0gsQ0FGRDtBQUdILENBcm9NTCxZQXdvTUk2cEIsU0F4b01KLEdBd29NZSxtQkFBU3pyQixVQUFULEVBQXFCNmQsTUFBckIsRUFBNkI7RUFDcEMsSUFBSXpvQixJQUFJLEdBQUcsSUFBWDs7RUFFQSxJQUFJLENBQUNkLE1BQU0sQ0FBQytNLFNBQVosRUFBdUI7SUFDbkIsS0FBS2hKLFlBQUwsQ0FBa0IsV0FBbEI7O0lBQ0E7RUFDSDs7RUFFRCxLQUFLa1ksa0JBQUwsQ0FBd0IsU0FBeEI7O0VBRUFqYyxNQUFNLENBQUMrTSxTQUFQLENBQWlCZ0UsTUFBakIsQ0FBd0JyRixVQUFVLENBQUNoQyxFQUFuQyxFQUF1QyxVQUFTakYsR0FBVCxFQUFjMkUsTUFBZCxFQUFzQjtJQUN6RCxJQUFJM0UsR0FBSixFQUFTO01BQ0wzRCxJQUFJLENBQUNtYixrQkFBTCxDQUF3QixXQUFXeFgsR0FBbkM7O01BQ0E7SUFDSDs7SUFFRDNELElBQUksQ0FBQ21iLGtCQUFMLENBQXdCLE9BQXhCLEVBTnlELENBUXpEOzs7SUFDQSxJQUFJc04sTUFBSixFQUFZQSxNQUFNLENBQUNqYyxPQUFQLEdBVDZDLENBV3pEOztJQUNBLElBQUl0TixNQUFNLENBQUMrTSxTQUFQLENBQWlCaUUsY0FBckIsRUFBcUM7TUFDakNoUixNQUFNLENBQUMrTSxTQUFQLENBQWlCaUUsY0FBakI7SUFDSDs7SUFDRGxRLElBQUksQ0FBQ3lCLHNCQUFMLEdBZnlELENBaUJ6RDs7O0lBQ0F6QixJQUFJLENBQUNvRCxZQUFMLENBQWtCLFlBQVc7TUFDekJwRCxJQUFJLENBQUN1MkIsbUJBQUwsQ0FBeUIzckIsVUFBekI7SUFDSCxDQUZELEVBRUcsR0FGSDtFQUdILENBckJEO0FBc0JILENBeHFNTCxZQTZxTUkyckIsbUJBN3FNSixHQTZxTXlCLDZCQUFTM3JCLFVBQVQsRUFBcUI7RUFDdEMsSUFBSTVLLElBQUksR0FBRyxJQUFYLENBRHNDLENBR3RDOztFQUNBLElBQUl3b0IsU0FBUyxHQUFHLEtBQUtsbkIsSUFBTCxDQUFVK0MsY0FBVixDQUF5QixnQkFBekIsQ0FBaEI7RUFDQSxJQUFJbWtCLFNBQUosRUFBZUEsU0FBUyxDQUFDaGMsT0FBVixHQUx1QixDQU90Qzs7RUFDQSxJQUFJM0gsTUFBTSxHQUFHLEtBQUt2RCxJQUFMLENBQVVDLFlBQVYsQ0FBdUJwRCxFQUFFLENBQUMyRyxNQUExQixLQUFxQzNHLEVBQUUsQ0FBQzRHLElBQUgsQ0FBUSxRQUFSLEVBQWtCeEQsWUFBbEIsQ0FBK0JwRCxFQUFFLENBQUMyRyxNQUFsQyxDQUFsRDtFQUNBLElBQUlFLFlBQVksR0FBR0gsTUFBTSxHQUFHQSxNQUFNLENBQUNJLGdCQUFQLENBQXdCQyxNQUEzQixHQUFvQyxHQUE3RDtFQUNBLElBQUlDLFdBQVcsR0FBR04sTUFBTSxHQUFHQSxNQUFNLENBQUNJLGdCQUFQLENBQXdCRyxLQUEzQixHQUFtQyxJQUEzRCxDQVZzQyxDQVl0Qzs7RUFDQSxJQUFJcWpCLE1BQU0sR0FBRyxJQUFJdHFCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxnQkFBWixDQUFiO0VBQ0FpZCxNQUFNLENBQUN0YixjQUFQLENBQXNCaFAsRUFBRSxDQUFDOFMsSUFBSCxDQUFROUwsV0FBUixFQUFxQkgsWUFBckIsQ0FBdEI7RUFDQXlqQixNQUFNLENBQUMvYSxXQUFQLENBQW1CLENBQW5CLEVBQXNCLENBQXRCO0VBQ0ErYSxNQUFNLENBQUM3WixNQUFQLEdBQWdCLElBQWhCO0VBQ0E2WixNQUFNLENBQUNyYixNQUFQLEdBQWdCLEtBQUs5TCxJQUFyQixDQWpCc0MsQ0FtQnRDOztFQUNBLElBQUlvbkIsSUFBSSxHQUFHLElBQUl2cUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLE1BQVosQ0FBWDtFQUNBLElBQUltZCxLQUFLLEdBQUdELElBQUksQ0FBQzlhLFlBQUwsQ0FBa0J6UCxFQUFFLENBQUNrVCxRQUFyQixDQUFaO0VBQ0FzWCxLQUFLLENBQUNyWCxTQUFOLEdBQWtCblQsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQixHQUFsQixDQUFsQjtFQUNBeWEsS0FBSyxDQUFDdlAsSUFBTixDQUFXLENBQUNqVSxXQUFELEdBQWEsQ0FBeEIsRUFBMkIsQ0FBQ0gsWUFBRCxHQUFjLENBQXpDLEVBQTRDRyxXQUE1QyxFQUF5REgsWUFBekQ7RUFDQTJqQixLQUFLLENBQUNuWCxJQUFOO0VBQ0FrWCxJQUFJLENBQUN0YixNQUFMLEdBQWNxYixNQUFkO0VBRUFDLElBQUksQ0FBQzVsQixFQUFMLENBQVEzRSxFQUFFLENBQUNxTixJQUFILENBQVFDLFNBQVIsQ0FBa0JDLFNBQTFCLEVBQXFDLFVBQVNDLEtBQVQsRUFBZ0I7SUFDakRBLEtBQUssQ0FBQ0MsZUFBTjtFQUNILENBRkQsRUEzQnNDLENBK0J0Qzs7RUFDQSxJQUFJZ2QsV0FBVyxHQUFHLEdBQWxCO0VBQ0EsSUFBSUMsWUFBWSxHQUFHLEdBQW5CO0VBQ0EsSUFBSUMsUUFBUSxHQUFHLElBQUkzcUIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFVBQVosQ0FBZjtFQUNBc2QsUUFBUSxDQUFDM2IsY0FBVCxDQUF3QmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUTJYLFdBQVIsRUFBcUJDLFlBQXJCLENBQXhCO0VBRUEsSUFBSUUsR0FBRyxHQUFHRCxRQUFRLENBQUNsYixZQUFULENBQXNCelAsRUFBRSxDQUFDa1QsUUFBekIsQ0FBVjtFQUNBMFgsR0FBRyxDQUFDelgsU0FBSixHQUFnQm5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixFQUFxQixHQUFyQixDQUFoQjtFQUNBNmEsR0FBRyxDQUFDeFgsU0FBSixDQUFjLENBQUNxWCxXQUFELEdBQWEsQ0FBM0IsRUFBOEIsQ0FBQ0MsWUFBRCxHQUFjLENBQTVDLEVBQStDRCxXQUEvQyxFQUE0REMsWUFBNUQsRUFBMEUsRUFBMUU7RUFDQUUsR0FBRyxDQUFDdlgsSUFBSjtFQUNBdVgsR0FBRyxDQUFDelAsV0FBSixHQUFrQm5iLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsR0FBYixFQUFrQixFQUFsQixFQUFzQixHQUF0QixDQUFsQjtFQUNBNmEsR0FBRyxDQUFDeFAsU0FBSixHQUFnQixDQUFoQjtFQUNBd1AsR0FBRyxDQUFDeFgsU0FBSixDQUFjLENBQUNxWCxXQUFELEdBQWEsQ0FBM0IsRUFBOEIsQ0FBQ0MsWUFBRCxHQUFjLENBQTVDLEVBQStDRCxXQUEvQyxFQUE0REMsWUFBNUQsRUFBMEUsRUFBMUU7RUFDQUUsR0FBRyxDQUFDdlAsTUFBSjtFQUNBc1AsUUFBUSxDQUFDMWIsTUFBVCxHQUFrQnFiLE1BQWxCLENBN0NzQyxDQStDdEM7O0VBQ0EsSUFBSWpiLFNBQVMsR0FBRyxJQUFJclAsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLE9BQVosQ0FBaEI7RUFDQWdDLFNBQVMsQ0FBQ0UsV0FBVixDQUFzQixDQUF0QixFQUF5Qm1iLFlBQVksR0FBQyxDQUFiLEdBQWlCLEVBQTFDO0VBQ0FyYixTQUFTLENBQUNqSCxPQUFWLEdBQW9CLEdBQXBCO0VBQ0FpSCxTQUFTLENBQUNoSCxPQUFWLEdBQW9CLEdBQXBCO0VBQ0EsSUFBSXlpQixHQUFHLEdBQUd6YixTQUFTLENBQUNJLFlBQVYsQ0FBdUJ6UCxFQUFFLENBQUNLLEtBQTFCLENBQVY7RUFDQXlxQixHQUFHLENBQUMvbkIsTUFBSixHQUFhLEtBQWI7RUFDQStuQixHQUFHLENBQUNwYixRQUFKLEdBQWUsRUFBZjtFQUNBb2IsR0FBRyxDQUFDbGIsZUFBSixHQUFzQjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBL0M7RUFDQVQsU0FBUyxDQUFDVSxLQUFWLEdBQWtCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWxCO0VBQ0FWLFNBQVMsQ0FBQ0osTUFBVixHQUFtQnFiLE1BQW5CLENBekRzQyxDQTJEdEM7O0VBQ0EsSUFBSTBNLFlBQVksR0FBRyxJQUFJaDNCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxVQUFaLENBQW5CO0VBQ0EycEIsWUFBWSxDQUFDem5CLFdBQWIsQ0FBeUIsQ0FBekIsRUFBNEJtYixZQUFZLEdBQUMsQ0FBYixHQUFpQixFQUE3QztFQUNBc00sWUFBWSxDQUFDNXVCLE9BQWIsR0FBdUIsR0FBdkI7RUFDQTR1QixZQUFZLENBQUMzdUIsT0FBYixHQUF1QixHQUF2QjtFQUNBLElBQUk0dUIsR0FBRyxHQUFHRCxZQUFZLENBQUN2bkIsWUFBYixDQUEwQnpQLEVBQUUsQ0FBQ0ssS0FBN0IsQ0FBVjtFQUNBNDJCLEdBQUcsQ0FBQ2wwQixNQUFKLEdBQWEwSixVQUFVLENBQUMvQixTQUFYLElBQXdCLEtBQXJDO0VBQ0F1c0IsR0FBRyxDQUFDdm5CLFFBQUosR0FBZSxFQUFmO0VBQ0F1bkIsR0FBRyxDQUFDcm5CLGVBQUosR0FBc0I1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQS9DO0VBQ0FrbkIsWUFBWSxDQUFDam5CLEtBQWIsR0FBcUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBckI7RUFDQWluQixZQUFZLENBQUMvbkIsTUFBYixHQUFzQnFiLE1BQXRCLENBckVzQyxDQXVFdEM7O0VBQ0EsSUFBSStOLGNBQWMsR0FBRyxJQUFJcjRCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxnQkFBWixDQUFyQjtFQUNBZ3JCLGNBQWMsQ0FBQzlvQixXQUFmLENBQTJCLENBQTNCLEVBQThCbWIsWUFBWSxHQUFDLENBQWIsR0FBaUIsR0FBL0M7RUFDQTJOLGNBQWMsQ0FBQ2p3QixPQUFmLEdBQXlCLEdBQXpCO0VBQ0Fpd0IsY0FBYyxDQUFDaHdCLE9BQWYsR0FBeUIsR0FBekI7RUFDQSxJQUFJNG1CLEVBQUUsR0FBR29KLGNBQWMsQ0FBQzVvQixZQUFmLENBQTRCelAsRUFBRSxDQUFDSyxLQUEvQixDQUFUO0VBQ0E0dUIsRUFBRSxDQUFDbHNCLE1BQUgsR0FBWSxjQUFaO0VBQ0Frc0IsRUFBRSxDQUFDdmYsUUFBSCxHQUFjLEVBQWQ7RUFDQXVmLEVBQUUsQ0FBQ3JmLGVBQUgsR0FBcUI1UCxFQUFFLENBQUNLLEtBQUgsQ0FBU3dQLGVBQVQsQ0FBeUJDLE1BQTlDO0VBQ0F1b0IsY0FBYyxDQUFDdG9CLEtBQWYsR0FBdUIvUCxFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsR0FBbkIsQ0FBdkI7RUFDQXNvQixjQUFjLENBQUNwcEIsTUFBZixHQUF3QnFiLE1BQXhCLENBakZzQyxDQW1GdEM7O0VBQ0EsSUFBSWdPLGVBQWUsR0FBRyxTQUFsQkEsZUFBa0IsR0FBVztJQUM3QixJQUFJLENBQUNoTyxNQUFELElBQVcsQ0FBQ0EsTUFBTSxDQUFDN29CLE9BQXZCLEVBQWdDO0lBRWhDLElBQUlxVyxTQUFTLEdBQUcvVyxNQUFNLENBQUMrTSxTQUFQLEdBQW1CL00sTUFBTSxDQUFDK00sU0FBUCxDQUFpQnlxQixZQUFqQixDQUE4QjlyQixVQUFVLENBQUNoQyxFQUF6QyxDQUFuQixHQUFrRSxDQUFDLENBQW5GOztJQUNBLElBQUlxTixTQUFTLElBQUksQ0FBakIsRUFBb0I7TUFDaEJtWCxFQUFFLENBQUNsc0IsTUFBSCxHQUFZLFlBQVloQyxNQUFNLENBQUMrTSxTQUFQLENBQWlCMHFCLGVBQWpCLEdBQW1DejNCLE1BQU0sQ0FBQytNLFNBQVAsQ0FBaUIwcUIsZUFBakIsQ0FBaUMxZ0IsU0FBakMsQ0FBbkMsR0FBaUZBLFNBQVMsR0FBRyxHQUF6RyxDQUFaO0lBQ0gsQ0FGRCxNQUVPO01BQ0htWCxFQUFFLENBQUNsc0IsTUFBSCxHQUFZLFNBQVo7SUFDSDs7SUFFRCxJQUFJK1UsU0FBUyxLQUFLLENBQWxCLEVBQXFCO01BQ2pCO01BQ0FqVyxJQUFJLENBQUNtYixrQkFBTCxDQUF3QixTQUF4Qjs7TUFDQXNOLE1BQU0sQ0FBQ2pjLE9BQVAsR0FIaUIsQ0FJakI7SUFDSCxDQUxELE1BS087TUFDSHhNLElBQUksQ0FBQ29ELFlBQUwsQ0FBa0JxekIsZUFBbEIsRUFBbUMsQ0FBbkM7SUFDSDtFQUNKLENBbEJEOztFQW1CQUEsZUFBZSxHQXZHdUIsQ0F5R3RDOztFQUNBLElBQUl4YyxJQUFJLEdBQUcsQ0FBQzRPLFlBQUQsR0FBYyxDQUFkLEdBQWtCLEVBQTdCLENBMUdzQyxDQTRHdEM7O0VBQ0EsSUFBSStOLGVBQWUsR0FBRyxLQUFLeE0sbUJBQUwsQ0FDbEIsTUFEa0IsRUFFbEJqc0IsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEVBQW5CLENBRmtCLEVBRU87RUFDekIsQ0FBQyxFQUhpQixFQUdiK0wsSUFIYSxFQUlsQixHQUprQixFQUliLEVBSmEsRUFLbEIsWUFBVztJQUNQamEsSUFBSSxDQUFDNjJCLGFBQUwsQ0FBbUJqc0IsVUFBbkIsRUFBK0I2ZCxNQUEvQjtFQUNILENBUGlCLENBQXRCOztFQVNBbU8sZUFBZSxDQUFDeHBCLE1BQWhCLEdBQXlCcWIsTUFBekIsQ0F0SHNDLENBd0h0Qzs7RUFDQSxJQUFJUyxRQUFRLEdBQUcsS0FBS2tCLG1CQUFMLENBQ1gsSUFEVyxFQUVYanNCLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixDQUZXLEVBR1gsRUFIVyxFQUdQK0wsSUFITyxFQUlYLEdBSlcsRUFJTixFQUpNLEVBS1gsWUFBVztJQUNQd08sTUFBTSxDQUFDamMsT0FBUDtFQUNILENBUFUsQ0FBZjs7RUFTQTBjLFFBQVEsQ0FBQzliLE1BQVQsR0FBa0JxYixNQUFsQjtBQUNILENBaHpNTCxZQW16TUlvTyxhQW56TUosR0Ftek1tQix1QkFBU2pzQixVQUFULEVBQXFCNmQsTUFBckIsRUFBNkI7RUFDeEMsSUFBSXpvQixJQUFJLEdBQUcsSUFBWDs7RUFFQSxJQUFJLENBQUNkLE1BQU0sQ0FBQytNLFNBQVosRUFBdUI7SUFDbkIsS0FBS2hKLFlBQUwsQ0FBa0IsV0FBbEI7O0lBQ0E7RUFDSDs7RUFFRC9ELE1BQU0sQ0FBQytNLFNBQVAsQ0FBaUIwTCxZQUFqQixDQUE4Qi9NLFVBQVUsQ0FBQ2hDLEVBQXpDLEVBQTZDLFVBQVNqRixHQUFULEVBQWMyRSxNQUFkLEVBQXNCO0lBQy9ELElBQUkzRSxHQUFKLEVBQVM7TUFDTDNELElBQUksQ0FBQ21iLGtCQUFMLENBQXdCLGFBQWF4WCxHQUFyQzs7TUFDQTtJQUNIOztJQUVEM0QsSUFBSSxDQUFDbWIsa0JBQUwsQ0FBd0IsT0FBeEIsRUFOK0QsQ0FRL0Q7OztJQUNBLElBQUlzTixNQUFKLEVBQVlBLE1BQU0sQ0FBQ2pjLE9BQVAsR0FUbUQsQ0FXL0Q7O0lBQ0F4TSxJQUFJLENBQUN5QixzQkFBTDtFQUNILENBYkQ7QUFjSCxDQXowTUwsWUE4ME1JOE4sbUJBOTBNSixHQTgwTXlCLDZCQUFTNEMsSUFBVCxFQUFlMmtCLFlBQWYsRUFBNkI7RUFDOUMsSUFBSTkyQixJQUFJLEdBQUcsSUFBWCxDQUQ4QyxDQUc5Qzs7RUFDQSxJQUFJd29CLFNBQVMsR0FBRyxLQUFLbG5CLElBQUwsQ0FBVStDLGNBQVYsQ0FBeUIsZ0JBQXpCLENBQWhCO0VBQ0EsSUFBSW1rQixTQUFKLEVBQWVBLFNBQVMsQ0FBQ2hjLE9BQVYsR0FMK0IsQ0FPOUM7O0VBQ0EsSUFBSTNILE1BQU0sR0FBRyxLQUFLdkQsSUFBTCxDQUFVQyxZQUFWLENBQXVCcEQsRUFBRSxDQUFDMkcsTUFBMUIsS0FBcUMzRyxFQUFFLENBQUM0RyxJQUFILENBQVEsUUFBUixFQUFrQnhELFlBQWxCLENBQStCcEQsRUFBRSxDQUFDMkcsTUFBbEMsQ0FBbEQ7RUFDQSxJQUFJRSxZQUFZLEdBQUdILE1BQU0sR0FBR0EsTUFBTSxDQUFDSSxnQkFBUCxDQUF3QkMsTUFBM0IsR0FBb0MsR0FBN0Q7RUFDQSxJQUFJQyxXQUFXLEdBQUdOLE1BQU0sR0FBR0EsTUFBTSxDQUFDSSxnQkFBUCxDQUF3QkcsS0FBM0IsR0FBbUMsSUFBM0QsQ0FWOEMsQ0FZOUM7O0VBQ0EsSUFBSXFqQixNQUFNLEdBQUcsSUFBSXRxQixFQUFFLENBQUNxTixJQUFQLENBQVksZ0JBQVosQ0FBYjtFQUNBaWQsTUFBTSxDQUFDdGIsY0FBUCxDQUFzQmhQLEVBQUUsQ0FBQzhTLElBQUgsQ0FBUTlMLFdBQVIsRUFBcUJILFlBQXJCLENBQXRCO0VBQ0F5akIsTUFBTSxDQUFDL2EsV0FBUCxDQUFtQixDQUFuQixFQUFzQixDQUF0QjtFQUNBK2EsTUFBTSxDQUFDN1osTUFBUCxHQUFnQixJQUFoQjtFQUNBNlosTUFBTSxDQUFDcmIsTUFBUCxHQUFnQixLQUFLOUwsSUFBckIsQ0FqQjhDLENBbUI5Qzs7RUFDQSxJQUFJb25CLElBQUksR0FBRyxJQUFJdnFCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxNQUFaLENBQVg7RUFDQSxJQUFJbWQsS0FBSyxHQUFHRCxJQUFJLENBQUM5YSxZQUFMLENBQWtCelAsRUFBRSxDQUFDa1QsUUFBckIsQ0FBWjtFQUNBc1gsS0FBSyxDQUFDclgsU0FBTixHQUFrQm5ULEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsRUFBa0IsR0FBbEIsQ0FBbEI7RUFDQXlhLEtBQUssQ0FBQ3ZQLElBQU4sQ0FBVyxDQUFDalUsV0FBRCxHQUFhLENBQXhCLEVBQTJCLENBQUNILFlBQUQsR0FBYyxDQUF6QyxFQUE0Q0csV0FBNUMsRUFBeURILFlBQXpEO0VBQ0EyakIsS0FBSyxDQUFDblgsSUFBTjtFQUNBa1gsSUFBSSxDQUFDdGIsTUFBTCxHQUFjcWIsTUFBZDtFQUVBQyxJQUFJLENBQUM1bEIsRUFBTCxDQUFRM0UsRUFBRSxDQUFDcU4sSUFBSCxDQUFRQyxTQUFSLENBQWtCQyxTQUExQixFQUFxQyxVQUFTQyxLQUFULEVBQWdCO0lBQ2pEQSxLQUFLLENBQUNDLGVBQU47RUFDSCxDQUZELEVBM0I4QyxDQStCOUM7O0VBQ0EsSUFBSWdkLFdBQVcsR0FBRyxHQUFsQjtFQUNBLElBQUlDLFlBQVksR0FBRyxHQUFuQjtFQUNBLElBQUlDLFFBQVEsR0FBRyxJQUFJM3FCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxVQUFaLENBQWY7RUFDQXNkLFFBQVEsQ0FBQzNiLGNBQVQsQ0FBd0JoUCxFQUFFLENBQUM4UyxJQUFILENBQVEyWCxXQUFSLEVBQXFCQyxZQUFyQixDQUF4QjtFQUVBLElBQUlFLEdBQUcsR0FBR0QsUUFBUSxDQUFDbGIsWUFBVCxDQUFzQnpQLEVBQUUsQ0FBQ2tULFFBQXpCLENBQVY7RUFDQTBYLEdBQUcsQ0FBQ3pYLFNBQUosR0FBZ0JuVCxFQUFFLENBQUMrUCxLQUFILENBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakIsRUFBcUIsR0FBckIsQ0FBaEI7RUFDQTZhLEdBQUcsQ0FBQ3hYLFNBQUosQ0FBYyxDQUFDcVgsV0FBRCxHQUFhLENBQTNCLEVBQThCLENBQUNDLFlBQUQsR0FBYyxDQUE1QyxFQUErQ0QsV0FBL0MsRUFBNERDLFlBQTVELEVBQTBFLEVBQTFFO0VBQ0FFLEdBQUcsQ0FBQ3ZYLElBQUo7RUFDQXVYLEdBQUcsQ0FBQ3pQLFdBQUosR0FBa0JuYixFQUFFLENBQUMrUCxLQUFILENBQVMsR0FBVCxFQUFjLEdBQWQsRUFBbUIsQ0FBbkIsRUFBc0IsR0FBdEIsQ0FBbEI7RUFDQTZhLEdBQUcsQ0FBQ3hQLFNBQUosR0FBZ0IsQ0FBaEI7RUFDQXdQLEdBQUcsQ0FBQ3hYLFNBQUosQ0FBYyxDQUFDcVgsV0FBRCxHQUFhLENBQTNCLEVBQThCLENBQUNDLFlBQUQsR0FBYyxDQUE1QyxFQUErQ0QsV0FBL0MsRUFBNERDLFlBQTVELEVBQTBFLEVBQTFFO0VBQ0FFLEdBQUcsQ0FBQ3ZQLE1BQUo7RUFDQXNQLFFBQVEsQ0FBQzFiLE1BQVQsR0FBa0JxYixNQUFsQixDQTdDOEMsQ0ErQzlDOztFQUNBLElBQUlqYixTQUFTLEdBQUcsSUFBSXJQLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxPQUFaLENBQWhCO0VBQ0FnQyxTQUFTLENBQUNFLFdBQVYsQ0FBc0IsQ0FBdEIsRUFBeUJtYixZQUFZLEdBQUMsQ0FBYixHQUFpQixFQUExQztFQUNBcmIsU0FBUyxDQUFDakgsT0FBVixHQUFvQixHQUFwQjtFQUNBaUgsU0FBUyxDQUFDaEgsT0FBVixHQUFvQixHQUFwQjtFQUNBLElBQUl5aUIsR0FBRyxHQUFHemIsU0FBUyxDQUFDSSxZQUFWLENBQXVCelAsRUFBRSxDQUFDSyxLQUExQixDQUFWO0VBQ0F5cUIsR0FBRyxDQUFDL25CLE1BQUosR0FBYWlSLElBQUksS0FBSyxZQUFULEdBQXdCLE9BQXhCLEdBQWtDLE9BQS9DO0VBQ0E4VyxHQUFHLENBQUNwYixRQUFKLEdBQWUsRUFBZjtFQUNBb2IsR0FBRyxDQUFDbGIsZUFBSixHQUFzQjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBL0M7RUFDQVQsU0FBUyxDQUFDVSxLQUFWLEdBQWtCL1AsRUFBRSxDQUFDK1AsS0FBSCxDQUFTLEdBQVQsRUFBYyxHQUFkLEVBQW1CLEdBQW5CLENBQWxCO0VBQ0FWLFNBQVMsQ0FBQ0osTUFBVixHQUFtQnFiLE1BQW5CLENBekQ4QyxDQTJEOUM7O0VBQ0EsSUFBSXNPLFFBQVEsR0FBRyxJQUFJNTRCLEVBQUUsQ0FBQ3FOLElBQVAsQ0FBWSxNQUFaLENBQWY7RUFDQXVyQixRQUFRLENBQUNycEIsV0FBVCxDQUFxQixDQUFyQixFQUF3Qm1iLFlBQVksR0FBQyxDQUFiLEdBQWlCLEVBQXpDO0VBQ0FrTyxRQUFRLENBQUN4d0IsT0FBVCxHQUFtQixHQUFuQjtFQUNBd3dCLFFBQVEsQ0FBQ3Z3QixPQUFULEdBQW1CLEdBQW5CO0VBQ0EsSUFBSXd3QixFQUFFLEdBQUdELFFBQVEsQ0FBQ25wQixZQUFULENBQXNCelAsRUFBRSxDQUFDSyxLQUF6QixDQUFUO0VBQ0F3NEIsRUFBRSxDQUFDOTFCLE1BQUgsR0FBWSxhQUFhLEtBQUsrTixXQUFMLENBQWlCNm5CLFlBQWpCLENBQWIsSUFBK0Mza0IsSUFBSSxLQUFLLFlBQVQsR0FBd0IsS0FBeEIsR0FBZ0MsS0FBL0UsSUFBd0YsTUFBcEc7RUFDQTZrQixFQUFFLENBQUNucEIsUUFBSCxHQUFjLEVBQWQ7RUFDQW1wQixFQUFFLENBQUNqcEIsZUFBSCxHQUFxQjVQLEVBQUUsQ0FBQ0ssS0FBSCxDQUFTd1AsZUFBVCxDQUF5QkMsTUFBOUM7RUFDQThvQixRQUFRLENBQUM3b0IsS0FBVCxHQUFpQi9QLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixHQUFuQixDQUFqQjtFQUNBNm9CLFFBQVEsQ0FBQzNwQixNQUFULEdBQWtCcWIsTUFBbEIsQ0FyRThDLENBdUU5Qzs7RUFDQSxJQUFJd08sTUFBTSxHQUFHLElBQUk5NEIsRUFBRSxDQUFDcU4sSUFBUCxDQUFZLFFBQVosQ0FBYjtFQUNBeXJCLE1BQU0sQ0FBQ3ZwQixXQUFQLENBQW1CLENBQW5CLEVBQXNCLENBQXRCO0VBQ0F1cEIsTUFBTSxDQUFDMXdCLE9BQVAsR0FBaUIsR0FBakI7RUFDQTB3QixNQUFNLENBQUN6d0IsT0FBUCxHQUFpQixHQUFqQjtFQUNBLElBQUkwd0IsR0FBRyxHQUFHRCxNQUFNLENBQUNycEIsWUFBUCxDQUFvQnpQLEVBQUUsQ0FBQ0ssS0FBdkIsQ0FBVjtFQUNBMDRCLEdBQUcsQ0FBQ2gyQixNQUFKLEdBQWEsSUFBYjtFQUNBZzJCLEdBQUcsQ0FBQ3JwQixRQUFKLEdBQWUsRUFBZjtFQUNBb3BCLE1BQU0sQ0FBQzdwQixNQUFQLEdBQWdCcWIsTUFBaEIsQ0EvRThDLENBaUY5Qzs7RUFDQSxJQUFJeE8sSUFBSSxHQUFHLENBQUM0TyxZQUFELEdBQWMsQ0FBZCxHQUFrQixFQUE3QixDQWxGOEMsQ0FvRjlDOztFQUNBLElBQUlyTyxTQUFTLEdBQUcsS0FBSzRQLG1CQUFMLENBQ1osSUFEWSxFQUVaanNCLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxFQUFULEVBQWEsRUFBYixFQUFpQixFQUFqQixDQUZZLEVBR1osQ0FBQyxFQUhXLEVBR1ArTCxJQUhPLEVBSVosR0FKWSxFQUlQLEVBSk8sRUFLWixZQUFXO0lBQ1B3TyxNQUFNLENBQUNqYyxPQUFQO0VBQ0gsQ0FQVyxDQUFoQjs7RUFTQWdPLFNBQVMsQ0FBQ3BOLE1BQVYsR0FBbUJxYixNQUFuQixDQTlGOEMsQ0FnRzlDOztFQUNBLElBQUkwTyxRQUFRLEdBQUcsS0FBSy9NLG1CQUFMLENBQ1gsTUFEVyxFQUVYanNCLEVBQUUsQ0FBQytQLEtBQUgsQ0FBUyxHQUFULEVBQWMsR0FBZCxFQUFtQixDQUFuQixDQUZXLEVBRWE7RUFDeEIsRUFIVyxFQUdQK0wsSUFITyxFQUlYLEdBSlcsRUFJTixFQUpNLEVBS1gsWUFBVztJQUNQamEsSUFBSSxDQUFDbzNCLG9CQUFMLENBQTBCamxCLElBQTFCLEVBQWdDc1csTUFBaEM7RUFDSCxDQVBVLENBQWY7O0VBU0EwTyxRQUFRLENBQUMvcEIsTUFBVCxHQUFrQnFiLE1BQWxCO0FBQ0gsQ0F6N01MLFlBNDdNSTJPLG9CQTU3TUosR0E0N00wQiw4QkFBU2psQixJQUFULEVBQWVzVyxNQUFmLEVBQXVCO0VBQ3pDLElBQUl6b0IsSUFBSSxHQUFHLElBQVgsQ0FEeUMsQ0FHekM7RUFDQTs7RUFDQSxLQUFLbWIsa0JBQUwsQ0FBd0IsV0FBeEIsRUFMeUMsQ0FPekM7OztFQUNBLEtBQUsvWCxZQUFMLENBQWtCLFlBQVc7SUFDekIsSUFBSSxDQUFDbEUsTUFBTSxDQUFDK00sU0FBWixFQUF1QjtNQUNuQmpNLElBQUksQ0FBQ21iLGtCQUFMLENBQXdCLFFBQXhCOztNQUNBO0lBQ0g7O0lBRURqYyxNQUFNLENBQUMrTSxTQUFQLENBQWlCb3JCLGdCQUFqQixDQUFrQ2xsQixJQUFsQyxFQUF3QyxVQUFTeE8sR0FBVCxFQUFjMkUsTUFBZCxFQUFzQjtNQUMxRCxJQUFJM0UsR0FBSixFQUFTO1FBQ0wzRCxJQUFJLENBQUNtYixrQkFBTCxDQUF3QixhQUFheFgsR0FBckM7O1FBQ0E7TUFDSDs7TUFFRDNELElBQUksQ0FBQ21iLGtCQUFMLENBQXdCLE9BQXhCLEVBTjBELENBUTFEOzs7TUFDQSxJQUFJc04sTUFBSixFQUFZQSxNQUFNLENBQUNqYyxPQUFQLEdBVDhDLENBVzFEOztNQUNBeE0sSUFBSSxDQUFDeUIsc0JBQUw7SUFDSCxDQWJEO0VBY0gsQ0FwQkQsRUFvQkcsR0FwQkg7QUFxQkgsQ0F6OU1MLFlBNDlNSTYxQixTQTU5TUosR0E0OU1lLHFCQUFXO0VBRWxCO0VBQ0EsSUFBSSxLQUFLMWYsZUFBVCxFQUEwQjtJQUN0QkMsYUFBYSxDQUFDLEtBQUtELGVBQU4sQ0FBYjtJQUNBLEtBQUtBLGVBQUwsR0FBdUIsSUFBdkI7RUFDSCxDQU5pQixDQVFsQjs7O0VBQ0EsSUFBSTFZLE1BQU0sQ0FBQytNLFNBQVAsSUFBb0IvTSxNQUFNLENBQUMrTSxTQUFQLENBQWlCc3JCLGtCQUF6QyxFQUE2RDtJQUN6RHI0QixNQUFNLENBQUMrTSxTQUFQLENBQWlCc3JCLGtCQUFqQjtFQUNILENBWGlCLENBYWxCO0VBQ0E7RUFDQTtFQUNBOztBQUNILENBNytNTCxZQSsrTUl0akIsS0EvK01KLG9CQSsrTWEsQ0FBRSxDQS8rTWYiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXNDb250ZW50IjpbIi8vIOS9v+eUqOWFqOWxgOWPmOmHj++8jOS4jeS9v+eUqCByZXF1aXJlXG5cbi8vIOiEmuacrOWKoOi9veaXpeW/l1xuXG5jYy5DbGFzcyh7XG4gICAgZXh0ZW5kczogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBuaWNrbmFtZV9sYWJlbDogY2MuTGFiZWwsXG4gICAgICAgIGhlYWRpbWFnZTogY2MuU3ByaXRlLFxuICAgICAgICBnb2JhbF9jb3VudDogY2MuTGFiZWwsXG4gICAgICAgIC8vIOernuaKgOW4geaYvuekukxhYmVs77yI5Y+v6YCJ77yM5aaC5p6c5Zy65pmv5Lit5rKh5pyJ5YiZ5Yqo5oCB5Yib5bu677yJXG4gICAgICAgIGFyZW5hX2NvaW5fbGFiZWw6IGNjLkxhYmVsLFxuICAgICAgICBjcmVhdHJvb21fcHJlZmFiczogY2MuUHJlZmFiLFxuICAgICAgICBqb2lucm9vbV9wcmVmYWJzOiBjYy5QcmVmYWIsXG4gICAgICAgIHVzZXJfYWdyZWVtZW50X3ByZWZhYnM6IGNjLlByZWZhYixcbiAgICB9LFxuXG4gICAgb25Mb2FkICgpIHtcbiAgICAgICAgXG4gICAgICAgIGlmICghd2luZG93Lm15Z2xvYmFsKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJteWdsb2JhbCDmnKrlrprkuYnvvIznrYnlvoXliJ3lp4vljJYuLi5cIik7XG4gICAgICAgICAgICB0aGlzLl93YWl0Rm9yTXlnbG9iYWwoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5faW5pdFdpdGhQbGF5ZXJEYXRhKCk7XG4gICAgfSxcbiAgICBcbiAgICAvLyDliqDovb3lm77niYfml4vovazliqjnlLtcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKGR0KSB7XG4gICAgICAgIC8vIF9zaG93TWVzc2FnZUNlbnRlciDnmoTliqDovb3lm77niYfml4vovaxcbiAgICAgICAgaWYgKHRoaXMuX2xvYWRpbmdJbWFnZUFuaW1hdGluZyAmJiB0aGlzLl9sb2FkaW5nSW1hZ2VOb2RlICYmIHRoaXMuX2xvYWRpbmdJbWFnZU5vZGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgdGhpcy5fbG9hZGluZ0ltYWdlTm9kZS5hbmdsZSArPSBkdCAqIDE4MDtcbiAgICAgICAgfVxuICAgICAgICAvLyBfc2hvd1F1aWNrRW50ZXJBbmltYXRpb24g55qE5Yqg6L295Zu+54mH5peL6L2sXG4gICAgICAgIGlmICh0aGlzLl9xdWlja0VudGVyQW5pbWF0aW5nICYmIHRoaXMuX3F1aWNrRW50ZXJMb2FkaW5nTm9kZSAmJiB0aGlzLl9xdWlja0VudGVyTG9hZGluZ05vZGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgdGhpcy5fcXVpY2tFbnRlckxvYWRpbmdOb2RlLmFuZ2xlICs9IGR0ICogMTgwO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBfd2FpdEZvck15Z2xvYmFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgYXR0ZW1wdHMgPSAwO1xuICAgICAgICB2YXIgbWF4QXR0ZW1wdHMgPSAyMDtcbiAgICAgICAgXG4gICAgICAgIHZhciBjaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYXR0ZW1wdHMrKztcbiAgICAgICAgICAgIGlmICh3aW5kb3cubXlnbG9iYWwgJiYgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9pbml0V2l0aFBsYXllckRhdGEoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYXR0ZW1wdHMgPCBtYXhBdHRlbXB0cykge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY2hlY2ssIDEwMCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJteWdsb2JhbCDliJ3lp4vljJbotoXml7ZcIik7XG4gICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwibG9naW5TY2VuZVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIHNldFRpbWVvdXQoY2hlY2ssIDEwMCk7XG4gICAgfSxcbiAgICBcbiAgICBfaW5pdFdpdGhQbGF5ZXJEYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFteWdsb2JhbCB8fCAhbXlnbG9iYWwucGxheWVyRGF0YSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIm15Z2xvYmFsIOaIliBwbGF5ZXJEYXRhIOacquWumuS5iVwiKTtcbiAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZShcImxvZ2luU2NlbmVcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBwbGF5ZXJEYXRhID0gbXlnbG9iYWwucGxheWVyRGF0YTtcbiAgICAgICAgXG4gICAgICAgIGlmICghcGxheWVyRGF0YS50b2tlbikge1xuICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwibG9naW5TY2VuZVwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgLy8g5qOA5p+lIHZlcmlmeVRva2VuIOaYr+WQpuWtmOWcqFxuICAgICAgICBpZiAodHlwZW9mIG15Z2xvYmFsLnZlcmlmeVRva2VuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJ2ZXJpZnlUb2tlbiDmlrnms5XkuI3lrZjlnKjvvIzot7Pov4fpqozor4FcIik7XG4gICAgICAgICAgICBzZWxmLl9pbml0VUlBZnRlckF1dGgoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG15Z2xvYmFsLnZlcmlmeVRva2VuKGZ1bmN0aW9uKHZhbGlkLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF2YWxpZCkge1xuICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJsb2dpblNjZW5lXCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbGYuX2luaXRVSUFmdGVyQXV0aCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJ2ZXJpZnlUb2tlbiDosIPnlKjlpLHotKU6XCIsIGUpO1xuICAgICAgICAgICAgc2VsZi5faW5pdFVJQWZ0ZXJBdXRoKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIF9pbml0VUlBZnRlckF1dGg6IGZ1bmN0aW9uKCkge1xuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbDtcbiAgICAgICAgICAgIHZhciBwbGF5ZXJEYXRhID0gbXlnbG9iYWwgPyBteWdsb2JhbC5wbGF5ZXJEYXRhIDogbnVsbDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCFwbGF5ZXJEYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwicGxheWVyRGF0YSDkuLrnqbrvvIzkvb/nlKjpu5jorqTlgLxcIik7XG4gICAgICAgICAgICAgICAgcGxheWVyRGF0YSA9IHsgbmlja05hbWU6IFwi5ri45a6iXCIsIGdvYmFsX2NvdW50OiAwLCBhdmF0YXJVcmw6IG51bGwgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6K6+572u5pi156ewXG4gICAgICAgICAgICAvLyDkvJjlhYjkvb/nlKjlsZ7mgKflhbPogZTnmoQgTGFiZWzvvIzlpoLmnpzmsqHmnInliJnpgJrov4foioLngrnlkI3mn6Xmib5cbiAgICAgICAgICAgIHZhciBuaWNrbmFtZUxhYmVsID0gdGhpcy5uaWNrbmFtZV9sYWJlbDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5aaC5p6c5bGe5oCn5YWz6IGU55qEIExhYmVsIOaXoOaViO+8jOWwneivlemAmui/h+iKgueCueWQjeafpeaJvlxuICAgICAgICAgICAgaWYgKCFuaWNrbmFtZUxhYmVsIHx8IG5pY2tuYW1lTGFiZWwuc3RyaW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAvLyDpgJLlvZLmn6Xmib4gbmlja25hbWVfbGFiZWwg6IqC54K5XG4gICAgICAgICAgICAgICAgdmFyIG5pY2tuYW1lTm9kZSA9IHRoaXMuX2ZpbmROb2RlQnlOYW1lKHRoaXMubm9kZSwgXCJuaWNrbmFtZV9sYWJlbFwiKTtcbiAgICAgICAgICAgICAgICBpZiAobmlja25hbWVOb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5pY2tuYW1lTGFiZWwgPSBuaWNrbmFtZU5vZGUuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmlja25hbWVMYWJlbCkge1xuICAgICAgICAgICAgICAgIG5pY2tuYW1lTGFiZWwuc3RyaW5nID0gcGxheWVyRGF0YS5uaWNrTmFtZSB8fCBcIua4uOWuolwiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLjgJDlpKfljoXjgJFuaWNrbmFtZV9sYWJlbCDmnKrmib7liLDvvIzor7fmo4Dmn6XlnLrmma/mlofku7ZcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOiuvue9rumHkeW4gS/mrKLkuZDosYbmmL7npLpcbiAgICAgICAgICAgIC8vIOm7mOiupOaYvuekuuasouS5kOixhu+8jOagueaNruW9k+WJjemAieS4reeahOaIv+mXtOexu+Wei+WIh+aNouaYvuekulxuICAgICAgICAgICAgdGhpcy5fY3VycmVudFJvb21DYXRlZ29yeSA9IDE7ICAvLyDpu5jorqTmma7pgJrlnLpcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZUN1cnJlbmN5RGlzcGxheSgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLl9hZGp1c3RHb2xkRWxlbWVudHNQb3NpdGlvbigpO1xuICAgICAgICAgICAgdGhpcy5fbG9hZFVzZXJBdmF0YXIocGxheWVyRGF0YS5hdmF0YXJVcmwpO1xuICAgICAgICAgICAgdGhpcy5yb29tQ29uZmlncyA9IFtdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDliJ3lp4vljJbnq57mioDluIHmmL7npLpcbiAgICAgICAgICAgIHRoaXMuX2luaXRBcmVuYUNvaW5EaXNwbGF5KCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOiOt+WPluacgOaWsOeahOeOqeWutuS9memine+8iOmHkeW4geWSjOernuaKgOW4ge+8iVxuICAgICAgICAgICAgdGhpcy5fcmVmcmVzaFBsYXllckJhbGFuY2UoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5fcGxheUhhbGxCYWNrZ3JvdW5kTXVzaWMoKTtcbiAgICAgICAgICAgIHRoaXMuX2FkanVzdEJvdHRvbUJ1dHRvbnMoKTtcbiAgICAgICAgICAgIHRoaXMuX2hpZGVCYWNrZ3JvdW5kQ2hhcmFjdGVycygpO1xuICAgICAgICAgICAgdGhpcy5faW5pdFdlYlNvY2tldCgpOyAgLy8g5Yid5aeL5YyWIFdlYlNvY2tldCDov57mjqVcbiAgICAgICAgICAgIHRoaXMuX3N0YXJ0T25saW5lTW9uaXRvcmluZygpOyAgLy8g5ZCv5Yqo5Zyo57q/54q25oCB55uR5rWLXG4gICAgICAgICAgICB0aGlzLl9mZXRjaFJvb21Db25maWdzKCk7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVOb3RpY2VCb2FyZCgpO1xuICAgICAgICAgICAgLy8g5rOo6YeK5o6J77ya5aSn5Y6F5LiN6ZyA6KaB5Yqg5YWl5oi/6Ze05oyJ6ZKu77yM6K+l5Yqf6IO95Zyo5oi/6Ze05YiX6KGo5Zy65pmv5Lit5L2/55SoXG4gICAgICAgICAgICAvLyB0aGlzLl9jcmVhdGVFbnRlclJvb21CdXR0b24oKTsgIC8vIOWIm+W7uuWKoOWFpeaIv+mXtOaMiemSrlxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5qA44CQ5oCn6IO95LyY5YyW44CR6aKE5Yqg6L295ri45oiP5Zy65pmvXG4gICAgICAgICAgICB0aGlzLl9wcmVsb2FkR2FtZVNjZW5lKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIl9pbml0VUlBZnRlckF1dGgg5byC5bi4OlwiLCBlKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLy8g5ZCv5Yqo5Zyo57q/54q25oCB55uR5rWLXG4gICAgX3N0YXJ0T25saW5lTW9uaXRvcmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbDtcbiAgICAgICAgaWYgKCFteWdsb2JhbCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwibXlnbG9iYWwg5pyq5a6a5LmJ77yM5peg5rOV5ZCv5Yqo5Zyo57q/55uR5rWLXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgLy8g5ZCv5Yqo5YWo5bGA5Zyo57q/55uR5rWLXG4gICAgICAgIGlmIChteWdsb2JhbC5zdGFydE9ubGluZU1vbml0b3JpbmcpIHtcbiAgICAgICAgICAgIG15Z2xvYmFsLnN0YXJ0T25saW5lTW9uaXRvcmluZygpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDnm5HlkKzlnKjnur/nirbmgIHlj5jljJZcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLl9vbmxpbmVTdGF0dXNIYW5kbGVyID0gZnVuY3Rpb24oaXNPbmxpbmUpIHtcbiAgICAgICAgICAgIC8vIOWPquacieWcqOmdnuWIneWni+WMlueKtuaAgeS4i+aJjeaYvuekuuemu+e6v+aPkOekulxuICAgICAgICAgICAgaWYgKCFpc09ubGluZSAmJiAhbXlnbG9iYWwuX2lzSW5pdGlhbGl6aW5nKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc2hvd09mZmxpbmVNZXNzYWdlKCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCFpc09ubGluZSAmJiBteWdsb2JhbC5faXNJbml0aWFsaXppbmcpIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIGlmIChteWdsb2JhbC5hZGRPbmxpbmVTdGF0dXNMaXN0ZW5lcikge1xuICAgICAgICAgICAgbXlnbG9iYWwuYWRkT25saW5lU3RhdHVzTGlzdGVuZXIodGhpcy5fb25saW5lU3RhdHVzSGFuZGxlcik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOebkeWQrOW8uuWItuS4i+e6v+S6i+S7tlxuICAgICAgICBpZiAobXlnbG9iYWwuZXZlbnRsaXN0ZXIpIHtcbiAgICAgICAgICAgIG15Z2xvYmFsLmV2ZW50bGlzdGVyLm9uKFwiZm9yY2VfbG9nb3V0XCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn5qrIOaUtuWIsOW8uuWItuS4i+e6v+S6i+S7tjpcIiwgZGF0YSk7XG4gICAgICAgICAgICAgICAgc2VsZi5faGFuZGxlRm9yY2VMb2dvdXQoZGF0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLy8g5pi+56S656a757q/5o+Q56S6XG4gICAgX3Nob3dPZmZsaW5lTWVzc2FnZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3Nob3dNZXNzYWdlKFwi572R57uc6L+e5o6l5bey5pat5byA77yM5q2j5Zyo6YeN5paw6L+e5o6lLi4uXCIpO1xuICAgIH0sXG4gICAgXG4gICAgLy8g5aSE55CG5by65Yi25LiL57q/XG4gICAgX2hhbmRsZUZvcmNlTG9nb3V0OiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciByZWFzb24gPSBkYXRhLnJlYXNvbiB8fCBcIuaCqOW3suiiq+W8uuWItuS4i+e6v1wiO1xuICAgICAgICB0aGlzLl9zaG93TWVzc2FnZShyZWFzb24pO1xuICAgICAgICBcbiAgICAgICAgLy8g5YGc5q2i55uR5rWLXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbDtcbiAgICAgICAgaWYgKG15Z2xvYmFsICYmIG15Z2xvYmFsLnN0b3BPbmxpbmVNb25pdG9yaW5nKSB7XG4gICAgICAgICAgICBteWdsb2JhbC5zdG9wT25saW5lTW9uaXRvcmluZygpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlu7bov5/ot7PovazliLDnmbvlvZXpobXpnaJcbiAgICAgICAgdGhpcy5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJsb2dpblNjZW5lXCIpO1xuICAgICAgICB9LCAyKTtcbiAgICB9LFxuICAgIFxuICAgIC8vIOWBnOatouWcqOe6v+eKtuaAgeebkea1i1xuICAgIF9zdG9wT25saW5lTW9uaXRvcmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbDtcbiAgICAgICAgXG4gICAgICAgIGlmIChteWdsb2JhbCAmJiBteWdsb2JhbC5zdG9wT25saW5lTW9uaXRvcmluZykge1xuICAgICAgICAgICAgbXlnbG9iYWwuc3RvcE9ubGluZU1vbml0b3JpbmcoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKG15Z2xvYmFsICYmIG15Z2xvYmFsLnJlbW92ZU9ubGluZVN0YXR1c0xpc3RlbmVyICYmIHRoaXMuX29ubGluZVN0YXR1c0hhbmRsZXIpIHtcbiAgICAgICAgICAgIG15Z2xvYmFsLnJlbW92ZU9ubGluZVN0YXR1c0xpc3RlbmVyKHRoaXMuX29ubGluZVN0YXR1c0hhbmRsZXIpO1xuICAgICAgICAgICAgdGhpcy5fb25saW5lU3RhdHVzSGFuZGxlciA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vIPCfmoDjgJDmgKfog73kvJjljJbjgJHpooTliqDovb3muLjmiI/lnLrmma9cbiAgICBfcHJlbG9hZEdhbWVTY2VuZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5LyY5YyW44CR6aKE5Yqg6L295Zy65pmv6LWE5rqQXG4gICAgICAgIGNjLmRpcmVjdG9yLnByZWxvYWRTY2VuZShcImdhbWVTY2VuZVwiLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+agCBb6aKE5Yqg6L29XSDmuLjmiI/lnLrmma/pooTliqDovb3lpLHotKU6XCIsIGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGVsYXBzZWQgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeagh+iusOWcuuaZr+W3sumihOWKoOi9vVxuICAgICAgICAgICAgc2VsZi5fZ2FtZVNjZW5lUHJlbG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBcbiAgICAvLyDliJ3lp4vljJYgV2ViU29ja2V0IOi/nuaOpVxuICAgIF9pbml0V2ViU29ja2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICBpZiAoIW15Z2xvYmFsIHx8ICFteWdsb2JhbC5zb2NrZXQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcInNvY2tldCDmnKrliJ3lp4vljJZcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOajgOafpeaYr+WQpuW3sui/nuaOpVxuICAgICAgICBpZiAobXlnbG9iYWwuc29ja2V0LmlzV2ViU29ja2V0T3BlbiAmJiBteWdsb2JhbC5zb2NrZXQuaXNXZWJTb2NrZXRPcGVuKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5qOA5p+l6YC76L6R6L+e5o6l54q25oCBXG4gICAgICAgIGlmIChteWdsb2JhbC5zb2NrZXQuaXNDb25uZWN0ZWQgJiYgbXlnbG9iYWwuc29ja2V0LmlzQ29ubmVjdGVkKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8vIOWIneWni+WMliBXZWJTb2NrZXRcbiAgICAgICAgaWYgKG15Z2xvYmFsLnNvY2tldC5pbml0U29ja2V0KSB7XG4gICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQuaW5pdFNvY2tldCgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyDpgJLlvZLmn6Xmib7oioLngrlcbiAgICBfZmluZE5vZGVCeU5hbWU6IGZ1bmN0aW9uKHBhcmVudE5vZGUsIG5vZGVOYW1lKSB7XG4gICAgICAgIC8vIOWFiOajgOafpeebtOaOpeWtkOiKgueCuVxuICAgICAgICB2YXIgZm91bmQgPSBwYXJlbnROb2RlLmdldENoaWxkQnlOYW1lKG5vZGVOYW1lKTtcbiAgICAgICAgaWYgKGZvdW5kKSByZXR1cm4gZm91bmQ7XG4gICAgICAgIFxuICAgICAgICAvLyDpgJLlvZLmn6Xmib5cbiAgICAgICAgdmFyIGNoaWxkcmVuID0gcGFyZW50Tm9kZS5jaGlsZHJlbjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgICBmb3VuZCA9IHRoaXMuX2ZpbmROb2RlQnlOYW1lKGNoaWxkLCBub2RlTmFtZSk7XG4gICAgICAgICAgICBpZiAoZm91bmQpIHJldHVybiBmb3VuZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuICAgIFxuICAgIF9oaWRlQmFja2dyb3VuZENoYXJhY3RlcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgeGlvbmdtYW8xID0gdGhpcy5ub2RlLmdldENoaWxkQnlOYW1lKFwieGlvbmdtYW8xXCIpO1xuICAgICAgICB2YXIgeGlvbmdtYW8yID0gdGhpcy5ub2RlLmdldENoaWxkQnlOYW1lKFwieGlvbmdtYW8yXCIpO1xuICAgICAgICBpZiAoeGlvbmdtYW8xKSB4aW9uZ21hbzEuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIGlmICh4aW9uZ21hbzIpIHhpb25nbWFvMi5hY3RpdmUgPSBmYWxzZTtcbiAgICB9LFxuICAgIFxuICAgIC8vIOiwg+aVtOW6lemDqOaMiemSriAtIOiwg+Wwj+W5tumdoOWPs+aOkuWIl1xuICAgIF9hZGp1c3RCb3R0b21CdXR0b25zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgY2FudmFzID0gdGhpcy5ub2RlLmdldENvbXBvbmVudChjYy5DYW52YXMpIHx8IGNjLmZpbmQoJ0NhbnZhcycpLmdldENvbXBvbmVudChjYy5DYW52YXMpO1xuICAgICAgICB2YXIgc2NyZWVuSGVpZ2h0ID0gY2FudmFzID8gY2FudmFzLmRlc2lnblJlc29sdXRpb24uaGVpZ2h0IDogNzIwO1xuICAgICAgICB2YXIgc2NyZWVuV2lkdGggPSBjYW52YXMgPyBjYW52YXMuZGVzaWduUmVzb2x1dGlvbi53aWR0aCA6IDEyODA7XG4gICAgICAgIFxuICAgICAgICAvLyDlupXpg6jmjInpkq7lkI3np7DliJfooahcbiAgICAgICAgdmFyIGJ1dHRvbk5hbWVzID0gW1xuICAgICAgICAgICAgXCJidG5fY3JlYXRlX3Jvb21cIixcbiAgICAgICAgICAgIFwiYnRuX2pvaW5fcm9vbVwiLCBcbiAgICAgICAgICAgIFwiYnRuX3VzZXJfYWdyZWVtZW50XCIsXG4gICAgICAgICAgICBcInVzZXJfYWdyZWVtZW50XCIsXG4gICAgICAgICAgICBcImJ0bl9zZXR0aW5nXCIsXG4gICAgICAgICAgICBcImJ0bl9oZWxwXCJcbiAgICAgICAgXTtcbiAgICAgICAgXG4gICAgICAgIC8vIOaUtumbhuWtmOWcqOeahOaMiemSrlxuICAgICAgICB2YXIgYnV0dG9ucyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1dHRvbk5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYnRuID0gdGhpcy5ub2RlLmdldENoaWxkQnlOYW1lKGJ1dHRvbk5hbWVzW2ldKTtcbiAgICAgICAgICAgIGlmIChidG4gJiYgYnRuLmFjdGl2ZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBidXR0b25zLnB1c2goYnRuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5rKh5om+5Yiw77yM5bCd6K+V5p+l5om+5YW25LuW5Y+v6IO955qE5oyJ6ZKuXG4gICAgICAgIGlmIChidXR0b25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdmFyIGFsbENoaWxkcmVuID0gdGhpcy5ub2RlLmNoaWxkcmVuO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbGxDaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGFsbENoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIGlmIChjaGlsZC5uYW1lICYmIGNoaWxkLm5hbWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdidG4nKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpuWcqOW6lemDqOWMuuWfn1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQueSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbnMucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyDosIPmlbTmr4/kuKrmjInpkq5cbiAgICAgICAgdmFyIGJ0bldpZHRoID0gMTIwOyAgIC8vIOaMiemSruWuveW6plxuICAgICAgICB2YXIgYnRuSGVpZ2h0ID0gNTA7ICAgLy8g5oyJ6ZKu6auY5bqmXG4gICAgICAgIHZhciBidG5HYXAgPSAxNTsgICAgICAvLyDmjInpkq7pl7Tot51cbiAgICAgICAgdmFyIHJpZ2h0TWFyZ2luID0gMzA7IC8vIOWPs+i+uei3nVxuICAgICAgICB2YXIgYm90dG9tTWFyZ2luID0gMzA7IC8vIOW6lei+uei3nVxuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBidXR0b25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgYnRuID0gYnV0dG9uc1tpXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g56aB55SoIFdpZGdldCDnu4Tku7ZcbiAgICAgICAgICAgIHZhciB3aWRnZXQgPSBidG4uZ2V0Q29tcG9uZW50KGNjLldpZGdldCk7XG4gICAgICAgICAgICBpZiAod2lkZ2V0KSB3aWRnZXQuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDnvKnlsI/mjInpkq5cbiAgICAgICAgICAgIGJ0bi5zY2FsZSA9IDAuNztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6K6+572u6ZSa54K5XG4gICAgICAgICAgICBidG4uYW5jaG9yWCA9IDE7ICAvLyDlj7PplJrngrlcbiAgICAgICAgICAgIGJ0bi5hbmNob3JZID0gMDsgIC8vIOW6lemUmueCuVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDorqHnrpfkvY3nva4gLSDku47lj7PlvoDlt6bmjpLliJdcbiAgICAgICAgICAgIHZhciB4UG9zID0gc2NyZWVuV2lkdGggLyAyIC0gcmlnaHRNYXJnaW4gLSBpICogKGJ0bldpZHRoICogMC43ICsgYnRuR2FwKTtcbiAgICAgICAgICAgIHZhciB5UG9zID0gLXNjcmVlbkhlaWdodCAvIDIgKyBib3R0b21NYXJnaW47XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGJ0bi54ID0geFBvcztcbiAgICAgICAgICAgIGJ0bi55ID0geVBvcztcbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBfbG9hZFVzZXJBdmF0YXI6IGZ1bmN0aW9uKGF2YXRhclVybCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICghdGhpcy5oZWFkaW1hZ2UpIHJldHVybjtcblxuICAgICAgICBpZiAoIWF2YXRhclVybCkge1xuICAgICAgICAgICAgdGhpcy5fbG9hZERlZmF1bHRBdmF0YXIoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhdmF0YXJVcmwuaW5kZXhPZignaHR0cDovLycpID09PSAwIHx8IGF2YXRhclVybC5pbmRleE9mKCdodHRwczovLycpID09PSAwKSB7XG4gICAgICAgICAgICBjYy5hc3NldE1hbmFnZXIubG9hZFJlbW90ZShhdmF0YXJVcmwsIHsgZXh0OiAnLnBuZycgfSwgZnVuY3Rpb24oZXJyLCB0ZXh0dXJlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVyciB8fCAhdGV4dHVyZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2FkRGVmYXVsdEF2YXRhcigpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzcHJpdGVGcmFtZSA9IG5ldyBjYy5TcHJpdGVGcmFtZSh0ZXh0dXJlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNwcml0ZUZyYW1lKSBzZWxmLmhlYWRpbWFnZS5zcHJpdGVGcmFtZSA9IHNwcml0ZUZyYW1lO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fbG9hZERlZmF1bHRBdmF0YXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNjLnJlc291cmNlcy5sb2FkKCdVSS9oZWFkaW1hZ2UvJyArIGF2YXRhclVybCwgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVyciwgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyIHx8ICFzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2FkRGVmYXVsdEF2YXRhcigpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaGVhZGltYWdlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWU7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2FkRGVmYXVsdEF2YXRhcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9sb2FkRGVmYXVsdEF2YXRhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoJ1VJL2hlYWRpbWFnZS9hdmF0YXJfMScsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoIWVyciAmJiBzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaGVhZGltYWdlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWU7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9wbGF5SGFsbEJhY2tncm91bmRNdXNpYzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpc29wZW5fc291bmQgPSB3aW5kb3cuaXNvcGVuX3NvdW5kIHx8IDE7XG4gICAgICAgIGlmICghaXNvcGVuX3NvdW5kKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY2MuYXVkaW9FbmdpbmUuc3RvcE11c2ljKCk7XG4gICAgICAgICAgICBjYy5hdWRpb0VuZ2luZS5zdG9wQWxsRWZmZWN0cygpO1xuICAgICAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoXCJzb3VuZC9sb2dpbl9iZ1wiLCBjYy5BdWRpb0NsaXAsIGZ1bmN0aW9uKGVyciwgY2xpcCkge1xuICAgICAgICAgICAgICAgIGlmICghZXJyICYmIGNsaXApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLmF1ZGlvRW5naW5lLnBsYXlNdXNpYyhjbGlwLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7fVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoKGUpIHt9XG4gICAgfSxcbiAgICBcbiAgICBfZmV0Y2hSb29tQ29uZmlnczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGFwaVVybCA9IHdpbmRvdy5kZWZpbmVzID8gd2luZG93LmRlZmluZXMuYXBpVXJsIDogJyc7XG4gICAgICAgIHZhciBjcnlwdG9LZXkgPSB3aW5kb3cuZGVmaW5lcyA/IHdpbmRvdy5kZWZpbmVzLmNyeXB0b0tleSA6ICcnO1xuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5rKh5pyJ6YWN572uIEFQSe+8jOS9v+eUqOm7mOiupOmFjee9rlxuICAgICAgICBpZiAoIWFwaVVybCB8fCAhd2luZG93Lkh0dHBBUEkpIHtcbiAgICAgICAgICAgIHNlbGYuX2luaXRSb29tQnV0dG9ucyhzZWxmLl9nZXREZWZhdWx0Um9vbUNvbmZpZ3MoKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDmuIXpmaTnvJPlrZhcbiAgICAgICAgICAgIGlmIChIdHRwQVBJLl9yb29tQ29uZmlnQ2FjaGUpIHtcbiAgICAgICAgICAgICAgICBIdHRwQVBJLl9yb29tQ29uZmlnQ2FjaGUgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHsgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Jvb21fY29uZmlnX2NhY2hlJyk7IH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOivt+axgiBBUElcbiAgICAgICAgICAgIEh0dHBBUEkuZ2V0KFxuICAgICAgICAgICAgICAgIGFwaVVybCArICcvYXBpL3YxL3Jvb20vY29uZmlnL2xpc3QnLFxuICAgICAgICAgICAgICAgIGNyeXB0b0tleSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJBUEnor7fmsYLlpLHotKU6XCIsIGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9pbml0Um9vbUJ1dHRvbnMoc2VsZi5fZ2V0RGVmYXVsdFJvb21Db25maWdzKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB2YXIgY29uZmlncyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LmNvZGUgPT09IDAgJiYgcmVzdWx0LmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ3MgPSByZXN1bHQuZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXN1bHQgJiYgQXJyYXkuaXNBcnJheShyZXN1bHQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWdzID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ6LCD6K+V44CR6L6T5Ye66I635Y+W5Yiw55qE5oi/6Ze06YWN572uXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25maWdzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbmZpZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IGNvbmZpZ3NbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25maWdzICYmIGNvbmZpZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yb29tQ29uZmlncyA9IGNvbmZpZ3M7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9pbml0Um9vbUJ1dHRvbnMoY29uZmlncyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9pbml0Um9vbUJ1dHRvbnMoc2VsZi5fZ2V0RGVmYXVsdFJvb21Db25maWdzKCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIl9mZXRjaFJvb21Db25maWdzIOW8guW4uDpcIiwgZSk7XG4gICAgICAgICAgICBzZWxmLl9pbml0Um9vbUJ1dHRvbnMoc2VsZi5fZ2V0RGVmYXVsdFJvb21Db25maWdzKCkpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBfZ2V0RGVmYXVsdFJvb21Db25maWdzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgaWQ6IDEsIHJvb21fbmFtZTogXCLliJ3nuqfmiL9cIiwgcm9vbV90eXBlOiAyLCBiYXNlX3Njb3JlOiAxLCBtdWx0aXBsaWVyOiAxLCBtaW5fZ29sZDogMCwgbWF4X2dvbGQ6IDUwMDAwLCBkZXNjcmlwdGlvbjogXCLlupXliIYxXCIsIHN0YXR1czogMSwgc29ydF9vcmRlcjogMCwgcm9vbV9jYXRlZ29yeTogMSB9LFxuICAgICAgICAgICAgeyBpZDogMiwgcm9vbV9uYW1lOiBcIuS4ree6p+aIv1wiLCByb29tX3R5cGU6IDMsIGJhc2Vfc2NvcmU6IDIsIG11bHRpcGxpZXI6IDEsIG1pbl9nb2xkOiA1MDAwMCwgbWF4X2dvbGQ6IDIwMDAwMCwgZGVzY3JpcHRpb246IFwi5bqV5YiGMlwiLCBzdGF0dXM6IDEsIHNvcnRfb3JkZXI6IDEsIHJvb21fY2F0ZWdvcnk6IDEgfSxcbiAgICAgICAgICAgIHsgaWQ6IDMsIHJvb21fbmFtZTogXCLpq5jnuqfmiL9cIiwgcm9vbV90eXBlOiA0LCBiYXNlX3Njb3JlOiA1LCBtdWx0aXBsaWVyOiAyLCBtaW5fZ29sZDogMjAwMDAwLCBtYXhfZ29sZDogMTAwMDAwMCwgZGVzY3JpcHRpb246IFwi5bqV5YiGNVwiLCBzdGF0dXM6IDEsIHNvcnRfb3JkZXI6IDIsIHJvb21fY2F0ZWdvcnk6IDIgfSxcbiAgICAgICAgICAgIHsgaWQ6IDQsIHJvb21fbmFtZTogXCLlqLHkuZDmiL9cIiwgcm9vbV90eXBlOiA1LCBiYXNlX3Njb3JlOiAxMCwgbXVsdGlwbGllcjogMywgbWluX2dvbGQ6IDEwMDAwMDAsIG1heF9nb2xkOiA1MDAwMDAwLCBkZXNjcmlwdGlvbjogXCLlupXliIYxMFwiLCBzdGF0dXM6IDEsIHNvcnRfb3JkZXI6IDMsIHJvb21fY2F0ZWdvcnk6IDIgfSxcbiAgICAgICAgICAgIHsgaWQ6IDUsIHJvb21fbmFtZTogXCLlqLHkuZDmiL9cIiwgcm9vbV90eXBlOiA2LCBiYXNlX3Njb3JlOiAyMCwgbXVsdGlwbGllcjogNSwgbWluX2dvbGQ6IDUwMDAwMDAsIG1heF9nb2xkOiAwLCBkZXNjcmlwdGlvbjogXCLlupXliIYyMFwiLCBzdGF0dXM6IDEsIHNvcnRfb3JkZXI6IDQsIHJvb21fY2F0ZWdvcnk6IDIgfVxuICAgICAgICBdO1xuICAgIH0sXG4gICAgXG4gICAgX2hpZGVVbndhbnRlZEJ1dHRvbnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY3JlYXRlUm9vbUJ0biA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcImJ0bl9jcmVhdGVfcm9vbVwiKTtcbiAgICAgICAgdmFyIGpvaW5Sb29tQnRuID0gdGhpcy5ub2RlLmdldENoaWxkQnlOYW1lKFwiYnRuX2pvaW5fcm9vbVwiKTtcbiAgICAgICAgaWYgKGNyZWF0ZVJvb21CdG4pIGNyZWF0ZVJvb21CdG4uYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIGlmIChqb2luUm9vbUJ0bikgam9pblJvb21CdG4uYWN0aXZlID0gZmFsc2U7XG4gICAgfSxcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDmoLjlv4Pmlrnms5XvvJrliJ3lp4vljJbmiL/pl7TmjInpkq5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBfaW5pdFJvb21CdXR0b25zOiBmdW5jdGlvbihyb29tcykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgLy8g5oyJ6ZKu5ZCN56ew5pig5bCEXG4gICAgICAgIHZhciBidXR0b25OYW1lTWFwID0ge1xuICAgICAgICAgICAgMjogXCJidG5fcm9vbV9qdW5pb3JcIixcbiAgICAgICAgICAgIDM6IFwiYnRuX3Jvb21fbWlkZGxlXCIsXG4gICAgICAgICAgICA0OiBcImJ0bl9yb29tX3NlbmlvclwiLFxuICAgICAgICAgICAgNTogXCJidG5fcm9vbV9tYXN0ZXJcIixcbiAgICAgICAgICAgIDY6IFwiYnRuX3Jvb21fc3VwcmVtZVwiXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyDlhYjpmpDol4/miYDmnInmiL/pl7TmjInpkq5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIGJ1dHRvbk5hbWVNYXApIHtcbiAgICAgICAgICAgIHZhciBidG5Ob2RlID0gdGhpcy5ub2RlLmdldENoaWxkQnlOYW1lKGJ1dHRvbk5hbWVNYXBba2V5XSk7XG4gICAgICAgICAgICBpZiAoYnRuTm9kZSkgYnRuTm9kZS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIOOAkOS4gOOAgeaVsOaNruWkhOeQhuOAkeaJgOacieaIv+mXtOWQiOW5tuWIsOS4gOS4quaVsOe7hO+8jOaMiSBzb3J0X29yZGVyIOaOkuW6j1xuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgXG4gICAgICAgIHZhciBhbGxSb29tcyA9IFtdO1xuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByb29tcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNvbmZpZyA9IHJvb21zW2ldO1xuICAgICAgICAgICAgdmFyIHNvcnRPcmRlciA9IGNvbmZpZy5zb3J0X29yZGVyIHx8IGNvbmZpZy5zb3J0T3JkZXIgfHwgY29uZmlnLnNvcnQgfHwgMDtcbiAgICAgICAgICAgIHZhciByb29tVHlwZSA9IGNvbmZpZy5yb29tX3R5cGUgfHwgY29uZmlnLnJvb21UeXBlO1xuICAgICAgICAgICAgdmFyIGJ1dHRvbk5hbWUgPSBidXR0b25OYW1lTWFwW3Jvb21UeXBlXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCFidXR0b25OYW1lKSBjb250aW51ZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGJ0bk5vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoYnV0dG9uTmFtZSk7XG4gICAgICAgICAgICBpZiAoIWJ0bk5vZGUpIGNvbnRpbnVlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgcm9vbURhdGEgPSB7XG4gICAgICAgICAgICAgICAgbm9kZTogYnRuTm9kZSxcbiAgICAgICAgICAgICAgICBjb25maWc6IGNvbmZpZyxcbiAgICAgICAgICAgICAgICByb29tVHlwZTogcm9vbVR5cGUsXG4gICAgICAgICAgICAgICAgc29ydE9yZGVyOiBzb3J0T3JkZXIsXG4gICAgICAgICAgICAgICAgcm9vbU5hbWU6IGNvbmZpZy5yb29tX25hbWUgfHwgY29uZmlnLnJvb21OYW1lIHx8IFwi5pyq55+l5oi/6Ze0XCIsXG4gICAgICAgICAgICAgICAgbWluR29sZDogY29uZmlnLm1pbl9nb2xkIHx8IGNvbmZpZy5taW5Hb2xkIHx8IDAsXG4gICAgICAgICAgICAgICAgbWF4R29sZDogY29uZmlnLm1heF9nb2xkIHx8IGNvbmZpZy5tYXhHb2xkIHx8IDAsXG4gICAgICAgICAgICAgICAgcm9vbUNhdGVnb3J5OiBjb25maWcucm9vbV9jYXRlZ29yeSB8fCBjb25maWcucm9vbUNhdGVnb3J5IHx8IDFcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGFsbFJvb21zLnB1c2gocm9vbURhdGEpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmjIkgc29ydF9vcmRlciDljYfluo/mjpLluo9cbiAgICAgICAgYWxsUm9vbXMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhLnNvcnRPcmRlciAtIGIuc29ydE9yZGVyOyB9KTtcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyDphY3nva7miYDmnInljaHniYdcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbGxSb29tcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJvb20gPSBhbGxSb29tc1tpXTtcbiAgICAgICAgICAgIHJvb20ubm9kZS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgcm9vbS5ub2RlLnJvb21Db25maWcgPSByb29tLmNvbmZpZztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2VsZi5fbG9hZFJvb21CdXR0b25CZyhyb29tLm5vZGUsIHJvb20ucm9vbVR5cGUpO1xuICAgICAgICAgICAgc2VsZi5fdXBkYXRlTWluR29sZExhYmVsKHJvb20ubm9kZSwgcm9vbS5jb25maWcpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgYnV0dG9uID0gcm9vbS5ub2RlLmdldENvbXBvbmVudChjYy5CdXR0b24pO1xuICAgICAgICAgICAgaWYgKGJ1dHRvbikge1xuICAgICAgICAgICAgICAgIGJ1dHRvbi50cmFuc2l0aW9uID0gY2MuQnV0dG9uLlRyYW5zaXRpb24uU0NBTEU7XG4gICAgICAgICAgICAgICAgYnV0dG9uLmR1cmF0aW9uID0gMC4xO1xuICAgICAgICAgICAgICAgIGJ1dHRvbi56b29tU2NhbGUgPSAxLjE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOaUtumbhuernuaKgOWcuuaIv+mXtFxuICAgICAgICAgICAgaWYgKHJvb20ucm9vbUNhdGVnb3J5ID09PSAyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzZWxmLl9hcmVuYVJvb21zKSBzZWxmLl9hcmVuYVJvb21zID0gW107XG4gICAgICAgICAgICAgICAgc2VsZi5fYXJlbmFSb29tcy5wdXNoKHJvb20pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAoZnVuY3Rpb24oY29uZmlnLCBub2RlLCByb29tTmFtZSwgcm9vbUNhdGVnb3J5KSB7XG4gICAgICAgICAgICAgICAgbm9kZS5vZmYoY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5EKTtcbiAgICAgICAgICAgICAgICBub2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIOernuaKgOWcuuaIv+mXtO+8muS4jeWGjeWTjeW6lOaVtOS4quWNoeeJh+eahOeCueWHu++8jOeUseaKpeWQjeaMiemSruWkhOeQhlxuICAgICAgICAgICAgICAgICAgICBpZiAocm9vbUNhdGVnb3J5ID09PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fb25Sb29tQnV0dG9uQ2xpY2soY29uZmlnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pKHJvb20uY29uZmlnLCByb29tLm5vZGUsIHJvb20ucm9vbU5hbWUsIHJvb20ucm9vbUNhdGVnb3J5KTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5riy5p+T5biD5bGAIC0g5omA5pyJ5Y2h54mH5o6S5oiQ5LiA6KGMXG4gICAgICAgIHRoaXMuX3JlbmRlclJvb21MYXlvdXQoYWxsUm9vbXMpO1xuICAgICAgICBcbiAgICAgICAgLy8g5Li656ue5oqA5Zy65oi/6Ze05re75Yqg5oql5ZCN5oyJ6ZKuXG4gICAgICAgIHRoaXMuX2FkZEFyZW5hU2lnbnVwQnV0dG9ucygpO1xuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeWFiOS7juacjeWKoeerr+iOt+WPluaKpeWQjeeKtuaAge+8jOWGjeabtOaWsFVJXG4gICAgICAgIHRoaXMuX2ZldGNoU2lnbnVwU3RhdHVzQW5kVXBkYXRlVUkoKTtcbiAgICB9LFxuICAgIFxuICAgIC8vIPCflKfjgJDmlrDlop7jgJHku47mnI3liqHnq6/ojrflj5bmiqXlkI3nirbmgIHlubbmm7TmlrBVSVxuICAgIF9mZXRjaFNpZ251cFN0YXR1c0FuZFVwZGF0ZVVJOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgaWYgKHdpbmRvdy5hcmVuYURhdGEgJiYgd2luZG93LmFyZW5hRGF0YS5mZXRjaFNpZ251cFN0YXR1c0Zyb21TZXJ2ZXIpIHtcbiAgICAgICAgICAgIHdpbmRvdy5hcmVuYURhdGEuZmV0Y2hTaWdudXBTdGF0dXNGcm9tU2VydmVyKGZ1bmN0aW9uKGVyciwgc2lnbmVkVXBSb29tcykge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+Pn++4jyDojrflj5bmiqXlkI3nirbmgIHlpLHotKXvvIzkvb/nlKjmnKzlnLDnvJPlrZg6XCIsIGVycik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g5peg6K665oiQ5Yqf5aSx6LSl77yM6YO95pu05pawVUnvvIjkvb/nlKjmnKzlnLDnvJPlrZjvvIlcbiAgICAgICAgICAgICAgICBzZWxmLl91cGRhdGVBcmVuYVNpZ251cFN0YXR1cygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDmsqHmnIlBUEnmlK/mjIHvvIznm7TmjqXkvb/nlKjmnKzlnLDnvJPlrZhcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZUFyZW5hU2lnbnVwU3RhdHVzKCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOW4g+WxgOa4suafkyAtIOaJgOacieWNoeeJh+awtOW5s+aOkuaIkOS4gOihjFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIF9yZW5kZXJSb29tTGF5b3V0OiBmdW5jdGlvbihhbGxSb29tcykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICAvLyDmuIXnkIbml6flrrnlmahcbiAgICAgICAgdmFyIG9sZFBhbmVsID0gdGhpcy5ub2RlLmdldENoaWxkQnlOYW1lKFwiQ2FyZENvbnRhaW5lclwiKTtcbiAgICAgICAgdmFyIG9sZExlZnRQYW5lbCA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcIkxlZnRBcmVhXCIpO1xuICAgICAgICB2YXIgb2xkUmlnaHRQYW5lbCA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcIlJpZ2h0QXJlYVwiKTtcbiAgICAgICAgaWYgKG9sZFBhbmVsKSBvbGRQYW5lbC5kZXN0cm95KCk7XG4gICAgICAgIGlmIChvbGRMZWZ0UGFuZWwpIG9sZExlZnRQYW5lbC5kZXN0cm95KCk7XG4gICAgICAgIGlmIChvbGRSaWdodFBhbmVsKSBvbGRSaWdodFBhbmVsLmRlc3Ryb3koKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChhbGxSb29tcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIOWPguaVsOiuvue9rlxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdmFyIGNhcmRXaWR0aCA9IDE4MDsgICAgICAgLy8g5Y2h54mH5a695bqmXG4gICAgICAgIHZhciBjYXJkSGVpZ2h0ID0gMTIwOyAgICAgIC8vIOWNoeeJh+mrmOW6plxuICAgICAgICB2YXIgZ2FwWCA9IDMwOyAgICAgICAgICAgICAvLyDljaHniYfmsLTlubPpl7Tot51cbiAgICAgICAgXG4gICAgICAgIC8vIOeUu+W4g+WwuuWvuFxuICAgICAgICB2YXIgY2FudmFzID0gdGhpcy5ub2RlLmdldENvbXBvbmVudChjYy5DYW52YXMpIHx8IGNjLmZpbmQoJ0NhbnZhcycpLmdldENvbXBvbmVudChjYy5DYW52YXMpO1xuICAgICAgICB2YXIgc2NyZWVuSGVpZ2h0ID0gY2FudmFzID8gY2FudmFzLmRlc2lnblJlc29sdXRpb24uaGVpZ2h0IDogNzIwO1xuICAgICAgICB2YXIgc2NyZWVuV2lkdGggPSBjYW52YXMgPyBjYW52YXMuZGVzaWduUmVzb2x1dGlvbi53aWR0aCA6IDEyODA7XG4gICAgICAgIFxuICAgICAgICAvLyDorqHnrpflrrnlmajlrr3luqZcbiAgICAgICAgdmFyIHRvdGFsQ2FyZHNXaWR0aCA9IGFsbFJvb21zLmxlbmd0aCAqIGNhcmRXaWR0aCArIChhbGxSb29tcy5sZW5ndGggLSAxKSAqIGdhcFg7XG4gICAgICAgIHZhciBwYW5lbFdpZHRoID0gTWF0aC5tYXgodG90YWxDYXJkc1dpZHRoICsgNDAsIHNjcmVlbldpZHRoIC0gMTAwKTtcbiAgICAgICAgdmFyIHBhbmVsSGVpZ2h0ID0gY2FyZEhlaWdodCArIDQwO1xuICAgICAgICBcbiAgICAgICAgLy8g5a655Zmo5L2N572uXG4gICAgICAgIHZhciB2ZXJ0aWNhbE9mZnNldCA9IDIwOyAgIC8vIOWeguebtOWBj+enu++8iOS4i+enu++8iVxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyDliJvlu7rlrrnlmaggLSDmiYDmnInljaHniYfmsLTlubPmjpLmiJDkuIDooYxcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBjYXJkUGFuZWwgPSBuZXcgY2MuTm9kZShcIkNhcmRDb250YWluZXJcIik7XG4gICAgICAgIGNhcmRQYW5lbC5zZXRDb250ZW50U2l6ZShwYW5lbFdpZHRoLCBwYW5lbEhlaWdodCk7XG4gICAgICAgIGNhcmRQYW5lbC5hbmNob3JYID0gMC41O1xuICAgICAgICBjYXJkUGFuZWwuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgY2FyZFBhbmVsLnggPSAwOyAgLy8g5bGF5LitXG4gICAgICAgIGNhcmRQYW5lbC55ID0gdmVydGljYWxPZmZzZXQ7XG4gICAgICAgIGNhcmRQYW5lbC5wYXJlbnQgPSB0aGlzLm5vZGU7XG4gICAgICAgIFxuICAgICAgICAvLyDmlL7nva7miYDmnInljaHniYcgLSDmsLTlubPmjpLliJdcbiAgICAgICAgdmFyIHN0YXJ0WCA9IC10b3RhbENhcmRzV2lkdGggLyAyICsgY2FyZFdpZHRoIC8gMjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbGxSb29tcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJvb20gPSBhbGxSb29tc1tpXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHdpZGdldCA9IHJvb20ubm9kZS5nZXRDb21wb25lbnQoY2MuV2lkZ2V0KTtcbiAgICAgICAgICAgIGlmICh3aWRnZXQpIHdpZGdldC5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgICByb29tLm5vZGUuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgICAgIHJvb20ubm9kZS5hbmNob3JZID0gMC41O1xuICAgICAgICAgICAgcm9vbS5ub2RlLnNjYWxlID0gMTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcm9vbS5ub2RlLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICByb29tLm5vZGUucGFyZW50ID0gY2FyZFBhbmVsO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDljaHniYfmsLTlubPkvY3nva7vvJrku47lt6bliLDlj7PmjpLliJdcbiAgICAgICAgICAgIHJvb20ubm9kZS54ID0gc3RhcnRYICsgaSAqIChjYXJkV2lkdGggKyBnYXBYKTtcbiAgICAgICAgICAgIC8vIOWNoeeJh+WeguebtOS9jee9ru+8muWxheS4rVxuICAgICAgICAgICAgcm9vbS5ub2RlLnkgPSAwO1xuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfSxcbiAgICBcbiAgICAvLyDmt7vliqDljLrln5/moIfpophcbiAgICBfYWRkQXJlYVRpdGxlOiBmdW5jdGlvbihwYW5lbCwgdGl0bGVUZXh0LCB4LCB5KSB7XG4gICAgICAgIHZhciB0aXRsZU5vZGUgPSBuZXcgY2MuTm9kZShcIkFyZWFUaXRsZVwiKTtcbiAgICAgICAgdGl0bGVOb2RlLnNldFBvc2l0aW9uKHgsIHkpO1xuICAgICAgICB0aXRsZU5vZGUuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgdGl0bGVOb2RlLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIFxuICAgICAgICB2YXIgbGFiZWwgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgbGFiZWwuc3RyaW5nID0gdGl0bGVUZXh0O1xuICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDI4O1xuICAgICAgICBsYWJlbC5saW5lSGVpZ2h0ID0gMzY7XG4gICAgICAgIGxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIFxuICAgICAgICB0aXRsZU5vZGUuY29sb3IgPSBjYy5jb2xvcigyNTUsIDIxNSwgMCk7XG4gICAgICAgIFxuICAgICAgICB2YXIgb3V0bGluZSA9IHRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKTtcbiAgICAgICAgb3V0bGluZS5jb2xvciA9IGNjLmNvbG9yKDAsIDAsIDApO1xuICAgICAgICBvdXRsaW5lLndpZHRoID0gMjtcbiAgICAgICAgXG4gICAgICAgIHRpdGxlTm9kZS5wYXJlbnQgPSBwYW5lbDtcbiAgICB9LFxuICAgIFxuICAgIC8vIOWHhuWkh+WNoeeJh+iKgueCue+8iOWTjeW6lOW8j++8jOaUr+aMgee8qeaUvu+8iVxuICAgIF9wcmVwYXJlQ2FyZE5vZGVSZXNwb25zaXZlOiBmdW5jdGlvbihub2RlLCBjYXJkU2NhbGUpIHtcbiAgICAgICAgLy8g56aB55SoIFdpZGdldCDnu4Tku7bvvIjpmLLmraLoh6rliqjmi4nkvLjvvIlcbiAgICAgICAgdmFyIHdpZGdldCA9IG5vZGUuZ2V0Q29tcG9uZW50KGNjLldpZGdldCk7XG4gICAgICAgIGlmICh3aWRnZXQpIHtcbiAgICAgICAgICAgIHdpZGdldC5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmUmueCueiuvuS4uuS4reW/g1xuICAgICAgICBub2RlLmFuY2hvclggPSAwLjU7XG4gICAgICAgIG5vZGUuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgXG4gICAgICAgIC8vIOW6lOeUqOe8qeaUvu+8iOS4jeaLieS8uO+8jOS/neaMgeavlOS+i++8iVxuICAgICAgICBub2RlLnNjYWxlID0gY2FyZFNjYWxlIHx8IDE7XG4gICAgfSxcbiAgICBcbiAgICAvLyDmt7vliqDljLrln5/moIfpophcbiAgICBfYWRkQXJlYVRpdGxlOiBmdW5jdGlvbihwYW5lbCwgdGl0bGUsIHgsIHkpIHtcbiAgICAgICAgdmFyIHRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIik7XG4gICAgICAgIHRpdGxlTm9kZS5zZXRQb3NpdGlvbih4LCB5KTtcbiAgICAgICAgdGl0bGVOb2RlLmFuY2hvclggPSAwO1xuICAgICAgICB0aXRsZU5vZGUuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgXG4gICAgICAgIHZhciBsYWJlbCA9IHRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBsYWJlbC5zdHJpbmcgPSB0aXRsZTtcbiAgICAgICAgbGFiZWwuZm9udFNpemUgPSAyODtcbiAgICAgICAgbGFiZWwubGluZUhlaWdodCA9IDM2O1xuICAgICAgICBsYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uTEVGVDtcbiAgICAgICAgXG4gICAgICAgIHRpdGxlTm9kZS5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjE1LCAwKTtcbiAgICAgICAgXG4gICAgICAgIHZhciBvdXRsaW5lID0gdGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpO1xuICAgICAgICBvdXRsaW5lLmNvbG9yID0gY2MuY29sb3IoMCwgMCwgMCk7XG4gICAgICAgIG91dGxpbmUud2lkdGggPSAyO1xuICAgICAgICBcbiAgICAgICAgdGl0bGVOb2RlLnBhcmVudCA9IHBhbmVsO1xuICAgIH0sXG4gICAgXG4gICAgLy8g5Yqg6L295oi/6Ze05oyJ6ZKu6IOM5pmv5Zu+XG4gICAgX2xvYWRSb29tQnV0dG9uQmc6IGZ1bmN0aW9uKGJ0bk5vZGUsIHJvb21UeXBlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHNwcml0ZSA9IGJ0bk5vZGUuZ2V0Q29tcG9uZW50KGNjLlNwcml0ZSk7XG4gICAgICAgIGlmICghc3ByaXRlKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZCgnVUkvYnRuX2hhcHB5XycgKyByb29tVHlwZSwgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVyciwgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgIGlmIChlcnIgfHwgIXNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fbG9hZERlZmF1bHRSb29tQnV0dG9uQmcoYnRuTm9kZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBzcHJpdGUuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9sb2FkRGVmYXVsdFJvb21CdXR0b25CZyhidG5Ob2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBcbiAgICBfbG9hZERlZmF1bHRSb29tQnV0dG9uQmc6IGZ1bmN0aW9uKGJ0bk5vZGUpIHtcbiAgICAgICAgdmFyIHNwcml0ZSA9IGJ0bk5vZGUuZ2V0Q29tcG9uZW50KGNjLlNwcml0ZSk7XG4gICAgICAgIGlmICghc3ByaXRlKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZCgnVUkvYnRuX2hhcHB5XzInLCBjYy5TcHJpdGVGcmFtZSwgZnVuY3Rpb24oZXJyLCBzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgaWYgKCFlcnIgJiYgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBzcHJpdGUuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIFxuICAgIC8vIOabtOaWsOacgOS9juixhuWtkC/nq57mioDluIHmmL7npLrvvIjmoLnmja4gcm9vbV9jYXRlZ29yeSDliKTmlq3vvIlcbiAgICAvLyByb29tX2NhdGVnb3J5OiAxLeaZrumAmuWcuijkvb/nlKhtaW5fZ29sZOWtl+auteaYvuekuuixhiksIDIt56ue5oqA5Zy6KOS9v+eUqG1pbl9hcmVuYV9jb2lu5a2X5q615pi+56S656ue5oqA5biBKVxuICAgIF91cGRhdGVNaW5Hb2xkTGFiZWw6IGZ1bmN0aW9uKGJ0bk5vZGUsIGNvbmZpZykge1xuICAgICAgICB2YXIgZ29sZExhYmVsTm9kZSA9IGJ0bk5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJtaW5fZ29sZF9sYWJlbFwiKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPluaIv+mXtOWIhuexu++8jOm7mOiupOS4uuaZrumAmuWcuigxKVxuICAgICAgICB2YXIgcm9vbUNhdGVnb3J5ID0gY29uZmlnLnJvb21fY2F0ZWdvcnkgfHwgY29uZmlnLnJvb21DYXRlZ29yeSB8fCAxO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFnb2xkTGFiZWxOb2RlKSB7XG4gICAgICAgICAgICBnb2xkTGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJtaW5fZ29sZF9sYWJlbFwiKTtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IGdvbGRMYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgICAgIGxhYmVsLmZvbnRTaXplID0gMjI7ICAgICAgIC8vIOWtl+S9k+Wkp+Wwj1xuICAgICAgICAgICAgbGFiZWwubGluZUhlaWdodCA9IDI4OyAgICAgIC8vIOihjOmrmFxuICAgICAgICAgICAgbGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgICAgIGdvbGRMYWJlbE5vZGUuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgICAgIGdvbGRMYWJlbE5vZGUuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIG91dGxpbmUgPSBnb2xkTGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpO1xuICAgICAgICAgICAgb3V0bGluZS5jb2xvciA9IGNjLmNvbG9yKDAsIDAsIDApO1xuICAgICAgICAgICAgb3V0bGluZS53aWR0aCA9IDI7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOiuvue9ruabtOmrmOeahCB6SW5kZXgg56Gu5L+d5pi+56S65Zyo5pyA5LiK5bGCXG4gICAgICAgICAgICBnb2xkTGFiZWxOb2RlLnpJbmRleCA9IDEwMDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZ29sZExhYmVsTm9kZS5wYXJlbnQgPSBidG5Ob2RlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgbGFiZWwgPSBnb2xkTGFiZWxOb2RlLmdldENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIFxuICAgICAgICAvLyDmoLnmja7miL/pl7Tnsbvlnovojrflj5bkuI3lkIznmoTlrZfmrrXlgLxcbiAgICAgICAgLy8gcm9vbV9jYXRlZ29yeTogMS3mma7pgJrlnLoo5L2/55SobWluX2dvbGQpLCAyLeernuaKgOWcuijkvb/nlKhtaW5fYXJlbmFfY29pbilcbiAgICAgICAgdmFyIG1pblZhbHVlO1xuICAgICAgICB2YXIgY3VycmVuY3lOYW1lO1xuICAgICAgICBcbiAgICAgICAgaWYgKHJvb21DYXRlZ29yeSA9PT0gMikge1xuICAgICAgICAgICAgLy8g56ue5oqA5Zy6IC0g5L2/55SoIG1pbl9hcmVuYV9jb2luIOWtl+autVxuICAgICAgICAgICAgbWluVmFsdWUgPSBjb25maWcubWluX2FyZW5hX2NvaW4gfHwgY29uZmlnLm1pbkFyZW5hQ29pbiB8fCAwO1xuICAgICAgICAgICAgY3VycmVuY3lOYW1lID0gXCLluIFcIjtcbiAgICAgICAgICAgIGdvbGRMYWJlbE5vZGUuY29sb3IgPSBjYy5jb2xvcigyNTUsIDI1NSwgMjU1KTsgICAgLy8g56ue5oqA5Zy677ya55m96ImyXG4gICAgICAgICAgICAvLyDnq57mioDlnLrvvJrkuI3mmL7npLpcIuacgOS9jlwiXG4gICAgICAgICAgICBsYWJlbC5zdHJpbmcgPSB0aGlzLl9mb3JtYXRHb2xkKG1pblZhbHVlKSArIFwiIFwiICsgY3VycmVuY3lOYW1lO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5pmu6YCa5Zy6IC0g5L2/55SoIG1pbl9nb2xkIOWtl+autVxuICAgICAgICAgICAgbWluVmFsdWUgPSBjb25maWcubWluX2dvbGQgfHwgY29uZmlnLm1pbkdvbGQgfHwgMDtcbiAgICAgICAgICAgIGN1cnJlbmN5TmFtZSA9IFwi6LGGXCI7XG4gICAgICAgICAgICBnb2xkTGFiZWxOb2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyNTUsIDI1NSk7ICAgIC8vIOaZrumAmuWcuu+8mueZveiJslxuICAgICAgICAgICAgLy8g5pmu6YCa5Zy677ya5L+d55WZXCLmnIDkvY5cIlxuICAgICAgICAgICAgbGFiZWwuc3RyaW5nID0gXCLmnIDkvY4gXCIgKyB0aGlzLl9mb3JtYXRHb2xkKG1pblZhbHVlKSArIFwiIFwiICsgY3VycmVuY3lOYW1lO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDkv67mraPkvY3nva7vvJrmjInpkq7lm77niYflupXpg6jmnInosYblrZDlm77moIflnKjlt6bkvqfvvIzmloflrZflupTmmL7npLrlnKjlm77moIflj7PkvqdcbiAgICAgICAgLy8g5oyJ6ZKu6auY5bqmIDM3NXB477yM5bqV6YOo6JOd6Imy5riQ5Y+Y5p2h57qm5Y2gIDEvNO+8iOe6puWcqDc1JS0xMDAl5L2N572u77yJXG4gICAgICAgIC8vIOWbvuagh+WcqOW6lemDqOW3puS+p+e6pjEwJS0yMCXlrr3luqbkvY3nva7vvIzmloflrZflupTlgY/lj7PmmL7npLpcbiAgICAgICAgdmFyIGJ0bkhlaWdodCA9IGJ0bk5vZGUuaGVpZ2h0IHx8IDM3NTtcbiAgICAgICAgLy8gWeWdkOagh++8muS7juW6lemDqOi+uee8mOWQkeS4iue6pjE2JeeahOS9jee9ru+8iOWcqOa4kOWPmOadoeWGhe+8iVxuICAgICAgICB2YXIgeU9mZnNldCA9IC1idG5IZWlnaHQvMiArIGJ0bkhlaWdodCAqIDAuMTY7XG4gICAgICAgIC8vIFjlnZDmoIfvvJrlsYXkuK3mmL7npLpcbiAgICAgICAgdmFyIHhPZmZzZXQgPSAwOyAgLy8g5bGF5LitXG4gICAgICAgIGdvbGRMYWJlbE5vZGUuc2V0UG9zaXRpb24oeE9mZnNldCwgeU9mZnNldCk7XG4gICAgfSxcbiAgICBcbiAgICAvLyDmiL/pl7TmjInpkq7ngrnlh7vlpITnkIYgLSDmoLnmja7miL/pl7TnsbvlnovljLrliIblpITnkIZcbiAgICAvLyByb29tX2NhdGVnb3J5OiAxLeaZrumAmuWcuijmrKLkuZDosYYpLCAyLeernuaKgOWcuijnq57mioDluIEpXG4gICAgX29uUm9vbUJ1dHRvbkNsaWNrOiBmdW5jdGlvbihyb29tQ29uZmlnKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICB2YXIgcm9vbUNhdGVnb3J5ID0gcm9vbUNvbmZpZy5yb29tX2NhdGVnb3J5IHx8IHJvb21Db25maWcucm9vbUNhdGVnb3J5IHx8IDE7XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDotKfluIHmmL7npLpcbiAgICAgICAgdGhpcy5fY3VycmVudFJvb21DYXRlZ29yeSA9IHJvb21DYXRlZ29yeTtcbiAgICAgICAgdGhpcy5fdXBkYXRlQ3VycmVuY3lEaXNwbGF5KCk7XG4gICAgICAgIFxuICAgICAgICAvLyDmoLnmja7miL/pl7TnsbvlnovlpITnkIZcbiAgICAgICAgaWYgKHJvb21DYXRlZ29yeSA9PT0gMikge1xuICAgICAgICAgICAgLy8g56ue5oqA5Zy65oi/6Ze0IC0g5pi+56S65oql5ZCN5by556qXXG4gICAgICAgICAgICB0aGlzLl9vbkFyZW5hUm9vbUJ1dHRvbkNsaWNrKHJvb21Db25maWcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5pmu6YCa5Zy65oi/6Ze0IC0g5Y6f5pyJ6YC76L6RXG4gICAgICAgICAgICB0aGlzLl9vbk5vcm1hbFJvb21CdXR0b25DbGljayhyb29tQ29uZmlnKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLy8g5pmu6YCa5Zy65oi/6Ze05oyJ6ZKu54K55Ye75aSE55CGXG4gICAgX29uTm9ybWFsUm9vbUJ1dHRvbkNsaWNrOiBmdW5jdGlvbihyb29tQ29uZmlnKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICB2YXIgcGxheWVyR29sZCA9IG15Z2xvYmFsICYmIG15Z2xvYmFsLnBsYXllckRhdGEgPyBteWdsb2JhbC5wbGF5ZXJEYXRhLmdvYmFsX2NvdW50IDogMDtcbiAgICAgICAgXG4gICAgICAgIHZhciBtaW5Hb2xkID0gcm9vbUNvbmZpZy5taW5fZ29sZCB8fCByb29tQ29uZmlnLm1pbkdvbGQgfHwgMDtcbiAgICAgICAgdmFyIG1heEdvbGQgPSByb29tQ29uZmlnLm1heF9nb2xkIHx8IHJvb21Db25maWcubWF4R29sZCB8fCAwO1xuICAgICAgICBcbiAgICAgICAgaWYgKHBsYXllckdvbGQgPCBtaW5Hb2xkKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93QWRSZXdhcmREaWFsb2coJ2dvbGQnLCBtaW5Hb2xkIC0gcGxheWVyR29sZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChtYXhHb2xkID4gMCAmJiBwbGF5ZXJHb2xkID4gbWF4R29sZCkge1xuICAgICAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2UoXCLmrKLkuZDosYbotoXov4fkuIrpmZDvvIzor7fliY3lvoDmm7Tpq5jnuqfmiL/pl7RcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOS/neWtmOW9k+WJjeaIv+mXtOmFjee9rlxuICAgICAgICBpZiAobXlnbG9iYWwpIHtcbiAgICAgICAgICAgIG15Z2xvYmFsLmN1cnJlbnRSb29tQ29uZmlnID0gcm9vbUNvbmZpZztcbiAgICAgICAgICAgIG15Z2xvYmFsLmN1cnJlbnRSb29tTGV2ZWwgPSByb29tQ29uZmlnLnJvb21fdHlwZTtcbiAgICAgICAgICAgIG15Z2xvYmFsLmN1cnJlbnRSb29tTmFtZSA9IHJvb21Db25maWcucm9vbV9uYW1lO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDnm7TmjqXlv6vpgJ/ljLnphY3ov5vlhaXmuLjmiI9cbiAgICAgICAgdGhpcy5fcXVpY2tNYXRjaChyb29tQ29uZmlnLCBwbGF5ZXJHb2xkKTtcbiAgICB9LFxuICAgIFxuICAgIC8vIOernuaKgOWcuuaIv+mXtOaMiemSrueCueWHu+WkhOeQhiAtIOebtOaOpeaKpeWQje+8iOS4jeW8ueahhu+8iVxuICAgIF9vbkFyZW5hUm9vbUJ1dHRvbkNsaWNrOiBmdW5jdGlvbihyb29tQ29uZmlnLCBidG5Ob2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICBcbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm5bey5oql5ZCNXG4gICAgICAgIHZhciByb29tSWQgPSByb29tQ29uZmlnLmlkO1xuICAgICAgICBpZiAod2luZG93LmFyZW5hRGF0YSAmJiB3aW5kb3cuYXJlbmFEYXRhLmlzU2lnbmVkVXAocm9vbUlkKSkge1xuICAgICAgICAgICAgLy8g5bey5oql5ZCN77yM5LiN5YGa5aSE55CGXG4gICAgICAgICAgICB0aGlzLl9zaG93TWVzc2FnZShcIuaCqOW3suaKpeWQjeatpOernuaKgOWculwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm5bey5oql5ZCN5YW25LuW56ue5oqA5Zy677yI5Yid57qn44CB5Lit57qn44CB6auY57qn5Zy65Y+q6IO95oql5LiA5Liq77yJXG4gICAgICAgIGlmICh3aW5kb3cuYXJlbmFEYXRhICYmIHRoaXMuX2hhc1NpZ25lZFVwT3RoZXJBcmVuYShyb29tSWQpKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93TWVzc2FnZShcIuaCqOW3suaKpeWQjeWFtuS7luernuaKgOWcuu+8jOavj+WcuuWPquiDveaKpeWQjeS4gOS4que6p+WIq1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeS4jeS9v+eUqOacrOWcsOe8k+WtmOeahOernuaKgOW4geS9memineWIpOaWre+8jOebtOaOpeiwg+eUqOacjeWKoeerr+aKpeWQjUFQSVxuICAgICAgICAvLyDljp/lm6DvvJrlkI7lj7Dmt7vliqDnq57mioDluIHlkI7vvIzlrqLmiLfnq6/mnKzlnLDnvJPlrZjnmoTlgLzmsqHmnInmm7TmlrDvvIzkvJrlr7zoh7Tor6/liKRcbiAgICAgICAgLy8g5pyN5Yqh56uv5Lya5qOA5p+l56ue5oqA5biB5L2Z6aKd5bm26L+U5Zue6K+m57uG6ZSZ6K+v5L+h5oGvXG4gICAgICAgIFxuICAgICAgICAvLyDnm7TmjqXmiafooYzmiqXlkI1cbiAgICAgICAgdGhpcy5fZG9BcmVuYVNpZ251cChyb29tQ29uZmlnLCBidG5Ob2RlKTtcbiAgICB9LFxuICAgIFxuICAgIC8vIOajgOafpeaYr+WQpuW3suaKpeWQjeWFtuS7luernuaKgOWcuu+8iOWInee6p+OAgeS4ree6p+OAgemrmOe6p+WcuuWPquiDveaKpeS4gOS4qu+8iVxuICAgIF9oYXNTaWduZWRVcE90aGVyQXJlbmE6IGZ1bmN0aW9uKGN1cnJlbnRSb29tSWQpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuYXJlbmFEYXRhIHx8ICF0aGlzLl9hcmVuYVJvb21zKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2FyZW5hUm9vbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByb29tID0gdGhpcy5fYXJlbmFSb29tc1tpXTtcbiAgICAgICAgICAgIHZhciByb29tSWQgPSByb29tLmNvbmZpZy5pZDtcbiAgICAgICAgICAgIGlmIChyb29tSWQgIT09IGN1cnJlbnRSb29tSWQgJiYgd2luZG93LmFyZW5hRGF0YS5pc1NpZ25lZFVwKHJvb21JZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcbiAgICBcbiAgICAvLyDnm7TmjqXmiafooYznq57mioDlnLrmiqXlkI3vvIjkuI3lvLnmoYbvvIlcbiAgICBfZG9BcmVuYVNpZ251cDogZnVuY3Rpb24ocm9vbUNvbmZpZywgYnRuTm9kZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICAvLyDmmL7npLrliqDovb3kuK1cbiAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2UoXCLmraPlnKjmiqXlkI0uLi5cIik7XG4gICAgICAgIFxuICAgICAgICAvLyDosIPnlKjmiqXlkI1BUElcbiAgICAgICAgaWYgKHdpbmRvdy5hcmVuYURhdGEpIHtcbiAgICAgICAgICAgIHdpbmRvdy5hcmVuYURhdGEuc2lnbnVwKHJvb21Db25maWcuaWQsIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZShlcnIgfHwgXCLmiqXlkI3lpLHotKVcIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5oql5ZCN5oiQ5YqfXG4gICAgICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2UoXCLmiqXlkI3miJDlip/vvIFcIik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5Yi35paw546p5a625L2Z6aKdXG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5hcmVuYURhdGEucmVmcmVzaEJhbGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmFyZW5hRGF0YS5yZWZyZXNoQmFsYW5jZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDmm7TmlrBVSVxuICAgICAgICAgICAgICAgIHNlbGYuX3VwZGF0ZUFyZW5hU2lnbnVwU3RhdHVzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLy8g5Li656ue5oqA5Zy65oi/6Ze05re75Yqg5oql5ZCN5oyJ6ZKu77yI5L2/55So5Zu+54mH6LWE5rqQ77yJXG4gICAgLy8g5oql5ZCN5oyJ6ZKu5pS+5Zyo5oi/6Ze05Y2h54mH55qE5aSW6YOo5LiL5pa577yM57Sn6LS05Y2h54mH5bqV6YOoXG4gICAgX2FkZEFyZW5hU2lnbnVwQnV0dG9uczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgaWYgKCF0aGlzLl9hcmVuYVJvb21zKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5bljaHniYflrrnlmahcbiAgICAgICAgdmFyIGNhcmRQYW5lbCA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcIkNhcmRDb250YWluZXJcIik7XG4gICAgICAgIGlmICghY2FyZFBhbmVsKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJDYXJkQ29udGFpbmVyIG5vdCBmb3VuZFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5riF55CG5pen55qE5oql5ZCN5oyJ6ZKu5ZKM5YCS6K6h5pe25pi+56S6XG4gICAgICAgIHZhciBvbGRCdXR0b25zID0gY2FyZFBhbmVsLmdldENoaWxkQnlOYW1lKFwiQXJlbmFTaWdudXBCdXR0b25zXCIpO1xuICAgICAgICBpZiAob2xkQnV0dG9ucykgb2xkQnV0dG9ucy5kZXN0cm95KCk7XG4gICAgICAgIHZhciBvbGRUaW1lcnMgPSBjYXJkUGFuZWwuZ2V0Q2hpbGRCeU5hbWUoXCJBcmVuYUNvdW50ZG93bnNcIik7XG4gICAgICAgIGlmIChvbGRUaW1lcnMpIG9sZFRpbWVycy5kZXN0cm95KCk7XG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7rmiqXlkI3mjInpkq7lrrnlmahcbiAgICAgICAgdmFyIGJ1dHRvbkNvbnRhaW5lciA9IG5ldyBjYy5Ob2RlKFwiQXJlbmFTaWdudXBCdXR0b25zXCIpO1xuICAgICAgICBidXR0b25Db250YWluZXIucGFyZW50ID0gY2FyZFBhbmVsO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65YCS6K6h5pe25pi+56S65a655ZmoXG4gICAgICAgIHZhciBjb3VudGRvd25Db250YWluZXIgPSBuZXcgY2MuTm9kZShcIkFyZW5hQ291bnRkb3duc1wiKTtcbiAgICAgICAgY291bnRkb3duQ29udGFpbmVyLnBhcmVudCA9IGNhcmRQYW5lbDtcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fYXJlbmFSb29tcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJvb20gPSB0aGlzLl9hcmVuYVJvb21zW2ldO1xuICAgICAgICAgICAgdmFyIGJ0bk5vZGUgPSByb29tLm5vZGU7XG4gICAgICAgICAgICB2YXIgY29uZmlnID0gcm9vbS5jb25maWc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAgICAgLy8g44CQ6YeN5p6E44CR5Yib5bu656ue5oqA5Zy654q25oCB6aG5IC0g5Y2V5LiA6IOM5pmv57uT5p6EXG4gICAgICAgICAgICAvLyDnu5PmnoQ6IFJvb21TdGF0dXNJdGVtID4gW0JnLCBUaXRsZUxhYmVsLCBEZXNjTGFiZWxdXG4gICAgICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g54q25oCB5qCP5bC65a+477yI55So5oi35oyH5a6a77yJXG4gICAgICAgICAgICB2YXIgc3RhdHVzQmFySGVpZ2h0ID0gNzI7ICAgICAgLy8g54q25oCB5qCP5oC76auY5bqmXG4gICAgICAgICAgICB2YXIgaXRlbVdpZHRoID0gMTgwOyAgICAgICAgICAgLy8g5q+P5Liq54q25oCB6aG55a695bqmXG4gICAgICAgICAgICB2YXIgaXRlbUhlaWdodCA9IDU0OyAgICAgICAgICAgLy8g5q+P5Liq54q25oCB6aG56auY5bqmXG4gICAgICAgICAgICB2YXIgaXRlbUdhcCA9IDEyOyAgICAgICAgICAgICAgLy8g6Ze06LedXG4gICAgICAgICAgICB2YXIgbGVmdFJpZ2h0TWFyZ2luID0gMjQ7ICAgICAgLy8g5bem5Y+z55WZ55m9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOiDjOaZr+WwuuWvuCAtIOaWh+Wtl+ahhuWuveW6puWPqumAgumFjeaWh+Wtl+WGheWuuSvpgILlvZPlhoXovrnot51cbiAgICAgICAgICAgIC8vIFwi5oql5ZCN5oiq5q2iIEhIOk1NXCIg57qmMTLkuKrlrZfnrKYoMTZweOWtl+S9kynnuqY5NnB477yM5Yqg5LiK5bem5Y+z5YaF6L656LedXG4gICAgICAgICAgICB2YXIgYmdXaWR0aCA9IDE2MDsgICAgICAgICAgICAgICAgICAgLy8g5a695bqmOiAxNjBweO+8jOmAgumFjeaWh+Wtl+aYvuekulxuICAgICAgICAgICAgdmFyIGJnSGVpZ2h0ID0gNzI7ICAgICAgICAgICAgICAgICAgIC8vIOmrmOW6pjogNzLvvIjkuKTooYzmloflrZfpnIDopoHmm7Tpq5jvvIlcbiAgICAgICAgICAgIHZhciBiZ1JhZGl1cyA9IDU7ICAgICAgICAgICAgICAgICAgICAvLyDlnIbop5I6IDVcbiAgICAgICAgICAgIHZhciBiZ0NvbG9yID0gY2MuY29sb3IoMjU1LCAxODAsIDEwMCwgMTQwKTsgIC8vIOminOiJsjog5reh5qmY6ImyLCDmm7TpgI/mmI4oYWxwaGE9MTQwKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDliJvlu7rnirbmgIHpobnlrrnlmajvvIhSb29tU3RhdHVzSXRlbe+8iVxuICAgICAgICAgICAgdmFyIHJvb21TdGF0dXNJdGVtID0gbmV3IGNjLk5vZGUoXCJSb29tU3RhdHVzSXRlbV9cIiArIGNvbmZpZy5pZCk7XG4gICAgICAgICAgICByb29tU3RhdHVzSXRlbS5zZXRDb250ZW50U2l6ZShjYy5zaXplKGJ0bk5vZGUud2lkdGgsIGJnSGVpZ2h0KSk7XG4gICAgICAgICAgICByb29tU3RhdHVzSXRlbS5hbmNob3JYID0gMC41O1xuICAgICAgICAgICAgcm9vbVN0YXR1c0l0ZW0uYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5L2N572u77ya55u45a+55LqO5oi/6Ze05Y2h54mH5bGF5Lit5a+56b2Q77yM5pi+56S65Zyo5Y2h54mH6aG26YOoXG4gICAgICAgICAgICByb29tU3RhdHVzSXRlbS54ID0gYnRuTm9kZS54OyAgLy8g5rC05bmz5bGF5LitXG4gICAgICAgICAgICByb29tU3RhdHVzSXRlbS55ID0gYnRuTm9kZS55ICsgYnRuTm9kZS5oZWlnaHQgLyAyIC0gYmdIZWlnaHQgLyAyICsgMTA7ICAvLyDlnoLnm7TkvY3nva7vvJrljaHniYfpobbpg6hcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5a2Y5YKo6YWN572u5byV55SoXG4gICAgICAgICAgICByb29tU3RhdHVzSXRlbS5yb29tQ29uZmlnID0gY29uZmlnO1xuICAgICAgICAgICAgcm9vbVN0YXR1c0l0ZW0uY2FyZE5vZGUgPSBidG5Ob2RlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyA9PT09PT09PT09IDEuIOe7mOWItuWUr+S4gOiDjOaZr++8iEJn77yJPT09PT09PT09PVxuICAgICAgICAgICAgLy8g5Yig6Zmk5LqGOiBPdXRlckJnLCBJbm5lckJnLCBDYXBzdWxlQmcgLSDlj6rkv53nlZnkuIDkuKpCZ1xuICAgICAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmdcIik7XG4gICAgICAgICAgICB2YXIgYmdHcmFwaGljcyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICAgICAgYmdHcmFwaGljcy5maWxsQ29sb3IgPSBiZ0NvbG9yO1xuICAgICAgICAgICAgYmdHcmFwaGljcy5yb3VuZFJlY3QoLWJnV2lkdGgvMiwgLWJnSGVpZ2h0LzIsIGJnV2lkdGgsIGJnSGVpZ2h0LCBiZ1JhZGl1cyk7XG4gICAgICAgICAgICBiZ0dyYXBoaWNzLmZpbGwoKTtcbiAgICAgICAgICAgIGJnTm9kZS5wYXJlbnQgPSByb29tU3RhdHVzSXRlbTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gPT09PT09PT09PSAyLiDnrKzkuIDooYzmloflrZfvvJrmnJ/lj7fvvIhQZXJpb2RMYWJlbO+8iT09PT09PT09PT1cbiAgICAgICAgICAgIHZhciBwZXJpb2RMYWJlbCA9IG5ldyBjYy5Ob2RlKFwiUGVyaW9kTGFiZWxcIik7XG4gICAgICAgICAgICB2YXIgcGVyaW9kTGFiZWxDb21wID0gcGVyaW9kTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgICAgIHBlcmlvZExhYmVsQ29tcC5zdHJpbmcgPSBcIuacn+WPtzogLS1cIjtcbiAgICAgICAgICAgIHBlcmlvZExhYmVsQ29tcC5mb250U2l6ZSA9IDE2O1xuICAgICAgICAgICAgcGVyaW9kTGFiZWxDb21wLmxpbmVIZWlnaHQgPSAyMDtcbiAgICAgICAgICAgIHBlcmlvZExhYmVsQ29tcC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICAgICAgcGVyaW9kTGFiZWxDb21wLnZlcnRpY2FsQWxpZ24gPSBjYy5MYWJlbC5WZXJ0aWNhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgICAgIHBlcmlvZExhYmVsQ29tcC5lbmFibGVCb2xkID0gdHJ1ZTsgIC8vIOWKoOeyl1xuICAgICAgICAgICAgcGVyaW9kTGFiZWwuY29sb3IgPSBjYy5jb2xvcigyNTUsIDI1NSwgMjU1KTsgIC8vIOeZveiJslxuICAgICAgICAgICAgcGVyaW9kTGFiZWwuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgICAgIHBlcmlvZExhYmVsLmFuY2hvclkgPSAwLjU7XG4gICAgICAgICAgICBwZXJpb2RMYWJlbC55ID0gMTQ7ICAvLyDkuIrmlrnkvY3nva7vvIjlop7liqDpl7Tot53vvIlcbiAgICAgICAgICAgIHBlcmlvZExhYmVsLnBhcmVudCA9IHJvb21TdGF0dXNJdGVtO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmj4/ovrk6ICM4QTQyMDAsIOWuveW6pjJcbiAgICAgICAgICAgIHZhciBwZXJpb2RPdXRsaW5lID0gcGVyaW9kTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSk7XG4gICAgICAgICAgICBwZXJpb2RPdXRsaW5lLmNvbG9yID0gY2MuY29sb3IoMTM4LCA2NiwgMCk7ICAvLyAjOEE0MjAwXG4gICAgICAgICAgICBwZXJpb2RPdXRsaW5lLndpZHRoID0gMjtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gPT09PT09PT09PSAzLiDnrKzkuozooYzmloflrZfvvJrmiqXlkI3miKrmraLml7bpl7TvvIhUaXRsZUxhYmVs77yJPT09PT09PT09PVxuICAgICAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSBuZXcgY2MuTm9kZShcIlRpdGxlTGFiZWxcIik7XG4gICAgICAgICAgICB2YXIgdGl0bGVMYWJlbENvbXAgPSB0aXRsZUxhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgICAgICB0aXRsZUxhYmVsQ29tcC5zdHJpbmcgPSBcIuaaguacquW8gOaUvlwiO1xuICAgICAgICAgICAgdGl0bGVMYWJlbENvbXAuZm9udFNpemUgPSAxNjtcbiAgICAgICAgICAgIHRpdGxlTGFiZWxDb21wLmxpbmVIZWlnaHQgPSAyMDtcbiAgICAgICAgICAgIHRpdGxlTGFiZWxDb21wLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgICAgICB0aXRsZUxhYmVsQ29tcC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVI7XG4gICAgICAgICAgICB0aXRsZUxhYmVsQ29tcC5lbmFibGVCb2xkID0gdHJ1ZTsgIC8vIOWKoOeyl1xuICAgICAgICAgICAgdGl0bGVMYWJlbC5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjU1LCAyNTUpOyAgLy8g55m96ImyXG4gICAgICAgICAgICB0aXRsZUxhYmVsLmFuY2hvclggPSAwLjU7XG4gICAgICAgICAgICB0aXRsZUxhYmVsLmFuY2hvclkgPSAwLjU7XG4gICAgICAgICAgICB0aXRsZUxhYmVsLnkgPSAtMTQ7ICAvLyDkuIvmlrnkvY3nva7vvIjlop7liqDpl7Tot53vvIlcbiAgICAgICAgICAgIHRpdGxlTGFiZWwucGFyZW50ID0gcm9vbVN0YXR1c0l0ZW07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOaPj+i+uTogIzhBNDIwMCwg5a695bqmMlxuICAgICAgICAgICAgdmFyIHRpdGxlT3V0bGluZSA9IHRpdGxlTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSk7XG4gICAgICAgICAgICB0aXRsZU91dGxpbmUuY29sb3IgPSBjYy5jb2xvcigxMzgsIDY2LCAwKTsgIC8vICM4QTQyMDBcbiAgICAgICAgICAgIHRpdGxlT3V0bGluZS53aWR0aCA9IDI7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJvb21TdGF0dXNJdGVtLnBhcmVudCA9IGNvdW50ZG93bkNvbnRhaW5lcjtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgICAgICAvLyDliJvlu7rmiqXlkI3mjInpkq5cbiAgICAgICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAgICAgdmFyIHNpZ251cEJ0biA9IG5ldyBjYy5Ob2RlKFwiU2lnbnVwQnRuX1wiICsgY29uZmlnLmlkKTtcblxuICAgICAgICAgICAgLy8g5re75YqgIFNwcml0ZSDnu4Tku7bnlKjkuo7mmL7npLrmjInpkq7lm77niYdcbiAgICAgICAgICAgIHZhciBzcHJpdGUgPSBzaWdudXBCdG4uYWRkQ29tcG9uZW50KGNjLlNwcml0ZSk7XG4gICAgICAgICAgICBzcHJpdGUudHlwZSA9IGNjLlNwcml0ZS5UeXBlLlNJTVBMRTtcbiAgICAgICAgICAgIHNwcml0ZS5zaXplTW9kZSA9IGNjLlNwcml0ZS5TaXplTW9kZS5DVVNUT007XG5cbiAgICAgICAgICAgIC8vIOaMiemSruWwuuWvuO+8mjE2MHg2NVxuICAgICAgICAgICAgdmFyIGZpeGVkV2lkdGggPSAxNjA7ICAgLy8g5a695bqmXG4gICAgICAgICAgICB2YXIgZml4ZWRIZWlnaHQgPSA2NTsgICAvLyDpq5jluqZcbiAgICAgICAgICAgIHNpZ251cEJ0bi5zZXRDb250ZW50U2l6ZShjYy5zaXplKGZpeGVkV2lkdGgsIGZpeGVkSGVpZ2h0KSk7XG4gICAgICAgICAgICBzaWdudXBCdG4uYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgICAgIHNpZ251cEJ0bi5hbmNob3JZID0gMC41O1xuXG4gICAgICAgICAgICAvLyDkvY3nva7vvJrmjInpkq7lnKjljaHniYflupXpg6jvvIzlkJHkuIvnp7vliqhcbiAgICAgICAgICAgIHNpZ251cEJ0bi54ID0gYnRuTm9kZS54O1xuICAgICAgICAgICAgc2lnbnVwQnRuLnkgPSBidG5Ob2RlLnkgLSBidG5Ob2RlLmhlaWdodCAvIDIgKyBmaXhlZEhlaWdodCAvIDIgLSAxMDsgIC8vIOWQkeS4i+enu+WKqDEwcHhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5a2Y5YKo6YWN572u5L+h5oGv5ZKM5Y2h54mH6IqC54K55byV55SoXG4gICAgICAgICAgICBzaWdudXBCdG4ucm9vbUNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgICAgIHNpZ251cEJ0bi5yb29tSWQgPSBjb25maWcuaWQ7XG4gICAgICAgICAgICBzaWdudXBCdG4uY2FyZE5vZGUgPSBidG5Ob2RlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmt7vliqDmjInpkq7nu4Tku7ZcbiAgICAgICAgICAgIHZhciBidXR0b24gPSBzaWdudXBCdG4uYWRkQ29tcG9uZW50KGNjLkJ1dHRvbik7XG4gICAgICAgICAgICBidXR0b24udHJhbnNpdGlvbiA9IGNjLkJ1dHRvbi5UcmFuc2l0aW9uLlNDQUxFO1xuICAgICAgICAgICAgYnV0dG9uLmR1cmF0aW9uID0gMC4xO1xuICAgICAgICAgICAgYnV0dG9uLnpvb21TY2FsZSA9IDEuMDg7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOeCueWHu+S6i+S7tlxuICAgICAgICAgICAgKGZ1bmN0aW9uKGNvbmZpZywgY2FyZE5vZGUsIHNpZ251cEJ0bk5vZGUpIHtcbiAgICAgICAgICAgICAgICBzaWdudXBCdG5Ob2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX29uQXJlbmFTaWdudXBCdXR0b25DbGljayhjb25maWcsIGNhcmROb2RlLCBzaWdudXBCdG5Ob2RlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pKGNvbmZpZywgYnRuTm9kZSwgc2lnbnVwQnRuKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2lnbnVwQnRuLnBhcmVudCA9IGJ1dHRvbkNvbnRhaW5lcjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5omp5bGV5a655Zmo6auY5bqm5Lul5a6557qz5oyJ6ZKuXG4gICAgICAgIHZhciBvcmlnaW5hbEhlaWdodCA9IGNhcmRQYW5lbC5oZWlnaHQ7XG4gICAgICAgIGNhcmRQYW5lbC5zZXRDb250ZW50U2l6ZShjYXJkUGFuZWwud2lkdGgsIG9yaWdpbmFsSGVpZ2h0ICsgNzApO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yqg6L295oyJ6ZKu5Zu+54mH5bm25pu05paw54q25oCBXG4gICAgICAgIHRoaXMuX2xvYWRTaWdudXBCdXR0b25JbWFnZXMoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWQr+WKqOWAkuiuoeaXtuabtOaWsOWumuaXtuWZqFxuICAgICAgICB0aGlzLl9zdGFydENvdW50ZG93blRpbWVyKCk7XG4gICAgfSxcbiAgICBcbiAgICAvLyDliqDovb3miqXlkI3mjInpkq7lm77niYfotYTmupBcbiAgICBfbG9hZFNpZ251cEJ1dHRvbkltYWdlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIC8vIOmihOWKoOi9veS4ieW8oOaMiemSruWbvueJh1xuICAgICAgICB2YXIgaW1hZ2VQYXRocyA9IFtcbiAgICAgICAgICAgICdVSS9idXR0b24vYnRuX2Jhb21pbmcnLFxuICAgICAgICAgICAgJ1VJL2J1dHRvbi9idG5fcXV4aWFvYmFvbWluZycsIFxuICAgICAgICAgICAgJ1VJL2J1dHRvbi9idG5fbm9fYmFvbWluZydcbiAgICAgICAgXTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuX3NpZ251cEJ0bkZyYW1lcyA9IHt9O1xuICAgICAgICB2YXIgbG9hZGVkQ291bnQgPSAwO1xuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbWFnZVBhdGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChpbWFnZVBhdGhzW2luZGV4XSwgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVyciwgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFlcnIgJiYgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBpbWFnZVBhdGhzW2luZGV4XS5zcGxpdCgnLycpLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2lnbnVwQnRuRnJhbWVzW2tleV0gPSBzcHJpdGVGcmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBsb2FkZWRDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAvLyDmiYDmnInlm77niYfliqDovb3lrozmiJDlkI7mm7TmlrDmjInpkq7nirbmgIFcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRlZENvdW50ID09PSBpbWFnZVBhdGhzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fdXBkYXRlQXJlbmFTaWdudXBTdGF0dXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkoaSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vIOajgOafpeW9k+WJjeaYr+WQpuWcqOW8gOi1m+aXtumXtOauteWGhVxuICAgIF9pc0luTWF0Y2hUaW1lOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyIG1hdGNoVGltZVJhbmdlcyA9IGNvbmZpZy5tYXRjaF90aW1lX3JhbmdlcyB8fCBjb25maWcubWF0Y2hUaW1lUmFuZ2VzO1xuICAgICAgICBpZiAoIW1hdGNoVGltZVJhbmdlcykgcmV0dXJuIHRydWU7IC8vIOayoeaciemFjee9ruaXtumXtOaute+8jOm7mOiupOW8gOaUvlxuXG4gICAgICAgIC8vIOino+aekOaXtumXtOautSBKU09OXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgcmFuZ2VzID0gdHlwZW9mIG1hdGNoVGltZVJhbmdlcyA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKG1hdGNoVGltZVJhbmdlcykgOiBtYXRjaFRpbWVSYW5nZXM7XG4gICAgICAgICAgICBpZiAoIXJhbmdlcyB8fCByYW5nZXMubGVuZ3RoID09PSAwKSByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICB2YXIgY3VycmVudE1pbnV0ZXMgPSBub3cuZ2V0SG91cnMoKSAqIDYwICsgbm93LmdldE1pbnV0ZXMoKTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcmFuZ2UgPSByYW5nZXNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0UGFydHMgPSByYW5nZS5zdGFydC5zcGxpdCgnOicpO1xuICAgICAgICAgICAgICAgIHZhciBlbmRQYXJ0cyA9IHJhbmdlLmVuZC5zcGxpdCgnOicpO1xuICAgICAgICAgICAgICAgIHZhciBzdGFydE1pbnV0ZXMgPSBwYXJzZUludChzdGFydFBhcnRzWzBdKSAqIDYwICsgcGFyc2VJbnQoc3RhcnRQYXJ0c1sxXSk7XG4gICAgICAgICAgICAgICAgdmFyIGVuZE1pbnV0ZXMgPSBwYXJzZUludChlbmRQYXJ0c1swXSkgKiA2MCArIHBhcnNlSW50KGVuZFBhcnRzWzFdKTtcblxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50TWludXRlcyA+PSBzdGFydE1pbnV0ZXMgJiYgY3VycmVudE1pbnV0ZXMgPD0gZW5kTWludXRlcykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn5WQIFtfaXNJbk1hdGNoVGltZV0gcGFyc2UgZXJyb3I6XCIsIGUpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7IC8vIOino+aekOWksei0pe+8jOm7mOiupOW8gOaUvlxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDlvIDotZvml7bpl7TorqHnrpfnm7jlhbPlh73mlbBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICAvLyDmo4Dmn6Xnq57mioDlnLrmmK/lkKblj6/ku6XmiqXlkI3vvIjlv4XpobvmnInlvIDotZvml7bpl7TkuJTmnInmr4/lnLrml7bplb/vvIlcbiAgICBfY2FuU2lnbnVwQXJlbmE6IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgICAgICB2YXIgbWF0Y2hUaW1lUmFuZ2VzID0gY29uZmlnLm1hdGNoX3RpbWVfcmFuZ2VzIHx8IGNvbmZpZy5tYXRjaFRpbWVSYW5nZXM7XG4gICAgICAgIHZhciBtYXRjaER1cmF0aW9uID0gY29uZmlnLm1hdGNoX2R1cmF0aW9uIHx8IGNvbmZpZy5tYXRjaER1cmF0aW9uIHx8IGNvbmZpZy5pbnRlcnZhbF9taW51dGVzIHx8IGNvbmZpZy5pbnRlcnZhbE1pbnV0ZXM7XG5cbiAgICAgICAgLy8g5b+F6aG75ZCM5pe25pyJ5byA6LWb5pe26Ze05ZKM5q+P5Zy65pe26ZW/5omN6IO95oql5ZCNXG4gICAgICAgIGlmICghbWF0Y2hUaW1lUmFuZ2VzIHx8ICFtYXRjaER1cmF0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmo4Dmn6XmmK/lkKblnKjlvIDotZvml7bpl7TmrrXlhoVcbiAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuX2lzSW5NYXRjaFRpbWUoY29uZmlnKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuXG4gICAgLy8g6K6h566X5LiL5LiA5Liq5oql5ZCN5oiq5q2i5pe26Ze0XG4gICAgLy8g6L+U5Zue5qC85byPOiBcIkhIOk1NXCIg5oiWIG51bGzvvIjlpoLmnpzkuI3lnKjlvIDotZvml7bpl7TmrrXlhoXvvIlcbiAgICBfZ2V0TmV4dFNpZ251cERlYWRsaW5lOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyIG1hdGNoVGltZVJhbmdlcyA9IGNvbmZpZy5tYXRjaF90aW1lX3JhbmdlcyB8fCBjb25maWcubWF0Y2hUaW1lUmFuZ2VzO1xuICAgICAgICB2YXIgbWF0Y2hEdXJhdGlvbiA9IGNvbmZpZy5tYXRjaF9kdXJhdGlvbiB8fCBjb25maWcubWF0Y2hEdXJhdGlvbiB8fCBjb25maWcuaW50ZXJ2YWxfbWludXRlcyB8fCBjb25maWcuaW50ZXJ2YWxNaW51dGVzO1xuXG4gICAgICAgIC8vIOW/hemhu+aciemFjee9rlxuICAgICAgICBpZiAoIW1hdGNoVGltZVJhbmdlcyB8fCAhbWF0Y2hEdXJhdGlvbikgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm5Zyo5byA6LWb5pe26Ze05q615YaFXG4gICAgICAgIGlmICghdGhpcy5faXNJbk1hdGNoVGltZShjb25maWcpKSByZXR1cm4gbnVsbDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHJhbmdlcyA9IHR5cGVvZiBtYXRjaFRpbWVSYW5nZXMgPT09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShtYXRjaFRpbWVSYW5nZXMpIDogbWF0Y2hUaW1lUmFuZ2VzO1xuICAgICAgICAgICAgaWYgKCFyYW5nZXMgfHwgcmFuZ2VzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRNaW51dGVzID0gbm93LmdldEhvdXJzKCkgKiA2MCArIG5vdy5nZXRNaW51dGVzKCk7XG5cbiAgICAgICAgICAgIC8vIOaJvuWIsOW9k+WJjeaJgOWcqOeahOaXtumXtOautVxuICAgICAgICAgICAgdmFyIGN1cnJlbnRSYW5nZSA9IG51bGw7XG4gICAgICAgICAgICB2YXIgcmFuZ2VTdGFydE1pbnV0ZXMgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcmFuZ2UgPSByYW5nZXNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0UGFydHMgPSByYW5nZS5zdGFydC5zcGxpdCgnOicpO1xuICAgICAgICAgICAgICAgIHZhciBlbmRQYXJ0cyA9IHJhbmdlLmVuZC5zcGxpdCgnOicpO1xuICAgICAgICAgICAgICAgIHZhciBzdGFydE1pbiA9IHBhcnNlSW50KHN0YXJ0UGFydHNbMF0pICogNjAgKyBwYXJzZUludChzdGFydFBhcnRzWzFdKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kTWluID0gcGFyc2VJbnQoZW5kUGFydHNbMF0pICogNjAgKyBwYXJzZUludChlbmRQYXJ0c1sxXSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudE1pbnV0ZXMgPj0gc3RhcnRNaW4gJiYgY3VycmVudE1pbnV0ZXMgPD0gZW5kTWluKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRSYW5nZSA9IHJhbmdlO1xuICAgICAgICAgICAgICAgICAgICByYW5nZVN0YXJ0TWludXRlcyA9IHN0YXJ0TWluO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghY3VycmVudFJhbmdlKSByZXR1cm4gbnVsbDtcblxuICAgICAgICAgICAgLy8g6K6h566X5LiL5LiA5Zy65q+U6LWb5pe26Ze077yI5LuO5byA6LWb5pe26Ze05byA5aeL77yM5q+P6ZqUIG1hdGNoRHVyYXRpb24g5YiG6ZKf5LiA5Zy677yJXG4gICAgICAgICAgICAvLyDmiqXlkI3miKrmraLml7bpl7TmmK/mr5TotZvlvIDlp4vliY0x5YiG6ZKfXG4gICAgICAgICAgICB2YXIgbWludXRlc1NpbmNlU3RhcnQgPSBjdXJyZW50TWludXRlcyAtIHJhbmdlU3RhcnRNaW51dGVzO1xuICAgICAgICAgICAgdmFyIHJlbWFpbmRlciA9IG1pbnV0ZXNTaW5jZVN0YXJ0ICUgbWF0Y2hEdXJhdGlvbjtcblxuICAgICAgICAgICAgdmFyIG5leHRNYXRjaE1pbnV0ZXM7XG4gICAgICAgICAgICBpZiAocmVtYWluZGVyID49IG1hdGNoRHVyYXRpb24gLSAxKSB7XG4gICAgICAgICAgICAgICAgLy8g5b2T5YmN5Zyo5oql5ZCN5oiq5q2i5pe26Ze05YaF77yM5LiL5LiA5Zy65piv5LiL5LiA5Liq5pe26Ze054K5XG4gICAgICAgICAgICAgICAgbmV4dE1hdGNoTWludXRlcyA9IGN1cnJlbnRNaW51dGVzICsgKG1hdGNoRHVyYXRpb24gLSByZW1haW5kZXIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDlvZPliY3lj6/ku6XmiqXlkI3vvIzkuIvkuIDlnLrmmK/lvZPliY3ml7bpl7TngrnlkJHkuIrlj5bmlbRcbiAgICAgICAgICAgICAgICBuZXh0TWF0Y2hNaW51dGVzID0gcmFuZ2VTdGFydE1pbnV0ZXMgKyBNYXRoLmNlaWwobWludXRlc1NpbmNlU3RhcnQgLyBtYXRjaER1cmF0aW9uKSAqIG1hdGNoRHVyYXRpb247XG4gICAgICAgICAgICAgICAgaWYgKG5leHRNYXRjaE1pbnV0ZXMgPD0gY3VycmVudE1pbnV0ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dE1hdGNoTWludXRlcyArPSBtYXRjaER1cmF0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5oql5ZCN5oiq5q2i5pe26Ze05piv5q+U6LWb5byA5aeL5YmNMeWIhumSn1xuICAgICAgICAgICAgdmFyIGRlYWRsaW5lTWludXRlcyA9IG5leHRNYXRjaE1pbnV0ZXMgLSAxO1xuXG4gICAgICAgICAgICAvLyDmoLzlvI/ljJbml7bpl7RcbiAgICAgICAgICAgIHZhciBob3VycyA9IE1hdGguZmxvb3IoZGVhZGxpbmVNaW51dGVzIC8gNjApICUgMjQ7XG4gICAgICAgICAgICB2YXIgbWlucyA9IGRlYWRsaW5lTWludXRlcyAlIDYwO1xuICAgICAgICAgICAgdmFyIHRpbWVTdHIgPSAoaG91cnMgPCAxMCA/ICcwJyA6ICcnKSArIGhvdXJzICsgJzonICsgKG1pbnMgPCAxMCA/ICcwJyA6ICcnKSArIG1pbnM7XG4gICAgICAgICAgICByZXR1cm4gdGltZVN0cjtcblxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi4o+wIFtfZ2V0TmV4dFNpZ251cERlYWRsaW5lXSBlcnJvcjpcIiwgZSk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLy8g6K6h566X6Led56a75oql5ZCN5oiq5q2i55qE56eS5pWw77yI55So5LqO5YCS6K6h5pe25pi+56S677yJXG4gICAgLy8g6L+U5ZueOiDnp5LmlbDvvIwtMeihqOekuuS4jeWPr+aKpeWQjVxuICAgIF9nZXRTaWdudXBDb3VudGRvd25TZWNvbmRzOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyIG1hdGNoVGltZVJhbmdlcyA9IGNvbmZpZy5tYXRjaF90aW1lX3JhbmdlcyB8fCBjb25maWcubWF0Y2hUaW1lUmFuZ2VzO1xuICAgICAgICB2YXIgbWF0Y2hEdXJhdGlvbiA9IGNvbmZpZy5tYXRjaF9kdXJhdGlvbiB8fCBjb25maWcubWF0Y2hEdXJhdGlvbiB8fCBjb25maWcuaW50ZXJ2YWxfbWludXRlcyB8fCBjb25maWcuaW50ZXJ2YWxNaW51dGVzO1xuXG4gICAgICAgIGlmICghbWF0Y2hUaW1lUmFuZ2VzIHx8ICFtYXRjaER1cmF0aW9uKSByZXR1cm4gLTE7XG4gICAgICAgIGlmICghdGhpcy5faXNJbk1hdGNoVGltZShjb25maWcpKSByZXR1cm4gLTE7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciByYW5nZXMgPSB0eXBlb2YgbWF0Y2hUaW1lUmFuZ2VzID09PSAnc3RyaW5nJyA/IEpTT04ucGFyc2UobWF0Y2hUaW1lUmFuZ2VzKSA6IG1hdGNoVGltZVJhbmdlcztcbiAgICAgICAgICAgIGlmICghcmFuZ2VzIHx8IHJhbmdlcy5sZW5ndGggPT09IDApIHJldHVybiAtMTtcblxuICAgICAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICB2YXIgY3VycmVudE1pbnV0ZXMgPSBub3cuZ2V0SG91cnMoKSAqIDYwICsgbm93LmdldE1pbnV0ZXMoKTtcbiAgICAgICAgICAgIHZhciBjdXJyZW50U2Vjb25kcyA9IG5vdy5nZXRTZWNvbmRzKCk7XG4gICAgICAgICAgICB2YXIgY3VycmVudFRvdGFsU2Vjb25kcyA9IGN1cnJlbnRNaW51dGVzICogNjAgKyBjdXJyZW50U2Vjb25kcztcblxuICAgICAgICAgICAgLy8g5om+5Yiw5b2T5YmN5omA5Zyo55qE5pe26Ze05q61XG4gICAgICAgICAgICB2YXIgY3VycmVudFJhbmdlID0gbnVsbDtcbiAgICAgICAgICAgIHZhciByYW5nZVN0YXJ0TWludXRlcyA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciByYW5nZSA9IHJhbmdlc1tpXTtcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnRQYXJ0cyA9IHJhbmdlLnN0YXJ0LnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICAgICAgdmFyIGVuZFBhcnRzID0gcmFuZ2UuZW5kLnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0TWluID0gcGFyc2VJbnQoc3RhcnRQYXJ0c1swXSkgKiA2MCArIHBhcnNlSW50KHN0YXJ0UGFydHNbMV0pO1xuICAgICAgICAgICAgICAgIHZhciBlbmRNaW4gPSBwYXJzZUludChlbmRQYXJ0c1swXSkgKiA2MCArIHBhcnNlSW50KGVuZFBhcnRzWzFdKTtcblxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50TWludXRlcyA+PSBzdGFydE1pbiAmJiBjdXJyZW50TWludXRlcyA8PSBlbmRNaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFJhbmdlID0gcmFuZ2U7XG4gICAgICAgICAgICAgICAgICAgIHJhbmdlU3RhcnRNaW51dGVzID0gc3RhcnRNaW47XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFjdXJyZW50UmFuZ2UpIHJldHVybiAtMTtcblxuICAgICAgICAgICAgLy8g6K6h566X5LiL5LiA5Zy65q+U6LWb5pe26Ze0XG4gICAgICAgICAgICB2YXIgcmFuZ2VTdGFydFNlY29uZHMgPSByYW5nZVN0YXJ0TWludXRlcyAqIDYwO1xuICAgICAgICAgICAgdmFyIG1hdGNoRHVyYXRpb25TZWNvbmRzID0gbWF0Y2hEdXJhdGlvbiAqIDYwO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRUb3RhbFNlY29uZHMgPSBjdXJyZW50TWludXRlcyAqIDYwICsgY3VycmVudFNlY29uZHM7XG5cbiAgICAgICAgICAgIC8vIOiuoeeul+S7juW8gOi1m+aXtumXtOWIsOeOsOWcqOe7j+i/h+eahOenkuaVsFxuICAgICAgICAgICAgdmFyIGVsYXBzZWRTZWNvbmRzID0gY3VycmVudFRvdGFsU2Vjb25kcyAtIHJhbmdlU3RhcnRTZWNvbmRzO1xuICAgICAgICAgICAgdmFyIHJlbWFpbmRlciA9IGVsYXBzZWRTZWNvbmRzICUgbWF0Y2hEdXJhdGlvblNlY29uZHM7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWAkuiuoeaXtiA9IOacrOacn+WJqeS9meaXtumXtO+8iOS4juacjeWKoeerr+S4gOiHtO+8jOS4jeWHjzYw56eS77yJXG4gICAgICAgICAgICB2YXIgY291bnRkb3duID0gbWF0Y2hEdXJhdGlvblNlY29uZHMgLSByZW1haW5kZXI7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOi/lOWbnuWAkuiuoeaXtlxuICAgICAgICAgICAgcmV0dXJuIGNvdW50ZG93bjtcblxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi4o+wIFtfZ2V0U2lnbnVwQ291bnRkb3duU2Vjb25kc10gZXJyb3I6XCIsIGUpO1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyDojrflj5bmnIDov5HnmoQgdXBjb21pbmcg5byA6LWb5pe26Ze05q6177yI55So5LqO5pi+56S677yJXG4gICAgX2dldE5lYXJlc3RNYXRjaFRpbWVSYW5nZTogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIHZhciBtYXRjaFRpbWVSYW5nZXMgPSBjb25maWcubWF0Y2hfdGltZV9yYW5nZXMgfHwgY29uZmlnLm1hdGNoVGltZVJhbmdlcztcbiAgICAgICAgXG4gICAgICAgIC8vIOayoeaciemFjee9ruaXtumXtOaute+8jOi/lOWbnm51bGzooajnpLrlhajlpKnlvIDmlL5cbiAgICAgICAgaWYgKCFtYXRjaFRpbWVSYW5nZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHJhbmdlcyA9IHR5cGVvZiBtYXRjaFRpbWVSYW5nZXMgPT09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShtYXRjaFRpbWVSYW5nZXMpIDogbWF0Y2hUaW1lUmFuZ2VzO1xuICAgICAgICAgICAgaWYgKCFyYW5nZXMgfHwgcmFuZ2VzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRNaW51dGVzID0gbm93LmdldEhvdXJzKCkgKiA2MCArIG5vdy5nZXRNaW51dGVzKCk7XG4gICAgICAgICAgICB2YXIgY3VycmVudFNlY29uZHMgPSBub3cuZ2V0U2Vjb25kcygpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDop6PmnpDmiYDmnInml7bpl7TmrrVcbiAgICAgICAgICAgIHZhciBwYXJzZWRSYW5nZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJhbmdlID0gcmFuZ2VzW2ldO1xuICAgICAgICAgICAgICAgIHZhciBzdGFydFBhcnRzID0gcmFuZ2Uuc3RhcnQuc3BsaXQoJzonKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kUGFydHMgPSByYW5nZS5lbmQuc3BsaXQoJzonKTtcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnRNaW51dGVzID0gcGFyc2VJbnQoc3RhcnRQYXJ0c1swXSkgKiA2MCArIHBhcnNlSW50KHN0YXJ0UGFydHNbMV0pO1xuICAgICAgICAgICAgICAgIHZhciBlbmRNaW51dGVzID0gcGFyc2VJbnQoZW5kUGFydHNbMF0pICogNjAgKyBwYXJzZUludChlbmRQYXJ0c1sxXSk7XG4gICAgICAgICAgICAgICAgcGFyc2VkUmFuZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBzdGFydDogcmFuZ2Uuc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgIGVuZDogcmFuZ2UuZW5kLFxuICAgICAgICAgICAgICAgICAgICBzdGFydE1pbnV0ZXM6IHN0YXJ0TWludXRlcyxcbiAgICAgICAgICAgICAgICAgICAgZW5kTWludXRlczogZW5kTWludXRlc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmo4Dmn6XlvZPliY3mmK/lkKblnKjmn5DkuKrml7bpl7TmrrXlhoVcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFyc2VkUmFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHIgPSBwYXJzZWRSYW5nZXNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRNaW51dGVzID49IHIuc3RhcnRNaW51dGVzICYmIGN1cnJlbnRNaW51dGVzIDw9IHIuZW5kTWludXRlcykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5SYW5nZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlOiByXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDkuI3lnKjku7vkvZXml7bpl7TmrrXlhoXvvIzmib7mnIDov5HnmoTkuIvkuIDkuKrml7bpl7TmrrVcbiAgICAgICAgICAgIHZhciBuZWFyZXN0UmFuZ2UgPSBudWxsO1xuICAgICAgICAgICAgdmFyIG1pbkRpZmYgPSBJbmZpbml0eTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJzZWRSYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgciA9IHBhcnNlZFJhbmdlc1tpXTtcbiAgICAgICAgICAgICAgICAvLyDorqHnrpfot53nprvov5nkuKrml7bpl7TmrrXlvIDlp4vnmoTliIbpkp/mlbBcbiAgICAgICAgICAgICAgICB2YXIgZGlmZjtcbiAgICAgICAgICAgICAgICBpZiAoci5zdGFydE1pbnV0ZXMgPiBjdXJyZW50TWludXRlcykge1xuICAgICAgICAgICAgICAgICAgICAvLyDku4rlpKnov5jmsqHliLBcbiAgICAgICAgICAgICAgICAgICAgZGlmZiA9IHIuc3RhcnRNaW51dGVzIC0gY3VycmVudE1pbnV0ZXM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g6ZyA6KaB562J5Yiw5piO5aSpXG4gICAgICAgICAgICAgICAgICAgIGRpZmYgPSAoMjQgKiA2MCAtIGN1cnJlbnRNaW51dGVzKSArIHIuc3RhcnRNaW51dGVzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoZGlmZiA8IG1pbkRpZmYpIHtcbiAgICAgICAgICAgICAgICAgICAgbWluRGlmZiA9IGRpZmY7XG4gICAgICAgICAgICAgICAgICAgIG5lYXJlc3RSYW5nZSA9IHI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGluUmFuZ2U6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHJhbmdlOiBuZWFyZXN0UmFuZ2UsXG4gICAgICAgICAgICAgICAgbWludXRlc1VudGlsU3RhcnQ6IG1pbkRpZmZcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyDorqHnrpfot53nprvkuIvkuIDlnLrlvIDotZvnmoTlgJLorqHml7bvvIjnp5LvvIlcbiAgICBfZ2V0TmV4dE1hdGNoQ291bnRkb3duOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyIG1hdGNoVGltZVJhbmdlcyA9IGNvbmZpZy5tYXRjaF90aW1lX3JhbmdlcyB8fCBjb25maWcubWF0Y2hUaW1lUmFuZ2VzO1xuICAgICAgICB2YXIgbWF0Y2hEdXJhdGlvbiA9IGNvbmZpZy5tYXRjaF9kdXJhdGlvbiB8fCBjb25maWcubWF0Y2hEdXJhdGlvbiB8fCBjb25maWcuaW50ZXJ2YWxfbWludXRlcyB8fCBjb25maWcuaW50ZXJ2YWxNaW51dGVzIHx8IDEwOyAvLyDpu5jorqQxMOWIhumSn1xuICAgICAgICBcbiAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgIHZhciBjdXJyZW50TWludXRlcyA9IG5vdy5nZXRIb3VycygpICogNjAgKyBub3cuZ2V0TWludXRlcygpO1xuICAgICAgICB2YXIgY3VycmVudFNlY29uZHMgPSBub3cuZ2V0U2Vjb25kcygpO1xuICAgICAgICB2YXIgY3VycmVudFRvdGFsU2Vjb25kcyA9IGN1cnJlbnRNaW51dGVzICogNjAgKyBjdXJyZW50U2Vjb25kcztcbiAgICAgICAgXG4gICAgICAgIC8vIOayoeaciemFjee9ruW8gOi1m+aXtumXtO+8jOavjyBtYXRjaER1cmF0aW9uIOWIhumSn+W8gOi1m+S4gOasoVxuICAgICAgICBpZiAoIW1hdGNoVGltZVJhbmdlcykge1xuICAgICAgICAgICAgLy8g6K6h566X6Led56a75LiL5LiA5LiqIG1hdGNoRHVyYXRpb24g5ZGo5pyf55qE56eS5pWwXG4gICAgICAgICAgICB2YXIgaW50ZXJ2YWxTZWNvbmRzID0gbWF0Y2hEdXJhdGlvbiAqIDYwO1xuICAgICAgICAgICAgdmFyIHNlY29uZHNJbkN5Y2xlID0gY3VycmVudFRvdGFsU2Vjb25kcyAlIGludGVydmFsU2Vjb25kcztcbiAgICAgICAgICAgIHZhciByZW1haW5pbmdTZWNvbmRzID0gaW50ZXJ2YWxTZWNvbmRzIC0gc2Vjb25kc0luQ3ljbGU7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaW5NYXRjaFRpbWU6IHRydWUsXG4gICAgICAgICAgICAgICAgc2Vjb25kczogcmVtYWluaW5nU2Vjb25kcyxcbiAgICAgICAgICAgICAgICBtYXRjaER1cmF0aW9uOiBtYXRjaER1cmF0aW9uXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmnInphY3nva7lvIDotZvml7bpl7RcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciByYW5nZXMgPSB0eXBlb2YgbWF0Y2hUaW1lUmFuZ2VzID09PSAnc3RyaW5nJyA/IEpTT04ucGFyc2UobWF0Y2hUaW1lUmFuZ2VzKSA6IG1hdGNoVGltZVJhbmdlcztcbiAgICAgICAgICAgIGlmICghcmFuZ2VzIHx8IHJhbmdlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyDop6PmnpDlpLHotKXvvIzkvb/nlKjpu5jorqTpgLvovpFcbiAgICAgICAgICAgICAgICB2YXIgaW50ZXJ2YWxTZWNvbmRzID0gbWF0Y2hEdXJhdGlvbiAqIDYwO1xuICAgICAgICAgICAgICAgIHZhciBzZWNvbmRzSW5DeWNsZSA9IGN1cnJlbnRUb3RhbFNlY29uZHMgJSBpbnRlcnZhbFNlY29uZHM7XG4gICAgICAgICAgICAgICAgdmFyIHJlbWFpbmluZ1NlY29uZHMgPSBpbnRlcnZhbFNlY29uZHMgLSBzZWNvbmRzSW5DeWNsZTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBpbk1hdGNoVGltZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kczogcmVtYWluaW5nU2Vjb25kcyxcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hEdXJhdGlvbjogbWF0Y2hEdXJhdGlvblxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOajgOafpeW9k+WJjeaYr+WQpuWcqOafkOS4quW8gOi1m+aXtumXtOauteWGhVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcmFuZ2UgPSByYW5nZXNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0UGFydHMgPSByYW5nZS5zdGFydC5zcGxpdCgnOicpO1xuICAgICAgICAgICAgICAgIHZhciBlbmRQYXJ0cyA9IHJhbmdlLmVuZC5zcGxpdCgnOicpO1xuICAgICAgICAgICAgICAgIHZhciBzdGFydE1pbnV0ZXMgPSBwYXJzZUludChzdGFydFBhcnRzWzBdKSAqIDYwICsgcGFyc2VJbnQoc3RhcnRQYXJ0c1sxXSk7XG4gICAgICAgICAgICAgICAgdmFyIGVuZE1pbnV0ZXMgPSBwYXJzZUludChlbmRQYXJ0c1swXSkgKiA2MCArIHBhcnNlSW50KGVuZFBhcnRzWzFdKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudE1pbnV0ZXMgPj0gc3RhcnRNaW51dGVzICYmIGN1cnJlbnRNaW51dGVzIDw9IGVuZE1pbnV0ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5Zyo5byA6LWb5pe26Ze05q615YaF77yM6K6h566X6Led56a75LiL5LiA5Zy655qE5YCS6K6h5pe2XG4gICAgICAgICAgICAgICAgICAgIHZhciByYW5nZVN0YXJ0U2Vjb25kcyA9IHN0YXJ0TWludXRlcyAqIDYwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZWxhcHNlZFNlY29uZHMgPSBjdXJyZW50VG90YWxTZWNvbmRzIC0gcmFuZ2VTdGFydFNlY29uZHM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbnRlcnZhbFNlY29uZHMgPSBtYXRjaER1cmF0aW9uICogNjA7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZW1haW5kZXIgPSBlbGFwc2VkU2Vjb25kcyAlIGludGVydmFsU2Vjb25kcztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlbWFpbmluZ1NlY29uZHMgPSBpbnRlcnZhbFNlY29uZHMgLSByZW1haW5kZXI7XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5NYXRjaFRpbWU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWNvbmRzOiByZW1haW5pbmdTZWNvbmRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hEdXJhdGlvbjogbWF0Y2hEdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRSYW5nZTogcmFuZ2VcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOS4jeWcqOS7u+S9leW8gOi1m+aXtumXtOauteWGhVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpbk1hdGNoVGltZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgc2Vjb25kczogMCxcbiAgICAgICAgICAgICAgICBtYXRjaER1cmF0aW9uOiBtYXRjaER1cmF0aW9uXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGluTWF0Y2hUaW1lOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBzZWNvbmRzOiAwLFxuICAgICAgICAgICAgICAgIG1hdGNoRHVyYXRpb246IG1hdGNoRHVyYXRpb25cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vIOagvOW8j+WMluWAkuiuoeaXtuaYvuekuu+8iOenkui9rOaNouS4uiBNTTpTUyDmoLzlvI/vvIlcbiAgICBfZm9ybWF0Q291bnRkb3duOiBmdW5jdGlvbih0b3RhbFNlY29uZHMpIHtcbiAgICAgICAgdmFyIG1pbnV0ZXMgPSBNYXRoLmZsb29yKHRvdGFsU2Vjb25kcyAvIDYwKTtcbiAgICAgICAgdmFyIHNlY29uZHMgPSBNYXRoLmZsb29yKHRvdGFsU2Vjb25kcyAlIDYwKTtcbiAgICAgICAgcmV0dXJuIChtaW51dGVzIDwgMTAgPyAnMCcgOiAnJykgKyBtaW51dGVzICsgJzonICsgKHNlY29uZHMgPCAxMCA/ICcwJyA6ICcnKSArIHNlY29uZHM7XG4gICAgfSxcbiAgICBcbiAgICAvLyDmoLzlvI/ljJblvIDotZvml7bpl7TmrrXmmL7npLpcbiAgICBfZm9ybWF0TWF0Y2hUaW1lUmFuZ2U6IGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgIGlmICghcmFuZ2UpIHJldHVybiAnJztcbiAgICAgICAgcmV0dXJuIHJhbmdlLnN0YXJ0ICsgJy0nICsgcmFuZ2UuZW5kO1xuICAgIH0sXG4gICAgXG4gICAgLy8g6I635Y+W5b2T5YmN5pyf5Y+3XG4gICAgLy8g5pyf5Y+35qC85byP77ya5qC55o2u5byA6LWb5pe26Ze05ZKM5q+P5Zy65pe26ZW/5Yqo5oCB55Sf5oiQXG4gICAgLy8g5q+P5Liq5oi/6Ze05pyJ54us56uL55qE5pyf5Y+35bqP5YiXXG4gICAgX2dldEN1cnJlbnRQZXJpb2RObzogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIHZhciBtYXRjaFRpbWVSYW5nZXMgPSBjb25maWcubWF0Y2hfdGltZV9yYW5nZXMgfHwgY29uZmlnLm1hdGNoVGltZVJhbmdlcztcbiAgICAgICAgdmFyIG1hdGNoRHVyYXRpb24gPSBjb25maWcubWF0Y2hfZHVyYXRpb24gfHwgY29uZmlnLm1hdGNoRHVyYXRpb24gfHwgY29uZmlnLmludGVydmFsX21pbnV0ZXMgfHwgY29uZmlnLmludGVydmFsTWludXRlcyB8fCA1O1xuXG4gICAgICAgIGlmICghbWF0Y2hUaW1lUmFuZ2VzIHx8ICFtYXRjaER1cmF0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgcmFuZ2VzID0gdHlwZW9mIG1hdGNoVGltZVJhbmdlcyA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKG1hdGNoVGltZVJhbmdlcykgOiBtYXRjaFRpbWVSYW5nZXM7XG4gICAgICAgICAgICBpZiAoIXJhbmdlcyB8fCByYW5nZXMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcblxuICAgICAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICB2YXIgY3VycmVudE1pbnV0ZXMgPSBub3cuZ2V0SG91cnMoKSAqIDYwICsgbm93LmdldE1pbnV0ZXMoKTtcbiAgICAgICAgICAgIHZhciBjdXJyZW50U2Vjb25kcyA9IG5vdy5nZXRTZWNvbmRzKCk7XG4gICAgICAgICAgICB2YXIgY3VycmVudFRvdGFsU2Vjb25kcyA9IGN1cnJlbnRNaW51dGVzICogNjAgKyBjdXJyZW50U2Vjb25kcztcblxuICAgICAgICAgICAgLy8g5om+5Yiw5b2T5YmN5omA5Zyo55qE5pe26Ze05q61XG4gICAgICAgICAgICB2YXIgY3VycmVudFJhbmdlID0gbnVsbDtcbiAgICAgICAgICAgIHZhciByYW5nZVN0YXJ0TWludXRlcyA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciByYW5nZSA9IHJhbmdlc1tpXTtcbiAgICAgICAgICAgICAgICB2YXIgc3RhcnRQYXJ0cyA9IHJhbmdlLnN0YXJ0LnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICAgICAgdmFyIGVuZFBhcnRzID0gcmFuZ2UuZW5kLnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0TWluID0gcGFyc2VJbnQoc3RhcnRQYXJ0c1swXSkgKiA2MCArIHBhcnNlSW50KHN0YXJ0UGFydHNbMV0pO1xuICAgICAgICAgICAgICAgIHZhciBlbmRNaW4gPSBwYXJzZUludChlbmRQYXJ0c1swXSkgKiA2MCArIHBhcnNlSW50KGVuZFBhcnRzWzFdKTtcblxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50TWludXRlcyA+PSBzdGFydE1pbiAmJiBjdXJyZW50TWludXRlcyA8PSBlbmRNaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFJhbmdlID0gcmFuZ2U7XG4gICAgICAgICAgICAgICAgICAgIHJhbmdlU3RhcnRNaW51dGVzID0gc3RhcnRNaW47XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFjdXJyZW50UmFuZ2UpIHJldHVybiAwO1xuXG4gICAgICAgICAgICAvLyDorqHnrpfku47lvIDotZvml7bpl7TliLDnjrDlnKjnu4/ov4fnmoTnp5LmlbDvvIjkuI7mnI3liqHnq6/kuIDoh7TvvIlcbiAgICAgICAgICAgIHZhciByYW5nZVN0YXJ0U2Vjb25kcyA9IHJhbmdlU3RhcnRNaW51dGVzICogNjA7XG4gICAgICAgICAgICB2YXIgZWxhcHNlZFNlY29uZHMgPSBjdXJyZW50VG90YWxTZWNvbmRzIC0gcmFuZ2VTdGFydFNlY29uZHM7XG4gICAgICAgICAgICB2YXIgbWF0Y2hEdXJhdGlvblNlY29uZHMgPSBtYXRjaER1cmF0aW9uICogNjA7XG5cbiAgICAgICAgICAgIC8vIOiuoeeul+W9k+WJjeaYr+esrOWHoOacn++8iOS7jjHlvIDlp4vvvIzkuI7mnI3liqHnq6/kuIDoh7TvvIlcbiAgICAgICAgICAgIHZhciBwZXJpb2RObyA9IE1hdGguZmxvb3IoZWxhcHNlZFNlY29uZHMgLyBtYXRjaER1cmF0aW9uU2Vjb25kcykgKyAxO1xuXG4gICAgICAgICAgICByZXR1cm4gcGVyaW9kTm87XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyDnq57mioDlnLrmiqXlkI3mjInpkq7ngrnlh7vlpITnkIZcbiAgICBfb25BcmVuYVNpZ251cEJ1dHRvbkNsaWNrOiBmdW5jdGlvbihyb29tQ29uZmlnLCBidG5Ob2RlLCBzaWdudXBCdG5Ob2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICB2YXIgcGxheWVyQXJlbmFDb2luID0gbXlnbG9iYWwgJiYgbXlnbG9iYWwucGxheWVyRGF0YSA/IG15Z2xvYmFsLnBsYXllckRhdGEuYXJlbmFfY29pbiA6IDA7XG4gICAgICAgIHZhciByb29tSWQgPSByb29tQ29uZmlnLmlkO1xuICAgICAgICBcbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm5bey5oql5ZCNXG4gICAgICAgIGlmICh3aW5kb3cuYXJlbmFEYXRhICYmIHdpbmRvdy5hcmVuYURhdGEuaXNTaWduZWRVcChyb29tSWQpKSB7XG4gICAgICAgICAgICAvLyDlt7LmiqXlkI3vvIzmiafooYzlj5bmtojmiqXlkI1cbiAgICAgICAgICAgIHRoaXMuX2RvQ2FuY2VsU2lnbnVwKHJvb21Db25maWcsIGJ0bk5vZGUsIHNpZ251cEJ0bk5vZGUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmo4Dmn6XmmK/lkKblj6/ku6XmiqXlkI3vvIjmnInlvIDotZvml7bpl7TkuJTmnInmr4/lnLrml7bplb/vvIlcbiAgICAgICAgaWYgKCF0aGlzLl9jYW5TaWdudXBBcmVuYShyb29tQ29uZmlnKSkge1xuICAgICAgICAgICAgdmFyIG1hdGNoVGltZVJhbmdlcyA9IHJvb21Db25maWcubWF0Y2hfdGltZV9yYW5nZXMgfHwgcm9vbUNvbmZpZy5tYXRjaFRpbWVSYW5nZXM7XG4gICAgICAgICAgICB2YXIgbWF0Y2hEdXJhdGlvbiA9IHJvb21Db25maWcubWF0Y2hfZHVyYXRpb24gfHwgcm9vbUNvbmZpZy5tYXRjaER1cmF0aW9uIHx8IHJvb21Db25maWcuaW50ZXJ2YWxfbWludXRlcyB8fCByb29tQ29uZmlnLmludGVydmFsTWludXRlcztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCFtYXRjaFRpbWVSYW5nZXMgJiYgIW1hdGNoRHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zaG93TWVzc2FnZShcIuivpeaIv+mXtOaaguacqumFjee9ruW8gOi1m+aXtumXtFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWF0Y2hUaW1lUmFuZ2VzICYmICFtYXRjaER1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2UoXCLor6XmiL/pl7TmmoLmnKrphY3nva7mr4/lnLrml7bplb9cIik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLl9pc0luTWF0Y2hUaW1lKHJvb21Db25maWcpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2UoXCLlvZPliY3kuI3lnKjlvIDotZvml7bpl7TmrrXvvIzml6Dms5XmiqXlkI1cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3dNZXNzYWdlKFwi5pqC5LiN5Y+v5oql5ZCNXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmo4Dmn6XmmK/lkKblt7LmiqXlkI3lhbbku5bnq57mioDlnLpcbiAgICAgICAgaWYgKHRoaXMuX2hhc1NpZ25lZFVwT3RoZXJBcmVuYShyb29tSWQpKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93TWVzc2FnZShcIuaCqOW3suaKpeWQjeWFtuS7luernuaKgOWcuu+8jOavj+WcuuWPquiDveaKpeWQjeS4gOS4que6p+WIq1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+W5oql5ZCN6LS5XG4gICAgICAgIHZhciBzaWdudXBGZWUgPSByb29tQ29uZmlnLm1pbl9hcmVuYV9jb2luIHx8IHJvb21Db25maWcubWluQXJlbmFDb2luIHx8IDA7XG4gICAgICAgIFxuICAgICAgICAvLyDmo4Dmn6Xnq57mioDluIHmmK/lkKbotrPlpJ9cbiAgICAgICAgaWYgKHBsYXllckFyZW5hQ29pbiA8IHNpZ251cEZlZSkge1xuICAgICAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2UoXCLnq57mioDluIHkuI3otrPvvIzpnIDopoEgXCIgKyBzaWdudXBGZWUgKyBcIiDnq57mioDluIFcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOaJp+ihjOaKpeWQjVxuICAgICAgICB0aGlzLl9kb0FyZW5hU2lnbnVwKHJvb21Db25maWcsIGJ0bk5vZGUsIHNpZ251cEJ0bk5vZGUpO1xuICAgIH0sXG4gICAgXG4gICAgLy8g5omn6KGM5Y+W5raI5oql5ZCNXG4gICAgX2RvQ2FuY2VsU2lnbnVwOiBmdW5jdGlvbihyb29tQ29uZmlnLCBidG5Ob2RlLCBzaWdudXBCdG5Ob2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIHRoaXMuX3Nob3dNZXNzYWdlKFwi5q2j5Zyo5Y+W5raI5oql5ZCNLi4uXCIpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHdpbmRvdy5hcmVuYURhdGEpIHtcbiAgICAgICAgICAgIHdpbmRvdy5hcmVuYURhdGEuY2FuY2VsU2lnbnVwKHJvb21Db25maWcuaWQsIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZShlcnIgfHwgXCLlj5bmtojmiqXlkI3lpLHotKVcIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2UoXCLlj5bmtojmiqXlkI3miJDlip/vvIznq57mioDluIHlt7Lov5Tov5hcIik7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5Yi35paw546p5a625L2Z6aKdXG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5hcmVuYURhdGEucmVmcmVzaEJhbGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmFyZW5hRGF0YS5yZWZyZXNoQmFsYW5jZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDmm7TmlrBVSVxuICAgICAgICAgICAgICAgIHNlbGYuX3VwZGF0ZUFyZW5hU2lnbnVwU3RhdHVzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLy8g5ZCv5Yqo5YCS6K6h5pe25pu05paw5a6a5pe25ZmoXG4gICAgLy8g8J+Up+OAkOmHjeaehOOAkeWuouaIt+err+WfuuS6juacjeWKoeerr+aOqOmAgeeahOWAkuiuoeaXtuacrOWcsOiuoeeul1xuICAgIF9zdGFydENvdW50ZG93blRpbWVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIC8vIOa4heeQhuaXp+eahOWumuaXtuWZqFxuICAgICAgICBpZiAodGhpcy5fY291bnRkb3duVGltZXIpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fY291bnRkb3duVGltZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeWIneWni+WMluacrOWcsOWAkuiuoeaXtueKtuaAgee8k+WtmFxuICAgICAgICAvLyDmoLzlvI86IHsgcm9vbUlkOiB7IHBlcmlvZE5vLCBjb3VudGRvd24sIGNhblNpZ251cCwgbGFzdFVwZGF0ZSB9IH1cbiAgICAgICAgdGhpcy5fbG9jYWxBcmVuYVN0YXR1cyA9IHt9O1xuXG4gICAgICAgIC8vIOebkeWQrOacjeWKoeerr+aOqOmAgeeahOernuaKgOWcuueKtuaAgVxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55SoIG15Z2xvYmFsLnNvY2tldCDlrp7kvovvvIzogIzkuI3mmK8gd2luZG93LnNvY2tldEN0ciDlh73mlbBcbiAgICAgICAgdmFyIHNvY2tldCA9IHdpbmRvdy5teWdsb2JhbCAmJiB3aW5kb3cubXlnbG9iYWwuc29ja2V0O1xuICAgICAgICBpZiAoc29ja2V0ICYmIHNvY2tldC5vbkFyZW5hU3RhdHVzKSB7XG4gICAgICAgICAgICBzb2NrZXQub25BcmVuYVN0YXR1cyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYubm9kZSAmJiBzZWxmLm5vZGUuaXNWYWxpZCAmJiBkYXRhICYmIGRhdGEuYXJlbmFzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67mlLnjgJHmlLbliLDmnI3liqHnq6/mjqjpgIHml7bvvIzkv53lrZjliLDmnKzlnLDnirbmgIFcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fb25BcmVuYVN0YXR1c1B1c2goZGF0YS5hcmVuYXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+Pn++4jyBbQXJlbmFdIHNvY2tldCDmiJYgb25BcmVuYVN0YXR1cyDmlrnms5XkuI3lj6/nlKjvvIzml6Dms5Xnm5HlkKznq57mioDlnLrnirbmgIFcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR55uR5ZCs56ue5oqA5Zy65q+U6LWb5byA5aeL6YCa55+lXG4gICAgICAgIGlmIChzb2NrZXQgJiYgc29ja2V0Lm9uQXJlbmFNYXRjaFN0YXJ0KSB7XG4gICAgICAgICAgICBzb2NrZXQub25BcmVuYU1hdGNoU3RhcnQoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLm5vZGUgJiYgc2VsZi5ub2RlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fb25BcmVuYU1hdGNoU3RhcnQoZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR55uR5ZCs56ue5oqA5Zy65YWz6Zet5by556qX6YCa55+l77yI5paw5pyf5Y+35byA5aeL5pe25YWz6Zet5LiK5LiA6L2u5by556qX77yJXG4gICAgICAgIGlmIChzb2NrZXQgJiYgc29ja2V0Lm9uQXJlbmFDbG9zZURpYWxvZykge1xuICAgICAgICAgICAgc29ja2V0Lm9uQXJlbmFDbG9zZURpYWxvZyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYubm9kZSAmJiBzZWxmLm5vZGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9vbkFyZW5hQ2xvc2VEaWFsb2coZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR56uL5Y2z5Yid5aeL5YyW5pys5Zyw54q25oCB77yI5L2/55So5pys5Zyw6K6h566X5L2c5Li65Yid5aeL5YC877yJXG4gICAgICAgIHRoaXMuX2luaXRMb2NhbEFyZW5hU3RhdHVzRnJvbUNvbmZpZygpO1xuXG4gICAgICAgIC8vIPCflKfjgJDkv67mlLnjgJHmr4/np5Lmm7TmlrDmnKzlnLDlgJLorqHml7bvvIjlh48x77yJXG4gICAgICAgIHRoaXMuX2NvdW50ZG93blRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoc2VsZi5ub2RlICYmIHNlbGYubm9kZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fdXBkYXRlTG9jYWxDb3VudGRvd24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfSxcblxuICAgIC8vIPCflKfjgJDmlrDlop7jgJHlpITnkIbnq57mioDlnLrmr5TotZvlvIDlp4vpgJrnn6VcbiAgICBfb25BcmVuYU1hdGNoU3RhcnQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeWFiOWFs+mXreS5i+WJjeWPr+iDveWtmOWcqOeahOW8ueeql1xuICAgICAgICB0aGlzLl9jbG9zZUFyZW5hTWF0Y2hTdGFydERpYWxvZygpO1xuICAgICAgICBcbiAgICAgICAgLy8g5L+d5a2Y5q+U6LWb5L+h5oGv5L6b5ZCO57ut5L2/55SoXG4gICAgICAgIHRoaXMuX2N1cnJlbnRNYXRjaERhdGEgPSBkYXRhO1xuICAgICAgICBcbiAgICAgICAgLy8g5by55Ye66L+b5YWl5ri45oiP5by556qXXG4gICAgICAgIHRoaXMuX3Nob3dBcmVuYU1hdGNoU3RhcnREaWFsb2coZGF0YSk7XG4gICAgfSxcbiAgICBcbiAgICAvLyDwn5Sn44CQ5paw5aKe44CR5YWz6Zet56ue5oqA5Zy65by556qXXG4gICAgX2Nsb3NlQXJlbmFNYXRjaFN0YXJ0RGlhbG9nOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g5YWz6Zet5bm26ZSA5q+B5LmL5YmN5pi+56S655qE5by556qXXG4gICAgICAgIGlmICh0aGlzLl9hcmVuYU1hdGNoU3RhcnREaWFsb2cgJiYgdGhpcy5fYXJlbmFNYXRjaFN0YXJ0RGlhbG9nLmlzVmFsaWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2FyZW5hTWF0Y2hTdGFydERpYWxvZy5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLl9hcmVuYU1hdGNoU3RhcnREaWFsb2cgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIC8vIOa4hemZpOW9k+WJjeavlOi1m+aVsOaNrlxuICAgICAgICB0aGlzLl9jdXJyZW50TWF0Y2hEYXRhID0gbnVsbDtcbiAgICB9LFxuXG4gICAgLy8g8J+Up+OAkOaWsOWinuOAkeWkhOeQhuacjeWKoeerr+WPkemAgeeahOWFs+mXreW8ueeql+mAmuefpVxuICAgIF9vbkFyZW5hQ2xvc2VEaWFsb2c6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYV0g5pS25Yiw5YWz6Zet5by556qX6YCa55+lOlwiLCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgICAgIFxuICAgICAgICAvLyDmo4Dmn6XmmK/lkKbkuI7lvZPliY3lvLnnqpfljLnphY1cbiAgICAgICAgaWYgKHRoaXMuX2FyZW5hTWF0Y2hTdGFydERpYWxvZyAmJiB0aGlzLl9hcmVuYU1hdGNoU3RhcnREaWFsb2cuaXNWYWxpZCkge1xuICAgICAgICAgICAgLy8g5aaC5p6c5oyH5a6a5LqG5oi/6Ze0SUTvvIzmo4Dmn6XmmK/lkKbljLnphY1cbiAgICAgICAgICAgIGlmIChkYXRhLnJvb21faWQgJiYgdGhpcy5fYXJlbmFNYXRjaFN0YXJ0RGlhbG9nUm9vbUlkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEucm9vbV9pZCA9PT0gdGhpcy5fYXJlbmFNYXRjaFN0YXJ0RGlhbG9nUm9vbUlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFdIOWFs+mXreWMuemFjeeahOW8ueeql++8jHJvb21faWQ6XCIsIGRhdGEucm9vbV9pZCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Nsb3NlQXJlbmFNYXRjaFN0YXJ0RGlhbG9nKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDmsqHmnInmjIflrprmiL/pl7RJRO+8jOWFs+mXreaJgOacieW8ueeql1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFdIOWFs+mXreaJgOacieernuaKgOWcuuW8ueeql1wiKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9jbG9zZUFyZW5hTWF0Y2hTdGFydERpYWxvZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIPCflKfjgJDmlrDlop7jgJHmmL7npLrnq57mioDlnLrmr5TotZvlvIDlp4vlvLnnqpdcbiAgICBfc2hvd0FyZW5hTWF0Y2hTdGFydERpYWxvZzogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5bnlLvluIPlsLrlr7hcbiAgICAgICAgdmFyIGNhbnZhcyA9IHRoaXMubm9kZS5nZXRDb21wb25lbnQoY2MuQ2FudmFzKSB8fCBjYy5maW5kKCdDYW52YXMnKS5nZXRDb21wb25lbnQoY2MuQ2FudmFzKTtcbiAgICAgICAgdmFyIHNjcmVlbkhlaWdodCA9IGNhbnZhcyA/IGNhbnZhcy5kZXNpZ25SZXNvbHV0aW9uLmhlaWdodCA6IDcyMDtcbiAgICAgICAgdmFyIHNjcmVlbldpZHRoID0gY2FudmFzID8gY2FudmFzLmRlc2lnblJlc29sdXRpb24ud2lkdGggOiAxMjgwO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65by556qX5a655ZmoXG4gICAgICAgIHZhciBkaWFsb2dOb2RlID0gbmV3IGNjLk5vZGUoXCJBcmVuYU1hdGNoU3RhcnREaWFsb2dcIik7XG4gICAgICAgIGRpYWxvZ05vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZShzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSk7XG4gICAgICAgIGRpYWxvZ05vZGUuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgZGlhbG9nTm9kZS5hbmNob3JZID0gMC41O1xuICAgICAgICBkaWFsb2dOb2RlLnggPSAwO1xuICAgICAgICBkaWFsb2dOb2RlLnkgPSAwO1xuICAgICAgICBkaWFsb2dOb2RlLnpJbmRleCA9IDUwMDA7XG4gICAgICAgIGRpYWxvZ05vZGUucGFyZW50ID0gdGhpcy5ub2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeS/neWtmOW8ueeql+W8leeUqO+8jOeUqOS6juWQjue7reWFs+mXrVxuICAgICAgICB0aGlzLl9hcmVuYU1hdGNoU3RhcnREaWFsb2cgPSBkaWFsb2dOb2RlO1xuICAgICAgICB0aGlzLl9hcmVuYU1hdGNoU3RhcnREaWFsb2dSb29tSWQgPSBkYXRhLnJvb21faWQ7ICAvLyDkv53lrZjlr7nlupTnmoTmiL/pl7RJRFxuICAgICAgICB0aGlzLl9hcmVuYU1hdGNoU3RhcnREaWFsb2dQZXJpb2RObyA9IGRhdGEucGVyaW9kX25vOyAgLy8g5L+d5a2Y5a+55bqU55qE5pyf5Y+3XG4gICAgICAgIFxuICAgICAgICAvLyDljYrpgI/mmI7pu5HoibLog4zmma9cbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmdcIik7XG4gICAgICAgIGJnTm9kZS5zZXRDb250ZW50U2l6ZShjYy5zaXplKHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpKTtcbiAgICAgICAgdmFyIGJnR3JhcGhpY3MgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgYmdHcmFwaGljcy5maWxsQ29sb3IgPSBjYy5jb2xvcigwLCAwLCAwLCAxODApO1xuICAgICAgICBiZ0dyYXBoaWNzLnJlY3QoLXNjcmVlbldpZHRoLzIsIC1zY3JlZW5IZWlnaHQvMiwgc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCk7XG4gICAgICAgIGJnR3JhcGhpY3MuZmlsbCgpO1xuICAgICAgICBiZ05vZGUucGFyZW50ID0gZGlhbG9nTm9kZTtcbiAgICAgICAgXG4gICAgICAgIC8vIOW8ueeql+WNoeeJh1xuICAgICAgICB2YXIgY2FyZFdpZHRoID0gNDUwO1xuICAgICAgICB2YXIgY2FyZEhlaWdodCA9IDM4MDtcbiAgICAgICAgdmFyIGNhcmROb2RlID0gbmV3IGNjLk5vZGUoXCJDYXJkXCIpO1xuICAgICAgICBjYXJkTm9kZS5zZXRDb250ZW50U2l6ZShjYy5zaXplKGNhcmRXaWR0aCwgY2FyZEhlaWdodCkpO1xuICAgICAgICB2YXIgY2FyZEdyYXBoaWNzID0gY2FyZE5vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgY2FyZEdyYXBoaWNzLmZpbGxDb2xvciA9IGNjLmNvbG9yKDQwLCA0NSwgNjUsIDI1NSk7XG4gICAgICAgIGNhcmRHcmFwaGljcy5yb3VuZFJlY3QoLWNhcmRXaWR0aC8yLCAtY2FyZEhlaWdodC8yLCBjYXJkV2lkdGgsIGNhcmRIZWlnaHQsIDE1KTtcbiAgICAgICAgY2FyZEdyYXBoaWNzLmZpbGwoKTtcbiAgICAgICAgY2FyZEdyYXBoaWNzLnN0cm9rZUNvbG9yID0gY2MuY29sb3IoMjU1LCAyMTUsIDApO1xuICAgICAgICBjYXJkR3JhcGhpY3MubGluZVdpZHRoID0gMztcbiAgICAgICAgY2FyZEdyYXBoaWNzLnJvdW5kUmVjdCgtY2FyZFdpZHRoLzIsIC1jYXJkSGVpZ2h0LzIsIGNhcmRXaWR0aCwgY2FyZEhlaWdodCwgMTUpO1xuICAgICAgICBjYXJkR3JhcGhpY3Muc3Ryb2tlKCk7XG4gICAgICAgIGNhcmROb2RlLnBhcmVudCA9IGRpYWxvZ05vZGU7XG4gICAgICAgIFxuICAgICAgICAvLyDmoIfpophcbiAgICAgICAgdmFyIHRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIik7XG4gICAgICAgIHRpdGxlTm9kZS55ID0gY2FyZEhlaWdodC8yIC0gNDU7XG4gICAgICAgIHZhciB0aXRsZUxhYmVsID0gdGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIHRpdGxlTGFiZWwuc3RyaW5nID0gXCLwn4+GIOernuaKgOWcuuavlOi1m+W8gOWni1wiO1xuICAgICAgICB0aXRsZUxhYmVsLmZvbnRTaXplID0gMzI7XG4gICAgICAgIHRpdGxlTGFiZWwubGluZUhlaWdodCA9IDQwO1xuICAgICAgICB0aXRsZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIHRpdGxlTm9kZS5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjE1LCAwKTtcbiAgICAgICAgdmFyIHRpdGxlT3V0bGluZSA9IHRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKTtcbiAgICAgICAgdGl0bGVPdXRsaW5lLmNvbG9yID0gY2MuY29sb3IoMTAwLCA4MCwgMCk7XG4gICAgICAgIHRpdGxlT3V0bGluZS53aWR0aCA9IDI7XG4gICAgICAgIHRpdGxlTm9kZS5wYXJlbnQgPSBjYXJkTm9kZTtcbiAgICAgICAgXG4gICAgICAgIC8vIOacn+WPt+S/oeaBr1xuICAgICAgICB2YXIgcGVyaW9kTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUGVyaW9kXCIpO1xuICAgICAgICBwZXJpb2ROb2RlLnkgPSBjYXJkSGVpZ2h0LzIgLSA5NTtcbiAgICAgICAgdmFyIHBlcmlvZExhYmVsID0gcGVyaW9kTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBwZXJpb2RMYWJlbC5zdHJpbmcgPSBcIuacn+WPtzogXCIgKyAoZGF0YS5wZXJpb2Rfbm8gfHwgXCItLVwiKTtcbiAgICAgICAgcGVyaW9kTGFiZWwuZm9udFNpemUgPSAyMjtcbiAgICAgICAgcGVyaW9kTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgcGVyaW9kTm9kZS5jb2xvciA9IGNjLmNvbG9yKDIwMCwgMjAwLCAyMjApO1xuICAgICAgICBwZXJpb2ROb2RlLnBhcmVudCA9IGNhcmROb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g5oi/6Ze05L+h5oGvXG4gICAgICAgIHZhciByb29tTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUm9vbVwiKTtcbiAgICAgICAgcm9vbU5vZGUueSA9IGNhcmRIZWlnaHQvMiAtIDEzMDtcbiAgICAgICAgdmFyIHJvb21MYWJlbCA9IHJvb21Ob2RlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIHJvb21MYWJlbC5zdHJpbmcgPSBcIuaIv+mXtDogXCIgKyAoZGF0YS5yb29tX25hbWUgfHwgXCLmnKrnn6XmiL/pl7RcIik7XG4gICAgICAgIHJvb21MYWJlbC5mb250U2l6ZSA9IDIwO1xuICAgICAgICByb29tTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgcm9vbU5vZGUuY29sb3IgPSBjYy5jb2xvcigxODAsIDE4MCwgMjAwKTtcbiAgICAgICAgcm9vbU5vZGUucGFyZW50ID0gY2FyZE5vZGU7XG4gICAgICAgIFxuICAgICAgICAvLyDlj4LotZvkurrmlbBcbiAgICAgICAgdmFyIHBsYXllcnNOb2RlID0gbmV3IGNjLk5vZGUoXCJQbGF5ZXJzXCIpO1xuICAgICAgICBwbGF5ZXJzTm9kZS55ID0gY2FyZEhlaWdodC8yIC0gMTY1O1xuICAgICAgICB2YXIgcGxheWVyc0xhYmVsID0gcGxheWVyc05vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgcGxheWVyc0xhYmVsLnN0cmluZyA9IFwi5Y+C6LWb5Lq65pWwOiBcIiArIChkYXRhLnRvdGFsX3BsYXllcnMgfHwgMCkgKyBcIiDkurpcIjtcbiAgICAgICAgcGxheWVyc0xhYmVsLmZvbnRTaXplID0gMjA7XG4gICAgICAgIHBsYXllcnNMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICBwbGF5ZXJzTm9kZS5jb2xvciA9IGNjLmNvbG9yKDEwMCwgMjAwLCAxMDApO1xuICAgICAgICBwbGF5ZXJzTm9kZS5wYXJlbnQgPSBjYXJkTm9kZTtcbiAgICAgICAgXG4gICAgICAgIC8vIOaPkOekuua2iOaBr1xuICAgICAgICB2YXIgbXNnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTWVzc2FnZVwiKTtcbiAgICAgICAgbXNnTm9kZS55ID0gY2FyZEhlaWdodC8yIC0gMjQwO1xuICAgICAgICB2YXIgbXNnTGFiZWwgPSBtc2dOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIG1zZ0xhYmVsLnN0cmluZyA9IGRhdGEubWVzc2FnZSB8fCBcIuavlOi1m+WNs+WwhuW8gOWni++8jOivt+WHhuWkh+i/m+WFpea4uOaIj++8gVwiO1xuICAgICAgICBtc2dMYWJlbC5mb250U2l6ZSA9IDE2O1xuICAgICAgICBtc2dMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICBtc2dOb2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyMDAsIDEwMCk7XG4gICAgICAgIG1zZ05vZGUucGFyZW50ID0gY2FyZE5vZGU7XG4gICAgICAgIFxuICAgICAgICAvLyDmjInpkq7ljLrln59cbiAgICAgICAgdmFyIGJ0blkgPSAtY2FyZEhlaWdodC8yICsgNTU7XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOi/m+WFpea4uOaIj+aMiemSriA9PT09PT09PT09XG4gICAgICAgIHZhciBlbnRlckJ0biA9IG5ldyBjYy5Ob2RlKFwiRW50ZXJCdG5cIik7XG4gICAgICAgIGVudGVyQnRuLnNldENvbnRlbnRTaXplKGNjLnNpemUoMTgwLCA1MCkpO1xuICAgICAgICBlbnRlckJ0bi5zZXRQb3NpdGlvbigtMTAwLCBidG5ZKTtcbiAgICAgICAgZW50ZXJCdG4uYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgZW50ZXJCdG4uYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgXG4gICAgICAgIC8vIOe7mOWItuaMiemSruiDjOaZr1xuICAgICAgICB2YXIgZW50ZXJCZyA9IGVudGVyQnRuLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIGVudGVyQmcuZmlsbENvbG9yID0gY2MuY29sb3IoNzYsIDE3NSwgODApOyAgLy8g57u/6ImyXG4gICAgICAgIGVudGVyQmcucm91bmRSZWN0KC05MCwgLTI1LCAxODAsIDUwLCA4KTtcbiAgICAgICAgZW50ZXJCZy5maWxsKCk7XG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7rmloflrZflrZDoioLngrlcbiAgICAgICAgdmFyIGVudGVyTGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJMYWJlbFwiKTtcbiAgICAgICAgZW50ZXJMYWJlbE5vZGUuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgZW50ZXJMYWJlbE5vZGUuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgdmFyIGVudGVyQnRuTGFiZWwgPSBlbnRlckxhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBlbnRlckJ0bkxhYmVsLnN0cmluZyA9IFwi6L+b5YWl5q+U6LWbXCI7XG4gICAgICAgIGVudGVyQnRuTGFiZWwuZm9udFNpemUgPSAyMjtcbiAgICAgICAgZW50ZXJCdG5MYWJlbC5saW5lSGVpZ2h0ID0gMjg7XG4gICAgICAgIGVudGVyQnRuTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgZW50ZXJMYWJlbE5vZGUuY29sb3IgPSBjYy5jb2xvcigyNTUsIDI1NSwgMjU1KTtcbiAgICAgICAgZW50ZXJMYWJlbE5vZGUucGFyZW50ID0gZW50ZXJCdG47XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqAgQnV0dG9uIOe7hOS7tuaPkOS+m+S6pOS6kuWPjemmiFxuICAgICAgICB2YXIgZW50ZXJCdXR0b25Db21wID0gZW50ZXJCdG4uYWRkQ29tcG9uZW50KGNjLkJ1dHRvbik7XG4gICAgICAgIGVudGVyQnV0dG9uQ29tcC50cmFuc2l0aW9uID0gY2MuQnV0dG9uLlRyYW5zaXRpb24uU0NBTEU7XG4gICAgICAgIGVudGVyQnV0dG9uQ29tcC5kdXJhdGlvbiA9IDAuMTtcbiAgICAgICAgZW50ZXJCdXR0b25Db21wLnpvb21TY2FsZSA9IDEuMTtcbiAgICAgICAgXG4gICAgICAgIGVudGVyQnRuLnBhcmVudCA9IGNhcmROb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg54K55Ye75LqL5Lu2XG4gICAgICAgIGVudGVyQnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgLy8g5riF6Zmk5by556qX5byV55So5ZCO5YaN6ZSA5q+BXG4gICAgICAgICAgICBzZWxmLl9hcmVuYU1hdGNoU3RhcnREaWFsb2cgPSBudWxsO1xuICAgICAgICAgICAgc2VsZi5fYXJlbmFNYXRjaFN0YXJ0RGlhbG9nUm9vbUlkID0gbnVsbDtcbiAgICAgICAgICAgIHNlbGYuX2FyZW5hTWF0Y2hTdGFydERpYWxvZ1BlcmlvZE5vID0gbnVsbDtcbiAgICAgICAgICAgIGRpYWxvZ05vZGUuZGVzdHJveSgpO1xuICAgICAgICAgICAgc2VsZi5fZW50ZXJBcmVuYU1hdGNoKGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0g5Y+W5raI5oyJ6ZKuID09PT09PT09PT1cbiAgICAgICAgdmFyIGNhbmNlbEJ0biA9IG5ldyBjYy5Ob2RlKFwiQ2FuY2VsQnRuXCIpO1xuICAgICAgICBjYW5jZWxCdG4uc2V0Q29udGVudFNpemUoY2Muc2l6ZSgxMjAsIDUwKSk7XG4gICAgICAgIGNhbmNlbEJ0bi5zZXRQb3NpdGlvbigxMDAsIGJ0blkpOyAgLy8g5L+u5q2j5L2N572u77yM5Lik5oyJ6ZKu6Ze06Led5ZCI55CGXG4gICAgICAgIGNhbmNlbEJ0bi5hbmNob3JYID0gMC41O1xuICAgICAgICBjYW5jZWxCdG4uYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgXG4gICAgICAgIC8vIOe7mOWItuaMiemSruiDjOaZr1xuICAgICAgICB2YXIgY2FuY2VsQmcgPSBjYW5jZWxCdG4uYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgY2FuY2VsQmcuZmlsbENvbG9yID0gY2MuY29sb3IoMTgwLCA4MCwgODApOyAgLy8g57qi6ImyXG4gICAgICAgIGNhbmNlbEJnLnJvdW5kUmVjdCgtNjAsIC0yNSwgMTIwLCA1MCwgOCk7XG4gICAgICAgIGNhbmNlbEJnLmZpbGwoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWIm+W7uuaWh+Wtl+WtkOiKgueCuVxuICAgICAgICB2YXIgY2FuY2VsTGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJMYWJlbFwiKTtcbiAgICAgICAgY2FuY2VsTGFiZWxOb2RlLmFuY2hvclggPSAwLjU7XG4gICAgICAgIGNhbmNlbExhYmVsTm9kZS5hbmNob3JZID0gMC41O1xuICAgICAgICB2YXIgY2FuY2VsQnRuTGFiZWwgPSBjYW5jZWxMYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgY2FuY2VsQnRuTGFiZWwuc3RyaW5nID0gXCLlj5bmtohcIjtcbiAgICAgICAgY2FuY2VsQnRuTGFiZWwuZm9udFNpemUgPSAyMDtcbiAgICAgICAgY2FuY2VsQnRuTGFiZWwubGluZUhlaWdodCA9IDI2O1xuICAgICAgICBjYW5jZWxCdG5MYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICBjYW5jZWxMYWJlbE5vZGUuY29sb3IgPSBjYy5jb2xvcigyNTUsIDI1NSwgMjU1KTtcbiAgICAgICAgY2FuY2VsTGFiZWxOb2RlLnBhcmVudCA9IGNhbmNlbEJ0bjtcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoCBCdXR0b24g57uE5Lu25o+Q5L6b5Lqk5LqS5Y+N6aaIXG4gICAgICAgIHZhciBjYW5jZWxCdXR0b25Db21wID0gY2FuY2VsQnRuLmFkZENvbXBvbmVudChjYy5CdXR0b24pO1xuICAgICAgICBjYW5jZWxCdXR0b25Db21wLnRyYW5zaXRpb24gPSBjYy5CdXR0b24uVHJhbnNpdGlvbi5TQ0FMRTtcbiAgICAgICAgY2FuY2VsQnV0dG9uQ29tcC5kdXJhdGlvbiA9IDAuMTtcbiAgICAgICAgY2FuY2VsQnV0dG9uQ29tcC56b29tU2NhbGUgPSAxLjE7XG4gICAgICAgIFxuICAgICAgICBjYW5jZWxCdG4ucGFyZW50ID0gY2FyZE5vZGU7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDngrnlh7vkuovku7ZcbiAgICAgICAgY2FuY2VsQnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlj5bmtojmjInpkq7vvJrlj5bmtojmiqXlkI3lubbpgIDov5jnq57mioDluIFcbiAgICAgICAgICAgIHNlbGYuX2NhbmNlbEFyZW5hU2lnbnVwKGRhdGEpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmuIXpmaTlvLnnqpflvJXnlKjlkI7lho3plIDmr4FcbiAgICAgICAgICAgIHNlbGYuX2FyZW5hTWF0Y2hTdGFydERpYWxvZyA9IG51bGw7XG4gICAgICAgICAgICBzZWxmLl9hcmVuYU1hdGNoU3RhcnREaWFsb2dSb29tSWQgPSBudWxsO1xuICAgICAgICAgICAgc2VsZi5fYXJlbmFNYXRjaFN0YXJ0RGlhbG9nUGVyaW9kTm8gPSBudWxsO1xuICAgICAgICAgICAgZGlhbG9nTm9kZS5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvLyDwn5Sn44CQ5paw5aKe44CR5Y+W5raI56ue5oqA5Zy65oql5ZCN5bm26YCA6L+Y56ue5oqA5biBXG4gICAgX2NhbmNlbEFyZW5hU2lnbnVwOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYV0g5Y+W5raI5oql5ZCN77yM6YCA6L+Y56ue5oqA5biB77yMcm9vbV9pZDpcIiwgZGF0YS5yb29tX2lkKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWPkemAgeWPlua2iOaKpeWQjeivt+axguWIsOacjeWKoeerr1xuICAgICAgICB2YXIgc29ja2V0ID0gbXlnbG9iYWwgJiYgbXlnbG9iYWwuc29ja2V0O1xuICAgICAgICBpZiAoc29ja2V0ICYmIHNvY2tldC5zZW5kQXJlbmFDYW5jZWxTaWdudXApIHtcbiAgICAgICAgICAgIHNvY2tldC5zZW5kQXJlbmFDYW5jZWxTaWdudXAoe1xuICAgICAgICAgICAgICAgIHJvb21faWQ6IGRhdGEucm9vbV9pZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOa4hemZpOacrOWcsOaKpeWQjeeKtuaAgVxuICAgICAgICBpZiAod2luZG93LmFyZW5hRGF0YSAmJiB3aW5kb3cuYXJlbmFEYXRhLl9zaWduZWRVcEFyZW5hcykge1xuICAgICAgICAgICAgZGVsZXRlIHdpbmRvdy5hcmVuYURhdGEuX3NpZ25lZFVwQXJlbmFzW2RhdGEucm9vbV9pZF07XG4gICAgICAgICAgICB3aW5kb3cuYXJlbmFEYXRhLnNhdmVUb0xvY2FsICYmIHdpbmRvdy5hcmVuYURhdGEuc2F2ZVRvTG9jYWwoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5riF6Zmk5b2T5YmN5q+U6LWb5pWw5o2uXG4gICAgICAgIHRoaXMuX2N1cnJlbnRNYXRjaERhdGEgPSBudWxsO1xuICAgIH0sXG5cbiAgICAvLyDwn5Sn44CQ5paw5aKe44CR6L+b5YWl56ue5oqA5Zy65q+U6LWbXG4gICAgX2VudGVyQXJlbmFNYXRjaDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbDtcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbQXJlbmFdIOi/m+WFpeernuaKgOWcuuavlOi1m++8jGRhdGE6XCIsIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOS/neWtmOavlOi1m+S/oeaBr1xuICAgICAgICBpZiAobXlnbG9iYWwpIHtcbiAgICAgICAgICAgIG15Z2xvYmFsLmN1cnJlbnRBcmVuYU1hdGNoID0gZGF0YTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5riF6Zmk5oql5ZCN54q25oCBXG4gICAgICAgIGlmICh3aW5kb3cuYXJlbmFEYXRhICYmIHdpbmRvdy5hcmVuYURhdGEuX3NpZ25lZFVwQXJlbmFzKSB7XG4gICAgICAgICAgICBkZWxldGUgd2luZG93LmFyZW5hRGF0YS5fc2lnbmVkVXBBcmVuYXNbZGF0YS5yb29tX2lkXTtcbiAgICAgICAgICAgIHdpbmRvdy5hcmVuYURhdGEuc2F2ZVRvTG9jYWwgJiYgd2luZG93LmFyZW5hRGF0YS5zYXZlVG9Mb2NhbCgpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5Y+R6YCBIGFyZW5hX2VudGVyIOivt+axgu+8jOetieW+hSByb29tX2pvaW5lZCDmtojmga/lkI7lho3ov5vlhaXmuLjmiI/lnLrmma9cbiAgICAgICAgdmFyIHNvY2tldCA9IG15Z2xvYmFsICYmIG15Z2xvYmFsLnNvY2tldDtcbiAgICAgICAgaWYgKHNvY2tldCAmJiBzb2NrZXQuc2VuZEFyZW5hRW50ZXIpIHtcbiAgICAgICAgICAgIC8vIOaYvuekuuWKoOi9veaPkOekulxuICAgICAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2VDZW50ZXIoXCLmraPlnKjov5vlhaXnq57mioDlnLouLi5cIik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOazqOWGjOS4gOasoeaApyByb29tX2pvaW5lZCDnm5HlkKzlmahcbiAgICAgICAgICAgIHZhciByb29tSm9pbmVkSGFuZGxlciA9IGZ1bmN0aW9uKHJvb21EYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYV0g5pS25YiwIHJvb21fam9pbmVk77yM5YeG5aSH6L+b5YWl5ri45oiP5Zy65pmvOlwiLCBKU09OLnN0cmluZ2lmeShyb29tRGF0YSkpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOWPlua2iOi2heaXtuWumuaXtuWZqFxuICAgICAgICAgICAgICAgIGlmIChzZWxmLl9hcmVuYUVudGVyVGltZW91dCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoc2VsZi5fYXJlbmFFbnRlclRpbWVvdXQpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9hcmVuYUVudGVyVGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHovazmjaLmlbDmja7moLzlvI/vvJpwbGF5ZXJzIOKGkiBwbGF5ZXJkYXRhXG4gICAgICAgICAgICAgICAgLy8g5ri45oiP5Zy65pmv5pyf5pyb55qE5pWw5o2u5qC85byP5LiO5pmu6YCa5Zy65LiA6Ie0XG4gICAgICAgICAgICAgICAgdmFyIHBsYXllcnMgPSByb29tRGF0YS5wbGF5ZXJzIHx8IFtdO1xuICAgICAgICAgICAgICAgIHZhciBjb252ZXJ0ZWRSb29tRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcm9vbWlkOiByb29tRGF0YS5yb29tX2NvZGUgfHwgXCJBUkVOQVwiLFxuICAgICAgICAgICAgICAgICAgICByb29tX2NvZGU6IHJvb21EYXRhLnJvb21fY29kZSB8fCBcIkFSRU5BXCIsXG4gICAgICAgICAgICAgICAgICAgIHNlYXRpbmRleDogcm9vbURhdGEucGxheWVyID8gcm9vbURhdGEucGxheWVyLnNlYXQgKyAxIDogMSxcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyZGF0YTogcGxheWVycy5tYXAoZnVuY3Rpb24ocCwgaWR4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY291bnRpZDogcC5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuaWNrX25hbWU6IHAubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdmF0YXJVcmw6IHAuYXZhdGFyIHx8IFwiYXZhdGFyXzFcIiwgIC8vIPCflKfjgJDkv67lpI3jgJHkvb/nlKjlrp7pmYXlpLTlg49VUkxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2xkX2NvdW50OiBwLmdvbGRfY291bnQgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2xkY291bnQ6IHAuZ29sZF9jb3VudCB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlYXRpbmRleDogKHAuc2VhdCAhPT0gdW5kZWZpbmVkID8gcC5zZWF0IDogaWR4KSArIDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNyZWFkeTogcC5yZWFkeSB8fCBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmVuYV9nb2xkOiBwLmFyZW5hX2dvbGQgfHwgMCwgIC8vIPCflKfjgJDkv67lpI3jgJHmt7vliqDnq57mioDlnLrph5HluIFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaF9jb2luOiBwLm1hdGNoX2NvaW4gfHwgMCwgIC8vIOWFvOWuueWtl+autVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcmlvZF9ubzogcC5wZXJpb2Rfbm8gfHwgXCJcIiAgICAvLyDmnJ/lj7dcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICBob3VzZW1hbmFnZWlkOiByb29tRGF0YS5jcmVhdG9yX2lkIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGNyZWF0b3JfaWQ6IHJvb21EYXRhLmNyZWF0b3JfaWQgfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgcm9vbV9jYXRlZ29yeTogMiwgIC8vIOernuaKgOWculxuICAgICAgICAgICAgICAgICAgICBwZXJpb2Rfbm86IGRhdGEucGVyaW9kX25vXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW0FyZW5hXSDovazmjaLlkI7nmoTmiL/pl7TmlbDmja46XCIsIEpTT04uc3RyaW5naWZ5KGNvbnZlcnRlZFJvb21EYXRhKSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5L+d5a2Y6L2s5o2i5ZCO55qE5oi/6Ze05pWw5o2uXG4gICAgICAgICAgICAgICAgaWYgKG15Z2xvYmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnJvb21EYXRhID0gY29udmVydGVkUm9vbURhdGE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOi/m+WFpea4uOaIj+WcuuaZr1xuICAgICAgICAgICAgICAgIHNlbGYuX2VudGVyR2FtZVNjZW5lKGNvbnZlcnRlZFJvb21EYXRhKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOazqOWGjOebkeWQrOWZqFxuICAgICAgICAgICAgc29ja2V0Lm9uUm9vbUpvaW5lZChyb29tSm9pbmVkSGFuZGxlcik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOiuvue9rui2heaXtu+8iDEw56eS5ZCO5aaC5p6c5rKh5pS25YiwIHJvb21fam9pbmVk77yM5Lmf6L+b5YWl5Zy65pmv77yJXG4gICAgICAgICAgICB0aGlzLl9hcmVuYUVudGVyVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYV0g562J5b6FIHJvb21fam9pbmVkIOi2heaXtu+8jOebtOaOpei/m+WFpea4uOaIj+WcuuaZr1wiKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9hcmVuYUVudGVyVGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5p6E6YCg5Li05pe25oi/6Ze05pWw5o2uXG4gICAgICAgICAgICAgICAgdmFyIHRlbXBSb29tRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcm9vbV9jb2RlOiBcImFyZW5hX1wiICsgZGF0YS5wZXJpb2Rfbm8sXG4gICAgICAgICAgICAgICAgICAgIHJvb21faWQ6IGRhdGEucm9vbV9pZCxcbiAgICAgICAgICAgICAgICAgICAgcm9vbV9uYW1lOiBkYXRhLnJvb21fbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgcm9vbV9jYXRlZ29yeTogMixcbiAgICAgICAgICAgICAgICAgICAgcGVyaW9kX25vOiBkYXRhLnBlcmlvZF9ub1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKG15Z2xvYmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnJvb21EYXRhID0gdGVtcFJvb21EYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBzZWxmLl9lbnRlckdhbWVTY2VuZSh0ZW1wUm9vbURhdGEpO1xuICAgICAgICAgICAgfSwgMTAwMDApO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlj5HpgIEgYXJlbmFfZW50ZXIg6K+35rGCXG4gICAgICAgICAgICBzb2NrZXQuc2VuZEFyZW5hRW50ZXIoe1xuICAgICAgICAgICAgICAgIHBlcmlvZF9ubzogZGF0YS5wZXJpb2Rfbm8sXG4gICAgICAgICAgICAgICAgcm9vbV9pZDogZGF0YS5yb29tX2lkXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCfj5/vuI8gW0FyZW5hXSBzb2NrZXQg5oiWIHNlbmRBcmVuYUVudGVyIOaWueazleS4jeWPr+eUqFwiKTtcbiAgICAgICAgICAgIC8vIOmZjee6p+WkhOeQhu+8muebtOaOpei/m+WFpea4uOaIj+WcuuaZr1xuICAgICAgICAgICAgdmFyIHJvb21Db25maWcgPSB7XG4gICAgICAgICAgICAgICAgaWQ6IGRhdGEucm9vbV9pZCxcbiAgICAgICAgICAgICAgICByb29tX25hbWU6IGRhdGEucm9vbV9uYW1lLFxuICAgICAgICAgICAgICAgIHJvb21fY29uZmlnX2lkOiBkYXRhLnJvb21fY29uZmlnX2lkLFxuICAgICAgICAgICAgICAgIHJvb21fY2F0ZWdvcnk6IDIsXG4gICAgICAgICAgICAgICAgbWluX2FyZW5hX2NvaW46IGRhdGEuc2lnbnVwX2ZlZSxcbiAgICAgICAgICAgICAgICBtYXRjaF9yb3VuZHM6IGRhdGEubWF0Y2hfcm91bmRzLFxuICAgICAgICAgICAgICAgIG1hdGNoX2R1cmF0aW9uOiBkYXRhLm1hdGNoX2R1cmF0aW9uXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAobXlnbG9iYWwpIHtcbiAgICAgICAgICAgICAgICBteWdsb2JhbC5jdXJyZW50Um9vbUNvbmZpZyA9IHJvb21Db25maWc7XG4gICAgICAgICAgICAgICAgbXlnbG9iYWwuY3VycmVudFJvb21MZXZlbCA9IGRhdGEucm9vbV9pZDtcbiAgICAgICAgICAgICAgICBteWdsb2JhbC5jdXJyZW50Um9vbU5hbWUgPSBkYXRhLnJvb21fbmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5fZW50ZXJBcmVuYUdhbWVTY2VuZShkYXRhLCByb29tQ29uZmlnKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLy8g8J+Up+OAkOaWsOWinuOAkeernuaKgOWcuuebtOaOpei/m+WFpea4uOaIj+WcuuaZr++8iOacgOWkmuetieW+hTLnp5LvvIlcbiAgICBfZW50ZXJBcmVuYUdhbWVTY2VuZTogZnVuY3Rpb24obWF0Y2hEYXRhLCByb29tQ29uZmlnKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICBcbiAgICAgICAgLy8g5pi+56S6566A55+t5Yqg6L295o+Q56S6XG4gICAgICAgIHRoaXMuX3Nob3dNZXNzYWdlQ2VudGVyKFwi5q2j5Zyo6L+b5YWl56ue5oqA5Zy6Li4uXCIpO1xuICAgICAgICBcbiAgICAgICAgLy8g5p6E6YCg5oi/6Ze05pWw5o2uXG4gICAgICAgIHZhciByb29tRGF0YSA9IHtcbiAgICAgICAgICAgIHJvb21fY29kZTogbWF0Y2hEYXRhLnJvb21fY29kZSB8fCAoXCJhcmVuYV9cIiArIG1hdGNoRGF0YS5wZXJpb2Rfbm8pLFxuICAgICAgICAgICAgcm9vbV9pZDogbWF0Y2hEYXRhLnJvb21faWQsXG4gICAgICAgICAgICByb29tX25hbWU6IG1hdGNoRGF0YS5yb29tX25hbWUsXG4gICAgICAgICAgICByb29tX2NhdGVnb3J5OiAyLCAgLy8g56ue5oqA5Zy6XG4gICAgICAgICAgICBiYXNlX3Njb3JlOiByb29tQ29uZmlnLmJhc2Vfc2NvcmUgfHwgMSxcbiAgICAgICAgICAgIG11bHRpcGxpZXI6IHJvb21Db25maWcubXVsdGlwbGllciB8fCAxLFxuICAgICAgICAgICAgcGVyaW9kX25vOiBtYXRjaERhdGEucGVyaW9kX25vLFxuICAgICAgICAgICAgbWF0Y2hfcm91bmRzOiBtYXRjaERhdGEubWF0Y2hfcm91bmRzXG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyDkv53lrZjmiL/pl7TmlbDmja5cbiAgICAgICAgaWYgKG15Z2xvYmFsKSB7XG4gICAgICAgICAgICBteWdsb2JhbC5yb29tRGF0YSA9IHJvb21EYXRhO1xuICAgICAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YSA9IG15Z2xvYmFsLnBsYXllckRhdGEgfHwge307XG4gICAgICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLmJvdHRvbSA9IHJvb21Db25maWcuYmFzZV9zY29yZSB8fCAxO1xuICAgICAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YS5yYXRlID0gcm9vbUNvbmZpZy5tdWx0aXBsaWVyIHx8IDE7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7jgJHmnIDlpJrnrYnlvoUy56eS5ZCO55u05o6l6L+b5YWl5ri45oiP5Zy65pmvXG4gICAgICAgIHZhciBlbnRlckRlbGF5ID0gNTAwOyAgLy8g6buY6K6k562J5b6FNTAwbXNcbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenOacieetieW+heaVsOaNru+8jOWPr+S7pemAguW9k+W7tumVv1xuICAgICAgICBpZiAobWF0Y2hEYXRhLndhaXRfdGltZSAmJiBtYXRjaERhdGEud2FpdF90aW1lID4gMCkge1xuICAgICAgICAgICAgZW50ZXJEZWxheSA9IE1hdGgubWluKG1hdGNoRGF0YS53YWl0X3RpbWUgKiAxMDAwLCAyMDAwKTsgIC8vIOacgOWkmjLnp5JcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYV0g5bCG5ZyoIFwiICsgZW50ZXJEZWxheSArIFwibXMg5ZCO6L+b5YWl5ri45oiP5Zy65pmvXCIpO1xuICAgICAgICBcbiAgICAgICAgLy8g6K6+572u5a6a5pe25Zmo77yM5bu26L+f6L+b5YWl5ri45oiP5Zy65pmvXG4gICAgICAgIHRoaXMuX2FyZW5hRW50ZXJUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLl9hcmVuYUVudGVyVGltZXIgPSBudWxsO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtBcmVuYV0g6L+b5YWl5ri45oiP5Zy65pmvXCIpO1xuICAgICAgICAgICAgc2VsZi5fZW50ZXJHYW1lU2NlbmUocm9vbURhdGEpO1xuICAgICAgICB9LCBlbnRlckRlbGF5KTtcbiAgICB9LFxuXG4gICAgLy8g8J+Up+OAkOaWsOWinuOAkeS7jumFjee9ruWIneWni+WMluacrOWcsOeKtuaAge+8iOS9nOS4uuWkh+eUqO+8iVxuICAgIF9pbml0TG9jYWxBcmVuYVN0YXR1c0Zyb21Db25maWc6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2FyZW5hUm9vbXMpIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9hcmVuYVJvb21zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcm9vbSA9IHRoaXMuX2FyZW5hUm9vbXNbaV07XG4gICAgICAgICAgICB2YXIgY29uZmlnID0gcm9vbS5jb25maWc7XG4gICAgICAgICAgICB2YXIgcm9vbUlkID0gY29uZmlnLmlkO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlpoLmnpzlt7Lnu4/mnInmnI3liqHnq6/mjqjpgIHnmoTmlbDmja7vvIzot7Pov4dcbiAgICAgICAgICAgIGlmICh0aGlzLl9sb2NhbEFyZW5hU3RhdHVzW3Jvb21JZF0pIGNvbnRpbnVlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDkvb/nlKjmnKzlnLDorqHnrpfkvZzkuLrliJ3lp4vlgLxcbiAgICAgICAgICAgIHZhciBwaGFzZUluZm8gPSB0aGlzLl9jYWxjdWxhdGVQaGFzZUluZm8oY29uZmlnKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5fbG9jYWxBcmVuYVN0YXR1c1tyb29tSWRdID0ge1xuICAgICAgICAgICAgICAgIHBlcmlvZE5vOiBwaGFzZUluZm8ucGVyaW9kTm8sXG4gICAgICAgICAgICAgICAgcGVyaW9kTm9TdHI6IHBoYXNlSW5mby5wZXJpb2ROb1N0ciwgIC8vIOaWsOWinu+8muWtl+espuS4suagvOW8j+acn+WPt1xuICAgICAgICAgICAgICAgIHBoYXNlOiBwaGFzZUluZm8ucGhhc2UsXG4gICAgICAgICAgICAgICAgY291bnRkb3duOiBwaGFzZUluZm8uY291bnRkb3duLFxuICAgICAgICAgICAgICAgIGNhblNpZ251cDogcGhhc2VJbmZvLmNhblNpZ251cCxcbiAgICAgICAgICAgICAgICB0b3RhbFBsYXllcnM6IDAsICAvLyDwn5Sn44CQ5L+u5aSN44CR5Yid5aeL5YyW5oql5ZCN5Lq65pWw5Li6MFxuICAgICAgICAgICAgICAgIHN0YXR1c1RleHQ6IFwiXCIsXG4gICAgICAgICAgICAgICAgbGFzdFVwZGF0ZTogbm93LFxuICAgICAgICAgICAgICAgIGlzTG9jYWxDYWxjdWxhdGVkOiB0cnVlICAvLyDmoIforrDkuLrmnKzlnLDorqHnrpdcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOaYvuekulxuICAgICAgICB0aGlzLl91cGRhdGVDb3VudGRvd25Gcm9tTG9jYWxDYWNoZSgpO1xuICAgIH0sXG5cbiAgICAvLyDwn5Sn44CQ5paw5aKe44CR5pS25Yiw5pyN5Yqh56uv5o6o6YCB5pe277yM5pu05paw5pys5Zyw54q25oCB57yT5a2YXG4gICAgX29uQXJlbmFTdGF0dXNQdXNoOiBmdW5jdGlvbihhcmVuYXMpIHtcbiAgICAgICAgaWYgKCFhcmVuYXMpIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICBcbiAgICAgICAgLy8g8J+UpyDosIPor5XvvJrmiZPljbDmlLbliLDnmoTlrozmlbTmlbDmja5cbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOacrOWcsOeKtuaAgee8k+WtmFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZW5hcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGFyZW5hID0gYXJlbmFzW2ldO1xuICAgICAgICAgICAgdmFyIHJvb21JZCA9IGFyZW5hLnJvb21faWQ7XG4gICAgICAgICAgICB2YXIgbmV3UGVyaW9kTm9TdHIgPSBhcmVuYS5wZXJpb2Rfbm9fc3RyIHx8IGFyZW5hLnBlcmlvZE5vU3RyIHx8IFwiXCI7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKcg6LCD6K+V77ya5omT5Y2w5q+P5Liq56ue5oqA5Zy655qEIHRvdGFsX3BsYXllcnNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeajgOafpeacn+WPt+aYr+WQpuWPmOWMlu+8jOWmguaenOWPmOWMluWImea4hemZpOeUqOaIt+aKpeWQjeeKtuaAgVxuICAgICAgICAgICAgdmFyIG9sZFN0YXR1cyA9IHRoaXMuX2xvY2FsQXJlbmFTdGF0dXNbcm9vbUlkXTtcbiAgICAgICAgICAgIGlmIChvbGRTdGF0dXMgJiYgb2xkU3RhdHVzLnBlcmlvZE5vU3RyICYmIG5ld1BlcmlvZE5vU3RyICYmIG9sZFN0YXR1cy5wZXJpb2ROb1N0ciAhPT0gbmV3UGVyaW9kTm9TdHIpIHtcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5LiN5Zyo5pyf5Y+35Y+Y5YyW5pe25YWz6Zet5by556qXXG4gICAgICAgICAgICAgICAgLy8g5by556qX5bqU6K+l5Y+q5Zyo5Lul5LiL5oOF5Ya15YWz6Zet77yaXG4gICAgICAgICAgICAgICAgLy8gMS4g546p5a6254K55Ye7XCLov5vlhaVcIuaIllwi5Y+W5raIXCLmjInpkq5cbiAgICAgICAgICAgICAgICAvLyAyLiDmnI3liqHnq6/lj5HpgIEgYXJlbmFfY2xvc2VfZGlhbG9nIOa2iOaBr++8iOi/m+WFpemYtuauteWAkuiuoeaXtue7k+adn++8iVxuICAgICAgICAgICAgICAgIC8vIDMuIOeOqeWutuaJi+WKqOWFs+mXreW8ueeql1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOa4hemZpOeUqOaIt+WcqOivpeaIv+mXtOeahOaKpeWQjeeKtuaAgVxuICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuYXJlbmFEYXRhICYmIHdpbmRvdy5hcmVuYURhdGEuX3NpZ25lZFVwQXJlbmFzICYmIHdpbmRvdy5hcmVuYURhdGEuX3NpZ25lZFVwQXJlbmFzW3Jvb21JZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFBlcmlvZE5vID0gd2luZG93LmFyZW5hRGF0YS5fc2lnbmVkVXBBcmVuYXNbcm9vbUlkXS5wZXJpb2RObztcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHdpbmRvdy5hcmVuYURhdGEuX3NpZ25lZFVwQXJlbmFzW3Jvb21JZF07XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5hcmVuYURhdGEuc2F2ZVRvTG9jYWwgJiYgd2luZG93LmFyZW5hRGF0YS5zYXZlVG9Mb2NhbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5L+d5a2Y5pyN5Yqh56uv5o6o6YCB55qE54q25oCB77yI5pSv5oyB5paw5a2X5q6177yJXG4gICAgICAgICAgICB0aGlzLl9sb2NhbEFyZW5hU3RhdHVzW3Jvb21JZF0gPSB7XG4gICAgICAgICAgICAgICAgcGVyaW9kTm86IGFyZW5hLnBlcmlvZF9ubyxcbiAgICAgICAgICAgICAgICBwZXJpb2ROb1N0cjogbmV3UGVyaW9kTm9TdHIsXG4gICAgICAgICAgICAgICAgcGhhc2U6IGFyZW5hLnBoYXNlIHx8IDAsXG4gICAgICAgICAgICAgICAgY291bnRkb3duOiBhcmVuYS5jb3VudGRvd24sXG4gICAgICAgICAgICAgICAgY2FuU2lnbnVwOiBhcmVuYS5jYW5fc2lnbnVwLFxuICAgICAgICAgICAgICAgIHRvdGFsUGxheWVyczogYXJlbmEudG90YWxfcGxheWVycyB8fCBhcmVuYS50b3RhbFBsYXllcnMgfHwgMCxcbiAgICAgICAgICAgICAgICBzdGF0dXNUZXh0OiBhcmVuYS5zdGF0dXNfdGV4dCB8fCBhcmVuYS5zdGF0dXNUZXh0IHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgbGFzdFVwZGF0ZTogbm93LFxuICAgICAgICAgICAgICAgIGlzTG9jYWxDYWxjdWxhdGVkOiBmYWxzZSAgLy8g5pyN5Yqh56uv5o6o6YCBXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDnq4vljbPmm7TmlrDmmL7npLpcbiAgICAgICAgdGhpcy5fdXBkYXRlQ291bnRkb3duRnJvbUxvY2FsQ2FjaGUoKTtcbiAgICB9LFxuXG4gICAgLy8g8J+Up+OAkOaWsOWinuOAkeavj+enkuabtOaWsOacrOWcsOWAkuiuoeaXtu+8iOWHjzHvvIlcbiAgICBfdXBkYXRlTG9jYWxDb3VudGRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2xvY2FsQXJlbmFTdGF0dXMpIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICB2YXIgbmVlZFVwZGF0ZSA9IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgLy8g6YGN5Y6G5omA5pyJ56ue5oqA5Zy677yM5q+P56eS5YePMVxuICAgICAgICBmb3IgKHZhciByb29tSWQgaW4gdGhpcy5fbG9jYWxBcmVuYVN0YXR1cykge1xuICAgICAgICAgICAgdmFyIHN0YXR1cyA9IHRoaXMuX2xvY2FsQXJlbmFTdGF0dXNbcm9vbUlkXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeWuuemUmeacuuWItu+8muWmguaenOi2hei/hzM156eS5rKh5pS25Yiw5pyN5Yqh56uv5o6o6YCB77yM5L2/55So5pys5Zyw6K6h566X5qCh5YeGXG4gICAgICAgICAgICB2YXIgdGltZVNpbmNlTGFzdFVwZGF0ZSA9IChub3cgLSBzdGF0dXMubGFzdFVwZGF0ZSkgLyAxMDAwO1xuICAgICAgICAgICAgaWYgKHRpbWVTaW5jZUxhc3RVcGRhdGUgPiAzNSkge1xuICAgICAgICAgICAgICAgIC8vIOaJvuWIsOWvueW6lOeahOmFjee9rlxuICAgICAgICAgICAgICAgIHZhciBjb25maWcgPSB0aGlzLl9nZXRBcmVuYUNvbmZpZ0J5Um9vbUlkKHBhcnNlSW50KHJvb21JZCkpO1xuICAgICAgICAgICAgICAgIGlmIChjb25maWcpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBoYXNlSW5mbyA9IHRoaXMuX2NhbGN1bGF0ZVBoYXNlSW5mbyhjb25maWcpO1xuICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5qOA5p+l5pyf5Y+35piv5ZCm5Y+Y5YyW77yM5aaC5p6c5Y+Y5YyW5YiZ6YeN572u5oql5ZCN5Lq65pWw5ZKM55So5oi35oql5ZCN54q25oCBXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMucGVyaW9kTm9TdHIgIT09IHBoYXNlSW5mby5wZXJpb2ROb1N0ciAmJiBwaGFzZUluZm8ucGVyaW9kTm9TdHIgIT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1cy50b3RhbFBsYXllcnMgPSAwOyAgLy8g5pyf5Y+35Y+Y5YyW77yM6YeN572u5oql5ZCN5Lq65pWwXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkuI3lnKjmnJ/lj7flj5jljJbml7blhbPpl63lvLnnqpdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOW8ueeql+W6lOivpeWPquWcqOi/m+WFpemYtuauteWAkuiuoeaXtue7k+adn+WQjueUseacjeWKoeerr+eahCBhcmVuYV9jbG9zZV9kaWFsb2cg5raI5oGv5YWz6ZetXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHmuIXpmaTnlKjmiLflnKjor6XmiL/pl7TnmoTmiqXlkI3nirbmgIFcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuYXJlbmFEYXRhICYmIHdpbmRvdy5hcmVuYURhdGEuX3NpZ25lZFVwQXJlbmFzICYmIHdpbmRvdy5hcmVuYURhdGEuX3NpZ25lZFVwQXJlbmFzW3Jvb21JZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2xkUGVyaW9kTm8gPSB3aW5kb3cuYXJlbmFEYXRhLl9zaWduZWRVcEFyZW5hc1tyb29tSWRdLnBlcmlvZE5vO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB3aW5kb3cuYXJlbmFEYXRhLl9zaWduZWRVcEFyZW5hc1tyb29tSWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5hcmVuYURhdGEuc2F2ZVRvTG9jYWwgJiYgd2luZG93LmFyZW5hRGF0YS5zYXZlVG9Mb2NhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5waGFzZSA9IHBoYXNlSW5mby5waGFzZTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmNvdW50ZG93biA9IHBoYXNlSW5mby5jb3VudGRvd247XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5jYW5TaWdudXAgPSBwaGFzZUluZm8uY2FuU2lnbnVwO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMucGVyaW9kTm8gPSBwaGFzZUluZm8ucGVyaW9kTm87XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5wZXJpb2ROb1N0ciA9IHBoYXNlSW5mby5wZXJpb2ROb1N0cjtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmlzTG9jYWxDYWxjdWxhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgbmVlZFVwZGF0ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlj6rlr7nmnInlgJLorqHml7bnmoTlh48xXG4gICAgICAgICAgICBpZiAoc3RhdHVzLmNvdW50ZG93biA+IDApIHtcbiAgICAgICAgICAgICAgICBzdGF0dXMuY291bnRkb3duLS07XG4gICAgICAgICAgICAgICAgbmVlZFVwZGF0ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5YCS6K6h5pe25Yia5Yia5Y+Y5Li6MO+8jOeri+WNs+S9v+eUqOacrOWcsOiuoeeul+WIh+aNoumYtuautVxuICAgICAgICAgICAgICAgIGlmIChzdGF0dXMuY291bnRkb3duID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb25maWcgPSB0aGlzLl9nZXRBcmVuYUNvbmZpZ0J5Um9vbUlkKHBhcnNlSW50KHJvb21JZCkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGhhc2VJbmZvID0gdGhpcy5fY2FsY3VsYXRlUGhhc2VJbmZvKGNvbmZpZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5qOA5p+l5pyf5Y+35piv5ZCm5Y+Y5YyW77yM5aaC5p6c5Y+Y5YyW5YiZ6YeN572u5oql5ZCN5Lq65pWw5ZKM55So5oi35oql5ZCN54q25oCBXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdHVzLnBlcmlvZE5vU3RyICE9PSBwaGFzZUluZm8ucGVyaW9kTm9TdHIgJiYgcGhhc2VJbmZvLnBlcmlvZE5vU3RyICE9PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzLnRvdGFsUGxheWVycyA9IDA7ICAvLyDmnJ/lj7flj5jljJbvvIzph43nva7miqXlkI3kurrmlbBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5LiN5Zyo5pyf5Y+35Y+Y5YyW5pe25YWz6Zet5by556qXXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5by556qX5bqU6K+l5Y+q5Zyo6L+b5YWl6Zi25q615YCS6K6h5pe257uT5p2f5ZCO55Sx5pyN5Yqh56uv55qEIGFyZW5hX2Nsb3NlX2RpYWxvZyDmtojmga/lhbPpl61cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5riF6Zmk55So5oi35Zyo6K+l5oi/6Ze055qE5oql5ZCN54q25oCBXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5hcmVuYURhdGEgJiYgd2luZG93LmFyZW5hRGF0YS5fc2lnbmVkVXBBcmVuYXMgJiYgd2luZG93LmFyZW5hRGF0YS5fc2lnbmVkVXBBcmVuYXNbcm9vbUlkXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2xkUGVyaW9kTm8gPSB3aW5kb3cuYXJlbmFEYXRhLl9zaWduZWRVcEFyZW5hc1tyb29tSWRdLnBlcmlvZE5vO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgd2luZG93LmFyZW5hRGF0YS5fc2lnbmVkVXBBcmVuYXNbcm9vbUlkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmFyZW5hRGF0YS5zYXZlVG9Mb2NhbCAmJiB3aW5kb3cuYXJlbmFEYXRhLnNhdmVUb0xvY2FsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzLnBoYXNlID0gcGhhc2VJbmZvLnBoYXNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmNvdW50ZG93biA9IHBoYXNlSW5mby5jb3VudGRvd247XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXMuY2FuU2lnbnVwID0gcGhhc2VJbmZvLmNhblNpZ251cDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1cy5wZXJpb2RObyA9IHBoYXNlSW5mby5wZXJpb2RObztcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1cy5wZXJpb2ROb1N0ciA9IHBoYXNlSW5mby5wZXJpb2ROb1N0cjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5pyJ5Y+Y5YyW77yM5pu05paw5pi+56S6XG4gICAgICAgIGlmIChuZWVkVXBkYXRlKSB7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVDb3VudGRvd25Gcm9tTG9jYWxDYWNoZSgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyDwn5Sn44CQ5paw5aKe44CR6K6h566X6Zi25q615L+h5oGv77yI55So5LqO5pys5Zyw5qCh5YeG77yJXG4gICAgX2NhbGN1bGF0ZVBoYXNlSW5mbzogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7XG4gICAgICAgICAgICBwaGFzZTogMCxcbiAgICAgICAgICAgIGNvdW50ZG93bjogLTEsXG4gICAgICAgICAgICBjYW5TaWdudXA6IGZhbHNlLFxuICAgICAgICAgICAgcGVyaW9kTm86IDAsXG4gICAgICAgICAgICBwZXJpb2ROb1N0cjogXCJcIiAgLy8g5paw5aKe77ya5a2X56ym5Liy5qC85byP5pyf5Y+3XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICB2YXIgbWF0Y2hUaW1lUmFuZ2VzID0gY29uZmlnLm1hdGNoX3RpbWVfcmFuZ2VzIHx8IGNvbmZpZy5tYXRjaFRpbWVSYW5nZXM7XG4gICAgICAgIHZhciBtYXRjaER1cmF0aW9uID0gY29uZmlnLm1hdGNoX2R1cmF0aW9uIHx8IGNvbmZpZy5tYXRjaER1cmF0aW9uIHx8IGNvbmZpZy5pbnRlcnZhbF9taW51dGVzIHx8IGNvbmZpZy5pbnRlcnZhbE1pbnV0ZXMgfHwgNTtcbiAgICAgICAgdmFyIHJvb21UeXBlID0gY29uZmlnLnJvb21fdHlwZSB8fCBjb25maWcucm9vbVR5cGUgfHwgMDtcbiAgICAgICAgXG4gICAgICAgIGlmICghbWF0Y2hUaW1lUmFuZ2VzIHx8ICFtYXRjaER1cmF0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHJhbmdlcyA9IHR5cGVvZiBtYXRjaFRpbWVSYW5nZXMgPT09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShtYXRjaFRpbWVSYW5nZXMpIDogbWF0Y2hUaW1lUmFuZ2VzO1xuICAgICAgICAgICAgaWYgKCFyYW5nZXMgfHwgcmFuZ2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRNaW51dGVzID0gbm93LmdldEhvdXJzKCkgKiA2MCArIG5vdy5nZXRNaW51dGVzKCk7XG4gICAgICAgICAgICB2YXIgY3VycmVudFNlY29uZHMgPSBub3cuZ2V0U2Vjb25kcygpO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRUb3RhbFNlY29uZHMgPSBjdXJyZW50TWludXRlcyAqIDYwICsgY3VycmVudFNlY29uZHM7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOaJvuWIsOW9k+WJjeaJgOWcqOeahOaXtumXtOautVxuICAgICAgICAgICAgdmFyIGN1cnJlbnRSYW5nZSA9IG51bGw7XG4gICAgICAgICAgICB2YXIgcmFuZ2VTdGFydE1pbnV0ZXMgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcmFuZ2UgPSByYW5nZXNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHN0YXJ0UGFydHMgPSByYW5nZS5zdGFydC5zcGxpdCgnOicpO1xuICAgICAgICAgICAgICAgIHZhciBlbmRQYXJ0cyA9IHJhbmdlLmVuZC5zcGxpdCgnOicpO1xuICAgICAgICAgICAgICAgIHZhciBzdGFydE1pbiA9IHBhcnNlSW50KHN0YXJ0UGFydHNbMF0pICogNjAgKyBwYXJzZUludChzdGFydFBhcnRzWzFdKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kTWluID0gcGFyc2VJbnQoZW5kUGFydHNbMF0pICogNjAgKyBwYXJzZUludChlbmRQYXJ0c1sxXSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRNaW51dGVzID49IHN0YXJ0TWluICYmIGN1cnJlbnRNaW51dGVzIDw9IGVuZE1pbikge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50UmFuZ2UgPSByYW5nZTtcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2VTdGFydE1pbnV0ZXMgPSBzdGFydE1pbjtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRSYW5nZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOiuoeeul+S7juW8gOi1m+aXtumXtOWIsOeOsOWcqOe7j+i/h+eahOenkuaVsFxuICAgICAgICAgICAgdmFyIHJhbmdlU3RhcnRTZWNvbmRzID0gcmFuZ2VTdGFydE1pbnV0ZXMgKiA2MDtcbiAgICAgICAgICAgIHZhciBlbGFwc2VkU2Vjb25kcyA9IGN1cnJlbnRUb3RhbFNlY29uZHMgLSByYW5nZVN0YXJ0U2Vjb25kcztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeS9v+eUqOmFjee9rueahCBtYXRjaER1cmF0aW9u77yI5YiG6ZKf77yJ77yM5LiO5pyN5Yqh56uv5L+d5oyB5LiA6Ie0XG4gICAgICAgICAgICAvLyDmnI3liqHnq6/lt7Lkv67mlLnkuLrkvb/nlKggbWF0Y2hEdXJhdGlvbiDphY3nva7vvIzlrqLmiLfnq6/kuZ/lv4XpobvkuIDoh7RcbiAgICAgICAgICAgIC8vIOavj+acn+aAu+aXtumVv++8iOenku+8iT0gbWF0Y2hEdXJhdGlvbu+8iOWIhumSn++8iSogNjBcbiAgICAgICAgICAgIHZhciBwZXJpb2RUb3RhbFNlY29uZHMgPSBtYXRjaER1cmF0aW9uICogNjA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWHhuWkh+mYtuaute+8muWbuuWumjYw56eS77yIMeWIhumSn++8iVxuICAgICAgICAgICAgdmFyIHByZXBhcmVTZWNvbmRzID0gNjA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOiuoeeul+W9k+WJjeacn+WPt1xuICAgICAgICAgICAgdmFyIHBlcmlvZE5vID0gTWF0aC5mbG9vcihlbGFwc2VkU2Vjb25kcyAvIHBlcmlvZFRvdGFsU2Vjb25kcykgKyAxO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDorqHnrpfmnKzmnJ/lhoXnu4/ov4fnmoTnp5LmlbBcbiAgICAgICAgICAgIHZhciBwZXJpb2RFbGFwc2VkID0gZWxhcHNlZFNlY29uZHMgJSBwZXJpb2RUb3RhbFNlY29uZHM7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHnlJ/miJDlrZfnrKbkuLLmoLzlvI/mnJ/lj7dcbiAgICAgICAgICAgIC8vIOaWsOagvOW8jzogWVlNTUREICsg5oi/6Ze0SUQoMuS9jSkgKyDmnJ/luo/lj7coNOS9jSkgPSAxMuS9jVxuICAgICAgICAgICAgLy8g56S65L6LOiAyNjA1MDYwMTAwMzQgPSAyMDI25bm0NeaciDbml6XvvIzmiL/pl7RJRD0x77yM56ysMDAzNOacn1xuICAgICAgICAgICAgdmFyIHllYXIgPSBTdHJpbmcobm93LmdldEZ1bGxZZWFyKCkpLnNsaWNlKC0yKTsgIC8vIOWPluWQjuS4pOS9jVxuICAgICAgICAgICAgdmFyIG1vbnRoID0gU3RyaW5nKG5vdy5nZXRNb250aCgpICsgMSkucGFkU3RhcnQoMiwgJzAnKTtcbiAgICAgICAgICAgIHZhciBkYXkgPSBTdHJpbmcobm93LmdldERhdGUoKSkucGFkU3RhcnQoMiwgJzAnKTtcbiAgICAgICAgICAgIHZhciBkYXRlU3RyID0geWVhciArIG1vbnRoICsgZGF5OyAgLy8gWVlNTUREICg25L2NKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmiL/pl7RJRCAoMuS9jSlcbiAgICAgICAgICAgIHZhciByb29tSWQgPSBjb25maWcuaWQgfHwgY29uZmlnLnJvb21faWQgfHwgMDtcbiAgICAgICAgICAgIHZhciByb29tSWRTdHIgPSBTdHJpbmcocm9vbUlkICUgMTAwKS5wYWRTdGFydCgyLCAnMCcpOyAgLy8g5Y+W5ZCO5Lik5L2NXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOacn+W6j+WPtyAoNOS9jSlcbiAgICAgICAgICAgIHZhciBzZXFTdHIgPSBTdHJpbmcocGVyaW9kTm8pLnBhZFN0YXJ0KDQsICcwJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBwZXJpb2ROb1N0ciA9IGRhdGVTdHIgKyByb29tSWRTdHIgKyBzZXFTdHI7ICAvLyDmgLvlhbExMuS9jVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDnoa7lrprpmLbmrrVcbiAgICAgICAgICAgIGlmIChwZXJpb2RFbGFwc2VkIDwgcHJlcGFyZVNlY29uZHMpIHtcbiAgICAgICAgICAgICAgICAvLyDlh4blpIfpmLbmrrVcbiAgICAgICAgICAgICAgICByZXN1bHQucGhhc2UgPSAxO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5jb3VudGRvd24gPSBwcmVwYXJlU2Vjb25kcyAtIHBlcmlvZEVsYXBzZWQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmNhblNpZ251cCA9IGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDmiqXlkI3pmLbmrrVcbiAgICAgICAgICAgICAgICByZXN1bHQucGhhc2UgPSAyO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5jb3VudGRvd24gPSBwZXJpb2RUb3RhbFNlY29uZHMgLSBwZXJpb2RFbGFwc2VkO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5jYW5TaWdudXAgPSByZXN1bHQuY291bnRkb3duID4gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc3VsdC5wZXJpb2RObyA9IHBlcmlvZE5vO1xuICAgICAgICAgICAgcmVzdWx0LnBlcmlvZE5vU3RyID0gcGVyaW9kTm9TdHI7XG4gICAgICAgICAgICBcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuKPsCBbX2NhbGN1bGF0ZVBoYXNlSW5mb10gZXJyb3I6XCIsIGUpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvLyDwn5Sn44CQ5paw5aKe44CR5qC55o2ucm9vbUlk6I635Y+W56ue5oqA5Zy66YWN572uXG4gICAgX2dldEFyZW5hQ29uZmlnQnlSb29tSWQ6IGZ1bmN0aW9uKHJvb21JZCkge1xuICAgICAgICBpZiAoIXRoaXMuX2FyZW5hUm9vbXMpIHJldHVybiBudWxsO1xuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9hcmVuYVJvb21zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fYXJlbmFSb29tc1tpXS5jb25maWcuaWQgPT09IHJvb21JZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9hcmVuYVJvb21zW2ldLmNvbmZpZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG4gICAgLy8g8J+Up+OAkOaWsOWinuOAkeS7juacrOWcsOe8k+WtmOabtOaWsOWAkuiuoeaXtuaYvuekulxuICAgIF91cGRhdGVDb3VudGRvd25Gcm9tTG9jYWxDYWNoZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5fYXJlbmFSb29tcyB8fCAhdGhpcy5fbG9jYWxBcmVuYVN0YXR1cykgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNhcmRQYW5lbCA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcIkNhcmRDb250YWluZXJcIik7XG4gICAgICAgIHZhciBjb3VudGRvd25Db250YWluZXIgPSBjYXJkUGFuZWwgPyBjYXJkUGFuZWwuZ2V0Q2hpbGRCeU5hbWUoXCJBcmVuYUNvdW50ZG93bnNcIikgOiBudWxsO1xuICAgICAgICB2YXIgYnV0dG9uQ29udGFpbmVyID0gY2FyZFBhbmVsID8gY2FyZFBhbmVsLmdldENoaWxkQnlOYW1lKFwiQXJlbmFTaWdudXBCdXR0b25zXCIpIDogbnVsbDtcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fYXJlbmFSb29tcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJvb20gPSB0aGlzLl9hcmVuYVJvb21zW2ldO1xuICAgICAgICAgICAgdmFyIGNvbmZpZyA9IHJvb20uY29uZmlnO1xuICAgICAgICAgICAgdmFyIHJvb21JZCA9IGNvbmZpZy5pZDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6I635Y+W5pys5Zyw57yT5a2Y55qE54q25oCBXG4gICAgICAgICAgICB2YXIgbG9jYWxTdGF0dXMgPSB0aGlzLl9sb2NhbEFyZW5hU3RhdHVzW3Jvb21JZF07XG4gICAgICAgICAgICBpZiAoIWxvY2FsU3RhdHVzKSBjb250aW51ZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6I635Y+W54q25oCB6aG56IqC54K5XG4gICAgICAgICAgICB2YXIgcm9vbVN0YXR1c0l0ZW0gPSBjb3VudGRvd25Db250YWluZXIgPyBjb3VudGRvd25Db250YWluZXIuZ2V0Q2hpbGRCeU5hbWUoXCJSb29tU3RhdHVzSXRlbV9cIiArIHJvb21JZCkgOiBudWxsO1xuICAgICAgICAgICAgaWYgKCFyb29tU3RhdHVzSXRlbSkgY29udGludWU7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBwZXJpb2RMYWJlbCA9IHJvb21TdGF0dXNJdGVtLmdldENoaWxkQnlOYW1lKFwiUGVyaW9kTGFiZWxcIik7XG4gICAgICAgICAgICB2YXIgdGl0bGVMYWJlbCA9IHJvb21TdGF0dXNJdGVtLmdldENoaWxkQnlOYW1lKFwiVGl0bGVMYWJlbFwiKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6I635Y+W5oql5ZCN5oyJ6ZKuXG4gICAgICAgICAgICB2YXIgc2lnbnVwQnRuID0gYnV0dG9uQ29udGFpbmVyID8gYnV0dG9uQ29udGFpbmVyLmdldENoaWxkQnlOYW1lKFwiU2lnbnVwQnRuX1wiICsgcm9vbUlkKSA6IG51bGw7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOabtOaWsOaXtuacn+WPt+aYvuekuu+8iOS9v+eUqOaWsOeahOWtl+espuS4suagvOW8j+acn+WPt++8iVxuICAgICAgICAgICAgaWYgKHBlcmlvZExhYmVsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBlcmlvZExhYmVsQ29tcCA9IHBlcmlvZExhYmVsLmdldENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgICAgICAgICAgdmFyIHBlcmlvZE5vU3RyID0gbG9jYWxTdGF0dXMucGVyaW9kX25vX3N0ciB8fCBsb2NhbFN0YXR1cy5wZXJpb2ROb1N0ciB8fCBsb2NhbFN0YXR1cy5wZXJpb2RObztcbiAgICAgICAgICAgICAgICBpZiAocGVyaW9kTm9TdHIgJiYgbG9jYWxTdGF0dXMucGhhc2UgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcGVyaW9kTGFiZWxDb21wLnN0cmluZyA9IFwi5pyf5Y+3OiBcIiArIHBlcmlvZE5vU3RyO1xuICAgICAgICAgICAgICAgICAgICBwZXJpb2RMYWJlbC5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjE1LCAwKTsgIC8vIOmHkeiJslxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBlcmlvZExhYmVsQ29tcC5zdHJpbmcgPSBcIuacn+WPtzogLS1cIjtcbiAgICAgICAgICAgICAgICAgICAgcGVyaW9kTGFiZWwuY29sb3IgPSBjYy5jb2xvcigxODAsIDE4MCwgMTgwKTsgIC8vIOeBsOiJslxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5pu05paw5YCS6K6h5pe25pi+56S6XG4gICAgICAgICAgICBpZiAodGl0bGVMYWJlbCkge1xuICAgICAgICAgICAgICAgIHZhciB0aXRsZUxhYmVsQ29tcCA9IHRpdGxlTGFiZWwuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgICAgICAgICB2YXIgcGhhc2UgPSBsb2NhbFN0YXR1cy5waGFzZSB8fCAwO1xuICAgICAgICAgICAgICAgIHZhciB0b3RhbFBsYXllcnMgPSBsb2NhbFN0YXR1cy50b3RhbF9wbGF5ZXJzIHx8IGxvY2FsU3RhdHVzLnRvdGFsUGxheWVycyB8fCAwO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChwaGFzZSA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlh4blpIfpmLbmrrVcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlY3MgPSBsb2NhbFN0YXR1cy5jb3VudGRvd24gfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGVMYWJlbENvbXAuc3RyaW5nID0gXCLlh4blpIfkuK0gXCIgKyBzZWNzICsgXCLnp5JcIjtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGVMYWJlbC5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjAwLCAxMDApOyAgLy8g5qmZ6ImyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwaGFzZSA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICAvLyDmiqXlkI3pmLbmrrVcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1pbnMgPSBNYXRoLmZsb29yKChsb2NhbFN0YXR1cy5jb3VudGRvd24gfHwgMCkgLyA2MCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWNzID0gKGxvY2FsU3RhdHVzLmNvdW50ZG93biB8fCAwKSAlIDYwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY291bnRkb3duU3RyID0gKG1pbnMgPCAxMCA/ICcwJyA6ICcnKSArIG1pbnMgKyAnOicgKyAoc2VjcyA8IDEwID8gJzAnIDogJycpICsgc2VjcztcbiAgICAgICAgICAgICAgICAgICAgdGl0bGVMYWJlbENvbXAuc3RyaW5nID0gXCLmiqXlkI3kuK0gXCIgKyBjb3VudGRvd25TdHIgKyBcIiAoXCIgKyB0b3RhbFBsYXllcnMgKyBcIuS6uilcIjtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGVMYWJlbC5jb2xvciA9IGNjLmNvbG9yKDAsIDI1NSwgMTAwKTsgIC8vIOe7v+iJslxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOacqumFjee9ruavlOi1m+aXtumXtOaIlui9ruasoVxuICAgICAgICAgICAgICAgICAgICB0aXRsZUxhYmVsQ29tcC5zdHJpbmcgPSBcIuaaguacquW8gOaUvlwiO1xuICAgICAgICAgICAgICAgICAgICB0aXRsZUxhYmVsLmNvbG9yID0gY2MuY29sb3IoMjAwLCAyMDAsIDIwMCk7ICAvLyDmtYXngbDoibJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOabtOaWsOaKpeWQjeaMiemSrueKtuaAgVxuICAgICAgICAgICAgaWYgKHNpZ251cEJ0bikge1xuICAgICAgICAgICAgICAgIHZhciBzcHJpdGUgPSBzaWdudXBCdG4uZ2V0Q29tcG9uZW50KGNjLlNwcml0ZSk7XG4gICAgICAgICAgICAgICAgdmFyIGJ1dHRvbiA9IHNpZ251cEJ0bi5nZXRDb21wb25lbnQoY2MuQnV0dG9uKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDmjInpkq7lsLrlr7jvvJoxNjB4NjVcbiAgICAgICAgICAgICAgICBzcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NO1xuICAgICAgICAgICAgICAgIHZhciBmaXhlZFdpZHRoID0gMTYwO1xuICAgICAgICAgICAgICAgIHZhciBmaXhlZEhlaWdodCA9IDY1O1xuICAgICAgICAgICAgICAgIHNpZ251cEJ0bi5zZXRDb250ZW50U2l6ZShjYy5zaXplKGZpeGVkV2lkdGgsIGZpeGVkSGVpZ2h0KSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHBoYXNlID0gbG9jYWxTdGF0dXMucGhhc2UgfHwgMDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAocGhhc2UgIT09IDIgfHwgIWxvY2FsU3RhdHVzLmNhblNpZ251cCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDkuI3lnKjmiqXlkI3pmLbmrrXmiJbkuI3og73miqXlkI3vvJrmmL7npLrnpoHnlKjmjInpkq5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NpZ251cEJ0bkZyYW1lcyAmJiB0aGlzLl9zaWdudXBCdG5GcmFtZXNbJ2J0bl9ub19iYW9taW5nJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwcml0ZS5zcHJpdGVGcmFtZSA9IHRoaXMuX3NpZ251cEJ0bkZyYW1lc1snYnRuX25vX2Jhb21pbmcnXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzaWdudXBCdG4uYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJ1dHRvbikgYnV0dG9uLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyDmo4Dmn6XmmK/lkKblt7LmiqXlkI1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzU2lnbmVkVXAgPSB3aW5kb3cuYXJlbmFEYXRhICYmIHdpbmRvdy5hcmVuYURhdGEuaXNTaWduZWRVcChyb29tSWQpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzU2lnbmVkVXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOW3suaKpeWQje+8muaYvuekuuWPlua2iOaKpeWQjVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NpZ251cEJ0bkZyYW1lcyAmJiB0aGlzLl9zaWdudXBCdG5GcmFtZXNbJ2J0bl9xdXhpYW9iYW9taW5nJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcHJpdGUuc3ByaXRlRnJhbWUgPSB0aGlzLl9zaWdudXBCdG5GcmFtZXNbJ2J0bl9xdXhpYW9iYW9taW5nJ107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzaWdudXBCdG4uYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChidXR0b24pIGJ1dHRvbi5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOacquaKpeWQje+8muaYvuekuuaKpeWQjeaMiemSrlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NpZ251cEJ0bkZyYW1lcyAmJiB0aGlzLl9zaWdudXBCdG5GcmFtZXNbJ2J0bl9iYW9taW5nJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcHJpdGUuc3ByaXRlRnJhbWUgPSB0aGlzLl9zaWdudXBCdG5GcmFtZXNbJ2J0bl9iYW9taW5nJ107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzaWdudXBCdG4uYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChidXR0b24pIGJ1dHRvbi5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyDmoLnmja7mnI3liqHnq6/mjqjpgIHmm7TmlrDlgJLorqHml7bmmL7npLpcbiAgICAvLyDwn5Sn44CQ5L+d55WZ44CR5YW85a655pen6YC76L6R77yM5L2G5paw6YC76L6R5L2/55SoIF9vbkFyZW5hU3RhdHVzUHVzaFxuICAgIF91cGRhdGVDb3VudGRvd25Gcm9tU2VydmVyOiBmdW5jdGlvbihhcmVuYXMpIHtcbiAgICAgICAgLy8g55u05o6l6LCD55So5paw55qE5aSE55CG5Ye95pWwXG4gICAgICAgIHRoaXMuX29uQXJlbmFTdGF0dXNQdXNoKGFyZW5hcyk7XG4gICAgfSxcbiAgICBcbiAgICAvLyDmm7TmlrDlgJLorqHml7bmmL7npLpcbiAgICAvLyDwn5Sn44CQ5L+u5pS544CR546w5Zyo5L2/55So5pys5Zyw57yT5a2Y77yM5LiN5YaN5pys5Zyw6K6h566XXG4gICAgX3VwZGF0ZUNvdW50ZG93bkRpc3BsYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDnm7TmjqXkvb/nlKjmnKzlnLDnvJPlrZjmm7TmlrDmmL7npLpcbiAgICAgICAgdGhpcy5fdXBkYXRlQ291bnRkb3duRnJvbUxvY2FsQ2FjaGUoKTtcbiAgICB9LFxuICAgIFxuICAgIC8vIOabtOaWsOernuaKgOWcuuaKpeWQjeeKtuaAgVVJ77yI5L2/55So5Zu+54mH6LWE5rqQ77yJXG4gICAgX3VwZGF0ZUFyZW5hU2lnbnVwU3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g55u05o6l6LCD55So5YCS6K6h5pe25pu05paw5Ye95pWw77yM5a6D5bey57uP5YyF5ZCr5LqG5oyJ6ZKu54q25oCB5pu05pawXG4gICAgICAgIHRoaXMuX3VwZGF0ZUNvdW50ZG93bkRpc3BsYXkoKTtcbiAgICB9LFxuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOaYvuekuuWKoOi9vei/m+W6puadoVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIF9zaG93TG9hZGluZ1Byb2dyZXNzOiBmdW5jdGlvbihyb29tQ29uZmlnLCBwbGF5ZXJHb2xkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5bnlLvluIPlsLrlr7hcbiAgICAgICAgdmFyIGNhbnZhcyA9IHRoaXMubm9kZS5nZXRDb21wb25lbnQoY2MuQ2FudmFzKSB8fCBjYy5maW5kKCdDYW52YXMnKS5nZXRDb21wb25lbnQoY2MuQ2FudmFzKTtcbiAgICAgICAgdmFyIHNjcmVlbkhlaWdodCA9IGNhbnZhcyA/IGNhbnZhcy5kZXNpZ25SZXNvbHV0aW9uLmhlaWdodCA6IDcyMDtcbiAgICAgICAgdmFyIHNjcmVlbldpZHRoID0gY2FudmFzID8gY2FudmFzLmRlc2lnblJlc29sdXRpb24ud2lkdGggOiAxMjgwO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65Yqg6L2955WM6Z2i5a655Zmo77yI5YWo5bGP77yJXG4gICAgICAgIHZhciBsb2FkaW5nTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTG9hZGluZ1Byb2dyZXNzTm9kZVwiKTtcbiAgICAgICAgbG9hZGluZ05vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZShzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSk7XG4gICAgICAgIGxvYWRpbmdOb2RlLmFuY2hvclggPSAwLjU7XG4gICAgICAgIGxvYWRpbmdOb2RlLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIGxvYWRpbmdOb2RlLnggPSAwO1xuICAgICAgICBsb2FkaW5nTm9kZS55ID0gMDtcbiAgICAgICAgbG9hZGluZ05vZGUuekluZGV4ID0gMzAwMDtcbiAgICAgICAgbG9hZGluZ05vZGUucGFyZW50ID0gdGhpcy5ub2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg5Y2K6YCP5piO6buR6Imy6IOM5pmvXG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkJnXCIpO1xuICAgICAgICBiZ05vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZShzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSk7XG4gICAgICAgIHZhciBiZ0dyYXBoaWNzID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIGJnR3JhcGhpY3MuZmlsbENvbG9yID0gY2MuY29sb3IoMjAsIDIwLCA0MCwgMjUwKTtcbiAgICAgICAgYmdHcmFwaGljcy5yZWN0KC1zY3JlZW5XaWR0aC8yLCAtc2NyZWVuSGVpZ2h0LzIsIHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpO1xuICAgICAgICBiZ0dyYXBoaWNzLmZpbGwoKTtcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IGxvYWRpbmdOb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg6KOF6aWw5oCn6IOM5pmv5Zu+5qGIXG4gICAgICAgIHRoaXMuX2FkZExvYWRpbmdEZWNvcmF0aW9ucyhsb2FkaW5nTm9kZSwgc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCk7XG4gICAgICAgIFxuICAgICAgICAvLyDmoIfpopjmloflrZdcbiAgICAgICAgdmFyIHRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIik7XG4gICAgICAgIHRpdGxlTm9kZS55ID0gMTUwO1xuICAgICAgICB2YXIgdGl0bGVMYWJlbCA9IHRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICB0aXRsZUxhYmVsLnN0cmluZyA9IFwi5paX5Zyw5Li7XCI7XG4gICAgICAgIHRpdGxlTGFiZWwuZm9udFNpemUgPSA1NjtcbiAgICAgICAgdGl0bGVMYWJlbC5saW5lSGVpZ2h0ID0gNzI7XG4gICAgICAgIHRpdGxlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgdGl0bGVOb2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyMTUsIDApO1xuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg5qCH6aKY5o+P6L65XG4gICAgICAgIHZhciB0aXRsZU91dGxpbmUgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSk7XG4gICAgICAgIHRpdGxlT3V0bGluZS5jb2xvciA9IGNjLmNvbG9yKDEzOSwgNjksIDE5KTtcbiAgICAgICAgdGl0bGVPdXRsaW5lLndpZHRoID0gMztcbiAgICAgICAgdGl0bGVOb2RlLnBhcmVudCA9IGxvYWRpbmdOb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g5oi/6Ze05ZCN56ewXG4gICAgICAgIHZhciByb29tTmFtZU5vZGUgPSBuZXcgY2MuTm9kZShcIlJvb21OYW1lXCIpO1xuICAgICAgICByb29tTmFtZU5vZGUueSA9IDgwO1xuICAgICAgICB2YXIgcm9vbU5hbWVMYWJlbCA9IHJvb21OYW1lTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICByb29tTmFtZUxhYmVsLnN0cmluZyA9IFwi6L+b5YWl44CQXCIgKyByb29tQ29uZmlnLnJvb21fbmFtZSArIFwi44CRXCI7XG4gICAgICAgIHJvb21OYW1lTGFiZWwuZm9udFNpemUgPSAzMjtcbiAgICAgICAgcm9vbU5hbWVMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICByb29tTmFtZU5vZGUuY29sb3IgPSBjYy5jb2xvcigyMDAsIDIwMCwgMjIwKTtcbiAgICAgICAgcm9vbU5hbWVOb2RlLnBhcmVudCA9IGxvYWRpbmdOb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yqg6L295o+Q56S65paH5a2XXG4gICAgICAgIHZhciB0aXBOb2RlID0gbmV3IGNjLk5vZGUoXCJUaXBcIik7XG4gICAgICAgIHRpcE5vZGUueSA9IC0xMDA7XG4gICAgICAgIHZhciB0aXBMYWJlbCA9IHRpcE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgdGlwTGFiZWwuc3RyaW5nID0gXCLmraPlnKjliqDovb3otYTmupAuLi5cIjtcbiAgICAgICAgdGlwTGFiZWwuZm9udFNpemUgPSAyNDtcbiAgICAgICAgdGlwTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgdGlwTm9kZS5jb2xvciA9IGNjLmNvbG9yKDE1MCwgMTUwLCAxNzApO1xuICAgICAgICB0aXBOb2RlLnBhcmVudCA9IGxvYWRpbmdOb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g6L+b5bqm5p2h6IOM5pmvXG4gICAgICAgIHZhciBwcm9ncmVzc0JnID0gbmV3IGNjLk5vZGUoXCJQcm9ncmVzc0JnXCIpO1xuICAgICAgICBwcm9ncmVzc0JnLnNldENvbnRlbnRTaXplKGNjLnNpemUoNTAwLCAzMCkpO1xuICAgICAgICBwcm9ncmVzc0JnLnkgPSAtMTYwO1xuICAgICAgICB2YXIgcHJvZ3Jlc3NCZ0dyYXBoaWNzID0gcHJvZ3Jlc3NCZy5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICBwcm9ncmVzc0JnR3JhcGhpY3MuZmlsbENvbG9yID0gY2MuY29sb3IoNDAsIDQwLCA2MCwgMjU1KTtcbiAgICAgICAgcHJvZ3Jlc3NCZ0dyYXBoaWNzLnJvdW5kUmVjdCgtMjUwLCAtMTUsIDUwMCwgMzAsIDE1KTtcbiAgICAgICAgcHJvZ3Jlc3NCZ0dyYXBoaWNzLmZpbGwoKTtcbiAgICAgICAgcHJvZ3Jlc3NCZ0dyYXBoaWNzLnN0cm9rZUNvbG9yID0gY2MuY29sb3IoODAsIDgwLCAxMDApO1xuICAgICAgICBwcm9ncmVzc0JnR3JhcGhpY3MubGluZVdpZHRoID0gMjtcbiAgICAgICAgcHJvZ3Jlc3NCZ0dyYXBoaWNzLnJvdW5kUmVjdCgtMjUwLCAtMTUsIDUwMCwgMzAsIDE1KTtcbiAgICAgICAgcHJvZ3Jlc3NCZ0dyYXBoaWNzLnN0cm9rZSgpO1xuICAgICAgICBwcm9ncmVzc0JnLnBhcmVudCA9IGxvYWRpbmdOb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g6L+b5bqm5p2h5aGr5YWFXG4gICAgICAgIHZhciBwcm9ncmVzc0ZpbGwgPSBuZXcgY2MuTm9kZShcIlByb2dyZXNzRmlsbFwiKTtcbiAgICAgICAgcHJvZ3Jlc3NGaWxsLnkgPSAtMTYwO1xuICAgICAgICB2YXIgcHJvZ3Jlc3NGaWxsR3JhcGhpY3MgPSBwcm9ncmVzc0ZpbGwuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgcHJvZ3Jlc3NGaWxsLnBhcmVudCA9IGxvYWRpbmdOb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g6L+b5bqm55m+5YiG5q+U5paH5a2XXG4gICAgICAgIHZhciBwZXJjZW50Tm9kZSA9IG5ldyBjYy5Ob2RlKFwiUGVyY2VudFwiKTtcbiAgICAgICAgcGVyY2VudE5vZGUueSA9IC0xNjA7XG4gICAgICAgIHZhciBwZXJjZW50TGFiZWwgPSBwZXJjZW50Tm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBwZXJjZW50TGFiZWwuc3RyaW5nID0gXCIwJVwiO1xuICAgICAgICBwZXJjZW50TGFiZWwuZm9udFNpemUgPSAyMDtcbiAgICAgICAgcGVyY2VudExhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIHBlcmNlbnROb2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgIHBlcmNlbnROb2RlLnBhcmVudCA9IGxvYWRpbmdOb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g5bqV6YOo5o+Q56S6XG4gICAgICAgIHZhciBib3R0b21UaXBOb2RlID0gbmV3IGNjLk5vZGUoXCJCb3R0b21UaXBcIik7XG4gICAgICAgIGJvdHRvbVRpcE5vZGUueSA9IC0yMjA7XG4gICAgICAgIHZhciBib3R0b21UaXBMYWJlbCA9IGJvdHRvbVRpcE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgYm90dG9tVGlwTGFiZWwuc3RyaW5nID0gXCLmraPlnKjov57mjqXmnI3liqHlmaguLi5cIjtcbiAgICAgICAgYm90dG9tVGlwTGFiZWwuZm9udFNpemUgPSAxODtcbiAgICAgICAgYm90dG9tVGlwTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgYm90dG9tVGlwTm9kZS5jb2xvciA9IGNjLmNvbG9yKDEwMCwgMTAwLCAxMjApO1xuICAgICAgICBib3R0b21UaXBOb2RlLnBhcmVudCA9IGxvYWRpbmdOb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yqg6L295o+Q56S65paH5a2X5pWw57uEXG4gICAgICAgIHZhciBsb2FkaW5nVGlwcyA9IFtcbiAgICAgICAgICAgIFwi5q2j5Zyo5Yqg6L296LWE5rqQLi4uXCIsXG4gICAgICAgICAgICBcIuato+WcqOi/nuaOpeacjeWKoeWZqC4uLlwiLFxuICAgICAgICAgICAgXCLmraPlnKjojrflj5bmiL/pl7TliJfooaguLi5cIixcbiAgICAgICAgICAgIFwi5q2j5Zyo5YeG5aSH5ri45oiP5pWw5o2uLi4uXCIsXG4gICAgICAgICAgICBcIuWNs+Wwhui/m+WFpeaIv+mXtC4uLlwiXG4gICAgICAgIF07XG4gICAgICAgIFxuICAgICAgICAvLyDov5vluqbliqjnlLtcbiAgICAgICAgdmFyIHByb2dyZXNzID0gMDtcbiAgICAgICAgdmFyIHRhcmdldFByb2dyZXNzID0gMTAwO1xuICAgICAgICB2YXIgdGlwSW5kZXggPSAwO1xuICAgICAgICBcbiAgICAgICAgdmFyIHVwZGF0ZVByb2dyZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAocHJvZ3Jlc3MgPj0gdGFyZ2V0UHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAvLyDov5vluqblrozmiJDvvIzmmL7npLrmiL/pl7TliJfooajlnLrmma9cbiAgICAgICAgICAgICAgICBzZWxmLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdOb2RlICYmIGxvYWRpbmdOb2RlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRpbmdOb2RlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93Um9vbUxpc3RTY2VuZShyb29tQ29uZmlnLCBwbGF5ZXJHb2xkKTtcbiAgICAgICAgICAgICAgICB9LCAwLjMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5aKe5Yqg6L+b5bqmXG4gICAgICAgICAgICBwcm9ncmVzcyArPSAyO1xuICAgICAgICAgICAgaWYgKHByb2dyZXNzID4gdGFyZ2V0UHJvZ3Jlc3MpIHByb2dyZXNzID0gdGFyZ2V0UHJvZ3Jlc3M7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOabtOaWsOi/m+W6puadoeWhq+WFhVxuICAgICAgICAgICAgdmFyIGZpbGxXaWR0aCA9IChwcm9ncmVzcyAvIDEwMCkgKiA0ODA7XG4gICAgICAgICAgICBwcm9ncmVzc0ZpbGxHcmFwaGljcy5jbGVhcigpO1xuICAgICAgICAgICAgaWYgKGZpbGxXaWR0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAvLyDmuJDlj5joibLmlYjmnpxcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0ZpbGxHcmFwaGljcy5maWxsQ29sb3IgPSBjYy5jb2xvcig3NiwgMTc1LCA4MCk7XG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3NGaWxsR3JhcGhpY3Mucm91bmRSZWN0KC0yNDAsIC0xMiwgZmlsbFdpZHRoLCAyNCwgMTIpO1xuICAgICAgICAgICAgICAgIHByb2dyZXNzRmlsbEdyYXBoaWNzLmZpbGwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5pu05paw55m+5YiG5q+U5paH5a2XXG4gICAgICAgICAgICBwZXJjZW50TGFiZWwuc3RyaW5nID0gcHJvZ3Jlc3MgKyBcIiVcIjtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5pu05paw5Yqg6L295o+Q56S65paH5a2XXG4gICAgICAgICAgICB2YXIgbmV3VGlwSW5kZXggPSBNYXRoLmZsb29yKHByb2dyZXNzIC8gMjApO1xuICAgICAgICAgICAgaWYgKG5ld1RpcEluZGV4IDwgbG9hZGluZ1RpcHMubGVuZ3RoICYmIG5ld1RpcEluZGV4ICE9PSB0aXBJbmRleCkge1xuICAgICAgICAgICAgICAgIHRpcEluZGV4ID0gbmV3VGlwSW5kZXg7XG4gICAgICAgICAgICAgICAgdGlwTGFiZWwuc3RyaW5nID0gbG9hZGluZ1RpcHNbdGlwSW5kZXhdO1xuICAgICAgICAgICAgICAgIGJvdHRvbVRpcExhYmVsLnN0cmluZyA9IGxvYWRpbmdUaXBzW3RpcEluZGV4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2VsZi5zY2hlZHVsZU9uY2UodXBkYXRlUHJvZ3Jlc3MsIDAuMDUpO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLy8g5byA5aeL6L+b5bqm5Yqo55S7XG4gICAgICAgIHVwZGF0ZVByb2dyZXNzKCk7XG4gICAgfSxcbiAgICBcbiAgICAvLyDmt7vliqDliqDovb3nlYzpnaLoo4XppbBcbiAgICBfYWRkTG9hZGluZ0RlY29yYXRpb25zOiBmdW5jdGlvbihwYXJlbnROb2RlLCBzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSB7XG4gICAgICAgIC8vIOa3u+WKoOaJkeWFi+eJjOijhemlsO+8iOWbm+inku+8iVxuICAgICAgICB2YXIgY2FyZFN5bWJvbHMgPSBbXCLimaBcIiwgXCLimaVcIiwgXCLimaNcIiwgXCLimaZcIl07XG4gICAgICAgIHZhciBjYXJkQ29sb3JzID0gW1xuICAgICAgICAgICAgY2MuY29sb3IoNTAsIDUwLCA3MCwgMTAwKSxcbiAgICAgICAgICAgIGNjLmNvbG9yKDE4MCwgNTAsIDUwLCAxMDApLFxuICAgICAgICAgICAgY2MuY29sb3IoNTAsIDUwLCA3MCwgMTAwKSxcbiAgICAgICAgICAgIGNjLmNvbG9yKDE4MCwgNTAsIDUwLCAxMDApXG4gICAgICAgIF07XG4gICAgICAgIFxuICAgICAgICB2YXIgcG9zaXRpb25zID0gW1xuICAgICAgICAgICAgY2MudjIoLXNjcmVlbldpZHRoLzIgKyA4MCwgc2NyZWVuSGVpZ2h0LzIgLSA4MCksXG4gICAgICAgICAgICBjYy52MihzY3JlZW5XaWR0aC8yIC0gODAsIHNjcmVlbkhlaWdodC8yIC0gODApLFxuICAgICAgICAgICAgY2MudjIoLXNjcmVlbldpZHRoLzIgKyA4MCwgLXNjcmVlbkhlaWdodC8yICsgODApLFxuICAgICAgICAgICAgY2MudjIoc2NyZWVuV2lkdGgvMiAtIDgwLCAtc2NyZWVuSGVpZ2h0LzIgKyA4MClcbiAgICAgICAgXTtcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc3ltYm9sTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ2FyZFN5bWJvbFwiICsgaSk7XG4gICAgICAgICAgICBzeW1ib2xOb2RlLnNldFBvc2l0aW9uKHBvc2l0aW9uc1tpXSk7XG4gICAgICAgICAgICB2YXIgc3ltYm9sTGFiZWwgPSBzeW1ib2xOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgICAgICBzeW1ib2xMYWJlbC5zdHJpbmcgPSBjYXJkU3ltYm9sc1tpXTtcbiAgICAgICAgICAgIHN5bWJvbExhYmVsLmZvbnRTaXplID0gNjA7XG4gICAgICAgICAgICBzeW1ib2xOb2RlLmNvbG9yID0gY2FyZENvbG9yc1tpXTtcbiAgICAgICAgICAgIHN5bWJvbE5vZGUucGFyZW50ID0gcGFyZW50Tm9kZTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g5pi+56S65oi/6Ze05YiX6KGo5Zy65pmv77yI5YWo5bGP5ri45oiP55WM6Z2i77yJXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgX3Nob3dSb29tTGlzdFNjZW5lOiBmdW5jdGlvbihyb29tQ29uZmlnLCBwbGF5ZXJHb2xkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8vIOenu+mZpOaXp+eahOeVjOmdolxuICAgICAgICB2YXIgb2xkU2NlbmUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJSb29tTGlzdFNjZW5lXCIpO1xuICAgICAgICBpZiAob2xkU2NlbmUpIG9sZFNjZW5lLmRlc3Ryb3koKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPlueUu+W4g+WwuuWvuFxuICAgICAgICB2YXIgY2FudmFzID0gdGhpcy5ub2RlLmdldENvbXBvbmVudChjYy5DYW52YXMpIHx8IGNjLmZpbmQoJ0NhbnZhcycpLmdldENvbXBvbmVudChjYy5DYW52YXMpO1xuICAgICAgICB2YXIgc2NyZWVuSGVpZ2h0ID0gY2FudmFzID8gY2FudmFzLmRlc2lnblJlc29sdXRpb24uaGVpZ2h0IDogNzIwO1xuICAgICAgICB2YXIgc2NyZWVuV2lkdGggPSBjYW52YXMgPyBjYW52YXMuZGVzaWduUmVzb2x1dGlvbi53aWR0aCA6IDEyODA7XG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7rlhajlsY/miL/pl7TliJfooajlnLrmma9cbiAgICAgICAgdmFyIHNjZW5lTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUm9vbUxpc3RTY2VuZVwiKTtcbiAgICAgICAgc2NlbmVOb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCkpO1xuICAgICAgICBzY2VuZU5vZGUuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgc2NlbmVOb2RlLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIHNjZW5lTm9kZS54ID0gMDtcbiAgICAgICAgc2NlbmVOb2RlLnkgPSAwO1xuICAgICAgICBzY2VuZU5vZGUuekluZGV4ID0gMjUwMDtcbiAgICAgICAgc2NlbmVOb2RlLnBhcmVudCA9IHRoaXMubm9kZTtcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09IOiDjOaZr+WxgiA9PT09PVxuICAgICAgICB0aGlzLl9jcmVhdGVSb29tTGlzdEJhY2tncm91bmQoc2NlbmVOb2RlLCBzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KTtcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09IOmhtumDqOagh+mimOWMuuWfnyA9PT09PVxuICAgICAgICB0aGlzLl9jcmVhdGVSb29tTGlzdEhlYWRlcihzY2VuZU5vZGUsIHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQsIHJvb21Db25maWcpO1xuICAgICAgICBcbiAgICAgICAgLy8gPT09PT0g5pON5L2c5oyJ6ZKu5Yy65Z+fID09PT09XG4gICAgICAgIHRoaXMuX2NyZWF0ZVJvb21MaXN0QWN0aW9ucyhzY2VuZU5vZGUsIHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQsIHJvb21Db25maWcsIHBsYXllckdvbGQpO1xuICAgICAgICBcbiAgICAgICAgLy8gPT09PT0g5oi/6Ze05YiX6KGo5Yy65Z+fID09PT09XG4gICAgICAgIHRoaXMuX2NyZWF0ZVJvb21MaXN0Q29udGVudChzY2VuZU5vZGUsIHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQsIHJvb21Db25maWcsIHBsYXllckdvbGQpO1xuICAgICAgICBcbiAgICAgICAgLy8gPT09PT0g5bqV6YOo5L+h5oGv5qCPID09PT09XG4gICAgICAgIHRoaXMuX2NyZWF0ZVJvb21MaXN0Rm9vdGVyKHNjZW5lTm9kZSwgc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCwgcGxheWVyR29sZCwgcm9vbUNvbmZpZyk7XG4gICAgfSxcbiAgICBcbiAgICAvLyDliJvlu7rog4zmma9cbiAgICBfY3JlYXRlUm9vbUxpc3RCYWNrZ3JvdW5kOiBmdW5jdGlvbihwYXJlbnROb2RlLCBzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSB7XG4gICAgICAgIC8vIOS4u+iDjOaZr1xuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCZ0xheWVyXCIpO1xuICAgICAgICBiZ05vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZShzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSk7XG4gICAgICAgIFxuICAgICAgICB2YXIgYmdHcmFwaGljcyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICBiZ0dyYXBoaWNzLmZpbGxDb2xvciA9IGNjLmNvbG9yKDIwLCAyNSwgNDUsIDI1NSk7XG4gICAgICAgIGJnR3JhcGhpY3MucmVjdCgtc2NyZWVuV2lkdGgvMiwgLXNjcmVlbkhlaWdodC8yLCBzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KTtcbiAgICAgICAgYmdHcmFwaGljcy5maWxsKCk7XG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSBwYXJlbnROb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g6KOF6aWw6L655qGGXG4gICAgICAgIHZhciBib3JkZXJOb2RlID0gbmV3IGNjLk5vZGUoXCJCb3JkZXJcIik7XG4gICAgICAgIHZhciBib3JkZXJHcmFwaGljcyA9IGJvcmRlck5vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgYm9yZGVyR3JhcGhpY3Muc3Ryb2tlQ29sb3IgPSBjYy5jb2xvcigxODAsIDE0MCwgNjAsIDE1MCk7XG4gICAgICAgIGJvcmRlckdyYXBoaWNzLmxpbmVXaWR0aCA9IDM7XG4gICAgICAgIGJvcmRlckdyYXBoaWNzLnJvdW5kUmVjdCgtc2NyZWVuV2lkdGgvMiArIDUsIC1zY3JlZW5IZWlnaHQvMiArIDUsIHNjcmVlbldpZHRoIC0gMTAsIHNjcmVlbkhlaWdodCAtIDEwLCAxMCk7XG4gICAgICAgIGJvcmRlckdyYXBoaWNzLnN0cm9rZSgpO1xuICAgICAgICBib3JkZXJOb2RlLnBhcmVudCA9IHBhcmVudE5vZGU7XG4gICAgICAgIFxuICAgICAgICAvLyDop5LokL3oo4XppbBcbiAgICAgICAgdmFyIGNvcm5lcnMgPSBbXG4gICAgICAgICAgICB7IHg6IC1zY3JlZW5XaWR0aC8yICsgMzAsIHk6IHNjcmVlbkhlaWdodC8yIC0gMzAsIHJvdDogMCB9LFxuICAgICAgICAgICAgeyB4OiBzY3JlZW5XaWR0aC8yIC0gMzAsIHk6IHNjcmVlbkhlaWdodC8yIC0gMzAsIHJvdDogOTAgfSxcbiAgICAgICAgICAgIHsgeDogc2NyZWVuV2lkdGgvMiAtIDMwLCB5OiAtc2NyZWVuSGVpZ2h0LzIgKyAzMCwgcm90OiAxODAgfSxcbiAgICAgICAgICAgIHsgeDogLXNjcmVlbldpZHRoLzIgKyAzMCwgeTogLXNjcmVlbkhlaWdodC8yICsgMzAsIHJvdDogMjcwIH1cbiAgICAgICAgXTtcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29ybmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNvcm5lciA9IGNvcm5lcnNbaV07XG4gICAgICAgICAgICB2YXIgY29ybmVyTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ29ybmVyXCIgKyBpKTtcbiAgICAgICAgICAgIGNvcm5lck5vZGUuc2V0UG9zaXRpb24oY29ybmVyLngsIGNvcm5lci55KTtcbiAgICAgICAgICAgIGNvcm5lck5vZGUuYW5nbGUgPSAtY29ybmVyLnJvdDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGNnID0gY29ybmVyTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICAgICAgY2cuc3Ryb2tlQ29sb3IgPSBjYy5jb2xvcigyMjAsIDE4MCwgODAsIDIwMCk7XG4gICAgICAgICAgICBjZy5saW5lV2lkdGggPSAyO1xuICAgICAgICAgICAgY2cubW92ZVRvKDAsIDApO1xuICAgICAgICAgICAgY2cubGluZVRvKDQwLCAwKTtcbiAgICAgICAgICAgIGNnLmxpbmVUbyg0MCwgMTUpO1xuICAgICAgICAgICAgY2cubW92ZVRvKDAsIDApO1xuICAgICAgICAgICAgY2cubGluZVRvKDAsIDQwKTtcbiAgICAgICAgICAgIGNnLmxpbmVUbygxNSwgNDApO1xuICAgICAgICAgICAgY2cuc3Ryb2tlKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvcm5lck5vZGUucGFyZW50ID0gcGFyZW50Tm9kZTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLy8g5Yib5bu66aG26YOo5qCH6aKY5Yy65Z+fXG4gICAgX2NyZWF0ZVJvb21MaXN0SGVhZGVyOiBmdW5jdGlvbihwYXJlbnROb2RlLCBzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0LCByb29tQ29uZmlnKSB7XG4gICAgICAgIHZhciBoZWFkZXJZID0gc2NyZWVuSGVpZ2h0LzIgLSA1NTtcbiAgICAgICAgdmFyIGhlYWRlckhlaWdodCA9IDgwOyAgLy8g5aKe5Yqg5qCH6aKY5qCP6auY5bqmXG4gICAgICAgIFxuICAgICAgICAvLyDmoIfpopjog4zmma9cbiAgICAgICAgdmFyIGhlYWRlckJnID0gbmV3IGNjLk5vZGUoXCJIZWFkZXJCZ1wiKTtcbiAgICAgICAgaGVhZGVyQmcuc2V0Q29udGVudFNpemUoY2Muc2l6ZShzY3JlZW5XaWR0aCAtIDYwLCBoZWFkZXJIZWlnaHQpKTtcbiAgICAgICAgaGVhZGVyQmcuc2V0UG9zaXRpb24oMCwgaGVhZGVyWSk7XG4gICAgICAgIFxuICAgICAgICB2YXIgaGcgPSBoZWFkZXJCZy5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICBoZy5maWxsQ29sb3IgPSBjYy5jb2xvcigzNSwgMzAsIDUwLCAyNDApO1xuICAgICAgICBoZy5yb3VuZFJlY3QoLShzY3JlZW5XaWR0aCAtIDYwKS8yLCAtaGVhZGVySGVpZ2h0LzIsIHNjcmVlbldpZHRoIC0gNjAsIGhlYWRlckhlaWdodCwgOCk7XG4gICAgICAgIGhnLmZpbGwoKTtcbiAgICAgICAgaGcuc3Ryb2tlQ29sb3IgPSBjYy5jb2xvcigxODAsIDE0MCwgNjAsIDIwMCk7XG4gICAgICAgIGhnLmxpbmVXaWR0aCA9IDI7XG4gICAgICAgIGhnLnJvdW5kUmVjdCgtKHNjcmVlbldpZHRoIC0gNjApLzIsIC1oZWFkZXJIZWlnaHQvMiwgc2NyZWVuV2lkdGggLSA2MCwgaGVhZGVySGVpZ2h0LCA4KTtcbiAgICAgICAgaGcuc3Ryb2tlKCk7XG4gICAgICAgIGhlYWRlckJnLnBhcmVudCA9IHBhcmVudE5vZGU7XG4gICAgICAgIFxuICAgICAgICAvLyDlt6bkvqfoo4XppbBcbiAgICAgICAgdmFyIGxlZnREZWNvID0gbmV3IGNjLk5vZGUoXCJMZWZ0RGVjb1wiKTtcbiAgICAgICAgbGVmdERlY28uc2V0UG9zaXRpb24oLXNjcmVlbldpZHRoLzIgKyA4MCwgaGVhZGVyWSk7XG4gICAgICAgIHZhciBsZCA9IGxlZnREZWNvLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIGxkLmZpbGxDb2xvciA9IGNjLmNvbG9yKDIwMCwgMTYwLCA2MCwgMjIwKTtcbiAgICAgICAgbGQuY2lyY2xlKDAsIDAsIDgpO1xuICAgICAgICBsZC5maWxsKCk7XG4gICAgICAgIGxlZnREZWNvLnBhcmVudCA9IHBhcmVudE5vZGU7XG4gICAgICAgIFxuICAgICAgICAvLyDlj7Pkvqfoo4XppbBcbiAgICAgICAgdmFyIHJpZ2h0RGVjbyA9IG5ldyBjYy5Ob2RlKFwiUmlnaHREZWNvXCIpO1xuICAgICAgICByaWdodERlY28uc2V0UG9zaXRpb24oc2NyZWVuV2lkdGgvMiAtIDgwLCBoZWFkZXJZKTtcbiAgICAgICAgdmFyIHJkID0gcmlnaHREZWNvLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIHJkLmZpbGxDb2xvciA9IGNjLmNvbG9yKDIwMCwgMTYwLCA2MCwgMjIwKTtcbiAgICAgICAgcmQuY2lyY2xlKDAsIDAsIDgpO1xuICAgICAgICByZC5maWxsKCk7XG4gICAgICAgIHJpZ2h0RGVjby5wYXJlbnQgPSBwYXJlbnROb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g5oi/6Ze05ZCN56ewIC0g5L2N5LqO5qCH6aKY5qCP5LiK5Y2K6YOo5YiGXG4gICAgICAgIHZhciB0aXRsZVRleHQgPSBuZXcgY2MuTm9kZShcIlRpdGxlVGV4dFwiKTtcbiAgICAgICAgdGl0bGVUZXh0LnNldFBvc2l0aW9uKDAsIGhlYWRlclkgKyAxMik7ICAvLyDkuIrnp7vliLDmoIfpopjmoI/kuIrljYrpg6jliIZcbiAgICAgICAgdGl0bGVUZXh0LmFuY2hvclggPSAwLjU7XG4gICAgICAgIHRpdGxlVGV4dC5hbmNob3JZID0gMC41O1xuICAgICAgICBcbiAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSB0aXRsZVRleHQuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgdGl0bGVMYWJlbC5zdHJpbmcgPSByb29tQ29uZmlnLnJvb21fbmFtZSB8fCBcIua4uOaIj+aIv+mXtFwiO1xuICAgICAgICB0aXRsZUxhYmVsLmZvbnRTaXplID0gMjg7ICAvLyDosIPmlbTlrZfkvZPlpKflsI9cbiAgICAgICAgdGl0bGVMYWJlbC5saW5lSGVpZ2h0ID0gMzY7XG4gICAgICAgIHRpdGxlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgdGl0bGVUZXh0LmNvbG9yID0gY2MuY29sb3IoMjU1LCAyMjAsIDEwMCk7XG4gICAgICAgIFxuICAgICAgICB2YXIgdGl0bGVPdXRsaW5lID0gdGl0bGVUZXh0LmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpO1xuICAgICAgICB0aXRsZU91dGxpbmUuY29sb3IgPSBjYy5jb2xvcig4MCwgNTAsIDApO1xuICAgICAgICB0aXRsZU91dGxpbmUud2lkdGggPSAyO1xuICAgICAgICB0aXRsZVRleHQucGFyZW50ID0gcGFyZW50Tm9kZTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWJr+agh+mimCAtIOS9jeS6juagh+mimOagj+S4i+WNiumDqOWIhu+8jOS4juagh+mimOWIhuW8gFxuICAgICAgICB2YXIgc3ViVGV4dCA9IG5ldyBjYy5Ob2RlKFwiU3ViVGV4dFwiKTtcbiAgICAgICAgc3ViVGV4dC5zZXRQb3NpdGlvbigwLCBoZWFkZXJZIC0gMTQpOyAgLy8g5LiL56e75Yiw5qCH6aKY5qCP5LiL5Y2K6YOo5YiGXG4gICAgICAgIHN1YlRleHQuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgc3ViVGV4dC5hbmNob3JZID0gMC41O1xuICAgICAgICBcbiAgICAgICAgdmFyIHN1YkxhYmVsID0gc3ViVGV4dC5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBzdWJMYWJlbC5zdHJpbmcgPSBcIuW6leWIhiBcIiArIChyb29tQ29uZmlnLmJhc2Vfc2NvcmUgfHwgMSkgKyBcIiAgwrcgIOWAjeeOhyBcIiArIChyb29tQ29uZmlnLm11bHRpcGxpZXIgfHwgMSkgKyBcInhcIjtcbiAgICAgICAgc3ViTGFiZWwuZm9udFNpemUgPSAxODsgIC8vIOWinuWkp+Wtl+S9k1xuICAgICAgICBzdWJMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICBzdWJUZXh0LmNvbG9yID0gY2MuY29sb3IoMjAwLCAxODAsIDE0MCk7XG4gICAgICAgIHN1YlRleHQucGFyZW50ID0gcGFyZW50Tm9kZTtcbiAgICB9LFxuICAgIFxuICAgIC8vIOWIm+W7uuaTjeS9nOaMiemSruWMuuWfnyAtIOeugOa0gea4heaZsOeahOiuvuiuoVxuICAgIF9jcmVhdGVSb29tTGlzdEFjdGlvbnM6IGZ1bmN0aW9uKHBhcmVudE5vZGUsIHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQsIHJvb21Db25maWcsIHBsYXllckdvbGQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgLy8g5pON5L2c5qCP6IOM5pmvIC0g5aKe5Yqg6auY5bqm5Lul5a6557qz5pu05aSn55qE5YWD57SgXG4gICAgICAgIHZhciBhY3Rpb25CYXJZID0gc2NyZWVuSGVpZ2h0LzIgLSAxMjU7XG4gICAgICAgIHZhciBhY3Rpb25CYXJIZWlnaHQgPSA2NTsgIC8vIOWinuWKoOmrmOW6plxuICAgICAgICBcbiAgICAgICAgdmFyIGFjdGlvbkJhckJnID0gbmV3IGNjLk5vZGUoXCJBY3Rpb25CYXJCZ1wiKTtcbiAgICAgICAgYWN0aW9uQmFyQmcuc2V0UG9zaXRpb24oMCwgYWN0aW9uQmFyWSk7XG4gICAgICAgIHZhciBhYmcgPSBhY3Rpb25CYXJCZy5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICBhYmcuZmlsbENvbG9yID0gY2MuY29sb3IoMzAsIDI3LCA0NSwgMjMwKTtcbiAgICAgICAgYWJnLnJvdW5kUmVjdCgtc2NyZWVuV2lkdGgvMiArIDMwLCAtYWN0aW9uQmFySGVpZ2h0LzIsIHNjcmVlbldpZHRoIC0gNjAsIGFjdGlvbkJhckhlaWdodCwgNik7XG4gICAgICAgIGFiZy5maWxsKCk7XG4gICAgICAgIGFjdGlvbkJhckJnLnBhcmVudCA9IHBhcmVudE5vZGU7XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PSDlt6bkvqfvvJrmiL/pl7Tlj7fovpPlhaXlkozliqDlhaXmjInpkq4gPT09PT1cbiAgICAgICAgdmFyIGxlZnRYID0gLXNjcmVlbldpZHRoLzIgKyAyMDA7ICAvLyDosIPmlbTkvY3nva5cbiAgICAgICAgXG4gICAgICAgIC8vIOi+k+WFpeahhiAtIOWinuWKoOWuveW6plxuICAgICAgICB2YXIgcm9vbUNvZGVJbnB1dCA9IHRoaXMuX2NyZWF0ZVNpbXBsZUlucHV0Qm94KFxuICAgICAgICAgICAgXCLovpPlhaXmiL/pl7Tlj7dcIixcbiAgICAgICAgICAgIGxlZnRYLCBhY3Rpb25CYXJZLFxuICAgICAgICAgICAgMTgwLCA0NCAgLy8g5aKe5Yqg5bC65a+4XG4gICAgICAgICk7XG4gICAgICAgIHJvb21Db2RlSW5wdXQucGFyZW50ID0gcGFyZW50Tm9kZTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWKoOWFpeaIv+mXtOaMiemSriAtIOWinuWKoOWuveW6plxuICAgICAgICB2YXIgam9pbkJ0biA9IHRoaXMuX2NyZWF0ZUFjdGlvbkJ1dHRvbihcbiAgICAgICAgICAgIFwi5Yqg5YWl5oi/6Ze0XCIsXG4gICAgICAgICAgICBjYy5jb2xvcig3NiwgMTc1LCA4MCksICAvLyDnu7/oibJcbiAgICAgICAgICAgIGxlZnRYICsgMTYwLCBhY3Rpb25CYXJZLFxuICAgICAgICAgICAgMTEwLCA0NCwgIC8vIOWinuWKoOWwuuWvuFxuICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gcGFyZW50Tm9kZS5nZXRDaGlsZEJ5TmFtZShcIlJvb21Db2RlSW5wdXRcIik7XG4gICAgICAgICAgICAgICAgdmFyIGVkaXRCb3ggPSBpbnB1dCA/IGlucHV0LmdldENvbXBvbmVudChjYy5FZGl0Qm94KSA6IG51bGw7XG4gICAgICAgICAgICAgICAgdmFyIGNvZGUgPSBlZGl0Qm94ID8gZWRpdEJveC5zdHJpbmcgOiBcIlwiO1xuICAgICAgICAgICAgICAgIGlmIChjb2RlICYmIGNvZGUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9qb2luUm9vbShjb2RlLCByb29tQ29uZmlnLCBwbGF5ZXJHb2xkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93VGlwSW5TY2VuZShwYXJlbnROb2RlLCBcIuivt+i+k+WFpeaIv+mXtOWPt1wiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIGpvaW5CdG4ucGFyZW50ID0gcGFyZW50Tm9kZTtcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09IOWPs+S+p++8muWIm+W7uuaIv+mXtOWSjOW/q+mAn+W8gOWni+aMiemSriA9PT09PVxuICAgICAgICB2YXIgcmlnaHRYID0gc2NyZWVuV2lkdGgvMiAtIDE3MDtcbiAgICAgICAgXG4gICAgICAgIC8vIOWIm+W7uuaIv+mXtOaMiemSriAtIOWinuWKoOWuveW6plxuICAgICAgICB2YXIgY3JlYXRlQnRuID0gdGhpcy5fY3JlYXRlQWN0aW9uQnV0dG9uKFxuICAgICAgICAgICAgXCLliJvlu7rmiL/pl7RcIixcbiAgICAgICAgICAgIGNjLmNvbG9yKDI1NSwgMTUyLCAwKSwgIC8vIOapmeiJslxuICAgICAgICAgICAgcmlnaHRYIC0gODUsIGFjdGlvbkJhclksXG4gICAgICAgICAgICAxMjAsIDQ0LCAgLy8g5aKe5Yqg5bC65a+4XG4gICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zaG93Q3JlYXRlUm9vbURpYWxvZyhwYXJlbnROb2RlLCByb29tQ29uZmlnLCBwbGF5ZXJHb2xkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgY3JlYXRlQnRuLnBhcmVudCA9IHBhcmVudE5vZGU7XG4gICAgICAgIFxuICAgICAgICAvLyDlv6vpgJ/lvIDlp4vmjInpkq4gLSDlop7liqDlrr3luqZcbiAgICAgICAgdmFyIHF1aWNrQnRuID0gdGhpcy5fY3JlYXRlQWN0aW9uQnV0dG9uKFxuICAgICAgICAgICAgXCLlv6vpgJ/lvIDlp4tcIixcbiAgICAgICAgICAgIGNjLmNvbG9yKDMzLCAxNTAsIDI0MyksICAvLyDok53oibJcbiAgICAgICAgICAgIHJpZ2h0WCArIDg1LCBhY3Rpb25CYXJZLFxuICAgICAgICAgICAgMTIwLCA0NCwgIC8vIOWinuWKoOWwuuWvuFxuICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNjZW5lID0gcGFyZW50Tm9kZS5nZXRDaGlsZEJ5TmFtZShcIlJvb21MaXN0U2NlbmVcIikgfHwgcGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgICBpZiAoc2NlbmUuZGVzdHJveSkgc2NlbmUuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3F1aWNrTWF0Y2gocm9vbUNvbmZpZywgcGxheWVyR29sZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHF1aWNrQnRuLnBhcmVudCA9IHBhcmVudE5vZGU7XG4gICAgfSxcbiAgICBcbiAgICAvLyDliJvlu7rnroDljZXnmoTovpPlhaXmoYYgLSDkvb/nlKggRWRpdEJveCDnu4Tku7ZcbiAgICBfY3JlYXRlU2ltcGxlSW5wdXRCb3g6IGZ1bmN0aW9uKHBsYWNlaG9sZGVyLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHZhciBpbnB1dE5vZGUgPSBuZXcgY2MuTm9kZShcIlJvb21Db2RlSW5wdXRcIik7XG4gICAgICAgIGlucHV0Tm9kZS5zZXRDb250ZW50U2l6ZShjYy5zaXplKHdpZHRoLCBoZWlnaHQpKTtcbiAgICAgICAgaW5wdXROb2RlLnNldFBvc2l0aW9uKHgsIHkpO1xuICAgICAgICBpbnB1dE5vZGUuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgaW5wdXROb2RlLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIFxuICAgICAgICAvLyDog4zmma9cbiAgICAgICAgdmFyIGJnID0gaW5wdXROb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIGJnLmZpbGxDb2xvciA9IGNjLmNvbG9yKDQ1LCA0MCwgNjAsIDI1NSk7XG4gICAgICAgIGJnLnJvdW5kUmVjdCgtd2lkdGgvMiwgLWhlaWdodC8yLCB3aWR0aCwgaGVpZ2h0LCA2KTtcbiAgICAgICAgYmcuZmlsbCgpO1xuICAgICAgICBiZy5zdHJva2VDb2xvciA9IGNjLmNvbG9yKDEyMCwgMTAwLCA3MCwgMjIwKTtcbiAgICAgICAgYmcubGluZVdpZHRoID0gMjtcbiAgICAgICAgYmcucm91bmRSZWN0KC13aWR0aC8yLCAtaGVpZ2h0LzIsIHdpZHRoLCBoZWlnaHQsIDYpO1xuICAgICAgICBiZy5zdHJva2UoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOS9v+eUqCBFZGl0Qm94IOe7hOS7tuWunueOsOecn+ato+eahOi+k+WFpeahhlxuICAgICAgICB2YXIgZWRpdEJveCA9IGlucHV0Tm9kZS5hZGRDb21wb25lbnQoY2MuRWRpdEJveCk7XG4gICAgICAgIGVkaXRCb3guc3RyaW5nID0gXCJcIjtcbiAgICAgICAgZWRpdEJveC5wbGFjZWhvbGRlciA9IHBsYWNlaG9sZGVyO1xuICAgICAgICBlZGl0Qm94LmZvbnRTaXplID0gMTg7XG4gICAgICAgIGVkaXRCb3guZm9udENvbG9yID0gY2MuY29sb3IoMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgIGVkaXRCb3gucGxhY2Vob2xkZXJGb250U2l6ZSA9IDE2O1xuICAgICAgICBlZGl0Qm94LnBsYWNlaG9sZGVyRm9udENvbG9yID0gY2MuY29sb3IoMTMwLCAxMjAsIDExMCk7XG4gICAgICAgIGVkaXRCb3gubWF4TGVuZ3RoID0gMjA7XG4gICAgICAgIGVkaXRCb3guaW5wdXRNb2RlID0gY2MuRWRpdEJveC5JbnB1dE1vZGUuTlVNRVJJQztcbiAgICAgICAgZWRpdEJveC5yZXR1cm5UeXBlID0gY2MuRWRpdEJveC5LZXlib2FyZFJldHVyblR5cGUuRE9ORTtcbiAgICAgICAgZWRpdEJveC5saW5lSGVpZ2h0ID0gaGVpZ2h0IC0gODtcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOWGhei+uei3neaViOaenO+8iOmAmui/h+iwg+aVtOiDjOaZr++8iVxuICAgICAgICBlZGl0Qm94Lm5vZGUub24oJ2VkaXRpbmctZGlkLWJlZ2luJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBiZy5jbGVhcigpO1xuICAgICAgICAgICAgYmcuZmlsbENvbG9yID0gY2MuY29sb3IoNTUsIDUwLCA3NSwgMjU1KTtcbiAgICAgICAgICAgIGJnLnJvdW5kUmVjdCgtd2lkdGgvMiwgLWhlaWdodC8yLCB3aWR0aCwgaGVpZ2h0LCA2KTtcbiAgICAgICAgICAgIGJnLmZpbGwoKTtcbiAgICAgICAgICAgIGJnLnN0cm9rZUNvbG9yID0gY2MuY29sb3IoMTgwLCAxNTAsIDgwLCAyNTUpO1xuICAgICAgICAgICAgYmcubGluZVdpZHRoID0gMjtcbiAgICAgICAgICAgIGJnLnJvdW5kUmVjdCgtd2lkdGgvMiwgLWhlaWdodC8yLCB3aWR0aCwgaGVpZ2h0LCA2KTtcbiAgICAgICAgICAgIGJnLnN0cm9rZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIGVkaXRCb3gubm9kZS5vbignZWRpdGluZy1kaWQtZW5kJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBiZy5jbGVhcigpO1xuICAgICAgICAgICAgYmcuZmlsbENvbG9yID0gY2MuY29sb3IoNDUsIDQwLCA2MCwgMjU1KTtcbiAgICAgICAgICAgIGJnLnJvdW5kUmVjdCgtd2lkdGgvMiwgLWhlaWdodC8yLCB3aWR0aCwgaGVpZ2h0LCA2KTtcbiAgICAgICAgICAgIGJnLmZpbGwoKTtcbiAgICAgICAgICAgIGJnLnN0cm9rZUNvbG9yID0gY2MuY29sb3IoMTIwLCAxMDAsIDcwLCAyMjApO1xuICAgICAgICAgICAgYmcubGluZVdpZHRoID0gMjtcbiAgICAgICAgICAgIGJnLnJvdW5kUmVjdCgtd2lkdGgvMiwgLWhlaWdodC8yLCB3aWR0aCwgaGVpZ2h0LCA2KTtcbiAgICAgICAgICAgIGJnLnN0cm9rZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpbnB1dE5vZGU7XG4gICAgfSxcbiAgICBcbiAgICAvLyDliJvlu7rmk43kvZzmjInpkq5cbiAgICBfY3JlYXRlQWN0aW9uQnV0dG9uOiBmdW5jdGlvbih0ZXh0LCBiZ0NvbG9yLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgYnRuID0gbmV3IGNjLk5vZGUoXCJBY3Rpb25CdG5fXCIgKyB0ZXh0KTtcbiAgICAgICAgYnRuLnNldENvbnRlbnRTaXplKGNjLnNpemUod2lkdGgsIGhlaWdodCkpO1xuICAgICAgICBidG4uc2V0UG9zaXRpb24oeCwgeSk7XG4gICAgICAgIGJ0bi5hbmNob3JYID0gMC41O1xuICAgICAgICBidG4uYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgXG4gICAgICAgIC8vIOiDjOaZryAtIOWinuWKoOWchuinklxuICAgICAgICB2YXIgYmcgPSBidG4uYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgYmcuZmlsbENvbG9yID0gYmdDb2xvcjtcbiAgICAgICAgYmcucm91bmRSZWN0KC13aWR0aC8yLCAtaGVpZ2h0LzIsIHdpZHRoLCBoZWlnaHQsIDgpO1xuICAgICAgICBiZy5maWxsKCk7XG4gICAgICAgIC8vIOa3u+WKoOmrmOWFieaViOaenFxuICAgICAgICBiZy5maWxsQ29sb3IgPSBjYy5jb2xvcigyNTUsIDI1NSwgMjU1LCA0MCk7XG4gICAgICAgIGJnLnJvdW5kUmVjdCgtd2lkdGgvMiArIDIsIDIsIHdpZHRoIC0gNCwgaGVpZ2h0LzIgLSAyLCA2KTtcbiAgICAgICAgYmcuZmlsbCgpO1xuICAgICAgICBcbiAgICAgICAgLy8g5paH5a2XIC0g5aKe5aSn5a2X5L2TXG4gICAgICAgIHZhciB0ZXh0Tm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGV4dFwiKTtcbiAgICAgICAgdGV4dE5vZGUuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgdGV4dE5vZGUuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgdmFyIGxhYmVsID0gdGV4dE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgbGFiZWwuc3RyaW5nID0gdGV4dDtcbiAgICAgICAgbGFiZWwuZm9udFNpemUgPSAxODsgIC8vIOWinuWkp+Wtl+S9k1xuICAgICAgICBsYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICBsYWJlbC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVI7XG4gICAgICAgIHRleHROb2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDmloflrZfmj4/ovrlcbiAgICAgICAgdmFyIG91dGxpbmUgPSB0ZXh0Tm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKTtcbiAgICAgICAgb3V0bGluZS5jb2xvciA9IGNjLmNvbG9yKDAsIDAsIDAsIDE1MCk7XG4gICAgICAgIG91dGxpbmUud2lkdGggPSAxO1xuICAgICAgICB0ZXh0Tm9kZS5wYXJlbnQgPSBidG47XG4gICAgICAgIFxuICAgICAgICAvLyDop6bmkbjmlYjmnpxcbiAgICAgICAgYnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX1NUQVJULCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBidG4uc2NhbGUgPSAwLjk1O1xuICAgICAgICB9KTtcbiAgICAgICAgYnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgYnRuLnNjYWxlID0gMTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9DQU5DRUwsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBidG4uc2NhbGUgPSAxO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBidG47XG4gICAgfSxcbiAgICBcbiAgICAvLyDliJvlu7rmiL/pl7TliJfooajljLrln58gLSDnroDmtIHmuIXmmbDnmoTorr7orqFcbiAgICBfY3JlYXRlUm9vbUxpc3RDb250ZW50OiBmdW5jdGlvbihwYXJlbnROb2RlLCBzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0LCByb29tQ29uZmlnLCBwbGF5ZXJHb2xkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIC8vIOWIl+ihqOWMuuWfn+S9jee9ruWSjOWwuuWvuCAtIOiwg+aVtOS7pemAguW6lOaWsOeahOaTjeS9nOagj+mrmOW6plxuICAgICAgICB2YXIgbGlzdFkgPSAtMzA7ICAvLyDosIPmlbTkvY3nva5cbiAgICAgICAgdmFyIGxpc3RIZWlnaHQgPSBzY3JlZW5IZWlnaHQgLSAyODA7ICAvLyDosIPmlbTpq5jluqZcbiAgICAgICAgdmFyIGxpc3RXaWR0aCA9IHNjcmVlbldpZHRoIC0gNjA7XG4gICAgICAgIFxuICAgICAgICAvLyDliJfooajog4zmma9cbiAgICAgICAgdmFyIGxpc3RCZyA9IG5ldyBjYy5Ob2RlKFwiTGlzdEJnXCIpO1xuICAgICAgICBsaXN0Qmcuc2V0Q29udGVudFNpemUoY2Muc2l6ZShsaXN0V2lkdGgsIGxpc3RIZWlnaHQpKTtcbiAgICAgICAgbGlzdEJnLnNldFBvc2l0aW9uKDAsIGxpc3RZKTtcbiAgICAgICAgXG4gICAgICAgIHZhciBsZyA9IGxpc3RCZy5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICBsZy5maWxsQ29sb3IgPSBjYy5jb2xvcigyNSwgMjIsIDQwLCAyNDApO1xuICAgICAgICBsZy5yb3VuZFJlY3QoLWxpc3RXaWR0aC8yLCAtbGlzdEhlaWdodC8yLCBsaXN0V2lkdGgsIGxpc3RIZWlnaHQsIDgpO1xuICAgICAgICBsZy5maWxsKCk7XG4gICAgICAgIGxnLnN0cm9rZUNvbG9yID0gY2MuY29sb3IoODAsIDY1LCA1MCwgMTUwKTtcbiAgICAgICAgbGcubGluZVdpZHRoID0gMTtcbiAgICAgICAgbGcucm91bmRSZWN0KC1saXN0V2lkdGgvMiwgLWxpc3RIZWlnaHQvMiwgbGlzdFdpZHRoLCBsaXN0SGVpZ2h0LCA4KTtcbiAgICAgICAgbGcuc3Ryb2tlKCk7XG4gICAgICAgIGxpc3RCZy5wYXJlbnQgPSBwYXJlbnROb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8gPT09PT0g6KGo5aS0ID09PT09XG4gICAgICAgIHZhciBoZWFkZXJZID0gbGlzdFkgKyBsaXN0SGVpZ2h0LzIgLSAyNTtcbiAgICAgICAgXG4gICAgICAgIC8vIOihqOWktOiDjOaZr1xuICAgICAgICB2YXIgaGVhZGVyQmcgPSBuZXcgY2MuTm9kZShcIlRhYmxlSGVhZGVyXCIpO1xuICAgICAgICBoZWFkZXJCZy5zZXRQb3NpdGlvbigwLCBoZWFkZXJZKTtcbiAgICAgICAgdmFyIGhiZyA9IGhlYWRlckJnLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIGhiZy5maWxsQ29sb3IgPSBjYy5jb2xvcig0MCwgMzUsIDU1LCAyNTUpO1xuICAgICAgICBoYmcucm91bmRSZWN0KC1saXN0V2lkdGgvMiArIDUsIC0yMCwgbGlzdFdpZHRoIC0gMTAsIDQwLCA0KTtcbiAgICAgICAgaGJnLmZpbGwoKTtcbiAgICAgICAgaGVhZGVyQmcucGFyZW50ID0gcGFyZW50Tm9kZTtcbiAgICAgICAgXG4gICAgICAgIC8vIOihqOWktOaWh+WtlyAtIOWinuWkp+Wtl+S9k1xuICAgICAgICB2YXIgY29sV2lkdGggPSBsaXN0V2lkdGggLyA1O1xuICAgICAgICB2YXIgaGVhZGVycyA9IFtcIuaIv+mXtOWPt1wiLCBcIuS6uuaVsFwiLCBcIuW6leWIhlwiLCBcIueKtuaAgVwiLCBcIuaTjeS9nFwiXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoZWFkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgaE5vZGUgPSBuZXcgY2MuTm9kZShcIkhcIiArIGkpO1xuICAgICAgICAgICAgaE5vZGUueCA9IC1saXN0V2lkdGgvMiArIGNvbFdpZHRoICogKGkgKyAwLjUpO1xuICAgICAgICAgICAgaE5vZGUueSA9IGhlYWRlclk7XG4gICAgICAgICAgICBoTm9kZS5hbmNob3JYID0gMC41O1xuICAgICAgICAgICAgaE5vZGUuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGhsID0gaE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgICAgIGhsLnN0cmluZyA9IGhlYWRlcnNbaV07XG4gICAgICAgICAgICBobC5mb250U2l6ZSA9IDE2OyAgLy8g5aKe5aSn5a2X5L2TXG4gICAgICAgICAgICBobC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICAgICAgaE5vZGUuY29sb3IgPSBjYy5jb2xvcigyNDAsIDIwMCwgMTIwKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5re75Yqg5o+P6L65XG4gICAgICAgICAgICB2YXIgb3V0bGluZSA9IGhOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpO1xuICAgICAgICAgICAgb3V0bGluZS5jb2xvciA9IGNjLmNvbG9yKDYwLCA1MCwgNDApO1xuICAgICAgICAgICAgb3V0bGluZS53aWR0aCA9IDE7XG4gICAgICAgICAgICBoTm9kZS5wYXJlbnQgPSBwYXJlbnROb2RlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PSDmiL/pl7TliJfooajlrrnlmaggPT09PT1cbiAgICAgICAgdmFyIHJvb21Db250YWluZXIgPSBuZXcgY2MuTm9kZShcIlJvb21MaXN0Q29udGFpbmVyXCIpO1xuICAgICAgICByb29tQ29udGFpbmVyLnNldENvbnRlbnRTaXplKGNjLnNpemUobGlzdFdpZHRoIC0gMjAsIGxpc3RIZWlnaHQgLSA3MCkpO1xuICAgICAgICByb29tQ29udGFpbmVyLnkgPSBsaXN0WSAtIDIwO1xuICAgICAgICByb29tQ29udGFpbmVyLnBhcmVudCA9IHBhcmVudE5vZGU7XG4gICAgICAgIFxuICAgICAgICAvLyDliqDovb3mj5DnpLpcbiAgICAgICAgdmFyIGxvYWRpbmdOb2RlID0gbmV3IGNjLk5vZGUoXCJMb2FkaW5nTGFiZWxcIik7XG4gICAgICAgIGxvYWRpbmdOb2RlLmFuY2hvclggPSAwLjU7XG4gICAgICAgIGxvYWRpbmdOb2RlLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIHZhciBsbCA9IGxvYWRpbmdOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGxsLnN0cmluZyA9IFwi5q2j5Zyo5Yqg6L295oi/6Ze05YiX6KGoLi4uXCI7XG4gICAgICAgIGxsLmZvbnRTaXplID0gMTg7ICAvLyDlop7lpKflrZfkvZNcbiAgICAgICAgbGwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgbG9hZGluZ05vZGUuY29sb3IgPSBjYy5jb2xvcigxNjAsIDE1MCwgMTQwKTtcbiAgICAgICAgbG9hZGluZ05vZGUucGFyZW50ID0gcm9vbUNvbnRhaW5lcjtcbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPluaIv+mXtOWIl+ihqFxuICAgICAgICB0aGlzLl9mZXRjaEFuZFJlbmRlclJvb21MaXN0Rm9yU2NlbmUocm9vbUNvbnRhaW5lciwgbG9hZGluZ05vZGUsIHJvb21Db25maWcsIHBsYXllckdvbGQsIHBhcmVudE5vZGUpO1xuICAgIH0sXG4gICAgXG4gICAgLy8g5Yib5bu65bqV6YOo5L+h5oGv5qCPIC0g566A5rSB6K6+6K6hXG4gICAgX2NyZWF0ZVJvb21MaXN0Rm9vdGVyOiBmdW5jdGlvbihwYXJlbnROb2RlLCBzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0LCBwbGF5ZXJHb2xkLCByb29tQ29uZmlnKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGZvb3RlclkgPSAtc2NyZWVuSGVpZ2h0LzIgKyA1MDsgIC8vIOiwg+aVtOS9jee9rlxuICAgICAgICBcbiAgICAgICAgLy8g5bqV6YOo6IOM5pmvXG4gICAgICAgIHZhciBmb290ZXJCZyA9IG5ldyBjYy5Ob2RlKFwiRm9vdGVyQmdcIik7XG4gICAgICAgIGZvb3RlckJnLnNldFBvc2l0aW9uKDAsIGZvb3RlclkpO1xuICAgICAgICB2YXIgZmcgPSBmb290ZXJCZy5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICBmZy5maWxsQ29sb3IgPSBjYy5jb2xvcigyOCwgMjUsIDQyLCAyNDApO1xuICAgICAgICBmZy5yb3VuZFJlY3QoLXNjcmVlbldpZHRoLzIgKyAzMCwgLTI1LCBzY3JlZW5XaWR0aCAtIDYwLCA1MCwgNik7XG4gICAgICAgIGZnLmZpbGwoKTtcbiAgICAgICAgZm9vdGVyQmcucGFyZW50ID0gcGFyZW50Tm9kZTtcbiAgICAgICAgXG4gICAgICAgIC8vIOi/lOWbnuaMiemSriAtIOWinuWkp+WwuuWvuFxuICAgICAgICB2YXIgYmFja0J0biA9IHRoaXMuX2NyZWF0ZUFjdGlvbkJ1dHRvbihcbiAgICAgICAgICAgIFwi6L+U5Zue5aSn5Y6FXCIsXG4gICAgICAgICAgICBjYy5jb2xvcig5MCwgODUsIDEwMCksXG4gICAgICAgICAgICAtc2NyZWVuV2lkdGgvMiArIDEyMCwgZm9vdGVyWSxcbiAgICAgICAgICAgIDExMCwgNDAsICAvLyDlop7liqDlsLrlr7hcbiAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBzY2VuZSA9IHBhcmVudE5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJSb29tTGlzdFNjZW5lXCIpIHx8IHBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgaWYgKHNjZW5lLmRlc3Ryb3kpIHNjZW5lLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgYmFja0J0bi5wYXJlbnQgPSBwYXJlbnROb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g6YeR5biB5pi+56S6XG4gICAgICAgIHZhciBnb2xkSWNvbiA9IG5ldyBjYy5Ob2RlKFwiR29sZEljb25cIik7XG4gICAgICAgIGdvbGRJY29uLnNldFBvc2l0aW9uKDMwLCBmb290ZXJZKTtcbiAgICAgICAgdmFyIGdnID0gZ29sZEljb24uYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgZ2cuZmlsbENvbG9yID0gY2MuY29sb3IoMjMwLCAxODAsIDUwKTtcbiAgICAgICAgZ2cuY2lyY2xlKDAsIDAsIDEwKTtcbiAgICAgICAgZ2cuZmlsbCgpO1xuICAgICAgICBnZy5maWxsQ29sb3IgPSBjYy5jb2xvcigyNTAsIDIxMCwgODApO1xuICAgICAgICBnZy5jaXJjbGUoMCwgMCwgNik7XG4gICAgICAgIGdnLmZpbGwoKTtcbiAgICAgICAgZ29sZEljb24ucGFyZW50ID0gcGFyZW50Tm9kZTtcbiAgICAgICAgXG4gICAgICAgIHZhciBnb2xkVGV4dCA9IG5ldyBjYy5Ob2RlKFwiR29sZFRleHRcIik7XG4gICAgICAgIGdvbGRUZXh0LnNldFBvc2l0aW9uKDUwLCBmb290ZXJZKTtcbiAgICAgICAgZ29sZFRleHQuYW5jaG9yWCA9IDA7XG4gICAgICAgIGdvbGRUZXh0LmFuY2hvclkgPSAwLjU7XG4gICAgICAgIHZhciBnbCA9IGdvbGRUZXh0LmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGdsLnN0cmluZyA9IHRoaXMuX2Zvcm1hdEdvbGQocGxheWVyR29sZCk7XG4gICAgICAgIGdsLmZvbnRTaXplID0gMTY7XG4gICAgICAgIGdvbGRUZXh0LmNvbG9yID0gY2MuY29sb3IoMjMwLCAxOTAsIDgwKTtcbiAgICAgICAgZ29sZFRleHQucGFyZW50ID0gcGFyZW50Tm9kZTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWIt+aWsOaMiemSriAtIOWinuWkp+WwuuWvuFxuICAgICAgICB2YXIgcmVmcmVzaEJ0biA9IHRoaXMuX2NyZWF0ZUFjdGlvbkJ1dHRvbihcbiAgICAgICAgICAgIFwi5Yi35paw5YiX6KGoXCIsXG4gICAgICAgICAgICBjYy5jb2xvcig2MCwgMTMwLCAxODApLFxuICAgICAgICAgICAgc2NyZWVuV2lkdGgvMiAtIDEwMCwgZm9vdGVyWSxcbiAgICAgICAgICAgIDEwMCwgNDAsICAvLyDlop7liqDlsLrlr7hcbiAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBjb250YWluZXIgPSBwYXJlbnROb2RlLmdldENoaWxkQnlOYW1lKFwiUm9vbUxpc3RDb250YWluZXJcIik7XG4gICAgICAgICAgICAgICAgaWYgKCFjb250YWluZXIpIHJldHVybjtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgbG9hZGluZyA9IGNvbnRhaW5lci5nZXRDaGlsZEJ5TmFtZShcIkxvYWRpbmdMYWJlbFwiKTtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGluZykge1xuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmcuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKS5zdHJpbmcgPSBcIuato+WcqOWIt+aWsC4uLlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBjb250YWluZXIuY2hpbGRyZW4uc2xpY2UoKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZHJlbltpXS5uYW1lICE9PSBcIkxvYWRpbmdMYWJlbFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbltpXS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi5fZmV0Y2hBbmRSZW5kZXJSb29tTGlzdEZvclNjZW5lKGNvbnRhaW5lciwgbG9hZGluZywgcm9vbUNvbmZpZywgcGxheWVyR29sZCwgcGFyZW50Tm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHJlZnJlc2hCdG4ucGFyZW50ID0gcGFyZW50Tm9kZTtcbiAgICB9LFxuICAgIFxuICAgIC8vIOWIm+W7uuaMiemSruiKgueCue+8iOaWh+Wtl+WcqOaMiemSruWGhemDqO+8iVxuICAgIF9jcmVhdGVCdXR0b25Ob2RlOiBmdW5jdGlvbih0ZXh0LCBiZ0NvbG9yLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCBjYWxsYmFjaywgaXNQcmltYXJ5KSB7XG4gICAgICAgIHZhciBidG4gPSBuZXcgY2MuTm9kZShcIkJ0bl9cIiArIHRleHQpO1xuICAgICAgICBidG4uc2V0Q29udGVudFNpemUoY2Muc2l6ZSh3aWR0aCwgaGVpZ2h0KSk7XG4gICAgICAgIGJ0bi5zZXRQb3NpdGlvbih4LCB5KTtcbiAgICAgICAgYnRuLmFuY2hvclggPSAwLjU7XG4gICAgICAgIGJ0bi5hbmNob3JZID0gMC41O1xuICAgICAgICBcbiAgICAgICAgLy8g5oyJ6ZKu6IOM5pmv6IqC54K5XG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkJnTm9kZVwiKTtcbiAgICAgICAgYmdOb2RlLnNldFBvc2l0aW9uKDAsIDApO1xuICAgICAgICBiZ05vZGUuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgYmdOb2RlLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIFxuICAgICAgICB2YXIgYmcgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOe7mOWItuaMiemSruiDjOaZr1xuICAgICAgICBiZy5maWxsQ29sb3IgPSBiZ0NvbG9yO1xuICAgICAgICBiZy5yb3VuZFJlY3QoLXdpZHRoLzIsIC1oZWlnaHQvMiwgd2lkdGgsIGhlaWdodCwgNSk7XG4gICAgICAgIGJnLmZpbGwoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOi+ueahhlxuICAgICAgICB2YXIgYm9yZGVyQ29sb3IgPSBjYy5jb2xvcihcbiAgICAgICAgICAgIE1hdGgubWluKDI1NSwgYmdDb2xvci5yICsgNDApLFxuICAgICAgICAgICAgTWF0aC5taW4oMjU1LCBiZ0NvbG9yLmcgKyA0MCksXG4gICAgICAgICAgICBNYXRoLm1pbigyNTUsIGJnQ29sb3IuYiArIDQwKVxuICAgICAgICApO1xuICAgICAgICBiZy5zdHJva2VDb2xvciA9IGJvcmRlckNvbG9yO1xuICAgICAgICBiZy5saW5lV2lkdGggPSAxO1xuICAgICAgICBiZy5yb3VuZFJlY3QoLXdpZHRoLzIsIC1oZWlnaHQvMiwgd2lkdGgsIGhlaWdodCwgNSk7XG4gICAgICAgIGJnLnN0cm9rZSgpO1xuICAgICAgICBcbiAgICAgICAgLy8g5Li75oyJ6ZKu6auY5YWJXG4gICAgICAgIGlmIChpc1ByaW1hcnkpIHtcbiAgICAgICAgICAgIGJnLmZpbGxDb2xvciA9IGNjLmNvbG9yKDI1NSwgMjU1LCAyNTUsIDUwKTtcbiAgICAgICAgICAgIGJnLnJvdW5kUmVjdCgtd2lkdGgvMiArIDIsIDIsIHdpZHRoIC0gNCwgaGVpZ2h0LzIgLSAyLCAzKTtcbiAgICAgICAgICAgIGJnLmZpbGwoKTtcbiAgICAgICAgfVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gYnRuO1xuICAgICAgICBcbiAgICAgICAgLy8g5oyJ6ZKu5paH5a2X6IqC54K577yI54us56uL55qE5a2Q6IqC54K577yJXG4gICAgICAgIHZhciB0ZXh0Tm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGV4dE5vZGVcIik7XG4gICAgICAgIHRleHROb2RlLnNldFBvc2l0aW9uKDAsIDApOyAgLy8g5b+F6aG76K6+572u5L2N572u5Li65oyJ6ZKu5Lit5b+DXG4gICAgICAgIHRleHROb2RlLmFuY2hvclggPSAwLjU7XG4gICAgICAgIHRleHROb2RlLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIHRleHROb2RlLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRleHROb2RlLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgXG4gICAgICAgIHZhciBsYWJlbCA9IHRleHROb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGxhYmVsLnN0cmluZyA9IHRleHQ7XG4gICAgICAgIGxhYmVsLmZvbnRTaXplID0gTWF0aC5mbG9vcihoZWlnaHQgKiAwLjQyKTtcbiAgICAgICAgbGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgbGFiZWwudmVydGljYWxBbGlnbiA9IGNjLkxhYmVsLlZlcnRpY2FsQWxpZ24uQ0VOVEVSO1xuICAgICAgICBsYWJlbC5vdmVyZmxvdyA9IGNjLkxhYmVsLk92ZXJmbG93Lk5PTkU7XG4gICAgICAgIHRleHROb2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgIFxuICAgICAgICB2YXIgb3V0bGluZSA9IHRleHROb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpO1xuICAgICAgICBvdXRsaW5lLmNvbG9yID0gY2MuY29sb3IoMCwgMCwgMCwgMTIwKTtcbiAgICAgICAgb3V0bGluZS53aWR0aCA9IDE7XG4gICAgICAgIHRleHROb2RlLnBhcmVudCA9IGJ0bjtcbiAgICAgICAgXG4gICAgICAgIC8vIOinpuaRuOS6i+S7tlxuICAgICAgICBidG4ub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfU1RBUlQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGJ0bi5zY2FsZSA9IDAuOTU7XG4gICAgICAgIH0pO1xuICAgICAgICBidG4ub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBidG4uc2NhbGUgPSAxO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjaygpO1xuICAgICAgICB9KTtcbiAgICAgICAgYnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0NBTkNFTCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGJ0bi5zY2FsZSA9IDE7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGJ0bjtcbiAgICB9LFxuICAgIFxuICAgIC8vIOWIm+W7uuS9v+eUqOWbvueJh+eahOaMiemSruiKgueCuVxuICAgIF9jcmVhdGVJbWFnZUJ1dHRvbk5vZGU6IGZ1bmN0aW9uKGltYWdlUGF0aCwgdGV4dCwgeCwgeSwgd2lkdGgsIGhlaWdodCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgYnRuID0gbmV3IGNjLk5vZGUoXCJCdG5fXCIgKyB0ZXh0KTtcbiAgICAgICAgYnRuLnNldENvbnRlbnRTaXplKGNjLnNpemUod2lkdGgsIGhlaWdodCkpO1xuICAgICAgICBidG4uc2V0UG9zaXRpb24oeCwgeSk7XG4gICAgICAgIGJ0bi5hbmNob3JYID0gMC41O1xuICAgICAgICBidG4uYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoCBTcHJpdGUg57uE5Lu2XG4gICAgICAgIHZhciBzcHJpdGUgPSBidG4uYWRkQ29tcG9uZW50KGNjLlNwcml0ZSk7XG4gICAgICAgIHNwcml0ZS5zaXplTW9kZSA9IGNjLlNwcml0ZS5TaXplTW9kZS5DVVNUT007XG4gICAgICAgIFxuICAgICAgICAvLyDliqDovb3mjInpkq7lm77niYdcbiAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoaW1hZ2VQYXRoLCBjYy5TcHJpdGVGcmFtZSwgZnVuY3Rpb24oZXJyLCBzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIuWKoOi9veaMiemSruWbvueJh+Wksei0pTpcIiwgaW1hZ2VQYXRoKTtcbiAgICAgICAgICAgICAgICAvLyDkvb/nlKjlpIfnlKjmoLflvI9cbiAgICAgICAgICAgICAgICBzZWxmLl9jcmVhdGVCdXR0b25GYWxsYmFjayhidG4sIHRleHQsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNwcml0ZS5zcHJpdGVGcmFtZSA9IHNwcml0ZUZyYW1lO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoCBCdXR0b24g57uE5Lu2XG4gICAgICAgIHZhciBidXR0b24gPSBidG4uYWRkQ29tcG9uZW50KGNjLkJ1dHRvbik7XG4gICAgICAgIGJ1dHRvbi50cmFuc2l0aW9uID0gY2MuQnV0dG9uLlRyYW5zaXRpb24uU0NBTEU7XG4gICAgICAgIGJ1dHRvbi5kdXJhdGlvbiA9IDAuMTtcbiAgICAgICAgYnV0dG9uLnpvb21TY2FsZSA9IDAuOTU7XG4gICAgICAgIFxuICAgICAgICAvLyDop6bmkbjkuovku7ZcbiAgICAgICAgYnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjaygpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBidG47XG4gICAgfSxcbiAgICBcbiAgICAvLyDmjInpkq7lpIfnlKjmoLflvI/vvIjlm77niYfliqDovb3lpLHotKXml7bkvb/nlKjvvIlcbiAgICBfY3JlYXRlQnV0dG9uRmFsbGJhY2s6IGZ1bmN0aW9uKGJ0biwgdGV4dCwgd2lkdGgsIGhlaWdodCkge1xuICAgICAgICAvLyDnu5jliLbmjInpkq7og4zmma9cbiAgICAgICAgdmFyIGdyYXBoaWNzID0gYnRuLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIFxuICAgICAgICAvLyDmoLnmja7mjInpkq7mloflrZfpgInmi6npopzoibJcbiAgICAgICAgdmFyIGJnQ29sb3I7XG4gICAgICAgIGlmICh0ZXh0LmluZGV4T2YoXCLliJvlu7pcIikgPj0gMCkge1xuICAgICAgICAgICAgYmdDb2xvciA9IGNjLmNvbG9yKDMwLCA5MCwgMTYwKTsgIC8vIOiTneiJslxuICAgICAgICB9IGVsc2UgaWYgKHRleHQuaW5kZXhPZihcIuWKoOWFpVwiKSA+PSAwIHx8IHRleHQuaW5kZXhPZihcIui/m+WFpVwiKSA+PSAwKSB7XG4gICAgICAgICAgICBiZ0NvbG9yID0gY2MuY29sb3IoNDAsIDEzMCwgNjApOyAgLy8g57u/6ImyXG4gICAgICAgIH0gZWxzZSBpZiAodGV4dC5pbmRleE9mKFwi5b+r6YCfXCIpID49IDApIHtcbiAgICAgICAgICAgIGJnQ29sb3IgPSBjYy5jb2xvcigyMDAsIDEyMCwgNDApOyAgLy8g5qmZ6ImyXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBiZ0NvbG9yID0gY2MuY29sb3IoODAsIDgwLCA4MCk7ICAvLyDngbDoibJcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZ3JhcGhpY3MuZmlsbENvbG9yID0gYmdDb2xvcjtcbiAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC13aWR0aC8yLCAtaGVpZ2h0LzIsIHdpZHRoLCBoZWlnaHQsIDYpO1xuICAgICAgICBncmFwaGljcy5maWxsKCk7XG4gICAgICAgIGdyYXBoaWNzLnN0cm9rZUNvbG9yID0gY2MuY29sb3IoMjU1LCAyNTUsIDI1NSwgODApO1xuICAgICAgICBncmFwaGljcy5saW5lV2lkdGggPSAyO1xuICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLXdpZHRoLzIsIC1oZWlnaHQvMiwgd2lkdGgsIGhlaWdodCwgNik7XG4gICAgICAgIGdyYXBoaWNzLnN0cm9rZSgpO1xuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg5paH5a2XXG4gICAgICAgIHZhciBsYWJlbE5vZGUgPSBuZXcgY2MuTm9kZShcIkxhYmVsXCIpO1xuICAgICAgICB2YXIgbGFiZWwgPSBsYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgbGFiZWwuc3RyaW5nID0gdGV4dDtcbiAgICAgICAgbGFiZWwuZm9udFNpemUgPSBNYXRoLmZsb29yKGhlaWdodCAqIDAuNCk7XG4gICAgICAgIGxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIGxhYmVsTm9kZS5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICBsYWJlbE5vZGUucGFyZW50ID0gYnRuO1xuICAgIH0sXG4gICAgXG4gICAgLy8g5Yib5bu66L6T5YWl5qGG6IqC54K5XG4gICAgX2NyZWF0ZUlucHV0Tm9kZTogZnVuY3Rpb24ocGxhY2Vob2xkZXIsIHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdmFyIGlucHV0Tm9kZSA9IG5ldyBjYy5Ob2RlKFwiSW5wdXROb2RlXCIpO1xuICAgICAgICBpbnB1dE5vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZSh3aWR0aCwgaGVpZ2h0KSk7XG4gICAgICAgIGlucHV0Tm9kZS5zZXRQb3NpdGlvbih4LCB5KTtcbiAgICAgICAgaW5wdXROb2RlLmFuY2hvclggPSAwLjU7XG4gICAgICAgIGlucHV0Tm9kZS5hbmNob3JZID0gMC41O1xuICAgICAgICBpbnB1dE5vZGUubmFtZSA9IFwiUm9vbUNvZGVJbnB1dFwiO1xuICAgICAgICBcbiAgICAgICAgLy8g6L6T5YWl5qGG6IOM5pmvXG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIklucHV0QmdcIik7XG4gICAgICAgIGJnTm9kZS5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgYmdOb2RlLmFuY2hvclggPSAwLjU7XG4gICAgICAgIGJnTm9kZS5hbmNob3JZID0gMC41O1xuICAgICAgICBcbiAgICAgICAgdmFyIGJnID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIGJnLmZpbGxDb2xvciA9IGNjLmNvbG9yKDQ1LCA0MCwgNjAsIDI1NSk7XG4gICAgICAgIGJnLnJvdW5kUmVjdCgtd2lkdGgvMiwgLWhlaWdodC8yLCB3aWR0aCwgaGVpZ2h0LCA1KTtcbiAgICAgICAgYmcuZmlsbCgpO1xuICAgICAgICBiZy5zdHJva2VDb2xvciA9IGNjLmNvbG9yKDEwMCwgOTAsIDcwLCAyMDApO1xuICAgICAgICBiZy5saW5lV2lkdGggPSAxO1xuICAgICAgICBiZy5yb3VuZFJlY3QoLXdpZHRoLzIsIC1oZWlnaHQvMiwgd2lkdGgsIGhlaWdodCwgNSk7XG4gICAgICAgIGJnLnN0cm9rZSgpO1xuICAgICAgICBiZ05vZGUucGFyZW50ID0gaW5wdXROb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8gcGxhY2Vob2xkZXLmloflrZfoioLngrlcbiAgICAgICAgdmFyIHBsYWNlaG9sZGVyTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUGxhY2Vob2xkZXJcIik7XG4gICAgICAgIHBsYWNlaG9sZGVyTm9kZS5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgcGxhY2Vob2xkZXJOb2RlLmFuY2hvclggPSAwLjU7XG4gICAgICAgIHBsYWNlaG9sZGVyTm9kZS5hbmNob3JZID0gMC41O1xuICAgICAgICBwbGFjZWhvbGRlck5vZGUud2lkdGggPSB3aWR0aCAtIDIwO1xuICAgICAgICBwbGFjZWhvbGRlck5vZGUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBcbiAgICAgICAgdmFyIGxhYmVsID0gcGxhY2Vob2xkZXJOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGxhYmVsLnN0cmluZyA9IHBsYWNlaG9sZGVyO1xuICAgICAgICBsYWJlbC5mb250U2l6ZSA9IE1hdGguZmxvb3IoaGVpZ2h0ICogMC40KTtcbiAgICAgICAgbGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgbGFiZWwudmVydGljYWxBbGlnbiA9IGNjLkxhYmVsLlZlcnRpY2FsQWxpZ24uQ0VOVEVSO1xuICAgICAgICBwbGFjZWhvbGRlck5vZGUuY29sb3IgPSBjYy5jb2xvcigxMzAsIDEyMCwgMTEwKTtcbiAgICAgICAgcGxhY2Vob2xkZXJOb2RlLnBhcmVudCA9IGlucHV0Tm9kZTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpbnB1dE5vZGU7XG4gICAgfSxcbiAgICBcbiAgICAvLyDliJvlu7rmoLflvI/ljJbmjInpkq5cbiAgICBfY3JlYXRlU3R5bGVkQnV0dG9uOiBmdW5jdGlvbih0ZXh0LCBjb2xvciwgeCwgY2FsbGJhY2ssIHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgd2lkdGggPSB3aWR0aCB8fCAxMDA7XG4gICAgICAgIGhlaWdodCA9IGhlaWdodCB8fCA0MDtcbiAgICAgICAgXG4gICAgICAgIHZhciBidG4gPSBuZXcgY2MuTm9kZShcIkJ0bl9cIiArIHRleHQpO1xuICAgICAgICBidG4uc2V0Q29udGVudFNpemUoY2Muc2l6ZSh3aWR0aCwgaGVpZ2h0KSk7XG4gICAgICAgIGJ0bi5zZXRQb3NpdGlvbih4LCAwKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOaMiemSruiDjOaZr1xuICAgICAgICB2YXIgYmcgPSBidG4uYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgYmcuZmlsbENvbG9yID0gY29sb3I7XG4gICAgICAgIGJnLnJvdW5kUmVjdCgtd2lkdGgvMiwgLWhlaWdodC8yLCB3aWR0aCwgaGVpZ2h0LCA4KTtcbiAgICAgICAgYmcuZmlsbCgpO1xuICAgICAgICBcbiAgICAgICAgLy8g5oyJ6ZKu5paH5a2XXG4gICAgICAgIHZhciBsYWJlbCA9IGJ0bi5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBsYWJlbC5zdHJpbmcgPSB0ZXh0O1xuICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDE4O1xuICAgICAgICBsYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICBsYWJlbC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVI7XG4gICAgICAgIGJ0bi5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICBcbiAgICAgICAgLy8g6Kem5pG45pWI5p6cXG4gICAgICAgIGJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9TVEFSVCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgYnRuLnNjYWxlID0gMC45NTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGJ0bi5zY2FsZSA9IDE7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBidG4ub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfQ0FOQ0VMLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgYnRuLnNjYWxlID0gMTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYnRuO1xuICAgIH0sXG4gICAgXG4gICAgLy8g5Zyo5Zy65pmv5Lit5pi+56S65o+Q56S6XG4gICAgX3Nob3dUaXBJblNjZW5lOiBmdW5jdGlvbihzY2VuZU5vZGUsIG1lc3NhZ2UpIHtcbiAgICAgICAgdmFyIHRpcE5vZGUgPSBzY2VuZU5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJTY2VuZVRpcFwiKTtcbiAgICAgICAgaWYgKHRpcE5vZGUpIHRpcE5vZGUuZGVzdHJveSgpO1xuICAgICAgICBcbiAgICAgICAgdGlwTm9kZSA9IG5ldyBjYy5Ob2RlKFwiU2NlbmVUaXBcIik7XG4gICAgICAgIHRpcE5vZGUueSA9IDEwMDtcbiAgICAgICAgXG4gICAgICAgIHZhciBiZyA9IHRpcE5vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgYmcuZmlsbENvbG9yID0gY2MuY29sb3IoMCwgMCwgMCwgMTgwKTtcbiAgICAgICAgYmcucm91bmRSZWN0KC0xNTAsIC0yMCwgMzAwLCA0MCwgOCk7XG4gICAgICAgIGJnLmZpbGwoKTtcbiAgICAgICAgXG4gICAgICAgIHZhciBsYWJlbCA9IHRpcE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgbGFiZWwuc3RyaW5nID0gbWVzc2FnZTtcbiAgICAgICAgbGFiZWwuZm9udFNpemUgPSAyMDtcbiAgICAgICAgbGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgdGlwTm9kZS5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjU1LCAwKTtcbiAgICAgICAgdGlwTm9kZS5wYXJlbnQgPSBzY2VuZU5vZGU7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aXBOb2RlICYmIHRpcE5vZGUuaXNWYWxpZCkgdGlwTm9kZS5kZXN0cm95KCk7XG4gICAgICAgIH0sIDIpO1xuICAgIH0sXG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g5pi+56S65Yib5bu65oi/6Ze05by556qX77yI566A5rSB5riF5pmw55qE6K6+6K6h77yJXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgX3Nob3dDcmVhdGVSb29tRGlhbG9nOiBmdW5jdGlvbihwYXJlbnROb2RlLCByb29tQ29uZmlnLCBwbGF5ZXJHb2xkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyDnp7vpmaTml6flvLnnqpdcbiAgICAgICAgdmFyIG9sZERpYWxvZyA9IHBhcmVudE5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJDcmVhdGVSb29tRGlhbG9nXCIpO1xuICAgICAgICBpZiAob2xkRGlhbG9nKSBvbGREaWFsb2cuZGVzdHJveSgpO1xuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+W55S75biD5bC65a+4XG4gICAgICAgIHZhciBjYW52YXMgPSB0aGlzLm5vZGUuZ2V0Q29tcG9uZW50KGNjLkNhbnZhcykgfHwgY2MuZmluZCgnQ2FudmFzJykuZ2V0Q29tcG9uZW50KGNjLkNhbnZhcyk7XG4gICAgICAgIHZhciBzY3JlZW5IZWlnaHQgPSBjYW52YXMgPyBjYW52YXMuZGVzaWduUmVzb2x1dGlvbi5oZWlnaHQgOiA3MjA7XG4gICAgICAgIHZhciBzY3JlZW5XaWR0aCA9IGNhbnZhcyA/IGNhbnZhcy5kZXNpZ25SZXNvbHV0aW9uLndpZHRoIDogMTI4MDtcbiAgICAgICAgXG4gICAgICAgIC8vIOW8ueeql+WuueWZqFxuICAgICAgICB2YXIgZGlhbG9nID0gbmV3IGNjLk5vZGUoXCJDcmVhdGVSb29tRGlhbG9nXCIpO1xuICAgICAgICBkaWFsb2cuc2V0Q29udGVudFNpemUoY2Muc2l6ZShzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSk7XG4gICAgICAgIGRpYWxvZy5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgZGlhbG9nLnpJbmRleCA9IDMwMDA7XG4gICAgICAgIGRpYWxvZy5wYXJlbnQgPSBwYXJlbnROb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g5Y2K6YCP5piO6YGu572pXG4gICAgICAgIHZhciBtYXNrID0gbmV3IGNjLk5vZGUoXCJNYXNrXCIpO1xuICAgICAgICBtYXNrLnNldENvbnRlbnRTaXplKGNjLnNpemUoc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCkpO1xuICAgICAgICB2YXIgbWFza0cgPSBtYXNrLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIG1hc2tHLmZpbGxDb2xvciA9IGNjLmNvbG9yKDAsIDAsIDAsIDE4MCk7XG4gICAgICAgIG1hc2tHLnJlY3QoLXNjcmVlbldpZHRoLzIsIC1zY3JlZW5IZWlnaHQvMiwgc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCk7XG4gICAgICAgIG1hc2tHLmZpbGwoKTtcbiAgICAgICAgbWFzay5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICAvLyDngrnlh7vpga7nvanlhbPpl61cbiAgICAgICAgbWFzay5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGRpYWxvZy5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gPT09PT0g5by556qX5Li75L2TID09PT09XG4gICAgICAgIHZhciBkaWFsb2dXaWR0aCA9IDQ4MDsgIC8vIOWinuWKoOWuveW6plxuICAgICAgICB2YXIgZGlhbG9nSGVpZ2h0ID0gNDIwOyAgLy8g5aKe5Yqg6auY5bqmXG4gICAgICAgIFxuICAgICAgICAvLyDlvLnnqpfog4zmma9cbiAgICAgICAgdmFyIGRpYWxvZ0JnID0gbmV3IGNjLk5vZGUoXCJEaWFsb2dCZ1wiKTtcbiAgICAgICAgZGlhbG9nQmcuc2V0Q29udGVudFNpemUoY2Muc2l6ZShkaWFsb2dXaWR0aCwgZGlhbG9nSGVpZ2h0KSk7XG4gICAgICAgIFxuICAgICAgICB2YXIgZGJnID0gZGlhbG9nQmcuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgLy8g6Zi05b2xXG4gICAgICAgIGRiZy5maWxsQ29sb3IgPSBjYy5jb2xvcigwLCAwLCAwLCA4MCk7XG4gICAgICAgIGRiZy5yb3VuZFJlY3QoLWRpYWxvZ1dpZHRoLzIgKyA1LCAtZGlhbG9nSGVpZ2h0LzIgLSA1LCBkaWFsb2dXaWR0aCwgZGlhbG9nSGVpZ2h0LCAxMik7XG4gICAgICAgIGRiZy5maWxsKCk7XG4gICAgICAgIC8vIOS4u+iDjOaZr1xuICAgICAgICBkYmcuZmlsbENvbG9yID0gY2MuY29sb3IoMzUsIDMyLCA1MCwgMjU1KTtcbiAgICAgICAgZGJnLnJvdW5kUmVjdCgtZGlhbG9nV2lkdGgvMiwgLWRpYWxvZ0hlaWdodC8yLCBkaWFsb2dXaWR0aCwgZGlhbG9nSGVpZ2h0LCAxMik7XG4gICAgICAgIGRiZy5maWxsKCk7XG4gICAgICAgIC8vIOi+ueahhlxuICAgICAgICBkYmcuc3Ryb2tlQ29sb3IgPSBjYy5jb2xvcigyNTUsIDE4MCwgNjAsIDIwMCk7XG4gICAgICAgIGRiZy5saW5lV2lkdGggPSAyO1xuICAgICAgICBkYmcucm91bmRSZWN0KC1kaWFsb2dXaWR0aC8yLCAtZGlhbG9nSGVpZ2h0LzIsIGRpYWxvZ1dpZHRoLCBkaWFsb2dIZWlnaHQsIDEyKTtcbiAgICAgICAgZGJnLnN0cm9rZSgpO1xuICAgICAgICBkaWFsb2dCZy5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PSDpobbpg6jmoIfpopjmoI8gPT09PT1cbiAgICAgICAgdmFyIGhlYWRlckJhciA9IG5ldyBjYy5Ob2RlKFwiSGVhZGVyQmFyXCIpO1xuICAgICAgICBoZWFkZXJCYXIueSA9IGRpYWxvZ0hlaWdodC8yIC0gMzA7XG4gICAgICAgIFxuICAgICAgICB2YXIgaGJnID0gaGVhZGVyQmFyLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIGhiZy5maWxsQ29sb3IgPSBjYy5jb2xvcigyNTUsIDE1MiwgMCk7ICAvLyDmqZnoibLkuLvpophcbiAgICAgICAgaGJnLnJvdW5kUmVjdCgtZGlhbG9nV2lkdGgvMiwgLTI1LCBkaWFsb2dXaWR0aCwgNTAsIFsxMiwgMTIsIDAsIDBdKTtcbiAgICAgICAgaGJnLmZpbGwoKTtcbiAgICAgICAgaGVhZGVyQmFyLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIC8vIOagh+mimOaWh+Wtl1xuICAgICAgICB2YXIgdGl0bGVUZXh0ID0gbmV3IGNjLk5vZGUoXCJUaXRsZVwiKTtcbiAgICAgICAgdGl0bGVUZXh0LnkgPSBkaWFsb2dIZWlnaHQvMiAtIDMwO1xuICAgICAgICB0aXRsZVRleHQuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgdGl0bGVUZXh0LmFuY2hvclkgPSAwLjU7XG4gICAgICAgIHZhciB0dGwgPSB0aXRsZVRleHQuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgdHRsLnN0cmluZyA9IFwi5Yib5bu65oi/6Ze0XCI7XG4gICAgICAgIHR0bC5mb250U2l6ZSA9IDI0O1xuICAgICAgICB0dGwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgdGl0bGVUZXh0LmNvbG9yID0gY2MuY29sb3IoMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgIFxuICAgICAgICB2YXIgdGl0bGVPdXRsaW5lID0gdGl0bGVUZXh0LmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpO1xuICAgICAgICB0aXRsZU91dGxpbmUuY29sb3IgPSBjYy5jb2xvcigxMjAsIDYwLCAwKTtcbiAgICAgICAgdGl0bGVPdXRsaW5lLndpZHRoID0gMjtcbiAgICAgICAgdGl0bGVUZXh0LnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIC8vIOWFs+mXreaMiemSrlxuICAgICAgICB2YXIgY2xvc2VCdG4gPSBuZXcgY2MuTm9kZShcIkNsb3NlQnRuXCIpO1xuICAgICAgICBjbG9zZUJ0bi5zZXRDb250ZW50U2l6ZShjYy5zaXplKDMwLCAzMCkpO1xuICAgICAgICBjbG9zZUJ0bi54ID0gZGlhbG9nV2lkdGgvMiAtIDI1O1xuICAgICAgICBjbG9zZUJ0bi55ID0gZGlhbG9nSGVpZ2h0LzIgLSAzMDtcbiAgICAgICAgXG4gICAgICAgIHZhciBjYmcgPSBjbG9zZUJ0bi5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICBjYmcuZmlsbENvbG9yID0gY2MuY29sb3IoMCwgMCwgMCwgODApO1xuICAgICAgICBjYmcuY2lyY2xlKDAsIDAsIDE1KTtcbiAgICAgICAgY2JnLmZpbGwoKTtcbiAgICAgICAgY2xvc2VCdG4ucGFyZW50ID0gZGlhbG9nO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNsb3NlWCA9IG5ldyBjYy5Ob2RlKFwiWFwiKTtcbiAgICAgICAgY2xvc2VYLmFuY2hvclggPSAwLjU7XG4gICAgICAgIGNsb3NlWC5hbmNob3JZID0gMC41O1xuICAgICAgICB2YXIgY2xvc2VMYWJlbCA9IGNsb3NlWC5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBjbG9zZUxhYmVsLnN0cmluZyA9IFwiw5dcIjtcbiAgICAgICAgY2xvc2VMYWJlbC5mb250U2l6ZSA9IDI0O1xuICAgICAgICBjbG9zZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIGNsb3NlWC5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICBjbG9zZVgucGFyZW50ID0gY2xvc2VCdG47XG4gICAgICAgIFxuICAgICAgICBjbG9zZUJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGlhbG9nLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PSDmiL/pl7TnsbvlnovmmL7npLogPT09PT1cbiAgICAgICAgdmFyIHJvb21UeXBlQmcgPSBuZXcgY2MuTm9kZShcIlJvb21UeXBlQmdcIik7XG4gICAgICAgIHJvb21UeXBlQmcueSA9IGRpYWxvZ0hlaWdodC8yIC0gODA7XG4gICAgICAgIHZhciBydGJnID0gcm9vbVR5cGVCZy5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICBydGJnLmZpbGxDb2xvciA9IGNjLmNvbG9yKDYwLCA1NSwgODAsIDIwMCk7XG4gICAgICAgIHJ0Ymcucm91bmRSZWN0KC04MCwgLTE2LCAxNjAsIDMyLCAxNik7XG4gICAgICAgIHJ0YmcuZmlsbCgpO1xuICAgICAgICByb29tVHlwZUJnLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIHZhciByb29tVHlwZVRleHQgPSBuZXcgY2MuTm9kZShcIlJvb21UeXBlXCIpO1xuICAgICAgICByb29tVHlwZVRleHQueSA9IGRpYWxvZ0hlaWdodC8yIC0gODA7XG4gICAgICAgIHJvb21UeXBlVGV4dC5hbmNob3JYID0gMC41O1xuICAgICAgICByb29tVHlwZVRleHQuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgdmFyIHJ0bCA9IHJvb21UeXBlVGV4dC5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBydGwuc3RyaW5nID0gcm9vbUNvbmZpZy5yb29tX25hbWUgfHwgXCLliJ3nuqfmiL9cIjtcbiAgICAgICAgcnRsLmZvbnRTaXplID0gMTY7XG4gICAgICAgIHJ0bC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICByb29tVHlwZVRleHQuY29sb3IgPSBjYy5jb2xvcigyNTUsIDIyMCwgMTIwKTtcbiAgICAgICAgcm9vbVR5cGVUZXh0LnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09IOaIv+mXtOWQjeensOi+k+WFpSA9PT09PVxuICAgICAgICB2YXIgbmFtZUxhYmVsID0gbmV3IGNjLk5vZGUoXCJOYW1lTGFiZWxcIik7XG4gICAgICAgIG5hbWVMYWJlbC54ID0gLWRpYWxvZ1dpZHRoLzIgKyAzMDtcbiAgICAgICAgbmFtZUxhYmVsLnkgPSBkaWFsb2dIZWlnaHQvMiAtIDEzMDtcbiAgICAgICAgbmFtZUxhYmVsLmFuY2hvclggPSAwO1xuICAgICAgICBuYW1lTGFiZWwuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgdmFyIG5sbCA9IG5hbWVMYWJlbC5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBubGwuc3RyaW5nID0gXCLmiL/pl7TlkI3np7A6XCI7XG4gICAgICAgIG5sbC5mb250U2l6ZSA9IDE4OyAgLy8g5aKe5aSn5a2X5L2TXG4gICAgICAgIG5hbWVMYWJlbC5jb2xvciA9IGNjLmNvbG9yKDIyMCwgMjEwLCAxOTApO1xuICAgICAgICBuYW1lTGFiZWwucGFyZW50ID0gZGlhbG9nO1xuICAgICAgICBcbiAgICAgICAgdmFyIG5hbWVJbnB1dERhdGEgPSB7IHZhbHVlOiBcIlwiIH07XG4gICAgICAgIHZhciBuYW1lSW5wdXRCdG4gPSB0aGlzLl9jcmVhdGVFZGl0Qm94SW5wdXQoXG4gICAgICAgICAgICBcIui+k+WFpeaIv+mXtOWQjeensO+8iOWPr+mAie+8iVwiLFxuICAgICAgICAgICAgNDAsIGRpYWxvZ0hlaWdodC8yIC0gMTY1LFxuICAgICAgICAgICAgZGlhbG9nV2lkdGggLSA4MCwgNDgsICAvLyDlop7liqDlsLrlr7hcbiAgICAgICAgICAgIFwiTmFtZUlucHV0XCIsXG4gICAgICAgICAgICBuYW1lSW5wdXREYXRhXG4gICAgICAgICk7XG4gICAgICAgIG5hbWVJbnB1dEJ0bi5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PSDmiL/pl7Tlr4bnoIHovpPlhaUgPT09PT1cbiAgICAgICAgdmFyIHB3ZExhYmVsID0gbmV3IGNjLk5vZGUoXCJQd2RMYWJlbFwiKTtcbiAgICAgICAgcHdkTGFiZWwueCA9IC1kaWFsb2dXaWR0aC8yICsgMzA7XG4gICAgICAgIHB3ZExhYmVsLnkgPSBkaWFsb2dIZWlnaHQvMiAtIDIzNTtcbiAgICAgICAgcHdkTGFiZWwuYW5jaG9yWCA9IDA7XG4gICAgICAgIHB3ZExhYmVsLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIHZhciBwbGwgPSBwd2RMYWJlbC5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBwbGwuc3RyaW5nID0gXCLmiL/pl7Tlr4bnoIE6XCI7XG4gICAgICAgIHBsbC5mb250U2l6ZSA9IDE4OyAgLy8g5aKe5aSn5a2X5L2TXG4gICAgICAgIHB3ZExhYmVsLmNvbG9yID0gY2MuY29sb3IoMjIwLCAyMTAsIDE5MCk7XG4gICAgICAgIHB3ZExhYmVsLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIHZhciBwd2RJbnB1dERhdGEgPSB7IHZhbHVlOiBcIlwiIH07XG4gICAgICAgIHZhciBwd2RJbnB1dEJ0biA9IHRoaXMuX2NyZWF0ZUVkaXRCb3hJbnB1dChcbiAgICAgICAgICAgIFwi6K6+572u5a+G56CB77yI5Y+v6YCJ77yJXCIsXG4gICAgICAgICAgICA0MCwgZGlhbG9nSGVpZ2h0LzIgLSAyNzAsXG4gICAgICAgICAgICBkaWFsb2dXaWR0aCAtIDgwLCA0OCwgIC8vIOWinuWKoOWwuuWvuFxuICAgICAgICAgICAgXCJQd2RJbnB1dFwiLFxuICAgICAgICAgICAgcHdkSW5wdXREYXRhXG4gICAgICAgICk7XG4gICAgICAgIHB3ZElucHV0QnRuLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09IOaPkOekuuaWh+WtlyA9PT09PVxuICAgICAgICB2YXIgdGlwTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGlwXCIpO1xuICAgICAgICB0aXBOb2RlLnkgPSAtZGlhbG9nSGVpZ2h0LzIgKyAxMDA7XG4gICAgICAgIHRpcE5vZGUuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgdGlwTm9kZS5hbmNob3JZID0gMC41O1xuICAgICAgICB2YXIgdGlwTGFiZWwgPSB0aXBOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIHRpcExhYmVsLnN0cmluZyA9IFwi55WZ56m65a+G56CB5YiZ5Yib5bu65YWs5byA5oi/6Ze077yM5Lu75L2V5Lq65Y+v55u05o6l5Yqg5YWlXCI7XG4gICAgICAgIHRpcExhYmVsLmZvbnRTaXplID0gMTQ7ICAvLyDlop7lpKflrZfkvZNcbiAgICAgICAgdGlwTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgdGlwTm9kZS5jb2xvciA9IGNjLmNvbG9yKDE2MCwgMTUwLCAxNDApO1xuICAgICAgICB0aXBOb2RlLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09IOaMiemSruWMuuWfnyA9PT09PVxuICAgICAgICB2YXIgYnRuWSA9IC1kaWFsb2dIZWlnaHQvMiArIDUwO1xuICAgICAgICBcbiAgICAgICAgLy8g5Y+W5raI5oyJ6ZKuXG4gICAgICAgIHZhciBjYW5jZWxCdG4gPSB0aGlzLl9jcmVhdGVEaWFsb2dCdXR0b24oXG4gICAgICAgICAgICBcIuWPlua2iFwiLFxuICAgICAgICAgICAgY2MuY29sb3IoODAsIDc1LCA5NSksXG4gICAgICAgICAgICAtOTAsIGJ0blksXG4gICAgICAgICAgICAxMzAsIDQ4LCAgLy8g5aKe5Yqg5bC65a+4XG4gICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBkaWFsb2cuZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICBjYW5jZWxCdG4ucGFyZW50ID0gZGlhbG9nO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65oyJ6ZKuXG4gICAgICAgIHZhciBjcmVhdGVCdG4gPSB0aGlzLl9jcmVhdGVEaWFsb2dCdXR0b24oXG4gICAgICAgICAgICBcIuWIm+W7uuaIv+mXtFwiLFxuICAgICAgICAgICAgY2MuY29sb3IoMjU1LCAxNTIsIDApLCAgLy8g5qmZ6ImyXG4gICAgICAgICAgICA5MCwgYnRuWSxcbiAgICAgICAgICAgIDE1MCwgNDgsICAvLyDlop7liqDlsLrlr7hcbiAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIOiOt+WPlui+k+WFpeWGheWuuSAtIOS7jiBFZGl0Qm94IOiOt+WPllxuICAgICAgICAgICAgICAgIHZhciBuYW1lSW5wdXQgPSBkaWFsb2cuZ2V0Q2hpbGRCeU5hbWUoXCJOYW1lSW5wdXRcIik7XG4gICAgICAgICAgICAgICAgdmFyIHB3ZElucHV0ID0gZGlhbG9nLmdldENoaWxkQnlOYW1lKFwiUHdkSW5wdXRcIik7XG4gICAgICAgICAgICAgICAgdmFyIG5hbWVFZGl0Qm94ID0gbmFtZUlucHV0ID8gbmFtZUlucHV0LmdldENvbXBvbmVudChjYy5FZGl0Qm94KSA6IG51bGw7XG4gICAgICAgICAgICAgICAgdmFyIHB3ZEVkaXRCb3ggPSBwd2RJbnB1dCA/IHB3ZElucHV0LmdldENvbXBvbmVudChjYy5FZGl0Qm94KSA6IG51bGw7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHJvb21OYW1lID0gKG5hbWVFZGl0Qm94ICYmIG5hbWVFZGl0Qm94LnN0cmluZykgfHwgcm9vbUNvbmZpZy5yb29tX25hbWUgfHwgXCLmiJHnmoTmiL/pl7RcIjtcbiAgICAgICAgICAgICAgICB2YXIgcGFzc3dvcmQgPSAocHdkRWRpdEJveCAmJiBwd2RFZGl0Qm94LnN0cmluZykgfHwgXCJcIjtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDkv53lrZjmiL/pl7Tkv6Hmga9cbiAgICAgICAgICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWw7XG4gICAgICAgICAgICAgICAgaWYgKG15Z2xvYmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLmNyZWF0ZVJvb21JbmZvID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm9vbU5hbWU6IHJvb21OYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm9vbUNvbmZpZzogcm9vbUNvbmZpZ1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBkaWFsb2cuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOWFs+mXreaIv+mXtOWIl+ihqOeVjOmdouW5tuWIm+W7uuaIv+mXtFxuICAgICAgICAgICAgICAgIHZhciBzY2VuZSA9IHBhcmVudE5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJSb29tTGlzdFNjZW5lXCIpIHx8IHBhcmVudE5vZGU7XG4gICAgICAgICAgICAgICAgaWYgKHNjZW5lLmRlc3Ryb3kpIHNjZW5lLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDosIPnlKjljp/mnaXnmoTliJvlu7rmiL/pl7Tmlrnms5VcbiAgICAgICAgICAgICAgICBzZWxmLl9jcmVhdGVSb29tKHJvb21Db25maWcsIHBsYXllckdvbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICBjcmVhdGVCdG4ucGFyZW50ID0gZGlhbG9nO1xuICAgIH0sXG4gICAgXG4gICAgLy8g5Yib5bu65L2/55SoIEVkaXRCb3gg55qE6L6T5YWl5qGG77yI55So5LqO5by556qX5YaF77yJXG4gICAgX2NyZWF0ZUVkaXRCb3hJbnB1dDogZnVuY3Rpb24ocGxhY2Vob2xkZXIsIHgsIHksIHdpZHRoLCBoZWlnaHQsIG5vZGVOYW1lLCBkYXRhUmVmKSB7XG4gICAgICAgIHZhciBpbnB1dE5vZGUgPSBuZXcgY2MuTm9kZShub2RlTmFtZSk7XG4gICAgICAgIGlucHV0Tm9kZS5zZXRDb250ZW50U2l6ZShjYy5zaXplKHdpZHRoLCBoZWlnaHQpKTtcbiAgICAgICAgaW5wdXROb2RlLnNldFBvc2l0aW9uKHgsIHkpO1xuICAgICAgICBpbnB1dE5vZGUuYW5jaG9yWCA9IDA7XG4gICAgICAgIGlucHV0Tm9kZS5hbmNob3JZID0gMC41O1xuICAgICAgICBcbiAgICAgICAgLy8g6IOM5pmvXG4gICAgICAgIHZhciBiZyA9IGlucHV0Tm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICBiZy5maWxsQ29sb3IgPSBjYy5jb2xvcig1MCwgNDUsIDY1LCAyNTUpO1xuICAgICAgICBiZy5yb3VuZFJlY3QoMCwgLWhlaWdodC8yLCB3aWR0aCwgaGVpZ2h0LCA4KTtcbiAgICAgICAgYmcuZmlsbCgpO1xuICAgICAgICBiZy5zdHJva2VDb2xvciA9IGNjLmNvbG9yKDEyMCwgMTAwLCA3MCwgMjIwKTtcbiAgICAgICAgYmcubGluZVdpZHRoID0gMjtcbiAgICAgICAgYmcucm91bmRSZWN0KDAsIC1oZWlnaHQvMiwgd2lkdGgsIGhlaWdodCwgOCk7XG4gICAgICAgIGJnLnN0cm9rZSgpO1xuICAgICAgICBcbiAgICAgICAgLy8g5L2/55SoIEVkaXRCb3gg57uE5Lu2XG4gICAgICAgIHZhciBlZGl0Qm94ID0gaW5wdXROb2RlLmFkZENvbXBvbmVudChjYy5FZGl0Qm94KTtcbiAgICAgICAgZWRpdEJveC5zdHJpbmcgPSBcIlwiO1xuICAgICAgICBlZGl0Qm94LnBsYWNlaG9sZGVyID0gcGxhY2Vob2xkZXI7XG4gICAgICAgIGVkaXRCb3guZm9udFNpemUgPSAxODtcbiAgICAgICAgZWRpdEJveC5mb250Q29sb3IgPSBjYy5jb2xvcigyNTUsIDI1NSwgMjU1KTtcbiAgICAgICAgZWRpdEJveC5wbGFjZWhvbGRlckZvbnRTaXplID0gMTY7XG4gICAgICAgIGVkaXRCb3gucGxhY2Vob2xkZXJGb250Q29sb3IgPSBjYy5jb2xvcigxMzAsIDEyMCwgMTEwKTtcbiAgICAgICAgZWRpdEJveC5tYXhMZW5ndGggPSAzMDtcbiAgICAgICAgZWRpdEJveC5pbnB1dE1vZGUgPSBjYy5FZGl0Qm94LklucHV0TW9kZS5BTlk7XG4gICAgICAgIGVkaXRCb3gucmV0dXJuVHlwZSA9IGNjLkVkaXRCb3guS2V5Ym9hcmRSZXR1cm5UeXBlLkRPTkU7XG4gICAgICAgIGVkaXRCb3gubGluZUhlaWdodCA9IGhlaWdodCAtIDEwO1xuICAgICAgICBcbiAgICAgICAgLy8g6L6T5YWl5LqL5Lu2XG4gICAgICAgIGVkaXRCb3gubm9kZS5vbigndGV4dC1jaGFuZ2VkJywgZnVuY3Rpb24oZWRpdGJveCkge1xuICAgICAgICAgICAgaWYgKGRhdGFSZWYpIHtcbiAgICAgICAgICAgICAgICBkYXRhUmVmLnZhbHVlID0gZWRpdGJveC5zdHJpbmc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8g54Sm54K55LqL5Lu2IC0g5pu05paw6IOM5pmv5qC35byPXG4gICAgICAgIGVkaXRCb3gubm9kZS5vbignZWRpdGluZy1kaWQtYmVnaW4nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJnLmNsZWFyKCk7XG4gICAgICAgICAgICBiZy5maWxsQ29sb3IgPSBjYy5jb2xvcig2MCwgNTUsIDgwLCAyNTUpO1xuICAgICAgICAgICAgYmcucm91bmRSZWN0KDAsIC1oZWlnaHQvMiwgd2lkdGgsIGhlaWdodCwgOCk7XG4gICAgICAgICAgICBiZy5maWxsKCk7XG4gICAgICAgICAgICBiZy5zdHJva2VDb2xvciA9IGNjLmNvbG9yKDI1NSwgMTgwLCA4MCwgMjU1KTtcbiAgICAgICAgICAgIGJnLmxpbmVXaWR0aCA9IDI7XG4gICAgICAgICAgICBiZy5yb3VuZFJlY3QoMCwgLWhlaWdodC8yLCB3aWR0aCwgaGVpZ2h0LCA4KTtcbiAgICAgICAgICAgIGJnLnN0cm9rZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIGVkaXRCb3gubm9kZS5vbignZWRpdGluZy1kaWQtZW5kJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBiZy5jbGVhcigpO1xuICAgICAgICAgICAgYmcuZmlsbENvbG9yID0gY2MuY29sb3IoNTAsIDQ1LCA2NSwgMjU1KTtcbiAgICAgICAgICAgIGJnLnJvdW5kUmVjdCgwLCAtaGVpZ2h0LzIsIHdpZHRoLCBoZWlnaHQsIDgpO1xuICAgICAgICAgICAgYmcuZmlsbCgpO1xuICAgICAgICAgICAgYmcuc3Ryb2tlQ29sb3IgPSBjYy5jb2xvcigxMjAsIDEwMCwgNzAsIDIyMCk7XG4gICAgICAgICAgICBiZy5saW5lV2lkdGggPSAyO1xuICAgICAgICAgICAgYmcucm91bmRSZWN0KDAsIC1oZWlnaHQvMiwgd2lkdGgsIGhlaWdodCwgOCk7XG4gICAgICAgICAgICBiZy5zdHJva2UoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaW5wdXROb2RlO1xuICAgIH0sXG4gICAgXG4gICAgLy8g5Yib5bu65by556qX5YaF5Y+v54K55Ye755qE6L6T5YWl5qGGXG4gICAgX2NyZWF0ZUlucHV0RGlhbG9nSW5wdXQ6IGZ1bmN0aW9uKHBsYWNlaG9sZGVyLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCBub2RlTmFtZSwgZGF0YVJlZikge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBpbnB1dE5vZGUgPSBuZXcgY2MuTm9kZShub2RlTmFtZSk7XG4gICAgICAgIGlucHV0Tm9kZS5zZXRDb250ZW50U2l6ZShjYy5zaXplKHdpZHRoLCBoZWlnaHQpKTtcbiAgICAgICAgaW5wdXROb2RlLnNldFBvc2l0aW9uKHgsIHkpO1xuICAgICAgICBpbnB1dE5vZGUuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgaW5wdXROb2RlLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIFxuICAgICAgICAvLyDog4zmma9cbiAgICAgICAgdmFyIGJnID0gaW5wdXROb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIGJnLmZpbGxDb2xvciA9IGNjLmNvbG9yKDUwLCA0NSwgNjUsIDI1NSk7XG4gICAgICAgIGJnLnJvdW5kUmVjdCgtd2lkdGgvMiwgLWhlaWdodC8yLCB3aWR0aCwgaGVpZ2h0LCA2KTtcbiAgICAgICAgYmcuZmlsbCgpO1xuICAgICAgICBiZy5zdHJva2VDb2xvciA9IGNjLmNvbG9yKDEyMCwgMTAwLCA3MCwgMjAwKTtcbiAgICAgICAgYmcubGluZVdpZHRoID0gMTtcbiAgICAgICAgYmcucm91bmRSZWN0KC13aWR0aC8yLCAtaGVpZ2h0LzIsIHdpZHRoLCBoZWlnaHQsIDYpO1xuICAgICAgICBiZy5zdHJva2UoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHBsYWNlaG9sZGVyL+WAvOaYvuekulxuICAgICAgICB2YXIgdGV4dE5vZGUgPSBuZXcgY2MuTm9kZShcIlRleHRcIik7XG4gICAgICAgIHRleHROb2RlLmFuY2hvclggPSAwLjU7XG4gICAgICAgIHRleHROb2RlLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIHRleHROb2RlLnBhcmVudCA9IGlucHV0Tm9kZTtcbiAgICAgICAgXG4gICAgICAgIHZhciBsYWJlbCA9IHRleHROb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGxhYmVsLnN0cmluZyA9IHBsYWNlaG9sZGVyO1xuICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDE0O1xuICAgICAgICBsYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICB0ZXh0Tm9kZS5jb2xvciA9IGNjLmNvbG9yKDEzMCwgMTIwLCAxMTApO1xuICAgICAgICBcbiAgICAgICAgLy8g5L2/55So57O757uf5o+Q56S66L6T5YWlXG4gICAgICAgIGlucHV0Tm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5L2/55SoIHByb21wdCDojrflj5bovpPlhaXvvIhXZWLnq6/lj6/nlKjvvIlcbiAgICAgICAgICAgIHZhciBpbnB1dCA9IFwiXCI7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucHJvbXB0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlucHV0ID0gd2luZG93LnByb21wdChwbGFjZWhvbGRlciwgZGF0YVJlZi52YWx1ZSB8fCBcIlwiKSB8fCBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGlucHV0KSB7XG4gICAgICAgICAgICAgICAgZGF0YVJlZi52YWx1ZSA9IGlucHV0O1xuICAgICAgICAgICAgICAgIGxhYmVsLnN0cmluZyA9IGlucHV0O1xuICAgICAgICAgICAgICAgIHRleHROb2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGFSZWYudmFsdWUpIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5zdHJpbmcgPSBkYXRhUmVmLnZhbHVlO1xuICAgICAgICAgICAgICAgIHRleHROb2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxhYmVsLnN0cmluZyA9IHBsYWNlaG9sZGVyO1xuICAgICAgICAgICAgICAgIHRleHROb2RlLmNvbG9yID0gY2MuY29sb3IoMTMwLCAxMjAsIDExMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlucHV0Tm9kZTtcbiAgICB9LFxuICAgIFxuICAgIC8vIOWIm+W7uuW8ueeql+WGheeahOaMiemSrlxuICAgIF9jcmVhdGVEaWFsb2dCdXR0b246IGZ1bmN0aW9uKHRleHQsIGJnQ29sb3IsIHgsIHksIHdpZHRoLCBoZWlnaHQsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBidG4gPSBuZXcgY2MuTm9kZShcIkJ0bl9cIiArIHRleHQpO1xuICAgICAgICBidG4uc2V0Q29udGVudFNpemUoY2Muc2l6ZSh3aWR0aCwgaGVpZ2h0KSk7XG4gICAgICAgIGJ0bi5zZXRQb3NpdGlvbih4LCB5KTtcbiAgICAgICAgYnRuLmFuY2hvclggPSAwLjU7XG4gICAgICAgIGJ0bi5hbmNob3JZID0gMC41O1xuICAgICAgICBcbiAgICAgICAgLy8g6IOM5pmvXG4gICAgICAgIHZhciBiZyA9IGJ0bi5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICBiZy5maWxsQ29sb3IgPSBiZ0NvbG9yO1xuICAgICAgICBiZy5yb3VuZFJlY3QoLXdpZHRoLzIsIC1oZWlnaHQvMiwgd2lkdGgsIGhlaWdodCwgOCk7XG4gICAgICAgIGJnLmZpbGwoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOi+ueahhlxuICAgICAgICBiZy5zdHJva2VDb2xvciA9IGNjLmNvbG9yKFxuICAgICAgICAgICAgTWF0aC5taW4oMjU1LCBiZ0NvbG9yLnIgKyAzMCksXG4gICAgICAgICAgICBNYXRoLm1pbigyNTUsIGJnQ29sb3IuZyArIDMwKSxcbiAgICAgICAgICAgIE1hdGgubWluKDI1NSwgYmdDb2xvci5iICsgMzApXG4gICAgICAgICk7XG4gICAgICAgIGJnLmxpbmVXaWR0aCA9IDI7XG4gICAgICAgIGJnLnJvdW5kUmVjdCgtd2lkdGgvMiwgLWhlaWdodC8yLCB3aWR0aCwgaGVpZ2h0LCA4KTtcbiAgICAgICAgYmcuc3Ryb2tlKCk7XG4gICAgICAgIFxuICAgICAgICAvLyDmloflrZdcbiAgICAgICAgdmFyIHRleHROb2RlID0gbmV3IGNjLk5vZGUoXCJUZXh0XCIpO1xuICAgICAgICB0ZXh0Tm9kZS5hbmNob3JYID0gMC41O1xuICAgICAgICB0ZXh0Tm9kZS5hbmNob3JZID0gMC41O1xuICAgICAgICB2YXIgbGFiZWwgPSB0ZXh0Tm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBsYWJlbC5zdHJpbmcgPSB0ZXh0O1xuICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDE4O1xuICAgICAgICBsYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICB0ZXh0Tm9kZS5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICB0ZXh0Tm9kZS5wYXJlbnQgPSBidG47XG4gICAgICAgIFxuICAgICAgICAvLyDop6bmkbjmlYjmnpxcbiAgICAgICAgYnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX1NUQVJULCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBidG4uc2NhbGUgPSAwLjk1O1xuICAgICAgICB9KTtcbiAgICAgICAgYnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgYnRuLnNjYWxlID0gMTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9DQU5DRUwsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBidG4uc2NhbGUgPSAxO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBidG47XG4gICAgfSxcbiAgICBcbiAgICAvLyDliJvlu7rnsr7nvo7ovpPlhaXmoYZcbiAgICBfY3JlYXRlQmVhdXRpZnVsSW5wdXQ6IGZ1bmN0aW9uKHBsYWNlaG9sZGVyLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCBub2RlTmFtZSkge1xuICAgICAgICB2YXIgaW5wdXROb2RlID0gbmV3IGNjLk5vZGUobm9kZU5hbWUgfHwgXCJCZWF1dGlmdWxJbnB1dFwiKTtcbiAgICAgICAgaW5wdXROb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUod2lkdGgsIGhlaWdodCkpO1xuICAgICAgICBpbnB1dE5vZGUuc2V0UG9zaXRpb24oeCwgeSk7XG4gICAgICAgIGlucHV0Tm9kZS5hbmNob3JYID0gMC41O1xuICAgICAgICBpbnB1dE5vZGUuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgXG4gICAgICAgIC8vIOi+k+WFpeahhuiDjOaZr1xuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJJbnB1dEJnXCIpO1xuICAgICAgICBiZ05vZGUuc2V0UG9zaXRpb24oMCwgMCk7XG4gICAgICAgIGJnTm9kZS5hbmNob3JYID0gMC41O1xuICAgICAgICBiZ05vZGUuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgXG4gICAgICAgIHZhciBiZyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICAvLyDlhoXpg6jloavlhYVcbiAgICAgICAgYmcuZmlsbENvbG9yID0gY2MuY29sb3IoNTUsIDQ1LCA3MCwgMjU1KTtcbiAgICAgICAgYmcucm91bmRSZWN0KC13aWR0aC8yLCAtaGVpZ2h0LzIsIHdpZHRoLCBoZWlnaHQsIDYpO1xuICAgICAgICBiZy5maWxsKCk7XG4gICAgICAgIC8vIOi+ueahhlxuICAgICAgICBiZy5zdHJva2VDb2xvciA9IGNjLmNvbG9yKDE1MCwgMTIwLCA4MCwgMjAwKTtcbiAgICAgICAgYmcubGluZVdpZHRoID0gMjtcbiAgICAgICAgYmcucm91bmRSZWN0KC13aWR0aC8yLCAtaGVpZ2h0LzIsIHdpZHRoLCBoZWlnaHQsIDYpO1xuICAgICAgICBiZy5zdHJva2UoKTtcbiAgICAgICAgLy8g5YaF6YOo6auY5YWJXG4gICAgICAgIGJnLnN0cm9rZUNvbG9yID0gY2MuY29sb3IoODAsIDcwLCAxMDAsIDEwMCk7XG4gICAgICAgIGJnLmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIGJnLnJvdW5kUmVjdCgtd2lkdGgvMiArIDMsIC1oZWlnaHQvMiArIDMsIHdpZHRoIC0gNiwgaGVpZ2h0IC0gNiwgNCk7XG4gICAgICAgIGJnLnN0cm9rZSgpO1xuICAgICAgICBiZ05vZGUucGFyZW50ID0gaW5wdXROb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8gcGxhY2Vob2xkZXLmloflrZdcbiAgICAgICAgdmFyIHBsYWNlaG9sZGVyTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUGxhY2Vob2xkZXJcIik7XG4gICAgICAgIHBsYWNlaG9sZGVyTm9kZS5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgcGxhY2Vob2xkZXJOb2RlLmFuY2hvclggPSAwLjU7XG4gICAgICAgIHBsYWNlaG9sZGVyTm9kZS5hbmNob3JZID0gMC41O1xuICAgICAgICBwbGFjZWhvbGRlck5vZGUud2lkdGggPSB3aWR0aCAtIDIwO1xuICAgICAgICBwbGFjZWhvbGRlck5vZGUuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBcbiAgICAgICAgdmFyIGxhYmVsID0gcGxhY2Vob2xkZXJOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGxhYmVsLnN0cmluZyA9IHBsYWNlaG9sZGVyO1xuICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDE0O1xuICAgICAgICBsYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICBsYWJlbC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVI7XG4gICAgICAgIHBsYWNlaG9sZGVyTm9kZS5jb2xvciA9IGNjLmNvbG9yKDE0MCwgMTMwLCAxMjApO1xuICAgICAgICBwbGFjZWhvbGRlck5vZGUucGFyZW50ID0gaW5wdXROb2RlO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlucHV0Tm9kZTtcbiAgICB9LFxuICAgIFxuICAgIC8vIOWIm+W7uueyvue+juaMiemSrlxuICAgIF9jcmVhdGVCZWF1dGlmdWxCdXR0b246IGZ1bmN0aW9uKHRleHQsIGJnQ29sb3IsIGJvcmRlckNvbG9yLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCBjYWxsYmFjaywgaXNQcmltYXJ5KSB7XG4gICAgICAgIHZhciBidG4gPSBuZXcgY2MuTm9kZShcIkJlYXV0aWZ1bEJ0bl9cIiArIHRleHQpO1xuICAgICAgICBidG4uc2V0Q29udGVudFNpemUoY2Muc2l6ZSh3aWR0aCwgaGVpZ2h0KSk7XG4gICAgICAgIGJ0bi5zZXRQb3NpdGlvbih4LCB5KTtcbiAgICAgICAgYnRuLmFuY2hvclggPSAwLjU7XG4gICAgICAgIGJ0bi5hbmNob3JZID0gMC41O1xuICAgICAgICBcbiAgICAgICAgLy8g5oyJ6ZKu6IOM5pmv6IqC54K5XG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkJnTm9kZVwiKTtcbiAgICAgICAgYmdOb2RlLnNldFBvc2l0aW9uKDAsIDApO1xuICAgICAgICBiZ05vZGUuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgYmdOb2RlLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIFxuICAgICAgICB2YXIgYmcgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOe7mOWItuaMiemSruiDjOaZr1xuICAgICAgICBiZy5maWxsQ29sb3IgPSBiZ0NvbG9yO1xuICAgICAgICBiZy5yb3VuZFJlY3QoLXdpZHRoLzIsIC1oZWlnaHQvMiwgd2lkdGgsIGhlaWdodCwgOCk7XG4gICAgICAgIGJnLmZpbGwoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWklui+ueahhlxuICAgICAgICBiZy5zdHJva2VDb2xvciA9IGJvcmRlckNvbG9yO1xuICAgICAgICBiZy5saW5lV2lkdGggPSAyO1xuICAgICAgICBiZy5yb3VuZFJlY3QoLXdpZHRoLzIsIC1oZWlnaHQvMiwgd2lkdGgsIGhlaWdodCwgOCk7XG4gICAgICAgIGJnLnN0cm9rZSgpO1xuICAgICAgICBcbiAgICAgICAgLy8g5Li75oyJ6ZKu6auY5YWJ5pWI5p6cXG4gICAgICAgIGlmIChpc1ByaW1hcnkpIHtcbiAgICAgICAgICAgIC8vIOmhtumDqOmrmOWFiVxuICAgICAgICAgICAgYmcuZmlsbENvbG9yID0gY2MuY29sb3IoMjU1LCAyNTUsIDI1NSwgNDApO1xuICAgICAgICAgICAgYmcucm91bmRSZWN0KC13aWR0aC8yICsgMywgMywgd2lkdGggLSA2LCBoZWlnaHQvMiAtIDMsIDUpO1xuICAgICAgICAgICAgYmcuZmlsbCgpO1xuICAgICAgICAgICAgLy8g5bqV6YOo6Zi05b2xXG4gICAgICAgICAgICBiZy5maWxsQ29sb3IgPSBjYy5jb2xvcigwLCAwLCAwLCAzMCk7XG4gICAgICAgICAgICBiZy5yb3VuZFJlY3QoLXdpZHRoLzIgKyAzLCAtaGVpZ2h0LzIgKyAzLCB3aWR0aCAtIDYsIGhlaWdodC8zLCAzKTtcbiAgICAgICAgICAgIGJnLmZpbGwoKTtcbiAgICAgICAgfVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gYnRuO1xuICAgICAgICBcbiAgICAgICAgLy8g5oyJ6ZKu5paH5a2X6IqC54K5XG4gICAgICAgIHZhciB0ZXh0Tm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGV4dE5vZGVcIik7XG4gICAgICAgIHRleHROb2RlLnNldFBvc2l0aW9uKDAsIDApO1xuICAgICAgICB0ZXh0Tm9kZS5hbmNob3JYID0gMC41O1xuICAgICAgICB0ZXh0Tm9kZS5hbmNob3JZID0gMC41O1xuICAgICAgICB0ZXh0Tm9kZS53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0ZXh0Tm9kZS5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIFxuICAgICAgICB2YXIgbGFiZWwgPSB0ZXh0Tm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBsYWJlbC5zdHJpbmcgPSB0ZXh0O1xuICAgICAgICBsYWJlbC5mb250U2l6ZSA9IE1hdGguZmxvb3IoaGVpZ2h0ICogMC40KTtcbiAgICAgICAgbGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgbGFiZWwudmVydGljYWxBbGlnbiA9IGNjLkxhYmVsLlZlcnRpY2FsQWxpZ24uQ0VOVEVSO1xuICAgICAgICB0ZXh0Tm9kZS5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICBcbiAgICAgICAgdmFyIG91dGxpbmUgPSB0ZXh0Tm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKTtcbiAgICAgICAgb3V0bGluZS5jb2xvciA9IGNjLmNvbG9yKDAsIDAsIDAsIDE1MCk7XG4gICAgICAgIG91dGxpbmUud2lkdGggPSAyO1xuICAgICAgICB0ZXh0Tm9kZS5wYXJlbnQgPSBidG47XG4gICAgICAgIFxuICAgICAgICAvLyDop6bmkbjkuovku7ZcbiAgICAgICAgYnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX1NUQVJULCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBidG4uc2NhbGUgPSAwLjk1O1xuICAgICAgICB9KTtcbiAgICAgICAgYnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgYnRuLnNjYWxlID0gMTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9DQU5DRUwsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBidG4uc2NhbGUgPSAxO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBidG47XG4gICAgfSxcbiAgICBcbiAgICAvLyDliJvlu7rlvLnnqpfovpPlhaXmoYZcbiAgICBfY3JlYXRlRGlhbG9nSW5wdXQ6IGZ1bmN0aW9uKHBsYWNlaG9sZGVyLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCBub2RlTmFtZSkge1xuICAgICAgICB2YXIgaW5wdXROb2RlID0gbmV3IGNjLk5vZGUobm9kZU5hbWUgfHwgXCJEaWFsb2dJbnB1dFwiKTtcbiAgICAgICAgaW5wdXROb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUod2lkdGgsIGhlaWdodCkpO1xuICAgICAgICBpbnB1dE5vZGUuc2V0UG9zaXRpb24oeCwgeSk7XG4gICAgICAgIGlucHV0Tm9kZS5hbmNob3JYID0gMC41O1xuICAgICAgICBpbnB1dE5vZGUuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgXG4gICAgICAgIC8vIOi+k+WFpeahhuiDjOaZr1xuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJJbnB1dEJnXCIpO1xuICAgICAgICBiZ05vZGUuc2V0UG9zaXRpb24oMCwgMCk7XG4gICAgICAgIGJnTm9kZS5hbmNob3JYID0gMC41O1xuICAgICAgICBiZ05vZGUuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgXG4gICAgICAgIHZhciBiZyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICBiZy5maWxsQ29sb3IgPSBjYy5jb2xvcig1MCwgNDUsIDY1LCAyNTUpO1xuICAgICAgICBiZy5yb3VuZFJlY3QoLXdpZHRoLzIsIC1oZWlnaHQvMiwgd2lkdGgsIGhlaWdodCwgNSk7XG4gICAgICAgIGJnLmZpbGwoKTtcbiAgICAgICAgYmcuc3Ryb2tlQ29sb3IgPSBjYy5jb2xvcigxMDAsIDkwLCA3MCwgMjAwKTtcbiAgICAgICAgYmcubGluZVdpZHRoID0gMTtcbiAgICAgICAgYmcucm91bmRSZWN0KC13aWR0aC8yLCAtaGVpZ2h0LzIsIHdpZHRoLCBoZWlnaHQsIDUpO1xuICAgICAgICBiZy5zdHJva2UoKTtcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IGlucHV0Tm9kZTtcbiAgICAgICAgXG4gICAgICAgIC8vIHBsYWNlaG9sZGVy5paH5a2XXG4gICAgICAgIHZhciBwbGFjZWhvbGRlck5vZGUgPSBuZXcgY2MuTm9kZShcIlBsYWNlaG9sZGVyXCIpO1xuICAgICAgICBwbGFjZWhvbGRlck5vZGUuc2V0UG9zaXRpb24oMCwgMCk7XG4gICAgICAgIHBsYWNlaG9sZGVyTm9kZS5hbmNob3JYID0gMC41O1xuICAgICAgICBwbGFjZWhvbGRlck5vZGUuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgcGxhY2Vob2xkZXJOb2RlLndpZHRoID0gd2lkdGggLSAyMDtcbiAgICAgICAgcGxhY2Vob2xkZXJOb2RlLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgXG4gICAgICAgIHZhciBsYWJlbCA9IHBsYWNlaG9sZGVyTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBsYWJlbC5zdHJpbmcgPSBwbGFjZWhvbGRlcjtcbiAgICAgICAgbGFiZWwuZm9udFNpemUgPSBNYXRoLmZsb29yKGhlaWdodCAqIDAuNCk7XG4gICAgICAgIGxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIGxhYmVsLnZlcnRpY2FsQWxpZ24gPSBjYy5MYWJlbC5WZXJ0aWNhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgcGxhY2Vob2xkZXJOb2RlLmNvbG9yID0gY2MuY29sb3IoMTIwLCAxMTAsIDEwMCk7XG4gICAgICAgIHBsYWNlaG9sZGVyTm9kZS5wYXJlbnQgPSBpbnB1dE5vZGU7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaW5wdXROb2RlO1xuICAgIH0sXG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g5pi+56S65Yqg5YWl5oi/6Ze05a+G56CB6aqM6K+B5by556qX77yI5pyJ5a+G56CB55qE5oi/6Ze077yJXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgX3Nob3dQYXNzd29yZERpYWxvZzogZnVuY3Rpb24ocm9vbUNvZGUsIHJvb21Db25maWcsIHBsYXllckdvbGQsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5bnlLvluIPlsLrlr7hcbiAgICAgICAgdmFyIGNhbnZhcyA9IHRoaXMubm9kZS5nZXRDb21wb25lbnQoY2MuQ2FudmFzKSB8fCBjYy5maW5kKCdDYW52YXMnKS5nZXRDb21wb25lbnQoY2MuQ2FudmFzKTtcbiAgICAgICAgdmFyIHNjcmVlbkhlaWdodCA9IGNhbnZhcyA/IGNhbnZhcy5kZXNpZ25SZXNvbHV0aW9uLmhlaWdodCA6IDcyMDtcbiAgICAgICAgdmFyIHNjcmVlbldpZHRoID0gY2FudmFzID8gY2FudmFzLmRlc2lnblJlc29sdXRpb24ud2lkdGggOiAxMjgwO1xuICAgICAgICBcbiAgICAgICAgLy8g5by556qX5a655ZmoXG4gICAgICAgIHZhciBkaWFsb2cgPSBuZXcgY2MuTm9kZShcIlBhc3N3b3JkRGlhbG9nXCIpO1xuICAgICAgICBkaWFsb2cuc2V0Q29udGVudFNpemUoY2Muc2l6ZShzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSk7XG4gICAgICAgIGRpYWxvZy5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgZGlhbG9nLnpJbmRleCA9IDM1MDA7XG4gICAgICAgIGRpYWxvZy5wYXJlbnQgPSB0aGlzLm5vZGU7XG4gICAgICAgIFxuICAgICAgICAvLyDljYrpgI/mmI7pga7nvalcbiAgICAgICAgdmFyIG1hc2sgPSBuZXcgY2MuTm9kZShcIk1hc2tcIik7XG4gICAgICAgIHZhciBtYXNrRyA9IG1hc2suYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgbWFza0cuZmlsbENvbG9yID0gY2MuY29sb3IoMCwgMCwgMCwgMTgwKTtcbiAgICAgICAgbWFza0cucmVjdCgtc2NyZWVuV2lkdGgvMiwgLXNjcmVlbkhlaWdodC8yLCBzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KTtcbiAgICAgICAgbWFza0cuZmlsbCgpO1xuICAgICAgICBtYXNrLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIG1hc2sub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8g5by556qX5Li75L2TXG4gICAgICAgIHZhciBkaWFsb2dXaWR0aCA9IDM1MDtcbiAgICAgICAgdmFyIGRpYWxvZ0hlaWdodCA9IDIyMDtcbiAgICAgICAgdmFyIGRpYWxvZ0JnID0gbmV3IGNjLk5vZGUoXCJEaWFsb2dCZ1wiKTtcbiAgICAgICAgZGlhbG9nQmcuc2V0Q29udGVudFNpemUoY2Muc2l6ZShkaWFsb2dXaWR0aCwgZGlhbG9nSGVpZ2h0KSk7XG4gICAgICAgIFxuICAgICAgICB2YXIgZGJnID0gZGlhbG9nQmcuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgZGJnLmZpbGxDb2xvciA9IGNjLmNvbG9yKDM1LCAzMCwgNTAsIDI1MCk7XG4gICAgICAgIGRiZy5yb3VuZFJlY3QoLWRpYWxvZ1dpZHRoLzIsIC1kaWFsb2dIZWlnaHQvMiwgZGlhbG9nV2lkdGgsIGRpYWxvZ0hlaWdodCwgMTIpO1xuICAgICAgICBkYmcuZmlsbCgpO1xuICAgICAgICBkYmcuc3Ryb2tlQ29sb3IgPSBjYy5jb2xvcigxODAsIDE0MCwgNjAsIDIwMCk7XG4gICAgICAgIGRiZy5saW5lV2lkdGggPSAzO1xuICAgICAgICBkYmcucm91bmRSZWN0KC1kaWFsb2dXaWR0aC8yLCAtZGlhbG9nSGVpZ2h0LzIsIGRpYWxvZ1dpZHRoLCBkaWFsb2dIZWlnaHQsIDEyKTtcbiAgICAgICAgZGJnLnN0cm9rZSgpO1xuICAgICAgICBkaWFsb2dCZy5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICAvLyDmoIfpophcbiAgICAgICAgdmFyIHRpdGxlVGV4dCA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIik7XG4gICAgICAgIHRpdGxlVGV4dC5zZXRQb3NpdGlvbigwLCBkaWFsb2dIZWlnaHQvMiAtIDQwKTtcbiAgICAgICAgdGl0bGVUZXh0LmFuY2hvclggPSAwLjU7XG4gICAgICAgIHRpdGxlVGV4dC5hbmNob3JZID0gMC41O1xuICAgICAgICB2YXIgdHRsID0gdGl0bGVUZXh0LmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIHR0bC5zdHJpbmcgPSBcIuivpeaIv+mXtOmcgOimgeWvhueggVwiO1xuICAgICAgICB0dGwuZm9udFNpemUgPSAyMjtcbiAgICAgICAgdHRsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIHRpdGxlVGV4dC5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjIwLCAxMDApO1xuICAgICAgICB0aXRsZVRleHQucGFyZW50ID0gZGlhbG9nO1xuICAgICAgICBcbiAgICAgICAgLy8g5oi/6Ze05Y+35pi+56S6XG4gICAgICAgIHZhciBjb2RlVGV4dCA9IG5ldyBjYy5Ob2RlKFwiUm9vbUNvZGVcIik7XG4gICAgICAgIGNvZGVUZXh0LnNldFBvc2l0aW9uKDAsIGRpYWxvZ0hlaWdodC8yIC0gNzUpO1xuICAgICAgICBjb2RlVGV4dC5hbmNob3JYID0gMC41O1xuICAgICAgICBjb2RlVGV4dC5hbmNob3JZID0gMC41O1xuICAgICAgICB2YXIgY3RsID0gY29kZVRleHQuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgY3RsLnN0cmluZyA9IFwi5oi/6Ze05Y+3OiBcIiArIHJvb21Db2RlO1xuICAgICAgICBjdGwuZm9udFNpemUgPSAxNDtcbiAgICAgICAgY3RsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIGNvZGVUZXh0LmNvbG9yID0gY2MuY29sb3IoMTYwLCAxNTAsIDEzMCk7XG4gICAgICAgIGNvZGVUZXh0LnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIC8vIOWvhueggei+k+WFpeahhlxuICAgICAgICB2YXIgcHdkSW5wdXQgPSB0aGlzLl9jcmVhdGVEaWFsb2dJbnB1dChcIuivt+i+k+WFpeWvhueggVwiLCAwLCAxMCwgMjAwLCAzNiwgXCJQd2RJbnB1dFwiKTtcbiAgICAgICAgcHdkSW5wdXQucGFyZW50ID0gZGlhbG9nO1xuICAgICAgICBcbiAgICAgICAgLy8g5oyJ6ZKu5Yy65Z+fXG4gICAgICAgIHZhciBidG5ZID0gLWRpYWxvZ0hlaWdodC8yICsgNDU7XG4gICAgICAgIFxuICAgICAgICAvLyDlj5bmtojmjInpkq5cbiAgICAgICAgdmFyIGNhbmNlbEJ0biA9IHRoaXMuX2NyZWF0ZUJ1dHRvbk5vZGUoXCLlj5bmtohcIiwgY2MuY29sb3IoODAsIDc1LCA5MCksIC03MCwgYnRuWSwgODAsIDM0LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRpYWxvZy5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBjYW5jZWxCdG4ucGFyZW50ID0gZGlhbG9nO1xuICAgICAgICBcbiAgICAgICAgLy8g56Gu6K6k5oyJ6ZKuXG4gICAgICAgIHZhciBjb25maXJtQnRuID0gdGhpcy5fY3JlYXRlQnV0dG9uTm9kZShcIuehruiupFwiLCBjYy5jb2xvcig0MCwgMTMwLCA3MCksIDcwLCBidG5ZLCA4MCwgMzQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHB3ZElucHV0Tm9kZSA9IGRpYWxvZy5nZXRDaGlsZEJ5TmFtZShcIlB3ZElucHV0XCIpO1xuICAgICAgICAgICAgdmFyIHBsYWNlaG9sZGVyID0gcHdkSW5wdXROb2RlID8gcHdkSW5wdXROb2RlLmdldENoaWxkQnlOYW1lKFwiUGxhY2Vob2xkZXJcIikgOiBudWxsO1xuICAgICAgICAgICAgdmFyIHBhc3N3b3JkID0gcGxhY2Vob2xkZXIgPyBwbGFjZWhvbGRlci5nZXRDb21wb25lbnQoY2MuTGFiZWwpLnN0cmluZyA6IFwiXCI7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICghcGFzc3dvcmQgfHwgcGFzc3dvcmQgPT09IFwi6K+36L6T5YWl5a+G56CBXCIpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zaG93VGlwSW5EaWFsb2coZGlhbG9nLCBcIuivt+i+k+WFpeWvhueggVwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOmqjOivgeWvhuegge+8iOi/memHjOmcgOimgeiwg+eUqOacjeWKoeerr+mqjOivge+8iVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBkaWFsb2cuZGVzdHJveSgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhwYXNzd29yZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuICAgICAgICBjb25maXJtQnRuLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBkaWFsb2c7XG4gICAgfSxcbiAgICBcbiAgICAvLyDlnKjlvLnnqpfkuK3mmL7npLrmj5DnpLpcbiAgICBfc2hvd1RpcEluRGlhbG9nOiBmdW5jdGlvbihkaWFsb2csIG1lc3NhZ2UpIHtcbiAgICAgICAgdmFyIHRpcCA9IGRpYWxvZy5nZXRDaGlsZEJ5TmFtZShcIlRpcFRleHRcIik7XG4gICAgICAgIGlmICh0aXApIHRpcC5kZXN0cm95KCk7XG4gICAgICAgIFxuICAgICAgICB0aXAgPSBuZXcgY2MuTm9kZShcIlRpcFRleHRcIik7XG4gICAgICAgIHRpcC5zZXRQb3NpdGlvbigwLCAtNTApO1xuICAgICAgICB0aXAuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgdGlwLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIFxuICAgICAgICB2YXIgbGFiZWwgPSB0aXAuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgbGFiZWwuc3RyaW5nID0gbWVzc2FnZTtcbiAgICAgICAgbGFiZWwuZm9udFNpemUgPSAxNDtcbiAgICAgICAgbGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgdGlwLmNvbG9yID0gY2MuY29sb3IoMjU1LCAxNTAsIDEwMCk7XG4gICAgICAgIHRpcC5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aXAgJiYgdGlwLmlzVmFsaWQpIHRpcC5kZXN0cm95KCk7XG4gICAgICAgIH0sIDIpO1xuICAgIH0sXG4gICAgXG4gICAgLy8g6I635Y+W5bm25riy5p+T5oi/6Ze05YiX6KGo77yI55So5LqO5YWo5bGP5Zy65pmv77yJLSDlj6rmmL7npLrnnJ/lrp7miL/pl7RcbiAgICBfZmV0Y2hBbmRSZW5kZXJSb29tTGlzdEZvclNjZW5lOiBmdW5jdGlvbihjb250YWluZXIsIGxvYWRpbmdMYWJlbCwgcm9vbUNvbmZpZywgcGxheWVyR29sZCwgc2NlbmVOb2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICB2YXIgc29ja2V0ID0gbXlnbG9iYWwgJiYgbXlnbG9iYWwuc29ja2V0ID8gbXlnbG9iYWwuc29ja2V0IDogbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8vIOajgOafpVdlYlNvY2tldOaYr+WQpuW3sui/nuaOpVxuICAgICAgICB2YXIgaXNDb25uZWN0ZWQgPSBzb2NrZXQgJiYgc29ja2V0LmlzQ29ubmVjdGVkICYmIHNvY2tldC5pc0Nvbm5lY3RlZCgpO1xuICAgICAgICB2YXIgaXNXZWJTb2NrZXRPcGVuID0gc29ja2V0ICYmIHNvY2tldC5pc1dlYlNvY2tldE9wZW4gJiYgc29ja2V0LmlzV2ViU29ja2V0T3BlbigpO1xuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8vIOWtmOWCqOW9k+WJjeaIv+mXtOWIl+ihqO+8jOeUqOS6juWunuaXtuabtOaWsFxuICAgICAgICB2YXIgY3VycmVudFJvb21zID0gW107XG4gICAgICAgIFxuICAgICAgICAvLyDorr7nva7lrp7ml7bmiL/pl7TliJfooajmm7TmlrDnm5HlkKzlmahcbiAgICAgICAgdmFyIHJvb21MaXN0VXBkYXRlSGFuZGxlciA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGFjdGlvblR5cGUgPSBkYXRhLmFjdGlvbl90eXBlO1xuICAgICAgICAgICAgdmFyIHJvb21Db2RlID0gZGF0YS5yb29tX2NvZGU7XG4gICAgICAgICAgICB2YXIgcm9vbSA9IGRhdGEucm9vbTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGFjdGlvblR5cGUgPT09IFwiYWRkXCIgJiYgcm9vbSkge1xuICAgICAgICAgICAgICAgIC8vIOa3u+WKoOaWsOaIv+mXtFxuICAgICAgICAgICAgICAgIHZhciBleGlzdHMgPSBjdXJyZW50Um9vbXMuc29tZShmdW5jdGlvbihyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoci5yb29tX2NvZGUgfHwgci5yb29tQ29kZSkgPT09IChyb29tLnJvb21fY29kZSB8fCByb29tLnJvb21Db2RlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoIWV4aXN0cykge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50Um9vbXMucHVzaChyb29tKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvblR5cGUgPT09IFwidXBkYXRlXCIgJiYgcm9vbSkge1xuICAgICAgICAgICAgICAgIC8vIOabtOaWsOaIv+mXtOS/oeaBr1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3VycmVudFJvb21zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgoY3VycmVudFJvb21zW2ldLnJvb21fY29kZSB8fCBjdXJyZW50Um9vbXNbaV0ucm9vbUNvZGUpID09PSAocm9vbS5yb29tX2NvZGUgfHwgcm9vbS5yb29tQ29kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRSb29tc1tpXSA9IHJvb207XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uVHlwZSA9PT0gXCJyZW1vdmVcIikge1xuICAgICAgICAgICAgICAgIC8vIOenu+mZpOaIv+mXtFxuICAgICAgICAgICAgICAgIGN1cnJlbnRSb29tcyA9IGN1cnJlbnRSb29tcy5maWx0ZXIoZnVuY3Rpb24ocikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKHIucm9vbV9jb2RlIHx8IHIucm9vbUNvZGUpICE9PSByb29tQ29kZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6YeN5paw5riy5p+T5oi/6Ze05YiX6KGoXG4gICAgICAgICAgICB2YXIgZmlsdGVyZWRSb29tcyA9IGN1cnJlbnRSb29tcy5maWx0ZXIoZnVuY3Rpb24ocikge1xuICAgICAgICAgICAgICAgIHZhciBjb3VudCA9IHIucGxheWVyX2NvdW50IHx8IHIucGxheWVyQ291bnQgfHwgMDtcbiAgICAgICAgICAgICAgICByZXR1cm4gY291bnQgPiAwICYmIGNvdW50IDwgMztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc2VsZi5fcmVuZGVyUm9vbUxpc3RJblNjZW5lKGNvbnRhaW5lciwgZmlsdGVyZWRSb29tcywgcm9vbUNvbmZpZywgcGxheWVyR29sZCwgc2NlbmVOb2RlKTtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIC8vIOazqOWGjOebkeWQrOWZqFxuICAgICAgICBpZiAoc29ja2V0ICYmIHNvY2tldC5vblJvb21MaXN0VXBkYXRlKSB7XG4gICAgICAgICAgICBzb2NrZXQub25Sb29tTGlzdFVwZGF0ZShyb29tTGlzdFVwZGF0ZUhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDkv53lrZjnm5HlkKzlmajlvJXnlKjvvIznlKjkuo7lkI7nu63lj5bmtojms6jlhoxcbiAgICAgICAgc2NlbmVOb2RlLl9yb29tTGlzdFVwZGF0ZUhhbmRsZXIgPSByb29tTGlzdFVwZGF0ZUhhbmRsZXI7XG4gICAgICAgIFxuICAgICAgICAvLyDlpoLmnpxXZWJTb2NrZXTmnKrov57mjqXvvIzmmL7npLrnqbrliJfooahcbiAgICAgICAgaWYgKCFzb2NrZXQgfHwgIWlzQ29ubmVjdGVkIHx8ICFpc1dlYlNvY2tldE9wZW4pIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRpbmdMYWJlbCAmJiBsb2FkaW5nTGFiZWwuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nTGFiZWwuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIOaYvuekuuepuuWIl+ihqOaPkOekulxuICAgICAgICAgICAgICAgIHNlbGYuX3JlbmRlclJvb21MaXN0SW5TY2VuZShjb250YWluZXIsIFtdLCByb29tQ29uZmlnLCBwbGF5ZXJHb2xkLCBzY2VuZU5vZGUpO1xuICAgICAgICAgICAgfSwgMC41KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6K6+572u6LaF5pe2XG4gICAgICAgIHZhciB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGxvYWRpbmdMYWJlbCAmJiBsb2FkaW5nTGFiZWwuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgIGxvYWRpbmdMYWJlbC5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOaYvuekuuepuuWIl+ihqOaPkOekulxuICAgICAgICAgICAgc2VsZi5fcmVuZGVyUm9vbUxpc3RJblNjZW5lKGNvbnRhaW5lciwgW10sIHJvb21Db25maWcsIHBsYXllckdvbGQsIHNjZW5lTm9kZSk7XG4gICAgICAgIH0sIDUwMDApO1xuICAgICAgICBcbiAgICAgICAgc29ja2V0LmdldFJvb21MaXN0KGZ1bmN0aW9uKHJlc3VsdCwgcm9vbXMpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChsb2FkaW5nTGFiZWwgJiYgbG9hZGluZ0xhYmVsLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICBsb2FkaW5nTGFiZWwuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IDAgJiYgcm9vbXMgJiYgcm9vbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIC8vIOWtmOWCqOaIv+mXtOWIl+ihqOeUqOS6juWunuaXtuabtOaWsFxuICAgICAgICAgICAgICAgIGN1cnJlbnRSb29tcyA9IHJvb21zO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOi/h+a7pO+8muWPquaYvuekuuS6uuaVsOWwkeS6jjPkurrnmoTmiL/pl7RcbiAgICAgICAgICAgICAgICB2YXIgZmlsdGVyZWRSb29tcyA9IHJvb21zLmZpbHRlcihmdW5jdGlvbihyb29tKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb3VudCA9IHJvb20ucGxheWVyX2NvdW50IHx8IHJvb20ucGxheWVyQ291bnQgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvdW50ID4gMCAmJiBjb3VudCA8IDM7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc2VsZi5fcmVuZGVyUm9vbUxpc3RJblNjZW5lKGNvbnRhaW5lciwgZmlsdGVyZWRSb29tcywgcm9vbUNvbmZpZywgcGxheWVyR29sZCwgc2NlbmVOb2RlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8g5rKh5pyJ5oi/6Ze05oiW6K+35rGC5aSx6LSl77yM5pi+56S656m65YiX6KGoXG4gICAgICAgICAgICAgICAgc2VsZi5fcmVuZGVyUm9vbUxpc3RJblNjZW5lKGNvbnRhaW5lciwgW10sIHJvb21Db25maWcsIHBsYXllckdvbGQsIHNjZW5lTm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgXG5cbiAgICBcbiAgICAvLyDmuLLmn5PmiL/pl7TliJfooajvvIjnroDmtIHmuIXmmbDnmoTliJfooajorr7orqHvvIlcbiAgICBfcmVuZGVyUm9vbUxpc3RJblNjZW5lOiBmdW5jdGlvbihjb250YWluZXIsIHJvb21zLCByb29tQ29uZmlnLCBwbGF5ZXJHb2xkLCBzY2VuZU5vZGUpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgLy8g5riF56m65a655Zmo5Lit6Z2eTG9hZGluZ0xhYmVs55qE5a2Q6IqC54K5XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IGNvbnRhaW5lci5jaGlsZHJlbi5zbGljZSgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoY2hpbGRyZW5baV0ubmFtZSAhPT0gXCJMb2FkaW5nTGFiZWxcIikge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuW2ldLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIGNvbnRhaW5lcldpZHRoID0gY29udGFpbmVyLndpZHRoO1xuICAgICAgICB2YXIgY29sV2lkdGggPSBjb250YWluZXJXaWR0aCAvIDU7XG4gICAgICAgIHZhciBpdGVtSGVpZ2h0ID0gNTA7ICAvLyDlop7liqDliJfooajpobnpq5jluqZcbiAgICAgICAgdmFyIHN0YXJ0WSA9IGNvbnRhaW5lci5oZWlnaHQvMiAtIDE1O1xuICAgICAgICBcbiAgICAgICAgLy8g56m65YiX6KGo5aSE55CGXG4gICAgICAgIGlmICghcm9vbXMgfHwgcm9vbXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB2YXIgZW1wdHlOb2RlID0gbmV3IGNjLk5vZGUoXCJFbXB0eVRpcFwiKTtcbiAgICAgICAgICAgIGVtcHR5Tm9kZS5hbmNob3JYID0gMC41O1xuICAgICAgICAgICAgZW1wdHlOb2RlLmFuY2hvclkgPSAwLjU7XG4gICAgICAgICAgICB2YXIgZWwgPSBlbXB0eU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgICAgIGVsLnN0cmluZyA9IFwi5pqC5peg5Y+v5Yqg5YWl55qE5oi/6Ze0XCI7XG4gICAgICAgICAgICBlbC5mb250U2l6ZSA9IDE4OyAgLy8g5aKe5aSn5a2X5L2TXG4gICAgICAgICAgICBlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICAgICAgZW1wdHlOb2RlLmNvbG9yID0gY2MuY29sb3IoMTYwLCAxNTAsIDE0MCk7XG4gICAgICAgICAgICBlbXB0eU5vZGUucGFyZW50ID0gY29udGFpbmVyO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmuLLmn5PmiL/pl7TliJfooajpoblcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByb29tcy5sZW5ndGggJiYgaSA8IDg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJvb20gPSByb29tc1tpXTtcbiAgICAgICAgICAgIHZhciBpdGVtWSA9IHN0YXJ0WSAtIGkgKiBpdGVtSGVpZ2h0O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDliJfooajpobnog4zmma9cbiAgICAgICAgICAgIHZhciBpdGVtQmcgPSBuZXcgY2MuTm9kZShcIlJvb21JdGVtX1wiICsgaSk7XG4gICAgICAgICAgICBpdGVtQmcuc2V0Q29udGVudFNpemUoY2Muc2l6ZShjb250YWluZXJXaWR0aCAtIDUsIGl0ZW1IZWlnaHQgLSA0KSk7XG4gICAgICAgICAgICBpdGVtQmcuc2V0UG9zaXRpb24oMCwgaXRlbVkpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgaWcgPSBpdGVtQmcuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgICAgIGlnLmZpbGxDb2xvciA9IGkgJSAyID09PSAwID8gY2MuY29sb3IoMzUsIDMwLCA1MCwgMjIwKSA6IGNjLmNvbG9yKDMwLCAyOCwgNDUsIDIyMCk7XG4gICAgICAgICAgICBpZy5yb3VuZFJlY3QoLShjb250YWluZXJXaWR0aCAtIDUpLzIsIC0oaXRlbUhlaWdodCAtIDQpLzIsIGNvbnRhaW5lcldpZHRoIC0gNSwgaXRlbUhlaWdodCAtIDQsIDQpO1xuICAgICAgICAgICAgaWcuZmlsbCgpO1xuICAgICAgICAgICAgaXRlbUJnLnBhcmVudCA9IGNvbnRhaW5lcjtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHBsYXllckNvdW50ID0gcm9vbS5wbGF5ZXJfY291bnQgfHwgcm9vbS5wbGF5ZXJDb3VudCB8fCAwO1xuICAgICAgICAgICAgdmFyIHJvb21Db2RlID0gcm9vbS5yb29tX2NvZGUgfHwgcm9vbS5yb29tQ29kZSB8fCBcIuacquefpVwiO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmiL/pl7Tlj7cgLSDlop7lpKflrZfkvZNcbiAgICAgICAgICAgIHZhciBjb2RlVGV4dCA9IG5ldyBjYy5Ob2RlKFwiQ29kZVRleHRcIik7XG4gICAgICAgICAgICBjb2RlVGV4dC54ID0gLWNvbnRhaW5lcldpZHRoLzIgKyBjb2xXaWR0aCAqIDAuNTtcbiAgICAgICAgICAgIGNvZGVUZXh0LmFuY2hvclggPSAwLjU7XG4gICAgICAgICAgICBjb2RlVGV4dC5hbmNob3JZID0gMC41O1xuICAgICAgICAgICAgdmFyIGNsID0gY29kZVRleHQuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgICAgIGNsLnN0cmluZyA9IHJvb21Db2RlO1xuICAgICAgICAgICAgY2wuZm9udFNpemUgPSAxNjsgIC8vIOWinuWkp+Wtl+S9k1xuICAgICAgICAgICAgY2wuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgICAgIGNvZGVUZXh0LmNvbG9yID0gY2MuY29sb3IoMjIwLCAyMDAsIDE2MCk7XG4gICAgICAgICAgICBjb2RlVGV4dC5wYXJlbnQgPSBpdGVtQmc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOS6uuaVsCAtIOWinuWkp+Wtl+S9k1xuICAgICAgICAgICAgdmFyIGNvdW50VGV4dCA9IG5ldyBjYy5Ob2RlKFwiQ291bnRUZXh0XCIpO1xuICAgICAgICAgICAgY291bnRUZXh0LnggPSAtY29udGFpbmVyV2lkdGgvMiArIGNvbFdpZHRoICogMS41O1xuICAgICAgICAgICAgY291bnRUZXh0LmFuY2hvclggPSAwLjU7XG4gICAgICAgICAgICBjb3VudFRleHQuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgICAgIHZhciBjdGwgPSBjb3VudFRleHQuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgICAgIGN0bC5zdHJpbmcgPSBwbGF5ZXJDb3VudCArIFwiLzNcIjtcbiAgICAgICAgICAgIGN0bC5mb250U2l6ZSA9IDE2OyAgLy8g5aKe5aSn5a2X5L2TXG4gICAgICAgICAgICBjdGwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgICAgIGNvdW50VGV4dC5jb2xvciA9IHBsYXllckNvdW50ID49IDMgPyBjYy5jb2xvcigyMjAsIDEwMCwgODApIDogY2MuY29sb3IoMTAwLCAyMDAsIDEwMCk7XG4gICAgICAgICAgICBjb3VudFRleHQucGFyZW50ID0gaXRlbUJnO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlupXliIYgLSDlop7lpKflrZfkvZNcbiAgICAgICAgICAgIHZhciBzY29yZVRleHQgPSBuZXcgY2MuTm9kZShcIlNjb3JlVGV4dFwiKTtcbiAgICAgICAgICAgIHNjb3JlVGV4dC54ID0gLWNvbnRhaW5lcldpZHRoLzIgKyBjb2xXaWR0aCAqIDIuNTtcbiAgICAgICAgICAgIHNjb3JlVGV4dC5hbmNob3JYID0gMC41O1xuICAgICAgICAgICAgc2NvcmVUZXh0LmFuY2hvclkgPSAwLjU7XG4gICAgICAgICAgICB2YXIgc2wgPSBzY29yZVRleHQuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgICAgIHNsLnN0cmluZyA9IFwiXCIgKyAocm9vbS5iYXNlX3Njb3JlIHx8IHJvb21Db25maWcuYmFzZV9zY29yZSB8fCAxKTtcbiAgICAgICAgICAgIHNsLmZvbnRTaXplID0gMTY7ICAvLyDlop7lpKflrZfkvZNcbiAgICAgICAgICAgIHNsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgICAgICBzY29yZVRleHQuY29sb3IgPSBjYy5jb2xvcigyMjAsIDE4MCwgODApO1xuICAgICAgICAgICAgc2NvcmVUZXh0LnBhcmVudCA9IGl0ZW1CZztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g54q25oCBIC0g5aKe5aSn5a2X5L2TXG4gICAgICAgICAgICB2YXIgc3RhdHVzVGV4dCA9IG5ldyBjYy5Ob2RlKFwiU3RhdHVzVGV4dFwiKTtcbiAgICAgICAgICAgIHN0YXR1c1RleHQueCA9IC1jb250YWluZXJXaWR0aC8yICsgY29sV2lkdGggKiAzLjU7XG4gICAgICAgICAgICBzdGF0dXNUZXh0LmFuY2hvclggPSAwLjU7XG4gICAgICAgICAgICBzdGF0dXNUZXh0LmFuY2hvclkgPSAwLjU7XG4gICAgICAgICAgICB2YXIgc3RsID0gc3RhdHVzVGV4dC5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICAgICAgc3RsLnN0cmluZyA9IHBsYXllckNvdW50ID49IDMgPyBcIuW3sua7oVwiIDogXCLnrYnlvoXkuK1cIjtcbiAgICAgICAgICAgIHN0bC5mb250U2l6ZSA9IDE2OyAgLy8g5aKe5aSn5a2X5L2TXG4gICAgICAgICAgICBzdGwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgICAgIHN0YXR1c1RleHQuY29sb3IgPSBwbGF5ZXJDb3VudCA+PSAzID8gY2MuY29sb3IoMjIwLCAxMDAsIDgwKSA6IGNjLmNvbG9yKDEwMCwgMjAwLCAxMDApO1xuICAgICAgICAgICAgc3RhdHVzVGV4dC5wYXJlbnQgPSBpdGVtQmc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWKoOWFpeaMiemSriAtIOWinuWkp+WwuuWvuFxuICAgICAgICAgICAgKGZ1bmN0aW9uKHJvb21EYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIGpvaW5CdG4gPSBzZWxmLl9jcmVhdGVBY3Rpb25CdXR0b24oXG4gICAgICAgICAgICAgICAgICAgIFwi5Yqg5YWlXCIsXG4gICAgICAgICAgICAgICAgICAgIGNjLmNvbG9yKDc2LCAxNzUsIDgwKSxcbiAgICAgICAgICAgICAgICAgICAgLWNvbnRhaW5lcldpZHRoLzIgKyBjb2xXaWR0aCAqIDQuNSxcbiAgICAgICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAgICAgNzAsIDM2LCAgLy8g5aKe5Yqg5bC65a+4XG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGUgPSByb29tRGF0YS5yb29tX2NvZGUgfHwgcm9vbURhdGEucm9vbUNvZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2NlbmUgPSBzY2VuZU5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJSb29tTGlzdFNjZW5lXCIpIHx8IHNjZW5lTm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY2VuZS5kZXN0cm95KSBzY2VuZS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9qb2luUm9vbShjb2RlLCByb29tQ29uZmlnLCBwbGF5ZXJHb2xkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgam9pbkJ0bi5wYXJlbnQgPSBpdGVtQmc7XG4gICAgICAgICAgICB9KShyb29tKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLy8g5pi+56S65oi/6Ze05YiX6KGo5by556qXXG4gICAgX3Nob3dSb29tTGlzdERpYWxvZzogZnVuY3Rpb24ocm9vbUNvbmZpZywgcGxheWVyR29sZCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbDtcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyDnp7vpmaTml6fnmoTlvLnnqpdcbiAgICAgICAgdmFyIG9sZERpYWxvZyA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcIlJvb21MaXN0RGlhbG9nXCIpO1xuICAgICAgICBpZiAob2xkRGlhbG9nKSBvbGREaWFsb2cuZGVzdHJveSgpO1xuICAgICAgICBcbiAgICAgICAgLy8g56e76Zmk5pen55qE5o+Q56S6XG4gICAgICAgIHZhciBvbGRUaXAgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJyb29tX3RpcFwiKTtcbiAgICAgICAgaWYgKG9sZFRpcCkgb2xkVGlwLmRlc3Ryb3koKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPlueUu+W4g+WwuuWvuFxuICAgICAgICB2YXIgY2FudmFzID0gdGhpcy5ub2RlLmdldENvbXBvbmVudChjYy5DYW52YXMpIHx8IGNjLmZpbmQoJ0NhbnZhcycpLmdldENvbXBvbmVudChjYy5DYW52YXMpO1xuICAgICAgICB2YXIgc2NyZWVuSGVpZ2h0ID0gY2FudmFzID8gY2FudmFzLmRlc2lnblJlc29sdXRpb24uaGVpZ2h0IDogNzIwO1xuICAgICAgICB2YXIgc2NyZWVuV2lkdGggPSBjYW52YXMgPyBjYW52YXMuZGVzaWduUmVzb2x1dGlvbi53aWR0aCA6IDEyODA7XG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7rlvLnnqpflrrnlmahcbiAgICAgICAgdmFyIGRpYWxvZyA9IG5ldyBjYy5Ob2RlKFwiUm9vbUxpc3REaWFsb2dcIik7XG4gICAgICAgIGRpYWxvZy5zZXRDb250ZW50U2l6ZShjYy5zaXplKDY1MCwgNDUwKSk7XG4gICAgICAgIGRpYWxvZy5hbmNob3JYID0gMC41O1xuICAgICAgICBkaWFsb2cuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgZGlhbG9nLnggPSAwO1xuICAgICAgICBkaWFsb2cueSA9IDUwOyAgLy8g56iN5b6u5LiK56e7XG4gICAgICAgIGRpYWxvZy56SW5kZXggPSAxMDAwOyAgLy8g56Gu5L+d5Zyo5pyA5LiK5bGCXG4gICAgICAgIGRpYWxvZy5wYXJlbnQgPSB0aGlzLm5vZGU7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDog4zmma/pga7nvanvvIjljYrpgI/mmI7pu5HoibLvvIlcbiAgICAgICAgdmFyIG1hc2sgPSBuZXcgY2MuTm9kZShcIk1hc2tcIik7XG4gICAgICAgIG1hc2suc2V0Q29udGVudFNpemUoY2Muc2l6ZShzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSk7XG4gICAgICAgIG1hc2suYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgbWFzay5hbmNob3JZID0gMC41O1xuICAgICAgICBtYXNrLnggPSAwO1xuICAgICAgICBtYXNrLnkgPSAtNTA7XG4gICAgICAgIHZhciBtYXNrR3JhcGhpY3MgPSBtYXNrLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIG1hc2tHcmFwaGljcy5maWxsQ29sb3IgPSBjYy5jb2xvcigwLCAwLCAwLCAxODApO1xuICAgICAgICBtYXNrR3JhcGhpY3MucmVjdCgtc2NyZWVuV2lkdGgvMiwgLXNjcmVlbkhlaWdodC8yLCBzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KTtcbiAgICAgICAgbWFza0dyYXBoaWNzLmZpbGwoKTtcbiAgICAgICAgbWFzay5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICAvLyDngrnlh7vpga7nvanlhbPpl63lvLnnqpdcbiAgICAgICAgbWFzay5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGRpYWxvZy5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg5by556qX6IOM5pmv77yI55m96Imy5ZyG6KeS55+p5b2i77yJXG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkJnTm9kZVwiKTtcbiAgICAgICAgYmdOb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoNjIwLCA0MjApKTtcbiAgICAgICAgdmFyIGJnR3JhcGhpY3MgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgYmdHcmFwaGljcy5maWxsQ29sb3IgPSBjYy5jb2xvcig0NSwgNDUsIDY1LCAyNTUpO1xuICAgICAgICBiZ0dyYXBoaWNzLnJvdW5kUmVjdCgtMzEwLCAtMjEwLCA2MjAsIDQyMCwgMTUpO1xuICAgICAgICBiZ0dyYXBoaWNzLmZpbGwoKTtcbiAgICAgICAgYmdHcmFwaGljcy5zdHJva2VDb2xvciA9IGNjLmNvbG9yKDEwMCwgMTAwLCAxNDAsIDI1NSk7XG4gICAgICAgIGJnR3JhcGhpY3MubGluZVdpZHRoID0gMztcbiAgICAgICAgYmdHcmFwaGljcy5yb3VuZFJlY3QoLTMxMCwgLTIxMCwgNjIwLCA0MjAsIDE1KTtcbiAgICAgICAgYmdHcmFwaGljcy5zdHJva2UoKTtcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIC8vIOagh+mimFxuICAgICAgICB2YXIgdGl0bGVOb2RlID0gbmV3IGNjLk5vZGUoXCJUaXRsZVwiKTtcbiAgICAgICAgdGl0bGVOb2RlLnkgPSAxNzA7XG4gICAgICAgIHZhciB0aXRsZUxhYmVsID0gdGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIHRpdGxlTGFiZWwuc3RyaW5nID0gXCLjgJBcIiArIHJvb21Db25maWcucm9vbV9uYW1lICsgXCLjgJFcIjtcbiAgICAgICAgdGl0bGVMYWJlbC5mb250U2l6ZSA9IDM2O1xuICAgICAgICB0aXRsZUxhYmVsLmxpbmVIZWlnaHQgPSA0NDtcbiAgICAgICAgdGl0bGVMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICB0aXRsZU5vZGUuY29sb3IgPSBjYy5jb2xvcigyNTUsIDIxNSwgMCk7XG4gICAgICAgIHRpdGxlTm9kZS5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICAvLyDlia/moIfpophcbiAgICAgICAgdmFyIHN1YlRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiU3ViVGl0bGVcIik7XG4gICAgICAgIHN1YlRpdGxlTm9kZS55ID0gMTMwO1xuICAgICAgICB2YXIgc3ViVGl0bGVMYWJlbCA9IHN1YlRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBzdWJUaXRsZUxhYmVsLnN0cmluZyA9IFwi6YCJ5oup5ri45oiP5pa55byPXCI7XG4gICAgICAgIHN1YlRpdGxlTGFiZWwuZm9udFNpemUgPSAyNDtcbiAgICAgICAgc3ViVGl0bGVMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICBzdWJUaXRsZU5vZGUuY29sb3IgPSBjYy5jb2xvcigxODAsIDE4MCwgMjAwKTtcbiAgICAgICAgc3ViVGl0bGVOb2RlLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIC8vIOaIv+mXtOWIl+ihqOWuueWZqFxuICAgICAgICB2YXIgbGlzdENvbnRhaW5lciA9IG5ldyBjYy5Ob2RlKFwiTGlzdENvbnRhaW5lclwiKTtcbiAgICAgICAgbGlzdENvbnRhaW5lci5zZXRDb250ZW50U2l6ZShjYy5zaXplKDU4MCwgMTIwKSk7XG4gICAgICAgIGxpc3RDb250YWluZXIueSA9IDUwO1xuICAgICAgICBsaXN0Q29udGFpbmVyLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIC8vIOWKoOi9veS4reeahOaPkOekulxuICAgICAgICB2YXIgbG9hZGluZ0xhYmVsID0gbmV3IGNjLk5vZGUoXCJMb2FkaW5nTGFiZWxcIik7XG4gICAgICAgIGxvYWRpbmdMYWJlbC55ID0gMDtcbiAgICAgICAgdmFyIGxvYWRpbmcgPSBsb2FkaW5nTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgbG9hZGluZy5zdHJpbmcgPSBcIuato+WcqOiOt+WPluaIv+mXtOWIl+ihqC4uLlwiO1xuICAgICAgICBsb2FkaW5nLmZvbnRTaXplID0gMjI7XG4gICAgICAgIGxvYWRpbmcuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgbG9hZGluZ0xhYmVsLmNvbG9yID0gY2MuY29sb3IoMTUwLCAxNTAsIDE3MCk7XG4gICAgICAgIGxvYWRpbmdMYWJlbC5wYXJlbnQgPSBsaXN0Q29udGFpbmVyO1xuICAgICAgICBcbiAgICAgICAgLy8g5oyJ6ZKu5a655ZmoIC0g5pS+5Zyo5Lit6Ze05pi+55y85L2N572uXG4gICAgICAgIHZhciBidG5Db250YWluZXIgPSBuZXcgY2MuTm9kZShcIkJ0bkNvbnRhaW5lclwiKTtcbiAgICAgICAgYnRuQ29udGFpbmVyLnkgPSAtNjA7XG4gICAgICAgIGJ0bkNvbnRhaW5lci5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICAvLyDlv6vpgJ/ljLnphY3mjInpkq7vvIjnu7/oibLvvIzmnIDlpKfvvIlcbiAgICAgICAgdmFyIHF1aWNrTWF0Y2hCdG4gPSB0aGlzLl9jcmVhdGVCdXR0b24oXCLwn46uIOW/q+mAn+WMuemFjVwiLCBjYy5jb2xvcig0NiwgMTI1LCA1MCksIC0yMDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGlhbG9nLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHNlbGYuX3F1aWNrTWF0Y2gocm9vbUNvbmZpZywgcGxheWVyR29sZCk7XG4gICAgICAgIH0sIDE4MCwgNTUpO1xuICAgICAgICBxdWlja01hdGNoQnRuLnBhcmVudCA9IGJ0bkNvbnRhaW5lcjtcbiAgICAgICAgXG4gICAgICAgIC8vIOWIm+W7uuaIv+mXtOaMiemSru+8iOiTneiJsu+8iVxuICAgICAgICB2YXIgY3JlYXRlUm9vbUJ0biA9IHRoaXMuX2NyZWF0ZUJ1dHRvbihcIvCfj6Ag5Yib5bu65oi/6Ze0XCIsIGNjLmNvbG9yKDIxLCAxMDEsIDE5MiksIDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGlhbG9nLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHNlbGYuX2NyZWF0ZVJvb20ocm9vbUNvbmZpZywgcGxheWVyR29sZCk7XG4gICAgICAgIH0sIDE4MCwgNTUpO1xuICAgICAgICBjcmVhdGVSb29tQnRuLnBhcmVudCA9IGJ0bkNvbnRhaW5lcjtcbiAgICAgICAgXG4gICAgICAgIC8vIOWFs+mXreaMiemSru+8iOeBsOiJsu+8iVxuICAgICAgICB2YXIgY2xvc2VCdG4gPSB0aGlzLl9jcmVhdGVCdXR0b24oXCLinJYg5YWz6ZetXCIsIGNjLmNvbG9yKDEyMCwgMTIwLCAxMjApLCAyMDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGlhbG9nLmRlc3Ryb3koKTtcbiAgICAgICAgfSwgMTAwLCA0NSk7XG4gICAgICAgIGNsb3NlQnRuLnBhcmVudCA9IGJ0bkNvbnRhaW5lcjtcbiAgICAgICAgXG4gICAgICAgIC8vIOi+k+WFpeaIv+mXtOWPt+WMuuWfn1xuICAgICAgICB2YXIgaW5wdXRDb250YWluZXIgPSBuZXcgY2MuTm9kZShcIklucHV0Q29udGFpbmVyXCIpO1xuICAgICAgICBpbnB1dENvbnRhaW5lci55ID0gLTE0MDtcbiAgICAgICAgaW5wdXRDb250YWluZXIucGFyZW50ID0gZGlhbG9nO1xuICAgICAgICBcbiAgICAgICAgdmFyIGlucHV0TGFiZWwgPSBuZXcgY2MuTm9kZShcIklucHV0TGFiZWxcIik7XG4gICAgICAgIGlucHV0TGFiZWwueCA9IC0yNTA7XG4gICAgICAgIHZhciBpbnB1dExhYmVsQ29tcCA9IGlucHV0TGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgaW5wdXRMYWJlbENvbXAuc3RyaW5nID0gXCLmiL/pl7Tlj7c6XCI7XG4gICAgICAgIGlucHV0TGFiZWxDb21wLmZvbnRTaXplID0gMjI7XG4gICAgICAgIGlucHV0TGFiZWwuY29sb3IgPSBjYy5jb2xvcigyMDAsIDIwMCwgMjAwKTtcbiAgICAgICAgaW5wdXRMYWJlbC5wYXJlbnQgPSBpbnB1dENvbnRhaW5lcjtcbiAgICAgICAgXG4gICAgICAgIC8vIOaIv+mXtOWPt+i+k+WFpeahhuiDjOaZr1xuICAgICAgICB2YXIgaW5wdXRCZ05vZGUgPSBuZXcgY2MuTm9kZShcIklucHV0QmdcIik7XG4gICAgICAgIGlucHV0QmdOb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoMTgwLCA0MCkpO1xuICAgICAgICBpbnB1dEJnTm9kZS54ID0gLTExMDtcbiAgICAgICAgdmFyIGlucHV0QmcgPSBpbnB1dEJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICBpbnB1dEJnLmZpbGxDb2xvciA9IGNjLmNvbG9yKDYwLCA2MCwgODAsIDI1NSk7XG4gICAgICAgIGlucHV0Qmcucm91bmRSZWN0KC05MCwgLTIwLCAxODAsIDQwLCA1KTtcbiAgICAgICAgaW5wdXRCZy5maWxsKCk7XG4gICAgICAgIGlucHV0QmdOb2RlLnBhcmVudCA9IGlucHV0Q29udGFpbmVyO1xuICAgICAgICBcbiAgICAgICAgdmFyIGlucHV0VGV4dCA9IGlucHV0QmdOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGlucHV0VGV4dC5zdHJpbmcgPSBcIueCueWHu+i+k+WFpeaIv+mXtOWPt1wiO1xuICAgICAgICBpbnB1dFRleHQuZm9udFNpemUgPSAxODtcbiAgICAgICAgaW5wdXRUZXh0Lmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIGlucHV0VGV4dC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVI7XG4gICAgICAgIFxuICAgICAgICAvLyDliqDlhaXmiL/pl7TmjInpkq5cbiAgICAgICAgdmFyIGpvaW5CdG4gPSB0aGlzLl9jcmVhdGVCdXR0b24oXCLinqQg5Yqg5YWlXCIsIGNjLmNvbG9yKDIzMCwgMTI2LCAzNCksIDEwMCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgcm9vbUNvZGUgPSBpbnB1dFRleHQuc3RyaW5nO1xuICAgICAgICAgICAgaWYgKHJvb21Db2RlICYmIHJvb21Db2RlICE9PSBcIueCueWHu+i+k+WFpeaIv+mXtOWPt1wiKSB7XG4gICAgICAgICAgICAgICAgZGlhbG9nLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9qb2luUm9vbShyb29tQ29kZSwgcm9vbUNvbmZpZywgcGxheWVyR29sZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlQ2VudGVyKFwi6K+36L6T5YWl5oi/6Ze05Y+3XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCA5MCwgNDApO1xuICAgICAgICBqb2luQnRuLnBhcmVudCA9IGlucHV0Q29udGFpbmVyO1xuICAgICAgICBcbiAgICAgICAgLy8g5bqV6YOo5o+Q56S6XG4gICAgICAgIHZhciB0aXBOb2RlID0gbmV3IGNjLk5vZGUoXCJUaXBcIik7XG4gICAgICAgIHRpcE5vZGUueSA9IC0xODU7XG4gICAgICAgIHZhciB0aXBMYWJlbCA9IHRpcE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgdGlwTGFiZWwuc3RyaW5nID0gXCLmj5DnpLrvvJrlv6vpgJ/ljLnphY3lsIboh6rliqjkuLrmgqjliIbphY3miL/pl7RcIjtcbiAgICAgICAgdGlwTGFiZWwuZm9udFNpemUgPSAxNjtcbiAgICAgICAgdGlwTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgdGlwTm9kZS5jb2xvciA9IGNjLmNvbG9yKDEyMCwgMTIwLCAxNDApO1xuICAgICAgICB0aXBOb2RlLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPluaIv+mXtOWIl+ihqFxuICAgICAgICB0aGlzLl9mZXRjaFJvb21MaXN0KGxpc3RDb250YWluZXIsIGxvYWRpbmdMYWJlbCk7XG4gICAgfSxcbiAgICBcbiAgICAvLyDliJvlu7rmjInpkq4gLSDmlLnov5vniYjmnKxcbiAgICBfY3JlYXRlQnV0dG9uOiBmdW5jdGlvbih0ZXh0LCBjb2xvciwgeCwgY2FsbGJhY2ssIHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgd2lkdGggPSB3aWR0aCB8fCAxNDA7XG4gICAgICAgIGhlaWdodCA9IGhlaWdodCB8fCA1MDtcbiAgICAgICAgXG4gICAgICAgIHZhciBidG4gPSBuZXcgY2MuTm9kZSh0ZXh0ICsgXCJCdG5cIik7XG4gICAgICAgIGJ0bi5zZXRDb250ZW50U2l6ZShjYy5zaXplKHdpZHRoLCBoZWlnaHQpKTtcbiAgICAgICAgYnRuLnggPSB4O1xuICAgICAgICBcbiAgICAgICAgLy8g5oyJ6ZKu6IOM5pmvXG4gICAgICAgIHZhciBiZyA9IGJ0bi5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICBiZy5maWxsQ29sb3IgPSBjb2xvcjtcbiAgICAgICAgYmcucm91bmRSZWN0KC13aWR0aC8yLCAtaGVpZ2h0LzIsIHdpZHRoLCBoZWlnaHQsIDgpO1xuICAgICAgICBiZy5maWxsKCk7XG4gICAgICAgIFxuICAgICAgICAvLyDmjInpkq7mloflrZdcbiAgICAgICAgdmFyIGxhYmVsID0gYnRuLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGxhYmVsLnN0cmluZyA9IHRleHQ7XG4gICAgICAgIGxhYmVsLmZvbnRTaXplID0gMjA7XG4gICAgICAgIGxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIGxhYmVsLnZlcnRpY2FsQWxpZ24gPSBjYy5MYWJlbC5WZXJ0aWNhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgYnRuLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgIFxuICAgICAgICAvLyDop6bmkbjmlYjmnpxcbiAgICAgICAgYnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX1NUQVJULCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBidG4uc2NhbGUgPSAwLjk1O1xuICAgICAgICB9KTtcbiAgICAgICAgYnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgYnRuLnNjYWxlID0gMTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9DQU5DRUwsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBidG4uc2NhbGUgPSAxO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBidG47XG4gICAgfSxcbiAgICBcbiAgICAvLyDojrflj5bmiL/pl7TliJfooaggLSDlj6rmmL7npLrnnJ/lrp7miL/pl7RcbiAgICBfZmV0Y2hSb29tTGlzdDogZnVuY3Rpb24oY29udGFpbmVyLCBsb2FkaW5nTGFiZWwpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWw7XG4gICAgICAgIHZhciBzb2NrZXQgPSBteWdsb2JhbCAmJiBteWdsb2JhbC5zb2NrZXQgPyBteWdsb2JhbC5zb2NrZXQgOiBudWxsO1xuICAgICAgICBcbiAgICAgICAgLy8g5qOA5p+lV2ViU29ja2V05piv5ZCm5bey6L+e5o6lXG4gICAgICAgIHZhciBpc0Nvbm5lY3RlZCA9IHNvY2tldCAmJiBzb2NrZXQuaXNDb25uZWN0ZWQgJiYgc29ja2V0LmlzQ29ubmVjdGVkKCk7XG4gICAgICAgIHZhciBpc1dlYlNvY2tldE9wZW4gPSBzb2NrZXQgJiYgc29ja2V0LmlzV2ViU29ja2V0T3BlbiAmJiBzb2NrZXQuaXNXZWJTb2NrZXRPcGVuKCk7XG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6cV2ViU29ja2V05pyq6L+e5o6l77yM5pi+56S656m65YiX6KGoXG4gICAgICAgIGlmICghc29ja2V0IHx8ICFpc0Nvbm5lY3RlZCB8fCAhaXNXZWJTb2NrZXRPcGVuKSB7XG4gICAgICAgICAgICBsb2FkaW5nTGFiZWwuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKS5zdHJpbmcgPSBcIuacqui/nuaOpeacjeWKoeWZqFwiO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAobG9hZGluZ0xhYmVsICYmIGxvYWRpbmdMYWJlbC5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdMYWJlbC5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIOaYvuekuuepuuWIl+ihqOaPkOekulxuICAgICAgICAgICAgICAgIHNlbGYuX3JlbmRlclJvb21MaXN0KGNvbnRhaW5lciwgW10pO1xuICAgICAgICAgICAgfSwgMC41KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6K6+572u6LaF5pe2XG4gICAgICAgIHZhciB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGxvYWRpbmdMYWJlbCAmJiBsb2FkaW5nTGFiZWwuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgIGxvYWRpbmdMYWJlbC5kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDmmL7npLrnqbrliJfooajmj5DnpLpcbiAgICAgICAgICAgIHNlbGYuX3JlbmRlclJvb21MaXN0KGNvbnRhaW5lciwgW10pO1xuICAgICAgICB9LCA1MDAwKTtcbiAgICAgICAgXG4gICAgICAgIHNvY2tldC5nZXRSb29tTGlzdChmdW5jdGlvbihyZXN1bHQsIHJvb21zKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGxvYWRpbmdMYWJlbCAmJiBsb2FkaW5nTGFiZWwuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgIGxvYWRpbmdMYWJlbC5kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IDAgJiYgcm9vbXMgJiYgcm9vbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3JlbmRlclJvb21MaXN0KGNvbnRhaW5lciwgcm9vbXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDmnI3liqHnq6/ov5Tlm57nqbrliJfooajmiJblpLHotKXvvIzmmL7npLrnqbrliJfooahcbiAgICAgICAgICAgICAgICBzZWxmLl9yZW5kZXJSb29tTGlzdChjb250YWluZXIsIFtdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBcbiAgICAvLyDmuLLmn5PmiL/pl7TliJfooaggLSDlj6rmmL7npLrnnJ/lrp7miL/pl7RcbiAgICBfcmVuZGVyUm9vbUxpc3Q6IGZ1bmN0aW9uKGNvbnRhaW5lciwgcm9vbXMpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5rKh5pyJ5oi/6Ze077yM5pi+56S656m65YiX6KGo5o+Q56S6XG4gICAgICAgIGlmICghcm9vbXMgfHwgcm9vbXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB2YXIgZW1wdHlOb2RlID0gbmV3IGNjLk5vZGUoXCJFbXB0eVRpcFwiKTtcbiAgICAgICAgICAgIGVtcHR5Tm9kZS55ID0gMDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGVtcHR5QmcgPSBlbXB0eU5vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgICAgIGVtcHR5QmcuZmlsbENvbG9yID0gY2MuY29sb3IoMzUsIDMwLCA1MCwgMjAwKTtcbiAgICAgICAgICAgIGVtcHR5Qmcucm91bmRSZWN0KC0xNTAsIC0yNSwgMzAwLCA1MCwgOCk7XG4gICAgICAgICAgICBlbXB0eUJnLmZpbGwoKTtcbiAgICAgICAgICAgIGVtcHR5Qmcuc3Ryb2tlQ29sb3IgPSBjYy5jb2xvcigxMDAsIDgwLCA1MCwgMTUwKTtcbiAgICAgICAgICAgIGVtcHR5QmcubGluZVdpZHRoID0gMTtcbiAgICAgICAgICAgIGVtcHR5Qmcucm91bmRSZWN0KC0xNTAsIC0yNSwgMzAwLCA1MCwgOCk7XG4gICAgICAgICAgICBlbXB0eUJnLnN0cm9rZSgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgZW1wdHlMYWJlbCA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIik7XG4gICAgICAgICAgICBlbXB0eUxhYmVsLmFuY2hvclggPSAwLjU7XG4gICAgICAgICAgICBlbXB0eUxhYmVsLmFuY2hvclkgPSAwLjU7XG4gICAgICAgICAgICB2YXIgZWwgPSBlbXB0eUxhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgICAgICBlbC5zdHJpbmcgPSBcIuaaguaXoOaIv+mXtO+8jOivt+WIm+W7uuaIluWIt+aWsFwiO1xuICAgICAgICAgICAgZWwuZm9udFNpemUgPSAxNjtcbiAgICAgICAgICAgIGVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgICAgICBlbXB0eUxhYmVsLmNvbG9yID0gY2MuY29sb3IoMTgwLCAxNjAsIDEyMCk7XG4gICAgICAgICAgICBlbXB0eUxhYmVsLnBhcmVudCA9IGVtcHR5Tm9kZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZW1wdHlOb2RlLnBhcmVudCA9IGNvbnRhaW5lcjtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByb29tcy5sZW5ndGggJiYgaSA8IDU7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJvb20gPSByb29tc1tpXTtcbiAgICAgICAgICAgIHZhciBpdGVtID0gbmV3IGNjLk5vZGUoXCJSb29tSXRlbV9cIiArIGkpO1xuICAgICAgICAgICAgaXRlbS5zZXRDb250ZW50U2l6ZShjYy5zaXplKDU0MCwgMzUpKTtcbiAgICAgICAgICAgIGl0ZW0ueSA9IDcwIC0gaSAqIDQwO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgYmcgPSBpdGVtLmFkZENvbXBvbmVudChjYy5TcHJpdGUpO1xuICAgICAgICAgICAgYmcuY29sb3IgPSBpICUgMiA9PT0gMCA/IGNjLmNvbG9yKDUwLCA1MCwgNzApIDogY2MuY29sb3IoNDUsIDQ1LCA2NSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOaIv+mXtOWPt1xuICAgICAgICAgICAgdmFyIGNvZGVMYWJlbCA9IG5ldyBjYy5Ob2RlKCk7XG4gICAgICAgICAgICBjb2RlTGFiZWwueCA9IC0yMDA7XG4gICAgICAgICAgICB2YXIgY29kZSA9IGNvZGVMYWJlbC5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICAgICAgY29kZS5zdHJpbmcgPSBcIuaIv+mXtDogXCIgKyAocm9vbS5yb29tX2NvZGUgfHwgcm9vbS5yb29tQ29kZSB8fCBcIuacquefpVwiKTtcbiAgICAgICAgICAgIGNvZGUuZm9udFNpemUgPSAxODtcbiAgICAgICAgICAgIGNvZGVMYWJlbC5jb2xvciA9IGNjLmNvbG9yKDIwMCwgMjAwLCAyMDApO1xuICAgICAgICAgICAgY29kZUxhYmVsLnBhcmVudCA9IGl0ZW07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOS6uuaVsFxuICAgICAgICAgICAgdmFyIGNvdW50TGFiZWwgPSBuZXcgY2MuTm9kZSgpO1xuICAgICAgICAgICAgY291bnRMYWJlbC54ID0gNTA7XG4gICAgICAgICAgICB2YXIgY291bnQgPSBjb3VudExhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgICAgICBjb3VudC5zdHJpbmcgPSBcIuS6uuaVsDogXCIgKyAocm9vbS5wbGF5ZXJfY291bnQgfHwgcm9vbS5wbGF5ZXJDb3VudCB8fCAwKSArIFwiLzNcIjtcbiAgICAgICAgICAgIGNvdW50LmZvbnRTaXplID0gMTg7XG4gICAgICAgICAgICBjb3VudExhYmVsLmNvbG9yID0gY2MuY29sb3IoMTUwLCAyMDAsIDE1MCk7XG4gICAgICAgICAgICBjb3VudExhYmVsLnBhcmVudCA9IGl0ZW07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWKoOWFpeaMiemSrlxuICAgICAgICAgICAgdmFyIGpvaW5CdG4gPSB0aGlzLl9jcmVhdGVCdXR0b24oXCLliqDlhaVcIiwgY2MuY29sb3IoNzYsIDE3NSwgODApLCAyMDAsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciByb29tQ29kZSA9IHJvb20ucm9vbV9jb2RlIHx8IHJvb20ucm9vbUNvZGU7XG4gICAgICAgICAgICAgICAgc2VsZi5fam9pblJvb20ocm9vbUNvZGUsIG15Z2xvYmFsLmN1cnJlbnRSb29tQ29uZmlnLCBteWdsb2JhbC5wbGF5ZXJEYXRhLmdvYmFsX2NvdW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgam9pbkJ0bi5zZXRDb250ZW50U2l6ZShjYy5zaXplKDcwLCAzMCkpO1xuICAgICAgICAgICAgam9pbkJ0bi54ID0gMjIwO1xuICAgICAgICAgICAgam9pbkJ0bi5wYXJlbnQgPSBpdGVtO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpdGVtLnBhcmVudCA9IGNvbnRhaW5lcjtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLy8g5b+r6YCf5Yy56YWNIC0g5pm66IO95Yy56YWN77yI5LyY5YWI5Yqg5YWl546w5pyJ562J5b6F5oi/6Ze077yJXG4gICAgX3F1aWNrTWF0Y2g6IGZ1bmN0aW9uKHJvb21Db25maWcsIHBsYXllckdvbGQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWw7XG4gICAgICAgIHZhciBzb2NrZXQgPSBteWdsb2JhbCAmJiBteWdsb2JhbC5zb2NrZXQgPyBteWdsb2JhbC5zb2NrZXQgOiBudWxsO1xuICAgICAgICBcbiAgICAgICAgLy8g5qOA5p+lV2ViU29ja2V054mp55CG6L+e5o6l5piv5ZCm5omT5byAXG4gICAgICAgIHZhciBpc1dlYlNvY2tldE9wZW4gPSBzb2NrZXQgJiYgc29ja2V0LmlzV2ViU29ja2V0T3BlbiAmJiBzb2NrZXQuaXNXZWJTb2NrZXRPcGVuKCk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9zaG93TWVzc2FnZUNlbnRlcihcIuato+WcqOaZuuiDveWMuemFjS4uLlwiKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenFdlYlNvY2tldOacquaJk+W8gO+8jOetieW+hei/nuaOpVxuICAgICAgICBpZiAoIXNvY2tldCB8fCAhaXNXZWJTb2NrZXRPcGVuKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWwneivleWIneWni+WMlldlYlNvY2tldOi/nuaOpVxuICAgICAgICAgICAgaWYgKHNvY2tldCAmJiBzb2NrZXQuaW5pdFNvY2tldCkge1xuICAgICAgICAgICAgICAgIHNvY2tldC5pbml0U29ja2V0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOetieW+hVdlYlNvY2tldOi/nuaOpeWQjui/m+ihjOaZuuiDveWMuemFjVxuICAgICAgICAgICAgdGhpcy5fd2FpdEZvckNvbm5lY3Rpb25BbmRTbWFydE1hdGNoKHJvb21Db25maWcsIHBsYXllckdvbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBXZWJTb2NrZXTlt7Lov57mjqXvvIzmiafooYzmmbrog73ljLnphY1cbiAgICAgICAgdGhpcy5fc21hcnRNYXRjaChyb29tQ29uZmlnLCBwbGF5ZXJHb2xkKTtcbiAgICB9LFxuICAgIFxuICAgIC8vIOaZuuiDveWMuemFje+8muS8mOWFiOWKoOWFpeetieW+heaIv+mXtO+8jOayoeacieWImeWIm+W7uuaWsOaIv+mXtFxuICAgIF9zbWFydE1hdGNoOiBmdW5jdGlvbihyb29tQ29uZmlnLCBwbGF5ZXJHb2xkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICB2YXIgc29ja2V0ID0gbXlnbG9iYWwgJiYgbXlnbG9iYWwuc29ja2V0ID8gbXlnbG9iYWwuc29ja2V0IDogbnVsbDtcbiAgICAgICAgXG4gICAgICAgIGlmICghc29ja2V0KSB7XG4gICAgICAgICAgICBzZWxmLl9oaWRlTWVzc2FnZUNlbnRlcigpO1xuICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2UoXCLmnI3liqHlmajov57mjqXlvILluLjvvIzor7fnqI3lkI7ph43or5VcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyDnrKzkuIDmraXvvJrojrflj5blj6/liqDlhaXnmoTmiL/pl7TliJfooahcbiAgICAgICAgaWYgKHNvY2tldC5nZXRSb29tTGlzdCkge1xuICAgICAgICAgICAgc29ja2V0LmdldFJvb21MaXN0KGZ1bmN0aW9uKHJlc3VsdCwgcm9vbXMpIHtcbiAgICAgICAgICAgICAgICBpZiAocm9vbXMgJiYgcm9vbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0ID09PSAwICYmIHJvb21zICYmIHJvb21zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5om+5Yiw5Lq65pWw5LiN6LazM+S6uueahOetieW+heaIv+mXtFxuICAgICAgICAgICAgICAgICAgICAvLyDms6jmhI/vvJrmnI3liqHlmajov5Tlm57nmoTlrZfmrrXlkI3mmK8gcm9vbV9jb2RlIOWSjCBwbGF5ZXJfY291bnTvvIjom4flvaLlkb3lkI3vvIlcbiAgICAgICAgICAgICAgICAgICAgdmFyIHdhaXRpbmdSb29tID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByb29tcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJvb20gPSByb29tc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWFvOWuueS4pOenjeWRveWQjeaWueW8j1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBsYXllckNvdW50ID0gcm9vbS5wbGF5ZXJfY291bnQgIT09IHVuZGVmaW5lZCA/IHJvb20ucGxheWVyX2NvdW50IDogcm9vbS5wbGF5ZXJDb3VudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByb29tQ29kZSA9IHJvb20ucm9vbV9jb2RlIHx8IHJvb20ucm9vbUNvZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBsYXllckNvdW50IDwgMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdhaXRpbmdSb29tID0gcm9vbTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdhaXRpbmdSb29tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmnInnrYnlvoXkuK3nmoTmiL/pl7TvvIzliqDlhaXor6XmiL/pl7RcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB3YWl0aW5nUm9vbUNvZGUgPSB3YWl0aW5nUm9vbS5yb29tX2NvZGUgfHwgd2FpdGluZ1Jvb20ucm9vbUNvZGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZUNlbnRlcihcIuaJvuWIsOetieW+heaIv+mXtO+8jOato+WcqOWKoOWFpS4uLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX2pvaW5Sb29tKHdhaXRpbmdSb29tQ29kZSwgcm9vbUNvbmZpZywgcGxheWVyR29sZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5rKh5pyJ5Y+v5Yqg5YWl55qE5oi/6Ze077yM5Yib5bu65paw5oi/6Ze0XG4gICAgICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2VDZW50ZXIoXCLliJvlu7rmlrDmiL/pl7TvvIznrYnlvoXlhbbku5bnjqnlrrYuLi5cIik7XG4gICAgICAgICAgICAgICAgc2VsZi5fY3JlYXRlUm9vbShyb29tQ29uZmlnLCBwbGF5ZXJHb2xkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5rKh5pyJ6I635Y+W5oi/6Ze05YiX6KGo55qE5pa55rOV77yM55u05o6l5Yib5bu65oi/6Ze0XG4gICAgICAgICAgICBzZWxmLl9jcmVhdGVSb29tKHJvb21Db25maWcsIHBsYXllckdvbGQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyDnrYnlvoXov57mjqXlkI7ov5vooYzmmbrog73ljLnphY1cbiAgICBfd2FpdEZvckNvbm5lY3Rpb25BbmRTbWFydE1hdGNoOiBmdW5jdGlvbihyb29tQ29uZmlnLCBwbGF5ZXJHb2xkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHNvY2tldCA9IHdpbmRvdy5teWdsb2JhbCAmJiB3aW5kb3cubXlnbG9iYWwuc29ja2V0ID8gd2luZG93Lm15Z2xvYmFsLnNvY2tldCA6IG51bGw7XG4gICAgICAgIHZhciBhdHRlbXB0cyA9IDA7XG4gICAgICAgIHZhciBtYXhBdHRlbXB0cyA9IDE1OyAgLy8g8J+Up+OAkOS8mOWMluOAkeWinuWKoOWwneivleasoeaVsO+8jOS9huWHj+Wwkeavj+asoemXtOmalFxuICAgICAgICBcbiAgICAgICAgdmFyIHRyeUNvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGF0dGVtcHRzKys7XG4gICAgICAgICAgICB2YXIgaXNXZWJTb2NrZXRPcGVuID0gc29ja2V0ICYmIHNvY2tldC5pc1dlYlNvY2tldE9wZW4gPyBzb2NrZXQuaXNXZWJTb2NrZXRPcGVuKCkgOiBmYWxzZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaXNXZWJTb2NrZXRPcGVuKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc21hcnRNYXRjaChyb29tQ29uZmlnLCBwbGF5ZXJHb2xkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYXR0ZW1wdHMgPCBtYXhBdHRlbXB0cykge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQodHJ5Q29ubmVjdCwgMjAwKTsgIC8vIPCflKfjgJDkvJjljJbjgJHlh4/lsJHpl7TpmpTliLAyMDBtc1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9oaWRlTWVzc2FnZUNlbnRlcigpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlKFwi6L+e5o6l5pyN5Yqh5Zmo5aSx6LSl77yM6K+35qOA5p+l572R57uc5ZCO6YeN6K+VXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgc2V0VGltZW91dCh0cnlDb25uZWN0LCAxMDApOyAgLy8g8J+Up+OAkOS8mOWMluOAkemmluasoeWwneivleWPqumcgDEwMG1zXG4gICAgfSxcbiAgICBcbiAgICAvLyDlj5HpgIHlv6vpgJ/ljLnphY3or7fmsYLvvIjpmJ/liJfljLnphY3mqKHlvI8gLSDlpIfnlKjvvIlcbiAgICBfc2VuZFF1aWNrTWF0Y2hSZXF1ZXN0OiBmdW5jdGlvbihyb29tQ29uZmlnLCBwbGF5ZXJHb2xkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICB2YXIgc29ja2V0ID0gbXlnbG9iYWwgJiYgbXlnbG9iYWwuc29ja2V0ID8gbXlnbG9iYWwuc29ja2V0IDogbnVsbDtcbiAgICAgICAgXG4gICAgICAgIGlmICghc29ja2V0IHx8ICFzb2NrZXQucmVxdWVzdF9lbnRlcl9yb29tKSB7XG4gICAgICAgICAgICBzZWxmLl9oaWRlTWVzc2FnZUNlbnRlcigpO1xuICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2UoXCLmnI3liqHlmajov57mjqXlvILluLjvvIzor7fnqI3lkI7ph43or5VcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyDmuIXpmaTkuYvliY3nmoTotoXml7borqHml7blmahcbiAgICAgICAgaWYgKHRoaXMuX2VudGVyUm9vbVRpbWVvdXQpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9lbnRlclJvb21UaW1lb3V0KTtcbiAgICAgICAgICAgIHRoaXMuX2VudGVyUm9vbVRpbWVvdXQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBzb2NrZXQucmVxdWVzdF9lbnRlcl9yb29tKHsgcm9vbV9sZXZlbDogcm9vbUNvbmZpZy5yb29tX3R5cGUgfSwgZnVuY3Rpb24ocmVzdWx0LCBkYXRhKSB7XG4gICAgICAgICAgICAvLyDmuIXpmaTotoXml7borqHml7blmahcbiAgICAgICAgICAgIGlmIChzZWxmLl9lbnRlclJvb21UaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHNlbGYuX2VudGVyUm9vbVRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIHNlbGYuX2VudGVyUm9vbVRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IDAgJiYgZGF0YSkge1xuICAgICAgICAgICAgICAgIGlmIChteWdsb2JhbCkge1xuICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5yb29tRGF0YSA9IGRhdGE7XG4gICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEuYm90dG9tID0gcm9vbUNvbmZpZy5iYXNlX3Njb3JlIHx8IDE7XG4gICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEucmF0ZSA9IHJvb21Db25maWcubXVsdGlwbGllciB8fCAxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLl9lbnRlckdhbWVTY2VuZShkYXRhKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5faGlkZU1lc3NhZ2VDZW50ZXIoKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZShcIuWMuemFjeWksei0pe+8jOivt+eojeWQjumHjeivlVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyDorr7nva7otoXml7ZcbiAgICAgICAgdGhpcy5fZW50ZXJSb29tVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLl9lbnRlclJvb21UaW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgIHNlbGYuX2hpZGVNZXNzYWdlQ2VudGVyKCk7XG4gICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZShcIuWMuemFjei2heaXtu+8jOivt+ajgOafpee9kee7nOi/nuaOpVwiKTtcbiAgICAgICAgfSwgMTUwMDApOyAgLy8g5aKe5Yqg6LaF5pe25pe26Ze05YiwMTXnp5JcbiAgICB9LFxuICAgIFxuICAgIC8vIOWIm+W7uuaIv+mXtCAtIOWPquS9v+eUqOecn+WunnNvY2tldOi/nuaOpVxuICAgIF9jcmVhdGVSb29tOiBmdW5jdGlvbihyb29tQ29uZmlnLCBwbGF5ZXJHb2xkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICB2YXIgc29ja2V0ID0gbXlnbG9iYWwgJiYgbXlnbG9iYWwuc29ja2V0ID8gbXlnbG9iYWwuc29ja2V0IDogbnVsbDtcbiAgICAgICAgXG4gICAgICAgIC8vIOajgOafpVdlYlNvY2tldOeJqeeQhui/nuaOpeaYr+WQpuaJk+W8gFxuICAgICAgICB2YXIgaXNXZWJTb2NrZXRPcGVuID0gc29ja2V0ICYmIHNvY2tldC5pc1dlYlNvY2tldE9wZW4gJiYgc29ja2V0LmlzV2ViU29ja2V0T3BlbigpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2VDZW50ZXIoXCLmraPlnKjov5vlhaXmuLjmiI8uLi5cIik7XG4gICAgICAgIFxuICAgICAgICAvLyDlpoLmnpxXZWJTb2NrZXTmnKrmiZPlvIDvvIzlsJ3or5Xov57mjqVcbiAgICAgICAgaWYgKCFzb2NrZXQgfHwgIWlzV2ViU29ja2V0T3Blbikge1xuICAgICAgICAgICAgaWYgKHNvY2tldCAmJiBzb2NrZXQuaW5pdFNvY2tldCkge1xuICAgICAgICAgICAgICAgIHNvY2tldC5pbml0U29ja2V0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl93YWl0Rm9yQ29ubmVjdGlvbkFuZENyZWF0ZVJvb20ocm9vbUNvbmZpZywgcGxheWVyR29sZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWPkemAgeWIm+W7uuaIv+mXtOivt+axglxuICAgICAgICB0aGlzLl9zZW5kQ3JlYXRlUm9vbVJlcXVlc3Qocm9vbUNvbmZpZywgcGxheWVyR29sZCk7XG4gICAgfSxcbiAgICBcbiAgICAvLyDlj5HpgIHliJvlu7rmiL/pl7Tor7fmsYJcbiAgICBfc2VuZENyZWF0ZVJvb21SZXF1ZXN0OiBmdW5jdGlvbihyb29tQ29uZmlnLCBwbGF5ZXJHb2xkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICB2YXIgc29ja2V0ID0gbXlnbG9iYWwgJiYgbXlnbG9iYWwuc29ja2V0ID8gbXlnbG9iYWwuc29ja2V0IDogbnVsbDtcbiAgICAgICAgXG4gICAgICAgIGlmICghc29ja2V0IHx8ICFzb2NrZXQuY3JlYXRlUm9vbSkge1xuICAgICAgICAgICAgc2VsZi5faGlkZU1lc3NhZ2VDZW50ZXIoKTtcbiAgICAgICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlKFwi5pyN5Yqh5Zmo6L+e5o6l5byC5bi477yM6K+356iN5ZCO6YeN6K+VXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+W5b2T5YmN546p5a6255qE5pyN5Yqh56uvSUTvvIjnlKjkuo7miL/kuLvliKTmlq3vvIlcbiAgICAgICAgdmFyIHBsYXllcklkID0gXCJcIlxuICAgICAgICBpZiAoc29ja2V0LmdldFBsYXllckluZm8pIHtcbiAgICAgICAgICAgIHZhciBwbGF5ZXJJbmZvID0gc29ja2V0LmdldFBsYXllckluZm8oKVxuICAgICAgICAgICAgcGxheWVySWQgPSBwbGF5ZXJJbmZvLmlkXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOazqOaEj++8mnNvY2tldC5jcmVhdGVSb29tIOeahOesrOS4gOS4quWPguaVsOaYryByb29tQ29uZmlnSWTvvIznrKzkuozkuKrlj4LmlbDmmK8gY2FsbGJhY2tcbiAgICAgICAgdmFyIHJvb21Db25maWdJZCA9IHJvb21Db25maWcgPyByb29tQ29uZmlnLmlkIDogbnVsbDtcbiAgICAgICAgc29ja2V0LmNyZWF0ZVJvb20ocm9vbUNvbmZpZ0lkLCBmdW5jdGlvbihyZXN1bHQsIGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IDAgJiYgZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkvJjlhYjkvb/nlKjmnI3liqHnq6/ov5Tlm57nmoTnjqnlrrbmlbDmja5cbiAgICAgICAgICAgICAgICB2YXIgc2VydmVyUGxheWVyID0gZGF0YS5wbGF5ZXIgfHwge307XG4gICAgICAgICAgICAgICAgdmFyIHBsYXllckRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgIGFjY291bnRpZDogc2VydmVyUGxheWVyLmlkIHx8IHBsYXllcklkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEIHx8IG15Z2xvYmFsLnBsYXllckRhdGEudW5pcXVlSUQsXG4gICAgICAgICAgICAgICAgICAgIG5pY2tfbmFtZTogc2VydmVyUGxheWVyLm5hbWUgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5uaWNrTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgYXZhdGFyVXJsOiBteWdsb2JhbC5wbGF5ZXJEYXRhLmF2YXRhclVybCB8fCBcImF2YXRhcl8xXCIsXG4gICAgICAgICAgICAgICAgICAgIGdvbGRfY291bnQ6IHNlcnZlclBsYXllci5nb2xkX2NvdW50IHx8IHBsYXllckdvbGQgfHwgMCwgIC8vIPCflKfjgJDkv67lpI3jgJHkvJjlhYjkvb/nlKjmnI3liqHnq6/ov5Tlm57nmoTph5HluIFcbiAgICAgICAgICAgICAgICAgICAgZ29sZGNvdW50OiBzZXJ2ZXJQbGF5ZXIuZ29sZF9jb3VudCB8fCBwbGF5ZXJHb2xkIHx8IDAsICAgLy8g5YW85a655pen5a6i5oi356uvXG4gICAgICAgICAgICAgICAgICAgIHNlYXRpbmRleDogKHNlcnZlclBsYXllci5zZWF0ICE9PSB1bmRlZmluZWQgPyBzZXJ2ZXJQbGF5ZXIuc2VhdCA6IDApICsgMSxcbiAgICAgICAgICAgICAgICAgICAgaXNyZWFkeTogc2VydmVyUGxheWVyLnJlYWR5IHx8IHRydWUgIC8vIOaIv+S4u+WIm+W7uuaIv+mXtOm7mOiupOW3suWHhuWkh1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g6L2s5o2i5pWw5o2u5qC85byPXG4gICAgICAgICAgICAgICAgdmFyIHJvb21EYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICByb29taWQ6IGRhdGEucm9vbV9jb2RlIHx8IGRhdGEucm9vbUNvZGUgfHwgXCJORVdfUk9PTVwiLFxuICAgICAgICAgICAgICAgICAgICByb29tX2NvZGU6IGRhdGEucm9vbV9jb2RlIHx8IGRhdGEucm9vbUNvZGUgfHwgXCJORVdfUk9PTVwiLFxuICAgICAgICAgICAgICAgICAgICBzZWF0aW5kZXg6IChzZXJ2ZXJQbGF5ZXIuc2VhdCAhPT0gdW5kZWZpbmVkID8gc2VydmVyUGxheWVyLnNlYXQgOiAwKSArIDEsXG4gICAgICAgICAgICAgICAgICAgIHBsYXllcmRhdGE6IFtwbGF5ZXJEYXRhXSxcbiAgICAgICAgICAgICAgICAgICAgaG91c2VtYW5hZ2VpZDogc2VydmVyUGxheWVyLmlkIHx8IHBsYXllcklkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEIHx8IG15Z2xvYmFsLnBsYXllckRhdGEudW5pcXVlSURcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG15Z2xvYmFsLnJvb21EYXRhID0gcm9vbURhdGE7XG4gICAgICAgICAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YS5ib3R0b20gPSByb29tQ29uZmlnLmJhc2Vfc2NvcmUgfHwgMTtcbiAgICAgICAgICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLnJhdGUgPSByb29tQ29uZmlnLm11bHRpcGxpZXIgfHwgMTtcbiAgICAgICAgICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLnJvb21pZCA9IHJvb21EYXRhLnJvb21fY29kZTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDkv53lrZjph43ov57kv6Hmga9cbiAgICAgICAgICAgICAgICBpZiAobXlnbG9iYWwuc29ja2V0ICYmIG15Z2xvYmFsLnNvY2tldC5zYXZlUmVjb25uZWN0SW5mbykge1xuICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQuc2F2ZVJlY29ubmVjdEluZm8oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc2VsZi5fZW50ZXJHYW1lU2NlbmUocm9vbURhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9oaWRlTWVzc2FnZUNlbnRlcigpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlKFwi5Yib5bu65oi/6Ze05aSx6LSl77yM6K+356iN5ZCO6YeN6K+VXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIFxuICAgIC8vIOetieW+hei/nuaOpeWQjuWIm+W7uuaIv+mXtFxuICAgIF93YWl0Rm9yQ29ubmVjdGlvbkFuZENyZWF0ZVJvb206IGZ1bmN0aW9uKHJvb21Db25maWcsIHBsYXllckdvbGQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgc29ja2V0ID0gd2luZG93Lm15Z2xvYmFsICYmIHdpbmRvdy5teWdsb2JhbC5zb2NrZXQgPyB3aW5kb3cubXlnbG9iYWwuc29ja2V0IDogbnVsbDtcbiAgICAgICAgdmFyIGF0dGVtcHRzID0gMDtcbiAgICAgICAgdmFyIG1heEF0dGVtcHRzID0gMTU7ICAvLyDwn5Sn44CQ5LyY5YyW44CR5aKe5Yqg5bCd6K+V5qyh5pWwXG4gICAgICAgIFxuICAgICAgICB2YXIgdHJ5Q29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYXR0ZW1wdHMrKztcbiAgICAgICAgICAgIHZhciBpc1dlYlNvY2tldE9wZW4gPSBzb2NrZXQgJiYgc29ja2V0LmlzV2ViU29ja2V0T3BlbiA/IHNvY2tldC5pc1dlYlNvY2tldE9wZW4oKSA6IGZhbHNlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChpc1dlYlNvY2tldE9wZW4pIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zZW5kQ3JlYXRlUm9vbVJlcXVlc3Qocm9vbUNvbmZpZywgcGxheWVyR29sZCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGF0dGVtcHRzIDwgbWF4QXR0ZW1wdHMpIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KHRyeUNvbm5lY3QsIDIwMCk7ICAvLyDwn5Sn44CQ5LyY5YyW44CR5YeP5bCR6Ze06ZqU5YiwMjAwbXNcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5faGlkZU1lc3NhZ2VDZW50ZXIoKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZShcIui/nuaOpeacjeWKoeWZqOWksei0pe+8jOivt+ajgOafpee9kee7nOWQjumHjeivlVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIHNldFRpbWVvdXQodHJ5Q29ubmVjdCwgMTAwKTsgIC8vIPCflKfjgJDkvJjljJbjgJHpppbmrKHlsJ3or5Xlj6rpnIAxMDBtc1xuICAgIH0sXG4gICAgXG4gICAgLy8g5Yqg5YWl5oi/6Ze0IC0g5Y+q5L2/55So55yf5a6ec29ja2V06L+e5o6lXG4gICAgX2pvaW5Sb29tOiBmdW5jdGlvbihyb29tQ29kZSwgcm9vbUNvbmZpZywgcGxheWVyR29sZCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbDtcbiAgICAgICAgdmFyIHNvY2tldCA9IG15Z2xvYmFsICYmIG15Z2xvYmFsLnNvY2tldCA/IG15Z2xvYmFsLnNvY2tldCA6IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvLyDmo4Dmn6VXZWJTb2NrZXTniannkIbov57mjqXmmK/lkKbmiZPlvIBcbiAgICAgICAgdmFyIGlzV2ViU29ja2V0T3BlbiA9IHNvY2tldCAmJiBzb2NrZXQuaXNXZWJTb2NrZXRPcGVuICYmIHNvY2tldC5pc1dlYlNvY2tldE9wZW4oKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuX3Nob3dNZXNzYWdlQ2VudGVyKFwi5q2j5Zyo5Yqg5YWl5oi/6Ze0IFwiICsgcm9vbUNvZGUgKyBcIi4uLlwiKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenFdlYlNvY2tldOacquaJk+W8gO+8jOWwneivlei/nuaOpVxuICAgICAgICBpZiAoIXNvY2tldCB8fCAhaXNXZWJTb2NrZXRPcGVuKSB7XG4gICAgICAgICAgICBpZiAoc29ja2V0ICYmIHNvY2tldC5pbml0U29ja2V0KSB7XG4gICAgICAgICAgICAgICAgc29ja2V0LmluaXRTb2NrZXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3dhaXRGb3JDb25uZWN0aW9uQW5kSm9pblJvb20ocm9vbUNvZGUsIHJvb21Db25maWcsIHBsYXllckdvbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlj5HpgIHliqDlhaXmiL/pl7Tor7fmsYJcbiAgICAgICAgdGhpcy5fc2VuZEpvaW5Sb29tUmVxdWVzdChyb29tQ29kZSwgcm9vbUNvbmZpZywgcGxheWVyR29sZCk7XG4gICAgfSxcbiAgICBcbiAgICAvLyDlj5HpgIHliqDlhaXmiL/pl7Tor7fmsYJcbiAgICBfc2VuZEpvaW5Sb29tUmVxdWVzdDogZnVuY3Rpb24ocm9vbUNvZGUsIHJvb21Db25maWcsIHBsYXllckdvbGQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWw7XG4gICAgICAgIHZhciBzb2NrZXQgPSBteWdsb2JhbCAmJiBteWdsb2JhbC5zb2NrZXQgPyBteWdsb2JhbC5zb2NrZXQgOiBudWxsO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFzb2NrZXQgfHwgIXNvY2tldC5qb2luUm9vbSkge1xuICAgICAgICAgICAgc2VsZi5faGlkZU1lc3NhZ2VDZW50ZXIoKTtcbiAgICAgICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlKFwi5pyN5Yqh5Zmo6L+e5o6l5byC5bi477yM6K+356iN5ZCO6YeN6K+VXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgc29ja2V0LmpvaW5Sb29tKHJvb21Db2RlLCBmdW5jdGlvbihyZXN1bHQsIGRhdGEpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHJlc3VsdCA9PT0gMCAmJiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgLy8g5qOA5p+lIHBsYXllcnMg5pWw57uE5piv5ZCm5a2Y5ZyoXG4gICAgICAgICAgICAgICAgdmFyIHBsYXllcnMgPSBkYXRhLnBsYXllcnMgfHwgW107XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g6I635Y+W5oi/5Li7SURcbiAgICAgICAgICAgICAgICB2YXIgY3JlYXRvcklkID0gZGF0YS5jcmVhdG9yX2lkIHx8IGRhdGEuY3JlYXRvcklkIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g6I635Y+W5b2T5YmN546p5a6255qEIHNvY2tldCBwbGF5ZXJJbmZvXG4gICAgICAgICAgICAgICAgaWYgKG15Z2xvYmFsLnNvY2tldCAmJiBteWdsb2JhbC5zb2NrZXQuZ2V0UGxheWVySW5mbykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGxheWVySW5mbyA9IG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOi9rOaNouaVsOaNruagvOW8j1xuICAgICAgICAgICAgICAgIHZhciByb29tRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcm9vbWlkOiBkYXRhLnJvb21fY29kZSB8fCBkYXRhLnJvb21Db2RlIHx8IHJvb21Db2RlLFxuICAgICAgICAgICAgICAgICAgICByb29tX2NvZGU6IGRhdGEucm9vbV9jb2RlIHx8IGRhdGEucm9vbUNvZGUgfHwgcm9vbUNvZGUsXG4gICAgICAgICAgICAgICAgICAgIHNlYXRpbmRleDogZGF0YS5wbGF5ZXIgPyBkYXRhLnBsYXllci5zZWF0ICsgMSA6IDEsICAvLyDluqfkvY3ntKLlvJXku44x5byA5aeLXG4gICAgICAgICAgICAgICAgICAgIHBsYXllcmRhdGE6IHBsYXllcnMubWFwKGZ1bmN0aW9uKHAsIGlkeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2NvdW50aWQ6IHAuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmlja19uYW1lOiBwLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhdGFyVXJsOiBwLmF2YXRhciB8fCBcImF2YXRhcl8xXCIsICAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55So5a6e6ZmF5aS05YOPVVJMXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29sZF9jb3VudDogcC5nb2xkX2NvdW50IHx8IDAsICAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55So5pyN5Yqh56uv5Y+R6YCB55qE6YeR5biB5pWw6YePXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29sZGNvdW50OiBwLmdvbGRfY291bnQgfHwgMCwgICAvLyDlhbzlrrnml6flrqLmiLfnq69cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWF0aW5kZXg6IChwLnNlYXQgIT09IHVuZGVmaW5lZCA/IHAuc2VhdCA6IGlkeCkgKyAxLCAgLy8g5bqn5L2N57Si5byV5LuOMeW8gOWni1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzcmVhZHk6IHAucmVhZHkgfHwgZmFsc2UgIC8vIOWHhuWkh+eKtuaAgVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgIGhvdXNlbWFuYWdlaWQ6IGNyZWF0b3JJZCxcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRvcl9pZDogY3JlYXRvcklkXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBteWdsb2JhbC5yb29tRGF0YSA9IHJvb21EYXRhO1xuICAgICAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEuYm90dG9tID0gcm9vbUNvbmZpZy5iYXNlX3Njb3JlIHx8IDE7XG4gICAgICAgICAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YS5yYXRlID0gcm9vbUNvbmZpZy5tdWx0aXBsaWVyIHx8IDE7XG4gICAgICAgICAgICAgICAgc2VsZi5fZW50ZXJHYW1lU2NlbmUocm9vbURhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9oaWRlTWVzc2FnZUNlbnRlcigpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlKFwi5Yqg5YWl5oi/6Ze05aSx6LSl77yM5oi/6Ze05Y+v6IO95LiN5a2Y5ZyoXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIFxuICAgIC8vIOetieW+hei/nuaOpeWQjuWKoOWFpeaIv+mXtFxuICAgIF93YWl0Rm9yQ29ubmVjdGlvbkFuZEpvaW5Sb29tOiBmdW5jdGlvbihyb29tQ29kZSwgcm9vbUNvbmZpZywgcGxheWVyR29sZCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBzb2NrZXQgPSB3aW5kb3cubXlnbG9iYWwgJiYgd2luZG93Lm15Z2xvYmFsLnNvY2tldCA/IHdpbmRvdy5teWdsb2JhbC5zb2NrZXQgOiBudWxsO1xuICAgICAgICB2YXIgYXR0ZW1wdHMgPSAwO1xuICAgICAgICB2YXIgbWF4QXR0ZW1wdHMgPSAxNTsgIC8vIPCflKfjgJDkvJjljJbjgJHlop7liqDlsJ3or5XmrKHmlbBcbiAgICAgICAgXG4gICAgICAgIHZhciB0cnlDb25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhdHRlbXB0cysrO1xuICAgICAgICAgICAgdmFyIGlzV2ViU29ja2V0T3BlbiA9IHNvY2tldCAmJiBzb2NrZXQuaXNXZWJTb2NrZXRPcGVuID8gc29ja2V0LmlzV2ViU29ja2V0T3BlbigpIDogZmFsc2U7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGlzV2ViU29ja2V0T3Blbikge1xuICAgICAgICAgICAgICAgIHNlbGYuX3NlbmRKb2luUm9vbVJlcXVlc3Qocm9vbUNvZGUsIHJvb21Db25maWcsIHBsYXllckdvbGQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhdHRlbXB0cyA8IG1heEF0dGVtcHRzKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCh0cnlDb25uZWN0LCAyMDApOyAgLy8g8J+Up+OAkOS8mOWMluOAkeWHj+WwkemXtOmalOWIsDIwMG1zXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuX2hpZGVNZXNzYWdlQ2VudGVyKCk7XG4gICAgICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2UoXCLov57mjqXmnI3liqHlmajlpLHotKXvvIzor7fmo4Dmn6XnvZHnu5zlkI7ph43or5VcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBzZXRUaW1lb3V0KHRyeUNvbm5lY3QsIDEwMCk7ICAvLyDwn5Sn44CQ5LyY5YyW44CR6aaW5qyh5bCd6K+V5Y+q6ZyAMTAwbXNcbiAgICB9LFxuICAgIFxuICAgIC8vIOetieW+hSBXZWJTb2NrZXQg6L+e5o6l5ZCO6L+b5YWl5oi/6Ze077yI5Y+q5L2/55So55yf5a6ec29ja2V06L+e5o6l77yJXG4gICAgX3dhaXRGb3JDb25uZWN0aW9uQW5kRW50ZXJSb29tOiBmdW5jdGlvbihyb29tQ29uZmlnLCBzb2NrZXQsIHBsYXllckdvbGQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWw7XG4gICAgICAgIHZhciBhdHRlbXB0cyA9IDA7XG4gICAgICAgIHZhciBtYXhBdHRlbXB0cyA9IDEwOyAgLy8g5pyA5aSa562J5b6FNeenklxuICAgICAgICBcbiAgICAgICAgdmFyIHRyeUVudGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhdHRlbXB0cysrO1xuICAgICAgICAgICAgdmFyIGlzV2ViU29ja2V0T3BlbiA9IHNvY2tldCAmJiBzb2NrZXQuaXNXZWJTb2NrZXRPcGVuID8gc29ja2V0LmlzV2ViU29ja2V0T3BlbigpIDogZmFsc2U7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGlzV2ViU29ja2V0T3Blbikge1xuICAgICAgICAgICAgICAgIHNlbGYuX3NlbmRRdWlja01hdGNoUmVxdWVzdChyb29tQ29uZmlnLCBwbGF5ZXJHb2xkKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYXR0ZW1wdHMgPCBtYXhBdHRlbXB0cykge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQodHJ5RW50ZXIsIDUwMCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOi/nuaOpei2heaXtu+8jOaPkOekuueUqOaIt+ajgOafpee9kee7nFxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJXZWJTb2NrZXQg6L+e5o6l6LaF5pe2XCIpO1xuICAgICAgICAgICAgICAgIHNlbGYuX2hpZGVNZXNzYWdlQ2VudGVyKCk7XG4gICAgICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2UoXCLov57mjqXmnI3liqHlmajotoXml7bvvIzor7fmo4Dmn6XnvZHnu5zorr7nva5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBzZXRUaW1lb3V0KHRyeUVudGVyLCA1MDApO1xuICAgIH0sXG4gICAgXG4gICAgX2Zvcm1hdEdvbGQ6IGZ1bmN0aW9uKGdvbGQpIHtcbiAgICAgICAgaWYgKGdvbGQgPj0gMTAwMDApIHtcbiAgICAgICAgICAgIHJldHVybiAoZ29sZCAvIDEwMDAwKS50b0ZpeGVkKDEpICsgXCLkuIdcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ29sZC50b1N0cmluZygpO1xuICAgIH0sXG4gICAgXG4gICAgX2VudGVyR2FtZVNjZW5lOiBmdW5jdGlvbihyb29tRGF0YSkge1xuICAgICAgICB2YXIgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOmakOiXj+WKoOi9veaPkOekulxuICAgICAgICB0aGlzLl9oaWRlTWVzc2FnZUNlbnRlcigpO1xuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS8mOWMluOAkeaYvuekuuW/q+mAn+i/m+WFpeWKqOeUu1xuICAgICAgICB0aGlzLl9zaG93UXVpY2tFbnRlckFuaW1hdGlvbigpO1xuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS8mOWMluOAkeS9v+eUqOmihOWKoOi9veeahOWcuuaZr++8jOWIh+aNouabtOW/q1xuICAgICAgICBpZiAodGhpcy5fZ2FtZVNjZW5lUHJlbG9hZGVkKSB7XG4gICAgICAgICAgICBjYy5kaXJlY3Rvci5ydW5TY2VuZUltbWVkaWF0ZShuZXcgY2MuU2NlbmUoKSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwiZ2FtZVNjZW5lXCIsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+agCBb6L+b5YWl5Zy65pmvXSDliqDovb3muLjmiI/lnLrmma/lpLHotKU6XCIsIGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGVsYXBzZWQgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJnYW1lU2NlbmVcIiwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+agCBb6L+b5YWl5Zy65pmvXSDliqDovb3muLjmiI/lnLrmma/lpLHotKU6XCIsIGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGVsYXBzZWQgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vIPCflKfjgJDmlrDlop7jgJHmmL7npLrlv6vpgJ/ov5vlhaXliqjnlLvvvIjkvb/nlKjliqDovb3lm77niYfvvIlcbiAgICBfc2hvd1F1aWNrRW50ZXJBbmltYXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5bnlLvluIPlsLrlr7hcbiAgICAgICAgdmFyIGNhbnZhcyA9IHRoaXMubm9kZS5nZXRDb21wb25lbnQoY2MuQ2FudmFzKSB8fCBjYy5maW5kKCdDYW52YXMnKS5nZXRDb21wb25lbnQoY2MuQ2FudmFzKTtcbiAgICAgICAgdmFyIHNjcmVlbkhlaWdodCA9IGNhbnZhcyA/IGNhbnZhcy5kZXNpZ25SZXNvbHV0aW9uLmhlaWdodCA6IDcyMDtcbiAgICAgICAgdmFyIHNjcmVlbldpZHRoID0gY2FudmFzID8gY2FudmFzLmRlc2lnblJlc29sdXRpb24ud2lkdGggOiAxMjgwO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65b+r6YCf6L+b5YWl6YGu572pXG4gICAgICAgIHZhciBtYXNrTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUXVpY2tFbnRlck1hc2tcIik7XG4gICAgICAgIG1hc2tOb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoc2NyZWVuV2lkdGggKiAyLCBzY3JlZW5IZWlnaHQgKiAyKSk7XG4gICAgICAgIG1hc2tOb2RlLmNvbG9yID0gY2MuY29sb3IoMCwgMCwgMCk7XG4gICAgICAgIG1hc2tOb2RlLm9wYWNpdHkgPSAwO1xuICAgICAgICBtYXNrTm9kZS56SW5kZXggPSA5OTk5O1xuICAgICAgICBcbiAgICAgICAgLy8g5re75YqgIEJsb2NrSW5wdXRFdmVudHMg6Ziy5q2i54K55Ye756m/6YCPXG4gICAgICAgIG1hc2tOb2RlLmFkZENvbXBvbmVudChjYy5CbG9ja0lucHV0RXZlbnRzKTtcbiAgICAgICAgbWFza05vZGUucGFyZW50ID0gdGhpcy5ub2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeS9v+eUqOWKoOi9veWbvueJh+abv+S7o+aWh+Wtl1xuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZCgnVUkvbG9hZGluZ19pbWFnZScsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5qOA5p+l6IqC54K55piv5ZCm5LuN54S25pyJ5pWIXG4gICAgICAgICAgICBpZiAoIW1hc2tOb2RlIHx8ICFtYXNrTm9kZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLliqDovb3lm77niYflm57osIPml7boioLngrnlt7LplIDmr4HvvIzot7Pov4dcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoZXJyIHx8ICFzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIuWKoOi9vSBsb2FkaW5nX2ltYWdlLnBuZyDlpLHotKXvvIzkvb/nlKjmloflrZfmj5DnpLpcIik7XG4gICAgICAgICAgICAgICAgLy8g6ZmN57qn77ya5L2/55So5paH5a2X5o+Q56S6XG4gICAgICAgICAgICAgICAgdmFyIGxvYWRpbmdOb2RlID0gbmV3IGNjLk5vZGUoXCJMb2FkaW5nVGV4dFwiKTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nTm9kZS55ID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgbG9hZGluZ0xhYmVsID0gbG9hZGluZ05vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgICAgICAgICBsb2FkaW5nTGFiZWwuc3RyaW5nID0gXCLmraPlnKjov5vlhaXmuLjmiI8uLi5cIjtcbiAgICAgICAgICAgICAgICBsb2FkaW5nTGFiZWwuZm9udFNpemUgPSAzMjtcbiAgICAgICAgICAgICAgICBsb2FkaW5nTGFiZWwubGluZUhlaWdodCA9IDQwO1xuICAgICAgICAgICAgICAgIGxvYWRpbmdMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICAgICAgICAgIGxvYWRpbmdOb2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgICAgICAgICAgbG9hZGluZ05vZGUucGFyZW50ID0gbWFza05vZGU7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDliJvlu7rliqDovb3lm77niYfoioLngrlcbiAgICAgICAgICAgIHZhciBsb2FkaW5nSW1hZ2VOb2RlID0gbmV3IGNjLk5vZGUoXCJMb2FkaW5nSW1hZ2VcIik7XG4gICAgICAgICAgICBsb2FkaW5nSW1hZ2VOb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoMTIwLCAxMjApKTtcbiAgICAgICAgICAgIGxvYWRpbmdJbWFnZU5vZGUuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgICAgIGxvYWRpbmdJbWFnZU5vZGUuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHNwcml0ZSA9IGxvYWRpbmdJbWFnZU5vZGUuYWRkQ29tcG9uZW50KGNjLlNwcml0ZSk7XG4gICAgICAgICAgICBzcHJpdGUuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZTtcbiAgICAgICAgICAgIHNwcml0ZS50eXBlID0gY2MuU3ByaXRlLlR5cGUuU0lNUExFO1xuICAgICAgICAgICAgc3ByaXRlLnNpemVNb2RlID0gY2MuU3ByaXRlLlNpemVNb2RlLkNVU1RPTTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbG9hZGluZ0ltYWdlTm9kZS5wYXJlbnQgPSBtYXNrTm9kZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5re75Yqg5peL6L2s5Yqo55S777yIMTgw5bqmL+enku+8iVxuICAgICAgICAgICAgc2VsZi5fcXVpY2tFbnRlckxvYWRpbmdOb2RlID0gbG9hZGluZ0ltYWdlTm9kZTtcbiAgICAgICAgICAgIHNlbGYuX3F1aWNrRW50ZXJBbmltYXRpbmcgPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOa3oeWFpeWKqOeUu1xuICAgICAgICBjYy50d2VlbihtYXNrTm9kZSlcbiAgICAgICAgICAgIC50bygwLjE1LCB7IG9wYWNpdHk6IDIwMCB9KVxuICAgICAgICAgICAgLnN0YXJ0KCk7XG4gICAgICAgIFxuICAgICAgICAvLyDkv53lrZjlvJXnlKjvvIzov5vlhaXlnLrmma/lkI7plIDmr4FcbiAgICAgICAgdGhpcy5fcXVpY2tFbnRlck1hc2sgPSBtYXNrTm9kZTtcbiAgICB9LFxuICAgIFxuICAgIF9zaG93TWVzc2FnZTogZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAvLyDlronlhajmo4Dmn6XvvJrnoa7kv53oioLngrnlrZjlnKhcbiAgICAgICAgaWYgKCF0aGlzLm5vZGUgfHwgIXRoaXMubm9kZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJfc2hvd01lc3NhZ2U6IOiKgueCueS4jeWtmOWcqOaIluW3sumUgOavgVwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIHRpcE5vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJyb29tX3RpcFwiKTtcbiAgICAgICAgaWYgKHRpcE5vZGUpIHRpcE5vZGUuZGVzdHJveSgpO1xuICAgICAgICBcbiAgICAgICAgdGlwTm9kZSA9IG5ldyBjYy5Ob2RlKFwicm9vbV90aXBcIik7XG4gICAgICAgIHRpcE5vZGUuYW5jaG9yWCA9IDAuNTsgIC8vIOawtOW5s+WxheS4rVxuICAgICAgICB0aXBOb2RlLmFuY2hvclkgPSAwLjU7ICAvLyDlnoLnm7TlsYXkuK1cbiAgICAgICAgdGlwTm9kZS54ID0gMDsgIC8vIOawtOW5s+WxheS4re+8iOebuOWvueS6jueItuiKgueCueS4reW/g++8iVxuICAgICAgICB0aXBOb2RlLnkgPSAzMTE7ICAvLyDmmL7npLrlnKjpobbpg6jkuK3pl7TnmoTmlrnmoYbljLrln5/lhoXvvIjkuI7mtojmga8v5biu5YqpL+iuvue9ruaMiemSruWQjOS4gOmrmOW6pu+8iVxuXG4gICAgICAgIHZhciBsYWJlbCA9IHRpcE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgbGFiZWwuc3RyaW5nID0gbWVzc2FnZTtcbiAgICAgICAgbGFiZWwuZm9udFNpemUgPSAyMjtcbiAgICAgICAgbGFiZWwubGluZUhlaWdodCA9IDI4O1xuICAgICAgICBsYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSOyAgLy8g5paH5a2X5bGF5LitXG4gICAgICAgIHRpcE5vZGUuY29sb3IgPSBjYy5jb2xvcigyNTUsIDI1NSwgMCk7ICAvLyDpu4ToibLmloflrZdcblxuICAgICAgICB0aXBOb2RlLnBhcmVudCA9IHRoaXMubm9kZTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHRpcE5vZGUgJiYgdGlwTm9kZS5pc1ZhbGlkKSB0aXBOb2RlLmRlc3Ryb3koKTtcbiAgICAgICAgfSwgMik7XG4gICAgfSxcbiAgICBcbiAgICAvLyDlnKjlsY/luZXkuK3lpK7mmL7npLrliqDovb3lm77niYfvvIjkvb/nlKjnu5/kuIDnmoQgbG9hZGluZ19pbWFnZS5wbmfvvIlcbiAgICBfc2hvd01lc3NhZ2VDZW50ZXI6IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgLy8g5a6J5YWo5qOA5p+l77ya56Gu5L+d6IqC54K55a2Y5ZyoXG4gICAgICAgIGlmICghdGhpcy5ub2RlIHx8ICF0aGlzLm5vZGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiX3Nob3dNZXNzYWdlQ2VudGVyOiDoioLngrnkuI3lrZjlnKjmiJblt7LplIDmr4FcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHRpcE5vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJjZW50ZXJfdGlwXCIpO1xuICAgICAgICBpZiAodGlwTm9kZSkgdGlwTm9kZS5kZXN0cm95KCk7XG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5bnlLvluIPlsLrlr7hcbiAgICAgICAgdmFyIGNhbnZhcyA9IHRoaXMubm9kZS5nZXRDb21wb25lbnQoY2MuQ2FudmFzKSB8fCBjYy5maW5kKCdDYW52YXMnKS5nZXRDb21wb25lbnQoY2MuQ2FudmFzKTtcbiAgICAgICAgdmFyIHNjcmVlbkhlaWdodCA9IGNhbnZhcyA/IGNhbnZhcy5kZXNpZ25SZXNvbHV0aW9uLmhlaWdodCA6IDcyMDtcbiAgICAgICAgdmFyIHNjcmVlbldpZHRoID0gY2FudmFzID8gY2FudmFzLmRlc2lnblJlc29sdXRpb24ud2lkdGggOiAxMjgwO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65o+Q56S65a655ZmoXG4gICAgICAgIHRpcE5vZGUgPSBuZXcgY2MuTm9kZShcImNlbnRlcl90aXBcIik7XG4gICAgICAgIHRpcE5vZGUuekluZGV4ID0gMjAwMDtcbiAgICAgICAgdGlwTm9kZS5wYXJlbnQgPSB0aGlzLm5vZGU7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDljYrpgI/mmI7og4zmma/pga7nvalcbiAgICAgICAgdmFyIG1hc2tOb2RlID0gbmV3IGNjLk5vZGUoXCJNYXNrXCIpO1xuICAgICAgICBtYXNrTm9kZS5zZXRDb250ZW50U2l6ZShjYy5zaXplKHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpKTtcbiAgICAgICAgdmFyIG1hc2tHcmFwaGljcyA9IG1hc2tOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIG1hc2tHcmFwaGljcy5maWxsQ29sb3IgPSBjYy5jb2xvcigwLCAwLCAwLCAxMDApOyAgLy8g5Y2K6YCP5piO6buR6Imy6IOM5pmvXG4gICAgICAgIG1hc2tHcmFwaGljcy5yZWN0KC1zY3JlZW5XaWR0aC8yLCAtc2NyZWVuSGVpZ2h0LzIsIHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpO1xuICAgICAgICBtYXNrR3JhcGhpY3MuZmlsbCgpO1xuICAgICAgICBtYXNrTm9kZS5wYXJlbnQgPSB0aXBOb2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yqg6L29IGxvYWRpbmdfaW1hZ2UucG5nIOWbvueJh1xuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZCgnVUkvbG9hZGluZ19pbWFnZScsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoZXJyIHx8ICFzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIuWKoOi9vSBsb2FkaW5nX2ltYWdlLnBuZyDlpLHotKXvvIzkvb/nlKjmloflrZfmj5DnpLpcIik7XG4gICAgICAgICAgICAgICAgLy8g6ZmN57qn77ya5L2/55So5paH5a2X5o+Q56S6XG4gICAgICAgICAgICAgICAgdmFyIGxhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIik7XG4gICAgICAgICAgICAgICAgdmFyIGxhYmVsID0gbGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgICAgICAgICAgbGFiZWwuc3RyaW5nID0gbWVzc2FnZTtcbiAgICAgICAgICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDI2O1xuICAgICAgICAgICAgICAgIGxhYmVsLmxpbmVIZWlnaHQgPSAzNjtcbiAgICAgICAgICAgICAgICBsYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICAgICAgICAgIGxhYmVsTm9kZS5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICAgICAgICAgIGxhYmVsTm9kZS5wYXJlbnQgPSB0aXBOb2RlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5Yib5bu65Yqg6L295Zu+54mH6IqC54K5XG4gICAgICAgICAgICB2YXIgbG9hZGluZ05vZGUgPSBuZXcgY2MuTm9kZShcIkxvYWRpbmdJbWFnZVwiKTtcbiAgICAgICAgICAgIGxvYWRpbmdOb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoMTIwLCAxMjApKTsgIC8vIOiuvue9ruWKoOi9veWbvueJh+Wkp+Wwj1xuICAgICAgICAgICAgbG9hZGluZ05vZGUuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgICAgIGxvYWRpbmdOb2RlLmFuY2hvclkgPSAwLjU7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBzcHJpdGUgPSBsb2FkaW5nTm9kZS5hZGRDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgICAgIHNwcml0ZS5zcHJpdGVGcmFtZSA9IHNwcml0ZUZyYW1lO1xuICAgICAgICAgICAgc3ByaXRlLnR5cGUgPSBjYy5TcHJpdGUuVHlwZS5TSU1QTEU7XG4gICAgICAgICAgICBzcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBsb2FkaW5nTm9kZS5wYXJlbnQgPSB0aXBOb2RlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmoIforrDmraPlnKjliqjnlLvkuK1cbiAgICAgICAgICAgIHNlbGYuX2xvYWRpbmdJbWFnZUFuaW1hdGluZyA9IHRydWU7XG4gICAgICAgICAgICBzZWxmLl9sb2FkaW5nSW1hZ2VOb2RlID0gbG9hZGluZ05vZGU7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8g5LiN6Ieq5Yqo5raI5aSx77yM6ZyA6KaB5omL5Yqo6LCD55SoIF9oaWRlTWVzc2FnZUNlbnRlciDpmpDol49cbiAgICAgICAgLy8g5L+d5a2Y5byV55So5Lul5L6/5ZCO57ut6ZSA5q+BXG4gICAgICAgIHRoaXMuX2NlbnRlclRpcE5vZGUgPSB0aXBOb2RlO1xuICAgIH0sXG4gICAgXG4gICAgLy8g6ZqQ6JeP5Lit5aSu5o+Q56S6XG4gICAgX2hpZGVNZXNzYWdlQ2VudGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fbG9hZGluZ0ltYWdlQW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2xvYWRpbmdJbWFnZU5vZGUgPSBudWxsO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMuX2NlbnRlclRpcE5vZGUgJiYgdGhpcy5fY2VudGVyVGlwTm9kZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICB0aGlzLl9jZW50ZXJUaXBOb2RlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMuX2NlbnRlclRpcE5vZGUgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgdGlwTm9kZSA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcImNlbnRlcl90aXBcIik7XG4gICAgICAgIGlmICh0aXBOb2RlICYmIHRpcE5vZGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgdGlwTm9kZS5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIF9yZW1vdmVOb3RpY2VCb2FyZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBub3RpY2VOYW1lcyA9IFtcIm5vdGljZVwiLCBcImdvbmdnYW9cIiwgXCLlhazlkYpcIiwgXCJub3RpY2VfYm9hcmRcIiwgXCJkaW5nYnV1aWJhbnRvdW1pbmdkaVwiLCBcInhpb25nbWFvM1wiLCBcInRpdGxlXCIsIFwiVGl0bGVcIiwgXCLmoIfnrb5cIl07XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm90aWNlTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5ub2RlLmdldENoaWxkQnlOYW1lKG5vdGljZU5hbWVzW2ldKTtcbiAgICAgICAgICAgIGlmIChub2RlKSBub2RlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2hpZGVOb2Rlc1dpdGhUZXh0KHRoaXMubm9kZSwgXCLmuLjmiI/lhazlkYpcIik7XG4gICAgICAgIHRoaXMuX2hpZGVOb2Rlc1dpdGhUZXh0KHRoaXMubm9kZSwgXCLlqLHkuZDkvJHpl7JcIik7XG4gICAgICAgIC8vIOmakOiXj+iDjOaZr+S4iueahOWMuuWfn+agh+etvuaWh+Wtl++8iOS4jemakOiXj+WKqOaAgeWIm+W7uueahCBBcmVhVGl0bGXvvIlcbiAgICAgICAgdGhpcy5faGlkZUJhY2tncm91bmRMYWJlbHMoKTtcbiAgICB9LFxuICAgIFxuICAgIF9oaWRlQmFja2dyb3VuZExhYmVsczogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOmakOiXj+iDjOaZr+S4iuWOn+acieeahOagh+etvuiKgueCuVxuICAgICAgICB2YXIgbGFiZWxzVG9IaWRlID0gW1wi56ue5oqA5Zy6XCIsIFwi5pmu6YCa5Zy6XCIsIFwi5Yid57qn5Zy6XCIsIFwi5Lit57qn5Zy6XCIsIFwi6auY57qn5Zy6XCIsIFwi6YCJ5oup5oi/6Ze0XCIsIFwi5oi/6Ze06YCJ5oupXCJdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhYmVsc1RvSGlkZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG5vZGVzID0gdGhpcy5fZmluZE5vZGVzQnlOYW1lKHRoaXMubm9kZSwgbGFiZWxzVG9IaWRlW2ldKTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbm9kZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAvLyDlj6rpmpDol4/pnZ4gQXJlYVRpdGxlIOeahOiKgueCuVxuICAgICAgICAgICAgICAgIGlmIChub2Rlc1tqXS5uYW1lICE9PSBcIkFyZWFUaXRsZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVzW2pdLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgX2ZpbmROb2Rlc0J5TmFtZTogZnVuY3Rpb24ocGFyZW50Tm9kZSwgbmFtZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgICAgIGlmICghcGFyZW50Tm9kZSB8fCAhcGFyZW50Tm9kZS5jaGlsZHJlbikgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFyZW50Tm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNoaWxkID0gcGFyZW50Tm9kZS5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgIGlmIChjaGlsZC5uYW1lID09PSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goY2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g6YCS5b2S5p+l5om+5a2Q6IqC54K5XG4gICAgICAgICAgICB2YXIgc3ViUmVzdWx0cyA9IHRoaXMuX2ZpbmROb2Rlc0J5TmFtZShjaGlsZCwgbmFtZSk7XG4gICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KHN1YlJlc3VsdHMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSxcbiAgICBcbiAgICBfYWRqdXN0R29sZEVsZW1lbnRzUG9zaXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGxheWVyTm9kZSA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcInBsYXllcl9ub2RlXCIpO1xuICAgICAgICBpZiAoIXBsYXllck5vZGUpIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIHZhciB5dWFuYmFvSWNvbiA9IHBsYXllck5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJ5dWFuYmFvSWNvblwiKTtcbiAgICAgICAgdmFyIGdvbGRGcmFtZSA9IHBsYXllck5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJnb2xkX2ZyYW1lXCIpO1xuICAgICAgICBcbiAgICAgICAgLy8g6LCD5pW06YeR6LGG5Zu+5qCH5L2N572uXG4gICAgICAgIGlmICh5dWFuYmFvSWNvbikge1xuICAgICAgICAgICAgeXVhbmJhb0ljb24ueSA9IDgwO1xuICAgICAgICAgICAgeXVhbmJhb0ljb24ueCA9IC01MDsgIC8vIOWQkeW3puWBj+enu1xuICAgICAgICB9XG4gICAgICAgIGlmIChnb2xkRnJhbWUpIHtcbiAgICAgICAgICAgIGdvbGRGcmFtZS55ID0gODA7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOiwg+aVtOmHkeW4geaWh+Wtl+S9jee9riAtIOaUvuWcqOmHkeixhuWbvuagh+WQjumdolxuICAgICAgICBpZiAodGhpcy5nb2JhbF9jb3VudCAmJiB0aGlzLmdvYmFsX2NvdW50Lm5vZGUpIHtcbiAgICAgICAgICAgIHZhciBsYWJlbE5vZGUgPSB0aGlzLmdvYmFsX2NvdW50Lm5vZGU7XG4gICAgICAgICAgICB2YXIgd2lkZ2V0ID0gbGFiZWxOb2RlLmdldENvbXBvbmVudChjYy5XaWRnZXQpO1xuICAgICAgICAgICAgaWYgKHdpZGdldCkgd2lkZ2V0LmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5paH5a2X5pS+5Zyo6YeR6LGG5Zu+5qCH5Y+z5L6nXG4gICAgICAgICAgICBsYWJlbE5vZGUuYW5jaG9yWCA9IDA7ICAvLyDlt6bplJrngrnvvIzku47lt6bkvqflvIDlp4tcbiAgICAgICAgICAgIGxhYmVsTm9kZS54ID0gMjA7ICAgICAgIC8vIOmHkeixhuWbvuagh+WQjumdojIwcHhcbiAgICAgICAgICAgIGxhYmVsTm9kZS55ID0gODA7ICAgICAgIC8vIOS4jumHkeixhuWbvuagh+WQjOS4gOmrmOW6plxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBfaGlkZU5vZGVzV2l0aFRleHQ6IGZ1bmN0aW9uKHBhcmVudE5vZGUsIHNlYXJjaFRleHQpIHtcbiAgICAgICAgaWYgKCFwYXJlbnROb2RlKSByZXR1cm47XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IHBhcmVudE5vZGUuY2hpbGRyZW47XG4gICAgICAgIGlmICghY2hpbGRyZW4pIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gY2hpbGQuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgICAgIGlmIChsYWJlbCAmJiBsYWJlbC5zdHJpbmcgJiYgbGFiZWwuc3RyaW5nLmluZGV4T2Yoc2VhcmNoVGV4dCkgPj0gMCkge1xuICAgICAgICAgICAgICAgIGNoaWxkLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5faGlkZU5vZGVzV2l0aFRleHQoY2hpbGQsIHNlYXJjaFRleHQpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDliJvlu7rliqDlhaXmiL/pl7TmjInpkq7vvIjkvb/nlKggYnRuX2VudGVyX3Jvb20ucG5n77yJXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgX2NyZWF0ZUVudGVyUm9vbUJ1dHRvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyDnp7vpmaTml6fnmoTmjInpkq5cbiAgICAgICAgdmFyIG9sZEJ0biA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcIkVudGVyUm9vbUJ1dHRvblwiKTtcbiAgICAgICAgaWYgKG9sZEJ0bikgb2xkQnRuLmRlc3Ryb3koKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPlueUu+W4g+WwuuWvuFxuICAgICAgICB2YXIgY2FudmFzID0gdGhpcy5ub2RlLmdldENvbXBvbmVudChjYy5DYW52YXMpIHx8IGNjLmZpbmQoJ0NhbnZhcycpLmdldENvbXBvbmVudChjYy5DYW52YXMpO1xuICAgICAgICB2YXIgc2NyZWVuSGVpZ2h0ID0gY2FudmFzID8gY2FudmFzLmRlc2lnblJlc29sdXRpb24uaGVpZ2h0IDogNzIwO1xuICAgICAgICB2YXIgc2NyZWVuV2lkdGggPSBjYW52YXMgPyBjYW52YXMuZGVzaWduUmVzb2x1dGlvbi53aWR0aCA6IDEyODA7XG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7rmjInpkq7oioLngrlcbiAgICAgICAgdmFyIGJ0bk5vZGUgPSBuZXcgY2MuTm9kZShcIkVudGVyUm9vbUJ1dHRvblwiKTtcbiAgICAgICAgYnRuTm9kZS5zZXRDb250ZW50U2l6ZShjYy5zaXplKDE4MCwgNjApKTtcbiAgICAgICAgYnRuTm9kZS5hbmNob3JYID0gMC41O1xuICAgICAgICBidG5Ob2RlLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIFxuICAgICAgICAvLyDmlL7lnKjlt6bkvqfkuK3pl7TkvY3nva5cbiAgICAgICAgYnRuTm9kZS54ID0gLXNjcmVlbldpZHRoIC8gMiArIDEyMDtcbiAgICAgICAgYnRuTm9kZS55ID0gMDtcbiAgICAgICAgYnRuTm9kZS56SW5kZXggPSAxMDAwO1xuICAgICAgICBidG5Ob2RlLnBhcmVudCA9IHRoaXMubm9kZTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWKoOi9veaMiemSruWbvueJh1xuICAgICAgICB2YXIgc3ByaXRlID0gYnRuTm9kZS5hZGRDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgc3ByaXRlLnNpemVNb2RlID0gY2MuU3ByaXRlLlNpemVNb2RlLkNVU1RPTTtcbiAgICAgICAgXG4gICAgICAgIGNjLnJlc291cmNlcy5sb2FkKCdVSS9idG5fZW50ZXJfcm9vbScsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi5Yqg6L29IGJ0bl9lbnRlcl9yb29tIOWksei0pe+8jOS9v+eUqOWkh+eUqOagt+W8j1wiKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9jcmVhdGVFbnRlclJvb21CdXR0b25GYWxsYmFjayhidG5Ob2RlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzcHJpdGUuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDmjInpkq7nu4Tku7ZcbiAgICAgICAgdmFyIGJ1dHRvbiA9IGJ0bk5vZGUuYWRkQ29tcG9uZW50KGNjLkJ1dHRvbik7XG4gICAgICAgIGJ1dHRvbi50cmFuc2l0aW9uID0gY2MuQnV0dG9uLlRyYW5zaXRpb24uU0NBTEU7XG4gICAgICAgIGJ1dHRvbi5kdXJhdGlvbiA9IDAuMTtcbiAgICAgICAgYnV0dG9uLnpvb21TY2FsZSA9IDEuMTtcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOeCueWHu+S6i+S7tlxuICAgICAgICBidG5Ob2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgc2VsZi5fc2hvd0VudGVyUm9vbVBvcHVwKCk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICBcbiAgICB9LFxuICAgIFxuICAgIC8vIOWkh+eUqOaMiemSruagt+W8j1xuICAgIF9jcmVhdGVFbnRlclJvb21CdXR0b25GYWxsYmFjazogZnVuY3Rpb24oYnRuTm9kZSkge1xuICAgICAgICB2YXIgc3ByaXRlID0gYnRuTm9kZS5nZXRDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgaWYgKCFzcHJpdGUpIHtcbiAgICAgICAgICAgIHNwcml0ZSA9IGJ0bk5vZGUuYWRkQ29tcG9uZW50KGNjLlNwcml0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgc3ByaXRlLnNpemVNb2RlID0gY2MuU3ByaXRlLlNpemVNb2RlLkNVU1RPTTtcbiAgICAgICAgXG4gICAgICAgIC8vIOe7mOWItuaMiemSruiDjOaZryAtIOapmeiJsua4kOWPmOmjjuagvFxuICAgICAgICB2YXIgZ3JhcGhpY3MgPSBidG5Ob2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIGdyYXBoaWNzLmZpbGxDb2xvciA9IGNjLmNvbG9yKDI1NSwgMTQwLCAwKTsgIC8vIOapmeiJslxuICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLTkwLCAtMzAsIDE4MCwgNjAsIDEyKTtcbiAgICAgICAgZ3JhcGhpY3MuZmlsbCgpO1xuICAgICAgICBncmFwaGljcy5zdHJva2VDb2xvciA9IGNjLmNvbG9yKDI1NSwgMjAwLCAxMDApOyAgLy8g6YeR6Imy6L655qGGXG4gICAgICAgIGdyYXBoaWNzLmxpbmVXaWR0aCA9IDM7XG4gICAgICAgIGdyYXBoaWNzLnJvdW5kUmVjdCgtOTAsIC0zMCwgMTgwLCA2MCwgMTIpO1xuICAgICAgICBncmFwaGljcy5zdHJva2UoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOWbvuagh+WSjOaWh+Wtl1xuICAgICAgICB2YXIgaWNvbk5vZGUgPSBuZXcgY2MuTm9kZShcIkljb25cIik7XG4gICAgICAgIHZhciBpY29uTGFiZWwgPSBpY29uTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBpY29uTGFiZWwuc3RyaW5nID0gXCLwn5qqXCI7XG4gICAgICAgIGljb25MYWJlbC5mb250U2l6ZSA9IDIyO1xuICAgICAgICBpY29uTm9kZS54ID0gLTQ1O1xuICAgICAgICBpY29uTm9kZS5wYXJlbnQgPSBidG5Ob2RlO1xuICAgICAgICBcbiAgICAgICAgdmFyIGxhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIik7XG4gICAgICAgIHZhciBsYWJlbCA9IGxhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBsYWJlbC5zdHJpbmcgPSBcIui+k+WFpeaIv+WPt1wiO1xuICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDIyO1xuICAgICAgICBsYWJlbC5saW5lSGVpZ2h0ID0gMzA7XG4gICAgICAgIGxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIGxhYmVsTm9kZS5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICBsYWJlbE5vZGUucGFyZW50ID0gYnRuTm9kZTtcbiAgICB9LFxuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOaYvuekuuWKoOWFpeaIv+mXtOW8ueeqlyAtIOmHjeaWsOiuvuiuoe+8jOabtOa4heaZsOe+juinglxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIF9zaG93RW50ZXJSb29tUG9wdXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgLy8g56e76Zmk5pen55qE5by556qXXG4gICAgICAgIHZhciBvbGRQb3B1cCA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcIkVudGVyUm9vbVBvcHVwXCIpO1xuICAgICAgICBpZiAob2xkUG9wdXApIG9sZFBvcHVwLmRlc3Ryb3koKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPlueUu+W4g+WwuuWvuFxuICAgICAgICB2YXIgY2FudmFzID0gdGhpcy5ub2RlLmdldENvbXBvbmVudChjYy5DYW52YXMpIHx8IGNjLmZpbmQoJ0NhbnZhcycpLmdldENvbXBvbmVudChjYy5DYW52YXMpO1xuICAgICAgICB2YXIgc2NyZWVuSGVpZ2h0ID0gY2FudmFzID8gY2FudmFzLmRlc2lnblJlc29sdXRpb24uaGVpZ2h0IDogNzIwO1xuICAgICAgICB2YXIgc2NyZWVuV2lkdGggPSBjYW52YXMgPyBjYW52YXMuZGVzaWduUmVzb2x1dGlvbi53aWR0aCA6IDEyODA7XG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7rlvLnnqpflrrnlmahcbiAgICAgICAgdmFyIHBvcHVwID0gbmV3IGNjLk5vZGUoXCJFbnRlclJvb21Qb3B1cFwiKTtcbiAgICAgICAgcG9wdXAuc2V0Q29udGVudFNpemUoY2Muc2l6ZShzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSk7XG4gICAgICAgIHBvcHVwLmFuY2hvclggPSAwLjU7XG4gICAgICAgIHBvcHVwLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIHBvcHVwLnggPSAwO1xuICAgICAgICBwb3B1cC55ID0gMDtcbiAgICAgICAgcG9wdXAuekluZGV4ID0gMjAwMDtcbiAgICAgICAgcG9wdXAucGFyZW50ID0gdGhpcy5ub2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g5re75YqgIEJsb2NrSW5wdXRFdmVudHMg57uE5Lu26Zi75q2i5bqV5bGC54K55Ye7XG4gICAgICAgIHBvcHVwLmFkZENvbXBvbmVudChjYy5CbG9ja0lucHV0RXZlbnRzKTtcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09IOWNiumAj+aYjuiDjOaZr+mBrue9qSA9PT09PVxuICAgICAgICB2YXIgYmdNYXNrID0gbmV3IGNjLk5vZGUoXCJCZ01hc2tcIik7XG4gICAgICAgIGJnTWFzay5zZXRDb250ZW50U2l6ZShjYy5zaXplKHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpKTtcbiAgICAgICAgdmFyIGJnR2Z4ID0gYmdNYXNrLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIGJnR2Z4LmZpbGxDb2xvciA9IGNjLmNvbG9yKDAsIDAsIDAsIDE4MCk7XG4gICAgICAgIGJnR2Z4LnJlY3QoLXNjcmVlbldpZHRoLzIsIC1zY3JlZW5IZWlnaHQvMiwgc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCk7XG4gICAgICAgIGJnR2Z4LmZpbGwoKTtcbiAgICAgICAgYmdNYXNrLnBhcmVudCA9IHBvcHVwO1xuICAgICAgICBcbiAgICAgICAgLy8g54K55Ye76YGu572p5YWz6ZetXG4gICAgICAgIGJnTWFzay5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcG9wdXAuZGVzdHJveSgpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09IOW8ueeql+mdouadvyAtIOabtOWkp+eahOWwuuWvuCA9PT09PVxuICAgICAgICB2YXIgcGFuZWxXaWR0aCA9IDUwMDtcbiAgICAgICAgdmFyIHBhbmVsSGVpZ2h0ID0gMzgwO1xuICAgICAgICB2YXIgcGFuZWwgPSBuZXcgY2MuTm9kZShcIlBhbmVsXCIpO1xuICAgICAgICBwYW5lbC5zZXRDb250ZW50U2l6ZShjYy5zaXplKHBhbmVsV2lkdGgsIHBhbmVsSGVpZ2h0KSk7XG4gICAgICAgIHBhbmVsLnBhcmVudCA9IHBvcHVwO1xuICAgICAgICBcbiAgICAgICAgLy8g5aSW5bGC6Zi05b2xXG4gICAgICAgIHZhciBzaGFkb3cgPSBuZXcgY2MuTm9kZShcIlNoYWRvd1wiKTtcbiAgICAgICAgdmFyIHNoYWRvd0dmeCA9IHNoYWRvdy5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICBzaGFkb3dHZnguZmlsbENvbG9yID0gY2MuY29sb3IoMCwgMCwgMCwgNjApO1xuICAgICAgICBzaGFkb3dHZngucm91bmRSZWN0KC1wYW5lbFdpZHRoLzIgKyA4LCAtcGFuZWxIZWlnaHQvMiAtIDgsIHBhbmVsV2lkdGgsIHBhbmVsSGVpZ2h0LCAxNik7XG4gICAgICAgIHNoYWRvd0dmeC5maWxsKCk7XG4gICAgICAgIHNoYWRvdy5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgXG4gICAgICAgIC8vIOS4u+iDjOaZryAtIOa3seiJsuS8mOmbhemjjuagvFxuICAgICAgICB2YXIgbWFpbkJnID0gbmV3IGNjLk5vZGUoXCJNYWluQmdcIik7XG4gICAgICAgIG1haW5CZy5zZXRDb250ZW50U2l6ZShjYy5zaXplKHBhbmVsV2lkdGgsIHBhbmVsSGVpZ2h0KSk7XG4gICAgICAgIHZhciBtYWluR2Z4ID0gbWFpbkJnLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIG1haW5HZnguZmlsbENvbG9yID0gY2MuY29sb3IoMzAsIDI4LCA0NSwgMjU1KTtcbiAgICAgICAgbWFpbkdmeC5yb3VuZFJlY3QoLXBhbmVsV2lkdGgvMiwgLXBhbmVsSGVpZ2h0LzIsIHBhbmVsV2lkdGgsIHBhbmVsSGVpZ2h0LCAxNik7XG4gICAgICAgIG1haW5HZnguZmlsbCgpO1xuICAgICAgICBtYWluR2Z4LnN0cm9rZUNvbG9yID0gY2MuY29sb3IoMTAwLCA4NSwgNjApO1xuICAgICAgICBtYWluR2Z4LmxpbmVXaWR0aCA9IDM7XG4gICAgICAgIG1haW5HZngucm91bmRSZWN0KC1wYW5lbFdpZHRoLzIsIC1wYW5lbEhlaWdodC8yLCBwYW5lbFdpZHRoLCBwYW5lbEhlaWdodCwgMTYpO1xuICAgICAgICBtYWluR2Z4LnN0cm9rZSgpO1xuICAgICAgICBtYWluQmcucGFyZW50ID0gcGFuZWw7XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PSDpobbpg6joo4XppbDmnaEgPT09PT1cbiAgICAgICAgdmFyIHRvcEJhciA9IG5ldyBjYy5Ob2RlKFwiVG9wQmFyXCIpO1xuICAgICAgICB0b3BCYXIuc2V0Q29udGVudFNpemUoY2Muc2l6ZShwYW5lbFdpZHRoLCA4KSk7XG4gICAgICAgIHRvcEJhci55ID0gcGFuZWxIZWlnaHQvMiAtIDQ7XG4gICAgICAgIHZhciB0b3BHZnggPSB0b3BCYXIuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgdG9wR2Z4LmZpbGxDb2xvciA9IGNjLmNvbG9yKDc2LCAxNzUsIDgwKTsgIC8vIOe7v+iJsuS4u+mimOiJslxuICAgICAgICB0b3BHZngucm91bmRSZWN0KC1wYW5lbFdpZHRoLzIsIC00LCBwYW5lbFdpZHRoLCA4LCBbMTYsIDE2LCAwLCAwXSk7XG4gICAgICAgIHRvcEdmeC5maWxsKCk7XG4gICAgICAgIHRvcEJhci5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09IOagh+mimOWMuuWfnyA9PT09PVxuICAgICAgICB2YXIgdGl0bGVCZyA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVCZ1wiKTtcbiAgICAgICAgdGl0bGVCZy5zZXRDb250ZW50U2l6ZShjYy5zaXplKHBhbmVsV2lkdGggLSA0MCwgNjApKTtcbiAgICAgICAgdGl0bGVCZy55ID0gcGFuZWxIZWlnaHQvMiAtIDUwO1xuICAgICAgICB2YXIgdGl0bGVCZ0dmeCA9IHRpdGxlQmcuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgdGl0bGVCZ0dmeC5maWxsQ29sb3IgPSBjYy5jb2xvcig0NSwgNDIsIDY1LCAyNTApO1xuICAgICAgICB0aXRsZUJnR2Z4LnJvdW5kUmVjdCgtKHBhbmVsV2lkdGggLSA0MCkvMiwgLTMwLCBwYW5lbFdpZHRoIC0gNDAsIDYwLCAxMCk7XG4gICAgICAgIHRpdGxlQmdHZnguZmlsbCgpO1xuICAgICAgICB0aXRsZUJnLnBhcmVudCA9IHBhbmVsO1xuICAgICAgICBcbiAgICAgICAgLy8g5Zu+5qCHXG4gICAgICAgIHZhciBpY29uTm9kZSA9IG5ldyBjYy5Ob2RlKFwiSWNvblwiKTtcbiAgICAgICAgdmFyIGljb25MYWJlbCA9IGljb25Ob2RlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGljb25MYWJlbC5zdHJpbmcgPSBcIvCflJFcIjtcbiAgICAgICAgaWNvbkxhYmVsLmZvbnRTaXplID0gMzI7XG4gICAgICAgIGljb25Ob2RlLnggPSAtMTAwO1xuICAgICAgICBpY29uTm9kZS55ID0gcGFuZWxIZWlnaHQvMiAtIDUwO1xuICAgICAgICBpY29uTm9kZS5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgXG4gICAgICAgIC8vIOagh+mimOaWh+Wtl1xuICAgICAgICB2YXIgdGl0bGVOb2RlID0gbmV3IGNjLk5vZGUoXCJUaXRsZVwiKTtcbiAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgdGl0bGVMYWJlbC5zdHJpbmcgPSBcIuWKoOWFpeaIv+mXtFwiO1xuICAgICAgICB0aXRsZUxhYmVsLmZvbnRTaXplID0gMjg7XG4gICAgICAgIHRpdGxlTGFiZWwubGluZUhlaWdodCA9IDQwO1xuICAgICAgICB0aXRsZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIHRpdGxlTm9kZS5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICB0aXRsZU5vZGUueSA9IHBhbmVsSGVpZ2h0LzIgLSA1MDtcbiAgICAgICAgdGl0bGVOb2RlLnBhcmVudCA9IHBhbmVsO1xuICAgICAgICBcbiAgICAgICAgLy8g5Ymv5qCH6aKY6K+05piOXG4gICAgICAgIHZhciBzdWJ0aXRsZU5vZGUgPSBuZXcgY2MuTm9kZShcIlN1YnRpdGxlXCIpO1xuICAgICAgICB2YXIgc3VidGl0bGVMYWJlbCA9IHN1YnRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBzdWJ0aXRsZUxhYmVsLnN0cmluZyA9IFwi6L6T5YWl5aW95Y+L5YiG5Lqr55qE5oi/6Ze05Y+35Y2z5Y+v5Yqg5YWl5ri45oiPXCI7XG4gICAgICAgIHN1YnRpdGxlTGFiZWwuZm9udFNpemUgPSAxNDtcbiAgICAgICAgc3VidGl0bGVMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICBzdWJ0aXRsZU5vZGUuY29sb3IgPSBjYy5jb2xvcigxODAsIDE3MCwgMTUwKTtcbiAgICAgICAgc3VidGl0bGVOb2RlLnkgPSBwYW5lbEhlaWdodC8yIC0gOTU7XG4gICAgICAgIHN1YnRpdGxlTm9kZS5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09IOaIv+mXtOWPt+i+k+WFpeWMuuWfnyA9PT09PVxuICAgICAgICB2YXIgaW5wdXRBcmVhWSA9IDIwO1xuICAgICAgICBcbiAgICAgICAgLy8g6L6T5YWl5qGG5qCH562+XG4gICAgICAgIHZhciBpbnB1dExhYmVsID0gbmV3IGNjLk5vZGUoXCJJbnB1dExhYmVsXCIpO1xuICAgICAgICB2YXIgaW5wdXRMYWJlbENvbXAgPSBpbnB1dExhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGlucHV0TGFiZWxDb21wLnN0cmluZyA9IFwi5oi/6Ze05Y+3XCI7XG4gICAgICAgIGlucHV0TGFiZWxDb21wLmZvbnRTaXplID0gMTY7XG4gICAgICAgIGlucHV0TGFiZWwuY29sb3IgPSBjYy5jb2xvcigyMDAsIDE5MCwgMTYwKTtcbiAgICAgICAgaW5wdXRMYWJlbC54ID0gLXBhbmVsV2lkdGgvMiArIDcwO1xuICAgICAgICBpbnB1dExhYmVsLnkgPSBpbnB1dEFyZWFZICsgNDU7XG4gICAgICAgIGlucHV0TGFiZWwucGFyZW50ID0gcGFuZWw7XG4gICAgICAgIFxuICAgICAgICAvLyDovpPlhaXmoYbog4zmma9cbiAgICAgICAgdmFyIGlucHV0QmcgPSBuZXcgY2MuTm9kZShcIklucHV0QmdcIik7XG4gICAgICAgIGlucHV0Qmcuc2V0Q29udGVudFNpemUoY2Muc2l6ZSgzNjAsIDU1KSk7XG4gICAgICAgIGlucHV0QmcueSA9IGlucHV0QXJlYVk7XG4gICAgICAgIHZhciBpbnB1dEdmeCA9IGlucHV0QmcuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgaW5wdXRHZnguZmlsbENvbG9yID0gY2MuY29sb3IoNTAsIDQ1LCA3MCwgMjU1KTtcbiAgICAgICAgaW5wdXRHZngucm91bmRSZWN0KC0xODAsIC0yNy41LCAzNjAsIDU1LCAxMCk7XG4gICAgICAgIGlucHV0R2Z4LmZpbGwoKTtcbiAgICAgICAgaW5wdXRHZnguc3Ryb2tlQ29sb3IgPSBjYy5jb2xvcig3NiwgMTc1LCA4MCk7XG4gICAgICAgIGlucHV0R2Z4LmxpbmVXaWR0aCA9IDI7XG4gICAgICAgIGlucHV0R2Z4LnJvdW5kUmVjdCgtMTgwLCAtMjcuNSwgMzYwLCA1NSwgMTApO1xuICAgICAgICBpbnB1dEdmeC5zdHJva2UoKTtcbiAgICAgICAgaW5wdXRCZy5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgXG4gICAgICAgIC8vIOi+k+WFpeahhlxuICAgICAgICB2YXIgaW5wdXROb2RlID0gbmV3IGNjLk5vZGUoXCJSb29tSWRJbnB1dFwiKTtcbiAgICAgICAgaW5wdXROb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoMzQwLCA1MCkpO1xuICAgICAgICB2YXIgZWRpdEJveCA9IGlucHV0Tm9kZS5hZGRDb21wb25lbnQoY2MuRWRpdEJveCk7XG4gICAgICAgIGVkaXRCb3gucGxhY2Vob2xkZXIgPSBcIuivt+i+k+WFpTbkvY3mlbDlrZfmiL/pl7Tlj7dcIjtcbiAgICAgICAgZWRpdEJveC5mb250U2l6ZSA9IDI0O1xuICAgICAgICBlZGl0Qm94LnBsYWNlaG9sZGVyRm9udFNpemUgPSAxODtcbiAgICAgICAgZWRpdEJveC5mb250Q29sb3IgPSBjYy5jb2xvcigyNTUsIDI1NSwgMjU1KTtcbiAgICAgICAgZWRpdEJveC5wbGFjZWhvbGRlckZvbnRDb2xvciA9IGNjLmNvbG9yKDEyMCwgMTE1LCAxMDApO1xuICAgICAgICBlZGl0Qm94LmlucHV0RmxhZyA9IGNjLkVkaXRCb3guSW5wdXRGbGFnLlNFTlNJVElWRTtcbiAgICAgICAgZWRpdEJveC5pbnB1dE1vZGUgPSBjYy5FZGl0Qm94LklucHV0TW9kZS5OVU1FUklDO1xuICAgICAgICBlZGl0Qm94Lm1heExlbmd0aCA9IDEwO1xuICAgICAgICBlZGl0Qm94LmJhY2tncm91bmRDb2xvciA9IGNjLmNvbG9yKDAsIDAsIDAsIDApO1xuICAgICAgICBpbnB1dE5vZGUucGFyZW50ID0gaW5wdXRCZztcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09IOaPkOekuuS/oeaBryA9PT09PVxuICAgICAgICB2YXIgdGlwQmcgPSBuZXcgY2MuTm9kZShcIlRpcEJnXCIpO1xuICAgICAgICB0aXBCZy5zZXRDb250ZW50U2l6ZShjYy5zaXplKDM2MCwgMzUpKTtcbiAgICAgICAgdGlwQmcueSA9IGlucHV0QXJlYVkgLSA1NTtcbiAgICAgICAgdmFyIHRpcEdmeCA9IHRpcEJnLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIHRpcEdmeC5maWxsQ29sb3IgPSBjYy5jb2xvcig0MCwgMzUsIDU1LCAyMDApO1xuICAgICAgICB0aXBHZngucm91bmRSZWN0KC0xODAsIC0xNy41LCAzNjAsIDM1LCA4KTtcbiAgICAgICAgdGlwR2Z4LmZpbGwoKTtcbiAgICAgICAgdGlwQmcucGFyZW50ID0gcGFuZWw7XG4gICAgICAgIFxuICAgICAgICB2YXIgdGlwSWNvbiA9IG5ldyBjYy5Ob2RlKFwiVGlwSWNvblwiKTtcbiAgICAgICAgdmFyIHRpcEljb25MYWJlbCA9IHRpcEljb24uYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgdGlwSWNvbkxhYmVsLnN0cmluZyA9IFwi8J+SoVwiO1xuICAgICAgICB0aXBJY29uTGFiZWwuZm9udFNpemUgPSAxNjtcbiAgICAgICAgdGlwSWNvbi54ID0gLTE1MDtcbiAgICAgICAgdGlwSWNvbi55ID0gaW5wdXRBcmVhWSAtIDU1O1xuICAgICAgICB0aXBJY29uLnBhcmVudCA9IHBhbmVsO1xuICAgICAgICBcbiAgICAgICAgdmFyIHRpcE5vZGUgPSBuZXcgY2MuTm9kZShcIlRpcFwiKTtcbiAgICAgICAgdmFyIHRpcExhYmVsID0gdGlwTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICB0aXBMYWJlbC5zdHJpbmcgPSBcIuaIv+mXtOWPt+eUseWlveWPi+WIm+W7uuaIv+mXtOWQjuiOt+WPlu+8jOS4ujbkvY3mlbDlrZdcIjtcbiAgICAgICAgdGlwTGFiZWwuZm9udFNpemUgPSAxMztcbiAgICAgICAgdGlwTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgdGlwTm9kZS5jb2xvciA9IGNjLmNvbG9yKDE1MCwgMTQ1LCAxMzApO1xuICAgICAgICB0aXBOb2RlLnkgPSBpbnB1dEFyZWFZIC0gNTU7XG4gICAgICAgIHRpcE5vZGUucGFyZW50ID0gcGFuZWw7XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PSDmjInpkq7ljLrln58gPT09PT1cbiAgICAgICAgdmFyIGJ0blkgPSAtcGFuZWxIZWlnaHQvMiArIDU1O1xuICAgICAgICBcbiAgICAgICAgLy8g5Y+W5raI5oyJ6ZKuXG4gICAgICAgIHZhciBjYW5jZWxCdG4gPSBuZXcgY2MuTm9kZShcIkNhbmNlbEJ0blwiKTtcbiAgICAgICAgY2FuY2VsQnRuLnNldENvbnRlbnRTaXplKGNjLnNpemUoMTQwLCA0OCkpO1xuICAgICAgICBjYW5jZWxCdG4ueCA9IC05MDtcbiAgICAgICAgY2FuY2VsQnRuLnkgPSBidG5ZO1xuICAgICAgICB2YXIgY2FuY2VsR2Z4ID0gY2FuY2VsQnRuLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIGNhbmNlbEdmeC5maWxsQ29sb3IgPSBjYy5jb2xvcig3MCwgNjUsIDg1KTtcbiAgICAgICAgY2FuY2VsR2Z4LnJvdW5kUmVjdCgtNzAsIC0yNCwgMTQwLCA0OCwgMTApO1xuICAgICAgICBjYW5jZWxHZnguZmlsbCgpO1xuICAgICAgICBjYW5jZWxHZnguc3Ryb2tlQ29sb3IgPSBjYy5jb2xvcigxMDAsIDk1LCAxMTUpO1xuICAgICAgICBjYW5jZWxHZngubGluZVdpZHRoID0gMjtcbiAgICAgICAgY2FuY2VsR2Z4LnJvdW5kUmVjdCgtNzAsIC0yNCwgMTQwLCA0OCwgMTApO1xuICAgICAgICBjYW5jZWxHZnguc3Ryb2tlKCk7XG4gICAgICAgIGNhbmNlbEJ0bi5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgXG4gICAgICAgIHZhciBjYW5jZWxMYWJlbCA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIik7XG4gICAgICAgIHZhciBjYW5jZWxMYWJlbENvbXAgPSBjYW5jZWxMYWJlbC5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBjYW5jZWxMYWJlbENvbXAuc3RyaW5nID0gXCLlj5bmtohcIjtcbiAgICAgICAgY2FuY2VsTGFiZWxDb21wLmZvbnRTaXplID0gMjA7XG4gICAgICAgIGNhbmNlbExhYmVsQ29tcC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICBjYW5jZWxMYWJlbC5jb2xvciA9IGNjLmNvbG9yKDIwMCwgMTk1LCAxODApO1xuICAgICAgICBjYW5jZWxMYWJlbC5wYXJlbnQgPSBjYW5jZWxCdG47XG4gICAgICAgIFxuICAgICAgICB2YXIgY2FuY2VsQnRuQ29tcCA9IGNhbmNlbEJ0bi5hZGRDb21wb25lbnQoY2MuQnV0dG9uKTtcbiAgICAgICAgY2FuY2VsQnRuQ29tcC50cmFuc2l0aW9uID0gY2MuQnV0dG9uLlRyYW5zaXRpb24uU0NBTEU7XG4gICAgICAgIGNhbmNlbEJ0bkNvbXAuem9vbVNjYWxlID0gMC45NTtcbiAgICAgICAgXG4gICAgICAgIGNhbmNlbEJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcG9wdXAuZGVzdHJveSgpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOehruiupOWKoOWFpeaMiemSriAtIOe7v+iJsuS4u+mimFxuICAgICAgICB2YXIgY29uZmlybUJ0biA9IG5ldyBjYy5Ob2RlKFwiQ29uZmlybUJ0blwiKTtcbiAgICAgICAgY29uZmlybUJ0bi5zZXRDb250ZW50U2l6ZShjYy5zaXplKDE2MCwgNDgpKTtcbiAgICAgICAgY29uZmlybUJ0bi54ID0gMTAwO1xuICAgICAgICBjb25maXJtQnRuLnkgPSBidG5ZO1xuICAgICAgICB2YXIgY29uZmlybUdmeCA9IGNvbmZpcm1CdG4uYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgY29uZmlybUdmeC5maWxsQ29sb3IgPSBjYy5jb2xvcig3NiwgMTc1LCA4MCk7ICAvLyDnu7/oibJcbiAgICAgICAgY29uZmlybUdmeC5yb3VuZFJlY3QoLTgwLCAtMjQsIDE2MCwgNDgsIDEwKTtcbiAgICAgICAgY29uZmlybUdmeC5maWxsKCk7XG4gICAgICAgIGNvbmZpcm1HZnguc3Ryb2tlQ29sb3IgPSBjYy5jb2xvcigxMDAsIDIwMCwgMTA1KTtcbiAgICAgICAgY29uZmlybUdmeC5saW5lV2lkdGggPSAyO1xuICAgICAgICBjb25maXJtR2Z4LnJvdW5kUmVjdCgtODAsIC0yNCwgMTYwLCA0OCwgMTApO1xuICAgICAgICBjb25maXJtR2Z4LnN0cm9rZSgpO1xuICAgICAgICBjb25maXJtQnRuLnBhcmVudCA9IHBhbmVsO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNvbmZpcm1JY29uID0gbmV3IGNjLk5vZGUoXCJJY29uXCIpO1xuICAgICAgICB2YXIgY29uZmlybUljb25MYWJlbCA9IGNvbmZpcm1JY29uLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGNvbmZpcm1JY29uTGFiZWwuc3RyaW5nID0gXCLinJNcIjtcbiAgICAgICAgY29uZmlybUljb25MYWJlbC5mb250U2l6ZSA9IDIwO1xuICAgICAgICBjb25maXJtSWNvbi54ID0gLTUwO1xuICAgICAgICBjb25maXJtSWNvbi5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICBjb25maXJtSWNvbi5wYXJlbnQgPSBjb25maXJtQnRuO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNvbmZpcm1MYWJlbCA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIik7XG4gICAgICAgIHZhciBjb25maXJtTGFiZWxDb21wID0gY29uZmlybUxhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGNvbmZpcm1MYWJlbENvbXAuc3RyaW5nID0gXCLliqDlhaXmiL/pl7RcIjtcbiAgICAgICAgY29uZmlybUxhYmVsQ29tcC5mb250U2l6ZSA9IDIwO1xuICAgICAgICBjb25maXJtTGFiZWxDb21wLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIGNvbmZpcm1MYWJlbC5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICBjb25maXJtTGFiZWwucGFyZW50ID0gY29uZmlybUJ0bjtcbiAgICAgICAgXG4gICAgICAgIHZhciBjb25maXJtQnRuQ29tcCA9IGNvbmZpcm1CdG4uYWRkQ29tcG9uZW50KGNjLkJ1dHRvbik7XG4gICAgICAgIGNvbmZpcm1CdG5Db21wLnRyYW5zaXRpb24gPSBjYy5CdXR0b24uVHJhbnNpdGlvbi5TQ0FMRTtcbiAgICAgICAgY29uZmlybUJ0bkNvbXAuem9vbVNjYWxlID0gMC45NTtcbiAgICAgICAgXG4gICAgICAgIC8vIOehruiupOaMiemSrueCueWHu+S6i+S7tlxuICAgICAgICBjb25maXJtQnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgcm9vbUlkID0gZWRpdEJveC5zdHJpbmc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICghcm9vbUlkIHx8IHJvb21JZC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZShcIuivt+i+k+WFpeaIv+mXtOWPt1wiKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWPkemAgeWKoOWFpeaIv+mXtOivt+axglxuICAgICAgICAgICAgc2VsZi5fam9pblJvb21CeUlkKHJvb21JZCwgcG9wdXApO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09IOWFs+mXreaMiemSru+8iOWPs+S4iuinku+8iSA9PT09PVxuICAgICAgICB2YXIgY2xvc2VCdG4gPSBuZXcgY2MuTm9kZShcIkNsb3NlQnRuXCIpO1xuICAgICAgICBjbG9zZUJ0bi5zZXRDb250ZW50U2l6ZShjYy5zaXplKDQwLCA0MCkpO1xuICAgICAgICBjbG9zZUJ0bi54ID0gcGFuZWxXaWR0aC8yIC0gMjU7XG4gICAgICAgIGNsb3NlQnRuLnkgPSBwYW5lbEhlaWdodC8yIC0gMjU7XG4gICAgICAgIHZhciBjbG9zZUdmeCA9IGNsb3NlQnRuLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIGNsb3NlR2Z4LmZpbGxDb2xvciA9IGNjLmNvbG9yKDYwLCA1NSwgNzUpO1xuICAgICAgICBjbG9zZUdmeC5jaXJjbGUoMCwgMCwgMjApO1xuICAgICAgICBjbG9zZUdmeC5maWxsKCk7XG4gICAgICAgIGNsb3NlQnRuLnBhcmVudCA9IHBhbmVsO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNsb3NlWCA9IG5ldyBjYy5Ob2RlKFwiWFwiKTtcbiAgICAgICAgdmFyIGNsb3NlTGFiZWwgPSBjbG9zZVguYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgY2xvc2VMYWJlbC5zdHJpbmcgPSBcIsOXXCI7XG4gICAgICAgIGNsb3NlTGFiZWwuZm9udFNpemUgPSAyODtcbiAgICAgICAgY2xvc2VMYWJlbC5saW5lSGVpZ2h0ID0gMzY7XG4gICAgICAgIGNsb3NlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgY2xvc2VYLmNvbG9yID0gY2MuY29sb3IoMTgwLCAxNzAsIDE2MCk7XG4gICAgICAgIGNsb3NlWC5wYXJlbnQgPSBjbG9zZUJ0bjtcbiAgICAgICAgXG4gICAgICAgIGNsb3NlQnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBwb3B1cC5kZXN0cm95KCk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICBcbiAgICB9LFxuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOmAmui/h+aIv+mXtOWPt+WKoOWFpeaIv+mXtFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIF9qb2luUm9vbUJ5SWQ6IGZ1bmN0aW9uKHJvb21JZCwgcG9wdXApIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWw7XG4gICAgICAgIFxuICAgICAgICBpZiAoIW15Z2xvYmFsIHx8ICFteWdsb2JhbC5zb2NrZXQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dNZXNzYWdlKFwi572R57uc5pyq6L+e5o6l77yM6K+356iN5ZCO6YeN6K+VXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9zaG93TWVzc2FnZShcIuato+WcqOWKoOWFpeaIv+mXtC4uLlwiKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWPkemAgeWKoOWFpeaIv+mXtOivt+axglxuICAgICAgICBteWdsb2JhbC5zb2NrZXQucmVxdWVzdF9qb2luUm9vbSh7XG4gICAgICAgICAgICByb29tSWQ6IHJvb21JZFxuICAgICAgICB9LCBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuICAgICAgICAgICAgaWYgKGVyciAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlKFwi5Yqg5YWl5oi/6Ze05aSx6LSlOiBcIiArIChyZXN1bHQgfHwgXCLmiL/pl7TkuI3lrZjlnKhcIikpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2UoXCLliqDlhaXmiJDlip/vvIFcIik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWFs+mXreW8ueeql1xuICAgICAgICAgICAgaWYgKHBvcHVwKSBwb3B1cC5kZXN0cm95KCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOi3s+i9rOWIsOa4uOaIj+WcuuaZr1xuICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQucm9vbUlkKSB7XG4gICAgICAgICAgICAgICAgbXlnbG9iYWwuY3VycmVudFJvb21JZCA9IHJlc3VsdC5yb29tSWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOW7tui/n+i3s+i9rFxuICAgICAgICAgICAgc2VsZi5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwiZ2FtZVNjZW5lXCIpO1xuICAgICAgICAgICAgfSwgMC41KTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDjgJDnq57mioDlnLrlip/og73jgJHmm7TmlrDotKfluIHmmL7npLrvvIjmrKLkuZDosYYv56ue5oqA5biB77yJXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgX3VwZGF0ZUN1cnJlbmN5RGlzcGxheTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbDtcbiAgICAgICAgdmFyIHBsYXllckRhdGEgPSBteWdsb2JhbCA/IG15Z2xvYmFsLnBsYXllckRhdGEgOiBudWxsO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFwbGF5ZXJEYXRhKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICB2YXIgcm9vbUNhdGVnb3J5ID0gdGhpcy5fY3VycmVudFJvb21DYXRlZ29yeSB8fCAxO1xuICAgICAgICBcbiAgICAgICAgaWYgKHJvb21DYXRlZ29yeSA9PT0gMikge1xuICAgICAgICAgICAgLy8g56ue5oqA5Zy6IC0g5pi+56S656ue5oqA5biBXG4gICAgICAgICAgICBpZiAodGhpcy5nb2JhbF9jb3VudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ29iYWxfY291bnQuc3RyaW5nID0gXCI6XCIgKyB0aGlzLl9mb3JtYXRHb2xkKHBsYXllckRhdGEuYXJlbmFfY29pbiB8fCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOmakOiXj+asouS5kOixhuWbvuagh++8jOaYvuekuuernuaKgOW4geWbvuagh++8iOWmguaenOacie+8iVxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlQ3VycmVuY3lJY29uKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5pmu6YCa5Zy6IC0g5pi+56S65qyi5LmQ6LGGXG4gICAgICAgICAgICBpZiAodGhpcy5nb2JhbF9jb3VudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZ29iYWxfY291bnQuc3RyaW5nID0gXCI6XCIgKyB0aGlzLl9mb3JtYXRHb2xkKHBsYXllckRhdGEuZ29iYWxfY291bnQgfHwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVDdXJyZW5jeUljb24oMSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vIOabtOaWsOi0p+W4geWbvuagh1xuICAgIF91cGRhdGVDdXJyZW5jeUljb246IGZ1bmN0aW9uKHJvb21DYXRlZ29yeSkge1xuICAgICAgICAvLyDmn6Xmib7miJbliJvlu7rotKfluIHlm77moIfoioLngrlcbiAgICAgICAgdmFyIHBsYXllck5vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJwbGF5ZXJfbm9kZVwiKTtcbiAgICAgICAgaWYgKCFwbGF5ZXJOb2RlKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICAvLyDlsJ3or5Xmib7liLDotKfluIHlm77moIdcbiAgICAgICAgdmFyIGN1cnJlbmN5SWNvbiA9IHBsYXllck5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJjdXJyZW5jeV9pY29uXCIpO1xuICAgICAgICBpZiAoIWN1cnJlbmN5SWNvbikge1xuICAgICAgICAgICAgLy8g5aaC5p6c5rKh5pyJ546w5pyJ5Zu+5qCH77yM5Yib5bu65LiA5LiqXG4gICAgICAgICAgICBjdXJyZW5jeUljb24gPSBuZXcgY2MuTm9kZShcImN1cnJlbmN5X2ljb25cIik7XG4gICAgICAgICAgICBjdXJyZW5jeUljb24uc2V0UG9zaXRpb24oLTEwMCwgODApO1xuICAgICAgICAgICAgY3VycmVuY3lJY29uLnpJbmRleCA9IDEwO1xuICAgICAgICAgICAgY3VycmVuY3lJY29uLnBhcmVudCA9IHBsYXllck5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOagueaNruexu+Wei+aYvuekuuS4jeWQjOWbvuagh++8iOi/memHjOeUqOaWh+Wtl+S7o+abv++8jOWunumZhemhueebruWPr+S7peaNouWbvueJh++8iVxuICAgICAgICB2YXIgbGFiZWwgPSBjdXJyZW5jeUljb24uZ2V0Q29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgaWYgKCFsYWJlbCkge1xuICAgICAgICAgICAgbGFiZWwgPSBjdXJyZW5jeUljb24uYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgfVxuICAgICAgICBsYWJlbC5zdHJpbmcgPSByb29tQ2F0ZWdvcnkgPT09IDIgPyBcIuW4gVwiIDogXCLosYZcIjtcbiAgICAgICAgbGFiZWwuZm9udFNpemUgPSAyNDtcbiAgICAgICAgY3VycmVuY3lJY29uLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyMTUsIDApO1xuICAgICAgICBcbiAgICAgICAgdmFyIG91dGxpbmUgPSBjdXJyZW5jeUljb24uZ2V0Q29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSk7XG4gICAgICAgIGlmICghb3V0bGluZSkge1xuICAgICAgICAgICAgb3V0bGluZSA9IGN1cnJlbmN5SWNvbi5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKTtcbiAgICAgICAgfVxuICAgICAgICBvdXRsaW5lLmNvbG9yID0gY2MuY29sb3IoMCwgMCwgMCk7XG4gICAgICAgIG91dGxpbmUud2lkdGggPSAyO1xuICAgIH0sXG4gICAgXG4gICAgLy8g5Yid5aeL5YyW56ue5oqA5biB5pi+56S6XG4gICAgX2luaXRBcmVuYUNvaW5EaXNwbGF5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICB2YXIgcGxheWVyRGF0YSA9IG15Z2xvYmFsID8gbXlnbG9iYWwucGxheWVyRGF0YSA6IG51bGw7XG4gICAgICAgIFxuICAgICAgICAvLyDlpoLmnpzmnInnq57mioDluIFMYWJlbO+8jOWIneWni+WMluaYvuekulxuICAgICAgICBpZiAodGhpcy5hcmVuYV9jb2luX2xhYmVsICYmIHBsYXllckRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuYXJlbmFfY29pbl9sYWJlbC5zdHJpbmcgPSBcIuernuaKgOW4gTogXCIgKyB0aGlzLl9mb3JtYXRHb2xkKHBsYXllckRhdGEuYXJlbmFfY29pbiB8fCAwKTtcbiAgICAgICAgICAgIHRoaXMuYXJlbmFfY29pbl9sYWJlbC5ub2RlLmFjdGl2ZSA9IGZhbHNlOyAvLyDpu5jorqTpmpDol49cbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLy8g6I635Y+W5pyA5paw55qE546p5a625L2Z6aKd77yI6YeR5biB5ZKM56ue5oqA5biB77yJXG4gICAgX3JlZnJlc2hQbGF5ZXJCYWxhbmNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgaWYgKHdpbmRvdy5hcmVuYURhdGEgJiYgd2luZG93LmFyZW5hRGF0YS5yZWZyZXNoQmFsYW5jZSkge1xuICAgICAgICAgICAgd2luZG93LmFyZW5hRGF0YS5yZWZyZXNoQmFsYW5jZShmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIuiOt+WPlueOqeWutuS9memineWksei0pTpcIiwgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDmm7TmlrBVSeaYvuekulxuICAgICAgICAgICAgICAgIHNlbGYuX3VwZGF0ZUN1cnJlbmN5RGlzcGxheSgpO1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmFyZW5hX2NvaW5fbGFiZWwgJiYgZGF0YS5hcmVuYV9jb2luICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hcmVuYV9jb2luX2xhYmVsLnN0cmluZyA9IFwi56ue5oqA5biBOiBcIiArIHNlbGYuX2Zvcm1hdEdvbGQoZGF0YS5hcmVuYV9jb2luKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g44CQ56ue5oqA5Zy65Yqf6IO944CR5pi+56S65oql5ZCN5by556qXXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgX3Nob3dTaWdudXBEaWFsb2c6IGZ1bmN0aW9uKHJvb21Db25maWcpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWw7XG4gICAgICAgIHZhciBwbGF5ZXJEYXRhID0gbXlnbG9iYWwgPyBteWdsb2JhbC5wbGF5ZXJEYXRhIDogbnVsbDtcbiAgICAgICAgdmFyIHBsYXllckFyZW5hQ29pbiA9IHBsYXllckRhdGEgPyAocGxheWVyRGF0YS5hcmVuYV9jb2luIHx8IDApIDogMDtcbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPluaKpeWQjei0uVxuICAgICAgICB2YXIgc2lnbnVwRmVlID0gcm9vbUNvbmZpZy5zaWdudXBfZmVlIHx8IHJvb21Db25maWcuc2lnbnVwRmVlIHx8IDA7XG4gICAgICAgIFxuICAgICAgICAvLyDnp7vpmaTml6flvLnnqpdcbiAgICAgICAgdmFyIG9sZERpYWxvZyA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcIlNpZ251cERpYWxvZ1wiKTtcbiAgICAgICAgaWYgKG9sZERpYWxvZykgb2xkRGlhbG9nLmRlc3Ryb3koKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPlueUu+W4g+WwuuWvuFxuICAgICAgICB2YXIgY2FudmFzID0gdGhpcy5ub2RlLmdldENvbXBvbmVudChjYy5DYW52YXMpIHx8IGNjLmZpbmQoJ0NhbnZhcycpLmdldENvbXBvbmVudChjYy5DYW52YXMpO1xuICAgICAgICB2YXIgc2NyZWVuSGVpZ2h0ID0gY2FudmFzID8gY2FudmFzLmRlc2lnblJlc29sdXRpb24uaGVpZ2h0IDogNzIwO1xuICAgICAgICB2YXIgc2NyZWVuV2lkdGggPSBjYW52YXMgPyBjYW52YXMuZGVzaWduUmVzb2x1dGlvbi53aWR0aCA6IDEyODA7XG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7rlvLnnqpflrrnlmahcbiAgICAgICAgdmFyIGRpYWxvZyA9IG5ldyBjYy5Ob2RlKFwiU2lnbnVwRGlhbG9nXCIpO1xuICAgICAgICBkaWFsb2cuc2V0Q29udGVudFNpemUoY2Muc2l6ZShzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSk7XG4gICAgICAgIGRpYWxvZy5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgZGlhbG9nLnpJbmRleCA9IDMwMDA7XG4gICAgICAgIGRpYWxvZy5wYXJlbnQgPSB0aGlzLm5vZGU7XG4gICAgICAgIFxuICAgICAgICAvLyDljYrpgI/mmI7pga7nvalcbiAgICAgICAgdmFyIG1hc2sgPSBuZXcgY2MuTm9kZShcIk1hc2tcIik7XG4gICAgICAgIHZhciBtYXNrRyA9IG1hc2suYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgbWFza0cuZmlsbENvbG9yID0gY2MuY29sb3IoMCwgMCwgMCwgMTgwKTtcbiAgICAgICAgbWFza0cucmVjdCgtc2NyZWVuV2lkdGgvMiwgLXNjcmVlbkhlaWdodC8yLCBzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KTtcbiAgICAgICAgbWFza0cuZmlsbCgpO1xuICAgICAgICBtYXNrLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIG1hc2sub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8g5by556qX5Li75L2TXG4gICAgICAgIHZhciBkaWFsb2dXaWR0aCA9IDQyMDtcbiAgICAgICAgdmFyIGRpYWxvZ0hlaWdodCA9IDM4MDtcbiAgICAgICAgdmFyIGRpYWxvZ0JnID0gbmV3IGNjLk5vZGUoXCJEaWFsb2dCZ1wiKTtcbiAgICAgICAgZGlhbG9nQmcuc2V0Q29udGVudFNpemUoY2Muc2l6ZShkaWFsb2dXaWR0aCwgZGlhbG9nSGVpZ2h0KSk7XG4gICAgICAgIFxuICAgICAgICB2YXIgZGJnID0gZGlhbG9nQmcuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgZGJnLmZpbGxDb2xvciA9IGNjLmNvbG9yKDM1LCAzMCwgNTAsIDI1MCk7XG4gICAgICAgIGRiZy5yb3VuZFJlY3QoLWRpYWxvZ1dpZHRoLzIsIC1kaWFsb2dIZWlnaHQvMiwgZGlhbG9nV2lkdGgsIGRpYWxvZ0hlaWdodCwgMTIpO1xuICAgICAgICBkYmcuZmlsbCgpO1xuICAgICAgICBkYmcuc3Ryb2tlQ29sb3IgPSBjYy5jb2xvcigxODAsIDE0MCwgNjAsIDIwMCk7XG4gICAgICAgIGRiZy5saW5lV2lkdGggPSAzO1xuICAgICAgICBkYmcucm91bmRSZWN0KC1kaWFsb2dXaWR0aC8yLCAtZGlhbG9nSGVpZ2h0LzIsIGRpYWxvZ1dpZHRoLCBkaWFsb2dIZWlnaHQsIDEyKTtcbiAgICAgICAgZGJnLnN0cm9rZSgpO1xuICAgICAgICBkaWFsb2dCZy5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICAvLyDmoIfpophcbiAgICAgICAgdmFyIHRpdGxlVGV4dCA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIik7XG4gICAgICAgIHRpdGxlVGV4dC5zZXRQb3NpdGlvbigwLCBkaWFsb2dIZWlnaHQvMiAtIDQwKTtcbiAgICAgICAgdGl0bGVUZXh0LmFuY2hvclggPSAwLjU7XG4gICAgICAgIHRpdGxlVGV4dC5hbmNob3JZID0gMC41O1xuICAgICAgICB2YXIgdHRsID0gdGl0bGVUZXh0LmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIHR0bC5zdHJpbmcgPSBcIuernuaKgOWcuuaKpeWQjVwiO1xuICAgICAgICB0dGwuZm9udFNpemUgPSAyNjtcbiAgICAgICAgdHRsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIHRpdGxlVGV4dC5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjIwLCAxMDApO1xuICAgICAgICBcbiAgICAgICAgdmFyIHRpdGxlT3V0bGluZSA9IHRpdGxlVGV4dC5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKTtcbiAgICAgICAgdGl0bGVPdXRsaW5lLmNvbG9yID0gY2MuY29sb3IoODAsIDUwLCAwKTtcbiAgICAgICAgdGl0bGVPdXRsaW5lLndpZHRoID0gMjtcbiAgICAgICAgdGl0bGVUZXh0LnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIC8vIOaIv+mXtOWQjeensFxuICAgICAgICB2YXIgcm9vbU5hbWVUZXh0ID0gbmV3IGNjLk5vZGUoXCJSb29tTmFtZVwiKTtcbiAgICAgICAgcm9vbU5hbWVUZXh0LnNldFBvc2l0aW9uKDAsIGRpYWxvZ0hlaWdodC8yIC0gODApO1xuICAgICAgICByb29tTmFtZVRleHQuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgcm9vbU5hbWVUZXh0LmFuY2hvclkgPSAwLjU7XG4gICAgICAgIHZhciBybmwgPSByb29tTmFtZVRleHQuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgcm5sLnN0cmluZyA9IHJvb21Db25maWcucm9vbV9uYW1lIHx8IFwi56ue5oqA5Zy6XCI7XG4gICAgICAgIHJubC5mb250U2l6ZSA9IDIwO1xuICAgICAgICBybmwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgcm9vbU5hbWVUZXh0LmNvbG9yID0gY2MuY29sb3IoMjAwLCAxODAsIDE0MCk7XG4gICAgICAgIHJvb21OYW1lVGV4dC5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICAvLyDmiqXlkI3otLnkv6Hmga9cbiAgICAgICAgdmFyIGZlZUxhYmVsID0gbmV3IGNjLk5vZGUoXCJGZWVMYWJlbFwiKTtcbiAgICAgICAgZmVlTGFiZWwuc2V0UG9zaXRpb24oLWRpYWxvZ1dpZHRoLzIgKyAzMCwgZGlhbG9nSGVpZ2h0LzIgLSAxMzApO1xuICAgICAgICBmZWVMYWJlbC5hbmNob3JYID0gMDtcbiAgICAgICAgZmVlTGFiZWwuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgdmFyIGZsID0gZmVlTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgZmwuc3RyaW5nID0gXCLmiqXlkI3otLnvvJpcIjtcbiAgICAgICAgZmwuZm9udFNpemUgPSAxODtcbiAgICAgICAgZmVlTGFiZWwuY29sb3IgPSBjYy5jb2xvcigyMjAsIDIxMCwgMTkwKTtcbiAgICAgICAgZmVlTGFiZWwucGFyZW50ID0gZGlhbG9nO1xuICAgICAgICBcbiAgICAgICAgdmFyIGZlZVZhbHVlID0gbmV3IGNjLk5vZGUoXCJGZWVWYWx1ZVwiKTtcbiAgICAgICAgZmVlVmFsdWUuc2V0UG9zaXRpb24oNjAsIGRpYWxvZ0hlaWdodC8yIC0gMTMwKTtcbiAgICAgICAgZmVlVmFsdWUuYW5jaG9yWCA9IDA7XG4gICAgICAgIGZlZVZhbHVlLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIHZhciBmdiA9IGZlZVZhbHVlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGZ2LnN0cmluZyA9IHRoaXMuX2Zvcm1hdEdvbGQoc2lnbnVwRmVlKSArIFwiIOernuaKgOW4gVwiO1xuICAgICAgICBmdi5mb250U2l6ZSA9IDIwO1xuICAgICAgICBmZWVWYWx1ZS5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjE1LCAwKTtcbiAgICAgICAgZmVlVmFsdWUucGFyZW50ID0gZGlhbG9nO1xuICAgICAgICBcbiAgICAgICAgLy8g5b2T5YmN5L2Z6aKdXG4gICAgICAgIHZhciBiYWxhbmNlTGFiZWwgPSBuZXcgY2MuTm9kZShcIkJhbGFuY2VMYWJlbFwiKTtcbiAgICAgICAgYmFsYW5jZUxhYmVsLnNldFBvc2l0aW9uKC1kaWFsb2dXaWR0aC8yICsgMzAsIGRpYWxvZ0hlaWdodC8yIC0gMTcwKTtcbiAgICAgICAgYmFsYW5jZUxhYmVsLmFuY2hvclggPSAwO1xuICAgICAgICBiYWxhbmNlTGFiZWwuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgdmFyIGJsID0gYmFsYW5jZUxhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGJsLnN0cmluZyA9IFwi5b2T5YmN5L2Z6aKd77yaXCI7XG4gICAgICAgIGJsLmZvbnRTaXplID0gMTg7XG4gICAgICAgIGJhbGFuY2VMYWJlbC5jb2xvciA9IGNjLmNvbG9yKDIyMCwgMjEwLCAxOTApO1xuICAgICAgICBiYWxhbmNlTGFiZWwucGFyZW50ID0gZGlhbG9nO1xuICAgICAgICBcbiAgICAgICAgdmFyIGJhbGFuY2VWYWx1ZSA9IG5ldyBjYy5Ob2RlKFwiQmFsYW5jZVZhbHVlXCIpO1xuICAgICAgICBiYWxhbmNlVmFsdWUuc2V0UG9zaXRpb24oNjAsIGRpYWxvZ0hlaWdodC8yIC0gMTcwKTtcbiAgICAgICAgYmFsYW5jZVZhbHVlLmFuY2hvclggPSAwO1xuICAgICAgICBiYWxhbmNlVmFsdWUuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgdmFyIGJ2ID0gYmFsYW5jZVZhbHVlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGJ2LnN0cmluZyA9IHRoaXMuX2Zvcm1hdEdvbGQocGxheWVyQXJlbmFDb2luKSArIFwiIOernuaKgOW4gVwiO1xuICAgICAgICBidi5mb250U2l6ZSA9IDIwO1xuICAgICAgICBiYWxhbmNlVmFsdWUuY29sb3IgPSBwbGF5ZXJBcmVuYUNvaW4gPj0gc2lnbnVwRmVlID8gY2MuY29sb3IoMTAwLCAyMjAsIDEwMCkgOiBjYy5jb2xvcigyNTUsIDEwMCwgMTAwKTtcbiAgICAgICAgYmFsYW5jZVZhbHVlLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIC8vIOWGoOWGm+WlluWKsemihOiniFxuICAgICAgICB2YXIgcmV3YXJkTGFiZWwgPSBuZXcgY2MuTm9kZShcIlJld2FyZExhYmVsXCIpO1xuICAgICAgICByZXdhcmRMYWJlbC5zZXRQb3NpdGlvbigtZGlhbG9nV2lkdGgvMiArIDMwLCBkaWFsb2dIZWlnaHQvMiAtIDIxMCk7XG4gICAgICAgIHJld2FyZExhYmVsLmFuY2hvclggPSAwO1xuICAgICAgICByZXdhcmRMYWJlbC5hbmNob3JZID0gMC41O1xuICAgICAgICB2YXIgcmwgPSByZXdhcmRMYWJlbC5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBybC5zdHJpbmcgPSBcIuWGoOWGm+WlluWKse+8mlwiO1xuICAgICAgICBybC5mb250U2l6ZSA9IDE4O1xuICAgICAgICByZXdhcmRMYWJlbC5jb2xvciA9IGNjLmNvbG9yKDIyMCwgMjEwLCAxOTApO1xuICAgICAgICByZXdhcmRMYWJlbC5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICB2YXIgY2hhbXBpb25SZXdhcmQgPSByb29tQ29uZmlnLmNoYW1waW9uX3Jld2FyZCB8fCByb29tQ29uZmlnLmNoYW1waW9uUmV3YXJkIHx8IHsgY29pbnM6IDAgfTtcbiAgICAgICAgdmFyIHJld2FyZFZhbHVlID0gbmV3IGNjLk5vZGUoXCJSZXdhcmRWYWx1ZVwiKTtcbiAgICAgICAgcmV3YXJkVmFsdWUuc2V0UG9zaXRpb24oNjAsIGRpYWxvZ0hlaWdodC8yIC0gMjEwKTtcbiAgICAgICAgcmV3YXJkVmFsdWUuYW5jaG9yWCA9IDA7XG4gICAgICAgIHJld2FyZFZhbHVlLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIHZhciBydiA9IHJld2FyZFZhbHVlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIHJ2LnN0cmluZyA9IHRoaXMuX2Zvcm1hdEdvbGQoY2hhbXBpb25SZXdhcmQuY29pbnMgfHwgMCkgKyBcIiDnq57mioDluIFcIjtcbiAgICAgICAgcnYuZm9udFNpemUgPSAyMDtcbiAgICAgICAgcmV3YXJkVmFsdWUuY29sb3IgPSBjYy5jb2xvcigyNTUsIDE4MCwgNTApO1xuICAgICAgICByZXdhcmRWYWx1ZS5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICAvLyDmjInpkq7ljLrln59cbiAgICAgICAgdmFyIGJ0blkgPSAtZGlhbG9nSGVpZ2h0LzIgKyA1NTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWIpOaWreS9memineaYr+WQpui2s+Wkn1xuICAgICAgICB2YXIgaXNFbm91Z2ggPSBwbGF5ZXJBcmVuYUNvaW4gPj0gc2lnbnVwRmVlO1xuICAgICAgICBcbiAgICAgICAgLy8g5Y+W5raI5oyJ6ZKuXG4gICAgICAgIHZhciBjYW5jZWxCdG4gPSB0aGlzLl9jcmVhdGVEaWFsb2dCdXR0b24oXG4gICAgICAgICAgICBcIuWPlua2iFwiLFxuICAgICAgICAgICAgY2MuY29sb3IoODAsIDc1LCA5NSksXG4gICAgICAgICAgICAtOTAsIGJ0blksXG4gICAgICAgICAgICAxMzAsIDQ4LFxuICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZGlhbG9nLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgY2FuY2VsQnRuLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIGlmIChpc0Vub3VnaCkge1xuICAgICAgICAgICAgLy8g5oql5ZCN5oyJ6ZKuXG4gICAgICAgICAgICB2YXIgc2lnbnVwQnRuID0gdGhpcy5fY3JlYXRlRGlhbG9nQnV0dG9uKFxuICAgICAgICAgICAgICAgIFwi56Gu6K6k5oql5ZCNXCIsXG4gICAgICAgICAgICAgICAgY2MuY29sb3IoNzYsIDE3NSwgODApLCAgLy8g57u/6ImyXG4gICAgICAgICAgICAgICAgOTAsIGJ0blksXG4gICAgICAgICAgICAgICAgMTUwLCA0OCxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g6LCD55So5oql5ZCN5o6l5Y+jXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2RvU2lnbnVwKHJvb21Db25maWcsIGRpYWxvZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHNpZ251cEJ0bi5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDkvZnpop3kuI3otrMgLSDmmL7npLrop4LnnIvlub/lkYrmjInpkq5cbiAgICAgICAgICAgIHZhciBhZEJ0biA9IHRoaXMuX2NyZWF0ZURpYWxvZ0J1dHRvbihcbiAgICAgICAgICAgICAgICBcIuingueci+W5v+WRiuiOt+WPllwiLFxuICAgICAgICAgICAgICAgIGNjLmNvbG9yKDI1NSwgMTUyLCAwKSwgIC8vIOapmeiJslxuICAgICAgICAgICAgICAgIDkwLCBidG5ZLFxuICAgICAgICAgICAgICAgIDE1MCwgNDgsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGRpYWxvZy5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dBZFJld2FyZERpYWxvZygnYXJlbmFfY29pbicsIHNpZ251cEZlZSAtIHBsYXllckFyZW5hQ29pbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGFkQnRuLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5o+Q56S65L2Z6aKd5LiN6LazXG4gICAgICAgICAgICB2YXIgdGlwTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGlwXCIpO1xuICAgICAgICAgICAgdGlwTm9kZS5zZXRQb3NpdGlvbigwLCBidG5ZICsgNDUpO1xuICAgICAgICAgICAgdGlwTm9kZS5hbmNob3JYID0gMC41O1xuICAgICAgICAgICAgdGlwTm9kZS5hbmNob3JZID0gMC41O1xuICAgICAgICAgICAgdmFyIHRpcExhYmVsID0gdGlwTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICAgICAgdGlwTGFiZWwuc3RyaW5nID0gXCLnq57mioDluIHkuI3otrPvvIzop4LnnIvlub/lkYrojrflj5bmm7TlpJpcIjtcbiAgICAgICAgICAgIHRpcExhYmVsLmZvbnRTaXplID0gMTQ7XG4gICAgICAgICAgICB0aXBMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICAgICAgdGlwTm9kZS5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMTUwLCAxMDApO1xuICAgICAgICAgICAgdGlwTm9kZS5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWFs+mXreaMiemSrlxuICAgICAgICB2YXIgY2xvc2VCdG4gPSBuZXcgY2MuTm9kZShcIkNsb3NlQnRuXCIpO1xuICAgICAgICBjbG9zZUJ0bi5zZXRDb250ZW50U2l6ZShjYy5zaXplKDMwLCAzMCkpO1xuICAgICAgICBjbG9zZUJ0bi54ID0gZGlhbG9nV2lkdGgvMiAtIDI1O1xuICAgICAgICBjbG9zZUJ0bi55ID0gZGlhbG9nSGVpZ2h0LzIgLSAzMDtcbiAgICAgICAgdmFyIGNiZyA9IGNsb3NlQnRuLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIGNiZy5maWxsQ29sb3IgPSBjYy5jb2xvcigwLCAwLCAwLCA4MCk7XG4gICAgICAgIGNiZy5jaXJjbGUoMCwgMCwgMTUpO1xuICAgICAgICBjYmcuZmlsbCgpO1xuICAgICAgICBjbG9zZUJ0bi5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICB2YXIgY2xvc2VYID0gbmV3IGNjLk5vZGUoXCJYXCIpO1xuICAgICAgICBjbG9zZVguYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgY2xvc2VYLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIHZhciBjbG9zZUxhYmVsID0gY2xvc2VYLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGNsb3NlTGFiZWwuc3RyaW5nID0gXCLDl1wiO1xuICAgICAgICBjbG9zZUxhYmVsLmZvbnRTaXplID0gMjQ7XG4gICAgICAgIGNsb3NlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgY2xvc2VYLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgIGNsb3NlWC5wYXJlbnQgPSBjbG9zZUJ0bjtcbiAgICAgICAgXG4gICAgICAgIGNsb3NlQnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkaWFsb2cuZGVzdHJveSgpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIFxuICAgIC8vIOaJp+ihjOaKpeWQjVxuICAgIF9kb1NpZ251cDogZnVuY3Rpb24ocm9vbUNvbmZpZywgZGlhbG9nKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIGlmICghd2luZG93LmFyZW5hRGF0YSkge1xuICAgICAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2UoXCLnq57mioDlnLrmlbDmja7mnKrliJ3lp4vljJZcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX3Nob3dNZXNzYWdlQ2VudGVyKFwi5q2j5Zyo5oql5ZCNLi4uXCIpO1xuICAgICAgICBcbiAgICAgICAgd2luZG93LmFyZW5hRGF0YS5zaWdudXAocm9vbUNvbmZpZy5pZCwgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZUNlbnRlcihcIuaKpeWQjeWksei0pTogXCIgKyBlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2VDZW50ZXIoXCLmiqXlkI3miJDlip/vvIFcIik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWFs+mXreW8ueeql1xuICAgICAgICAgICAgaWYgKGRpYWxvZykgZGlhbG9nLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5pu05paw6LSn5biB5pi+56S6XG4gICAgICAgICAgICBpZiAod2luZG93LmFyZW5hRGF0YS5yZWZyZXNoQmFsYW5jZSkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5hcmVuYURhdGEucmVmcmVzaEJhbGFuY2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuX3VwZGF0ZUN1cnJlbmN5RGlzcGxheSgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmmL7npLrlt7LmiqXlkI3nirbmgIHlvLnnqpdcbiAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dTaWduZWRVcERpYWxvZyhyb29tQ29uZmlnKTtcbiAgICAgICAgICAgIH0sIDAuNSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g44CQ56ue5oqA5Zy65Yqf6IO944CR5pi+56S65bey5oql5ZCN54q25oCB5by556qXXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgX3Nob3dTaWduZWRVcERpYWxvZzogZnVuY3Rpb24ocm9vbUNvbmZpZykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICAvLyDnp7vpmaTml6flvLnnqpdcbiAgICAgICAgdmFyIG9sZERpYWxvZyA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcIlNpZ25lZFVwRGlhbG9nXCIpO1xuICAgICAgICBpZiAob2xkRGlhbG9nKSBvbGREaWFsb2cuZGVzdHJveSgpO1xuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+W55S75biD5bC65a+4XG4gICAgICAgIHZhciBjYW52YXMgPSB0aGlzLm5vZGUuZ2V0Q29tcG9uZW50KGNjLkNhbnZhcykgfHwgY2MuZmluZCgnQ2FudmFzJykuZ2V0Q29tcG9uZW50KGNjLkNhbnZhcyk7XG4gICAgICAgIHZhciBzY3JlZW5IZWlnaHQgPSBjYW52YXMgPyBjYW52YXMuZGVzaWduUmVzb2x1dGlvbi5oZWlnaHQgOiA3MjA7XG4gICAgICAgIHZhciBzY3JlZW5XaWR0aCA9IGNhbnZhcyA/IGNhbnZhcy5kZXNpZ25SZXNvbHV0aW9uLndpZHRoIDogMTI4MDtcbiAgICAgICAgXG4gICAgICAgIC8vIOWIm+W7uuW8ueeql+WuueWZqFxuICAgICAgICB2YXIgZGlhbG9nID0gbmV3IGNjLk5vZGUoXCJTaWduZWRVcERpYWxvZ1wiKTtcbiAgICAgICAgZGlhbG9nLnNldENvbnRlbnRTaXplKGNjLnNpemUoc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCkpO1xuICAgICAgICBkaWFsb2cuc2V0UG9zaXRpb24oMCwgMCk7XG4gICAgICAgIGRpYWxvZy56SW5kZXggPSAzMDAwO1xuICAgICAgICBkaWFsb2cucGFyZW50ID0gdGhpcy5ub2RlO1xuICAgICAgICBcbiAgICAgICAgLy8g5Y2K6YCP5piO6YGu572pXG4gICAgICAgIHZhciBtYXNrID0gbmV3IGNjLk5vZGUoXCJNYXNrXCIpO1xuICAgICAgICB2YXIgbWFza0cgPSBtYXNrLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIG1hc2tHLmZpbGxDb2xvciA9IGNjLmNvbG9yKDAsIDAsIDAsIDE4MCk7XG4gICAgICAgIG1hc2tHLnJlY3QoLXNjcmVlbldpZHRoLzIsIC1zY3JlZW5IZWlnaHQvMiwgc2NyZWVuV2lkdGgsIHNjcmVlbkhlaWdodCk7XG4gICAgICAgIG1hc2tHLmZpbGwoKTtcbiAgICAgICAgbWFzay5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICBtYXNrLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOW8ueeql+S4u+S9k1xuICAgICAgICB2YXIgZGlhbG9nV2lkdGggPSAzODA7XG4gICAgICAgIHZhciBkaWFsb2dIZWlnaHQgPSAzMjA7XG4gICAgICAgIHZhciBkaWFsb2dCZyA9IG5ldyBjYy5Ob2RlKFwiRGlhbG9nQmdcIik7XG4gICAgICAgIGRpYWxvZ0JnLnNldENvbnRlbnRTaXplKGNjLnNpemUoZGlhbG9nV2lkdGgsIGRpYWxvZ0hlaWdodCkpO1xuICAgICAgICBcbiAgICAgICAgdmFyIGRiZyA9IGRpYWxvZ0JnLmFkZENvbXBvbmVudChjYy5HcmFwaGljcyk7XG4gICAgICAgIGRiZy5maWxsQ29sb3IgPSBjYy5jb2xvcigzNSwgMzAsIDUwLCAyNTApO1xuICAgICAgICBkYmcucm91bmRSZWN0KC1kaWFsb2dXaWR0aC8yLCAtZGlhbG9nSGVpZ2h0LzIsIGRpYWxvZ1dpZHRoLCBkaWFsb2dIZWlnaHQsIDEyKTtcbiAgICAgICAgZGJnLmZpbGwoKTtcbiAgICAgICAgZGJnLnN0cm9rZUNvbG9yID0gY2MuY29sb3IoNzYsIDE3NSwgODAsIDIwMCk7XG4gICAgICAgIGRiZy5saW5lV2lkdGggPSAzO1xuICAgICAgICBkYmcucm91bmRSZWN0KC1kaWFsb2dXaWR0aC8yLCAtZGlhbG9nSGVpZ2h0LzIsIGRpYWxvZ1dpZHRoLCBkaWFsb2dIZWlnaHQsIDEyKTtcbiAgICAgICAgZGJnLnN0cm9rZSgpO1xuICAgICAgICBkaWFsb2dCZy5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICAvLyDmoIfpophcbiAgICAgICAgdmFyIHRpdGxlVGV4dCA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIik7XG4gICAgICAgIHRpdGxlVGV4dC5zZXRQb3NpdGlvbigwLCBkaWFsb2dIZWlnaHQvMiAtIDQwKTtcbiAgICAgICAgdGl0bGVUZXh0LmFuY2hvclggPSAwLjU7XG4gICAgICAgIHRpdGxlVGV4dC5hbmNob3JZID0gMC41O1xuICAgICAgICB2YXIgdHRsID0gdGl0bGVUZXh0LmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIHR0bC5zdHJpbmcgPSBcIuW3suaKpeWQjVwiO1xuICAgICAgICB0dGwuZm9udFNpemUgPSAyNjtcbiAgICAgICAgdHRsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIHRpdGxlVGV4dC5jb2xvciA9IGNjLmNvbG9yKDEwMCwgMjIwLCAxMDApO1xuICAgICAgICB0aXRsZVRleHQucGFyZW50ID0gZGlhbG9nO1xuICAgICAgICBcbiAgICAgICAgLy8g5oi/6Ze05ZCN56ewXG4gICAgICAgIHZhciByb29tTmFtZVRleHQgPSBuZXcgY2MuTm9kZShcIlJvb21OYW1lXCIpO1xuICAgICAgICByb29tTmFtZVRleHQuc2V0UG9zaXRpb24oMCwgZGlhbG9nSGVpZ2h0LzIgLSA4MCk7XG4gICAgICAgIHJvb21OYW1lVGV4dC5hbmNob3JYID0gMC41O1xuICAgICAgICByb29tTmFtZVRleHQuYW5jaG9yWSA9IDAuNTtcbiAgICAgICAgdmFyIHJubCA9IHJvb21OYW1lVGV4dC5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICBybmwuc3RyaW5nID0gcm9vbUNvbmZpZy5yb29tX25hbWUgfHwgXCLnq57mioDlnLpcIjtcbiAgICAgICAgcm5sLmZvbnRTaXplID0gMjA7XG4gICAgICAgIHJubC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICByb29tTmFtZVRleHQuY29sb3IgPSBjYy5jb2xvcigyMDAsIDE4MCwgMTQwKTtcbiAgICAgICAgcm9vbU5hbWVUZXh0LnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIC8vIOWAkuiuoeaXtuaYvuekulxuICAgICAgICB2YXIgY291bnRkb3duTGFiZWwgPSBuZXcgY2MuTm9kZShcIkNvdW50ZG93bkxhYmVsXCIpO1xuICAgICAgICBjb3VudGRvd25MYWJlbC5zZXRQb3NpdGlvbigwLCBkaWFsb2dIZWlnaHQvMiAtIDEzMCk7XG4gICAgICAgIGNvdW50ZG93bkxhYmVsLmFuY2hvclggPSAwLjU7XG4gICAgICAgIGNvdW50ZG93bkxhYmVsLmFuY2hvclkgPSAwLjU7XG4gICAgICAgIHZhciBjbCA9IGNvdW50ZG93bkxhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGNsLnN0cmluZyA9IFwi5byA6LWb5YCS6K6h5pe277ya6K6h566X5LitLi4uXCI7XG4gICAgICAgIGNsLmZvbnRTaXplID0gMTg7XG4gICAgICAgIGNsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIGNvdW50ZG93bkxhYmVsLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyMjAsIDEwMCk7XG4gICAgICAgIGNvdW50ZG93bkxhYmVsLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOWAkuiuoeaXtlxuICAgICAgICB2YXIgdXBkYXRlQ291bnRkb3duID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIWRpYWxvZyB8fCAhZGlhbG9nLmlzVmFsaWQpIHJldHVybjtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGNvdW50ZG93biA9IHdpbmRvdy5hcmVuYURhdGEgPyB3aW5kb3cuYXJlbmFEYXRhLmdldENvdW50ZG93bihyb29tQ29uZmlnLmlkKSA6IC0xO1xuICAgICAgICAgICAgaWYgKGNvdW50ZG93biA+PSAwKSB7XG4gICAgICAgICAgICAgICAgY2wuc3RyaW5nID0gXCLlvIDotZvlgJLorqHml7bvvJpcIiArICh3aW5kb3cuYXJlbmFEYXRhLmZvcm1hdENvdW50ZG93biA/IHdpbmRvdy5hcmVuYURhdGEuZm9ybWF0Q291bnRkb3duKGNvdW50ZG93bikgOiBjb3VudGRvd24gKyBcIuenklwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2wuc3RyaW5nID0gXCLnrYnlvoXlvIDotZsuLi5cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGNvdW50ZG93biA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIOWAkuiuoeaXtue7k+adn++8jOiHquWKqOi/m+WFpeavlOi1m1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlQ2VudGVyKFwi5q+U6LWb5Y2z5bCG5byA5aeL77yBXCIpO1xuICAgICAgICAgICAgICAgIGRpYWxvZy5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgLy8g6L+Z6YeM5Y+v5Lul6LCD55So6L+b5YWl5q+U6LWb55qE5pa55rOVXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKHVwZGF0ZUNvdW50ZG93biwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHVwZGF0ZUNvdW50ZG93bigpO1xuICAgICAgICBcbiAgICAgICAgLy8g5oyJ6ZKu5Yy65Z+fXG4gICAgICAgIHZhciBidG5ZID0gLWRpYWxvZ0hlaWdodC8yICsgNTU7XG4gICAgICAgIFxuICAgICAgICAvLyDlj5bmtojmiqXlkI3mjInpkq5cbiAgICAgICAgdmFyIGNhbmNlbFNpZ251cEJ0biA9IHRoaXMuX2NyZWF0ZURpYWxvZ0J1dHRvbihcbiAgICAgICAgICAgIFwi5Y+W5raI5oql5ZCNXCIsXG4gICAgICAgICAgICBjYy5jb2xvcigyMDAsIDEwMCwgODApLCAgLy8g57qi6ImyXG4gICAgICAgICAgICAtODAsIGJ0blksXG4gICAgICAgICAgICAxMzAsIDQ4LFxuICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fY2FuY2VsU2lnbnVwKHJvb21Db25maWcsIGRpYWxvZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIGNhbmNlbFNpZ251cEJ0bi5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICAvLyDlhbPpl63mjInpkq5cbiAgICAgICAgdmFyIGNsb3NlQnRuID0gdGhpcy5fY3JlYXRlRGlhbG9nQnV0dG9uKFxuICAgICAgICAgICAgXCLlhbPpl61cIixcbiAgICAgICAgICAgIGNjLmNvbG9yKDgwLCA3NSwgOTUpLFxuICAgICAgICAgICAgODAsIGJ0blksXG4gICAgICAgICAgICAxMDAsIDQ4LFxuICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZGlhbG9nLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgY2xvc2VCdG4ucGFyZW50ID0gZGlhbG9nO1xuICAgIH0sXG4gICAgXG4gICAgLy8g5Y+W5raI5oql5ZCNXG4gICAgX2NhbmNlbFNpZ251cDogZnVuY3Rpb24ocm9vbUNvbmZpZywgZGlhbG9nKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIGlmICghd2luZG93LmFyZW5hRGF0YSkge1xuICAgICAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2UoXCLnq57mioDlnLrmlbDmja7mnKrliJ3lp4vljJZcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHdpbmRvdy5hcmVuYURhdGEuY2FuY2VsU2lnbnVwKHJvb21Db25maWcuaWQsIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2VDZW50ZXIoXCLlj5bmtojmiqXlkI3lpLHotKU6IFwiICsgZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlQ2VudGVyKFwi5bey5Y+W5raI5oql5ZCNXCIpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlhbPpl63lvLnnqpdcbiAgICAgICAgICAgIGlmIChkaWFsb2cpIGRpYWxvZy5kZXN0cm95KCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOabtOaWsOi0p+W4geaYvuekulxuICAgICAgICAgICAgc2VsZi5fdXBkYXRlQ3VycmVuY3lEaXNwbGF5KCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g44CQ6YCa55So5Yqf6IO944CR5pi+56S65bm/5ZGK6KGl5biB5by556qXXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgX3Nob3dBZFJld2FyZERpYWxvZzogZnVuY3Rpb24odHlwZSwgbmVlZGVkQW1vdW50KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIC8vIOenu+mZpOaXp+W8ueeql1xuICAgICAgICB2YXIgb2xkRGlhbG9nID0gdGhpcy5ub2RlLmdldENoaWxkQnlOYW1lKFwiQWRSZXdhcmREaWFsb2dcIik7XG4gICAgICAgIGlmIChvbGREaWFsb2cpIG9sZERpYWxvZy5kZXN0cm95KCk7XG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5bnlLvluIPlsLrlr7hcbiAgICAgICAgdmFyIGNhbnZhcyA9IHRoaXMubm9kZS5nZXRDb21wb25lbnQoY2MuQ2FudmFzKSB8fCBjYy5maW5kKCdDYW52YXMnKS5nZXRDb21wb25lbnQoY2MuQ2FudmFzKTtcbiAgICAgICAgdmFyIHNjcmVlbkhlaWdodCA9IGNhbnZhcyA/IGNhbnZhcy5kZXNpZ25SZXNvbHV0aW9uLmhlaWdodCA6IDcyMDtcbiAgICAgICAgdmFyIHNjcmVlbldpZHRoID0gY2FudmFzID8gY2FudmFzLmRlc2lnblJlc29sdXRpb24ud2lkdGggOiAxMjgwO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65by556qX5a655ZmoXG4gICAgICAgIHZhciBkaWFsb2cgPSBuZXcgY2MuTm9kZShcIkFkUmV3YXJkRGlhbG9nXCIpO1xuICAgICAgICBkaWFsb2cuc2V0Q29udGVudFNpemUoY2Muc2l6ZShzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSk7XG4gICAgICAgIGRpYWxvZy5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgZGlhbG9nLnpJbmRleCA9IDMwMDA7XG4gICAgICAgIGRpYWxvZy5wYXJlbnQgPSB0aGlzLm5vZGU7XG4gICAgICAgIFxuICAgICAgICAvLyDljYrpgI/mmI7pga7nvalcbiAgICAgICAgdmFyIG1hc2sgPSBuZXcgY2MuTm9kZShcIk1hc2tcIik7XG4gICAgICAgIHZhciBtYXNrRyA9IG1hc2suYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgbWFza0cuZmlsbENvbG9yID0gY2MuY29sb3IoMCwgMCwgMCwgMTgwKTtcbiAgICAgICAgbWFza0cucmVjdCgtc2NyZWVuV2lkdGgvMiwgLXNjcmVlbkhlaWdodC8yLCBzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KTtcbiAgICAgICAgbWFza0cuZmlsbCgpO1xuICAgICAgICBtYXNrLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIG1hc2sub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8g5by556qX5Li75L2TXG4gICAgICAgIHZhciBkaWFsb2dXaWR0aCA9IDM4MDtcbiAgICAgICAgdmFyIGRpYWxvZ0hlaWdodCA9IDMwMDtcbiAgICAgICAgdmFyIGRpYWxvZ0JnID0gbmV3IGNjLk5vZGUoXCJEaWFsb2dCZ1wiKTtcbiAgICAgICAgZGlhbG9nQmcuc2V0Q29udGVudFNpemUoY2Muc2l6ZShkaWFsb2dXaWR0aCwgZGlhbG9nSGVpZ2h0KSk7XG4gICAgICAgIFxuICAgICAgICB2YXIgZGJnID0gZGlhbG9nQmcuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgZGJnLmZpbGxDb2xvciA9IGNjLmNvbG9yKDM1LCAzMCwgNTAsIDI1MCk7XG4gICAgICAgIGRiZy5yb3VuZFJlY3QoLWRpYWxvZ1dpZHRoLzIsIC1kaWFsb2dIZWlnaHQvMiwgZGlhbG9nV2lkdGgsIGRpYWxvZ0hlaWdodCwgMTIpO1xuICAgICAgICBkYmcuZmlsbCgpO1xuICAgICAgICBkYmcuc3Ryb2tlQ29sb3IgPSBjYy5jb2xvcigyNTUsIDE1MiwgMCwgMjAwKTtcbiAgICAgICAgZGJnLmxpbmVXaWR0aCA9IDM7XG4gICAgICAgIGRiZy5yb3VuZFJlY3QoLWRpYWxvZ1dpZHRoLzIsIC1kaWFsb2dIZWlnaHQvMiwgZGlhbG9nV2lkdGgsIGRpYWxvZ0hlaWdodCwgMTIpO1xuICAgICAgICBkYmcuc3Ryb2tlKCk7XG4gICAgICAgIGRpYWxvZ0JnLnBhcmVudCA9IGRpYWxvZztcbiAgICAgICAgXG4gICAgICAgIC8vIOagh+mimFxuICAgICAgICB2YXIgdGl0bGVUZXh0ID0gbmV3IGNjLk5vZGUoXCJUaXRsZVwiKTtcbiAgICAgICAgdGl0bGVUZXh0LnNldFBvc2l0aW9uKDAsIGRpYWxvZ0hlaWdodC8yIC0gNDApO1xuICAgICAgICB0aXRsZVRleHQuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgdGl0bGVUZXh0LmFuY2hvclkgPSAwLjU7XG4gICAgICAgIHZhciB0dGwgPSB0aXRsZVRleHQuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgdHRsLnN0cmluZyA9IHR5cGUgPT09ICdhcmVuYV9jb2luJyA/IFwi56ue5oqA5biB5LiN6LazXCIgOiBcIuasouS5kOixhuS4jei2s1wiO1xuICAgICAgICB0dGwuZm9udFNpemUgPSAyNjtcbiAgICAgICAgdHRsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIHRpdGxlVGV4dC5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMTUwLCAxMDApO1xuICAgICAgICB0aXRsZVRleHQucGFyZW50ID0gZGlhbG9nO1xuICAgICAgICBcbiAgICAgICAgLy8g6K+05piO5paH5a2XXG4gICAgICAgIHZhciBkZXNjVGV4dCA9IG5ldyBjYy5Ob2RlKFwiRGVzY1wiKTtcbiAgICAgICAgZGVzY1RleHQuc2V0UG9zaXRpb24oMCwgZGlhbG9nSGVpZ2h0LzIgLSA5MCk7XG4gICAgICAgIGRlc2NUZXh0LmFuY2hvclggPSAwLjU7XG4gICAgICAgIGRlc2NUZXh0LmFuY2hvclkgPSAwLjU7XG4gICAgICAgIHZhciBkbCA9IGRlc2NUZXh0LmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGRsLnN0cmluZyA9IFwi6KeC55yL5r+A5Yqx6KeG6aKR6aKG5Y+WXCIgKyB0aGlzLl9mb3JtYXRHb2xkKG5lZWRlZEFtb3VudCkgKyAodHlwZSA9PT0gJ2FyZW5hX2NvaW4nID8gXCLnq57mioDluIFcIiA6IFwi5qyi5LmQ6LGGXCIpICsgXCLnu6fnu63muLjmiI9cIjtcbiAgICAgICAgZGwuZm9udFNpemUgPSAxNjtcbiAgICAgICAgZGwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgZGVzY1RleHQuY29sb3IgPSBjYy5jb2xvcigyMDAsIDE5MCwgMTcwKTtcbiAgICAgICAgZGVzY1RleHQucGFyZW50ID0gZGlhbG9nO1xuICAgICAgICBcbiAgICAgICAgLy8g5bm/5ZGK5Zu+5qCHL+aPkOekulxuICAgICAgICB2YXIgYWRJY29uID0gbmV3IGNjLk5vZGUoXCJBZEljb25cIik7XG4gICAgICAgIGFkSWNvbi5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgYWRJY29uLmFuY2hvclggPSAwLjU7XG4gICAgICAgIGFkSWNvbi5hbmNob3JZID0gMC41O1xuICAgICAgICB2YXIgYWlsID0gYWRJY29uLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGFpbC5zdHJpbmcgPSBcIvCfjqxcIjtcbiAgICAgICAgYWlsLmZvbnRTaXplID0gNDg7XG4gICAgICAgIGFkSWNvbi5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICAvLyDmjInpkq7ljLrln59cbiAgICAgICAgdmFyIGJ0blkgPSAtZGlhbG9nSGVpZ2h0LzIgKyA1NTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWPlua2iOaMiemSrlxuICAgICAgICB2YXIgY2FuY2VsQnRuID0gdGhpcy5fY3JlYXRlRGlhbG9nQnV0dG9uKFxuICAgICAgICAgICAgXCLlj5bmtohcIixcbiAgICAgICAgICAgIGNjLmNvbG9yKDgwLCA3NSwgOTUpLFxuICAgICAgICAgICAgLTgwLCBidG5ZLFxuICAgICAgICAgICAgMTIwLCA0OCxcbiAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGRpYWxvZy5kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIGNhbmNlbEJ0bi5wYXJlbnQgPSBkaWFsb2c7XG4gICAgICAgIFxuICAgICAgICAvLyDop4LnnIvpooblj5bmjInpkq5cbiAgICAgICAgdmFyIHdhdGNoQnRuID0gdGhpcy5fY3JlYXRlRGlhbG9nQnV0dG9uKFxuICAgICAgICAgICAgXCLop4LnnIvpooblj5ZcIixcbiAgICAgICAgICAgIGNjLmNvbG9yKDI1NSwgMTUyLCAwKSwgIC8vIOapmeiJslxuICAgICAgICAgICAgODAsIGJ0blksXG4gICAgICAgICAgICAxNDAsIDQ4LFxuICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fd2F0Y2hBZEFuZEdldFJld2FyZCh0eXBlLCBkaWFsb2cpO1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICB3YXRjaEJ0bi5wYXJlbnQgPSBkaWFsb2c7XG4gICAgfSxcbiAgICBcbiAgICAvLyDop4LnnIvlub/lkYrojrflj5blpZblirFcbiAgICBfd2F0Y2hBZEFuZEdldFJld2FyZDogZnVuY3Rpb24odHlwZSwgZGlhbG9nKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIC8vIOi/memHjOW6lOivpeiwg+eUqOW5v+WRilNES+aYvuekuua/gOWKseinhumikVxuICAgICAgICAvLyDnm67liY3mqKHmi5/op4LnnIvlrozmiJBcbiAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2VDZW50ZXIoXCLmraPlnKjliqDovb3lub/lkYouLi5cIik7XG4gICAgICAgIFxuICAgICAgICAvLyDmqKHmi5/lub/lkYrop4LnnIvlrozmiJBcbiAgICAgICAgdGhpcy5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIXdpbmRvdy5hcmVuYURhdGEpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZUNlbnRlcihcIuaVsOaNruacquWIneWni+WMllwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdpbmRvdy5hcmVuYURhdGEud2F0Y2hBZEZvclJld2FyZCh0eXBlLCBmdW5jdGlvbihlcnIsIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2VDZW50ZXIoXCLojrflj5blpZblirHlpLHotKU6IFwiICsgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZUNlbnRlcihcIuiOt+W+l+WlluWKse+8gVwiKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDlhbPpl63lvLnnqpdcbiAgICAgICAgICAgICAgICBpZiAoZGlhbG9nKSBkaWFsb2cuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOabtOaWsOi0p+W4geaYvuekulxuICAgICAgICAgICAgICAgIHNlbGYuX3VwZGF0ZUN1cnJlbmN5RGlzcGxheSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIDEuNSk7XG4gICAgfSxcbiAgICBcbiAgICAvLyDlnLrmma/plIDmr4Hml7bmuIXnkIbotYTmupBcbiAgICBvbkRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICBcbiAgICAgICAgLy8g5riF55CG5YCS6K6h5pe25a6a5pe25ZmoXG4gICAgICAgIGlmICh0aGlzLl9jb3VudGRvd25UaW1lcikge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLl9jb3VudGRvd25UaW1lcik7XG4gICAgICAgICAgICB0aGlzLl9jb3VudGRvd25UaW1lciA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOa4heeQhuernuaKgOWcuuWAkuiuoeaXtlxuICAgICAgICBpZiAod2luZG93LmFyZW5hRGF0YSAmJiB3aW5kb3cuYXJlbmFEYXRhLmNsZWFyQWxsQ291bnRkb3ducykge1xuICAgICAgICAgICAgd2luZG93LmFyZW5hRGF0YS5jbGVhckFsbENvdW50ZG93bnMoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5YGc5q2i5Zyo57q/54q25oCB55uR5rWL77yI5aSn5Y6F5Zy65pmv6ZyA6KaB5oyB57ut55uR5rWL77yM5omA5Lul5Y+q5pyJ5Zy65pmv6ZSA5q+B5pe25omN5YGc5q2i77yJXG4gICAgICAgIC8vIOazqOaEj++8mumAmuW4uOWkp+WOheWcuuaZr+S4jeS8mumUgOavge+8jOmZpOmdnuWIh+aNouWIsOa4uOaIj+WcuuaZr1xuICAgICAgICAvLyDlpoLmnpzpnIDopoHkv53mjIHnm5HmtYvvvIzlj6/ku6Xms6jph4rmjonkuIvpnaLov5nooYxcbiAgICAgICAgLy8gdGhpcy5fc3RvcE9ubGluZU1vbml0b3JpbmcoKTtcbiAgICB9LFxuXG4gICAgc3RhcnQgKCkge31cbn0pO1xuIl19