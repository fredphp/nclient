"use strict";
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
var RoomState = window.RoomState || {}; // 音效缓存

var _audioClips = {}; // 牌布局配置

var CardLayout = {
  cardScale: 0.8,
  cardY: -250,
  cardSpacing: 35,
  bottomCardScale: 0.4,
  bottomCardSpacing: 25,
  outCardScale: 0.5,
  outCardSpacing: 25
}; // 发牌动画配置

var DealConfig = {
  animDuration: 0.12,
  deckPosition: cc.v2(0, 100),
  cardInterval: 80
}; // 加载并播放音效

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
    } // 🔧【修复】确保手牌容器节点存在


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
        } // 如果没找到，创建一个新的容器节点


        if (!this.cards_node) {
          var newCardsNode = new cc.Node("cards_node");
          newCardsNode.parent = gameSceneNode;
          newCardsNode.setPosition(0, 0);
          newCardsNode.setAnchorPoint(0.5, 0.5);
          newCardsNode.setContentSize(cc.size(800, 200));
          this.cards_node = newCardsNode;
        }
      }
    } // ============================================================
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

    this.cardsReady = false; // 🕐【倒计时系统】

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

    this.bottom_card = []; // ============================================================
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
      console.log("🃏 服务端原始底牌:", JSON.stringify(data.bottom_cards)); // 🔧【关键修复】新一轮发牌时，关闭上一轮的结算弹窗

      if (this._gameResultPopup || this._gameResultMask) {
        console.log("🃏 [onPushCards] 关闭上一轮的结算弹窗");

        this._closeGameResultPopup(this._gameResultPopup, this._gameResultMask);
      } // 🔧【修复】停止所有竞技场倒计时


      this._stopArenaCountdown(); // 🔧【关键修复】清理桌面上的牌（上一轮最后一手牌）


      console.log("🃏 [onPushCards] 清理桌面上的牌");

      this._clearAllOutCardZones(); // 【核心】直接保存服务端数据，不做任何转换


      this.handCards = data.cards || [];
      this.bottomCards = data.bottom_cards || []; // 【核心】唯一渲染入口

      this.renderCards(this.handCards);
    }.bind(this)); // 监听叫地主轮次（旧版消息，仅用于兼容）

    myglobal.socket.onBidTurn(function (data) {// 不再处理，避免重复
    }.bind(this)); // 监听叫地主结果

    myglobal.socket.onBidResult(function (data) {
      // 🔒【重要】收到结果，停止倒计时
      this._stopBidCountdown();

      if (this.node && this.node.parent) {
        this.node.parent.emit("bid_result_event", {
          player_id: data.accountid,
          bid: data.state
        });
      }
    }.bind(this)); // 监听抢地主轮次（旧版消息，仅用于兼容）

    myglobal.socket.onCanRobState(function (data) {// 不再处理，避免重复
    }.bind(this)); // 监听出牌轮次

    myglobal.socket.onCanChuCard(function (data) {
      var playerId = data.player_id || data;
      var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID; // 🔒【重要】先停止之前的倒计时（服务器轮转了）

      this._stopPlayCountdown(); // 🔧【新增】保存出牌状态，用于提示功能


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
    }.bind(this)); // 监听其他玩家出牌

    myglobal.socket.onOtherPlayerChuCard(function (data) {
      // 🔒【重要】收到出牌消息，停止我的倒计时
      this._stopPlayCountdown();

      if (this.playingUI_node) {
        this.playingUI_node.active = false;
      } // 🔧【修复】处理不出的情况


      if (data.is_pass) {
        // 🔊【新增】播放不出音效
        this._playPassSound(data); // 🔊【新增】显示不出效果


        this._showPassEffect(data.accountid); // 🔧【新增】不出时不清除上家出的牌


        return;
      } // 🔧【新增】保存上家出的牌，用于提示功能


      this._lastPlayedCards = data.cards || [];
      this._lastPlayedHandType = data.hand_type || "";
      if (!this.node || !this.node.parent) return; // 🔧【修复】获取当前玩家ID，判断是否是自己出牌
      // 🔧【关键】安全获取玩家ID，避免报错

      var socketInfo = myglobal.socket.getPlayerInfo() || {};
      var serverPlayerId = myglobal.playerData && myglobal.playerData.serverPlayerId || "";
      var accountId = myglobal.playerData && myglobal.playerData.accountID || "";
      var myPlayerId = socketInfo.id || serverPlayerId || accountId; // 🔧【关键】使用更安全的比较方式

      var isSelf = String(data.accountid || "") === String(myPlayerId || ""); // 🔧【调试】详细打印ID比较信息
      // 🔧【核心修复】如果是自己出牌，从手牌中删除

      if (isSelf) {
        this._removeCardsFromHand(data.cards);
      } else {} // 🔊【新增】播放出牌音效


      this._playCardSound(data); // 显示出的牌到桌面


      var gameScene_script = this.node.parent.getComponent("gameScene");
      if (!gameScene_script) return;
      var outCard_node = gameScene_script.getUserOutCardPosByAccount(data.accountid);
      if (!outCard_node || !this.card_prefab) return; // 【重要】直接使用服务端数据创建节点

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

      this.showOutCards(outCard_node, node_cards); // 更新剩余牌数

      if (data.cards_left !== undefined) {
        this.node.parent.emit("update_card_count_event", {
          accountid: data.accountid,
          count: data.cards_left
        });
      }
    }.bind(this)); // 监听抢地主阶段开始

    myglobal.socket.onCallLandlordStart(function (data) {
      this._biddingPhase = "bidding";
      this._gamePhase = "bidding"; // 🔧【新增】设置游戏阶段
    }.bind(this)); // 监听抢地主轮次

    myglobal.socket.onCallLandlordTurn(function (data) {
      this._processCallLandlordTurn(data);
    }.bind(this)); // 监听抢地主结果

    myglobal.socket.onCallLandlordResult(function (data) {
      // 🔒【重要】收到结果，停止倒计时
      this._stopBidCountdown(); // 🔧【新增】播放抢地主语音


      this._playRobSound(data);

      if (this.node && this.node.parent) {
        this.node.parent.emit("call_landlord_result_event", data);
      }
    }.bind(this)); // 监听抢地主阶段结束

    myglobal.socket.onCallLandlordEnd(function (data) {
      // 🔒【重要】停止所有倒计时
      this._stopBidCountdown();

      this._hideRobUI();

      this._biddingPhase = "idle"; // 🔧【关键修复】重置抢地主相关状态

      this.rob_player_accountid = 0;
      this.cardsReady = false; // 重置发牌完成标记
      // 🔧【关键】保存底牌数据

      if (data.bottom_cards && data.bottom_cards.length > 0) {
        this.bottomCards = data.bottom_cards;
      } // 🔧【重要】显示底牌（所有玩家都能看到）


      this._showBottomCardsToAll(data.bottom_cards);
    }.bind(this)); // 🔧【新增】监听地主新手牌消息 - 只更新地主的手牌，不触发重新发牌
    // 🔧【关键修复】必须验证自己是否是地主，只有地主才更新手牌

    myglobal.socket.onLandlordCards(function (data) {
      // 🔧【关键验证】检查自己是否是地主
      var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID;
      var landlordId = data.landlord_id || ""; // 🔧【关键】只有当地主ID匹配自己时才更新手牌

      if (String(landlordId) !== String(myPlayerId)) {
        return;
      } // 【重要】只更新手牌数据，不重新渲染整个场景


      this.handCards = data.cards || [];
      this.bottomCards = data.bottom_cards || []; // 【重要】使用静默更新，不触发发牌动画

      this._updateLandlordHandCards(this.handCards);
    }.bind(this)); // 监听重新发牌通知（所有人都不叫地主）

    myglobal.socket.onRestartGame(function (data) {
      // 停止所有倒计时
      this._stopBidCountdown();

      this._stopPlayCountdown(); // 隐藏抢地主UI


      this._hideRobUI(); // 重置状态


      this._biddingPhase = "idle";
      this._gamePhase = "idle"; // 🔧【新增】重置游戏阶段

      this.cardsReady = false;
      this.handCards = [];
      this.bottomCards = [];
      this.choose_card_data = []; // 清理所有卡牌节点

      this.clearAllCards();
    }.bind(this)); // 🔧【新增】监听出牌阶段开始

    myglobal.socket.onPlayStart(function (data) {
      // 🔧【关键】设置游戏阶段为出牌阶段
      this._gamePhase = "playing";
      this._biddingPhase = "idle"; // 隐藏抢地主UI（确保不显示）

      this._hideRobUI();
    }.bind(this)); // 🔊【新增】监听游戏结束

    myglobal.socket.onGameOver(function (data) {
      // 停止所有倒计时
      this._stopPlayCountdown(); // 🔧【新增】重置游戏阶段


      this._gamePhase = "idle";
      this._biddingPhase = "idle"; // 🔧【新增】游戏结束时立即重置所有玩家的准备状态

      this._resetAllPlayerReadyState(); // 🔧【新增】显示结算弹窗


      this._showGameResultPopup(data);
    }.bind(this)); // 监听游戏状态恢复

    myglobal.socket.onGameStateRestore(function (data) {
      this.restoreGameState(data);
    }.bind(this)); // 🔧【新增】监听提示结果

    myglobal.socket.onHintResult(function (data) {
      this._onHintResult(data);
    }.bind(this)); // 🔧【托管】监听托管状态变化

    myglobal.socket.onTrusteeStateNotify(function (data) {
      this._onTrusteeStateNotify(data);
    }.bind(this)); // ============================================================
    // 【竞技场】消息监听
    // ============================================================
    // 监听竞技场状态更新

    myglobal.socket.onCompetitionStatus(function (data) {
      this._onCompetitionStatus(data);
    }.bind(this)); // 监听竞技场倒计时

    myglobal.socket.onCompetitionCountdown(function (data) {
      this._onCompetitionCountdown(data);
    }.bind(this)); // 监听比赛金币更新

    myglobal.socket.onMatchCoinUpdate(function (data) {
      this._onMatchCoinUpdate(data);
    }.bind(this)); // 监听淘汰通知

    myglobal.socket.onCompetitionEliminated(function (data) {
      this._onCompetitionEliminated(data);
    }.bind(this)); // 监听晋级通知

    myglobal.socket.onCompetitionAdvance(function (data) {
      this._onCompetitionAdvance(data);
    }.bind(this)); // 监听冠军弹窗

    myglobal.socket.onCompetitionChampion(function (data) {
      this._onCompetitionChampion(data);
    }.bind(this)); // 🔧【关键修复】监听最终榜单消息
    // 当竞技场所有轮次结束时，服务端会发送此消息

    myglobal.socket.onTournamentFinalRank(function (data) {
      console.log("🏆 [gameingUI] 收到最终榜单:", JSON.stringify(data));

      this._onTournamentFinalRank(data);
    }.bind(this)); // 内部事件：显示底牌
    // 🔧【关键修复】此事件已废弃，逻辑已移到 onCallLandlordEnd 和 onLandlordCards
    // 保留此监听器仅用于兼容旧版本，不再触发 pushThreeCard

    this.node.on("show_bottom_card_event", function (data) {
      // 🔧【修复】data 可能是 { cards: [...] } 对象或数组
      var cards = data;

      if (data && data.cards) {
        cards = data.cards;
      } // 如果 cards 为空，不处理


      if (!cards || cards.length === 0) {
        return;
      } // 🔧【关键修复】不再调用 pushThreeCard！
      // 底牌显示已由 _showBottomCardsToAll 处理
      // 地主手牌更新已由 onLandlordCards 处理
      // 删除以下代码，避免重复处理和延迟：
      // this.scheduleOnce(this.pushThreeCard, 0.2)

    }.bind(this)); // 🔧【修复】注册监听选择牌消息
    // card.js 是在 gameScene_node (this.node.parent) 上 emit 事件
    // 所以必须在 this.node.parent 上监听，而不是 this.node

    var gameScene_node = this.node.parent;

    if (gameScene_node) {
      gameScene_node.on("choose_card_event", function (event) {
        this.choose_card_data.push(event); // 🔧【新增】更新已选牌数显示

        this._updateSelectedCountDisplay();
      }.bind(this));
      gameScene_node.on("unchoose_card_event", function (event) {
        // 🔧【修复】正确匹配卡牌的唯一标识符（suit + rank）
        // event 现在是 {suit, rank} 对象
        for (var i = 0; i < this.choose_card_data.length; i++) {
          var cardid = this.choose_card_data[i].cardid; // 检查是否匹配（兼容新旧两种格式）

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
        } // 🔧【新增】更新已选牌数显示


        this._updateSelectedCountDisplay();
      }.bind(this));
    }
  },
  start: function start() {},
  onDestroy: function onDestroy() {
    this._stopPlayCountdown();

    this._stopBidCountdown(); // 【竞技场】清理竞技场倒计时


    if (this._competitionCountdownTimer) {
      this.unschedule(this._competitionCountdownTick);
      this._competitionCountdownTimer = null;
    } // 🔧【新增】清理本地竞技场倒计时


    if (this._localArenaCountdownTimer) {
      this.unschedule(this._localArenaCountdownTick);
      this._localArenaCountdownTimer = null;
    } // 【竞技场】清理比赛金币显示


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
    } // 🔥【防重复渲染】检查是否与上次相同


    var hash = JSON.stringify(cards);

    if (this._lastRenderHash === hash) {
      return;
    }

    this._lastRenderHash = hash; // 【核心】使用斗地主规则排序：大王 > 小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3

    var sortedCards = this._sortCards(cards); // 【核心】清理所有旧节点（解决背面牌残留）


    this.clearAllCards(); // 创建底牌节点

    this._createBottomCards(); // 隐藏出牌UI


    if (this.playingUI_node) {
      this.playingUI_node.active = false;
    } // 🎬【修复】使用逐张发牌动画


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

    var animDuration = DealConfig.animDuration; // 🔧【修复】确保手牌容器存在

    var cardParent = this.cards_node;

    if (!cardParent) {
      console.error("🎮 [_dealCardsWithAnimation] cards_node 未定义");
      return;
    } // 发牌起始位置（屏幕中央上方，模拟发牌堆）


    var deckPos = cc.v2(DealConfig.deckPosition.x, DealConfig.deckPosition.y); // 逐张发牌

    for (var i = 0; i < sortedCards.length; i++) {
      (function (index) {
        self.scheduleOnce(function () {
          var cardData = sortedCards[index];

          var targetX = self._getCardX(index, sortedCards.length, CardLayout.cardSpacing);

          var targetPos = cc.v2(targetX, CardLayout.cardY); // 创建卡牌节点

          var card = cc.instantiate(self.card_prefab);
          if (!card) return;
          card.scale = CardLayout.cardScale;
          card.parent = cardParent; // 🔧【修复】使用确定的手牌容器
          // 🎬 从发牌堆位置开始

          card.setPosition(deckPos);
          card.active = true;
          card.zIndex = index; // 设置卡牌显示

          var cardComp = card.getComponent("card");

          if (cardComp) {
            cardComp.showCards(cardData, myglobal.playerData.accountID);
          } // 🎬 播放发牌动画


          cc.tween(card).to(animDuration, {
            position: targetPos
          }, {
            easing: 'sineOut'
          }).call(function () {// 动画完成回调
          }).start(); // 🔊 播放发牌音效

          if (isopen_sound) {
            playSound("sound/fapai1");
          }
        }, index * cardInterval);
      })(i);
    } // 发牌完成后回调


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
    this.fapai_end = true; // 通知其他玩家节点

    if (this.node.parent) {
      this.node.parent.emit("pushcard_other_event");
    } // 检查是否需要显示抢地主按钮


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
    var self = this; // 复制数组，避免修改原数据

    var sortedCards = cards.slice(); // 使用 getCardValue 从大到小排序

    sortedCards.sort(function (a, b) {
      var valueA = self.getCardValue(a);
      var valueB = self.getCardValue(b); // 先按 value 从大到小排序

      if (valueA !== valueB) {
        return valueB - valueA;
      } // value 相同时，按花色排序（黑桃 > 红心 > 梅花 > 方块）


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
    } // 清空选中的牌数据


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
    if (!myglobal) return; // 🔧【关键修复】如果在出牌阶段，不显示抢地主按钮

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
    var self = this; // 🔒【防护】先停止之前的倒计时

    this._stopBidCountdown();

    var timeout = duration || this._bidTimeout || 15;
    var expiresAt = this._bidExpiresAt || 0; // 🔧【关键修复】根据服务端过期时间计算剩余时间

    var timeLeft = timeout;

    if (expiresAt > 0) {
      var now = Date.now();
      timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
    }

    this._bidTimeLeft = timeLeft;
    this._isBidCountdownTicking = true;
    this._isBidWarning = false; // 🕐 初始化UI显示

    this._updateBidCountdownUI(); // 🕐 使用 cc.Node 的 schedule 实现每秒 tick


    this.schedule(this._bidCountdownTick, 1);
  },

  /**
   * 🕐【核心Tick】抢地主倒计时每秒执行
   */
  _bidCountdownTick: function _bidCountdownTick() {
    if (!this._isBidCountdownTicking) return;
    this._bidTimeLeft--; // 🕐 更新UI显示

    this._updateBidCountdownUI(); // ⚠️ 5秒：进入警告状态


    if (this._bidTimeLeft === 5) {
      this._enterBidWarningState();
    } // 🔊 3秒：开始滴答音（每秒一次）


    if (this._bidTimeLeft <= 3 && this._bidTimeLeft > 0) {
      this._playTickSound();
    } // ⏰ 0秒：自动处理


    if (this._bidTimeLeft <= 0) {
      this._onBidCountdownEnd();
    }
  },

  /**
   * 🕐【UI更新】更新抢地主倒计时显示
   */
  _updateBidCountdownUI: function _updateBidCountdownUI() {
    var remaining = this._bidTimeLeft;
    var updated = false; // 方式1：使用 properties 绑定的 Label

    if (this.bidCountdownLabel) {
      this.bidCountdownLabel.string = String(remaining);
      updated = true;
    } // 方式2：尝试从 robUI 中查找倒计时 Label


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
            child.setContentSize(50, 50); // 🔧【修复】不通过color设置alpha

            child.color = new cc.Color(255, 255, 255);
            child.zIndex = 100;
            updated = true;
            break;
          }
        }
      }
    } // 方式3：通知 player_node 更新倒计时


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
    this._isBidWarning = true; // 获取倒计时 Label 节点

    var labelNode = this._getBidCountdownLabelNode();

    if (!labelNode) return; // 变红

    labelNode.color = cc.Color.RED; // 🔥 呼吸缩放动画

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
      } // 其他可能的名称


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
    this.unschedule(this._bidCountdownTick); // 停止动画并恢复状态

    var labelNode = this._getBidCountdownLabelNode();

    if (labelNode) {
      labelNode.stopAllActions();
      labelNode.scale = 1;
      labelNode.color = cc.Color.WHITE;
    } // ⚠️【重要】不发送任何请求！
    // 服务器会在超时后自动处理

  },

  /**
   * 🔒【停止】停止抢地主倒计时
   */
  _stopBidCountdown: function _stopBidCountdown() {
    this._isBidCountdownTicking = false;
    this.unschedule(this._bidCountdownTick); // 恢复 Label 状态

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
    var self = this; // 🔒【防护】先停止之前的倒计时

    this._stopPlayCountdown();

    var timeout = duration || this._playTimeout || 15;
    this._playTimeLeft = timeout;
    this._isPlayCountdownTicking = true;
    this._isPlayWarning = false; // 🕐 初始化UI显示

    this._updatePlayCountdownUI(); // 🕐 使用 cc.Node 的 schedule 实现每秒 tick


    this.schedule(this._playCountdownTick, 1);
  },

  /**
   * 🕐【核心Tick】出牌倒计时每秒执行
   */
  _playCountdownTick: function _playCountdownTick() {
    if (!this._isPlayCountdownTicking) return;
    this._playTimeLeft--; // 🕐 更新UI显示

    this._updatePlayCountdownUI(); // ⚠️ 5秒：进入警告状态


    if (this._playTimeLeft === 5) {
      this._enterPlayWarningState();
    } // 🔊 3秒：开始滴答音（每秒一次）


    if (this._playTimeLeft <= 3 && this._playTimeLeft > 0) {
      this._playTickSound();
    } // ⏰ 0秒：自动处理


    if (this._playTimeLeft <= 0) {
      this._onPlayCountdownEnd();
    }
  },

  /**
   * 🕐【UI更新】更新出牌倒计时显示
   * 🔧【修复】只更新闹钟里面的倒计时，不在其他位置显示
   */
  _updatePlayCountdownUI: function _updatePlayCountdownUI() {
    var remaining = this._playTimeLeft; // 方式1：使用 properties 绑定的 Label（如果有）

    if (this.playCountdownLabel) {
      this.playCountdownLabel.string = String(remaining);
    } // 方式2：通知 player_node 更新倒计时


    if (this.node && this.node.parent) {
      var event = new cc.Event.EventCustom("update_countdown_event", true);
      event.setUserData({
        type: "play",
        remaining: remaining
      });
      this.node.parent.dispatchEvent(event);
    } // 方式3：直接更新 playingUI_node 中的闹钟 Label
    // 🔧【修复】闹钟节点路径：playingUI_node -> clock -> playing_clocl_label


    if (this.playingUI_node) {
      var clockNode = this.playingUI_node.getChildByName("clock");

      if (clockNode) {
        // 确保 clock 节点可见
        clockNode.active = true;
        clockNode.opacity = 255; // 查找 playing_clocl_label（注意拼写）

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
    if (!gameSceneNode) return; // 遍历所有子节点，找到 player_node（当前玩家）

    var children = gameSceneNode.children;

    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var playerNodeScript = child.getComponent("player_node");

      if (playerNodeScript && playerNodeScript.seat_index === 0) {
        // 方式1：使用 time_label 属性
        if (playerNodeScript.time_label) {
          playerNodeScript.time_label.string = String(remaining);
        } // 方式2：查找 clockimage 节点中的 Label（与抢地主倒计时类似）


        if (playerNodeScript.clockimage) {
          var clockNode = playerNodeScript.clockimage; // 确保 clockimage 可见

          clockNode.active = true;
          clockNode.opacity = 255; // 查找 clockimage 中的 Label

          var clockChildren = clockNode.children;

          for (var j = 0; j < clockChildren.length; j++) {
            var clockChild = clockChildren[j];
            var label = clockChild.getComponent(cc.Label);

            if (label) {
              label.string = String(remaining);
              clockChild.active = true;
              clockChild.opacity = 255; // 设置合适的字体大小

              label.fontSize = 32;
              label.lineHeight = 40;
              clockChild.setContentSize(50, 50); // 🔧【修复】不通过color设置alpha

              clockChild.color = new cc.Color(255, 255, 255);
              clockChild.zIndex = 100;
              break;
            }
          } // 如果 clockimage 没有 Label 子节点，检查是否直接是 Label


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
    this._isPlayWarning = true; // 获取倒计时 Label 节点

    var labelNode = this._getPlayCountdownLabelNode();

    if (!labelNode) return; // 变红

    labelNode.color = cc.Color.RED; // 🔥 呼吸缩放动画

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
    } // 方式2：从 playingUI_node 的闹钟中获取 Label
    // 🔧【修复】闹钟节点路径：playingUI_node -> clock -> playing_clocl_label


    if (this.playingUI_node) {
      var clockNode = this.playingUI_node.getChildByName("clock");

      if (clockNode) {
        // 查找 playing_clocl_label（注意拼写）
        var clockLabel = clockNode.getChildByName("playing_clocl_label");

        if (clockLabel) {
          return clockLabel;
        } // 备选：查找任何 Label 子节点


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
    this.unschedule(this._playCountdownTick); // 停止动画并恢复状态

    var labelNode = this._getPlayCountdownLabelNode();

    if (labelNode) {
      labelNode.stopAllActions();
      labelNode.scale = 1;
      labelNode.color = cc.Color.WHITE;
    } // ⚠️【重要】不发送任何请求！
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
    this.unschedule(this._playCountdownTick); // 恢复 Label 状态

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
    if (!isopen_sound) return; // 优先使用绑定的音效

    if (this.tickAudio) {
      cc.audioEngine.playEffect(this.tickAudio, false);
      return;
    } // 兜底：使用发牌音效（可替换为专用滴答音效）


    playSound("sound/fapai1");
  },

  /**
   * 🔊 播放滴答音效（用于出牌倒计时）
   */
  _playPlayTickSound: function _playPlayTickSound() {
    if (!isopen_sound) return; // 优先使用绑定的音效

    if (this.tickAudio) {
      cc.audioEngine.playEffect(this.tickAudio, false);
      return;
    } // 兜底：使用发牌音效


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
    var playerID = data.player_id || ""; // 🔒【防重复机制】检查是否已经播放过相同的音效

    var soundKey = playerID + "_" + action + "_" + round + "_" + order;

    if (this._lastRobSoundKey === soundKey) {
      return;
    }

    this._lastRobSoundKey = soundKey; // 不抢

    if (action === "pass") {
      var passSound = gender === "female" ? "m_nv_buqiang" : "m_nan_buqiang";

      this._playSoundEffect(passSound);

      return;
    } // 抢地主


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
        console.warn("🔊 [_playSoundEffect] 加载音效失败: " + name, err.message || err); // 🔧【fallback】尝试播放备用音效

        if (fallback) {
          cc.resources.load("sound/" + fallback, cc.AudioClip, function (err2, clip2) {
            if (err2) {
              console.warn("🔊 [_playSoundEffect] fallback 也失败: " + fallback, err2.message || err2); // 🔧【重要修改】不再自动 fallback 到 "大你"
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
        this._stopPlayCountdown(); // 🔧【修复】只发送不出请求，不本地处理


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
        } // 🔧【调试日志】打印选中的牌（增强版，显示牌名）


        var selectedCardNames = [];

        for (var i = 0; i < this.choose_card_data.length; i++) {
          var card = this.choose_card_data[i];
          var cardData = card.card_data || card;

          var cardName = this._getCardDisplayName(cardData);

          selectedCardNames.push(cardName);
        } // 🔧【新增】客户端牌型验证


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

        this._stopPlayCountdown(); // 🔧【修复】只发送出牌请求，等待服务端广播后再更新手牌
        // 服务端会广播 card_played 消息，由 onOtherPlayerChuCard 处理


        myglobal.socket.request_chu_card(this.choose_card_data, function (err, data) {
          if (err) {
            // 🔧【改进】出牌失败，显示更详细的错误信息
            var errorMsg = data && data.msg || "出牌失败"; // 获取用户选中的牌型

            var selectedType = validationResult.type || "未知牌型";
            var selectedCount = self.choose_card_data.length; // 获取上家的牌型信息

            var lastPlayedType = self._lastPlayedHandType || "未知";
            var lastPlayedCount = self._lastPlayedCards ? self._lastPlayedCards.length : 0; // 🔧【新增】获取上家出的牌名

            var lastPlayedCardNames = "";

            if (self._lastPlayedCards && self._lastPlayedCards.length > 0) {
              var names = [];

              for (var i = 0; i < self._lastPlayedCards.length; i++) {
                names.push(self._getCardDisplayName(self._lastPlayedCards[i]));
              }

              lastPlayedCardNames = names.join(",");
            } // 构建详细的错误提示


            var detailMsg = errorMsg;

            if (errorMsg.indexOf("大不过") >= 0 || errorMsg.indexOf("打不过") >= 0) {
              // 🔧【增强】显示用户选的牌名
              var yourCards = selectedCardNames.join(","); // 牌型不匹配或牌太小

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
            self.playingUI_node.active = false; // 清空选中的牌

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
      console.warn("🎮 [_resetCardFlags] cards_node 未定义，尝试查找手牌容器"); // 尝试通过节点名称查找

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
    } // 重置所有牌的选中状态


    if (cardParent) {
      var children = cardParent.children;

      for (var i = 0; i < children.length; i++) {
        children[i].emit("reset_card_flag");
      }
    } else {
      console.error("🎮 [_resetCardFlags] 找不到手牌容器");
    } // 🔧【新增】清空选牌后更新显示


    this._updateSelectedCountDisplay();
  },

  /**
   * 🔧【新增】更新已选牌数显示
   * ⚠️【修复】用户要求该位置不显示任何文字，已禁用 tipsLabel 显示
   * 仅在控制台输出日志用于调试
   */
  _updateSelectedCountDisplay: function _updateSelectedCountDisplay() {
    var count = this.choose_card_data.length; // 如果没有选中牌，直接返回

    if (count === 0) {
      return;
    } // 获取选中的牌数据


    var cardsToPlay = this.choose_card_data.map(function (c) {
      return c.card_data || c;
    }); // 验证牌型

    var validationResult = this._validateHandType(cardsToPlay); // 构建显示文本（仅用于日志）


    var displayText = "已选 " + count + " 张";

    if (validationResult.valid) {
      displayText += " - " + validationResult.type;
    } else {
      displayText += " - " + validationResult.message;
    } // ⚠️【禁用】不再在 tipsLabel 上显示文字
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
    if (!cards || cards.length === 0) return; // 遍历要删除的牌

    for (var i = 0; i < cards.length; i++) {
      var cardToRemove = cards[i]; // 在手牌中查找并删除

      for (var j = this.handCards.length - 1; j >= 0; j--) {
        if (this.handCards[j].rank === cardToRemove.rank && this.handCards[j].suit === cardToRemove.suit) {
          this.handCards.splice(j, 1);
          break;
        }
      }
    } // 🔧【关键修复】清空选中的牌数据，防止残留


    this.choose_card_data = []; // 🔧【修复】使用静默更新，不触发发牌动画

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
    if (!myglobal) return; // 排序手牌

    var sortedCards = this._sortCards(cards); // 🔧【修复】只使用cards_node，不遍历node.parent


    var cardsParent = this.cards_node;

    if (!cardsParent) {
      console.error("🎮 [_updateHandCardsSilent] cards_node 未定义");
      return;
    } // 🔧【关键修复】先销毁所有旧手牌节点，确保事件监听器被清理


    var oldChildren = cardsParent.children;

    for (var i = oldChildren.length - 1; i >= 0; i--) {
      var child = oldChildren[i]; // 先取消所有事件监听

      child.off(cc.Node.EventType.TOUCH_START); // 再销毁节点

      child.destroy();
    } // 再次确保清空


    cardsParent.removeAllChildren(); // 🔧【关键修复】清空选中的牌数据，防止残留

    this.choose_card_data = []; // 重新创建手牌节点（无动画）

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
    } // 重置渲染哈希，允许后续渲染


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
    } // 重新渲染


    this.renderCards(this.handCards); // 显示出的牌

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

    this.choose_card_data = []; // 请求服务端提示（不使用回调，依赖事件监听器处理响应）

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
      var self = this; // 立即自动不出，不再延迟

      self._stopPlayCountdown();

      var myglobal = window.myglobal;

      if (myglobal && myglobal.socket) {
        myglobal.socket.request_buchu_card([], null);
      }

      if (self.playingUI_node) {
        self.playingUI_node.active = false;
      } // 1.5秒后清空提示文字


      setTimeout(function () {
        self.tipsLabel.string = "";
      }, 1500);
      return;
    } // 选中提示的牌


    this._selectCards(data.cards); // 🔧【修改】去掉桌面上的白色文字提示
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
    var self = this; // 如果没有手牌，不处理

    if (!this.handCards || this.handCards.length === 0) {
      return null;
    } // 统计手牌


    var cardCounts = {};

    for (var i = 0; i < this.handCards.length; i++) {
      var rank = this.handCards[i].rank;

      if (!cardCounts[rank]) {
        cardCounts[rank] = [];
      }

      cardCounts[rank].push(this.handCards[i]);
    } // 如果是新一轮（必须出牌）


    if (this._mustPlay || !this._lastPlayedCards || this._lastPlayedCards.length === 0) {
      return this._findSmallestCards(cardCounts);
    } // 如果不能打过，不提示


    if (!this._canBeat) {
      return null;
    } // 获取上家牌型信息


    var lastType = this._lastPlayedHandType || "";

    var lastRank = this._getLastPlayedMainRank();

    var lastCount = this._lastPlayedCards.length; // 根据牌型查找能打过的最小牌

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
    } // 统计每个点数出现的次数


    var counts = {};

    for (var i = 0; i < this._lastPlayedCards.length; i++) {
      var rank = this._lastPlayedCards[i].rank;
      counts[rank] = (counts[rank] || 0) + 1;
    } // 找出出现次数最多的点数（主牌）


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
    }); // 优先出单张

    for (var i = 0; i < ranks.length; i++) {
      var rank = ranks[i];

      if (cardCounts[rank].length === 1) {
        return [cardCounts[rank][0]];
      }
    } // 没有单张则出最小的对子


    for (var i = 0; i < ranks.length; i++) {
      var rank = ranks[i];

      if (cardCounts[rank].length === 2) {
        return cardCounts[rank];
      }
    } // 出最小的三张


    for (var i = 0; i < ranks.length; i++) {
      var rank = ranks[i];

      if (cardCounts[rank].length === 3) {
        return cardCounts[rank];
      }
    } // 出最小的炸弹


    for (var i = 0; i < ranks.length; i++) {
      var rank = ranks[i];

      if (cardCounts[rank].length === 4) {
        return cardCounts[rank];
      }
    } // 兜底：出最小的牌


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
    } // 没有能打过的单张，尝试炸弹


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
    } // 没有能打过的对子，尝试炸弹


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
    }); // 找三张

    for (var i = 0; i < ranks.length; i++) {
      var rank = ranks[i];

      if (rank > targetRank && cardCounts[rank].length >= 3) {
        var result = [cardCounts[rank][0], cardCounts[rank][1], cardCounts[rank][2]]; // 如果需要带牌

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
    } // 尝试从四张中拆三张


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
    } // 尝试炸弹


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
    } // 没有能打过的炸弹，尝试王炸


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
    } // 🔧【修复】只从手牌容器中查找，不遍历node.parent


    var cardParent = this.cards_node;

    if (!cardParent) {
      console.warn("🎮 [_selectCards] cards_node 未定义，尝试查找手牌容器"); // 尝试通过节点名称查找

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
          var matchKey = cards[j].suit + "_" + cards[j].rank; // 🔧【修复】检查是否已经匹配过这张牌

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
    } // 🔧【关键】设置游戏阶段


    if (gameState.phase === "bidding") {
      this._gamePhase = "bidding";
      this._biddingPhase = "bidding";
    } else if (gameState.phase === "playing") {
      this._gamePhase = "playing";
      this._biddingPhase = "idle";
    } // 恢复玩家信息


    if (gameState.players) {
      for (var i = 0; i < gameState.players.length; i++) {
        var p = gameState.players[i];

        if (p.is_landlord && window.myglobal.playerData) {
          window.myglobal.playerData.master_accountid = p.id;
        }
      } // 🔧【新增】通知其他玩家节点更新


      if (this.node && this.node.parent) {
        this.node.parent.emit("players_restored_event", {
          players: gameState.players
        });
      }
    } // 🔧【关键修复】恢复手牌


    if (gameState.hand) {
      // 🔧【关键】重置渲染哈希，确保手牌会被更新
      this._lastRenderHash = ""; // 保存手牌数据

      this.handCards = gameState.hand; // 标记发牌完成

      this.cardsReady = true;
      this.fapai_end = true; // 🔧【关键】使用静默更新，不触发发牌动画

      this._updateHandCardsSilent(this.handCards);
    } else {} // 恢复底牌


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
    } // 🔧【新增】恢复上家出的牌


    if (gameState.last_played && gameState.last_played.length > 0) {
      this._lastPlayedCards = gameState.last_played;
      this._lastPlayedHandType = gameState.last_played.hand_type || ""; // 🔧【新增】显示上家出的牌

      if (gameState.last_player_id) {
        var gameScene_script = this.node.parent.getComponent("gameScene");

        if (gameScene_script) {
          var outCard_node = gameScene_script.getUserOutCardPosByAccount(gameState.last_player_id);

          if (outCard_node && this.card_prefab) {
            // 清除旧的出牌
            outCard_node.removeAllChildren(); // 显示上家出的牌

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
    } // 恢复出牌轮次


    if (gameState.phase === "playing" && gameState.current_turn) {
      var myPlayerId = window.myglobal.socket.getPlayerInfo().id || window.myglobal.playerData.accountID; // 🔧【关键】隐藏抢地主UI

      this._hideRobUI();

      if (String(gameState.current_turn) === String(myPlayerId)) {
        this.playingUI_node.active = true; // 🔧【新增】保存出牌状态

        this._mustPlay = gameState.must_play || false;
        this._canBeat = gameState.can_beat || false; // 🔧【新增】启动出牌倒计时（如果服务端提供了剩余时间）
        // 注意：服务端应该在重连后发送 can_chu_card_notify 消息来启动倒计时
      } else {
        if (this.playingUI_node) {
          this.playingUI_node.active = false;
        }
      }
    } // 🔧【新增】如果是抢地主阶段


    if (gameState.phase === "bidding") {// 注意：服务端应该在重连后发送 call_landlord_turn_notify 消息来显示抢地主按钮
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
    } // 更新底牌显示


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
    if (!myglobal) return; // 排序手牌

    var sortedCards = this._sortCards(cards); // 🔧【修复】确保手牌容器存在


    var cardsParent = this.cards_node;

    if (!cardsParent) {
      console.error("🃏 [_updateLandlordHandCards] cards_node 未定义");
      return;
    } // 清理旧手牌节点


    cardsParent.removeAllChildren(); // 重新创建手牌节点（无动画）

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
    } // 重置渲染哈希，允许后续渲染


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
    if (!isopen_sound) return; // 🔧【调试】打印完整数据结构

    var handType = data.hand_type || "";
    var gender = data.gender || "male";
    var isNewRound = data.is_new_round !== undefined ? data.is_new_round : true;
    var canBeat = data.can_beat !== undefined ? data.can_beat : false; // 🔧【核心修复】优先从 cards 中提取主牌值

    var rank = this._extractMainRank(data); // 🔊【调试日志】详细输出音效播放参数
    // 🔧【检查】是否是炸弹或王炸（特殊处理）


    var type = (handType || "").toLowerCase();
    var isBomb = type === "bomb" || type === "zhadan" || type === "炸弹";
    var isRocket = type === "rocket" || type === "wangzha" || type === "王炸"; // 炸弹和王炸始终播放对应音效

    if (isBomb || isRocket) {
      var soundName = this._getCardTypeSound(handType, rank, gender);

      if (soundName) {
        this._playSoundEffect(soundName);
      }

      return;
    } // 🔧【核心】获取牌型音效


    var cardSound = this._getCardTypeSound(handType, rank, gender);

    var prefix = gender === "female" ? "m_cp_nv_" : "m_cp_";
    var daniSound = prefix + "dani"; // 🔧【检查】牌型是否有对应的音效文件

    var hasSpecificSound = this._hasSpecificCardSound(handType, rank); // 🔧【核心修复】正确的"大你"播放逻辑
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
        console.warn("🔊 [_playCardSound] ⚠️ 首出但无对应音效文件: " + handType + ", rank=" + rank); // 🔧【重要】首出不播放"大你"，静默跳过
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

    var soundIndex = this._rankToSoundIndex(rank); // 单张：有1-15的音效文件
    // 服务端发送: "单张"


    if (type === "single" || type === "solo" || type.indexOf("单张") !== -1) {
      var hasSound = soundIndex >= 1 && soundIndex <= 15;
      return hasSound;
    } // 对子：只有1-13的音效文件（没有对子14/15，因为大王小王没有对子音效）
    // 服务端发送: "对子"


    if (type === "pair" || type === "double" || type.indexOf("对子") !== -1) {
      var hasSound = soundIndex >= 1 && soundIndex <= 13;
      return hasSound;
    } // 三张：只有1-13的音效文件
    // 服务端发送: "三张"


    if (type === "triple" || type === "three" || type === "trio" || type.indexOf("三张") !== -1) {
      var hasSound = soundIndex >= 1 && soundIndex <= 13;
      return hasSound;
    } // 特殊牌型都有对应音效
    // 服务端发送: "连对", "顺子", "飞机", "飞机带单", "飞机带对", "三带一", "三带二", "四带二", "四带两对", "炸弹", "王炸"


    var specialTypes = [// 英文名称
    "liandui", "straight", "plane", "feiji", "sandaiyi", "sandaidui", "sidaier", "sidailiangdui", "bomb", "zhadan", "rocket", "wangzha", // 中文名称（服务端发送的名称）
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
    } // 如果服务端 rank 无效，从 cards 中提取


    var cards = data.cards || [];
    var handType = (data.hand_type || "").toLowerCase();

    if (cards.length === 0) {
      console.warn("🔊 [_extractMainRank] cards数组为空，无法提取rank");
      return 0;
    } // 对 cards 进行排序（从大到小）


    var sortedCards = cards.slice().sort(function (a, b) {
      return (b.rank || 0) - (a.rank || 0);
    }); // 根据牌型提取主牌
    // 单张

    if (handType.indexOf("single") !== -1 || handType.indexOf("单张") !== -1) {
      var rank = this._extractCardRank(sortedCards[0]);

      return rank;
    } // 对子 - 取任意一张的rank（它们相同）


    if (handType.indexOf("pair") !== -1 || handType.indexOf("对子") !== -1) {
      var rank = this._extractCardRank(sortedCards[0]);

      return rank;
    } // 三张 - 取三张中任意一张的rank


    if (handType.indexOf("triple") !== -1 || handType.indexOf("三张") !== -1 || handType.indexOf("trio") !== -1 || handType.indexOf("three") !== -1) {
      var rank = this._extractCardRank(sortedCards[0]);

      return rank;
    } // 三带一/三带二 - 取最大的三张


    if (handType.indexOf("sandaiyi") !== -1 || handType.indexOf("三带一") !== -1 || handType.indexOf("sandaidui") !== -1 || handType.indexOf("三带二") !== -1) {
      // 统计每个rank出现的次数
      var counts = {};

      for (var i = 0; i < cards.length; i++) {
        var r = cards[i].rank;
        counts[r] = (counts[r] || 0) + 1;
      } // 找到出现次数最多的rank


      var maxCount = 0;
      var mainRank = 0;

      for (var r in counts) {
        if (counts[r] >= 3 && counts[r] > maxCount) {
          maxCount = counts[r];
          mainRank = parseInt(r);
        }
      }

      return mainRank;
    } // 其他牌型 - 取最大的牌


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
    } // 尝试各种可能的字段


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
    var prefix = gender === "female" ? "m_cp_nv_" : "m_cp_"; // 🔧【合法性校验】检查rank是否有效

    if (!rank || rank === 0) {
      console.error("🔊 [_getCardTypeSound] 非法rank: " + rank + ", handType=" + handType);
      return null;
    } // 🔧【修复】将服务端 rank 转换为音效文件编号


    var soundIndex = this._rankToSoundIndex(rank); // 单张（支持中英文）
    // 服务端发送: "单张"
    // 音效文件编号：1=A, 2=2, 3-13=3-K, 14=小王, 15=大王


    if (type === "single" || type === "solo" || type.indexOf("单张") !== -1) {
      if (soundIndex >= 1 && soundIndex <= 15) {
        return prefix + "danzhang_" + soundIndex;
      }

      console.warn("🔊 [_getCardTypeSound] 单张音效索引无效: rank=" + rank + ", soundIndex=" + soundIndex);
      return null;
    } // 对子（支持中英文）
    // 服务端发送: "对子"
    // 音效文件编号：1=A, 2=2, 3-13=3-K（注意：文件只有1-13，没有14/15）


    if (type === "pair" || type === "double" || type.indexOf("对子") !== -1) {
      if (soundIndex >= 1 && soundIndex <= 13) {
        return prefix + "duizi_" + soundIndex;
      }

      console.warn("🔊 [_getCardTypeSound] 对子音效文件不存在: rank=" + rank + ", soundIndex=" + soundIndex);
      return null;
    } // 三张（支持中英文）
    // 服务端发送: "三张"
    // 音效文件编号：1=A, 2=2, 3-13=3-K（注意：文件只有1-13）


    if (type === "triple" || type === "three" || type === "trio" || type.indexOf("三张") !== -1) {
      if (soundIndex >= 1 && soundIndex <= 13) {
        return prefix + "sange_" + soundIndex;
      }

      console.warn("🔊 [_getCardTypeSound] 三张音效文件不存在: rank=" + rank + ", soundIndex=" + soundIndex);
      return null;
    } // 🔧【修复】特殊牌型映射表（支持中英文）


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
    }; // 查找特殊牌型

    for (var key in specialTypes) {
      if (type.indexOf(key) !== -1) {
        var suffix = specialTypes[key]; // 🔧【修复】女版炸弹使用 m_cp_nv_zhadan（如果存在），否则使用男版
        // 注意：目前 m_cp_nv_zhadan.mp3 不存在，所以女版也使用男版炸弹音效

        if (suffix === "zhadan") {
          // 先尝试女版炸弹音效
          if (gender === "female") {
            return "m_cp_zhadan"; // 女版暂时使用男版炸弹音效（因为m_cp_nv_zhadan不存在）
          }

          return "m_cp_zhadan";
        } // 🔧【修复】女版王炸有单独音效


        if (suffix === "wangzha") {
          return prefix + "wangzha";
        }

        return prefix + suffix;
      }
    } // 未知牌型，返回null


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
    var gender = data.gender || "male"; // 男版：随机播放"不要"或"要不起"
    // 文件：m_cp_buyao.mp3, m_cp_yaobuqi.mp3
    // 女版：随机播放"不要"或"要不起"
    // 文件：m_cp_nv_buyao.mp3, m_nv_yaobuqi.wav

    var sounds;

    if (gender === "female") {
      sounds = ["m_cp_nv_buyao", "m_nv_yaobuqi"];
    } else {
      sounds = ["m_cp_buyao", "m_cp_yaobuqi"];
    } // 随机选择一个


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
    if (!outCard_node) return; // 清空出牌区域

    outCard_node.removeAllChildren(true); // 创建"不出"文字显示

    var passNode = new cc.Node("pass_label");
    var label = passNode.addComponent(cc.Label);
    label.string = "不出";
    label.fontSize = 28;
    label.lineHeight = 36;
    passNode.color = cc.color(255, 200, 100); // 添加描边

    var outline = passNode.addComponent(cc.LabelOutline);
    outline.color = cc.color(100, 50, 0);
    outline.width = 2;
    passNode.parent = outCard_node;
    passNode.setPosition(0, 0); // 2秒后自动消失

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
    var rank = card.rank; // 大小王

    if (rank === 17) return "大王";
    if (rank === 16) return "小王"; // 花色名称

    var suitNames = {
      0: "黑桃",
      1: "红心",
      2: "梅花",
      3: "方块",
      4: ""
    };
    var suitName = suitNames[suit] || ""; // 牌面名称

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

    var count = cards.length; // 统计各点数的牌数量

    var rankCounts = {};

    for (var i = 0; i < cards.length; i++) {
      var rank = cards[i].rank;

      if (!rankCounts[rank]) {
        rankCounts[rank] = 0;
      }

      rankCounts[rank]++;
    } // 获取点数列表（排序后）


    var ranks = Object.keys(rankCounts).map(function (r) {
      return parseInt(r);
    }).sort(function (a, b) {
      return a - b;
    }); // 获取数量统计

    var counts = Object.values(rankCounts);
    var fours = []; // 四张

    var threes = []; // 三张

    var pairs = []; // 对子

    var singles = []; // 单张

    for (var rank in rankCounts) {
      var c = rankCounts[rank];
      if (c === 4) fours.push(parseInt(rank));else if (c === 3) threes.push(parseInt(rank));else if (c === 2) pairs.push(parseInt(rank));else if (c === 1) singles.push(parseInt(rank));
    } // 1. 王炸（双王）


    if (count === 2 && rankCounts[16] === 1 && rankCounts[17] === 1) {
      return {
        valid: true,
        type: "王炸",
        message: ""
      };
    } // 2. 单张


    if (count === 1) {
      return {
        valid: true,
        type: "单张",
        message: ""
      };
    } // 3. 对子


    if (count === 2 && pairs.length === 1) {
      return {
        valid: true,
        type: "对子",
        message: ""
      };
    } // 4. 三张


    if (count === 3 && threes.length === 1) {
      return {
        valid: true,
        type: "三张",
        message: ""
      };
    } // 5. 炸弹


    if (count === 4 && fours.length === 1) {
      return {
        valid: true,
        type: "炸弹",
        message: ""
      };
    } // 6. 三带一


    if (count === 4 && threes.length === 1 && singles.length === 1) {
      return {
        valid: true,
        type: "三带一",
        message: ""
      };
    } // 7. 三带二


    if (count === 5 && threes.length === 1 && pairs.length === 1) {
      return {
        valid: true,
        type: "三带二",
        message: ""
      };
    } // 8. 四带二（单）


    if (count === 6 && fours.length === 1 && (singles.length === 2 || pairs.length === 1)) {
      return {
        valid: true,
        type: "四带二",
        message: ""
      };
    } // 9. 四带两对


    if (count === 8 && fours.length === 1 && pairs.length === 2) {
      return {
        valid: true,
        type: "四带两对",
        message: ""
      };
    } // 10. 顺子（至少5张连续，不包含2和王）


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
    } // 11. 连对（至少3对连续）


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
    } // 12. 飞机（至少2个连续三张）


    if (threes.length >= 2) {
      var threeRanks = threes.sort(function (a, b) {
        return a - b;
      });

      var isSequential = this._isSequential(threeRanks);

      var noTwoOrJoker = threeRanks.every(function (r) {
        return r < 15;
      });

      if (isSequential && noTwoOrJoker) {
        var threeCount = threes.length; // 飞机不带翅膀

        if (count === threeCount * 3) {
          return {
            valid: true,
            type: "飞机",
            message: ""
          };
        } // 飞机带单


        if (count === threeCount * 4 && singles.length === threeCount) {
          return {
            valid: true,
            type: "飞机带单",
            message: ""
          };
        } // 飞机带对


        if (count === threeCount * 5 && pairs.length === threeCount) {
          return {
            valid: true,
            type: "飞机带对",
            message: ""
          };
        }
      }
    } // 无效牌型


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
    } // 判断当前玩家是否胜利


    var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID;
    var isWinner = false;
    var myWinGold = 0; // 从 players 数组中找到当前玩家的结果

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
    } // 🔧【关键修复】更新本地玩家的金币数量


    if (myglobal.playerData && myWinGold !== 0) {
      var oldGold = myglobal.playerData.gobal_count || 0;
      var newGold = oldGold + myWinGold; // 确保金币不为负数

      if (newGold < 0) {
        newGold = 0;
      }

      myglobal.playerData.gobal_count = newGold;
    } // 🔧【新增】更新所有玩家的金币显示


    if (data.players && data.players.length > 0) {
      for (var i = 0; i < data.players.length; i++) {
        var player = data.players[i];
        var playerId = player.player_id;
        var goldAfter = player.gold_after; // 🔧【修复】只要 goldAfter >= 0 就更新显示（包括 0 的情况）
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
    } // 播放结果音效


    this._playGameResultSound(isWinner); // 创建结算弹窗


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
    var winSize = cc.winSize; // 🔧【关键修复】找到Canvas节点作为弹窗父节点

    var canvas = cc.find("Canvas") || cc.find("UI_ROOT") || this.node.parent;

    if (!canvas) {
      console.error("🏆 [_createGameResultPopup] 找不到Canvas节点");
      canvas = this.node;
    } // ==================== 遮罩层 ====================


    var maskNode = new cc.Node();
    maskNode.name = "GameResultMask";
    maskNode.addComponent(cc.BlockInputEvents);
    var maskSprite = maskNode.addComponent(cc.Sprite);
    maskSprite.spriteFrame = new cc.SpriteFrame();
    maskSprite.type = cc.Sprite.Type.SIMPLE;
    maskSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    maskNode.width = winSize.width * 2;
    maskNode.height = winSize.height * 2; // 🔧【修复】不通过color设置alpha，使用opacity代替

    maskNode.color = isWinner ? new cc.Color(0, 0, 30) : new cc.Color(30, 0, 0);
    maskNode.opacity = 0;
    maskNode.x = 0;
    maskNode.y = 0;
    maskNode.zIndex = 999; // 🔧【修复】遮罩层zIndex

    maskNode.parent = canvas; // 遮罩淡入动画

    cc.tween(maskNode).to(0.3, {
      opacity: 255
    }).start(); // ==================== 弹窗容器 ====================

    var popupNode = new cc.Node();
    popupNode.name = "GameResultPopup";
    popupNode.x = 0;
    popupNode.y = 0;
    popupNode.scale = 0.5;
    popupNode.opacity = 0;
    popupNode.zIndex = 1000; // 🔧【修复】弹窗层zIndex

    popupNode.parent = canvas; // 弹窗尺寸（70%宽，75%高）

    var popupWidth = Math.min(winSize.width * 0.7, 800);
    var popupHeight = Math.min(winSize.height * 0.75, 550); // ==================== 主背景 - 渐变效果 ====================

    var bgNode = self._createGradientBackground(popupWidth, popupHeight, isWinner);

    bgNode.parent = popupNode; // ==================== 金边描边 ====================

    var borderNode = self._createGoldenBorder(popupWidth, popupHeight, isWinner);

    borderNode.parent = popupNode; // ==================== 粒子特效层 ====================

    var effectLayer = new cc.Node("EffectLayer");
    effectLayer.parent = popupNode; // 胜利粒子特效

    if (isWinner) {
      self._createVictoryParticles(effectLayer, popupWidth, popupHeight);
    } else {
      self._createDefeatParticles(effectLayer, popupWidth, popupHeight);
    } // ==================== 顶部 Banner ====================


    var bannerY = popupHeight / 2 - 60;

    var bannerNode = self._createResultBanner(isWinner, popupWidth);

    bannerNode.y = bannerY;
    bannerNode.parent = popupNode; // ==================== 右侧倍数详情卡 ====================

    var detailX = popupWidth / 2 - 130;
    var detailY = 20;

    var detailNode = self._createMultiplierDetailCard(data, isWinner);

    detailNode.x = detailX;
    detailNode.y = detailY;
    detailNode.parent = popupNode; // ==================== 中间玩家结果列表 ====================

    var listWidth = popupWidth * 0.55;
    var listX = -popupWidth / 2 + listWidth / 2 + 50;
    var listY = -20;

    var playerListNode = self._createPlayerResultList(data, isWinner, myWinGold, listWidth);

    playerListNode.x = listX;
    playerListNode.y = listY;
    playerListNode.parent = popupNode; // ==================== 底部按钮区域 ====================

    var btnY = -popupHeight / 2 + 60;

    var buttonArea = self._createButtonArea(isWinner, function (action) {
      self._closeGameResultPopup(popupNode, maskNode);

      if (callback) callback(action);
    });

    buttonArea.y = btnY;
    buttonArea.parent = popupNode; // ==================== 弹出动画 ====================

    cc.tween(popupNode).to(0.35, {
      scale: 1,
      opacity: 255
    }, {
      easing: 'backOut'
    }).call(function () {
      // 触发数字滚动动画
      self._startNumberAnimations(popupNode, data, myWinGold);
    }).start(); // 保存引用

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
    var graphics = bgNode.addComponent(cc.Graphics); // 渐变色

    var topColor = isWinner ? new cc.Color(40, 30, 80, 255) : new cc.Color(30, 30, 40, 255);
    var bottomColor = isWinner ? new cc.Color(20, 15, 50, 255) : new cc.Color(20, 20, 30, 255); // 绘制渐变矩形（模拟）

    graphics.fillColor = bottomColor;
    graphics.roundRect(-width / 2, -height / 2, width, height, 20);
    graphics.fill(); // 添加内发光效果

    var innerGlow = new cc.Node("InnerGlow");
    var glowSprite = innerGlow.addComponent(cc.Sprite);
    glowSprite.spriteFrame = new cc.SpriteFrame();
    glowSprite.type = cc.Sprite.Type.SLICED;
    innerGlow.width = width - 20;
    innerGlow.height = height - 20; // 🔧【修复】不通过color设置alpha，使用opacity代替

    innerGlow.color = isWinner ? new cc.Color(60, 40, 100) : new cc.Color(40, 40, 50);
    innerGlow.opacity = 100;
    innerGlow.parent = bgNode; // 添加背景纹理效果

    var overlay = new cc.Node("Overlay");
    var overlaySprite = overlay.addComponent(cc.Sprite);
    overlaySprite.spriteFrame = new cc.SpriteFrame();
    overlay.width = width;
    overlay.height = height; // 🔧【修复】不通过color设置alpha，使用opacity代替

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
    var graphics = borderNode.addComponent(cc.Graphics); // 边框颜色

    var borderColor = isWinner ? new cc.Color(255, 200, 50, 255) : new cc.Color(100, 100, 120, 255);
    var glowColor = isWinner ? new cc.Color(255, 180, 0, 150) : new cc.Color(80, 80, 100, 100); // 外发光

    graphics.strokeColor = glowColor;
    graphics.lineWidth = 8;
    graphics.roundRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, 24);
    graphics.stroke(); // 主边框

    graphics.strokeColor = borderColor;
    graphics.lineWidth = 3;
    graphics.roundRect(-width / 2, -height / 2, width, height, 20);
    graphics.stroke(); // 角落装饰

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
    var bannerNode = new cc.Node("ResultBanner"); // Banner背景

    var bgNode = new cc.Node("BannerBg");
    var graphics = bgNode.addComponent(cc.Graphics);
    var bannerWidth = popupWidth * 0.6;
    var bannerHeight = 70;

    if (isWinner) {
      // 胜利 - 金色渐变背景
      graphics.fillColor = new cc.Color(200, 150, 30, 200);
      graphics.roundRect(-bannerWidth / 2, -bannerHeight / 2, bannerWidth, bannerHeight, 35);
      graphics.fill(); // 发光边框

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

    bgNode.parent = bannerNode; // 标题文字

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
    titleNode.color = isWinner ? new cc.Color(255, 255, 255) : new cc.Color(200, 180, 180); // 添加描边

    var outline = titleNode.addComponent(cc.LabelOutline);
    outline.color = isWinner ? new cc.Color(150, 100, 0) : new cc.Color(80, 40, 40);
    outline.width = 3; // 添加发光效果（使用阴影模拟）

    var shadow = titleNode.addComponent(cc.LabelShadow);
    shadow.color = isWinner ? new cc.Color(255, 200, 0, 200) : new cc.Color(100, 50, 50, 150);
    shadow.offset = cc.v2(0, 0);
    shadow.blur = 8;
    titleNode.parent = bannerNode; // 胜利时的呼吸发光动画

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
    bgNode.parent = cardNode; // 标题

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
    titleNode.parent = cardNode; // 分隔线

    var lineNode = new cc.Node("Line");
    var lg = lineNode.addComponent(cc.Graphics);
    lg.strokeColor = new cc.Color(100, 100, 100, 150);
    lg.lineWidth = 1;
    lg.moveTo(-cardWidth / 2 + 15, 0);
    lg.lineTo(cardWidth / 2 - 15, 0);
    lg.stroke();
    lineNode.y = cardHeight / 2 - 50;
    lineNode.parent = cardNode; // 详情列表

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
      var itemNode = new cc.Node("Item_" + i); // 标签

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
      labelNode.parent = itemNode; // 值

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
    } // 总倍数（大号金色）


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
    multiValueNode.color = isWinner ? new cc.Color(255, 200, 50) : new cc.Color(200, 200, 200); // 添加描边

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
    var listHeight = 260; // 列表背景

    var bgNode = new cc.Node("ListBg");
    var graphics = bgNode.addComponent(cc.Graphics);
    graphics.fillColor = new cc.Color(0, 0, 0, 80);
    graphics.roundRect(-listWidth / 2, -listHeight / 2, listWidth, listHeight, 12);
    graphics.fill();
    bgNode.parent = listNode; // 表头

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
    headerNode.parent = listNode; // 分隔线

    var sepNode = new cc.Node("Separator");
    var sg = sepNode.addComponent(cc.Graphics);
    sg.strokeColor = new cc.Color(100, 100, 100, 100);
    sg.lineWidth = 1;
    sg.moveTo(-listWidth / 2 + 15, 0);
    sg.lineTo(listWidth / 2 - 15, 0);
    sg.stroke();
    sepNode.y = listHeight / 2 - 45;
    sepNode.parent = listNode; // 玩家列表

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
    var itemHeight = 55; // 当前玩家高亮背景

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
    } // 头像区域


    var avatarNode = new cc.Node("Avatar");
    avatarNode.x = -listWidth / 2 + 45; // 头像背景（圆形）

    var avatarBg = new cc.Node("AvatarBg");
    var ag = avatarBg.addComponent(cc.Graphics);
    var isLandlord = player.role === "landlord"; // 绘制圆形头像框

    ag.strokeColor = isLandlord ? new cc.Color(255, 200, 50, 255) : new cc.Color(180, 180, 200, 255);
    ag.lineWidth = 3;
    ag.circle(0, 0, 22);
    ag.stroke();
    ag.fillColor = new cc.Color(60, 60, 80, 200);
    ag.circle(0, 0, 20);
    ag.fill();
    avatarBg.parent = avatarNode; // 尝试加载头像

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
    }); // 身份图标

    var roleIconNode = new cc.Node("RoleIcon");
    var roleLabel = roleIconNode.addComponent(cc.Label);
    roleLabel.string = isLandlord ? "👑" : "🌾";
    roleLabel.fontSize = 14;
    roleIconNode.x = 18;
    roleIconNode.y = -15;
    roleIconNode.parent = avatarNode;
    avatarNode.parent = itemNode; // 玩家名称

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
    nameNode.parent = itemNode; // 身份

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
    roleNode.parent = itemNode; // 输赢金额

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
    winLabel.verticalAlign = cc.Label.VerticalAlign.CENTER; // 添加描边

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
    var areaNode = new cc.Node("ButtonArea"); // 继续游戏按钮

    var continueBtn = self._createStyledButton("继续游戏", isWinner, true);

    continueBtn.x = -100;
    continueBtn.parent = areaNode;
    continueBtn.on(cc.Node.EventType.TOUCH_END, function () {
      if (callback) callback("continue");
    }); // 返回大厅按钮

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
    var btnHeight = 50; // 🔧【修复】设置按钮节点的内容大小，确保点击区域正确

    btnNode.setContentSize(btnWidth, btnHeight);
    btnNode.setAnchorPoint(0.5, 0.5); // 🔧【修复】添加 BlockInputEvents 组件，确保按钮可以接收点击事件

    btnNode.addComponent(cc.BlockInputEvents); // 按钮背景

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
    graphics.fill(); // 边框

    if (isPrimary && isWinner) {
      graphics.strokeColor = new cc.Color(255, 220, 100, 255);
      graphics.lineWidth = 2;
      graphics.roundRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 25);
      graphics.stroke();
    } // 按钮文字


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
    labelNode.color = new cc.Color(255, 255, 255); // 添加描边

    var outline = labelNode.addComponent(cc.LabelOutline);
    outline.color = new cc.Color(0, 0, 0);
    outline.width = 2;
    labelNode.parent = btnNode; // 点击效果

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
    var self = this; // 金币粒子

    for (var i = 0; i < 15; i++) {
      (function (index) {
        var coin = new cc.Node("Coin_" + index);
        coin.x = (Math.random() - 0.5) * width;
        coin.y = height / 2 + 50; // 绘制金币

        var g = coin.addComponent(cc.Graphics);
        g.fillColor = new cc.Color(255, 200, 50, 255);
        g.circle(0, 0, 8);
        g.fill();
        g.strokeColor = new cc.Color(200, 150, 30, 255);
        g.lineWidth = 1;
        g.circle(0, 0, 8);
        g.stroke();
        coin.parent = parent; // 下落动画

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
    } // 星光闪烁


    for (var j = 0; j < 8; j++) {
      (function (index) {
        var star = new cc.Node("Star_" + index);
        star.x = (Math.random() - 0.5) * width * 0.8;
        star.y = (Math.random() - 0.5) * height * 0.8; // 绘制星星

        var sg = star.addComponent(cc.Graphics);
        sg.fillColor = new cc.Color(255, 255, 200, 200);

        self._drawStar(sg, 0, 0, 6, 5);

        star.parent = parent;
        star.opacity = 0; // 闪烁动画

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
        particle.y = (Math.random() - 0.5) * height; // 绘制粒子

        var g = particle.addComponent(cc.Graphics);
        g.fillColor = new cc.Color(80, 100, 150, 150);
        g.circle(0, 0, 4 + Math.random() * 3);
        g.fill();
        particle.parent = parent;
        particle.opacity = 0; // 缓慢漂浮动画

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
        }).start(); // 循环

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
    var self = this; // 倍数滚动动画

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
      var progress = Math.min(elapsed / duration, 1); // 使用缓动函数

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
    var self = this; // 停止所有粒子动画

    if (this._resultEffectLayer) {
      this._resultEffectLayer.stopAllActions();

      var children = this._resultEffectLayer.children;

      for (var i = 0; i < children.length; i++) {
        children[i].stopAllActions();
      }
    } // 弹窗缩小淡出动画


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
    } // 遮罩淡出


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
    } // 🔧【新增】检查玩家豆子是否足够继续游戏


    var playerGold = myglobal.playerData.gobal_count || 0;
    var roomConfig = myglobal.currentRoomConfig || {};
    var minGold = roomConfig.min_gold || roomConfig.minGold || 0;

    if (playerGold < minGold) {
      // 豆子不足，显示豆子不足弹窗
      this._showInsufficientGoldPopup(playerGold, minGold);

      return;
    } // 豆子足够，继续游戏


    this._doContinueGame();
  },

  /**
   * 🔧【新增】执行继续游戏逻辑
   */
  _doContinueGame: function _doContinueGame() {
    // 清理当前游戏状态
    this._resetGameState(); // 发送 ready 请求（准备下一局）


    var myglobal = window.myglobal;

    if (myglobal && myglobal.socket && myglobal.socket.requestReady) {
      myglobal.socket.requestReady();
    } // 显示等待提示


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
    var self = this; // 关闭结算弹窗

    this._closeGameResultPopup(); // 创建豆子不足弹窗


    var canvas = cc.director.getScene().getChildByName("Canvas");
    if (!canvas) return;
    var winSize = cc.winSize; // 遮罩层

    var maskNode = new cc.Node("InsufficientGoldMask");
    maskNode.addComponent(cc.BlockInputEvents);
    var maskSprite = maskNode.addComponent(cc.Sprite);
    maskSprite.spriteFrame = new cc.SpriteFrame();
    maskSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    maskNode.width = winSize.width * 2;
    maskNode.height = winSize.height * 2;
    maskNode.color = new cc.Color(0, 0, 0);
    maskNode.opacity = 180;
    maskNode.parent = canvas; // 弹窗容器

    var popupNode = new cc.Node("InsufficientGoldPopup");
    popupNode.x = 0;
    popupNode.y = 0;
    popupNode.parent = canvas; // 弹窗背景

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
    bgNode.parent = popupNode; // 标题

    var titleNode = new cc.Node("Title");
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = "豆子不足";
    titleLabel.fontSize = 28;
    titleLabel.fontFamily = "Arial";
    titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    titleNode.color = new cc.Color(255, 200, 100);
    titleNode.y = popupHeight / 2 - 45;
    titleNode.parent = popupNode; // 分隔线

    var lineNode = new cc.Node("Line");
    var lg = lineNode.addComponent(cc.Graphics);
    lg.strokeColor = new cc.Color(100, 80, 60);
    lg.lineWidth = 1;
    lg.moveTo(-popupWidth / 2 + 30, popupHeight / 2 - 80);
    lg.lineTo(popupWidth / 2 - 30, popupHeight / 2 - 80);
    lg.stroke();
    lineNode.parent = popupNode; // 内容区域

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
    contentNode.parent = popupNode; // 按钮区域

    var btnAreaNode = new cc.Node("ButtonArea");
    btnAreaNode.y = -popupHeight / 2 + 60;
    btnAreaNode.parent = popupNode; // 观看广告按钮

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
    adLabelNode.parent = adBtn; // 返回大厅按钮

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
    lobbyLabelNode.parent = lobbyBtn; // 存储节点引用

    self._insufficientGoldPopup = popupNode;
    self._insufficientGoldMask = maskNode; // 观看广告按钮点击事件

    adBtn.on(cc.Node.EventType.TOUCH_END, function () {
      self._watchAdForGold(function (success) {
        if (success) {
          // 广告观看成功，关闭弹窗并继续游戏
          self._closeInsufficientGoldPopup();

          self._doContinueGame();
        }
      });
    }); // 返回大厅按钮点击事件

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
    var self = this; // 检查是否有广告SDK（可根据实际集成的广告SDK调整）
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
    } // 方式2: 如果集成了微信小游戏广告SDK


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
    } // 方式3: 模拟广告（开发测试用）
    // 在实际发布时应该删除此分支或替换为真实广告SDK


    self._showMessage("正在加载广告..."); // 模拟广告观看过程（2秒后奖励豆子）


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
    } // 奖励豆子数量（可根据实际需求调整）


    var rewardAmount = 5000; // 更新本地豆子数量

    myglobal.playerData.updateGold(rewardAmount); // 显示奖励提示

    this._showMessage("获得 " + this._formatGold(rewardAmount) + " 豆子！"); // 通知服务端（如果需要同步）


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
    } // 奖励豆子数量（可根据实际需求调整）


    var rewardAmount = 5000; // 更新本地豆子数量

    myglobal.playerData.updateGold(rewardAmount); // 显示奖励提示

    this._showMessage("获得 " + this._formatGold(rewardAmount) + " 豆子！"); // 通知服务端（如果需要同步）


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
    this._resetGameState(); // 发送离开房间请求


    var myglobal = window.myglobal;

    if (myglobal && myglobal.socket && myglobal.socket.leaveRoom) {
      myglobal.socket.leaveRoom();
    } else {
      console.error("🎮 [_returnToLobby] myglobal.socket.leaveRoom 不可用");
    } // 加载大厅场景


    cc.director.loadScene("hallScene", function () {});
  },

  /**
   * 重置游戏状态
   */
  _resetGameState: function _resetGameState() {
    // 清理手牌
    this.handCards = [];
    this.bottomCards = [];
    this.choose_card_data = []; // 清理卡牌节点

    this.clearAllCards(); // 🔧【修复】清理所有玩家的出牌区域（桌面上的牌）

    this._clearAllOutCardZones(); // 🔧【修复】清理底牌节点


    this._clearBottomCards(); // 重置游戏阶段


    this._gamePhase = "idle";
    this._biddingPhase = "idle"; // 隐藏所有UI

    this._hideRobUI();

    if (this.playingUI_node) {
      this.playingUI_node.active = false;
    } // 🔧【新增】重置所有玩家的准备图标状态


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
    } // 获取玩家座位节点


    var players_seat_pos = gameScene_script.players_seat_pos;

    if (!players_seat_pos) {
      console.warn("🎮 [_clearAllOutCardZones] 无法获取 players_seat_pos");
      return;
    } // 遍历所有座位，清理出牌区域


    var children = players_seat_pos.children;

    for (var i = 0; i < children.length; i++) {
      var seatNode = children[i]; // 查找出牌区域节点（cardsoutzone0, cardsoutzone1, cardsoutzone2）

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
    } // 遍历所有玩家节点，找到匹配的玩家并更新金币显示


    for (var i = 0; i < gameScene_script.playerNodeList.length; i++) {
      var playerNode = gameScene_script.playerNodeList[i];
      if (!playerNode) continue;
      var playerScript = playerNode.getComponent("player_node");
      if (!playerScript) continue; // 匹配玩家ID

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
    console.log("🏟️ [_updatePlayerMatchCoinDisplay] 更新玩家竞技币: playerId=", playerId, "matchCoin=", matchCoin); // 获取 gameScene 脚本

    var gameScene_script = this.node.parent ? this.node.parent.getComponent("gameScene") : null;

    if (!gameScene_script || !gameScene_script.playerNodeList) {
      console.warn("🏟️ [_updatePlayerMatchCoinDisplay] 无法获取 gameScene 或 playerNodeList");
      return;
    } // 遍历所有玩家节点，找到匹配的玩家并更新竞技币显示


    for (var i = 0; i < gameScene_script.playerNodeList.length; i++) {
      var playerNode = gameScene_script.playerNodeList[i];
      if (!playerNode) continue;
      var playerScript = playerNode.getComponent("player_node");
      if (!playerScript) continue; // 匹配玩家ID

      if (String(playerScript.accountid) === String(playerId)) {
        // 更新竞技币显示
        if (playerScript.globalcount_label) {
          playerScript.globalcount_label.string = String(matchCoin);
          console.log("🏟️ [_updatePlayerMatchCoinDisplay] 已更新玩家 ", playerId, " 的竞技币显示为 ", matchCoin);
        } // 🔧【新增】保存竞技币到玩家脚本实例


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
    var self = this; // 🔧【关键】检查是否是最终结算（只有3人参赛）
    // 如果是最终结算，跳过此弹窗，等待 onCompetitionChampion 消息显示排名

    if (data.is_final_round) {
      console.log("🏆 [_showCompetitionResultPopup] 检测到最终结算（只有3人），跳过中间结算弹窗，等待排名消息"); // 不显示中间弹窗，直接等待 onCompetitionChampion 消息

      return;
    }

    var winSize = cc.winSize;
    var myglobal = window.myglobal;
    var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID; // 判断输赢

    var isWinner = false;
    var myWinGold = 0;
    var myMatchCoin = 0; // 🔧【新增】当前玩家的金币（从data.players获取）

    if (data.players && data.players.length > 0) {
      for (var i = 0; i < data.players.length; i++) {
        var player = data.players[i];

        if (String(player.player_id) === String(myPlayerId)) {
          isWinner = player.is_winner;
          myWinGold = player.win_gold; // 🔧【修复】从服务端返回的玩家数据中获取金币

          if (player.match_coin !== undefined && player.match_coin >= 0) {
            myMatchCoin = player.match_coin;
          }

          break;
        }
      }
    } // 🔧【修复】更新当前玩家的金币显示


    this._matchCoin = myMatchCoin; // 🔧【新增】更新所有玩家的金币显示

    if (data.players && data.players.length > 0) {
      for (var i = 0; i < data.players.length; i++) {
        var player = data.players[i];
        var playerId = player.player_id;
        var matchCoin = player.match_coin; // 🔧【修复】竞技场模式下更新玩家的金币显示

        if (matchCoin !== undefined && matchCoin >= 0) {
          this._updatePlayerMatchCoinDisplay(playerId, matchCoin);
        }
      }
    }

    var canvas = cc.find("Canvas") || cc.find("UI_ROOT") || this.node.parent;
    if (!canvas) canvas = this.node; // 遮罩层

    var maskNode = new cc.Node("CompetitionResultMask");
    maskNode.addComponent(cc.BlockInputEvents);
    maskNode.color = isWinner ? new cc.Color(0, 30, 50) : new cc.Color(30, 0, 0);
    maskNode.opacity = 200;
    maskNode.width = winSize.width * 2;
    maskNode.height = winSize.height * 2;
    maskNode.zIndex = 999;
    maskNode.parent = canvas; // 弹窗容器

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
    bgNode.parent = popupNode; // 标题

    var titleNode = new cc.Node("Title");
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = isWinner ? "🎉 胜利 🎉" : "✖ 失败 ✖";
    titleLabel.fontSize = 36;
    titleNode.color = isWinner ? new cc.Color(100, 255, 200) : new cc.Color(255, 150, 150);
    titleNode.y = popupHeight / 2 - 50;
    titleNode.parent = popupNode; // 🔧【修复】输赢金额 - 竞技场显示"金币"（不是竞技币）

    var resultNode = new cc.Node("Result");
    var resultLabel = resultNode.addComponent(cc.Label);
    resultLabel.string = "本局结果: " + (myWinGold >= 0 ? "+" : "") + myWinGold + " 金币";
    resultLabel.fontSize = 28;
    resultNode.color = myWinGold >= 0 ? new cc.Color(100, 255, 100) : new cc.Color(255, 100, 100);
    resultNode.y = popupHeight / 2 - 100;
    resultNode.parent = popupNode; // 倍数

    var multiNode = new cc.Node("Multiplier");
    var multiLabel = multiNode.addComponent(cc.Label);
    multiLabel.string = "本局倍数: x" + (data.multiple || 1);
    multiLabel.fontSize = 24;
    multiNode.color = new cc.Color(255, 220, 150);
    multiNode.y = popupHeight / 2 - 140;
    multiNode.parent = popupNode; // 🔧【修复】当前金币（不是竞技币）

    var coinNode = new cc.Node("MatchCoin");
    var coinLabel = coinNode.addComponent(cc.Label);
    coinLabel.string = "当前金币: " + this._matchCoin;
    coinLabel.fontSize = 24;
    coinNode.color = new cc.Color(255, 200, 100);
    coinNode.y = popupHeight / 2 - 180;
    coinNode.parent = popupNode; // ============================================================
    // 🔧【修复】竞技场倒计时
    // 不显示"继续游戏"和"返回大厅"按钮
    // 显示服务端控制的30秒倒计时
    // 🔧【关键修复】从 game_over 数据中获取初始倒计时，立即启动本地倒计时
    // ============================================================
    // 🔧【关键】从服务端数据获取初始倒计时值

    var initialCountdown = data.arena_countdown || 30; // 倒计时显示容器

    var countdownContainer = new cc.Node("CountdownContainer");
    countdownContainer.y = -popupHeight / 2 + 80;
    countdownContainer.parent = popupNode; // 倒计时文字

    var countdownLabel = new cc.Node("CountdownLabel");
    var countdownLabelComp = countdownLabel.addComponent(cc.Label);
    countdownLabelComp.string = "下一轮将在 " + initialCountdown + " 秒后开始";
    countdownLabelComp.fontSize = 26;
    countdownLabel.color = new cc.Color(255, 215, 0); // 金黄色

    countdownLabel.parent = countdownContainer; // 倒计时数字（大号显示）

    var countdownNumber = new cc.Node("CountdownNumber");
    var countdownNumberComp = countdownNumber.addComponent(cc.Label);
    countdownNumberComp.string = String(initialCountdown);
    countdownNumberComp.fontSize = 48;
    countdownNumber.color = new cc.Color(255, 255, 255);
    countdownNumber.y = -45;
    countdownNumber.parent = countdownContainer; // 添加描边效果

    var outline = countdownNumber.addComponent(cc.LabelOutline);
    outline.color = cc.Color.BLACK;
    outline.width = 2; // 弹出动画

    cc.tween(popupNode).to(0.35, {
      scale: 1,
      opacity: 255
    }, {
      easing: 'backOut'
    }).start(); // 保存引用

    this._gameResultPopup = popupNode;
    this._gameResultMask = maskNode;
    this._countdownLabelNode = countdownLabel;
    this._countdownNumberNode = countdownNumber;
    this._arenaCountdownSeconds = initialCountdown; // 播放音效

    this._playGameResultSound(isWinner); // ============================================================
    // 🔧【关键修复】立即启动本地倒计时定时器
    // 同时注册服务端消息监听，双保险确保倒计时正常工作
    // ============================================================
    // 启动本地倒计时定时器


    this._startLocalArenaCountdown(initialCountdown); // 注册服务端倒计时消息监听（作为备份）


    this._setupArenaCountdownListeners();
  },

  /**
   * 🔧【新增】启动本地竞技场倒计时
   * @param {Number} seconds - 初始倒计时秒数
   */
  _startLocalArenaCountdown: function _startLocalArenaCountdown(seconds) {
    var self = this;
    console.log("🏟️ [_startLocalArenaCountdown] 开始启动倒计时, seconds:", seconds); // 停止之前的倒计时

    if (this._localArenaCountdownTimer) {
      this.unschedule(this._localArenaCountdownTick);
      this._localArenaCountdownTimer = null;
    }

    this._arenaCountdownSeconds = seconds; // 🔧【修复】确保初始UI正确显示

    this._updateArenaCountdownUI(seconds); // 🔧【修复】使用 cc.director 的时间调度，确保在所有情况下都能工作
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
      console.log("🏟️ [_localArenaCountdownTick] 倒计时结束，等待服务端消息..."); // 🔧【修复】倒计时归0后显示等待提示，继续等待服务端消息
      // 服务端会发送 MsgArenaAutoReady 或新一轮游戏消息

      this._updateArenaCountdownUI(0);

      this._showWaitingForServer();

      return;
    }

    this._arenaCountdownSeconds--; // 更新UI

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
    } // 隐藏数字


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
    } // 监听倒计时开始消息（如果服务端重新发送）


    myglobal.socket.onArenaRoundCountdown(function (data) {
      console.log("🏟️ [onArenaRoundCountdown] 收到倒计时开始:", data); // 同步服务端的倒计时值

      self._arenaCountdownSeconds = data.seconds || 30;

      self._updateArenaCountdownUI(data.seconds);
    }); // 监听倒计时每秒更新消息（同步服务端的倒计时）

    myglobal.socket.onArenaCountdownTick(function (data) {
      console.log("🏟️ [onArenaCountdownTick] 服务端倒计时同步:", data.seconds); // 🔧【关键】同步服务端的倒计时值，确保与服务端一致

      self._arenaCountdownSeconds = data.seconds;

      self._updateArenaCountdownUI(data.seconds);
    }); // 监听自动准备消息

    myglobal.socket.onArenaAutoReady(function (data) {
      console.log("🏟️ [onArenaAutoReady] 自动准备:", data.message); // 停止本地倒计时

      if (self._localArenaCountdownTimer) {
        self.unschedule(self._localArenaCountdownTick);
        self._localArenaCountdownTimer = null;
      }

      self._showArenaAutoReadyMessage(data.message);
    }); // 监听断线重连状态恢复

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
    } // 更新数字


    if (this._countdownNumberNode) {
      var numLabel = this._countdownNumberNode.getComponent(cc.Label);

      if (numLabel) {
        numLabel.string = String(seconds);
      } // 最后5秒闪烁效果


      if (seconds <= 5 && seconds > 0) {
        cc.tween(this._countdownNumberNode).to(0.1, {
          scale: 1.2
        }).to(0.1, {
          scale: 1.0
        }).start(); // 变红

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
    } // 重置倒计时秒数


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
    } // 隐藏数字


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
    this._matchCoin = data.match_coin || 0; // 如果是竞技场模式，显示比赛金币

    if (this._isCompetition) {
      this._showMatchCoinDisplay();
    }
  },

  /**
   * 🕐【竞技场】处理竞技场倒计时
   * @param {Object} data - { countdown, message }
   */
  _onCompetitionCountdown: function _onCompetitionCountdown(data) {
    this._competitionCountdown = data.countdown || 15; // 停止之前的倒计时

    if (this._competitionCountdownTimer) {
      this.unschedule(this._competitionCountdownTick);
    } // 开始新的倒计时


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

    this._competitionCountdown--; // 更新倒计时显示

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
    var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID; // 只更新自己的比赛金币

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
    if (!myglobal) return; // 创建比赛金币显示节点

    var matchCoinNode = new cc.Node("MatchCoinDisplay");
    matchCoinNode.setPosition(-200, 280); // 左上角位置
    // 背景

    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics);
    bg.fillColor = new cc.Color(50, 40, 80, 200);
    bg.roundRect(-80, -20, 160, 40, 10);
    bg.fill();
    bgNode.parent = matchCoinNode; // 图标（金币图标）

    var iconNode = new cc.Node("Icon");
    var iconLabel = iconNode.addComponent(cc.Label);
    iconLabel.string = "🪙";
    iconLabel.fontSize = 20;
    iconNode.setPosition(-55, 0);
    iconNode.parent = matchCoinNode; // 标签

    var labelNode = new cc.Node("Label");
    var label = labelNode.addComponent(cc.Label);
    label.string = "比赛金币";
    label.fontSize = 14;
    labelNode.color = new cc.Color(200, 200, 200);
    labelNode.setPosition(-20, 0);
    labelNode.parent = matchCoinNode; // 数值

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
        valueNode.getComponent(cc.Label).string = String(matchCoin); // 如果有增量，显示动画

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
    if (!this._matchCoinNode) return; // 创建变化量显示节点

    var deltaNode = new cc.Node("Delta");
    var deltaLabel = deltaNode.addComponent(cc.Label);
    deltaLabel.string = (delta >= 0 ? "+" : "") + delta;
    deltaLabel.fontSize = 24;
    deltaNode.color = delta >= 0 ? new cc.Color(100, 255, 100) : new cc.Color(255, 100, 100);
    deltaNode.setPosition(80, 0);
    deltaNode.parent = this._matchCoinNode; // 飘字动画

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

    this._stopBidCountdown(); // 隐藏比赛金币显示


    this._hideMatchCoinDisplay(); // 显示淘汰弹窗


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
    if (!canvas) canvas = this.node; // 遮罩层

    var maskNode = new cc.Node("EliminatedMask");
    maskNode.addComponent(cc.BlockInputEvents);
    maskNode.color = new cc.Color(0, 0, 0);
    maskNode.opacity = 180;
    maskNode.width = winSize.width * 2;
    maskNode.height = winSize.height * 2;
    maskNode.zIndex = 999;
    maskNode.parent = canvas; // 弹窗容器

    var popupNode = new cc.Node("EliminatedPopup");
    popupNode.scale = 0.5;
    popupNode.opacity = 0;
    popupNode.zIndex = 1000;
    popupNode.parent = canvas;
    var popupWidth = 400;
    var popupHeight = 350; // 背景

    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics);
    bg.fillColor = new cc.Color(60, 40, 50, 240);
    bg.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 20);
    bg.fill();
    bg.strokeColor = new cc.Color(150, 100, 100);
    bg.lineWidth = 3;
    bg.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 20);
    bg.stroke();
    bgNode.parent = popupNode; // 标题

    var titleNode = new cc.Node("Title");
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = "❌ 比赛结束 ❌";
    titleLabel.fontSize = 32;
    titleNode.color = new cc.Color(255, 150, 150);
    titleNode.y = popupHeight / 2 - 50;
    titleNode.parent = popupNode; // 排名

    var rankNode = new cc.Node("Rank");
    var rankLabel = rankNode.addComponent(cc.Label);
    rankLabel.string = "最终排名: 第 " + data.rank + " 名";
    rankLabel.fontSize = 24;
    rankNode.color = new cc.Color(255, 220, 150);
    rankNode.y = popupHeight / 2 - 100;
    rankNode.parent = popupNode; // 淘汰原因

    var reasonNode = new cc.Node("Reason");
    var reasonLabel = reasonNode.addComponent(cc.Label);
    reasonLabel.string = data.reason || "比赛失利";
    reasonLabel.fontSize = 18;
    reasonNode.color = new cc.Color(200, 200, 200);
    reasonNode.y = popupHeight / 2 - 140;
    reasonNode.parent = popupNode; // 参赛人数

    var totalNode = new cc.Node("Total");
    var totalLabel = totalNode.addComponent(cc.Label);
    totalLabel.string = "共 " + (data.total_players || 0) + " 人参赛";
    totalLabel.fontSize = 16;
    totalNode.color = new cc.Color(180, 180, 180);
    totalNode.y = popupHeight / 2 - 180;
    totalNode.parent = popupNode; // 奖励（如果有）

    if (data.rewards) {
      var rewardNode = new cc.Node("Reward");
      var rewardLabel = rewardNode.addComponent(cc.Label);
      rewardLabel.string = "获得奖励: " + (data.rewards.name || JSON.stringify(data.rewards));
      rewardLabel.fontSize = 18;
      rewardNode.color = new cc.Color(255, 200, 100);
      rewardNode.y = popupHeight / 2 - 220;
      rewardNode.parent = popupNode;
    } // 返回大厅按钮


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
    btnLabelNode.parent = btnNode; // 点击事件

    btnNode.on(cc.Node.EventType.TOUCH_END, function () {
      // 销毁弹窗
      popupNode.destroy();
      maskNode.destroy(); // 返回大厅

      self._returnToLobby();
    }); // 弹出动画

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
    this._matchCoin = data.match_coin; // 更新比赛金币显示

    this._updateMatchCoinDisplay(data.match_coin, 0); // 显示晋级提示


    this._showAdvanceToast(data);
  },

  /**
   * ⬆️【竞技场】显示晋级提示
   * @param {Object} data - { current_round, total_rounds, match_coin, message }
   */
  _showAdvanceToast: function _showAdvanceToast(data) {
    var self = this;
    var winSize = cc.winSize; // 创建Toast节点

    var toastNode = new cc.Node("AdvanceToast");
    toastNode.setPosition(0, 100);
    toastNode.opacity = 0;
    toastNode.zIndex = 2000;
    toastNode.parent = this.node; // 背景

    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics);
    bg.fillColor = new cc.Color(50, 100, 50, 220);
    bg.roundRect(-150, -25, 300, 50, 25);
    bg.fill();
    bgNode.parent = toastNode; // 文字

    var labelNode = new cc.Node("Label");
    var label = labelNode.addComponent(cc.Label);
    label.string = "🎉 晋级成功！第 " + data.current_round + "/" + data.total_rounds + " 轮";
    label.fontSize = 22;
    labelNode.color = new cc.Color(255, 255, 200);
    labelNode.parent = toastNode; // 动画

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

    this._stopBidCountdown(); // 隐藏比赛金币显示


    this._hideMatchCoinDisplay(); // 显示冠军弹窗


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
    if (!canvas) canvas = this.node; // 🔧【关闭之前的结算弹窗】

    if (this._gameResultPopup || this._gameResultMask) {
      this._closeGameResultPopup(this._gameResultPopup, this._gameResultMask);
    } // 遮罩层


    var maskNode = new cc.Node("ChampionMask");
    maskNode.addComponent(cc.BlockInputEvents);
    maskNode.color = new cc.Color(20, 15, 40);
    maskNode.opacity = 220;
    maskNode.width = winSize.width * 2;
    maskNode.height = winSize.height * 2;
    maskNode.zIndex = 999;
    maskNode.parent = canvas; // 弹窗容器

    var popupNode = new cc.Node("ChampionPopup");
    popupNode.scale = 0.5;
    popupNode.opacity = 0;
    popupNode.zIndex = 1000;
    popupNode.parent = canvas; // 🔧【调整】增大弹窗尺寸以容纳更多排名

    var popupWidth = 520;
    var popupHeight = 620; // 背景

    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics);
    bg.fillColor = new cc.Color(45, 35, 70, 245);
    bg.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 20);
    bg.fill();
    bg.strokeColor = new cc.Color(255, 200, 80);
    bg.lineWidth = 3;
    bg.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 20);
    bg.stroke();
    bgNode.parent = popupNode; // 标题

    var titleNode = new cc.Node("Title");
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = "🏆 比赛结束 🏆";
    titleLabel.fontSize = 32;
    titleLabel.enableBold = true;
    titleNode.color = new cc.Color(255, 220, 100);
    titleNode.y = popupHeight / 2 - 40;
    titleNode.parent = popupNode; // 🔧【新增】前三名展示区

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
    } // 🔧【新增】其他排名列表标题


    if (rankings.length > 3) {
      var otherTitleNode = new cc.Node("OtherTitle");
      var otherTitleLabel = otherTitleNode.addComponent(cc.Label);
      otherTitleLabel.string = "—— 其他排名 ——";
      otherTitleLabel.fontSize = 18;
      otherTitleNode.color = new cc.Color(180, 180, 200);
      otherTitleNode.y = topThreeY - 100;
      otherTitleNode.parent = popupNode; // 🔧【新增】其他排名列表（第4-20名）

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
    } // 按钮区域


    var btnY = -popupHeight / 2 + 50; // 确定按钮

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
    }); // 弹出动画

    cc.tween(popupNode).to(0.4, {
      scale: 1,
      opacity: 255
    }, {
      easing: 'backOut'
    }).start(); // 粒子特效

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
    itemNode.setPosition(x, y); // 排名背景

    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics); // 根据排名设置不同颜色

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
    bgNode.parent = itemNode; // 排名标签

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
    rankLabelNode.parent = itemNode; // 玩家名称

    var nameLabelNode = new cc.Node("NameLabel");
    var nameLabel = nameLabelNode.addComponent(cc.Label);
    nameLabel.string = rankInfo.player_name || "玩家";
    nameLabel.fontSize = 14;
    nameLabelNode.color = new cc.Color(255, 255, 255);
    nameLabelNode.y = -8;
    nameLabelNode.parent = itemNode; // 金币数

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
    console.log("🏆 [_onTournamentFinalRank] 收到最终榜单数据:", JSON.stringify(data)); // 停止所有倒计时

    this._stopPlayCountdown();

    this._stopBidCountdown();

    if (this._localArenaCountdownTimer) {
      this.unschedule(this._localArenaCountdownTick);
      this._localArenaCountdownTimer = null;
    } // 隐藏比赛金币显示


    this._hideMatchCoinDisplay(); // 关闭之前的结算弹窗


    if (this._gameResultPopup || this._gameResultMask) {
      this._closeGameResultPopup(this._gameResultPopup, this._gameResultMask);
    } // 显示最终榜单弹窗


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
    if (!canvas) canvas = this.node; // ========== 遮罩层 ==========

    var maskNode = new cc.Node("FinalRankMask");
    maskNode.addComponent(cc.BlockInputEvents);
    maskNode.color = new cc.Color(10, 5, 30);
    maskNode.opacity = 200;
    maskNode.width = winSize.width * 2;
    maskNode.height = winSize.height * 2;
    maskNode.zIndex = 999;
    maskNode.parent = canvas; // ========== 弹窗容器 ==========

    var popupNode = new cc.Node("FinalRankPopup");
    popupNode.scale = 0.3;
    popupNode.opacity = 0;
    popupNode.zIndex = 1000;
    popupNode.parent = canvas; // 弹窗尺寸（高度改为屏幕高度的85%，避免溢出）

    var popupWidth = 600;
    var popupHeight = Math.floor(winSize.height * 0.85); // ========== 主背景 ==========

    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics);
    bg.fillColor = new cc.Color(30, 22, 54, 250);
    bg.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 16);
    bg.fill();
    bg.strokeColor = new cc.Color(255, 200, 80);
    bg.lineWidth = 3;
    bg.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 16);
    bg.stroke();
    bgNode.parent = popupNode; // ========== 顶部标题区域 ==========

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
    titleNode.parent = popupNode; // 参赛人数

    var totalNode = new cc.Node("Total");
    var totalLabel = totalNode.addComponent(cc.Label);
    totalLabel.string = "共 " + (data.total_players || 3) + " 人参赛";
    totalLabel.fontSize = 16;
    totalLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    totalNode.color = new cc.Color(200, 200, 220);
    totalNode.y = popupHeight / 2 - 75;
    totalNode.parent = popupNode; // ========== TOP3 领奖台（紧凑布局）==========

    var top3 = data.top3 || [];
    var podiumY = popupHeight / 2 - 145;
    var podiumSpacing = 170; // 银牌（第二名）- 左侧

    if (top3.length >= 2) {
      this._createPodiumEntry(popupNode, top3[1], 2, -podiumSpacing, podiumY);
    } // 金牌（第一名）- 中间（最高）


    if (top3.length >= 1) {
      this._createPodiumEntry(popupNode, top3[0], 1, 0, podiumY + 20);
    } // 铜牌（第三名）- 右侧


    if (top3.length >= 3) {
      this._createPodiumEntry(popupNode, top3[2], 3, podiumSpacing, podiumY - 10);
    } // ========== 第4-20名滚动列表区域 ==========


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
      listTitleNode.parent = popupNode; // 创建滚动视图容器

      var scrollViewNode = new cc.Node("ScrollView");
      scrollViewNode.width = popupWidth - 40;
      scrollViewNode.height = 280;
      scrollViewNode.y = -30;
      scrollViewNode.parent = popupNode; // 添加遮罩组件

      var mask = scrollViewNode.addComponent(cc.Mask);
      mask.type = cc.Mask.Type.RECT; // 创建内容容器

      var contentNode = new cc.Node("Content");
      contentNode.width = popupWidth - 40;
      contentNode.anchorY = 1;
      contentNode.y = scrollViewNode.height / 2;
      contentNode.parent = scrollViewNode; // 🔧【修复】过滤掉已在TOP3中的玩家，避免重复显示

      var top3PlayerIDs = {};

      for (var i = 0; i < top3.length; i++) {
        if (top3[i] && top3[i].player_id) {
          top3PlayerIDs[top3[i].player_id] = true;
        }
      } // 只显示第4名及之后的玩家（过滤掉TOP3）


      var filteredTop20 = [];

      for (var i = 0; i < top20.length; i++) {
        var rankData = top20[i]; // 跳过已在TOP3中的玩家

        if (rankData && rankData.player_id && !top3PlayerIDs[rankData.player_id]) {
          filteredTop20.push(rankData);
        }
      } // 添加每个排行项


      var itemHeight = 45;
      var startY = 0;

      for (var i = 0; i < filteredTop20.length; i++) {
        var rankData = filteredTop20[i];
        var actualRank = i + 4; // 第4名开始

        var itemNode = this._createRankListItem(rankData, actualRank, popupWidth - 50);

        itemNode.y = startY - i * itemHeight - itemHeight / 2;
        itemNode.parent = contentNode;
      } // 设置内容高度


      contentNode.height = Math.max(filteredTop20.length * itemHeight, 280); // 添加触摸滚动

      this._addScrollViewTouch(scrollViewNode, contentNode, 280);
    } // ========== 底部区域（我的排名 + 按钮）==========
    // 分隔线


    var sepNode = new cc.Node("BottomSep");
    var sep = sepNode.addComponent(cc.Graphics);
    sep.strokeColor = new cc.Color(255, 200, 80, 100);
    sep.lineWidth = 1;
    sep.moveTo(-popupWidth / 2 + 30, 0);
    sep.lineTo(popupWidth / 2 - 30, 0);
    sep.stroke();
    sepNode.y = -popupHeight / 2 + 140;
    sepNode.parent = popupNode; // 我的排名背景

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
    myRankBgNode.parent = popupNode; // 我的排名文字

    var myRankNode = new cc.Node("MyRank");
    var myRankLabel = myRankNode.addComponent(cc.Label);
    myRankLabel.string = "我的排名: 第 " + (data.my_rank || 1) + " 名  |  比赛金币: " + (data.my_match_coin || 0);
    myRankLabel.fontSize = 20;
    myRankLabel.enableBold = true;
    myRankLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    myRankNode.color = new cc.Color(255, 230, 150);
    myRankNode.y = -popupHeight / 2 + 100;
    myRankNode.parent = popupNode; // ========== 确定按钮 ==========

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
    btnLabel.parent = btnNode; // 按钮触摸效果

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
    }); // ========== 弹出动画 ==========

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
    itemNode.height = 42; // 背景（交替颜色）

    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics);

    if (rank % 2 === 0) {
      bg.fillColor = new cc.Color(45, 38, 70, 180);
    } else {
      bg.fillColor = new cc.Color(38, 32, 58, 180);
    }

    bg.roundRect(-width / 2, -20, width, 40, 6);
    bg.fill();
    bgNode.parent = itemNode; // 排名

    var rankNode = new cc.Node("Rank");
    var rankLabel = rankNode.addComponent(cc.Label);
    rankLabel.string = String(rank);
    rankLabel.fontSize = 18;
    rankLabel.enableBold = true;
    rankLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    rankNode.color = new cc.Color(255, 200, 100);
    rankNode.setPosition(-width / 2 + 35, 0);
    rankNode.parent = itemNode; // 🔧【新增】玩家头像

    var avatarNode = new cc.Node("Avatar");
    avatarNode.setPosition(-width / 2 + 75, 0);
    var avatarSprite = avatarNode.addComponent(cc.Sprite);
    avatarSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    avatarNode.setContentSize(32, 32);
    avatarNode.parent = itemNode; // 加载头像

    this._loadAvatarSprite(avatarSprite, rankData.avatar, rankData.is_robot); // 玩家名称


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
    nameNode.parent = itemNode; // 金币

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
      var newY = contentStartY + deltaY; // 限制滚动范围

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
    entryNode.setPosition(x, y); // ========== 排名背景（根据排名设置颜色）==========

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
    bg.fill(); // 边框

    bg.strokeColor = borderColor;
    bg.lineWidth = 2;
    bg.roundRect(-55, -70, 110, 140, 12);
    bg.stroke();
    bgNode.parent = entryNode; // ========== 排名奖牌图标 ==========

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

    medal.fillColor = medalColor; // 绘制圆形奖牌

    medal.circle(0, 45, 22);
    medal.fill();
    medal.strokeColor = new cc.Color(255, 255, 255, 150);
    medal.lineWidth = 2;
    medal.circle(0, 45, 22);
    medal.stroke();
    medalNode.parent = entryNode; // 奖牌上的数字

    var rankNumNode = new cc.Node("RankNum");
    var rankNumLabel = rankNumNode.addComponent(cc.Label);
    rankNumLabel.string = String(rank);
    rankNumLabel.fontSize = 24;
    rankNumLabel.enableBold = true;
    rankNumLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    rankNumNode.color = new cc.Color(50, 40, 30);
    rankNumNode.setPosition(0, 45);
    rankNumNode.parent = entryNode; // ========== 玩家头像 ==========

    var avatarNode = new cc.Node("Avatar");
    avatarNode.setPosition(0, 20);
    var avatarSprite = avatarNode.addComponent(cc.Sprite);
    avatarSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    avatarNode.setContentSize(50, 50);
    avatarNode.parent = entryNode; // 🔧【新增】加载头像

    this._loadAvatarSprite(avatarSprite, rankData.avatar, rankData.is_robot); // 头像边框


    var avatarFrameNode = new cc.Node("AvatarFrame");
    var avatarFrame = avatarFrameNode.addComponent(cc.Graphics);
    avatarFrame.strokeColor = borderColor;
    avatarFrame.lineWidth = 2;
    avatarFrame.circle(0, 20, 26);
    avatarFrame.stroke();
    avatarFrameNode.parent = entryNode; // ========== 玩家名称 ==========

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
    nameLabelNode.parent = entryNode; // ========== 比赛金币 ==========

    var coinLabelNode = new cc.Node("Coin");
    var coinLabel = coinLabelNode.addComponent(cc.Label);
    coinLabel.string = (rankData.match_coin || 0) + " 金币";
    coinLabel.fontSize = 16;
    coinLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    coinLabelNode.color = new cc.Color(255, 230, 150);
    coinLabelNode.y = -25;
    coinLabelNode.parent = entryNode; // ========== 不再显示机器人AI标签 ==========
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
    } // 否则，生成"智能陪练X号"格式的名称


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
    if (!sprite) return; // 机器人使用默认头像（avatar_1 到 avatar_3 随机）

    if (isRobot) {
      var robotAvatarIndex = Math.floor(Math.random() * 3) + 1;
      var defaultPath = "UI/headimage/avatar_" + robotAvatarIndex;
      cc.resources.load(defaultPath, cc.SpriteFrame, function (err, spriteFrame) {
        if (!err && spriteFrame && sprite.isValid) {
          sprite.spriteFrame = spriteFrame;
        }
      });
      return;
    } // 真人玩家


    if (!avatarUrl || avatarUrl === "") {
      // 使用默认头像
      cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function (err, spriteFrame) {
        if (!err && spriteFrame && sprite.isValid) {
          sprite.spriteFrame = spriteFrame;
        }
      });
      return;
    } // 判断是URL还是本地资源名


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