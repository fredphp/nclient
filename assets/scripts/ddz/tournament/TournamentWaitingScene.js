/**
 * TournamentWaitingScene - 竞技场多桌等待页
 * 
 * 功能：
 * 1. 显示期号、轮次信息
 * 2. 实时显示完成进度（已完成桌数/总桌数）
 * 3. 扑克牌loading动画
 * 4. 接收服务端进度更新
 * 5. 三种状态提示：WAITING / CALCULATING / MATCHING
 * 
 * 设计风格：中国风斗地主竞技场 - 蓝金色
 */

// 状态常量
const TournamentStatus = {
    WAITING: "WAITING",
    CALCULATING: "CALCULATING", 
    MATCHING: "MATCHING"
};

cc.Class({
    extends: cc.Component,

    properties: {
        // 期号标签
        periodNoLabel: {
            type: cc.Label,
            default: null
        },
        // 轮次标签
        roundLabel: {
            type: cc.Label,
            default: null
        },
        // 进度标签（已完成/总数）
        progressLabel: {
            type: cc.Label,
            default: null
        },
        // 进度条
        progressBar: {
            type: cc.ProgressBar,
            default: null
        },
        // 提示文字
        tipLabel: {
            type: cc.Label,
            default: null
        },
        // 状态标签
        statusLabel: {
            type: cc.Label,
            default: null
        },
        // loading动画节点
        loadingNode: {
            type: cc.Node,
            default: null
        },
        // 扑克牌sprite（用于loading动画）
        pokerSprite: {
            type: cc.Sprite,
            default: null
        }
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 初始化数据
        this._periodNo = ""
        this._round = 1
        this._totalRounds = 1
        this._finishedTables = 0
        this._totalTables = 0
        this._isWaiting = false
        this._status = TournamentStatus.WAITING

        // 注册事件监听
        this._registerEvents()
    },

    start () {
        // 启动loading动画
        this._startLoadingAnimation()
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

        // 监听等待进度更新
        if (window.socketCtr) {
            window.socketCtr().onTournamentWaitProgress(function(data) {
                self._onWaitProgress(data)
            })

            window.socketCtr().onTournamentRoundAdvance(function(data) {
                self._onRoundAdvance(data)
            })

            window.socketCtr().onTournamentFinalRank(function(data) {
                self._onFinalRank(data)
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
     * 设置等待页数据
     * @param {Object} data - { period_no, round, total_rounds, finished_tables, total_tables }
     */
    setData: function(data) {
        this._periodNo = data.period_no || ""
        this._round = data.round || 1
        this._totalRounds = data.total_rounds || 1
        this._finishedTables = data.finished_tables || 0
        this._totalTables = data.total_tables || 0
        this._status = data.status || TournamentStatus.WAITING

        this._updateUI()
    },

    /**
     * 更新进度
     * @param {number} finishedTables - 已完成桌数
     */
    updateProgress: function(finishedTables) {
        this._finishedTables = finishedTables
        this._updateProgressUI()
    },

    // ============================================================
    // 事件处理
    // ============================================================

    _onWaitProgress: function(data) {
        console.log("🏆 [TournamentWaiting] 收到进度更新:", JSON.stringify(data))
        
        // 检查期号是否匹配
        if (this._periodNo && data.period_no !== this._periodNo) {
            return
        }

        this._periodNo = data.period_no
        this._round = data.round
        this._totalRounds = data.total_rounds
        this._finishedTables = data.finished_tables
        this._totalTables = data.total_tables
        this._status = data.status || TournamentStatus.WAITING

        this._updateUI()
    },

    _onRoundAdvance: function(data) {
        console.log("🏆 [TournamentWaiting] 进入下一轮:", JSON.stringify(data))
        
        // 检查期号是否匹配
        if (this._periodNo && data.period_no !== this._periodNo) {
            return
        }

        // 更新轮次
        this._round = data.new_round
        this._totalRounds = data.total_rounds

        // 重置进度
        this._finishedTables = 0
        this._status = TournamentStatus.MATCHING
        
        // 更新提示文字
        if (this.tipLabel) {
            this.tipLabel.string = data.message || "进入下一轮..."
        }

        // 可以添加轮次切换动画
        this._playRoundChangeAnimation()
    },

    _onFinalRank: function(data) {
        console.log("🏆 [TournamentWaiting] 比赛结束，显示最终榜单:", JSON.stringify(data))
        
        // 检查期号是否匹配
        if (this._periodNo && data.period_no !== this._periodNo) {
            return
        }

        // 关闭等待页，显示最终榜单
        this._showFinalRankDialog(data)
    },

    // ============================================================
    // UI更新
    // ============================================================

    _updateUI: function() {
        // 更新期号
        if (this.periodNoLabel) {
            this.periodNoLabel.string = "第" + this._periodNo + "期"
        }

        // 更新轮次
        if (this.roundLabel) {
            this.roundLabel.string = "第" + this._round + "轮 / 共" + this._totalRounds + "轮"
        }

        // 更新进度
        this._updateProgressUI()
        
        // 更新状态显示
        this._updateStatusUI()
    },

    _updateProgressUI: function() {
        // 更新进度文字
        if (this.progressLabel) {
            this.progressLabel.string = this._finishedTables + " / " + this._totalTables
        }

        // 更新进度条
        if (this.progressBar && this._totalTables > 0) {
            var progress = this._finishedTables / this._totalTables
            this.progressBar.progress = Math.min(progress, 1.0)
        }

        // 更新提示文字
        if (this.tipLabel) {
            if (this._finishedTables >= this._totalTables) {
                this.tipLabel.string = "全部完成，即将进入下一轮..."
            } else {
                var remaining = this._totalTables - this._finishedTables
                this.tipLabel.string = "正在等待其他玩家完成... (剩余" + remaining + "桌)"
            }
        }
    },
    
    /**
     * 更新状态显示
     */
    _updateStatusUI: function() {
        if (this.statusLabel) {
            switch (this._status) {
                case TournamentStatus.CALCULATING:
                    this.statusLabel.string = "正在统计全场排名..."
                    this.statusLabel.node.color = new cc.Color(255, 200, 100)
                    break
                case TournamentStatus.MATCHING:
                    this.statusLabel.string = "晋级成功！正在匹配下一轮..."
                    this.statusLabel.node.color = new cc.Color(100, 255, 100)
                    break
                default:
                    if (this._finishedTables >= this._totalTables) {
                        this.statusLabel.string = "本轮结束，请稍候..."
                        this.statusLabel.node.color = new cc.Color(255, 220, 150)
                    } else {
                        this.statusLabel.string = "正在等待其他玩家完成..."
                        this.statusLabel.node.color = new cc.Color(200, 200, 220)
                    }
            }
        }
        
        // 根据状态更新提示文字
        if (this.tipLabel) {
            switch (this._status) {
                case TournamentStatus.CALCULATING:
                    this.tipLabel.string = "正在统计全场排名..."
                    break
                case TournamentStatus.MATCHING:
                    this.tipLabel.string = "晋级成功！正在匹配下一轮..."
                    break
                default:
                    if (this._finishedTables >= this._totalTables) {
                        this.tipLabel.string = "全部完成，即将进入下一轮..."
                    } else {
                        var remaining = this._totalTables - this._finishedTables
                        this.tipLabel.string = "正在等待其他玩家完成... (剩余" + remaining + "桌)"
                    }
            }
        }
    },

    // ============================================================
    // 动画
    // ============================================================

    _startLoadingAnimation: function() {
        if (!this.pokerSprite) return

        var self = this
        var rotateAction = cc.rotateBy(2, 360)
        var repeatAction = cc.repeatForever(rotateAction)
        this.pokerSprite.node.runAction(repeatAction)
    },

    _stopLoadingAnimation: function() {
        if (this.pokerSprite) {
            this.pokerSprite.node.stopAllActions()
        }
    },

    _playRoundChangeAnimation: function() {
        // 轮次切换动画：放大-缩小
        if (this.roundLabel) {
            var scaleUp = cc.scaleTo(0.3, 1.2)
            var scaleDown = cc.scaleTo(0.3, 1.0)
            var sequence = cc.sequence(scaleUp, scaleDown)
            this.roundLabel.node.runAction(sequence)
        }
    },

    // ============================================================
    // 显示最终榜单
    // ============================================================

    _showFinalRankDialog: function(data) {
        // 停止loading动画
        this._stopLoadingAnimation()

        // 🔧【修复】动态创建弹窗，不依赖prefab文件
        var dialogNode = new cc.Node("TournamentFinalRankDialog")
        dialogNode.setPosition(0, 0)
        dialogNode.setContentSize(cc.winSize.width, cc.winSize.height)
        
        // 添加脚本组件
        var dialogComp = dialogNode.addComponent("TournamentFinalRankDialog")
        
        // 添加到当前场景
        this.node.addChild(dialogNode)
        
        // 设置数据
        if (dialogComp) {
            dialogComp.setData(data)
        }
        
        console.log("🏆 [TournamentWaiting] 最终榜单弹窗已创建")
    },

    // ============================================================
    // 返回大厅
    // ============================================================

    onBackToHallClick: function() {
        // 返回大厅场景
        cc.director.loadScene("hallScene")
    }
});
