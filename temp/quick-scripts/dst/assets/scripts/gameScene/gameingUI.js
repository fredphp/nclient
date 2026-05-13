
                (function() {
                    var nodeEnv = typeof require !== 'undefined' && typeof process !== 'undefined';
                    var __module = nodeEnv ? module : {exports:{}};
                    var __filename = 'preview-scripts/assets/scripts/gameScene/gameingUI.js';
                    var __require = nodeEnv ? function (request) {
                        return cc.require(request);
                    } : function (request) {
                        return __quick_compile_project__.require(request, __filename);
                    };
                    function __define (exports, require, module) {
                        if (!nodeEnv) {__quick_compile_project__.registerModule(__filename, module);}"use strict";
cc._RF.push(module, '77743SDxfxJ26racOmhW9tt', 'gameingUI');
// scripts/gameScene/gameingUI.js

"use strict";

// 使用全局变量，不使用 require
// 【彻底修复版本】服务端数据为唯一数据源
// 
// 核心原则：
// 1. handCards 是唯一数据源，保存服务端原始数据
// 2. 禁止任何数据转换、排序、重新计算
// 3. renderCards() 是唯一渲染入口
// 4. 动画只是视觉效果，绝不能修改数据
// 5. clearAllCards() 清理所有旧节点（解决背面牌残留）

var isopen_sound = window.isopen_sound || 1;
var qian_state = window.qian_state || {
  buqiang: 0,
  qian: 1
};
var CardsValue = window.CardsValue || {};
var RoomState = window.RoomState || {};

// 音效缓存
var _audioClips = {};

// 牌布局配置
var CardLayout = {
  cardScale: 0.8,
  cardY: -250,
  cardSpacing: 35,
  bottomCardScale: 0.4,
  bottomCardSpacing: 25,
  outCardScale: 0.5,
  outCardSpacing: 25
};

// 发牌动画配置
var DealConfig = {
  animDuration: 0.12,
  deckPosition: cc.v2(0, 100),
  cardInterval: 80
};

// 加载并播放音效
function playSound(path) {
  if (!isopen_sound) return null;
  if (_audioClips[path]) {
    return cc.audioEngine.play(_audioClips[path], false, 1);
  }
  cc.resources.load(path, cc.AudioClip, function (err, clip) {
    if (err) {
      return;
    }
    _audioClips[path] = clip;
    cc.audioEngine.play(clip, false, 1);
  });
  return null;
}
cc.Class({
  "extends": cc.Component,
  properties: {
    gameingUI: cc.Node,
    card_prefab: cc.Prefab,
    robUI: cc.Node,
    bottom_card_pos_node: cc.Node,
    playingUI_node: cc.Node,
    tipsLabel: cc.Label,
    cards_node: cc.Node,
    // 手牌节点容器
    // 🕐【新增】倒计时Label引用
    bidCountdownLabel: cc.Label,
    // 抢地主倒计时
    playCountdownLabel: cc.Label,
    // 出牌倒计时
    // 🔊【新增】滴答音效（3秒催促音效）
    tickAudio: {
      "default": null,
      type: cc.AudioClip
    }
  },
  onLoad: function onLoad() {
    var myglobal = window.myglobal;
    if (!myglobal) {
      console.error("myglobal 未定义");
      return;
    }

    // 🔧【修复】确保手牌容器节点存在
    if (!this.cards_node) {
      // 查找是否已存在手牌容器节点
      var gameSceneNode = this.node.parent;
      if (gameSceneNode) {
        for (var i = 0; i < gameSceneNode.children.length; i++) {
          var child = gameSceneNode.children[i];
          if (child.name === "cards_node" || child.name === "cards" || child.name === "handCards") {
            this.cards_node = child;
            break;
          }
        }
        // 如果没找到，创建一个新的容器节点
        if (!this.cards_node) {
          var newCardsNode = new cc.Node("cards_node");
          newCardsNode.parent = gameSceneNode;
          newCardsNode.setPosition(0, 0);
          newCardsNode.setAnchorPoint(0.5, 0.5);
          newCardsNode.setContentSize(cc.size(800, 200));
          this.cards_node = newCardsNode;
        }
      }
    }

    // ============================================================
    // 【核心】唯一数据源 - 服务端原始手牌数据
    // 【重要】禁止任何修改、排序、转换
    // ============================================================
    this.handCards = []; // 【唯一数据源】服务端原始手牌
    this.bottomCards = []; // 底牌数据
    this.choose_card_data = []; // 选中的牌

    // 抢地主相关
    this.rob_player_accountid = 0;
    this._biddingPhase = "idle";
    this._gamePhase = "idle"; // 🔧【新增】游戏阶段: idle, bidding, playing
    this.cardsReady = false;

    // 🕐【倒计时系统】
    this._bidTimeout = 0;
    this._playTimeout = 0;
    this._bidCountdownTimer = null;
    this._playCountdownTimer = null;
    this._bidTimeLeft = 0;
    this._playTimeLeft = 0;
    this._isBidCountdownTicking = false;
    this._isPlayCountdownTicking = false;
    this._isBidWarning = false;
    this._isPlayWarning = false;
    this._bidExpiresAt = 0; // 🔧【新增】服务端过期时间戳（毫秒）

    // 底牌节点
    this.bottom_card = [];

    // ============================================================
    // 【竞技场】状态变量
    // ============================================================
    this._isCompetition = false; // 是否是竞技场模式
    this._roomCategory = 1; // 房间类型：1=普通场，2=竞技场
    this._matchCoin = 0; // 比赛金币
    this._competitionRound = 0; // 当前轮次
    this._competitionTotalRounds = 0; // 总轮次
    this._competitionCountdown = 0; // 竞技场倒计时
    this._competitionCountdownTimer = null; // 竞技场倒计时定时器
    this._wasDisconnected = false; // 是否在比赛中掉线

    // ============ 服务器消息监听 ============

    // 【核心】监听服务器发牌消息 - 唯一数据入口
    myglobal.socket.onPushCards(function (data) {
      console.log("🃏 ========== 服务端发牌消息 ==========");
      console.log("🃏 服务端原始手牌:", JSON.stringify(data.cards));
      console.log("🃏 服务端原始底牌:", JSON.stringify(data.bottom_cards));

      // 🔧【关键修复】新一轮发牌时，关闭上一轮的结算弹窗
      if (this._gameResultPopup || this._gameResultMask) {
        console.log("🃏 [onPushCards] 关闭上一轮的结算弹窗");
        this._closeGameResultPopup(this._gameResultPopup, this._gameResultMask);
      }

      // 🔧【修复】停止所有竞技场倒计时
      this._stopArenaCountdown();

      // 🔧【关键修复】清理桌面上的牌（上一轮最后一手牌）
      console.log("🃏 [onPushCards] 清理桌面上的牌");
      this._clearAllOutCardZones();

      // 【核心】直接保存服务端数据，不做任何转换
      this.handCards = data.cards || [];
      this.bottomCards = data.bottom_cards || [];

      // 【核心】唯一渲染入口
      this.renderCards(this.handCards);
    }.bind(this));

    // 监听叫地主轮次（旧版消息，仅用于兼容）
    myglobal.socket.onBidTurn(function (data) {
      // 不再处理，避免重复
    }.bind(this));

    // 监听叫地主结果
    myglobal.socket.onBidResult(function (data) {
      // 🔒【重要】收到结果，停止倒计时
      this._stopBidCountdown();
      if (this.node && this.node.parent) {
        this.node.parent.emit("bid_result_event", {
          player_id: data.accountid,
          bid: data.state
        });
      }
    }.bind(this));

    // 监听抢地主轮次（旧版消息，仅用于兼容）
    myglobal.socket.onCanRobState(function (data) {
      // 不再处理，避免重复
    }.bind(this));

    // 监听出牌轮次
    myglobal.socket.onCanChuCard(function (data) {
      var playerId = data.player_id || data;
      var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID;

      // 🔒【重要】先停止之前的倒计时（服务器轮转了）
      this._stopPlayCountdown();

      // 🔧【新增】保存出牌状态，用于提示功能
      this._mustPlay = data.must_play || false;
      this._canBeat = data.can_beat || false;
      this._lastPlayedCards = null; // 上家出的牌，需要从 onOtherPlayerChuCard 获取

      if (String(playerId) === String(myPlayerId)) {
        this._hideRobUI();
        this.clearOutZone(myPlayerId);
        this.playingUI_node.active = true;
        this._playTimeout = data.timeout || 15;
        this._startPlayCountdown();
      } else {
        if (this.playingUI_node) {
          this.playingUI_node.active = false;
        }
      }
    }.bind(this));

    // 监听其他玩家出牌
    myglobal.socket.onOtherPlayerChuCard(function (data) {
      // 🔒【重要】收到出牌消息，停止我的倒计时
      this._stopPlayCountdown();
      if (this.playingUI_node) {
        this.playingUI_node.active = false;
      }

      // 🔧【修复】处理不出的情况
      if (data.is_pass) {
        // 🔊【新增】播放不出音效
        this._playPassSound(data);
        // 🔊【新增】显示不出效果
        this._showPassEffect(data.accountid);
        // 🔧【新增】不出时不清除上家出的牌
        return;
      }

      // 🔧【新增】保存上家出的牌，用于提示功能
      this._lastPlayedCards = data.cards || [];
      this._lastPlayedHandType = data.hand_type || "";
      if (!this.node || !this.node.parent) return;

      // 🔧【修复】获取当前玩家ID，判断是否是自己出牌
      // 🔧【关键】安全获取玩家ID，避免报错
      var socketInfo = myglobal.socket.getPlayerInfo() || {};
      var serverPlayerId = myglobal.playerData && myglobal.playerData.serverPlayerId || "";
      var accountId = myglobal.playerData && myglobal.playerData.accountID || "";
      var myPlayerId = socketInfo.id || serverPlayerId || accountId;

      // 🔧【关键】使用更安全的比较方式
      var isSelf = String(data.accountid || "") === String(myPlayerId || "");

      // 🔧【调试】详细打印ID比较信息

      // 🔧【核心修复】如果是自己出牌，从手牌中删除
      if (isSelf) {
        this._removeCardsFromHand(data.cards);
      } else {}

      // 🔊【新增】播放出牌音效
      this._playCardSound(data);

      // 显示出的牌到桌面
      var gameScene_script = this.node.parent.getComponent("gameScene");
      if (!gameScene_script) return;
      var outCard_node = gameScene_script.getUserOutCardPosByAccount(data.accountid);
      if (!outCard_node || !this.card_prefab) return;

      // 【重要】直接使用服务端数据创建节点
      var node_cards = [];
      for (var i = 0; i < data.cards.length; i++) {
        var card = cc.instantiate(this.card_prefab);
        if (card) {
          var cardScript = card.getComponent("card");
          if (cardScript) {
            cardScript.showCards(data.cards[i], myglobal.playerData.accountID);
          }
          node_cards.push(card);
        }
      }
      this.showOutCards(outCard_node, node_cards);

      // 更新剩余牌数
      if (data.cards_left !== undefined) {
        this.node.parent.emit("update_card_count_event", {
          accountid: data.accountid,
          count: data.cards_left
        });
      }
    }.bind(this));

    // 监听抢地主阶段开始
    myglobal.socket.onCallLandlordStart(function (data) {
      this._biddingPhase = "bidding";
      this._gamePhase = "bidding"; // 🔧【新增】设置游戏阶段
    }.bind(this));

    // 监听抢地主轮次
    myglobal.socket.onCallLandlordTurn(function (data) {
      this._processCallLandlordTurn(data);
    }.bind(this));

    // 监听抢地主结果
    myglobal.socket.onCallLandlordResult(function (data) {
      // 🔒【重要】收到结果，停止倒计时
      this._stopBidCountdown();

      // 🔧【新增】播放抢地主语音
      this._playRobSound(data);
      if (this.node && this.node.parent) {
        this.node.parent.emit("call_landlord_result_event", data);
      }
    }.bind(this));

    // 监听抢地主阶段结束
    myglobal.socket.onCallLandlordEnd(function (data) {
      // 🔒【重要】停止所有倒计时
      this._stopBidCountdown();
      this._hideRobUI();
      this._biddingPhase = "idle";

      // 🔧【关键修复】重置抢地主相关状态
      this.rob_player_accountid = 0;
      this.cardsReady = false; // 重置发牌完成标记

      // 🔧【关键】保存底牌数据
      if (data.bottom_cards && data.bottom_cards.length > 0) {
        this.bottomCards = data.bottom_cards;
      }

      // 🔧【重要】显示底牌（所有玩家都能看到）
      this._showBottomCardsToAll(data.bottom_cards);
    }.bind(this));

    // 🔧【新增】监听地主新手牌消息 - 只更新地主的手牌，不触发重新发牌
    // 🔧【关键修复】必须验证自己是否是地主，只有地主才更新手牌
    myglobal.socket.onLandlordCards(function (data) {
      // 🔧【关键验证】检查自己是否是地主
      var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID;
      var landlordId = data.landlord_id || "";

      // 🔧【关键】只有当地主ID匹配自己时才更新手牌
      if (String(landlordId) !== String(myPlayerId)) {
        return;
      }

      // 【重要】只更新手牌数据，不重新渲染整个场景
      this.handCards = data.cards || [];
      this.bottomCards = data.bottom_cards || [];

      // 【重要】使用静默更新，不触发发牌动画
      this._updateLandlordHandCards(this.handCards);
    }.bind(this));

    // 监听重新发牌通知（所有人都不叫地主）
    myglobal.socket.onRestartGame(function (data) {
      // 停止所有倒计时
      this._stopBidCountdown();
      this._stopPlayCountdown();
      // 隐藏抢地主UI
      this._hideRobUI();
      // 重置状态
      this._biddingPhase = "idle";
      this._gamePhase = "idle"; // 🔧【新增】重置游戏阶段
      this.cardsReady = false;
      this.handCards = [];
      this.bottomCards = [];
      this.choose_card_data = [];
      // 清理所有卡牌节点
      this.clearAllCards();
    }.bind(this));

    // 🔧【新增】监听出牌阶段开始
    myglobal.socket.onPlayStart(function (data) {
      // 🔧【关键】设置游戏阶段为出牌阶段
      this._gamePhase = "playing";
      this._biddingPhase = "idle";
      // 隐藏抢地主UI（确保不显示）
      this._hideRobUI();
    }.bind(this));

    // 🔊【新增】监听游戏结束
    myglobal.socket.onGameOver(function (data) {
      // 停止所有倒计时
      this._stopPlayCountdown();

      // 🔧【新增】重置游戏阶段
      this._gamePhase = "idle";
      this._biddingPhase = "idle";

      // 🔧【新增】游戏结束时立即重置所有玩家的准备状态
      this._resetAllPlayerReadyState();

      // 🔧【新增】显示结算弹窗
      this._showGameResultPopup(data);
    }.bind(this));

    // 监听游戏状态恢复
    myglobal.socket.onGameStateRestore(function (data) {
      this.restoreGameState(data);
    }.bind(this));

    // 🔧【新增】监听提示结果
    myglobal.socket.onHintResult(function (data) {
      this._onHintResult(data);
    }.bind(this));

    // 🔧【托管】监听托管状态变化
    myglobal.socket.onTrusteeStateNotify(function (data) {
      this._onTrusteeStateNotify(data);
    }.bind(this));

    // ============================================================
    // 【竞技场】消息监听
    // ============================================================

    // 监听竞技场状态更新
    myglobal.socket.onCompetitionStatus(function (data) {
      this._onCompetitionStatus(data);
    }.bind(this));

    // 监听竞技场倒计时
    myglobal.socket.onCompetitionCountdown(function (data) {
      this._onCompetitionCountdown(data);
    }.bind(this));

    // 监听比赛金币更新
    myglobal.socket.onMatchCoinUpdate(function (data) {
      this._onMatchCoinUpdate(data);
    }.bind(this));

    // 监听淘汰通知
    myglobal.socket.onCompetitionEliminated(function (data) {
      this._onCompetitionEliminated(data);
    }.bind(this));

    // 监听晋级通知
    myglobal.socket.onCompetitionAdvance(function (data) {
      this._onCompetitionAdvance(data);
    }.bind(this));

    // 监听冠军弹窗
    myglobal.socket.onCompetitionChampion(function (data) {
      this._onCompetitionChampion(data);
    }.bind(this));

    // 🔧【关键修复】监听最终榜单消息
    // 当竞技场所有轮次结束时，服务端会发送此消息
    myglobal.socket.onTournamentFinalRank(function (data) {
      console.log("🏆 [gameingUI] 收到最终榜单:", JSON.stringify(data));
      this._onTournamentFinalRank(data);
    }.bind(this));

    // 内部事件：显示底牌
    // 🔧【关键修复】此事件已废弃，逻辑已移到 onCallLandlordEnd 和 onLandlordCards
    // 保留此监听器仅用于兼容旧版本，不再触发 pushThreeCard
    this.node.on("show_bottom_card_event", function (data) {
      // 🔧【修复】data 可能是 { cards: [...] } 对象或数组
      var cards = data;
      if (data && data.cards) {
        cards = data.cards;
      }

      // 如果 cards 为空，不处理
      if (!cards || cards.length === 0) {
        return;
      }

      // 🔧【关键修复】不再调用 pushThreeCard！
      // 底牌显示已由 _showBottomCardsToAll 处理
      // 地主手牌更新已由 onLandlordCards 处理
      // 删除以下代码，避免重复处理和延迟：
      // this.scheduleOnce(this.pushThreeCard, 0.2)
    }.bind(this));

    // 🔧【修复】注册监听选择牌消息
    // card.js 是在 gameScene_node (this.node.parent) 上 emit 事件
    // 所以必须在 this.node.parent 上监听，而不是 this.node
    var gameScene_node = this.node.parent;
    if (gameScene_node) {
      gameScene_node.on("choose_card_event", function (event) {
        this.choose_card_data.push(event);
        // 🔧【新增】更新已选牌数显示
        this._updateSelectedCountDisplay();
      }.bind(this));
      gameScene_node.on("unchoose_card_event", function (event) {
        // 🔧【修复】正确匹配卡牌的唯一标识符（suit + rank）
        // event 现在是 {suit, rank} 对象
        for (var i = 0; i < this.choose_card_data.length; i++) {
          var cardid = this.choose_card_data[i].cardid;
          // 检查是否匹配（兼容新旧两种格式）
          if (cardid && cardid.suit !== undefined && cardid.rank !== undefined) {
            // 新格式：cardid 是对象 {suit, rank}
            if (cardid.suit === event.suit && cardid.rank === event.rank) {
              this.choose_card_data.splice(i, 1);
              break;
            }
          } else if (cardid == event) {
            // 旧格式兼容：cardid 是数字
            this.choose_card_data.splice(i, 1);
            break;
          }
        }
        // 🔧【新增】更新已选牌数显示
        this._updateSelectedCountDisplay();
      }.bind(this));
    }
  },
  start: function start() {},
  onDestroy: function onDestroy() {
    this._stopPlayCountdown();
    this._stopBidCountdown();

    // 【竞技场】清理竞技场倒计时
    if (this._competitionCountdownTimer) {
      this.unschedule(this._competitionCountdownTick);
      this._competitionCountdownTimer = null;
    }

    // 🔧【新增】清理本地竞技场倒计时
    if (this._localArenaCountdownTimer) {
      this.unschedule(this._localArenaCountdownTick);
      this._localArenaCountdownTimer = null;
    }

    // 【竞技场】清理比赛金币显示
    this._hideMatchCoinDisplay();
  },
  // ============================================================
  // 【核心】唯一渲染入口
  // ============================================================

  /**
   * 【核心】渲染手牌 - 唯一入口
   * @param {Array} cards - 服务端原始手牌数据
   */
  renderCards: function renderCards(cards) {
    if (!cards || cards.length === 0) {
      return;
    }

    // 🔥【防重复渲染】检查是否与上次相同
    var hash = JSON.stringify(cards);
    if (this._lastRenderHash === hash) {
      return;
    }
    this._lastRenderHash = hash;

    // 【核心】使用斗地主规则排序：大王 > 小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3
    var sortedCards = this._sortCards(cards);

    // 【核心】清理所有旧节点（解决背面牌残留）
    this.clearAllCards();

    // 创建底牌节点
    this._createBottomCards();

    // 隐藏出牌UI
    if (this.playingUI_node) {
      this.playingUI_node.active = false;
    }

    // 🎬【修复】使用逐张发牌动画
    this._dealCardsWithAnimation(sortedCards);
  },
  /**
   * 🎬【新增】逐张发牌动画
   * @param {Array} sortedCards - 已排序的手牌数据
   */
  _dealCardsWithAnimation: function _dealCardsWithAnimation(sortedCards) {
    var self = this;
    var myglobal = window.myglobal;
    var cardInterval = DealConfig.cardInterval / 1000; // 转换为秒
    var animDuration = DealConfig.animDuration;

    // 🔧【修复】确保手牌容器存在
    var cardParent = this.cards_node;
    if (!cardParent) {
      console.error("🎮 [_dealCardsWithAnimation] cards_node 未定义");
      return;
    }

    // 发牌起始位置（屏幕中央上方，模拟发牌堆）
    var deckPos = cc.v2(DealConfig.deckPosition.x, DealConfig.deckPosition.y);

    // 逐张发牌
    for (var i = 0; i < sortedCards.length; i++) {
      (function (index) {
        self.scheduleOnce(function () {
          var cardData = sortedCards[index];
          var targetX = self._getCardX(index, sortedCards.length, CardLayout.cardSpacing);
          var targetPos = cc.v2(targetX, CardLayout.cardY);

          // 创建卡牌节点
          var card = cc.instantiate(self.card_prefab);
          if (!card) return;
          card.scale = CardLayout.cardScale;
          card.parent = cardParent; // 🔧【修复】使用确定的手牌容器

          // 🎬 从发牌堆位置开始
          card.setPosition(deckPos);
          card.active = true;
          card.zIndex = index;

          // 设置卡牌显示
          var cardComp = card.getComponent("card");
          if (cardComp) {
            cardComp.showCards(cardData, myglobal.playerData.accountID);
          }

          // 🎬 播放发牌动画
          cc.tween(card).to(animDuration, {
            position: targetPos
          }, {
            easing: 'sineOut'
          }).call(function () {
            // 动画完成回调
          }).start();

          // 🔊 播放发牌音效
          if (isopen_sound) {
            playSound("sound/fapai1");
          }
        }, index * cardInterval);
      })(i);
    }

    // 发牌完成后回调
    var totalDealTime = sortedCards.length * cardInterval + animDuration;
    this.scheduleOnce(function () {
      self._onDealCardsComplete(sortedCards);
    }, totalDealTime);
  },
  /**
   * 🎬【新增】发牌完成回调
   * @param {Array} sortedCards - 已排序的手牌数据
   */
  _onDealCardsComplete: function _onDealCardsComplete(sortedCards) {
    // 标记就绪
    this.cardsReady = true;
    this.fapai_end = true;

    // 通知其他玩家节点
    if (this.node.parent) {
      this.node.parent.emit("pushcard_other_event");
    }

    // 检查是否需要显示抢地主按钮
    this._checkAndShowRobUI();
  },
  /**
   * 【核心】计算牌力值（斗地主规则）
   * 大王=15, 小王=14, 2=13, A=12, K=11, Q=10, J=9, 10=8, ..., 3=1
   * @param {Object} card - 卡牌数据
   * @returns {Number} 牌力值
   */
  getCardValue: function getCardValue(card) {
    var rank = card.rank;
    if (rank === 3) return 1; // 3
    if (rank === 4) return 2; // 4
    if (rank === 5) return 3; // 5
    if (rank === 6) return 4; // 6
    if (rank === 7) return 5; // 7
    if (rank === 8) return 6; // 8
    if (rank === 9) return 7; // 9
    if (rank === 10) return 8; // 10
    if (rank === 11) return 9; // J
    if (rank === 12) return 10; // Q
    if (rank === 13) return 11; // K
    if (rank === 14) return 12; // A
    if (rank === 15) return 13; // 2
    if (rank === 16) return 14; // 小王
    if (rank === 17) return 15; // 大王

    return 0;
  },
  /**
   * 【核心】使用 getCardValue 排序手牌
   * 斗地主标准排序：大王 > 小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3
   * @param {Array} cards - 服务端原始手牌数据
   * @returns {Array} 排序后的手牌数据
   */
  _sortCards: function _sortCards(cards) {
    var self = this;
    // 复制数组，避免修改原数据
    var sortedCards = cards.slice();

    // 使用 getCardValue 从大到小排序
    sortedCards.sort(function (a, b) {
      var valueA = self.getCardValue(a);
      var valueB = self.getCardValue(b);

      // 先按 value 从大到小排序
      if (valueA !== valueB) {
        return valueB - valueA;
      }
      // value 相同时，按花色排序（黑桃 > 红心 > 梅花 > 方块）
      return a.suit - b.suit;
    });
    return sortedCards;
  },
  /**
   * 【核心】清理所有旧节点（解决背面牌残留）
   * 🔥【修复】同时清理 cards_node 和 node.parent，确保无残留
   */
  clearAllCards: function clearAllCards() {
    // 🔧【修复】只清理手牌容器中的节点，不遍历node.parent
    if (this.cards_node) {
      this.cards_node.removeAllChildren();
    } else {
      console.warn("🎮 [clearAllCards] cards_node 未定义");
    }

    // 清空选中的牌数据
    this.choose_card_data = [];
  },
  /**
   * 计算牌的X坐标
   */
  _getCardX: function _getCardX(index, count, spacing) {
    var totalWidth = (count - 1) * spacing;
    var startX = -totalWidth / 2;
    return startX + index * spacing;
  },
  // ============================================================
  // 底牌相关
  // ============================================================

  /**
   * 创建底牌显示（牌背）
   */
  _createBottomCards: function _createBottomCards() {
    // 清理旧底牌
    if (this.bottom_card) {
      for (var i = 0; i < this.bottom_card.length; i++) {
        if (this.bottom_card[i]) {
          this.bottom_card[i].destroy();
        }
      }
    }
    this.bottom_card = [];
    if (!this.bottom_card_pos_node || !this.card_prefab) return;
    var bottomY = this.bottom_card_pos_node.y;
    var bottomStartX = this.bottom_card_pos_node.x - CardLayout.bottomCardSpacing;
    for (var i = 0; i < 3; i++) {
      var di_card = cc.instantiate(this.card_prefab);
      if (!di_card) continue;
      di_card.scale = CardLayout.bottomCardScale;
      di_card.setPosition(bottomStartX + CardLayout.bottomCardSpacing * i, bottomY);
      di_card.parent = this.node.parent;
      di_card.active = true;
      this.bottom_card.push(di_card);
    }
  },
  // ============================================================
  // 叫地主/抢地主相关
  // ============================================================

  _checkAndShowRobUI: function _checkAndShowRobUI() {
    var myglobal = window.myglobal;
    if (!myglobal) return;

    // 🔧【关键修复】如果在出牌阶段，不显示抢地主按钮
    var RoomState = window.RoomState || {};
    if (this._biddingPhase === "idle" && this._gamePhase === "playing") {
      return;
    }
    var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID;
    if (this.rob_player_accountid == myPlayerId && this.cardsReady && this.robUI && !this.robUI.active) {
      if (this._biddingPhase === "bidding") {
        this._showBidUI("叫地主", "不叫");
      } else {
        this._showBidUI("抢地主", "不抢");
      }
    }
  },
  _processCallLandlordTurn: function _processCallLandlordTurn(data) {
    var myglobal = window.myglobal;
    if (!myglobal) return;
    var playerId = data.player_id;
    var timeout = data.timeout || 15;
    var round = data.round || 1;
    var expiresAt = data.expires_at || 0; // 🔧【新增】服务端过期时间戳（毫秒）

    // 🔒【重要】先停止之前的倒计时（服务器轮转了）
    this._stopBidCountdown();
    this.rob_player_accountid = playerId;
    this._bidTimeout = timeout;
    this._biddingPhase = round === 1 ? "bidding" : "robbing";
    this._bidExpiresAt = expiresAt; // 🔧【新增】保存过期时间

    var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID;
    if (String(playerId) === String(myPlayerId) && this.cardsReady) {
      if (round === 1) {
        this._showBidUI("叫地主", "不叫");
      } else {
        this._showBidUI("抢地主", "不抢");
      }
    } else {
      this._hideRobUI();
      if (this.node && this.node.parent) {
        this.node.parent.emit("call_landlord_turn_event", {
          player_id: playerId,
          timeout: timeout,
          round: round,
          expires_at: expiresAt
        });
      }
    }
  },
  _showBidUI: function _showBidUI(confirmText, cancelText) {
    if (!this.robUI) return;
    if (this.playingUI_node) {
      this.playingUI_node.active = false;
    }
    var confirmBtn = this.robUI.getChildByName("btn_qiandz");
    var cancelBtn = this.robUI.getChildByName("btn_buqiandz");
    if (confirmBtn) {
      var label = confirmBtn.getChildByName("Label");
      if (label && label.getComponent(cc.Label)) {
        label.getComponent(cc.Label).string = confirmText;
      }
    }
    if (cancelBtn) {
      var label = cancelBtn.getChildByName("Label");
      if (label && label.getComponent(cc.Label)) {
        label.getComponent(cc.Label).string = cancelText;
      }
    }
    this.robUI.active = true;
    this._startBidCountdown();
    if (this.node && this.node.parent) {
      // 🔧【修复】传递包含 timeout 的对象
      this.node.parent.emit("canrob_event", {
        player_id: this.rob_player_accountid,
        timeout: this._bidTimeout || 15
      });
    }
  },
  _hideRobUI: function _hideRobUI() {
    if (this.robUI) {
      this.robUI.active = false;
    }
    this._stopBidCountdown();
  },
  // ============================================================
  // 🕐【倒计时系统】标准斗地主倒计时（带分段催促效果）
  // ============================================================

  /**
   * 🕐【统一入口】开始抢地主倒计时
   * 🔧【修复】根据服务端过期时间计算剩余时间，确保与服务端同步
   * @param {number} duration - 倒计时秒数（备用，如果 expires_at 无效则使用）
   */
  _startBidCountdown: function _startBidCountdown(duration) {
    var self = this;
    // 🔒【防护】先停止之前的倒计时
    this._stopBidCountdown();
    var timeout = duration || this._bidTimeout || 15;
    var expiresAt = this._bidExpiresAt || 0;

    // 🔧【关键修复】根据服务端过期时间计算剩余时间
    var timeLeft = timeout;
    if (expiresAt > 0) {
      var now = Date.now();
      timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
    }
    this._bidTimeLeft = timeLeft;
    this._isBidCountdownTicking = true;
    this._isBidWarning = false;

    // 🕐 初始化UI显示
    this._updateBidCountdownUI();

    // 🕐 使用 cc.Node 的 schedule 实现每秒 tick
    this.schedule(this._bidCountdownTick, 1);
  },
  /**
   * 🕐【核心Tick】抢地主倒计时每秒执行
   */
  _bidCountdownTick: function _bidCountdownTick() {
    if (!this._isBidCountdownTicking) return;
    this._bidTimeLeft--;

    // 🕐 更新UI显示
    this._updateBidCountdownUI();

    // ⚠️ 5秒：进入警告状态
    if (this._bidTimeLeft === 5) {
      this._enterBidWarningState();
    }

    // 🔊 3秒：开始滴答音（每秒一次）
    if (this._bidTimeLeft <= 3 && this._bidTimeLeft > 0) {
      this._playTickSound();
    }

    // ⏰ 0秒：自动处理
    if (this._bidTimeLeft <= 0) {
      this._onBidCountdownEnd();
    }
  },
  /**
   * 🕐【UI更新】更新抢地主倒计时显示
   */
  _updateBidCountdownUI: function _updateBidCountdownUI() {
    var remaining = this._bidTimeLeft;
    var updated = false;

    // 方式1：使用 properties 绑定的 Label
    if (this.bidCountdownLabel) {
      this.bidCountdownLabel.string = String(remaining);
      updated = true;
    }

    // 方式2：尝试从 robUI 中查找倒计时 Label
    if (this.robUI) {
      var clockNode = this.robUI.getChildByName("clock");
      if (clockNode) {
        var children = clockNode.children;
        for (var j = 0; j < children.length; j++) {
          var child = children[j];
          var label = child.getComponent(cc.Label);
          if (label) {
            label.string = String(remaining);
            child.active = true;
            child.opacity = 255;
            label.fontSize = 32;
            label.lineHeight = 40;
            child.setContentSize(50, 50);
            // 🔧【修复】不通过color设置alpha
            child.color = new cc.Color(255, 255, 255);
            child.zIndex = 100;
            updated = true;
            break;
          }
        }
      }
    }

    // 方式3：通知 player_node 更新倒计时
    if (this.node && this.node.parent) {
      this.node.parent.emit("update_countdown_event", {
        type: "bid",
        remaining: remaining
      });
    }
  },
  /**
   * ⚠️【警告状态】5秒时进入警告状态
   */
  _enterBidWarningState: function _enterBidWarningState() {
    if (this._isBidWarning) return;
    this._isBidWarning = true;

    // 获取倒计时 Label 节点
    var labelNode = this._getBidCountdownLabelNode();
    if (!labelNode) return;

    // 变红
    labelNode.color = cc.Color.RED;

    // 🔥 呼吸缩放动画
    labelNode.stopAllActions();
    cc.tween(labelNode).repeatForever(cc.tween().to(0.3, {
      scale: 1.2
    }).to(0.3, {
      scale: 1.0
    })).start();
  },
  /**
   * 🕐【获取节点】获取抢地主倒计时Label节点
   * 🔧【修复】查找 clock 子节点中的 Label
   */
  _getBidCountdownLabelNode: function _getBidCountdownLabelNode() {
    if (this.bidCountdownLabel && this.bidCountdownLabel.node) {
      return this.bidCountdownLabel.node;
    }
    if (this.robUI) {
      // 检查 clock 节点下的 Label
      var clockNode = this.robUI.getChildByName("clock");
      if (clockNode) {
        var children = clockNode.children;
        for (var i = 0; i < children.length; i++) {
          var label = children[i].getComponent(cc.Label);
          if (label) {
            return children[i];
          }
        }
      }
      // 其他可能的名称
      var labelNames = ["clock_ Label", "clock_Label", "time_label", "countdown"];
      for (var j = 0; j < labelNames.length; j++) {
        var labelNode = this.robUI.getChildByName(labelNames[j]);
        if (labelNode && labelNode.getComponent(cc.Label)) {
          return labelNode;
        }
      }
    }
    return null;
  },
  /**
   * ⏰【展示结束】本地倒计时显示结束
   * ⚠️【重要】只做UI处理，不发送请求！
   * 服务器会在超时后自动处理，并发送下一个轮次消息
   */
  _onBidCountdownEnd: function _onBidCountdownEnd() {
    // 停止 tick
    this._isBidCountdownTicking = false;
    this.unschedule(this._bidCountdownTick);

    // 停止动画并恢复状态
    var labelNode = this._getBidCountdownLabelNode();
    if (labelNode) {
      labelNode.stopAllActions();
      labelNode.scale = 1;
      labelNode.color = cc.Color.WHITE;
    }

    // ⚠️【重要】不发送任何请求！
    // 服务器会在超时后自动处理
  },

  /**
   * 🔒【停止】停止抢地主倒计时
   */
  _stopBidCountdown: function _stopBidCountdown() {
    this._isBidCountdownTicking = false;
    this.unschedule(this._bidCountdownTick);

    // 恢复 Label 状态
    var labelNode = this._getBidCountdownLabelNode();
    if (labelNode) {
      labelNode.stopAllActions();
      labelNode.scale = 1;
      labelNode.color = cc.Color.WHITE;
    }
    this._isBidWarning = false;
  },
  // ============================================================
  // 🕐【出牌倒计时】标准斗地主倒计时（带分段催促效果）
  // ============================================================

  /**
   * 🕐【统一入口】开始出牌倒计时
   * @param {number} duration - 倒计时秒数，默认15秒
   */
  _startPlayCountdown: function _startPlayCountdown(duration) {
    var self = this;
    // 🔒【防护】先停止之前的倒计时
    this._stopPlayCountdown();
    var timeout = duration || this._playTimeout || 15;
    this._playTimeLeft = timeout;
    this._isPlayCountdownTicking = true;
    this._isPlayWarning = false;

    // 🕐 初始化UI显示
    this._updatePlayCountdownUI();

    // 🕐 使用 cc.Node 的 schedule 实现每秒 tick
    this.schedule(this._playCountdownTick, 1);
  },
  /**
   * 🕐【核心Tick】出牌倒计时每秒执行
   */
  _playCountdownTick: function _playCountdownTick() {
    if (!this._isPlayCountdownTicking) return;
    this._playTimeLeft--;

    // 🕐 更新UI显示
    this._updatePlayCountdownUI();

    // ⚠️ 5秒：进入警告状态
    if (this._playTimeLeft === 5) {
      this._enterPlayWarningState();
    }

    // 🔊 3秒：开始滴答音（每秒一次）
    if (this._playTimeLeft <= 3 && this._playTimeLeft > 0) {
      this._playTickSound();
    }

    // ⏰ 0秒：自动处理
    if (this._playTimeLeft <= 0) {
      this._onPlayCountdownEnd();
    }
  },
  /**
   * 🕐【UI更新】更新出牌倒计时显示
   * 🔧【修复】只更新闹钟里面的倒计时，不在其他位置显示
   */
  _updatePlayCountdownUI: function _updatePlayCountdownUI() {
    var remaining = this._playTimeLeft;

    // 方式1：使用 properties 绑定的 Label（如果有）
    if (this.playCountdownLabel) {
      this.playCountdownLabel.string = String(remaining);
    }

    // 方式2：通知 player_node 更新倒计时
    if (this.node && this.node.parent) {
      var event = new cc.Event.EventCustom("update_countdown_event", true);
      event.setUserData({
        type: "play",
        remaining: remaining
      });
      this.node.parent.dispatchEvent(event);
    }

    // 方式3：直接更新 playingUI_node 中的闹钟 Label
    // 🔧【修复】闹钟节点路径：playingUI_node -> clock -> playing_clocl_label
    if (this.playingUI_node) {
      var clockNode = this.playingUI_node.getChildByName("clock");
      if (clockNode) {
        // 确保 clock 节点可见
        clockNode.active = true;
        clockNode.opacity = 255;

        // 查找 playing_clocl_label（注意拼写）
        var clockLabel = clockNode.getChildByName("playing_clocl_label");
        if (clockLabel) {
          var label = clockLabel.getComponent(cc.Label);
          if (label) {
            label.string = String(remaining);
            clockLabel.active = true;
            clockLabel.opacity = 255;
          }
        } else {
          // 备选：查找任何 Label 子节点
          var children = clockNode.children;
          for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var label = child.getComponent(cc.Label);
            if (label) {
              label.string = String(remaining);
              child.active = true;
              child.opacity = 255;
              break;
            }
          }
        }
      }
    }
  },
  /**
   * 🔧【新增】更新闹钟里面的倒计时显示
   * @param {number} remaining - 剩余秒数
   */
  _updateClockTimeLabel: function _updateClockTimeLabel(remaining) {
    // 查找 gameScene 节点
    var gameSceneNode = this.node.parent;
    if (!gameSceneNode) return;

    // 遍历所有子节点，找到 player_node（当前玩家）
    var children = gameSceneNode.children;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var playerNodeScript = child.getComponent("player_node");
      if (playerNodeScript && playerNodeScript.seat_index === 0) {
        // 方式1：使用 time_label 属性
        if (playerNodeScript.time_label) {
          playerNodeScript.time_label.string = String(remaining);
        }

        // 方式2：查找 clockimage 节点中的 Label（与抢地主倒计时类似）
        if (playerNodeScript.clockimage) {
          var clockNode = playerNodeScript.clockimage;
          // 确保 clockimage 可见
          clockNode.active = true;
          clockNode.opacity = 255;

          // 查找 clockimage 中的 Label
          var clockChildren = clockNode.children;
          for (var j = 0; j < clockChildren.length; j++) {
            var clockChild = clockChildren[j];
            var label = clockChild.getComponent(cc.Label);
            if (label) {
              label.string = String(remaining);
              clockChild.active = true;
              clockChild.opacity = 255;
              // 设置合适的字体大小
              label.fontSize = 32;
              label.lineHeight = 40;
              clockChild.setContentSize(50, 50);
              // 🔧【修复】不通过color设置alpha
              clockChild.color = new cc.Color(255, 255, 255);
              clockChild.zIndex = 100;
              break;
            }
          }

          // 如果 clockimage 没有 Label 子节点，检查是否直接是 Label
          var directLabel = clockNode.getComponent(cc.Label);
          if (directLabel) {
            directLabel.string = String(remaining);
          }
        }
        break;
      }
    }
  },
  /**
   * ⚠️【警告状态】5秒时进入警告状态
   */
  _enterPlayWarningState: function _enterPlayWarningState() {
    if (this._isPlayWarning) return;
    this._isPlayWarning = true;

    // 获取倒计时 Label 节点
    var labelNode = this._getPlayCountdownLabelNode();
    if (!labelNode) return;

    // 变红
    labelNode.color = cc.Color.RED;

    // 🔥 呼吸缩放动画
    labelNode.stopAllActions();
    cc.tween(labelNode).repeatForever(cc.tween().to(0.3, {
      scale: 1.2
    }).to(0.3, {
      scale: 1.0
    })).start();
  },
  /**
   * 🕐【获取节点】获取出牌倒计时Label节点
   */
  _getPlayCountdownLabelNode: function _getPlayCountdownLabelNode() {
    // 方式1：使用 properties 绑定的 Label
    if (this.playCountdownLabel && this.playCountdownLabel.node) {
      return this.playCountdownLabel.node;
    }

    // 方式2：从 playingUI_node 的闹钟中获取 Label
    // 🔧【修复】闹钟节点路径：playingUI_node -> clock -> playing_clocl_label
    if (this.playingUI_node) {
      var clockNode = this.playingUI_node.getChildByName("clock");
      if (clockNode) {
        // 查找 playing_clocl_label（注意拼写）
        var clockLabel = clockNode.getChildByName("playing_clocl_label");
        if (clockLabel) {
          return clockLabel;
        }
        // 备选：查找任何 Label 子节点
        var children = clockNode.children;
        for (var i = 0; i < children.length; i++) {
          var label = children[i].getComponent(cc.Label);
          if (label) {
            return children[i];
          }
        }
      }
    }
    return null;
  },
  /**
   * ⏰【展示结束】本地出牌倒计时显示结束
   * ⚠️【重要】只做UI处理，不发送请求！
   * 服务器会在超时后自动处理（自动不出），并发送下一个轮次消息
   */
  _onPlayCountdownEnd: function _onPlayCountdownEnd() {
    // 停止 tick
    this._isPlayCountdownTicking = false;
    this.unschedule(this._playCountdownTick);

    // 停止动画并恢复状态
    var labelNode = this._getPlayCountdownLabelNode();
    if (labelNode) {
      labelNode.stopAllActions();
      labelNode.scale = 1;
      labelNode.color = cc.Color.WHITE;
    }

    // ⚠️【重要】不发送任何请求！
    // 服务器会在超时后自动处理：
    // 1. 自动不出
    // 2. 发送 can_chu_card_notify 或 game_over
    // 客户端只需要响应服务器消息
  },

  /**
   * 🔒【停止】停止出牌倒计时
   */
  _stopPlayCountdown: function _stopPlayCountdown() {
    this._isPlayCountdownTicking = false;
    this.unschedule(this._playCountdownTick);

    // 恢复 Label 状态
    var labelNode = this._getPlayCountdownLabelNode();
    if (labelNode) {
      labelNode.stopAllActions();
      labelNode.scale = 1;
      labelNode.color = cc.Color.WHITE;
    }
    this._isPlayWarning = false;
  },
  // ============================================================
  // 🔊【音效】滴答音效（3秒催促）
  // ============================================================

  /**
   * 🔊 播放滴答音效（用于抢地主倒计时）
   */
  _playTickSound: function _playTickSound() {
    if (!isopen_sound) return;

    // 优先使用绑定的音效
    if (this.tickAudio) {
      cc.audioEngine.playEffect(this.tickAudio, false);
      return;
    }

    // 兜底：使用发牌音效（可替换为专用滴答音效）
    playSound("sound/fapai1");
  },
  /**
   * 🔊 播放滴答音效（用于出牌倒计时）
   */
  _playPlayTickSound: function _playPlayTickSound() {
    if (!isopen_sound) return;

    // 优先使用绑定的音效
    if (this.tickAudio) {
      cc.audioEngine.playEffect(this.tickAudio, false);
      return;
    }

    // 兜底：使用发牌音效
    playSound("sound/fapai1");
  },
  // ============================================================
  // 🔊 抢地主语音系统（服务端驱动）
  // ============================================================

  /**
   * 🔊 播放抢地主语音
   * @param {Object} data - 服务端广播的数据
   *   - action: "call" = 抢, "pass" = 不抢
   *   - gender: "male" / "female"
   *   - order: 当前轮次内的操作顺序（1-3）
   *   - round: 当前轮次（1或2）
   */
  _playRobSound: function _playRobSound(data) {
    if (!isopen_sound) return;
    var action = data.action;
    var gender = data.gender || "male";
    var order = data.order || 1;
    var round = data.round || 1;
    var playerID = data.player_id || "";

    // 🔒【防重复机制】检查是否已经播放过相同的音效
    var soundKey = playerID + "_" + action + "_" + round + "_" + order;
    if (this._lastRobSoundKey === soundKey) {
      return;
    }
    this._lastRobSoundKey = soundKey;

    // 不抢
    if (action === "pass") {
      var passSound = gender === "female" ? "m_nv_buqiang" : "m_nan_buqiang";
      this._playSoundEffect(passSound);
      return;
    }

    // 抢地主
    if (gender === "female") {
      // 女玩家
      if (round === 1 && order === 1) {
        // 第1轮第1位
        this._playSoundEffect("m_nv_qiangdizhu_01");
      } else {
        // 第1轮第2/3位 或 第2轮第1位
        var sounds = ["m_nv_qiangdizhu_02", "m_nv_qiangdizhu_woqiang_01"];
        this._playRandomSound(sounds);
      }
    } else {
      // 男玩家
      if (round === 1 && order === 1) {
        // 第1轮第1位
        this._playSoundEffect("m_nan_qiangdizhu");
      } else {
        // 第1轮第2/3位 或 第2轮第1位
        var sounds = ["m_nan_qiangdizhu", "m_nan_qiangdizhu_woqiang"];
        this._playRandomSound(sounds);
      }
    }
  },
  /**
   * 🔊 播放音效（带 fallback 机制）
   * 🔧【重构】移除全局 fallback 到 "大你" 的逻辑
   * @param {String} name - 音效名称（不含扩展名）
   * @param {String} fallback - 可选的 fallback 音效名称（不再自动 fallback 到 "大你"）
   * @param {Boolean} allowDaniFallback - 是否允许最终 fallback 到 "大你"（默认 false）
   */
  _playSoundEffect: function _playSoundEffect(name, fallback, allowDaniFallback) {
    var self = this;
    cc.resources.load("sound/" + name, cc.AudioClip, function (err, clip) {
      if (err) {
        console.warn("🔊 [_playSoundEffect] 加载音效失败: " + name, err.message || err);

        // 🔧【fallback】尝试播放备用音效
        if (fallback) {
          cc.resources.load("sound/" + fallback, cc.AudioClip, function (err2, clip2) {
            if (err2) {
              console.warn("🔊 [_playSoundEffect] fallback 也失败: " + fallback, err2.message || err2);
              // 🔧【重要修改】不再自动 fallback 到 "大你"
              // 只有明确允许时才 fallback
              if (allowDaniFallback && fallback !== "m_cp_dani" && name !== "m_cp_dani") {
                self._playSoundEffect("m_cp_dani", null, false);
              }
              return;
            }
            cc.audioEngine.playEffect(clip2, false);
          });
        } else if (allowDaniFallback && name !== "m_cp_dani") {
          // 🔧【重要修改】不再默认 fallback 到 "大你"
          self._playSoundEffect("m_cp_dani", null, false);
        } else {}
        return;
      }
      cc.audioEngine.playEffect(clip, false);
    });
  },
  /**
   * 🔊 随机播放音效
   * @param {Array} sounds - 音效名称数组
   */
  _playRandomSound: function _playRandomSound(sounds) {
    if (!sounds || sounds.length === 0) return;
    var index = Math.floor(Math.random() * sounds.length);
    this._playSoundEffect(sounds[index]);
  },
  // ============================================================
  // 按钮点击事件
  // ============================================================

  onButtonClick: function onButtonClick(event, customData) {
    var myglobal = window.myglobal;
    switch (customData) {
      case "btn_qiandz":
        // ⚠️【已删除】按钮点击音效 - 音效由服务端广播触发（_playRobSound）
        if (this._biddingPhase === "bidding") {
          this._hideRobUI();
          myglobal.socket.requestBid(true);
        } else {
          this._hideRobUI();
          myglobal.socket.requestRobState(qian_state.qian);
        }
        break;
      case "btn_buqiandz":
        // ⚠️【已删除】按钮点击音效 - 音效由服务端广播触发（_playRobSound）
        if (this._biddingPhase === "bidding") {
          this._hideRobUI();
          myglobal.socket.requestBid(false);
        } else {
          this._hideRobUI();
          myglobal.socket.requestRobState(qian_state.buqiang);
        }
        break;
      case "nopushcard":
        this._stopPlayCountdown();
        // 🔧【修复】只发送不出请求，不本地处理
        myglobal.socket.request_buchu_card([], null);
        this.playingUI_node.active = false;
        break;
      case "tipcard":
        // 🔧【新增】提示按钮功能
        this._onHintButtonClick();
        break;
      case "pushcard":
        if (this.choose_card_data.length === 0) {
          this.tipsLabel.string = "请选择牌!";
          var self = this;
          setTimeout(function () {
            self.tipsLabel.string = "";
          }, 2000);
          return;
        }

        // 🔧【调试日志】打印选中的牌（增强版，显示牌名）
        var selectedCardNames = [];
        for (var i = 0; i < this.choose_card_data.length; i++) {
          var card = this.choose_card_data[i];
          var cardData = card.card_data || card;
          var cardName = this._getCardDisplayName(cardData);
          selectedCardNames.push(cardName);
        }

        // 🔧【新增】客户端牌型验证
        var cardsToPlay = this.choose_card_data.map(function (c) {
          return c.card_data || c;
        });
        var validationResult = this._validateHandType(cardsToPlay);
        if (!validationResult.valid) {
          this.tipsLabel.string = validationResult.message;
          var self = this;
          setTimeout(function () {
            self.tipsLabel.string = "";
          }, 2000);
          return;
        }
        var self = this;
        this._stopPlayCountdown();
        // 🔧【修复】只发送出牌请求，等待服务端广播后再更新手牌
        // 服务端会广播 card_played 消息，由 onOtherPlayerChuCard 处理
        myglobal.socket.request_chu_card(this.choose_card_data, function (err, data) {
          if (err) {
            // 🔧【改进】出牌失败，显示更详细的错误信息
            var errorMsg = data && data.msg || "出牌失败";

            // 获取用户选中的牌型
            var selectedType = validationResult.type || "未知牌型";
            var selectedCount = self.choose_card_data.length;

            // 获取上家的牌型信息
            var lastPlayedType = self._lastPlayedHandType || "未知";
            var lastPlayedCount = self._lastPlayedCards ? self._lastPlayedCards.length : 0;

            // 🔧【新增】获取上家出的牌名
            var lastPlayedCardNames = "";
            if (self._lastPlayedCards && self._lastPlayedCards.length > 0) {
              var names = [];
              for (var i = 0; i < self._lastPlayedCards.length; i++) {
                names.push(self._getCardDisplayName(self._lastPlayedCards[i]));
              }
              lastPlayedCardNames = names.join(",");
            }

            // 构建详细的错误提示
            var detailMsg = errorMsg;
            if (errorMsg.indexOf("大不过") >= 0 || errorMsg.indexOf("打不过") >= 0) {
              // 🔧【增强】显示用户选的牌名
              var yourCards = selectedCardNames.join(",");

              // 牌型不匹配或牌太小
              if (selectedCount !== lastPlayedCount && lastPlayedCount > 0) {
                detailMsg = "牌数不匹配！上家出" + lastPlayedType + "，你选了" + yourCards;
              } else if (selectedType !== lastPlayedType && lastPlayedType !== "炸弹" && lastPlayedType !== "王炸") {
                detailMsg = "牌型不匹配！上家出" + lastPlayedType + "，你选了" + yourCards;
              } else {
                // 🔧【增强】显示具体的牌名比较
                if (lastPlayedCardNames) {
                  detailMsg = "打不过！上家出" + lastPlayedCardNames + "，你选了" + yourCards;
                } else {
                  detailMsg = "牌太小！你选了" + yourCards + "打不过上家";
                }
              }
            }
            self.tipsLabel.string = detailMsg;
            setTimeout(function () {
              self.tipsLabel.string = "";
            }, 3000); // 延长显示时间到3秒
            self._resetCardFlags();
            self.choose_card_data = [];
          } else {
            // 🔧【关键修复】出牌成功，不在这里删除手牌！
            // 等待服务端广播 card_played 消息，由 onOtherPlayerChuCard 处理
            self.playingUI_node.active = false;
            // 清空选中的牌
            self.choose_card_data = [];
          }
        });
        break;
    }
  },
  _resetCardFlags: function _resetCardFlags() {
    // 🔧【修复】只重置手牌容器中的牌节点
    var cardParent = this.cards_node;
    if (!cardParent) {
      console.warn("🎮 [_resetCardFlags] cards_node 未定义，尝试查找手牌容器");
      // 尝试通过节点名称查找
      var gameSceneNode = this.node.parent;
      if (gameSceneNode) {
        for (var i = 0; i < gameSceneNode.children.length; i++) {
          var child = gameSceneNode.children[i];
          if (child.name === "cards_node" || child.name === "cards") {
            cardParent = child;
            this.cards_node = child;
            break;
          }
        }
      }
    }

    // 重置所有牌的选中状态
    if (cardParent) {
      var children = cardParent.children;
      for (var i = 0; i < children.length; i++) {
        children[i].emit("reset_card_flag");
      }
    } else {
      console.error("🎮 [_resetCardFlags] 找不到手牌容器");
    }
    // 🔧【新增】清空选牌后更新显示
    this._updateSelectedCountDisplay();
  },
  /**
   * 🔧【新增】更新已选牌数显示
   * ⚠️【修复】用户要求该位置不显示任何文字，已禁用 tipsLabel 显示
   * 仅在控制台输出日志用于调试
   */
  _updateSelectedCountDisplay: function _updateSelectedCountDisplay() {
    var count = this.choose_card_data.length;

    // 如果没有选中牌，直接返回
    if (count === 0) {
      return;
    }

    // 获取选中的牌数据
    var cardsToPlay = this.choose_card_data.map(function (c) {
      return c.card_data || c;
    });

    // 验证牌型
    var validationResult = this._validateHandType(cardsToPlay);

    // 构建显示文本（仅用于日志）
    var displayText = "已选 " + count + " 张";
    if (validationResult.valid) {
      displayText += " - " + validationResult.type;
    } else {
      displayText += " - " + validationResult.message;
    }

    // ⚠️【禁用】不再在 tipsLabel 上显示文字
    // 仅输出控制台日志用于调试
  },

  // ============================================================
  // 出牌相关
  // ============================================================

  /**
   * 🔧【已废弃】地主获得底牌后添加到手牌
   * ⚠️【重要】此函数已废弃，不再使用！
   * 地主手牌更新由 onLandlordCards 处理，通过服务端 landlord_cards 消息
   * 保留此函数仅用于兼容，不会触发重新发牌动画
   */
  pushThreeCard: function pushThreeCard() {
    // 🔧【关键修复】不再执行任何操作！
    // 底牌已通过 landlord_cards 消息由服务端直接更新地主手牌
    // 此函数保留仅为兼容旧代码引用
    return;
  },
  /**
   * 🔧【新增】从手牌中删除已出的牌（服务端驱动）
   * @param {Array} cards - 服务端返回的已出牌数据 [{suit, rank}, ...]
   */
  _removeCardsFromHand: function _removeCardsFromHand(cards) {
    if (!cards || cards.length === 0) return;

    // 遍历要删除的牌
    for (var i = 0; i < cards.length; i++) {
      var cardToRemove = cards[i];
      // 在手牌中查找并删除
      for (var j = this.handCards.length - 1; j >= 0; j--) {
        if (this.handCards[j].rank === cardToRemove.rank && this.handCards[j].suit === cardToRemove.suit) {
          this.handCards.splice(j, 1);
          break;
        }
      }
    }

    // 🔧【关键修复】清空选中的牌数据，防止残留
    this.choose_card_data = [];

    // 🔧【修复】使用静默更新，不触发发牌动画
    this._updateHandCardsSilent(this.handCards);
  },
  /**
   * 🔧【新增】静默更新手牌（不触发发牌动画）
   * 用于出牌后更新手牌显示
   * @param {Array} cards - 手牌数据
   */
  _updateHandCardsSilent: function _updateHandCardsSilent(cards) {
    if (!cards) return;
    var myglobal = window.myglobal;
    if (!myglobal) return;

    // 排序手牌
    var sortedCards = this._sortCards(cards);

    // 🔧【修复】只使用cards_node，不遍历node.parent
    var cardsParent = this.cards_node;
    if (!cardsParent) {
      console.error("🎮 [_updateHandCardsSilent] cards_node 未定义");
      return;
    }

    // 🔧【关键修复】先销毁所有旧手牌节点，确保事件监听器被清理
    var oldChildren = cardsParent.children;
    for (var i = oldChildren.length - 1; i >= 0; i--) {
      var child = oldChildren[i];
      // 先取消所有事件监听
      child.off(cc.Node.EventType.TOUCH_START);
      // 再销毁节点
      child.destroy();
    }
    // 再次确保清空
    cardsParent.removeAllChildren();

    // 🔧【关键修复】清空选中的牌数据，防止残留
    this.choose_card_data = [];

    // 重新创建手牌节点（无动画）
    for (var i = 0; i < sortedCards.length; i++) {
      var cardData = sortedCards[i];
      var targetX = this._getCardX(i, sortedCards.length, CardLayout.cardSpacing);
      var card = cc.instantiate(this.card_prefab);
      if (!card) continue;
      card.scale = CardLayout.cardScale;
      card.parent = cardsParent;
      card.setPosition(targetX, CardLayout.cardY);
      card.active = true;
      card.zIndex = i;
      var cardComp = card.getComponent("card");
      if (cardComp) {
        cardComp.showCards(cardData, myglobal.playerData.accountID);
      }
    }

    // 重置渲染哈希，允许后续渲染
    this._lastRenderHash = JSON.stringify(cards);
  },
  /**
   * ⚠️【已废弃】旧版删除手牌方法
   * 保留仅为兼容，新代码应使用 _removeCardsFromHand
   */
  destoryCard: function destoryCard(accountid, choose_card) {
    if (choose_card.length === 0) return;
    var destroy_card = [];
    for (var i = 0; i < choose_card.length; i++) {
      for (var j = this.handCards.length - 1; j >= 0; j--) {
        if (this.handCards[j].rank === choose_card[i].card_data.rank && this.handCards[j].suit === choose_card[i].card_data.suit) {
          // 从手牌数据中删除
          this.handCards.splice(j, 1);
          break;
        }
      }
    }

    // 重新渲染
    this.renderCards(this.handCards);

    // 显示出的牌
    if (this.cards_node && this.cards_node.children.length > 0) {
      var outCard_node = this._getOutCardNode(accountid);
      if (outCard_node) {
        // 找到已选中的牌节点
        var selectedNodes = [];
        var children = this.cards_node.children;
        for (var i = 0; i < children.length; i++) {
          var cardComp = children[i].getComponent("card");
          if (cardComp && cardComp.flag) {
            selectedNodes.push(children[i]);
          }
        }
        this.showOutCards(outCard_node, selectedNodes);
      }
    }
  },
  _getOutCardNode: function _getOutCardNode(accountid) {
    var gameScene_script = this.node.parent.getComponent("gameScene");
    return gameScene_script ? gameScene_script.getUserOutCardPosByAccount(accountid) : null;
  },
  // ============================================================
  // 提示按钮功能
  // ============================================================

  /**
   * 🔧【修改】提示按钮点击处理 - 改为请求服务端提示
   * 使用事件监听方式处理响应，不使用回调（因为服务端不返回callIndex）
   */
  _onHintButtonClick: function _onHintButtonClick() {
    // 重置选中的牌
    this._resetCardFlags();
    this.choose_card_data = [];

    // 请求服务端提示（不使用回调，依赖事件监听器处理响应）
    var myglobal = window.myglobal;
    if (myglobal && myglobal.socket) {
      // 直接发送消息，响应将通过 onHintResult 事件监听器处理
      myglobal.socket.sendHintRequest();
    }
  },
  /**
   * 🔧【新增】处理服务端返回的提示结果
   * @param {Object} data - 服务端返回的提示数据
   *   - cards: 提示的牌数组 [{suit, rank}, ...]
   *   - index: 当前提示索引（从0开始）
   *   - total: 总共有多少种提示
   */
  _onHintResult: function _onHintResult(data) {
    if (!data || !data.cards || data.cards.length === 0) {
      // 🔧【修复】没有能过的牌时立即提示不出，不再等待1-2秒
      // this.tipsLabel.string = "没有可出的牌"
      var self = this;

      // 立即自动不出，不再延迟
      self._stopPlayCountdown();
      var myglobal = window.myglobal;
      if (myglobal && myglobal.socket) {
        myglobal.socket.request_buchu_card([], null);
      }
      if (self.playingUI_node) {
        self.playingUI_node.active = false;
      }

      // 1.5秒后清空提示文字
      setTimeout(function () {
        self.tipsLabel.string = "";
      }, 1500);
      return;
    }

    // 选中提示的牌
    this._selectCards(data.cards);

    // 🔧【修改】去掉桌面上的白色文字提示
    // 不再显示 "提示: X张牌" 信息
  },

  /**
   * 🔧【托管】处理托管状态变化通知
   * @param {Object} data - 托管状态数据
   *   - player_id: 玩家ID
   *   - player_name: 玩家名字
   *   - is_trustee: 是否托管
   *   - reason: 原因 (timeout/disconnect/reconnect)
   */
  _onTrusteeStateNotify: function _onTrusteeStateNotify(data) {
    // 通知所有玩家节点更新托管状态
    if (this.node && this.node.parent) {
      this.node.parent.emit("trustee_state_update", data);
    }
  },
  /**
   * 查找可以出的牌（本地fallback）
   * @param {Array} lastSelected - 上次选中的牌（用于找下一组）
   * @returns {Array} 可以出的牌
   */
  _findPlayableCards: function _findPlayableCards(lastSelected) {
    var self = this;

    // 如果没有手牌，不处理
    if (!this.handCards || this.handCards.length === 0) {
      return null;
    }

    // 统计手牌
    var cardCounts = {};
    for (var i = 0; i < this.handCards.length; i++) {
      var rank = this.handCards[i].rank;
      if (!cardCounts[rank]) {
        cardCounts[rank] = [];
      }
      cardCounts[rank].push(this.handCards[i]);
    }

    // 如果是新一轮（必须出牌）
    if (this._mustPlay || !this._lastPlayedCards || this._lastPlayedCards.length === 0) {
      return this._findSmallestCards(cardCounts);
    }

    // 如果不能打过，不提示
    if (!this._canBeat) {
      return null;
    }

    // 获取上家牌型信息
    var lastType = this._lastPlayedHandType || "";
    var lastRank = this._getLastPlayedMainRank();
    var lastCount = this._lastPlayedCards.length;

    // 根据牌型查找能打过的最小牌
    switch (lastType.toLowerCase()) {
      case "single":
      case "solo":
      case "单张":
        return this._findBeatingSingle(cardCounts, lastRank);
      case "pair":
      case "double":
      case "对子":
        return this._findBeatingPair(cardCounts, lastRank);
      case "triple":
      case "three":
      case "三张":
        return this._findBeatingTriple(cardCounts, lastRank, 0);
      case "triplewithsingle":
      case "sandaiyi":
      case "三带一":
        return this._findBeatingTriple(cardCounts, lastRank, 1);
      case "triplewithpair":
      case "sandaidui":
      case "三带二":
        return this._findBeatingTriple(cardCounts, lastRank, 2);
      case "bomb":
      case "zhadan":
      case "炸弹":
        return this._findBeatingBomb(cardCounts, lastRank);
      default:
        // 未知牌型，尝试按张数处理
        return this._findBeatingByCount(cardCounts, lastCount, lastRank);
    }
  },
  /**
   * 获取上家出的牌的主牌点数
   */
  _getLastPlayedMainRank: function _getLastPlayedMainRank() {
    if (!this._lastPlayedCards || this._lastPlayedCards.length === 0) {
      return 0;
    }
    // 统计每个点数出现的次数
    var counts = {};
    for (var i = 0; i < this._lastPlayedCards.length; i++) {
      var rank = this._lastPlayedCards[i].rank;
      counts[rank] = (counts[rank] || 0) + 1;
    }
    // 找出出现次数最多的点数（主牌）
    var maxCount = 0;
    var mainRank = 0;
    for (var rank in counts) {
      if (counts[rank] > maxCount) {
        maxCount = counts[rank];
        mainRank = parseInt(rank);
      }
    }
    return mainRank;
  },
  /**
   * 找最小的牌（新一轮时使用）
   */
  _findSmallestCards: function _findSmallestCards(cardCounts) {
    // 按点数从小到大排序
    var ranks = Object.keys(cardCounts).map(function (r) {
      return parseInt(r);
    }).sort(function (a, b) {
      return a - b;
    });

    // 优先出单张
    for (var i = 0; i < ranks.length; i++) {
      var rank = ranks[i];
      if (cardCounts[rank].length === 1) {
        return [cardCounts[rank][0]];
      }
    }

    // 没有单张则出最小的对子
    for (var i = 0; i < ranks.length; i++) {
      var rank = ranks[i];
      if (cardCounts[rank].length === 2) {
        return cardCounts[rank];
      }
    }

    // 出最小的三张
    for (var i = 0; i < ranks.length; i++) {
      var rank = ranks[i];
      if (cardCounts[rank].length === 3) {
        return cardCounts[rank];
      }
    }

    // 出最小的炸弹
    for (var i = 0; i < ranks.length; i++) {
      var rank = ranks[i];
      if (cardCounts[rank].length === 4) {
        return cardCounts[rank];
      }
    }

    // 兜底：出最小的牌
    if (ranks.length > 0) {
      return [cardCounts[ranks[0]][0]];
    }
    return null;
  },
  /**
   * 找能打过的最小单张
   */
  _findBeatingSingle: function _findBeatingSingle(cardCounts, targetRank) {
    var ranks = Object.keys(cardCounts).map(function (r) {
      return parseInt(r);
    }).sort(function (a, b) {
      return a - b;
    });
    for (var i = 0; i < ranks.length; i++) {
      var rank = ranks[i];
      if (rank > targetRank) {
        return [cardCounts[rank][0]];
      }
    }
    // 没有能打过的单张，尝试炸弹
    return this._findSmallestBomb(cardCounts);
  },
  /**
   * 找能打过的最小对子
   */
  _findBeatingPair: function _findBeatingPair(cardCounts, targetRank) {
    var ranks = Object.keys(cardCounts).map(function (r) {
      return parseInt(r);
    }).sort(function (a, b) {
      return a - b;
    });
    for (var i = 0; i < ranks.length; i++) {
      var rank = ranks[i];
      if (rank > targetRank && cardCounts[rank].length >= 2) {
        return [cardCounts[rank][0], cardCounts[rank][1]];
      }
    }
    // 没有能打过的对子，尝试炸弹
    return this._findSmallestBomb(cardCounts);
  },
  /**
   * 找能打过的最小三张（带或不带）
   */
  _findBeatingTriple: function _findBeatingTriple(cardCounts, targetRank, kickers) {
    var ranks = Object.keys(cardCounts).map(function (r) {
      return parseInt(r);
    }).sort(function (a, b) {
      return a - b;
    });

    // 找三张
    for (var i = 0; i < ranks.length; i++) {
      var rank = ranks[i];
      if (rank > targetRank && cardCounts[rank].length >= 3) {
        var result = [cardCounts[rank][0], cardCounts[rank][1], cardCounts[rank][2]];

        // 如果需要带牌
        if (kickers > 0) {
          var kickerCards = this._findKickerCards(cardCounts, rank, kickers);
          if (kickerCards) {
            result = result.concat(kickerCards);
            return result;
          }
        } else {
          return result;
        }
      }
    }

    // 尝试从四张中拆三张
    for (var i = 0; i < ranks.length; i++) {
      var rank = ranks[i];
      if (rank > targetRank && cardCounts[rank].length === 4) {
        var result = [cardCounts[rank][0], cardCounts[rank][1], cardCounts[rank][2]];
        if (kickers > 0) {
          var kickerCards = this._findKickerCards(cardCounts, rank, kickers);
          if (kickerCards) {
            result = result.concat(kickerCards);
            return result;
          }
        } else {
          return result;
        }
      }
    }

    // 尝试炸弹
    return this._findSmallestBomb(cardCounts);
  },
  /**
   * 找带牌
   */
  _findKickerCards: function _findKickerCards(cardCounts, excludeRank, count) {
    var ranks = Object.keys(cardCounts).map(function (r) {
      return parseInt(r);
    }).sort(function (a, b) {
      return a - b;
    });
    var kickers = [];
    for (var i = 0; i < ranks.length && kickers.length < count; i++) {
      var rank = ranks[i];
      if (rank !== excludeRank) {
        var available = Math.min(cardCounts[rank].length, count - kickers.length);
        for (var j = 0; j < available; j++) {
          kickers.push(cardCounts[rank][j]);
        }
      }
    }
    return kickers.length === count ? kickers : null;
  },
  /**
   * 找能打过的最小炸弹
   */
  _findBeatingBomb: function _findBeatingBomb(cardCounts, targetRank) {
    var ranks = Object.keys(cardCounts).map(function (r) {
      return parseInt(r);
    }).sort(function (a, b) {
      return a - b;
    });
    for (var i = 0; i < ranks.length; i++) {
      var rank = ranks[i];
      if (rank > targetRank && cardCounts[rank].length === 4) {
        return cardCounts[rank];
      }
    }
    // 没有能打过的炸弹，尝试王炸
    return this._findRocket(cardCounts);
  },
  /**
   * 找最小的炸弹
   */
  _findSmallestBomb: function _findSmallestBomb(cardCounts) {
    var ranks = Object.keys(cardCounts).map(function (r) {
      return parseInt(r);
    }).sort(function (a, b) {
      return a - b;
    });
    for (var i = 0; i < ranks.length; i++) {
      var rank = ranks[i];
      if (cardCounts[rank].length === 4) {
        return cardCounts[rank];
      }
    }
    return this._findRocket(cardCounts);
  },
  /**
   * 找王炸
   */
  _findRocket: function _findRocket(cardCounts) {
    var jokers = [];
    if (cardCounts[16] && cardCounts[16].length > 0) {
      jokers.push(cardCounts[16][0]);
    }
    if (cardCounts[17] && cardCounts[17].length > 0) {
      jokers.push(cardCounts[17][0]);
    }
    return jokers.length === 2 ? jokers : null;
  },
  /**
   * 按张数找能打过的牌
   */
  _findBeatingByCount: function _findBeatingByCount(cardCounts, count, targetRank) {
    // 简单实现：按张数处理
    if (count === 1) {
      return this._findBeatingSingle(cardCounts, targetRank);
    } else if (count === 2) {
      return this._findBeatingPair(cardCounts, targetRank);
    } else if (count === 3) {
      return this._findBeatingTriple(cardCounts, targetRank, 0);
    } else if (count === 4) {
      // 可能是炸弹
      return this._findBeatingBomb(cardCounts, targetRank);
    } else if (count >= 5) {
      // 可能是顺子、连对等，暂不支持提示
      return null;
    }
    return null;
  },
  /**
   * 选中指定的牌
   * @param {Array} cards - 要选中的牌
   */
  _selectCards: function _selectCards(cards) {
    if (!cards || cards.length === 0) {
      return;
    }

    // 🔧【修复】只从手牌容器中查找，不遍历node.parent
    var cardParent = this.cards_node;
    if (!cardParent) {
      console.warn("🎮 [_selectCards] cards_node 未定义，尝试查找手牌容器");
      // 尝试通过节点名称查找
      var gameSceneNode = this.node.parent;
      if (gameSceneNode) {
        for (var i = 0; i < gameSceneNode.children.length; i++) {
          var child = gameSceneNode.children[i];
          if (child.name === "cards_node" || child.name === "cards") {
            cardParent = child;
            this.cards_node = child;
            break;
          }
        }
      }
    }
    if (!cardParent) {
      console.error("🎮 [_selectCards] 找不到手牌容器");
      return;
    }
    var children = cardParent.children;
    var foundCount = 0;
    var alreadyMatched = {}; // 🔧【新增】记录已匹配的牌，防止重复匹配

    for (var i = 0; i < children.length; i++) {
      var cardNode = children[i];
      var cardComp = cardNode.getComponent("card");
      if (cardComp && cardComp.card_data) {
        // 检查这张牌是否在要选中的牌中
        for (var j = 0; j < cards.length; j++) {
          var matchKey = cards[j].suit + "_" + cards[j].rank;
          // 🔧【修复】检查是否已经匹配过这张牌
          if (alreadyMatched[matchKey]) {
            continue;
          }
          if (cardComp.card_data.rank === cards[j].rank && cardComp.card_data.suit === cards[j].suit) {
            // 🔧【修复】检查是否已经选中
            if (!cardComp.flag) {
              // 选中这张牌
              cardComp.flag = true;
              cardNode.y += 20; // 向上移动表示选中
              this.choose_card_data.push({
                cardid: cardComp.card_id,
                card_data: cardComp.card_data
              });
              foundCount++;
              alreadyMatched[matchKey] = true; // 标记已匹配
            } else {}
            break;
          }
        }
      }
    }
    if (foundCount === 0) {
      this.tipsLabel.string = "提示失败，请手动选牌";
      var self = this;
      setTimeout(function () {
        self.tipsLabel.string = "";
      }, 2000);
    }
  },
  clearOutZone: function clearOutZone(accountid) {
    var outCard_node = this._getOutCardNode(accountid);
    if (outCard_node) {
      outCard_node.removeAllChildren(true);
    }
  },
  showOutCards: function showOutCards(outCard_node, cards) {
    if (!outCard_node || !cards || cards.length === 0) return;
    outCard_node.removeAllChildren(true);
    var count = cards.length;
    for (var i = 0; i < count; i++) {
      var card = cards[i];
      outCard_node.addChild(card, i);
      card.setScale(CardLayout.outCardScale, CardLayout.outCardScale);
      var x = this._getCardX(i, count, CardLayout.outCardSpacing);
      card.setPosition(x, 0);
    }
  },
  // ============================================================
  // 游戏状态恢复（断线重连）
  // ============================================================

  restoreGameState: function restoreGameState(data) {
    var gameState = data.game_state;
    if (!gameState) {
      return;
    }

    // 🔧【关键】设置游戏阶段
    if (gameState.phase === "bidding") {
      this._gamePhase = "bidding";
      this._biddingPhase = "bidding";
    } else if (gameState.phase === "playing") {
      this._gamePhase = "playing";
      this._biddingPhase = "idle";
    }

    // 恢复玩家信息
    if (gameState.players) {
      for (var i = 0; i < gameState.players.length; i++) {
        var p = gameState.players[i];
        if (p.is_landlord && window.myglobal.playerData) {
          window.myglobal.playerData.master_accountid = p.id;
        }
      }

      // 🔧【新增】通知其他玩家节点更新
      if (this.node && this.node.parent) {
        this.node.parent.emit("players_restored_event", {
          players: gameState.players
        });
      }
    }

    // 🔧【关键修复】恢复手牌
    if (gameState.hand) {
      // 🔧【关键】重置渲染哈希，确保手牌会被更新
      this._lastRenderHash = "";

      // 保存手牌数据
      this.handCards = gameState.hand;

      // 标记发牌完成
      this.cardsReady = true;
      this.fapai_end = true;

      // 🔧【关键】使用静默更新，不触发发牌动画
      this._updateHandCardsSilent(this.handCards);
    } else {}

    // 恢复底牌
    if (gameState.bottom_cards && gameState.bottom_cards.length > 0) {
      this.bottomCards = gameState.bottom_cards;
      for (var i = 0; i < this.bottom_card.length && i < this.bottomCards.length; i++) {
        if (this.bottom_card[i]) {
          var cardComp = this.bottom_card[i].getComponent("card");
          if (cardComp) {
            cardComp.showCards(this.bottomCards[i]);
          }
        }
      }
    }

    // 🔧【新增】恢复上家出的牌
    if (gameState.last_played && gameState.last_played.length > 0) {
      this._lastPlayedCards = gameState.last_played;
      this._lastPlayedHandType = gameState.last_played.hand_type || "";

      // 🔧【新增】显示上家出的牌
      if (gameState.last_player_id) {
        var gameScene_script = this.node.parent.getComponent("gameScene");
        if (gameScene_script) {
          var outCard_node = gameScene_script.getUserOutCardPosByAccount(gameState.last_player_id);
          if (outCard_node && this.card_prefab) {
            // 清除旧的出牌
            outCard_node.removeAllChildren();

            // 显示上家出的牌
            var node_cards = [];
            for (var i = 0; i < gameState.last_played.length; i++) {
              var card = cc.instantiate(this.card_prefab);
              if (card) {
                var cardScript = card.getComponent("card");
                if (cardScript) {
                  cardScript.showCards(gameState.last_played[i], window.myglobal.playerData.accountID);
                }
                node_cards.push(card);
              }
            }
            this.showOutCards(outCard_node, node_cards);
          }
        }
      }
    }

    // 恢复出牌轮次
    if (gameState.phase === "playing" && gameState.current_turn) {
      var myPlayerId = window.myglobal.socket.getPlayerInfo().id || window.myglobal.playerData.accountID;

      // 🔧【关键】隐藏抢地主UI
      this._hideRobUI();
      if (String(gameState.current_turn) === String(myPlayerId)) {
        this.playingUI_node.active = true;

        // 🔧【新增】保存出牌状态
        this._mustPlay = gameState.must_play || false;
        this._canBeat = gameState.can_beat || false;

        // 🔧【新增】启动出牌倒计时（如果服务端提供了剩余时间）
        // 注意：服务端应该在重连后发送 can_chu_card_notify 消息来启动倒计时
      } else {
        if (this.playingUI_node) {
          this.playingUI_node.active = false;
        }
      }
    }

    // 🔧【新增】如果是抢地主阶段
    if (gameState.phase === "bidding") {
      // 注意：服务端应该在重连后发送 call_landlord_turn_notify 消息来显示抢地主按钮
    }
  },
  // ============================================================
  // 🔧【新增】底牌显示和地主手牌更新
  // ============================================================

  /**
   * 🔧【新增】显示底牌给所有玩家（翻牌动画）
   * @param {Array} cards - 底牌数据
   */
  _showBottomCardsToAll: function _showBottomCardsToAll(cards) {
    if (!cards || cards.length === 0) {
      return;
    }

    // 更新底牌显示
    for (var i = 0; i < cards.length && i < this.bottom_card.length; i++) {
      var cardNode = this.bottom_card[i];
      if (!cardNode) continue;
      var cardScript = cardNode.getComponent("card");
      if (cardScript) {
        cardScript.showCards(cards[i]);
      }
    }
  },
  /**
   * 🔧【新增】静默更新地主的手牌（不触发发牌动画）
   * 只在地主收到 LANDLORD_CARDS 消息时调用
   * @param {Array} cards - 地主的完整手牌（含底牌）
   */
  _updateLandlordHandCards: function _updateLandlordHandCards(cards) {
    if (!cards || cards.length === 0) {
      return;
    }
    var myglobal = window.myglobal;
    if (!myglobal) return;

    // 排序手牌
    var sortedCards = this._sortCards(cards);

    // 🔧【修复】确保手牌容器存在
    var cardsParent = this.cards_node;
    if (!cardsParent) {
      console.error("🃏 [_updateLandlordHandCards] cards_node 未定义");
      return;
    }

    // 清理旧手牌节点
    cardsParent.removeAllChildren();

    // 重新创建手牌节点（无动画）
    for (var i = 0; i < sortedCards.length; i++) {
      var cardData = sortedCards[i];
      var targetX = this._getCardX(i, sortedCards.length, CardLayout.cardSpacing);
      var card = cc.instantiate(this.card_prefab);
      if (!card) continue;
      card.scale = CardLayout.cardScale;
      card.parent = cardsParent; // 🔧【修复】使用确定的手牌容器
      card.setPosition(targetX, CardLayout.cardY);
      card.active = true;
      card.zIndex = i;
      var cardComp = card.getComponent("card");
      if (cardComp) {
        cardComp.showCards(cardData, myglobal.playerData.accountID);
      }
    }

    // 重置渲染哈希，允许后续渲染
    this._lastRenderHash = JSON.stringify(cards);
  },
  // ============================================================
  // 🔊【出牌音效系统】使用实际音效文件
  // 音效文件命名规则：
  // - 男版: m_cp_{type}_{rank}.mp3 或 m_cp_{type}.mp3
  // - 女版: m_cp_nv_{type}_{rank}.mp3 或 m_cp_nv_{type}.mp3
  // 注意：大小王(rank=14/15)没有对子音效，因为两张王是王炸不是对子
  // 
  // 🔧【音效规则】
  // 1. 首出（is_new_round=true）：播放对应牌型的音效
  // 2. 压牌（is_new_round=false, can_beat=true）：
  //    - 有对应音效文件：播放牌型音效
  //    - 无对应音效文件（如对子14/15）：播放"大你"音效
  // 3. 炸弹/王炸：始终播放炸弹/王炸音效
  // ============================================================

  /**
   * 🔊 播放出牌音效
   * 🔧【全面重构版】严格遵循"大你"音效使用规则
   * 
   * @param {Object} data - 服务端广播的数据
   *   - hand_type: 牌型名称 (single/pair/triple/straight/bomb/rocket/liandui/plane/sandaiyi/sandaidui/sidaier/sidailiangdui)
   *   - rank: 主牌点数 (用于单张/对子/三张)
   *   - gender: "male" / "female"
   *   - is_new_round: 是否是新回合（首出）
   *   - can_beat: 是否压过上家
   * 
   * 【核心规则】"大你"音效(m_cp_dani)的使用场景：
   * 
   * 场景1 - 首出(is_new_round=true)：
   *   ✅ 只播放牌型音效
   *   ❌ 禁止播放"大你"
   * 
   * 场景2 - 压牌(is_new_round=false && can_beat=true)：
   *   🎲 70% 概率播放牌型音效
   *   🎲 30% 概率播放"大你"
   *   （如果牌型音效文件不存在，100%播放"大你"）
   * 
   * 场景3 - 炸弹/王炸：
   *   ✅ 始终播放炸弹/王炸音效
   */
  _playCardSound: function _playCardSound(data) {
    if (!isopen_sound) return;

    // 🔧【调试】打印完整数据结构

    var handType = data.hand_type || "";
    var gender = data.gender || "male";
    var isNewRound = data.is_new_round !== undefined ? data.is_new_round : true;
    var canBeat = data.can_beat !== undefined ? data.can_beat : false;

    // 🔧【核心修复】优先从 cards 中提取主牌值
    var rank = this._extractMainRank(data);

    // 🔊【调试日志】详细输出音效播放参数

    // 🔧【检查】是否是炸弹或王炸（特殊处理）
    var type = (handType || "").toLowerCase();
    var isBomb = type === "bomb" || type === "zhadan" || type === "炸弹";
    var isRocket = type === "rocket" || type === "wangzha" || type === "王炸";

    // 炸弹和王炸始终播放对应音效
    if (isBomb || isRocket) {
      var soundName = this._getCardTypeSound(handType, rank, gender);
      if (soundName) {
        this._playSoundEffect(soundName);
      }
      return;
    }

    // 🔧【核心】获取牌型音效
    var cardSound = this._getCardTypeSound(handType, rank, gender);
    var prefix = gender === "female" ? "m_cp_nv_" : "m_cp_";
    var daniSound = prefix + "dani";

    // 🔧【检查】牌型是否有对应的音效文件
    var hasSpecificSound = this._hasSpecificCardSound(handType, rank);

    // 🔧【核心修复】正确的"大你"播放逻辑
    // 
    // 规则说明：
    // 1. 首出(is_new_round=true)：只播放牌型音效，禁止"大你"
    // 2. 压牌(is_new_round=false && can_beat=true)：随机播放，70%牌型音效，30%"大你"
    // 3. 压牌但音效文件缺失：播放"大你"

    if (isNewRound) {
      // ✅【场景1】首出：只播放牌型音效，禁止"大你"
      if (cardSound) {
        this._playSoundEffect(cardSound);
      } else {
        // 首出但没有对应音效文件（不应该发生，但安全处理）
        console.warn("🔊 [_playCardSound] ⚠️ 首出但无对应音效文件: " + handType + ", rank=" + rank);
        // 🔧【重要】首出不播放"大你"，静默跳过
      }
    } else if (canBeat) {
      // ✅【场景2】压牌场景：随机播放（70%牌型，30%大你）
      if (hasSpecificSound && cardSound) {
        // 随机选择：70%牌型，30%大你
        var randomValue = Math.random();
        if (randomValue < 0.7) {
          // 70% 播放牌型音效
          this._playSoundEffect(cardSound);
        } else {
          // 30% 播放"大你"
          this._playSoundEffect(daniSound);
        }
      } else {
        // 音效文件缺失，播放"大你"
        this._playSoundEffect(daniSound);
      }
    } else {
      // ✅【场景3】压牌但can_beat=false（不应该发生，但安全处理）
      // 这种情况理论上不应该出现，因为服务端只在成功压牌时设置can_beat=true
      if (cardSound) {
        this._playSoundEffect(cardSound);
      } else {
        console.warn("🔊 [_playCardSound] ⚠️ 异常场景：压牌但can_beat=false且无音效");
      }
    }
  },
  /**
   * 🔧【新增】检查牌型是否有对应的音效文件
   * 🔧【修复】增加更多牌型支持，确保覆盖服务端所有牌型名称
   * @param {String} handType - 牌型名称
   * @param {Number} rank - 主牌点数
   * @returns {Boolean} 是否有对应音效文件
   */
  _hasSpecificCardSound: function _hasSpecificCardSound(handType, rank) {
    var type = (handType || "").toLowerCase();
    var soundIndex = this._rankToSoundIndex(rank);

    // 单张：有1-15的音效文件
    // 服务端发送: "单张"
    if (type === "single" || type === "solo" || type.indexOf("单张") !== -1) {
      var hasSound = soundIndex >= 1 && soundIndex <= 15;
      return hasSound;
    }

    // 对子：只有1-13的音效文件（没有对子14/15，因为大王小王没有对子音效）
    // 服务端发送: "对子"
    if (type === "pair" || type === "double" || type.indexOf("对子") !== -1) {
      var hasSound = soundIndex >= 1 && soundIndex <= 13;
      return hasSound;
    }

    // 三张：只有1-13的音效文件
    // 服务端发送: "三张"
    if (type === "triple" || type === "three" || type === "trio" || type.indexOf("三张") !== -1) {
      var hasSound = soundIndex >= 1 && soundIndex <= 13;
      return hasSound;
    }

    // 特殊牌型都有对应音效
    // 服务端发送: "连对", "顺子", "飞机", "飞机带单", "飞机带对", "三带一", "三带二", "四带二", "四带两对", "炸弹", "王炸"
    var specialTypes = [
    // 英文名称
    "liandui", "straight", "plane", "feiji", "sandaiyi", "sandaidui", "sidaier", "sidailiangdui", "bomb", "zhadan", "rocket", "wangzha",
    // 中文名称（服务端发送的名称）
    "连对", "顺子", "飞机", "三带一", "三带二", "四带二", "四带两对", "炸弹", "王炸"];
    for (var i = 0; i < specialTypes.length; i++) {
      if (type.indexOf(specialTypes[i]) !== -1) {
        return true;
      }
    }
    return false;
  },
  /**
   * 🔧【核心修复】从数据中提取主牌点数
   * 
   * 优先级：
   * 1. 服务端传递的 rank（如果有效）
   * 2. 从 cards 数组中提取（根据牌型）
   * 
   * @param {Object} data - 服务端广播的数据
   * @returns {Number} 主牌点数（服务端 rank 格式：3-17）
   */
  _extractMainRank: function _extractMainRank(data) {
    // 优先使用服务端传递的 rank
    if (data.rank && data.rank > 0) {
      return data.rank;
    }

    // 如果服务端 rank 无效，从 cards 中提取
    var cards = data.cards || [];
    var handType = (data.hand_type || "").toLowerCase();
    if (cards.length === 0) {
      console.warn("🔊 [_extractMainRank] cards数组为空，无法提取rank");
      return 0;
    }

    // 对 cards 进行排序（从大到小）
    var sortedCards = cards.slice().sort(function (a, b) {
      return (b.rank || 0) - (a.rank || 0);
    });

    // 根据牌型提取主牌
    // 单张
    if (handType.indexOf("single") !== -1 || handType.indexOf("单张") !== -1) {
      var rank = this._extractCardRank(sortedCards[0]);
      return rank;
    }

    // 对子 - 取任意一张的rank（它们相同）
    if (handType.indexOf("pair") !== -1 || handType.indexOf("对子") !== -1) {
      var rank = this._extractCardRank(sortedCards[0]);
      return rank;
    }

    // 三张 - 取三张中任意一张的rank
    if (handType.indexOf("triple") !== -1 || handType.indexOf("三张") !== -1 || handType.indexOf("trio") !== -1 || handType.indexOf("three") !== -1) {
      var rank = this._extractCardRank(sortedCards[0]);
      return rank;
    }

    // 三带一/三带二 - 取最大的三张
    if (handType.indexOf("sandaiyi") !== -1 || handType.indexOf("三带一") !== -1 || handType.indexOf("sandaidui") !== -1 || handType.indexOf("三带二") !== -1) {
      // 统计每个rank出现的次数
      var counts = {};
      for (var i = 0; i < cards.length; i++) {
        var r = cards[i].rank;
        counts[r] = (counts[r] || 0) + 1;
      }
      // 找到出现次数最多的rank
      var maxCount = 0;
      var mainRank = 0;
      for (var r in counts) {
        if (counts[r] >= 3 && counts[r] > maxCount) {
          maxCount = counts[r];
          mainRank = parseInt(r);
        }
      }
      return mainRank;
    }

    // 其他牌型 - 取最大的牌
    var rank = this._extractCardRank(sortedCards[0]);
    return rank;
  },
  /**
   * 🔧【辅助】从单个card对象中提取rank
   * @param {Object} card - 卡牌对象
   * @returns {Number} rank值
   */
  _extractCardRank: function _extractCardRank(card) {
    if (!card) {
      console.warn("🔊 [_extractCardRank] card为空");
      return 0;
    }

    // 尝试各种可能的字段
    if (card.rank !== undefined && card.rank > 0) {
      return Number(card.rank);
    }
    if (card.value !== undefined && card.value > 0) {
      return Number(card.value);
    }
    if (card.logic_value !== undefined && card.logic_value > 0) {
      return Number(card.logic_value);
    }
    if (card.card_data && card.card_data.rank !== undefined) {
      return Number(card.card_data.rank);
    }
    console.warn("🔊 [_extractCardRank] 无法提取rank，card:", JSON.stringify(card));
    return 0;
  },
  /**
   * 🔧【核心修复】服务端 rank 转换为音效文件编号
   * 
   * 服务端 rank 定义：
   * - 3-10 = 3-10
   * - J=11, Q=12, K=13, A=14, 2=15
   * - 小王=16, 大王=17
   * 
   * 音效文件编号：
   * - 1 = A
   * - 2 = 2
   * - 3-13 = 3-K
   * - 14 = 小王
   * - 15 = 大王
   * 
   * @param {Number} rank - 服务端牌面值 (3-17)
   * @returns {Number} 音效文件编号 (1-15)，如果无法转换返回 0
   */
  _rankToSoundIndex: function _rankToSoundIndex(rank) {
    if (rank === 14) return 1; // A → 1
    if (rank === 15) return 2; // 2 → 2
    if (rank >= 3 && rank <= 13) return rank; // 3-K 直接使用
    if (rank === 16) return 14; // 小王 → 14
    if (rank === 17) return 15; // 大王 → 15
    return 0; // 无效
  },

  /**
   * 🔊 根据牌型获取音效名称
   * 🔧【修复】使用 indexOf 匹配中文牌型名称，确保兼容服务端发送的中文名称
   * @param {String} handType - 牌型名称
   * @param {Number} rank - 主牌点数 (服务端定义: 3-17, A=14, 2=15, 小王=16, 大王=17)
   * @param {String} gender - 性别
   * @returns {String} 音效名称（不含路径和扩展名），如果没有对应音效返回null
   */
  _getCardTypeSound: function _getCardTypeSound(handType, rank, gender) {
    var type = (handType || "").toLowerCase();
    var prefix = gender === "female" ? "m_cp_nv_" : "m_cp_";

    // 🔧【合法性校验】检查rank是否有效
    if (!rank || rank === 0) {
      console.error("🔊 [_getCardTypeSound] 非法rank: " + rank + ", handType=" + handType);
      return null;
    }

    // 🔧【修复】将服务端 rank 转换为音效文件编号
    var soundIndex = this._rankToSoundIndex(rank);

    // 单张（支持中英文）
    // 服务端发送: "单张"
    // 音效文件编号：1=A, 2=2, 3-13=3-K, 14=小王, 15=大王
    if (type === "single" || type === "solo" || type.indexOf("单张") !== -1) {
      if (soundIndex >= 1 && soundIndex <= 15) {
        return prefix + "danzhang_" + soundIndex;
      }
      console.warn("🔊 [_getCardTypeSound] 单张音效索引无效: rank=" + rank + ", soundIndex=" + soundIndex);
      return null;
    }

    // 对子（支持中英文）
    // 服务端发送: "对子"
    // 音效文件编号：1=A, 2=2, 3-13=3-K（注意：文件只有1-13，没有14/15）
    if (type === "pair" || type === "double" || type.indexOf("对子") !== -1) {
      if (soundIndex >= 1 && soundIndex <= 13) {
        return prefix + "duizi_" + soundIndex;
      }
      console.warn("🔊 [_getCardTypeSound] 对子音效文件不存在: rank=" + rank + ", soundIndex=" + soundIndex);
      return null;
    }

    // 三张（支持中英文）
    // 服务端发送: "三张"
    // 音效文件编号：1=A, 2=2, 3-13=3-K（注意：文件只有1-13）
    if (type === "triple" || type === "three" || type === "trio" || type.indexOf("三张") !== -1) {
      if (soundIndex >= 1 && soundIndex <= 13) {
        return prefix + "sange_" + soundIndex;
      }
      console.warn("🔊 [_getCardTypeSound] 三张音效文件不存在: rank=" + rank + ", soundIndex=" + soundIndex);
      return null;
    }

    // 🔧【修复】特殊牌型映射表（支持中英文）
    var specialTypes = {
      // 英文名称
      "liandui": "liandui",
      // 连对
      "straight": "shunzi",
      // 顺子
      "plane": "feiji",
      // 飞机
      "feiji": "feiji",
      // 飞机
      "sandaiyi": "sandaiyi",
      // 三带一
      "sandaidui": "sandaidui",
      // 三带对
      "sidaier": "sidaier",
      // 四带二
      "sidailiangdui": "sidailiangdui",
      // 四带两对
      "bomb": "zhadan",
      // 炸弹
      "zhadan": "zhadan",
      // 炸弹
      "rocket": "wangzha",
      // 王炸
      "wangzha": "wangzha",
      // 王炸
      // 中文名称（服务端发送的名称）
      "连对": "liandui",
      "顺子": "shunzi",
      "飞机": "feiji",
      "飞机带单": "feiji",
      "飞机带对": "feiji",
      "三带一": "sandaiyi",
      "三带二": "sandaidui",
      "四带二": "sidaier",
      "四带两对": "sidailiangdui",
      "炸弹": "zhadan",
      "王炸": "wangzha"
    };

    // 查找特殊牌型
    for (var key in specialTypes) {
      if (type.indexOf(key) !== -1) {
        var suffix = specialTypes[key];
        // 🔧【修复】女版炸弹使用 m_cp_nv_zhadan（如果存在），否则使用男版
        // 注意：目前 m_cp_nv_zhadan.mp3 不存在，所以女版也使用男版炸弹音效
        if (suffix === "zhadan") {
          // 先尝试女版炸弹音效
          if (gender === "female") {
            return "m_cp_zhadan"; // 女版暂时使用男版炸弹音效（因为m_cp_nv_zhadan不存在）
          }

          return "m_cp_zhadan";
        }
        // 🔧【修复】女版王炸有单独音效
        if (suffix === "wangzha") {
          return prefix + "wangzha";
        }
        return prefix + suffix;
      }
    }

    // 未知牌型，返回null
    console.warn("🔊 [_getCardTypeSound] 未知牌型: " + type);
    return null;
  },
  /**
   * 🔊 播放不出音效（随机播放"不要"/"要不起"）
   * @param {Object} data - 服务端广播的数据
   *   - gender: "male" / "female"
   */
  _playPassSound: function _playPassSound(data) {
    if (!isopen_sound) return;
    var gender = data.gender || "male";

    // 男版：随机播放"不要"或"要不起"
    // 文件：m_cp_buyao.mp3, m_cp_yaobuqi.mp3
    // 女版：随机播放"不要"或"要不起"
    // 文件：m_cp_nv_buyao.mp3, m_nv_yaobuqi.wav

    var sounds;
    if (gender === "female") {
      sounds = ["m_cp_nv_buyao", "m_nv_yaobuqi"];
    } else {
      sounds = ["m_cp_buyao", "m_cp_yaobuqi"];
    }

    // 随机选择一个
    var randomIndex = Math.floor(Math.random() * sounds.length);
    var soundName = sounds[randomIndex];
    this._playSoundEffect(soundName);
  },
  /**
   * 🔊 播放胜利/失败音效
   * @param {Boolean} isWin - 是否胜利
   */
  _playGameResultSound: function _playGameResultSound(isWin) {
    if (!isopen_sound) return;
    var soundName = isWin ? "m_yingle" : "m_shule";
    this._playSoundEffect(soundName);
  },
  /**
   * 🔊 显示不出效果
   * @param {String} accountid - 玩家ID
   */
  _showPassEffect: function _showPassEffect(accountid) {
    // 获取对应玩家的出牌区域
    var gameScene_script = this.node.parent.getComponent("gameScene");
    if (!gameScene_script) return;
    var outCard_node = gameScene_script.getUserOutCardPosByAccount(accountid);
    if (!outCard_node) return;

    // 清空出牌区域
    outCard_node.removeAllChildren(true);

    // 创建"不出"文字显示
    var passNode = new cc.Node("pass_label");
    var label = passNode.addComponent(cc.Label);
    label.string = "不出";
    label.fontSize = 28;
    label.lineHeight = 36;
    passNode.color = cc.color(255, 200, 100);

    // 添加描边
    var outline = passNode.addComponent(cc.LabelOutline);
    outline.color = cc.color(100, 50, 0);
    outline.width = 2;
    passNode.parent = outCard_node;
    passNode.setPosition(0, 0);

    // 2秒后自动消失
    this.scheduleOnce(function () {
      if (passNode && passNode.isValid) {
        passNode.destroy();
      }
    }, 2);
  },
  /**
   * 🔧【新增】获取牌的显示名称
   * @param {Object} card - 牌数据 {suit, rank}
   * @returns {String} 牌的中文名称，如 "大王"、"小王"、"黑桃A" 等
   */
  _getCardDisplayName: function _getCardDisplayName(card) {
    if (!card) return "未知牌";
    var suit = card.suit;
    var rank = card.rank;

    // 大小王
    if (rank === 17) return "大王";
    if (rank === 16) return "小王";

    // 花色名称
    var suitNames = {
      0: "黑桃",
      1: "红心",
      2: "梅花",
      3: "方块",
      4: ""
    };
    var suitName = suitNames[suit] || "";

    // 牌面名称
    var rankNames = {
      3: "3",
      4: "4",
      5: "5",
      6: "6",
      7: "7",
      8: "8",
      9: "9",
      10: "10",
      11: "J",
      12: "Q",
      13: "K",
      14: "A",
      15: "2"
    };
    var rankName = rankNames[rank] || String(rank);
    return suitName + rankName;
  },
  // ============================================================
  // 🔧【新增】客户端牌型验证
  // ============================================================

  /**
   * 🔧【新增】验证牌型是否有效
   * @param {Array} cards - 要验证的牌数据 [{suit, rank, color}, ...]
   * @returns {Object} {valid: boolean, type: string, message: string}
   */
  _validateHandType: function _validateHandType(cards) {
    if (!cards || cards.length === 0) {
      return {
        valid: false,
        type: "",
        message: "请选择要出的牌"
      };
    }
    var count = cards.length;

    // 统计各点数的牌数量
    var rankCounts = {};
    for (var i = 0; i < cards.length; i++) {
      var rank = cards[i].rank;
      if (!rankCounts[rank]) {
        rankCounts[rank] = 0;
      }
      rankCounts[rank]++;
    }

    // 获取点数列表（排序后）
    var ranks = Object.keys(rankCounts).map(function (r) {
      return parseInt(r);
    }).sort(function (a, b) {
      return a - b;
    });

    // 获取数量统计
    var counts = Object.values(rankCounts);
    var fours = []; // 四张
    var threes = []; // 三张
    var pairs = []; // 对子
    var singles = []; // 单张

    for (var rank in rankCounts) {
      var c = rankCounts[rank];
      if (c === 4) fours.push(parseInt(rank));else if (c === 3) threes.push(parseInt(rank));else if (c === 2) pairs.push(parseInt(rank));else if (c === 1) singles.push(parseInt(rank));
    }

    // 1. 王炸（双王）
    if (count === 2 && rankCounts[16] === 1 && rankCounts[17] === 1) {
      return {
        valid: true,
        type: "王炸",
        message: ""
      };
    }

    // 2. 单张
    if (count === 1) {
      return {
        valid: true,
        type: "单张",
        message: ""
      };
    }

    // 3. 对子
    if (count === 2 && pairs.length === 1) {
      return {
        valid: true,
        type: "对子",
        message: ""
      };
    }

    // 4. 三张
    if (count === 3 && threes.length === 1) {
      return {
        valid: true,
        type: "三张",
        message: ""
      };
    }

    // 5. 炸弹
    if (count === 4 && fours.length === 1) {
      return {
        valid: true,
        type: "炸弹",
        message: ""
      };
    }

    // 6. 三带一
    if (count === 4 && threes.length === 1 && singles.length === 1) {
      return {
        valid: true,
        type: "三带一",
        message: ""
      };
    }

    // 7. 三带二
    if (count === 5 && threes.length === 1 && pairs.length === 1) {
      return {
        valid: true,
        type: "三带二",
        message: ""
      };
    }

    // 8. 四带二（单）
    if (count === 6 && fours.length === 1 && (singles.length === 2 || pairs.length === 1)) {
      return {
        valid: true,
        type: "四带二",
        message: ""
      };
    }

    // 9. 四带两对
    if (count === 8 && fours.length === 1 && pairs.length === 2) {
      return {
        valid: true,
        type: "四带两对",
        message: ""
      };
    }

    // 10. 顺子（至少5张连续，不包含2和王）
    if (count >= 5 && singles.length === count) {
      // 检查是否连续且不包含2和王
      var isSequential = this._isSequential(ranks);
      var noTwoOrJoker = ranks.every(function (r) {
        return r < 15;
      }); // rank < 15 表示不是2和王
      if (isSequential && noTwoOrJoker) {
        return {
          valid: true,
          type: "顺子",
          message: ""
        };
      }
    }

    // 11. 连对（至少3对连续）
    if (count >= 6 && count % 2 === 0 && pairs.length === count / 2) {
      var pairRanks = pairs.sort(function (a, b) {
        return a - b;
      });
      var isSequential = this._isSequential(pairRanks);
      var noTwoOrJoker = pairRanks.every(function (r) {
        return r < 15;
      });
      if (isSequential && noTwoOrJoker) {
        return {
          valid: true,
          type: "连对",
          message: ""
        };
      }
    }

    // 12. 飞机（至少2个连续三张）
    if (threes.length >= 2) {
      var threeRanks = threes.sort(function (a, b) {
        return a - b;
      });
      var isSequential = this._isSequential(threeRanks);
      var noTwoOrJoker = threeRanks.every(function (r) {
        return r < 15;
      });
      if (isSequential && noTwoOrJoker) {
        var threeCount = threes.length;

        // 飞机不带翅膀
        if (count === threeCount * 3) {
          return {
            valid: true,
            type: "飞机",
            message: ""
          };
        }

        // 飞机带单
        if (count === threeCount * 4 && singles.length === threeCount) {
          return {
            valid: true,
            type: "飞机带单",
            message: ""
          };
        }

        // 飞机带对
        if (count === threeCount * 5 && pairs.length === threeCount) {
          return {
            valid: true,
            type: "飞机带对",
            message: ""
          };
        }
      }
    }

    // 无效牌型
    return {
      valid: false,
      type: "",
      message: "无效的牌型，请重新选择"
    };
  },
  /**
   * 检查点数是否连续
   * @param {Array} ranks - 排序后的点数数组
   * @returns {Boolean} 是否连续
   */
  _isSequential: function _isSequential(ranks) {
    if (!ranks || ranks.length < 2) return true;
    for (var i = 1; i < ranks.length; i++) {
      if (ranks[i] - ranks[i - 1] !== 1) {
        return false;
      }
    }
    return true;
  },
  // ============================================================
  // 🔧【新增】结算弹窗系统
  // ============================================================

  /**
   * 🏆 显示游戏结算弹窗
   * @param {Object} data - 服务端广播的结算数据
   */
  _showGameResultPopup: function _showGameResultPopup(data) {
    // ============================================================
    // 【竞技场】检查是否是竞技场模式
    // ============================================================
    if (this._isCompetition || data.room_category === 2) {
      // 竞技场模式使用特殊的结算页
      this._showCompetitionResultPopup(data);
      return;
    }

    // 判断当前玩家是否胜利
    var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID;
    var isWinner = false;
    var myWinGold = 0;

    // 从 players 数组中找到当前玩家的结果
    if (data.players && data.players.length > 0) {
      for (var i = 0; i < data.players.length; i++) {
        var player = data.players[i];
        if (String(player.player_id) === String(myPlayerId)) {
          isWinner = player.is_winner;
          myWinGold = player.win_gold;
          break;
        }
      }
    } else {
      // 兼容旧版本：通过 winner_id 判断
      isWinner = String(data.winner_id) === String(myPlayerId);
      if (!isWinner && !data.is_landlord) {
        var isLandlord = myglobal.playerData.master_accountid === myPlayerId;
        if (!isLandlord) {
          isWinner = true;
        }
      }
    }

    // 🔧【关键修复】更新本地玩家的金币数量
    if (myglobal.playerData && myWinGold !== 0) {
      var oldGold = myglobal.playerData.gobal_count || 0;
      var newGold = oldGold + myWinGold;
      // 确保金币不为负数
      if (newGold < 0) {
        newGold = 0;
      }
      myglobal.playerData.gobal_count = newGold;
    }

    // 🔧【新增】更新所有玩家的金币显示
    if (data.players && data.players.length > 0) {
      for (var i = 0; i < data.players.length; i++) {
        var player = data.players[i];
        var playerId = player.player_id;
        var goldAfter = player.gold_after;

        // 🔧【修复】只要 goldAfter >= 0 就更新显示（包括 0 的情况）
        // 服务端返回的 gold_after >= 0 表示查询到了有效数据
        if (goldAfter >= 0) {
          this._updatePlayerGoldDisplay(playerId, goldAfter);
        } else {
          // 如果服务端没有返回有效的 gold_after，则本地计算
          // 这种情况下，只更新当前玩家的金币
          if (String(playerId) === String(myPlayerId) && myWinGold !== 0) {
            var localGold = myglobal.playerData.gobal_count || 0;
            this._updatePlayerGoldDisplay(playerId, localGold);
          }
        }
      }
    }

    // 播放结果音效
    this._playGameResultSound(isWinner);

    // 创建结算弹窗
    var self = this;
    this._createGameResultPopup(data, isWinner, myWinGold, function (action) {
      if (action === "continue") {
        // 继续游戏：发送 ready 请求
        self._continueGame();
      } else if (action === "lobby") {
        // 返回大厅
        self._returnToLobby();
      }
    });
  },
  /**
   * 🏆 创建结算弹窗UI - 欢乐斗地主高级风格
   * @param {Object} data - 结算数据
   * @param {Boolean} isWinner - 是否胜利
   * @param {Number} myWinGold - 当前玩家输赢豆子
   * @param {Function} callback - 回调函数
   */
  _createGameResultPopup: function _createGameResultPopup(data, isWinner, myWinGold, callback) {
    var self = this;
    var winSize = cc.winSize;

    // 🔧【关键修复】找到Canvas节点作为弹窗父节点
    var canvas = cc.find("Canvas") || cc.find("UI_ROOT") || this.node.parent;
    if (!canvas) {
      console.error("🏆 [_createGameResultPopup] 找不到Canvas节点");
      canvas = this.node;
    }

    // ==================== 遮罩层 ====================
    var maskNode = new cc.Node();
    maskNode.name = "GameResultMask";
    maskNode.addComponent(cc.BlockInputEvents);
    var maskSprite = maskNode.addComponent(cc.Sprite);
    maskSprite.spriteFrame = new cc.SpriteFrame();
    maskSprite.type = cc.Sprite.Type.SIMPLE;
    maskSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    maskNode.width = winSize.width * 2;
    maskNode.height = winSize.height * 2;
    // 🔧【修复】不通过color设置alpha，使用opacity代替
    maskNode.color = isWinner ? new cc.Color(0, 0, 30) : new cc.Color(30, 0, 0);
    maskNode.opacity = 0;
    maskNode.x = 0;
    maskNode.y = 0;
    maskNode.zIndex = 999; // 🔧【修复】遮罩层zIndex
    maskNode.parent = canvas;

    // 遮罩淡入动画
    cc.tween(maskNode).to(0.3, {
      opacity: 255
    }).start();

    // ==================== 弹窗容器 ====================
    var popupNode = new cc.Node();
    popupNode.name = "GameResultPopup";
    popupNode.x = 0;
    popupNode.y = 0;
    popupNode.scale = 0.5;
    popupNode.opacity = 0;
    popupNode.zIndex = 1000; // 🔧【修复】弹窗层zIndex
    popupNode.parent = canvas;

    // 弹窗尺寸（70%宽，75%高）
    var popupWidth = Math.min(winSize.width * 0.7, 800);
    var popupHeight = Math.min(winSize.height * 0.75, 550);

    // ==================== 主背景 - 渐变效果 ====================
    var bgNode = self._createGradientBackground(popupWidth, popupHeight, isWinner);
    bgNode.parent = popupNode;

    // ==================== 金边描边 ====================
    var borderNode = self._createGoldenBorder(popupWidth, popupHeight, isWinner);
    borderNode.parent = popupNode;

    // ==================== 粒子特效层 ====================
    var effectLayer = new cc.Node("EffectLayer");
    effectLayer.parent = popupNode;

    // 胜利粒子特效
    if (isWinner) {
      self._createVictoryParticles(effectLayer, popupWidth, popupHeight);
    } else {
      self._createDefeatParticles(effectLayer, popupWidth, popupHeight);
    }

    // ==================== 顶部 Banner ====================
    var bannerY = popupHeight / 2 - 60;
    var bannerNode = self._createResultBanner(isWinner, popupWidth);
    bannerNode.y = bannerY;
    bannerNode.parent = popupNode;

    // ==================== 右侧倍数详情卡 ====================
    var detailX = popupWidth / 2 - 130;
    var detailY = 20;
    var detailNode = self._createMultiplierDetailCard(data, isWinner);
    detailNode.x = detailX;
    detailNode.y = detailY;
    detailNode.parent = popupNode;

    // ==================== 中间玩家结果列表 ====================
    var listWidth = popupWidth * 0.55;
    var listX = -popupWidth / 2 + listWidth / 2 + 50;
    var listY = -20;
    var playerListNode = self._createPlayerResultList(data, isWinner, myWinGold, listWidth);
    playerListNode.x = listX;
    playerListNode.y = listY;
    playerListNode.parent = popupNode;

    // ==================== 底部按钮区域 ====================
    var btnY = -popupHeight / 2 + 60;
    var buttonArea = self._createButtonArea(isWinner, function (action) {
      self._closeGameResultPopup(popupNode, maskNode);
      if (callback) callback(action);
    });
    buttonArea.y = btnY;
    buttonArea.parent = popupNode;

    // ==================== 弹出动画 ====================
    cc.tween(popupNode).to(0.35, {
      scale: 1,
      opacity: 255
    }, {
      easing: 'backOut'
    }).call(function () {
      // 触发数字滚动动画
      self._startNumberAnimations(popupNode, data, myWinGold);
    }).start();

    // 保存引用
    this._gameResultPopup = popupNode;
    this._gameResultMask = maskNode;
    this._resultEffectLayer = effectLayer;
  },
  // ============================================================
  // 🎨 结算弹窗视觉组件 - 高级效果
  // ============================================================

  /**
   * 🎨 创建渐变背景
   */
  _createGradientBackground: function _createGradientBackground(width, height, isWinner) {
    var bgNode = new cc.Node("GradientBg");
    var graphics = bgNode.addComponent(cc.Graphics);

    // 渐变色
    var topColor = isWinner ? new cc.Color(40, 30, 80, 255) : new cc.Color(30, 30, 40, 255);
    var bottomColor = isWinner ? new cc.Color(20, 15, 50, 255) : new cc.Color(20, 20, 30, 255);

    // 绘制渐变矩形（模拟）
    graphics.fillColor = bottomColor;
    graphics.roundRect(-width / 2, -height / 2, width, height, 20);
    graphics.fill();

    // 添加内发光效果
    var innerGlow = new cc.Node("InnerGlow");
    var glowSprite = innerGlow.addComponent(cc.Sprite);
    glowSprite.spriteFrame = new cc.SpriteFrame();
    glowSprite.type = cc.Sprite.Type.SLICED;
    innerGlow.width = width - 20;
    innerGlow.height = height - 20;
    // 🔧【修复】不通过color设置alpha，使用opacity代替
    innerGlow.color = isWinner ? new cc.Color(60, 40, 100) : new cc.Color(40, 40, 50);
    innerGlow.opacity = 100;
    innerGlow.parent = bgNode;

    // 添加背景纹理效果
    var overlay = new cc.Node("Overlay");
    var overlaySprite = overlay.addComponent(cc.Sprite);
    overlaySprite.spriteFrame = new cc.SpriteFrame();
    overlay.width = width;
    overlay.height = height;
    // 🔧【修复】不通过color设置alpha，使用opacity代替
    overlay.color = isWinner ? new cc.Color(80, 50, 120) : new cc.Color(50, 50, 60);
    overlay.opacity = 30;
    overlay.parent = bgNode;
    return bgNode;
  },
  /**
   * 🎨 创建金边描边
   */
  _createGoldenBorder: function _createGoldenBorder(width, height, isWinner) {
    var borderNode = new cc.Node("GoldenBorder");
    var graphics = borderNode.addComponent(cc.Graphics);

    // 边框颜色
    var borderColor = isWinner ? new cc.Color(255, 200, 50, 255) : new cc.Color(100, 100, 120, 255);
    var glowColor = isWinner ? new cc.Color(255, 180, 0, 150) : new cc.Color(80, 80, 100, 100);

    // 外发光
    graphics.strokeColor = glowColor;
    graphics.lineWidth = 8;
    graphics.roundRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, 24);
    graphics.stroke();

    // 主边框
    graphics.strokeColor = borderColor;
    graphics.lineWidth = 3;
    graphics.roundRect(-width / 2, -height / 2, width, height, 20);
    graphics.stroke();

    // 角落装饰
    var cornerSize = 30;
    var corners = [{
      x: -width / 2,
      y: height / 2,
      rot: 0
    }, {
      x: width / 2,
      y: height / 2,
      rot: 90
    }, {
      x: width / 2,
      y: -height / 2,
      rot: 180
    }, {
      x: -width / 2,
      y: -height / 2,
      rot: 270
    }];
    for (var i = 0; i < corners.length; i++) {
      var corner = corners[i];
      var decorNode = new cc.Node("Corner_" + i);
      var dg = decorNode.addComponent(cc.Graphics);
      dg.strokeColor = borderColor;
      dg.lineWidth = 2;
      dg.moveTo(0, 0);
      dg.lineTo(cornerSize, 0);
      dg.lineTo(cornerSize, cornerSize);
      dg.stroke();
      decorNode.x = corner.x;
      decorNode.y = corner.y;
      decorNode.angle = corner.rot;
      decorNode.parent = borderNode;
    }
    return borderNode;
  },
  /**
   * 🏆 创建结果Banner（胜利/失败标题）
   */
  _createResultBanner: function _createResultBanner(isWinner, popupWidth) {
    var bannerNode = new cc.Node("ResultBanner");

    // Banner背景
    var bgNode = new cc.Node("BannerBg");
    var graphics = bgNode.addComponent(cc.Graphics);
    var bannerWidth = popupWidth * 0.6;
    var bannerHeight = 70;
    if (isWinner) {
      // 胜利 - 金色渐变背景
      graphics.fillColor = new cc.Color(200, 150, 30, 200);
      graphics.roundRect(-bannerWidth / 2, -bannerHeight / 2, bannerWidth, bannerHeight, 35);
      graphics.fill();

      // 发光边框
      graphics.strokeColor = new cc.Color(255, 220, 100, 255);
      graphics.lineWidth = 3;
      graphics.roundRect(-bannerWidth / 2, -bannerHeight / 2, bannerWidth, bannerHeight, 35);
      graphics.stroke();
    } else {
      // 失败 - 暗红色背景
      graphics.fillColor = new cc.Color(80, 40, 50, 200);
      graphics.roundRect(-bannerWidth / 2, -bannerHeight / 2, bannerWidth, bannerHeight, 35);
      graphics.fill();
      graphics.strokeColor = new cc.Color(150, 100, 100, 255);
      graphics.lineWidth = 2;
      graphics.roundRect(-bannerWidth / 2, -bannerHeight / 2, bannerWidth, bannerHeight, 35);
      graphics.stroke();
    }
    bgNode.parent = bannerNode;

    // 标题文字
    var titleNode = new cc.Node("Title");
    titleNode.anchorX = 0.5;
    titleNode.anchorY = 0.5;
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = isWinner ? "🏆 胜 利 🏆" : "✖ 失 败 ✖";
    titleLabel.fontSize = 42;
    titleLabel.lineHeight = 50;
    titleLabel.fontFamily = "Arial";
    titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    titleLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
    titleNode.color = isWinner ? new cc.Color(255, 255, 255) : new cc.Color(200, 180, 180);

    // 添加描边
    var outline = titleNode.addComponent(cc.LabelOutline);
    outline.color = isWinner ? new cc.Color(150, 100, 0) : new cc.Color(80, 40, 40);
    outline.width = 3;

    // 添加发光效果（使用阴影模拟）
    var shadow = titleNode.addComponent(cc.LabelShadow);
    shadow.color = isWinner ? new cc.Color(255, 200, 0, 200) : new cc.Color(100, 50, 50, 150);
    shadow.offset = cc.v2(0, 0);
    shadow.blur = 8;
    titleNode.parent = bannerNode;

    // 胜利时的呼吸发光动画
    if (isWinner) {
      cc.tween(bannerNode).repeatForever(cc.tween().to(1.0, {
        scale: 1.02
      }).to(1.0, {
        scale: 1.0
      })).start();
    }
    return bannerNode;
  },
  /**
   * 📊 创建倍数详情卡
   */
  _createMultiplierDetailCard: function _createMultiplierDetailCard(data, isWinner) {
    var cardNode = new cc.Node("MultiplierCard");
    var cardWidth = 180;
    var cardHeight = 250; // 增加高度以容纳王炸行

    // 卡片背景
    var bgNode = new cc.Node("CardBg");
    var graphics = bgNode.addComponent(cc.Graphics);
    graphics.fillColor = isWinner ? new cc.Color(50, 35, 70, 220) : new cc.Color(35, 35, 45, 220);
    graphics.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 15);
    graphics.fill();
    graphics.strokeColor = isWinner ? new cc.Color(180, 140, 60, 200) : new cc.Color(80, 80, 100, 200);
    graphics.lineWidth = 2;
    graphics.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 15);
    graphics.stroke();
    bgNode.parent = cardNode;

    // 标题
    var titleNode = new cc.Node("Title");
    titleNode.anchorX = 0.5;
    titleNode.anchorY = 0.5;
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = "本局详情";
    titleLabel.fontSize = 20;
    titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    titleLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
    titleNode.color = new cc.Color(200, 200, 200);
    titleNode.y = cardHeight / 2 - 25;
    titleNode.parent = cardNode;

    // 分隔线
    var lineNode = new cc.Node("Line");
    var lg = lineNode.addComponent(cc.Graphics);
    lg.strokeColor = new cc.Color(100, 100, 100, 150);
    lg.lineWidth = 1;
    lg.moveTo(-cardWidth / 2 + 15, 0);
    lg.lineTo(cardWidth / 2 - 15, 0);
    lg.stroke();
    lineNode.y = cardHeight / 2 - 50;
    lineNode.parent = cardNode;

    // 详情列表
    var multiDetail = data.multi_detail || {};
    var details = [{
      label: "底分",
      value: data.base_score || 10
    }, {
      label: "抢地主",
      value: multiDetail.qiang_count > 0 ? "x" + multiDetail.qiang_multi : "-"
    }, {
      label: "炸弹",
      value: multiDetail.bomb_count > 0 ? "x" + multiDetail.bomb_multi : "-"
    }, {
      label: "王炸",
      value: multiDetail.rocket_count > 0 ? "x" + multiDetail.rocket_multi : "-"
    }, {
      label: "春天",
      value: multiDetail.spring_type > 0 ? "x2" : "-"
    }];
    var itemY = cardHeight / 2 - 75;
    var itemHeight = 28;
    for (var i = 0; i < details.length; i++) {
      var item = details[i];
      var itemNode = new cc.Node("Item_" + i);

      // 标签
      var labelNode = new cc.Node("Label");
      labelNode.anchorX = 0.5;
      labelNode.anchorY = 0.5;
      var label = labelNode.addComponent(cc.Label);
      label.string = item.label;
      label.fontSize = 16;
      label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
      label.verticalAlign = cc.Label.VerticalAlign.CENTER;
      labelNode.color = new cc.Color(180, 180, 180);
      labelNode.x = -cardWidth / 2 + 35;
      labelNode.parent = itemNode;

      // 值
      var valueNode = new cc.Node("Value");
      valueNode.anchorX = 0.5;
      valueNode.anchorY = 0.5;
      var valueLabel = valueNode.addComponent(cc.Label);
      valueLabel.string = String(item.value);
      valueLabel.fontSize = 16;
      valueLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
      valueLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
      valueNode.color = new cc.Color(255, 220, 150);
      valueNode.x = cardWidth / 2 - 40;
      valueNode.parent = itemNode;
      itemNode.y = itemY - i * itemHeight;
      itemNode.parent = cardNode;
    }

    // 总倍数（大号金色）
    var totalMultiNode = new cc.Node("TotalMulti");
    var totalMultiBg = new cc.Node("Bg");
    var tmg = totalMultiBg.addComponent(cc.Graphics);
    tmg.fillColor = isWinner ? new cc.Color(80, 50, 20, 200) : new cc.Color(40, 40, 50, 200);
    tmg.roundRect(-cardWidth / 2 + 10, -cardHeight / 2 + 5, cardWidth - 20, 50, 10);
    tmg.fill();
    totalMultiBg.y = -cardHeight / 2 + 30;
    totalMultiBg.parent = totalMultiNode;
    var totalLabel = new cc.Node("Label");
    totalLabel.anchorX = 0.5;
    totalLabel.anchorY = 0.5;
    var ttl = totalLabel.addComponent(cc.Label);
    ttl.string = "总倍数";
    ttl.fontSize = 14;
    ttl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    ttl.verticalAlign = cc.Label.VerticalAlign.CENTER;
    totalLabel.color = new cc.Color(180, 180, 180);
    totalLabel.y = 12;
    totalLabel.parent = totalMultiNode;
    var multiValueNode = new cc.Node("Value");
    multiValueNode.name = "MultiplierValue";
    multiValueNode.anchorX = 0.5;
    multiValueNode.anchorY = 0.5;
    var mvl = multiValueNode.addComponent(cc.Label);
    mvl.string = "x" + (data.multiple || 1);
    mvl.fontSize = 28;
    mvl.fontFamily = "Arial";
    mvl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    mvl.verticalAlign = cc.Label.VerticalAlign.CENTER;
    multiValueNode.color = isWinner ? new cc.Color(255, 200, 50) : new cc.Color(200, 200, 200);

    // 添加描边
    var mvo = multiValueNode.addComponent(cc.LabelOutline);
    mvo.color = isWinner ? new cc.Color(150, 100, 0) : new cc.Color(60, 60, 60);
    mvo.width = 2;
    multiValueNode.y = -8;
    multiValueNode.parent = totalMultiNode;
    totalMultiNode.y = -cardHeight / 2 + 30;
    totalMultiNode.parent = cardNode;
    return cardNode;
  },
  /**
   * 👥 创建玩家结果列表
   */
  _createPlayerResultList: function _createPlayerResultList(data, isWinner, myWinGold, listWidth) {
    var listNode = new cc.Node("PlayerResultList");
    var listHeight = 260;

    // 列表背景
    var bgNode = new cc.Node("ListBg");
    var graphics = bgNode.addComponent(cc.Graphics);
    graphics.fillColor = new cc.Color(0, 0, 0, 80);
    graphics.roundRect(-listWidth / 2, -listHeight / 2, listWidth, listHeight, 12);
    graphics.fill();
    bgNode.parent = listNode;

    // 表头
    var headerNode = new cc.Node("Header");
    var headers = ["玩家", "身份", "输赢"];
    var headerX = [-listWidth / 2 + 80, 20, listWidth / 2 - 60];
    for (var i = 0; i < headers.length; i++) {
      var hNode = new cc.Node("H_" + i);
      hNode.anchorX = 0.5;
      hNode.anchorY = 0.5;
      var hLabel = hNode.addComponent(cc.Label);
      hLabel.string = headers[i];
      hLabel.fontSize = 18;
      hLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
      hLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
      hNode.color = new cc.Color(150, 150, 160);
      hNode.x = headerX[i];
      hNode.parent = headerNode;
    }
    headerNode.y = listHeight / 2 - 25;
    headerNode.parent = listNode;

    // 分隔线
    var sepNode = new cc.Node("Separator");
    var sg = sepNode.addComponent(cc.Graphics);
    sg.strokeColor = new cc.Color(100, 100, 100, 100);
    sg.lineWidth = 1;
    sg.moveTo(-listWidth / 2 + 15, 0);
    sg.lineTo(listWidth / 2 - 15, 0);
    sg.stroke();
    sepNode.y = listHeight / 2 - 45;
    sepNode.parent = listNode;

    // 玩家列表
    var players = data.players || [];
    var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID;
    var itemStartY = listHeight / 2 - 75;
    var itemHeight = 65;
    for (var i = 0; i < players.length && i < 3; i++) {
      var player = players[i];
      var isCurrentPlayer = String(player.player_id) === String(myPlayerId);
      var itemNode = this._createPlayerResultItem(player, isCurrentPlayer, isWinner, listWidth, i);
      itemNode.y = itemStartY - i * itemHeight;
      itemNode.parent = listNode;
    }
    return listNode;
  },
  /**
   * 👤 创建单个玩家结果项
   */
  _createPlayerResultItem: function _createPlayerResultItem(player, isCurrentPlayer, isWinner, listWidth, index) {
    var self = this;
    var itemNode = new cc.Node("PlayerItem_" + index);
    var itemHeight = 55;

    // 当前玩家高亮背景
    if (isCurrentPlayer) {
      var highlight = new cc.Node("Highlight");
      var hg = highlight.addComponent(cc.Graphics);
      hg.fillColor = isWinner ? new cc.Color(80, 60, 30, 150) : new cc.Color(50, 40, 50, 150);
      hg.roundRect(-listWidth / 2 + 10, -itemHeight / 2, listWidth - 20, itemHeight, 8);
      hg.fill();
      hg.strokeColor = isWinner ? new cc.Color(200, 150, 50, 200) : new cc.Color(100, 80, 100, 150);
      hg.lineWidth = 2;
      hg.roundRect(-listWidth / 2 + 10, -itemHeight / 2, listWidth - 20, itemHeight, 8);
      hg.stroke();
      highlight.parent = itemNode;
    }

    // 头像区域
    var avatarNode = new cc.Node("Avatar");
    avatarNode.x = -listWidth / 2 + 45;

    // 头像背景（圆形）
    var avatarBg = new cc.Node("AvatarBg");
    var ag = avatarBg.addComponent(cc.Graphics);
    var isLandlord = player.role === "landlord";

    // 绘制圆形头像框
    ag.strokeColor = isLandlord ? new cc.Color(255, 200, 50, 255) : new cc.Color(180, 180, 200, 255);
    ag.lineWidth = 3;
    ag.circle(0, 0, 22);
    ag.stroke();
    ag.fillColor = new cc.Color(60, 60, 80, 200);
    ag.circle(0, 0, 20);
    ag.fill();
    avatarBg.parent = avatarNode;

    // 尝试加载头像
    var avatarIndex = index % 4 + 1;
    var avatarPath = "UI/headimage/avatar_" + avatarIndex;
    cc.resources.load(avatarPath, cc.SpriteFrame, function (err, spriteFrame) {
      if (!err && spriteFrame) {
        var avatarSprite = new cc.Node("AvatarSprite");
        var sp = avatarSprite.addComponent(cc.Sprite);
        sp.spriteFrame = spriteFrame;
        sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        avatarSprite.width = 36;
        avatarSprite.height = 36;
        avatarSprite.parent = avatarNode;
      }
    });

    // 身份图标
    var roleIconNode = new cc.Node("RoleIcon");
    var roleLabel = roleIconNode.addComponent(cc.Label);
    roleLabel.string = isLandlord ? "👑" : "🌾";
    roleLabel.fontSize = 14;
    roleIconNode.x = 18;
    roleIconNode.y = -15;
    roleIconNode.parent = avatarNode;
    avatarNode.parent = itemNode;

    // 玩家名称
    var nameNode = new cc.Node("Name");
    nameNode.anchorX = 0.5;
    nameNode.anchorY = 0.5;
    var nameLabel = nameNode.addComponent(cc.Label);
    nameLabel.string = player.player_name || "玩家" + (index + 1);
    nameLabel.fontSize = 18;
    nameLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    nameLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;
    nameNode.color = isCurrentPlayer ? new cc.Color(255, 255, 200) : new cc.Color(220, 220, 220);
    nameNode.x = -listWidth / 2 + 100;
    nameNode.parent = itemNode;

    // 身份
    var roleNode = new cc.Node("Role");
    roleNode.anchorX = 0.5;
    roleNode.anchorY = 0.5;
    var roleText = roleNode.addComponent(cc.Label);
    roleText.string = isLandlord ? "地主" : "农民";
    roleText.fontSize = 18;
    roleText.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    roleText.verticalAlign = cc.Label.VerticalAlign.CENTER;
    roleNode.color = isLandlord ? new cc.Color(255, 200, 100) : new cc.Color(120, 200, 120);
    roleNode.x = 20;
    roleNode.parent = itemNode;

    // 输赢金额
    var winGold = player.win_gold || 0;
    var winNode = new cc.Node("WinGold");
    winNode.name = "WinGoldValue";
    winNode.anchorX = 0.5;
    winNode.anchorY = 0.5;
    var winLabel = winNode.addComponent(cc.Label);
    winLabel.string = (winGold >= 0 ? "+" : "") + winGold;
    winLabel.fontSize = 22;
    winLabel.fontFamily = "Arial";
    winLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    winLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;

    // 添加描边
    var winOutline = winNode.addComponent(cc.LabelOutline);
    winOutline.color = winGold >= 0 ? new cc.Color(0, 80, 0) : new cc.Color(100, 0, 0);
    winOutline.width = 2;
    winNode.color = winGold >= 0 ? new cc.Color(100, 255, 100) : new cc.Color(255, 100, 100);
    winNode.x = listWidth / 2 - 50;
    winNode.parent = itemNode;
    return itemNode;
  },
  /**
   * 🔘 创建按钮区域
   */
  _createButtonArea: function _createButtonArea(isWinner, callback) {
    var self = this;
    var areaNode = new cc.Node("ButtonArea");

    // 继续游戏按钮
    var continueBtn = self._createStyledButton("继续游戏", isWinner, true);
    continueBtn.x = -100;
    continueBtn.parent = areaNode;
    continueBtn.on(cc.Node.EventType.TOUCH_END, function () {
      if (callback) callback("continue");
    });

    // 返回大厅按钮
    var lobbyBtn = self._createStyledButton("返回大厅", isWinner, false);
    lobbyBtn.x = 100;
    lobbyBtn.parent = areaNode;
    lobbyBtn.on(cc.Node.EventType.TOUCH_END, function () {
      if (callback) callback("lobby");
    });
    return areaNode;
  },
  /**
   * 🔘 创建高级样式按钮
   */
  _createStyledButton: function _createStyledButton(text, isWinner, isPrimary) {
    var btnNode = new cc.Node("Btn_" + text);
    var btnWidth = 140;
    var btnHeight = 50;

    // 🔧【修复】设置按钮节点的内容大小，确保点击区域正确
    btnNode.setContentSize(btnWidth, btnHeight);
    btnNode.setAnchorPoint(0.5, 0.5);

    // 🔧【修复】添加 BlockInputEvents 组件，确保按钮可以接收点击事件
    btnNode.addComponent(cc.BlockInputEvents);

    // 按钮背景
    var graphics = btnNode.addComponent(cc.Graphics);
    if (isPrimary) {
      // 主要按钮 - 金橙渐变
      if (isWinner) {
        graphics.fillColor = new cc.Color(200, 140, 30, 255);
      } else {
        graphics.fillColor = new cc.Color(60, 120, 180, 255);
      }
    } else {
      // 次要按钮 - 蓝紫渐变
      graphics.fillColor = new cc.Color(80, 70, 120, 255);
    }
    graphics.roundRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 25);
    graphics.fill();

    // 边框
    if (isPrimary && isWinner) {
      graphics.strokeColor = new cc.Color(255, 220, 100, 255);
      graphics.lineWidth = 2;
      graphics.roundRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 25);
      graphics.stroke();
    }

    // 按钮文字
    var labelNode = new cc.Node("Label");
    labelNode.anchorX = 0.5;
    labelNode.anchorY = 0.5;
    var label = labelNode.addComponent(cc.Label);
    label.string = text;
    label.fontSize = 22;
    label.fontFamily = "Arial";
    label.overflow = cc.Label.Overflow.SHRINK;
    label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    label.verticalAlign = cc.Label.VerticalAlign.CENTER;
    labelNode.width = btnWidth - 20; // 留出边距防止溢出
    labelNode.height = btnHeight - 10;
    labelNode.color = new cc.Color(255, 255, 255);

    // 添加描边
    var outline = labelNode.addComponent(cc.LabelOutline);
    outline.color = new cc.Color(0, 0, 0);
    outline.width = 2;
    labelNode.parent = btnNode;

    // 点击效果
    btnNode.on(cc.Node.EventType.TOUCH_START, function () {
      cc.tween(btnNode).to(0.1, {
        scale: 0.95
      }).start();
    });
    btnNode.on(cc.Node.EventType.TOUCH_END, function () {
      cc.tween(btnNode).to(0.1, {
        scale: 1
      }).start();
    });
    btnNode.on(cc.Node.EventType.TOUCH_CANCEL, function () {
      cc.tween(btnNode).to(0.1, {
        scale: 1
      }).start();
    });
    return btnNode;
  },
  /**
   * ✨ 创建胜利粒子特效
   */
  _createVictoryParticles: function _createVictoryParticles(parent, width, height) {
    var self = this;

    // 金币粒子
    for (var i = 0; i < 15; i++) {
      (function (index) {
        var coin = new cc.Node("Coin_" + index);
        coin.x = (Math.random() - 0.5) * width;
        coin.y = height / 2 + 50;

        // 绘制金币
        var g = coin.addComponent(cc.Graphics);
        g.fillColor = new cc.Color(255, 200, 50, 255);
        g.circle(0, 0, 8);
        g.fill();
        g.strokeColor = new cc.Color(200, 150, 30, 255);
        g.lineWidth = 1;
        g.circle(0, 0, 8);
        g.stroke();
        coin.parent = parent;

        // 下落动画
        var duration = 1.5 + Math.random() * 1.5;
        var targetY = -height / 2 - 50;
        var delay = Math.random() * 0.5;
        cc.tween(coin).delay(delay).parallel(cc.tween().to(duration, {
          y: targetY
        }, {
          easing: 'quadIn'
        }), cc.tween().to(duration, {
          x: coin.x + (Math.random() - 0.5) * 100
        }), cc.tween().to(duration / 2, {
          angle: -180
        }).to(duration / 2, {
          angle: -360
        })).call(function () {
          // 循环
          coin.y = height / 2 + 50;
          coin.x = (Math.random() - 0.5) * width;
          cc.tween(coin).parallel(cc.tween().to(duration, {
            y: targetY
          }, {
            easing: 'quadIn'
          }), cc.tween().to(duration, {
            x: coin.x + (Math.random() - 0.5) * 100
          }), cc.tween().to(duration / 2, {
            angle: -180
          }).to(duration / 2, {
            angle: -360
          })).start();
        }).start();
      })(i);
    }

    // 星光闪烁
    for (var j = 0; j < 8; j++) {
      (function (index) {
        var star = new cc.Node("Star_" + index);
        star.x = (Math.random() - 0.5) * width * 0.8;
        star.y = (Math.random() - 0.5) * height * 0.8;

        // 绘制星星
        var sg = star.addComponent(cc.Graphics);
        sg.fillColor = new cc.Color(255, 255, 200, 200);
        self._drawStar(sg, 0, 0, 6, 5);
        star.parent = parent;
        star.opacity = 0;

        // 闪烁动画
        cc.tween(star).delay(Math.random() * 2).repeatForever(cc.tween().to(0.3, {
          opacity: 255,
          scale: 1.2
        }).to(0.3, {
          opacity: 100,
          scale: 0.8
        }).to(0.3, {
          opacity: 255,
          scale: 1.2
        }).to(0.3, {
          opacity: 0,
          scale: 0.5
        }).delay(1 + Math.random() * 2)).start();
      })(j);
    }
  },
  /**
   * 🌧️ 创建失败粒子特效
   */
  _createDefeatParticles: function _createDefeatParticles(parent, width, height) {
    // 蓝色漂浮粒子
    for (var i = 0; i < 10; i++) {
      (function (index) {
        var particle = new cc.Node("DefeatParticle_" + index);
        particle.x = (Math.random() - 0.5) * width;
        particle.y = (Math.random() - 0.5) * height;

        // 绘制粒子
        var g = particle.addComponent(cc.Graphics);
        g.fillColor = new cc.Color(80, 100, 150, 150);
        g.circle(0, 0, 4 + Math.random() * 3);
        g.fill();
        particle.parent = parent;
        particle.opacity = 0;

        // 缓慢漂浮动画
        var duration = 3 + Math.random() * 2;
        cc.tween(particle).to(0.5, {
          opacity: 150
        }).parallel(cc.tween().to(duration, {
          y: particle.y + 50 + Math.random() * 30
        }, {
          easing: 'sineInOut'
        }), cc.tween().to(duration, {
          x: particle.x + (Math.random() - 0.5) * 40
        })).to(0.5, {
          opacity: 0
        }).call(function () {
          particle.y = (Math.random() - 0.5) * height;
          particle.x = (Math.random() - 0.5) * width;
        }).start();

        // 循环
        cc.tween(particle).delay(4).repeatForever(cc.tween().to(0.5, {
          opacity: 150
        }).parallel(cc.tween().to(duration, {
          y: particle.y + 50 + Math.random() * 30
        }, {
          easing: 'sineInOut'
        }), cc.tween().to(duration, {
          x: particle.x + (Math.random() - 0.5) * 40
        })).to(0.5, {
          opacity: 0
        })).start();
      })(i);
    }
  },
  /**
   * ⭐ 绘制星形
   */
  _drawStar: function _drawStar(graphics, cx, cy, innerRadius, points) {
    var outerRadius = innerRadius * 2;
    graphics.moveTo(cx, cy + outerRadius);
    for (var i = 0; i < points * 2; i++) {
      var radius = i % 2 === 0 ? outerRadius : innerRadius;
      var angle = i * Math.PI / points - Math.PI / 2;
      var x = cx + Math.cos(angle) * radius;
      var y = cy + Math.sin(angle) * radius;
      graphics.lineTo(x, y);
    }
    graphics.close();
    graphics.fill();
  },
  /**
   * 🔢 启动数字动画
   */
  _startNumberAnimations: function _startNumberAnimations(popupNode, data, myWinGold) {
    var self = this;

    // 倍数滚动动画
    var multiValueNode = self._findNodeByName(popupNode, "MultiplierValue");
    if (multiValueNode) {
      var targetMulti = data.multiple || 1;
      self._animateNumber(multiValueNode, 1, targetMulti, 800, "x");
    }
  },
  /**
   * 🔢 数字滚动动画
   */
  _animateNumber: function _animateNumber(node, from, to, duration, prefix) {
    if (!node) return;
    var label = node.getComponent(cc.Label);
    if (!label) return;
    var startTime = Date.now();
    var diff = to - from;
    var update = function update() {
      if (!node.isValid) return;
      var elapsed = Date.now() - startTime;
      var progress = Math.min(elapsed / duration, 1);

      // 使用缓动函数
      var easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      var current = Math.floor(from + diff * easeProgress);
      label.string = (prefix || "") + current;
      if (progress < 1) {
        setTimeout(update, 16);
      } else {
        label.string = (prefix || "") + to;
      }
    };
    update();
  },
  /**
   * 🔍 查找节点
   */
  _findNodeByName: function _findNodeByName(parent, name) {
    if (!parent) return null;
    var children = parent.children;
    for (var i = 0; i < children.length; i++) {
      if (children[i].name === name) {
        return children[i];
      }
      var found = this._findNodeByName(children[i], name);
      if (found) return found;
    }
    return null;
  },
  /**
   * 关闭结算弹窗 - 带缩小淡出动画
   */
  _closeGameResultPopup: function _closeGameResultPopup(popupNode, maskNode) {
    var self = this;

    // 停止所有粒子动画
    if (this._resultEffectLayer) {
      this._resultEffectLayer.stopAllActions();
      var children = this._resultEffectLayer.children;
      for (var i = 0; i < children.length; i++) {
        children[i].stopAllActions();
      }
    }

    // 弹窗缩小淡出动画
    if (popupNode) {
      cc.tween(popupNode).to(0.2, {
        scale: 0.8,
        opacity: 0
      }, {
        easing: 'backIn'
      }).call(function () {
        if (popupNode && popupNode.isValid) {
          popupNode.destroy();
        }
      }).start();
    }

    // 遮罩淡出
    if (maskNode) {
      cc.tween(maskNode).to(0.2, {
        opacity: 0
      }).call(function () {
        if (maskNode && maskNode.isValid) {
          maskNode.destroy();
        }
      }).start();
    }
    this._gameResultPopup = null;
    this._gameResultMask = null;
    this._resultEffectLayer = null;
  },
  /**
   * 继续游戏
   */
  _continueGame: function _continueGame() {
    var myglobal = window.myglobal;
    if (!myglobal || !myglobal.playerData) {
      return;
    }

    // 🔧【新增】检查玩家豆子是否足够继续游戏
    var playerGold = myglobal.playerData.gobal_count || 0;
    var roomConfig = myglobal.currentRoomConfig || {};
    var minGold = roomConfig.min_gold || roomConfig.minGold || 0;
    if (playerGold < minGold) {
      // 豆子不足，显示豆子不足弹窗
      this._showInsufficientGoldPopup(playerGold, minGold);
      return;
    }

    // 豆子足够，继续游戏
    this._doContinueGame();
  },
  /**
   * 🔧【新增】执行继续游戏逻辑
   */
  _doContinueGame: function _doContinueGame() {
    // 清理当前游戏状态
    this._resetGameState();

    // 发送 ready 请求（准备下一局）
    var myglobal = window.myglobal;
    if (myglobal && myglobal.socket && myglobal.socket.requestReady) {
      myglobal.socket.requestReady();
    }

    // 显示等待提示
    if (this.tipsLabel) {
      this.tipsLabel.string = "等待其他玩家...";
      var self = this;
      setTimeout(function () {
        if (self.tipsLabel) {
          self.tipsLabel.string = "";
        }
      }, 5000);
    }
  },
  /**
   * 🔧【新增】显示豆子不足弹窗
   */
  _showInsufficientGoldPopup: function _showInsufficientGoldPopup(currentGold, requiredGold) {
    var self = this;

    // 关闭结算弹窗
    this._closeGameResultPopup();

    // 创建豆子不足弹窗
    var canvas = cc.director.getScene().getChildByName("Canvas");
    if (!canvas) return;
    var winSize = cc.winSize;

    // 遮罩层
    var maskNode = new cc.Node("InsufficientGoldMask");
    maskNode.addComponent(cc.BlockInputEvents);
    var maskSprite = maskNode.addComponent(cc.Sprite);
    maskSprite.spriteFrame = new cc.SpriteFrame();
    maskSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    maskNode.width = winSize.width * 2;
    maskNode.height = winSize.height * 2;
    maskNode.color = new cc.Color(0, 0, 0);
    maskNode.opacity = 180;
    maskNode.parent = canvas;

    // 弹窗容器
    var popupNode = new cc.Node("InsufficientGoldPopup");
    popupNode.x = 0;
    popupNode.y = 0;
    popupNode.parent = canvas;

    // 弹窗背景
    var bgNode = new cc.Node("Bg");
    var graphics = bgNode.addComponent(cc.Graphics);
    var popupWidth = 450;
    var popupHeight = 320;
    graphics.fillColor = new cc.Color(40, 35, 60);
    graphics.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 20);
    graphics.fill();
    graphics.strokeColor = new cc.Color(255, 200, 100);
    graphics.lineWidth = 3;
    graphics.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 20);
    graphics.stroke();
    bgNode.parent = popupNode;

    // 标题
    var titleNode = new cc.Node("Title");
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = "豆子不足";
    titleLabel.fontSize = 28;
    titleLabel.fontFamily = "Arial";
    titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    titleNode.color = new cc.Color(255, 200, 100);
    titleNode.y = popupHeight / 2 - 45;
    titleNode.parent = popupNode;

    // 分隔线
    var lineNode = new cc.Node("Line");
    var lg = lineNode.addComponent(cc.Graphics);
    lg.strokeColor = new cc.Color(100, 80, 60);
    lg.lineWidth = 1;
    lg.moveTo(-popupWidth / 2 + 30, popupHeight / 2 - 80);
    lg.lineTo(popupWidth / 2 - 30, popupHeight / 2 - 80);
    lg.stroke();
    lineNode.parent = popupNode;

    // 内容区域
    var contentNode = new cc.Node("Content");
    var contentLabel = contentNode.addComponent(cc.Label);
    contentLabel.string = "当前豆子: " + this._formatGold(currentGold) + "\n需要豆子: " + this._formatGold(requiredGold) + "\n\n观看激励视频广告可获取豆子";
    contentLabel.fontSize = 20;
    contentLabel.fontFamily = "Arial";
    contentLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    contentLabel.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
    contentNode.width = popupWidth - 60;
    contentNode.color = new cc.Color(220, 220, 220);
    contentNode.y = 20;
    contentNode.parent = popupNode;

    // 按钮区域
    var btnAreaNode = new cc.Node("ButtonArea");
    btnAreaNode.y = -popupHeight / 2 + 60;
    btnAreaNode.parent = popupNode;

    // 观看广告按钮
    var adBtn = new cc.Node("AdBtn");
    var adBg = adBtn.addComponent(cc.Graphics);
    adBg.fillColor = new cc.Color(80, 180, 80);
    adBg.roundRect(-100, -25, 200, 50, 25);
    adBg.fill();
    adBtn.x = -110;
    adBtn.parent = btnAreaNode;
    var adLabelNode = new cc.Node("Label");
    var adLabel = adLabelNode.addComponent(cc.Label);
    adLabel.string = "观看广告";
    adLabel.fontSize = 20;
    adLabel.fontFamily = "Arial";
    adLabelNode.color = new cc.Color(255, 255, 255);
    adLabelNode.parent = adBtn;

    // 返回大厅按钮
    var lobbyBtn = new cc.Node("LobbyBtn");
    var lobbyBg = lobbyBtn.addComponent(cc.Graphics);
    lobbyBg.fillColor = new cc.Color(100, 80, 140);
    lobbyBg.roundRect(-100, -25, 200, 50, 25);
    lobbyBg.fill();
    lobbyBtn.x = 110;
    lobbyBtn.parent = btnAreaNode;
    var lobbyLabelNode = new cc.Node("Label");
    var lobbyLabel = lobbyLabelNode.addComponent(cc.Label);
    lobbyLabel.string = "返回大厅";
    lobbyLabel.fontSize = 20;
    lobbyLabel.fontFamily = "Arial";
    lobbyLabelNode.color = new cc.Color(255, 255, 255);
    lobbyLabelNode.parent = lobbyBtn;

    // 存储节点引用
    self._insufficientGoldPopup = popupNode;
    self._insufficientGoldMask = maskNode;

    // 观看广告按钮点击事件
    adBtn.on(cc.Node.EventType.TOUCH_END, function () {
      self._watchAdForGold(function (success) {
        if (success) {
          // 广告观看成功，关闭弹窗并继续游戏
          self._closeInsufficientGoldPopup();
          self._doContinueGame();
        }
      });
    });

    // 返回大厅按钮点击事件
    lobbyBtn.on(cc.Node.EventType.TOUCH_END, function () {
      self._closeInsufficientGoldPopup();
      self._returnToLobby();
    });
  },
  /**
   * 🔧【新增】关闭豆子不足弹窗
   */
  _closeInsufficientGoldPopup: function _closeInsufficientGoldPopup() {
    if (this._insufficientGoldPopup) {
      this._insufficientGoldPopup.destroy();
      this._insufficientGoldPopup = null;
    }
    if (this._insufficientGoldMask) {
      this._insufficientGoldMask.destroy();
      this._insufficientGoldMask = null;
    }
  },
  /**
   * 🔧【新增】观看激励视频广告获取豆子
   * @param {Function} callback - 回调函数，参数为是否成功
   */
  _watchAdForGold: function _watchAdForGold(callback) {
    var self = this;

    // 检查是否有广告SDK（可根据实际集成的广告SDK调整）
    // 这里提供一个通用的实现框架

    // 方式1: 如果集成了穿山甲广告SDK (Bytedance)
    if (typeof tt !== 'undefined' && tt.showRewardedVideoAd) {
      tt.showRewardedVideoAd({
        success: function success() {
          // 广告观看成功，奖励豆子
          self._rewardGoldAfterAd(callback);
        },
        fail: function fail() {
          // 广告观看失败
          self._showMessage("广告加载失败，请稍后重试");
          if (callback) callback(false);
        }
      });
      return;
    }

    // 方式2: 如果集成了微信小游戏广告SDK
    if (typeof wx !== 'undefined' && wx.createRewardedVideoAd) {
      var rewardedVideoAd = wx.createRewardedVideoAd({
        adUnitId: 'adunit-xxx' // 替换为实际的广告单元ID
      });

      rewardedVideoAd.onClose(function (res) {
        if (res && res.isEnded) {
          // 用户完整观看了广告
          self._rewardGoldAfterAd(callback);
        } else {
          // 用户提前关闭了广告
          self._showMessage("请完整观看广告获取奖励");
          if (callback) callback(false);
        }
      });
      rewardedVideoAd.onError(function (err) {
        self._showMessage("广告加载失败，请稍后重试");
        if (callback) callback(false);
      });
      rewardedVideoAd.show()["catch"](function () {
        // 失败重试
        rewardedVideoAd.load().then(function () {
          return rewardedVideoAd.show();
        });
      });
      return;
    }

    // 方式3: 模拟广告（开发测试用）
    // 在实际发布时应该删除此分支或替换为真实广告SDK
    self._showMessage("正在加载广告...");

    // 模拟广告观看过程（2秒后奖励豆子）
    setTimeout(function () {
      self._rewardGoldAfterAd(callback);
    }, 2000);
  },
  /**
   * 🔧【新增】广告观看成功后奖励豆子
   */
  _rewardGoldAfterGold: function _rewardGoldAfterGold(callback) {
    var myglobal = window.myglobal;
    if (!myglobal || !myglobal.playerData) {
      if (callback) callback(false);
      return;
    }

    // 奖励豆子数量（可根据实际需求调整）
    var rewardAmount = 5000;

    // 更新本地豆子数量
    myglobal.playerData.updateGold(rewardAmount);

    // 显示奖励提示
    this._showMessage("获得 " + this._formatGold(rewardAmount) + " 豆子！");

    // 通知服务端（如果需要同步）
    if (myglobal.socket && myglobal.socket.sendAdReward) {
      myglobal.socket.sendAdReward(rewardAmount);
    }
    if (callback) callback(true);
  },
  /**
   * 🔧【修复】广告观看成功后奖励豆子（修正方法名拼写错误）
   */
  _rewardGoldAfterAd: function _rewardGoldAfterAd(callback) {
    var myglobal = window.myglobal;
    if (!myglobal || !myglobal.playerData) {
      if (callback) callback(false);
      return;
    }

    // 奖励豆子数量（可根据实际需求调整）
    var rewardAmount = 5000;

    // 更新本地豆子数量
    myglobal.playerData.updateGold(rewardAmount);

    // 显示奖励提示
    this._showMessage("获得 " + this._formatGold(rewardAmount) + " 豆子！");

    // 通知服务端（如果需要同步）
    if (myglobal.socket && myglobal.socket.sendAdReward) {
      myglobal.socket.sendAdReward(rewardAmount);
    }
    if (callback) callback(true);
  },
  /**
   * 🔧【新增】格式化豆子数量显示
   */
  _formatGold: function _formatGold(gold) {
    if (gold >= 10000) {
      return (gold / 10000).toFixed(1) + "万";
    }
    return gold.toString();
  },
  /**
   * 🔧【新增】显示消息提示
   */
  _showMessage: function _showMessage(msg) {
    if (this.tipsLabel) {
      this.tipsLabel.string = msg;
      var self = this;
      setTimeout(function () {
        if (self.tipsLabel) {
          self.tipsLabel.string = "";
        }
      }, 3000);
    }
  },
  /**
   * 返回大厅
   */
  _returnToLobby: function _returnToLobby() {
    // 清理当前游戏状态
    this._resetGameState();

    // 发送离开房间请求
    var myglobal = window.myglobal;
    if (myglobal && myglobal.socket && myglobal.socket.leaveRoom) {
      myglobal.socket.leaveRoom();
    } else {
      console.error("🎮 [_returnToLobby] myglobal.socket.leaveRoom 不可用");
    }

    // 加载大厅场景
    cc.director.loadScene("hallScene", function () {});
  },
  /**
   * 重置游戏状态
   */
  _resetGameState: function _resetGameState() {
    // 清理手牌
    this.handCards = [];
    this.bottomCards = [];
    this.choose_card_data = [];

    // 清理卡牌节点
    this.clearAllCards();

    // 🔧【修复】清理所有玩家的出牌区域（桌面上的牌）
    this._clearAllOutCardZones();

    // 🔧【修复】清理底牌节点
    this._clearBottomCards();

    // 重置游戏阶段
    this._gamePhase = "idle";
    this._biddingPhase = "idle";

    // 隐藏所有UI
    this._hideRobUI();
    if (this.playingUI_node) {
      this.playingUI_node.active = false;
    }

    // 🔧【新增】重置所有玩家的准备图标状态
    this._resetAllPlayerReadyState();
  },
  /**
   * 🔧【新增】清理所有玩家的出牌区域
   */
  _clearAllOutCardZones: function _clearAllOutCardZones() {
    // 获取 gameScene 脚本
    var gameScene_script = this.node.parent ? this.node.parent.getComponent("gameScene") : null;
    if (!gameScene_script) {
      console.warn("🎮 [_clearAllOutCardZones] 无法获取 gameScene");
      return;
    }

    // 获取玩家座位节点
    var players_seat_pos = gameScene_script.players_seat_pos;
    if (!players_seat_pos) {
      console.warn("🎮 [_clearAllOutCardZones] 无法获取 players_seat_pos");
      return;
    }

    // 遍历所有座位，清理出牌区域
    var children = players_seat_pos.children;
    for (var i = 0; i < children.length; i++) {
      var seatNode = children[i];
      // 查找出牌区域节点（cardsoutzone0, cardsoutzone1, cardsoutzone2）
      for (var j = 0; j < 3; j++) {
        var outZoneName = "cardsoutzone" + j;
        var outZone = seatNode.getChildByName(outZoneName);
        if (outZone) {
          outZone.removeAllChildren(true);
        }
      }
    }
  },
  /**
   * 🔧【新增】清理底牌节点
   */
  _clearBottomCards: function _clearBottomCards() {
    // 销毁底牌节点
    if (this.bottom_card) {
      for (var i = 0; i < this.bottom_card.length; i++) {
        if (this.bottom_card[i] && this.bottom_card[i].isValid) {
          this.bottom_card[i].destroy();
        }
      }
    }
    this.bottom_card = [];
  },
  /**
   * 🔧【新增】重置所有玩家的准备图标状态
   */
  _resetAllPlayerReadyState: function _resetAllPlayerReadyState() {
    var gameScene_script = this.node.parent ? this.node.parent.getComponent("gameScene") : null;
    if (!gameScene_script || !gameScene_script.playerNodeList) {
      return;
    }
    for (var i = 0; i < gameScene_script.playerNodeList.length; i++) {
      var playerNode = gameScene_script.playerNodeList[i];
      if (playerNode) {
        var playerScript = playerNode.getComponent("player_node");
        if (playerScript && playerScript.readyimage) {
          playerScript.readyimage.active = false;
        }
      }
    }
  },
  /**
   * 🔧【新增】更新玩家节点的金币显示
   * @param {String} playerId - 玩家ID
   * @param {Number} gold - 新的金币数量
   */
  _updatePlayerGoldDisplay: function _updatePlayerGoldDisplay(playerId, gold) {
    // 获取 gameScene 脚本
    var gameScene_script = this.node.parent ? this.node.parent.getComponent("gameScene") : null;
    if (!gameScene_script || !gameScene_script.playerNodeList) {
      console.warn("🏆 [_updatePlayerGoldDisplay] 无法获取 gameScene 或 playerNodeList");
      return;
    }

    // 遍历所有玩家节点，找到匹配的玩家并更新金币显示
    for (var i = 0; i < gameScene_script.playerNodeList.length; i++) {
      var playerNode = gameScene_script.playerNodeList[i];
      if (!playerNode) continue;
      var playerScript = playerNode.getComponent("player_node");
      if (!playerScript) continue;

      // 匹配玩家ID
      if (String(playerScript.accountid) === String(playerId)) {
        // 更新金币显示
        if (playerScript.globalcount_label) {
          playerScript.globalcount_label.string = String(gold);
        }
        break;
      }
    }
  },
  /**
   * 🔧【新增】更新玩家节点的竞技币显示（竞技场模式专用）
   * @param {String} playerId - 玩家ID
   * @param {Number} matchCoin - 新的竞技币数量
   */
  _updatePlayerMatchCoinDisplay: function _updatePlayerMatchCoinDisplay(playerId, matchCoin) {
    console.log("🏟️ [_updatePlayerMatchCoinDisplay] 更新玩家竞技币: playerId=", playerId, "matchCoin=", matchCoin);

    // 获取 gameScene 脚本
    var gameScene_script = this.node.parent ? this.node.parent.getComponent("gameScene") : null;
    if (!gameScene_script || !gameScene_script.playerNodeList) {
      console.warn("🏟️ [_updatePlayerMatchCoinDisplay] 无法获取 gameScene 或 playerNodeList");
      return;
    }

    // 遍历所有玩家节点，找到匹配的玩家并更新竞技币显示
    for (var i = 0; i < gameScene_script.playerNodeList.length; i++) {
      var playerNode = gameScene_script.playerNodeList[i];
      if (!playerNode) continue;
      var playerScript = playerNode.getComponent("player_node");
      if (!playerScript) continue;

      // 匹配玩家ID
      if (String(playerScript.accountid) === String(playerId)) {
        // 更新竞技币显示
        if (playerScript.globalcount_label) {
          playerScript.globalcount_label.string = String(matchCoin);
          console.log("🏟️ [_updatePlayerMatchCoinDisplay] 已更新玩家 ", playerId, " 的竞技币显示为 ", matchCoin);
        }
        // 🔧【新增】保存竞技币到玩家脚本实例
        playerScript._matchCoin = matchCoin;
        break;
      }
    }
  },
  // ============================================================
  // 【竞技场】功能函数
  // ============================================================

  /**
   * 🏆【竞技场】显示竞技场专用结算弹窗
   * 竞技场结算页与普通场不同：
   * - 只显示：输赢、倍数、当前比赛金币
   * - 不显示：继续游戏、返回大厅按钮
   * - 显示："下一局开始 15秒" 倒计时
   * 
   * 🔧【新增】如果是最终结算（只有3人），跳过此弹窗，等待 onCompetitionChampion 消息显示排名
   */
  _showCompetitionResultPopup: function _showCompetitionResultPopup(data) {
    var self = this;

    // 🔧【关键】检查是否是最终结算（只有3人参赛）
    // 如果是最终结算，跳过此弹窗，等待 onCompetitionChampion 消息显示排名
    if (data.is_final_round) {
      console.log("🏆 [_showCompetitionResultPopup] 检测到最终结算（只有3人），跳过中间结算弹窗，等待排名消息");
      // 不显示中间弹窗，直接等待 onCompetitionChampion 消息
      return;
    }
    var winSize = cc.winSize;
    var myglobal = window.myglobal;
    var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID;

    // 判断输赢
    var isWinner = false;
    var myWinGold = 0;
    var myMatchCoin = 0; // 🔧【新增】当前玩家的金币（从data.players获取）

    if (data.players && data.players.length > 0) {
      for (var i = 0; i < data.players.length; i++) {
        var player = data.players[i];
        if (String(player.player_id) === String(myPlayerId)) {
          isWinner = player.is_winner;
          myWinGold = player.win_gold;
          // 🔧【修复】从服务端返回的玩家数据中获取金币
          if (player.match_coin !== undefined && player.match_coin >= 0) {
            myMatchCoin = player.match_coin;
          }
          break;
        }
      }
    }

    // 🔧【修复】更新当前玩家的金币显示
    this._matchCoin = myMatchCoin;

    // 🔧【新增】更新所有玩家的金币显示
    if (data.players && data.players.length > 0) {
      for (var i = 0; i < data.players.length; i++) {
        var player = data.players[i];
        var playerId = player.player_id;
        var matchCoin = player.match_coin;

        // 🔧【修复】竞技场模式下更新玩家的金币显示
        if (matchCoin !== undefined && matchCoin >= 0) {
          this._updatePlayerMatchCoinDisplay(playerId, matchCoin);
        }
      }
    }
    var canvas = cc.find("Canvas") || cc.find("UI_ROOT") || this.node.parent;
    if (!canvas) canvas = this.node;

    // 遮罩层
    var maskNode = new cc.Node("CompetitionResultMask");
    maskNode.addComponent(cc.BlockInputEvents);
    maskNode.color = isWinner ? new cc.Color(0, 30, 50) : new cc.Color(30, 0, 0);
    maskNode.opacity = 200;
    maskNode.width = winSize.width * 2;
    maskNode.height = winSize.height * 2;
    maskNode.zIndex = 999;
    maskNode.parent = canvas;

    // 弹窗容器
    var popupNode = new cc.Node("CompetitionResultPopup");
    popupNode.scale = 0.5;
    popupNode.opacity = 0;
    popupNode.zIndex = 1000;
    popupNode.parent = canvas;
    var popupWidth = 450;
    var popupHeight = 380; // 🔧【调整】增加高度以容纳倒计时

    // 背景
    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics);
    bg.fillColor = isWinner ? new cc.Color(40, 50, 80, 240) : new cc.Color(50, 35, 40, 240);
    bg.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 20);
    bg.fill();
    bg.strokeColor = isWinner ? new cc.Color(100, 200, 255) : new cc.Color(200, 100, 100);
    bg.lineWidth = 3;
    bg.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 20);
    bg.stroke();
    bgNode.parent = popupNode;

    // 标题
    var titleNode = new cc.Node("Title");
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = isWinner ? "🎉 胜利 🎉" : "✖ 失败 ✖";
    titleLabel.fontSize = 36;
    titleNode.color = isWinner ? new cc.Color(100, 255, 200) : new cc.Color(255, 150, 150);
    titleNode.y = popupHeight / 2 - 50;
    titleNode.parent = popupNode;

    // 🔧【修复】输赢金额 - 竞技场显示"金币"（不是竞技币）
    var resultNode = new cc.Node("Result");
    var resultLabel = resultNode.addComponent(cc.Label);
    resultLabel.string = "本局结果: " + (myWinGold >= 0 ? "+" : "") + myWinGold + " 金币";
    resultLabel.fontSize = 28;
    resultNode.color = myWinGold >= 0 ? new cc.Color(100, 255, 100) : new cc.Color(255, 100, 100);
    resultNode.y = popupHeight / 2 - 100;
    resultNode.parent = popupNode;

    // 倍数
    var multiNode = new cc.Node("Multiplier");
    var multiLabel = multiNode.addComponent(cc.Label);
    multiLabel.string = "本局倍数: x" + (data.multiple || 1);
    multiLabel.fontSize = 24;
    multiNode.color = new cc.Color(255, 220, 150);
    multiNode.y = popupHeight / 2 - 140;
    multiNode.parent = popupNode;

    // 🔧【修复】当前金币（不是竞技币）
    var coinNode = new cc.Node("MatchCoin");
    var coinLabel = coinNode.addComponent(cc.Label);
    coinLabel.string = "当前金币: " + this._matchCoin;
    coinLabel.fontSize = 24;
    coinNode.color = new cc.Color(255, 200, 100);
    coinNode.y = popupHeight / 2 - 180;
    coinNode.parent = popupNode;

    // ============================================================
    // 🔧【修复】竞技场倒计时
    // 不显示"继续游戏"和"返回大厅"按钮
    // 显示服务端控制的30秒倒计时
    // 🔧【关键修复】从 game_over 数据中获取初始倒计时，立即启动本地倒计时
    // ============================================================

    // 🔧【关键】从服务端数据获取初始倒计时值
    var initialCountdown = data.arena_countdown || 30;

    // 倒计时显示容器
    var countdownContainer = new cc.Node("CountdownContainer");
    countdownContainer.y = -popupHeight / 2 + 80;
    countdownContainer.parent = popupNode;

    // 倒计时文字
    var countdownLabel = new cc.Node("CountdownLabel");
    var countdownLabelComp = countdownLabel.addComponent(cc.Label);
    countdownLabelComp.string = "下一轮将在 " + initialCountdown + " 秒后开始";
    countdownLabelComp.fontSize = 26;
    countdownLabel.color = new cc.Color(255, 215, 0); // 金黄色
    countdownLabel.parent = countdownContainer;

    // 倒计时数字（大号显示）
    var countdownNumber = new cc.Node("CountdownNumber");
    var countdownNumberComp = countdownNumber.addComponent(cc.Label);
    countdownNumberComp.string = String(initialCountdown);
    countdownNumberComp.fontSize = 48;
    countdownNumber.color = new cc.Color(255, 255, 255);
    countdownNumber.y = -45;
    countdownNumber.parent = countdownContainer;

    // 添加描边效果
    var outline = countdownNumber.addComponent(cc.LabelOutline);
    outline.color = cc.Color.BLACK;
    outline.width = 2;

    // 弹出动画
    cc.tween(popupNode).to(0.35, {
      scale: 1,
      opacity: 255
    }, {
      easing: 'backOut'
    }).start();

    // 保存引用
    this._gameResultPopup = popupNode;
    this._gameResultMask = maskNode;
    this._countdownLabelNode = countdownLabel;
    this._countdownNumberNode = countdownNumber;
    this._arenaCountdownSeconds = initialCountdown;

    // 播放音效
    this._playGameResultSound(isWinner);

    // ============================================================
    // 🔧【关键修复】立即启动本地倒计时定时器
    // 同时注册服务端消息监听，双保险确保倒计时正常工作
    // ============================================================

    // 启动本地倒计时定时器
    this._startLocalArenaCountdown(initialCountdown);

    // 注册服务端倒计时消息监听（作为备份）
    this._setupArenaCountdownListeners();
  },
  /**
   * 🔧【新增】启动本地竞技场倒计时
   * @param {Number} seconds - 初始倒计时秒数
   */
  _startLocalArenaCountdown: function _startLocalArenaCountdown(seconds) {
    var self = this;
    console.log("🏟️ [_startLocalArenaCountdown] 开始启动倒计时, seconds:", seconds);

    // 停止之前的倒计时
    if (this._localArenaCountdownTimer) {
      this.unschedule(this._localArenaCountdownTick);
      this._localArenaCountdownTimer = null;
    }
    this._arenaCountdownSeconds = seconds;

    // 🔧【修复】确保初始UI正确显示
    this._updateArenaCountdownUI(seconds);

    // 🔧【修复】使用 cc.director 的时间调度，确保在所有情况下都能工作
    // 每秒tick一次，无限重复
    this.schedule(this._localArenaCountdownTick, 1, cc.macro.REPEAT_FOREVER, 1);
    this._localArenaCountdownTimer = true;
    console.log("🏟️ [_startLocalArenaCountdown] 本地倒计时已启动");
  },
  /**
   * 🔧【新增】本地竞技场倒计时Tick
   */
  _localArenaCountdownTick: function _localArenaCountdownTick() {
    if (this._arenaCountdownSeconds <= 0) {
      this.unschedule(this._localArenaCountdownTick);
      this._localArenaCountdownTimer = null;
      console.log("🏟️ [_localArenaCountdownTick] 倒计时结束，等待服务端消息...");

      // 🔧【修复】倒计时归0后显示等待提示，继续等待服务端消息
      // 服务端会发送 MsgArenaAutoReady 或新一轮游戏消息
      this._updateArenaCountdownUI(0);
      this._showWaitingForServer();
      return;
    }
    this._arenaCountdownSeconds--;

    // 更新UI
    this._updateArenaCountdownUI(this._arenaCountdownSeconds);
    console.log("🏟️ [_localArenaCountdownTick] 剩余:", this._arenaCountdownSeconds);
  },
  /**
   * 🔧【新增】显示等待服务端响应提示
   */
  _showWaitingForServer: function _showWaitingForServer() {
    // 更新倒计时标签显示等待提示
    if (this._countdownLabelNode) {
      var label = this._countdownLabelNode.getComponent(cc.Label);
      if (label) {
        label.string = "等待服务器响应...";
      }
    }

    // 隐藏数字
    if (this._countdownNumberNode) {
      var label = this._countdownNumberNode.getComponent(cc.Label);
      if (label) {
        label.string = "...";
      }
    }
  },
  /**
   * 🔧【新增】设置竞技场倒计时消息监听
   * 监听服务端推送的倒计时消息（作为本地倒计时的备份和同步）
   */
  _setupArenaCountdownListeners: function _setupArenaCountdownListeners() {
    var self = this;
    var myglobal = window.myglobal;
    if (!myglobal || !myglobal.socket) {
      console.warn("🏟️ [_setupArenaCountdownListeners] socket未初始化");
      return;
    }

    // 监听倒计时开始消息（如果服务端重新发送）
    myglobal.socket.onArenaRoundCountdown(function (data) {
      console.log("🏟️ [onArenaRoundCountdown] 收到倒计时开始:", data);
      // 同步服务端的倒计时值
      self._arenaCountdownSeconds = data.seconds || 30;
      self._updateArenaCountdownUI(data.seconds);
    });

    // 监听倒计时每秒更新消息（同步服务端的倒计时）
    myglobal.socket.onArenaCountdownTick(function (data) {
      console.log("🏟️ [onArenaCountdownTick] 服务端倒计时同步:", data.seconds);
      // 🔧【关键】同步服务端的倒计时值，确保与服务端一致
      self._arenaCountdownSeconds = data.seconds;
      self._updateArenaCountdownUI(data.seconds);
    });

    // 监听自动准备消息
    myglobal.socket.onArenaAutoReady(function (data) {
      console.log("🏟️ [onArenaAutoReady] 自动准备:", data.message);
      // 停止本地倒计时
      if (self._localArenaCountdownTimer) {
        self.unschedule(self._localArenaCountdownTick);
        self._localArenaCountdownTimer = null;
      }
      self._showArenaAutoReadyMessage(data.message);
    });

    // 监听断线重连状态恢复
    myglobal.socket.onArenaReconnectState(function (data) {
      console.log("🏟️ [onArenaReconnectState] 状态恢复:", data);
      if (data.phase === "countdown") {
        self._arenaCountdownSeconds = data.countdown;
        self._updateArenaCountdownUI(data.countdown);
      }
    });
  },
  /**
   * 🔧【新增】更新竞技场倒计时UI
   * @param {Number} seconds - 剩余秒数
   */
  _updateArenaCountdownUI: function _updateArenaCountdownUI(seconds) {
    // 更新文字
    if (this._countdownLabelNode) {
      var label = this._countdownLabelNode.getComponent(cc.Label);
      if (label) {
        label.string = "下一轮将在 " + seconds + " 秒后开始";
      }
    }

    // 更新数字
    if (this._countdownNumberNode) {
      var numLabel = this._countdownNumberNode.getComponent(cc.Label);
      if (numLabel) {
        numLabel.string = String(seconds);
      }

      // 最后5秒闪烁效果
      if (seconds <= 5 && seconds > 0) {
        cc.tween(this._countdownNumberNode).to(0.1, {
          scale: 1.2
        }).to(0.1, {
          scale: 1.0
        }).start();

        // 变红
        this._countdownNumberNode.color = new cc.Color(255, 100, 100);
      } else {
        this._countdownNumberNode.color = new cc.Color(255, 255, 255);
      }
    }
  },
  /**
   * 🔧【新增】停止竞技场倒计时
   */
  _stopArenaCountdown: function _stopArenaCountdown() {
    // 停止本地倒计时定时器
    if (this._localArenaCountdownTimer) {
      this.unschedule(this._localArenaCountdownTick);
      this._localArenaCountdownTimer = null;
      console.log("🏟️ [_stopArenaCountdown] 已停止本地倒计时");
    }

    // 重置倒计时秒数
    this._arenaCountdownSeconds = 0;
  },
  /**
   * 🔧【新增】显示竞技场自动准备消息
   * @param {String} message - 消息内容
   */
  _showArenaAutoReadyMessage: function _showArenaAutoReadyMessage(message) {
    // 更新倒计时显示为自动准备消息
    if (this._countdownLabelNode) {
      var label = this._countdownLabelNode.getComponent(cc.Label);
      if (label) {
        label.string = message || "系统已自动准备";
      }
    }

    // 隐藏数字
    if (this._countdownNumberNode) {
      this._countdownNumberNode.active = false;
    }
  },
  /**
   * 🏆【竞技场】处理竞技场状态更新
   * @param {Object} data - { room_category, round, total_rounds, match_coin, ... }
   */
  _onCompetitionStatus: function _onCompetitionStatus(data) {
    this._isCompetition = data.room_category === 2;
    this._roomCategory = data.room_category || 1;
    this._competitionRound = data.round || 0;
    this._competitionTotalRounds = data.total_rounds || 0;
    this._matchCoin = data.match_coin || 0;

    // 如果是竞技场模式，显示比赛金币
    if (this._isCompetition) {
      this._showMatchCoinDisplay();
    }
  },
  /**
   * 🕐【竞技场】处理竞技场倒计时
   * @param {Object} data - { countdown, message }
   */
  _onCompetitionCountdown: function _onCompetitionCountdown(data) {
    this._competitionCountdown = data.countdown || 15;

    // 停止之前的倒计时
    if (this._competitionCountdownTimer) {
      this.unschedule(this._competitionCountdownTick);
    }

    // 开始新的倒计时
    this.schedule(this._competitionCountdownTick, 1);
  },
  /**
   * 🕐【竞技场】竞技场倒计时Tick
   */
  _competitionCountdownTick: function _competitionCountdownTick() {
    if (this._competitionCountdown <= 0) {
      this.unschedule(this._competitionCountdownTick);
      return;
    }
    this._competitionCountdown--;

    // 更新倒计时显示
    this._updateCompetitionCountdownDisplay();
  },
  /**
   * 🕐【竞技场】更新竞技场倒计时显示
   */
  _updateCompetitionCountdownDisplay: function _updateCompetitionCountdownDisplay() {
    // 如果有结算弹窗，更新其中的倒计时
    if (this._gameResultPopup) {
      var countdownLabel = this._gameResultPopup.getChildByName("CompetitionCountdown");
      if (countdownLabel && countdownLabel.getComponent(cc.Label)) {
        countdownLabel.getComponent(cc.Label).string = "下一局开始 " + this._competitionCountdown + "秒";
      }
    }
  },
  /**
   * 🪙【竞技场】处理比赛金币更新
   * @param {Object} data - { player_id, match_coin, delta }
   */
  _onMatchCoinUpdate: function _onMatchCoinUpdate(data) {
    var myglobal = window.myglobal;
    if (!myglobal) return;
    var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID;

    // 只更新自己的比赛金币
    if (String(data.player_id) === String(myPlayerId)) {
      this._matchCoin = data.match_coin;
      this._updateMatchCoinDisplay(data.match_coin, data.delta);
    }
  },
  /**
   * 🪙【竞技场】显示比赛金币显示
   */
  _showMatchCoinDisplay: function _showMatchCoinDisplay() {
    // 检查是否已存在比赛金币显示节点
    if (this._matchCoinNode) return;
    var myglobal = window.myglobal;
    if (!myglobal) return;

    // 创建比赛金币显示节点
    var matchCoinNode = new cc.Node("MatchCoinDisplay");
    matchCoinNode.setPosition(-200, 280); // 左上角位置

    // 背景
    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics);
    bg.fillColor = new cc.Color(50, 40, 80, 200);
    bg.roundRect(-80, -20, 160, 40, 10);
    bg.fill();
    bgNode.parent = matchCoinNode;

    // 图标（金币图标）
    var iconNode = new cc.Node("Icon");
    var iconLabel = iconNode.addComponent(cc.Label);
    iconLabel.string = "🪙";
    iconLabel.fontSize = 20;
    iconNode.setPosition(-55, 0);
    iconNode.parent = matchCoinNode;

    // 标签
    var labelNode = new cc.Node("Label");
    var label = labelNode.addComponent(cc.Label);
    label.string = "比赛金币";
    label.fontSize = 14;
    labelNode.color = new cc.Color(200, 200, 200);
    labelNode.setPosition(-20, 0);
    labelNode.parent = matchCoinNode;

    // 数值
    var valueNode = new cc.Node("Value");
    valueNode.name = "MatchCoinValue";
    var valueLabel = valueNode.addComponent(cc.Label);
    valueLabel.string = String(this._matchCoin);
    valueLabel.fontSize = 18;
    valueNode.color = new cc.Color(255, 220, 100);
    valueNode.setPosition(45, 0);
    valueNode.parent = matchCoinNode;
    matchCoinNode.parent = this.node;
    this._matchCoinNode = matchCoinNode;
  },
  /**
   * 🪙【竞技场】更新比赛金币显示
   * @param {Number} matchCoin - 新的比赛金币数量
   * @param {Number} delta - 变化量
   */
  _updateMatchCoinDisplay: function _updateMatchCoinDisplay(matchCoin, delta) {
    if (this._matchCoinNode) {
      var valueNode = this._matchCoinNode.getChildByName("MatchCoinValue");
      if (valueNode && valueNode.getComponent(cc.Label)) {
        valueNode.getComponent(cc.Label).string = String(matchCoin);

        // 如果有增量，显示动画
        if (delta !== 0) {
          this._showMatchCoinDeltaAnimation(delta);
        }
      }
    }
  },
  /**
   * 🪙【竞技场】显示比赛金币变化动画
   * @param {Number} delta - 变化量
   */
  _showMatchCoinDeltaAnimation: function _showMatchCoinDeltaAnimation(delta) {
    if (!this._matchCoinNode) return;

    // 创建变化量显示节点
    var deltaNode = new cc.Node("Delta");
    var deltaLabel = deltaNode.addComponent(cc.Label);
    deltaLabel.string = (delta >= 0 ? "+" : "") + delta;
    deltaLabel.fontSize = 24;
    deltaNode.color = delta >= 0 ? new cc.Color(100, 255, 100) : new cc.Color(255, 100, 100);
    deltaNode.setPosition(80, 0);
    deltaNode.parent = this._matchCoinNode;

    // 飘字动画
    cc.tween(deltaNode).to(0.5, {
      y: 30,
      opacity: 255
    }).to(0.5, {
      y: 50,
      opacity: 0
    }).call(function () {
      deltaNode.destroy();
    }).start();
  },
  /**
   * 🪙【竞技场】隐藏比赛金币显示
   */
  _hideMatchCoinDisplay: function _hideMatchCoinDisplay() {
    if (this._matchCoinNode) {
      this._matchCoinNode.destroy();
      this._matchCoinNode = null;
    }
  },
  /**
   * ❌【竞技场】处理淘汰通知
   * @param {Object} data - { rank, reason, total_players, rewards }
   */
  _onCompetitionEliminated: function _onCompetitionEliminated(data) {
    // 停止所有倒计时
    this._stopPlayCountdown();
    this._stopBidCountdown();

    // 隐藏比赛金币显示
    this._hideMatchCoinDisplay();

    // 显示淘汰弹窗
    this._showEliminatedPopup(data);
  },
  /**
   * ❌【竞技场】显示淘汰弹窗
   * @param {Object} data - { rank, reason, total_players, rewards }
   */
  _showEliminatedPopup: function _showEliminatedPopup(data) {
    var self = this;
    var winSize = cc.winSize;
    var canvas = cc.find("Canvas") || cc.find("UI_ROOT") || this.node.parent;
    if (!canvas) canvas = this.node;

    // 遮罩层
    var maskNode = new cc.Node("EliminatedMask");
    maskNode.addComponent(cc.BlockInputEvents);
    maskNode.color = new cc.Color(0, 0, 0);
    maskNode.opacity = 180;
    maskNode.width = winSize.width * 2;
    maskNode.height = winSize.height * 2;
    maskNode.zIndex = 999;
    maskNode.parent = canvas;

    // 弹窗容器
    var popupNode = new cc.Node("EliminatedPopup");
    popupNode.scale = 0.5;
    popupNode.opacity = 0;
    popupNode.zIndex = 1000;
    popupNode.parent = canvas;
    var popupWidth = 400;
    var popupHeight = 350;

    // 背景
    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics);
    bg.fillColor = new cc.Color(60, 40, 50, 240);
    bg.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 20);
    bg.fill();
    bg.strokeColor = new cc.Color(150, 100, 100);
    bg.lineWidth = 3;
    bg.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 20);
    bg.stroke();
    bgNode.parent = popupNode;

    // 标题
    var titleNode = new cc.Node("Title");
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = "❌ 比赛结束 ❌";
    titleLabel.fontSize = 32;
    titleNode.color = new cc.Color(255, 150, 150);
    titleNode.y = popupHeight / 2 - 50;
    titleNode.parent = popupNode;

    // 排名
    var rankNode = new cc.Node("Rank");
    var rankLabel = rankNode.addComponent(cc.Label);
    rankLabel.string = "最终排名: 第 " + data.rank + " 名";
    rankLabel.fontSize = 24;
    rankNode.color = new cc.Color(255, 220, 150);
    rankNode.y = popupHeight / 2 - 100;
    rankNode.parent = popupNode;

    // 淘汰原因
    var reasonNode = new cc.Node("Reason");
    var reasonLabel = reasonNode.addComponent(cc.Label);
    reasonLabel.string = data.reason || "比赛失利";
    reasonLabel.fontSize = 18;
    reasonNode.color = new cc.Color(200, 200, 200);
    reasonNode.y = popupHeight / 2 - 140;
    reasonNode.parent = popupNode;

    // 参赛人数
    var totalNode = new cc.Node("Total");
    var totalLabel = totalNode.addComponent(cc.Label);
    totalLabel.string = "共 " + (data.total_players || 0) + " 人参赛";
    totalLabel.fontSize = 16;
    totalNode.color = new cc.Color(180, 180, 180);
    totalNode.y = popupHeight / 2 - 180;
    totalNode.parent = popupNode;

    // 奖励（如果有）
    if (data.rewards) {
      var rewardNode = new cc.Node("Reward");
      var rewardLabel = rewardNode.addComponent(cc.Label);
      rewardLabel.string = "获得奖励: " + (data.rewards.name || JSON.stringify(data.rewards));
      rewardLabel.fontSize = 18;
      rewardNode.color = new cc.Color(255, 200, 100);
      rewardNode.y = popupHeight / 2 - 220;
      rewardNode.parent = popupNode;
    }

    // 返回大厅按钮
    var btnNode = new cc.Node("ReturnBtn");
    btnNode.setContentSize(200, 50);
    btnNode.addComponent(cc.BlockInputEvents);
    var btnBg = btnNode.addComponent(cc.Graphics);
    btnBg.fillColor = new cc.Color(100, 80, 140);
    btnBg.roundRect(-100, -25, 200, 50, 25);
    btnBg.fill();
    btnNode.y = -popupHeight / 2 + 50;
    btnNode.parent = popupNode;
    var btnLabelNode = new cc.Node("Label");
    var btnLabel = btnLabelNode.addComponent(cc.Label);
    btnLabel.string = "返回大厅";
    btnLabel.fontSize = 22;
    btnLabelNode.color = new cc.Color(255, 255, 255);
    btnLabelNode.parent = btnNode;

    // 点击事件
    btnNode.on(cc.Node.EventType.TOUCH_END, function () {
      // 销毁弹窗
      popupNode.destroy();
      maskNode.destroy();
      // 返回大厅
      self._returnToLobby();
    });

    // 弹出动画
    cc.tween(popupNode).to(0.3, {
      scale: 1,
      opacity: 255
    }, {
      easing: 'backOut'
    }).start();
    this._eliminatedPopup = popupNode;
    this._eliminatedMask = maskNode;
  },
  /**
   * ⬆️【竞技场】处理晋级通知
   * @param {Object} data - { current_round, total_rounds, match_coin, message }
   */
  _onCompetitionAdvance: function _onCompetitionAdvance(data) {
    this._competitionRound = data.current_round;
    this._matchCoin = data.match_coin;

    // 更新比赛金币显示
    this._updateMatchCoinDisplay(data.match_coin, 0);

    // 显示晋级提示
    this._showAdvanceToast(data);
  },
  /**
   * ⬆️【竞技场】显示晋级提示
   * @param {Object} data - { current_round, total_rounds, match_coin, message }
   */
  _showAdvanceToast: function _showAdvanceToast(data) {
    var self = this;
    var winSize = cc.winSize;

    // 创建Toast节点
    var toastNode = new cc.Node("AdvanceToast");
    toastNode.setPosition(0, 100);
    toastNode.opacity = 0;
    toastNode.zIndex = 2000;
    toastNode.parent = this.node;

    // 背景
    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics);
    bg.fillColor = new cc.Color(50, 100, 50, 220);
    bg.roundRect(-150, -25, 300, 50, 25);
    bg.fill();
    bgNode.parent = toastNode;

    // 文字
    var labelNode = new cc.Node("Label");
    var label = labelNode.addComponent(cc.Label);
    label.string = "🎉 晋级成功！第 " + data.current_round + "/" + data.total_rounds + " 轮";
    label.fontSize = 22;
    labelNode.color = new cc.Color(255, 255, 200);
    labelNode.parent = toastNode;

    // 动画
    cc.tween(toastNode).to(0.3, {
      opacity: 255
    }).delay(2).to(0.3, {
      opacity: 0
    }).call(function () {
      toastNode.destroy();
    }).start();
  },
  /**
   * 🏆【竞技场】处理冠军弹窗
   * @param {Object} data - { rank, rewards, reward_type, rankings, match_coin }
   */
  _onCompetitionChampion: function _onCompetitionChampion(data) {
    // 停止所有倒计时
    this._stopPlayCountdown();
    this._stopBidCountdown();

    // 隐藏比赛金币显示
    this._hideMatchCoinDisplay();

    // 显示冠军弹窗
    this._showChampionPopup(data);
  },
  /**
   * 🏆【竞技场】显示冠军弹窗
   * @param {Object} data - { rank, rewards, reward_type, rankings, match_coin }
   * 🔧【重构】显示完整的排名列表（前20名），包括冠军、亚军、季军
   */
  _showChampionPopup: function _showChampionPopup(data) {
    var self = this;
    var winSize = cc.winSize;
    var canvas = cc.find("Canvas") || cc.find("UI_ROOT") || this.node.parent;
    if (!canvas) canvas = this.node;

    // 🔧【关闭之前的结算弹窗】
    if (this._gameResultPopup || this._gameResultMask) {
      this._closeGameResultPopup(this._gameResultPopup, this._gameResultMask);
    }

    // 遮罩层
    var maskNode = new cc.Node("ChampionMask");
    maskNode.addComponent(cc.BlockInputEvents);
    maskNode.color = new cc.Color(20, 15, 40);
    maskNode.opacity = 220;
    maskNode.width = winSize.width * 2;
    maskNode.height = winSize.height * 2;
    maskNode.zIndex = 999;
    maskNode.parent = canvas;

    // 弹窗容器
    var popupNode = new cc.Node("ChampionPopup");
    popupNode.scale = 0.5;
    popupNode.opacity = 0;
    popupNode.zIndex = 1000;
    popupNode.parent = canvas;

    // 🔧【调整】增大弹窗尺寸以容纳更多排名
    var popupWidth = 520;
    var popupHeight = 620;

    // 背景
    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics);
    bg.fillColor = new cc.Color(45, 35, 70, 245);
    bg.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 20);
    bg.fill();
    bg.strokeColor = new cc.Color(255, 200, 80);
    bg.lineWidth = 3;
    bg.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 20);
    bg.stroke();
    bgNode.parent = popupNode;

    // 标题
    var titleNode = new cc.Node("Title");
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = "🏆 比赛结束 🏆";
    titleLabel.fontSize = 32;
    titleLabel.enableBold = true;
    titleNode.color = new cc.Color(255, 220, 100);
    titleNode.y = popupHeight / 2 - 40;
    titleNode.parent = popupNode;

    // 🔧【新增】前三名展示区
    var rankings = data.rankings || [];
    var topThreeY = popupHeight / 2 - 90;
    if (rankings.length >= 1) {
      // 冠军
      this._createRankingItem(popupNode, rankings[0], 1, -120, topThreeY);
    }
    if (rankings.length >= 2) {
      // 亚军
      this._createRankingItem(popupNode, rankings[1], 2, 0, topThreeY - 20);
    }
    if (rankings.length >= 3) {
      // 季军
      this._createRankingItem(popupNode, rankings[2], 3, 120, topThreeY - 40);
    }

    // 🔧【新增】其他排名列表标题
    if (rankings.length > 3) {
      var otherTitleNode = new cc.Node("OtherTitle");
      var otherTitleLabel = otherTitleNode.addComponent(cc.Label);
      otherTitleLabel.string = "—— 其他排名 ——";
      otherTitleLabel.fontSize = 18;
      otherTitleNode.color = new cc.Color(180, 180, 200);
      otherTitleNode.y = topThreeY - 100;
      otherTitleNode.parent = popupNode;

      // 🔧【新增】其他排名列表（第4-20名）
      var startY = topThreeY - 130;
      var maxOtherRankings = Math.min(rankings.length, 20);
      for (var i = 3; i < maxOtherRankings; i++) {
        var rankInfo = rankings[i];
        var rankItemNode = new cc.Node("RankItem_" + i);
        var rankItemLabel = rankItemNode.addComponent(cc.Label);
        rankItemLabel.string = "第" + rankInfo.rank + "名: " + rankInfo.player_name + "  金币: " + rankInfo.match_coin;
        rankItemLabel.fontSize = 16;
        rankItemNode.color = new cc.Color(200, 200, 210);
        rankItemNode.y = startY - (i - 3) * 24;
        rankItemNode.parent = popupNode;
      }
    }

    // 按钮区域
    var btnY = -popupHeight / 2 + 50;

    // 确定按钮
    var confirmBtn = new cc.Node("ConfirmBtn");
    confirmBtn.setContentSize(180, 45);
    confirmBtn.addComponent(cc.BlockInputEvents);
    var confirmBg = confirmBtn.addComponent(cc.Graphics);
    confirmBg.fillColor = new cc.Color(200, 150, 50);
    confirmBg.roundRect(-90, -22.5, 180, 45, 22);
    confirmBg.fill();
    confirmBtn.y = btnY;
    confirmBtn.parent = popupNode;
    var confirmLabelNode = new cc.Node("Label");
    var confirmLabel = confirmLabelNode.addComponent(cc.Label);
    confirmLabel.string = "返回大厅";
    confirmLabel.fontSize = 20;
    confirmLabelNode.color = new cc.Color(255, 255, 255);
    confirmLabelNode.parent = confirmBtn;
    confirmBtn.on(cc.Node.EventType.TOUCH_END, function () {
      popupNode.destroy();
      maskNode.destroy();
      self._returnToLobby();
    });

    // 弹出动画
    cc.tween(popupNode).to(0.4, {
      scale: 1,
      opacity: 255
    }, {
      easing: 'backOut'
    }).start();

    // 粒子特效
    this._createChampionParticles(popupNode, popupWidth, popupHeight);
    this._championPopup = popupNode;
    this._championMask = maskNode;
  },
  /**
   * 🏅【新增】创建单个排名项
   * @param {cc.Node} parent - 父节点
   * @param {Object} rankInfo - 排名信息
   * @param {Number} rank - 排名（1, 2, 3）
   * @param {Number} x - X坐标
   * @param {Number} y - Y坐标
   */
  _createRankingItem: function _createRankingItem(parent, rankInfo, rank, x, y) {
    var itemNode = new cc.Node("RankItem_" + rank);
    itemNode.setPosition(x, y);

    // 排名背景
    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics);

    // 根据排名设置不同颜色
    var bgColor;
    if (rank === 1) {
      bgColor = new cc.Color(255, 215, 0, 200); // 金色
    } else if (rank === 2) {
      bgColor = new cc.Color(192, 192, 192, 200); // 银色
    } else {
      bgColor = new cc.Color(205, 127, 50, 200); // 铜色
    }

    bg.fillColor = bgColor;
    bg.roundRect(-55, -30, 110, 60, 10);
    bg.fill();
    bgNode.parent = itemNode;

    // 排名标签
    var rankLabelNode = new cc.Node("RankLabel");
    var rankLabel = rankLabelNode.addComponent(cc.Label);
    var rankText;
    if (rank === 1) {
      rankText = "🥇 冠军";
    } else if (rank === 2) {
      rankText = "🥈 亚军";
    } else {
      rankText = "🥉 季军";
    }
    rankLabel.string = rankText;
    rankLabel.fontSize = 16;
    rankLabel.enableBold = true;
    rankLabelNode.color = new cc.Color(255, 255, 255);
    rankLabelNode.y = 12;
    rankLabelNode.parent = itemNode;

    // 玩家名称
    var nameLabelNode = new cc.Node("NameLabel");
    var nameLabel = nameLabelNode.addComponent(cc.Label);
    nameLabel.string = rankInfo.player_name || "玩家";
    nameLabel.fontSize = 14;
    nameLabelNode.color = new cc.Color(255, 255, 255);
    nameLabelNode.y = -8;
    nameLabelNode.parent = itemNode;

    // 金币数
    var coinLabelNode = new cc.Node("CoinLabel");
    var coinLabel = coinLabelNode.addComponent(cc.Label);
    coinLabel.string = rankInfo.match_coin + " 金币";
    coinLabel.fontSize = 12;
    coinLabelNode.color = new cc.Color(255, 255, 200);
    coinLabelNode.y = -22;
    coinLabelNode.parent = itemNode;
    itemNode.parent = parent;
  },
  /**
   * 🎉【竞技场】创建冠军粒子特效
   */
  _createChampionParticles: function _createChampionParticles(parentNode, width, height) {
    // 简单的金色闪烁粒子效果
    for (var i = 0; i < 20; i++) {
      (function (index) {
        var particle = new cc.Node("Particle_" + index);
        particle.setPosition((Math.random() - 0.5) * width, height / 2 + 50);
        var particleLabel = particle.addComponent(cc.Label);
        particleLabel.string = "✨";
        particleLabel.fontSize = 20 + Math.random() * 20;
        particle.parent = parentNode;
        cc.tween(particle).delay(Math.random() * 0.5).to(2, {
          y: -height / 2 - 50,
          x: particle.x + (Math.random() - 0.5) * 100
        }).call(function () {
          particle.destroy();
        }).start();
      })(i);
    }
  },
  // ============================================================
  // 🔧【新增】最终榜单处理
  // ============================================================

  /**
   * 🏆【竞技场】处理最终榜单消息
   * 当竞技场所有轮次结束时调用
   * @param {Object} data - { period_no, total_players, top3, top20, my_rank, my_match_coin }
   */
  _onTournamentFinalRank: function _onTournamentFinalRank(data) {
    console.log("🏆 [_onTournamentFinalRank] 收到最终榜单数据:", JSON.stringify(data));

    // 停止所有倒计时
    this._stopPlayCountdown();
    this._stopBidCountdown();
    if (this._localArenaCountdownTimer) {
      this.unschedule(this._localArenaCountdownTick);
      this._localArenaCountdownTimer = null;
    }

    // 隐藏比赛金币显示
    this._hideMatchCoinDisplay();

    // 关闭之前的结算弹窗
    if (this._gameResultPopup || this._gameResultMask) {
      this._closeGameResultPopup(this._gameResultPopup, this._gameResultMask);
    }

    // 显示最终榜单弹窗
    this._showTournamentFinalRankDialog(data);
  },
  /**
   * 🏆【竞技场】显示最终榜单弹窗（完整版 - 带滚动列表）
   * @param {Object} data - { period_no, total_players, top3, top20, my_rank, my_match_coin }
   */
  _showTournamentFinalRankDialog: function _showTournamentFinalRankDialog(data) {
    var self = this;
    var winSize = cc.winSize;
    var canvas = cc.find("Canvas") || cc.find("UI_ROOT") || this.node.parent;
    if (!canvas) canvas = this.node;

    // ========== 遮罩层 ==========
    var maskNode = new cc.Node("FinalRankMask");
    maskNode.addComponent(cc.BlockInputEvents);
    maskNode.color = new cc.Color(10, 5, 30);
    maskNode.opacity = 200;
    maskNode.width = winSize.width * 2;
    maskNode.height = winSize.height * 2;
    maskNode.zIndex = 999;
    maskNode.parent = canvas;

    // ========== 弹窗容器 ==========
    var popupNode = new cc.Node("FinalRankPopup");
    popupNode.scale = 0.3;
    popupNode.opacity = 0;
    popupNode.zIndex = 1000;
    popupNode.parent = canvas;

    // 弹窗尺寸（高度改为屏幕高度的85%，避免溢出）
    var popupWidth = 600;
    var popupHeight = Math.floor(winSize.height * 0.85);

    // ========== 主背景 ==========
    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics);
    bg.fillColor = new cc.Color(30, 22, 54, 250);
    bg.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 16);
    bg.fill();
    bg.strokeColor = new cc.Color(255, 200, 80);
    bg.lineWidth = 3;
    bg.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 16);
    bg.stroke();
    bgNode.parent = popupNode;

    // ========== 顶部标题区域 ==========
    var titleBgNode = new cc.Node("TitleBg");
    var titleBg = titleBgNode.addComponent(cc.Graphics);
    titleBg.fillColor = new cc.Color(180, 130, 50, 220);
    titleBg.roundRect(-popupWidth / 2 + 8, popupHeight / 2 - 55, popupWidth - 16, 50, 8);
    titleBg.fill();
    titleBgNode.parent = popupNode;
    var titleNode = new cc.Node("Title");
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = "🏆 比赛结束 🏆";
    titleLabel.fontSize = 32;
    titleLabel.enableBold = true;
    titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    titleNode.color = new cc.Color(255, 250, 220);
    titleNode.y = popupHeight / 2 - 32;
    titleNode.parent = popupNode;

    // 参赛人数
    var totalNode = new cc.Node("Total");
    var totalLabel = totalNode.addComponent(cc.Label);
    totalLabel.string = "共 " + (data.total_players || 3) + " 人参赛";
    totalLabel.fontSize = 16;
    totalLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    totalNode.color = new cc.Color(200, 200, 220);
    totalNode.y = popupHeight / 2 - 75;
    totalNode.parent = popupNode;

    // ========== TOP3 领奖台（紧凑布局）==========
    var top3 = data.top3 || [];
    var podiumY = popupHeight / 2 - 145;
    var podiumSpacing = 170;

    // 银牌（第二名）- 左侧
    if (top3.length >= 2) {
      this._createPodiumEntry(popupNode, top3[1], 2, -podiumSpacing, podiumY);
    }

    // 金牌（第一名）- 中间（最高）
    if (top3.length >= 1) {
      this._createPodiumEntry(popupNode, top3[0], 1, 0, podiumY + 20);
    }

    // 铜牌（第三名）- 右侧
    if (top3.length >= 3) {
      this._createPodiumEntry(popupNode, top3[2], 3, podiumSpacing, podiumY - 10);
    }

    // ========== 第4-20名滚动列表区域 ==========
    var top20 = data.top20 || [];
    if (top20.length > 0) {
      // 列表区域标题
      var listTitleNode = new cc.Node("ListTitle");
      var listTitleLabel = listTitleNode.addComponent(cc.Label);
      listTitleLabel.string = "—— 排行榜 ——";
      listTitleLabel.fontSize = 18;
      listTitleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
      listTitleNode.color = new cc.Color(180, 160, 120);
      listTitleNode.y = popupHeight / 2 - 260;
      listTitleNode.parent = popupNode;

      // 创建滚动视图容器
      var scrollViewNode = new cc.Node("ScrollView");
      scrollViewNode.width = popupWidth - 40;
      scrollViewNode.height = 280;
      scrollViewNode.y = -30;
      scrollViewNode.parent = popupNode;

      // 添加遮罩组件
      var mask = scrollViewNode.addComponent(cc.Mask);
      mask.type = cc.Mask.Type.RECT;

      // 创建内容容器
      var contentNode = new cc.Node("Content");
      contentNode.width = popupWidth - 40;
      contentNode.anchorY = 1;
      contentNode.y = scrollViewNode.height / 2;
      contentNode.parent = scrollViewNode;

      // 🔧【修复】过滤掉已在TOP3中的玩家，避免重复显示
      var top3PlayerIDs = {};
      for (var i = 0; i < top3.length; i++) {
        if (top3[i] && top3[i].player_id) {
          top3PlayerIDs[top3[i].player_id] = true;
        }
      }

      // 只显示第4名及之后的玩家（过滤掉TOP3）
      var filteredTop20 = [];
      for (var i = 0; i < top20.length; i++) {
        var rankData = top20[i];
        // 跳过已在TOP3中的玩家
        if (rankData && rankData.player_id && !top3PlayerIDs[rankData.player_id]) {
          filteredTop20.push(rankData);
        }
      }

      // 添加每个排行项
      var itemHeight = 45;
      var startY = 0;
      for (var i = 0; i < filteredTop20.length; i++) {
        var rankData = filteredTop20[i];
        var actualRank = i + 4; // 第4名开始

        var itemNode = this._createRankListItem(rankData, actualRank, popupWidth - 50);
        itemNode.y = startY - i * itemHeight - itemHeight / 2;
        itemNode.parent = contentNode;
      }

      // 设置内容高度
      contentNode.height = Math.max(filteredTop20.length * itemHeight, 280);

      // 添加触摸滚动
      this._addScrollViewTouch(scrollViewNode, contentNode, 280);
    }

    // ========== 底部区域（我的排名 + 按钮）==========
    // 分隔线
    var sepNode = new cc.Node("BottomSep");
    var sep = sepNode.addComponent(cc.Graphics);
    sep.strokeColor = new cc.Color(255, 200, 80, 100);
    sep.lineWidth = 1;
    sep.moveTo(-popupWidth / 2 + 30, 0);
    sep.lineTo(popupWidth / 2 - 30, 0);
    sep.stroke();
    sepNode.y = -popupHeight / 2 + 140;
    sepNode.parent = popupNode;

    // 我的排名背景
    var myRankBgNode = new cc.Node("MyRankBg");
    var myRankBg = myRankBgNode.addComponent(cc.Graphics);
    myRankBg.fillColor = new cc.Color(50, 45, 80, 200);
    myRankBg.roundRect(-200, -22, 400, 44, 8);
    myRankBg.fill();
    myRankBg.strokeColor = new cc.Color(255, 200, 80, 150);
    myRankBg.lineWidth = 1;
    myRankBg.roundRect(-200, -22, 400, 44, 8);
    myRankBg.stroke();
    myRankBgNode.y = -popupHeight / 2 + 100;
    myRankBgNode.parent = popupNode;

    // 我的排名文字
    var myRankNode = new cc.Node("MyRank");
    var myRankLabel = myRankNode.addComponent(cc.Label);
    myRankLabel.string = "我的排名: 第 " + (data.my_rank || 1) + " 名  |  比赛金币: " + (data.my_match_coin || 0);
    myRankLabel.fontSize = 20;
    myRankLabel.enableBold = true;
    myRankLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    myRankNode.color = new cc.Color(255, 230, 150);
    myRankNode.y = -popupHeight / 2 + 100;
    myRankNode.parent = popupNode;

    // ========== 确定按钮 ==========
    var btnNode = new cc.Node("ConfirmBtn");
    btnNode.width = 180;
    btnNode.height = 50;
    var btnBg = btnNode.addComponent(cc.Graphics);
    btnBg.fillColor = new cc.Color(76, 175, 80);
    btnBg.roundRect(-90, -25, 180, 50, 10);
    btnBg.fill();
    btnBg.strokeColor = new cc.Color(129, 199, 132);
    btnBg.lineWidth = 2;
    btnBg.roundRect(-90, -25, 180, 50, 10);
    btnBg.stroke();
    btnNode.y = -popupHeight / 2 + 40;
    btnNode.parent = popupNode;
    var btnLabel = new cc.Node("Label");
    var btnLabelComp = btnLabel.addComponent(cc.Label);
    btnLabelComp.string = "确  定";
    btnLabelComp.fontSize = 24;
    btnLabelComp.enableBold = true;
    btnLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    btnLabelComp.verticalAlign = cc.Label.VerticalAlign.CENTER;
    btnLabel.setContentSize(180, 50);
    btnLabel.color = new cc.Color(255, 255, 255);
    btnLabel.setPosition(0, 0);
    btnLabel.parent = btnNode;

    // 按钮触摸效果
    btnNode.on(cc.Node.EventType.TOUCH_START, function () {
      btnNode.scale = 0.95;
    });
    btnNode.on(cc.Node.EventType.TOUCH_END, function () {
      btnNode.scale = 1;
      popupNode.destroy();
      maskNode.destroy();
      cc.director.loadScene("hallScene");
    });
    btnNode.on(cc.Node.EventType.TOUCH_CANCEL, function () {
      btnNode.scale = 1;
    });

    // ========== 弹出动画 ==========
    cc.tween(popupNode).to(0.2, {
      scale: 1.0,
      opacity: 255
    }, {
      easing: 'backOut'
    }).start();
    console.log("🏆 [_showTournamentFinalRankDialog] 最终榜单弹窗已显示");
  },
  /**
   * 创建排行列表项
   */
  _createRankListItem: function _createRankListItem(rankData, rank, width) {
    var itemNode = new cc.Node("RankItem_" + rank);
    itemNode.width = width;
    itemNode.height = 42;

    // 背景（交替颜色）
    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics);
    if (rank % 2 === 0) {
      bg.fillColor = new cc.Color(45, 38, 70, 180);
    } else {
      bg.fillColor = new cc.Color(38, 32, 58, 180);
    }
    bg.roundRect(-width / 2, -20, width, 40, 6);
    bg.fill();
    bgNode.parent = itemNode;

    // 排名
    var rankNode = new cc.Node("Rank");
    var rankLabel = rankNode.addComponent(cc.Label);
    rankLabel.string = String(rank);
    rankLabel.fontSize = 18;
    rankLabel.enableBold = true;
    rankLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    rankNode.color = new cc.Color(255, 200, 100);
    rankNode.setPosition(-width / 2 + 35, 0);
    rankNode.parent = itemNode;

    // 🔧【新增】玩家头像
    var avatarNode = new cc.Node("Avatar");
    avatarNode.setPosition(-width / 2 + 75, 0);
    var avatarSprite = avatarNode.addComponent(cc.Sprite);
    avatarSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    avatarNode.setContentSize(32, 32);
    avatarNode.parent = itemNode;

    // 加载头像
    this._loadAvatarSprite(avatarSprite, rankData.avatar, rankData.is_robot);

    // 玩家名称
    var nameNode = new cc.Node("Name");
    var nameLabel = nameNode.addComponent(cc.Label);
    var playerName = rankData.player_name || "玩家";
    if (rankData.is_robot) {
      playerName = this._getRobotDisplayName(rankData.player_id, rankData.player_name);
    }
    nameLabel.string = playerName;
    nameLabel.fontSize = 16;
    nameLabel.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
    nameLabel.overflow = cc.Label.Overflow.CLAMP;
    nameNode.width = 150;
    nameNode.color = new cc.Color(255, 255, 255);
    nameNode.setPosition(-width / 2 + 145, 0);
    nameNode.parent = itemNode;

    // 金币
    var coinNode = new cc.Node("Coin");
    var coinLabel = coinNode.addComponent(cc.Label);
    coinLabel.string = (rankData.match_coin || 0) + " 金币";
    coinLabel.fontSize = 15;
    coinLabel.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
    coinNode.color = new cc.Color(255, 220, 150);
    coinNode.setPosition(width / 2 - 60, 0);
    coinNode.parent = itemNode;
    return itemNode;
  },
  /**
   * 添加滚动视图触摸事件
   */
  _addScrollViewTouch: function _addScrollViewTouch(scrollViewNode, contentNode, viewHeight) {
    var touchStartY = 0;
    var contentStartY = 0;
    var maxOffset = Math.max(0, contentNode.height - viewHeight);
    scrollViewNode.on(cc.Node.EventType.TOUCH_START, function (event) {
      touchStartY = event.getLocationY();
      contentStartY = contentNode.y;
    });
    scrollViewNode.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
      var touchY = event.getLocationY();
      var deltaY = touchY - touchStartY;
      var newY = contentStartY + deltaY;

      // 限制滚动范围
      var minY = viewHeight / 2 - contentNode.height;
      var maxY = viewHeight / 2;
      newY = Math.max(minY, Math.min(maxY, newY));
      contentNode.y = newY;
    });
  },
  /**
   * 🏆【竞技场】创建领奖台条目（美化版）
   */
  _createPodiumEntry: function _createPodiumEntry(parent, rankData, rank, x, y) {
    var entryNode = new cc.Node("PodiumEntry_" + rank);
    entryNode.setPosition(x, y);

    // ========== 排名背景（根据排名设置颜色）==========
    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics);
    var bgColor, borderColor;
    if (rank === 1) {
      // 金牌 - 金色系
      bgColor = new cc.Color(100, 85, 40, 230);
      borderColor = new cc.Color(255, 215, 0);
    } else if (rank === 2) {
      // 银牌 - 银色系
      bgColor = new cc.Color(70, 75, 85, 230);
      borderColor = new cc.Color(192, 192, 192);
    } else {
      // 铜牌 - 铜色系
      bgColor = new cc.Color(85, 60, 45, 230);
      borderColor = new cc.Color(205, 127, 50);
    }
    bg.fillColor = bgColor;
    bg.roundRect(-55, -70, 110, 140, 12);
    bg.fill();
    // 边框
    bg.strokeColor = borderColor;
    bg.lineWidth = 2;
    bg.roundRect(-55, -70, 110, 140, 12);
    bg.stroke();
    bgNode.parent = entryNode;

    // ========== 排名奖牌图标 ==========
    var medalNode = new cc.Node("Medal");
    var medal = medalNode.addComponent(cc.Graphics);
    var medalColor;
    if (rank === 1) {
      medalColor = new cc.Color(255, 215, 0); // 金色
    } else if (rank === 2) {
      medalColor = new cc.Color(192, 192, 192); // 银色
    } else {
      medalColor = new cc.Color(205, 127, 50); // 铜色
    }

    medal.fillColor = medalColor;
    // 绘制圆形奖牌
    medal.circle(0, 45, 22);
    medal.fill();
    medal.strokeColor = new cc.Color(255, 255, 255, 150);
    medal.lineWidth = 2;
    medal.circle(0, 45, 22);
    medal.stroke();
    medalNode.parent = entryNode;

    // 奖牌上的数字
    var rankNumNode = new cc.Node("RankNum");
    var rankNumLabel = rankNumNode.addComponent(cc.Label);
    rankNumLabel.string = String(rank);
    rankNumLabel.fontSize = 24;
    rankNumLabel.enableBold = true;
    rankNumLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    rankNumNode.color = new cc.Color(50, 40, 30);
    rankNumNode.setPosition(0, 45);
    rankNumNode.parent = entryNode;

    // ========== 玩家头像 ==========
    var avatarNode = new cc.Node("Avatar");
    avatarNode.setPosition(0, 20);
    var avatarSprite = avatarNode.addComponent(cc.Sprite);
    avatarSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    avatarNode.setContentSize(50, 50);
    avatarNode.parent = entryNode;

    // 🔧【新增】加载头像
    this._loadAvatarSprite(avatarSprite, rankData.avatar, rankData.is_robot);

    // 头像边框
    var avatarFrameNode = new cc.Node("AvatarFrame");
    var avatarFrame = avatarFrameNode.addComponent(cc.Graphics);
    avatarFrame.strokeColor = borderColor;
    avatarFrame.lineWidth = 2;
    avatarFrame.circle(0, 20, 26);
    avatarFrame.stroke();
    avatarFrameNode.parent = entryNode;

    // ========== 玩家名称 ==========
    var nameLabelNode = new cc.Node("Name");
    var nameLabel = nameLabelNode.addComponent(cc.Label);
    var playerName = rankData.player_name || "玩家";
    if (rankData.is_robot) {
      // 机器人使用智能陪练名称
      playerName = this._getRobotDisplayName(rankData.player_id, rankData.player_name);
    }
    nameLabel.string = playerName;
    nameLabel.fontSize = 18;
    nameLabel.enableBold = true;
    nameLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    nameLabelNode.color = new cc.Color(255, 255, 255);
    nameLabelNode.y = 5;
    nameLabelNode.parent = entryNode;

    // ========== 比赛金币 ==========
    var coinLabelNode = new cc.Node("Coin");
    var coinLabel = coinLabelNode.addComponent(cc.Label);
    coinLabel.string = (rankData.match_coin || 0) + " 金币";
    coinLabel.fontSize = 16;
    coinLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    coinLabelNode.color = new cc.Color(255, 230, 150);
    coinLabelNode.y = -25;
    coinLabelNode.parent = entryNode;

    // ========== 不再显示机器人AI标签 ==========
    // 用户要求：机器人不显示AI标识

    entryNode.parent = parent;
  },
  /**
   * 获取机器人显示名称
   */
  _getRobotDisplayName: function _getRobotDisplayName(playerId, originalName) {
    // 如果原始名称已经是"智能陪练X号"格式，直接返回
    if (originalName && originalName.indexOf("智能陪练") === 0) {
      return originalName;
    }
    // 否则，生成"智能陪练X号"格式的名称
    var robotIndex = 1;
    if (playerId) {
      var lastChar = playerId.toString().slice(-1);
      robotIndex = parseInt(lastChar) || 1;
    }
    return "智能陪练" + robotIndex + "号";
  },
  /**
   * 🔧【新增】加载头像精灵
   * @param {cc.Sprite} sprite - 目标精灵组件
   * @param {string} avatarUrl - 头像URL或资源名
   * @param {boolean} isRobot - 是否是机器人
   */
  _loadAvatarSprite: function _loadAvatarSprite(sprite, avatarUrl, isRobot) {
    if (!sprite) return;

    // 机器人使用默认头像（avatar_1 到 avatar_3 随机）
    if (isRobot) {
      var robotAvatarIndex = Math.floor(Math.random() * 3) + 1;
      var defaultPath = "UI/headimage/avatar_" + robotAvatarIndex;
      cc.resources.load(defaultPath, cc.SpriteFrame, function (err, spriteFrame) {
        if (!err && spriteFrame && sprite.isValid) {
          sprite.spriteFrame = spriteFrame;
        }
      });
      return;
    }

    // 真人玩家
    if (!avatarUrl || avatarUrl === "") {
      // 使用默认头像
      cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function (err, spriteFrame) {
        if (!err && spriteFrame && sprite.isValid) {
          sprite.spriteFrame = spriteFrame;
        }
      });
      return;
    }

    // 判断是URL还是本地资源名
    if (avatarUrl.indexOf("http") === 0 || avatarUrl.indexOf("//") === 0) {
      // 远程URL
      cc.assetManager.loadRemote(avatarUrl, {
        ext: '.png'
      }, function (err, texture) {
        if (err || !texture) {
          // 加载失败，使用默认头像
          cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function (err2, fallbackSprite) {
            if (!err2 && fallbackSprite && sprite.isValid) {
              sprite.spriteFrame = fallbackSprite;
            }
          });
          return;
        }
        try {
          if (sprite.isValid) {
            var spriteFrame = new cc.SpriteFrame(texture);
            sprite.spriteFrame = spriteFrame;
          }
        } catch (e) {
          // 使用默认头像
          cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function (err2, fallbackSprite) {
            if (!err2 && fallbackSprite && sprite.isValid) {
              sprite.spriteFrame = fallbackSprite;
            }
          });
        }
      });
    } else {
      // 本地资源名
      var localPath = "UI/headimage/" + avatarUrl;
      cc.resources.load(localPath, cc.SpriteFrame, function (err, spriteFrame) {
        if (err || !spriteFrame) {
          // 加载失败，使用默认头像
          cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function (err2, fallbackSprite) {
            if (!err2 && fallbackSprite && sprite.isValid) {
              sprite.spriteFrame = fallbackSprite;
            }
          });
          return;
        }
        if (sprite.isValid) {
          sprite.spriteFrame = spriteFrame;
        }
      });
    }
  }
});

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0c1xcc2NyaXB0c1xcZ2FtZVNjZW5lXFxnYW1laW5nVUkuanMiXSwibmFtZXMiOlsiaXNvcGVuX3NvdW5kIiwid2luZG93IiwicWlhbl9zdGF0ZSIsImJ1cWlhbmciLCJxaWFuIiwiQ2FyZHNWYWx1ZSIsIlJvb21TdGF0ZSIsIl9hdWRpb0NsaXBzIiwiQ2FyZExheW91dCIsImNhcmRTY2FsZSIsImNhcmRZIiwiY2FyZFNwYWNpbmciLCJib3R0b21DYXJkU2NhbGUiLCJib3R0b21DYXJkU3BhY2luZyIsIm91dENhcmRTY2FsZSIsIm91dENhcmRTcGFjaW5nIiwiRGVhbENvbmZpZyIsImFuaW1EdXJhdGlvbiIsImRlY2tQb3NpdGlvbiIsImNjIiwidjIiLCJjYXJkSW50ZXJ2YWwiLCJwbGF5U291bmQiLCJwYXRoIiwiYXVkaW9FbmdpbmUiLCJwbGF5IiwicmVzb3VyY2VzIiwibG9hZCIsIkF1ZGlvQ2xpcCIsImVyciIsImNsaXAiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJnYW1laW5nVUkiLCJOb2RlIiwiY2FyZF9wcmVmYWIiLCJQcmVmYWIiLCJyb2JVSSIsImJvdHRvbV9jYXJkX3Bvc19ub2RlIiwicGxheWluZ1VJX25vZGUiLCJ0aXBzTGFiZWwiLCJMYWJlbCIsImNhcmRzX25vZGUiLCJiaWRDb3VudGRvd25MYWJlbCIsInBsYXlDb3VudGRvd25MYWJlbCIsInRpY2tBdWRpbyIsInR5cGUiLCJvbkxvYWQiLCJteWdsb2JhbCIsImNvbnNvbGUiLCJlcnJvciIsImdhbWVTY2VuZU5vZGUiLCJub2RlIiwicGFyZW50IiwiaSIsImNoaWxkcmVuIiwibGVuZ3RoIiwiY2hpbGQiLCJuYW1lIiwibmV3Q2FyZHNOb2RlIiwic2V0UG9zaXRpb24iLCJzZXRBbmNob3JQb2ludCIsInNldENvbnRlbnRTaXplIiwic2l6ZSIsImhhbmRDYXJkcyIsImJvdHRvbUNhcmRzIiwiY2hvb3NlX2NhcmRfZGF0YSIsInJvYl9wbGF5ZXJfYWNjb3VudGlkIiwiX2JpZGRpbmdQaGFzZSIsIl9nYW1lUGhhc2UiLCJjYXJkc1JlYWR5IiwiX2JpZFRpbWVvdXQiLCJfcGxheVRpbWVvdXQiLCJfYmlkQ291bnRkb3duVGltZXIiLCJfcGxheUNvdW50ZG93blRpbWVyIiwiX2JpZFRpbWVMZWZ0IiwiX3BsYXlUaW1lTGVmdCIsIl9pc0JpZENvdW50ZG93blRpY2tpbmciLCJfaXNQbGF5Q291bnRkb3duVGlja2luZyIsIl9pc0JpZFdhcm5pbmciLCJfaXNQbGF5V2FybmluZyIsIl9iaWRFeHBpcmVzQXQiLCJib3R0b21fY2FyZCIsIl9pc0NvbXBldGl0aW9uIiwiX3Jvb21DYXRlZ29yeSIsIl9tYXRjaENvaW4iLCJfY29tcGV0aXRpb25Sb3VuZCIsIl9jb21wZXRpdGlvblRvdGFsUm91bmRzIiwiX2NvbXBldGl0aW9uQ291bnRkb3duIiwiX2NvbXBldGl0aW9uQ291bnRkb3duVGltZXIiLCJfd2FzRGlzY29ubmVjdGVkIiwic29ja2V0Iiwib25QdXNoQ2FyZHMiLCJkYXRhIiwibG9nIiwiSlNPTiIsInN0cmluZ2lmeSIsImNhcmRzIiwiYm90dG9tX2NhcmRzIiwiX2dhbWVSZXN1bHRQb3B1cCIsIl9nYW1lUmVzdWx0TWFzayIsIl9jbG9zZUdhbWVSZXN1bHRQb3B1cCIsIl9zdG9wQXJlbmFDb3VudGRvd24iLCJfY2xlYXJBbGxPdXRDYXJkWm9uZXMiLCJyZW5kZXJDYXJkcyIsImJpbmQiLCJvbkJpZFR1cm4iLCJvbkJpZFJlc3VsdCIsIl9zdG9wQmlkQ291bnRkb3duIiwiZW1pdCIsInBsYXllcl9pZCIsImFjY291bnRpZCIsImJpZCIsInN0YXRlIiwib25DYW5Sb2JTdGF0ZSIsIm9uQ2FuQ2h1Q2FyZCIsInBsYXllcklkIiwibXlQbGF5ZXJJZCIsImdldFBsYXllckluZm8iLCJpZCIsInBsYXllckRhdGEiLCJzZXJ2ZXJQbGF5ZXJJZCIsImFjY291bnRJRCIsIl9zdG9wUGxheUNvdW50ZG93biIsIl9tdXN0UGxheSIsIm11c3RfcGxheSIsIl9jYW5CZWF0IiwiY2FuX2JlYXQiLCJfbGFzdFBsYXllZENhcmRzIiwiU3RyaW5nIiwiX2hpZGVSb2JVSSIsImNsZWFyT3V0Wm9uZSIsImFjdGl2ZSIsInRpbWVvdXQiLCJfc3RhcnRQbGF5Q291bnRkb3duIiwib25PdGhlclBsYXllckNodUNhcmQiLCJpc19wYXNzIiwiX3BsYXlQYXNzU291bmQiLCJfc2hvd1Bhc3NFZmZlY3QiLCJfbGFzdFBsYXllZEhhbmRUeXBlIiwiaGFuZF90eXBlIiwic29ja2V0SW5mbyIsImFjY291bnRJZCIsImlzU2VsZiIsIl9yZW1vdmVDYXJkc0Zyb21IYW5kIiwiX3BsYXlDYXJkU291bmQiLCJnYW1lU2NlbmVfc2NyaXB0IiwiZ2V0Q29tcG9uZW50Iiwib3V0Q2FyZF9ub2RlIiwiZ2V0VXNlck91dENhcmRQb3NCeUFjY291bnQiLCJub2RlX2NhcmRzIiwiY2FyZCIsImluc3RhbnRpYXRlIiwiY2FyZFNjcmlwdCIsInNob3dDYXJkcyIsInB1c2giLCJzaG93T3V0Q2FyZHMiLCJjYXJkc19sZWZ0IiwidW5kZWZpbmVkIiwiY291bnQiLCJvbkNhbGxMYW5kbG9yZFN0YXJ0Iiwib25DYWxsTGFuZGxvcmRUdXJuIiwiX3Byb2Nlc3NDYWxsTGFuZGxvcmRUdXJuIiwib25DYWxsTGFuZGxvcmRSZXN1bHQiLCJfcGxheVJvYlNvdW5kIiwib25DYWxsTGFuZGxvcmRFbmQiLCJfc2hvd0JvdHRvbUNhcmRzVG9BbGwiLCJvbkxhbmRsb3JkQ2FyZHMiLCJsYW5kbG9yZElkIiwibGFuZGxvcmRfaWQiLCJfdXBkYXRlTGFuZGxvcmRIYW5kQ2FyZHMiLCJvblJlc3RhcnRHYW1lIiwiY2xlYXJBbGxDYXJkcyIsIm9uUGxheVN0YXJ0Iiwib25HYW1lT3ZlciIsIl9yZXNldEFsbFBsYXllclJlYWR5U3RhdGUiLCJfc2hvd0dhbWVSZXN1bHRQb3B1cCIsIm9uR2FtZVN0YXRlUmVzdG9yZSIsInJlc3RvcmVHYW1lU3RhdGUiLCJvbkhpbnRSZXN1bHQiLCJfb25IaW50UmVzdWx0Iiwib25UcnVzdGVlU3RhdGVOb3RpZnkiLCJfb25UcnVzdGVlU3RhdGVOb3RpZnkiLCJvbkNvbXBldGl0aW9uU3RhdHVzIiwiX29uQ29tcGV0aXRpb25TdGF0dXMiLCJvbkNvbXBldGl0aW9uQ291bnRkb3duIiwiX29uQ29tcGV0aXRpb25Db3VudGRvd24iLCJvbk1hdGNoQ29pblVwZGF0ZSIsIl9vbk1hdGNoQ29pblVwZGF0ZSIsIm9uQ29tcGV0aXRpb25FbGltaW5hdGVkIiwiX29uQ29tcGV0aXRpb25FbGltaW5hdGVkIiwib25Db21wZXRpdGlvbkFkdmFuY2UiLCJfb25Db21wZXRpdGlvbkFkdmFuY2UiLCJvbkNvbXBldGl0aW9uQ2hhbXBpb24iLCJfb25Db21wZXRpdGlvbkNoYW1waW9uIiwib25Ub3VybmFtZW50RmluYWxSYW5rIiwiX29uVG91cm5hbWVudEZpbmFsUmFuayIsIm9uIiwiZ2FtZVNjZW5lX25vZGUiLCJldmVudCIsIl91cGRhdGVTZWxlY3RlZENvdW50RGlzcGxheSIsImNhcmRpZCIsInN1aXQiLCJyYW5rIiwic3BsaWNlIiwic3RhcnQiLCJvbkRlc3Ryb3kiLCJ1bnNjaGVkdWxlIiwiX2NvbXBldGl0aW9uQ291bnRkb3duVGljayIsIl9sb2NhbEFyZW5hQ291bnRkb3duVGltZXIiLCJfbG9jYWxBcmVuYUNvdW50ZG93blRpY2siLCJfaGlkZU1hdGNoQ29pbkRpc3BsYXkiLCJoYXNoIiwiX2xhc3RSZW5kZXJIYXNoIiwic29ydGVkQ2FyZHMiLCJfc29ydENhcmRzIiwiX2NyZWF0ZUJvdHRvbUNhcmRzIiwiX2RlYWxDYXJkc1dpdGhBbmltYXRpb24iLCJzZWxmIiwiY2FyZFBhcmVudCIsImRlY2tQb3MiLCJ4IiwieSIsImluZGV4Iiwic2NoZWR1bGVPbmNlIiwiY2FyZERhdGEiLCJ0YXJnZXRYIiwiX2dldENhcmRYIiwidGFyZ2V0UG9zIiwic2NhbGUiLCJ6SW5kZXgiLCJjYXJkQ29tcCIsInR3ZWVuIiwidG8iLCJwb3NpdGlvbiIsImVhc2luZyIsImNhbGwiLCJ0b3RhbERlYWxUaW1lIiwiX29uRGVhbENhcmRzQ29tcGxldGUiLCJmYXBhaV9lbmQiLCJfY2hlY2tBbmRTaG93Um9iVUkiLCJnZXRDYXJkVmFsdWUiLCJzbGljZSIsInNvcnQiLCJhIiwiYiIsInZhbHVlQSIsInZhbHVlQiIsInJlbW92ZUFsbENoaWxkcmVuIiwid2FybiIsInNwYWNpbmciLCJ0b3RhbFdpZHRoIiwic3RhcnRYIiwiZGVzdHJveSIsImJvdHRvbVkiLCJib3R0b21TdGFydFgiLCJkaV9jYXJkIiwiX3Nob3dCaWRVSSIsInJvdW5kIiwiZXhwaXJlc0F0IiwiZXhwaXJlc19hdCIsImNvbmZpcm1UZXh0IiwiY2FuY2VsVGV4dCIsImNvbmZpcm1CdG4iLCJnZXRDaGlsZEJ5TmFtZSIsImNhbmNlbEJ0biIsImxhYmVsIiwic3RyaW5nIiwiX3N0YXJ0QmlkQ291bnRkb3duIiwiZHVyYXRpb24iLCJ0aW1lTGVmdCIsIm5vdyIsIkRhdGUiLCJNYXRoIiwibWF4IiwiZmxvb3IiLCJfdXBkYXRlQmlkQ291bnRkb3duVUkiLCJzY2hlZHVsZSIsIl9iaWRDb3VudGRvd25UaWNrIiwiX2VudGVyQmlkV2FybmluZ1N0YXRlIiwiX3BsYXlUaWNrU291bmQiLCJfb25CaWRDb3VudGRvd25FbmQiLCJyZW1haW5pbmciLCJ1cGRhdGVkIiwiY2xvY2tOb2RlIiwiaiIsIm9wYWNpdHkiLCJmb250U2l6ZSIsImxpbmVIZWlnaHQiLCJjb2xvciIsIkNvbG9yIiwibGFiZWxOb2RlIiwiX2dldEJpZENvdW50ZG93bkxhYmVsTm9kZSIsIlJFRCIsInN0b3BBbGxBY3Rpb25zIiwicmVwZWF0Rm9yZXZlciIsImxhYmVsTmFtZXMiLCJXSElURSIsIl91cGRhdGVQbGF5Q291bnRkb3duVUkiLCJfcGxheUNvdW50ZG93blRpY2siLCJfZW50ZXJQbGF5V2FybmluZ1N0YXRlIiwiX29uUGxheUNvdW50ZG93bkVuZCIsIkV2ZW50IiwiRXZlbnRDdXN0b20iLCJzZXRVc2VyRGF0YSIsImRpc3BhdGNoRXZlbnQiLCJjbG9ja0xhYmVsIiwiX3VwZGF0ZUNsb2NrVGltZUxhYmVsIiwicGxheWVyTm9kZVNjcmlwdCIsInNlYXRfaW5kZXgiLCJ0aW1lX2xhYmVsIiwiY2xvY2tpbWFnZSIsImNsb2NrQ2hpbGRyZW4iLCJjbG9ja0NoaWxkIiwiZGlyZWN0TGFiZWwiLCJfZ2V0UGxheUNvdW50ZG93bkxhYmVsTm9kZSIsInBsYXlFZmZlY3QiLCJfcGxheVBsYXlUaWNrU291bmQiLCJhY3Rpb24iLCJnZW5kZXIiLCJvcmRlciIsInBsYXllcklEIiwic291bmRLZXkiLCJfbGFzdFJvYlNvdW5kS2V5IiwicGFzc1NvdW5kIiwiX3BsYXlTb3VuZEVmZmVjdCIsInNvdW5kcyIsIl9wbGF5UmFuZG9tU291bmQiLCJmYWxsYmFjayIsImFsbG93RGFuaUZhbGxiYWNrIiwibWVzc2FnZSIsImVycjIiLCJjbGlwMiIsInJhbmRvbSIsIm9uQnV0dG9uQ2xpY2siLCJjdXN0b21EYXRhIiwicmVxdWVzdEJpZCIsInJlcXVlc3RSb2JTdGF0ZSIsInJlcXVlc3RfYnVjaHVfY2FyZCIsIl9vbkhpbnRCdXR0b25DbGljayIsInNldFRpbWVvdXQiLCJzZWxlY3RlZENhcmROYW1lcyIsImNhcmRfZGF0YSIsImNhcmROYW1lIiwiX2dldENhcmREaXNwbGF5TmFtZSIsImNhcmRzVG9QbGF5IiwibWFwIiwiYyIsInZhbGlkYXRpb25SZXN1bHQiLCJfdmFsaWRhdGVIYW5kVHlwZSIsInZhbGlkIiwicmVxdWVzdF9jaHVfY2FyZCIsImVycm9yTXNnIiwibXNnIiwic2VsZWN0ZWRUeXBlIiwic2VsZWN0ZWRDb3VudCIsImxhc3RQbGF5ZWRUeXBlIiwibGFzdFBsYXllZENvdW50IiwibGFzdFBsYXllZENhcmROYW1lcyIsIm5hbWVzIiwiam9pbiIsImRldGFpbE1zZyIsImluZGV4T2YiLCJ5b3VyQ2FyZHMiLCJfcmVzZXRDYXJkRmxhZ3MiLCJkaXNwbGF5VGV4dCIsInB1c2hUaHJlZUNhcmQiLCJjYXJkVG9SZW1vdmUiLCJfdXBkYXRlSGFuZENhcmRzU2lsZW50IiwiY2FyZHNQYXJlbnQiLCJvbGRDaGlsZHJlbiIsIm9mZiIsIkV2ZW50VHlwZSIsIlRPVUNIX1NUQVJUIiwiZGVzdG9yeUNhcmQiLCJjaG9vc2VfY2FyZCIsImRlc3Ryb3lfY2FyZCIsIl9nZXRPdXRDYXJkTm9kZSIsInNlbGVjdGVkTm9kZXMiLCJmbGFnIiwic2VuZEhpbnRSZXF1ZXN0IiwiX3NlbGVjdENhcmRzIiwiX2ZpbmRQbGF5YWJsZUNhcmRzIiwibGFzdFNlbGVjdGVkIiwiY2FyZENvdW50cyIsIl9maW5kU21hbGxlc3RDYXJkcyIsImxhc3RUeXBlIiwibGFzdFJhbmsiLCJfZ2V0TGFzdFBsYXllZE1haW5SYW5rIiwibGFzdENvdW50IiwidG9Mb3dlckNhc2UiLCJfZmluZEJlYXRpbmdTaW5nbGUiLCJfZmluZEJlYXRpbmdQYWlyIiwiX2ZpbmRCZWF0aW5nVHJpcGxlIiwiX2ZpbmRCZWF0aW5nQm9tYiIsIl9maW5kQmVhdGluZ0J5Q291bnQiLCJjb3VudHMiLCJtYXhDb3VudCIsIm1haW5SYW5rIiwicGFyc2VJbnQiLCJyYW5rcyIsIk9iamVjdCIsImtleXMiLCJyIiwidGFyZ2V0UmFuayIsIl9maW5kU21hbGxlc3RCb21iIiwia2lja2VycyIsInJlc3VsdCIsImtpY2tlckNhcmRzIiwiX2ZpbmRLaWNrZXJDYXJkcyIsImNvbmNhdCIsImV4Y2x1ZGVSYW5rIiwiYXZhaWxhYmxlIiwibWluIiwiX2ZpbmRSb2NrZXQiLCJqb2tlcnMiLCJmb3VuZENvdW50IiwiYWxyZWFkeU1hdGNoZWQiLCJjYXJkTm9kZSIsIm1hdGNoS2V5IiwiY2FyZF9pZCIsImFkZENoaWxkIiwic2V0U2NhbGUiLCJnYW1lU3RhdGUiLCJnYW1lX3N0YXRlIiwicGhhc2UiLCJwbGF5ZXJzIiwicCIsImlzX2xhbmRsb3JkIiwibWFzdGVyX2FjY291bnRpZCIsImhhbmQiLCJsYXN0X3BsYXllZCIsImxhc3RfcGxheWVyX2lkIiwiY3VycmVudF90dXJuIiwiaGFuZFR5cGUiLCJpc05ld1JvdW5kIiwiaXNfbmV3X3JvdW5kIiwiY2FuQmVhdCIsIl9leHRyYWN0TWFpblJhbmsiLCJpc0JvbWIiLCJpc1JvY2tldCIsInNvdW5kTmFtZSIsIl9nZXRDYXJkVHlwZVNvdW5kIiwiY2FyZFNvdW5kIiwicHJlZml4IiwiZGFuaVNvdW5kIiwiaGFzU3BlY2lmaWNTb3VuZCIsIl9oYXNTcGVjaWZpY0NhcmRTb3VuZCIsInJhbmRvbVZhbHVlIiwic291bmRJbmRleCIsIl9yYW5rVG9Tb3VuZEluZGV4IiwiaGFzU291bmQiLCJzcGVjaWFsVHlwZXMiLCJfZXh0cmFjdENhcmRSYW5rIiwiTnVtYmVyIiwidmFsdWUiLCJsb2dpY192YWx1ZSIsImtleSIsInN1ZmZpeCIsInJhbmRvbUluZGV4IiwiX3BsYXlHYW1lUmVzdWx0U291bmQiLCJpc1dpbiIsInBhc3NOb2RlIiwiYWRkQ29tcG9uZW50Iiwib3V0bGluZSIsIkxhYmVsT3V0bGluZSIsIndpZHRoIiwiaXNWYWxpZCIsInN1aXROYW1lcyIsInN1aXROYW1lIiwicmFua05hbWVzIiwicmFua05hbWUiLCJyYW5rQ291bnRzIiwidmFsdWVzIiwiZm91cnMiLCJ0aHJlZXMiLCJwYWlycyIsInNpbmdsZXMiLCJpc1NlcXVlbnRpYWwiLCJfaXNTZXF1ZW50aWFsIiwibm9Ud29Pckpva2VyIiwiZXZlcnkiLCJwYWlyUmFua3MiLCJ0aHJlZVJhbmtzIiwidGhyZWVDb3VudCIsInJvb21fY2F0ZWdvcnkiLCJfc2hvd0NvbXBldGl0aW9uUmVzdWx0UG9wdXAiLCJpc1dpbm5lciIsIm15V2luR29sZCIsInBsYXllciIsImlzX3dpbm5lciIsIndpbl9nb2xkIiwid2lubmVyX2lkIiwiaXNMYW5kbG9yZCIsIm9sZEdvbGQiLCJnb2JhbF9jb3VudCIsIm5ld0dvbGQiLCJnb2xkQWZ0ZXIiLCJnb2xkX2FmdGVyIiwiX3VwZGF0ZVBsYXllckdvbGREaXNwbGF5IiwibG9jYWxHb2xkIiwiX2NyZWF0ZUdhbWVSZXN1bHRQb3B1cCIsIl9jb250aW51ZUdhbWUiLCJfcmV0dXJuVG9Mb2JieSIsImNhbGxiYWNrIiwid2luU2l6ZSIsImNhbnZhcyIsImZpbmQiLCJtYXNrTm9kZSIsIkJsb2NrSW5wdXRFdmVudHMiLCJtYXNrU3ByaXRlIiwiU3ByaXRlIiwic3ByaXRlRnJhbWUiLCJTcHJpdGVGcmFtZSIsIlR5cGUiLCJTSU1QTEUiLCJzaXplTW9kZSIsIlNpemVNb2RlIiwiQ1VTVE9NIiwiaGVpZ2h0IiwicG9wdXBOb2RlIiwicG9wdXBXaWR0aCIsInBvcHVwSGVpZ2h0IiwiYmdOb2RlIiwiX2NyZWF0ZUdyYWRpZW50QmFja2dyb3VuZCIsImJvcmRlck5vZGUiLCJfY3JlYXRlR29sZGVuQm9yZGVyIiwiZWZmZWN0TGF5ZXIiLCJfY3JlYXRlVmljdG9yeVBhcnRpY2xlcyIsIl9jcmVhdGVEZWZlYXRQYXJ0aWNsZXMiLCJiYW5uZXJZIiwiYmFubmVyTm9kZSIsIl9jcmVhdGVSZXN1bHRCYW5uZXIiLCJkZXRhaWxYIiwiZGV0YWlsWSIsImRldGFpbE5vZGUiLCJfY3JlYXRlTXVsdGlwbGllckRldGFpbENhcmQiLCJsaXN0V2lkdGgiLCJsaXN0WCIsImxpc3RZIiwicGxheWVyTGlzdE5vZGUiLCJfY3JlYXRlUGxheWVyUmVzdWx0TGlzdCIsImJ0blkiLCJidXR0b25BcmVhIiwiX2NyZWF0ZUJ1dHRvbkFyZWEiLCJfc3RhcnROdW1iZXJBbmltYXRpb25zIiwiX3Jlc3VsdEVmZmVjdExheWVyIiwiZ3JhcGhpY3MiLCJHcmFwaGljcyIsInRvcENvbG9yIiwiYm90dG9tQ29sb3IiLCJmaWxsQ29sb3IiLCJyb3VuZFJlY3QiLCJmaWxsIiwiaW5uZXJHbG93IiwiZ2xvd1Nwcml0ZSIsIlNMSUNFRCIsIm92ZXJsYXkiLCJvdmVybGF5U3ByaXRlIiwiYm9yZGVyQ29sb3IiLCJnbG93Q29sb3IiLCJzdHJva2VDb2xvciIsImxpbmVXaWR0aCIsInN0cm9rZSIsImNvcm5lclNpemUiLCJjb3JuZXJzIiwicm90IiwiY29ybmVyIiwiZGVjb3JOb2RlIiwiZGciLCJtb3ZlVG8iLCJsaW5lVG8iLCJhbmdsZSIsImJhbm5lcldpZHRoIiwiYmFubmVySGVpZ2h0IiwidGl0bGVOb2RlIiwiYW5jaG9yWCIsImFuY2hvclkiLCJ0aXRsZUxhYmVsIiwiZm9udEZhbWlseSIsImhvcml6b250YWxBbGlnbiIsIkhvcml6b250YWxBbGlnbiIsIkNFTlRFUiIsInZlcnRpY2FsQWxpZ24iLCJWZXJ0aWNhbEFsaWduIiwic2hhZG93IiwiTGFiZWxTaGFkb3ciLCJvZmZzZXQiLCJibHVyIiwiY2FyZFdpZHRoIiwiY2FyZEhlaWdodCIsImxpbmVOb2RlIiwibGciLCJtdWx0aURldGFpbCIsIm11bHRpX2RldGFpbCIsImRldGFpbHMiLCJiYXNlX3Njb3JlIiwicWlhbmdfY291bnQiLCJxaWFuZ19tdWx0aSIsImJvbWJfY291bnQiLCJib21iX211bHRpIiwicm9ja2V0X2NvdW50Iiwicm9ja2V0X211bHRpIiwic3ByaW5nX3R5cGUiLCJpdGVtWSIsIml0ZW1IZWlnaHQiLCJpdGVtIiwiaXRlbU5vZGUiLCJ2YWx1ZU5vZGUiLCJ2YWx1ZUxhYmVsIiwidG90YWxNdWx0aU5vZGUiLCJ0b3RhbE11bHRpQmciLCJ0bWciLCJ0b3RhbExhYmVsIiwidHRsIiwibXVsdGlWYWx1ZU5vZGUiLCJtdmwiLCJtdWx0aXBsZSIsIm12byIsImxpc3ROb2RlIiwibGlzdEhlaWdodCIsImhlYWRlck5vZGUiLCJoZWFkZXJzIiwiaGVhZGVyWCIsImhOb2RlIiwiaExhYmVsIiwic2VwTm9kZSIsInNnIiwiaXRlbVN0YXJ0WSIsImlzQ3VycmVudFBsYXllciIsIl9jcmVhdGVQbGF5ZXJSZXN1bHRJdGVtIiwiaGlnaGxpZ2h0IiwiaGciLCJhdmF0YXJOb2RlIiwiYXZhdGFyQmciLCJhZyIsInJvbGUiLCJjaXJjbGUiLCJhdmF0YXJJbmRleCIsImF2YXRhclBhdGgiLCJhdmF0YXJTcHJpdGUiLCJzcCIsInJvbGVJY29uTm9kZSIsInJvbGVMYWJlbCIsIm5hbWVOb2RlIiwibmFtZUxhYmVsIiwicGxheWVyX25hbWUiLCJyb2xlTm9kZSIsInJvbGVUZXh0Iiwid2luR29sZCIsIndpbk5vZGUiLCJ3aW5MYWJlbCIsIndpbk91dGxpbmUiLCJhcmVhTm9kZSIsImNvbnRpbnVlQnRuIiwiX2NyZWF0ZVN0eWxlZEJ1dHRvbiIsIlRPVUNIX0VORCIsImxvYmJ5QnRuIiwidGV4dCIsImlzUHJpbWFyeSIsImJ0bk5vZGUiLCJidG5XaWR0aCIsImJ0bkhlaWdodCIsIm92ZXJmbG93IiwiT3ZlcmZsb3ciLCJTSFJJTksiLCJUT1VDSF9DQU5DRUwiLCJjb2luIiwiZyIsInRhcmdldFkiLCJkZWxheSIsInBhcmFsbGVsIiwic3RhciIsIl9kcmF3U3RhciIsInBhcnRpY2xlIiwiY3giLCJjeSIsImlubmVyUmFkaXVzIiwicG9pbnRzIiwib3V0ZXJSYWRpdXMiLCJyYWRpdXMiLCJQSSIsImNvcyIsInNpbiIsImNsb3NlIiwiX2ZpbmROb2RlQnlOYW1lIiwidGFyZ2V0TXVsdGkiLCJfYW5pbWF0ZU51bWJlciIsImZyb20iLCJzdGFydFRpbWUiLCJkaWZmIiwidXBkYXRlIiwiZWxhcHNlZCIsInByb2dyZXNzIiwiZWFzZVByb2dyZXNzIiwicG93IiwiY3VycmVudCIsImZvdW5kIiwicGxheWVyR29sZCIsInJvb21Db25maWciLCJjdXJyZW50Um9vbUNvbmZpZyIsIm1pbkdvbGQiLCJtaW5fZ29sZCIsIl9zaG93SW5zdWZmaWNpZW50R29sZFBvcHVwIiwiX2RvQ29udGludWVHYW1lIiwiX3Jlc2V0R2FtZVN0YXRlIiwicmVxdWVzdFJlYWR5IiwiY3VycmVudEdvbGQiLCJyZXF1aXJlZEdvbGQiLCJkaXJlY3RvciIsImdldFNjZW5lIiwiY29udGVudE5vZGUiLCJjb250ZW50TGFiZWwiLCJfZm9ybWF0R29sZCIsIlJFU0laRV9IRUlHSFQiLCJidG5BcmVhTm9kZSIsImFkQnRuIiwiYWRCZyIsImFkTGFiZWxOb2RlIiwiYWRMYWJlbCIsImxvYmJ5QmciLCJsb2JieUxhYmVsTm9kZSIsImxvYmJ5TGFiZWwiLCJfaW5zdWZmaWNpZW50R29sZFBvcHVwIiwiX2luc3VmZmljaWVudEdvbGRNYXNrIiwiX3dhdGNoQWRGb3JHb2xkIiwic3VjY2VzcyIsIl9jbG9zZUluc3VmZmljaWVudEdvbGRQb3B1cCIsInR0Iiwic2hvd1Jld2FyZGVkVmlkZW9BZCIsIl9yZXdhcmRHb2xkQWZ0ZXJBZCIsImZhaWwiLCJfc2hvd01lc3NhZ2UiLCJ3eCIsImNyZWF0ZVJld2FyZGVkVmlkZW9BZCIsInJld2FyZGVkVmlkZW9BZCIsImFkVW5pdElkIiwib25DbG9zZSIsInJlcyIsImlzRW5kZWQiLCJvbkVycm9yIiwic2hvdyIsInRoZW4iLCJfcmV3YXJkR29sZEFmdGVyR29sZCIsInJld2FyZEFtb3VudCIsInVwZGF0ZUdvbGQiLCJzZW5kQWRSZXdhcmQiLCJnb2xkIiwidG9GaXhlZCIsInRvU3RyaW5nIiwibGVhdmVSb29tIiwibG9hZFNjZW5lIiwiX2NsZWFyQm90dG9tQ2FyZHMiLCJwbGF5ZXJzX3NlYXRfcG9zIiwic2VhdE5vZGUiLCJvdXRab25lTmFtZSIsIm91dFpvbmUiLCJwbGF5ZXJOb2RlTGlzdCIsInBsYXllck5vZGUiLCJwbGF5ZXJTY3JpcHQiLCJyZWFkeWltYWdlIiwiZ2xvYmFsY291bnRfbGFiZWwiLCJfdXBkYXRlUGxheWVyTWF0Y2hDb2luRGlzcGxheSIsIm1hdGNoQ29pbiIsImlzX2ZpbmFsX3JvdW5kIiwibXlNYXRjaENvaW4iLCJtYXRjaF9jb2luIiwiYmciLCJyZXN1bHROb2RlIiwicmVzdWx0TGFiZWwiLCJtdWx0aU5vZGUiLCJtdWx0aUxhYmVsIiwiY29pbk5vZGUiLCJjb2luTGFiZWwiLCJpbml0aWFsQ291bnRkb3duIiwiYXJlbmFfY291bnRkb3duIiwiY291bnRkb3duQ29udGFpbmVyIiwiY291bnRkb3duTGFiZWwiLCJjb3VudGRvd25MYWJlbENvbXAiLCJjb3VudGRvd25OdW1iZXIiLCJjb3VudGRvd25OdW1iZXJDb21wIiwiQkxBQ0siLCJfY291bnRkb3duTGFiZWxOb2RlIiwiX2NvdW50ZG93bk51bWJlck5vZGUiLCJfYXJlbmFDb3VudGRvd25TZWNvbmRzIiwiX3N0YXJ0TG9jYWxBcmVuYUNvdW50ZG93biIsIl9zZXR1cEFyZW5hQ291bnRkb3duTGlzdGVuZXJzIiwic2Vjb25kcyIsIl91cGRhdGVBcmVuYUNvdW50ZG93blVJIiwibWFjcm8iLCJSRVBFQVRfRk9SRVZFUiIsIl9zaG93V2FpdGluZ0ZvclNlcnZlciIsIm9uQXJlbmFSb3VuZENvdW50ZG93biIsIm9uQXJlbmFDb3VudGRvd25UaWNrIiwib25BcmVuYUF1dG9SZWFkeSIsIl9zaG93QXJlbmFBdXRvUmVhZHlNZXNzYWdlIiwib25BcmVuYVJlY29ubmVjdFN0YXRlIiwiY291bnRkb3duIiwibnVtTGFiZWwiLCJ0b3RhbF9yb3VuZHMiLCJfc2hvd01hdGNoQ29pbkRpc3BsYXkiLCJfdXBkYXRlQ29tcGV0aXRpb25Db3VudGRvd25EaXNwbGF5IiwiX3VwZGF0ZU1hdGNoQ29pbkRpc3BsYXkiLCJkZWx0YSIsIl9tYXRjaENvaW5Ob2RlIiwibWF0Y2hDb2luTm9kZSIsImljb25Ob2RlIiwiaWNvbkxhYmVsIiwiX3Nob3dNYXRjaENvaW5EZWx0YUFuaW1hdGlvbiIsImRlbHRhTm9kZSIsImRlbHRhTGFiZWwiLCJfc2hvd0VsaW1pbmF0ZWRQb3B1cCIsInJhbmtOb2RlIiwicmFua0xhYmVsIiwicmVhc29uTm9kZSIsInJlYXNvbkxhYmVsIiwicmVhc29uIiwidG90YWxOb2RlIiwidG90YWxfcGxheWVycyIsInJld2FyZHMiLCJyZXdhcmROb2RlIiwicmV3YXJkTGFiZWwiLCJidG5CZyIsImJ0bkxhYmVsTm9kZSIsImJ0bkxhYmVsIiwiX2VsaW1pbmF0ZWRQb3B1cCIsIl9lbGltaW5hdGVkTWFzayIsImN1cnJlbnRfcm91bmQiLCJfc2hvd0FkdmFuY2VUb2FzdCIsInRvYXN0Tm9kZSIsIl9zaG93Q2hhbXBpb25Qb3B1cCIsImVuYWJsZUJvbGQiLCJyYW5raW5ncyIsInRvcFRocmVlWSIsIl9jcmVhdGVSYW5raW5nSXRlbSIsIm90aGVyVGl0bGVOb2RlIiwib3RoZXJUaXRsZUxhYmVsIiwic3RhcnRZIiwibWF4T3RoZXJSYW5raW5ncyIsInJhbmtJbmZvIiwicmFua0l0ZW1Ob2RlIiwicmFua0l0ZW1MYWJlbCIsImNvbmZpcm1CZyIsImNvbmZpcm1MYWJlbE5vZGUiLCJjb25maXJtTGFiZWwiLCJfY3JlYXRlQ2hhbXBpb25QYXJ0aWNsZXMiLCJfY2hhbXBpb25Qb3B1cCIsIl9jaGFtcGlvbk1hc2siLCJiZ0NvbG9yIiwicmFua0xhYmVsTm9kZSIsInJhbmtUZXh0IiwibmFtZUxhYmVsTm9kZSIsImNvaW5MYWJlbE5vZGUiLCJwYXJlbnROb2RlIiwicGFydGljbGVMYWJlbCIsIl9zaG93VG91cm5hbWVudEZpbmFsUmFua0RpYWxvZyIsInRpdGxlQmdOb2RlIiwidGl0bGVCZyIsInRvcDMiLCJwb2RpdW1ZIiwicG9kaXVtU3BhY2luZyIsIl9jcmVhdGVQb2RpdW1FbnRyeSIsInRvcDIwIiwibGlzdFRpdGxlTm9kZSIsImxpc3RUaXRsZUxhYmVsIiwic2Nyb2xsVmlld05vZGUiLCJtYXNrIiwiTWFzayIsIlJFQ1QiLCJ0b3AzUGxheWVySURzIiwiZmlsdGVyZWRUb3AyMCIsInJhbmtEYXRhIiwiYWN0dWFsUmFuayIsIl9jcmVhdGVSYW5rTGlzdEl0ZW0iLCJfYWRkU2Nyb2xsVmlld1RvdWNoIiwic2VwIiwibXlSYW5rQmdOb2RlIiwibXlSYW5rQmciLCJteVJhbmtOb2RlIiwibXlSYW5rTGFiZWwiLCJteV9yYW5rIiwibXlfbWF0Y2hfY29pbiIsImJ0bkxhYmVsQ29tcCIsIl9sb2FkQXZhdGFyU3ByaXRlIiwiYXZhdGFyIiwiaXNfcm9ib3QiLCJwbGF5ZXJOYW1lIiwiX2dldFJvYm90RGlzcGxheU5hbWUiLCJMRUZUIiwiQ0xBTVAiLCJSSUdIVCIsInZpZXdIZWlnaHQiLCJ0b3VjaFN0YXJ0WSIsImNvbnRlbnRTdGFydFkiLCJtYXhPZmZzZXQiLCJnZXRMb2NhdGlvblkiLCJUT1VDSF9NT1ZFIiwidG91Y2hZIiwiZGVsdGFZIiwibmV3WSIsIm1pblkiLCJtYXhZIiwiZW50cnlOb2RlIiwibWVkYWxOb2RlIiwibWVkYWwiLCJtZWRhbENvbG9yIiwicmFua051bU5vZGUiLCJyYW5rTnVtTGFiZWwiLCJhdmF0YXJGcmFtZU5vZGUiLCJhdmF0YXJGcmFtZSIsIm9yaWdpbmFsTmFtZSIsInJvYm90SW5kZXgiLCJsYXN0Q2hhciIsInNwcml0ZSIsImF2YXRhclVybCIsImlzUm9ib3QiLCJyb2JvdEF2YXRhckluZGV4IiwiZGVmYXVsdFBhdGgiLCJhc3NldE1hbmFnZXIiLCJsb2FkUmVtb3RlIiwiZXh0IiwidGV4dHVyZSIsImZhbGxiYWNrU3ByaXRlIiwiZSIsImxvY2FsUGF0aCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBSUEsWUFBWSxHQUFHQyxNQUFNLENBQUNELFlBQVksSUFBSSxDQUFDO0FBQzNDLElBQUlFLFVBQVUsR0FBR0QsTUFBTSxDQUFDQyxVQUFVLElBQUk7RUFBRUMsT0FBTyxFQUFFLENBQUM7RUFBRUMsSUFBSSxFQUFFO0FBQUUsQ0FBQztBQUM3RCxJQUFJQyxVQUFVLEdBQUdKLE1BQU0sQ0FBQ0ksVUFBVSxJQUFJLENBQUMsQ0FBQztBQUN4QyxJQUFJQyxTQUFTLEdBQUdMLE1BQU0sQ0FBQ0ssU0FBUyxJQUFJLENBQUMsQ0FBQzs7QUFFdEM7QUFDQSxJQUFJQyxXQUFXLEdBQUcsQ0FBQyxDQUFDOztBQUVwQjtBQUNBLElBQUlDLFVBQVUsR0FBRztFQUNiQyxTQUFTLEVBQUUsR0FBRztFQUNkQyxLQUFLLEVBQUUsQ0FBQyxHQUFHO0VBQ1hDLFdBQVcsRUFBRSxFQUFFO0VBQ2ZDLGVBQWUsRUFBRSxHQUFHO0VBQ3BCQyxpQkFBaUIsRUFBRSxFQUFFO0VBQ3JCQyxZQUFZLEVBQUUsR0FBRztFQUNqQkMsY0FBYyxFQUFFO0FBQ3BCLENBQUM7O0FBRUQ7QUFDQSxJQUFJQyxVQUFVLEdBQUc7RUFDYkMsWUFBWSxFQUFFLElBQUk7RUFDbEJDLFlBQVksRUFBRUMsRUFBRSxDQUFDQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQztFQUMzQkMsWUFBWSxFQUFFO0FBQ2xCLENBQUM7O0FBRUQ7QUFDQSxTQUFTQyxTQUFTQSxDQUFD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RUFBRSxDQUFDTyxTQUFTLENBQUNDLElBQUksQ0FBQyx1QkFBdUIsRUFBRVIsRUFBRSxDQUFDK2UsV0FBVyxFQUFFLFVBQVN0TCxJQUFJLEVBQUUra0IsY0FBYyxFQUFFO1lBQ3RGLElBQUksQ0FBQy9rQixJQUFJLElBQUkra0IsY0FBYyxJQUFJVCxNQUFNLENBQUM5YixPQUFPLEVBQUU7Y0FDM0M4YixNQUFNLENBQUNqWixXQUFXLEdBQUcwWixjQUFjO1lBQ3ZDO1VBQ0osQ0FBQyxDQUFDO1FBQ047TUFDSixDQUFDLENBQUM7SUFDTixDQUFDLE1BQU07TUFDSDtNQUNBLElBQUlFLFNBQVMsR0FBRyxlQUFlLEdBQUdWLFNBQVM7TUFDM0NoNEIsRUFBRSxDQUFDTyxTQUFTLENBQUNDLElBQUksQ0FBQ2s0QixTQUFTLEVBQUUxNEIsRUFBRSxDQUFDK2UsV0FBVyxFQUFFLFVBQVNyZSxHQUFHLEVBQUVvZSxXQUFXLEVBQUU7UUFDcEUsSUFBSXBlLEdBQUcsSUFBSSxDQUFDb2UsV0FBVyxFQUFFO1VBQ3JCO1VBQ0E5ZSxFQUFFLENBQUNPLFNBQVMsQ0FBQ0MsSUFBSSxDQUFDLHVCQUF1QixFQUFFUixFQUFFLENBQUMrZSxXQUFXLEVBQUUsVUFBU3RMLElBQUksRUFBRStrQixjQUFjLEVBQUU7WUFDdEYsSUFBSSxDQUFDL2tCLElBQUksSUFBSStrQixjQUFjLElBQUlULE1BQU0sQ0FBQzliLE9BQU8sRUFBRTtjQUMzQzhiLE1BQU0sQ0FBQ2paLFdBQVcsR0FBRzBaLGNBQWM7WUFDdkM7VUFDSixDQUFDLENBQUM7VUFDRjtRQUNKO1FBQ0EsSUFBSVQsTUFBTSxDQUFDOWIsT0FBTyxFQUFFO1VBQ2hCOGIsTUFBTSxDQUFDalosV0FBVyxHQUFHQSxXQUFXO1FBQ3BDO01BQ0osQ0FBQyxDQUFDO0lBQ047RUFDSjtBQUNKLENBQUMsQ0FBQyIsInNvdXJjZVJvb3QiOiIvIiwic291cmNlc0NvbnRlbnQiOlsiLy8g5L2/55So5YWo5bGA5Y+Y6YeP77yM5LiN5L2/55SoIHJlcXVpcmVcbi8vIOOAkOW9u+W6leS/ruWkjeeJiOacrOOAkeacjeWKoeerr+aVsOaNruS4uuWUr+S4gOaVsOaNrua6kFxuLy8gXG4vLyDmoLjlv4Pljp/liJnvvJpcbi8vIDEuIGhhbmRDYXJkcyDmmK/llK/kuIDmlbDmja7mupDvvIzkv53lrZjmnI3liqHnq6/ljp/lp4vmlbDmja5cbi8vIDIuIOemgeatouS7u+S9leaVsOaNrui9rOaNouOAgeaOkuW6j+OAgemHjeaWsOiuoeeul1xuLy8gMy4gcmVuZGVyQ2FyZHMoKSDmmK/llK/kuIDmuLLmn5PlhaXlj6Ncbi8vIDQuIOWKqOeUu+WPquaYr+inhuinieaViOaenO+8jOe7neS4jeiDveS/ruaUueaVsOaNrlxuLy8gNS4gY2xlYXJBbGxDYXJkcygpIOa4heeQhuaJgOacieaXp+iKgueCue+8iOino+WGs+iDjOmdoueJjOaui+eVme+8iVxuXG52YXIgaXNvcGVuX3NvdW5kID0gd2luZG93Lmlzb3Blbl9zb3VuZCB8fCAxXG52YXIgcWlhbl9zdGF0ZSA9IHdpbmRvdy5xaWFuX3N0YXRlIHx8IHsgYnVxaWFuZzogMCwgcWlhbjogMSB9XG52YXIgQ2FyZHNWYWx1ZSA9IHdpbmRvdy5DYXJkc1ZhbHVlIHx8IHt9XG52YXIgUm9vbVN0YXRlID0gd2luZG93LlJvb21TdGF0ZSB8fCB7fVxuXG4vLyDpn7PmlYjnvJPlrZhcbnZhciBfYXVkaW9DbGlwcyA9IHt9XG5cbi8vIOeJjOW4g+WxgOmFjee9rlxudmFyIENhcmRMYXlvdXQgPSB7XG4gICAgY2FyZFNjYWxlOiAwLjgsXG4gICAgY2FyZFk6IC0yNTAsXG4gICAgY2FyZFNwYWNpbmc6IDM1LFxuICAgIGJvdHRvbUNhcmRTY2FsZTogMC40LFxuICAgIGJvdHRvbUNhcmRTcGFjaW5nOiAyNSxcbiAgICBvdXRDYXJkU2NhbGU6IDAuNSxcbiAgICBvdXRDYXJkU3BhY2luZzogMjUsXG59XG5cbi8vIOWPkeeJjOWKqOeUu+mFjee9rlxudmFyIERlYWxDb25maWcgPSB7XG4gICAgYW5pbUR1cmF0aW9uOiAwLjEyLFxuICAgIGRlY2tQb3NpdGlvbjogY2MudjIoMCwgMTAwKSxcbiAgICBjYXJkSW50ZXJ2YWw6IDgwLFxufVxuXG4vLyDliqDovb3lubbmkq3mlL7pn7PmlYhcbmZ1bmN0aW9uIHBsYXlTb3VuZChwYXRoKSB7XG4gICAgaWYgKCFpc29wZW5fc291bmQpIHJldHVybiBudWxsXG4gICAgaWYgKF9hdWRpb0NsaXBzW3BhdGhdKSB7XG4gICAgICAgIHJldHVybiBjYy5hdWRpb0VuZ2luZS5wbGF5KF9hdWRpb0NsaXBzW3BhdGhdLCBmYWxzZSwgMSlcbiAgICB9XG4gICAgY2MucmVzb3VyY2VzLmxvYWQocGF0aCwgY2MuQXVkaW9DbGlwLCBmdW5jdGlvbihlcnIsIGNsaXApIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgX2F1ZGlvQ2xpcHNbcGF0aF0gPSBjbGlwXG4gICAgICAgIGNjLmF1ZGlvRW5naW5lLnBsYXkoY2xpcCwgZmFsc2UsIDEpXG4gICAgfSlcbiAgICByZXR1cm4gbnVsbFxufVxuXG5jYy5DbGFzcyh7XG4gICAgZXh0ZW5kczogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBnYW1laW5nVUk6IGNjLk5vZGUsXG4gICAgICAgIGNhcmRfcHJlZmFiOiBjYy5QcmVmYWIsXG4gICAgICAgIHJvYlVJOiBjYy5Ob2RlLFxuICAgICAgICBib3R0b21fY2FyZF9wb3Nfbm9kZTogY2MuTm9kZSxcbiAgICAgICAgcGxheWluZ1VJX25vZGU6IGNjLk5vZGUsXG4gICAgICAgIHRpcHNMYWJlbDogY2MuTGFiZWwsXG4gICAgICAgIGNhcmRzX25vZGU6IGNjLk5vZGUsICAvLyDmiYvniYzoioLngrnlrrnlmahcbiAgICAgICAgLy8g8J+VkOOAkOaWsOWinuOAkeWAkuiuoeaXtkxhYmVs5byV55SoXG4gICAgICAgIGJpZENvdW50ZG93bkxhYmVsOiBjYy5MYWJlbCwgICAgLy8g5oqi5Zyw5Li75YCS6K6h5pe2XG4gICAgICAgIHBsYXlDb3VudGRvd25MYWJlbDogY2MuTGFiZWwsICAgLy8g5Ye654mM5YCS6K6h5pe2XG4gICAgICAgIC8vIPCflIrjgJDmlrDlop7jgJHmu7TnrZTpn7PmlYjvvIgz56eS5YKs5L+D6Z+z5pWI77yJXG4gICAgICAgIHRpY2tBdWRpbzoge1xuICAgICAgICAgICAgZGVmYXVsdDogbnVsbCxcbiAgICAgICAgICAgIHR5cGU6IGNjLkF1ZGlvQ2xpcFxuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICBvbkxvYWQgKCkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIm15Z2xvYmFsIOacquWumuS5iVwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR56Gu5L+d5omL54mM5a655Zmo6IqC54K55a2Y5ZyoXG4gICAgICAgIGlmICghdGhpcy5jYXJkc19ub2RlKSB7XG4gICAgICAgICAgICAvLyDmn6Xmib7mmK/lkKblt7LlrZjlnKjmiYvniYzlrrnlmajoioLngrlcbiAgICAgICAgICAgIHZhciBnYW1lU2NlbmVOb2RlID0gdGhpcy5ub2RlLnBhcmVudFxuICAgICAgICAgICAgaWYgKGdhbWVTY2VuZU5vZGUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdhbWVTY2VuZU5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gZ2FtZVNjZW5lTm9kZS5jaGlsZHJlbltpXVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQubmFtZSA9PT0gXCJjYXJkc19ub2RlXCIgfHwgY2hpbGQubmFtZSA9PT0gXCJjYXJkc1wiIHx8IGNoaWxkLm5hbWUgPT09IFwiaGFuZENhcmRzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FyZHNfbm9kZSA9IGNoaWxkXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIOWmguaenOayoeaJvuWIsO+8jOWIm+W7uuS4gOS4quaWsOeahOWuueWZqOiKgueCuVxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5jYXJkc19ub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdDYXJkc05vZGUgPSBuZXcgY2MuTm9kZShcImNhcmRzX25vZGVcIilcbiAgICAgICAgICAgICAgICAgICAgbmV3Q2FyZHNOb2RlLnBhcmVudCA9IGdhbWVTY2VuZU5vZGVcbiAgICAgICAgICAgICAgICAgICAgbmV3Q2FyZHNOb2RlLnNldFBvc2l0aW9uKDAsIDApXG4gICAgICAgICAgICAgICAgICAgIG5ld0NhcmRzTm9kZS5zZXRBbmNob3JQb2ludCgwLjUsIDAuNSlcbiAgICAgICAgICAgICAgICAgICAgbmV3Q2FyZHNOb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoODAwLCAyMDApKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhcmRzX25vZGUgPSBuZXdDYXJkc05vZGVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgLy8g44CQ5qC45b+D44CR5ZSv5LiA5pWw5o2u5rqQIC0g5pyN5Yqh56uv5Y6f5aeL5omL54mM5pWw5o2uXG4gICAgICAgIC8vIOOAkOmHjeimgeOAkeemgeatouS7u+S9leS/ruaUueOAgeaOkuW6j+OAgei9rOaNolxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdGhpcy5oYW5kQ2FyZHMgPSBbXSAgICAgICAgICAgLy8g44CQ5ZSv5LiA5pWw5o2u5rqQ44CR5pyN5Yqh56uv5Y6f5aeL5omL54mMXG4gICAgICAgIHRoaXMuYm90dG9tQ2FyZHMgPSBbXSAgICAgICAgIC8vIOW6leeJjOaVsOaNrlxuICAgICAgICB0aGlzLmNob29zZV9jYXJkX2RhdGEgPSBbXSAgICAvLyDpgInkuK3nmoTniYxcbiAgICAgICAgXG4gICAgICAgIC8vIOaKouWcsOS4u+ebuOWFs1xuICAgICAgICB0aGlzLnJvYl9wbGF5ZXJfYWNjb3VudGlkID0gMFxuICAgICAgICB0aGlzLl9iaWRkaW5nUGhhc2UgPSBcImlkbGVcIlxuICAgICAgICB0aGlzLl9nYW1lUGhhc2UgPSBcImlkbGVcIiAgLy8g8J+Up+OAkOaWsOWinuOAkea4uOaIj+mYtuautTogaWRsZSwgYmlkZGluZywgcGxheWluZ1xuICAgICAgICB0aGlzLmNhcmRzUmVhZHkgPSBmYWxzZVxuICAgICAgICBcbiAgICAgICAgLy8g8J+VkOOAkOWAkuiuoeaXtuezu+e7n+OAkVxuICAgICAgICB0aGlzLl9iaWRUaW1lb3V0ID0gMFxuICAgICAgICB0aGlzLl9wbGF5VGltZW91dCA9IDBcbiAgICAgICAgdGhpcy5fYmlkQ291bnRkb3duVGltZXIgPSBudWxsXG4gICAgICAgIHRoaXMuX3BsYXlDb3VudGRvd25UaW1lciA9IG51bGxcbiAgICAgICAgdGhpcy5fYmlkVGltZUxlZnQgPSAwXG4gICAgICAgIHRoaXMuX3BsYXlUaW1lTGVmdCA9IDBcbiAgICAgICAgdGhpcy5faXNCaWRDb3VudGRvd25UaWNraW5nID0gZmFsc2VcbiAgICAgICAgdGhpcy5faXNQbGF5Q291bnRkb3duVGlja2luZyA9IGZhbHNlXG4gICAgICAgIHRoaXMuX2lzQmlkV2FybmluZyA9IGZhbHNlXG4gICAgICAgIHRoaXMuX2lzUGxheVdhcm5pbmcgPSBmYWxzZVxuICAgICAgICB0aGlzLl9iaWRFeHBpcmVzQXQgPSAwICAvLyDwn5Sn44CQ5paw5aKe44CR5pyN5Yqh56uv6L+H5pyf5pe26Ze05oiz77yI5q+r56eS77yJXG4gICAgICAgIFxuICAgICAgICAvLyDlupXniYzoioLngrlcbiAgICAgICAgdGhpcy5ib3R0b21fY2FyZCA9IFtdXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgLy8g44CQ56ue5oqA5Zy644CR54q25oCB5Y+Y6YePXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB0aGlzLl9pc0NvbXBldGl0aW9uID0gZmFsc2UgICAgICAgICAgIC8vIOaYr+WQpuaYr+ernuaKgOWcuuaooeW8j1xuICAgICAgICB0aGlzLl9yb29tQ2F0ZWdvcnkgPSAxICAgICAgICAgICAgICAgIC8vIOaIv+mXtOexu+Wei++8mjE95pmu6YCa5Zy677yMMj3nq57mioDlnLpcbiAgICAgICAgdGhpcy5fbWF0Y2hDb2luID0gMCAgICAgICAgICAgICAgICAgICAvLyDmr5TotZvph5HluIFcbiAgICAgICAgdGhpcy5fY29tcGV0aXRpb25Sb3VuZCA9IDAgICAgICAgICAgICAvLyDlvZPliY3ova7mrKFcbiAgICAgICAgdGhpcy5fY29tcGV0aXRpb25Ub3RhbFJvdW5kcyA9IDAgICAgICAvLyDmgLvova7mrKFcbiAgICAgICAgdGhpcy5fY29tcGV0aXRpb25Db3VudGRvd24gPSAwICAgICAgICAvLyDnq57mioDlnLrlgJLorqHml7ZcbiAgICAgICAgdGhpcy5fY29tcGV0aXRpb25Db3VudGRvd25UaW1lciA9IG51bGwgLy8g56ue5oqA5Zy65YCS6K6h5pe25a6a5pe25ZmoXG4gICAgICAgIHRoaXMuX3dhc0Rpc2Nvbm5lY3RlZCA9IGZhbHNlICAgICAgICAgLy8g5piv5ZCm5Zyo5q+U6LWb5Lit5o6J57q/XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT0g5pyN5Yqh5Zmo5raI5oGv55uR5ZCsID09PT09PT09PT09PVxuICAgICAgICBcbiAgICAgICAgLy8g44CQ5qC45b+D44CR55uR5ZCs5pyN5Yqh5Zmo5Y+R54mM5raI5oGvIC0g5ZSv5LiA5pWw5o2u5YWl5Y+jXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vblB1c2hDYXJkcyhmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyA9PT09PT09PT09IOacjeWKoeerr+WPkeeJjOa2iOaBryA9PT09PT09PT09XCIpXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfg48g5pyN5Yqh56uv5Y6f5aeL5omL54mMOlwiLCBKU09OLnN0cmluZ2lmeShkYXRhLmNhcmRzKSlcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyDmnI3liqHnq6/ljp/lp4vlupXniYw6XCIsIEpTT04uc3RyaW5naWZ5KGRhdGEuYm90dG9tX2NhcmRzKSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeaWsOS4gOi9ruWPkeeJjOaXtu+8jOWFs+mXreS4iuS4gOi9rueahOe7k+eul+W8ueeql1xuICAgICAgICAgICAgaWYgKHRoaXMuX2dhbWVSZXN1bHRQb3B1cCB8fCB0aGlzLl9nYW1lUmVzdWx0TWFzaykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyBbb25QdXNoQ2FyZHNdIOWFs+mXreS4iuS4gOi9rueahOe7k+eul+W8ueeql1wiKVxuICAgICAgICAgICAgICAgIHRoaXMuX2Nsb3NlR2FtZVJlc3VsdFBvcHVwKHRoaXMuX2dhbWVSZXN1bHRQb3B1cCwgdGhpcy5fZ2FtZVJlc3VsdE1hc2spXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlgZzmraLmiYDmnInnq57mioDlnLrlgJLorqHml7ZcbiAgICAgICAgICAgIHRoaXMuX3N0b3BBcmVuYUNvdW50ZG93bigpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHmuIXnkIbmoYzpnaLkuIrnmoTniYzvvIjkuIrkuIDova7mnIDlkI7kuIDmiYvniYzvvIlcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyBbb25QdXNoQ2FyZHNdIOa4heeQhuahjOmdouS4iueahOeJjFwiKVxuICAgICAgICAgICAgdGhpcy5fY2xlYXJBbGxPdXRDYXJkWm9uZXMoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDjgJDmoLjlv4PjgJHnm7TmjqXkv53lrZjmnI3liqHnq6/mlbDmja7vvIzkuI3lgZrku7vkvZXovazmjaJcbiAgICAgICAgICAgIHRoaXMuaGFuZENhcmRzID0gZGF0YS5jYXJkcyB8fCBbXVxuICAgICAgICAgICAgdGhpcy5ib3R0b21DYXJkcyA9IGRhdGEuYm90dG9tX2NhcmRzIHx8IFtdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOOAkOaguOW/g+OAkeWUr+S4gOa4suafk+WFpeWPo1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJDYXJkcyh0aGlzLmhhbmRDYXJkcylcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIOebkeWQrOWPq+WcsOS4u+i9ruasoe+8iOaXp+eJiOa2iOaBr++8jOS7heeUqOS6juWFvOWuue+8iVxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25CaWRUdXJuKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgLy8g5LiN5YaN5aSE55CG77yM6YG/5YWN6YeN5aSNXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDnm5HlkKzlj6vlnLDkuLvnu5PmnpxcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQmlkUmVzdWx0KGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgLy8g8J+UkuOAkOmHjeimgeOAkeaUtuWIsOe7k+aenO+8jOWBnOatouWAkuiuoeaXtlxuICAgICAgICAgICAgdGhpcy5fc3RvcEJpZENvdW50ZG93bigpXG4gICAgICAgICAgICBpZiAodGhpcy5ub2RlICYmIHRoaXMubm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5vZGUucGFyZW50LmVtaXQoXCJiaWRfcmVzdWx0X2V2ZW50XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyX2lkOiBkYXRhLmFjY291bnRpZCxcbiAgICAgICAgICAgICAgICAgICAgYmlkOiBkYXRhLnN0YXRlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIOebkeWQrOaKouWcsOS4u+i9ruasoe+8iOaXp+eJiOa2iOaBr++8jOS7heeUqOS6juWFvOWuue+8iVxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25DYW5Sb2JTdGF0ZShmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIC8vIOS4jeWGjeWkhOeQhu+8jOmBv+WFjemHjeWkjVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g55uR5ZCs5Ye654mM6L2u5qyhXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkNhbkNodUNhcmQoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICB2YXIgcGxheWVySWQgPSBkYXRhLnBsYXllcl9pZCB8fCBkYXRhXG4gICAgICAgICAgICB2YXIgbXlQbGF5ZXJJZCA9IG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKCkuaWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5zZXJ2ZXJQbGF5ZXJJZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRFxuXG4gICAgICAgICAgICAvLyDwn5SS44CQ6YeN6KaB44CR5YWI5YGc5q2i5LmL5YmN55qE5YCS6K6h5pe277yI5pyN5Yqh5Zmo6L2u6L2s5LqG77yJXG4gICAgICAgICAgICB0aGlzLl9zdG9wUGxheUNvdW50ZG93bigpXG5cbiAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHkv53lrZjlh7rniYznirbmgIHvvIznlKjkuo7mj5DnpLrlip/og71cbiAgICAgICAgICAgIHRoaXMuX211c3RQbGF5ID0gZGF0YS5tdXN0X3BsYXkgfHwgZmFsc2VcbiAgICAgICAgICAgIHRoaXMuX2NhbkJlYXQgPSBkYXRhLmNhbl9iZWF0IHx8IGZhbHNlXG4gICAgICAgICAgICB0aGlzLl9sYXN0UGxheWVkQ2FyZHMgPSBudWxsICAvLyDkuIrlrrblh7rnmoTniYzvvIzpnIDopoHku44gb25PdGhlclBsYXllckNodUNhcmQg6I635Y+WXG5cbiAgICAgICAgICAgIGlmIChTdHJpbmcocGxheWVySWQpID09PSBTdHJpbmcobXlQbGF5ZXJJZCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9oaWRlUm9iVUkoKVxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJPdXRab25lKG15UGxheWVySWQpXG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5aW5nVUlfbm9kZS5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheVRpbWVvdXQgPSBkYXRhLnRpbWVvdXQgfHwgMTVcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGFydFBsYXlDb3VudGRvd24oKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wbGF5aW5nVUlfbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsYXlpbmdVSV9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g55uR5ZCs5YW25LuW546p5a625Ye654mMXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbk90aGVyUGxheWVyQ2h1Q2FyZChmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIC8vIPCflJLjgJDph43opoHjgJHmlLbliLDlh7rniYzmtojmga/vvIzlgZzmraLmiJHnmoTlgJLorqHml7ZcbiAgICAgICAgICAgIHRoaXMuX3N0b3BQbGF5Q291bnRkb3duKClcbiAgICAgICAgICAgIGlmICh0aGlzLnBsYXlpbmdVSV9ub2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5aW5nVUlfbm9kZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5aSE55CG5LiN5Ye655qE5oOF5Ya1XG4gICAgICAgICAgICBpZiAoZGF0YS5pc19wYXNzKSB7XG4gICAgICAgICAgICAgICAgLy8g8J+UiuOAkOaWsOWinuOAkeaSreaUvuS4jeWHuumfs+aViFxuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlQYXNzU291bmQoZGF0YSlcbiAgICAgICAgICAgICAgICAvLyDwn5SK44CQ5paw5aKe44CR5pi+56S65LiN5Ye65pWI5p6cXG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvd1Bhc3NFZmZlY3QoZGF0YS5hY2NvdW50aWQpXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeS4jeWHuuaXtuS4jea4hemZpOS4iuWutuWHuueahOeJjFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5L+d5a2Y5LiK5a625Ye655qE54mM77yM55So5LqO5o+Q56S65Yqf6IO9XG4gICAgICAgICAgICB0aGlzLl9sYXN0UGxheWVkQ2FyZHMgPSBkYXRhLmNhcmRzIHx8IFtdXG4gICAgICAgICAgICB0aGlzLl9sYXN0UGxheWVkSGFuZFR5cGUgPSBkYXRhLmhhbmRfdHlwZSB8fCBcIlwiXG5cbiAgICAgICAgICAgIGlmICghdGhpcy5ub2RlIHx8ICF0aGlzLm5vZGUucGFyZW50KSByZXR1cm5cblxuICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeiOt+WPluW9k+WJjeeOqeWutklE77yM5Yik5pat5piv5ZCm5piv6Ieq5bex5Ye654mMXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu44CR5a6J5YWo6I635Y+W546p5a62SUTvvIzpgb/lhY3miqXplJlcbiAgICAgICAgICAgIHZhciBzb2NrZXRJbmZvID0gbXlnbG9iYWwuc29ja2V0LmdldFBsYXllckluZm8oKSB8fCB7fVxuICAgICAgICAgICAgdmFyIHNlcnZlclBsYXllcklkID0gKG15Z2xvYmFsLnBsYXllckRhdGEgJiYgbXlnbG9iYWwucGxheWVyRGF0YS5zZXJ2ZXJQbGF5ZXJJZCkgfHwgXCJcIlxuICAgICAgICAgICAgdmFyIGFjY291bnRJZCA9IChteWdsb2JhbC5wbGF5ZXJEYXRhICYmIG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEKSB8fCBcIlwiXG4gICAgICAgICAgICB2YXIgbXlQbGF5ZXJJZCA9IHNvY2tldEluZm8uaWQgfHwgc2VydmVyUGxheWVySWQgfHwgYWNjb3VudElkXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7jgJHkvb/nlKjmm7TlronlhajnmoTmr5TovoPmlrnlvI9cbiAgICAgICAgICAgIHZhciBpc1NlbGYgPSBTdHJpbmcoZGF0YS5hY2NvdW50aWQgfHwgXCJcIikgPT09IFN0cmluZyhteVBsYXllcklkIHx8IFwiXCIpXG5cbiAgICAgICAgICAgIC8vIPCflKfjgJDosIPor5XjgJHor6bnu4bmiZPljbBJROavlOi+g+S/oeaBr1xuXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5qC45b+D5L+u5aSN44CR5aaC5p6c5piv6Ieq5bex5Ye654mM77yM5LuO5omL54mM5Lit5Yig6ZmkXG4gICAgICAgICAgICBpZiAoaXNTZWxmKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlQ2FyZHNGcm9tSGFuZChkYXRhLmNhcmRzKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g8J+UiuOAkOaWsOWinuOAkeaSreaUvuWHuueJjOmfs+aViFxuICAgICAgICAgICAgdGhpcy5fcGxheUNhcmRTb3VuZChkYXRhKVxuXG4gICAgICAgICAgICAvLyDmmL7npLrlh7rnmoTniYzliLDmoYzpnaJcbiAgICAgICAgICAgIHZhciBnYW1lU2NlbmVfc2NyaXB0ID0gdGhpcy5ub2RlLnBhcmVudC5nZXRDb21wb25lbnQoXCJnYW1lU2NlbmVcIilcbiAgICAgICAgICAgIGlmICghZ2FtZVNjZW5lX3NjcmlwdCkgcmV0dXJuXG5cbiAgICAgICAgICAgIHZhciBvdXRDYXJkX25vZGUgPSBnYW1lU2NlbmVfc2NyaXB0LmdldFVzZXJPdXRDYXJkUG9zQnlBY2NvdW50KGRhdGEuYWNjb3VudGlkKVxuICAgICAgICAgICAgaWYgKCFvdXRDYXJkX25vZGUgfHwgIXRoaXMuY2FyZF9wcmVmYWIpIHJldHVyblxuXG4gICAgICAgICAgICAvLyDjgJDph43opoHjgJHnm7TmjqXkvb/nlKjmnI3liqHnq6/mlbDmja7liJvlu7roioLngrlcbiAgICAgICAgICAgIHZhciBub2RlX2NhcmRzID0gW11cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5jYXJkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjYXJkID0gY2MuaW5zdGFudGlhdGUodGhpcy5jYXJkX3ByZWZhYilcbiAgICAgICAgICAgICAgICBpZiAoY2FyZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZFNjcmlwdCA9IGNhcmQuZ2V0Q29tcG9uZW50KFwiY2FyZFwiKVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FyZFNjcmlwdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZFNjcmlwdC5zaG93Q2FyZHMoZGF0YS5jYXJkc1tpXSwgbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SUQpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbm9kZV9jYXJkcy5wdXNoKGNhcmQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zaG93T3V0Q2FyZHMob3V0Q2FyZF9ub2RlLCBub2RlX2NhcmRzKVxuXG4gICAgICAgICAgICAvLyDmm7TmlrDliankvZnniYzmlbBcbiAgICAgICAgICAgIGlmIChkYXRhLmNhcmRzX2xlZnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMubm9kZS5wYXJlbnQuZW1pdChcInVwZGF0ZV9jYXJkX2NvdW50X2V2ZW50XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudGlkOiBkYXRhLmFjY291bnRpZCxcbiAgICAgICAgICAgICAgICAgICAgY291bnQ6IGRhdGEuY2FyZHNfbGVmdFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDnm5HlkKzmiqLlnLDkuLvpmLbmrrXlvIDlp4tcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQ2FsbExhbmRsb3JkU3RhcnQoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICB0aGlzLl9iaWRkaW5nUGhhc2UgPSBcImJpZGRpbmdcIlxuICAgICAgICAgICAgdGhpcy5fZ2FtZVBoYXNlID0gXCJiaWRkaW5nXCIgIC8vIPCflKfjgJDmlrDlop7jgJHorr7nva7muLjmiI/pmLbmrrVcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIOebkeWQrOaKouWcsOS4u+i9ruasoVxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25DYWxsTGFuZGxvcmRUdXJuKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc0NhbGxMYW5kbG9yZFR1cm4oZGF0YSlcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIOebkeWQrOaKouWcsOS4u+e7k+aenFxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25DYWxsTGFuZGxvcmRSZXN1bHQoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAvLyDwn5SS44CQ6YeN6KaB44CR5pS25Yiw57uT5p6c77yM5YGc5q2i5YCS6K6h5pe2XG4gICAgICAgICAgICB0aGlzLl9zdG9wQmlkQ291bnRkb3duKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeaSreaUvuaKouWcsOS4u+ivremfs1xuICAgICAgICAgICAgdGhpcy5fcGxheVJvYlNvdW5kKGRhdGEpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh0aGlzLm5vZGUgJiYgdGhpcy5ub2RlLnBhcmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMubm9kZS5wYXJlbnQuZW1pdChcImNhbGxfbGFuZGxvcmRfcmVzdWx0X2V2ZW50XCIsIGRhdGEpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDnm5HlkKzmiqLlnLDkuLvpmLbmrrXnu5PmnZ9cbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQ2FsbExhbmRsb3JkRW5kKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgLy8g8J+UkuOAkOmHjeimgeOAkeWBnOatouaJgOacieWAkuiuoeaXtlxuICAgICAgICAgICAgdGhpcy5fc3RvcEJpZENvdW50ZG93bigpXG4gICAgICAgICAgICB0aGlzLl9oaWRlUm9iVUkoKVxuICAgICAgICAgICAgdGhpcy5fYmlkZGluZ1BoYXNlID0gXCJpZGxlXCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkemHjee9ruaKouWcsOS4u+ebuOWFs+eKtuaAgVxuICAgICAgICAgICAgdGhpcy5yb2JfcGxheWVyX2FjY291bnRpZCA9IDBcbiAgICAgICAgICAgIHRoaXMuY2FyZHNSZWFkeSA9IGZhbHNlICAvLyDph43nva7lj5HniYzlrozmiJDmoIforrBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruOAkeS/neWtmOW6leeJjOaVsOaNrlxuICAgICAgICAgICAgaWYgKGRhdGEuYm90dG9tX2NhcmRzICYmIGRhdGEuYm90dG9tX2NhcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJvdHRvbUNhcmRzID0gZGF0YS5ib3R0b21fY2FyZHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOmHjeimgeOAkeaYvuekuuW6leeJjO+8iOaJgOacieeOqeWutumDveiDveeci+WIsO+8iVxuICAgICAgICAgICAgdGhpcy5fc2hvd0JvdHRvbUNhcmRzVG9BbGwoZGF0YS5ib3R0b21fY2FyZHMpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR55uR5ZCs5Zyw5Li75paw5omL54mM5raI5oGvIC0g5Y+q5pu05paw5Zyw5Li755qE5omL54mM77yM5LiN6Kem5Y+R6YeN5paw5Y+R54mMXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHlv4Xpobvpqozor4Hoh6rlt7HmmK/lkKbmmK/lnLDkuLvvvIzlj6rmnInlnLDkuLvmiY3mm7TmlrDmiYvniYxcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uTGFuZGxvcmRDYXJkcyhmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUrumqjOivgeOAkeajgOafpeiHquW3seaYr+WQpuaYr+WcsOS4u1xuICAgICAgICAgICAgdmFyIG15UGxheWVySWQgPSBteWdsb2JhbC5zb2NrZXQuZ2V0UGxheWVySW5mbygpLmlkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEuc2VydmVyUGxheWVySWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SURcbiAgICAgICAgICAgIHZhciBsYW5kbG9yZElkID0gZGF0YS5sYW5kbG9yZF9pZCB8fCBcIlwiXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruOAkeWPquacieW9k+WcsOS4u0lE5Yy56YWN6Ieq5bex5pe25omN5pu05paw5omL54mMXG4gICAgICAgICAgICBpZiAoU3RyaW5nKGxhbmRsb3JkSWQpICE9PSBTdHJpbmcobXlQbGF5ZXJJZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDjgJDph43opoHjgJHlj6rmm7TmlrDmiYvniYzmlbDmja7vvIzkuI3ph43mlrDmuLLmn5PmlbTkuKrlnLrmma9cbiAgICAgICAgICAgIHRoaXMuaGFuZENhcmRzID0gZGF0YS5jYXJkcyB8fCBbXVxuICAgICAgICAgICAgdGhpcy5ib3R0b21DYXJkcyA9IGRhdGEuYm90dG9tX2NhcmRzIHx8IFtdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOOAkOmHjeimgeOAkeS9v+eUqOmdmem7mOabtOaWsO+8jOS4jeinpuWPkeWPkeeJjOWKqOeUu1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlTGFuZGxvcmRIYW5kQ2FyZHModGhpcy5oYW5kQ2FyZHMpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDnm5HlkKzph43mlrDlj5HniYzpgJrnn6XvvIjmiYDmnInkurrpg73kuI3lj6vlnLDkuLvvvIlcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uUmVzdGFydEdhbWUoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAvLyDlgZzmraLmiYDmnInlgJLorqHml7ZcbiAgICAgICAgICAgIHRoaXMuX3N0b3BCaWRDb3VudGRvd24oKVxuICAgICAgICAgICAgdGhpcy5fc3RvcFBsYXlDb3VudGRvd24oKVxuICAgICAgICAgICAgLy8g6ZqQ6JeP5oqi5Zyw5Li7VUlcbiAgICAgICAgICAgIHRoaXMuX2hpZGVSb2JVSSgpXG4gICAgICAgICAgICAvLyDph43nva7nirbmgIFcbiAgICAgICAgICAgIHRoaXMuX2JpZGRpbmdQaGFzZSA9IFwiaWRsZVwiXG4gICAgICAgICAgICB0aGlzLl9nYW1lUGhhc2UgPSBcImlkbGVcIiAgLy8g8J+Up+OAkOaWsOWinuOAkemHjee9rua4uOaIj+mYtuautVxuICAgICAgICAgICAgdGhpcy5jYXJkc1JlYWR5ID0gZmFsc2VcbiAgICAgICAgICAgIHRoaXMuaGFuZENhcmRzID0gW11cbiAgICAgICAgICAgIHRoaXMuYm90dG9tQ2FyZHMgPSBbXVxuICAgICAgICAgICAgdGhpcy5jaG9vc2VfY2FyZF9kYXRhID0gW11cbiAgICAgICAgICAgIC8vIOa4heeQhuaJgOacieWNoeeJjOiKgueCuVxuICAgICAgICAgICAgdGhpcy5jbGVhckFsbENhcmRzKClcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHnm5HlkKzlh7rniYzpmLbmrrXlvIDlp4tcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uUGxheVN0YXJ0KGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruOAkeiuvue9rua4uOaIj+mYtuauteS4uuWHuueJjOmYtuautVxuICAgICAgICAgICAgdGhpcy5fZ2FtZVBoYXNlID0gXCJwbGF5aW5nXCJcbiAgICAgICAgICAgIHRoaXMuX2JpZGRpbmdQaGFzZSA9IFwiaWRsZVwiXG4gICAgICAgICAgICAvLyDpmpDol4/miqLlnLDkuLtVSe+8iOehruS/neS4jeaYvuekuu+8iVxuICAgICAgICAgICAgdGhpcy5faGlkZVJvYlVJKClcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIPCflIrjgJDmlrDlop7jgJHnm5HlkKzmuLjmiI/nu5PmnZ9cbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uR2FtZU92ZXIoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWBnOatouaJgOacieWAkuiuoeaXtlxuICAgICAgICAgICAgdGhpcy5fc3RvcFBsYXlDb3VudGRvd24oKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR6YeN572u5ri45oiP6Zi25q61XG4gICAgICAgICAgICB0aGlzLl9nYW1lUGhhc2UgPSBcImlkbGVcIlxuICAgICAgICAgICAgdGhpcy5fYmlkZGluZ1BoYXNlID0gXCJpZGxlXCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkea4uOaIj+e7k+adn+aXtueri+WNs+mHjee9ruaJgOacieeOqeWutueahOWHhuWkh+eKtuaAgVxuICAgICAgICAgICAgdGhpcy5fcmVzZXRBbGxQbGF5ZXJSZWFkeVN0YXRlKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeaYvuekuue7k+eul+W8ueeql1xuICAgICAgICAgICAgdGhpcy5fc2hvd0dhbWVSZXN1bHRQb3B1cChkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g55uR5ZCs5ri45oiP54q25oCB5oGi5aSNXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkdhbWVTdGF0ZVJlc3RvcmUoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICB0aGlzLnJlc3RvcmVHYW1lU3RhdGUoZGF0YSlcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHnm5HlkKzmj5DnpLrnu5PmnpxcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uSGludFJlc3VsdChmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIHRoaXMuX29uSGludFJlc3VsdChkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g8J+Up+OAkOaJmOeuoeOAkeebkeWQrOaJmOeuoeeKtuaAgeWPmOWMllxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25UcnVzdGVlU3RhdGVOb3RpZnkoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICB0aGlzLl9vblRydXN0ZWVTdGF0ZU5vdGlmeShkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIOOAkOernuaKgOWcuuOAkea2iOaBr+ebkeWQrFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgXG4gICAgICAgIC8vIOebkeWQrOernuaKgOWcuueKtuaAgeabtOaWsFxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25Db21wZXRpdGlvblN0YXR1cyhmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIHRoaXMuX29uQ29tcGV0aXRpb25TdGF0dXMoZGF0YSlcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICBcbiAgICAgICAgLy8g55uR5ZCs56ue5oqA5Zy65YCS6K6h5pe2XG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkNvbXBldGl0aW9uQ291bnRkb3duKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgdGhpcy5fb25Db21wZXRpdGlvbkNvdW50ZG93bihkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIFxuICAgICAgICAvLyDnm5HlkKzmr5TotZvph5HluIHmm7TmlrBcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uTWF0Y2hDb2luVXBkYXRlKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgdGhpcy5fb25NYXRjaENvaW5VcGRhdGUoZGF0YSlcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICBcbiAgICAgICAgLy8g55uR5ZCs5reY5rGw6YCa55+lXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkNvbXBldGl0aW9uRWxpbWluYXRlZChmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIHRoaXMuX29uQ29tcGV0aXRpb25FbGltaW5hdGVkKGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgXG4gICAgICAgIC8vIOebkeWQrOaZi+e6p+mAmuefpVxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25Db21wZXRpdGlvbkFkdmFuY2UoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICB0aGlzLl9vbkNvbXBldGl0aW9uQWR2YW5jZShkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIFxuICAgICAgICAvLyDnm5HlkKzlhqDlhpvlvLnnqpdcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQ29tcGV0aXRpb25DaGFtcGlvbihmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIHRoaXMuX29uQ29tcGV0aXRpb25DaGFtcGlvbihkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR55uR5ZCs5pyA57uI5qac5Y2V5raI5oGvXG4gICAgICAgIC8vIOW9k+ernuaKgOWcuuaJgOaciei9ruasoee7k+adn+aXtu+8jOacjeWKoeerr+S8muWPkemAgeatpOa2iOaBr1xuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25Ub3VybmFtZW50RmluYWxSYW5rKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+GIFtnYW1laW5nVUldIOaUtuWIsOacgOe7iOamnOWNlTpcIiwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgICAgICAgICB0aGlzLl9vblRvdXJuYW1lbnRGaW5hbFJhbmsoZGF0YSlcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIOWGhemDqOS6i+S7tu+8muaYvuekuuW6leeJjFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5q2k5LqL5Lu25bey5bqf5byD77yM6YC76L6R5bey56e75YiwIG9uQ2FsbExhbmRsb3JkRW5kIOWSjCBvbkxhbmRsb3JkQ2FyZHNcbiAgICAgICAgLy8g5L+d55WZ5q2k55uR5ZCs5Zmo5LuF55So5LqO5YW85a655pen54mI5pys77yM5LiN5YaN6Kem5Y+RIHB1c2hUaHJlZUNhcmRcbiAgICAgICAgdGhpcy5ub2RlLm9uKFwic2hvd19ib3R0b21fY2FyZF9ldmVudFwiLCBmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJFkYXRhIOWPr+iDveaYryB7IGNhcmRzOiBbLi4uXSB9IOWvueixoeaIluaVsOe7hFxuICAgICAgICAgICAgdmFyIGNhcmRzID0gZGF0YVxuICAgICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5jYXJkcykge1xuICAgICAgICAgICAgICAgIGNhcmRzID0gZGF0YS5jYXJkc1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlpoLmnpwgY2FyZHMg5Li656m677yM5LiN5aSE55CGXG4gICAgICAgICAgICBpZiAoIWNhcmRzIHx8IGNhcmRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHkuI3lho3osIPnlKggcHVzaFRocmVlQ2FyZO+8gVxuICAgICAgICAgICAgLy8g5bqV54mM5pi+56S65bey55SxIF9zaG93Qm90dG9tQ2FyZHNUb0FsbCDlpITnkIZcbiAgICAgICAgICAgIC8vIOWcsOS4u+aJi+eJjOabtOaWsOW3sueUsSBvbkxhbmRsb3JkQ2FyZHMg5aSE55CGXG4gICAgICAgICAgICAvLyDliKDpmaTku6XkuIvku6PnoIHvvIzpgb/lhY3ph43lpI3lpITnkIblkozlu7bov5/vvJpcbiAgICAgICAgICAgIC8vIHRoaXMuc2NoZWR1bGVPbmNlKHRoaXMucHVzaFRocmVlQ2FyZCwgMC4yKVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeazqOWGjOebkeWQrOmAieaLqeeJjOa2iOaBr1xuICAgICAgICAvLyBjYXJkLmpzIOaYr+WcqCBnYW1lU2NlbmVfbm9kZSAodGhpcy5ub2RlLnBhcmVudCkg5LiKIGVtaXQg5LqL5Lu2XG4gICAgICAgIC8vIOaJgOS7peW/hemhu+WcqCB0aGlzLm5vZGUucGFyZW50IOS4iuebkeWQrO+8jOiAjOS4jeaYryB0aGlzLm5vZGVcbiAgICAgICAgdmFyIGdhbWVTY2VuZV9ub2RlID0gdGhpcy5ub2RlLnBhcmVudFxuICAgICAgICBpZiAoZ2FtZVNjZW5lX25vZGUpIHtcbiAgICAgICAgICAgIGdhbWVTY2VuZV9ub2RlLm9uKFwiY2hvb3NlX2NhcmRfZXZlbnRcIiwgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgICAgIHRoaXMuY2hvb3NlX2NhcmRfZGF0YS5wdXNoKGV2ZW50KVxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHmm7TmlrDlt7LpgInniYzmlbDmmL7npLpcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVTZWxlY3RlZENvdW50RGlzcGxheSgpXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgICAgIGdhbWVTY2VuZV9ub2RlLm9uKFwidW5jaG9vc2VfY2FyZF9ldmVudFwiLCBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeato+ehruWMuemFjeWNoeeJjOeahOWUr+S4gOagh+ivhuespu+8iHN1aXQgKyByYW5r77yJXG4gICAgICAgICAgICAgICAgLy8gZXZlbnQg546w5Zyo5pivIHtzdWl0LCByYW5rfSDlr7nosaFcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hvb3NlX2NhcmRfZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZGlkID0gdGhpcy5jaG9vc2VfY2FyZF9kYXRhW2ldLmNhcmRpZFxuICAgICAgICAgICAgICAgICAgICAvLyDmo4Dmn6XmmK/lkKbljLnphY3vvIjlhbzlrrnmlrDml6fkuKTnp43moLzlvI/vvIlcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhcmRpZCAmJiBjYXJkaWQuc3VpdCAhPT0gdW5kZWZpbmVkICYmIGNhcmRpZC5yYW5rICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaWsOagvOW8j++8mmNhcmRpZCDmmK/lr7nosaEge3N1aXQsIHJhbmt9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FyZGlkLnN1aXQgPT09IGV2ZW50LnN1aXQgJiYgY2FyZGlkLnJhbmsgPT09IGV2ZW50LnJhbmspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNob29zZV9jYXJkX2RhdGEuc3BsaWNlKGksIDEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjYXJkaWQgPT0gZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaXp+agvOW8j+WFvOWuue+8mmNhcmRpZCDmmK/mlbDlrZdcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hvb3NlX2NhcmRfZGF0YS5zcGxpY2UoaSwgMSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeabtOaWsOW3sumAieeJjOaVsOaYvuekulxuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVNlbGVjdGVkQ291bnREaXNwbGF5KClcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzdGFydCAoKSB7fSxcbiAgICBcbiAgICBvbkRlc3Ryb3kgKCkge1xuICAgICAgICB0aGlzLl9zdG9wUGxheUNvdW50ZG93bigpXG4gICAgICAgIHRoaXMuX3N0b3BCaWRDb3VudGRvd24oKVxuICAgICAgICBcbiAgICAgICAgLy8g44CQ56ue5oqA5Zy644CR5riF55CG56ue5oqA5Zy65YCS6K6h5pe2XG4gICAgICAgIGlmICh0aGlzLl9jb21wZXRpdGlvbkNvdW50ZG93blRpbWVyKSB7XG4gICAgICAgICAgICB0aGlzLnVuc2NoZWR1bGUodGhpcy5fY29tcGV0aXRpb25Db3VudGRvd25UaWNrKVxuICAgICAgICAgICAgdGhpcy5fY29tcGV0aXRpb25Db3VudGRvd25UaW1lciA9IG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkea4heeQhuacrOWcsOernuaKgOWcuuWAkuiuoeaXtlxuICAgICAgICBpZiAodGhpcy5fbG9jYWxBcmVuYUNvdW50ZG93blRpbWVyKSB7XG4gICAgICAgICAgICB0aGlzLnVuc2NoZWR1bGUodGhpcy5fbG9jYWxBcmVuYUNvdW50ZG93blRpY2spXG4gICAgICAgICAgICB0aGlzLl9sb2NhbEFyZW5hQ291bnRkb3duVGltZXIgPSBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOOAkOernuaKgOWcuuOAkea4heeQhuavlOi1m+mHkeW4geaYvuekulxuICAgICAgICB0aGlzLl9oaWRlTWF0Y2hDb2luRGlzcGxheSgpXG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOOAkOaguOW/g+OAkeWUr+S4gOa4suafk+WFpeWPo1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIOOAkOaguOW/g+OAkea4suafk+aJi+eJjCAtIOWUr+S4gOWFpeWPo1xuICAgICAqIEBwYXJhbSB7QXJyYXl9IGNhcmRzIC0g5pyN5Yqh56uv5Y6f5aeL5omL54mM5pWw5o2uXG4gICAgICovXG4gICAgcmVuZGVyQ2FyZHM6IGZ1bmN0aW9uKGNhcmRzKSB7XG4gICAgICAgIGlmICghY2FyZHMgfHwgY2FyZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+UpeOAkOmYsumHjeWkjea4suafk+OAkeajgOafpeaYr+WQpuS4juS4iuasoeebuOWQjFxuICAgICAgICB2YXIgaGFzaCA9IEpTT04uc3RyaW5naWZ5KGNhcmRzKVxuICAgICAgICBpZiAodGhpcy5fbGFzdFJlbmRlckhhc2ggPT09IGhhc2gpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2xhc3RSZW5kZXJIYXNoID0gaGFzaFxuICAgICAgICBcbiAgICAgICAgLy8g44CQ5qC45b+D44CR5L2/55So5paX5Zyw5Li76KeE5YiZ5o6S5bqP77ya5aSn546LID4g5bCP546LID4gMiA+IEEgPiBLID4gUSA+IEogPiAxMCA+IDkgPiA4ID4gNyA+IDYgPiA1ID4gNCA+IDNcbiAgICAgICAgdmFyIHNvcnRlZENhcmRzID0gdGhpcy5fc29ydENhcmRzKGNhcmRzKVxuICAgICAgICBcbiAgICAgICAgLy8g44CQ5qC45b+D44CR5riF55CG5omA5pyJ5pen6IqC54K577yI6Kej5Yaz6IOM6Z2i54mM5q6L55WZ77yJXG4gICAgICAgIHRoaXMuY2xlYXJBbGxDYXJkcygpXG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7rlupXniYzoioLngrlcbiAgICAgICAgdGhpcy5fY3JlYXRlQm90dG9tQ2FyZHMoKVxuICAgICAgICBcbiAgICAgICAgLy8g6ZqQ6JeP5Ye654mMVUlcbiAgICAgICAgaWYgKHRoaXMucGxheWluZ1VJX25vZGUpIHtcbiAgICAgICAgICAgIHRoaXMucGxheWluZ1VJX25vZGUuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+OrOOAkOS/ruWkjeOAkeS9v+eUqOmAkOW8oOWPkeeJjOWKqOeUu1xuICAgICAgICB0aGlzLl9kZWFsQ2FyZHNXaXRoQW5pbWF0aW9uKHNvcnRlZENhcmRzKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+OrOOAkOaWsOWinuOAkemAkOW8oOWPkeeJjOWKqOeUu1xuICAgICAqIEBwYXJhbSB7QXJyYXl9IHNvcnRlZENhcmRzIC0g5bey5o6S5bqP55qE5omL54mM5pWw5o2uXG4gICAgICovXG4gICAgX2RlYWxDYXJkc1dpdGhBbmltYXRpb246IGZ1bmN0aW9uKHNvcnRlZENhcmRzKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgdmFyIGNhcmRJbnRlcnZhbCA9IERlYWxDb25maWcuY2FyZEludGVydmFsIC8gMTAwMCAgLy8g6L2s5o2i5Li656eSXG4gICAgICAgIHZhciBhbmltRHVyYXRpb24gPSBEZWFsQ29uZmlnLmFuaW1EdXJhdGlvblxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeehruS/neaJi+eJjOWuueWZqOWtmOWcqFxuICAgICAgICB2YXIgY2FyZFBhcmVudCA9IHRoaXMuY2FyZHNfbm9kZVxuICAgICAgICBpZiAoIWNhcmRQYXJlbnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn46uIFtfZGVhbENhcmRzV2l0aEFuaW1hdGlvbl0gY2FyZHNfbm9kZSDmnKrlrprkuYlcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlj5HniYzotbflp4vkvY3nva7vvIjlsY/luZXkuK3lpK7kuIrmlrnvvIzmqKHmi5/lj5HniYzloIbvvIlcbiAgICAgICAgdmFyIGRlY2tQb3MgPSBjYy52MihEZWFsQ29uZmlnLmRlY2tQb3NpdGlvbi54LCBEZWFsQ29uZmlnLmRlY2tQb3NpdGlvbi55KVxuICAgICAgICBcbiAgICAgICAgLy8g6YCQ5byg5Y+R54mMXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc29ydGVkQ2FyZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIChmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZERhdGEgPSBzb3J0ZWRDYXJkc1tpbmRleF1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldFggPSBzZWxmLl9nZXRDYXJkWChpbmRleCwgc29ydGVkQ2FyZHMubGVuZ3RoLCBDYXJkTGF5b3V0LmNhcmRTcGFjaW5nKVxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0UG9zID0gY2MudjIodGFyZ2V0WCwgQ2FyZExheW91dC5jYXJkWSlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOWIm+W7uuWNoeeJjOiKgueCuVxuICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZCA9IGNjLmluc3RhbnRpYXRlKHNlbGYuY2FyZF9wcmVmYWIpXG4gICAgICAgICAgICAgICAgICAgIGlmICghY2FyZCkgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBjYXJkLnNjYWxlID0gQ2FyZExheW91dC5jYXJkU2NhbGVcbiAgICAgICAgICAgICAgICAgICAgY2FyZC5wYXJlbnQgPSBjYXJkUGFyZW50ICAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55So56Gu5a6a55qE5omL54mM5a655ZmoXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDwn46sIOS7juWPkeeJjOWghuS9jee9ruW8gOWni1xuICAgICAgICAgICAgICAgICAgICBjYXJkLnNldFBvc2l0aW9uKGRlY2tQb3MpXG4gICAgICAgICAgICAgICAgICAgIGNhcmQuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBjYXJkLnpJbmRleCA9IGluZGV4XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDorr7nva7ljaHniYzmmL7npLpcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhcmRDb21wID0gY2FyZC5nZXRDb21wb25lbnQoXCJjYXJkXCIpXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYXJkQ29tcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZENvbXAuc2hvd0NhcmRzKGNhcmREYXRhLCBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g8J+OrCDmkq3mlL7lj5HniYzliqjnlLtcbiAgICAgICAgICAgICAgICAgICAgY2MudHdlZW4oY2FyZClcbiAgICAgICAgICAgICAgICAgICAgICAgIC50byhhbmltRHVyYXRpb24sIHsgcG9zaXRpb246IHRhcmdldFBvcyB9LCB7IGVhc2luZzogJ3NpbmVPdXQnIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAuY2FsbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDliqjnlLvlrozmiJDlm57osINcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g8J+UiiDmkq3mlL7lj5HniYzpn7PmlYhcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzb3Blbl9zb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGxheVNvdW5kKFwic291bmQvZmFwYWkxXCIpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSwgaW5kZXggKiBjYXJkSW50ZXJ2YWwpXG4gICAgICAgICAgICB9KShpKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlj5HniYzlrozmiJDlkI7lm57osINcbiAgICAgICAgdmFyIHRvdGFsRGVhbFRpbWUgPSBzb3J0ZWRDYXJkcy5sZW5ndGggKiBjYXJkSW50ZXJ2YWwgKyBhbmltRHVyYXRpb25cbiAgICAgICAgdGhpcy5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLl9vbkRlYWxDYXJkc0NvbXBsZXRlKHNvcnRlZENhcmRzKVxuICAgICAgICB9LCB0b3RhbERlYWxUaW1lKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+OrOOAkOaWsOWinuOAkeWPkeeJjOWujOaIkOWbnuiwg1xuICAgICAqIEBwYXJhbSB7QXJyYXl9IHNvcnRlZENhcmRzIC0g5bey5o6S5bqP55qE5omL54mM5pWw5o2uXG4gICAgICovXG4gICAgX29uRGVhbENhcmRzQ29tcGxldGU6IGZ1bmN0aW9uKHNvcnRlZENhcmRzKSB7XG4gICAgICAgIC8vIOagh+iusOWwsee7qlxuICAgICAgICB0aGlzLmNhcmRzUmVhZHkgPSB0cnVlXG4gICAgICAgIHRoaXMuZmFwYWlfZW5kID0gdHJ1ZVxuICAgICAgICBcbiAgICAgICAgLy8g6YCa55+l5YW25LuW546p5a626IqC54K5XG4gICAgICAgIGlmICh0aGlzLm5vZGUucGFyZW50KSB7XG4gICAgICAgICAgICB0aGlzLm5vZGUucGFyZW50LmVtaXQoXCJwdXNoY2FyZF9vdGhlcl9ldmVudFwiKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmo4Dmn6XmmK/lkKbpnIDopoHmmL7npLrmiqLlnLDkuLvmjInpkq5cbiAgICAgICAgdGhpcy5fY2hlY2tBbmRTaG93Um9iVUkoKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog44CQ5qC45b+D44CR6K6h566X54mM5Yqb5YC877yI5paX5Zyw5Li76KeE5YiZ77yJXG4gICAgICog5aSn546LPTE1LCDlsI/njos9MTQsIDI9MTMsIEE9MTIsIEs9MTEsIFE9MTAsIEo9OSwgMTA9OCwgLi4uLCAzPTFcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2FyZCAtIOWNoeeJjOaVsOaNrlxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9IOeJjOWKm+WAvFxuICAgICAqL1xuICAgIGdldENhcmRWYWx1ZTogZnVuY3Rpb24oY2FyZCkge1xuICAgICAgICB2YXIgcmFuayA9IGNhcmQucmFua1xuICAgICAgICBcbiAgICAgICAgaWYgKHJhbmsgPT09IDMpIHJldHVybiAxICAgLy8gM1xuICAgICAgICBpZiAocmFuayA9PT0gNCkgcmV0dXJuIDIgICAvLyA0XG4gICAgICAgIGlmIChyYW5rID09PSA1KSByZXR1cm4gMyAgIC8vIDVcbiAgICAgICAgaWYgKHJhbmsgPT09IDYpIHJldHVybiA0ICAgLy8gNlxuICAgICAgICBpZiAocmFuayA9PT0gNykgcmV0dXJuIDUgICAvLyA3XG4gICAgICAgIGlmIChyYW5rID09PSA4KSByZXR1cm4gNiAgIC8vIDhcbiAgICAgICAgaWYgKHJhbmsgPT09IDkpIHJldHVybiA3ICAgLy8gOVxuICAgICAgICBpZiAocmFuayA9PT0gMTApIHJldHVybiA4ICAvLyAxMFxuICAgICAgICBpZiAocmFuayA9PT0gMTEpIHJldHVybiA5ICAvLyBKXG4gICAgICAgIGlmIChyYW5rID09PSAxMikgcmV0dXJuIDEwIC8vIFFcbiAgICAgICAgaWYgKHJhbmsgPT09IDEzKSByZXR1cm4gMTEgLy8gS1xuICAgICAgICBpZiAocmFuayA9PT0gMTQpIHJldHVybiAxMiAvLyBBXG4gICAgICAgIGlmIChyYW5rID09PSAxNSkgcmV0dXJuIDEzIC8vIDJcbiAgICAgICAgaWYgKHJhbmsgPT09IDE2KSByZXR1cm4gMTQgLy8g5bCP546LXG4gICAgICAgIGlmIChyYW5rID09PSAxNykgcmV0dXJuIDE1IC8vIOWkp+eOi1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIDBcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOOAkOaguOW/g+OAkeS9v+eUqCBnZXRDYXJkVmFsdWUg5o6S5bqP5omL54mMXG4gICAgICog5paX5Zyw5Li75qCH5YeG5o6S5bqP77ya5aSn546LID4g5bCP546LID4gMiA+IEEgPiBLID4gUSA+IEogPiAxMCA+IDkgPiA4ID4gNyA+IDYgPiA1ID4gNCA+IDNcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBjYXJkcyAtIOacjeWKoeerr+WOn+Wni+aJi+eJjOaVsOaNrlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0g5o6S5bqP5ZCO55qE5omL54mM5pWw5o2uXG4gICAgICovXG4gICAgX3NvcnRDYXJkczogZnVuY3Rpb24oY2FyZHMpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIC8vIOWkjeWItuaVsOe7hO+8jOmBv+WFjeS/ruaUueWOn+aVsOaNrlxuICAgICAgICB2YXIgc29ydGVkQ2FyZHMgPSBjYXJkcy5zbGljZSgpXG4gICAgICAgIFxuICAgICAgICAvLyDkvb/nlKggZ2V0Q2FyZFZhbHVlIOS7juWkp+WIsOWwj+aOkuW6j1xuICAgICAgICBzb3J0ZWRDYXJkcy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZUEgPSBzZWxmLmdldENhcmRWYWx1ZShhKVxuICAgICAgICAgICAgdmFyIHZhbHVlQiA9IHNlbGYuZ2V0Q2FyZFZhbHVlKGIpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWFiOaMiSB2YWx1ZSDku47lpKfliLDlsI/mjpLluo9cbiAgICAgICAgICAgIGlmICh2YWx1ZUEgIT09IHZhbHVlQikge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZUIgLSB2YWx1ZUFcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHZhbHVlIOebuOWQjOaXtu+8jOaMieiKseiJsuaOkuW6j++8iOm7keahgyA+IOe6ouW/gyA+IOaiheiKsSA+IOaWueWdl++8iVxuICAgICAgICAgICAgcmV0dXJuIGEuc3VpdCAtIGIuc3VpdFxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHNvcnRlZENhcmRzXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDjgJDmoLjlv4PjgJHmuIXnkIbmiYDmnInml6foioLngrnvvIjop6PlhrPog4zpnaLniYzmrovnlZnvvIlcbiAgICAgKiDwn5Sl44CQ5L+u5aSN44CR5ZCM5pe25riF55CGIGNhcmRzX25vZGUg5ZKMIG5vZGUucGFyZW5077yM56Gu5L+d5peg5q6L55WZXG4gICAgICovXG4gICAgY2xlYXJBbGxDYXJkczogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlj6rmuIXnkIbmiYvniYzlrrnlmajkuK3nmoToioLngrnvvIzkuI3pgY3ljoZub2RlLnBhcmVudFxuICAgICAgICBpZiAodGhpcy5jYXJkc19ub2RlKSB7XG4gICAgICAgICAgICB0aGlzLmNhcmRzX25vZGUucmVtb3ZlQWxsQ2hpbGRyZW4oKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+OriBbY2xlYXJBbGxDYXJkc10gY2FyZHNfbm9kZSDmnKrlrprkuYlcIilcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5riF56m66YCJ5Lit55qE54mM5pWw5o2uXG4gICAgICAgIHRoaXMuY2hvb3NlX2NhcmRfZGF0YSA9IFtdXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDorqHnrpfniYznmoRY5Z2Q5qCHXG4gICAgICovXG4gICAgX2dldENhcmRYOiBmdW5jdGlvbihpbmRleCwgY291bnQsIHNwYWNpbmcpIHtcbiAgICAgICAgdmFyIHRvdGFsV2lkdGggPSAoY291bnQgLSAxKSAqIHNwYWNpbmdcbiAgICAgICAgdmFyIHN0YXJ0WCA9IC10b3RhbFdpZHRoIC8gMlxuICAgICAgICByZXR1cm4gc3RhcnRYICsgaW5kZXggKiBzcGFjaW5nXG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOW6leeJjOebuOWFs1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIOWIm+W7uuW6leeJjOaYvuekuu+8iOeJjOiDjO+8iVxuICAgICAqL1xuICAgIF9jcmVhdGVCb3R0b21DYXJkczogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOa4heeQhuaXp+W6leeJjFxuICAgICAgICBpZiAodGhpcy5ib3R0b21fY2FyZCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmJvdHRvbV9jYXJkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYm90dG9tX2NhcmRbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ib3R0b21fY2FyZFtpXS5kZXN0cm95KClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ib3R0b21fY2FyZCA9IFtdXG4gICAgICAgIFxuICAgICAgICBpZiAoIXRoaXMuYm90dG9tX2NhcmRfcG9zX25vZGUgfHwgIXRoaXMuY2FyZF9wcmVmYWIpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgdmFyIGJvdHRvbVkgPSB0aGlzLmJvdHRvbV9jYXJkX3Bvc19ub2RlLnlcbiAgICAgICAgdmFyIGJvdHRvbVN0YXJ0WCA9IHRoaXMuYm90dG9tX2NhcmRfcG9zX25vZGUueCAtIENhcmRMYXlvdXQuYm90dG9tQ2FyZFNwYWNpbmdcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZGlfY2FyZCA9IGNjLmluc3RhbnRpYXRlKHRoaXMuY2FyZF9wcmVmYWIpXG4gICAgICAgICAgICBpZiAoIWRpX2NhcmQpIGNvbnRpbnVlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRpX2NhcmQuc2NhbGUgPSBDYXJkTGF5b3V0LmJvdHRvbUNhcmRTY2FsZVxuICAgICAgICAgICAgZGlfY2FyZC5zZXRQb3NpdGlvbihib3R0b21TdGFydFggKyBDYXJkTGF5b3V0LmJvdHRvbUNhcmRTcGFjaW5nICogaSwgYm90dG9tWSlcbiAgICAgICAgICAgIGRpX2NhcmQucGFyZW50ID0gdGhpcy5ub2RlLnBhcmVudFxuICAgICAgICAgICAgZGlfY2FyZC5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICB0aGlzLmJvdHRvbV9jYXJkLnB1c2goZGlfY2FyZClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDlj6vlnLDkuLsv5oqi5Zyw5Li755u45YWzXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBfY2hlY2tBbmRTaG93Um9iVUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5aaC5p6c5Zyo5Ye654mM6Zi25q6177yM5LiN5pi+56S65oqi5Zyw5Li75oyJ6ZKuXG4gICAgICAgIHZhciBSb29tU3RhdGUgPSB3aW5kb3cuUm9vbVN0YXRlIHx8IHt9XG4gICAgICAgIGlmICh0aGlzLl9iaWRkaW5nUGhhc2UgPT09IFwiaWRsZVwiICYmIHRoaXMuX2dhbWVQaGFzZSA9PT0gXCJwbGF5aW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgbXlQbGF5ZXJJZCA9IG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKCkuaWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5zZXJ2ZXJQbGF5ZXJJZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRFxuICAgICAgICBpZiAodGhpcy5yb2JfcGxheWVyX2FjY291bnRpZCA9PSBteVBsYXllcklkICYmIHRoaXMuY2FyZHNSZWFkeSAmJiB0aGlzLnJvYlVJICYmICF0aGlzLnJvYlVJLmFjdGl2ZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2JpZGRpbmdQaGFzZSA9PT0gXCJiaWRkaW5nXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zaG93QmlkVUkoXCLlj6vlnLDkuLtcIiwgXCLkuI3lj6tcIilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvd0JpZFVJKFwi5oqi5Zyw5Li7XCIsIFwi5LiN5oqiXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3Byb2Nlc3NDYWxsTGFuZGxvcmRUdXJuOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAoIW15Z2xvYmFsKSByZXR1cm5cblxuICAgICAgICB2YXIgcGxheWVySWQgPSBkYXRhLnBsYXllcl9pZFxuICAgICAgICB2YXIgdGltZW91dCA9IGRhdGEudGltZW91dCB8fCAxNVxuICAgICAgICB2YXIgcm91bmQgPSBkYXRhLnJvdW5kIHx8IDFcbiAgICAgICAgdmFyIGV4cGlyZXNBdCA9IGRhdGEuZXhwaXJlc19hdCB8fCAwICAvLyDwn5Sn44CQ5paw5aKe44CR5pyN5Yqh56uv6L+H5pyf5pe26Ze05oiz77yI5q+r56eS77yJXG5cbiAgICAgICAgLy8g8J+UkuOAkOmHjeimgeOAkeWFiOWBnOatouS5i+WJjeeahOWAkuiuoeaXtu+8iOacjeWKoeWZqOi9rui9rOS6hu+8iVxuICAgICAgICB0aGlzLl9zdG9wQmlkQ291bnRkb3duKClcblxuICAgICAgICB0aGlzLnJvYl9wbGF5ZXJfYWNjb3VudGlkID0gcGxheWVySWRcbiAgICAgICAgdGhpcy5fYmlkVGltZW91dCA9IHRpbWVvdXRcbiAgICAgICAgdGhpcy5fYmlkZGluZ1BoYXNlID0gcm91bmQgPT09IDEgPyBcImJpZGRpbmdcIiA6IFwicm9iYmluZ1wiXG4gICAgICAgIHRoaXMuX2JpZEV4cGlyZXNBdCA9IGV4cGlyZXNBdCAgLy8g8J+Up+OAkOaWsOWinuOAkeS/neWtmOi/h+acn+aXtumXtFxuXG4gICAgICAgIHZhciBteVBsYXllcklkID0gbXlnbG9iYWwuc29ja2V0LmdldFBsYXllckluZm8oKS5pZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLnNlcnZlclBsYXllcklkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEXG5cbiAgICAgICAgaWYgKFN0cmluZyhwbGF5ZXJJZCkgPT09IFN0cmluZyhteVBsYXllcklkKSAmJiB0aGlzLmNhcmRzUmVhZHkpIHtcbiAgICAgICAgICAgIGlmIChyb3VuZCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3dCaWRVSShcIuWPq+WcsOS4u1wiLCBcIuS4jeWPq1wiKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zaG93QmlkVUkoXCLmiqLlnLDkuLtcIiwgXCLkuI3miqJcIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2hpZGVSb2JVSSgpXG4gICAgICAgICAgICBpZiAodGhpcy5ub2RlICYmIHRoaXMubm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5vZGUucGFyZW50LmVtaXQoXCJjYWxsX2xhbmRsb3JkX3R1cm5fZXZlbnRcIiwge1xuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJfaWQ6IHBsYXllcklkLFxuICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiB0aW1lb3V0LFxuICAgICAgICAgICAgICAgICAgICByb3VuZDogcm91bmQsXG4gICAgICAgICAgICAgICAgICAgIGV4cGlyZXNfYXQ6IGV4cGlyZXNBdFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3Nob3dCaWRVSTogZnVuY3Rpb24oY29uZmlybVRleHQsIGNhbmNlbFRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLnJvYlVJKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLnBsYXlpbmdVSV9ub2RlKSB7XG4gICAgICAgICAgICB0aGlzLnBsYXlpbmdVSV9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBjb25maXJtQnRuID0gdGhpcy5yb2JVSS5nZXRDaGlsZEJ5TmFtZShcImJ0bl9xaWFuZHpcIilcbiAgICAgICAgdmFyIGNhbmNlbEJ0biA9IHRoaXMucm9iVUkuZ2V0Q2hpbGRCeU5hbWUoXCJidG5fYnVxaWFuZHpcIilcbiAgICAgICAgXG4gICAgICAgIGlmIChjb25maXJtQnRuKSB7XG4gICAgICAgICAgICB2YXIgbGFiZWwgPSBjb25maXJtQnRuLmdldENoaWxkQnlOYW1lKFwiTGFiZWxcIilcbiAgICAgICAgICAgIGlmIChsYWJlbCAmJiBsYWJlbC5nZXRDb21wb25lbnQoY2MuTGFiZWwpKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKS5zdHJpbmcgPSBjb25maXJtVGV4dFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoY2FuY2VsQnRuKSB7XG4gICAgICAgICAgICB2YXIgbGFiZWwgPSBjYW5jZWxCdG4uZ2V0Q2hpbGRCeU5hbWUoXCJMYWJlbFwiKVxuICAgICAgICAgICAgaWYgKGxhYmVsICYmIGxhYmVsLmdldENvbXBvbmVudChjYy5MYWJlbCkpIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5nZXRDb21wb25lbnQoY2MuTGFiZWwpLnN0cmluZyA9IGNhbmNlbFRleHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5yb2JVSS5hY3RpdmUgPSB0cnVlXG4gICAgICAgIHRoaXMuX3N0YXJ0QmlkQ291bnRkb3duKClcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLm5vZGUgJiYgdGhpcy5ub2RlLnBhcmVudCkge1xuICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeS8oOmAkuWMheWQqyB0aW1lb3V0IOeahOWvueixoVxuICAgICAgICAgICAgdGhpcy5ub2RlLnBhcmVudC5lbWl0KFwiY2Fucm9iX2V2ZW50XCIsIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXJfaWQ6IHRoaXMucm9iX3BsYXllcl9hY2NvdW50aWQsXG4gICAgICAgICAgICAgICAgdGltZW91dDogdGhpcy5fYmlkVGltZW91dCB8fCAxNVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgX2hpZGVSb2JVSTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnJvYlVJKSB7XG4gICAgICAgICAgICB0aGlzLnJvYlVJLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3RvcEJpZENvdW50ZG93bigpXG4gICAgfSxcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDwn5WQ44CQ5YCS6K6h5pe257O757uf44CR5qCH5YeG5paX5Zyw5Li75YCS6K6h5pe277yI5bim5YiG5q615YKs5L+D5pWI5p6c77yJXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiDwn5WQ44CQ57uf5LiA5YWl5Y+j44CR5byA5aeL5oqi5Zyw5Li75YCS6K6h5pe2XG4gICAgICog8J+Up+OAkOS/ruWkjeOAkeagueaNruacjeWKoeerr+i/h+acn+aXtumXtOiuoeeul+WJqeS9meaXtumXtO+8jOehruS/neS4juacjeWKoeerr+WQjOatpVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIOWAkuiuoeaXtuenkuaVsO+8iOWkh+eUqO+8jOWmguaenCBleHBpcmVzX2F0IOaXoOaViOWImeS9v+eUqO+8iVxuICAgICAqL1xuICAgIF9zdGFydEJpZENvdW50ZG93bjogZnVuY3Rpb24oZHVyYXRpb24pIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIC8vIPCflJLjgJDpmLLmiqTjgJHlhYjlgZzmraLkuYvliY3nmoTlgJLorqHml7ZcbiAgICAgICAgdGhpcy5fc3RvcEJpZENvdW50ZG93bigpXG5cbiAgICAgICAgdmFyIHRpbWVvdXQgPSBkdXJhdGlvbiB8fCB0aGlzLl9iaWRUaW1lb3V0IHx8IDE1XG4gICAgICAgIHZhciBleHBpcmVzQXQgPSB0aGlzLl9iaWRFeHBpcmVzQXQgfHwgMFxuXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHmoLnmja7mnI3liqHnq6/ov4fmnJ/ml7bpl7TorqHnrpfliankvZnml7bpl7RcbiAgICAgICAgdmFyIHRpbWVMZWZ0ID0gdGltZW91dFxuICAgICAgICBpZiAoZXhwaXJlc0F0ID4gMCkge1xuICAgICAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KClcbiAgICAgICAgICAgIHRpbWVMZWZ0ID0gTWF0aC5tYXgoMCwgTWF0aC5mbG9vcigoZXhwaXJlc0F0IC0gbm93KSAvIDEwMDApKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fYmlkVGltZUxlZnQgPSB0aW1lTGVmdFxuICAgICAgICB0aGlzLl9pc0JpZENvdW50ZG93blRpY2tpbmcgPSB0cnVlXG4gICAgICAgIHRoaXMuX2lzQmlkV2FybmluZyA9IGZhbHNlXG5cbiAgICAgICAgLy8g8J+VkCDliJ3lp4vljJZVSeaYvuekulxuICAgICAgICB0aGlzLl91cGRhdGVCaWRDb3VudGRvd25VSSgpXG5cbiAgICAgICAgLy8g8J+VkCDkvb/nlKggY2MuTm9kZSDnmoQgc2NoZWR1bGUg5a6e546w5q+P56eSIHRpY2tcbiAgICAgICAgdGhpcy5zY2hlZHVsZSh0aGlzLl9iaWRDb3VudGRvd25UaWNrLCAxKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5WQ44CQ5qC45b+DVGlja+OAkeaKouWcsOS4u+WAkuiuoeaXtuavj+enkuaJp+ihjFxuICAgICAqL1xuICAgIF9iaWRDb3VudGRvd25UaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc0JpZENvdW50ZG93blRpY2tpbmcpIHJldHVyblxuXG4gICAgICAgIHRoaXMuX2JpZFRpbWVMZWZ0LS1cblxuICAgICAgICAvLyDwn5WQIOabtOaWsFVJ5pi+56S6XG4gICAgICAgIHRoaXMuX3VwZGF0ZUJpZENvdW50ZG93blVJKClcblxuICAgICAgICAvLyDimqDvuI8gNeenku+8mui/m+WFpeitpuWRiueKtuaAgVxuICAgICAgICBpZiAodGhpcy5fYmlkVGltZUxlZnQgPT09IDUpIHtcbiAgICAgICAgICAgIHRoaXMuX2VudGVyQmlkV2FybmluZ1N0YXRlKClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIPCflIogM+enku+8muW8gOWni+a7tOetlOmfs++8iOavj+enkuS4gOasoe+8iVxuICAgICAgICBpZiAodGhpcy5fYmlkVGltZUxlZnQgPD0gMyAmJiB0aGlzLl9iaWRUaW1lTGVmdCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuX3BsYXlUaWNrU291bmQoKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g4o+wIDDnp5LvvJroh6rliqjlpITnkIZcbiAgICAgICAgaWYgKHRoaXMuX2JpZFRpbWVMZWZ0IDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuX29uQmlkQ291bnRkb3duRW5kKClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5WQ44CQVUnmm7TmlrDjgJHmm7TmlrDmiqLlnLDkuLvlgJLorqHml7bmmL7npLpcbiAgICAgKi9cbiAgICBfdXBkYXRlQmlkQ291bnRkb3duVUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVtYWluaW5nID0gdGhpcy5fYmlkVGltZUxlZnRcbiAgICAgICAgdmFyIHVwZGF0ZWQgPSBmYWxzZVxuXG4gICAgICAgIC8vIOaWueW8jzHvvJrkvb/nlKggcHJvcGVydGllcyDnu5HlrprnmoQgTGFiZWxcbiAgICAgICAgaWYgKHRoaXMuYmlkQ291bnRkb3duTGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMuYmlkQ291bnRkb3duTGFiZWwuc3RyaW5nID0gU3RyaW5nKHJlbWFpbmluZylcbiAgICAgICAgICAgIHVwZGF0ZWQgPSB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyDmlrnlvI8y77ya5bCd6K+V5LuOIHJvYlVJIOS4reafpeaJvuWAkuiuoeaXtiBMYWJlbFxuICAgICAgICBpZiAodGhpcy5yb2JVSSkge1xuICAgICAgICAgICAgdmFyIGNsb2NrTm9kZSA9IHRoaXMucm9iVUkuZ2V0Q2hpbGRCeU5hbWUoXCJjbG9ja1wiKVxuICAgICAgICAgICAgaWYgKGNsb2NrTm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGNsb2NrTm9kZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5bal1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhYmVsID0gY2hpbGQuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgICAgICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLnN0cmluZyA9IFN0cmluZyhyZW1haW5pbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5vcGFjaXR5ID0gMjU1XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDMyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbC5saW5lSGVpZ2h0ID0gNDBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnNldENvbnRlbnRTaXplKDUwLCA1MClcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkuI3pgJrov4djb2xvcuiuvue9rmFscGhhXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuekluZGV4ID0gMTAwXG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOaWueW8jzPvvJrpgJrnn6UgcGxheWVyX25vZGUg5pu05paw5YCS6K6h5pe2XG4gICAgICAgIGlmICh0aGlzLm5vZGUgJiYgdGhpcy5ub2RlLnBhcmVudCkge1xuICAgICAgICAgICAgdGhpcy5ub2RlLnBhcmVudC5lbWl0KFwidXBkYXRlX2NvdW50ZG93bl9ldmVudFwiLCB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJiaWRcIixcbiAgICAgICAgICAgICAgICByZW1haW5pbmc6IHJlbWFpbmluZ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDimqDvuI/jgJDorablkYrnirbmgIHjgJE156eS5pe26L+b5YWl6K2m5ZGK54q25oCBXG4gICAgICovXG4gICAgX2VudGVyQmlkV2FybmluZ1N0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzQmlkV2FybmluZykgcmV0dXJuXG4gICAgICAgIHRoaXMuX2lzQmlkV2FybmluZyA9IHRydWVcblxuICAgICAgICAvLyDojrflj5blgJLorqHml7YgTGFiZWwg6IqC54K5XG4gICAgICAgIHZhciBsYWJlbE5vZGUgPSB0aGlzLl9nZXRCaWRDb3VudGRvd25MYWJlbE5vZGUoKVxuICAgICAgICBpZiAoIWxhYmVsTm9kZSkgcmV0dXJuXG5cbiAgICAgICAgLy8g5Y+Y57qiXG4gICAgICAgIGxhYmVsTm9kZS5jb2xvciA9IGNjLkNvbG9yLlJFRFxuXG4gICAgICAgIC8vIPCflKUg5ZG85ZC457yp5pS+5Yqo55S7XG4gICAgICAgIGxhYmVsTm9kZS5zdG9wQWxsQWN0aW9ucygpXG4gICAgICAgIGNjLnR3ZWVuKGxhYmVsTm9kZSlcbiAgICAgICAgICAgIC5yZXBlYXRGb3JldmVyKFxuICAgICAgICAgICAgICAgIGNjLnR3ZWVuKClcbiAgICAgICAgICAgICAgICAgICAgLnRvKDAuMywgeyBzY2FsZTogMS4yIH0pXG4gICAgICAgICAgICAgICAgICAgIC50bygwLjMsIHsgc2NhbGU6IDEuMCB9KVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLnN0YXJ0KClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+VkOOAkOiOt+WPluiKgueCueOAkeiOt+WPluaKouWcsOS4u+WAkuiuoeaXtkxhYmVs6IqC54K5XG4gICAgICog8J+Up+OAkOS/ruWkjeOAkeafpeaJviBjbG9jayDlrZDoioLngrnkuK3nmoQgTGFiZWxcbiAgICAgKi9cbiAgICBfZ2V0QmlkQ291bnRkb3duTGFiZWxOb2RlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuYmlkQ291bnRkb3duTGFiZWwgJiYgdGhpcy5iaWRDb3VudGRvd25MYWJlbC5ub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5iaWRDb3VudGRvd25MYWJlbC5ub2RlXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucm9iVUkpIHtcbiAgICAgICAgICAgIC8vIOajgOafpSBjbG9jayDoioLngrnkuIvnmoQgTGFiZWxcbiAgICAgICAgICAgIHZhciBjbG9ja05vZGUgPSB0aGlzLnJvYlVJLmdldENoaWxkQnlOYW1lKFwiY2xvY2tcIilcbiAgICAgICAgICAgIGlmIChjbG9ja05vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBjbG9ja05vZGUuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsYWJlbCA9IGNoaWxkcmVuW2ldLmdldENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5baV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOWFtuS7luWPr+iDveeahOWQjeensFxuICAgICAgICAgICAgdmFyIGxhYmVsTmFtZXMgPSBbXCJjbG9ja18gTGFiZWxcIiwgXCJjbG9ja19MYWJlbFwiLCBcInRpbWVfbGFiZWxcIiwgXCJjb3VudGRvd25cIl1cbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGFiZWxOYW1lcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHZhciBsYWJlbE5vZGUgPSB0aGlzLnJvYlVJLmdldENoaWxkQnlOYW1lKGxhYmVsTmFtZXNbal0pXG4gICAgICAgICAgICAgICAgaWYgKGxhYmVsTm9kZSAmJiBsYWJlbE5vZGUuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGFiZWxOb2RlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOKPsOOAkOWxleekuue7k+adn+OAkeacrOWcsOWAkuiuoeaXtuaYvuekuue7k+adn1xuICAgICAqIOKaoO+4j+OAkOmHjeimgeOAkeWPquWBmlVJ5aSE55CG77yM5LiN5Y+R6YCB6K+35rGC77yBXG4gICAgICog5pyN5Yqh5Zmo5Lya5Zyo6LaF5pe25ZCO6Ieq5Yqo5aSE55CG77yM5bm25Y+R6YCB5LiL5LiA5Liq6L2u5qyh5raI5oGvXG4gICAgICovXG4gICAgX29uQmlkQ291bnRkb3duRW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g5YGc5q2iIHRpY2tcbiAgICAgICAgdGhpcy5faXNCaWRDb3VudGRvd25UaWNraW5nID0gZmFsc2VcbiAgICAgICAgdGhpcy51bnNjaGVkdWxlKHRoaXMuX2JpZENvdW50ZG93blRpY2spXG5cbiAgICAgICAgLy8g5YGc5q2i5Yqo55S75bm25oGi5aSN54q25oCBXG4gICAgICAgIHZhciBsYWJlbE5vZGUgPSB0aGlzLl9nZXRCaWRDb3VudGRvd25MYWJlbE5vZGUoKVxuICAgICAgICBpZiAobGFiZWxOb2RlKSB7XG4gICAgICAgICAgICBsYWJlbE5vZGUuc3RvcEFsbEFjdGlvbnMoKVxuICAgICAgICAgICAgbGFiZWxOb2RlLnNjYWxlID0gMVxuICAgICAgICAgICAgbGFiZWxOb2RlLmNvbG9yID0gY2MuQ29sb3IuV0hJVEVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOKaoO+4j+OAkOmHjeimgeOAkeS4jeWPkemAgeS7u+S9leivt+axgu+8gVxuICAgICAgICAvLyDmnI3liqHlmajkvJrlnKjotoXml7blkI7oh6rliqjlpITnkIZcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+UkuOAkOWBnOatouOAkeWBnOatouaKouWcsOS4u+WAkuiuoeaXtlxuICAgICAqL1xuICAgIF9zdG9wQmlkQ291bnRkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5faXNCaWRDb3VudGRvd25UaWNraW5nID0gZmFsc2VcbiAgICAgICAgdGhpcy51bnNjaGVkdWxlKHRoaXMuX2JpZENvdW50ZG93blRpY2spXG5cbiAgICAgICAgLy8g5oGi5aSNIExhYmVsIOeKtuaAgVxuICAgICAgICB2YXIgbGFiZWxOb2RlID0gdGhpcy5fZ2V0QmlkQ291bnRkb3duTGFiZWxOb2RlKClcbiAgICAgICAgaWYgKGxhYmVsTm9kZSkge1xuICAgICAgICAgICAgbGFiZWxOb2RlLnN0b3BBbGxBY3Rpb25zKClcbiAgICAgICAgICAgIGxhYmVsTm9kZS5zY2FsZSA9IDFcbiAgICAgICAgICAgIGxhYmVsTm9kZS5jb2xvciA9IGNjLkNvbG9yLldISVRFXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pc0JpZFdhcm5pbmcgPSBmYWxzZVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDwn5WQ44CQ5Ye654mM5YCS6K6h5pe244CR5qCH5YeG5paX5Zyw5Li75YCS6K6h5pe277yI5bim5YiG5q615YKs5L+D5pWI5p6c77yJXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiDwn5WQ44CQ57uf5LiA5YWl5Y+j44CR5byA5aeL5Ye654mM5YCS6K6h5pe2XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0g5YCS6K6h5pe256eS5pWw77yM6buY6K6kMTXnp5JcbiAgICAgKi9cbiAgICBfc3RhcnRQbGF5Q291bnRkb3duOiBmdW5jdGlvbihkdXJhdGlvbikge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgLy8g8J+UkuOAkOmYsuaKpOOAkeWFiOWBnOatouS5i+WJjeeahOWAkuiuoeaXtlxuICAgICAgICB0aGlzLl9zdG9wUGxheUNvdW50ZG93bigpXG5cbiAgICAgICAgdmFyIHRpbWVvdXQgPSBkdXJhdGlvbiB8fCB0aGlzLl9wbGF5VGltZW91dCB8fCAxNVxuICAgICAgICB0aGlzLl9wbGF5VGltZUxlZnQgPSB0aW1lb3V0XG4gICAgICAgIHRoaXMuX2lzUGxheUNvdW50ZG93blRpY2tpbmcgPSB0cnVlXG4gICAgICAgIHRoaXMuX2lzUGxheVdhcm5pbmcgPSBmYWxzZVxuXG4gICAgICAgIC8vIPCflZAg5Yid5aeL5YyWVUnmmL7npLpcbiAgICAgICAgdGhpcy5fdXBkYXRlUGxheUNvdW50ZG93blVJKClcblxuICAgICAgICAvLyDwn5WQIOS9v+eUqCBjYy5Ob2RlIOeahCBzY2hlZHVsZSDlrp7njrDmr4/np5IgdGlja1xuICAgICAgICB0aGlzLnNjaGVkdWxlKHRoaXMuX3BsYXlDb3VudGRvd25UaWNrLCAxKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5WQ44CQ5qC45b+DVGlja+OAkeWHuueJjOWAkuiuoeaXtuavj+enkuaJp+ihjFxuICAgICAqL1xuICAgIF9wbGF5Q291bnRkb3duVGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5faXNQbGF5Q291bnRkb3duVGlja2luZykgcmV0dXJuXG5cbiAgICAgICAgdGhpcy5fcGxheVRpbWVMZWZ0LS1cblxuICAgICAgICAvLyDwn5WQIOabtOaWsFVJ5pi+56S6XG4gICAgICAgIHRoaXMuX3VwZGF0ZVBsYXlDb3VudGRvd25VSSgpXG5cbiAgICAgICAgLy8g4pqg77iPIDXnp5LvvJrov5vlhaXorablkYrnirbmgIFcbiAgICAgICAgaWYgKHRoaXMuX3BsYXlUaW1lTGVmdCA9PT0gNSkge1xuICAgICAgICAgICAgdGhpcy5fZW50ZXJQbGF5V2FybmluZ1N0YXRlKClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIPCflIogM+enku+8muW8gOWni+a7tOetlOmfs++8iOavj+enkuS4gOasoe+8iVxuICAgICAgICBpZiAodGhpcy5fcGxheVRpbWVMZWZ0IDw9IDMgJiYgdGhpcy5fcGxheVRpbWVMZWZ0ID4gMCkge1xuICAgICAgICAgICAgdGhpcy5fcGxheVRpY2tTb3VuZCgpXG4gICAgICAgIH1cblxuICAgICAgICAvLyDij7AgMOenku+8muiHquWKqOWkhOeQhlxuICAgICAgICBpZiAodGhpcy5fcGxheVRpbWVMZWZ0IDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuX29uUGxheUNvdW50ZG93bkVuZCgpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+VkOOAkFVJ5pu05paw44CR5pu05paw5Ye654mM5YCS6K6h5pe25pi+56S6XG4gICAgICog8J+Up+OAkOS/ruWkjeOAkeWPquabtOaWsOmXuemSn+mHjOmdoueahOWAkuiuoeaXtu+8jOS4jeWcqOWFtuS7luS9jee9ruaYvuekulxuICAgICAqL1xuICAgIF91cGRhdGVQbGF5Q291bnRkb3duVUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVtYWluaW5nID0gdGhpcy5fcGxheVRpbWVMZWZ0XG5cbiAgICAgICAgLy8g5pa55byPMe+8muS9v+eUqCBwcm9wZXJ0aWVzIOe7keWumueahCBMYWJlbO+8iOWmguaenOacie+8iVxuICAgICAgICBpZiAodGhpcy5wbGF5Q291bnRkb3duTGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMucGxheUNvdW50ZG93bkxhYmVsLnN0cmluZyA9IFN0cmluZyhyZW1haW5pbmcpXG4gICAgICAgIH1cblxuICAgICAgICAvLyDmlrnlvI8y77ya6YCa55+lIHBsYXllcl9ub2RlIOabtOaWsOWAkuiuoeaXtlxuICAgICAgICBpZiAodGhpcy5ub2RlICYmIHRoaXMubm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgIHZhciBldmVudCA9IG5ldyBjYy5FdmVudC5FdmVudEN1c3RvbShcInVwZGF0ZV9jb3VudGRvd25fZXZlbnRcIiwgdHJ1ZSlcbiAgICAgICAgICAgIGV2ZW50LnNldFVzZXJEYXRhKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInBsYXlcIixcbiAgICAgICAgICAgICAgICByZW1haW5pbmc6IHJlbWFpbmluZ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHRoaXMubm9kZS5wYXJlbnQuZGlzcGF0Y2hFdmVudChldmVudClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOaWueW8jzPvvJrnm7TmjqXmm7TmlrAgcGxheWluZ1VJX25vZGUg5Lit55qE6Ze56ZKfIExhYmVsXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHpl7npkp/oioLngrnot6/lvoTvvJpwbGF5aW5nVUlfbm9kZSAtPiBjbG9jayAtPiBwbGF5aW5nX2Nsb2NsX2xhYmVsXG4gICAgICAgIGlmICh0aGlzLnBsYXlpbmdVSV9ub2RlKSB7XG4gICAgICAgICAgICB2YXIgY2xvY2tOb2RlID0gdGhpcy5wbGF5aW5nVUlfbm9kZS5nZXRDaGlsZEJ5TmFtZShcImNsb2NrXCIpXG4gICAgICAgICAgICBpZiAoY2xvY2tOb2RlKSB7XG4gICAgICAgICAgICAgICAgLy8g56Gu5L+dIGNsb2NrIOiKgueCueWPr+ingVxuICAgICAgICAgICAgICAgIGNsb2NrTm9kZS5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgICAgY2xvY2tOb2RlLm9wYWNpdHkgPSAyNTVcblxuICAgICAgICAgICAgICAgIC8vIOafpeaJviBwbGF5aW5nX2Nsb2NsX2xhYmVs77yI5rOo5oSP5ou85YaZ77yJXG4gICAgICAgICAgICAgICAgdmFyIGNsb2NrTGFiZWwgPSBjbG9ja05vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJwbGF5aW5nX2Nsb2NsX2xhYmVsXCIpXG4gICAgICAgICAgICAgICAgaWYgKGNsb2NrTGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhYmVsID0gY2xvY2tMYWJlbC5nZXRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwuc3RyaW5nID0gU3RyaW5nKHJlbWFpbmluZylcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsb2NrTGFiZWwuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xvY2tMYWJlbC5vcGFjaXR5ID0gMjU1XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyDlpIfpgInvvJrmn6Xmib7ku7vkvZUgTGFiZWwg5a2Q6IqC54K5XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGNsb2NrTm9kZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhYmVsID0gY2hpbGQuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwuc3RyaW5nID0gU3RyaW5nKHJlbWFpbmluZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQub3BhY2l0eSA9IDI1NVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHmm7TmlrDpl7npkp/ph4zpnaLnmoTlgJLorqHml7bmmL7npLpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcmVtYWluaW5nIC0g5Ymp5L2Z56eS5pWwXG4gICAgICovXG4gICAgX3VwZGF0ZUNsb2NrVGltZUxhYmVsOiBmdW5jdGlvbihyZW1haW5pbmcpIHtcbiAgICAgICAgLy8g5p+l5om+IGdhbWVTY2VuZSDoioLngrlcbiAgICAgICAgdmFyIGdhbWVTY2VuZU5vZGUgPSB0aGlzLm5vZGUucGFyZW50XG4gICAgICAgIGlmICghZ2FtZVNjZW5lTm9kZSkgcmV0dXJuXG5cbiAgICAgICAgLy8g6YGN5Y6G5omA5pyJ5a2Q6IqC54K577yM5om+5YiwIHBsYXllcl9ub2Rl77yI5b2T5YmN546p5a6277yJXG4gICAgICAgIHZhciBjaGlsZHJlbiA9IGdhbWVTY2VuZU5vZGUuY2hpbGRyZW5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV1cbiAgICAgICAgICAgIHZhciBwbGF5ZXJOb2RlU2NyaXB0ID0gY2hpbGQuZ2V0Q29tcG9uZW50KFwicGxheWVyX25vZGVcIilcbiAgICAgICAgICAgIGlmIChwbGF5ZXJOb2RlU2NyaXB0ICYmIHBsYXllck5vZGVTY3JpcHQuc2VhdF9pbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIOaWueW8jzHvvJrkvb/nlKggdGltZV9sYWJlbCDlsZ7mgKdcbiAgICAgICAgICAgICAgICBpZiAocGxheWVyTm9kZVNjcmlwdC50aW1lX2xhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHBsYXllck5vZGVTY3JpcHQudGltZV9sYWJlbC5zdHJpbmcgPSBTdHJpbmcocmVtYWluaW5nKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOaWueW8jzLvvJrmn6Xmib4gY2xvY2tpbWFnZSDoioLngrnkuK3nmoQgTGFiZWzvvIjkuI7miqLlnLDkuLvlgJLorqHml7bnsbvkvLzvvIlcbiAgICAgICAgICAgICAgICBpZiAocGxheWVyTm9kZVNjcmlwdC5jbG9ja2ltYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjbG9ja05vZGUgPSBwbGF5ZXJOb2RlU2NyaXB0LmNsb2NraW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgLy8g56Gu5L+dIGNsb2NraW1hZ2Ug5Y+v6KeBXG4gICAgICAgICAgICAgICAgICAgIGNsb2NrTm9kZS5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGNsb2NrTm9kZS5vcGFjaXR5ID0gMjU1XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5p+l5om+IGNsb2NraW1hZ2Ug5Lit55qEIExhYmVsXG4gICAgICAgICAgICAgICAgICAgIHZhciBjbG9ja0NoaWxkcmVuID0gY2xvY2tOb2RlLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2xvY2tDaGlsZHJlbi5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNsb2NrQ2hpbGQgPSBjbG9ja0NoaWxkcmVuW2pdXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFiZWwgPSBjbG9ja0NoaWxkLmdldENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLnN0cmluZyA9IFN0cmluZyhyZW1haW5pbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvY2tDaGlsZC5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvY2tDaGlsZC5vcGFjaXR5ID0gMjU1XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g6K6+572u5ZCI6YCC55qE5a2X5L2T5aSn5bCPXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwuZm9udFNpemUgPSAzMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLmxpbmVIZWlnaHQgPSA0MFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb2NrQ2hpbGQuc2V0Q29udGVudFNpemUoNTAsIDUwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkuI3pgJrov4djb2xvcuiuvue9rmFscGhhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvY2tDaGlsZC5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb2NrQ2hpbGQuekluZGV4ID0gMTAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIOWmguaenCBjbG9ja2ltYWdlIOayoeaciSBMYWJlbCDlrZDoioLngrnvvIzmo4Dmn6XmmK/lkKbnm7TmjqXmmK8gTGFiZWxcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdExhYmVsID0gY2xvY2tOb2RlLmdldENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpcmVjdExhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3RMYWJlbC5zdHJpbmcgPSBTdHJpbmcocmVtYWluaW5nKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog4pqg77iP44CQ6K2m5ZGK54q25oCB44CRNeenkuaXtui/m+WFpeitpuWRiueKtuaAgVxuICAgICAqL1xuICAgIF9lbnRlclBsYXlXYXJuaW5nU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5faXNQbGF5V2FybmluZykgcmV0dXJuXG4gICAgICAgIHRoaXMuX2lzUGxheVdhcm5pbmcgPSB0cnVlXG5cbiAgICAgICAgLy8g6I635Y+W5YCS6K6h5pe2IExhYmVsIOiKgueCuVxuICAgICAgICB2YXIgbGFiZWxOb2RlID0gdGhpcy5fZ2V0UGxheUNvdW50ZG93bkxhYmVsTm9kZSgpXG4gICAgICAgIGlmICghbGFiZWxOb2RlKSByZXR1cm5cblxuICAgICAgICAvLyDlj5jnuqJcbiAgICAgICAgbGFiZWxOb2RlLmNvbG9yID0gY2MuQ29sb3IuUkVEXG5cbiAgICAgICAgLy8g8J+UpSDlkbzlkLjnvKnmlL7liqjnlLtcbiAgICAgICAgbGFiZWxOb2RlLnN0b3BBbGxBY3Rpb25zKClcbiAgICAgICAgY2MudHdlZW4obGFiZWxOb2RlKVxuICAgICAgICAgICAgLnJlcGVhdEZvcmV2ZXIoXG4gICAgICAgICAgICAgICAgY2MudHdlZW4oKVxuICAgICAgICAgICAgICAgICAgICAudG8oMC4zLCB7IHNjYWxlOiAxLjIgfSlcbiAgICAgICAgICAgICAgICAgICAgLnRvKDAuMywgeyBzY2FsZTogMS4wIH0pXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAuc3RhcnQoKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5WQ44CQ6I635Y+W6IqC54K544CR6I635Y+W5Ye654mM5YCS6K6h5pe2TGFiZWzoioLngrlcbiAgICAgKi9cbiAgICBfZ2V0UGxheUNvdW50ZG93bkxhYmVsTm9kZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOaWueW8jzHvvJrkvb/nlKggcHJvcGVydGllcyDnu5HlrprnmoQgTGFiZWxcbiAgICAgICAgaWYgKHRoaXMucGxheUNvdW50ZG93bkxhYmVsICYmIHRoaXMucGxheUNvdW50ZG93bkxhYmVsLm5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBsYXlDb3VudGRvd25MYWJlbC5ub2RlXG4gICAgICAgIH1cblxuICAgICAgICAvLyDmlrnlvI8y77ya5LuOIHBsYXlpbmdVSV9ub2RlIOeahOmXuemSn+S4reiOt+WPliBMYWJlbFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR6Ze56ZKf6IqC54K56Lev5b6E77yacGxheWluZ1VJX25vZGUgLT4gY2xvY2sgLT4gcGxheWluZ19jbG9jbF9sYWJlbFxuICAgICAgICBpZiAodGhpcy5wbGF5aW5nVUlfbm9kZSkge1xuICAgICAgICAgICAgdmFyIGNsb2NrTm9kZSA9IHRoaXMucGxheWluZ1VJX25vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJjbG9ja1wiKVxuICAgICAgICAgICAgaWYgKGNsb2NrTm9kZSkge1xuICAgICAgICAgICAgICAgIC8vIOafpeaJviBwbGF5aW5nX2Nsb2NsX2xhYmVs77yI5rOo5oSP5ou85YaZ77yJXG4gICAgICAgICAgICAgICAgdmFyIGNsb2NrTGFiZWwgPSBjbG9ja05vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJwbGF5aW5nX2Nsb2NsX2xhYmVsXCIpXG4gICAgICAgICAgICAgICAgaWYgKGNsb2NrTGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNsb2NrTGFiZWxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g5aSH6YCJ77ya5p+l5om+5Lu75L2VIExhYmVsIOWtkOiKgueCuVxuICAgICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGNsb2NrTm9kZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhYmVsID0gY2hpbGRyZW5baV0uZ2V0Q29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgICAgICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjaGlsZHJlbltpXVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog4o+w44CQ5bGV56S657uT5p2f44CR5pys5Zyw5Ye654mM5YCS6K6h5pe25pi+56S657uT5p2fXG4gICAgICog4pqg77iP44CQ6YeN6KaB44CR5Y+q5YGaVUnlpITnkIbvvIzkuI3lj5HpgIHor7fmsYLvvIFcbiAgICAgKiDmnI3liqHlmajkvJrlnKjotoXml7blkI7oh6rliqjlpITnkIbvvIjoh6rliqjkuI3lh7rvvInvvIzlubblj5HpgIHkuIvkuIDkuKrova7mrKHmtojmga9cbiAgICAgKi9cbiAgICBfb25QbGF5Q291bnRkb3duRW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g5YGc5q2iIHRpY2tcbiAgICAgICAgdGhpcy5faXNQbGF5Q291bnRkb3duVGlja2luZyA9IGZhbHNlXG4gICAgICAgIHRoaXMudW5zY2hlZHVsZSh0aGlzLl9wbGF5Q291bnRkb3duVGljaylcblxuICAgICAgICAvLyDlgZzmraLliqjnlLvlubbmgaLlpI3nirbmgIFcbiAgICAgICAgdmFyIGxhYmVsTm9kZSA9IHRoaXMuX2dldFBsYXlDb3VudGRvd25MYWJlbE5vZGUoKVxuICAgICAgICBpZiAobGFiZWxOb2RlKSB7XG4gICAgICAgICAgICBsYWJlbE5vZGUuc3RvcEFsbEFjdGlvbnMoKVxuICAgICAgICAgICAgbGFiZWxOb2RlLnNjYWxlID0gMVxuICAgICAgICAgICAgbGFiZWxOb2RlLmNvbG9yID0gY2MuQ29sb3IuV0hJVEVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOKaoO+4j+OAkOmHjeimgeOAkeS4jeWPkemAgeS7u+S9leivt+axgu+8gVxuICAgICAgICAvLyDmnI3liqHlmajkvJrlnKjotoXml7blkI7oh6rliqjlpITnkIbvvJpcbiAgICAgICAgLy8gMS4g6Ieq5Yqo5LiN5Ye6XG4gICAgICAgIC8vIDIuIOWPkemAgSBjYW5fY2h1X2NhcmRfbm90aWZ5IOaIliBnYW1lX292ZXJcbiAgICAgICAgLy8g5a6i5oi356uv5Y+q6ZyA6KaB5ZON5bqU5pyN5Yqh5Zmo5raI5oGvXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflJLjgJDlgZzmraLjgJHlgZzmraLlh7rniYzlgJLorqHml7ZcbiAgICAgKi9cbiAgICBfc3RvcFBsYXlDb3VudGRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9pc1BsYXlDb3VudGRvd25UaWNraW5nID0gZmFsc2VcbiAgICAgICAgdGhpcy51bnNjaGVkdWxlKHRoaXMuX3BsYXlDb3VudGRvd25UaWNrKVxuXG4gICAgICAgIC8vIOaBouWkjSBMYWJlbCDnirbmgIFcbiAgICAgICAgdmFyIGxhYmVsTm9kZSA9IHRoaXMuX2dldFBsYXlDb3VudGRvd25MYWJlbE5vZGUoKVxuICAgICAgICBpZiAobGFiZWxOb2RlKSB7XG4gICAgICAgICAgICBsYWJlbE5vZGUuc3RvcEFsbEFjdGlvbnMoKVxuICAgICAgICAgICAgbGFiZWxOb2RlLnNjYWxlID0gMVxuICAgICAgICAgICAgbGFiZWxOb2RlLmNvbG9yID0gY2MuQ29sb3IuV0hJVEVcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2lzUGxheVdhcm5pbmcgPSBmYWxzZVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDwn5SK44CQ6Z+z5pWI44CR5ru0562U6Z+z5pWI77yIM+enkuWCrOS/g++8iVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICog8J+UiiDmkq3mlL7mu7TnrZTpn7PmlYjvvIjnlKjkuo7miqLlnLDkuLvlgJLorqHml7bvvIlcbiAgICAgKi9cbiAgICBfcGxheVRpY2tTb3VuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghaXNvcGVuX3NvdW5kKSByZXR1cm5cblxuICAgICAgICAvLyDkvJjlhYjkvb/nlKjnu5HlrprnmoTpn7PmlYhcbiAgICAgICAgaWYgKHRoaXMudGlja0F1ZGlvKSB7XG4gICAgICAgICAgICBjYy5hdWRpb0VuZ2luZS5wbGF5RWZmZWN0KHRoaXMudGlja0F1ZGlvLCBmYWxzZSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5YWc5bqV77ya5L2/55So5Y+R54mM6Z+z5pWI77yI5Y+v5pu/5o2i5Li65LiT55So5ru0562U6Z+z5pWI77yJXG4gICAgICAgIHBsYXlTb3VuZChcInNvdW5kL2ZhcGFpMVwiKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5SKIOaSreaUvua7tOetlOmfs+aViO+8iOeUqOS6juWHuueJjOWAkuiuoeaXtu+8iVxuICAgICAqL1xuICAgIF9wbGF5UGxheVRpY2tTb3VuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghaXNvcGVuX3NvdW5kKSByZXR1cm5cblxuICAgICAgICAvLyDkvJjlhYjkvb/nlKjnu5HlrprnmoTpn7PmlYhcbiAgICAgICAgaWYgKHRoaXMudGlja0F1ZGlvKSB7XG4gICAgICAgICAgICBjYy5hdWRpb0VuZ2luZS5wbGF5RWZmZWN0KHRoaXMudGlja0F1ZGlvLCBmYWxzZSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5YWc5bqV77ya5L2/55So5Y+R54mM6Z+z5pWIXG4gICAgICAgIHBsYXlTb3VuZChcInNvdW5kL2ZhcGFpMVwiKVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDwn5SKIOaKouWcsOS4u+ivremfs+ezu+e7n++8iOacjeWKoeerr+mpseWKqO+8iVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICog8J+UiiDmkq3mlL7miqLlnLDkuLvor63pn7NcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIOacjeWKoeerr+W5v+aSreeahOaVsOaNrlxuICAgICAqICAgLSBhY3Rpb246IFwiY2FsbFwiID0g5oqiLCBcInBhc3NcIiA9IOS4jeaKolxuICAgICAqICAgLSBnZW5kZXI6IFwibWFsZVwiIC8gXCJmZW1hbGVcIlxuICAgICAqICAgLSBvcmRlcjog5b2T5YmN6L2u5qyh5YaF55qE5pON5L2c6aG65bqP77yIMS0z77yJXG4gICAgICogICAtIHJvdW5kOiDlvZPliY3ova7mrKHvvIgx5oiWMu+8iVxuICAgICAqL1xuICAgIF9wbGF5Um9iU291bmQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaWYgKCFpc29wZW5fc291bmQpIHJldHVyblxuXG4gICAgICAgIHZhciBhY3Rpb24gPSBkYXRhLmFjdGlvblxuICAgICAgICB2YXIgZ2VuZGVyID0gZGF0YS5nZW5kZXIgfHwgXCJtYWxlXCJcbiAgICAgICAgdmFyIG9yZGVyID0gZGF0YS5vcmRlciB8fCAxXG4gICAgICAgIHZhciByb3VuZCA9IGRhdGEucm91bmQgfHwgMVxuICAgICAgICB2YXIgcGxheWVySUQgPSBkYXRhLnBsYXllcl9pZCB8fCBcIlwiXG5cbiAgICAgICAgLy8g8J+UkuOAkOmYsumHjeWkjeacuuWItuOAkeajgOafpeaYr+WQpuW3sue7j+aSreaUvui/h+ebuOWQjOeahOmfs+aViFxuICAgICAgICB2YXIgc291bmRLZXkgPSBwbGF5ZXJJRCArIFwiX1wiICsgYWN0aW9uICsgXCJfXCIgKyByb3VuZCArIFwiX1wiICsgb3JkZXJcbiAgICAgICAgaWYgKHRoaXMuX2xhc3RSb2JTb3VuZEtleSA9PT0gc291bmRLZXkpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2xhc3RSb2JTb3VuZEtleSA9IHNvdW5kS2V5XG5cblxuICAgICAgICAvLyDkuI3miqJcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gXCJwYXNzXCIpIHtcbiAgICAgICAgICAgIHZhciBwYXNzU291bmQgPSBnZW5kZXIgPT09IFwiZmVtYWxlXCIgPyBcIm1fbnZfYnVxaWFuZ1wiIDogXCJtX25hbl9idXFpYW5nXCJcbiAgICAgICAgICAgIHRoaXMuX3BsYXlTb3VuZEVmZmVjdChwYXNzU291bmQpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOaKouWcsOS4u1xuICAgICAgICBpZiAoZ2VuZGVyID09PSBcImZlbWFsZVwiKSB7XG4gICAgICAgICAgICAvLyDlpbPnjqnlrrZcbiAgICAgICAgICAgIGlmIChyb3VuZCA9PT0gMSAmJiBvcmRlciA9PT0gMSkge1xuICAgICAgICAgICAgICAgIC8vIOesrDHova7nrKwx5L2NXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheVNvdW5kRWZmZWN0KFwibV9udl9xaWFuZ2Rpemh1XzAxXCIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOesrDHova7nrKwyLzPkvY0g5oiWIOesrDLova7nrKwx5L2NXG4gICAgICAgICAgICAgICAgdmFyIHNvdW5kcyA9IFtcIm1fbnZfcWlhbmdkaXpodV8wMlwiLCBcIm1fbnZfcWlhbmdkaXpodV93b3FpYW5nXzAxXCJdXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheVJhbmRvbVNvdW5kKHNvdW5kcylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOeUt+eOqeWutlxuICAgICAgICAgICAgaWYgKHJvdW5kID09PSAxICYmIG9yZGVyID09PSAxKSB7XG4gICAgICAgICAgICAgICAgLy8g56ysMei9ruesrDHkvY1cbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5U291bmRFZmZlY3QoXCJtX25hbl9xaWFuZ2Rpemh1XCIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOesrDHova7nrKwyLzPkvY0g5oiWIOesrDLova7nrKwx5L2NXG4gICAgICAgICAgICAgICAgdmFyIHNvdW5kcyA9IFtcIm1fbmFuX3FpYW5nZGl6aHVcIiwgXCJtX25hbl9xaWFuZ2Rpemh1X3dvcWlhbmdcIl1cbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5UmFuZG9tU291bmQoc291bmRzKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflIog5pKt5pS+6Z+z5pWI77yI5bimIGZhbGxiYWNrIOacuuWItu+8iVxuICAgICAqIPCflKfjgJDph43mnoTjgJHnp7vpmaTlhajlsYAgZmFsbGJhY2sg5YiwIFwi5aSn5L2gXCIg55qE6YC76L6RXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSDpn7PmlYjlkI3np7DvvIjkuI3lkKvmianlsZXlkI3vvIlcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZmFsbGJhY2sgLSDlj6/pgInnmoQgZmFsbGJhY2sg6Z+z5pWI5ZCN56ew77yI5LiN5YaN6Ieq5YqoIGZhbGxiYWNrIOWIsCBcIuWkp+S9oFwi77yJXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBhbGxvd0RhbmlGYWxsYmFjayAtIOaYr+WQpuWFgeiuuOacgOe7iCBmYWxsYmFjayDliLAgXCLlpKfkvaBcIu+8iOm7mOiupCBmYWxzZe+8iVxuICAgICAqL1xuICAgIF9wbGF5U291bmRFZmZlY3Q6IGZ1bmN0aW9uKG5hbWUsIGZhbGxiYWNrLCBhbGxvd0RhbmlGYWxsYmFjaykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGNjLnJlc291cmNlcy5sb2FkKFwic291bmQvXCIgKyBuYW1lLCBjYy5BdWRpb0NsaXAsIGZ1bmN0aW9uKGVyciwgY2xpcCkge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCflIogW19wbGF5U291bmRFZmZlY3RdIOWKoOi9vemfs+aViOWksei0pTogXCIgKyBuYW1lLCBlcnIubWVzc2FnZSB8fCBlcnIpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkGZhbGxiYWNr44CR5bCd6K+V5pKt5pS+5aSH55So6Z+z5pWIXG4gICAgICAgICAgICAgICAgaWYgKGZhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNjLnJlc291cmNlcy5sb2FkKFwic291bmQvXCIgKyBmYWxsYmFjaywgY2MuQXVkaW9DbGlwLCBmdW5jdGlvbihlcnIyLCBjbGlwMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycjIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn5SKIFtfcGxheVNvdW5kRWZmZWN0XSBmYWxsYmFjayDkuZ/lpLHotKU6IFwiICsgZmFsbGJhY2ssIGVycjIubWVzc2FnZSB8fCBlcnIyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDph43opoHkv67mlLnjgJHkuI3lho3oh6rliqggZmFsbGJhY2sg5YiwIFwi5aSn5L2gXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlj6rmnInmmI7noa7lhYHorrjml7bmiY0gZmFsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWxsb3dEYW5pRmFsbGJhY2sgJiYgZmFsbGJhY2sgIT09IFwibV9jcF9kYW5pXCIgJiYgbmFtZSAhPT0gXCJtX2NwX2RhbmlcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9wbGF5U291bmRFZmZlY3QoXCJtX2NwX2RhbmlcIiwgbnVsbCwgZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2MuYXVkaW9FbmdpbmUucGxheUVmZmVjdChjbGlwMiwgZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhbGxvd0RhbmlGYWxsYmFjayAmJiBuYW1lICE9PSBcIm1fY3BfZGFuaVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDph43opoHkv67mlLnjgJHkuI3lho3pu5jorqQgZmFsbGJhY2sg5YiwIFwi5aSn5L2gXCJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fcGxheVNvdW5kRWZmZWN0KFwibV9jcF9kYW5pXCIsIG51bGwsIGZhbHNlKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2MuYXVkaW9FbmdpbmUucGxheUVmZmVjdChjbGlwLCBmYWxzZSlcbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+UiiDpmo/mnLrmkq3mlL7pn7PmlYhcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBzb3VuZHMgLSDpn7PmlYjlkI3np7DmlbDnu4RcbiAgICAgKi9cbiAgICBfcGxheVJhbmRvbVNvdW5kOiBmdW5jdGlvbihzb3VuZHMpIHtcbiAgICAgICAgaWYgKCFzb3VuZHMgfHwgc291bmRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG4gICAgICAgIHZhciBpbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNvdW5kcy5sZW5ndGgpXG4gICAgICAgIHRoaXMuX3BsYXlTb3VuZEVmZmVjdChzb3VuZHNbaW5kZXhdKVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDmjInpkq7ngrnlh7vkuovku7ZcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIG9uQnV0dG9uQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50LCBjdXN0b21EYXRhKSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBzd2l0Y2goY3VzdG9tRGF0YSkge1xuICAgICAgICAgICAgY2FzZSBcImJ0bl9xaWFuZHpcIjpcbiAgICAgICAgICAgICAgICAvLyDimqDvuI/jgJDlt7LliKDpmaTjgJHmjInpkq7ngrnlh7vpn7PmlYggLSDpn7PmlYjnlLHmnI3liqHnq6/lub/mkq3op6blj5HvvIhfcGxheVJvYlNvdW5k77yJXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2JpZGRpbmdQaGFzZSA9PT0gXCJiaWRkaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGlkZVJvYlVJKClcbiAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LnJlcXVlc3RCaWQodHJ1ZSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oaWRlUm9iVUkoKVxuICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQucmVxdWVzdFJvYlN0YXRlKHFpYW5fc3RhdGUucWlhbilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgY2FzZSBcImJ0bl9idXFpYW5kelwiOlxuICAgICAgICAgICAgICAgIC8vIOKaoO+4j+OAkOW3suWIoOmZpOOAkeaMiemSrueCueWHu+mfs+aViCAtIOmfs+aViOeUseacjeWKoeerr+W5v+aSreinpuWPke+8iF9wbGF5Um9iU291bmTvvIlcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fYmlkZGluZ1BoYXNlID09PSBcImJpZGRpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oaWRlUm9iVUkoKVxuICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQucmVxdWVzdEJpZChmYWxzZSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oaWRlUm9iVUkoKVxuICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQucmVxdWVzdFJvYlN0YXRlKHFpYW5fc3RhdGUuYnVxaWFuZylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNhc2UgXCJub3B1c2hjYXJkXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcFBsYXlDb3VudGRvd24oKVxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlj6rlj5HpgIHkuI3lh7ror7fmsYLvvIzkuI3mnKzlnLDlpITnkIZcbiAgICAgICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQucmVxdWVzdF9idWNodV9jYXJkKFtdLCBudWxsKVxuICAgICAgICAgICAgICAgIHRoaXMucGxheWluZ1VJX25vZGUuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICBjYXNlIFwidGlwY2FyZFwiOlxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHmj5DnpLrmjInpkq7lip/og71cbiAgICAgICAgICAgICAgICB0aGlzLl9vbkhpbnRCdXR0b25DbGljaygpXG4gICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgY2FzZSBcInB1c2hjYXJkXCI6XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2hvb3NlX2NhcmRfZGF0YS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aXBzTGFiZWwuc3RyaW5nID0gXCLor7fpgInmi6nniYwhXCJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnRpcHNMYWJlbC5zdHJpbmcgPSBcIlwiXG4gICAgICAgICAgICAgICAgICAgIH0sIDIwMDApXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ6LCD6K+V5pel5b+X44CR5omT5Y2w6YCJ5Lit55qE54mM77yI5aKe5by654mI77yM5pi+56S654mM5ZCN77yJXG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdGVkQ2FyZE5hbWVzID0gW11cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hvb3NlX2NhcmRfZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZCA9IHRoaXMuY2hvb3NlX2NhcmRfZGF0YVtpXVxuICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZERhdGEgPSBjYXJkLmNhcmRfZGF0YSB8fCBjYXJkXG4gICAgICAgICAgICAgICAgICAgIHZhciBjYXJkTmFtZSA9IHRoaXMuX2dldENhcmREaXNwbGF5TmFtZShjYXJkRGF0YSlcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRDYXJkTmFtZXMucHVzaChjYXJkTmFtZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeWuouaIt+err+eJjOWei+mqjOivgVxuICAgICAgICAgICAgICAgIHZhciBjYXJkc1RvUGxheSA9IHRoaXMuY2hvb3NlX2NhcmRfZGF0YS5tYXAoZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYy5jYXJkX2RhdGEgfHwgY1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgdmFyIHZhbGlkYXRpb25SZXN1bHQgPSB0aGlzLl92YWxpZGF0ZUhhbmRUeXBlKGNhcmRzVG9QbGF5KVxuICAgICAgICAgICAgICAgIGlmICghdmFsaWRhdGlvblJlc3VsdC52YWxpZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRpcHNMYWJlbC5zdHJpbmcgPSB2YWxpZGF0aW9uUmVzdWx0Lm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnRpcHNMYWJlbC5zdHJpbmcgPSBcIlwiXG4gICAgICAgICAgICAgICAgICAgIH0sIDIwMDApXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgICAgICAgICB0aGlzLl9zdG9wUGxheUNvdW50ZG93bigpXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeWPquWPkemAgeWHuueJjOivt+axgu+8jOetieW+heacjeWKoeerr+W5v+aSreWQjuWGjeabtOaWsOaJi+eJjFxuICAgICAgICAgICAgICAgIC8vIOacjeWKoeerr+S8muW5v+aSrSBjYXJkX3BsYXllZCDmtojmga/vvIznlLEgb25PdGhlclBsYXllckNodUNhcmQg5aSE55CGXG4gICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LnJlcXVlc3RfY2h1X2NhcmQodGhpcy5jaG9vc2VfY2FyZF9kYXRhLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g8J+Up+OAkOaUuei/m+OAkeWHuueJjOWksei0pe+8jOaYvuekuuabtOivpue7hueahOmUmeivr+S/oeaBr1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVycm9yTXNnID0gKGRhdGEgJiYgZGF0YS5tc2cpIHx8IFwi5Ye654mM5aSx6LSlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6I635Y+W55So5oi36YCJ5Lit55qE54mM5Z6LXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZWN0ZWRUeXBlID0gdmFsaWRhdGlvblJlc3VsdC50eXBlIHx8IFwi5pyq55+l54mM5Z6LXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3RlZENvdW50ID0gc2VsZi5jaG9vc2VfY2FyZF9kYXRhLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDojrflj5bkuIrlrrbnmoTniYzlnovkv6Hmga9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0UGxheWVkVHlwZSA9IHNlbGYuX2xhc3RQbGF5ZWRIYW5kVHlwZSB8fCBcIuacquefpVwiXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFBsYXllZENvdW50ID0gc2VsZi5fbGFzdFBsYXllZENhcmRzID8gc2VsZi5fbGFzdFBsYXllZENhcmRzLmxlbmd0aCA6IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeiOt+WPluS4iuWutuWHuueahOeJjOWQjVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RQbGF5ZWRDYXJkTmFtZXMgPSBcIlwiXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5fbGFzdFBsYXllZENhcmRzICYmIHNlbGYuX2xhc3RQbGF5ZWRDYXJkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVzID0gW11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYuX2xhc3RQbGF5ZWRDYXJkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lcy5wdXNoKHNlbGYuX2dldENhcmREaXNwbGF5TmFtZShzZWxmLl9sYXN0UGxheWVkQ2FyZHNbaV0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0UGxheWVkQ2FyZE5hbWVzID0gbmFtZXMuam9pbihcIixcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5p6E5bu66K+m57uG55qE6ZSZ6K+v5o+Q56S6XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGV0YWlsTXNnID0gZXJyb3JNc2dcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnJvck1zZy5pbmRleE9mKFwi5aSn5LiN6L+HXCIpID49IDAgfHwgZXJyb3JNc2cuaW5kZXhPZihcIuaJk+S4jei/h1wiKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g8J+Up+OAkOWinuW8uuOAkeaYvuekuueUqOaIt+mAieeahOeJjOWQjVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB5b3VyQ2FyZHMgPSBzZWxlY3RlZENhcmROYW1lcy5qb2luKFwiLFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOeJjOWei+S4jeWMuemFjeaIlueJjOWkquWwj1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZENvdW50ICE9PSBsYXN0UGxheWVkQ291bnQgJiYgbGFzdFBsYXllZENvdW50ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWxNc2cgPSBcIueJjOaVsOS4jeWMuemFje+8geS4iuWutuWHulwiICsgbGFzdFBsYXllZFR5cGUgKyBcIu+8jOS9oOmAieS6hlwiICsgeW91ckNhcmRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWxlY3RlZFR5cGUgIT09IGxhc3RQbGF5ZWRUeXBlICYmIGxhc3RQbGF5ZWRUeXBlICE9PSBcIueCuOW8uVwiICYmIGxhc3RQbGF5ZWRUeXBlICE9PSBcIueOi+eCuFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbE1zZyA9IFwi54mM5Z6L5LiN5Yy56YWN77yB5LiK5a625Ye6XCIgKyBsYXN0UGxheWVkVHlwZSArIFwi77yM5L2g6YCJ5LqGXCIgKyB5b3VyQ2FyZHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5aKe5by644CR5pi+56S65YW35L2T55qE54mM5ZCN5q+U6L6DXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0UGxheWVkQ2FyZE5hbWVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWxNc2cgPSBcIuaJk+S4jei/h++8geS4iuWutuWHulwiICsgbGFzdFBsYXllZENhcmROYW1lcyArIFwi77yM5L2g6YCJ5LqGXCIgKyB5b3VyQ2FyZHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbE1zZyA9IFwi54mM5aSq5bCP77yB5L2g6YCJ5LqGXCIgKyB5b3VyQ2FyZHMgKyBcIuaJk+S4jei/h+S4iuWutlwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYudGlwc0xhYmVsLnN0cmluZyA9IGRldGFpbE1zZ1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnRpcHNMYWJlbC5zdHJpbmcgPSBcIlwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCAzMDAwKSAgLy8g5bu26ZW/5pi+56S65pe26Ze05YiwM+enklxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fcmVzZXRDYXJkRmxhZ3MoKVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jaG9vc2VfY2FyZF9kYXRhID0gW11cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHlh7rniYzmiJDlip/vvIzkuI3lnKjov5nph4zliKDpmaTmiYvniYzvvIFcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOetieW+heacjeWKoeerr+W5v+aSrSBjYXJkX3BsYXllZCDmtojmga/vvIznlLEgb25PdGhlclBsYXllckNodUNhcmQg5aSE55CGXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnBsYXlpbmdVSV9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmuIXnqbrpgInkuK3nmoTniYxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY2hvb3NlX2NhcmRfZGF0YSA9IFtdXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIF9yZXNldENhcmRGbGFnczogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlj6rph43nva7miYvniYzlrrnlmajkuK3nmoTniYzoioLngrlcbiAgICAgICAgdmFyIGNhcmRQYXJlbnQgPSB0aGlzLmNhcmRzX25vZGVcbiAgICAgICAgaWYgKCFjYXJkUGFyZW50KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn46uIFtfcmVzZXRDYXJkRmxhZ3NdIGNhcmRzX25vZGUg5pyq5a6a5LmJ77yM5bCd6K+V5p+l5om+5omL54mM5a655ZmoXCIpXG4gICAgICAgICAgICAvLyDlsJ3or5XpgJrov4foioLngrnlkI3np7Dmn6Xmib5cbiAgICAgICAgICAgIHZhciBnYW1lU2NlbmVOb2RlID0gdGhpcy5ub2RlLnBhcmVudFxuICAgICAgICAgICAgaWYgKGdhbWVTY2VuZU5vZGUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdhbWVTY2VuZU5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gZ2FtZVNjZW5lTm9kZS5jaGlsZHJlbltpXVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQubmFtZSA9PT0gXCJjYXJkc19ub2RlXCIgfHwgY2hpbGQubmFtZSA9PT0gXCJjYXJkc1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJkUGFyZW50ID0gY2hpbGRcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FyZHNfbm9kZSA9IGNoaWxkXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g6YeN572u5omA5pyJ54mM55qE6YCJ5Lit54q25oCBXG4gICAgICAgIGlmIChjYXJkUGFyZW50KSB7XG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBjYXJkUGFyZW50LmNoaWxkcmVuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY2hpbGRyZW5baV0uZW1pdChcInJlc2V0X2NhcmRfZmxhZ1wiKVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfjq4gW19yZXNldENhcmRGbGFnc10g5om+5LiN5Yiw5omL54mM5a655ZmoXCIpXG4gICAgICAgIH1cbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkea4heepuumAieeJjOWQjuabtOaWsOaYvuekulxuICAgICAgICB0aGlzLl91cGRhdGVTZWxlY3RlZENvdW50RGlzcGxheSgpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHmm7TmlrDlt7LpgInniYzmlbDmmL7npLpcbiAgICAgKiDimqDvuI/jgJDkv67lpI3jgJHnlKjmiLfopoHmsYLor6XkvY3nva7kuI3mmL7npLrku7vkvZXmloflrZfvvIzlt7LnpoHnlKggdGlwc0xhYmVsIOaYvuekulxuICAgICAqIOS7heWcqOaOp+WItuWPsOi+k+WHuuaXpeW/l+eUqOS6juiwg+ivlVxuICAgICAqL1xuICAgIF91cGRhdGVTZWxlY3RlZENvdW50RGlzcGxheTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb3VudCA9IHRoaXMuY2hvb3NlX2NhcmRfZGF0YS5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenOayoeaciemAieS4reeJjO+8jOebtOaOpei/lOWbnlxuICAgICAgICBpZiAoY291bnQgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5bpgInkuK3nmoTniYzmlbDmja5cbiAgICAgICAgdmFyIGNhcmRzVG9QbGF5ID0gdGhpcy5jaG9vc2VfY2FyZF9kYXRhLm1hcChmdW5jdGlvbihjKSB7XG4gICAgICAgICAgICByZXR1cm4gYy5jYXJkX2RhdGEgfHwgY1xuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8g6aqM6K+B54mM5Z6LXG4gICAgICAgIHZhciB2YWxpZGF0aW9uUmVzdWx0ID0gdGhpcy5fdmFsaWRhdGVIYW5kVHlwZShjYXJkc1RvUGxheSlcbiAgICAgICAgXG4gICAgICAgIC8vIOaehOW7uuaYvuekuuaWh+acrO+8iOS7heeUqOS6juaXpeW/l++8iVxuICAgICAgICB2YXIgZGlzcGxheVRleHQgPSBcIuW3sumAiSBcIiArIGNvdW50ICsgXCIg5bygXCJcbiAgICAgICAgaWYgKHZhbGlkYXRpb25SZXN1bHQudmFsaWQpIHtcbiAgICAgICAgICAgIGRpc3BsYXlUZXh0ICs9IFwiIC0gXCIgKyB2YWxpZGF0aW9uUmVzdWx0LnR5cGVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRpc3BsYXlUZXh0ICs9IFwiIC0gXCIgKyB2YWxpZGF0aW9uUmVzdWx0Lm1lc3NhZ2VcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g4pqg77iP44CQ56aB55So44CR5LiN5YaN5ZyoIHRpcHNMYWJlbCDkuIrmmL7npLrmloflrZdcbiAgICAgICAgLy8g5LuF6L6T5Ye65o6n5Yi25Y+w5pel5b+X55So5LqO6LCD6K+VXG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOWHuueJjOebuOWFs1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDlt7Llup/lvIPjgJHlnLDkuLvojrflvpflupXniYzlkI7mt7vliqDliLDmiYvniYxcbiAgICAgKiDimqDvuI/jgJDph43opoHjgJHmraTlh73mlbDlt7Llup/lvIPvvIzkuI3lho3kvb/nlKjvvIFcbiAgICAgKiDlnLDkuLvmiYvniYzmm7TmlrDnlLEgb25MYW5kbG9yZENhcmRzIOWkhOeQhu+8jOmAmui/h+acjeWKoeerryBsYW5kbG9yZF9jYXJkcyDmtojmga9cbiAgICAgKiDkv53nlZnmraTlh73mlbDku4XnlKjkuo7lhbzlrrnvvIzkuI3kvJrop6blj5Hph43mlrDlj5HniYzliqjnlLtcbiAgICAgKi9cbiAgICBwdXNoVGhyZWVDYXJkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeS4jeWGjeaJp+ihjOS7u+S9leaTjeS9nO+8gVxuICAgICAgICAvLyDlupXniYzlt7LpgJrov4cgbGFuZGxvcmRfY2FyZHMg5raI5oGv55Sx5pyN5Yqh56uv55u05o6l5pu05paw5Zyw5Li75omL54mMXG4gICAgICAgIC8vIOatpOWHveaVsOS/neeVmeS7heS4uuWFvOWuueaXp+S7o+eggeW8leeUqFxuICAgICAgICByZXR1cm5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeS7juaJi+eJjOS4reWIoOmZpOW3suWHuueahOeJjO+8iOacjeWKoeerr+mpseWKqO+8iVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGNhcmRzIC0g5pyN5Yqh56uv6L+U5Zue55qE5bey5Ye654mM5pWw5o2uIFt7c3VpdCwgcmFua30sIC4uLl1cbiAgICAgKi9cbiAgICBfcmVtb3ZlQ2FyZHNGcm9tSGFuZDogZnVuY3Rpb24oY2FyZHMpIHtcbiAgICAgICAgaWYgKCFjYXJkcyB8fCBjYXJkcy5sZW5ndGggPT09IDApIHJldHVyblxuXG5cbiAgICAgICAgLy8g6YGN5Y6G6KaB5Yig6Zmk55qE54mMXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FyZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjYXJkVG9SZW1vdmUgPSBjYXJkc1tpXVxuICAgICAgICAgICAgLy8g5Zyo5omL54mM5Lit5p+l5om+5bm25Yig6ZmkXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gdGhpcy5oYW5kQ2FyZHMubGVuZ3RoIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5oYW5kQ2FyZHNbal0ucmFuayA9PT0gY2FyZFRvUmVtb3ZlLnJhbmsgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kQ2FyZHNbal0uc3VpdCA9PT0gY2FyZFRvUmVtb3ZlLnN1aXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kQ2FyZHMuc3BsaWNlKGosIDEpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHmuIXnqbrpgInkuK3nmoTniYzmlbDmja7vvIzpmLLmraLmrovnlZlcbiAgICAgICAgdGhpcy5jaG9vc2VfY2FyZF9kYXRhID0gW11cblxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55So6Z2Z6buY5pu05paw77yM5LiN6Kem5Y+R5Y+R54mM5Yqo55S7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUhhbmRDYXJkc1NpbGVudCh0aGlzLmhhbmRDYXJkcylcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHpnZnpu5jmm7TmlrDmiYvniYzvvIjkuI3op6blj5Hlj5HniYzliqjnlLvvvIlcbiAgICAgKiDnlKjkuo7lh7rniYzlkI7mm7TmlrDmiYvniYzmmL7npLpcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBjYXJkcyAtIOaJi+eJjOaVsOaNrlxuICAgICAqL1xuICAgIF91cGRhdGVIYW5kQ2FyZHNTaWxlbnQ6IGZ1bmN0aW9uKGNhcmRzKSB7XG4gICAgICAgIGlmICghY2FyZHMpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIGlmICghbXlnbG9iYWwpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8vIOaOkuW6j+aJi+eJjFxuICAgICAgICB2YXIgc29ydGVkQ2FyZHMgPSB0aGlzLl9zb3J0Q2FyZHMoY2FyZHMpXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5Y+q5L2/55SoY2FyZHNfbm9kZe+8jOS4jemBjeWOhm5vZGUucGFyZW50XG4gICAgICAgIHZhciBjYXJkc1BhcmVudCA9IHRoaXMuY2FyZHNfbm9kZVxuICAgICAgICBpZiAoIWNhcmRzUGFyZW50KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+OriBbX3VwZGF0ZUhhbmRDYXJkc1NpbGVudF0gY2FyZHNfbm9kZSDmnKrlrprkuYlcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5YWI6ZSA5q+B5omA5pyJ5pen5omL54mM6IqC54K577yM56Gu5L+d5LqL5Lu255uR5ZCs5Zmo6KKr5riF55CGXG4gICAgICAgIHZhciBvbGRDaGlsZHJlbiA9IGNhcmRzUGFyZW50LmNoaWxkcmVuXG4gICAgICAgIGZvciAodmFyIGkgPSBvbGRDaGlsZHJlbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgdmFyIGNoaWxkID0gb2xkQ2hpbGRyZW5baV1cbiAgICAgICAgICAgIC8vIOWFiOWPlua2iOaJgOacieS6i+S7tuebkeWQrFxuICAgICAgICAgICAgY2hpbGQub2ZmKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX1NUQVJUKVxuICAgICAgICAgICAgLy8g5YaN6ZSA5q+B6IqC54K5XG4gICAgICAgICAgICBjaGlsZC5kZXN0cm95KClcbiAgICAgICAgfVxuICAgICAgICAvLyDlho3mrKHnoa7kv53muIXnqbpcbiAgICAgICAgY2FyZHNQYXJlbnQucmVtb3ZlQWxsQ2hpbGRyZW4oKVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkea4heepuumAieS4reeahOeJjOaVsOaNru+8jOmYsuatouaui+eVmVxuICAgICAgICB0aGlzLmNob29zZV9jYXJkX2RhdGEgPSBbXVxuICAgICAgICBcbiAgICAgICAgLy8g6YeN5paw5Yib5bu65omL54mM6IqC54K577yI5peg5Yqo55S777yJXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc29ydGVkQ2FyZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjYXJkRGF0YSA9IHNvcnRlZENhcmRzW2ldXG4gICAgICAgICAgICB2YXIgdGFyZ2V0WCA9IHRoaXMuX2dldENhcmRYKGksIHNvcnRlZENhcmRzLmxlbmd0aCwgQ2FyZExheW91dC5jYXJkU3BhY2luZylcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGNhcmQgPSBjYy5pbnN0YW50aWF0ZSh0aGlzLmNhcmRfcHJlZmFiKVxuICAgICAgICAgICAgaWYgKCFjYXJkKSBjb250aW51ZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjYXJkLnNjYWxlID0gQ2FyZExheW91dC5jYXJkU2NhbGVcbiAgICAgICAgICAgIGNhcmQucGFyZW50ID0gY2FyZHNQYXJlbnRcbiAgICAgICAgICAgIGNhcmQuc2V0UG9zaXRpb24odGFyZ2V0WCwgQ2FyZExheW91dC5jYXJkWSlcbiAgICAgICAgICAgIGNhcmQuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgY2FyZC56SW5kZXggPSBpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBjYXJkQ29tcCA9IGNhcmQuZ2V0Q29tcG9uZW50KFwiY2FyZFwiKVxuICAgICAgICAgICAgaWYgKGNhcmRDb21wKSB7XG4gICAgICAgICAgICAgICAgY2FyZENvbXAuc2hvd0NhcmRzKGNhcmREYXRhLCBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6YeN572u5riy5p+T5ZOI5biM77yM5YWB6K645ZCO57ut5riy5p+TXG4gICAgICAgIHRoaXMuX2xhc3RSZW5kZXJIYXNoID0gSlNPTi5zdHJpbmdpZnkoY2FyZHMpXG4gICAgICAgIFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDimqDvuI/jgJDlt7Llup/lvIPjgJHml6fniYjliKDpmaTmiYvniYzmlrnms5VcbiAgICAgKiDkv53nlZnku4XkuLrlhbzlrrnvvIzmlrDku6PnoIHlupTkvb/nlKggX3JlbW92ZUNhcmRzRnJvbUhhbmRcbiAgICAgKi9cbiAgICBkZXN0b3J5Q2FyZDogZnVuY3Rpb24oYWNjb3VudGlkLCBjaG9vc2VfY2FyZCkge1xuICAgICAgICBpZiAoY2hvb3NlX2NhcmQubGVuZ3RoID09PSAwKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHZhciBkZXN0cm95X2NhcmQgPSBbXVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNob29zZV9jYXJkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gdGhpcy5oYW5kQ2FyZHMubGVuZ3RoIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5oYW5kQ2FyZHNbal0ucmFuayA9PT0gY2hvb3NlX2NhcmRbaV0uY2FyZF9kYXRhLnJhbmsgJiZcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kQ2FyZHNbal0uc3VpdCA9PT0gY2hvb3NlX2NhcmRbaV0uY2FyZF9kYXRhLnN1aXQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5LuO5omL54mM5pWw5o2u5Lit5Yig6ZmkXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZENhcmRzLnNwbGljZShqLCAxKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6YeN5paw5riy5p+TXG4gICAgICAgIHRoaXMucmVuZGVyQ2FyZHModGhpcy5oYW5kQ2FyZHMpXG4gICAgICAgIFxuICAgICAgICAvLyDmmL7npLrlh7rnmoTniYxcbiAgICAgICAgaWYgKHRoaXMuY2FyZHNfbm9kZSAmJiB0aGlzLmNhcmRzX25vZGUuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIG91dENhcmRfbm9kZSA9IHRoaXMuX2dldE91dENhcmROb2RlKGFjY291bnRpZClcbiAgICAgICAgICAgIGlmIChvdXRDYXJkX25vZGUpIHtcbiAgICAgICAgICAgICAgICAvLyDmib7liLDlt7LpgInkuK3nmoTniYzoioLngrlcbiAgICAgICAgICAgICAgICB2YXIgc2VsZWN0ZWROb2RlcyA9IFtdXG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5jYXJkc19ub2RlLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZENvbXAgPSBjaGlsZHJlbltpXS5nZXRDb21wb25lbnQoXCJjYXJkXCIpXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYXJkQ29tcCAmJiBjYXJkQ29tcC5mbGFnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZE5vZGVzLnB1c2goY2hpbGRyZW5baV0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93T3V0Q2FyZHMob3V0Q2FyZF9ub2RlLCBzZWxlY3RlZE5vZGVzKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBfZ2V0T3V0Q2FyZE5vZGU6IGZ1bmN0aW9uKGFjY291bnRpZCkge1xuICAgICAgICB2YXIgZ2FtZVNjZW5lX3NjcmlwdCA9IHRoaXMubm9kZS5wYXJlbnQuZ2V0Q29tcG9uZW50KFwiZ2FtZVNjZW5lXCIpXG4gICAgICAgIHJldHVybiBnYW1lU2NlbmVfc2NyaXB0ID8gZ2FtZVNjZW5lX3NjcmlwdC5nZXRVc2VyT3V0Q2FyZFBvc0J5QWNjb3VudChhY2NvdW50aWQpIDogbnVsbFxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDmj5DnpLrmjInpkq7lip/og71cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIPCflKfjgJDkv67mlLnjgJHmj5DnpLrmjInpkq7ngrnlh7vlpITnkIYgLSDmlLnkuLror7fmsYLmnI3liqHnq6/mj5DnpLpcbiAgICAgKiDkvb/nlKjkuovku7bnm5HlkKzmlrnlvI/lpITnkIblk43lupTvvIzkuI3kvb/nlKjlm57osIPvvIjlm6DkuLrmnI3liqHnq6/kuI3ov5Tlm55jYWxsSW5kZXjvvIlcbiAgICAgKi9cbiAgICBfb25IaW50QnV0dG9uQ2xpY2s6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIC8vIOmHjee9rumAieS4reeahOeJjFxuICAgICAgICB0aGlzLl9yZXNldENhcmRGbGFncygpXG4gICAgICAgIHRoaXMuY2hvb3NlX2NhcmRfZGF0YSA9IFtdXG5cbiAgICAgICAgLy8g6K+35rGC5pyN5Yqh56uv5o+Q56S677yI5LiN5L2/55So5Zue6LCD77yM5L6d6LWW5LqL5Lu255uR5ZCs5Zmo5aSE55CG5ZON5bqU77yJXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAobXlnbG9iYWwgJiYgbXlnbG9iYWwuc29ja2V0KSB7XG4gICAgICAgICAgICAvLyDnm7TmjqXlj5HpgIHmtojmga/vvIzlk43lupTlsIbpgJrov4cgb25IaW50UmVzdWx0IOS6i+S7tuebkeWQrOWZqOWkhOeQhlxuICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LnNlbmRIaW50UmVxdWVzdCgpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeWkhOeQhuacjeWKoeerr+i/lOWbnueahOaPkOekuue7k+aenFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0g5pyN5Yqh56uv6L+U5Zue55qE5o+Q56S65pWw5o2uXG4gICAgICogICAtIGNhcmRzOiDmj5DnpLrnmoTniYzmlbDnu4QgW3tzdWl0LCByYW5rfSwgLi4uXVxuICAgICAqICAgLSBpbmRleDog5b2T5YmN5o+Q56S657Si5byV77yI5LuOMOW8gOWni++8iVxuICAgICAqICAgLSB0b3RhbDog5oC75YWx5pyJ5aSa5bCR56eN5o+Q56S6XG4gICAgICovXG4gICAgX29uSGludFJlc3VsdDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBcbiAgICAgICAgaWYgKCFkYXRhIHx8ICFkYXRhLmNhcmRzIHx8IGRhdGEuY2FyZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5rKh5pyJ6IO96L+H55qE54mM5pe256uL5Y2z5o+Q56S65LiN5Ye677yM5LiN5YaN562J5b6FMS0y56eSXG4gICAgICAgICAgICAvLyB0aGlzLnRpcHNMYWJlbC5zdHJpbmcgPSBcIuayoeacieWPr+WHuueahOeJjFwiXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g56uL5Y2z6Ieq5Yqo5LiN5Ye677yM5LiN5YaN5bu26L+fXG4gICAgICAgICAgICBzZWxmLl9zdG9wUGxheUNvdW50ZG93bigpXG4gICAgICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgICAgIGlmIChteWdsb2JhbCAmJiBteWdsb2JhbC5zb2NrZXQpIHtcbiAgICAgICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQucmVxdWVzdF9idWNodV9jYXJkKFtdLCBudWxsKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNlbGYucGxheWluZ1VJX25vZGUpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnBsYXlpbmdVSV9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIDEuNeenkuWQjua4heepuuaPkOekuuaWh+Wtl1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnRpcHNMYWJlbC5zdHJpbmcgPSBcIlwiXG4gICAgICAgICAgICB9LCAxNTAwKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmAieS4reaPkOekuueahOeJjFxuICAgICAgICB0aGlzLl9zZWxlY3RDYXJkcyhkYXRhLmNhcmRzKVxuXG4gICAgICAgIC8vIPCflKfjgJDkv67mlLnjgJHljrvmjonmoYzpnaLkuIrnmoTnmb3oibLmloflrZfmj5DnpLpcbiAgICAgICAgLy8g5LiN5YaN5pi+56S6IFwi5o+Q56S6OiBY5byg54mMXCIg5L+h5oGvXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmiZjnrqHjgJHlpITnkIbmiZjnrqHnirbmgIHlj5jljJbpgJrnn6VcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIOaJmOeuoeeKtuaAgeaVsOaNrlxuICAgICAqICAgLSBwbGF5ZXJfaWQ6IOeOqeWutklEXG4gICAgICogICAtIHBsYXllcl9uYW1lOiDnjqnlrrblkI3lrZdcbiAgICAgKiAgIC0gaXNfdHJ1c3RlZTog5piv5ZCm5omY566hXG4gICAgICogICAtIHJlYXNvbjog5Y6f5ZugICh0aW1lb3V0L2Rpc2Nvbm5lY3QvcmVjb25uZWN0KVxuICAgICAqL1xuICAgIF9vblRydXN0ZWVTdGF0ZU5vdGlmeTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAvLyDpgJrnn6XmiYDmnInnjqnlrrboioLngrnmm7TmlrDmiZjnrqHnirbmgIFcbiAgICAgICAgaWYgKHRoaXMubm9kZSAmJiB0aGlzLm5vZGUucGFyZW50KSB7XG4gICAgICAgICAgICB0aGlzLm5vZGUucGFyZW50LmVtaXQoXCJ0cnVzdGVlX3N0YXRlX3VwZGF0ZVwiLCBkYXRhKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOafpeaJvuWPr+S7peWHuueahOeJjO+8iOacrOWcsGZhbGxiYWNr77yJXG4gICAgICogQHBhcmFtIHtBcnJheX0gbGFzdFNlbGVjdGVkIC0g5LiK5qyh6YCJ5Lit55qE54mM77yI55So5LqO5om+5LiL5LiA57uE77yJXG4gICAgICogQHJldHVybnMge0FycmF5fSDlj6/ku6Xlh7rnmoTniYxcbiAgICAgKi9cbiAgICBfZmluZFBsYXlhYmxlQ2FyZHM6IGZ1bmN0aW9uKGxhc3RTZWxlY3RlZCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenOayoeacieaJi+eJjO+8jOS4jeWkhOeQhlxuICAgICAgICBpZiAoIXRoaXMuaGFuZENhcmRzIHx8IHRoaXMuaGFuZENhcmRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g57uf6K6h5omL54mMXG4gICAgICAgIHZhciBjYXJkQ291bnRzID0ge31cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmhhbmRDYXJkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJhbmsgPSB0aGlzLmhhbmRDYXJkc1tpXS5yYW5rXG4gICAgICAgICAgICBpZiAoIWNhcmRDb3VudHNbcmFua10pIHtcbiAgICAgICAgICAgICAgICBjYXJkQ291bnRzW3JhbmtdID0gW11cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhcmRDb3VudHNbcmFua10ucHVzaCh0aGlzLmhhbmRDYXJkc1tpXSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5piv5paw5LiA6L2u77yI5b+F6aG75Ye654mM77yJXG4gICAgICAgIGlmICh0aGlzLl9tdXN0UGxheSB8fCAhdGhpcy5fbGFzdFBsYXllZENhcmRzIHx8IHRoaXMuX2xhc3RQbGF5ZWRDYXJkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kU21hbGxlc3RDYXJkcyhjYXJkQ291bnRzKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlpoLmnpzkuI3og73miZPov4fvvIzkuI3mj5DnpLpcbiAgICAgICAgaWYgKCF0aGlzLl9jYW5CZWF0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5bkuIrlrrbniYzlnovkv6Hmga9cbiAgICAgICAgdmFyIGxhc3RUeXBlID0gdGhpcy5fbGFzdFBsYXllZEhhbmRUeXBlIHx8IFwiXCJcbiAgICAgICAgdmFyIGxhc3RSYW5rID0gdGhpcy5fZ2V0TGFzdFBsYXllZE1haW5SYW5rKClcbiAgICAgICAgdmFyIGxhc3RDb3VudCA9IHRoaXMuX2xhc3RQbGF5ZWRDYXJkcy5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIC8vIOagueaNrueJjOWei+afpeaJvuiDveaJk+i/h+eahOacgOWwj+eJjFxuICAgICAgICBzd2l0Y2ggKGxhc3RUeXBlLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgIGNhc2UgXCJzaW5nbGVcIjogY2FzZSBcInNvbG9cIjogY2FzZSBcIuWNleW8oFwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ1NpbmdsZShjYXJkQ291bnRzLCBsYXN0UmFuaylcbiAgICAgICAgICAgIGNhc2UgXCJwYWlyXCI6IGNhc2UgXCJkb3VibGVcIjogY2FzZSBcIuWvueWtkFwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ1BhaXIoY2FyZENvdW50cywgbGFzdFJhbmspXG4gICAgICAgICAgICBjYXNlIFwidHJpcGxlXCI6IGNhc2UgXCJ0aHJlZVwiOiBjYXNlIFwi5LiJ5bygXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRCZWF0aW5nVHJpcGxlKGNhcmRDb3VudHMsIGxhc3RSYW5rLCAwKVxuICAgICAgICAgICAgY2FzZSBcInRyaXBsZXdpdGhzaW5nbGVcIjogY2FzZSBcInNhbmRhaXlpXCI6IGNhc2UgXCLkuInluKbkuIBcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZmluZEJlYXRpbmdUcmlwbGUoY2FyZENvdW50cywgbGFzdFJhbmssIDEpXG4gICAgICAgICAgICBjYXNlIFwidHJpcGxld2l0aHBhaXJcIjogY2FzZSBcInNhbmRhaWR1aVwiOiBjYXNlIFwi5LiJ5bim5LqMXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRCZWF0aW5nVHJpcGxlKGNhcmRDb3VudHMsIGxhc3RSYW5rLCAyKVxuICAgICAgICAgICAgY2FzZSBcImJvbWJcIjogY2FzZSBcInpoYWRhblwiOiBjYXNlIFwi54K45by5XCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRCZWF0aW5nQm9tYihjYXJkQ291bnRzLCBsYXN0UmFuaylcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgLy8g5pyq55+l54mM5Z6L77yM5bCd6K+V5oyJ5byg5pWw5aSE55CGXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRCZWF0aW5nQnlDb3VudChjYXJkQ291bnRzLCBsYXN0Q291bnQsIGxhc3RSYW5rKVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDojrflj5bkuIrlrrblh7rnmoTniYznmoTkuLvniYzngrnmlbBcbiAgICAgKi9cbiAgICBfZ2V0TGFzdFBsYXllZE1haW5SYW5rOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9sYXN0UGxheWVkQ2FyZHMgfHwgdGhpcy5fbGFzdFBsYXllZENhcmRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgfVxuICAgICAgICAvLyDnu5/orqHmr4/kuKrngrnmlbDlh7rnjrDnmoTmrKHmlbBcbiAgICAgICAgdmFyIGNvdW50cyA9IHt9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fbGFzdFBsYXllZENhcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmFuayA9IHRoaXMuX2xhc3RQbGF5ZWRDYXJkc1tpXS5yYW5rXG4gICAgICAgICAgICBjb3VudHNbcmFua10gPSAoY291bnRzW3JhbmtdIHx8IDApICsgMVxuICAgICAgICB9XG4gICAgICAgIC8vIOaJvuWHuuWHuueOsOasoeaVsOacgOWkmueahOeCueaVsO+8iOS4u+eJjO+8iVxuICAgICAgICB2YXIgbWF4Q291bnQgPSAwXG4gICAgICAgIHZhciBtYWluUmFuayA9IDBcbiAgICAgICAgZm9yICh2YXIgcmFuayBpbiBjb3VudHMpIHtcbiAgICAgICAgICAgIGlmIChjb3VudHNbcmFua10gPiBtYXhDb3VudCkge1xuICAgICAgICAgICAgICAgIG1heENvdW50ID0gY291bnRzW3JhbmtdXG4gICAgICAgICAgICAgICAgbWFpblJhbmsgPSBwYXJzZUludChyYW5rKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYWluUmFua1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog5om+5pyA5bCP55qE54mM77yI5paw5LiA6L2u5pe25L2/55So77yJXG4gICAgICovXG4gICAgX2ZpbmRTbWFsbGVzdENhcmRzOiBmdW5jdGlvbihjYXJkQ291bnRzKSB7XG4gICAgICAgIC8vIOaMieeCueaVsOS7juWwj+WIsOWkp+aOkuW6j1xuICAgICAgICB2YXIgcmFua3MgPSBPYmplY3Qua2V5cyhjYXJkQ291bnRzKS5tYXAoZnVuY3Rpb24ocikgeyByZXR1cm4gcGFyc2VJbnQocikgfSkuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhIC0gYiB9KVxuICAgICAgICBcbiAgICAgICAgLy8g5LyY5YWI5Ye65Y2V5bygXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gcmFua3NbaV1cbiAgICAgICAgICAgIGlmIChjYXJkQ291bnRzW3JhbmtdLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbY2FyZENvdW50c1tyYW5rXVswXV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5rKh5pyJ5Y2V5byg5YiZ5Ye65pyA5bCP55qE5a+55a2QXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gcmFua3NbaV1cbiAgICAgICAgICAgIGlmIChjYXJkQ291bnRzW3JhbmtdLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYXJkQ291bnRzW3JhbmtdXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWHuuacgOWwj+eahOS4ieW8oFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmFuayA9IHJhbmtzW2ldXG4gICAgICAgICAgICBpZiAoY2FyZENvdW50c1tyYW5rXS5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FyZENvdW50c1tyYW5rXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlh7rmnIDlsI/nmoTngrjlvLlcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByYW5rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJhbmsgPSByYW5rc1tpXVxuICAgICAgICAgICAgaWYgKGNhcmRDb3VudHNbcmFua10ubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhcmRDb3VudHNbcmFua11cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5YWc5bqV77ya5Ye65pyA5bCP55qE54mMXG4gICAgICAgIGlmIChyYW5rcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gW2NhcmRDb3VudHNbcmFua3NbMF1dWzBdXVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDmib7og73miZPov4fnmoTmnIDlsI/ljZXlvKBcbiAgICAgKi9cbiAgICBfZmluZEJlYXRpbmdTaW5nbGU6IGZ1bmN0aW9uKGNhcmRDb3VudHMsIHRhcmdldFJhbmspIHtcbiAgICAgICAgdmFyIHJhbmtzID0gT2JqZWN0LmtleXMoY2FyZENvdW50cykubWFwKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHBhcnNlSW50KHIpIH0pLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAtIGIgfSlcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByYW5rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJhbmsgPSByYW5rc1tpXVxuICAgICAgICAgICAgaWYgKHJhbmsgPiB0YXJnZXRSYW5rKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtjYXJkQ291bnRzW3JhbmtdWzBdXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIOayoeacieiDveaJk+i/h+eahOWNleW8oO+8jOWwneivleeCuOW8uVxuICAgICAgICByZXR1cm4gdGhpcy5fZmluZFNtYWxsZXN0Qm9tYihjYXJkQ291bnRzKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog5om+6IO95omT6L+H55qE5pyA5bCP5a+55a2QXG4gICAgICovXG4gICAgX2ZpbmRCZWF0aW5nUGFpcjogZnVuY3Rpb24oY2FyZENvdW50cywgdGFyZ2V0UmFuaykge1xuICAgICAgICB2YXIgcmFua3MgPSBPYmplY3Qua2V5cyhjYXJkQ291bnRzKS5tYXAoZnVuY3Rpb24ocikgeyByZXR1cm4gcGFyc2VJbnQocikgfSkuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhIC0gYiB9KVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmFuayA9IHJhbmtzW2ldXG4gICAgICAgICAgICBpZiAocmFuayA+IHRhcmdldFJhbmsgJiYgY2FyZENvdW50c1tyYW5rXS5sZW5ndGggPj0gMikge1xuICAgICAgICAgICAgICAgIHJldHVybiBbY2FyZENvdW50c1tyYW5rXVswXSwgY2FyZENvdW50c1tyYW5rXVsxXV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyDmsqHmnInog73miZPov4fnmoTlr7nlrZDvvIzlsJ3or5XngrjlvLlcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRTbWFsbGVzdEJvbWIoY2FyZENvdW50cylcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOaJvuiDveaJk+i/h+eahOacgOWwj+S4ieW8oO+8iOW4puaIluS4jeW4pu+8iVxuICAgICAqL1xuICAgIF9maW5kQmVhdGluZ1RyaXBsZTogZnVuY3Rpb24oY2FyZENvdW50cywgdGFyZ2V0UmFuaywga2lja2Vycykge1xuICAgICAgICB2YXIgcmFua3MgPSBPYmplY3Qua2V5cyhjYXJkQ291bnRzKS5tYXAoZnVuY3Rpb24ocikgeyByZXR1cm4gcGFyc2VJbnQocikgfSkuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhIC0gYiB9KVxuICAgICAgICBcbiAgICAgICAgLy8g5om+5LiJ5bygXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gcmFua3NbaV1cbiAgICAgICAgICAgIGlmIChyYW5rID4gdGFyZ2V0UmFuayAmJiBjYXJkQ291bnRzW3JhbmtdLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtjYXJkQ291bnRzW3JhbmtdWzBdLCBjYXJkQ291bnRzW3JhbmtdWzFdLCBjYXJkQ291bnRzW3JhbmtdWzJdXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOmcgOimgeW4pueJjFxuICAgICAgICAgICAgICAgIGlmIChraWNrZXJzID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2lja2VyQ2FyZHMgPSB0aGlzLl9maW5kS2lja2VyQ2FyZHMoY2FyZENvdW50cywgcmFuaywga2lja2VycylcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtpY2tlckNhcmRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KGtpY2tlckNhcmRzKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5bCd6K+V5LuO5Zub5byg5Lit5ouG5LiJ5bygXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gcmFua3NbaV1cbiAgICAgICAgICAgIGlmIChyYW5rID4gdGFyZ2V0UmFuayAmJiBjYXJkQ291bnRzW3JhbmtdLmxlbmd0aCA9PT0gNCkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBbY2FyZENvdW50c1tyYW5rXVswXSwgY2FyZENvdW50c1tyYW5rXVsxXSwgY2FyZENvdW50c1tyYW5rXVsyXV1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoa2lja2VycyA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtpY2tlckNhcmRzID0gdGhpcy5fZmluZEtpY2tlckNhcmRzKGNhcmRDb3VudHMsIHJhbmssIGtpY2tlcnMpXG4gICAgICAgICAgICAgICAgICAgIGlmIChraWNrZXJDYXJkcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChraWNrZXJDYXJkcylcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWwneivleeCuOW8uVxuICAgICAgICByZXR1cm4gdGhpcy5fZmluZFNtYWxsZXN0Qm9tYihjYXJkQ291bnRzKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog5om+5bim54mMXG4gICAgICovXG4gICAgX2ZpbmRLaWNrZXJDYXJkczogZnVuY3Rpb24oY2FyZENvdW50cywgZXhjbHVkZVJhbmssIGNvdW50KSB7XG4gICAgICAgIHZhciByYW5rcyA9IE9iamVjdC5rZXlzKGNhcmRDb3VudHMpLm1hcChmdW5jdGlvbihyKSB7IHJldHVybiBwYXJzZUludChyKSB9KS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgLSBiIH0pXG4gICAgICAgIFxuICAgICAgICB2YXIga2lja2VycyA9IFtdXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFua3MubGVuZ3RoICYmIGtpY2tlcnMubGVuZ3RoIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJhbmsgPSByYW5rc1tpXVxuICAgICAgICAgICAgaWYgKHJhbmsgIT09IGV4Y2x1ZGVSYW5rKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF2YWlsYWJsZSA9IE1hdGgubWluKGNhcmRDb3VudHNbcmFua10ubGVuZ3RoLCBjb3VudCAtIGtpY2tlcnMubGVuZ3RoKVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgYXZhaWxhYmxlOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAga2lja2Vycy5wdXNoKGNhcmRDb3VudHNbcmFua11bal0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ga2lja2Vycy5sZW5ndGggPT09IGNvdW50ID8ga2lja2VycyA6IG51bGxcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOaJvuiDveaJk+i/h+eahOacgOWwj+eCuOW8uVxuICAgICAqL1xuICAgIF9maW5kQmVhdGluZ0JvbWI6IGZ1bmN0aW9uKGNhcmRDb3VudHMsIHRhcmdldFJhbmspIHtcbiAgICAgICAgdmFyIHJhbmtzID0gT2JqZWN0LmtleXMoY2FyZENvdW50cykubWFwKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHBhcnNlSW50KHIpIH0pLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAtIGIgfSlcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByYW5rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJhbmsgPSByYW5rc1tpXVxuICAgICAgICAgICAgaWYgKHJhbmsgPiB0YXJnZXRSYW5rICYmIGNhcmRDb3VudHNbcmFua10ubGVuZ3RoID09PSA0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhcmRDb3VudHNbcmFua11cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyDmsqHmnInog73miZPov4fnmoTngrjlvLnvvIzlsJ3or5XnjovngrhcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRSb2NrZXQoY2FyZENvdW50cylcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOaJvuacgOWwj+eahOeCuOW8uVxuICAgICAqL1xuICAgIF9maW5kU21hbGxlc3RCb21iOiBmdW5jdGlvbihjYXJkQ291bnRzKSB7XG4gICAgICAgIHZhciByYW5rcyA9IE9iamVjdC5rZXlzKGNhcmRDb3VudHMpLm1hcChmdW5jdGlvbihyKSB7IHJldHVybiBwYXJzZUludChyKSB9KS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgLSBiIH0pXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gcmFua3NbaV1cbiAgICAgICAgICAgIGlmIChjYXJkQ291bnRzW3JhbmtdLmxlbmd0aCA9PT0gNCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYXJkQ291bnRzW3JhbmtdXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRSb2NrZXQoY2FyZENvdW50cylcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOaJvueOi+eCuFxuICAgICAqL1xuICAgIF9maW5kUm9ja2V0OiBmdW5jdGlvbihjYXJkQ291bnRzKSB7XG4gICAgICAgIHZhciBqb2tlcnMgPSBbXVxuICAgICAgICBpZiAoY2FyZENvdW50c1sxNl0gJiYgY2FyZENvdW50c1sxNl0ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgam9rZXJzLnB1c2goY2FyZENvdW50c1sxNl1bMF0pXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNhcmRDb3VudHNbMTddICYmIGNhcmRDb3VudHNbMTddLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGpva2Vycy5wdXNoKGNhcmRDb3VudHNbMTddWzBdKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBqb2tlcnMubGVuZ3RoID09PSAyID8gam9rZXJzIDogbnVsbFxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog5oyJ5byg5pWw5om+6IO95omT6L+H55qE54mMXG4gICAgICovXG4gICAgX2ZpbmRCZWF0aW5nQnlDb3VudDogZnVuY3Rpb24oY2FyZENvdW50cywgY291bnQsIHRhcmdldFJhbmspIHtcbiAgICAgICAgLy8g566A5Y2V5a6e546w77ya5oyJ5byg5pWw5aSE55CGXG4gICAgICAgIGlmIChjb3VudCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRCZWF0aW5nU2luZ2xlKGNhcmRDb3VudHMsIHRhcmdldFJhbmspXG4gICAgICAgIH0gZWxzZSBpZiAoY291bnQgPT09IDIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ1BhaXIoY2FyZENvdW50cywgdGFyZ2V0UmFuaylcbiAgICAgICAgfSBlbHNlIGlmIChjb3VudCA9PT0gMykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRCZWF0aW5nVHJpcGxlKGNhcmRDb3VudHMsIHRhcmdldFJhbmssIDApXG4gICAgICAgIH0gZWxzZSBpZiAoY291bnQgPT09IDQpIHtcbiAgICAgICAgICAgIC8vIOWPr+iDveaYr+eCuOW8uVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRCZWF0aW5nQm9tYihjYXJkQ291bnRzLCB0YXJnZXRSYW5rKVxuICAgICAgICB9IGVsc2UgaWYgKGNvdW50ID49IDUpIHtcbiAgICAgICAgICAgIC8vIOWPr+iDveaYr+mhuuWtkOOAgei/nuWvueetie+8jOaaguS4jeaUr+aMgeaPkOekulxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDpgInkuK3mjIflrprnmoTniYxcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBjYXJkcyAtIOimgemAieS4reeahOeJjFxuICAgICAqL1xuICAgIF9zZWxlY3RDYXJkczogZnVuY3Rpb24oY2FyZHMpIHtcbiAgICAgICAgaWYgKCFjYXJkcyB8fCBjYXJkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cblxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5Y+q5LuO5omL54mM5a655Zmo5Lit5p+l5om+77yM5LiN6YGN5Y6Gbm9kZS5wYXJlbnRcbiAgICAgICAgdmFyIGNhcmRQYXJlbnQgPSB0aGlzLmNhcmRzX25vZGVcbiAgICAgICAgaWYgKCFjYXJkUGFyZW50KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn46uIFtfc2VsZWN0Q2FyZHNdIGNhcmRzX25vZGUg5pyq5a6a5LmJ77yM5bCd6K+V5p+l5om+5omL54mM5a655ZmoXCIpXG4gICAgICAgICAgICAvLyDlsJ3or5XpgJrov4foioLngrnlkI3np7Dmn6Xmib5cbiAgICAgICAgICAgIHZhciBnYW1lU2NlbmVOb2RlID0gdGhpcy5ub2RlLnBhcmVudFxuICAgICAgICAgICAgaWYgKGdhbWVTY2VuZU5vZGUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdhbWVTY2VuZU5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gZ2FtZVNjZW5lTm9kZS5jaGlsZHJlbltpXVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hpbGQubmFtZSA9PT0gXCJjYXJkc19ub2RlXCIgfHwgY2hpbGQubmFtZSA9PT0gXCJjYXJkc1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJkUGFyZW50ID0gY2hpbGRcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FyZHNfbm9kZSA9IGNoaWxkXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjYXJkUGFyZW50KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+OriBbX3NlbGVjdENhcmRzXSDmib7kuI3liLDmiYvniYzlrrnlmahcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNoaWxkcmVuID0gY2FyZFBhcmVudC5jaGlsZHJlblxuXG4gICAgICAgIHZhciBmb3VuZENvdW50ID0gMFxuICAgICAgICB2YXIgYWxyZWFkeU1hdGNoZWQgPSB7fSAgLy8g8J+Up+OAkOaWsOWinuOAkeiusOW9leW3suWMuemFjeeahOeJjO+8jOmYsuatoumHjeWkjeWMuemFjVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjYXJkTm9kZSA9IGNoaWxkcmVuW2ldXG4gICAgICAgICAgICB2YXIgY2FyZENvbXAgPSBjYXJkTm9kZS5nZXRDb21wb25lbnQoXCJjYXJkXCIpXG4gICAgICAgICAgICBpZiAoY2FyZENvbXAgJiYgY2FyZENvbXAuY2FyZF9kYXRhKSB7XG4gICAgICAgICAgICAgICAgLy8g5qOA5p+l6L+Z5byg54mM5piv5ZCm5Zyo6KaB6YCJ5Lit55qE54mM5LitXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjYXJkcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWF0Y2hLZXkgPSBjYXJkc1tqXS5zdWl0ICsgXCJfXCIgKyBjYXJkc1tqXS5yYW5rXG4gICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmo4Dmn6XmmK/lkKblt7Lnu4/ljLnphY3ov4fov5nlvKDniYxcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFscmVhZHlNYXRjaGVkW21hdGNoS2V5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYXJkQ29tcC5jYXJkX2RhdGEucmFuayA9PT0gY2FyZHNbal0ucmFuayAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZENvbXAuY2FyZF9kYXRhLnN1aXQgPT09IGNhcmRzW2pdLnN1aXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmo4Dmn6XmmK/lkKblt7Lnu4/pgInkuK1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2FyZENvbXAuZmxhZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOmAieS4rei/meW8oOeJjFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRDb21wLmZsYWcgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FyZE5vZGUueSArPSAyMCAgLy8g5ZCR5LiK56e75Yqo6KGo56S66YCJ5LitXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaG9vc2VfY2FyZF9kYXRhLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXJkaWQ6IGNhcmRDb21wLmNhcmRfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRfZGF0YTogY2FyZENvbXAuY2FyZF9kYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZENvdW50KytcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbHJlYWR5TWF0Y2hlZFttYXRjaEtleV0gPSB0cnVlICAvLyDmoIforrDlt7LljLnphY1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICBpZiAoZm91bmRDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy50aXBzTGFiZWwuc3RyaW5nID0gXCLmj5DnpLrlpLHotKXvvIzor7fmiYvliqjpgInniYxcIlxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYudGlwc0xhYmVsLnN0cmluZyA9IFwiXCJcbiAgICAgICAgICAgIH0sIDIwMDApXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY2xlYXJPdXRab25lOiBmdW5jdGlvbihhY2NvdW50aWQpIHtcbiAgICAgICAgdmFyIG91dENhcmRfbm9kZSA9IHRoaXMuX2dldE91dENhcmROb2RlKGFjY291bnRpZClcbiAgICAgICAgaWYgKG91dENhcmRfbm9kZSkge1xuICAgICAgICAgICAgb3V0Q2FyZF9ub2RlLnJlbW92ZUFsbENoaWxkcmVuKHRydWUpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2hvd091dENhcmRzOiBmdW5jdGlvbihvdXRDYXJkX25vZGUsIGNhcmRzKSB7XG4gICAgICAgIGlmICghb3V0Q2FyZF9ub2RlIHx8ICFjYXJkcyB8fCBjYXJkcy5sZW5ndGggPT09IDApIHJldHVyblxuICAgICAgICBcbiAgICAgICAgb3V0Q2FyZF9ub2RlLnJlbW92ZUFsbENoaWxkcmVuKHRydWUpXG4gICAgICAgIFxuICAgICAgICB2YXIgY291bnQgPSBjYXJkcy5sZW5ndGhcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2FyZCA9IGNhcmRzW2ldXG4gICAgICAgICAgICBvdXRDYXJkX25vZGUuYWRkQ2hpbGQoY2FyZCwgaSlcbiAgICAgICAgICAgIGNhcmQuc2V0U2NhbGUoQ2FyZExheW91dC5vdXRDYXJkU2NhbGUsIENhcmRMYXlvdXQub3V0Q2FyZFNjYWxlKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgeCA9IHRoaXMuX2dldENhcmRYKGksIGNvdW50LCBDYXJkTGF5b3V0Lm91dENhcmRTcGFjaW5nKVxuICAgICAgICAgICAgY2FyZC5zZXRQb3NpdGlvbih4LCAwKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOa4uOaIj+eKtuaAgeaBouWkje+8iOaWree6v+mHjei/nu+8iVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIHJlc3RvcmVHYW1lU3RhdGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBnYW1lU3RhdGUgPSBkYXRhLmdhbWVfc3RhdGVcbiAgICAgICAgaWYgKCFnYW1lU3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruOAkeiuvue9rua4uOaIj+mYtuautVxuICAgICAgICBpZiAoZ2FtZVN0YXRlLnBoYXNlID09PSBcImJpZGRpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5fZ2FtZVBoYXNlID0gXCJiaWRkaW5nXCJcbiAgICAgICAgICAgIHRoaXMuX2JpZGRpbmdQaGFzZSA9IFwiYmlkZGluZ1wiXG4gICAgICAgIH0gZWxzZSBpZiAoZ2FtZVN0YXRlLnBoYXNlID09PSBcInBsYXlpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5fZ2FtZVBoYXNlID0gXCJwbGF5aW5nXCJcbiAgICAgICAgICAgIHRoaXMuX2JpZGRpbmdQaGFzZSA9IFwiaWRsZVwiXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOaBouWkjeeOqeWutuS/oeaBr1xuICAgICAgICBpZiAoZ2FtZVN0YXRlLnBsYXllcnMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2FtZVN0YXRlLnBsYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcCA9IGdhbWVTdGF0ZS5wbGF5ZXJzW2ldXG4gICAgICAgICAgICAgICAgaWYgKHAuaXNfbGFuZGxvcmQgJiYgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEubWFzdGVyX2FjY291bnRpZCA9IHAuaWRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHpgJrnn6Xlhbbku5bnjqnlrrboioLngrnmm7TmlrBcbiAgICAgICAgICAgIGlmICh0aGlzLm5vZGUgJiYgdGhpcy5ub2RlLnBhcmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMubm9kZS5wYXJlbnQuZW1pdChcInBsYXllcnNfcmVzdG9yZWRfZXZlbnRcIiwge1xuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJzOiBnYW1lU3RhdGUucGxheWVyc1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHmgaLlpI3miYvniYxcbiAgICAgICAgaWYgKGdhbWVTdGF0ZS5oYW5kKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7jgJHph43nva7muLLmn5Plk4jluIzvvIznoa7kv53miYvniYzkvJrooqvmm7TmlrBcbiAgICAgICAgICAgIHRoaXMuX2xhc3RSZW5kZXJIYXNoID0gXCJcIlxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDkv53lrZjmiYvniYzmlbDmja5cbiAgICAgICAgICAgIHRoaXMuaGFuZENhcmRzID0gZ2FtZVN0YXRlLmhhbmRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5qCH6K6w5Y+R54mM5a6M5oiQXG4gICAgICAgICAgICB0aGlzLmNhcmRzUmVhZHkgPSB0cnVlXG4gICAgICAgICAgICB0aGlzLmZhcGFpX2VuZCA9IHRydWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruOAkeS9v+eUqOmdmem7mOabtOaWsO+8jOS4jeinpuWPkeWPkeeJjOWKqOeUu1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlSGFuZENhcmRzU2lsZW50KHRoaXMuaGFuZENhcmRzKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmgaLlpI3lupXniYxcbiAgICAgICAgaWYgKGdhbWVTdGF0ZS5ib3R0b21fY2FyZHMgJiYgZ2FtZVN0YXRlLmJvdHRvbV9jYXJkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLmJvdHRvbUNhcmRzID0gZ2FtZVN0YXRlLmJvdHRvbV9jYXJkc1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmJvdHRvbV9jYXJkLmxlbmd0aCAmJiBpIDwgdGhpcy5ib3R0b21DYXJkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmJvdHRvbV9jYXJkW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYXJkQ29tcCA9IHRoaXMuYm90dG9tX2NhcmRbaV0uZ2V0Q29tcG9uZW50KFwiY2FyZFwiKVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FyZENvbXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRDb21wLnNob3dDYXJkcyh0aGlzLmJvdHRvbUNhcmRzW2ldKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5oGi5aSN5LiK5a625Ye655qE54mMXG4gICAgICAgIGlmIChnYW1lU3RhdGUubGFzdF9wbGF5ZWQgJiYgZ2FtZVN0YXRlLmxhc3RfcGxheWVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2xhc3RQbGF5ZWRDYXJkcyA9IGdhbWVTdGF0ZS5sYXN0X3BsYXllZFxuICAgICAgICAgICAgdGhpcy5fbGFzdFBsYXllZEhhbmRUeXBlID0gZ2FtZVN0YXRlLmxhc3RfcGxheWVkLmhhbmRfdHlwZSB8fCBcIlwiXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHmmL7npLrkuIrlrrblh7rnmoTniYxcbiAgICAgICAgICAgIGlmIChnYW1lU3RhdGUubGFzdF9wbGF5ZXJfaWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgZ2FtZVNjZW5lX3NjcmlwdCA9IHRoaXMubm9kZS5wYXJlbnQuZ2V0Q29tcG9uZW50KFwiZ2FtZVNjZW5lXCIpXG4gICAgICAgICAgICAgICAgaWYgKGdhbWVTY2VuZV9zY3JpcHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG91dENhcmRfbm9kZSA9IGdhbWVTY2VuZV9zY3JpcHQuZ2V0VXNlck91dENhcmRQb3NCeUFjY291bnQoZ2FtZVN0YXRlLmxhc3RfcGxheWVyX2lkKVxuICAgICAgICAgICAgICAgICAgICBpZiAob3V0Q2FyZF9ub2RlICYmIHRoaXMuY2FyZF9wcmVmYWIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOa4hemZpOaXp+eahOWHuueJjFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0Q2FyZF9ub2RlLnJlbW92ZUFsbENoaWxkcmVuKClcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5pi+56S65LiK5a625Ye655qE54mMXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbm9kZV9jYXJkcyA9IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdhbWVTdGF0ZS5sYXN0X3BsYXllZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjYXJkID0gY2MuaW5zdGFudGlhdGUodGhpcy5jYXJkX3ByZWZhYilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FyZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZFNjcmlwdCA9IGNhcmQuZ2V0Q29tcG9uZW50KFwiY2FyZFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FyZFNjcmlwdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FyZFNjcmlwdC5zaG93Q2FyZHMoZ2FtZVN0YXRlLmxhc3RfcGxheWVkW2ldLCB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SUQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZV9jYXJkcy5wdXNoKGNhcmQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93T3V0Q2FyZHMob3V0Q2FyZF9ub2RlLCBub2RlX2NhcmRzKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmgaLlpI3lh7rniYzova7mrKFcbiAgICAgICAgaWYgKGdhbWVTdGF0ZS5waGFzZSA9PT0gXCJwbGF5aW5nXCIgJiYgZ2FtZVN0YXRlLmN1cnJlbnRfdHVybikge1xuICAgICAgICAgICAgdmFyIG15UGxheWVySWQgPSB3aW5kb3cubXlnbG9iYWwuc29ja2V0LmdldFBsYXllckluZm8oKS5pZCB8fCB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SURcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruOAkemakOiXj+aKouWcsOS4u1VJXG4gICAgICAgICAgICB0aGlzLl9oaWRlUm9iVUkoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoU3RyaW5nKGdhbWVTdGF0ZS5jdXJyZW50X3R1cm4pID09PSBTdHJpbmcobXlQbGF5ZXJJZCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXlpbmdVSV9ub2RlLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5L+d5a2Y5Ye654mM54q25oCBXG4gICAgICAgICAgICAgICAgdGhpcy5fbXVzdFBsYXkgPSBnYW1lU3RhdGUubXVzdF9wbGF5IHx8IGZhbHNlXG4gICAgICAgICAgICAgICAgdGhpcy5fY2FuQmVhdCA9IGdhbWVTdGF0ZS5jYW5fYmVhdCB8fCBmYWxzZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHlkK/liqjlh7rniYzlgJLorqHml7bvvIjlpoLmnpzmnI3liqHnq6/mj5DkvpvkuobliankvZnml7bpl7TvvIlcbiAgICAgICAgICAgICAgICAvLyDms6jmhI/vvJrmnI3liqHnq6/lupTor6XlnKjph43ov57lkI7lj5HpgIEgY2FuX2NodV9jYXJkX25vdGlmeSDmtojmga/mnaXlkK/liqjlgJLorqHml7ZcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucGxheWluZ1VJX25vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbGF5aW5nVUlfbm9kZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeWmguaenOaYr+aKouWcsOS4u+mYtuautVxuICAgICAgICBpZiAoZ2FtZVN0YXRlLnBoYXNlID09PSBcImJpZGRpbmdcIikge1xuICAgICAgICAgICAgLy8g5rOo5oSP77ya5pyN5Yqh56uv5bqU6K+l5Zyo6YeN6L+e5ZCO5Y+R6YCBIGNhbGxfbGFuZGxvcmRfdHVybl9ub3RpZnkg5raI5oGv5p2l5pi+56S65oqi5Zyw5Li75oyJ6ZKuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIPCflKfjgJDmlrDlop7jgJHlupXniYzmmL7npLrlkozlnLDkuLvmiYvniYzmm7TmlrBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5pi+56S65bqV54mM57uZ5omA5pyJ546p5a6277yI57+754mM5Yqo55S777yJXG4gICAgICogQHBhcmFtIHtBcnJheX0gY2FyZHMgLSDlupXniYzmlbDmja5cbiAgICAgKi9cbiAgICBfc2hvd0JvdHRvbUNhcmRzVG9BbGw6IGZ1bmN0aW9uKGNhcmRzKSB7XG4gICAgICAgIGlmICghY2FyZHMgfHwgY2FyZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOW6leeJjOaYvuekulxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhcmRzLmxlbmd0aCAmJiBpIDwgdGhpcy5ib3R0b21fY2FyZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNhcmROb2RlID0gdGhpcy5ib3R0b21fY2FyZFtpXVxuICAgICAgICAgICAgaWYgKCFjYXJkTm9kZSkgY29udGludWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGNhcmRTY3JpcHQgPSBjYXJkTm9kZS5nZXRDb21wb25lbnQoXCJjYXJkXCIpXG4gICAgICAgICAgICBpZiAoY2FyZFNjcmlwdCkge1xuICAgICAgICAgICAgICAgIGNhcmRTY3JpcHQuc2hvd0NhcmRzKGNhcmRzW2ldKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR6Z2Z6buY5pu05paw5Zyw5Li755qE5omL54mM77yI5LiN6Kem5Y+R5Y+R54mM5Yqo55S777yJXG4gICAgICog5Y+q5Zyo5Zyw5Li75pS25YiwIExBTkRMT1JEX0NBUkRTIOa2iOaBr+aXtuiwg+eUqFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGNhcmRzIC0g5Zyw5Li755qE5a6M5pW05omL54mM77yI5ZCr5bqV54mM77yJXG4gICAgICovXG4gICAgX3VwZGF0ZUxhbmRsb3JkSGFuZENhcmRzOiBmdW5jdGlvbihjYXJkcykge1xuICAgICAgICBpZiAoIWNhcmRzIHx8IGNhcmRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAoIW15Z2xvYmFsKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyDmjpLluo/miYvniYxcbiAgICAgICAgdmFyIHNvcnRlZENhcmRzID0gdGhpcy5fc29ydENhcmRzKGNhcmRzKVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeehruS/neaJi+eJjOWuueWZqOWtmOWcqFxuICAgICAgICB2YXIgY2FyZHNQYXJlbnQgPSB0aGlzLmNhcmRzX25vZGVcbiAgICAgICAgaWYgKCFjYXJkc1BhcmVudCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfg48gW191cGRhdGVMYW5kbG9yZEhhbmRDYXJkc10gY2FyZHNfbm9kZSDmnKrlrprkuYlcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmuIXnkIbml6fmiYvniYzoioLngrlcbiAgICAgICAgY2FyZHNQYXJlbnQucmVtb3ZlQWxsQ2hpbGRyZW4oKVxuICAgICAgICBcbiAgICAgICAgLy8g6YeN5paw5Yib5bu65omL54mM6IqC54K577yI5peg5Yqo55S777yJXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc29ydGVkQ2FyZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjYXJkRGF0YSA9IHNvcnRlZENhcmRzW2ldXG4gICAgICAgICAgICB2YXIgdGFyZ2V0WCA9IHRoaXMuX2dldENhcmRYKGksIHNvcnRlZENhcmRzLmxlbmd0aCwgQ2FyZExheW91dC5jYXJkU3BhY2luZylcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGNhcmQgPSBjYy5pbnN0YW50aWF0ZSh0aGlzLmNhcmRfcHJlZmFiKVxuICAgICAgICAgICAgaWYgKCFjYXJkKSBjb250aW51ZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjYXJkLnNjYWxlID0gQ2FyZExheW91dC5jYXJkU2NhbGVcbiAgICAgICAgICAgIGNhcmQucGFyZW50ID0gY2FyZHNQYXJlbnQgIC8vIPCflKfjgJDkv67lpI3jgJHkvb/nlKjnoa7lrprnmoTmiYvniYzlrrnlmahcbiAgICAgICAgICAgIGNhcmQuc2V0UG9zaXRpb24odGFyZ2V0WCwgQ2FyZExheW91dC5jYXJkWSlcbiAgICAgICAgICAgIGNhcmQuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgY2FyZC56SW5kZXggPSBpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBjYXJkQ29tcCA9IGNhcmQuZ2V0Q29tcG9uZW50KFwiY2FyZFwiKVxuICAgICAgICAgICAgaWYgKGNhcmRDb21wKSB7XG4gICAgICAgICAgICAgICAgY2FyZENvbXAuc2hvd0NhcmRzKGNhcmREYXRhLCBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6YeN572u5riy5p+T5ZOI5biM77yM5YWB6K645ZCO57ut5riy5p+TXG4gICAgICAgIHRoaXMuX2xhc3RSZW5kZXJIYXNoID0gSlNPTi5zdHJpbmdpZnkoY2FyZHMpXG4gICAgICAgIFxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDwn5SK44CQ5Ye654mM6Z+z5pWI57O757uf44CR5L2/55So5a6e6ZmF6Z+z5pWI5paH5Lu2XG4gICAgLy8g6Z+z5pWI5paH5Lu25ZG95ZCN6KeE5YiZ77yaXG4gICAgLy8gLSDnlLfniYg6IG1fY3Bfe3R5cGV9X3tyYW5rfS5tcDMg5oiWIG1fY3Bfe3R5cGV9Lm1wM1xuICAgIC8vIC0g5aWz54mIOiBtX2NwX252X3t0eXBlfV97cmFua30ubXAzIOaIliBtX2NwX252X3t0eXBlfS5tcDNcbiAgICAvLyDms6jmhI/vvJrlpKflsI/njosocmFuaz0xNC8xNSnmsqHmnInlr7nlrZDpn7PmlYjvvIzlm6DkuLrkuKTlvKDnjovmmK/njovngrjkuI3mmK/lr7nlrZBcbiAgICAvLyBcbiAgICAvLyDwn5Sn44CQ6Z+z5pWI6KeE5YiZ44CRXG4gICAgLy8gMS4g6aaW5Ye677yIaXNfbmV3X3JvdW5kPXRydWXvvInvvJrmkq3mlL7lr7nlupTniYzlnovnmoTpn7PmlYhcbiAgICAvLyAyLiDljovniYzvvIhpc19uZXdfcm91bmQ9ZmFsc2UsIGNhbl9iZWF0PXRydWXvvInvvJpcbiAgICAvLyAgICAtIOacieWvueW6lOmfs+aViOaWh+S7tu+8muaSreaUvueJjOWei+mfs+aViFxuICAgIC8vICAgIC0g5peg5a+55bqU6Z+z5pWI5paH5Lu277yI5aaC5a+55a2QMTQvMTXvvInvvJrmkq3mlL5cIuWkp+S9oFwi6Z+z5pWIXG4gICAgLy8gMy4g54K45by5L+eOi+eCuO+8muWni+e7iOaSreaUvueCuOW8uS/njovngrjpn7PmlYhcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIPCflIog5pKt5pS+5Ye654mM6Z+z5pWIXG4gICAgICog8J+Up+OAkOWFqOmdoumHjeaehOeJiOOAkeS4peagvOmBteW+qlwi5aSn5L2gXCLpn7PmlYjkvb/nlKjop4TliJlcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIOacjeWKoeerr+W5v+aSreeahOaVsOaNrlxuICAgICAqICAgLSBoYW5kX3R5cGU6IOeJjOWei+WQjeensCAoc2luZ2xlL3BhaXIvdHJpcGxlL3N0cmFpZ2h0L2JvbWIvcm9ja2V0L2xpYW5kdWkvcGxhbmUvc2FuZGFpeWkvc2FuZGFpZHVpL3NpZGFpZXIvc2lkYWlsaWFuZ2R1aSlcbiAgICAgKiAgIC0gcmFuazog5Li754mM54K55pWwICjnlKjkuo7ljZXlvKAv5a+55a2QL+S4ieW8oClcbiAgICAgKiAgIC0gZ2VuZGVyOiBcIm1hbGVcIiAvIFwiZmVtYWxlXCJcbiAgICAgKiAgIC0gaXNfbmV3X3JvdW5kOiDmmK/lkKbmmK/mlrDlm57lkIjvvIjpppblh7rvvIlcbiAgICAgKiAgIC0gY2FuX2JlYXQ6IOaYr+WQpuWOi+i/h+S4iuWutlxuICAgICAqIFxuICAgICAqIOOAkOaguOW/g+inhOWImeOAkVwi5aSn5L2gXCLpn7PmlYgobV9jcF9kYW5pKeeahOS9v+eUqOWcuuaZr++8mlxuICAgICAqIFxuICAgICAqIOWcuuaZrzEgLSDpppblh7ooaXNfbmV3X3JvdW5kPXRydWUp77yaXG4gICAgICogICDinIUg5Y+q5pKt5pS+54mM5Z6L6Z+z5pWIXG4gICAgICogICDinYwg56aB5q2i5pKt5pS+XCLlpKfkvaBcIlxuICAgICAqIFxuICAgICAqIOWcuuaZrzIgLSDljovniYwoaXNfbmV3X3JvdW5kPWZhbHNlICYmIGNhbl9iZWF0PXRydWUp77yaXG4gICAgICogICDwn46yIDcwJSDmpoLnjofmkq3mlL7niYzlnovpn7PmlYhcbiAgICAgKiAgIPCfjrIgMzAlIOamgueOh+aSreaUvlwi5aSn5L2gXCJcbiAgICAgKiAgIO+8iOWmguaenOeJjOWei+mfs+aViOaWh+S7tuS4jeWtmOWcqO+8jDEwMCXmkq3mlL5cIuWkp+S9oFwi77yJXG4gICAgICogXG4gICAgICog5Zy65pmvMyAtIOeCuOW8uS/njovngrjvvJpcbiAgICAgKiAgIOKchSDlp4vnu4jmkq3mlL7ngrjlvLkv546L54K46Z+z5pWIXG4gICAgICovXG4gICAgX3BsYXlDYXJkU291bmQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaWYgKCFpc29wZW5fc291bmQpIHJldHVyblxuXG4gICAgICAgIC8vIPCflKfjgJDosIPor5XjgJHmiZPljbDlrozmlbTmlbDmja7nu5PmnoRcblxuICAgICAgICB2YXIgaGFuZFR5cGUgPSBkYXRhLmhhbmRfdHlwZSB8fCBcIlwiXG4gICAgICAgIHZhciBnZW5kZXIgPSBkYXRhLmdlbmRlciB8fCBcIm1hbGVcIlxuICAgICAgICB2YXIgaXNOZXdSb3VuZCA9IGRhdGEuaXNfbmV3X3JvdW5kICE9PSB1bmRlZmluZWQgPyBkYXRhLmlzX25ld19yb3VuZCA6IHRydWVcbiAgICAgICAgdmFyIGNhbkJlYXQgPSBkYXRhLmNhbl9iZWF0ICE9PSB1bmRlZmluZWQgPyBkYXRhLmNhbl9iZWF0IDogZmFsc2VcblxuICAgICAgICAvLyDwn5Sn44CQ5qC45b+D5L+u5aSN44CR5LyY5YWI5LuOIGNhcmRzIOS4reaPkOWPluS4u+eJjOWAvFxuICAgICAgICB2YXIgcmFuayA9IHRoaXMuX2V4dHJhY3RNYWluUmFuayhkYXRhKVxuICAgICAgICBcbiAgICAgICAgLy8g8J+UiuOAkOiwg+ivleaXpeW/l+OAkeivpue7hui+k+WHuumfs+aViOaSreaUvuWPguaVsFxuXG4gICAgICAgIC8vIPCflKfjgJDmo4Dmn6XjgJHmmK/lkKbmmK/ngrjlvLnmiJbnjovngrjvvIjnibnmrorlpITnkIbvvIlcbiAgICAgICAgdmFyIHR5cGUgPSAoaGFuZFR5cGUgfHwgXCJcIikudG9Mb3dlckNhc2UoKVxuICAgICAgICB2YXIgaXNCb21iID0gdHlwZSA9PT0gXCJib21iXCIgfHwgdHlwZSA9PT0gXCJ6aGFkYW5cIiB8fCB0eXBlID09PSBcIueCuOW8uVwiXG4gICAgICAgIHZhciBpc1JvY2tldCA9IHR5cGUgPT09IFwicm9ja2V0XCIgfHwgdHlwZSA9PT0gXCJ3YW5nemhhXCIgfHwgdHlwZSA9PT0gXCLnjovngrhcIlxuICAgICAgICBcbiAgICAgICAgLy8g54K45by55ZKM546L54K45aeL57uI5pKt5pS+5a+55bqU6Z+z5pWIXG4gICAgICAgIGlmIChpc0JvbWIgfHwgaXNSb2NrZXQpIHtcbiAgICAgICAgICAgIHZhciBzb3VuZE5hbWUgPSB0aGlzLl9nZXRDYXJkVHlwZVNvdW5kKGhhbmRUeXBlLCByYW5rLCBnZW5kZXIpXG4gICAgICAgICAgICBpZiAoc291bmROYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheVNvdW5kRWZmZWN0KHNvdW5kTmFtZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8g8J+Up+OAkOaguOW/g+OAkeiOt+WPlueJjOWei+mfs+aViFxuICAgICAgICB2YXIgY2FyZFNvdW5kID0gdGhpcy5fZ2V0Q2FyZFR5cGVTb3VuZChoYW5kVHlwZSwgcmFuaywgZ2VuZGVyKVxuICAgICAgICB2YXIgcHJlZml4ID0gZ2VuZGVyID09PSBcImZlbWFsZVwiID8gXCJtX2NwX252X1wiIDogXCJtX2NwX1wiXG4gICAgICAgIHZhciBkYW5pU291bmQgPSBwcmVmaXggKyBcImRhbmlcIlxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOajgOafpeOAkeeJjOWei+aYr+WQpuacieWvueW6lOeahOmfs+aViOaWh+S7tlxuICAgICAgICB2YXIgaGFzU3BlY2lmaWNTb3VuZCA9IHRoaXMuX2hhc1NwZWNpZmljQ2FyZFNvdW5kKGhhbmRUeXBlLCByYW5rKVxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDmoLjlv4Pkv67lpI3jgJHmraPnoa7nmoRcIuWkp+S9oFwi5pKt5pS+6YC76L6RXG4gICAgICAgIC8vIFxuICAgICAgICAvLyDop4TliJnor7TmmI7vvJpcbiAgICAgICAgLy8gMS4g6aaW5Ye6KGlzX25ld19yb3VuZD10cnVlKe+8muWPquaSreaUvueJjOWei+mfs+aViO+8jOemgeatolwi5aSn5L2gXCJcbiAgICAgICAgLy8gMi4g5Y6L54mMKGlzX25ld19yb3VuZD1mYWxzZSAmJiBjYW5fYmVhdD10cnVlKe+8mumaj+acuuaSreaUvu+8jDcwJeeJjOWei+mfs+aViO+8jDMwJVwi5aSn5L2gXCJcbiAgICAgICAgLy8gMy4g5Y6L54mM5L2G6Z+z5pWI5paH5Lu257y65aSx77ya5pKt5pS+XCLlpKfkvaBcIlxuICAgICAgICBcbiAgICAgICAgaWYgKGlzTmV3Um91bmQpIHtcbiAgICAgICAgICAgIC8vIOKcheOAkOWcuuaZrzHjgJHpppblh7rvvJrlj6rmkq3mlL7niYzlnovpn7PmlYjvvIznpoHmraJcIuWkp+S9oFwiXG4gICAgICAgICAgICBpZiAoY2FyZFNvdW5kKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheVNvdW5kRWZmZWN0KGNhcmRTb3VuZClcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8g6aaW5Ye65L2G5rKh5pyJ5a+55bqU6Z+z5pWI5paH5Lu277yI5LiN5bqU6K+l5Y+R55Sf77yM5L2G5a6J5YWo5aSE55CG77yJXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+UiiBbX3BsYXlDYXJkU291bmRdIOKaoO+4jyDpppblh7rkvYbml6Dlr7nlupTpn7PmlYjmlofku7Y6IFwiICsgaGFuZFR5cGUgKyBcIiwgcmFuaz1cIiArIHJhbmspXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOmHjeimgeOAkemmluWHuuS4jeaSreaUvlwi5aSn5L2gXCLvvIzpnZnpu5jot7Pov4dcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChjYW5CZWF0KSB7XG4gICAgICAgICAgICAvLyDinIXjgJDlnLrmma8y44CR5Y6L54mM5Zy65pmv77ya6ZqP5py65pKt5pS+77yINzAl54mM5Z6L77yMMzAl5aSn5L2g77yJXG4gICAgICAgICAgICBpZiAoaGFzU3BlY2lmaWNTb3VuZCAmJiBjYXJkU291bmQpIHtcbiAgICAgICAgICAgICAgICAvLyDpmo/mnLrpgInmi6nvvJo3MCXniYzlnovvvIwzMCXlpKfkvaBcbiAgICAgICAgICAgICAgICB2YXIgcmFuZG9tVmFsdWUgPSBNYXRoLnJhbmRvbSgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHJhbmRvbVZhbHVlIDwgMC43KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIDcwJSDmkq3mlL7niYzlnovpn7PmlYhcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGxheVNvdW5kRWZmZWN0KGNhcmRTb3VuZClcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyAzMCUg5pKt5pS+XCLlpKfkvaBcIlxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wbGF5U291bmRFZmZlY3QoZGFuaVNvdW5kKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8g6Z+z5pWI5paH5Lu257y65aSx77yM5pKt5pS+XCLlpKfkvaBcIlxuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlTb3VuZEVmZmVjdChkYW5pU291bmQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDinIXjgJDlnLrmma8z44CR5Y6L54mM5L2GY2FuX2JlYXQ9ZmFsc2XvvIjkuI3lupTor6Xlj5HnlJ/vvIzkvYblronlhajlpITnkIbvvIlcbiAgICAgICAgICAgIC8vIOi/meenjeaDheWGteeQhuiuuuS4iuS4jeW6lOivpeWHuueOsO+8jOWboOS4uuacjeWKoeerr+WPquWcqOaIkOWKn+WOi+eJjOaXtuiuvue9rmNhbl9iZWF0PXRydWVcbiAgICAgICAgICAgIGlmIChjYXJkU291bmQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5U291bmRFZmZlY3QoY2FyZFNvdW5kKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn5SKIFtfcGxheUNhcmRTb3VuZF0g4pqg77iPIOW8guW4uOWcuuaZr++8muWOi+eJjOS9hmNhbl9iZWF0PWZhbHNl5LiU5peg6Z+z5pWIXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeajgOafpeeJjOWei+aYr+WQpuacieWvueW6lOeahOmfs+aViOaWh+S7tlxuICAgICAqIPCflKfjgJDkv67lpI3jgJHlop7liqDmm7TlpJrniYzlnovmlK/mjIHvvIznoa7kv53opobnm5bmnI3liqHnq6/miYDmnInniYzlnovlkI3np7BcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaGFuZFR5cGUgLSDniYzlnovlkI3np7BcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gcmFuayAtIOS4u+eJjOeCueaVsFxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSDmmK/lkKbmnInlr7nlupTpn7PmlYjmlofku7ZcbiAgICAgKi9cbiAgICBfaGFzU3BlY2lmaWNDYXJkU291bmQ6IGZ1bmN0aW9uKGhhbmRUeXBlLCByYW5rKSB7XG4gICAgICAgIHZhciB0eXBlID0gKGhhbmRUeXBlIHx8IFwiXCIpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgdmFyIHNvdW5kSW5kZXggPSB0aGlzLl9yYW5rVG9Tb3VuZEluZGV4KHJhbmspXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgLy8g5Y2V5byg77ya5pyJMS0xNeeahOmfs+aViOaWh+S7tlxuICAgICAgICAvLyDmnI3liqHnq6/lj5HpgIE6IFwi5Y2V5bygXCJcbiAgICAgICAgaWYgKHR5cGUgPT09IFwic2luZ2xlXCIgfHwgdHlwZSA9PT0gXCJzb2xvXCIgfHwgdHlwZS5pbmRleE9mKFwi5Y2V5bygXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgdmFyIGhhc1NvdW5kID0gc291bmRJbmRleCA+PSAxICYmIHNvdW5kSW5kZXggPD0gMTVcbiAgICAgICAgICAgIHJldHVybiBoYXNTb3VuZFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlr7nlrZDvvJrlj6rmnIkxLTEz55qE6Z+z5pWI5paH5Lu277yI5rKh5pyJ5a+55a2QMTQvMTXvvIzlm6DkuLrlpKfnjovlsI/njovmsqHmnInlr7nlrZDpn7PmlYjvvIlcbiAgICAgICAgLy8g5pyN5Yqh56uv5Y+R6YCBOiBcIuWvueWtkFwiXG4gICAgICAgIGlmICh0eXBlID09PSBcInBhaXJcIiB8fCB0eXBlID09PSBcImRvdWJsZVwiIHx8IHR5cGUuaW5kZXhPZihcIuWvueWtkFwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHZhciBoYXNTb3VuZCA9IHNvdW5kSW5kZXggPj0gMSAmJiBzb3VuZEluZGV4IDw9IDEzXG4gICAgICAgICAgICByZXR1cm4gaGFzU291bmRcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5LiJ5byg77ya5Y+q5pyJMS0xM+eahOmfs+aViOaWh+S7tlxuICAgICAgICAvLyDmnI3liqHnq6/lj5HpgIE6IFwi5LiJ5bygXCJcbiAgICAgICAgaWYgKHR5cGUgPT09IFwidHJpcGxlXCIgfHwgdHlwZSA9PT0gXCJ0aHJlZVwiIHx8IHR5cGUgPT09IFwidHJpb1wiIHx8IHR5cGUuaW5kZXhPZihcIuS4ieW8oFwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHZhciBoYXNTb3VuZCA9IHNvdW5kSW5kZXggPj0gMSAmJiBzb3VuZEluZGV4IDw9IDEzXG4gICAgICAgICAgICByZXR1cm4gaGFzU291bmRcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g54m55q6K54mM5Z6L6YO95pyJ5a+55bqU6Z+z5pWIXG4gICAgICAgIC8vIOacjeWKoeerr+WPkemAgTogXCLov57lr7lcIiwgXCLpobrlrZBcIiwgXCLpo57mnLpcIiwgXCLpo57mnLrluKbljZVcIiwgXCLpo57mnLrluKblr7lcIiwgXCLkuInluKbkuIBcIiwgXCLkuInluKbkuoxcIiwgXCLlm5vluKbkuoxcIiwgXCLlm5vluKbkuKTlr7lcIiwgXCLngrjlvLlcIiwgXCLnjovngrhcIlxuICAgICAgICB2YXIgc3BlY2lhbFR5cGVzID0gW1xuICAgICAgICAgICAgLy8g6Iux5paH5ZCN56ewXG4gICAgICAgICAgICBcImxpYW5kdWlcIiwgXCJzdHJhaWdodFwiLCBcInBsYW5lXCIsIFwiZmVpamlcIixcbiAgICAgICAgICAgIFwic2FuZGFpeWlcIiwgXCJzYW5kYWlkdWlcIiwgXCJzaWRhaWVyXCIsIFwic2lkYWlsaWFuZ2R1aVwiLFxuICAgICAgICAgICAgXCJib21iXCIsIFwiemhhZGFuXCIsIFwicm9ja2V0XCIsIFwid2FuZ3poYVwiLFxuICAgICAgICAgICAgLy8g5Lit5paH5ZCN56ew77yI5pyN5Yqh56uv5Y+R6YCB55qE5ZCN56ew77yJXG4gICAgICAgICAgICBcIui/nuWvuVwiLCBcIumhuuWtkFwiLCBcIumjnuaculwiLCBcIuS4ieW4puS4gFwiLCBcIuS4ieW4puS6jFwiLFxuICAgICAgICAgICAgXCLlm5vluKbkuoxcIiwgXCLlm5vluKbkuKTlr7lcIiwgXCLngrjlvLlcIiwgXCLnjovngrhcIlxuICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNwZWNpYWxUeXBlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHR5cGUuaW5kZXhPZihzcGVjaWFsVHlwZXNbaV0pICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5qC45b+D5L+u5aSN44CR5LuO5pWw5o2u5Lit5o+Q5Y+W5Li754mM54K55pWwXG4gICAgICogXG4gICAgICog5LyY5YWI57qn77yaXG4gICAgICogMS4g5pyN5Yqh56uv5Lyg6YCS55qEIHJhbmvvvIjlpoLmnpzmnInmlYjvvIlcbiAgICAgKiAyLiDku44gY2FyZHMg5pWw57uE5Lit5o+Q5Y+W77yI5qC55o2u54mM5Z6L77yJXG4gICAgICogXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSDmnI3liqHnq6/lub/mkq3nmoTmlbDmja5cbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfSDkuLvniYzngrnmlbDvvIjmnI3liqHnq68gcmFuayDmoLzlvI/vvJozLTE377yJXG4gICAgICovXG4gICAgX2V4dHJhY3RNYWluUmFuazogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAvLyDkvJjlhYjkvb/nlKjmnI3liqHnq6/kvKDpgJLnmoQgcmFua1xuICAgICAgICBpZiAoZGF0YS5yYW5rICYmIGRhdGEucmFuayA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnJhbmtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWmguaenOacjeWKoeerryByYW5rIOaXoOaViO+8jOS7jiBjYXJkcyDkuK3mj5Dlj5ZcbiAgICAgICAgdmFyIGNhcmRzID0gZGF0YS5jYXJkcyB8fCBbXVxuICAgICAgICB2YXIgaGFuZFR5cGUgPSAoZGF0YS5oYW5kX3R5cGUgfHwgXCJcIikudG9Mb3dlckNhc2UoKVxuXG4gICAgICAgIGlmIChjYXJkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCflIogW19leHRyYWN0TWFpblJhbmtdIGNhcmRz5pWw57uE5Li656m677yM5peg5rOV5o+Q5Y+WcmFua1wiKVxuICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWvuSBjYXJkcyDov5vooYzmjpLluo/vvIjku47lpKfliLDlsI/vvIlcbiAgICAgICAgdmFyIHNvcnRlZENhcmRzID0gY2FyZHMuc2xpY2UoKS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiAoYi5yYW5rIHx8IDApIC0gKGEucmFuayB8fCAwKVxuICAgICAgICB9KVxuXG5cbiAgICAgICAgLy8g5qC55o2u54mM5Z6L5o+Q5Y+W5Li754mMXG4gICAgICAgIC8vIOWNleW8oFxuICAgICAgICBpZiAoaGFuZFR5cGUuaW5kZXhPZihcInNpbmdsZVwiKSAhPT0gLTEgfHwgaGFuZFR5cGUuaW5kZXhPZihcIuWNleW8oFwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gdGhpcy5fZXh0cmFjdENhcmRSYW5rKHNvcnRlZENhcmRzWzBdKVxuICAgICAgICAgICAgcmV0dXJuIHJhbmtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWvueWtkCAtIOWPluS7u+aEj+S4gOW8oOeahHJhbmvvvIjlroPku6znm7jlkIzvvIlcbiAgICAgICAgaWYgKGhhbmRUeXBlLmluZGV4T2YoXCJwYWlyXCIpICE9PSAtMSB8fCBoYW5kVHlwZS5pbmRleE9mKFwi5a+55a2QXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgdmFyIHJhbmsgPSB0aGlzLl9leHRyYWN0Q2FyZFJhbmsoc29ydGVkQ2FyZHNbMF0pXG4gICAgICAgICAgICByZXR1cm4gcmFua1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5LiJ5bygIC0g5Y+W5LiJ5byg5Lit5Lu75oSP5LiA5byg55qEcmFua1xuICAgICAgICBpZiAoaGFuZFR5cGUuaW5kZXhPZihcInRyaXBsZVwiKSAhPT0gLTEgfHwgaGFuZFR5cGUuaW5kZXhPZihcIuS4ieW8oFwiKSAhPT0gLTEgfHwgXG4gICAgICAgICAgICBoYW5kVHlwZS5pbmRleE9mKFwidHJpb1wiKSAhPT0gLTEgfHwgaGFuZFR5cGUuaW5kZXhPZihcInRocmVlXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgdmFyIHJhbmsgPSB0aGlzLl9leHRyYWN0Q2FyZFJhbmsoc29ydGVkQ2FyZHNbMF0pXG4gICAgICAgICAgICByZXR1cm4gcmFua1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5LiJ5bim5LiAL+S4ieW4puS6jCAtIOWPluacgOWkp+eahOS4ieW8oFxuICAgICAgICBpZiAoaGFuZFR5cGUuaW5kZXhPZihcInNhbmRhaXlpXCIpICE9PSAtMSB8fCBoYW5kVHlwZS5pbmRleE9mKFwi5LiJ5bim5LiAXCIpICE9PSAtMSB8fFxuICAgICAgICAgICAgaGFuZFR5cGUuaW5kZXhPZihcInNhbmRhaWR1aVwiKSAhPT0gLTEgfHwgaGFuZFR5cGUuaW5kZXhPZihcIuS4ieW4puS6jFwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIC8vIOe7n+iuoeavj+S4qnJhbmvlh7rnjrDnmoTmrKHmlbBcbiAgICAgICAgICAgIHZhciBjb3VudHMgPSB7fVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYXJkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciByID0gY2FyZHNbaV0ucmFua1xuICAgICAgICAgICAgICAgIGNvdW50c1tyXSA9IChjb3VudHNbcl0gfHwgMCkgKyAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDmib7liLDlh7rnjrDmrKHmlbDmnIDlpJrnmoRyYW5rXG4gICAgICAgICAgICB2YXIgbWF4Q291bnQgPSAwXG4gICAgICAgICAgICB2YXIgbWFpblJhbmsgPSAwXG4gICAgICAgICAgICBmb3IgKHZhciByIGluIGNvdW50cykge1xuICAgICAgICAgICAgICAgIGlmIChjb3VudHNbcl0gPj0gMyAmJiBjb3VudHNbcl0gPiBtYXhDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICBtYXhDb3VudCA9IGNvdW50c1tyXVxuICAgICAgICAgICAgICAgICAgICBtYWluUmFuayA9IHBhcnNlSW50KHIpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1haW5SYW5rXG4gICAgICAgIH1cblxuICAgICAgICAvLyDlhbbku5bniYzlnosgLSDlj5bmnIDlpKfnmoTniYxcbiAgICAgICAgdmFyIHJhbmsgPSB0aGlzLl9leHRyYWN0Q2FyZFJhbmsoc29ydGVkQ2FyZHNbMF0pXG4gICAgICAgIHJldHVybiByYW5rXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflKfjgJDovoXliqnjgJHku47ljZXkuKpjYXJk5a+56LGh5Lit5o+Q5Y+WcmFua1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjYXJkIC0g5Y2h54mM5a+56LGhXG4gICAgICogQHJldHVybnMge051bWJlcn0gcmFua+WAvFxuICAgICAqL1xuICAgIF9leHRyYWN0Q2FyZFJhbms6IGZ1bmN0aW9uKGNhcmQpIHtcbiAgICAgICAgaWYgKCFjYXJkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn5SKIFtfZXh0cmFjdENhcmRSYW5rXSBjYXJk5Li656m6XCIpXG4gICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5bCd6K+V5ZCE56eN5Y+v6IO955qE5a2X5q61XG4gICAgICAgIGlmIChjYXJkLnJhbmsgIT09IHVuZGVmaW5lZCAmJiBjYXJkLnJhbmsgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyKGNhcmQucmFuaylcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FyZC52YWx1ZSAhPT0gdW5kZWZpbmVkICYmIGNhcmQudmFsdWUgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyKGNhcmQudmFsdWUpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNhcmQubG9naWNfdmFsdWUgIT09IHVuZGVmaW5lZCAmJiBjYXJkLmxvZ2ljX3ZhbHVlID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIE51bWJlcihjYXJkLmxvZ2ljX3ZhbHVlKVxuICAgICAgICB9XG4gICAgICAgIGlmIChjYXJkLmNhcmRfZGF0YSAmJiBjYXJkLmNhcmRfZGF0YS5yYW5rICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBOdW1iZXIoY2FyZC5jYXJkX2RhdGEucmFuaylcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUud2FybihcIvCflIogW19leHRyYWN0Q2FyZFJhbmtdIOaXoOazleaPkOWPlnJhbmvvvIxjYXJkOlwiLCBKU09OLnN0cmluZ2lmeShjYXJkKSlcbiAgICAgICAgcmV0dXJuIDBcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaguOW/g+S/ruWkjeOAkeacjeWKoeerryByYW5rIOi9rOaNouS4uumfs+aViOaWh+S7tue8luWPt1xuICAgICAqIFxuICAgICAqIOacjeWKoeerryByYW5rIOWumuS5ie+8mlxuICAgICAqIC0gMy0xMCA9IDMtMTBcbiAgICAgKiAtIEo9MTEsIFE9MTIsIEs9MTMsIEE9MTQsIDI9MTVcbiAgICAgKiAtIOWwj+eOiz0xNiwg5aSn546LPTE3XG4gICAgICogXG4gICAgICog6Z+z5pWI5paH5Lu257yW5Y+377yaXG4gICAgICogLSAxID0gQVxuICAgICAqIC0gMiA9IDJcbiAgICAgKiAtIDMtMTMgPSAzLUtcbiAgICAgKiAtIDE0ID0g5bCP546LXG4gICAgICogLSAxNSA9IOWkp+eOi1xuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByYW5rIC0g5pyN5Yqh56uv54mM6Z2i5YC8ICgzLTE3KVxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9IOmfs+aViOaWh+S7tue8luWPtyAoMS0xNSnvvIzlpoLmnpzml6Dms5XovazmjaLov5Tlm54gMFxuICAgICAqL1xuICAgIF9yYW5rVG9Tb3VuZEluZGV4OiBmdW5jdGlvbihyYW5rKSB7XG4gICAgICAgIGlmIChyYW5rID09PSAxNCkgcmV0dXJuIDEgICAvLyBBIOKGkiAxXG4gICAgICAgIGlmIChyYW5rID09PSAxNSkgcmV0dXJuIDIgICAvLyAyIOKGkiAyXG4gICAgICAgIGlmIChyYW5rID49IDMgJiYgcmFuayA8PSAxMykgcmV0dXJuIHJhbmsgIC8vIDMtSyDnm7TmjqXkvb/nlKhcbiAgICAgICAgaWYgKHJhbmsgPT09IDE2KSByZXR1cm4gMTQgIC8vIOWwj+eOiyDihpIgMTRcbiAgICAgICAgaWYgKHJhbmsgPT09IDE3KSByZXR1cm4gMTUgIC8vIOWkp+eOiyDihpIgMTVcbiAgICAgICAgcmV0dXJuIDAgIC8vIOaXoOaViFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5SKIOagueaNrueJjOWei+iOt+WPlumfs+aViOWQjeensFxuICAgICAqIPCflKfjgJDkv67lpI3jgJHkvb/nlKggaW5kZXhPZiDljLnphY3kuK3mlofniYzlnovlkI3np7DvvIznoa7kv53lhbzlrrnmnI3liqHnq6/lj5HpgIHnmoTkuK3mloflkI3np7BcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaGFuZFR5cGUgLSDniYzlnovlkI3np7BcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gcmFuayAtIOS4u+eJjOeCueaVsCAo5pyN5Yqh56uv5a6a5LmJOiAzLTE3LCBBPTE0LCAyPTE1LCDlsI/njos9MTYsIOWkp+eOiz0xNylcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZ2VuZGVyIC0g5oCn5YirXG4gICAgICogQHJldHVybnMge1N0cmluZ30g6Z+z5pWI5ZCN56ew77yI5LiN5ZCr6Lev5b6E5ZKM5omp5bGV5ZCN77yJ77yM5aaC5p6c5rKh5pyJ5a+55bqU6Z+z5pWI6L+U5ZuebnVsbFxuICAgICAqL1xuICAgIF9nZXRDYXJkVHlwZVNvdW5kOiBmdW5jdGlvbihoYW5kVHlwZSwgcmFuaywgZ2VuZGVyKSB7XG4gICAgICAgIHZhciB0eXBlID0gKGhhbmRUeXBlIHx8IFwiXCIpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgdmFyIHByZWZpeCA9IGdlbmRlciA9PT0gXCJmZW1hbGVcIiA/IFwibV9jcF9udl9cIiA6IFwibV9jcF9cIlxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOWQiOazleaAp+agoemqjOOAkeajgOafpXJhbmvmmK/lkKbmnInmlYhcbiAgICAgICAgaWYgKCFyYW5rIHx8IHJhbmsgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn5SKIFtfZ2V0Q2FyZFR5cGVTb3VuZF0g6Z2e5rOVcmFuazogXCIgKyByYW5rICsgXCIsIGhhbmRUeXBlPVwiICsgaGFuZFR5cGUpXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5bCG5pyN5Yqh56uvIHJhbmsg6L2s5o2i5Li66Z+z5pWI5paH5Lu257yW5Y+3XG4gICAgICAgIHZhciBzb3VuZEluZGV4ID0gdGhpcy5fcmFua1RvU291bmRJbmRleChyYW5rKVxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8vIOWNleW8oO+8iOaUr+aMgeS4reiLseaWh++8iVxuICAgICAgICAvLyDmnI3liqHnq6/lj5HpgIE6IFwi5Y2V5bygXCJcbiAgICAgICAgLy8g6Z+z5pWI5paH5Lu257yW5Y+377yaMT1BLCAyPTIsIDMtMTM9My1LLCAxND3lsI/njossIDE1PeWkp+eOi1xuICAgICAgICBpZiAodHlwZSA9PT0gXCJzaW5nbGVcIiB8fCB0eXBlID09PSBcInNvbG9cIiB8fCB0eXBlLmluZGV4T2YoXCLljZXlvKBcIikgIT09IC0xKSB7XG4gICAgICAgICAgICBpZiAoc291bmRJbmRleCA+PSAxICYmIHNvdW5kSW5kZXggPD0gMTUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJlZml4ICsgXCJkYW56aGFuZ19cIiArIHNvdW5kSW5kZXhcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCflIogW19nZXRDYXJkVHlwZVNvdW5kXSDljZXlvKDpn7PmlYjntKLlvJXml6DmlYg6IHJhbms9XCIgKyByYW5rICsgXCIsIHNvdW5kSW5kZXg9XCIgKyBzb3VuZEluZGV4KVxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5a+55a2Q77yI5pSv5oyB5Lit6Iux5paH77yJXG4gICAgICAgIC8vIOacjeWKoeerr+WPkemAgTogXCLlr7nlrZBcIlxuICAgICAgICAvLyDpn7PmlYjmlofku7bnvJblj7fvvJoxPUEsIDI9MiwgMy0xMz0zLUvvvIjms6jmhI/vvJrmlofku7blj6rmnIkxLTEz77yM5rKh5pyJMTQvMTXvvIlcbiAgICAgICAgaWYgKHR5cGUgPT09IFwicGFpclwiIHx8IHR5cGUgPT09IFwiZG91YmxlXCIgfHwgdHlwZS5pbmRleE9mKFwi5a+55a2QXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgaWYgKHNvdW5kSW5kZXggPj0gMSAmJiBzb3VuZEluZGV4IDw9IDEzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZWZpeCArIFwiZHVpemlfXCIgKyBzb3VuZEluZGV4XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn5SKIFtfZ2V0Q2FyZFR5cGVTb3VuZF0g5a+55a2Q6Z+z5pWI5paH5Lu25LiN5a2Y5ZyoOiByYW5rPVwiICsgcmFuayArIFwiLCBzb3VuZEluZGV4PVwiICsgc291bmRJbmRleClcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOS4ieW8oO+8iOaUr+aMgeS4reiLseaWh++8iVxuICAgICAgICAvLyDmnI3liqHnq6/lj5HpgIE6IFwi5LiJ5bygXCJcbiAgICAgICAgLy8g6Z+z5pWI5paH5Lu257yW5Y+377yaMT1BLCAyPTIsIDMtMTM9My1L77yI5rOo5oSP77ya5paH5Lu25Y+q5pyJMS0xM++8iVxuICAgICAgICBpZiAodHlwZSA9PT0gXCJ0cmlwbGVcIiB8fCB0eXBlID09PSBcInRocmVlXCIgfHwgdHlwZSA9PT0gXCJ0cmlvXCIgfHwgdHlwZS5pbmRleE9mKFwi5LiJ5bygXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgaWYgKHNvdW5kSW5kZXggPj0gMSAmJiBzb3VuZEluZGV4IDw9IDEzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZWZpeCArIFwic2FuZ2VfXCIgKyBzb3VuZEluZGV4XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn5SKIFtfZ2V0Q2FyZFR5cGVTb3VuZF0g5LiJ5byg6Z+z5pWI5paH5Lu25LiN5a2Y5ZyoOiByYW5rPVwiICsgcmFuayArIFwiLCBzb3VuZEluZGV4PVwiICsgc291bmRJbmRleClcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHnibnmrorniYzlnovmmKDlsITooajvvIjmlK/mjIHkuK3oi7HmlofvvIlcbiAgICAgICAgdmFyIHNwZWNpYWxUeXBlcyA9IHtcbiAgICAgICAgICAgIC8vIOiLseaWh+WQjeensFxuICAgICAgICAgICAgXCJsaWFuZHVpXCI6IFwibGlhbmR1aVwiLCAgICAgICAgICAgLy8g6L+e5a+5XG4gICAgICAgICAgICBcInN0cmFpZ2h0XCI6IFwic2h1bnppXCIsICAgICAgICAgICAvLyDpobrlrZBcbiAgICAgICAgICAgIFwicGxhbmVcIjogXCJmZWlqaVwiLCAgICAgICAgICAgICAgIC8vIOmjnuaculxuICAgICAgICAgICAgXCJmZWlqaVwiOiBcImZlaWppXCIsICAgICAgICAgICAgICAgLy8g6aOe5py6XG4gICAgICAgICAgICBcInNhbmRhaXlpXCI6IFwic2FuZGFpeWlcIiwgICAgICAgICAvLyDkuInluKbkuIBcbiAgICAgICAgICAgIFwic2FuZGFpZHVpXCI6IFwic2FuZGFpZHVpXCIsICAgICAgIC8vIOS4ieW4puWvuVxuICAgICAgICAgICAgXCJzaWRhaWVyXCI6IFwic2lkYWllclwiLCAgICAgICAgICAgLy8g5Zub5bim5LqMXG4gICAgICAgICAgICBcInNpZGFpbGlhbmdkdWlcIjogXCJzaWRhaWxpYW5nZHVpXCIsIC8vIOWbm+W4puS4pOWvuVxuICAgICAgICAgICAgXCJib21iXCI6IFwiemhhZGFuXCIsICAgICAgICAgICAgICAgLy8g54K45by5XG4gICAgICAgICAgICBcInpoYWRhblwiOiBcInpoYWRhblwiLCAgICAgICAgICAgICAvLyDngrjlvLlcbiAgICAgICAgICAgIFwicm9ja2V0XCI6IFwid2FuZ3poYVwiLCAgICAgICAgICAgIC8vIOeOi+eCuFxuICAgICAgICAgICAgXCJ3YW5nemhhXCI6IFwid2FuZ3poYVwiLCAgICAgICAgICAgLy8g546L54K4XG4gICAgICAgICAgICAvLyDkuK3mloflkI3np7DvvIjmnI3liqHnq6/lj5HpgIHnmoTlkI3np7DvvIlcbiAgICAgICAgICAgIFwi6L+e5a+5XCI6IFwibGlhbmR1aVwiLFxuICAgICAgICAgICAgXCLpobrlrZBcIjogXCJzaHVuemlcIixcbiAgICAgICAgICAgIFwi6aOe5py6XCI6IFwiZmVpamlcIixcbiAgICAgICAgICAgIFwi6aOe5py65bim5Y2VXCI6IFwiZmVpamlcIixcbiAgICAgICAgICAgIFwi6aOe5py65bim5a+5XCI6IFwiZmVpamlcIixcbiAgICAgICAgICAgIFwi5LiJ5bim5LiAXCI6IFwic2FuZGFpeWlcIixcbiAgICAgICAgICAgIFwi5LiJ5bim5LqMXCI6IFwic2FuZGFpZHVpXCIsXG4gICAgICAgICAgICBcIuWbm+W4puS6jFwiOiBcInNpZGFpZXJcIixcbiAgICAgICAgICAgIFwi5Zub5bim5Lik5a+5XCI6IFwic2lkYWlsaWFuZ2R1aVwiLFxuICAgICAgICAgICAgXCLngrjlvLlcIjogXCJ6aGFkYW5cIixcbiAgICAgICAgICAgIFwi546L54K4XCI6IFwid2FuZ3poYVwiXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOafpeaJvueJueauiueJjOWei1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc3BlY2lhbFR5cGVzKSB7XG4gICAgICAgICAgICBpZiAodHlwZS5pbmRleE9mKGtleSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1ZmZpeCA9IHNwZWNpYWxUeXBlc1trZXldXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeWls+eJiOeCuOW8ueS9v+eUqCBtX2NwX252X3poYWRhbu+8iOWmguaenOWtmOWcqO+8ie+8jOWQpuWImeS9v+eUqOeUt+eJiFxuICAgICAgICAgICAgICAgIC8vIOazqOaEj++8muebruWJjSBtX2NwX252X3poYWRhbi5tcDMg5LiN5a2Y5Zyo77yM5omA5Lul5aWz54mI5Lmf5L2/55So55S354mI54K45by56Z+z5pWIXG4gICAgICAgICAgICAgICAgaWYgKHN1ZmZpeCA9PT0gXCJ6aGFkYW5cIikge1xuICAgICAgICAgICAgICAgICAgICAvLyDlhYjlsJ3or5XlpbPniYjngrjlvLnpn7PmlYhcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdlbmRlciA9PT0gXCJmZW1hbGVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibV9jcF96aGFkYW5cIiAgLy8g5aWz54mI5pqC5pe25L2/55So55S354mI54K45by56Z+z5pWI77yI5Zug5Li6bV9jcF9udl96aGFkYW7kuI3lrZjlnKjvvIlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJtX2NwX3poYWRhblwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlpbPniYjnjovngrjmnInljZXni6zpn7PmlYhcbiAgICAgICAgICAgICAgICBpZiAoc3VmZml4ID09PSBcIndhbmd6aGFcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJlZml4ICsgXCJ3YW5nemhhXCJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZWZpeCArIHN1ZmZpeFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmnKrnn6XniYzlnovvvIzov5Tlm55udWxsXG4gICAgICAgIGNvbnNvbGUud2FybihcIvCflIogW19nZXRDYXJkVHlwZVNvdW5kXSDmnKrnn6XniYzlnos6IFwiICsgdHlwZSlcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+UiiDmkq3mlL7kuI3lh7rpn7PmlYjvvIjpmo/mnLrmkq3mlL5cIuS4jeimgVwiL1wi6KaB5LiN6LW3XCLvvIlcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIOacjeWKoeerr+W5v+aSreeahOaVsOaNrlxuICAgICAqICAgLSBnZW5kZXI6IFwibWFsZVwiIC8gXCJmZW1hbGVcIlxuICAgICAqL1xuICAgIF9wbGF5UGFzc1NvdW5kOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmICghaXNvcGVuX3NvdW5kKSByZXR1cm5cblxuICAgICAgICB2YXIgZ2VuZGVyID0gZGF0YS5nZW5kZXIgfHwgXCJtYWxlXCJcbiAgICAgICAgXG4gICAgICAgIC8vIOeUt+eJiO+8mumaj+acuuaSreaUvlwi5LiN6KaBXCLmiJZcIuimgeS4jei1t1wiXG4gICAgICAgIC8vIOaWh+S7tu+8mm1fY3BfYnV5YW8ubXAzLCBtX2NwX3lhb2J1cWkubXAzXG4gICAgICAgIC8vIOWls+eJiO+8mumaj+acuuaSreaUvlwi5LiN6KaBXCLmiJZcIuimgeS4jei1t1wiXG4gICAgICAgIC8vIOaWh+S7tu+8mm1fY3BfbnZfYnV5YW8ubXAzLCBtX252X3lhb2J1cWkud2F2XG4gICAgICAgIFxuICAgICAgICB2YXIgc291bmRzXG4gICAgICAgIGlmIChnZW5kZXIgPT09IFwiZmVtYWxlXCIpIHtcbiAgICAgICAgICAgIHNvdW5kcyA9IFtcIm1fY3BfbnZfYnV5YW9cIiwgXCJtX252X3lhb2J1cWlcIl1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNvdW5kcyA9IFtcIm1fY3BfYnV5YW9cIiwgXCJtX2NwX3lhb2J1cWlcIl1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6ZqP5py66YCJ5oup5LiA5LiqXG4gICAgICAgIHZhciByYW5kb21JbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNvdW5kcy5sZW5ndGgpXG4gICAgICAgIHZhciBzb3VuZE5hbWUgPSBzb3VuZHNbcmFuZG9tSW5kZXhdXG5cbiAgICAgICAgdGhpcy5fcGxheVNvdW5kRWZmZWN0KHNvdW5kTmFtZSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+UiiDmkq3mlL7og5zliKkv5aSx6LSl6Z+z5pWIXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBpc1dpbiAtIOaYr+WQpuiDnOWIqVxuICAgICAqL1xuICAgIF9wbGF5R2FtZVJlc3VsdFNvdW5kOiBmdW5jdGlvbihpc1dpbikge1xuICAgICAgICBpZiAoIWlzb3Blbl9zb3VuZCkgcmV0dXJuXG5cbiAgICAgICAgdmFyIHNvdW5kTmFtZSA9IGlzV2luID8gXCJtX3lpbmdsZVwiIDogXCJtX3NodWxlXCJcbiAgICAgICAgdGhpcy5fcGxheVNvdW5kRWZmZWN0KHNvdW5kTmFtZSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+UiiDmmL7npLrkuI3lh7rmlYjmnpxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gYWNjb3VudGlkIC0g546p5a62SURcbiAgICAgKi9cbiAgICBfc2hvd1Bhc3NFZmZlY3Q6IGZ1bmN0aW9uKGFjY291bnRpZCkge1xuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+W5a+55bqU546p5a6255qE5Ye654mM5Yy65Z+fXG4gICAgICAgIHZhciBnYW1lU2NlbmVfc2NyaXB0ID0gdGhpcy5ub2RlLnBhcmVudC5nZXRDb21wb25lbnQoXCJnYW1lU2NlbmVcIilcbiAgICAgICAgaWYgKCFnYW1lU2NlbmVfc2NyaXB0KSByZXR1cm5cblxuICAgICAgICB2YXIgb3V0Q2FyZF9ub2RlID0gZ2FtZVNjZW5lX3NjcmlwdC5nZXRVc2VyT3V0Q2FyZFBvc0J5QWNjb3VudChhY2NvdW50aWQpXG4gICAgICAgIGlmICghb3V0Q2FyZF9ub2RlKSByZXR1cm5cblxuICAgICAgICAvLyDmuIXnqbrlh7rniYzljLrln59cbiAgICAgICAgb3V0Q2FyZF9ub2RlLnJlbW92ZUFsbENoaWxkcmVuKHRydWUpXG5cbiAgICAgICAgLy8g5Yib5bu6XCLkuI3lh7pcIuaWh+Wtl+aYvuekulxuICAgICAgICB2YXIgcGFzc05vZGUgPSBuZXcgY2MuTm9kZShcInBhc3NfbGFiZWxcIilcbiAgICAgICAgdmFyIGxhYmVsID0gcGFzc05vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBsYWJlbC5zdHJpbmcgPSBcIuS4jeWHulwiXG4gICAgICAgIGxhYmVsLmZvbnRTaXplID0gMjhcbiAgICAgICAgbGFiZWwubGluZUhlaWdodCA9IDM2XG4gICAgICAgIHBhc3NOb2RlLmNvbG9yID0gY2MuY29sb3IoMjU1LCAyMDAsIDEwMClcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOaPj+i+uVxuICAgICAgICB2YXIgb3V0bGluZSA9IHBhc3NOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpXG4gICAgICAgIG91dGxpbmUuY29sb3IgPSBjYy5jb2xvcigxMDAsIDUwLCAwKVxuICAgICAgICBvdXRsaW5lLndpZHRoID0gMlxuICAgICAgICBcbiAgICAgICAgcGFzc05vZGUucGFyZW50ID0gb3V0Q2FyZF9ub2RlXG4gICAgICAgIHBhc3NOb2RlLnNldFBvc2l0aW9uKDAsIDApXG5cbiAgICAgICAgLy8gMuenkuWQjuiHquWKqOa2iOWksVxuICAgICAgICB0aGlzLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChwYXNzTm9kZSAmJiBwYXNzTm9kZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgcGFzc05vZGUuZGVzdHJveSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDIpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHojrflj5bniYznmoTmmL7npLrlkI3np7BcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2FyZCAtIOeJjOaVsOaNriB7c3VpdCwgcmFua31cbiAgICAgKiBAcmV0dXJucyB7U3RyaW5nfSDniYznmoTkuK3mloflkI3np7DvvIzlpoIgXCLlpKfnjotcIuOAgVwi5bCP546LXCLjgIFcIum7keahg0FcIiDnrYlcbiAgICAgKi9cbiAgICBfZ2V0Q2FyZERpc3BsYXlOYW1lOiBmdW5jdGlvbihjYXJkKSB7XG4gICAgICAgIGlmICghY2FyZCkgcmV0dXJuIFwi5pyq55+l54mMXCJcbiAgICAgICAgXG4gICAgICAgIHZhciBzdWl0ID0gY2FyZC5zdWl0XG4gICAgICAgIHZhciByYW5rID0gY2FyZC5yYW5rXG4gICAgICAgIFxuICAgICAgICAvLyDlpKflsI/njotcbiAgICAgICAgaWYgKHJhbmsgPT09IDE3KSByZXR1cm4gXCLlpKfnjotcIlxuICAgICAgICBpZiAocmFuayA9PT0gMTYpIHJldHVybiBcIuWwj+eOi1wiXG4gICAgICAgIFxuICAgICAgICAvLyDoirHoibLlkI3np7BcbiAgICAgICAgdmFyIHN1aXROYW1lcyA9IHsgMDogXCLpu5HmoYNcIiwgMTogXCLnuqLlv4NcIiwgMjogXCLmooXoirFcIiwgMzogXCLmlrnlnZdcIiwgNDogXCJcIiB9XG4gICAgICAgIHZhciBzdWl0TmFtZSA9IHN1aXROYW1lc1tzdWl0XSB8fCBcIlwiXG4gICAgICAgIFxuICAgICAgICAvLyDniYzpnaLlkI3np7BcbiAgICAgICAgdmFyIHJhbmtOYW1lcyA9IHtcbiAgICAgICAgICAgIDM6IFwiM1wiLCA0OiBcIjRcIiwgNTogXCI1XCIsIDY6IFwiNlwiLCA3OiBcIjdcIiwgODogXCI4XCIsIDk6IFwiOVwiLFxuICAgICAgICAgICAgMTA6IFwiMTBcIiwgMTE6IFwiSlwiLCAxMjogXCJRXCIsIDEzOiBcIktcIiwgMTQ6IFwiQVwiLCAxNTogXCIyXCJcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmFua05hbWUgPSByYW5rTmFtZXNbcmFua10gfHwgU3RyaW5nKHJhbmspXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gc3VpdE5hbWUgKyByYW5rTmFtZVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDwn5Sn44CQ5paw5aKe44CR5a6i5oi356uv54mM5Z6L6aqM6K+BXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR6aqM6K+B54mM5Z6L5piv5ZCm5pyJ5pWIXG4gICAgICogQHBhcmFtIHtBcnJheX0gY2FyZHMgLSDopoHpqozor4HnmoTniYzmlbDmja4gW3tzdWl0LCByYW5rLCBjb2xvcn0sIC4uLl1cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSB7dmFsaWQ6IGJvb2xlYW4sIHR5cGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nfVxuICAgICAqL1xuICAgIF92YWxpZGF0ZUhhbmRUeXBlOiBmdW5jdGlvbihjYXJkcykge1xuICAgICAgICBpZiAoIWNhcmRzIHx8IGNhcmRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IGZhbHNlLCB0eXBlOiBcIlwiLCBtZXNzYWdlOiBcIuivt+mAieaLqeimgeWHuueahOeJjFwiIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjb3VudCA9IGNhcmRzLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgLy8g57uf6K6h5ZCE54K55pWw55qE54mM5pWw6YePXG4gICAgICAgIHZhciByYW5rQ291bnRzID0ge31cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYXJkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJhbmsgPSBjYXJkc1tpXS5yYW5rXG4gICAgICAgICAgICBpZiAoIXJhbmtDb3VudHNbcmFua10pIHtcbiAgICAgICAgICAgICAgICByYW5rQ291bnRzW3JhbmtdID0gMFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmFua0NvdW50c1tyYW5rXSsrXG4gICAgICAgIH1cblxuICAgICAgICAvLyDojrflj5bngrnmlbDliJfooajvvIjmjpLluo/lkI7vvIlcbiAgICAgICAgdmFyIHJhbmtzID0gT2JqZWN0LmtleXMocmFua0NvdW50cykubWFwKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHBhcnNlSW50KHIpIH0pLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAtIGIgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPluaVsOmHj+e7n+iuoVxuICAgICAgICB2YXIgY291bnRzID0gT2JqZWN0LnZhbHVlcyhyYW5rQ291bnRzKVxuICAgICAgICB2YXIgZm91cnMgPSBbXSAgLy8g5Zub5bygXG4gICAgICAgIHZhciB0aHJlZXMgPSBbXSAvLyDkuInlvKBcbiAgICAgICAgdmFyIHBhaXJzID0gW10gIC8vIOWvueWtkFxuICAgICAgICB2YXIgc2luZ2xlcyA9IFtdIC8vIOWNleW8oFxuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgcmFuayBpbiByYW5rQ291bnRzKSB7XG4gICAgICAgICAgICB2YXIgYyA9IHJhbmtDb3VudHNbcmFua11cbiAgICAgICAgICAgIGlmIChjID09PSA0KSBmb3Vycy5wdXNoKHBhcnNlSW50KHJhbmspKVxuICAgICAgICAgICAgZWxzZSBpZiAoYyA9PT0gMykgdGhyZWVzLnB1c2gocGFyc2VJbnQocmFuaykpXG4gICAgICAgICAgICBlbHNlIGlmIChjID09PSAyKSBwYWlycy5wdXNoKHBhcnNlSW50KHJhbmspKVxuICAgICAgICAgICAgZWxzZSBpZiAoYyA9PT0gMSkgc2luZ2xlcy5wdXNoKHBhcnNlSW50KHJhbmspKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gMS4g546L54K477yI5Y+M546L77yJXG4gICAgICAgIGlmIChjb3VudCA9PT0gMiAmJiByYW5rQ291bnRzWzE2XSA9PT0gMSAmJiByYW5rQ291bnRzWzE3XSA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUsIHR5cGU6IFwi546L54K4XCIsIG1lc3NhZ2U6IFwiXCIgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gMi4g5Y2V5bygXG4gICAgICAgIGlmIChjb3VudCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUsIHR5cGU6IFwi5Y2V5bygXCIsIG1lc3NhZ2U6IFwiXCIgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gMy4g5a+55a2QXG4gICAgICAgIGlmIChjb3VudCA9PT0gMiAmJiBwYWlycy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCB0eXBlOiBcIuWvueWtkFwiLCBtZXNzYWdlOiBcIlwiIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDQuIOS4ieW8oFxuICAgICAgICBpZiAoY291bnQgPT09IDMgJiYgdGhyZWVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUsIHR5cGU6IFwi5LiJ5bygXCIsIG1lc3NhZ2U6IFwiXCIgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gNS4g54K45by5XG4gICAgICAgIGlmIChjb3VudCA9PT0gNCAmJiBmb3Vycy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCB0eXBlOiBcIueCuOW8uVwiLCBtZXNzYWdlOiBcIlwiIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDYuIOS4ieW4puS4gFxuICAgICAgICBpZiAoY291bnQgPT09IDQgJiYgdGhyZWVzLmxlbmd0aCA9PT0gMSAmJiBzaW5nbGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUsIHR5cGU6IFwi5LiJ5bim5LiAXCIsIG1lc3NhZ2U6IFwiXCIgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gNy4g5LiJ5bim5LqMXG4gICAgICAgIGlmIChjb3VudCA9PT0gNSAmJiB0aHJlZXMubGVuZ3RoID09PSAxICYmIHBhaXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUsIHR5cGU6IFwi5LiJ5bim5LqMXCIsIG1lc3NhZ2U6IFwiXCIgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gOC4g5Zub5bim5LqM77yI5Y2V77yJXG4gICAgICAgIGlmIChjb3VudCA9PT0gNiAmJiBmb3Vycy5sZW5ndGggPT09IDEgJiYgKHNpbmdsZXMubGVuZ3RoID09PSAyIHx8IHBhaXJzLmxlbmd0aCA9PT0gMSkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCB0eXBlOiBcIuWbm+W4puS6jFwiLCBtZXNzYWdlOiBcIlwiIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDkuIOWbm+W4puS4pOWvuVxuICAgICAgICBpZiAoY291bnQgPT09IDggJiYgZm91cnMubGVuZ3RoID09PSAxICYmIHBhaXJzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUsIHR5cGU6IFwi5Zub5bim5Lik5a+5XCIsIG1lc3NhZ2U6IFwiXCIgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gMTAuIOmhuuWtkO+8iOiHs+WwkTXlvKDov57nu63vvIzkuI3ljIXlkKsy5ZKM546L77yJXG4gICAgICAgIGlmIChjb3VudCA+PSA1ICYmIHNpbmdsZXMubGVuZ3RoID09PSBjb3VudCkge1xuICAgICAgICAgICAgLy8g5qOA5p+l5piv5ZCm6L+e57ut5LiU5LiN5YyF5ZCrMuWSjOeOi1xuICAgICAgICAgICAgdmFyIGlzU2VxdWVudGlhbCA9IHRoaXMuX2lzU2VxdWVudGlhbChyYW5rcylcbiAgICAgICAgICAgIHZhciBub1R3b09ySm9rZXIgPSByYW5rcy5ldmVyeShmdW5jdGlvbihyKSB7IHJldHVybiByIDwgMTUgfSkgLy8gcmFuayA8IDE1IOihqOekuuS4jeaYrzLlkoznjotcbiAgICAgICAgICAgIGlmIChpc1NlcXVlbnRpYWwgJiYgbm9Ud29Pckpva2VyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUsIHR5cGU6IFwi6aG65a2QXCIsIG1lc3NhZ2U6IFwiXCIgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gMTEuIOi/nuWvue+8iOiHs+WwkTPlr7nov57nu63vvIlcbiAgICAgICAgaWYgKGNvdW50ID49IDYgJiYgY291bnQgJSAyID09PSAwICYmIHBhaXJzLmxlbmd0aCA9PT0gY291bnQgLyAyKSB7XG4gICAgICAgICAgICB2YXIgcGFpclJhbmtzID0gcGFpcnMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhIC0gYiB9KVxuICAgICAgICAgICAgdmFyIGlzU2VxdWVudGlhbCA9IHRoaXMuX2lzU2VxdWVudGlhbChwYWlyUmFua3MpXG4gICAgICAgICAgICB2YXIgbm9Ud29Pckpva2VyID0gcGFpclJhbmtzLmV2ZXJ5KGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHIgPCAxNSB9KVxuICAgICAgICAgICAgaWYgKGlzU2VxdWVudGlhbCAmJiBub1R3b09ySm9rZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgdHlwZTogXCLov57lr7lcIiwgbWVzc2FnZTogXCJcIiB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyAxMi4g6aOe5py677yI6Iez5bCRMuS4qui/nue7reS4ieW8oO+8iVxuICAgICAgICBpZiAodGhyZWVzLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgICB2YXIgdGhyZWVSYW5rcyA9IHRocmVlcy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgLSBiIH0pXG4gICAgICAgICAgICB2YXIgaXNTZXF1ZW50aWFsID0gdGhpcy5faXNTZXF1ZW50aWFsKHRocmVlUmFua3MpXG4gICAgICAgICAgICB2YXIgbm9Ud29Pckpva2VyID0gdGhyZWVSYW5rcy5ldmVyeShmdW5jdGlvbihyKSB7IHJldHVybiByIDwgMTUgfSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGlzU2VxdWVudGlhbCAmJiBub1R3b09ySm9rZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGhyZWVDb3VudCA9IHRocmVlcy5sZW5ndGhcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDpo57mnLrkuI3luKbnv4XohoBcbiAgICAgICAgICAgICAgICBpZiAoY291bnQgPT09IHRocmVlQ291bnQgKiAzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCB0eXBlOiBcIumjnuaculwiLCBtZXNzYWdlOiBcIlwiIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g6aOe5py65bim5Y2VXG4gICAgICAgICAgICAgICAgaWYgKGNvdW50ID09PSB0aHJlZUNvdW50ICogNCAmJiBzaW5nbGVzLmxlbmd0aCA9PT0gdGhyZWVDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgdHlwZTogXCLpo57mnLrluKbljZVcIiwgbWVzc2FnZTogXCJcIiB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOmjnuacuuW4puWvuVxuICAgICAgICAgICAgICAgIGlmIChjb3VudCA9PT0gdGhyZWVDb3VudCAqIDUgJiYgcGFpcnMubGVuZ3RoID09PSB0aHJlZUNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCB0eXBlOiBcIumjnuacuuW4puWvuVwiLCBtZXNzYWdlOiBcIlwiIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDml6DmlYjniYzlnotcbiAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IGZhbHNlLCB0eXBlOiBcIlwiLCBtZXNzYWdlOiBcIuaXoOaViOeahOeJjOWei++8jOivt+mHjeaWsOmAieaLqVwiIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog5qOA5p+l54K55pWw5piv5ZCm6L+e57utXG4gICAgICogQHBhcmFtIHtBcnJheX0gcmFua3MgLSDmjpLluo/lkI7nmoTngrnmlbDmlbDnu4RcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0g5piv5ZCm6L+e57utXG4gICAgICovXG4gICAgX2lzU2VxdWVudGlhbDogZnVuY3Rpb24ocmFua3MpIHtcbiAgICAgICAgaWYgKCFyYW5rcyB8fCByYW5rcy5sZW5ndGggPCAyKSByZXR1cm4gdHJ1ZVxuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCByYW5rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHJhbmtzW2ldIC0gcmFua3NbaS0xXSAhPT0gMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIPCflKfjgJDmlrDlop7jgJHnu5PnrpflvLnnqpfns7vnu59cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIPCfj4Yg5pi+56S65ri45oiP57uT566X5by556qXXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSDmnI3liqHnq6/lub/mkq3nmoTnu5PnrpfmlbDmja5cbiAgICAgKi9cbiAgICBfc2hvd0dhbWVSZXN1bHRQb3B1cDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIOOAkOernuaKgOWcuuOAkeajgOafpeaYr+WQpuaYr+ernuaKgOWcuuaooeW8j1xuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgaWYgKHRoaXMuX2lzQ29tcGV0aXRpb24gfHwgZGF0YS5yb29tX2NhdGVnb3J5ID09PSAyKSB7XG4gICAgICAgICAgICAvLyDnq57mioDlnLrmqKHlvI/kvb/nlKjnibnmrornmoTnu5PnrpfpobVcbiAgICAgICAgICAgIHRoaXMuX3Nob3dDb21wZXRpdGlvblJlc3VsdFBvcHVwKGRhdGEpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5Yik5pat5b2T5YmN546p5a625piv5ZCm6IOc5YipXG4gICAgICAgIHZhciBteVBsYXllcklkID0gbXlnbG9iYWwuc29ja2V0LmdldFBsYXllckluZm8oKS5pZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLnNlcnZlclBsYXllcklkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEXG4gICAgICAgIHZhciBpc1dpbm5lciA9IGZhbHNlXG4gICAgICAgIHZhciBteVdpbkdvbGQgPSAwXG4gICAgICAgIFxuICAgICAgICAvLyDku44gcGxheWVycyDmlbDnu4TkuK3mib7liLDlvZPliY3njqnlrrbnmoTnu5PmnpxcbiAgICAgICAgaWYgKGRhdGEucGxheWVycyAmJiBkYXRhLnBsYXllcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLnBsYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcGxheWVyID0gZGF0YS5wbGF5ZXJzW2ldXG4gICAgICAgICAgICAgICAgaWYgKFN0cmluZyhwbGF5ZXIucGxheWVyX2lkKSA9PT0gU3RyaW5nKG15UGxheWVySWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzV2lubmVyID0gcGxheWVyLmlzX3dpbm5lclxuICAgICAgICAgICAgICAgICAgICBteVdpbkdvbGQgPSBwbGF5ZXIud2luX2dvbGRcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDlhbzlrrnml6fniYjmnKzvvJrpgJrov4cgd2lubmVyX2lkIOWIpOaWrVxuICAgICAgICAgICAgaXNXaW5uZXIgPSBTdHJpbmcoZGF0YS53aW5uZXJfaWQpID09PSBTdHJpbmcobXlQbGF5ZXJJZClcbiAgICAgICAgICAgIGlmICghaXNXaW5uZXIgJiYgIWRhdGEuaXNfbGFuZGxvcmQpIHtcbiAgICAgICAgICAgICAgICB2YXIgaXNMYW5kbG9yZCA9IG15Z2xvYmFsLnBsYXllckRhdGEubWFzdGVyX2FjY291bnRpZCA9PT0gbXlQbGF5ZXJJZFxuICAgICAgICAgICAgICAgIGlmICghaXNMYW5kbG9yZCkge1xuICAgICAgICAgICAgICAgICAgICBpc1dpbm5lciA9IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHmm7TmlrDmnKzlnLDnjqnlrrbnmoTph5HluIHmlbDph49cbiAgICAgICAgaWYgKG15Z2xvYmFsLnBsYXllckRhdGEgJiYgbXlXaW5Hb2xkICE9PSAwKSB7XG4gICAgICAgICAgICB2YXIgb2xkR29sZCA9IG15Z2xvYmFsLnBsYXllckRhdGEuZ29iYWxfY291bnQgfHwgMFxuICAgICAgICAgICAgdmFyIG5ld0dvbGQgPSBvbGRHb2xkICsgbXlXaW5Hb2xkXG4gICAgICAgICAgICAvLyDnoa7kv53ph5HluIHkuI3kuLrotJ/mlbBcbiAgICAgICAgICAgIGlmIChuZXdHb2xkIDwgMCkge1xuICAgICAgICAgICAgICAgIG5ld0dvbGQgPSAwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLmdvYmFsX2NvdW50ID0gbmV3R29sZFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5pu05paw5omA5pyJ546p5a6255qE6YeR5biB5pi+56S6XG4gICAgICAgIGlmIChkYXRhLnBsYXllcnMgJiYgZGF0YS5wbGF5ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5wbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBsYXllciA9IGRhdGEucGxheWVyc1tpXVxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJJZCA9IHBsYXllci5wbGF5ZXJfaWRcbiAgICAgICAgICAgICAgICB2YXIgZ29sZEFmdGVyID0gcGxheWVyLmdvbGRfYWZ0ZXJcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5Y+q6KaBIGdvbGRBZnRlciA+PSAwIOWwseabtOaWsOaYvuekuu+8iOWMheaLrCAwIOeahOaDheWGte+8iVxuICAgICAgICAgICAgICAgIC8vIOacjeWKoeerr+i/lOWbnueahCBnb2xkX2FmdGVyID49IDAg6KGo56S65p+l6K+i5Yiw5LqG5pyJ5pWI5pWw5o2uXG4gICAgICAgICAgICAgICAgaWYgKGdvbGRBZnRlciA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVBsYXllckdvbGREaXNwbGF5KHBsYXllcklkLCBnb2xkQWZ0ZXIpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c5pyN5Yqh56uv5rKh5pyJ6L+U5Zue5pyJ5pWI55qEIGdvbGRfYWZ0ZXLvvIzliJnmnKzlnLDorqHnrpdcbiAgICAgICAgICAgICAgICAgICAgLy8g6L+Z56eN5oOF5Ya15LiL77yM5Y+q5pu05paw5b2T5YmN546p5a6255qE6YeR5biBXG4gICAgICAgICAgICAgICAgICAgIGlmIChTdHJpbmcocGxheWVySWQpID09PSBTdHJpbmcobXlQbGF5ZXJJZCkgJiYgbXlXaW5Hb2xkICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbG9jYWxHb2xkID0gbXlnbG9iYWwucGxheWVyRGF0YS5nb2JhbF9jb3VudCB8fCAwXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVQbGF5ZXJHb2xkRGlzcGxheShwbGF5ZXJJZCwgbG9jYWxHb2xkKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmkq3mlL7nu5Pmnpzpn7PmlYhcbiAgICAgICAgdGhpcy5fcGxheUdhbWVSZXN1bHRTb3VuZChpc1dpbm5lcilcbiAgICAgICAgXG4gICAgICAgIC8vIOWIm+W7uue7k+eul+W8ueeql1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgdGhpcy5fY3JlYXRlR2FtZVJlc3VsdFBvcHVwKGRhdGEsIGlzV2lubmVyLCBteVdpbkdvbGQsIGZ1bmN0aW9uKGFjdGlvbikge1xuICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gXCJjb250aW51ZVwiKSB7XG4gICAgICAgICAgICAgICAgLy8g57un57ut5ri45oiP77ya5Y+R6YCBIHJlYWR5IOivt+axglxuICAgICAgICAgICAgICAgIHNlbGYuX2NvbnRpbnVlR2FtZSgpXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJsb2JieVwiKSB7XG4gICAgICAgICAgICAgICAgLy8g6L+U5Zue5aSn5Y6FXG4gICAgICAgICAgICAgICAgc2VsZi5fcmV0dXJuVG9Mb2JieSgpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCfj4Yg5Yib5bu657uT566X5by556qXVUkgLSDmrKLkuZDmlpflnLDkuLvpq5jnuqfpo47moLxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIOe7k+eul+aVsOaNrlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNXaW5uZXIgLSDmmK/lkKbog5zliKlcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbXlXaW5Hb2xkIC0g5b2T5YmN546p5a626L6T6LWi6LGG5a2QXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSDlm57osIPlh73mlbBcbiAgICAgKi9cbiAgICBfY3JlYXRlR2FtZVJlc3VsdFBvcHVwOiBmdW5jdGlvbihkYXRhLCBpc1dpbm5lciwgbXlXaW5Hb2xkLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgdmFyIHdpblNpemUgPSBjYy53aW5TaXplXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5om+5YiwQ2FudmFz6IqC54K55L2c5Li65by556qX54i26IqC54K5XG4gICAgICAgIHZhciBjYW52YXMgPSBjYy5maW5kKFwiQ2FudmFzXCIpIHx8IGNjLmZpbmQoXCJVSV9ST09UXCIpIHx8IHRoaXMubm9kZS5wYXJlbnRcbiAgICAgICAgaWYgKCFjYW52YXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn4+GIFtfY3JlYXRlR2FtZVJlc3VsdFBvcHVwXSDmib7kuI3liLBDYW52YXPoioLngrlcIilcbiAgICAgICAgICAgIGNhbnZhcyA9IHRoaXMubm9kZVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDpga7nvanlsYIgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdmFyIG1hc2tOb2RlID0gbmV3IGNjLk5vZGUoKVxuICAgICAgICBtYXNrTm9kZS5uYW1lID0gXCJHYW1lUmVzdWx0TWFza1wiXG4gICAgICAgIG1hc2tOb2RlLmFkZENvbXBvbmVudChjYy5CbG9ja0lucHV0RXZlbnRzKVxuICAgICAgICB2YXIgbWFza1Nwcml0ZSA9IG1hc2tOb2RlLmFkZENvbXBvbmVudChjYy5TcHJpdGUpXG4gICAgICAgIG1hc2tTcHJpdGUuc3ByaXRlRnJhbWUgPSBuZXcgY2MuU3ByaXRlRnJhbWUoKVxuICAgICAgICBtYXNrU3ByaXRlLnR5cGUgPSBjYy5TcHJpdGUuVHlwZS5TSU1QTEVcbiAgICAgICAgbWFza1Nwcml0ZS5zaXplTW9kZSA9IGNjLlNwcml0ZS5TaXplTW9kZS5DVVNUT01cbiAgICAgICAgbWFza05vZGUud2lkdGggPSB3aW5TaXplLndpZHRoICogMlxuICAgICAgICBtYXNrTm9kZS5oZWlnaHQgPSB3aW5TaXplLmhlaWdodCAqIDJcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeS4jemAmui/h2NvbG9y6K6+572uYWxwaGHvvIzkvb/nlKhvcGFjaXR55Luj5pu/XG4gICAgICAgIG1hc2tOb2RlLmNvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoMCwgMCwgMzApIDogbmV3IGNjLkNvbG9yKDMwLCAwLCAwKVxuICAgICAgICBtYXNrTm9kZS5vcGFjaXR5ID0gMFxuICAgICAgICBtYXNrTm9kZS54ID0gMFxuICAgICAgICBtYXNrTm9kZS55ID0gMFxuICAgICAgICBtYXNrTm9kZS56SW5kZXggPSA5OTkgIC8vIPCflKfjgJDkv67lpI3jgJHpga7nvanlsYJ6SW5kZXhcbiAgICAgICAgbWFza05vZGUucGFyZW50ID0gY2FudmFzXG4gICAgICAgIFxuICAgICAgICAvLyDpga7nvanmt6HlhaXliqjnlLtcbiAgICAgICAgY2MudHdlZW4obWFza05vZGUpLnRvKDAuMywgeyBvcGFjaXR5OiAyNTUgfSkuc3RhcnQoKVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5by556qX5a655ZmoID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBwb3B1cE5vZGUgPSBuZXcgY2MuTm9kZSgpXG4gICAgICAgIHBvcHVwTm9kZS5uYW1lID0gXCJHYW1lUmVzdWx0UG9wdXBcIlxuICAgICAgICBwb3B1cE5vZGUueCA9IDBcbiAgICAgICAgcG9wdXBOb2RlLnkgPSAwXG4gICAgICAgIHBvcHVwTm9kZS5zY2FsZSA9IDAuNVxuICAgICAgICBwb3B1cE5vZGUub3BhY2l0eSA9IDBcbiAgICAgICAgcG9wdXBOb2RlLnpJbmRleCA9IDEwMDAgIC8vIPCflKfjgJDkv67lpI3jgJHlvLnnqpflsYJ6SW5kZXhcbiAgICAgICAgcG9wdXBOb2RlLnBhcmVudCA9IGNhbnZhc1xuICAgICAgICBcbiAgICAgICAgLy8g5by556qX5bC65a+477yINzAl5a6977yMNzUl6auY77yJXG4gICAgICAgIHZhciBwb3B1cFdpZHRoID0gTWF0aC5taW4od2luU2l6ZS53aWR0aCAqIDAuNywgODAwKVxuICAgICAgICB2YXIgcG9wdXBIZWlnaHQgPSBNYXRoLm1pbih3aW5TaXplLmhlaWdodCAqIDAuNzUsIDU1MClcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOS4u+iDjOaZryAtIOa4kOWPmOaViOaenCA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgYmdOb2RlID0gc2VsZi5fY3JlYXRlR3JhZGllbnRCYWNrZ3JvdW5kKHBvcHVwV2lkdGgsIHBvcHVwSGVpZ2h0LCBpc1dpbm5lcilcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g6YeR6L655o+P6L65ID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBib3JkZXJOb2RlID0gc2VsZi5fY3JlYXRlR29sZGVuQm9yZGVyKHBvcHVwV2lkdGgsIHBvcHVwSGVpZ2h0LCBpc1dpbm5lcilcbiAgICAgICAgYm9yZGVyTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOeykuWtkOeJueaViOWxgiA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgZWZmZWN0TGF5ZXIgPSBuZXcgY2MuTm9kZShcIkVmZmVjdExheWVyXCIpXG4gICAgICAgIGVmZmVjdExheWVyLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g6IOc5Yip57KS5a2Q54m55pWIXG4gICAgICAgIGlmIChpc1dpbm5lcikge1xuICAgICAgICAgICAgc2VsZi5fY3JlYXRlVmljdG9yeVBhcnRpY2xlcyhlZmZlY3RMYXllciwgcG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLl9jcmVhdGVEZWZlYXRQYXJ0aWNsZXMoZWZmZWN0TGF5ZXIsIHBvcHVwV2lkdGgsIHBvcHVwSGVpZ2h0KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDpobbpg6ggQmFubmVyID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBiYW5uZXJZID0gcG9wdXBIZWlnaHQgLyAyIC0gNjBcbiAgICAgICAgdmFyIGJhbm5lck5vZGUgPSBzZWxmLl9jcmVhdGVSZXN1bHRCYW5uZXIoaXNXaW5uZXIsIHBvcHVwV2lkdGgpXG4gICAgICAgIGJhbm5lck5vZGUueSA9IGJhbm5lcllcbiAgICAgICAgYmFubmVyTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOWPs+S+p+WAjeaVsOivpuaDheWNoSA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgZGV0YWlsWCA9IHBvcHVwV2lkdGggLyAyIC0gMTMwXG4gICAgICAgIHZhciBkZXRhaWxZID0gMjBcbiAgICAgICAgdmFyIGRldGFpbE5vZGUgPSBzZWxmLl9jcmVhdGVNdWx0aXBsaWVyRGV0YWlsQ2FyZChkYXRhLCBpc1dpbm5lcilcbiAgICAgICAgZGV0YWlsTm9kZS54ID0gZGV0YWlsWFxuICAgICAgICBkZXRhaWxOb2RlLnkgPSBkZXRhaWxZXG4gICAgICAgIGRldGFpbE5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDkuK3pl7Tnjqnlrrbnu5PmnpzliJfooaggPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdmFyIGxpc3RXaWR0aCA9IHBvcHVwV2lkdGggKiAwLjU1XG4gICAgICAgIHZhciBsaXN0WCA9IC1wb3B1cFdpZHRoIC8gMiArIGxpc3RXaWR0aCAvIDIgKyA1MFxuICAgICAgICB2YXIgbGlzdFkgPSAtMjBcbiAgICAgICAgdmFyIHBsYXllckxpc3ROb2RlID0gc2VsZi5fY3JlYXRlUGxheWVyUmVzdWx0TGlzdChkYXRhLCBpc1dpbm5lciwgbXlXaW5Hb2xkLCBsaXN0V2lkdGgpXG4gICAgICAgIHBsYXllckxpc3ROb2RlLnggPSBsaXN0WFxuICAgICAgICBwbGF5ZXJMaXN0Tm9kZS55ID0gbGlzdFlcbiAgICAgICAgcGxheWVyTGlzdE5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDlupXpg6jmjInpkq7ljLrln58gPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdmFyIGJ0blkgPSAtcG9wdXBIZWlnaHQgLyAyICsgNjBcbiAgICAgICAgdmFyIGJ1dHRvbkFyZWEgPSBzZWxmLl9jcmVhdGVCdXR0b25BcmVhKGlzV2lubmVyLCBmdW5jdGlvbihhY3Rpb24pIHtcbiAgICAgICAgICAgIHNlbGYuX2Nsb3NlR2FtZVJlc3VsdFBvcHVwKHBvcHVwTm9kZSwgbWFza05vZGUpXG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGFjdGlvbilcbiAgICAgICAgfSlcbiAgICAgICAgYnV0dG9uQXJlYS55ID0gYnRuWVxuICAgICAgICBidXR0b25BcmVhLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5by55Ye65Yqo55S7ID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIGNjLnR3ZWVuKHBvcHVwTm9kZSlcbiAgICAgICAgICAgIC50bygwLjM1LCB7IHNjYWxlOiAxLCBvcGFjaXR5OiAyNTUgfSwgeyBlYXNpbmc6ICdiYWNrT3V0JyB9KVxuICAgICAgICAgICAgLmNhbGwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8g6Kem5Y+R5pWw5a2X5rua5Yqo5Yqo55S7XG4gICAgICAgICAgICAgICAgc2VsZi5fc3RhcnROdW1iZXJBbmltYXRpb25zKHBvcHVwTm9kZSwgZGF0YSwgbXlXaW5Hb2xkKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGFydCgpXG4gICAgICAgIFxuICAgICAgICAvLyDkv53lrZjlvJXnlKhcbiAgICAgICAgdGhpcy5fZ2FtZVJlc3VsdFBvcHVwID0gcG9wdXBOb2RlXG4gICAgICAgIHRoaXMuX2dhbWVSZXN1bHRNYXNrID0gbWFza05vZGVcbiAgICAgICAgdGhpcy5fcmVzdWx0RWZmZWN0TGF5ZXIgPSBlZmZlY3RMYXllclxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDwn46oIOe7k+eul+W8ueeql+inhuiniee7hOS7tiAtIOmrmOe6p+aViOaenFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICog8J+OqCDliJvlu7rmuJDlj5jog4zmma9cbiAgICAgKi9cbiAgICBfY3JlYXRlR3JhZGllbnRCYWNrZ3JvdW5kOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBpc1dpbm5lcikge1xuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJHcmFkaWVudEJnXCIpXG4gICAgICAgIHZhciBncmFwaGljcyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIFxuICAgICAgICAvLyDmuJDlj5joibJcbiAgICAgICAgdmFyIHRvcENvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoNDAsIDMwLCA4MCwgMjU1KSA6IG5ldyBjYy5Db2xvcigzMCwgMzAsIDQwLCAyNTUpXG4gICAgICAgIHZhciBib3R0b21Db2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDIwLCAxNSwgNTAsIDI1NSkgOiBuZXcgY2MuQ29sb3IoMjAsIDIwLCAzMCwgMjU1KVxuICAgICAgICBcbiAgICAgICAgLy8g57uY5Yi25riQ5Y+Y55+p5b2i77yI5qih5ouf77yJXG4gICAgICAgIGdyYXBoaWNzLmZpbGxDb2xvciA9IGJvdHRvbUNvbG9yXG4gICAgICAgIGdyYXBoaWNzLnJvdW5kUmVjdCgtd2lkdGgvMiwgLWhlaWdodC8yLCB3aWR0aCwgaGVpZ2h0LCAyMClcbiAgICAgICAgZ3JhcGhpY3MuZmlsbCgpXG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDlhoXlj5HlhYnmlYjmnpxcbiAgICAgICAgdmFyIGlubmVyR2xvdyA9IG5ldyBjYy5Ob2RlKFwiSW5uZXJHbG93XCIpXG4gICAgICAgIHZhciBnbG93U3ByaXRlID0gaW5uZXJHbG93LmFkZENvbXBvbmVudChjYy5TcHJpdGUpXG4gICAgICAgIGdsb3dTcHJpdGUuc3ByaXRlRnJhbWUgPSBuZXcgY2MuU3ByaXRlRnJhbWUoKVxuICAgICAgICBnbG93U3ByaXRlLnR5cGUgPSBjYy5TcHJpdGUuVHlwZS5TTElDRURcbiAgICAgICAgaW5uZXJHbG93LndpZHRoID0gd2lkdGggLSAyMFxuICAgICAgICBpbm5lckdsb3cuaGVpZ2h0ID0gaGVpZ2h0IC0gMjBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeS4jemAmui/h2NvbG9y6K6+572uYWxwaGHvvIzkvb/nlKhvcGFjaXR55Luj5pu/XG4gICAgICAgIGlubmVyR2xvdy5jb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDYwLCA0MCwgMTAwKSA6IG5ldyBjYy5Db2xvcig0MCwgNDAsIDUwKVxuICAgICAgICBpbm5lckdsb3cub3BhY2l0eSA9IDEwMFxuICAgICAgICBpbm5lckdsb3cucGFyZW50ID0gYmdOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDog4zmma/nurnnkIbmlYjmnpxcbiAgICAgICAgdmFyIG92ZXJsYXkgPSBuZXcgY2MuTm9kZShcIk92ZXJsYXlcIilcbiAgICAgICAgdmFyIG92ZXJsYXlTcHJpdGUgPSBvdmVybGF5LmFkZENvbXBvbmVudChjYy5TcHJpdGUpXG4gICAgICAgIG92ZXJsYXlTcHJpdGUuc3ByaXRlRnJhbWUgPSBuZXcgY2MuU3ByaXRlRnJhbWUoKVxuICAgICAgICBvdmVybGF5LndpZHRoID0gd2lkdGhcbiAgICAgICAgb3ZlcmxheS5oZWlnaHQgPSBoZWlnaHRcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeS4jemAmui/h2NvbG9y6K6+572uYWxwaGHvvIzkvb/nlKhvcGFjaXR55Luj5pu/XG4gICAgICAgIG92ZXJsYXkuY29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcig4MCwgNTAsIDEyMCkgOiBuZXcgY2MuQ29sb3IoNTAsIDUwLCA2MClcbiAgICAgICAgb3ZlcmxheS5vcGFjaXR5ID0gMzBcbiAgICAgICAgb3ZlcmxheS5wYXJlbnQgPSBiZ05vZGVcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBiZ05vZGVcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+OqCDliJvlu7rph5Hovrnmj4/ovrlcbiAgICAgKi9cbiAgICBfY3JlYXRlR29sZGVuQm9yZGVyOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBpc1dpbm5lcikge1xuICAgICAgICB2YXIgYm9yZGVyTm9kZSA9IG5ldyBjYy5Ob2RlKFwiR29sZGVuQm9yZGVyXCIpXG4gICAgICAgIHZhciBncmFwaGljcyA9IGJvcmRlck5vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBcbiAgICAgICAgLy8g6L655qGG6aKc6ImyXG4gICAgICAgIHZhciBib3JkZXJDb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDI1NSwgMjAwLCA1MCwgMjU1KSA6IG5ldyBjYy5Db2xvcigxMDAsIDEwMCwgMTIwLCAyNTUpXG4gICAgICAgIHZhciBnbG93Q29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcigyNTUsIDE4MCwgMCwgMTUwKSA6IG5ldyBjYy5Db2xvcig4MCwgODAsIDEwMCwgMTAwKVxuICAgICAgICBcbiAgICAgICAgLy8g5aSW5Y+R5YWJXG4gICAgICAgIGdyYXBoaWNzLnN0cm9rZUNvbG9yID0gZ2xvd0NvbG9yXG4gICAgICAgIGdyYXBoaWNzLmxpbmVXaWR0aCA9IDhcbiAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC13aWR0aC8yIC0gNCwgLWhlaWdodC8yIC0gNCwgd2lkdGggKyA4LCBoZWlnaHQgKyA4LCAyNClcbiAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlKClcbiAgICAgICAgXG4gICAgICAgIC8vIOS4u+i+ueahhlxuICAgICAgICBncmFwaGljcy5zdHJva2VDb2xvciA9IGJvcmRlckNvbG9yXG4gICAgICAgIGdyYXBoaWNzLmxpbmVXaWR0aCA9IDNcbiAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC13aWR0aC8yLCAtaGVpZ2h0LzIsIHdpZHRoLCBoZWlnaHQsIDIwKVxuICAgICAgICBncmFwaGljcy5zdHJva2UoKVxuICAgICAgICBcbiAgICAgICAgLy8g6KeS6JC96KOF6aWwXG4gICAgICAgIHZhciBjb3JuZXJTaXplID0gMzBcbiAgICAgICAgdmFyIGNvcm5lcnMgPSBbXG4gICAgICAgICAgICB7IHg6IC13aWR0aC8yLCB5OiBoZWlnaHQvMiwgcm90OiAwIH0sXG4gICAgICAgICAgICB7IHg6IHdpZHRoLzIsIHk6IGhlaWdodC8yLCByb3Q6IDkwIH0sXG4gICAgICAgICAgICB7IHg6IHdpZHRoLzIsIHk6IC1oZWlnaHQvMiwgcm90OiAxODAgfSxcbiAgICAgICAgICAgIHsgeDogLXdpZHRoLzIsIHk6IC1oZWlnaHQvMiwgcm90OiAyNzAgfVxuICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvcm5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjb3JuZXIgPSBjb3JuZXJzW2ldXG4gICAgICAgICAgICB2YXIgZGVjb3JOb2RlID0gbmV3IGNjLk5vZGUoXCJDb3JuZXJfXCIgKyBpKVxuICAgICAgICAgICAgdmFyIGRnID0gZGVjb3JOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgICAgIGRnLnN0cm9rZUNvbG9yID0gYm9yZGVyQ29sb3JcbiAgICAgICAgICAgIGRnLmxpbmVXaWR0aCA9IDJcbiAgICAgICAgICAgIGRnLm1vdmVUbygwLCAwKVxuICAgICAgICAgICAgZGcubGluZVRvKGNvcm5lclNpemUsIDApXG4gICAgICAgICAgICBkZy5saW5lVG8oY29ybmVyU2l6ZSwgY29ybmVyU2l6ZSlcbiAgICAgICAgICAgIGRnLnN0cm9rZSgpXG4gICAgICAgICAgICBkZWNvck5vZGUueCA9IGNvcm5lci54XG4gICAgICAgICAgICBkZWNvck5vZGUueSA9IGNvcm5lci55XG4gICAgICAgICAgICBkZWNvck5vZGUuYW5nbGUgPSBjb3JuZXIucm90XG4gICAgICAgICAgICBkZWNvck5vZGUucGFyZW50ID0gYm9yZGVyTm9kZVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYm9yZGVyTm9kZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn4+GIOWIm+W7uue7k+aenEJhbm5lcu+8iOiDnOWIqS/lpLHotKXmoIfpopjvvIlcbiAgICAgKi9cbiAgICBfY3JlYXRlUmVzdWx0QmFubmVyOiBmdW5jdGlvbihpc1dpbm5lciwgcG9wdXBXaWR0aCkge1xuICAgICAgICB2YXIgYmFubmVyTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUmVzdWx0QmFubmVyXCIpXG4gICAgICAgIFxuICAgICAgICAvLyBCYW5uZXLog4zmma9cbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmFubmVyQmdcIilcbiAgICAgICAgdmFyIGdyYXBoaWNzID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgdmFyIGJhbm5lcldpZHRoID0gcG9wdXBXaWR0aCAqIDAuNlxuICAgICAgICB2YXIgYmFubmVySGVpZ2h0ID0gNzBcbiAgICAgICAgXG4gICAgICAgIGlmIChpc1dpbm5lcikge1xuICAgICAgICAgICAgLy8g6IOc5YipIC0g6YeR6Imy5riQ5Y+Y6IOM5pmvXG4gICAgICAgICAgICBncmFwaGljcy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjAwLCAxNTAsIDMwLCAyMDApXG4gICAgICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLWJhbm5lcldpZHRoLzIsIC1iYW5uZXJIZWlnaHQvMiwgYmFubmVyV2lkdGgsIGJhbm5lckhlaWdodCwgMzUpXG4gICAgICAgICAgICBncmFwaGljcy5maWxsKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5Y+R5YWJ6L655qGGXG4gICAgICAgICAgICBncmFwaGljcy5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIyMCwgMTAwLCAyNTUpXG4gICAgICAgICAgICBncmFwaGljcy5saW5lV2lkdGggPSAzXG4gICAgICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLWJhbm5lcldpZHRoLzIsIC1iYW5uZXJIZWlnaHQvMiwgYmFubmVyV2lkdGgsIGJhbm5lckhlaWdodCwgMzUpXG4gICAgICAgICAgICBncmFwaGljcy5zdHJva2UoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5aSx6LSlIC0g5pqX57qi6Imy6IOM5pmvXG4gICAgICAgICAgICBncmFwaGljcy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoODAsIDQwLCA1MCwgMjAwKVxuICAgICAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC1iYW5uZXJXaWR0aC8yLCAtYmFubmVySGVpZ2h0LzIsIGJhbm5lcldpZHRoLCBiYW5uZXJIZWlnaHQsIDM1KVxuICAgICAgICAgICAgZ3JhcGhpY3MuZmlsbCgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGdyYXBoaWNzLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDE1MCwgMTAwLCAxMDAsIDI1NSlcbiAgICAgICAgICAgIGdyYXBoaWNzLmxpbmVXaWR0aCA9IDJcbiAgICAgICAgICAgIGdyYXBoaWNzLnJvdW5kUmVjdCgtYmFubmVyV2lkdGgvMiwgLWJhbm5lckhlaWdodC8yLCBiYW5uZXJXaWR0aCwgYmFubmVySGVpZ2h0LCAzNSlcbiAgICAgICAgICAgIGdyYXBoaWNzLnN0cm9rZSgpXG4gICAgICAgIH1cbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IGJhbm5lck5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOagh+mimOaWh+Wtl1xuICAgICAgICB2YXIgdGl0bGVOb2RlID0gbmV3IGNjLk5vZGUoXCJUaXRsZVwiKVxuICAgICAgICB0aXRsZU5vZGUuYW5jaG9yWCA9IDAuNVxuICAgICAgICB0aXRsZU5vZGUuYW5jaG9yWSA9IDAuNVxuICAgICAgICB2YXIgdGl0bGVMYWJlbCA9IHRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHRpdGxlTGFiZWwuc3RyaW5nID0gaXNXaW5uZXIgPyBcIvCfj4Yg6IOcIOWIqSDwn4+GXCIgOiBcIuKcliDlpLEg6LSlIOKcllwiXG4gICAgICAgIHRpdGxlTGFiZWwuZm9udFNpemUgPSA0MlxuICAgICAgICB0aXRsZUxhYmVsLmxpbmVIZWlnaHQgPSA1MFxuICAgICAgICB0aXRsZUxhYmVsLmZvbnRGYW1pbHkgPSBcIkFyaWFsXCJcbiAgICAgICAgdGl0bGVMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHRpdGxlTGFiZWwudmVydGljYWxBbGlnbiA9IGNjLkxhYmVsLlZlcnRpY2FsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHRpdGxlTm9kZS5jb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpIDogbmV3IGNjLkNvbG9yKDIwMCwgMTgwLCAxODApXG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDmj4/ovrlcbiAgICAgICAgdmFyIG91dGxpbmUgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSlcbiAgICAgICAgb3V0bGluZS5jb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDE1MCwgMTAwLCAwKSA6IG5ldyBjYy5Db2xvcig4MCwgNDAsIDQwKVxuICAgICAgICBvdXRsaW5lLndpZHRoID0gM1xuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg5Y+R5YWJ5pWI5p6c77yI5L2/55So6Zi05b2x5qih5ouf77yJXG4gICAgICAgIHZhciBzaGFkb3cgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsU2hhZG93KVxuICAgICAgICBzaGFkb3cuY29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcigyNTUsIDIwMCwgMCwgMjAwKSA6IG5ldyBjYy5Db2xvcigxMDAsIDUwLCA1MCwgMTUwKVxuICAgICAgICBzaGFkb3cub2Zmc2V0ID0gY2MudjIoMCwgMClcbiAgICAgICAgc2hhZG93LmJsdXIgPSA4XG4gICAgICAgIFxuICAgICAgICB0aXRsZU5vZGUucGFyZW50ID0gYmFubmVyTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g6IOc5Yip5pe255qE5ZG85ZC45Y+R5YWJ5Yqo55S7XG4gICAgICAgIGlmIChpc1dpbm5lcikge1xuICAgICAgICAgICAgY2MudHdlZW4oYmFubmVyTm9kZSlcbiAgICAgICAgICAgICAgICAucmVwZWF0Rm9yZXZlcihcbiAgICAgICAgICAgICAgICAgICAgY2MudHdlZW4oKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRvKDEuMCwgeyBzY2FsZTogMS4wMiB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRvKDEuMCwgeyBzY2FsZTogMS4wIH0pXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5zdGFydCgpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBiYW5uZXJOb2RlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCfk4og5Yib5bu65YCN5pWw6K+m5oOF5Y2hXG4gICAgICovXG4gICAgX2NyZWF0ZU11bHRpcGxpZXJEZXRhaWxDYXJkOiBmdW5jdGlvbihkYXRhLCBpc1dpbm5lcikge1xuICAgICAgICB2YXIgY2FyZE5vZGUgPSBuZXcgY2MuTm9kZShcIk11bHRpcGxpZXJDYXJkXCIpXG4gICAgICAgIHZhciBjYXJkV2lkdGggPSAxODBcbiAgICAgICAgdmFyIGNhcmRIZWlnaHQgPSAyNTAgIC8vIOWinuWKoOmrmOW6puS7peWuuee6s+eOi+eCuOihjFxuICAgICAgICBcbiAgICAgICAgLy8g5Y2h54mH6IOM5pmvXG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkNhcmRCZ1wiKVxuICAgICAgICB2YXIgZ3JhcGhpY3MgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBncmFwaGljcy5maWxsQ29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcig1MCwgMzUsIDcwLCAyMjApIDogbmV3IGNjLkNvbG9yKDM1LCAzNSwgNDUsIDIyMClcbiAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC1jYXJkV2lkdGgvMiwgLWNhcmRIZWlnaHQvMiwgY2FyZFdpZHRoLCBjYXJkSGVpZ2h0LCAxNSlcbiAgICAgICAgZ3JhcGhpY3MuZmlsbCgpXG4gICAgICAgIGdyYXBoaWNzLnN0cm9rZUNvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoMTgwLCAxNDAsIDYwLCAyMDApIDogbmV3IGNjLkNvbG9yKDgwLCA4MCwgMTAwLCAyMDApXG4gICAgICAgIGdyYXBoaWNzLmxpbmVXaWR0aCA9IDJcbiAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC1jYXJkV2lkdGgvMiwgLWNhcmRIZWlnaHQvMiwgY2FyZFdpZHRoLCBjYXJkSGVpZ2h0LCAxNSlcbiAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlKClcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IGNhcmROb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmoIfpophcbiAgICAgICAgdmFyIHRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIilcbiAgICAgICAgdGl0bGVOb2RlLmFuY2hvclggPSAwLjVcbiAgICAgICAgdGl0bGVOb2RlLmFuY2hvclkgPSAwLjVcbiAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB0aXRsZUxhYmVsLnN0cmluZyA9IFwi5pys5bGA6K+m5oOFXCJcbiAgICAgICAgdGl0bGVMYWJlbC5mb250U2l6ZSA9IDIwXG4gICAgICAgIHRpdGxlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICB0aXRsZUxhYmVsLnZlcnRpY2FsQWxpZ24gPSBjYy5MYWJlbC5WZXJ0aWNhbEFsaWduLkNFTlRFUlxuICAgICAgICB0aXRsZU5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjAwLCAyMDAsIDIwMClcbiAgICAgICAgdGl0bGVOb2RlLnkgPSBjYXJkSGVpZ2h0LzIgLSAyNVxuICAgICAgICB0aXRsZU5vZGUucGFyZW50ID0gY2FyZE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOWIhumalOe6v1xuICAgICAgICB2YXIgbGluZU5vZGUgPSBuZXcgY2MuTm9kZShcIkxpbmVcIilcbiAgICAgICAgdmFyIGxnID0gbGluZU5vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBsZy5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigxMDAsIDEwMCwgMTAwLCAxNTApXG4gICAgICAgIGxnLmxpbmVXaWR0aCA9IDFcbiAgICAgICAgbGcubW92ZVRvKC1jYXJkV2lkdGgvMiArIDE1LCAwKVxuICAgICAgICBsZy5saW5lVG8oY2FyZFdpZHRoLzIgLSAxNSwgMClcbiAgICAgICAgbGcuc3Ryb2tlKClcbiAgICAgICAgbGluZU5vZGUueSA9IGNhcmRIZWlnaHQvMiAtIDUwXG4gICAgICAgIGxpbmVOb2RlLnBhcmVudCA9IGNhcmROb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDor6bmg4XliJfooahcbiAgICAgICAgdmFyIG11bHRpRGV0YWlsID0gZGF0YS5tdWx0aV9kZXRhaWwgfHwge31cbiAgICAgICAgdmFyIGRldGFpbHMgPSBbXG4gICAgICAgICAgICB7IGxhYmVsOiBcIuW6leWIhlwiLCB2YWx1ZTogZGF0YS5iYXNlX3Njb3JlIHx8IDEwIH0sXG4gICAgICAgICAgICB7IGxhYmVsOiBcIuaKouWcsOS4u1wiLCB2YWx1ZTogbXVsdGlEZXRhaWwucWlhbmdfY291bnQgPiAwID8gXCJ4XCIgKyBtdWx0aURldGFpbC5xaWFuZ19tdWx0aSA6IFwiLVwiIH0sXG4gICAgICAgICAgICB7IGxhYmVsOiBcIueCuOW8uVwiLCB2YWx1ZTogbXVsdGlEZXRhaWwuYm9tYl9jb3VudCA+IDAgPyBcInhcIiArIG11bHRpRGV0YWlsLmJvbWJfbXVsdGkgOiBcIi1cIiB9LFxuICAgICAgICAgICAgeyBsYWJlbDogXCLnjovngrhcIiwgdmFsdWU6IG11bHRpRGV0YWlsLnJvY2tldF9jb3VudCA+IDAgPyBcInhcIiArIG11bHRpRGV0YWlsLnJvY2tldF9tdWx0aSA6IFwiLVwiIH0sXG4gICAgICAgICAgICB7IGxhYmVsOiBcIuaYpeWkqVwiLCB2YWx1ZTogbXVsdGlEZXRhaWwuc3ByaW5nX3R5cGUgPiAwID8gXCJ4MlwiIDogXCItXCIgfVxuICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICB2YXIgaXRlbVkgPSBjYXJkSGVpZ2h0LzIgLSA3NVxuICAgICAgICB2YXIgaXRlbUhlaWdodCA9IDI4XG4gICAgICAgIFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRldGFpbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBpdGVtID0gZGV0YWlsc1tpXVxuICAgICAgICAgICAgdmFyIGl0ZW1Ob2RlID0gbmV3IGNjLk5vZGUoXCJJdGVtX1wiICsgaSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5qCH562+XG4gICAgICAgICAgICB2YXIgbGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJMYWJlbFwiKVxuICAgICAgICAgICAgbGFiZWxOb2RlLmFuY2hvclggPSAwLjVcbiAgICAgICAgICAgIGxhYmVsTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgICAgICB2YXIgbGFiZWwgPSBsYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgbGFiZWwuc3RyaW5nID0gaXRlbS5sYWJlbFxuICAgICAgICAgICAgbGFiZWwuZm9udFNpemUgPSAxNlxuICAgICAgICAgICAgbGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICAgICAgbGFiZWwudmVydGljYWxBbGlnbiA9IGNjLkxhYmVsLlZlcnRpY2FsQWxpZ24uQ0VOVEVSXG4gICAgICAgICAgICBsYWJlbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMTgwLCAxODAsIDE4MClcbiAgICAgICAgICAgIGxhYmVsTm9kZS54ID0gLWNhcmRXaWR0aC8yICsgMzVcbiAgICAgICAgICAgIGxhYmVsTm9kZS5wYXJlbnQgPSBpdGVtTm9kZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlgLxcbiAgICAgICAgICAgIHZhciB2YWx1ZU5vZGUgPSBuZXcgY2MuTm9kZShcIlZhbHVlXCIpXG4gICAgICAgICAgICB2YWx1ZU5vZGUuYW5jaG9yWCA9IDAuNVxuICAgICAgICAgICAgdmFsdWVOb2RlLmFuY2hvclkgPSAwLjVcbiAgICAgICAgICAgIHZhciB2YWx1ZUxhYmVsID0gdmFsdWVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgIHZhbHVlTGFiZWwuc3RyaW5nID0gU3RyaW5nKGl0ZW0udmFsdWUpXG4gICAgICAgICAgICB2YWx1ZUxhYmVsLmZvbnRTaXplID0gMTZcbiAgICAgICAgICAgIHZhbHVlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICAgICAgdmFsdWVMYWJlbC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVJcbiAgICAgICAgICAgIHZhbHVlTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIyMCwgMTUwKVxuICAgICAgICAgICAgdmFsdWVOb2RlLnggPSBjYXJkV2lkdGgvMiAtIDQwXG4gICAgICAgICAgICB2YWx1ZU5vZGUucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaXRlbU5vZGUueSA9IGl0ZW1ZIC0gaSAqIGl0ZW1IZWlnaHRcbiAgICAgICAgICAgIGl0ZW1Ob2RlLnBhcmVudCA9IGNhcmROb2RlXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOaAu+WAjeaVsO+8iOWkp+WPt+mHkeiJsu+8iVxuICAgICAgICB2YXIgdG90YWxNdWx0aU5vZGUgPSBuZXcgY2MuTm9kZShcIlRvdGFsTXVsdGlcIilcbiAgICAgICAgdmFyIHRvdGFsTXVsdGlCZyA9IG5ldyBjYy5Ob2RlKFwiQmdcIilcbiAgICAgICAgdmFyIHRtZyA9IHRvdGFsTXVsdGlCZy5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIHRtZy5maWxsQ29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcig4MCwgNTAsIDIwLCAyMDApIDogbmV3IGNjLkNvbG9yKDQwLCA0MCwgNTAsIDIwMClcbiAgICAgICAgdG1nLnJvdW5kUmVjdCgtY2FyZFdpZHRoLzIgKyAxMCwgLWNhcmRIZWlnaHQvMiArIDUsIGNhcmRXaWR0aCAtIDIwLCA1MCwgMTApXG4gICAgICAgIHRtZy5maWxsKClcbiAgICAgICAgdG90YWxNdWx0aUJnLnkgPSAtY2FyZEhlaWdodC8yICsgMzBcbiAgICAgICAgdG90YWxNdWx0aUJnLnBhcmVudCA9IHRvdGFsTXVsdGlOb2RlXG4gICAgICAgIFxuICAgICAgICB2YXIgdG90YWxMYWJlbCA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIilcbiAgICAgICAgdG90YWxMYWJlbC5hbmNob3JYID0gMC41XG4gICAgICAgIHRvdGFsTGFiZWwuYW5jaG9yWSA9IDAuNVxuICAgICAgICB2YXIgdHRsID0gdG90YWxMYWJlbC5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHR0bC5zdHJpbmcgPSBcIuaAu+WAjeaVsFwiXG4gICAgICAgIHR0bC5mb250U2l6ZSA9IDE0XG4gICAgICAgIHR0bC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHR0bC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVJcbiAgICAgICAgdG90YWxMYWJlbC5jb2xvciA9IG5ldyBjYy5Db2xvcigxODAsIDE4MCwgMTgwKVxuICAgICAgICB0b3RhbExhYmVsLnkgPSAxMlxuICAgICAgICB0b3RhbExhYmVsLnBhcmVudCA9IHRvdGFsTXVsdGlOb2RlXG4gICAgICAgIFxuICAgICAgICB2YXIgbXVsdGlWYWx1ZU5vZGUgPSBuZXcgY2MuTm9kZShcIlZhbHVlXCIpXG4gICAgICAgIG11bHRpVmFsdWVOb2RlLm5hbWUgPSBcIk11bHRpcGxpZXJWYWx1ZVwiXG4gICAgICAgIG11bHRpVmFsdWVOb2RlLmFuY2hvclggPSAwLjVcbiAgICAgICAgbXVsdGlWYWx1ZU5vZGUuYW5jaG9yWSA9IDAuNVxuICAgICAgICB2YXIgbXZsID0gbXVsdGlWYWx1ZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBtdmwuc3RyaW5nID0gXCJ4XCIgKyAoZGF0YS5tdWx0aXBsZSB8fCAxKVxuICAgICAgICBtdmwuZm9udFNpemUgPSAyOFxuICAgICAgICBtdmwuZm9udEZhbWlseSA9IFwiQXJpYWxcIlxuICAgICAgICBtdmwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICBtdmwudmVydGljYWxBbGlnbiA9IGNjLkxhYmVsLlZlcnRpY2FsQWxpZ24uQ0VOVEVSXG4gICAgICAgIG11bHRpVmFsdWVOb2RlLmNvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDUwKSA6IG5ldyBjYy5Db2xvcigyMDAsIDIwMCwgMjAwKVxuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg5o+P6L65XG4gICAgICAgIHZhciBtdm8gPSBtdWx0aVZhbHVlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKVxuICAgICAgICBtdm8uY29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcigxNTAsIDEwMCwgMCkgOiBuZXcgY2MuQ29sb3IoNjAsIDYwLCA2MClcbiAgICAgICAgbXZvLndpZHRoID0gMlxuICAgICAgICBcbiAgICAgICAgbXVsdGlWYWx1ZU5vZGUueSA9IC04XG4gICAgICAgIG11bHRpVmFsdWVOb2RlLnBhcmVudCA9IHRvdGFsTXVsdGlOb2RlXG4gICAgICAgIFxuICAgICAgICB0b3RhbE11bHRpTm9kZS55ID0gLWNhcmRIZWlnaHQvMiArIDMwXG4gICAgICAgIHRvdGFsTXVsdGlOb2RlLnBhcmVudCA9IGNhcmROb2RlXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gY2FyZE5vZGVcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+RpSDliJvlu7rnjqnlrrbnu5PmnpzliJfooahcbiAgICAgKi9cbiAgICBfY3JlYXRlUGxheWVyUmVzdWx0TGlzdDogZnVuY3Rpb24oZGF0YSwgaXNXaW5uZXIsIG15V2luR29sZCwgbGlzdFdpZHRoKSB7XG4gICAgICAgIHZhciBsaXN0Tm9kZSA9IG5ldyBjYy5Ob2RlKFwiUGxheWVyUmVzdWx0TGlzdFwiKVxuICAgICAgICB2YXIgbGlzdEhlaWdodCA9IDI2MFxuICAgICAgICBcbiAgICAgICAgLy8g5YiX6KGo6IOM5pmvXG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkxpc3RCZ1wiKVxuICAgICAgICB2YXIgZ3JhcGhpY3MgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBncmFwaGljcy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMCwgMCwgMCwgODApXG4gICAgICAgIGdyYXBoaWNzLnJvdW5kUmVjdCgtbGlzdFdpZHRoLzIsIC1saXN0SGVpZ2h0LzIsIGxpc3RXaWR0aCwgbGlzdEhlaWdodCwgMTIpXG4gICAgICAgIGdyYXBoaWNzLmZpbGwoKVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gbGlzdE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOihqOWktFxuICAgICAgICB2YXIgaGVhZGVyTm9kZSA9IG5ldyBjYy5Ob2RlKFwiSGVhZGVyXCIpXG4gICAgICAgIHZhciBoZWFkZXJzID0gW1wi546p5a62XCIsIFwi6Lqr5Lu9XCIsIFwi6L6T6LWiXCJdXG4gICAgICAgIHZhciBoZWFkZXJYID0gWy1saXN0V2lkdGgvMiArIDgwLCAyMCwgbGlzdFdpZHRoLzIgLSA2MF1cbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaGVhZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGhOb2RlID0gbmV3IGNjLk5vZGUoXCJIX1wiICsgaSlcbiAgICAgICAgICAgIGhOb2RlLmFuY2hvclggPSAwLjVcbiAgICAgICAgICAgIGhOb2RlLmFuY2hvclkgPSAwLjVcbiAgICAgICAgICAgIHZhciBoTGFiZWwgPSBoTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICBoTGFiZWwuc3RyaW5nID0gaGVhZGVyc1tpXVxuICAgICAgICAgICAgaExhYmVsLmZvbnRTaXplID0gMThcbiAgICAgICAgICAgIGhMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgICAgICBoTGFiZWwudmVydGljYWxBbGlnbiA9IGNjLkxhYmVsLlZlcnRpY2FsQWxpZ24uQ0VOVEVSXG4gICAgICAgICAgICBoTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigxNTAsIDE1MCwgMTYwKVxuICAgICAgICAgICAgaE5vZGUueCA9IGhlYWRlclhbaV1cbiAgICAgICAgICAgIGhOb2RlLnBhcmVudCA9IGhlYWRlck5vZGVcbiAgICAgICAgfVxuICAgICAgICBoZWFkZXJOb2RlLnkgPSBsaXN0SGVpZ2h0LzIgLSAyNVxuICAgICAgICBoZWFkZXJOb2RlLnBhcmVudCA9IGxpc3ROb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDliIbpmpTnur9cbiAgICAgICAgdmFyIHNlcE5vZGUgPSBuZXcgY2MuTm9kZShcIlNlcGFyYXRvclwiKVxuICAgICAgICB2YXIgc2cgPSBzZXBOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgc2cuc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMTAwLCAxMDAsIDEwMCwgMTAwKVxuICAgICAgICBzZy5saW5lV2lkdGggPSAxXG4gICAgICAgIHNnLm1vdmVUbygtbGlzdFdpZHRoLzIgKyAxNSwgMClcbiAgICAgICAgc2cubGluZVRvKGxpc3RXaWR0aC8yIC0gMTUsIDApXG4gICAgICAgIHNnLnN0cm9rZSgpXG4gICAgICAgIHNlcE5vZGUueSA9IGxpc3RIZWlnaHQvMiAtIDQ1XG4gICAgICAgIHNlcE5vZGUucGFyZW50ID0gbGlzdE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOeOqeWutuWIl+ihqFxuICAgICAgICB2YXIgcGxheWVycyA9IGRhdGEucGxheWVycyB8fCBbXVxuICAgICAgICB2YXIgbXlQbGF5ZXJJZCA9IG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKCkuaWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5zZXJ2ZXJQbGF5ZXJJZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRFxuICAgICAgICB2YXIgaXRlbVN0YXJ0WSA9IGxpc3RIZWlnaHQvMiAtIDc1XG4gICAgICAgIHZhciBpdGVtSGVpZ2h0ID0gNjVcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGxheWVycy5sZW5ndGggJiYgaSA8IDM7IGkrKykge1xuICAgICAgICAgICAgdmFyIHBsYXllciA9IHBsYXllcnNbaV1cbiAgICAgICAgICAgIHZhciBpc0N1cnJlbnRQbGF5ZXIgPSBTdHJpbmcocGxheWVyLnBsYXllcl9pZCkgPT09IFN0cmluZyhteVBsYXllcklkKVxuICAgICAgICAgICAgdmFyIGl0ZW1Ob2RlID0gdGhpcy5fY3JlYXRlUGxheWVyUmVzdWx0SXRlbShwbGF5ZXIsIGlzQ3VycmVudFBsYXllciwgaXNXaW5uZXIsIGxpc3RXaWR0aCwgaSlcbiAgICAgICAgICAgIGl0ZW1Ob2RlLnkgPSBpdGVtU3RhcnRZIC0gaSAqIGl0ZW1IZWlnaHRcbiAgICAgICAgICAgIGl0ZW1Ob2RlLnBhcmVudCA9IGxpc3ROb2RlXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBsaXN0Tm9kZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5GkIOWIm+W7uuWNleS4queOqeWutue7k+aenOmhuVxuICAgICAqL1xuICAgIF9jcmVhdGVQbGF5ZXJSZXN1bHRJdGVtOiBmdW5jdGlvbihwbGF5ZXIsIGlzQ3VycmVudFBsYXllciwgaXNXaW5uZXIsIGxpc3RXaWR0aCwgaW5kZXgpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHZhciBpdGVtTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUGxheWVySXRlbV9cIiArIGluZGV4KVxuICAgICAgICB2YXIgaXRlbUhlaWdodCA9IDU1XG4gICAgICAgIFxuICAgICAgICAvLyDlvZPliY3njqnlrrbpq5jkuq7og4zmma9cbiAgICAgICAgaWYgKGlzQ3VycmVudFBsYXllcikge1xuICAgICAgICAgICAgdmFyIGhpZ2hsaWdodCA9IG5ldyBjYy5Ob2RlKFwiSGlnaGxpZ2h0XCIpXG4gICAgICAgICAgICB2YXIgaGcgPSBoaWdobGlnaHQuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICAgICAgaGcuZmlsbENvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoODAsIDYwLCAzMCwgMTUwKSA6IG5ldyBjYy5Db2xvcig1MCwgNDAsIDUwLCAxNTApXG4gICAgICAgICAgICBoZy5yb3VuZFJlY3QoLWxpc3RXaWR0aC8yICsgMTAsIC1pdGVtSGVpZ2h0LzIsIGxpc3RXaWR0aCAtIDIwLCBpdGVtSGVpZ2h0LCA4KVxuICAgICAgICAgICAgaGcuZmlsbCgpXG4gICAgICAgICAgICBoZy5zdHJva2VDb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDIwMCwgMTUwLCA1MCwgMjAwKSA6IG5ldyBjYy5Db2xvcigxMDAsIDgwLCAxMDAsIDE1MClcbiAgICAgICAgICAgIGhnLmxpbmVXaWR0aCA9IDJcbiAgICAgICAgICAgIGhnLnJvdW5kUmVjdCgtbGlzdFdpZHRoLzIgKyAxMCwgLWl0ZW1IZWlnaHQvMiwgbGlzdFdpZHRoIC0gMjAsIGl0ZW1IZWlnaHQsIDgpXG4gICAgICAgICAgICBoZy5zdHJva2UoKVxuICAgICAgICAgICAgaGlnaGxpZ2h0LnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWktOWDj+WMuuWfn1xuICAgICAgICB2YXIgYXZhdGFyTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQXZhdGFyXCIpXG4gICAgICAgIGF2YXRhck5vZGUueCA9IC1saXN0V2lkdGgvMiArIDQ1XG4gICAgICAgIFxuICAgICAgICAvLyDlpLTlg4/og4zmma/vvIjlnIblvaLvvIlcbiAgICAgICAgdmFyIGF2YXRhckJnID0gbmV3IGNjLk5vZGUoXCJBdmF0YXJCZ1wiKVxuICAgICAgICB2YXIgYWcgPSBhdmF0YXJCZy5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIHZhciBpc0xhbmRsb3JkID0gcGxheWVyLnJvbGUgPT09IFwibGFuZGxvcmRcIlxuICAgICAgICBcbiAgICAgICAgLy8g57uY5Yi25ZyG5b2i5aS05YOP5qGGXG4gICAgICAgIGFnLnN0cm9rZUNvbG9yID0gaXNMYW5kbG9yZCA/IG5ldyBjYy5Db2xvcigyNTUsIDIwMCwgNTAsIDI1NSkgOiBuZXcgY2MuQ29sb3IoMTgwLCAxODAsIDIwMCwgMjU1KVxuICAgICAgICBhZy5saW5lV2lkdGggPSAzXG4gICAgICAgIGFnLmNpcmNsZSgwLCAwLCAyMilcbiAgICAgICAgYWcuc3Ryb2tlKClcbiAgICAgICAgYWcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDYwLCA2MCwgODAsIDIwMClcbiAgICAgICAgYWcuY2lyY2xlKDAsIDAsIDIwKVxuICAgICAgICBhZy5maWxsKClcbiAgICAgICAgYXZhdGFyQmcucGFyZW50ID0gYXZhdGFyTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5bCd6K+V5Yqg6L295aS05YOPXG4gICAgICAgIHZhciBhdmF0YXJJbmRleCA9IChpbmRleCAlIDQpICsgMVxuICAgICAgICB2YXIgYXZhdGFyUGF0aCA9IFwiVUkvaGVhZGltYWdlL2F2YXRhcl9cIiArIGF2YXRhckluZGV4XG4gICAgICAgIGNjLnJlc291cmNlcy5sb2FkKGF2YXRhclBhdGgsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoIWVyciAmJiBzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBhdmF0YXJTcHJpdGUgPSBuZXcgY2MuTm9kZShcIkF2YXRhclNwcml0ZVwiKVxuICAgICAgICAgICAgICAgIHZhciBzcCA9IGF2YXRhclNwcml0ZS5hZGRDb21wb25lbnQoY2MuU3ByaXRlKVxuICAgICAgICAgICAgICAgIHNwLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWVcbiAgICAgICAgICAgICAgICBzcC5zaXplTW9kZSA9IGNjLlNwcml0ZS5TaXplTW9kZS5DVVNUT01cbiAgICAgICAgICAgICAgICBhdmF0YXJTcHJpdGUud2lkdGggPSAzNlxuICAgICAgICAgICAgICAgIGF2YXRhclNwcml0ZS5oZWlnaHQgPSAzNlxuICAgICAgICAgICAgICAgIGF2YXRhclNwcml0ZS5wYXJlbnQgPSBhdmF0YXJOb2RlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICAvLyDouqvku73lm77moIdcbiAgICAgICAgdmFyIHJvbGVJY29uTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUm9sZUljb25cIilcbiAgICAgICAgdmFyIHJvbGVMYWJlbCA9IHJvbGVJY29uTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHJvbGVMYWJlbC5zdHJpbmcgPSBpc0xhbmRsb3JkID8gXCLwn5GRXCIgOiBcIvCfjL5cIlxuICAgICAgICByb2xlTGFiZWwuZm9udFNpemUgPSAxNFxuICAgICAgICByb2xlSWNvbk5vZGUueCA9IDE4XG4gICAgICAgIHJvbGVJY29uTm9kZS55ID0gLTE1XG4gICAgICAgIHJvbGVJY29uTm9kZS5wYXJlbnQgPSBhdmF0YXJOb2RlXG4gICAgICAgIFxuICAgICAgICBhdmF0YXJOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDnjqnlrrblkI3np7BcbiAgICAgICAgdmFyIG5hbWVOb2RlID0gbmV3IGNjLk5vZGUoXCJOYW1lXCIpXG4gICAgICAgIG5hbWVOb2RlLmFuY2hvclggPSAwLjVcbiAgICAgICAgbmFtZU5vZGUuYW5jaG9yWSA9IDAuNVxuICAgICAgICB2YXIgbmFtZUxhYmVsID0gbmFtZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBuYW1lTGFiZWwuc3RyaW5nID0gcGxheWVyLnBsYXllcl9uYW1lIHx8IChcIueOqeWutlwiICsgKGluZGV4ICsgMSkpXG4gICAgICAgIG5hbWVMYWJlbC5mb250U2l6ZSA9IDE4XG4gICAgICAgIG5hbWVMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIG5hbWVMYWJlbC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVJcbiAgICAgICAgbmFtZU5vZGUuY29sb3IgPSBpc0N1cnJlbnRQbGF5ZXIgPyBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDIwMCkgOiBuZXcgY2MuQ29sb3IoMjIwLCAyMjAsIDIyMClcbiAgICAgICAgbmFtZU5vZGUueCA9IC1saXN0V2lkdGgvMiArIDEwMFxuICAgICAgICBuYW1lTm9kZS5wYXJlbnQgPSBpdGVtTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g6Lqr5Lu9XG4gICAgICAgIHZhciByb2xlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUm9sZVwiKVxuICAgICAgICByb2xlTm9kZS5hbmNob3JYID0gMC41XG4gICAgICAgIHJvbGVOb2RlLmFuY2hvclkgPSAwLjVcbiAgICAgICAgdmFyIHJvbGVUZXh0ID0gcm9sZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICByb2xlVGV4dC5zdHJpbmcgPSBpc0xhbmRsb3JkID8gXCLlnLDkuLtcIiA6IFwi5Yac5rCRXCJcbiAgICAgICAgcm9sZVRleHQuZm9udFNpemUgPSAxOFxuICAgICAgICByb2xlVGV4dC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHJvbGVUZXh0LnZlcnRpY2FsQWxpZ24gPSBjYy5MYWJlbC5WZXJ0aWNhbEFsaWduLkNFTlRFUlxuICAgICAgICByb2xlTm9kZS5jb2xvciA9IGlzTGFuZGxvcmQgPyBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDEwMCkgOiBuZXcgY2MuQ29sb3IoMTIwLCAyMDAsIDEyMClcbiAgICAgICAgcm9sZU5vZGUueCA9IDIwXG4gICAgICAgIHJvbGVOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDovpPotaLph5Hpop1cbiAgICAgICAgdmFyIHdpbkdvbGQgPSBwbGF5ZXIud2luX2dvbGQgfHwgMFxuICAgICAgICB2YXIgd2luTm9kZSA9IG5ldyBjYy5Ob2RlKFwiV2luR29sZFwiKVxuICAgICAgICB3aW5Ob2RlLm5hbWUgPSBcIldpbkdvbGRWYWx1ZVwiXG4gICAgICAgIHdpbk5vZGUuYW5jaG9yWCA9IDAuNVxuICAgICAgICB3aW5Ob2RlLmFuY2hvclkgPSAwLjVcbiAgICAgICAgdmFyIHdpbkxhYmVsID0gd2luTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHdpbkxhYmVsLnN0cmluZyA9ICh3aW5Hb2xkID49IDAgPyBcIitcIiA6IFwiXCIpICsgd2luR29sZFxuICAgICAgICB3aW5MYWJlbC5mb250U2l6ZSA9IDIyXG4gICAgICAgIHdpbkxhYmVsLmZvbnRGYW1pbHkgPSBcIkFyaWFsXCJcbiAgICAgICAgd2luTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICB3aW5MYWJlbC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVJcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOaPj+i+uVxuICAgICAgICB2YXIgd2luT3V0bGluZSA9IHdpbk5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSlcbiAgICAgICAgd2luT3V0bGluZS5jb2xvciA9IHdpbkdvbGQgPj0gMCA/IG5ldyBjYy5Db2xvcigwLCA4MCwgMCkgOiBuZXcgY2MuQ29sb3IoMTAwLCAwLCAwKVxuICAgICAgICB3aW5PdXRsaW5lLndpZHRoID0gMlxuICAgICAgICBcbiAgICAgICAgd2luTm9kZS5jb2xvciA9IHdpbkdvbGQgPj0gMCA/IG5ldyBjYy5Db2xvcigxMDAsIDI1NSwgMTAwKSA6IG5ldyBjYy5Db2xvcigyNTUsIDEwMCwgMTAwKVxuICAgICAgICB3aW5Ob2RlLnggPSBsaXN0V2lkdGgvMiAtIDUwXG4gICAgICAgIHdpbk5vZGUucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpdGVtTm9kZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5SYIOWIm+W7uuaMiemSruWMuuWfn1xuICAgICAqL1xuICAgIF9jcmVhdGVCdXR0b25BcmVhOiBmdW5jdGlvbihpc1dpbm5lciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHZhciBhcmVhTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQnV0dG9uQXJlYVwiKVxuICAgICAgICBcbiAgICAgICAgLy8g57un57ut5ri45oiP5oyJ6ZKuXG4gICAgICAgIHZhciBjb250aW51ZUJ0biA9IHNlbGYuX2NyZWF0ZVN0eWxlZEJ1dHRvbihcIue7p+e7rea4uOaIj1wiLCBpc1dpbm5lciwgdHJ1ZSlcbiAgICAgICAgY29udGludWVCdG4ueCA9IC0xMDBcbiAgICAgICAgY29udGludWVCdG4ucGFyZW50ID0gYXJlYU5vZGVcbiAgICAgICAgXG4gICAgICAgIGNvbnRpbnVlQnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKFwiY29udGludWVcIilcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIOi/lOWbnuWkp+WOheaMiemSrlxuICAgICAgICB2YXIgbG9iYnlCdG4gPSBzZWxmLl9jcmVhdGVTdHlsZWRCdXR0b24oXCLov5Tlm57lpKfljoVcIiwgaXNXaW5uZXIsIGZhbHNlKVxuICAgICAgICBsb2JieUJ0bi54ID0gMTAwXG4gICAgICAgIGxvYmJ5QnRuLnBhcmVudCA9IGFyZWFOb2RlXG4gICAgICAgIFxuICAgICAgICBsb2JieUJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhcImxvYmJ5XCIpXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYXJlYU5vZGVcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+UmCDliJvlu7rpq5jnuqfmoLflvI/mjInpkq5cbiAgICAgKi9cbiAgICBfY3JlYXRlU3R5bGVkQnV0dG9uOiBmdW5jdGlvbih0ZXh0LCBpc1dpbm5lciwgaXNQcmltYXJ5KSB7XG4gICAgICAgIHZhciBidG5Ob2RlID0gbmV3IGNjLk5vZGUoXCJCdG5fXCIgKyB0ZXh0KVxuICAgICAgICB2YXIgYnRuV2lkdGggPSAxNDBcbiAgICAgICAgdmFyIGJ0bkhlaWdodCA9IDUwXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR6K6+572u5oyJ6ZKu6IqC54K555qE5YaF5a655aSn5bCP77yM56Gu5L+d54K55Ye75Yy65Z+f5q2j56GuXG4gICAgICAgIGJ0bk5vZGUuc2V0Q29udGVudFNpemUoYnRuV2lkdGgsIGJ0bkhlaWdodClcbiAgICAgICAgYnRuTm9kZS5zZXRBbmNob3JQb2ludCgwLjUsIDAuNSlcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmt7vliqAgQmxvY2tJbnB1dEV2ZW50cyDnu4Tku7bvvIznoa7kv53mjInpkq7lj6/ku6XmjqXmlLbngrnlh7vkuovku7ZcbiAgICAgICAgYnRuTm9kZS5hZGRDb21wb25lbnQoY2MuQmxvY2tJbnB1dEV2ZW50cylcbiAgICAgICAgXG4gICAgICAgIC8vIOaMiemSruiDjOaZr1xuICAgICAgICB2YXIgZ3JhcGhpY3MgPSBidG5Ob2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgXG4gICAgICAgIGlmIChpc1ByaW1hcnkpIHtcbiAgICAgICAgICAgIC8vIOS4u+imgeaMiemSriAtIOmHkeapmea4kOWPmFxuICAgICAgICAgICAgaWYgKGlzV2lubmVyKSB7XG4gICAgICAgICAgICAgICAgZ3JhcGhpY3MuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDIwMCwgMTQwLCAzMCwgMjU1KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBncmFwaGljcy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoNjAsIDEyMCwgMTgwLCAyNTUpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDmrKHopoHmjInpkq4gLSDok53ntKvmuJDlj5hcbiAgICAgICAgICAgIGdyYXBoaWNzLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig4MCwgNzAsIDEyMCwgMjU1KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLWJ0bldpZHRoLzIsIC1idG5IZWlnaHQvMiwgYnRuV2lkdGgsIGJ0bkhlaWdodCwgMjUpXG4gICAgICAgIGdyYXBoaWNzLmZpbGwoKVxuICAgICAgICBcbiAgICAgICAgLy8g6L655qGGXG4gICAgICAgIGlmIChpc1ByaW1hcnkgJiYgaXNXaW5uZXIpIHtcbiAgICAgICAgICAgIGdyYXBoaWNzLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjIwLCAxMDAsIDI1NSlcbiAgICAgICAgICAgIGdyYXBoaWNzLmxpbmVXaWR0aCA9IDJcbiAgICAgICAgICAgIGdyYXBoaWNzLnJvdW5kUmVjdCgtYnRuV2lkdGgvMiwgLWJ0bkhlaWdodC8yLCBidG5XaWR0aCwgYnRuSGVpZ2h0LCAyNSlcbiAgICAgICAgICAgIGdyYXBoaWNzLnN0cm9rZSgpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOaMiemSruaWh+Wtl1xuICAgICAgICB2YXIgbGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJMYWJlbFwiKVxuICAgICAgICBsYWJlbE5vZGUuYW5jaG9yWCA9IDAuNVxuICAgICAgICBsYWJlbE5vZGUuYW5jaG9yWSA9IDAuNVxuICAgICAgICB2YXIgbGFiZWwgPSBsYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBsYWJlbC5zdHJpbmcgPSB0ZXh0XG4gICAgICAgIGxhYmVsLmZvbnRTaXplID0gMjJcbiAgICAgICAgbGFiZWwuZm9udEZhbWlseSA9IFwiQXJpYWxcIlxuICAgICAgICBsYWJlbC5vdmVyZmxvdyA9IGNjLkxhYmVsLk92ZXJmbG93LlNIUklOS1xuICAgICAgICBsYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIGxhYmVsLnZlcnRpY2FsQWxpZ24gPSBjYy5MYWJlbC5WZXJ0aWNhbEFsaWduLkNFTlRFUlxuICAgICAgICBsYWJlbE5vZGUud2lkdGggPSBidG5XaWR0aCAtIDIwICAvLyDnlZnlh7rovrnot53pmLLmraLmuqLlh7pcbiAgICAgICAgbGFiZWxOb2RlLmhlaWdodCA9IGJ0bkhlaWdodCAtIDEwXG4gICAgICAgIGxhYmVsTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg5o+P6L65XG4gICAgICAgIHZhciBvdXRsaW5lID0gbGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpXG4gICAgICAgIG91dGxpbmUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMCwgMCwgMClcbiAgICAgICAgb3V0bGluZS53aWR0aCA9IDJcbiAgICAgICAgXG4gICAgICAgIGxhYmVsTm9kZS5wYXJlbnQgPSBidG5Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDngrnlh7vmlYjmnpxcbiAgICAgICAgYnRuTm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9TVEFSVCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjYy50d2VlbihidG5Ob2RlKS50bygwLjEsIHsgc2NhbGU6IDAuOTUgfSkuc3RhcnQoKVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgYnRuTm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2MudHdlZW4oYnRuTm9kZSkudG8oMC4xLCB7IHNjYWxlOiAxIH0pLnN0YXJ0KClcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIGJ0bk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfQ0FOQ0VMLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNjLnR3ZWVuKGJ0bk5vZGUpLnRvKDAuMSwgeyBzY2FsZTogMSB9KS5zdGFydCgpXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYnRuTm9kZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDinKgg5Yib5bu66IOc5Yip57KS5a2Q54m55pWIXG4gICAgICovXG4gICAgX2NyZWF0ZVZpY3RvcnlQYXJ0aWNsZXM6IGZ1bmN0aW9uKHBhcmVudCwgd2lkdGgsIGhlaWdodCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgXG4gICAgICAgIC8vIOmHkeW4geeykuWtkFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE1OyBpKyspIHtcbiAgICAgICAgICAgIChmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgICAgIHZhciBjb2luID0gbmV3IGNjLk5vZGUoXCJDb2luX1wiICsgaW5kZXgpXG4gICAgICAgICAgICAgICAgY29pbi54ID0gKE1hdGgucmFuZG9tKCkgLSAwLjUpICogd2lkdGhcbiAgICAgICAgICAgICAgICBjb2luLnkgPSBoZWlnaHQgLyAyICsgNTBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDnu5jliLbph5HluIFcbiAgICAgICAgICAgICAgICB2YXIgZyA9IGNvaW4uYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICAgICAgICAgIGcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjAwLCA1MCwgMjU1KVxuICAgICAgICAgICAgICAgIGcuY2lyY2xlKDAsIDAsIDgpXG4gICAgICAgICAgICAgICAgZy5maWxsKClcbiAgICAgICAgICAgICAgICBnLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDIwMCwgMTUwLCAzMCwgMjU1KVxuICAgICAgICAgICAgICAgIGcubGluZVdpZHRoID0gMVxuICAgICAgICAgICAgICAgIGcuY2lyY2xlKDAsIDAsIDgpXG4gICAgICAgICAgICAgICAgZy5zdHJva2UoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvaW4ucGFyZW50ID0gcGFyZW50XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5LiL6JC95Yqo55S7XG4gICAgICAgICAgICAgICAgdmFyIGR1cmF0aW9uID0gMS41ICsgTWF0aC5yYW5kb20oKSAqIDEuNVxuICAgICAgICAgICAgICAgIHZhciB0YXJnZXRZID0gLWhlaWdodCAvIDIgLSA1MFxuICAgICAgICAgICAgICAgIHZhciBkZWxheSA9IE1hdGgucmFuZG9tKCkgKiAwLjVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjYy50d2Vlbihjb2luKVxuICAgICAgICAgICAgICAgICAgICAuZGVsYXkoZGVsYXkpXG4gICAgICAgICAgICAgICAgICAgIC5wYXJhbGxlbChcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLnR3ZWVuKCkudG8oZHVyYXRpb24sIHsgeTogdGFyZ2V0WSB9LCB7IGVhc2luZzogJ3F1YWRJbicgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICBjYy50d2VlbigpLnRvKGR1cmF0aW9uLCB7IHg6IGNvaW4ueCArIChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIDEwMCB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLnR3ZWVuKCkudG8oZHVyYXRpb24gLyAyLCB7IGFuZ2xlOiAtMTgwIH0pLnRvKGR1cmF0aW9uIC8gMiwgeyBhbmdsZTogLTM2MCB9KVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIC5jYWxsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5b6q546vXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2luLnkgPSBoZWlnaHQgLyAyICsgNTBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvaW4ueCA9IChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIHdpZHRoXG4gICAgICAgICAgICAgICAgICAgICAgICBjYy50d2Vlbihjb2luKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wYXJhbGxlbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2MudHdlZW4oKS50byhkdXJhdGlvbiwgeyB5OiB0YXJnZXRZIH0sIHsgZWFzaW5nOiAncXVhZEluJyB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2MudHdlZW4oKS50byhkdXJhdGlvbiwgeyB4OiBjb2luLnggKyAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiAxMDAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNjLnR3ZWVuKCkudG8oZHVyYXRpb24gLyAyLCB7IGFuZ2xlOiAtMTgwIH0pLnRvKGR1cmF0aW9uIC8gMiwgeyBhbmdsZTogLTM2MCB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICAgICAgfSkoaSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pif5YWJ6Zeq54OBXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgODsgaisrKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhciA9IG5ldyBjYy5Ob2RlKFwiU3Rhcl9cIiArIGluZGV4KVxuICAgICAgICAgICAgICAgIHN0YXIueCA9IChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIHdpZHRoICogMC44XG4gICAgICAgICAgICAgICAgc3Rhci55ID0gKE1hdGgucmFuZG9tKCkgLSAwLjUpICogaGVpZ2h0ICogMC44XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g57uY5Yi25pif5pifXG4gICAgICAgICAgICAgICAgdmFyIHNnID0gc3Rhci5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgICAgICAgICAgc2cuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyMDAsIDIwMClcbiAgICAgICAgICAgICAgICBzZWxmLl9kcmF3U3RhcihzZywgMCwgMCwgNiwgNSlcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBzdGFyLnBhcmVudCA9IHBhcmVudFxuICAgICAgICAgICAgICAgIHN0YXIub3BhY2l0eSA9IDBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDpl6rng4HliqjnlLtcbiAgICAgICAgICAgICAgICBjYy50d2VlbihzdGFyKVxuICAgICAgICAgICAgICAgICAgICAuZGVsYXkoTWF0aC5yYW5kb20oKSAqIDIpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBlYXRGb3JldmVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgY2MudHdlZW4oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50bygwLjMsIHsgb3BhY2l0eTogMjU1LCBzY2FsZTogMS4yIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvKDAuMywgeyBvcGFjaXR5OiAxMDAsIHNjYWxlOiAwLjggfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudG8oMC4zLCB7IG9wYWNpdHk6IDI1NSwgc2NhbGU6IDEuMiB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50bygwLjMsIHsgb3BhY2l0eTogMCwgc2NhbGU6IDAuNSB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5kZWxheSgxICsgTWF0aC5yYW5kb20oKSAqIDIpXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgICAgIH0pKGopXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+Mp++4jyDliJvlu7rlpLHotKXnspLlrZDnibnmlYhcbiAgICAgKi9cbiAgICBfY3JlYXRlRGVmZWF0UGFydGljbGVzOiBmdW5jdGlvbihwYXJlbnQsIHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgLy8g6JOd6Imy5ryC5rWu57KS5a2QXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgICAgICAgICAgKGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcnRpY2xlID0gbmV3IGNjLk5vZGUoXCJEZWZlYXRQYXJ0aWNsZV9cIiArIGluZGV4KVxuICAgICAgICAgICAgICAgIHBhcnRpY2xlLnggPSAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiB3aWR0aFxuICAgICAgICAgICAgICAgIHBhcnRpY2xlLnkgPSAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiBoZWlnaHRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDnu5jliLbnspLlrZBcbiAgICAgICAgICAgICAgICB2YXIgZyA9IHBhcnRpY2xlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgICAgICAgICBnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig4MCwgMTAwLCAxNTAsIDE1MClcbiAgICAgICAgICAgICAgICBnLmNpcmNsZSgwLCAwLCA0ICsgTWF0aC5yYW5kb20oKSAqIDMpXG4gICAgICAgICAgICAgICAgZy5maWxsKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBwYXJ0aWNsZS5wYXJlbnQgPSBwYXJlbnRcbiAgICAgICAgICAgICAgICBwYXJ0aWNsZS5vcGFjaXR5ID0gMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOe8k+aFoua8gua1ruWKqOeUu1xuICAgICAgICAgICAgICAgIHZhciBkdXJhdGlvbiA9IDMgKyBNYXRoLnJhbmRvbSgpICogMlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNjLnR3ZWVuKHBhcnRpY2xlKVxuICAgICAgICAgICAgICAgICAgICAudG8oMC41LCB7IG9wYWNpdHk6IDE1MCB9KVxuICAgICAgICAgICAgICAgICAgICAucGFyYWxsZWwoXG4gICAgICAgICAgICAgICAgICAgICAgICBjYy50d2VlbigpLnRvKGR1cmF0aW9uLCB7IHk6IHBhcnRpY2xlLnkgKyA1MCArIE1hdGgucmFuZG9tKCkgKiAzMCB9LCB7IGVhc2luZzogJ3NpbmVJbk91dCcgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICBjYy50d2VlbigpLnRvKGR1cmF0aW9uLCB7IHg6IHBhcnRpY2xlLnggKyAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiA0MCB9KVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIC50bygwLjUsIHsgb3BhY2l0eTogMCB9KVxuICAgICAgICAgICAgICAgICAgICAuY2FsbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnRpY2xlLnkgPSAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiBoZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnRpY2xlLnggPSAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiB3aWR0aFxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOW+queOr1xuICAgICAgICAgICAgICAgIGNjLnR3ZWVuKHBhcnRpY2xlKVxuICAgICAgICAgICAgICAgICAgICAuZGVsYXkoNClcbiAgICAgICAgICAgICAgICAgICAgLnJlcGVhdEZvcmV2ZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICBjYy50d2VlbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvKDAuNSwgeyBvcGFjaXR5OiAxNTAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAucGFyYWxsZWwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNjLnR3ZWVuKCkudG8oZHVyYXRpb24sIHsgeTogcGFydGljbGUueSArIDUwICsgTWF0aC5yYW5kb20oKSAqIDMwIH0sIHsgZWFzaW5nOiAnc2luZUluT3V0JyB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2MudHdlZW4oKS50byhkdXJhdGlvbiwgeyB4OiBwYXJ0aWNsZS54ICsgKE1hdGgucmFuZG9tKCkgLSAwLjUpICogNDAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvKDAuNSwgeyBvcGFjaXR5OiAwIH0pXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgICAgIH0pKGkpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog4q2QIOe7mOWItuaYn+W9olxuICAgICAqL1xuICAgIF9kcmF3U3RhcjogZnVuY3Rpb24oZ3JhcGhpY3MsIGN4LCBjeSwgaW5uZXJSYWRpdXMsIHBvaW50cykge1xuICAgICAgICB2YXIgb3V0ZXJSYWRpdXMgPSBpbm5lclJhZGl1cyAqIDJcbiAgICAgICAgZ3JhcGhpY3MubW92ZVRvKGN4LCBjeSArIG91dGVyUmFkaXVzKVxuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2ludHMgKiAyOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYWRpdXMgPSBpICUgMiA9PT0gMCA/IG91dGVyUmFkaXVzIDogaW5uZXJSYWRpdXNcbiAgICAgICAgICAgIHZhciBhbmdsZSA9IChpICogTWF0aC5QSSkgLyBwb2ludHMgLSBNYXRoLlBJIC8gMlxuICAgICAgICAgICAgdmFyIHggPSBjeCArIE1hdGguY29zKGFuZ2xlKSAqIHJhZGl1c1xuICAgICAgICAgICAgdmFyIHkgPSBjeSArIE1hdGguc2luKGFuZ2xlKSAqIHJhZGl1c1xuICAgICAgICAgICAgZ3JhcGhpY3MubGluZVRvKHgsIHkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGdyYXBoaWNzLmNsb3NlKClcbiAgICAgICAgZ3JhcGhpY3MuZmlsbCgpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflKIg5ZCv5Yqo5pWw5a2X5Yqo55S7XG4gICAgICovXG4gICAgX3N0YXJ0TnVtYmVyQW5pbWF0aW9uczogZnVuY3Rpb24ocG9wdXBOb2RlLCBkYXRhLCBteVdpbkdvbGQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIFxuICAgICAgICAvLyDlgI3mlbDmu5rliqjliqjnlLtcbiAgICAgICAgdmFyIG11bHRpVmFsdWVOb2RlID0gc2VsZi5fZmluZE5vZGVCeU5hbWUocG9wdXBOb2RlLCBcIk11bHRpcGxpZXJWYWx1ZVwiKVxuICAgICAgICBpZiAobXVsdGlWYWx1ZU5vZGUpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXRNdWx0aSA9IGRhdGEubXVsdGlwbGUgfHwgMVxuICAgICAgICAgICAgc2VsZi5fYW5pbWF0ZU51bWJlcihtdWx0aVZhbHVlTm9kZSwgMSwgdGFyZ2V0TXVsdGksIDgwMCwgXCJ4XCIpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+UoiDmlbDlrZfmu5rliqjliqjnlLtcbiAgICAgKi9cbiAgICBfYW5pbWF0ZU51bWJlcjogZnVuY3Rpb24obm9kZSwgZnJvbSwgdG8sIGR1cmF0aW9uLCBwcmVmaXgpIHtcbiAgICAgICAgaWYgKCFub2RlKSByZXR1cm5cbiAgICAgICAgdmFyIGxhYmVsID0gbm9kZS5nZXRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGlmICghbGFiZWwpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgdmFyIHN0YXJ0VGltZSA9IERhdGUubm93KClcbiAgICAgICAgdmFyIGRpZmYgPSB0byAtIGZyb21cbiAgICAgICAgXG4gICAgICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICghbm9kZS5pc1ZhbGlkKSByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGVsYXBzZWQgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lXG4gICAgICAgICAgICB2YXIgcHJvZ3Jlc3MgPSBNYXRoLm1pbihlbGFwc2VkIC8gZHVyYXRpb24sIDEpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOS9v+eUqOe8k+WKqOWHveaVsFxuICAgICAgICAgICAgdmFyIGVhc2VQcm9ncmVzcyA9IDEgLSBNYXRoLnBvdygxIC0gcHJvZ3Jlc3MsIDMpIC8vIGVhc2VPdXRDdWJpY1xuICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSBNYXRoLmZsb29yKGZyb20gKyBkaWZmICogZWFzZVByb2dyZXNzKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsYWJlbC5zdHJpbmcgPSAocHJlZml4IHx8IFwiXCIpICsgY3VycmVudFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAocHJvZ3Jlc3MgPCAxKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCh1cGRhdGUsIDE2KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5zdHJpbmcgPSAocHJlZml4IHx8IFwiXCIpICsgdG9cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdXBkYXRlKClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+UjSDmn6Xmib7oioLngrlcbiAgICAgKi9cbiAgICBfZmluZE5vZGVCeU5hbWU6IGZ1bmN0aW9uKHBhcmVudCwgbmFtZSkge1xuICAgICAgICBpZiAoIXBhcmVudCkgcmV0dXJuIG51bGxcbiAgICAgICAgXG4gICAgICAgIHZhciBjaGlsZHJlbiA9IHBhcmVudC5jaGlsZHJlblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoY2hpbGRyZW5baV0ubmFtZSA9PT0gbmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjaGlsZHJlbltpXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGZvdW5kID0gdGhpcy5fZmluZE5vZGVCeU5hbWUoY2hpbGRyZW5baV0sIG5hbWUpXG4gICAgICAgICAgICBpZiAoZm91bmQpIHJldHVybiBmb3VuZFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOWFs+mXree7k+eul+W8ueeqlyAtIOW4pue8qeWwj+a3oeWHuuWKqOeUu1xuICAgICAqL1xuICAgIF9jbG9zZUdhbWVSZXN1bHRQb3B1cDogZnVuY3Rpb24ocG9wdXBOb2RlLCBtYXNrTm9kZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgXG4gICAgICAgIC8vIOWBnOatouaJgOacieeykuWtkOWKqOeUu1xuICAgICAgICBpZiAodGhpcy5fcmVzdWx0RWZmZWN0TGF5ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdEVmZmVjdExheWVyLnN0b3BBbGxBY3Rpb25zKClcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuX3Jlc3VsdEVmZmVjdExheWVyLmNoaWxkcmVuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY2hpbGRyZW5baV0uc3RvcEFsbEFjdGlvbnMoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlvLnnqpfnvKnlsI/mt6Hlh7rliqjnlLtcbiAgICAgICAgaWYgKHBvcHVwTm9kZSkge1xuICAgICAgICAgICAgY2MudHdlZW4ocG9wdXBOb2RlKVxuICAgICAgICAgICAgICAgIC50bygwLjIsIHsgc2NhbGU6IDAuOCwgb3BhY2l0eTogMCB9LCB7IGVhc2luZzogJ2JhY2tJbicgfSlcbiAgICAgICAgICAgICAgICAuY2FsbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBvcHVwTm9kZSAmJiBwb3B1cE5vZGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXBOb2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDpga7nvanmt6Hlh7pcbiAgICAgICAgaWYgKG1hc2tOb2RlKSB7XG4gICAgICAgICAgICBjYy50d2VlbihtYXNrTm9kZSlcbiAgICAgICAgICAgICAgICAudG8oMC4yLCB7IG9wYWNpdHk6IDAgfSlcbiAgICAgICAgICAgICAgICAuY2FsbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hc2tOb2RlICYmIG1hc2tOb2RlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hc2tOb2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9nYW1lUmVzdWx0UG9wdXAgPSBudWxsXG4gICAgICAgIHRoaXMuX2dhbWVSZXN1bHRNYXNrID0gbnVsbFxuICAgICAgICB0aGlzLl9yZXN1bHRFZmZlY3RMYXllciA9IG51bGxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog57un57ut5ri45oiPXG4gICAgICovXG4gICAgX2NvbnRpbnVlR2FtZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAoIW15Z2xvYmFsIHx8ICFteWdsb2JhbC5wbGF5ZXJEYXRhKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeajgOafpeeOqeWutuixhuWtkOaYr+WQpui2s+Wkn+e7p+e7rea4uOaIj1xuICAgICAgICB2YXIgcGxheWVyR29sZCA9IG15Z2xvYmFsLnBsYXllckRhdGEuZ29iYWxfY291bnQgfHwgMFxuICAgICAgICB2YXIgcm9vbUNvbmZpZyA9IG15Z2xvYmFsLmN1cnJlbnRSb29tQ29uZmlnIHx8IHt9XG4gICAgICAgIHZhciBtaW5Hb2xkID0gcm9vbUNvbmZpZy5taW5fZ29sZCB8fCByb29tQ29uZmlnLm1pbkdvbGQgfHwgMFxuICAgICAgICBcbiAgICAgICAgaWYgKHBsYXllckdvbGQgPCBtaW5Hb2xkKSB7XG4gICAgICAgICAgICAvLyDosYblrZDkuI3otrPvvIzmmL7npLrosYblrZDkuI3otrPlvLnnqpdcbiAgICAgICAgICAgIHRoaXMuX3Nob3dJbnN1ZmZpY2llbnRHb2xkUG9wdXAocGxheWVyR29sZCwgbWluR29sZClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDosYblrZDotrPlpJ/vvIznu6fnu63muLjmiI9cbiAgICAgICAgdGhpcy5fZG9Db250aW51ZUdhbWUoKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeaJp+ihjOe7p+e7rea4uOaIj+mAu+i+kVxuICAgICAqL1xuICAgIF9kb0NvbnRpbnVlR2FtZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOa4heeQhuW9k+WJjea4uOaIj+eKtuaAgVxuICAgICAgICB0aGlzLl9yZXNldEdhbWVTdGF0ZSgpXG4gICAgICAgIFxuICAgICAgICAvLyDlj5HpgIEgcmVhZHkg6K+35rGC77yI5YeG5aSH5LiL5LiA5bGA77yJXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAobXlnbG9iYWwgJiYgbXlnbG9iYWwuc29ja2V0ICYmIG15Z2xvYmFsLnNvY2tldC5yZXF1ZXN0UmVhZHkpIHtcbiAgICAgICAgICAgIG15Z2xvYmFsLnNvY2tldC5yZXF1ZXN0UmVhZHkoKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmmL7npLrnrYnlvoXmj5DnpLpcbiAgICAgICAgaWYgKHRoaXMudGlwc0xhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLnRpcHNMYWJlbC5zdHJpbmcgPSBcIuetieW+heWFtuS7lueOqeWuti4uLlwiXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYudGlwc0xhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGlwc0xhYmVsLnN0cmluZyA9IFwiXCJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCA1MDAwKVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5pi+56S66LGG5a2Q5LiN6Laz5by556qXXG4gICAgICovXG4gICAgX3Nob3dJbnN1ZmZpY2llbnRHb2xkUG9wdXA6IGZ1bmN0aW9uKGN1cnJlbnRHb2xkLCByZXF1aXJlZEdvbGQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIFxuICAgICAgICAvLyDlhbPpl63nu5PnrpflvLnnqpdcbiAgICAgICAgdGhpcy5fY2xvc2VHYW1lUmVzdWx0UG9wdXAoKVxuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu66LGG5a2Q5LiN6Laz5by556qXXG4gICAgICAgIHZhciBjYW52YXMgPSBjYy5kaXJlY3Rvci5nZXRTY2VuZSgpLmdldENoaWxkQnlOYW1lKFwiQ2FudmFzXCIpXG4gICAgICAgIGlmICghY2FudmFzKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHZhciB3aW5TaXplID0gY2Mud2luU2l6ZVxuICAgICAgICBcbiAgICAgICAgLy8g6YGu572p5bGCXG4gICAgICAgIHZhciBtYXNrTm9kZSA9IG5ldyBjYy5Ob2RlKFwiSW5zdWZmaWNpZW50R29sZE1hc2tcIilcbiAgICAgICAgbWFza05vZGUuYWRkQ29tcG9uZW50KGNjLkJsb2NrSW5wdXRFdmVudHMpXG4gICAgICAgIHZhciBtYXNrU3ByaXRlID0gbWFza05vZGUuYWRkQ29tcG9uZW50KGNjLlNwcml0ZSlcbiAgICAgICAgbWFza1Nwcml0ZS5zcHJpdGVGcmFtZSA9IG5ldyBjYy5TcHJpdGVGcmFtZSgpXG4gICAgICAgIG1hc2tTcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NXG4gICAgICAgIG1hc2tOb2RlLndpZHRoID0gd2luU2l6ZS53aWR0aCAqIDJcbiAgICAgICAgbWFza05vZGUuaGVpZ2h0ID0gd2luU2l6ZS5oZWlnaHQgKiAyXG4gICAgICAgIG1hc2tOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDAsIDAsIDApXG4gICAgICAgIG1hc2tOb2RlLm9wYWNpdHkgPSAxODBcbiAgICAgICAgbWFza05vZGUucGFyZW50ID0gY2FudmFzXG4gICAgICAgIFxuICAgICAgICAvLyDlvLnnqpflrrnlmahcbiAgICAgICAgdmFyIHBvcHVwTm9kZSA9IG5ldyBjYy5Ob2RlKFwiSW5zdWZmaWNpZW50R29sZFBvcHVwXCIpXG4gICAgICAgIHBvcHVwTm9kZS54ID0gMFxuICAgICAgICBwb3B1cE5vZGUueSA9IDBcbiAgICAgICAgcG9wdXBOb2RlLnBhcmVudCA9IGNhbnZhc1xuICAgICAgICBcbiAgICAgICAgLy8g5by556qX6IOM5pmvXG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkJnXCIpXG4gICAgICAgIHZhciBncmFwaGljcyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIHZhciBwb3B1cFdpZHRoID0gNDUwXG4gICAgICAgIHZhciBwb3B1cEhlaWdodCA9IDMyMFxuICAgICAgICBncmFwaGljcy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoNDAsIDM1LCA2MClcbiAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC1wb3B1cFdpZHRoLzIsIC1wb3B1cEhlaWdodC8yLCBwb3B1cFdpZHRoLCBwb3B1cEhlaWdodCwgMjApXG4gICAgICAgIGdyYXBoaWNzLmZpbGwoKVxuICAgICAgICBncmFwaGljcy5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIwMCwgMTAwKVxuICAgICAgICBncmFwaGljcy5saW5lV2lkdGggPSAzXG4gICAgICAgIGdyYXBoaWNzLnJvdW5kUmVjdCgtcG9wdXBXaWR0aC8yLCAtcG9wdXBIZWlnaHQvMiwgcG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQsIDIwKVxuICAgICAgICBncmFwaGljcy5zdHJva2UoKVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmoIfpophcbiAgICAgICAgdmFyIHRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIilcbiAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB0aXRsZUxhYmVsLnN0cmluZyA9IFwi6LGG5a2Q5LiN6LazXCJcbiAgICAgICAgdGl0bGVMYWJlbC5mb250U2l6ZSA9IDI4XG4gICAgICAgIHRpdGxlTGFiZWwuZm9udEZhbWlseSA9IFwiQXJpYWxcIlxuICAgICAgICB0aXRsZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgdGl0bGVOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjAwLCAxMDApXG4gICAgICAgIHRpdGxlTm9kZS55ID0gcG9wdXBIZWlnaHQvMiAtIDQ1XG4gICAgICAgIHRpdGxlTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOWIhumalOe6v1xuICAgICAgICB2YXIgbGluZU5vZGUgPSBuZXcgY2MuTm9kZShcIkxpbmVcIilcbiAgICAgICAgdmFyIGxnID0gbGluZU5vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBsZy5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigxMDAsIDgwLCA2MClcbiAgICAgICAgbGcubGluZVdpZHRoID0gMVxuICAgICAgICBsZy5tb3ZlVG8oLXBvcHVwV2lkdGgvMiArIDMwLCBwb3B1cEhlaWdodC8yIC0gODApXG4gICAgICAgIGxnLmxpbmVUbyhwb3B1cFdpZHRoLzIgLSAzMCwgcG9wdXBIZWlnaHQvMiAtIDgwKVxuICAgICAgICBsZy5zdHJva2UoKVxuICAgICAgICBsaW5lTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOWGheWuueWMuuWfn1xuICAgICAgICB2YXIgY29udGVudE5vZGUgPSBuZXcgY2MuTm9kZShcIkNvbnRlbnRcIilcbiAgICAgICAgdmFyIGNvbnRlbnRMYWJlbCA9IGNvbnRlbnROb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgY29udGVudExhYmVsLnN0cmluZyA9IFwi5b2T5YmN6LGG5a2QOiBcIiArIHRoaXMuX2Zvcm1hdEdvbGQoY3VycmVudEdvbGQpICsgXCJcXG7pnIDopoHosYblrZA6IFwiICsgdGhpcy5fZm9ybWF0R29sZChyZXF1aXJlZEdvbGQpICsgXCJcXG5cXG7op4LnnIvmv4DlirHop4bpopHlub/lkYrlj6/ojrflj5bosYblrZBcIlxuICAgICAgICBjb250ZW50TGFiZWwuZm9udFNpemUgPSAyMFxuICAgICAgICBjb250ZW50TGFiZWwuZm9udEZhbWlseSA9IFwiQXJpYWxcIlxuICAgICAgICBjb250ZW50TGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICBjb250ZW50TGFiZWwub3ZlcmZsb3cgPSBjYy5MYWJlbC5PdmVyZmxvdy5SRVNJWkVfSEVJR0hUXG4gICAgICAgIGNvbnRlbnROb2RlLndpZHRoID0gcG9wdXBXaWR0aCAtIDYwXG4gICAgICAgIGNvbnRlbnROb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDIyMCwgMjIwLCAyMjApXG4gICAgICAgIGNvbnRlbnROb2RlLnkgPSAyMFxuICAgICAgICBjb250ZW50Tm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOaMiemSruWMuuWfn1xuICAgICAgICB2YXIgYnRuQXJlYU5vZGUgPSBuZXcgY2MuTm9kZShcIkJ1dHRvbkFyZWFcIilcbiAgICAgICAgYnRuQXJlYU5vZGUueSA9IC1wb3B1cEhlaWdodC8yICsgNjBcbiAgICAgICAgYnRuQXJlYU5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDop4LnnIvlub/lkYrmjInpkq5cbiAgICAgICAgdmFyIGFkQnRuID0gbmV3IGNjLk5vZGUoXCJBZEJ0blwiKVxuICAgICAgICB2YXIgYWRCZyA9IGFkQnRuLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgYWRCZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoODAsIDE4MCwgODApXG4gICAgICAgIGFkQmcucm91bmRSZWN0KC0xMDAsIC0yNSwgMjAwLCA1MCwgMjUpXG4gICAgICAgIGFkQmcuZmlsbCgpXG4gICAgICAgIGFkQnRuLnggPSAtMTEwXG4gICAgICAgIGFkQnRuLnBhcmVudCA9IGJ0bkFyZWFOb2RlXG4gICAgICAgIFxuICAgICAgICB2YXIgYWRMYWJlbE5vZGUgPSBuZXcgY2MuTm9kZShcIkxhYmVsXCIpXG4gICAgICAgIHZhciBhZExhYmVsID0gYWRMYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBhZExhYmVsLnN0cmluZyA9IFwi6KeC55yL5bm/5ZGKXCJcbiAgICAgICAgYWRMYWJlbC5mb250U2l6ZSA9IDIwXG4gICAgICAgIGFkTGFiZWwuZm9udEZhbWlseSA9IFwiQXJpYWxcIlxuICAgICAgICBhZExhYmVsTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICBhZExhYmVsTm9kZS5wYXJlbnQgPSBhZEJ0blxuICAgICAgICBcbiAgICAgICAgLy8g6L+U5Zue5aSn5Y6F5oyJ6ZKuXG4gICAgICAgIHZhciBsb2JieUJ0biA9IG5ldyBjYy5Ob2RlKFwiTG9iYnlCdG5cIilcbiAgICAgICAgdmFyIGxvYmJ5QmcgPSBsb2JieUJ0bi5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGxvYmJ5QmcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDEwMCwgODAsIDE0MClcbiAgICAgICAgbG9iYnlCZy5yb3VuZFJlY3QoLTEwMCwgLTI1LCAyMDAsIDUwLCAyNSlcbiAgICAgICAgbG9iYnlCZy5maWxsKClcbiAgICAgICAgbG9iYnlCdG4ueCA9IDExMFxuICAgICAgICBsb2JieUJ0bi5wYXJlbnQgPSBidG5BcmVhTm9kZVxuICAgICAgICBcbiAgICAgICAgdmFyIGxvYmJ5TGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJMYWJlbFwiKVxuICAgICAgICB2YXIgbG9iYnlMYWJlbCA9IGxvYmJ5TGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgbG9iYnlMYWJlbC5zdHJpbmcgPSBcIui/lOWbnuWkp+WOhVwiXG4gICAgICAgIGxvYmJ5TGFiZWwuZm9udFNpemUgPSAyMFxuICAgICAgICBsb2JieUxhYmVsLmZvbnRGYW1pbHkgPSBcIkFyaWFsXCJcbiAgICAgICAgbG9iYnlMYWJlbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgbG9iYnlMYWJlbE5vZGUucGFyZW50ID0gbG9iYnlCdG5cbiAgICAgICAgXG4gICAgICAgIC8vIOWtmOWCqOiKgueCueW8leeUqFxuICAgICAgICBzZWxmLl9pbnN1ZmZpY2llbnRHb2xkUG9wdXAgPSBwb3B1cE5vZGVcbiAgICAgICAgc2VsZi5faW5zdWZmaWNpZW50R29sZE1hc2sgPSBtYXNrTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g6KeC55yL5bm/5ZGK5oyJ6ZKu54K55Ye75LqL5Lu2XG4gICAgICAgIGFkQnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLl93YXRjaEFkRm9yR29sZChmdW5jdGlvbihzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5bm/5ZGK6KeC55yL5oiQ5Yqf77yM5YWz6Zet5by556qX5bm257un57ut5ri45oiPXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2Nsb3NlSW5zdWZmaWNpZW50R29sZFBvcHVwKClcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fZG9Db250aW51ZUdhbWUoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICAvLyDov5Tlm57lpKfljoXmjInpkq7ngrnlh7vkuovku7ZcbiAgICAgICAgbG9iYnlCdG4ub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuX2Nsb3NlSW5zdWZmaWNpZW50R29sZFBvcHVwKClcbiAgICAgICAgICAgIHNlbGYuX3JldHVyblRvTG9iYnkoKVxuICAgICAgICB9KVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeWFs+mXreixhuWtkOS4jei2s+W8ueeql1xuICAgICAqL1xuICAgIF9jbG9zZUluc3VmZmljaWVudEdvbGRQb3B1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbnN1ZmZpY2llbnRHb2xkUG9wdXApIHtcbiAgICAgICAgICAgIHRoaXMuX2luc3VmZmljaWVudEdvbGRQb3B1cC5kZXN0cm95KClcbiAgICAgICAgICAgIHRoaXMuX2luc3VmZmljaWVudEdvbGRQb3B1cCA9IG51bGxcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5faW5zdWZmaWNpZW50R29sZE1hc2spIHtcbiAgICAgICAgICAgIHRoaXMuX2luc3VmZmljaWVudEdvbGRNYXNrLmRlc3Ryb3koKVxuICAgICAgICAgICAgdGhpcy5faW5zdWZmaWNpZW50R29sZE1hc2sgPSBudWxsXG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHop4LnnIvmv4DlirHop4bpopHlub/lkYrojrflj5bosYblrZBcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIOWbnuiwg+WHveaVsO+8jOWPguaVsOS4uuaYr+WQpuaIkOWKn1xuICAgICAqL1xuICAgIF93YXRjaEFkRm9yR29sZDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIFxuICAgICAgICAvLyDmo4Dmn6XmmK/lkKbmnInlub/lkYpTREvvvIjlj6/moLnmja7lrp7pmYXpm4bmiJDnmoTlub/lkYpTREvosIPmlbTvvIlcbiAgICAgICAgLy8g6L+Z6YeM5o+Q5L6b5LiA5Liq6YCa55So55qE5a6e546w5qGG5p62XG4gICAgICAgIFxuICAgICAgICAvLyDmlrnlvI8xOiDlpoLmnpzpm4bmiJDkuobnqb/lsbHnlLLlub/lkYpTREsgKEJ5dGVkYW5jZSlcbiAgICAgICAgaWYgKHR5cGVvZiB0dCAhPT0gJ3VuZGVmaW5lZCcgJiYgdHQuc2hvd1Jld2FyZGVkVmlkZW9BZCkge1xuICAgICAgICAgICAgdHQuc2hvd1Jld2FyZGVkVmlkZW9BZCh7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOW5v+WRiuingueci+aIkOWKn++8jOWlluWKseixhuWtkFxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9yZXdhcmRHb2xkQWZ0ZXJBZChjYWxsYmFjaylcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZhaWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlub/lkYrop4LnnIvlpLHotKVcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2UoXCLlub/lkYrliqDovb3lpLHotKXvvIzor7fnqI3lkI7ph43or5VcIilcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhmYWxzZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOaWueW8jzI6IOWmguaenOmbhuaIkOS6huW+ruS/oeWwj+a4uOaIj+W5v+WRilNES1xuICAgICAgICBpZiAodHlwZW9mIHd4ICE9PSAndW5kZWZpbmVkJyAmJiB3eC5jcmVhdGVSZXdhcmRlZFZpZGVvQWQpIHtcbiAgICAgICAgICAgIHZhciByZXdhcmRlZFZpZGVvQWQgPSB3eC5jcmVhdGVSZXdhcmRlZFZpZGVvQWQoe1xuICAgICAgICAgICAgICAgIGFkVW5pdElkOiAnYWR1bml0LXh4eCcgLy8g5pu/5o2i5Li65a6e6ZmF55qE5bm/5ZGK5Y2V5YWDSURcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJld2FyZGVkVmlkZW9BZC5vbkNsb3NlKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICAgICAgICAgIGlmIChyZXMgJiYgcmVzLmlzRW5kZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g55So5oi35a6M5pW06KeC55yL5LqG5bm/5ZGKXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3Jld2FyZEdvbGRBZnRlckFkKGNhbGxiYWNrKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOeUqOaIt+aPkOWJjeWFs+mXreS6huW5v+WRilxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZShcIuivt+WujOaVtOingueci+W5v+WRiuiOt+WPluWlluWKsVwiKVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGZhbHNlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJld2FyZGVkVmlkZW9BZC5vbkVycm9yKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlKFwi5bm/5ZGK5Yqg6L295aSx6LSl77yM6K+356iN5ZCO6YeN6K+VXCIpXG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhmYWxzZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJld2FyZGVkVmlkZW9BZC5zaG93KCkuY2F0Y2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8g5aSx6LSl6YeN6K+VXG4gICAgICAgICAgICAgICAgcmV3YXJkZWRWaWRlb0FkLmxvYWQoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV3YXJkZWRWaWRlb0FkLnNob3coKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOaWueW8jzM6IOaooeaLn+W5v+WRiu+8iOW8gOWPkea1i+ivleeUqO+8iVxuICAgICAgICAvLyDlnKjlrp7pmYXlj5HluIPml7blupTor6XliKDpmaTmraTliIbmlK/miJbmm7/mjaLkuLrnnJ/lrp7lub/lkYpTREtcbiAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2UoXCLmraPlnKjliqDovb3lub/lkYouLi5cIilcbiAgICAgICAgXG4gICAgICAgIC8vIOaooeaLn+W5v+WRiuingueci+i/h+eoi++8iDLnp5LlkI7lpZblirHosYblrZDvvIlcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuX3Jld2FyZEdvbGRBZnRlckFkKGNhbGxiYWNrKVxuICAgICAgICB9LCAyMDAwKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeW5v+WRiuingueci+aIkOWKn+WQjuWlluWKseixhuWtkFxuICAgICAqL1xuICAgIF9yZXdhcmRHb2xkQWZ0ZXJHb2xkOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCB8fCAhbXlnbG9iYWwucGxheWVyRGF0YSkge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhmYWxzZSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlpZblirHosYblrZDmlbDph4/vvIjlj6/moLnmja7lrp7pmYXpnIDmsYLosIPmlbTvvIlcbiAgICAgICAgdmFyIHJld2FyZEFtb3VudCA9IDUwMDBcbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOacrOWcsOixhuWtkOaVsOmHj1xuICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLnVwZGF0ZUdvbGQocmV3YXJkQW1vdW50KVxuICAgICAgICBcbiAgICAgICAgLy8g5pi+56S65aWW5Yqx5o+Q56S6XG4gICAgICAgIHRoaXMuX3Nob3dNZXNzYWdlKFwi6I635b6XIFwiICsgdGhpcy5fZm9ybWF0R29sZChyZXdhcmRBbW91bnQpICsgXCIg6LGG5a2Q77yBXCIpXG4gICAgICAgIFxuICAgICAgICAvLyDpgJrnn6XmnI3liqHnq6/vvIjlpoLmnpzpnIDopoHlkIzmraXvvIlcbiAgICAgICAgaWYgKG15Z2xvYmFsLnNvY2tldCAmJiBteWdsb2JhbC5zb2NrZXQuc2VuZEFkUmV3YXJkKSB7XG4gICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQuc2VuZEFkUmV3YXJkKHJld2FyZEFtb3VudClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayh0cnVlKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOS/ruWkjeOAkeW5v+WRiuingueci+aIkOWKn+WQjuWlluWKseixhuWtkO+8iOS/ruato+aWueazleWQjeaLvOWGmemUmeivr++8iVxuICAgICAqL1xuICAgIF9yZXdhcmRHb2xkQWZ0ZXJBZDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIGlmICghbXlnbG9iYWwgfHwgIW15Z2xvYmFsLnBsYXllckRhdGEpIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZmFsc2UpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5aWW5Yqx6LGG5a2Q5pWw6YeP77yI5Y+v5qC55o2u5a6e6ZmF6ZyA5rGC6LCD5pW077yJXG4gICAgICAgIHZhciByZXdhcmRBbW91bnQgPSA1MDAwXG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDmnKzlnLDosYblrZDmlbDph49cbiAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YS51cGRhdGVHb2xkKHJld2FyZEFtb3VudClcbiAgICAgICAgXG4gICAgICAgIC8vIOaYvuekuuWlluWKseaPkOekulxuICAgICAgICB0aGlzLl9zaG93TWVzc2FnZShcIuiOt+W+lyBcIiArIHRoaXMuX2Zvcm1hdEdvbGQocmV3YXJkQW1vdW50KSArIFwiIOixhuWtkO+8gVwiKVxuICAgICAgICBcbiAgICAgICAgLy8g6YCa55+l5pyN5Yqh56uv77yI5aaC5p6c6ZyA6KaB5ZCM5q2l77yJXG4gICAgICAgIGlmIChteWdsb2JhbC5zb2NrZXQgJiYgbXlnbG9iYWwuc29ja2V0LnNlbmRBZFJld2FyZCkge1xuICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LnNlbmRBZFJld2FyZChyZXdhcmRBbW91bnQpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2sodHJ1ZSlcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHmoLzlvI/ljJbosYblrZDmlbDph4/mmL7npLpcbiAgICAgKi9cbiAgICBfZm9ybWF0R29sZDogZnVuY3Rpb24oZ29sZCkge1xuICAgICAgICBpZiAoZ29sZCA+PSAxMDAwMCkge1xuICAgICAgICAgICAgcmV0dXJuIChnb2xkIC8gMTAwMDApLnRvRml4ZWQoMSkgKyBcIuS4h1wiXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGdvbGQudG9TdHJpbmcoKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeaYvuekuua2iOaBr+aPkOekulxuICAgICAqL1xuICAgIF9zaG93TWVzc2FnZTogZnVuY3Rpb24obXNnKSB7XG4gICAgICAgIGlmICh0aGlzLnRpcHNMYWJlbCkge1xuICAgICAgICAgICAgdGhpcy50aXBzTGFiZWwuc3RyaW5nID0gbXNnXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYudGlwc0xhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGlwc0xhYmVsLnN0cmluZyA9IFwiXCJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAzMDAwKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOi/lOWbnuWkp+WOhVxuICAgICAqL1xuICAgIF9yZXR1cm5Ub0xvYmJ5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIOa4heeQhuW9k+WJjea4uOaIj+eKtuaAgVxuICAgICAgICB0aGlzLl9yZXNldEdhbWVTdGF0ZSgpXG4gICAgICAgIFxuICAgICAgICAvLyDlj5HpgIHnprvlvIDmiL/pl7Tor7fmsYJcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIGlmIChteWdsb2JhbCAmJiBteWdsb2JhbC5zb2NrZXQgJiYgbXlnbG9iYWwuc29ja2V0LmxlYXZlUm9vbSkge1xuICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LmxlYXZlUm9vbSgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+OriBbX3JldHVyblRvTG9iYnldIG15Z2xvYmFsLnNvY2tldC5sZWF2ZVJvb20g5LiN5Y+v55SoXCIpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWKoOi9veWkp+WOheWcuuaZr1xuICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOmHjee9rua4uOaIj+eKtuaAgVxuICAgICAqL1xuICAgIF9yZXNldEdhbWVTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOa4heeQhuaJi+eJjFxuICAgICAgICB0aGlzLmhhbmRDYXJkcyA9IFtdXG4gICAgICAgIHRoaXMuYm90dG9tQ2FyZHMgPSBbXVxuICAgICAgICB0aGlzLmNob29zZV9jYXJkX2RhdGEgPSBbXVxuICAgICAgICBcbiAgICAgICAgLy8g5riF55CG5Y2h54mM6IqC54K5XG4gICAgICAgIHRoaXMuY2xlYXJBbGxDYXJkcygpXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5riF55CG5omA5pyJ546p5a6255qE5Ye654mM5Yy65Z+f77yI5qGM6Z2i5LiK55qE54mM77yJXG4gICAgICAgIHRoaXMuX2NsZWFyQWxsT3V0Q2FyZFpvbmVzKClcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmuIXnkIblupXniYzoioLngrlcbiAgICAgICAgdGhpcy5fY2xlYXJCb3R0b21DYXJkcygpXG4gICAgICAgIFxuICAgICAgICAvLyDph43nva7muLjmiI/pmLbmrrVcbiAgICAgICAgdGhpcy5fZ2FtZVBoYXNlID0gXCJpZGxlXCJcbiAgICAgICAgdGhpcy5fYmlkZGluZ1BoYXNlID0gXCJpZGxlXCJcbiAgICAgICAgXG4gICAgICAgIC8vIOmakOiXj+aJgOaciVVJXG4gICAgICAgIHRoaXMuX2hpZGVSb2JVSSgpXG4gICAgICAgIGlmICh0aGlzLnBsYXlpbmdVSV9ub2RlKSB7XG4gICAgICAgICAgICB0aGlzLnBsYXlpbmdVSV9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHph43nva7miYDmnInnjqnlrrbnmoTlh4blpIflm77moIfnirbmgIFcbiAgICAgICAgdGhpcy5fcmVzZXRBbGxQbGF5ZXJSZWFkeVN0YXRlKClcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHmuIXnkIbmiYDmnInnjqnlrrbnmoTlh7rniYzljLrln59cbiAgICAgKi9cbiAgICBfY2xlYXJBbGxPdXRDYXJkWm9uZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+WIGdhbWVTY2VuZSDohJrmnKxcbiAgICAgICAgdmFyIGdhbWVTY2VuZV9zY3JpcHQgPSB0aGlzLm5vZGUucGFyZW50ID8gdGhpcy5ub2RlLnBhcmVudC5nZXRDb21wb25lbnQoXCJnYW1lU2NlbmVcIikgOiBudWxsXG4gICAgICAgIGlmICghZ2FtZVNjZW5lX3NjcmlwdCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+OriBbX2NsZWFyQWxsT3V0Q2FyZFpvbmVzXSDml6Dms5Xojrflj5YgZ2FtZVNjZW5lXCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+W546p5a625bqn5L2N6IqC54K5XG4gICAgICAgIHZhciBwbGF5ZXJzX3NlYXRfcG9zID0gZ2FtZVNjZW5lX3NjcmlwdC5wbGF5ZXJzX3NlYXRfcG9zXG4gICAgICAgIGlmICghcGxheWVyc19zZWF0X3Bvcykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+OriBbX2NsZWFyQWxsT3V0Q2FyZFpvbmVzXSDml6Dms5Xojrflj5YgcGxheWVyc19zZWF0X3Bvc1wiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmBjeWOhuaJgOacieW6p+S9je+8jOa4heeQhuWHuueJjOWMuuWfn1xuICAgICAgICB2YXIgY2hpbGRyZW4gPSBwbGF5ZXJzX3NlYXRfcG9zLmNoaWxkcmVuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBzZWF0Tm9kZSA9IGNoaWxkcmVuW2ldXG4gICAgICAgICAgICAvLyDmn6Xmib7lh7rniYzljLrln5/oioLngrnvvIhjYXJkc291dHpvbmUwLCBjYXJkc291dHpvbmUxLCBjYXJkc291dHpvbmUy77yJXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDM7IGorKykge1xuICAgICAgICAgICAgICAgIHZhciBvdXRab25lTmFtZSA9IFwiY2FyZHNvdXR6b25lXCIgKyBqXG4gICAgICAgICAgICAgICAgdmFyIG91dFpvbmUgPSBzZWF0Tm9kZS5nZXRDaGlsZEJ5TmFtZShvdXRab25lTmFtZSlcbiAgICAgICAgICAgICAgICBpZiAob3V0Wm9uZSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRab25lLnJlbW92ZUFsbENoaWxkcmVuKHRydWUpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5riF55CG5bqV54mM6IqC54K5XG4gICAgICovXG4gICAgX2NsZWFyQm90dG9tQ2FyZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBcbiAgICAgICAgLy8g6ZSA5q+B5bqV54mM6IqC54K5XG4gICAgICAgIGlmICh0aGlzLmJvdHRvbV9jYXJkKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYm90dG9tX2NhcmQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ib3R0b21fY2FyZFtpXSAmJiB0aGlzLmJvdHRvbV9jYXJkW2ldLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ib3R0b21fY2FyZFtpXS5kZXN0cm95KClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ib3R0b21fY2FyZCA9IFtdXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR6YeN572u5omA5pyJ546p5a6255qE5YeG5aSH5Zu+5qCH54q25oCBXG4gICAgICovXG4gICAgX3Jlc2V0QWxsUGxheWVyUmVhZHlTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBnYW1lU2NlbmVfc2NyaXB0ID0gdGhpcy5ub2RlLnBhcmVudCA/IHRoaXMubm9kZS5wYXJlbnQuZ2V0Q29tcG9uZW50KFwiZ2FtZVNjZW5lXCIpIDogbnVsbFxuICAgICAgICBpZiAoIWdhbWVTY2VuZV9zY3JpcHQgfHwgIWdhbWVTY2VuZV9zY3JpcHQucGxheWVyTm9kZUxpc3QpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdhbWVTY2VuZV9zY3JpcHQucGxheWVyTm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwbGF5ZXJOb2RlID0gZ2FtZVNjZW5lX3NjcmlwdC5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgaWYgKHBsYXllck5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGxheWVyU2NyaXB0ID0gcGxheWVyTm9kZS5nZXRDb21wb25lbnQoXCJwbGF5ZXJfbm9kZVwiKVxuICAgICAgICAgICAgICAgIGlmIChwbGF5ZXJTY3JpcHQgJiYgcGxheWVyU2NyaXB0LnJlYWR5aW1hZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyU2NyaXB0LnJlYWR5aW1hZ2UuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHmm7TmlrDnjqnlrrboioLngrnnmoTph5HluIHmmL7npLpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGxheWVySWQgLSDnjqnlrrZJRFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBnb2xkIC0g5paw55qE6YeR5biB5pWw6YePXG4gICAgICovXG4gICAgX3VwZGF0ZVBsYXllckdvbGREaXNwbGF5OiBmdW5jdGlvbihwbGF5ZXJJZCwgZ29sZCkge1xuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+WIGdhbWVTY2VuZSDohJrmnKxcbiAgICAgICAgdmFyIGdhbWVTY2VuZV9zY3JpcHQgPSB0aGlzLm5vZGUucGFyZW50ID8gdGhpcy5ub2RlLnBhcmVudC5nZXRDb21wb25lbnQoXCJnYW1lU2NlbmVcIikgOiBudWxsXG4gICAgICAgIGlmICghZ2FtZVNjZW5lX3NjcmlwdCB8fCAhZ2FtZVNjZW5lX3NjcmlwdC5wbGF5ZXJOb2RlTGlzdCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+PhiBbX3VwZGF0ZVBsYXllckdvbGREaXNwbGF5XSDml6Dms5Xojrflj5YgZ2FtZVNjZW5lIOaIliBwbGF5ZXJOb2RlTGlzdFwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmBjeWOhuaJgOacieeOqeWutuiKgueCue+8jOaJvuWIsOWMuemFjeeahOeOqeWutuW5tuabtOaWsOmHkeW4geaYvuekulxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdhbWVTY2VuZV9zY3JpcHQucGxheWVyTm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwbGF5ZXJOb2RlID0gZ2FtZVNjZW5lX3NjcmlwdC5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgaWYgKCFwbGF5ZXJOb2RlKSBjb250aW51ZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgcGxheWVyU2NyaXB0ID0gcGxheWVyTm9kZS5nZXRDb21wb25lbnQoXCJwbGF5ZXJfbm9kZVwiKVxuICAgICAgICAgICAgaWYgKCFwbGF5ZXJTY3JpcHQpIGNvbnRpbnVlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWMuemFjeeOqeWutklEXG4gICAgICAgICAgICBpZiAoU3RyaW5nKHBsYXllclNjcmlwdC5hY2NvdW50aWQpID09PSBTdHJpbmcocGxheWVySWQpKSB7XG4gICAgICAgICAgICAgICAgLy8g5pu05paw6YeR5biB5pi+56S6XG4gICAgICAgICAgICAgICAgaWYgKHBsYXllclNjcmlwdC5nbG9iYWxjb3VudF9sYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJTY3JpcHQuZ2xvYmFsY291bnRfbGFiZWwuc3RyaW5nID0gU3RyaW5nKGdvbGQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeabtOaWsOeOqeWutuiKgueCueeahOernuaKgOW4geaYvuekuu+8iOernuaKgOWcuuaooeW8j+S4k+eUqO+8iVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwbGF5ZXJJZCAtIOeOqeWutklEXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG1hdGNoQ29pbiAtIOaWsOeahOernuaKgOW4geaVsOmHj1xuICAgICAqL1xuICAgIF91cGRhdGVQbGF5ZXJNYXRjaENvaW5EaXNwbGF5OiBmdW5jdGlvbihwbGF5ZXJJZCwgbWF0Y2hDb2luKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbX3VwZGF0ZVBsYXllck1hdGNoQ29pbkRpc3BsYXldIOabtOaWsOeOqeWutuernuaKgOW4gTogcGxheWVySWQ9XCIsIHBsYXllcklkLCBcIm1hdGNoQ29pbj1cIiwgbWF0Y2hDb2luKVxuXG4gICAgICAgIC8vIOiOt+WPliBnYW1lU2NlbmUg6ISa5pysXG4gICAgICAgIHZhciBnYW1lU2NlbmVfc2NyaXB0ID0gdGhpcy5ub2RlLnBhcmVudCA/IHRoaXMubm9kZS5wYXJlbnQuZ2V0Q29tcG9uZW50KFwiZ2FtZVNjZW5lXCIpIDogbnVsbFxuICAgICAgICBpZiAoIWdhbWVTY2VuZV9zY3JpcHQgfHwgIWdhbWVTY2VuZV9zY3JpcHQucGxheWVyTm9kZUxpc3QpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCfj5/vuI8gW191cGRhdGVQbGF5ZXJNYXRjaENvaW5EaXNwbGF5XSDml6Dms5Xojrflj5YgZ2FtZVNjZW5lIOaIliBwbGF5ZXJOb2RlTGlzdFwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICAvLyDpgY3ljobmiYDmnInnjqnlrrboioLngrnvvIzmib7liLDljLnphY3nmoTnjqnlrrblubbmm7TmlrDnq57mioDluIHmmL7npLpcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnYW1lU2NlbmVfc2NyaXB0LnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGxheWVyTm9kZSA9IGdhbWVTY2VuZV9zY3JpcHQucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgIGlmICghcGxheWVyTm9kZSkgY29udGludWVcblxuICAgICAgICAgICAgdmFyIHBsYXllclNjcmlwdCA9IHBsYXllck5vZGUuZ2V0Q29tcG9uZW50KFwicGxheWVyX25vZGVcIilcbiAgICAgICAgICAgIGlmICghcGxheWVyU2NyaXB0KSBjb250aW51ZVxuXG4gICAgICAgICAgICAvLyDljLnphY3njqnlrrZJRFxuICAgICAgICAgICAgaWYgKFN0cmluZyhwbGF5ZXJTY3JpcHQuYWNjb3VudGlkKSA9PT0gU3RyaW5nKHBsYXllcklkKSkge1xuICAgICAgICAgICAgICAgIC8vIOabtOaWsOernuaKgOW4geaYvuekulxuICAgICAgICAgICAgICAgIGlmIChwbGF5ZXJTY3JpcHQuZ2xvYmFsY291bnRfbGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyU2NyaXB0Lmdsb2JhbGNvdW50X2xhYmVsLnN0cmluZyA9IFN0cmluZyhtYXRjaENvaW4pXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbX3VwZGF0ZVBsYXllck1hdGNoQ29pbkRpc3BsYXldIOW3suabtOaWsOeOqeWutiBcIiwgcGxheWVySWQsIFwiIOeahOernuaKgOW4geaYvuekuuS4uiBcIiwgbWF0Y2hDb2luKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5L+d5a2Y56ue5oqA5biB5Yiw546p5a626ISa5pys5a6e5L6LXG4gICAgICAgICAgICAgICAgcGxheWVyU2NyaXB0Ll9tYXRjaENvaW4gPSBtYXRjaENvaW5cbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOOAkOernuaKgOWcuuOAkeWKn+iDveWHveaVsFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICog8J+PhuOAkOernuaKgOWcuuOAkeaYvuekuuernuaKgOWcuuS4k+eUqOe7k+eul+W8ueeql1xuICAgICAqIOernuaKgOWcuue7k+eul+mhteS4juaZrumAmuWcuuS4jeWQjO+8mlxuICAgICAqIC0g5Y+q5pi+56S677ya6L6T6LWi44CB5YCN5pWw44CB5b2T5YmN5q+U6LWb6YeR5biBXG4gICAgICogLSDkuI3mmL7npLrvvJrnu6fnu63muLjmiI/jgIHov5Tlm57lpKfljoXmjInpkq5cbiAgICAgKiAtIOaYvuekuu+8mlwi5LiL5LiA5bGA5byA5aeLIDE156eSXCIg5YCS6K6h5pe2XG4gICAgICogXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeWmguaenOaYr+acgOe7iOe7k+eul++8iOWPquaciTPkurrvvInvvIzot7Pov4fmraTlvLnnqpfvvIznrYnlvoUgb25Db21wZXRpdGlvbkNoYW1waW9uIOa2iOaBr+aYvuekuuaOkuWQjVxuICAgICAqL1xuICAgIF9zaG93Q29tcGV0aXRpb25SZXN1bHRQb3B1cDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7jgJHmo4Dmn6XmmK/lkKbmmK/mnIDnu4jnu5PnrpfvvIjlj6rmnIkz5Lq65Y+C6LWb77yJXG4gICAgICAgIC8vIOWmguaenOaYr+acgOe7iOe7k+eul++8jOi3s+i/h+atpOW8ueeql++8jOetieW+hSBvbkNvbXBldGl0aW9uQ2hhbXBpb24g5raI5oGv5pi+56S65o6S5ZCNXG4gICAgICAgIGlmIChkYXRhLmlzX2ZpbmFsX3JvdW5kKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj4YgW19zaG93Q29tcGV0aXRpb25SZXN1bHRQb3B1cF0g5qOA5rWL5Yiw5pyA57uI57uT566X77yI5Y+q5pyJM+S6uu+8ie+8jOi3s+i/h+S4remXtOe7k+eul+W8ueeql++8jOetieW+heaOkuWQjea2iOaBr1wiKVxuICAgICAgICAgICAgLy8g5LiN5pi+56S65Lit6Ze05by556qX77yM55u05o6l562J5b6FIG9uQ29tcGV0aXRpb25DaGFtcGlvbiDmtojmga9cbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgd2luU2l6ZSA9IGNjLndpblNpemVcbiAgICAgICAgXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICB2YXIgbXlQbGF5ZXJJZCA9IG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKCkuaWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5zZXJ2ZXJQbGF5ZXJJZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRFxuICAgICAgICBcbiAgICAgICAgLy8g5Yik5pat6L6T6LWiXG4gICAgICAgIHZhciBpc1dpbm5lciA9IGZhbHNlXG4gICAgICAgIHZhciBteVdpbkdvbGQgPSAwXG4gICAgICAgIHZhciBteU1hdGNoQ29pbiA9IDAgIC8vIPCflKfjgJDmlrDlop7jgJHlvZPliY3njqnlrrbnmoTph5HluIHvvIjku45kYXRhLnBsYXllcnPojrflj5bvvIlcbiAgICAgICAgXG4gICAgICAgIGlmIChkYXRhLnBsYXllcnMgJiYgZGF0YS5wbGF5ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5wbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBsYXllciA9IGRhdGEucGxheWVyc1tpXVxuICAgICAgICAgICAgICAgIGlmIChTdHJpbmcocGxheWVyLnBsYXllcl9pZCkgPT09IFN0cmluZyhteVBsYXllcklkKSkge1xuICAgICAgICAgICAgICAgICAgICBpc1dpbm5lciA9IHBsYXllci5pc193aW5uZXJcbiAgICAgICAgICAgICAgICAgICAgbXlXaW5Hb2xkID0gcGxheWVyLndpbl9nb2xkXG4gICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHku47mnI3liqHnq6/ov5Tlm57nmoTnjqnlrrbmlbDmja7kuK3ojrflj5bph5HluIFcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBsYXllci5tYXRjaF9jb2luICE9PSB1bmRlZmluZWQgJiYgcGxheWVyLm1hdGNoX2NvaW4gPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXlNYXRjaENvaW4gPSBwbGF5ZXIubWF0Y2hfY29pblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5pu05paw5b2T5YmN546p5a6255qE6YeR5biB5pi+56S6XG4gICAgICAgIHRoaXMuX21hdGNoQ29pbiA9IG15TWF0Y2hDb2luXG5cbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeabtOaWsOaJgOacieeOqeWutueahOmHkeW4geaYvuekulxuICAgICAgICBpZiAoZGF0YS5wbGF5ZXJzICYmIGRhdGEucGxheWVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEucGxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXIgPSBkYXRhLnBsYXllcnNbaV1cbiAgICAgICAgICAgICAgICB2YXIgcGxheWVySWQgPSBwbGF5ZXIucGxheWVyX2lkXG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoQ29pbiA9IHBsYXllci5tYXRjaF9jb2luXG5cbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR56ue5oqA5Zy65qih5byP5LiL5pu05paw546p5a6255qE6YeR5biB5pi+56S6XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoQ29pbiAhPT0gdW5kZWZpbmVkICYmIG1hdGNoQ29pbiA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVBsYXllck1hdGNoQ29pbkRpc3BsYXkocGxheWVySWQsIG1hdGNoQ29pbilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2FudmFzID0gY2MuZmluZChcIkNhbnZhc1wiKSB8fCBjYy5maW5kKFwiVUlfUk9PVFwiKSB8fCB0aGlzLm5vZGUucGFyZW50XG4gICAgICAgIGlmICghY2FudmFzKSBjYW52YXMgPSB0aGlzLm5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOmBrue9qeWxglxuICAgICAgICB2YXIgbWFza05vZGUgPSBuZXcgY2MuTm9kZShcIkNvbXBldGl0aW9uUmVzdWx0TWFza1wiKVxuICAgICAgICBtYXNrTm9kZS5hZGRDb21wb25lbnQoY2MuQmxvY2tJbnB1dEV2ZW50cylcbiAgICAgICAgbWFza05vZGUuY29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcigwLCAzMCwgNTApIDogbmV3IGNjLkNvbG9yKDMwLCAwLCAwKVxuICAgICAgICBtYXNrTm9kZS5vcGFjaXR5ID0gMjAwXG4gICAgICAgIG1hc2tOb2RlLndpZHRoID0gd2luU2l6ZS53aWR0aCAqIDJcbiAgICAgICAgbWFza05vZGUuaGVpZ2h0ID0gd2luU2l6ZS5oZWlnaHQgKiAyXG4gICAgICAgIG1hc2tOb2RlLnpJbmRleCA9IDk5OVxuICAgICAgICBtYXNrTm9kZS5wYXJlbnQgPSBjYW52YXNcbiAgICAgICAgXG4gICAgICAgIC8vIOW8ueeql+WuueWZqFxuICAgICAgICB2YXIgcG9wdXBOb2RlID0gbmV3IGNjLk5vZGUoXCJDb21wZXRpdGlvblJlc3VsdFBvcHVwXCIpXG4gICAgICAgIHBvcHVwTm9kZS5zY2FsZSA9IDAuNVxuICAgICAgICBwb3B1cE5vZGUub3BhY2l0eSA9IDBcbiAgICAgICAgcG9wdXBOb2RlLnpJbmRleCA9IDEwMDBcbiAgICAgICAgcG9wdXBOb2RlLnBhcmVudCA9IGNhbnZhc1xuICAgICAgICBcbiAgICAgICAgdmFyIHBvcHVwV2lkdGggPSA0NTBcbiAgICAgICAgdmFyIHBvcHVwSGVpZ2h0ID0gMzgwICAvLyDwn5Sn44CQ6LCD5pW044CR5aKe5Yqg6auY5bqm5Lul5a6557qz5YCS6K6h5pe2XG4gICAgICAgIFxuICAgICAgICAvLyDog4zmma9cbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmdcIilcbiAgICAgICAgdmFyIGJnID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgYmcuZmlsbENvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoNDAsIDUwLCA4MCwgMjQwKSA6IG5ldyBjYy5Db2xvcig1MCwgMzUsIDQwLCAyNDApXG4gICAgICAgIGJnLnJvdW5kUmVjdCgtcG9wdXBXaWR0aC8yLCAtcG9wdXBIZWlnaHQvMiwgcG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQsIDIwKVxuICAgICAgICBiZy5maWxsKClcbiAgICAgICAgYmcuc3Ryb2tlQ29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcigxMDAsIDIwMCwgMjU1KSA6IG5ldyBjYy5Db2xvcigyMDAsIDEwMCwgMTAwKVxuICAgICAgICBiZy5saW5lV2lkdGggPSAzXG4gICAgICAgIGJnLnJvdW5kUmVjdCgtcG9wdXBXaWR0aC8yLCAtcG9wdXBIZWlnaHQvMiwgcG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQsIDIwKVxuICAgICAgICBiZy5zdHJva2UoKVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmoIfpophcbiAgICAgICAgdmFyIHRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIilcbiAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB0aXRsZUxhYmVsLnN0cmluZyA9IGlzV2lubmVyID8gXCLwn46JIOiDnOWIqSDwn46JXCIgOiBcIuKcliDlpLHotKUg4pyWXCJcbiAgICAgICAgdGl0bGVMYWJlbC5mb250U2l6ZSA9IDM2XG4gICAgICAgIHRpdGxlTm9kZS5jb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDEwMCwgMjU1LCAyMDApIDogbmV3IGNjLkNvbG9yKDI1NSwgMTUwLCAxNTApXG4gICAgICAgIHRpdGxlTm9kZS55ID0gcG9wdXBIZWlnaHQvMiAtIDUwXG4gICAgICAgIHRpdGxlTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHovpPotaLph5Hpop0gLSDnq57mioDlnLrmmL7npLpcIumHkeW4gVwi77yI5LiN5piv56ue5oqA5biB77yJXG4gICAgICAgIHZhciByZXN1bHROb2RlID0gbmV3IGNjLk5vZGUoXCJSZXN1bHRcIilcbiAgICAgICAgdmFyIHJlc3VsdExhYmVsID0gcmVzdWx0Tm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHJlc3VsdExhYmVsLnN0cmluZyA9IFwi5pys5bGA57uT5p6cOiBcIiArIChteVdpbkdvbGQgPj0gMCA/IFwiK1wiIDogXCJcIikgKyBteVdpbkdvbGQgKyBcIiDph5HluIFcIlxuICAgICAgICByZXN1bHRMYWJlbC5mb250U2l6ZSA9IDI4XG4gICAgICAgIHJlc3VsdE5vZGUuY29sb3IgPSBteVdpbkdvbGQgPj0gMCA/IG5ldyBjYy5Db2xvcigxMDAsIDI1NSwgMTAwKSA6IG5ldyBjYy5Db2xvcigyNTUsIDEwMCwgMTAwKVxuICAgICAgICByZXN1bHROb2RlLnkgPSBwb3B1cEhlaWdodC8yIC0gMTAwXG4gICAgICAgIHJlc3VsdE5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDlgI3mlbBcbiAgICAgICAgdmFyIG11bHRpTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTXVsdGlwbGllclwiKVxuICAgICAgICB2YXIgbXVsdGlMYWJlbCA9IG11bHRpTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIG11bHRpTGFiZWwuc3RyaW5nID0gXCLmnKzlsYDlgI3mlbA6IHhcIiArIChkYXRhLm11bHRpcGxlIHx8IDEpXG4gICAgICAgIG11bHRpTGFiZWwuZm9udFNpemUgPSAyNFxuICAgICAgICBtdWx0aU5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMjAsIDE1MClcbiAgICAgICAgbXVsdGlOb2RlLnkgPSBwb3B1cEhlaWdodC8yIC0gMTQwXG4gICAgICAgIG11bHRpTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlvZPliY3ph5HluIHvvIjkuI3mmK/nq57mioDluIHvvIlcbiAgICAgICAgdmFyIGNvaW5Ob2RlID0gbmV3IGNjLk5vZGUoXCJNYXRjaENvaW5cIilcbiAgICAgICAgdmFyIGNvaW5MYWJlbCA9IGNvaW5Ob2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgY29pbkxhYmVsLnN0cmluZyA9IFwi5b2T5YmN6YeR5biBOiBcIiArIHRoaXMuX21hdGNoQ29pblxuICAgICAgICBjb2luTGFiZWwuZm9udFNpemUgPSAyNFxuICAgICAgICBjb2luTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIwMCwgMTAwKVxuICAgICAgICBjb2luTm9kZS55ID0gcG9wdXBIZWlnaHQvMiAtIDE4MFxuICAgICAgICBjb2luTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR56ue5oqA5Zy65YCS6K6h5pe2XG4gICAgICAgIC8vIOS4jeaYvuekulwi57un57ut5ri45oiPXCLlkoxcIui/lOWbnuWkp+WOhVwi5oyJ6ZKuXG4gICAgICAgIC8vIOaYvuekuuacjeWKoeerr+aOp+WItueahDMw56eS5YCS6K6h5pe2XG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHku44gZ2FtZV9vdmVyIOaVsOaNruS4reiOt+WPluWIneWni+WAkuiuoeaXtu+8jOeri+WNs+WQr+WKqOacrOWcsOWAkuiuoeaXtlxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7jgJHku47mnI3liqHnq6/mlbDmja7ojrflj5bliJ3lp4vlgJLorqHml7blgLxcbiAgICAgICAgdmFyIGluaXRpYWxDb3VudGRvd24gPSBkYXRhLmFyZW5hX2NvdW50ZG93biB8fCAzMFxuICAgICAgICBcbiAgICAgICAgLy8g5YCS6K6h5pe25pi+56S65a655ZmoXG4gICAgICAgIHZhciBjb3VudGRvd25Db250YWluZXIgPSBuZXcgY2MuTm9kZShcIkNvdW50ZG93bkNvbnRhaW5lclwiKVxuICAgICAgICBjb3VudGRvd25Db250YWluZXIueSA9IC1wb3B1cEhlaWdodC8yICsgODBcbiAgICAgICAgY291bnRkb3duQ29udGFpbmVyLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5YCS6K6h5pe25paH5a2XXG4gICAgICAgIHZhciBjb3VudGRvd25MYWJlbCA9IG5ldyBjYy5Ob2RlKFwiQ291bnRkb3duTGFiZWxcIilcbiAgICAgICAgdmFyIGNvdW50ZG93bkxhYmVsQ29tcCA9IGNvdW50ZG93bkxhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgY291bnRkb3duTGFiZWxDb21wLnN0cmluZyA9IFwi5LiL5LiA6L2u5bCG5ZyoIFwiICsgaW5pdGlhbENvdW50ZG93biArIFwiIOenkuWQjuW8gOWni1wiXG4gICAgICAgIGNvdW50ZG93bkxhYmVsQ29tcC5mb250U2l6ZSA9IDI2XG4gICAgICAgIGNvdW50ZG93bkxhYmVsLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjE1LCAwKSAgLy8g6YeR6buE6ImyXG4gICAgICAgIGNvdW50ZG93bkxhYmVsLnBhcmVudCA9IGNvdW50ZG93bkNvbnRhaW5lclxuICAgICAgICBcbiAgICAgICAgLy8g5YCS6K6h5pe25pWw5a2X77yI5aSn5Y+35pi+56S677yJXG4gICAgICAgIHZhciBjb3VudGRvd25OdW1iZXIgPSBuZXcgY2MuTm9kZShcIkNvdW50ZG93bk51bWJlclwiKVxuICAgICAgICB2YXIgY291bnRkb3duTnVtYmVyQ29tcCA9IGNvdW50ZG93bk51bWJlci5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGNvdW50ZG93bk51bWJlckNvbXAuc3RyaW5nID0gU3RyaW5nKGluaXRpYWxDb3VudGRvd24pXG4gICAgICAgIGNvdW50ZG93bk51bWJlckNvbXAuZm9udFNpemUgPSA0OFxuICAgICAgICBjb3VudGRvd25OdW1iZXIuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgY291bnRkb3duTnVtYmVyLnkgPSAtNDVcbiAgICAgICAgY291bnRkb3duTnVtYmVyLnBhcmVudCA9IGNvdW50ZG93bkNvbnRhaW5lclxuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg5o+P6L655pWI5p6cXG4gICAgICAgIHZhciBvdXRsaW5lID0gY291bnRkb3duTnVtYmVyLmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpXG4gICAgICAgIG91dGxpbmUuY29sb3IgPSBjYy5Db2xvci5CTEFDS1xuICAgICAgICBvdXRsaW5lLndpZHRoID0gMlxuICAgICAgICBcbiAgICAgICAgLy8g5by55Ye65Yqo55S7XG4gICAgICAgIGNjLnR3ZWVuKHBvcHVwTm9kZSlcbiAgICAgICAgICAgIC50bygwLjM1LCB7IHNjYWxlOiAxLCBvcGFjaXR5OiAyNTUgfSwgeyBlYXNpbmc6ICdiYWNrT3V0JyB9KVxuICAgICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgXG4gICAgICAgIC8vIOS/neWtmOW8leeUqFxuICAgICAgICB0aGlzLl9nYW1lUmVzdWx0UG9wdXAgPSBwb3B1cE5vZGVcbiAgICAgICAgdGhpcy5fZ2FtZVJlc3VsdE1hc2sgPSBtYXNrTm9kZVxuICAgICAgICB0aGlzLl9jb3VudGRvd25MYWJlbE5vZGUgPSBjb3VudGRvd25MYWJlbFxuICAgICAgICB0aGlzLl9jb3VudGRvd25OdW1iZXJOb2RlID0gY291bnRkb3duTnVtYmVyXG4gICAgICAgIHRoaXMuX2FyZW5hQ291bnRkb3duU2Vjb25kcyA9IGluaXRpYWxDb3VudGRvd25cbiAgICAgICAgXG4gICAgICAgIC8vIOaSreaUvumfs+aViFxuICAgICAgICB0aGlzLl9wbGF5R2FtZVJlc3VsdFNvdW5kKGlzV2lubmVyKVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHnq4vljbPlkK/liqjmnKzlnLDlgJLorqHml7blrprml7blmahcbiAgICAgICAgLy8g5ZCM5pe25rOo5YaM5pyN5Yqh56uv5raI5oGv55uR5ZCs77yM5Y+M5L+d6Zmp56Gu5L+d5YCS6K6h5pe25q2j5bi45bel5L2cXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICBcbiAgICAgICAgLy8g5ZCv5Yqo5pys5Zyw5YCS6K6h5pe25a6a5pe25ZmoXG4gICAgICAgIHRoaXMuX3N0YXJ0TG9jYWxBcmVuYUNvdW50ZG93bihpbml0aWFsQ291bnRkb3duKVxuICAgICAgICBcbiAgICAgICAgLy8g5rOo5YaM5pyN5Yqh56uv5YCS6K6h5pe25raI5oGv55uR5ZCs77yI5L2c5Li65aSH5Lu977yJXG4gICAgICAgIHRoaXMuX3NldHVwQXJlbmFDb3VudGRvd25MaXN0ZW5lcnMoKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeWQr+WKqOacrOWcsOernuaKgOWcuuWAkuiuoeaXtlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBzZWNvbmRzIC0g5Yid5aeL5YCS6K6h5pe256eS5pWwXG4gICAgICovXG4gICAgX3N0YXJ0TG9jYWxBcmVuYUNvdW50ZG93bjogZnVuY3Rpb24oc2Vjb25kcykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbX3N0YXJ0TG9jYWxBcmVuYUNvdW50ZG93bl0g5byA5aeL5ZCv5Yqo5YCS6K6h5pe2LCBzZWNvbmRzOlwiLCBzZWNvbmRzKVxuICAgICAgICBcbiAgICAgICAgLy8g5YGc5q2i5LmL5YmN55qE5YCS6K6h5pe2XG4gICAgICAgIGlmICh0aGlzLl9sb2NhbEFyZW5hQ291bnRkb3duVGltZXIpIHtcbiAgICAgICAgICAgIHRoaXMudW5zY2hlZHVsZSh0aGlzLl9sb2NhbEFyZW5hQ291bnRkb3duVGljaylcbiAgICAgICAgICAgIHRoaXMuX2xvY2FsQXJlbmFDb3VudGRvd25UaW1lciA9IG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5fYXJlbmFDb3VudGRvd25TZWNvbmRzID0gc2Vjb25kc1xuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeehruS/neWIneWni1VJ5q2j56Gu5pi+56S6XG4gICAgICAgIHRoaXMuX3VwZGF0ZUFyZW5hQ291bnRkb3duVUkoc2Vjb25kcylcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkvb/nlKggY2MuZGlyZWN0b3Ig55qE5pe26Ze06LCD5bqm77yM56Gu5L+d5Zyo5omA5pyJ5oOF5Ya15LiL6YO96IO95bel5L2cXG4gICAgICAgIC8vIOavj+enknRpY2vkuIDmrKHvvIzml6DpmZDph43lpI1cbiAgICAgICAgdGhpcy5zY2hlZHVsZSh0aGlzLl9sb2NhbEFyZW5hQ291bnRkb3duVGljaywgMSwgY2MubWFjcm8uUkVQRUFUX0ZPUkVWRVIsIDEpXG4gICAgICAgIHRoaXMuX2xvY2FsQXJlbmFDb3VudGRvd25UaW1lciA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbX3N0YXJ0TG9jYWxBcmVuYUNvdW50ZG93bl0g5pys5Zyw5YCS6K6h5pe25bey5ZCv5YqoXCIpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5pys5Zyw56ue5oqA5Zy65YCS6K6h5pe2VGlja1xuICAgICAqL1xuICAgIF9sb2NhbEFyZW5hQ291bnRkb3duVGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9hcmVuYUNvdW50ZG93blNlY29uZHMgPD0gMCkge1xuICAgICAgICAgICAgdGhpcy51bnNjaGVkdWxlKHRoaXMuX2xvY2FsQXJlbmFDb3VudGRvd25UaWNrKVxuICAgICAgICAgICAgdGhpcy5fbG9jYWxBcmVuYUNvdW50ZG93blRpbWVyID0gbnVsbFxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtfbG9jYWxBcmVuYUNvdW50ZG93blRpY2tdIOWAkuiuoeaXtue7k+adn++8jOetieW+heacjeWKoeerr+a2iOaBry4uLlwiKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5YCS6K6h5pe25b2SMOWQjuaYvuekuuetieW+heaPkOekuu+8jOe7p+e7reetieW+heacjeWKoeerr+a2iOaBr1xuICAgICAgICAgICAgLy8g5pyN5Yqh56uv5Lya5Y+R6YCBIE1zZ0FyZW5hQXV0b1JlYWR5IOaIluaWsOS4gOi9rua4uOaIj+a2iOaBr1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlQXJlbmFDb3VudGRvd25VSSgwKVxuICAgICAgICAgICAgdGhpcy5fc2hvd1dhaXRpbmdGb3JTZXJ2ZXIoKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2FyZW5hQ291bnRkb3duU2Vjb25kcy0tXG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrBVSVxuICAgICAgICB0aGlzLl91cGRhdGVBcmVuYUNvdW50ZG93blVJKHRoaXMuX2FyZW5hQ291bnRkb3duU2Vjb25kcylcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbX2xvY2FsQXJlbmFDb3VudGRvd25UaWNrXSDliankvZk6XCIsIHRoaXMuX2FyZW5hQ291bnRkb3duU2Vjb25kcylcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHmmL7npLrnrYnlvoXmnI3liqHnq6/lk43lupTmj5DnpLpcbiAgICAgKi9cbiAgICBfc2hvd1dhaXRpbmdGb3JTZXJ2ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDmm7TmlrDlgJLorqHml7bmoIfnrb7mmL7npLrnrYnlvoXmj5DnpLpcbiAgICAgICAgaWYgKHRoaXMuX2NvdW50ZG93bkxhYmVsTm9kZSkge1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gdGhpcy5fY291bnRkb3duTGFiZWxOb2RlLmdldENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIGxhYmVsLnN0cmluZyA9IFwi562J5b6F5pyN5Yqh5Zmo5ZON5bqULi4uXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6ZqQ6JeP5pWw5a2XXG4gICAgICAgIGlmICh0aGlzLl9jb3VudGRvd25OdW1iZXJOb2RlKSB7XG4gICAgICAgICAgICB2YXIgbGFiZWwgPSB0aGlzLl9jb3VudGRvd25OdW1iZXJOb2RlLmdldENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIGxhYmVsLnN0cmluZyA9IFwiLi4uXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeiuvue9ruernuaKgOWcuuWAkuiuoeaXtua2iOaBr+ebkeWQrFxuICAgICAqIOebkeWQrOacjeWKoeerr+aOqOmAgeeahOWAkuiuoeaXtua2iOaBr++8iOS9nOS4uuacrOWcsOWAkuiuoeaXtueahOWkh+S7veWSjOWQjOatpe+8iVxuICAgICAqL1xuICAgIF9zZXR1cEFyZW5hQ291bnRkb3duTGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBcbiAgICAgICAgaWYgKCFteWdsb2JhbCB8fCAhbXlnbG9iYWwuc29ja2V0KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn4+f77iPIFtfc2V0dXBBcmVuYUNvdW50ZG93bkxpc3RlbmVyc10gc29ja2V05pyq5Yid5aeL5YyWXCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g55uR5ZCs5YCS6K6h5pe25byA5aeL5raI5oGv77yI5aaC5p6c5pyN5Yqh56uv6YeN5paw5Y+R6YCB77yJXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkFyZW5hUm91bmRDb3VudGRvd24oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtvbkFyZW5hUm91bmRDb3VudGRvd25dIOaUtuWIsOWAkuiuoeaXtuW8gOWnizpcIiwgZGF0YSlcbiAgICAgICAgICAgIC8vIOWQjOatpeacjeWKoeerr+eahOWAkuiuoeaXtuWAvFxuICAgICAgICAgICAgc2VsZi5fYXJlbmFDb3VudGRvd25TZWNvbmRzID0gZGF0YS5zZWNvbmRzIHx8IDMwXG4gICAgICAgICAgICBzZWxmLl91cGRhdGVBcmVuYUNvdW50ZG93blVJKGRhdGEuc2Vjb25kcylcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIOebkeWQrOWAkuiuoeaXtuavj+enkuabtOaWsOa2iOaBr++8iOWQjOatpeacjeWKoeerr+eahOWAkuiuoeaXtu+8iVxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25BcmVuYUNvdW50ZG93blRpY2soZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtvbkFyZW5hQ291bnRkb3duVGlja10g5pyN5Yqh56uv5YCS6K6h5pe25ZCM5q2lOlwiLCBkYXRhLnNlY29uZHMpXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu44CR5ZCM5q2l5pyN5Yqh56uv55qE5YCS6K6h5pe25YC877yM56Gu5L+d5LiO5pyN5Yqh56uv5LiA6Ie0XG4gICAgICAgICAgICBzZWxmLl9hcmVuYUNvdW50ZG93blNlY29uZHMgPSBkYXRhLnNlY29uZHNcbiAgICAgICAgICAgIHNlbGYuX3VwZGF0ZUFyZW5hQ291bnRkb3duVUkoZGF0YS5zZWNvbmRzKVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8g55uR5ZCs6Ieq5Yqo5YeG5aSH5raI5oGvXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkFyZW5hQXV0b1JlYWR5KGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbb25BcmVuYUF1dG9SZWFkeV0g6Ieq5Yqo5YeG5aSHOlwiLCBkYXRhLm1lc3NhZ2UpXG4gICAgICAgICAgICAvLyDlgZzmraLmnKzlnLDlgJLorqHml7ZcbiAgICAgICAgICAgIGlmIChzZWxmLl9sb2NhbEFyZW5hQ291bnRkb3duVGltZXIpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnVuc2NoZWR1bGUoc2VsZi5fbG9jYWxBcmVuYUNvdW50ZG93blRpY2spXG4gICAgICAgICAgICAgICAgc2VsZi5fbG9jYWxBcmVuYUNvdW50ZG93blRpbWVyID0gbnVsbFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi5fc2hvd0FyZW5hQXV0b1JlYWR5TWVzc2FnZShkYXRhLm1lc3NhZ2UpXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICAvLyDnm5HlkKzmlq3nur/ph43ov57nirbmgIHmgaLlpI1cbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQXJlbmFSZWNvbm5lY3RTdGF0ZShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW29uQXJlbmFSZWNvbm5lY3RTdGF0ZV0g54q25oCB5oGi5aSNOlwiLCBkYXRhKVxuICAgICAgICAgICAgaWYgKGRhdGEucGhhc2UgPT09IFwiY291bnRkb3duXCIpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9hcmVuYUNvdW50ZG93blNlY29uZHMgPSBkYXRhLmNvdW50ZG93blxuICAgICAgICAgICAgICAgIHNlbGYuX3VwZGF0ZUFyZW5hQ291bnRkb3duVUkoZGF0YS5jb3VudGRvd24pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5pu05paw56ue5oqA5Zy65YCS6K6h5pe2VUlcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gc2Vjb25kcyAtIOWJqeS9meenkuaVsFxuICAgICAqL1xuICAgIF91cGRhdGVBcmVuYUNvdW50ZG93blVJOiBmdW5jdGlvbihzZWNvbmRzKSB7XG4gICAgICAgIC8vIOabtOaWsOaWh+Wtl1xuICAgICAgICBpZiAodGhpcy5fY291bnRkb3duTGFiZWxOb2RlKSB7XG4gICAgICAgICAgICB2YXIgbGFiZWwgPSB0aGlzLl9jb3VudGRvd25MYWJlbE5vZGUuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgaWYgKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwuc3RyaW5nID0gXCLkuIvkuIDova7lsIblnKggXCIgKyBzZWNvbmRzICsgXCIg56eS5ZCO5byA5aeLXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw5pWw5a2XXG4gICAgICAgIGlmICh0aGlzLl9jb3VudGRvd25OdW1iZXJOb2RlKSB7XG4gICAgICAgICAgICB2YXIgbnVtTGFiZWwgPSB0aGlzLl9jb3VudGRvd25OdW1iZXJOb2RlLmdldENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgIGlmIChudW1MYWJlbCkge1xuICAgICAgICAgICAgICAgIG51bUxhYmVsLnN0cmluZyA9IFN0cmluZyhzZWNvbmRzKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmnIDlkI4156eS6Zeq54OB5pWI5p6cXG4gICAgICAgICAgICBpZiAoc2Vjb25kcyA8PSA1ICYmIHNlY29uZHMgPiAwKSB7XG4gICAgICAgICAgICAgICAgY2MudHdlZW4odGhpcy5fY291bnRkb3duTnVtYmVyTm9kZSlcbiAgICAgICAgICAgICAgICAgICAgLnRvKDAuMSwgeyBzY2FsZTogMS4yIH0pXG4gICAgICAgICAgICAgICAgICAgIC50bygwLjEsIHsgc2NhbGU6IDEuMCB9KVxuICAgICAgICAgICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOWPmOe6olxuICAgICAgICAgICAgICAgIHRoaXMuX2NvdW50ZG93bk51bWJlck5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAxMDAsIDEwMClcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY291bnRkb3duTnVtYmVyTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5YGc5q2i56ue5oqA5Zy65YCS6K6h5pe2XG4gICAgICovXG4gICAgX3N0b3BBcmVuYUNvdW50ZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOWBnOatouacrOWcsOWAkuiuoeaXtuWumuaXtuWZqFxuICAgICAgICBpZiAodGhpcy5fbG9jYWxBcmVuYUNvdW50ZG93blRpbWVyKSB7XG4gICAgICAgICAgICB0aGlzLnVuc2NoZWR1bGUodGhpcy5fbG9jYWxBcmVuYUNvdW50ZG93blRpY2spXG4gICAgICAgICAgICB0aGlzLl9sb2NhbEFyZW5hQ291bnRkb3duVGltZXIgPSBudWxsXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW19zdG9wQXJlbmFDb3VudGRvd25dIOW3suWBnOatouacrOWcsOWAkuiuoeaXtlwiKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDph43nva7lgJLorqHml7bnp5LmlbBcbiAgICAgICAgdGhpcy5fYXJlbmFDb3VudGRvd25TZWNvbmRzID0gMFxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeaYvuekuuernuaKgOWcuuiHquWKqOWHhuWkh+a2iOaBr1xuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlIC0g5raI5oGv5YaF5a65XG4gICAgICovXG4gICAgX3Nob3dBcmVuYUF1dG9SZWFkeU1lc3NhZ2U6IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgLy8g5pu05paw5YCS6K6h5pe25pi+56S65Li66Ieq5Yqo5YeG5aSH5raI5oGvXG4gICAgICAgIGlmICh0aGlzLl9jb3VudGRvd25MYWJlbE5vZGUpIHtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IHRoaXMuX2NvdW50ZG93bkxhYmVsTm9kZS5nZXRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5zdHJpbmcgPSBtZXNzYWdlIHx8IFwi57O757uf5bey6Ieq5Yqo5YeG5aSHXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6ZqQ6JeP5pWw5a2XXG4gICAgICAgIGlmICh0aGlzLl9jb3VudGRvd25OdW1iZXJOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9jb3VudGRvd25OdW1iZXJOb2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+PhuOAkOernuaKgOWcuuOAkeWkhOeQhuernuaKgOWcuueKtuaAgeabtOaWsFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0geyByb29tX2NhdGVnb3J5LCByb3VuZCwgdG90YWxfcm91bmRzLCBtYXRjaF9jb2luLCAuLi4gfVxuICAgICAqL1xuICAgIF9vbkNvbXBldGl0aW9uU3RhdHVzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9pc0NvbXBldGl0aW9uID0gKGRhdGEucm9vbV9jYXRlZ29yeSA9PT0gMilcbiAgICAgICAgdGhpcy5fcm9vbUNhdGVnb3J5ID0gZGF0YS5yb29tX2NhdGVnb3J5IHx8IDFcbiAgICAgICAgdGhpcy5fY29tcGV0aXRpb25Sb3VuZCA9IGRhdGEucm91bmQgfHwgMFxuICAgICAgICB0aGlzLl9jb21wZXRpdGlvblRvdGFsUm91bmRzID0gZGF0YS50b3RhbF9yb3VuZHMgfHwgMFxuICAgICAgICB0aGlzLl9tYXRjaENvaW4gPSBkYXRhLm1hdGNoX2NvaW4gfHwgMFxuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5piv56ue5oqA5Zy65qih5byP77yM5pi+56S65q+U6LWb6YeR5biBXG4gICAgICAgIGlmICh0aGlzLl9pc0NvbXBldGl0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93TWF0Y2hDb2luRGlzcGxheSgpXG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflZDjgJDnq57mioDlnLrjgJHlpITnkIbnq57mioDlnLrlgJLorqHml7ZcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIHsgY291bnRkb3duLCBtZXNzYWdlIH1cbiAgICAgKi9cbiAgICBfb25Db21wZXRpdGlvbkNvdW50ZG93bjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBcbiAgICAgICAgdGhpcy5fY29tcGV0aXRpb25Db3VudGRvd24gPSBkYXRhLmNvdW50ZG93biB8fCAxNVxuICAgICAgICBcbiAgICAgICAgLy8g5YGc5q2i5LmL5YmN55qE5YCS6K6h5pe2XG4gICAgICAgIGlmICh0aGlzLl9jb21wZXRpdGlvbkNvdW50ZG93blRpbWVyKSB7XG4gICAgICAgICAgICB0aGlzLnVuc2NoZWR1bGUodGhpcy5fY29tcGV0aXRpb25Db3VudGRvd25UaWNrKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlvIDlp4vmlrDnmoTlgJLorqHml7ZcbiAgICAgICAgdGhpcy5zY2hlZHVsZSh0aGlzLl9jb21wZXRpdGlvbkNvdW50ZG93blRpY2ssIDEpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5WQ44CQ56ue5oqA5Zy644CR56ue5oqA5Zy65YCS6K6h5pe2VGlja1xuICAgICAqL1xuICAgIF9jb21wZXRpdGlvbkNvdW50ZG93blRpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fY29tcGV0aXRpb25Db3VudGRvd24gPD0gMCkge1xuICAgICAgICAgICAgdGhpcy51bnNjaGVkdWxlKHRoaXMuX2NvbXBldGl0aW9uQ291bnRkb3duVGljaylcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9jb21wZXRpdGlvbkNvdW50ZG93bi0tXG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDlgJLorqHml7bmmL7npLpcbiAgICAgICAgdGhpcy5fdXBkYXRlQ29tcGV0aXRpb25Db3VudGRvd25EaXNwbGF5KClcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflZDjgJDnq57mioDlnLrjgJHmm7TmlrDnq57mioDlnLrlgJLorqHml7bmmL7npLpcbiAgICAgKi9cbiAgICBfdXBkYXRlQ29tcGV0aXRpb25Db3VudGRvd25EaXNwbGF5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g5aaC5p6c5pyJ57uT566X5by556qX77yM5pu05paw5YW25Lit55qE5YCS6K6h5pe2XG4gICAgICAgIGlmICh0aGlzLl9nYW1lUmVzdWx0UG9wdXApIHtcbiAgICAgICAgICAgIHZhciBjb3VudGRvd25MYWJlbCA9IHRoaXMuX2dhbWVSZXN1bHRQb3B1cC5nZXRDaGlsZEJ5TmFtZShcIkNvbXBldGl0aW9uQ291bnRkb3duXCIpXG4gICAgICAgICAgICBpZiAoY291bnRkb3duTGFiZWwgJiYgY291bnRkb3duTGFiZWwuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKSkge1xuICAgICAgICAgICAgICAgIGNvdW50ZG93bkxhYmVsLmdldENvbXBvbmVudChjYy5MYWJlbCkuc3RyaW5nID0gXCLkuIvkuIDlsYDlvIDlp4sgXCIgKyB0aGlzLl9jb21wZXRpdGlvbkNvdW50ZG93biArIFwi56eSXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+qmeOAkOernuaKgOWcuuOAkeWkhOeQhuavlOi1m+mHkeW4geabtOaWsFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0geyBwbGF5ZXJfaWQsIG1hdGNoX2NvaW4sIGRlbHRhIH1cbiAgICAgKi9cbiAgICBfb25NYXRjaENvaW5VcGRhdGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIGlmICghbXlnbG9iYWwpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgdmFyIG15UGxheWVySWQgPSBteWdsb2JhbC5zb2NrZXQuZ2V0UGxheWVySW5mbygpLmlkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEuc2VydmVyUGxheWVySWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SURcbiAgICAgICAgXG4gICAgICAgIC8vIOWPquabtOaWsOiHquW3seeahOavlOi1m+mHkeW4gVxuICAgICAgICBpZiAoU3RyaW5nKGRhdGEucGxheWVyX2lkKSA9PT0gU3RyaW5nKG15UGxheWVySWQpKSB7XG4gICAgICAgICAgICB0aGlzLl9tYXRjaENvaW4gPSBkYXRhLm1hdGNoX2NvaW5cbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZU1hdGNoQ29pbkRpc3BsYXkoZGF0YS5tYXRjaF9jb2luLCBkYXRhLmRlbHRhKVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn6qZ44CQ56ue5oqA5Zy644CR5pi+56S65q+U6LWb6YeR5biB5pi+56S6XG4gICAgICovXG4gICAgX3Nob3dNYXRjaENvaW5EaXNwbGF5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm5bey5a2Y5Zyo5q+U6LWb6YeR5biB5pi+56S66IqC54K5XG4gICAgICAgIGlmICh0aGlzLl9tYXRjaENvaW5Ob2RlKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAoIW15Z2xvYmFsKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIC8vIOWIm+W7uuavlOi1m+mHkeW4geaYvuekuuiKgueCuVxuICAgICAgICB2YXIgbWF0Y2hDb2luTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTWF0Y2hDb2luRGlzcGxheVwiKVxuICAgICAgICBtYXRjaENvaW5Ob2RlLnNldFBvc2l0aW9uKC0yMDAsIDI4MCkgIC8vIOW3puS4iuinkuS9jee9rlxuICAgICAgICBcbiAgICAgICAgLy8g6IOM5pmvXG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkJnXCIpXG4gICAgICAgIHZhciBiZyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGJnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig1MCwgNDAsIDgwLCAyMDApXG4gICAgICAgIGJnLnJvdW5kUmVjdCgtODAsIC0yMCwgMTYwLCA0MCwgMTApXG4gICAgICAgIGJnLmZpbGwoKVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gbWF0Y2hDb2luTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5Zu+5qCH77yI6YeR5biB5Zu+5qCH77yJXG4gICAgICAgIHZhciBpY29uTm9kZSA9IG5ldyBjYy5Ob2RlKFwiSWNvblwiKVxuICAgICAgICB2YXIgaWNvbkxhYmVsID0gaWNvbk5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBpY29uTGFiZWwuc3RyaW5nID0gXCLwn6qZXCJcbiAgICAgICAgaWNvbkxhYmVsLmZvbnRTaXplID0gMjBcbiAgICAgICAgaWNvbk5vZGUuc2V0UG9zaXRpb24oLTU1LCAwKVxuICAgICAgICBpY29uTm9kZS5wYXJlbnQgPSBtYXRjaENvaW5Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmoIfnrb5cbiAgICAgICAgdmFyIGxhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIilcbiAgICAgICAgdmFyIGxhYmVsID0gbGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgbGFiZWwuc3RyaW5nID0gXCLmr5TotZvph5HluIFcIlxuICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDE0XG4gICAgICAgIGxhYmVsTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyMDAsIDIwMCwgMjAwKVxuICAgICAgICBsYWJlbE5vZGUuc2V0UG9zaXRpb24oLTIwLCAwKVxuICAgICAgICBsYWJlbE5vZGUucGFyZW50ID0gbWF0Y2hDb2luTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5pWw5YC8XG4gICAgICAgIHZhciB2YWx1ZU5vZGUgPSBuZXcgY2MuTm9kZShcIlZhbHVlXCIpXG4gICAgICAgIHZhbHVlTm9kZS5uYW1lID0gXCJNYXRjaENvaW5WYWx1ZVwiXG4gICAgICAgIHZhciB2YWx1ZUxhYmVsID0gdmFsdWVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdmFsdWVMYWJlbC5zdHJpbmcgPSBTdHJpbmcodGhpcy5fbWF0Y2hDb2luKVxuICAgICAgICB2YWx1ZUxhYmVsLmZvbnRTaXplID0gMThcbiAgICAgICAgdmFsdWVOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjIwLCAxMDApXG4gICAgICAgIHZhbHVlTm9kZS5zZXRQb3NpdGlvbig0NSwgMClcbiAgICAgICAgdmFsdWVOb2RlLnBhcmVudCA9IG1hdGNoQ29pbk5vZGVcbiAgICAgICAgXG4gICAgICAgIG1hdGNoQ29pbk5vZGUucGFyZW50ID0gdGhpcy5ub2RlXG4gICAgICAgIHRoaXMuX21hdGNoQ29pbk5vZGUgPSBtYXRjaENvaW5Ob2RlXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn6qZ44CQ56ue5oqA5Zy644CR5pu05paw5q+U6LWb6YeR5biB5pi+56S6XG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG1hdGNoQ29pbiAtIOaWsOeahOavlOi1m+mHkeW4geaVsOmHj1xuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBkZWx0YSAtIOWPmOWMlumHj1xuICAgICAqL1xuICAgIF91cGRhdGVNYXRjaENvaW5EaXNwbGF5OiBmdW5jdGlvbihtYXRjaENvaW4sIGRlbHRhKSB7XG4gICAgICAgIGlmICh0aGlzLl9tYXRjaENvaW5Ob2RlKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWVOb2RlID0gdGhpcy5fbWF0Y2hDb2luTm9kZS5nZXRDaGlsZEJ5TmFtZShcIk1hdGNoQ29pblZhbHVlXCIpXG4gICAgICAgICAgICBpZiAodmFsdWVOb2RlICYmIHZhbHVlTm9kZS5nZXRDb21wb25lbnQoY2MuTGFiZWwpKSB7XG4gICAgICAgICAgICAgICAgdmFsdWVOb2RlLmdldENvbXBvbmVudChjYy5MYWJlbCkuc3RyaW5nID0gU3RyaW5nKG1hdGNoQ29pbilcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzmnInlop7ph4/vvIzmmL7npLrliqjnlLtcbiAgICAgICAgICAgICAgICBpZiAoZGVsdGEgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2hvd01hdGNoQ29pbkRlbHRhQW5pbWF0aW9uKGRlbHRhKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+qmeOAkOernuaKgOWcuuOAkeaYvuekuuavlOi1m+mHkeW4geWPmOWMluWKqOeUu1xuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBkZWx0YSAtIOWPmOWMlumHj1xuICAgICAqL1xuICAgIF9zaG93TWF0Y2hDb2luRGVsdGFBbmltYXRpb246IGZ1bmN0aW9uKGRlbHRhKSB7XG4gICAgICAgIGlmICghdGhpcy5fbWF0Y2hDb2luTm9kZSkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7rlj5jljJbph4/mmL7npLroioLngrlcbiAgICAgICAgdmFyIGRlbHRhTm9kZSA9IG5ldyBjYy5Ob2RlKFwiRGVsdGFcIilcbiAgICAgICAgdmFyIGRlbHRhTGFiZWwgPSBkZWx0YU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBkZWx0YUxhYmVsLnN0cmluZyA9IChkZWx0YSA+PSAwID8gXCIrXCIgOiBcIlwiKSArIGRlbHRhXG4gICAgICAgIGRlbHRhTGFiZWwuZm9udFNpemUgPSAyNFxuICAgICAgICBkZWx0YU5vZGUuY29sb3IgPSBkZWx0YSA+PSAwID8gbmV3IGNjLkNvbG9yKDEwMCwgMjU1LCAxMDApIDogbmV3IGNjLkNvbG9yKDI1NSwgMTAwLCAxMDApXG4gICAgICAgIGRlbHRhTm9kZS5zZXRQb3NpdGlvbig4MCwgMClcbiAgICAgICAgZGVsdGFOb2RlLnBhcmVudCA9IHRoaXMuX21hdGNoQ29pbk5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOmjmOWtl+WKqOeUu1xuICAgICAgICBjYy50d2VlbihkZWx0YU5vZGUpXG4gICAgICAgICAgICAudG8oMC41LCB7IHk6IDMwLCBvcGFjaXR5OiAyNTUgfSlcbiAgICAgICAgICAgIC50bygwLjUsIHsgeTogNTAsIG9wYWNpdHk6IDAgfSlcbiAgICAgICAgICAgIC5jYWxsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGRlbHRhTm9kZS5kZXN0cm95KClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhcnQoKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+qmeOAkOernuaKgOWcuuOAkemakOiXj+avlOi1m+mHkeW4geaYvuekulxuICAgICAqL1xuICAgIF9oaWRlTWF0Y2hDb2luRGlzcGxheTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9tYXRjaENvaW5Ob2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9tYXRjaENvaW5Ob2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgdGhpcy5fbWF0Y2hDb2luTm9kZSA9IG51bGxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog4p2M44CQ56ue5oqA5Zy644CR5aSE55CG5reY5rGw6YCa55+lXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSB7IHJhbmssIHJlYXNvbiwgdG90YWxfcGxheWVycywgcmV3YXJkcyB9XG4gICAgICovXG4gICAgX29uQ29tcGV0aXRpb25FbGltaW5hdGVkOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIFxuICAgICAgICAvLyDlgZzmraLmiYDmnInlgJLorqHml7ZcbiAgICAgICAgdGhpcy5fc3RvcFBsYXlDb3VudGRvd24oKVxuICAgICAgICB0aGlzLl9zdG9wQmlkQ291bnRkb3duKClcbiAgICAgICAgXG4gICAgICAgIC8vIOmakOiXj+avlOi1m+mHkeW4geaYvuekulxuICAgICAgICB0aGlzLl9oaWRlTWF0Y2hDb2luRGlzcGxheSgpXG4gICAgICAgIFxuICAgICAgICAvLyDmmL7npLrmt5jmsbDlvLnnqpdcbiAgICAgICAgdGhpcy5fc2hvd0VsaW1pbmF0ZWRQb3B1cChkYXRhKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog4p2M44CQ56ue5oqA5Zy644CR5pi+56S65reY5rGw5by556qXXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSB7IHJhbmssIHJlYXNvbiwgdG90YWxfcGxheWVycywgcmV3YXJkcyB9XG4gICAgICovXG4gICAgX3Nob3dFbGltaW5hdGVkUG9wdXA6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHZhciB3aW5TaXplID0gY2Mud2luU2l6ZVxuICAgICAgICBcbiAgICAgICAgdmFyIGNhbnZhcyA9IGNjLmZpbmQoXCJDYW52YXNcIikgfHwgY2MuZmluZChcIlVJX1JPT1RcIikgfHwgdGhpcy5ub2RlLnBhcmVudFxuICAgICAgICBpZiAoIWNhbnZhcykgY2FudmFzID0gdGhpcy5ub2RlXG4gICAgICAgIFxuICAgICAgICAvLyDpga7nvanlsYJcbiAgICAgICAgdmFyIG1hc2tOb2RlID0gbmV3IGNjLk5vZGUoXCJFbGltaW5hdGVkTWFza1wiKVxuICAgICAgICBtYXNrTm9kZS5hZGRDb21wb25lbnQoY2MuQmxvY2tJbnB1dEV2ZW50cylcbiAgICAgICAgbWFza05vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMCwgMCwgMClcbiAgICAgICAgbWFza05vZGUub3BhY2l0eSA9IDE4MFxuICAgICAgICBtYXNrTm9kZS53aWR0aCA9IHdpblNpemUud2lkdGggKiAyXG4gICAgICAgIG1hc2tOb2RlLmhlaWdodCA9IHdpblNpemUuaGVpZ2h0ICogMlxuICAgICAgICBtYXNrTm9kZS56SW5kZXggPSA5OTlcbiAgICAgICAgbWFza05vZGUucGFyZW50ID0gY2FudmFzXG4gICAgICAgIFxuICAgICAgICAvLyDlvLnnqpflrrnlmahcbiAgICAgICAgdmFyIHBvcHVwTm9kZSA9IG5ldyBjYy5Ob2RlKFwiRWxpbWluYXRlZFBvcHVwXCIpXG4gICAgICAgIHBvcHVwTm9kZS5zY2FsZSA9IDAuNVxuICAgICAgICBwb3B1cE5vZGUub3BhY2l0eSA9IDBcbiAgICAgICAgcG9wdXBOb2RlLnpJbmRleCA9IDEwMDBcbiAgICAgICAgcG9wdXBOb2RlLnBhcmVudCA9IGNhbnZhc1xuICAgICAgICBcbiAgICAgICAgdmFyIHBvcHVwV2lkdGggPSA0MDBcbiAgICAgICAgdmFyIHBvcHVwSGVpZ2h0ID0gMzUwXG4gICAgICAgIFxuICAgICAgICAvLyDog4zmma9cbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmdcIilcbiAgICAgICAgdmFyIGJnID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgYmcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDYwLCA0MCwgNTAsIDI0MClcbiAgICAgICAgYmcucm91bmRSZWN0KC1wb3B1cFdpZHRoLzIsIC1wb3B1cEhlaWdodC8yLCBwb3B1cFdpZHRoLCBwb3B1cEhlaWdodCwgMjApXG4gICAgICAgIGJnLmZpbGwoKVxuICAgICAgICBiZy5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigxNTAsIDEwMCwgMTAwKVxuICAgICAgICBiZy5saW5lV2lkdGggPSAzXG4gICAgICAgIGJnLnJvdW5kUmVjdCgtcG9wdXBXaWR0aC8yLCAtcG9wdXBIZWlnaHQvMiwgcG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQsIDIwKVxuICAgICAgICBiZy5zdHJva2UoKVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmoIfpophcbiAgICAgICAgdmFyIHRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIilcbiAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB0aXRsZUxhYmVsLnN0cmluZyA9IFwi4p2MIOavlOi1m+e7k+adnyDinYxcIlxuICAgICAgICB0aXRsZUxhYmVsLmZvbnRTaXplID0gMzJcbiAgICAgICAgdGl0bGVOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMTUwLCAxNTApXG4gICAgICAgIHRpdGxlTm9kZS55ID0gcG9wdXBIZWlnaHQvMiAtIDUwXG4gICAgICAgIHRpdGxlTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOaOkuWQjVxuICAgICAgICB2YXIgcmFua05vZGUgPSBuZXcgY2MuTm9kZShcIlJhbmtcIilcbiAgICAgICAgdmFyIHJhbmtMYWJlbCA9IHJhbmtOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgcmFua0xhYmVsLnN0cmluZyA9IFwi5pyA57uI5o6S5ZCNOiDnrKwgXCIgKyBkYXRhLnJhbmsgKyBcIiDlkI1cIlxuICAgICAgICByYW5rTGFiZWwuZm9udFNpemUgPSAyNFxuICAgICAgICByYW5rTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIyMCwgMTUwKVxuICAgICAgICByYW5rTm9kZS55ID0gcG9wdXBIZWlnaHQvMiAtIDEwMFxuICAgICAgICByYW5rTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOa3mOaxsOWOn+WboFxuICAgICAgICB2YXIgcmVhc29uTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUmVhc29uXCIpXG4gICAgICAgIHZhciByZWFzb25MYWJlbCA9IHJlYXNvbk5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICByZWFzb25MYWJlbC5zdHJpbmcgPSBkYXRhLnJlYXNvbiB8fCBcIuavlOi1m+WkseWIqVwiXG4gICAgICAgIHJlYXNvbkxhYmVsLmZvbnRTaXplID0gMThcbiAgICAgICAgcmVhc29uTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyMDAsIDIwMCwgMjAwKVxuICAgICAgICByZWFzb25Ob2RlLnkgPSBwb3B1cEhlaWdodC8yIC0gMTQwXG4gICAgICAgIHJlYXNvbk5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDlj4LotZvkurrmlbBcbiAgICAgICAgdmFyIHRvdGFsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVG90YWxcIilcbiAgICAgICAgdmFyIHRvdGFsTGFiZWwgPSB0b3RhbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB0b3RhbExhYmVsLnN0cmluZyA9IFwi5YWxIFwiICsgKGRhdGEudG90YWxfcGxheWVycyB8fCAwKSArIFwiIOS6uuWPgui1m1wiXG4gICAgICAgIHRvdGFsTGFiZWwuZm9udFNpemUgPSAxNlxuICAgICAgICB0b3RhbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMTgwLCAxODAsIDE4MClcbiAgICAgICAgdG90YWxOb2RlLnkgPSBwb3B1cEhlaWdodC8yIC0gMTgwXG4gICAgICAgIHRvdGFsTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOWlluWKse+8iOWmguaenOacie+8iVxuICAgICAgICBpZiAoZGF0YS5yZXdhcmRzKSB7XG4gICAgICAgICAgICB2YXIgcmV3YXJkTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUmV3YXJkXCIpXG4gICAgICAgICAgICB2YXIgcmV3YXJkTGFiZWwgPSByZXdhcmROb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgIHJld2FyZExhYmVsLnN0cmluZyA9IFwi6I635b6X5aWW5YqxOiBcIiArIChkYXRhLnJld2FyZHMubmFtZSB8fCBKU09OLnN0cmluZ2lmeShkYXRhLnJld2FyZHMpKVxuICAgICAgICAgICAgcmV3YXJkTGFiZWwuZm9udFNpemUgPSAxOFxuICAgICAgICAgICAgcmV3YXJkTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIwMCwgMTAwKVxuICAgICAgICAgICAgcmV3YXJkTm9kZS55ID0gcG9wdXBIZWlnaHQvMiAtIDIyMFxuICAgICAgICAgICAgcmV3YXJkTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6L+U5Zue5aSn5Y6F5oyJ6ZKuXG4gICAgICAgIHZhciBidG5Ob2RlID0gbmV3IGNjLk5vZGUoXCJSZXR1cm5CdG5cIilcbiAgICAgICAgYnRuTm9kZS5zZXRDb250ZW50U2l6ZSgyMDAsIDUwKVxuICAgICAgICBidG5Ob2RlLmFkZENvbXBvbmVudChjYy5CbG9ja0lucHV0RXZlbnRzKVxuICAgICAgICB2YXIgYnRuQmcgPSBidG5Ob2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgYnRuQmcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDEwMCwgODAsIDE0MClcbiAgICAgICAgYnRuQmcucm91bmRSZWN0KC0xMDAsIC0yNSwgMjAwLCA1MCwgMjUpXG4gICAgICAgIGJ0bkJnLmZpbGwoKVxuICAgICAgICBidG5Ob2RlLnkgPSAtcG9wdXBIZWlnaHQvMiArIDUwXG4gICAgICAgIGJ0bk5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICB2YXIgYnRuTGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJMYWJlbFwiKVxuICAgICAgICB2YXIgYnRuTGFiZWwgPSBidG5MYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBidG5MYWJlbC5zdHJpbmcgPSBcIui/lOWbnuWkp+WOhVwiXG4gICAgICAgIGJ0bkxhYmVsLmZvbnRTaXplID0gMjJcbiAgICAgICAgYnRuTGFiZWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIGJ0bkxhYmVsTm9kZS5wYXJlbnQgPSBidG5Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDngrnlh7vkuovku7ZcbiAgICAgICAgYnRuTm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8g6ZSA5q+B5by556qXXG4gICAgICAgICAgICBwb3B1cE5vZGUuZGVzdHJveSgpXG4gICAgICAgICAgICBtYXNrTm9kZS5kZXN0cm95KClcbiAgICAgICAgICAgIC8vIOi/lOWbnuWkp+WOhVxuICAgICAgICAgICAgc2VsZi5fcmV0dXJuVG9Mb2JieSgpXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICAvLyDlvLnlh7rliqjnlLtcbiAgICAgICAgY2MudHdlZW4ocG9wdXBOb2RlKVxuICAgICAgICAgICAgLnRvKDAuMywgeyBzY2FsZTogMSwgb3BhY2l0eTogMjU1IH0sIHsgZWFzaW5nOiAnYmFja091dCcgfSlcbiAgICAgICAgICAgIC5zdGFydCgpXG4gICAgICAgIFxuICAgICAgICB0aGlzLl9lbGltaW5hdGVkUG9wdXAgPSBwb3B1cE5vZGVcbiAgICAgICAgdGhpcy5fZWxpbWluYXRlZE1hc2sgPSBtYXNrTm9kZVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog4qyG77iP44CQ56ue5oqA5Zy644CR5aSE55CG5pmL57qn6YCa55+lXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSB7IGN1cnJlbnRfcm91bmQsIHRvdGFsX3JvdW5kcywgbWF0Y2hfY29pbiwgbWVzc2FnZSB9XG4gICAgICovXG4gICAgX29uQ29tcGV0aXRpb25BZHZhbmNlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9jb21wZXRpdGlvblJvdW5kID0gZGF0YS5jdXJyZW50X3JvdW5kXG4gICAgICAgIHRoaXMuX21hdGNoQ29pbiA9IGRhdGEubWF0Y2hfY29pblxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw5q+U6LWb6YeR5biB5pi+56S6XG4gICAgICAgIHRoaXMuX3VwZGF0ZU1hdGNoQ29pbkRpc3BsYXkoZGF0YS5tYXRjaF9jb2luLCAwKVxuICAgICAgICBcbiAgICAgICAgLy8g5pi+56S65pmL57qn5o+Q56S6XG4gICAgICAgIHRoaXMuX3Nob3dBZHZhbmNlVG9hc3QoZGF0YSlcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOKshu+4j+OAkOernuaKgOWcuuOAkeaYvuekuuaZi+e6p+aPkOekulxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0geyBjdXJyZW50X3JvdW5kLCB0b3RhbF9yb3VuZHMsIG1hdGNoX2NvaW4sIG1lc3NhZ2UgfVxuICAgICAqL1xuICAgIF9zaG93QWR2YW5jZVRvYXN0OiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB2YXIgd2luU2l6ZSA9IGNjLndpblNpemVcbiAgICAgICAgXG4gICAgICAgIC8vIOWIm+W7ulRvYXN06IqC54K5XG4gICAgICAgIHZhciB0b2FzdE5vZGUgPSBuZXcgY2MuTm9kZShcIkFkdmFuY2VUb2FzdFwiKVxuICAgICAgICB0b2FzdE5vZGUuc2V0UG9zaXRpb24oMCwgMTAwKVxuICAgICAgICB0b2FzdE5vZGUub3BhY2l0eSA9IDBcbiAgICAgICAgdG9hc3ROb2RlLnpJbmRleCA9IDIwMDBcbiAgICAgICAgdG9hc3ROb2RlLnBhcmVudCA9IHRoaXMubm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g6IOM5pmvXG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkJnXCIpXG4gICAgICAgIHZhciBiZyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGJnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig1MCwgMTAwLCA1MCwgMjIwKVxuICAgICAgICBiZy5yb3VuZFJlY3QoLTE1MCwgLTI1LCAzMDAsIDUwLCAyNSlcbiAgICAgICAgYmcuZmlsbCgpXG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSB0b2FzdE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOaWh+Wtl1xuICAgICAgICB2YXIgbGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJMYWJlbFwiKVxuICAgICAgICB2YXIgbGFiZWwgPSBsYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBsYWJlbC5zdHJpbmcgPSBcIvCfjokg5pmL57qn5oiQ5Yqf77yB56ysIFwiICsgZGF0YS5jdXJyZW50X3JvdW5kICsgXCIvXCIgKyBkYXRhLnRvdGFsX3JvdW5kcyArIFwiIOi9rlwiXG4gICAgICAgIGxhYmVsLmZvbnRTaXplID0gMjJcbiAgICAgICAgbGFiZWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyMDApXG4gICAgICAgIGxhYmVsTm9kZS5wYXJlbnQgPSB0b2FzdE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOWKqOeUu1xuICAgICAgICBjYy50d2Vlbih0b2FzdE5vZGUpXG4gICAgICAgICAgICAudG8oMC4zLCB7IG9wYWNpdHk6IDI1NSB9KVxuICAgICAgICAgICAgLmRlbGF5KDIpXG4gICAgICAgICAgICAudG8oMC4zLCB7IG9wYWNpdHk6IDAgfSlcbiAgICAgICAgICAgIC5jYWxsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRvYXN0Tm9kZS5kZXN0cm95KClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhcnQoKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+PhuOAkOernuaKgOWcuuOAkeWkhOeQhuWGoOWGm+W8ueeql1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0geyByYW5rLCByZXdhcmRzLCByZXdhcmRfdHlwZSwgcmFua2luZ3MsIG1hdGNoX2NvaW4gfVxuICAgICAqL1xuICAgIF9vbkNvbXBldGl0aW9uQ2hhbXBpb246IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIOWBnOatouaJgOacieWAkuiuoeaXtlxuICAgICAgICB0aGlzLl9zdG9wUGxheUNvdW50ZG93bigpXG4gICAgICAgIHRoaXMuX3N0b3BCaWRDb3VudGRvd24oKVxuICAgICAgICBcbiAgICAgICAgLy8g6ZqQ6JeP5q+U6LWb6YeR5biB5pi+56S6XG4gICAgICAgIHRoaXMuX2hpZGVNYXRjaENvaW5EaXNwbGF5KClcbiAgICAgICAgXG4gICAgICAgIC8vIOaYvuekuuWGoOWGm+W8ueeql1xuICAgICAgICB0aGlzLl9zaG93Q2hhbXBpb25Qb3B1cChkYXRhKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+PhuOAkOernuaKgOWcuuOAkeaYvuekuuWGoOWGm+W8ueeql1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0geyByYW5rLCByZXdhcmRzLCByZXdhcmRfdHlwZSwgcmFua2luZ3MsIG1hdGNoX2NvaW4gfVxuICAgICAqIPCflKfjgJDph43mnoTjgJHmmL7npLrlrozmlbTnmoTmjpLlkI3liJfooajvvIjliY0yMOWQje+8ie+8jOWMheaLrOWGoOWGm+OAgeS6muWGm+OAgeWto+WGm1xuICAgICAqL1xuICAgIF9zaG93Q2hhbXBpb25Qb3B1cDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgdmFyIHdpblNpemUgPSBjYy53aW5TaXplXG4gICAgICAgIFxuICAgICAgICB2YXIgY2FudmFzID0gY2MuZmluZChcIkNhbnZhc1wiKSB8fCBjYy5maW5kKFwiVUlfUk9PVFwiKSB8fCB0aGlzLm5vZGUucGFyZW50XG4gICAgICAgIGlmICghY2FudmFzKSBjYW52YXMgPSB0aGlzLm5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPpl63kuYvliY3nmoTnu5PnrpflvLnnqpfjgJFcbiAgICAgICAgaWYgKHRoaXMuX2dhbWVSZXN1bHRQb3B1cCB8fCB0aGlzLl9nYW1lUmVzdWx0TWFzaykge1xuICAgICAgICAgICAgdGhpcy5fY2xvc2VHYW1lUmVzdWx0UG9wdXAodGhpcy5fZ2FtZVJlc3VsdFBvcHVwLCB0aGlzLl9nYW1lUmVzdWx0TWFzaylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6YGu572p5bGCXG4gICAgICAgIHZhciBtYXNrTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ2hhbXBpb25NYXNrXCIpXG4gICAgICAgIG1hc2tOb2RlLmFkZENvbXBvbmVudChjYy5CbG9ja0lucHV0RXZlbnRzKVxuICAgICAgICBtYXNrTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyMCwgMTUsIDQwKVxuICAgICAgICBtYXNrTm9kZS5vcGFjaXR5ID0gMjIwXG4gICAgICAgIG1hc2tOb2RlLndpZHRoID0gd2luU2l6ZS53aWR0aCAqIDJcbiAgICAgICAgbWFza05vZGUuaGVpZ2h0ID0gd2luU2l6ZS5oZWlnaHQgKiAyXG4gICAgICAgIG1hc2tOb2RlLnpJbmRleCA9IDk5OVxuICAgICAgICBtYXNrTm9kZS5wYXJlbnQgPSBjYW52YXNcbiAgICAgICAgXG4gICAgICAgIC8vIOW8ueeql+WuueWZqFxuICAgICAgICB2YXIgcG9wdXBOb2RlID0gbmV3IGNjLk5vZGUoXCJDaGFtcGlvblBvcHVwXCIpXG4gICAgICAgIHBvcHVwTm9kZS5zY2FsZSA9IDAuNVxuICAgICAgICBwb3B1cE5vZGUub3BhY2l0eSA9IDBcbiAgICAgICAgcG9wdXBOb2RlLnpJbmRleCA9IDEwMDBcbiAgICAgICAgcG9wdXBOb2RlLnBhcmVudCA9IGNhbnZhc1xuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOiwg+aVtOOAkeWinuWkp+W8ueeql+WwuuWvuOS7peWuuee6s+abtOWkmuaOkuWQjVxuICAgICAgICB2YXIgcG9wdXBXaWR0aCA9IDUyMFxuICAgICAgICB2YXIgcG9wdXBIZWlnaHQgPSA2MjBcbiAgICAgICAgXG4gICAgICAgIC8vIOiDjOaZr1xuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCZ1wiKVxuICAgICAgICB2YXIgYmcgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBiZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoNDUsIDM1LCA3MCwgMjQ1KVxuICAgICAgICBiZy5yb3VuZFJlY3QoLXBvcHVwV2lkdGgvMiwgLXBvcHVwSGVpZ2h0LzIsIHBvcHVwV2lkdGgsIHBvcHVwSGVpZ2h0LCAyMClcbiAgICAgICAgYmcuZmlsbCgpXG4gICAgICAgIGJnLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjAwLCA4MClcbiAgICAgICAgYmcubGluZVdpZHRoID0gM1xuICAgICAgICBiZy5yb3VuZFJlY3QoLXBvcHVwV2lkdGgvMiwgLXBvcHVwSGVpZ2h0LzIsIHBvcHVwV2lkdGgsIHBvcHVwSGVpZ2h0LCAyMClcbiAgICAgICAgYmcuc3Ryb2tlKClcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5qCH6aKYXG4gICAgICAgIHZhciB0aXRsZU5vZGUgPSBuZXcgY2MuTm9kZShcIlRpdGxlXCIpXG4gICAgICAgIHZhciB0aXRsZUxhYmVsID0gdGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdGl0bGVMYWJlbC5zdHJpbmcgPSBcIvCfj4Yg5q+U6LWb57uT5p2fIPCfj4ZcIlxuICAgICAgICB0aXRsZUxhYmVsLmZvbnRTaXplID0gMzJcbiAgICAgICAgdGl0bGVMYWJlbC5lbmFibGVCb2xkID0gdHJ1ZVxuICAgICAgICB0aXRsZU5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMjAsIDEwMClcbiAgICAgICAgdGl0bGVOb2RlLnkgPSBwb3B1cEhlaWdodC8yIC0gNDBcbiAgICAgICAgdGl0bGVOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeWJjeS4ieWQjeWxleekuuWMulxuICAgICAgICB2YXIgcmFua2luZ3MgPSBkYXRhLnJhbmtpbmdzIHx8IFtdXG4gICAgICAgIHZhciB0b3BUaHJlZVkgPSBwb3B1cEhlaWdodC8yIC0gOTBcbiAgICAgICAgXG4gICAgICAgIGlmIChyYW5raW5ncy5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgLy8g5Yag5YabXG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVSYW5raW5nSXRlbShwb3B1cE5vZGUsIHJhbmtpbmdzWzBdLCAxLCAtMTIwLCB0b3BUaHJlZVkpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJhbmtpbmdzLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgICAvLyDkuprlhptcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVJhbmtpbmdJdGVtKHBvcHVwTm9kZSwgcmFua2luZ3NbMV0sIDIsIDAsIHRvcFRocmVlWSAtIDIwKVxuICAgICAgICB9XG4gICAgICAgIGlmIChyYW5raW5ncy5sZW5ndGggPj0gMykge1xuICAgICAgICAgICAgLy8g5a2j5YabXG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVSYW5raW5nSXRlbShwb3B1cE5vZGUsIHJhbmtpbmdzWzJdLCAzLCAxMjAsIHRvcFRocmVlWSAtIDQwKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5YW25LuW5o6S5ZCN5YiX6KGo5qCH6aKYXG4gICAgICAgIGlmIChyYW5raW5ncy5sZW5ndGggPiAzKSB7XG4gICAgICAgICAgICB2YXIgb3RoZXJUaXRsZU5vZGUgPSBuZXcgY2MuTm9kZShcIk90aGVyVGl0bGVcIilcbiAgICAgICAgICAgIHZhciBvdGhlclRpdGxlTGFiZWwgPSBvdGhlclRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICBvdGhlclRpdGxlTGFiZWwuc3RyaW5nID0gXCLigJTigJQg5YW25LuW5o6S5ZCNIOKAlOKAlFwiXG4gICAgICAgICAgICBvdGhlclRpdGxlTGFiZWwuZm9udFNpemUgPSAxOFxuICAgICAgICAgICAgb3RoZXJUaXRsZU5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMTgwLCAxODAsIDIwMClcbiAgICAgICAgICAgIG90aGVyVGl0bGVOb2RlLnkgPSB0b3BUaHJlZVkgLSAxMDBcbiAgICAgICAgICAgIG90aGVyVGl0bGVOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5YW25LuW5o6S5ZCN5YiX6KGo77yI56ysNC0yMOWQje+8iVxuICAgICAgICAgICAgdmFyIHN0YXJ0WSA9IHRvcFRocmVlWSAtIDEzMFxuICAgICAgICAgICAgdmFyIG1heE90aGVyUmFua2luZ3MgPSBNYXRoLm1pbihyYW5raW5ncy5sZW5ndGgsIDIwKVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDM7IGkgPCBtYXhPdGhlclJhbmtpbmdzOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcmFua0luZm8gPSByYW5raW5nc1tpXVxuICAgICAgICAgICAgICAgIHZhciByYW5rSXRlbU5vZGUgPSBuZXcgY2MuTm9kZShcIlJhbmtJdGVtX1wiICsgaSlcbiAgICAgICAgICAgICAgICB2YXIgcmFua0l0ZW1MYWJlbCA9IHJhbmtJdGVtTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICAgICAgcmFua0l0ZW1MYWJlbC5zdHJpbmcgPSBcIuesrFwiICsgcmFua0luZm8ucmFuayArIFwi5ZCNOiBcIiArIHJhbmtJbmZvLnBsYXllcl9uYW1lICsgXCIgIOmHkeW4gTogXCIgKyByYW5rSW5mby5tYXRjaF9jb2luXG4gICAgICAgICAgICAgICAgcmFua0l0ZW1MYWJlbC5mb250U2l6ZSA9IDE2XG4gICAgICAgICAgICAgICAgcmFua0l0ZW1Ob2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDIwMCwgMjAwLCAyMTApXG4gICAgICAgICAgICAgICAgcmFua0l0ZW1Ob2RlLnkgPSBzdGFydFkgLSAoaSAtIDMpICogMjRcbiAgICAgICAgICAgICAgICByYW5rSXRlbU5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOaMiemSruWMuuWfn1xuICAgICAgICB2YXIgYnRuWSA9IC1wb3B1cEhlaWdodC8yICsgNTBcbiAgICAgICAgXG4gICAgICAgIC8vIOehruWumuaMiemSrlxuICAgICAgICB2YXIgY29uZmlybUJ0biA9IG5ldyBjYy5Ob2RlKFwiQ29uZmlybUJ0blwiKVxuICAgICAgICBjb25maXJtQnRuLnNldENvbnRlbnRTaXplKDE4MCwgNDUpXG4gICAgICAgIGNvbmZpcm1CdG4uYWRkQ29tcG9uZW50KGNjLkJsb2NrSW5wdXRFdmVudHMpXG4gICAgICAgIHZhciBjb25maXJtQmcgPSBjb25maXJtQnRuLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgY29uZmlybUJnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcigyMDAsIDE1MCwgNTApXG4gICAgICAgIGNvbmZpcm1CZy5yb3VuZFJlY3QoLTkwLCAtMjIuNSwgMTgwLCA0NSwgMjIpXG4gICAgICAgIGNvbmZpcm1CZy5maWxsKClcbiAgICAgICAgY29uZmlybUJ0bi55ID0gYnRuWVxuICAgICAgICBjb25maXJtQnRuLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgdmFyIGNvbmZpcm1MYWJlbE5vZGUgPSBuZXcgY2MuTm9kZShcIkxhYmVsXCIpXG4gICAgICAgIHZhciBjb25maXJtTGFiZWwgPSBjb25maXJtTGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgY29uZmlybUxhYmVsLnN0cmluZyA9IFwi6L+U5Zue5aSn5Y6FXCJcbiAgICAgICAgY29uZmlybUxhYmVsLmZvbnRTaXplID0gMjBcbiAgICAgICAgY29uZmlybUxhYmVsTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICBjb25maXJtTGFiZWxOb2RlLnBhcmVudCA9IGNvbmZpcm1CdG5cbiAgICAgICAgXG4gICAgICAgIGNvbmZpcm1CdG4ub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHBvcHVwTm9kZS5kZXN0cm95KClcbiAgICAgICAgICAgIG1hc2tOb2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgc2VsZi5fcmV0dXJuVG9Mb2JieSgpXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICAvLyDlvLnlh7rliqjnlLtcbiAgICAgICAgY2MudHdlZW4ocG9wdXBOb2RlKVxuICAgICAgICAgICAgLnRvKDAuNCwgeyBzY2FsZTogMSwgb3BhY2l0eTogMjU1IH0sIHsgZWFzaW5nOiAnYmFja091dCcgfSlcbiAgICAgICAgICAgIC5zdGFydCgpXG4gICAgICAgIFxuICAgICAgICAvLyDnspLlrZDnibnmlYhcbiAgICAgICAgdGhpcy5fY3JlYXRlQ2hhbXBpb25QYXJ0aWNsZXMocG9wdXBOb2RlLCBwb3B1cFdpZHRoLCBwb3B1cEhlaWdodClcbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2NoYW1waW9uUG9wdXAgPSBwb3B1cE5vZGVcbiAgICAgICAgdGhpcy5fY2hhbXBpb25NYXNrID0gbWFza05vZGVcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCfj4XjgJDmlrDlop7jgJHliJvlu7rljZXkuKrmjpLlkI3poblcbiAgICAgKiBAcGFyYW0ge2NjLk5vZGV9IHBhcmVudCAtIOeItuiKgueCuVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByYW5rSW5mbyAtIOaOkuWQjeS/oeaBr1xuICAgICAqIEBwYXJhbSB7TnVtYmVyfSByYW5rIC0g5o6S5ZCN77yIMSwgMiwgM++8iVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSB4IC0gWOWdkOagh1xuICAgICAqIEBwYXJhbSB7TnVtYmVyfSB5IC0gWeWdkOagh1xuICAgICAqL1xuICAgIF9jcmVhdGVSYW5raW5nSXRlbTogZnVuY3Rpb24ocGFyZW50LCByYW5rSW5mbywgcmFuaywgeCwgeSkge1xuICAgICAgICB2YXIgaXRlbU5vZGUgPSBuZXcgY2MuTm9kZShcIlJhbmtJdGVtX1wiICsgcmFuaylcbiAgICAgICAgaXRlbU5vZGUuc2V0UG9zaXRpb24oeCwgeSlcbiAgICAgICAgXG4gICAgICAgIC8vIOaOkuWQjeiDjOaZr1xuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCZ1wiKVxuICAgICAgICB2YXIgYmcgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBcbiAgICAgICAgLy8g5qC55o2u5o6S5ZCN6K6+572u5LiN5ZCM6aKc6ImyXG4gICAgICAgIHZhciBiZ0NvbG9yXG4gICAgICAgIGlmIChyYW5rID09PSAxKSB7XG4gICAgICAgICAgICBiZ0NvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjE1LCAwLCAyMDApICAvLyDph5HoibJcbiAgICAgICAgfSBlbHNlIGlmIChyYW5rID09PSAyKSB7XG4gICAgICAgICAgICBiZ0NvbG9yID0gbmV3IGNjLkNvbG9yKDE5MiwgMTkyLCAxOTIsIDIwMCkgIC8vIOmTtuiJslxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYmdDb2xvciA9IG5ldyBjYy5Db2xvcigyMDUsIDEyNywgNTAsIDIwMCkgIC8vIOmTnOiJslxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBiZy5maWxsQ29sb3IgPSBiZ0NvbG9yXG4gICAgICAgIGJnLnJvdW5kUmVjdCgtNTUsIC0zMCwgMTEwLCA2MCwgMTApXG4gICAgICAgIGJnLmZpbGwoKVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOaOkuWQjeagh+etvlxuICAgICAgICB2YXIgcmFua0xhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUmFua0xhYmVsXCIpXG4gICAgICAgIHZhciByYW5rTGFiZWwgPSByYW5rTGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdmFyIHJhbmtUZXh0XG4gICAgICAgIGlmIChyYW5rID09PSAxKSB7XG4gICAgICAgICAgICByYW5rVGV4dCA9IFwi8J+lhyDlhqDlhptcIlxuICAgICAgICB9IGVsc2UgaWYgKHJhbmsgPT09IDIpIHtcbiAgICAgICAgICAgIHJhbmtUZXh0ID0gXCLwn6WIIOS6muWGm1wiXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByYW5rVGV4dCA9IFwi8J+liSDlraPlhptcIlxuICAgICAgICB9XG4gICAgICAgIHJhbmtMYWJlbC5zdHJpbmcgPSByYW5rVGV4dFxuICAgICAgICByYW5rTGFiZWwuZm9udFNpemUgPSAxNlxuICAgICAgICByYW5rTGFiZWwuZW5hYmxlQm9sZCA9IHRydWVcbiAgICAgICAgcmFua0xhYmVsTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICByYW5rTGFiZWxOb2RlLnkgPSAxMlxuICAgICAgICByYW5rTGFiZWxOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDnjqnlrrblkI3np7BcbiAgICAgICAgdmFyIG5hbWVMYWJlbE5vZGUgPSBuZXcgY2MuTm9kZShcIk5hbWVMYWJlbFwiKVxuICAgICAgICB2YXIgbmFtZUxhYmVsID0gbmFtZUxhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIG5hbWVMYWJlbC5zdHJpbmcgPSByYW5rSW5mby5wbGF5ZXJfbmFtZSB8fCBcIueOqeWutlwiXG4gICAgICAgIG5hbWVMYWJlbC5mb250U2l6ZSA9IDE0XG4gICAgICAgIG5hbWVMYWJlbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgbmFtZUxhYmVsTm9kZS55ID0gLThcbiAgICAgICAgbmFtZUxhYmVsTm9kZS5wYXJlbnQgPSBpdGVtTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g6YeR5biB5pWwXG4gICAgICAgIHZhciBjb2luTGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJDb2luTGFiZWxcIilcbiAgICAgICAgdmFyIGNvaW5MYWJlbCA9IGNvaW5MYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBjb2luTGFiZWwuc3RyaW5nID0gcmFua0luZm8ubWF0Y2hfY29pbiArIFwiIOmHkeW4gVwiXG4gICAgICAgIGNvaW5MYWJlbC5mb250U2l6ZSA9IDEyXG4gICAgICAgIGNvaW5MYWJlbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDIwMClcbiAgICAgICAgY29pbkxhYmVsTm9kZS55ID0gLTIyXG4gICAgICAgIGNvaW5MYWJlbE5vZGUucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgXG4gICAgICAgIGl0ZW1Ob2RlLnBhcmVudCA9IHBhcmVudFxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+OieOAkOernuaKgOWcuuOAkeWIm+W7uuWGoOWGm+eykuWtkOeJueaViFxuICAgICAqL1xuICAgIF9jcmVhdGVDaGFtcGlvblBhcnRpY2xlczogZnVuY3Rpb24ocGFyZW50Tm9kZSwgd2lkdGgsIGhlaWdodCkge1xuICAgICAgICAvLyDnroDljZXnmoTph5HoibLpl6rng4HnspLlrZDmlYjmnpxcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyMDsgaSsrKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFydGljbGUgPSBuZXcgY2MuTm9kZShcIlBhcnRpY2xlX1wiICsgaW5kZXgpXG4gICAgICAgICAgICAgICAgcGFydGljbGUuc2V0UG9zaXRpb24oXG4gICAgICAgICAgICAgICAgICAgIChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgLyAyICsgNTBcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHBhcnRpY2xlTGFiZWwgPSBwYXJ0aWNsZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICAgICAgcGFydGljbGVMYWJlbC5zdHJpbmcgPSBcIuKcqFwiXG4gICAgICAgICAgICAgICAgcGFydGljbGVMYWJlbC5mb250U2l6ZSA9IDIwICsgTWF0aC5yYW5kb20oKSAqIDIwXG4gICAgICAgICAgICAgICAgcGFydGljbGUucGFyZW50ID0gcGFyZW50Tm9kZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNjLnR3ZWVuKHBhcnRpY2xlKVxuICAgICAgICAgICAgICAgICAgICAuZGVsYXkoTWF0aC5yYW5kb20oKSAqIDAuNSlcbiAgICAgICAgICAgICAgICAgICAgLnRvKDIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IC1oZWlnaHQgLyAyIC0gNTAsXG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBwYXJ0aWNsZS54ICsgKE1hdGgucmFuZG9tKCkgLSAwLjUpICogMTAwXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5jYWxsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFydGljbGUuZGVzdHJveSgpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5zdGFydCgpXG4gICAgICAgICAgICB9KShpKVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDwn5Sn44CQ5paw5aKe44CR5pyA57uI5qac5Y2V5aSE55CGXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLyoqXG4gICAgICog8J+PhuOAkOernuaKgOWcuuOAkeWkhOeQhuacgOe7iOamnOWNlea2iOaBr1xuICAgICAqIOW9k+ernuaKgOWcuuaJgOaciei9ruasoee7k+adn+aXtuiwg+eUqFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0geyBwZXJpb2Rfbm8sIHRvdGFsX3BsYXllcnMsIHRvcDMsIHRvcDIwLCBteV9yYW5rLCBteV9tYXRjaF9jb2luIH1cbiAgICAgKi9cbiAgICBfb25Ub3VybmFtZW50RmluYWxSYW5rOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+PhiBbX29uVG91cm5hbWVudEZpbmFsUmFua10g5pS25Yiw5pyA57uI5qac5Y2V5pWw5o2uOlwiLCBKU09OLnN0cmluZ2lmeShkYXRhKSlcbiAgICAgICAgXG4gICAgICAgIC8vIOWBnOatouaJgOacieWAkuiuoeaXtlxuICAgICAgICB0aGlzLl9zdG9wUGxheUNvdW50ZG93bigpXG4gICAgICAgIHRoaXMuX3N0b3BCaWRDb3VudGRvd24oKVxuICAgICAgICBpZiAodGhpcy5fbG9jYWxBcmVuYUNvdW50ZG93blRpbWVyKSB7XG4gICAgICAgICAgICB0aGlzLnVuc2NoZWR1bGUodGhpcy5fbG9jYWxBcmVuYUNvdW50ZG93blRpY2spXG4gICAgICAgICAgICB0aGlzLl9sb2NhbEFyZW5hQ291bnRkb3duVGltZXIgPSBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmakOiXj+avlOi1m+mHkeW4geaYvuekulxuICAgICAgICB0aGlzLl9oaWRlTWF0Y2hDb2luRGlzcGxheSgpXG4gICAgICAgIFxuICAgICAgICAvLyDlhbPpl63kuYvliY3nmoTnu5PnrpflvLnnqpdcbiAgICAgICAgaWYgKHRoaXMuX2dhbWVSZXN1bHRQb3B1cCB8fCB0aGlzLl9nYW1lUmVzdWx0TWFzaykge1xuICAgICAgICAgICAgdGhpcy5fY2xvc2VHYW1lUmVzdWx0UG9wdXAodGhpcy5fZ2FtZVJlc3VsdFBvcHVwLCB0aGlzLl9nYW1lUmVzdWx0TWFzaylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pi+56S65pyA57uI5qac5Y2V5by556qXXG4gICAgICAgIHRoaXMuX3Nob3dUb3VybmFtZW50RmluYWxSYW5rRGlhbG9nKGRhdGEpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn4+G44CQ56ue5oqA5Zy644CR5pi+56S65pyA57uI5qac5Y2V5by556qX77yI5a6M5pW054mIIC0g5bim5rua5Yqo5YiX6KGo77yJXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSB7IHBlcmlvZF9ubywgdG90YWxfcGxheWVycywgdG9wMywgdG9wMjAsIG15X3JhbmssIG15X21hdGNoX2NvaW4gfVxuICAgICAqL1xuICAgIF9zaG93VG91cm5hbWVudEZpbmFsUmFua0RpYWxvZzogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgdmFyIHdpblNpemUgPSBjYy53aW5TaXplXG4gICAgICAgIFxuICAgICAgICB2YXIgY2FudmFzID0gY2MuZmluZChcIkNhbnZhc1wiKSB8fCBjYy5maW5kKFwiVUlfUk9PVFwiKSB8fCB0aGlzLm5vZGUucGFyZW50XG4gICAgICAgIGlmICghY2FudmFzKSBjYW52YXMgPSB0aGlzLm5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0g6YGu572p5bGCID09PT09PT09PT1cbiAgICAgICAgdmFyIG1hc2tOb2RlID0gbmV3IGNjLk5vZGUoXCJGaW5hbFJhbmtNYXNrXCIpXG4gICAgICAgIG1hc2tOb2RlLmFkZENvbXBvbmVudChjYy5CbG9ja0lucHV0RXZlbnRzKVxuICAgICAgICBtYXNrTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigxMCwgNSwgMzApXG4gICAgICAgIG1hc2tOb2RlLm9wYWNpdHkgPSAyMDBcbiAgICAgICAgbWFza05vZGUud2lkdGggPSB3aW5TaXplLndpZHRoICogMlxuICAgICAgICBtYXNrTm9kZS5oZWlnaHQgPSB3aW5TaXplLmhlaWdodCAqIDJcbiAgICAgICAgbWFza05vZGUuekluZGV4ID0gOTk5XG4gICAgICAgIG1hc2tOb2RlLnBhcmVudCA9IGNhbnZhc1xuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSDlvLnnqpflrrnlmaggPT09PT09PT09PVxuICAgICAgICB2YXIgcG9wdXBOb2RlID0gbmV3IGNjLk5vZGUoXCJGaW5hbFJhbmtQb3B1cFwiKVxuICAgICAgICBwb3B1cE5vZGUuc2NhbGUgPSAwLjNcbiAgICAgICAgcG9wdXBOb2RlLm9wYWNpdHkgPSAwXG4gICAgICAgIHBvcHVwTm9kZS56SW5kZXggPSAxMDAwXG4gICAgICAgIHBvcHVwTm9kZS5wYXJlbnQgPSBjYW52YXNcbiAgICAgICAgXG4gICAgICAgIC8vIOW8ueeql+WwuuWvuO+8iOmrmOW6puaUueS4uuWxj+W5lemrmOW6pueahDg1Je+8jOmBv+WFjea6ouWHuu+8iVxuICAgICAgICB2YXIgcG9wdXBXaWR0aCA9IDYwMFxuICAgICAgICB2YXIgcG9wdXBIZWlnaHQgPSBNYXRoLmZsb29yKHdpblNpemUuaGVpZ2h0ICogMC44NSlcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0g5Li76IOM5pmvID09PT09PT09PT1cbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmdcIilcbiAgICAgICAgdmFyIGJnID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgYmcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDMwLCAyMiwgNTQsIDI1MClcbiAgICAgICAgYmcucm91bmRSZWN0KC1wb3B1cFdpZHRoLzIsIC1wb3B1cEhlaWdodC8yLCBwb3B1cFdpZHRoLCBwb3B1cEhlaWdodCwgMTYpXG4gICAgICAgIGJnLmZpbGwoKVxuICAgICAgICBiZy5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIwMCwgODApXG4gICAgICAgIGJnLmxpbmVXaWR0aCA9IDNcbiAgICAgICAgYmcucm91bmRSZWN0KC1wb3B1cFdpZHRoLzIsIC1wb3B1cEhlaWdodC8yLCBwb3B1cFdpZHRoLCBwb3B1cEhlaWdodCwgMTYpXG4gICAgICAgIGJnLnN0cm9rZSgpXG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0g6aG26YOo5qCH6aKY5Yy65Z+fID09PT09PT09PT1cbiAgICAgICAgdmFyIHRpdGxlQmdOb2RlID0gbmV3IGNjLk5vZGUoXCJUaXRsZUJnXCIpXG4gICAgICAgIHZhciB0aXRsZUJnID0gdGl0bGVCZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICB0aXRsZUJnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcigxODAsIDEzMCwgNTAsIDIyMClcbiAgICAgICAgdGl0bGVCZy5yb3VuZFJlY3QoLXBvcHVwV2lkdGgvMiArIDgsIHBvcHVwSGVpZ2h0LzIgLSA1NSwgcG9wdXBXaWR0aCAtIDE2LCA1MCwgOClcbiAgICAgICAgdGl0bGVCZy5maWxsKClcbiAgICAgICAgdGl0bGVCZ05vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICB2YXIgdGl0bGVOb2RlID0gbmV3IGNjLk5vZGUoXCJUaXRsZVwiKVxuICAgICAgICB2YXIgdGl0bGVMYWJlbCA9IHRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHRpdGxlTGFiZWwuc3RyaW5nID0gXCLwn4+GIOavlOi1m+e7k+adnyDwn4+GXCJcbiAgICAgICAgdGl0bGVMYWJlbC5mb250U2l6ZSA9IDMyXG4gICAgICAgIHRpdGxlTGFiZWwuZW5hYmxlQm9sZCA9IHRydWVcbiAgICAgICAgdGl0bGVMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHRpdGxlTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1MCwgMjIwKVxuICAgICAgICB0aXRsZU5vZGUueSA9IHBvcHVwSGVpZ2h0LzIgLSAzMlxuICAgICAgICB0aXRsZU5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDlj4LotZvkurrmlbBcbiAgICAgICAgdmFyIHRvdGFsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVG90YWxcIilcbiAgICAgICAgdmFyIHRvdGFsTGFiZWwgPSB0b3RhbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB0b3RhbExhYmVsLnN0cmluZyA9IFwi5YWxIFwiICsgKGRhdGEudG90YWxfcGxheWVycyB8fCAzKSArIFwiIOS6uuWPgui1m1wiXG4gICAgICAgIHRvdGFsTGFiZWwuZm9udFNpemUgPSAxNlxuICAgICAgICB0b3RhbExhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgdG90YWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDIwMCwgMjAwLCAyMjApXG4gICAgICAgIHRvdGFsTm9kZS55ID0gcG9wdXBIZWlnaHQvMiAtIDc1XG4gICAgICAgIHRvdGFsTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0gVE9QMyDpooblpZblj7DvvIjntKflh5HluIPlsYDvvIk9PT09PT09PT09XG4gICAgICAgIHZhciB0b3AzID0gZGF0YS50b3AzIHx8IFtdXG4gICAgICAgIHZhciBwb2RpdW1ZID0gcG9wdXBIZWlnaHQvMiAtIDE0NVxuICAgICAgICB2YXIgcG9kaXVtU3BhY2luZyA9IDE3MFxuICAgICAgICBcbiAgICAgICAgLy8g6ZO254mM77yI56ys5LqM5ZCN77yJLSDlt6bkvqdcbiAgICAgICAgaWYgKHRvcDMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVBvZGl1bUVudHJ5KHBvcHVwTm9kZSwgdG9wM1sxXSwgMiwgLXBvZGl1bVNwYWNpbmcsIHBvZGl1bVkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmHkeeJjO+8iOesrOS4gOWQje+8iS0g5Lit6Ze077yI5pyA6auY77yJXG4gICAgICAgIGlmICh0b3AzLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVQb2RpdW1FbnRyeShwb3B1cE5vZGUsIHRvcDNbMF0sIDEsIDAsIHBvZGl1bVkgKyAyMClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6ZOc54mM77yI56ys5LiJ5ZCN77yJLSDlj7PkvqdcbiAgICAgICAgaWYgKHRvcDMubGVuZ3RoID49IDMpIHtcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVBvZGl1bUVudHJ5KHBvcHVwTm9kZSwgdG9wM1syXSwgMywgcG9kaXVtU3BhY2luZywgcG9kaXVtWSAtIDEwKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOesrDQtMjDlkI3mu5rliqjliJfooajljLrln58gPT09PT09PT09PVxuICAgICAgICB2YXIgdG9wMjAgPSBkYXRhLnRvcDIwIHx8IFtdXG4gICAgICAgIGlmICh0b3AyMC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyDliJfooajljLrln5/moIfpophcbiAgICAgICAgICAgIHZhciBsaXN0VGl0bGVOb2RlID0gbmV3IGNjLk5vZGUoXCJMaXN0VGl0bGVcIilcbiAgICAgICAgICAgIHZhciBsaXN0VGl0bGVMYWJlbCA9IGxpc3RUaXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgbGlzdFRpdGxlTGFiZWwuc3RyaW5nID0gXCLigJTigJQg5o6S6KGM5qacIOKAlOKAlFwiXG4gICAgICAgICAgICBsaXN0VGl0bGVMYWJlbC5mb250U2l6ZSA9IDE4XG4gICAgICAgICAgICBsaXN0VGl0bGVMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgICAgICBsaXN0VGl0bGVOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDE4MCwgMTYwLCAxMjApXG4gICAgICAgICAgICBsaXN0VGl0bGVOb2RlLnkgPSBwb3B1cEhlaWdodC8yIC0gMjYwXG4gICAgICAgICAgICBsaXN0VGl0bGVOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDliJvlu7rmu5rliqjop4blm77lrrnlmahcbiAgICAgICAgICAgIHZhciBzY3JvbGxWaWV3Tm9kZSA9IG5ldyBjYy5Ob2RlKFwiU2Nyb2xsVmlld1wiKVxuICAgICAgICAgICAgc2Nyb2xsVmlld05vZGUud2lkdGggPSBwb3B1cFdpZHRoIC0gNDBcbiAgICAgICAgICAgIHNjcm9sbFZpZXdOb2RlLmhlaWdodCA9IDI4MFxuICAgICAgICAgICAgc2Nyb2xsVmlld05vZGUueSA9IC0zMFxuICAgICAgICAgICAgc2Nyb2xsVmlld05vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOa3u+WKoOmBrue9qee7hOS7tlxuICAgICAgICAgICAgdmFyIG1hc2sgPSBzY3JvbGxWaWV3Tm9kZS5hZGRDb21wb25lbnQoY2MuTWFzaylcbiAgICAgICAgICAgIG1hc2sudHlwZSA9IGNjLk1hc2suVHlwZS5SRUNUXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWIm+W7uuWGheWuueWuueWZqFxuICAgICAgICAgICAgdmFyIGNvbnRlbnROb2RlID0gbmV3IGNjLk5vZGUoXCJDb250ZW50XCIpXG4gICAgICAgICAgICBjb250ZW50Tm9kZS53aWR0aCA9IHBvcHVwV2lkdGggLSA0MFxuICAgICAgICAgICAgY29udGVudE5vZGUuYW5jaG9yWSA9IDFcbiAgICAgICAgICAgIGNvbnRlbnROb2RlLnkgPSBzY3JvbGxWaWV3Tm9kZS5oZWlnaHQgLyAyXG4gICAgICAgICAgICBjb250ZW50Tm9kZS5wYXJlbnQgPSBzY3JvbGxWaWV3Tm9kZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR6L+H5ruk5o6J5bey5ZyoVE9QM+S4reeahOeOqeWutu+8jOmBv+WFjemHjeWkjeaYvuekulxuICAgICAgICAgICAgdmFyIHRvcDNQbGF5ZXJJRHMgPSB7fVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b3AzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRvcDNbaV0gJiYgdG9wM1tpXS5wbGF5ZXJfaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9wM1BsYXllcklEc1t0b3AzW2ldLnBsYXllcl9pZF0gPSB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlj6rmmL7npLrnrKw05ZCN5Y+K5LmL5ZCO55qE546p5a6277yI6L+H5ruk5o6JVE9QM++8iVxuICAgICAgICAgICAgdmFyIGZpbHRlcmVkVG9wMjAgPSBbXVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b3AyMC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciByYW5rRGF0YSA9IHRvcDIwW2ldXG4gICAgICAgICAgICAgICAgLy8g6Lez6L+H5bey5ZyoVE9QM+S4reeahOeOqeWutlxuICAgICAgICAgICAgICAgIGlmIChyYW5rRGF0YSAmJiByYW5rRGF0YS5wbGF5ZXJfaWQgJiYgIXRvcDNQbGF5ZXJJRHNbcmFua0RhdGEucGxheWVyX2lkXSkge1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZFRvcDIwLnB1c2gocmFua0RhdGEpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmt7vliqDmr4/kuKrmjpLooYzpoblcbiAgICAgICAgICAgIHZhciBpdGVtSGVpZ2h0ID0gNDVcbiAgICAgICAgICAgIHZhciBzdGFydFkgPSAwXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbHRlcmVkVG9wMjAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcmFua0RhdGEgPSBmaWx0ZXJlZFRvcDIwW2ldXG4gICAgICAgICAgICAgICAgdmFyIGFjdHVhbFJhbmsgPSBpICsgNCAgLy8g56ysNOWQjeW8gOWni1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBpdGVtTm9kZSA9IHRoaXMuX2NyZWF0ZVJhbmtMaXN0SXRlbShyYW5rRGF0YSwgYWN0dWFsUmFuaywgcG9wdXBXaWR0aCAtIDUwKVxuICAgICAgICAgICAgICAgIGl0ZW1Ob2RlLnkgPSBzdGFydFkgLSBpICogaXRlbUhlaWdodCAtIGl0ZW1IZWlnaHQgLyAyXG4gICAgICAgICAgICAgICAgaXRlbU5vZGUucGFyZW50ID0gY29udGVudE5vZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6K6+572u5YaF5a656auY5bqmXG4gICAgICAgICAgICBjb250ZW50Tm9kZS5oZWlnaHQgPSBNYXRoLm1heChmaWx0ZXJlZFRvcDIwLmxlbmd0aCAqIGl0ZW1IZWlnaHQsIDI4MClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5re75Yqg6Kem5pG45rua5YqoXG4gICAgICAgICAgICB0aGlzLl9hZGRTY3JvbGxWaWV3VG91Y2goc2Nyb2xsVmlld05vZGUsIGNvbnRlbnROb2RlLCAyODApXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0g5bqV6YOo5Yy65Z+f77yI5oiR55qE5o6S5ZCNICsg5oyJ6ZKu77yJPT09PT09PT09PVxuICAgICAgICAvLyDliIbpmpTnur9cbiAgICAgICAgdmFyIHNlcE5vZGUgPSBuZXcgY2MuTm9kZShcIkJvdHRvbVNlcFwiKVxuICAgICAgICB2YXIgc2VwID0gc2VwTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIHNlcC5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIwMCwgODAsIDEwMClcbiAgICAgICAgc2VwLmxpbmVXaWR0aCA9IDFcbiAgICAgICAgc2VwLm1vdmVUbygtcG9wdXBXaWR0aC8yICsgMzAsIDApXG4gICAgICAgIHNlcC5saW5lVG8ocG9wdXBXaWR0aC8yIC0gMzAsIDApXG4gICAgICAgIHNlcC5zdHJva2UoKVxuICAgICAgICBzZXBOb2RlLnkgPSAtcG9wdXBIZWlnaHQvMiArIDE0MFxuICAgICAgICBzZXBOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5oiR55qE5o6S5ZCN6IOM5pmvXG4gICAgICAgIHZhciBteVJhbmtCZ05vZGUgPSBuZXcgY2MuTm9kZShcIk15UmFua0JnXCIpXG4gICAgICAgIHZhciBteVJhbmtCZyA9IG15UmFua0JnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIG15UmFua0JnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig1MCwgNDUsIDgwLCAyMDApXG4gICAgICAgIG15UmFua0JnLnJvdW5kUmVjdCgtMjAwLCAtMjIsIDQwMCwgNDQsIDgpXG4gICAgICAgIG15UmFua0JnLmZpbGwoKVxuICAgICAgICBteVJhbmtCZy5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIwMCwgODAsIDE1MClcbiAgICAgICAgbXlSYW5rQmcubGluZVdpZHRoID0gMVxuICAgICAgICBteVJhbmtCZy5yb3VuZFJlY3QoLTIwMCwgLTIyLCA0MDAsIDQ0LCA4KVxuICAgICAgICBteVJhbmtCZy5zdHJva2UoKVxuICAgICAgICBteVJhbmtCZ05vZGUueSA9IC1wb3B1cEhlaWdodC8yICsgMTAwXG4gICAgICAgIG15UmFua0JnTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOaIkeeahOaOkuWQjeaWh+Wtl1xuICAgICAgICB2YXIgbXlSYW5rTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTXlSYW5rXCIpXG4gICAgICAgIHZhciBteVJhbmtMYWJlbCA9IG15UmFua05vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBteVJhbmtMYWJlbC5zdHJpbmcgPSBcIuaIkeeahOaOkuWQjTog56ysIFwiICsgKGRhdGEubXlfcmFuayB8fCAxKSArIFwiIOWQjSAgfCAg5q+U6LWb6YeR5biBOiBcIiArIChkYXRhLm15X21hdGNoX2NvaW4gfHwgMClcbiAgICAgICAgbXlSYW5rTGFiZWwuZm9udFNpemUgPSAyMFxuICAgICAgICBteVJhbmtMYWJlbC5lbmFibGVCb2xkID0gdHJ1ZVxuICAgICAgICBteVJhbmtMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIG15UmFua05vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMzAsIDE1MClcbiAgICAgICAgbXlSYW5rTm9kZS55ID0gLXBvcHVwSGVpZ2h0LzIgKyAxMDBcbiAgICAgICAgbXlSYW5rTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0g56Gu5a6a5oyJ6ZKuID09PT09PT09PT1cbiAgICAgICAgdmFyIGJ0bk5vZGUgPSBuZXcgY2MuTm9kZShcIkNvbmZpcm1CdG5cIilcbiAgICAgICAgYnRuTm9kZS53aWR0aCA9IDE4MFxuICAgICAgICBidG5Ob2RlLmhlaWdodCA9IDUwXG4gICAgICAgIFxuICAgICAgICB2YXIgYnRuQmcgPSBidG5Ob2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgYnRuQmcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDc2LCAxNzUsIDgwKVxuICAgICAgICBidG5CZy5yb3VuZFJlY3QoLTkwLCAtMjUsIDE4MCwgNTAsIDEwKVxuICAgICAgICBidG5CZy5maWxsKClcbiAgICAgICAgYnRuQmcuc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMTI5LCAxOTksIDEzMilcbiAgICAgICAgYnRuQmcubGluZVdpZHRoID0gMlxuICAgICAgICBidG5CZy5yb3VuZFJlY3QoLTkwLCAtMjUsIDE4MCwgNTAsIDEwKVxuICAgICAgICBidG5CZy5zdHJva2UoKVxuICAgICAgICBidG5Ob2RlLnkgPSAtcG9wdXBIZWlnaHQvMiArIDQwXG4gICAgICAgIGJ0bk5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICB2YXIgYnRuTGFiZWwgPSBuZXcgY2MuTm9kZShcIkxhYmVsXCIpXG4gICAgICAgIHZhciBidG5MYWJlbENvbXAgPSBidG5MYWJlbC5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGJ0bkxhYmVsQ29tcC5zdHJpbmcgPSBcIuehriAg5a6aXCJcbiAgICAgICAgYnRuTGFiZWxDb21wLmZvbnRTaXplID0gMjRcbiAgICAgICAgYnRuTGFiZWxDb21wLmVuYWJsZUJvbGQgPSB0cnVlXG4gICAgICAgIGJ0bkxhYmVsQ29tcC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIGJ0bkxhYmVsQ29tcC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVJcbiAgICAgICAgYnRuTGFiZWwuc2V0Q29udGVudFNpemUoMTgwLCA1MClcbiAgICAgICAgYnRuTGFiZWwuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgYnRuTGFiZWwuc2V0UG9zaXRpb24oMCwgMClcbiAgICAgICAgYnRuTGFiZWwucGFyZW50ID0gYnRuTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5oyJ6ZKu6Kem5pG45pWI5p6cXG4gICAgICAgIGJ0bk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfU1RBUlQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYnRuTm9kZS5zY2FsZSA9IDAuOTVcbiAgICAgICAgfSlcbiAgICAgICAgYnRuTm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYnRuTm9kZS5zY2FsZSA9IDFcbiAgICAgICAgICAgIHBvcHVwTm9kZS5kZXN0cm95KClcbiAgICAgICAgICAgIG1hc2tOb2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwiaGFsbFNjZW5lXCIpXG4gICAgICAgIH0pXG4gICAgICAgIGJ0bk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfQ0FOQ0VMLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJ0bk5vZGUuc2NhbGUgPSAxXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOW8ueWHuuWKqOeUuyA9PT09PT09PT09XG4gICAgICAgIGNjLnR3ZWVuKHBvcHVwTm9kZSlcbiAgICAgICAgICAgIC50bygwLjIsIHsgc2NhbGU6IDEuMCwgb3BhY2l0eTogMjU1IH0sIHsgZWFzaW5nOiAnYmFja091dCcgfSlcbiAgICAgICAgICAgIC5zdGFydCgpXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj4YgW19zaG93VG91cm5hbWVudEZpbmFsUmFua0RpYWxvZ10g5pyA57uI5qac5Y2V5by556qX5bey5pi+56S6XCIpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDliJvlu7rmjpLooYzliJfooajpoblcbiAgICAgKi9cbiAgICBfY3JlYXRlUmFua0xpc3RJdGVtOiBmdW5jdGlvbihyYW5rRGF0YSwgcmFuaywgd2lkdGgpIHtcbiAgICAgICAgdmFyIGl0ZW1Ob2RlID0gbmV3IGNjLk5vZGUoXCJSYW5rSXRlbV9cIiArIHJhbmspXG4gICAgICAgIGl0ZW1Ob2RlLndpZHRoID0gd2lkdGhcbiAgICAgICAgaXRlbU5vZGUuaGVpZ2h0ID0gNDJcbiAgICAgICAgXG4gICAgICAgIC8vIOiDjOaZr++8iOS6pOabv+minOiJsu+8iVxuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCZ1wiKVxuICAgICAgICB2YXIgYmcgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBpZiAocmFuayAlIDIgPT09IDApIHtcbiAgICAgICAgICAgIGJnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig0NSwgMzgsIDcwLCAxODApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBiZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMzgsIDMyLCA1OCwgMTgwKVxuICAgICAgICB9XG4gICAgICAgIGJnLnJvdW5kUmVjdCgtd2lkdGgvMiwgLTIwLCB3aWR0aCwgNDAsIDYpXG4gICAgICAgIGJnLmZpbGwoKVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOaOkuWQjVxuICAgICAgICB2YXIgcmFua05vZGUgPSBuZXcgY2MuTm9kZShcIlJhbmtcIilcbiAgICAgICAgdmFyIHJhbmtMYWJlbCA9IHJhbmtOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgcmFua0xhYmVsLnN0cmluZyA9IFN0cmluZyhyYW5rKVxuICAgICAgICByYW5rTGFiZWwuZm9udFNpemUgPSAxOFxuICAgICAgICByYW5rTGFiZWwuZW5hYmxlQm9sZCA9IHRydWVcbiAgICAgICAgcmFua0xhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgcmFua05vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDEwMClcbiAgICAgICAgcmFua05vZGUuc2V0UG9zaXRpb24oLXdpZHRoLzIgKyAzNSwgMClcbiAgICAgICAgcmFua05vZGUucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHnjqnlrrblpLTlg49cbiAgICAgICAgdmFyIGF2YXRhck5vZGUgPSBuZXcgY2MuTm9kZShcIkF2YXRhclwiKVxuICAgICAgICBhdmF0YXJOb2RlLnNldFBvc2l0aW9uKC13aWR0aC8yICsgNzUsIDApXG4gICAgICAgIHZhciBhdmF0YXJTcHJpdGUgPSBhdmF0YXJOb2RlLmFkZENvbXBvbmVudChjYy5TcHJpdGUpXG4gICAgICAgIGF2YXRhclNwcml0ZS5zaXplTW9kZSA9IGNjLlNwcml0ZS5TaXplTW9kZS5DVVNUT01cbiAgICAgICAgYXZhdGFyTm9kZS5zZXRDb250ZW50U2l6ZSgzMiwgMzIpXG4gICAgICAgIGF2YXRhck5vZGUucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOWKoOi9veWktOWDj1xuICAgICAgICB0aGlzLl9sb2FkQXZhdGFyU3ByaXRlKGF2YXRhclNwcml0ZSwgcmFua0RhdGEuYXZhdGFyLCByYW5rRGF0YS5pc19yb2JvdClcbiAgICAgICAgXG4gICAgICAgIC8vIOeOqeWutuWQjeensFxuICAgICAgICB2YXIgbmFtZU5vZGUgPSBuZXcgY2MuTm9kZShcIk5hbWVcIilcbiAgICAgICAgdmFyIG5hbWVMYWJlbCA9IG5hbWVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdmFyIHBsYXllck5hbWUgPSByYW5rRGF0YS5wbGF5ZXJfbmFtZSB8fCBcIueOqeWutlwiXG4gICAgICAgIGlmIChyYW5rRGF0YS5pc19yb2JvdCkge1xuICAgICAgICAgICAgcGxheWVyTmFtZSA9IHRoaXMuX2dldFJvYm90RGlzcGxheU5hbWUocmFua0RhdGEucGxheWVyX2lkLCByYW5rRGF0YS5wbGF5ZXJfbmFtZSlcbiAgICAgICAgfVxuICAgICAgICBuYW1lTGFiZWwuc3RyaW5nID0gcGxheWVyTmFtZVxuICAgICAgICBuYW1lTGFiZWwuZm9udFNpemUgPSAxNlxuICAgICAgICBuYW1lTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkxFRlRcbiAgICAgICAgbmFtZUxhYmVsLm92ZXJmbG93ID0gY2MuTGFiZWwuT3ZlcmZsb3cuQ0xBTVBcbiAgICAgICAgbmFtZU5vZGUud2lkdGggPSAxNTBcbiAgICAgICAgbmFtZU5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgbmFtZU5vZGUuc2V0UG9zaXRpb24oLXdpZHRoLzIgKyAxNDUsIDApXG4gICAgICAgIG5hbWVOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDph5HluIFcbiAgICAgICAgdmFyIGNvaW5Ob2RlID0gbmV3IGNjLk5vZGUoXCJDb2luXCIpXG4gICAgICAgIHZhciBjb2luTGFiZWwgPSBjb2luTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGNvaW5MYWJlbC5zdHJpbmcgPSAocmFua0RhdGEubWF0Y2hfY29pbiB8fCAwKSArIFwiIOmHkeW4gVwiXG4gICAgICAgIGNvaW5MYWJlbC5mb250U2l6ZSA9IDE1XG4gICAgICAgIGNvaW5MYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uUklHSFRcbiAgICAgICAgY29pbk5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMjAsIDE1MClcbiAgICAgICAgY29pbk5vZGUuc2V0UG9zaXRpb24od2lkdGgvMiAtIDYwLCAwKVxuICAgICAgICBjb2luTm9kZS5wYXJlbnQgPSBpdGVtTm9kZVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGl0ZW1Ob2RlXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDmt7vliqDmu5rliqjop4blm77op6bmkbjkuovku7ZcbiAgICAgKi9cbiAgICBfYWRkU2Nyb2xsVmlld1RvdWNoOiBmdW5jdGlvbihzY3JvbGxWaWV3Tm9kZSwgY29udGVudE5vZGUsIHZpZXdIZWlnaHQpIHtcbiAgICAgICAgdmFyIHRvdWNoU3RhcnRZID0gMFxuICAgICAgICB2YXIgY29udGVudFN0YXJ0WSA9IDBcbiAgICAgICAgdmFyIG1heE9mZnNldCA9IE1hdGgubWF4KDAsIGNvbnRlbnROb2RlLmhlaWdodCAtIHZpZXdIZWlnaHQpXG4gICAgICAgIFxuICAgICAgICBzY3JvbGxWaWV3Tm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9TVEFSVCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHRvdWNoU3RhcnRZID0gZXZlbnQuZ2V0TG9jYXRpb25ZKClcbiAgICAgICAgICAgIGNvbnRlbnRTdGFydFkgPSBjb250ZW50Tm9kZS55XG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICBzY3JvbGxWaWV3Tm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9NT1ZFLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgdmFyIHRvdWNoWSA9IGV2ZW50LmdldExvY2F0aW9uWSgpXG4gICAgICAgICAgICB2YXIgZGVsdGFZID0gdG91Y2hZIC0gdG91Y2hTdGFydFlcbiAgICAgICAgICAgIHZhciBuZXdZID0gY29udGVudFN0YXJ0WSArIGRlbHRhWVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDpmZDliLbmu5rliqjojIPlm7RcbiAgICAgICAgICAgIHZhciBtaW5ZID0gdmlld0hlaWdodCAvIDIgLSBjb250ZW50Tm9kZS5oZWlnaHRcbiAgICAgICAgICAgIHZhciBtYXhZID0gdmlld0hlaWdodCAvIDJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbmV3WSA9IE1hdGgubWF4KG1pblksIE1hdGgubWluKG1heFksIG5ld1kpKVxuICAgICAgICAgICAgY29udGVudE5vZGUueSA9IG5ld1lcbiAgICAgICAgfSlcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCfj4bjgJDnq57mioDlnLrjgJHliJvlu7rpooblpZblj7DmnaHnm67vvIjnvo7ljJbniYjvvIlcbiAgICAgKi9cbiAgICBfY3JlYXRlUG9kaXVtRW50cnk6IGZ1bmN0aW9uKHBhcmVudCwgcmFua0RhdGEsIHJhbmssIHgsIHkpIHtcbiAgICAgICAgdmFyIGVudHJ5Tm9kZSA9IG5ldyBjYy5Ob2RlKFwiUG9kaXVtRW50cnlfXCIgKyByYW5rKVxuICAgICAgICBlbnRyeU5vZGUuc2V0UG9zaXRpb24oeCwgeSlcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0g5o6S5ZCN6IOM5pmv77yI5qC55o2u5o6S5ZCN6K6+572u6aKc6Imy77yJPT09PT09PT09PVxuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCZ1wiKVxuICAgICAgICB2YXIgYmcgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICB2YXIgYmdDb2xvciwgYm9yZGVyQ29sb3JcbiAgICAgICAgaWYgKHJhbmsgPT09IDEpIHtcbiAgICAgICAgICAgIC8vIOmHkeeJjCAtIOmHkeiJsuezu1xuICAgICAgICAgICAgYmdDb2xvciA9IG5ldyBjYy5Db2xvcigxMDAsIDg1LCA0MCwgMjMwKVxuICAgICAgICAgICAgYm9yZGVyQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMTUsIDApXG4gICAgICAgIH0gZWxzZSBpZiAocmFuayA9PT0gMikge1xuICAgICAgICAgICAgLy8g6ZO254mMIC0g6ZO26Imy57O7XG4gICAgICAgICAgICBiZ0NvbG9yID0gbmV3IGNjLkNvbG9yKDcwLCA3NSwgODUsIDIzMClcbiAgICAgICAgICAgIGJvcmRlckNvbG9yID0gbmV3IGNjLkNvbG9yKDE5MiwgMTkyLCAxOTIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDpk5zniYwgLSDpk5zoibLns7tcbiAgICAgICAgICAgIGJnQ29sb3IgPSBuZXcgY2MuQ29sb3IoODUsIDYwLCA0NSwgMjMwKVxuICAgICAgICAgICAgYm9yZGVyQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjA1LCAxMjcsIDUwKVxuICAgICAgICB9XG4gICAgICAgIGJnLmZpbGxDb2xvciA9IGJnQ29sb3JcbiAgICAgICAgYmcucm91bmRSZWN0KC01NSwgLTcwLCAxMTAsIDE0MCwgMTIpXG4gICAgICAgIGJnLmZpbGwoKVxuICAgICAgICAvLyDovrnmoYZcbiAgICAgICAgYmcuc3Ryb2tlQ29sb3IgPSBib3JkZXJDb2xvclxuICAgICAgICBiZy5saW5lV2lkdGggPSAyXG4gICAgICAgIGJnLnJvdW5kUmVjdCgtNTUsIC03MCwgMTEwLCAxNDAsIDEyKVxuICAgICAgICBiZy5zdHJva2UoKVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gZW50cnlOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOaOkuWQjeWllueJjOWbvuaghyA9PT09PT09PT09XG4gICAgICAgIHZhciBtZWRhbE5vZGUgPSBuZXcgY2MuTm9kZShcIk1lZGFsXCIpXG4gICAgICAgIHZhciBtZWRhbCA9IG1lZGFsTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIHZhciBtZWRhbENvbG9yXG4gICAgICAgIGlmIChyYW5rID09PSAxKSB7XG4gICAgICAgICAgICBtZWRhbENvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjE1LCAwKSAgLy8g6YeR6ImyXG4gICAgICAgIH0gZWxzZSBpZiAocmFuayA9PT0gMikge1xuICAgICAgICAgICAgbWVkYWxDb2xvciA9IG5ldyBjYy5Db2xvcigxOTIsIDE5MiwgMTkyKSAgLy8g6ZO26ImyXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtZWRhbENvbG9yID0gbmV3IGNjLkNvbG9yKDIwNSwgMTI3LCA1MCkgIC8vIOmTnOiJslxuICAgICAgICB9XG4gICAgICAgIG1lZGFsLmZpbGxDb2xvciA9IG1lZGFsQ29sb3JcbiAgICAgICAgLy8g57uY5Yi25ZyG5b2i5aWW54mMXG4gICAgICAgIG1lZGFsLmNpcmNsZSgwLCA0NSwgMjIpXG4gICAgICAgIG1lZGFsLmZpbGwoKVxuICAgICAgICBtZWRhbC5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1LCAxNTApXG4gICAgICAgIG1lZGFsLmxpbmVXaWR0aCA9IDJcbiAgICAgICAgbWVkYWwuY2lyY2xlKDAsIDQ1LCAyMilcbiAgICAgICAgbWVkYWwuc3Ryb2tlKClcbiAgICAgICAgbWVkYWxOb2RlLnBhcmVudCA9IGVudHJ5Tm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5aWW54mM5LiK55qE5pWw5a2XXG4gICAgICAgIHZhciByYW5rTnVtTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUmFua051bVwiKVxuICAgICAgICB2YXIgcmFua051bUxhYmVsID0gcmFua051bU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICByYW5rTnVtTGFiZWwuc3RyaW5nID0gU3RyaW5nKHJhbmspXG4gICAgICAgIHJhbmtOdW1MYWJlbC5mb250U2l6ZSA9IDI0XG4gICAgICAgIHJhbmtOdW1MYWJlbC5lbmFibGVCb2xkID0gdHJ1ZVxuICAgICAgICByYW5rTnVtTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICByYW5rTnVtTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcig1MCwgNDAsIDMwKVxuICAgICAgICByYW5rTnVtTm9kZS5zZXRQb3NpdGlvbigwLCA0NSlcbiAgICAgICAgcmFua051bU5vZGUucGFyZW50ID0gZW50cnlOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOeOqeWutuWktOWDjyA9PT09PT09PT09XG4gICAgICAgIHZhciBhdmF0YXJOb2RlID0gbmV3IGNjLk5vZGUoXCJBdmF0YXJcIilcbiAgICAgICAgYXZhdGFyTm9kZS5zZXRQb3NpdGlvbigwLCAyMClcbiAgICAgICAgdmFyIGF2YXRhclNwcml0ZSA9IGF2YXRhck5vZGUuYWRkQ29tcG9uZW50KGNjLlNwcml0ZSlcbiAgICAgICAgYXZhdGFyU3ByaXRlLnNpemVNb2RlID0gY2MuU3ByaXRlLlNpemVNb2RlLkNVU1RPTVxuICAgICAgICBhdmF0YXJOb2RlLnNldENvbnRlbnRTaXplKDUwLCA1MClcbiAgICAgICAgYXZhdGFyTm9kZS5wYXJlbnQgPSBlbnRyeU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHliqDovb3lpLTlg49cbiAgICAgICAgdGhpcy5fbG9hZEF2YXRhclNwcml0ZShhdmF0YXJTcHJpdGUsIHJhbmtEYXRhLmF2YXRhciwgcmFua0RhdGEuaXNfcm9ib3QpXG4gICAgICAgIFxuICAgICAgICAvLyDlpLTlg4/ovrnmoYZcbiAgICAgICAgdmFyIGF2YXRhckZyYW1lTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQXZhdGFyRnJhbWVcIilcbiAgICAgICAgdmFyIGF2YXRhckZyYW1lID0gYXZhdGFyRnJhbWVOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgYXZhdGFyRnJhbWUuc3Ryb2tlQ29sb3IgPSBib3JkZXJDb2xvclxuICAgICAgICBhdmF0YXJGcmFtZS5saW5lV2lkdGggPSAyXG4gICAgICAgIGF2YXRhckZyYW1lLmNpcmNsZSgwLCAyMCwgMjYpXG4gICAgICAgIGF2YXRhckZyYW1lLnN0cm9rZSgpXG4gICAgICAgIGF2YXRhckZyYW1lTm9kZS5wYXJlbnQgPSBlbnRyeU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0g546p5a625ZCN56ewID09PT09PT09PT1cbiAgICAgICAgdmFyIG5hbWVMYWJlbE5vZGUgPSBuZXcgY2MuTm9kZShcIk5hbWVcIilcbiAgICAgICAgdmFyIG5hbWVMYWJlbCA9IG5hbWVMYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB2YXIgcGxheWVyTmFtZSA9IHJhbmtEYXRhLnBsYXllcl9uYW1lIHx8IFwi546p5a62XCJcbiAgICAgICAgaWYgKHJhbmtEYXRhLmlzX3JvYm90KSB7XG4gICAgICAgICAgICAvLyDmnLrlmajkurrkvb/nlKjmmbrog73pmarnu4PlkI3np7BcbiAgICAgICAgICAgIHBsYXllck5hbWUgPSB0aGlzLl9nZXRSb2JvdERpc3BsYXlOYW1lKHJhbmtEYXRhLnBsYXllcl9pZCwgcmFua0RhdGEucGxheWVyX25hbWUpXG4gICAgICAgIH1cbiAgICAgICAgbmFtZUxhYmVsLnN0cmluZyA9IHBsYXllck5hbWVcbiAgICAgICAgbmFtZUxhYmVsLmZvbnRTaXplID0gMThcbiAgICAgICAgbmFtZUxhYmVsLmVuYWJsZUJvbGQgPSB0cnVlXG4gICAgICAgIG5hbWVMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIG5hbWVMYWJlbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgbmFtZUxhYmVsTm9kZS55ID0gNVxuICAgICAgICBuYW1lTGFiZWxOb2RlLnBhcmVudCA9IGVudHJ5Tm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSDmr5TotZvph5HluIEgPT09PT09PT09PVxuICAgICAgICB2YXIgY29pbkxhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ29pblwiKVxuICAgICAgICB2YXIgY29pbkxhYmVsID0gY29pbkxhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGNvaW5MYWJlbC5zdHJpbmcgPSAocmFua0RhdGEubWF0Y2hfY29pbiB8fCAwKSArIFwiIOmHkeW4gVwiXG4gICAgICAgIGNvaW5MYWJlbC5mb250U2l6ZSA9IDE2XG4gICAgICAgIGNvaW5MYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIGNvaW5MYWJlbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMzAsIDE1MClcbiAgICAgICAgY29pbkxhYmVsTm9kZS55ID0gLTI1XG4gICAgICAgIGNvaW5MYWJlbE5vZGUucGFyZW50ID0gZW50cnlOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOS4jeWGjeaYvuekuuacuuWZqOS6ukFJ5qCH562+ID09PT09PT09PT1cbiAgICAgICAgLy8g55So5oi36KaB5rGC77ya5py65Zmo5Lq65LiN5pi+56S6QUnmoIfor4ZcbiAgICAgICAgXG4gICAgICAgIGVudHJ5Tm9kZS5wYXJlbnQgPSBwYXJlbnRcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOiOt+WPluacuuWZqOS6uuaYvuekuuWQjeensFxuICAgICAqL1xuICAgIF9nZXRSb2JvdERpc3BsYXlOYW1lOiBmdW5jdGlvbihwbGF5ZXJJZCwgb3JpZ2luYWxOYW1lKSB7XG4gICAgICAgIC8vIOWmguaenOWOn+Wni+WQjeensOW3sue7j+aYr1wi5pm66IO96Zmq57uDWOWPt1wi5qC85byP77yM55u05o6l6L+U5ZueXG4gICAgICAgIGlmIChvcmlnaW5hbE5hbWUgJiYgb3JpZ2luYWxOYW1lLmluZGV4T2YoXCLmmbrog73pmarnu4NcIikgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbE5hbWVcbiAgICAgICAgfVxuICAgICAgICAvLyDlkKbliJnvvIznlJ/miJBcIuaZuuiDvemZque7g1jlj7dcIuagvOW8j+eahOWQjeensFxuICAgICAgICB2YXIgcm9ib3RJbmRleCA9IDFcbiAgICAgICAgaWYgKHBsYXllcklkKSB7XG4gICAgICAgICAgICB2YXIgbGFzdENoYXIgPSBwbGF5ZXJJZC50b1N0cmluZygpLnNsaWNlKC0xKVxuICAgICAgICAgICAgcm9ib3RJbmRleCA9IHBhcnNlSW50KGxhc3RDaGFyKSB8fCAxXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFwi5pm66IO96Zmq57uDXCIgKyByb2JvdEluZGV4ICsgXCLlj7dcIlxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeWKoOi9veWktOWDj+eyvueBtVxuICAgICAqIEBwYXJhbSB7Y2MuU3ByaXRlfSBzcHJpdGUgLSDnm67moIfnsr7ngbXnu4Tku7ZcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYXZhdGFyVXJsIC0g5aS05YOPVVJM5oiW6LWE5rqQ5ZCNXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc1JvYm90IC0g5piv5ZCm5piv5py65Zmo5Lq6XG4gICAgICovXG4gICAgX2xvYWRBdmF0YXJTcHJpdGU6IGZ1bmN0aW9uKHNwcml0ZSwgYXZhdGFyVXJsLCBpc1JvYm90KSB7XG4gICAgICAgIGlmICghc3ByaXRlKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIC8vIOacuuWZqOS6uuS9v+eUqOm7mOiupOWktOWDj++8iGF2YXRhcl8xIOWIsCBhdmF0YXJfMyDpmo/mnLrvvIlcbiAgICAgICAgaWYgKGlzUm9ib3QpIHtcbiAgICAgICAgICAgIHZhciByb2JvdEF2YXRhckluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMykgKyAxXG4gICAgICAgICAgICB2YXIgZGVmYXVsdFBhdGggPSBcIlVJL2hlYWRpbWFnZS9hdmF0YXJfXCIgKyByb2JvdEF2YXRhckluZGV4XG4gICAgICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChkZWZhdWx0UGF0aCwgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVyciwgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWVyciAmJiBzcHJpdGVGcmFtZSAmJiBzcHJpdGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICBzcHJpdGUuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g55yf5Lq6546p5a62XG4gICAgICAgIGlmICghYXZhdGFyVXJsIHx8IGF2YXRhclVybCA9PT0gXCJcIikge1xuICAgICAgICAgICAgLy8g5L2/55So6buY6K6k5aS05YOPXG4gICAgICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcIlVJL2hlYWRpbWFnZS9hdmF0YXJfMVwiLCBjYy5TcHJpdGVGcmFtZSwgZnVuY3Rpb24oZXJyLCBzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgICAgIGlmICghZXJyICYmIHNwcml0ZUZyYW1lICYmIHNwcml0ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNwcml0ZS5zcHJpdGVGcmFtZSA9IHNwcml0ZUZyYW1lXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDliKTmlq3mmK9VUkzov5jmmK/mnKzlnLDotYTmupDlkI1cbiAgICAgICAgaWYgKGF2YXRhclVybC5pbmRleE9mKFwiaHR0cFwiKSA9PT0gMCB8fCBhdmF0YXJVcmwuaW5kZXhPZihcIi8vXCIpID09PSAwKSB7XG4gICAgICAgICAgICAvLyDov5znqItVUkxcbiAgICAgICAgICAgIGNjLmFzc2V0TWFuYWdlci5sb2FkUmVtb3RlKGF2YXRhclVybCwgeyBleHQ6ICcucG5nJyB9LCBmdW5jdGlvbihlcnIsIHRleHR1cmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyIHx8ICF0ZXh0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWKoOi9veWksei0pe+8jOS9v+eUqOm7mOiupOWktOWDj1xuICAgICAgICAgICAgICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcIlVJL2hlYWRpbWFnZS9hdmF0YXJfMVwiLCBjYy5TcHJpdGVGcmFtZSwgZnVuY3Rpb24oZXJyMiwgZmFsbGJhY2tTcHJpdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZXJyMiAmJiBmYWxsYmFja1Nwcml0ZSAmJiBzcHJpdGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwcml0ZS5zcHJpdGVGcmFtZSA9IGZhbGxiYWNrU3ByaXRlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3ByaXRlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzcHJpdGVGcmFtZSA9IG5ldyBjYy5TcHJpdGVGcmFtZSh0ZXh0dXJlKVxuICAgICAgICAgICAgICAgICAgICAgICAgc3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWVcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5L2/55So6buY6K6k5aS05YOPXG4gICAgICAgICAgICAgICAgICAgIGNjLnJlc291cmNlcy5sb2FkKFwiVUkvaGVhZGltYWdlL2F2YXRhcl8xXCIsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIyLCBmYWxsYmFja1Nwcml0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlcnIyICYmIGZhbGxiYWNrU3ByaXRlICYmIHNwcml0ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ByaXRlLnNwcml0ZUZyYW1lID0gZmFsbGJhY2tTcHJpdGVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5pys5Zyw6LWE5rqQ5ZCNXG4gICAgICAgICAgICB2YXIgbG9jYWxQYXRoID0gXCJVSS9oZWFkaW1hZ2UvXCIgKyBhdmF0YXJVcmxcbiAgICAgICAgICAgIGNjLnJlc291cmNlcy5sb2FkKGxvY2FsUGF0aCwgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVyciwgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyIHx8ICFzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyDliqDovb3lpLHotKXvvIzkvb/nlKjpu5jorqTlpLTlg49cbiAgICAgICAgICAgICAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoXCJVSS9oZWFkaW1hZ2UvYXZhdGFyXzFcIiwgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVycjIsIGZhbGxiYWNrU3ByaXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVycjIgJiYgZmFsbGJhY2tTcHJpdGUgJiYgc3ByaXRlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcHJpdGUuc3ByaXRlRnJhbWUgPSBmYWxsYmFja1Nwcml0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHNwcml0ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNwcml0ZS5zcHJpdGVGcmFtZSA9IHNwcml0ZUZyYW1lXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuIl19