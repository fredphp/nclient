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
const WaitingPhase = {
    WAITING: "waiting",       // 等待玩家进入阶段（60秒）
    ASSIGNING: "assigning",   // 分配阶段（10秒）
    ENTERING: "entering"      // 进入游戏阶段
};

cc.Class({
    extends: cc.Component,

    properties: {
        // 期号标签
        periodNoLabel: {
            type: cc.Label,
            default: null
        },
        // 房间名称标签
        roomNameLabel: {
            type: cc.Label,
            default: null
        },
        // 倒计时标签
        countdownLabel: {
            type: cc.Label,
            default: null
        },
        // 提示消息标签
        messageLabel: {
            type: cc.Label,
            default: null
        },
        // 玩家数量标签
        playerCountLabel: {
            type: cc.Label,
            default: null
        },
        // 玩家列表容器
        playerListContainer: {
            type: cc.Node,
            default: null
        },
        // 玩家项预制体
        playerItemPrefab: {
            type: cc.Prefab,
            default: null
        },
        // loading动画节点
        loadingNode: {
            type: cc.Node,
            default: null
        },
        // 阶段标签
        phaseLabel: {
            type: cc.Label,
            default: null
        },
        // 进度条
        progressBar: {
            type: cc.ProgressBar,
            default: null
        }
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 初始化数据
        this._periodNo = ""
        this._roomId = 0
        this._roomName = ""
        this._phase = WaitingPhase.WAITING
        this._countdown = 60
        this._totalPlayers = 0
        this._enteredPlayers = 0
        this._players = []
        this._startTime = 0
        
        // 注册事件监听
        this._registerEvents()
        
        console.log("🏟️ [ArenaEnterWaiting] 等待界面加载完成")
    },

    start () {
        // 启动loading动画
        this._startLoadingAnimation()
    },

    onDestroy () {
        // 取消事件监听
        this._unregisterEvents()
        
        // 停止动画
        this._stopLoadingAnimation()
    },

    // ============================================================
    // 事件监听
    // ============================================================

    _registerEvents: function() {
        var self = this
        
        // 🔧【修复】使用正确的事件监听方式
        // 获取全局事件监听器
        var myglobal = window.myglobal
        var evt = myglobal && myglobal.eventlister
        
        if (!evt) {
            console.error("🏟️ [ArenaEnterWaiting] 事件监听器不可用")
            return
        }
        
        // 等待状态推送
        this._waitingStatusHandler = function(data) {
            console.log("🏟️ [ArenaEnterWaiting] 收到等待状态:", JSON.stringify(data))
            self._onWaitingStatus(data)
        }
        evt.on("arena_waiting_status_notify", this._waitingStatusHandler)
        
        // 倒计时更新
        this._waitingTickHandler = function(data) {
            console.log("🏟️ [ArenaEnterWaiting] 倒计时更新:", data.countdown)
            self._onWaitingTick(data)
        }
        evt.on("arena_waiting_tick_notify", this._waitingTickHandler)
        
        // 分配阶段开始
        this._assignStartHandler = function(data) {
            console.log("🏟️ [ArenaEnterWaiting] 分配阶段开始:", JSON.stringify(data))
            self._onAssignStart(data)
        }
        evt.on("arena_assign_start_notify", this._assignStartHandler)
        
        console.log("🏟️ [ArenaEnterWaiting] 事件监听注册完成")
    },

    _unregisterEvents: function() {
        // 🔧【修复】正确取消事件监听
        var myglobal = window.myglobal
        var evt = myglobal && myglobal.eventlister
        
        if (!evt) return
        
        if (this._waitingStatusHandler) {
            evt.off("arena_waiting_status_notify", this._waitingStatusHandler)
        }
        if (this._waitingTickHandler) {
            evt.off("arena_waiting_tick_notify", this._waitingTickHandler)
        }
        if (this._assignStartHandler) {
            evt.off("arena_assign_start_notify", this._assignStartHandler)
        }
        
        console.log("🏟️ [ArenaEnterWaiting] 事件监听已取消")
    },

    // ============================================================
    // 公共方法
    // ============================================================

    /**
     * 设置初始数据
     * @param {Object} data - { period_no, room_id, room_name, phase, countdown, total_players, entered_players, players, message }
     */
    setData: function(data) {
        this._periodNo = data.period_no || ""
        this._roomId = data.room_id || 0
        this._roomName = data.room_name || ""
        this._phase = data.phase || WaitingPhase.WAITING
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
        this._phase = data.phase
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

    _onAssignStart: function(data) {
        // 检查期号是否匹配
        if (this._periodNo && data.period_no !== this._periodNo) {
            return
        }
        
        this._phase = WaitingPhase.ASSIGNING
        this._countdown = data.countdown
        this._totalPlayers = data.total_players
        this._enteredPlayers = data.total_players // 分配阶段所有玩家都已进入
        
        this._updateUI()
        
        // 显示分配消息
        if (this.messageLabel) {
            this.messageLabel.string = data.message || "正在分配玩家，即将进入游戏..."
            this.messageLabel.node.color = new cc.Color(255, 220, 100)
        }
    },

    // ============================================================
    // UI更新
    // ============================================================

    _updateUI: function() {
        // 更新期号
        if (this.periodNoLabel) {
            this.periodNoLabel.string = "期号: " + this._periodNo
        }
        
        // 更新房间名称
        if (this.roomNameLabel) {
            this.roomNameLabel.string = this._roomName || "竞技场"
        }
        
        // 更新倒计时
        this._updateCountdownUI()
        
        // 更新玩家数量
        this._updatePlayerCountUI()
        
        // 更新阶段显示
        this._updatePhaseUI()
        
        // 更新玩家列表
        this._updatePlayerListUI()
        
        // 更新进度条
        this._updateProgressBar()
    },

    _updateCountdownUI: function() {
        if (this.countdownLabel) {
            this.countdownLabel.string = this._countdown + "秒"
            
            // 最后10秒变红闪烁
            if (this._countdown <= 10 && this._countdown > 0) {
                this.countdownLabel.node.color = new cc.Color(255, 100, 100)
                // 闪烁效果
                this._startCountdownFlash()
            } else {
                this.countdownLabel.node.color = new cc.Color(255, 255, 255)
                this._stopCountdownFlash()
            }
        }
    },

    _updatePlayerCountUI: function() {
        if (this.playerCountLabel) {
            this.playerCountLabel.string = "已进入: " + this._enteredPlayers + " / " + this._totalPlayers
        }
    },

    _updatePhaseUI: function() {
        if (this.phaseLabel) {
            switch (this._phase) {
                case WaitingPhase.WAITING:
                    this.phaseLabel.string = "等待玩家进入"
                    this.phaseLabel.node.color = new cc.Color(100, 200, 255)
                    break
                case WaitingPhase.ASSIGNING:
                    this.phaseLabel.string = "正在分配玩家"
                    this.phaseLabel.node.color = new cc.Color(255, 220, 100)
                    break
                case WaitingPhase.ENTERING:
                    this.phaseLabel.string = "即将进入游戏"
                    this.phaseLabel.node.color = new cc.Color(100, 255, 100)
                    break
            }
        }
        
        // 更新提示消息
        if (this.messageLabel) {
            switch (this._phase) {
                case WaitingPhase.WAITING:
                    this.messageLabel.string = "等待其他玩家进入..."
                    this.messageLabel.node.color = new cc.Color(200, 200, 220)
                    break
                case WaitingPhase.ASSIGNING:
                    this.messageLabel.string = "正在分配玩家到各桌..."
                    this.messageLabel.node.color = new cc.Color(255, 220, 100)
                    break
                case WaitingPhase.ENTERING:
                    this.messageLabel.string = "正在进入游戏..."
                    this.messageLabel.node.color = new cc.Color(100, 255, 100)
                    break
            }
        }
    },

    _updatePlayerListUI: function() {
        if (!this.playerListContainer) return
        
        // 清空现有列表
        this.playerListContainer.removeAllChildren()
        
        // 添加玩家项
        for (var i = 0; i < this._players.length; i++) {
            var player = this._players[i]
            this._createPlayerItem(player, i)
        }
    },

    _createPlayerItem: function(player, index) {
        var itemNode = new cc.Node("PlayerItem_" + index)
        itemNode.setContentSize(cc.size(200, 40))
        
        // 背景色
        var bgNode = new cc.Node("Bg")
        var graphics = bgNode.addComponent(cc.Graphics)
        graphics.fillColor = new cc.Color(50, 50, 70, 150)
        graphics.roundRect(-100, -20, 200, 40, 5)
        graphics.fill()
        bgNode.parent = itemNode
        
        // 玩家名称
        var nameLabel = new cc.Node("NameLabel")
        var label = nameLabel.addComponent(cc.Label)
        label.string = player.player_name || "玩家" + player.player_id
        label.fontSize = 18
        label.lineHeight = 24
        // 🔧【修复】机器人和真人使用相同颜色，不再区分
        nameLabel.color = new cc.Color(255, 255, 255)
        nameLabel.setPosition(-40, 0)
        nameLabel.anchorX = 0
        nameLabel.parent = itemNode
        
        // 🔧【移除】不再显示机器人标识，让机器人看起来跟真人一样
        
        // 添加到容器
        var yPos = -index * 50
        if (this.playerListContainer.children.length > 0) {
            var lastChild = this.playerListContainer.children[this.playerListContainer.children.length - 1]
            yPos = lastChild.y - 50
        }
        itemNode.setPosition(0, yPos > 0 ? 0 : yPos)
        itemNode.parent = this.playerListContainer
    },

    _updateProgressBar: function() {
        if (this.progressBar && this._totalPlayers > 0) {
            var progress = this._enteredPlayers / this._totalPlayers
            this.progressBar.progress = Math.min(progress, 1.0)
        }
    },

    // ============================================================
    // 动画
    // ============================================================

    _startLoadingAnimation: function() {
        if (!this.loadingNode) return
        
        var rotateAction = cc.rotateBy(2, 360)
        var repeatAction = cc.repeatForever(rotateAction)
        this.loadingNode.runAction(repeatAction)
    },

    _stopLoadingAnimation: function() {
        if (this.loadingNode) {
            this.loadingNode.stopAllActions()
        }
    },

    _startCountdownFlash: function() {
        if (!this.countdownLabel) return
        
        // 闪烁效果
        this._flashAction = cc.sequence(
            cc.fadeTo(0.3, 128),
            cc.fadeTo(0.3, 255)
        )
        this._flashAction = cc.repeatForever(this._flashAction)
        this.countdownLabel.node.runAction(this._flashAction)
    },

    _stopCountdownFlash: function() {
        if (this.countdownLabel && this._flashAction) {
            this.countdownLabel.node.stopAction(this._flashAction)
            this.countdownLabel.node.opacity = 255
        }
    },

    // ============================================================
    // 按钮事件
    // ============================================================

    /**
     * 取消进入（返回大厅）
     */
    onCancelClick: function() {
        console.log("🏟️ [ArenaEnterWaiting] 玩家点击取消")
        
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
