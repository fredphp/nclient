// 使用全局变量，不使用 require

// 脚本加载日志

// 获取默认帮助内容
var getDefaultHelpContent = function() {
    return "【游戏规则】\n\n" +
        "本游戏为经典斗地主扑克牌游戏，支持3人玩法。\n\n" +
        "【基本规则】\n" +
        "• 一副牌54张，一人17张，留3张做底牌\n" +
        "• 叫地主：玩家可选择叫地主或不叫，叫地主者获得3张底牌\n" +
        "• 出牌：地主先出牌，按逆时针顺序出牌\n" +
        "• 牌型：单张、对子、三张、三带一、三带二、顺子、连对、飞机、炸弹、王炸等\n\n" +
        "【牌型大小】\n" +
        "• 王炸 > 炸弹 > 其他牌型\n" +
        "• 同牌型按点数比较大小\n" +
        "• 大王 > 小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3\n\n" +
        "【获胜条件】\n" +
        "• 地主：先出完所有牌即获胜\n" +
        "• 农民：任一农民先出完牌，农民方获胜\n\n" +
        "【货币说明】\n" +
        "• 欢乐豆：普通场游戏货币，用于报名参赛\n" +
        "• 竞技币：竞技场专用货币，参与锦标赛使用\n\n" +
        "【联系客服】\n" +
        "如有问题，请联系客服处理。";
};

cc.Class({
    extends: cc.Component,

    properties: {
        nickname_label: cc.Label,
        headimage: cc.Sprite,
        gobal_count: cc.Label,
        // 竞技币显示Label（可选，如果场景中没有则动态创建）
        arena_coin_label: cc.Label,
        creatroom_prefabs: cc.Prefab,
        joinroom_prefabs: cc.Prefab,
        user_agreement_prefabs: cc.Prefab,
    },

    onLoad () {
        
        if (!window.myglobal) {
            console.warn("myglobal 未定义，等待初始化...");
            this._waitForMyglobal();
            return;
        }
        
        this._initWithPlayerData();
    },
    
    // 加载图片旋转动画
    update: function(dt) {
        // _showMessageCenter 的加载图片旋转
        if (this._loadingImageAnimating && this._loadingImageNode && this._loadingImageNode.isValid) {
            this._loadingImageNode.angle += dt * 180;
        }
        // _showQuickEnterAnimation 的加载图片旋转
        if (this._quickEnterAnimating && this._quickEnterLoadingNode && this._quickEnterLoadingNode.isValid) {
            this._quickEnterLoadingNode.angle += dt * 180;
        }
        // 🔧【新增】WebSocket连接Loading的旋转动画
        if (this._wsLoadingAnimating && this._wsLoadingSpriteNode && this._wsLoadingSpriteNode.isValid) {
            this._wsLoadingSpriteNode.angle += dt * 180;
        }
    },
    
    _waitForMyglobal: function() {
        var self = this;
        var attempts = 0;
        var maxAttempts = 20;
        
        var check = function() {
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
    
    _initWithPlayerData: function() {
        var myglobal = window.myglobal;
        
        if (!myglobal || !myglobal.playerData) {
            console.error("myglobal 或 playerData 未定义");
            cc.director.loadScene("loginScene");
            return;
        }
        
        // 🔧【关键修复】重置竞技场相关标志，防止重复处理
        this._arenaRoomJoinedProcessed = false;
        this._arenaLoadingInProgress = false;
        this._enterGameSceneInProgress = false;
        
        var playerData = myglobal.playerData;
        
        if (!playerData.token) {
            cc.director.loadScene("loginScene");
            return;
        }
        
        var self = this;
        
        // 检查 verifyToken 是否存在
        if (typeof myglobal.verifyToken !== 'function') {
            console.warn("verifyToken 方法不存在，跳过验证");
            self._initUIAfterAuth();
            return;
        }
        
        try {
            myglobal.verifyToken(function(valid, message) {
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
    
    _initUIAfterAuth: function() {
        
        try {
            // ==================== 🔧【新增】WebSocket连接Loading界面 ====================
            // 检查WebSocket是否已连接，如果未连接则显示Loading界面
            this._checkAndShowWebSocketLoading();
            
            // ==================== 初始化用户设置（从本地存储加载）====================
            this._initUserSettings();
            
            var myglobal = window.myglobal;
            var playerData = myglobal ? myglobal.playerData : null;
            
            if (!playerData) {
                console.warn("playerData 为空，使用默认值");
                playerData = { nickName: "游客", gobal_count: 0, avatarUrl: null };
            }
            
            // 设置昵称
            // 优先使用属性关联的 Label，如果没有则通过节点名查找
            var nicknameLabel = this.nickname_label;
            
            // 如果属性关联的 Label 无效，尝试通过节点名查找
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
            }
            
            // 设置金币/欢乐豆显示
            // 默认显示欢乐豆，根据当前选中的房间类型切换显示
            this._currentRoomCategory = 1;  // 默认普通场
            this._updateCurrencyDisplay();
            
            this._adjustGoldElementsPosition();
            this._loadUserAvatar(playerData.avatarUrl);
            this.roomConfigs = [];
            
            // 初始化竞技币显示
            this._initArenaCoinDisplay();
            
            // 获取最新的玩家余额（金币和竞技币）
            this._refreshPlayerBalance();
            
            // 🔧【新增】监听竞技币更新事件（报名成功后刷新UI）
            this._listenArenaCoinUpdate();
            
            this._playHallBackgroundMusic();
            this._adjustBottomButtons();
            this._hideBackgroundCharacters();
            this._initWebSocket();  // 初始化 WebSocket 连接
            this._startOnlineMonitoring();  // 启动在线状态监测
            this._fetchRoomConfigs();
            this._removeNoticeBoard();
            // 注释掉：大厅不需要加入房间按钮，该功能在房间列表场景中使用
            // this._createEnterRoomButton();  // 创建加入房间按钮
            
            // 🚀【性能优化】预加载游戏场景
            this._preloadGameScene();
            
            // 初始化顶部按钮（设置、帮助等）
            this._initTopButtons();
            
        } catch (e) {
            console.error("_initUIAfterAuth 异常:", e);
        }
    },
    
    // 启动在线状态监测
    _startOnlineMonitoring: function() {
        var myglobal = window.myglobal;
        if (!myglobal) {
            console.warn("myglobal 未定义，无法启动在线监测");
            return;
        }
        
        
        // 启动全局在线监测
        if (myglobal.startOnlineMonitoring) {
            myglobal.startOnlineMonitoring();
        }
        
        // 监听在线状态变化
        var self = this;
        this._onlineStatusHandler = function(isOnline) {
            // 只有在非初始化状态下才显示离线提示
            if (!isOnline && !myglobal._isInitializing) {
                self._showOfflineMessage();
            } else if (!isOnline && myglobal._isInitializing) {
            }
        };
        
        if (myglobal.addOnlineStatusListener) {
            myglobal.addOnlineStatusListener(this._onlineStatusHandler);
        }
        
        // 监听强制下线事件
        if (myglobal.eventlister) {
            myglobal.eventlister.on("force_logout", function(data) {
                console.warn("🚫 收到强制下线事件:", data);
                self._handleForceLogout(data);
            });
        }
    },
    
    // 显示离线提示
    _showOfflineMessage: function() {
        // 🔧【修复】安全检查：如果节点已销毁，跳过显示
        if (!this.node || !this.node.isValid) {
            console.log("🏟️ [HallScene] 节点已销毁，跳过离线提示");
            return;
        }
        this._showMessage("网络连接已断开，正在重新连接...");
    },
    
    // 处理强制下线
    _handleForceLogout: function(data) {
        var reason = data.reason || "您已被强制下线";
        this._showMessage(reason);
        
        // 停止监测
        var myglobal = window.myglobal;
        if (myglobal && myglobal.stopOnlineMonitoring) {
            myglobal.stopOnlineMonitoring();
        }
        
        // 延迟跳转到登录页面
        this.scheduleOnce(function() {
            cc.director.loadScene("loginScene");
        }, 2);
    },
    
    // 停止在线状态监测
    _stopOnlineMonitoring: function() {
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
    _preloadGameScene: function() {
        var self = this;
        var startTime = Date.now();
        
        // 🔧【优化】预加载场景资源
        cc.director.preloadScene("gameScene", function(err) {
            if (err) {
                console.error("🚀 [预加载] 游戏场景预加载失败:", err);
                return;
            }
            var elapsed = Date.now() - startTime;
            // 🔧【新增】标记场景已预加载
            self._gameScenePreloaded = true;
        });
    },
    
    // ==================== 🔧【新增】WebSocket连接Loading界面 ====================
    
    /**
     * 检查WebSocket连接状态，如果未连接则显示Loading界面
     * 🔧【修复】只要物理连接已建立，就认为连接可用（服务端可能已发送过connected消息）
     */
    _checkAndShowWebSocketLoading: function() {
        var myglobal = window.myglobal;
        var socket = myglobal && myglobal.socket;
        
        // 检查WebSocket是否已连接
        var isWebSocketOpen = socket && socket.isWebSocketOpen && socket.isWebSocketOpen();
        var isConnected = socket && socket.isConnected && socket.isConnected();
        var isAuthenticated = socket && socket.isAuthenticated && socket.isAuthenticated();
        var hasConnectionToken = socket && socket.hasConnectionToken && socket.hasConnectionToken();
        
        console.log("🔌 [WebSocket] 检查连接状态: isWebSocketOpen=" + isWebSocketOpen + ", isConnected=" + isConnected + ", isAuthenticated=" + isAuthenticated + ", hasConnectionToken=" + hasConnectionToken);
        
        // 🔧【修复】只要物理连接已建立，就认为连接可用
        // 因为服务端可能已经发送过 connected 消息，但大厅场景还没来得及监听
        if (isWebSocketOpen) {
            console.log("🔌 [WebSocket] 物理连接已建立，跳过Loading界面");
            return;
        }
        
        // 物理连接未建立，显示Loading界面
        this._showWebSocketLoading();
        
        // 监听连接成功事件
        var self = this;
        // 🔧【修复】使用正确的事件监听器变量名（eventlister 小写 l）
        var evt = window.evt || (window.myglobal && window.myglobal.eventlister);
        if (evt) {
            // 使用一次性监听，连接成功后自动移除
            var connectionHandler = function(data) {
                console.log("🔌 [WebSocket] 连接成功，关闭Loading界面");
                self._hideWebSocketLoading();
                evt.off("connection_success", connectionHandler);
            };
            evt.on("connection_success", connectionHandler);
            
            // 🔧【优化】缩短超时时间，物理连接通常很快建立
            this._wsLoadingTimeout = setTimeout(function() {
                console.log("🔌 [WebSocket] 连接超时，关闭Loading界面");
                self._hideWebSocketLoading();
                evt.off("connection_success", connectionHandler);
            }, 5000);
        }
    },
    
    /**
     * 显示WebSocket连接Loading界面
     */
    _showWebSocketLoading: function() {
        if (this._wsLoadingNode && this._wsLoadingNode.isValid) {
            return; // 已经显示
        }
        
        console.log("🔌 [WebSocket] 显示Loading界面");
        
        var screenWidth = 1280;
        var screenHeight = 720;
        
        // 创建Loading容器节点
        var loadingNode = new cc.Node("WebSocketLoading");
        loadingNode.setPosition(0, 0);
        loadingNode.setContentSize(screenWidth, screenHeight);
        
        // 半透明遮罩背景
        var bgNode = new cc.Node("Background");
        bgNode.setContentSize(screenWidth, screenHeight);
        var bgGraphics = bgNode.addComponent(cc.Graphics);
        bgGraphics.fillColor = new cc.Color(0, 0, 0, 180);
        bgGraphics.rect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight);
        bgGraphics.fill();
        bgNode.parent = loadingNode;
        
        // Loading图片容器
        var containerNode = new cc.Node("Container");
        containerNode.setPosition(0, 0);
        containerNode.setContentSize(200, 200);
        
        // 加载并显示 loading_image.png
        cc.resources.load("UI/loading_image", cc.SpriteFrame, function(err, spriteFrame) {
            if (err) {
                console.error("🔌 [WebSocket] 加载loading_image失败:", err);
                return;
            }
            
            if (loadingNode && loadingNode.isValid && containerNode && containerNode.isValid) {
                var spriteNode = new cc.Node("LoadingSprite");
                var sprite = spriteNode.addComponent(cc.Sprite);
                sprite.spriteFrame = spriteFrame;
                spriteNode.setPosition(0, 0);
                spriteNode.parent = containerNode;
                
                // 设置初始角度，update中会旋转
                spriteNode.angle = 0;
                
                // 保存引用，用于update中旋转
                this._wsLoadingSpriteNode = spriteNode;
            }
        }.bind(this));
        
        // 提示文字
        var tipNode = new cc.Node("TipLabel");
        tipNode.setPosition(0, -120);
        var tipLabel = tipNode.addComponent(cc.Label);
        tipLabel.string = "正在连接服务器...";
        tipLabel.fontSize = 24;
        tipLabel.lineHeight = 30;
        tipLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        tipNode.color = new cc.Color(255, 255, 255);
        tipNode.parent = containerNode;
        
        containerNode.parent = loadingNode;
        
        // 添加到场景，设置最高层级
        this.node.addChild(loadingNode);
        loadingNode.zIndex = 9999;
        
        this._wsLoadingNode = loadingNode;
        this._wsLoadingAnimating = true;
    },
    
    /**
     * 隐藏WebSocket连接Loading界面
     */
    _hideWebSocketLoading: function() {
        // 清除超时定时器
        if (this._wsLoadingTimeout) {
            clearTimeout(this._wsLoadingTimeout);
            this._wsLoadingTimeout = null;
        }
        
        // 移除Loading节点
        if (this._wsLoadingNode && this._wsLoadingNode.isValid) {
            this._wsLoadingNode.destroy();
            this._wsLoadingNode = null;
        }
        
        this._wsLoadingAnimating = false;
        this._wsLoadingSpriteNode = null;
        
        console.log("🔌 [WebSocket] Loading界面已关闭");
    },
    
    // 初始化 WebSocket 连接
    _initWebSocket: function() {
        var myglobal = window.myglobal;
        if (!myglobal || !myglobal.socket) {
            console.warn("socket 未初始化");
            return;
        }
        
        // 🔧【修复】检查连接是否已认证（带Token且有PlayerID）
        // 不仅仅是检查物理连接，还要确保连接带有Token
        if (myglobal.socket.isAuthenticated && myglobal.socket.isAuthenticated()) {
            return;
        }
        
        // 检查是否需要重新连接（有Token但连接没有Token）
        var hasToken = myglobal.playerData && myglobal.playerData.token;
        if (hasToken && myglobal.socket.hasConnectionToken && !myglobal.socket.hasConnectionToken()) {
            console.log("🔌 [HallScene] 检测到连接无Token，需要重新连接...");
        }
        
        // 初始化 WebSocket
        if (myglobal.socket.initSocket) {
            myglobal.socket.initSocket();
        }
    },
    
    // 递归查找节点
    _findNodeByName: function(parentNode, nodeName) {
        // 先检查直接子节点
        var found = parentNode.getChildByName(nodeName);
        if (found) return found;
        
        // 递归查找
        var children = parentNode.children;
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            found = this._findNodeByName(child, nodeName);
            if (found) return found;
        }
        return null;
    },
    
    _hideBackgroundCharacters: function() {
        var xiongmao1 = this.node.getChildByName("xiongmao1");
        var xiongmao2 = this.node.getChildByName("xiongmao2");
        if (xiongmao1) xiongmao1.active = false;
        if (xiongmao2) xiongmao2.active = false;
    },
    
    // 调整底部按钮 - 调小并靠右排列
    _adjustBottomButtons: function() {
        var self = this;
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        
        // 底部按钮名称列表
        var buttonNames = [
            "btn_create_room",
            "btn_join_room", 
            "btn_user_agreement",
            "user_agreement",
            "btn_setting",
            "btn_help"
        ];
        
        // 收集存在的按钮
        var buttons = [];
        for (var i = 0; i < buttonNames.length; i++) {
            var btn = this.node.getChildByName(buttonNames[i]);
            if (btn && btn.active !== false) {
                buttons.push(btn);
            }
        }
        
        // 如果没找到，尝试查找其他可能的按钮
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
        }
        
        
        // 调整每个按钮
        var btnWidth = 120;   // 按钮宽度
        var btnHeight = 50;   // 按钮高度
        var btnGap = 15;      // 按钮间距
        var rightMargin = 30; // 右边距
        var bottomMargin = 30; // 底边距
        
        for (var i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            
            // 禁用 Widget 组件
            var widget = btn.getComponent(cc.Widget);
            if (widget) widget.enabled = false;
            
            // 缩小按钮
            btn.scale = 0.7;
            
            // 设置锚点
            btn.anchorX = 1;  // 右锚点
            btn.anchorY = 0;  // 底锚点
            
            // 计算位置 - 从右往左排列
            var xPos = screenWidth / 2 - rightMargin - i * (btnWidth * 0.7 + btnGap);
            var yPos = -screenHeight / 2 + bottomMargin;
            
            btn.x = xPos;
            btn.y = yPos;
            
        }
    },
    
    _loadUserAvatar: function(avatarUrl) {
        var self = this;
        if (!this.headimage) return;

        // 不再添加圆形遮罩，让头像正常显示
        // this._addCircleMaskToAvatar();

        if (!avatarUrl) {
            this._loadDefaultAvatar();
            return;
        }

        if (avatarUrl.indexOf('http://') === 0 || avatarUrl.indexOf('https://') === 0) {
            cc.assetManager.loadRemote(avatarUrl, { ext: '.png' }, function(err, texture) {
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
            cc.resources.load('UI/headimage/' + avatarUrl, cc.SpriteFrame, function(err, spriteFrame) {
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

    // 圆形遮罩方法已禁用，保留代码以备后用
    // _addCircleMaskToAvatar: function() { ... },

    _loadDefaultAvatar: function() {
        var self = this;
        cc.resources.load('UI/headimage/avatar_1', cc.SpriteFrame, function(err, spriteFrame) {
            if (!err && spriteFrame) {
                try {
                    self.headimage.spriteFrame = spriteFrame;
                } catch (e) {}
            }
        });
    },
    
    // ==================== 初始化用户设置（从本地存储加载）====================
    _initUserSettings: function() {
        // 默认设置
        var defaultSettings = {
            bgm: 1,
            sfx: 1,
            vibration: 1
        };
        
        // 从本地存储读取设置
        if (typeof StorageUtil !== 'undefined') {
            var savedSettings = StorageUtil.getItem(StorageUtil.KEYS.USER_SETTINGS, null, true);
            if (savedSettings && typeof savedSettings === 'object') {
                defaultSettings.bgm = savedSettings.bgm !== undefined ? savedSettings.bgm : 1;
                defaultSettings.sfx = savedSettings.sfx !== undefined ? savedSettings.sfx : 1;
                defaultSettings.vibration = savedSettings.vibration !== undefined ? savedSettings.vibration : 1;
            }
        }
        
        // 同步到全局变量
        window.isopen_sound = defaultSettings.bgm;
        window.isopen_sfx = defaultSettings.sfx;
        window.isopen_vibration = defaultSettings.vibration;
        
        console.log("[Settings] 初始化设置完成:", JSON.stringify(defaultSettings));
    },

    _playHallBackgroundMusic: function() {
        var isopen_sound = window.isopen_sound || 1;
        if (!isopen_sound) return;
        
        try {
            cc.audioEngine.stopMusic();
            cc.audioEngine.stopAllEffects();
            cc.resources.load("sound/login_bg", cc.AudioClip, function(err, clip) {
                if (!err && clip) {
                    try {
                        cc.audioEngine.playMusic(clip, true);
                    } catch(e) {}
                }
            });
        } catch(e) {}
    },
    
    _fetchRoomConfigs: function() {
        var self = this;
        var apiUrl = window.defines ? window.defines.apiUrl : '';
        var cryptoKey = window.defines ? window.defines.cryptoKey : '';
        
        // 如果没有配置 API，使用默认配置
        if (!apiUrl || !window.HttpAPI) {
            self._initRoomButtons(self._getDefaultRoomConfigs());
            return;
        }
        
        try {
            // 清除缓存
            if (HttpAPI._roomConfigCache) {
                HttpAPI._roomConfigCache = null;
            }
            try { localStorage.removeItem('room_config_cache'); } catch (e) {}
            
            // 请求 API
            HttpAPI.get(
                apiUrl + '/api/v1/room/config/list',
                cryptoKey,
                function(err, result) {
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
                    }
                    
                    // 🔧【调试】输出获取到的房间配置
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
                }
            );
        } catch (e) {
            console.error("_fetchRoomConfigs 异常:", e);
            self._initRoomButtons(self._getDefaultRoomConfigs());
        }
    },
    
    _getDefaultRoomConfigs: function() {
        return [
            { id: 1, room_name: "初级房", room_type: 2, base_score: 1, multiplier: 1, min_gold: 0, max_gold: 50000, description: "底分1", status: 1, sort_order: 0, room_category: 1 },
            { id: 2, room_name: "中级房", room_type: 3, base_score: 2, multiplier: 1, min_gold: 50000, max_gold: 200000, description: "底分2", status: 1, sort_order: 1, room_category: 1 },
            { id: 3, room_name: "高级房", room_type: 4, base_score: 5, multiplier: 2, min_gold: 200000, max_gold: 1000000, description: "底分5", status: 1, sort_order: 2, room_category: 2 },
            { id: 4, room_name: "娱乐房", room_type: 5, base_score: 10, multiplier: 3, min_gold: 1000000, max_gold: 5000000, description: "底分10", status: 1, sort_order: 3, room_category: 2 },
            { id: 5, room_name: "娱乐房", room_type: 6, base_score: 20, multiplier: 5, min_gold: 5000000, max_gold: 0, description: "底分20", status: 1, sort_order: 4, room_category: 2 }
        ];
    },
    
    _hideUnwantedButtons: function() {
        var createRoomBtn = this.node.getChildByName("btn_create_room");
        var joinRoomBtn = this.node.getChildByName("btn_join_room");
        if (createRoomBtn) createRoomBtn.active = false;
        if (joinRoomBtn) joinRoomBtn.active = false;
    },
    
    // ============================================================
    // 核心方法：初始化房间按钮
    // ============================================================
    _initRoomButtons: function(rooms) {
        var self = this;
        
        
        // 按钮名称映射
        var buttonNameMap = {
            2: "btn_room_junior",
            3: "btn_room_middle",
            4: "btn_room_senior",
            5: "btn_room_master",
            6: "btn_room_supreme"
        };
        
        // 先隐藏所有房间按钮
        for (var key in buttonNameMap) {
            var btnNode = this.node.getChildByName(buttonNameMap[key]);
            if (btnNode) btnNode.active = false;
        }
        
        // ============================================================
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
        }
        
        // 按 sort_order 升序排序
        allRooms.sort(function(a, b) { return a.sortOrder - b.sortOrder; });
        
        
        // 配置所有卡片
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
            }
            
            // 收集竞技场房间
            if (room.roomCategory === 2) {
                if (!self._arenaRooms) self._arenaRooms = [];
                self._arenaRooms.push(room);
            }
            
            (function(config, node, roomName, roomCategory) {
                node.off(cc.Node.EventType.TOUCH_END);
                node.on(cc.Node.EventType.TOUCH_END, function(event) {
                    event.stopPropagation();
                    // 竞技场房间：不再响应整个卡片的点击，由报名按钮处理
                    if (roomCategory === 2) {
                        return;
                    }
                    self._onRoomButtonClick(config);
                });
            })(room.config, room.node, room.roomName, room.roomCategory);
        }
        
        // 渲染布局 - 所有卡片排成一行
        this._renderRoomLayout(allRooms);
        
        // 为竞技场房间添加报名按钮
        this._addArenaSignupButtons();
        
        // 🔧【新增】先从服务端获取报名状态，再更新UI
        this._fetchSignupStatusAndUpdateUI();
    },
    
    // 🔧【新增】从服务端获取报名状态并更新UI
    _fetchSignupStatusAndUpdateUI: function() {
        var self = this;
        
        if (window.arenaData && window.arenaData.fetchSignupStatusFromServer) {
            window.arenaData.fetchSignupStatusFromServer(function(err, signedUpRooms) {
                if (err) {
                    console.warn("🏟️ 获取报名状态失败，使用本地缓存:", err);
                } else {
                }
                // 无论成功失败，都更新UI（使用本地缓存）
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
    _renderRoomLayout: function(allRooms) {
        var self = this;
        
        // 清理旧容器
        var oldPanel = this.node.getChildByName("CardContainer");
        var oldLeftPanel = this.node.getChildByName("LeftArea");
        var oldRightPanel = this.node.getChildByName("RightArea");
        if (oldPanel) oldPanel.destroy();
        if (oldLeftPanel) oldLeftPanel.destroy();
        if (oldRightPanel) oldRightPanel.destroy();
        
        if (allRooms.length === 0) {
            return;
        }
        
        // ============================================================
        // 参数设置
        // ============================================================
        var cardWidth = 180;       // 卡片宽度
        var cardHeight = 120;      // 卡片高度
        var gapX = 30;             // 卡片水平间距
        
        // 画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        
        // 计算容器宽度
        var totalCardsWidth = allRooms.length * cardWidth + (allRooms.length - 1) * gapX;
        var panelWidth = Math.max(totalCardsWidth + 40, screenWidth - 100);
        var panelHeight = cardHeight + 40;
        
        // 容器位置
        var verticalOffset = 20;   // 垂直偏移（下移）
        
        
        // ============================================================
        // 创建容器 - 所有卡片水平排成一行
        // ============================================================
        var cardPanel = new cc.Node("CardContainer");
        cardPanel.setContentSize(panelWidth, panelHeight);
        cardPanel.anchorX = 0.5;
        cardPanel.anchorY = 0.5;
        cardPanel.x = 0;  // 居中
        cardPanel.y = verticalOffset;
        cardPanel.parent = this.node;
        
        // 放置所有卡片 - 水平排列
        var startX = -totalCardsWidth / 2 + cardWidth / 2;
        for (var i = 0; i < allRooms.length; i++) {
            var room = allRooms[i];
            
            var widget = room.node.getComponent(cc.Widget);
            if (widget) widget.enabled = false;
            room.node.anchorX = 0.5;
            room.node.anchorY = 0.5;
            room.node.scale = 1;
            
            room.node.active = true;
            room.node.parent = cardPanel;
            
            // 卡片水平位置：从左到右排列
            room.node.x = startX + i * (cardWidth + gapX);
            // 卡片垂直位置：居中
            room.node.y = 0;
            
        }
        
    },
    
    // 添加区域标题
    _addAreaTitle: function(panel, titleText, x, y) {
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
    _prepareCardNodeResponsive: function(node, cardScale) {
        // 禁用 Widget 组件（防止自动拉伸）
        var widget = node.getComponent(cc.Widget);
        if (widget) {
            widget.enabled = false;
        }
        
        // 锚点设为中心
        node.anchorX = 0.5;
        node.anchorY = 0.5;
        
        // 应用缩放（不拉伸，保持比例）
        node.scale = cardScale || 1;
    },
    
    // 添加区域标题
    _addAreaTitle: function(panel, title, x, y) {
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
    },
    
    // 加载房间按钮背景图
    _loadRoomButtonBg: function(btnNode, roomType) {
        var self = this;
        var sprite = btnNode.getComponent(cc.Sprite);
        if (!sprite) return;
        
        cc.resources.load('UI/btn_happy_' + roomType, cc.SpriteFrame, function(err, spriteFrame) {
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
    },
    
    _loadDefaultRoomButtonBg: function(btnNode) {
        var sprite = btnNode.getComponent(cc.Sprite);
        if (!sprite) return;
        
        cc.resources.load('UI/btn_happy_2', cc.SpriteFrame, function(err, spriteFrame) {
            if (!err && spriteFrame) {
                try {
                    sprite.spriteFrame = spriteFrame;
                } catch (e) {}
            }
        });
    },
    
    // 更新最低豆子/竞技币显示（根据 room_category 判断）
    // room_category: 1-普通场(使用min_gold字段显示豆), 2-竞技场(使用min_arena_coin字段显示竞技币)
    _updateMinGoldLabel: function(btnNode, config) {
        var goldLabelNode = btnNode.getChildByName("min_gold_label");
        
        // 获取房间分类，默认为普通场(1)
        var roomCategory = config.room_category || config.roomCategory || 1;
        
        if (!goldLabelNode) {
            goldLabelNode = new cc.Node("min_gold_label");
            var label = goldLabelNode.addComponent(cc.Label);
            label.fontSize = 22;       // 字体大小
            label.lineHeight = 28;      // 行高
            label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            goldLabelNode.anchorX = 0.5;
            goldLabelNode.anchorY = 0.5;
            
            var outline = goldLabelNode.addComponent(cc.LabelOutline);
            outline.color = cc.color(0, 0, 0);
            outline.width = 2;
            
            // 设置更高的 zIndex 确保显示在最上层
            goldLabelNode.zIndex = 100;
            
            goldLabelNode.parent = btnNode;
        }
        
        var label = goldLabelNode.getComponent(cc.Label);
        
        // 根据房间类型获取不同的字段值
        // room_category: 1-普通场(使用min_gold), 2-竞技场(使用min_arena_coin)
        var minValue;
        var currencyName;
        
        if (roomCategory === 2) {
            // 竞技场 - 使用 min_arena_coin 字段
            minValue = config.min_arena_coin || config.minArenaCoin || 0;
            currencyName = "币";
            goldLabelNode.color = cc.color(255, 255, 255);    // 竞技场：白色
            // 竞技场：不显示"最低"
            label.string = this._formatGold(minValue) + " " + currencyName;
        } else {
            // 普通场 - 使用 min_gold 字段
            minValue = config.min_gold || config.minGold || 0;
            currencyName = "豆";
            goldLabelNode.color = cc.color(255, 255, 255);    // 普通场：白色
            // 普通场：保留"最低"
            label.string = "最低 " + this._formatGold(minValue) + " " + currencyName;
        }
        
        // 修正位置：按钮图片底部有豆子图标在左侧，文字应显示在图标右侧
        // 按钮高度 375px，底部蓝色渐变条约占 1/4（约在75%-100%位置）
        // 图标在底部左侧约10%-20%宽度位置，文字应偏右显示
        var btnHeight = btnNode.height || 375;
        // Y坐标：从底部边缘向上约16%的位置（在渐变条内）
        var yOffset = -btnHeight/2 + btnHeight * 0.16;
        // X坐标：居中显示
        var xOffset = 0;  // 居中
        goldLabelNode.setPosition(xOffset, yOffset);
    },
    
    // 房间按钮点击处理 - 根据房间类型区分处理
    // room_category: 1-普通场(欢乐豆), 2-竞技场(竞技币)
    _onRoomButtonClick: function(roomConfig) {
        var self = this;
        var myglobal = window.myglobal;
        var roomCategory = roomConfig.room_category || roomConfig.roomCategory || 1;
        
        // 更新货币显示
        this._currentRoomCategory = roomCategory;
        this._updateCurrencyDisplay();
        
        // 根据房间类型处理
        if (roomCategory === 2) {
            // 竞技场房间 - 显示报名弹窗
            this._onArenaRoomButtonClick(roomConfig);
        } else {
            // 普通场房间 - 原有逻辑
            this._onNormalRoomButtonClick(roomConfig);
        }
    },
    
    // 普通场房间按钮点击处理
    _onNormalRoomButtonClick: function(roomConfig) {
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
        }
        
        // 保存当前房间配置
        if (myglobal) {
            myglobal.currentRoomConfig = roomConfig;
            myglobal.currentRoomLevel = roomConfig.room_type;
            myglobal.currentRoomName = roomConfig.room_name;
        }
        
        // 直接快速匹配进入游戏
        this._quickMatch(roomConfig, playerGold);
    },
    
    // 竞技场房间按钮点击处理 - 直接报名（不弹框）
    _onArenaRoomButtonClick: function(roomConfig, btnNode) {
        var self = this;
        var myglobal = window.myglobal;
        
        // 检查是否已报名
        var roomId = roomConfig.id;
        if (window.arenaData && window.arenaData.isSignedUp(roomId)) {
            // 已报名，不做处理
            this._showMessage("您已报名此竞技场");
            return;
        }
        
        // 检查是否已报名其他竞技场（初级、中级、高级场只能报一个）
        if (window.arenaData && this._hasSignedUpOtherArena(roomId)) {
            this._showMessage("您已报名其他竞技场，每场只能报名一个级别");
            return;
        }
        
        // 🔧【修复】不使用本地缓存的竞技币余额判断，直接调用服务端报名API
        // 原因：后台添加竞技币后，客户端本地缓存的值没有更新，会导致误判
        // 服务端会检查竞技币余额并返回详细错误信息
        
        // 直接执行报名
        this._doArenaSignup(roomConfig, btnNode);
    },
    
    // 检查是否已报名其他竞技场（初级、中级、高级场只能报一个）
    _hasSignedUpOtherArena: function(currentRoomId) {
        if (!window.arenaData || !this._arenaRooms) return false;
        
        for (var i = 0; i < this._arenaRooms.length; i++) {
            var room = this._arenaRooms[i];
            var roomId = room.config.id;
            if (roomId !== currentRoomId && window.arenaData.isSignedUp(roomId)) {
                return true;
            }
        }
        return false;
    },
    
    // 直接执行竞技场报名（不弹框）
    _doArenaSignup: function(roomConfig, btnNode) {
        var self = this;
        
        // 显示加载中
        this._showMessage("正在报名...");
        
        // 调用报名API
        if (window.arenaData) {
            window.arenaData.signup(roomConfig.id, function(err, result) {
                if (err) {
                    self._showMessage(err || "报名失败");
                    return;
                }
                
                // 报名成功
                self._showMessage("报名成功！");
                
                // 刷新玩家余额
                if (window.arenaData.refreshBalance) {
                    window.arenaData.refreshBalance();
                }
                
                // 更新UI
                self._updateArenaSignupStatus();
            });
        }
    },
    
    // 为竞技场房间添加报名按钮（使用图片资源）
    // 报名按钮放在房间卡片的外部下方，紧贴卡片底部
    _addArenaSignupButtons: function() {
        var self = this;
        if (!this._arenaRooms) return;
        
        // 获取卡片容器
        var cardPanel = this.node.getChildByName("CardContainer");
        if (!cardPanel) {
            console.warn("CardContainer not found");
            return;
        }
        
        // 清理旧的报名按钮和倒计时显示
        var oldButtons = cardPanel.getChildByName("ArenaSignupButtons");
        if (oldButtons) oldButtons.destroy();
        var oldTimers = cardPanel.getChildByName("ArenaCountdowns");
        if (oldTimers) oldTimers.destroy();
        
        // 创建报名按钮容器
        var buttonContainer = new cc.Node("ArenaSignupButtons");
        buttonContainer.parent = cardPanel;
        
        // 创建倒计时显示容器
        var countdownContainer = new cc.Node("ArenaCountdowns");
        countdownContainer.parent = cardPanel;
        
        for (var i = 0; i < this._arenaRooms.length; i++) {
            var room = this._arenaRooms[i];
            var btnNode = room.node;
            var config = room.config;
            
            // ============================================================
            // 【重构】创建竞技场状态项 - 单一背景结构
            // 结构: RoomStatusItem > [Bg, TitleLabel, DescLabel]
            // ============================================================
            
            // 状态栏尺寸（用户指定）
            var statusBarHeight = 72;      // 状态栏总高度
            var itemWidth = 180;           // 每个状态项宽度
            var itemHeight = 54;           // 每个状态项高度
            var itemGap = 12;              // 间距
            var leftRightMargin = 24;      // 左右留白
            
            // 背景尺寸 - 文字框宽度只适配文字内容+适当内边距
            // "报名截止 HH:MM" 约12个字符(16px字体)约96px，加上左右内边距
            var bgWidth = 160;                   // 宽度: 160px，适配文字显示
            var bgHeight = 72;                   // 高度: 72（两行文字需要更高）
            var bgRadius = 5;                    // 圆角: 5
            var bgColor = cc.color(255, 180, 100, 140);  // 颜色: 淡橘色, 更透明(alpha=140)
            
            // 创建状态项容器（RoomStatusItem）
            var roomStatusItem = new cc.Node("RoomStatusItem_" + config.id);
            roomStatusItem.setContentSize(cc.size(btnNode.width, bgHeight));
            roomStatusItem.anchorX = 0.5;
            roomStatusItem.anchorY = 0.5;
            
            // 位置：相对于房间卡片居中对齐，显示在卡片顶部
            roomStatusItem.x = btnNode.x;  // 水平居中
            roomStatusItem.y = btnNode.y + btnNode.height / 2 - bgHeight / 2 + 10;  // 垂直位置：卡片顶部
            
            // 存储配置引用
            roomStatusItem.roomConfig = config;
            roomStatusItem.cardNode = btnNode;
            
            // ========== 1. 绘制唯一背景（Bg）==========
            // 删除了: OuterBg, InnerBg, CapsuleBg - 只保留一个Bg
            var bgNode = new cc.Node("Bg");
            var bgGraphics = bgNode.addComponent(cc.Graphics);
            bgGraphics.fillColor = bgColor;
            bgGraphics.roundRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, bgRadius);
            bgGraphics.fill();
            bgNode.parent = roomStatusItem;
            
            // ========== 2. 第一行文字：期号（PeriodLabel）==========
            var periodLabel = new cc.Node("PeriodLabel");
            var periodLabelComp = periodLabel.addComponent(cc.Label);
            periodLabelComp.string = "期号: --";
            periodLabelComp.fontSize = 16;
            periodLabelComp.lineHeight = 20;
            periodLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            periodLabelComp.verticalAlign = cc.Label.VerticalAlign.CENTER;
            periodLabelComp.enableBold = true;  // 加粗
            periodLabel.color = cc.color(255, 255, 255);  // 白色
            periodLabel.anchorX = 0.5;
            periodLabel.anchorY = 0.5;
            periodLabel.y = 14;  // 上方位置（增加间距）
            periodLabel.parent = roomStatusItem;
            
            // 描边: #8A4200, 宽度2
            var periodOutline = periodLabel.addComponent(cc.LabelOutline);
            periodOutline.color = cc.color(138, 66, 0);  // #8A4200
            periodOutline.width = 2;
            
            // ========== 3. 第二行文字：报名截止时间（TitleLabel）==========
            var titleLabel = new cc.Node("TitleLabel");
            var titleLabelComp = titleLabel.addComponent(cc.Label);
            titleLabelComp.string = "暂未开放";
            titleLabelComp.fontSize = 16;
            titleLabelComp.lineHeight = 20;
            titleLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            titleLabelComp.verticalAlign = cc.Label.VerticalAlign.CENTER;
            titleLabelComp.enableBold = true;  // 加粗
            titleLabel.color = cc.color(255, 255, 255);  // 白色
            titleLabel.anchorX = 0.5;
            titleLabel.anchorY = 0.5;
            titleLabel.y = -14;  // 下方位置（增加间距）
            titleLabel.parent = roomStatusItem;
            
            // 描边: #8A4200, 宽度2
            var titleOutline = titleLabel.addComponent(cc.LabelOutline);
            titleOutline.color = cc.color(138, 66, 0);  // #8A4200
            titleOutline.width = 2;
            
            roomStatusItem.parent = countdownContainer;
            
            // ============================================================
            // 创建报名按钮
            // ============================================================
            var signupBtn = new cc.Node("SignupBtn_" + config.id);

            // 添加 Sprite 组件用于显示按钮图片
            var sprite = signupBtn.addComponent(cc.Sprite);
            sprite.type = cc.Sprite.Type.SIMPLE;
            sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

            // 按钮尺寸：160x65
            var fixedWidth = 160;   // 宽度
            var fixedHeight = 65;   // 高度
            signupBtn.setContentSize(cc.size(fixedWidth, fixedHeight));
            signupBtn.anchorX = 0.5;
            signupBtn.anchorY = 0.5;

            // 位置：按钮在卡片底部，向下移动
            signupBtn.x = btnNode.x;
            signupBtn.y = btnNode.y - btnNode.height / 2 + fixedHeight / 2 - 10;  // 向下移动10px
            
            // 存储配置信息和卡片节点引用
            signupBtn.roomConfig = config;
            signupBtn.roomId = config.id;
            signupBtn.cardNode = btnNode;
            
            // 添加按钮组件
            var button = signupBtn.addComponent(cc.Button);
            button.transition = cc.Button.Transition.SCALE;
            button.duration = 0.1;
            button.zoomScale = 1.08;
            
            // 点击事件
            (function(config, cardNode, signupBtnNode) {
                signupBtnNode.on(cc.Node.EventType.TOUCH_END, function(event) {
                    event.stopPropagation();
                    self._onArenaSignupButtonClick(config, cardNode, signupBtnNode);
                });
            })(config, btnNode, signupBtn);
            
            signupBtn.parent = buttonContainer;
        }
        
        // 扩展容器高度以容纳按钮
        var originalHeight = cardPanel.height;
        cardPanel.setContentSize(cardPanel.width, originalHeight + 70);
        
        // 加载按钮图片并更新状态
        this._loadSignupButtonImages();
        
        // 启动倒计时更新定时器
        this._startCountdownTimer();
    },
    
    // 加载报名按钮图片资源
    _loadSignupButtonImages: function() {
        var self = this;
        
        // 预加载三张按钮图片
        var imagePaths = [
            'UI/button/btn_baoming',
            'UI/button/btn_quxiaobaoming', 
            'UI/button/btn_no_baoming'
        ];
        
        this._signupBtnFrames = {};
        var loadedCount = 0;
        
        for (var i = 0; i < imagePaths.length; i++) {
            (function(index) {
                cc.resources.load(imagePaths[index], cc.SpriteFrame, function(err, spriteFrame) {
                    if (!err && spriteFrame) {
                        var key = imagePaths[index].split('/').pop();
                        self._signupBtnFrames[key] = spriteFrame;
                    }
                    loadedCount++;
                    // 所有图片加载完成后更新按钮状态
                    if (loadedCount === imagePaths.length) {
                        self._updateArenaSignupStatus();
                    }
                });
            })(i);
        }
    },
    
    // 检查当前是否在开赛时间段内
    _isInMatchTime: function(config) {
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
    },
    
    // ============================================================
    // 开赛时间计算相关函数
    // ============================================================
    
    // 检查竞技场是否可以报名（必须有开赛时间且有每场时长）
    _canSignupArena: function(config) {
        var matchTimeRanges = config.match_time_ranges || config.matchTimeRanges;
        var matchDuration = config.match_duration || config.matchDuration || config.interval_minutes || config.intervalMinutes;

        // 必须同时有开赛时间和每场时长才能报名
        if (!matchTimeRanges || !matchDuration) {
            return false;
        }

        // 检查是否在开赛时间段内
        var result = this._isInMatchTime(config);
        return result;
    },

    // 计算下一个报名截止时间
    // 返回格式: "HH:MM" 或 null（如果不在开赛时间段内）
    _getNextSignupDeadline: function(config) {
        var matchTimeRanges = config.match_time_ranges || config.matchTimeRanges;
        var matchDuration = config.match_duration || config.matchDuration || config.interval_minutes || config.intervalMinutes;

        // 必须有配置
        if (!matchTimeRanges || !matchDuration) return null;

        // 检查是否在开赛时间段内
        if (!this._isInMatchTime(config)) return null;

        try {
            var ranges = typeof matchTimeRanges === 'string' ? JSON.parse(matchTimeRanges) : matchTimeRanges;
            if (!ranges || ranges.length === 0) return null;

            var now = new Date();
            var currentMinutes = now.getHours() * 60 + now.getMinutes();

            // 找到当前所在的时间段
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

            if (!currentRange) return null;

            // 计算下一场比赛时间（从开赛时间开始，每隔 matchDuration 分钟一场）
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
            }

            // 报名截止时间是比赛开始前1分钟
            var deadlineMinutes = nextMatchMinutes - 1;

            // 格式化时间
            var hours = Math.floor(deadlineMinutes / 60) % 24;
            var mins = deadlineMinutes % 60;
            var timeStr = (hours < 10 ? '0' : '') + hours + ':' + (mins < 10 ? '0' : '') + mins;
            return timeStr;

        } catch (e) {
            console.error("⏰ [_getNextSignupDeadline] error:", e);
            return null;
        }
    },
    
    // 计算距离报名截止的秒数（用于倒计时显示）
    // 返回: 秒数，-1表示不可报名
    _getSignupCountdownSeconds: function(config) {
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
            var currentTotalSeconds = currentMinutes * 60 + currentSeconds;

            // 找到当前所在的时间段
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

            if (!currentRange) return -1;

            // 计算下一场比赛时间
            var rangeStartSeconds = rangeStartMinutes * 60;
            var matchDurationSeconds = matchDuration * 60;
            var currentTotalSeconds = currentMinutes * 60 + currentSeconds;

            // 计算从开赛时间到现在经过的秒数
            var elapsedSeconds = currentTotalSeconds - rangeStartSeconds;
            var remainder = elapsedSeconds % matchDurationSeconds;
            
            // 倒计时 = 本期剩余时间（与服务端一致，不减60秒）
            var countdown = matchDurationSeconds - remainder;
            
            // 返回倒计时
            return countdown;

        } catch (e) {
            console.error("⏰ [_getSignupCountdownSeconds] error:", e);
            return -1;
        }
    },
    
    // 获取最近的 upcoming 开赛时间段（用于显示）
    _getNearestMatchTimeRange: function(config) {
        var matchTimeRanges = config.match_time_ranges || config.matchTimeRanges;
        
        // 没有配置时间段，返回null表示全天开放
        if (!matchTimeRanges) {
            return null;
        }
        
        try {
            var ranges = typeof matchTimeRanges === 'string' ? JSON.parse(matchTimeRanges) : matchTimeRanges;
            if (!ranges || ranges.length === 0) return null;
            
            var now = new Date();
            var currentMinutes = now.getHours() * 60 + now.getMinutes();
            var currentSeconds = now.getSeconds();
            
            // 解析所有时间段
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
            }
            
            // 检查当前是否在某个时间段内
            for (var i = 0; i < parsedRanges.length; i++) {
                var r = parsedRanges[i];
                if (currentMinutes >= r.startMinutes && currentMinutes <= r.endMinutes) {
                    return {
                        inRange: true,
                        range: r
                    };
                }
            }
            
            // 不在任何时间段内，找最近的下一个时间段
            var nearestRange = null;
            var minDiff = Infinity;
            
            for (var i = 0; i < parsedRanges.length; i++) {
                var r = parsedRanges[i];
                // 计算距离这个时间段开始的分钟数
                var diff;
                if (r.startMinutes > currentMinutes) {
                    // 今天还没到
                    diff = r.startMinutes - currentMinutes;
                } else {
                    // 需要等到明天
                    diff = (24 * 60 - currentMinutes) + r.startMinutes;
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
    },
    
    // 计算距离下一场开赛的倒计时（秒）
    _getNextMatchCountdown: function(config) {
        var matchTimeRanges = config.match_time_ranges || config.matchTimeRanges;
        var matchDuration = config.match_duration || config.matchDuration || config.interval_minutes || config.intervalMinutes || 10; // 默认10分钟
        
        var now = new Date();
        var currentMinutes = now.getHours() * 60 + now.getMinutes();
        var currentSeconds = now.getSeconds();
        var currentTotalSeconds = currentMinutes * 60 + currentSeconds;
        
        // 没有配置开赛时间，每 matchDuration 分钟开赛一次
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
        }
        
        // 有配置开赛时间
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
            }
            
            // 检查当前是否在某个开赛时间段内
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
            }
            
            // 不在任何开赛时间段内
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
    },
    
    // 格式化倒计时显示（秒转换为 MM:SS 格式）
    _formatCountdown: function(totalSeconds) {
        var minutes = Math.floor(totalSeconds / 60);
        var seconds = Math.floor(totalSeconds % 60);
        return (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    },
    
    // 格式化开赛时间段显示
    _formatMatchTimeRange: function(range) {
        if (!range) return '';
        return range.start + '-' + range.end;
    },
    
    // 获取当前期号
    // 期号格式：根据开赛时间和每场时长动态生成
    // 每个房间有独立的期号序列
    _getCurrentPeriodNo: function(config) {
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
            var currentTotalSeconds = currentMinutes * 60 + currentSeconds;

            // 找到当前所在的时间段
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

            if (!currentRange) return 0;

            // 计算从开赛时间到现在经过的秒数（与服务端一致）
            var rangeStartSeconds = rangeStartMinutes * 60;
            var elapsedSeconds = currentTotalSeconds - rangeStartSeconds;
            var matchDurationSeconds = matchDuration * 60;

            // 计算当前是第几期（从1开始，与服务端一致）
            var periodNo = Math.floor(elapsedSeconds / matchDurationSeconds) + 1;

            return periodNo;
        } catch (e) {
            return 0;
        }
    },
    
    // 竞技场报名按钮点击处理
    _onArenaSignupButtonClick: function(roomConfig, btnNode, signupBtnNode) {
        var self = this;
        var myglobal = window.myglobal;
        var playerArenaCoin = myglobal && myglobal.playerData ? myglobal.playerData.arena_coin : 0;
        var roomId = roomConfig.id;
        
        // 检查是否已报名
        if (window.arenaData && window.arenaData.isSignedUp(roomId)) {
            // 已报名，执行取消报名
            this._doCancelSignup(roomConfig, btnNode, signupBtnNode);
            return;
        }
        
        // 检查是否可以报名（有开赛时间且有每场时长）
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
        }
        
        // 检查是否已报名其他竞技场
        if (this._hasSignedUpOtherArena(roomId)) {
            this._showMessage("您已报名其他竞技场，每场只能报名一个级别");
            return;
        }
        
        // 获取报名费
        var signupFee = roomConfig.min_arena_coin || roomConfig.minArenaCoin || 0;
        
        // 检查竞技币是否足够
        if (playerArenaCoin < signupFee) {
            this._showMessage("竞技币不足，需要 " + signupFee + " 竞技币");
            return;
        }
        
        // 执行报名
        this._doArenaSignup(roomConfig, btnNode, signupBtnNode);
    },
    
    // 执行取消报名
    _doCancelSignup: function(roomConfig, btnNode, signupBtnNode) {
        var self = this;
        
        this._showMessage("正在取消报名...");
        
        if (window.arenaData) {
            window.arenaData.cancelSignup(roomConfig.id, function(err, result) {
                if (err) {
                    self._showMessage(err || "取消报名失败");
                    return;
                }
                
                self._showMessage("取消报名成功，竞技币已返还");
                
                // 刷新玩家余额
                if (window.arenaData.refreshBalance) {
                    window.arenaData.refreshBalance();
                }
                
                // 更新UI
                self._updateArenaSignupStatus();
            });
        }
    },
    
    // 启动倒计时更新定时器
    // 🔧【重构】客户端基于服务端推送的倒计时本地计算
    _startCountdownTimer: function() {
        var self = this;
        
        console.log("🏟️ [Arena] ========== 开始初始化竞技场监听器 ==========");
        console.log("🏟️ [Arena] _startCountdownTimer 被调用");

        // 清理旧的定时器
        if (this._countdownTimer) {
            clearInterval(this._countdownTimer);
        }

        // 🔧【新增】初始化本地倒计时状态缓存
        // 格式: { roomId: { periodNo, countdown, canSignup, lastUpdate } }
        this._localArenaStatus = {};

        // 🔧【修复】将 socket 变量定义移到外面，确保整个函数可用
        var socket = window.myglobal && window.myglobal.socket;
        console.log("🏟️ [Arena] socket 对象:", socket ? "存在" : "不存在");
        console.log("🏟️ [Arena] socket.onArenaStatus:", socket && socket.onArenaStatus ? "存在" : "不存在");
        console.log("🏟️ [Arena] socket.onArenaMatchStart:", socket && socket.onArenaMatchStart ? "存在" : "不存在");
        console.log("🏟️ [Arena] socket.onArenaCloseDialog:", socket && socket.onArenaCloseDialog ? "存在" : "不存在");

        // 🔧【关键修复】防止重复注册监听器
        // 如果已经注册过监听器，跳过注册
        if (this._arenaSocketListenersRegistered) {
            console.log("🏟️ [Arena] ⚠️ 监听器已注册，跳过重复注册");
        } else {
            if (socket && socket.onArenaStatus) {
                socket.onArenaStatus(function(data) {
                    if (self.node && self.node.isValid && data && data.arenas) {
                        // 🔧【修改】收到服务端推送时，保存到本地状态
                        self._onArenaStatusPush(data.arenas);
                    }
                });
                console.log("🏟️ [Arena] ✅ onArenaStatus 监听器注册成功");
            } else {
                console.warn("🏟️ [Arena] socket 或 onArenaStatus 方法不可用，无法监听竞技场状态");
            }

            // 🔧【新增】监听竞技场比赛开始通知
            if (socket && socket.onArenaMatchStart) {
                socket.onArenaMatchStart(function(data) {
                    console.log("🏆 [Arena] ========== 收到 arena_match_start 消息 ==========");
                    console.log("🏆 [Arena] 数据:", JSON.stringify(data));
                    if (self.node && self.node.isValid) {
                        console.log("🏆 [Arena] 节点有效，准备显示弹窗");
                        self._onArenaMatchStart(data);
                    } else {
                        console.warn("🏆 [Arena] 节点无效，无法显示弹窗");
                    }
                });
                console.log("🏟️ [Arena] ✅ onArenaMatchStart 监听器注册成功");
            } else {
                console.warn("🏟️ [Arena] ⚠️ socket 或 onArenaMatchStart 方法不可用");
            }

            // 🔧【新增】监听竞技场关闭弹窗通知（新期号开始时关闭上一轮弹窗）
            if (socket && socket.onArenaCloseDialog) {
                socket.onArenaCloseDialog(function(data) {
                    console.log("🏟️ [Arena] 收到关闭弹窗通知:", JSON.stringify(data));
                    if (self.node && self.node.isValid) {
                        self._onArenaCloseDialog(data);
                    }
                });
                console.log("🏟️ [Arena] ✅ onArenaCloseDialog 监听器注册成功");
            } else {
                console.warn("🏟️ [Arena] ⚠️ socket 或 onArenaCloseDialog 方法不可用");
            }

            // 🏆 监听冠军跑马灯广播
            if (socket && socket.onArenaChampionBroadcast) {
                socket.onArenaChampionBroadcast(function(data) {
                    console.log("🏆 [Arena] 收到冠军跑马灯广播:", JSON.stringify(data));
                    if (self.node && self.node.isValid) {
                        self._showChampionBroadcast(data);
                    }
                });
                console.log("🏆 [Arena] ✅ onArenaChampionBroadcast 监听器注册成功");
            } else {
                console.warn("🏆 [Arena] ⚠️ socket 或 onArenaChampionBroadcast 方法不可用");
            }
            
            // 🔧【关键修复】在大厅场景也监听 room_joined 消息
            // 这样即使玩家没有点击"进入"按钮，弹窗倒计时结束后也能进入游戏
            if (socket && socket.onRoomJoined) {
                this._hallSceneRoomJoinedHandler = function(roomData) {
                    console.log("🏟️ [HallScene] ✅ 收到 room_joined 消息:", JSON.stringify(roomData));
                    
                    // 检查是否是竞技场房间
                    var roomCategory = roomData.room_category || 1;
                    if (roomCategory !== 2) {
                        console.log("🏟️ [HallScene] 不是竞技场房间，忽略");
                        return;
                    }
                    
                    // 🔧【关键】防止重复处理
                    if (self._arenaRoomJoinedProcessed) {
                        console.log("🏟️ [HallScene] room_joined 已处理过，跳过");
                        return;
                    }
                    self._arenaRoomJoinedProcessed = true;
                    
                    // 关闭弹窗（如果存在）
                    if (self._arenaMatchStartDialog && self._arenaMatchStartDialog.isValid) {
                        self._arenaMatchStartDialog.destroy();
                        self._arenaMatchStartDialog = null;
                    }
                    
                    // 进入游戏场景
                    console.log("🏟️ [HallScene] 从 room_joined 进入游戏场景");
                    self._enterArenaGameSceneFromRoomJoined(roomData);
                };
                socket.onRoomJoined(this._hallSceneRoomJoinedHandler);
                console.log("🏟️ [Arena] ✅ room_joined 监听器已注册（大厅场景）");
            } else {
                console.warn("🏟️ [Arena] ⚠️ socket 或 onRoomJoined 方法不可用");
            }
            
            // 标记已注册
            this._arenaSocketListenersRegistered = true;
            console.log("🏟️ [Arena] ========== 竞技场监听器注册完成 ==========");
        }

        // 🔧【关键修复】确保连接后请求竞技场状态
        // 这是解决弹窗不显示问题的核心修复！
        // 如果 WebSocket 已连接，立即请求；否则主动初始化连接后请求
        if (socket) {
            console.log("🏟️ [Arena] 🔄 请求竞技场状态（智能连接）...");
            // 🔧【改进】直接调用 requestArenaStatusWhenConnected，它会自动处理连接逻辑
            if (socket.requestArenaStatusWhenConnected) {
                socket.requestArenaStatusWhenConnected();
            } else {
                // 🔧【兜底】如果新方法不存在，先尝试初始化连接再请求
                console.log("🏟️ [Arena] ⚠️ requestArenaStatusWhenConnected 不存在，尝试初始化连接...");
                if (socket.initSocket && !socket.isConnected()) {
                    socket.initSocket();
                }
                // 延迟请求，等待连接
                setTimeout(function() {
                    if (socket.requestArenaStatus) {
                        socket.requestArenaStatus();
                    }
                }, 1000);
            }
        }

        // 🔧【新增】立即初始化本地状态（使用本地计算作为初始值）
        this._initLocalArenaStatusFromConfig();
        
        // 🔧【关键新增】监听页面可见性变化，恢复时重新请求竞技场状态
        this._setupVisibilityChangeListener();

        // 🔧【修改】每秒更新本地倒计时（减1）
        this._countdownTimer = setInterval(function() {
            if (self.node && self.node.isValid) {
                self._updateLocalCountdown();
            }
        }, 1000);
    },

    // 🔧【关键新增】监听页面可见性变化
    // 当页面从后台恢复时，重新请求竞技场状态，确保不会错过弹窗
    _setupVisibilityChangeListener: function() {
        var self = this;
        
        // 避免重复注册
        if (this._visibilityChangeListenerAdded) {
            return;
        }
        this._visibilityChangeListenerAdded = true;
        
        // 记录上次请求时间，避免频繁请求
        this._lastArenaStatusRequestTime = 0;
        
        var handleVisibilityChange = function() {
            if (document.visibilityState === 'visible') {
                console.log("📱 [Visibility] 页面从后台恢复，重新请求竞技场状态");
                
                // 检查是否需要重新请求（避免频繁请求）
                var now = Date.now();
                var timeSinceLastRequest = now - self._lastArenaStatusRequestTime;
                
                // 如果距离上次请求超过 5 秒，才重新请求
                if (timeSinceLastRequest > 5000) {
                    self._lastArenaStatusRequestTime = now;
                    
                    // 延迟一点时间，确保 WebSocket 连接恢复
                    setTimeout(function() {
                        if (self.node && self.node.isValid) {
                            var socket = window.myglobal && window.myglobal.socket;
                            if (socket && socket.requestArenaStatusWhenConnected) {
                                console.log("🏟️ [Arena] 页面恢复后重新请求竞技场状态");
                                socket.requestArenaStatusWhenConnected();
                            }
                        }
                    }, 500);
                } else {
                    console.log("📱 [Visibility] 距离上次请求时间较短，跳过重新请求");
                }
            }
        };
        
        // 注册监听器
        if (typeof document !== 'undefined' && document.addEventListener) {
            document.addEventListener('visibilitychange', handleVisibilityChange);
            console.log("📱 [Visibility] 已注册页面可见性监听器");
            
            // 保存引用，以便在销毁时移除
            this._visibilityChangeHandler = handleVisibilityChange;
        }
    },

    // 🔧【新增】处理竞技场比赛开始通知
    _onArenaMatchStart: function(data) {
        var self = this;
        console.log("🏆 [Arena] _onArenaMatchStart 开始处理，data:", JSON.stringify(data));
        
        // 🔧【修复】如果已经在等待界面，不显示弹窗
        if (this._arenaWaitingNode && this._arenaWaitingNode.isValid) {
            console.log("🏆 [Arena] 已在等待界面，跳过弹窗显示");
            // 更新等待界面数据
            if (this._arenaWaitingData) {
                this._arenaWaitingData.periodNo = data.period_no || this._arenaWaitingData.periodNo;
                this._arenaWaitingData.totalPlayers = data.total_players || this._arenaWaitingData.totalPlayers;
                this._arenaWaitingData.countdown = data.countdown || this._arenaWaitingData.countdown;
            }
            return;
        }
        
        // 🔧【修复】先关闭之前可能存在的弹窗
        this._closeArenaMatchStartDialog();
        
        // 保存比赛信息供后续使用
        this._currentMatchData = data;
        
        // 弹出进入游戏弹窗
        console.log("🏆 [Arena] 准备调用 _showArenaMatchStartDialog");
        this._showArenaMatchStartDialog(data);
    },
    
    // 🔧【新增】关闭竞技场弹窗
    _closeArenaMatchStartDialog: function() {
        // 关闭并销毁之前显示的弹窗
        if (this._arenaMatchStartDialog && this._arenaMatchStartDialog.isValid) {
        // 🔧【新增】清除倒计时定时器
        if (this._matchStartCountdownTimer) {
            clearInterval(this._matchStartCountdownTimer);
            this._matchStartCountdownTimer = null;
        }
            this._arenaMatchStartDialog.destroy();
            this._arenaMatchStartDialog = null;
        }
        // 清除当前比赛数据
        this._currentMatchData = null;
    },

    // 🔧【新增】处理服务端发送的关闭弹窗通知
    _onArenaCloseDialog: function(data) {
        console.log("🏟️ [Arena] 收到关闭弹窗通知:", JSON.stringify(data));
        
        // 检查是否与当前弹窗匹配
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
    },

    // 🏆 显示冠军跑马灯广播
    _showChampionBroadcast: function(data) {
        console.log("🏆 [Champion] 显示冠军跑马灯:", data.message);
        
        var self = this;
        
        // 构建跑马灯消息
        var message = data.message || ("恭喜 " + data.champion_name + " 在期号 " + data.period_no + " 夺得" + (data.room_name || "竞技场") + "冠军！");
        
        // 获取画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        
        // 创建跑马灯节点
        var marqueeNode = new cc.Node("ChampionMarquee");
        marqueeNode.setPosition(cc.v2(0, screenHeight / 2 - 80)); // 顶部位置
        marqueeNode.zIndex = 9999; // 最高层级
        
        // 背景
        var bgNode = new cc.Node("Bg");
        bgNode.setContentSize(cc.size(screenWidth - 40, 50));
        var bgGraphics = bgNode.addComponent(cc.Graphics);
        bgGraphics.fillColor = cc.color(255, 215, 0, 230); // 金色背景
        bgGraphics.roundRect(-(screenWidth - 40) / 2, -25, screenWidth - 40, 50, 10);
        bgGraphics.fill();
        bgNode.parent = marqueeNode;
        
        // 冠军图标
        var iconNode = new cc.Node("Icon");
        iconNode.setPosition(cc.v2(-screenWidth / 2 + 50, 0));
        var iconLabel = iconNode.addComponent(cc.Label);
        iconLabel.string = "🏆";
        iconLabel.fontSize = 28;
        iconLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        iconNode.parent = marqueeNode;
        
        // 消息文本
        var textNode = new cc.Node("Text");
        textNode.setPosition(cc.v2(0, 0));
        var textLabel = textNode.addComponent(cc.Label);
        textLabel.string = message;
        textLabel.fontSize = 22;
        textLabel.lineHeight = 28;
        textLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        textNode.color = cc.color(139, 69, 19); // 深棕色文字
        textNode.parent = marqueeNode;
        
        // 添加到场景
        marqueeNode.parent = this.node;
        
        // 动画效果：从上方滑入
        marqueeNode.y = screenHeight / 2 + 100;
        var moveIn = cc.moveTo(0.5, cc.v2(0, screenHeight / 2 - 80)).easing(cc.easeBackOut());
        var delay = cc.delayTime(5); // 显示5秒
        var moveOut = cc.moveTo(0.5, cc.v2(0, screenHeight / 2 + 100));
        var remove = cc.callFunc(function() {
            if (marqueeNode && marqueeNode.isValid) {
                marqueeNode.destroy();
            }
        });
        
        marqueeNode.runAction(cc.sequence(moveIn, delay, moveOut, remove));
        
        // 播放音效（如果有的话）
        // cc.audioEngine.playEffect("sounds/champion.mp3", false);
        
        console.log("🏆 [Champion] 跑马灯显示完成:", message);
    },

    // 🔧【新增】显示竞技场比赛开始弹窗
    _showArenaMatchStartDialog: function(data) {
        var self = this;
        console.log("🏆 [Arena] _showArenaMatchStartDialog 开始创建弹窗...");
        
        // 获取画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        console.log("🏆 [Arena] 屏幕尺寸:", screenWidth, "x", screenHeight);
        
        // 创建弹窗容器
        var dialogNode = new cc.Node("ArenaMatchStartDialog");
        dialogNode.setContentSize(cc.size(screenWidth, screenHeight));
        dialogNode.anchorX = 0.5;
        dialogNode.anchorY = 0.5;
        dialogNode.x = 0;
        dialogNode.y = 0;
        dialogNode.zIndex = 5000;
        dialogNode.parent = this.node;
        console.log("🏆 [Arena] 弹窗容器已创建，zIndex=", dialogNode.zIndex);
        
        // 🔧【修复】保存弹窗引用，用于后续关闭
        this._arenaMatchStartDialog = dialogNode;
        this._arenaMatchStartDialogRoomId = data.room_id;  // 保存对应的房间ID
        this._arenaMatchStartDialogPeriodNo = data.period_no;  // 保存对应的期号
        
        // 半透明黑色背景
        var bgNode = new cc.Node("Bg");
        bgNode.setContentSize(cc.size(screenWidth, screenHeight));
        var bgGraphics = bgNode.addComponent(cc.Graphics);
        bgGraphics.fillColor = cc.color(0, 0, 0, 180);
        bgGraphics.rect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight);
        bgGraphics.fill();
        bgNode.parent = dialogNode;
        
        // 弹窗卡片
        var cardWidth = 450;
        var cardHeight = 380;
        var cardNode = new cc.Node("Card");
        cardNode.setContentSize(cc.size(cardWidth, cardHeight));
        var cardGraphics = cardNode.addComponent(cc.Graphics);
        cardGraphics.fillColor = cc.color(40, 45, 65, 255);
        cardGraphics.roundRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 15);
        cardGraphics.fill();
        cardGraphics.strokeColor = cc.color(255, 215, 0);
        cardGraphics.lineWidth = 3;
        cardGraphics.roundRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 15);
        cardGraphics.stroke();
        cardNode.parent = dialogNode;
        
        // 标题
        var titleNode = new cc.Node("Title");
        titleNode.y = cardHeight/2 - 45;
        var titleLabel = titleNode.addComponent(cc.Label);
        titleLabel.string = "🏆 竞技场比赛开始";
        titleLabel.fontSize = 32;
        titleLabel.lineHeight = 40;
        titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        titleNode.color = cc.color(255, 215, 0);
        var titleOutline = titleNode.addComponent(cc.LabelOutline);
        titleOutline.color = cc.color(100, 80, 0);
        titleOutline.width = 2;
        titleNode.parent = cardNode;
        
        // 期号信息
        var periodNode = new cc.Node("Period");
        periodNode.y = cardHeight/2 - 95;
        var periodLabel = periodNode.addComponent(cc.Label);
        periodLabel.string = "期号: " + (data.period_no || "--");
        periodLabel.fontSize = 22;
        periodLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        periodNode.color = cc.color(200, 200, 220);
        periodNode.parent = cardNode;
        
        // 房间信息
        var roomNode = new cc.Node("Room");
        roomNode.y = cardHeight/2 - 130;
        var roomLabel = roomNode.addComponent(cc.Label);
        roomLabel.string = "房间: " + (data.room_name || "未知房间");
        roomLabel.fontSize = 20;
        roomLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        roomNode.color = cc.color(180, 180, 200);
        roomNode.parent = cardNode;
        
        // 🔧【新增】倒计时显示 - 使用服务端返回的 start_time 计算剩余时间
        var countdownNode = new cc.Node("Countdown");
        countdownNode.y = cardHeight/2 - 165;
        var countdownLabel = countdownNode.addComponent(cc.Label);
        
        // 计算剩余时间：优先使用 start_time，否则使用 countdown
        var remainingSeconds = data.countdown || 60;
        if (data.start_time) {
            var nowMs = Date.now();
            var elapsedMs = nowMs - data.start_time;
            var elapsedSec = Math.floor(elapsedMs / 1000);
            remainingSeconds = Math.max(0, (data.countdown || 60) - elapsedSec);
            console.log("🏆 [Arena] 使用 start_time 计算剩余时间: start_time=" + data.start_time + ", now=" + nowMs + ", elapsed=" + elapsedSec + "s, remaining=" + remainingSeconds + "s");
        }
        
        countdownLabel.string = "倒计时: " + remainingSeconds + " 秒";
        countdownLabel.fontSize = 24;
        countdownLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        countdownNode.color = cc.color(255, 100, 100);
        countdownNode.parent = cardNode;
        
        // 🔧【新增】启动倒计时定时器
        if (self._matchStartCountdownTimer) {
            clearInterval(self._matchStartCountdownTimer);
        }
        self._matchStartCountdownTimer = setInterval(function() {
            if (!dialogNode || !dialogNode.isValid) {
                clearInterval(self._matchStartCountdownTimer);
                self._matchStartCountdownTimer = null;
                return;
            }
            
            // 重新计算剩余时间
            var newRemaining = data.countdown || 60;
            if (data.start_time) {
                var nowMs = Date.now();
                var elapsedMs = nowMs - data.start_time;
                var elapsedSec = Math.floor(elapsedMs / 1000);
                newRemaining = Math.max(0, (data.countdown || 60) - elapsedSec);
            } else {
                newRemaining = remainingSeconds - 1;
            }
            remainingSeconds = newRemaining;
            
            if (newRemaining <= 0) {
                clearInterval(self._matchStartCountdownTimer);
                self._matchStartCountdownTimer = null;
                
                // 🔧【关键修复】弹窗倒计时结束，自动进入独立的等待场景
                // 这样玩家不会先看到大厅界面再跳转游戏场景，体验更流畅
                console.log("🏟️ [Arena] 弹窗倒计时结束，自动进入等待场景 ArenaMatchWaitingScene");
                
                // 清除弹窗引用
                self._arenaMatchStartDialog = null;
                self._arenaMatchStartDialogRoomId = null;
                self._arenaMatchStartDialogPeriodNo = null;
                
                // 销毁弹窗
                if (dialogNode && dialogNode.isValid) {
                    dialogNode.destroy();
                }
                
                // 跳转到等待场景（等待场景会监听 room_joined 消息并直接进入游戏场景）
                self._enterArenaMatch(data);
                return;
            }
            
            countdownLabel.string = "倒计时: " + newRemaining + " 秒";
            
            // 最后10秒变红闪烁
            if (newRemaining <= 10) {
                countdownLabel.color = newRemaining % 2 === 0 ? cc.color(255, 50, 50) : cc.color(255, 150, 150);
            }
        }, 1000);
        
        // 提示消息
        var msgNode = new cc.Node("Message");
        msgNode.y = cardHeight/2 - 240;
        var msgLabel = msgNode.addComponent(cc.Label);
        msgLabel.string = data.message || "比赛即将开始，请准备进入游戏！";
        msgLabel.fontSize = 16;
        msgLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        msgNode.color = cc.color(255, 200, 100);
        msgNode.parent = cardNode;
        
        // 按钮区域
        var btnY = -cardHeight/2 + 55;
        
        // ========== 进入游戏按钮 ==========
        var enterBtn = new cc.Node("EnterBtn");
        enterBtn.setContentSize(cc.size(180, 50));
        enterBtn.setPosition(-100, btnY);
        enterBtn.anchorX = 0.5;
        enterBtn.anchorY = 0.5;
        
        // 绘制按钮背景
        var enterBg = enterBtn.addComponent(cc.Graphics);
        enterBg.fillColor = cc.color(76, 175, 80);  // 绿色
        enterBg.roundRect(-90, -25, 180, 50, 8);
        enterBg.fill();
        
        // 创建文字子节点
        var enterLabelNode = new cc.Node("Label");
        enterLabelNode.anchorX = 0.5;
        enterLabelNode.anchorY = 0.5;
        var enterBtnLabel = enterLabelNode.addComponent(cc.Label);
        enterBtnLabel.string = "进入比赛";
        enterBtnLabel.fontSize = 22;
        enterBtnLabel.lineHeight = 28;
        enterBtnLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        enterLabelNode.color = cc.color(255, 255, 255);
        enterLabelNode.parent = enterBtn;
        
        // 添加 Button 组件提供交互反馈
        var enterButtonComp = enterBtn.addComponent(cc.Button);
        enterButtonComp.transition = cc.Button.Transition.SCALE;
        enterButtonComp.duration = 0.1;
        enterButtonComp.zoomScale = 1.1;
        
        enterBtn.parent = cardNode;
        
        // 添加点击事件
        enterBtn.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            // 清除弹窗引用后再销毁
            self._arenaMatchStartDialog = null;
            self._arenaMatchStartDialogRoomId = null;
            self._arenaMatchStartDialogPeriodNo = null;
            dialogNode.destroy();
            self._enterArenaMatch(data);
        });
        
        // ========== 取消按钮 ==========
        var cancelBtn = new cc.Node("CancelBtn");
        cancelBtn.setContentSize(cc.size(120, 50));
        cancelBtn.setPosition(100, btnY);  // 修正位置，两按钮间距合理
        cancelBtn.anchorX = 0.5;
        cancelBtn.anchorY = 0.5;
        
        // 绘制按钮背景
        var cancelBg = cancelBtn.addComponent(cc.Graphics);
        cancelBg.fillColor = cc.color(180, 80, 80);  // 红色
        cancelBg.roundRect(-60, -25, 120, 50, 8);
        cancelBg.fill();
        
        // 创建文字子节点
        var cancelLabelNode = new cc.Node("Label");
        cancelLabelNode.anchorX = 0.5;
        cancelLabelNode.anchorY = 0.5;
        var cancelBtnLabel = cancelLabelNode.addComponent(cc.Label);
        cancelBtnLabel.string = "取消";
        cancelBtnLabel.fontSize = 20;
        cancelBtnLabel.lineHeight = 26;
        cancelBtnLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        cancelLabelNode.color = cc.color(255, 255, 255);
        cancelLabelNode.parent = cancelBtn;
        
        // 添加 Button 组件提供交互反馈
        var cancelButtonComp = cancelBtn.addComponent(cc.Button);
        cancelButtonComp.transition = cc.Button.Transition.SCALE;
        cancelButtonComp.duration = 0.1;
        cancelButtonComp.zoomScale = 1.1;
        
        cancelBtn.parent = cardNode;
        
        // 添加点击事件
        cancelBtn.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            
            // 取消按钮：取消报名并退还竞技币
            self._cancelArenaSignup(data);
            
            // 清除弹窗引用后再销毁
            self._arenaMatchStartDialog = null;
            self._arenaMatchStartDialogRoomId = null;
            self._arenaMatchStartDialogPeriodNo = null;
            dialogNode.destroy();
        });
        
        console.log("🏆 [Arena] ✅ 弹窗创建完成！dialogNode.parent =", dialogNode.parent ? "已挂载" : "未挂载");
        console.log("🏆 [Arena] 弹窗子节点数量:", dialogNode.children.length);
    },

    // 🔧【新增】取消竞技场报名并退还竞技币
    _cancelArenaSignup: function(data) {
        var self = this;
        var myglobal = window.myglobal;
        
        console.log("🏟️ [Arena] 取消报名，退还竞技币，room_id:", data.room_id);
        
        // 发送取消报名请求到服务端
        var socket = myglobal && myglobal.socket;
        if (socket && socket.sendArenaCancelSignup) {
            socket.sendArenaCancelSignup({
                room_id: data.room_id
            });
        }
        
        // 清除本地报名状态
        if (window.arenaData && window.arenaData._signedUpArenas) {
            delete window.arenaData._signedUpArenas[data.room_id];
            window.arenaData.saveToLocal && window.arenaData.saveToLocal();
        }
        
        // 清除当前比赛数据
        this._currentMatchData = null;
    },

    // 🔧【新增】进入竞技场比赛
    // 🔧【关键修改】跳转到独立的等待场景 ArenaMatchWaitingScene，而不是在大厅显示等待UI
    // 这样倒计时结束后可以直接从等待场景进入游戏场景，体验更流畅
    _enterArenaMatch: function(data) {
        var self = this;
        var myglobal = window.myglobal;
        
        console.log("🏟️ [Arena] 进入竞技场比赛，data:", JSON.stringify(data));
        
        // 🔧【关键修复】不在本地计算倒计时，完全依赖服务端推送
        // 所有倒计时由服务端计算并推送
        
        // 保存比赛信息
        if (myglobal) {
            myglobal.currentArenaMatch = data;
        }
        
        // 清除报名状态
        if (window.arenaData && window.arenaData._signedUpArenas) {
            delete window.arenaData._signedUpArenas[data.room_id];
            window.arenaData.saveToLocal && window.arenaData.saveToLocal();
        }
        
        // 🔧【关键修改】保存等待数据到全局变量，供 ArenaMatchWaitingScene 使用
        // 等待场景会从这个变量读取初始数据
        if (myglobal) {
            myglobal.arenaWaitingData = {
                period_no: data.period_no || "",
                room_id: data.room_id || 0,
                room_name: data.room_name || "竞技场",
                total_players: data.total_players || 0,
                entered_players: 1,  // 当前玩家已进入
                start_time: data.start_time || Date.now(),
                countdown: data.countdown || 60,
                players: [],  // 玩家列表会由服务端推送
                message: data.message || "比赛即将开始！"
            };
            
            // 同时保存房间配置
            myglobal.currentRoomConfig = {
                id: data.room_id,
                room_name: data.room_name,
                room_config_id: data.room_config_id,
                room_category: 2,  // 竞技场
                min_arena_coin: data.signup_fee,
                match_rounds: data.match_rounds,
                match_duration: data.match_duration
            };
            myglobal.currentRoomLevel = data.room_id;
            myglobal.currentRoomName = data.room_name;
            
            console.log("🏟️ [Arena] 已保存等待数据到 myglobal.arenaWaitingData");
        }
        
        // 🔧【关键修改】发送 arena_enter 请求
        var socket = myglobal && myglobal.socket;
        if (socket && socket.sendArenaEnter) {
            // 发送 arena_enter 请求
            socket.sendArenaEnter({
                period_no: data.period_no,
                room_id: data.room_id
            });
            
            console.log("🏟️ [Arena] 已发送 arena_enter 请求");
        }
        
        // 🔧【关键修改】跳转到独立的等待场景
        // 等待场景会监听服务端消息，倒计时结束后直接进入游戏场景
        console.log("🏟️ [Arena] 跳转到等待场景 ArenaMatchWaitingScene");
        cc.director.loadScene("ArenaMatchWaitingScene");
    },
    
    // ============================================================
    // 🔧【新增】竞技场等待界面（在当前场景显示，不跳转场景）
    // ============================================================
    
    /**
     * 显示竞技场等待界面
     */
    _showArenaWaitingUI: function(data) {
        var self = this;
        
        console.log("🏟️ [Arena] 显示等待界面");
        
        // 如果已存在等待界面，先移除
        this._hideArenaWaitingUI();
        
        // hallScene 挂载在 Canvas 节点上，this.node 就是 Canvas
        var canvas = this.node;
        if (!canvas || !canvas.isValid) {
            console.error("🏟️ [Arena] Canvas 节点无效");
            return;
        }
        
        console.log("🏟️ [Arena] Canvas 节点已找到:", canvas.name);
        
        // 创建等待界面容器
        var waitingNode = new cc.Node("ArenaWaitingUI");
        waitingNode.setContentSize(cc.size(1280, 720));
        waitingNode.setPosition(0, 0);
        waitingNode.zIndex = 1000;  // 确保在最上层
        
        // 1. 创建半透明遮罩
        var maskNode = new cc.Node("Mask");
        maskNode.setContentSize(cc.size(1280, 720));
        maskNode.setPosition(0, 0);
        var maskGraphics = maskNode.addComponent(cc.Graphics);
        maskGraphics.fillColor = cc.color(0, 0, 0, 180);
        maskGraphics.rect(-640, -360, 1280, 720);
        maskGraphics.fill();
        maskNode.parent = waitingNode;
        
        // 2. 创建背景图
        var bgNode = new cc.Node("Background");
        bgNode.setContentSize(cc.size(1280, 720));
        bgNode.setPosition(0, 0);
        var bgSprite = bgNode.addComponent(cc.Sprite);
        bgSprite.type = cc.Sprite.Type.SIMPLE;
        bgSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        
        // 加载背景图
        cc.resources.load('join_bk', cc.SpriteFrame, function(err, spriteFrame) {
            if (err) {
                console.warn("🏟️ [Arena] 无法加载背景图 join_bk.png");
                // 使用纯色背景作为后备
                var bgGraphics = bgNode.addComponent(cc.Graphics);
                bgGraphics.fillColor = cc.color(25, 30, 50, 255);
                bgGraphics.rect(-640, -360, 1280, 720);
                bgGraphics.fill();
                return;
            }
            if (bgSprite && bgSprite.node && bgSprite.node.isValid) {
                bgSprite.spriteFrame = spriteFrame;
            }
        });
        bgNode.parent = waitingNode;
        
        // 3. 创建顶部信息栏
        var topBar = new cc.Node("TopBar");
        topBar.setContentSize(cc.size(1180, 100));
        topBar.setPosition(0, 280);
        
        // 顶部栏背景
        var topBarBg = new cc.Node("Bg");
        topBarBg.setContentSize(cc.size(1180, 100));
        var topBarGraphics = topBarBg.addComponent(cc.Graphics);
        topBarGraphics.fillColor = cc.color(0, 0, 0, 150);
        topBarGraphics.roundRect(-590, -50, 1180, 100, 10);
        topBarGraphics.fill();
        topBarBg.parent = topBar;
        
        // 期号
        var periodNode = new cc.Node("PeriodNo");
        periodNode.setPosition(-480, 20);
        var periodLabel = periodNode.addComponent(cc.Label);
        periodLabel.string = "期号: " + (data.period_no || "--");
        periodLabel.fontSize = 22;
        periodLabel.lineHeight = 28;
        periodNode.color = cc.color(255, 215, 0);
        var periodOutline = periodNode.addComponent(cc.LabelOutline);
        periodOutline.color = cc.color(0, 0, 0);
        periodOutline.width = 2;
        periodNode.parent = topBar;
        
        // 房间名称
        var roomNode = new cc.Node("RoomName");
        roomNode.setPosition(0, 20);
        var roomLabel = roomNode.addComponent(cc.Label);
        roomLabel.string = data.room_name || "竞技场";
        roomLabel.fontSize = 28;
        roomLabel.lineHeight = 36;
        roomNode.color = cc.color(255, 255, 255);
        var roomOutline = roomNode.addComponent(cc.LabelOutline);
        roomOutline.color = cc.color(0, 0, 0);
        roomOutline.width = 2;
        roomNode.parent = topBar;
        
        // 🔧【关键修复】直接使用服务端推送的倒计时
        // 服务端已经根据 StartTime 计算了正确的剩余时间
        // 注意：不能使用 || 运算符，因为 0 会被当作假值
        var actualCountdownForLabel = (data.countdown !== undefined && data.countdown !== null) ? data.countdown : 60;
        console.log("🏟️ [Arena] 等待界面初始倒计时: data.countdown=" + data.countdown + ", 使用值=" + actualCountdownForLabel);
        
        // 倒计时
        var countdownNode = new cc.Node("Countdown");
        countdownNode.setPosition(480, 20);
        var countdownLabel = countdownNode.addComponent(cc.Label);
        countdownLabel.string = actualCountdownForLabel + "秒";  // 🔧【修复】直接使用服务端推送的倒计时
        countdownLabel.fontSize = 24;
        countdownLabel.lineHeight = 32;
        countdownNode.color = cc.color(100, 255, 100);
        var countdownOutline = countdownNode.addComponent(cc.LabelOutline);
        countdownOutline.color = cc.color(0, 0, 0);
        countdownOutline.width = 2;
        countdownNode.parent = topBar;
        
        // 玩家数量
        var playerCountNode = new cc.Node("PlayerCount");
        playerCountNode.setPosition(0, -20);
        var playerCountLabel = playerCountNode.addComponent(cc.Label);
        playerCountLabel.string = "已进入: 0 / " + (data.total_players || 0);
        playerCountLabel.fontSize = 20;
        playerCountLabel.lineHeight = 28;
        playerCountNode.color = cc.color(200, 200, 220);
        playerCountNode.parent = topBar;
        
        topBar.parent = waitingNode;
        
        // 4. 创建玩家列表容器（一排10个，从左上角开始排列）
        // 玩家卡片尺寸：每个卡片100x120，间距10px
        // 一排10个：10 * 100 + 9 * 10 = 1090px 宽度
        
        // 创建容器背景
        var containerNode = new cc.Node("PlayerArea");
        containerNode.setContentSize(cc.size(1160, 440));
        containerNode.setPosition(0, -25);
        
        // 半透明背景
        var bgNode = new cc.Node("Bg");
        bgNode.setContentSize(cc.size(1160, 440));
        var bgGraphics = bgNode.addComponent(cc.Graphics);
        bgGraphics.fillColor = cc.color(0, 0, 0, 80);
        bgGraphics.roundRect(-580, -220, 1160, 440, 10);
        bgGraphics.fill();
        bgNode.parent = containerNode;
        
        // 内容容器（锚点设在左上角，从左上角开始排列）
        var contentNode = new cc.Node("Content");
        contentNode.setContentSize(cc.size(1150, 420));
        contentNode.anchorX = 0;  // 左锚点
        contentNode.anchorY = 1;  // 上锚点
        contentNode.setPosition(-575, 210);  // 对应左上角位置
        contentNode.parent = containerNode;
        
        containerNode.parent = waitingNode;
        
        // 添加到 Canvas
        waitingNode.parent = canvas;
        
        // 🔧【关键修复】直接使用服务端推送的倒计时
        // 服务端已经根据 StartTime 计算了正确的剩余时间
        // 注意：不能使用 || 运算符，因为 0 会被当作假值
        var actualCountdown = (data.countdown !== undefined && data.countdown !== null) ? data.countdown : 60;
        console.log("🏟️ [Arena] 等待界面保存数据: data.countdown=" + data.countdown + ", 使用值=" + actualCountdown);
        
        // 保存引用
        this._arenaWaitingNode = waitingNode;
        this._arenaWaitingData = {
            periodNo: data.period_no || "",
            roomId: data.room_id || 0,
            roomName: data.room_name || "竞技场",
            countdown: actualCountdown,  // 🔧【修复】直接使用服务端推送的倒计时
            totalPlayers: data.total_players || 0,
            enteredPlayers: 0,
            players: [],
            serverCountdown: actualCountdown,  // 🔧【修复】直接使用服务端推送的倒计时
            lastServerUpdateTime: Date.now(),  // 最后收到服务端更新的时间
            startTime: data.start_time || Date.now()  // 🔧【保留】用于日志参考
        };
        this._arenaWaitingLabels = {
            period: periodLabel,
            room: roomLabel,
            countdown: countdownLabel,
            playerCount: playerCountLabel
        };
        this._arenaWaitingContent = contentNode;
        
        // 🔧【新增】启动本地备用计时器（服务端断线时使用）
        this._startArenaLocalCountdownTimer();
        
        // 注册事件监听（确保不重复注册）
        this._ensureArenaWaitingEventsRegistered();
        
        // 检查是否有缓存数据
        console.log("🏟️ [Arena] 检查缓存数据...");
        var myglobal = window.myglobal;
        if (myglobal && myglobal.arenaWaitingStatusCache) {
            console.log("🏟️ [Arena] 发现缓存数据:", JSON.stringify(myglobal.arenaWaitingStatusCache));
        }
        
        var hasCacheData = this._checkArenaWaitingCache();
        console.log("🏟️ [Arena] 缓存数据检查结果:", hasCacheData);
        
        // 如果没有缓存数据，先显示自己占位
        if (!hasCacheData) {
            console.log("🏟️ [Arena] 没有缓存数据，显示占位");
            this._showArenaWaitingPlaceholder(data);
        }
        
        console.log("🏟️ [Arena] 等待界面已创建，当前玩家列表:", this._arenaWaitingData.players.length);
    },
    
    /**
     * 显示占位玩家（仅在没有真实数据时）
     */
    _showArenaWaitingPlaceholder: function(data) {
        // 获取当前玩家信息
        var myglobal = window.myglobal;
        var currentPlayer = myglobal && myglobal.playerData ? myglobal.playerData : null;
        var currentAvatar = currentPlayer && currentPlayer.avatar ? currentPlayer.avatar : "";
        var currentName = currentPlayer && currentPlayer.player_name ? currentPlayer.player_name : "我";
        var currentId = currentPlayer && currentPlayer.player_id ? currentPlayer.player_id : "me";
        
        // 只添加自己作为占位
        this._arenaWaitingData.players = [{
            player_id: currentId,
            player_name: currentName,
            avatar: currentAvatar,
            is_robot: false,
            entered_at: Date.now()
        }];
        this._arenaWaitingData.enteredPlayers = 1;
        
        // 更新UI
        this._updateArenaPlayerListUI();
        
        // 更新玩家数量显示
        if (this._arenaWaitingLabels && this._arenaWaitingLabels.playerCount) {
            this._arenaWaitingLabels.playerCount.string = "已进入: 1 / " + (data.total_players || 1);
        }
        
        console.log("🏟️ [Arena] 显示占位玩家");
    },
    
    /**
     * 隐藏竞技场等待界面
     */
    _hideArenaWaitingUI: function() {
        // 🔧【新增】停止本地计时器
        this._stopArenaLocalCountdownTimer();
        
        if (this._arenaWaitingNode) {
            this._arenaWaitingNode.destroy();
            this._arenaWaitingNode = null;
        }
        this._arenaWaitingLabels = null;
        this._arenaWaitingContent = null;
        
        // 取消事件监听
        this._unregisterArenaWaitingEvents();
    },
    
    /**
     * 注册竞技场等待界面事件监听
     */
    _registerArenaWaitingEvents: function() {
        var self = this;
        var myglobal = window.myglobal;
        var evt = myglobal && myglobal.eventlister;
        
        console.log("🏟️ [ArenaWaiting] 注册事件监听, evt:", evt ? "存在" : "不存在");
        
        if (!evt) {
            console.warn("🏟️ [ArenaWaiting] eventlister 不存在，无法注册事件");
            return;
        }
        
        // 等待状态推送
        this._arenaWaitingStatusHandler = function(data) {
            console.log("🏟️ [ArenaWaiting] ✅ 收到等待状态通知，玩家数:", data.players ? data.players.length : 0);
            console.log("🏟️ [ArenaWaiting] 等待状态数据:", JSON.stringify(data));
            self._onArenaWaitingStatus(data);
        };
        evt.on("arena_waiting_status_notify", this._arenaWaitingStatusHandler);
        
        // 倒计时更新
        this._arenaWaitingTickHandler = function(data) {
            self._onArenaWaitingTick(data);
        };
        evt.on("arena_waiting_tick_notify", this._arenaWaitingTickHandler);
        
        // 玩家加入广播
        this._arenaPlayerJoinedHandler = function(data) {
            console.log("🏟️ [ArenaWaiting] ✅ 收到玩家加入通知，玩家数:", data.players ? data.players.length : 0);
            console.log("🏟️ [ArenaWaiting] 玩家加入数据:", JSON.stringify(data));
            self._onArenaPlayerJoined(data);
        };
        evt.on("arena_player_joined_notify", this._arenaPlayerJoinedHandler);
        
        // 分配阶段开始
        this._arenaAssignStartHandler = function(data) {
            console.log("🏟️ [ArenaWaiting] ✅ 收到分配阶段开始通知:", JSON.stringify(data));
            self._onArenaAssignStart(data);
        };
        evt.on("arena_assign_start_notify", this._arenaAssignStartHandler);
        
        // 🔧【新增】监听 room_joined 消息以进入游戏场景
        var socket = myglobal && myglobal.socket;
        if (socket && socket.onRoomJoined) {
            this._arenaRoomJoinedHandler = function(roomData) {
                console.log("🏟️ [ArenaWaiting] ✅ 收到 room_joined，准备进入游戏场景:", JSON.stringify(roomData));
                
                // 检查是否是竞技场房间
                var roomCategory = roomData.room_category || 1;
                if (roomCategory !== 2) {
                    console.log("🏟️ [ArenaWaiting] 不是竞技场房间，忽略");
                    return;
                }
                
                // 🔧【关键修复】防止重复处理 room_joined
                if (self._arenaRoomJoinedProcessed) {
                    console.log("🏟️ [ArenaWaiting] room_joined 已处理过，跳过");
                    return;
                }
                self._arenaRoomJoinedProcessed = true;
                
                // 隐藏等待界面
                self._hideArenaWaitingUI();
                
                // 进入游戏场景
                self._enterArenaGameSceneFromRoomJoined(roomData);
            };
            socket.onRoomJoined(this._arenaRoomJoinedHandler);
        }
    },
    
    /**
     * 确保竞技场等待界面事件监听已注册（防止重复注册）
     */
    _ensureArenaWaitingEventsRegistered: function() {
        // 如果已经注册过，直接返回
        if (this._arenaWaitingEventsRegistered) {
            console.log("🏟️ [ArenaWaiting] 事件监听器已注册，跳过");
            return;
        }
        
        console.log("🏟️ [ArenaWaiting] 注册事件监听器");
        this._registerArenaWaitingEvents();
        this._arenaWaitingEventsRegistered = true;
    },
    
    /**
     * 取消竞技场等待界面事件监听
     */
    _unregisterArenaWaitingEvents: function() {
        var myglobal = window.myglobal;
        var evt = myglobal && myglobal.eventlister;
        
        if (!evt) return;
        
        if (this._arenaWaitingStatusHandler) {
            evt.off("arena_waiting_status_notify", this._arenaWaitingStatusHandler);
        }
        if (this._arenaWaitingTickHandler) {
            evt.off("arena_waiting_tick_notify", this._arenaWaitingTickHandler);
        }
        if (this._arenaPlayerJoinedHandler) {
            evt.off("arena_player_joined_notify", this._arenaPlayerJoinedHandler);
        }
        if (this._arenaAssignStartHandler) {
            evt.off("arena_assign_start_notify", this._arenaAssignStartHandler);
        }
        
        // 重置注册标志
        this._arenaWaitingEventsRegistered = false;
    },
    
    /**
     * 检查缓存数据
     * @returns {boolean} 是否有有效的缓存数据
     */
    _checkArenaWaitingCache: function() {
        var myglobal = window.myglobal;
        
        if (myglobal && myglobal.arenaWaitingStatusCache) {
            var cachedData = myglobal.arenaWaitingStatusCache;
            console.log("🏟️ [ArenaWaiting] 发现缓存数据，玩家数量:", cachedData.players ? cachedData.players.length : 0);
            
            // 检查期号是否匹配
            if (!this._arenaWaitingData.periodNo || cachedData.period_no === this._arenaWaitingData.periodNo) {
                // 检查是否有有效的玩家数据
                var players = cachedData.players || [];
                if (players.length > 0) {
                    this._onArenaWaitingStatus(cachedData);
                    
                    // 清除缓存
                    myglobal.arenaWaitingStatusCache = null;
                    return true;
                }
            }
        }
        return false;
    },
    
    /**
     * 处理等待状态更新
     * 🔧【关键修复】完全依赖服务端推送的倒计时，不做本地计算
     */
    _onArenaWaitingStatus: function(data) {
        console.log("🏟️ [ArenaWaiting] 收到等待状态，countdown=" + data.countdown + ", players=" + (data.players ? data.players.length : 0));
        
        // 🔧【关键修复】如果等待界面不存在，创建它（使用服务端推送的倒计时）
        if (!this._arenaWaitingNode) {
            // 检查是否有保存的弹窗数据
            if (this._pendingArenaEnterData) {
                // 合并服务端推送的数据和保存的弹窗数据
                var waitingData = {
                    period_no: data.period_no || this._pendingArenaEnterData.period_no,
                    room_id: data.room_id || this._pendingArenaEnterData.room_id,
                    room_name: data.room_name || this._pendingArenaEnterData.room_name,
                    countdown: data.countdown,  // 🔧【关键】直接使用服务端推送的倒计时
                    total_players: data.total_players || this._pendingArenaEnterData.total_players,
                    start_time: data.start_time,
                    entered_players: data.entered_players || 0,
                    players: data.players || [],
                    message: data.message || this._pendingArenaEnterData.message
                };
                console.log("🏟️ [ArenaWaiting] 创建等待界面，服务端倒计时=" + data.countdown);
                this._showArenaWaitingUI(waitingData);
                this._pendingArenaEnterData = null;  // 清除保存的数据
                return;
            }
            
            // 如果没有保存的数据，直接用服务端数据创建
            if (data.period_no && data.countdown !== undefined) {
                console.log("🏟️ [ArenaWaiting] 直接创建等待界面，服务端倒计时=" + data.countdown);
                this._showArenaWaitingUI({
                    period_no: data.period_no,
                    room_id: data.room_id,
                    room_name: data.room_name,
                    countdown: data.countdown,  // 🔧【关键】直接使用服务端推送的倒计时
                    total_players: data.total_players,
                    start_time: data.start_time,
                    entered_players: data.entered_players || 0,
                    players: data.players || [],
                    message: data.message
                });
                return;
            }
            
            console.warn("🏟️ [ArenaWaiting] 没有足够数据创建等待界面");
            return;
        }
        
        // 检查期号是否匹配
        if (this._arenaWaitingData.periodNo && data.period_no !== this._arenaWaitingData.periodNo) {
            return;
        }
        
        // 更新数据（直接使用服务端返回的真实数据）
        this._arenaWaitingData.periodNo = data.period_no || "";
        this._arenaWaitingData.roomId = data.room_id || 0;
        this._arenaWaitingData.roomName = data.room_name || "竞技场";
        this._arenaWaitingData.countdown = data.countdown;  // 🔧【关键】直接使用服务端推送的倒计时
        this._arenaWaitingData.totalPlayers = data.total_players || 0;
        this._arenaWaitingData.enteredPlayers = data.entered_players || 0;
        this._arenaWaitingData.players = data.players || [];
        
        console.log("🏟️ [ArenaWaiting] 更新等待状态，倒计时=" + data.countdown + "，玩家数量:", this._arenaWaitingData.players.length);
        
        // 更新UI
        this._updateArenaWaitingUI();
    },
    
    /**
     * 处理倒计时更新（服务端推送）
     * 🔧【关键修复】直接使用服务端推送的倒计时，不做本地计算
     */
    _onArenaWaitingTick: function(data) {
        if (!this._arenaWaitingNode) return;
        
        // 检查期号是否匹配
        if (this._arenaWaitingData.periodNo && data.period_no !== this._arenaWaitingData.periodNo) {
            return;
        }
        
        // 🔧【关键修复】直接使用服务端推送的倒计时
        // 服务端已经根据 StartTime 计算了正确的剩余时间
        this._arenaWaitingData.serverCountdown = data.countdown;
        this._arenaWaitingData.countdown = data.countdown;
        this._arenaWaitingData.lastServerUpdateTime = Date.now();
        this._arenaWaitingData.enteredPlayers = data.entered_players;
        
        // 更新倒计时显示
        if (this._arenaWaitingLabels && this._arenaWaitingLabels.countdown) {
            this._arenaWaitingLabels.countdown.string = data.countdown + "秒";
            
            // 最后10秒变红
            if (data.countdown <= 10 && data.countdown > 0) {
                this._arenaWaitingLabels.countdown.node.color = cc.color(255, 100, 100);
            } else {
                this._arenaWaitingLabels.countdown.node.color = cc.color(100, 255, 100);
            }
        }
        
        // 更新玩家数量
        if (this._arenaWaitingLabels && this._arenaWaitingLabels.playerCount) {
            this._arenaWaitingLabels.playerCount.string = "已进入: " + data.entered_players + " / " + this._arenaWaitingData.totalPlayers;
        }
    },
    
    /**
     * 🔧【新增】启动本地备用计时器（服务端断线时使用）
     * 🔧【关键修复】直接使用服务端推送的倒计时，断线时本地递减
     */
    _startArenaLocalCountdownTimer: function() {
        var self = this;
        
        // 清理已有的计时器
        if (this._arenaLocalCountdownTimer) {
            clearInterval(this._arenaLocalCountdownTimer);
            this._arenaLocalCountdownTimer = null;
        }
        
        // 每秒检查一次
        this._arenaLocalCountdownTimer = setInterval(function() {
            if (!self._arenaWaitingNode || !self._arenaWaitingData) {
                return;
            }
            
            // 检查连接状态
            var myglobal = window.myglobal;
            var socket = myglobal && myglobal.socket;
            var isConnected = socket && socket.isConnected && socket.isConnected();
            
            // 计算距离上次服务端更新的时间
            var timeSinceLastUpdate = Date.now() - (self._arenaWaitingData.lastServerUpdateTime || 0);
            
            // 如果连接断开超过2秒，使用本地递减
            if (!isConnected || timeSinceLastUpdate > 2000) {
                // 本地倒计时递减
                if (self._arenaWaitingData.countdown > 0) {
                    self._arenaWaitingData.countdown--;
                    
                    // 更新倒计时显示
                    if (self._arenaWaitingLabels && self._arenaWaitingLabels.countdown) {
                        self._arenaWaitingLabels.countdown.string = self._arenaWaitingData.countdown + "秒";
                        
                        // 最后10秒变红
                        if (self._arenaWaitingData.countdown <= 10 && self._arenaWaitingData.countdown > 0) {
                            self._arenaWaitingLabels.countdown.node.color = cc.color(255, 100, 100);
                        } else {
                            self._arenaWaitingLabels.countdown.node.color = cc.color(100, 255, 100);
                        }
                    }
                    
                    console.log("🏟️ [ArenaWaiting] 本地倒计时(断线递减):", self._arenaWaitingData.countdown);
                }
            }
            // 如果连接恢复，同步服务端倒计时
            else if (isConnected && self._arenaWaitingData.serverCountdown !== undefined) {
                self._arenaWaitingData.countdown = self._arenaWaitingData.serverCountdown;
            }
        }, 1000);
    },
    
    /**
     * 🔧【新增】停止本地备用计时器
     */
    _stopArenaLocalCountdownTimer: function() {
        if (this._arenaLocalCountdownTimer) {
            clearInterval(this._arenaLocalCountdownTimer);
            this._arenaLocalCountdownTimer = null;
        }
    },
    
    /**
     * 处理玩家加入
     */
    _onArenaPlayerJoined: function(data) {
        if (!this._arenaWaitingNode) return;
        
        // 检查期号是否匹配
        if (this._arenaWaitingData.periodNo && data.period_no !== this._arenaWaitingData.periodNo) {
            return;
        }
        
        // 更新玩家列表（直接使用服务端返回的真实数据）
        this._arenaWaitingData.players = data.players || [];
        this._arenaWaitingData.enteredPlayers = data.entered_players;
        this._arenaWaitingData.totalPlayers = data.total_players;
        
        console.log("🏟️ [ArenaWaiting] 玩家加入，更新列表，玩家数量:", this._arenaWaitingData.players.length);
        
        // 更新玩家列表UI
        this._updateArenaPlayerListUI();
        
        // 更新玩家数量
        if (this._arenaWaitingLabels && this._arenaWaitingLabels.playerCount) {
            this._arenaWaitingLabels.playerCount.string = "已进入: " + data.entered_players + " / " + data.total_players;
        }
    },
    
    /**
     * 处理分配阶段开始
     */
    _onArenaAssignStart: function(data) {
        if (!this._arenaWaitingNode) return;
        
        console.log("🏟️ [ArenaWaiting] 分配阶段开始，准备进入游戏");
        
        // 🔧【关键修复】设置标志，防止 room_joined 再次触发进入游戏场景
        this._arenaRoomJoinedProcessed = true;
        
        // 隐藏等待界面
        this._hideArenaWaitingUI();
        
        // 直接进入游戏场景
        var myglobal = window.myglobal;
        if (myglobal && myglobal.currentArenaMatch) {
            var matchData = myglobal.currentArenaMatch;
            var roomConfig = {
                id: matchData.room_id,
                room_name: matchData.room_name,
                room_category: 2
            };
            this._enterArenaGameScene(matchData, roomConfig);
        }
    },
    
    /**
     * 更新等待界面UI
     */
    _updateArenaWaitingUI: function() {
        if (!this._arenaWaitingNode) return;
        
        var labels = this._arenaWaitingLabels;
        if (!labels) return;
        
        // 更新期号
        if (labels.period) {
            labels.period.string = "期号: " + this._arenaWaitingData.periodNo;
        }
        
        // 更新房间名称
        if (labels.room) {
            labels.room.string = this._arenaWaitingData.roomName;
        }
        
        // 更新倒计时
        if (labels.countdown) {
            labels.countdown.string = this._arenaWaitingData.countdown + "秒";
        }
        
        // 更新玩家数量
        if (labels.playerCount) {
            labels.playerCount.string = "已进入: " + this._arenaWaitingData.enteredPlayers + " / " + this._arenaWaitingData.totalPlayers;
        }
        
        // 更新玩家列表
        this._updateArenaPlayerListUI();
    },
    
    /**
     * 更新玩家列表UI（一排10个，从左上角开始排列）
     * 排序规则：已进入的玩家排在前面，等待中的玩家排在后面
     */
    _updateArenaPlayerListUI: function() {
        if (!this._arenaWaitingContent) return;
        
        // 清空现有列表
        this._arenaWaitingContent.removeAllChildren();
        
        var players = this._arenaWaitingData.players || [];
        console.log("🏟️ [ArenaWaiting] 更新玩家列表，玩家数量:", players.length);
        
        if (players.length === 0) {
            console.log("🏟️ [ArenaWaiting] 没有玩家数据，跳过渲染");
            return;
        }
        
        // 排序：已进入的玩家（entered_at > 0）排在前面，等待中的排在后面
        var sortedPlayers = players.slice().sort(function(a, b) {
            var aEntered = a.entered_at && a.entered_at > 0;
            var bEntered = b.entered_at && b.entered_at > 0;
            
            // 已进入的排在前面
            if (aEntered && !bEntered) return -1;
            if (!aEntered && bEntered) return 1;
            
            // 同状态按进入时间排序
            return (a.entered_at || 0) - (b.entered_at || 0);
        });
        
        console.log("🏟️ [ArenaWaiting] 排序后玩家:", sortedPlayers.map(function(p) { 
            return p.player_name + (p.entered_at > 0 ? '(已进入)' : '(等待中)'); 
        }).join(', '));
        
        // 布局参数：一排10个，从左上角开始排列
        var itemWidth = 100;   // 卡片宽度
        var itemHeight = 120;  // 卡片高度
        var spacingX = 10;     // 水平间距
        var spacingY = 10;     // 垂直间距
        var cols = 10;         // 一排10个
        var marginX = 10;      // 左边距
        var marginY = 10;      // 上边距
        
        // 添加玩家项
        for (var i = 0; i < sortedPlayers.length; i++) {
            var player = sortedPlayers[i];
            var statusText = (player.entered_at && player.entered_at > 0) ? '(已进入)' : '(等待中)';
            console.log("🏟️ [ArenaWaiting] 创建玩家卡片:", i, player.player_name, statusText);
            var itemNode = this._createArenaPlayerItemNew(player, i);
            
            // 计算位置（从左上角开始，锚点为左上角）
            // contentNode 的锚点是 (0, 1)，即左上角
            // (0, 0) 是左上角，x 向右增加，y 向下减少
            var col = i % cols;
            var row = Math.floor(i / cols);
            var x = marginX + col * (itemWidth + spacingX) + itemWidth / 2;  // 卡片中心位置
            var y = -marginY - row * (itemHeight + spacingY) - itemHeight / 2;  // Y向下为负
            
            itemNode.setPosition(x, y);
            itemNode.parent = this._arenaWaitingContent;
        }
    },
    
    /**
     * 创建玩家卡片（新设计：紧凑卡片，圆形头像）
     */
    _createArenaPlayerItemNew: function(player, index) {
        var itemNode = new cc.Node("PlayerCard_" + index);
        itemNode.setContentSize(cc.size(100, 120));
        
        // 卡片背景（圆角矩形）
        var bgNode = new cc.Node("Bg");
        bgNode.setContentSize(cc.size(95, 115));
        var bgGraphics = bgNode.addComponent(cc.Graphics);
        
        // 🔧【修复】机器人和真人使用相同背景色，不再区分
        bgGraphics.fillColor = cc.color(40, 60, 80, 230);  // 统一蓝色调
        bgGraphics.roundRect(-47.5, -57.5, 95, 115, 8);
        bgGraphics.fill();
        bgNode.parent = itemNode;
        
        // ========== 圆形头像（使用 Mask 实现圆形裁剪）==========
        // 创建遮罩节点
        var maskNode = new cc.Node("AvatarMask");
        maskNode.setPosition(0, 25);
        maskNode.setContentSize(cc.size(60, 60));
        
        // 添加 Mask 组件
        var mask = maskNode.addComponent(cc.Mask);
        mask.type = cc.Mask.Type.ELLIPSE;  // 椭圆形遮罩（圆形）
        mask.segements = 64;  // 圆滑度
        
        // 头像背景圆圈
        var avatarBg = new cc.Node("AvatarBg");
        var avatarBgGraphics = avatarBg.addComponent(cc.Graphics);
        avatarBgGraphics.fillColor = cc.color(80, 80, 100, 255);
        avatarBgGraphics.circle(0, 0, 32);
        avatarBgGraphics.fill();
        avatarBg.parent = maskNode;
        
        // 头像节点（在遮罩内部，会被裁剪成圆形）
        var avatarNode = new cc.Node("Avatar");
        avatarNode.setContentSize(cc.size(60, 60));
        var avatarSprite = avatarNode.addComponent(cc.Sprite);
        avatarSprite.type = cc.Sprite.Type.SIMPLE;
        avatarSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        
        // 加载头像
        this._loadArenaPlayerAvatar(player.avatar, avatarSprite);
        avatarNode.parent = maskNode;
        
        maskNode.parent = itemNode;
        
        // 昵称
        var nameNode = new cc.Node("Name");
        nameNode.setPosition(0, -25);
        var nameLabel = nameNode.addComponent(cc.Label);
        nameLabel.string = player.player_name || player.name || ("玩家" + (index + 1));
        nameLabel.fontSize = 14;
        nameLabel.lineHeight = 18;
        nameNode.setContentSize(cc.size(90, 18));
        nameLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        
        // 🔧【修复】机器人和真人使用相同颜色，不再区分
        nameNode.color = cc.color(255, 255, 255);  // 统一白色
        nameNode.parent = itemNode;
        
        // 状态标签
        // 规则：根据 entered_at 判断是否已进入
        // - 已进入的玩家（包括机器人和真人）显示"已进入"
        // - 未进入的玩家显示"等待中"
        var statusNode = new cc.Node("Status");
        statusNode.setPosition(0, -45);
        var statusLabel = statusNode.addComponent(cc.Label);
        statusLabel.fontSize = 12;
        statusLabel.lineHeight = 14;
        statusLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        
        // 判断是否已进入：有 entered_at 且值大于0表示已进入
        if (player.entered_at && player.entered_at > 0) {
            statusLabel.string = "已进入";
            statusNode.color = cc.color(100, 255, 150);  // 绿色
        } else {
            statusLabel.string = "等待中";
            statusNode.color = cc.color(255, 200, 100);  // 橙色
        }
        statusNode.parent = itemNode;
        
        return itemNode;
    },
    
    /**
     * 加载玩家头像
     */
    _loadArenaPlayerAvatar: function(avatarUrl, sprite) {
        if (!sprite) return;
        
        var self = this;
        
        // 如果没有头像URL，使用默认头像
        if (!avatarUrl) {
            cc.resources.load('UI/headimage/avatar_1', cc.SpriteFrame, function(err, spriteFrame) {
                if (!err && spriteFrame && sprite && sprite.node && sprite.node.isValid) {
                    sprite.spriteFrame = spriteFrame;
                }
            });
            return;
        }
        
        // 如果是网络URL
        if (avatarUrl.indexOf('http://') === 0 || avatarUrl.indexOf('https://') === 0) {
            cc.assetManager.loadRemote(avatarUrl, { ext: '.png' }, function(err, texture) {
                if (!err && texture && sprite && sprite.node && sprite.node.isValid) {
                    try {
                        var sf = new cc.SpriteFrame(texture);
                        sprite.spriteFrame = sf;
                    } catch (e) {}
                }
            });
            return;
        }
        
        // 服务端上传的头像路径处理
        // 支持两种格式: "/uploads/file/..." 和 "uploads/file/..."
        var myglobal = window.myglobal;
        var cdnUrl = myglobal && myglobal.cdnUrl ? myglobal.cdnUrl : "https://apis.hongxiu88.com";
        
        if (avatarUrl.indexOf('/uploads/') === 0) {
            // 格式: /uploads/file/...
            var fullUrl = cdnUrl + avatarUrl;
            console.log("🏟️ [Avatar] 加载头像(格式1):", fullUrl);
            cc.assetManager.loadRemote(fullUrl, { ext: '.png' }, function(err, texture) {
                if (!err && texture && sprite && sprite.node && sprite.node.isValid) {
                    try {
                        var sf = new cc.SpriteFrame(texture);
                        sprite.spriteFrame = sf;
                    } catch (e) {
                        console.warn("🏟️ [Avatar] 头像加载失败:", fullUrl);
                    }
                } else if (err) {
                    console.warn("🏟️ [Avatar] 头像加载错误:", err);
                }
            });
            return;
        }
        
        if (avatarUrl.indexOf('uploads/') === 0) {
            // 格式: uploads/file/... (没有前导斜杠)
            var fullUrl = cdnUrl + '/' + avatarUrl;
            console.log("🏟️ [Avatar] 加载头像(格式2):", fullUrl);
            cc.assetManager.loadRemote(fullUrl, { ext: '.png' }, function(err, texture) {
                if (!err && texture && sprite && sprite.node && sprite.node.isValid) {
                    try {
                        var sf = new cc.SpriteFrame(texture);
                        sprite.spriteFrame = sf;
                    } catch (e) {
                        console.warn("🏟️ [Avatar] 头像加载失败:", fullUrl);
                    }
                } else if (err) {
                    console.warn("🏟️ [Avatar] 头像加载错误:", err);
                }
            });
            return;
        }
        
        // 默认本地资源
        cc.resources.load('UI/headimage/' + avatarUrl.replace(/\.png$|\.jpg$|\.jpeg$/gi, ''), cc.SpriteFrame, function(err, spriteFrame) {
            if (!err && spriteFrame && sprite && sprite.node && sprite.node.isValid) {
                sprite.spriteFrame = spriteFrame;
            }
        });
    },
    
    /**
     * 取消进入竞技场
     */
    _onArenaWaitingCancel: function() {
        console.log("🏟️ [ArenaWaiting] 玩家点击取消");
        
        // 发送取消进入请求
        var myglobal = window.myglobal;
        if (myglobal && myglobal.socket) {
            myglobal.socket.emit("arena_cancel_enter", {
                period_no: this._arenaWaitingData.periodNo,
                room_id: this._arenaWaitingData.roomId
            });
        }
        
        // 隐藏等待界面
        this._hideArenaWaitingUI();
    },
    
    // 🔧【新增】竞技场直接进入游戏场景（最多等待2秒）
    _enterArenaGameScene: function(matchData, roomConfig) {
        var self = this;
        var myglobal = window.myglobal;
        
        // 🔧【关键修复】防止重复进入游戏场景
        if (this._enterGameSceneInProgress) {
            console.log("🏟️ [Arena] 已在进入游戏场景中，跳过");
            return;
        }
        
        // 🔧【关键修复】设置标志，防止 room_joined 再次触发
        this._arenaRoomJoinedProcessed = true;
        
        // 显示简短加载提示
        this._showMessageCenter("正在进入竞技场...");
        
        // 🔧【关键修复】从 _arenaWaitingData 获取玩家数据
        var waitingPlayers = this._arenaWaitingData && this._arenaWaitingData.players ? this._arenaWaitingData.players : [];
        console.log("🏟️ [Arena] 从等待数据获取玩家数量:", waitingPlayers.length);
        
        // 🔧【关键修复】转换 players 数组为 playerdata 格式
        var playerdata = waitingPlayers.map(function(p, idx) {
            return {
                accountid: p.player_id || p.id,
                nick_name: p.player_name || p.name,
                avatar: p.avatar || "avatar_1",
                avatarUrl: p.avatar || "avatar_1",
                gold_count: p.gold_count || 0,
                goldcount: p.gold_count || 0,
                seatindex: idx + 1,
                isready: p.entered_at && p.entered_at > 0,
                is_robot: p.is_robot || false,
                room_category: 2,  // 竞技场
                period_no: matchData.period_no
            };
        });
        
        // 构造房间数据
        // 🔧【修复】竞技场房间号不添加 arena_ 前缀
        // 🔧【关键修复】如果 room_code 为空，不使用期号作为后备值，等待 ROOM_JOINED 消息更新
        var roomData = {
            room_code: matchData.room_code || "",  // 房间号不带前缀，为空时等待服务端更新
            room_id: matchData.room_id,
            room_name: matchData.room_name,
            room_category: 2,  // 竞技场
            base_score: roomConfig.base_score || 1,
            multiplier: roomConfig.multiplier || 1,
            period_no: matchData.period_no,
            match_rounds: matchData.match_rounds,
            playerdata: playerdata  // 🔧【关键修复】添加玩家数据
        };
        
        // 保存房间数据
        if (myglobal) {
            myglobal.roomData = roomData;
            myglobal.playerData = myglobal.playerData || {};
            myglobal.playerData.bottom = roomConfig.base_score || 1;
            myglobal.playerData.rate = roomConfig.multiplier || 1;
            console.log("🏟️ [Arena] myglobal.roomData 已设置, playerdata 数量:", playerdata.length);
        }
        
        // 🔧【关键】最多等待2秒后直接进入游戏场景
        var enterDelay = 500;  // 默认等待500ms
        
        // 如果有等待数据，可以适当延长
        if (matchData.wait_time && matchData.wait_time > 0) {
            enterDelay = Math.min(matchData.wait_time * 1000, 2000);  // 最多2秒
        }
        
        console.log("🏟️ [Arena] 将在 " + enterDelay + "ms 后进入游戏场景");
        
        // 设置定时器，延迟进入游戏场景
        this._arenaEnterTimer = setTimeout(function() {
            self._arenaEnterTimer = null;
            console.log("🏟️ [Arena] 进入游戏场景");
            self._enterGameScene(roomData);
        }, enterDelay);
    },
    
    /**
     * 🔧【新增】从 room_joined 消息进入游戏场景
     * 🔧【修复】正确转换 players 数组为 playerdata 格式，确保头像、金币等显示正常
     * 🔧【优化】检查是否有预加载数据，避免重复预加载
     */
    _enterArenaGameSceneFromRoomJoined: function(roomData) {
        console.log("🏟️ [Arena] 从 room_joined 进入游戏场景, roomData=" + JSON.stringify(roomData));
        
        // 🔧【关键修复】防止重复进入游戏场景
        if (this._enterGameSceneInProgress) {
            console.log("🏟️ [Arena] 已在进入游戏场景中，跳过（来自 room_joined）");
            return;
        }
        
        var myglobal = window.myglobal;
        
        // 🔧【关键修复】转换 players 数组为 playerdata 格式
        var players = roomData.players || [];
        var roomCategory = roomData.room_category || 2;  // 竞技场默认为2
        var periodNo = roomData.period_no || "";
        
        var playerdata = players.map(function(p, idx) {
            return {
                accountid: p.id,
                nick_name: p.name,
                avatar: p.avatar || "avatar_1",           // 🔧【修复】使用 avatar 字段
                avatarUrl: p.avatar || "avatar_1",        // 兼容两种写法
                gold_count: p.gold_count || 0,
                goldcount: p.gold_count || 0,             // 兼容旧客户端
                seatindex: (p.seat !== undefined ? p.seat : idx) + 1,
                isready: p.ready || true,                 // 竞技场玩家默认已准备
                match_coin: p.match_coin || 0,            // 竞技币
                arena_gold: p.arena_gold || 0,            // 🔧【新增】竞技场金币
                room_category: roomCategory,              // 🔧【关键修复】传递房间类型
                period_no: periodNo                       // 🔧【关键修复】传递期号
            };
        });
        
        console.log("🏟️ [Arena] 转换后的 playerdata 数量: " + playerdata.length + ", room_category=" + roomCategory);
        
        // 保存房间数据
        if (myglobal) {
            myglobal.roomData = {
                roomid: roomData.room_code,
                room_code: roomData.room_code,
                room_id: roomData.room_id,
                room_name: roomData.room_name || "竞技场",
                room_category: roomCategory,
                period_no: periodNo,
                base_score: roomData.base_score || 1,
                multiplier: roomData.multiplier || 1,
                seatindex: roomData.player ? roomData.player.seat + 1 : 1,
                playerdata: playerdata,                   // 🔧【关键修复】添加玩家数据
                housemanageid: roomData.creator_id || "",
                creator_id: roomData.creator_id || ""
            };
            
            myglobal.playerData = myglobal.playerData || {};
            myglobal.playerData.bottom = roomData.base_score || 1;
            myglobal.playerData.rate = roomData.multiplier || 1;
            
            // 保存玩家座位信息
            if (roomData.player) {
                myglobal.playerData.seatIndex = roomData.player.seat + 1;
            }
            
            console.log("🏟️ [Arena] myglobal.roomData 已保存, playerdata=" + playerdata.length + "人");
        }
        
        // 🔧【优化】检查是否有预加载的头像缓存
        var hasAvatarCache = myglobal && myglobal._avatarCache && Object.keys(myglobal._avatarCache).length > 0;
        console.log("🏟️ [Arena] 头像缓存状态:", hasAvatarCache ? "已有缓存" : "无缓存");
        
        // 🔧【优化】如果有预加载数据，直接进入场景；否则显示加载界面
        if (hasAvatarCache) {
            console.log("🏟️ [Arena] 使用预加载的头像缓存，直接进入场景");
            this._enterGameScene(myglobal.roomData);
        } else {
            // 没有预加载，显示加载界面并预加载头像
            this._showArenaLoadingAndPreload(playerdata, myglobal.roomData);
        }
    },

    /**
     * 🔧【新增】显示竞技场加载界面并预加载头像资源
     * 优化用户体验：倒计时结束后先显示加载动画，预加载完成后再进入场景
     */
    _showArenaLoadingAndPreload: function(playerdata, roomData) {
        var self = this;
        
        // 🔧【关键修复】防止重复调用
        if (this._arenaLoadingInProgress) {
            console.log("🏟️ [ArenaLoading] 已在进行中，跳过");
            return;
        }
        this._arenaLoadingInProgress = true;
        
        console.log("🏟️ [ArenaLoading] 显示加载界面，准备预加载头像...");
        
        // 显示加载界面
        self._showArenaLoadingUI();
        
        // 预加载所有玩家的头像
        var avatarUrls = [];
        for (var i = 0; i < playerdata.length; i++) {
            var avatarUrl = playerdata[i].avatar || playerdata[i].avatarUrl || "avatar_1";
            if (avatarUrl && avatarUrls.indexOf(avatarUrl) === -1) {
                avatarUrls.push(avatarUrl);
            }
        }
        
        console.log("🏟️ [ArenaLoading] 需要预加载的头像数量:", avatarUrls.length);
        
        // 如果没有头像需要加载，直接进入场景
        if (avatarUrls.length === 0) {
            self._hideArenaLoadingUI();
            self._enterGameScene(roomData);
            return;
        }
        
        // 预加载头像资源
        var loadedCount = 0;
        var totalCount = avatarUrls.length;
        
        var checkAllLoaded = function() {
            loadedCount++;
            console.log("🏟️ [ArenaLoading] 头像加载进度:", loadedCount + "/" + totalCount);
            
            if (loadedCount >= totalCount) {
                console.log("🏟️ [ArenaLoading] 所有头像预加载完成，准备进入场景");
                // 短暂延迟，让加载动画显示一会儿（至少500ms）
                setTimeout(function() {
                    self._hideArenaLoadingUI();
                    self._enterGameScene(roomData);
                }, 500);
            }
        };
        
        for (var j = 0; j < avatarUrls.length; j++) {
            var url = avatarUrls[j];
            self._preloadAvatar(url, checkAllLoaded);
        }
        
        // 设置超时保护（最多等待3秒）
        self._arenaLoadingTimeout = setTimeout(function() {
            console.warn("🏟️ [ArenaLoading] 预加载超时，强制进入场景");
            self._hideArenaLoadingUI();
            self._enterGameScene(roomData);
        }, 3000);
    },

    /**
     * 🔧【新增】预加载单个头像
     */
    _preloadAvatar: function(avatarUrl, callback) {
        // 判断是否是远程URL
        if (avatarUrl.indexOf('http://') === 0 || avatarUrl.indexOf('https://') === 0) {
            // 远程URL头像
            cc.assetManager.loadRemote(avatarUrl, { ext: '.png' }, function(err, texture) {
                if (err || !texture) {
                    console.warn("🏟️ [ArenaLoading] 远程头像预加载失败:", avatarUrl);
                } else {
                    console.log("🏟️ [ArenaLoading] 远程头像预加载成功:", avatarUrl);
                    // 缓存到 myglobal
                    var myglobal = window.myglobal;
                    if (myglobal) {
                        if (!myglobal._avatarCache) myglobal._avatarCache = {};
                        try {
                            myglobal._avatarCache[avatarUrl] = new cc.SpriteFrame(texture);
                        } catch (e) {
                            console.warn("🏟️ [ArenaLoading] 缓存头像失败:", e);
                        }
                    }
                }
                if (callback) callback();
            });
        } else {
            // 本地资源头像
            var localPath = "UI/headimage/" + avatarUrl;
            cc.loader.loadRes(localPath, cc.SpriteFrame, function(err, spriteFrame) {
                if (err || !spriteFrame) {
                    console.warn("🏟️ [ArenaLoading] 本地头像预加载失败:", localPath);
                } else {
                    console.log("🏟️ [ArenaLoading] 本地头像预加载成功:", localPath);
                    // 缓存到 myglobal
                    var myglobal = window.myglobal;
                    if (myglobal) {
                        if (!myglobal._avatarCache) myglobal._avatarCache = {};
                        myglobal._avatarCache[avatarUrl] = spriteFrame;
                    }
                }
                if (callback) callback();
            });
        }
    },

    /**
     * 🔧【新增】显示竞技场加载界面
     */
    _showArenaLoadingUI: function() {
        var self = this;
        
        // 安全检查
        if (!this.node || !this.node.isValid) {
            console.warn("🏟️ [ArenaLoading] 节点不存在，无法显示加载界面");
            return;
        }
        
        // 如果已经有加载界面，先销毁
        this._hideArenaLoadingUI();
        
        // 获取画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        
        // 创建遮罩层
        var maskNode = new cc.Node("ArenaLoadingMask");
        maskNode.setContentSize(cc.size(screenWidth * 2, screenHeight * 2));
        maskNode.color = cc.color(0, 0, 0);
        maskNode.opacity = 0;
        maskNode.zIndex = 9999;
        
        // 添加 BlockInputEvents 防止点击穿透
        maskNode.addComponent(cc.BlockInputEvents);
        maskNode.parent = this.node;
        
        // 创建加载动画容器
        var loadingContainer = new cc.Node("LoadingContainer");
        loadingContainer.parent = maskNode;
        
        // 尝试加载加载图片
        cc.resources.load('UI/loading_image', cc.SpriteFrame, function(err, spriteFrame) {
            if (!maskNode || !maskNode.isValid) return;
            
            if (err || !spriteFrame) {
                console.warn("🏟️ [ArenaLoading] 加载图片不存在，使用文字提示");
                // 降级：使用文字提示
                var loadingLabel = new cc.Node("LoadingLabel");
                var label = loadingLabel.addComponent(cc.Label);
                label.string = "房间分配中...";
                label.fontSize = 28;
                label.lineHeight = 36;
                label.fontFamily = "Arial";
                loadingLabel.color = cc.color(255, 255, 255);
                loadingLabel.parent = loadingContainer;
                
                // 添加"请稍候"提示
                var tipLabel = new cc.Node("TipLabel");
                tipLabel.y = -50;
                var tip = tipLabel.addComponent(cc.Label);
                tip.string = "请稍候";
                tip.fontSize = 20;
                tip.lineHeight = 28;
                tip.fontFamily = "Arial";
                tipLabel.color = cc.color(200, 200, 200);
                tipLabel.parent = loadingContainer;
            } else {
                // 使用加载图片
                var loadingImage = new cc.Node("LoadingImage");
                loadingImage.setContentSize(cc.size(100, 100));
                
                var sprite = loadingImage.addComponent(cc.Sprite);
                sprite.spriteFrame = spriteFrame;
                sprite.type = cc.Sprite.Type.SIMPLE;
                sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                
                loadingImage.parent = loadingContainer;
                
                // 保存引用用于旋转动画
                self._arenaLoadingImageNode = loadingImage;
                
                // 添加"房间分配中"文字
                var textLabel = new cc.Node("TextLabel");
                textLabel.y = -80;
                var label = textLabel.addComponent(cc.Label);
                label.string = "房间分配中...";
                label.fontSize = 24;
                label.lineHeight = 32;
                label.fontFamily = "Arial";
                textLabel.color = cc.color(255, 255, 255);
                textLabel.parent = loadingContainer;
            }
        });
        
        // 淡入动画
        cc.tween(maskNode)
            .to(0.2, { opacity: 220 })
            .start();
        
        // 保存引用
        this._arenaLoadingMask = maskNode;
        
        console.log("🏟️ [ArenaLoading] 加载界面已显示");
    },

    /**
     * 🔧【新增】隐藏竞技场加载界面
     */
    _hideArenaLoadingUI: function() {
        // 清除超时定时器
        if (this._arenaLoadingTimeout) {
            clearTimeout(this._arenaLoadingTimeout);
            this._arenaLoadingTimeout = null;
        }
        
        // 销毁加载界面
        if (this._arenaLoadingMask) {
            if (this._arenaLoadingMask.isValid) {
                this._arenaLoadingMask.destroy();
            }
            this._arenaLoadingMask = null;
        }
        
        this._arenaLoadingImageNode = null;
        
        console.log("🏟️ [ArenaLoading] 加载界面已隐藏");
    },

    // 🔧【新增】从配置初始化本地状态（作为备用）
    _initLocalArenaStatusFromConfig: function() {
        if (!this._arenaRooms) return;
        
        var now = Date.now();
        
        for (var i = 0; i < this._arenaRooms.length; i++) {
            var room = this._arenaRooms[i];
            var config = room.config;
            var roomId = config.id;
            
            // 如果已经有服务端推送的数据，跳过
            if (this._localArenaStatus[roomId]) continue;
            
            // 使用本地计算作为初始值
            var phaseInfo = this._calculatePhaseInfo(config);
            
            this._localArenaStatus[roomId] = {
                periodNo: phaseInfo.periodNo,
                periodNoStr: phaseInfo.periodNoStr,  // 新增：字符串格式期号
                phase: phaseInfo.phase,
                countdown: phaseInfo.countdown,
                canSignup: phaseInfo.canSignup,
                totalPlayers: 0,  // 🔧【修复】初始化报名人数为0
                statusText: "",
                lastUpdate: now,
                isLocalCalculated: true  // 标记为本地计算
            };
        }
        
        // 更新显示
        this._updateCountdownFromLocalCache();
    },

    // 🔧【新增】收到服务端推送时，更新本地状态缓存
    _onArenaStatusPush: function(arenas) {
        if (!arenas) return;
        
        var now = Date.now();
        
        // 🔧 调试：打印收到的完整数据
        
        // 更新本地状态缓存
        for (var i = 0; i < arenas.length; i++) {
            var arena = arenas[i];
            var roomId = arena.room_id;
            var newPeriodNoStr = arena.period_no_str || arena.periodNoStr || "";
            
            // 🔧 调试：打印每个竞技场的 total_players
            
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
            }
            
            // 保存服务端推送的状态（支持新字段）
            this._localArenaStatus[roomId] = {
                periodNo: arena.period_no,
                periodNoStr: newPeriodNoStr,
                phase: arena.phase || 0,
                countdown: arena.countdown,
                canSignup: arena.can_signup,
                totalPlayers: arena.total_players || arena.totalPlayers || 0,
                statusText: arena.status_text || arena.statusText || "",
                lastUpdate: now,
                isLocalCalculated: false  // 服务端推送
            };
        }
        
        // 立即更新显示
        this._updateCountdownFromLocalCache();
    },

    // 🔧【新增】每秒更新本地倒计时（减1）
    _updateLocalCountdown: function() {
        if (!this._localArenaStatus) return;
        
        var now = Date.now();
        var needUpdate = false;
        
        // 遍历所有竞技场，每秒减1
        for (var roomId in this._localArenaStatus) {
            var status = this._localArenaStatus[roomId];
            
            // 🔧【新增】容错机制：如果超过35秒没收到服务端推送，使用本地计算校准
            var timeSinceLastUpdate = (now - status.lastUpdate) / 1000;
            if (timeSinceLastUpdate > 35) {
                // 找到对应的配置
                var config = this._getArenaConfigByRoomId(parseInt(roomId));
                if (config) {
                    var phaseInfo = this._calculatePhaseInfo(config);
                    // 🔧【修复】检查期号是否变化，如果变化则重置报名人数和用户报名状态
                    if (status.periodNoStr !== phaseInfo.periodNoStr && phaseInfo.periodNoStr !== "") {
                        status.totalPlayers = 0;  // 期号变化，重置报名人数
                        
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
            }
            
            // 只对有倒计时的减1
            if (status.countdown > 0) {
                status.countdown--;
                needUpdate = true;
                
                // 如果倒计时刚刚变为0，立即使用本地计算切换阶段
                if (status.countdown === 0) {
                    var config = this._getArenaConfigByRoomId(parseInt(roomId));
                    if (config) {
                        var phaseInfo = this._calculatePhaseInfo(config);
                        // 🔧【修复】检查期号是否变化，如果变化则重置报名人数和用户报名状态
                        if (status.periodNoStr !== phaseInfo.periodNoStr && phaseInfo.periodNoStr !== "") {
                            status.totalPlayers = 0;  // 期号变化，重置报名人数
                            
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
        }
        
        // 如果有变化，更新显示
        if (needUpdate) {
            this._updateCountdownFromLocalCache();
        }
    },
    
    // 🔧【新增】计算阶段信息（用于本地校准）
    _calculatePhaseInfo: function(config) {
        var result = {
            phase: 0,
            countdown: -1,
            canSignup: false,
            periodNo: 0,
            periodNoStr: ""  // 新增：字符串格式期号
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
            var currentTotalSeconds = currentMinutes * 60 + currentSeconds;
            
            // 找到当前所在的时间段
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
            }
            
            // 计算从开赛时间到现在经过的秒数
            var rangeStartSeconds = rangeStartMinutes * 60;
            var elapsedSeconds = currentTotalSeconds - rangeStartSeconds;
            
            // 🔧【修复】使用配置的 matchDuration（分钟），与服务端保持一致
            // 服务端已修改为使用 matchDuration 配置，客户端也必须一致
            // 每期总时长（秒）= matchDuration（分钟）* 60
            var periodTotalSeconds = matchDuration * 60;
            
            // 准备阶段：固定60秒（1分钟）
            var prepareSeconds = 60;
            
            // 计算当前期号
            var periodNo = Math.floor(elapsedSeconds / periodTotalSeconds) + 1;
            
            // 计算本期内经过的秒数
            var periodElapsed = elapsedSeconds % periodTotalSeconds;
            
            // 🔧【新增】生成字符串格式期号
            // 新格式: YYMMDD + 房间ID(2位) + 期序号(4位) = 12位
            // 示例: 260506010034 = 2026年5月6日，房间ID=1，第0034期
            var year = String(now.getFullYear()).slice(-2);  // 取后两位
            var month = String(now.getMonth() + 1).padStart(2, '0');
            var day = String(now.getDate()).padStart(2, '0');
            var dateStr = year + month + day;  // YYMMDD (6位)
            
            // 房间ID (2位)
            var roomId = config.id || config.room_id || 0;
            var roomIdStr = String(roomId % 100).padStart(2, '0');  // 取后两位
            
            // 期序号 (4位)
            var seqStr = String(periodNo).padStart(4, '0');
            
            var periodNoStr = dateStr + roomIdStr + seqStr;  // 总共12位
            
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
    },

    // 🔧【新增】根据roomId获取竞技场配置
    _getArenaConfigByRoomId: function(roomId) {
        if (!this._arenaRooms) return null;
        
        for (var i = 0; i < this._arenaRooms.length; i++) {
            if (this._arenaRooms[i].config.id === roomId) {
                return this._arenaRooms[i].config;
            }
        }
        return null;
    },

    // 🔧【新增】从本地缓存更新倒计时显示
    _updateCountdownFromLocalCache: function() {
        if (!this._arenaRooms || !this._localArenaStatus) return;
        
        var cardPanel = this.node.getChildByName("CardContainer");
        var countdownContainer = cardPanel ? cardPanel.getChildByName("ArenaCountdowns") : null;
        var buttonContainer = cardPanel ? cardPanel.getChildByName("ArenaSignupButtons") : null;
        
        for (var i = 0; i < this._arenaRooms.length; i++) {
            var room = this._arenaRooms[i];
            var config = room.config;
            var roomId = config.id;
            
            // 获取本地缓存的状态
            var localStatus = this._localArenaStatus[roomId];
            if (!localStatus) continue;
            
            // 获取状态项节点
            var roomStatusItem = countdownContainer ? countdownContainer.getChildByName("RoomStatusItem_" + roomId) : null;
            if (!roomStatusItem) continue;
            
            var periodLabel = roomStatusItem.getChildByName("PeriodLabel");
            var titleLabel = roomStatusItem.getChildByName("TitleLabel");
            
            // 获取报名按钮
            var signupBtn = buttonContainer ? buttonContainer.getChildByName("SignupBtn_" + roomId) : null;
            
            // 更新时期号显示（使用新的字符串格式期号）
            if (periodLabel) {
                var periodLabelComp = periodLabel.getComponent(cc.Label);
                var periodNoStr = localStatus.period_no_str || localStatus.periodNoStr || localStatus.periodNo;
                if (periodNoStr && localStatus.phase !== 0) {
                    periodLabelComp.string = "期号: " + periodNoStr;
                    periodLabel.color = cc.color(255, 215, 0);  // 金色
                } else {
                    periodLabelComp.string = "期号: --";
                    periodLabel.color = cc.color(180, 180, 180);  // 灰色
                }
            }
            
            // 更新倒计时显示
            if (titleLabel) {
                var titleLabelComp = titleLabel.getComponent(cc.Label);
                var phase = localStatus.phase || 0;
                var totalPlayers = localStatus.total_players || localStatus.totalPlayers || 0;
                
                if (phase === 1) {
                    // 准备阶段
                    var secs = localStatus.countdown || 0;
                    titleLabelComp.string = "准备中 " + secs + "秒";
                    titleLabel.color = cc.color(255, 200, 100);  // 橙色
                } else if (phase === 2) {
                    // 报名阶段
                    var mins = Math.floor((localStatus.countdown || 0) / 60);
                    var secs = (localStatus.countdown || 0) % 60;
                    var countdownStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
                    titleLabelComp.string = "报名中 " + countdownStr + " (" + totalPlayers + "人)";
                    titleLabel.color = cc.color(0, 255, 100);  // 绿色
                } else {
                    // 未配置比赛时间或轮次
                    titleLabelComp.string = "暂未开放";
                    titleLabel.color = cc.color(200, 200, 200);  // 浅灰色
                }
            }
            
            // 更新报名按钮状态
            if (signupBtn) {
                var sprite = signupBtn.getComponent(cc.Sprite);
                var button = signupBtn.getComponent(cc.Button);
                
                // 按钮尺寸：160x65
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
    },

    // 根据服务端推送更新倒计时显示
    // 🔧【保留】兼容旧逻辑，但新逻辑使用 _onArenaStatusPush
    _updateCountdownFromServer: function(arenas) {
        // 直接调用新的处理函数
        this._onArenaStatusPush(arenas);
    },
    
    // 更新倒计时显示
    // 🔧【修改】现在使用本地缓存，不再本地计算
    _updateCountdownDisplay: function() {
        // 直接使用本地缓存更新显示
        this._updateCountdownFromLocalCache();
    },
    
    // 更新竞技场报名状态UI（使用图片资源）
    _updateArenaSignupStatus: function() {
        // 直接调用倒计时更新函数，它已经包含了按钮状态更新
        this._updateCountdownDisplay();
    },
    
    // ============================================================
    // 显示加载进度条
    // ============================================================
    _showLoadingProgress: function(roomConfig, playerGold) {
        var self = this;
        
        
        // 获取画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        
        // 创建加载界面容器（全屏）
        var loadingNode = new cc.Node("LoadingProgressNode");
        loadingNode.setContentSize(cc.size(screenWidth, screenHeight));
        loadingNode.anchorX = 0.5;
        loadingNode.anchorY = 0.5;
        loadingNode.x = 0;
        loadingNode.y = 0;
        loadingNode.zIndex = 3000;
        loadingNode.parent = this.node;
        
        // 添加半透明黑色背景
        var bgNode = new cc.Node("Bg");
        bgNode.setContentSize(cc.size(screenWidth, screenHeight));
        var bgGraphics = bgNode.addComponent(cc.Graphics);
        bgGraphics.fillColor = cc.color(20, 20, 40, 250);
        bgGraphics.rect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight);
        bgGraphics.fill();
        bgNode.parent = loadingNode;
        
        // 添加装饰性背景图案
        this._addLoadingDecorations(loadingNode, screenWidth, screenHeight);
        
        // 标题文字
        var titleNode = new cc.Node("Title");
        titleNode.y = 150;
        var titleLabel = titleNode.addComponent(cc.Label);
        titleLabel.string = "斗地主";
        titleLabel.fontSize = 56;
        titleLabel.lineHeight = 72;
        titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        titleNode.color = cc.color(255, 215, 0);
        
        // 添加标题描边
        var titleOutline = titleNode.addComponent(cc.LabelOutline);
        titleOutline.color = cc.color(139, 69, 19);
        titleOutline.width = 3;
        titleNode.parent = loadingNode;
        
        // 房间名称
        var roomNameNode = new cc.Node("RoomName");
        roomNameNode.y = 80;
        var roomNameLabel = roomNameNode.addComponent(cc.Label);
        roomNameLabel.string = "进入【" + roomConfig.room_name + "】";
        roomNameLabel.fontSize = 32;
        roomNameLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        roomNameNode.color = cc.color(200, 200, 220);
        roomNameNode.parent = loadingNode;
        
        // 加载提示文字
        var tipNode = new cc.Node("Tip");
        tipNode.y = -100;
        var tipLabel = tipNode.addComponent(cc.Label);
        tipLabel.string = "正在加载资源...";
        tipLabel.fontSize = 24;
        tipLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        tipNode.color = cc.color(150, 150, 170);
        tipNode.parent = loadingNode;
        
        // 进度条背景
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
        progressBg.parent = loadingNode;
        
        // 进度条填充
        var progressFill = new cc.Node("ProgressFill");
        progressFill.y = -160;
        var progressFillGraphics = progressFill.addComponent(cc.Graphics);
        progressFill.parent = loadingNode;
        
        // 进度百分比文字
        var percentNode = new cc.Node("Percent");
        percentNode.y = -160;
        var percentLabel = percentNode.addComponent(cc.Label);
        percentLabel.string = "0%";
        percentLabel.fontSize = 20;
        percentLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        percentNode.color = cc.color(255, 255, 255);
        percentNode.parent = loadingNode;
        
        // 底部提示
        var bottomTipNode = new cc.Node("BottomTip");
        bottomTipNode.y = -220;
        var bottomTipLabel = bottomTipNode.addComponent(cc.Label);
        bottomTipLabel.string = "正在连接服务器...";
        bottomTipLabel.fontSize = 18;
        bottomTipLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        bottomTipNode.color = cc.color(100, 100, 120);
        bottomTipNode.parent = loadingNode;
        
        // 加载提示文字数组
        var loadingTips = [
            "正在加载资源...",
            "正在连接服务器...",
            "正在获取房间列表...",
            "正在准备游戏数据...",
            "即将进入房间..."
        ];
        
        // 进度动画
        var progress = 0;
        var targetProgress = 100;
        var tipIndex = 0;
        
        var updateProgress = function() {
            if (progress >= targetProgress) {
                // 进度完成，显示房间列表场景
                self.scheduleOnce(function() {
                    if (loadingNode && loadingNode.isValid) {
                        loadingNode.destroy();
                    }
                    self._showRoomListScene(roomConfig, playerGold);
                }, 0.3);
                return;
            }
            
            // 增加进度
            progress += 2;
            if (progress > targetProgress) progress = targetProgress;
            
            // 更新进度条填充
            var fillWidth = (progress / 100) * 480;
            progressFillGraphics.clear();
            if (fillWidth > 0) {
                // 渐变色效果
                progressFillGraphics.fillColor = cc.color(76, 175, 80);
                progressFillGraphics.roundRect(-240, -12, fillWidth, 24, 12);
                progressFillGraphics.fill();
            }
            
            // 更新百分比文字
            percentLabel.string = progress + "%";
            
            // 更新加载提示文字
            var newTipIndex = Math.floor(progress / 20);
            if (newTipIndex < loadingTips.length && newTipIndex !== tipIndex) {
                tipIndex = newTipIndex;
                tipLabel.string = loadingTips[tipIndex];
                bottomTipLabel.string = loadingTips[tipIndex];
            }
            
            self.scheduleOnce(updateProgress, 0.05);
        };
        
        // 开始进度动画
        updateProgress();
    },
    
    // 添加加载界面装饰
    _addLoadingDecorations: function(parentNode, screenWidth, screenHeight) {
        // 添加扑克牌装饰（四角）
        var cardSymbols = ["♠", "♥", "♣", "♦"];
        var cardColors = [
            cc.color(50, 50, 70, 100),
            cc.color(180, 50, 50, 100),
            cc.color(50, 50, 70, 100),
            cc.color(180, 50, 50, 100)
        ];
        
        var positions = [
            cc.v2(-screenWidth/2 + 80, screenHeight/2 - 80),
            cc.v2(screenWidth/2 - 80, screenHeight/2 - 80),
            cc.v2(-screenWidth/2 + 80, -screenHeight/2 + 80),
            cc.v2(screenWidth/2 - 80, -screenHeight/2 + 80)
        ];
        
        for (var i = 0; i < 4; i++) {
            var symbolNode = new cc.Node("CardSymbol" + i);
            symbolNode.setPosition(positions[i]);
            var symbolLabel = symbolNode.addComponent(cc.Label);
            symbolLabel.string = cardSymbols[i];
            symbolLabel.fontSize = 60;
            symbolNode.color = cardColors[i];
            symbolNode.parent = parentNode;
        }
    },
    
    // ============================================================
    // 显示房间列表场景（全屏游戏界面）
    // ============================================================
    _showRoomListScene: function(roomConfig, playerGold) {
        var self = this;
        var myglobal = window.myglobal;
        
        
        // 移除旧的界面
        var oldScene = this.node.getChildByName("RoomListScene");
        if (oldScene) oldScene.destroy();
        
        // 获取画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        
        // 创建全屏房间列表场景
        var sceneNode = new cc.Node("RoomListScene");
        sceneNode.setContentSize(cc.size(screenWidth, screenHeight));
        sceneNode.anchorX = 0.5;
        sceneNode.anchorY = 0.5;
        sceneNode.x = 0;
        sceneNode.y = 0;
        sceneNode.zIndex = 2500;
        sceneNode.parent = this.node;
        
        // ===== 背景层 =====
        this._createRoomListBackground(sceneNode, screenWidth, screenHeight);
        
        // ===== 顶部标题区域 =====
        this._createRoomListHeader(sceneNode, screenWidth, screenHeight, roomConfig);
        
        // ===== 操作按钮区域 =====
        this._createRoomListActions(sceneNode, screenWidth, screenHeight, roomConfig, playerGold);
        
        // ===== 房间列表区域 =====
        this._createRoomListContent(sceneNode, screenWidth, screenHeight, roomConfig, playerGold);
        
        // ===== 底部信息栏 =====
        this._createRoomListFooter(sceneNode, screenWidth, screenHeight, playerGold, roomConfig);
    },
    
    // 创建背景
    _createRoomListBackground: function(parentNode, screenWidth, screenHeight) {
        // 主背景
        var bgNode = new cc.Node("BgLayer");
        bgNode.setContentSize(cc.size(screenWidth, screenHeight));
        
        var bgGraphics = bgNode.addComponent(cc.Graphics);
        bgGraphics.fillColor = cc.color(20, 25, 45, 255);
        bgGraphics.rect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight);
        bgGraphics.fill();
        bgNode.parent = parentNode;
        
        // 装饰边框
        var borderNode = new cc.Node("Border");
        var borderGraphics = borderNode.addComponent(cc.Graphics);
        borderGraphics.strokeColor = cc.color(180, 140, 60, 150);
        borderGraphics.lineWidth = 3;
        borderGraphics.roundRect(-screenWidth/2 + 5, -screenHeight/2 + 5, screenWidth - 10, screenHeight - 10, 10);
        borderGraphics.stroke();
        borderNode.parent = parentNode;
        
        // 角落装饰
        var corners = [
            { x: -screenWidth/2 + 30, y: screenHeight/2 - 30, rot: 0 },
            { x: screenWidth/2 - 30, y: screenHeight/2 - 30, rot: 90 },
            { x: screenWidth/2 - 30, y: -screenHeight/2 + 30, rot: 180 },
            { x: -screenWidth/2 + 30, y: -screenHeight/2 + 30, rot: 270 }
        ];
        
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
    },
    
    // 创建顶部标题区域
    _createRoomListHeader: function(parentNode, screenWidth, screenHeight, roomConfig) {
        var headerY = screenHeight/2 - 55;
        var headerHeight = 80;  // 增加标题栏高度
        
        // 标题背景
        var headerBg = new cc.Node("HeaderBg");
        headerBg.setContentSize(cc.size(screenWidth - 60, headerHeight));
        headerBg.setPosition(0, headerY);
        
        var hg = headerBg.addComponent(cc.Graphics);
        hg.fillColor = cc.color(35, 30, 50, 240);
        hg.roundRect(-(screenWidth - 60)/2, -headerHeight/2, screenWidth - 60, headerHeight, 8);
        hg.fill();
        hg.strokeColor = cc.color(180, 140, 60, 200);
        hg.lineWidth = 2;
        hg.roundRect(-(screenWidth - 60)/2, -headerHeight/2, screenWidth - 60, headerHeight, 8);
        hg.stroke();
        headerBg.parent = parentNode;
        
        // 左侧装饰
        var leftDeco = new cc.Node("LeftDeco");
        leftDeco.setPosition(-screenWidth/2 + 80, headerY);
        var ld = leftDeco.addComponent(cc.Graphics);
        ld.fillColor = cc.color(200, 160, 60, 220);
        ld.circle(0, 0, 8);
        ld.fill();
        leftDeco.parent = parentNode;
        
        // 右侧装饰
        var rightDeco = new cc.Node("RightDeco");
        rightDeco.setPosition(screenWidth/2 - 80, headerY);
        var rd = rightDeco.addComponent(cc.Graphics);
        rd.fillColor = cc.color(200, 160, 60, 220);
        rd.circle(0, 0, 8);
        rd.fill();
        rightDeco.parent = parentNode;
        
        // 房间名称 - 位于标题栏上半部分
        var titleText = new cc.Node("TitleText");
        titleText.setPosition(0, headerY + 12);  // 上移到标题栏上半部分
        titleText.anchorX = 0.5;
        titleText.anchorY = 0.5;
        
        var titleLabel = titleText.addComponent(cc.Label);
        titleLabel.string = roomConfig.room_name || "游戏房间";
        titleLabel.fontSize = 28;  // 调整字体大小
        titleLabel.lineHeight = 36;
        titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        titleText.color = cc.color(255, 220, 100);
        
        var titleOutline = titleText.addComponent(cc.LabelOutline);
        titleOutline.color = cc.color(80, 50, 0);
        titleOutline.width = 2;
        titleText.parent = parentNode;
        
        // 副标题 - 位于标题栏下半部分，与标题分开
        var subText = new cc.Node("SubText");
        subText.setPosition(0, headerY - 14);  // 下移到标题栏下半部分
        subText.anchorX = 0.5;
        subText.anchorY = 0.5;
        
        var subLabel = subText.addComponent(cc.Label);
        subLabel.string = "底分 " + (roomConfig.base_score || 1) + "  ·  倍率 " + (roomConfig.multiplier || 1) + "x";
        subLabel.fontSize = 18;  // 增大字体
        subLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        subText.color = cc.color(200, 180, 140);
        subText.parent = parentNode;
    },
    
    // 创建操作按钮区域 - 简洁清晰的设计
    _createRoomListActions: function(parentNode, screenWidth, screenHeight, roomConfig, playerGold) {
        var self = this;
        
        // 操作栏背景 - 增加高度以容纳更大的元素
        var actionBarY = screenHeight/2 - 125;
        var actionBarHeight = 65;  // 增加高度
        
        var actionBarBg = new cc.Node("ActionBarBg");
        actionBarBg.setPosition(0, actionBarY);
        var abg = actionBarBg.addComponent(cc.Graphics);
        abg.fillColor = cc.color(30, 27, 45, 230);
        abg.roundRect(-screenWidth/2 + 30, -actionBarHeight/2, screenWidth - 60, actionBarHeight, 6);
        abg.fill();
        actionBarBg.parent = parentNode;
        
        // ===== 左侧：房间号输入和加入按钮 =====
        var leftX = -screenWidth/2 + 200;  // 调整位置
        
        // 输入框 - 增加宽度
        var roomCodeInput = this._createSimpleInputBox(
            "输入房间号",
            leftX, actionBarY,
            180, 44  // 增加尺寸
        );
        roomCodeInput.parent = parentNode;
        
        // 加入房间按钮 - 增加宽度
        var joinBtn = this._createActionButton(
            "加入房间",
            cc.color(76, 175, 80),  // 绿色
            leftX + 160, actionBarY,
            110, 44,  // 增加尺寸
            function() {
                var input = parentNode.getChildByName("RoomCodeInput");
                var editBox = input ? input.getComponent(cc.EditBox) : null;
                var code = editBox ? editBox.string : "";
                if (code && code.length > 0) {
                    self._joinRoom(code, roomConfig, playerGold);
                } else {
                    self._showTipInScene(parentNode, "请输入房间号");
                }
            }
        );
        joinBtn.parent = parentNode;
        
        // ===== 右侧：创建房间和快速开始按钮 =====
        var rightX = screenWidth/2 - 170;
        
        // 创建房间按钮 - 增加宽度
        var createBtn = this._createActionButton(
            "创建房间",
            cc.color(255, 152, 0),  // 橙色
            rightX - 85, actionBarY,
            120, 44,  // 增加尺寸
            function() {
                self._showCreateRoomDialog(parentNode, roomConfig, playerGold);
            }
        );
        createBtn.parent = parentNode;
        
        // 快速开始按钮 - 增加宽度
        var quickBtn = this._createActionButton(
            "快速开始",
            cc.color(33, 150, 243),  // 蓝色
            rightX + 85, actionBarY,
            120, 44,  // 增加尺寸
            function() {
                var scene = parentNode.getChildByName("RoomListScene") || parentNode;
                if (scene.destroy) scene.destroy();
                self._quickMatch(roomConfig, playerGold);
            }
        );
        quickBtn.parent = parentNode;
    },
    
    // 创建简单的输入框 - 使用 EditBox 组件
    _createSimpleInputBox: function(placeholder, x, y, width, height) {
        var inputNode = new cc.Node("RoomCodeInput");
        inputNode.setContentSize(cc.size(width, height));
        inputNode.setPosition(x, y);
        inputNode.anchorX = 0.5;
        inputNode.anchorY = 0.5;
        
        // 背景
        var bg = inputNode.addComponent(cc.Graphics);
        bg.fillColor = cc.color(45, 40, 60, 255);
        bg.roundRect(-width/2, -height/2, width, height, 6);
        bg.fill();
        bg.strokeColor = cc.color(120, 100, 70, 220);
        bg.lineWidth = 2;
        bg.roundRect(-width/2, -height/2, width, height, 6);
        bg.stroke();
        
        // 使用 EditBox 组件实现真正的输入框
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
        editBox.lineHeight = height - 8;
        
        // 添加内边距效果（通过调整背景）
        editBox.node.on('editing-did-begin', function() {
            bg.clear();
            bg.fillColor = cc.color(55, 50, 75, 255);
            bg.roundRect(-width/2, -height/2, width, height, 6);
            bg.fill();
            bg.strokeColor = cc.color(180, 150, 80, 255);
            bg.lineWidth = 2;
            bg.roundRect(-width/2, -height/2, width, height, 6);
            bg.stroke();
        });
        
        editBox.node.on('editing-did-end', function() {
            bg.clear();
            bg.fillColor = cc.color(45, 40, 60, 255);
            bg.roundRect(-width/2, -height/2, width, height, 6);
            bg.fill();
            bg.strokeColor = cc.color(120, 100, 70, 220);
            bg.lineWidth = 2;
            bg.roundRect(-width/2, -height/2, width, height, 6);
            bg.stroke();
        });
        
        return inputNode;
    },
    
    // 创建操作按钮
    _createActionButton: function(text, bgColor, x, y, width, height, callback) {
        var btn = new cc.Node("ActionBtn_" + text);
        btn.setContentSize(cc.size(width, height));
        btn.setPosition(x, y);
        btn.anchorX = 0.5;
        btn.anchorY = 0.5;
        
        // 背景 - 增加圆角
        var bg = btn.addComponent(cc.Graphics);
        bg.fillColor = bgColor;
        bg.roundRect(-width/2, -height/2, width, height, 8);
        bg.fill();
        // 添加高光效果
        bg.fillColor = cc.color(255, 255, 255, 40);
        bg.roundRect(-width/2 + 2, 2, width - 4, height/2 - 2, 6);
        bg.fill();
        
        // 文字 - 增大字体
        var textNode = new cc.Node("Text");
        textNode.anchorX = 0.5;
        textNode.anchorY = 0.5;
        var label = textNode.addComponent(cc.Label);
        label.string = text;
        label.fontSize = 18;  // 增大字体
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        textNode.color = cc.color(255, 255, 255);
        
        // 添加文字描边
        var outline = textNode.addComponent(cc.LabelOutline);
        outline.color = cc.color(0, 0, 0, 150);
        outline.width = 1;
        textNode.parent = btn;
        
        // 触摸效果
        btn.on(cc.Node.EventType.TOUCH_START, function(event) {
            event.stopPropagation();
            btn.scale = 0.95;
        });
        btn.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            btn.scale = 1;
            if (callback) callback();
        });
        btn.on(cc.Node.EventType.TOUCH_CANCEL, function(event) {
            btn.scale = 1;
        });
        
        return btn;
    },
    
    // 创建房间列表区域 - 简洁清晰的设计
    _createRoomListContent: function(parentNode, screenWidth, screenHeight, roomConfig, playerGold) {
        var self = this;
        
        // 列表区域位置和尺寸 - 调整以适应新的操作栏高度
        var listY = -30;  // 调整位置
        var listHeight = screenHeight - 280;  // 调整高度
        var listWidth = screenWidth - 60;
        
        // 列表背景
        var listBg = new cc.Node("ListBg");
        listBg.setContentSize(cc.size(listWidth, listHeight));
        listBg.setPosition(0, listY);
        
        var lg = listBg.addComponent(cc.Graphics);
        lg.fillColor = cc.color(25, 22, 40, 240);
        lg.roundRect(-listWidth/2, -listHeight/2, listWidth, listHeight, 8);
        lg.fill();
        lg.strokeColor = cc.color(80, 65, 50, 150);
        lg.lineWidth = 1;
        lg.roundRect(-listWidth/2, -listHeight/2, listWidth, listHeight, 8);
        lg.stroke();
        listBg.parent = parentNode;
        
        // ===== 表头 =====
        var headerY = listY + listHeight/2 - 25;
        
        // 表头背景
        var headerBg = new cc.Node("TableHeader");
        headerBg.setPosition(0, headerY);
        var hbg = headerBg.addComponent(cc.Graphics);
        hbg.fillColor = cc.color(40, 35, 55, 255);
        hbg.roundRect(-listWidth/2 + 5, -20, listWidth - 10, 40, 4);
        hbg.fill();
        headerBg.parent = parentNode;
        
        // 表头文字 - 增大字体
        var colWidth = listWidth / 5;
        var headers = ["房间号", "人数", "底分", "状态", "操作"];
        for (var i = 0; i < headers.length; i++) {
            var hNode = new cc.Node("H" + i);
            hNode.x = -listWidth/2 + colWidth * (i + 0.5);
            hNode.y = headerY;
            hNode.anchorX = 0.5;
            hNode.anchorY = 0.5;
            
            var hl = hNode.addComponent(cc.Label);
            hl.string = headers[i];
            hl.fontSize = 16;  // 增大字体
            hl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            hNode.color = cc.color(240, 200, 120);
            
            // 添加描边
            var outline = hNode.addComponent(cc.LabelOutline);
            outline.color = cc.color(60, 50, 40);
            outline.width = 1;
            hNode.parent = parentNode;
        }
        
        // ===== 房间列表容器 =====
        var roomContainer = new cc.Node("RoomListContainer");
        roomContainer.setContentSize(cc.size(listWidth - 20, listHeight - 70));
        roomContainer.y = listY - 20;
        roomContainer.parent = parentNode;
        
        // 加载提示
        var loadingNode = new cc.Node("LoadingLabel");
        loadingNode.anchorX = 0.5;
        loadingNode.anchorY = 0.5;
        var ll = loadingNode.addComponent(cc.Label);
        ll.string = "正在加载房间列表...";
        ll.fontSize = 18;  // 增大字体
        ll.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        loadingNode.color = cc.color(160, 150, 140);
        loadingNode.parent = roomContainer;
        
        // 获取房间列表
        this._fetchAndRenderRoomListForScene(roomContainer, loadingNode, roomConfig, playerGold, parentNode);
    },
    
    // 创建底部信息栏 - 简洁设计
    _createRoomListFooter: function(parentNode, screenWidth, screenHeight, playerGold, roomConfig) {
        var self = this;
        var footerY = -screenHeight/2 + 50;  // 调整位置
        
        // 底部背景
        var footerBg = new cc.Node("FooterBg");
        footerBg.setPosition(0, footerY);
        var fg = footerBg.addComponent(cc.Graphics);
        fg.fillColor = cc.color(28, 25, 42, 240);
        fg.roundRect(-screenWidth/2 + 30, -25, screenWidth - 60, 50, 6);
        fg.fill();
        footerBg.parent = parentNode;
        
        // 返回按钮 - 增大尺寸
        var backBtn = this._createActionButton(
            "返回大厅",
            cc.color(90, 85, 100),
            -screenWidth/2 + 120, footerY,
            110, 40,  // 增加尺寸
            function() {
                var scene = parentNode.getChildByName("RoomListScene") || parentNode;
                if (scene.destroy) scene.destroy();
            }
        );
        backBtn.parent = parentNode;
        
        // 金币显示
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
        goldText.parent = parentNode;
        
        // 刷新按钮 - 增大尺寸
        var refreshBtn = this._createActionButton(
            "刷新列表",
            cc.color(60, 130, 180),
            screenWidth/2 - 100, footerY,
            100, 40,  // 增加尺寸
            function() {
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
            }
        );
        refreshBtn.parent = parentNode;
    },
    
    // 创建按钮节点（文字在按钮内部）
    _createButtonNode: function(text, bgColor, x, y, width, height, callback, isPrimary) {
        var btn = new cc.Node("Btn_" + text);
        btn.setContentSize(cc.size(width, height));
        btn.setPosition(x, y);
        btn.anchorX = 0.5;
        btn.anchorY = 0.5;
        
        // 按钮背景节点
        var bgNode = new cc.Node("BgNode");
        bgNode.setPosition(0, 0);
        bgNode.anchorX = 0.5;
        bgNode.anchorY = 0.5;
        
        var bg = bgNode.addComponent(cc.Graphics);
        
        // 绘制按钮背景
        bg.fillColor = bgColor;
        bg.roundRect(-width/2, -height/2, width, height, 5);
        bg.fill();
        
        // 边框
        var borderColor = cc.color(
            Math.min(255, bgColor.r + 40),
            Math.min(255, bgColor.g + 40),
            Math.min(255, bgColor.b + 40)
        );
        bg.strokeColor = borderColor;
        bg.lineWidth = 1;
        bg.roundRect(-width/2, -height/2, width, height, 5);
        bg.stroke();
        
        // 主按钮高光
        if (isPrimary) {
            bg.fillColor = cc.color(255, 255, 255, 50);
            bg.roundRect(-width/2 + 2, 2, width - 4, height/2 - 2, 3);
            bg.fill();
        }
        bgNode.parent = btn;
        
        // 按钮文字节点（独立的子节点）
        var textNode = new cc.Node("TextNode");
        textNode.setPosition(0, 0);  // 必须设置位置为按钮中心
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
        textNode.parent = btn;
        
        // 触摸事件
        btn.on(cc.Node.EventType.TOUCH_START, function(event) {
            event.stopPropagation();
            btn.scale = 0.95;
        });
        btn.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            btn.scale = 1;
            if (callback) callback();
        });
        btn.on(cc.Node.EventType.TOUCH_CANCEL, function(event) {
            btn.scale = 1;
        });
        
        return btn;
    },
    
    // 创建使用图片的按钮节点
    _createImageButtonNode: function(imagePath, text, x, y, width, height, callback) {
        var self = this;
        var btn = new cc.Node("Btn_" + text);
        btn.setContentSize(cc.size(width, height));
        btn.setPosition(x, y);
        btn.anchorX = 0.5;
        btn.anchorY = 0.5;
        
        // 添加 Sprite 组件
        var sprite = btn.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        
        // 加载按钮图片
        cc.resources.load(imagePath, cc.SpriteFrame, function(err, spriteFrame) {
            if (err) {
                console.warn("加载按钮图片失败:", imagePath);
                // 使用备用样式
                self._createButtonFallback(btn, text, width, height);
                return;
            }
            sprite.spriteFrame = spriteFrame;
        });
        
        // 添加 Button 组件
        var button = btn.addComponent(cc.Button);
        button.transition = cc.Button.Transition.SCALE;
        button.duration = 0.1;
        button.zoomScale = 0.95;
        
        // 触摸事件
        btn.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            if (callback) callback();
        });
        
        return btn;
    },
    
    // 按钮备用样式（图片加载失败时使用）
    _createButtonFallback: function(btn, text, width, height) {
        // 绘制按钮背景
        var graphics = btn.addComponent(cc.Graphics);
        
        // 根据按钮文字选择颜色
        var bgColor;
        if (text.indexOf("创建") >= 0) {
            bgColor = cc.color(30, 90, 160);  // 蓝色
        } else if (text.indexOf("加入") >= 0 || text.indexOf("进入") >= 0) {
            bgColor = cc.color(40, 130, 60);  // 绿色
        } else if (text.indexOf("快速") >= 0) {
            bgColor = cc.color(200, 120, 40);  // 橙色
        } else {
            bgColor = cc.color(80, 80, 80);  // 灰色
        }
        
        graphics.fillColor = bgColor;
        graphics.roundRect(-width/2, -height/2, width, height, 6);
        graphics.fill();
        graphics.strokeColor = cc.color(255, 255, 255, 80);
        graphics.lineWidth = 2;
        graphics.roundRect(-width/2, -height/2, width, height, 6);
        graphics.stroke();
        
        // 添加文字
        var labelNode = new cc.Node("Label");
        var label = labelNode.addComponent(cc.Label);
        label.string = text;
        label.fontSize = Math.floor(height * 0.4);
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        labelNode.color = cc.color(255, 255, 255);
        labelNode.parent = btn;
    },
    
    // 创建输入框节点
    _createInputNode: function(placeholder, x, y, width, height) {
        var inputNode = new cc.Node("InputNode");
        inputNode.setContentSize(cc.size(width, height));
        inputNode.setPosition(x, y);
        inputNode.anchorX = 0.5;
        inputNode.anchorY = 0.5;
        inputNode.name = "RoomCodeInput";
        
        // 输入框背景
        var bgNode = new cc.Node("InputBg");
        bgNode.setPosition(0, 0);
        bgNode.anchorX = 0.5;
        bgNode.anchorY = 0.5;
        
        var bg = bgNode.addComponent(cc.Graphics);
        bg.fillColor = cc.color(45, 40, 60, 255);
        bg.roundRect(-width/2, -height/2, width, height, 5);
        bg.fill();
        bg.strokeColor = cc.color(100, 90, 70, 200);
        bg.lineWidth = 1;
        bg.roundRect(-width/2, -height/2, width, height, 5);
        bg.stroke();
        bgNode.parent = inputNode;
        
        // placeholder文字节点
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
    },
    
    // 创建样式化按钮
    _createStyledButton: function(text, color, x, callback, width, height) {
        width = width || 100;
        height = height || 40;
        
        var btn = new cc.Node("Btn_" + text);
        btn.setContentSize(cc.size(width, height));
        btn.setPosition(x, 0);
        
        // 按钮背景
        var bg = btn.addComponent(cc.Graphics);
        bg.fillColor = color;
        bg.roundRect(-width/2, -height/2, width, height, 8);
        bg.fill();
        
        // 按钮文字
        var label = btn.addComponent(cc.Label);
        label.string = text;
        label.fontSize = 18;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        btn.color = cc.color(255, 255, 255);
        
        // 触摸效果
        btn.on(cc.Node.EventType.TOUCH_START, function(event) {
            event.stopPropagation();
            btn.scale = 0.95;
        });
        btn.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            btn.scale = 1;
            if (callback) callback();
        });
        btn.on(cc.Node.EventType.TOUCH_CANCEL, function(event) {
            btn.scale = 1;
        });
        
        return btn;
    },
    
    // 在场景中显示提示
    _showTipInScene: function(sceneNode, message) {
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
        
        this.scheduleOnce(function() {
            if (tipNode && tipNode.isValid) tipNode.destroy();
        }, 2);
    },
    
    // ============================================================
    // 显示创建房间弹窗（简洁清晰的设计）
    // ============================================================
    _showCreateRoomDialog: function(parentNode, roomConfig, playerGold) {
        var self = this;
        
        
        // 移除旧弹窗
        var oldDialog = parentNode.getChildByName("CreateRoomDialog");
        if (oldDialog) oldDialog.destroy();
        
        // 获取画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        
        // 弹窗容器
        var dialog = new cc.Node("CreateRoomDialog");
        dialog.setContentSize(cc.size(screenWidth, screenHeight));
        dialog.setPosition(0, 0);
        dialog.zIndex = 3000;
        dialog.parent = parentNode;
        
        // 半透明遮罩
        var mask = new cc.Node("Mask");
        mask.setContentSize(cc.size(screenWidth, screenHeight));
        var maskG = mask.addComponent(cc.Graphics);
        maskG.fillColor = cc.color(0, 0, 0, 180);
        maskG.rect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight);
        maskG.fill();
        mask.parent = dialog;
        
        // 点击遮罩关闭
        mask.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            dialog.destroy();
        });
        
        // ===== 弹窗主体 =====
        var dialogWidth = 480;  // 增加宽度
        var dialogHeight = 420;  // 增加高度
        
        // 弹窗背景
        var dialogBg = new cc.Node("DialogBg");
        dialogBg.setContentSize(cc.size(dialogWidth, dialogHeight));
        
        var dbg = dialogBg.addComponent(cc.Graphics);
        // 阴影
        dbg.fillColor = cc.color(0, 0, 0, 80);
        dbg.roundRect(-dialogWidth/2 + 5, -dialogHeight/2 - 5, dialogWidth, dialogHeight, 12);
        dbg.fill();
        // 主背景
        dbg.fillColor = cc.color(35, 32, 50, 255);
        dbg.roundRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 12);
        dbg.fill();
        // 边框
        dbg.strokeColor = cc.color(255, 180, 60, 200);
        dbg.lineWidth = 2;
        dbg.roundRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 12);
        dbg.stroke();
        dialogBg.parent = dialog;
        
        // ===== 顶部标题栏 =====
        var headerBar = new cc.Node("HeaderBar");
        headerBar.y = dialogHeight/2 - 30;
        
        var hbg = headerBar.addComponent(cc.Graphics);
        hbg.fillColor = cc.color(255, 152, 0);  // 橙色主题
        hbg.roundRect(-dialogWidth/2, -25, dialogWidth, 50, [12, 12, 0, 0]);
        hbg.fill();
        headerBar.parent = dialog;
        
        // 标题文字
        var titleText = new cc.Node("Title");
        titleText.y = dialogHeight/2 - 30;
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
        titleText.parent = dialog;
        
        // 关闭按钮
        var closeBtn = new cc.Node("CloseBtn");
        closeBtn.setContentSize(cc.size(30, 30));
        closeBtn.x = dialogWidth/2 - 25;
        closeBtn.y = dialogHeight/2 - 30;
        
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
        
        closeBtn.on(cc.Node.EventType.TOUCH_END, function() {
            dialog.destroy();
        });
        
        // ===== 房间类型显示 =====
        var roomTypeBg = new cc.Node("RoomTypeBg");
        roomTypeBg.y = dialogHeight/2 - 80;
        var rtbg = roomTypeBg.addComponent(cc.Graphics);
        rtbg.fillColor = cc.color(60, 55, 80, 200);
        rtbg.roundRect(-80, -16, 160, 32, 16);
        rtbg.fill();
        roomTypeBg.parent = dialog;
        
        var roomTypeText = new cc.Node("RoomType");
        roomTypeText.y = dialogHeight/2 - 80;
        roomTypeText.anchorX = 0.5;
        roomTypeText.anchorY = 0.5;
        var rtl = roomTypeText.addComponent(cc.Label);
        rtl.string = roomConfig.room_name || "初级房";
        rtl.fontSize = 16;
        rtl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        roomTypeText.color = cc.color(255, 220, 120);
        roomTypeText.parent = dialog;
        
        // ===== 房间名称输入 =====
        var nameLabel = new cc.Node("NameLabel");
        nameLabel.x = -dialogWidth/2 + 30;
        nameLabel.y = dialogHeight/2 - 130;
        nameLabel.anchorX = 0;
        nameLabel.anchorY = 0.5;
        var nll = nameLabel.addComponent(cc.Label);
        nll.string = "房间名称:";
        nll.fontSize = 18;  // 增大字体
        nameLabel.color = cc.color(220, 210, 190);
        nameLabel.parent = dialog;
        
        var nameInputData = { value: "" };
        var nameInputBtn = this._createEditBoxInput(
            "输入房间名称（可选）",
            40, dialogHeight/2 - 165,
            dialogWidth - 80, 48,  // 增加尺寸
            "NameInput",
            nameInputData
        );
        nameInputBtn.parent = dialog;
        
        // ===== 房间密码输入 =====
        var pwdLabel = new cc.Node("PwdLabel");
        pwdLabel.x = -dialogWidth/2 + 30;
        pwdLabel.y = dialogHeight/2 - 235;
        pwdLabel.anchorX = 0;
        pwdLabel.anchorY = 0.5;
        var pll = pwdLabel.addComponent(cc.Label);
        pll.string = "房间密码:";
        pll.fontSize = 18;  // 增大字体
        pwdLabel.color = cc.color(220, 210, 190);
        pwdLabel.parent = dialog;
        
        var pwdInputData = { value: "" };
        var pwdInputBtn = this._createEditBoxInput(
            "设置密码（可选）",
            40, dialogHeight/2 - 270,
            dialogWidth - 80, 48,  // 增加尺寸
            "PwdInput",
            pwdInputData
        );
        pwdInputBtn.parent = dialog;
        
        // ===== 提示文字 =====
        var tipNode = new cc.Node("Tip");
        tipNode.y = -dialogHeight/2 + 100;
        tipNode.anchorX = 0.5;
        tipNode.anchorY = 0.5;
        var tipLabel = tipNode.addComponent(cc.Label);
        tipLabel.string = "留空密码则创建公开房间，任何人可直接加入";
        tipLabel.fontSize = 14;  // 增大字体
        tipLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        tipNode.color = cc.color(160, 150, 140);
        tipNode.parent = dialog;
        
        // ===== 按钮区域 =====
        var btnY = -dialogHeight/2 + 50;
        
        // 取消按钮
        var cancelBtn = this._createDialogButton(
            "取消",
            cc.color(80, 75, 95),
            -90, btnY,
            130, 48,  // 增加尺寸
            function() {
                dialog.destroy();
            }
        );
        cancelBtn.parent = dialog;
        
        // 创建按钮
        var createBtn = this._createDialogButton(
            "创建房间",
            cc.color(255, 152, 0),  // 橙色
            90, btnY,
            150, 48,  // 增加尺寸
            function() {
                // 获取输入内容 - 从 EditBox 获取
                var nameInput = dialog.getChildByName("NameInput");
                var pwdInput = dialog.getChildByName("PwdInput");
                var nameEditBox = nameInput ? nameInput.getComponent(cc.EditBox) : null;
                var pwdEditBox = pwdInput ? pwdInput.getComponent(cc.EditBox) : null;
                
                var roomName = (nameEditBox && nameEditBox.string) || roomConfig.room_name || "我的房间";
                var password = (pwdEditBox && pwdEditBox.string) || "";
                
                // 保存房间信息
                var myglobal = window.myglobal;
                if (myglobal) {
                    myglobal.createRoomInfo = {
                        roomName: roomName,
                        password: password,
                        roomConfig: roomConfig
                    };
                }
                
                
                dialog.destroy();
                
                // 关闭房间列表界面并创建房间
                var scene = parentNode.getChildByName("RoomListScene") || parentNode;
                if (scene.destroy) scene.destroy();
                
                // 调用原来的创建房间方法
                self._createRoom(roomConfig, playerGold);
            }
        );
        createBtn.parent = dialog;
    },
    
    // 创建使用 EditBox 的输入框（用于弹窗内）
    _createEditBoxInput: function(placeholder, x, y, width, height, nodeName, dataRef) {
        var inputNode = new cc.Node(nodeName);
        inputNode.setContentSize(cc.size(width, height));
        inputNode.setPosition(x, y);
        inputNode.anchorX = 0;
        inputNode.anchorY = 0.5;
        
        // 背景
        var bg = inputNode.addComponent(cc.Graphics);
        bg.fillColor = cc.color(50, 45, 65, 255);
        bg.roundRect(0, -height/2, width, height, 8);
        bg.fill();
        bg.strokeColor = cc.color(120, 100, 70, 220);
        bg.lineWidth = 2;
        bg.roundRect(0, -height/2, width, height, 8);
        bg.stroke();
        
        // 使用 EditBox 组件
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
        editBox.lineHeight = height - 10;
        
        // 输入事件
        editBox.node.on('text-changed', function(editbox) {
            if (dataRef) {
                dataRef.value = editbox.string;
            }
        });
        
        // 焦点事件 - 更新背景样式
        editBox.node.on('editing-did-begin', function() {
            bg.clear();
            bg.fillColor = cc.color(60, 55, 80, 255);
            bg.roundRect(0, -height/2, width, height, 8);
            bg.fill();
            bg.strokeColor = cc.color(255, 180, 80, 255);
            bg.lineWidth = 2;
            bg.roundRect(0, -height/2, width, height, 8);
            bg.stroke();
        });
        
        editBox.node.on('editing-did-end', function() {
            bg.clear();
            bg.fillColor = cc.color(50, 45, 65, 255);
            bg.roundRect(0, -height/2, width, height, 8);
            bg.fill();
            bg.strokeColor = cc.color(120, 100, 70, 220);
            bg.lineWidth = 2;
            bg.roundRect(0, -height/2, width, height, 8);
            bg.stroke();
        });
        
        return inputNode;
    },
    
    // 创建弹窗内可点击的输入框
    _createInputDialogInput: function(placeholder, x, y, width, height, nodeName, dataRef) {
        var self = this;
        var inputNode = new cc.Node(nodeName);
        inputNode.setContentSize(cc.size(width, height));
        inputNode.setPosition(x, y);
        inputNode.anchorX = 0.5;
        inputNode.anchorY = 0.5;
        
        // 背景
        var bg = inputNode.addComponent(cc.Graphics);
        bg.fillColor = cc.color(50, 45, 65, 255);
        bg.roundRect(-width/2, -height/2, width, height, 6);
        bg.fill();
        bg.strokeColor = cc.color(120, 100, 70, 200);
        bg.lineWidth = 1;
        bg.roundRect(-width/2, -height/2, width, height, 6);
        bg.stroke();
        
        // placeholder/值显示
        var textNode = new cc.Node("Text");
        textNode.anchorX = 0.5;
        textNode.anchorY = 0.5;
        textNode.parent = inputNode;
        
        var label = textNode.addComponent(cc.Label);
        label.string = placeholder;
        label.fontSize = 14;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        textNode.color = cc.color(130, 120, 110);
        
        // 使用系统提示输入
        inputNode.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            
            // 使用 prompt 获取输入（Web端可用）
            var input = "";
            try {
                if (typeof window !== 'undefined' && window.prompt) {
                    input = window.prompt(placeholder, dataRef.value || "") || "";
                }
            } catch (e) {
            }
            
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
    },
    
    // 创建弹窗内的按钮
    _createDialogButton: function(text, bgColor, x, y, width, height, callback) {
        var btn = new cc.Node("Btn_" + text);
        btn.setContentSize(cc.size(width, height));
        btn.setPosition(x, y);
        btn.anchorX = 0.5;
        btn.anchorY = 0.5;
        
        // 背景
        var bg = btn.addComponent(cc.Graphics);
        bg.fillColor = bgColor;
        bg.roundRect(-width/2, -height/2, width, height, 8);
        bg.fill();
        
        // 边框
        bg.strokeColor = cc.color(
            Math.min(255, bgColor.r + 30),
            Math.min(255, bgColor.g + 30),
            Math.min(255, bgColor.b + 30)
        );
        bg.lineWidth = 2;
        bg.roundRect(-width/2, -height/2, width, height, 8);
        bg.stroke();
        
        // 文字
        var textNode = new cc.Node("Text");
        textNode.anchorX = 0.5;
        textNode.anchorY = 0.5;
        var label = textNode.addComponent(cc.Label);
        label.string = text;
        label.fontSize = 18;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        textNode.color = cc.color(255, 255, 255);
        textNode.parent = btn;
        
        // 触摸效果
        btn.on(cc.Node.EventType.TOUCH_START, function(event) {
            event.stopPropagation();
            btn.scale = 0.95;
        });
        btn.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            btn.scale = 1;
            if (callback) callback();
        });
        btn.on(cc.Node.EventType.TOUCH_CANCEL, function(event) {
            btn.scale = 1;
        });
        
        return btn;
    },
    
    // 创建精美输入框
    _createBeautifulInput: function(placeholder, x, y, width, height, nodeName) {
        var inputNode = new cc.Node(nodeName || "BeautifulInput");
        inputNode.setContentSize(cc.size(width, height));
        inputNode.setPosition(x, y);
        inputNode.anchorX = 0.5;
        inputNode.anchorY = 0.5;
        
        // 输入框背景
        var bgNode = new cc.Node("InputBg");
        bgNode.setPosition(0, 0);
        bgNode.anchorX = 0.5;
        bgNode.anchorY = 0.5;
        
        var bg = bgNode.addComponent(cc.Graphics);
        // 内部填充
        bg.fillColor = cc.color(55, 45, 70, 255);
        bg.roundRect(-width/2, -height/2, width, height, 6);
        bg.fill();
        // 边框
        bg.strokeColor = cc.color(150, 120, 80, 200);
        bg.lineWidth = 2;
        bg.roundRect(-width/2, -height/2, width, height, 6);
        bg.stroke();
        // 内部高光
        bg.strokeColor = cc.color(80, 70, 100, 100);
        bg.lineWidth = 1;
        bg.roundRect(-width/2 + 3, -height/2 + 3, width - 6, height - 6, 4);
        bg.stroke();
        bgNode.parent = inputNode;
        
        // placeholder文字
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
    },
    
    // 创建精美按钮
    _createBeautifulButton: function(text, bgColor, borderColor, x, y, width, height, callback, isPrimary) {
        var btn = new cc.Node("BeautifulBtn_" + text);
        btn.setContentSize(cc.size(width, height));
        btn.setPosition(x, y);
        btn.anchorX = 0.5;
        btn.anchorY = 0.5;
        
        // 按钮背景节点
        var bgNode = new cc.Node("BgNode");
        bgNode.setPosition(0, 0);
        bgNode.anchorX = 0.5;
        bgNode.anchorY = 0.5;
        
        var bg = bgNode.addComponent(cc.Graphics);
        
        // 绘制按钮背景
        bg.fillColor = bgColor;
        bg.roundRect(-width/2, -height/2, width, height, 8);
        bg.fill();
        
        // 外边框
        bg.strokeColor = borderColor;
        bg.lineWidth = 2;
        bg.roundRect(-width/2, -height/2, width, height, 8);
        bg.stroke();
        
        // 主按钮高光效果
        if (isPrimary) {
            // 顶部高光
            bg.fillColor = cc.color(255, 255, 255, 40);
            bg.roundRect(-width/2 + 3, 3, width - 6, height/2 - 3, 5);
            bg.fill();
            // 底部阴影
            bg.fillColor = cc.color(0, 0, 0, 30);
            bg.roundRect(-width/2 + 3, -height/2 + 3, width - 6, height/3, 3);
            bg.fill();
        }
        bgNode.parent = btn;
        
        // 按钮文字节点
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
        textNode.parent = btn;
        
        // 触摸事件
        btn.on(cc.Node.EventType.TOUCH_START, function(event) {
            event.stopPropagation();
            btn.scale = 0.95;
        });
        btn.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            btn.scale = 1;
            if (callback) callback();
        });
        btn.on(cc.Node.EventType.TOUCH_CANCEL, function(event) {
            btn.scale = 1;
        });
        
        return btn;
    },
    
    // 创建弹窗输入框
    _createDialogInput: function(placeholder, x, y, width, height, nodeName) {
        var inputNode = new cc.Node(nodeName || "DialogInput");
        inputNode.setContentSize(cc.size(width, height));
        inputNode.setPosition(x, y);
        inputNode.anchorX = 0.5;
        inputNode.anchorY = 0.5;
        
        // 输入框背景
        var bgNode = new cc.Node("InputBg");
        bgNode.setPosition(0, 0);
        bgNode.anchorX = 0.5;
        bgNode.anchorY = 0.5;
        
        var bg = bgNode.addComponent(cc.Graphics);
        bg.fillColor = cc.color(50, 45, 65, 255);
        bg.roundRect(-width/2, -height/2, width, height, 5);
        bg.fill();
        bg.strokeColor = cc.color(100, 90, 70, 200);
        bg.lineWidth = 1;
        bg.roundRect(-width/2, -height/2, width, height, 5);
        bg.stroke();
        bgNode.parent = inputNode;
        
        // placeholder文字
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
    },
    
    // ============================================================
    // 显示加入房间密码验证弹窗（有密码的房间）
    // ============================================================
    _showPasswordDialog: function(roomCode, roomConfig, playerGold, callback) {
        var self = this;
        
        
        // 获取画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        
        // 弹窗容器
        var dialog = new cc.Node("PasswordDialog");
        dialog.setContentSize(cc.size(screenWidth, screenHeight));
        dialog.setPosition(0, 0);
        dialog.zIndex = 3500;
        dialog.parent = this.node;
        
        // 半透明遮罩
        var mask = new cc.Node("Mask");
        var maskG = mask.addComponent(cc.Graphics);
        maskG.fillColor = cc.color(0, 0, 0, 180);
        maskG.rect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight);
        maskG.fill();
        mask.parent = dialog;
        
        mask.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
        });
        
        // 弹窗主体
        var dialogWidth = 350;
        var dialogHeight = 220;
        var dialogBg = new cc.Node("DialogBg");
        dialogBg.setContentSize(cc.size(dialogWidth, dialogHeight));
        
        var dbg = dialogBg.addComponent(cc.Graphics);
        dbg.fillColor = cc.color(35, 30, 50, 250);
        dbg.roundRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 12);
        dbg.fill();
        dbg.strokeColor = cc.color(180, 140, 60, 200);
        dbg.lineWidth = 3;
        dbg.roundRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 12);
        dbg.stroke();
        dialogBg.parent = dialog;
        
        // 标题
        var titleText = new cc.Node("Title");
        titleText.setPosition(0, dialogHeight/2 - 40);
        titleText.anchorX = 0.5;
        titleText.anchorY = 0.5;
        var ttl = titleText.addComponent(cc.Label);
        ttl.string = "该房间需要密码";
        ttl.fontSize = 22;
        ttl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        titleText.color = cc.color(255, 220, 100);
        titleText.parent = dialog;
        
        // 房间号显示
        var codeText = new cc.Node("RoomCode");
        codeText.setPosition(0, dialogHeight/2 - 75);
        codeText.anchorX = 0.5;
        codeText.anchorY = 0.5;
        var ctl = codeText.addComponent(cc.Label);
        ctl.string = "房间号: " + roomCode;
        ctl.fontSize = 14;
        ctl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        codeText.color = cc.color(160, 150, 130);
        codeText.parent = dialog;
        
        // 密码输入框
        var pwdInput = this._createDialogInput("请输入密码", 0, 10, 200, 36, "PwdInput");
        pwdInput.parent = dialog;
        
        // 按钮区域
        var btnY = -dialogHeight/2 + 45;
        
        // 取消按钮
        var cancelBtn = this._createButtonNode("取消", cc.color(80, 75, 90), -70, btnY, 80, 34, function() {
            dialog.destroy();
        });
        cancelBtn.parent = dialog;
        
        // 确认按钮
        var confirmBtn = this._createButtonNode("确认", cc.color(40, 130, 70), 70, btnY, 80, 34, function() {
            var pwdInputNode = dialog.getChildByName("PwdInput");
            var placeholder = pwdInputNode ? pwdInputNode.getChildByName("Placeholder") : null;
            var password = placeholder ? placeholder.getComponent(cc.Label).string : "";
            
            if (!password || password === "请输入密码") {
                self._showTipInDialog(dialog, "请输入密码");
                return;
            }
            
            // 验证密码（这里需要调用服务端验证）
            
            dialog.destroy();
            
            if (callback) {
                callback(password);
            }
        }, true);
        confirmBtn.parent = dialog;
        
        return dialog;
    },
    
    // 在弹窗中显示提示
    _showTipInDialog: function(dialog, message) {
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
        
        this.scheduleOnce(function() {
            if (tip && tip.isValid) tip.destroy();
        }, 2);
    },
    
    // 获取并渲染房间列表（用于全屏场景）- 只显示真实房间
    _fetchAndRenderRoomListForScene: function(container, loadingLabel, roomConfig, playerGold, sceneNode) {
        var self = this;
        var myglobal = window.myglobal;
        var socket = myglobal && myglobal.socket ? myglobal.socket : null;
        
        // 检查WebSocket是否已连接
        var isConnected = socket && socket.isConnected && socket.isConnected();
        var isWebSocketOpen = socket && socket.isWebSocketOpen && socket.isWebSocketOpen();
        
        
        // 存储当前房间列表，用于实时更新
        var currentRooms = [];
        
        // 设置实时房间列表更新监听器
        var roomListUpdateHandler = function(data) {
            
            var actionType = data.action_type;
            var roomCode = data.room_code;
            var room = data.room;
            
            if (actionType === "add" && room) {
                // 添加新房间
                var exists = currentRooms.some(function(r) {
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
                currentRooms = currentRooms.filter(function(r) {
                    return (r.room_code || r.roomCode) !== roomCode;
                });
            }
            
            // 重新渲染房间列表
            var filteredRooms = currentRooms.filter(function(r) {
                var count = r.player_count || r.playerCount || 0;
                return count > 0 && count < 3;
            });
            self._renderRoomListInScene(container, filteredRooms, roomConfig, playerGold, sceneNode);
        };
        
        // 注册监听器
        if (socket && socket.onRoomListUpdate) {
            socket.onRoomListUpdate(roomListUpdateHandler);
        }
        
        // 保存监听器引用，用于后续取消注册
        sceneNode._roomListUpdateHandler = roomListUpdateHandler;
        
        // 如果WebSocket未连接，显示空列表
        if (!socket || !isConnected || !isWebSocketOpen) {
            
            this.scheduleOnce(function() {
                if (loadingLabel && loadingLabel.isValid) {
                    loadingLabel.active = false;
                }
                // 显示空列表提示
                self._renderRoomListInScene(container, [], roomConfig, playerGold, sceneNode);
            }, 0.5);
            return;
        }
        
        // 设置超时
        var timeoutId = setTimeout(function() {
            if (loadingLabel && loadingLabel.isValid) {
                loadingLabel.active = false;
            }
            // 显示空列表提示
            self._renderRoomListInScene(container, [], roomConfig, playerGold, sceneNode);
        }, 5000);
        
        socket.getRoomList(function(result, rooms) {
            clearTimeout(timeoutId);
            
            
            if (loadingLabel && loadingLabel.isValid) {
                loadingLabel.active = false;
            }
            
            if (result === 0 && rooms && rooms.length > 0) {
                // 存储房间列表用于实时更新
                currentRooms = rooms;
                
                // 过滤：只显示人数少于3人的房间
                var filteredRooms = rooms.filter(function(room) {
                    var count = room.player_count || room.playerCount || 0;
                    return count > 0 && count < 3;
                });
                
                self._renderRoomListInScene(container, filteredRooms, roomConfig, playerGold, sceneNode);
            } else {
                // 没有房间或请求失败，显示空列表
                self._renderRoomListInScene(container, [], roomConfig, playerGold, sceneNode);
            }
        });
    },
    

    
    // 渲染房间列表（简洁清晰的列表设计）
    _renderRoomListInScene: function(container, rooms, roomConfig, playerGold, sceneNode) {
        var self = this;
        
        // 清空容器中非LoadingLabel的子节点
        var children = container.children.slice();
        for (var i = 0; i < children.length; i++) {
            if (children[i].name !== "LoadingLabel") {
                children[i].destroy();
            }
        }
        
        var containerWidth = container.width;
        var colWidth = containerWidth / 5;
        var itemHeight = 50;  // 增加列表项高度
        var startY = container.height/2 - 15;
        
        // 空列表处理
        if (!rooms || rooms.length === 0) {
            var emptyNode = new cc.Node("EmptyTip");
            emptyNode.anchorX = 0.5;
            emptyNode.anchorY = 0.5;
            var el = emptyNode.addComponent(cc.Label);
            el.string = "暂无可加入的房间";
            el.fontSize = 18;  // 增大字体
            el.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            emptyNode.color = cc.color(160, 150, 140);
            emptyNode.parent = container;
            return;
        }
        
        // 渲染房间列表项
        for (var i = 0; i < rooms.length && i < 8; i++) {
            var room = rooms[i];
            var itemY = startY - i * itemHeight;
            
            // 列表项背景
            var itemBg = new cc.Node("RoomItem_" + i);
            itemBg.setContentSize(cc.size(containerWidth - 5, itemHeight - 4));
            itemBg.setPosition(0, itemY);
            
            var ig = itemBg.addComponent(cc.Graphics);
            ig.fillColor = i % 2 === 0 ? cc.color(35, 30, 50, 220) : cc.color(30, 28, 45, 220);
            ig.roundRect(-(containerWidth - 5)/2, -(itemHeight - 4)/2, containerWidth - 5, itemHeight - 4, 4);
            ig.fill();
            itemBg.parent = container;
            
            var playerCount = room.player_count || room.playerCount || 0;
            var roomCode = room.room_code || room.roomCode || "未知";
            
            // 房间号 - 增大字体
            var codeText = new cc.Node("CodeText");
            codeText.x = -containerWidth/2 + colWidth * 0.5;
            codeText.anchorX = 0.5;
            codeText.anchorY = 0.5;
            var cl = codeText.addComponent(cc.Label);
            cl.string = roomCode;
            cl.fontSize = 16;  // 增大字体
            cl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            codeText.color = cc.color(220, 200, 160);
            codeText.parent = itemBg;
            
            // 人数 - 增大字体
            var countText = new cc.Node("CountText");
            countText.x = -containerWidth/2 + colWidth * 1.5;
            countText.anchorX = 0.5;
            countText.anchorY = 0.5;
            var ctl = countText.addComponent(cc.Label);
            ctl.string = playerCount + "/3";
            ctl.fontSize = 16;  // 增大字体
            ctl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            countText.color = playerCount >= 3 ? cc.color(220, 100, 80) : cc.color(100, 200, 100);
            countText.parent = itemBg;
            
            // 底分 - 增大字体
            var scoreText = new cc.Node("ScoreText");
            scoreText.x = -containerWidth/2 + colWidth * 2.5;
            scoreText.anchorX = 0.5;
            scoreText.anchorY = 0.5;
            var sl = scoreText.addComponent(cc.Label);
            sl.string = "" + (room.base_score || roomConfig.base_score || 1);
            sl.fontSize = 16;  // 增大字体
            sl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            scoreText.color = cc.color(220, 180, 80);
            scoreText.parent = itemBg;
            
            // 状态 - 增大字体
            var statusText = new cc.Node("StatusText");
            statusText.x = -containerWidth/2 + colWidth * 3.5;
            statusText.anchorX = 0.5;
            statusText.anchorY = 0.5;
            var stl = statusText.addComponent(cc.Label);
            stl.string = playerCount >= 3 ? "已满" : "等待中";
            stl.fontSize = 16;  // 增大字体
            stl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            statusText.color = playerCount >= 3 ? cc.color(220, 100, 80) : cc.color(100, 200, 100);
            statusText.parent = itemBg;
            
            // 加入按钮 - 增大尺寸
            (function(roomData) {
                var joinBtn = self._createActionButton(
                    "加入",
                    cc.color(76, 175, 80),
                    -containerWidth/2 + colWidth * 4.5,
                    0,
                    70, 36,  // 增加尺寸
                    function() {
                        var code = roomData.room_code || roomData.roomCode;
                        var scene = sceneNode.getChildByName("RoomListScene") || sceneNode;
                        if (scene.destroy) scene.destroy();
                        self._joinRoom(code, roomConfig, playerGold);
                    }
                );
                joinBtn.parent = itemBg;
            })(room);
        }
    },
    
    // 显示房间列表弹窗
    _showRoomListDialog: function(roomConfig, playerGold) {
        var self = this;
        var myglobal = window.myglobal;
        
        
        // 移除旧的弹窗
        var oldDialog = this.node.getChildByName("RoomListDialog");
        if (oldDialog) oldDialog.destroy();
        
        // 移除旧的提示
        var oldTip = this.node.getChildByName("room_tip");
        if (oldTip) oldTip.destroy();
        
        // 获取画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        
        // 创建弹窗容器
        var dialog = new cc.Node("RoomListDialog");
        dialog.setContentSize(cc.size(650, 450));
        dialog.anchorX = 0.5;
        dialog.anchorY = 0.5;
        dialog.x = 0;
        dialog.y = 50;  // 稍微上移
        dialog.zIndex = 1000;  // 确保在最上层
        dialog.parent = this.node;
        
        // 添加背景遮罩（半透明黑色）
        var mask = new cc.Node("Mask");
        mask.setContentSize(cc.size(screenWidth, screenHeight));
        mask.anchorX = 0.5;
        mask.anchorY = 0.5;
        mask.x = 0;
        mask.y = -50;
        var maskGraphics = mask.addComponent(cc.Graphics);
        maskGraphics.fillColor = cc.color(0, 0, 0, 180);
        maskGraphics.rect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight);
        maskGraphics.fill();
        mask.parent = dialog;
        
        // 点击遮罩关闭弹窗
        mask.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            dialog.destroy();
        });
        
        // 添加弹窗背景（白色圆角矩形）
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
        bgNode.parent = dialog;
        
        // 标题
        var titleNode = new cc.Node("Title");
        titleNode.y = 170;
        var titleLabel = titleNode.addComponent(cc.Label);
        titleLabel.string = "【" + roomConfig.room_name + "】";
        titleLabel.fontSize = 36;
        titleLabel.lineHeight = 44;
        titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        titleNode.color = cc.color(255, 215, 0);
        titleNode.parent = dialog;
        
        // 副标题
        var subTitleNode = new cc.Node("SubTitle");
        subTitleNode.y = 130;
        var subTitleLabel = subTitleNode.addComponent(cc.Label);
        subTitleLabel.string = "选择游戏方式";
        subTitleLabel.fontSize = 24;
        subTitleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        subTitleNode.color = cc.color(180, 180, 200);
        subTitleNode.parent = dialog;
        
        // 房间列表容器
        var listContainer = new cc.Node("ListContainer");
        listContainer.setContentSize(cc.size(580, 120));
        listContainer.y = 50;
        listContainer.parent = dialog;
        
        // 加载中的提示
        var loadingLabel = new cc.Node("LoadingLabel");
        loadingLabel.y = 0;
        var loading = loadingLabel.addComponent(cc.Label);
        loading.string = "正在获取房间列表...";
        loading.fontSize = 22;
        loading.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        loadingLabel.color = cc.color(150, 150, 170);
        loadingLabel.parent = listContainer;
        
        // 按钮容器 - 放在中间显眼位置
        var btnContainer = new cc.Node("BtnContainer");
        btnContainer.y = -60;
        btnContainer.parent = dialog;
        
        // 快速匹配按钮（绿色，最大）
        var quickMatchBtn = this._createButton("🎮 快速匹配", cc.color(46, 125, 50), -200, function() {
            dialog.destroy();
            self._quickMatch(roomConfig, playerGold);
        }, 180, 55);
        quickMatchBtn.parent = btnContainer;
        
        // 创建房间按钮（蓝色）
        var createRoomBtn = this._createButton("🏠 创建房间", cc.color(21, 101, 192), 0, function() {
            dialog.destroy();
            self._createRoom(roomConfig, playerGold);
        }, 180, 55);
        createRoomBtn.parent = btnContainer;
        
        // 关闭按钮（灰色）
        var closeBtn = this._createButton("✖ 关闭", cc.color(120, 120, 120), 200, function() {
            dialog.destroy();
        }, 100, 45);
        closeBtn.parent = btnContainer;
        
        // 输入房间号区域
        var inputContainer = new cc.Node("InputContainer");
        inputContainer.y = -140;
        inputContainer.parent = dialog;
        
        var inputLabel = new cc.Node("InputLabel");
        inputLabel.x = -250;
        var inputLabelComp = inputLabel.addComponent(cc.Label);
        inputLabelComp.string = "房间号:";
        inputLabelComp.fontSize = 22;
        inputLabel.color = cc.color(200, 200, 200);
        inputLabel.parent = inputContainer;
        
        // 房间号输入框背景
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
        inputText.verticalAlign = cc.Label.VerticalAlign.CENTER;
        
        // 加入房间按钮
        var joinBtn = this._createButton("➤ 加入", cc.color(230, 126, 34), 100, function() {
            var roomCode = inputText.string;
            if (roomCode && roomCode !== "点击输入房间号") {
                dialog.destroy();
                self._joinRoom(roomCode, roomConfig, playerGold);
            } else {
                self._showMessageCenter("请输入房间号");
            }
        }, 90, 40);
        joinBtn.parent = inputContainer;
        
        // 底部提示
        var tipNode = new cc.Node("Tip");
        tipNode.y = -185;
        var tipLabel = tipNode.addComponent(cc.Label);
        tipLabel.string = "提示：快速匹配将自动为您分配房间";
        tipLabel.fontSize = 16;
        tipLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        tipNode.color = cc.color(120, 120, 140);
        tipNode.parent = dialog;
        
        // 获取房间列表
        this._fetchRoomList(listContainer, loadingLabel);
    },
    
    // 创建按钮 - 改进版本
    _createButton: function(text, color, x, callback, width, height) {
        width = width || 140;
        height = height || 50;
        
        var btn = new cc.Node(text + "Btn");
        btn.setContentSize(cc.size(width, height));
        btn.x = x;
        
        // 按钮背景
        var bg = btn.addComponent(cc.Graphics);
        bg.fillColor = color;
        bg.roundRect(-width/2, -height/2, width, height, 8);
        bg.fill();
        
        // 按钮文字
        var label = btn.addComponent(cc.Label);
        label.string = text;
        label.fontSize = 20;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        btn.color = cc.color(255, 255, 255);
        
        // 触摸效果
        btn.on(cc.Node.EventType.TOUCH_START, function(event) {
            event.stopPropagation();
            btn.scale = 0.95;
        });
        btn.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            btn.scale = 1;
            if (callback) callback();
        });
        btn.on(cc.Node.EventType.TOUCH_CANCEL, function(event) {
            btn.scale = 1;
        });
        
        return btn;
    },
    
    // 获取房间列表 - 只显示真实房间
    _fetchRoomList: function(container, loadingLabel) {
        var self = this;
        var myglobal = window.myglobal;
        var socket = myglobal && myglobal.socket ? myglobal.socket : null;
        
        // 检查WebSocket是否已连接
        var isConnected = socket && socket.isConnected && socket.isConnected();
        var isWebSocketOpen = socket && socket.isWebSocketOpen && socket.isWebSocketOpen();
        
        
        // 如果WebSocket未连接，显示空列表
        if (!socket || !isConnected || !isWebSocketOpen) {
            loadingLabel.getComponent(cc.Label).string = "未连接服务器";
            
            this.scheduleOnce(function() {
                if (loadingLabel && loadingLabel.isValid) {
                    loadingLabel.destroy();
                }
                // 显示空列表提示
                self._renderRoomList(container, []);
            }, 0.5);
            return;
        }
        
        // 设置超时
        var timeoutId = setTimeout(function() {
            if (loadingLabel && loadingLabel.isValid) {
                loadingLabel.destroy();
            }
            // 显示空列表提示
            self._renderRoomList(container, []);
        }, 5000);
        
        socket.getRoomList(function(result, rooms) {
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
    },
    
    // 渲染房间列表 - 只显示真实房间
    _renderRoomList: function(container, rooms) {
        var self = this;
        
        // 如果没有房间，显示空列表提示
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
            bg.color = i % 2 === 0 ? cc.color(50, 50, 70) : cc.color(45, 45, 65);
            
            // 房间号
            var codeLabel = new cc.Node();
            codeLabel.x = -200;
            var code = codeLabel.addComponent(cc.Label);
            code.string = "房间: " + (room.room_code || room.roomCode || "未知");
            code.fontSize = 18;
            codeLabel.color = cc.color(200, 200, 200);
            codeLabel.parent = item;
            
            // 人数
            var countLabel = new cc.Node();
            countLabel.x = 50;
            var count = countLabel.addComponent(cc.Label);
            count.string = "人数: " + (room.player_count || room.playerCount || 0) + "/3";
            count.fontSize = 18;
            countLabel.color = cc.color(150, 200, 150);
            countLabel.parent = item;
            
            // 加入按钮
            var joinBtn = this._createButton("加入", cc.color(76, 175, 80), 200, function() {
                var roomCode = room.room_code || room.roomCode;
                self._joinRoom(roomCode, myglobal.currentRoomConfig, myglobal.playerData.gobal_count);
            });
            joinBtn.setContentSize(cc.size(70, 30));
            joinBtn.x = 220;
            joinBtn.parent = item;
            
            item.parent = container;
        }
    },
    
    // 快速匹配 - 智能匹配（优先加入现有等待房间）
    _quickMatch: function(roomConfig, playerGold) {
        var self = this;
        var myglobal = window.myglobal;
        var socket = myglobal && myglobal.socket ? myglobal.socket : null;
        
        // 检查WebSocket物理连接是否打开
        var isWebSocketOpen = socket && socket.isWebSocketOpen && socket.isWebSocketOpen();
        
        this._showMessageCenter("正在智能匹配...");
        
        // 如果WebSocket未打开，等待连接
        if (!socket || !isWebSocketOpen) {
            
            // 尝试初始化WebSocket连接
            if (socket && socket.initSocket) {
                socket.initSocket();
            }
            
            // 等待WebSocket连接后进行智能匹配
            this._waitForConnectionAndSmartMatch(roomConfig, playerGold);
            return;
        }
        
        // WebSocket已连接，执行智能匹配
        this._smartMatch(roomConfig, playerGold);
    },
    
    // 智能匹配：优先加入等待房间，没有则创建新房间
    _smartMatch: function(roomConfig, playerGold) {
        var self = this;
        var myglobal = window.myglobal;
        var socket = myglobal && myglobal.socket ? myglobal.socket : null;
        
        if (!socket) {
            self._hideMessageCenter();
            self._showMessage("服务器连接异常，请稍后重试");
            return;
        }
        
        
        // 第一步：获取可加入的房间列表
        if (socket.getRoomList) {
            socket.getRoomList(function(result, rooms) {
                if (rooms && rooms.length > 0) {
                }
                
                if (result === 0 && rooms && rooms.length > 0) {
                    // 找到人数不足3人的等待房间
                    // 注意：服务器返回的字段名是 room_code 和 player_count（蛇形命名）
                    var waitingRoom = null;
                    for (var i = 0; i < rooms.length; i++) {
                        var room = rooms[i];
                        // 兼容两种命名方式
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
                }
                
                // 没有可加入的房间，创建新房间
                self._showMessageCenter("创建新房间，等待其他玩家...");
                self._createRoom(roomConfig, playerGold);
            });
        } else {
            // 没有获取房间列表的方法，直接创建房间
            self._createRoom(roomConfig, playerGold);
        }
    },
    
    // 等待连接后进行智能匹配
    _waitForConnectionAndSmartMatch: function(roomConfig, playerGold) {
        var self = this;
        var socket = window.myglobal && window.myglobal.socket ? window.myglobal.socket : null;
        var attempts = 0;
        var maxAttempts = 15;  // 🔧【优化】增加尝试次数，但减少每次间隔
        
        var tryConnect = function() {
            attempts++;
            var isWebSocketOpen = socket && socket.isWebSocketOpen ? socket.isWebSocketOpen() : false;
            
            
            if (isWebSocketOpen) {
                self._smartMatch(roomConfig, playerGold);
            } else if (attempts < maxAttempts) {
                setTimeout(tryConnect, 200);  // 🔧【优化】减少间隔到200ms
            } else {
                self._hideMessageCenter();
                self._showMessage("连接服务器失败，请检查网络后重试");
            }
        };
        
        setTimeout(tryConnect, 100);  // 🔧【优化】首次尝试只需100ms
    },
    
    // 发送快速匹配请求（队列匹配模式 - 备用）
    _sendQuickMatchRequest: function(roomConfig, playerGold) {
        var self = this;
        var myglobal = window.myglobal;
        var socket = myglobal && myglobal.socket ? myglobal.socket : null;
        
        if (!socket || !socket.request_enter_room) {
            self._hideMessageCenter();
            self._showMessage("服务器连接异常，请稍后重试");
            return;
        }
        
        
        // 清除之前的超时计时器
        if (this._enterRoomTimeout) {
            clearTimeout(this._enterRoomTimeout);
            this._enterRoomTimeout = null;
        }
        
        socket.request_enter_room({ room_level: roomConfig.room_type }, function(result, data) {
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
        });
        
        // 设置超时
        this._enterRoomTimeout = setTimeout(function() {
            self._enterRoomTimeout = null;
            self._hideMessageCenter();
            self._showMessage("匹配超时，请检查网络连接");
        }, 15000);  // 增加超时时间到15秒
    },
    
    // 创建房间 - 只使用真实socket连接
    _createRoom: function(roomConfig, playerGold) {
        var self = this;
        var myglobal = window.myglobal;
        var socket = myglobal && myglobal.socket ? myglobal.socket : null;
        
        // 检查WebSocket物理连接是否打开
        var isWebSocketOpen = socket && socket.isWebSocketOpen && socket.isWebSocketOpen();
        
        this._showMessageCenter("正在进入游戏...");
        
        // 如果WebSocket未打开，尝试连接
        if (!socket || !isWebSocketOpen) {
            if (socket && socket.initSocket) {
                socket.initSocket();
            }
            this._waitForConnectionAndCreateRoom(roomConfig, playerGold);
            return;
        }
        
        // 发送创建房间请求
        this._sendCreateRoomRequest(roomConfig, playerGold);
    },
    
    // 发送创建房间请求
    _sendCreateRoomRequest: function(roomConfig, playerGold) {
        var self = this;
        var myglobal = window.myglobal;
        var socket = myglobal && myglobal.socket ? myglobal.socket : null;
        
        if (!socket || !socket.createRoom) {
            self._hideMessageCenter();
            self._showMessage("服务器连接异常，请稍后重试");
            return;
        }
        
        
        // 获取当前玩家的服务端ID（用于房主判断）
        var playerId = ""
        if (socket.getPlayerInfo) {
            var playerInfo = socket.getPlayerInfo()
            playerId = playerInfo.id
        }
        
        // 注意：socket.createRoom 的第一个参数是 roomConfigId，第二个参数是 callback
        var roomConfigId = roomConfig ? roomConfig.id : null;
        socket.createRoom(roomConfigId, function(result, data) {
            if (result === 0 && data) {
                // 🔧【修复】优先使用服务端返回的玩家数据
                var serverPlayer = data.player || {};
                var playerData = {
                    accountid: serverPlayer.id || playerId || myglobal.playerData.accountID || myglobal.playerData.uniqueID,
                    nick_name: serverPlayer.name || myglobal.playerData.nickName,
                    avatarUrl: myglobal.playerData.avatarUrl || "avatar_1",
                    gold_count: serverPlayer.gold_count || playerGold || 0,  // 🔧【修复】优先使用服务端返回的金币
                    goldcount: serverPlayer.gold_count || playerGold || 0,   // 兼容旧客户端
                    seatindex: (serverPlayer.seat !== undefined ? serverPlayer.seat : 0) + 1,
                    isready: serverPlayer.ready || true  // 房主创建房间默认已准备
                };
                
                // 转换数据格式
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
                myglobal.playerData.roomid = roomData.room_code;
                
                // 保存重连信息
                if (myglobal.socket && myglobal.socket.saveReconnectInfo) {
                    myglobal.socket.saveReconnectInfo();
                }
                
                self._enterGameScene(roomData);
            } else {
                self._hideMessageCenter();
                self._showMessage("创建房间失败，请稍后重试");
            }
        });
    },
    
    // 等待连接后创建房间
    _waitForConnectionAndCreateRoom: function(roomConfig, playerGold) {
        var self = this;
        var socket = window.myglobal && window.myglobal.socket ? window.myglobal.socket : null;
        var attempts = 0;
        var maxAttempts = 15;  // 🔧【优化】增加尝试次数
        
        var tryConnect = function() {
            attempts++;
            var isWebSocketOpen = socket && socket.isWebSocketOpen ? socket.isWebSocketOpen() : false;
            
            
            if (isWebSocketOpen) {
                self._sendCreateRoomRequest(roomConfig, playerGold);
            } else if (attempts < maxAttempts) {
                setTimeout(tryConnect, 200);  // 🔧【优化】减少间隔到200ms
            } else {
                self._hideMessageCenter();
                self._showMessage("连接服务器失败，请检查网络后重试");
            }
        };
        
        setTimeout(tryConnect, 100);  // 🔧【优化】首次尝试只需100ms
    },
    
    // 加入房间 - 只使用真实socket连接
    _joinRoom: function(roomCode, roomConfig, playerGold) {
        var self = this;
        var myglobal = window.myglobal;
        var socket = myglobal && myglobal.socket ? myglobal.socket : null;
        
        // 检查WebSocket物理连接是否打开
        var isWebSocketOpen = socket && socket.isWebSocketOpen && socket.isWebSocketOpen();
        
        this._showMessageCenter("正在加入房间 " + roomCode + "...");
        
        // 如果WebSocket未打开，尝试连接
        if (!socket || !isWebSocketOpen) {
            if (socket && socket.initSocket) {
                socket.initSocket();
            }
            this._waitForConnectionAndJoinRoom(roomCode, roomConfig, playerGold);
            return;
        }
        
        // 发送加入房间请求
        this._sendJoinRoomRequest(roomCode, roomConfig, playerGold);
    },
    
    // 发送加入房间请求
    _sendJoinRoomRequest: function(roomCode, roomConfig, playerGold) {
        var self = this;
        var myglobal = window.myglobal;
        var socket = myglobal && myglobal.socket ? myglobal.socket : null;
        
        if (!socket || !socket.joinRoom) {
            self._hideMessageCenter();
            self._showMessage("服务器连接异常，请稍后重试");
            return;
        }
        
        
        socket.joinRoom(roomCode, function(result, data) {
            
            if (result === 0 && data) {
                // 检查 players 数组是否存在
                var players = data.players || [];
                
                // 获取房主ID
                var creatorId = data.creator_id || data.creatorId || "";
                
                // 获取当前玩家的 socket playerInfo
                if (myglobal.socket && myglobal.socket.getPlayerInfo) {
                    var playerInfo = myglobal.socket.getPlayerInfo();
                }
                
                // 转换数据格式
                var roomData = {
                    roomid: data.room_code || data.roomCode || roomCode,
                    room_code: data.room_code || data.roomCode || roomCode,
                    seatindex: data.player ? data.player.seat + 1 : 1,  // 座位索引从1开始
                    playerdata: players.map(function(p, idx) {
                        return {
                            accountid: p.id,
                            nick_name: p.name,
                            avatarUrl: p.avatar || "avatar_1",  // 🔧【修复】使用实际头像URL
                            gold_count: p.gold_count || 0,  // 🔧【修复】使用服务端发送的金币数量
                            goldcount: p.gold_count || 0,   // 兼容旧客户端
                            seatindex: (p.seat !== undefined ? p.seat : idx) + 1,  // 座位索引从1开始
                            isready: p.ready || false  // 准备状态
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
    },
    
    // 等待连接后加入房间
    _waitForConnectionAndJoinRoom: function(roomCode, roomConfig, playerGold) {
        var self = this;
        var socket = window.myglobal && window.myglobal.socket ? window.myglobal.socket : null;
        var attempts = 0;
        var maxAttempts = 15;  // 🔧【优化】增加尝试次数
        
        var tryConnect = function() {
            attempts++;
            var isWebSocketOpen = socket && socket.isWebSocketOpen ? socket.isWebSocketOpen() : false;
            
            
            if (isWebSocketOpen) {
                self._sendJoinRoomRequest(roomCode, roomConfig, playerGold);
            } else if (attempts < maxAttempts) {
                setTimeout(tryConnect, 200);  // 🔧【优化】减少间隔到200ms
            } else {
                self._hideMessageCenter();
                self._showMessage("连接服务器失败，请检查网络后重试");
            }
        };
        
        setTimeout(tryConnect, 100);  // 🔧【优化】首次尝试只需100ms
    },
    
    // 等待 WebSocket 连接后进入房间（只使用真实socket连接）
    _waitForConnectionAndEnterRoom: function(roomConfig, socket, playerGold) {
        var self = this;
        var myglobal = window.myglobal;
        var attempts = 0;
        var maxAttempts = 10;  // 最多等待5秒
        
        var tryEnter = function() {
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
    },
    
    _formatGold: function(gold) {
        if (gold >= 10000) {
            return (gold / 10000).toFixed(1) + "万";
        }
        return gold.toString();
    },
    
    _enterGameScene: function(roomData) {
        var startTime = Date.now();
        
        // 🔧【关键修复】防止重复加载场景
        if (this._enterGameSceneInProgress) {
            console.log("🚀 [进入场景] 已在进行中，跳过");
            return;
        }
        this._enterGameSceneInProgress = true;
        
        // 🔧【新增】5秒后自动重置标志位（防止卡死）
        var self = this;
        setTimeout(function() {
            if (self._enterGameSceneInProgress) {
                console.log("🚀 [进入场景] 超时自动重置标志位");
                self._enterGameSceneInProgress = false;
            }
        }, 5000);
        
        console.log("🚀 [进入场景] 开始加载游戏场景");
        
        // 🔧【修复】添加安全检查，防止节点已销毁时报错
        if (this.node && this.node.isValid) {
            // 隐藏加载提示
            this._hideMessageCenter();
            
            // 🔧【优化】显示快速进入动画
            this._showQuickEnterAnimation();
        }
        
        // 🔧【关键修复】确保 roomData 已保存到 myglobal
        var myglobal = window.myglobal;
        if (myglobal && roomData) {
            // 如果 roomData 没有正确设置，使用传入的 roomData
            if (!myglobal.roomData || !myglobal.roomData.playerdata || myglobal.roomData.playerdata.length === 0) {
                myglobal.roomData = roomData;
                console.log("🚀 [进入场景] 保存 roomData 到 myglobal, playerdata 数量:", 
                    (roomData.playerdata ? roomData.playerdata.length : 0));
            }
        }
        
        // 🔧【优化】使用预加载的场景，切换更快
        if (this._gameScenePreloaded) {
            cc.director.runSceneImmediate(new cc.Scene(), function() {
                cc.director.loadScene("gameScene", function(err) {
                    if (err) {
                        console.error("🚀 [进入场景] 加载游戏场景失败:", err);
                        return;
                    }
                    var elapsed = Date.now() - startTime;
                });
            });
        } else {
            cc.director.loadScene("gameScene", function(err) {
                if (err) {
                    console.error("🚀 [进入场景] 加载游戏场景失败:", err);
                    return;
                }
                var elapsed = Date.now() - startTime;
            });
        }
    },
    
    // 🔧【新增】显示快速进入动画（使用加载图片）
    _showQuickEnterAnimation: function() {
        var self = this;
        
        // 获取画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        
        // 创建快速进入遮罩
        var maskNode = new cc.Node("QuickEnterMask");
        maskNode.setContentSize(cc.size(screenWidth * 2, screenHeight * 2));
        maskNode.color = cc.color(0, 0, 0);
        maskNode.opacity = 0;
        maskNode.zIndex = 9999;
        
        // 添加 BlockInputEvents 防止点击穿透
        maskNode.addComponent(cc.BlockInputEvents);
        maskNode.parent = this.node;
        
        // 🔧【修复】使用加载图片替代文字
        cc.resources.load('UI/loading_image', cc.SpriteFrame, function(err, spriteFrame) {
            // 🔧【关键修复】检查节点是否仍然有效
            if (!maskNode || !maskNode.isValid) {
                console.log("加载图片回调时节点已销毁，跳过");
                return;
            }
            
            if (err || !spriteFrame) {
                console.warn("加载 loading_image.png 失败，使用文字提示");
                // 降级：使用文字提示
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
            }
            
            // 创建加载图片节点
            var loadingImageNode = new cc.Node("LoadingImage");
            loadingImageNode.setContentSize(cc.size(120, 120));
            loadingImageNode.anchorX = 0.5;
            loadingImageNode.anchorY = 0.5;
            
            var sprite = loadingImageNode.addComponent(cc.Sprite);
            sprite.spriteFrame = spriteFrame;
            sprite.type = cc.Sprite.Type.SIMPLE;
            sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            
            loadingImageNode.parent = maskNode;
            
            // 添加旋转动画（180度/秒）
            self._quickEnterLoadingNode = loadingImageNode;
            self._quickEnterAnimating = true;
        });
        
        // 淡入动画
        cc.tween(maskNode)
            .to(0.15, { opacity: 200 })
            .start();
        
        // 保存引用，进入场景后销毁
        this._quickEnterMask = maskNode;
    },
    
    _showMessage: function(message) {
        // 安全检查：确保节点存在
        if (!this.node || !this.node.isValid) {
            console.warn("_showMessage: 节点不存在或已销毁");
            return;
        }
        
        var tipNode = this.node.getChildByName("room_tip");
        if (tipNode) tipNode.destroy();
        
        tipNode = new cc.Node("room_tip");
        tipNode.anchorX = 0.5;  // 水平居中
        tipNode.anchorY = 0.5;  // 垂直居中
        tipNode.x = 0;  // 水平居中（相对于父节点中心）
        tipNode.y = 311;  // 显示在顶部中间的方框区域内（与消息/帮助/设置按钮同一高度）

        var label = tipNode.addComponent(cc.Label);
        label.string = message;
        label.fontSize = 22;
        label.lineHeight = 28;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;  // 文字居中
        tipNode.color = cc.color(255, 255, 0);  // 黄色文字

        tipNode.parent = this.node;
        
        this.scheduleOnce(function() {
            if (tipNode && tipNode.isValid) tipNode.destroy();
        }, 2);
    },
    
    // 在屏幕中央显示加载图片（使用统一的 loading_image.png）
    _showMessageCenter: function(message) {
        // 安全检查：确保节点存在
        if (!this.node || !this.node.isValid) {
            console.warn("_showMessageCenter: 节点不存在或已销毁");
            return;
        }
        
        var self = this;
        var tipNode = this.node.getChildByName("center_tip");
        if (tipNode) tipNode.destroy();
        
        // 获取画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        
        // 创建提示容器
        tipNode = new cc.Node("center_tip");
        tipNode.zIndex = 2000;
        tipNode.parent = this.node;
        
        // 添加半透明背景遮罩
        var maskNode = new cc.Node("Mask");
        maskNode.setContentSize(cc.size(screenWidth, screenHeight));
        var maskGraphics = maskNode.addComponent(cc.Graphics);
        maskGraphics.fillColor = cc.color(0, 0, 0, 100);  // 半透明黑色背景
        maskGraphics.rect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight);
        maskGraphics.fill();
        maskNode.parent = tipNode;
        
        // 加载 loading_image.png 图片
        cc.resources.load('UI/loading_image', cc.SpriteFrame, function(err, spriteFrame) {
            if (err || !spriteFrame) {
                console.warn("加载 loading_image.png 失败，使用文字提示");
                // 降级：使用文字提示
                var labelNode = new cc.Node("Label");
                var label = labelNode.addComponent(cc.Label);
                label.string = message;
                label.fontSize = 26;
                label.lineHeight = 36;
                label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
                labelNode.color = cc.color(255, 255, 255);
                labelNode.parent = tipNode;
                return;
            }
            
            // 创建加载图片节点
            var loadingNode = new cc.Node("LoadingImage");
            loadingNode.setContentSize(cc.size(120, 120));  // 设置加载图片大小
            loadingNode.anchorX = 0.5;
            loadingNode.anchorY = 0.5;
            
            var sprite = loadingNode.addComponent(cc.Sprite);
            sprite.spriteFrame = spriteFrame;
            sprite.type = cc.Sprite.Type.SIMPLE;
            sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            
            loadingNode.parent = tipNode;
            
            // 标记正在动画中
            self._loadingImageAnimating = true;
            self._loadingImageNode = loadingNode;
        });
        
        // 不自动消失，需要手动调用 _hideMessageCenter 隐藏
        // 保存引用以便后续销毁
        this._centerTipNode = tipNode;
    },
    
    // 隐藏中央提示
    _hideMessageCenter: function() {
        this._loadingImageAnimating = false;
        this._loadingImageNode = null;
        
        if (this._centerTipNode && this._centerTipNode.isValid) {
            this._centerTipNode.destroy();
            this._centerTipNode = null;
        }
        
        // 🔧【修复】添加空指针检查，防止节点已销毁时出错
        if (this.node && this.node.isValid) {
            var tipNode = this.node.getChildByName("center_tip");
            if (tipNode && tipNode.isValid) {
                tipNode.destroy();
            }
        }
    },
    
    _removeNoticeBoard: function() {
        var noticeNames = ["notice", "gonggao", "公告", "notice_board", "dingbuuibantoumingdi", "xiongmao3", "title", "Title", "标签"];
        for (var i = 0; i < noticeNames.length; i++) {
            var node = this.node.getChildByName(noticeNames[i]);
            if (node) node.active = false;
        }
        this._hideNodesWithText(this.node, "游戏公告");
        this._hideNodesWithText(this.node, "娱乐休闲");
        // 隐藏背景上的区域标签文字（不隐藏动态创建的 AreaTitle）
        this._hideBackgroundLabels();
    },
    
    _hideBackgroundLabels: function() {
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
    },
    
    _findNodesByName: function(parentNode, name) {
        var result = [];
        if (!parentNode || !parentNode.children) return result;
        
        for (var i = 0; i < parentNode.children.length; i++) {
            var child = parentNode.children[i];
            if (child.name === name) {
                result.push(child);
            }
            // 递归查找子节点
            var subResults = this._findNodesByName(child, name);
            result = result.concat(subResults);
        }
        return result;
    },
    
    _adjustGoldElementsPosition: function() {
        var playerNode = this.node.getChildByName("player_node");
        if (!playerNode) return;
        
        // 获取头像背景节点，计算货币显示位置
        var headBg = playerNode.getChildByName("head_bg");
        var headRightEdge = 135;  // 头像右边缘约 85 + 50
        var currencyStartX = headRightEdge + 10;  // 距离头像10px开始
        
        // 获取用户名节点位置作为参考
        var nicknameNode = playerNode.getChildByName("nickname_label");
        var nicknameY = nicknameNode ? nicknameNode.y : 43;
        
        // 昵称位置保持不变，货币显示在昵称下方
        // 昵称高度约40px，货币显示在昵称下方20px处
        
        // 隐藏原来的金豆图标、金框和原来的金币显示节点（避免重复显示）
        var yuanbaoIcon = playerNode.getChildByName("yuanbaoIcon");
        var goldFrame = playerNode.getChildByName("gold_frame");
        var oldGobalLabel = playerNode.getChildByName("gobal_count_label");
        if (yuanbaoIcon) yuanbaoIcon.active = false;
        if (goldFrame) goldFrame.active = false;
        if (oldGobalLabel) oldGobalLabel.active = false;  // 隐藏原来的金币显示，避免重复
        
        // 创建货币显示容器（欢乐豆和竞技币放在同一行）
        // 位置：距离头像10px，在昵称下方
        var currencyY = nicknameY - 28;  // 昵称下方28px，避免重叠
        var currencyContainer = this._createCurrencyContainerRow(
            playerNode, 
            "currency_display_row", 
            currencyStartX,  // 距离头像10px
            currencyY        // 昵称下方
        );
        
        // 存储引用，方便后续更新
        this._happyBeanLabelNode = currencyContainer ? currencyContainer.happyBeanLabel : null;
        this._arenaCoinLabelNode = currencyContainer ? currencyContainer.arenaCoinLabel : null;
        
        // 立即更新显示值
        this._updateBothCurrencyDisplay();
    },
    
    // 【新增】创建货币显示容器（欢乐豆和竞技币放在同一行，垂直居中布局）
    _createCurrencyContainerRow: function(parentNode, name, x, y) {
        var self = this;
        if (!parentNode) return null;
        
        // 检查是否已存在
        var existing = parentNode.getChildByName(name);
        if (existing) {
            return {
                happyBeanLabel: existing.getChildByName("happy_bean_value"),
                arenaCoinLabel: existing.getChildByName("arena_coin_value")
            };
        }
        
        // ========== 布局参数 ==========
        var containerHeight = 40;   // 容器高度40px
        var iconSize = 22;          // 图标大小22px
        var valueFontSize = 20;     // 数字字体大小
        var iconTextGap = 5;        // 图标与数字间距（调整为5px）
        var currencyGap = 25;       // 两种货币之间的间距
        
        // ========== 创建容器节点 ==========
        var container = new cc.Node(name);
        container.setPosition(x, y);
        container.anchorX = 0;
        container.anchorY = 0.5;    // 垂直居中锚点
        container.setContentSize(200, containerHeight);  // 设置固定高度40px
        container.zIndex = 100;
        container.parent = parentNode;
        
        // ========== 欢乐豆显示 ==========
        // 欢乐豆图标 - 22px圆形带"豆"字
        var happyBeanIcon = new cc.Node("happy_bean_icon");
        happyBeanIcon.anchorX = 0.5;   // 修改：锚点设在中心，方便文字居中
        happyBeanIcon.anchorY = 0.5;   // 垂直居中
        happyBeanIcon.x = iconSize / 2; // 修改：调整位置使图标正确显示
        happyBeanIcon.y = 0;           // 容器中心
        happyBeanIcon.setContentSize(iconSize, iconSize);
        
        // 绘制图标背景 - 橙黄色
        var happyBeanGraphics = happyBeanIcon.addComponent(cc.Graphics);
        happyBeanGraphics.fillColor = cc.color(255, 180, 50);
        happyBeanGraphics.circle(0, 0, iconSize / 2);
        happyBeanGraphics.fill();
        happyBeanIcon.parent = container;
        
        // 图标上的"豆"字 - 居中显示在圆形背景中
        var happyBeanTextNode = new cc.Node("text");
        happyBeanTextNode.anchorX = 0.5;
        happyBeanTextNode.anchorY = 0.5;
        happyBeanTextNode.x = 0;      // 修改：明确设置位置在图标中心
        happyBeanTextNode.y = 0;      // 修改：明确设置位置在图标中心
        var happyBeanText = happyBeanTextNode.addComponent(cc.Label);
        happyBeanText.string = "豆";
        happyBeanText.fontSize = 13;
        happyBeanText.lineHeight = iconSize;  // 修改：行高等于图标大小，确保垂直居中
        happyBeanText.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        happyBeanText.verticalAlign = cc.Label.VerticalAlign.CENTER;  // 修改：添加垂直居中对齐
        happyBeanTextNode.color = cc.color(139, 69, 19);  // 深棕色
        happyBeanTextNode.parent = happyBeanIcon;
        
        // 欢乐豆数值 - line-height=40px，垂直居中
        var happyBeanValueLabel = new cc.Node("happy_bean_value");
        happyBeanValueLabel.anchorX = 0;
        happyBeanValueLabel.anchorY = 0.5;  // 垂直居中
        happyBeanValueLabel.x = iconSize + iconTextGap;  // 图标宽度 + 间距（图标锚点已改为中心，所以这里不需要调整）
        happyBeanValueLabel.y = 0;          // 容器中心
        var happyBeanValue = happyBeanValueLabel.addComponent(cc.Label);
        happyBeanValue.string = "0";
        happyBeanValue.fontSize = valueFontSize;
        happyBeanValue.lineHeight = containerHeight;  // line-height = 40px
        happyBeanValue.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
        happyBeanValue.verticalAlign = cc.Label.VerticalAlign.CENTER;  // 垂直居中
        happyBeanValueLabel.color = cc.color(255, 215, 0);  // 金色
        var outline2 = happyBeanValueLabel.addComponent(cc.LabelOutline);
        outline2.color = cc.color(0, 0, 0);
        outline2.width = 1;
        happyBeanValueLabel.parent = container;
        
        // ========== 竞技币显示 ==========
        var arenaStartX = iconSize + iconTextGap + 55 + currencyGap;  // 欢乐豆区域 + 间距
        
        // 竞技币图标 - 22px圆形带"币"字
        var arenaCoinIcon = new cc.Node("arena_coin_icon");
        arenaCoinIcon.anchorX = 0.5;   // 修改：锚点设在中心，方便文字居中
        arenaCoinIcon.anchorY = 0.5;   // 垂直居中
        arenaCoinIcon.x = arenaStartX + iconSize / 2; // 修改：调整位置使图标正确显示
        arenaCoinIcon.y = 0;           // 容器中心
        arenaCoinIcon.setContentSize(iconSize, iconSize);
        
        // 绘制图标背景 - 蓝色
        var arenaCoinGraphics = arenaCoinIcon.addComponent(cc.Graphics);
        arenaCoinGraphics.fillColor = cc.color(100, 180, 255);
        arenaCoinGraphics.circle(0, 0, iconSize / 2);
        arenaCoinGraphics.fill();
        arenaCoinIcon.parent = container;
        
        // 图标上的"币"字 - 居中显示在圆形背景中
        var arenaCoinTextNode = new cc.Node("text");
        arenaCoinTextNode.anchorX = 0.5;
        arenaCoinTextNode.anchorY = 0.5;
        arenaCoinTextNode.x = 0;      // 修改：明确设置位置在图标中心
        arenaCoinTextNode.y = 0;      // 修改：明确设置位置在图标中心
        var arenaCoinText = arenaCoinTextNode.addComponent(cc.Label);
        arenaCoinText.string = "币";
        arenaCoinText.fontSize = 13;
        arenaCoinText.lineHeight = iconSize;  // 修改：行高等于图标大小，确保垂直居中
        arenaCoinText.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        arenaCoinText.verticalAlign = cc.Label.VerticalAlign.CENTER;  // 修改：添加垂直居中对齐
        arenaCoinTextNode.color = cc.color(255, 255, 255);  // 白色
        arenaCoinTextNode.parent = arenaCoinIcon;
        
        // 竞技币数值 - line-height=40px，垂直居中
        var arenaCoinValueLabel = new cc.Node("arena_coin_value");
        arenaCoinValueLabel.anchorX = 0;
        arenaCoinValueLabel.anchorY = 0.5;  // 垂直居中
        arenaCoinValueLabel.x = arenaStartX + iconSize + iconTextGap;  // 图标宽度 + 间距
        arenaCoinValueLabel.y = 0;          // 容器中心
        var arenaCoinValue = arenaCoinValueLabel.addComponent(cc.Label);
        arenaCoinValue.string = "0";
        arenaCoinValue.fontSize = valueFontSize;
        arenaCoinValue.lineHeight = containerHeight;  // line-height = 40px
        arenaCoinValue.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
        arenaCoinValue.verticalAlign = cc.Label.VerticalAlign.CENTER;  // 垂直居中
        arenaCoinValueLabel.color = cc.color(100, 200, 255);  // 蓝色
        var outline4 = arenaCoinValueLabel.addComponent(cc.LabelOutline);
        outline4.color = cc.color(0, 0, 0);
        outline4.width = 1;
        arenaCoinValueLabel.parent = container;
        
        return {
            happyBeanLabel: happyBeanValueLabel,
            arenaCoinLabel: arenaCoinValueLabel
        };
    },
    
    // 【新增】同时更新欢乐豆和竞技币显示
    _updateBothCurrencyDisplay: function() {
        var myglobal = window.myglobal;
        var playerData = myglobal ? myglobal.playerData : null;
        
        if (!playerData) return;
        
        // 更新欢乐豆显示
        if (this._happyBeanLabelNode) {
            var label = this._happyBeanLabelNode.getComponent(cc.Label);
            if (label) {
                label.string = this._formatGold(playerData.gobal_count || 0);
            }
        }
        
        // 更新竞技币显示
        if (this._arenaCoinLabelNode) {
            var label = this._arenaCoinLabelNode.getComponent(cc.Label);
            if (label) {
                label.string = this._formatGold(playerData.arena_coin || 0);
            }
        }
        
        // 同时也更新原来的 gobal_count（兼容性）
        if (this.gobal_count) {
            this.gobal_count.string = this._formatGold(playerData.gobal_count || 0);
        }
    },
    
    _hideNodesWithText: function(parentNode, searchText) {
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
    },
    
    // ============================================================
    // 创建加入房间按钮（使用 btn_enter_room.png）
    // ============================================================
    _createEnterRoomButton: function() {
        var self = this;
        
        
        // 移除旧的按钮
        var oldBtn = this.node.getChildByName("EnterRoomButton");
        if (oldBtn) oldBtn.destroy();
        
        // 获取画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        
        // 创建按钮节点
        var btnNode = new cc.Node("EnterRoomButton");
        btnNode.setContentSize(cc.size(180, 60));
        btnNode.anchorX = 0.5;
        btnNode.anchorY = 0.5;
        
        // 放在左侧中间位置
        btnNode.x = -screenWidth / 2 + 120;
        btnNode.y = 0;
        btnNode.zIndex = 1000;
        btnNode.parent = this.node;
        
        // 加载按钮图片
        var sprite = btnNode.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        
        cc.resources.load('UI/btn_enter_room', cc.SpriteFrame, function(err, spriteFrame) {
            if (err) {
                console.warn("加载 btn_enter_room 失败，使用备用样式");
                self._createEnterRoomButtonFallback(btnNode);
                return;
            }
            sprite.spriteFrame = spriteFrame;
        });
        
        // 添加按钮组件
        var button = btnNode.addComponent(cc.Button);
        button.transition = cc.Button.Transition.SCALE;
        button.duration = 0.1;
        button.zoomScale = 1.1;
        
        // 添加点击事件
        btnNode.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            self._showEnterRoomPopup();
        }, this);
        
    },
    
    // 备用按钮样式
    _createEnterRoomButtonFallback: function(btnNode) {
        var sprite = btnNode.getComponent(cc.Sprite);
        if (!sprite) {
            sprite = btnNode.addComponent(cc.Sprite);
        }
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        
        // 绘制按钮背景 - 橙色渐变风格
        var graphics = btnNode.addComponent(cc.Graphics);
        graphics.fillColor = cc.color(255, 140, 0);  // 橙色
        graphics.roundRect(-90, -30, 180, 60, 12);
        graphics.fill();
        graphics.strokeColor = cc.color(255, 200, 100);  // 金色边框
        graphics.lineWidth = 3;
        graphics.roundRect(-90, -30, 180, 60, 12);
        graphics.stroke();
        
        // 添加图标和文字
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
    },
    
    // ============================================================
    // 显示加入房间弹窗 - 重新设计，更清晰美观
    // ============================================================
    _showEnterRoomPopup: function() {
        var self = this;
        
        
        // 移除旧的弹窗
        var oldPopup = this.node.getChildByName("EnterRoomPopup");
        if (oldPopup) oldPopup.destroy();
        
        // 获取画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        
        // 创建弹窗容器
        var popup = new cc.Node("EnterRoomPopup");
        popup.setContentSize(cc.size(screenWidth, screenHeight));
        popup.anchorX = 0.5;
        popup.anchorY = 0.5;
        popup.x = 0;
        popup.y = 0;
        popup.zIndex = 2000;
        popup.parent = this.node;
        
        // 添加 BlockInputEvents 组件阻止底层点击
        popup.addComponent(cc.BlockInputEvents);
        
        // ===== 半透明背景遮罩 =====
        var bgMask = new cc.Node("BgMask");
        bgMask.setContentSize(cc.size(screenWidth, screenHeight));
        var bgGfx = bgMask.addComponent(cc.Graphics);
        bgGfx.fillColor = cc.color(0, 0, 0, 180);
        bgGfx.rect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight);
        bgGfx.fill();
        bgMask.parent = popup;
        
        // 点击遮罩关闭
        bgMask.on(cc.Node.EventType.TOUCH_END, function() {
            popup.destroy();
        }, this);
        
        // ===== 弹窗面板 - 更大的尺寸 =====
        var panelWidth = 500;
        var panelHeight = 380;
        var panel = new cc.Node("Panel");
        panel.setContentSize(cc.size(panelWidth, panelHeight));
        panel.parent = popup;
        
        // 外层阴影
        var shadow = new cc.Node("Shadow");
        var shadowGfx = shadow.addComponent(cc.Graphics);
        shadowGfx.fillColor = cc.color(0, 0, 0, 60);
        shadowGfx.roundRect(-panelWidth/2 + 8, -panelHeight/2 - 8, panelWidth, panelHeight, 16);
        shadowGfx.fill();
        shadow.parent = panel;
        
        // 主背景 - 深色优雅风格
        var mainBg = new cc.Node("MainBg");
        mainBg.setContentSize(cc.size(panelWidth, panelHeight));
        var mainGfx = mainBg.addComponent(cc.Graphics);
        mainGfx.fillColor = cc.color(30, 28, 45, 255);
        mainGfx.roundRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 16);
        mainGfx.fill();
        mainGfx.strokeColor = cc.color(100, 85, 60);
        mainGfx.lineWidth = 3;
        mainGfx.roundRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 16);
        mainGfx.stroke();
        mainBg.parent = panel;
        
        // ===== 顶部装饰条 =====
        var topBar = new cc.Node("TopBar");
        topBar.setContentSize(cc.size(panelWidth, 8));
        topBar.y = panelHeight/2 - 4;
        var topGfx = topBar.addComponent(cc.Graphics);
        topGfx.fillColor = cc.color(76, 175, 80);  // 绿色主题色
        topGfx.roundRect(-panelWidth/2, -4, panelWidth, 8, [16, 16, 0, 0]);
        topGfx.fill();
        topBar.parent = panel;
        
        // ===== 标题区域 =====
        var titleBg = new cc.Node("TitleBg");
        titleBg.setContentSize(cc.size(panelWidth - 40, 60));
        titleBg.y = panelHeight/2 - 50;
        var titleBgGfx = titleBg.addComponent(cc.Graphics);
        titleBgGfx.fillColor = cc.color(45, 42, 65, 250);
        titleBgGfx.roundRect(-(panelWidth - 40)/2, -30, panelWidth - 40, 60, 10);
        titleBgGfx.fill();
        titleBg.parent = panel;
        
        // 图标
        var iconNode = new cc.Node("Icon");
        var iconLabel = iconNode.addComponent(cc.Label);
        iconLabel.string = "🔑";
        iconLabel.fontSize = 32;
        iconNode.x = -100;
        iconNode.y = panelHeight/2 - 50;
        iconNode.parent = panel;
        
        // 标题文字
        var titleNode = new cc.Node("Title");
        var titleLabel = titleNode.addComponent(cc.Label);
        titleLabel.string = "加入房间";
        titleLabel.fontSize = 28;
        titleLabel.lineHeight = 40;
        titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        titleNode.color = cc.color(255, 255, 255);
        titleNode.y = panelHeight/2 - 50;
        titleNode.parent = panel;
        
        // 副标题说明
        var subtitleNode = new cc.Node("Subtitle");
        var subtitleLabel = subtitleNode.addComponent(cc.Label);
        subtitleLabel.string = "输入好友分享的房间号即可加入游戏";
        subtitleLabel.fontSize = 14;
        subtitleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        subtitleNode.color = cc.color(180, 170, 150);
        subtitleNode.y = panelHeight/2 - 95;
        subtitleNode.parent = panel;
        
        // ===== 房间号输入区域 =====
        var inputAreaY = 20;
        
        // 输入框标签
        var inputLabel = new cc.Node("InputLabel");
        var inputLabelComp = inputLabel.addComponent(cc.Label);
        inputLabelComp.string = "房间号";
        inputLabelComp.fontSize = 16;
        inputLabel.color = cc.color(200, 190, 160);
        inputLabel.x = -panelWidth/2 + 70;
        inputLabel.y = inputAreaY + 45;
        inputLabel.parent = panel;
        
        // 输入框背景
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
        inputBg.parent = panel;
        
        // 输入框
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
        inputNode.parent = inputBg;
        
        // ===== 提示信息 =====
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
        tipNode.parent = panel;
        
        // ===== 按钮区域 =====
        var btnY = -panelHeight/2 + 55;
        
        // 取消按钮
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
        
        cancelBtn.on(cc.Node.EventType.TOUCH_END, function() {
            popup.destroy();
        }, this);
        
        // 确认加入按钮 - 绿色主题
        var confirmBtn = new cc.Node("ConfirmBtn");
        confirmBtn.setContentSize(cc.size(160, 48));
        confirmBtn.x = 100;
        confirmBtn.y = btnY;
        var confirmGfx = confirmBtn.addComponent(cc.Graphics);
        confirmGfx.fillColor = cc.color(76, 175, 80);  // 绿色
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
        confirmBtnComp.zoomScale = 0.95;
        
        // 确认按钮点击事件
        confirmBtn.on(cc.Node.EventType.TOUCH_END, function() {
            var roomId = editBox.string;
            
            if (!roomId || roomId.length === 0) {
                self._showMessage("请输入房间号");
                return;
            }
            
            // 发送加入房间请求
            self._joinRoomById(roomId, popup);
        }, this);
        
        // ===== 关闭按钮（右上角） =====
        var closeBtn = new cc.Node("CloseBtn");
        closeBtn.setContentSize(cc.size(40, 40));
        closeBtn.x = panelWidth/2 - 25;
        closeBtn.y = panelHeight/2 - 25;
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
        
        closeBtn.on(cc.Node.EventType.TOUCH_END, function() {
            popup.destroy();
        }, this);
        
    },
    
    // ============================================================
    // 通过房间号加入房间
    // ============================================================
    _joinRoomById: function(roomId, popup) {
        var self = this;
        var myglobal = window.myglobal;
        
        if (!myglobal || !myglobal.socket) {
            this._showMessage("网络未连接，请稍后重试");
            return;
        }
        
        this._showMessage("正在加入房间...");
        
        // 发送加入房间请求
        myglobal.socket.request_joinRoom({
            roomId: roomId
        }, function(err, result) {
            if (err !== 0) {
                self._showMessage("加入房间失败: " + (result || "房间不存在"));
                return;
            }
            
            self._showMessage("加入成功！");
            
            // 关闭弹窗
            if (popup) popup.destroy();
            
            // 跳转到游戏场景
            if (result && result.roomId) {
                myglobal.currentRoomId = result.roomId;
            }
            
            // 延迟跳转
            self.scheduleOnce(function() {
                cc.director.loadScene("gameScene");
            }, 0.5);
        });
    },
    
    // ============================================================
    // 【竞技场功能】更新货币显示（欢乐豆/竞技币）
    // 修改：同时显示欢乐豆和竞技币，而不是切换显示
    // ============================================================
    _updateCurrencyDisplay: function() {
        var myglobal = window.myglobal;
        var playerData = myglobal ? myglobal.playerData : null;
        
        if (!playerData) return;
        
        // 同时更新欢乐豆和竞技币显示
        this._updateBothCurrencyDisplay();
    },
    
    // 更新货币图标
    _updateCurrencyIcon: function(roomCategory) {
        // 查找或创建货币图标节点
        var playerNode = this.node.getChildByName("player_node");
        if (!playerNode) return;
        
        // 尝试找到货币图标
        var currencyIcon = playerNode.getChildByName("currency_icon");
        if (!currencyIcon) {
            // 如果没有现有图标，创建一个
            currencyIcon = new cc.Node("currency_icon");
            currencyIcon.setPosition(-100, 80);
            currencyIcon.zIndex = 10;
            currencyIcon.parent = playerNode;
        }
        
        // 根据类型显示不同图标（这里用文字代替，实际项目可以换图片）
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
    },
    
    // 初始化竞技币显示
    // 修改：货币显示已在 _adjustGoldElementsPosition 中统一创建，这里只需要确保数据更新
    _initArenaCoinDisplay: function() {
        var myglobal = window.myglobal;
        var playerData = myglobal ? myglobal.playerData : null;
        
        // 如果有竞技币Label属性，更新显示
        if (this.arena_coin_label && playerData) {
            this.arena_coin_label.string = "竞技币: " + this._formatGold(playerData.arena_coin || 0);
        }
        
        // 确保新创建的货币显示节点也已更新
        this._updateBothCurrencyDisplay();
    },
    
    // 🔧【新增】监听竞技币更新事件（报名成功后刷新UI）
    _listenArenaCoinUpdate: function() {
        var self = this;
        var myglobal = window.myglobal;
        
        if (!myglobal || !myglobal.eventlister) {
            console.warn("🏟️ [HallScene] eventlister 未初始化，无法监听竞技币更新");
            return;
        }
        
        // 监听竞技币更新事件
        myglobal.eventlister.on('arena_coin_updated', function(data) {
            console.log("🏟️ [HallScene] 收到竞技币更新事件:", data);
            
            // 更新玩家数据
            if (data && data.arena_coin !== undefined && myglobal.playerData) {
                myglobal.playerData.arena_coin = data.arena_coin;
            }
            
            // 刷新UI显示
            self._updateBothCurrencyDisplay();
            
            // 同时也更新竞技币 Label（如果有）
            if (self.arena_coin_label && data && data.arena_coin !== undefined) {
                self.arena_coin_label.string = "竞技币: " + self._formatGold(data.arena_coin);
            }
        });
        
        console.log("🏟️ [HallScene] 已注册竞技币更新事件监听");
    },
    
    // 获取最新的玩家余额（金币和竞技币）
    _refreshPlayerBalance: function() {
        var self = this;
        
        if (window.arenaData && window.arenaData.refreshBalance) {
            window.arenaData.refreshBalance(function(err, data) {
                if (err) {
                    console.warn("获取玩家余额失败:", err);
                    return;
                }
                
                // 更新UI显示
                self._updateCurrencyDisplay();
                if (self.arena_coin_label && data.arena_coin !== undefined) {
                    self.arena_coin_label.string = "竞技币: " + self._formatGold(data.arena_coin);
                }
            });
        }
    },
    
    // ============================================================
    // 【竞技场功能】显示报名弹窗
    // ============================================================
    _showSignupDialog: function(roomConfig) {
        var self = this;
        var myglobal = window.myglobal;
        var playerData = myglobal ? myglobal.playerData : null;
        var playerArenaCoin = playerData ? (playerData.arena_coin || 0) : 0;
        
        // 获取报名费
        var signupFee = roomConfig.signup_fee || roomConfig.signupFee || 0;
        
        // 移除旧弹窗
        var oldDialog = this.node.getChildByName("SignupDialog");
        if (oldDialog) oldDialog.destroy();
        
        // 获取画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        
        // 创建弹窗容器
        var dialog = new cc.Node("SignupDialog");
        dialog.setContentSize(cc.size(screenWidth, screenHeight));
        dialog.setPosition(0, 0);
        dialog.zIndex = 3000;
        dialog.parent = this.node;
        
        // 半透明遮罩
        var mask = new cc.Node("Mask");
        var maskG = mask.addComponent(cc.Graphics);
        maskG.fillColor = cc.color(0, 0, 0, 180);
        maskG.rect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight);
        maskG.fill();
        mask.parent = dialog;
        
        mask.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
        });
        
        // 弹窗主体
        var dialogWidth = 420;
        var dialogHeight = 380;
        var dialogBg = new cc.Node("DialogBg");
        dialogBg.setContentSize(cc.size(dialogWidth, dialogHeight));
        
        var dbg = dialogBg.addComponent(cc.Graphics);
        dbg.fillColor = cc.color(35, 30, 50, 250);
        dbg.roundRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 12);
        dbg.fill();
        dbg.strokeColor = cc.color(180, 140, 60, 200);
        dbg.lineWidth = 3;
        dbg.roundRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 12);
        dbg.stroke();
        dialogBg.parent = dialog;
        
        // 标题
        var titleText = new cc.Node("Title");
        titleText.setPosition(0, dialogHeight/2 - 40);
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
        titleText.parent = dialog;
        
        // 房间名称
        var roomNameText = new cc.Node("RoomName");
        roomNameText.setPosition(0, dialogHeight/2 - 80);
        roomNameText.anchorX = 0.5;
        roomNameText.anchorY = 0.5;
        var rnl = roomNameText.addComponent(cc.Label);
        rnl.string = roomConfig.room_name || "竞技场";
        rnl.fontSize = 20;
        rnl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        roomNameText.color = cc.color(200, 180, 140);
        roomNameText.parent = dialog;
        
        // 报名费信息
        var feeLabel = new cc.Node("FeeLabel");
        feeLabel.setPosition(-dialogWidth/2 + 30, dialogHeight/2 - 130);
        feeLabel.anchorX = 0;
        feeLabel.anchorY = 0.5;
        var fl = feeLabel.addComponent(cc.Label);
        fl.string = "报名费：";
        fl.fontSize = 18;
        feeLabel.color = cc.color(220, 210, 190);
        feeLabel.parent = dialog;
        
        var feeValue = new cc.Node("FeeValue");
        feeValue.setPosition(60, dialogHeight/2 - 130);
        feeValue.anchorX = 0;
        feeValue.anchorY = 0.5;
        var fv = feeValue.addComponent(cc.Label);
        fv.string = this._formatGold(signupFee) + " 竞技币";
        fv.fontSize = 20;
        feeValue.color = cc.color(255, 215, 0);
        feeValue.parent = dialog;
        
        // 当前余额
        var balanceLabel = new cc.Node("BalanceLabel");
        balanceLabel.setPosition(-dialogWidth/2 + 30, dialogHeight/2 - 170);
        balanceLabel.anchorX = 0;
        balanceLabel.anchorY = 0.5;
        var bl = balanceLabel.addComponent(cc.Label);
        bl.string = "当前余额：";
        bl.fontSize = 18;
        balanceLabel.color = cc.color(220, 210, 190);
        balanceLabel.parent = dialog;
        
        var balanceValue = new cc.Node("BalanceValue");
        balanceValue.setPosition(60, dialogHeight/2 - 170);
        balanceValue.anchorX = 0;
        balanceValue.anchorY = 0.5;
        var bv = balanceValue.addComponent(cc.Label);
        bv.string = this._formatGold(playerArenaCoin) + " 竞技币";
        bv.fontSize = 20;
        balanceValue.color = playerArenaCoin >= signupFee ? cc.color(100, 220, 100) : cc.color(255, 100, 100);
        balanceValue.parent = dialog;
        
        // 冠军奖励预览
        var rewardLabel = new cc.Node("RewardLabel");
        rewardLabel.setPosition(-dialogWidth/2 + 30, dialogHeight/2 - 210);
        rewardLabel.anchorX = 0;
        rewardLabel.anchorY = 0.5;
        var rl = rewardLabel.addComponent(cc.Label);
        rl.string = "冠军奖励：";
        rl.fontSize = 18;
        rewardLabel.color = cc.color(220, 210, 190);
        rewardLabel.parent = dialog;
        
        var championReward = roomConfig.champion_reward || roomConfig.championReward || { coins: 0 };
        var rewardValue = new cc.Node("RewardValue");
        rewardValue.setPosition(60, dialogHeight/2 - 210);
        rewardValue.anchorX = 0;
        rewardValue.anchorY = 0.5;
        var rv = rewardValue.addComponent(cc.Label);
        rv.string = this._formatGold(championReward.coins || 0) + " 竞技币";
        rv.fontSize = 20;
        rewardValue.color = cc.color(255, 180, 50);
        rewardValue.parent = dialog;
        
        // 按钮区域
        var btnY = -dialogHeight/2 + 55;
        
        // 判断余额是否足够
        var isEnough = playerArenaCoin >= signupFee;
        
        // 取消按钮
        var cancelBtn = this._createDialogButton(
            "取消",
            cc.color(80, 75, 95),
            -90, btnY,
            130, 48,
            function() {
                dialog.destroy();
            }
        );
        cancelBtn.parent = dialog;
        
        if (isEnough) {
            // 报名按钮
            var signupBtn = this._createDialogButton(
                "确认报名",
                cc.color(76, 175, 80),  // 绿色
                90, btnY,
                150, 48,
                function() {
                    // 调用报名接口
                    self._doSignup(roomConfig, dialog);
                }
            );
            signupBtn.parent = dialog;
        } else {
            // 余额不足 - 显示观看广告按钮
            var adBtn = this._createDialogButton(
                "观看广告获取",
                cc.color(255, 152, 0),  // 橙色
                90, btnY,
                150, 48,
                function() {
                    dialog.destroy();
                    self._showAdRewardDialog('arena_coin', signupFee - playerArenaCoin);
                }
            );
            adBtn.parent = dialog;
            
            // 提示余额不足
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
        }
        
        // 关闭按钮
        var closeBtn = new cc.Node("CloseBtn");
        closeBtn.setContentSize(cc.size(30, 30));
        closeBtn.x = dialogWidth/2 - 25;
        closeBtn.y = dialogHeight/2 - 30;
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
        
        closeBtn.on(cc.Node.EventType.TOUCH_END, function() {
            dialog.destroy();
        });
    },
    
    // 执行报名
    _doSignup: function(roomConfig, dialog) {
        var self = this;
        
        if (!window.arenaData) {
            this._showMessage("竞技场数据未初始化");
            return;
        }
        
        this._showMessageCenter("正在报名...");
        
        window.arenaData.signup(roomConfig.id, function(err, result) {
            if (err) {
                self._showMessageCenter("报名失败: " + err);
                return;
            }
            
            self._showMessageCenter("报名成功！");
            
            // 关闭弹窗
            if (dialog) dialog.destroy();
            
            // 更新货币显示
            if (window.arenaData.refreshBalance) {
                window.arenaData.refreshBalance();
            }
            self._updateCurrencyDisplay();
            
            // 显示已报名状态弹窗
            self.scheduleOnce(function() {
                self._showSignedUpDialog(roomConfig);
            }, 0.5);
        });
    },
    
    // ============================================================
    // 【竞技场功能】显示已报名状态弹窗
    // ============================================================
    _showSignedUpDialog: function(roomConfig) {
        var self = this;
        
        // 移除旧弹窗
        var oldDialog = this.node.getChildByName("SignedUpDialog");
        if (oldDialog) oldDialog.destroy();
        
        // 获取画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        
        // 创建弹窗容器
        var dialog = new cc.Node("SignedUpDialog");
        dialog.setContentSize(cc.size(screenWidth, screenHeight));
        dialog.setPosition(0, 0);
        dialog.zIndex = 3000;
        dialog.parent = this.node;
        
        // 半透明遮罩
        var mask = new cc.Node("Mask");
        var maskG = mask.addComponent(cc.Graphics);
        maskG.fillColor = cc.color(0, 0, 0, 180);
        maskG.rect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight);
        maskG.fill();
        mask.parent = dialog;
        
        mask.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
        });
        
        // 弹窗主体
        var dialogWidth = 380;
        var dialogHeight = 320;
        var dialogBg = new cc.Node("DialogBg");
        dialogBg.setContentSize(cc.size(dialogWidth, dialogHeight));
        
        var dbg = dialogBg.addComponent(cc.Graphics);
        dbg.fillColor = cc.color(35, 30, 50, 250);
        dbg.roundRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 12);
        dbg.fill();
        dbg.strokeColor = cc.color(76, 175, 80, 200);
        dbg.lineWidth = 3;
        dbg.roundRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 12);
        dbg.stroke();
        dialogBg.parent = dialog;
        
        // 标题
        var titleText = new cc.Node("Title");
        titleText.setPosition(0, dialogHeight/2 - 40);
        titleText.anchorX = 0.5;
        titleText.anchorY = 0.5;
        var ttl = titleText.addComponent(cc.Label);
        ttl.string = "已报名";
        ttl.fontSize = 26;
        ttl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        titleText.color = cc.color(100, 220, 100);
        titleText.parent = dialog;
        
        // 房间名称
        var roomNameText = new cc.Node("RoomName");
        roomNameText.setPosition(0, dialogHeight/2 - 80);
        roomNameText.anchorX = 0.5;
        roomNameText.anchorY = 0.5;
        var rnl = roomNameText.addComponent(cc.Label);
        rnl.string = roomConfig.room_name || "竞技场";
        rnl.fontSize = 20;
        rnl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        roomNameText.color = cc.color(200, 180, 140);
        roomNameText.parent = dialog;
        
        // 倒计时显示
        var countdownLabel = new cc.Node("CountdownLabel");
        countdownLabel.setPosition(0, dialogHeight/2 - 130);
        countdownLabel.anchorX = 0.5;
        countdownLabel.anchorY = 0.5;
        var cl = countdownLabel.addComponent(cc.Label);
        cl.string = "开赛倒计时：计算中...";
        cl.fontSize = 18;
        cl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        countdownLabel.color = cc.color(255, 220, 100);
        countdownLabel.parent = dialog;
        
        // 更新倒计时
        var updateCountdown = function() {
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
                dialog.destroy();
                // 这里可以调用进入比赛的方法
            } else {
                self.scheduleOnce(updateCountdown, 1);
            }
        };
        updateCountdown();
        
        // 按钮区域
        var btnY = -dialogHeight/2 + 55;
        
        // 取消报名按钮
        var cancelSignupBtn = this._createDialogButton(
            "取消报名",
            cc.color(200, 100, 80),  // 红色
            -80, btnY,
            130, 48,
            function() {
                self._cancelSignup(roomConfig, dialog);
            }
        );
        cancelSignupBtn.parent = dialog;
        
        // 关闭按钮
        var closeBtn = this._createDialogButton(
            "关闭",
            cc.color(80, 75, 95),
            80, btnY,
            100, 48,
            function() {
                dialog.destroy();
            }
        );
        closeBtn.parent = dialog;
    },
    
    // 取消报名
    _cancelSignup: function(roomConfig, dialog) {
        var self = this;
        
        if (!window.arenaData) {
            this._showMessage("竞技场数据未初始化");
            return;
        }
        
        window.arenaData.cancelSignup(roomConfig.id, function(err, result) {
            if (err) {
                self._showMessageCenter("取消报名失败: " + err);
                return;
            }
            
            self._showMessageCenter("已取消报名");
            
            // 关闭弹窗
            if (dialog) dialog.destroy();
            
            // 更新货币显示
            self._updateCurrencyDisplay();
        });
    },
    
    // ============================================================
    // 【通用功能】显示广告补币弹窗
    // ============================================================
    _showAdRewardDialog: function(type, neededAmount) {
        var self = this;
        
        // 移除旧弹窗
        var oldDialog = this.node.getChildByName("AdRewardDialog");
        if (oldDialog) oldDialog.destroy();
        
        // 获取画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas);
        var screenHeight = canvas ? canvas.designResolution.height : 720;
        var screenWidth = canvas ? canvas.designResolution.width : 1280;
        
        // 创建弹窗容器
        var dialog = new cc.Node("AdRewardDialog");
        dialog.setContentSize(cc.size(screenWidth, screenHeight));
        dialog.setPosition(0, 0);
        dialog.zIndex = 3000;
        dialog.parent = this.node;
        
        // 半透明遮罩
        var mask = new cc.Node("Mask");
        var maskG = mask.addComponent(cc.Graphics);
        maskG.fillColor = cc.color(0, 0, 0, 180);
        maskG.rect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight);
        maskG.fill();
        mask.parent = dialog;
        
        mask.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
        });
        
        // 弹窗主体
        var dialogWidth = 380;
        var dialogHeight = 300;
        var dialogBg = new cc.Node("DialogBg");
        dialogBg.setContentSize(cc.size(dialogWidth, dialogHeight));
        
        var dbg = dialogBg.addComponent(cc.Graphics);
        dbg.fillColor = cc.color(35, 30, 50, 250);
        dbg.roundRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 12);
        dbg.fill();
        dbg.strokeColor = cc.color(255, 152, 0, 200);
        dbg.lineWidth = 3;
        dbg.roundRect(-dialogWidth/2, -dialogHeight/2, dialogWidth, dialogHeight, 12);
        dbg.stroke();
        dialogBg.parent = dialog;
        
        // 标题
        var titleText = new cc.Node("Title");
        titleText.setPosition(0, dialogHeight/2 - 40);
        titleText.anchorX = 0.5;
        titleText.anchorY = 0.5;
        var ttl = titleText.addComponent(cc.Label);
        ttl.string = type === 'arena_coin' ? "竞技币不足" : "欢乐豆不足";
        ttl.fontSize = 26;
        ttl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        titleText.color = cc.color(255, 150, 100);
        titleText.parent = dialog;
        
        // 说明文字
        var descText = new cc.Node("Desc");
        descText.setPosition(0, dialogHeight/2 - 90);
        descText.anchorX = 0.5;
        descText.anchorY = 0.5;
        var dl = descText.addComponent(cc.Label);
        dl.string = "观看激励视频领取" + this._formatGold(neededAmount) + (type === 'arena_coin' ? "竞技币" : "欢乐豆") + "继续游戏";
        dl.fontSize = 16;
        dl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        descText.color = cc.color(200, 190, 170);
        descText.parent = dialog;
        
        // 广告图标/提示
        var adIcon = new cc.Node("AdIcon");
        adIcon.setPosition(0, 0);
        adIcon.anchorX = 0.5;
        adIcon.anchorY = 0.5;
        var ail = adIcon.addComponent(cc.Label);
        ail.string = "🎬";
        ail.fontSize = 48;
        adIcon.parent = dialog;
        
        // 按钮区域
        var btnY = -dialogHeight/2 + 55;
        
        // 取消按钮
        var cancelBtn = this._createDialogButton(
            "取消",
            cc.color(80, 75, 95),
            -80, btnY,
            120, 48,
            function() {
                dialog.destroy();
            }
        );
        cancelBtn.parent = dialog;
        
        // 观看领取按钮
        var watchBtn = this._createDialogButton(
            "观看领取",
            cc.color(255, 152, 0),  // 橙色
            80, btnY,
            140, 48,
            function() {
                self._watchAdAndGetReward(type, dialog);
            }
        );
        watchBtn.parent = dialog;
    },
    
    // 观看广告获取奖励
    _watchAdAndGetReward: function(type, dialog) {
        var self = this;
        
        // 这里应该调用广告SDK显示激励视频
        // 目前模拟观看完成
        this._showMessageCenter("正在加载广告...");
        
        // 模拟广告观看完成
        this.scheduleOnce(function() {
            if (!window.arenaData) {
                self._showMessageCenter("数据未初始化");
                return;
            }
            
            window.arenaData.watchAdForReward(type, function(err, result) {
                if (err) {
                    self._showMessageCenter("获取奖励失败: " + err);
                    return;
                }
                
                self._showMessageCenter("获得奖励！");
                
                // 关闭弹窗
                if (dialog) dialog.destroy();
                
                // 更新货币显示
                self._updateCurrencyDisplay();
            });
        }, 1.5);
    },
    
    // ============================================================
    // 初始化顶部按钮（设置、帮助等）
    // ============================================================
    _initTopButtons: function() {
        var self = this;
        
        // 设置按钮 - 场景中节点名为 "shezhi"
        var settingBtn = this.node.getChildByName("shezhi");
        if (settingBtn) {
            settingBtn.off(cc.Node.EventType.TOUCH_END);
            settingBtn.on(cc.Node.EventType.TOUCH_END, function(event) {
                event.stopPropagation();
                self._showSettingsDialog();
            });
        }
        
        // 帮助按钮 - 场景中节点名为 "bangzhu"
        var helpBtn = this.node.getChildByName("bangzhu");
        if (helpBtn) {
            helpBtn.off(cc.Node.EventType.TOUCH_END);
            helpBtn.on(cc.Node.EventType.TOUCH_END, function(event) {
                event.stopPropagation();
                self._showHelpDialog();
            });
        }
        
        // 消息按钮 - 场景中节点名为 "xiao'xi"
        var msgBtn = this.node.getChildByName("xiao'xi");
        if (msgBtn) {
            msgBtn.off(cc.Node.EventType.TOUCH_END);
            msgBtn.on(cc.Node.EventType.TOUCH_END, function(event) {
                event.stopPropagation();
                self._showMessageCenter("暂无新消息");
            });
        }
    },
    
    // ============================================================
    // 显示设置弹窗
    // ============================================================
    _showSettingsDialog: function() {
        var self = this;
        
        // 检查是否已有设置弹窗
        var existingDialog = this.node.getChildByName("SettingsDialog");
        if (existingDialog) {
            existingDialog.destroy();
            return;
        }
        
        // ==================== 从本地存储加载设置 ====================
        var loadSettings = function() {
            var settings = {
                bgm: 1,
                sfx: 1,
                vibration: 1
            };
            
            if (typeof StorageUtil !== 'undefined') {
                var savedSettings = StorageUtil.getItem(StorageUtil.KEYS.USER_SETTINGS, null, true);
                if (savedSettings && typeof savedSettings === 'object') {
                    settings.bgm = savedSettings.bgm !== undefined ? savedSettings.bgm : 1;
                    settings.sfx = savedSettings.sfx !== undefined ? savedSettings.sfx : 1;
                    settings.vibration = savedSettings.vibration !== undefined ? savedSettings.vibration : 1;
                }
            }
            
            // 同步到全局变量
            window.isopen_sound = settings.bgm;
            window.isopen_vibration = settings.vibration;
            window.isopen_sfx = settings.sfx;
            
            return settings;
        };
        
        // ==================== 保存设置到本地存储 ====================
        var saveSettings = function(key, value) {
            var settings = {
                bgm: window.isopen_sound !== undefined ? window.isopen_sound : 1,
                sfx: window.isopen_sfx !== undefined ? window.isopen_sfx : 1,
                vibration: window.isopen_vibration !== undefined ? window.isopen_vibration : 1,
                savedAt: Date.now()
            };
            
            // 更新指定键值
            settings[key] = value;
            
            if (typeof StorageUtil !== 'undefined') {
                StorageUtil.setItem(StorageUtil.KEYS.USER_SETTINGS, settings);
                console.log("[Settings] 已保存设置:", key, "=", value);
            }
        };
        
        // 加载当前设置
        var currentSettings = loadSettings();
        
        // 创建弹窗容器
        var dialog = new cc.Node("SettingsDialog");
        dialog.setPosition(0, 0);
        dialog.anchorX = 0.5;
        dialog.anchorY = 0.5;
        dialog.zIndex = 1000;
        dialog.parent = this.node;
        
        // 遮罩层 - 深色半透明
        var mask = new cc.Node("Mask");
        mask.setPosition(0, 0);
        mask.setContentSize(cc.size(1280, 720));
        mask.anchorX = 0.5;
        mask.anchorY = 0.5;
        var maskGraphics = mask.addComponent(cc.Graphics);
        maskGraphics.fillColor = cc.color(0, 0, 0, 160);
        maskGraphics.rect(-640, -360, 1280, 720);
        maskGraphics.fill();
        mask.parent = dialog;
        
        // 点击遮罩关闭
        mask.on(cc.Node.EventType.TOUCH_END, function() {
            dialog.destroy();
        });
        
        // ==================== 弹窗背景 - 美化样式 ====================
        var bgWidth = 420;
        var bgHeight = 380;
        var bgNode = new cc.Node("BgNode");
        bgNode.setPosition(0, 0);
        bgNode.setContentSize(cc.size(bgWidth, bgHeight));
        bgNode.anchorX = 0.5;
        bgNode.anchorY = 0.5;
        var bgGraphics = bgNode.addComponent(cc.Graphics);
        
        // 绘制阴影效果
        bgGraphics.fillColor = cc.color(0, 0, 0, 60);
        bgGraphics.roundRect(-bgWidth/2 + 5, -bgHeight/2 - 5, bgWidth, bgHeight, 16);
        bgGraphics.fill();
        
        // 主背景 - 深色渐变风格
        bgGraphics.fillColor = cc.color(35, 35, 50, 250);
        bgGraphics.roundRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, 16);
        bgGraphics.fill();
        
        // 金色边框
        bgGraphics.strokeColor = cc.color(218, 165, 32, 255);
        bgGraphics.lineWidth = 2;
        bgGraphics.stroke();
        bgNode.parent = dialog;
        
        // ==================== 标题栏背景 ====================
        var titleBarHeight = 50;
        var titleBar = new cc.Node("TitleBar");
        titleBar.setPosition(0, bgHeight/2 - titleBarHeight/2);
        titleBar.setContentSize(cc.size(bgWidth - 4, titleBarHeight));
        titleBar.anchorX = 0.5;
        titleBar.anchorY = 0.5;
        var titleBarGraphics = titleBar.addComponent(cc.Graphics);
        titleBarGraphics.fillColor = cc.color(60, 50, 80, 255);
        titleBarGraphics.roundRect(-(bgWidth - 4)/2, -titleBarHeight/2, bgWidth - 4, titleBarHeight, 14);
        titleBarGraphics.fill();
        titleBar.parent = dialog;
        
        // 标题文字 - 垂直居中
        var titleNode = new cc.Node("Title");
        titleNode.setPosition(0, bgHeight/2 - titleBarHeight/2);
        var titleLabel = titleNode.addComponent(cc.Label);
        titleLabel.string = "设  置";
        titleLabel.fontSize = 24;
        titleLabel.lineHeight = titleBarHeight;
        titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        titleLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
        titleNode.color = cc.color(255, 215, 0);
        titleNode.parent = dialog;
        
        // ==================== 设置项容器 ====================
        var settingsStartY = bgHeight/2 - titleBarHeight - 30;
        var itemHeight = 52;
        var itemGap = 8;
        
        // ==================== 创建开关项的函数 - 优化版 ====================
        var createToggleItem = function(title, icon, y, isEnabled, key, callback) {
            // 选项背景容器
            var itemContainer = new cc.Node("ItemContainer_" + key);
            itemContainer.setPosition(0, y);
            itemContainer.setContentSize(cc.size(bgWidth - 30, itemHeight));
            itemContainer.anchorX = 0.5;
            itemContainer.anchorY = 0.5;
            itemContainer.parent = dialog;
            
            // 背景条 - 圆角矩形
            var itemBg = new cc.Node("ItemBg");
            itemBg.setPosition(0, 0);
            itemBg.setContentSize(cc.size(bgWidth - 30, itemHeight - 4));
            itemBg.anchorX = 0.5;
            itemBg.anchorY = 0.5;
            var itemGraphics = itemBg.addComponent(cc.Graphics);
            itemGraphics.fillColor = cc.color(55, 50, 70, 255);
            itemGraphics.roundRect(-(bgWidth - 30)/2, -(itemHeight - 4)/2, bgWidth - 30, itemHeight - 4, 10);
            itemGraphics.fill();
            itemBg.parent = itemContainer;
            
            // 图标节点
            var iconNode = new cc.Node("Icon");
            iconNode.setPosition(-(bgWidth - 30)/2 + 28, 0);
            var iconLabel = iconNode.addComponent(cc.Label);
            iconLabel.string = icon;
            iconLabel.fontSize = 22;
            iconLabel.lineHeight = itemHeight;
            iconLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            iconLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
            iconNode.parent = itemContainer;
            
            // 标签文字 - 确保垂直居中
            var labelNode = new cc.Node("Label");
            labelNode.setPosition(-(bgWidth - 30)/2 + 65, 0);
            var labelComp = labelNode.addComponent(cc.Label);
            labelComp.string = title;
            labelComp.fontSize = 18;
            labelComp.lineHeight = itemHeight;
            labelComp.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
            labelComp.verticalAlign = cc.Label.VerticalAlign.CENTER;
            labelNode.color = cc.color(240, 240, 240);
            labelNode.parent = itemContainer;
            
            // ==================== 开关组件 - 美化版 ====================
            var toggleWidth = 56;
            var toggleHeight = 28;
            var toggleContainer = new cc.Node("ToggleContainer");
            toggleContainer.setPosition((bgWidth - 30)/2 - 38, 0);
            toggleContainer.setContentSize(cc.size(toggleWidth, toggleHeight));
            toggleContainer.anchorX = 0.5;
            toggleContainer.anchorY = 0.5;
            toggleContainer.parent = itemContainer;
            
            // 开关状态
            var toggleState = isEnabled ? 1 : 0;
            
            // 绘制开关 - 带阴影效果
            var drawToggle = function(state, node) {
                var g = node.getComponent(cc.Graphics) || node.addComponent(cc.Graphics);
                g.clear();
                
                var halfWidth = toggleWidth / 2;
                var halfHeight = toggleHeight / 2;
                var knobRadius = 11;
                
                // 背景轨道 - 根据状态变色
                if (state === 1) {
                    // 开启状态 - 翠绿色
                    g.fillColor = cc.color(76, 175, 80, 255);
                } else {
                    // 关闭状态 - 深灰色
                    g.fillColor = cc.color(80, 80, 80, 255);
                }
                g.roundRect(-halfWidth, -halfHeight, toggleWidth, toggleHeight, halfHeight);
                g.fill();
                
                // 滑块 - 白色带阴影效果
                var knobX = state === 1 ? halfWidth - knobRadius - 3 : -halfWidth + knobRadius + 3;
                
                // 滑块阴影
                g.fillColor = cc.color(0, 0, 0, 50);
                g.circle(knobX, -2, knobRadius);
                g.fill();
                
                // 滑块本体
                g.fillColor = cc.color(255, 255, 255, 255);
                g.circle(knobX, 0, knobRadius);
                g.fill();
            };
            
            drawToggle(toggleState, toggleContainer);
            
            // 存储状态和回调
            toggleContainer._toggleState = toggleState;
            toggleContainer._key = key;
            toggleContainer._callback = callback;
            
            // 整个选项区域点击切换
            itemContainer.on(cc.Node.EventType.TOUCH_END, function(event) {
                event.stopPropagation();
                var newState = toggleContainer._toggleState === 1 ? 0 : 1;
                toggleContainer._toggleState = newState;
                drawToggle(newState, toggleContainer);
                
                // 更新全局状态并保存到本地
                if (toggleContainer._key === 'bgm') {
                    window.isopen_sound = newState;
                    saveSettings('bgm', newState);
                    if (newState === 1) {
                        self._playHallBackgroundMusic();
                    } else {
                        cc.audioEngine.stopMusic();
                    }
                } else if (toggleContainer._key === 'sfx') {
                    window.isopen_sfx = newState;
                    saveSettings('sfx', newState);
                    // 播放点击音效提示
                    if (newState === 1 && self._playClickSound) {
                        self._playClickSound();
                    }
                } else if (toggleContainer._key === 'vibration') {
                    window.isopen_vibration = newState;
                    saveSettings('vibration', newState);
                    // 触发震动提示
                    if (newState === 1 && cc.vibrateShort) {
                        cc.vibrateShort();
                    }
                }
                
                if (callback) callback(newState);
            });
            
            return itemContainer;
        };
        
        // ==================== 添加设置项 ====================
        createToggleItem("背景音乐", "🎵", settingsStartY - itemHeight/2, currentSettings.bgm, 'bgm');
        createToggleItem("游戏音效", "🔊", settingsStartY - itemHeight - itemGap - itemHeight/2, currentSettings.sfx, 'sfx');
        createToggleItem("震动反馈", "📳", settingsStartY - itemHeight * 2 - itemGap * 2 - itemHeight/2, currentSettings.vibration, 'vibration');
        
        // ==================== 分隔线 ====================
        var lineY = settingsStartY - itemHeight * 3 - itemGap * 2 - 15;
        var line = new cc.Node("Line");
        line.setPosition(0, lineY);
        var lineGraphics = line.addComponent(cc.Graphics);
        lineGraphics.strokeColor = cc.color(100, 90, 120, 150);
        lineGraphics.lineWidth = 1;
        lineGraphics.moveTo(-bgWidth/2 + 20, 0);
        lineGraphics.lineTo(bgWidth/2 - 20, 0);
        lineGraphics.stroke();
        line.parent = dialog;
        
        // ==================== 退出登录按钮 - 美化版 ====================
        var logoutBtnY = lineY - 35;
        var logoutBtn = new cc.Node("LogoutBtn");
        logoutBtn.setPosition(0, logoutBtnY);
        logoutBtn.setContentSize(cc.size(140, 42));
        logoutBtn.anchorX = 0.5;
        logoutBtn.anchorY = 0.5;
        var logoutGraphics = logoutBtn.addComponent(cc.Graphics);
        
        // 按钮阴影
        logoutGraphics.fillColor = cc.color(0, 0, 0, 80);
        logoutGraphics.roundRect(-72, -23, 144, 46, 8);
        logoutGraphics.fill();
        
        // 按钮本体 - 红色渐变效果
        logoutGraphics.fillColor = cc.color(220, 53, 69, 255);
        logoutGraphics.roundRect(-70, -21, 140, 42, 8);
        logoutGraphics.fill();
        logoutBtn.parent = dialog;
        
        // 退出登录文字 - 垂直居中
        var logoutLabel = new cc.Node("Label");
        var logoutLabelComp = logoutLabel.addComponent(cc.Label);
        logoutLabelComp.string = "退出登录";
        logoutLabelComp.fontSize = 18;
        logoutLabelComp.lineHeight = 42;
        logoutLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        logoutLabelComp.verticalAlign = cc.Label.VerticalAlign.CENTER;
        logoutLabel.color = cc.color(255, 255, 255);
        logoutLabel.parent = logoutBtn;
        
        // 退出登录点击事件
        logoutBtn.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            self._showLogoutConfirm(dialog);
        });
        
        // ==================== 关闭按钮（右上角X）- 美化版 ====================
        var closeBtn = new cc.Node("CloseBtn");
        closeBtn.setPosition(bgWidth/2 - 28, bgHeight/2 - 28);
        closeBtn.setContentSize(cc.size(32, 32));
        closeBtn.anchorX = 0.5;
        closeBtn.anchorY = 0.5;
        var closeGraphics = closeBtn.addComponent(cc.Graphics);
        closeGraphics.fillColor = cc.color(100, 90, 110, 230);
        closeGraphics.circle(0, 0, 16);
        closeGraphics.fill();
        closeGraphics.strokeColor = cc.color(180, 170, 190, 150);
        closeGraphics.lineWidth = 1;
        closeGraphics.circle(0, 0, 16);
        closeGraphics.stroke();
        closeBtn.parent = dialog;
        
        // 关闭按钮X标记 - 垂直居中
        var closeX = new cc.Node("X");
        var closeXLabel = closeX.addComponent(cc.Label);
        closeXLabel.string = "✕";
        closeXLabel.fontSize = 18;
        closeXLabel.lineHeight = 32;
        closeXLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        closeXLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
        closeX.color = cc.color(255, 255, 255);
        closeX.parent = closeBtn;
        
        closeBtn.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            dialog.destroy();
        });
    },
    
    // 显示退出登录确认弹窗
    _showLogoutConfirm: function(parentDialog) {
        var self = this;
        
        // 创建确认弹窗
        var confirmDialog = new cc.Node("LogoutConfirmDialog");
        confirmDialog.setPosition(0, 0);
        confirmDialog.anchorX = 0.5;
        confirmDialog.anchorY = 0.5;
        confirmDialog.zIndex = 1100;
        confirmDialog.parent = this.node;
        
        // 遮罩
        var mask = new cc.Node("Mask");
        mask.setContentSize(cc.size(1280, 720));
        var maskGraphics = mask.addComponent(cc.Graphics);
        maskGraphics.fillColor = cc.color(0, 0, 0, 100);
        maskGraphics.rect(-640, -360, 1280, 720);
        maskGraphics.fill();
        mask.parent = confirmDialog;
        
        // 背景 - 美化样式
        var bgWidth = 320;
        var bgHeight = 170;
        var bg = new cc.Node("Bg");
        bg.setContentSize(cc.size(bgWidth, bgHeight));
        bg.anchorX = 0.5;
        bg.anchorY = 0.5;
        var bgGraphics = bg.addComponent(cc.Graphics);
        
        // 阴影
        bgGraphics.fillColor = cc.color(0, 0, 0, 50);
        bgGraphics.roundRect(-bgWidth/2 + 4, -bgHeight/2 - 4, bgWidth, bgHeight, 12);
        bgGraphics.fill();
        
        // 主背景
        bgGraphics.fillColor = cc.color(40, 38, 55, 255);
        bgGraphics.roundRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, 12);
        bgGraphics.fill();
        
        // 边框
        bgGraphics.strokeColor = cc.color(218, 165, 32, 200);
        bgGraphics.lineWidth = 2;
        bgGraphics.stroke();
        bg.parent = confirmDialog;
        
        // 提示文字 - 垂直居中
        var tipLabel = new cc.Node("Tip");
        tipLabel.setPosition(0, 25);
        var tipLabelComp = tipLabel.addComponent(cc.Label);
        tipLabelComp.string = "确定要退出登录吗？";
        tipLabelComp.fontSize = 20;
        tipLabelComp.lineHeight = 50;
        tipLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        tipLabelComp.verticalAlign = cc.Label.VerticalAlign.CENTER;
        tipLabel.color = cc.color(255, 255, 255);
        tipLabel.parent = confirmDialog;
        
        // 按钮区域
        var btnY = -bgHeight/2 + 45;
        var btnWidth = 100;
        var btnHeight = 38;
        
        // 取消按钮 - 美化版
        var cancelBtn = new cc.Node("CancelBtn");
        cancelBtn.setPosition(-60, btnY);
        cancelBtn.setContentSize(cc.size(btnWidth, btnHeight));
        cancelBtn.anchorX = 0.5;
        cancelBtn.anchorY = 0.5;
        var cancelGraphics = cancelBtn.addComponent(cc.Graphics);
        cancelGraphics.fillColor = cc.color(70, 65, 85, 255);
        cancelGraphics.roundRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 6);
        cancelGraphics.fill();
        cancelGraphics.strokeColor = cc.color(100, 95, 115, 200);
        cancelGraphics.lineWidth = 1;
        cancelGraphics.stroke();
        cancelBtn.parent = confirmDialog;
        
        // 取消按钮文字 - 垂直居中
        var cancelLabel = new cc.Node("Label");
        var cancelLabelComp = cancelLabel.addComponent(cc.Label);
        cancelLabelComp.string = "取消";
        cancelLabelComp.fontSize = 16;
        cancelLabelComp.lineHeight = btnHeight;
        cancelLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        cancelLabelComp.verticalAlign = cc.Label.VerticalAlign.CENTER;
        cancelLabel.color = cc.color(240, 240, 240);
        cancelLabel.parent = cancelBtn;
        
        cancelBtn.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            confirmDialog.destroy();
        });
        
        // 确认按钮 - 美化版
        var confirmBtn = new cc.Node("ConfirmBtn");
        confirmBtn.setPosition(60, btnY);
        confirmBtn.setContentSize(cc.size(btnWidth, btnHeight));
        confirmBtn.anchorX = 0.5;
        confirmBtn.anchorY = 0.5;
        var confirmGraphics = confirmBtn.addComponent(cc.Graphics);
        confirmGraphics.fillColor = cc.color(220, 53, 69, 255);
        confirmGraphics.roundRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 6);
        confirmGraphics.fill();
        confirmBtn.parent = confirmDialog;
        
        // 确认按钮文字 - 垂直居中
        var confirmLabel = new cc.Node("Label");
        var confirmLabelComp = confirmLabel.addComponent(cc.Label);
        confirmLabelComp.string = "退出";
        confirmLabelComp.fontSize = 16;
        confirmLabelComp.lineHeight = btnHeight;
        confirmLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        confirmLabelComp.verticalAlign = cc.Label.VerticalAlign.CENTER;
        confirmLabel.color = cc.color(255, 255, 255);
        confirmLabel.parent = confirmBtn;
        
        confirmBtn.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            
            // 清理数据
            if (window.myglobal) {
                window.myglobal.playerData = null;
            }
            
            // 清除本地存储
            if (typeof StorageUtil !== 'undefined') {
                StorageUtil.clearPlayerSession();
            } else {
                try {
                    localStorage.removeItem('token');
                    localStorage.removeItem('playerData');
                } catch (e) {}
            }
            
            // 关闭弹窗
            confirmDialog.destroy();
            if (parentDialog) parentDialog.destroy();
            
            // 跳转到登录页
            cc.director.loadScene("loginScene");
        });
    },
    
    // 显示帮助弹窗
    _showHelpDialog: function() {
        var self = this;
        
        // 检查是否已有弹窗
        var existingDialog = this.node.getChildByName("HelpDialog");
        if (existingDialog) {
            existingDialog.destroy();
            return;
        }
        
        // ==================== 创建弹窗容器 ====================
        var dialog = new cc.Node("HelpDialog");
        dialog.setPosition(0, 0);
        dialog.anchorX = 0.5;
        dialog.anchorY = 0.5;
        dialog.zIndex = 1000;
        dialog.parent = this.node;
        
        // 遮罩层
        var mask = new cc.Node("Mask");
        mask.setContentSize(cc.size(1280, 720));
        mask.anchorX = 0.5;
        mask.anchorY = 0.5;
        var maskGraphics = mask.addComponent(cc.Graphics);
        maskGraphics.fillColor = cc.color(0, 0, 0, 160);
        maskGraphics.rect(-640, -360, 1280, 720);
        maskGraphics.fill();
        mask.parent = dialog;
        
        mask.on(cc.Node.EventType.TOUCH_END, function() {
            self._helpScrollView = null;  // 清理引用
            dialog.destroy();
        });
        
        // ==================== 弹窗背景 - 美化样式 ====================
        var bgWidth = 650;  // 加宽弹窗
        var bgHeight = 520;
        var bgNode = new cc.Node("BgNode");
        bgNode.setPosition(0, 0);
        bgNode.setContentSize(cc.size(bgWidth, bgHeight));
        bgNode.anchorX = 0.5;
        bgNode.anchorY = 0.5;
        var bgGraphics = bgNode.addComponent(cc.Graphics);
        
        // 阴影效果
        bgGraphics.fillColor = cc.color(0, 0, 0, 60);
        bgGraphics.roundRect(-bgWidth/2 + 5, -bgHeight/2 - 5, bgWidth, bgHeight, 16);
        bgGraphics.fill();
        
        // 主背景
        bgGraphics.fillColor = cc.color(35, 35, 50, 250);
        bgGraphics.roundRect(-bgWidth/2, -bgHeight/2, bgWidth, bgHeight, 16);
        bgGraphics.fill();
        
        // 金色边框
        bgGraphics.strokeColor = cc.color(218, 165, 32, 255);
        bgGraphics.lineWidth = 2;
        bgGraphics.stroke();
        bgNode.parent = dialog;
        
        // ==================== 标题栏背景 ====================
        var titleBarHeight = 50;
        var titleBar = new cc.Node("TitleBar");
        titleBar.setPosition(0, bgHeight/2 - titleBarHeight/2);
        titleBar.setContentSize(cc.size(bgWidth - 4, titleBarHeight));
        titleBar.anchorX = 0.5;
        titleBar.anchorY = 0.5;
        var titleBarGraphics = titleBar.addComponent(cc.Graphics);
        titleBarGraphics.fillColor = cc.color(60, 50, 80, 255);
        titleBarGraphics.roundRect(-(bgWidth - 4)/2, -titleBarHeight/2, bgWidth - 4, titleBarHeight, 14);
        titleBarGraphics.fill();
        titleBar.parent = dialog;
        
        // 标题文字 - 垂直居中
        var titleNode = new cc.Node("Title");
        titleNode.setPosition(0, bgHeight/2 - titleBarHeight/2);
        var titleLabel = titleNode.addComponent(cc.Label);
        titleLabel.string = "游 戏 帮 助";
        titleLabel.fontSize = 24;
        titleLabel.lineHeight = titleBarHeight;
        titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        titleLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
        titleNode.color = cc.color(255, 215, 0);
        titleNode.parent = dialog;
        
        // ==================== 内容区域 - 带滚动视图 ====================
        var contentWidth = bgWidth - 40;
        var contentHeight = bgHeight - titleBarHeight - 80;
        var contentStartY = bgHeight/2 - titleBarHeight - 20;
        
        // 创建滚动视图容器
        var scrollViewNode = new cc.Node("ScrollView");
        scrollViewNode.setPosition(0, contentStartY - contentHeight/2);
        scrollViewNode.setContentSize(cc.size(contentWidth, contentHeight));
        scrollViewNode.anchorX = 0.5;
        scrollViewNode.anchorY = 0.5;
        scrollViewNode.parent = dialog;
        
        // 添加 ScrollView 组件
        var scrollView = scrollViewNode.addComponent(cc.ScrollView);
        scrollView.horizontal = false;
        scrollView.vertical = true;
        scrollView.inertia = true;
        scrollView.brake = 0.5;
        scrollView.elastic = true;
        scrollView.bounceDuration = 0.5;
        
        // 创建 view 节点（滚动视口）
        var viewNode = new cc.Node("view");
        viewNode.setContentSize(cc.size(contentWidth, contentHeight));
        viewNode.anchorX = 0.5;
        viewNode.anchorY = 0.5;
        viewNode.x = 0;
        viewNode.y = 0;
        viewNode.parent = scrollViewNode;
        
        // 添加 Mask 组件隐藏超出内容
        var mask = viewNode.addComponent(cc.Mask);
        mask.type = cc.Mask.Type.RECT;
        
        // 创建 content 节点（滚动内容容器）
        var contentContainer = new cc.Node("content");
        contentContainer.setContentSize(cc.size(contentWidth, contentHeight));
        contentContainer.anchorX = 0.5;
        contentContainer.anchorY = 1;  // 锚点在顶部
        contentContainer.x = 0;
        contentContainer.y = contentHeight / 2;  // 顶部对齐
        contentContainer.parent = viewNode;
        
        // 设置 ScrollView 的 content
        scrollView.content = contentContainer;
        
        // 加载提示
        var loadingLabel = new cc.Node("LoadingLabel");
        loadingLabel.setPosition(0, -contentHeight/2 + 20);  // 居中显示
        var loadingLabelComp = loadingLabel.addComponent(cc.Label);
        loadingLabelComp.string = "正在加载帮助内容...";
        loadingLabelComp.fontSize = 18;
        loadingLabelComp.lineHeight = 24;
        loadingLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        loadingLabelComp.verticalAlign = cc.Label.VerticalAlign.CENTER;
        loadingLabel.color = cc.color(180, 180, 180);
        loadingLabel.parent = contentContainer;
        
        // 存储 scrollView 引用，后续更新高度时使用
        self._helpScrollView = scrollView;
        
        // ==================== 从API获取帮助内容 ====================
        var fetchHelpContent = function() {
            var apiUrl = window.defines ? window.defines.apiUrl : '';
            var cryptoKey = window.defines ? window.defines.cryptoKey : '';

            console.log("【帮助弹窗】开始获取帮助内容，apiUrl:", apiUrl);

            if (!apiUrl) {
                console.warn("【帮助弹窗】apiUrl 为空，使用默认内容");
                self._showHelpContent(contentContainer, loadingLabel, getDefaultHelpContent());
                return;
            }

            // 使用列表接口获取所有帮助文章
            var url = apiUrl + '/api/v1/help-article/list';
            console.log("【帮助弹窗】请求URL:", url);

            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    console.log("【帮助弹窗】请求完成，状态:", xhr.status);
                    if (xhr.status === 200) {
                        try {
                            var response = JSON.parse(xhr.responseText);
                            console.log("【帮助弹窗】响应数据:", JSON.stringify(response).substring(0, 500));

                            // 检查是否是加密响应 (有 data 和 timestamp 字段，且 data 是字符串)
                            if (response.data && response.timestamp && typeof response.data === 'string') {
                                console.log("【帮助弹窗】检测到加密响应，准备解密");
                                // 加密响应，使用 HttpAPI.decryptAESGCM 解密
                                if (window.HttpAPI && window.HttpAPI.decryptAESGCM) {
                                    window.HttpAPI.decryptAESGCM(response.data, cryptoKey).then(function(decrypted) {
                                        console.log("【帮助弹窗】解密成功，数据类型:", typeof decrypted, "是否数组:", Array.isArray(decrypted));
                                        console.log("【帮助弹窗】解密后数据:", JSON.stringify(decrypted).substring(0, 1000));
                                        
                                        // 打印对象的所有属性名
                                        if (decrypted && typeof decrypted === 'object') {
                                            console.log("【帮助弹窗】解密后对象的属性:", Object.keys(decrypted));
                                        }
                                        
                                        // 解密成功，处理数据 - 支持多种数据结构
                                        var helpItems = null;
                                        
                                        if (Array.isArray(decrypted)) {
                                            // 直接是数组
                                            helpItems = decrypted;
                                        } else if (decrypted && typeof decrypted === 'object') {
                                            // 尝试各种可能的属性名
                                            if (Array.isArray(decrypted.data)) {
                                                helpItems = decrypted.data;
                                            } else if (Array.isArray(decrypted.list)) {
                                                helpItems = decrypted.list;
                                            } else if (Array.isArray(decrypted.items)) {
                                                helpItems = decrypted.items;
                                            } else if (Array.isArray(decrypted.records)) {
                                                helpItems = decrypted.records;
                                            } else if (Array.isArray(decrypted.rows)) {
                                                helpItems = decrypted.rows;
                                            } else if (Array.isArray(decrypted.articles)) {
                                                helpItems = decrypted.articles;
                                            } else {
                                                // 尝试查找对象中第一个数组类型的属性
                                                for (var key in decrypted) {
                                                    if (Array.isArray(decrypted[key])) {
                                                        helpItems = decrypted[key];
                                                        console.log("【帮助弹窗】从属性 '" + key + "' 提取到数组");
                                                        break;
                                                    }
                                                }
                                            }
                                        }

                                        console.log("【帮助弹窗】解析后helpItems条数:", helpItems ? helpItems.length : 0);

                                        if (helpItems && helpItems.length > 0) {
                                            console.log("【帮助弹窗】helpItems[0]原始content:", helpItems[0].content ? helpItems[0].content.substring(0, 200) : "空");
                                            var accordionData = helpItems.map(function(item) {
                                                var strippedContent = self._stripHtmlTags(item.content || '');
                                                console.log("【帮助弹窗】处理后标题:", item.title, "内容长度:", strippedContent.length);
                                                return {
                                                    title: item.title || '无标题',
                                                    content: strippedContent
                                                };
                                            });
                                            console.log("【帮助弹窗】准备显示手风琴数据，条数:", accordionData.length);
                                            self._showHelpContentFromList(contentContainer, loadingLabel, accordionData);
                                        } else {
                                            console.warn("【帮助弹窗】helpItems为空，使用默认内容");
                                            self._showHelpContent(contentContainer, loadingLabel, getDefaultHelpContent());
                                        }
                                    }).catch(function(err) {
                                        console.error("【帮助弹窗】解密失败:", err);
                                        self._showHelpContent(contentContainer, loadingLabel, getDefaultHelpContent());
                                    });
                                } else {
                                    console.warn("【帮助弹窗】HttpAPI.decryptAESGCM 不可用，使用默认内容");
                                    self._showHelpContent(contentContainer, loadingLabel, getDefaultHelpContent());
                                }
                            } else if (response.code === 0 && response.data) {
                                console.log("【帮助弹窗】检测到非加密响应，code=0");
                                // 未加密响应，data是数组
                                var helpItems = null;
                                if (Array.isArray(response.data)) {
                                    helpItems = response.data;
                                }

                                console.log("【帮助弹窗】非加密响应helpItems条数:", helpItems ? helpItems.length : 0);

                                if (helpItems && helpItems.length > 0) {
                                    console.log("【帮助弹窗】非加密helpItems[0]原始content:", helpItems[0].content ? helpItems[0].content.substring(0, 200) : "空");
                                    var accordionData = helpItems.map(function(item) {
                                        var strippedContent = self._stripHtmlTags(item.content || '');
                                        console.log("【帮助弹窗】处理后标题:", item.title, "内容长度:", strippedContent.length);
                                        return {
                                            title: item.title || '无标题',
                                            content: strippedContent
                                        };
                                    });
                                    console.log("【帮助弹窗】准备显示手风琴数据，条数:", accordionData.length);
                                    self._showHelpContentFromList(contentContainer, loadingLabel, accordionData);
                                } else {
                                    console.warn("【帮助弹窗】helpItems为空，使用默认内容");
                                    self._showHelpContent(contentContainer, loadingLabel, getDefaultHelpContent());
                                }
                            } else {
                                console.warn("【帮助弹窗】响应格式不正确，code:", response.code, "data:", response.data ? "存在" : "不存在");
                                self._showHelpContent(contentContainer, loadingLabel, getDefaultHelpContent());
                            }
                        } catch (e) {
                            console.error("【帮助弹窗】解析帮助内容失败:", e);
                            self._showHelpContent(contentContainer, loadingLabel, getDefaultHelpContent());
                        }
                    } else {
                        console.warn("【帮助弹窗】获取帮助内容失败，状态码:", xhr.status);
                        self._showHelpContent(contentContainer, loadingLabel, getDefaultHelpContent());
                    }
                }
            };

            xhr.onerror = function() {
                console.error("【帮助弹窗】请求失败，网络错误");
                self._showHelpContent(contentContainer, loadingLabel, getDefaultHelpContent());
            };

            xhr.send();
        };
        
        // 延迟获取内容
        setTimeout(fetchHelpContent, 100);
        
        // ==================== 确定按钮 ====================
        var confirmBtn = new cc.Node("ConfirmBtn");
        confirmBtn.setPosition(0, -bgHeight/2 + 40);
        confirmBtn.setContentSize(cc.size(120, 40));
        confirmBtn.anchorX = 0.5;
        confirmBtn.anchorY = 0.5;
        var confirmGraphics = confirmBtn.addComponent(cc.Graphics);
        confirmGraphics.fillColor = cc.color(76, 175, 80, 255);
        confirmGraphics.roundRect(-60, -20, 120, 40, 8);
        confirmGraphics.fill();
        confirmBtn.parent = dialog;
        
        // 确定按钮文字 - 垂直居中
        var confirmLabel = new cc.Node("Label");
        var confirmLabelComp = confirmLabel.addComponent(cc.Label);
        confirmLabelComp.string = "我知道了";
        confirmLabelComp.fontSize = 16;
        confirmLabelComp.lineHeight = 40;
        confirmLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        confirmLabelComp.verticalAlign = cc.Label.VerticalAlign.CENTER;
        confirmLabel.color = cc.color(255, 255, 255);
        confirmLabel.parent = confirmBtn;
        
        confirmBtn.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            self._helpScrollView = null;  // 清理引用
            dialog.destroy();
        });
        
        // ==================== 关闭按钮（右上角X）====================
        var closeBtn = new cc.Node("CloseBtn");
        closeBtn.setPosition(bgWidth/2 - 28, bgHeight/2 - 28);
        closeBtn.setContentSize(cc.size(32, 32));
        closeBtn.anchorX = 0.5;
        closeBtn.anchorY = 0.5;
        var closeGraphics = closeBtn.addComponent(cc.Graphics);
        closeGraphics.fillColor = cc.color(100, 90, 110, 230);
        closeGraphics.circle(0, 0, 16);
        closeGraphics.fill();
        closeGraphics.strokeColor = cc.color(180, 170, 190, 150);
        closeGraphics.lineWidth = 1;
        closeGraphics.circle(0, 0, 16);
        closeGraphics.stroke();
        closeBtn.parent = dialog;
        
        // 关闭按钮X标记 - 垂直居中
        var closeX = new cc.Node("X");
        var closeXLabel = closeX.addComponent(cc.Label);
        closeXLabel.string = "✕";
        closeXLabel.fontSize = 18;
        closeXLabel.lineHeight = 32;
        closeXLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        closeXLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
        closeX.color = cc.color(255, 255, 255);
        closeX.parent = closeBtn;
        
        closeBtn.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation();
            self._helpScrollView = null;  // 清理引用
            dialog.destroy();
        });
    },
    
    // 去除HTML标签，只保留纯文本
    _stripHtmlTags: function(html) {
        if (!html) return '';
        // 去除HTML标签
        var text = html.replace(/<br\s*\/?>/gi, '\n');  // 保留换行
        text = text.replace(/<\/p>/gi, '\n');  // 段落换行
        text = text.replace(/<\/h[1-6]>/gi, '\n\n');  // 标题换行
        text = text.replace(/<li>/gi, '• ');  // 列表项
        text = text.replace(/<[^>]+>/g, '');  // 去除其他HTML标签
        // 解码HTML实体
        text = text.replace(/&nbsp;/g, ' ');
        text = text.replace(/&lt;/g, '<');
        text = text.replace(/&gt;/g, '>');
        text = text.replace(/&amp;/g, '&');
        text = text.replace(/&quot;/g, '"');
        text = text.replace(/&#39;/g, "'");
        // 清理多余空白
        text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
        text = text.trim();
        return text;
    },
    
    // 直接从列表数据显示帮助内容（手风琴效果）
    _showHelpContentFromList: function(container, loadingLabel, helpItems) {
        console.log("【帮助弹窗】_showHelpContentFromList 被调用，数据条数:", helpItems ? helpItems.length : 0);
        
        // 移除加载提示
        if (loadingLabel && loadingLabel.parent) {
            loadingLabel.parent = null;
        }
        
        if (!Array.isArray(helpItems) || helpItems.length === 0) {
            console.warn("【帮助弹窗】helpItems 为空或不是数组，使用默认内容");
            this._showPlainText(container, getDefaultHelpContent());
            return;
        }
        
        console.log("【帮助弹窗】第一条数据:", JSON.stringify(helpItems[0]));
        console.log("【帮助弹窗】第一条数据content字段:", helpItems[0].content);
        console.log("【帮助弹窗】第一条数据content长度:", helpItems[0].content ? helpItems[0].content.length : 0);
        
        var self = this;
        var itemHeight = 45;
        var expandedItems = {};  // 记录展开状态
        var contentBoxes = [];   // 存储所有contentBox引用，用于后续更新高度
        
        // ==================== 创建内容容器（适配 ScrollView）====================
        // container 已经是 ScrollView 的 content 节点，锚点在顶部
        var contentNode = new cc.Node("HelpContent");
        contentNode.setContentSize(cc.size(container.width, 100));  // 初始高度，后续会更新
        contentNode.anchorX = 0.5;
        contentNode.anchorY = 1;  // 锚点在顶部
        contentNode.x = 0;
        contentNode.y = 0;  // 顶部对齐
        contentNode.parent = container;
        
        console.log("【帮助弹窗】contentNode 创建完成，尺寸:", container.width, "x", container.height);
        
        // 为每个帮助项创建标题和内容
        helpItems.forEach(function(item, index) {
            var itemNode = new cc.Node("item_" + index);
            itemNode.width = contentNode.width;
            itemNode.anchorX = 0.5;  // 重要：设置水平锚点居中
            itemNode.anchorY = 1;    // 锚点在顶部
            itemNode.x = 0;          // 水平居中

            // 使用固定的内容宽度，确保换行正确
            var itemWidth = 560;  // 固定宽度，与弹窗宽度匹配

            // 创建标题背景 - 使用Graphics绘制确保可见
            var titleBg = new cc.Node("titleBg");
            titleBg.setPosition(0, 0);
            titleBg.setContentSize(cc.size(itemWidth, itemHeight));
            titleBg.anchorX = 0.5;
            titleBg.anchorY = 1;  // 锚点在顶部

            // 使用Graphics绘制背景，确保可见性
            // 注意：anchorY=1时，绘制从-y到0（负方向向下）
            var bgGraphics = titleBg.addComponent(cc.Graphics);
            bgGraphics.fillColor = cc.color(60, 55, 75, 255);  // 深紫色背景
            bgGraphics.roundRect(-itemWidth/2, -itemHeight, itemWidth, itemHeight, 6);
            bgGraphics.fill();
            // 添加边框
            bgGraphics.strokeColor = cc.color(100, 90, 120, 255);
            bgGraphics.lineWidth = 1;
            bgGraphics.stroke();
            
            // 创建标题文字
            var titleNode = new cc.Node("title");
            var titleLabel = titleNode.addComponent(cc.Label);
            titleLabel.string = (index + 1) + ". " + item.title;
            titleLabel.fontSize = 18;
            titleLabel.lineHeight = 22;
            titleLabel.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
            titleNode.color = cc.color(255, 220, 100);
            titleNode.anchorX = 0;
            titleNode.anchorY = 0.5;
            titleNode.x = -itemWidth / 2 + 15;
            titleNode.y = -itemHeight / 2;  // 垂直居中（anchorY=1时向下为负）

            // 创建展开/收缩图标
            var iconNode = new cc.Node("icon");
            var iconLabel = iconNode.addComponent(cc.Label);
            iconLabel.string = "▶";
            iconLabel.fontSize = 14;
            iconNode.color = cc.color(200, 200, 200);
            iconNode.anchorY = 0.5;
            iconNode.x = itemWidth / 2 - 20;
            iconNode.y = -itemHeight / 2;  // 垂直居中（anchorY=1时向下为负）
            
            // 创建内容节点（初始隐藏）
            var contentBox = new cc.Node("contentBox");
            contentBox.setPosition(0, -itemHeight);
            contentBox.setContentSize(cc.size(itemWidth, 200));  // 使用固定宽度
            contentBox.anchorX = 0.5;
            contentBox.anchorY = 1;

            // 内容背景
            var contentBg = new cc.Node("contentBg");
            contentBg.setContentSize(cc.size(itemWidth, 200));  // 使用固定宽度
            contentBg.anchorX = 0.5;
            contentBg.anchorY = 1;  // 锚点在顶部
            var contentBgGraphics = contentBg.addComponent(cc.Graphics);
            contentBgGraphics.fillColor = cc.color(45, 42, 55, 200);  // 稍暗的背景
            // anchorY=1时，绘制从-height到0
            contentBgGraphics.roundRect(-itemWidth/2, -200, itemWidth, 200, 4);
            contentBgGraphics.fill();
            contentBg.y = 0;
            contentBg.parent = contentBox;
            
            var contentLabel = new cc.Node("contentLabel");
            var labelComp = contentLabel.addComponent(cc.Label);
            
            // 重要：Cocos Creator中Label属性设置顺序很关键
            // 1. 先设置基础属性
            labelComp.fontSize = 14;
            labelComp.lineHeight = 20;
            labelComp.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
            
            // 2. 设置换行模式 - 关键！
            labelComp.enableWrapText = true;  // 启用文本换行
            
            // 3. 设置overflow为RESIZE_HEIGHT
            labelComp.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
            
            // 4. 设置wrapWidth（换行宽度）
            var wrapWidth = itemWidth - 30;
            console.log("【帮助弹窗】第" + (index+1) + "条wrapWidth:", wrapWidth);
            labelComp.wrapWidth = wrapWidth;
            
            // 5. 设置节点尺寸
            contentLabel.setContentSize(cc.size(wrapWidth, 20));
            
            // 设置颜色和锚点
            contentLabel.color = cc.color(220, 220, 220);
            contentLabel.anchorX = 0;
            contentLabel.anchorY = 1;
            contentLabel.x = -itemWidth / 2 + 15;
            contentLabel.y = -10;  // 留出顶部边距
            
            // 先添加到父节点
            contentLabel.parent = contentBox;
            
            // 最后设置文本内容
            var displayContent = item.content || '暂无内容';
            console.log("【帮助弹窗】第" + (index+1) + "条内容长度:", displayContent.length);
            labelComp.string = displayContent;
            
            console.log("【帮助弹窗】第" + (index+1) + "条contentLabel初始高度:", contentLabel.height);
            console.log("【帮助弹窗】第" + (index+1) + "条contentBox初始高度:", contentBox.height);
            
            // 存储引用，稍后更新高度
            contentBoxes.push({
                contentBox: contentBox,
                labelComp: labelComp,
                contentBg: contentBg,
                index: index
            });
            
            // 注意：不要在这里设置 contentBox.active = false
            // 因为Label需要在激活状态下才能正确计算高度
            // 将在延迟回调中设置
            
            // 添加点击事件
            titleBg.on(cc.Node.EventType.TOUCH_END, function() {
                var isExpanded = contentBox.active;
                
                // 收起所有其他项
                for (var key in expandedItems) {
                    if (key != index && expandedItems[key]) {
                        var otherContent = contentNode.getChildByName("item_" + key);
                        if (otherContent) {
                            var otherBox = otherContent.getChildByName("contentBox");
                            var otherIcon = otherContent.getChildByName("titleBg").getChildByName("icon");
                            if (otherBox) otherBox.active = false;
                            if (otherIcon) otherIcon.getComponent(cc.Label).string = "▶";
                            expandedItems[key] = false;
                        }
                    }
                }
                
                // 切换当前项
                contentBox.active = !isExpanded;
                iconLabel.string = contentBox.active ? "▼" : "▶";
                expandedItems[index] = contentBox.active;
                
                // 重新计算布局
                self._relayoutHelpItems(contentNode, helpItems, itemHeight, expandedItems);
            });
            
            titleNode.parent = titleBg;
            iconNode.parent = titleBg;
            titleBg.parent = itemNode;
            contentBox.parent = itemNode;
            itemNode.parent = contentNode;
            
            expandedItems[index] = false;
        });
        
        // 延迟更新高度，确保Label已计算完成
        // 注意：必须在contentBox.active = true的状态下才能正确计算Label高度
        var fixedItemWidth = 560;  // 使用固定宽度
        this.scheduleOnce(function() {
            console.log("【帮助弹窗】延迟更新Label高度");
            contentBoxes.forEach(function(item, idx) {
                // 强制Label更新布局
                var labelNode = item.labelComp.node;
                var actualHeight = labelNode.height;
                console.log("【帮助弹窗】第" + (idx+1) + "条actualHeight:", actualHeight);
                
                var newHeight = 200;  // 默认高度
                if (actualHeight > 0 && actualHeight < 5000) {  // 合理的高度范围
                    newHeight = actualHeight + 30;  // 上下各留15px边距
                } else {
                    // 使用文本长度估算高度
                    var text = item.labelComp.string;
                    var wrapWidth = fixedItemWidth - 30;
                    var charWidth = 14 * 0.6;  // 字体大小 * 估算宽度比例
                    var lineHeight = 20;
                    var charsPerLine = Math.floor(wrapWidth / charWidth);
                    var lines = Math.ceil(text.length / charsPerLine);
                    newHeight = lines * lineHeight + 30;
                    console.log("【帮助弹窗】第" + (idx+1) + "条估算高度:", newHeight);
                }
                
                // 更新高度
                item.contentBox.setContentSize(cc.size(fixedItemWidth, newHeight));
                item.contentBg.setContentSize(cc.size(fixedItemWidth, newHeight));
                
                // 重绘背景
                var g = item.contentBg.getComponent(cc.Graphics);
                if (g) {
                    g.clear();
                    g.fillColor = cc.color(45, 42, 55, 200);
                    g.roundRect(-fixedItemWidth/2, -newHeight, fixedItemWidth, newHeight, 4);
                    g.fill();
                }
                console.log("【帮助弹窗】第" + (idx+1) + "条更新后高度:", newHeight);
                
                // 现在可以隐藏contentBox了
                item.contentBox.active = false;
            });
            
            // 重新计算初始布局
            self._relayoutHelpItems(contentNode, helpItems, itemHeight, expandedItems);
        }, 0.2);  // 增加延迟时间确保布局完成
        
        // 初始布局
        this._relayoutHelpItems(contentNode, helpItems, itemHeight, expandedItems);

        console.log("【帮助弹窗】UI创建完成，内容高度:", contentNode.height);
        console.log("【帮助弹窗】itemNode 数量:", contentNode.children.length);
    },
    
    // 显示帮助内容（手风琴效果）
    _showHelpContent: function(container, loadingLabel, content) {
        // 移除加载提示
        if (loadingLabel && loadingLabel.parent) {
            loadingLabel.parent = null;
        }

        // 尝试解析JSON格式的帮助内容
        var helpItems = null;
        try {
            helpItems = JSON.parse(content);
        } catch (e) {
            // 如果不是JSON格式，显示为普通文本
            this._showPlainText(container, content);
            return;
        }

        if (!Array.isArray(helpItems) || helpItems.length === 0) {
            this._showPlainText(container, content);
            return;
        }

        // ==================== 创建内容容器（适配 ScrollView）====================
        var contentNode = new cc.Node("HelpContent");
        contentNode.setContentSize(cc.size(container.width, 100));  // 初始高度，后续会更新
        contentNode.anchorX = 0.5;
        contentNode.anchorY = 1;  // 锚点在顶部
        contentNode.x = 0;
        contentNode.y = 0;  // 顶部对齐
        contentNode.parent = container;
        
        var self = this;
        var itemHeight = 45;
        var expandedItems = {};  // 记录展开状态

        // 为每个帮助项创建标题和内容
        helpItems.forEach(function(item, index) {
            var itemNode = new cc.Node("item_" + index);
            itemNode.width = contentNode.width;
            itemNode.anchorX = 0.5;
            itemNode.anchorY = 1;
            itemNode.x = 0;

            // 创建标题背景 - 使用Graphics绘制
            var titleBg = new cc.Node("titleBg");
            titleBg.setPosition(0, 0);
            titleBg.width = contentNode.width - 10;
            titleBg.height = itemHeight;
            titleBg.anchorX = 0.5;
            titleBg.anchorY = 1;

            var bgGraphics = titleBg.addComponent(cc.Graphics);
            bgGraphics.fillColor = cc.color(60, 55, 75, 255);
            bgGraphics.roundRect(-titleBg.width/2, -titleBg.height, titleBg.width, titleBg.height, 6);
            bgGraphics.fill();
            bgGraphics.strokeColor = cc.color(100, 90, 120, 255);
            bgGraphics.lineWidth = 1;
            bgGraphics.stroke();

            // 创建标题文字
            var titleNode = new cc.Node("title");
            var titleLabel = titleNode.addComponent(cc.Label);
            titleLabel.string = (index + 1) + ". " + item.title;
            titleLabel.fontSize = 18;
            titleLabel.lineHeight = 22;
            titleLabel.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
            titleNode.color = cc.color(255, 220, 100);
            titleNode.anchorX = 0;
            titleNode.anchorY = 0.5;
            titleNode.x = -titleBg.width / 2 + 15;
            titleNode.y = -itemHeight / 2;

            // 创建展开/收缩图标
            var iconNode = new cc.Node("icon");
            var iconLabel = iconNode.addComponent(cc.Label);
            iconLabel.string = "▶";
            iconLabel.fontSize = 14;
            iconNode.color = cc.color(200, 200, 200);
            iconNode.anchorY = 0.5;
            iconNode.x = titleBg.width / 2 - 20;
            iconNode.y = -itemHeight / 2;

            // 创建内容节点（初始隐藏）
            var contentBox = new cc.Node("contentBox");
            contentBox.setPosition(0, -itemHeight);
            contentBox.width = contentNode.width - 20;
            contentBox.anchorX = 0.5;
            contentBox.anchorY = 1;

            var contentLabel = new cc.Node("contentLabel");
            var labelComp = contentLabel.addComponent(cc.Label);
            labelComp.string = item.content;
            labelComp.fontSize = 14;
            labelComp.lineHeight = 20;
            labelComp.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
            labelComp.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
            labelComp.wrapWidth = contentBox.width - 30;
            contentLabel.color = cc.color(220, 220, 220);
            contentLabel.anchorX = 0;
            contentLabel.anchorY = 1;
            contentLabel.x = -contentBox.width / 2 + 15;
            contentLabel.y = -10;

            contentLabel.parent = contentBox;
            contentBox.height = labelComp.node.height + 20;
            contentBox.active = false;  // 初始隐藏
            
            // 添加点击事件
            titleBg.on(cc.Node.EventType.TOUCH_END, function() {
                var isExpanded = contentBox.active;
                
                // 收起所有其他项
                for (var key in expandedItems) {
                    if (key != index && expandedItems[key]) {
                        var otherContent = contentNode.getChildByName("item_" + key);
                        if (otherContent) {
                            var otherBox = otherContent.getChildByName("contentBox");
                            var otherIcon = otherContent.getChildByName("titleBg").getChildByName("icon");
                            if (otherBox) otherBox.active = false;
                            if (otherIcon) otherIcon.getComponent(cc.Label).string = "▶";
                            expandedItems[key] = false;
                        }
                    }
                }
                
                // 切换当前项
                contentBox.active = !isExpanded;
                iconLabel.string = contentBox.active ? "▼" : "▶";
                expandedItems[index] = contentBox.active;
                
                // 重新计算布局
                this._relayoutHelpItems(contentNode, helpItems, itemHeight, expandedItems);
            }.bind(this));
            
            titleNode.parent = titleBg;
            iconNode.parent = titleBg;
            titleBg.parent = itemNode;
            contentBox.parent = itemNode;
            itemNode.parent = contentNode;
            
            expandedItems[index] = false;
        }.bind(this));
        
        // 初始布局
        this._relayoutHelpItems(contentNode, helpItems, itemHeight, expandedItems);

        console.log("【帮助弹窗】UI创建完成（简化版），内容高度:", contentNode.height);
    },
    
    // 重新布局帮助项
    _relayoutHelpItems: function(contentNode, helpItems, itemHeight, expandedItems) {
        var totalHeight = 0;
        var gap = 8;  // 项目间距
        
        helpItems.forEach(function(item, index) {
            var itemNode = contentNode.getChildByName("item_" + index);
            if (itemNode) {
                // 设置当前项的Y位置
                itemNode.y = -totalHeight;
                totalHeight += itemHeight + gap;
                
                var contentBox = itemNode.getChildByName("contentBox");
                if (contentBox && expandedItems[index]) {
                    // 获取内容实际高度
                    var boxHeight = contentBox.height || 80;
                    // 更新contentBox位置（紧跟在标题下方）
                    contentBox.y = -itemHeight - 5;
                    totalHeight += boxHeight + gap;
                }
            }
        });
        
        // 更新内容容器高度，确保最小高度
        contentNode.height = Math.max(totalHeight + 20, 100);
        
        // 同时更新 ScrollView 的 content 高度
        var container = contentNode.parent;  // container 是 ScrollView 的 content 节点
        if (container) {
            var scrollView = this._helpScrollView;
            if (scrollView) {
                // 更新 container 的高度
                container.height = Math.max(totalHeight + 40, container.height);
                // 滚动到顶部
                scrollView.scrollToTop(0.1);
            }
        }
        
        console.log("【帮助弹窗】布局更新，总高度:", contentNode.height);
    },
    
    // 显示普通文本
    _showPlainText: function(container, content) {
        var contentLabel = new cc.Node("ContentLabel");
        contentLabel.setPosition(0, 0);  // 顶部对齐
        var labelComp = contentLabel.addComponent(cc.Label);
        labelComp.string = content;
        labelComp.fontSize = 16;
        labelComp.lineHeight = 24;
        labelComp.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
        labelComp.verticalAlign = cc.Label.VerticalAlign.TOP;
        labelComp.overflow = cc.Label.Overflow.RESIZE_HEIGHT;  // 自动调整高度
        labelComp.wrapWidth = container.width - 20;
        contentLabel.color = cc.color(240, 240, 240);
        contentLabel.anchorX = 0.5;
        contentLabel.anchorY = 1;  // 锚点在顶部
        contentLabel.parent = container;
        
        // 延迟更新容器高度
        var self = this;
        this.scheduleOnce(function() {
            var actualHeight = contentLabel.height + 40;
            container.height = Math.max(actualHeight, container.height);
            if (self._helpScrollView) {
                self._helpScrollView.scrollToTop(0);
            }
        }, 0.05);
    },
    
    // 场景销毁时清理资源
    onDestroy: function() {
        
        // 清理倒计时定时器
        if (this._countdownTimer) {
            clearInterval(this._countdownTimer);
            this._countdownTimer = null;
        }
        
        // 清理竞技场倒计时
        if (window.arenaData && window.arenaData.clearAllCountdowns) {
            window.arenaData.clearAllCountdowns();
        }
        
        // 🔧【新增】移除页面可见性监听器
        if (this._visibilityChangeHandler && document.removeEventListener) {
            document.removeEventListener('visibilitychange', this._visibilityChangeHandler);
            this._visibilityChangeHandler = null;
        }
        
        // 停止在线状态监测（大厅场景需要持续监测，所以只有场景销毁时才停止）
        // 注意：通常大厅场景不会销毁，除非切换到游戏场景
        // 如果需要保持监测，可以注释掉下面这行
        // this._stopOnlineMonitoring();
    },

    start () {}
});
