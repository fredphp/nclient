// 使用全局变量，不使用 require
// 【修复版本】简化发牌逻辑，不再使用定时器调度
// 核心原则：
// 1. gameingUI.js 自己处理发牌动画
// 2. gameScene.js 只负责转发事件给 player_node
// 3. 不依赖 scheduleOnce 控制发牌节奏

cc.Class({
    extends: cc.Component,

    properties: {
        di_label: cc.Label,
        beishu_label: cc.Label,
        roomid_label: cc.Label,
        player_node_prefabs: cc.Prefab,
        players_seat_pos: cc.Node,
    },

    onLoad() {
        
        var myglobal = window.myglobal
        var RoomState = window.RoomState || { ROOM_INVALID: -1 }
        var isopen_sound = window.isopen_sound || 1

        if (!myglobal || !myglobal.playerData || !myglobal.socket) {
            console.error("gameScene: myglobal、playerData 或 socket 未定义")
            this._waitForInit()
            return
        }
        
        this._initScene(myglobal, RoomState, isopen_sound)
        this._startOnlineMonitoring()
    },

    // ============================================================
    // 在线监测和其他功能
    // ============================================================

    _startOnlineMonitoring: function() {
        var myglobal = window.myglobal
        if (!myglobal) {
            console.warn("gameScene: myglobal 未定义，无法启动在线监测")
            return
        }
        
        
        var self = this
        this._onlineStatusHandler = function(isOnline) {
            if (!isOnline) {
                self._showOfflineMessage()
            }
        }
        
        if (myglobal.addOnlineStatusListener) {
            myglobal.addOnlineStatusListener(this._onlineStatusHandler)
        }
        
        if (myglobal.eventlister) {
            myglobal.eventlister.on("force_logout", function(data) {
                console.warn("🚫 游戏场景收到强制下线事件:", data)
                self._handleForceLogout(data)
            })
        }
    },
    
    _showOfflineMessage: function() {
        console.warn("💔 游戏场景：网络连接已断开")
    },
    
    _handleForceLogout: function(data) {
        var reason = data.reason || "您已被强制下线"
        console.warn("🚫 游戏场景强制下线:", reason)
        
        var myglobal = window.myglobal
        if (myglobal && myglobal.stopOnlineMonitoring) {
            myglobal.stopOnlineMonitoring()
        }
        
        var self = this
        this.scheduleOnce(function() {
            if (typeof alert === 'function') {
                alert(reason + "\n\n请重新登录")
            }
            cc.director.loadScene("loginScene")
        }, 0.5)
    },
    
    _stopOnlineMonitoring: function() {
        var myglobal = window.myglobal
        
        if (myglobal && myglobal.removeOnlineStatusListener && this._onlineStatusHandler) {
            myglobal.removeOnlineStatusListener(this._onlineStatusHandler)
            this._onlineStatusHandler = null
        }
    },
    
    _waitForInit: function() {
        var self = this;
        var attempts = 0;
        var maxAttempts = 20;
        
        var checkInit = function() {
            attempts++;
            
            var myglobal = window.myglobal;
            if (myglobal && myglobal.playerData && myglobal.socket) {
                var RoomState = window.RoomState || { ROOM_INVALID: -1 };
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
    
    _initScene: function(myglobal, RoomState, isopen_sound) {
        this.playerNodeList = []
        
        var bottom = myglobal.playerData.bottom || 1
        var rate = myglobal.playerData.rate || 1
        
        this.di_label.string = "底:" + bottom
        this.beishu_label.string = "倍数:" + rate
        this.roomstate = RoomState.ROOM_INVALID
        this._isWaitingForPlayers = false


        // 监听，给其他玩家发牌(内部事件)
        // 【核心】player_node 直接显示 17 张牌背，不再逐张动画
        this.node.on("pushcard_other_event", function() {
            for (var i = 0; i < this.playerNodeList.length; i++) {
                var node = this.playerNodeList[i]
                if (node) {
                    node.emit("push_card_event")
                }
            }
        }.bind(this))

        // 监听房间状态改变事件
        myglobal.socket.onRoomChangeState(function(data) {
            this.roomstate = data
            
            if (data !== RoomState.ROOM_INVALID && this._isWaitingForPlayers) {
                this._hideWaitingUI()
            }
        }.bind(this))

        this.node.on("canrob_event", function(event) {
            for (var i = 0; i < this.playerNodeList.length; i++) {
                var node = this.playerNodeList[i]
                if (node) {
                    node.emit("playernode_canrob_event", event)
                }
            }
        }.bind(this))

        this.node.on("choose_card_event", function(event) {
            var gameui_node = this.node.getChildByName("gameingUI")
            if (gameui_node == null) {
                return
            }
            gameui_node.emit("choose_card_event", event)
        }.bind(this))

        this.node.on("unchoose_card_event", function(event) {
            var gameui_node = this.node.getChildByName("gameingUI")
            if (gameui_node == null) {
                return
            }
            gameui_node.emit("unchoose_card_event", event)
        }.bind(this))

        var currentRoomCode = myglobal.socket.getCurrentRoomCode()
        var isInRoom = myglobal.socket.isInRoom()
        
        
        var roomData = myglobal.roomData
        
        if (isInRoom && currentRoomCode && !roomData) {
            roomData = {
                roomid: currentRoomCode,
                room_code: currentRoomCode,
                seatindex: 1,
                playerdata: [{
                    accountid: myglobal.playerData.accountid || myglobal.playerData.playerId,
                    nick_name: myglobal.playerData.nickName,
                    avatarUrl: "avatar_1",
                    gold_count: myglobal.playerData.gobal_count || 1000, // 🔧【修复】使用 gold_count 字段
                    goldcount: myglobal.playerData.gobal_count || 1000,  // 兼容旧客户端
                    seatindex: 1,
                    isready: true
                }]
            }
        }
        
        if (roomData) {
            this._processRoomData(roomData, myglobal, isopen_sound)
        } else {
            myglobal.socket.request_enter_room({}, function(err, result) {
                if (err != 0) {
                } else {
                    this._processRoomData(result, myglobal, isopen_sound)
                }
            }.bind(this))
        }

        myglobal.socket.onPlayerJoinRoom(function(join_playerdata) {
            this.addPlayerNode(join_playerdata)

            if (!this._playerdataList) {
                this._playerdataList = []
            }
            this._playerdataList.push(join_playerdata)

            if (this._isWaitingForPlayers) {
                this._showWaitingUI(3 - this._playerdataList.length, this._currentRoomCode)
            }

            if (this.playerNodeList.length >= 3) {
                this._hideWaitingUI()
            }
        }.bind(this))

        // 🔧【新增】监听玩家离开事件
        myglobal.socket.onPlayerLeft(function(data) {
            console.log("👋 [gameScene] 收到玩家离开通知:", JSON.stringify(data))
            this._onPlayerLeft(data)
        }.bind(this))

        myglobal.socket.onPlayerReady(function(data) {
            for (var i = 0; i < this.playerNodeList.length; i++) {
                var node = this.playerNodeList[i]
                if (node) {
                    node.emit("player_ready_notify", data)
                }
            }
        }.bind(this))

        myglobal.socket.onGameStart(function() {
            for (var i = 0; i < this.playerNodeList.length; i++) {
                var node = this.playerNodeList[i]
                if (node) {
                    node.emit("gamestart_event")
                }
            }

            var gamebeforeUI = this.node.getChildByName("gamebeforeUI")
            if (gamebeforeUI) {
                gamebeforeUI.active = false
            }
        }.bind(this))

        // 🔧【新增】监听重新发牌（所有人都不叫地主）
        myglobal.socket.onRestartGame(function(data) {
            console.log("🔄 [gameScene] 收到重新发牌消息，清理玩家节点的抢地主/不抢图标")
            // 清理所有玩家节点的抢地主/不抢图标
            for (var i = 0; i < this.playerNodeList.length; i++) {
                var node = this.playerNodeList[i]
                if (node) {
                    node.emit("clear_rob_state_event")
                }
            }
        }.bind(this))

        myglobal.socket.onRobState(function(event) {
            // 🔧【修复】添加 round 字段，区分叫地主和抢地主
            var eventWithRound = Object.assign({}, event, { round: 2 })
            for (var i = 0; i < this.playerNodeList.length; i++) {
                var node = this.playerNodeList[i]
                if (node) {
                    node.emit("playernode_rob_state_event", eventWithRound)
                }
            }
        }.bind(this))
        
        // 🔧【新增】监听叫地主结果（第一轮）
        myglobal.socket.onBidResult(function(event) {
            // 🔧【修复】添加 round 字段，区分叫地主和抢地主
            var eventWithRound = Object.assign({}, event, { round: 1 })
            for (var i = 0; i < this.playerNodeList.length; i++) {
                var node = this.playerNodeList[i]
                if (node) {
                    node.emit("playernode_rob_state_event", eventWithRound)
                }
            }
        }.bind(this))

        myglobal.socket.onChangeMaster(function(event) {
            myglobal.playerData.master_accountid = event
            for (var i = 0; i < this.playerNodeList.length; i++) {
                var node = this.playerNodeList[i]
                if (node) {
                    node.emit("playernode_changemaster_event", event)
                }
            }
        }.bind(this))

        // 🔧【新增】监听出牌阶段开始
        myglobal.socket.onPlayStart(function(data) {
            // 设置房间状态为出牌阶段
            this.roomstate = RoomState.ROOM_PLAYING
        }.bind(this))

        this.node.on("update_card_count_event", function(data) {
            for (var i = 0; i < this.playerNodeList.length; i++) {
                var node = this.playerNodeList[i]
                if (node) {
                    node.emit("update_card_count_event", data)
                }
            }
        }.bind(this))

        myglobal.socket.onShowBottomCard(function(event) {
            var gameui_node = this.node.getChildByName("gameingUI")
            if (gameui_node == null) {
                return
            }
            gameui_node.emit("show_bottom_card_event", event)
        }.bind(this))
        
        myglobal.socket.onRoomRestored(function(data) {
            if (data.room_code) {
                var restoredRoomData = {
                    roomid: data.room_code,
                    room_code: data.room_code,
                    seatindex: 1,
                    playerdata: [{
                        accountid: data.player_id,
                        nick_name: data.player_name,
                        avatarUrl: "avatar_1",
                        gold_count: data.gold_count || 1000, // 🔧【修复】使用 gold_count 字段
                        goldcount: data.gold_count || 1000,  // 兼容旧客户端
                        seatindex: 1
                    }]
                }
                this._processRoomData(restoredRoomData, myglobal, isopen_sound)
            }
        }.bind(this))
        
        // 【新增】监听游戏状态恢复事件
        this.node.on("game_state_restored", function(data) {
            this._onGameStateRestored(data)
        }.bind(this))
        
        // 【新增】监听玩家掉线通知
        myglobal.socket.onPlayerOffline(function(data) {
            this._onPlayerOffline(data)
        }.bind(this))
        
        // 【新增】监听玩家上线通知
        myglobal.socket.onPlayerOnline(function(data) {
            this._onPlayerOnline(data)
        }.bind(this))
        
        // ============================================================
        // 【新增】竞技场等待UI相关事件监听
        // ============================================================
        
        // 监听竞技场等待进度更新
        myglobal.socket.onTournamentWaitProgress(function(data) {
            this._onArenaWaitProgress(data)
        }.bind(this))
        
        // 监听竞技场轮次晋级
        myglobal.socket.onTournamentRoundAdvance(function(data) {
            this._onArenaRoundAdvance(data)
        }.bind(this))
        
        // 监听竞技场最终榜单
        myglobal.socket.onTournamentFinalRank(function(data) {
            this._onArenaFinalRank(data)
        }.bind(this))
        
    },

    setPlayerSeatPos(seat_index) {
        if (seat_index < 1 || seat_index > 3) {
            return
        }


        switch (seat_index) {
            case 1:
                this.playerdata_list_pos[1] = 0
                this.playerdata_list_pos[2] = 1
                this.playerdata_list_pos[3] = 2
                break
            case 2:
                this.playerdata_list_pos[2] = 0
                this.playerdata_list_pos[3] = 1
                this.playerdata_list_pos[1] = 2
                break
            case 3:
                this.playerdata_list_pos[3] = 0
                this.playerdata_list_pos[1] = 1
                this.playerdata_list_pos[2] = 2
                break
            default:
                break
        }
    },

    addPlayerNode(player_data) {

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
            player_data.room_category = this._roomCategory || 1
            console.log("🏟️ [addPlayerNode] 设置 player_data.room_category =", player_data.room_category)
        }

        // 🔧【新增】将期号传递给 player_node
        if (!player_data.period_no && this._periodNo) {
            player_data.period_no = this._periodNo
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

    start() {
    },

    onDestroy: function() {
        this._stopOnlineMonitoring()
    },

    getUserOutCardPosByAccount(accountid) {
        
        if (!this.playerNodeList || !this.players_seat_pos) {
            console.error("playerNodeList 或 players_seat_pos 未初始化");
            return null;
        }
        
        // 🔧【修复】使用字符串比较，避免类型不匹配问题
        var targetAccountId = String(accountid || "")
        
        for (var i = 0; i < this.playerNodeList.length; i++) {
            var node = this.playerNodeList[i]
            if (node) {
                var node_script = node.getComponent("player_node")
                // 🔧【修复】使用字符串比较，确保类型一致
                if (node_script && String(node_script.accountid || "") === targetAccountId) {
                    if (node_script.seat_index === undefined || node_script.seat_index === null) {
                        console.error("无效的 seat_index");
                        return null;
                    }
                    
                    if (!this.players_seat_pos.children || !this.players_seat_pos.children[node_script.seat_index]) {
                        console.error("座位节点不存在，seat_index:", node_script.seat_index);
                        return null;
                    }
                    
                    var seat_node = this.players_seat_pos.children[node_script.seat_index]
                    // 🔧【修复】检查 seat_node 是否存在
                    if (!seat_node) {
                        console.error("seat_node 为空，seat_index:", node_script.seat_index);
                        return null;
                    }
                    var index_name = "cardsoutzone" + node_script.seat_index
                    var out_card_node = seat_node.getChildByName(index_name)
                    
                    // 🔧【调试】输出找到的出牌区域
                    console.log("🃏 [getUserOutCardPosByAccount] accountid:", accountid, "seat_index:", node_script.seat_index, "out_card_node:", out_card_node ? out_card_node.name : "null")
                    
                    return out_card_node
                }
            }
        }
        
        // 🔧【调试】未找到玩家节点
        console.warn("🃏 [getUserOutCardPosByAccount] 未找到玩家节点, accountid:", accountid, "playerNodeList.length:", this.playerNodeList.length)

        return null
    },
    
    _processRoomData: function(result, myglobal, isopen_sound) {
        
        console.log("🎮 [_processRoomData] 接收到的数据:", JSON.stringify(result))
        
        var seatid = result.seatindex || 1
        
        this.playerdata_list_pos = []
        this.setPlayerSeatPos(seatid)

        var playerdata_list = result.playerdata || []
        var roomid = result.roomid || result.room_code || result.roomCode || "WAITING"

        // 🔧【新增】检查是否是竞技场模式
        var isArenaMode = result.room_category === 2
        
        // 🔧【优化】竞技场模式下，优先使用预加载的数据
        if (isArenaMode && myglobal.arenaMatchData) {
            console.log("🏟️ [_processRoomData] 使用预加载的竞技场数据:", JSON.stringify(myglobal.arenaMatchData))
            
            // 使用预加载的数据补充缺失字段
            if (!result.base_score && myglobal.arenaMatchData.base_score) {
                result.base_score = myglobal.arenaMatchData.base_score
            }
            if (!result.multiplier && myglobal.arenaMatchData.multiplier) {
                result.multiplier = myglobal.arenaMatchData.multiplier
            }
            if (!result.match_rounds && myglobal.arenaMatchData.match_rounds) {
                result.match_rounds = myglobal.arenaMatchData.match_rounds
            }
            if (!result.match_duration && myglobal.arenaMatchData.match_duration) {
                result.match_duration = myglobal.arenaMatchData.match_duration
            }
            if (!result.initial_arena_gold && myglobal.arenaMatchData.initial_arena_gold) {
                result.initial_arena_gold = myglobal.arenaMatchData.initial_arena_gold
            }
        }
        
        if (isArenaMode) {
            console.log("🏟️ [_processRoomData] 竞技场模式: room_category=2, playerdata数量=" + playerdata_list.length + ", 期号=" + result.period_no)
        }

        // 🔧【修复】保存房间类型到实例变量，供 player_node 使用
        this._roomCategory = result.room_category || 1
        this._isArenaMode = isArenaMode
        this._periodNo = result.period_no || "" // 🔧【新增】保存期号
        
        // 🔧【新增】保存底分和倍数
        this._baseScore = result.base_score || 1
        this._multiplier = result.multiplier || 1
        this._matchRounds = result.match_rounds || 1
        this._initialArenaGold = result.initial_arena_gold || 1000

        this._playerdataList = playerdata_list

        
        if (this.roomid_label) {
            this.roomid_label.string = "房间号:" + roomid
        } else {
            console.error("🎮 [游戏场景] roomid_label 未绑定！")
        }
        
        // 🔧【优化】更新底分和倍数标签
        if (this.di_label && result.base_score) {
            this.di_label.string = "底:" + result.base_score
        }
        if (this.beishu_label && result.multiplier) {
            this.beishu_label.string = "倍数:" + result.multiplier
        }
        
        myglobal.playerData.housemanageid = result.housemanageid || result.creator_id || result.creatorId || ""
        
        if (myglobal.socket && myglobal.socket.getPlayerInfo) {
            var playerInfo = myglobal.socket.getPlayerInfo()
        }

        for (var i = 0; i < playerdata_list.length; i++) {
            console.log("🎮 [_processRoomData] 添加玩家节点: " + JSON.stringify(playerdata_list[i]))
            this.addPlayerNode(playerdata_list[i])
        }
        

        if (isopen_sound) {
            cc.audioEngine.stopAll()
            cc.resources.load("sound/bg", cc.AudioClip, function(err, clip) {
                if (err) {
                    return
                }
                cc.audioEngine.play(clip, true, 1)
            })
        }
        
        var gamebefore_node = this.node.getChildByName("gamebeforeUI")
        if (gamebefore_node) {
            gamebefore_node.active = true
            gamebefore_node.zIndex = 1000
            gamebefore_node.emit("init")
        }
        
        // 🔧【修复】竞技场模式下不显示等待玩家UI（所有玩家已分配好）
        if (isArenaMode) {
            console.log("🏟️ [_processRoomData] 竞技场模式：不显示等待玩家UI，玩家数量=" + playerdata_list.length)
            // 竞技场模式下所有玩家应该已经准备好，直接等待游戏开始
        } else if (playerdata_list.length < 3) {
            this._showWaitingUI(3 - playerdata_list.length, roomid)
        }
    },
    
    _showWaitingUI: function(needPlayers, roomCode) {
        var self = this
        this._isWaitingForPlayers = true
        this._needPlayers = needPlayers
        this._currentRoomCode = roomCode || ""


        this._hideWaitingUI()

        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas)
        var screenHeight = canvas ? canvas.designResolution.height : 720
        var screenWidth = canvas ? canvas.designResolution.width : 1280

        var waitingNode = new cc.Node("WaitingForPlayersUI")
        waitingNode.setContentSize(cc.size(screenWidth, screenHeight))
        waitingNode.anchorX = 0.5
        waitingNode.anchorY = 0.5
        waitingNode.x = 0
        waitingNode.y = 0
        waitingNode.parent = this.node
        this._waitingUINode = waitingNode

        if (roomCode) {
            var roomInfoNode = new cc.Node("RoomInfo")
            roomInfoNode.x = -screenWidth/2 + 20
            roomInfoNode.y = screenHeight/2 - 30
            roomInfoNode.anchorX = 0
            roomInfoNode.anchorY = 0.5

            var roomLabel = roomInfoNode.addComponent(cc.Label)
            roomLabel.string = "房间号: " + roomCode
            roomLabel.fontSize = 24
            roomLabel.horizontalAlign = cc.Label.HorizontalAlign.LEFT
            roomInfoNode.color = cc.color(255, 215, 0)

            var roomOutline = roomInfoNode.addComponent(cc.LabelOutline)
            roomOutline.color = cc.color(0, 0, 0)
            roomOutline.width = 2
            roomInfoNode.parent = waitingNode
        }

        var leaveBtnNode = new cc.Node("LeaveBtn")
        leaveBtnNode.x = screenWidth/2 - 100
        leaveBtnNode.y = -screenHeight/2 + 50
        leaveBtnNode.anchorX = 0.5
        leaveBtnNode.anchorY = 0.5
        leaveBtnNode.setContentSize(cc.size(140, 40))

        var leaveBtnBg = leaveBtnNode.addComponent(cc.Graphics)
        leaveBtnBg.fillColor = cc.color(180, 60, 60, 230)
        leaveBtnBg.roundRect(-70, -20, 140, 40, 8)
        leaveBtnBg.fill()
        leaveBtnBg.strokeColor = cc.color(220, 100, 100)
        leaveBtnBg.lineWidth = 2
        leaveBtnBg.roundRect(-70, -20, 140, 40, 8)
        leaveBtnBg.stroke()
        leaveBtnNode.parent = waitingNode

        var leaveBtnLabel = new cc.Node("Label")
        leaveBtnLabel.anchorX = 0.5
        leaveBtnLabel.anchorY = 0.5
        var leaveLabel = leaveBtnLabel.addComponent(cc.Label)
        leaveLabel.string = "离开房间"
        leaveLabel.fontSize = 20
        leaveLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        leaveBtnLabel.color = cc.color(255, 255, 255)
        var leaveOutline = leaveBtnLabel.addComponent(cc.LabelOutline)
        leaveOutline.color = cc.color(100, 30, 30)
        leaveOutline.width = 2
        leaveBtnLabel.parent = leaveBtnNode

        leaveBtnNode.on(cc.Node.EventType.TOUCH_START, function() {
            leaveBtnNode.scale = 0.95
        })
        leaveBtnNode.on(cc.Node.EventType.TOUCH_END, function() {
            leaveBtnNode.scale = 1
            self._leaveRoom()
        })
        leaveBtnNode.on(cc.Node.EventType.TOUCH_CANCEL, function() {
            leaveBtnNode.scale = 1
        })

        this._updateWaitingAnimation()
    },

    _updateWaitingUI: function() {
        if (!this._isWaitingForPlayers) return

        var currentPlayers = this.playerNodeList.length

        if (currentPlayers >= 3) {
            this._hideWaitingUI()
        }
    },

    _updateWaitingAnimation: function() {
        var self = this
        if (!this._isWaitingForPlayers || !this._waitingUINode) return
        this.scheduleOnce(function() {
            self._updateWaitingAnimation()
        }, 1/60)
    },
    
    _hideWaitingUI: function() {
        this._isWaitingForPlayers = false
        
        if (this._waitingUINode) {
            this._waitingUINode.destroy()
            this._waitingUINode = null
        }
        
    },
    
    _leaveRoom: function() {
        
        var myglobal = window.myglobal
        if (myglobal && myglobal.socket) {
            if (myglobal.socket.leaveRoom) {
                myglobal.socket.leaveRoom()
            }
        }
        
        this._hideWaitingUI()
        cc.director.loadScene("hallScene")
    },
    
    // ============================================================
    // 【新增】游戏状态恢复处理
    // ============================================================
    
    /**
     * 处理游戏状态恢复事件
     */
    _onGameStateRestored: function(data) {
        
        // 更新玩家节点的状态
        if (data.players) {
            for (var i = 0; i < this.playerNodeList.length; i++) {
                var node = this.playerNodeList[i]
                if (node) {
                    var nodeScript = node.getComponent("player_node")
                    if (nodeScript) {
                        // 查找对应的玩家数据
                        for (var j = 0; j < data.players.length; j++) {
                            var p = data.players[j]
                            if (p.id === nodeScript.accountid) {
                                // 更新玩家状态
                                node.emit("player_state_update", {
                                    state: p.state,
                                    cards_count: p.cards_count,
                                    is_landlord: p.is_landlord
                                })
                                break
                            }
                        }
                    }
                }
            }
        }
        
        // 隐藏 gamebeforeUI
        var gamebefore_node = this.node.getChildByName("gamebeforeUI")
        if (gamebefore_node) {
            gamebefore_node.active = false
        }
        
        // 显示 gameingUI
        var gameing_node = this.node.getChildByName("gameingUI")
        if (gameing_node) {
            gameing_node.active = true
        }
    },
    
    /**
     * 处理玩家掉线通知
     */
    _onPlayerOffline: function(data) {
        
        // 通知所有玩家节点更新状态
        for (var i = 0; i < this.playerNodeList.length; i++) {
            var node = this.playerNodeList[i]
            if (node) {
                var nodeScript = node.getComponent("player_node")
                if (nodeScript && nodeScript.accountid === data.player_id) {
                    node.emit("player_state_update", {
                        state: "offline",
                        timeout: data.timeout
                    })
                    break
                }
            }
        }
    },
    
    /**
     * 处理玩家上线通知
     */
    _onPlayerOnline: function(data) {
        
        // 通知所有玩家节点更新状态
        for (var i = 0; i < this.playerNodeList.length; i++) {
            var node = this.playerNodeList[i]
            if (node) {
                var nodeScript = node.getComponent("player_node")
                if (nodeScript && nodeScript.accountid === data.player_id) {
                    node.emit("player_state_update", {
                        state: "online"
                    })
                    break
                }
            }
        }
    },

    /**
     * 🔧【新增】处理玩家离开通知
     * 当收到服务端的 player_left 消息时，移除对应的玩家节点
     */
    _onPlayerLeft: function(data) {
        console.log("👋 [_onPlayerLeft] 处理玩家离开, player_id:", data.player_id, "player_name:", data.player_name)
        
        var playerId = data.player_id
        if (!playerId) {
            console.warn("👋 [_onPlayerLeft] 缺少 player_id")
            return
        }
        
        // 从 playerNodeList 中查找并移除玩家节点
        var removedIndex = -1
        for (var i = 0; i < this.playerNodeList.length; i++) {
            var node = this.playerNodeList[i]
            if (node) {
                var nodeScript = node.getComponent("player_node")
                if (nodeScript && nodeScript.accountid === playerId) {
                    console.log("👋 [_onPlayerLeft] 找到离开的玩家节点，准备移除:", playerId)
                    
                    // 销毁节点
                    node.destroy()
                    
                    // 从列表中移除
                    this.playerNodeList.splice(i, 1)
                    removedIndex = i
                    break
                }
            }
        }
        
        // 从 _playerdataList 中移除玩家数据
        if (this._playerdataList) {
            for (var i = 0; i < this._playerdataList.length; i++) {
                if (this._playerdataList[i].accountid === playerId) {
                    this._playerdataList.splice(i, 1)
                    console.log("👋 [_onPlayerLeft] 从玩家数据列表中移除:", playerId)
                    break
                }
            }
        }
        
        // 如果当前玩家数量不足3人，显示等待UI
        var currentCount = this.playerNodeList.length
        console.log("👋 [_onPlayerLeft] 当前玩家数量:", currentCount)
        
        // 检查是否是竞技场模式
        var isArenaMode = this._isArenaMode || false
        
        if (!isArenaMode && currentCount < 3 && !this._isWaitingForPlayers) {
            // 普通模式下，玩家离开后显示等待UI
            var roomCode = this._currentRoomCode || ""
            if (this.roomid_label) {
                roomCode = this.roomid_label.string.replace("房间号:", "")
            }
            this._showWaitingUI(3 - currentCount, roomCode)
        }
        
        // 更新房主信息（如果离开的是房主）
        var myglobal = window.myglobal
        if (myglobal && myglobal.playerData) {
            // 服务端会在 player_left 消息中包含新的房主ID（如果需要）
            if (data.new_creator_id) {
                myglobal.playerData.housemanageid = data.new_creator_id
                console.log("👋 [_onPlayerLeft] 新房主ID:", data.new_creator_id)
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
    _showArenaWaitingUI: function(data) {
        // 仅在竞技场模式下显示
        if (!this._isArenaMode) {
            console.log("🏟️ [_showArenaWaitingUI] 非竞技场模式，不显示等待UI")
            return
        }
        
        console.log("🏟️ [_showArenaWaitingUI] 显示竞技场等待UI:", JSON.stringify(data))
        
        var self = this
        
        // 先隐藏已有的等待UI
        this._hideArenaWaitingUI()
        
        // 获取画布尺寸
        var canvas = this.node.getComponent(cc.Canvas) || cc.find('Canvas').getComponent(cc.Canvas)
        var screenHeight = canvas ? canvas.designResolution.height : 720
        var screenWidth = canvas ? canvas.designResolution.width : 1280
        
        // 创建等待UI容器
        var waitingNode = new cc.Node("ArenaWaitingUI")
        waitingNode.setContentSize(cc.size(screenWidth, screenHeight))
        waitingNode.anchorX = 0.5
        waitingNode.anchorY = 0.5
        waitingNode.x = 0
        waitingNode.y = 0
        waitingNode.zIndex = 2000  // 确保在最上层
        waitingNode.parent = this.node
        this._arenaWaitingUINode = waitingNode
        
        // 存储数据
        this._arenaWaitingData = {
            periodNo: data.period_no || "",
            round: data.round || 1,
            totalRounds: data.total_rounds || 1,
            finishedTables: data.finished_tables || 0,
            totalTables: data.total_tables || 0,
            status: data.status || "WAITING"
        }
        
        // ========== 1. 半透明背景 ==========
        var bgNode = new cc.Node("Bg")
        var bgGraphics = bgNode.addComponent(cc.Graphics)
        bgGraphics.fillColor = cc.color(0, 0, 0, 180)
        bgGraphics.rect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight)
        bgGraphics.fill()
        bgNode.parent = waitingNode
        
        // ========== 2. 中央卡片背景 ==========
        var cardWidth = 400
        var cardHeight = 280
        var cardNode = new cc.Node("Card")
        cardNode.setContentSize(cc.size(cardWidth, cardHeight))
        cardNode.anchorX = 0.5
        cardNode.anchorY = 0.5
        cardNode.x = 0
        cardNode.y = 0
        
        var cardBg = cardNode.addComponent(cc.Graphics)
        cardBg.fillColor = cc.color(30, 60, 100, 230)
        cardBg.roundRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 15)
        cardBg.fill()
        cardBg.strokeColor = cc.color(255, 215, 0)
        cardBg.lineWidth = 3
        cardBg.roundRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 15)
        cardBg.stroke()
        cardNode.parent = waitingNode
        
        // ========== 3. 标题 ==========
        var titleNode = new cc.Node("Title")
        titleNode.y = cardHeight/2 - 35
        var titleLabel = titleNode.addComponent(cc.Label)
        titleLabel.string = "🏆 竞技场等待中"
        titleLabel.fontSize = 28
        titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        titleNode.color = cc.color(255, 215, 0)
        var titleOutline = titleNode.addComponent(cc.LabelOutline)
        titleOutline.color = cc.color(0, 0, 0)
        titleOutline.width = 2
        titleNode.parent = cardNode
        
        // ========== 4. 期号标签 ==========
        this._arenaPeriodLabel = new cc.Node("PeriodLabel")
        this._arenaPeriodLabel.y = cardHeight/2 - 80
        var periodLabel = this._arenaPeriodLabel.addComponent(cc.Label)
        periodLabel.string = "第 " + (data.period_no || "--") + " 期"
        periodLabel.fontSize = 20
        periodLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        this._arenaPeriodLabel.color = cc.color(200, 200, 220)
        this._arenaPeriodLabel.parent = cardNode
        
        // ========== 5. 轮次标签 ==========
        this._arenaRoundLabel = new cc.Node("RoundLabel")
        this._arenaRoundLabel.y = cardHeight/2 - 110
        var roundLabel = this._arenaRoundLabel.addComponent(cc.Label)
        roundLabel.string = "第 " + (data.round || 1) + " 轮 / 共 " + (data.total_rounds || 1) + " 轮"
        roundLabel.fontSize = 18
        roundLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        this._arenaRoundLabel.color = cc.color(180, 180, 200)
        this._arenaRoundLabel.parent = cardNode
        
        // ========== 5.5 金币显示 ==========
        this._arenaCoinLabel = new cc.Node("CoinLabel")
        this._arenaCoinLabel.y = cardHeight/2 - 140
        var coinLabel = this._arenaCoinLabel.addComponent(cc.Label)
        // 获取当前玩家的竞技金币
        var myMatchCoin = this._getMyMatchCoin ? this._getMyMatchCoin() : 0
        coinLabel.string = "💰 当前金币: " + myMatchCoin
        coinLabel.fontSize = 18
        coinLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        this._arenaCoinLabel.color = cc.color(255, 215, 0)
        this._arenaCoinLabel.parent = cardNode
        
        // ========== 6. 进度条 ==========
        this._arenaProgressBar = new cc.Node("ProgressBar")
        this._arenaProgressBar.setContentSize(cc.size(320, 20))
        this._arenaProgressBar.y = 0
        
        // 进度条背景
        var progressBg = this._arenaProgressBar.addComponent(cc.Graphics)
        progressBg.fillColor = cc.color(50, 50, 70, 200)
        progressBg.roundRect(-160, -10, 320, 20, 5)
        progressBg.fill()
        this._arenaProgressBar.parent = cardNode
        
        // 进度条填充（初始为0）
        this._arenaProgressFill = new cc.Node("ProgressFill")
        this._arenaProgressFill.y = 0
        var fillGraphics = this._arenaProgressFill.addComponent(cc.Graphics)
        this._arenaProgressFill._graphics = fillGraphics
        this._arenaProgressFill.parent = cardNode
        
        // ========== 7. 进度文字 ==========
        this._arenaProgressLabel = new cc.Node("ProgressLabel")
        this._arenaProgressLabel.y = -40
        var progressLabel = this._arenaProgressLabel.addComponent(cc.Label)
        progressLabel.string = (data.finished_tables || 0) + " / " + (data.total_tables || 0)
        progressLabel.fontSize = 24
        progressLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        this._arenaProgressLabel.color = cc.color(255, 255, 255)
        this._arenaProgressLabel.parent = cardNode
        
        // ========== 8. 状态提示 ==========
        this._arenaStatusLabel = new cc.Node("StatusLabel")
        this._arenaStatusLabel.y = -80
        var statusLabel = this._arenaStatusLabel.addComponent(cc.Label)
        statusLabel.string = "正在等待其他玩家完成..."
        statusLabel.fontSize = 16
        statusLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        this._arenaStatusLabel.color = cc.color(150, 200, 255)
        this._arenaStatusLabel.parent = cardNode
        
        // ========== 9. Loading动画（旋转扑克牌）==========
        this._arenaLoadingNode = new cc.Node("LoadingNode")
        this._arenaLoadingNode.y = -120
        var loadingSprite = this._arenaLoadingNode.addComponent(cc.Sprite)
        // 尝试加载扑克牌图片
        cc.resources.load('UI/card_back', cc.SpriteFrame, function(err, spriteFrame) {
            if (!err && spriteFrame && loadingSprite) {
                loadingSprite.spriteFrame = spriteFrame
            }
        })
        this._arenaLoadingNode.scale = 0.5
        this._arenaLoadingNode.parent = cardNode
        
        // 启动旋转动画
        this._startArenaLoadingAnimation()
        
        // 更新UI
        this._updateArenaWaitingUI(data)
        
        console.log("🏟️ [_showArenaWaitingUI] 竞技场等待UI已创建")
    },
    
    /**
     * 隐藏竞技场等待UI
     */
    _hideArenaWaitingUI: function() {
        // 停止动画
        this._stopArenaLoadingAnimation()
        
        // 销毁节点
        if (this._arenaWaitingUINode) {
            this._arenaWaitingUINode.destroy()
            this._arenaWaitingUINode = null
        }
        
        // 清理引用
        this._arenaPeriodLabel = null
        this._arenaRoundLabel = null
        this._arenaCoinLabel = null
        this._arenaProgressBar = null
        this._arenaProgressFill = null
        this._arenaProgressLabel = null
        this._arenaStatusLabel = null
        this._arenaLoadingNode = null
        this._arenaWaitingData = null
        
        console.log("🏟️ [_hideArenaWaitingUI] 竞技场等待UI已隐藏")
    },
    
    /**
     * 更新竞技场等待UI
     */
    _updateArenaWaitingUI: function(data) {
        if (!this._arenaWaitingUINode) return
        
        // 更新存储的数据
        if (data) {
            this._arenaWaitingData = {
                periodNo: data.period_no || this._arenaWaitingData.periodNo,
                round: data.round || this._arenaWaitingData.round,
                totalRounds: data.total_rounds || this._arenaWaitingData.totalRounds,
                finishedTables: data.finished_tables || this._arenaWaitingData.finishedTables,
                totalTables: data.total_tables || this._arenaWaitingData.totalTables,
                status: data.status || this._arenaWaitingData.status
            }
        }
        
        var d = this._arenaWaitingData
        
        // 更新期号
        if (this._arenaPeriodLabel) {
            var periodLabel = this._arenaPeriodLabel.getComponent(cc.Label)
            if (periodLabel) {
                periodLabel.string = "第 " + (d.periodNo || "--") + " 期"
            }
        }
        
        // 更新轮次
        if (this._arenaRoundLabel) {
            var roundLabel = this._arenaRoundLabel.getComponent(cc.Label)
            if (roundLabel) {
                roundLabel.string = "第 " + d.round + " 轮 / 共 " + d.totalRounds + " 轮"
            }
        }
        
        // 更新进度文字
        if (this._arenaProgressLabel) {
            var progressLabel = this._arenaProgressLabel.getComponent(cc.Label)
            if (progressLabel) {
                progressLabel.string = d.finishedTables + " / " + d.totalTables
            }
        }
        
        // 更新进度条
        if (this._arenaProgressFill && d.totalTables > 0) {
            var progress = Math.min(d.finishedTables / d.totalTables, 1.0)
            var barWidth = 320 * progress
            
            var graphics = this._arenaProgressFill._graphics
            if (graphics) {
                graphics.clear()
                if (barWidth > 0) {
                    graphics.fillColor = cc.color(100, 200, 100, 255)
                    graphics.roundRect(-160, -8, barWidth, 16, 3)
                    graphics.fill()
                }
            }
        }
        
        // 更新状态提示
        if (this._arenaStatusLabel) {
            var statusLabel = this._arenaStatusLabel.getComponent(cc.Label)
            if (statusLabel) {
                if (d.finishedTables >= d.totalTables) {
                    statusLabel.string = "全部完成，即将进入下一轮..."
                    this._arenaStatusLabel.color = cc.color(100, 255, 100)
                } else {
                    var remaining = d.totalTables - d.finishedTables
                    statusLabel.string = "正在等待其他玩家完成... (剩余 " + remaining + " 桌)"
                    this._arenaStatusLabel.color = cc.color(150, 200, 255)
                }
            }
        }
    },
    
    /**
     * 启动Loading旋转动画
     */
    _startArenaLoadingAnimation: function() {
        if (!this._arenaLoadingNode) return
        
        this._stopArenaLoadingAnimation()
        
        var self = this
        this._arenaLoadingAnimation = true
        
        var rotate = function() {
            if (!self._arenaLoadingAnimation || !self._arenaLoadingNode) return
            self._arenaLoadingNode.angle += 3
            setTimeout(rotate, 16)
        }
        rotate()
    },
    
    /**
     * 停止Loading旋转动画
     */
    _stopArenaLoadingAnimation: function() {
        this._arenaLoadingAnimation = false
        if (this._arenaLoadingNode) {
            this._arenaLoadingNode.angle = 0
        }
    },
    
    /**
     * 获取当前玩家的竞技金币
     * 🔧【新增】用于等待界面显示金币
     */
    _getMyMatchCoin: function() {
        var myglobal = window.myglobal
        if (!myglobal || !myglobal.playerData) {
            return 0
        }
        
        // 从玩家数据中获取竞技金币
        // 在游戏场景中，玩家的竞技金币存储在 myglobal.playerData.match_coin 或通过 player_node 获取
        var matchCoin = 0
        
        // 方式1：从 player_node_prefabs 获取
        if (this.player_node_prefabs && this.player_node_prefabs.length > 0) {
            for (var i = 0; i < this.player_node_prefabs.length; i++) {
                var playerNode = this.player_node_prefabs[i]
                if (playerNode && playerNode.player_data) {
                    // 找到当前玩家
                    var playerData = playerNode.player_data
                    var myPlayerId = myglobal.playerData.accountID || myglobal.playerData.uniqueID
                    if (playerData.accountid === myPlayerId || playerData.accountid === String(myPlayerId)) {
                        matchCoin = playerData.match_coin || playerData.arena_gold || 0
                        break
                    }
                }
            }
        }
        
        // 方式2：从全局数据获取
        if (matchCoin === 0 && myglobal.arenaMatchData) {
            matchCoin = myglobal.arenaMatchData.myMatchCoin || 0
        }
        
        return matchCoin
    },
    
    /**
     * 处理竞技场等待进度更新
     */
    _onArenaWaitProgress: function(data) {
        console.log("🏟️ [_onArenaWaitProgress] 收到进度更新:", JSON.stringify(data))
        
        // 检查期号是否匹配
        if (this._arenaWaitingData && this._arenaWaitingData.periodNo && 
            data.period_no && data.period_no !== this._arenaWaitingData.periodNo) {
            return
        }
        
        // 如果等待UI不存在，先创建
        if (!this._arenaWaitingUINode && this._isArenaMode) {
            this._showArenaWaitingUI(data)
        } else {
            this._updateArenaWaitingUI(data)
        }
    },
    
    /**
     * 处理竞技场轮次晋级
     */
    _onArenaRoundAdvance: function(data) {
        console.log("🏟️ [_onArenaRoundAdvance] 进入下一轮:", JSON.stringify(data))
        
        // 检查期号是否匹配
        if (this._arenaWaitingData && this._arenaWaitingData.periodNo && 
            data.period_no && data.period_no !== this._arenaWaitingData.periodNo) {
            return
        }
        
        // 更新轮次信息
        if (this._arenaWaitingData) {
            this._arenaWaitingData.round = data.new_round || this._arenaWaitingData.round + 1
            this._arenaWaitingData.totalRounds = data.total_rounds || this._arenaWaitingData.totalRounds
            this._arenaWaitingData.finishedTables = 0
        }
        
        // 更新UI
        if (this._arenaRoundLabel) {
            var roundLabel = this._arenaRoundLabel.getComponent(cc.Label)
            if (roundLabel) {
                roundLabel.string = "第 " + (data.new_round || 1) + " 轮 / 共 " + (data.total_rounds || 1) + " 轮"
                
                // 播放放大动画
                var scaleUp = cc.scaleTo(0.2, 1.3)
                var scaleDown = cc.scaleTo(0.2, 1.0)
                var sequence = cc.sequence(scaleUp, scaleDown)
                this._arenaRoundLabel.runAction(sequence)
            }
        }
        
        // 更新状态提示
        if (this._arenaStatusLabel) {
            var statusLabel = this._arenaStatusLabel.getComponent(cc.Label)
            if (statusLabel) {
                statusLabel.string = data.message || "晋级成功！正在匹配下一轮..."
                this._arenaStatusLabel.color = cc.color(100, 255, 100)
            }
        }
    },
    
    /**
     * 处理竞技场最终榜单
     */
    _onArenaFinalRank: function(data) {
        console.log("🏟️ [_onArenaFinalRank] 比赛结束，显示最终榜单:", JSON.stringify(data))
        
        // 检查期号是否匹配
        if (this._arenaWaitingData && this._arenaWaitingData.periodNo && 
            data.period_no && data.period_no !== this._arenaWaitingData.periodNo) {
            return
        }
        
        // 停止动画
        this._stopArenaLoadingAnimation()
        
        // 隐藏等待UI
        this._hideArenaWaitingUI()
        
        // 显示最终榜单弹窗
        this._showArenaFinalRankDialog(data)
    },
    
    /**
     * 显示最终榜单弹窗
     * 🔧【修复】直接创建弹窗UI，避免依赖外部组件类注册问题
     */
    _showArenaFinalRankDialog: function(data) {
        var self = this
        
        console.log("🏆 [_showArenaFinalRankDialog] 显示完整排行榜弹窗, data:", JSON.stringify(data))
        
        // 🔧【修复】直接创建弹窗UI，不使用 addComponent("TournamentFinalRankDialog")
        // 因为 Cocos 在运行时可能无法正确找到注册的类
        var dialogNode = this._createFinalRankDialog(data)
        
        if (!dialogNode) {
            console.error("🏆 [_showArenaFinalRankDialog] 创建弹窗失败")
            return
        }
        
        // 添加到当前场景
        this.node.addChild(dialogNode)
        dialogNode.zIndex = 3000
        
        this._arenaFinalRankDialog = dialogNode
        
        console.log("🏆 [_showArenaFinalRankDialog] 完整排行榜弹窗已创建")
    },
    
    /**
     * 🔧【新增】创建最终榜单弹窗UI
     * 直接创建UI，避免组件类注册问题
     */
    _createFinalRankDialog: function(data) {
        var screenWidth = 1280
        var screenHeight = 720
        
        // 创建弹窗容器
        var dialogNode = new cc.Node("TournamentFinalRankDialog")
        dialogNode.setPosition(0, 0)
        dialogNode.setContentSize(screenWidth, screenHeight)
        
        // 半透明背景遮罩
        var bgNode = new cc.Node("Background")
        bgNode.setContentSize(screenWidth, screenHeight)
        var bgGraphics = bgNode.addComponent(cc.Graphics)
        bgGraphics.fillColor = new cc.Color(0, 0, 0, 180)
        bgGraphics.rect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight)
        bgGraphics.fill()
        bgNode.parent = dialogNode
        
        // 主弹窗容器
        var dialogContainer = new cc.Node("DialogContainer")
        dialogContainer.setContentSize(1000, 650)
        dialogContainer.setPosition(0, 0)
        
        // 弹窗背景
        var dialogBg = new cc.Node("DialogBg")
        var dialogBgGraphics = dialogBg.addComponent(cc.Graphics)
        dialogBgGraphics.fillColor = new cc.Color(25, 35, 60, 250)
        dialogBgGraphics.roundRect(-500, -325, 1000, 650, 25)
        dialogBgGraphics.fill()
        dialogBgGraphics.strokeColor = new cc.Color(180, 140, 60)
        dialogBgGraphics.lineWidth = 4
        dialogBgGraphics.roundRect(-500, -325, 1000, 650, 25)
        dialogBgGraphics.stroke()
        dialogBg.parent = dialogContainer
        dialogContainer.parent = dialogNode
        
        // 标题
        var titleNode = new cc.Node("Title")
        titleNode.setPosition(0, 270)
        var titleLabel = titleNode.addComponent(cc.Label)
        titleLabel.string = "🏆 比赛结束 🏆"
        titleLabel.fontSize = 40
        titleLabel.lineHeight = 48
        titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        titleNode.color = new cc.Color(255, 215, 0)
        var titleOutline = titleNode.addComponent(cc.LabelOutline)
        titleOutline.color = new cc.Color(100, 60, 0)
        titleOutline.width = 3
        titleNode.parent = dialogContainer
        
        // 期号和参赛人数
        var periodNo = data.period_no || "---"
        var totalPlayers = data.total_players || 0
        
        var periodNode = new cc.Node("PeriodNo")
        periodNode.setPosition(0, 220)
        var periodLabel = periodNode.addComponent(cc.Label)
        periodLabel.string = "第" + periodNo + "期赛事结束  共" + totalPlayers + "人参赛"
        periodLabel.fontSize = 24
        periodLabel.lineHeight = 30
        periodLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        periodNode.color = new cc.Color(200, 200, 220)
        periodNode.parent = dialogContainer
        
        // TOP3 领奖台
        var top3 = data.top3 || []
        var podiumY = 40
        var spacingX = 280
        
        // 冠军
        if (top3.length >= 1) {
            this._createPodiumItem(dialogContainer, top3[0], 1, 0, podiumY + 40, 1.15)
        }
        // 亚军
        if (top3.length >= 2) {
            this._createPodiumItem(dialogContainer, top3[1], 2, -spacingX, podiumY, 1.0)
        }
        // 季军
        if (top3.length >= 3) {
            this._createPodiumItem(dialogContainer, top3[2], 3, spacingX, podiumY, 1.0)
        }
        
        // 我的排名区域
        var myRank = data.my_rank || 0
        var myCoin = data.my_match_coin || 0
        
        var myRankContainer = new cc.Node("MyRankContainer")
        myRankContainer.setPosition(0, -200)
        myRankContainer.setContentSize(600, 50)
        
        var myRankBg = new cc.Node("Bg")
        var myRankBgGraphics = myRankBg.addComponent(cc.Graphics)
        myRankBgGraphics.fillColor = new cc.Color(40, 50, 80, 230)
        myRankBgGraphics.roundRect(-300, -25, 600, 50, 12)
        myRankBgGraphics.fill()
        myRankBgGraphics.strokeColor = new cc.Color(100, 120, 160)
        myRankBgGraphics.lineWidth = 2
        myRankBgGraphics.roundRect(-300, -25, 600, 50, 12)
        myRankBgGraphics.stroke()
        myRankBg.parent = myRankContainer
        
        var myRankLabel = new cc.Node("MyRankLabel")
        myRankLabel.setPosition(-140, 0)
        var myRankText = myRankLabel.addComponent(cc.Label)
        myRankText.string = myRank > 0 ? "我的排名：第" + myRank + "名" : "我的排名：未上榜"
        myRankText.fontSize = 22
        myRankText.lineHeight = 28
        myRankText.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        myRankLabel.color = new cc.Color(100, 200, 255)
        myRankLabel.parent = myRankContainer
        
        var myCoinLabel = new cc.Node("MyCoinLabel")
        myCoinLabel.setPosition(140, 0)
        var myCoinText = myCoinLabel.addComponent(cc.Label)
        myCoinText.string = "比赛金币：" + myCoin
        myCoinText.fontSize = 22
        myCoinText.lineHeight = 28
        myCoinText.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        myCoinLabel.color = new cc.Color(255, 200, 100)
        myCoinLabel.parent = myRankContainer
        
        myRankContainer.parent = dialogContainer
        
        // 确认按钮
        var confirmBtn = new cc.Node("ConfirmBtn")
        confirmBtn.setPosition(0, -270)
        confirmBtn.setContentSize(200, 50)
        
        var btnBg = confirmBtn.addComponent(cc.Graphics)
        btnBg.fillColor = new cc.Color(80, 160, 80)
        btnBg.roundRect(-100, -25, 200, 50, 12)
        btnBg.fill()
        btnBg.strokeColor = new cc.Color(120, 200, 120)
        btnBg.lineWidth = 3
        btnBg.roundRect(-100, -25, 200, 50, 12)
        btnBg.stroke()
        
        var btnLabel = new cc.Node("Label")
        var btnLabelText = btnLabel.addComponent(cc.Label)
        btnLabelText.string = "确 定"
        btnLabelText.fontSize = 26
        btnLabelText.lineHeight = 32
        btnLabelText.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        btnLabel.color = new cc.Color(255, 255, 255)
        var btnOutline = btnLabel.addComponent(cc.LabelOutline)
        btnOutline.color = new cc.Color(30, 80, 30)
        btnOutline.width = 2
        btnLabel.parent = confirmBtn
        
        var btn = confirmBtn.addComponent(cc.Button)
        confirmBtn.on('click', function() {
            console.log("🏆 [TournamentFinalRank] 点击确认，返回大厅")
            dialogNode.destroy()
            cc.director.loadScene("hallScene")
        }, this)
        
        confirmBtn.parent = dialogContainer
        
        return dialogNode
    },
    
    /**
     * 🔧【新增】创建领奖台项目
     */
    _createPodiumItem: function(parentNode, playerData, rank, x, y, scale) {
        var node = new cc.Node("PodiumItem_" + rank)
        node.setPosition(x, y)
        node.scale = scale || 1
        
        // 排名标签
        var rankLabelNode = new cc.Node("RankLabel")
        rankLabelNode.setPosition(0, 60)
        var rankLabel = rankLabelNode.addComponent(cc.Label)
        var rankTexts = { 1: "🥇 冠军", 2: "🥈 亚军", 3: "🥉 季军" }
        rankLabel.string = rankTexts[rank] || ("第" + rank + "名")
        rankLabel.fontSize = 22
        rankLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        rankLabelNode.color = rank === 1 ? new cc.Color(255, 215, 0) : new cc.Color(200, 200, 220)
        var rankOutline = rankLabelNode.addComponent(cc.LabelOutline)
        rankOutline.color = new cc.Color(50, 50, 80)
        rankOutline.width = 2
        rankLabelNode.parent = node
        
        // 头像容器
        var avatarSize = rank === 1 ? 70 : 60
        var avatarContainer = new cc.Node("AvatarContainer")
        avatarContainer.setPosition(0, 0)
        avatarContainer.setContentSize(avatarSize, avatarSize)
        
        var avatarBg = new cc.Node("AvatarBg")
        var avatarBgGraphics = avatarBg.addComponent(cc.Graphics)
        avatarBgGraphics.fillColor = new cc.Color(60, 70, 100)
        avatarBgGraphics.circle(0, 0, avatarSize/2 + 2)
        avatarBgGraphics.fill()
        avatarBgGraphics.strokeColor = rank === 1 ? new cc.Color(255, 215, 0) : new cc.Color(150, 150, 180)
        avatarBgGraphics.lineWidth = rank === 1 ? 3 : 2
        avatarBgGraphics.circle(0, 0, avatarSize/2 + 2)
        avatarBgGraphics.stroke()
        avatarBg.parent = avatarContainer
        
        // 🔧【修复】不使用 Mask 组件，直接显示头像（避免遮罩导致的不显示问题）
        // 头像精灵（直接放在容器内）
        var avatarSpriteNode = new cc.Node("AvatarSprite")
        avatarSpriteNode.setPosition(0, 0)
        avatarSpriteNode.setContentSize(avatarSize - 4, avatarSize - 4)
        var avatarSprite = avatarSpriteNode.addComponent(cc.Sprite)
        avatarSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM
        // 🔧【关键修复】显式设置节点颜色为白色，确保图片可见
        avatarSpriteNode.color = new cc.Color(255, 255, 255)
        avatarSpriteNode.parent = avatarContainer
        
        console.log("🖼️ [_createPodiumItem] 创建头像节点, rank:", rank, "avatarUrl:", playerData.avatar)
        
        // 加载头像（🔧【修复】机器人也使用服务端传来的正确头像）
        this._loadAvatarForPodium(avatarSprite, avatarSpriteNode, playerData.avatar, playerData.is_robot, avatarSize - 4)
        
        avatarContainer.parent = node
        
        // 昵称 - 直接使用真实昵称，机器人也一样
        var nameLabelNode = new cc.Node("NameLabel")
        nameLabelNode.setPosition(0, -55)
        nameLabelNode.setContentSize(120, 30)
        var nameLabel = nameLabelNode.addComponent(cc.Label)
        var displayName = playerData.player_name || "玩家"
        // 🔧【修复】机器人也使用真实昵称，不做特殊处理
        
        // 🔧【修复】昵称过长时截断显示，超出部分用"..."
        var maxNameLength = 6  // 最多显示6个字符
        if (displayName.length > maxNameLength) {
            displayName = displayName.substring(0, maxNameLength) + "..."
        }
        
        nameLabel.string = displayName
        nameLabel.fontSize = rank === 1 ? 20 : 18
        nameLabel.lineHeight = 24
        nameLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        nameLabel.overflow = cc.Label.Overflow.CLAMP
        nameLabelNode.color = new cc.Color(255, 255, 255)
        var nameOutline = nameLabelNode.addComponent(cc.LabelOutline)
        nameOutline.color = new cc.Color(30, 30, 50)
        nameOutline.width = 1
        nameLabelNode.parent = node
        
        // 金币
        var coinLabelNode = new cc.Node("CoinLabel")
        coinLabelNode.setPosition(0, -85)
        var coinLabel = coinLabelNode.addComponent(cc.Label)
        coinLabel.string = this._formatMatchCoin(playerData.match_coin || 0) + "金币"
        coinLabel.fontSize = rank === 1 ? 18 : 16
        coinLabel.lineHeight = 20
        coinLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        coinLabelNode.color = rank === 1 ? new cc.Color(255, 215, 0) : new cc.Color(255, 200, 100)
        var coinOutline = coinLabelNode.addComponent(cc.LabelOutline)
        coinOutline.color = new cc.Color(80, 50, 0)
        coinOutline.width = 1
        coinLabelNode.parent = node
        
        node.parent = parentNode
        return node
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
    _loadAvatarForPodium: function(sprite, spriteNode, avatarUrl, isRobot, size) {
        if (!sprite) {
            console.error("🖼️ [_loadAvatarForPodium] sprite 为空，无法加载头像")
            return
        }
        
        console.log("🖼️ [_loadAvatarForPodium] 开始加载头像, URL:", avatarUrl, "isRobot:", isRobot, "size:", size)
        
        var self = this
        var nodeSize = size || 60
        
        // 🔧【关键】设置默认状态，确保节点可见
        if (spriteNode) {
            spriteNode.active = true
            spriteNode.opacity = 255
            spriteNode.color = new cc.Color(255, 255, 255)
        }
        
        // 🔧【修复】统一处理头像加载，不再区分机器人和真人
        // 机器人也使用服务端传来的正确头像URL
        if (!avatarUrl || avatarUrl === "") {
            console.log("🖼️ [_loadAvatarForPodium] 头像URL为空，使用默认头像")
            // 头像URL为空时使用默认头像
            cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(err, spriteFrame) {
                if (!err && spriteFrame && sprite && sprite.isValid) {
                    sprite.spriteFrame = spriteFrame
                    console.log("🖼️ [_loadAvatarForPodium] 默认头像设置成功")
                }
            })
            return
        }
        
        if (avatarUrl.indexOf("http") === 0 || avatarUrl.indexOf("//") === 0) {
            console.log("🖼️ [_loadAvatarForPodium] 加载远程头像...")
            
            // 🔧【修复】使用 cc.assetManager.loadRemote 加载远程图片
            cc.assetManager.loadRemote(avatarUrl, function(err, texture) {
                if (err) {
                    console.error("🖼️ [_loadAvatarForPodium] 加载远程头像失败:", err)
                    // 尝试使用内置头像
                    cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(err2, fallbackSprite) {
                        if (!err2 && fallbackSprite && sprite && sprite.isValid) {
                            sprite.spriteFrame = fallbackSprite
                            console.log("🖼️ [_loadAvatarForPodium] 使用默认头像")
                        }
                    })
                    return
                }
                
                if (!texture) {
                    console.error("🖼️ [_loadAvatarForPodium] texture 为空")
                    return
                }
                
                // 🔧【关键检查】确保 sprite 组件仍然有效
                if (!sprite || !sprite.isValid) {
                    console.warn("🖼️ [_loadAvatarForPodium] sprite 组件已失效，跳过设置")
                    return
                }
                
                console.log("🖼️ [_loadAvatarForPodium] 远程头像加载成功, texture:", texture.width, "x", texture.height)
                
                // 🔧【关键修复】创建 SpriteFrame 并设置
                var spriteFrame = new cc.SpriteFrame(texture)
                
                // 设置 spriteFrame
                sprite.spriteFrame = spriteFrame
                
                // 🔧【关键修复】确保节点尺寸正确
                if (spriteNode && spriteNode.isValid) {
                    spriteNode.setContentSize(nodeSize, nodeSize)
                    spriteNode.opacity = 255
                    spriteNode.active = true
                    console.log("🖼️ [_loadAvatarForPodium] 节点尺寸已设置为:", nodeSize)
                }
                
                // 🔧【关键修复】强制刷新 Sprite 组件
                sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM
                sprite.markForRender()
                
                console.log("🖼️ [_loadAvatarForPodium] 头像设置完成！")
            })
        } else {
            var localPath = "UI/headimage/" + avatarUrl
            console.log("🖼️ [_loadAvatarForPodium] 加载本地头像:", localPath)
            cc.resources.load(localPath, cc.SpriteFrame, function(err, spriteFrame) {
                if (err || !spriteFrame) {
                    console.error("🖼️ [_loadAvatarForPodium] 加载本地头像失败:", err)
                    cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(err2, fallbackSprite) {
                        if (!err2 && fallbackSprite && sprite && sprite.isValid) {
                            sprite.spriteFrame = fallbackSprite
                        }
                    })
                    return
                }
                
                if (sprite && sprite.isValid) {
                    sprite.spriteFrame = spriteFrame
                    console.log("🖼️ [_loadAvatarForPodium] 本地头像设置成功")
                }
            })
        }
    },
    
    /**
     * 🔧【新增】获取机器人显示名称
     */
    _getRobotDisplayName: function(playerId, originalName) {
        if (originalName && originalName.indexOf("智能陪练") === 0) {
            return originalName
        }
        var robotIndex = 1
        if (playerId) {
            var lastChar = playerId.toString().slice(-1)
            robotIndex = parseInt(lastChar) || 1
        }
        return "智能陪练" + robotIndex + "号"
    },
    
    /**
     * 🔧【新增】格式化金币显示
     */
    _formatMatchCoin: function(coin) {
        if (coin >= 10000) {
            return (coin / 10000).toFixed(1) + "万"
        }
        return coin.toString()
    },
    
    /**
     * 隐藏最终榜单弹窗
     */
    _hideArenaFinalRankDialog: function() {
        if (this._arenaFinalRankDialog) {
            this._arenaFinalRankDialog.destroy()
            this._arenaFinalRankDialog = null
        }
    }
});
