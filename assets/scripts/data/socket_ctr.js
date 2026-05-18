/**
 * 斗地主客户端通信层
 * 使用 WebSocket 连接 Go 后端
 * 纯全局变量方式，延迟初始化
 * 支持心跳检测和自动重连
 * 
 * 【彻底修复版本】
 * 核心原则：
 * 1. 服务端数据是唯一数据源
 * 2. 禁止任何数据转换，直接传递服务端原始数据
 * 3. suit: 0=黑桃(♠), 1=红心(♥), 2=梅花(♣), 3=方块(♦), 4=王
 * 4. rank: 3-15=3到2, 16=小王, 17=大王
 */

window.socketCtr = function(){
    var that = {}
    var respone_map = {} 
    var call_index = 0
    var _socket = null
    var event = null  // 延迟初始化
    var _isConnected = false
    var _connectionHasToken = false  // 🔧【新增】跟踪当前连接是否带Token
    var _isReconnecting = false      // 🔧【新增】重连锁，防止重复重连
    var _reconnectPending = false    // 🔧【新增】是否有待处理的重连请求
    var _playerId = ""
    var _playerName = ""
    var _reconnectToken = ""
    var _currentRoomCode = ""  // 当前房间号
    var _isInRoom = false        // 是否在房间中
    
    // ========== 心跳机制 ==========
    var _heartbeatInterval = null      // 心跳定时器
    var _heartbeatTimeout = null       // 心跳超时定时器
    var _heartbeatIntervalMs = 30000   // 🔧【修复】心跳间隔（30秒）- 与服务端 60秒超时协调
    var _heartbeatTimeoutMs = 50000    // 🔧【修复】心跳超时时间（50秒）- 给后台切换更多容错时间
    var _lastHeartbeatTime = 0         // 上次心跳时间
    var _missedHeartbeats = 0          // 连续丢失的心跳次数
    var _maxMissedHeartbeats = 3       // 最大允许丢失的心跳次数
    var _isHeartbeatRunning = false    // 心跳是否在运行
    var _backgroundThresholdMs = 45000 // 🔧【新增】后台时间阈值（45秒），超过此时间才需要检查重连
    
    // ========== 状态监听 ==========
    var _stateListeners = []           // 状态变化监听器列表
    var _connectionState = "disconnected"  // 连接状态: disconnected, connecting, connected
    
    // ========== 快速匹配回调 ==========
    var _quickMatchCallback = null
    var _quickMatchTimeout = null
    
    // 获取服务器地址（生产环境）
    var _serverUrl = "wss://apis.hongxiu88.com/ws"
    if (typeof window !== 'undefined' && window.defines && window.defines.serverUrl) {
        _serverUrl = window.defines.serverUrl
    }
    
    // 确保 event 初始化（使用全局共享的事件实例）
    var _getEvent = function() {
        // 🔧【修复】每次都检查 myglobal.eventlister，确保使用共享实例
        if (window.myglobal && window.myglobal.eventlister) {
            if (event !== window.myglobal.eventlister) {
                event = window.myglobal.eventlister
                console.log("🔧 [socket_ctr] 使用 myglobal.eventlister 共享实例")
            }
        } else if (!event) {
            if (typeof window.eventLister !== 'undefined') {
                event = window.eventLister({})
                console.log("🔧 [socket_ctr] 创建新的事件实例（myglobal 未初始化）")
            } else {
                console.error("eventLister 未定义，请确保 event_lister.js 已作为插件脚本加载")
                return null
            }
        }
        return event
    }

    // 消息类型映射（与 Go 后端保持一致）
    var MessageType = {
        // 客户端请求
        CREATE_ROOM: "create_room",
        JOIN_ROOM: "join_room",
        LEAVE_ROOM: "leave_room",
        QUICK_MATCH: "quick_match",
        READY: "ready",
        CANCEL_READY: "cancel_ready",
        BID: "bid",
        ROB: "rob",
        CALL_LANDLORD: "call_landlord",
        PLAY_CARDS: "play_cards",
        PASS: "pass",
        CHAT: "chat",
        GET_ROOM_LIST: "get_room_list",

        // 游戏阶段控制消息
        READY_START: "ready_start",
        READY_END: "ready_end",
        DEAL_START: "deal_start",
        DEAL_END: "deal_end",
        CALL_LANDLORD_START: "call_landlord_start",
        CALL_LANDLORD_TURN: "call_landlord_turn",
        CALL_LANDLORD_RESULT: "call_landlord_result",
        CALL_LANDLORD_END: "call_landlord_end",
        PLAY_START: "play_start",
        PLAY_END: "play_end",
        SETTLEMENT_START: "settlement_start",
        SETTLEMENT_END: "settlement_end",

        // 服务端响应
        CONNECTED: "connected",
        ROOM_CREATED: "room_created",
        ROOM_JOINED: "room_joined",
        PLAYER_JOINED: "player_joined",
        PLAYER_LEFT: "player_left",
        PLAYER_READY: "player_ready",
        MATCH_FOUND: "match_found",
        GAME_START: "game_start",
        DEAL_CARDS: "deal_cards",
        BID_TURN: "bid_turn",
        BID_RESULT: "bid_result",
        ROB_TURN: "rob_turn",
        ROB_RESULT: "rob_result",
        LANDLORD: "landlord",
        LANDLORD_CARDS: "landlord_cards",  // 🔧【新增】地主新手牌消息
        PLAY_TURN: "play_turn",
        CARD_PLAYED: "card_played",
        PLAYER_PASS: "player_pass",
        GAME_OVER: "game_over",
        ERROR: "error",
        FORCE_LOGOUT: "force_logout",
        ROOM_LIST_RESULT: "room_list_result",
        ROOM_LIST_UPDATE: "room_list_update",
        PING: "ping",
        PONG: "pong",

        // 提示功能
        HINT_REQUEST: "hint_request",
        HINT_RESULT: "hint_result",

        // ============================================================
        // 【竞技场】相关消息类型
        // ============================================================
        ARENA_STATUS: "arena_status",             // 竞技场状态推送（期号、倒计时）
        ARENA_MATCH_START: "arena_match_start",   // 🔧【新增】竞技场比赛开始通知
        ARENA_CLOSE_DIALOG: "arena_close_dialog", // 🔧【新增】竞技场关闭弹窗通知
        COMPETITION_STATUS: "competition_status",
        COMPETITION_COUNTDOWN: "competition_countdown",
        MATCH_COIN_UPDATE: "match_coin_update",
        COMPETITION_ELIMINATED: "competition_eliminated",
        COMPETITION_ADVANCE: "competition_advance",
        COMPETITION_CHAMPION: "competition_champion",
        
        // 🔧【新增】竞技场轮次倒计时消息
        ARENA_ROUND_COUNTDOWN: "arena_round_countdown",  // 竞技场轮次倒计时开始
        ARENA_COUNTDOWN_TICK: "arena_countdown_tick",      // 竞技场倒计时每秒更新
        ARENA_AUTO_READY: "arena_auto_ready",              // 竞技场自动准备通知
        ARENA_RECONNECT_STATE: "arena_reconnect_state",     // 竞技场断线重连状态恢复

        // 🔧【新增】竞技场多桌等待和决赛排行榜
        TOURNAMENT_WAIT_PROGRESS: "tournament_wait_progress",  // 等待进度广播
        TOURNAMENT_ROUND_ADVANCE: "tournament_round_advance",  // 下一轮通知
        TOURNAMENT_FINAL_RANK: "tournament_final_rank",        // 最终榜单

        // 🔧【新增】竞技场等待阶段（玩家点击进入后的等待界面）
        ARENA_WAITING_STATUS: "arena_waiting_status",    // 等待阶段状态推送
        ARENA_WAITING_TICK: "arena_waiting_tick",        // 等待阶段倒计时更新
        ARENA_ASSIGN_START: "arena_assign_start",       // 分配阶段开始
        ARENA_CHAMPION_BROADCAST: "arena_champion_broadcast", // 🏆 冠军跑马灯广播

        // 🔧【新增】竞技场玩家加入广播（玩家点击进入后广播给所有本期玩家）
        ARENA_PLAYER_JOINED: "arena_player_joined",     // 玩家加入等待场景广播

        // 🔧【新增】竞技场淘汰踢出通知
        ARENA_ELIMINATED_KICK: "arena_eliminated_kick", // 被淘汰踢出房间通知

        // 🔧【新增】竞技场报名相关消息类型
        ARENA_SIGNUP: "arena_signup",                   // 竞技场报名请求
        ARENA_CANCEL_SIGNUP: "arena_cancel_signup",     // 取消报名请求
        ARENA_SIGNUP_SUCCESS: "arena_signup_success",   // 报名成功响应
        ARENA_SIGNUP_FAILED: "arena_signup_failed",     // 报名失败响应
        ARENA_CANCEL_SUCCESS: "arena_cancel_success",   // 取消报名成功响应
        ARENA_CANCEL_FAILED: "arena_cancel_failed",     // 取消报名失败响应
    }

    // 发送消息
    var _sendmsg = function(type, data, callindex){
        console.log("📤 [_sendmsg] 准备发送消息, type=" + type + ", readyState=" + (_socket ? _socket.readyState : "null"));
        if (!_socket || _socket.readyState !== WebSocket.OPEN) {
            console.error("❌ [_sendmsg] WebSocket 未连接，无法发送消息: " + type)
            return
        }
        var msg = {
            type: type,
            payload: data || {},
            callIndex: callindex || null
        }
        console.log("📤 [_sendmsg] 发送消息: " + JSON.stringify(msg))
        _socket.send(JSON.stringify(msg))
    }

    // 请求（带回调）
    var _request = function(type, data, callback){
        call_index++ 
        respone_map[call_index] = callback
        _sendmsg(type, data, call_index)
    }

    // 处理服务端消息
    var _handleMessage = function(msgData){
        // console.log("📨 [WebSocket] 收到消息:", JSON.stringify(msgData))  // 已禁用调试日志
        
        var evt = _getEvent()
        if (!evt) return
        
        var type = msgData.type
        var data = msgData.payload || msgData.data || {}
        var callIndex = msgData.callIndex
        
        // console.log("📨 [WebSocket] 消息类型:", type, "callIndex:", callIndex)  // 已禁用调试日志
        
        // 设置房间状态
        if (type === MessageType.ROOM_JOINED || type === MessageType.ROOM_CREATED) {
            _currentRoomCode = data.room_code
            _isInRoom = true
        }
        
        // 处理回调
        if (callIndex && respone_map[callIndex]) {
            var callback = respone_map[callIndex]
            callback(msgData.result || 0, data)
            delete respone_map[callIndex]
            return
        }
        
        // 处理服务端推送的消息
        switch(type){
            case MessageType.CONNECTED:
                console.log("✅ [socket_ctr] 收到 connected 消息, player_id:", data.player_id, "player_name:", data.player_name)
                _playerId = data.player_id
                _playerName = data.player_name
                _reconnectToken = data.reconnect_token
                _isConnected = true
                _setConnectionState("connected")
                if (window.myglobal && window.myglobal.playerData) {
                    window.myglobal.playerData.serverPlayerId = data.player_id
                }
                _startHeartbeat()
                console.log("✅ [socket_ctr] 连接认证成功, _playerId =", _playerId, "isAuthenticated =", that.isAuthenticated())
                evt.fire("connection_success", data)
                break
                
            case "reconnected":
                _playerId = data.player_id
                _playerName = data.player_name
                _isConnected = true
                _setConnectionState("connected")
                if (window.myglobal && window.myglobal.playerData) {
                    window.myglobal.playerData.serverPlayerId = data.player_id
                }
                _startHeartbeat()
                if (data.game_state) {
                    _currentRoomCode = data.room_code
                    _isInRoom = true
                    evt.fire("game_state_restore", {
                        room_code: data.room_code,
                        player_id: data.player_id,
                        player_name: data.player_name,
                        game_state: data.game_state
                    })
                } else if (data.room_code) {
                    _currentRoomCode = data.room_code
                    _isInRoom = true
                    evt.fire("room_restored", data)
                } else {
                    evt.fire("connection_success", data)
                }
                // 🔧【关键修复】重连成功后请求竞技场状态，确保不会错过弹窗
                console.log("🏟️ [Reconnect] 重连成功，延迟请求竞技场状态...")
                setTimeout(function() {
                    if (that.requestArenaStatus) {
                        that.requestArenaStatus()
                    }
                }, 500)
                break
                
            case MessageType.ROOM_CREATED:
                if (data.player && data.player.id) {
                    _playerId = data.player.id
                    _playerName = data.player.name || _playerName
                    if (window.myglobal && window.myglobal.playerData) {
                        window.myglobal.playerData.serverPlayerId = data.player.id
                    }
                }
                evt.fire("room_created", data)
                break
                
            case MessageType.ROOM_JOINED:
                console.log("🏠 [socket_ctr] ROOM_JOINED 原始数据:", JSON.stringify(data))
                // 🔧【调试】打印金币数据
                if (data.players) {
                    console.log("🏠 [socket_ctr] ROOM_JOINED players 金币数据:")
                    for (var i = 0; i < data.players.length; i++) {
                        console.log("   玩家", i, ":", data.players[i].name, "gold_count=", data.players[i].gold_count)
                    }
                }
                if (data.player) {
                    console.log("🏠 [socket_ctr] ROOM_JOINED 当前玩家:", data.player.name, "gold_count=", data.player.gold_count)
                }
                if (data.player && data.player.id) {
                    _playerId = data.player.id
                    _playerName = data.player.name || _playerName
                    if (window.myglobal && window.myglobal.playerData) {
                        window.myglobal.playerData.serverPlayerId = data.player.id
                    }
                }
                // 🔧【修复】触发快速匹配回调
                _handleQuickMatchResponse(data)
                evt.fire("room_joined", data)
                break
                
            case MessageType.PLAYER_JOINED:
                console.log("🚪 [socket_ctr] PLAYER_JOINED 原始数据:", JSON.stringify(data))
                var playerData = {
                    accountid: data.player ? data.player.id : "",
                    nick_name: data.player ? data.player.name : "",
                    avatarUrl: data.player ? (data.player.avatar || "avatar_1") : "avatar_1",  // 🔧【修复】使用服务端发送的头像
                    gold_count: data.player ? data.player.gold_count : 0,  // 🔧【修复】使用服务端发送的金币数量
                    goldcount: data.player ? data.player.gold_count || 0 : 0,  // 兼容旧客户端
                    match_coin: data.player ? (data.player.match_coin || 0) : 0, // 🔧【新增】竞技币
                    seatindex: data.player ? data.player.seat + 1 : 1,
                    isready: data.player ? data.player.ready : false
                }
                console.log("🚪 [socket_ctr] PLAYER_JOINED 转换后数据:", JSON.stringify(playerData))
                evt.fire("player_joinroom_notify", playerData)
                break
                
            case MessageType.PLAYER_LEFT:
                evt.fire("player_left", data)
                break
                
            case MessageType.PLAYER_READY:
                evt.fire("player_ready_notify", data)
                break
                
            case MessageType.MATCH_FOUND:
                evt.fire("match_found", data)
                break
                
            case MessageType.ROOM_LIST_RESULT:
                evt.fire("room_list_result", data)
                break
                
            case MessageType.ROOM_LIST_UPDATE:
                evt.fire("room_list_update", data)
                break
                
            case MessageType.GAME_START:
                evt.fire("gameStart_notify", data)
                break

            // ============================================================
            // 【核心】发牌消息 - 直接传递服务端原始数据，禁止转换
            // ============================================================
            case MessageType.DEAL_CARDS:
                // 【重要】直接传递服务端数据，不做任何转换！
                evt.fire("pushcard_notify", {
                    cards: data.cards || [],
                    bottom_cards: data.bottom_cards || []
                })
                break

            case MessageType.CALL_LANDLORD_START:
                evt.fire("call_landlord_start_notify", data)
                break

            case MessageType.CALL_LANDLORD_TURN:
                evt.fire("call_landlord_turn_notify", {
                    player_id: data.player_id,
                    player_name: data.player_name,
                    timeout: data.timeout || 15,
                    round: data.round || 1,
                    turn_index: data.turn_index || 1,
                    expires_at: data.expires_at || 0  // 🔧【新增】服务端过期时间戳（毫秒）
                })
                if (data.round === 1) {
                    evt.fire("bid_turn_notify", {
                        player_id: data.player_id,
                        timeout: data.timeout || 15
                    })
                } else {
                    evt.fire("canrob_notify", {
                        player_id: data.player_id,
                        timeout: data.timeout || 15
                    })
                }
                break

            case MessageType.CALL_LANDLORD_RESULT:
                // 🔧【修复】添加 gender 和 order 字段用于音效播放
                evt.fire("call_landlord_result_notify", {
                    player_id: data.player_id,
                    player_name: data.player_name,
                    action: data.action,
                    round: data.round,
                    turn_index: data.turn_index,
                    gender: data.gender || "male",      // 🔧【新增】性别
                    order: data.order || 1              // 🔧【新增】轮次内顺序
                })
                if (data.round === 1) {
                    evt.fire("bid_result_notify", {
                        accountid: data.player_id,
                        state: data.action === "call"
                    })
                } else {
                    evt.fire("canrob_state_notify", {
                        accountid: data.player_id,
                        state: data.action === "call"
                    })
                }
                break

            case MessageType.CALL_LANDLORD_END:
                evt.fire("call_landlord_end_notify", data)
                // 【重要】直接传递服务端底牌数据
                evt.fire("change_master_notify", data.landlord_id)
                evt.fire("change_showcard_notify", {
                    cards: data.bottom_cards || []
                })
                break

            case "restart_game":
                evt.fire("restart_game_notify", data)
                break

            case MessageType.CARD_PLAYED:
                // 【重要】直接传递服务端数据，包含 gender、hand_type、rank、is_new_round、can_beat
                evt.fire("other_chucard_notify", {
                    accountid: data.player_id,
                    cards: data.cards || [],
                    cards_left: data.cards_left,
                    hand_type: data.hand_type || "",
                    rank: data.rank || 0,
                    gender: data.gender || "male",
                    is_new_round: data.is_new_round || false,  // 🔧【新增】是否是新回合（首出）
                    can_beat: data.can_beat || false            // 🔧【新增】是否压过上家
                })
                break

            case MessageType.LANDLORD:
                evt.fire("change_master_notify", data.player_id)
                evt.fire("change_showcard_notify", {
                    cards: data.bottom_cards || []
                })
                break

            // 🔧【新增】地主新手牌消息 - 只更新地主的手牌，不触发重新发牌
            // 🔧【关键】包含地主ID，客户端必须验证自己是否是地主
            case MessageType.LANDLORD_CARDS:
                evt.fire("landlord_cards_notify", {
                    landlord_id: data.landlord_id || "",
                    landlord_name: data.landlord_name || "",
                    cards: data.cards || [],
                    bottom_cards: data.bottom_cards || []
                })
                break
                
            case MessageType.PLAY_TURN:
                evt.fire("can_chu_card_notify", {
                    player_id: data.player_id,
                    timeout: data.timeout || 15,
                    must_play: data.must_play || false,
                    can_beat: data.can_beat || false
                })
                break

            case MessageType.BID_TURN:
                evt.fire("bid_turn_notify", {
                    player_id: data.player_id,
                    timeout: data.timeout || 15
                })
                break

            case MessageType.BID_RESULT:
                evt.fire("bid_result_notify", {
                    accountid: data.player_id,
                    state: data.bid
                })
                break

            case MessageType.ROB_TURN:
                evt.fire("canrob_notify", {
                    player_id: data.player_id,
                    timeout: data.timeout || 15
                })
                break

            case MessageType.ROB_RESULT:
                evt.fire("canrob_state_notify", {
                    accountid: data.player_id,
                    state: data.rob
                })
                break

            case MessageType.PLAY_START:
                evt.fire("play_start_notify", {
                    landlord_id: data.landlord_id
                })
                break
                
            case MessageType.PLAYER_PASS:
                evt.fire("other_chucard_notify", {
                    accountid: data.player_id,
                    cards: [],
                    is_pass: true,
                    gender: data.gender || "male"
                })
                break
                
            case MessageType.GAME_OVER:
                evt.fire("game_over", data)
                break
                
            case MessageType.ERROR:
                console.error("服务器错误:", data.message)
                evt.fire("error", data)
                break
                
            case MessageType.FORCE_LOGOUT:
                console.warn("🚫 收到强制下线通知:", data)
                _handleForceLogout(data)
                break
                
            case MessageType.PONG:
                _onHeartbeatAck(data)
                break
                
            case "player_offline":
                evt.fire("player_offline_notify", {
                    player_id: data.player_id,
                    player_name: data.player_name,
                    timeout: data.timeout || 0
                })
                break
                
            case "player_online":
                evt.fire("player_online_notify", {
                    player_id: data.player_id,
                    player_name: data.player_name
                })
                break
            
            // 🔧【托管】托管状态变化通知
            case "trustee_state":
                evt.fire("trustee_state_notify", {
                    player_id: data.player_id,
                    player_name: data.player_name,
                    is_trustee: data.is_trustee,
                    reason: data.reason
                })
                break

            // 提示结果消息
            case MessageType.HINT_RESULT:
                evt.fire("hint_result_notify", data)
                break

            // ============================================================
            // 【竞技场】消息处理
            // ============================================================

            // 竞技场大厅状态推送（期号、倒计时）
            case MessageType.ARENA_STATUS:
                console.log("🏟️ [Arena] 收到 arena_status 消息, arenas 数量:", data.arenas ? data.arenas.length : 0)
                evt.fire("arena_status_notify", data)
                break

            // 🔧【新增】竞技场比赛开始通知
            case MessageType.ARENA_MATCH_START:
                console.log("🏆 [Arena] 收到 arena_match_start 消息:", JSON.stringify(data))
                evt.fire("arena_match_start_notify", {
                    period_no: data.period_no || "",
                    room_id: data.room_id || 0,
                    room_name: data.room_name || "",
                    room_config_id: data.room_config_id || 0,
                    signup_fee: data.signup_fee || 0,
                    total_players: data.total_players || 0,
                    match_duration: data.match_duration || 0,
                    match_rounds: data.match_rounds || 0,
                    countdown: data.countdown || 10,
                    message: data.message || ""
                })
                break

            // 🔧【新增】竞技场关闭弹窗通知（新期号开始时关闭上一轮弹窗）
            case MessageType.ARENA_CLOSE_DIALOG:
                evt.fire("arena_close_dialog_notify", {
                    room_id: data.room_id || 0,
                    period_no: data.period_no || "",
                    reason: data.reason || "",
                    message: data.message || ""
                })
                break

            // 竞技场状态更新
            case MessageType.COMPETITION_STATUS:
                evt.fire("competition_status_notify", data)
                break
                
            // 竞技场倒计时
            case MessageType.COMPETITION_COUNTDOWN:
                evt.fire("competition_countdown_notify", {
                    countdown: data.countdown || 15,
                    message: data.message || ""
                })
                break
                
            // 比赛金币更新
            case MessageType.MATCH_COIN_UPDATE:
                evt.fire("match_coin_update_notify", {
                    player_id: data.player_id,
                    match_coin: data.match_coin || 0,
                    delta: data.delta || 0
                })
                break
                
            // 淘汰通知
            case MessageType.COMPETITION_ELIMINATED:
                evt.fire("competition_eliminated_notify", {
                    rank: data.rank || 0,
                    reason: data.reason || "",
                    total_players: data.total_players || 0,
                    rewards: data.rewards || null
                })
                break
                
            // 晋级通知
            case MessageType.COMPETITION_ADVANCE:
                evt.fire("competition_advance_notify", {
                    current_round: data.current_round || 0,
                    total_rounds: data.total_rounds || 0,
                    match_coin: data.match_coin || 0,
                    message: data.message || ""
                })
                break
                
            // 冠军弹窗
            case MessageType.COMPETITION_CHAMPION:
                evt.fire("competition_champion_notify", {
                    rank: 1,
                    rewards: data.rewards || null,
                    reward_type: data.reward_type || "virtual",  // virtual 或 physical
                    rankings: data.rankings || [],
                    match_coin: data.match_coin || 0
                })
                break
            
            // 🔧【新增】竞技场轮次倒计时消息处理
            case MessageType.ARENA_ROUND_COUNTDOWN:
                evt.fire("arena_round_countdown_notify", {
                    seconds: data.seconds || 30,
                    round: data.round || 1,
                    period_no: data.period_no || "",
                    room_id: data.room_id || 0,
                    message: data.message || ""
                })
                break
            
            case MessageType.ARENA_COUNTDOWN_TICK:
                evt.fire("arena_countdown_tick_notify", {
                    seconds: data.seconds || 0,
                    period_no: data.period_no || "",
                    room_id: data.room_id || 0
                })
                break
            
            case MessageType.ARENA_AUTO_READY:
                evt.fire("arena_auto_ready_notify", {
                    period_no: data.period_no || "",
                    room_id: data.room_id || 0,
                    message: data.message || "系统已自动准备"
                })
                break
            
            case MessageType.ARENA_RECONNECT_STATE:
                evt.fire("arena_reconnect_state_notify", {
                    phase: data.phase || "",
                    period_no: data.period_no || "",
                    room_id: data.room_id || 0,
                    round: data.round || 0,
                    countdown: data.countdown || 0,
                    message: data.message || ""
                })
                break

            // ============================================================
            // 【新增】竞技场多桌等待和决赛排行榜消息处理
            // ============================================================

            // 等待进度广播
            case MessageType.TOURNAMENT_WAIT_PROGRESS:
                evt.fire("tournament_wait_progress_notify", {
                    period_no: data.period_no || "",
                    round: data.round || 1,
                    total_rounds: data.total_rounds || 1,
                    finished_tables: data.finished_tables || 0,
                    total_tables: data.total_tables || 0,
                    player_table_done: data.player_table_done || false,
                    message: data.message || ""
                })
                break

            // 下一轮通知
            case MessageType.TOURNAMENT_ROUND_ADVANCE:
                evt.fire("tournament_round_advance_notify", {
                    period_no: data.period_no || "",
                    new_round: data.new_round || 1,
                    total_rounds: data.total_rounds || 1,
                    message: data.message || ""
                })
                break

            // 最终榜单
            case MessageType.TOURNAMENT_FINAL_RANK:
                evt.fire("tournament_final_rank_notify", {
                    period_no: data.period_no || "",
                    total_players: data.total_players || 0,
                    top3: data.top3 || [],
                    top20: data.top20 || [],
                    my_rank: data.my_rank || 0,
                    my_match_coin: data.my_match_coin || 0,
                    message: data.message || ""
                })
                break

            // ============================================================
            // 【新增】竞技场等待阶段消息处理（玩家点击进入后的等待界面）
            // ============================================================

            // 等待阶段状态推送
            case MessageType.ARENA_WAITING_STATUS:
                // 🔧【关键修复】countdown 可能是 0，不能使用 || 运算符
                var countdownValue = (data.countdown !== undefined && data.countdown !== null) ? data.countdown : 60;
                console.log("🏟️ [Arena] 收到等待状态推送，服务端倒计时=" + data.countdown + "，使用值=" + countdownValue);
                
                var waitingStatusData = {
                    period_no: data.period_no || "",
                    room_id: data.room_id || 0,
                    room_name: data.room_name || "",
                    phase: data.phase || "waiting",
                    countdown: countdownValue,  // 🔧【关键修复】使用正确的值
                    start_time: data.start_time || 0,
                    total_players: data.total_players || 0,
                    entered_players: data.entered_players || 0,
                    players: data.players || [],
                    message: data.message || ""
                }
                
                // 🔧【修复】缓存数据到全局变量，确保场景切换后数据不丢失
                if (window.myglobal) {
                    window.myglobal.arenaWaitingStatusCache = waitingStatusData
                    console.log("🏟️ [Arena] 缓存等待状态数据，玩家数量:", data.players ? data.players.length : 0)
                }
                
                evt.fire("arena_waiting_status_notify", waitingStatusData)
                break

            // 等待阶段倒计时更新
            case MessageType.ARENA_WAITING_TICK:
                // 🔧【关键修复】countdown 可能是 0，不能使用 || 运算符
                var tickCountdown = (data.countdown !== undefined && data.countdown !== null) ? data.countdown : 0;
                console.log("🏟️ [Arena] 收到倒计时更新，服务端倒计时=" + tickCountdown);
                evt.fire("arena_waiting_tick_notify", {
                    period_no: data.period_no || "",
                    room_id: data.room_id || 0,
                    countdown: tickCountdown,
                    entered_players: data.entered_players || 0
                })
                break

            // 分配阶段开始
            case MessageType.ARENA_ASSIGN_START:
                evt.fire("arena_assign_start_notify", {
                    period_no: data.period_no || "",
                    room_id: data.room_id || 0,
                    total_players: data.total_players || 0,
                    total_tables: data.total_tables || 0,
                    countdown: data.countdown || 10,
                    message: data.message || ""
                })
                break
                
            // 🏆 冠军跑马灯广播
            case MessageType.ARENA_CHAMPION_BROADCAST:
                console.log("🏆 [Arena] 收到冠军跑马灯广播:", JSON.stringify(data));
                evt.fire("arena_champion_broadcast_notify", {
                    period_no: data.period_no || "",
                    room_id: data.room_id || 0,
                    room_name: data.room_name || "竞技场",
                    champion_id: data.champion_id || 0,
                    champion_name: data.champion_name || "",
                    champion_avatar: data.champion_avatar || "",
                    runner_up_name: data.runner_up_name || "",
                    third_name: data.third_name || "",
                    total_players: data.total_players || 0,
                    match_coin: data.match_coin || 0,
                    message: data.message || "",
                    timestamp: data.timestamp || 0
                })
                break

            // 🔧【新增】玩家加入等待场景广播
            case MessageType.ARENA_PLAYER_JOINED:
                console.log("🏟️ [Arena] 收到玩家加入广播:", JSON.stringify(data));
                var playerJoinedData = {
                    period_no: data.period_no || "",
                    room_id: data.room_id || 0,
                    player: data.player || {},
                    entered_players: data.entered_players || 0,
                    total_players: data.total_players || 0,
                    players: data.players || [],
                    message: data.message || ""
                };
                
                // 🔧【修复】同样缓存到 arenaWaitingStatusCache，确保场景创建时能获取最新数据
                if (window.myglobal) {
                    // 合并更新：更新 players 列表和计数
                    if (window.myglobal.arenaWaitingStatusCache) {
                        window.myglobal.arenaWaitingStatusCache.players = playerJoinedData.players;
                        window.myglobal.arenaWaitingStatusCache.entered_players = playerJoinedData.entered_players;
                        window.myglobal.arenaWaitingStatusCache.total_players = playerJoinedData.total_players;
                        console.log("🏟️ [Arena] 更新缓存数据，玩家数量:", playerJoinedData.players.length);
                    } else {
                        // 如果缓存不存在，创建一个新的缓存
                        window.myglobal.arenaWaitingStatusCache = {
                            period_no: playerJoinedData.period_no,
                            room_id: playerJoinedData.room_id,
                            players: playerJoinedData.players,
                            entered_players: playerJoinedData.entered_players,
                            total_players: playerJoinedData.total_players,
                            message: playerJoinedData.message
                        };
                        console.log("🏟️ [Arena] 创建缓存数据，玩家数量:", playerJoinedData.players.length);
                    }
                }
                
                evt.fire("arena_player_joined_notify", playerJoinedData)
                break

            // ============================================================
            // 【新增】竞技场淘汰踢出房间通知
            // ============================================================
            case MessageType.ARENA_ELIMINATED_KICK:
                console.log("🚪 [Arena] 收到淘汰踢出通知:", JSON.stringify(data));
                // 🔧【关键】清除房间状态
                _currentRoomCode = ""
                _isInRoom = false
                // 触发事件，让 UI 显示被淘汰提示
                evt.fire("arena_eliminated_kick_notify", {
                    period_no: data.period_no || "",
                    player_id: data.player_id || "",
                    message: data.message || "您已被淘汰，即将离开房间"
                })
                break

            // ============================================================
            // 【新增】竞技场报名响应处理
            // ============================================================

            // 报名成功响应
            case MessageType.ARENA_SIGNUP_SUCCESS:
                console.log("🏟️ [Arena] 报名成功:", JSON.stringify(data));
                evt.fire("arena_signup_success_notify", {
                    period_no: data.period_no || "",
                    room_id: data.room_id || 0,
                    signup_fee: data.signup_fee || 0,
                    balance_after: data.balance_after || 0,
                    signup_time: data.signup_time || Date.now()
                })
                break

            // 报名失败响应
            case MessageType.ARENA_SIGNUP_FAILED:
                console.log("🏟️ [Arena] 报名失败:", JSON.stringify(data));
                evt.fire("arena_signup_failed_notify", {
                    code: data.code || 0,
                    message: data.message || "报名失败"
                })
                break

            // 取消报名成功响应
            case MessageType.ARENA_CANCEL_SUCCESS:
                console.log("🏟️ [Arena] 取消报名成功:", JSON.stringify(data));
                evt.fire("arena_cancel_success_notify", {
                    period_no: data.period_no || "",
                    room_id: data.room_id || 0,
                    refund_amount: data.refund_amount || 0,
                    balance_after: data.balance_after || 0
                })
                break

            // 取消报名失败响应
            case MessageType.ARENA_CANCEL_FAILED:
                console.log("🏟️ [Arena] 取消报名失败:", JSON.stringify(data));
                evt.fire("arena_cancel_failed_notify", {
                    code: data.code || 0,
                    message: data.message || "取消报名失败"
                })
                break
            
            default:
                evt.fire(type, data)
        }
    }

    // ============================================================
    // 【已删除】_convertCards 函数
    // 服务端数据是唯一数据源，禁止任何转换！
    // ============================================================
    
    // 转换客户端卡牌格式为后端格式（用于出牌请求）
    var _convertClientCardsToServer = function(clientCards){
        return clientCards.map(function(card){
            var cardData = card.card_data || card
            return {
                suit: cardData.suit || 0,
                rank: cardData.rank || 0,
                color: cardData.color || 0
            }
        })
    }
        
    // 初始化 WebSocket 连接
    that.initSocket = function(){
        var evt = _getEvent()
        if (!evt) {
            console.error("无法初始化 WebSocket：eventLister 未定义")
            return
        }
        
        // 🔧【关键修复】检查是否有Token
        var myglobal = window.myglobal
        var hasToken = myglobal && myglobal.playerData && myglobal.playerData.token
        
        // 🔧【新增】重连锁检查 - 防止重复重连
        if (_isReconnecting) {
            console.log("🔧 [initSocket] 正在重连中，跳过本次请求（设置pending标记）")
            _reconnectPending = true
            return
        }
        
        // 🔧【修复】正确判断是否需要重新连接
        // 情况1: 已连接且当前连接有Token -> 跳过
        // 情况2: 已连接但没有Token，现在有Token了 -> 需要重连
        // 情况3: 已连接但没有Token，现在也没有 -> 跳过
        if (_isConnected) {
            if (_connectionHasToken) {
                console.log("🔧 [initSocket] 已连接且当前连接带Token，跳过重新连接")
                return
            }
            // 当前连接没有Token
            if (hasToken) {
                console.log("🔧 [initSocket] 当前连接无Token，但现在有Token了，需要重新连接")
                // 不return，继续执行建立新连接
            } else {
                console.log("🔧 [initSocket] 已连接且无Token，保持现有连接")
                return
            }
        }
        
        // 设置重连锁
        _isReconnecting = true
        
        // 如果要建立新连接，先关闭旧连接
        if (_socket && (_socket.readyState === WebSocket.OPEN || _socket.readyState === WebSocket.CONNECTING)) {
            console.log("🔧 [initSocket] 关闭旧连接...")
            _stopHeartbeat()
            
            // 🔧【关键修复】等待 onclose 回调后再创建新连接
            var oldSocket = _socket
            oldSocket.onclose = function(event) {
                console.log("🔧 [initSocket] 旧连接已关闭，开始建立新连接")
                _socket = null
                _isConnected = false
                _connectionHasToken = false
                _createNewWebSocket(hasToken, evt)
            }
            oldSocket.close()
            return  // 等待 onclose 回调
        }
        
        // 没有旧连接，直接创建新连接
        _createNewWebSocket(hasToken, evt)
    }
    
    // 🔧【新增】创建新的 WebSocket 连接（从 initSocket 提取出来）
    var _createNewWebSocket = function(hasToken, evt) {
        var myglobal = window.myglobal
        
        _setConnectionState("connecting")
        
        var wsUrl = _serverUrl
        if (wsUrl.indexOf("ws://") !== 0 && wsUrl.indexOf("wss://") !== 0) {
            wsUrl = "ws://" + wsUrl + "/ws"
        }
        
        if (hasToken) {
            var separator = wsUrl.indexOf("?") > 0 ? "&" : "?"
            wsUrl = wsUrl + separator + "token=" + encodeURIComponent(myglobal.playerData.token)
            console.log("🔧 [initSocket] 连接时带上Token: " + myglobal.playerData.token.substring(0, 10) + "...")
        } else {
            console.log("⚠️ [initSocket] 没有Token，将建立未认证连接")
        }
        
        
        try {
            _socket = new WebSocket(wsUrl)
            
            _socket.onopen = function(){
                _isConnected = true
                _connectionHasToken = hasToken  // 🔧【新增】记录当前连接是否带Token
                _isReconnecting = false         // 🔧【新增】重置重连锁
                _reconnectPending = false       // 🔧【新增】重置pending标记
                _setConnectionState("connected")
                console.log("🔧 [initSocket] WebSocket 已连接, _connectionHasToken =", _connectionHasToken)
                // 使用 setTimeout 确保 WebSocket 完全准备好后再发送
                setTimeout(function(){
                    if (_socket && _socket.readyState === WebSocket.OPEN) {
                        var initMsg = {
                            type: "ping",
                            data: { timestamp: Date.now() }
                        }
                        _socket.send(JSON.stringify(initMsg))
                    }
                }, 0)
            }
            
            _socket.onmessage = function(evt){
                try {
                    if (evt.data instanceof Blob) {
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            try {
                                var text = e.target.result;
                                if (text.trim().charAt(0) === '{') {
                                    var msgData = JSON.parse(text);
                                    _handleMessage(msgData);
                                }
                            } catch(e) {}
                        };
                        reader.readAsText(evt.data);
                    } else {
                        var msgData = JSON.parse(evt.data);
                        _handleMessage(msgData);
                    }
                } catch(e) {
                    console.error("解析消息失败:", e)
                }
            }
            
            _socket.onerror = function(error){
                console.error("WebSocket 错误:", error)
                _isReconnecting = false  // 🔧【新增】重置重连锁
                _setConnectionState("disconnected")
                evt.fire("connection_error", error)
                
                // 🔧【新增】如果有pending请求，尝试重新连接
                if (_reconnectPending) {
                    _reconnectPending = false
                    setTimeout(function() {
                        that.initSocket()
                    }, 100)
                }
            }
            
            _socket.onclose = function(event){
                _isConnected = false
                _connectionHasToken = false  // 🔧【新增】连接关闭时重置
                _isReconnecting = false      // 🔧【新增】重置重连锁
                _setConnectionState("disconnected")
                _stopHeartbeat()
                evt.fire("connection_closed", event)
                
                // 🔧【新增】如果有pending请求，尝试重新连接
                if (_reconnectPending) {
                    _reconnectPending = false
                    setTimeout(function() {
                        that.initSocket()
                    }, 100)
                }
            }
        } catch(e) {
            console.error("创建 WebSocket 失败:", e)
            _isReconnecting = false  // 🔧【新增】重置重连锁
            _setConnectionState("disconnected")
        }
    }

    // ========== 登录相关 ==========
    
    that.request_wxLogin = function(req, callback){
        var evt = _getEvent()
        if (!evt) return
        if (_isConnected) {
            callback && callback(0, { player_id: _playerId, player_name: _playerName })
        } else {
            evt.on("connection_success", function(data){
                callback && callback(0, data)
            })
        }
    }

    // ========== 房间相关 ==========
    
    that.request_creatroom = function(req, callback){
        _request(MessageType.CREATE_ROOM, {}, function(result, data){
            callback && callback(result, {
                roomid: data.room_code,
                bottom: 100,
                rate: 1
            })
        })
    }

    that.request_jion = function(req, callback){
        _request(MessageType.JOIN_ROOM, { room_code: req.roomid }, function(result, data){
            if (result === 0) {
                callback && callback(0, { roomid: data.room_code, bottom: 100, rate: 1, gold: 1000 })
            } else {
                callback && callback(-1, {})
            }
        })
    }

    // 🔧【修复】快速匹配请求 - 通过监听 room_joined 事件获取结果
    that.request_enter_room = function(req, callback){
        // 保存回调
        _quickMatchCallback = callback
        
        // 清除之前的超时
        if (_quickMatchTimeout) {
            clearTimeout(_quickMatchTimeout)
        }
        
        // 设置超时（15秒）
        _quickMatchTimeout = setTimeout(function() {
            if (_quickMatchCallback) {
                var cb = _quickMatchCallback
                _quickMatchCallback = null
                cb(-1, {})
            }
        }, 15000)
        
        // 发送快速匹配请求
        _sendmsg(MessageType.QUICK_MATCH, {}, null)
    }
    
    // 🔧【新增】处理快速匹配的 room_joined 响应
    var _handleQuickMatchResponse = function(data) {
        if (_quickMatchCallback) {
            var callback = _quickMatchCallback
            _quickMatchCallback = null
            
            // 清除超时
            if (_quickMatchTimeout) {
                clearTimeout(_quickMatchTimeout)
                _quickMatchTimeout = null
            }
            
            // 🔧【新增】获取房间分类
            var roomCategory = data.room_category || 1

            // 转换数据格式
            var players = data.players || []
            var playerdata = players.map(function(p, idx) {
                console.log("🪙 [request_enter_room] 转换玩家数据:", p.name, "gold_count=", p.gold_count, "match_coin=", p.match_coin, "arena_gold=", p.arena_gold, "avatar=", p.avatar)
                return {
                    accountid: p.id,
                    nick_name: p.name,
                    avatarUrl: p.avatar || "avatar_1",  // 🔧【修复】使用服务端发送的头像
                    gold_count: p.gold_count || 0,
                    goldcount: p.gold_count || 0,
                    match_coin: p.match_coin || 0, // 🔧【新增】竞技币
                    arena_gold: p.arena_gold || p.match_coin || 0, // 🔧【新增】当期赛事金币（优先使用）
                    period_no: p.period_no || "", // 🔧【新增】期号
                    seatindex: (p.seat !== undefined ? p.seat : idx) + 1,
                    isready: p.ready || false,
                    room_category: roomCategory // 🔧【新增】传递房间分类
                }
            })

            callback(0, {
                seatindex: data.player ? data.player.seat + 1 : 1,
                playerdata: playerdata,
                roomid: data.room_code || "MATCH",
                room_code: data.room_code || "MATCH",
                housemanageid: data.creator_id || "",
                room_category: roomCategory, // 🔧【新增】传递房间分类
                period_no: data.period_no || "" // 🔧【新增】期号
            })
        }
    }
    
    that.getRoomList = function(callback){
        _request(MessageType.GET_ROOM_LIST, {}, function(result, data){
            if (result === 0 && data && data.rooms) {
                callback && callback(0, data.rooms)
            } else {
                callback && callback(-1, [])
            }
        })
    }
    
    that.createRoom = function(roomConfigId, callback){
        _request(MessageType.CREATE_ROOM, {}, function(result, data){
            if (result === 0 && data) {
                callback && callback(0, data)
            } else {
                callback && callback(-1, {})
            }
        })
    }
    
    that.joinRoom = function(roomCode, callback){
        _request(MessageType.JOIN_ROOM, { room_code: roomCode }, function(result, data){
            if (result === 0 && data) {
                callback && callback(0, data)
            } else {
                callback && callback(-1, {})
            }
        })
    }
    
    that.onRoomListResult = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("room_list_result", callback)
    }
    
    that.onRoomListUpdate = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("room_list_update", callback)
    }
    
    that.offRoomListUpdate = function(callback){
        var evt = _getEvent()
        if (evt) evt.off("room_list_update", callback)
    }
    
    that.onRoomCreated = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("room_created", callback)
    }
    
    that.onRoomJoined = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("room_joined", callback)
    }

    // ========== 游戏流程 ==========

    that.requestReady = function(){
        _sendmsg(MessageType.READY, {}, null)
    }

    that.requestStart = function(callback){
        _request(MessageType.READY, {}, callback)
    }

    that.requestBid = function(bid) {
        _sendmsg(MessageType.BID, { bid: bid }, null)
    }

    that.requestCallLandlord = function(action) {
        _sendmsg(MessageType.CALL_LANDLORD, { action: action }, null)
    }

    that.requestRobState = function(state){
        // 🔧【修复】确保发送布尔值，而不是数字
        // state 可能是数字(0/1) 或对象({bid: true/false})
        var robValue = false
        if (typeof state === 'object' && state !== null) {
            robValue = state.bid || false
        } else if (state === 1 || state === true) {
            robValue = true
        }
        _sendmsg(MessageType.ROB, { rob: robValue }, null)
    }

    that.request_chu_card = function(req, callback){
        // 🔧【修复】req 是 choose_card_data 数组，格式为 [{cardid, card_data}, ...]
        // 需要直接使用 req，而不是 req.cards
        
        var cards = _convertClientCardsToServer(req)
        
        // 🔧【调试】打印转换后的卡牌数据
        
        _request(MessageType.PLAY_CARDS, { cards: cards }, callback)
    }

    that.request_buchu_card = function(req, callback){
        _request(MessageType.PASS, {}, callback)
    }

    // 提示功能：请求出牌提示（带回调，服务端需返回callIndex）
    that.requestHint = function(callback){
        _request(MessageType.HINT_REQUEST, {}, callback)
    }

    // 提示功能：发送提示请求（不等待回调，通过事件监听器处理响应）
    that.sendHintRequest = function(){
        _sendmsg(MessageType.HINT_REQUEST, {}, null)
    }

    // ========== 事件监听 ==========
    
    that.onPlayerJoinRoom = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("player_joinroom_notify", callback)
    }

    that.onPlayerReady = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("player_ready_notify", callback)
    }

    // 🔧【新增】监听玩家离开事件
    that.onPlayerLeft = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("player_left", callback)
    }

    that.onGameStart = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("gameStart_notify", callback)
    }

    that.onChangeHouseManage = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("changehousemanage_notify", callback)
    }

    // 【核心】发牌消息监听 - 服务端数据是唯一数据源
    that.onPushCards = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("pushcard_notify", callback)
    }

    that.onBidTurn = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("bid_turn_notify", callback)
    }
    
    that.onBidResult = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("bid_result_notify", callback)
    }

    that.onCanRobState = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("canrob_notify", callback)
    }

    that.onRobState = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("canrob_state_notify", callback)
    }

    that.onCanChuCard = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("can_chu_card_notify", callback)
    }

    that.onOtherPlayerChuCard = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("other_chucard_notify", callback)
    }

    that.onChangeMaster = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("change_master_notify", callback)
    }

    // 🔧【新增】监听出牌阶段开始
    that.onPlayStart = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("play_start_notify", callback)
    }

    that.onChangeShowCard = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("change_showcard_notify", callback)
    }

    that.onGameOver = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("game_over", callback)
    }

    that.onGameStateRestore = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("game_state_restore", callback)
    }

    that.onCallLandlordStart = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("call_landlord_start_notify", callback)
    }

    that.onCallLandlordTurn = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("call_landlord_turn_notify", callback)
    }

    that.onCallLandlordResult = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("call_landlord_result_notify", callback)
    }

    that.onCallLandlordEnd = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("call_landlord_end_notify", callback)
    }

    that.onRestartGame = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("restart_game_notify", callback)
    }

    // 🔧【新增】地主新手牌消息监听
    that.onLandlordCards = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("landlord_cards_notify", callback)
    }

    // 🔧【新增】提示结果消息监听
    that.onHintResult = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("hint_result_notify", callback)
    }

    // 🔧【托管】监听托管状态变化通知
    that.onTrusteeStateNotify = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("trustee_state_notify", callback)
    }

    // 🔧【新增】发送取消托管请求
    // 用户活动时调用，让服务端停止机器人自动操作，让玩家恢复控制
    that.cancelTrustee = function(){
        console.log("📤 [cancelTrustee] 发送取消托管请求")
        _sendmsg("cancel_trustee", {})
    }

    // ============================================================
    // 【竞技场】事件监听
    // ============================================================

    /**
     * 监听竞技场大厅状态推送（期号、倒计时）
     * @param {Function} callback - 回调函数，接收 { arenas: [], time: timestamp }
     */
    that.onArenaStatus = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("arena_status_notify", callback)
    }

    /**
     * 🔧【新增】监听竞技场比赛开始通知
     * @param {Function} callback - 回调函数，接收 { period_no, room_id, room_name, ... }
     */
    that.onArenaMatchStart = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("arena_match_start_notify", callback)
    }

    /**
     * 🔧【新增】监听竞技场关闭弹窗通知
     * @param {Function} callback - 回调函数，接收 { room_id, period_no, reason, message }
     */
    that.onArenaCloseDialog = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("arena_close_dialog_notify", callback)
    }

    /**
     * 监听竞技场状态更新
     * @param {Function} callback - 回调函数，接收 { room_category, round, total_rounds, match_coin, ... }
     */
    that.onCompetitionStatus = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("competition_status_notify", callback)
    }
    
    /**
     * 监听竞技场倒计时
     * @param {Function} callback - 回调函数，接收 { countdown, message }
     */
    that.onCompetitionCountdown = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("competition_countdown_notify", callback)
    }
    
    /**
     * 监听比赛金币更新
     * @param {Function} callback - 回调函数，接收 { player_id, match_coin, delta }
     */
    that.onMatchCoinUpdate = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("match_coin_update_notify", callback)
    }
    
    /**
     * 监听淘汰通知
     * @param {Function} callback - 回调函数，接收 { rank, reason, total_players, rewards }
     */
    that.onCompetitionEliminated = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("competition_eliminated_notify", callback)
    }
    
    /**
     * 监听晋级通知
     * @param {Function} callback - 回调函数，接收 { current_round, total_rounds, match_coin, message }
     */
    that.onCompetitionAdvance = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("competition_advance_notify", callback)
    }
    
    /**
     * 监听冠军弹窗
     * @param {Function} callback - 回调函数，接收 { rank, rewards, reward_type, rankings, match_coin }
     */
    that.onCompetitionChampion = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("competition_champion_notify", callback)
    }

    // ============================================================
    // 【竞技场】报名相关事件监听
    // ============================================================

    /**
     * 🔧【新增】监听报名成功通知
     * @param {Function} callback - 回调函数，接收 { period_no, room_id, signup_fee, balance_after, signup_time }
     */
    that.onArenaSignupSuccess = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("arena_signup_success_notify", callback)
    }

    /**
     * 🔧【新增】移除报名成功监听
     * @param {Function} callback - 要移除的回调函数
     */
    that.offArenaSignupSuccess = function(callback){
        var evt = _getEvent()
        if (evt) evt.off("arena_signup_success_notify", callback)
    }

    /**
     * 🔧【新增】监听报名失败通知
     * @param {Function} callback - 回调函数，接收 { code, message }
     */
    that.onArenaSignupFailed = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("arena_signup_failed_notify", callback)
    }

    /**
     * 🔧【新增】移除报名失败监听
     * @param {Function} callback - 要移除的回调函数
     */
    that.offArenaSignupFailed = function(callback){
        var evt = _getEvent()
        if (evt) evt.off("arena_signup_failed_notify", callback)
    }

    /**
     * 🔧【新增】监听取消报名成功通知
     * @param {Function} callback - 回调函数，接收 { period_no, room_id, refund_amount, balance_after }
     */
    that.onArenaCancelSuccess = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("arena_cancel_success_notify", callback)
    }

    /**
     * 🔧【新增】移除取消报名成功监听
     * @param {Function} callback - 要移除的回调函数
     */
    that.offArenaCancelSuccess = function(callback){
        var evt = _getEvent()
        if (evt) evt.off("arena_cancel_success_notify", callback)
    }

    /**
     * 🔧【新增】监听取消报名失败通知
     * @param {Function} callback - 回调函数，接收 { code, message }
     */
    that.onArenaCancelFailed = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("arena_cancel_failed_notify", callback)
    }

    /**
     * 🔧【新增】移除取消报名失败监听
     * @param {Function} callback - 要移除的回调函数
     */
    that.offArenaCancelFailed = function(callback){
        var evt = _getEvent()
        if (evt) evt.off("arena_cancel_failed_notify", callback)
    }

    // ============================================================
    // 【竞技场】发送请求方法
    // ============================================================

    /**
     * 🔧【新增】发送竞技场报名请求
     * @param {Object} data - 请求数据 { room_id: number }
     */
    that.sendArenaSignup = function(data){
        console.log("🏟️ [Arena] 发送 arena_signup 请求:", JSON.stringify(data));
        _sendmsg("arena_signup", data, null)
    }

    /**
     * 🔧【新增】发送竞技场取消报名请求
     * @param {Object} data - 请求数据 { room_id: number }
     */
    that.sendArenaCancelSignup = function(data){
        console.log("🏟️ [Arena] 发送 arena_cancel_signup 请求:", JSON.stringify(data));
        _sendmsg("arena_cancel_signup", data, null)
    }

    /**
     * 🔧【新增】发送竞技场进入游戏请求
     * @param {Object} data - 请求数据 { period_no: string, room_id: number }
     */
    that.sendArenaEnter = function(data){
        console.log("🏟️ [Arena] 发送 arena_enter 请求:", JSON.stringify(data));
        _sendmsg("arena_enter", data, null)
    }

    /**
     * 🔧【关键修复】主动请求竞技场状态
     * 这是解决竞技场弹窗不显示问题的关键修复
     * 当客户端进入大厅时，主动请求一次竞技场状态
     * 
     * 🔧【重要改进】如果 WebSocket 未连接，会自动初始化连接后再请求
     */
    that.requestArenaStatus = function(){
        console.log("🏟️ [Arena] requestArenaStatus 被调用");
        
        // 🔧【关键】检查 WebSocket 是否已连接
        if (!_socket || _socket.readyState !== WebSocket.OPEN) {
            console.log("🏟️ [Arena] WebSocket 未连接，先初始化连接...");
            
            // 如果 WebSocket 不存在或已关闭，初始化连接
            if (!_socket || _socket.readyState === WebSocket.CLOSED || _socket.readyState === WebSocket.CLOSING) {
                console.log("🏟️ [Arena] 🔌 主动初始化 WebSocket 连接...");
                that.initSocket();
            }
            
            // 监听连接成功后请求
            var evt = _getEvent();
            if (evt) {
                var handler = function(data) {
                    console.log("🏟️ [Arena] ✅ 连接成功后请求竞技场状态");
                    evt.off("connection_success", handler);
                    setTimeout(function() {
                        _sendmsg("get_arena_status", {}, null);
                    }, 100);
                };
                evt.on("connection_success", handler);
                
                // 超时保护
                setTimeout(function() {
                    evt.off("connection_success", handler);
                }, 5000);
            }
            return;
        }
        
        // WebSocket 已连接，直接发送请求
        _sendmsg("get_arena_status", {}, null)
    }

    /**
     * 🔧【关键修复】确保连接后请求竞技场状态
     * 如果 WebSocket 已连接，立即请求；否则主动初始化连接后请求
     * 这是解决弹窗不显示问题的核心修复！
     */
    that.requestArenaStatusWhenConnected = function(){
        console.log("🏟️ [Arena] requestArenaStatusWhenConnected 被调用");
        
        // 检查 WebSocket 是否已连接
        if (_socket && _socket.readyState === WebSocket.OPEN) {
            console.log("🏟️ [Arena] WebSocket 已连接，立即请求竞技场状态");
            that.requestArenaStatus();
            return;
        }
        
        // 🔧【关键改进】WebSocket 未连接，主动初始化连接
        console.log("🏟️ [Arena] WebSocket 未连接，准备主动连接...");
        
        var evt = _getEvent();
        if (!evt) {
            console.warn("🏟️ [Arena] eventLister 未初始化，延迟重试");
            setTimeout(function() {
                that.requestArenaStatusWhenConnected();
            }, 500);
            return;
        }
        
        // 🔧【关键】如果 WebSocket 不存在或已关闭，主动初始化连接
        if (!_socket || _socket.readyState === WebSocket.CLOSED || _socket.readyState === WebSocket.CLOSING) {
            console.log("🏟️ [Arena] 🔌 主动初始化 WebSocket 连接...");
            that.initSocket();
        }
        
        // 监听连接成功事件（一次性）
        var handler = function(data) {
            console.log("🏟️ [Arena] ✅ WebSocket 连接成功，现在请求竞技场状态");
            evt.off("connection_success", handler);
            // 延迟一点确保连接完全稳定
            setTimeout(function() {
                that.requestArenaStatus();
            }, 100);
        };
        evt.on("connection_success", handler);
        
        // 设置超时保护，避免永久等待
        setTimeout(function() {
            evt.off("connection_success", handler);
            // 如果还没连接，再次尝试
            if (_socket && _socket.readyState === WebSocket.OPEN) {
                console.log("🏟️ [Arena] 超时后检查到已连接，请求竞技场状态");
                that.requestArenaStatus();
            } else {
                console.warn("🏟️ [Arena] 连接超时，WebSocket 仍未连接");
            }
        }, 5000);
    }

    // ========== 房间状态相关 ==========
    
    that.onShowBottomCard = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("change_showcard_notify", callback)
    }
    
    that.onRoomChangeState = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("room_state_notify", callback)
    }
    
    that.onRoomRestored = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("room_restored", callback)
    }
    
    that.onPlayerOffline = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("player_offline_notify", callback)
    }
    
    that.onPlayerOnline = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("player_online_notify", callback)
    }
    
    that.isInRoom = function(){
        return _isInRoom
    }
    
    that.getCurrentRoomCode = function(){
        return _currentRoomCode
    }
    
    that.leaveRoom = function(callback){
        _sendmsg(MessageType.LEAVE_ROOM, {}, null)
        _currentRoomCode = ""
        _isInRoom = false
        if (callback) callback()
    }

    // ========== 玩家信息 ==========
    
    that.getPlayerInfo = function(){
        return {
            id: _playerId,
            name: _playerName
        }
    }
    
    that.getRoomCode = function(){
        return _currentRoomCode
    }
    
    that.isConnected = function(){
        return _isConnected
    }
    
    // 检查 WebSocket 物理连接是否打开（readyState === OPEN）
    that.isWebSocketOpen = function(){
        return _socket && _socket.readyState === WebSocket.OPEN
    }
    
    // 🔧【新增】检查当前连接是否已认证（带Token且有有效PlayerID）
    that.isAuthenticated = function(){
        // 必须同时满足：连接已建立、连接带Token、有有效的PlayerID
        return _isConnected && _connectionHasToken && _playerId && _playerId > 0
    }
    
    // 🔧【新增】获取当前连接是否带Token
    that.hasConnectionToken = function(){
        return _connectionHasToken
    }
    
    // 🔧【新增】登录成功后重新建立带Token的WebSocket连接
    // 用于解决：WebSocket在登录前建立，没有Token导致PlayerID为0的问题
    that.reconnectWithToken = function(){
        var myglobal = window.myglobal
        var hasToken = myglobal && myglobal.playerData && myglobal.playerData.token
        
        if (!hasToken) {
            console.log("⚠️ [reconnectWithToken] 没有Token，无法重新连接")
            return
        }
        
        // 如果当前连接的PlayerID已经是正确的，不需要重新连接
        if (_playerId && _playerId > 0) {
            console.log("🔧 [reconnectWithToken] 当前连接已有PlayerID:", _playerId, "跳过重新连接")
            return
        }
        
        console.log("🔄 [reconnectWithToken] 关闭旧连接，重新建立带Token的连接...")
        
        // 关闭旧连接
        if (_socket) {
            _stopHeartbeat()
            _socket.close()
            _socket = null
            _isConnected = false
            _setConnectionState("disconnected")
        }
        
        // 延迟后重新连接
        setTimeout(function(){
            that.initSocket()
        }, 100)
    }
    
    // 🔧【新增】获取当前PlayerID
    that.getPlayerId = function(){
        return _playerId
    }

    // ========== 心跳机制 ==========
    
    var _startHeartbeat = function(){
        if (_isHeartbeatRunning) return
        _isHeartbeatRunning = true
        _missedHeartbeats = 0
        _lastHeartbeatTime = Date.now()
        
        _heartbeatInterval = setInterval(function(){
            if (!_socket || _socket.readyState !== WebSocket.OPEN) {
                _stopHeartbeat()
                return
            }
            
            // 🔧【优化】检查上次心跳是否有响应
            // 如果连续多次心跳没响应，可能是网络问题或浏览器节流
            var timeSinceLastHeartbeat = Date.now() - _lastHeartbeatTime
            if (timeSinceLastHeartbeat > _heartbeatIntervalMs * 2) {
                // 两次心跳周期都没有发送成功，可能是浏览器节流
                console.log("⚠️ [Heartbeat] 检测到可能的心跳延迟，时间差:", Math.round(timeSinceLastHeartbeat / 1000), "秒")
            }
            
            _sendmsg(MessageType.PING, { timestamp: Date.now() }, null)
            _lastHeartbeatTime = Date.now()
            
            // 🔧【新增】设置心跳响应超时检测
            if (_heartbeatTimeout) {
                clearTimeout(_heartbeatTimeout)
            }
            _heartbeatTimeout = setTimeout(function(){
                // 心跳发送后，等待响应超时
                // 如果多次心跳没响应，考虑重连
                _missedHeartbeats++
                console.log("⚠️ [Heartbeat] 心跳响应超时，累计:", _missedHeartbeats)
                
                if (_missedHeartbeats >= _maxMissedHeartbeats) {
                    console.log("🔄 [Heartbeat] 连续多次心跳无响应，尝试重连...")
                    _missedHeartbeats = 0
                    // 主动重连
                    if (_socket) {
                        _socket.close()
                    }
                    _autoReconnect()
                }
            }, _heartbeatTimeoutMs)
            
        }, _heartbeatIntervalMs)
    }
    
    var _stopHeartbeat = function(){
        _isHeartbeatRunning = false
        if (_heartbeatInterval) {
            clearInterval(_heartbeatInterval)
            _heartbeatInterval = null
        }
        if (_heartbeatTimeout) {
            clearTimeout(_heartbeatTimeout)
            _heartbeatTimeout = null
        }
    }
    
    var _onHeartbeatAck = function(data){
        _missedHeartbeats = 0
        // 收到 pong 响应，清除超时检测
        if (_heartbeatTimeout) {
            clearTimeout(_heartbeatTimeout)
            _heartbeatTimeout = null
        }
    }
    
    var _setConnectionState = function(state){
        _connectionState = state
        _stateListeners.forEach(function(listener){
            listener(state)
        })
    }
    
    that.onConnectionStateChange = function(callback){
        _stateListeners.push(callback)
    }
    
    that.getConnectionState = function(){
        return _connectionState
    }

    // ========== 强制下线处理 ==========
    
    var _handleForceLogout = function(data){
        console.warn("🚫 强制下线:", data.message || "未知原因")
        _stopHeartbeat()
        if (_socket) {
            _socket.close()
        }
        evt.fire("force_logout", data)
    }

    // ============================================================
    // 【新增】竞技场轮次倒计时监听函数
    // ============================================================

    /**
     * 监听竞技场轮次倒计时开始
     * @param {Function} callback - 回调函数，接收 { seconds, round, period_no, room_id, message }
     */
    that.onArenaRoundCountdown = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("arena_round_countdown_notify", callback)
    }

    /**
     * 监听竞技场倒计时每秒更新
     * @param {Function} callback - 回调函数，接收 { seconds, period_no, room_id }
     */
    that.onArenaCountdownTick = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("arena_countdown_tick_notify", callback)
    }

    /**
     * 监听竞技场自动准备通知
     * @param {Function} callback - 回调函数，接收 { period_no, room_id, message }
     */
    that.onArenaAutoReady = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("arena_auto_ready_notify", callback)
    }

    /**
     * 监听竞技场断线重连状态恢复
     * @param {Function} callback - 回调函数，接收 { phase, period_no, room_id, round, countdown, message }
     */
    that.onArenaReconnectState = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("arena_reconnect_state_notify", callback)
    }


    // 🏆 监听冠军跑马灯广播
    that.onArenaChampionBroadcast = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("arena_champion_broadcast_notify", callback)
    }

    // ============================================================
    // 【新增】竞技场多桌等待和决赛排行榜监听函数
    // ============================================================

    /**
     * 监听等待进度广播
     * @param {Function} callback - 回调函数，接收 { period_no, round, total_rounds, finished_tables, total_tables, player_table_done, message }
     */
    that.onTournamentWaitProgress = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("tournament_wait_progress_notify", callback)
    }

    /**
     * 监听下一轮通知
     * @param {Function} callback - 回调函数，接收 { period_no, new_round, total_rounds, message }
     */
    that.onTournamentRoundAdvance = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("tournament_round_advance_notify", callback)
    }

    /**
     * 监听最终榜单
     * @param {Function} callback - 回调函数，接收 { period_no, total_players, top3, top20, my_rank, my_match_coin, message }
     */
    that.onTournamentFinalRank = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("tournament_final_rank_notify", callback)
    }

    // ============================================================
    // 【新增】竞技场淘汰踢出房间通知监听
    // ============================================================

    /**
     * 🔧【新增】监听竞技场淘汰踢出房间通知
     * 当玩家被淘汰时，服务端发送此消息通知客户端离开房间
     * @param {Function} callback - 回调函数，接收 { period_no, player_id, message }
     */
    that.onArenaEliminatedKick = function(callback){
        var evt = _getEvent()
        if (evt) evt.on("arena_eliminated_kick_notify", callback)
    }

    // ============================================================
    // 【新增】页面可见性检测和自动重连
    // 解决移动端锁屏/后台时 WebSocket 断开的问题
    // ============================================================

    var _pageVisibilityHandler = null
    var _lastVisibleTime = Date.now()
    var _backgroundCheckInterval = null

    /**
     * 初始化页面可见性监听
     * 当页面从后台切换到前台时，检查连接状态并自动重连
     * 🔧【修复】增加后台时间阈值，避免短时间切换触发不必要的重连
     */
    var _initVisibilityListener = function() {
        if (_pageVisibilityHandler) return // 避免重复注册

        _pageVisibilityHandler = function() {
            if (document.visibilityState === 'visible') {
                // 页面变为可见
                var backgroundTime = Date.now() - _lastVisibleTime
                console.log("📱 [Visibility] 页面从后台恢复，后台时长:", Math.round(backgroundTime / 1000), "秒")

                // 🔧【关键修复】只有后台时间超过阈值（45秒）才检查连接状态
                // 短时间的标签页切换不应该触发重连检查
                if (backgroundTime < _backgroundThresholdMs) {
                    console.log("📱 [Visibility] 后台时间较短，跳过连接检查")
                    // 只重置心跳计数，不触发重连
                    _missedHeartbeats = 0
                    return
                }

                // 后台时间较长，重置心跳计数
                console.log("📱 [Visibility] 后台时间较长，重置心跳计数")
                _missedHeartbeats = 0

                // 检查连接状态
                if (!_socket || _socket.readyState !== WebSocket.OPEN) {
                    console.log("📱 [Visibility] 连接已断开，尝试自动重连...")
                    _autoReconnect()
                } else {
                    // 连接还在，发送一个心跳确认
                    console.log("📱 [Visibility] 连接正常，发送心跳确认")
                    _sendmsg(MessageType.PING, { timestamp: Date.now() }, null)
                }
            } else {
                // 页面进入后台
                _lastVisibleTime = Date.now()
                console.log("📱 [Visibility] 页面进入后台")
            }
        }

        document.addEventListener('visibilitychange', _pageVisibilityHandler)

        // 🔧【修复】移除 BackgroundCheck 定时器
        // 心跳机制已经足够处理连接问题，不需要额外的定时检查
        // 这可以避免不必要的日志输出和资源消耗
    }

    /**
     * 自动重连
     * 使用保存的 reconnect_token 尝试重连
     * 🔧【修复】重连成功后发送 reconnect 消息，触发服务端的 handleReconnect 流程
     */
    var _autoReconnect = function() {
        if (_connectionState === "connecting") {
            console.log("🔄 [AutoReconnect] 正在重连中，跳过...")
            return
        }

        if (!_reconnectToken) {
            console.log("🔄 [AutoReconnect] 没有 reconnect_token，执行全新连接...")
            that.initSocket()
            return
        }

        console.log("🔄 [AutoReconnect] 使用 token 尝试重连...")

        _setConnectionState("connecting")

        var wsUrl = _serverUrl
        if (wsUrl.indexOf("ws://") !== 0 && wsUrl.indexOf("wss://") !== 0) {
            wsUrl = "ws://" + wsUrl + "/ws"
        }

        // 🔧【修复】不使用 URL 参数传递重连 token，而是连接后发送 reconnect 消息
        // 这样服务端才能正确处理重连逻辑（包括竞技场状态恢复）

        try {
            var newSocket = new WebSocket(wsUrl)

            newSocket.onopen = function() {
                _socket = newSocket
                _isConnected = true
                _missedHeartbeats = 0  // 🔧【修复】重置心跳计数
                console.log("✅ [AutoReconnect] WebSocket 连接成功，发送 reconnect 消息...")

                // 🔧【关键修复】发送 reconnect 消息，而不是 ping
                // 这样服务端会调用 handleReconnect，进而恢复竞技场状态
                _sendmsg("reconnect", {
                    token: _reconnectToken,
                    player_id: _playerId
                }, null)
            }

            newSocket.onmessage = function(evt) {
                try {
                    if (evt.data instanceof Blob) {
                        var reader = new FileReader()
                        reader.onload = function(e) {
                            try {
                                var text = e.target.result
                                if (text.trim().charAt(0) === '{') {
                                    var msgData = JSON.parse(text)
                                    _handleMessage(msgData)
                                }
                            } catch(e) {}
                        }
                        reader.readAsText(evt.data)
                    } else {
                        var msgData = JSON.parse(evt.data)
                        _handleMessage(msgData)
                    }
                } catch(e) {
                    console.error("解析消息失败:", e)
                }
            }

            newSocket.onerror = function(error) {
                console.error("🔄 [AutoReconnect] 重连失败:", error)
                _setConnectionState("disconnected")
            }

            newSocket.onclose = function(event) {
                _isConnected = false
                _setConnectionState("disconnected")
                _stopHeartbeat()
            }

        } catch(e) {
            console.error("🔄 [AutoReconnect] 创建连接失败:", e)
            _setConnectionState("disconnected")
        }
    }

    /**
     * 清理可见性监听
     */
    that.cleanupVisibilityListener = function() {
        if (_pageVisibilityHandler) {
            document.removeEventListener('visibilitychange', _pageVisibilityHandler)
            _pageVisibilityHandler = null
        }
        if (_backgroundCheckInterval) {
            clearInterval(_backgroundCheckInterval)
            _backgroundCheckInterval = null
        }
    }

    // 自动初始化可见性监听
    if (typeof document !== 'undefined') {
        _initVisibilityListener()
    }

    return that
}
