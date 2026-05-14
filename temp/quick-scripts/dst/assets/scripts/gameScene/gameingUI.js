
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
    } // 🔧【关键修复】预加载卡牌精灵图集


    this._preloadCardAtlas(); // 🔧【修复】确保手牌容器节点存在


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

  /**
   * 🔧【新增】预加载卡牌精灵图集
   * 确保在发牌之前图集已经准备好
   */
  _preloadCardAtlas: function _preloadCardAtlas() {
    // 检查是否已经加载
    if (window._cardAtlasLoaded) {
      return;
    }

    cc.resources.load("UI/card/card", cc.SpriteAtlas, function (err, atlas) {
      if (err) {
        console.error("🃏 [_preloadCardAtlas] 加载卡牌图集失败:", err);
        return;
      }

      window._cardAtlasLoaded = true;
      window._cardAtlas = atlas;
      console.log("🃏 [_preloadCardAtlas] 卡牌图集预加载成功");
    });
  },
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2dhbWVTY2VuZS9nYW1laW5nVUkuanMiXSwibmFtZXMiOlsiaXNvcGVuX3NvdW5kIiwid2luZG93IiwicWlhbl9zdGF0ZSIsImJ1cWlhbmciLCJxaWFuIiwiQ2FyZHNWYWx1ZSIsIlJvb21TdGF0ZSIsIl9hdWRpb0NsaXBzIiwiQ2FyZExheW91dCIsImNhcmRTY2FsZSIsImNhcmRZIiwiY2FyZFNwYWNpbmciLCJib3R0b21DYXJkU2NhbGUiLCJib3R0b21DYXJkU3BhY2luZyIsIm91dENhcmRTY2FsZSIsIm91dENhcmRTcGFjaW5nIiwiRGVhbENvbmZpZyIsImFuaW1EdXJhdGlvbiIsImRlY2tQb3NpdGlvbiIsImNjIiwidjIiLCJjYXJkSW50ZXJ2YWwiLCJwbGF5U291bmQiLCJwYXRoIiwiYXVkaW9FbmdpbmUiLCJwbGF5IiwicmVzb3VyY2VzIiwibG9hZCIsIkF1ZGlvQ2xpcCIsImVyciIsImNsaXAiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJnYW1laW5nVUkiLCJOb2RlIiwiY2FyZF9wcmVmYWIiLCJQcmVmYWIiLCJyb2JVSSIsImJvdHRvbV9jYXJkX3Bvc19ub2RlIiwicGxheWluZ1VJX25vZGUiLCJ0aXBzTGFiZWwiLCJMYWJlbCIsImNhcmRzX25vZGUiLCJiaWRDb3VudGRvd25MYWJlbCIsInBsYXlDb3VudGRvd25MYWJlbCIsInRpY2tBdWRpbyIsInR5cGUiLCJvbkxvYWQiLCJteWdsb2JhbCIsImNvbnNvbGUiLCJlcnJvciIsIl9wcmVsb2FkQ2FyZEF0bGFzIiwiZ2FtZVNjZW5lTm9kZSIsIm5vZGUiLCJwYXJlbnQiLCJpIiwiY2hpbGRyZW4iLCJsZW5ndGgiLCJjaGlsZCIsIm5hbWUiLCJuZXdDYXJkc05vZGUiLCJzZXRQb3NpdGlvbiIsInNldEFuY2hvclBvaW50Iiwic2V0Q29udGVudFNpemUiLCJzaXplIiwiaGFuZENhcmRzIiwiYm90dG9tQ2FyZHMiLCJjaG9vc2VfY2FyZF9kYXRhIiwicm9iX3BsYXllcl9hY2NvdW50aWQiLCJfYmlkZGluZ1BoYXNlIiwiX2dhbWVQaGFzZSIsImNhcmRzUmVhZHkiLCJfYmlkVGltZW91dCIsIl9wbGF5VGltZW91dCIsIl9iaWRDb3VudGRvd25UaW1lciIsIl9wbGF5Q291bnRkb3duVGltZXIiLCJfYmlkVGltZUxlZnQiLCJfcGxheVRpbWVMZWZ0IiwiX2lzQmlkQ291bnRkb3duVGlja2luZyIsIl9pc1BsYXlDb3VudGRvd25UaWNraW5nIiwiX2lzQmlkV2FybmluZyIsIl9pc1BsYXlXYXJuaW5nIiwiX2JpZEV4cGlyZXNBdCIsImJvdHRvbV9jYXJkIiwiX2lzQ29tcGV0aXRpb24iLCJfcm9vbUNhdGVnb3J5IiwiX21hdGNoQ29pbiIsIl9jb21wZXRpdGlvblJvdW5kIiwiX2NvbXBldGl0aW9uVG90YWxSb3VuZHMiLCJfY29tcGV0aXRpb25Db3VudGRvd24iLCJfY29tcGV0aXRpb25Db3VudGRvd25UaW1lciIsIl93YXNEaXNjb25uZWN0ZWQiLCJzb2NrZXQiLCJvblB1c2hDYXJkcyIsImRhdGEiLCJsb2ciLCJKU09OIiwic3RyaW5naWZ5IiwiY2FyZHMiLCJib3R0b21fY2FyZHMiLCJfZ2FtZVJlc3VsdFBvcHVwIiwiX2dhbWVSZXN1bHRNYXNrIiwiX2Nsb3NlR2FtZVJlc3VsdFBvcHVwIiwiX3N0b3BBcmVuYUNvdW50ZG93biIsIl9jbGVhckFsbE91dENhcmRab25lcyIsInJlbmRlckNhcmRzIiwiYmluZCIsIm9uQmlkVHVybiIsIm9uQmlkUmVzdWx0IiwiX3N0b3BCaWRDb3VudGRvd24iLCJlbWl0IiwicGxheWVyX2lkIiwiYWNjb3VudGlkIiwiYmlkIiwic3RhdGUiLCJvbkNhblJvYlN0YXRlIiwib25DYW5DaHVDYXJkIiwicGxheWVySWQiLCJteVBsYXllcklkIiwiZ2V0UGxheWVySW5mbyIsImlkIiwicGxheWVyRGF0YSIsInNlcnZlclBsYXllcklkIiwiYWNjb3VudElEIiwiX3N0b3BQbGF5Q291bnRkb3duIiwiX211c3RQbGF5IiwibXVzdF9wbGF5IiwiX2NhbkJlYXQiLCJjYW5fYmVhdCIsIl9sYXN0UGxheWVkQ2FyZHMiLCJTdHJpbmciLCJfaGlkZVJvYlVJIiwiY2xlYXJPdXRab25lIiwiYWN0aXZlIiwidGltZW91dCIsIl9zdGFydFBsYXlDb3VudGRvd24iLCJvbk90aGVyUGxheWVyQ2h1Q2FyZCIsImlzX3Bhc3MiLCJfcGxheVBhc3NTb3VuZCIsIl9zaG93UGFzc0VmZmVjdCIsIl9sYXN0UGxheWVkSGFuZFR5cGUiLCJoYW5kX3R5cGUiLCJzb2NrZXRJbmZvIiwiYWNjb3VudElkIiwiaXNTZWxmIiwiX3JlbW92ZUNhcmRzRnJvbUhhbmQiLCJfcGxheUNhcmRTb3VuZCIsImdhbWVTY2VuZV9zY3JpcHQiLCJnZXRDb21wb25lbnQiLCJvdXRDYXJkX25vZGUiLCJnZXRVc2VyT3V0Q2FyZFBvc0J5QWNjb3VudCIsIm5vZGVfY2FyZHMiLCJjYXJkIiwiaW5zdGFudGlhdGUiLCJjYXJkU2NyaXB0Iiwic2hvd0NhcmRzIiwicHVzaCIsInNob3dPdXRDYXJkcyIsImNhcmRzX2xlZnQiLCJ1bmRlZmluZWQiLCJjb3VudCIsIm9uQ2FsbExhbmRsb3JkU3RhcnQiLCJvbkNhbGxMYW5kbG9yZFR1cm4iLCJfcHJvY2Vzc0NhbGxMYW5kbG9yZFR1cm4iLCJvbkNhbGxMYW5kbG9yZFJlc3VsdCIsIl9wbGF5Um9iU291bmQiLCJvbkNhbGxMYW5kbG9yZEVuZCIsIl9zaG93Qm90dG9tQ2FyZHNUb0FsbCIsIm9uTGFuZGxvcmRDYXJkcyIsImxhbmRsb3JkSWQiLCJsYW5kbG9yZF9pZCIsIl91cGRhdGVMYW5kbG9yZEhhbmRDYXJkcyIsIm9uUmVzdGFydEdhbWUiLCJjbGVhckFsbENhcmRzIiwib25QbGF5U3RhcnQiLCJvbkdhbWVPdmVyIiwiX3Jlc2V0QWxsUGxheWVyUmVhZHlTdGF0ZSIsIl9zaG93R2FtZVJlc3VsdFBvcHVwIiwib25HYW1lU3RhdGVSZXN0b3JlIiwicmVzdG9yZUdhbWVTdGF0ZSIsIm9uSGludFJlc3VsdCIsIl9vbkhpbnRSZXN1bHQiLCJvblRydXN0ZWVTdGF0ZU5vdGlmeSIsIl9vblRydXN0ZWVTdGF0ZU5vdGlmeSIsIm9uQ29tcGV0aXRpb25TdGF0dXMiLCJfb25Db21wZXRpdGlvblN0YXR1cyIsIm9uQ29tcGV0aXRpb25Db3VudGRvd24iLCJfb25Db21wZXRpdGlvbkNvdW50ZG93biIsIm9uTWF0Y2hDb2luVXBkYXRlIiwiX29uTWF0Y2hDb2luVXBkYXRlIiwib25Db21wZXRpdGlvbkVsaW1pbmF0ZWQiLCJfb25Db21wZXRpdGlvbkVsaW1pbmF0ZWQiLCJvbkNvbXBldGl0aW9uQWR2YW5jZSIsIl9vbkNvbXBldGl0aW9uQWR2YW5jZSIsIm9uQ29tcGV0aXRpb25DaGFtcGlvbiIsIl9vbkNvbXBldGl0aW9uQ2hhbXBpb24iLCJvblRvdXJuYW1lbnRGaW5hbFJhbmsiLCJfb25Ub3VybmFtZW50RmluYWxSYW5rIiwib24iLCJnYW1lU2NlbmVfbm9kZSIsImV2ZW50IiwiX3VwZGF0ZVNlbGVjdGVkQ291bnREaXNwbGF5IiwiY2FyZGlkIiwic3VpdCIsInJhbmsiLCJzcGxpY2UiLCJzdGFydCIsIl9jYXJkQXRsYXNMb2FkZWQiLCJTcHJpdGVBdGxhcyIsImF0bGFzIiwiX2NhcmRBdGxhcyIsIm9uRGVzdHJveSIsInVuc2NoZWR1bGUiLCJfY29tcGV0aXRpb25Db3VudGRvd25UaWNrIiwiX2xvY2FsQXJlbmFDb3VudGRvd25UaW1lciIsIl9sb2NhbEFyZW5hQ291bnRkb3duVGljayIsIl9oaWRlTWF0Y2hDb2luRGlzcGxheSIsImhhc2giLCJfbGFzdFJlbmRlckhhc2giLCJzb3J0ZWRDYXJkcyIsIl9zb3J0Q2FyZHMiLCJfY3JlYXRlQm90dG9tQ2FyZHMiLCJfZGVhbENhcmRzV2l0aEFuaW1hdGlvbiIsInNlbGYiLCJjYXJkUGFyZW50IiwiZGVja1BvcyIsIngiLCJ5IiwiaW5kZXgiLCJzY2hlZHVsZU9uY2UiLCJjYXJkRGF0YSIsInRhcmdldFgiLCJfZ2V0Q2FyZFgiLCJ0YXJnZXRQb3MiLCJzY2FsZSIsInpJbmRleCIsImNhcmRDb21wIiwidHdlZW4iLCJ0byIsInBvc2l0aW9uIiwiZWFzaW5nIiwiY2FsbCIsInRvdGFsRGVhbFRpbWUiLCJfb25EZWFsQ2FyZHNDb21wbGV0ZSIsImZhcGFpX2VuZCIsIl9jaGVja0FuZFNob3dSb2JVSSIsImdldENhcmRWYWx1ZSIsInNsaWNlIiwic29ydCIsImEiLCJiIiwidmFsdWVBIiwidmFsdWVCIiwicmVtb3ZlQWxsQ2hpbGRyZW4iLCJ3YXJuIiwic3BhY2luZyIsInRvdGFsV2lkdGgiLCJzdGFydFgiLCJkZXN0cm95IiwiYm90dG9tWSIsImJvdHRvbVN0YXJ0WCIsImRpX2NhcmQiLCJfc2hvd0JpZFVJIiwicm91bmQiLCJleHBpcmVzQXQiLCJleHBpcmVzX2F0IiwiY29uZmlybVRleHQiLCJjYW5jZWxUZXh0IiwiY29uZmlybUJ0biIsImdldENoaWxkQnlOYW1lIiwiY2FuY2VsQnRuIiwibGFiZWwiLCJzdHJpbmciLCJfc3RhcnRCaWRDb3VudGRvd24iLCJkdXJhdGlvbiIsInRpbWVMZWZ0Iiwibm93IiwiRGF0ZSIsIk1hdGgiLCJtYXgiLCJmbG9vciIsIl91cGRhdGVCaWRDb3VudGRvd25VSSIsInNjaGVkdWxlIiwiX2JpZENvdW50ZG93blRpY2siLCJfZW50ZXJCaWRXYXJuaW5nU3RhdGUiLCJfcGxheVRpY2tTb3VuZCIsIl9vbkJpZENvdW50ZG93bkVuZCIsInJlbWFpbmluZyIsInVwZGF0ZWQiLCJjbG9ja05vZGUiLCJqIiwib3BhY2l0eSIsImZvbnRTaXplIiwibGluZUhlaWdodCIsImNvbG9yIiwiQ29sb3IiLCJsYWJlbE5vZGUiLCJfZ2V0QmlkQ291bnRkb3duTGFiZWxOb2RlIiwiUkVEIiwic3RvcEFsbEFjdGlvbnMiLCJyZXBlYXRGb3JldmVyIiwibGFiZWxOYW1lcyIsIldISVRFIiwiX3VwZGF0ZVBsYXlDb3VudGRvd25VSSIsIl9wbGF5Q291bnRkb3duVGljayIsIl9lbnRlclBsYXlXYXJuaW5nU3RhdGUiLCJfb25QbGF5Q291bnRkb3duRW5kIiwiRXZlbnQiLCJFdmVudEN1c3RvbSIsInNldFVzZXJEYXRhIiwiZGlzcGF0Y2hFdmVudCIsImNsb2NrTGFiZWwiLCJfdXBkYXRlQ2xvY2tUaW1lTGFiZWwiLCJwbGF5ZXJOb2RlU2NyaXB0Iiwic2VhdF9pbmRleCIsInRpbWVfbGFiZWwiLCJjbG9ja2ltYWdlIiwiY2xvY2tDaGlsZHJlbiIsImNsb2NrQ2hpbGQiLCJkaXJlY3RMYWJlbCIsIl9nZXRQbGF5Q291bnRkb3duTGFiZWxOb2RlIiwicGxheUVmZmVjdCIsIl9wbGF5UGxheVRpY2tTb3VuZCIsImFjdGlvbiIsImdlbmRlciIsIm9yZGVyIiwicGxheWVySUQiLCJzb3VuZEtleSIsIl9sYXN0Um9iU291bmRLZXkiLCJwYXNzU291bmQiLCJfcGxheVNvdW5kRWZmZWN0Iiwic291bmRzIiwiX3BsYXlSYW5kb21Tb3VuZCIsImZhbGxiYWNrIiwiYWxsb3dEYW5pRmFsbGJhY2siLCJtZXNzYWdlIiwiZXJyMiIsImNsaXAyIiwicmFuZG9tIiwib25CdXR0b25DbGljayIsImN1c3RvbURhdGEiLCJyZXF1ZXN0QmlkIiwicmVxdWVzdFJvYlN0YXRlIiwicmVxdWVzdF9idWNodV9jYXJkIiwiX29uSGludEJ1dHRvbkNsaWNrIiwic2V0VGltZW91dCIsInNlbGVjdGVkQ2FyZE5hbWVzIiwiY2FyZF9kYXRhIiwiY2FyZE5hbWUiLCJfZ2V0Q2FyZERpc3BsYXlOYW1lIiwiY2FyZHNUb1BsYXkiLCJtYXAiLCJjIiwidmFsaWRhdGlvblJlc3VsdCIsIl92YWxpZGF0ZUhhbmRUeXBlIiwidmFsaWQiLCJyZXF1ZXN0X2NodV9jYXJkIiwiZXJyb3JNc2ciLCJtc2ciLCJzZWxlY3RlZFR5cGUiLCJzZWxlY3RlZENvdW50IiwibGFzdFBsYXllZFR5cGUiLCJsYXN0UGxheWVkQ291bnQiLCJsYXN0UGxheWVkQ2FyZE5hbWVzIiwibmFtZXMiLCJqb2luIiwiZGV0YWlsTXNnIiwiaW5kZXhPZiIsInlvdXJDYXJkcyIsIl9yZXNldENhcmRGbGFncyIsImRpc3BsYXlUZXh0IiwicHVzaFRocmVlQ2FyZCIsImNhcmRUb1JlbW92ZSIsIl91cGRhdGVIYW5kQ2FyZHNTaWxlbnQiLCJjYXJkc1BhcmVudCIsIm9sZENoaWxkcmVuIiwib2ZmIiwiRXZlbnRUeXBlIiwiVE9VQ0hfU1RBUlQiLCJkZXN0b3J5Q2FyZCIsImNob29zZV9jYXJkIiwiZGVzdHJveV9jYXJkIiwiX2dldE91dENhcmROb2RlIiwic2VsZWN0ZWROb2RlcyIsImZsYWciLCJzZW5kSGludFJlcXVlc3QiLCJfc2VsZWN0Q2FyZHMiLCJfZmluZFBsYXlhYmxlQ2FyZHMiLCJsYXN0U2VsZWN0ZWQiLCJjYXJkQ291bnRzIiwiX2ZpbmRTbWFsbGVzdENhcmRzIiwibGFzdFR5cGUiLCJsYXN0UmFuayIsIl9nZXRMYXN0UGxheWVkTWFpblJhbmsiLCJsYXN0Q291bnQiLCJ0b0xvd2VyQ2FzZSIsIl9maW5kQmVhdGluZ1NpbmdsZSIsIl9maW5kQmVhdGluZ1BhaXIiLCJfZmluZEJlYXRpbmdUcmlwbGUiLCJfZmluZEJlYXRpbmdCb21iIiwiX2ZpbmRCZWF0aW5nQnlDb3VudCIsImNvdW50cyIsIm1heENvdW50IiwibWFpblJhbmsiLCJwYXJzZUludCIsInJhbmtzIiwiT2JqZWN0Iiwia2V5cyIsInIiLCJ0YXJnZXRSYW5rIiwiX2ZpbmRTbWFsbGVzdEJvbWIiLCJraWNrZXJzIiwicmVzdWx0Iiwia2lja2VyQ2FyZHMiLCJfZmluZEtpY2tlckNhcmRzIiwiY29uY2F0IiwiZXhjbHVkZVJhbmsiLCJhdmFpbGFibGUiLCJtaW4iLCJfZmluZFJvY2tldCIsImpva2VycyIsImZvdW5kQ291bnQiLCJhbHJlYWR5TWF0Y2hlZCIsImNhcmROb2RlIiwibWF0Y2hLZXkiLCJjYXJkX2lkIiwiYWRkQ2hpbGQiLCJzZXRTY2FsZSIsImdhbWVTdGF0ZSIsImdhbWVfc3RhdGUiLCJwaGFzZSIsInBsYXllcnMiLCJwIiwiaXNfbGFuZGxvcmQiLCJtYXN0ZXJfYWNjb3VudGlkIiwiaGFuZCIsImxhc3RfcGxheWVkIiwibGFzdF9wbGF5ZXJfaWQiLCJjdXJyZW50X3R1cm4iLCJoYW5kVHlwZSIsImlzTmV3Um91bmQiLCJpc19uZXdfcm91bmQiLCJjYW5CZWF0IiwiX2V4dHJhY3RNYWluUmFuayIsImlzQm9tYiIsImlzUm9ja2V0Iiwic291bmROYW1lIiwiX2dldENhcmRUeXBlU291bmQiLCJjYXJkU291bmQiLCJwcmVmaXgiLCJkYW5pU291bmQiLCJoYXNTcGVjaWZpY1NvdW5kIiwiX2hhc1NwZWNpZmljQ2FyZFNvdW5kIiwicmFuZG9tVmFsdWUiLCJzb3VuZEluZGV4IiwiX3JhbmtUb1NvdW5kSW5kZXgiLCJoYXNTb3VuZCIsInNwZWNpYWxUeXBlcyIsIl9leHRyYWN0Q2FyZFJhbmsiLCJOdW1iZXIiLCJ2YWx1ZSIsImxvZ2ljX3ZhbHVlIiwia2V5Iiwic3VmZml4IiwicmFuZG9tSW5kZXgiLCJfcGxheUdhbWVSZXN1bHRTb3VuZCIsImlzV2luIiwicGFzc05vZGUiLCJhZGRDb21wb25lbnQiLCJvdXRsaW5lIiwiTGFiZWxPdXRsaW5lIiwid2lkdGgiLCJpc1ZhbGlkIiwic3VpdE5hbWVzIiwic3VpdE5hbWUiLCJyYW5rTmFtZXMiLCJyYW5rTmFtZSIsInJhbmtDb3VudHMiLCJ2YWx1ZXMiLCJmb3VycyIsInRocmVlcyIsInBhaXJzIiwic2luZ2xlcyIsImlzU2VxdWVudGlhbCIsIl9pc1NlcXVlbnRpYWwiLCJub1R3b09ySm9rZXIiLCJldmVyeSIsInBhaXJSYW5rcyIsInRocmVlUmFua3MiLCJ0aHJlZUNvdW50Iiwicm9vbV9jYXRlZ29yeSIsIl9zaG93Q29tcGV0aXRpb25SZXN1bHRQb3B1cCIsImlzV2lubmVyIiwibXlXaW5Hb2xkIiwicGxheWVyIiwiaXNfd2lubmVyIiwid2luX2dvbGQiLCJ3aW5uZXJfaWQiLCJpc0xhbmRsb3JkIiwib2xkR29sZCIsImdvYmFsX2NvdW50IiwibmV3R29sZCIsImdvbGRBZnRlciIsImdvbGRfYWZ0ZXIiLCJfdXBkYXRlUGxheWVyR29sZERpc3BsYXkiLCJsb2NhbEdvbGQiLCJfY3JlYXRlR2FtZVJlc3VsdFBvcHVwIiwiX2NvbnRpbnVlR2FtZSIsIl9yZXR1cm5Ub0xvYmJ5IiwiY2FsbGJhY2siLCJ3aW5TaXplIiwiY2FudmFzIiwiZmluZCIsIm1hc2tOb2RlIiwiQmxvY2tJbnB1dEV2ZW50cyIsIm1hc2tTcHJpdGUiLCJTcHJpdGUiLCJzcHJpdGVGcmFtZSIsIlNwcml0ZUZyYW1lIiwiVHlwZSIsIlNJTVBMRSIsInNpemVNb2RlIiwiU2l6ZU1vZGUiLCJDVVNUT00iLCJoZWlnaHQiLCJwb3B1cE5vZGUiLCJwb3B1cFdpZHRoIiwicG9wdXBIZWlnaHQiLCJiZ05vZGUiLCJfY3JlYXRlR3JhZGllbnRCYWNrZ3JvdW5kIiwiYm9yZGVyTm9kZSIsIl9jcmVhdGVHb2xkZW5Cb3JkZXIiLCJlZmZlY3RMYXllciIsIl9jcmVhdGVWaWN0b3J5UGFydGljbGVzIiwiX2NyZWF0ZURlZmVhdFBhcnRpY2xlcyIsImJhbm5lclkiLCJiYW5uZXJOb2RlIiwiX2NyZWF0ZVJlc3VsdEJhbm5lciIsImRldGFpbFgiLCJkZXRhaWxZIiwiZGV0YWlsTm9kZSIsIl9jcmVhdGVNdWx0aXBsaWVyRGV0YWlsQ2FyZCIsImxpc3RXaWR0aCIsImxpc3RYIiwibGlzdFkiLCJwbGF5ZXJMaXN0Tm9kZSIsIl9jcmVhdGVQbGF5ZXJSZXN1bHRMaXN0IiwiYnRuWSIsImJ1dHRvbkFyZWEiLCJfY3JlYXRlQnV0dG9uQXJlYSIsIl9zdGFydE51bWJlckFuaW1hdGlvbnMiLCJfcmVzdWx0RWZmZWN0TGF5ZXIiLCJncmFwaGljcyIsIkdyYXBoaWNzIiwidG9wQ29sb3IiLCJib3R0b21Db2xvciIsImZpbGxDb2xvciIsInJvdW5kUmVjdCIsImZpbGwiLCJpbm5lckdsb3ciLCJnbG93U3ByaXRlIiwiU0xJQ0VEIiwib3ZlcmxheSIsIm92ZXJsYXlTcHJpdGUiLCJib3JkZXJDb2xvciIsImdsb3dDb2xvciIsInN0cm9rZUNvbG9yIiwibGluZVdpZHRoIiwic3Ryb2tlIiwiY29ybmVyU2l6ZSIsImNvcm5lcnMiLCJyb3QiLCJjb3JuZXIiLCJkZWNvck5vZGUiLCJkZyIsIm1vdmVUbyIsImxpbmVUbyIsImFuZ2xlIiwiYmFubmVyV2lkdGgiLCJiYW5uZXJIZWlnaHQiLCJ0aXRsZU5vZGUiLCJhbmNob3JYIiwiYW5jaG9yWSIsInRpdGxlTGFiZWwiLCJmb250RmFtaWx5IiwiaG9yaXpvbnRhbEFsaWduIiwiSG9yaXpvbnRhbEFsaWduIiwiQ0VOVEVSIiwidmVydGljYWxBbGlnbiIsIlZlcnRpY2FsQWxpZ24iLCJzaGFkb3ciLCJMYWJlbFNoYWRvdyIsIm9mZnNldCIsImJsdXIiLCJjYXJkV2lkdGgiLCJjYXJkSGVpZ2h0IiwibGluZU5vZGUiLCJsZyIsIm11bHRpRGV0YWlsIiwibXVsdGlfZGV0YWlsIiwiZGV0YWlscyIsImJhc2Vfc2NvcmUiLCJxaWFuZ19jb3VudCIsInFpYW5nX211bHRpIiwiYm9tYl9jb3VudCIsImJvbWJfbXVsdGkiLCJyb2NrZXRfY291bnQiLCJyb2NrZXRfbXVsdGkiLCJzcHJpbmdfdHlwZSIsIml0ZW1ZIiwiaXRlbUhlaWdodCIsIml0ZW0iLCJpdGVtTm9kZSIsInZhbHVlTm9kZSIsInZhbHVlTGFiZWwiLCJ0b3RhbE11bHRpTm9kZSIsInRvdGFsTXVsdGlCZyIsInRtZyIsInRvdGFsTGFiZWwiLCJ0dGwiLCJtdWx0aVZhbHVlTm9kZSIsIm12bCIsIm11bHRpcGxlIiwibXZvIiwibGlzdE5vZGUiLCJsaXN0SGVpZ2h0IiwiaGVhZGVyTm9kZSIsImhlYWRlcnMiLCJoZWFkZXJYIiwiaE5vZGUiLCJoTGFiZWwiLCJzZXBOb2RlIiwic2ciLCJpdGVtU3RhcnRZIiwiaXNDdXJyZW50UGxheWVyIiwiX2NyZWF0ZVBsYXllclJlc3VsdEl0ZW0iLCJoaWdobGlnaHQiLCJoZyIsImF2YXRhck5vZGUiLCJhdmF0YXJCZyIsImFnIiwicm9sZSIsImNpcmNsZSIsImF2YXRhckluZGV4IiwiYXZhdGFyUGF0aCIsImF2YXRhclNwcml0ZSIsInNwIiwicm9sZUljb25Ob2RlIiwicm9sZUxhYmVsIiwibmFtZU5vZGUiLCJuYW1lTGFiZWwiLCJwbGF5ZXJfbmFtZSIsInJvbGVOb2RlIiwicm9sZVRleHQiLCJ3aW5Hb2xkIiwid2luTm9kZSIsIndpbkxhYmVsIiwid2luT3V0bGluZSIsImFyZWFOb2RlIiwiY29udGludWVCdG4iLCJfY3JlYXRlU3R5bGVkQnV0dG9uIiwiVE9VQ0hfRU5EIiwibG9iYnlCdG4iLCJ0ZXh0IiwiaXNQcmltYXJ5IiwiYnRuTm9kZSIsImJ0bldpZHRoIiwiYnRuSGVpZ2h0Iiwib3ZlcmZsb3ciLCJPdmVyZmxvdyIsIlNIUklOSyIsIlRPVUNIX0NBTkNFTCIsImNvaW4iLCJnIiwidGFyZ2V0WSIsImRlbGF5IiwicGFyYWxsZWwiLCJzdGFyIiwiX2RyYXdTdGFyIiwicGFydGljbGUiLCJjeCIsImN5IiwiaW5uZXJSYWRpdXMiLCJwb2ludHMiLCJvdXRlclJhZGl1cyIsInJhZGl1cyIsIlBJIiwiY29zIiwic2luIiwiY2xvc2UiLCJfZmluZE5vZGVCeU5hbWUiLCJ0YXJnZXRNdWx0aSIsIl9hbmltYXRlTnVtYmVyIiwiZnJvbSIsInN0YXJ0VGltZSIsImRpZmYiLCJ1cGRhdGUiLCJlbGFwc2VkIiwicHJvZ3Jlc3MiLCJlYXNlUHJvZ3Jlc3MiLCJwb3ciLCJjdXJyZW50IiwiZm91bmQiLCJwbGF5ZXJHb2xkIiwicm9vbUNvbmZpZyIsImN1cnJlbnRSb29tQ29uZmlnIiwibWluR29sZCIsIm1pbl9nb2xkIiwiX3Nob3dJbnN1ZmZpY2llbnRHb2xkUG9wdXAiLCJfZG9Db250aW51ZUdhbWUiLCJfcmVzZXRHYW1lU3RhdGUiLCJyZXF1ZXN0UmVhZHkiLCJjdXJyZW50R29sZCIsInJlcXVpcmVkR29sZCIsImRpcmVjdG9yIiwiZ2V0U2NlbmUiLCJjb250ZW50Tm9kZSIsImNvbnRlbnRMYWJlbCIsIl9mb3JtYXRHb2xkIiwiUkVTSVpFX0hFSUdIVCIsImJ0bkFyZWFOb2RlIiwiYWRCdG4iLCJhZEJnIiwiYWRMYWJlbE5vZGUiLCJhZExhYmVsIiwibG9iYnlCZyIsImxvYmJ5TGFiZWxOb2RlIiwibG9iYnlMYWJlbCIsIl9pbnN1ZmZpY2llbnRHb2xkUG9wdXAiLCJfaW5zdWZmaWNpZW50R29sZE1hc2siLCJfd2F0Y2hBZEZvckdvbGQiLCJzdWNjZXNzIiwiX2Nsb3NlSW5zdWZmaWNpZW50R29sZFBvcHVwIiwidHQiLCJzaG93UmV3YXJkZWRWaWRlb0FkIiwiX3Jld2FyZEdvbGRBZnRlckFkIiwiZmFpbCIsIl9zaG93TWVzc2FnZSIsInd4IiwiY3JlYXRlUmV3YXJkZWRWaWRlb0FkIiwicmV3YXJkZWRWaWRlb0FkIiwiYWRVbml0SWQiLCJvbkNsb3NlIiwicmVzIiwiaXNFbmRlZCIsIm9uRXJyb3IiLCJzaG93IiwidGhlbiIsIl9yZXdhcmRHb2xkQWZ0ZXJHb2xkIiwicmV3YXJkQW1vdW50IiwidXBkYXRlR29sZCIsInNlbmRBZFJld2FyZCIsImdvbGQiLCJ0b0ZpeGVkIiwidG9TdHJpbmciLCJsZWF2ZVJvb20iLCJsb2FkU2NlbmUiLCJfY2xlYXJCb3R0b21DYXJkcyIsInBsYXllcnNfc2VhdF9wb3MiLCJzZWF0Tm9kZSIsIm91dFpvbmVOYW1lIiwib3V0Wm9uZSIsInBsYXllck5vZGVMaXN0IiwicGxheWVyTm9kZSIsInBsYXllclNjcmlwdCIsInJlYWR5aW1hZ2UiLCJnbG9iYWxjb3VudF9sYWJlbCIsIl91cGRhdGVQbGF5ZXJNYXRjaENvaW5EaXNwbGF5IiwibWF0Y2hDb2luIiwiaXNfZmluYWxfcm91bmQiLCJteU1hdGNoQ29pbiIsIm1hdGNoX2NvaW4iLCJiZyIsInJlc3VsdE5vZGUiLCJyZXN1bHRMYWJlbCIsIm11bHRpTm9kZSIsIm11bHRpTGFiZWwiLCJjb2luTm9kZSIsImNvaW5MYWJlbCIsImluaXRpYWxDb3VudGRvd24iLCJhcmVuYV9jb3VudGRvd24iLCJjb3VudGRvd25Db250YWluZXIiLCJjb3VudGRvd25MYWJlbCIsImNvdW50ZG93bkxhYmVsQ29tcCIsImNvdW50ZG93bk51bWJlciIsImNvdW50ZG93bk51bWJlckNvbXAiLCJCTEFDSyIsIl9jb3VudGRvd25MYWJlbE5vZGUiLCJfY291bnRkb3duTnVtYmVyTm9kZSIsIl9hcmVuYUNvdW50ZG93blNlY29uZHMiLCJfc3RhcnRMb2NhbEFyZW5hQ291bnRkb3duIiwiX3NldHVwQXJlbmFDb3VudGRvd25MaXN0ZW5lcnMiLCJzZWNvbmRzIiwiX3VwZGF0ZUFyZW5hQ291bnRkb3duVUkiLCJtYWNybyIsIlJFUEVBVF9GT1JFVkVSIiwiX3Nob3dXYWl0aW5nRm9yU2VydmVyIiwib25BcmVuYVJvdW5kQ291bnRkb3duIiwib25BcmVuYUNvdW50ZG93blRpY2siLCJvbkFyZW5hQXV0b1JlYWR5IiwiX3Nob3dBcmVuYUF1dG9SZWFkeU1lc3NhZ2UiLCJvbkFyZW5hUmVjb25uZWN0U3RhdGUiLCJjb3VudGRvd24iLCJudW1MYWJlbCIsInRvdGFsX3JvdW5kcyIsIl9zaG93TWF0Y2hDb2luRGlzcGxheSIsIl91cGRhdGVDb21wZXRpdGlvbkNvdW50ZG93bkRpc3BsYXkiLCJfdXBkYXRlTWF0Y2hDb2luRGlzcGxheSIsImRlbHRhIiwiX21hdGNoQ29pbk5vZGUiLCJtYXRjaENvaW5Ob2RlIiwiaWNvbk5vZGUiLCJpY29uTGFiZWwiLCJfc2hvd01hdGNoQ29pbkRlbHRhQW5pbWF0aW9uIiwiZGVsdGFOb2RlIiwiZGVsdGFMYWJlbCIsIl9zaG93RWxpbWluYXRlZFBvcHVwIiwicmFua05vZGUiLCJyYW5rTGFiZWwiLCJyZWFzb25Ob2RlIiwicmVhc29uTGFiZWwiLCJyZWFzb24iLCJ0b3RhbE5vZGUiLCJ0b3RhbF9wbGF5ZXJzIiwicmV3YXJkcyIsInJld2FyZE5vZGUiLCJyZXdhcmRMYWJlbCIsImJ0bkJnIiwiYnRuTGFiZWxOb2RlIiwiYnRuTGFiZWwiLCJfZWxpbWluYXRlZFBvcHVwIiwiX2VsaW1pbmF0ZWRNYXNrIiwiY3VycmVudF9yb3VuZCIsIl9zaG93QWR2YW5jZVRvYXN0IiwidG9hc3ROb2RlIiwiX3Nob3dDaGFtcGlvblBvcHVwIiwiZW5hYmxlQm9sZCIsInJhbmtpbmdzIiwidG9wVGhyZWVZIiwiX2NyZWF0ZVJhbmtpbmdJdGVtIiwib3RoZXJUaXRsZU5vZGUiLCJvdGhlclRpdGxlTGFiZWwiLCJzdGFydFkiLCJtYXhPdGhlclJhbmtpbmdzIiwicmFua0luZm8iLCJyYW5rSXRlbU5vZGUiLCJyYW5rSXRlbUxhYmVsIiwiY29uZmlybUJnIiwiY29uZmlybUxhYmVsTm9kZSIsImNvbmZpcm1MYWJlbCIsIl9jcmVhdGVDaGFtcGlvblBhcnRpY2xlcyIsIl9jaGFtcGlvblBvcHVwIiwiX2NoYW1waW9uTWFzayIsImJnQ29sb3IiLCJyYW5rTGFiZWxOb2RlIiwicmFua1RleHQiLCJuYW1lTGFiZWxOb2RlIiwiY29pbkxhYmVsTm9kZSIsInBhcmVudE5vZGUiLCJwYXJ0aWNsZUxhYmVsIiwiX3Nob3dUb3VybmFtZW50RmluYWxSYW5rRGlhbG9nIiwidGl0bGVCZ05vZGUiLCJ0aXRsZUJnIiwidG9wMyIsInBvZGl1bVkiLCJwb2RpdW1TcGFjaW5nIiwiX2NyZWF0ZVBvZGl1bUVudHJ5IiwidG9wMjAiLCJsaXN0VGl0bGVOb2RlIiwibGlzdFRpdGxlTGFiZWwiLCJzY3JvbGxWaWV3Tm9kZSIsIm1hc2siLCJNYXNrIiwiUkVDVCIsInRvcDNQbGF5ZXJJRHMiLCJmaWx0ZXJlZFRvcDIwIiwicmFua0RhdGEiLCJhY3R1YWxSYW5rIiwiX2NyZWF0ZVJhbmtMaXN0SXRlbSIsIl9hZGRTY3JvbGxWaWV3VG91Y2giLCJzZXAiLCJteVJhbmtCZ05vZGUiLCJteVJhbmtCZyIsIm15UmFua05vZGUiLCJteVJhbmtMYWJlbCIsIm15X3JhbmsiLCJteV9tYXRjaF9jb2luIiwiYnRuTGFiZWxDb21wIiwiX2xvYWRBdmF0YXJTcHJpdGUiLCJhdmF0YXIiLCJpc19yb2JvdCIsInBsYXllck5hbWUiLCJfZ2V0Um9ib3REaXNwbGF5TmFtZSIsIkxFRlQiLCJDTEFNUCIsIlJJR0hUIiwidmlld0hlaWdodCIsInRvdWNoU3RhcnRZIiwiY29udGVudFN0YXJ0WSIsIm1heE9mZnNldCIsImdldExvY2F0aW9uWSIsIlRPVUNIX01PVkUiLCJ0b3VjaFkiLCJkZWx0YVkiLCJuZXdZIiwibWluWSIsIm1heFkiLCJlbnRyeU5vZGUiLCJtZWRhbE5vZGUiLCJtZWRhbCIsIm1lZGFsQ29sb3IiLCJyYW5rTnVtTm9kZSIsInJhbmtOdW1MYWJlbCIsImF2YXRhckZyYW1lTm9kZSIsImF2YXRhckZyYW1lIiwib3JpZ2luYWxOYW1lIiwicm9ib3RJbmRleCIsImxhc3RDaGFyIiwic3ByaXRlIiwiYXZhdGFyVXJsIiwiaXNSb2JvdCIsInJvYm90QXZhdGFySW5kZXgiLCJkZWZhdWx0UGF0aCIsImFzc2V0TWFuYWdlciIsImxvYWRSZW1vdGUiLCJleHQiLCJ0ZXh0dXJlIiwiZmFsbGJhY2tTcHJpdGUiLCJlIiwibG9jYWxQYXRoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBLElBQUlBLFlBQVksR0FBR0MsTUFBTSxDQUFDRCxZQUFQLElBQXVCLENBQTFDO0FBQ0EsSUFBSUUsVUFBVSxHQUFHRCxNQUFNLENBQUNDLFVBQVAsSUFBcUI7RUFBRUMsT0FBTyxFQUFFLENBQVg7RUFBY0MsSUFBSSxFQUFFO0FBQXBCLENBQXRDO0FBQ0EsSUFBSUMsVUFBVSxHQUFHSixNQUFNLENBQUNJLFVBQVAsSUFBcUIsRUFBdEM7QUFDQSxJQUFJQyxTQUFTLEdBQUdMLE1BQU0sQ0FBQ0ssU0FBUCxJQUFvQixFQUFwQyxFQUVBOztBQUNBLElBQUlDLFdBQVcsR0FBRyxFQUFsQixFQUVBOztBQUNBLElBQUlDLFVBQVUsR0FBRztFQUNiQyxTQUFTLEVBQUUsR0FERTtFQUViQyxLQUFLLEVBQUUsQ0FBQyxHQUZLO0VBR2JDLFdBQVcsRUFBRSxFQUhBO0VBSWJDLGVBQWUsRUFBRSxHQUpKO0VBS2JDLGlCQUFpQixFQUFFLEVBTE47RUFNYkMsWUFBWSxFQUFFLEdBTkQ7RUFPYkMsY0FBYyxFQUFFO0FBUEgsQ0FBakIsRUFVQTs7QUFDQSxJQUFJQyxVQUFVLEdBQUc7RUFDYkMsWUFBWSxFQUFFLElBREQ7RUFFYkMsWUFBWSxFQUFFQyxFQUFFLENBQUNDLEVBQUgsQ0FBTSxDQUFOLEVBQVMsR0FBVCxDQUZE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ckI7WUFDSDtVQUNKLENBSkQ7VUFLQTtRQUNIOztRQUNELElBQUlULE1BQU0sQ0FBQzliLE9BQVgsRUFBb0I7VUFDaEI4YixNQUFNLENBQUNqWixXQUFQLEdBQXFCQSxXQUFyQjtRQUNIO01BQ0osQ0FiRDtJQWNIO0VBQ0o7QUF0ek1JLENBQVQiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXNDb250ZW50IjpbIi8vIOS9v+eUqOWFqOWxgOWPmOmHj++8jOS4jeS9v+eUqCByZXF1aXJlXG4vLyDjgJDlvbvlupXkv67lpI3niYjmnKzjgJHmnI3liqHnq6/mlbDmja7kuLrllK/kuIDmlbDmja7mupBcbi8vIFxuLy8g5qC45b+D5Y6f5YiZ77yaXG4vLyAxLiBoYW5kQ2FyZHMg5piv5ZSv5LiA5pWw5o2u5rqQ77yM5L+d5a2Y5pyN5Yqh56uv5Y6f5aeL5pWw5o2uXG4vLyAyLiDnpoHmraLku7vkvZXmlbDmja7ovazmjaLjgIHmjpLluo/jgIHph43mlrDorqHnrpdcbi8vIDMuIHJlbmRlckNhcmRzKCkg5piv5ZSv5LiA5riy5p+T5YWl5Y+jXG4vLyA0LiDliqjnlLvlj6rmmK/op4bop4nmlYjmnpzvvIznu53kuI3og73kv67mlLnmlbDmja5cbi8vIDUuIGNsZWFyQWxsQ2FyZHMoKSDmuIXnkIbmiYDmnInml6foioLngrnvvIjop6PlhrPog4zpnaLniYzmrovnlZnvvIlcblxudmFyIGlzb3Blbl9zb3VuZCA9IHdpbmRvdy5pc29wZW5fc291bmQgfHwgMVxudmFyIHFpYW5fc3RhdGUgPSB3aW5kb3cucWlhbl9zdGF0ZSB8fCB7IGJ1cWlhbmc6IDAsIHFpYW46IDEgfVxudmFyIENhcmRzVmFsdWUgPSB3aW5kb3cuQ2FyZHNWYWx1ZSB8fCB7fVxudmFyIFJvb21TdGF0ZSA9IHdpbmRvdy5Sb29tU3RhdGUgfHwge31cblxuLy8g6Z+z5pWI57yT5a2YXG52YXIgX2F1ZGlvQ2xpcHMgPSB7fVxuXG4vLyDniYzluIPlsYDphY3nva5cbnZhciBDYXJkTGF5b3V0ID0ge1xuICAgIGNhcmRTY2FsZTogMC44LFxuICAgIGNhcmRZOiAtMjUwLFxuICAgIGNhcmRTcGFjaW5nOiAzNSxcbiAgICBib3R0b21DYXJkU2NhbGU6IDAuNCxcbiAgICBib3R0b21DYXJkU3BhY2luZzogMjUsXG4gICAgb3V0Q2FyZFNjYWxlOiAwLjUsXG4gICAgb3V0Q2FyZFNwYWNpbmc6IDI1LFxufVxuXG4vLyDlj5HniYzliqjnlLvphY3nva5cbnZhciBEZWFsQ29uZmlnID0ge1xuICAgIGFuaW1EdXJhdGlvbjogMC4xMixcbiAgICBkZWNrUG9zaXRpb246IGNjLnYyKDAsIDEwMCksXG4gICAgY2FyZEludGVydmFsOiA4MCxcbn1cblxuLy8g5Yqg6L295bm25pKt5pS+6Z+z5pWIXG5mdW5jdGlvbiBwbGF5U291bmQocGF0aCkge1xuICAgIGlmICghaXNvcGVuX3NvdW5kKSByZXR1cm4gbnVsbFxuICAgIGlmIChfYXVkaW9DbGlwc1twYXRoXSkge1xuICAgICAgICByZXR1cm4gY2MuYXVkaW9FbmdpbmUucGxheShfYXVkaW9DbGlwc1twYXRoXSwgZmFsc2UsIDEpXG4gICAgfVxuICAgIGNjLnJlc291cmNlcy5sb2FkKHBhdGgsIGNjLkF1ZGlvQ2xpcCwgZnVuY3Rpb24oZXJyLCBjbGlwKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIF9hdWRpb0NsaXBzW3BhdGhdID0gY2xpcFxuICAgICAgICBjYy5hdWRpb0VuZ2luZS5wbGF5KGNsaXAsIGZhbHNlLCAxKVxuICAgIH0pXG4gICAgcmV0dXJuIG51bGxcbn1cblxuY2MuQ2xhc3Moe1xuICAgIGV4dGVuZHM6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgZ2FtZWluZ1VJOiBjYy5Ob2RlLFxuICAgICAgICBjYXJkX3ByZWZhYjogY2MuUHJlZmFiLFxuICAgICAgICByb2JVSTogY2MuTm9kZSxcbiAgICAgICAgYm90dG9tX2NhcmRfcG9zX25vZGU6IGNjLk5vZGUsXG4gICAgICAgIHBsYXlpbmdVSV9ub2RlOiBjYy5Ob2RlLFxuICAgICAgICB0aXBzTGFiZWw6IGNjLkxhYmVsLFxuICAgICAgICBjYXJkc19ub2RlOiBjYy5Ob2RlLCAgLy8g5omL54mM6IqC54K55a655ZmoXG4gICAgICAgIC8vIPCflZDjgJDmlrDlop7jgJHlgJLorqHml7ZMYWJlbOW8leeUqFxuICAgICAgICBiaWRDb3VudGRvd25MYWJlbDogY2MuTGFiZWwsICAgIC8vIOaKouWcsOS4u+WAkuiuoeaXtlxuICAgICAgICBwbGF5Q291bnRkb3duTGFiZWw6IGNjLkxhYmVsLCAgIC8vIOWHuueJjOWAkuiuoeaXtlxuICAgICAgICAvLyDwn5SK44CQ5paw5aKe44CR5ru0562U6Z+z5pWI77yIM+enkuWCrOS/g+mfs+aViO+8iVxuICAgICAgICB0aWNrQXVkaW86IHtcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgICAgICAgICB0eXBlOiBjYy5BdWRpb0NsaXBcbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgb25Mb2FkICgpIHtcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIGlmICghbXlnbG9iYWwpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJteWdsb2JhbCDmnKrlrprkuYlcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR6aKE5Yqg6L295Y2h54mM57K+54G15Zu+6ZuGXG4gICAgICAgIHRoaXMuX3ByZWxvYWRDYXJkQXRsYXMoKVxuXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHnoa7kv53miYvniYzlrrnlmajoioLngrnlrZjlnKhcbiAgICAgICAgaWYgKCF0aGlzLmNhcmRzX25vZGUpIHtcbiAgICAgICAgICAgIC8vIOafpeaJvuaYr+WQpuW3suWtmOWcqOaJi+eJjOWuueWZqOiKgueCuVxuICAgICAgICAgICAgdmFyIGdhbWVTY2VuZU5vZGUgPSB0aGlzLm5vZGUucGFyZW50XG4gICAgICAgICAgICBpZiAoZ2FtZVNjZW5lTm9kZSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2FtZVNjZW5lTm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBnYW1lU2NlbmVOb2RlLmNoaWxkcmVuW2ldXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5uYW1lID09PSBcImNhcmRzX25vZGVcIiB8fCBjaGlsZC5uYW1lID09PSBcImNhcmRzXCIgfHwgY2hpbGQubmFtZSA9PT0gXCJoYW5kQ2FyZHNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jYXJkc19ub2RlID0gY2hpbGRcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5rKh5om+5Yiw77yM5Yib5bu65LiA5Liq5paw55qE5a655Zmo6IqC54K5XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmNhcmRzX25vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0NhcmRzTm9kZSA9IG5ldyBjYy5Ob2RlKFwiY2FyZHNfbm9kZVwiKVxuICAgICAgICAgICAgICAgICAgICBuZXdDYXJkc05vZGUucGFyZW50ID0gZ2FtZVNjZW5lTm9kZVxuICAgICAgICAgICAgICAgICAgICBuZXdDYXJkc05vZGUuc2V0UG9zaXRpb24oMCwgMClcbiAgICAgICAgICAgICAgICAgICAgbmV3Q2FyZHNOb2RlLnNldEFuY2hvclBvaW50KDAuNSwgMC41KVxuICAgICAgICAgICAgICAgICAgICBuZXdDYXJkc05vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZSg4MDAsIDIwMCkpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FyZHNfbm9kZSA9IG5ld0NhcmRzTm9kZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyDjgJDmoLjlv4PjgJHllK/kuIDmlbDmja7mupAgLSDmnI3liqHnq6/ljp/lp4vmiYvniYzmlbDmja5cbiAgICAgICAgLy8g44CQ6YeN6KaB44CR56aB5q2i5Lu75L2V5L+u5pS544CB5o6S5bqP44CB6L2s5o2iXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB0aGlzLmhhbmRDYXJkcyA9IFtdICAgICAgICAgICAvLyDjgJDllK/kuIDmlbDmja7mupDjgJHmnI3liqHnq6/ljp/lp4vmiYvniYxcbiAgICAgICAgdGhpcy5ib3R0b21DYXJkcyA9IFtdICAgICAgICAgLy8g5bqV54mM5pWw5o2uXG4gICAgICAgIHRoaXMuY2hvb3NlX2NhcmRfZGF0YSA9IFtdICAgIC8vIOmAieS4reeahOeJjFxuICAgICAgICBcbiAgICAgICAgLy8g5oqi5Zyw5Li755u45YWzXG4gICAgICAgIHRoaXMucm9iX3BsYXllcl9hY2NvdW50aWQgPSAwXG4gICAgICAgIHRoaXMuX2JpZGRpbmdQaGFzZSA9IFwiaWRsZVwiXG4gICAgICAgIHRoaXMuX2dhbWVQaGFzZSA9IFwiaWRsZVwiICAvLyDwn5Sn44CQ5paw5aKe44CR5ri45oiP6Zi25q61OiBpZGxlLCBiaWRkaW5nLCBwbGF5aW5nXG4gICAgICAgIHRoaXMuY2FyZHNSZWFkeSA9IGZhbHNlXG4gICAgICAgIFxuICAgICAgICAvLyDwn5WQ44CQ5YCS6K6h5pe257O757uf44CRXG4gICAgICAgIHRoaXMuX2JpZFRpbWVvdXQgPSAwXG4gICAgICAgIHRoaXMuX3BsYXlUaW1lb3V0ID0gMFxuICAgICAgICB0aGlzLl9iaWRDb3VudGRvd25UaW1lciA9IG51bGxcbiAgICAgICAgdGhpcy5fcGxheUNvdW50ZG93blRpbWVyID0gbnVsbFxuICAgICAgICB0aGlzLl9iaWRUaW1lTGVmdCA9IDBcbiAgICAgICAgdGhpcy5fcGxheVRpbWVMZWZ0ID0gMFxuICAgICAgICB0aGlzLl9pc0JpZENvdW50ZG93blRpY2tpbmcgPSBmYWxzZVxuICAgICAgICB0aGlzLl9pc1BsYXlDb3VudGRvd25UaWNraW5nID0gZmFsc2VcbiAgICAgICAgdGhpcy5faXNCaWRXYXJuaW5nID0gZmFsc2VcbiAgICAgICAgdGhpcy5faXNQbGF5V2FybmluZyA9IGZhbHNlXG4gICAgICAgIHRoaXMuX2JpZEV4cGlyZXNBdCA9IDAgIC8vIPCflKfjgJDmlrDlop7jgJHmnI3liqHnq6/ov4fmnJ/ml7bpl7TmiLPvvIjmr6vnp5LvvIlcbiAgICAgICAgXG4gICAgICAgIC8vIOW6leeJjOiKgueCuVxuICAgICAgICB0aGlzLmJvdHRvbV9jYXJkID0gW11cbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyDjgJDnq57mioDlnLrjgJHnirbmgIHlj5jph49cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHRoaXMuX2lzQ29tcGV0aXRpb24gPSBmYWxzZSAgICAgICAgICAgLy8g5piv5ZCm5piv56ue5oqA5Zy65qih5byPXG4gICAgICAgIHRoaXMuX3Jvb21DYXRlZ29yeSA9IDEgICAgICAgICAgICAgICAgLy8g5oi/6Ze057G75Z6L77yaMT3mma7pgJrlnLrvvIwyPeernuaKgOWculxuICAgICAgICB0aGlzLl9tYXRjaENvaW4gPSAwICAgICAgICAgICAgICAgICAgIC8vIOavlOi1m+mHkeW4gVxuICAgICAgICB0aGlzLl9jb21wZXRpdGlvblJvdW5kID0gMCAgICAgICAgICAgIC8vIOW9k+WJjei9ruasoVxuICAgICAgICB0aGlzLl9jb21wZXRpdGlvblRvdGFsUm91bmRzID0gMCAgICAgIC8vIOaAu+i9ruasoVxuICAgICAgICB0aGlzLl9jb21wZXRpdGlvbkNvdW50ZG93biA9IDAgICAgICAgIC8vIOernuaKgOWcuuWAkuiuoeaXtlxuICAgICAgICB0aGlzLl9jb21wZXRpdGlvbkNvdW50ZG93blRpbWVyID0gbnVsbCAvLyDnq57mioDlnLrlgJLorqHml7blrprml7blmahcbiAgICAgICAgdGhpcy5fd2FzRGlzY29ubmVjdGVkID0gZmFsc2UgICAgICAgICAvLyDmmK/lkKblnKjmr5TotZvkuK3mjonnur9cbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PSDmnI3liqHlmajmtojmga/nm5HlkKwgPT09PT09PT09PT09XG4gICAgICAgIFxuICAgICAgICAvLyDjgJDmoLjlv4PjgJHnm5HlkKzmnI3liqHlmajlj5HniYzmtojmga8gLSDllK/kuIDmlbDmja7lhaXlj6NcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uUHVzaENhcmRzKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4OPID09PT09PT09PT0g5pyN5Yqh56uv5Y+R54mM5raI5oGvID09PT09PT09PT1cIilcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyDmnI3liqHnq6/ljp/lp4vmiYvniYw6XCIsIEpTT04uc3RyaW5naWZ5KGRhdGEuY2FyZHMpKVxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4OPIOacjeWKoeerr+WOn+Wni+W6leeJjDpcIiwgSlNPTi5zdHJpbmdpZnkoZGF0YS5ib3R0b21fY2FyZHMpKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5paw5LiA6L2u5Y+R54mM5pe277yM5YWz6Zet5LiK5LiA6L2u55qE57uT566X5by556qXXG4gICAgICAgICAgICBpZiAodGhpcy5fZ2FtZVJlc3VsdFBvcHVwIHx8IHRoaXMuX2dhbWVSZXN1bHRNYXNrKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4OPIFtvblB1c2hDYXJkc10g5YWz6Zet5LiK5LiA6L2u55qE57uT566X5by556qXXCIpXG4gICAgICAgICAgICAgICAgdGhpcy5fY2xvc2VHYW1lUmVzdWx0UG9wdXAodGhpcy5fZ2FtZVJlc3VsdFBvcHVwLCB0aGlzLl9nYW1lUmVzdWx0TWFzaylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeWBnOatouaJgOacieernuaKgOWcuuWAkuiuoeaXtlxuICAgICAgICAgICAgdGhpcy5fc3RvcEFyZW5hQ291bnRkb3duKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkea4heeQhuahjOmdouS4iueahOeJjO+8iOS4iuS4gOi9ruacgOWQjuS4gOaJi+eJjO+8iVxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4OPIFtvblB1c2hDYXJkc10g5riF55CG5qGM6Z2i5LiK55qE54mMXCIpXG4gICAgICAgICAgICB0aGlzLl9jbGVhckFsbE91dENhcmRab25lcygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOOAkOaguOW/g+OAkeebtOaOpeS/neWtmOacjeWKoeerr+aVsOaNru+8jOS4jeWBmuS7u+S9lei9rOaNolxuICAgICAgICAgICAgdGhpcy5oYW5kQ2FyZHMgPSBkYXRhLmNhcmRzIHx8IFtdXG4gICAgICAgICAgICB0aGlzLmJvdHRvbUNhcmRzID0gZGF0YS5ib3R0b21fY2FyZHMgfHwgW11cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g44CQ5qC45b+D44CR5ZSv5LiA5riy5p+T5YWl5Y+jXG4gICAgICAgICAgICB0aGlzLnJlbmRlckNhcmRzKHRoaXMuaGFuZENhcmRzKVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g55uR5ZCs5Y+r5Zyw5Li76L2u5qyh77yI5pen54mI5raI5oGv77yM5LuF55So5LqO5YW85a6577yJXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkJpZFR1cm4oZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAvLyDkuI3lho3lpITnkIbvvIzpgb/lhY3ph43lpI1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIOebkeWQrOWPq+WcsOS4u+e7k+aenFxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25CaWRSZXN1bHQoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAvLyDwn5SS44CQ6YeN6KaB44CR5pS25Yiw57uT5p6c77yM5YGc5q2i5YCS6K6h5pe2XG4gICAgICAgICAgICB0aGlzLl9zdG9wQmlkQ291bnRkb3duKClcbiAgICAgICAgICAgIGlmICh0aGlzLm5vZGUgJiYgdGhpcy5ub2RlLnBhcmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMubm9kZS5wYXJlbnQuZW1pdChcImJpZF9yZXN1bHRfZXZlbnRcIiwge1xuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJfaWQ6IGRhdGEuYWNjb3VudGlkLFxuICAgICAgICAgICAgICAgICAgICBiaWQ6IGRhdGEuc3RhdGVcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g55uR5ZCs5oqi5Zyw5Li76L2u5qyh77yI5pen54mI5raI5oGv77yM5LuF55So5LqO5YW85a6577yJXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkNhblJvYlN0YXRlKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgLy8g5LiN5YaN5aSE55CG77yM6YG/5YWN6YeN5aSNXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDnm5HlkKzlh7rniYzova7mrKFcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQ2FuQ2h1Q2FyZChmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIHZhciBwbGF5ZXJJZCA9IGRhdGEucGxheWVyX2lkIHx8IGRhdGFcbiAgICAgICAgICAgIHZhciBteVBsYXllcklkID0gbXlnbG9iYWwuc29ja2V0LmdldFBsYXllckluZm8oKS5pZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLnNlcnZlclBsYXllcklkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEXG5cbiAgICAgICAgICAgIC8vIPCflJLjgJDph43opoHjgJHlhYjlgZzmraLkuYvliY3nmoTlgJLorqHml7bvvIjmnI3liqHlmajova7ovazkuobvvIlcbiAgICAgICAgICAgIHRoaXMuX3N0b3BQbGF5Q291bnRkb3duKClcblxuICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeS/neWtmOWHuueJjOeKtuaAge+8jOeUqOS6juaPkOekuuWKn+iDvVxuICAgICAgICAgICAgdGhpcy5fbXVzdFBsYXkgPSBkYXRhLm11c3RfcGxheSB8fCBmYWxzZVxuICAgICAgICAgICAgdGhpcy5fY2FuQmVhdCA9IGRhdGEuY2FuX2JlYXQgfHwgZmFsc2VcbiAgICAgICAgICAgIHRoaXMuX2xhc3RQbGF5ZWRDYXJkcyA9IG51bGwgIC8vIOS4iuWutuWHuueahOeJjO+8jOmcgOimgeS7jiBvbk90aGVyUGxheWVyQ2h1Q2FyZCDojrflj5ZcblxuICAgICAgICAgICAgaWYgKFN0cmluZyhwbGF5ZXJJZCkgPT09IFN0cmluZyhteVBsYXllcklkKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2hpZGVSb2JVSSgpXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhck91dFpvbmUobXlQbGF5ZXJJZClcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXlpbmdVSV9ub2RlLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5VGltZW91dCA9IGRhdGEudGltZW91dCB8fCAxNVxuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0UGxheUNvdW50ZG93bigpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBsYXlpbmdVSV9ub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGxheWluZ1VJX25vZGUuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDnm5HlkKzlhbbku5bnjqnlrrblh7rniYxcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uT3RoZXJQbGF5ZXJDaHVDYXJkKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgLy8g8J+UkuOAkOmHjeimgeOAkeaUtuWIsOWHuueJjOa2iOaBr++8jOWBnOatouaIkeeahOWAkuiuoeaXtlxuICAgICAgICAgICAgdGhpcy5fc3RvcFBsYXlDb3VudGRvd24oKVxuICAgICAgICAgICAgaWYgKHRoaXMucGxheWluZ1VJX25vZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXlpbmdVSV9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlpITnkIbkuI3lh7rnmoTmg4XlhrVcbiAgICAgICAgICAgIGlmIChkYXRhLmlzX3Bhc3MpIHtcbiAgICAgICAgICAgICAgICAvLyDwn5SK44CQ5paw5aKe44CR5pKt5pS+5LiN5Ye66Z+z5pWIXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheVBhc3NTb3VuZChkYXRhKVxuICAgICAgICAgICAgICAgIC8vIPCflIrjgJDmlrDlop7jgJHmmL7npLrkuI3lh7rmlYjmnpxcbiAgICAgICAgICAgICAgICB0aGlzLl9zaG93UGFzc0VmZmVjdChkYXRhLmFjY291bnRpZClcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5LiN5Ye65pe25LiN5riF6Zmk5LiK5a625Ye655qE54mMXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHkv53lrZjkuIrlrrblh7rnmoTniYzvvIznlKjkuo7mj5DnpLrlip/og71cbiAgICAgICAgICAgIHRoaXMuX2xhc3RQbGF5ZWRDYXJkcyA9IGRhdGEuY2FyZHMgfHwgW11cbiAgICAgICAgICAgIHRoaXMuX2xhc3RQbGF5ZWRIYW5kVHlwZSA9IGRhdGEuaGFuZF90eXBlIHx8IFwiXCJcblxuICAgICAgICAgICAgaWYgKCF0aGlzLm5vZGUgfHwgIXRoaXMubm9kZS5wYXJlbnQpIHJldHVyblxuXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR6I635Y+W5b2T5YmN546p5a62SUTvvIzliKTmlq3mmK/lkKbmmK/oh6rlt7Hlh7rniYxcbiAgICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7jgJHlronlhajojrflj5bnjqnlrrZJRO+8jOmBv+WFjeaKpemUmVxuICAgICAgICAgICAgdmFyIHNvY2tldEluZm8gPSBteWdsb2JhbC5zb2NrZXQuZ2V0UGxheWVySW5mbygpIHx8IHt9XG4gICAgICAgICAgICB2YXIgc2VydmVyUGxheWVySWQgPSAobXlnbG9iYWwucGxheWVyRGF0YSAmJiBteWdsb2JhbC5wbGF5ZXJEYXRhLnNlcnZlclBsYXllcklkKSB8fCBcIlwiXG4gICAgICAgICAgICB2YXIgYWNjb3VudElkID0gKG15Z2xvYmFsLnBsYXllckRhdGEgJiYgbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SUQpIHx8IFwiXCJcbiAgICAgICAgICAgIHZhciBteVBsYXllcklkID0gc29ja2V0SW5mby5pZCB8fCBzZXJ2ZXJQbGF5ZXJJZCB8fCBhY2NvdW50SWRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruOAkeS9v+eUqOabtOWuieWFqOeahOavlOi+g+aWueW8j1xuICAgICAgICAgICAgdmFyIGlzU2VsZiA9IFN0cmluZyhkYXRhLmFjY291bnRpZCB8fCBcIlwiKSA9PT0gU3RyaW5nKG15UGxheWVySWQgfHwgXCJcIilcblxuICAgICAgICAgICAgLy8g8J+Up+OAkOiwg+ivleOAkeivpue7huaJk+WNsElE5q+U6L6D5L+h5oGvXG5cbiAgICAgICAgICAgIC8vIPCflKfjgJDmoLjlv4Pkv67lpI3jgJHlpoLmnpzmmK/oh6rlt7Hlh7rniYzvvIzku47miYvniYzkuK3liKDpmaRcbiAgICAgICAgICAgIGlmIChpc1NlbGYpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVDYXJkc0Zyb21IYW5kKGRhdGEuY2FyZHMpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDwn5SK44CQ5paw5aKe44CR5pKt5pS+5Ye654mM6Z+z5pWIXG4gICAgICAgICAgICB0aGlzLl9wbGF5Q2FyZFNvdW5kKGRhdGEpXG5cbiAgICAgICAgICAgIC8vIOaYvuekuuWHuueahOeJjOWIsOahjOmdolxuICAgICAgICAgICAgdmFyIGdhbWVTY2VuZV9zY3JpcHQgPSB0aGlzLm5vZGUucGFyZW50LmdldENvbXBvbmVudChcImdhbWVTY2VuZVwiKVxuICAgICAgICAgICAgaWYgKCFnYW1lU2NlbmVfc2NyaXB0KSByZXR1cm5cblxuICAgICAgICAgICAgdmFyIG91dENhcmRfbm9kZSA9IGdhbWVTY2VuZV9zY3JpcHQuZ2V0VXNlck91dENhcmRQb3NCeUFjY291bnQoZGF0YS5hY2NvdW50aWQpXG4gICAgICAgICAgICBpZiAoIW91dENhcmRfbm9kZSB8fCAhdGhpcy5jYXJkX3ByZWZhYikgcmV0dXJuXG5cbiAgICAgICAgICAgIC8vIOOAkOmHjeimgeOAkeebtOaOpeS9v+eUqOacjeWKoeerr+aVsOaNruWIm+W7uuiKgueCuVxuICAgICAgICAgICAgdmFyIG5vZGVfY2FyZHMgPSBbXVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmNhcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNhcmQgPSBjYy5pbnN0YW50aWF0ZSh0aGlzLmNhcmRfcHJlZmFiKVxuICAgICAgICAgICAgICAgIGlmIChjYXJkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYXJkU2NyaXB0ID0gY2FyZC5nZXRDb21wb25lbnQoXCJjYXJkXCIpXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYXJkU2NyaXB0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJkU2NyaXB0LnNob3dDYXJkcyhkYXRhLmNhcmRzW2ldLCBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBub2RlX2NhcmRzLnB1c2goY2FyZClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNob3dPdXRDYXJkcyhvdXRDYXJkX25vZGUsIG5vZGVfY2FyZHMpXG5cbiAgICAgICAgICAgIC8vIOabtOaWsOWJqeS9meeJjOaVsFxuICAgICAgICAgICAgaWYgKGRhdGEuY2FyZHNfbGVmdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ub2RlLnBhcmVudC5lbWl0KFwidXBkYXRlX2NhcmRfY291bnRfZXZlbnRcIiwge1xuICAgICAgICAgICAgICAgICAgICBhY2NvdW50aWQ6IGRhdGEuYWNjb3VudGlkLFxuICAgICAgICAgICAgICAgICAgICBjb3VudDogZGF0YS5jYXJkc19sZWZ0XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIOebkeWQrOaKouWcsOS4u+mYtuauteW8gOWni1xuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25DYWxsTGFuZGxvcmRTdGFydChmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIHRoaXMuX2JpZGRpbmdQaGFzZSA9IFwiYmlkZGluZ1wiXG4gICAgICAgICAgICB0aGlzLl9nYW1lUGhhc2UgPSBcImJpZGRpbmdcIiAgLy8g8J+Up+OAkOaWsOWinuOAkeiuvue9rua4uOaIj+mYtuautVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g55uR5ZCs5oqi5Zyw5Li76L2u5qyhXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkNhbGxMYW5kbG9yZFR1cm4oZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICB0aGlzLl9wcm9jZXNzQ2FsbExhbmRsb3JkVHVybihkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g55uR5ZCs5oqi5Zyw5Li757uT5p6cXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkNhbGxMYW5kbG9yZFJlc3VsdChmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIC8vIPCflJLjgJDph43opoHjgJHmlLbliLDnu5PmnpzvvIzlgZzmraLlgJLorqHml7ZcbiAgICAgICAgICAgIHRoaXMuX3N0b3BCaWRDb3VudGRvd24oKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5pKt5pS+5oqi5Zyw5Li76K+t6Z+zXG4gICAgICAgICAgICB0aGlzLl9wbGF5Um9iU291bmQoZGF0YSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHRoaXMubm9kZSAmJiB0aGlzLm5vZGUucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ub2RlLnBhcmVudC5lbWl0KFwiY2FsbF9sYW5kbG9yZF9yZXN1bHRfZXZlbnRcIiwgZGF0YSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIOebkeWQrOaKouWcsOS4u+mYtuautee7k+adn1xuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25DYWxsTGFuZGxvcmRFbmQoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAvLyDwn5SS44CQ6YeN6KaB44CR5YGc5q2i5omA5pyJ5YCS6K6h5pe2XG4gICAgICAgICAgICB0aGlzLl9zdG9wQmlkQ291bnRkb3duKClcbiAgICAgICAgICAgIHRoaXMuX2hpZGVSb2JVSSgpXG4gICAgICAgICAgICB0aGlzLl9iaWRkaW5nUGhhc2UgPSBcImlkbGVcIlxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR6YeN572u5oqi5Zyw5Li755u45YWz54q25oCBXG4gICAgICAgICAgICB0aGlzLnJvYl9wbGF5ZXJfYWNjb3VudGlkID0gMFxuICAgICAgICAgICAgdGhpcy5jYXJkc1JlYWR5ID0gZmFsc2UgIC8vIOmHjee9ruWPkeeJjOWujOaIkOagh+iusFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu44CR5L+d5a2Y5bqV54mM5pWw5o2uXG4gICAgICAgICAgICBpZiAoZGF0YS5ib3R0b21fY2FyZHMgJiYgZGF0YS5ib3R0b21fY2FyZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYm90dG9tQ2FyZHMgPSBkYXRhLmJvdHRvbV9jYXJkc1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ6YeN6KaB44CR5pi+56S65bqV54mM77yI5omA5pyJ546p5a626YO96IO955yL5Yiw77yJXG4gICAgICAgICAgICB0aGlzLl9zaG93Qm90dG9tQ2FyZHNUb0FsbChkYXRhLmJvdHRvbV9jYXJkcylcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHnm5HlkKzlnLDkuLvmlrDmiYvniYzmtojmga8gLSDlj6rmm7TmlrDlnLDkuLvnmoTmiYvniYzvvIzkuI3op6blj5Hph43mlrDlj5HniYxcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeW/hemhu+mqjOivgeiHquW3seaYr+WQpuaYr+WcsOS4u++8jOWPquacieWcsOS4u+aJjeabtOaWsOaJi+eJjFxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25MYW5kbG9yZENhcmRzKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu6aqM6K+B44CR5qOA5p+l6Ieq5bex5piv5ZCm5piv5Zyw5Li7XG4gICAgICAgICAgICB2YXIgbXlQbGF5ZXJJZCA9IG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKCkuaWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5zZXJ2ZXJQbGF5ZXJJZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRFxuICAgICAgICAgICAgdmFyIGxhbmRsb3JkSWQgPSBkYXRhLmxhbmRsb3JkX2lkIHx8IFwiXCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu44CR5Y+q5pyJ5b2T5Zyw5Li7SUTljLnphY3oh6rlt7Hml7bmiY3mm7TmlrDmiYvniYxcbiAgICAgICAgICAgIGlmIChTdHJpbmcobGFuZGxvcmRJZCkgIT09IFN0cmluZyhteVBsYXllcklkKSkge1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOOAkOmHjeimgeOAkeWPquabtOaWsOaJi+eJjOaVsOaNru+8jOS4jemHjeaWsOa4suafk+aVtOS4quWcuuaZr1xuICAgICAgICAgICAgdGhpcy5oYW5kQ2FyZHMgPSBkYXRhLmNhcmRzIHx8IFtdXG4gICAgICAgICAgICB0aGlzLmJvdHRvbUNhcmRzID0gZGF0YS5ib3R0b21fY2FyZHMgfHwgW11cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g44CQ6YeN6KaB44CR5L2/55So6Z2Z6buY5pu05paw77yM5LiN6Kem5Y+R5Y+R54mM5Yqo55S7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVMYW5kbG9yZEhhbmRDYXJkcyh0aGlzLmhhbmRDYXJkcylcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIOebkeWQrOmHjeaWsOWPkeeJjOmAmuefpe+8iOaJgOacieS6uumDveS4jeWPq+WcsOS4u++8iVxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25SZXN0YXJ0R2FtZShmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIC8vIOWBnOatouaJgOacieWAkuiuoeaXtlxuICAgICAgICAgICAgdGhpcy5fc3RvcEJpZENvdW50ZG93bigpXG4gICAgICAgICAgICB0aGlzLl9zdG9wUGxheUNvdW50ZG93bigpXG4gICAgICAgICAgICAvLyDpmpDol4/miqLlnLDkuLtVSVxuICAgICAgICAgICAgdGhpcy5faGlkZVJvYlVJKClcbiAgICAgICAgICAgIC8vIOmHjee9rueKtuaAgVxuICAgICAgICAgICAgdGhpcy5fYmlkZGluZ1BoYXNlID0gXCJpZGxlXCJcbiAgICAgICAgICAgIHRoaXMuX2dhbWVQaGFzZSA9IFwiaWRsZVwiICAvLyDwn5Sn44CQ5paw5aKe44CR6YeN572u5ri45oiP6Zi25q61XG4gICAgICAgICAgICB0aGlzLmNhcmRzUmVhZHkgPSBmYWxzZVxuICAgICAgICAgICAgdGhpcy5oYW5kQ2FyZHMgPSBbXVxuICAgICAgICAgICAgdGhpcy5ib3R0b21DYXJkcyA9IFtdXG4gICAgICAgICAgICB0aGlzLmNob29zZV9jYXJkX2RhdGEgPSBbXVxuICAgICAgICAgICAgLy8g5riF55CG5omA5pyJ5Y2h54mM6IqC54K5XG4gICAgICAgICAgICB0aGlzLmNsZWFyQWxsQ2FyZHMoKVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeebkeWQrOWHuueJjOmYtuauteW8gOWni1xuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25QbGF5U3RhcnQoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu44CR6K6+572u5ri45oiP6Zi25q615Li65Ye654mM6Zi25q61XG4gICAgICAgICAgICB0aGlzLl9nYW1lUGhhc2UgPSBcInBsYXlpbmdcIlxuICAgICAgICAgICAgdGhpcy5fYmlkZGluZ1BoYXNlID0gXCJpZGxlXCJcbiAgICAgICAgICAgIC8vIOmakOiXj+aKouWcsOS4u1VJ77yI56Gu5L+d5LiN5pi+56S677yJXG4gICAgICAgICAgICB0aGlzLl9oaWRlUm9iVUkoKVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g8J+UiuOAkOaWsOWinuOAkeebkeWQrOa4uOaIj+e7k+adn1xuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25HYW1lT3ZlcihmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5YGc5q2i5omA5pyJ5YCS6K6h5pe2XG4gICAgICAgICAgICB0aGlzLl9zdG9wUGxheUNvdW50ZG93bigpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHph43nva7muLjmiI/pmLbmrrVcbiAgICAgICAgICAgIHRoaXMuX2dhbWVQaGFzZSA9IFwiaWRsZVwiXG4gICAgICAgICAgICB0aGlzLl9iaWRkaW5nUGhhc2UgPSBcImlkbGVcIlxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5ri45oiP57uT5p2f5pe256uL5Y2z6YeN572u5omA5pyJ546p5a6255qE5YeG5aSH54q25oCBXG4gICAgICAgICAgICB0aGlzLl9yZXNldEFsbFBsYXllclJlYWR5U3RhdGUoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5pi+56S657uT566X5by556qXXG4gICAgICAgICAgICB0aGlzLl9zaG93R2FtZVJlc3VsdFBvcHVwKGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDnm5HlkKzmuLjmiI/nirbmgIHmgaLlpI1cbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uR2FtZVN0YXRlUmVzdG9yZShmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIHRoaXMucmVzdG9yZUdhbWVTdGF0ZShkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeebkeWQrOaPkOekuue7k+aenFxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25IaW50UmVzdWx0KGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgdGhpcy5fb25IaW50UmVzdWx0KGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDwn5Sn44CQ5omY566h44CR55uR5ZCs5omY566h54q25oCB5Y+Y5YyWXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vblRydXN0ZWVTdGF0ZU5vdGlmeShmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIHRoaXMuX29uVHJ1c3RlZVN0YXRlTm90aWZ5KGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgLy8g44CQ56ue5oqA5Zy644CR5raI5oGv55uR5ZCsXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICBcbiAgICAgICAgLy8g55uR5ZCs56ue5oqA5Zy654q25oCB5pu05pawXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkNvbXBldGl0aW9uU3RhdHVzKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgdGhpcy5fb25Db21wZXRpdGlvblN0YXR1cyhkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIFxuICAgICAgICAvLyDnm5HlkKznq57mioDlnLrlgJLorqHml7ZcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQ29tcGV0aXRpb25Db3VudGRvd24oZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICB0aGlzLl9vbkNvbXBldGl0aW9uQ291bnRkb3duKGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgXG4gICAgICAgIC8vIOebkeWQrOavlOi1m+mHkeW4geabtOaWsFxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25NYXRjaENvaW5VcGRhdGUoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICB0aGlzLl9vbk1hdGNoQ29pblVwZGF0ZShkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIFxuICAgICAgICAvLyDnm5HlkKzmt5jmsbDpgJrnn6VcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQ29tcGV0aXRpb25FbGltaW5hdGVkKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgdGhpcy5fb25Db21wZXRpdGlvbkVsaW1pbmF0ZWQoZGF0YSlcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICBcbiAgICAgICAgLy8g55uR5ZCs5pmL57qn6YCa55+lXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkNvbXBldGl0aW9uQWR2YW5jZShmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIHRoaXMuX29uQ29tcGV0aXRpb25BZHZhbmNlKGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgXG4gICAgICAgIC8vIOebkeWQrOWGoOWGm+W8ueeql1xuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25Db21wZXRpdGlvbkNoYW1waW9uKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgdGhpcy5fb25Db21wZXRpdGlvbkNoYW1waW9uKGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHnm5HlkKzmnIDnu4jmppzljZXmtojmga9cbiAgICAgICAgLy8g5b2T56ue5oqA5Zy65omA5pyJ6L2u5qyh57uT5p2f5pe277yM5pyN5Yqh56uv5Lya5Y+R6YCB5q2k5raI5oGvXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vblRvdXJuYW1lbnRGaW5hbFJhbmsoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj4YgW2dhbWVpbmdVSV0g5pS25Yiw5pyA57uI5qac5Y2VOlwiLCBKU09OLnN0cmluZ2lmeShkYXRhKSlcbiAgICAgICAgICAgIHRoaXMuX29uVG91cm5hbWVudEZpbmFsUmFuayhkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g5YaF6YOo5LqL5Lu277ya5pi+56S65bqV54mMXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHmraTkuovku7blt7Llup/lvIPvvIzpgLvovpHlt7Lnp7vliLAgb25DYWxsTGFuZGxvcmRFbmQg5ZKMIG9uTGFuZGxvcmRDYXJkc1xuICAgICAgICAvLyDkv53nlZnmraTnm5HlkKzlmajku4XnlKjkuo7lhbzlrrnml6fniYjmnKzvvIzkuI3lho3op6blj5EgcHVzaFRocmVlQ2FyZFxuICAgICAgICB0aGlzLm5vZGUub24oXCJzaG93X2JvdHRvbV9jYXJkX2V2ZW50XCIsIGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkWRhdGEg5Y+v6IO95pivIHsgY2FyZHM6IFsuLi5dIH0g5a+56LGh5oiW5pWw57uEXG4gICAgICAgICAgICB2YXIgY2FyZHMgPSBkYXRhXG4gICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLmNhcmRzKSB7XG4gICAgICAgICAgICAgICAgY2FyZHMgPSBkYXRhLmNhcmRzXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWmguaenCBjYXJkcyDkuLrnqbrvvIzkuI3lpITnkIZcbiAgICAgICAgICAgIGlmICghY2FyZHMgfHwgY2FyZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeS4jeWGjeiwg+eUqCBwdXNoVGhyZWVDYXJk77yBXG4gICAgICAgICAgICAvLyDlupXniYzmmL7npLrlt7LnlLEgX3Nob3dCb3R0b21DYXJkc1RvQWxsIOWkhOeQhlxuICAgICAgICAgICAgLy8g5Zyw5Li75omL54mM5pu05paw5bey55SxIG9uTGFuZGxvcmRDYXJkcyDlpITnkIZcbiAgICAgICAgICAgIC8vIOWIoOmZpOS7peS4i+S7o+egge+8jOmBv+WFjemHjeWkjeWkhOeQhuWSjOW7tui/n++8mlxuICAgICAgICAgICAgLy8gdGhpcy5zY2hlZHVsZU9uY2UodGhpcy5wdXNoVGhyZWVDYXJkLCAwLjIpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5rOo5YaM55uR5ZCs6YCJ5oup54mM5raI5oGvXG4gICAgICAgIC8vIGNhcmQuanMg5piv5ZyoIGdhbWVTY2VuZV9ub2RlICh0aGlzLm5vZGUucGFyZW50KSDkuIogZW1pdCDkuovku7ZcbiAgICAgICAgLy8g5omA5Lul5b+F6aG75ZyoIHRoaXMubm9kZS5wYXJlbnQg5LiK55uR5ZCs77yM6ICM5LiN5pivIHRoaXMubm9kZVxuICAgICAgICB2YXIgZ2FtZVNjZW5lX25vZGUgPSB0aGlzLm5vZGUucGFyZW50XG4gICAgICAgIGlmIChnYW1lU2NlbmVfbm9kZSkge1xuICAgICAgICAgICAgZ2FtZVNjZW5lX25vZGUub24oXCJjaG9vc2VfY2FyZF9ldmVudFwiLCBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICAgICAgdGhpcy5jaG9vc2VfY2FyZF9kYXRhLnB1c2goZXZlbnQpXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeabtOaWsOW3sumAieeJjOaVsOaYvuekulxuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVNlbGVjdGVkQ291bnREaXNwbGF5KClcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAgICAgZ2FtZVNjZW5lX25vZGUub24oXCJ1bmNob29zZV9jYXJkX2V2ZW50XCIsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5q2j56Gu5Yy56YWN5Y2h54mM55qE5ZSv5LiA5qCH6K+G56ym77yIc3VpdCArIHJhbmvvvIlcbiAgICAgICAgICAgICAgICAvLyBldmVudCDnjrDlnKjmmK8ge3N1aXQsIHJhbmt9IOWvueixoVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jaG9vc2VfY2FyZF9kYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYXJkaWQgPSB0aGlzLmNob29zZV9jYXJkX2RhdGFbaV0uY2FyZGlkXG4gICAgICAgICAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpuWMuemFje+8iOWFvOWuueaWsOaXp+S4pOenjeagvOW8j++8iVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FyZGlkICYmIGNhcmRpZC5zdWl0ICE9PSB1bmRlZmluZWQgJiYgY2FyZGlkLnJhbmsgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5paw5qC85byP77yaY2FyZGlkIOaYr+WvueixoSB7c3VpdCwgcmFua31cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYXJkaWQuc3VpdCA9PT0gZXZlbnQuc3VpdCAmJiBjYXJkaWQucmFuayA9PT0gZXZlbnQucmFuaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hvb3NlX2NhcmRfZGF0YS5zcGxpY2UoaSwgMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNhcmRpZCA9PSBldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5pen5qC85byP5YW85a6577yaY2FyZGlkIOaYr+aVsOWtl1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaG9vc2VfY2FyZF9kYXRhLnNwbGljZShpLCAxKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5pu05paw5bey6YCJ54mM5pWw5pi+56S6XG4gICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlU2VsZWN0ZWRDb3VudERpc3BsYXkoKVxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHN0YXJ0ICgpIHt9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHpooTliqDovb3ljaHniYznsr7ngbXlm77pm4ZcbiAgICAgKiDnoa7kv53lnKjlj5HniYzkuYvliY3lm77pm4blt7Lnu4/lh4blpIflpb1cbiAgICAgKi9cbiAgICBfcHJlbG9hZENhcmRBdGxhczogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOajgOafpeaYr+WQpuW3sue7j+WKoOi9vVxuICAgICAgICBpZiAod2luZG93Ll9jYXJkQXRsYXNMb2FkZWQpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcIlVJL2NhcmQvY2FyZFwiLCBjYy5TcHJpdGVBdGxhcywgZnVuY3Rpb24oZXJyLCBhdGxhcykge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn4OPIFtfcHJlbG9hZENhcmRBdGxhc10g5Yqg6L295Y2h54mM5Zu+6ZuG5aSx6LSlOlwiLCBlcnIpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aW5kb3cuX2NhcmRBdGxhc0xvYWRlZCA9IHRydWVcbiAgICAgICAgICAgIHdpbmRvdy5fY2FyZEF0bGFzID0gYXRsYXNcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyBbX3ByZWxvYWRDYXJkQXRsYXNdIOWNoeeJjOWbvumbhumihOWKoOi9veaIkOWKn1wiKVxuICAgICAgICB9KVxuICAgIH0sXG4gICAgXG4gICAgb25EZXN0cm95ICgpIHtcbiAgICAgICAgdGhpcy5fc3RvcFBsYXlDb3VudGRvd24oKVxuICAgICAgICB0aGlzLl9zdG9wQmlkQ291bnRkb3duKClcbiAgICAgICAgXG4gICAgICAgIC8vIOOAkOernuaKgOWcuuOAkea4heeQhuernuaKgOWcuuWAkuiuoeaXtlxuICAgICAgICBpZiAodGhpcy5fY29tcGV0aXRpb25Db3VudGRvd25UaW1lcikge1xuICAgICAgICAgICAgdGhpcy51bnNjaGVkdWxlKHRoaXMuX2NvbXBldGl0aW9uQ291bnRkb3duVGljaylcbiAgICAgICAgICAgIHRoaXMuX2NvbXBldGl0aW9uQ291bnRkb3duVGltZXIgPSBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHmuIXnkIbmnKzlnLDnq57mioDlnLrlgJLorqHml7ZcbiAgICAgICAgaWYgKHRoaXMuX2xvY2FsQXJlbmFDb3VudGRvd25UaW1lcikge1xuICAgICAgICAgICAgdGhpcy51bnNjaGVkdWxlKHRoaXMuX2xvY2FsQXJlbmFDb3VudGRvd25UaWNrKVxuICAgICAgICAgICAgdGhpcy5fbG9jYWxBcmVuYUNvdW50ZG93blRpbWVyID0gbnVsbFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDjgJDnq57mioDlnLrjgJHmuIXnkIbmr5TotZvph5HluIHmmL7npLpcbiAgICAgICAgdGhpcy5faGlkZU1hdGNoQ29pbkRpc3BsYXkoKVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDjgJDmoLjlv4PjgJHllK/kuIDmuLLmn5PlhaXlj6NcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICAvKipcbiAgICAgKiDjgJDmoLjlv4PjgJHmuLLmn5PmiYvniYwgLSDllK/kuIDlhaXlj6NcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBjYXJkcyAtIOacjeWKoeerr+WOn+Wni+aJi+eJjOaVsOaNrlxuICAgICAqL1xuICAgIHJlbmRlckNhcmRzOiBmdW5jdGlvbihjYXJkcykge1xuICAgICAgICBpZiAoIWNhcmRzIHx8IGNhcmRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKXjgJDpmLLph43lpI3muLLmn5PjgJHmo4Dmn6XmmK/lkKbkuI7kuIrmrKHnm7jlkIxcbiAgICAgICAgdmFyIGhhc2ggPSBKU09OLnN0cmluZ2lmeShjYXJkcylcbiAgICAgICAgaWYgKHRoaXMuX2xhc3RSZW5kZXJIYXNoID09PSBoYXNoKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9sYXN0UmVuZGVySGFzaCA9IGhhc2hcbiAgICAgICAgXG4gICAgICAgIC8vIOOAkOaguOW/g+OAkeS9v+eUqOaWl+WcsOS4u+inhOWImeaOkuW6j++8muWkp+eOiyA+IOWwj+eOiyA+IDIgPiBBID4gSyA+IFEgPiBKID4gMTAgPiA5ID4gOCA+IDcgPiA2ID4gNSA+IDQgPiAzXG4gICAgICAgIHZhciBzb3J0ZWRDYXJkcyA9IHRoaXMuX3NvcnRDYXJkcyhjYXJkcylcbiAgICAgICAgXG4gICAgICAgIC8vIOOAkOaguOW/g+OAkea4heeQhuaJgOacieaXp+iKgueCue+8iOino+WGs+iDjOmdoueJjOaui+eVme+8iVxuICAgICAgICB0aGlzLmNsZWFyQWxsQ2FyZHMoKVxuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65bqV54mM6IqC54K5XG4gICAgICAgIHRoaXMuX2NyZWF0ZUJvdHRvbUNhcmRzKClcbiAgICAgICAgXG4gICAgICAgIC8vIOmakOiXj+WHuueJjFVJXG4gICAgICAgIGlmICh0aGlzLnBsYXlpbmdVSV9ub2RlKSB7XG4gICAgICAgICAgICB0aGlzLnBsYXlpbmdVSV9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCfjqzjgJDkv67lpI3jgJHkvb/nlKjpgJDlvKDlj5HniYzliqjnlLtcbiAgICAgICAgdGhpcy5fZGVhbENhcmRzV2l0aEFuaW1hdGlvbihzb3J0ZWRDYXJkcylcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCfjqzjgJDmlrDlop7jgJHpgJDlvKDlj5HniYzliqjnlLtcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBzb3J0ZWRDYXJkcyAtIOW3suaOkuW6j+eahOaJi+eJjOaVsOaNrlxuICAgICAqL1xuICAgIF9kZWFsQ2FyZHNXaXRoQW5pbWF0aW9uOiBmdW5jdGlvbihzb3J0ZWRDYXJkcykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIHZhciBjYXJkSW50ZXJ2YWwgPSBEZWFsQ29uZmlnLmNhcmRJbnRlcnZhbCAvIDEwMDAgIC8vIOi9rOaNouS4uuenklxuICAgICAgICB2YXIgYW5pbUR1cmF0aW9uID0gRGVhbENvbmZpZy5hbmltRHVyYXRpb25cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHnoa7kv53miYvniYzlrrnlmajlrZjlnKhcbiAgICAgICAgdmFyIGNhcmRQYXJlbnQgPSB0aGlzLmNhcmRzX25vZGVcbiAgICAgICAgaWYgKCFjYXJkUGFyZW50KSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+OriBbX2RlYWxDYXJkc1dpdGhBbmltYXRpb25dIGNhcmRzX25vZGUg5pyq5a6a5LmJXCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5Y+R54mM6LW35aeL5L2N572u77yI5bGP5bmV5Lit5aSu5LiK5pa577yM5qih5ouf5Y+R54mM5aCG77yJXG4gICAgICAgIHZhciBkZWNrUG9zID0gY2MudjIoRGVhbENvbmZpZy5kZWNrUG9zaXRpb24ueCwgRGVhbENvbmZpZy5kZWNrUG9zaXRpb24ueSlcbiAgICAgICAgXG4gICAgICAgIC8vIOmAkOW8oOWPkeeJjFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvcnRlZENhcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhcmREYXRhID0gc29ydGVkQ2FyZHNbaW5kZXhdXG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXRYID0gc2VsZi5fZ2V0Q2FyZFgoaW5kZXgsIHNvcnRlZENhcmRzLmxlbmd0aCwgQ2FyZExheW91dC5jYXJkU3BhY2luZylcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldFBvcyA9IGNjLnYyKHRhcmdldFgsIENhcmRMYXlvdXQuY2FyZFkpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDliJvlu7rljaHniYzoioLngrlcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhcmQgPSBjYy5pbnN0YW50aWF0ZShzZWxmLmNhcmRfcHJlZmFiKVxuICAgICAgICAgICAgICAgICAgICBpZiAoIWNhcmQpIHJldHVyblxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY2FyZC5zY2FsZSA9IENhcmRMYXlvdXQuY2FyZFNjYWxlXG4gICAgICAgICAgICAgICAgICAgIGNhcmQucGFyZW50ID0gY2FyZFBhcmVudCAgLy8g8J+Up+OAkOS/ruWkjeOAkeS9v+eUqOehruWumueahOaJi+eJjOWuueWZqFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g8J+OrCDku47lj5HniYzloIbkvY3nva7lvIDlp4tcbiAgICAgICAgICAgICAgICAgICAgY2FyZC5zZXRQb3NpdGlvbihkZWNrUG9zKVxuICAgICAgICAgICAgICAgICAgICBjYXJkLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgY2FyZC56SW5kZXggPSBpbmRleFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g6K6+572u5Y2h54mM5pi+56S6XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYXJkQ29tcCA9IGNhcmQuZ2V0Q29tcG9uZW50KFwiY2FyZFwiKVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FyZENvbXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRDb21wLnNob3dDYXJkcyhjYXJkRGF0YSwgbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SUQpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIPCfjqwg5pKt5pS+5Y+R54mM5Yqo55S7XG4gICAgICAgICAgICAgICAgICAgIGNjLnR3ZWVuKGNhcmQpXG4gICAgICAgICAgICAgICAgICAgICAgICAudG8oYW5pbUR1cmF0aW9uLCB7IHBvc2l0aW9uOiB0YXJnZXRQb3MgfSwgeyBlYXNpbmc6ICdzaW5lT3V0JyB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNhbGwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Yqo55S75a6M5oiQ5Zue6LCDXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIPCflIog5pKt5pS+5Y+R54mM6Z+z5pWIXG4gICAgICAgICAgICAgICAgICAgIGlmIChpc29wZW5fc291bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYXlTb3VuZChcInNvdW5kL2ZhcGFpMVwiKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH0sIGluZGV4ICogY2FyZEludGVydmFsKVxuICAgICAgICAgICAgfSkoaSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5Y+R54mM5a6M5oiQ5ZCO5Zue6LCDXG4gICAgICAgIHZhciB0b3RhbERlYWxUaW1lID0gc29ydGVkQ2FyZHMubGVuZ3RoICogY2FyZEludGVydmFsICsgYW5pbUR1cmF0aW9uXG4gICAgICAgIHRoaXMuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5fb25EZWFsQ2FyZHNDb21wbGV0ZShzb3J0ZWRDYXJkcylcbiAgICAgICAgfSwgdG90YWxEZWFsVGltZSlcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCfjqzjgJDmlrDlop7jgJHlj5HniYzlrozmiJDlm57osINcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBzb3J0ZWRDYXJkcyAtIOW3suaOkuW6j+eahOaJi+eJjOaVsOaNrlxuICAgICAqL1xuICAgIF9vbkRlYWxDYXJkc0NvbXBsZXRlOiBmdW5jdGlvbihzb3J0ZWRDYXJkcykge1xuICAgICAgICAvLyDmoIforrDlsLHnu6pcbiAgICAgICAgdGhpcy5jYXJkc1JlYWR5ID0gdHJ1ZVxuICAgICAgICB0aGlzLmZhcGFpX2VuZCA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIC8vIOmAmuefpeWFtuS7lueOqeWutuiKgueCuVxuICAgICAgICBpZiAodGhpcy5ub2RlLnBhcmVudCkge1xuICAgICAgICAgICAgdGhpcy5ub2RlLnBhcmVudC5lbWl0KFwicHVzaGNhcmRfb3RoZXJfZXZlbnRcIilcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm6ZyA6KaB5pi+56S65oqi5Zyw5Li75oyJ6ZKuXG4gICAgICAgIHRoaXMuX2NoZWNrQW5kU2hvd1JvYlVJKClcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOOAkOaguOW/g+OAkeiuoeeul+eJjOWKm+WAvO+8iOaWl+WcsOS4u+inhOWIme+8iVxuICAgICAqIOWkp+eOiz0xNSwg5bCP546LPTE0LCAyPTEzLCBBPTEyLCBLPTExLCBRPTEwLCBKPTksIDEwPTgsIC4uLiwgMz0xXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNhcmQgLSDljaHniYzmlbDmja5cbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfSDniYzlipvlgLxcbiAgICAgKi9cbiAgICBnZXRDYXJkVmFsdWU6IGZ1bmN0aW9uKGNhcmQpIHtcbiAgICAgICAgdmFyIHJhbmsgPSBjYXJkLnJhbmtcbiAgICAgICAgXG4gICAgICAgIGlmIChyYW5rID09PSAzKSByZXR1cm4gMSAgIC8vIDNcbiAgICAgICAgaWYgKHJhbmsgPT09IDQpIHJldHVybiAyICAgLy8gNFxuICAgICAgICBpZiAocmFuayA9PT0gNSkgcmV0dXJuIDMgICAvLyA1XG4gICAgICAgIGlmIChyYW5rID09PSA2KSByZXR1cm4gNCAgIC8vIDZcbiAgICAgICAgaWYgKHJhbmsgPT09IDcpIHJldHVybiA1ICAgLy8gN1xuICAgICAgICBpZiAocmFuayA9PT0gOCkgcmV0dXJuIDYgICAvLyA4XG4gICAgICAgIGlmIChyYW5rID09PSA5KSByZXR1cm4gNyAgIC8vIDlcbiAgICAgICAgaWYgKHJhbmsgPT09IDEwKSByZXR1cm4gOCAgLy8gMTBcbiAgICAgICAgaWYgKHJhbmsgPT09IDExKSByZXR1cm4gOSAgLy8gSlxuICAgICAgICBpZiAocmFuayA9PT0gMTIpIHJldHVybiAxMCAvLyBRXG4gICAgICAgIGlmIChyYW5rID09PSAxMykgcmV0dXJuIDExIC8vIEtcbiAgICAgICAgaWYgKHJhbmsgPT09IDE0KSByZXR1cm4gMTIgLy8gQVxuICAgICAgICBpZiAocmFuayA9PT0gMTUpIHJldHVybiAxMyAvLyAyXG4gICAgICAgIGlmIChyYW5rID09PSAxNikgcmV0dXJuIDE0IC8vIOWwj+eOi1xuICAgICAgICBpZiAocmFuayA9PT0gMTcpIHJldHVybiAxNSAvLyDlpKfnjotcbiAgICAgICAgXG4gICAgICAgIHJldHVybiAwXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDjgJDmoLjlv4PjgJHkvb/nlKggZ2V0Q2FyZFZhbHVlIOaOkuW6j+aJi+eJjFxuICAgICAqIOaWl+WcsOS4u+agh+WHhuaOkuW6j++8muWkp+eOiyA+IOWwj+eOiyA+IDIgPiBBID4gSyA+IFEgPiBKID4gMTAgPiA5ID4gOCA+IDcgPiA2ID4gNSA+IDQgPiAzXG4gICAgICogQHBhcmFtIHtBcnJheX0gY2FyZHMgLSDmnI3liqHnq6/ljp/lp4vmiYvniYzmlbDmja5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IOaOkuW6j+WQjueahOaJi+eJjOaVsOaNrlxuICAgICAqL1xuICAgIF9zb3J0Q2FyZHM6IGZ1bmN0aW9uKGNhcmRzKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICAvLyDlpI3liLbmlbDnu4TvvIzpgb/lhY3kv67mlLnljp/mlbDmja5cbiAgICAgICAgdmFyIHNvcnRlZENhcmRzID0gY2FyZHMuc2xpY2UoKVxuICAgICAgICBcbiAgICAgICAgLy8g5L2/55SoIGdldENhcmRWYWx1ZSDku47lpKfliLDlsI/mjpLluo9cbiAgICAgICAgc29ydGVkQ2FyZHMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWVBID0gc2VsZi5nZXRDYXJkVmFsdWUoYSlcbiAgICAgICAgICAgIHZhciB2YWx1ZUIgPSBzZWxmLmdldENhcmRWYWx1ZShiKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlhYjmjIkgdmFsdWUg5LuO5aSn5Yiw5bCP5o6S5bqPXG4gICAgICAgICAgICBpZiAodmFsdWVBICE9PSB2YWx1ZUIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVCIC0gdmFsdWVBXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB2YWx1ZSDnm7jlkIzml7bvvIzmjInoirHoibLmjpLluo/vvIjpu5HmoYMgPiDnuqLlv4MgPiDmooXoirEgPiDmlrnlnZfvvIlcbiAgICAgICAgICAgIHJldHVybiBhLnN1aXQgLSBiLnN1aXRcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBzb3J0ZWRDYXJkc1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog44CQ5qC45b+D44CR5riF55CG5omA5pyJ5pen6IqC54K577yI6Kej5Yaz6IOM6Z2i54mM5q6L55WZ77yJXG4gICAgICog8J+UpeOAkOS/ruWkjeOAkeWQjOaXtua4heeQhiBjYXJkc19ub2RlIOWSjCBub2RlLnBhcmVudO+8jOehruS/neaXoOaui+eVmVxuICAgICAqL1xuICAgIGNsZWFyQWxsQ2FyZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5Y+q5riF55CG5omL54mM5a655Zmo5Lit55qE6IqC54K577yM5LiN6YGN5Y6Gbm9kZS5wYXJlbnRcbiAgICAgICAgaWYgKHRoaXMuY2FyZHNfbm9kZSkge1xuICAgICAgICAgICAgdGhpcy5jYXJkc19ub2RlLnJlbW92ZUFsbENoaWxkcmVuKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCfjq4gW2NsZWFyQWxsQ2FyZHNdIGNhcmRzX25vZGUg5pyq5a6a5LmJXCIpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOa4heepuumAieS4reeahOeJjOaVsOaNrlxuICAgICAgICB0aGlzLmNob29zZV9jYXJkX2RhdGEgPSBbXVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog6K6h566X54mM55qEWOWdkOagh1xuICAgICAqL1xuICAgIF9nZXRDYXJkWDogZnVuY3Rpb24oaW5kZXgsIGNvdW50LCBzcGFjaW5nKSB7XG4gICAgICAgIHZhciB0b3RhbFdpZHRoID0gKGNvdW50IC0gMSkgKiBzcGFjaW5nXG4gICAgICAgIHZhciBzdGFydFggPSAtdG90YWxXaWR0aCAvIDJcbiAgICAgICAgcmV0dXJuIHN0YXJ0WCArIGluZGV4ICogc3BhY2luZ1xuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDlupXniYznm7jlhbNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICAvKipcbiAgICAgKiDliJvlu7rlupXniYzmmL7npLrvvIjniYzog4zvvIlcbiAgICAgKi9cbiAgICBfY3JlYXRlQm90dG9tQ2FyZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDmuIXnkIbml6flupXniYxcbiAgICAgICAgaWYgKHRoaXMuYm90dG9tX2NhcmQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ib3R0b21fY2FyZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmJvdHRvbV9jYXJkW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYm90dG9tX2NhcmRbaV0uZGVzdHJveSgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuYm90dG9tX2NhcmQgPSBbXVxuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLmJvdHRvbV9jYXJkX3Bvc19ub2RlIHx8ICF0aGlzLmNhcmRfcHJlZmFiKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHZhciBib3R0b21ZID0gdGhpcy5ib3R0b21fY2FyZF9wb3Nfbm9kZS55XG4gICAgICAgIHZhciBib3R0b21TdGFydFggPSB0aGlzLmJvdHRvbV9jYXJkX3Bvc19ub2RlLnggLSBDYXJkTGF5b3V0LmJvdHRvbUNhcmRTcGFjaW5nXG4gICAgICAgIFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgICAgICAgdmFyIGRpX2NhcmQgPSBjYy5pbnN0YW50aWF0ZSh0aGlzLmNhcmRfcHJlZmFiKVxuICAgICAgICAgICAgaWYgKCFkaV9jYXJkKSBjb250aW51ZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBkaV9jYXJkLnNjYWxlID0gQ2FyZExheW91dC5ib3R0b21DYXJkU2NhbGVcbiAgICAgICAgICAgIGRpX2NhcmQuc2V0UG9zaXRpb24oYm90dG9tU3RhcnRYICsgQ2FyZExheW91dC5ib3R0b21DYXJkU3BhY2luZyAqIGksIGJvdHRvbVkpXG4gICAgICAgICAgICBkaV9jYXJkLnBhcmVudCA9IHRoaXMubm9kZS5wYXJlbnRcbiAgICAgICAgICAgIGRpX2NhcmQuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgdGhpcy5ib3R0b21fY2FyZC5wdXNoKGRpX2NhcmQpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g5Y+r5Zyw5Li7L+aKouWcsOS4u+ebuOWFs1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgX2NoZWNrQW5kU2hvd1JvYlVJOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIGlmICghbXlnbG9iYWwpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeWmguaenOWcqOWHuueJjOmYtuaute+8jOS4jeaYvuekuuaKouWcsOS4u+aMiemSrlxuICAgICAgICB2YXIgUm9vbVN0YXRlID0gd2luZG93LlJvb21TdGF0ZSB8fCB7fVxuICAgICAgICBpZiAodGhpcy5fYmlkZGluZ1BoYXNlID09PSBcImlkbGVcIiAmJiB0aGlzLl9nYW1lUGhhc2UgPT09IFwicGxheWluZ1wiKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIG15UGxheWVySWQgPSBteWdsb2JhbC5zb2NrZXQuZ2V0UGxheWVySW5mbygpLmlkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEuc2VydmVyUGxheWVySWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SURcbiAgICAgICAgaWYgKHRoaXMucm9iX3BsYXllcl9hY2NvdW50aWQgPT0gbXlQbGF5ZXJJZCAmJiB0aGlzLmNhcmRzUmVhZHkgJiYgdGhpcy5yb2JVSSAmJiAhdGhpcy5yb2JVSS5hY3RpdmUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9iaWRkaW5nUGhhc2UgPT09IFwiYmlkZGluZ1wiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvd0JpZFVJKFwi5Y+r5Zyw5Li7XCIsIFwi5LiN5Y+rXCIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3dCaWRVSShcIuaKouWcsOS4u1wiLCBcIuS4jeaKolwiKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9wcm9jZXNzQ2FsbExhbmRsb3JkVHVybjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCkgcmV0dXJuXG5cbiAgICAgICAgdmFyIHBsYXllcklkID0gZGF0YS5wbGF5ZXJfaWRcbiAgICAgICAgdmFyIHRpbWVvdXQgPSBkYXRhLnRpbWVvdXQgfHwgMTVcbiAgICAgICAgdmFyIHJvdW5kID0gZGF0YS5yb3VuZCB8fCAxXG4gICAgICAgIHZhciBleHBpcmVzQXQgPSBkYXRhLmV4cGlyZXNfYXQgfHwgMCAgLy8g8J+Up+OAkOaWsOWinuOAkeacjeWKoeerr+i/h+acn+aXtumXtOaIs++8iOavq+enku+8iVxuXG4gICAgICAgIC8vIPCflJLjgJDph43opoHjgJHlhYjlgZzmraLkuYvliY3nmoTlgJLorqHml7bvvIjmnI3liqHlmajova7ovazkuobvvIlcbiAgICAgICAgdGhpcy5fc3RvcEJpZENvdW50ZG93bigpXG5cbiAgICAgICAgdGhpcy5yb2JfcGxheWVyX2FjY291bnRpZCA9IHBsYXllcklkXG4gICAgICAgIHRoaXMuX2JpZFRpbWVvdXQgPSB0aW1lb3V0XG4gICAgICAgIHRoaXMuX2JpZGRpbmdQaGFzZSA9IHJvdW5kID09PSAxID8gXCJiaWRkaW5nXCIgOiBcInJvYmJpbmdcIlxuICAgICAgICB0aGlzLl9iaWRFeHBpcmVzQXQgPSBleHBpcmVzQXQgIC8vIPCflKfjgJDmlrDlop7jgJHkv53lrZjov4fmnJ/ml7bpl7RcblxuICAgICAgICB2YXIgbXlQbGF5ZXJJZCA9IG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKCkuaWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5zZXJ2ZXJQbGF5ZXJJZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRFxuXG4gICAgICAgIGlmIChTdHJpbmcocGxheWVySWQpID09PSBTdHJpbmcobXlQbGF5ZXJJZCkgJiYgdGhpcy5jYXJkc1JlYWR5KSB7XG4gICAgICAgICAgICBpZiAocm91bmQgPT09IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zaG93QmlkVUkoXCLlj6vlnLDkuLtcIiwgXCLkuI3lj6tcIilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvd0JpZFVJKFwi5oqi5Zyw5Li7XCIsIFwi5LiN5oqiXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9oaWRlUm9iVUkoKVxuICAgICAgICAgICAgaWYgKHRoaXMubm9kZSAmJiB0aGlzLm5vZGUucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ub2RlLnBhcmVudC5lbWl0KFwiY2FsbF9sYW5kbG9yZF90dXJuX2V2ZW50XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyX2lkOiBwbGF5ZXJJZCxcbiAgICAgICAgICAgICAgICAgICAgdGltZW91dDogdGltZW91dCxcbiAgICAgICAgICAgICAgICAgICAgcm91bmQ6IHJvdW5kLFxuICAgICAgICAgICAgICAgICAgICBleHBpcmVzX2F0OiBleHBpcmVzQXRcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9zaG93QmlkVUk6IGZ1bmN0aW9uKGNvbmZpcm1UZXh0LCBjYW5jZWxUZXh0KSB7XG4gICAgICAgIGlmICghdGhpcy5yb2JVSSkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5wbGF5aW5nVUlfbm9kZSkge1xuICAgICAgICAgICAgdGhpcy5wbGF5aW5nVUlfbm9kZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgY29uZmlybUJ0biA9IHRoaXMucm9iVUkuZ2V0Q2hpbGRCeU5hbWUoXCJidG5fcWlhbmR6XCIpXG4gICAgICAgIHZhciBjYW5jZWxCdG4gPSB0aGlzLnJvYlVJLmdldENoaWxkQnlOYW1lKFwiYnRuX2J1cWlhbmR6XCIpXG4gICAgICAgIFxuICAgICAgICBpZiAoY29uZmlybUJ0bikge1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gY29uZmlybUJ0bi5nZXRDaGlsZEJ5TmFtZShcIkxhYmVsXCIpXG4gICAgICAgICAgICBpZiAobGFiZWwgJiYgbGFiZWwuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKSkge1xuICAgICAgICAgICAgICAgIGxhYmVsLmdldENvbXBvbmVudChjYy5MYWJlbCkuc3RyaW5nID0gY29uZmlybVRleHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGNhbmNlbEJ0bikge1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gY2FuY2VsQnRuLmdldENoaWxkQnlOYW1lKFwiTGFiZWxcIilcbiAgICAgICAgICAgIGlmIChsYWJlbCAmJiBsYWJlbC5nZXRDb21wb25lbnQoY2MuTGFiZWwpKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKS5zdHJpbmcgPSBjYW5jZWxUZXh0XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMucm9iVUkuYWN0aXZlID0gdHJ1ZVxuICAgICAgICB0aGlzLl9zdGFydEJpZENvdW50ZG93bigpXG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5ub2RlICYmIHRoaXMubm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkvKDpgJLljIXlkKsgdGltZW91dCDnmoTlr7nosaFcbiAgICAgICAgICAgIHRoaXMubm9kZS5wYXJlbnQuZW1pdChcImNhbnJvYl9ldmVudFwiLCB7XG4gICAgICAgICAgICAgICAgcGxheWVyX2lkOiB0aGlzLnJvYl9wbGF5ZXJfYWNjb3VudGlkLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQ6IHRoaXMuX2JpZFRpbWVvdXQgfHwgMTVcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIF9oaWRlUm9iVUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5yb2JVSSkge1xuICAgICAgICAgICAgdGhpcy5yb2JVSS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3N0b3BCaWRDb3VudGRvd24oKVxuICAgIH0sXG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g8J+VkOOAkOWAkuiuoeaXtuezu+e7n+OAkeagh+WHhuaWl+WcsOS4u+WAkuiuoeaXtu+8iOW4puWIhuauteWCrOS/g+aViOaenO+8iVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICog8J+VkOOAkOe7n+S4gOWFpeWPo+OAkeW8gOWni+aKouWcsOS4u+WAkuiuoeaXtlxuICAgICAqIPCflKfjgJDkv67lpI3jgJHmoLnmja7mnI3liqHnq6/ov4fmnJ/ml7bpl7TorqHnrpfliankvZnml7bpl7TvvIznoa7kv53kuI7mnI3liqHnq6/lkIzmraVcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSDlgJLorqHml7bnp5LmlbDvvIjlpIfnlKjvvIzlpoLmnpwgZXhwaXJlc19hdCDml6DmlYjliJnkvb/nlKjvvIlcbiAgICAgKi9cbiAgICBfc3RhcnRCaWRDb3VudGRvd246IGZ1bmN0aW9uKGR1cmF0aW9uKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICAvLyDwn5SS44CQ6Ziy5oqk44CR5YWI5YGc5q2i5LmL5YmN55qE5YCS6K6h5pe2XG4gICAgICAgIHRoaXMuX3N0b3BCaWRDb3VudGRvd24oKVxuXG4gICAgICAgIHZhciB0aW1lb3V0ID0gZHVyYXRpb24gfHwgdGhpcy5fYmlkVGltZW91dCB8fCAxNVxuICAgICAgICB2YXIgZXhwaXJlc0F0ID0gdGhpcy5fYmlkRXhwaXJlc0F0IHx8IDBcblxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5qC55o2u5pyN5Yqh56uv6L+H5pyf5pe26Ze06K6h566X5Ymp5L2Z5pe26Ze0XG4gICAgICAgIHZhciB0aW1lTGVmdCA9IHRpbWVvdXRcbiAgICAgICAgaWYgKGV4cGlyZXNBdCA+IDApIHtcbiAgICAgICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpXG4gICAgICAgICAgICB0aW1lTGVmdCA9IE1hdGgubWF4KDAsIE1hdGguZmxvb3IoKGV4cGlyZXNBdCAtIG5vdykgLyAxMDAwKSlcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2JpZFRpbWVMZWZ0ID0gdGltZUxlZnRcbiAgICAgICAgdGhpcy5faXNCaWRDb3VudGRvd25UaWNraW5nID0gdHJ1ZVxuICAgICAgICB0aGlzLl9pc0JpZFdhcm5pbmcgPSBmYWxzZVxuXG4gICAgICAgIC8vIPCflZAg5Yid5aeL5YyWVUnmmL7npLpcbiAgICAgICAgdGhpcy5fdXBkYXRlQmlkQ291bnRkb3duVUkoKVxuXG4gICAgICAgIC8vIPCflZAg5L2/55SoIGNjLk5vZGUg55qEIHNjaGVkdWxlIOWunueOsOavj+enkiB0aWNrXG4gICAgICAgIHRoaXMuc2NoZWR1bGUodGhpcy5fYmlkQ291bnRkb3duVGljaywgMSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+VkOOAkOaguOW/g1RpY2vjgJHmiqLlnLDkuLvlgJLorqHml7bmr4/np5LmiafooYxcbiAgICAgKi9cbiAgICBfYmlkQ291bnRkb3duVGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5faXNCaWRDb3VudGRvd25UaWNraW5nKSByZXR1cm5cblxuICAgICAgICB0aGlzLl9iaWRUaW1lTGVmdC0tXG5cbiAgICAgICAgLy8g8J+VkCDmm7TmlrBVSeaYvuekulxuICAgICAgICB0aGlzLl91cGRhdGVCaWRDb3VudGRvd25VSSgpXG5cbiAgICAgICAgLy8g4pqg77iPIDXnp5LvvJrov5vlhaXorablkYrnirbmgIFcbiAgICAgICAgaWYgKHRoaXMuX2JpZFRpbWVMZWZ0ID09PSA1KSB7XG4gICAgICAgICAgICB0aGlzLl9lbnRlckJpZFdhcm5pbmdTdGF0ZSgpXG4gICAgICAgIH1cblxuICAgICAgICAvLyDwn5SKIDPnp5LvvJrlvIDlp4vmu7TnrZTpn7PvvIjmr4/np5LkuIDmrKHvvIlcbiAgICAgICAgaWYgKHRoaXMuX2JpZFRpbWVMZWZ0IDw9IDMgJiYgdGhpcy5fYmlkVGltZUxlZnQgPiAwKSB7XG4gICAgICAgICAgICB0aGlzLl9wbGF5VGlja1NvdW5kKClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOKPsCAw56eS77ya6Ieq5Yqo5aSE55CGXG4gICAgICAgIGlmICh0aGlzLl9iaWRUaW1lTGVmdCA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLl9vbkJpZENvdW50ZG93bkVuZCgpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+VkOOAkFVJ5pu05paw44CR5pu05paw5oqi5Zyw5Li75YCS6K6h5pe25pi+56S6XG4gICAgICovXG4gICAgX3VwZGF0ZUJpZENvdW50ZG93blVJOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJlbWFpbmluZyA9IHRoaXMuX2JpZFRpbWVMZWZ0XG4gICAgICAgIHZhciB1cGRhdGVkID0gZmFsc2VcblxuICAgICAgICAvLyDmlrnlvI8x77ya5L2/55SoIHByb3BlcnRpZXMg57uR5a6a55qEIExhYmVsXG4gICAgICAgIGlmICh0aGlzLmJpZENvdW50ZG93bkxhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLmJpZENvdW50ZG93bkxhYmVsLnN0cmluZyA9IFN0cmluZyhyZW1haW5pbmcpXG4gICAgICAgICAgICB1cGRhdGVkID0gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5pa55byPMu+8muWwneivleS7jiByb2JVSSDkuK3mn6Xmib7lgJLorqHml7YgTGFiZWxcbiAgICAgICAgaWYgKHRoaXMucm9iVUkpIHtcbiAgICAgICAgICAgIHZhciBjbG9ja05vZGUgPSB0aGlzLnJvYlVJLmdldENoaWxkQnlOYW1lKFwiY2xvY2tcIilcbiAgICAgICAgICAgIGlmIChjbG9ja05vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBjbG9ja05vZGUuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2pdXG4gICAgICAgICAgICAgICAgICAgIHZhciBsYWJlbCA9IGNoaWxkLmdldENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbC5zdHJpbmcgPSBTdHJpbmcocmVtYWluaW5nKVxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQub3BhY2l0eSA9IDI1NVxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwuZm9udFNpemUgPSAzMlxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwubGluZUhlaWdodCA9IDQwXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5zZXRDb250ZW50U2l6ZSg1MCwgNTApXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5LiN6YCa6L+HY29sb3Lorr7nva5hbHBoYVxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnpJbmRleCA9IDEwMFxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlZCA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmlrnlvI8z77ya6YCa55+lIHBsYXllcl9ub2RlIOabtOaWsOWAkuiuoeaXtlxuICAgICAgICBpZiAodGhpcy5ub2RlICYmIHRoaXMubm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZS5wYXJlbnQuZW1pdChcInVwZGF0ZV9jb3VudGRvd25fZXZlbnRcIiwge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiYmlkXCIsXG4gICAgICAgICAgICAgICAgcmVtYWluaW5nOiByZW1haW5pbmdcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog4pqg77iP44CQ6K2m5ZGK54q25oCB44CRNeenkuaXtui/m+WFpeitpuWRiueKtuaAgVxuICAgICAqL1xuICAgIF9lbnRlckJpZFdhcm5pbmdTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9pc0JpZFdhcm5pbmcpIHJldHVyblxuICAgICAgICB0aGlzLl9pc0JpZFdhcm5pbmcgPSB0cnVlXG5cbiAgICAgICAgLy8g6I635Y+W5YCS6K6h5pe2IExhYmVsIOiKgueCuVxuICAgICAgICB2YXIgbGFiZWxOb2RlID0gdGhpcy5fZ2V0QmlkQ291bnRkb3duTGFiZWxOb2RlKClcbiAgICAgICAgaWYgKCFsYWJlbE5vZGUpIHJldHVyblxuXG4gICAgICAgIC8vIOWPmOe6olxuICAgICAgICBsYWJlbE5vZGUuY29sb3IgPSBjYy5Db2xvci5SRURcblxuICAgICAgICAvLyDwn5SlIOWRvOWQuOe8qeaUvuWKqOeUu1xuICAgICAgICBsYWJlbE5vZGUuc3RvcEFsbEFjdGlvbnMoKVxuICAgICAgICBjYy50d2VlbihsYWJlbE5vZGUpXG4gICAgICAgICAgICAucmVwZWF0Rm9yZXZlcihcbiAgICAgICAgICAgICAgICBjYy50d2VlbigpXG4gICAgICAgICAgICAgICAgICAgIC50bygwLjMsIHsgc2NhbGU6IDEuMiB9KVxuICAgICAgICAgICAgICAgICAgICAudG8oMC4zLCB7IHNjYWxlOiAxLjAgfSlcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5zdGFydCgpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflZDjgJDojrflj5boioLngrnjgJHojrflj5bmiqLlnLDkuLvlgJLorqHml7ZMYWJlbOiKgueCuVxuICAgICAqIPCflKfjgJDkv67lpI3jgJHmn6Xmib4gY2xvY2sg5a2Q6IqC54K55Lit55qEIExhYmVsXG4gICAgICovXG4gICAgX2dldEJpZENvdW50ZG93bkxhYmVsTm9kZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLmJpZENvdW50ZG93bkxhYmVsICYmIHRoaXMuYmlkQ291bnRkb3duTGFiZWwubm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmlkQ291bnRkb3duTGFiZWwubm9kZVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnJvYlVJKSB7XG4gICAgICAgICAgICAvLyDmo4Dmn6UgY2xvY2sg6IqC54K55LiL55qEIExhYmVsXG4gICAgICAgICAgICB2YXIgY2xvY2tOb2RlID0gdGhpcy5yb2JVSS5nZXRDaGlsZEJ5TmFtZShcImNsb2NrXCIpXG4gICAgICAgICAgICBpZiAoY2xvY2tOb2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gY2xvY2tOb2RlLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGFiZWwgPSBjaGlsZHJlbltpXS5nZXRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNoaWxkcmVuW2ldXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDlhbbku5blj6/og73nmoTlkI3np7BcbiAgICAgICAgICAgIHZhciBsYWJlbE5hbWVzID0gW1wiY2xvY2tfIExhYmVsXCIsIFwiY2xvY2tfTGFiZWxcIiwgXCJ0aW1lX2xhYmVsXCIsIFwiY291bnRkb3duXCJdXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxhYmVsTmFtZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgbGFiZWxOb2RlID0gdGhpcy5yb2JVSS5nZXRDaGlsZEJ5TmFtZShsYWJlbE5hbWVzW2pdKVxuICAgICAgICAgICAgICAgIGlmIChsYWJlbE5vZGUgJiYgbGFiZWxOb2RlLmdldENvbXBvbmVudChjYy5MYWJlbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxhYmVsTm9kZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDij7DjgJDlsZXnpLrnu5PmnZ/jgJHmnKzlnLDlgJLorqHml7bmmL7npLrnu5PmnZ9cbiAgICAgKiDimqDvuI/jgJDph43opoHjgJHlj6rlgZpVSeWkhOeQhu+8jOS4jeWPkemAgeivt+axgu+8gVxuICAgICAqIOacjeWKoeWZqOS8muWcqOi2heaXtuWQjuiHquWKqOWkhOeQhu+8jOW5tuWPkemAgeS4i+S4gOS4qui9ruasoea2iOaBr1xuICAgICAqL1xuICAgIF9vbkJpZENvdW50ZG93bkVuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOWBnOatoiB0aWNrXG4gICAgICAgIHRoaXMuX2lzQmlkQ291bnRkb3duVGlja2luZyA9IGZhbHNlXG4gICAgICAgIHRoaXMudW5zY2hlZHVsZSh0aGlzLl9iaWRDb3VudGRvd25UaWNrKVxuXG4gICAgICAgIC8vIOWBnOatouWKqOeUu+W5tuaBouWkjeeKtuaAgVxuICAgICAgICB2YXIgbGFiZWxOb2RlID0gdGhpcy5fZ2V0QmlkQ291bnRkb3duTGFiZWxOb2RlKClcbiAgICAgICAgaWYgKGxhYmVsTm9kZSkge1xuICAgICAgICAgICAgbGFiZWxOb2RlLnN0b3BBbGxBY3Rpb25zKClcbiAgICAgICAgICAgIGxhYmVsTm9kZS5zY2FsZSA9IDFcbiAgICAgICAgICAgIGxhYmVsTm9kZS5jb2xvciA9IGNjLkNvbG9yLldISVRFXG4gICAgICAgIH1cblxuICAgICAgICAvLyDimqDvuI/jgJDph43opoHjgJHkuI3lj5HpgIHku7vkvZXor7fmsYLvvIFcbiAgICAgICAgLy8g5pyN5Yqh5Zmo5Lya5Zyo6LaF5pe25ZCO6Ieq5Yqo5aSE55CGXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflJLjgJDlgZzmraLjgJHlgZzmraLmiqLlnLDkuLvlgJLorqHml7ZcbiAgICAgKi9cbiAgICBfc3RvcEJpZENvdW50ZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX2lzQmlkQ291bnRkb3duVGlja2luZyA9IGZhbHNlXG4gICAgICAgIHRoaXMudW5zY2hlZHVsZSh0aGlzLl9iaWRDb3VudGRvd25UaWNrKVxuXG4gICAgICAgIC8vIOaBouWkjSBMYWJlbCDnirbmgIFcbiAgICAgICAgdmFyIGxhYmVsTm9kZSA9IHRoaXMuX2dldEJpZENvdW50ZG93bkxhYmVsTm9kZSgpXG4gICAgICAgIGlmIChsYWJlbE5vZGUpIHtcbiAgICAgICAgICAgIGxhYmVsTm9kZS5zdG9wQWxsQWN0aW9ucygpXG4gICAgICAgICAgICBsYWJlbE5vZGUuc2NhbGUgPSAxXG4gICAgICAgICAgICBsYWJlbE5vZGUuY29sb3IgPSBjYy5Db2xvci5XSElURVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5faXNCaWRXYXJuaW5nID0gZmFsc2VcbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g8J+VkOOAkOWHuueJjOWAkuiuoeaXtuOAkeagh+WHhuaWl+WcsOS4u+WAkuiuoeaXtu+8iOW4puWIhuauteWCrOS/g+aViOaenO+8iVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICog8J+VkOOAkOe7n+S4gOWFpeWPo+OAkeW8gOWni+WHuueJjOWAkuiuoeaXtlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIOWAkuiuoeaXtuenkuaVsO+8jOm7mOiupDE156eSXG4gICAgICovXG4gICAgX3N0YXJ0UGxheUNvdW50ZG93bjogZnVuY3Rpb24oZHVyYXRpb24pIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIC8vIPCflJLjgJDpmLLmiqTjgJHlhYjlgZzmraLkuYvliY3nmoTlgJLorqHml7ZcbiAgICAgICAgdGhpcy5fc3RvcFBsYXlDb3VudGRvd24oKVxuXG4gICAgICAgIHZhciB0aW1lb3V0ID0gZHVyYXRpb24gfHwgdGhpcy5fcGxheVRpbWVvdXQgfHwgMTVcbiAgICAgICAgdGhpcy5fcGxheVRpbWVMZWZ0ID0gdGltZW91dFxuICAgICAgICB0aGlzLl9pc1BsYXlDb3VudGRvd25UaWNraW5nID0gdHJ1ZVxuICAgICAgICB0aGlzLl9pc1BsYXlXYXJuaW5nID0gZmFsc2VcblxuICAgICAgICAvLyDwn5WQIOWIneWni+WMllVJ5pi+56S6XG4gICAgICAgIHRoaXMuX3VwZGF0ZVBsYXlDb3VudGRvd25VSSgpXG5cbiAgICAgICAgLy8g8J+VkCDkvb/nlKggY2MuTm9kZSDnmoQgc2NoZWR1bGUg5a6e546w5q+P56eSIHRpY2tcbiAgICAgICAgdGhpcy5zY2hlZHVsZSh0aGlzLl9wbGF5Q291bnRkb3duVGljaywgMSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+VkOOAkOaguOW/g1RpY2vjgJHlh7rniYzlgJLorqHml7bmr4/np5LmiafooYxcbiAgICAgKi9cbiAgICBfcGxheUNvdW50ZG93blRpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzUGxheUNvdW50ZG93blRpY2tpbmcpIHJldHVyblxuXG4gICAgICAgIHRoaXMuX3BsYXlUaW1lTGVmdC0tXG5cbiAgICAgICAgLy8g8J+VkCDmm7TmlrBVSeaYvuekulxuICAgICAgICB0aGlzLl91cGRhdGVQbGF5Q291bnRkb3duVUkoKVxuXG4gICAgICAgIC8vIOKaoO+4jyA156eS77ya6L+b5YWl6K2m5ZGK54q25oCBXG4gICAgICAgIGlmICh0aGlzLl9wbGF5VGltZUxlZnQgPT09IDUpIHtcbiAgICAgICAgICAgIHRoaXMuX2VudGVyUGxheVdhcm5pbmdTdGF0ZSgpXG4gICAgICAgIH1cblxuICAgICAgICAvLyDwn5SKIDPnp5LvvJrlvIDlp4vmu7TnrZTpn7PvvIjmr4/np5LkuIDmrKHvvIlcbiAgICAgICAgaWYgKHRoaXMuX3BsYXlUaW1lTGVmdCA8PSAzICYmIHRoaXMuX3BsYXlUaW1lTGVmdCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuX3BsYXlUaWNrU291bmQoKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g4o+wIDDnp5LvvJroh6rliqjlpITnkIZcbiAgICAgICAgaWYgKHRoaXMuX3BsYXlUaW1lTGVmdCA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLl9vblBsYXlDb3VudGRvd25FbmQoKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflZDjgJBVSeabtOaWsOOAkeabtOaWsOWHuueJjOWAkuiuoeaXtuaYvuekulxuICAgICAqIPCflKfjgJDkv67lpI3jgJHlj6rmm7TmlrDpl7npkp/ph4zpnaLnmoTlgJLorqHml7bvvIzkuI3lnKjlhbbku5bkvY3nva7mmL7npLpcbiAgICAgKi9cbiAgICBfdXBkYXRlUGxheUNvdW50ZG93blVJOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJlbWFpbmluZyA9IHRoaXMuX3BsYXlUaW1lTGVmdFxuXG4gICAgICAgIC8vIOaWueW8jzHvvJrkvb/nlKggcHJvcGVydGllcyDnu5HlrprnmoQgTGFiZWzvvIjlpoLmnpzmnInvvIlcbiAgICAgICAgaWYgKHRoaXMucGxheUNvdW50ZG93bkxhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLnBsYXlDb3VudGRvd25MYWJlbC5zdHJpbmcgPSBTdHJpbmcocmVtYWluaW5nKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5pa55byPMu+8mumAmuefpSBwbGF5ZXJfbm9kZSDmm7TmlrDlgJLorqHml7ZcbiAgICAgICAgaWYgKHRoaXMubm9kZSAmJiB0aGlzLm5vZGUucGFyZW50KSB7XG4gICAgICAgICAgICB2YXIgZXZlbnQgPSBuZXcgY2MuRXZlbnQuRXZlbnRDdXN0b20oXCJ1cGRhdGVfY291bnRkb3duX2V2ZW50XCIsIHRydWUpXG4gICAgICAgICAgICBldmVudC5zZXRVc2VyRGF0YSh7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJwbGF5XCIsXG4gICAgICAgICAgICAgICAgcmVtYWluaW5nOiByZW1haW5pbmdcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB0aGlzLm5vZGUucGFyZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpXG4gICAgICAgIH1cblxuICAgICAgICAvLyDmlrnlvI8z77ya55u05o6l5pu05pawIHBsYXlpbmdVSV9ub2RlIOS4reeahOmXuemSnyBMYWJlbFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR6Ze56ZKf6IqC54K56Lev5b6E77yacGxheWluZ1VJX25vZGUgLT4gY2xvY2sgLT4gcGxheWluZ19jbG9jbF9sYWJlbFxuICAgICAgICBpZiAodGhpcy5wbGF5aW5nVUlfbm9kZSkge1xuICAgICAgICAgICAgdmFyIGNsb2NrTm9kZSA9IHRoaXMucGxheWluZ1VJX25vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJjbG9ja1wiKVxuICAgICAgICAgICAgaWYgKGNsb2NrTm9kZSkge1xuICAgICAgICAgICAgICAgIC8vIOehruS/nSBjbG9jayDoioLngrnlj6/op4FcbiAgICAgICAgICAgICAgICBjbG9ja05vZGUuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgICAgIGNsb2NrTm9kZS5vcGFjaXR5ID0gMjU1XG5cbiAgICAgICAgICAgICAgICAvLyDmn6Xmib4gcGxheWluZ19jbG9jbF9sYWJlbO+8iOazqOaEj+aLvOWGme+8iVxuICAgICAgICAgICAgICAgIHZhciBjbG9ja0xhYmVsID0gY2xvY2tOb2RlLmdldENoaWxkQnlOYW1lKFwicGxheWluZ19jbG9jbF9sYWJlbFwiKVxuICAgICAgICAgICAgICAgIGlmIChjbG9ja0xhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsYWJlbCA9IGNsb2NrTGFiZWwuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgICAgICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLnN0cmluZyA9IFN0cmluZyhyZW1haW5pbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9ja0xhYmVsLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsb2NrTGFiZWwub3BhY2l0eSA9IDI1NVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5aSH6YCJ77ya5p+l5om+5Lu75L2VIExhYmVsIOWtkOiKgueCuVxuICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBjbG9ja05vZGUuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYWJlbCA9IGNoaWxkLmdldENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLnN0cmluZyA9IFN0cmluZyhyZW1haW5pbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLm9wYWNpdHkgPSAyNTVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5pu05paw6Ze56ZKf6YeM6Z2i55qE5YCS6K6h5pe25pi+56S6XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHJlbWFpbmluZyAtIOWJqeS9meenkuaVsFxuICAgICAqL1xuICAgIF91cGRhdGVDbG9ja1RpbWVMYWJlbDogZnVuY3Rpb24ocmVtYWluaW5nKSB7XG4gICAgICAgIC8vIOafpeaJviBnYW1lU2NlbmUg6IqC54K5XG4gICAgICAgIHZhciBnYW1lU2NlbmVOb2RlID0gdGhpcy5ub2RlLnBhcmVudFxuICAgICAgICBpZiAoIWdhbWVTY2VuZU5vZGUpIHJldHVyblxuXG4gICAgICAgIC8vIOmBjeWOhuaJgOacieWtkOiKgueCue+8jOaJvuWIsCBwbGF5ZXJfbm9kZe+8iOW9k+WJjeeOqeWutu+8iVxuICAgICAgICB2YXIgY2hpbGRyZW4gPSBnYW1lU2NlbmVOb2RlLmNoaWxkcmVuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldXG4gICAgICAgICAgICB2YXIgcGxheWVyTm9kZVNjcmlwdCA9IGNoaWxkLmdldENvbXBvbmVudChcInBsYXllcl9ub2RlXCIpXG4gICAgICAgICAgICBpZiAocGxheWVyTm9kZVNjcmlwdCAmJiBwbGF5ZXJOb2RlU2NyaXB0LnNlYXRfaW5kZXggPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyDmlrnlvI8x77ya5L2/55SoIHRpbWVfbGFiZWwg5bGe5oCnXG4gICAgICAgICAgICAgICAgaWYgKHBsYXllck5vZGVTY3JpcHQudGltZV9sYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJOb2RlU2NyaXB0LnRpbWVfbGFiZWwuc3RyaW5nID0gU3RyaW5nKHJlbWFpbmluZylcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDmlrnlvI8y77ya5p+l5om+IGNsb2NraW1hZ2Ug6IqC54K55Lit55qEIExhYmVs77yI5LiO5oqi5Zyw5Li75YCS6K6h5pe257G75Ly877yJXG4gICAgICAgICAgICAgICAgaWYgKHBsYXllck5vZGVTY3JpcHQuY2xvY2tpbWFnZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2xvY2tOb2RlID0gcGxheWVyTm9kZVNjcmlwdC5jbG9ja2ltYWdlXG4gICAgICAgICAgICAgICAgICAgIC8vIOehruS/nSBjbG9ja2ltYWdlIOWPr+ingVxuICAgICAgICAgICAgICAgICAgICBjbG9ja05vZGUuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBjbG9ja05vZGUub3BhY2l0eSA9IDI1NVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIOafpeaJviBjbG9ja2ltYWdlIOS4reeahCBMYWJlbFxuICAgICAgICAgICAgICAgICAgICB2YXIgY2xvY2tDaGlsZHJlbiA9IGNsb2NrTm9kZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNsb2NrQ2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjbG9ja0NoaWxkID0gY2xvY2tDaGlsZHJlbltqXVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhYmVsID0gY2xvY2tDaGlsZC5nZXRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbC5zdHJpbmcgPSBTdHJpbmcocmVtYWluaW5nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb2NrQ2hpbGQuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb2NrQ2hpbGQub3BhY2l0eSA9IDI1NVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOiuvue9ruWQiOmAgueahOWtl+S9k+Wkp+Wwj1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLmZvbnRTaXplID0gMzJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbC5saW5lSGVpZ2h0ID0gNDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9ja0NoaWxkLnNldENvbnRlbnRTaXplKDUwLCA1MClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5LiN6YCa6L+HY29sb3Lorr7nva5hbHBoYVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb2NrQ2hpbGQuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9ja0NoaWxkLnpJbmRleCA9IDEwMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpwgY2xvY2tpbWFnZSDmsqHmnIkgTGFiZWwg5a2Q6IqC54K577yM5qOA5p+l5piv5ZCm55u05o6l5pivIExhYmVsXG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXJlY3RMYWJlbCA9IGNsb2NrTm9kZS5nZXRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICAgICAgICAgIGlmIChkaXJlY3RMYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0TGFiZWwuc3RyaW5nID0gU3RyaW5nKHJlbWFpbmluZylcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOKaoO+4j+OAkOitpuWRiueKtuaAgeOAkTXnp5Lml7bov5vlhaXorablkYrnirbmgIFcbiAgICAgKi9cbiAgICBfZW50ZXJQbGF5V2FybmluZ1N0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzUGxheVdhcm5pbmcpIHJldHVyblxuICAgICAgICB0aGlzLl9pc1BsYXlXYXJuaW5nID0gdHJ1ZVxuXG4gICAgICAgIC8vIOiOt+WPluWAkuiuoeaXtiBMYWJlbCDoioLngrlcbiAgICAgICAgdmFyIGxhYmVsTm9kZSA9IHRoaXMuX2dldFBsYXlDb3VudGRvd25MYWJlbE5vZGUoKVxuICAgICAgICBpZiAoIWxhYmVsTm9kZSkgcmV0dXJuXG5cbiAgICAgICAgLy8g5Y+Y57qiXG4gICAgICAgIGxhYmVsTm9kZS5jb2xvciA9IGNjLkNvbG9yLlJFRFxuXG4gICAgICAgIC8vIPCflKUg5ZG85ZC457yp5pS+5Yqo55S7XG4gICAgICAgIGxhYmVsTm9kZS5zdG9wQWxsQWN0aW9ucygpXG4gICAgICAgIGNjLnR3ZWVuKGxhYmVsTm9kZSlcbiAgICAgICAgICAgIC5yZXBlYXRGb3JldmVyKFxuICAgICAgICAgICAgICAgIGNjLnR3ZWVuKClcbiAgICAgICAgICAgICAgICAgICAgLnRvKDAuMywgeyBzY2FsZTogMS4yIH0pXG4gICAgICAgICAgICAgICAgICAgIC50bygwLjMsIHsgc2NhbGU6IDEuMCB9KVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLnN0YXJ0KClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+VkOOAkOiOt+WPluiKgueCueOAkeiOt+WPluWHuueJjOWAkuiuoeaXtkxhYmVs6IqC54K5XG4gICAgICovXG4gICAgX2dldFBsYXlDb3VudGRvd25MYWJlbE5vZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDmlrnlvI8x77ya5L2/55SoIHByb3BlcnRpZXMg57uR5a6a55qEIExhYmVsXG4gICAgICAgIGlmICh0aGlzLnBsYXlDb3VudGRvd25MYWJlbCAmJiB0aGlzLnBsYXlDb3VudGRvd25MYWJlbC5ub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wbGF5Q291bnRkb3duTGFiZWwubm9kZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5pa55byPMu+8muS7jiBwbGF5aW5nVUlfbm9kZSDnmoTpl7npkp/kuK3ojrflj5YgTGFiZWxcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkemXuemSn+iKgueCuei3r+W+hO+8mnBsYXlpbmdVSV9ub2RlIC0+IGNsb2NrIC0+IHBsYXlpbmdfY2xvY2xfbGFiZWxcbiAgICAgICAgaWYgKHRoaXMucGxheWluZ1VJX25vZGUpIHtcbiAgICAgICAgICAgIHZhciBjbG9ja05vZGUgPSB0aGlzLnBsYXlpbmdVSV9ub2RlLmdldENoaWxkQnlOYW1lKFwiY2xvY2tcIilcbiAgICAgICAgICAgIGlmIChjbG9ja05vZGUpIHtcbiAgICAgICAgICAgICAgICAvLyDmn6Xmib4gcGxheWluZ19jbG9jbF9sYWJlbO+8iOazqOaEj+aLvOWGme+8iVxuICAgICAgICAgICAgICAgIHZhciBjbG9ja0xhYmVsID0gY2xvY2tOb2RlLmdldENoaWxkQnlOYW1lKFwicGxheWluZ19jbG9jbF9sYWJlbFwiKVxuICAgICAgICAgICAgICAgIGlmIChjbG9ja0xhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjbG9ja0xhYmVsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIOWkh+mAie+8muafpeaJvuS7u+S9lSBMYWJlbCDlrZDoioLngrlcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBjbG9ja05vZGUuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsYWJlbCA9IGNoaWxkcmVuW2ldLmdldENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5baV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOKPsOOAkOWxleekuue7k+adn+OAkeacrOWcsOWHuueJjOWAkuiuoeaXtuaYvuekuue7k+adn1xuICAgICAqIOKaoO+4j+OAkOmHjeimgeOAkeWPquWBmlVJ5aSE55CG77yM5LiN5Y+R6YCB6K+35rGC77yBXG4gICAgICog5pyN5Yqh5Zmo5Lya5Zyo6LaF5pe25ZCO6Ieq5Yqo5aSE55CG77yI6Ieq5Yqo5LiN5Ye677yJ77yM5bm25Y+R6YCB5LiL5LiA5Liq6L2u5qyh5raI5oGvXG4gICAgICovXG4gICAgX29uUGxheUNvdW50ZG93bkVuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOWBnOatoiB0aWNrXG4gICAgICAgIHRoaXMuX2lzUGxheUNvdW50ZG93blRpY2tpbmcgPSBmYWxzZVxuICAgICAgICB0aGlzLnVuc2NoZWR1bGUodGhpcy5fcGxheUNvdW50ZG93blRpY2spXG5cbiAgICAgICAgLy8g5YGc5q2i5Yqo55S75bm25oGi5aSN54q25oCBXG4gICAgICAgIHZhciBsYWJlbE5vZGUgPSB0aGlzLl9nZXRQbGF5Q291bnRkb3duTGFiZWxOb2RlKClcbiAgICAgICAgaWYgKGxhYmVsTm9kZSkge1xuICAgICAgICAgICAgbGFiZWxOb2RlLnN0b3BBbGxBY3Rpb25zKClcbiAgICAgICAgICAgIGxhYmVsTm9kZS5zY2FsZSA9IDFcbiAgICAgICAgICAgIGxhYmVsTm9kZS5jb2xvciA9IGNjLkNvbG9yLldISVRFXG4gICAgICAgIH1cblxuICAgICAgICAvLyDimqDvuI/jgJDph43opoHjgJHkuI3lj5HpgIHku7vkvZXor7fmsYLvvIFcbiAgICAgICAgLy8g5pyN5Yqh5Zmo5Lya5Zyo6LaF5pe25ZCO6Ieq5Yqo5aSE55CG77yaXG4gICAgICAgIC8vIDEuIOiHquWKqOS4jeWHulxuICAgICAgICAvLyAyLiDlj5HpgIEgY2FuX2NodV9jYXJkX25vdGlmeSDmiJYgZ2FtZV9vdmVyXG4gICAgICAgIC8vIOWuouaIt+err+WPqumcgOimgeWTjeW6lOacjeWKoeWZqOa2iOaBr1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5SS44CQ5YGc5q2i44CR5YGc5q2i5Ye654mM5YCS6K6h5pe2XG4gICAgICovXG4gICAgX3N0b3BQbGF5Q291bnRkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5faXNQbGF5Q291bnRkb3duVGlja2luZyA9IGZhbHNlXG4gICAgICAgIHRoaXMudW5zY2hlZHVsZSh0aGlzLl9wbGF5Q291bnRkb3duVGljaylcblxuICAgICAgICAvLyDmgaLlpI0gTGFiZWwg54q25oCBXG4gICAgICAgIHZhciBsYWJlbE5vZGUgPSB0aGlzLl9nZXRQbGF5Q291bnRkb3duTGFiZWxOb2RlKClcbiAgICAgICAgaWYgKGxhYmVsTm9kZSkge1xuICAgICAgICAgICAgbGFiZWxOb2RlLnN0b3BBbGxBY3Rpb25zKClcbiAgICAgICAgICAgIGxhYmVsTm9kZS5zY2FsZSA9IDFcbiAgICAgICAgICAgIGxhYmVsTm9kZS5jb2xvciA9IGNjLkNvbG9yLldISVRFXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pc1BsYXlXYXJuaW5nID0gZmFsc2VcbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g8J+UiuOAkOmfs+aViOOAkea7tOetlOmfs+aViO+8iDPnp5Llgqzkv4PvvIlcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIPCflIog5pKt5pS+5ru0562U6Z+z5pWI77yI55So5LqO5oqi5Zyw5Li75YCS6K6h5pe277yJXG4gICAgICovXG4gICAgX3BsYXlUaWNrU291bmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIWlzb3Blbl9zb3VuZCkgcmV0dXJuXG5cbiAgICAgICAgLy8g5LyY5YWI5L2/55So57uR5a6a55qE6Z+z5pWIXG4gICAgICAgIGlmICh0aGlzLnRpY2tBdWRpbykge1xuICAgICAgICAgICAgY2MuYXVkaW9FbmdpbmUucGxheUVmZmVjdCh0aGlzLnRpY2tBdWRpbywgZmFsc2UpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWFnOW6le+8muS9v+eUqOWPkeeJjOmfs+aViO+8iOWPr+abv+aNouS4uuS4k+eUqOa7tOetlOmfs+aViO+8iVxuICAgICAgICBwbGF5U291bmQoXCJzb3VuZC9mYXBhaTFcIilcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+UiiDmkq3mlL7mu7TnrZTpn7PmlYjvvIjnlKjkuo7lh7rniYzlgJLorqHml7bvvIlcbiAgICAgKi9cbiAgICBfcGxheVBsYXlUaWNrU291bmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIWlzb3Blbl9zb3VuZCkgcmV0dXJuXG5cbiAgICAgICAgLy8g5LyY5YWI5L2/55So57uR5a6a55qE6Z+z5pWIXG4gICAgICAgIGlmICh0aGlzLnRpY2tBdWRpbykge1xuICAgICAgICAgICAgY2MuYXVkaW9FbmdpbmUucGxheUVmZmVjdCh0aGlzLnRpY2tBdWRpbywgZmFsc2UpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWFnOW6le+8muS9v+eUqOWPkeeJjOmfs+aViFxuICAgICAgICBwbGF5U291bmQoXCJzb3VuZC9mYXBhaTFcIilcbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g8J+UiiDmiqLlnLDkuLvor63pn7Pns7vnu5/vvIjmnI3liqHnq6/pqbHliqjvvIlcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIPCflIog5pKt5pS+5oqi5Zyw5Li76K+t6Z+zXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSDmnI3liqHnq6/lub/mkq3nmoTmlbDmja5cbiAgICAgKiAgIC0gYWN0aW9uOiBcImNhbGxcIiA9IOaKoiwgXCJwYXNzXCIgPSDkuI3miqJcbiAgICAgKiAgIC0gZ2VuZGVyOiBcIm1hbGVcIiAvIFwiZmVtYWxlXCJcbiAgICAgKiAgIC0gb3JkZXI6IOW9k+WJjei9ruasoeWGheeahOaTjeS9nOmhuuW6j++8iDEtM++8iVxuICAgICAqICAgLSByb3VuZDog5b2T5YmN6L2u5qyh77yIMeaIljLvvIlcbiAgICAgKi9cbiAgICBfcGxheVJvYlNvdW5kOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmICghaXNvcGVuX3NvdW5kKSByZXR1cm5cblxuICAgICAgICB2YXIgYWN0aW9uID0gZGF0YS5hY3Rpb25cbiAgICAgICAgdmFyIGdlbmRlciA9IGRhdGEuZ2VuZGVyIHx8IFwibWFsZVwiXG4gICAgICAgIHZhciBvcmRlciA9IGRhdGEub3JkZXIgfHwgMVxuICAgICAgICB2YXIgcm91bmQgPSBkYXRhLnJvdW5kIHx8IDFcbiAgICAgICAgdmFyIHBsYXllcklEID0gZGF0YS5wbGF5ZXJfaWQgfHwgXCJcIlxuXG4gICAgICAgIC8vIPCflJLjgJDpmLLph43lpI3mnLrliLbjgJHmo4Dmn6XmmK/lkKblt7Lnu4/mkq3mlL7ov4fnm7jlkIznmoTpn7PmlYhcbiAgICAgICAgdmFyIHNvdW5kS2V5ID0gcGxheWVySUQgKyBcIl9cIiArIGFjdGlvbiArIFwiX1wiICsgcm91bmQgKyBcIl9cIiArIG9yZGVyXG4gICAgICAgIGlmICh0aGlzLl9sYXN0Um9iU291bmRLZXkgPT09IHNvdW5kS2V5KSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9sYXN0Um9iU291bmRLZXkgPSBzb3VuZEtleVxuXG5cbiAgICAgICAgLy8g5LiN5oqiXG4gICAgICAgIGlmIChhY3Rpb24gPT09IFwicGFzc1wiKSB7XG4gICAgICAgICAgICB2YXIgcGFzc1NvdW5kID0gZ2VuZGVyID09PSBcImZlbWFsZVwiID8gXCJtX252X2J1cWlhbmdcIiA6IFwibV9uYW5fYnVxaWFuZ1wiXG4gICAgICAgICAgICB0aGlzLl9wbGF5U291bmRFZmZlY3QocGFzc1NvdW5kKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICAvLyDmiqLlnLDkuLtcbiAgICAgICAgaWYgKGdlbmRlciA9PT0gXCJmZW1hbGVcIikge1xuICAgICAgICAgICAgLy8g5aWz546p5a62XG4gICAgICAgICAgICBpZiAocm91bmQgPT09IDEgJiYgb3JkZXIgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAvLyDnrKwx6L2u56ysMeS9jVxuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlTb3VuZEVmZmVjdChcIm1fbnZfcWlhbmdkaXpodV8wMVwiKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDnrKwx6L2u56ysMi8z5L2NIOaIliDnrKwy6L2u56ysMeS9jVxuICAgICAgICAgICAgICAgIHZhciBzb3VuZHMgPSBbXCJtX252X3FpYW5nZGl6aHVfMDJcIiwgXCJtX252X3FpYW5nZGl6aHVfd29xaWFuZ18wMVwiXVxuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlSYW5kb21Tb3VuZChzb3VuZHMpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDnlLfnjqnlrrZcbiAgICAgICAgICAgIGlmIChyb3VuZCA9PT0gMSAmJiBvcmRlciA9PT0gMSkge1xuICAgICAgICAgICAgICAgIC8vIOesrDHova7nrKwx5L2NXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheVNvdW5kRWZmZWN0KFwibV9uYW5fcWlhbmdkaXpodVwiKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDnrKwx6L2u56ysMi8z5L2NIOaIliDnrKwy6L2u56ysMeS9jVxuICAgICAgICAgICAgICAgIHZhciBzb3VuZHMgPSBbXCJtX25hbl9xaWFuZ2Rpemh1XCIsIFwibV9uYW5fcWlhbmdkaXpodV93b3FpYW5nXCJdXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheVJhbmRvbVNvdW5kKHNvdW5kcylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5SKIOaSreaUvumfs+aViO+8iOW4piBmYWxsYmFjayDmnLrliLbvvIlcbiAgICAgKiDwn5Sn44CQ6YeN5p6E44CR56e76Zmk5YWo5bGAIGZhbGxiYWNrIOWIsCBcIuWkp+S9oFwiIOeahOmAu+i+kVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0g6Z+z5pWI5ZCN56ew77yI5LiN5ZCr5omp5bGV5ZCN77yJXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGZhbGxiYWNrIC0g5Y+v6YCJ55qEIGZhbGxiYWNrIOmfs+aViOWQjeensO+8iOS4jeWGjeiHquWKqCBmYWxsYmFjayDliLAgXCLlpKfkvaBcIu+8iVxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gYWxsb3dEYW5pRmFsbGJhY2sgLSDmmK/lkKblhYHorrjmnIDnu4ggZmFsbGJhY2sg5YiwIFwi5aSn5L2gXCLvvIjpu5jorqQgZmFsc2XvvIlcbiAgICAgKi9cbiAgICBfcGxheVNvdW5kRWZmZWN0OiBmdW5jdGlvbihuYW1lLCBmYWxsYmFjaywgYWxsb3dEYW5pRmFsbGJhY2spIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIFxuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcInNvdW5kL1wiICsgbmFtZSwgY2MuQXVkaW9DbGlwLCBmdW5jdGlvbihlcnIsIGNsaXApIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn5SKIFtfcGxheVNvdW5kRWZmZWN0XSDliqDovb3pn7PmlYjlpLHotKU6IFwiICsgbmFtZSwgZXJyLm1lc3NhZ2UgfHwgZXJyKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJBmYWxsYmFja+OAkeWwneivleaSreaUvuWkh+eUqOmfs+aViFxuICAgICAgICAgICAgICAgIGlmIChmYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcInNvdW5kL1wiICsgZmFsbGJhY2ssIGNjLkF1ZGlvQ2xpcCwgZnVuY3Rpb24oZXJyMiwgY2xpcDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+UiiBbX3BsYXlTb3VuZEVmZmVjdF0gZmFsbGJhY2sg5Lmf5aSx6LSlOiBcIiArIGZhbGxiYWNrLCBlcnIyLm1lc3NhZ2UgfHwgZXJyMilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ6YeN6KaB5L+u5pS544CR5LiN5YaN6Ieq5YqoIGZhbGxiYWNrIOWIsCBcIuWkp+S9oFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5Y+q5pyJ5piO56Gu5YWB6K645pe25omNIGZhbGxiYWNrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFsbG93RGFuaUZhbGxiYWNrICYmIGZhbGxiYWNrICE9PSBcIm1fY3BfZGFuaVwiICYmIG5hbWUgIT09IFwibV9jcF9kYW5pXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fcGxheVNvdW5kRWZmZWN0KFwibV9jcF9kYW5pXCIsIG51bGwsIGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLmF1ZGlvRW5naW5lLnBsYXlFZmZlY3QoY2xpcDIsIGZhbHNlKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYWxsb3dEYW5pRmFsbGJhY2sgJiYgbmFtZSAhPT0gXCJtX2NwX2RhbmlcIikge1xuICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ6YeN6KaB5L+u5pS544CR5LiN5YaN6buY6K6kIGZhbGxiYWNrIOWIsCBcIuWkp+S9oFwiXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3BsYXlTb3VuZEVmZmVjdChcIm1fY3BfZGFuaVwiLCBudWxsLCBmYWxzZSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNjLmF1ZGlvRW5naW5lLnBsYXlFZmZlY3QoY2xpcCwgZmFsc2UpXG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflIog6ZqP5py65pKt5pS+6Z+z5pWIXG4gICAgICogQHBhcmFtIHtBcnJheX0gc291bmRzIC0g6Z+z5pWI5ZCN56ew5pWw57uEXG4gICAgICovXG4gICAgX3BsYXlSYW5kb21Tb3VuZDogZnVuY3Rpb24oc291bmRzKSB7XG4gICAgICAgIGlmICghc291bmRzIHx8IHNvdW5kcy5sZW5ndGggPT09IDApIHJldHVyblxuICAgICAgICB2YXIgaW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzb3VuZHMubGVuZ3RoKVxuICAgICAgICB0aGlzLl9wbGF5U291bmRFZmZlY3Qoc291bmRzW2luZGV4XSlcbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g5oyJ6ZKu54K55Ye75LqL5Lu2XG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBvbkJ1dHRvbkNsaWNrOiBmdW5jdGlvbihldmVudCwgY3VzdG9tRGF0YSkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgc3dpdGNoKGN1c3RvbURhdGEpIHtcbiAgICAgICAgICAgIGNhc2UgXCJidG5fcWlhbmR6XCI6XG4gICAgICAgICAgICAgICAgLy8g4pqg77iP44CQ5bey5Yig6Zmk44CR5oyJ6ZKu54K55Ye76Z+z5pWIIC0g6Z+z5pWI55Sx5pyN5Yqh56uv5bm/5pKt6Kem5Y+R77yIX3BsYXlSb2JTb3VuZO+8iVxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9iaWRkaW5nUGhhc2UgPT09IFwiYmlkZGluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2hpZGVSb2JVSSgpXG4gICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnNvY2tldC5yZXF1ZXN0QmlkKHRydWUpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGlkZVJvYlVJKClcbiAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LnJlcXVlc3RSb2JTdGF0ZShxaWFuX3N0YXRlLnFpYW4pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgIGNhc2UgXCJidG5fYnVxaWFuZHpcIjpcbiAgICAgICAgICAgICAgICAvLyDimqDvuI/jgJDlt7LliKDpmaTjgJHmjInpkq7ngrnlh7vpn7PmlYggLSDpn7PmlYjnlLHmnI3liqHnq6/lub/mkq3op6blj5HvvIhfcGxheVJvYlNvdW5k77yJXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2JpZGRpbmdQaGFzZSA9PT0gXCJiaWRkaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGlkZVJvYlVJKClcbiAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LnJlcXVlc3RCaWQoZmFsc2UpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGlkZVJvYlVJKClcbiAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LnJlcXVlc3RSb2JTdGF0ZShxaWFuX3N0YXRlLmJ1cWlhbmcpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjYXNlIFwibm9wdXNoY2FyZFwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BQbGF5Q291bnRkb3duKClcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5Y+q5Y+R6YCB5LiN5Ye66K+35rGC77yM5LiN5pys5Zyw5aSE55CGXG4gICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LnJlcXVlc3RfYnVjaHVfY2FyZChbXSwgbnVsbClcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXlpbmdVSV9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgY2FzZSBcInRpcGNhcmRcIjpcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5o+Q56S65oyJ6ZKu5Yqf6IO9XG4gICAgICAgICAgICAgICAgdGhpcy5fb25IaW50QnV0dG9uQ2xpY2soKVxuICAgICAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgICAgIGNhc2UgXCJwdXNoY2FyZFwiOlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNob29zZV9jYXJkX2RhdGEubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGlwc0xhYmVsLnN0cmluZyA9IFwi6K+36YCJ5oup54mMIVwiXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi50aXBzTGFiZWwuc3RyaW5nID0gXCJcIlxuICAgICAgICAgICAgICAgICAgICB9LCAyMDAwKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOiwg+ivleaXpeW/l+OAkeaJk+WNsOmAieS4reeahOeJjO+8iOWinuW8uueJiO+8jOaYvuekuueJjOWQje+8iVxuICAgICAgICAgICAgICAgIHZhciBzZWxlY3RlZENhcmROYW1lcyA9IFtdXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNob29zZV9jYXJkX2RhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhcmQgPSB0aGlzLmNob29zZV9jYXJkX2RhdGFbaV1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhcmREYXRhID0gY2FyZC5jYXJkX2RhdGEgfHwgY2FyZFxuICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZE5hbWUgPSB0aGlzLl9nZXRDYXJkRGlzcGxheU5hbWUoY2FyZERhdGEpXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkQ2FyZE5hbWVzLnB1c2goY2FyZE5hbWUpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHlrqLmiLfnq6/niYzlnovpqozor4FcbiAgICAgICAgICAgICAgICB2YXIgY2FyZHNUb1BsYXkgPSB0aGlzLmNob29zZV9jYXJkX2RhdGEubWFwKGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMuY2FyZF9kYXRhIHx8IGNcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIHZhciB2YWxpZGF0aW9uUmVzdWx0ID0gdGhpcy5fdmFsaWRhdGVIYW5kVHlwZShjYXJkc1RvUGxheSlcbiAgICAgICAgICAgICAgICBpZiAoIXZhbGlkYXRpb25SZXN1bHQudmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aXBzTGFiZWwuc3RyaW5nID0gdmFsaWRhdGlvblJlc3VsdC5tZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi50aXBzTGFiZWwuc3RyaW5nID0gXCJcIlxuICAgICAgICAgICAgICAgICAgICB9LCAyMDAwKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcFBsYXlDb3VudGRvd24oKVxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlj6rlj5HpgIHlh7rniYzor7fmsYLvvIznrYnlvoXmnI3liqHnq6/lub/mkq3lkI7lho3mm7TmlrDmiYvniYxcbiAgICAgICAgICAgICAgICAvLyDmnI3liqHnq6/kvJrlub/mkq0gY2FyZF9wbGF5ZWQg5raI5oGv77yM55SxIG9uT3RoZXJQbGF5ZXJDaHVDYXJkIOWkhOeQhlxuICAgICAgICAgICAgICAgIG15Z2xvYmFsLnNvY2tldC5yZXF1ZXN0X2NodV9jYXJkKHRoaXMuY2hvb3NlX2NhcmRfZGF0YSwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDmlLnov5vjgJHlh7rniYzlpLHotKXvvIzmmL7npLrmm7Tor6bnu4bnmoTplJnor6/kv6Hmga9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlcnJvck1zZyA9IChkYXRhICYmIGRhdGEubXNnKSB8fCBcIuWHuueJjOWksei0pVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOiOt+WPlueUqOaIt+mAieS4reeahOeJjOWei1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGVjdGVkVHlwZSA9IHZhbGlkYXRpb25SZXN1bHQudHlwZSB8fCBcIuacquefpeeJjOWei1wiXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZWN0ZWRDb3VudCA9IHNlbGYuY2hvb3NlX2NhcmRfZGF0YS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g6I635Y+W5LiK5a6255qE54mM5Z6L5L+h5oGvXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFBsYXllZFR5cGUgPSBzZWxmLl9sYXN0UGxheWVkSGFuZFR5cGUgfHwgXCLmnKrnn6VcIlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RQbGF5ZWRDb3VudCA9IHNlbGYuX2xhc3RQbGF5ZWRDYXJkcyA/IHNlbGYuX2xhc3RQbGF5ZWRDYXJkcy5sZW5ndGggOiAwXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHojrflj5bkuIrlrrblh7rnmoTniYzlkI1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0UGxheWVkQ2FyZE5hbWVzID0gXCJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuX2xhc3RQbGF5ZWRDYXJkcyAmJiBzZWxmLl9sYXN0UGxheWVkQ2FyZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuYW1lcyA9IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLl9sYXN0UGxheWVkQ2FyZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZXMucHVzaChzZWxmLl9nZXRDYXJkRGlzcGxheU5hbWUoc2VsZi5fbGFzdFBsYXllZENhcmRzW2ldKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFBsYXllZENhcmROYW1lcyA9IG5hbWVzLmpvaW4oXCIsXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaehOW7uuivpue7hueahOmUmeivr+aPkOekulxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRldGFpbE1zZyA9IGVycm9yTXNnXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3JNc2cuaW5kZXhPZihcIuWkp+S4jei/h1wiKSA+PSAwIHx8IGVycm9yTXNnLmluZGV4T2YoXCLmiZPkuI3ov4dcIikgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDlop7lvLrjgJHmmL7npLrnlKjmiLfpgInnmoTniYzlkI1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgeW91ckNhcmRzID0gc2VsZWN0ZWRDYXJkTmFtZXMuam9pbihcIixcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDniYzlnovkuI3ljLnphY3miJbniYzlpKrlsI9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZWN0ZWRDb3VudCAhPT0gbGFzdFBsYXllZENvdW50ICYmIGxhc3RQbGF5ZWRDb3VudCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsTXNnID0gXCLniYzmlbDkuI3ljLnphY3vvIHkuIrlrrblh7pcIiArIGxhc3RQbGF5ZWRUeXBlICsgXCLvvIzkvaDpgInkuoZcIiArIHlvdXJDYXJkc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2VsZWN0ZWRUeXBlICE9PSBsYXN0UGxheWVkVHlwZSAmJiBsYXN0UGxheWVkVHlwZSAhPT0gXCLngrjlvLlcIiAmJiBsYXN0UGxheWVkVHlwZSAhPT0gXCLnjovngrhcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWxNc2cgPSBcIueJjOWei+S4jeWMuemFje+8geS4iuWutuWHulwiICsgbGFzdFBsYXllZFR5cGUgKyBcIu+8jOS9oOmAieS6hlwiICsgeW91ckNhcmRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g8J+Up+OAkOWinuW8uuOAkeaYvuekuuWFt+S9k+eahOeJjOWQjeavlOi+g1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdFBsYXllZENhcmROYW1lcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsTXNnID0gXCLmiZPkuI3ov4fvvIHkuIrlrrblh7pcIiArIGxhc3RQbGF5ZWRDYXJkTmFtZXMgKyBcIu+8jOS9oOmAieS6hlwiICsgeW91ckNhcmRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWxNc2cgPSBcIueJjOWkquWwj++8geS9oOmAieS6hlwiICsgeW91ckNhcmRzICsgXCLmiZPkuI3ov4fkuIrlrrZcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnRpcHNMYWJlbC5zdHJpbmcgPSBkZXRhaWxNc2dcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi50aXBzTGFiZWwuc3RyaW5nID0gXCJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMzAwMCkgIC8vIOW7tumVv+aYvuekuuaXtumXtOWIsDPnp5JcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3Jlc2V0Q2FyZEZsYWdzKClcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY2hvb3NlX2NhcmRfZGF0YSA9IFtdXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5Ye654mM5oiQ5Yqf77yM5LiN5Zyo6L+Z6YeM5Yig6Zmk5omL54mM77yBXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDnrYnlvoXmnI3liqHnq6/lub/mkq0gY2FyZF9wbGF5ZWQg5raI5oGv77yM55SxIG9uT3RoZXJQbGF5ZXJDaHVDYXJkIOWkhOeQhlxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5wbGF5aW5nVUlfbm9kZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5riF56m66YCJ5Lit55qE54mMXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNob29zZV9jYXJkX2RhdGEgPSBbXVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBfcmVzZXRDYXJkRmxhZ3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5Y+q6YeN572u5omL54mM5a655Zmo5Lit55qE54mM6IqC54K5XG4gICAgICAgIHZhciBjYXJkUGFyZW50ID0gdGhpcy5jYXJkc19ub2RlXG4gICAgICAgIGlmICghY2FyZFBhcmVudCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+OriBbX3Jlc2V0Q2FyZEZsYWdzXSBjYXJkc19ub2RlIOacquWumuS5ie+8jOWwneivleafpeaJvuaJi+eJjOWuueWZqFwiKVxuICAgICAgICAgICAgLy8g5bCd6K+V6YCa6L+H6IqC54K55ZCN56ew5p+l5om+XG4gICAgICAgICAgICB2YXIgZ2FtZVNjZW5lTm9kZSA9IHRoaXMubm9kZS5wYXJlbnRcbiAgICAgICAgICAgIGlmIChnYW1lU2NlbmVOb2RlKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnYW1lU2NlbmVOb2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGdhbWVTY2VuZU5vZGUuY2hpbGRyZW5baV1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLm5hbWUgPT09IFwiY2FyZHNfbm9kZVwiIHx8IGNoaWxkLm5hbWUgPT09IFwiY2FyZHNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZFBhcmVudCA9IGNoaWxkXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhcmRzX25vZGUgPSBjaGlsZFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOmHjee9ruaJgOacieeJjOeahOmAieS4reeKtuaAgVxuICAgICAgICBpZiAoY2FyZFBhcmVudCkge1xuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gY2FyZFBhcmVudC5jaGlsZHJlblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuW2ldLmVtaXQoXCJyZXNldF9jYXJkX2ZsYWdcIilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn46uIFtfcmVzZXRDYXJkRmxhZ3NdIOaJvuS4jeWIsOaJi+eJjOWuueWZqFwiKVxuICAgICAgICB9XG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHmuIXnqbrpgInniYzlkI7mm7TmlrDmmL7npLpcbiAgICAgICAgdGhpcy5fdXBkYXRlU2VsZWN0ZWRDb3VudERpc3BsYXkoKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5pu05paw5bey6YCJ54mM5pWw5pi+56S6XG4gICAgICog4pqg77iP44CQ5L+u5aSN44CR55So5oi36KaB5rGC6K+l5L2N572u5LiN5pi+56S65Lu75L2V5paH5a2X77yM5bey56aB55SoIHRpcHNMYWJlbCDmmL7npLpcbiAgICAgKiDku4XlnKjmjqfliLblj7DovpPlh7rml6Xlv5fnlKjkuo7osIPor5VcbiAgICAgKi9cbiAgICBfdXBkYXRlU2VsZWN0ZWRDb3VudERpc3BsYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY291bnQgPSB0aGlzLmNob29zZV9jYXJkX2RhdGEubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICAvLyDlpoLmnpzmsqHmnInpgInkuK3niYzvvIznm7TmjqXov5Tlm55cbiAgICAgICAgaWYgKGNvdW50ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+W6YCJ5Lit55qE54mM5pWw5o2uXG4gICAgICAgIHZhciBjYXJkc1RvUGxheSA9IHRoaXMuY2hvb3NlX2NhcmRfZGF0YS5tYXAoZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgcmV0dXJuIGMuY2FyZF9kYXRhIHx8IGNcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIOmqjOivgeeJjOWei1xuICAgICAgICB2YXIgdmFsaWRhdGlvblJlc3VsdCA9IHRoaXMuX3ZhbGlkYXRlSGFuZFR5cGUoY2FyZHNUb1BsYXkpXG4gICAgICAgIFxuICAgICAgICAvLyDmnoTlu7rmmL7npLrmlofmnKzvvIjku4XnlKjkuo7ml6Xlv5fvvIlcbiAgICAgICAgdmFyIGRpc3BsYXlUZXh0ID0gXCLlt7LpgIkgXCIgKyBjb3VudCArIFwiIOW8oFwiXG4gICAgICAgIGlmICh2YWxpZGF0aW9uUmVzdWx0LnZhbGlkKSB7XG4gICAgICAgICAgICBkaXNwbGF5VGV4dCArPSBcIiAtIFwiICsgdmFsaWRhdGlvblJlc3VsdC50eXBlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkaXNwbGF5VGV4dCArPSBcIiAtIFwiICsgdmFsaWRhdGlvblJlc3VsdC5tZXNzYWdlXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOKaoO+4j+OAkOemgeeUqOOAkeS4jeWGjeWcqCB0aXBzTGFiZWwg5LiK5pi+56S65paH5a2XXG4gICAgICAgIC8vIOS7hei+k+WHuuaOp+WItuWPsOaXpeW/l+eUqOS6juiwg+ivlVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDlh7rniYznm7jlhbNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5bey5bqf5byD44CR5Zyw5Li76I635b6X5bqV54mM5ZCO5re75Yqg5Yiw5omL54mMXG4gICAgICog4pqg77iP44CQ6YeN6KaB44CR5q2k5Ye95pWw5bey5bqf5byD77yM5LiN5YaN5L2/55So77yBXG4gICAgICog5Zyw5Li75omL54mM5pu05paw55SxIG9uTGFuZGxvcmRDYXJkcyDlpITnkIbvvIzpgJrov4fmnI3liqHnq68gbGFuZGxvcmRfY2FyZHMg5raI5oGvXG4gICAgICog5L+d55WZ5q2k5Ye95pWw5LuF55So5LqO5YW85a6577yM5LiN5Lya6Kem5Y+R6YeN5paw5Y+R54mM5Yqo55S7XG4gICAgICovXG4gICAgcHVzaFRocmVlQ2FyZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHkuI3lho3miafooYzku7vkvZXmk43kvZzvvIFcbiAgICAgICAgLy8g5bqV54mM5bey6YCa6L+HIGxhbmRsb3JkX2NhcmRzIOa2iOaBr+eUseacjeWKoeerr+ebtOaOpeabtOaWsOWcsOS4u+aJi+eJjFxuICAgICAgICAvLyDmraTlh73mlbDkv53nlZnku4XkuLrlhbzlrrnml6fku6PnoIHlvJXnlKhcbiAgICAgICAgcmV0dXJuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHku47miYvniYzkuK3liKDpmaTlt7Llh7rnmoTniYzvvIjmnI3liqHnq6/pqbHliqjvvIlcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBjYXJkcyAtIOacjeWKoeerr+i/lOWbnueahOW3suWHuueJjOaVsOaNriBbe3N1aXQsIHJhbmt9LCAuLi5dXG4gICAgICovXG4gICAgX3JlbW92ZUNhcmRzRnJvbUhhbmQ6IGZ1bmN0aW9uKGNhcmRzKSB7XG4gICAgICAgIGlmICghY2FyZHMgfHwgY2FyZHMubGVuZ3RoID09PSAwKSByZXR1cm5cblxuXG4gICAgICAgIC8vIOmBjeWOhuimgeWIoOmZpOeahOeJjFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2FyZFRvUmVtb3ZlID0gY2FyZHNbaV1cbiAgICAgICAgICAgIC8vIOWcqOaJi+eJjOS4reafpeaJvuW5tuWIoOmZpFxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IHRoaXMuaGFuZENhcmRzLmxlbmd0aCAtIDE7IGogPj0gMDsgai0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFuZENhcmRzW2pdLnJhbmsgPT09IGNhcmRUb1JlbW92ZS5yYW5rICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZENhcmRzW2pdLnN1aXQgPT09IGNhcmRUb1JlbW92ZS5zdWl0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZENhcmRzLnNwbGljZShqLCAxKVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5riF56m66YCJ5Lit55qE54mM5pWw5o2u77yM6Ziy5q2i5q6L55WZXG4gICAgICAgIHRoaXMuY2hvb3NlX2NhcmRfZGF0YSA9IFtdXG5cbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeS9v+eUqOmdmem7mOabtOaWsO+8jOS4jeinpuWPkeWPkeeJjOWKqOeUu1xuICAgICAgICB0aGlzLl91cGRhdGVIYW5kQ2FyZHNTaWxlbnQodGhpcy5oYW5kQ2FyZHMpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR6Z2Z6buY5pu05paw5omL54mM77yI5LiN6Kem5Y+R5Y+R54mM5Yqo55S777yJXG4gICAgICog55So5LqO5Ye654mM5ZCO5pu05paw5omL54mM5pi+56S6XG4gICAgICogQHBhcmFtIHtBcnJheX0gY2FyZHMgLSDmiYvniYzmlbDmja5cbiAgICAgKi9cbiAgICBfdXBkYXRlSGFuZENhcmRzU2lsZW50OiBmdW5jdGlvbihjYXJkcykge1xuICAgICAgICBpZiAoIWNhcmRzKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAoIW15Z2xvYmFsKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyDmjpLluo/miYvniYxcbiAgICAgICAgdmFyIHNvcnRlZENhcmRzID0gdGhpcy5fc29ydENhcmRzKGNhcmRzKVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeWPquS9v+eUqGNhcmRzX25vZGXvvIzkuI3pgY3ljoZub2RlLnBhcmVudFxuICAgICAgICB2YXIgY2FyZHNQYXJlbnQgPSB0aGlzLmNhcmRzX25vZGVcbiAgICAgICAgaWYgKCFjYXJkc1BhcmVudCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfjq4gW191cGRhdGVIYW5kQ2FyZHNTaWxlbnRdIGNhcmRzX25vZGUg5pyq5a6a5LmJXCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeWFiOmUgOavgeaJgOacieaXp+aJi+eJjOiKgueCue+8jOehruS/neS6i+S7tuebkeWQrOWZqOiiq+a4heeQhlxuICAgICAgICB2YXIgb2xkQ2hpbGRyZW4gPSBjYXJkc1BhcmVudC5jaGlsZHJlblxuICAgICAgICBmb3IgKHZhciBpID0gb2xkQ2hpbGRyZW4ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IG9sZENoaWxkcmVuW2ldXG4gICAgICAgICAgICAvLyDlhYjlj5bmtojmiYDmnInkuovku7bnm5HlkKxcbiAgICAgICAgICAgIGNoaWxkLm9mZihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9TVEFSVClcbiAgICAgICAgICAgIC8vIOWGjemUgOavgeiKgueCuVxuICAgICAgICAgICAgY2hpbGQuZGVzdHJveSgpXG4gICAgICAgIH1cbiAgICAgICAgLy8g5YaN5qyh56Gu5L+d5riF56m6XG4gICAgICAgIGNhcmRzUGFyZW50LnJlbW92ZUFsbENoaWxkcmVuKClcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHmuIXnqbrpgInkuK3nmoTniYzmlbDmja7vvIzpmLLmraLmrovnlZlcbiAgICAgICAgdGhpcy5jaG9vc2VfY2FyZF9kYXRhID0gW11cbiAgICAgICAgXG4gICAgICAgIC8vIOmHjeaWsOWIm+W7uuaJi+eJjOiKgueCue+8iOaXoOWKqOeUu++8iVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvcnRlZENhcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2FyZERhdGEgPSBzb3J0ZWRDYXJkc1tpXVxuICAgICAgICAgICAgdmFyIHRhcmdldFggPSB0aGlzLl9nZXRDYXJkWChpLCBzb3J0ZWRDYXJkcy5sZW5ndGgsIENhcmRMYXlvdXQuY2FyZFNwYWNpbmcpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBjYXJkID0gY2MuaW5zdGFudGlhdGUodGhpcy5jYXJkX3ByZWZhYilcbiAgICAgICAgICAgIGlmICghY2FyZCkgY29udGludWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FyZC5zY2FsZSA9IENhcmRMYXlvdXQuY2FyZFNjYWxlXG4gICAgICAgICAgICBjYXJkLnBhcmVudCA9IGNhcmRzUGFyZW50XG4gICAgICAgICAgICBjYXJkLnNldFBvc2l0aW9uKHRhcmdldFgsIENhcmRMYXlvdXQuY2FyZFkpXG4gICAgICAgICAgICBjYXJkLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgIGNhcmQuekluZGV4ID0gaVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgY2FyZENvbXAgPSBjYXJkLmdldENvbXBvbmVudChcImNhcmRcIilcbiAgICAgICAgICAgIGlmIChjYXJkQ29tcCkge1xuICAgICAgICAgICAgICAgIGNhcmRDb21wLnNob3dDYXJkcyhjYXJkRGF0YSwgbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SUQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmHjee9rua4suafk+WTiOW4jO+8jOWFgeiuuOWQjue7rea4suafk1xuICAgICAgICB0aGlzLl9sYXN0UmVuZGVySGFzaCA9IEpTT04uc3RyaW5naWZ5KGNhcmRzKVxuICAgICAgICBcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog4pqg77iP44CQ5bey5bqf5byD44CR5pen54mI5Yig6Zmk5omL54mM5pa55rOVXG4gICAgICog5L+d55WZ5LuF5Li65YW85a6577yM5paw5Luj56CB5bqU5L2/55SoIF9yZW1vdmVDYXJkc0Zyb21IYW5kXG4gICAgICovXG4gICAgZGVzdG9yeUNhcmQ6IGZ1bmN0aW9uKGFjY291bnRpZCwgY2hvb3NlX2NhcmQpIHtcbiAgICAgICAgaWYgKGNob29zZV9jYXJkLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICB2YXIgZGVzdHJveV9jYXJkID0gW11cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaG9vc2VfY2FyZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IHRoaXMuaGFuZENhcmRzLmxlbmd0aCAtIDE7IGogPj0gMDsgai0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFuZENhcmRzW2pdLnJhbmsgPT09IGNob29zZV9jYXJkW2ldLmNhcmRfZGF0YS5yYW5rICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZENhcmRzW2pdLnN1aXQgPT09IGNob29zZV9jYXJkW2ldLmNhcmRfZGF0YS5zdWl0KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS7juaJi+eJjOaVsOaNruS4reWIoOmZpFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRDYXJkcy5zcGxpY2UoaiwgMSlcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmHjeaWsOa4suafk1xuICAgICAgICB0aGlzLnJlbmRlckNhcmRzKHRoaXMuaGFuZENhcmRzKVxuICAgICAgICBcbiAgICAgICAgLy8g5pi+56S65Ye655qE54mMXG4gICAgICAgIGlmICh0aGlzLmNhcmRzX25vZGUgJiYgdGhpcy5jYXJkc19ub2RlLmNoaWxkcmVuLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciBvdXRDYXJkX25vZGUgPSB0aGlzLl9nZXRPdXRDYXJkTm9kZShhY2NvdW50aWQpXG4gICAgICAgICAgICBpZiAob3V0Q2FyZF9ub2RlKSB7XG4gICAgICAgICAgICAgICAgLy8g5om+5Yiw5bey6YCJ5Lit55qE54mM6IqC54K5XG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdGVkTm9kZXMgPSBbXVxuICAgICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuY2FyZHNfbm9kZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhcmRDb21wID0gY2hpbGRyZW5baV0uZ2V0Q29tcG9uZW50KFwiY2FyZFwiKVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FyZENvbXAgJiYgY2FyZENvbXAuZmxhZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWROb2Rlcy5wdXNoKGNoaWxkcmVuW2ldKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc2hvd091dENhcmRzKG91dENhcmRfbm9kZSwgc2VsZWN0ZWROb2RlcylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgX2dldE91dENhcmROb2RlOiBmdW5jdGlvbihhY2NvdW50aWQpIHtcbiAgICAgICAgdmFyIGdhbWVTY2VuZV9zY3JpcHQgPSB0aGlzLm5vZGUucGFyZW50LmdldENvbXBvbmVudChcImdhbWVTY2VuZVwiKVxuICAgICAgICByZXR1cm4gZ2FtZVNjZW5lX3NjcmlwdCA/IGdhbWVTY2VuZV9zY3JpcHQuZ2V0VXNlck91dENhcmRQb3NCeUFjY291bnQoYWNjb3VudGlkKSA6IG51bGxcbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g5o+Q56S65oyJ6ZKu5Yqf6IO9XG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5L+u5pS544CR5o+Q56S65oyJ6ZKu54K55Ye75aSE55CGIC0g5pS55Li66K+35rGC5pyN5Yqh56uv5o+Q56S6XG4gICAgICog5L2/55So5LqL5Lu255uR5ZCs5pa55byP5aSE55CG5ZON5bqU77yM5LiN5L2/55So5Zue6LCD77yI5Zug5Li65pyN5Yqh56uv5LiN6L+U5ZueY2FsbEluZGV477yJXG4gICAgICovXG4gICAgX29uSGludEJ1dHRvbkNsaWNrOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAvLyDph43nva7pgInkuK3nmoTniYxcbiAgICAgICAgdGhpcy5fcmVzZXRDYXJkRmxhZ3MoKVxuICAgICAgICB0aGlzLmNob29zZV9jYXJkX2RhdGEgPSBbXVxuXG4gICAgICAgIC8vIOivt+axguacjeWKoeerr+aPkOekuu+8iOS4jeS9v+eUqOWbnuiwg++8jOS+nei1luS6i+S7tuebkeWQrOWZqOWkhOeQhuWTjeW6lO+8iVxuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKG15Z2xvYmFsICYmIG15Z2xvYmFsLnNvY2tldCkge1xuICAgICAgICAgICAgLy8g55u05o6l5Y+R6YCB5raI5oGv77yM5ZON5bqU5bCG6YCa6L+HIG9uSGludFJlc3VsdCDkuovku7bnm5HlkKzlmajlpITnkIZcbiAgICAgICAgICAgIG15Z2xvYmFsLnNvY2tldC5zZW5kSGludFJlcXVlc3QoKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHlpITnkIbmnI3liqHnq6/ov5Tlm57nmoTmj5DnpLrnu5PmnpxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIOacjeWKoeerr+i/lOWbnueahOaPkOekuuaVsOaNrlxuICAgICAqICAgLSBjYXJkczog5o+Q56S655qE54mM5pWw57uEIFt7c3VpdCwgcmFua30sIC4uLl1cbiAgICAgKiAgIC0gaW5kZXg6IOW9k+WJjeaPkOekuue0ouW8le+8iOS7jjDlvIDlp4vvvIlcbiAgICAgKiAgIC0gdG90YWw6IOaAu+WFseacieWkmuWwkeenjeaPkOekulxuICAgICAqL1xuICAgIF9vbkhpbnRSZXN1bHQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgXG4gICAgICAgIGlmICghZGF0YSB8fCAhZGF0YS5jYXJkcyB8fCBkYXRhLmNhcmRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeayoeacieiDvei/h+eahOeJjOaXtueri+WNs+aPkOekuuS4jeWHuu+8jOS4jeWGjeetieW+hTEtMuenklxuICAgICAgICAgICAgLy8gdGhpcy50aXBzTGFiZWwuc3RyaW5nID0gXCLmsqHmnInlj6/lh7rnmoTniYxcIlxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOeri+WNs+iHquWKqOS4jeWHuu+8jOS4jeWGjeW7tui/n1xuICAgICAgICAgICAgc2VsZi5fc3RvcFBsYXlDb3VudGRvd24oKVxuICAgICAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgICAgICBpZiAobXlnbG9iYWwgJiYgbXlnbG9iYWwuc29ja2V0KSB7XG4gICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LnJlcXVlc3RfYnVjaHVfY2FyZChbXSwgbnVsbClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzZWxmLnBsYXlpbmdVSV9ub2RlKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5wbGF5aW5nVUlfbm9kZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyAxLjXnp5LlkI7muIXnqbrmj5DnpLrmloflrZdcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi50aXBzTGFiZWwuc3RyaW5nID0gXCJcIlxuICAgICAgICAgICAgfSwgMTUwMClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDpgInkuK3mj5DnpLrnmoTniYxcbiAgICAgICAgdGhpcy5fc2VsZWN0Q2FyZHMoZGF0YS5jYXJkcylcblxuICAgICAgICAvLyDwn5Sn44CQ5L+u5pS544CR5Y675o6J5qGM6Z2i5LiK55qE55m96Imy5paH5a2X5o+Q56S6XG4gICAgICAgIC8vIOS4jeWGjeaYvuekuiBcIuaPkOekujogWOW8oOeJjFwiIOS/oeaBr1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5omY566h44CR5aSE55CG5omY566h54q25oCB5Y+Y5YyW6YCa55+lXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSDmiZjnrqHnirbmgIHmlbDmja5cbiAgICAgKiAgIC0gcGxheWVyX2lkOiDnjqnlrrZJRFxuICAgICAqICAgLSBwbGF5ZXJfbmFtZTog546p5a625ZCN5a2XXG4gICAgICogICAtIGlzX3RydXN0ZWU6IOaYr+WQpuaJmOeuoVxuICAgICAqICAgLSByZWFzb246IOWOn+WboCAodGltZW91dC9kaXNjb25uZWN0L3JlY29ubmVjdClcbiAgICAgKi9cbiAgICBfb25UcnVzdGVlU3RhdGVOb3RpZnk6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgLy8g6YCa55+l5omA5pyJ546p5a626IqC54K55pu05paw5omY566h54q25oCBXG4gICAgICAgIGlmICh0aGlzLm5vZGUgJiYgdGhpcy5ub2RlLnBhcmVudCkge1xuICAgICAgICAgICAgdGhpcy5ub2RlLnBhcmVudC5lbWl0KFwidHJ1c3RlZV9zdGF0ZV91cGRhdGVcIiwgZGF0YSlcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDmn6Xmib7lj6/ku6Xlh7rnmoTniYzvvIjmnKzlnLBmYWxsYmFja++8iVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxhc3RTZWxlY3RlZCAtIOS4iuasoemAieS4reeahOeJjO+8iOeUqOS6juaJvuS4i+S4gOe7hO+8iVxuICAgICAqIEByZXR1cm5zIHtBcnJheX0g5Y+v5Lul5Ye655qE54mMXG4gICAgICovXG4gICAgX2ZpbmRQbGF5YWJsZUNhcmRzOiBmdW5jdGlvbihsYXN0U2VsZWN0ZWQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIFxuICAgICAgICAvLyDlpoLmnpzmsqHmnInmiYvniYzvvIzkuI3lpITnkIZcbiAgICAgICAgaWYgKCF0aGlzLmhhbmRDYXJkcyB8fCB0aGlzLmhhbmRDYXJkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOe7n+iuoeaJi+eJjFxuICAgICAgICB2YXIgY2FyZENvdW50cyA9IHt9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5oYW5kQ2FyZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gdGhpcy5oYW5kQ2FyZHNbaV0ucmFua1xuICAgICAgICAgICAgaWYgKCFjYXJkQ291bnRzW3JhbmtdKSB7XG4gICAgICAgICAgICAgICAgY2FyZENvdW50c1tyYW5rXSA9IFtdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXJkQ291bnRzW3JhbmtdLnB1c2godGhpcy5oYW5kQ2FyZHNbaV0pXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenOaYr+aWsOS4gOi9ru+8iOW/hemhu+WHuueJjO+8iVxuICAgICAgICBpZiAodGhpcy5fbXVzdFBsYXkgfHwgIXRoaXMuX2xhc3RQbGF5ZWRDYXJkcyB8fCB0aGlzLl9sYXN0UGxheWVkQ2FyZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZmluZFNtYWxsZXN0Q2FyZHMoY2FyZENvdW50cylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5LiN6IO95omT6L+H77yM5LiN5o+Q56S6XG4gICAgICAgIGlmICghdGhpcy5fY2FuQmVhdCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+W5LiK5a6254mM5Z6L5L+h5oGvXG4gICAgICAgIHZhciBsYXN0VHlwZSA9IHRoaXMuX2xhc3RQbGF5ZWRIYW5kVHlwZSB8fCBcIlwiXG4gICAgICAgIHZhciBsYXN0UmFuayA9IHRoaXMuX2dldExhc3RQbGF5ZWRNYWluUmFuaygpXG4gICAgICAgIHZhciBsYXN0Q291bnQgPSB0aGlzLl9sYXN0UGxheWVkQ2FyZHMubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICAvLyDmoLnmja7niYzlnovmn6Xmib7og73miZPov4fnmoTmnIDlsI/niYxcbiAgICAgICAgc3dpdGNoIChsYXN0VHlwZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICBjYXNlIFwic2luZ2xlXCI6IGNhc2UgXCJzb2xvXCI6IGNhc2UgXCLljZXlvKBcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZmluZEJlYXRpbmdTaW5nbGUoY2FyZENvdW50cywgbGFzdFJhbmspXG4gICAgICAgICAgICBjYXNlIFwicGFpclwiOiBjYXNlIFwiZG91YmxlXCI6IGNhc2UgXCLlr7nlrZBcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZmluZEJlYXRpbmdQYWlyKGNhcmRDb3VudHMsIGxhc3RSYW5rKVxuICAgICAgICAgICAgY2FzZSBcInRyaXBsZVwiOiBjYXNlIFwidGhyZWVcIjogY2FzZSBcIuS4ieW8oFwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ1RyaXBsZShjYXJkQ291bnRzLCBsYXN0UmFuaywgMClcbiAgICAgICAgICAgIGNhc2UgXCJ0cmlwbGV3aXRoc2luZ2xlXCI6IGNhc2UgXCJzYW5kYWl5aVwiOiBjYXNlIFwi5LiJ5bim5LiAXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRCZWF0aW5nVHJpcGxlKGNhcmRDb3VudHMsIGxhc3RSYW5rLCAxKVxuICAgICAgICAgICAgY2FzZSBcInRyaXBsZXdpdGhwYWlyXCI6IGNhc2UgXCJzYW5kYWlkdWlcIjogY2FzZSBcIuS4ieW4puS6jFwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ1RyaXBsZShjYXJkQ291bnRzLCBsYXN0UmFuaywgMilcbiAgICAgICAgICAgIGNhc2UgXCJib21iXCI6IGNhc2UgXCJ6aGFkYW5cIjogY2FzZSBcIueCuOW8uVwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ0JvbWIoY2FyZENvdW50cywgbGFzdFJhbmspXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIC8vIOacquefpeeJjOWei++8jOWwneivleaMieW8oOaVsOWkhOeQhlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ0J5Q291bnQoY2FyZENvdW50cywgbGFzdENvdW50LCBsYXN0UmFuaylcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog6I635Y+W5LiK5a625Ye655qE54mM55qE5Li754mM54K55pWwXG4gICAgICovXG4gICAgX2dldExhc3RQbGF5ZWRNYWluUmFuazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5fbGFzdFBsYXllZENhcmRzIHx8IHRoaXMuX2xhc3RQbGF5ZWRDYXJkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgIH1cbiAgICAgICAgLy8g57uf6K6h5q+P5Liq54K55pWw5Ye6546w55qE5qyh5pWwXG4gICAgICAgIHZhciBjb3VudHMgPSB7fVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2xhc3RQbGF5ZWRDYXJkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJhbmsgPSB0aGlzLl9sYXN0UGxheWVkQ2FyZHNbaV0ucmFua1xuICAgICAgICAgICAgY291bnRzW3JhbmtdID0gKGNvdW50c1tyYW5rXSB8fCAwKSArIDFcbiAgICAgICAgfVxuICAgICAgICAvLyDmib7lh7rlh7rnjrDmrKHmlbDmnIDlpJrnmoTngrnmlbDvvIjkuLvniYzvvIlcbiAgICAgICAgdmFyIG1heENvdW50ID0gMFxuICAgICAgICB2YXIgbWFpblJhbmsgPSAwXG4gICAgICAgIGZvciAodmFyIHJhbmsgaW4gY291bnRzKSB7XG4gICAgICAgICAgICBpZiAoY291bnRzW3JhbmtdID4gbWF4Q291bnQpIHtcbiAgICAgICAgICAgICAgICBtYXhDb3VudCA9IGNvdW50c1tyYW5rXVxuICAgICAgICAgICAgICAgIG1haW5SYW5rID0gcGFyc2VJbnQocmFuaylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFpblJhbmtcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOaJvuacgOWwj+eahOeJjO+8iOaWsOS4gOi9ruaXtuS9v+eUqO+8iVxuICAgICAqL1xuICAgIF9maW5kU21hbGxlc3RDYXJkczogZnVuY3Rpb24oY2FyZENvdW50cykge1xuICAgICAgICAvLyDmjInngrnmlbDku47lsI/liLDlpKfmjpLluo9cbiAgICAgICAgdmFyIHJhbmtzID0gT2JqZWN0LmtleXMoY2FyZENvdW50cykubWFwKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHBhcnNlSW50KHIpIH0pLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAtIGIgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIOS8mOWFiOWHuuWNleW8oFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmFuayA9IHJhbmtzW2ldXG4gICAgICAgICAgICBpZiAoY2FyZENvdW50c1tyYW5rXS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2NhcmRDb3VudHNbcmFua11bMF1dXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOayoeacieWNleW8oOWImeWHuuacgOWwj+eahOWvueWtkFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmFuayA9IHJhbmtzW2ldXG4gICAgICAgICAgICBpZiAoY2FyZENvdW50c1tyYW5rXS5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FyZENvdW50c1tyYW5rXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlh7rmnIDlsI/nmoTkuInlvKBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByYW5rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJhbmsgPSByYW5rc1tpXVxuICAgICAgICAgICAgaWYgKGNhcmRDb3VudHNbcmFua10ubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhcmRDb3VudHNbcmFua11cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5Ye65pyA5bCP55qE54K45by5XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gcmFua3NbaV1cbiAgICAgICAgICAgIGlmIChjYXJkQ291bnRzW3JhbmtdLmxlbmd0aCA9PT0gNCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYXJkQ291bnRzW3JhbmtdXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWFnOW6le+8muWHuuacgOWwj+eahOeJjFxuICAgICAgICBpZiAocmFua3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFtjYXJkQ291bnRzW3JhbmtzWzBdXVswXV1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog5om+6IO95omT6L+H55qE5pyA5bCP5Y2V5bygXG4gICAgICovXG4gICAgX2ZpbmRCZWF0aW5nU2luZ2xlOiBmdW5jdGlvbihjYXJkQ291bnRzLCB0YXJnZXRSYW5rKSB7XG4gICAgICAgIHZhciByYW5rcyA9IE9iamVjdC5rZXlzKGNhcmRDb3VudHMpLm1hcChmdW5jdGlvbihyKSB7IHJldHVybiBwYXJzZUludChyKSB9KS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgLSBiIH0pXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gcmFua3NbaV1cbiAgICAgICAgICAgIGlmIChyYW5rID4gdGFyZ2V0UmFuaykge1xuICAgICAgICAgICAgICAgIHJldHVybiBbY2FyZENvdW50c1tyYW5rXVswXV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyDmsqHmnInog73miZPov4fnmoTljZXlvKDvvIzlsJ3or5XngrjlvLlcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRTbWFsbGVzdEJvbWIoY2FyZENvdW50cylcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOaJvuiDveaJk+i/h+eahOacgOWwj+WvueWtkFxuICAgICAqL1xuICAgIF9maW5kQmVhdGluZ1BhaXI6IGZ1bmN0aW9uKGNhcmRDb3VudHMsIHRhcmdldFJhbmspIHtcbiAgICAgICAgdmFyIHJhbmtzID0gT2JqZWN0LmtleXMoY2FyZENvdW50cykubWFwKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHBhcnNlSW50KHIpIH0pLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAtIGIgfSlcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByYW5rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJhbmsgPSByYW5rc1tpXVxuICAgICAgICAgICAgaWYgKHJhbmsgPiB0YXJnZXRSYW5rICYmIGNhcmRDb3VudHNbcmFua10ubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2NhcmRDb3VudHNbcmFua11bMF0sIGNhcmRDb3VudHNbcmFua11bMV1dXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8g5rKh5pyJ6IO95omT6L+H55qE5a+55a2Q77yM5bCd6K+V54K45by5XG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kU21hbGxlc3RCb21iKGNhcmRDb3VudHMpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDmib7og73miZPov4fnmoTmnIDlsI/kuInlvKDvvIjluKbmiJbkuI3luKbvvIlcbiAgICAgKi9cbiAgICBfZmluZEJlYXRpbmdUcmlwbGU6IGZ1bmN0aW9uKGNhcmRDb3VudHMsIHRhcmdldFJhbmssIGtpY2tlcnMpIHtcbiAgICAgICAgdmFyIHJhbmtzID0gT2JqZWN0LmtleXMoY2FyZENvdW50cykubWFwKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHBhcnNlSW50KHIpIH0pLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAtIGIgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIOaJvuS4ieW8oFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmFuayA9IHJhbmtzW2ldXG4gICAgICAgICAgICBpZiAocmFuayA+IHRhcmdldFJhbmsgJiYgY2FyZENvdW50c1tyYW5rXS5sZW5ndGggPj0gMykge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBbY2FyZENvdW50c1tyYW5rXVswXSwgY2FyZENvdW50c1tyYW5rXVsxXSwgY2FyZENvdW50c1tyYW5rXVsyXV1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzpnIDopoHluKbniYxcbiAgICAgICAgICAgICAgICBpZiAoa2lja2VycyA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtpY2tlckNhcmRzID0gdGhpcy5fZmluZEtpY2tlckNhcmRzKGNhcmRDb3VudHMsIHJhbmssIGtpY2tlcnMpXG4gICAgICAgICAgICAgICAgICAgIGlmIChraWNrZXJDYXJkcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChraWNrZXJDYXJkcylcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWwneivleS7juWbm+W8oOS4reaLhuS4ieW8oFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmFuayA9IHJhbmtzW2ldXG4gICAgICAgICAgICBpZiAocmFuayA+IHRhcmdldFJhbmsgJiYgY2FyZENvdW50c1tyYW5rXS5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW2NhcmRDb3VudHNbcmFua11bMF0sIGNhcmRDb3VudHNbcmFua11bMV0sIGNhcmRDb3VudHNbcmFua11bMl1dXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKGtpY2tlcnMgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBraWNrZXJDYXJkcyA9IHRoaXMuX2ZpbmRLaWNrZXJDYXJkcyhjYXJkQ291bnRzLCByYW5rLCBraWNrZXJzKVxuICAgICAgICAgICAgICAgICAgICBpZiAoa2lja2VyQ2FyZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoa2lja2VyQ2FyZHMpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlsJ3or5XngrjlvLlcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRTbWFsbGVzdEJvbWIoY2FyZENvdW50cylcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOaJvuW4pueJjFxuICAgICAqL1xuICAgIF9maW5kS2lja2VyQ2FyZHM6IGZ1bmN0aW9uKGNhcmRDb3VudHMsIGV4Y2x1ZGVSYW5rLCBjb3VudCkge1xuICAgICAgICB2YXIgcmFua3MgPSBPYmplY3Qua2V5cyhjYXJkQ291bnRzKS5tYXAoZnVuY3Rpb24ocikgeyByZXR1cm4gcGFyc2VJbnQocikgfSkuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhIC0gYiB9KVxuICAgICAgICBcbiAgICAgICAgdmFyIGtpY2tlcnMgPSBbXVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmtzLmxlbmd0aCAmJiBraWNrZXJzLmxlbmd0aCA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gcmFua3NbaV1cbiAgICAgICAgICAgIGlmIChyYW5rICE9PSBleGNsdWRlUmFuaykge1xuICAgICAgICAgICAgICAgIHZhciBhdmFpbGFibGUgPSBNYXRoLm1pbihjYXJkQ291bnRzW3JhbmtdLmxlbmd0aCwgY291bnQgLSBraWNrZXJzLmxlbmd0aClcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGF2YWlsYWJsZTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGtpY2tlcnMucHVzaChjYXJkQ291bnRzW3JhbmtdW2pdKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtpY2tlcnMubGVuZ3RoID09PSBjb3VudCA/IGtpY2tlcnMgOiBudWxsXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDmib7og73miZPov4fnmoTmnIDlsI/ngrjlvLlcbiAgICAgKi9cbiAgICBfZmluZEJlYXRpbmdCb21iOiBmdW5jdGlvbihjYXJkQ291bnRzLCB0YXJnZXRSYW5rKSB7XG4gICAgICAgIHZhciByYW5rcyA9IE9iamVjdC5rZXlzKGNhcmRDb3VudHMpLm1hcChmdW5jdGlvbihyKSB7IHJldHVybiBwYXJzZUludChyKSB9KS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgLSBiIH0pXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gcmFua3NbaV1cbiAgICAgICAgICAgIGlmIChyYW5rID4gdGFyZ2V0UmFuayAmJiBjYXJkQ291bnRzW3JhbmtdLmxlbmd0aCA9PT0gNCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYXJkQ291bnRzW3JhbmtdXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8g5rKh5pyJ6IO95omT6L+H55qE54K45by577yM5bCd6K+V546L54K4XG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kUm9ja2V0KGNhcmRDb3VudHMpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDmib7mnIDlsI/nmoTngrjlvLlcbiAgICAgKi9cbiAgICBfZmluZFNtYWxsZXN0Qm9tYjogZnVuY3Rpb24oY2FyZENvdW50cykge1xuICAgICAgICB2YXIgcmFua3MgPSBPYmplY3Qua2V5cyhjYXJkQ291bnRzKS5tYXAoZnVuY3Rpb24ocikgeyByZXR1cm4gcGFyc2VJbnQocikgfSkuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhIC0gYiB9KVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmFuayA9IHJhbmtzW2ldXG4gICAgICAgICAgICBpZiAoY2FyZENvdW50c1tyYW5rXS5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FyZENvdW50c1tyYW5rXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kUm9ja2V0KGNhcmRDb3VudHMpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDmib7njovngrhcbiAgICAgKi9cbiAgICBfZmluZFJvY2tldDogZnVuY3Rpb24oY2FyZENvdW50cykge1xuICAgICAgICB2YXIgam9rZXJzID0gW11cbiAgICAgICAgaWYgKGNhcmRDb3VudHNbMTZdICYmIGNhcmRDb3VudHNbMTZdLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGpva2Vycy5wdXNoKGNhcmRDb3VudHNbMTZdWzBdKVxuICAgICAgICB9XG4gICAgICAgIGlmIChjYXJkQ291bnRzWzE3XSAmJiBjYXJkQ291bnRzWzE3XS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBqb2tlcnMucHVzaChjYXJkQ291bnRzWzE3XVswXSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gam9rZXJzLmxlbmd0aCA9PT0gMiA/IGpva2VycyA6IG51bGxcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOaMieW8oOaVsOaJvuiDveaJk+i/h+eahOeJjFxuICAgICAqL1xuICAgIF9maW5kQmVhdGluZ0J5Q291bnQ6IGZ1bmN0aW9uKGNhcmRDb3VudHMsIGNvdW50LCB0YXJnZXRSYW5rKSB7XG4gICAgICAgIC8vIOeugOWNleWunueOsO+8muaMieW8oOaVsOWkhOeQhlxuICAgICAgICBpZiAoY291bnQgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ1NpbmdsZShjYXJkQ291bnRzLCB0YXJnZXRSYW5rKVxuICAgICAgICB9IGVsc2UgaWYgKGNvdW50ID09PSAyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZmluZEJlYXRpbmdQYWlyKGNhcmRDb3VudHMsIHRhcmdldFJhbmspXG4gICAgICAgIH0gZWxzZSBpZiAoY291bnQgPT09IDMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ1RyaXBsZShjYXJkQ291bnRzLCB0YXJnZXRSYW5rLCAwKVxuICAgICAgICB9IGVsc2UgaWYgKGNvdW50ID09PSA0KSB7XG4gICAgICAgICAgICAvLyDlj6/og73mmK/ngrjlvLlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ0JvbWIoY2FyZENvdW50cywgdGFyZ2V0UmFuaylcbiAgICAgICAgfSBlbHNlIGlmIChjb3VudCA+PSA1KSB7XG4gICAgICAgICAgICAvLyDlj6/og73mmK/pobrlrZDjgIHov57lr7nnrYnvvIzmmoLkuI3mlK/mjIHmj5DnpLpcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog6YCJ5Lit5oyH5a6a55qE54mMXG4gICAgICogQHBhcmFtIHtBcnJheX0gY2FyZHMgLSDopoHpgInkuK3nmoTniYxcbiAgICAgKi9cbiAgICBfc2VsZWN0Q2FyZHM6IGZ1bmN0aW9uKGNhcmRzKSB7XG4gICAgICAgIGlmICghY2FyZHMgfHwgY2FyZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeWPquS7juaJi+eJjOWuueWZqOS4reafpeaJvu+8jOS4jemBjeWOhm5vZGUucGFyZW50XG4gICAgICAgIHZhciBjYXJkUGFyZW50ID0gdGhpcy5jYXJkc19ub2RlXG4gICAgICAgIGlmICghY2FyZFBhcmVudCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+OriBbX3NlbGVjdENhcmRzXSBjYXJkc19ub2RlIOacquWumuS5ie+8jOWwneivleafpeaJvuaJi+eJjOWuueWZqFwiKVxuICAgICAgICAgICAgLy8g5bCd6K+V6YCa6L+H6IqC54K55ZCN56ew5p+l5om+XG4gICAgICAgICAgICB2YXIgZ2FtZVNjZW5lTm9kZSA9IHRoaXMubm9kZS5wYXJlbnRcbiAgICAgICAgICAgIGlmIChnYW1lU2NlbmVOb2RlKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnYW1lU2NlbmVOb2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGdhbWVTY2VuZU5vZGUuY2hpbGRyZW5baV1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLm5hbWUgPT09IFwiY2FyZHNfbm9kZVwiIHx8IGNoaWxkLm5hbWUgPT09IFwiY2FyZHNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZFBhcmVudCA9IGNoaWxkXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhcmRzX25vZGUgPSBjaGlsZFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY2FyZFBhcmVudCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfjq4gW19zZWxlY3RDYXJkc10g5om+5LiN5Yiw5omL54mM5a655ZmoXCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjaGlsZHJlbiA9IGNhcmRQYXJlbnQuY2hpbGRyZW5cblxuICAgICAgICB2YXIgZm91bmRDb3VudCA9IDBcbiAgICAgICAgdmFyIGFscmVhZHlNYXRjaGVkID0ge30gIC8vIPCflKfjgJDmlrDlop7jgJHorrDlvZXlt7LljLnphY3nmoTniYzvvIzpmLLmraLph43lpI3ljLnphY1cblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2FyZE5vZGUgPSBjaGlsZHJlbltpXVxuICAgICAgICAgICAgdmFyIGNhcmRDb21wID0gY2FyZE5vZGUuZ2V0Q29tcG9uZW50KFwiY2FyZFwiKVxuICAgICAgICAgICAgaWYgKGNhcmRDb21wICYmIGNhcmRDb21wLmNhcmRfZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vIOajgOafpei/meW8oOeJjOaYr+WQpuWcqOimgemAieS4reeahOeJjOS4rVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2FyZHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hdGNoS2V5ID0gY2FyZHNbal0uc3VpdCArIFwiX1wiICsgY2FyZHNbal0ucmFua1xuICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5qOA5p+l5piv5ZCm5bey57uP5Yy56YWN6L+H6L+Z5byg54mMXG4gICAgICAgICAgICAgICAgICAgIGlmIChhbHJlYWR5TWF0Y2hlZFttYXRjaEtleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FyZENvbXAuY2FyZF9kYXRhLnJhbmsgPT09IGNhcmRzW2pdLnJhbmsgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRDb21wLmNhcmRfZGF0YS5zdWl0ID09PSBjYXJkc1tqXS5zdWl0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5qOA5p+l5piv5ZCm5bey57uP6YCJ5LitXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNhcmRDb21wLmZsYWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDpgInkuK3ov5nlvKDniYxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXJkQ29tcC5mbGFnID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhcmROb2RlLnkgKz0gMjAgIC8vIOWQkeS4iuenu+WKqOihqOekuumAieS4rVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hvb3NlX2NhcmRfZGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FyZGlkOiBjYXJkQ29tcC5jYXJkX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXJkX2RhdGE6IGNhcmRDb21wLmNhcmRfZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRDb3VudCsrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxyZWFkeU1hdGNoZWRbbWF0Y2hLZXldID0gdHJ1ZSAgLy8g5qCH6K6w5bey5Yy56YWNXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgaWYgKGZvdW5kQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMudGlwc0xhYmVsLnN0cmluZyA9IFwi5o+Q56S65aSx6LSl77yM6K+35omL5Yqo6YCJ54mMXCJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnRpcHNMYWJlbC5zdHJpbmcgPSBcIlwiXG4gICAgICAgICAgICB9LCAyMDAwKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNsZWFyT3V0Wm9uZTogZnVuY3Rpb24oYWNjb3VudGlkKSB7XG4gICAgICAgIHZhciBvdXRDYXJkX25vZGUgPSB0aGlzLl9nZXRPdXRDYXJkTm9kZShhY2NvdW50aWQpXG4gICAgICAgIGlmIChvdXRDYXJkX25vZGUpIHtcbiAgICAgICAgICAgIG91dENhcmRfbm9kZS5yZW1vdmVBbGxDaGlsZHJlbih0cnVlKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNob3dPdXRDYXJkczogZnVuY3Rpb24ob3V0Q2FyZF9ub2RlLCBjYXJkcykge1xuICAgICAgICBpZiAoIW91dENhcmRfbm9kZSB8fCAhY2FyZHMgfHwgY2FyZHMubGVuZ3RoID09PSAwKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIG91dENhcmRfbm9kZS5yZW1vdmVBbGxDaGlsZHJlbih0cnVlKVxuICAgICAgICBcbiAgICAgICAgdmFyIGNvdW50ID0gY2FyZHMubGVuZ3RoXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNhcmQgPSBjYXJkc1tpXVxuICAgICAgICAgICAgb3V0Q2FyZF9ub2RlLmFkZENoaWxkKGNhcmQsIGkpXG4gICAgICAgICAgICBjYXJkLnNldFNjYWxlKENhcmRMYXlvdXQub3V0Q2FyZFNjYWxlLCBDYXJkTGF5b3V0Lm91dENhcmRTY2FsZSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHggPSB0aGlzLl9nZXRDYXJkWChpLCBjb3VudCwgQ2FyZExheW91dC5vdXRDYXJkU3BhY2luZylcbiAgICAgICAgICAgIGNhcmQuc2V0UG9zaXRpb24oeCwgMClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDmuLjmiI/nirbmgIHmgaLlpI3vvIjmlq3nur/ph43ov57vvIlcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICByZXN0b3JlR2FtZVN0YXRlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIFxuICAgICAgICB2YXIgZ2FtZVN0YXRlID0gZGF0YS5nYW1lX3N0YXRlXG4gICAgICAgIGlmICghZ2FtZVN0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7jgJHorr7nva7muLjmiI/pmLbmrrVcbiAgICAgICAgaWYgKGdhbWVTdGF0ZS5waGFzZSA9PT0gXCJiaWRkaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX2dhbWVQaGFzZSA9IFwiYmlkZGluZ1wiXG4gICAgICAgICAgICB0aGlzLl9iaWRkaW5nUGhhc2UgPSBcImJpZGRpbmdcIlxuICAgICAgICB9IGVsc2UgaWYgKGdhbWVTdGF0ZS5waGFzZSA9PT0gXCJwbGF5aW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX2dhbWVQaGFzZSA9IFwicGxheWluZ1wiXG4gICAgICAgICAgICB0aGlzLl9iaWRkaW5nUGhhc2UgPSBcImlkbGVcIlxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmgaLlpI3njqnlrrbkv6Hmga9cbiAgICAgICAgaWYgKGdhbWVTdGF0ZS5wbGF5ZXJzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdhbWVTdGF0ZS5wbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSBnYW1lU3RhdGUucGxheWVyc1tpXVxuICAgICAgICAgICAgICAgIGlmIChwLmlzX2xhbmRsb3JkICYmIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLm1hc3Rlcl9hY2NvdW50aWQgPSBwLmlkXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR6YCa55+l5YW25LuW546p5a626IqC54K55pu05pawXG4gICAgICAgICAgICBpZiAodGhpcy5ub2RlICYmIHRoaXMubm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5vZGUucGFyZW50LmVtaXQoXCJwbGF5ZXJzX3Jlc3RvcmVkX2V2ZW50XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyczogZ2FtZVN0YXRlLnBsYXllcnNcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5oGi5aSN5omL54mMXG4gICAgICAgIGlmIChnYW1lU3RhdGUuaGFuZCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu44CR6YeN572u5riy5p+T5ZOI5biM77yM56Gu5L+d5omL54mM5Lya6KKr5pu05pawXG4gICAgICAgICAgICB0aGlzLl9sYXN0UmVuZGVySGFzaCA9IFwiXCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5L+d5a2Y5omL54mM5pWw5o2uXG4gICAgICAgICAgICB0aGlzLmhhbmRDYXJkcyA9IGdhbWVTdGF0ZS5oYW5kXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOagh+iusOWPkeeJjOWujOaIkFxuICAgICAgICAgICAgdGhpcy5jYXJkc1JlYWR5ID0gdHJ1ZVxuICAgICAgICAgICAgdGhpcy5mYXBhaV9lbmQgPSB0cnVlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7jgJHkvb/nlKjpnZnpu5jmm7TmlrDvvIzkuI3op6blj5Hlj5HniYzliqjnlLtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZUhhbmRDYXJkc1NpbGVudCh0aGlzLmhhbmRDYXJkcylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5oGi5aSN5bqV54mMXG4gICAgICAgIGlmIChnYW1lU3RhdGUuYm90dG9tX2NhcmRzICYmIGdhbWVTdGF0ZS5ib3R0b21fY2FyZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5ib3R0b21DYXJkcyA9IGdhbWVTdGF0ZS5ib3R0b21fY2FyZHNcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ib3R0b21fY2FyZC5sZW5ndGggJiYgaSA8IHRoaXMuYm90dG9tQ2FyZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ib3R0b21fY2FyZFtpXSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZENvbXAgPSB0aGlzLmJvdHRvbV9jYXJkW2ldLmdldENvbXBvbmVudChcImNhcmRcIilcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhcmRDb21wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJkQ29tcC5zaG93Q2FyZHModGhpcy5ib3R0b21DYXJkc1tpXSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeaBouWkjeS4iuWutuWHuueahOeJjFxuICAgICAgICBpZiAoZ2FtZVN0YXRlLmxhc3RfcGxheWVkICYmIGdhbWVTdGF0ZS5sYXN0X3BsYXllZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLl9sYXN0UGxheWVkQ2FyZHMgPSBnYW1lU3RhdGUubGFzdF9wbGF5ZWRcbiAgICAgICAgICAgIHRoaXMuX2xhc3RQbGF5ZWRIYW5kVHlwZSA9IGdhbWVTdGF0ZS5sYXN0X3BsYXllZC5oYW5kX3R5cGUgfHwgXCJcIlxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5pi+56S65LiK5a625Ye655qE54mMXG4gICAgICAgICAgICBpZiAoZ2FtZVN0YXRlLmxhc3RfcGxheWVyX2lkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGdhbWVTY2VuZV9zY3JpcHQgPSB0aGlzLm5vZGUucGFyZW50LmdldENvbXBvbmVudChcImdhbWVTY2VuZVwiKVxuICAgICAgICAgICAgICAgIGlmIChnYW1lU2NlbmVfc2NyaXB0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvdXRDYXJkX25vZGUgPSBnYW1lU2NlbmVfc2NyaXB0LmdldFVzZXJPdXRDYXJkUG9zQnlBY2NvdW50KGdhbWVTdGF0ZS5sYXN0X3BsYXllcl9pZClcbiAgICAgICAgICAgICAgICAgICAgaWYgKG91dENhcmRfbm9kZSAmJiB0aGlzLmNhcmRfcHJlZmFiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmuIXpmaTml6fnmoTlh7rniYxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dENhcmRfbm9kZS5yZW1vdmVBbGxDaGlsZHJlbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaYvuekuuS4iuWutuWHuueahOeJjFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5vZGVfY2FyZHMgPSBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnYW1lU3RhdGUubGFzdF9wbGF5ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZCA9IGNjLmluc3RhbnRpYXRlKHRoaXMuY2FyZF9wcmVmYWIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNhcmRTY3JpcHQgPSBjYXJkLmdldENvbXBvbmVudChcImNhcmRcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhcmRTY3JpcHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRTY3JpcHQuc2hvd0NhcmRzKGdhbWVTdGF0ZS5sYXN0X3BsYXllZFtpXSwgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVfY2FyZHMucHVzaChjYXJkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd091dENhcmRzKG91dENhcmRfbm9kZSwgbm9kZV9jYXJkcylcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5oGi5aSN5Ye654mM6L2u5qyhXG4gICAgICAgIGlmIChnYW1lU3RhdGUucGhhc2UgPT09IFwicGxheWluZ1wiICYmIGdhbWVTdGF0ZS5jdXJyZW50X3R1cm4pIHtcbiAgICAgICAgICAgIHZhciBteVBsYXllcklkID0gd2luZG93Lm15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKCkuaWQgfHwgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7jgJHpmpDol4/miqLlnLDkuLtVSVxuICAgICAgICAgICAgdGhpcy5faGlkZVJvYlVJKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKFN0cmluZyhnYW1lU3RhdGUuY3VycmVudF90dXJuKSA9PT0gU3RyaW5nKG15UGxheWVySWQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5aW5nVUlfbm9kZS5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeS/neWtmOWHuueJjOeKtuaAgVxuICAgICAgICAgICAgICAgIHRoaXMuX211c3RQbGF5ID0gZ2FtZVN0YXRlLm11c3RfcGxheSB8fCBmYWxzZVxuICAgICAgICAgICAgICAgIHRoaXMuX2NhbkJlYXQgPSBnYW1lU3RhdGUuY2FuX2JlYXQgfHwgZmFsc2VcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5ZCv5Yqo5Ye654mM5YCS6K6h5pe277yI5aaC5p6c5pyN5Yqh56uv5o+Q5L6b5LqG5Ymp5L2Z5pe26Ze077yJXG4gICAgICAgICAgICAgICAgLy8g5rOo5oSP77ya5pyN5Yqh56uv5bqU6K+l5Zyo6YeN6L+e5ZCO5Y+R6YCBIGNhbl9jaHVfY2FyZF9ub3RpZnkg5raI5oGv5p2l5ZCv5Yqo5YCS6K6h5pe2XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBsYXlpbmdVSV9ub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGxheWluZ1VJX25vZGUuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHlpoLmnpzmmK/miqLlnLDkuLvpmLbmrrVcbiAgICAgICAgaWYgKGdhbWVTdGF0ZS5waGFzZSA9PT0gXCJiaWRkaW5nXCIpIHtcbiAgICAgICAgICAgIC8vIOazqOaEj++8muacjeWKoeerr+W6lOivpeWcqOmHjei/nuWQjuWPkemAgSBjYWxsX2xhbmRsb3JkX3R1cm5fbm90aWZ5IOa2iOaBr+adpeaYvuekuuaKouWcsOS4u+aMiemSrlxuICAgICAgICB9XG4gICAgICAgIFxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDwn5Sn44CQ5paw5aKe44CR5bqV54mM5pi+56S65ZKM5Zyw5Li75omL54mM5pu05pawXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeaYvuekuuW6leeJjOe7meaJgOacieeOqeWutu+8iOe/u+eJjOWKqOeUu++8iVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGNhcmRzIC0g5bqV54mM5pWw5o2uXG4gICAgICovXG4gICAgX3Nob3dCb3R0b21DYXJkc1RvQWxsOiBmdW5jdGlvbihjYXJkcykge1xuICAgICAgICBpZiAoIWNhcmRzIHx8IGNhcmRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDlupXniYzmmL7npLpcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYXJkcy5sZW5ndGggJiYgaSA8IHRoaXMuYm90dG9tX2NhcmQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjYXJkTm9kZSA9IHRoaXMuYm90dG9tX2NhcmRbaV1cbiAgICAgICAgICAgIGlmICghY2FyZE5vZGUpIGNvbnRpbnVlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBjYXJkU2NyaXB0ID0gY2FyZE5vZGUuZ2V0Q29tcG9uZW50KFwiY2FyZFwiKVxuICAgICAgICAgICAgaWYgKGNhcmRTY3JpcHQpIHtcbiAgICAgICAgICAgICAgICBjYXJkU2NyaXB0LnNob3dDYXJkcyhjYXJkc1tpXSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkemdmem7mOabtOaWsOWcsOS4u+eahOaJi+eJjO+8iOS4jeinpuWPkeWPkeeJjOWKqOeUu++8iVxuICAgICAqIOWPquWcqOWcsOS4u+aUtuWIsCBMQU5ETE9SRF9DQVJEUyDmtojmga/ml7bosIPnlKhcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBjYXJkcyAtIOWcsOS4u+eahOWujOaVtOaJi+eJjO+8iOWQq+W6leeJjO+8iVxuICAgICAqL1xuICAgIF91cGRhdGVMYW5kbG9yZEhhbmRDYXJkczogZnVuY3Rpb24oY2FyZHMpIHtcbiAgICAgICAgaWYgKCFjYXJkcyB8fCBjYXJkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgLy8g5o6S5bqP5omL54mMXG4gICAgICAgIHZhciBzb3J0ZWRDYXJkcyA9IHRoaXMuX3NvcnRDYXJkcyhjYXJkcylcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHnoa7kv53miYvniYzlrrnlmajlrZjlnKhcbiAgICAgICAgdmFyIGNhcmRzUGFyZW50ID0gdGhpcy5jYXJkc19ub2RlXG4gICAgICAgIGlmICghY2FyZHNQYXJlbnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn4OPIFtfdXBkYXRlTGFuZGxvcmRIYW5kQ2FyZHNdIGNhcmRzX25vZGUg5pyq5a6a5LmJXCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5riF55CG5pen5omL54mM6IqC54K5XG4gICAgICAgIGNhcmRzUGFyZW50LnJlbW92ZUFsbENoaWxkcmVuKClcbiAgICAgICAgXG4gICAgICAgIC8vIOmHjeaWsOWIm+W7uuaJi+eJjOiKgueCue+8iOaXoOWKqOeUu++8iVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvcnRlZENhcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2FyZERhdGEgPSBzb3J0ZWRDYXJkc1tpXVxuICAgICAgICAgICAgdmFyIHRhcmdldFggPSB0aGlzLl9nZXRDYXJkWChpLCBzb3J0ZWRDYXJkcy5sZW5ndGgsIENhcmRMYXlvdXQuY2FyZFNwYWNpbmcpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBjYXJkID0gY2MuaW5zdGFudGlhdGUodGhpcy5jYXJkX3ByZWZhYilcbiAgICAgICAgICAgIGlmICghY2FyZCkgY29udGludWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FyZC5zY2FsZSA9IENhcmRMYXlvdXQuY2FyZFNjYWxlXG4gICAgICAgICAgICBjYXJkLnBhcmVudCA9IGNhcmRzUGFyZW50ICAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55So56Gu5a6a55qE5omL54mM5a655ZmoXG4gICAgICAgICAgICBjYXJkLnNldFBvc2l0aW9uKHRhcmdldFgsIENhcmRMYXlvdXQuY2FyZFkpXG4gICAgICAgICAgICBjYXJkLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgIGNhcmQuekluZGV4ID0gaVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgY2FyZENvbXAgPSBjYXJkLmdldENvbXBvbmVudChcImNhcmRcIilcbiAgICAgICAgICAgIGlmIChjYXJkQ29tcCkge1xuICAgICAgICAgICAgICAgIGNhcmRDb21wLnNob3dDYXJkcyhjYXJkRGF0YSwgbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SUQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmHjee9rua4suafk+WTiOW4jO+8jOWFgeiuuOWQjue7rea4suafk1xuICAgICAgICB0aGlzLl9sYXN0UmVuZGVySGFzaCA9IEpTT04uc3RyaW5naWZ5KGNhcmRzKVxuICAgICAgICBcbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g8J+UiuOAkOWHuueJjOmfs+aViOezu+e7n+OAkeS9v+eUqOWunumZhemfs+aViOaWh+S7tlxuICAgIC8vIOmfs+aViOaWh+S7tuWRveWQjeinhOWIme+8mlxuICAgIC8vIC0g55S354mIOiBtX2NwX3t0eXBlfV97cmFua30ubXAzIOaIliBtX2NwX3t0eXBlfS5tcDNcbiAgICAvLyAtIOWls+eJiDogbV9jcF9udl97dHlwZX1fe3Jhbmt9Lm1wMyDmiJYgbV9jcF9udl97dHlwZX0ubXAzXG4gICAgLy8g5rOo5oSP77ya5aSn5bCP546LKHJhbms9MTQvMTUp5rKh5pyJ5a+55a2Q6Z+z5pWI77yM5Zug5Li65Lik5byg546L5piv546L54K45LiN5piv5a+55a2QXG4gICAgLy8gXG4gICAgLy8g8J+Up+OAkOmfs+aViOinhOWImeOAkVxuICAgIC8vIDEuIOmmluWHuu+8iGlzX25ld19yb3VuZD10cnVl77yJ77ya5pKt5pS+5a+55bqU54mM5Z6L55qE6Z+z5pWIXG4gICAgLy8gMi4g5Y6L54mM77yIaXNfbmV3X3JvdW5kPWZhbHNlLCBjYW5fYmVhdD10cnVl77yJ77yaXG4gICAgLy8gICAgLSDmnInlr7nlupTpn7PmlYjmlofku7bvvJrmkq3mlL7niYzlnovpn7PmlYhcbiAgICAvLyAgICAtIOaXoOWvueW6lOmfs+aViOaWh+S7tu+8iOWmguWvueWtkDE0LzE177yJ77ya5pKt5pS+XCLlpKfkvaBcIumfs+aViFxuICAgIC8vIDMuIOeCuOW8uS/njovngrjvvJrlp4vnu4jmkq3mlL7ngrjlvLkv546L54K46Z+z5pWIXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiDwn5SKIOaSreaUvuWHuueJjOmfs+aViFxuICAgICAqIPCflKfjgJDlhajpnaLph43mnoTniYjjgJHkuKXmoLzpgbXlvqpcIuWkp+S9oFwi6Z+z5pWI5L2/55So6KeE5YiZXG4gICAgICogXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSDmnI3liqHnq6/lub/mkq3nmoTmlbDmja5cbiAgICAgKiAgIC0gaGFuZF90eXBlOiDniYzlnovlkI3np7AgKHNpbmdsZS9wYWlyL3RyaXBsZS9zdHJhaWdodC9ib21iL3JvY2tldC9saWFuZHVpL3BsYW5lL3NhbmRhaXlpL3NhbmRhaWR1aS9zaWRhaWVyL3NpZGFpbGlhbmdkdWkpXG4gICAgICogICAtIHJhbms6IOS4u+eJjOeCueaVsCAo55So5LqO5Y2V5bygL+WvueWtkC/kuInlvKApXG4gICAgICogICAtIGdlbmRlcjogXCJtYWxlXCIgLyBcImZlbWFsZVwiXG4gICAgICogICAtIGlzX25ld19yb3VuZDog5piv5ZCm5piv5paw5Zue5ZCI77yI6aaW5Ye677yJXG4gICAgICogICAtIGNhbl9iZWF0OiDmmK/lkKbljovov4fkuIrlrrZcbiAgICAgKiBcbiAgICAgKiDjgJDmoLjlv4Pop4TliJnjgJFcIuWkp+S9oFwi6Z+z5pWIKG1fY3BfZGFuaSnnmoTkvb/nlKjlnLrmma/vvJpcbiAgICAgKiBcbiAgICAgKiDlnLrmma8xIC0g6aaW5Ye6KGlzX25ld19yb3VuZD10cnVlKe+8mlxuICAgICAqICAg4pyFIOWPquaSreaUvueJjOWei+mfs+aViFxuICAgICAqICAg4p2MIOemgeatouaSreaUvlwi5aSn5L2gXCJcbiAgICAgKiBcbiAgICAgKiDlnLrmma8yIC0g5Y6L54mMKGlzX25ld19yb3VuZD1mYWxzZSAmJiBjYW5fYmVhdD10cnVlKe+8mlxuICAgICAqICAg8J+OsiA3MCUg5qaC546H5pKt5pS+54mM5Z6L6Z+z5pWIXG4gICAgICogICDwn46yIDMwJSDmpoLnjofmkq3mlL5cIuWkp+S9oFwiXG4gICAgICogICDvvIjlpoLmnpzniYzlnovpn7PmlYjmlofku7bkuI3lrZjlnKjvvIwxMDAl5pKt5pS+XCLlpKfkvaBcIu+8iVxuICAgICAqIFxuICAgICAqIOWcuuaZrzMgLSDngrjlvLkv546L54K477yaXG4gICAgICogICDinIUg5aeL57uI5pKt5pS+54K45by5L+eOi+eCuOmfs+aViFxuICAgICAqL1xuICAgIF9wbGF5Q2FyZFNvdW5kOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmICghaXNvcGVuX3NvdW5kKSByZXR1cm5cblxuICAgICAgICAvLyDwn5Sn44CQ6LCD6K+V44CR5omT5Y2w5a6M5pW05pWw5o2u57uT5p6EXG5cbiAgICAgICAgdmFyIGhhbmRUeXBlID0gZGF0YS5oYW5kX3R5cGUgfHwgXCJcIlxuICAgICAgICB2YXIgZ2VuZGVyID0gZGF0YS5nZW5kZXIgfHwgXCJtYWxlXCJcbiAgICAgICAgdmFyIGlzTmV3Um91bmQgPSBkYXRhLmlzX25ld19yb3VuZCAhPT0gdW5kZWZpbmVkID8gZGF0YS5pc19uZXdfcm91bmQgOiB0cnVlXG4gICAgICAgIHZhciBjYW5CZWF0ID0gZGF0YS5jYW5fYmVhdCAhPT0gdW5kZWZpbmVkID8gZGF0YS5jYW5fYmVhdCA6IGZhbHNlXG5cbiAgICAgICAgLy8g8J+Up+OAkOaguOW/g+S/ruWkjeOAkeS8mOWFiOS7jiBjYXJkcyDkuK3mj5Dlj5bkuLvniYzlgLxcbiAgICAgICAgdmFyIHJhbmsgPSB0aGlzLl9leHRyYWN0TWFpblJhbmsoZGF0YSlcbiAgICAgICAgXG4gICAgICAgIC8vIPCflIrjgJDosIPor5Xml6Xlv5fjgJHor6bnu4bovpPlh7rpn7PmlYjmkq3mlL7lj4LmlbBcblxuICAgICAgICAvLyDwn5Sn44CQ5qOA5p+l44CR5piv5ZCm5piv54K45by55oiW546L54K477yI54m55q6K5aSE55CG77yJXG4gICAgICAgIHZhciB0eXBlID0gKGhhbmRUeXBlIHx8IFwiXCIpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgdmFyIGlzQm9tYiA9IHR5cGUgPT09IFwiYm9tYlwiIHx8IHR5cGUgPT09IFwiemhhZGFuXCIgfHwgdHlwZSA9PT0gXCLngrjlvLlcIlxuICAgICAgICB2YXIgaXNSb2NrZXQgPSB0eXBlID09PSBcInJvY2tldFwiIHx8IHR5cGUgPT09IFwid2FuZ3poYVwiIHx8IHR5cGUgPT09IFwi546L54K4XCJcbiAgICAgICAgXG4gICAgICAgIC8vIOeCuOW8ueWSjOeOi+eCuOWni+e7iOaSreaUvuWvueW6lOmfs+aViFxuICAgICAgICBpZiAoaXNCb21iIHx8IGlzUm9ja2V0KSB7XG4gICAgICAgICAgICB2YXIgc291bmROYW1lID0gdGhpcy5fZ2V0Q2FyZFR5cGVTb3VuZChoYW5kVHlwZSwgcmFuaywgZ2VuZGVyKVxuICAgICAgICAgICAgaWYgKHNvdW5kTmFtZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlTb3VuZEVmZmVjdChzb3VuZE5hbWUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIPCflKfjgJDmoLjlv4PjgJHojrflj5bniYzlnovpn7PmlYhcbiAgICAgICAgdmFyIGNhcmRTb3VuZCA9IHRoaXMuX2dldENhcmRUeXBlU291bmQoaGFuZFR5cGUsIHJhbmssIGdlbmRlcilcbiAgICAgICAgdmFyIHByZWZpeCA9IGdlbmRlciA9PT0gXCJmZW1hbGVcIiA/IFwibV9jcF9udl9cIiA6IFwibV9jcF9cIlxuICAgICAgICB2YXIgZGFuaVNvdW5kID0gcHJlZml4ICsgXCJkYW5pXCJcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDmo4Dmn6XjgJHniYzlnovmmK/lkKbmnInlr7nlupTnmoTpn7PmlYjmlofku7ZcbiAgICAgICAgdmFyIGhhc1NwZWNpZmljU291bmQgPSB0aGlzLl9oYXNTcGVjaWZpY0NhcmRTb3VuZChoYW5kVHlwZSwgcmFuaylcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5qC45b+D5L+u5aSN44CR5q2j56Gu55qEXCLlpKfkvaBcIuaSreaUvumAu+i+kVxuICAgICAgICAvLyBcbiAgICAgICAgLy8g6KeE5YiZ6K+05piO77yaXG4gICAgICAgIC8vIDEuIOmmluWHuihpc19uZXdfcm91bmQ9dHJ1ZSnvvJrlj6rmkq3mlL7niYzlnovpn7PmlYjvvIznpoHmraJcIuWkp+S9oFwiXG4gICAgICAgIC8vIDIuIOWOi+eJjChpc19uZXdfcm91bmQ9ZmFsc2UgJiYgY2FuX2JlYXQ9dHJ1ZSnvvJrpmo/mnLrmkq3mlL7vvIw3MCXniYzlnovpn7PmlYjvvIwzMCVcIuWkp+S9oFwiXG4gICAgICAgIC8vIDMuIOWOi+eJjOS9humfs+aViOaWh+S7tue8uuWkse+8muaSreaUvlwi5aSn5L2gXCJcbiAgICAgICAgXG4gICAgICAgIGlmIChpc05ld1JvdW5kKSB7XG4gICAgICAgICAgICAvLyDinIXjgJDlnLrmma8x44CR6aaW5Ye677ya5Y+q5pKt5pS+54mM5Z6L6Z+z5pWI77yM56aB5q2iXCLlpKfkvaBcIlxuICAgICAgICAgICAgaWYgKGNhcmRTb3VuZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlTb3VuZEVmZmVjdChjYXJkU291bmQpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOmmluWHuuS9huayoeacieWvueW6lOmfs+aViOaWh+S7tu+8iOS4jeW6lOivpeWPkeeUn++8jOS9huWuieWFqOWkhOeQhu+8iVxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCflIogW19wbGF5Q2FyZFNvdW5kXSDimqDvuI8g6aaW5Ye65L2G5peg5a+55bqU6Z+z5pWI5paH5Lu2OiBcIiArIGhhbmRUeXBlICsgXCIsIHJhbms9XCIgKyByYW5rKVxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDph43opoHjgJHpppblh7rkuI3mkq3mlL5cIuWkp+S9oFwi77yM6Z2Z6buY6Lez6L+HXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoY2FuQmVhdCkge1xuICAgICAgICAgICAgLy8g4pyF44CQ5Zy65pmvMuOAkeWOi+eJjOWcuuaZr++8mumaj+acuuaSreaUvu+8iDcwJeeJjOWei++8jDMwJeWkp+S9oO+8iVxuICAgICAgICAgICAgaWYgKGhhc1NwZWNpZmljU291bmQgJiYgY2FyZFNvdW5kKSB7XG4gICAgICAgICAgICAgICAgLy8g6ZqP5py66YCJ5oup77yaNzAl54mM5Z6L77yMMzAl5aSn5L2gXG4gICAgICAgICAgICAgICAgdmFyIHJhbmRvbVZhbHVlID0gTWF0aC5yYW5kb20oKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChyYW5kb21WYWx1ZSA8IDAuNykge1xuICAgICAgICAgICAgICAgICAgICAvLyA3MCUg5pKt5pS+54mM5Z6L6Z+z5pWIXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlTb3VuZEVmZmVjdChjYXJkU291bmQpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gMzAlIOaSreaUvlwi5aSn5L2gXCJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGxheVNvdW5kRWZmZWN0KGRhbmlTb3VuZClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOmfs+aViOaWh+S7tue8uuWkse+8jOaSreaUvlwi5aSn5L2gXCJcbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5U291bmRFZmZlY3QoZGFuaVNvdW5kKVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g4pyF44CQ5Zy65pmvM+OAkeWOi+eJjOS9hmNhbl9iZWF0PWZhbHNl77yI5LiN5bqU6K+l5Y+R55Sf77yM5L2G5a6J5YWo5aSE55CG77yJXG4gICAgICAgICAgICAvLyDov5nnp43mg4XlhrXnkIborrrkuIrkuI3lupTor6Xlh7rnjrDvvIzlm6DkuLrmnI3liqHnq6/lj6rlnKjmiJDlip/ljovniYzml7borr7nva5jYW5fYmVhdD10cnVlXG4gICAgICAgICAgICBpZiAoY2FyZFNvdW5kKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheVNvdW5kRWZmZWN0KGNhcmRTb3VuZClcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+UiiBbX3BsYXlDYXJkU291bmRdIOKaoO+4jyDlvILluLjlnLrmma/vvJrljovniYzkvYZjYW5fYmVhdD1mYWxzZeS4lOaXoOmfs+aViFwiKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHmo4Dmn6XniYzlnovmmK/lkKbmnInlr7nlupTnmoTpn7PmlYjmlofku7ZcbiAgICAgKiDwn5Sn44CQ5L+u5aSN44CR5aKe5Yqg5pu05aSa54mM5Z6L5pSv5oyB77yM56Gu5L+d6KaG55uW5pyN5Yqh56uv5omA5pyJ54mM5Z6L5ZCN56ewXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGhhbmRUeXBlIC0g54mM5Z6L5ZCN56ewXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHJhbmsgLSDkuLvniYzngrnmlbBcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0g5piv5ZCm5pyJ5a+55bqU6Z+z5pWI5paH5Lu2XG4gICAgICovXG4gICAgX2hhc1NwZWNpZmljQ2FyZFNvdW5kOiBmdW5jdGlvbihoYW5kVHlwZSwgcmFuaykge1xuICAgICAgICB2YXIgdHlwZSA9IChoYW5kVHlwZSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIHZhciBzb3VuZEluZGV4ID0gdGhpcy5fcmFua1RvU291bmRJbmRleChyYW5rKVxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8vIOWNleW8oO+8muaciTEtMTXnmoTpn7PmlYjmlofku7ZcbiAgICAgICAgLy8g5pyN5Yqh56uv5Y+R6YCBOiBcIuWNleW8oFwiXG4gICAgICAgIGlmICh0eXBlID09PSBcInNpbmdsZVwiIHx8IHR5cGUgPT09IFwic29sb1wiIHx8IHR5cGUuaW5kZXhPZihcIuWNleW8oFwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHZhciBoYXNTb3VuZCA9IHNvdW5kSW5kZXggPj0gMSAmJiBzb3VuZEluZGV4IDw9IDE1XG4gICAgICAgICAgICByZXR1cm4gaGFzU291bmRcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5a+55a2Q77ya5Y+q5pyJMS0xM+eahOmfs+aViOaWh+S7tu+8iOayoeacieWvueWtkDE0LzE177yM5Zug5Li65aSn546L5bCP546L5rKh5pyJ5a+55a2Q6Z+z5pWI77yJXG4gICAgICAgIC8vIOacjeWKoeerr+WPkemAgTogXCLlr7nlrZBcIlxuICAgICAgICBpZiAodHlwZSA9PT0gXCJwYWlyXCIgfHwgdHlwZSA9PT0gXCJkb3VibGVcIiB8fCB0eXBlLmluZGV4T2YoXCLlr7nlrZBcIikgIT09IC0xKSB7XG4gICAgICAgICAgICB2YXIgaGFzU291bmQgPSBzb3VuZEluZGV4ID49IDEgJiYgc291bmRJbmRleCA8PSAxM1xuICAgICAgICAgICAgcmV0dXJuIGhhc1NvdW5kXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOS4ieW8oO+8muWPquaciTEtMTPnmoTpn7PmlYjmlofku7ZcbiAgICAgICAgLy8g5pyN5Yqh56uv5Y+R6YCBOiBcIuS4ieW8oFwiXG4gICAgICAgIGlmICh0eXBlID09PSBcInRyaXBsZVwiIHx8IHR5cGUgPT09IFwidGhyZWVcIiB8fCB0eXBlID09PSBcInRyaW9cIiB8fCB0eXBlLmluZGV4T2YoXCLkuInlvKBcIikgIT09IC0xKSB7XG4gICAgICAgICAgICB2YXIgaGFzU291bmQgPSBzb3VuZEluZGV4ID49IDEgJiYgc291bmRJbmRleCA8PSAxM1xuICAgICAgICAgICAgcmV0dXJuIGhhc1NvdW5kXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOeJueauiueJjOWei+mDveacieWvueW6lOmfs+aViFxuICAgICAgICAvLyDmnI3liqHnq6/lj5HpgIE6IFwi6L+e5a+5XCIsIFwi6aG65a2QXCIsIFwi6aOe5py6XCIsIFwi6aOe5py65bim5Y2VXCIsIFwi6aOe5py65bim5a+5XCIsIFwi5LiJ5bim5LiAXCIsIFwi5LiJ5bim5LqMXCIsIFwi5Zub5bim5LqMXCIsIFwi5Zub5bim5Lik5a+5XCIsIFwi54K45by5XCIsIFwi546L54K4XCJcbiAgICAgICAgdmFyIHNwZWNpYWxUeXBlcyA9IFtcbiAgICAgICAgICAgIC8vIOiLseaWh+WQjeensFxuICAgICAgICAgICAgXCJsaWFuZHVpXCIsIFwic3RyYWlnaHRcIiwgXCJwbGFuZVwiLCBcImZlaWppXCIsXG4gICAgICAgICAgICBcInNhbmRhaXlpXCIsIFwic2FuZGFpZHVpXCIsIFwic2lkYWllclwiLCBcInNpZGFpbGlhbmdkdWlcIixcbiAgICAgICAgICAgIFwiYm9tYlwiLCBcInpoYWRhblwiLCBcInJvY2tldFwiLCBcIndhbmd6aGFcIixcbiAgICAgICAgICAgIC8vIOS4reaWh+WQjeensO+8iOacjeWKoeerr+WPkemAgeeahOWQjeensO+8iVxuICAgICAgICAgICAgXCLov57lr7lcIiwgXCLpobrlrZBcIiwgXCLpo57mnLpcIiwgXCLkuInluKbkuIBcIiwgXCLkuInluKbkuoxcIixcbiAgICAgICAgICAgIFwi5Zub5bim5LqMXCIsIFwi5Zub5bim5Lik5a+5XCIsIFwi54K45by5XCIsIFwi546L54K4XCJcbiAgICAgICAgXVxuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzcGVjaWFsVHlwZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0eXBlLmluZGV4T2Yoc3BlY2lhbFR5cGVzW2ldKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaguOW/g+S/ruWkjeOAkeS7juaVsOaNruS4reaPkOWPluS4u+eJjOeCueaVsFxuICAgICAqIFxuICAgICAqIOS8mOWFiOe6p++8mlxuICAgICAqIDEuIOacjeWKoeerr+S8oOmAkueahCByYW5r77yI5aaC5p6c5pyJ5pWI77yJXG4gICAgICogMi4g5LuOIGNhcmRzIOaVsOe7hOS4reaPkOWPlu+8iOagueaNrueJjOWei++8iVxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0g5pyN5Yqh56uv5bm/5pKt55qE5pWw5o2uXG4gICAgICogQHJldHVybnMge051bWJlcn0g5Li754mM54K55pWw77yI5pyN5Yqh56uvIHJhbmsg5qC85byP77yaMy0xN++8iVxuICAgICAqL1xuICAgIF9leHRyYWN0TWFpblJhbms6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgLy8g5LyY5YWI5L2/55So5pyN5Yqh56uv5Lyg6YCS55qEIHJhbmtcbiAgICAgICAgaWYgKGRhdGEucmFuayAmJiBkYXRhLnJhbmsgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS5yYW5rXG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpoLmnpzmnI3liqHnq68gcmFuayDml6DmlYjvvIzku44gY2FyZHMg5Lit5o+Q5Y+WXG4gICAgICAgIHZhciBjYXJkcyA9IGRhdGEuY2FyZHMgfHwgW11cbiAgICAgICAgdmFyIGhhbmRUeXBlID0gKGRhdGEuaGFuZF90eXBlIHx8IFwiXCIpLnRvTG93ZXJDYXNlKClcblxuICAgICAgICBpZiAoY2FyZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn5SKIFtfZXh0cmFjdE1haW5SYW5rXSBjYXJkc+aVsOe7hOS4uuepuu+8jOaXoOazleaPkOWPlnJhbmtcIilcbiAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgIH1cblxuICAgICAgICAvLyDlr7kgY2FyZHMg6L+b6KGM5o6S5bqP77yI5LuO5aSn5Yiw5bCP77yJXG4gICAgICAgIHZhciBzb3J0ZWRDYXJkcyA9IGNhcmRzLnNsaWNlKCkuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gKGIucmFuayB8fCAwKSAtIChhLnJhbmsgfHwgMClcbiAgICAgICAgfSlcblxuXG4gICAgICAgIC8vIOagueaNrueJjOWei+aPkOWPluS4u+eJjFxuICAgICAgICAvLyDljZXlvKBcbiAgICAgICAgaWYgKGhhbmRUeXBlLmluZGV4T2YoXCJzaW5nbGVcIikgIT09IC0xIHx8IGhhbmRUeXBlLmluZGV4T2YoXCLljZXlvKBcIikgIT09IC0xKSB7XG4gICAgICAgICAgICB2YXIgcmFuayA9IHRoaXMuX2V4dHJhY3RDYXJkUmFuayhzb3J0ZWRDYXJkc1swXSlcbiAgICAgICAgICAgIHJldHVybiByYW5rXG4gICAgICAgIH1cblxuICAgICAgICAvLyDlr7nlrZAgLSDlj5bku7vmhI/kuIDlvKDnmoRyYW5r77yI5a6D5Lus55u45ZCM77yJXG4gICAgICAgIGlmIChoYW5kVHlwZS5pbmRleE9mKFwicGFpclwiKSAhPT0gLTEgfHwgaGFuZFR5cGUuaW5kZXhPZihcIuWvueWtkFwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gdGhpcy5fZXh0cmFjdENhcmRSYW5rKHNvcnRlZENhcmRzWzBdKVxuICAgICAgICAgICAgcmV0dXJuIHJhbmtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS4ieW8oCAtIOWPluS4ieW8oOS4reS7u+aEj+S4gOW8oOeahHJhbmtcbiAgICAgICAgaWYgKGhhbmRUeXBlLmluZGV4T2YoXCJ0cmlwbGVcIikgIT09IC0xIHx8IGhhbmRUeXBlLmluZGV4T2YoXCLkuInlvKBcIikgIT09IC0xIHx8IFxuICAgICAgICAgICAgaGFuZFR5cGUuaW5kZXhPZihcInRyaW9cIikgIT09IC0xIHx8IGhhbmRUeXBlLmluZGV4T2YoXCJ0aHJlZVwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gdGhpcy5fZXh0cmFjdENhcmRSYW5rKHNvcnRlZENhcmRzWzBdKVxuICAgICAgICAgICAgcmV0dXJuIHJhbmtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS4ieW4puS4gC/kuInluKbkuowgLSDlj5bmnIDlpKfnmoTkuInlvKBcbiAgICAgICAgaWYgKGhhbmRUeXBlLmluZGV4T2YoXCJzYW5kYWl5aVwiKSAhPT0gLTEgfHwgaGFuZFR5cGUuaW5kZXhPZihcIuS4ieW4puS4gFwiKSAhPT0gLTEgfHxcbiAgICAgICAgICAgIGhhbmRUeXBlLmluZGV4T2YoXCJzYW5kYWlkdWlcIikgIT09IC0xIHx8IGhhbmRUeXBlLmluZGV4T2YoXCLkuInluKbkuoxcIikgIT09IC0xKSB7XG4gICAgICAgICAgICAvLyDnu5/orqHmr4/kuKpyYW5r5Ye6546w55qE5qyh5pWwXG4gICAgICAgICAgICB2YXIgY291bnRzID0ge31cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FyZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgciA9IGNhcmRzW2ldLnJhbmtcbiAgICAgICAgICAgICAgICBjb3VudHNbcl0gPSAoY291bnRzW3JdIHx8IDApICsgMVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5om+5Yiw5Ye6546w5qyh5pWw5pyA5aSa55qEcmFua1xuICAgICAgICAgICAgdmFyIG1heENvdW50ID0gMFxuICAgICAgICAgICAgdmFyIG1haW5SYW5rID0gMFxuICAgICAgICAgICAgZm9yICh2YXIgciBpbiBjb3VudHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoY291bnRzW3JdID49IDMgJiYgY291bnRzW3JdID4gbWF4Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF4Q291bnQgPSBjb3VudHNbcl1cbiAgICAgICAgICAgICAgICAgICAgbWFpblJhbmsgPSBwYXJzZUludChyKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtYWluUmFua1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5YW25LuW54mM5Z6LIC0g5Y+W5pyA5aSn55qE54mMXG4gICAgICAgIHZhciByYW5rID0gdGhpcy5fZXh0cmFjdENhcmRSYW5rKHNvcnRlZENhcmRzWzBdKVxuICAgICAgICByZXR1cm4gcmFua1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ6L6F5Yqp44CR5LuO5Y2V5LiqY2FyZOWvueixoeS4reaPkOWPlnJhbmtcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2FyZCAtIOWNoeeJjOWvueixoVxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9IHJhbmvlgLxcbiAgICAgKi9cbiAgICBfZXh0cmFjdENhcmRSYW5rOiBmdW5jdGlvbihjYXJkKSB7XG4gICAgICAgIGlmICghY2FyZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+UiiBbX2V4dHJhY3RDYXJkUmFua10gY2FyZOS4uuepulwiKVxuICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWwneivleWQhOenjeWPr+iDveeahOWtl+autVxuICAgICAgICBpZiAoY2FyZC5yYW5rICE9PSB1bmRlZmluZWQgJiYgY2FyZC5yYW5rID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIE51bWJlcihjYXJkLnJhbmspXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNhcmQudmFsdWUgIT09IHVuZGVmaW5lZCAmJiBjYXJkLnZhbHVlID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIE51bWJlcihjYXJkLnZhbHVlKVxuICAgICAgICB9XG4gICAgICAgIGlmIChjYXJkLmxvZ2ljX3ZhbHVlICE9PSB1bmRlZmluZWQgJiYgY2FyZC5sb2dpY192YWx1ZSA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBOdW1iZXIoY2FyZC5sb2dpY192YWx1ZSlcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FyZC5jYXJkX2RhdGEgJiYgY2FyZC5jYXJkX2RhdGEucmFuayAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyKGNhcmQuY2FyZF9kYXRhLnJhbmspXG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLndhcm4oXCLwn5SKIFtfZXh0cmFjdENhcmRSYW5rXSDml6Dms5Xmj5Dlj5ZyYW5r77yMY2FyZDpcIiwgSlNPTi5zdHJpbmdpZnkoY2FyZCkpXG4gICAgICAgIHJldHVybiAwXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmoLjlv4Pkv67lpI3jgJHmnI3liqHnq68gcmFuayDovazmjaLkuLrpn7PmlYjmlofku7bnvJblj7dcbiAgICAgKiBcbiAgICAgKiDmnI3liqHnq68gcmFuayDlrprkuYnvvJpcbiAgICAgKiAtIDMtMTAgPSAzLTEwXG4gICAgICogLSBKPTExLCBRPTEyLCBLPTEzLCBBPTE0LCAyPTE1XG4gICAgICogLSDlsI/njos9MTYsIOWkp+eOiz0xN1xuICAgICAqIFxuICAgICAqIOmfs+aViOaWh+S7tue8luWPt++8mlxuICAgICAqIC0gMSA9IEFcbiAgICAgKiAtIDIgPSAyXG4gICAgICogLSAzLTEzID0gMy1LXG4gICAgICogLSAxNCA9IOWwj+eOi1xuICAgICAqIC0gMTUgPSDlpKfnjotcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gcmFuayAtIOacjeWKoeerr+eJjOmdouWAvCAoMy0xNylcbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfSDpn7PmlYjmlofku7bnvJblj7cgKDEtMTUp77yM5aaC5p6c5peg5rOV6L2s5o2i6L+U5ZueIDBcbiAgICAgKi9cbiAgICBfcmFua1RvU291bmRJbmRleDogZnVuY3Rpb24ocmFuaykge1xuICAgICAgICBpZiAocmFuayA9PT0gMTQpIHJldHVybiAxICAgLy8gQSDihpIgMVxuICAgICAgICBpZiAocmFuayA9PT0gMTUpIHJldHVybiAyICAgLy8gMiDihpIgMlxuICAgICAgICBpZiAocmFuayA+PSAzICYmIHJhbmsgPD0gMTMpIHJldHVybiByYW5rICAvLyAzLUsg55u05o6l5L2/55SoXG4gICAgICAgIGlmIChyYW5rID09PSAxNikgcmV0dXJuIDE0ICAvLyDlsI/njosg4oaSIDE0XG4gICAgICAgIGlmIChyYW5rID09PSAxNykgcmV0dXJuIDE1ICAvLyDlpKfnjosg4oaSIDE1XG4gICAgICAgIHJldHVybiAwICAvLyDml6DmlYhcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+UiiDmoLnmja7niYzlnovojrflj5bpn7PmlYjlkI3np7BcbiAgICAgKiDwn5Sn44CQ5L+u5aSN44CR5L2/55SoIGluZGV4T2Yg5Yy56YWN5Lit5paH54mM5Z6L5ZCN56ew77yM56Gu5L+d5YW85a655pyN5Yqh56uv5Y+R6YCB55qE5Lit5paH5ZCN56ewXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGhhbmRUeXBlIC0g54mM5Z6L5ZCN56ewXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHJhbmsgLSDkuLvniYzngrnmlbAgKOacjeWKoeerr+WumuS5iTogMy0xNywgQT0xNCwgMj0xNSwg5bCP546LPTE2LCDlpKfnjos9MTcpXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGdlbmRlciAtIOaAp+WIq1xuICAgICAqIEByZXR1cm5zIHtTdHJpbmd9IOmfs+aViOWQjeensO+8iOS4jeWQq+i3r+W+hOWSjOaJqeWxleWQje+8ie+8jOWmguaenOayoeacieWvueW6lOmfs+aViOi/lOWbnm51bGxcbiAgICAgKi9cbiAgICBfZ2V0Q2FyZFR5cGVTb3VuZDogZnVuY3Rpb24oaGFuZFR5cGUsIHJhbmssIGdlbmRlcikge1xuICAgICAgICB2YXIgdHlwZSA9IChoYW5kVHlwZSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIHZhciBwcmVmaXggPSBnZW5kZXIgPT09IFwiZmVtYWxlXCIgPyBcIm1fY3BfbnZfXCIgOiBcIm1fY3BfXCJcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlkIjms5XmgKfmoKHpqozjgJHmo4Dmn6VyYW5r5piv5ZCm5pyJ5pWIXG4gICAgICAgIGlmICghcmFuayB8fCByYW5rID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+UiiBbX2dldENhcmRUeXBlU291bmRdIOmdnuazlXJhbms6IFwiICsgcmFuayArIFwiLCBoYW5kVHlwZT1cIiArIGhhbmRUeXBlKVxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeWwhuacjeWKoeerryByYW5rIOi9rOaNouS4uumfs+aViOaWh+S7tue8luWPt1xuICAgICAgICB2YXIgc291bmRJbmRleCA9IHRoaXMuX3JhbmtUb1NvdW5kSW5kZXgocmFuaylcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyDljZXlvKDvvIjmlK/mjIHkuK3oi7HmlofvvIlcbiAgICAgICAgLy8g5pyN5Yqh56uv5Y+R6YCBOiBcIuWNleW8oFwiXG4gICAgICAgIC8vIOmfs+aViOaWh+S7tue8luWPt++8mjE9QSwgMj0yLCAzLTEzPTMtSywgMTQ95bCP546LLCAxNT3lpKfnjotcbiAgICAgICAgaWYgKHR5cGUgPT09IFwic2luZ2xlXCIgfHwgdHlwZSA9PT0gXCJzb2xvXCIgfHwgdHlwZS5pbmRleE9mKFwi5Y2V5bygXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgaWYgKHNvdW5kSW5kZXggPj0gMSAmJiBzb3VuZEluZGV4IDw9IDE1KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZWZpeCArIFwiZGFuemhhbmdfXCIgKyBzb3VuZEluZGV4XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn5SKIFtfZ2V0Q2FyZFR5cGVTb3VuZF0g5Y2V5byg6Z+z5pWI57Si5byV5peg5pWIOiByYW5rPVwiICsgcmFuayArIFwiLCBzb3VuZEluZGV4PVwiICsgc291bmRJbmRleClcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWvueWtkO+8iOaUr+aMgeS4reiLseaWh++8iVxuICAgICAgICAvLyDmnI3liqHnq6/lj5HpgIE6IFwi5a+55a2QXCJcbiAgICAgICAgLy8g6Z+z5pWI5paH5Lu257yW5Y+377yaMT1BLCAyPTIsIDMtMTM9My1L77yI5rOo5oSP77ya5paH5Lu25Y+q5pyJMS0xM++8jOayoeaciTE0LzE177yJXG4gICAgICAgIGlmICh0eXBlID09PSBcInBhaXJcIiB8fCB0eXBlID09PSBcImRvdWJsZVwiIHx8IHR5cGUuaW5kZXhPZihcIuWvueWtkFwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChzb3VuZEluZGV4ID49IDEgJiYgc291bmRJbmRleCA8PSAxMykge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmVmaXggKyBcImR1aXppX1wiICsgc291bmRJbmRleFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+UiiBbX2dldENhcmRUeXBlU291bmRdIOWvueWtkOmfs+aViOaWh+S7tuS4jeWtmOWcqDogcmFuaz1cIiArIHJhbmsgKyBcIiwgc291bmRJbmRleD1cIiArIHNvdW5kSW5kZXgpXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDkuInlvKDvvIjmlK/mjIHkuK3oi7HmlofvvIlcbiAgICAgICAgLy8g5pyN5Yqh56uv5Y+R6YCBOiBcIuS4ieW8oFwiXG4gICAgICAgIC8vIOmfs+aViOaWh+S7tue8luWPt++8mjE9QSwgMj0yLCAzLTEzPTMtS++8iOazqOaEj++8muaWh+S7tuWPquaciTEtMTPvvIlcbiAgICAgICAgaWYgKHR5cGUgPT09IFwidHJpcGxlXCIgfHwgdHlwZSA9PT0gXCJ0aHJlZVwiIHx8IHR5cGUgPT09IFwidHJpb1wiIHx8IHR5cGUuaW5kZXhPZihcIuS4ieW8oFwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChzb3VuZEluZGV4ID49IDEgJiYgc291bmRJbmRleCA8PSAxMykge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmVmaXggKyBcInNhbmdlX1wiICsgc291bmRJbmRleFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+UiiBbX2dldENhcmRUeXBlU291bmRdIOS4ieW8oOmfs+aViOaWh+S7tuS4jeWtmOWcqDogcmFuaz1cIiArIHJhbmsgKyBcIiwgc291bmRJbmRleD1cIiArIHNvdW5kSW5kZXgpXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR54m55q6K54mM5Z6L5pig5bCE6KGo77yI5pSv5oyB5Lit6Iux5paH77yJXG4gICAgICAgIHZhciBzcGVjaWFsVHlwZXMgPSB7XG4gICAgICAgICAgICAvLyDoi7HmloflkI3np7BcbiAgICAgICAgICAgIFwibGlhbmR1aVwiOiBcImxpYW5kdWlcIiwgICAgICAgICAgIC8vIOi/nuWvuVxuICAgICAgICAgICAgXCJzdHJhaWdodFwiOiBcInNodW56aVwiLCAgICAgICAgICAgLy8g6aG65a2QXG4gICAgICAgICAgICBcInBsYW5lXCI6IFwiZmVpamlcIiwgICAgICAgICAgICAgICAvLyDpo57mnLpcbiAgICAgICAgICAgIFwiZmVpamlcIjogXCJmZWlqaVwiLCAgICAgICAgICAgICAgIC8vIOmjnuaculxuICAgICAgICAgICAgXCJzYW5kYWl5aVwiOiBcInNhbmRhaXlpXCIsICAgICAgICAgLy8g5LiJ5bim5LiAXG4gICAgICAgICAgICBcInNhbmRhaWR1aVwiOiBcInNhbmRhaWR1aVwiLCAgICAgICAvLyDkuInluKblr7lcbiAgICAgICAgICAgIFwic2lkYWllclwiOiBcInNpZGFpZXJcIiwgICAgICAgICAgIC8vIOWbm+W4puS6jFxuICAgICAgICAgICAgXCJzaWRhaWxpYW5nZHVpXCI6IFwic2lkYWlsaWFuZ2R1aVwiLCAvLyDlm5vluKbkuKTlr7lcbiAgICAgICAgICAgIFwiYm9tYlwiOiBcInpoYWRhblwiLCAgICAgICAgICAgICAgIC8vIOeCuOW8uVxuICAgICAgICAgICAgXCJ6aGFkYW5cIjogXCJ6aGFkYW5cIiwgICAgICAgICAgICAgLy8g54K45by5XG4gICAgICAgICAgICBcInJvY2tldFwiOiBcIndhbmd6aGFcIiwgICAgICAgICAgICAvLyDnjovngrhcbiAgICAgICAgICAgIFwid2FuZ3poYVwiOiBcIndhbmd6aGFcIiwgICAgICAgICAgIC8vIOeOi+eCuFxuICAgICAgICAgICAgLy8g5Lit5paH5ZCN56ew77yI5pyN5Yqh56uv5Y+R6YCB55qE5ZCN56ew77yJXG4gICAgICAgICAgICBcIui/nuWvuVwiOiBcImxpYW5kdWlcIixcbiAgICAgICAgICAgIFwi6aG65a2QXCI6IFwic2h1bnppXCIsXG4gICAgICAgICAgICBcIumjnuaculwiOiBcImZlaWppXCIsXG4gICAgICAgICAgICBcIumjnuacuuW4puWNlVwiOiBcImZlaWppXCIsXG4gICAgICAgICAgICBcIumjnuacuuW4puWvuVwiOiBcImZlaWppXCIsXG4gICAgICAgICAgICBcIuS4ieW4puS4gFwiOiBcInNhbmRhaXlpXCIsXG4gICAgICAgICAgICBcIuS4ieW4puS6jFwiOiBcInNhbmRhaWR1aVwiLFxuICAgICAgICAgICAgXCLlm5vluKbkuoxcIjogXCJzaWRhaWVyXCIsXG4gICAgICAgICAgICBcIuWbm+W4puS4pOWvuVwiOiBcInNpZGFpbGlhbmdkdWlcIixcbiAgICAgICAgICAgIFwi54K45by5XCI6IFwiemhhZGFuXCIsXG4gICAgICAgICAgICBcIueOi+eCuFwiOiBcIndhbmd6aGFcIlxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmn6Xmib7nibnmrorniYzlnotcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHNwZWNpYWxUeXBlcykge1xuICAgICAgICAgICAgaWYgKHR5cGUuaW5kZXhPZihrZXkpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHZhciBzdWZmaXggPSBzcGVjaWFsVHlwZXNba2V5XVxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlpbPniYjngrjlvLnkvb/nlKggbV9jcF9udl96aGFkYW7vvIjlpoLmnpzlrZjlnKjvvInvvIzlkKbliJnkvb/nlKjnlLfniYhcbiAgICAgICAgICAgICAgICAvLyDms6jmhI/vvJrnm67liY0gbV9jcF9udl96aGFkYW4ubXAzIOS4jeWtmOWcqO+8jOaJgOS7peWls+eJiOS5n+S9v+eUqOeUt+eJiOeCuOW8uemfs+aViFxuICAgICAgICAgICAgICAgIGlmIChzdWZmaXggPT09IFwiemhhZGFuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5YWI5bCd6K+V5aWz54mI54K45by56Z+z5pWIXG4gICAgICAgICAgICAgICAgICAgIGlmIChnZW5kZXIgPT09IFwiZmVtYWxlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcIm1fY3BfemhhZGFuXCIgIC8vIOWls+eJiOaaguaXtuS9v+eUqOeUt+eJiOeCuOW8uemfs+aViO+8iOWboOS4um1fY3BfbnZfemhhZGFu5LiN5a2Y5Zyo77yJXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibV9jcF96aGFkYW5cIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5aWz54mI546L54K45pyJ5Y2V54us6Z+z5pWIXG4gICAgICAgICAgICAgICAgaWYgKHN1ZmZpeCA9PT0gXCJ3YW5nemhhXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByZWZpeCArIFwid2FuZ3poYVwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwcmVmaXggKyBzdWZmaXhcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pyq55+l54mM5Z6L77yM6L+U5ZuebnVsbFxuICAgICAgICBjb25zb2xlLndhcm4oXCLwn5SKIFtfZ2V0Q2FyZFR5cGVTb3VuZF0g5pyq55+l54mM5Z6LOiBcIiArIHR5cGUpXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflIog5pKt5pS+5LiN5Ye66Z+z5pWI77yI6ZqP5py65pKt5pS+XCLkuI3opoFcIi9cIuimgeS4jei1t1wi77yJXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSDmnI3liqHnq6/lub/mkq3nmoTmlbDmja5cbiAgICAgKiAgIC0gZ2VuZGVyOiBcIm1hbGVcIiAvIFwiZmVtYWxlXCJcbiAgICAgKi9cbiAgICBfcGxheVBhc3NTb3VuZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZiAoIWlzb3Blbl9zb3VuZCkgcmV0dXJuXG5cbiAgICAgICAgdmFyIGdlbmRlciA9IGRhdGEuZ2VuZGVyIHx8IFwibWFsZVwiXG4gICAgICAgIFxuICAgICAgICAvLyDnlLfniYjvvJrpmo/mnLrmkq3mlL5cIuS4jeimgVwi5oiWXCLopoHkuI3otbdcIlxuICAgICAgICAvLyDmlofku7bvvJptX2NwX2J1eWFvLm1wMywgbV9jcF95YW9idXFpLm1wM1xuICAgICAgICAvLyDlpbPniYjvvJrpmo/mnLrmkq3mlL5cIuS4jeimgVwi5oiWXCLopoHkuI3otbdcIlxuICAgICAgICAvLyDmlofku7bvvJptX2NwX252X2J1eWFvLm1wMywgbV9udl95YW9idXFpLndhdlxuICAgICAgICBcbiAgICAgICAgdmFyIHNvdW5kc1xuICAgICAgICBpZiAoZ2VuZGVyID09PSBcImZlbWFsZVwiKSB7XG4gICAgICAgICAgICBzb3VuZHMgPSBbXCJtX2NwX252X2J1eWFvXCIsIFwibV9udl95YW9idXFpXCJdXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzb3VuZHMgPSBbXCJtX2NwX2J1eWFvXCIsIFwibV9jcF95YW9idXFpXCJdXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmaj+acuumAieaLqeS4gOS4qlxuICAgICAgICB2YXIgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzb3VuZHMubGVuZ3RoKVxuICAgICAgICB2YXIgc291bmROYW1lID0gc291bmRzW3JhbmRvbUluZGV4XVxuXG4gICAgICAgIHRoaXMuX3BsYXlTb3VuZEVmZmVjdChzb3VuZE5hbWUpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflIog5pKt5pS+6IOc5YipL+Wksei0pemfs+aViFxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNXaW4gLSDmmK/lkKbog5zliKlcbiAgICAgKi9cbiAgICBfcGxheUdhbWVSZXN1bHRTb3VuZDogZnVuY3Rpb24oaXNXaW4pIHtcbiAgICAgICAgaWYgKCFpc29wZW5fc291bmQpIHJldHVyblxuXG4gICAgICAgIHZhciBzb3VuZE5hbWUgPSBpc1dpbiA/IFwibV95aW5nbGVcIiA6IFwibV9zaHVsZVwiXG4gICAgICAgIHRoaXMuX3BsYXlTb3VuZEVmZmVjdChzb3VuZE5hbWUpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflIog5pi+56S65LiN5Ye65pWI5p6cXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGFjY291bnRpZCAtIOeOqeWutklEXG4gICAgICovXG4gICAgX3Nob3dQYXNzRWZmZWN0OiBmdW5jdGlvbihhY2NvdW50aWQpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPluWvueW6lOeOqeWutueahOWHuueJjOWMuuWfn1xuICAgICAgICB2YXIgZ2FtZVNjZW5lX3NjcmlwdCA9IHRoaXMubm9kZS5wYXJlbnQuZ2V0Q29tcG9uZW50KFwiZ2FtZVNjZW5lXCIpXG4gICAgICAgIGlmICghZ2FtZVNjZW5lX3NjcmlwdCkgcmV0dXJuXG5cbiAgICAgICAgdmFyIG91dENhcmRfbm9kZSA9IGdhbWVTY2VuZV9zY3JpcHQuZ2V0VXNlck91dENhcmRQb3NCeUFjY291bnQoYWNjb3VudGlkKVxuICAgICAgICBpZiAoIW91dENhcmRfbm9kZSkgcmV0dXJuXG5cbiAgICAgICAgLy8g5riF56m65Ye654mM5Yy65Z+fXG4gICAgICAgIG91dENhcmRfbm9kZS5yZW1vdmVBbGxDaGlsZHJlbih0cnVlKVxuXG4gICAgICAgIC8vIOWIm+W7ulwi5LiN5Ye6XCLmloflrZfmmL7npLpcbiAgICAgICAgdmFyIHBhc3NOb2RlID0gbmV3IGNjLk5vZGUoXCJwYXNzX2xhYmVsXCIpXG4gICAgICAgIHZhciBsYWJlbCA9IHBhc3NOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgbGFiZWwuc3RyaW5nID0gXCLkuI3lh7pcIlxuICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDI4XG4gICAgICAgIGxhYmVsLmxpbmVIZWlnaHQgPSAzNlxuICAgICAgICBwYXNzTm9kZS5jb2xvciA9IGNjLmNvbG9yKDI1NSwgMjAwLCAxMDApXG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDmj4/ovrlcbiAgICAgICAgdmFyIG91dGxpbmUgPSBwYXNzTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKVxuICAgICAgICBvdXRsaW5lLmNvbG9yID0gY2MuY29sb3IoMTAwLCA1MCwgMClcbiAgICAgICAgb3V0bGluZS53aWR0aCA9IDJcbiAgICAgICAgXG4gICAgICAgIHBhc3NOb2RlLnBhcmVudCA9IG91dENhcmRfbm9kZVxuICAgICAgICBwYXNzTm9kZS5zZXRQb3NpdGlvbigwLCAwKVxuXG4gICAgICAgIC8vIDLnp5LlkI7oh6rliqjmtojlpLFcbiAgICAgICAgdGhpcy5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAocGFzc05vZGUgJiYgcGFzc05vZGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgIHBhc3NOb2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCAyKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR6I635Y+W54mM55qE5pi+56S65ZCN56ewXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNhcmQgLSDniYzmlbDmja4ge3N1aXQsIHJhbmt9XG4gICAgICogQHJldHVybnMge1N0cmluZ30g54mM55qE5Lit5paH5ZCN56ew77yM5aaCIFwi5aSn546LXCLjgIFcIuWwj+eOi1wi44CBXCLpu5HmoYNBXCIg562JXG4gICAgICovXG4gICAgX2dldENhcmREaXNwbGF5TmFtZTogZnVuY3Rpb24oY2FyZCkge1xuICAgICAgICBpZiAoIWNhcmQpIHJldHVybiBcIuacquefpeeJjFwiXG4gICAgICAgIFxuICAgICAgICB2YXIgc3VpdCA9IGNhcmQuc3VpdFxuICAgICAgICB2YXIgcmFuayA9IGNhcmQucmFua1xuICAgICAgICBcbiAgICAgICAgLy8g5aSn5bCP546LXG4gICAgICAgIGlmIChyYW5rID09PSAxNykgcmV0dXJuIFwi5aSn546LXCJcbiAgICAgICAgaWYgKHJhbmsgPT09IDE2KSByZXR1cm4gXCLlsI/njotcIlxuICAgICAgICBcbiAgICAgICAgLy8g6Iqx6Imy5ZCN56ewXG4gICAgICAgIHZhciBzdWl0TmFtZXMgPSB7IDA6IFwi6buR5qGDXCIsIDE6IFwi57qi5b+DXCIsIDI6IFwi5qKF6IqxXCIsIDM6IFwi5pa55Z2XXCIsIDQ6IFwiXCIgfVxuICAgICAgICB2YXIgc3VpdE5hbWUgPSBzdWl0TmFtZXNbc3VpdF0gfHwgXCJcIlxuICAgICAgICBcbiAgICAgICAgLy8g54mM6Z2i5ZCN56ewXG4gICAgICAgIHZhciByYW5rTmFtZXMgPSB7XG4gICAgICAgICAgICAzOiBcIjNcIiwgNDogXCI0XCIsIDU6IFwiNVwiLCA2OiBcIjZcIiwgNzogXCI3XCIsIDg6IFwiOFwiLCA5OiBcIjlcIixcbiAgICAgICAgICAgIDEwOiBcIjEwXCIsIDExOiBcIkpcIiwgMTI6IFwiUVwiLCAxMzogXCJLXCIsIDE0OiBcIkFcIiwgMTU6IFwiMlwiXG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJhbmtOYW1lID0gcmFua05hbWVzW3JhbmtdIHx8IFN0cmluZyhyYW5rKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHN1aXROYW1lICsgcmFua05hbWVcbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g8J+Up+OAkOaWsOWinuOAkeWuouaIt+err+eJjOWei+mqjOivgVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkemqjOivgeeJjOWei+aYr+WQpuacieaViFxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGNhcmRzIC0g6KaB6aqM6K+B55qE54mM5pWw5o2uIFt7c3VpdCwgcmFuaywgY29sb3J9LCAuLi5dXG4gICAgICogQHJldHVybnMge09iamVjdH0ge3ZhbGlkOiBib29sZWFuLCB0eXBlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZ31cbiAgICAgKi9cbiAgICBfdmFsaWRhdGVIYW5kVHlwZTogZnVuY3Rpb24oY2FyZHMpIHtcbiAgICAgICAgaWYgKCFjYXJkcyB8fCBjYXJkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiBmYWxzZSwgdHlwZTogXCJcIiwgbWVzc2FnZTogXCLor7fpgInmi6nopoHlh7rnmoTniYxcIiB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY291bnQgPSBjYXJkcy5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIC8vIOe7n+iuoeWQhOeCueaVsOeahOeJjOaVsOmHj1xuICAgICAgICB2YXIgcmFua0NvdW50cyA9IHt9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FyZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gY2FyZHNbaV0ucmFua1xuICAgICAgICAgICAgaWYgKCFyYW5rQ291bnRzW3JhbmtdKSB7XG4gICAgICAgICAgICAgICAgcmFua0NvdW50c1tyYW5rXSA9IDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJhbmtDb3VudHNbcmFua10rK1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6I635Y+W54K55pWw5YiX6KGo77yI5o6S5bqP5ZCO77yJXG4gICAgICAgIHZhciByYW5rcyA9IE9iamVjdC5rZXlzKHJhbmtDb3VudHMpLm1hcChmdW5jdGlvbihyKSB7IHJldHVybiBwYXJzZUludChyKSB9KS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgLSBiIH0pXG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5bmlbDph4/nu5/orqFcbiAgICAgICAgdmFyIGNvdW50cyA9IE9iamVjdC52YWx1ZXMocmFua0NvdW50cylcbiAgICAgICAgdmFyIGZvdXJzID0gW10gIC8vIOWbm+W8oFxuICAgICAgICB2YXIgdGhyZWVzID0gW10gLy8g5LiJ5bygXG4gICAgICAgIHZhciBwYWlycyA9IFtdICAvLyDlr7nlrZBcbiAgICAgICAgdmFyIHNpbmdsZXMgPSBbXSAvLyDljZXlvKBcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIHJhbmsgaW4gcmFua0NvdW50cykge1xuICAgICAgICAgICAgdmFyIGMgPSByYW5rQ291bnRzW3JhbmtdXG4gICAgICAgICAgICBpZiAoYyA9PT0gNCkgZm91cnMucHVzaChwYXJzZUludChyYW5rKSlcbiAgICAgICAgICAgIGVsc2UgaWYgKGMgPT09IDMpIHRocmVlcy5wdXNoKHBhcnNlSW50KHJhbmspKVxuICAgICAgICAgICAgZWxzZSBpZiAoYyA9PT0gMikgcGFpcnMucHVzaChwYXJzZUludChyYW5rKSlcbiAgICAgICAgICAgIGVsc2UgaWYgKGMgPT09IDEpIHNpbmdsZXMucHVzaChwYXJzZUludChyYW5rKSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDEuIOeOi+eCuO+8iOWPjOeOi++8iVxuICAgICAgICBpZiAoY291bnQgPT09IDIgJiYgcmFua0NvdW50c1sxNl0gPT09IDEgJiYgcmFua0NvdW50c1sxN10gPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCB0eXBlOiBcIueOi+eCuFwiLCBtZXNzYWdlOiBcIlwiIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDIuIOWNleW8oFxuICAgICAgICBpZiAoY291bnQgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCB0eXBlOiBcIuWNleW8oFwiLCBtZXNzYWdlOiBcIlwiIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDMuIOWvueWtkFxuICAgICAgICBpZiAoY291bnQgPT09IDIgJiYgcGFpcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgdHlwZTogXCLlr7nlrZBcIiwgbWVzc2FnZTogXCJcIiB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyA0LiDkuInlvKBcbiAgICAgICAgaWYgKGNvdW50ID09PSAzICYmIHRocmVlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCB0eXBlOiBcIuS4ieW8oFwiLCBtZXNzYWdlOiBcIlwiIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDUuIOeCuOW8uVxuICAgICAgICBpZiAoY291bnQgPT09IDQgJiYgZm91cnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgdHlwZTogXCLngrjlvLlcIiwgbWVzc2FnZTogXCJcIiB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyA2LiDkuInluKbkuIBcbiAgICAgICAgaWYgKGNvdW50ID09PSA0ICYmIHRocmVlcy5sZW5ndGggPT09IDEgJiYgc2luZ2xlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCB0eXBlOiBcIuS4ieW4puS4gFwiLCBtZXNzYWdlOiBcIlwiIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDcuIOS4ieW4puS6jFxuICAgICAgICBpZiAoY291bnQgPT09IDUgJiYgdGhyZWVzLmxlbmd0aCA9PT0gMSAmJiBwYWlycy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCB0eXBlOiBcIuS4ieW4puS6jFwiLCBtZXNzYWdlOiBcIlwiIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDguIOWbm+W4puS6jO+8iOWNle+8iVxuICAgICAgICBpZiAoY291bnQgPT09IDYgJiYgZm91cnMubGVuZ3RoID09PSAxICYmIChzaW5nbGVzLmxlbmd0aCA9PT0gMiB8fCBwYWlycy5sZW5ndGggPT09IDEpKSB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgdHlwZTogXCLlm5vluKbkuoxcIiwgbWVzc2FnZTogXCJcIiB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyA5LiDlm5vluKbkuKTlr7lcbiAgICAgICAgaWYgKGNvdW50ID09PSA4ICYmIGZvdXJzLmxlbmd0aCA9PT0gMSAmJiBwYWlycy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCB0eXBlOiBcIuWbm+W4puS4pOWvuVwiLCBtZXNzYWdlOiBcIlwiIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDEwLiDpobrlrZDvvIjoh7PlsJE15byg6L+e57ut77yM5LiN5YyF5ZCrMuWSjOeOi++8iVxuICAgICAgICBpZiAoY291bnQgPj0gNSAmJiBzaW5nbGVzLmxlbmd0aCA9PT0gY291bnQpIHtcbiAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpui/nue7reS4lOS4jeWMheWQqzLlkoznjotcbiAgICAgICAgICAgIHZhciBpc1NlcXVlbnRpYWwgPSB0aGlzLl9pc1NlcXVlbnRpYWwocmFua3MpXG4gICAgICAgICAgICB2YXIgbm9Ud29Pckpva2VyID0gcmFua3MuZXZlcnkoZnVuY3Rpb24ocikgeyByZXR1cm4gciA8IDE1IH0pIC8vIHJhbmsgPCAxNSDooajnpLrkuI3mmK8y5ZKM546LXG4gICAgICAgICAgICBpZiAoaXNTZXF1ZW50aWFsICYmIG5vVHdvT3JKb2tlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCB0eXBlOiBcIumhuuWtkFwiLCBtZXNzYWdlOiBcIlwiIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDExLiDov57lr7nvvIjoh7PlsJEz5a+56L+e57ut77yJXG4gICAgICAgIGlmIChjb3VudCA+PSA2ICYmIGNvdW50ICUgMiA9PT0gMCAmJiBwYWlycy5sZW5ndGggPT09IGNvdW50IC8gMikge1xuICAgICAgICAgICAgdmFyIHBhaXJSYW5rcyA9IHBhaXJzLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAtIGIgfSlcbiAgICAgICAgICAgIHZhciBpc1NlcXVlbnRpYWwgPSB0aGlzLl9pc1NlcXVlbnRpYWwocGFpclJhbmtzKVxuICAgICAgICAgICAgdmFyIG5vVHdvT3JKb2tlciA9IHBhaXJSYW5rcy5ldmVyeShmdW5jdGlvbihyKSB7IHJldHVybiByIDwgMTUgfSlcbiAgICAgICAgICAgIGlmIChpc1NlcXVlbnRpYWwgJiYgbm9Ud29Pckpva2VyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUsIHR5cGU6IFwi6L+e5a+5XCIsIG1lc3NhZ2U6IFwiXCIgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gMTIuIOmjnuacuu+8iOiHs+WwkTLkuKrov57nu63kuInlvKDvvIlcbiAgICAgICAgaWYgKHRocmVlcy5sZW5ndGggPj0gMikge1xuICAgICAgICAgICAgdmFyIHRocmVlUmFua3MgPSB0aHJlZXMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhIC0gYiB9KVxuICAgICAgICAgICAgdmFyIGlzU2VxdWVudGlhbCA9IHRoaXMuX2lzU2VxdWVudGlhbCh0aHJlZVJhbmtzKVxuICAgICAgICAgICAgdmFyIG5vVHdvT3JKb2tlciA9IHRocmVlUmFua3MuZXZlcnkoZnVuY3Rpb24ocikgeyByZXR1cm4gciA8IDE1IH0pXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChpc1NlcXVlbnRpYWwgJiYgbm9Ud29Pckpva2VyKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRocmVlQ291bnQgPSB0aHJlZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g6aOe5py65LiN5bim57+F6IaAXG4gICAgICAgICAgICAgICAgaWYgKGNvdW50ID09PSB0aHJlZUNvdW50ICogMykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgdHlwZTogXCLpo57mnLpcIiwgbWVzc2FnZTogXCJcIiB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOmjnuacuuW4puWNlVxuICAgICAgICAgICAgICAgIGlmIChjb3VudCA9PT0gdGhyZWVDb3VudCAqIDQgJiYgc2luZ2xlcy5sZW5ndGggPT09IHRocmVlQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUsIHR5cGU6IFwi6aOe5py65bim5Y2VXCIsIG1lc3NhZ2U6IFwiXCIgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDpo57mnLrluKblr7lcbiAgICAgICAgICAgICAgICBpZiAoY291bnQgPT09IHRocmVlQ291bnQgKiA1ICYmIHBhaXJzLmxlbmd0aCA9PT0gdGhyZWVDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgdHlwZTogXCLpo57mnLrluKblr7lcIiwgbWVzc2FnZTogXCJcIiB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5peg5pWI54mM5Z6LXG4gICAgICAgIHJldHVybiB7IHZhbGlkOiBmYWxzZSwgdHlwZTogXCJcIiwgbWVzc2FnZTogXCLml6DmlYjnmoTniYzlnovvvIzor7fph43mlrDpgInmi6lcIiB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOajgOafpeeCueaVsOaYr+WQpui/nue7rVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHJhbmtzIC0g5o6S5bqP5ZCO55qE54K55pWw5pWw57uEXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59IOaYr+WQpui/nue7rVxuICAgICAqL1xuICAgIF9pc1NlcXVlbnRpYWw6IGZ1bmN0aW9uKHJhbmtzKSB7XG4gICAgICAgIGlmICghcmFua3MgfHwgcmFua3MubGVuZ3RoIDwgMikgcmV0dXJuIHRydWVcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgcmFua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChyYW5rc1tpXSAtIHJhbmtzW2ktMV0gIT09IDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDwn5Sn44CQ5paw5aKe44CR57uT566X5by556qX57O757ufXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiDwn4+GIOaYvuekuua4uOaIj+e7k+eul+W8ueeql1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0g5pyN5Yqh56uv5bm/5pKt55qE57uT566X5pWw5o2uXG4gICAgICovXG4gICAgX3Nob3dHYW1lUmVzdWx0UG9wdXA6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyDjgJDnq57mioDlnLrjgJHmo4Dmn6XmmK/lkKbmmK/nq57mioDlnLrmqKHlvI9cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIGlmICh0aGlzLl9pc0NvbXBldGl0aW9uIHx8IGRhdGEucm9vbV9jYXRlZ29yeSA9PT0gMikge1xuICAgICAgICAgICAgLy8g56ue5oqA5Zy65qih5byP5L2/55So54m55q6K55qE57uT566X6aG1XG4gICAgICAgICAgICB0aGlzLl9zaG93Q29tcGV0aXRpb25SZXN1bHRQb3B1cChkYXRhKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWIpOaWreW9k+WJjeeOqeWutuaYr+WQpuiDnOWIqVxuICAgICAgICB2YXIgbXlQbGF5ZXJJZCA9IG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKCkuaWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5zZXJ2ZXJQbGF5ZXJJZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRFxuICAgICAgICB2YXIgaXNXaW5uZXIgPSBmYWxzZVxuICAgICAgICB2YXIgbXlXaW5Hb2xkID0gMFxuICAgICAgICBcbiAgICAgICAgLy8g5LuOIHBsYXllcnMg5pWw57uE5Lit5om+5Yiw5b2T5YmN546p5a6255qE57uT5p6cXG4gICAgICAgIGlmIChkYXRhLnBsYXllcnMgJiYgZGF0YS5wbGF5ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5wbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBsYXllciA9IGRhdGEucGxheWVyc1tpXVxuICAgICAgICAgICAgICAgIGlmIChTdHJpbmcocGxheWVyLnBsYXllcl9pZCkgPT09IFN0cmluZyhteVBsYXllcklkKSkge1xuICAgICAgICAgICAgICAgICAgICBpc1dpbm5lciA9IHBsYXllci5pc193aW5uZXJcbiAgICAgICAgICAgICAgICAgICAgbXlXaW5Hb2xkID0gcGxheWVyLndpbl9nb2xkXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5YW85a655pen54mI5pys77ya6YCa6L+HIHdpbm5lcl9pZCDliKTmlq1cbiAgICAgICAgICAgIGlzV2lubmVyID0gU3RyaW5nKGRhdGEud2lubmVyX2lkKSA9PT0gU3RyaW5nKG15UGxheWVySWQpXG4gICAgICAgICAgICBpZiAoIWlzV2lubmVyICYmICFkYXRhLmlzX2xhbmRsb3JkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlzTGFuZGxvcmQgPSBteWdsb2JhbC5wbGF5ZXJEYXRhLm1hc3Rlcl9hY2NvdW50aWQgPT09IG15UGxheWVySWRcbiAgICAgICAgICAgICAgICBpZiAoIWlzTGFuZGxvcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNXaW5uZXIgPSB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5pu05paw5pys5Zyw546p5a6255qE6YeR5biB5pWw6YePXG4gICAgICAgIGlmIChteWdsb2JhbC5wbGF5ZXJEYXRhICYmIG15V2luR29sZCAhPT0gMCkge1xuICAgICAgICAgICAgdmFyIG9sZEdvbGQgPSBteWdsb2JhbC5wbGF5ZXJEYXRhLmdvYmFsX2NvdW50IHx8IDBcbiAgICAgICAgICAgIHZhciBuZXdHb2xkID0gb2xkR29sZCArIG15V2luR29sZFxuICAgICAgICAgICAgLy8g56Gu5L+d6YeR5biB5LiN5Li66LSf5pWwXG4gICAgICAgICAgICBpZiAobmV3R29sZCA8IDApIHtcbiAgICAgICAgICAgICAgICBuZXdHb2xkID0gMFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YS5nb2JhbF9jb3VudCA9IG5ld0dvbGRcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeabtOaWsOaJgOacieeOqeWutueahOmHkeW4geaYvuekulxuICAgICAgICBpZiAoZGF0YS5wbGF5ZXJzICYmIGRhdGEucGxheWVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEucGxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXIgPSBkYXRhLnBsYXllcnNbaV1cbiAgICAgICAgICAgICAgICB2YXIgcGxheWVySWQgPSBwbGF5ZXIucGxheWVyX2lkXG4gICAgICAgICAgICAgICAgdmFyIGdvbGRBZnRlciA9IHBsYXllci5nb2xkX2FmdGVyXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeWPquimgSBnb2xkQWZ0ZXIgPj0gMCDlsLHmm7TmlrDmmL7npLrvvIjljIXmi6wgMCDnmoTmg4XlhrXvvIlcbiAgICAgICAgICAgICAgICAvLyDmnI3liqHnq6/ov5Tlm57nmoQgZ29sZF9hZnRlciA+PSAwIOihqOekuuafpeivouWIsOS6huacieaViOaVsOaNrlxuICAgICAgICAgICAgICAgIGlmIChnb2xkQWZ0ZXIgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVQbGF5ZXJHb2xkRGlzcGxheShwbGF5ZXJJZCwgZ29sZEFmdGVyKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWmguaenOacjeWKoeerr+ayoeaciei/lOWbnuacieaViOeahCBnb2xkX2FmdGVy77yM5YiZ5pys5Zyw6K6h566XXG4gICAgICAgICAgICAgICAgICAgIC8vIOi/meenjeaDheWGteS4i++8jOWPquabtOaWsOW9k+WJjeeOqeWutueahOmHkeW4gVxuICAgICAgICAgICAgICAgICAgICBpZiAoU3RyaW5nKHBsYXllcklkKSA9PT0gU3RyaW5nKG15UGxheWVySWQpICYmIG15V2luR29sZCAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxvY2FsR29sZCA9IG15Z2xvYmFsLnBsYXllckRhdGEuZ29iYWxfY291bnQgfHwgMFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlUGxheWVyR29sZERpc3BsYXkocGxheWVySWQsIGxvY2FsR29sZClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pKt5pS+57uT5p6c6Z+z5pWIXG4gICAgICAgIHRoaXMuX3BsYXlHYW1lUmVzdWx0U291bmQoaXNXaW5uZXIpXG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7rnu5PnrpflvLnnqpdcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHRoaXMuX2NyZWF0ZUdhbWVSZXN1bHRQb3B1cChkYXRhLCBpc1dpbm5lciwgbXlXaW5Hb2xkLCBmdW5jdGlvbihhY3Rpb24pIHtcbiAgICAgICAgICAgIGlmIChhY3Rpb24gPT09IFwiY29udGludWVcIikge1xuICAgICAgICAgICAgICAgIC8vIOe7p+e7rea4uOaIj++8muWPkemAgSByZWFkeSDor7fmsYJcbiAgICAgICAgICAgICAgICBzZWxmLl9jb250aW51ZUdhbWUoKVxuICAgICAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFwibG9iYnlcIikge1xuICAgICAgICAgICAgICAgIC8vIOi/lOWbnuWkp+WOhVxuICAgICAgICAgICAgICAgIHNlbGYuX3JldHVyblRvTG9iYnkoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn4+GIOWIm+W7uue7k+eul+W8ueeql1VJIC0g5qyi5LmQ5paX5Zyw5Li76auY57qn6aOO5qC8XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSDnu5PnrpfmlbDmja5cbiAgICAgKiBAcGFyYW0ge0Jvb2xlYW59IGlzV2lubmVyIC0g5piv5ZCm6IOc5YipXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IG15V2luR29sZCAtIOW9k+WJjeeOqeWutui+k+i1ouixhuWtkFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0g5Zue6LCD5Ye95pWwXG4gICAgICovXG4gICAgX2NyZWF0ZUdhbWVSZXN1bHRQb3B1cDogZnVuY3Rpb24oZGF0YSwgaXNXaW5uZXIsIG15V2luR29sZCwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHZhciB3aW5TaXplID0gY2Mud2luU2l6ZVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeaJvuWIsENhbnZhc+iKgueCueS9nOS4uuW8ueeql+eItuiKgueCuVxuICAgICAgICB2YXIgY2FudmFzID0gY2MuZmluZChcIkNhbnZhc1wiKSB8fCBjYy5maW5kKFwiVUlfUk9PVFwiKSB8fCB0aGlzLm5vZGUucGFyZW50XG4gICAgICAgIGlmICghY2FudmFzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+PhiBbX2NyZWF0ZUdhbWVSZXN1bHRQb3B1cF0g5om+5LiN5YiwQ2FudmFz6IqC54K5XCIpXG4gICAgICAgICAgICBjYW52YXMgPSB0aGlzLm5vZGVcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g6YGu572p5bGCID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBtYXNrTm9kZSA9IG5ldyBjYy5Ob2RlKClcbiAgICAgICAgbWFza05vZGUubmFtZSA9IFwiR2FtZVJlc3VsdE1hc2tcIlxuICAgICAgICBtYXNrTm9kZS5hZGRDb21wb25lbnQoY2MuQmxvY2tJbnB1dEV2ZW50cylcbiAgICAgICAgdmFyIG1hc2tTcHJpdGUgPSBtYXNrTm9kZS5hZGRDb21wb25lbnQoY2MuU3ByaXRlKVxuICAgICAgICBtYXNrU3ByaXRlLnNwcml0ZUZyYW1lID0gbmV3IGNjLlNwcml0ZUZyYW1lKClcbiAgICAgICAgbWFza1Nwcml0ZS50eXBlID0gY2MuU3ByaXRlLlR5cGUuU0lNUExFXG4gICAgICAgIG1hc2tTcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NXG4gICAgICAgIG1hc2tOb2RlLndpZHRoID0gd2luU2l6ZS53aWR0aCAqIDJcbiAgICAgICAgbWFza05vZGUuaGVpZ2h0ID0gd2luU2l6ZS5oZWlnaHQgKiAyXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkuI3pgJrov4djb2xvcuiuvue9rmFscGhh77yM5L2/55Sob3BhY2l0eeS7o+abv1xuICAgICAgICBtYXNrTm9kZS5jb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDAsIDAsIDMwKSA6IG5ldyBjYy5Db2xvcigzMCwgMCwgMClcbiAgICAgICAgbWFza05vZGUub3BhY2l0eSA9IDBcbiAgICAgICAgbWFza05vZGUueCA9IDBcbiAgICAgICAgbWFza05vZGUueSA9IDBcbiAgICAgICAgbWFza05vZGUuekluZGV4ID0gOTk5ICAvLyDwn5Sn44CQ5L+u5aSN44CR6YGu572p5bGCekluZGV4XG4gICAgICAgIG1hc2tOb2RlLnBhcmVudCA9IGNhbnZhc1xuICAgICAgICBcbiAgICAgICAgLy8g6YGu572p5reh5YWl5Yqo55S7XG4gICAgICAgIGNjLnR3ZWVuKG1hc2tOb2RlKS50bygwLjMsIHsgb3BhY2l0eTogMjU1IH0pLnN0YXJ0KClcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOW8ueeql+WuueWZqCA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgcG9wdXBOb2RlID0gbmV3IGNjLk5vZGUoKVxuICAgICAgICBwb3B1cE5vZGUubmFtZSA9IFwiR2FtZVJlc3VsdFBvcHVwXCJcbiAgICAgICAgcG9wdXBOb2RlLnggPSAwXG4gICAgICAgIHBvcHVwTm9kZS55ID0gMFxuICAgICAgICBwb3B1cE5vZGUuc2NhbGUgPSAwLjVcbiAgICAgICAgcG9wdXBOb2RlLm9wYWNpdHkgPSAwXG4gICAgICAgIHBvcHVwTm9kZS56SW5kZXggPSAxMDAwICAvLyDwn5Sn44CQ5L+u5aSN44CR5by556qX5bGCekluZGV4XG4gICAgICAgIHBvcHVwTm9kZS5wYXJlbnQgPSBjYW52YXNcbiAgICAgICAgXG4gICAgICAgIC8vIOW8ueeql+WwuuWvuO+8iDcwJeWuve+8jDc1JemrmO+8iVxuICAgICAgICB2YXIgcG9wdXBXaWR0aCA9IE1hdGgubWluKHdpblNpemUud2lkdGggKiAwLjcsIDgwMClcbiAgICAgICAgdmFyIHBvcHVwSGVpZ2h0ID0gTWF0aC5taW4od2luU2l6ZS5oZWlnaHQgKiAwLjc1LCA1NTApXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDkuLvog4zmma8gLSDmuJDlj5jmlYjmnpwgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdmFyIGJnTm9kZSA9IHNlbGYuX2NyZWF0ZUdyYWRpZW50QmFja2dyb3VuZChwb3B1cFdpZHRoLCBwb3B1cEhlaWdodCwgaXNXaW5uZXIpXG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOmHkei+ueaPj+i+uSA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgYm9yZGVyTm9kZSA9IHNlbGYuX2NyZWF0ZUdvbGRlbkJvcmRlcihwb3B1cFdpZHRoLCBwb3B1cEhlaWdodCwgaXNXaW5uZXIpXG4gICAgICAgIGJvcmRlck5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDnspLlrZDnibnmlYjlsYIgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdmFyIGVmZmVjdExheWVyID0gbmV3IGNjLk5vZGUoXCJFZmZlY3RMYXllclwiKVxuICAgICAgICBlZmZlY3RMYXllci5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOiDnOWIqeeykuWtkOeJueaViFxuICAgICAgICBpZiAoaXNXaW5uZXIpIHtcbiAgICAgICAgICAgIHNlbGYuX2NyZWF0ZVZpY3RvcnlQYXJ0aWNsZXMoZWZmZWN0TGF5ZXIsIHBvcHVwV2lkdGgsIHBvcHVwSGVpZ2h0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5fY3JlYXRlRGVmZWF0UGFydGljbGVzKGVmZmVjdExheWVyLCBwb3B1cFdpZHRoLCBwb3B1cEhlaWdodClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g6aG26YOoIEJhbm5lciA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgYmFubmVyWSA9IHBvcHVwSGVpZ2h0IC8gMiAtIDYwXG4gICAgICAgIHZhciBiYW5uZXJOb2RlID0gc2VsZi5fY3JlYXRlUmVzdWx0QmFubmVyKGlzV2lubmVyLCBwb3B1cFdpZHRoKVxuICAgICAgICBiYW5uZXJOb2RlLnkgPSBiYW5uZXJZXG4gICAgICAgIGJhbm5lck5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDlj7PkvqflgI3mlbDor6bmg4XljaEgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdmFyIGRldGFpbFggPSBwb3B1cFdpZHRoIC8gMiAtIDEzMFxuICAgICAgICB2YXIgZGV0YWlsWSA9IDIwXG4gICAgICAgIHZhciBkZXRhaWxOb2RlID0gc2VsZi5fY3JlYXRlTXVsdGlwbGllckRldGFpbENhcmQoZGF0YSwgaXNXaW5uZXIpXG4gICAgICAgIGRldGFpbE5vZGUueCA9IGRldGFpbFhcbiAgICAgICAgZGV0YWlsTm9kZS55ID0gZGV0YWlsWVxuICAgICAgICBkZXRhaWxOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5Lit6Ze0546p5a6257uT5p6c5YiX6KGoID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBsaXN0V2lkdGggPSBwb3B1cFdpZHRoICogMC41NVxuICAgICAgICB2YXIgbGlzdFggPSAtcG9wdXBXaWR0aCAvIDIgKyBsaXN0V2lkdGggLyAyICsgNTBcbiAgICAgICAgdmFyIGxpc3RZID0gLTIwXG4gICAgICAgIHZhciBwbGF5ZXJMaXN0Tm9kZSA9IHNlbGYuX2NyZWF0ZVBsYXllclJlc3VsdExpc3QoZGF0YSwgaXNXaW5uZXIsIG15V2luR29sZCwgbGlzdFdpZHRoKVxuICAgICAgICBwbGF5ZXJMaXN0Tm9kZS54ID0gbGlzdFhcbiAgICAgICAgcGxheWVyTGlzdE5vZGUueSA9IGxpc3RZXG4gICAgICAgIHBsYXllckxpc3ROb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5bqV6YOo5oyJ6ZKu5Yy65Z+fID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBidG5ZID0gLXBvcHVwSGVpZ2h0IC8gMiArIDYwXG4gICAgICAgIHZhciBidXR0b25BcmVhID0gc2VsZi5fY3JlYXRlQnV0dG9uQXJlYShpc1dpbm5lciwgZnVuY3Rpb24oYWN0aW9uKSB7XG4gICAgICAgICAgICBzZWxmLl9jbG9zZUdhbWVSZXN1bHRQb3B1cChwb3B1cE5vZGUsIG1hc2tOb2RlKVxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhhY3Rpb24pXG4gICAgICAgIH0pXG4gICAgICAgIGJ1dHRvbkFyZWEueSA9IGJ0bllcbiAgICAgICAgYnV0dG9uQXJlYS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOW8ueWHuuWKqOeUuyA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICBjYy50d2Vlbihwb3B1cE5vZGUpXG4gICAgICAgICAgICAudG8oMC4zNSwgeyBzY2FsZTogMSwgb3BhY2l0eTogMjU1IH0sIHsgZWFzaW5nOiAnYmFja091dCcgfSlcbiAgICAgICAgICAgIC5jYWxsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIOinpuWPkeaVsOWtl+a7muWKqOWKqOeUu1xuICAgICAgICAgICAgICAgIHNlbGYuX3N0YXJ0TnVtYmVyQW5pbWF0aW9ucyhwb3B1cE5vZGUsIGRhdGEsIG15V2luR29sZClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICBcbiAgICAgICAgLy8g5L+d5a2Y5byV55SoXG4gICAgICAgIHRoaXMuX2dhbWVSZXN1bHRQb3B1cCA9IHBvcHVwTm9kZVxuICAgICAgICB0aGlzLl9nYW1lUmVzdWx0TWFzayA9IG1hc2tOb2RlXG4gICAgICAgIHRoaXMuX3Jlc3VsdEVmZmVjdExheWVyID0gZWZmZWN0TGF5ZXJcbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g8J+OqCDnu5PnrpflvLnnqpfop4bop4nnu4Tku7YgLSDpq5jnuqfmlYjmnpxcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIPCfjqgg5Yib5bu65riQ5Y+Y6IOM5pmvXG4gICAgICovXG4gICAgX2NyZWF0ZUdyYWRpZW50QmFja2dyb3VuZDogZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgaXNXaW5uZXIpIHtcbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiR3JhZGllbnRCZ1wiKVxuICAgICAgICB2YXIgZ3JhcGhpY3MgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBcbiAgICAgICAgLy8g5riQ5Y+Y6ImyXG4gICAgICAgIHZhciB0b3BDb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDQwLCAzMCwgODAsIDI1NSkgOiBuZXcgY2MuQ29sb3IoMzAsIDMwLCA0MCwgMjU1KVxuICAgICAgICB2YXIgYm90dG9tQ29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcigyMCwgMTUsIDUwLCAyNTUpIDogbmV3IGNjLkNvbG9yKDIwLCAyMCwgMzAsIDI1NSlcbiAgICAgICAgXG4gICAgICAgIC8vIOe7mOWItua4kOWPmOefqeW9ou+8iOaooeaLn++8iVxuICAgICAgICBncmFwaGljcy5maWxsQ29sb3IgPSBib3R0b21Db2xvclxuICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLXdpZHRoLzIsIC1oZWlnaHQvMiwgd2lkdGgsIGhlaWdodCwgMjApXG4gICAgICAgIGdyYXBoaWNzLmZpbGwoKVxuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg5YaF5Y+R5YWJ5pWI5p6cXG4gICAgICAgIHZhciBpbm5lckdsb3cgPSBuZXcgY2MuTm9kZShcIklubmVyR2xvd1wiKVxuICAgICAgICB2YXIgZ2xvd1Nwcml0ZSA9IGlubmVyR2xvdy5hZGRDb21wb25lbnQoY2MuU3ByaXRlKVxuICAgICAgICBnbG93U3ByaXRlLnNwcml0ZUZyYW1lID0gbmV3IGNjLlNwcml0ZUZyYW1lKClcbiAgICAgICAgZ2xvd1Nwcml0ZS50eXBlID0gY2MuU3ByaXRlLlR5cGUuU0xJQ0VEXG4gICAgICAgIGlubmVyR2xvdy53aWR0aCA9IHdpZHRoIC0gMjBcbiAgICAgICAgaW5uZXJHbG93LmhlaWdodCA9IGhlaWdodCAtIDIwXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkuI3pgJrov4djb2xvcuiuvue9rmFscGhh77yM5L2/55Sob3BhY2l0eeS7o+abv1xuICAgICAgICBpbm5lckdsb3cuY29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcig2MCwgNDAsIDEwMCkgOiBuZXcgY2MuQ29sb3IoNDAsIDQwLCA1MClcbiAgICAgICAgaW5uZXJHbG93Lm9wYWNpdHkgPSAxMDBcbiAgICAgICAgaW5uZXJHbG93LnBhcmVudCA9IGJnTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg6IOM5pmv57q555CG5pWI5p6cXG4gICAgICAgIHZhciBvdmVybGF5ID0gbmV3IGNjLk5vZGUoXCJPdmVybGF5XCIpXG4gICAgICAgIHZhciBvdmVybGF5U3ByaXRlID0gb3ZlcmxheS5hZGRDb21wb25lbnQoY2MuU3ByaXRlKVxuICAgICAgICBvdmVybGF5U3ByaXRlLnNwcml0ZUZyYW1lID0gbmV3IGNjLlNwcml0ZUZyYW1lKClcbiAgICAgICAgb3ZlcmxheS53aWR0aCA9IHdpZHRoXG4gICAgICAgIG92ZXJsYXkuaGVpZ2h0ID0gaGVpZ2h0XG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkuI3pgJrov4djb2xvcuiuvue9rmFscGhh77yM5L2/55Sob3BhY2l0eeS7o+abv1xuICAgICAgICBvdmVybGF5LmNvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoODAsIDUwLCAxMjApIDogbmV3IGNjLkNvbG9yKDUwLCA1MCwgNjApXG4gICAgICAgIG92ZXJsYXkub3BhY2l0eSA9IDMwXG4gICAgICAgIG92ZXJsYXkucGFyZW50ID0gYmdOb2RlXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYmdOb2RlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCfjqgg5Yib5bu66YeR6L655o+P6L65XG4gICAgICovXG4gICAgX2NyZWF0ZUdvbGRlbkJvcmRlcjogZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgaXNXaW5uZXIpIHtcbiAgICAgICAgdmFyIGJvcmRlck5vZGUgPSBuZXcgY2MuTm9kZShcIkdvbGRlbkJvcmRlclwiKVxuICAgICAgICB2YXIgZ3JhcGhpY3MgPSBib3JkZXJOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgXG4gICAgICAgIC8vIOi+ueahhuminOiJslxuICAgICAgICB2YXIgYm9yZGVyQ29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcigyNTUsIDIwMCwgNTAsIDI1NSkgOiBuZXcgY2MuQ29sb3IoMTAwLCAxMDAsIDEyMCwgMjU1KVxuICAgICAgICB2YXIgZ2xvd0NvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoMjU1LCAxODAsIDAsIDE1MCkgOiBuZXcgY2MuQ29sb3IoODAsIDgwLCAxMDAsIDEwMClcbiAgICAgICAgXG4gICAgICAgIC8vIOWkluWPkeWFiVxuICAgICAgICBncmFwaGljcy5zdHJva2VDb2xvciA9IGdsb3dDb2xvclxuICAgICAgICBncmFwaGljcy5saW5lV2lkdGggPSA4XG4gICAgICAgIGdyYXBoaWNzLnJvdW5kUmVjdCgtd2lkdGgvMiAtIDQsIC1oZWlnaHQvMiAtIDQsIHdpZHRoICsgOCwgaGVpZ2h0ICsgOCwgMjQpXG4gICAgICAgIGdyYXBoaWNzLnN0cm9rZSgpXG4gICAgICAgIFxuICAgICAgICAvLyDkuLvovrnmoYZcbiAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlQ29sb3IgPSBib3JkZXJDb2xvclxuICAgICAgICBncmFwaGljcy5saW5lV2lkdGggPSAzXG4gICAgICAgIGdyYXBoaWNzLnJvdW5kUmVjdCgtd2lkdGgvMiwgLWhlaWdodC8yLCB3aWR0aCwgaGVpZ2h0LCAyMClcbiAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlKClcbiAgICAgICAgXG4gICAgICAgIC8vIOinkuiQveijhemlsFxuICAgICAgICB2YXIgY29ybmVyU2l6ZSA9IDMwXG4gICAgICAgIHZhciBjb3JuZXJzID0gW1xuICAgICAgICAgICAgeyB4OiAtd2lkdGgvMiwgeTogaGVpZ2h0LzIsIHJvdDogMCB9LFxuICAgICAgICAgICAgeyB4OiB3aWR0aC8yLCB5OiBoZWlnaHQvMiwgcm90OiA5MCB9LFxuICAgICAgICAgICAgeyB4OiB3aWR0aC8yLCB5OiAtaGVpZ2h0LzIsIHJvdDogMTgwIH0sXG4gICAgICAgICAgICB7IHg6IC13aWR0aC8yLCB5OiAtaGVpZ2h0LzIsIHJvdDogMjcwIH1cbiAgICAgICAgXVxuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3JuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY29ybmVyID0gY29ybmVyc1tpXVxuICAgICAgICAgICAgdmFyIGRlY29yTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ29ybmVyX1wiICsgaSlcbiAgICAgICAgICAgIHZhciBkZyA9IGRlY29yTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgICAgICBkZy5zdHJva2VDb2xvciA9IGJvcmRlckNvbG9yXG4gICAgICAgICAgICBkZy5saW5lV2lkdGggPSAyXG4gICAgICAgICAgICBkZy5tb3ZlVG8oMCwgMClcbiAgICAgICAgICAgIGRnLmxpbmVUbyhjb3JuZXJTaXplLCAwKVxuICAgICAgICAgICAgZGcubGluZVRvKGNvcm5lclNpemUsIGNvcm5lclNpemUpXG4gICAgICAgICAgICBkZy5zdHJva2UoKVxuICAgICAgICAgICAgZGVjb3JOb2RlLnggPSBjb3JuZXIueFxuICAgICAgICAgICAgZGVjb3JOb2RlLnkgPSBjb3JuZXIueVxuICAgICAgICAgICAgZGVjb3JOb2RlLmFuZ2xlID0gY29ybmVyLnJvdFxuICAgICAgICAgICAgZGVjb3JOb2RlLnBhcmVudCA9IGJvcmRlck5vZGVcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGJvcmRlck5vZGVcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+PhiDliJvlu7rnu5PmnpxCYW5uZXLvvIjog5zliKkv5aSx6LSl5qCH6aKY77yJXG4gICAgICovXG4gICAgX2NyZWF0ZVJlc3VsdEJhbm5lcjogZnVuY3Rpb24oaXNXaW5uZXIsIHBvcHVwV2lkdGgpIHtcbiAgICAgICAgdmFyIGJhbm5lck5vZGUgPSBuZXcgY2MuTm9kZShcIlJlc3VsdEJhbm5lclwiKVxuICAgICAgICBcbiAgICAgICAgLy8gQmFubmVy6IOM5pmvXG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkJhbm5lckJnXCIpXG4gICAgICAgIHZhciBncmFwaGljcyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIHZhciBiYW5uZXJXaWR0aCA9IHBvcHVwV2lkdGggKiAwLjZcbiAgICAgICAgdmFyIGJhbm5lckhlaWdodCA9IDcwXG4gICAgICAgIFxuICAgICAgICBpZiAoaXNXaW5uZXIpIHtcbiAgICAgICAgICAgIC8vIOiDnOWIqSAtIOmHkeiJsua4kOWPmOiDjOaZr1xuICAgICAgICAgICAgZ3JhcGhpY3MuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDIwMCwgMTUwLCAzMCwgMjAwKVxuICAgICAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC1iYW5uZXJXaWR0aC8yLCAtYmFubmVySGVpZ2h0LzIsIGJhbm5lcldpZHRoLCBiYW5uZXJIZWlnaHQsIDM1KVxuICAgICAgICAgICAgZ3JhcGhpY3MuZmlsbCgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWPkeWFiei+ueahhlxuICAgICAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMjAsIDEwMCwgMjU1KVxuICAgICAgICAgICAgZ3JhcGhpY3MubGluZVdpZHRoID0gM1xuICAgICAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC1iYW5uZXJXaWR0aC8yLCAtYmFubmVySGVpZ2h0LzIsIGJhbm5lcldpZHRoLCBiYW5uZXJIZWlnaHQsIDM1KVxuICAgICAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOWksei0pSAtIOaal+e6ouiJsuiDjOaZr1xuICAgICAgICAgICAgZ3JhcGhpY3MuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDgwLCA0MCwgNTAsIDIwMClcbiAgICAgICAgICAgIGdyYXBoaWNzLnJvdW5kUmVjdCgtYmFubmVyV2lkdGgvMiwgLWJhbm5lckhlaWdodC8yLCBiYW5uZXJXaWR0aCwgYmFubmVySGVpZ2h0LCAzNSlcbiAgICAgICAgICAgIGdyYXBoaWNzLmZpbGwoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBncmFwaGljcy5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigxNTAsIDEwMCwgMTAwLCAyNTUpXG4gICAgICAgICAgICBncmFwaGljcy5saW5lV2lkdGggPSAyXG4gICAgICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLWJhbm5lcldpZHRoLzIsIC1iYW5uZXJIZWlnaHQvMiwgYmFubmVyV2lkdGgsIGJhbm5lckhlaWdodCwgMzUpXG4gICAgICAgICAgICBncmFwaGljcy5zdHJva2UoKVxuICAgICAgICB9XG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSBiYW5uZXJOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmoIfpopjmloflrZdcbiAgICAgICAgdmFyIHRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIilcbiAgICAgICAgdGl0bGVOb2RlLmFuY2hvclggPSAwLjVcbiAgICAgICAgdGl0bGVOb2RlLmFuY2hvclkgPSAwLjVcbiAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB0aXRsZUxhYmVsLnN0cmluZyA9IGlzV2lubmVyID8gXCLwn4+GIOiDnCDliKkg8J+PhlwiIDogXCLinJYg5aSxIOi0pSDinJZcIlxuICAgICAgICB0aXRsZUxhYmVsLmZvbnRTaXplID0gNDJcbiAgICAgICAgdGl0bGVMYWJlbC5saW5lSGVpZ2h0ID0gNTBcbiAgICAgICAgdGl0bGVMYWJlbC5mb250RmFtaWx5ID0gXCJBcmlhbFwiXG4gICAgICAgIHRpdGxlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICB0aXRsZUxhYmVsLnZlcnRpY2FsQWxpZ24gPSBjYy5MYWJlbC5WZXJ0aWNhbEFsaWduLkNFTlRFUlxuICAgICAgICB0aXRsZU5vZGUuY29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KSA6IG5ldyBjYy5Db2xvcigyMDAsIDE4MCwgMTgwKVxuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg5o+P6L65XG4gICAgICAgIHZhciBvdXRsaW5lID0gdGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpXG4gICAgICAgIG91dGxpbmUuY29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcigxNTAsIDEwMCwgMCkgOiBuZXcgY2MuQ29sb3IoODAsIDQwLCA0MClcbiAgICAgICAgb3V0bGluZS53aWR0aCA9IDNcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOWPkeWFieaViOaenO+8iOS9v+eUqOmYtOW9seaooeaLn++8iVxuICAgICAgICB2YXIgc2hhZG93ID0gdGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbFNoYWRvdylcbiAgICAgICAgc2hhZG93LmNvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDAsIDIwMCkgOiBuZXcgY2MuQ29sb3IoMTAwLCA1MCwgNTAsIDE1MClcbiAgICAgICAgc2hhZG93Lm9mZnNldCA9IGNjLnYyKDAsIDApXG4gICAgICAgIHNoYWRvdy5ibHVyID0gOFxuICAgICAgICBcbiAgICAgICAgdGl0bGVOb2RlLnBhcmVudCA9IGJhbm5lck5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOiDnOWIqeaXtueahOWRvOWQuOWPkeWFieWKqOeUu1xuICAgICAgICBpZiAoaXNXaW5uZXIpIHtcbiAgICAgICAgICAgIGNjLnR3ZWVuKGJhbm5lck5vZGUpXG4gICAgICAgICAgICAgICAgLnJlcGVhdEZvcmV2ZXIoXG4gICAgICAgICAgICAgICAgICAgIGNjLnR3ZWVuKClcbiAgICAgICAgICAgICAgICAgICAgICAgIC50bygxLjAsIHsgc2NhbGU6IDEuMDIgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC50bygxLjAsIHsgc2NhbGU6IDEuMCB9KVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gYmFubmVyTm9kZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5OKIOWIm+W7uuWAjeaVsOivpuaDheWNoVxuICAgICAqL1xuICAgIF9jcmVhdGVNdWx0aXBsaWVyRGV0YWlsQ2FyZDogZnVuY3Rpb24oZGF0YSwgaXNXaW5uZXIpIHtcbiAgICAgICAgdmFyIGNhcmROb2RlID0gbmV3IGNjLk5vZGUoXCJNdWx0aXBsaWVyQ2FyZFwiKVxuICAgICAgICB2YXIgY2FyZFdpZHRoID0gMTgwXG4gICAgICAgIHZhciBjYXJkSGVpZ2h0ID0gMjUwICAvLyDlop7liqDpq5jluqbku6XlrrnnurPnjovngrjooYxcbiAgICAgICAgXG4gICAgICAgIC8vIOWNoeeJh+iDjOaZr1xuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJDYXJkQmdcIilcbiAgICAgICAgdmFyIGdyYXBoaWNzID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgZ3JhcGhpY3MuZmlsbENvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoNTAsIDM1LCA3MCwgMjIwKSA6IG5ldyBjYy5Db2xvcigzNSwgMzUsIDQ1LCAyMjApXG4gICAgICAgIGdyYXBoaWNzLnJvdW5kUmVjdCgtY2FyZFdpZHRoLzIsIC1jYXJkSGVpZ2h0LzIsIGNhcmRXaWR0aCwgY2FyZEhlaWdodCwgMTUpXG4gICAgICAgIGdyYXBoaWNzLmZpbGwoKVxuICAgICAgICBncmFwaGljcy5zdHJva2VDb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDE4MCwgMTQwLCA2MCwgMjAwKSA6IG5ldyBjYy5Db2xvcig4MCwgODAsIDEwMCwgMjAwKVxuICAgICAgICBncmFwaGljcy5saW5lV2lkdGggPSAyXG4gICAgICAgIGdyYXBoaWNzLnJvdW5kUmVjdCgtY2FyZFdpZHRoLzIsIC1jYXJkSGVpZ2h0LzIsIGNhcmRXaWR0aCwgY2FyZEhlaWdodCwgMTUpXG4gICAgICAgIGdyYXBoaWNzLnN0cm9rZSgpXG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSBjYXJkTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5qCH6aKYXG4gICAgICAgIHZhciB0aXRsZU5vZGUgPSBuZXcgY2MuTm9kZShcIlRpdGxlXCIpXG4gICAgICAgIHRpdGxlTm9kZS5hbmNob3JYID0gMC41XG4gICAgICAgIHRpdGxlTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgIHZhciB0aXRsZUxhYmVsID0gdGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdGl0bGVMYWJlbC5zdHJpbmcgPSBcIuacrOWxgOivpuaDhVwiXG4gICAgICAgIHRpdGxlTGFiZWwuZm9udFNpemUgPSAyMFxuICAgICAgICB0aXRsZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgdGl0bGVMYWJlbC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVJcbiAgICAgICAgdGl0bGVOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDIwMCwgMjAwLCAyMDApXG4gICAgICAgIHRpdGxlTm9kZS55ID0gY2FyZEhlaWdodC8yIC0gMjVcbiAgICAgICAgdGl0bGVOb2RlLnBhcmVudCA9IGNhcmROb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDliIbpmpTnur9cbiAgICAgICAgdmFyIGxpbmVOb2RlID0gbmV3IGNjLk5vZGUoXCJMaW5lXCIpXG4gICAgICAgIHZhciBsZyA9IGxpbmVOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgbGcuc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMTAwLCAxMDAsIDEwMCwgMTUwKVxuICAgICAgICBsZy5saW5lV2lkdGggPSAxXG4gICAgICAgIGxnLm1vdmVUbygtY2FyZFdpZHRoLzIgKyAxNSwgMClcbiAgICAgICAgbGcubGluZVRvKGNhcmRXaWR0aC8yIC0gMTUsIDApXG4gICAgICAgIGxnLnN0cm9rZSgpXG4gICAgICAgIGxpbmVOb2RlLnkgPSBjYXJkSGVpZ2h0LzIgLSA1MFxuICAgICAgICBsaW5lTm9kZS5wYXJlbnQgPSBjYXJkTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g6K+m5oOF5YiX6KGoXG4gICAgICAgIHZhciBtdWx0aURldGFpbCA9IGRhdGEubXVsdGlfZGV0YWlsIHx8IHt9XG4gICAgICAgIHZhciBkZXRhaWxzID0gW1xuICAgICAgICAgICAgeyBsYWJlbDogXCLlupXliIZcIiwgdmFsdWU6IGRhdGEuYmFzZV9zY29yZSB8fCAxMCB9LFxuICAgICAgICAgICAgeyBsYWJlbDogXCLmiqLlnLDkuLtcIiwgdmFsdWU6IG11bHRpRGV0YWlsLnFpYW5nX2NvdW50ID4gMCA/IFwieFwiICsgbXVsdGlEZXRhaWwucWlhbmdfbXVsdGkgOiBcIi1cIiB9LFxuICAgICAgICAgICAgeyBsYWJlbDogXCLngrjlvLlcIiwgdmFsdWU6IG11bHRpRGV0YWlsLmJvbWJfY291bnQgPiAwID8gXCJ4XCIgKyBtdWx0aURldGFpbC5ib21iX211bHRpIDogXCItXCIgfSxcbiAgICAgICAgICAgIHsgbGFiZWw6IFwi546L54K4XCIsIHZhbHVlOiBtdWx0aURldGFpbC5yb2NrZXRfY291bnQgPiAwID8gXCJ4XCIgKyBtdWx0aURldGFpbC5yb2NrZXRfbXVsdGkgOiBcIi1cIiB9LFxuICAgICAgICAgICAgeyBsYWJlbDogXCLmmKXlpKlcIiwgdmFsdWU6IG11bHRpRGV0YWlsLnNwcmluZ190eXBlID4gMCA/IFwieDJcIiA6IFwiLVwiIH1cbiAgICAgICAgXVxuICAgICAgICBcbiAgICAgICAgdmFyIGl0ZW1ZID0gY2FyZEhlaWdodC8yIC0gNzVcbiAgICAgICAgdmFyIGl0ZW1IZWlnaHQgPSAyOFxuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZXRhaWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgaXRlbSA9IGRldGFpbHNbaV1cbiAgICAgICAgICAgIHZhciBpdGVtTm9kZSA9IG5ldyBjYy5Ob2RlKFwiSXRlbV9cIiArIGkpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOagh+etvlxuICAgICAgICAgICAgdmFyIGxhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIilcbiAgICAgICAgICAgIGxhYmVsTm9kZS5hbmNob3JYID0gMC41XG4gICAgICAgICAgICBsYWJlbE5vZGUuYW5jaG9yWSA9IDAuNVxuICAgICAgICAgICAgdmFyIGxhYmVsID0gbGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgIGxhYmVsLnN0cmluZyA9IGl0ZW0ubGFiZWxcbiAgICAgICAgICAgIGxhYmVsLmZvbnRTaXplID0gMTZcbiAgICAgICAgICAgIGxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgICAgIGxhYmVsLnZlcnRpY2FsQWxpZ24gPSBjYy5MYWJlbC5WZXJ0aWNhbEFsaWduLkNFTlRFUlxuICAgICAgICAgICAgbGFiZWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDE4MCwgMTgwLCAxODApXG4gICAgICAgICAgICBsYWJlbE5vZGUueCA9IC1jYXJkV2lkdGgvMiArIDM1XG4gICAgICAgICAgICBsYWJlbE5vZGUucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5YC8XG4gICAgICAgICAgICB2YXIgdmFsdWVOb2RlID0gbmV3IGNjLk5vZGUoXCJWYWx1ZVwiKVxuICAgICAgICAgICAgdmFsdWVOb2RlLmFuY2hvclggPSAwLjVcbiAgICAgICAgICAgIHZhbHVlTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgICAgICB2YXIgdmFsdWVMYWJlbCA9IHZhbHVlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICB2YWx1ZUxhYmVsLnN0cmluZyA9IFN0cmluZyhpdGVtLnZhbHVlKVxuICAgICAgICAgICAgdmFsdWVMYWJlbC5mb250U2l6ZSA9IDE2XG4gICAgICAgICAgICB2YWx1ZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgICAgIHZhbHVlTGFiZWwudmVydGljYWxBbGlnbiA9IGNjLkxhYmVsLlZlcnRpY2FsQWxpZ24uQ0VOVEVSXG4gICAgICAgICAgICB2YWx1ZU5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMjAsIDE1MClcbiAgICAgICAgICAgIHZhbHVlTm9kZS54ID0gY2FyZFdpZHRoLzIgLSA0MFxuICAgICAgICAgICAgdmFsdWVOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGl0ZW1Ob2RlLnkgPSBpdGVtWSAtIGkgKiBpdGVtSGVpZ2h0XG4gICAgICAgICAgICBpdGVtTm9kZS5wYXJlbnQgPSBjYXJkTm9kZVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmgLvlgI3mlbDvvIjlpKflj7fph5HoibLvvIlcbiAgICAgICAgdmFyIHRvdGFsTXVsdGlOb2RlID0gbmV3IGNjLk5vZGUoXCJUb3RhbE11bHRpXCIpXG4gICAgICAgIHZhciB0b3RhbE11bHRpQmcgPSBuZXcgY2MuTm9kZShcIkJnXCIpXG4gICAgICAgIHZhciB0bWcgPSB0b3RhbE11bHRpQmcuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICB0bWcuZmlsbENvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoODAsIDUwLCAyMCwgMjAwKSA6IG5ldyBjYy5Db2xvcig0MCwgNDAsIDUwLCAyMDApXG4gICAgICAgIHRtZy5yb3VuZFJlY3QoLWNhcmRXaWR0aC8yICsgMTAsIC1jYXJkSGVpZ2h0LzIgKyA1LCBjYXJkV2lkdGggLSAyMCwgNTAsIDEwKVxuICAgICAgICB0bWcuZmlsbCgpXG4gICAgICAgIHRvdGFsTXVsdGlCZy55ID0gLWNhcmRIZWlnaHQvMiArIDMwXG4gICAgICAgIHRvdGFsTXVsdGlCZy5wYXJlbnQgPSB0b3RhbE11bHRpTm9kZVxuICAgICAgICBcbiAgICAgICAgdmFyIHRvdGFsTGFiZWwgPSBuZXcgY2MuTm9kZShcIkxhYmVsXCIpXG4gICAgICAgIHRvdGFsTGFiZWwuYW5jaG9yWCA9IDAuNVxuICAgICAgICB0b3RhbExhYmVsLmFuY2hvclkgPSAwLjVcbiAgICAgICAgdmFyIHR0bCA9IHRvdGFsTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB0dGwuc3RyaW5nID0gXCLmgLvlgI3mlbBcIlxuICAgICAgICB0dGwuZm9udFNpemUgPSAxNFxuICAgICAgICB0dGwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICB0dGwudmVydGljYWxBbGlnbiA9IGNjLkxhYmVsLlZlcnRpY2FsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHRvdGFsTGFiZWwuY29sb3IgPSBuZXcgY2MuQ29sb3IoMTgwLCAxODAsIDE4MClcbiAgICAgICAgdG90YWxMYWJlbC55ID0gMTJcbiAgICAgICAgdG90YWxMYWJlbC5wYXJlbnQgPSB0b3RhbE11bHRpTm9kZVxuICAgICAgICBcbiAgICAgICAgdmFyIG11bHRpVmFsdWVOb2RlID0gbmV3IGNjLk5vZGUoXCJWYWx1ZVwiKVxuICAgICAgICBtdWx0aVZhbHVlTm9kZS5uYW1lID0gXCJNdWx0aXBsaWVyVmFsdWVcIlxuICAgICAgICBtdWx0aVZhbHVlTm9kZS5hbmNob3JYID0gMC41XG4gICAgICAgIG11bHRpVmFsdWVOb2RlLmFuY2hvclkgPSAwLjVcbiAgICAgICAgdmFyIG12bCA9IG11bHRpVmFsdWVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgbXZsLnN0cmluZyA9IFwieFwiICsgKGRhdGEubXVsdGlwbGUgfHwgMSlcbiAgICAgICAgbXZsLmZvbnRTaXplID0gMjhcbiAgICAgICAgbXZsLmZvbnRGYW1pbHkgPSBcIkFyaWFsXCJcbiAgICAgICAgbXZsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgbXZsLnZlcnRpY2FsQWxpZ24gPSBjYy5MYWJlbC5WZXJ0aWNhbEFsaWduLkNFTlRFUlxuICAgICAgICBtdWx0aVZhbHVlTm9kZS5jb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDI1NSwgMjAwLCA1MCkgOiBuZXcgY2MuQ29sb3IoMjAwLCAyMDAsIDIwMClcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOaPj+i+uVxuICAgICAgICB2YXIgbXZvID0gbXVsdGlWYWx1ZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSlcbiAgICAgICAgbXZvLmNvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoMTUwLCAxMDAsIDApIDogbmV3IGNjLkNvbG9yKDYwLCA2MCwgNjApXG4gICAgICAgIG12by53aWR0aCA9IDJcbiAgICAgICAgXG4gICAgICAgIG11bHRpVmFsdWVOb2RlLnkgPSAtOFxuICAgICAgICBtdWx0aVZhbHVlTm9kZS5wYXJlbnQgPSB0b3RhbE11bHRpTm9kZVxuICAgICAgICBcbiAgICAgICAgdG90YWxNdWx0aU5vZGUueSA9IC1jYXJkSGVpZ2h0LzIgKyAzMFxuICAgICAgICB0b3RhbE11bHRpTm9kZS5wYXJlbnQgPSBjYXJkTm9kZVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGNhcmROb2RlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCfkaUg5Yib5bu6546p5a6257uT5p6c5YiX6KGoXG4gICAgICovXG4gICAgX2NyZWF0ZVBsYXllclJlc3VsdExpc3Q6IGZ1bmN0aW9uKGRhdGEsIGlzV2lubmVyLCBteVdpbkdvbGQsIGxpc3RXaWR0aCkge1xuICAgICAgICB2YXIgbGlzdE5vZGUgPSBuZXcgY2MuTm9kZShcIlBsYXllclJlc3VsdExpc3RcIilcbiAgICAgICAgdmFyIGxpc3RIZWlnaHQgPSAyNjBcbiAgICAgICAgXG4gICAgICAgIC8vIOWIl+ihqOiDjOaZr1xuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJMaXN0QmdcIilcbiAgICAgICAgdmFyIGdyYXBoaWNzID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgZ3JhcGhpY3MuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDAsIDAsIDAsIDgwKVxuICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLWxpc3RXaWR0aC8yLCAtbGlzdEhlaWdodC8yLCBsaXN0V2lkdGgsIGxpc3RIZWlnaHQsIDEyKVxuICAgICAgICBncmFwaGljcy5maWxsKClcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IGxpc3ROb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDooajlpLRcbiAgICAgICAgdmFyIGhlYWRlck5vZGUgPSBuZXcgY2MuTm9kZShcIkhlYWRlclwiKVxuICAgICAgICB2YXIgaGVhZGVycyA9IFtcIueOqeWutlwiLCBcIui6q+S7vVwiLCBcIui+k+i1olwiXVxuICAgICAgICB2YXIgaGVhZGVyWCA9IFstbGlzdFdpZHRoLzIgKyA4MCwgMjAsIGxpc3RXaWR0aC8yIC0gNjBdXG4gICAgICAgIFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhlYWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBoTm9kZSA9IG5ldyBjYy5Ob2RlKFwiSF9cIiArIGkpXG4gICAgICAgICAgICBoTm9kZS5hbmNob3JYID0gMC41XG4gICAgICAgICAgICBoTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgICAgICB2YXIgaExhYmVsID0gaE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgaExhYmVsLnN0cmluZyA9IGhlYWRlcnNbaV1cbiAgICAgICAgICAgIGhMYWJlbC5mb250U2l6ZSA9IDE4XG4gICAgICAgICAgICBoTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICAgICAgaExhYmVsLnZlcnRpY2FsQWxpZ24gPSBjYy5MYWJlbC5WZXJ0aWNhbEFsaWduLkNFTlRFUlxuICAgICAgICAgICAgaE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMTUwLCAxNTAsIDE2MClcbiAgICAgICAgICAgIGhOb2RlLnggPSBoZWFkZXJYW2ldXG4gICAgICAgICAgICBoTm9kZS5wYXJlbnQgPSBoZWFkZXJOb2RlXG4gICAgICAgIH1cbiAgICAgICAgaGVhZGVyTm9kZS55ID0gbGlzdEhlaWdodC8yIC0gMjVcbiAgICAgICAgaGVhZGVyTm9kZS5wYXJlbnQgPSBsaXN0Tm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5YiG6ZqU57q/XG4gICAgICAgIHZhciBzZXBOb2RlID0gbmV3IGNjLk5vZGUoXCJTZXBhcmF0b3JcIilcbiAgICAgICAgdmFyIHNnID0gc2VwTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIHNnLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDEwMCwgMTAwLCAxMDAsIDEwMClcbiAgICAgICAgc2cubGluZVdpZHRoID0gMVxuICAgICAgICBzZy5tb3ZlVG8oLWxpc3RXaWR0aC8yICsgMTUsIDApXG4gICAgICAgIHNnLmxpbmVUbyhsaXN0V2lkdGgvMiAtIDE1LCAwKVxuICAgICAgICBzZy5zdHJva2UoKVxuICAgICAgICBzZXBOb2RlLnkgPSBsaXN0SGVpZ2h0LzIgLSA0NVxuICAgICAgICBzZXBOb2RlLnBhcmVudCA9IGxpc3ROb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDnjqnlrrbliJfooahcbiAgICAgICAgdmFyIHBsYXllcnMgPSBkYXRhLnBsYXllcnMgfHwgW11cbiAgICAgICAgdmFyIG15UGxheWVySWQgPSBteWdsb2JhbC5zb2NrZXQuZ2V0UGxheWVySW5mbygpLmlkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEuc2VydmVyUGxheWVySWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SURcbiAgICAgICAgdmFyIGl0ZW1TdGFydFkgPSBsaXN0SGVpZ2h0LzIgLSA3NVxuICAgICAgICB2YXIgaXRlbUhlaWdodCA9IDY1XG4gICAgICAgIFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBsYXllcnMubGVuZ3RoICYmIGkgPCAzOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwbGF5ZXIgPSBwbGF5ZXJzW2ldXG4gICAgICAgICAgICB2YXIgaXNDdXJyZW50UGxheWVyID0gU3RyaW5nKHBsYXllci5wbGF5ZXJfaWQpID09PSBTdHJpbmcobXlQbGF5ZXJJZClcbiAgICAgICAgICAgIHZhciBpdGVtTm9kZSA9IHRoaXMuX2NyZWF0ZVBsYXllclJlc3VsdEl0ZW0ocGxheWVyLCBpc0N1cnJlbnRQbGF5ZXIsIGlzV2lubmVyLCBsaXN0V2lkdGgsIGkpXG4gICAgICAgICAgICBpdGVtTm9kZS55ID0gaXRlbVN0YXJ0WSAtIGkgKiBpdGVtSGVpZ2h0XG4gICAgICAgICAgICBpdGVtTm9kZS5wYXJlbnQgPSBsaXN0Tm9kZVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbGlzdE5vZGVcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+RpCDliJvlu7rljZXkuKrnjqnlrrbnu5PmnpzpoblcbiAgICAgKi9cbiAgICBfY3JlYXRlUGxheWVyUmVzdWx0SXRlbTogZnVuY3Rpb24ocGxheWVyLCBpc0N1cnJlbnRQbGF5ZXIsIGlzV2lubmVyLCBsaXN0V2lkdGgsIGluZGV4KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB2YXIgaXRlbU5vZGUgPSBuZXcgY2MuTm9kZShcIlBsYXllckl0ZW1fXCIgKyBpbmRleClcbiAgICAgICAgdmFyIGl0ZW1IZWlnaHQgPSA1NVxuICAgICAgICBcbiAgICAgICAgLy8g5b2T5YmN546p5a626auY5Lqu6IOM5pmvXG4gICAgICAgIGlmIChpc0N1cnJlbnRQbGF5ZXIpIHtcbiAgICAgICAgICAgIHZhciBoaWdobGlnaHQgPSBuZXcgY2MuTm9kZShcIkhpZ2hsaWdodFwiKVxuICAgICAgICAgICAgdmFyIGhnID0gaGlnaGxpZ2h0LmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgICAgIGhnLmZpbGxDb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDgwLCA2MCwgMzAsIDE1MCkgOiBuZXcgY2MuQ29sb3IoNTAsIDQwLCA1MCwgMTUwKVxuICAgICAgICAgICAgaGcucm91bmRSZWN0KC1saXN0V2lkdGgvMiArIDEwLCAtaXRlbUhlaWdodC8yLCBsaXN0V2lkdGggLSAyMCwgaXRlbUhlaWdodCwgOClcbiAgICAgICAgICAgIGhnLmZpbGwoKVxuICAgICAgICAgICAgaGcuc3Ryb2tlQ29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcigyMDAsIDE1MCwgNTAsIDIwMCkgOiBuZXcgY2MuQ29sb3IoMTAwLCA4MCwgMTAwLCAxNTApXG4gICAgICAgICAgICBoZy5saW5lV2lkdGggPSAyXG4gICAgICAgICAgICBoZy5yb3VuZFJlY3QoLWxpc3RXaWR0aC8yICsgMTAsIC1pdGVtSGVpZ2h0LzIsIGxpc3RXaWR0aCAtIDIwLCBpdGVtSGVpZ2h0LCA4KVxuICAgICAgICAgICAgaGcuc3Ryb2tlKClcbiAgICAgICAgICAgIGhpZ2hsaWdodC5wYXJlbnQgPSBpdGVtTm9kZVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlpLTlg4/ljLrln59cbiAgICAgICAgdmFyIGF2YXRhck5vZGUgPSBuZXcgY2MuTm9kZShcIkF2YXRhclwiKVxuICAgICAgICBhdmF0YXJOb2RlLnggPSAtbGlzdFdpZHRoLzIgKyA0NVxuICAgICAgICBcbiAgICAgICAgLy8g5aS05YOP6IOM5pmv77yI5ZyG5b2i77yJXG4gICAgICAgIHZhciBhdmF0YXJCZyA9IG5ldyBjYy5Ob2RlKFwiQXZhdGFyQmdcIilcbiAgICAgICAgdmFyIGFnID0gYXZhdGFyQmcuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICB2YXIgaXNMYW5kbG9yZCA9IHBsYXllci5yb2xlID09PSBcImxhbmRsb3JkXCJcbiAgICAgICAgXG4gICAgICAgIC8vIOe7mOWItuWchuW9ouWktOWDj+ahhlxuICAgICAgICBhZy5zdHJva2VDb2xvciA9IGlzTGFuZGxvcmQgPyBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDUwLCAyNTUpIDogbmV3IGNjLkNvbG9yKDE4MCwgMTgwLCAyMDAsIDI1NSlcbiAgICAgICAgYWcubGluZVdpZHRoID0gM1xuICAgICAgICBhZy5jaXJjbGUoMCwgMCwgMjIpXG4gICAgICAgIGFnLnN0cm9rZSgpXG4gICAgICAgIGFnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig2MCwgNjAsIDgwLCAyMDApXG4gICAgICAgIGFnLmNpcmNsZSgwLCAwLCAyMClcbiAgICAgICAgYWcuZmlsbCgpXG4gICAgICAgIGF2YXRhckJnLnBhcmVudCA9IGF2YXRhck5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOWwneivleWKoOi9veWktOWDj1xuICAgICAgICB2YXIgYXZhdGFySW5kZXggPSAoaW5kZXggJSA0KSArIDFcbiAgICAgICAgdmFyIGF2YXRhclBhdGggPSBcIlVJL2hlYWRpbWFnZS9hdmF0YXJfXCIgKyBhdmF0YXJJbmRleFxuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChhdmF0YXJQYXRoLCBjYy5TcHJpdGVGcmFtZSwgZnVuY3Rpb24oZXJyLCBzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgaWYgKCFlcnIgJiYgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXZhdGFyU3ByaXRlID0gbmV3IGNjLk5vZGUoXCJBdmF0YXJTcHJpdGVcIilcbiAgICAgICAgICAgICAgICB2YXIgc3AgPSBhdmF0YXJTcHJpdGUuYWRkQ29tcG9uZW50KGNjLlNwcml0ZSlcbiAgICAgICAgICAgICAgICBzcC5zcHJpdGVGcmFtZSA9IHNwcml0ZUZyYW1lXG4gICAgICAgICAgICAgICAgc3Auc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NXG4gICAgICAgICAgICAgICAgYXZhdGFyU3ByaXRlLndpZHRoID0gMzZcbiAgICAgICAgICAgICAgICBhdmF0YXJTcHJpdGUuaGVpZ2h0ID0gMzZcbiAgICAgICAgICAgICAgICBhdmF0YXJTcHJpdGUucGFyZW50ID0gYXZhdGFyTm9kZVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8g6Lqr5Lu95Zu+5qCHXG4gICAgICAgIHZhciByb2xlSWNvbk5vZGUgPSBuZXcgY2MuTm9kZShcIlJvbGVJY29uXCIpXG4gICAgICAgIHZhciByb2xlTGFiZWwgPSByb2xlSWNvbk5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICByb2xlTGFiZWwuc3RyaW5nID0gaXNMYW5kbG9yZCA/IFwi8J+RkVwiIDogXCLwn4y+XCJcbiAgICAgICAgcm9sZUxhYmVsLmZvbnRTaXplID0gMTRcbiAgICAgICAgcm9sZUljb25Ob2RlLnggPSAxOFxuICAgICAgICByb2xlSWNvbk5vZGUueSA9IC0xNVxuICAgICAgICByb2xlSWNvbk5vZGUucGFyZW50ID0gYXZhdGFyTm9kZVxuICAgICAgICBcbiAgICAgICAgYXZhdGFyTm9kZS5wYXJlbnQgPSBpdGVtTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g546p5a625ZCN56ewXG4gICAgICAgIHZhciBuYW1lTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTmFtZVwiKVxuICAgICAgICBuYW1lTm9kZS5hbmNob3JYID0gMC41XG4gICAgICAgIG5hbWVOb2RlLmFuY2hvclkgPSAwLjVcbiAgICAgICAgdmFyIG5hbWVMYWJlbCA9IG5hbWVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgbmFtZUxhYmVsLnN0cmluZyA9IHBsYXllci5wbGF5ZXJfbmFtZSB8fCAoXCLnjqnlrrZcIiArIChpbmRleCArIDEpKVxuICAgICAgICBuYW1lTGFiZWwuZm9udFNpemUgPSAxOFxuICAgICAgICBuYW1lTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICBuYW1lTGFiZWwudmVydGljYWxBbGlnbiA9IGNjLkxhYmVsLlZlcnRpY2FsQWxpZ24uQ0VOVEVSXG4gICAgICAgIG5hbWVOb2RlLmNvbG9yID0gaXNDdXJyZW50UGxheWVyID8gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyMDApIDogbmV3IGNjLkNvbG9yKDIyMCwgMjIwLCAyMjApXG4gICAgICAgIG5hbWVOb2RlLnggPSAtbGlzdFdpZHRoLzIgKyAxMDBcbiAgICAgICAgbmFtZU5vZGUucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOi6q+S7vVxuICAgICAgICB2YXIgcm9sZU5vZGUgPSBuZXcgY2MuTm9kZShcIlJvbGVcIilcbiAgICAgICAgcm9sZU5vZGUuYW5jaG9yWCA9IDAuNVxuICAgICAgICByb2xlTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgIHZhciByb2xlVGV4dCA9IHJvbGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgcm9sZVRleHQuc3RyaW5nID0gaXNMYW5kbG9yZCA/IFwi5Zyw5Li7XCIgOiBcIuWGnOawkVwiXG4gICAgICAgIHJvbGVUZXh0LmZvbnRTaXplID0gMThcbiAgICAgICAgcm9sZVRleHQuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICByb2xlVGV4dC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVJcbiAgICAgICAgcm9sZU5vZGUuY29sb3IgPSBpc0xhbmRsb3JkID8gbmV3IGNjLkNvbG9yKDI1NSwgMjAwLCAxMDApIDogbmV3IGNjLkNvbG9yKDEyMCwgMjAwLCAxMjApXG4gICAgICAgIHJvbGVOb2RlLnggPSAyMFxuICAgICAgICByb2xlTm9kZS5wYXJlbnQgPSBpdGVtTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g6L6T6LWi6YeR6aKdXG4gICAgICAgIHZhciB3aW5Hb2xkID0gcGxheWVyLndpbl9nb2xkIHx8IDBcbiAgICAgICAgdmFyIHdpbk5vZGUgPSBuZXcgY2MuTm9kZShcIldpbkdvbGRcIilcbiAgICAgICAgd2luTm9kZS5uYW1lID0gXCJXaW5Hb2xkVmFsdWVcIlxuICAgICAgICB3aW5Ob2RlLmFuY2hvclggPSAwLjVcbiAgICAgICAgd2luTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgIHZhciB3aW5MYWJlbCA9IHdpbk5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB3aW5MYWJlbC5zdHJpbmcgPSAod2luR29sZCA+PSAwID8gXCIrXCIgOiBcIlwiKSArIHdpbkdvbGRcbiAgICAgICAgd2luTGFiZWwuZm9udFNpemUgPSAyMlxuICAgICAgICB3aW5MYWJlbC5mb250RmFtaWx5ID0gXCJBcmlhbFwiXG4gICAgICAgIHdpbkxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgd2luTGFiZWwudmVydGljYWxBbGlnbiA9IGNjLkxhYmVsLlZlcnRpY2FsQWxpZ24uQ0VOVEVSXG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDmj4/ovrlcbiAgICAgICAgdmFyIHdpbk91dGxpbmUgPSB3aW5Ob2RlLmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpXG4gICAgICAgIHdpbk91dGxpbmUuY29sb3IgPSB3aW5Hb2xkID49IDAgPyBuZXcgY2MuQ29sb3IoMCwgODAsIDApIDogbmV3IGNjLkNvbG9yKDEwMCwgMCwgMClcbiAgICAgICAgd2luT3V0bGluZS53aWR0aCA9IDJcbiAgICAgICAgXG4gICAgICAgIHdpbk5vZGUuY29sb3IgPSB3aW5Hb2xkID49IDAgPyBuZXcgY2MuQ29sb3IoMTAwLCAyNTUsIDEwMCkgOiBuZXcgY2MuQ29sb3IoMjU1LCAxMDAsIDEwMClcbiAgICAgICAgd2luTm9kZS54ID0gbGlzdFdpZHRoLzIgLSA1MFxuICAgICAgICB3aW5Ob2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaXRlbU5vZGVcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+UmCDliJvlu7rmjInpkq7ljLrln59cbiAgICAgKi9cbiAgICBfY3JlYXRlQnV0dG9uQXJlYTogZnVuY3Rpb24oaXNXaW5uZXIsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB2YXIgYXJlYU5vZGUgPSBuZXcgY2MuTm9kZShcIkJ1dHRvbkFyZWFcIilcbiAgICAgICAgXG4gICAgICAgIC8vIOe7p+e7rea4uOaIj+aMiemSrlxuICAgICAgICB2YXIgY29udGludWVCdG4gPSBzZWxmLl9jcmVhdGVTdHlsZWRCdXR0b24oXCLnu6fnu63muLjmiI9cIiwgaXNXaW5uZXIsIHRydWUpXG4gICAgICAgIGNvbnRpbnVlQnRuLnggPSAtMTAwXG4gICAgICAgIGNvbnRpbnVlQnRuLnBhcmVudCA9IGFyZWFOb2RlXG4gICAgICAgIFxuICAgICAgICBjb250aW51ZUJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhcImNvbnRpbnVlXCIpXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICAvLyDov5Tlm57lpKfljoXmjInpkq5cbiAgICAgICAgdmFyIGxvYmJ5QnRuID0gc2VsZi5fY3JlYXRlU3R5bGVkQnV0dG9uKFwi6L+U5Zue5aSn5Y6FXCIsIGlzV2lubmVyLCBmYWxzZSlcbiAgICAgICAgbG9iYnlCdG4ueCA9IDEwMFxuICAgICAgICBsb2JieUJ0bi5wYXJlbnQgPSBhcmVhTm9kZVxuICAgICAgICBcbiAgICAgICAgbG9iYnlCdG4ub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soXCJsb2JieVwiKVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGFyZWFOb2RlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflJgg5Yib5bu66auY57qn5qC35byP5oyJ6ZKuXG4gICAgICovXG4gICAgX2NyZWF0ZVN0eWxlZEJ1dHRvbjogZnVuY3Rpb24odGV4dCwgaXNXaW5uZXIsIGlzUHJpbWFyeSkge1xuICAgICAgICB2YXIgYnRuTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQnRuX1wiICsgdGV4dClcbiAgICAgICAgdmFyIGJ0bldpZHRoID0gMTQwXG4gICAgICAgIHZhciBidG5IZWlnaHQgPSA1MFxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeiuvue9ruaMiemSruiKgueCueeahOWGheWuueWkp+Wwj++8jOehruS/neeCueWHu+WMuuWfn+ato+ehrlxuICAgICAgICBidG5Ob2RlLnNldENvbnRlbnRTaXplKGJ0bldpZHRoLCBidG5IZWlnaHQpXG4gICAgICAgIGJ0bk5vZGUuc2V0QW5jaG9yUG9pbnQoMC41LCAwLjUpXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5re75YqgIEJsb2NrSW5wdXRFdmVudHMg57uE5Lu277yM56Gu5L+d5oyJ6ZKu5Y+v5Lul5o6l5pS254K55Ye75LqL5Lu2XG4gICAgICAgIGJ0bk5vZGUuYWRkQ29tcG9uZW50KGNjLkJsb2NrSW5wdXRFdmVudHMpXG4gICAgICAgIFxuICAgICAgICAvLyDmjInpkq7og4zmma9cbiAgICAgICAgdmFyIGdyYXBoaWNzID0gYnRuTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIFxuICAgICAgICBpZiAoaXNQcmltYXJ5KSB7XG4gICAgICAgICAgICAvLyDkuLvopoHmjInpkq4gLSDph5HmqZnmuJDlj5hcbiAgICAgICAgICAgIGlmIChpc1dpbm5lcikge1xuICAgICAgICAgICAgICAgIGdyYXBoaWNzLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcigyMDAsIDE0MCwgMzAsIDI1NSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZ3JhcGhpY3MuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDYwLCAxMjAsIDE4MCwgMjU1KVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5qyh6KaB5oyJ6ZKuIC0g6JOd57Sr5riQ5Y+YXG4gICAgICAgICAgICBncmFwaGljcy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoODAsIDcwLCAxMjAsIDI1NSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC1idG5XaWR0aC8yLCAtYnRuSGVpZ2h0LzIsIGJ0bldpZHRoLCBidG5IZWlnaHQsIDI1KVxuICAgICAgICBncmFwaGljcy5maWxsKClcbiAgICAgICAgXG4gICAgICAgIC8vIOi+ueahhlxuICAgICAgICBpZiAoaXNQcmltYXJ5ICYmIGlzV2lubmVyKSB7XG4gICAgICAgICAgICBncmFwaGljcy5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIyMCwgMTAwLCAyNTUpXG4gICAgICAgICAgICBncmFwaGljcy5saW5lV2lkdGggPSAyXG4gICAgICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLWJ0bldpZHRoLzIsIC1idG5IZWlnaHQvMiwgYnRuV2lkdGgsIGJ0bkhlaWdodCwgMjUpXG4gICAgICAgICAgICBncmFwaGljcy5zdHJva2UoKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmjInpkq7mloflrZdcbiAgICAgICAgdmFyIGxhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIilcbiAgICAgICAgbGFiZWxOb2RlLmFuY2hvclggPSAwLjVcbiAgICAgICAgbGFiZWxOb2RlLmFuY2hvclkgPSAwLjVcbiAgICAgICAgdmFyIGxhYmVsID0gbGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgbGFiZWwuc3RyaW5nID0gdGV4dFxuICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDIyXG4gICAgICAgIGxhYmVsLmZvbnRGYW1pbHkgPSBcIkFyaWFsXCJcbiAgICAgICAgbGFiZWwub3ZlcmZsb3cgPSBjYy5MYWJlbC5PdmVyZmxvdy5TSFJJTktcbiAgICAgICAgbGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICBsYWJlbC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVJcbiAgICAgICAgbGFiZWxOb2RlLndpZHRoID0gYnRuV2lkdGggLSAyMCAgLy8g55WZ5Ye66L656Led6Ziy5q2i5rqi5Ye6XG4gICAgICAgIGxhYmVsTm9kZS5oZWlnaHQgPSBidG5IZWlnaHQgLSAxMFxuICAgICAgICBsYWJlbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOaPj+i+uVxuICAgICAgICB2YXIgb3V0bGluZSA9IGxhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKVxuICAgICAgICBvdXRsaW5lLmNvbG9yID0gbmV3IGNjLkNvbG9yKDAsIDAsIDApXG4gICAgICAgIG91dGxpbmUud2lkdGggPSAyXG4gICAgICAgIFxuICAgICAgICBsYWJlbE5vZGUucGFyZW50ID0gYnRuTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g54K55Ye75pWI5p6cXG4gICAgICAgIGJ0bk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfU1RBUlQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2MudHdlZW4oYnRuTm9kZSkudG8oMC4xLCB7IHNjYWxlOiAwLjk1IH0pLnN0YXJ0KClcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIGJ0bk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNjLnR3ZWVuKGJ0bk5vZGUpLnRvKDAuMSwgeyBzY2FsZTogMSB9KS5zdGFydCgpXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICBidG5Ob2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0NBTkNFTCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjYy50d2VlbihidG5Ob2RlKS50bygwLjEsIHsgc2NhbGU6IDEgfSkuc3RhcnQoKVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGJ0bk5vZGVcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog4pyoIOWIm+W7uuiDnOWIqeeykuWtkOeJueaViFxuICAgICAqL1xuICAgIF9jcmVhdGVWaWN0b3J5UGFydGljbGVzOiBmdW5jdGlvbihwYXJlbnQsIHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIFxuICAgICAgICAvLyDph5HluIHnspLlrZBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNTsgaSsrKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29pbiA9IG5ldyBjYy5Ob2RlKFwiQ29pbl9cIiArIGluZGV4KVxuICAgICAgICAgICAgICAgIGNvaW4ueCA9IChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIHdpZHRoXG4gICAgICAgICAgICAgICAgY29pbi55ID0gaGVpZ2h0IC8gMiArIDUwXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g57uY5Yi26YeR5biBXG4gICAgICAgICAgICAgICAgdmFyIGcgPSBjb2luLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgICAgICAgICBnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIwMCwgNTAsIDI1NSlcbiAgICAgICAgICAgICAgICBnLmNpcmNsZSgwLCAwLCA4KVxuICAgICAgICAgICAgICAgIGcuZmlsbCgpXG4gICAgICAgICAgICAgICAgZy5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigyMDAsIDE1MCwgMzAsIDI1NSlcbiAgICAgICAgICAgICAgICBnLmxpbmVXaWR0aCA9IDFcbiAgICAgICAgICAgICAgICBnLmNpcmNsZSgwLCAwLCA4KVxuICAgICAgICAgICAgICAgIGcuc3Ryb2tlKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb2luLnBhcmVudCA9IHBhcmVudFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOS4i+iQveWKqOeUu1xuICAgICAgICAgICAgICAgIHZhciBkdXJhdGlvbiA9IDEuNSArIE1hdGgucmFuZG9tKCkgKiAxLjVcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0WSA9IC1oZWlnaHQgLyAyIC0gNTBcbiAgICAgICAgICAgICAgICB2YXIgZGVsYXkgPSBNYXRoLnJhbmRvbSgpICogMC41XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2MudHdlZW4oY29pbilcbiAgICAgICAgICAgICAgICAgICAgLmRlbGF5KGRlbGF5KVxuICAgICAgICAgICAgICAgICAgICAucGFyYWxsZWwoXG4gICAgICAgICAgICAgICAgICAgICAgICBjYy50d2VlbigpLnRvKGR1cmF0aW9uLCB7IHk6IHRhcmdldFkgfSwgeyBlYXNpbmc6ICdxdWFkSW4nIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2MudHdlZW4oKS50byhkdXJhdGlvbiwgeyB4OiBjb2luLnggKyAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiAxMDAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICBjYy50d2VlbigpLnRvKGR1cmF0aW9uIC8gMiwgeyBhbmdsZTogLTE4MCB9KS50byhkdXJhdGlvbiAvIDIsIHsgYW5nbGU6IC0zNjAgfSlcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAuY2FsbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOW+queOr1xuICAgICAgICAgICAgICAgICAgICAgICAgY29pbi55ID0gaGVpZ2h0IC8gMiArIDUwXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2luLnggPSAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiB3aWR0aFxuICAgICAgICAgICAgICAgICAgICAgICAgY2MudHdlZW4oY29pbilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAucGFyYWxsZWwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNjLnR3ZWVuKCkudG8oZHVyYXRpb24sIHsgeTogdGFyZ2V0WSB9LCB7IGVhc2luZzogJ3F1YWRJbicgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNjLnR3ZWVuKCkudG8oZHVyYXRpb24sIHsgeDogY29pbi54ICsgKE1hdGgucmFuZG9tKCkgLSAwLjUpICogMTAwIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYy50d2VlbigpLnRvKGR1cmF0aW9uIC8gMiwgeyBhbmdsZTogLTE4MCB9KS50byhkdXJhdGlvbiAvIDIsIHsgYW5nbGU6IC0zNjAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgICAgIH0pKGkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOaYn+WFiemXqueDgVxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDg7IGorKykge1xuICAgICAgICAgICAgKGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXIgPSBuZXcgY2MuTm9kZShcIlN0YXJfXCIgKyBpbmRleClcbiAgICAgICAgICAgICAgICBzdGFyLnggPSAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiB3aWR0aCAqIDAuOFxuICAgICAgICAgICAgICAgIHN0YXIueSA9IChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIGhlaWdodCAqIDAuOFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOe7mOWItuaYn+aYn1xuICAgICAgICAgICAgICAgIHZhciBzZyA9IHN0YXIuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICAgICAgICAgIHNnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjAwLCAyMDApXG4gICAgICAgICAgICAgICAgc2VsZi5fZHJhd1N0YXIoc2csIDAsIDAsIDYsIDUpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgc3Rhci5wYXJlbnQgPSBwYXJlbnRcbiAgICAgICAgICAgICAgICBzdGFyLm9wYWNpdHkgPSAwXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g6Zeq54OB5Yqo55S7XG4gICAgICAgICAgICAgICAgY2MudHdlZW4oc3RhcilcbiAgICAgICAgICAgICAgICAgICAgLmRlbGF5KE1hdGgucmFuZG9tKCkgKiAyKVxuICAgICAgICAgICAgICAgICAgICAucmVwZWF0Rm9yZXZlcihcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLnR3ZWVuKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudG8oMC4zLCB7IG9wYWNpdHk6IDI1NSwgc2NhbGU6IDEuMiB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50bygwLjMsIHsgb3BhY2l0eTogMTAwLCBzY2FsZTogMC44IH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvKDAuMywgeyBvcGFjaXR5OiAyNTUsIHNjYWxlOiAxLjIgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudG8oMC4zLCB7IG9wYWNpdHk6IDAsIHNjYWxlOiAwLjUgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZGVsYXkoMSArIE1hdGgucmFuZG9tKCkgKiAyKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIC5zdGFydCgpXG4gICAgICAgICAgICB9KShqKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCfjKfvuI8g5Yib5bu65aSx6LSl57KS5a2Q54m55pWIXG4gICAgICovXG4gICAgX2NyZWF0ZURlZmVhdFBhcnRpY2xlczogZnVuY3Rpb24ocGFyZW50LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIC8vIOiTneiJsua8gua1rueykuWtkFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICAgICAgICAgIChmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJ0aWNsZSA9IG5ldyBjYy5Ob2RlKFwiRGVmZWF0UGFydGljbGVfXCIgKyBpbmRleClcbiAgICAgICAgICAgICAgICBwYXJ0aWNsZS54ID0gKE1hdGgucmFuZG9tKCkgLSAwLjUpICogd2lkdGhcbiAgICAgICAgICAgICAgICBwYXJ0aWNsZS55ID0gKE1hdGgucmFuZG9tKCkgLSAwLjUpICogaGVpZ2h0XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g57uY5Yi257KS5a2QXG4gICAgICAgICAgICAgICAgdmFyIGcgPSBwYXJ0aWNsZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgICAgICAgICAgZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoODAsIDEwMCwgMTUwLCAxNTApXG4gICAgICAgICAgICAgICAgZy5jaXJjbGUoMCwgMCwgNCArIE1hdGgucmFuZG9tKCkgKiAzKVxuICAgICAgICAgICAgICAgIGcuZmlsbCgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcGFydGljbGUucGFyZW50ID0gcGFyZW50XG4gICAgICAgICAgICAgICAgcGFydGljbGUub3BhY2l0eSA9IDBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDnvJPmhaLmvILmta7liqjnlLtcbiAgICAgICAgICAgICAgICB2YXIgZHVyYXRpb24gPSAzICsgTWF0aC5yYW5kb20oKSAqIDJcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjYy50d2VlbihwYXJ0aWNsZSlcbiAgICAgICAgICAgICAgICAgICAgLnRvKDAuNSwgeyBvcGFjaXR5OiAxNTAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnBhcmFsbGVsKFxuICAgICAgICAgICAgICAgICAgICAgICAgY2MudHdlZW4oKS50byhkdXJhdGlvbiwgeyB5OiBwYXJ0aWNsZS55ICsgNTAgKyBNYXRoLnJhbmRvbSgpICogMzAgfSwgeyBlYXNpbmc6ICdzaW5lSW5PdXQnIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2MudHdlZW4oKS50byhkdXJhdGlvbiwgeyB4OiBwYXJ0aWNsZS54ICsgKE1hdGgucmFuZG9tKCkgLSAwLjUpICogNDAgfSlcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAudG8oMC41LCB7IG9wYWNpdHk6IDAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmNhbGwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJ0aWNsZS55ID0gKE1hdGgucmFuZG9tKCkgLSAwLjUpICogaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJ0aWNsZS54ID0gKE1hdGgucmFuZG9tKCkgLSAwLjUpICogd2lkdGhcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDlvqrnjq9cbiAgICAgICAgICAgICAgICBjYy50d2VlbihwYXJ0aWNsZSlcbiAgICAgICAgICAgICAgICAgICAgLmRlbGF5KDQpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBlYXRGb3JldmVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgY2MudHdlZW4oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50bygwLjUsIHsgb3BhY2l0eTogMTUwIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnBhcmFsbGVsKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYy50d2VlbigpLnRvKGR1cmF0aW9uLCB7IHk6IHBhcnRpY2xlLnkgKyA1MCArIE1hdGgucmFuZG9tKCkgKiAzMCB9LCB7IGVhc2luZzogJ3NpbmVJbk91dCcgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNjLnR3ZWVuKCkudG8oZHVyYXRpb24sIHsgeDogcGFydGljbGUueCArIChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIDQwIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50bygwLjUsIHsgb3BhY2l0eTogMCB9KVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIC5zdGFydCgpXG4gICAgICAgICAgICB9KShpKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOKtkCDnu5jliLbmmJ/lvaJcbiAgICAgKi9cbiAgICBfZHJhd1N0YXI6IGZ1bmN0aW9uKGdyYXBoaWNzLCBjeCwgY3ksIGlubmVyUmFkaXVzLCBwb2ludHMpIHtcbiAgICAgICAgdmFyIG91dGVyUmFkaXVzID0gaW5uZXJSYWRpdXMgKiAyXG4gICAgICAgIGdyYXBoaWNzLm1vdmVUbyhjeCwgY3kgKyBvdXRlclJhZGl1cylcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9pbnRzICogMjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmFkaXVzID0gaSAlIDIgPT09IDAgPyBvdXRlclJhZGl1cyA6IGlubmVyUmFkaXVzXG4gICAgICAgICAgICB2YXIgYW5nbGUgPSAoaSAqIE1hdGguUEkpIC8gcG9pbnRzIC0gTWF0aC5QSSAvIDJcbiAgICAgICAgICAgIHZhciB4ID0gY3ggKyBNYXRoLmNvcyhhbmdsZSkgKiByYWRpdXNcbiAgICAgICAgICAgIHZhciB5ID0gY3kgKyBNYXRoLnNpbihhbmdsZSkgKiByYWRpdXNcbiAgICAgICAgICAgIGdyYXBoaWNzLmxpbmVUbyh4LCB5KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBncmFwaGljcy5jbG9zZSgpXG4gICAgICAgIGdyYXBoaWNzLmZpbGwoKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5SiIOWQr+WKqOaVsOWtl+WKqOeUu1xuICAgICAqL1xuICAgIF9zdGFydE51bWJlckFuaW1hdGlvbnM6IGZ1bmN0aW9uKHBvcHVwTm9kZSwgZGF0YSwgbXlXaW5Hb2xkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICBcbiAgICAgICAgLy8g5YCN5pWw5rua5Yqo5Yqo55S7XG4gICAgICAgIHZhciBtdWx0aVZhbHVlTm9kZSA9IHNlbGYuX2ZpbmROb2RlQnlOYW1lKHBvcHVwTm9kZSwgXCJNdWx0aXBsaWVyVmFsdWVcIilcbiAgICAgICAgaWYgKG11bHRpVmFsdWVOb2RlKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0TXVsdGkgPSBkYXRhLm11bHRpcGxlIHx8IDFcbiAgICAgICAgICAgIHNlbGYuX2FuaW1hdGVOdW1iZXIobXVsdGlWYWx1ZU5vZGUsIDEsIHRhcmdldE11bHRpLCA4MDAsIFwieFwiKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflKIg5pWw5a2X5rua5Yqo5Yqo55S7XG4gICAgICovXG4gICAgX2FuaW1hdGVOdW1iZXI6IGZ1bmN0aW9uKG5vZGUsIGZyb20sIHRvLCBkdXJhdGlvbiwgcHJlZml4KSB7XG4gICAgICAgIGlmICghbm9kZSkgcmV0dXJuXG4gICAgICAgIHZhciBsYWJlbCA9IG5vZGUuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBpZiAoIWxhYmVsKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHZhciBzdGFydFRpbWUgPSBEYXRlLm5vdygpXG4gICAgICAgIHZhciBkaWZmID0gdG8gLSBmcm9tXG4gICAgICAgIFxuICAgICAgICB2YXIgdXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIW5vZGUuaXNWYWxpZCkgcmV0dXJuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBlbGFwc2VkID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZVxuICAgICAgICAgICAgdmFyIHByb2dyZXNzID0gTWF0aC5taW4oZWxhcHNlZCAvIGR1cmF0aW9uLCAxKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDkvb/nlKjnvJPliqjlh73mlbBcbiAgICAgICAgICAgIHZhciBlYXNlUHJvZ3Jlc3MgPSAxIC0gTWF0aC5wb3coMSAtIHByb2dyZXNzLCAzKSAvLyBlYXNlT3V0Q3ViaWNcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gTWF0aC5mbG9vcihmcm9tICsgZGlmZiAqIGVhc2VQcm9ncmVzcylcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGFiZWwuc3RyaW5nID0gKHByZWZpeCB8fCBcIlwiKSArIGN1cnJlbnRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHByb2dyZXNzIDwgMSkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQodXBkYXRlLCAxNilcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGFiZWwuc3RyaW5nID0gKHByZWZpeCB8fCBcIlwiKSArIHRvXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHVwZGF0ZSgpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflI0g5p+l5om+6IqC54K5XG4gICAgICovXG4gICAgX2ZpbmROb2RlQnlOYW1lOiBmdW5jdGlvbihwYXJlbnQsIG5hbWUpIHtcbiAgICAgICAgaWYgKCFwYXJlbnQpIHJldHVybiBudWxsXG4gICAgICAgIFxuICAgICAgICB2YXIgY2hpbGRyZW4gPSBwYXJlbnQuY2hpbGRyZW5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGNoaWxkcmVuW2ldLm5hbWUgPT09IG5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5baV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBmb3VuZCA9IHRoaXMuX2ZpbmROb2RlQnlOYW1lKGNoaWxkcmVuW2ldLCBuYW1lKVxuICAgICAgICAgICAgaWYgKGZvdW5kKSByZXR1cm4gZm91bmRcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDlhbPpl63nu5PnrpflvLnnqpcgLSDluKbnvKnlsI/mt6Hlh7rliqjnlLtcbiAgICAgKi9cbiAgICBfY2xvc2VHYW1lUmVzdWx0UG9wdXA6IGZ1bmN0aW9uKHBvcHVwTm9kZSwgbWFza05vZGUpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIFxuICAgICAgICAvLyDlgZzmraLmiYDmnInnspLlrZDliqjnlLtcbiAgICAgICAgaWYgKHRoaXMuX3Jlc3VsdEVmZmVjdExheWVyKSB7XG4gICAgICAgICAgICB0aGlzLl9yZXN1bHRFZmZlY3RMYXllci5zdG9wQWxsQWN0aW9ucygpXG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLl9yZXN1bHRFZmZlY3RMYXllci5jaGlsZHJlblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuW2ldLnN0b3BBbGxBY3Rpb25zKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5by556qX57yp5bCP5reh5Ye65Yqo55S7XG4gICAgICAgIGlmIChwb3B1cE5vZGUpIHtcbiAgICAgICAgICAgIGNjLnR3ZWVuKHBvcHVwTm9kZSlcbiAgICAgICAgICAgICAgICAudG8oMC4yLCB7IHNjYWxlOiAwLjgsIG9wYWNpdHk6IDAgfSwgeyBlYXNpbmc6ICdiYWNrSW4nIH0pXG4gICAgICAgICAgICAgICAgLmNhbGwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwb3B1cE5vZGUgJiYgcG9wdXBOb2RlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwTm9kZS5kZXN0cm95KClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6YGu572p5reh5Ye6XG4gICAgICAgIGlmIChtYXNrTm9kZSkge1xuICAgICAgICAgICAgY2MudHdlZW4obWFza05vZGUpXG4gICAgICAgICAgICAgICAgLnRvKDAuMiwgeyBvcGFjaXR5OiAwIH0pXG4gICAgICAgICAgICAgICAgLmNhbGwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXNrTm9kZSAmJiBtYXNrTm9kZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXNrTm9kZS5kZXN0cm95KClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5fZ2FtZVJlc3VsdFBvcHVwID0gbnVsbFxuICAgICAgICB0aGlzLl9nYW1lUmVzdWx0TWFzayA9IG51bGxcbiAgICAgICAgdGhpcy5fcmVzdWx0RWZmZWN0TGF5ZXIgPSBudWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOe7p+e7rea4uOaIj1xuICAgICAqL1xuICAgIF9jb250aW51ZUdhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCB8fCAhbXlnbG9iYWwucGxheWVyRGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHmo4Dmn6XnjqnlrrbosYblrZDmmK/lkKbotrPlpJ/nu6fnu63muLjmiI9cbiAgICAgICAgdmFyIHBsYXllckdvbGQgPSBteWdsb2JhbC5wbGF5ZXJEYXRhLmdvYmFsX2NvdW50IHx8IDBcbiAgICAgICAgdmFyIHJvb21Db25maWcgPSBteWdsb2JhbC5jdXJyZW50Um9vbUNvbmZpZyB8fCB7fVxuICAgICAgICB2YXIgbWluR29sZCA9IHJvb21Db25maWcubWluX2dvbGQgfHwgcm9vbUNvbmZpZy5taW5Hb2xkIHx8IDBcbiAgICAgICAgXG4gICAgICAgIGlmIChwbGF5ZXJHb2xkIDwgbWluR29sZCkge1xuICAgICAgICAgICAgLy8g6LGG5a2Q5LiN6Laz77yM5pi+56S66LGG5a2Q5LiN6Laz5by556qXXG4gICAgICAgICAgICB0aGlzLl9zaG93SW5zdWZmaWNpZW50R29sZFBvcHVwKHBsYXllckdvbGQsIG1pbkdvbGQpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6LGG5a2Q6Laz5aSf77yM57un57ut5ri45oiPXG4gICAgICAgIHRoaXMuX2RvQ29udGludWVHYW1lKClcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHmiafooYznu6fnu63muLjmiI/pgLvovpFcbiAgICAgKi9cbiAgICBfZG9Db250aW51ZUdhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDmuIXnkIblvZPliY3muLjmiI/nirbmgIFcbiAgICAgICAgdGhpcy5fcmVzZXRHYW1lU3RhdGUoKVxuICAgICAgICBcbiAgICAgICAgLy8g5Y+R6YCBIHJlYWR5IOivt+axgu+8iOWHhuWkh+S4i+S4gOWxgO+8iVxuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKG15Z2xvYmFsICYmIG15Z2xvYmFsLnNvY2tldCAmJiBteWdsb2JhbC5zb2NrZXQucmVxdWVzdFJlYWR5KSB7XG4gICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQucmVxdWVzdFJlYWR5KClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pi+56S6562J5b6F5o+Q56S6XG4gICAgICAgIGlmICh0aGlzLnRpcHNMYWJlbCkge1xuICAgICAgICAgICAgdGhpcy50aXBzTGFiZWwuc3RyaW5nID0gXCLnrYnlvoXlhbbku5bnjqnlrrYuLi5cIlxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLnRpcHNMYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRpcHNMYWJlbC5zdHJpbmcgPSBcIlwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgNTAwMClcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeaYvuekuuixhuWtkOS4jei2s+W8ueeql1xuICAgICAqL1xuICAgIF9zaG93SW5zdWZmaWNpZW50R29sZFBvcHVwOiBmdW5jdGlvbihjdXJyZW50R29sZCwgcmVxdWlyZWRHb2xkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICBcbiAgICAgICAgLy8g5YWz6Zet57uT566X5by556qXXG4gICAgICAgIHRoaXMuX2Nsb3NlR2FtZVJlc3VsdFBvcHVwKClcbiAgICAgICAgXG4gICAgICAgIC8vIOWIm+W7uuixhuWtkOS4jei2s+W8ueeql1xuICAgICAgICB2YXIgY2FudmFzID0gY2MuZGlyZWN0b3IuZ2V0U2NlbmUoKS5nZXRDaGlsZEJ5TmFtZShcIkNhbnZhc1wiKVxuICAgICAgICBpZiAoIWNhbnZhcykgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICB2YXIgd2luU2l6ZSA9IGNjLndpblNpemVcbiAgICAgICAgXG4gICAgICAgIC8vIOmBrue9qeWxglxuICAgICAgICB2YXIgbWFza05vZGUgPSBuZXcgY2MuTm9kZShcIkluc3VmZmljaWVudEdvbGRNYXNrXCIpXG4gICAgICAgIG1hc2tOb2RlLmFkZENvbXBvbmVudChjYy5CbG9ja0lucHV0RXZlbnRzKVxuICAgICAgICB2YXIgbWFza1Nwcml0ZSA9IG1hc2tOb2RlLmFkZENvbXBvbmVudChjYy5TcHJpdGUpXG4gICAgICAgIG1hc2tTcHJpdGUuc3ByaXRlRnJhbWUgPSBuZXcgY2MuU3ByaXRlRnJhbWUoKVxuICAgICAgICBtYXNrU3ByaXRlLnNpemVNb2RlID0gY2MuU3ByaXRlLlNpemVNb2RlLkNVU1RPTVxuICAgICAgICBtYXNrTm9kZS53aWR0aCA9IHdpblNpemUud2lkdGggKiAyXG4gICAgICAgIG1hc2tOb2RlLmhlaWdodCA9IHdpblNpemUuaGVpZ2h0ICogMlxuICAgICAgICBtYXNrTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigwLCAwLCAwKVxuICAgICAgICBtYXNrTm9kZS5vcGFjaXR5ID0gMTgwXG4gICAgICAgIG1hc2tOb2RlLnBhcmVudCA9IGNhbnZhc1xuICAgICAgICBcbiAgICAgICAgLy8g5by556qX5a655ZmoXG4gICAgICAgIHZhciBwb3B1cE5vZGUgPSBuZXcgY2MuTm9kZShcIkluc3VmZmljaWVudEdvbGRQb3B1cFwiKVxuICAgICAgICBwb3B1cE5vZGUueCA9IDBcbiAgICAgICAgcG9wdXBOb2RlLnkgPSAwXG4gICAgICAgIHBvcHVwTm9kZS5wYXJlbnQgPSBjYW52YXNcbiAgICAgICAgXG4gICAgICAgIC8vIOW8ueeql+iDjOaZr1xuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCZ1wiKVxuICAgICAgICB2YXIgZ3JhcGhpY3MgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICB2YXIgcG9wdXBXaWR0aCA9IDQ1MFxuICAgICAgICB2YXIgcG9wdXBIZWlnaHQgPSAzMjBcbiAgICAgICAgZ3JhcGhpY3MuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDQwLCAzNSwgNjApXG4gICAgICAgIGdyYXBoaWNzLnJvdW5kUmVjdCgtcG9wdXBXaWR0aC8yLCAtcG9wdXBIZWlnaHQvMiwgcG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQsIDIwKVxuICAgICAgICBncmFwaGljcy5maWxsKClcbiAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDEwMClcbiAgICAgICAgZ3JhcGhpY3MubGluZVdpZHRoID0gM1xuICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLXBvcHVwV2lkdGgvMiwgLXBvcHVwSGVpZ2h0LzIsIHBvcHVwV2lkdGgsIHBvcHVwSGVpZ2h0LCAyMClcbiAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlKClcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5qCH6aKYXG4gICAgICAgIHZhciB0aXRsZU5vZGUgPSBuZXcgY2MuTm9kZShcIlRpdGxlXCIpXG4gICAgICAgIHZhciB0aXRsZUxhYmVsID0gdGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdGl0bGVMYWJlbC5zdHJpbmcgPSBcIuixhuWtkOS4jei2s1wiXG4gICAgICAgIHRpdGxlTGFiZWwuZm9udFNpemUgPSAyOFxuICAgICAgICB0aXRsZUxhYmVsLmZvbnRGYW1pbHkgPSBcIkFyaWFsXCJcbiAgICAgICAgdGl0bGVMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHRpdGxlTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIwMCwgMTAwKVxuICAgICAgICB0aXRsZU5vZGUueSA9IHBvcHVwSGVpZ2h0LzIgLSA0NVxuICAgICAgICB0aXRsZU5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDliIbpmpTnur9cbiAgICAgICAgdmFyIGxpbmVOb2RlID0gbmV3IGNjLk5vZGUoXCJMaW5lXCIpXG4gICAgICAgIHZhciBsZyA9IGxpbmVOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgbGcuc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMTAwLCA4MCwgNjApXG4gICAgICAgIGxnLmxpbmVXaWR0aCA9IDFcbiAgICAgICAgbGcubW92ZVRvKC1wb3B1cFdpZHRoLzIgKyAzMCwgcG9wdXBIZWlnaHQvMiAtIDgwKVxuICAgICAgICBsZy5saW5lVG8ocG9wdXBXaWR0aC8yIC0gMzAsIHBvcHVwSGVpZ2h0LzIgLSA4MClcbiAgICAgICAgbGcuc3Ryb2tlKClcbiAgICAgICAgbGluZU5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDlhoXlrrnljLrln59cbiAgICAgICAgdmFyIGNvbnRlbnROb2RlID0gbmV3IGNjLk5vZGUoXCJDb250ZW50XCIpXG4gICAgICAgIHZhciBjb250ZW50TGFiZWwgPSBjb250ZW50Tm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGNvbnRlbnRMYWJlbC5zdHJpbmcgPSBcIuW9k+WJjeixhuWtkDogXCIgKyB0aGlzLl9mb3JtYXRHb2xkKGN1cnJlbnRHb2xkKSArIFwiXFxu6ZyA6KaB6LGG5a2QOiBcIiArIHRoaXMuX2Zvcm1hdEdvbGQocmVxdWlyZWRHb2xkKSArIFwiXFxuXFxu6KeC55yL5r+A5Yqx6KeG6aKR5bm/5ZGK5Y+v6I635Y+W6LGG5a2QXCJcbiAgICAgICAgY29udGVudExhYmVsLmZvbnRTaXplID0gMjBcbiAgICAgICAgY29udGVudExhYmVsLmZvbnRGYW1pbHkgPSBcIkFyaWFsXCJcbiAgICAgICAgY29udGVudExhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgY29udGVudExhYmVsLm92ZXJmbG93ID0gY2MuTGFiZWwuT3ZlcmZsb3cuUkVTSVpFX0hFSUdIVFxuICAgICAgICBjb250ZW50Tm9kZS53aWR0aCA9IHBvcHVwV2lkdGggLSA2MFxuICAgICAgICBjb250ZW50Tm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyMjAsIDIyMCwgMjIwKVxuICAgICAgICBjb250ZW50Tm9kZS55ID0gMjBcbiAgICAgICAgY29udGVudE5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmjInpkq7ljLrln59cbiAgICAgICAgdmFyIGJ0bkFyZWFOb2RlID0gbmV3IGNjLk5vZGUoXCJCdXR0b25BcmVhXCIpXG4gICAgICAgIGJ0bkFyZWFOb2RlLnkgPSAtcG9wdXBIZWlnaHQvMiArIDYwXG4gICAgICAgIGJ0bkFyZWFOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g6KeC55yL5bm/5ZGK5oyJ6ZKuXG4gICAgICAgIHZhciBhZEJ0biA9IG5ldyBjYy5Ob2RlKFwiQWRCdG5cIilcbiAgICAgICAgdmFyIGFkQmcgPSBhZEJ0bi5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGFkQmcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDgwLCAxODAsIDgwKVxuICAgICAgICBhZEJnLnJvdW5kUmVjdCgtMTAwLCAtMjUsIDIwMCwgNTAsIDI1KVxuICAgICAgICBhZEJnLmZpbGwoKVxuICAgICAgICBhZEJ0bi54ID0gLTExMFxuICAgICAgICBhZEJ0bi5wYXJlbnQgPSBidG5BcmVhTm9kZVxuICAgICAgICBcbiAgICAgICAgdmFyIGFkTGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJMYWJlbFwiKVxuICAgICAgICB2YXIgYWRMYWJlbCA9IGFkTGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgYWRMYWJlbC5zdHJpbmcgPSBcIuingueci+W5v+WRilwiXG4gICAgICAgIGFkTGFiZWwuZm9udFNpemUgPSAyMFxuICAgICAgICBhZExhYmVsLmZvbnRGYW1pbHkgPSBcIkFyaWFsXCJcbiAgICAgICAgYWRMYWJlbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgYWRMYWJlbE5vZGUucGFyZW50ID0gYWRCdG5cbiAgICAgICAgXG4gICAgICAgIC8vIOi/lOWbnuWkp+WOheaMiemSrlxuICAgICAgICB2YXIgbG9iYnlCdG4gPSBuZXcgY2MuTm9kZShcIkxvYmJ5QnRuXCIpXG4gICAgICAgIHZhciBsb2JieUJnID0gbG9iYnlCdG4uYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBsb2JieUJnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcigxMDAsIDgwLCAxNDApXG4gICAgICAgIGxvYmJ5Qmcucm91bmRSZWN0KC0xMDAsIC0yNSwgMjAwLCA1MCwgMjUpXG4gICAgICAgIGxvYmJ5QmcuZmlsbCgpXG4gICAgICAgIGxvYmJ5QnRuLnggPSAxMTBcbiAgICAgICAgbG9iYnlCdG4ucGFyZW50ID0gYnRuQXJlYU5vZGVcbiAgICAgICAgXG4gICAgICAgIHZhciBsb2JieUxhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIilcbiAgICAgICAgdmFyIGxvYmJ5TGFiZWwgPSBsb2JieUxhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGxvYmJ5TGFiZWwuc3RyaW5nID0gXCLov5Tlm57lpKfljoVcIlxuICAgICAgICBsb2JieUxhYmVsLmZvbnRTaXplID0gMjBcbiAgICAgICAgbG9iYnlMYWJlbC5mb250RmFtaWx5ID0gXCJBcmlhbFwiXG4gICAgICAgIGxvYmJ5TGFiZWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIGxvYmJ5TGFiZWxOb2RlLnBhcmVudCA9IGxvYmJ5QnRuXG4gICAgICAgIFxuICAgICAgICAvLyDlrZjlgqjoioLngrnlvJXnlKhcbiAgICAgICAgc2VsZi5faW5zdWZmaWNpZW50R29sZFBvcHVwID0gcG9wdXBOb2RlXG4gICAgICAgIHNlbGYuX2luc3VmZmljaWVudEdvbGRNYXNrID0gbWFza05vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOingueci+W5v+WRiuaMiemSrueCueWHu+S6i+S7tlxuICAgICAgICBhZEJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5fd2F0Y2hBZEZvckdvbGQoZnVuY3Rpb24oc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOW5v+WRiuingueci+aIkOWKn++8jOWFs+mXreW8ueeql+W5tue7p+e7rea4uOaIj1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9jbG9zZUluc3VmZmljaWVudEdvbGRQb3B1cCgpXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2RvQ29udGludWVHYW1lKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8g6L+U5Zue5aSn5Y6F5oyJ6ZKu54K55Ye75LqL5Lu2XG4gICAgICAgIGxvYmJ5QnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLl9jbG9zZUluc3VmZmljaWVudEdvbGRQb3B1cCgpXG4gICAgICAgICAgICBzZWxmLl9yZXR1cm5Ub0xvYmJ5KClcbiAgICAgICAgfSlcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHlhbPpl63osYblrZDkuI3otrPlvLnnqpdcbiAgICAgKi9cbiAgICBfY2xvc2VJbnN1ZmZpY2llbnRHb2xkUG9wdXA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5faW5zdWZmaWNpZW50R29sZFBvcHVwKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnN1ZmZpY2llbnRHb2xkUG9wdXAuZGVzdHJveSgpXG4gICAgICAgICAgICB0aGlzLl9pbnN1ZmZpY2llbnRHb2xkUG9wdXAgPSBudWxsXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2luc3VmZmljaWVudEdvbGRNYXNrKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnN1ZmZpY2llbnRHb2xkTWFzay5kZXN0cm95KClcbiAgICAgICAgICAgIHRoaXMuX2luc3VmZmljaWVudEdvbGRNYXNrID0gbnVsbFxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR6KeC55yL5r+A5Yqx6KeG6aKR5bm/5ZGK6I635Y+W6LGG5a2QXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSDlm57osIPlh73mlbDvvIzlj4LmlbDkuLrmmK/lkKbmiJDlip9cbiAgICAgKi9cbiAgICBfd2F0Y2hBZEZvckdvbGQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICBcbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm5pyJ5bm/5ZGKU0RL77yI5Y+v5qC55o2u5a6e6ZmF6ZuG5oiQ55qE5bm/5ZGKU0RL6LCD5pW077yJXG4gICAgICAgIC8vIOi/memHjOaPkOS+m+S4gOS4qumAmueUqOeahOWunueOsOahhuaetlxuICAgICAgICBcbiAgICAgICAgLy8g5pa55byPMTog5aaC5p6c6ZuG5oiQ5LqG56m/5bGx55Sy5bm/5ZGKU0RLIChCeXRlZGFuY2UpXG4gICAgICAgIGlmICh0eXBlb2YgdHQgIT09ICd1bmRlZmluZWQnICYmIHR0LnNob3dSZXdhcmRlZFZpZGVvQWQpIHtcbiAgICAgICAgICAgIHR0LnNob3dSZXdhcmRlZFZpZGVvQWQoe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDlub/lkYrop4LnnIvmiJDlip/vvIzlpZblirHosYblrZBcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fcmV3YXJkR29sZEFmdGVyQWQoY2FsbGJhY2spXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmYWlsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5bm/5ZGK6KeC55yL5aSx6LSlXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlKFwi5bm/5ZGK5Yqg6L295aSx6LSl77yM6K+356iN5ZCO6YeN6K+VXCIpXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZmFsc2UpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmlrnlvI8yOiDlpoLmnpzpm4bmiJDkuoblvq7kv6HlsI/muLjmiI/lub/lkYpTREtcbiAgICAgICAgaWYgKHR5cGVvZiB3eCAhPT0gJ3VuZGVmaW5lZCcgJiYgd3guY3JlYXRlUmV3YXJkZWRWaWRlb0FkKSB7XG4gICAgICAgICAgICB2YXIgcmV3YXJkZWRWaWRlb0FkID0gd3guY3JlYXRlUmV3YXJkZWRWaWRlb0FkKHtcbiAgICAgICAgICAgICAgICBhZFVuaXRJZDogJ2FkdW5pdC14eHgnIC8vIOabv+aNouS4uuWunumZheeahOW5v+WRiuWNleWFg0lEXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXdhcmRlZFZpZGVvQWQub25DbG9zZShmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVzICYmIHJlcy5pc0VuZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOeUqOaIt+WujOaVtOingueci+S6huW5v+WRilxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9yZXdhcmRHb2xkQWZ0ZXJBZChjYWxsYmFjaylcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyDnlKjmiLfmj5DliY3lhbPpl63kuoblub/lkYpcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2UoXCLor7flrozmlbTop4LnnIvlub/lkYrojrflj5blpZblirFcIilcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhmYWxzZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXdhcmRlZFZpZGVvQWQub25FcnJvcihmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZShcIuW5v+WRiuWKoOi9veWksei0pe+8jOivt+eojeWQjumHjeivlVwiKVxuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZmFsc2UpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXdhcmRlZFZpZGVvQWQuc2hvdygpLmNhdGNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIOWksei0pemHjeivlVxuICAgICAgICAgICAgICAgIHJld2FyZGVkVmlkZW9BZC5sb2FkKCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJld2FyZGVkVmlkZW9BZC5zaG93KClcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmlrnlvI8zOiDmqKHmi5/lub/lkYrvvIjlvIDlj5HmtYvor5XnlKjvvIlcbiAgICAgICAgLy8g5Zyo5a6e6ZmF5Y+R5biD5pe25bqU6K+l5Yig6Zmk5q2k5YiG5pSv5oiW5pu/5o2i5Li655yf5a6e5bm/5ZGKU0RLXG4gICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlKFwi5q2j5Zyo5Yqg6L295bm/5ZGKLi4uXCIpXG4gICAgICAgIFxuICAgICAgICAvLyDmqKHmi5/lub/lkYrop4LnnIvov4fnqIvvvIgy56eS5ZCO5aWW5Yqx6LGG5a2Q77yJXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLl9yZXdhcmRHb2xkQWZ0ZXJBZChjYWxsYmFjaylcbiAgICAgICAgfSwgMjAwMClcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHlub/lkYrop4LnnIvmiJDlip/lkI7lpZblirHosYblrZBcbiAgICAgKi9cbiAgICBfcmV3YXJkR29sZEFmdGVyR29sZDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIGlmICghbXlnbG9iYWwgfHwgIW15Z2xvYmFsLnBsYXllckRhdGEpIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZmFsc2UpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5aWW5Yqx6LGG5a2Q5pWw6YeP77yI5Y+v5qC55o2u5a6e6ZmF6ZyA5rGC6LCD5pW077yJXG4gICAgICAgIHZhciByZXdhcmRBbW91bnQgPSA1MDAwXG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDmnKzlnLDosYblrZDmlbDph49cbiAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YS51cGRhdGVHb2xkKHJld2FyZEFtb3VudClcbiAgICAgICAgXG4gICAgICAgIC8vIOaYvuekuuWlluWKseaPkOekulxuICAgICAgICB0aGlzLl9zaG93TWVzc2FnZShcIuiOt+W+lyBcIiArIHRoaXMuX2Zvcm1hdEdvbGQocmV3YXJkQW1vdW50KSArIFwiIOixhuWtkO+8gVwiKVxuICAgICAgICBcbiAgICAgICAgLy8g6YCa55+l5pyN5Yqh56uv77yI5aaC5p6c6ZyA6KaB5ZCM5q2l77yJXG4gICAgICAgIGlmIChteWdsb2JhbC5zb2NrZXQgJiYgbXlnbG9iYWwuc29ja2V0LnNlbmRBZFJld2FyZCkge1xuICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LnNlbmRBZFJld2FyZChyZXdhcmRBbW91bnQpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2sodHJ1ZSlcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDkv67lpI3jgJHlub/lkYrop4LnnIvmiJDlip/lkI7lpZblirHosYblrZDvvIjkv67mraPmlrnms5XlkI3mi7zlhpnplJnor6/vvIlcbiAgICAgKi9cbiAgICBfcmV3YXJkR29sZEFmdGVyQWQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAoIW15Z2xvYmFsIHx8ICFteWdsb2JhbC5wbGF5ZXJEYXRhKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGZhbHNlKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWlluWKseixhuWtkOaVsOmHj++8iOWPr+agueaNruWunumZhemcgOaxguiwg+aVtO+8iVxuICAgICAgICB2YXIgcmV3YXJkQW1vdW50ID0gNTAwMFxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw5pys5Zyw6LGG5a2Q5pWw6YePXG4gICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEudXBkYXRlR29sZChyZXdhcmRBbW91bnQpXG4gICAgICAgIFxuICAgICAgICAvLyDmmL7npLrlpZblirHmj5DnpLpcbiAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2UoXCLojrflvpcgXCIgKyB0aGlzLl9mb3JtYXRHb2xkKHJld2FyZEFtb3VudCkgKyBcIiDosYblrZDvvIFcIilcbiAgICAgICAgXG4gICAgICAgIC8vIOmAmuefpeacjeWKoeerr++8iOWmguaenOmcgOimgeWQjOatpe+8iVxuICAgICAgICBpZiAobXlnbG9iYWwuc29ja2V0ICYmIG15Z2xvYmFsLnNvY2tldC5zZW5kQWRSZXdhcmQpIHtcbiAgICAgICAgICAgIG15Z2xvYmFsLnNvY2tldC5zZW5kQWRSZXdhcmQocmV3YXJkQW1vdW50KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKHRydWUpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5qC85byP5YyW6LGG5a2Q5pWw6YeP5pi+56S6XG4gICAgICovXG4gICAgX2Zvcm1hdEdvbGQ6IGZ1bmN0aW9uKGdvbGQpIHtcbiAgICAgICAgaWYgKGdvbGQgPj0gMTAwMDApIHtcbiAgICAgICAgICAgIHJldHVybiAoZ29sZCAvIDEwMDAwKS50b0ZpeGVkKDEpICsgXCLkuIdcIlxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBnb2xkLnRvU3RyaW5nKClcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHmmL7npLrmtojmga/mj5DnpLpcbiAgICAgKi9cbiAgICBfc2hvd01lc3NhZ2U6IGZ1bmN0aW9uKG1zZykge1xuICAgICAgICBpZiAodGhpcy50aXBzTGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMudGlwc0xhYmVsLnN0cmluZyA9IG1zZ1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLnRpcHNMYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRpcHNMYWJlbC5zdHJpbmcgPSBcIlwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMzAwMClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDov5Tlm57lpKfljoVcbiAgICAgKi9cbiAgICBfcmV0dXJuVG9Mb2JieTogZnVuY3Rpb24oKSB7XG4gICAgICAgIFxuICAgICAgICAvLyDmuIXnkIblvZPliY3muLjmiI/nirbmgIFcbiAgICAgICAgdGhpcy5fcmVzZXRHYW1lU3RhdGUoKVxuICAgICAgICBcbiAgICAgICAgLy8g5Y+R6YCB56a75byA5oi/6Ze06K+35rGCXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAobXlnbG9iYWwgJiYgbXlnbG9iYWwuc29ja2V0ICYmIG15Z2xvYmFsLnNvY2tldC5sZWF2ZVJvb20pIHtcbiAgICAgICAgICAgIG15Z2xvYmFsLnNvY2tldC5sZWF2ZVJvb20oKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfjq4gW19yZXR1cm5Ub0xvYmJ5XSBteWdsb2JhbC5zb2NrZXQubGVhdmVSb29tIOS4jeWPr+eUqFwiKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDliqDovb3lpKfljoXlnLrmma9cbiAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwiaGFsbFNjZW5lXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDph43nva7muLjmiI/nirbmgIFcbiAgICAgKi9cbiAgICBfcmVzZXRHYW1lU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDmuIXnkIbmiYvniYxcbiAgICAgICAgdGhpcy5oYW5kQ2FyZHMgPSBbXVxuICAgICAgICB0aGlzLmJvdHRvbUNhcmRzID0gW11cbiAgICAgICAgdGhpcy5jaG9vc2VfY2FyZF9kYXRhID0gW11cbiAgICAgICAgXG4gICAgICAgIC8vIOa4heeQhuWNoeeJjOiKgueCuVxuICAgICAgICB0aGlzLmNsZWFyQWxsQ2FyZHMoKVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkea4heeQhuaJgOacieeOqeWutueahOWHuueJjOWMuuWfn++8iOahjOmdouS4iueahOeJjO+8iVxuICAgICAgICB0aGlzLl9jbGVhckFsbE91dENhcmRab25lcygpXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5riF55CG5bqV54mM6IqC54K5XG4gICAgICAgIHRoaXMuX2NsZWFyQm90dG9tQ2FyZHMoKVxuICAgICAgICBcbiAgICAgICAgLy8g6YeN572u5ri45oiP6Zi25q61XG4gICAgICAgIHRoaXMuX2dhbWVQaGFzZSA9IFwiaWRsZVwiXG4gICAgICAgIHRoaXMuX2JpZGRpbmdQaGFzZSA9IFwiaWRsZVwiXG4gICAgICAgIFxuICAgICAgICAvLyDpmpDol4/miYDmnIlVSVxuICAgICAgICB0aGlzLl9oaWRlUm9iVUkoKVxuICAgICAgICBpZiAodGhpcy5wbGF5aW5nVUlfbm9kZSkge1xuICAgICAgICAgICAgdGhpcy5wbGF5aW5nVUlfbm9kZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR6YeN572u5omA5pyJ546p5a6255qE5YeG5aSH5Zu+5qCH54q25oCBXG4gICAgICAgIHRoaXMuX3Jlc2V0QWxsUGxheWVyUmVhZHlTdGF0ZSgpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5riF55CG5omA5pyJ546p5a6255qE5Ye654mM5Yy65Z+fXG4gICAgICovXG4gICAgX2NsZWFyQWxsT3V0Q2FyZFpvbmVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPliBnYW1lU2NlbmUg6ISa5pysXG4gICAgICAgIHZhciBnYW1lU2NlbmVfc2NyaXB0ID0gdGhpcy5ub2RlLnBhcmVudCA/IHRoaXMubm9kZS5wYXJlbnQuZ2V0Q29tcG9uZW50KFwiZ2FtZVNjZW5lXCIpIDogbnVsbFxuICAgICAgICBpZiAoIWdhbWVTY2VuZV9zY3JpcHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCfjq4gW19jbGVhckFsbE91dENhcmRab25lc10g5peg5rOV6I635Y+WIGdhbWVTY2VuZVwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPlueOqeWutuW6p+S9jeiKgueCuVxuICAgICAgICB2YXIgcGxheWVyc19zZWF0X3BvcyA9IGdhbWVTY2VuZV9zY3JpcHQucGxheWVyc19zZWF0X3Bvc1xuICAgICAgICBpZiAoIXBsYXllcnNfc2VhdF9wb3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCfjq4gW19jbGVhckFsbE91dENhcmRab25lc10g5peg5rOV6I635Y+WIHBsYXllcnNfc2VhdF9wb3NcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDpgY3ljobmiYDmnInluqfkvY3vvIzmuIXnkIblh7rniYzljLrln59cbiAgICAgICAgdmFyIGNoaWxkcmVuID0gcGxheWVyc19zZWF0X3Bvcy5jaGlsZHJlblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc2VhdE5vZGUgPSBjaGlsZHJlbltpXVxuICAgICAgICAgICAgLy8g5p+l5om+5Ye654mM5Yy65Z+f6IqC54K577yIY2FyZHNvdXR6b25lMCwgY2FyZHNvdXR6b25lMSwgY2FyZHNvdXR6b25lMu+8iVxuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgb3V0Wm9uZU5hbWUgPSBcImNhcmRzb3V0em9uZVwiICsgalxuICAgICAgICAgICAgICAgIHZhciBvdXRab25lID0gc2VhdE5vZGUuZ2V0Q2hpbGRCeU5hbWUob3V0Wm9uZU5hbWUpXG4gICAgICAgICAgICAgICAgaWYgKG91dFpvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0Wm9uZS5yZW1vdmVBbGxDaGlsZHJlbih0cnVlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkea4heeQhuW6leeJjOiKgueCuVxuICAgICAqL1xuICAgIF9jbGVhckJvdHRvbUNhcmRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIOmUgOavgeW6leeJjOiKgueCuVxuICAgICAgICBpZiAodGhpcy5ib3R0b21fY2FyZCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmJvdHRvbV9jYXJkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYm90dG9tX2NhcmRbaV0gJiYgdGhpcy5ib3R0b21fY2FyZFtpXS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYm90dG9tX2NhcmRbaV0uZGVzdHJveSgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuYm90dG9tX2NhcmQgPSBbXVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkemHjee9ruaJgOacieeOqeWutueahOWHhuWkh+Wbvuagh+eKtuaAgVxuICAgICAqL1xuICAgIF9yZXNldEFsbFBsYXllclJlYWR5U3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZ2FtZVNjZW5lX3NjcmlwdCA9IHRoaXMubm9kZS5wYXJlbnQgPyB0aGlzLm5vZGUucGFyZW50LmdldENvbXBvbmVudChcImdhbWVTY2VuZVwiKSA6IG51bGxcbiAgICAgICAgaWYgKCFnYW1lU2NlbmVfc2NyaXB0IHx8ICFnYW1lU2NlbmVfc2NyaXB0LnBsYXllck5vZGVMaXN0KSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnYW1lU2NlbmVfc2NyaXB0LnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGxheWVyTm9kZSA9IGdhbWVTY2VuZV9zY3JpcHQucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgIGlmIChwbGF5ZXJOb2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBsYXllclNjcmlwdCA9IHBsYXllck5vZGUuZ2V0Q29tcG9uZW50KFwicGxheWVyX25vZGVcIilcbiAgICAgICAgICAgICAgICBpZiAocGxheWVyU2NyaXB0ICYmIHBsYXllclNjcmlwdC5yZWFkeWltYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBsYXllclNjcmlwdC5yZWFkeWltYWdlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5pu05paw546p5a626IqC54K555qE6YeR5biB5pi+56S6XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBsYXllcklkIC0g546p5a62SURcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZ29sZCAtIOaWsOeahOmHkeW4geaVsOmHj1xuICAgICAqL1xuICAgIF91cGRhdGVQbGF5ZXJHb2xkRGlzcGxheTogZnVuY3Rpb24ocGxheWVySWQsIGdvbGQpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPliBnYW1lU2NlbmUg6ISa5pysXG4gICAgICAgIHZhciBnYW1lU2NlbmVfc2NyaXB0ID0gdGhpcy5ub2RlLnBhcmVudCA/IHRoaXMubm9kZS5wYXJlbnQuZ2V0Q29tcG9uZW50KFwiZ2FtZVNjZW5lXCIpIDogbnVsbFxuICAgICAgICBpZiAoIWdhbWVTY2VuZV9zY3JpcHQgfHwgIWdhbWVTY2VuZV9zY3JpcHQucGxheWVyTm9kZUxpc3QpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCfj4YgW191cGRhdGVQbGF5ZXJHb2xkRGlzcGxheV0g5peg5rOV6I635Y+WIGdhbWVTY2VuZSDmiJYgcGxheWVyTm9kZUxpc3RcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDpgY3ljobmiYDmnInnjqnlrrboioLngrnvvIzmib7liLDljLnphY3nmoTnjqnlrrblubbmm7TmlrDph5HluIHmmL7npLpcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnYW1lU2NlbmVfc2NyaXB0LnBsYXllck5vZGVMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGxheWVyTm9kZSA9IGdhbWVTY2VuZV9zY3JpcHQucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgIGlmICghcGxheWVyTm9kZSkgY29udGludWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHBsYXllclNjcmlwdCA9IHBsYXllck5vZGUuZ2V0Q29tcG9uZW50KFwicGxheWVyX25vZGVcIilcbiAgICAgICAgICAgIGlmICghcGxheWVyU2NyaXB0KSBjb250aW51ZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDljLnphY3njqnlrrZJRFxuICAgICAgICAgICAgaWYgKFN0cmluZyhwbGF5ZXJTY3JpcHQuYWNjb3VudGlkKSA9PT0gU3RyaW5nKHBsYXllcklkKSkge1xuICAgICAgICAgICAgICAgIC8vIOabtOaWsOmHkeW4geaYvuekulxuICAgICAgICAgICAgICAgIGlmIChwbGF5ZXJTY3JpcHQuZ2xvYmFsY291bnRfbGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyU2NyaXB0Lmdsb2JhbGNvdW50X2xhYmVsLnN0cmluZyA9IFN0cmluZyhnb2xkKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHmm7TmlrDnjqnlrrboioLngrnnmoTnq57mioDluIHmmL7npLrvvIjnq57mioDlnLrmqKHlvI/kuJPnlKjvvIlcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGxheWVySWQgLSDnjqnlrrZJRFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBtYXRjaENvaW4gLSDmlrDnmoTnq57mioDluIHmlbDph49cbiAgICAgKi9cbiAgICBfdXBkYXRlUGxheWVyTWF0Y2hDb2luRGlzcGxheTogZnVuY3Rpb24ocGxheWVySWQsIG1hdGNoQ29pbikge1xuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW191cGRhdGVQbGF5ZXJNYXRjaENvaW5EaXNwbGF5XSDmm7TmlrDnjqnlrrbnq57mioDluIE6IHBsYXllcklkPVwiLCBwbGF5ZXJJZCwgXCJtYXRjaENvaW49XCIsIG1hdGNoQ29pbilcblxuICAgICAgICAvLyDojrflj5YgZ2FtZVNjZW5lIOiEmuacrFxuICAgICAgICB2YXIgZ2FtZVNjZW5lX3NjcmlwdCA9IHRoaXMubm9kZS5wYXJlbnQgPyB0aGlzLm5vZGUucGFyZW50LmdldENvbXBvbmVudChcImdhbWVTY2VuZVwiKSA6IG51bGxcbiAgICAgICAgaWYgKCFnYW1lU2NlbmVfc2NyaXB0IHx8ICFnYW1lU2NlbmVfc2NyaXB0LnBsYXllck5vZGVMaXN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn4+f77iPIFtfdXBkYXRlUGxheWVyTWF0Y2hDb2luRGlzcGxheV0g5peg5rOV6I635Y+WIGdhbWVTY2VuZSDmiJYgcGxheWVyTm9kZUxpc3RcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8g6YGN5Y6G5omA5pyJ546p5a626IqC54K577yM5om+5Yiw5Yy56YWN55qE546p5a625bm25pu05paw56ue5oqA5biB5pi+56S6XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2FtZVNjZW5lX3NjcmlwdC5wbGF5ZXJOb2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHBsYXllck5vZGUgPSBnYW1lU2NlbmVfc2NyaXB0LnBsYXllck5vZGVMaXN0W2ldXG4gICAgICAgICAgICBpZiAoIXBsYXllck5vZGUpIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIHZhciBwbGF5ZXJTY3JpcHQgPSBwbGF5ZXJOb2RlLmdldENvbXBvbmVudChcInBsYXllcl9ub2RlXCIpXG4gICAgICAgICAgICBpZiAoIXBsYXllclNjcmlwdCkgY29udGludWVcblxuICAgICAgICAgICAgLy8g5Yy56YWN546p5a62SURcbiAgICAgICAgICAgIGlmIChTdHJpbmcocGxheWVyU2NyaXB0LmFjY291bnRpZCkgPT09IFN0cmluZyhwbGF5ZXJJZCkpIHtcbiAgICAgICAgICAgICAgICAvLyDmm7TmlrDnq57mioDluIHmmL7npLpcbiAgICAgICAgICAgICAgICBpZiAocGxheWVyU2NyaXB0Lmdsb2JhbGNvdW50X2xhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHBsYXllclNjcmlwdC5nbG9iYWxjb3VudF9sYWJlbC5zdHJpbmcgPSBTdHJpbmcobWF0Y2hDb2luKVxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW191cGRhdGVQbGF5ZXJNYXRjaENvaW5EaXNwbGF5XSDlt7Lmm7TmlrDnjqnlrrYgXCIsIHBsYXllcklkLCBcIiDnmoTnq57mioDluIHmmL7npLrkuLogXCIsIG1hdGNoQ29pbilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeS/neWtmOernuaKgOW4geWIsOeOqeWutuiEmuacrOWunuS+i1xuICAgICAgICAgICAgICAgIHBsYXllclNjcmlwdC5fbWF0Y2hDb2luID0gbWF0Y2hDb2luXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDjgJDnq57mioDlnLrjgJHlip/og73lh73mlbBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIPCfj4bjgJDnq57mioDlnLrjgJHmmL7npLrnq57mioDlnLrkuJPnlKjnu5PnrpflvLnnqpdcbiAgICAgKiDnq57mioDlnLrnu5PnrpfpobXkuI7mma7pgJrlnLrkuI3lkIzvvJpcbiAgICAgKiAtIOWPquaYvuekuu+8mui+k+i1ouOAgeWAjeaVsOOAgeW9k+WJjeavlOi1m+mHkeW4gVxuICAgICAqIC0g5LiN5pi+56S677ya57un57ut5ri45oiP44CB6L+U5Zue5aSn5Y6F5oyJ6ZKuXG4gICAgICogLSDmmL7npLrvvJpcIuS4i+S4gOWxgOW8gOWniyAxNeenklwiIOWAkuiuoeaXtlxuICAgICAqIFxuICAgICAqIPCflKfjgJDmlrDlop7jgJHlpoLmnpzmmK/mnIDnu4jnu5PnrpfvvIjlj6rmnIkz5Lq677yJ77yM6Lez6L+H5q2k5by556qX77yM562J5b6FIG9uQ29tcGV0aXRpb25DaGFtcGlvbiDmtojmga/mmL7npLrmjpLlkI1cbiAgICAgKi9cbiAgICBfc2hvd0NvbXBldGl0aW9uUmVzdWx0UG9wdXA6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu44CR5qOA5p+l5piv5ZCm5piv5pyA57uI57uT566X77yI5Y+q5pyJM+S6uuWPgui1m++8iVxuICAgICAgICAvLyDlpoLmnpzmmK/mnIDnu4jnu5PnrpfvvIzot7Pov4fmraTlvLnnqpfvvIznrYnlvoUgb25Db21wZXRpdGlvbkNoYW1waW9uIOa2iOaBr+aYvuekuuaOkuWQjVxuICAgICAgICBpZiAoZGF0YS5pc19maW5hbF9yb3VuZCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+GIFtfc2hvd0NvbXBldGl0aW9uUmVzdWx0UG9wdXBdIOajgOa1i+WIsOacgOe7iOe7k+eul++8iOWPquaciTPkurrvvInvvIzot7Pov4fkuK3pl7Tnu5PnrpflvLnnqpfvvIznrYnlvoXmjpLlkI3mtojmga9cIilcbiAgICAgICAgICAgIC8vIOS4jeaYvuekuuS4remXtOW8ueeql++8jOebtOaOpeetieW+hSBvbkNvbXBldGl0aW9uQ2hhbXBpb24g5raI5oGvXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIHdpblNpemUgPSBjYy53aW5TaXplXG4gICAgICAgIFxuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgdmFyIG15UGxheWVySWQgPSBteWdsb2JhbC5zb2NrZXQuZ2V0UGxheWVySW5mbygpLmlkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEuc2VydmVyUGxheWVySWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SURcbiAgICAgICAgXG4gICAgICAgIC8vIOWIpOaWrei+k+i1olxuICAgICAgICB2YXIgaXNXaW5uZXIgPSBmYWxzZVxuICAgICAgICB2YXIgbXlXaW5Hb2xkID0gMFxuICAgICAgICB2YXIgbXlNYXRjaENvaW4gPSAwICAvLyDwn5Sn44CQ5paw5aKe44CR5b2T5YmN546p5a6255qE6YeR5biB77yI5LuOZGF0YS5wbGF5ZXJz6I635Y+W77yJXG4gICAgICAgIFxuICAgICAgICBpZiAoZGF0YS5wbGF5ZXJzICYmIGRhdGEucGxheWVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEucGxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXIgPSBkYXRhLnBsYXllcnNbaV1cbiAgICAgICAgICAgICAgICBpZiAoU3RyaW5nKHBsYXllci5wbGF5ZXJfaWQpID09PSBTdHJpbmcobXlQbGF5ZXJJZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNXaW5uZXIgPSBwbGF5ZXIuaXNfd2lubmVyXG4gICAgICAgICAgICAgICAgICAgIG15V2luR29sZCA9IHBsYXllci53aW5fZ29sZFxuICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5LuO5pyN5Yqh56uv6L+U5Zue55qE546p5a625pWw5o2u5Lit6I635Y+W6YeR5biBXG4gICAgICAgICAgICAgICAgICAgIGlmIChwbGF5ZXIubWF0Y2hfY29pbiAhPT0gdW5kZWZpbmVkICYmIHBsYXllci5tYXRjaF9jb2luID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG15TWF0Y2hDb2luID0gcGxheWVyLm1hdGNoX2NvaW5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeabtOaWsOW9k+WJjeeOqeWutueahOmHkeW4geaYvuekulxuICAgICAgICB0aGlzLl9tYXRjaENvaW4gPSBteU1hdGNoQ29pblxuXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHmm7TmlrDmiYDmnInnjqnlrrbnmoTph5HluIHmmL7npLpcbiAgICAgICAgaWYgKGRhdGEucGxheWVycyAmJiBkYXRhLnBsYXllcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLnBsYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcGxheWVyID0gZGF0YS5wbGF5ZXJzW2ldXG4gICAgICAgICAgICAgICAgdmFyIHBsYXllcklkID0gcGxheWVyLnBsYXllcl9pZFxuICAgICAgICAgICAgICAgIHZhciBtYXRjaENvaW4gPSBwbGF5ZXIubWF0Y2hfY29pblxuXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeernuaKgOWcuuaooeW8j+S4i+abtOaWsOeOqeWutueahOmHkeW4geaYvuekulxuICAgICAgICAgICAgICAgIGlmIChtYXRjaENvaW4gIT09IHVuZGVmaW5lZCAmJiBtYXRjaENvaW4gPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVQbGF5ZXJNYXRjaENvaW5EaXNwbGF5KHBsYXllcklkLCBtYXRjaENvaW4pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNhbnZhcyA9IGNjLmZpbmQoXCJDYW52YXNcIikgfHwgY2MuZmluZChcIlVJX1JPT1RcIikgfHwgdGhpcy5ub2RlLnBhcmVudFxuICAgICAgICBpZiAoIWNhbnZhcykgY2FudmFzID0gdGhpcy5ub2RlXG4gICAgICAgIFxuICAgICAgICAvLyDpga7nvanlsYJcbiAgICAgICAgdmFyIG1hc2tOb2RlID0gbmV3IGNjLk5vZGUoXCJDb21wZXRpdGlvblJlc3VsdE1hc2tcIilcbiAgICAgICAgbWFza05vZGUuYWRkQ29tcG9uZW50KGNjLkJsb2NrSW5wdXRFdmVudHMpXG4gICAgICAgIG1hc2tOb2RlLmNvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoMCwgMzAsIDUwKSA6IG5ldyBjYy5Db2xvcigzMCwgMCwgMClcbiAgICAgICAgbWFza05vZGUub3BhY2l0eSA9IDIwMFxuICAgICAgICBtYXNrTm9kZS53aWR0aCA9IHdpblNpemUud2lkdGggKiAyXG4gICAgICAgIG1hc2tOb2RlLmhlaWdodCA9IHdpblNpemUuaGVpZ2h0ICogMlxuICAgICAgICBtYXNrTm9kZS56SW5kZXggPSA5OTlcbiAgICAgICAgbWFza05vZGUucGFyZW50ID0gY2FudmFzXG4gICAgICAgIFxuICAgICAgICAvLyDlvLnnqpflrrnlmahcbiAgICAgICAgdmFyIHBvcHVwTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ29tcGV0aXRpb25SZXN1bHRQb3B1cFwiKVxuICAgICAgICBwb3B1cE5vZGUuc2NhbGUgPSAwLjVcbiAgICAgICAgcG9wdXBOb2RlLm9wYWNpdHkgPSAwXG4gICAgICAgIHBvcHVwTm9kZS56SW5kZXggPSAxMDAwXG4gICAgICAgIHBvcHVwTm9kZS5wYXJlbnQgPSBjYW52YXNcbiAgICAgICAgXG4gICAgICAgIHZhciBwb3B1cFdpZHRoID0gNDUwXG4gICAgICAgIHZhciBwb3B1cEhlaWdodCA9IDM4MCAgLy8g8J+Up+OAkOiwg+aVtOOAkeWinuWKoOmrmOW6puS7peWuuee6s+WAkuiuoeaXtlxuICAgICAgICBcbiAgICAgICAgLy8g6IOM5pmvXG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkJnXCIpXG4gICAgICAgIHZhciBiZyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGJnLmZpbGxDb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDQwLCA1MCwgODAsIDI0MCkgOiBuZXcgY2MuQ29sb3IoNTAsIDM1LCA0MCwgMjQwKVxuICAgICAgICBiZy5yb3VuZFJlY3QoLXBvcHVwV2lkdGgvMiwgLXBvcHVwSGVpZ2h0LzIsIHBvcHVwV2lkdGgsIHBvcHVwSGVpZ2h0LCAyMClcbiAgICAgICAgYmcuZmlsbCgpXG4gICAgICAgIGJnLnN0cm9rZUNvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoMTAwLCAyMDAsIDI1NSkgOiBuZXcgY2MuQ29sb3IoMjAwLCAxMDAsIDEwMClcbiAgICAgICAgYmcubGluZVdpZHRoID0gM1xuICAgICAgICBiZy5yb3VuZFJlY3QoLXBvcHVwV2lkdGgvMiwgLXBvcHVwSGVpZ2h0LzIsIHBvcHVwV2lkdGgsIHBvcHVwSGVpZ2h0LCAyMClcbiAgICAgICAgYmcuc3Ryb2tlKClcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5qCH6aKYXG4gICAgICAgIHZhciB0aXRsZU5vZGUgPSBuZXcgY2MuTm9kZShcIlRpdGxlXCIpXG4gICAgICAgIHZhciB0aXRsZUxhYmVsID0gdGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdGl0bGVMYWJlbC5zdHJpbmcgPSBpc1dpbm5lciA/IFwi8J+OiSDog5zliKkg8J+OiVwiIDogXCLinJYg5aSx6LSlIOKcllwiXG4gICAgICAgIHRpdGxlTGFiZWwuZm9udFNpemUgPSAzNlxuICAgICAgICB0aXRsZU5vZGUuY29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcigxMDAsIDI1NSwgMjAwKSA6IG5ldyBjYy5Db2xvcigyNTUsIDE1MCwgMTUwKVxuICAgICAgICB0aXRsZU5vZGUueSA9IHBvcHVwSGVpZ2h0LzIgLSA1MFxuICAgICAgICB0aXRsZU5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR6L6T6LWi6YeR6aKdIC0g56ue5oqA5Zy65pi+56S6XCLph5HluIFcIu+8iOS4jeaYr+ernuaKgOW4ge+8iVxuICAgICAgICB2YXIgcmVzdWx0Tm9kZSA9IG5ldyBjYy5Ob2RlKFwiUmVzdWx0XCIpXG4gICAgICAgIHZhciByZXN1bHRMYWJlbCA9IHJlc3VsdE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICByZXN1bHRMYWJlbC5zdHJpbmcgPSBcIuacrOWxgOe7k+aenDogXCIgKyAobXlXaW5Hb2xkID49IDAgPyBcIitcIiA6IFwiXCIpICsgbXlXaW5Hb2xkICsgXCIg6YeR5biBXCJcbiAgICAgICAgcmVzdWx0TGFiZWwuZm9udFNpemUgPSAyOFxuICAgICAgICByZXN1bHROb2RlLmNvbG9yID0gbXlXaW5Hb2xkID49IDAgPyBuZXcgY2MuQ29sb3IoMTAwLCAyNTUsIDEwMCkgOiBuZXcgY2MuQ29sb3IoMjU1LCAxMDAsIDEwMClcbiAgICAgICAgcmVzdWx0Tm9kZS55ID0gcG9wdXBIZWlnaHQvMiAtIDEwMFxuICAgICAgICByZXN1bHROb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5YCN5pWwXG4gICAgICAgIHZhciBtdWx0aU5vZGUgPSBuZXcgY2MuTm9kZShcIk11bHRpcGxpZXJcIilcbiAgICAgICAgdmFyIG11bHRpTGFiZWwgPSBtdWx0aU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBtdWx0aUxhYmVsLnN0cmluZyA9IFwi5pys5bGA5YCN5pWwOiB4XCIgKyAoZGF0YS5tdWx0aXBsZSB8fCAxKVxuICAgICAgICBtdWx0aUxhYmVsLmZvbnRTaXplID0gMjRcbiAgICAgICAgbXVsdGlOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjIwLCAxNTApXG4gICAgICAgIG11bHRpTm9kZS55ID0gcG9wdXBIZWlnaHQvMiAtIDE0MFxuICAgICAgICBtdWx0aU5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5b2T5YmN6YeR5biB77yI5LiN5piv56ue5oqA5biB77yJXG4gICAgICAgIHZhciBjb2luTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTWF0Y2hDb2luXCIpXG4gICAgICAgIHZhciBjb2luTGFiZWwgPSBjb2luTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGNvaW5MYWJlbC5zdHJpbmcgPSBcIuW9k+WJjemHkeW4gTogXCIgKyB0aGlzLl9tYXRjaENvaW5cbiAgICAgICAgY29pbkxhYmVsLmZvbnRTaXplID0gMjRcbiAgICAgICAgY29pbk5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDEwMClcbiAgICAgICAgY29pbk5vZGUueSA9IHBvcHVwSGVpZ2h0LzIgLSAxODBcbiAgICAgICAgY29pbk5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeernuaKgOWcuuWAkuiuoeaXtlxuICAgICAgICAvLyDkuI3mmL7npLpcIue7p+e7rea4uOaIj1wi5ZKMXCLov5Tlm57lpKfljoVcIuaMiemSrlxuICAgICAgICAvLyDmmL7npLrmnI3liqHnq6/mjqfliLbnmoQzMOenkuWAkuiuoeaXtlxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5LuOIGdhbWVfb3ZlciDmlbDmja7kuK3ojrflj5bliJ3lp4vlgJLorqHml7bvvIznq4vljbPlkK/liqjmnKzlnLDlgJLorqHml7ZcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu44CR5LuO5pyN5Yqh56uv5pWw5o2u6I635Y+W5Yid5aeL5YCS6K6h5pe25YC8XG4gICAgICAgIHZhciBpbml0aWFsQ291bnRkb3duID0gZGF0YS5hcmVuYV9jb3VudGRvd24gfHwgMzBcbiAgICAgICAgXG4gICAgICAgIC8vIOWAkuiuoeaXtuaYvuekuuWuueWZqFxuICAgICAgICB2YXIgY291bnRkb3duQ29udGFpbmVyID0gbmV3IGNjLk5vZGUoXCJDb3VudGRvd25Db250YWluZXJcIilcbiAgICAgICAgY291bnRkb3duQ29udGFpbmVyLnkgPSAtcG9wdXBIZWlnaHQvMiArIDgwXG4gICAgICAgIGNvdW50ZG93bkNvbnRhaW5lci5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOWAkuiuoeaXtuaWh+Wtl1xuICAgICAgICB2YXIgY291bnRkb3duTGFiZWwgPSBuZXcgY2MuTm9kZShcIkNvdW50ZG93bkxhYmVsXCIpXG4gICAgICAgIHZhciBjb3VudGRvd25MYWJlbENvbXAgPSBjb3VudGRvd25MYWJlbC5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGNvdW50ZG93bkxhYmVsQ29tcC5zdHJpbmcgPSBcIuS4i+S4gOi9ruWwhuWcqCBcIiArIGluaXRpYWxDb3VudGRvd24gKyBcIiDnp5LlkI7lvIDlp4tcIlxuICAgICAgICBjb3VudGRvd25MYWJlbENvbXAuZm9udFNpemUgPSAyNlxuICAgICAgICBjb3VudGRvd25MYWJlbC5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIxNSwgMCkgIC8vIOmHkem7hOiJslxuICAgICAgICBjb3VudGRvd25MYWJlbC5wYXJlbnQgPSBjb3VudGRvd25Db250YWluZXJcbiAgICAgICAgXG4gICAgICAgIC8vIOWAkuiuoeaXtuaVsOWtl++8iOWkp+WPt+aYvuekuu+8iVxuICAgICAgICB2YXIgY291bnRkb3duTnVtYmVyID0gbmV3IGNjLk5vZGUoXCJDb3VudGRvd25OdW1iZXJcIilcbiAgICAgICAgdmFyIGNvdW50ZG93bk51bWJlckNvbXAgPSBjb3VudGRvd25OdW1iZXIuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBjb3VudGRvd25OdW1iZXJDb21wLnN0cmluZyA9IFN0cmluZyhpbml0aWFsQ291bnRkb3duKVxuICAgICAgICBjb3VudGRvd25OdW1iZXJDb21wLmZvbnRTaXplID0gNDhcbiAgICAgICAgY291bnRkb3duTnVtYmVyLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIGNvdW50ZG93bk51bWJlci55ID0gLTQ1XG4gICAgICAgIGNvdW50ZG93bk51bWJlci5wYXJlbnQgPSBjb3VudGRvd25Db250YWluZXJcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOaPj+i+ueaViOaenFxuICAgICAgICB2YXIgb3V0bGluZSA9IGNvdW50ZG93bk51bWJlci5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKVxuICAgICAgICBvdXRsaW5lLmNvbG9yID0gY2MuQ29sb3IuQkxBQ0tcbiAgICAgICAgb3V0bGluZS53aWR0aCA9IDJcbiAgICAgICAgXG4gICAgICAgIC8vIOW8ueWHuuWKqOeUu1xuICAgICAgICBjYy50d2Vlbihwb3B1cE5vZGUpXG4gICAgICAgICAgICAudG8oMC4zNSwgeyBzY2FsZTogMSwgb3BhY2l0eTogMjU1IH0sIHsgZWFzaW5nOiAnYmFja091dCcgfSlcbiAgICAgICAgICAgIC5zdGFydCgpXG4gICAgICAgIFxuICAgICAgICAvLyDkv53lrZjlvJXnlKhcbiAgICAgICAgdGhpcy5fZ2FtZVJlc3VsdFBvcHVwID0gcG9wdXBOb2RlXG4gICAgICAgIHRoaXMuX2dhbWVSZXN1bHRNYXNrID0gbWFza05vZGVcbiAgICAgICAgdGhpcy5fY291bnRkb3duTGFiZWxOb2RlID0gY291bnRkb3duTGFiZWxcbiAgICAgICAgdGhpcy5fY291bnRkb3duTnVtYmVyTm9kZSA9IGNvdW50ZG93bk51bWJlclxuICAgICAgICB0aGlzLl9hcmVuYUNvdW50ZG93blNlY29uZHMgPSBpbml0aWFsQ291bnRkb3duXG4gICAgICAgIFxuICAgICAgICAvLyDmkq3mlL7pn7PmlYhcbiAgICAgICAgdGhpcy5fcGxheUdhbWVSZXN1bHRTb3VuZChpc1dpbm5lcilcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR56uL5Y2z5ZCv5Yqo5pys5Zyw5YCS6K6h5pe25a6a5pe25ZmoXG4gICAgICAgIC8vIOWQjOaXtuazqOWGjOacjeWKoeerr+a2iOaBr+ebkeWQrO+8jOWPjOS/nemZqeehruS/neWAkuiuoeaXtuato+W4uOW3peS9nFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgXG4gICAgICAgIC8vIOWQr+WKqOacrOWcsOWAkuiuoeaXtuWumuaXtuWZqFxuICAgICAgICB0aGlzLl9zdGFydExvY2FsQXJlbmFDb3VudGRvd24oaW5pdGlhbENvdW50ZG93bilcbiAgICAgICAgXG4gICAgICAgIC8vIOazqOWGjOacjeWKoeerr+WAkuiuoeaXtua2iOaBr+ebkeWQrO+8iOS9nOS4uuWkh+S7ve+8iVxuICAgICAgICB0aGlzLl9zZXR1cEFyZW5hQ291bnRkb3duTGlzdGVuZXJzKClcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHlkK/liqjmnKzlnLDnq57mioDlnLrlgJLorqHml7ZcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gc2Vjb25kcyAtIOWIneWni+WAkuiuoeaXtuenkuaVsFxuICAgICAqL1xuICAgIF9zdGFydExvY2FsQXJlbmFDb3VudGRvd246IGZ1bmN0aW9uKHNlY29uZHMpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW19zdGFydExvY2FsQXJlbmFDb3VudGRvd25dIOW8gOWni+WQr+WKqOWAkuiuoeaXtiwgc2Vjb25kczpcIiwgc2Vjb25kcylcbiAgICAgICAgXG4gICAgICAgIC8vIOWBnOatouS5i+WJjeeahOWAkuiuoeaXtlxuICAgICAgICBpZiAodGhpcy5fbG9jYWxBcmVuYUNvdW50ZG93blRpbWVyKSB7XG4gICAgICAgICAgICB0aGlzLnVuc2NoZWR1bGUodGhpcy5fbG9jYWxBcmVuYUNvdW50ZG93blRpY2spXG4gICAgICAgICAgICB0aGlzLl9sb2NhbEFyZW5hQ291bnRkb3duVGltZXIgPSBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2FyZW5hQ291bnRkb3duU2Vjb25kcyA9IHNlY29uZHNcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHnoa7kv53liJ3lp4tVSeato+ehruaYvuekulxuICAgICAgICB0aGlzLl91cGRhdGVBcmVuYUNvdW50ZG93blVJKHNlY29uZHMpXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55SoIGNjLmRpcmVjdG9yIOeahOaXtumXtOiwg+W6pu+8jOehruS/neWcqOaJgOacieaDheWGteS4i+mDveiDveW3peS9nFxuICAgICAgICAvLyDmr4/np5J0aWNr5LiA5qyh77yM5peg6ZmQ6YeN5aSNXG4gICAgICAgIHRoaXMuc2NoZWR1bGUodGhpcy5fbG9jYWxBcmVuYUNvdW50ZG93blRpY2ssIDEsIGNjLm1hY3JvLlJFUEVBVF9GT1JFVkVSLCAxKVxuICAgICAgICB0aGlzLl9sb2NhbEFyZW5hQ291bnRkb3duVGltZXIgPSB0cnVlXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW19zdGFydExvY2FsQXJlbmFDb3VudGRvd25dIOacrOWcsOWAkuiuoeaXtuW3suWQr+WKqFwiKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeacrOWcsOernuaKgOWcuuWAkuiuoeaXtlRpY2tcbiAgICAgKi9cbiAgICBfbG9jYWxBcmVuYUNvdW50ZG93blRpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fYXJlbmFDb3VudGRvd25TZWNvbmRzIDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMudW5zY2hlZHVsZSh0aGlzLl9sb2NhbEFyZW5hQ291bnRkb3duVGljaylcbiAgICAgICAgICAgIHRoaXMuX2xvY2FsQXJlbmFDb3VudGRvd25UaW1lciA9IG51bGxcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbX2xvY2FsQXJlbmFDb3VudGRvd25UaWNrXSDlgJLorqHml7bnu5PmnZ/vvIznrYnlvoXmnI3liqHnq6/mtojmga8uLi5cIilcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeWAkuiuoeaXtuW9kjDlkI7mmL7npLrnrYnlvoXmj5DnpLrvvIznu6fnu63nrYnlvoXmnI3liqHnq6/mtojmga9cbiAgICAgICAgICAgIC8vIOacjeWKoeerr+S8muWPkemAgSBNc2dBcmVuYUF1dG9SZWFkeSDmiJbmlrDkuIDova7muLjmiI/mtojmga9cbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZUFyZW5hQ291bnRkb3duVUkoMClcbiAgICAgICAgICAgIHRoaXMuX3Nob3dXYWl0aW5nRm9yU2VydmVyKClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9hcmVuYUNvdW50ZG93blNlY29uZHMtLVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05pawVUlcbiAgICAgICAgdGhpcy5fdXBkYXRlQXJlbmFDb3VudGRvd25VSSh0aGlzLl9hcmVuYUNvdW50ZG93blNlY29uZHMpXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW19sb2NhbEFyZW5hQ291bnRkb3duVGlja10g5Ymp5L2ZOlwiLCB0aGlzLl9hcmVuYUNvdW50ZG93blNlY29uZHMpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5pi+56S6562J5b6F5pyN5Yqh56uv5ZON5bqU5o+Q56S6XG4gICAgICovXG4gICAgX3Nob3dXYWl0aW5nRm9yU2VydmVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g5pu05paw5YCS6K6h5pe25qCH562+5pi+56S6562J5b6F5o+Q56S6XG4gICAgICAgIGlmICh0aGlzLl9jb3VudGRvd25MYWJlbE5vZGUpIHtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IHRoaXMuX2NvdW50ZG93bkxhYmVsTm9kZS5nZXRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5zdHJpbmcgPSBcIuetieW+heacjeWKoeWZqOWTjeW6lC4uLlwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmakOiXj+aVsOWtl1xuICAgICAgICBpZiAodGhpcy5fY291bnRkb3duTnVtYmVyTm9kZSkge1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gdGhpcy5fY291bnRkb3duTnVtYmVyTm9kZS5nZXRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5zdHJpbmcgPSBcIi4uLlwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHorr7nva7nq57mioDlnLrlgJLorqHml7bmtojmga/nm5HlkKxcbiAgICAgKiDnm5HlkKzmnI3liqHnq6/mjqjpgIHnmoTlgJLorqHml7bmtojmga/vvIjkvZzkuLrmnKzlnLDlgJLorqHml7bnmoTlpIfku73lkozlkIzmraXvvIlcbiAgICAgKi9cbiAgICBfc2V0dXBBcmVuYUNvdW50ZG93bkxpc3RlbmVyczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgXG4gICAgICAgIGlmICghbXlnbG9iYWwgfHwgIW15Z2xvYmFsLnNvY2tldCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+Pn++4jyBbX3NldHVwQXJlbmFDb3VudGRvd25MaXN0ZW5lcnNdIHNvY2tldOacquWIneWni+WMllwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOebkeWQrOWAkuiuoeaXtuW8gOWni+a2iOaBr++8iOWmguaenOacjeWKoeerr+mHjeaWsOWPkemAge+8iVxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25BcmVuYVJvdW5kQ291bnRkb3duKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbb25BcmVuYVJvdW5kQ291bnRkb3duXSDmlLbliLDlgJLorqHml7blvIDlp4s6XCIsIGRhdGEpXG4gICAgICAgICAgICAvLyDlkIzmraXmnI3liqHnq6/nmoTlgJLorqHml7blgLxcbiAgICAgICAgICAgIHNlbGYuX2FyZW5hQ291bnRkb3duU2Vjb25kcyA9IGRhdGEuc2Vjb25kcyB8fCAzMFxuICAgICAgICAgICAgc2VsZi5fdXBkYXRlQXJlbmFDb3VudGRvd25VSShkYXRhLnNlY29uZHMpXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICAvLyDnm5HlkKzlgJLorqHml7bmr4/np5Lmm7TmlrDmtojmga/vvIjlkIzmraXmnI3liqHnq6/nmoTlgJLorqHml7bvvIlcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQXJlbmFDb3VudGRvd25UaWNrKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbb25BcmVuYUNvdW50ZG93blRpY2tdIOacjeWKoeerr+WAkuiuoeaXtuWQjOatpTpcIiwgZGF0YS5zZWNvbmRzKVxuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruOAkeWQjOatpeacjeWKoeerr+eahOWAkuiuoeaXtuWAvO+8jOehruS/neS4juacjeWKoeerr+S4gOiHtFxuICAgICAgICAgICAgc2VsZi5fYXJlbmFDb3VudGRvd25TZWNvbmRzID0gZGF0YS5zZWNvbmRzXG4gICAgICAgICAgICBzZWxmLl91cGRhdGVBcmVuYUNvdW50ZG93blVJKGRhdGEuc2Vjb25kcylcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIOebkeWQrOiHquWKqOWHhuWkh+a2iOaBr1xuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25BcmVuYUF1dG9SZWFkeShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW29uQXJlbmFBdXRvUmVhZHldIOiHquWKqOWHhuWkhzpcIiwgZGF0YS5tZXNzYWdlKVxuICAgICAgICAgICAgLy8g5YGc5q2i5pys5Zyw5YCS6K6h5pe2XG4gICAgICAgICAgICBpZiAoc2VsZi5fbG9jYWxBcmVuYUNvdW50ZG93blRpbWVyKSB7XG4gICAgICAgICAgICAgICAgc2VsZi51bnNjaGVkdWxlKHNlbGYuX2xvY2FsQXJlbmFDb3VudGRvd25UaWNrKVxuICAgICAgICAgICAgICAgIHNlbGYuX2xvY2FsQXJlbmFDb3VudGRvd25UaW1lciA9IG51bGxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuX3Nob3dBcmVuYUF1dG9SZWFkeU1lc3NhZ2UoZGF0YS5tZXNzYWdlKVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8g55uR5ZCs5pat57q/6YeN6L+e54q25oCB5oGi5aSNXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkFyZW5hUmVjb25uZWN0U3RhdGUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtvbkFyZW5hUmVjb25uZWN0U3RhdGVdIOeKtuaAgeaBouWkjTpcIiwgZGF0YSlcbiAgICAgICAgICAgIGlmIChkYXRhLnBoYXNlID09PSBcImNvdW50ZG93blwiKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fYXJlbmFDb3VudGRvd25TZWNvbmRzID0gZGF0YS5jb3VudGRvd25cbiAgICAgICAgICAgICAgICBzZWxmLl91cGRhdGVBcmVuYUNvdW50ZG93blVJKGRhdGEuY291bnRkb3duKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeabtOaWsOernuaKgOWcuuWAkuiuoeaXtlVJXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHNlY29uZHMgLSDliankvZnnp5LmlbBcbiAgICAgKi9cbiAgICBfdXBkYXRlQXJlbmFDb3VudGRvd25VSTogZnVuY3Rpb24oc2Vjb25kcykge1xuICAgICAgICAvLyDmm7TmlrDmloflrZdcbiAgICAgICAgaWYgKHRoaXMuX2NvdW50ZG93bkxhYmVsTm9kZSkge1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gdGhpcy5fY291bnRkb3duTGFiZWxOb2RlLmdldENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIGxhYmVsLnN0cmluZyA9IFwi5LiL5LiA6L2u5bCG5ZyoIFwiICsgc2Vjb25kcyArIFwiIOenkuWQjuW8gOWni1wiXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOaVsOWtl1xuICAgICAgICBpZiAodGhpcy5fY291bnRkb3duTnVtYmVyTm9kZSkge1xuICAgICAgICAgICAgdmFyIG51bUxhYmVsID0gdGhpcy5fY291bnRkb3duTnVtYmVyTm9kZS5nZXRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICBpZiAobnVtTGFiZWwpIHtcbiAgICAgICAgICAgICAgICBudW1MYWJlbC5zdHJpbmcgPSBTdHJpbmcoc2Vjb25kcylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5pyA5ZCONeenkumXqueDgeaViOaenFxuICAgICAgICAgICAgaWYgKHNlY29uZHMgPD0gNSAmJiBzZWNvbmRzID4gMCkge1xuICAgICAgICAgICAgICAgIGNjLnR3ZWVuKHRoaXMuX2NvdW50ZG93bk51bWJlck5vZGUpXG4gICAgICAgICAgICAgICAgICAgIC50bygwLjEsIHsgc2NhbGU6IDEuMiB9KVxuICAgICAgICAgICAgICAgICAgICAudG8oMC4xLCB7IHNjYWxlOiAxLjAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDlj5jnuqJcbiAgICAgICAgICAgICAgICB0aGlzLl9jb3VudGRvd25OdW1iZXJOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMTAwLCAxMDApXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvdW50ZG93bk51bWJlck5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeWBnOatouernuaKgOWcuuWAkuiuoeaXtlxuICAgICAqL1xuICAgIF9zdG9wQXJlbmFDb3VudGRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDlgZzmraLmnKzlnLDlgJLorqHml7blrprml7blmahcbiAgICAgICAgaWYgKHRoaXMuX2xvY2FsQXJlbmFDb3VudGRvd25UaW1lcikge1xuICAgICAgICAgICAgdGhpcy51bnNjaGVkdWxlKHRoaXMuX2xvY2FsQXJlbmFDb3VudGRvd25UaWNrKVxuICAgICAgICAgICAgdGhpcy5fbG9jYWxBcmVuYUNvdW50ZG93blRpbWVyID0gbnVsbFxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtfc3RvcEFyZW5hQ291bnRkb3duXSDlt7LlgZzmraLmnKzlnLDlgJLorqHml7ZcIilcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6YeN572u5YCS6K6h5pe256eS5pWwXG4gICAgICAgIHRoaXMuX2FyZW5hQ291bnRkb3duU2Vjb25kcyA9IDBcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHmmL7npLrnq57mioDlnLroh6rliqjlh4blpIfmtojmga9cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZSAtIOa2iOaBr+WGheWuuVxuICAgICAqL1xuICAgIF9zaG93QXJlbmFBdXRvUmVhZHlNZXNzYWdlOiBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgIC8vIOabtOaWsOWAkuiuoeaXtuaYvuekuuS4uuiHquWKqOWHhuWkh+a2iOaBr1xuICAgICAgICBpZiAodGhpcy5fY291bnRkb3duTGFiZWxOb2RlKSB7XG4gICAgICAgICAgICB2YXIgbGFiZWwgPSB0aGlzLl9jb3VudGRvd25MYWJlbE5vZGUuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgaWYgKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgbGFiZWwuc3RyaW5nID0gbWVzc2FnZSB8fCBcIuezu+e7n+W3suiHquWKqOWHhuWkh1wiXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmakOiXj+aVsOWtl1xuICAgICAgICBpZiAodGhpcy5fY291bnRkb3duTnVtYmVyTm9kZSkge1xuICAgICAgICAgICAgdGhpcy5fY291bnRkb3duTnVtYmVyTm9kZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCfj4bjgJDnq57mioDlnLrjgJHlpITnkIbnq57mioDlnLrnirbmgIHmm7TmlrBcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIHsgcm9vbV9jYXRlZ29yeSwgcm91bmQsIHRvdGFsX3JvdW5kcywgbWF0Y2hfY29pbiwgLi4uIH1cbiAgICAgKi9cbiAgICBfb25Db21wZXRpdGlvblN0YXR1czogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBcbiAgICAgICAgdGhpcy5faXNDb21wZXRpdGlvbiA9IChkYXRhLnJvb21fY2F0ZWdvcnkgPT09IDIpXG4gICAgICAgIHRoaXMuX3Jvb21DYXRlZ29yeSA9IGRhdGEucm9vbV9jYXRlZ29yeSB8fCAxXG4gICAgICAgIHRoaXMuX2NvbXBldGl0aW9uUm91bmQgPSBkYXRhLnJvdW5kIHx8IDBcbiAgICAgICAgdGhpcy5fY29tcGV0aXRpb25Ub3RhbFJvdW5kcyA9IGRhdGEudG90YWxfcm91bmRzIHx8IDBcbiAgICAgICAgdGhpcy5fbWF0Y2hDb2luID0gZGF0YS5tYXRjaF9jb2luIHx8IDBcbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenOaYr+ernuaKgOWcuuaooeW8j++8jOaYvuekuuavlOi1m+mHkeW4gVxuICAgICAgICBpZiAodGhpcy5faXNDb21wZXRpdGlvbikge1xuICAgICAgICAgICAgdGhpcy5fc2hvd01hdGNoQ29pbkRpc3BsYXkoKVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5WQ44CQ56ue5oqA5Zy644CR5aSE55CG56ue5oqA5Zy65YCS6K6h5pe2XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSB7IGNvdW50ZG93biwgbWVzc2FnZSB9XG4gICAgICovXG4gICAgX29uQ29tcGV0aXRpb25Db3VudGRvd246IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2NvbXBldGl0aW9uQ291bnRkb3duID0gZGF0YS5jb3VudGRvd24gfHwgMTVcbiAgICAgICAgXG4gICAgICAgIC8vIOWBnOatouS5i+WJjeeahOWAkuiuoeaXtlxuICAgICAgICBpZiAodGhpcy5fY29tcGV0aXRpb25Db3VudGRvd25UaW1lcikge1xuICAgICAgICAgICAgdGhpcy51bnNjaGVkdWxlKHRoaXMuX2NvbXBldGl0aW9uQ291bnRkb3duVGljaylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5byA5aeL5paw55qE5YCS6K6h5pe2XG4gICAgICAgIHRoaXMuc2NoZWR1bGUodGhpcy5fY29tcGV0aXRpb25Db3VudGRvd25UaWNrLCAxKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+VkOOAkOernuaKgOWcuuOAkeernuaKgOWcuuWAkuiuoeaXtlRpY2tcbiAgICAgKi9cbiAgICBfY29tcGV0aXRpb25Db3VudGRvd25UaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2NvbXBldGl0aW9uQ291bnRkb3duIDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMudW5zY2hlZHVsZSh0aGlzLl9jb21wZXRpdGlvbkNvdW50ZG93blRpY2spXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5fY29tcGV0aXRpb25Db3VudGRvd24tLVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw5YCS6K6h5pe25pi+56S6XG4gICAgICAgIHRoaXMuX3VwZGF0ZUNvbXBldGl0aW9uQ291bnRkb3duRGlzcGxheSgpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5WQ44CQ56ue5oqA5Zy644CR5pu05paw56ue5oqA5Zy65YCS6K6h5pe25pi+56S6XG4gICAgICovXG4gICAgX3VwZGF0ZUNvbXBldGl0aW9uQ291bnRkb3duRGlzcGxheTogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOWmguaenOaciee7k+eul+W8ueeql++8jOabtOaWsOWFtuS4reeahOWAkuiuoeaXtlxuICAgICAgICBpZiAodGhpcy5fZ2FtZVJlc3VsdFBvcHVwKSB7XG4gICAgICAgICAgICB2YXIgY291bnRkb3duTGFiZWwgPSB0aGlzLl9nYW1lUmVzdWx0UG9wdXAuZ2V0Q2hpbGRCeU5hbWUoXCJDb21wZXRpdGlvbkNvdW50ZG93blwiKVxuICAgICAgICAgICAgaWYgKGNvdW50ZG93bkxhYmVsICYmIGNvdW50ZG93bkxhYmVsLmdldENvbXBvbmVudChjYy5MYWJlbCkpIHtcbiAgICAgICAgICAgICAgICBjb3VudGRvd25MYWJlbC5nZXRDb21wb25lbnQoY2MuTGFiZWwpLnN0cmluZyA9IFwi5LiL5LiA5bGA5byA5aeLIFwiICsgdGhpcy5fY29tcGV0aXRpb25Db3VudGRvd24gKyBcIuenklwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCfqpnjgJDnq57mioDlnLrjgJHlpITnkIbmr5TotZvph5HluIHmm7TmlrBcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIHsgcGxheWVyX2lkLCBtYXRjaF9jb2luLCBkZWx0YSB9XG4gICAgICovXG4gICAgX29uTWF0Y2hDb2luVXBkYXRlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAoIW15Z2xvYmFsKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHZhciBteVBsYXllcklkID0gbXlnbG9iYWwuc29ja2V0LmdldFBsYXllckluZm8oKS5pZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLnNlcnZlclBsYXllcklkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEXG4gICAgICAgIFxuICAgICAgICAvLyDlj6rmm7TmlrDoh6rlt7HnmoTmr5TotZvph5HluIFcbiAgICAgICAgaWYgKFN0cmluZyhkYXRhLnBsYXllcl9pZCkgPT09IFN0cmluZyhteVBsYXllcklkKSkge1xuICAgICAgICAgICAgdGhpcy5fbWF0Y2hDb2luID0gZGF0YS5tYXRjaF9jb2luXG4gICAgICAgICAgICB0aGlzLl91cGRhdGVNYXRjaENvaW5EaXNwbGF5KGRhdGEubWF0Y2hfY29pbiwgZGF0YS5kZWx0YSlcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+qmeOAkOernuaKgOWcuuOAkeaYvuekuuavlOi1m+mHkeW4geaYvuekulxuICAgICAqL1xuICAgIF9zaG93TWF0Y2hDb2luRGlzcGxheTogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOajgOafpeaYr+WQpuW3suWtmOWcqOavlOi1m+mHkeW4geaYvuekuuiKgueCuVxuICAgICAgICBpZiAodGhpcy5fbWF0Y2hDb2luTm9kZSkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7rmr5TotZvph5HluIHmmL7npLroioLngrlcbiAgICAgICAgdmFyIG1hdGNoQ29pbk5vZGUgPSBuZXcgY2MuTm9kZShcIk1hdGNoQ29pbkRpc3BsYXlcIilcbiAgICAgICAgbWF0Y2hDb2luTm9kZS5zZXRQb3NpdGlvbigtMjAwLCAyODApICAvLyDlt6bkuIrop5LkvY3nva5cbiAgICAgICAgXG4gICAgICAgIC8vIOiDjOaZr1xuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCZ1wiKVxuICAgICAgICB2YXIgYmcgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBiZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoNTAsIDQwLCA4MCwgMjAwKVxuICAgICAgICBiZy5yb3VuZFJlY3QoLTgwLCAtMjAsIDE2MCwgNDAsIDEwKVxuICAgICAgICBiZy5maWxsKClcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IG1hdGNoQ29pbk5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOWbvuagh++8iOmHkeW4geWbvuagh++8iVxuICAgICAgICB2YXIgaWNvbk5vZGUgPSBuZXcgY2MuTm9kZShcIkljb25cIilcbiAgICAgICAgdmFyIGljb25MYWJlbCA9IGljb25Ob2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgaWNvbkxhYmVsLnN0cmluZyA9IFwi8J+qmVwiXG4gICAgICAgIGljb25MYWJlbC5mb250U2l6ZSA9IDIwXG4gICAgICAgIGljb25Ob2RlLnNldFBvc2l0aW9uKC01NSwgMClcbiAgICAgICAgaWNvbk5vZGUucGFyZW50ID0gbWF0Y2hDb2luTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5qCH562+XG4gICAgICAgIHZhciBsYWJlbE5vZGUgPSBuZXcgY2MuTm9kZShcIkxhYmVsXCIpXG4gICAgICAgIHZhciBsYWJlbCA9IGxhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGxhYmVsLnN0cmluZyA9IFwi5q+U6LWb6YeR5biBXCJcbiAgICAgICAgbGFiZWwuZm9udFNpemUgPSAxNFxuICAgICAgICBsYWJlbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjAwLCAyMDAsIDIwMClcbiAgICAgICAgbGFiZWxOb2RlLnNldFBvc2l0aW9uKC0yMCwgMClcbiAgICAgICAgbGFiZWxOb2RlLnBhcmVudCA9IG1hdGNoQ29pbk5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOaVsOWAvFxuICAgICAgICB2YXIgdmFsdWVOb2RlID0gbmV3IGNjLk5vZGUoXCJWYWx1ZVwiKVxuICAgICAgICB2YWx1ZU5vZGUubmFtZSA9IFwiTWF0Y2hDb2luVmFsdWVcIlxuICAgICAgICB2YXIgdmFsdWVMYWJlbCA9IHZhbHVlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHZhbHVlTGFiZWwuc3RyaW5nID0gU3RyaW5nKHRoaXMuX21hdGNoQ29pbilcbiAgICAgICAgdmFsdWVMYWJlbC5mb250U2l6ZSA9IDE4XG4gICAgICAgIHZhbHVlTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIyMCwgMTAwKVxuICAgICAgICB2YWx1ZU5vZGUuc2V0UG9zaXRpb24oNDUsIDApXG4gICAgICAgIHZhbHVlTm9kZS5wYXJlbnQgPSBtYXRjaENvaW5Ob2RlXG4gICAgICAgIFxuICAgICAgICBtYXRjaENvaW5Ob2RlLnBhcmVudCA9IHRoaXMubm9kZVxuICAgICAgICB0aGlzLl9tYXRjaENvaW5Ob2RlID0gbWF0Y2hDb2luTm9kZVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+qmeOAkOernuaKgOWcuuOAkeabtOaWsOavlOi1m+mHkeW4geaYvuekulxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBtYXRjaENvaW4gLSDmlrDnmoTmr5TotZvph5HluIHmlbDph49cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGVsdGEgLSDlj5jljJbph49cbiAgICAgKi9cbiAgICBfdXBkYXRlTWF0Y2hDb2luRGlzcGxheTogZnVuY3Rpb24obWF0Y2hDb2luLCBkZWx0YSkge1xuICAgICAgICBpZiAodGhpcy5fbWF0Y2hDb2luTm9kZSkge1xuICAgICAgICAgICAgdmFyIHZhbHVlTm9kZSA9IHRoaXMuX21hdGNoQ29pbk5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJNYXRjaENvaW5WYWx1ZVwiKVxuICAgICAgICAgICAgaWYgKHZhbHVlTm9kZSAmJiB2YWx1ZU5vZGUuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlTm9kZS5nZXRDb21wb25lbnQoY2MuTGFiZWwpLnN0cmluZyA9IFN0cmluZyhtYXRjaENvaW4pXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5pyJ5aKe6YeP77yM5pi+56S65Yqo55S7XG4gICAgICAgICAgICAgICAgaWYgKGRlbHRhICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Nob3dNYXRjaENvaW5EZWx0YUFuaW1hdGlvbihkZWx0YSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCfqpnjgJDnq57mioDlnLrjgJHmmL7npLrmr5TotZvph5HluIHlj5jljJbliqjnlLtcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGVsdGEgLSDlj5jljJbph49cbiAgICAgKi9cbiAgICBfc2hvd01hdGNoQ29pbkRlbHRhQW5pbWF0aW9uOiBmdW5jdGlvbihkZWx0YSkge1xuICAgICAgICBpZiAoIXRoaXMuX21hdGNoQ29pbk5vZGUpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65Y+Y5YyW6YeP5pi+56S66IqC54K5XG4gICAgICAgIHZhciBkZWx0YU5vZGUgPSBuZXcgY2MuTm9kZShcIkRlbHRhXCIpXG4gICAgICAgIHZhciBkZWx0YUxhYmVsID0gZGVsdGFOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgZGVsdGFMYWJlbC5zdHJpbmcgPSAoZGVsdGEgPj0gMCA/IFwiK1wiIDogXCJcIikgKyBkZWx0YVxuICAgICAgICBkZWx0YUxhYmVsLmZvbnRTaXplID0gMjRcbiAgICAgICAgZGVsdGFOb2RlLmNvbG9yID0gZGVsdGEgPj0gMCA/IG5ldyBjYy5Db2xvcigxMDAsIDI1NSwgMTAwKSA6IG5ldyBjYy5Db2xvcigyNTUsIDEwMCwgMTAwKVxuICAgICAgICBkZWx0YU5vZGUuc2V0UG9zaXRpb24oODAsIDApXG4gICAgICAgIGRlbHRhTm9kZS5wYXJlbnQgPSB0aGlzLl9tYXRjaENvaW5Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDpo5jlrZfliqjnlLtcbiAgICAgICAgY2MudHdlZW4oZGVsdGFOb2RlKVxuICAgICAgICAgICAgLnRvKDAuNSwgeyB5OiAzMCwgb3BhY2l0eTogMjU1IH0pXG4gICAgICAgICAgICAudG8oMC41LCB7IHk6IDUwLCBvcGFjaXR5OiAwIH0pXG4gICAgICAgICAgICAuY2FsbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBkZWx0YU5vZGUuZGVzdHJveSgpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0YXJ0KClcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCfqpnjgJDnq57mioDlnLrjgJHpmpDol4/mr5TotZvph5HluIHmmL7npLpcbiAgICAgKi9cbiAgICBfaGlkZU1hdGNoQ29pbkRpc3BsYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fbWF0Y2hDb2luTm9kZSkge1xuICAgICAgICAgICAgdGhpcy5fbWF0Y2hDb2luTm9kZS5kZXN0cm95KClcbiAgICAgICAgICAgIHRoaXMuX21hdGNoQ29pbk5vZGUgPSBudWxsXG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOKdjOOAkOernuaKgOWcuuOAkeWkhOeQhua3mOaxsOmAmuefpVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0geyByYW5rLCByZWFzb24sIHRvdGFsX3BsYXllcnMsIHJld2FyZHMgfVxuICAgICAqL1xuICAgIF9vbkNvbXBldGl0aW9uRWxpbWluYXRlZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBcbiAgICAgICAgLy8g5YGc5q2i5omA5pyJ5YCS6K6h5pe2XG4gICAgICAgIHRoaXMuX3N0b3BQbGF5Q291bnRkb3duKClcbiAgICAgICAgdGhpcy5fc3RvcEJpZENvdW50ZG93bigpXG4gICAgICAgIFxuICAgICAgICAvLyDpmpDol4/mr5TotZvph5HluIHmmL7npLpcbiAgICAgICAgdGhpcy5faGlkZU1hdGNoQ29pbkRpc3BsYXkoKVxuICAgICAgICBcbiAgICAgICAgLy8g5pi+56S65reY5rGw5by556qXXG4gICAgICAgIHRoaXMuX3Nob3dFbGltaW5hdGVkUG9wdXAoZGF0YSlcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOKdjOOAkOernuaKgOWcuuOAkeaYvuekuua3mOaxsOW8ueeql1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0geyByYW5rLCByZWFzb24sIHRvdGFsX3BsYXllcnMsIHJld2FyZHMgfVxuICAgICAqL1xuICAgIF9zaG93RWxpbWluYXRlZFBvcHVwOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB2YXIgd2luU2l6ZSA9IGNjLndpblNpemVcbiAgICAgICAgXG4gICAgICAgIHZhciBjYW52YXMgPSBjYy5maW5kKFwiQ2FudmFzXCIpIHx8IGNjLmZpbmQoXCJVSV9ST09UXCIpIHx8IHRoaXMubm9kZS5wYXJlbnRcbiAgICAgICAgaWYgKCFjYW52YXMpIGNhbnZhcyA9IHRoaXMubm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g6YGu572p5bGCXG4gICAgICAgIHZhciBtYXNrTm9kZSA9IG5ldyBjYy5Ob2RlKFwiRWxpbWluYXRlZE1hc2tcIilcbiAgICAgICAgbWFza05vZGUuYWRkQ29tcG9uZW50KGNjLkJsb2NrSW5wdXRFdmVudHMpXG4gICAgICAgIG1hc2tOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDAsIDAsIDApXG4gICAgICAgIG1hc2tOb2RlLm9wYWNpdHkgPSAxODBcbiAgICAgICAgbWFza05vZGUud2lkdGggPSB3aW5TaXplLndpZHRoICogMlxuICAgICAgICBtYXNrTm9kZS5oZWlnaHQgPSB3aW5TaXplLmhlaWdodCAqIDJcbiAgICAgICAgbWFza05vZGUuekluZGV4ID0gOTk5XG4gICAgICAgIG1hc2tOb2RlLnBhcmVudCA9IGNhbnZhc1xuICAgICAgICBcbiAgICAgICAgLy8g5by556qX5a655ZmoXG4gICAgICAgIHZhciBwb3B1cE5vZGUgPSBuZXcgY2MuTm9kZShcIkVsaW1pbmF0ZWRQb3B1cFwiKVxuICAgICAgICBwb3B1cE5vZGUuc2NhbGUgPSAwLjVcbiAgICAgICAgcG9wdXBOb2RlLm9wYWNpdHkgPSAwXG4gICAgICAgIHBvcHVwTm9kZS56SW5kZXggPSAxMDAwXG4gICAgICAgIHBvcHVwTm9kZS5wYXJlbnQgPSBjYW52YXNcbiAgICAgICAgXG4gICAgICAgIHZhciBwb3B1cFdpZHRoID0gNDAwXG4gICAgICAgIHZhciBwb3B1cEhlaWdodCA9IDM1MFxuICAgICAgICBcbiAgICAgICAgLy8g6IOM5pmvXG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkJnXCIpXG4gICAgICAgIHZhciBiZyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGJnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig2MCwgNDAsIDUwLCAyNDApXG4gICAgICAgIGJnLnJvdW5kUmVjdCgtcG9wdXBXaWR0aC8yLCAtcG9wdXBIZWlnaHQvMiwgcG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQsIDIwKVxuICAgICAgICBiZy5maWxsKClcbiAgICAgICAgYmcuc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMTUwLCAxMDAsIDEwMClcbiAgICAgICAgYmcubGluZVdpZHRoID0gM1xuICAgICAgICBiZy5yb3VuZFJlY3QoLXBvcHVwV2lkdGgvMiwgLXBvcHVwSGVpZ2h0LzIsIHBvcHVwV2lkdGgsIHBvcHVwSGVpZ2h0LCAyMClcbiAgICAgICAgYmcuc3Ryb2tlKClcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5qCH6aKYXG4gICAgICAgIHZhciB0aXRsZU5vZGUgPSBuZXcgY2MuTm9kZShcIlRpdGxlXCIpXG4gICAgICAgIHZhciB0aXRsZUxhYmVsID0gdGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdGl0bGVMYWJlbC5zdHJpbmcgPSBcIuKdjCDmr5TotZvnu5PmnZ8g4p2MXCJcbiAgICAgICAgdGl0bGVMYWJlbC5mb250U2l6ZSA9IDMyXG4gICAgICAgIHRpdGxlTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDE1MCwgMTUwKVxuICAgICAgICB0aXRsZU5vZGUueSA9IHBvcHVwSGVpZ2h0LzIgLSA1MFxuICAgICAgICB0aXRsZU5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmjpLlkI1cbiAgICAgICAgdmFyIHJhbmtOb2RlID0gbmV3IGNjLk5vZGUoXCJSYW5rXCIpXG4gICAgICAgIHZhciByYW5rTGFiZWwgPSByYW5rTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHJhbmtMYWJlbC5zdHJpbmcgPSBcIuacgOe7iOaOkuWQjTog56ysIFwiICsgZGF0YS5yYW5rICsgXCIg5ZCNXCJcbiAgICAgICAgcmFua0xhYmVsLmZvbnRTaXplID0gMjRcbiAgICAgICAgcmFua05vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMjAsIDE1MClcbiAgICAgICAgcmFua05vZGUueSA9IHBvcHVwSGVpZ2h0LzIgLSAxMDBcbiAgICAgICAgcmFua05vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmt5jmsbDljp/lm6BcbiAgICAgICAgdmFyIHJlYXNvbk5vZGUgPSBuZXcgY2MuTm9kZShcIlJlYXNvblwiKVxuICAgICAgICB2YXIgcmVhc29uTGFiZWwgPSByZWFzb25Ob2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgcmVhc29uTGFiZWwuc3RyaW5nID0gZGF0YS5yZWFzb24gfHwgXCLmr5TotZvlpLHliKlcIlxuICAgICAgICByZWFzb25MYWJlbC5mb250U2l6ZSA9IDE4XG4gICAgICAgIHJlYXNvbk5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjAwLCAyMDAsIDIwMClcbiAgICAgICAgcmVhc29uTm9kZS55ID0gcG9wdXBIZWlnaHQvMiAtIDE0MFxuICAgICAgICByZWFzb25Ob2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5Y+C6LWb5Lq65pWwXG4gICAgICAgIHZhciB0b3RhbE5vZGUgPSBuZXcgY2MuTm9kZShcIlRvdGFsXCIpXG4gICAgICAgIHZhciB0b3RhbExhYmVsID0gdG90YWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdG90YWxMYWJlbC5zdHJpbmcgPSBcIuWFsSBcIiArIChkYXRhLnRvdGFsX3BsYXllcnMgfHwgMCkgKyBcIiDkurrlj4LotZtcIlxuICAgICAgICB0b3RhbExhYmVsLmZvbnRTaXplID0gMTZcbiAgICAgICAgdG90YWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDE4MCwgMTgwLCAxODApXG4gICAgICAgIHRvdGFsTm9kZS55ID0gcG9wdXBIZWlnaHQvMiAtIDE4MFxuICAgICAgICB0b3RhbE5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDlpZblirHvvIjlpoLmnpzmnInvvIlcbiAgICAgICAgaWYgKGRhdGEucmV3YXJkcykge1xuICAgICAgICAgICAgdmFyIHJld2FyZE5vZGUgPSBuZXcgY2MuTm9kZShcIlJld2FyZFwiKVxuICAgICAgICAgICAgdmFyIHJld2FyZExhYmVsID0gcmV3YXJkTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICByZXdhcmRMYWJlbC5zdHJpbmcgPSBcIuiOt+W+l+WlluWKsTogXCIgKyAoZGF0YS5yZXdhcmRzLm5hbWUgfHwgSlNPTi5zdHJpbmdpZnkoZGF0YS5yZXdhcmRzKSlcbiAgICAgICAgICAgIHJld2FyZExhYmVsLmZvbnRTaXplID0gMThcbiAgICAgICAgICAgIHJld2FyZE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDEwMClcbiAgICAgICAgICAgIHJld2FyZE5vZGUueSA9IHBvcHVwSGVpZ2h0LzIgLSAyMjBcbiAgICAgICAgICAgIHJld2FyZE5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOi/lOWbnuWkp+WOheaMiemSrlxuICAgICAgICB2YXIgYnRuTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUmV0dXJuQnRuXCIpXG4gICAgICAgIGJ0bk5vZGUuc2V0Q29udGVudFNpemUoMjAwLCA1MClcbiAgICAgICAgYnRuTm9kZS5hZGRDb21wb25lbnQoY2MuQmxvY2tJbnB1dEV2ZW50cylcbiAgICAgICAgdmFyIGJ0bkJnID0gYnRuTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGJ0bkJnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcigxMDAsIDgwLCAxNDApXG4gICAgICAgIGJ0bkJnLnJvdW5kUmVjdCgtMTAwLCAtMjUsIDIwMCwgNTAsIDI1KVxuICAgICAgICBidG5CZy5maWxsKClcbiAgICAgICAgYnRuTm9kZS55ID0gLXBvcHVwSGVpZ2h0LzIgKyA1MFxuICAgICAgICBidG5Ob2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgdmFyIGJ0bkxhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIilcbiAgICAgICAgdmFyIGJ0bkxhYmVsID0gYnRuTGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgYnRuTGFiZWwuc3RyaW5nID0gXCLov5Tlm57lpKfljoVcIlxuICAgICAgICBidG5MYWJlbC5mb250U2l6ZSA9IDIyXG4gICAgICAgIGJ0bkxhYmVsTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICBidG5MYWJlbE5vZGUucGFyZW50ID0gYnRuTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g54K55Ye75LqL5Lu2XG4gICAgICAgIGJ0bk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIOmUgOavgeW8ueeql1xuICAgICAgICAgICAgcG9wdXBOb2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgbWFza05vZGUuZGVzdHJveSgpXG4gICAgICAgICAgICAvLyDov5Tlm57lpKfljoVcbiAgICAgICAgICAgIHNlbGYuX3JldHVyblRvTG9iYnkoKVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8g5by55Ye65Yqo55S7XG4gICAgICAgIGNjLnR3ZWVuKHBvcHVwTm9kZSlcbiAgICAgICAgICAgIC50bygwLjMsIHsgc2NhbGU6IDEsIG9wYWNpdHk6IDI1NSB9LCB7IGVhc2luZzogJ2JhY2tPdXQnIH0pXG4gICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICBcbiAgICAgICAgdGhpcy5fZWxpbWluYXRlZFBvcHVwID0gcG9wdXBOb2RlXG4gICAgICAgIHRoaXMuX2VsaW1pbmF0ZWRNYXNrID0gbWFza05vZGVcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOKshu+4j+OAkOernuaKgOWcuuOAkeWkhOeQhuaZi+e6p+mAmuefpVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0geyBjdXJyZW50X3JvdW5kLCB0b3RhbF9yb3VuZHMsIG1hdGNoX2NvaW4sIG1lc3NhZ2UgfVxuICAgICAqL1xuICAgIF9vbkNvbXBldGl0aW9uQWR2YW5jZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBcbiAgICAgICAgdGhpcy5fY29tcGV0aXRpb25Sb3VuZCA9IGRhdGEuY3VycmVudF9yb3VuZFxuICAgICAgICB0aGlzLl9tYXRjaENvaW4gPSBkYXRhLm1hdGNoX2NvaW5cbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOavlOi1m+mHkeW4geaYvuekulxuICAgICAgICB0aGlzLl91cGRhdGVNYXRjaENvaW5EaXNwbGF5KGRhdGEubWF0Y2hfY29pbiwgMClcbiAgICAgICAgXG4gICAgICAgIC8vIOaYvuekuuaZi+e6p+aPkOekulxuICAgICAgICB0aGlzLl9zaG93QWR2YW5jZVRvYXN0KGRhdGEpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDirIbvuI/jgJDnq57mioDlnLrjgJHmmL7npLrmmYvnuqfmj5DnpLpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIHsgY3VycmVudF9yb3VuZCwgdG90YWxfcm91bmRzLCBtYXRjaF9jb2luLCBtZXNzYWdlIH1cbiAgICAgKi9cbiAgICBfc2hvd0FkdmFuY2VUb2FzdDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgdmFyIHdpblNpemUgPSBjYy53aW5TaXplXG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7pUb2FzdOiKgueCuVxuICAgICAgICB2YXIgdG9hc3ROb2RlID0gbmV3IGNjLk5vZGUoXCJBZHZhbmNlVG9hc3RcIilcbiAgICAgICAgdG9hc3ROb2RlLnNldFBvc2l0aW9uKDAsIDEwMClcbiAgICAgICAgdG9hc3ROb2RlLm9wYWNpdHkgPSAwXG4gICAgICAgIHRvYXN0Tm9kZS56SW5kZXggPSAyMDAwXG4gICAgICAgIHRvYXN0Tm9kZS5wYXJlbnQgPSB0aGlzLm5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOiDjOaZr1xuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCZ1wiKVxuICAgICAgICB2YXIgYmcgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBiZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoNTAsIDEwMCwgNTAsIDIyMClcbiAgICAgICAgYmcucm91bmRSZWN0KC0xNTAsIC0yNSwgMzAwLCA1MCwgMjUpXG4gICAgICAgIGJnLmZpbGwoKVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gdG9hc3ROb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmloflrZdcbiAgICAgICAgdmFyIGxhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIilcbiAgICAgICAgdmFyIGxhYmVsID0gbGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgbGFiZWwuc3RyaW5nID0gXCLwn46JIOaZi+e6p+aIkOWKn++8geesrCBcIiArIGRhdGEuY3VycmVudF9yb3VuZCArIFwiL1wiICsgZGF0YS50b3RhbF9yb3VuZHMgKyBcIiDova5cIlxuICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDIyXG4gICAgICAgIGxhYmVsTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjAwKVxuICAgICAgICBsYWJlbE5vZGUucGFyZW50ID0gdG9hc3ROb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDliqjnlLtcbiAgICAgICAgY2MudHdlZW4odG9hc3ROb2RlKVxuICAgICAgICAgICAgLnRvKDAuMywgeyBvcGFjaXR5OiAyNTUgfSlcbiAgICAgICAgICAgIC5kZWxheSgyKVxuICAgICAgICAgICAgLnRvKDAuMywgeyBvcGFjaXR5OiAwIH0pXG4gICAgICAgICAgICAuY2FsbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0b2FzdE5vZGUuZGVzdHJveSgpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0YXJ0KClcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCfj4bjgJDnq57mioDlnLrjgJHlpITnkIblhqDlhpvlvLnnqpdcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIHsgcmFuaywgcmV3YXJkcywgcmV3YXJkX3R5cGUsIHJhbmtpbmdzLCBtYXRjaF9jb2luIH1cbiAgICAgKi9cbiAgICBfb25Db21wZXRpdGlvbkNoYW1waW9uOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIFxuICAgICAgICAvLyDlgZzmraLmiYDmnInlgJLorqHml7ZcbiAgICAgICAgdGhpcy5fc3RvcFBsYXlDb3VudGRvd24oKVxuICAgICAgICB0aGlzLl9zdG9wQmlkQ291bnRkb3duKClcbiAgICAgICAgXG4gICAgICAgIC8vIOmakOiXj+avlOi1m+mHkeW4geaYvuekulxuICAgICAgICB0aGlzLl9oaWRlTWF0Y2hDb2luRGlzcGxheSgpXG4gICAgICAgIFxuICAgICAgICAvLyDmmL7npLrlhqDlhpvlvLnnqpdcbiAgICAgICAgdGhpcy5fc2hvd0NoYW1waW9uUG9wdXAoZGF0YSlcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCfj4bjgJDnq57mioDlnLrjgJHmmL7npLrlhqDlhpvlvLnnqpdcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIHsgcmFuaywgcmV3YXJkcywgcmV3YXJkX3R5cGUsIHJhbmtpbmdzLCBtYXRjaF9jb2luIH1cbiAgICAgKiDwn5Sn44CQ6YeN5p6E44CR5pi+56S65a6M5pW055qE5o6S5ZCN5YiX6KGo77yI5YmNMjDlkI3vvInvvIzljIXmi6zlhqDlhpvjgIHkuprlhpvjgIHlraPlhptcbiAgICAgKi9cbiAgICBfc2hvd0NoYW1waW9uUG9wdXA6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHZhciB3aW5TaXplID0gY2Mud2luU2l6ZVxuICAgICAgICBcbiAgICAgICAgdmFyIGNhbnZhcyA9IGNjLmZpbmQoXCJDYW52YXNcIikgfHwgY2MuZmluZChcIlVJX1JPT1RcIikgfHwgdGhpcy5ub2RlLnBhcmVudFxuICAgICAgICBpZiAoIWNhbnZhcykgY2FudmFzID0gdGhpcy5ub2RlXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6Zet5LmL5YmN55qE57uT566X5by556qX44CRXG4gICAgICAgIGlmICh0aGlzLl9nYW1lUmVzdWx0UG9wdXAgfHwgdGhpcy5fZ2FtZVJlc3VsdE1hc2spIHtcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlR2FtZVJlc3VsdFBvcHVwKHRoaXMuX2dhbWVSZXN1bHRQb3B1cCwgdGhpcy5fZ2FtZVJlc3VsdE1hc2spXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmBrue9qeWxglxuICAgICAgICB2YXIgbWFza05vZGUgPSBuZXcgY2MuTm9kZShcIkNoYW1waW9uTWFza1wiKVxuICAgICAgICBtYXNrTm9kZS5hZGRDb21wb25lbnQoY2MuQmxvY2tJbnB1dEV2ZW50cylcbiAgICAgICAgbWFza05vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjAsIDE1LCA0MClcbiAgICAgICAgbWFza05vZGUub3BhY2l0eSA9IDIyMFxuICAgICAgICBtYXNrTm9kZS53aWR0aCA9IHdpblNpemUud2lkdGggKiAyXG4gICAgICAgIG1hc2tOb2RlLmhlaWdodCA9IHdpblNpemUuaGVpZ2h0ICogMlxuICAgICAgICBtYXNrTm9kZS56SW5kZXggPSA5OTlcbiAgICAgICAgbWFza05vZGUucGFyZW50ID0gY2FudmFzXG4gICAgICAgIFxuICAgICAgICAvLyDlvLnnqpflrrnlmahcbiAgICAgICAgdmFyIHBvcHVwTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ2hhbXBpb25Qb3B1cFwiKVxuICAgICAgICBwb3B1cE5vZGUuc2NhbGUgPSAwLjVcbiAgICAgICAgcG9wdXBOb2RlLm9wYWNpdHkgPSAwXG4gICAgICAgIHBvcHVwTm9kZS56SW5kZXggPSAxMDAwXG4gICAgICAgIHBvcHVwTm9kZS5wYXJlbnQgPSBjYW52YXNcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDosIPmlbTjgJHlop7lpKflvLnnqpflsLrlr7jku6XlrrnnurPmm7TlpJrmjpLlkI1cbiAgICAgICAgdmFyIHBvcHVwV2lkdGggPSA1MjBcbiAgICAgICAgdmFyIHBvcHVwSGVpZ2h0ID0gNjIwXG4gICAgICAgIFxuICAgICAgICAvLyDog4zmma9cbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmdcIilcbiAgICAgICAgdmFyIGJnID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgYmcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDQ1LCAzNSwgNzAsIDI0NSlcbiAgICAgICAgYmcucm91bmRSZWN0KC1wb3B1cFdpZHRoLzIsIC1wb3B1cEhlaWdodC8yLCBwb3B1cFdpZHRoLCBwb3B1cEhlaWdodCwgMjApXG4gICAgICAgIGJnLmZpbGwoKVxuICAgICAgICBiZy5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIwMCwgODApXG4gICAgICAgIGJnLmxpbmVXaWR0aCA9IDNcbiAgICAgICAgYmcucm91bmRSZWN0KC1wb3B1cFdpZHRoLzIsIC1wb3B1cEhlaWdodC8yLCBwb3B1cFdpZHRoLCBwb3B1cEhlaWdodCwgMjApXG4gICAgICAgIGJnLnN0cm9rZSgpXG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOagh+mimFxuICAgICAgICB2YXIgdGl0bGVOb2RlID0gbmV3IGNjLk5vZGUoXCJUaXRsZVwiKVxuICAgICAgICB2YXIgdGl0bGVMYWJlbCA9IHRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHRpdGxlTGFiZWwuc3RyaW5nID0gXCLwn4+GIOavlOi1m+e7k+adnyDwn4+GXCJcbiAgICAgICAgdGl0bGVMYWJlbC5mb250U2l6ZSA9IDMyXG4gICAgICAgIHRpdGxlTGFiZWwuZW5hYmxlQm9sZCA9IHRydWVcbiAgICAgICAgdGl0bGVOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjIwLCAxMDApXG4gICAgICAgIHRpdGxlTm9kZS55ID0gcG9wdXBIZWlnaHQvMiAtIDQwXG4gICAgICAgIHRpdGxlTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHliY3kuInlkI3lsZXnpLrljLpcbiAgICAgICAgdmFyIHJhbmtpbmdzID0gZGF0YS5yYW5raW5ncyB8fCBbXVxuICAgICAgICB2YXIgdG9wVGhyZWVZID0gcG9wdXBIZWlnaHQvMiAtIDkwXG4gICAgICAgIFxuICAgICAgICBpZiAocmFua2luZ3MubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgIC8vIOWGoOWGm1xuICAgICAgICAgICAgdGhpcy5fY3JlYXRlUmFua2luZ0l0ZW0ocG9wdXBOb2RlLCByYW5raW5nc1swXSwgMSwgLTEyMCwgdG9wVGhyZWVZKVxuICAgICAgICB9XG4gICAgICAgIGlmIChyYW5raW5ncy5sZW5ndGggPj0gMikge1xuICAgICAgICAgICAgLy8g5Lqa5YabXG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVSYW5raW5nSXRlbShwb3B1cE5vZGUsIHJhbmtpbmdzWzFdLCAyLCAwLCB0b3BUaHJlZVkgLSAyMClcbiAgICAgICAgfVxuICAgICAgICBpZiAocmFua2luZ3MubGVuZ3RoID49IDMpIHtcbiAgICAgICAgICAgIC8vIOWto+WGm1xuICAgICAgICAgICAgdGhpcy5fY3JlYXRlUmFua2luZ0l0ZW0ocG9wdXBOb2RlLCByYW5raW5nc1syXSwgMywgMTIwLCB0b3BUaHJlZVkgLSA0MClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeWFtuS7luaOkuWQjeWIl+ihqOagh+mimFxuICAgICAgICBpZiAocmFua2luZ3MubGVuZ3RoID4gMykge1xuICAgICAgICAgICAgdmFyIG90aGVyVGl0bGVOb2RlID0gbmV3IGNjLk5vZGUoXCJPdGhlclRpdGxlXCIpXG4gICAgICAgICAgICB2YXIgb3RoZXJUaXRsZUxhYmVsID0gb3RoZXJUaXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgb3RoZXJUaXRsZUxhYmVsLnN0cmluZyA9IFwi4oCU4oCUIOWFtuS7luaOkuWQjSDigJTigJRcIlxuICAgICAgICAgICAgb3RoZXJUaXRsZUxhYmVsLmZvbnRTaXplID0gMThcbiAgICAgICAgICAgIG90aGVyVGl0bGVOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDE4MCwgMTgwLCAyMDApXG4gICAgICAgICAgICBvdGhlclRpdGxlTm9kZS55ID0gdG9wVGhyZWVZIC0gMTAwXG4gICAgICAgICAgICBvdGhlclRpdGxlTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeWFtuS7luaOkuWQjeWIl+ihqO+8iOesrDQtMjDlkI3vvIlcbiAgICAgICAgICAgIHZhciBzdGFydFkgPSB0b3BUaHJlZVkgLSAxMzBcbiAgICAgICAgICAgIHZhciBtYXhPdGhlclJhbmtpbmdzID0gTWF0aC5taW4ocmFua2luZ3MubGVuZ3RoLCAyMClcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAzOyBpIDwgbWF4T3RoZXJSYW5raW5nczsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJhbmtJbmZvID0gcmFua2luZ3NbaV1cbiAgICAgICAgICAgICAgICB2YXIgcmFua0l0ZW1Ob2RlID0gbmV3IGNjLk5vZGUoXCJSYW5rSXRlbV9cIiArIGkpXG4gICAgICAgICAgICAgICAgdmFyIHJhbmtJdGVtTGFiZWwgPSByYW5rSXRlbU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgICAgIHJhbmtJdGVtTGFiZWwuc3RyaW5nID0gXCLnrKxcIiArIHJhbmtJbmZvLnJhbmsgKyBcIuWQjTogXCIgKyByYW5rSW5mby5wbGF5ZXJfbmFtZSArIFwiICDph5HluIE6IFwiICsgcmFua0luZm8ubWF0Y2hfY29pblxuICAgICAgICAgICAgICAgIHJhbmtJdGVtTGFiZWwuZm9udFNpemUgPSAxNlxuICAgICAgICAgICAgICAgIHJhbmtJdGVtTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyMDAsIDIwMCwgMjEwKVxuICAgICAgICAgICAgICAgIHJhbmtJdGVtTm9kZS55ID0gc3RhcnRZIC0gKGkgLSAzKSAqIDI0XG4gICAgICAgICAgICAgICAgcmFua0l0ZW1Ob2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmjInpkq7ljLrln59cbiAgICAgICAgdmFyIGJ0blkgPSAtcG9wdXBIZWlnaHQvMiArIDUwXG4gICAgICAgIFxuICAgICAgICAvLyDnoa7lrprmjInpkq5cbiAgICAgICAgdmFyIGNvbmZpcm1CdG4gPSBuZXcgY2MuTm9kZShcIkNvbmZpcm1CdG5cIilcbiAgICAgICAgY29uZmlybUJ0bi5zZXRDb250ZW50U2l6ZSgxODAsIDQ1KVxuICAgICAgICBjb25maXJtQnRuLmFkZENvbXBvbmVudChjYy5CbG9ja0lucHV0RXZlbnRzKVxuICAgICAgICB2YXIgY29uZmlybUJnID0gY29uZmlybUJ0bi5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGNvbmZpcm1CZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjAwLCAxNTAsIDUwKVxuICAgICAgICBjb25maXJtQmcucm91bmRSZWN0KC05MCwgLTIyLjUsIDE4MCwgNDUsIDIyKVxuICAgICAgICBjb25maXJtQmcuZmlsbCgpXG4gICAgICAgIGNvbmZpcm1CdG4ueSA9IGJ0bllcbiAgICAgICAgY29uZmlybUJ0bi5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIHZhciBjb25maXJtTGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJMYWJlbFwiKVxuICAgICAgICB2YXIgY29uZmlybUxhYmVsID0gY29uZmlybUxhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGNvbmZpcm1MYWJlbC5zdHJpbmcgPSBcIui/lOWbnuWkp+WOhVwiXG4gICAgICAgIGNvbmZpcm1MYWJlbC5mb250U2l6ZSA9IDIwXG4gICAgICAgIGNvbmZpcm1MYWJlbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgY29uZmlybUxhYmVsTm9kZS5wYXJlbnQgPSBjb25maXJtQnRuXG4gICAgICAgIFxuICAgICAgICBjb25maXJtQnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBwb3B1cE5vZGUuZGVzdHJveSgpXG4gICAgICAgICAgICBtYXNrTm9kZS5kZXN0cm95KClcbiAgICAgICAgICAgIHNlbGYuX3JldHVyblRvTG9iYnkoKVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8g5by55Ye65Yqo55S7XG4gICAgICAgIGNjLnR3ZWVuKHBvcHVwTm9kZSlcbiAgICAgICAgICAgIC50bygwLjQsIHsgc2NhbGU6IDEsIG9wYWNpdHk6IDI1NSB9LCB7IGVhc2luZzogJ2JhY2tPdXQnIH0pXG4gICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICBcbiAgICAgICAgLy8g57KS5a2Q54m55pWIXG4gICAgICAgIHRoaXMuX2NyZWF0ZUNoYW1waW9uUGFydGljbGVzKHBvcHVwTm9kZSwgcG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQpXG4gICAgICAgIFxuICAgICAgICB0aGlzLl9jaGFtcGlvblBvcHVwID0gcG9wdXBOb2RlXG4gICAgICAgIHRoaXMuX2NoYW1waW9uTWFzayA9IG1hc2tOb2RlXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn4+F44CQ5paw5aKe44CR5Yib5bu65Y2V5Liq5o6S5ZCN6aG5XG4gICAgICogQHBhcmFtIHtjYy5Ob2RlfSBwYXJlbnQgLSDniLboioLngrlcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcmFua0luZm8gLSDmjpLlkI3kv6Hmga9cbiAgICAgKiBAcGFyYW0ge051bWJlcn0gcmFuayAtIOaOkuWQje+8iDEsIDIsIDPvvIlcbiAgICAgKiBAcGFyYW0ge051bWJlcn0geCAtIFjlnZDmoIdcbiAgICAgKiBAcGFyYW0ge051bWJlcn0geSAtIFnlnZDmoIdcbiAgICAgKi9cbiAgICBfY3JlYXRlUmFua2luZ0l0ZW06IGZ1bmN0aW9uKHBhcmVudCwgcmFua0luZm8sIHJhbmssIHgsIHkpIHtcbiAgICAgICAgdmFyIGl0ZW1Ob2RlID0gbmV3IGNjLk5vZGUoXCJSYW5rSXRlbV9cIiArIHJhbmspXG4gICAgICAgIGl0ZW1Ob2RlLnNldFBvc2l0aW9uKHgsIHkpXG4gICAgICAgIFxuICAgICAgICAvLyDmjpLlkI3og4zmma9cbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmdcIilcbiAgICAgICAgdmFyIGJnID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgXG4gICAgICAgIC8vIOagueaNruaOkuWQjeiuvue9ruS4jeWQjOminOiJslxuICAgICAgICB2YXIgYmdDb2xvclxuICAgICAgICBpZiAocmFuayA9PT0gMSkge1xuICAgICAgICAgICAgYmdDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIxNSwgMCwgMjAwKSAgLy8g6YeR6ImyXG4gICAgICAgIH0gZWxzZSBpZiAocmFuayA9PT0gMikge1xuICAgICAgICAgICAgYmdDb2xvciA9IG5ldyBjYy5Db2xvcigxOTIsIDE5MiwgMTkyLCAyMDApICAvLyDpk7boibJcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJnQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjA1LCAxMjcsIDUwLCAyMDApICAvLyDpk5zoibJcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgYmcuZmlsbENvbG9yID0gYmdDb2xvclxuICAgICAgICBiZy5yb3VuZFJlY3QoLTU1LCAtMzAsIDExMCwgNjAsIDEwKVxuICAgICAgICBiZy5maWxsKClcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmjpLlkI3moIfnrb5cbiAgICAgICAgdmFyIHJhbmtMYWJlbE5vZGUgPSBuZXcgY2MuTm9kZShcIlJhbmtMYWJlbFwiKVxuICAgICAgICB2YXIgcmFua0xhYmVsID0gcmFua0xhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHZhciByYW5rVGV4dFxuICAgICAgICBpZiAocmFuayA9PT0gMSkge1xuICAgICAgICAgICAgcmFua1RleHQgPSBcIvCfpYcg5Yag5YabXCJcbiAgICAgICAgfSBlbHNlIGlmIChyYW5rID09PSAyKSB7XG4gICAgICAgICAgICByYW5rVGV4dCA9IFwi8J+liCDkuprlhptcIlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmFua1RleHQgPSBcIvCfpYkg5a2j5YabXCJcbiAgICAgICAgfVxuICAgICAgICByYW5rTGFiZWwuc3RyaW5nID0gcmFua1RleHRcbiAgICAgICAgcmFua0xhYmVsLmZvbnRTaXplID0gMTZcbiAgICAgICAgcmFua0xhYmVsLmVuYWJsZUJvbGQgPSB0cnVlXG4gICAgICAgIHJhbmtMYWJlbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgcmFua0xhYmVsTm9kZS55ID0gMTJcbiAgICAgICAgcmFua0xhYmVsTm9kZS5wYXJlbnQgPSBpdGVtTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g546p5a625ZCN56ewXG4gICAgICAgIHZhciBuYW1lTGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJOYW1lTGFiZWxcIilcbiAgICAgICAgdmFyIG5hbWVMYWJlbCA9IG5hbWVMYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBuYW1lTGFiZWwuc3RyaW5nID0gcmFua0luZm8ucGxheWVyX25hbWUgfHwgXCLnjqnlrrZcIlxuICAgICAgICBuYW1lTGFiZWwuZm9udFNpemUgPSAxNFxuICAgICAgICBuYW1lTGFiZWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIG5hbWVMYWJlbE5vZGUueSA9IC04XG4gICAgICAgIG5hbWVMYWJlbE5vZGUucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOmHkeW4geaVsFxuICAgICAgICB2YXIgY29pbkxhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ29pbkxhYmVsXCIpXG4gICAgICAgIHZhciBjb2luTGFiZWwgPSBjb2luTGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgY29pbkxhYmVsLnN0cmluZyA9IHJhbmtJbmZvLm1hdGNoX2NvaW4gKyBcIiDph5HluIFcIlxuICAgICAgICBjb2luTGFiZWwuZm9udFNpemUgPSAxMlxuICAgICAgICBjb2luTGFiZWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyMDApXG4gICAgICAgIGNvaW5MYWJlbE5vZGUueSA9IC0yMlxuICAgICAgICBjb2luTGFiZWxOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICBpdGVtTm9kZS5wYXJlbnQgPSBwYXJlbnRcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCfjonjgJDnq57mioDlnLrjgJHliJvlu7rlhqDlhpvnspLlrZDnibnmlYhcbiAgICAgKi9cbiAgICBfY3JlYXRlQ2hhbXBpb25QYXJ0aWNsZXM6IGZ1bmN0aW9uKHBhcmVudE5vZGUsIHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgLy8g566A5Y2V55qE6YeR6Imy6Zeq54OB57KS5a2Q5pWI5p6cXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjA7IGkrKykge1xuICAgICAgICAgICAgKGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcnRpY2xlID0gbmV3IGNjLk5vZGUoXCJQYXJ0aWNsZV9cIiArIGluZGV4KVxuICAgICAgICAgICAgICAgIHBhcnRpY2xlLnNldFBvc2l0aW9uKFxuICAgICAgICAgICAgICAgICAgICAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiB3aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IC8gMiArIDUwXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBwYXJ0aWNsZUxhYmVsID0gcGFydGljbGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgICAgIHBhcnRpY2xlTGFiZWwuc3RyaW5nID0gXCLinKhcIlxuICAgICAgICAgICAgICAgIHBhcnRpY2xlTGFiZWwuZm9udFNpemUgPSAyMCArIE1hdGgucmFuZG9tKCkgKiAyMFxuICAgICAgICAgICAgICAgIHBhcnRpY2xlLnBhcmVudCA9IHBhcmVudE5vZGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjYy50d2VlbihwYXJ0aWNsZSlcbiAgICAgICAgICAgICAgICAgICAgLmRlbGF5KE1hdGgucmFuZG9tKCkgKiAwLjUpXG4gICAgICAgICAgICAgICAgICAgIC50bygyLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5OiAtaGVpZ2h0IC8gMiAtIDUwLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDogcGFydGljbGUueCArIChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIDEwMFxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuY2FsbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnRpY2xlLmRlc3Ryb3koKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICAgICAgfSkoaSlcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g8J+Up+OAkOaWsOWinuOAkeacgOe7iOamnOWNleWkhOeQhlxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIPCfj4bjgJDnq57mioDlnLrjgJHlpITnkIbmnIDnu4jmppzljZXmtojmga9cbiAgICAgKiDlvZPnq57mioDlnLrmiYDmnInova7mrKHnu5PmnZ/ml7bosIPnlKhcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIHsgcGVyaW9kX25vLCB0b3RhbF9wbGF5ZXJzLCB0b3AzLCB0b3AyMCwgbXlfcmFuaywgbXlfbWF0Y2hfY29pbiB9XG4gICAgICovXG4gICAgX29uVG91cm5hbWVudEZpbmFsUmFuazogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj4YgW19vblRvdXJuYW1lbnRGaW5hbFJhbmtdIOaUtuWIsOacgOe7iOamnOWNleaVsOaNrjpcIiwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpXG4gICAgICAgIFxuICAgICAgICAvLyDlgZzmraLmiYDmnInlgJLorqHml7ZcbiAgICAgICAgdGhpcy5fc3RvcFBsYXlDb3VudGRvd24oKVxuICAgICAgICB0aGlzLl9zdG9wQmlkQ291bnRkb3duKClcbiAgICAgICAgaWYgKHRoaXMuX2xvY2FsQXJlbmFDb3VudGRvd25UaW1lcikge1xuICAgICAgICAgICAgdGhpcy51bnNjaGVkdWxlKHRoaXMuX2xvY2FsQXJlbmFDb3VudGRvd25UaWNrKVxuICAgICAgICAgICAgdGhpcy5fbG9jYWxBcmVuYUNvdW50ZG93blRpbWVyID0gbnVsbFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDpmpDol4/mr5TotZvph5HluIHmmL7npLpcbiAgICAgICAgdGhpcy5faGlkZU1hdGNoQ29pbkRpc3BsYXkoKVxuICAgICAgICBcbiAgICAgICAgLy8g5YWz6Zet5LmL5YmN55qE57uT566X5by556qXXG4gICAgICAgIGlmICh0aGlzLl9nYW1lUmVzdWx0UG9wdXAgfHwgdGhpcy5fZ2FtZVJlc3VsdE1hc2spIHtcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlR2FtZVJlc3VsdFBvcHVwKHRoaXMuX2dhbWVSZXN1bHRQb3B1cCwgdGhpcy5fZ2FtZVJlc3VsdE1hc2spXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOaYvuekuuacgOe7iOamnOWNleW8ueeql1xuICAgICAgICB0aGlzLl9zaG93VG91cm5hbWVudEZpbmFsUmFua0RpYWxvZyhkYXRhKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+PhuOAkOernuaKgOWcuuOAkeaYvuekuuacgOe7iOamnOWNleW8ueeql++8iOWujOaVtOeJiCAtIOW4pua7muWKqOWIl+ihqO+8iVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0geyBwZXJpb2Rfbm8sIHRvdGFsX3BsYXllcnMsIHRvcDMsIHRvcDIwLCBteV9yYW5rLCBteV9tYXRjaF9jb2luIH1cbiAgICAgKi9cbiAgICBfc2hvd1RvdXJuYW1lbnRGaW5hbFJhbmtEaWFsb2c6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHZhciB3aW5TaXplID0gY2Mud2luU2l6ZVxuICAgICAgICBcbiAgICAgICAgdmFyIGNhbnZhcyA9IGNjLmZpbmQoXCJDYW52YXNcIikgfHwgY2MuZmluZChcIlVJX1JPT1RcIikgfHwgdGhpcy5ub2RlLnBhcmVudFxuICAgICAgICBpZiAoIWNhbnZhcykgY2FudmFzID0gdGhpcy5ub2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOmBrue9qeWxgiA9PT09PT09PT09XG4gICAgICAgIHZhciBtYXNrTm9kZSA9IG5ldyBjYy5Ob2RlKFwiRmluYWxSYW5rTWFza1wiKVxuICAgICAgICBtYXNrTm9kZS5hZGRDb21wb25lbnQoY2MuQmxvY2tJbnB1dEV2ZW50cylcbiAgICAgICAgbWFza05vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMTAsIDUsIDMwKVxuICAgICAgICBtYXNrTm9kZS5vcGFjaXR5ID0gMjAwXG4gICAgICAgIG1hc2tOb2RlLndpZHRoID0gd2luU2l6ZS53aWR0aCAqIDJcbiAgICAgICAgbWFza05vZGUuaGVpZ2h0ID0gd2luU2l6ZS5oZWlnaHQgKiAyXG4gICAgICAgIG1hc2tOb2RlLnpJbmRleCA9IDk5OVxuICAgICAgICBtYXNrTm9kZS5wYXJlbnQgPSBjYW52YXNcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0g5by556qX5a655ZmoID09PT09PT09PT1cbiAgICAgICAgdmFyIHBvcHVwTm9kZSA9IG5ldyBjYy5Ob2RlKFwiRmluYWxSYW5rUG9wdXBcIilcbiAgICAgICAgcG9wdXBOb2RlLnNjYWxlID0gMC4zXG4gICAgICAgIHBvcHVwTm9kZS5vcGFjaXR5ID0gMFxuICAgICAgICBwb3B1cE5vZGUuekluZGV4ID0gMTAwMFxuICAgICAgICBwb3B1cE5vZGUucGFyZW50ID0gY2FudmFzXG4gICAgICAgIFxuICAgICAgICAvLyDlvLnnqpflsLrlr7jvvIjpq5jluqbmlLnkuLrlsY/luZXpq5jluqbnmoQ4NSXvvIzpgb/lhY3muqLlh7rvvIlcbiAgICAgICAgdmFyIHBvcHVwV2lkdGggPSA2MDBcbiAgICAgICAgdmFyIHBvcHVwSGVpZ2h0ID0gTWF0aC5mbG9vcih3aW5TaXplLmhlaWdodCAqIDAuODUpXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOS4u+iDjOaZryA9PT09PT09PT09XG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkJnXCIpXG4gICAgICAgIHZhciBiZyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGJnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcigzMCwgMjIsIDU0LCAyNTApXG4gICAgICAgIGJnLnJvdW5kUmVjdCgtcG9wdXBXaWR0aC8yLCAtcG9wdXBIZWlnaHQvMiwgcG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQsIDE2KVxuICAgICAgICBiZy5maWxsKClcbiAgICAgICAgYmcuc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDgwKVxuICAgICAgICBiZy5saW5lV2lkdGggPSAzXG4gICAgICAgIGJnLnJvdW5kUmVjdCgtcG9wdXBXaWR0aC8yLCAtcG9wdXBIZWlnaHQvMiwgcG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQsIDE2KVxuICAgICAgICBiZy5zdHJva2UoKVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOmhtumDqOagh+mimOWMuuWfnyA9PT09PT09PT09XG4gICAgICAgIHZhciB0aXRsZUJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVCZ1wiKVxuICAgICAgICB2YXIgdGl0bGVCZyA9IHRpdGxlQmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgdGl0bGVCZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMTgwLCAxMzAsIDUwLCAyMjApXG4gICAgICAgIHRpdGxlQmcucm91bmRSZWN0KC1wb3B1cFdpZHRoLzIgKyA4LCBwb3B1cEhlaWdodC8yIC0gNTUsIHBvcHVwV2lkdGggLSAxNiwgNTAsIDgpXG4gICAgICAgIHRpdGxlQmcuZmlsbCgpXG4gICAgICAgIHRpdGxlQmdOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgdmFyIHRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIilcbiAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB0aXRsZUxhYmVsLnN0cmluZyA9IFwi8J+PhiDmr5TotZvnu5PmnZ8g8J+PhlwiXG4gICAgICAgIHRpdGxlTGFiZWwuZm9udFNpemUgPSAzMlxuICAgICAgICB0aXRsZUxhYmVsLmVuYWJsZUJvbGQgPSB0cnVlXG4gICAgICAgIHRpdGxlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICB0aXRsZU5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTAsIDIyMClcbiAgICAgICAgdGl0bGVOb2RlLnkgPSBwb3B1cEhlaWdodC8yIC0gMzJcbiAgICAgICAgdGl0bGVOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5Y+C6LWb5Lq65pWwXG4gICAgICAgIHZhciB0b3RhbE5vZGUgPSBuZXcgY2MuTm9kZShcIlRvdGFsXCIpXG4gICAgICAgIHZhciB0b3RhbExhYmVsID0gdG90YWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdG90YWxMYWJlbC5zdHJpbmcgPSBcIuWFsSBcIiArIChkYXRhLnRvdGFsX3BsYXllcnMgfHwgMykgKyBcIiDkurrlj4LotZtcIlxuICAgICAgICB0b3RhbExhYmVsLmZvbnRTaXplID0gMTZcbiAgICAgICAgdG90YWxMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHRvdGFsTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyMDAsIDIwMCwgMjIwKVxuICAgICAgICB0b3RhbE5vZGUueSA9IHBvcHVwSGVpZ2h0LzIgLSA3NVxuICAgICAgICB0b3RhbE5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IFRPUDMg6aKG5aWW5Y+w77yI57Sn5YeR5biD5bGA77yJPT09PT09PT09PVxuICAgICAgICB2YXIgdG9wMyA9IGRhdGEudG9wMyB8fCBbXVxuICAgICAgICB2YXIgcG9kaXVtWSA9IHBvcHVwSGVpZ2h0LzIgLSAxNDVcbiAgICAgICAgdmFyIHBvZGl1bVNwYWNpbmcgPSAxNzBcbiAgICAgICAgXG4gICAgICAgIC8vIOmTtueJjO+8iOesrOS6jOWQje+8iS0g5bem5L6nXG4gICAgICAgIGlmICh0b3AzLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVQb2RpdW1FbnRyeShwb3B1cE5vZGUsIHRvcDNbMV0sIDIsIC1wb2RpdW1TcGFjaW5nLCBwb2RpdW1ZKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDph5HniYzvvIjnrKzkuIDlkI3vvIktIOS4remXtO+8iOacgOmrmO+8iVxuICAgICAgICBpZiAodG9wMy5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgdGhpcy5fY3JlYXRlUG9kaXVtRW50cnkocG9wdXBOb2RlLCB0b3AzWzBdLCAxLCAwLCBwb2RpdW1ZICsgMjApXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmTnOeJjO+8iOesrOS4ieWQje+8iS0g5Y+z5L6nXG4gICAgICAgIGlmICh0b3AzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVQb2RpdW1FbnRyeShwb3B1cE5vZGUsIHRvcDNbMl0sIDMsIHBvZGl1bVNwYWNpbmcsIHBvZGl1bVkgLSAxMClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSDnrKw0LTIw5ZCN5rua5Yqo5YiX6KGo5Yy65Z+fID09PT09PT09PT1cbiAgICAgICAgdmFyIHRvcDIwID0gZGF0YS50b3AyMCB8fCBbXVxuICAgICAgICBpZiAodG9wMjAubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLy8g5YiX6KGo5Yy65Z+f5qCH6aKYXG4gICAgICAgICAgICB2YXIgbGlzdFRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTGlzdFRpdGxlXCIpXG4gICAgICAgICAgICB2YXIgbGlzdFRpdGxlTGFiZWwgPSBsaXN0VGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgIGxpc3RUaXRsZUxhYmVsLnN0cmluZyA9IFwi4oCU4oCUIOaOkuihjOamnCDigJTigJRcIlxuICAgICAgICAgICAgbGlzdFRpdGxlTGFiZWwuZm9udFNpemUgPSAxOFxuICAgICAgICAgICAgbGlzdFRpdGxlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICAgICAgbGlzdFRpdGxlTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigxODAsIDE2MCwgMTIwKVxuICAgICAgICAgICAgbGlzdFRpdGxlTm9kZS55ID0gcG9wdXBIZWlnaHQvMiAtIDI2MFxuICAgICAgICAgICAgbGlzdFRpdGxlTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5Yib5bu65rua5Yqo6KeG5Zu+5a655ZmoXG4gICAgICAgICAgICB2YXIgc2Nyb2xsVmlld05vZGUgPSBuZXcgY2MuTm9kZShcIlNjcm9sbFZpZXdcIilcbiAgICAgICAgICAgIHNjcm9sbFZpZXdOb2RlLndpZHRoID0gcG9wdXBXaWR0aCAtIDQwXG4gICAgICAgICAgICBzY3JvbGxWaWV3Tm9kZS5oZWlnaHQgPSAyODBcbiAgICAgICAgICAgIHNjcm9sbFZpZXdOb2RlLnkgPSAtMzBcbiAgICAgICAgICAgIHNjcm9sbFZpZXdOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmt7vliqDpga7nvannu4Tku7ZcbiAgICAgICAgICAgIHZhciBtYXNrID0gc2Nyb2xsVmlld05vZGUuYWRkQ29tcG9uZW50KGNjLk1hc2spXG4gICAgICAgICAgICBtYXNrLnR5cGUgPSBjYy5NYXNrLlR5cGUuUkVDVFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDliJvlu7rlhoXlrrnlrrnlmahcbiAgICAgICAgICAgIHZhciBjb250ZW50Tm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ29udGVudFwiKVxuICAgICAgICAgICAgY29udGVudE5vZGUud2lkdGggPSBwb3B1cFdpZHRoIC0gNDBcbiAgICAgICAgICAgIGNvbnRlbnROb2RlLmFuY2hvclkgPSAxXG4gICAgICAgICAgICBjb250ZW50Tm9kZS55ID0gc2Nyb2xsVmlld05vZGUuaGVpZ2h0IC8gMlxuICAgICAgICAgICAgY29udGVudE5vZGUucGFyZW50ID0gc2Nyb2xsVmlld05vZGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkei/h+a7pOaOieW3suWcqFRPUDPkuK3nmoTnjqnlrrbvvIzpgb/lhY3ph43lpI3mmL7npLpcbiAgICAgICAgICAgIHZhciB0b3AzUGxheWVySURzID0ge31cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG9wMy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0b3AzW2ldICYmIHRvcDNbaV0ucGxheWVyX2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvcDNQbGF5ZXJJRHNbdG9wM1tpXS5wbGF5ZXJfaWRdID0gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5Y+q5pi+56S656ysNOWQjeWPiuS5i+WQjueahOeOqeWutu+8iOi/h+a7pOaOiVRPUDPvvIlcbiAgICAgICAgICAgIHZhciBmaWx0ZXJlZFRvcDIwID0gW11cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG9wMjAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcmFua0RhdGEgPSB0b3AyMFtpXVxuICAgICAgICAgICAgICAgIC8vIOi3s+i/h+W3suWcqFRPUDPkuK3nmoTnjqnlrrZcbiAgICAgICAgICAgICAgICBpZiAocmFua0RhdGEgJiYgcmFua0RhdGEucGxheWVyX2lkICYmICF0b3AzUGxheWVySURzW3JhbmtEYXRhLnBsYXllcl9pZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWRUb3AyMC5wdXNoKHJhbmtEYXRhKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5re75Yqg5q+P5Liq5o6S6KGM6aG5XG4gICAgICAgICAgICB2YXIgaXRlbUhlaWdodCA9IDQ1XG4gICAgICAgICAgICB2YXIgc3RhcnRZID0gMFxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWx0ZXJlZFRvcDIwLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJhbmtEYXRhID0gZmlsdGVyZWRUb3AyMFtpXVxuICAgICAgICAgICAgICAgIHZhciBhY3R1YWxSYW5rID0gaSArIDQgIC8vIOesrDTlkI3lvIDlp4tcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgaXRlbU5vZGUgPSB0aGlzLl9jcmVhdGVSYW5rTGlzdEl0ZW0ocmFua0RhdGEsIGFjdHVhbFJhbmssIHBvcHVwV2lkdGggLSA1MClcbiAgICAgICAgICAgICAgICBpdGVtTm9kZS55ID0gc3RhcnRZIC0gaSAqIGl0ZW1IZWlnaHQgLSBpdGVtSGVpZ2h0IC8gMlxuICAgICAgICAgICAgICAgIGl0ZW1Ob2RlLnBhcmVudCA9IGNvbnRlbnROb2RlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOiuvue9ruWGheWuuemrmOW6plxuICAgICAgICAgICAgY29udGVudE5vZGUuaGVpZ2h0ID0gTWF0aC5tYXgoZmlsdGVyZWRUb3AyMC5sZW5ndGggKiBpdGVtSGVpZ2h0LCAyODApXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOa3u+WKoOinpuaRuOa7muWKqFxuICAgICAgICAgICAgdGhpcy5fYWRkU2Nyb2xsVmlld1RvdWNoKHNjcm9sbFZpZXdOb2RlLCBjb250ZW50Tm9kZSwgMjgwKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOW6lemDqOWMuuWfn++8iOaIkeeahOaOkuWQjSArIOaMiemSru+8iT09PT09PT09PT1cbiAgICAgICAgLy8g5YiG6ZqU57q/XG4gICAgICAgIHZhciBzZXBOb2RlID0gbmV3IGNjLk5vZGUoXCJCb3R0b21TZXBcIilcbiAgICAgICAgdmFyIHNlcCA9IHNlcE5vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBzZXAuc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDgwLCAxMDApXG4gICAgICAgIHNlcC5saW5lV2lkdGggPSAxXG4gICAgICAgIHNlcC5tb3ZlVG8oLXBvcHVwV2lkdGgvMiArIDMwLCAwKVxuICAgICAgICBzZXAubGluZVRvKHBvcHVwV2lkdGgvMiAtIDMwLCAwKVxuICAgICAgICBzZXAuc3Ryb2tlKClcbiAgICAgICAgc2VwTm9kZS55ID0gLXBvcHVwSGVpZ2h0LzIgKyAxNDBcbiAgICAgICAgc2VwTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOaIkeeahOaOkuWQjeiDjOaZr1xuICAgICAgICB2YXIgbXlSYW5rQmdOb2RlID0gbmV3IGNjLk5vZGUoXCJNeVJhbmtCZ1wiKVxuICAgICAgICB2YXIgbXlSYW5rQmcgPSBteVJhbmtCZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBteVJhbmtCZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoNTAsIDQ1LCA4MCwgMjAwKVxuICAgICAgICBteVJhbmtCZy5yb3VuZFJlY3QoLTIwMCwgLTIyLCA0MDAsIDQ0LCA4KVxuICAgICAgICBteVJhbmtCZy5maWxsKClcbiAgICAgICAgbXlSYW5rQmcuc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDgwLCAxNTApXG4gICAgICAgIG15UmFua0JnLmxpbmVXaWR0aCA9IDFcbiAgICAgICAgbXlSYW5rQmcucm91bmRSZWN0KC0yMDAsIC0yMiwgNDAwLCA0NCwgOClcbiAgICAgICAgbXlSYW5rQmcuc3Ryb2tlKClcbiAgICAgICAgbXlSYW5rQmdOb2RlLnkgPSAtcG9wdXBIZWlnaHQvMiArIDEwMFxuICAgICAgICBteVJhbmtCZ05vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmiJHnmoTmjpLlkI3mloflrZdcbiAgICAgICAgdmFyIG15UmFua05vZGUgPSBuZXcgY2MuTm9kZShcIk15UmFua1wiKVxuICAgICAgICB2YXIgbXlSYW5rTGFiZWwgPSBteVJhbmtOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgbXlSYW5rTGFiZWwuc3RyaW5nID0gXCLmiJHnmoTmjpLlkI06IOesrCBcIiArIChkYXRhLm15X3JhbmsgfHwgMSkgKyBcIiDlkI0gIHwgIOavlOi1m+mHkeW4gTogXCIgKyAoZGF0YS5teV9tYXRjaF9jb2luIHx8IDApXG4gICAgICAgIG15UmFua0xhYmVsLmZvbnRTaXplID0gMjBcbiAgICAgICAgbXlSYW5rTGFiZWwuZW5hYmxlQm9sZCA9IHRydWVcbiAgICAgICAgbXlSYW5rTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICBteVJhbmtOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjMwLCAxNTApXG4gICAgICAgIG15UmFua05vZGUueSA9IC1wb3B1cEhlaWdodC8yICsgMTAwXG4gICAgICAgIG15UmFua05vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOehruWumuaMiemSriA9PT09PT09PT09XG4gICAgICAgIHZhciBidG5Ob2RlID0gbmV3IGNjLk5vZGUoXCJDb25maXJtQnRuXCIpXG4gICAgICAgIGJ0bk5vZGUud2lkdGggPSAxODBcbiAgICAgICAgYnRuTm9kZS5oZWlnaHQgPSA1MFxuICAgICAgICBcbiAgICAgICAgdmFyIGJ0bkJnID0gYnRuTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGJ0bkJnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig3NiwgMTc1LCA4MClcbiAgICAgICAgYnRuQmcucm91bmRSZWN0KC05MCwgLTI1LCAxODAsIDUwLCAxMClcbiAgICAgICAgYnRuQmcuZmlsbCgpXG4gICAgICAgIGJ0bkJnLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDEyOSwgMTk5LCAxMzIpXG4gICAgICAgIGJ0bkJnLmxpbmVXaWR0aCA9IDJcbiAgICAgICAgYnRuQmcucm91bmRSZWN0KC05MCwgLTI1LCAxODAsIDUwLCAxMClcbiAgICAgICAgYnRuQmcuc3Ryb2tlKClcbiAgICAgICAgYnRuTm9kZS55ID0gLXBvcHVwSGVpZ2h0LzIgKyA0MFxuICAgICAgICBidG5Ob2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgdmFyIGJ0bkxhYmVsID0gbmV3IGNjLk5vZGUoXCJMYWJlbFwiKVxuICAgICAgICB2YXIgYnRuTGFiZWxDb21wID0gYnRuTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBidG5MYWJlbENvbXAuc3RyaW5nID0gXCLnoa4gIOWumlwiXG4gICAgICAgIGJ0bkxhYmVsQ29tcC5mb250U2l6ZSA9IDI0XG4gICAgICAgIGJ0bkxhYmVsQ29tcC5lbmFibGVCb2xkID0gdHJ1ZVxuICAgICAgICBidG5MYWJlbENvbXAuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICBidG5MYWJlbENvbXAudmVydGljYWxBbGlnbiA9IGNjLkxhYmVsLlZlcnRpY2FsQWxpZ24uQ0VOVEVSXG4gICAgICAgIGJ0bkxhYmVsLnNldENvbnRlbnRTaXplKDE4MCwgNTApXG4gICAgICAgIGJ0bkxhYmVsLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIGJ0bkxhYmVsLnNldFBvc2l0aW9uKDAsIDApXG4gICAgICAgIGJ0bkxhYmVsLnBhcmVudCA9IGJ0bk5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOaMiemSruinpuaRuOaViOaenFxuICAgICAgICBidG5Ob2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX1NUQVJULCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJ0bk5vZGUuc2NhbGUgPSAwLjk1XG4gICAgICAgIH0pXG4gICAgICAgIGJ0bk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJ0bk5vZGUuc2NhbGUgPSAxXG4gICAgICAgICAgICBwb3B1cE5vZGUuZGVzdHJveSgpXG4gICAgICAgICAgICBtYXNrTm9kZS5kZXN0cm95KClcbiAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZShcImhhbGxTY2VuZVwiKVxuICAgICAgICB9KVxuICAgICAgICBidG5Ob2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0NBTkNFTCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBidG5Ob2RlLnNjYWxlID0gMVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSDlvLnlh7rliqjnlLsgPT09PT09PT09PVxuICAgICAgICBjYy50d2Vlbihwb3B1cE5vZGUpXG4gICAgICAgICAgICAudG8oMC4yLCB7IHNjYWxlOiAxLjAsIG9wYWNpdHk6IDI1NSB9LCB7IGVhc2luZzogJ2JhY2tPdXQnIH0pXG4gICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCLwn4+GIFtfc2hvd1RvdXJuYW1lbnRGaW5hbFJhbmtEaWFsb2ddIOacgOe7iOamnOWNleW8ueeql+W3suaYvuekulwiKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog5Yib5bu65o6S6KGM5YiX6KGo6aG5XG4gICAgICovXG4gICAgX2NyZWF0ZVJhbmtMaXN0SXRlbTogZnVuY3Rpb24ocmFua0RhdGEsIHJhbmssIHdpZHRoKSB7XG4gICAgICAgIHZhciBpdGVtTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUmFua0l0ZW1fXCIgKyByYW5rKVxuICAgICAgICBpdGVtTm9kZS53aWR0aCA9IHdpZHRoXG4gICAgICAgIGl0ZW1Ob2RlLmhlaWdodCA9IDQyXG4gICAgICAgIFxuICAgICAgICAvLyDog4zmma/vvIjkuqTmm7/popzoibLvvIlcbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmdcIilcbiAgICAgICAgdmFyIGJnID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgaWYgKHJhbmsgJSAyID09PSAwKSB7XG4gICAgICAgICAgICBiZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoNDUsIDM4LCA3MCwgMTgwKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYmcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDM4LCAzMiwgNTgsIDE4MClcbiAgICAgICAgfVxuICAgICAgICBiZy5yb3VuZFJlY3QoLXdpZHRoLzIsIC0yMCwgd2lkdGgsIDQwLCA2KVxuICAgICAgICBiZy5maWxsKClcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmjpLlkI1cbiAgICAgICAgdmFyIHJhbmtOb2RlID0gbmV3IGNjLk5vZGUoXCJSYW5rXCIpXG4gICAgICAgIHZhciByYW5rTGFiZWwgPSByYW5rTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHJhbmtMYWJlbC5zdHJpbmcgPSBTdHJpbmcocmFuaylcbiAgICAgICAgcmFua0xhYmVsLmZvbnRTaXplID0gMThcbiAgICAgICAgcmFua0xhYmVsLmVuYWJsZUJvbGQgPSB0cnVlXG4gICAgICAgIHJhbmtMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHJhbmtOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjAwLCAxMDApXG4gICAgICAgIHJhbmtOb2RlLnNldFBvc2l0aW9uKC13aWR0aC8yICsgMzUsIDApXG4gICAgICAgIHJhbmtOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR546p5a625aS05YOPXG4gICAgICAgIHZhciBhdmF0YXJOb2RlID0gbmV3IGNjLk5vZGUoXCJBdmF0YXJcIilcbiAgICAgICAgYXZhdGFyTm9kZS5zZXRQb3NpdGlvbigtd2lkdGgvMiArIDc1LCAwKVxuICAgICAgICB2YXIgYXZhdGFyU3ByaXRlID0gYXZhdGFyTm9kZS5hZGRDb21wb25lbnQoY2MuU3ByaXRlKVxuICAgICAgICBhdmF0YXJTcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NXG4gICAgICAgIGF2YXRhck5vZGUuc2V0Q29udGVudFNpemUoMzIsIDMyKVxuICAgICAgICBhdmF0YXJOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDliqDovb3lpLTlg49cbiAgICAgICAgdGhpcy5fbG9hZEF2YXRhclNwcml0ZShhdmF0YXJTcHJpdGUsIHJhbmtEYXRhLmF2YXRhciwgcmFua0RhdGEuaXNfcm9ib3QpXG4gICAgICAgIFxuICAgICAgICAvLyDnjqnlrrblkI3np7BcbiAgICAgICAgdmFyIG5hbWVOb2RlID0gbmV3IGNjLk5vZGUoXCJOYW1lXCIpXG4gICAgICAgIHZhciBuYW1lTGFiZWwgPSBuYW1lTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHZhciBwbGF5ZXJOYW1lID0gcmFua0RhdGEucGxheWVyX25hbWUgfHwgXCLnjqnlrrZcIlxuICAgICAgICBpZiAocmFua0RhdGEuaXNfcm9ib3QpIHtcbiAgICAgICAgICAgIHBsYXllck5hbWUgPSB0aGlzLl9nZXRSb2JvdERpc3BsYXlOYW1lKHJhbmtEYXRhLnBsYXllcl9pZCwgcmFua0RhdGEucGxheWVyX25hbWUpXG4gICAgICAgIH1cbiAgICAgICAgbmFtZUxhYmVsLnN0cmluZyA9IHBsYXllck5hbWVcbiAgICAgICAgbmFtZUxhYmVsLmZvbnRTaXplID0gMTZcbiAgICAgICAgbmFtZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5MRUZUXG4gICAgICAgIG5hbWVMYWJlbC5vdmVyZmxvdyA9IGNjLkxhYmVsLk92ZXJmbG93LkNMQU1QXG4gICAgICAgIG5hbWVOb2RlLndpZHRoID0gMTUwXG4gICAgICAgIG5hbWVOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIG5hbWVOb2RlLnNldFBvc2l0aW9uKC13aWR0aC8yICsgMTQ1LCAwKVxuICAgICAgICBuYW1lTm9kZS5wYXJlbnQgPSBpdGVtTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g6YeR5biBXG4gICAgICAgIHZhciBjb2luTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ29pblwiKVxuICAgICAgICB2YXIgY29pbkxhYmVsID0gY29pbk5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBjb2luTGFiZWwuc3RyaW5nID0gKHJhbmtEYXRhLm1hdGNoX2NvaW4gfHwgMCkgKyBcIiDph5HluIFcIlxuICAgICAgICBjb2luTGFiZWwuZm9udFNpemUgPSAxNVxuICAgICAgICBjb2luTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLlJJR0hUXG4gICAgICAgIGNvaW5Ob2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjIwLCAxNTApXG4gICAgICAgIGNvaW5Ob2RlLnNldFBvc2l0aW9uKHdpZHRoLzIgLSA2MCwgMClcbiAgICAgICAgY29pbk5vZGUucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpdGVtTm9kZVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog5re75Yqg5rua5Yqo6KeG5Zu+6Kem5pG45LqL5Lu2XG4gICAgICovXG4gICAgX2FkZFNjcm9sbFZpZXdUb3VjaDogZnVuY3Rpb24oc2Nyb2xsVmlld05vZGUsIGNvbnRlbnROb2RlLCB2aWV3SGVpZ2h0KSB7XG4gICAgICAgIHZhciB0b3VjaFN0YXJ0WSA9IDBcbiAgICAgICAgdmFyIGNvbnRlbnRTdGFydFkgPSAwXG4gICAgICAgIHZhciBtYXhPZmZzZXQgPSBNYXRoLm1heCgwLCBjb250ZW50Tm9kZS5oZWlnaHQgLSB2aWV3SGVpZ2h0KVxuICAgICAgICBcbiAgICAgICAgc2Nyb2xsVmlld05vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfU1RBUlQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB0b3VjaFN0YXJ0WSA9IGV2ZW50LmdldExvY2F0aW9uWSgpXG4gICAgICAgICAgICBjb250ZW50U3RhcnRZID0gY29udGVudE5vZGUueVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgc2Nyb2xsVmlld05vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfTU9WRSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciB0b3VjaFkgPSBldmVudC5nZXRMb2NhdGlvblkoKVxuICAgICAgICAgICAgdmFyIGRlbHRhWSA9IHRvdWNoWSAtIHRvdWNoU3RhcnRZXG4gICAgICAgICAgICB2YXIgbmV3WSA9IGNvbnRlbnRTdGFydFkgKyBkZWx0YVlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6ZmQ5Yi25rua5Yqo6IyD5Zu0XG4gICAgICAgICAgICB2YXIgbWluWSA9IHZpZXdIZWlnaHQgLyAyIC0gY29udGVudE5vZGUuaGVpZ2h0XG4gICAgICAgICAgICB2YXIgbWF4WSA9IHZpZXdIZWlnaHQgLyAyXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG5ld1kgPSBNYXRoLm1heChtaW5ZLCBNYXRoLm1pbihtYXhZLCBuZXdZKSlcbiAgICAgICAgICAgIGNvbnRlbnROb2RlLnkgPSBuZXdZXG4gICAgICAgIH0pXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn4+G44CQ56ue5oqA5Zy644CR5Yib5bu66aKG5aWW5Y+w5p2h55uu77yI576O5YyW54mI77yJXG4gICAgICovXG4gICAgX2NyZWF0ZVBvZGl1bUVudHJ5OiBmdW5jdGlvbihwYXJlbnQsIHJhbmtEYXRhLCByYW5rLCB4LCB5KSB7XG4gICAgICAgIHZhciBlbnRyeU5vZGUgPSBuZXcgY2MuTm9kZShcIlBvZGl1bUVudHJ5X1wiICsgcmFuaylcbiAgICAgICAgZW50cnlOb2RlLnNldFBvc2l0aW9uKHgsIHkpXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOaOkuWQjeiDjOaZr++8iOagueaNruaOkuWQjeiuvue9ruminOiJsu+8iT09PT09PT09PT1cbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmdcIilcbiAgICAgICAgdmFyIGJnID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgdmFyIGJnQ29sb3IsIGJvcmRlckNvbG9yXG4gICAgICAgIGlmIChyYW5rID09PSAxKSB7XG4gICAgICAgICAgICAvLyDph5HniYwgLSDph5HoibLns7tcbiAgICAgICAgICAgIGJnQ29sb3IgPSBuZXcgY2MuQ29sb3IoMTAwLCA4NSwgNDAsIDIzMClcbiAgICAgICAgICAgIGJvcmRlckNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjE1LCAwKVxuICAgICAgICB9IGVsc2UgaWYgKHJhbmsgPT09IDIpIHtcbiAgICAgICAgICAgIC8vIOmTtueJjCAtIOmTtuiJsuezu1xuICAgICAgICAgICAgYmdDb2xvciA9IG5ldyBjYy5Db2xvcig3MCwgNzUsIDg1LCAyMzApXG4gICAgICAgICAgICBib3JkZXJDb2xvciA9IG5ldyBjYy5Db2xvcigxOTIsIDE5MiwgMTkyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g6ZOc54mMIC0g6ZOc6Imy57O7XG4gICAgICAgICAgICBiZ0NvbG9yID0gbmV3IGNjLkNvbG9yKDg1LCA2MCwgNDUsIDIzMClcbiAgICAgICAgICAgIGJvcmRlckNvbG9yID0gbmV3IGNjLkNvbG9yKDIwNSwgMTI3LCA1MClcbiAgICAgICAgfVxuICAgICAgICBiZy5maWxsQ29sb3IgPSBiZ0NvbG9yXG4gICAgICAgIGJnLnJvdW5kUmVjdCgtNTUsIC03MCwgMTEwLCAxNDAsIDEyKVxuICAgICAgICBiZy5maWxsKClcbiAgICAgICAgLy8g6L655qGGXG4gICAgICAgIGJnLnN0cm9rZUNvbG9yID0gYm9yZGVyQ29sb3JcbiAgICAgICAgYmcubGluZVdpZHRoID0gMlxuICAgICAgICBiZy5yb3VuZFJlY3QoLTU1LCAtNzAsIDExMCwgMTQwLCAxMilcbiAgICAgICAgYmcuc3Ryb2tlKClcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IGVudHJ5Tm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSDmjpLlkI3lpZbniYzlm77moIcgPT09PT09PT09PVxuICAgICAgICB2YXIgbWVkYWxOb2RlID0gbmV3IGNjLk5vZGUoXCJNZWRhbFwiKVxuICAgICAgICB2YXIgbWVkYWwgPSBtZWRhbE5vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICB2YXIgbWVkYWxDb2xvclxuICAgICAgICBpZiAocmFuayA9PT0gMSkge1xuICAgICAgICAgICAgbWVkYWxDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIxNSwgMCkgIC8vIOmHkeiJslxuICAgICAgICB9IGVsc2UgaWYgKHJhbmsgPT09IDIpIHtcbiAgICAgICAgICAgIG1lZGFsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMTkyLCAxOTIsIDE5MikgIC8vIOmTtuiJslxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWVkYWxDb2xvciA9IG5ldyBjYy5Db2xvcigyMDUsIDEyNywgNTApICAvLyDpk5zoibJcbiAgICAgICAgfVxuICAgICAgICBtZWRhbC5maWxsQ29sb3IgPSBtZWRhbENvbG9yXG4gICAgICAgIC8vIOe7mOWItuWchuW9ouWllueJjFxuICAgICAgICBtZWRhbC5jaXJjbGUoMCwgNDUsIDIyKVxuICAgICAgICBtZWRhbC5maWxsKClcbiAgICAgICAgbWVkYWwuc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSwgMTUwKVxuICAgICAgICBtZWRhbC5saW5lV2lkdGggPSAyXG4gICAgICAgIG1lZGFsLmNpcmNsZSgwLCA0NSwgMjIpXG4gICAgICAgIG1lZGFsLnN0cm9rZSgpXG4gICAgICAgIG1lZGFsTm9kZS5wYXJlbnQgPSBlbnRyeU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOWllueJjOS4iueahOaVsOWtl1xuICAgICAgICB2YXIgcmFua051bU5vZGUgPSBuZXcgY2MuTm9kZShcIlJhbmtOdW1cIilcbiAgICAgICAgdmFyIHJhbmtOdW1MYWJlbCA9IHJhbmtOdW1Ob2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgcmFua051bUxhYmVsLnN0cmluZyA9IFN0cmluZyhyYW5rKVxuICAgICAgICByYW5rTnVtTGFiZWwuZm9udFNpemUgPSAyNFxuICAgICAgICByYW5rTnVtTGFiZWwuZW5hYmxlQm9sZCA9IHRydWVcbiAgICAgICAgcmFua051bUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgcmFua051bU5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoNTAsIDQwLCAzMClcbiAgICAgICAgcmFua051bU5vZGUuc2V0UG9zaXRpb24oMCwgNDUpXG4gICAgICAgIHJhbmtOdW1Ob2RlLnBhcmVudCA9IGVudHJ5Tm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSDnjqnlrrblpLTlg48gPT09PT09PT09PVxuICAgICAgICB2YXIgYXZhdGFyTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQXZhdGFyXCIpXG4gICAgICAgIGF2YXRhck5vZGUuc2V0UG9zaXRpb24oMCwgMjApXG4gICAgICAgIHZhciBhdmF0YXJTcHJpdGUgPSBhdmF0YXJOb2RlLmFkZENvbXBvbmVudChjYy5TcHJpdGUpXG4gICAgICAgIGF2YXRhclNwcml0ZS5zaXplTW9kZSA9IGNjLlNwcml0ZS5TaXplTW9kZS5DVVNUT01cbiAgICAgICAgYXZhdGFyTm9kZS5zZXRDb250ZW50U2l6ZSg1MCwgNTApXG4gICAgICAgIGF2YXRhck5vZGUucGFyZW50ID0gZW50cnlOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5Yqg6L295aS05YOPXG4gICAgICAgIHRoaXMuX2xvYWRBdmF0YXJTcHJpdGUoYXZhdGFyU3ByaXRlLCByYW5rRGF0YS5hdmF0YXIsIHJhbmtEYXRhLmlzX3JvYm90KVxuICAgICAgICBcbiAgICAgICAgLy8g5aS05YOP6L655qGGXG4gICAgICAgIHZhciBhdmF0YXJGcmFtZU5vZGUgPSBuZXcgY2MuTm9kZShcIkF2YXRhckZyYW1lXCIpXG4gICAgICAgIHZhciBhdmF0YXJGcmFtZSA9IGF2YXRhckZyYW1lTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGF2YXRhckZyYW1lLnN0cm9rZUNvbG9yID0gYm9yZGVyQ29sb3JcbiAgICAgICAgYXZhdGFyRnJhbWUubGluZVdpZHRoID0gMlxuICAgICAgICBhdmF0YXJGcmFtZS5jaXJjbGUoMCwgMjAsIDI2KVxuICAgICAgICBhdmF0YXJGcmFtZS5zdHJva2UoKVxuICAgICAgICBhdmF0YXJGcmFtZU5vZGUucGFyZW50ID0gZW50cnlOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOeOqeWutuWQjeensCA9PT09PT09PT09XG4gICAgICAgIHZhciBuYW1lTGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJOYW1lXCIpXG4gICAgICAgIHZhciBuYW1lTGFiZWwgPSBuYW1lTGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdmFyIHBsYXllck5hbWUgPSByYW5rRGF0YS5wbGF5ZXJfbmFtZSB8fCBcIueOqeWutlwiXG4gICAgICAgIGlmIChyYW5rRGF0YS5pc19yb2JvdCkge1xuICAgICAgICAgICAgLy8g5py65Zmo5Lq65L2/55So5pm66IO96Zmq57uD5ZCN56ewXG4gICAgICAgICAgICBwbGF5ZXJOYW1lID0gdGhpcy5fZ2V0Um9ib3REaXNwbGF5TmFtZShyYW5rRGF0YS5wbGF5ZXJfaWQsIHJhbmtEYXRhLnBsYXllcl9uYW1lKVxuICAgICAgICB9XG4gICAgICAgIG5hbWVMYWJlbC5zdHJpbmcgPSBwbGF5ZXJOYW1lXG4gICAgICAgIG5hbWVMYWJlbC5mb250U2l6ZSA9IDE4XG4gICAgICAgIG5hbWVMYWJlbC5lbmFibGVCb2xkID0gdHJ1ZVxuICAgICAgICBuYW1lTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICBuYW1lTGFiZWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIG5hbWVMYWJlbE5vZGUueSA9IDVcbiAgICAgICAgbmFtZUxhYmVsTm9kZS5wYXJlbnQgPSBlbnRyeU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0g5q+U6LWb6YeR5biBID09PT09PT09PT1cbiAgICAgICAgdmFyIGNvaW5MYWJlbE5vZGUgPSBuZXcgY2MuTm9kZShcIkNvaW5cIilcbiAgICAgICAgdmFyIGNvaW5MYWJlbCA9IGNvaW5MYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBjb2luTGFiZWwuc3RyaW5nID0gKHJhbmtEYXRhLm1hdGNoX2NvaW4gfHwgMCkgKyBcIiDph5HluIFcIlxuICAgICAgICBjb2luTGFiZWwuZm9udFNpemUgPSAxNlxuICAgICAgICBjb2luTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICBjb2luTGFiZWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjMwLCAxNTApXG4gICAgICAgIGNvaW5MYWJlbE5vZGUueSA9IC0yNVxuICAgICAgICBjb2luTGFiZWxOb2RlLnBhcmVudCA9IGVudHJ5Tm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSDkuI3lho3mmL7npLrmnLrlmajkurpBSeagh+etviA9PT09PT09PT09XG4gICAgICAgIC8vIOeUqOaIt+imgeaxgu+8muacuuWZqOS6uuS4jeaYvuekukFJ5qCH6K+GXG4gICAgICAgIFxuICAgICAgICBlbnRyeU5vZGUucGFyZW50ID0gcGFyZW50XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDojrflj5bmnLrlmajkurrmmL7npLrlkI3np7BcbiAgICAgKi9cbiAgICBfZ2V0Um9ib3REaXNwbGF5TmFtZTogZnVuY3Rpb24ocGxheWVySWQsIG9yaWdpbmFsTmFtZSkge1xuICAgICAgICAvLyDlpoLmnpzljp/lp4vlkI3np7Dlt7Lnu4/mmK9cIuaZuuiDvemZque7g1jlj7dcIuagvOW8j++8jOebtOaOpei/lOWbnlxuICAgICAgICBpZiAob3JpZ2luYWxOYW1lICYmIG9yaWdpbmFsTmFtZS5pbmRleE9mKFwi5pm66IO96Zmq57uDXCIpID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gb3JpZ2luYWxOYW1lXG4gICAgICAgIH1cbiAgICAgICAgLy8g5ZCm5YiZ77yM55Sf5oiQXCLmmbrog73pmarnu4NY5Y+3XCLmoLzlvI/nmoTlkI3np7BcbiAgICAgICAgdmFyIHJvYm90SW5kZXggPSAxXG4gICAgICAgIGlmIChwbGF5ZXJJZCkge1xuICAgICAgICAgICAgdmFyIGxhc3RDaGFyID0gcGxheWVySWQudG9TdHJpbmcoKS5zbGljZSgtMSlcbiAgICAgICAgICAgIHJvYm90SW5kZXggPSBwYXJzZUludChsYXN0Q2hhcikgfHwgMVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBcIuaZuuiDvemZque7g1wiICsgcm9ib3RJbmRleCArIFwi5Y+3XCJcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHliqDovb3lpLTlg4/nsr7ngbVcbiAgICAgKiBAcGFyYW0ge2NjLlNwcml0ZX0gc3ByaXRlIC0g55uu5qCH57K+54G157uE5Lu2XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGF2YXRhclVybCAtIOWktOWDj1VSTOaIlui1hOa6kOWQjVxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNSb2JvdCAtIOaYr+WQpuaYr+acuuWZqOS6ulxuICAgICAqL1xuICAgIF9sb2FkQXZhdGFyU3ByaXRlOiBmdW5jdGlvbihzcHJpdGUsIGF2YXRhclVybCwgaXNSb2JvdCkge1xuICAgICAgICBpZiAoIXNwcml0ZSkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICAvLyDmnLrlmajkurrkvb/nlKjpu5jorqTlpLTlg4/vvIhhdmF0YXJfMSDliLAgYXZhdGFyXzMg6ZqP5py677yJXG4gICAgICAgIGlmIChpc1JvYm90KSB7XG4gICAgICAgICAgICB2YXIgcm9ib3RBdmF0YXJJbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDMpICsgMVxuICAgICAgICAgICAgdmFyIGRlZmF1bHRQYXRoID0gXCJVSS9oZWFkaW1hZ2UvYXZhdGFyX1wiICsgcm9ib3RBdmF0YXJJbmRleFxuICAgICAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoZGVmYXVsdFBhdGgsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFlcnIgJiYgc3ByaXRlRnJhbWUgJiYgc3ByaXRlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOecn+S6uueOqeWutlxuICAgICAgICBpZiAoIWF2YXRhclVybCB8fCBhdmF0YXJVcmwgPT09IFwiXCIpIHtcbiAgICAgICAgICAgIC8vIOS9v+eUqOm7mOiupOWktOWDj1xuICAgICAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoXCJVSS9oZWFkaW1hZ2UvYXZhdGFyXzFcIiwgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVyciwgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWVyciAmJiBzcHJpdGVGcmFtZSAmJiBzcHJpdGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICBzcHJpdGUuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5Yik5pat5pivVVJM6L+Y5piv5pys5Zyw6LWE5rqQ5ZCNXG4gICAgICAgIGlmIChhdmF0YXJVcmwuaW5kZXhPZihcImh0dHBcIikgPT09IDAgfHwgYXZhdGFyVXJsLmluZGV4T2YoXCIvL1wiKSA9PT0gMCkge1xuICAgICAgICAgICAgLy8g6L+c56iLVVJMXG4gICAgICAgICAgICBjYy5hc3NldE1hbmFnZXIubG9hZFJlbW90ZShhdmF0YXJVcmwsIHsgZXh0OiAnLnBuZycgfSwgZnVuY3Rpb24oZXJyLCB0ZXh0dXJlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVyciB8fCAhdGV4dHVyZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyDliqDovb3lpLHotKXvvIzkvb/nlKjpu5jorqTlpLTlg49cbiAgICAgICAgICAgICAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoXCJVSS9oZWFkaW1hZ2UvYXZhdGFyXzFcIiwgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVycjIsIGZhbGxiYWNrU3ByaXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVycjIgJiYgZmFsbGJhY2tTcHJpdGUgJiYgc3ByaXRlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcHJpdGUuc3ByaXRlRnJhbWUgPSBmYWxsYmFja1Nwcml0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNwcml0ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3ByaXRlRnJhbWUgPSBuZXcgY2MuU3ByaXRlRnJhbWUodGV4dHVyZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwcml0ZS5zcHJpdGVGcmFtZSA9IHNwcml0ZUZyYW1lXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS9v+eUqOm7mOiupOWktOWDj1xuICAgICAgICAgICAgICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcIlVJL2hlYWRpbWFnZS9hdmF0YXJfMVwiLCBjYy5TcHJpdGVGcmFtZSwgZnVuY3Rpb24oZXJyMiwgZmFsbGJhY2tTcHJpdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZXJyMiAmJiBmYWxsYmFja1Nwcml0ZSAmJiBzcHJpdGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwcml0ZS5zcHJpdGVGcmFtZSA9IGZhbGxiYWNrU3ByaXRlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOacrOWcsOi1hOa6kOWQjVxuICAgICAgICAgICAgdmFyIGxvY2FsUGF0aCA9IFwiVUkvaGVhZGltYWdlL1wiICsgYXZhdGFyVXJsXG4gICAgICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChsb2NhbFBhdGgsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVyciB8fCAhc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5Yqg6L295aSx6LSl77yM5L2/55So6buY6K6k5aS05YOPXG4gICAgICAgICAgICAgICAgICAgIGNjLnJlc291cmNlcy5sb2FkKFwiVUkvaGVhZGltYWdlL2F2YXRhcl8xXCIsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIyLCBmYWxsYmFja1Nwcml0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlcnIyICYmIGZhbGxiYWNrU3ByaXRlICYmIHNwcml0ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ByaXRlLnNwcml0ZUZyYW1lID0gZmFsbGJhY2tTcHJpdGVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzcHJpdGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICBzcHJpdGUuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59KTtcbiJdfQ==