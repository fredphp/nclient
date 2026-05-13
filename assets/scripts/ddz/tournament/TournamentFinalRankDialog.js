/**
 * TournamentFinalRankDialog - 竞技场决赛冠军排行榜弹窗
 * 
 * 功能：
 * 1. 显示期号和比赛结束标题
 * 2. 前三名领奖台展示（冠军最大，居中高亮）
 * 3. TOP20 ScrollView列表
 * 4. 显示排名、头像、昵称、最终金币
 * 5. 确认按钮返回大厅
 * 
 * 设计风格：中国风斗地主竞技场 - 金色 + 红色
 * 冠军特效：发光、粒子、奖杯动画
 * 
 * 🔧【修复】优化布局：修复名次、头像、用户名挤在一起的问题
 */

cc.Class({
    extends: cc.Component,

    properties: {
        // 期号标签
        periodNoLabel: {
            type: cc.Label,
            default: null
        },
        // 总参赛人数标签
        totalPlayersLabel: {
            type: cc.Label,
            default: null
        },
        // 冠军节点
        championNode: {
            type: cc.Node,
            default: null
        },
        // 亚军节点
        runnerUpNode: {
            type: cc.Node,
            default: null
        },
        // 季军节点
        thirdPlaceNode: {
            type: cc.Node,
            default: null
        },
        // TOP20 ScrollView
        top20ScrollView: {
            type: cc.ScrollView,
            default: null
        },
        // 排行榜item模板
        rankItemPrefab: {
            type: cc.Prefab,
            default: null
        },
        // 我的排名标签
        myRankLabel: {
            type: cc.Label,
            default: null
        },
        // 我的金币标签
        myCoinLabel: {
            type: cc.Label,
            default: null
        },
        // 确认按钮
        confirmBtn: {
            type: cc.Button,
            default: null
        },
        // 冠军奖杯节点
        trophyNode: {
            type: cc.Node,
            default: null
        },
        // 冠军发光效果节点
        championGlowNode: {
            type: cc.Node,
            default: null
        }
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 初始化数据
        this._data = null
        this._top3 = []
        this._top20 = []
        this._myRank = 0
        this._myMatchCoin = 0

        // 🔧【新增】检查是否需要动态创建UI（prefab不存在时）
        this._checkAndCreateDynamicUI()

        // 注册按钮事件
        if (this.confirmBtn) {
            this.confirmBtn.node.on('click', this.onConfirmClick, this)
        }
    },

    start () {
        // 启动冠军特效动画
        this._startChampionEffects()
    },

    /**
     * 🔧【新增】检查并动态创建UI（prefab不存在时）
     */
    _checkAndCreateDynamicUI: function() {
        // 如果关键节点不存在，说明prefab未正确加载，需要动态创建UI
        if (!this.championNode || !this.runnerUpNode || !this.thirdPlaceNode) {
            console.log("🏆 [TournamentFinalRankDialog] 检测到prefab未加载，动态创建UI")
            this._createDynamicUI()
        }
    },

    /**
     * 🔧【新增】动态创建完整的弹窗UI
     */
    _createDynamicUI: function() {
        var canvas = cc.find('Canvas')
        if (!canvas) {
            console.error("找不到Canvas节点")
            return
        }

        var screenWidth = 1280
        var screenHeight = 720

        // 设置当前节点为全屏遮罩
        this.node.setContentSize(screenWidth, screenHeight)
        this.node.setPosition(0, 0)
        
        // 添加半透明背景
        var bgNode = new cc.Node("Background")
        bgNode.setContentSize(screenWidth, screenHeight)
        var bgGraphics = bgNode.addComponent(cc.Graphics)
        bgGraphics.fillColor = new cc.Color(0, 0, 0, 180)
        bgGraphics.rect(-screenWidth/2, -screenHeight/2, screenWidth, screenHeight)
        bgGraphics.fill()
        bgNode.parent = this.node

        // 主弹窗容器 - 增大尺寸以容纳所有元素
        var dialogNode = new cc.Node("DialogContainer")
        dialogNode.setContentSize(1000, 650)
        dialogNode.setPosition(0, 0)
        
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
        dialogBg.parent = dialogNode
        dialogNode.parent = this.node

        // ========== 标题区域 ==========
        var titleNode = new cc.Node("TitleNode")
        titleNode.setPosition(0, 280)  // 上移
        
        var titleLabel = titleNode.addComponent(cc.Label)
        titleLabel.string = "🏆 比赛结束 🏆"
        titleLabel.fontSize = 40
        titleLabel.lineHeight = 48
        titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        titleNode.color = new cc.Color(255, 215, 0)
        
        var titleOutline = titleNode.addComponent(cc.LabelOutline)
        titleOutline.color = new cc.Color(100, 60, 0)
        titleOutline.width = 3
        titleNode.parent = dialogNode

        // ========== 期号和参赛人数 ==========
        this._periodNoNode = new cc.Node("PeriodNoNode")
        this._periodNoNode.setPosition(0, 230)  // 上移
        var periodLabel = this._periodNoNode.addComponent(cc.Label)
        periodLabel.string = "第---期赛事结束"
        periodLabel.fontSize = 26
        periodLabel.lineHeight = 32
        this._periodNoNode.color = new cc.Color(200, 200, 220)
        this._periodNoNode.parent = dialogNode
        this.periodNoLabel = periodLabel

        this._totalPlayersNode = new cc.Node("TotalPlayersNode")
        this._totalPlayersNode.setPosition(0, 195)  // 上移
        var totalLabel = this._totalPlayersNode.addComponent(cc.Label)
        totalLabel.string = "共0人参赛"
        totalLabel.fontSize = 22
        totalLabel.lineHeight = 28
        this._totalPlayersNode.color = new cc.Color(180, 180, 200)
        this._totalPlayersNode.parent = dialogNode
        this.totalPlayersLabel = totalLabel

        // ========== 前三名领奖台 ==========
        // 🔧【修复】优化布局间距，避免元素挤在一起
        this._createTop3Podium(dialogNode)

        // ========== 我的排名区域 ==========
        // 🔧【修复】排名文本框文字上下居中
        this._createMyRankArea(dialogNode)

        // ========== 确认按钮 ==========
        this._createConfirmButton(dialogNode)

        console.log("🏆 [TournamentFinalRankDialog] 动态UI创建完成")
    },

    /**
     * 🔧【修复】创建前三名领奖台
     * 布局优化：确保冠军居中高亮，亚季军对称分布
     */
    _createTop3Podium: function(parentNode) {
        // 领奖台Y坐标基准 - 整体上移，留出更多空间
        var podiumY = 50
        
        // 水平间距 - 增大间距避免重叠
        var spacingX = 280
        
        // 冠军（中间，最大，位置最高）
        this.championNode = this._createPodiumItem(1, 0, podiumY + 40, 1.15)
        this.championNode.parent = parentNode

        // 亚军（左侧，位置略低）
        this.runnerUpNode = this._createPodiumItem(2, -spacingX, podiumY, 1.0)
        this.runnerUpNode.parent = parentNode

        // 季军（右侧，位置略低）
        this.thirdPlaceNode = this._createPodiumItem(3, spacingX, podiumY, 1.0)
        this.thirdPlaceNode.parent = parentNode

        // 创建领奖台底部
        var podiumBaseY = podiumY - 100
        this._createPodiumBase(parentNode, podiumBaseY)
    },

    /**
     * 🔧【修复】创建单个领奖台项目
     * 布局顺序（从上到下）：名次 → 头像 → 昵称 → 金币
     * 修复：增大元素间距，确保不挤在一起
     */
    _createPodiumItem: function(rank, x, y, scale) {
        var node = new cc.Node("PodiumItem_" + rank)
        node.setPosition(x, y)
        node.scale = scale || 1

        // ========== 布局计算（修复间距）==========
        // 以头像中心为基准(Y=0)，其他元素相对定位
        // 从上到下依次排列：名次 → 头像 → 昵称 → 金币
        // 🔧【修复】增大各元素之间的间距
        var layoutConfig = {
            rankY: 65,       // 名次Y坐标（头像上方65px，增大间距）
            avatarY: 0,      // 头像Y坐标（基准位置）
            nameY: -60,      // 昵称Y坐标（头像下方60px，增大间距）
            coinY: -90       // 金币Y坐标（昵称下方30px，增大间距）
        };

        // ========== 名次标签（最上面）==========
        var rankLabelNode = new cc.Node("RankLabel")
        rankLabelNode.setPosition(0, layoutConfig.rankY)
        var rankLabel = rankLabelNode.addComponent(cc.Label)
        rankLabel.string = this._getRankText(rank)
        rankLabel.fontSize = 22
        rankLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        rankLabelNode.color = rank === 1 ? new cc.Color(255, 215, 0) : new cc.Color(200, 200, 220)
        var rankOutline = rankLabelNode.addComponent(cc.LabelOutline)
        rankOutline.color = new cc.Color(50, 50, 80)
        rankOutline.width = 2
        rankLabelNode.parent = node

        // ========== 头像区域（名次下方）==========
        // 🔧【修复】根据排名调整头像大小
        var avatarSize = rank === 1 ? 70 : 60  // 冠军头像更大
        var avatarRadius = avatarSize / 2 + 2
        
        var avatarContainer = new cc.Node("AvatarContainer")
        avatarContainer.setPosition(0, layoutConfig.avatarY)
        avatarContainer.setContentSize(avatarSize, avatarSize)
        
        // 头像背景（圆形）
        var avatarBg = new cc.Node("AvatarBg")
        var avatarBgGraphics = avatarBg.addComponent(cc.Graphics)
        avatarBgGraphics.fillColor = new cc.Color(60, 70, 100)
        avatarBgGraphics.circle(0, 0, avatarRadius)
        avatarBgGraphics.fill()
        avatarBgGraphics.strokeColor = rank === 1 ? new cc.Color(255, 215, 0) : new cc.Color(150, 150, 180)
        avatarBgGraphics.lineWidth = rank === 1 ? 3 : 2
        avatarBgGraphics.circle(0, 0, avatarRadius)
        avatarBgGraphics.stroke()
        avatarBg.parent = avatarContainer

        // 头像精灵
        var avatarSpriteNode = new cc.Node("AvatarSprite")
        var avatarSprite = avatarSpriteNode.addComponent(cc.Sprite)
        avatarSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM
        avatarSpriteNode.setContentSize(avatarSize - 4, avatarSize - 4)
        avatarSpriteNode.parent = avatarContainer

        avatarContainer.parent = node

        // ========== 昵称标签（头像下方）==========
        // 🔧【修复】增大字体，限制宽度防止溢出
        var nameLabelNode = new cc.Node("NameLabel")
        nameLabelNode.setPosition(0, layoutConfig.nameY)
        nameLabelNode.setContentSize(120, 30)  // 限制宽度
        var nameLabel = nameLabelNode.addComponent(cc.Label)
        nameLabel.string = "玩家昵称"
        nameLabel.fontSize = rank === 1 ? 20 : 18  // 冠军字体稍大
        nameLabel.lineHeight = 24
        nameLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        nameLabel.overflow = cc.Label.Overflow.CLAMP  // 防止溢出
        nameLabelNode.color = new cc.Color(255, 255, 255)
        var nameOutline = nameLabelNode.addComponent(cc.LabelOutline)
        nameOutline.color = new cc.Color(30, 30, 50)
        nameOutline.width = 1
        nameLabelNode.parent = node

        // ========== 金币标签（昵称下方）==========
        // 🔧【修复】增大字体和间距，更醒目
        var coinLabelNode = new cc.Node("CoinLabel")
        coinLabelNode.setPosition(0, layoutConfig.coinY)
        var coinLabel = coinLabelNode.addComponent(cc.Label)
        coinLabel.string = "0金币"
        coinLabel.fontSize = rank === 1 ? 18 : 16  // 冠军字体稍大
        coinLabel.lineHeight = 20
        coinLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        coinLabelNode.color = rank === 1 ? new cc.Color(255, 215, 0) : new cc.Color(255, 200, 100)  // 冠军金色
        var coinOutline = coinLabelNode.addComponent(cc.LabelOutline)
        coinOutline.color = new cc.Color(80, 50, 0)
        coinOutline.width = 1
        coinLabelNode.parent = node

        return node
    },

    /**
     * 🔧【修复】创建领奖台底部
     * 修复：调整位置与领奖台项目对齐
     */
    _createPodiumBase: function(parentNode, y) {
        var spacingX = 280  // 与领奖台项目间距一致
        
        // 冠军台（最高，最宽）
        var championBase = new cc.Node("ChampionBase")
        championBase.setPosition(0, y - 20)  // 对齐冠军位置
        var cg1 = championBase.addComponent(cc.Graphics)
        cg1.fillColor = new cc.Color(180, 140, 60, 200)
        cg1.roundRect(-80, -30, 160, 60, 10)
        cg1.fill()
        cg1.strokeColor = new cc.Color(220, 180, 80)
        cg1.lineWidth = 2
        cg1.roundRect(-80, -30, 160, 60, 10)
        cg1.stroke()
        championBase.parent = parentNode

        // 亚军台（中等）
        var runnerUpBase = new cc.Node("RunnerUpBase")
        runnerUpBase.setPosition(-spacingX, y - 30)  // 对齐亚军位置
        var cg2 = runnerUpBase.addComponent(cc.Graphics)
        cg2.fillColor = new cc.Color(120, 130, 150, 200)
        cg2.roundRect(-65, -25, 130, 50, 8)
        cg2.fill()
        cg2.strokeColor = new cc.Color(160, 170, 190)
        cg2.lineWidth = 2
        cg2.roundRect(-65, -25, 130, 50, 8)
        cg2.stroke()
        runnerUpBase.parent = parentNode

        // 季军台（最低）
        var thirdBase = new cc.Node("ThirdBase")
        thirdBase.setPosition(spacingX, y - 30)  // 对齐季军位置
        var cg3 = thirdBase.addComponent(cc.Graphics)
        cg3.fillColor = new cc.Color(150, 110, 90, 200)
        cg3.roundRect(-65, -25, 130, 50, 8)
        cg3.fill()
        cg3.strokeColor = new cc.Color(180, 140, 110)
        cg3.lineWidth = 2
        cg3.roundRect(-65, -25, 130, 50, 8)
        cg3.stroke()
        thirdBase.parent = parentNode
    },

    /**
     * 🔧【修复】创建我的排名区域
     * 修复：调整位置、居中对齐、增大容器尺寸
     */
    _createMyRankArea: function(parentNode) {
        var container = new cc.Node("MyRankContainer")
        container.setPosition(0, -200)  // 下移避免与领奖台重叠
        container.setContentSize(600, 60)  // 增大容器尺寸

        // 背景框 - 更宽更清晰
        var bgNode = new cc.Node("Bg")
        var bgGraphics = bgNode.addComponent(cc.Graphics)
        bgGraphics.fillColor = new cc.Color(40, 50, 80, 230)
        bgGraphics.roundRect(-300, -30, 600, 60, 12)
        bgGraphics.fill()
        bgGraphics.strokeColor = new cc.Color(100, 120, 160)
        bgGraphics.lineWidth = 2
        bgGraphics.roundRect(-300, -30, 600, 60, 12)
        bgGraphics.stroke()
        bgNode.parent = container

        // 我的排名标签 - 居中对齐
        var myRankNode = new cc.Node("MyRankLabel")
        myRankNode.setPosition(-140, 0)  // 左侧位置
        myRankNode.setContentSize(200, 40)
        var myRankLabel = myRankNode.addComponent(cc.Label)
        myRankLabel.string = "我的排名：第--名"
        myRankLabel.fontSize = 22
        myRankLabel.lineHeight = 28
        myRankLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        myRankLabel.verticalAlign = cc.Label.VerticalAlign.CENTER
        myRankNode.color = new cc.Color(100, 200, 255)
        myRankNode.parent = container
        this.myRankLabel = myRankLabel

        // 分隔符
        var separatorNode = new cc.Node("Separator")
        separatorNode.setPosition(0, 0)
        var sepLabel = separatorNode.addComponent(cc.Label)
        sepLabel.string = "|"
        sepLabel.fontSize = 24
        sepLabel.lineHeight = 28
        separatorNode.color = new cc.Color(150, 150, 180)
        separatorNode.parent = container

        // 金币标签
        var myCoinNode = new cc.Node("MyCoinLabel")
        myCoinNode.setPosition(150, 0)  // 右侧位置
        myCoinNode.setContentSize(200, 40)
        var myCoinLabel = myCoinNode.addComponent(cc.Label)
        myCoinLabel.string = "比赛金币：0"
        myCoinLabel.fontSize = 22
        myCoinLabel.lineHeight = 28
        myCoinLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        myCoinLabel.verticalAlign = cc.Label.VerticalAlign.CENTER
        myCoinNode.color = new cc.Color(255, 200, 100)
        myCoinNode.parent = container
        this.myCoinLabel = myCoinLabel

        container.parent = parentNode
    },

    /**
     * 🔧【修复】创建确认按钮
     * 修复：调整位置，确保不与状态栏重叠，增加按钮样式
     */
    _createConfirmButton: function(parentNode) {
        var btnNode = new cc.Node("ConfirmBtn")
        btnNode.setPosition(0, -270)  // 下移确保与状态栏有足够间距
        btnNode.setContentSize(200, 55)

        // 按钮背景 - 更醒目的样式
        var btnBg = btnNode.addComponent(cc.Graphics)
        btnBg.fillColor = new cc.Color(80, 160, 80)  // 绿色按钮
        btnBg.roundRect(-100, -27.5, 200, 55, 12)
        btnBg.fill()
        btnBg.strokeColor = new cc.Color(120, 200, 120)
        btnBg.lineWidth = 3
        btnBg.roundRect(-100, -27.5, 200, 55, 12)
        btnBg.stroke()

        // 按钮文字
        var btnLabelNode = new cc.Node("Label")
        var btnLabel = btnLabelNode.addComponent(cc.Label)
        btnLabel.string = "确 定"
        btnLabel.fontSize = 26
        btnLabel.lineHeight = 32
        btnLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER
        btnLabelNode.color = new cc.Color(255, 255, 255)
        var btnOutline = btnLabelNode.addComponent(cc.LabelOutline)
        btnOutline.color = new cc.Color(30, 80, 30)
        btnOutline.width = 2
        btnLabelNode.parent = btnNode

        // 添加按钮组件
        var btn = btnNode.addComponent(cc.Button)
        btnNode.on('click', this.onConfirmClick, this)
        btnNode.parent = parentNode

        this.confirmBtn = btn
    },

    // ============================================================
    // 公共方法
    // ============================================================

    /**
     * 设置数据
     * @param {Object} data - { period_no, total_players, top3, top20, my_rank, my_match_coin }
     */
    setData: function(data) {
        console.log("🏆 [TournamentFinalRankDialog] 收到数据:", JSON.stringify(data))
        
        this._data = data
        this._periodNo = data.period_no || ""
        this._totalPlayers = data.total_players || 0
        this._top3 = data.top3 || []
        this._top20 = data.top20 || []
        this._myRank = data.my_rank || 0
        this._myMatchCoin = data.my_match_coin || 0

        // 🔧【调试】打印TOP3数据
        console.log("🏆 [TournamentFinalRankDialog] TOP3数据:")
        for (var i = 0; i < this._top3.length; i++) {
            console.log("  #" + (i+1) + ":", this._top3[i].player_name, "金币:", this._top3[i].match_coin, "机器人:", this._top3[i].is_robot)
        }

        this._updateUI()
    },

    // ============================================================
    // UI更新
    // ============================================================

    _updateUI: function() {
        // 更新期号
        if (this.periodNoLabel) {
            this.periodNoLabel.string = "第" + this._periodNo + "期赛事结束"
        }

        // 更新总参赛人数
        if (this.totalPlayersLabel) {
            this.totalPlayersLabel.string = "共" + this._totalPlayers + "人参赛"
        }

        // 更新前三名
        this._updateTop3()

        // 更新我的排名
        if (this.myRankLabel) {
            if (this._myRank > 0) {
                this.myRankLabel.string = "我的排名：第" + this._myRank + "名"
            } else {
                this.myRankLabel.string = "我的排名：未上榜"
            }
        }

        // 更新我的金币
        if (this.myCoinLabel) {
            this.myCoinLabel.string = "比赛金币：" + this._myMatchCoin
        }
    },

    _updateTop3: function() {
        // 更新冠军
        if (this._top3.length >= 1 && this.championNode) {
            this._updatePodiumNode(this.championNode, this._top3[0], 1)
        }

        // 更新亚军
        if (this._top3.length >= 2 && this.runnerUpNode) {
            this._updatePodiumNode(this.runnerUpNode, this._top3[1], 2)
        }

        // 更新季军
        if (this._top3.length >= 3 && this.thirdPlaceNode) {
            this._updatePodiumNode(this.thirdPlaceNode, this._top3[2], 3)
        }
    },

    /**
     * 更新领奖台节点
     * @param {cc.Node} node - 领奖台节点
     * @param {Object} data - 玩家数据 { player_name, match_coin, avatar, is_robot, player_id }
     * @param {number} rank - 排名
     */
    _updatePodiumNode: function(node, data, rank) {
        // 名次标签
        var rankLabel = node.getChildByName("RankLabel")
        if (rankLabel) {
            var label = rankLabel.getComponent(cc.Label)
            if (label) {
                label.string = this._getRankText(rank)
            }
        }

        // 🔧【修复】处理机器人昵称显示
        var displayName = data.player_name || "玩家"
        if (data.is_robot) {
            displayName = this._getRobotDisplayName(data.player_id, data.player_name)
        }

        // 昵称标签
        var nameLabel = node.getChildByName("NameLabel")
        if (nameLabel) {
            var label = nameLabel.getComponent(cc.Label)
            if (label) {
                label.string = displayName
            }
        }

        // 金币标签
        var coinLabel = node.getChildByName("CoinLabel")
        if (coinLabel) {
            var label = coinLabel.getComponent(cc.Label)
            if (label) {
                label.string = this._formatCoin(data.match_coin || 0) + "金币"
            }
        }

        // 🔧【新增】加载头像
        var avatarContainer = node.getChildByName("AvatarContainer")
        if (avatarContainer) {
            var avatarSpriteNode = avatarContainer.getChildByName("AvatarSprite")
            if (avatarSpriteNode) {
                var avatarSprite = avatarSpriteNode.getComponent(cc.Sprite)
                if (avatarSprite) {
                    this._loadAvatar(avatarSprite, data.avatar, data.is_robot)
                }
            }
        }
        
        console.log("🏆 [_updatePodiumNode] 排名#" + rank + ": " + displayName + ", 金币=" + data.match_coin + ", 机器人=" + data.is_robot)
    },

    /**
     * 🔧【新增】加载头像
     */
    _loadAvatar: function(sprite, avatarUrl, isRobot) {
        if (!sprite) return

        // 机器人使用默认头像
        if (isRobot) {
            var robotAvatarIndex = Math.floor(Math.random() * 3) + 1
            var defaultPath = "UI/headimage/avatar_" + robotAvatarIndex
            cc.resources.load(defaultPath, cc.SpriteFrame, function(err, spriteFrame) {
                if (!err && spriteFrame) {
                    sprite.spriteFrame = spriteFrame
                }
            })
            return
        }

        // 空值处理
        if (!avatarUrl || avatarUrl === "") {
            cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(err, spriteFrame) {
                if (!err && spriteFrame) {
                    sprite.spriteFrame = spriteFrame
                }
            })
            return
        }

        // 远程URL
        if (avatarUrl.indexOf("http") === 0 || avatarUrl.indexOf("//") === 0) {
            cc.assetManager.loadRemote(avatarUrl, { ext: '.png' }, function(err, texture) {
                if (err || !texture) {
                    cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(err2, fallbackSprite) {
                        if (!err2 && fallbackSprite) {
                            sprite.spriteFrame = fallbackSprite
                        }
                    })
                    return
                }
                var spriteFrame = new cc.SpriteFrame(texture)
                sprite.spriteFrame = spriteFrame
            })
        } else {
            // 本地资源
            var localPath = "UI/headimage/" + avatarUrl
            cc.resources.load(localPath, cc.SpriteFrame, function(err, spriteFrame) {
                if (err || !spriteFrame) {
                    cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(err2, fallbackSprite) {
                        if (!err2 && fallbackSprite) {
                            sprite.spriteFrame = fallbackSprite
                        }
                    })
                    return
                }
                sprite.spriteFrame = spriteFrame
            })
        }
    },

    /**
     * 🔧【新增】格式化金币显示
     */
    _formatCoin: function(coin) {
        if (coin >= 10000) {
            return (coin / 10000).toFixed(1) + "万"
        }
        return coin.toString()
    },

    // ============================================================
    // 动画效果
    // ============================================================

    _startChampionEffects: function() {
        // 奖杯弹跳动画
        if (this.trophyNode) {
            var jumpUp = cc.moveBy(0.5, cc.v2(0, 10))
            var jumpDown = cc.moveBy(0.5, cc.v2(0, -10))
            var sequence = cc.sequence(jumpUp, jumpDown)
            var repeat = cc.repeatForever(sequence)
            this.trophyNode.runAction(repeat)
        }

        // 发光效果闪烁
        if (this.championGlowNode) {
            var fadeIn = cc.fadeIn(0.5)
            var fadeOut = cc.fadeOut(0.5)
            var sequence = cc.sequence(fadeIn, fadeOut)
            var repeat = cc.repeatForever(sequence)
            this.championGlowNode.runAction(repeat)
        }

        // 冠军节点缩放呼吸效果
        if (this.championNode) {
            var scaleUp = cc.scaleTo(0.8, 1.05)
            var scaleDown = cc.scaleTo(0.8, 1.0)
            var sequence = cc.sequence(scaleUp, scaleDown)
            var repeat = cc.repeatForever(sequence)
            this.championNode.runAction(repeat)
        }
    },

    _stopChampionEffects: function() {
        if (this.trophyNode) {
            this.trophyNode.stopAllActions()
        }
        if (this.championGlowNode) {
            this.championGlowNode.stopAllActions()
        }
        if (this.championNode) {
            this.championNode.stopAllActions()
        }
    },

    // ============================================================
    // 按钮事件
    // ============================================================

    onConfirmClick: function() {
        console.log("🏆 [TournamentFinalRank] 点击确认，返回大厅")

        // 停止动画
        this._stopChampionEffects()

        // 关闭弹窗
        this.node.destroy()

        // 返回大厅
        cc.director.loadScene("hallScene")
    },

    // ============================================================
    // 辅助方法
    // ============================================================

    _getRankText: function(rank) {
        switch (rank) {
            case 1:
                return "🥇 冠军"
            case 2:
                return "🥈 亚军"
            case 3:
                return "🥉 季军"
            default:
                return "第" + rank + "名"
        }
    },

    /**
     * 🔧【新增】获取机器人显示名称
     * @param {String} playerId - 玩家ID
     * @param {String} originalName - 原始昵称
     * @returns {String} 显示名称
     */
    _getRobotDisplayName: function(playerId, originalName) {
        // 如果原始名称已经是"智能陪练X号"格式，直接返回
        if (originalName && originalName.indexOf("智能陪练") === 0) {
            return originalName
        }
        
        // 否则，生成"智能陪练X号"格式的名称
        var robotIndex = 1
        if (playerId) {
            var lastChar = playerId.toString().slice(-1)
            robotIndex = parseInt(lastChar) || 1
        }
        
        return "智能陪练" + robotIndex + "号"
    }
});
