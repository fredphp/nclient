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
    extends: cc.Component,

    properties: {
        // 无属性定义，所有 UI 动态创建
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 初始化数据
        this._periodNo = ""
        this._roomId = 0
        this._roomName = ""
        this._countdown = 60
        this._totalPlayers = 0
        this._enteredPlayers = 0
        this._players = []
        this._startTime = 0
        
        // 创建整个 UI
        this._createUI()
        
        // 注册事件监听
        this._registerEvents()
        
        // 从全局变量获取初始数据
        this._initFromGlobalData()
        
        // 监听 room_joined 消息以进入游戏场景
        this._registerRoomJoinedHandler()
        
        console.log("🏟️ [ArenaMatchWaiting] 等待界面加载完成")
    },

    /**
     * 创建完整 UI
     */
    _createUI: function() {
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas)
        var screenHeight = canvas ? canvas.designResolution.height : 720
        var screenWidth = canvas ? canvas.designResolution.width : 1280
        
        // 1. 创建背景（使用 join_bk.png）
        this._createBackground(screenWidth, screenHeight)
        
        // 2. 创建顶部信息栏
        this._createTopBar(screenWidth, screenHeight)
        
        // 3. 创建玩家列表容器
        this._createPlayerListContainer(screenWidth, screenHeight)
        
        // 4. 创建底部按钮区
        this._createBottomButtons(screenWidth, screenHeight)
    },

    /**
     * 创建背景（使用 join_bk.png）
     */
    _createBackground: function(width, height) {
        // 创建背景节点
        var bgNode = new cc.Node("Background")
        bgNode.setContentSize(cc.size(width, height))
        bgNode.setPosition(0, 0)
        bgNode.setLocalZOrder(-100)
        
        var sprite = bgNode.addComponent(cc.Sprite)
        sprite.type = cc.Sprite.Type.SIMPLE
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM
        
        // 加载背景图片
        cc.resources.load('join_bk', cc.SpriteFrame, function(err, spriteFrame) {
            if (err) {
                console.warn("🏟️ [ArenaMatchWaiting] 无法加载背景图 join_bk.png，使用纯色背景")
                // 使用深色背景作为后备
                var graphics = bgNode.addComponent(cc.Graphics)
                graphics.fillColor = cc.color(25, 30, 50, 255)
                graphics.rect(-width/2, -height/2, width, height)
                graphics.fill()
                return
            }
            if (sprite && sprite.node && sprite.node.isValid) {
                sprite.spriteFrame = spriteFrame
            }
        })
        
        bgNode.parent = this.node
        this._bgNode = bgNode
    },

    /**
     * 创建顶部信息栏
     */
    _createTopBar: function(width, height) {
        // 顶部信息栏容器
        var topBar = new cc.Node("TopBar")
        topBar.setContentSize(cc.size(width - 100, 100))
        topBar.setPosition(0, height/2 - 80)
        
        // 半透明背景
        var bg = new cc.Node("Bg")
        bg.setContentSize(cc.size(width - 100, 100))
        var graphics = bg.addComponent(cc.Graphics)
        graphics.fillColor = cc.color(0, 0, 0, 150)
        graphics.roundRect(-(width-100)/2, -50, width-100, 100, 10)
        graphics.fill()
        bg.parent = topBar
        
        // 期号
        var periodNode = new cc.Node("PeriodNo")
        periodNode.setPosition(-width/2 + 150, 25)
        var periodLabel = periodNode.addComponent(cc.Label)
        periodLabel.string = "期号: --"
        periodLabel.fontSize = 22
        periodLabel.lineHeight = 28
        periodNode.color = cc.color(255, 215, 0)
        var periodOutline = periodNode.addComponent(cc.LabelOutline)
        periodOutline.color = cc.color(0, 0, 0)
        periodOutline.width = 2
        periodNode.parent = topBar
        this._periodNoLabel = periodLabel
        
        // 房间名称
        var roomNode = new cc.Node("RoomName")
        roomNode.setPosition(0, 25)
        var roomLabel = roomNode.addComponent(cc.Label)
        roomLabel.string = "竞技场"
        roomLabel.fontSize = 28
        roomLabel.lineHeight = 36
        roomNode.color = cc.color(255, 255, 255)
        var roomOutline = roomNode.addComponent(cc.LabelOutline)
        roomOutline.color = cc.color(0, 0, 0)
        roomOutline.width = 2
        roomNode.parent = topBar
        this._roomNameLabel = roomLabel
        
        // 倒计时
        var countdownNode = new cc.Node("Countdown")
        countdownNode.setPosition(width/2 - 150, 25)
        var countdownLabel = countdownNode.addComponent(cc.Label)
        countdownLabel.string = "60秒"
        countdownLabel.fontSize = 24
        countdownLabel.lineHeight = 32
        countdownNode.color = cc.color(100, 255, 100)
        var countdownOutline = countdownNode.addComponent(cc.LabelOutline)
        countdownOutline.color = cc.color(0, 0, 0)
        countdownOutline.width = 2
        countdownNode.parent = topBar
        this._countdownLabel = countdownLabel
        
        // 玩家数量
        var playerCountNode = new cc.Node("PlayerCount")
        playerCountNode.setPosition(0, -15)
        var playerCountLabel = playerCountNode.addComponent(cc.Label)
        playerCountLabel.string = "已进入: 0 / 0"
        playerCountLabel.fontSize = 20
        playerCountLabel.lineHeight = 28
        playerCountNode.color = cc.color(200, 200, 220)
        playerCountNode.parent = topBar
        this._playerCountLabel = playerCountLabel
        
        // 提示消息
        var msgNode = new cc.Node("Message")
        msgNode.setPosition(0, -45)
        var msgLabel = msgNode.addComponent(cc.Label)
        msgLabel.string = "等待其他玩家进入..."
        msgLabel.fontSize = 16
        msgLabel.lineHeight = 24
        msgNode.color = cc.color(255, 200, 100)
        msgNode.parent = topBar
        this._messageLabel = msgLabel
        
        topBar.parent = this.node
        this._topBar = topBar
    },

    /**
     * 创建玩家列表容器
     */
    _createPlayerListContainer: function(width, height) {
        // 主容器
        var container = new cc.Node("PlayerListContainer")
        container.setContentSize(cc.size(width - 100, height - 280))
        container.setPosition(0, -20)
        
        // 标题
        var titleNode = new cc.Node("Title")
        titleNode.setPosition(0, height/2 - 200)
        var titleLabel = titleNode.addComponent(cc.Label)
        titleLabel.string = "参赛玩家"
        titleLabel.fontSize = 26
        titleLabel.lineHeight = 36
        titleNode.color = cc.color(255, 215, 0)
        var titleOutline = titleNode.addComponent(cc.LabelOutline)
        titleOutline.color = cc.color(0, 0, 0)
        titleOutline.width = 2
        titleNode.parent = this.node
        this._titleLabel = titleLabel
        
        // ScrollView
        var scrollViewNode = new cc.Node("ScrollView")
        scrollViewNode.setContentSize(cc.size(width - 100, height - 340))
        scrollViewNode.setPosition(0, -30)
        
        var scrollView = scrollViewNode.addComponent(cc.ScrollView)
        scrollView.horizontal = false
        scrollView.vertical = true
        scrollView.inertia = true
        scrollView.elastic = true
        
        // Content 节点
        var contentNode = new cc.Node("Content")
        contentNode.setContentSize(cc.size(width - 120, 200))
        contentNode.anchorY = 1
        contentNode.setPosition(0, 0)
        
        // 添加 Layout 组件（用于网格布局）
        var layout = contentNode.addComponent(cc.Layout)
        layout.type = cc.Layout.Type.GRID
        layout.horizontalDirection = cc.Layout.HorizontalDirection.LEFT_TO_RIGHT
        layout.verticalDirection = cc.Layout.VerticalDirection.TOP_TO_BOTTOM
        layout.cellSize = cc.size(180, 200)
        layout.startAxis = cc.Layout.Axis.HORIZONTAL
        layout.constraint = cc.Layout.Constraint.FIXED_ROW
        layout.constraintNum = 3  // 一排3个
        layout.spacingX = 20
        layout.spacingY = 20
        layout.paddingTop = 20
        layout.paddingBottom = 20
        layout.paddingLeft = 20
        layout.paddingRight = 20
        
        contentNode.parent = scrollViewNode
        scrollView.content = contentNode
        
        scrollViewNode.parent = this.node
        this._scrollView = scrollView
        this._playerListContent = contentNode
        
        container.parent = this.node
        this._playerListContainer = container
    },

    /**
     * 创建底部按钮区
     */
    _createBottomButtons: function(width, height) {
        var bottomBar = new cc.Node("BottomBar")
        bottomBar.setPosition(0, -height/2 + 60)
        
        // 取消按钮
        var cancelBtn = new cc.Node("CancelButton")
        cancelBtn.setContentSize(cc.size(160, 50))
        cancelBtn.setPosition(-100, 0)
        
        var cancelBg = cancelBtn.addComponent(cc.Graphics)
        cancelBg.fillColor = cc.color(180, 80, 80)
        cancelBg.roundRect(-80, -25, 160, 50, 8)
        cancelBg.fill()
        
        var cancelLabelNode = new cc.Node("Label")
        var cancelLabel = cancelLabelNode.addComponent(cc.Label)
        cancelLabel.string = "取消进入"
        cancelLabel.fontSize = 20
        cancelLabel.lineHeight = 28
        cancelLabelNode.color = cc.color(255, 255, 255)
        cancelLabelNode.parent = cancelBtn
        
        var cancelBtnComp = cancelBtn.addComponent(cc.Button)
        cancelBtnComp.transition = cc.Button.Transition.SCALE
        cancelBtnComp.duration = 0.1
        cancelBtnComp.zoomScale = 1.1
        
        cancelBtn.on(cc.Node.EventType.TOUCH_END, function(event) {
            event.stopPropagation()
            this.onCancelClick()
        }, this)
        
        cancelBtn.parent = bottomBar
        this._cancelBtn = cancelBtn
        
        bottomBar.parent = this.node
        this._bottomBar = bottomBar
    },

    /**
     * 从全局变量初始化数据
     */
    _initFromGlobalData: function() {
        var myglobal = window.myglobal
        
        // 优先检查缓存的状态数据（服务端推送的最新数据）
        if (myglobal && myglobal.arenaWaitingStatusCache) {
            var cachedData = myglobal.arenaWaitingStatusCache
            console.log("🏟️ [ArenaMatchWaiting] 发现缓存的等待状态数据，玩家数量:", cachedData.players ? cachedData.players.length : 0)
            
            // 检查期号是否匹配
            var expectedPeriodNo = myglobal.arenaWaitingData ? myglobal.arenaWaitingData.period_no : ""
            if (!expectedPeriodNo || cachedData.period_no === expectedPeriodNo) {
                this._periodNo = cachedData.period_no || ""
                this._roomId = cachedData.room_id || 0
                this._roomName = cachedData.room_name || ""
                this._countdown = cachedData.countdown || 60
                this._totalPlayers = cachedData.total_players || 0
                this._enteredPlayers = cachedData.entered_players || 1
                this._players = cachedData.players || []
                this._startTime = cachedData.start_time || Date.now()
                
                this._updateUI()
                
                console.log("🏟️ [ArenaMatchWaiting] 从缓存数据初始化完成，显示玩家:", this._players.length)
                
                // 清除缓存
                myglobal.arenaWaitingStatusCache = null
                return
            }
        }
        
        // 使用 arenaWaitingData（点击进入时设置的数据）
        if (myglobal && myglobal.arenaWaitingData) {
            var data = myglobal.arenaWaitingData
            this._periodNo = data.period_no || ""
            this._roomId = data.room_id || 0
            this._roomName = data.room_name || ""
            this._countdown = data.countdown || 60
            this._totalPlayers = data.total_players || 0
            this._enteredPlayers = data.entered_players || 1
            this._players = data.players || []
            this._startTime = data.start_time || Date.now()
            
            this._updateUI()
            
            console.log("🏟️ [ArenaMatchWaiting] 从全局变量初始化数据完成")
            
            // 如果玩家列表为空，请求服务端推送状态
            if (this._players.length === 0) {
                console.log("🏟️ [ArenaMatchWaiting] 玩家列表为空，请求服务端推送状态")
                this._requestWaitingStatus()
            }
        }
    },

    /**
     * 请求服务端推送等待状态
     */
    _requestWaitingStatus: function() {
        var myglobal = window.myglobal
        var socket = myglobal && myglobal.socket
        
        if (socket && socket.sendArenaEnter) {
            // 重新发送 arena_enter 请求，服务端会推送当前状态
            socket.sendArenaEnter({
                period_no: this._periodNo,
                room_id: this._roomId
            })
            console.log("🏟️ [ArenaMatchWaiting] 已请求服务端推送等待状态")
        }
    },

    /**
     * 监听 room_joined 消息以进入游戏场景
     */
    _registerRoomJoinedHandler: function() {
        var self = this
        var myglobal = window.myglobal
        var socket = myglobal && myglobal.socket
        
        if (socket && socket.onRoomJoined) {
            socket.onRoomJoined(function(roomData) {
                console.log("🏟️ [ArenaMatchWaiting] 收到 room_joined，准备进入游戏场景:", JSON.stringify(roomData))
                
                // 检查是否是竞技场房间
                var roomCategory = roomData.room_category || 1
                if (roomCategory !== 2) {
                    console.log("🏟️ [ArenaMatchWaiting] 不是竞技场房间，忽略")
                    return
                }
                
                // 转换数据格式
                var players = roomData.players || []
                var convertedRoomData = {
                    roomid: roomData.room_code || "ARENA",
                    room_code: roomData.room_code || "ARENA",
                    seatindex: roomData.player ? roomData.player.seat + 1 : 1,
                    playerdata: players.map(function(p, idx) {
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
                        }
                    }),
                    housemanageid: roomData.creator_id || "",
                    creator_id: roomData.creator_id || "",
                    room_category: 2,
                    period_no: self._periodNo
                }
                
                // 保存转换后的房间数据
                if (myglobal) {
                    myglobal.roomData = convertedRoomData
                }
                
                // 进入游戏场景
                cc.director.loadScene("gameScene")
            })
        }
    },

    onDestroy () {
        // 取消事件监听
        this._unregisterEvents()
    },

    // ============================================================
    // 事件监听
    // ============================================================

    _registerEvents: function() {
        var self = this
        
        // 监听等待状态推送
        if (window.myglobal && window.myglobal.socket) {
            var socket = window.myglobal.socket
            
            // 等待状态推送
            socket.on("arena_waiting_status_notify", function(data) {
                console.log("🏟️ [ArenaMatchWaiting] 收到等待状态:", JSON.stringify(data))
                self._onWaitingStatus(data)
            })
            
            // 倒计时更新
            socket.on("arena_waiting_tick_notify", function(data) {
                console.log("🏟️ [ArenaMatchWaiting] 倒计时更新:", data.countdown)
                self._onWaitingTick(data)
            })
            
            // 玩家加入广播
            socket.on("arena_player_joined_notify", function(data) {
                console.log("🏟️ [ArenaMatchWaiting] 玩家加入:", JSON.stringify(data))
                self._onPlayerJoined(data)
            })
            
            // 分配阶段开始
            socket.on("arena_assign_start_notify", function(data) {
                console.log("🏟️ [ArenaMatchWaiting] 分配阶段开始:", JSON.stringify(data))
                self._onAssignStart(data)
            })
        }
    },

    _unregisterEvents: function() {
        // 事件会随节点销毁自动取消
    },

    // ============================================================
    // 公共方法
    // ============================================================

    /**
     * 设置初始数据
     * @param {Object} data - { period_no, room_id, room_name, countdown, total_players, entered_players, players, message }
     */
    setData: function(data) {
        this._periodNo = data.period_no || ""
        this._roomId = data.room_id || 0
        this._roomName = data.room_name || ""
        this._countdown = data.countdown || 60
        this._totalPlayers = data.total_players || 0
        this._enteredPlayers = data.entered_players || 0
        this._players = data.players || []
        this._startTime = data.start_time || Date.now()
        
        this._updateUI()
    },

    // ============================================================
    // 事件处理
    // ============================================================

    _onWaitingStatus: function(data) {
        // 检查期号是否匹配
        if (this._periodNo && data.period_no !== this._periodNo) {
            return
        }
        
        this._periodNo = data.period_no
        this._roomId = data.room_id
        this._roomName = data.room_name
        this._countdown = data.countdown
        this._totalPlayers = data.total_players
        this._enteredPlayers = data.entered_players
        this._players = data.players
        this._startTime = data.start_time
        
        this._updateUI()
    },

    _onWaitingTick: function(data) {
        // 检查期号是否匹配
        if (this._periodNo && data.period_no !== this._periodNo) {
            return
        }
        
        this._countdown = data.countdown
        this._enteredPlayers = data.entered_players
        
        this._updateCountdownUI()
        this._updatePlayerCountUI()
    },

    _onPlayerJoined: function(data) {
        // 检查期号是否匹配
        if (this._periodNo && data.period_no !== this._periodNo) {
            return
        }
        
        // 更新玩家列表
        this._players = data.players || []
        this._enteredPlayers = data.entered_players
        this._totalPlayers = data.total_players
        
        // 显示加入提示
        var newPlayer = data.player
        if (newPlayer && newPlayer.player_name) {
            this._showJoinMessage(newPlayer.player_name + " 进入了比赛")
        }
        
        // 更新UI
        this._updatePlayerListUI()
        this._updatePlayerCountUI()
    },

    _onAssignStart: function(data) {
        // 检查期号是否匹配
        if (this._periodNo && data.period_no !== this._periodNo) {
            return
        }
        
        this._countdown = data.countdown
        this._totalPlayers = data.total_players
        this._enteredPlayers = data.total_players
        
        this._updateUI()
        
        // 显示分配消息
        if (this._messageLabel) {
            this._messageLabel.string = data.message || "正在分配玩家，即将进入游戏..."
            this._messageLabel.node.color = cc.color(255, 220, 100)
        }
    },

    // ============================================================
    // UI更新
    // ============================================================

    _updateUI: function() {
        // 更新期号
        if (this._periodNoLabel) {
            this._periodNoLabel.string = "期号: " + this._periodNo
        }
        
        // 更新房间名称
        if (this._roomNameLabel) {
            this._roomNameLabel.string = this._roomName || "竞技场"
        }
        
        // 更新倒计时
        this._updateCountdownUI()
        
        // 更新玩家数量
        this._updatePlayerCountUI()
        
        // 更新玩家列表
        this._updatePlayerListUI()
    },

    _updateCountdownUI: function() {
        if (this._countdownLabel) {
            this._countdownLabel.string = this._countdown + "秒"
            
            // 最后10秒变红
            if (this._countdown <= 10 && this._countdown > 0) {
                this._countdownLabel.node.color = cc.color(255, 100, 100)
            } else {
                this._countdownLabel.node.color = cc.color(100, 255, 100)
            }
        }
    },

    _updatePlayerCountUI: function() {
        if (this._playerCountLabel) {
            this._playerCountLabel.string = "已进入: " + this._enteredPlayers + " / " + this._totalPlayers
        }
    },

    // ============================================================
    // 玩家列表渲染（ul > li 形式，一排3个）
    // ============================================================

    _updatePlayerListUI: function() {
        if (!this._playerListContent) return
        
        // 清空现有列表
        this._playerListContent.removeAllChildren()
        
        console.log("🏟️ [ArenaMatchWaiting] 更新玩家列表，玩家数量:", this._players.length)
        
        // 添加玩家项
        for (var i = 0; i < this._players.length; i++) {
            var player = this._players[i]
            var itemNode = this._createPlayerItem(player, i)
            itemNode.parent = this._playerListContent
        }
        
        // 更新容器高度
        var rows = Math.ceil(this._players.length / 3)
        var contentHeight = rows * 220 + 40  // 每行高度 220，加上边距
        this._playerListContent.setContentSize(this._playerListContent.width, Math.max(contentHeight, 200))
    },

    /**
     * 创建玩家项节点（头像 + 昵称在头像下面）
     */
    _createPlayerItem: function(player, index) {
        // 创建 li 节点（单个玩家卡片）
        var itemNode = new cc.Node("PlayerItem_" + index)
        itemNode.setContentSize(cc.size(180, 200))
        
        // 卡片背景
        var bgNode = new cc.Node("Bg")
        bgNode.setContentSize(cc.size(170, 190))
        var bgGraphics = bgNode.addComponent(cc.Graphics)
        bgGraphics.fillColor = cc.color(40, 45, 70, 200)
        bgGraphics.roundRect(-85, -95, 170, 190, 10)
        bgGraphics.fill()
        bgGraphics.strokeColor = cc.color(100, 120, 180)
        bgGraphics.lineWidth = 2
        bgGraphics.stroke()
        bgNode.parent = itemNode
        
        // 创建头像节点
        var avatarNode = new cc.Node("Avatar")
        avatarNode.setPosition(0, 30)
        avatarNode.setContentSize(cc.size(100, 100))
        
        var avatarSprite = avatarNode.addComponent(cc.Sprite)
        avatarSprite.type = cc.Sprite.Type.SIMPLE
        avatarSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM
        
        // 加载头像
        this._loadPlayerAvatar(player.avatar, avatarSprite)
        
        // 创建圆形遮罩
        var maskNode = new cc.Node("AvatarMask")
        maskNode.setPosition(0, 30)
        maskNode.setContentSize(cc.size(100, 100))
        
        var mask = maskNode.addComponent(cc.Mask)
        mask.type = cc.Mask.Type.ELLIPSE
        mask.segements = 64
        
        avatarNode.parent = maskNode
        maskNode.parent = itemNode
        
        // 创建昵称节点（在头像下面）
        var nameNode = new cc.Node("NameLabel")
        nameNode.setPosition(0, -55)
        
        var nameLabel = nameNode.addComponent(cc.Label)
        var playerName = player.player_name || player.name || ("玩家" + (player.player_id || index))
        nameLabel.string = playerName
        nameLabel.fontSize = 18
        nameLabel.lineHeight = 24
        nameLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        nameNode.setContentSize(cc.size(160, 24))
        
        // 机器人用灰色，真人用白色
        if (player.is_robot) {
            nameNode.color = cc.color(150, 150, 150)
        } else {
            nameNode.color = cc.color(255, 255, 255)
        }
        
        // 添加描边效果
        var outline = nameNode.addComponent(cc.LabelOutline)
        outline.color = cc.color(0, 0, 0)
        outline.width = 2
        
        nameNode.parent = itemNode
        
        // 机器人标识
        if (player.is_robot) {
            var robotTag = new cc.Node("RobotTag")
            robotTag.setPosition(60, 70)
            var tagLabel = robotTag.addComponent(cc.Label)
            tagLabel.string = "AI"
            tagLabel.fontSize = 14
            tagLabel.lineHeight = 18
            robotTag.color = cc.color(255, 200, 100)
            
            var tagOutline = robotTag.addComponent(cc.LabelOutline)
            tagOutline.color = cc.color(0, 0, 0)
            tagOutline.width = 1
            
            robotTag.parent = itemNode
        }
        
        return itemNode
    },

    /**
     * 加载玩家头像
     */
    _loadPlayerAvatar: function(avatarUrl, sprite) {
        if (!sprite) return
        
        // 如果没有头像URL，使用默认头像
        if (!avatarUrl) {
            cc.resources.load('UI/headimage/avatar_1', cc.SpriteFrame, function(err, spriteFrame) {
                if (!err && spriteFrame && sprite && sprite.node && sprite.node.isValid) {
                    sprite.spriteFrame = spriteFrame
                }
            })
            return
        }
        
        // 如果是网络URL
        if (avatarUrl.indexOf('http://') === 0 || avatarUrl.indexOf('https://') === 0) {
            cc.assetManager.loadRemote(avatarUrl, { ext: '.png' }, function(err, texture) {
                if (!err && texture && sprite && sprite.node && sprite.node.isValid) {
                    try {
                        var sf = new cc.SpriteFrame(texture)
                        sprite.spriteFrame = sf
                    } catch (e) {}
                }
            })
            return
        }
        
        // 本地资源路径
        cc.resources.load('UI/headimage/' + avatarUrl, cc.SpriteFrame, function(err, spriteFrame) {
            if (!err && spriteFrame && sprite && sprite.node && sprite.node.isValid) {
                sprite.spriteFrame = spriteFrame
            }
        })
    },

    // ============================================================
    // 提示消息
    // ============================================================

    _showJoinMessage: function(message) {
        // 创建浮动提示
        var tipNode = new cc.Node("JoinTip")
        tipNode.setPosition(0, 100)
        
        var label = tipNode.addComponent(cc.Label)
        label.string = message
        label.fontSize = 24
        label.lineHeight = 32
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        tipNode.color = cc.color(100, 255, 100)
        
        var outline = tipNode.addComponent(cc.LabelOutline)
        outline.color = cc.color(0, 0, 0)
        outline.width = 2
        
        tipNode.parent = this.node
        
        // 淡出动画
        tipNode.runAction(cc.sequence(
            cc.moveBy(1.5, cc.v2(0, 50)),
            cc.fadeOut(0.5),
            cc.removeSelf()
        ))
    },

    // ============================================================
    // 按钮事件
    // ============================================================

    /**
     * 取消进入（返回大厅）
     */
    onCancelClick: function() {
        console.log("🏟️ [ArenaMatchWaiting] 玩家点击取消")
        
        // 发送取消进入请求
        if (window.myglobal && window.myglobal.socket) {
            window.myglobal.socket.emit("arena_cancel_enter", {
                period_no: this._periodNo,
                room_id: this._roomId
            })
        }
        
        // 返回大厅
        cc.director.loadScene("hallScene")
    }
});
