// 使用全局变量，不使用 require
// 【修复版本】简化对手牌背显示，直接创建 17 张牌背
// 核心原则：
// 1. 收到 push_card_event 后直接显示 17 张牌背
// 2. 不依赖定时器或动画调度
// 3. 保证数据正确性

var qian_state = window.qian_state || { buqiang: 0, qian: 1 }
var isopen_sound = window.isopen_sound || 1

// ⚠️【已删除】playRobSound 函数 - 音效播放统一由 gameingUI._playRobSound 处理

cc.Class({
    extends: cc.Component,

    properties: {
        account_label: cc.Label,
        nickname_label: cc.Label,
        room_touxiang: cc.Sprite,
        globalcount_label: cc.Label,
        room_money_frame: cc.Node,     // 金币背景框
        headimage: cc.Sprite,
        readyimage: cc.Node,
        offlineimage: cc.Node,
        trusteeimage: cc.Node,     // 🔧【托管】托管状态图标
        card_node: cc.Node,
        card_prefab: cc.Prefab,
        clockimage: cc.Node,
        qiangdidzhu_node: cc.Node,
        time_label: cc.Label,
        robimage_sp: cc.SpriteFrame,
        robnoimage_sp: cc.SpriteFrame,
        robIconSp: cc.Sprite,
        robIcon_Sp: cc.Node,
        robnoIcon_Sp: cc.Node,
        masterIcon: cc.Node
    },

    onLoad () {
      this.readyimage.active = false
      this.offlineimage.active = false
      if (this.trusteeimage) this.trusteeimage.active = false  // 🔧【托管】初始化托管图标
      if (this.masterIcon) this.masterIcon.active = false  // 🔧【修复】初始化地主图标为隐藏
      this.currentCardCount = 17
      this.cardlist_node = []
      
      // 游戏开始事件
      this.node.on("gamestart_event", function(event) {
        this.readyimage.active = false
        if (this.masterIcon) this.masterIcon.active = false  // 🔧【修复】游戏开始时隐藏地主图标
        if (this.card_node) {
            this.card_node.active = false
            this.card_node.removeAllChildren(true)
        }
        this.cardlist_node = []
        this.currentCardCount = 17
      }.bind(this))

      // 【核心】发牌事件 - 直接显示 17 张牌背
      this.node.on("push_card_event", function(event) {
        var myglobal = window.myglobal
        
        if (!myglobal) {
            console.error("🃏 [player_node] push_card_event: myglobal 不存在！")
            return
        }
        
        var myPlayerId = this._getMyPlayerId(myglobal)
        var accountIdStr = String(this.accountid || "")
        
        // 如果是自己，跳过
        if(myPlayerId === accountIdStr && accountIdStr !== ""){
            return
        }
        
        this.showCardBacks(17)
      }.bind(this))

      // 抢地主事件
      // 🔧【修复】所有玩家节点都能显示抢地主/不抢状态
      // ⚠️【重要】音效播放统一由 gameingUI._playRobSound 处理，此处不再播放音效
      this.node.on("playernode_rob_state_event", function(event) {
          var detail = event
          
          // 隐藏抢地主按钮（当前操作的玩家）
          if(detail.accountid == this.accountid){
            this.qiangdidzhu_node.active = false
          }

          // 🔧【关键修复】所有玩家节点都显示对应玩家的抢地主状态
          if(this.accountid == detail.accountid){
            // 🔧【新增】根据轮次区分"叫地主/不叫"和"抢地主/不抢"
            var round = detail.round || 1
            var isCall = detail.state == qian_state.qian || detail.state === true
            
            if(isCall){
              this.robIcon_Sp.active = true
              // ⚠️【已删除】音效播放移至 gameingUI._playRobSound（服务端广播触发）
            }else{
              this.robnoIcon_Sp.active = true
              // ⚠️【已删除】音效播放移至 gameingUI._playRobSound（服务端广播触发）
            }
          }
      }.bind(this))

      // 成为地主事件
      this.node.on("playernode_changemaster_event", function(event) {
         var detail = event 
         this.robIcon_Sp.active = false
         this.robnoIcon_Sp.active = false
         if(detail == this.accountid){
            this.masterIcon.active = true
            this.currentCardCount = 20
            this.showCardBacks(20)
         }
      }.bind(this))
      
      // 牌数更新事件
      this.node.on("update_card_count_event", function(data) {
         if(data.accountid == this.accountid){
            this.currentCardCount = data.count
            this.showCardBacks(data.count)
         }
      }.bind(this))
      
      // 【新增】玩家状态更新事件（掉线/上线/托管）
      this.node.on("player_state_update", function(data) {
         this._updatePlayerState(data)
      }.bind(this))
      
      // 🔧【托管】托管状态更新事件
      this.node.on("trustee_state_update", function(data) {
         this._updateTrusteeState(data)
      }.bind(this))
      
      // 🕐【新增】倒计时更新事件
      this.node.on("update_countdown_event", function(data) {
         // 只更新当前玩家的倒计时显示
         if (this.seat_index === 0) {
            if (this.time_label) {
               this.time_label.string = String(data.remaining)
            }
         }
      }.bind(this))
    },

    start () {
    },
    
    /**
     * 获取当前玩家ID
     */
    _getMyPlayerId: function(myglobal) {
        var myPlayerId = null
        
        if (myglobal.socket && myglobal.socket.getPlayerInfo) {
            var playerInfo = myglobal.socket.getPlayerInfo()
            if (playerInfo && playerInfo.id) {
                myPlayerId = playerInfo.id
            }
        }
        
        if (!myPlayerId && myglobal.playerData && myglobal.playerData.serverPlayerId) {
            myPlayerId = myglobal.playerData.serverPlayerId
        }
        
        if (!myPlayerId && myglobal.playerData && myglobal.playerData.accountID) {
            myPlayerId = myglobal.playerData.accountID
        }
        
        return String(myPlayerId || "")
    },

    init_data(data, index) {
      var myglobal = window.myglobal

      this.accountid = data.accountid
      this.seat_index = index

      // 同步玩家ID
      if (myglobal && myglobal.playerData && !myglobal.playerData.serverPlayerId) {
          if (myglobal.socket && myglobal.socket.getPlayerInfo) {
              var playerInfo = myglobal.socket.getPlayerInfo()
              if (playerInfo && playerInfo.id) {
                  myglobal.playerData.serverPlayerId = playerInfo.id
              }
          }
      }

      this.account_label.node.active = false
      this.nickname_label.string = data.nick_name || ("玩家" + (index + 1))

      // 🔧【修复】区分普通场和竞技场的金币显示
      // 竞技场模式下显示 arena_gold（当期赛事金币），普通场显示 gold_count（欢乐豆）
      var displayValue = 0
      var isArenaMode = data.room_category === 2 || this._isArenaMode

      if (isArenaMode) {
          // 竞技场模式：优先显示 arena_gold（当期赛事金币）
          if (data.arena_gold !== undefined && data.arena_gold !== null) {
              displayValue = data.arena_gold
              console.log("🏟️ [player_node] 竞技场模式 - 昵称:", data.nick_name, "arena_gold:", data.arena_gold, "期号:", data.period_no)
          } else if (data.match_coin !== undefined && data.match_coin !== null) {
              displayValue = data.match_coin
              console.log("🏟️ [player_node] 竞技场模式(兼容) - 昵称:", data.nick_name, "match_coin:", data.match_coin)
          } else if (data.gold_count !== undefined && data.gold_count !== null) {
              displayValue = data.gold_count
              console.log("🏟️ [player_node] 竞技场模式（无arena_gold）- 使用 gold_count:", data.gold_count)
          }
      } else {
          // 普通场：显示欢乐豆
          if (data.gold_count !== undefined && data.gold_count !== null) {
              displayValue = data.gold_count
          } else if (data.goldcount !== undefined && data.goldcount !== null) {
              displayValue = data.goldcount
          }
          console.log("🪙 [player_node] 普通场 - 昵称:", data.nick_name, "gold_count:", data.gold_count, "最终金币:", displayValue)
      }

      this.globalcount_label.string = String(displayValue)
      this._isArenaMode = isArenaMode // 保存竞技场模式状态
      this._arenaGold = displayValue // 🔧【新增】保存当前赛事金币
      this._periodNo = data.period_no || "" // 🔧【新增】保存期号
      this.cardlist_node = []

      // 检查准备状态
      var isReady = data.isready || data.ready || data.IsReady || false
      if(isReady == true || isReady === "true" || isReady === 1){
        this.readyimage.active = true
      } else {
        this.readyimage.active = false
      }

      // 【核心修改】当前玩家（index == 0）：隐藏牌背，调整头像位置
      if (index == 0) {
        // 隐藏牌背节点
        if (this.card_node) {
          this.card_node.active = false
        }
        // 调整头像位置到牌背位置（牌背位置：[80, 32]）
        if (this.room_touxiang) {
          this.room_touxiang.node.x = 80
          this.room_touxiang.node.y = 32
        }
        if (this.headimage) {
          this.headimage.node.x = 80
          this.headimage.node.y = 32
        }
        // 调整昵称标签位置（头像正上方，居中显示）
        if (this.nickname_label && this.nickname_label.node) {
          // 设置锚点为中心，确保居中显示
          this.nickname_label.node.anchorX = 0.5
          this.nickname_label.node.anchorY = 0.5
          // 位置与头像 x 相同，y 在头像上方
          this.nickname_label.node.x = 80
          this.nickname_label.node.y = 90
        }
        // 调整金币标签位置（头像下方，居中显示）
        if (this.globalcount_label && this.globalcount_label.node) {
          // 设置锚点为中心，确保居中显示
          this.globalcount_label.node.anchorX = 0.5
          this.globalcount_label.node.anchorY = 0.5
          // 位置与头像 x 相同，y 在头像下方
          this.globalcount_label.node.x = 80
          this.globalcount_label.node.y = -28
        }
        // 调整金币背景框位置（与金币标签对齐）
        if (this.room_money_frame) {
          this.room_money_frame.x = 80
          this.room_money_frame.y = -28
        }
        // 调整准备图标位置（头像右下角）
        if (this.readyimage) {
          this.readyimage.x = 105
          this.readyimage.y = 5
        }
        // 调整地主图标位置（头像右下角）
        if (this.masterIcon) {
          this.masterIcon.x = 105
          this.masterIcon.y = 5
        }
      }

      // 设置层级
      if (this.room_touxiang && this.headimage) {
          this.headimage.node.zIndex = 0
          this.room_touxiang.node.zIndex = 100
          this.headimage.node.parent.sortAllChildren()
      }

      // 🔧【修复】加载头像 - 支持远程URL和本地资源
      // 服务端可能返回 avatar, avatarUrl, 或 avatarurl 字段
      var avatarUrl = data.avatar || data.avatarUrl || data.avatarurl || "avatar_1"
      this._loadAvatar(avatarUrl)

      // 准备通知
      this.node.on("player_ready_notify", function(event) {
          var detail = event
          var readyPlayerId = ""
          if (typeof detail === 'object' && detail !== null) {
              readyPlayerId = detail.player_id || detail.playerId || detail.id || ""
          } else {
              readyPlayerId = detail
          }

          if(readyPlayerId == this.accountid){
              this.readyimage.active = true
          }
      }.bind(this))

      // 抢地主通知
      // 🔧【修复】接收包含 player_id 和 timeout 的事件对象，不再硬编码
      this.node.on("playernode_canrob_event", function(event) {
          
          // 兼容处理：event 可能是字符串（旧格式）或对象（新格式）
          var playerId = event
          var timeout = 15  // 默认 15 秒
          
          if (typeof event === 'object' && event !== null) {
              playerId = event.player_id
              timeout = event.timeout || 15
          }
          
          // 存储 timeout 值供倒计时更新使用
          this._serverTimeout = timeout
          
          if(playerId == this.accountid){
            this.qiangdidzhu_node.active = true
            if (this.time_label) {
              this.time_label.string = String(timeout)
            }
          }
      }.bind(this))
      
      // 🕐 存储服务端传递的 timeout 值
      this._serverTimeout = 15

      if(index == 1){
        this.card_node.x = -this.card_node.x - 30
      }
    },

    _setAvatarSprite: function(spriteFrame) {
        if (!this.headimage || !spriteFrame) return
        this.headimage.enabled = true
        this.headimage.spriteFrame = spriteFrame
        this.headimage.node.setContentSize(80, 80)
        this.headimage.node.scale = 1
    },

    /**
     * 🔧【新增】加载头像 - 支持远程URL和本地资源
     * @param {string} avatarUrl - 头像URL或本地资源名
     */
    _loadAvatar: function(avatarUrl) {
        var self = this
        
        if (!this.headimage) {
            console.warn("🖼️ [player_node] headimage 未绑定")
            return
        }

        // 空值处理
        if (!avatarUrl || avatarUrl === "") {
            this._loadDefaultAvatar()
            return
        }

        // 判断是否是远程URL
        if (avatarUrl.indexOf('http://') === 0 || avatarUrl.indexOf('https://') === 0) {
            // 远程URL头像
            console.log("🖼️ [player_node] 加载远程头像:", avatarUrl)
            cc.assetManager.loadRemote(avatarUrl, { ext: '.png' }, function(err, texture) {
                if (err || !texture) {
                    console.warn("🖼️ [player_node] 远程头像加载失败，使用默认头像:", err)
                    self._loadDefaultAvatar()
                    return
                }
                try {
                    var spriteFrame = new cc.SpriteFrame(texture)
                    if (spriteFrame) {
                        self._setAvatarSprite(spriteFrame)
                        console.log("🖼️ [player_node] 远程头像加载成功")
                    }
                } catch (e) {
                    console.warn("🖼️ [player_node] 创建SpriteFrame失败:", e)
                    self._loadDefaultAvatar()
                }
            })
        } else {
            // 本地资源头像
            console.log("🖼️ [player_node] 加载本地头像:", avatarUrl)
            var localPath = "UI/headimage/" + avatarUrl
            cc.loader.loadRes(localPath, cc.SpriteFrame, function(err, spriteFrame) {
                if (err || !spriteFrame) {
                    console.warn("🖼️ [player_node] 本地头像加载失败，使用默认头像:", err)
                    self._loadDefaultAvatar()
                    return
                }
                self._setAvatarSprite(spriteFrame)
                console.log("🖼️ [player_node] 本地头像加载成功")
            })
        }
    },

    /**
     * 🔧【新增】加载默认头像
     */
    _loadDefaultAvatar: function() {
        var self = this
        cc.loader.loadRes("UI/headimage/avatar_1", cc.SpriteFrame, function(err, spriteFrame) {
            if (!err && spriteFrame) {
                self._setAvatarSprite(spriteFrame)
            }
        })
    },

    // ============================================================
    // 【核心】直接显示牌背（无动画，保证数据正确性）
    // ============================================================
    
    /**
     * 显示指定数量的牌背
     * @param {number} count - 牌背数量
     * 【重要】当前玩家（index == 0）不显示牌背
     */
    showCardBacks: function(count) {
        
        // 【核心】检查是否是当前玩家（index == 0），如果是则不显示牌背
        if (this.seat_index === 0) {
            return
        }
        
        if (!this.card_node) {
            console.error("🃏 [player_node] card_node 未绑定")
            return
        }
        
        // 清理旧牌
        this.card_node.removeAllChildren(true)
        this.cardlist_node = []
        
        if (count <= 0) {
            this.card_node.active = false
            this.currentCardCount = 0
            return
        }
        
        this.card_node.active = true
        this.currentCardCount = count
        
        if (!this.card_prefab) {
            console.error("🃏 [player_node] card_prefab 未绑定")
            return
        }
        
        // 直接创建所有牌背（无动画）
        for (var i = 0; i < count; i++) {
            var card = cc.instantiate(this.card_prefab)
            if (!card) continue
            
            card.scale = 0.6
            card.parent = this.card_node
            card.active = true
            
            // 垂直堆叠布局
            var height = card.height
            card.y = (count - 1) * 0.5 * height * 0.4 * 0.3 - height * 0.4 * 0.3 * i
            card.x = 0
            
            this.cardlist_node.push(card)
        }
        
    },
    
    // ============================================================
    // 【新增】玩家状态更新处理
    // ============================================================
    
    /**
     * 更新玩家状态
     * @param {Object} data - 包含 state, cards_count, is_landlord, timeout
     */
    _updatePlayerState: function(data) {
        
        // 更新离线/托管状态显示
        if (data.state === "offline") {
            // 玩家离线，显示离线图标
            if (this.offlineimage) {
                this.offlineimage.active = true
            }
        } else if (data.state === "robot") {
            // 机器人托管，显示托管图标
            if (this.trusteeimage) {
                this.trusteeimage.active = true
            }
            // 兼容：如果没有托管图标，复用离线图标
            if (!this.trusteeimage && this.offlineimage) {
                this.offlineimage.active = true
            }
        } else if (data.state === "online") {
            // 玩家在线，隐藏离线/托管图标
            if (this.offlineimage) {
                this.offlineimage.active = false
            }
            if (this.trusteeimage) {
                this.trusteeimage.active = false
            }
        }
        
        // 更新牌数
        if (data.cards_count !== undefined) {
            this.currentCardCount = data.cards_count
            this.showCardBacks(data.cards_count)
        }
        
        // 更新地主标识
        if (data.is_landlord !== undefined && data.is_landlord === true) {
            if (this.masterIcon) {
                this.masterIcon.active = true
            }
        }
    },
    
    /**
     * 🔧【托管】更新托管状态
     * @param {Object} data - 包含 player_id, player_name, is_trustee, reason
     */
    _updateTrusteeState: function(data) {
        // 只处理当前玩家的托管状态
        if (data.player_id !== this.accountid) {
            return
        }
        
        if (data.is_trustee) {
            // 开启托管状态
            if (this.trusteeimage) {
                this.trusteeimage.active = true
            }
            // 兼容：如果没有托管图标，复用离线图标
            if (!this.trusteeimage && this.offlineimage) {
                this.offlineimage.active = true
            }
        } else {
            // 取消托管状态
            if (this.trusteeimage) {
                this.trusteeimage.active = false
            }
            // 同时隐藏离线图标
            if (this.offlineimage) {
                this.offlineimage.active = false
            }
        }
    }
});
