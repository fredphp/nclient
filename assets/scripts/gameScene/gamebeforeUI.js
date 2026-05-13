// 使用全局变量，不使用 require

cc.Class({
    extends: cc.Component,

    properties: {
        btn_ready:cc.Node,
        btn_gamestart:cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        var myglobal = window.myglobal
        if (!myglobal) {
            console.error("myglobal 未定义")
            return
        }


        this.btn_gamestart.active = false
        this.btn_ready.active = false

        // 创建换房按钮
        this._createChangeRoomButton()

        //监听本地的发送的消息
        this.node.on("init",function(){
            
            // 标记 init 已处理
            this._initProcessed = true
            
            // 🔧【新增】检查是否是竞技场模式
            var roomData = myglobal.roomData || {}
            var isArenaMode = roomData.room_category === 2
            
            if (isArenaMode) {
                // 🔧【竞技场模式】不需要准备按钮和换房按钮
                // 所有玩家自动准备，游戏自动开始
                console.log("🏟️ [gamebeforeUI] 竞技场模式：隐藏所有按钮，等待游戏自动开始")
                this.btn_gamestart.active = false
                this.btn_ready.active = false
                this._hideChangeRoomButton()
                return
            }
            
            // 获取房主ID（服务端返回的 creator_id）
            var houseId = myglobal.playerData.housemanageid
            
            // 获取当前玩家ID - 优先使用 socket 的 playerId（服务端分配的ID）
            var myId = ""
            if (myglobal.socket && myglobal.socket.getPlayerInfo) {
                var playerInfo = myglobal.socket.getPlayerInfo()
                myId = playerInfo.id
            }
            // 备用：使用 accountID
            if (!myId) {
                myId = myglobal.playerData.accountID
            }
            
            
            // 房主（创建房间的玩家）自动准备，不需要准备按钮
            if(houseId && myId && houseId == myId){
                this.btn_gamestart.active = false
                this.btn_ready.active = false
                // 房主只显示换房按钮，居中显示
                this._showChangeRoomButton(true)
            }else{
                // 加入房间的玩家需要点击准备
                this.btn_gamestart.active = false
                this.btn_ready.active = true
                // 显示换房按钮和准备按钮，换房在左
                this._showChangeRoomButton(false)
            }
        }.bind(this))

        //监听服务器发送来的消息
        myglobal.socket.onChangeHouseManage(function(data){
            myglobal.playerData.housemanageid = data
            
            // 🔧【新增】检查是否是竞技场模式
            var roomData = myglobal.roomData || {}
            var isArenaMode = roomData.room_category === 2
            
            if (isArenaMode) {
                // 竞技场模式不需要显示任何按钮
                this.btn_gamestart.active = false
                this.btn_ready.active = false
                this._hideChangeRoomButton()
                return
            }
            
            var houseId = myglobal.playerData.housemanageid
            
            // 获取当前玩家ID - 优先使用 socket 的 playerId
            var myId = ""
            if (myglobal.socket && myglobal.socket.getPlayerInfo) {
                var playerInfo = myglobal.socket.getPlayerInfo()
                myId = playerInfo.id
            }
            if (!myId) {
                myId = myglobal.playerData.accountID
            }
            
            // 房主变更时重新判断
            if(houseId && myId && houseId == myId){
                this.btn_gamestart.active = false
                this.btn_ready.active = false
                this._showChangeRoomButton(true)
            }else{
                this.btn_gamestart.active = false
                this.btn_ready.active = true
                this._showChangeRoomButton(false)
            }
        }.bind(this))
    },

    // 创建换房按钮
    _createChangeRoomButton: function() {
        var self = this
        
        // 创建换房按钮节点
        var btnChangeRoom = new cc.Node("btn_changeRoom")
        btnChangeRoom.x = 0
        btnChangeRoom.y = 0
        btnChangeRoom.anchorX = 0.5
        btnChangeRoom.anchorY = 0.5
        btnChangeRoom.setContentSize(cc.size(147, 46))  // 使用图片原始尺寸
        btnChangeRoom.active = false  // 默认隐藏
        
        // 加载换房按钮图片
        cc.resources.load("UI/btnchange", cc.SpriteFrame, function(err, spriteFrame) {
            if (err) {
                // 使用代码创建按钮背景
                var graphics = btnChangeRoom.addComponent(cc.Graphics)
                graphics.fillColor = cc.color(255, 180, 0, 255)  // 橙黄色
                graphics.roundRect(-73.5, -23, 147, 46, 10)
                graphics.fill()
                graphics.strokeColor = cc.color(200, 140, 0)
                graphics.lineWidth = 2
                graphics.roundRect(-73.5, -23, 147, 46, 10)
                graphics.stroke()
                
                // 添加按钮文字（备用）
                var labelNode = new cc.Node("Label")
                var label = labelNode.addComponent(cc.Label)
                label.string = "换房"
                label.fontSize = 22
                label.horizontalAlign = cc.Label.HorizontalAlign.CENTER
                labelNode.color = cc.color(255, 255, 255)
                var outline = labelNode.addComponent(cc.LabelOutline)
                outline.color = cc.color(100, 60, 0)
                outline.width = 2
                labelNode.parent = btnChangeRoom
            } else {
                var sprite = btnChangeRoom.addComponent(cc.Sprite)
                sprite.spriteFrame = spriteFrame
                sprite.sizeMode = cc.Sprite.SizeMode.RAW  // 使用图片原始尺寸
            }
        })
        
        // 添加按钮组件
        var button = btnChangeRoom.addComponent(cc.Button)
        button.transition = cc.Button.Transition.SCALE
        button.duration = 0.1
        
        // 添加点击事件
        btnChangeRoom.on(cc.Node.EventType.TOUCH_END, function() {
            self._changeRoom()
        })
        
        btnChangeRoom.parent = this.node
        this._btnChangeRoom = btnChangeRoom
        
    },
    
    // 🔧【新增】隐藏换房按钮（竞技场模式使用）
    _hideChangeRoomButton: function() {
        if (!this._btnChangeRoom) return
        this._btnChangeRoom.active = false
    },
    
    // 显示换房按钮
    // centered: true = 居中显示（准备按钮隐藏时）, false = 左侧显示（准备按钮显示时）
    _showChangeRoomButton: function(centered) {
        if (!this._btnChangeRoom) return
        
        this._btnChangeRoom.active = true
        
        if (centered) {
            // 居中显示
            this._btnChangeRoom.x = 0
            // 🔧【修复】重置准备按钮位置到原点
            if (this.btn_ready) {
                this.btn_ready.x = 0
            }
        } else {
            // 🔧【修复】两个按钮作为一组居中显示
            // 准备按钮宽度 166px（从场景文件），换房按钮宽度 147px
            var readyWidth = 166  // 准备按钮宽度（实际尺寸）
            var changeRoomWidth = 147  // 换房按钮宽度
            var gap = 40  // 🔧【修复】增加间距从 20px 到 40px
            
            // 计算总宽度
            var totalWidth = readyWidth + gap + changeRoomWidth
            // 换房按钮在左边，位置 = -总宽度/2 + 换房按钮宽度/2
            var offsetX = -totalWidth/2 + changeRoomWidth/2
            // 准备按钮在右边，位置 = 总宽度/2 - 准备按钮宽度/2
            var readyOffsetX = totalWidth/2 - readyWidth/2
            
            this._btnChangeRoom.x = offsetX
            // 同时调整准备按钮位置
            if (this.btn_ready) {
                this.btn_ready.x = readyOffsetX
            }
        }
    },
    
    // 换房功能
    _changeRoom: function() {
        var myglobal = window.myglobal
        
        // 离开当前房间
        if (myglobal && myglobal.socket) {
            // 发送离开房间消息
            if (myglobal.socket.leaveRoom) {
                myglobal.socket.leaveRoom()
            }
        }
        
        // 返回大厅
        cc.director.loadScene("hallScene")
    },

    start () {
        var myglobal = window.myglobal
        if (!myglobal) return
        
        // 延迟检查，确保 housemanageid 已经设置
        this.scheduleOnce(function() {
            
            // 如果 init 事件已经处理过，跳过
            if (this._initProcessed) {
                return
            }
            
            // 🔧【新增】检查是否是竞技场模式
            var roomData = myglobal.roomData || {}
            var isArenaMode = roomData.room_category === 2
            
            if (isArenaMode) {
                // 竞技场模式不需要显示任何按钮
                console.log("🏟️ [gamebeforeUI] start: 竞技场模式，隐藏所有按钮")
                this.btn_gamestart.active = false
                this.btn_ready.active = false
                this._hideChangeRoomButton()
                return
            }
            
            // 强制检查并设置按钮状态
            var houseId = myglobal.playerData.housemanageid
            var myId = ""
            if (myglobal.socket && myglobal.socket.getPlayerInfo) {
                var playerInfo = myglobal.socket.getPlayerInfo()
                myId = playerInfo.id
            }
            if (!myId) {
                myId = myglobal.playerData.accountID
            }
            
            
            // 如果都不是房主，显示准备按钮
            if(houseId && myId && houseId == myId){
                this.btn_ready.active = false
                this._showChangeRoomButton(true)
            } else {
                this.btn_ready.active = true
                this._showChangeRoomButton(false)
            }
        }.bind(this), 0.5)  // 延迟 0.5 秒
    },

    // update (dt) {},
    
    onButtonClick(event,customData){
        var myglobal = window.myglobal
        switch(customData){
            case "btn_ready":
                // 🔊【新增】播放准备音效
                this._playReadySound()
                myglobal.socket.requestReady()
                // 点击准备后隐藏按钮
                this.btn_ready.active = false
                // 准备后换房按钮居中显示
                this._showChangeRoomButton(true)
                break
            case "btn_start":
                 myglobal.socket.requestStart(function(err,data){
                    if(err!=0){
                    }else{
                        
                    }
                 })
                 break    
            default:
                break
        }
    },
    
    // 🔊【新增】播放准备音效
    _playReadySound: function() {
        var isopen_sound = window.isopen_sound || 1
        if (!isopen_sound) return
        
        cc.resources.load("sound/start", cc.AudioClip, function(err, clip) {
            if (err) {
                console.warn("🔊 准备音效加载失败:", err)
                return
            }
            cc.audioEngine.playEffect(clip, false)
        })
    }
});
