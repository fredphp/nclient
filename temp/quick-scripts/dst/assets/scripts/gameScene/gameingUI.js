
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

var _cc$Class;

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

cc.Class((_cc$Class = {
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

    this.cardsReady = false;
    this._pendingBidUI = false; // 🔧【新增】待显示的抢地主UI标记

    this._pendingBidRound = 1; // 🔧【新增】待显示的抢地主轮次
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
    // 🔧【托管】用户活动检测 - 触发取消托管

    this._lastUserActivityTime = 0; // 上次用户活动时间

    this._userActivityThrottle = 1000; // 节流时间（毫秒）

    this._setupUserActivityDetection(); // ============ 服务器消息监听 ============
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

      if (!gameScene_script) {
        console.error("🃏 [onOtherPlayerChuCard] gameScene_script 为空");
        return;
      }

      var outCard_node = gameScene_script.getUserOutCardPosByAccount(data.accountid); // 🔧【调试】输出出牌区域查找结果

      console.log("🃏 [onOtherPlayerChuCard] data.accountid:", data.accountid, "outCard_node:", outCard_node ? outCard_node.name : "null");

      if (!outCard_node || !this.card_prefab) {
        console.error("🃏 [onOtherPlayerChuCard] outCard_node 或 card_prefab 为空, outCard_node:", !!outCard_node, "card_prefab:", !!this.card_prefab);
        return;
      } // 【重要】直接使用服务端数据创建节点


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
    // 🔧【新增】用户活动监听 - 取消机器人托管
    // 核心逻辑：只要用户有鼠标移动或点击事件，就发送取消托管请求
    // ============================================================

    this._isLocalTrustee = false; // 本地托管状态

    this._lastActivityTime = 0; // 上次活动时间（用于防抖）

    this._activityThrottleMs = 500; // 防抖间隔（毫秒）
    // 注册全局用户活动监听

    this._setupUserActivityListener(); // ============================================================
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
    }.bind(this)); // 🔧【新增】监听竞技场淘汰踢出房间通知
    // 当玩家被淘汰时，服务端发送此消息通知客户端显示被淘汰提示

    myglobal.socket.onArenaEliminatedKick(function (data) {
      console.log("🚪 [gameingUI] 收到淘汰踢出通知:", JSON.stringify(data));

      this._onArenaEliminatedKick(data);
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
    // 🔧【关键修复】首先检查节点是否有效
    if (!this.node || !this.node.isValid) {
      console.warn("🎮 [renderCards] 节点已销毁或无效，跳过渲染");
      return;
    }

    if (!cards || cards.length === 0) {
      console.warn("🎮 [renderCards] 没有牌可渲染");
      return;
    } // 🔧【关键修复】等待卡牌图集加载完成


    if (!window._cardAtlasLoaded) {
      console.log("🎮 [renderCards] 卡牌图集未加载完成，等待中...");
      var self = this;

      this._waitForAtlasAndRender(cards);

      return;
    }

    this._doRenderCards(cards);
  },

  /**
   * 🔧【新增】等待图集加载完成后渲染
   */
  _waitForAtlasAndRender: function _waitForAtlasAndRender(cards) {
    var self = this;
    var checkCount = 0;
    var maxCheck = 50; // 最多等待5秒（50 * 100ms）

    var checkAtlas = function checkAtlas() {
      checkCount++;

      if (window._cardAtlasLoaded) {
        console.log("🎮 [renderCards] 卡牌图集加载完成，开始渲染");

        self._doRenderCards(cards);
      } else if (checkCount < maxCheck) {
        setTimeout(checkAtlas, 100);
      } else {
        console.error("🎮 [renderCards] 等待卡牌图集超时，强制重新加载"); // 强制重新加载

        cc.resources.load("UI/card/card", cc.SpriteAtlas, function (err, atlas) {
          if (err) {
            console.error("🎮 [renderCards] 强制加载卡牌图集失败:", err);
            return;
          }

          window._cardAtlasLoaded = true;
          window._cardAtlas = atlas;
          console.log("🎮 [renderCards] 强制加载卡牌图集成功");

          self._doRenderCards(cards);
        });
      }
    };

    checkAtlas();
  },

  /**
   * 🔧【新增】实际执行渲染手牌
   */
  _doRenderCards: function _doRenderCards(cards) {
    // 🔧【关键修复】确保 cards_node 存在
    if (!this.cards_node) {
      console.warn("🎮 [renderCards] cards_node 未定义，尝试重新查找或创建");
      var gameSceneNode = this.node.parent;

      if (gameSceneNode) {
        for (var i = 0; i < gameSceneNode.children.length; i++) {
          var child = gameSceneNode.children[i];

          if (child.name === "cards_node" || child.name === "cards" || child.name === "handCards") {
            this.cards_node = child;
            console.log("🎮 [renderCards] 找到 cards_node:", child.name);
            break;
          }
        }

        if (!this.cards_node) {
          var newCardsNode = new cc.Node("cards_node");
          newCardsNode.parent = gameSceneNode;
          newCardsNode.setPosition(0, 0);
          newCardsNode.setAnchorPoint(0.5, 0.5);
          newCardsNode.setContentSize(cc.size(800, 200));
          this.cards_node = newCardsNode;
          console.log("🎮 [renderCards] 创建新的 cards_node");
        }
      } // 如果仍然没有，返回


      if (!this.cards_node) {
        console.error("🎮 [renderCards] 无法创建 cards_node，放弃渲染");
        return;
      }
    } // 🔥【防重复渲染】检查是否与上次相同


    var hash = JSON.stringify(cards);

    if (this._lastRenderHash === hash) {
      console.log("🎮 [renderCards] 牌与上次相同，跳过渲染");
      return;
    }

    this._lastRenderHash = hash;
    console.log("🎮 [renderCards] 开始渲染 " + cards.length + " 张牌"); // 【核心】使用斗地主规则排序：大王 > 小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3

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


    var deckPos = cc.v2(DealConfig.deckPosition.x, DealConfig.deckPosition.y); // 🔧【关键修复】确保卡牌图集已加载

    if (!window._cardAtlasLoaded || !window._cardAtlas) {
      console.log("🎮 [_dealCardsWithAnimation] 图集未加载，先加载图集...");
      cc.resources.load("UI/card/card", cc.SpriteAtlas, function (err, atlas) {
        if (err) {
          console.error("🎮 [_dealCardsWithAnimation] 加载图集失败:", err);
          return;
        }

        window._cardAtlasLoaded = true;
        window._cardAtlas = atlas;
        console.log("🎮 [_dealCardsWithAnimation] 图集加载完成，开始发牌");

        self._doDealCards(sortedCards, cardParent, cardInterval, animDuration, deckPos);
      });
      return;
    }

    this._doDealCards(sortedCards, cardParent, cardInterval, animDuration, deckPos);
  },

  /**
   * 🔧【新增】实际执行发牌
   */
  _doDealCards: function _doDealCards(sortedCards, cardParent, cardInterval, animDuration, deckPos) {
    var self = this;
    var myglobal = window.myglobal; // 逐张发牌

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
    // 🔧【修复】首先检查节点是否有效
    if (!this.node || !this.node.isValid) {
      console.warn("🎮 [clearAllCards] 节点已销毁或无效，跳过");
      return;
    } // 🔧【修复】只清理手牌容器中的节点，不遍历node.parent


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
    if (!myglobal) return;
    console.log("🃏 [_checkAndShowRobUI] 检查是否需要显示抢地主UI, cardsReady:", this.cardsReady, "_pendingBidUI:", this._pendingBidUI, "_biddingPhase:", this._biddingPhase, "_gamePhase:", this._gamePhase); // 🔧【关键修复】如果在出牌阶段，不显示抢地主按钮

    if (this._gamePhase === "playing") {
      console.log("🃏 [_checkAndShowRobUI] 当前是出牌阶段，不显示抢地主按钮");
      return;
    }

    var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID; // 🔧【关键修复】检查是否有待显示的抢地主UI（服务端消息在发牌完成前到达）

    if (this._pendingBidUI && this.cardsReady && this.robUI && !this.robUI.active) {
      console.log("🃏 [_checkAndShowRobUI] 发牌完成，显示待处理的抢地主UI, round:", this._pendingBidRound);

      if (this._pendingBidRound === 1) {
        this._showBidUI("叫地主", "不叫");
      } else {
        this._showBidUI("抢地主", "不抢");
      }

      this._pendingBidUI = false;
      return;
    } // 🔧【修复】检查当前玩家是否需要显示按钮


    console.log("🃏 [_checkAndShowRobUI] rob_player_accountid:", this.rob_player_accountid, "myPlayerId:", myPlayerId);

    if (this.rob_player_accountid == myPlayerId && this.cardsReady && this.robUI && !this.robUI.active) {
      console.log("🃏 [_checkAndShowRobUI] 轮到我，显示抢地主按钮, _biddingPhase:", this._biddingPhase);

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

    this._stopBidCountdown(); // 🔧【修复】确保设置游戏阶段


    this._gamePhase = "bidding";
    this.rob_player_accountid = playerId;
    this._bidTimeout = timeout;
    this._biddingPhase = round === 1 ? "bidding" : "robbing";
    this._bidExpiresAt = expiresAt; // 🔧【新增】保存过期时间

    var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID;
    console.log("🃏 [_processCallLandlordTurn] playerId:", playerId, "myPlayerId:", myPlayerId, "round:", round, "cardsReady:", this.cardsReady); // 🔧【关键修复】检查是否轮到当前玩家

    if (String(playerId) === String(myPlayerId)) {
      // 🔧【关键修复】如果发牌还没完成，等待发牌完成后再显示按钮
      if (!this.cardsReady) {
        console.log("🃏 [_processCallLandlordTurn] 发牌未完成，等待发牌完成后再显示抢地主按钮"); // 标记需要显示抢地主UI，在发牌完成后会调用 _checkAndShowRobUI

        this._pendingBidUI = true;
        this._pendingBidRound = round;
      } else {
        // 发牌已完成，直接显示按钮
        console.log("🃏 [_processCallLandlordTurn] 发牌已完成，直接显示抢地主按钮");

        if (round === 1) {
          this._showBidUI("叫地主", "不叫");
        } else {
          this._showBidUI("抢地主", "不抢");
        }
      }
    } else {
      this._hideRobUI();

      this._pendingBidUI = false; // 清除待显示标记

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
    console.log("🎯 ========== [_showBidUI] 显示抢地主按钮 ==========");
    console.log("🎯 [_showBidUI] confirmText:", confirmText, "cancelText:", cancelText);
    console.log("🎯 [_showBidUI] robUI 存在:", !!this.robUI);

    if (!this.robUI) {
      console.error("🎯 [_showBidUI] robUI 为空，无法显示按钮！");
      return;
    }

    if (this.playingUI_node) {
      this.playingUI_node.active = false;
    } // 🔧【关键修复】场景中的按钮名称是 qiangzhuang 和 buqiangzhuang


    var confirmBtn = this.robUI.getChildByName("qiangzhuang");
    var cancelBtn = this.robUI.getChildByName("buqiangzhuang");
    console.log("🎯 [_showBidUI] confirmBtn 存在:", !!confirmBtn, "cancelBtn 存在:", !!cancelBtn);

    if (confirmBtn) {
      var label = confirmBtn.getChildByName("Label");

      if (label && label.getComponent(cc.Label)) {
        label.getComponent(cc.Label).string = confirmText;
        console.log("🎯 [_showBidUI] 设置确认按钮文字:", confirmText);
      }
    }

    if (cancelBtn) {
      var label = cancelBtn.getChildByName("Label");

      if (label && label.getComponent(cc.Label)) {
        label.getComponent(cc.Label).string = cancelText;
        console.log("🎯 [_showBidUI] 设置取消按钮文字:", cancelText);
      }
    }

    this.robUI.active = true;
    console.log("🎯 [_showBidUI] robUI.active 已设置为 true");

    this._startBidCountdown();

    if (this.node && this.node.parent) {
      // 🔧【修复】传递包含 timeout 的对象
      this.node.parent.emit("canrob_event", {
        player_id: this.rob_player_accountid,
        timeout: this._bidTimeout || 15
      });
    }

    console.log("🎯 [_showBidUI] ========== 抢地主按钮显示完成 ==========");
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
        }); // 🔧【关键修复】检查是否有重复的牌（防止选牌bug）

        var uniqueCards = {};
        var hasDuplicate = false;

        for (var i = 0; i < cardsToPlay.length; i++) {
          var key = cardsToPlay[i].suit + "_" + cardsToPlay[i].rank;

          if (uniqueCards[key]) {
            hasDuplicate = true;
            console.error("🃏 [pushcard] 检测到重复的牌:", cardsToPlay[i]);
            break;
          }

          uniqueCards[key] = true;
        }

        if (hasDuplicate) {
          // 有重复牌，重置选牌状态
          this.tipsLabel.string = "选牌异常，请重新选牌";
          var self = this;

          this._resetCardFlags();

          this.choose_card_data = [];
          setTimeout(function () {
            self.tipsLabel.string = "";
          }, 2000);
          return;
        }

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
    // 🔧【修复】检查 node.parent 是否存在
    if (!this.node || !this.node.isValid || !this.node.parent) {
      console.warn("🃏 [_getOutCardNode] node 或 node.parent 未定义或已销毁");
      return null;
    }

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
    var myglobal = window.myglobal;
    if (!myglobal) return; // 获取当前玩家ID

    var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID; // 更新本地托管状态（仅当是自己时）

    if (String(data.player_id) === String(myPlayerId)) {
      this._isLocalTrustee = data.is_trustee;
      console.log("🎮 [托管] 本地托管状态更新:", data.is_trustee, "原因:", data.reason);
    } // 通知所有玩家节点更新托管状态


    if (this.node && this.node.parent) {
      this.node.parent.emit("trustee_state_update", data);
    }
  },
  // ============================================================
  // 🔧【新增】用户活动监听 - 取消机器人托管
  // ============================================================

  /**
   * 设置用户活动监听器
   * 当检测到用户活动（鼠标移动/点击/触摸）时，发送取消托管请求
   */
  _setupUserActivityListener: function _setupUserActivityListener() {
    var self = this; // 监听鼠标移动事件（全局）

    cc.systemEvent.on(cc.SystemEvent.EventType.MOUSE_MOVE, function (event) {
      self._onUserActivity("mouse_move");
    }); // 监听鼠标点击事件（全局）

    cc.systemEvent.on(cc.SystemEvent.EventType.MOUSE_DOWN, function (event) {
      self._onUserActivity("mouse_down");
    }); // 监听触摸开始事件（移动端）

    cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_START, function (event) {
      self._onUserActivity("touch_start");
    }); // 监听触摸移动事件（移动端）

    cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_MOVE, function (event) {
      self._onUserActivity("touch_move");
    });
    console.log("🎮 [用户活动] 已注册全局活动监听器");
  },

  /**
   * 处理用户活动
   * 如果玩家处于托管状态，发送取消托管请求
   * @param {string} activityType - 活动类型
   */
  _onUserActivity: function _onUserActivity(activityType) {
    // 只在托管状态下处理
    if (!this._isLocalTrustee) {
      return;
    } // 防抖：限制发送频率


    var now = Date.now();

    if (now - this._lastActivityTime < this._activityThrottleMs) {
      return;
    }

    this._lastActivityTime = now;
    console.log("🎮 [用户活动] 检测到用户活动:", activityType, "发送取消托管请求"); // 发送取消托管请求

    this._sendCancelTrustee();
  },

  /**
   * 发送取消托管请求到服务端
   */
  _sendCancelTrustee: function _sendCancelTrustee() {
    var myglobal = window.myglobal;

    if (!myglobal || !myglobal.socket) {
      console.warn("🎮 [取消托管] socket 未初始化");
      return;
    } // 检查是否有对应的发送方法


    if (myglobal.socket.cancelTrustee) {
      myglobal.socket.cancelTrustee();
    } else if (myglobal.socket.send) {
      // 直接发送消息
      var msg = {
        type: "cancel_trustee",
        payload: {}
      };
      myglobal.socket.send(JSON.stringify(msg));
    } else {
      console.warn("🎮 [取消托管] 无法发送取消托管请求");
    } // 立即更新本地状态，避免重复发送


    this._isLocalTrustee = false;
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
    // 🔧【修复】首先检查节点是否有效
    if (!this.node || !this.node.isValid) {
      console.warn("🃏 [_showBottomCardsToAll] 节点已销毁或无效，跳过");
      return;
    }

    if (!cards || cards.length === 0) {
      return;
    } // 🔧【修复】检查 bottom_card 数组是否存在


    if (!this.bottom_card || !Array.isArray(this.bottom_card)) {
      console.warn("🃏 [_showBottomCardsToAll] bottom_card 未初始化");
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
    // 🔧【修复】首先检查节点是否有效
    if (!this.node || !this.node.isValid) {
      console.warn("🃏 [_updateLandlordHandCards] 节点已销毁或无效，跳过");
      return;
    }

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
    // 🔧【修复】检查 node.parent 是否存在
    if (!this.node || !this.node.isValid || !this.node.parent) {
      console.warn("🃏 [_showPassEffect] node 或 node.parent 未定义或已销毁");
      return;
    } // 获取对应玩家的出牌区域


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
    // 🔧【修复】添加更完整的空值检查
    if (!this.node || !this.node.isValid) {
      console.warn("🎮 [_clearAllOutCardZones] this.node 为空或已销毁");
      return;
    } // 获取 gameScene 脚本


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

    if (!children) {
      console.warn("🎮 [_clearAllOutCardZones] players_seat_pos.children 为空");
      return;
    }

    for (var i = 0; i < children.length; i++) {
      var seatNode = children[i];
      if (!seatNode) continue; // 查找出牌区域节点（cardsoutzone0, cardsoutzone1, cardsoutzone2）

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
    // 🔧【关键修复】完全依赖服务端推送的倒计时消息
    // 不使用本地倒计时定时器，确保所有客户端行为一致
    // 服务端每秒广播 arena_countdown_tick 消息
    // ============================================================
    // 注册服务端倒计时消息监听


    this._setupArenaCountdownListeners();

    console.log("🏟️ [显示结算弹窗] 初始倒计时:", initialCountdown, "秒，等待服务端推送...");
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
   * 🔧【关键】完全依赖服务端推送，不使用本地倒计时定时器
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
   * 🚪【竞技场】处理淘汰踢出房间通知
   * 当玩家被淘汰时，服务端发送此消息
   * @param {Object} data - { period_no, player_id, message }
   */
  _onArenaEliminatedKick: function _onArenaEliminatedKick(data) {
    console.log("🚪 [_onArenaEliminatedKick] 收到淘汰踢出通知:", JSON.stringify(data));
    var self = this;
    var winSize = cc.winSize; // 停止所有倒计时

    this._stopPlayCountdown();

    this._stopBidCountdown();

    if (this._localArenaCountdownTimer) {
      this.unschedule(this._localArenaCountdownTick);
      this._localArenaCountdownTimer = null;
    } // 隐藏比赛金币显示


    this._hideMatchCoinDisplay(); // 关闭之前的结算弹窗


    if (this._gameResultPopup || this._gameResultMask) {
      this._closeGameResultPopup(this._gameResultPopup, this._gameResultMask);
    } // 显示淘汰提示弹窗


    var canvas = cc.find("Canvas") || cc.find("UI_ROOT") || this.node.parent;
    if (!canvas) canvas = this.node; // ========== 遮罩层 ==========

    var maskNode = new cc.Node("EliminatedKickMask");
    maskNode.addComponent(cc.BlockInputEvents);
    maskNode.color = new cc.Color(10, 5, 30);
    maskNode.opacity = 200;
    maskNode.width = winSize.width * 2;
    maskNode.height = winSize.height * 2;
    maskNode.zIndex = 999;
    maskNode.parent = canvas; // ========== 弹窗容器 ==========

    var popupNode = new cc.Node("EliminatedKickPopup");
    popupNode.scale = 0.3;
    popupNode.opacity = 0;
    popupNode.zIndex = 1000;
    popupNode.parent = canvas; // 弹窗尺寸

    var popupWidth = 500;
    var popupHeight = 280; // ========== 主背景 ==========

    var bgNode = new cc.Node("Bg");
    var bg = bgNode.addComponent(cc.Graphics);
    bg.fillColor = new cc.Color(30, 22, 54, 250);
    bg.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 16);
    bg.fill();
    bg.strokeColor = new cc.Color(255, 100, 100);
    bg.lineWidth = 3;
    bg.roundRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 16);
    bg.stroke();
    bgNode.parent = popupNode; // ========== 标题 ==========

    var titleNode = new cc.Node("Title");
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = "💔 淘汰通知";
    titleLabel.fontSize = 32;
    titleLabel.lineHeight = 40;
    titleNode.color = new cc.Color(255, 100, 100);
    titleNode.y = 80;
    titleNode.parent = popupNode; // ========== 消息内容 ==========

    var msgNode = new cc.Node("Message");
    var msgLabel = msgNode.addComponent(cc.Label);
    msgLabel.string = data.message || "您已被淘汰，即将离开房间";
    msgLabel.fontSize = 24;
    msgLabel.lineHeight = 32;
    msgNode.color = new cc.Color(220, 220, 220);
    msgNode.y = 20;
    msgNode.parent = popupNode; // ========== 确定按钮 ==========

    var btnNode = new cc.Node("ConfirmBtn");
    var btnBg = btnNode.addComponent(cc.Graphics);
    btnBg.fillColor = new cc.Color(80, 140, 200);
    btnBg.roundRect(-80, -25, 160, 50, 8);
    btnBg.fill();
    btnNode.y = -70;
    btnNode.parent = popupNode;
    var btnLabelNode = new cc.Node("Label");
    var btnLabel = btnLabelNode.addComponent(cc.Label);
    btnLabel.string = "确定";
    btnLabel.fontSize = 24;
    btnLabelNode.color = new cc.Color(255, 255, 255);
    btnLabelNode.parent = btnNode; // 按钮点击事件

    btnNode.on(cc.Node.EventType.TOUCH_END, function () {
      // 关闭弹窗
      popupNode.destroy();
      maskNode.destroy(); // 返回大厅

      cc.director.loadScene("hallScene");
    }); // 弹窗入场动画

    popupNode.runAction(cc.sequence(cc.spawn(cc.scaleTo(0.3, 1.0).easing(cc.easeBackOut()), cc.fadeIn(0.3)))); // 3秒后自动返回大厅

    this.scheduleOnce(function () {
      if (popupNode && popupNode.parent) {
        popupNode.destroy();
        maskNode.destroy();
        cc.director.loadScene("hallScene");
      }
    }, 3);
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
    var nameLabel = nameNode.addComponent(cc.Label); // 🔧【修复】直接使用服务端发送的玩家昵称，不再根据 is_robot 覆盖
    // 服务端已经正确发送了真实玩家昵称（包括机器人玩家的真实昵称）

    var playerName = rankData.player_name || "玩家";
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
    var nameLabel = nameLabelNode.addComponent(cc.Label); // 🔧【修复】直接使用服务端发送的玩家昵称，不再根据 is_robot 覆盖
    // 服务端已经正确发送了真实玩家昵称（包括机器人玩家的真实昵称）

    var playerName = rankData.player_name || "玩家";
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
   * 获取机器人显示名称（已弃用 - 保留备用）
   * 🔧【修复】服务端已经正确发送真实玩家昵称，不再需要此方法覆盖
   */
  _getRobotDisplayName: function _getRobotDisplayName(playerId, originalName) {
    // 直接返回原始名称，服务端已经发送正确的昵称
    if (originalName) {
      return originalName;
    } // 如果没有名称，返回默认机器人名称


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
    if (!sprite) return; // 🔧【修复】优先使用服务端发送的头像URL，无论 isRobot 值是什么
    // 服务端已经正确发送了真实玩家的头像URL（包括机器人玩家的头像）
    // 如果有有效的头像URL，使用服务端发送的URL

    if (avatarUrl && avatarUrl !== "") {
      // 判断是URL还是本地资源名
      if (avatarUrl.indexOf("http") === 0 || avatarUrl.indexOf("//") === 0 || avatarUrl.indexOf("/uploads") === 0) {
        // 远程URL - 处理相对路径
        var fullUrl = avatarUrl;

        if (avatarUrl.indexOf("/uploads") === 0) {
          var myglobal = window.myglobal;
          var cdnUrl = myglobal && myglobal.cdnUrl ? myglobal.cdnUrl : "https://apis.hongxiu88.com";
          fullUrl = cdnUrl + avatarUrl;
        }

        cc.assetManager.loadRemote(fullUrl, {
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
        return;
      } // 本地资源名


      var resourcePath = "UI/headimage/" + avatarUrl;
      cc.resources.load(resourcePath, cc.SpriteFrame, function (err, spriteFrame) {
        if (!err && spriteFrame && sprite.isValid) {
          sprite.spriteFrame = spriteFrame;
        } else {
          // 加载失败，使用默认头像
          cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function (err2, fallbackSprite) {
            if (!err2 && fallbackSprite && sprite.isValid) {
              sprite.spriteFrame = fallbackSprite;
            }
          });
        }
      });
      return;
    } // 没有头像URL，使用默认头像


    var defaultIndex = isRobot ? Math.floor(Math.random() * 3) + 1 : 1;
    var defaultPath = "UI/headimage/avatar_" + defaultIndex;
    cc.resources.load(defaultPath, cc.SpriteFrame, function (err, spriteFrame) {
      if (!err && spriteFrame && sprite.isValid) {
        sprite.spriteFrame = spriteFrame;
      }
    });
  },
  // ============================================================
  // 🔧【托管】用户活动检测 - 触发取消托管
  // ============================================================

  /**
   * 🔧【托管】设置用户活动检测
   * 当用户在屏幕上移动或点击时，触发取消托管请求
   */
  _setupUserActivityDetection: function _setupUserActivityDetection() {
    var self = this; // 监听全局触摸开始事件

    this.node.on(cc.Node.EventType.TOUCH_START, function (event) {
      self._onUserActivity("touch_start");
    }, this); // 监听全局触摸移动事件

    this.node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
      self._onUserActivity("touch_move");
    }, this); // 监听全局鼠标移动事件（PC端）

    this.node.on(cc.Node.EventType.MOUSE_MOVE, function (event) {
      self._onUserActivity("mouse_move");
    }, this);
    console.log("🖐️ [用户活动检测] 已启动");
  }
}, _cc$Class["_onUserActivity"] = function _onUserActivity(activityType) {
  var now = Date.now(); // 节流：1秒内只处理一次

  if (now - this._lastUserActivityTime < this._userActivityThrottle) {
    return;
  }

  this._lastUserActivityTime = now; // 检查是否处于游戏进行中

  if (this._gamePhase !== "bidding" && this._gamePhase !== "playing") {
    return;
  }

  var myglobal = window.myglobal;

  if (!myglobal || !myglobal.socket) {
    return;
  } // 🔧【优化】不再检查本地托管状态，直接发送取消托管请求
  // 服务端会自己判断玩家是否处于托管状态，如果是则取消托管


  console.log("🖐️ [用户活动] 检测到用户活动:", activityType, "，发送取消托管请求"); // 发送取消托管请求

  if (myglobal.socket.cancelTrustee) {
    myglobal.socket.cancelTrustee();
  }
}, _cc$Class._isCurrentPlayerTrustee = function _isCurrentPlayerTrustee() {
  // 🔧【优化】直接检查本地托管状态
  if (this._isLocalTrustee) {
    return true;
  }

  var myglobal = window.myglobal;

  if (!myglobal || !myglobal.playerData) {
    return false;
  } // 查找当前玩家的 player_node


  var gameSceneNode = this.node.parent;

  if (!gameSceneNode) {
    return false;
  }

  var myPlayerId = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID; // 遍历 playerNodeList 查找当前玩家

  var playerNodeList = gameSceneNode.getComponent("gameScene");

  if (playerNodeList && playerNodeList.playerNodeList) {
    for (var i = 0; i < playerNodeList.playerNodeList.length; i++) {
      var node = playerNodeList.playerNodeList[i];

      if (node) {
        var script = node.getComponent("player_node");

        if (script && String(script.accountid) === String(myPlayerId)) {
          return script._isTrustee || false;
        }
      }
    }
  }

  return false;
}, _cc$Class));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2dhbWVTY2VuZS9nYW1laW5nVUkuanMiXSwibmFtZXMiOlsiaXNvcGVuX3NvdW5kIiwid2luZG93IiwicWlhbl9zdGF0ZSIsImJ1cWlhbmciLCJxaWFuIiwiQ2FyZHNWYWx1ZSIsIlJvb21TdGF0ZSIsIl9hdWRpb0NsaXBzIiwiQ2FyZExheW91dCIsImNhcmRTY2FsZSIsImNhcmRZIiwiY2FyZFNwYWNpbmciLCJib3R0b21DYXJkU2NhbGUiLCJib3R0b21DYXJkU3BhY2luZyIsIm91dENhcmRTY2FsZSIsIm91dENhcmRTcGFjaW5nIiwiRGVhbENvbmZpZyIsImFuaW1EdXJhdGlvbiIsImRlY2tQb3NpdGlvbiIsImNjIiwidjIiLCJjYXJkSW50ZXJ2YWwiLCJwbGF5U291bmQiLCJwYXRoIiwiYXVkaW9FbmdpbmUiLCJwbGF5IiwicmVzb3VyY2VzIiwibG9hZCIsIkF1ZGlvQ2xpcCIsImVyciIsImNsaXAiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJnYW1laW5nVUkiLCJOb2RlIiwiY2FyZF9wcmVmYWIiLCJQcmVmYWIiLCJyb2JVSSIsImJvdHRvbV9jYXJkX3Bvc19ub2RlIiwicGxheWluZ1VJX25vZGUiLCJ0aXBzTGFiZWwiLCJMYWJlbCIsImNhcmRzX25vZGUiLCJiaWRDb3VudGRvd25MYWJlbCIsInBsYXlDb3VudGRvd25MYWJlbCIsInRpY2tBdWRpbyIsInR5cGUiLCJvbkxvYWQiLCJteWdsb2JhbCIsImNvbnNvbGUiLCJlcnJvciIsIl9wcmVsb2FkQ2FyZEF0bGFzIiwiZ2FtZVNjZW5lTm9kZSIsIm5vZGUiLCJwYXJlbnQiLCJpIiwiY2hpbGRyZW4iLCJsZW5ndGgiLCJjaGlsZCIsIm5hbWUiLCJuZXdDYXJkc05vZGUiLCJzZXRQb3NpdGlvbiIsInNldEFuY2hvclBvaW50Iiwic2V0Q29udGVudFNpemUiLCJzaXplIiwiaGFuZENhcmRzIiwiYm90dG9tQ2FyZHMiLCJjaG9vc2VfY2FyZF9kYXRhIiwicm9iX3BsYXllcl9hY2NvdW50aWQiLCJfYmlkZGluZ1BoYXNlIiwiX2dhbWVQaGFzZSIsImNhcmRzUmVhZHkiLCJfcGVuZGluZ0JpZFVJIiwiX3BlbmRpbmdCaWRSb3VuZCIsIl9iaWRUaW1lb3V0IiwiX3BsYXlUaW1lb3V0IiwiX2JpZENvdW50ZG93blRpbWVyIiwiX3BsYXlDb3VudGRvd25UaW1lciIsIl9iaWRUaW1lTGVmdCIsIl9wbGF5VGltZUxlZnQiLCJfaXNCaWRDb3VudGRvd25UaWNraW5nIiwiX2lzUGxheUNvdW50ZG93blRpY2tpbmciLCJfaXNCaWRXYXJuaW5nIiwiX2lzUGxheVdhcm5pbmciLCJfYmlkRXhwaXJlc0F0IiwiYm90dG9tX2NhcmQiLCJfaXNDb21wZXRpdGlvbiIsIl9yb29tQ2F0ZWdvcnkiLCJfbWF0Y2hDb2luIiwiX2NvbXBldGl0aW9uUm91bmQiLCJfY29tcGV0aXRpb25Ub3RhbFJvdW5kcyIsIl9jb21wZXRpdGlvbkNvdW50ZG93biIsIl9jb21wZXRpdGlvbkNvdW50ZG93blRpbWVyIiwiX3dhc0Rpc2Nvbm5lY3RlZCIsIl9sYXN0VXNlckFjdGl2aXR5VGltZSIsIl91c2VyQWN0aXZpdHlUaHJvdHRsZSIsIl9zZXR1cFVzZXJBY3Rpdml0eURldGVjdGlvbiIsInNvY2tldCIsIm9uUHVzaENhcmRzIiwiZGF0YSIsImxvZyIsIkpTT04iLCJzdHJpbmdpZnkiLCJjYXJkcyIsImJvdHRvbV9jYXJkcyIsIl9nYW1lUmVzdWx0UG9wdXAiLCJfZ2FtZVJlc3VsdE1hc2siLCJfY2xvc2VHYW1lUmVzdWx0UG9wdXAiLCJfc3RvcEFyZW5hQ291bnRkb3duIiwiX2NsZWFyQWxsT3V0Q2FyZFpvbmVzIiwicmVuZGVyQ2FyZHMiLCJiaW5kIiwib25CaWRUdXJuIiwib25CaWRSZXN1bHQiLCJfc3RvcEJpZENvdW50ZG93biIsImVtaXQiLCJwbGF5ZXJfaWQiLCJhY2NvdW50aWQiLCJiaWQiLCJzdGF0ZSIsIm9uQ2FuUm9iU3RhdGUiLCJvbkNhbkNodUNhcmQiLCJwbGF5ZXJJZCIsIm15UGxheWVySWQiLCJnZXRQbGF5ZXJJbmZvIiwiaWQiLCJwbGF5ZXJEYXRhIiwic2VydmVyUGxheWVySWQiLCJhY2NvdW50SUQiLCJfc3RvcFBsYXlDb3VudGRvd24iLCJfbXVzdFBsYXkiLCJtdXN0X3BsYXkiLCJfY2FuQmVhdCIsImNhbl9iZWF0IiwiX2xhc3RQbGF5ZWRDYXJkcyIsIlN0cmluZyIsIl9oaWRlUm9iVUkiLCJjbGVhck91dFpvbmUiLCJhY3RpdmUiLCJ0aW1lb3V0IiwiX3N0YXJ0UGxheUNvdW50ZG93biIsIm9uT3RoZXJQbGF5ZXJDaHVDYXJkIiwiaXNfcGFzcyIsIl9wbGF5UGFzc1NvdW5kIiwiX3Nob3dQYXNzRWZmZWN0IiwiX2xhc3RQbGF5ZWRIYW5kVHlwZSIsImhhbmRfdHlwZSIsInNvY2tldEluZm8iLCJhY2NvdW50SWQiLCJpc1NlbGYiLCJfcmVtb3ZlQ2FyZHNGcm9tSGFuZCIsIl9wbGF5Q2FyZFNvdW5kIiwiZ2FtZVNjZW5lX3NjcmlwdCIsImdldENvbXBvbmVudCIsIm91dENhcmRfbm9kZSIsImdldFVzZXJPdXRDYXJkUG9zQnlBY2NvdW50Iiwibm9kZV9jYXJkcyIsImNhcmQiLCJpbnN0YW50aWF0ZSIsImNhcmRTY3JpcHQiLCJzaG93Q2FyZHMiLCJwdXNoIiwic2hvd091dENhcmRzIiwiY2FyZHNfbGVmdCIsInVuZGVmaW5lZCIsImNvdW50Iiwib25DYWxsTGFuZGxvcmRTdGFydCIsIm9uQ2FsbExhbmRsb3JkVHVybiIsIl9wcm9jZXNzQ2FsbExhbmRsb3JkVHVybiIsIm9uQ2FsbExhbmRsb3JkUmVzdWx0IiwiX3BsYXlSb2JTb3VuZCIsIm9uQ2FsbExhbmRsb3JkRW5kIiwiX3Nob3dCb3R0b21DYXJkc1RvQWxsIiwib25MYW5kbG9yZENhcmRzIiwibGFuZGxvcmRJZCIsImxhbmRsb3JkX2lkIiwiX3VwZGF0ZUxhbmRsb3JkSGFuZENhcmRzIiwib25SZXN0YXJ0R2FtZSIsImNsZWFyQWxsQ2FyZHMiLCJvblBsYXlTdGFydCIsIm9uR2FtZU92ZXIiLCJfcmVzZXRBbGxQbGF5ZXJSZWFkeVN0YXRlIiwiX3Nob3dHYW1lUmVzdWx0UG9wdXAiLCJvbkdhbWVTdGF0ZVJlc3RvcmUiLCJyZXN0b3JlR2FtZVN0YXRlIiwib25IaW50UmVzdWx0IiwiX29uSGludFJlc3VsdCIsIm9uVHJ1c3RlZVN0YXRlTm90aWZ5IiwiX29uVHJ1c3RlZVN0YXRlTm90aWZ5IiwiX2lzTG9jYWxUcnVzdGVlIiwiX2xhc3RBY3Rpdml0eVRpbWUiLCJfYWN0aXZpdHlUaHJvdHRsZU1zIiwiX3NldHVwVXNlckFjdGl2aXR5TGlzdGVuZXIiLCJvbkNvbXBldGl0aW9uU3RhdHVzIiwiX29uQ29tcGV0aXRpb25TdGF0dXMiLCJvbkNvbXBldGl0aW9uQ291bnRkb3duIiwiX29uQ29tcGV0aXRpb25Db3VudGRvd24iLCJvbk1hdGNoQ29pblVwZGF0ZSIsIl9vbk1hdGNoQ29pblVwZGF0ZSIsIm9uQ29tcGV0aXRpb25FbGltaW5hdGVkIiwiX29uQ29tcGV0aXRpb25FbGltaW5hdGVkIiwib25Db21wZXRpdGlvbkFkdmFuY2UiLCJfb25Db21wZXRpdGlvbkFkdmFuY2UiLCJvbkNvbXBldGl0aW9uQ2hhbXBpb24iLCJfb25Db21wZXRpdGlvbkNoYW1waW9uIiwib25Ub3VybmFtZW50RmluYWxSYW5rIiwiX29uVG91cm5hbWVudEZpbmFsUmFuayIsIm9uQXJlbmFFbGltaW5hdGVkS2ljayIsIl9vbkFyZW5hRWxpbWluYXRlZEtpY2siLCJvbiIsImdhbWVTY2VuZV9ub2RlIiwiZXZlbnQiLCJfdXBkYXRlU2VsZWN0ZWRDb3VudERpc3BsYXkiLCJjYXJkaWQiLCJzdWl0IiwicmFuayIsInNwbGljZSIsInN0YXJ0IiwiX2NhcmRBdGxhc0xvYWRlZCIsIlNwcml0ZUF0bGFzIiwiYXRsYXMiLCJfY2FyZEF0bGFzIiwib25EZXN0cm95IiwidW5zY2hlZHVsZSIsIl9jb21wZXRpdGlvbkNvdW50ZG93blRpY2siLCJfbG9jYWxBcmVuYUNvdW50ZG93blRpbWVyIiwiX2xvY2FsQXJlbmFDb3VudGRvd25UaWNrIiwiX2hpZGVNYXRjaENvaW5EaXNwbGF5IiwiaXNWYWxpZCIsIndhcm4iLCJzZWxmIiwiX3dhaXRGb3JBdGxhc0FuZFJlbmRlciIsIl9kb1JlbmRlckNhcmRzIiwiY2hlY2tDb3VudCIsIm1heENoZWNrIiwiY2hlY2tBdGxhcyIsInNldFRpbWVvdXQiLCJoYXNoIiwiX2xhc3RSZW5kZXJIYXNoIiwic29ydGVkQ2FyZHMiLCJfc29ydENhcmRzIiwiX2NyZWF0ZUJvdHRvbUNhcmRzIiwiX2RlYWxDYXJkc1dpdGhBbmltYXRpb24iLCJjYXJkUGFyZW50IiwiZGVja1BvcyIsIngiLCJ5IiwiX2RvRGVhbENhcmRzIiwiaW5kZXgiLCJzY2hlZHVsZU9uY2UiLCJjYXJkRGF0YSIsInRhcmdldFgiLCJfZ2V0Q2FyZFgiLCJ0YXJnZXRQb3MiLCJzY2FsZSIsInpJbmRleCIsImNhcmRDb21wIiwidHdlZW4iLCJ0byIsInBvc2l0aW9uIiwiZWFzaW5nIiwiY2FsbCIsInRvdGFsRGVhbFRpbWUiLCJfb25EZWFsQ2FyZHNDb21wbGV0ZSIsImZhcGFpX2VuZCIsIl9jaGVja0FuZFNob3dSb2JVSSIsImdldENhcmRWYWx1ZSIsInNsaWNlIiwic29ydCIsImEiLCJiIiwidmFsdWVBIiwidmFsdWVCIiwicmVtb3ZlQWxsQ2hpbGRyZW4iLCJzcGFjaW5nIiwidG90YWxXaWR0aCIsInN0YXJ0WCIsImRlc3Ryb3kiLCJib3R0b21ZIiwiYm90dG9tU3RhcnRYIiwiZGlfY2FyZCIsIl9zaG93QmlkVUkiLCJyb3VuZCIsImV4cGlyZXNBdCIsImV4cGlyZXNfYXQiLCJjb25maXJtVGV4dCIsImNhbmNlbFRleHQiLCJjb25maXJtQnRuIiwiZ2V0Q2hpbGRCeU5hbWUiLCJjYW5jZWxCdG4iLCJsYWJlbCIsInN0cmluZyIsIl9zdGFydEJpZENvdW50ZG93biIsImR1cmF0aW9uIiwidGltZUxlZnQiLCJub3ciLCJEYXRlIiwiTWF0aCIsIm1heCIsImZsb29yIiwiX3VwZGF0ZUJpZENvdW50ZG93blVJIiwic2NoZWR1bGUiLCJfYmlkQ291bnRkb3duVGljayIsIl9lbnRlckJpZFdhcm5pbmdTdGF0ZSIsIl9wbGF5VGlja1NvdW5kIiwiX29uQmlkQ291bnRkb3duRW5kIiwicmVtYWluaW5nIiwidXBkYXRlZCIsImNsb2NrTm9kZSIsImoiLCJvcGFjaXR5IiwiZm9udFNpemUiLCJsaW5lSGVpZ2h0IiwiY29sb3IiLCJDb2xvciIsImxhYmVsTm9kZSIsIl9nZXRCaWRDb3VudGRvd25MYWJlbE5vZGUiLCJSRUQiLCJzdG9wQWxsQWN0aW9ucyIsInJlcGVhdEZvcmV2ZXIiLCJsYWJlbE5hbWVzIiwiV0hJVEUiLCJfdXBkYXRlUGxheUNvdW50ZG93blVJIiwiX3BsYXlDb3VudGRvd25UaWNrIiwiX2VudGVyUGxheVdhcm5pbmdTdGF0ZSIsIl9vblBsYXlDb3VudGRvd25FbmQiLCJFdmVudCIsIkV2ZW50Q3VzdG9tIiwic2V0VXNlckRhdGEiLCJkaXNwYXRjaEV2ZW50IiwiY2xvY2tMYWJlbCIsIl91cGRhdGVDbG9ja1RpbWVMYWJlbCIsInBsYXllck5vZGVTY3JpcHQiLCJzZWF0X2luZGV4IiwidGltZV9sYWJlbCIsImNsb2NraW1hZ2UiLCJjbG9ja0NoaWxkcmVuIiwiY2xvY2tDaGlsZCIsImRpcmVjdExhYmVsIiwiX2dldFBsYXlDb3VudGRvd25MYWJlbE5vZGUiLCJwbGF5RWZmZWN0IiwiX3BsYXlQbGF5VGlja1NvdW5kIiwiYWN0aW9uIiwiZ2VuZGVyIiwib3JkZXIiLCJwbGF5ZXJJRCIsInNvdW5kS2V5IiwiX2xhc3RSb2JTb3VuZEtleSIsInBhc3NTb3VuZCIsIl9wbGF5U291bmRFZmZlY3QiLCJzb3VuZHMiLCJfcGxheVJhbmRvbVNvdW5kIiwiZmFsbGJhY2siLCJhbGxvd0RhbmlGYWxsYmFjayIsIm1lc3NhZ2UiLCJlcnIyIiwiY2xpcDIiLCJyYW5kb20iLCJvbkJ1dHRvbkNsaWNrIiwiY3VzdG9tRGF0YSIsInJlcXVlc3RCaWQiLCJyZXF1ZXN0Um9iU3RhdGUiLCJyZXF1ZXN0X2J1Y2h1X2NhcmQiLCJfb25IaW50QnV0dG9uQ2xpY2siLCJzZWxlY3RlZENhcmROYW1lcyIsImNhcmRfZGF0YSIsImNhcmROYW1lIiwiX2dldENhcmREaXNwbGF5TmFtZSIsImNhcmRzVG9QbGF5IiwibWFwIiwiYyIsInVuaXF1ZUNhcmRzIiwiaGFzRHVwbGljYXRlIiwia2V5IiwiX3Jlc2V0Q2FyZEZsYWdzIiwidmFsaWRhdGlvblJlc3VsdCIsIl92YWxpZGF0ZUhhbmRUeXBlIiwidmFsaWQiLCJyZXF1ZXN0X2NodV9jYXJkIiwiZXJyb3JNc2ciLCJtc2ciLCJzZWxlY3RlZFR5cGUiLCJzZWxlY3RlZENvdW50IiwibGFzdFBsYXllZFR5cGUiLCJsYXN0UGxheWVkQ291bnQiLCJsYXN0UGxheWVkQ2FyZE5hbWVzIiwibmFtZXMiLCJqb2luIiwiZGV0YWlsTXNnIiwiaW5kZXhPZiIsInlvdXJDYXJkcyIsImRpc3BsYXlUZXh0IiwicHVzaFRocmVlQ2FyZCIsImNhcmRUb1JlbW92ZSIsIl91cGRhdGVIYW5kQ2FyZHNTaWxlbnQiLCJjYXJkc1BhcmVudCIsIm9sZENoaWxkcmVuIiwib2ZmIiwiRXZlbnRUeXBlIiwiVE9VQ0hfU1RBUlQiLCJkZXN0b3J5Q2FyZCIsImNob29zZV9jYXJkIiwiZGVzdHJveV9jYXJkIiwiX2dldE91dENhcmROb2RlIiwic2VsZWN0ZWROb2RlcyIsImZsYWciLCJzZW5kSGludFJlcXVlc3QiLCJfc2VsZWN0Q2FyZHMiLCJpc190cnVzdGVlIiwicmVhc29uIiwic3lzdGVtRXZlbnQiLCJTeXN0ZW1FdmVudCIsIk1PVVNFX01PVkUiLCJfb25Vc2VyQWN0aXZpdHkiLCJNT1VTRV9ET1dOIiwiVE9VQ0hfTU9WRSIsImFjdGl2aXR5VHlwZSIsIl9zZW5kQ2FuY2VsVHJ1c3RlZSIsImNhbmNlbFRydXN0ZWUiLCJzZW5kIiwicGF5bG9hZCIsIl9maW5kUGxheWFibGVDYXJkcyIsImxhc3RTZWxlY3RlZCIsImNhcmRDb3VudHMiLCJfZmluZFNtYWxsZXN0Q2FyZHMiLCJsYXN0VHlwZSIsImxhc3RSYW5rIiwiX2dldExhc3RQbGF5ZWRNYWluUmFuayIsImxhc3RDb3VudCIsInRvTG93ZXJDYXNlIiwiX2ZpbmRCZWF0aW5nU2luZ2xlIiwiX2ZpbmRCZWF0aW5nUGFpciIsIl9maW5kQmVhdGluZ1RyaXBsZSIsIl9maW5kQmVhdGluZ0JvbWIiLCJfZmluZEJlYXRpbmdCeUNvdW50IiwiY291bnRzIiwibWF4Q291bnQiLCJtYWluUmFuayIsInBhcnNlSW50IiwicmFua3MiLCJPYmplY3QiLCJrZXlzIiwiciIsInRhcmdldFJhbmsiLCJfZmluZFNtYWxsZXN0Qm9tYiIsImtpY2tlcnMiLCJyZXN1bHQiLCJraWNrZXJDYXJkcyIsIl9maW5kS2lja2VyQ2FyZHMiLCJjb25jYXQiLCJleGNsdWRlUmFuayIsImF2YWlsYWJsZSIsIm1pbiIsIl9maW5kUm9ja2V0Iiwiam9rZXJzIiwiZm91bmRDb3VudCIsImFscmVhZHlNYXRjaGVkIiwiY2FyZE5vZGUiLCJtYXRjaEtleSIsImNhcmRfaWQiLCJhZGRDaGlsZCIsInNldFNjYWxlIiwiZ2FtZVN0YXRlIiwiZ2FtZV9zdGF0ZSIsInBoYXNlIiwicGxheWVycyIsInAiLCJpc19sYW5kbG9yZCIsIm1hc3Rlcl9hY2NvdW50aWQiLCJoYW5kIiwibGFzdF9wbGF5ZWQiLCJsYXN0X3BsYXllcl9pZCIsImN1cnJlbnRfdHVybiIsIkFycmF5IiwiaXNBcnJheSIsImhhbmRUeXBlIiwiaXNOZXdSb3VuZCIsImlzX25ld19yb3VuZCIsImNhbkJlYXQiLCJfZXh0cmFjdE1haW5SYW5rIiwiaXNCb21iIiwiaXNSb2NrZXQiLCJzb3VuZE5hbWUiLCJfZ2V0Q2FyZFR5cGVTb3VuZCIsImNhcmRTb3VuZCIsInByZWZpeCIsImRhbmlTb3VuZCIsImhhc1NwZWNpZmljU291bmQiLCJfaGFzU3BlY2lmaWNDYXJkU291bmQiLCJyYW5kb21WYWx1ZSIsInNvdW5kSW5kZXgiLCJfcmFua1RvU291bmRJbmRleCIsImhhc1NvdW5kIiwic3BlY2lhbFR5cGVzIiwiX2V4dHJhY3RDYXJkUmFuayIsIk51bWJlciIsInZhbHVlIiwibG9naWNfdmFsdWUiLCJzdWZmaXgiLCJyYW5kb21JbmRleCIsIl9wbGF5R2FtZVJlc3VsdFNvdW5kIiwiaXNXaW4iLCJwYXNzTm9kZSIsImFkZENvbXBvbmVudCIsIm91dGxpbmUiLCJMYWJlbE91dGxpbmUiLCJ3aWR0aCIsInN1aXROYW1lcyIsInN1aXROYW1lIiwicmFua05hbWVzIiwicmFua05hbWUiLCJyYW5rQ291bnRzIiwidmFsdWVzIiwiZm91cnMiLCJ0aHJlZXMiLCJwYWlycyIsInNpbmdsZXMiLCJpc1NlcXVlbnRpYWwiLCJfaXNTZXF1ZW50aWFsIiwibm9Ud29Pckpva2VyIiwiZXZlcnkiLCJwYWlyUmFua3MiLCJ0aHJlZVJhbmtzIiwidGhyZWVDb3VudCIsInJvb21fY2F0ZWdvcnkiLCJfc2hvd0NvbXBldGl0aW9uUmVzdWx0UG9wdXAiLCJpc1dpbm5lciIsIm15V2luR29sZCIsInBsYXllciIsImlzX3dpbm5lciIsIndpbl9nb2xkIiwid2lubmVyX2lkIiwiaXNMYW5kbG9yZCIsIm9sZEdvbGQiLCJnb2JhbF9jb3VudCIsIm5ld0dvbGQiLCJnb2xkQWZ0ZXIiLCJnb2xkX2FmdGVyIiwiX3VwZGF0ZVBsYXllckdvbGREaXNwbGF5IiwibG9jYWxHb2xkIiwiX2NyZWF0ZUdhbWVSZXN1bHRQb3B1cCIsIl9jb250aW51ZUdhbWUiLCJfcmV0dXJuVG9Mb2JieSIsImNhbGxiYWNrIiwid2luU2l6ZSIsImNhbnZhcyIsImZpbmQiLCJtYXNrTm9kZSIsIkJsb2NrSW5wdXRFdmVudHMiLCJtYXNrU3ByaXRlIiwiU3ByaXRlIiwic3ByaXRlRnJhbWUiLCJTcHJpdGVGcmFtZSIsIlR5cGUiLCJTSU1QTEUiLCJzaXplTW9kZSIsIlNpemVNb2RlIiwiQ1VTVE9NIiwiaGVpZ2h0IiwicG9wdXBOb2RlIiwicG9wdXBXaWR0aCIsInBvcHVwSGVpZ2h0IiwiYmdOb2RlIiwiX2NyZWF0ZUdyYWRpZW50QmFja2dyb3VuZCIsImJvcmRlck5vZGUiLCJfY3JlYXRlR29sZGVuQm9yZGVyIiwiZWZmZWN0TGF5ZXIiLCJfY3JlYXRlVmljdG9yeVBhcnRpY2xlcyIsIl9jcmVhdGVEZWZlYXRQYXJ0aWNsZXMiLCJiYW5uZXJZIiwiYmFubmVyTm9kZSIsIl9jcmVhdGVSZXN1bHRCYW5uZXIiLCJkZXRhaWxYIiwiZGV0YWlsWSIsImRldGFpbE5vZGUiLCJfY3JlYXRlTXVsdGlwbGllckRldGFpbENhcmQiLCJsaXN0V2lkdGgiLCJsaXN0WCIsImxpc3RZIiwicGxheWVyTGlzdE5vZGUiLCJfY3JlYXRlUGxheWVyUmVzdWx0TGlzdCIsImJ0blkiLCJidXR0b25BcmVhIiwiX2NyZWF0ZUJ1dHRvbkFyZWEiLCJfc3RhcnROdW1iZXJBbmltYXRpb25zIiwiX3Jlc3VsdEVmZmVjdExheWVyIiwiZ3JhcGhpY3MiLCJHcmFwaGljcyIsInRvcENvbG9yIiwiYm90dG9tQ29sb3IiLCJmaWxsQ29sb3IiLCJyb3VuZFJlY3QiLCJmaWxsIiwiaW5uZXJHbG93IiwiZ2xvd1Nwcml0ZSIsIlNMSUNFRCIsIm92ZXJsYXkiLCJvdmVybGF5U3ByaXRlIiwiYm9yZGVyQ29sb3IiLCJnbG93Q29sb3IiLCJzdHJva2VDb2xvciIsImxpbmVXaWR0aCIsInN0cm9rZSIsImNvcm5lclNpemUiLCJjb3JuZXJzIiwicm90IiwiY29ybmVyIiwiZGVjb3JOb2RlIiwiZGciLCJtb3ZlVG8iLCJsaW5lVG8iLCJhbmdsZSIsImJhbm5lcldpZHRoIiwiYmFubmVySGVpZ2h0IiwidGl0bGVOb2RlIiwiYW5jaG9yWCIsImFuY2hvclkiLCJ0aXRsZUxhYmVsIiwiZm9udEZhbWlseSIsImhvcml6b250YWxBbGlnbiIsIkhvcml6b250YWxBbGlnbiIsIkNFTlRFUiIsInZlcnRpY2FsQWxpZ24iLCJWZXJ0aWNhbEFsaWduIiwic2hhZG93IiwiTGFiZWxTaGFkb3ciLCJvZmZzZXQiLCJibHVyIiwiY2FyZFdpZHRoIiwiY2FyZEhlaWdodCIsImxpbmVOb2RlIiwibGciLCJtdWx0aURldGFpbCIsIm11bHRpX2RldGFpbCIsImRldGFpbHMiLCJiYXNlX3Njb3JlIiwicWlhbmdfY291bnQiLCJxaWFuZ19tdWx0aSIsImJvbWJfY291bnQiLCJib21iX211bHRpIiwicm9ja2V0X2NvdW50Iiwicm9ja2V0X211bHRpIiwic3ByaW5nX3R5cGUiLCJpdGVtWSIsIml0ZW1IZWlnaHQiLCJpdGVtIiwiaXRlbU5vZGUiLCJ2YWx1ZU5vZGUiLCJ2YWx1ZUxhYmVsIiwidG90YWxNdWx0aU5vZGUiLCJ0b3RhbE11bHRpQmciLCJ0bWciLCJ0b3RhbExhYmVsIiwidHRsIiwibXVsdGlWYWx1ZU5vZGUiLCJtdmwiLCJtdWx0aXBsZSIsIm12byIsImxpc3ROb2RlIiwibGlzdEhlaWdodCIsImhlYWRlck5vZGUiLCJoZWFkZXJzIiwiaGVhZGVyWCIsImhOb2RlIiwiaExhYmVsIiwic2VwTm9kZSIsInNnIiwiaXRlbVN0YXJ0WSIsImlzQ3VycmVudFBsYXllciIsIl9jcmVhdGVQbGF5ZXJSZXN1bHRJdGVtIiwiaGlnaGxpZ2h0IiwiaGciLCJhdmF0YXJOb2RlIiwiYXZhdGFyQmciLCJhZyIsInJvbGUiLCJjaXJjbGUiLCJhdmF0YXJJbmRleCIsImF2YXRhclBhdGgiLCJhdmF0YXJTcHJpdGUiLCJzcCIsInJvbGVJY29uTm9kZSIsInJvbGVMYWJlbCIsIm5hbWVOb2RlIiwibmFtZUxhYmVsIiwicGxheWVyX25hbWUiLCJyb2xlTm9kZSIsInJvbGVUZXh0Iiwid2luR29sZCIsIndpbk5vZGUiLCJ3aW5MYWJlbCIsIndpbk91dGxpbmUiLCJhcmVhTm9kZSIsImNvbnRpbnVlQnRuIiwiX2NyZWF0ZVN0eWxlZEJ1dHRvbiIsIlRPVUNIX0VORCIsImxvYmJ5QnRuIiwidGV4dCIsImlzUHJpbWFyeSIsImJ0bk5vZGUiLCJidG5XaWR0aCIsImJ0bkhlaWdodCIsIm92ZXJmbG93IiwiT3ZlcmZsb3ciLCJTSFJJTksiLCJUT1VDSF9DQU5DRUwiLCJjb2luIiwiZyIsInRhcmdldFkiLCJkZWxheSIsInBhcmFsbGVsIiwic3RhciIsIl9kcmF3U3RhciIsInBhcnRpY2xlIiwiY3giLCJjeSIsImlubmVyUmFkaXVzIiwicG9pbnRzIiwib3V0ZXJSYWRpdXMiLCJyYWRpdXMiLCJQSSIsImNvcyIsInNpbiIsImNsb3NlIiwiX2ZpbmROb2RlQnlOYW1lIiwidGFyZ2V0TXVsdGkiLCJfYW5pbWF0ZU51bWJlciIsImZyb20iLCJzdGFydFRpbWUiLCJkaWZmIiwidXBkYXRlIiwiZWxhcHNlZCIsInByb2dyZXNzIiwiZWFzZVByb2dyZXNzIiwicG93IiwiY3VycmVudCIsImZvdW5kIiwicGxheWVyR29sZCIsInJvb21Db25maWciLCJjdXJyZW50Um9vbUNvbmZpZyIsIm1pbkdvbGQiLCJtaW5fZ29sZCIsIl9zaG93SW5zdWZmaWNpZW50R29sZFBvcHVwIiwiX2RvQ29udGludWVHYW1lIiwiX3Jlc2V0R2FtZVN0YXRlIiwicmVxdWVzdFJlYWR5IiwiY3VycmVudEdvbGQiLCJyZXF1aXJlZEdvbGQiLCJkaXJlY3RvciIsImdldFNjZW5lIiwiY29udGVudE5vZGUiLCJjb250ZW50TGFiZWwiLCJfZm9ybWF0R29sZCIsIlJFU0laRV9IRUlHSFQiLCJidG5BcmVhTm9kZSIsImFkQnRuIiwiYWRCZyIsImFkTGFiZWxOb2RlIiwiYWRMYWJlbCIsImxvYmJ5QmciLCJsb2JieUxhYmVsTm9kZSIsImxvYmJ5TGFiZWwiLCJfaW5zdWZmaWNpZW50R29sZFBvcHVwIiwiX2luc3VmZmljaWVudEdvbGRNYXNrIiwiX3dhdGNoQWRGb3JHb2xkIiwic3VjY2VzcyIsIl9jbG9zZUluc3VmZmljaWVudEdvbGRQb3B1cCIsInR0Iiwic2hvd1Jld2FyZGVkVmlkZW9BZCIsIl9yZXdhcmRHb2xkQWZ0ZXJBZCIsImZhaWwiLCJfc2hvd01lc3NhZ2UiLCJ3eCIsImNyZWF0ZVJld2FyZGVkVmlkZW9BZCIsInJld2FyZGVkVmlkZW9BZCIsImFkVW5pdElkIiwib25DbG9zZSIsInJlcyIsImlzRW5kZWQiLCJvbkVycm9yIiwic2hvdyIsInRoZW4iLCJfcmV3YXJkR29sZEFmdGVyR29sZCIsInJld2FyZEFtb3VudCIsInVwZGF0ZUdvbGQiLCJzZW5kQWRSZXdhcmQiLCJnb2xkIiwidG9GaXhlZCIsInRvU3RyaW5nIiwibGVhdmVSb29tIiwibG9hZFNjZW5lIiwiX2NsZWFyQm90dG9tQ2FyZHMiLCJwbGF5ZXJzX3NlYXRfcG9zIiwic2VhdE5vZGUiLCJvdXRab25lTmFtZSIsIm91dFpvbmUiLCJwbGF5ZXJOb2RlTGlzdCIsInBsYXllck5vZGUiLCJwbGF5ZXJTY3JpcHQiLCJyZWFkeWltYWdlIiwiZ2xvYmFsY291bnRfbGFiZWwiLCJfdXBkYXRlUGxheWVyTWF0Y2hDb2luRGlzcGxheSIsIm1hdGNoQ29pbiIsImlzX2ZpbmFsX3JvdW5kIiwibXlNYXRjaENvaW4iLCJtYXRjaF9jb2luIiwiYmciLCJyZXN1bHROb2RlIiwicmVzdWx0TGFiZWwiLCJtdWx0aU5vZGUiLCJtdWx0aUxhYmVsIiwiY29pbk5vZGUiLCJjb2luTGFiZWwiLCJpbml0aWFsQ291bnRkb3duIiwiYXJlbmFfY291bnRkb3duIiwiY291bnRkb3duQ29udGFpbmVyIiwiY291bnRkb3duTGFiZWwiLCJjb3VudGRvd25MYWJlbENvbXAiLCJjb3VudGRvd25OdW1iZXIiLCJjb3VudGRvd25OdW1iZXJDb21wIiwiQkxBQ0siLCJfY291bnRkb3duTGFiZWxOb2RlIiwiX2NvdW50ZG93bk51bWJlck5vZGUiLCJfYXJlbmFDb3VudGRvd25TZWNvbmRzIiwiX3NldHVwQXJlbmFDb3VudGRvd25MaXN0ZW5lcnMiLCJfc2hvd1dhaXRpbmdGb3JTZXJ2ZXIiLCJvbkFyZW5hUm91bmRDb3VudGRvd24iLCJzZWNvbmRzIiwiX3VwZGF0ZUFyZW5hQ291bnRkb3duVUkiLCJvbkFyZW5hQ291bnRkb3duVGljayIsIm9uQXJlbmFBdXRvUmVhZHkiLCJfc2hvd0FyZW5hQXV0b1JlYWR5TWVzc2FnZSIsIm9uQXJlbmFSZWNvbm5lY3RTdGF0ZSIsImNvdW50ZG93biIsIm51bUxhYmVsIiwidG90YWxfcm91bmRzIiwiX3Nob3dNYXRjaENvaW5EaXNwbGF5IiwiX3VwZGF0ZUNvbXBldGl0aW9uQ291bnRkb3duRGlzcGxheSIsIl91cGRhdGVNYXRjaENvaW5EaXNwbGF5IiwiZGVsdGEiLCJfbWF0Y2hDb2luTm9kZSIsIm1hdGNoQ29pbk5vZGUiLCJpY29uTm9kZSIsImljb25MYWJlbCIsIl9zaG93TWF0Y2hDb2luRGVsdGFBbmltYXRpb24iLCJkZWx0YU5vZGUiLCJkZWx0YUxhYmVsIiwiX3Nob3dFbGltaW5hdGVkUG9wdXAiLCJyYW5rTm9kZSIsInJhbmtMYWJlbCIsInJlYXNvbk5vZGUiLCJyZWFzb25MYWJlbCIsInRvdGFsTm9kZSIsInRvdGFsX3BsYXllcnMiLCJyZXdhcmRzIiwicmV3YXJkTm9kZSIsInJld2FyZExhYmVsIiwiYnRuQmciLCJidG5MYWJlbE5vZGUiLCJidG5MYWJlbCIsIl9lbGltaW5hdGVkUG9wdXAiLCJfZWxpbWluYXRlZE1hc2siLCJjdXJyZW50X3JvdW5kIiwiX3Nob3dBZHZhbmNlVG9hc3QiLCJ0b2FzdE5vZGUiLCJfc2hvd0NoYW1waW9uUG9wdXAiLCJlbmFibGVCb2xkIiwicmFua2luZ3MiLCJ0b3BUaHJlZVkiLCJfY3JlYXRlUmFua2luZ0l0ZW0iLCJvdGhlclRpdGxlTm9kZSIsIm90aGVyVGl0bGVMYWJlbCIsInN0YXJ0WSIsIm1heE90aGVyUmFua2luZ3MiLCJyYW5rSW5mbyIsInJhbmtJdGVtTm9kZSIsInJhbmtJdGVtTGFiZWwiLCJjb25maXJtQmciLCJjb25maXJtTGFiZWxOb2RlIiwiY29uZmlybUxhYmVsIiwiX2NyZWF0ZUNoYW1waW9uUGFydGljbGVzIiwiX2NoYW1waW9uUG9wdXAiLCJfY2hhbXBpb25NYXNrIiwiYmdDb2xvciIsInJhbmtMYWJlbE5vZGUiLCJyYW5rVGV4dCIsIm5hbWVMYWJlbE5vZGUiLCJjb2luTGFiZWxOb2RlIiwicGFyZW50Tm9kZSIsInBhcnRpY2xlTGFiZWwiLCJfc2hvd1RvdXJuYW1lbnRGaW5hbFJhbmtEaWFsb2ciLCJtc2dOb2RlIiwibXNnTGFiZWwiLCJydW5BY3Rpb24iLCJzZXF1ZW5jZSIsInNwYXduIiwic2NhbGVUbyIsImVhc2VCYWNrT3V0IiwiZmFkZUluIiwidGl0bGVCZ05vZGUiLCJ0aXRsZUJnIiwidG9wMyIsInBvZGl1bVkiLCJwb2RpdW1TcGFjaW5nIiwiX2NyZWF0ZVBvZGl1bUVudHJ5IiwidG9wMjAiLCJsaXN0VGl0bGVOb2RlIiwibGlzdFRpdGxlTGFiZWwiLCJzY3JvbGxWaWV3Tm9kZSIsIm1hc2siLCJNYXNrIiwiUkVDVCIsInRvcDNQbGF5ZXJJRHMiLCJmaWx0ZXJlZFRvcDIwIiwicmFua0RhdGEiLCJhY3R1YWxSYW5rIiwiX2NyZWF0ZVJhbmtMaXN0SXRlbSIsIl9hZGRTY3JvbGxWaWV3VG91Y2giLCJzZXAiLCJteVJhbmtCZ05vZGUiLCJteVJhbmtCZyIsIm15UmFua05vZGUiLCJteVJhbmtMYWJlbCIsIm15X3JhbmsiLCJteV9tYXRjaF9jb2luIiwiYnRuTGFiZWxDb21wIiwiX2xvYWRBdmF0YXJTcHJpdGUiLCJhdmF0YXIiLCJpc19yb2JvdCIsInBsYXllck5hbWUiLCJMRUZUIiwiQ0xBTVAiLCJSSUdIVCIsInZpZXdIZWlnaHQiLCJ0b3VjaFN0YXJ0WSIsImNvbnRlbnRTdGFydFkiLCJtYXhPZmZzZXQiLCJnZXRMb2NhdGlvblkiLCJ0b3VjaFkiLCJkZWx0YVkiLCJuZXdZIiwibWluWSIsIm1heFkiLCJlbnRyeU5vZGUiLCJtZWRhbE5vZGUiLCJtZWRhbCIsIm1lZGFsQ29sb3IiLCJyYW5rTnVtTm9kZSIsInJhbmtOdW1MYWJlbCIsImF2YXRhckZyYW1lTm9kZSIsImF2YXRhckZyYW1lIiwiX2dldFJvYm90RGlzcGxheU5hbWUiLCJvcmlnaW5hbE5hbWUiLCJyb2JvdEluZGV4IiwibGFzdENoYXIiLCJzcHJpdGUiLCJhdmF0YXJVcmwiLCJpc1JvYm90IiwiZnVsbFVybCIsImNkblVybCIsImFzc2V0TWFuYWdlciIsImxvYWRSZW1vdGUiLCJleHQiLCJ0ZXh0dXJlIiwiZmFsbGJhY2tTcHJpdGUiLCJlIiwicmVzb3VyY2VQYXRoIiwiZGVmYXVsdEluZGV4IiwiZGVmYXVsdFBhdGgiLCJfaXNDdXJyZW50UGxheWVyVHJ1c3RlZSIsInNjcmlwdCIsIl9pc1RydXN0ZWUi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LE1BQU0sQ0FBQ1osVUFBRCxDQUFqRCxFQUErRDtVQUMzRCxPQUFPKzBCLE1BQU0sQ0FBQ0MsVUFBUCxJQUFxQixLQUE1QjtRQUNIO01BQ0o7SUFDSjtFQUNKOztFQUVELE9BQU8sS0FBUDtBQUNILENBejFOTCIsInNvdXJjZVJvb3QiOiIvIiwic291cmNlc0NvbnRlbnQiOlsiLy8g5L2/55So5YWo5bGA5Y+Y6YeP77yM5LiN5L2/55SoIHJlcXVpcmVcbi8vIOOAkOW9u+W6leS/ruWkjeeJiOacrOOAkeacjeWKoeerr+aVsOaNruS4uuWUr+S4gOaVsOaNrua6kFxuLy8gXG4vLyDmoLjlv4Pljp/liJnvvJpcbi8vIDEuIGhhbmRDYXJkcyDmmK/llK/kuIDmlbDmja7mupDvvIzkv53lrZjmnI3liqHnq6/ljp/lp4vmlbDmja5cbi8vIDIuIOemgeatouS7u+S9leaVsOaNrui9rOaNouOAgeaOkuW6j+OAgemHjeaWsOiuoeeul1xuLy8gMy4gcmVuZGVyQ2FyZHMoKSDmmK/llK/kuIDmuLLmn5PlhaXlj6Ncbi8vIDQuIOWKqOeUu+WPquaYr+inhuinieaViOaenO+8jOe7neS4jeiDveS/ruaUueaVsOaNrlxuLy8gNS4gY2xlYXJBbGxDYXJkcygpIOa4heeQhuaJgOacieaXp+iKgueCue+8iOino+WGs+iDjOmdoueJjOaui+eVme+8iVxuXG52YXIgaXNvcGVuX3NvdW5kID0gd2luZG93Lmlzb3Blbl9zb3VuZCB8fCAxXG52YXIgcWlhbl9zdGF0ZSA9IHdpbmRvdy5xaWFuX3N0YXRlIHx8IHsgYnVxaWFuZzogMCwgcWlhbjogMSB9XG52YXIgQ2FyZHNWYWx1ZSA9IHdpbmRvdy5DYXJkc1ZhbHVlIHx8IHt9XG52YXIgUm9vbVN0YXRlID0gd2luZG93LlJvb21TdGF0ZSB8fCB7fVxuXG4vLyDpn7PmlYjnvJPlrZhcbnZhciBfYXVkaW9DbGlwcyA9IHt9XG5cbi8vIOeJjOW4g+WxgOmFjee9rlxudmFyIENhcmRMYXlvdXQgPSB7XG4gICAgY2FyZFNjYWxlOiAwLjgsXG4gICAgY2FyZFk6IC0yNTAsXG4gICAgY2FyZFNwYWNpbmc6IDM1LFxuICAgIGJvdHRvbUNhcmRTY2FsZTogMC40LFxuICAgIGJvdHRvbUNhcmRTcGFjaW5nOiAyNSxcbiAgICBvdXRDYXJkU2NhbGU6IDAuNSxcbiAgICBvdXRDYXJkU3BhY2luZzogMjUsXG59XG5cbi8vIOWPkeeJjOWKqOeUu+mFjee9rlxudmFyIERlYWxDb25maWcgPSB7XG4gICAgYW5pbUR1cmF0aW9uOiAwLjEyLFxuICAgIGRlY2tQb3NpdGlvbjogY2MudjIoMCwgMTAwKSxcbiAgICBjYXJkSW50ZXJ2YWw6IDgwLFxufVxuXG4vLyDliqDovb3lubbmkq3mlL7pn7PmlYhcbmZ1bmN0aW9uIHBsYXlTb3VuZChwYXRoKSB7XG4gICAgaWYgKCFpc29wZW5fc291bmQpIHJldHVybiBudWxsXG4gICAgaWYgKF9hdWRpb0NsaXBzW3BhdGhdKSB7XG4gICAgICAgIHJldHVybiBjYy5hdWRpb0VuZ2luZS5wbGF5KF9hdWRpb0NsaXBzW3BhdGhdLCBmYWxzZSwgMSlcbiAgICB9XG4gICAgY2MucmVzb3VyY2VzLmxvYWQocGF0aCwgY2MuQXVkaW9DbGlwLCBmdW5jdGlvbihlcnIsIGNsaXApIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgX2F1ZGlvQ2xpcHNbcGF0aF0gPSBjbGlwXG4gICAgICAgIGNjLmF1ZGlvRW5naW5lLnBsYXkoY2xpcCwgZmFsc2UsIDEpXG4gICAgfSlcbiAgICByZXR1cm4gbnVsbFxufVxuXG5jYy5DbGFzcyh7XG4gICAgZXh0ZW5kczogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBnYW1laW5nVUk6IGNjLk5vZGUsXG4gICAgICAgIGNhcmRfcHJlZmFiOiBjYy5QcmVmYWIsXG4gICAgICAgIHJvYlVJOiBjYy5Ob2RlLFxuICAgICAgICBib3R0b21fY2FyZF9wb3Nfbm9kZTogY2MuTm9kZSxcbiAgICAgICAgcGxheWluZ1VJX25vZGU6IGNjLk5vZGUsXG4gICAgICAgIHRpcHNMYWJlbDogY2MuTGFiZWwsXG4gICAgICAgIGNhcmRzX25vZGU6IGNjLk5vZGUsICAvLyDmiYvniYzoioLngrnlrrnlmahcbiAgICAgICAgLy8g8J+VkOOAkOaWsOWinuOAkeWAkuiuoeaXtkxhYmVs5byV55SoXG4gICAgICAgIGJpZENvdW50ZG93bkxhYmVsOiBjYy5MYWJlbCwgICAgLy8g5oqi5Zyw5Li75YCS6K6h5pe2XG4gICAgICAgIHBsYXlDb3VudGRvd25MYWJlbDogY2MuTGFiZWwsICAgLy8g5Ye654mM5YCS6K6h5pe2XG4gICAgICAgIC8vIPCflIrjgJDmlrDlop7jgJHmu7TnrZTpn7PmlYjvvIgz56eS5YKs5L+D6Z+z5pWI77yJXG4gICAgICAgIHRpY2tBdWRpbzoge1xuICAgICAgICAgICAgZGVmYXVsdDogbnVsbCxcbiAgICAgICAgICAgIHR5cGU6IGNjLkF1ZGlvQ2xpcFxuICAgICAgICB9LFxuICAgIH0sXG5cbiAgICBvbkxvYWQgKCkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIm15Z2xvYmFsIOacquWumuS5iVwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHpooTliqDovb3ljaHniYznsr7ngbXlm77pm4ZcbiAgICAgICAgdGhpcy5fcHJlbG9hZENhcmRBdGxhcygpXG5cbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeehruS/neaJi+eJjOWuueWZqOiKgueCueWtmOWcqFxuICAgICAgICBpZiAoIXRoaXMuY2FyZHNfbm9kZSkge1xuICAgICAgICAgICAgLy8g5p+l5om+5piv5ZCm5bey5a2Y5Zyo5omL54mM5a655Zmo6IqC54K5XG4gICAgICAgICAgICB2YXIgZ2FtZVNjZW5lTm9kZSA9IHRoaXMubm9kZS5wYXJlbnRcbiAgICAgICAgICAgIGlmIChnYW1lU2NlbmVOb2RlKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnYW1lU2NlbmVOb2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGdhbWVTY2VuZU5vZGUuY2hpbGRyZW5baV1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLm5hbWUgPT09IFwiY2FyZHNfbm9kZVwiIHx8IGNoaWxkLm5hbWUgPT09IFwiY2FyZHNcIiB8fCBjaGlsZC5uYW1lID09PSBcImhhbmRDYXJkc1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhcmRzX25vZGUgPSBjaGlsZFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzmsqHmib7liLDvvIzliJvlu7rkuIDkuKrmlrDnmoTlrrnlmajoioLngrlcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuY2FyZHNfbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3Q2FyZHNOb2RlID0gbmV3IGNjLk5vZGUoXCJjYXJkc19ub2RlXCIpXG4gICAgICAgICAgICAgICAgICAgIG5ld0NhcmRzTm9kZS5wYXJlbnQgPSBnYW1lU2NlbmVOb2RlXG4gICAgICAgICAgICAgICAgICAgIG5ld0NhcmRzTm9kZS5zZXRQb3NpdGlvbigwLCAwKVxuICAgICAgICAgICAgICAgICAgICBuZXdDYXJkc05vZGUuc2V0QW5jaG9yUG9pbnQoMC41LCAwLjUpXG4gICAgICAgICAgICAgICAgICAgIG5ld0NhcmRzTm9kZS5zZXRDb250ZW50U2l6ZShjYy5zaXplKDgwMCwgMjAwKSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYXJkc19ub2RlID0gbmV3Q2FyZHNOb2RlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIOOAkOaguOW/g+OAkeWUr+S4gOaVsOaNrua6kCAtIOacjeWKoeerr+WOn+Wni+aJi+eJjOaVsOaNrlxuICAgICAgICAvLyDjgJDph43opoHjgJHnpoHmraLku7vkvZXkv67mlLnjgIHmjpLluo/jgIHovazmjaJcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHRoaXMuaGFuZENhcmRzID0gW10gICAgICAgICAgIC8vIOOAkOWUr+S4gOaVsOaNrua6kOOAkeacjeWKoeerr+WOn+Wni+aJi+eJjFxuICAgICAgICB0aGlzLmJvdHRvbUNhcmRzID0gW10gICAgICAgICAvLyDlupXniYzmlbDmja5cbiAgICAgICAgdGhpcy5jaG9vc2VfY2FyZF9kYXRhID0gW10gICAgLy8g6YCJ5Lit55qE54mMXG4gICAgICAgIFxuICAgICAgICAvLyDmiqLlnLDkuLvnm7jlhbNcbiAgICAgICAgdGhpcy5yb2JfcGxheWVyX2FjY291bnRpZCA9IDBcbiAgICAgICAgdGhpcy5fYmlkZGluZ1BoYXNlID0gXCJpZGxlXCJcbiAgICAgICAgdGhpcy5fZ2FtZVBoYXNlID0gXCJpZGxlXCIgIC8vIPCflKfjgJDmlrDlop7jgJHmuLjmiI/pmLbmrrU6IGlkbGUsIGJpZGRpbmcsIHBsYXlpbmdcbiAgICAgICAgdGhpcy5jYXJkc1JlYWR5ID0gZmFsc2VcbiAgICAgICAgdGhpcy5fcGVuZGluZ0JpZFVJID0gZmFsc2UgICAgLy8g8J+Up+OAkOaWsOWinuOAkeW+heaYvuekuueahOaKouWcsOS4u1VJ5qCH6K6wXG4gICAgICAgIHRoaXMuX3BlbmRpbmdCaWRSb3VuZCA9IDEgICAgIC8vIPCflKfjgJDmlrDlop7jgJHlvoXmmL7npLrnmoTmiqLlnLDkuLvova7mrKFcbiAgICAgICAgXG4gICAgICAgIC8vIPCflZDjgJDlgJLorqHml7bns7vnu5/jgJFcbiAgICAgICAgdGhpcy5fYmlkVGltZW91dCA9IDBcbiAgICAgICAgdGhpcy5fcGxheVRpbWVvdXQgPSAwXG4gICAgICAgIHRoaXMuX2JpZENvdW50ZG93blRpbWVyID0gbnVsbFxuICAgICAgICB0aGlzLl9wbGF5Q291bnRkb3duVGltZXIgPSBudWxsXG4gICAgICAgIHRoaXMuX2JpZFRpbWVMZWZ0ID0gMFxuICAgICAgICB0aGlzLl9wbGF5VGltZUxlZnQgPSAwXG4gICAgICAgIHRoaXMuX2lzQmlkQ291bnRkb3duVGlja2luZyA9IGZhbHNlXG4gICAgICAgIHRoaXMuX2lzUGxheUNvdW50ZG93blRpY2tpbmcgPSBmYWxzZVxuICAgICAgICB0aGlzLl9pc0JpZFdhcm5pbmcgPSBmYWxzZVxuICAgICAgICB0aGlzLl9pc1BsYXlXYXJuaW5nID0gZmFsc2VcbiAgICAgICAgdGhpcy5fYmlkRXhwaXJlc0F0ID0gMCAgLy8g8J+Up+OAkOaWsOWinuOAkeacjeWKoeerr+i/h+acn+aXtumXtOaIs++8iOavq+enku+8iVxuICAgICAgICBcbiAgICAgICAgLy8g5bqV54mM6IqC54K5XG4gICAgICAgIHRoaXMuYm90dG9tX2NhcmQgPSBbXVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIOOAkOernuaKgOWcuuOAkeeKtuaAgeWPmOmHj1xuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdGhpcy5faXNDb21wZXRpdGlvbiA9IGZhbHNlICAgICAgICAgICAvLyDmmK/lkKbmmK/nq57mioDlnLrmqKHlvI9cbiAgICAgICAgdGhpcy5fcm9vbUNhdGVnb3J5ID0gMSAgICAgICAgICAgICAgICAvLyDmiL/pl7TnsbvlnovvvJoxPeaZrumAmuWcuu+8jDI956ue5oqA5Zy6XG4gICAgICAgIHRoaXMuX21hdGNoQ29pbiA9IDAgICAgICAgICAgICAgICAgICAgLy8g5q+U6LWb6YeR5biBXG4gICAgICAgIHRoaXMuX2NvbXBldGl0aW9uUm91bmQgPSAwICAgICAgICAgICAgLy8g5b2T5YmN6L2u5qyhXG4gICAgICAgIHRoaXMuX2NvbXBldGl0aW9uVG90YWxSb3VuZHMgPSAwICAgICAgLy8g5oC76L2u5qyhXG4gICAgICAgIHRoaXMuX2NvbXBldGl0aW9uQ291bnRkb3duID0gMCAgICAgICAgLy8g56ue5oqA5Zy65YCS6K6h5pe2XG4gICAgICAgIHRoaXMuX2NvbXBldGl0aW9uQ291bnRkb3duVGltZXIgPSBudWxsIC8vIOernuaKgOWcuuWAkuiuoeaXtuWumuaXtuWZqFxuICAgICAgICB0aGlzLl93YXNEaXNjb25uZWN0ZWQgPSBmYWxzZSAgICAgICAgIC8vIOaYr+WQpuWcqOavlOi1m+S4reaOiee6v1xuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOaJmOeuoeOAkeeUqOaIt+a0u+WKqOajgOa1iyAtIOinpuWPkeWPlua2iOaJmOeuoVxuICAgICAgICB0aGlzLl9sYXN0VXNlckFjdGl2aXR5VGltZSA9IDAgICAgICAgIC8vIOS4iuasoeeUqOaIt+a0u+WKqOaXtumXtFxuICAgICAgICB0aGlzLl91c2VyQWN0aXZpdHlUaHJvdHRsZSA9IDEwMDAgICAgIC8vIOiKgua1geaXtumXtO+8iOavq+enku+8iVxuICAgICAgICB0aGlzLl9zZXR1cFVzZXJBY3Rpdml0eURldGVjdGlvbigpXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT0g5pyN5Yqh5Zmo5raI5oGv55uR5ZCsID09PT09PT09PT09PVxuICAgICAgICBcbiAgICAgICAgLy8g44CQ5qC45b+D44CR55uR5ZCs5pyN5Yqh5Zmo5Y+R54mM5raI5oGvIC0g5ZSv5LiA5pWw5o2u5YWl5Y+jXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vblB1c2hDYXJkcyhmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyA9PT09PT09PT09IOacjeWKoeerr+WPkeeJjOa2iOaBryA9PT09PT09PT09XCIpXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfg48g5pyN5Yqh56uv5Y6f5aeL5omL54mMOlwiLCBKU09OLnN0cmluZ2lmeShkYXRhLmNhcmRzKSlcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyDmnI3liqHnq6/ljp/lp4vlupXniYw6XCIsIEpTT04uc3RyaW5naWZ5KGRhdGEuYm90dG9tX2NhcmRzKSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeaWsOS4gOi9ruWPkeeJjOaXtu+8jOWFs+mXreS4iuS4gOi9rueahOe7k+eul+W8ueeql1xuICAgICAgICAgICAgaWYgKHRoaXMuX2dhbWVSZXN1bHRQb3B1cCB8fCB0aGlzLl9nYW1lUmVzdWx0TWFzaykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyBbb25QdXNoQ2FyZHNdIOWFs+mXreS4iuS4gOi9rueahOe7k+eul+W8ueeql1wiKVxuICAgICAgICAgICAgICAgIHRoaXMuX2Nsb3NlR2FtZVJlc3VsdFBvcHVwKHRoaXMuX2dhbWVSZXN1bHRQb3B1cCwgdGhpcy5fZ2FtZVJlc3VsdE1hc2spXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlgZzmraLmiYDmnInnq57mioDlnLrlgJLorqHml7ZcbiAgICAgICAgICAgIHRoaXMuX3N0b3BBcmVuYUNvdW50ZG93bigpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHmuIXnkIbmoYzpnaLkuIrnmoTniYzvvIjkuIrkuIDova7mnIDlkI7kuIDmiYvniYzvvIlcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyBbb25QdXNoQ2FyZHNdIOa4heeQhuahjOmdouS4iueahOeJjFwiKVxuICAgICAgICAgICAgdGhpcy5fY2xlYXJBbGxPdXRDYXJkWm9uZXMoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDjgJDmoLjlv4PjgJHnm7TmjqXkv53lrZjmnI3liqHnq6/mlbDmja7vvIzkuI3lgZrku7vkvZXovazmjaJcbiAgICAgICAgICAgIHRoaXMuaGFuZENhcmRzID0gZGF0YS5jYXJkcyB8fCBbXVxuICAgICAgICAgICAgdGhpcy5ib3R0b21DYXJkcyA9IGRhdGEuYm90dG9tX2NhcmRzIHx8IFtdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOOAkOaguOW/g+OAkeWUr+S4gOa4suafk+WFpeWPo1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJDYXJkcyh0aGlzLmhhbmRDYXJkcylcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIOebkeWQrOWPq+WcsOS4u+i9ruasoe+8iOaXp+eJiOa2iOaBr++8jOS7heeUqOS6juWFvOWuue+8iVxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25CaWRUdXJuKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgLy8g5LiN5YaN5aSE55CG77yM6YG/5YWN6YeN5aSNXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDnm5HlkKzlj6vlnLDkuLvnu5PmnpxcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQmlkUmVzdWx0KGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgLy8g8J+UkuOAkOmHjeimgeOAkeaUtuWIsOe7k+aenO+8jOWBnOatouWAkuiuoeaXtlxuICAgICAgICAgICAgdGhpcy5fc3RvcEJpZENvdW50ZG93bigpXG4gICAgICAgICAgICBpZiAodGhpcy5ub2RlICYmIHRoaXMubm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5vZGUucGFyZW50LmVtaXQoXCJiaWRfcmVzdWx0X2V2ZW50XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyX2lkOiBkYXRhLmFjY291bnRpZCxcbiAgICAgICAgICAgICAgICAgICAgYmlkOiBkYXRhLnN0YXRlXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIOebkeWQrOaKouWcsOS4u+i9ruasoe+8iOaXp+eJiOa2iOaBr++8jOS7heeUqOS6juWFvOWuue+8iVxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25DYW5Sb2JTdGF0ZShmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIC8vIOS4jeWGjeWkhOeQhu+8jOmBv+WFjemHjeWkjVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g55uR5ZCs5Ye654mM6L2u5qyhXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkNhbkNodUNhcmQoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICB2YXIgcGxheWVySWQgPSBkYXRhLnBsYXllcl9pZCB8fCBkYXRhXG4gICAgICAgICAgICB2YXIgbXlQbGF5ZXJJZCA9IG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKCkuaWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5zZXJ2ZXJQbGF5ZXJJZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRFxuXG4gICAgICAgICAgICAvLyDwn5SS44CQ6YeN6KaB44CR5YWI5YGc5q2i5LmL5YmN55qE5YCS6K6h5pe277yI5pyN5Yqh5Zmo6L2u6L2s5LqG77yJXG4gICAgICAgICAgICB0aGlzLl9zdG9wUGxheUNvdW50ZG93bigpXG5cbiAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHkv53lrZjlh7rniYznirbmgIHvvIznlKjkuo7mj5DnpLrlip/og71cbiAgICAgICAgICAgIHRoaXMuX211c3RQbGF5ID0gZGF0YS5tdXN0X3BsYXkgfHwgZmFsc2VcbiAgICAgICAgICAgIHRoaXMuX2NhbkJlYXQgPSBkYXRhLmNhbl9iZWF0IHx8IGZhbHNlXG4gICAgICAgICAgICB0aGlzLl9sYXN0UGxheWVkQ2FyZHMgPSBudWxsICAvLyDkuIrlrrblh7rnmoTniYzvvIzpnIDopoHku44gb25PdGhlclBsYXllckNodUNhcmQg6I635Y+WXG5cbiAgICAgICAgICAgIGlmIChTdHJpbmcocGxheWVySWQpID09PSBTdHJpbmcobXlQbGF5ZXJJZCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9oaWRlUm9iVUkoKVxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJPdXRab25lKG15UGxheWVySWQpXG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5aW5nVUlfbm9kZS5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheVRpbWVvdXQgPSBkYXRhLnRpbWVvdXQgfHwgMTVcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGFydFBsYXlDb3VudGRvd24oKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wbGF5aW5nVUlfbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsYXlpbmdVSV9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g55uR5ZCs5YW25LuW546p5a625Ye654mMXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbk90aGVyUGxheWVyQ2h1Q2FyZChmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIC8vIPCflJLjgJDph43opoHjgJHmlLbliLDlh7rniYzmtojmga/vvIzlgZzmraLmiJHnmoTlgJLorqHml7ZcbiAgICAgICAgICAgIHRoaXMuX3N0b3BQbGF5Q291bnRkb3duKClcbiAgICAgICAgICAgIGlmICh0aGlzLnBsYXlpbmdVSV9ub2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5aW5nVUlfbm9kZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5aSE55CG5LiN5Ye655qE5oOF5Ya1XG4gICAgICAgICAgICBpZiAoZGF0YS5pc19wYXNzKSB7XG4gICAgICAgICAgICAgICAgLy8g8J+UiuOAkOaWsOWinuOAkeaSreaUvuS4jeWHuumfs+aViFxuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlQYXNzU291bmQoZGF0YSlcbiAgICAgICAgICAgICAgICAvLyDwn5SK44CQ5paw5aKe44CR5pi+56S65LiN5Ye65pWI5p6cXG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvd1Bhc3NFZmZlY3QoZGF0YS5hY2NvdW50aWQpXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeS4jeWHuuaXtuS4jea4hemZpOS4iuWutuWHuueahOeJjFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5L+d5a2Y5LiK5a625Ye655qE54mM77yM55So5LqO5o+Q56S65Yqf6IO9XG4gICAgICAgICAgICB0aGlzLl9sYXN0UGxheWVkQ2FyZHMgPSBkYXRhLmNhcmRzIHx8IFtdXG4gICAgICAgICAgICB0aGlzLl9sYXN0UGxheWVkSGFuZFR5cGUgPSBkYXRhLmhhbmRfdHlwZSB8fCBcIlwiXG5cbiAgICAgICAgICAgIGlmICghdGhpcy5ub2RlIHx8ICF0aGlzLm5vZGUucGFyZW50KSByZXR1cm5cblxuICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeiOt+WPluW9k+WJjeeOqeWutklE77yM5Yik5pat5piv5ZCm5piv6Ieq5bex5Ye654mMXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu44CR5a6J5YWo6I635Y+W546p5a62SUTvvIzpgb/lhY3miqXplJlcbiAgICAgICAgICAgIHZhciBzb2NrZXRJbmZvID0gbXlnbG9iYWwuc29ja2V0LmdldFBsYXllckluZm8oKSB8fCB7fVxuICAgICAgICAgICAgdmFyIHNlcnZlclBsYXllcklkID0gKG15Z2xvYmFsLnBsYXllckRhdGEgJiYgbXlnbG9iYWwucGxheWVyRGF0YS5zZXJ2ZXJQbGF5ZXJJZCkgfHwgXCJcIlxuICAgICAgICAgICAgdmFyIGFjY291bnRJZCA9IChteWdsb2JhbC5wbGF5ZXJEYXRhICYmIG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEKSB8fCBcIlwiXG4gICAgICAgICAgICB2YXIgbXlQbGF5ZXJJZCA9IHNvY2tldEluZm8uaWQgfHwgc2VydmVyUGxheWVySWQgfHwgYWNjb3VudElkXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7jgJHkvb/nlKjmm7TlronlhajnmoTmr5TovoPmlrnlvI9cbiAgICAgICAgICAgIHZhciBpc1NlbGYgPSBTdHJpbmcoZGF0YS5hY2NvdW50aWQgfHwgXCJcIikgPT09IFN0cmluZyhteVBsYXllcklkIHx8IFwiXCIpXG5cbiAgICAgICAgICAgIC8vIPCflKfjgJDosIPor5XjgJHor6bnu4bmiZPljbBJROavlOi+g+S/oeaBr1xuXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5qC45b+D5L+u5aSN44CR5aaC5p6c5piv6Ieq5bex5Ye654mM77yM5LuO5omL54mM5Lit5Yig6ZmkXG4gICAgICAgICAgICBpZiAoaXNTZWxmKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlQ2FyZHNGcm9tSGFuZChkYXRhLmNhcmRzKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g8J+UiuOAkOaWsOWinuOAkeaSreaUvuWHuueJjOmfs+aViFxuICAgICAgICAgICAgdGhpcy5fcGxheUNhcmRTb3VuZChkYXRhKVxuXG4gICAgICAgICAgICAvLyDmmL7npLrlh7rnmoTniYzliLDmoYzpnaJcbiAgICAgICAgICAgIHZhciBnYW1lU2NlbmVfc2NyaXB0ID0gdGhpcy5ub2RlLnBhcmVudC5nZXRDb21wb25lbnQoXCJnYW1lU2NlbmVcIilcbiAgICAgICAgICAgIGlmICghZ2FtZVNjZW5lX3NjcmlwdCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn4OPIFtvbk90aGVyUGxheWVyQ2h1Q2FyZF0gZ2FtZVNjZW5lX3NjcmlwdCDkuLrnqbpcIilcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG91dENhcmRfbm9kZSA9IGdhbWVTY2VuZV9zY3JpcHQuZ2V0VXNlck91dENhcmRQb3NCeUFjY291bnQoZGF0YS5hY2NvdW50aWQpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDosIPor5XjgJHovpPlh7rlh7rniYzljLrln5/mn6Xmib7nu5PmnpxcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyBbb25PdGhlclBsYXllckNodUNhcmRdIGRhdGEuYWNjb3VudGlkOlwiLCBkYXRhLmFjY291bnRpZCwgXCJvdXRDYXJkX25vZGU6XCIsIG91dENhcmRfbm9kZSA/IG91dENhcmRfbm9kZS5uYW1lIDogXCJudWxsXCIpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICghb3V0Q2FyZF9ub2RlIHx8ICF0aGlzLmNhcmRfcHJlZmFiKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfg48gW29uT3RoZXJQbGF5ZXJDaHVDYXJkXSBvdXRDYXJkX25vZGUg5oiWIGNhcmRfcHJlZmFiIOS4uuepuiwgb3V0Q2FyZF9ub2RlOlwiLCAhIW91dENhcmRfbm9kZSwgXCJjYXJkX3ByZWZhYjpcIiwgISF0aGlzLmNhcmRfcHJlZmFiKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDjgJDph43opoHjgJHnm7TmjqXkvb/nlKjmnI3liqHnq6/mlbDmja7liJvlu7roioLngrlcbiAgICAgICAgICAgIHZhciBub2RlX2NhcmRzID0gW11cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5jYXJkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBjYXJkID0gY2MuaW5zdGFudGlhdGUodGhpcy5jYXJkX3ByZWZhYilcbiAgICAgICAgICAgICAgICBpZiAoY2FyZCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZFNjcmlwdCA9IGNhcmQuZ2V0Q29tcG9uZW50KFwiY2FyZFwiKVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FyZFNjcmlwdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZFNjcmlwdC5zaG93Q2FyZHMoZGF0YS5jYXJkc1tpXSwgbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SUQpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbm9kZV9jYXJkcy5wdXNoKGNhcmQpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zaG93T3V0Q2FyZHMob3V0Q2FyZF9ub2RlLCBub2RlX2NhcmRzKVxuXG4gICAgICAgICAgICAvLyDmm7TmlrDliankvZnniYzmlbBcbiAgICAgICAgICAgIGlmIChkYXRhLmNhcmRzX2xlZnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMubm9kZS5wYXJlbnQuZW1pdChcInVwZGF0ZV9jYXJkX2NvdW50X2V2ZW50XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudGlkOiBkYXRhLmFjY291bnRpZCxcbiAgICAgICAgICAgICAgICAgICAgY291bnQ6IGRhdGEuY2FyZHNfbGVmdFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDnm5HlkKzmiqLlnLDkuLvpmLbmrrXlvIDlp4tcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQ2FsbExhbmRsb3JkU3RhcnQoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICB0aGlzLl9iaWRkaW5nUGhhc2UgPSBcImJpZGRpbmdcIlxuICAgICAgICAgICAgdGhpcy5fZ2FtZVBoYXNlID0gXCJiaWRkaW5nXCIgIC8vIPCflKfjgJDmlrDlop7jgJHorr7nva7muLjmiI/pmLbmrrVcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIOebkeWQrOaKouWcsOS4u+i9ruasoVxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25DYWxsTGFuZGxvcmRUdXJuKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgdGhpcy5fcHJvY2Vzc0NhbGxMYW5kbG9yZFR1cm4oZGF0YSlcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIOebkeWQrOaKouWcsOS4u+e7k+aenFxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25DYWxsTGFuZGxvcmRSZXN1bHQoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAvLyDwn5SS44CQ6YeN6KaB44CR5pS25Yiw57uT5p6c77yM5YGc5q2i5YCS6K6h5pe2XG4gICAgICAgICAgICB0aGlzLl9zdG9wQmlkQ291bnRkb3duKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeaSreaUvuaKouWcsOS4u+ivremfs1xuICAgICAgICAgICAgdGhpcy5fcGxheVJvYlNvdW5kKGRhdGEpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh0aGlzLm5vZGUgJiYgdGhpcy5ub2RlLnBhcmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMubm9kZS5wYXJlbnQuZW1pdChcImNhbGxfbGFuZGxvcmRfcmVzdWx0X2V2ZW50XCIsIGRhdGEpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDnm5HlkKzmiqLlnLDkuLvpmLbmrrXnu5PmnZ9cbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQ2FsbExhbmRsb3JkRW5kKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgLy8g8J+UkuOAkOmHjeimgeOAkeWBnOatouaJgOacieWAkuiuoeaXtlxuICAgICAgICAgICAgdGhpcy5fc3RvcEJpZENvdW50ZG93bigpXG4gICAgICAgICAgICB0aGlzLl9oaWRlUm9iVUkoKVxuICAgICAgICAgICAgdGhpcy5fYmlkZGluZ1BoYXNlID0gXCJpZGxlXCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkemHjee9ruaKouWcsOS4u+ebuOWFs+eKtuaAgVxuICAgICAgICAgICAgdGhpcy5yb2JfcGxheWVyX2FjY291bnRpZCA9IDBcbiAgICAgICAgICAgIHRoaXMuY2FyZHNSZWFkeSA9IGZhbHNlICAvLyDph43nva7lj5HniYzlrozmiJDmoIforrBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruOAkeS/neWtmOW6leeJjOaVsOaNrlxuICAgICAgICAgICAgaWYgKGRhdGEuYm90dG9tX2NhcmRzICYmIGRhdGEuYm90dG9tX2NhcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJvdHRvbUNhcmRzID0gZGF0YS5ib3R0b21fY2FyZHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOmHjeimgeOAkeaYvuekuuW6leeJjO+8iOaJgOacieeOqeWutumDveiDveeci+WIsO+8iVxuICAgICAgICAgICAgdGhpcy5fc2hvd0JvdHRvbUNhcmRzVG9BbGwoZGF0YS5ib3R0b21fY2FyZHMpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR55uR5ZCs5Zyw5Li75paw5omL54mM5raI5oGvIC0g5Y+q5pu05paw5Zyw5Li755qE5omL54mM77yM5LiN6Kem5Y+R6YeN5paw5Y+R54mMXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHlv4Xpobvpqozor4Hoh6rlt7HmmK/lkKbmmK/lnLDkuLvvvIzlj6rmnInlnLDkuLvmiY3mm7TmlrDmiYvniYxcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uTGFuZGxvcmRDYXJkcyhmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUrumqjOivgeOAkeajgOafpeiHquW3seaYr+WQpuaYr+WcsOS4u1xuICAgICAgICAgICAgdmFyIG15UGxheWVySWQgPSBteWdsb2JhbC5zb2NrZXQuZ2V0UGxheWVySW5mbygpLmlkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEuc2VydmVyUGxheWVySWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SURcbiAgICAgICAgICAgIHZhciBsYW5kbG9yZElkID0gZGF0YS5sYW5kbG9yZF9pZCB8fCBcIlwiXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruOAkeWPquacieW9k+WcsOS4u0lE5Yy56YWN6Ieq5bex5pe25omN5pu05paw5omL54mMXG4gICAgICAgICAgICBpZiAoU3RyaW5nKGxhbmRsb3JkSWQpICE9PSBTdHJpbmcobXlQbGF5ZXJJZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDjgJDph43opoHjgJHlj6rmm7TmlrDmiYvniYzmlbDmja7vvIzkuI3ph43mlrDmuLLmn5PmlbTkuKrlnLrmma9cbiAgICAgICAgICAgIHRoaXMuaGFuZENhcmRzID0gZGF0YS5jYXJkcyB8fCBbXVxuICAgICAgICAgICAgdGhpcy5ib3R0b21DYXJkcyA9IGRhdGEuYm90dG9tX2NhcmRzIHx8IFtdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOOAkOmHjeimgeOAkeS9v+eUqOmdmem7mOabtOaWsO+8jOS4jeinpuWPkeWPkeeJjOWKqOeUu1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlTGFuZGxvcmRIYW5kQ2FyZHModGhpcy5oYW5kQ2FyZHMpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDnm5HlkKzph43mlrDlj5HniYzpgJrnn6XvvIjmiYDmnInkurrpg73kuI3lj6vlnLDkuLvvvIlcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uUmVzdGFydEdhbWUoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAvLyDlgZzmraLmiYDmnInlgJLorqHml7ZcbiAgICAgICAgICAgIHRoaXMuX3N0b3BCaWRDb3VudGRvd24oKVxuICAgICAgICAgICAgdGhpcy5fc3RvcFBsYXlDb3VudGRvd24oKVxuICAgICAgICAgICAgLy8g6ZqQ6JeP5oqi5Zyw5Li7VUlcbiAgICAgICAgICAgIHRoaXMuX2hpZGVSb2JVSSgpXG4gICAgICAgICAgICAvLyDph43nva7nirbmgIFcbiAgICAgICAgICAgIHRoaXMuX2JpZGRpbmdQaGFzZSA9IFwiaWRsZVwiXG4gICAgICAgICAgICB0aGlzLl9nYW1lUGhhc2UgPSBcImlkbGVcIiAgLy8g8J+Up+OAkOaWsOWinuOAkemHjee9rua4uOaIj+mYtuautVxuICAgICAgICAgICAgdGhpcy5jYXJkc1JlYWR5ID0gZmFsc2VcbiAgICAgICAgICAgIHRoaXMuaGFuZENhcmRzID0gW11cbiAgICAgICAgICAgIHRoaXMuYm90dG9tQ2FyZHMgPSBbXVxuICAgICAgICAgICAgdGhpcy5jaG9vc2VfY2FyZF9kYXRhID0gW11cbiAgICAgICAgICAgIC8vIOa4heeQhuaJgOacieWNoeeJjOiKgueCuVxuICAgICAgICAgICAgdGhpcy5jbGVhckFsbENhcmRzKClcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHnm5HlkKzlh7rniYzpmLbmrrXlvIDlp4tcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uUGxheVN0YXJ0KGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruOAkeiuvue9rua4uOaIj+mYtuauteS4uuWHuueJjOmYtuautVxuICAgICAgICAgICAgdGhpcy5fZ2FtZVBoYXNlID0gXCJwbGF5aW5nXCJcbiAgICAgICAgICAgIHRoaXMuX2JpZGRpbmdQaGFzZSA9IFwiaWRsZVwiXG4gICAgICAgICAgICAvLyDpmpDol4/miqLlnLDkuLtVSe+8iOehruS/neS4jeaYvuekuu+8iVxuICAgICAgICAgICAgdGhpcy5faGlkZVJvYlVJKClcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIPCflIrjgJDmlrDlop7jgJHnm5HlkKzmuLjmiI/nu5PmnZ9cbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uR2FtZU92ZXIoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWBnOatouaJgOacieWAkuiuoeaXtlxuICAgICAgICAgICAgdGhpcy5fc3RvcFBsYXlDb3VudGRvd24oKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR6YeN572u5ri45oiP6Zi25q61XG4gICAgICAgICAgICB0aGlzLl9nYW1lUGhhc2UgPSBcImlkbGVcIlxuICAgICAgICAgICAgdGhpcy5fYmlkZGluZ1BoYXNlID0gXCJpZGxlXCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkea4uOaIj+e7k+adn+aXtueri+WNs+mHjee9ruaJgOacieeOqeWutueahOWHhuWkh+eKtuaAgVxuICAgICAgICAgICAgdGhpcy5fcmVzZXRBbGxQbGF5ZXJSZWFkeVN0YXRlKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeaYvuekuue7k+eul+W8ueeql1xuICAgICAgICAgICAgdGhpcy5fc2hvd0dhbWVSZXN1bHRQb3B1cChkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g55uR5ZCs5ri45oiP54q25oCB5oGi5aSNXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkdhbWVTdGF0ZVJlc3RvcmUoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICB0aGlzLnJlc3RvcmVHYW1lU3RhdGUoZGF0YSlcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHnm5HlkKzmj5DnpLrnu5PmnpxcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uSGludFJlc3VsdChmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIHRoaXMuX29uSGludFJlc3VsdChkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g8J+Up+OAkOaJmOeuoeOAkeebkeWQrOaJmOeuoeeKtuaAgeWPmOWMllxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25UcnVzdGVlU3RhdGVOb3RpZnkoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICB0aGlzLl9vblRydXN0ZWVTdGF0ZU5vdGlmeShkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHnlKjmiLfmtLvliqjnm5HlkKwgLSDlj5bmtojmnLrlmajkurrmiZjnrqFcbiAgICAgICAgLy8g5qC45b+D6YC76L6R77ya5Y+q6KaB55So5oi35pyJ6byg5qCH56e75Yqo5oiW54K55Ye75LqL5Lu277yM5bCx5Y+R6YCB5Y+W5raI5omY566h6K+35rGCXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB0aGlzLl9pc0xvY2FsVHJ1c3RlZSA9IGZhbHNlICAvLyDmnKzlnLDmiZjnrqHnirbmgIFcbiAgICAgICAgdGhpcy5fbGFzdEFjdGl2aXR5VGltZSA9IDAgICAgLy8g5LiK5qyh5rS75Yqo5pe26Ze077yI55So5LqO6Ziy5oqW77yJXG4gICAgICAgIHRoaXMuX2FjdGl2aXR5VGhyb3R0bGVNcyA9IDUwMCAvLyDpmLLmipbpl7TpmpTvvIjmr6vnp5LvvIlcbiAgICAgICAgXG4gICAgICAgIC8vIOazqOWGjOWFqOWxgOeUqOaIt+a0u+WKqOebkeWQrFxuICAgICAgICB0aGlzLl9zZXR1cFVzZXJBY3Rpdml0eUxpc3RlbmVyKClcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgLy8g44CQ56ue5oqA5Zy644CR5raI5oGv55uR5ZCsXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICBcbiAgICAgICAgLy8g55uR5ZCs56ue5oqA5Zy654q25oCB5pu05pawXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkNvbXBldGl0aW9uU3RhdHVzKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgdGhpcy5fb25Db21wZXRpdGlvblN0YXR1cyhkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIFxuICAgICAgICAvLyDnm5HlkKznq57mioDlnLrlgJLorqHml7ZcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQ29tcGV0aXRpb25Db3VudGRvd24oZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICB0aGlzLl9vbkNvbXBldGl0aW9uQ291bnRkb3duKGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgXG4gICAgICAgIC8vIOebkeWQrOavlOi1m+mHkeW4geabtOaWsFxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25NYXRjaENvaW5VcGRhdGUoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICB0aGlzLl9vbk1hdGNoQ29pblVwZGF0ZShkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIFxuICAgICAgICAvLyDnm5HlkKzmt5jmsbDpgJrnn6VcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQ29tcGV0aXRpb25FbGltaW5hdGVkKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgdGhpcy5fb25Db21wZXRpdGlvbkVsaW1pbmF0ZWQoZGF0YSlcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgICBcbiAgICAgICAgLy8g55uR5ZCs5pmL57qn6YCa55+lXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkNvbXBldGl0aW9uQWR2YW5jZShmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIHRoaXMuX29uQ29tcGV0aXRpb25BZHZhbmNlKGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgXG4gICAgICAgIC8vIOebkeWQrOWGoOWGm+W8ueeql1xuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25Db21wZXRpdGlvbkNoYW1waW9uKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgdGhpcy5fb25Db21wZXRpdGlvbkNoYW1waW9uKGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHnm5HlkKzmnIDnu4jmppzljZXmtojmga9cbiAgICAgICAgLy8g5b2T56ue5oqA5Zy65omA5pyJ6L2u5qyh57uT5p2f5pe277yM5pyN5Yqh56uv5Lya5Y+R6YCB5q2k5raI5oGvXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vblRvdXJuYW1lbnRGaW5hbFJhbmsoZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj4YgW2dhbWVpbmdVSV0g5pS25Yiw5pyA57uI5qac5Y2VOlwiLCBKU09OLnN0cmluZ2lmeShkYXRhKSlcbiAgICAgICAgICAgIHRoaXMuX29uVG91cm5hbWVudEZpbmFsUmFuayhkYXRhKVxuICAgICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeebkeWQrOernuaKgOWcuua3mOaxsOi4ouWHuuaIv+mXtOmAmuefpVxuICAgICAgICAvLyDlvZPnjqnlrrbooqvmt5jmsbDml7bvvIzmnI3liqHnq6/lj5HpgIHmraTmtojmga/pgJrnn6XlrqLmiLfnq6/mmL7npLrooqvmt5jmsbDmj5DnpLpcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQXJlbmFFbGltaW5hdGVkS2ljayhmdW5jdGlvbihkYXRhKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+aqiBbZ2FtZWluZ1VJXSDmlLbliLDmt5jmsbDouKLlh7rpgJrnn6U6XCIsIEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICAgICAgICAgdGhpcy5fb25BcmVuYUVsaW1pbmF0ZWRLaWNrKGRhdGEpXG4gICAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgICAvLyDlhoXpg6jkuovku7bvvJrmmL7npLrlupXniYxcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeatpOS6i+S7tuW3suW6n+W8g++8jOmAu+i+keW3suenu+WIsCBvbkNhbGxMYW5kbG9yZEVuZCDlkowgb25MYW5kbG9yZENhcmRzXG4gICAgICAgIC8vIOS/neeVmeatpOebkeWQrOWZqOS7heeUqOS6juWFvOWuueaXp+eJiOacrO+8jOS4jeWGjeinpuWPkSBwdXNoVGhyZWVDYXJkXG4gICAgICAgIHRoaXMubm9kZS5vbihcInNob3dfYm90dG9tX2NhcmRfZXZlbnRcIiwgZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CRZGF0YSDlj6/og73mmK8geyBjYXJkczogWy4uLl0gfSDlr7nosaHmiJbmlbDnu4RcbiAgICAgICAgICAgIHZhciBjYXJkcyA9IGRhdGFcbiAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuY2FyZHMpIHtcbiAgICAgICAgICAgICAgICBjYXJkcyA9IGRhdGEuY2FyZHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5aaC5p6cIGNhcmRzIOS4uuepuu+8jOS4jeWkhOeQhlxuICAgICAgICAgICAgaWYgKCFjYXJkcyB8fCBjYXJkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5LiN5YaN6LCD55SoIHB1c2hUaHJlZUNhcmTvvIFcbiAgICAgICAgICAgIC8vIOW6leeJjOaYvuekuuW3sueUsSBfc2hvd0JvdHRvbUNhcmRzVG9BbGwg5aSE55CGXG4gICAgICAgICAgICAvLyDlnLDkuLvmiYvniYzmm7TmlrDlt7LnlLEgb25MYW5kbG9yZENhcmRzIOWkhOeQhlxuICAgICAgICAgICAgLy8g5Yig6Zmk5Lul5LiL5Luj56CB77yM6YG/5YWN6YeN5aSN5aSE55CG5ZKM5bu26L+f77yaXG4gICAgICAgICAgICAvLyB0aGlzLnNjaGVkdWxlT25jZSh0aGlzLnB1c2hUaHJlZUNhcmQsIDAuMilcbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHms6jlhoznm5HlkKzpgInmi6nniYzmtojmga9cbiAgICAgICAgLy8gY2FyZC5qcyDmmK/lnKggZ2FtZVNjZW5lX25vZGUgKHRoaXMubm9kZS5wYXJlbnQpIOS4iiBlbWl0IOS6i+S7tlxuICAgICAgICAvLyDmiYDku6Xlv4XpobvlnKggdGhpcy5ub2RlLnBhcmVudCDkuIrnm5HlkKzvvIzogIzkuI3mmK8gdGhpcy5ub2RlXG4gICAgICAgIHZhciBnYW1lU2NlbmVfbm9kZSA9IHRoaXMubm9kZS5wYXJlbnRcbiAgICAgICAgaWYgKGdhbWVTY2VuZV9ub2RlKSB7XG4gICAgICAgICAgICBnYW1lU2NlbmVfbm9kZS5vbihcImNob29zZV9jYXJkX2V2ZW50XCIsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgICB0aGlzLmNob29zZV9jYXJkX2RhdGEucHVzaChldmVudClcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5pu05paw5bey6YCJ54mM5pWw5pi+56S6XG4gICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlU2VsZWN0ZWRDb3VudERpc3BsYXkoKVxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAgICAgICBnYW1lU2NlbmVfbm9kZS5vbihcInVuY2hvb3NlX2NhcmRfZXZlbnRcIiwgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmraPnoa7ljLnphY3ljaHniYznmoTllK/kuIDmoIfor4bnrKbvvIhzdWl0ICsgcmFua++8iVxuICAgICAgICAgICAgICAgIC8vIGV2ZW50IOeOsOWcqOaYryB7c3VpdCwgcmFua30g5a+56LGhXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNob29zZV9jYXJkX2RhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhcmRpZCA9IHRoaXMuY2hvb3NlX2NhcmRfZGF0YVtpXS5jYXJkaWRcbiAgICAgICAgICAgICAgICAgICAgLy8g5qOA5p+l5piv5ZCm5Yy56YWN77yI5YW85a655paw5pen5Lik56eN5qC85byP77yJXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYXJkaWQgJiYgY2FyZGlkLnN1aXQgIT09IHVuZGVmaW5lZCAmJiBjYXJkaWQucmFuayAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmlrDmoLzlvI/vvJpjYXJkaWQg5piv5a+56LGhIHtzdWl0LCByYW5rfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhcmRpZC5zdWl0ID09PSBldmVudC5zdWl0ICYmIGNhcmRpZC5yYW5rID09PSBldmVudC5yYW5rKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaG9vc2VfY2FyZF9kYXRhLnNwbGljZShpLCAxKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2FyZGlkID09IGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDml6fmoLzlvI/lhbzlrrnvvJpjYXJkaWQg5piv5pWw5a2XXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNob29zZV9jYXJkX2RhdGEuc3BsaWNlKGksIDEpXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHmm7TmlrDlt7LpgInniYzmlbDmmL7npLpcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVTZWxlY3RlZENvdW50RGlzcGxheSgpXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc3RhcnQgKCkge30sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkemihOWKoOi9veWNoeeJjOeyvueBteWbvumbhlxuICAgICAqIOehruS/neWcqOWPkeeJjOS5i+WJjeWbvumbhuW3sue7j+WHhuWkh+WlvVxuICAgICAqL1xuICAgIF9wcmVsb2FkQ2FyZEF0bGFzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm5bey57uP5Yqg6L29XG4gICAgICAgIGlmICh3aW5kb3cuX2NhcmRBdGxhc0xvYWRlZCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNjLnJlc291cmNlcy5sb2FkKFwiVUkvY2FyZC9jYXJkXCIsIGNjLlNwcml0ZUF0bGFzLCBmdW5jdGlvbihlcnIsIGF0bGFzKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfg48gW19wcmVsb2FkQ2FyZEF0bGFzXSDliqDovb3ljaHniYzlm77pm4blpLHotKU6XCIsIGVycilcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdpbmRvdy5fY2FyZEF0bGFzTG9hZGVkID0gdHJ1ZVxuICAgICAgICAgICAgd2luZG93Ll9jYXJkQXRsYXMgPSBhdGxhc1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4OPIFtfcHJlbG9hZENhcmRBdGxhc10g5Y2h54mM5Zu+6ZuG6aKE5Yqg6L295oiQ5YqfXCIpXG4gICAgICAgIH0pXG4gICAgfSxcbiAgICBcbiAgICBvbkRlc3Ryb3kgKCkge1xuICAgICAgICB0aGlzLl9zdG9wUGxheUNvdW50ZG93bigpXG4gICAgICAgIHRoaXMuX3N0b3BCaWRDb3VudGRvd24oKVxuICAgICAgICBcbiAgICAgICAgLy8g44CQ56ue5oqA5Zy644CR5riF55CG56ue5oqA5Zy65YCS6K6h5pe2XG4gICAgICAgIGlmICh0aGlzLl9jb21wZXRpdGlvbkNvdW50ZG93blRpbWVyKSB7XG4gICAgICAgICAgICB0aGlzLnVuc2NoZWR1bGUodGhpcy5fY29tcGV0aXRpb25Db3VudGRvd25UaWNrKVxuICAgICAgICAgICAgdGhpcy5fY29tcGV0aXRpb25Db3VudGRvd25UaW1lciA9IG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkea4heeQhuacrOWcsOernuaKgOWcuuWAkuiuoeaXtlxuICAgICAgICBpZiAodGhpcy5fbG9jYWxBcmVuYUNvdW50ZG93blRpbWVyKSB7XG4gICAgICAgICAgICB0aGlzLnVuc2NoZWR1bGUodGhpcy5fbG9jYWxBcmVuYUNvdW50ZG93blRpY2spXG4gICAgICAgICAgICB0aGlzLl9sb2NhbEFyZW5hQ291bnRkb3duVGltZXIgPSBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOOAkOernuaKgOWcuuOAkea4heeQhuavlOi1m+mHkeW4geaYvuekulxuICAgICAgICB0aGlzLl9oaWRlTWF0Y2hDb2luRGlzcGxheSgpXG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOOAkOaguOW/g+OAkeWUr+S4gOa4suafk+WFpeWPo1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIOOAkOaguOW/g+OAkea4suafk+aJi+eJjCAtIOWUr+S4gOWFpeWPo1xuICAgICAqIEBwYXJhbSB7QXJyYXl9IGNhcmRzIC0g5pyN5Yqh56uv5Y6f5aeL5omL54mM5pWw5o2uXG4gICAgICovXG4gICAgcmVuZGVyQ2FyZHM6IGZ1bmN0aW9uKGNhcmRzKSB7XG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHpppblhYjmo4Dmn6XoioLngrnmmK/lkKbmnInmlYhcbiAgICAgICAgaWYgKCF0aGlzLm5vZGUgfHwgIXRoaXMubm9kZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn46uIFtyZW5kZXJDYXJkc10g6IqC54K55bey6ZSA5q+B5oiW5peg5pWI77yM6Lez6L+H5riy5p+TXCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFjYXJkcyB8fCBjYXJkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCfjq4gW3JlbmRlckNhcmRzXSDmsqHmnInniYzlj6/muLLmn5NcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR562J5b6F5Y2h54mM5Zu+6ZuG5Yqg6L295a6M5oiQXG4gICAgICAgIGlmICghd2luZG93Ll9jYXJkQXRsYXNMb2FkZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+OriBbcmVuZGVyQ2FyZHNdIOWNoeeJjOWbvumbhuacquWKoOi9veWujOaIkO+8jOetieW+heS4rS4uLlwiKVxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgICAgICB0aGlzLl93YWl0Rm9yQXRsYXNBbmRSZW5kZXIoY2FyZHMpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5fZG9SZW5kZXJDYXJkcyhjYXJkcylcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHnrYnlvoXlm77pm4bliqDovb3lrozmiJDlkI7muLLmn5NcbiAgICAgKi9cbiAgICBfd2FpdEZvckF0bGFzQW5kUmVuZGVyOiBmdW5jdGlvbihjYXJkcykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgdmFyIGNoZWNrQ291bnQgPSAwXG4gICAgICAgIHZhciBtYXhDaGVjayA9IDUwICAvLyDmnIDlpJrnrYnlvoU156eS77yINTAgKiAxMDBtc++8iVxuICAgICAgICBcbiAgICAgICAgdmFyIGNoZWNrQXRsYXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNoZWNrQ291bnQrK1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5fY2FyZEF0bGFzTG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn46uIFtyZW5kZXJDYXJkc10g5Y2h54mM5Zu+6ZuG5Yqg6L295a6M5oiQ77yM5byA5aeL5riy5p+TXCIpXG4gICAgICAgICAgICAgICAgc2VsZi5fZG9SZW5kZXJDYXJkcyhjYXJkcylcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2hlY2tDb3VudCA8IG1heENoZWNrKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChjaGVja0F0bGFzLCAxMDApXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn46uIFtyZW5kZXJDYXJkc10g562J5b6F5Y2h54mM5Zu+6ZuG6LaF5pe277yM5by65Yi26YeN5paw5Yqg6L29XCIpXG4gICAgICAgICAgICAgICAgLy8g5by65Yi26YeN5paw5Yqg6L29XG4gICAgICAgICAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoXCJVSS9jYXJkL2NhcmRcIiwgY2MuU3ByaXRlQXRsYXMsIGZ1bmN0aW9uKGVyciwgYXRsYXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfjq4gW3JlbmRlckNhcmRzXSDlvLrliLbliqDovb3ljaHniYzlm77pm4blpLHotKU6XCIsIGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5fY2FyZEF0bGFzTG9hZGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuX2NhcmRBdGxhcyA9IGF0bGFzXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+OriBbcmVuZGVyQ2FyZHNdIOW8uuWItuWKoOi9veWNoeeJjOWbvumbhuaIkOWKn1wiKVxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9kb1JlbmRlckNhcmRzKGNhcmRzKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2hlY2tBdGxhcygpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5a6e6ZmF5omn6KGM5riy5p+T5omL54mMXG4gICAgICovXG4gICAgX2RvUmVuZGVyQ2FyZHM6IGZ1bmN0aW9uKGNhcmRzKSB7XG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHnoa7kv50gY2FyZHNfbm9kZSDlrZjlnKhcbiAgICAgICAgaWYgKCF0aGlzLmNhcmRzX25vZGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCfjq4gW3JlbmRlckNhcmRzXSBjYXJkc19ub2RlIOacquWumuS5ie+8jOWwneivlemHjeaWsOafpeaJvuaIluWIm+W7ulwiKVxuICAgICAgICAgICAgdmFyIGdhbWVTY2VuZU5vZGUgPSB0aGlzLm5vZGUucGFyZW50XG4gICAgICAgICAgICBpZiAoZ2FtZVNjZW5lTm9kZSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2FtZVNjZW5lTm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBnYW1lU2NlbmVOb2RlLmNoaWxkcmVuW2ldXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5uYW1lID09PSBcImNhcmRzX25vZGVcIiB8fCBjaGlsZC5uYW1lID09PSBcImNhcmRzXCIgfHwgY2hpbGQubmFtZSA9PT0gXCJoYW5kQ2FyZHNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jYXJkc19ub2RlID0gY2hpbGRcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+OriBbcmVuZGVyQ2FyZHNdIOaJvuWIsCBjYXJkc19ub2RlOlwiLCBjaGlsZC5uYW1lKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuY2FyZHNfbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3Q2FyZHNOb2RlID0gbmV3IGNjLk5vZGUoXCJjYXJkc19ub2RlXCIpXG4gICAgICAgICAgICAgICAgICAgIG5ld0NhcmRzTm9kZS5wYXJlbnQgPSBnYW1lU2NlbmVOb2RlXG4gICAgICAgICAgICAgICAgICAgIG5ld0NhcmRzTm9kZS5zZXRQb3NpdGlvbigwLCAwKVxuICAgICAgICAgICAgICAgICAgICBuZXdDYXJkc05vZGUuc2V0QW5jaG9yUG9pbnQoMC41LCAwLjUpXG4gICAgICAgICAgICAgICAgICAgIG5ld0NhcmRzTm9kZS5zZXRDb250ZW50U2l6ZShjYy5zaXplKDgwMCwgMjAwKSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYXJkc19ub2RlID0gbmV3Q2FyZHNOb2RlXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+OriBbcmVuZGVyQ2FyZHNdIOWIm+W7uuaWsOeahCBjYXJkc19ub2RlXCIpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlpoLmnpzku43nhLbmsqHmnInvvIzov5Tlm55cbiAgICAgICAgICAgIGlmICghdGhpcy5jYXJkc19ub2RlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfjq4gW3JlbmRlckNhcmRzXSDml6Dms5XliJvlu7ogY2FyZHNfbm9kZe+8jOaUvuW8g+a4suafk1wiKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sl44CQ6Ziy6YeN5aSN5riy5p+T44CR5qOA5p+l5piv5ZCm5LiO5LiK5qyh55u45ZCMXG4gICAgICAgIHZhciBoYXNoID0gSlNPTi5zdHJpbmdpZnkoY2FyZHMpXG4gICAgICAgIGlmICh0aGlzLl9sYXN0UmVuZGVySGFzaCA9PT0gaGFzaCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn46uIFtyZW5kZXJDYXJkc10g54mM5LiO5LiK5qyh55u45ZCM77yM6Lez6L+H5riy5p+TXCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9sYXN0UmVuZGVySGFzaCA9IGhhc2hcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+OriBbcmVuZGVyQ2FyZHNdIOW8gOWni+a4suafkyBcIiArIGNhcmRzLmxlbmd0aCArIFwiIOW8oOeJjFwiKVxuICAgICAgICBcbiAgICAgICAgLy8g44CQ5qC45b+D44CR5L2/55So5paX5Zyw5Li76KeE5YiZ5o6S5bqP77ya5aSn546LID4g5bCP546LID4gMiA+IEEgPiBLID4gUSA+IEogPiAxMCA+IDkgPiA4ID4gNyA+IDYgPiA1ID4gNCA+IDNcbiAgICAgICAgdmFyIHNvcnRlZENhcmRzID0gdGhpcy5fc29ydENhcmRzKGNhcmRzKVxuICAgICAgICBcbiAgICAgICAgLy8g44CQ5qC45b+D44CR5riF55CG5omA5pyJ5pen6IqC54K577yI6Kej5Yaz6IOM6Z2i54mM5q6L55WZ77yJXG4gICAgICAgIHRoaXMuY2xlYXJBbGxDYXJkcygpXG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7rlupXniYzoioLngrlcbiAgICAgICAgdGhpcy5fY3JlYXRlQm90dG9tQ2FyZHMoKVxuICAgICAgICBcbiAgICAgICAgLy8g6ZqQ6JeP5Ye654mMVUlcbiAgICAgICAgaWYgKHRoaXMucGxheWluZ1VJX25vZGUpIHtcbiAgICAgICAgICAgIHRoaXMucGxheWluZ1VJX25vZGUuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+OrOOAkOS/ruWkjeOAkeS9v+eUqOmAkOW8oOWPkeeJjOWKqOeUu1xuICAgICAgICB0aGlzLl9kZWFsQ2FyZHNXaXRoQW5pbWF0aW9uKHNvcnRlZENhcmRzKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+OrOOAkOaWsOWinuOAkemAkOW8oOWPkeeJjOWKqOeUu1xuICAgICAqIEBwYXJhbSB7QXJyYXl9IHNvcnRlZENhcmRzIC0g5bey5o6S5bqP55qE5omL54mM5pWw5o2uXG4gICAgICovXG4gICAgX2RlYWxDYXJkc1dpdGhBbmltYXRpb246IGZ1bmN0aW9uKHNvcnRlZENhcmRzKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgdmFyIGNhcmRJbnRlcnZhbCA9IERlYWxDb25maWcuY2FyZEludGVydmFsIC8gMTAwMCAgLy8g6L2s5o2i5Li656eSXG4gICAgICAgIHZhciBhbmltRHVyYXRpb24gPSBEZWFsQ29uZmlnLmFuaW1EdXJhdGlvblxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeehruS/neaJi+eJjOWuueWZqOWtmOWcqFxuICAgICAgICB2YXIgY2FyZFBhcmVudCA9IHRoaXMuY2FyZHNfbm9kZVxuICAgICAgICBpZiAoIWNhcmRQYXJlbnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn46uIFtfZGVhbENhcmRzV2l0aEFuaW1hdGlvbl0gY2FyZHNfbm9kZSDmnKrlrprkuYlcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlj5HniYzotbflp4vkvY3nva7vvIjlsY/luZXkuK3lpK7kuIrmlrnvvIzmqKHmi5/lj5HniYzloIbvvIlcbiAgICAgICAgdmFyIGRlY2tQb3MgPSBjYy52MihEZWFsQ29uZmlnLmRlY2tQb3NpdGlvbi54LCBEZWFsQ29uZmlnLmRlY2tQb3NpdGlvbi55KVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeehruS/neWNoeeJjOWbvumbhuW3suWKoOi9vVxuICAgICAgICBpZiAoIXdpbmRvdy5fY2FyZEF0bGFzTG9hZGVkIHx8ICF3aW5kb3cuX2NhcmRBdGxhcykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn46uIFtfZGVhbENhcmRzV2l0aEFuaW1hdGlvbl0g5Zu+6ZuG5pyq5Yqg6L2977yM5YWI5Yqg6L295Zu+6ZuGLi4uXCIpXG4gICAgICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcIlVJL2NhcmQvY2FyZFwiLCBjYy5TcHJpdGVBdGxhcywgZnVuY3Rpb24oZXJyLCBhdGxhcykge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfjq4gW19kZWFsQ2FyZHNXaXRoQW5pbWF0aW9uXSDliqDovb3lm77pm4blpLHotKU6XCIsIGVycilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHdpbmRvdy5fY2FyZEF0bGFzTG9hZGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgIHdpbmRvdy5fY2FyZEF0bGFzID0gYXRsYXNcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfjq4gW19kZWFsQ2FyZHNXaXRoQW5pbWF0aW9uXSDlm77pm4bliqDovb3lrozmiJDvvIzlvIDlp4vlj5HniYxcIilcbiAgICAgICAgICAgICAgICBzZWxmLl9kb0RlYWxDYXJkcyhzb3J0ZWRDYXJkcywgY2FyZFBhcmVudCwgY2FyZEludGVydmFsLCBhbmltRHVyYXRpb24sIGRlY2tQb3MpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2RvRGVhbENhcmRzKHNvcnRlZENhcmRzLCBjYXJkUGFyZW50LCBjYXJkSW50ZXJ2YWwsIGFuaW1EdXJhdGlvbiwgZGVja1BvcylcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHlrp7pmYXmiafooYzlj5HniYxcbiAgICAgKi9cbiAgICBfZG9EZWFsQ2FyZHM6IGZ1bmN0aW9uKHNvcnRlZENhcmRzLCBjYXJkUGFyZW50LCBjYXJkSW50ZXJ2YWwsIGFuaW1EdXJhdGlvbiwgZGVja1Bvcykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIFxuICAgICAgICAvLyDpgJDlvKDlj5HniYxcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3J0ZWRDYXJkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgKGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgc2VsZi5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYXJkRGF0YSA9IHNvcnRlZENhcmRzW2luZGV4XVxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0WCA9IHNlbGYuX2dldENhcmRYKGluZGV4LCBzb3J0ZWRDYXJkcy5sZW5ndGgsIENhcmRMYXlvdXQuY2FyZFNwYWNpbmcpXG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXRQb3MgPSBjYy52Mih0YXJnZXRYLCBDYXJkTGF5b3V0LmNhcmRZKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5Yib5bu65Y2h54mM6IqC54K5XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYXJkID0gY2MuaW5zdGFudGlhdGUoc2VsZi5jYXJkX3ByZWZhYilcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjYXJkKSByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGNhcmQuc2NhbGUgPSBDYXJkTGF5b3V0LmNhcmRTY2FsZVxuICAgICAgICAgICAgICAgICAgICBjYXJkLnBhcmVudCA9IGNhcmRQYXJlbnQgIC8vIPCflKfjgJDkv67lpI3jgJHkvb/nlKjnoa7lrprnmoTmiYvniYzlrrnlmahcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIPCfjqwg5LuO5Y+R54mM5aCG5L2N572u5byA5aeLXG4gICAgICAgICAgICAgICAgICAgIGNhcmQuc2V0UG9zaXRpb24oZGVja1BvcylcbiAgICAgICAgICAgICAgICAgICAgY2FyZC5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGNhcmQuekluZGV4ID0gaW5kZXhcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOiuvue9ruWNoeeJjOaYvuekulxuICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZENvbXAgPSBjYXJkLmdldENvbXBvbmVudChcImNhcmRcIilcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhcmRDb21wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJkQ29tcC5zaG93Q2FyZHMoY2FyZERhdGEsIG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDwn46sIOaSreaUvuWPkeeJjOWKqOeUu1xuICAgICAgICAgICAgICAgICAgICBjYy50d2VlbihjYXJkKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRvKGFuaW1EdXJhdGlvbiwgeyBwb3NpdGlvbjogdGFyZ2V0UG9zIH0sIHsgZWFzaW5nOiAnc2luZU91dCcgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jYWxsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOWKqOeUu+WujOaIkOWbnuiwg1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdGFydCgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDwn5SKIOaSreaUvuWPkeeJjOmfs+aViFxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNvcGVuX3NvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGF5U291bmQoXCJzb3VuZC9mYXBhaTFcIilcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9LCBpbmRleCAqIGNhcmRJbnRlcnZhbClcbiAgICAgICAgICAgIH0pKGkpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWPkeeJjOWujOaIkOWQjuWbnuiwg1xuICAgICAgICB2YXIgdG90YWxEZWFsVGltZSA9IHNvcnRlZENhcmRzLmxlbmd0aCAqIGNhcmRJbnRlcnZhbCArIGFuaW1EdXJhdGlvblxuICAgICAgICB0aGlzLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuX29uRGVhbENhcmRzQ29tcGxldGUoc29ydGVkQ2FyZHMpXG4gICAgICAgIH0sIHRvdGFsRGVhbFRpbWUpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn46s44CQ5paw5aKe44CR5Y+R54mM5a6M5oiQ5Zue6LCDXG4gICAgICogQHBhcmFtIHtBcnJheX0gc29ydGVkQ2FyZHMgLSDlt7LmjpLluo/nmoTmiYvniYzmlbDmja5cbiAgICAgKi9cbiAgICBfb25EZWFsQ2FyZHNDb21wbGV0ZTogZnVuY3Rpb24oc29ydGVkQ2FyZHMpIHtcbiAgICAgICAgLy8g5qCH6K6w5bCx57uqXG4gICAgICAgIHRoaXMuY2FyZHNSZWFkeSA9IHRydWVcbiAgICAgICAgdGhpcy5mYXBhaV9lbmQgPSB0cnVlXG4gICAgICAgIFxuICAgICAgICAvLyDpgJrnn6Xlhbbku5bnjqnlrrboioLngrlcbiAgICAgICAgaWYgKHRoaXMubm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZS5wYXJlbnQuZW1pdChcInB1c2hjYXJkX290aGVyX2V2ZW50XCIpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOajgOafpeaYr+WQpumcgOimgeaYvuekuuaKouWcsOS4u+aMiemSrlxuICAgICAgICB0aGlzLl9jaGVja0FuZFNob3dSb2JVSSgpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDjgJDmoLjlv4PjgJHorqHnrpfniYzlipvlgLzvvIjmlpflnLDkuLvop4TliJnvvIlcbiAgICAgKiDlpKfnjos9MTUsIOWwj+eOiz0xNCwgMj0xMywgQT0xMiwgSz0xMSwgUT0xMCwgSj05LCAxMD04LCAuLi4sIDM9MVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjYXJkIC0g5Y2h54mM5pWw5o2uXG4gICAgICogQHJldHVybnMge051bWJlcn0g54mM5Yqb5YC8XG4gICAgICovXG4gICAgZ2V0Q2FyZFZhbHVlOiBmdW5jdGlvbihjYXJkKSB7XG4gICAgICAgIHZhciByYW5rID0gY2FyZC5yYW5rXG4gICAgICAgIFxuICAgICAgICBpZiAocmFuayA9PT0gMykgcmV0dXJuIDEgICAvLyAzXG4gICAgICAgIGlmIChyYW5rID09PSA0KSByZXR1cm4gMiAgIC8vIDRcbiAgICAgICAgaWYgKHJhbmsgPT09IDUpIHJldHVybiAzICAgLy8gNVxuICAgICAgICBpZiAocmFuayA9PT0gNikgcmV0dXJuIDQgICAvLyA2XG4gICAgICAgIGlmIChyYW5rID09PSA3KSByZXR1cm4gNSAgIC8vIDdcbiAgICAgICAgaWYgKHJhbmsgPT09IDgpIHJldHVybiA2ICAgLy8gOFxuICAgICAgICBpZiAocmFuayA9PT0gOSkgcmV0dXJuIDcgICAvLyA5XG4gICAgICAgIGlmIChyYW5rID09PSAxMCkgcmV0dXJuIDggIC8vIDEwXG4gICAgICAgIGlmIChyYW5rID09PSAxMSkgcmV0dXJuIDkgIC8vIEpcbiAgICAgICAgaWYgKHJhbmsgPT09IDEyKSByZXR1cm4gMTAgLy8gUVxuICAgICAgICBpZiAocmFuayA9PT0gMTMpIHJldHVybiAxMSAvLyBLXG4gICAgICAgIGlmIChyYW5rID09PSAxNCkgcmV0dXJuIDEyIC8vIEFcbiAgICAgICAgaWYgKHJhbmsgPT09IDE1KSByZXR1cm4gMTMgLy8gMlxuICAgICAgICBpZiAocmFuayA9PT0gMTYpIHJldHVybiAxNCAvLyDlsI/njotcbiAgICAgICAgaWYgKHJhbmsgPT09IDE3KSByZXR1cm4gMTUgLy8g5aSn546LXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gMFxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog44CQ5qC45b+D44CR5L2/55SoIGdldENhcmRWYWx1ZSDmjpLluo/miYvniYxcbiAgICAgKiDmlpflnLDkuLvmoIflh4bmjpLluo/vvJrlpKfnjosgPiDlsI/njosgPiAyID4gQSA+IEsgPiBRID4gSiA+IDEwID4gOSA+IDggPiA3ID4gNiA+IDUgPiA0ID4gM1xuICAgICAqIEBwYXJhbSB7QXJyYXl9IGNhcmRzIC0g5pyN5Yqh56uv5Y6f5aeL5omL54mM5pWw5o2uXG4gICAgICogQHJldHVybnMge0FycmF5fSDmjpLluo/lkI7nmoTmiYvniYzmlbDmja5cbiAgICAgKi9cbiAgICBfc29ydENhcmRzOiBmdW5jdGlvbihjYXJkcykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgLy8g5aSN5Yi25pWw57uE77yM6YG/5YWN5L+u5pS55Y6f5pWw5o2uXG4gICAgICAgIHZhciBzb3J0ZWRDYXJkcyA9IGNhcmRzLnNsaWNlKClcbiAgICAgICAgXG4gICAgICAgIC8vIOS9v+eUqCBnZXRDYXJkVmFsdWUg5LuO5aSn5Yiw5bCP5o6S5bqPXG4gICAgICAgIHNvcnRlZENhcmRzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgdmFyIHZhbHVlQSA9IHNlbGYuZ2V0Q2FyZFZhbHVlKGEpXG4gICAgICAgICAgICB2YXIgdmFsdWVCID0gc2VsZi5nZXRDYXJkVmFsdWUoYilcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5YWI5oyJIHZhbHVlIOS7juWkp+WIsOWwj+aOkuW6j1xuICAgICAgICAgICAgaWYgKHZhbHVlQSAhPT0gdmFsdWVCKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlQiAtIHZhbHVlQVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gdmFsdWUg55u45ZCM5pe277yM5oyJ6Iqx6Imy5o6S5bqP77yI6buR5qGDID4g57qi5b+DID4g5qKF6IqxID4g5pa55Z2X77yJXG4gICAgICAgICAgICByZXR1cm4gYS5zdWl0IC0gYi5zdWl0XG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gc29ydGVkQ2FyZHNcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOOAkOaguOW/g+OAkea4heeQhuaJgOacieaXp+iKgueCue+8iOino+WGs+iDjOmdoueJjOaui+eVme+8iVxuICAgICAqIPCflKXjgJDkv67lpI3jgJHlkIzml7bmuIXnkIYgY2FyZHNfbm9kZSDlkowgbm9kZS5wYXJlbnTvvIznoa7kv53ml6DmrovnlZlcbiAgICAgKi9cbiAgICBjbGVhckFsbENhcmRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkemmluWFiOajgOafpeiKgueCueaYr+WQpuacieaViFxuICAgICAgICBpZiAoIXRoaXMubm9kZSB8fCAhdGhpcy5ub2RlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCfjq4gW2NsZWFyQWxsQ2FyZHNdIOiKgueCueW3sumUgOavgeaIluaXoOaViO+8jOi3s+i/h1wiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlj6rmuIXnkIbmiYvniYzlrrnlmajkuK3nmoToioLngrnvvIzkuI3pgY3ljoZub2RlLnBhcmVudFxuICAgICAgICBpZiAodGhpcy5jYXJkc19ub2RlKSB7XG4gICAgICAgICAgICB0aGlzLmNhcmRzX25vZGUucmVtb3ZlQWxsQ2hpbGRyZW4oKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+OriBbY2xlYXJBbGxDYXJkc10gY2FyZHNfbm9kZSDmnKrlrprkuYlcIilcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5riF56m66YCJ5Lit55qE54mM5pWw5o2uXG4gICAgICAgIHRoaXMuY2hvb3NlX2NhcmRfZGF0YSA9IFtdXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDorqHnrpfniYznmoRY5Z2Q5qCHXG4gICAgICovXG4gICAgX2dldENhcmRYOiBmdW5jdGlvbihpbmRleCwgY291bnQsIHNwYWNpbmcpIHtcbiAgICAgICAgdmFyIHRvdGFsV2lkdGggPSAoY291bnQgLSAxKSAqIHNwYWNpbmdcbiAgICAgICAgdmFyIHN0YXJ0WCA9IC10b3RhbFdpZHRoIC8gMlxuICAgICAgICByZXR1cm4gc3RhcnRYICsgaW5kZXggKiBzcGFjaW5nXG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOW6leeJjOebuOWFs1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIOWIm+W7uuW6leeJjOaYvuekuu+8iOeJjOiDjO+8iVxuICAgICAqL1xuICAgIF9jcmVhdGVCb3R0b21DYXJkczogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOa4heeQhuaXp+W6leeJjFxuICAgICAgICBpZiAodGhpcy5ib3R0b21fY2FyZCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmJvdHRvbV9jYXJkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYm90dG9tX2NhcmRbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ib3R0b21fY2FyZFtpXS5kZXN0cm95KClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ib3R0b21fY2FyZCA9IFtdXG4gICAgICAgIFxuICAgICAgICBpZiAoIXRoaXMuYm90dG9tX2NhcmRfcG9zX25vZGUgfHwgIXRoaXMuY2FyZF9wcmVmYWIpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgdmFyIGJvdHRvbVkgPSB0aGlzLmJvdHRvbV9jYXJkX3Bvc19ub2RlLnlcbiAgICAgICAgdmFyIGJvdHRvbVN0YXJ0WCA9IHRoaXMuYm90dG9tX2NhcmRfcG9zX25vZGUueCAtIENhcmRMYXlvdXQuYm90dG9tQ2FyZFNwYWNpbmdcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZGlfY2FyZCA9IGNjLmluc3RhbnRpYXRlKHRoaXMuY2FyZF9wcmVmYWIpXG4gICAgICAgICAgICBpZiAoIWRpX2NhcmQpIGNvbnRpbnVlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRpX2NhcmQuc2NhbGUgPSBDYXJkTGF5b3V0LmJvdHRvbUNhcmRTY2FsZVxuICAgICAgICAgICAgZGlfY2FyZC5zZXRQb3NpdGlvbihib3R0b21TdGFydFggKyBDYXJkTGF5b3V0LmJvdHRvbUNhcmRTcGFjaW5nICogaSwgYm90dG9tWSlcbiAgICAgICAgICAgIGRpX2NhcmQucGFyZW50ID0gdGhpcy5ub2RlLnBhcmVudFxuICAgICAgICAgICAgZGlfY2FyZC5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICB0aGlzLmJvdHRvbV9jYXJkLnB1c2goZGlfY2FyZClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDlj6vlnLDkuLsv5oqi5Zyw5Li755u45YWzXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBfY2hlY2tBbmRTaG93Um9iVUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfg48gW19jaGVja0FuZFNob3dSb2JVSV0g5qOA5p+l5piv5ZCm6ZyA6KaB5pi+56S65oqi5Zyw5Li7VUksIGNhcmRzUmVhZHk6XCIsIHRoaXMuY2FyZHNSZWFkeSwgXCJfcGVuZGluZ0JpZFVJOlwiLCB0aGlzLl9wZW5kaW5nQmlkVUksIFwiX2JpZGRpbmdQaGFzZTpcIiwgdGhpcy5fYmlkZGluZ1BoYXNlLCBcIl9nYW1lUGhhc2U6XCIsIHRoaXMuX2dhbWVQaGFzZSlcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHlpoLmnpzlnKjlh7rniYzpmLbmrrXvvIzkuI3mmL7npLrmiqLlnLDkuLvmjInpkq5cbiAgICAgICAgaWYgKHRoaXMuX2dhbWVQaGFzZSA9PT0gXCJwbGF5aW5nXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyBbX2NoZWNrQW5kU2hvd1JvYlVJXSDlvZPliY3mmK/lh7rniYzpmLbmrrXvvIzkuI3mmL7npLrmiqLlnLDkuLvmjInpkq5cIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgbXlQbGF5ZXJJZCA9IG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKCkuaWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5zZXJ2ZXJQbGF5ZXJJZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRFxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeajgOafpeaYr+WQpuacieW+heaYvuekuueahOaKouWcsOS4u1VJ77yI5pyN5Yqh56uv5raI5oGv5Zyo5Y+R54mM5a6M5oiQ5YmN5Yiw6L6+77yJXG4gICAgICAgIGlmICh0aGlzLl9wZW5kaW5nQmlkVUkgJiYgdGhpcy5jYXJkc1JlYWR5ICYmIHRoaXMucm9iVUkgJiYgIXRoaXMucm9iVUkuYWN0aXZlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfg48gW19jaGVja0FuZFNob3dSb2JVSV0g5Y+R54mM5a6M5oiQ77yM5pi+56S65b6F5aSE55CG55qE5oqi5Zyw5Li7VUksIHJvdW5kOlwiLCB0aGlzLl9wZW5kaW5nQmlkUm91bmQpXG4gICAgICAgICAgICBpZiAodGhpcy5fcGVuZGluZ0JpZFJvdW5kID09PSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvd0JpZFVJKFwi5Y+r5Zyw5Li7XCIsIFwi5LiN5Y+rXCIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3dCaWRVSShcIuaKouWcsOS4u1wiLCBcIuS4jeaKolwiKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcGVuZGluZ0JpZFVJID0gZmFsc2VcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5qOA5p+l5b2T5YmN546p5a625piv5ZCm6ZyA6KaB5pi+56S65oyJ6ZKuXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyBbX2NoZWNrQW5kU2hvd1JvYlVJXSByb2JfcGxheWVyX2FjY291bnRpZDpcIiwgdGhpcy5yb2JfcGxheWVyX2FjY291bnRpZCwgXCJteVBsYXllcklkOlwiLCBteVBsYXllcklkKVxuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMucm9iX3BsYXllcl9hY2NvdW50aWQgPT0gbXlQbGF5ZXJJZCAmJiB0aGlzLmNhcmRzUmVhZHkgJiYgdGhpcy5yb2JVSSAmJiAhdGhpcy5yb2JVSS5hY3RpdmUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyBbX2NoZWNrQW5kU2hvd1JvYlVJXSDova7liLDmiJHvvIzmmL7npLrmiqLlnLDkuLvmjInpkq4sIF9iaWRkaW5nUGhhc2U6XCIsIHRoaXMuX2JpZGRpbmdQaGFzZSlcbiAgICAgICAgICAgIGlmICh0aGlzLl9iaWRkaW5nUGhhc2UgPT09IFwiYmlkZGluZ1wiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2hvd0JpZFVJKFwi5Y+r5Zyw5Li7XCIsIFwi5LiN5Y+rXCIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3dCaWRVSShcIuaKouWcsOS4u1wiLCBcIuS4jeaKolwiKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9wcm9jZXNzQ2FsbExhbmRsb3JkVHVybjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCkgcmV0dXJuXG5cbiAgICAgICAgdmFyIHBsYXllcklkID0gZGF0YS5wbGF5ZXJfaWRcbiAgICAgICAgdmFyIHRpbWVvdXQgPSBkYXRhLnRpbWVvdXQgfHwgMTVcbiAgICAgICAgdmFyIHJvdW5kID0gZGF0YS5yb3VuZCB8fCAxXG4gICAgICAgIHZhciBleHBpcmVzQXQgPSBkYXRhLmV4cGlyZXNfYXQgfHwgMCAgLy8g8J+Up+OAkOaWsOWinuOAkeacjeWKoeerr+i/h+acn+aXtumXtOaIs++8iOavq+enku+8iVxuXG4gICAgICAgIC8vIPCflJLjgJDph43opoHjgJHlhYjlgZzmraLkuYvliY3nmoTlgJLorqHml7bvvIjmnI3liqHlmajova7ovazkuobvvIlcbiAgICAgICAgdGhpcy5fc3RvcEJpZENvdW50ZG93bigpXG5cbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeehruS/neiuvue9rua4uOaIj+mYtuautVxuICAgICAgICB0aGlzLl9nYW1lUGhhc2UgPSBcImJpZGRpbmdcIlxuICAgICAgICBcbiAgICAgICAgdGhpcy5yb2JfcGxheWVyX2FjY291bnRpZCA9IHBsYXllcklkXG4gICAgICAgIHRoaXMuX2JpZFRpbWVvdXQgPSB0aW1lb3V0XG4gICAgICAgIHRoaXMuX2JpZGRpbmdQaGFzZSA9IHJvdW5kID09PSAxID8gXCJiaWRkaW5nXCIgOiBcInJvYmJpbmdcIlxuICAgICAgICB0aGlzLl9iaWRFeHBpcmVzQXQgPSBleHBpcmVzQXQgIC8vIPCflKfjgJDmlrDlop7jgJHkv53lrZjov4fmnJ/ml7bpl7RcblxuICAgICAgICB2YXIgbXlQbGF5ZXJJZCA9IG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKCkuaWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5zZXJ2ZXJQbGF5ZXJJZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRFxuXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyBbX3Byb2Nlc3NDYWxsTGFuZGxvcmRUdXJuXSBwbGF5ZXJJZDpcIiwgcGxheWVySWQsIFwibXlQbGF5ZXJJZDpcIiwgbXlQbGF5ZXJJZCwgXCJyb3VuZDpcIiwgcm91bmQsIFwiY2FyZHNSZWFkeTpcIiwgdGhpcy5jYXJkc1JlYWR5KVxuXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHmo4Dmn6XmmK/lkKbova7liLDlvZPliY3njqnlrrZcbiAgICAgICAgaWYgKFN0cmluZyhwbGF5ZXJJZCkgPT09IFN0cmluZyhteVBsYXllcklkKSkge1xuICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeWmguaenOWPkeeJjOi/mOayoeWujOaIkO+8jOetieW+heWPkeeJjOWujOaIkOWQjuWGjeaYvuekuuaMiemSrlxuICAgICAgICAgICAgaWYgKCF0aGlzLmNhcmRzUmVhZHkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfg48gW19wcm9jZXNzQ2FsbExhbmRsb3JkVHVybl0g5Y+R54mM5pyq5a6M5oiQ77yM562J5b6F5Y+R54mM5a6M5oiQ5ZCO5YaN5pi+56S65oqi5Zyw5Li75oyJ6ZKuXCIpXG4gICAgICAgICAgICAgICAgLy8g5qCH6K6w6ZyA6KaB5pi+56S65oqi5Zyw5Li7VUnvvIzlnKjlj5HniYzlrozmiJDlkI7kvJrosIPnlKggX2NoZWNrQW5kU2hvd1JvYlVJXG4gICAgICAgICAgICAgICAgdGhpcy5fcGVuZGluZ0JpZFVJID0gdHJ1ZVxuICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdCaWRSb3VuZCA9IHJvdW5kXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOWPkeeJjOW3suWujOaIkO+8jOebtOaOpeaYvuekuuaMiemSrlxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+DjyBbX3Byb2Nlc3NDYWxsTGFuZGxvcmRUdXJuXSDlj5HniYzlt7LlrozmiJDvvIznm7TmjqXmmL7npLrmiqLlnLDkuLvmjInpkq5cIilcbiAgICAgICAgICAgICAgICBpZiAocm91bmQgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2hvd0JpZFVJKFwi5Y+r5Zyw5Li7XCIsIFwi5LiN5Y+rXCIpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2hvd0JpZFVJKFwi5oqi5Zyw5Li7XCIsIFwi5LiN5oqiXCIpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5faGlkZVJvYlVJKClcbiAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdCaWRVSSA9IGZhbHNlICAvLyDmuIXpmaTlvoXmmL7npLrmoIforrBcbiAgICAgICAgICAgIGlmICh0aGlzLm5vZGUgJiYgdGhpcy5ub2RlLnBhcmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMubm9kZS5wYXJlbnQuZW1pdChcImNhbGxfbGFuZGxvcmRfdHVybl9ldmVudFwiLCB7XG4gICAgICAgICAgICAgICAgICAgIHBsYXllcl9pZDogcGxheWVySWQsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IHRpbWVvdXQsXG4gICAgICAgICAgICAgICAgICAgIHJvdW5kOiByb3VuZCxcbiAgICAgICAgICAgICAgICAgICAgZXhwaXJlc19hdDogZXhwaXJlc0F0XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfc2hvd0JpZFVJOiBmdW5jdGlvbihjb25maXJtVGV4dCwgY2FuY2VsVGV4dCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIvCfjq8gPT09PT09PT09PSBbX3Nob3dCaWRVSV0g5pi+56S65oqi5Zyw5Li75oyJ6ZKuID09PT09PT09PT1cIilcbiAgICAgICAgY29uc29sZS5sb2coXCLwn46vIFtfc2hvd0JpZFVJXSBjb25maXJtVGV4dDpcIiwgY29uZmlybVRleHQsIFwiY2FuY2VsVGV4dDpcIiwgY2FuY2VsVGV4dClcbiAgICAgICAgY29uc29sZS5sb2coXCLwn46vIFtfc2hvd0JpZFVJXSByb2JVSSDlrZjlnKg6XCIsICEhdGhpcy5yb2JVSSlcbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcy5yb2JVSSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfjq8gW19zaG93QmlkVUldIHJvYlVJIOS4uuepuu+8jOaXoOazleaYvuekuuaMiemSru+8gVwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLnBsYXlpbmdVSV9ub2RlKSB7XG4gICAgICAgICAgICB0aGlzLnBsYXlpbmdVSV9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHlnLrmma/kuK3nmoTmjInpkq7lkI3np7DmmK8gcWlhbmd6aHVhbmcg5ZKMIGJ1cWlhbmd6aHVhbmdcbiAgICAgICAgdmFyIGNvbmZpcm1CdG4gPSB0aGlzLnJvYlVJLmdldENoaWxkQnlOYW1lKFwicWlhbmd6aHVhbmdcIilcbiAgICAgICAgdmFyIGNhbmNlbEJ0biA9IHRoaXMucm9iVUkuZ2V0Q2hpbGRCeU5hbWUoXCJidXFpYW5nemh1YW5nXCIpXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfjq8gW19zaG93QmlkVUldIGNvbmZpcm1CdG4g5a2Y5ZyoOlwiLCAhIWNvbmZpcm1CdG4sIFwiY2FuY2VsQnRuIOWtmOWcqDpcIiwgISFjYW5jZWxCdG4pXG4gICAgICAgIFxuICAgICAgICBpZiAoY29uZmlybUJ0bikge1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gY29uZmlybUJ0bi5nZXRDaGlsZEJ5TmFtZShcIkxhYmVsXCIpXG4gICAgICAgICAgICBpZiAobGFiZWwgJiYgbGFiZWwuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKSkge1xuICAgICAgICAgICAgICAgIGxhYmVsLmdldENvbXBvbmVudChjYy5MYWJlbCkuc3RyaW5nID0gY29uZmlybVRleHRcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfjq8gW19zaG93QmlkVUldIOiuvue9ruehruiupOaMiemSruaWh+WtlzpcIiwgY29uZmlybVRleHQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChjYW5jZWxCdG4pIHtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IGNhbmNlbEJ0bi5nZXRDaGlsZEJ5TmFtZShcIkxhYmVsXCIpXG4gICAgICAgICAgICBpZiAobGFiZWwgJiYgbGFiZWwuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKSkge1xuICAgICAgICAgICAgICAgIGxhYmVsLmdldENvbXBvbmVudChjYy5MYWJlbCkuc3RyaW5nID0gY2FuY2VsVGV4dFxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+OryBbX3Nob3dCaWRVSV0g6K6+572u5Y+W5raI5oyJ6ZKu5paH5a2XOlwiLCBjYW5jZWxUZXh0KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLnJvYlVJLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgY29uc29sZS5sb2coXCLwn46vIFtfc2hvd0JpZFVJXSByb2JVSS5hY3RpdmUg5bey6K6+572u5Li6IHRydWVcIilcbiAgICAgICAgdGhpcy5fc3RhcnRCaWRDb3VudGRvd24oKVxuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMubm9kZSAmJiB0aGlzLm5vZGUucGFyZW50KSB7XG4gICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5Lyg6YCS5YyF5ZCrIHRpbWVvdXQg55qE5a+56LGhXG4gICAgICAgICAgICB0aGlzLm5vZGUucGFyZW50LmVtaXQoXCJjYW5yb2JfZXZlbnRcIiwge1xuICAgICAgICAgICAgICAgIHBsYXllcl9pZDogdGhpcy5yb2JfcGxheWVyX2FjY291bnRpZCxcbiAgICAgICAgICAgICAgICB0aW1lb3V0OiB0aGlzLl9iaWRUaW1lb3V0IHx8IDE1XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+OryBbX3Nob3dCaWRVSV0gPT09PT09PT09PSDmiqLlnLDkuLvmjInpkq7mmL7npLrlrozmiJAgPT09PT09PT09PVwiKVxuICAgIH0sXG4gICAgXG4gICAgX2hpZGVSb2JVSTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnJvYlVJKSB7XG4gICAgICAgICAgICB0aGlzLnJvYlVJLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3RvcEJpZENvdW50ZG93bigpXG4gICAgfSxcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDwn5WQ44CQ5YCS6K6h5pe257O757uf44CR5qCH5YeG5paX5Zyw5Li75YCS6K6h5pe277yI5bim5YiG5q615YKs5L+D5pWI5p6c77yJXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiDwn5WQ44CQ57uf5LiA5YWl5Y+j44CR5byA5aeL5oqi5Zyw5Li75YCS6K6h5pe2XG4gICAgICog8J+Up+OAkOS/ruWkjeOAkeagueaNruacjeWKoeerr+i/h+acn+aXtumXtOiuoeeul+WJqeS9meaXtumXtO+8jOehruS/neS4juacjeWKoeerr+WQjOatpVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiAtIOWAkuiuoeaXtuenkuaVsO+8iOWkh+eUqO+8jOWmguaenCBleHBpcmVzX2F0IOaXoOaViOWImeS9v+eUqO+8iVxuICAgICAqL1xuICAgIF9zdGFydEJpZENvdW50ZG93bjogZnVuY3Rpb24oZHVyYXRpb24pIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIC8vIPCflJLjgJDpmLLmiqTjgJHlhYjlgZzmraLkuYvliY3nmoTlgJLorqHml7ZcbiAgICAgICAgdGhpcy5fc3RvcEJpZENvdW50ZG93bigpXG5cbiAgICAgICAgdmFyIHRpbWVvdXQgPSBkdXJhdGlvbiB8fCB0aGlzLl9iaWRUaW1lb3V0IHx8IDE1XG4gICAgICAgIHZhciBleHBpcmVzQXQgPSB0aGlzLl9iaWRFeHBpcmVzQXQgfHwgMFxuXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHmoLnmja7mnI3liqHnq6/ov4fmnJ/ml7bpl7TorqHnrpfliankvZnml7bpl7RcbiAgICAgICAgdmFyIHRpbWVMZWZ0ID0gdGltZW91dFxuICAgICAgICBpZiAoZXhwaXJlc0F0ID4gMCkge1xuICAgICAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KClcbiAgICAgICAgICAgIHRpbWVMZWZ0ID0gTWF0aC5tYXgoMCwgTWF0aC5mbG9vcigoZXhwaXJlc0F0IC0gbm93KSAvIDEwMDApKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fYmlkVGltZUxlZnQgPSB0aW1lTGVmdFxuICAgICAgICB0aGlzLl9pc0JpZENvdW50ZG93blRpY2tpbmcgPSB0cnVlXG4gICAgICAgIHRoaXMuX2lzQmlkV2FybmluZyA9IGZhbHNlXG5cbiAgICAgICAgLy8g8J+VkCDliJ3lp4vljJZVSeaYvuekulxuICAgICAgICB0aGlzLl91cGRhdGVCaWRDb3VudGRvd25VSSgpXG5cbiAgICAgICAgLy8g8J+VkCDkvb/nlKggY2MuTm9kZSDnmoQgc2NoZWR1bGUg5a6e546w5q+P56eSIHRpY2tcbiAgICAgICAgdGhpcy5zY2hlZHVsZSh0aGlzLl9iaWRDb3VudGRvd25UaWNrLCAxKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5WQ44CQ5qC45b+DVGlja+OAkeaKouWcsOS4u+WAkuiuoeaXtuavj+enkuaJp+ihjFxuICAgICAqL1xuICAgIF9iaWRDb3VudGRvd25UaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pc0JpZENvdW50ZG93blRpY2tpbmcpIHJldHVyblxuXG4gICAgICAgIHRoaXMuX2JpZFRpbWVMZWZ0LS1cblxuICAgICAgICAvLyDwn5WQIOabtOaWsFVJ5pi+56S6XG4gICAgICAgIHRoaXMuX3VwZGF0ZUJpZENvdW50ZG93blVJKClcblxuICAgICAgICAvLyDimqDvuI8gNeenku+8mui/m+WFpeitpuWRiueKtuaAgVxuICAgICAgICBpZiAodGhpcy5fYmlkVGltZUxlZnQgPT09IDUpIHtcbiAgICAgICAgICAgIHRoaXMuX2VudGVyQmlkV2FybmluZ1N0YXRlKClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIPCflIogM+enku+8muW8gOWni+a7tOetlOmfs++8iOavj+enkuS4gOasoe+8iVxuICAgICAgICBpZiAodGhpcy5fYmlkVGltZUxlZnQgPD0gMyAmJiB0aGlzLl9iaWRUaW1lTGVmdCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMuX3BsYXlUaWNrU291bmQoKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g4o+wIDDnp5LvvJroh6rliqjlpITnkIZcbiAgICAgICAgaWYgKHRoaXMuX2JpZFRpbWVMZWZ0IDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuX29uQmlkQ291bnRkb3duRW5kKClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5WQ44CQVUnmm7TmlrDjgJHmm7TmlrDmiqLlnLDkuLvlgJLorqHml7bmmL7npLpcbiAgICAgKi9cbiAgICBfdXBkYXRlQmlkQ291bnRkb3duVUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVtYWluaW5nID0gdGhpcy5fYmlkVGltZUxlZnRcbiAgICAgICAgdmFyIHVwZGF0ZWQgPSBmYWxzZVxuXG4gICAgICAgIC8vIOaWueW8jzHvvJrkvb/nlKggcHJvcGVydGllcyDnu5HlrprnmoQgTGFiZWxcbiAgICAgICAgaWYgKHRoaXMuYmlkQ291bnRkb3duTGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMuYmlkQ291bnRkb3duTGFiZWwuc3RyaW5nID0gU3RyaW5nKHJlbWFpbmluZylcbiAgICAgICAgICAgIHVwZGF0ZWQgPSB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyDmlrnlvI8y77ya5bCd6K+V5LuOIHJvYlVJIOS4reafpeaJvuWAkuiuoeaXtiBMYWJlbFxuICAgICAgICBpZiAodGhpcy5yb2JVSSkge1xuICAgICAgICAgICAgdmFyIGNsb2NrTm9kZSA9IHRoaXMucm9iVUkuZ2V0Q2hpbGRCeU5hbWUoXCJjbG9ja1wiKVxuICAgICAgICAgICAgaWYgKGNsb2NrTm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGNsb2NrTm9kZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5bal1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhYmVsID0gY2hpbGQuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgICAgICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLnN0cmluZyA9IFN0cmluZyhyZW1haW5pbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5vcGFjaXR5ID0gMjU1XG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDMyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbC5saW5lSGVpZ2h0ID0gNDBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnNldENvbnRlbnRTaXplKDUwLCA1MClcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkuI3pgJrov4djb2xvcuiuvue9rmFscGhhXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuekluZGV4ID0gMTAwXG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOaWueW8jzPvvJrpgJrnn6UgcGxheWVyX25vZGUg5pu05paw5YCS6K6h5pe2XG4gICAgICAgIGlmICh0aGlzLm5vZGUgJiYgdGhpcy5ub2RlLnBhcmVudCkge1xuICAgICAgICAgICAgdGhpcy5ub2RlLnBhcmVudC5lbWl0KFwidXBkYXRlX2NvdW50ZG93bl9ldmVudFwiLCB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJiaWRcIixcbiAgICAgICAgICAgICAgICByZW1haW5pbmc6IHJlbWFpbmluZ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDimqDvuI/jgJDorablkYrnirbmgIHjgJE156eS5pe26L+b5YWl6K2m5ZGK54q25oCBXG4gICAgICovXG4gICAgX2VudGVyQmlkV2FybmluZ1N0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzQmlkV2FybmluZykgcmV0dXJuXG4gICAgICAgIHRoaXMuX2lzQmlkV2FybmluZyA9IHRydWVcblxuICAgICAgICAvLyDojrflj5blgJLorqHml7YgTGFiZWwg6IqC54K5XG4gICAgICAgIHZhciBsYWJlbE5vZGUgPSB0aGlzLl9nZXRCaWRDb3VudGRvd25MYWJlbE5vZGUoKVxuICAgICAgICBpZiAoIWxhYmVsTm9kZSkgcmV0dXJuXG5cbiAgICAgICAgLy8g5Y+Y57qiXG4gICAgICAgIGxhYmVsTm9kZS5jb2xvciA9IGNjLkNvbG9yLlJFRFxuXG4gICAgICAgIC8vIPCflKUg5ZG85ZC457yp5pS+5Yqo55S7XG4gICAgICAgIGxhYmVsTm9kZS5zdG9wQWxsQWN0aW9ucygpXG4gICAgICAgIGNjLnR3ZWVuKGxhYmVsTm9kZSlcbiAgICAgICAgICAgIC5yZXBlYXRGb3JldmVyKFxuICAgICAgICAgICAgICAgIGNjLnR3ZWVuKClcbiAgICAgICAgICAgICAgICAgICAgLnRvKDAuMywgeyBzY2FsZTogMS4yIH0pXG4gICAgICAgICAgICAgICAgICAgIC50bygwLjMsIHsgc2NhbGU6IDEuMCB9KVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLnN0YXJ0KClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+VkOOAkOiOt+WPluiKgueCueOAkeiOt+WPluaKouWcsOS4u+WAkuiuoeaXtkxhYmVs6IqC54K5XG4gICAgICog8J+Up+OAkOS/ruWkjeOAkeafpeaJviBjbG9jayDlrZDoioLngrnkuK3nmoQgTGFiZWxcbiAgICAgKi9cbiAgICBfZ2V0QmlkQ291bnRkb3duTGFiZWxOb2RlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuYmlkQ291bnRkb3duTGFiZWwgJiYgdGhpcy5iaWRDb3VudGRvd25MYWJlbC5ub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5iaWRDb3VudGRvd25MYWJlbC5ub2RlXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucm9iVUkpIHtcbiAgICAgICAgICAgIC8vIOajgOafpSBjbG9jayDoioLngrnkuIvnmoQgTGFiZWxcbiAgICAgICAgICAgIHZhciBjbG9ja05vZGUgPSB0aGlzLnJvYlVJLmdldENoaWxkQnlOYW1lKFwiY2xvY2tcIilcbiAgICAgICAgICAgIGlmIChjbG9ja05vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBjbG9ja05vZGUuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsYWJlbCA9IGNoaWxkcmVuW2ldLmdldENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2hpbGRyZW5baV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIOWFtuS7luWPr+iDveeahOWQjeensFxuICAgICAgICAgICAgdmFyIGxhYmVsTmFtZXMgPSBbXCJjbG9ja18gTGFiZWxcIiwgXCJjbG9ja19MYWJlbFwiLCBcInRpbWVfbGFiZWxcIiwgXCJjb3VudGRvd25cIl1cbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGFiZWxOYW1lcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHZhciBsYWJlbE5vZGUgPSB0aGlzLnJvYlVJLmdldENoaWxkQnlOYW1lKGxhYmVsTmFtZXNbal0pXG4gICAgICAgICAgICAgICAgaWYgKGxhYmVsTm9kZSAmJiBsYWJlbE5vZGUuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGFiZWxOb2RlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOKPsOOAkOWxleekuue7k+adn+OAkeacrOWcsOWAkuiuoeaXtuaYvuekuue7k+adn1xuICAgICAqIOKaoO+4j+OAkOmHjeimgeOAkeWPquWBmlVJ5aSE55CG77yM5LiN5Y+R6YCB6K+35rGC77yBXG4gICAgICog5pyN5Yqh5Zmo5Lya5Zyo6LaF5pe25ZCO6Ieq5Yqo5aSE55CG77yM5bm25Y+R6YCB5LiL5LiA5Liq6L2u5qyh5raI5oGvXG4gICAgICovXG4gICAgX29uQmlkQ291bnRkb3duRW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g5YGc5q2iIHRpY2tcbiAgICAgICAgdGhpcy5faXNCaWRDb3VudGRvd25UaWNraW5nID0gZmFsc2VcbiAgICAgICAgdGhpcy51bnNjaGVkdWxlKHRoaXMuX2JpZENvdW50ZG93blRpY2spXG5cbiAgICAgICAgLy8g5YGc5q2i5Yqo55S75bm25oGi5aSN54q25oCBXG4gICAgICAgIHZhciBsYWJlbE5vZGUgPSB0aGlzLl9nZXRCaWRDb3VudGRvd25MYWJlbE5vZGUoKVxuICAgICAgICBpZiAobGFiZWxOb2RlKSB7XG4gICAgICAgICAgICBsYWJlbE5vZGUuc3RvcEFsbEFjdGlvbnMoKVxuICAgICAgICAgICAgbGFiZWxOb2RlLnNjYWxlID0gMVxuICAgICAgICAgICAgbGFiZWxOb2RlLmNvbG9yID0gY2MuQ29sb3IuV0hJVEVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOKaoO+4j+OAkOmHjeimgeOAkeS4jeWPkemAgeS7u+S9leivt+axgu+8gVxuICAgICAgICAvLyDmnI3liqHlmajkvJrlnKjotoXml7blkI7oh6rliqjlpITnkIZcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+UkuOAkOWBnOatouOAkeWBnOatouaKouWcsOS4u+WAkuiuoeaXtlxuICAgICAqL1xuICAgIF9zdG9wQmlkQ291bnRkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5faXNCaWRDb3VudGRvd25UaWNraW5nID0gZmFsc2VcbiAgICAgICAgdGhpcy51bnNjaGVkdWxlKHRoaXMuX2JpZENvdW50ZG93blRpY2spXG5cbiAgICAgICAgLy8g5oGi5aSNIExhYmVsIOeKtuaAgVxuICAgICAgICB2YXIgbGFiZWxOb2RlID0gdGhpcy5fZ2V0QmlkQ291bnRkb3duTGFiZWxOb2RlKClcbiAgICAgICAgaWYgKGxhYmVsTm9kZSkge1xuICAgICAgICAgICAgbGFiZWxOb2RlLnN0b3BBbGxBY3Rpb25zKClcbiAgICAgICAgICAgIGxhYmVsTm9kZS5zY2FsZSA9IDFcbiAgICAgICAgICAgIGxhYmVsTm9kZS5jb2xvciA9IGNjLkNvbG9yLldISVRFXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pc0JpZFdhcm5pbmcgPSBmYWxzZVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDwn5WQ44CQ5Ye654mM5YCS6K6h5pe244CR5qCH5YeG5paX5Zyw5Li75YCS6K6h5pe277yI5bim5YiG5q615YKs5L+D5pWI5p6c77yJXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiDwn5WQ44CQ57uf5LiA5YWl5Y+j44CR5byA5aeL5Ye654mM5YCS6K6h5pe2XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0g5YCS6K6h5pe256eS5pWw77yM6buY6K6kMTXnp5JcbiAgICAgKi9cbiAgICBfc3RhcnRQbGF5Q291bnRkb3duOiBmdW5jdGlvbihkdXJhdGlvbikge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgLy8g8J+UkuOAkOmYsuaKpOOAkeWFiOWBnOatouS5i+WJjeeahOWAkuiuoeaXtlxuICAgICAgICB0aGlzLl9zdG9wUGxheUNvdW50ZG93bigpXG5cbiAgICAgICAgdmFyIHRpbWVvdXQgPSBkdXJhdGlvbiB8fCB0aGlzLl9wbGF5VGltZW91dCB8fCAxNVxuICAgICAgICB0aGlzLl9wbGF5VGltZUxlZnQgPSB0aW1lb3V0XG4gICAgICAgIHRoaXMuX2lzUGxheUNvdW50ZG93blRpY2tpbmcgPSB0cnVlXG4gICAgICAgIHRoaXMuX2lzUGxheVdhcm5pbmcgPSBmYWxzZVxuXG4gICAgICAgIC8vIPCflZAg5Yid5aeL5YyWVUnmmL7npLpcbiAgICAgICAgdGhpcy5fdXBkYXRlUGxheUNvdW50ZG93blVJKClcblxuICAgICAgICAvLyDwn5WQIOS9v+eUqCBjYy5Ob2RlIOeahCBzY2hlZHVsZSDlrp7njrDmr4/np5IgdGlja1xuICAgICAgICB0aGlzLnNjaGVkdWxlKHRoaXMuX3BsYXlDb3VudGRvd25UaWNrLCAxKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5WQ44CQ5qC45b+DVGlja+OAkeWHuueJjOWAkuiuoeaXtuavj+enkuaJp+ihjFxuICAgICAqL1xuICAgIF9wbGF5Q291bnRkb3duVGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5faXNQbGF5Q291bnRkb3duVGlja2luZykgcmV0dXJuXG5cbiAgICAgICAgdGhpcy5fcGxheVRpbWVMZWZ0LS1cblxuICAgICAgICAvLyDwn5WQIOabtOaWsFVJ5pi+56S6XG4gICAgICAgIHRoaXMuX3VwZGF0ZVBsYXlDb3VudGRvd25VSSgpXG5cbiAgICAgICAgLy8g4pqg77iPIDXnp5LvvJrov5vlhaXorablkYrnirbmgIFcbiAgICAgICAgaWYgKHRoaXMuX3BsYXlUaW1lTGVmdCA9PT0gNSkge1xuICAgICAgICAgICAgdGhpcy5fZW50ZXJQbGF5V2FybmluZ1N0YXRlKClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIPCflIogM+enku+8muW8gOWni+a7tOetlOmfs++8iOavj+enkuS4gOasoe+8iVxuICAgICAgICBpZiAodGhpcy5fcGxheVRpbWVMZWZ0IDw9IDMgJiYgdGhpcy5fcGxheVRpbWVMZWZ0ID4gMCkge1xuICAgICAgICAgICAgdGhpcy5fcGxheVRpY2tTb3VuZCgpXG4gICAgICAgIH1cblxuICAgICAgICAvLyDij7AgMOenku+8muiHquWKqOWkhOeQhlxuICAgICAgICBpZiAodGhpcy5fcGxheVRpbWVMZWZ0IDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuX29uUGxheUNvdW50ZG93bkVuZCgpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+VkOOAkFVJ5pu05paw44CR5pu05paw5Ye654mM5YCS6K6h5pe25pi+56S6XG4gICAgICog8J+Up+OAkOS/ruWkjeOAkeWPquabtOaWsOmXuemSn+mHjOmdoueahOWAkuiuoeaXtu+8jOS4jeWcqOWFtuS7luS9jee9ruaYvuekulxuICAgICAqL1xuICAgIF91cGRhdGVQbGF5Q291bnRkb3duVUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVtYWluaW5nID0gdGhpcy5fcGxheVRpbWVMZWZ0XG5cbiAgICAgICAgLy8g5pa55byPMe+8muS9v+eUqCBwcm9wZXJ0aWVzIOe7keWumueahCBMYWJlbO+8iOWmguaenOacie+8iVxuICAgICAgICBpZiAodGhpcy5wbGF5Q291bnRkb3duTGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMucGxheUNvdW50ZG93bkxhYmVsLnN0cmluZyA9IFN0cmluZyhyZW1haW5pbmcpXG4gICAgICAgIH1cblxuICAgICAgICAvLyDmlrnlvI8y77ya6YCa55+lIHBsYXllcl9ub2RlIOabtOaWsOWAkuiuoeaXtlxuICAgICAgICBpZiAodGhpcy5ub2RlICYmIHRoaXMubm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgIHZhciBldmVudCA9IG5ldyBjYy5FdmVudC5FdmVudEN1c3RvbShcInVwZGF0ZV9jb3VudGRvd25fZXZlbnRcIiwgdHJ1ZSlcbiAgICAgICAgICAgIGV2ZW50LnNldFVzZXJEYXRhKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInBsYXlcIixcbiAgICAgICAgICAgICAgICByZW1haW5pbmc6IHJlbWFpbmluZ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHRoaXMubm9kZS5wYXJlbnQuZGlzcGF0Y2hFdmVudChldmVudClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOaWueW8jzPvvJrnm7TmjqXmm7TmlrAgcGxheWluZ1VJX25vZGUg5Lit55qE6Ze56ZKfIExhYmVsXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHpl7npkp/oioLngrnot6/lvoTvvJpwbGF5aW5nVUlfbm9kZSAtPiBjbG9jayAtPiBwbGF5aW5nX2Nsb2NsX2xhYmVsXG4gICAgICAgIGlmICh0aGlzLnBsYXlpbmdVSV9ub2RlKSB7XG4gICAgICAgICAgICB2YXIgY2xvY2tOb2RlID0gdGhpcy5wbGF5aW5nVUlfbm9kZS5nZXRDaGlsZEJ5TmFtZShcImNsb2NrXCIpXG4gICAgICAgICAgICBpZiAoY2xvY2tOb2RlKSB7XG4gICAgICAgICAgICAgICAgLy8g56Gu5L+dIGNsb2NrIOiKgueCueWPr+ingVxuICAgICAgICAgICAgICAgIGNsb2NrTm9kZS5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgICAgY2xvY2tOb2RlLm9wYWNpdHkgPSAyNTVcblxuICAgICAgICAgICAgICAgIC8vIOafpeaJviBwbGF5aW5nX2Nsb2NsX2xhYmVs77yI5rOo5oSP5ou85YaZ77yJXG4gICAgICAgICAgICAgICAgdmFyIGNsb2NrTGFiZWwgPSBjbG9ja05vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJwbGF5aW5nX2Nsb2NsX2xhYmVsXCIpXG4gICAgICAgICAgICAgICAgaWYgKGNsb2NrTGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhYmVsID0gY2xvY2tMYWJlbC5nZXRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICAgICAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwuc3RyaW5nID0gU3RyaW5nKHJlbWFpbmluZylcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsb2NrTGFiZWwuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xvY2tMYWJlbC5vcGFjaXR5ID0gMjU1XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyDlpIfpgInvvJrmn6Xmib7ku7vkvZUgTGFiZWwg5a2Q6IqC54K5XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGNsb2NrTm9kZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhYmVsID0gY2hpbGQuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwuc3RyaW5nID0gU3RyaW5nKHJlbWFpbmluZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQub3BhY2l0eSA9IDI1NVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHmm7TmlrDpl7npkp/ph4zpnaLnmoTlgJLorqHml7bmmL7npLpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gcmVtYWluaW5nIC0g5Ymp5L2Z56eS5pWwXG4gICAgICovXG4gICAgX3VwZGF0ZUNsb2NrVGltZUxhYmVsOiBmdW5jdGlvbihyZW1haW5pbmcpIHtcbiAgICAgICAgLy8g5p+l5om+IGdhbWVTY2VuZSDoioLngrlcbiAgICAgICAgdmFyIGdhbWVTY2VuZU5vZGUgPSB0aGlzLm5vZGUucGFyZW50XG4gICAgICAgIGlmICghZ2FtZVNjZW5lTm9kZSkgcmV0dXJuXG5cbiAgICAgICAgLy8g6YGN5Y6G5omA5pyJ5a2Q6IqC54K577yM5om+5YiwIHBsYXllcl9ub2Rl77yI5b2T5YmN546p5a6277yJXG4gICAgICAgIHZhciBjaGlsZHJlbiA9IGdhbWVTY2VuZU5vZGUuY2hpbGRyZW5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV1cbiAgICAgICAgICAgIHZhciBwbGF5ZXJOb2RlU2NyaXB0ID0gY2hpbGQuZ2V0Q29tcG9uZW50KFwicGxheWVyX25vZGVcIilcbiAgICAgICAgICAgIGlmIChwbGF5ZXJOb2RlU2NyaXB0ICYmIHBsYXllck5vZGVTY3JpcHQuc2VhdF9pbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIOaWueW8jzHvvJrkvb/nlKggdGltZV9sYWJlbCDlsZ7mgKdcbiAgICAgICAgICAgICAgICBpZiAocGxheWVyTm9kZVNjcmlwdC50aW1lX2xhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHBsYXllck5vZGVTY3JpcHQudGltZV9sYWJlbC5zdHJpbmcgPSBTdHJpbmcocmVtYWluaW5nKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIOaWueW8jzLvvJrmn6Xmib4gY2xvY2tpbWFnZSDoioLngrnkuK3nmoQgTGFiZWzvvIjkuI7miqLlnLDkuLvlgJLorqHml7bnsbvkvLzvvIlcbiAgICAgICAgICAgICAgICBpZiAocGxheWVyTm9kZVNjcmlwdC5jbG9ja2ltYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjbG9ja05vZGUgPSBwbGF5ZXJOb2RlU2NyaXB0LmNsb2NraW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgLy8g56Gu5L+dIGNsb2NraW1hZ2Ug5Y+v6KeBXG4gICAgICAgICAgICAgICAgICAgIGNsb2NrTm9kZS5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgIGNsb2NrTm9kZS5vcGFjaXR5ID0gMjU1XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5p+l5om+IGNsb2NraW1hZ2Ug5Lit55qEIExhYmVsXG4gICAgICAgICAgICAgICAgICAgIHZhciBjbG9ja0NoaWxkcmVuID0gY2xvY2tOb2RlLmNoaWxkcmVuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2xvY2tDaGlsZHJlbi5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNsb2NrQ2hpbGQgPSBjbG9ja0NoaWxkcmVuW2pdXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFiZWwgPSBjbG9ja0NoaWxkLmdldENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLnN0cmluZyA9IFN0cmluZyhyZW1haW5pbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvY2tDaGlsZC5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvY2tDaGlsZC5vcGFjaXR5ID0gMjU1XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g6K6+572u5ZCI6YCC55qE5a2X5L2T5aSn5bCPXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwuZm9udFNpemUgPSAzMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsLmxpbmVIZWlnaHQgPSA0MFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb2NrQ2hpbGQuc2V0Q29udGVudFNpemUoNTAsIDUwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkuI3pgJrov4djb2xvcuiuvue9rmFscGhhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvY2tDaGlsZC5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb2NrQ2hpbGQuekluZGV4ID0gMTAwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIOWmguaenCBjbG9ja2ltYWdlIOayoeaciSBMYWJlbCDlrZDoioLngrnvvIzmo4Dmn6XmmK/lkKbnm7TmjqXmmK8gTGFiZWxcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpcmVjdExhYmVsID0gY2xvY2tOb2RlLmdldENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpcmVjdExhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3RMYWJlbC5zdHJpbmcgPSBTdHJpbmcocmVtYWluaW5nKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog4pqg77iP44CQ6K2m5ZGK54q25oCB44CRNeenkuaXtui/m+WFpeitpuWRiueKtuaAgVxuICAgICAqL1xuICAgIF9lbnRlclBsYXlXYXJuaW5nU3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5faXNQbGF5V2FybmluZykgcmV0dXJuXG4gICAgICAgIHRoaXMuX2lzUGxheVdhcm5pbmcgPSB0cnVlXG5cbiAgICAgICAgLy8g6I635Y+W5YCS6K6h5pe2IExhYmVsIOiKgueCuVxuICAgICAgICB2YXIgbGFiZWxOb2RlID0gdGhpcy5fZ2V0UGxheUNvdW50ZG93bkxhYmVsTm9kZSgpXG4gICAgICAgIGlmICghbGFiZWxOb2RlKSByZXR1cm5cblxuICAgICAgICAvLyDlj5jnuqJcbiAgICAgICAgbGFiZWxOb2RlLmNvbG9yID0gY2MuQ29sb3IuUkVEXG5cbiAgICAgICAgLy8g8J+UpSDlkbzlkLjnvKnmlL7liqjnlLtcbiAgICAgICAgbGFiZWxOb2RlLnN0b3BBbGxBY3Rpb25zKClcbiAgICAgICAgY2MudHdlZW4obGFiZWxOb2RlKVxuICAgICAgICAgICAgLnJlcGVhdEZvcmV2ZXIoXG4gICAgICAgICAgICAgICAgY2MudHdlZW4oKVxuICAgICAgICAgICAgICAgICAgICAudG8oMC4zLCB7IHNjYWxlOiAxLjIgfSlcbiAgICAgICAgICAgICAgICAgICAgLnRvKDAuMywgeyBzY2FsZTogMS4wIH0pXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAuc3RhcnQoKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5WQ44CQ6I635Y+W6IqC54K544CR6I635Y+W5Ye654mM5YCS6K6h5pe2TGFiZWzoioLngrlcbiAgICAgKi9cbiAgICBfZ2V0UGxheUNvdW50ZG93bkxhYmVsTm9kZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOaWueW8jzHvvJrkvb/nlKggcHJvcGVydGllcyDnu5HlrprnmoQgTGFiZWxcbiAgICAgICAgaWYgKHRoaXMucGxheUNvdW50ZG93bkxhYmVsICYmIHRoaXMucGxheUNvdW50ZG93bkxhYmVsLm5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBsYXlDb3VudGRvd25MYWJlbC5ub2RlXG4gICAgICAgIH1cblxuICAgICAgICAvLyDmlrnlvI8y77ya5LuOIHBsYXlpbmdVSV9ub2RlIOeahOmXuemSn+S4reiOt+WPliBMYWJlbFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR6Ze56ZKf6IqC54K56Lev5b6E77yacGxheWluZ1VJX25vZGUgLT4gY2xvY2sgLT4gcGxheWluZ19jbG9jbF9sYWJlbFxuICAgICAgICBpZiAodGhpcy5wbGF5aW5nVUlfbm9kZSkge1xuICAgICAgICAgICAgdmFyIGNsb2NrTm9kZSA9IHRoaXMucGxheWluZ1VJX25vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJjbG9ja1wiKVxuICAgICAgICAgICAgaWYgKGNsb2NrTm9kZSkge1xuICAgICAgICAgICAgICAgIC8vIOafpeaJviBwbGF5aW5nX2Nsb2NsX2xhYmVs77yI5rOo5oSP5ou85YaZ77yJXG4gICAgICAgICAgICAgICAgdmFyIGNsb2NrTGFiZWwgPSBjbG9ja05vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJwbGF5aW5nX2Nsb2NsX2xhYmVsXCIpXG4gICAgICAgICAgICAgICAgaWYgKGNsb2NrTGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNsb2NrTGFiZWxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g5aSH6YCJ77ya5p+l5om+5Lu75L2VIExhYmVsIOWtkOiKgueCuVxuICAgICAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGNsb2NrTm9kZS5jaGlsZHJlblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhYmVsID0gY2hpbGRyZW5baV0uZ2V0Q29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgICAgICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjaGlsZHJlbltpXVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog4o+w44CQ5bGV56S657uT5p2f44CR5pys5Zyw5Ye654mM5YCS6K6h5pe25pi+56S657uT5p2fXG4gICAgICog4pqg77iP44CQ6YeN6KaB44CR5Y+q5YGaVUnlpITnkIbvvIzkuI3lj5HpgIHor7fmsYLvvIFcbiAgICAgKiDmnI3liqHlmajkvJrlnKjotoXml7blkI7oh6rliqjlpITnkIbvvIjoh6rliqjkuI3lh7rvvInvvIzlubblj5HpgIHkuIvkuIDkuKrova7mrKHmtojmga9cbiAgICAgKi9cbiAgICBfb25QbGF5Q291bnRkb3duRW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g5YGc5q2iIHRpY2tcbiAgICAgICAgdGhpcy5faXNQbGF5Q291bnRkb3duVGlja2luZyA9IGZhbHNlXG4gICAgICAgIHRoaXMudW5zY2hlZHVsZSh0aGlzLl9wbGF5Q291bnRkb3duVGljaylcblxuICAgICAgICAvLyDlgZzmraLliqjnlLvlubbmgaLlpI3nirbmgIFcbiAgICAgICAgdmFyIGxhYmVsTm9kZSA9IHRoaXMuX2dldFBsYXlDb3VudGRvd25MYWJlbE5vZGUoKVxuICAgICAgICBpZiAobGFiZWxOb2RlKSB7XG4gICAgICAgICAgICBsYWJlbE5vZGUuc3RvcEFsbEFjdGlvbnMoKVxuICAgICAgICAgICAgbGFiZWxOb2RlLnNjYWxlID0gMVxuICAgICAgICAgICAgbGFiZWxOb2RlLmNvbG9yID0gY2MuQ29sb3IuV0hJVEVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOKaoO+4j+OAkOmHjeimgeOAkeS4jeWPkemAgeS7u+S9leivt+axgu+8gVxuICAgICAgICAvLyDmnI3liqHlmajkvJrlnKjotoXml7blkI7oh6rliqjlpITnkIbvvJpcbiAgICAgICAgLy8gMS4g6Ieq5Yqo5LiN5Ye6XG4gICAgICAgIC8vIDIuIOWPkemAgSBjYW5fY2h1X2NhcmRfbm90aWZ5IOaIliBnYW1lX292ZXJcbiAgICAgICAgLy8g5a6i5oi356uv5Y+q6ZyA6KaB5ZON5bqU5pyN5Yqh5Zmo5raI5oGvXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflJLjgJDlgZzmraLjgJHlgZzmraLlh7rniYzlgJLorqHml7ZcbiAgICAgKi9cbiAgICBfc3RvcFBsYXlDb3VudGRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9pc1BsYXlDb3VudGRvd25UaWNraW5nID0gZmFsc2VcbiAgICAgICAgdGhpcy51bnNjaGVkdWxlKHRoaXMuX3BsYXlDb3VudGRvd25UaWNrKVxuXG4gICAgICAgIC8vIOaBouWkjSBMYWJlbCDnirbmgIFcbiAgICAgICAgdmFyIGxhYmVsTm9kZSA9IHRoaXMuX2dldFBsYXlDb3VudGRvd25MYWJlbE5vZGUoKVxuICAgICAgICBpZiAobGFiZWxOb2RlKSB7XG4gICAgICAgICAgICBsYWJlbE5vZGUuc3RvcEFsbEFjdGlvbnMoKVxuICAgICAgICAgICAgbGFiZWxOb2RlLnNjYWxlID0gMVxuICAgICAgICAgICAgbGFiZWxOb2RlLmNvbG9yID0gY2MuQ29sb3IuV0hJVEVcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2lzUGxheVdhcm5pbmcgPSBmYWxzZVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDwn5SK44CQ6Z+z5pWI44CR5ru0562U6Z+z5pWI77yIM+enkuWCrOS/g++8iVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICog8J+UiiDmkq3mlL7mu7TnrZTpn7PmlYjvvIjnlKjkuo7miqLlnLDkuLvlgJLorqHml7bvvIlcbiAgICAgKi9cbiAgICBfcGxheVRpY2tTb3VuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghaXNvcGVuX3NvdW5kKSByZXR1cm5cblxuICAgICAgICAvLyDkvJjlhYjkvb/nlKjnu5HlrprnmoTpn7PmlYhcbiAgICAgICAgaWYgKHRoaXMudGlja0F1ZGlvKSB7XG4gICAgICAgICAgICBjYy5hdWRpb0VuZ2luZS5wbGF5RWZmZWN0KHRoaXMudGlja0F1ZGlvLCBmYWxzZSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5YWc5bqV77ya5L2/55So5Y+R54mM6Z+z5pWI77yI5Y+v5pu/5o2i5Li65LiT55So5ru0562U6Z+z5pWI77yJXG4gICAgICAgIHBsYXlTb3VuZChcInNvdW5kL2ZhcGFpMVwiKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5SKIOaSreaUvua7tOetlOmfs+aViO+8iOeUqOS6juWHuueJjOWAkuiuoeaXtu+8iVxuICAgICAqL1xuICAgIF9wbGF5UGxheVRpY2tTb3VuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghaXNvcGVuX3NvdW5kKSByZXR1cm5cblxuICAgICAgICAvLyDkvJjlhYjkvb/nlKjnu5HlrprnmoTpn7PmlYhcbiAgICAgICAgaWYgKHRoaXMudGlja0F1ZGlvKSB7XG4gICAgICAgICAgICBjYy5hdWRpb0VuZ2luZS5wbGF5RWZmZWN0KHRoaXMudGlja0F1ZGlvLCBmYWxzZSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5YWc5bqV77ya5L2/55So5Y+R54mM6Z+z5pWIXG4gICAgICAgIHBsYXlTb3VuZChcInNvdW5kL2ZhcGFpMVwiKVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDwn5SKIOaKouWcsOS4u+ivremfs+ezu+e7n++8iOacjeWKoeerr+mpseWKqO+8iVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICog8J+UiiDmkq3mlL7miqLlnLDkuLvor63pn7NcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIOacjeWKoeerr+W5v+aSreeahOaVsOaNrlxuICAgICAqICAgLSBhY3Rpb246IFwiY2FsbFwiID0g5oqiLCBcInBhc3NcIiA9IOS4jeaKolxuICAgICAqICAgLSBnZW5kZXI6IFwibWFsZVwiIC8gXCJmZW1hbGVcIlxuICAgICAqICAgLSBvcmRlcjog5b2T5YmN6L2u5qyh5YaF55qE5pON5L2c6aG65bqP77yIMS0z77yJXG4gICAgICogICAtIHJvdW5kOiDlvZPliY3ova7mrKHvvIgx5oiWMu+8iVxuICAgICAqL1xuICAgIF9wbGF5Um9iU291bmQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaWYgKCFpc29wZW5fc291bmQpIHJldHVyblxuXG4gICAgICAgIHZhciBhY3Rpb24gPSBkYXRhLmFjdGlvblxuICAgICAgICB2YXIgZ2VuZGVyID0gZGF0YS5nZW5kZXIgfHwgXCJtYWxlXCJcbiAgICAgICAgdmFyIG9yZGVyID0gZGF0YS5vcmRlciB8fCAxXG4gICAgICAgIHZhciByb3VuZCA9IGRhdGEucm91bmQgfHwgMVxuICAgICAgICB2YXIgcGxheWVySUQgPSBkYXRhLnBsYXllcl9pZCB8fCBcIlwiXG5cbiAgICAgICAgLy8g8J+UkuOAkOmYsumHjeWkjeacuuWItuOAkeajgOafpeaYr+WQpuW3sue7j+aSreaUvui/h+ebuOWQjOeahOmfs+aViFxuICAgICAgICB2YXIgc291bmRLZXkgPSBwbGF5ZXJJRCArIFwiX1wiICsgYWN0aW9uICsgXCJfXCIgKyByb3VuZCArIFwiX1wiICsgb3JkZXJcbiAgICAgICAgaWYgKHRoaXMuX2xhc3RSb2JTb3VuZEtleSA9PT0gc291bmRLZXkpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2xhc3RSb2JTb3VuZEtleSA9IHNvdW5kS2V5XG5cblxuICAgICAgICAvLyDkuI3miqJcbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gXCJwYXNzXCIpIHtcbiAgICAgICAgICAgIHZhciBwYXNzU291bmQgPSBnZW5kZXIgPT09IFwiZmVtYWxlXCIgPyBcIm1fbnZfYnVxaWFuZ1wiIDogXCJtX25hbl9idXFpYW5nXCJcbiAgICAgICAgICAgIHRoaXMuX3BsYXlTb3VuZEVmZmVjdChwYXNzU291bmQpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOaKouWcsOS4u1xuICAgICAgICBpZiAoZ2VuZGVyID09PSBcImZlbWFsZVwiKSB7XG4gICAgICAgICAgICAvLyDlpbPnjqnlrrZcbiAgICAgICAgICAgIGlmIChyb3VuZCA9PT0gMSAmJiBvcmRlciA9PT0gMSkge1xuICAgICAgICAgICAgICAgIC8vIOesrDHova7nrKwx5L2NXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheVNvdW5kRWZmZWN0KFwibV9udl9xaWFuZ2Rpemh1XzAxXCIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOesrDHova7nrKwyLzPkvY0g5oiWIOesrDLova7nrKwx5L2NXG4gICAgICAgICAgICAgICAgdmFyIHNvdW5kcyA9IFtcIm1fbnZfcWlhbmdkaXpodV8wMlwiLCBcIm1fbnZfcWlhbmdkaXpodV93b3FpYW5nXzAxXCJdXG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheVJhbmRvbVNvdW5kKHNvdW5kcylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOeUt+eOqeWutlxuICAgICAgICAgICAgaWYgKHJvdW5kID09PSAxICYmIG9yZGVyID09PSAxKSB7XG4gICAgICAgICAgICAgICAgLy8g56ysMei9ruesrDHkvY1cbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5U291bmRFZmZlY3QoXCJtX25hbl9xaWFuZ2Rpemh1XCIpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOesrDHova7nrKwyLzPkvY0g5oiWIOesrDLova7nrKwx5L2NXG4gICAgICAgICAgICAgICAgdmFyIHNvdW5kcyA9IFtcIm1fbmFuX3FpYW5nZGl6aHVcIiwgXCJtX25hbl9xaWFuZ2Rpemh1X3dvcWlhbmdcIl1cbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5UmFuZG9tU291bmQoc291bmRzKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflIog5pKt5pS+6Z+z5pWI77yI5bimIGZhbGxiYWNrIOacuuWItu+8iVxuICAgICAqIPCflKfjgJDph43mnoTjgJHnp7vpmaTlhajlsYAgZmFsbGJhY2sg5YiwIFwi5aSn5L2gXCIg55qE6YC76L6RXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSDpn7PmlYjlkI3np7DvvIjkuI3lkKvmianlsZXlkI3vvIlcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZmFsbGJhY2sgLSDlj6/pgInnmoQgZmFsbGJhY2sg6Z+z5pWI5ZCN56ew77yI5LiN5YaN6Ieq5YqoIGZhbGxiYWNrIOWIsCBcIuWkp+S9oFwi77yJXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBhbGxvd0RhbmlGYWxsYmFjayAtIOaYr+WQpuWFgeiuuOacgOe7iCBmYWxsYmFjayDliLAgXCLlpKfkvaBcIu+8iOm7mOiupCBmYWxzZe+8iVxuICAgICAqL1xuICAgIF9wbGF5U291bmRFZmZlY3Q6IGZ1bmN0aW9uKG5hbWUsIGZhbGxiYWNrLCBhbGxvd0RhbmlGYWxsYmFjaykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgXG4gICAgICAgIGNjLnJlc291cmNlcy5sb2FkKFwic291bmQvXCIgKyBuYW1lLCBjYy5BdWRpb0NsaXAsIGZ1bmN0aW9uKGVyciwgY2xpcCkge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCflIogW19wbGF5U291bmRFZmZlY3RdIOWKoOi9vemfs+aViOWksei0pTogXCIgKyBuYW1lLCBlcnIubWVzc2FnZSB8fCBlcnIpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkGZhbGxiYWNr44CR5bCd6K+V5pKt5pS+5aSH55So6Z+z5pWIXG4gICAgICAgICAgICAgICAgaWYgKGZhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNjLnJlc291cmNlcy5sb2FkKFwic291bmQvXCIgKyBmYWxsYmFjaywgY2MuQXVkaW9DbGlwLCBmdW5jdGlvbihlcnIyLCBjbGlwMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycjIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn5SKIFtfcGxheVNvdW5kRWZmZWN0XSBmYWxsYmFjayDkuZ/lpLHotKU6IFwiICsgZmFsbGJhY2ssIGVycjIubWVzc2FnZSB8fCBlcnIyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDph43opoHkv67mlLnjgJHkuI3lho3oh6rliqggZmFsbGJhY2sg5YiwIFwi5aSn5L2gXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDlj6rmnInmmI7noa7lhYHorrjml7bmiY0gZmFsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWxsb3dEYW5pRmFsbGJhY2sgJiYgZmFsbGJhY2sgIT09IFwibV9jcF9kYW5pXCIgJiYgbmFtZSAhPT0gXCJtX2NwX2RhbmlcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9wbGF5U291bmRFZmZlY3QoXCJtX2NwX2RhbmlcIiwgbnVsbCwgZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2MuYXVkaW9FbmdpbmUucGxheUVmZmVjdChjbGlwMiwgZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhbGxvd0RhbmlGYWxsYmFjayAmJiBuYW1lICE9PSBcIm1fY3BfZGFuaVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDph43opoHkv67mlLnjgJHkuI3lho3pu5jorqQgZmFsbGJhY2sg5YiwIFwi5aSn5L2gXCJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fcGxheVNvdW5kRWZmZWN0KFwibV9jcF9kYW5pXCIsIG51bGwsIGZhbHNlKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2MuYXVkaW9FbmdpbmUucGxheUVmZmVjdChjbGlwLCBmYWxzZSlcbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+UiiDpmo/mnLrmkq3mlL7pn7PmlYhcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBzb3VuZHMgLSDpn7PmlYjlkI3np7DmlbDnu4RcbiAgICAgKi9cbiAgICBfcGxheVJhbmRvbVNvdW5kOiBmdW5jdGlvbihzb3VuZHMpIHtcbiAgICAgICAgaWYgKCFzb3VuZHMgfHwgc291bmRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG4gICAgICAgIHZhciBpbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNvdW5kcy5sZW5ndGgpXG4gICAgICAgIHRoaXMuX3BsYXlTb3VuZEVmZmVjdChzb3VuZHNbaW5kZXhdKVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDmjInpkq7ngrnlh7vkuovku7ZcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIG9uQnV0dG9uQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50LCBjdXN0b21EYXRhKSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBzd2l0Y2goY3VzdG9tRGF0YSkge1xuICAgICAgICAgICAgY2FzZSBcImJ0bl9xaWFuZHpcIjpcbiAgICAgICAgICAgICAgICAvLyDimqDvuI/jgJDlt7LliKDpmaTjgJHmjInpkq7ngrnlh7vpn7PmlYggLSDpn7PmlYjnlLHmnI3liqHnq6/lub/mkq3op6blj5HvvIhfcGxheVJvYlNvdW5k77yJXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2JpZGRpbmdQaGFzZSA9PT0gXCJiaWRkaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGlkZVJvYlVJKClcbiAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LnJlcXVlc3RCaWQodHJ1ZSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oaWRlUm9iVUkoKVxuICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQucmVxdWVzdFJvYlN0YXRlKHFpYW5fc3RhdGUucWlhbilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgY2FzZSBcImJ0bl9idXFpYW5kelwiOlxuICAgICAgICAgICAgICAgIC8vIOKaoO+4j+OAkOW3suWIoOmZpOOAkeaMiemSrueCueWHu+mfs+aViCAtIOmfs+aViOeUseacjeWKoeerr+W5v+aSreinpuWPke+8iF9wbGF5Um9iU291bmTvvIlcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fYmlkZGluZ1BoYXNlID09PSBcImJpZGRpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oaWRlUm9iVUkoKVxuICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQucmVxdWVzdEJpZChmYWxzZSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oaWRlUm9iVUkoKVxuICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQucmVxdWVzdFJvYlN0YXRlKHFpYW5fc3RhdGUuYnVxaWFuZylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGNhc2UgXCJub3B1c2hjYXJkXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RvcFBsYXlDb3VudGRvd24oKVxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlj6rlj5HpgIHkuI3lh7ror7fmsYLvvIzkuI3mnKzlnLDlpITnkIZcbiAgICAgICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQucmVxdWVzdF9idWNodV9jYXJkKFtdLCBudWxsKVxuICAgICAgICAgICAgICAgIHRoaXMucGxheWluZ1VJX25vZGUuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgICBjYXNlIFwidGlwY2FyZFwiOlxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHmj5DnpLrmjInpkq7lip/og71cbiAgICAgICAgICAgICAgICB0aGlzLl9vbkhpbnRCdXR0b25DbGljaygpXG4gICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICAgICAgY2FzZSBcInB1c2hjYXJkXCI6XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2hvb3NlX2NhcmRfZGF0YS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aXBzTGFiZWwuc3RyaW5nID0gXCLor7fpgInmi6nniYwhXCJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnRpcHNMYWJlbC5zdHJpbmcgPSBcIlwiXG4gICAgICAgICAgICAgICAgICAgIH0sIDIwMDApXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ6LCD6K+V5pel5b+X44CR5omT5Y2w6YCJ5Lit55qE54mM77yI5aKe5by654mI77yM5pi+56S654mM5ZCN77yJXG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdGVkQ2FyZE5hbWVzID0gW11cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2hvb3NlX2NhcmRfZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZCA9IHRoaXMuY2hvb3NlX2NhcmRfZGF0YVtpXVxuICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZERhdGEgPSBjYXJkLmNhcmRfZGF0YSB8fCBjYXJkXG4gICAgICAgICAgICAgICAgICAgIHZhciBjYXJkTmFtZSA9IHRoaXMuX2dldENhcmREaXNwbGF5TmFtZShjYXJkRGF0YSlcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRDYXJkTmFtZXMucHVzaChjYXJkTmFtZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeWuouaIt+err+eJjOWei+mqjOivgVxuICAgICAgICAgICAgICAgIHZhciBjYXJkc1RvUGxheSA9IHRoaXMuY2hvb3NlX2NhcmRfZGF0YS5tYXAoZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYy5jYXJkX2RhdGEgfHwgY1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeajgOafpeaYr+WQpuaciemHjeWkjeeahOeJjO+8iOmYsuatoumAieeJjGJ1Z++8iVxuICAgICAgICAgICAgICAgIHZhciB1bmlxdWVDYXJkcyA9IHt9XG4gICAgICAgICAgICAgICAgdmFyIGhhc0R1cGxpY2F0ZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYXJkc1RvUGxheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gY2FyZHNUb1BsYXlbaV0uc3VpdCArIFwiX1wiICsgY2FyZHNUb1BsYXlbaV0ucmFua1xuICAgICAgICAgICAgICAgICAgICBpZiAodW5pcXVlQ2FyZHNba2V5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFzRHVwbGljYXRlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfg48gW3B1c2hjYXJkXSDmo4DmtYvliLDph43lpI3nmoTniYw6XCIsIGNhcmRzVG9QbGF5W2ldKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB1bmlxdWVDYXJkc1trZXldID0gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoaGFzRHVwbGljYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOaciemHjeWkjeeJjO+8jOmHjee9rumAieeJjOeKtuaAgVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRpcHNMYWJlbC5zdHJpbmcgPSBcIumAieeJjOW8guW4uO+8jOivt+mHjeaWsOmAieeJjFwiXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXNldENhcmRGbGFncygpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hvb3NlX2NhcmRfZGF0YSA9IFtdXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnRpcHNMYWJlbC5zdHJpbmcgPSBcIlwiXG4gICAgICAgICAgICAgICAgICAgIH0sIDIwMDApXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgdmFsaWRhdGlvblJlc3VsdCA9IHRoaXMuX3ZhbGlkYXRlSGFuZFR5cGUoY2FyZHNUb1BsYXkpXG4gICAgICAgICAgICAgICAgaWYgKCF2YWxpZGF0aW9uUmVzdWx0LnZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGlwc0xhYmVsLnN0cmluZyA9IHZhbGlkYXRpb25SZXN1bHQubWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYudGlwc0xhYmVsLnN0cmluZyA9IFwiXCJcbiAgICAgICAgICAgICAgICAgICAgfSwgMjAwMClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BQbGF5Q291bnRkb3duKClcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5Y+q5Y+R6YCB5Ye654mM6K+35rGC77yM562J5b6F5pyN5Yqh56uv5bm/5pKt5ZCO5YaN5pu05paw5omL54mMXG4gICAgICAgICAgICAgICAgLy8g5pyN5Yqh56uv5Lya5bm/5pKtIGNhcmRfcGxheWVkIOa2iOaBr++8jOeUsSBvbk90aGVyUGxheWVyQ2h1Q2FyZCDlpITnkIZcbiAgICAgICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQucmVxdWVzdF9jaHVfY2FyZCh0aGlzLmNob29zZV9jYXJkX2RhdGEsIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5pS56L+b44CR5Ye654mM5aSx6LSl77yM5pi+56S65pu06K+m57uG55qE6ZSZ6K+v5L+h5oGvXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXJyb3JNc2cgPSAoZGF0YSAmJiBkYXRhLm1zZykgfHwgXCLlh7rniYzlpLHotKVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDojrflj5bnlKjmiLfpgInkuK3nmoTniYzlnotcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3RlZFR5cGUgPSB2YWxpZGF0aW9uUmVzdWx0LnR5cGUgfHwgXCLmnKrnn6XniYzlnotcIlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGVjdGVkQ291bnQgPSBzZWxmLmNob29zZV9jYXJkX2RhdGEubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOiOt+WPluS4iuWutueahOeJjOWei+S/oeaBr1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RQbGF5ZWRUeXBlID0gc2VsZi5fbGFzdFBsYXllZEhhbmRUeXBlIHx8IFwi5pyq55+lXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0UGxheWVkQ291bnQgPSBzZWxmLl9sYXN0UGxheWVkQ2FyZHMgPyBzZWxmLl9sYXN0UGxheWVkQ2FyZHMubGVuZ3RoIDogMFxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR6I635Y+W5LiK5a625Ye655qE54mM5ZCNXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFBsYXllZENhcmROYW1lcyA9IFwiXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLl9sYXN0UGxheWVkQ2FyZHMgJiYgc2VsZi5fbGFzdFBsYXllZENhcmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZXMgPSBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZi5fbGFzdFBsYXllZENhcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWVzLnB1c2goc2VsZi5fZ2V0Q2FyZERpc3BsYXlOYW1lKHNlbGYuX2xhc3RQbGF5ZWRDYXJkc1tpXSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RQbGF5ZWRDYXJkTmFtZXMgPSBuYW1lcy5qb2luKFwiLFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmnoTlu7ror6bnu4bnmoTplJnor6/mj5DnpLpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkZXRhaWxNc2cgPSBlcnJvck1zZ1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yTXNnLmluZGV4T2YoXCLlpKfkuI3ov4dcIikgPj0gMCB8fCBlcnJvck1zZy5pbmRleE9mKFwi5omT5LiN6L+HXCIpID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5aKe5by644CR5pi+56S655So5oi36YCJ55qE54mM5ZCNXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHlvdXJDYXJkcyA9IHNlbGVjdGVkQ2FyZE5hbWVzLmpvaW4oXCIsXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g54mM5Z6L5LiN5Yy56YWN5oiW54mM5aSq5bCPXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkQ291bnQgIT09IGxhc3RQbGF5ZWRDb3VudCAmJiBsYXN0UGxheWVkQ291bnQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbE1zZyA9IFwi54mM5pWw5LiN5Yy56YWN77yB5LiK5a625Ye6XCIgKyBsYXN0UGxheWVkVHlwZSArIFwi77yM5L2g6YCJ5LqGXCIgKyB5b3VyQ2FyZHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNlbGVjdGVkVHlwZSAhPT0gbGFzdFBsYXllZFR5cGUgJiYgbGFzdFBsYXllZFR5cGUgIT09IFwi54K45by5XCIgJiYgbGFzdFBsYXllZFR5cGUgIT09IFwi546L54K4XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsTXNnID0gXCLniYzlnovkuI3ljLnphY3vvIHkuIrlrrblh7pcIiArIGxhc3RQbGF5ZWRUeXBlICsgXCLvvIzkvaDpgInkuoZcIiArIHlvdXJDYXJkc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDlop7lvLrjgJHmmL7npLrlhbfkvZPnmoTniYzlkI3mr5TovoNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RQbGF5ZWRDYXJkTmFtZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbE1zZyA9IFwi5omT5LiN6L+H77yB5LiK5a625Ye6XCIgKyBsYXN0UGxheWVkQ2FyZE5hbWVzICsgXCLvvIzkvaDpgInkuoZcIiArIHlvdXJDYXJkc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsTXNnID0gXCLniYzlpKrlsI/vvIHkvaDpgInkuoZcIiArIHlvdXJDYXJkcyArIFwi5omT5LiN6L+H5LiK5a62XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi50aXBzTGFiZWwuc3RyaW5nID0gZGV0YWlsTXNnXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYudGlwc0xhYmVsLnN0cmluZyA9IFwiXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDMwMDApICAvLyDlu7bplb/mmL7npLrml7bpl7TliLAz56eSXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9yZXNldENhcmRGbGFncygpXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNob29zZV9jYXJkX2RhdGEgPSBbXVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeWHuueJjOaIkOWKn++8jOS4jeWcqOi/memHjOWIoOmZpOaJi+eJjO+8gVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g562J5b6F5pyN5Yqh56uv5bm/5pKtIGNhcmRfcGxheWVkIOa2iOaBr++8jOeUsSBvbk90aGVyUGxheWVyQ2h1Q2FyZCDlpITnkIZcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucGxheWluZ1VJX25vZGUuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOa4heepuumAieS4reeahOeJjFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jaG9vc2VfY2FyZF9kYXRhID0gW11cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgX3Jlc2V0Q2FyZEZsYWdzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeWPqumHjee9ruaJi+eJjOWuueWZqOS4reeahOeJjOiKgueCuVxuICAgICAgICB2YXIgY2FyZFBhcmVudCA9IHRoaXMuY2FyZHNfbm9kZVxuICAgICAgICBpZiAoIWNhcmRQYXJlbnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCfjq4gW19yZXNldENhcmRGbGFnc10gY2FyZHNfbm9kZSDmnKrlrprkuYnvvIzlsJ3or5Xmn6Xmib7miYvniYzlrrnlmahcIilcbiAgICAgICAgICAgIC8vIOWwneivlemAmui/h+iKgueCueWQjeensOafpeaJvlxuICAgICAgICAgICAgdmFyIGdhbWVTY2VuZU5vZGUgPSB0aGlzLm5vZGUucGFyZW50XG4gICAgICAgICAgICBpZiAoZ2FtZVNjZW5lTm9kZSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2FtZVNjZW5lTm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBnYW1lU2NlbmVOb2RlLmNoaWxkcmVuW2ldXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5uYW1lID09PSBcImNhcmRzX25vZGVcIiB8fCBjaGlsZC5uYW1lID09PSBcImNhcmRzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRQYXJlbnQgPSBjaGlsZFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jYXJkc19ub2RlID0gY2hpbGRcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDph43nva7miYDmnInniYznmoTpgInkuK3nirbmgIFcbiAgICAgICAgaWYgKGNhcmRQYXJlbnQpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGNhcmRQYXJlbnQuY2hpbGRyZW5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlbltpXS5lbWl0KFwicmVzZXRfY2FyZF9mbGFnXCIpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+OriBbX3Jlc2V0Q2FyZEZsYWdzXSDmib7kuI3liLDmiYvniYzlrrnlmahcIilcbiAgICAgICAgfVxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5riF56m66YCJ54mM5ZCO5pu05paw5pi+56S6XG4gICAgICAgIHRoaXMuX3VwZGF0ZVNlbGVjdGVkQ291bnREaXNwbGF5KClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeabtOaWsOW3sumAieeJjOaVsOaYvuekulxuICAgICAqIOKaoO+4j+OAkOS/ruWkjeOAkeeUqOaIt+imgeaxguivpeS9jee9ruS4jeaYvuekuuS7u+S9leaWh+Wtl++8jOW3suemgeeUqCB0aXBzTGFiZWwg5pi+56S6XG4gICAgICog5LuF5Zyo5o6n5Yi25Y+w6L6T5Ye65pel5b+X55So5LqO6LCD6K+VXG4gICAgICovXG4gICAgX3VwZGF0ZVNlbGVjdGVkQ291bnREaXNwbGF5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNvdW50ID0gdGhpcy5jaG9vc2VfY2FyZF9kYXRhLmxlbmd0aFxuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5rKh5pyJ6YCJ5Lit54mM77yM55u05o6l6L+U5ZueXG4gICAgICAgIGlmIChjb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPlumAieS4reeahOeJjOaVsOaNrlxuICAgICAgICB2YXIgY2FyZHNUb1BsYXkgPSB0aGlzLmNob29zZV9jYXJkX2RhdGEubWFwKGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgIHJldHVybiBjLmNhcmRfZGF0YSB8fCBjXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICAvLyDpqozor4HniYzlnotcbiAgICAgICAgdmFyIHZhbGlkYXRpb25SZXN1bHQgPSB0aGlzLl92YWxpZGF0ZUhhbmRUeXBlKGNhcmRzVG9QbGF5KVxuICAgICAgICBcbiAgICAgICAgLy8g5p6E5bu65pi+56S65paH5pys77yI5LuF55So5LqO5pel5b+X77yJXG4gICAgICAgIHZhciBkaXNwbGF5VGV4dCA9IFwi5bey6YCJIFwiICsgY291bnQgKyBcIiDlvKBcIlxuICAgICAgICBpZiAodmFsaWRhdGlvblJlc3VsdC52YWxpZCkge1xuICAgICAgICAgICAgZGlzcGxheVRleHQgKz0gXCIgLSBcIiArIHZhbGlkYXRpb25SZXN1bHQudHlwZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGlzcGxheVRleHQgKz0gXCIgLSBcIiArIHZhbGlkYXRpb25SZXN1bHQubWVzc2FnZVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDimqDvuI/jgJDnpoHnlKjjgJHkuI3lho3lnKggdGlwc0xhYmVsIOS4iuaYvuekuuaWh+Wtl1xuICAgICAgICAvLyDku4XovpPlh7rmjqfliLblj7Dml6Xlv5fnlKjkuo7osIPor5VcbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g5Ye654mM55u45YWzXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOW3suW6n+W8g+OAkeWcsOS4u+iOt+W+l+W6leeJjOWQjua3u+WKoOWIsOaJi+eJjFxuICAgICAqIOKaoO+4j+OAkOmHjeimgeOAkeatpOWHveaVsOW3suW6n+W8g++8jOS4jeWGjeS9v+eUqO+8gVxuICAgICAqIOWcsOS4u+aJi+eJjOabtOaWsOeUsSBvbkxhbmRsb3JkQ2FyZHMg5aSE55CG77yM6YCa6L+H5pyN5Yqh56uvIGxhbmRsb3JkX2NhcmRzIOa2iOaBr1xuICAgICAqIOS/neeVmeatpOWHveaVsOS7heeUqOS6juWFvOWuue+8jOS4jeS8muinpuWPkemHjeaWsOWPkeeJjOWKqOeUu1xuICAgICAqL1xuICAgIHB1c2hUaHJlZUNhcmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5LiN5YaN5omn6KGM5Lu75L2V5pON5L2c77yBXG4gICAgICAgIC8vIOW6leeJjOW3sumAmui/hyBsYW5kbG9yZF9jYXJkcyDmtojmga/nlLHmnI3liqHnq6/nm7TmjqXmm7TmlrDlnLDkuLvmiYvniYxcbiAgICAgICAgLy8g5q2k5Ye95pWw5L+d55WZ5LuF5Li65YW85a655pen5Luj56CB5byV55SoXG4gICAgICAgIHJldHVyblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5LuO5omL54mM5Lit5Yig6Zmk5bey5Ye655qE54mM77yI5pyN5Yqh56uv6amx5Yqo77yJXG4gICAgICogQHBhcmFtIHtBcnJheX0gY2FyZHMgLSDmnI3liqHnq6/ov5Tlm57nmoTlt7Llh7rniYzmlbDmja4gW3tzdWl0LCByYW5rfSwgLi4uXVxuICAgICAqL1xuICAgIF9yZW1vdmVDYXJkc0Zyb21IYW5kOiBmdW5jdGlvbihjYXJkcykge1xuICAgICAgICBpZiAoIWNhcmRzIHx8IGNhcmRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cblxuICAgICAgICAvLyDpgY3ljobopoHliKDpmaTnmoTniYxcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYXJkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNhcmRUb1JlbW92ZSA9IGNhcmRzW2ldXG4gICAgICAgICAgICAvLyDlnKjmiYvniYzkuK3mn6Xmib7lubbliKDpmaRcbiAgICAgICAgICAgIGZvciAodmFyIGogPSB0aGlzLmhhbmRDYXJkcy5sZW5ndGggLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhbmRDYXJkc1tqXS5yYW5rID09PSBjYXJkVG9SZW1vdmUucmFuayAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRDYXJkc1tqXS5zdWl0ID09PSBjYXJkVG9SZW1vdmUuc3VpdCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRDYXJkcy5zcGxpY2UoaiwgMSlcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkea4heepuumAieS4reeahOeJjOaVsOaNru+8jOmYsuatouaui+eVmVxuICAgICAgICB0aGlzLmNob29zZV9jYXJkX2RhdGEgPSBbXVxuXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkvb/nlKjpnZnpu5jmm7TmlrDvvIzkuI3op6blj5Hlj5HniYzliqjnlLtcbiAgICAgICAgdGhpcy5fdXBkYXRlSGFuZENhcmRzU2lsZW50KHRoaXMuaGFuZENhcmRzKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkemdmem7mOabtOaWsOaJi+eJjO+8iOS4jeinpuWPkeWPkeeJjOWKqOeUu++8iVxuICAgICAqIOeUqOS6juWHuueJjOWQjuabtOaWsOaJi+eJjOaYvuekulxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGNhcmRzIC0g5omL54mM5pWw5o2uXG4gICAgICovXG4gICAgX3VwZGF0ZUhhbmRDYXJkc1NpbGVudDogZnVuY3Rpb24oY2FyZHMpIHtcbiAgICAgICAgaWYgKCFjYXJkcykgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgLy8g5o6S5bqP5omL54mMXG4gICAgICAgIHZhciBzb3J0ZWRDYXJkcyA9IHRoaXMuX3NvcnRDYXJkcyhjYXJkcylcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlj6rkvb/nlKhjYXJkc19ub2Rl77yM5LiN6YGN5Y6Gbm9kZS5wYXJlbnRcbiAgICAgICAgdmFyIGNhcmRzUGFyZW50ID0gdGhpcy5jYXJkc19ub2RlXG4gICAgICAgIGlmICghY2FyZHNQYXJlbnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn46uIFtfdXBkYXRlSGFuZENhcmRzU2lsZW50XSBjYXJkc19ub2RlIOacquWumuS5iVwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHlhYjplIDmr4HmiYDmnInml6fmiYvniYzoioLngrnvvIznoa7kv53kuovku7bnm5HlkKzlmajooqvmuIXnkIZcbiAgICAgICAgdmFyIG9sZENoaWxkcmVuID0gY2FyZHNQYXJlbnQuY2hpbGRyZW5cbiAgICAgICAgZm9yICh2YXIgaSA9IG9sZENoaWxkcmVuLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBvbGRDaGlsZHJlbltpXVxuICAgICAgICAgICAgLy8g5YWI5Y+W5raI5omA5pyJ5LqL5Lu255uR5ZCsXG4gICAgICAgICAgICBjaGlsZC5vZmYoY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfU1RBUlQpXG4gICAgICAgICAgICAvLyDlho3plIDmr4HoioLngrlcbiAgICAgICAgICAgIGNoaWxkLmRlc3Ryb3koKVxuICAgICAgICB9XG4gICAgICAgIC8vIOWGjeasoeehruS/nea4heepulxuICAgICAgICBjYXJkc1BhcmVudC5yZW1vdmVBbGxDaGlsZHJlbigpXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5riF56m66YCJ5Lit55qE54mM5pWw5o2u77yM6Ziy5q2i5q6L55WZXG4gICAgICAgIHRoaXMuY2hvb3NlX2NhcmRfZGF0YSA9IFtdXG4gICAgICAgIFxuICAgICAgICAvLyDph43mlrDliJvlu7rmiYvniYzoioLngrnvvIjml6DliqjnlLvvvIlcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzb3J0ZWRDYXJkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNhcmREYXRhID0gc29ydGVkQ2FyZHNbaV1cbiAgICAgICAgICAgIHZhciB0YXJnZXRYID0gdGhpcy5fZ2V0Q2FyZFgoaSwgc29ydGVkQ2FyZHMubGVuZ3RoLCBDYXJkTGF5b3V0LmNhcmRTcGFjaW5nKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgY2FyZCA9IGNjLmluc3RhbnRpYXRlKHRoaXMuY2FyZF9wcmVmYWIpXG4gICAgICAgICAgICBpZiAoIWNhcmQpIGNvbnRpbnVlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNhcmQuc2NhbGUgPSBDYXJkTGF5b3V0LmNhcmRTY2FsZVxuICAgICAgICAgICAgY2FyZC5wYXJlbnQgPSBjYXJkc1BhcmVudFxuICAgICAgICAgICAgY2FyZC5zZXRQb3NpdGlvbih0YXJnZXRYLCBDYXJkTGF5b3V0LmNhcmRZKVxuICAgICAgICAgICAgY2FyZC5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICBjYXJkLnpJbmRleCA9IGlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGNhcmRDb21wID0gY2FyZC5nZXRDb21wb25lbnQoXCJjYXJkXCIpXG4gICAgICAgICAgICBpZiAoY2FyZENvbXApIHtcbiAgICAgICAgICAgICAgICBjYXJkQ29tcC5zaG93Q2FyZHMoY2FyZERhdGEsIG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDph43nva7muLLmn5Plk4jluIzvvIzlhYHorrjlkI7nu63muLLmn5NcbiAgICAgICAgdGhpcy5fbGFzdFJlbmRlckhhc2ggPSBKU09OLnN0cmluZ2lmeShjYXJkcylcbiAgICAgICAgXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOKaoO+4j+OAkOW3suW6n+W8g+OAkeaXp+eJiOWIoOmZpOaJi+eJjOaWueazlVxuICAgICAqIOS/neeVmeS7heS4uuWFvOWuue+8jOaWsOS7o+eggeW6lOS9v+eUqCBfcmVtb3ZlQ2FyZHNGcm9tSGFuZFxuICAgICAqL1xuICAgIGRlc3RvcnlDYXJkOiBmdW5jdGlvbihhY2NvdW50aWQsIGNob29zZV9jYXJkKSB7XG4gICAgICAgIGlmIChjaG9vc2VfY2FyZC5sZW5ndGggPT09IDApIHJldHVyblxuICAgICAgICBcbiAgICAgICAgdmFyIGRlc3Ryb3lfY2FyZCA9IFtdXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hvb3NlX2NhcmQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSB0aGlzLmhhbmRDYXJkcy5sZW5ndGggLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhbmRDYXJkc1tqXS5yYW5rID09PSBjaG9vc2VfY2FyZFtpXS5jYXJkX2RhdGEucmFuayAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRDYXJkc1tqXS5zdWl0ID09PSBjaG9vc2VfY2FyZFtpXS5jYXJkX2RhdGEuc3VpdCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDku47miYvniYzmlbDmja7kuK3liKDpmaRcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kQ2FyZHMuc3BsaWNlKGosIDEpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDph43mlrDmuLLmn5NcbiAgICAgICAgdGhpcy5yZW5kZXJDYXJkcyh0aGlzLmhhbmRDYXJkcylcbiAgICAgICAgXG4gICAgICAgIC8vIOaYvuekuuWHuueahOeJjFxuICAgICAgICBpZiAodGhpcy5jYXJkc19ub2RlICYmIHRoaXMuY2FyZHNfbm9kZS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgb3V0Q2FyZF9ub2RlID0gdGhpcy5fZ2V0T3V0Q2FyZE5vZGUoYWNjb3VudGlkKVxuICAgICAgICAgICAgaWYgKG91dENhcmRfbm9kZSkge1xuICAgICAgICAgICAgICAgIC8vIOaJvuWIsOW3sumAieS4reeahOeJjOiKgueCuVxuICAgICAgICAgICAgICAgIHZhciBzZWxlY3RlZE5vZGVzID0gW11cbiAgICAgICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmNhcmRzX25vZGUuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYXJkQ29tcCA9IGNoaWxkcmVuW2ldLmdldENvbXBvbmVudChcImNhcmRcIilcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhcmRDb21wICYmIGNhcmRDb21wLmZsYWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkTm9kZXMucHVzaChjaGlsZHJlbltpXSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnNob3dPdXRDYXJkcyhvdXRDYXJkX25vZGUsIHNlbGVjdGVkTm9kZXMpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIF9nZXRPdXRDYXJkTm9kZTogZnVuY3Rpb24oYWNjb3VudGlkKSB7XG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmo4Dmn6Ugbm9kZS5wYXJlbnQg5piv5ZCm5a2Y5ZyoXG4gICAgICAgIGlmICghdGhpcy5ub2RlIHx8ICF0aGlzLm5vZGUuaXNWYWxpZCB8fCAhdGhpcy5ub2RlLnBhcmVudCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+DjyBbX2dldE91dENhcmROb2RlXSBub2RlIOaIliBub2RlLnBhcmVudCDmnKrlrprkuYnmiJblt7LplIDmr4FcIilcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgdmFyIGdhbWVTY2VuZV9zY3JpcHQgPSB0aGlzLm5vZGUucGFyZW50LmdldENvbXBvbmVudChcImdhbWVTY2VuZVwiKVxuICAgICAgICByZXR1cm4gZ2FtZVNjZW5lX3NjcmlwdCA/IGdhbWVTY2VuZV9zY3JpcHQuZ2V0VXNlck91dENhcmRQb3NCeUFjY291bnQoYWNjb3VudGlkKSA6IG51bGxcbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g5o+Q56S65oyJ6ZKu5Yqf6IO9XG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5L+u5pS544CR5o+Q56S65oyJ6ZKu54K55Ye75aSE55CGIC0g5pS55Li66K+35rGC5pyN5Yqh56uv5o+Q56S6XG4gICAgICog5L2/55So5LqL5Lu255uR5ZCs5pa55byP5aSE55CG5ZON5bqU77yM5LiN5L2/55So5Zue6LCD77yI5Zug5Li65pyN5Yqh56uv5LiN6L+U5ZueY2FsbEluZGV477yJXG4gICAgICovXG4gICAgX29uSGludEJ1dHRvbkNsaWNrOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAvLyDph43nva7pgInkuK3nmoTniYxcbiAgICAgICAgdGhpcy5fcmVzZXRDYXJkRmxhZ3MoKVxuICAgICAgICB0aGlzLmNob29zZV9jYXJkX2RhdGEgPSBbXVxuXG4gICAgICAgIC8vIOivt+axguacjeWKoeerr+aPkOekuu+8iOS4jeS9v+eUqOWbnuiwg++8jOS+nei1luS6i+S7tuebkeWQrOWZqOWkhOeQhuWTjeW6lO+8iVxuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKG15Z2xvYmFsICYmIG15Z2xvYmFsLnNvY2tldCkge1xuICAgICAgICAgICAgLy8g55u05o6l5Y+R6YCB5raI5oGv77yM5ZON5bqU5bCG6YCa6L+HIG9uSGludFJlc3VsdCDkuovku7bnm5HlkKzlmajlpITnkIZcbiAgICAgICAgICAgIG15Z2xvYmFsLnNvY2tldC5zZW5kSGludFJlcXVlc3QoKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHlpITnkIbmnI3liqHnq6/ov5Tlm57nmoTmj5DnpLrnu5PmnpxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIOacjeWKoeerr+i/lOWbnueahOaPkOekuuaVsOaNrlxuICAgICAqICAgLSBjYXJkczog5o+Q56S655qE54mM5pWw57uEIFt7c3VpdCwgcmFua30sIC4uLl1cbiAgICAgKiAgIC0gaW5kZXg6IOW9k+WJjeaPkOekuue0ouW8le+8iOS7jjDlvIDlp4vvvIlcbiAgICAgKiAgIC0gdG90YWw6IOaAu+WFseacieWkmuWwkeenjeaPkOekulxuICAgICAqL1xuICAgIF9vbkhpbnRSZXN1bHQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgXG4gICAgICAgIGlmICghZGF0YSB8fCAhZGF0YS5jYXJkcyB8fCBkYXRhLmNhcmRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeayoeacieiDvei/h+eahOeJjOaXtueri+WNs+aPkOekuuS4jeWHuu+8jOS4jeWGjeetieW+hTEtMuenklxuICAgICAgICAgICAgLy8gdGhpcy50aXBzTGFiZWwuc3RyaW5nID0gXCLmsqHmnInlj6/lh7rnmoTniYxcIlxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOeri+WNs+iHquWKqOS4jeWHuu+8jOS4jeWGjeW7tui/n1xuICAgICAgICAgICAgc2VsZi5fc3RvcFBsYXlDb3VudGRvd24oKVxuICAgICAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgICAgICBpZiAobXlnbG9iYWwgJiYgbXlnbG9iYWwuc29ja2V0KSB7XG4gICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LnJlcXVlc3RfYnVjaHVfY2FyZChbXSwgbnVsbClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzZWxmLnBsYXlpbmdVSV9ub2RlKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5wbGF5aW5nVUlfbm9kZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyAxLjXnp5LlkI7muIXnqbrmj5DnpLrmloflrZdcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi50aXBzTGFiZWwuc3RyaW5nID0gXCJcIlxuICAgICAgICAgICAgfSwgMTUwMClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDpgInkuK3mj5DnpLrnmoTniYxcbiAgICAgICAgdGhpcy5fc2VsZWN0Q2FyZHMoZGF0YS5jYXJkcylcblxuICAgICAgICAvLyDwn5Sn44CQ5L+u5pS544CR5Y675o6J5qGM6Z2i5LiK55qE55m96Imy5paH5a2X5o+Q56S6XG4gICAgICAgIC8vIOS4jeWGjeaYvuekuiBcIuaPkOekujogWOW8oOeJjFwiIOS/oeaBr1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5omY566h44CR5aSE55CG5omY566h54q25oCB5Y+Y5YyW6YCa55+lXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSDmiZjnrqHnirbmgIHmlbDmja5cbiAgICAgKiAgIC0gcGxheWVyX2lkOiDnjqnlrrZJRFxuICAgICAqICAgLSBwbGF5ZXJfbmFtZTog546p5a625ZCN5a2XXG4gICAgICogICAtIGlzX3RydXN0ZWU6IOaYr+WQpuaJmOeuoVxuICAgICAqICAgLSByZWFzb246IOWOn+WboCAodGltZW91dC9kaXNjb25uZWN0L3JlY29ubmVjdClcbiAgICAgKi9cbiAgICBfb25UcnVzdGVlU3RhdGVOb3RpZnk6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIGlmICghbXlnbG9iYWwpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+W5b2T5YmN546p5a62SURcbiAgICAgICAgdmFyIG15UGxheWVySWQgPSBteWdsb2JhbC5zb2NrZXQuZ2V0UGxheWVySW5mbygpLmlkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEuc2VydmVyUGxheWVySWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SURcbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOacrOWcsOaJmOeuoeeKtuaAge+8iOS7heW9k+aYr+iHquW3seaXtu+8iVxuICAgICAgICBpZiAoU3RyaW5nKGRhdGEucGxheWVyX2lkKSA9PT0gU3RyaW5nKG15UGxheWVySWQpKSB7XG4gICAgICAgICAgICB0aGlzLl9pc0xvY2FsVHJ1c3RlZSA9IGRhdGEuaXNfdHJ1c3RlZVxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn46uIFvmiZjnrqFdIOacrOWcsOaJmOeuoeeKtuaAgeabtOaWsDpcIiwgZGF0YS5pc190cnVzdGVlLCBcIuWOn+WboDpcIiwgZGF0YS5yZWFzb24pXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmAmuefpeaJgOacieeOqeWutuiKgueCueabtOaWsOaJmOeuoeeKtuaAgVxuICAgICAgICBpZiAodGhpcy5ub2RlICYmIHRoaXMubm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZS5wYXJlbnQuZW1pdChcInRydXN0ZWVfc3RhdGVfdXBkYXRlXCIsIGRhdGEpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g8J+Up+OAkOaWsOWinuOAkeeUqOaIt+a0u+WKqOebkeWQrCAtIOWPlua2iOacuuWZqOS6uuaJmOeuoVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICog6K6+572u55So5oi35rS75Yqo55uR5ZCs5ZmoXG4gICAgICog5b2T5qOA5rWL5Yiw55So5oi35rS75Yqo77yI6byg5qCH56e75YqoL+eCueWHuy/op6bmkbjvvInml7bvvIzlj5HpgIHlj5bmtojmiZjnrqHor7fmsYJcbiAgICAgKi9cbiAgICBfc2V0dXBVc2VyQWN0aXZpdHlMaXN0ZW5lcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICBcbiAgICAgICAgLy8g55uR5ZCs6byg5qCH56e75Yqo5LqL5Lu277yI5YWo5bGA77yJXG4gICAgICAgIGNjLnN5c3RlbUV2ZW50Lm9uKGNjLlN5c3RlbUV2ZW50LkV2ZW50VHlwZS5NT1VTRV9NT1ZFLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgc2VsZi5fb25Vc2VyQWN0aXZpdHkoXCJtb3VzZV9tb3ZlXCIpXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICAvLyDnm5HlkKzpvKDmoIfngrnlh7vkuovku7bvvIjlhajlsYDvvIlcbiAgICAgICAgY2Muc3lzdGVtRXZlbnQub24oY2MuU3lzdGVtRXZlbnQuRXZlbnRUeXBlLk1PVVNFX0RPV04sIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBzZWxmLl9vblVzZXJBY3Rpdml0eShcIm1vdXNlX2Rvd25cIilcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIOebkeWQrOinpuaRuOW8gOWni+S6i+S7tu+8iOenu+WKqOerr++8iVxuICAgICAgICBjYy5zeXN0ZW1FdmVudC5vbihjYy5TeXN0ZW1FdmVudC5FdmVudFR5cGUuVE9VQ0hfU1RBUlQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBzZWxmLl9vblVzZXJBY3Rpdml0eShcInRvdWNoX3N0YXJ0XCIpXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICAvLyDnm5HlkKzop6bmkbjnp7vliqjkuovku7bvvIjnp7vliqjnq6/vvIlcbiAgICAgICAgY2Muc3lzdGVtRXZlbnQub24oY2MuU3lzdGVtRXZlbnQuRXZlbnRUeXBlLlRPVUNIX01PVkUsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBzZWxmLl9vblVzZXJBY3Rpdml0eShcInRvdWNoX21vdmVcIilcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+OriBb55So5oi35rS75YqoXSDlt7Lms6jlhozlhajlsYDmtLvliqjnm5HlkKzlmahcIilcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog5aSE55CG55So5oi35rS75YqoXG4gICAgICog5aaC5p6c546p5a625aSE5LqO5omY566h54q25oCB77yM5Y+R6YCB5Y+W5raI5omY566h6K+35rGCXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGFjdGl2aXR5VHlwZSAtIOa0u+WKqOexu+Wei1xuICAgICAqL1xuICAgIF9vblVzZXJBY3Rpdml0eTogZnVuY3Rpb24oYWN0aXZpdHlUeXBlKSB7XG4gICAgICAgIC8vIOWPquWcqOaJmOeuoeeKtuaAgeS4i+WkhOeQhlxuICAgICAgICBpZiAoIXRoaXMuX2lzTG9jYWxUcnVzdGVlKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6Ziy5oqW77ya6ZmQ5Yi25Y+R6YCB6aKR546HXG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpXG4gICAgICAgIGlmIChub3cgLSB0aGlzLl9sYXN0QWN0aXZpdHlUaW1lIDwgdGhpcy5fYWN0aXZpdHlUaHJvdHRsZU1zKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9sYXN0QWN0aXZpdHlUaW1lID0gbm93XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCfjq4gW+eUqOaIt+a0u+WKqF0g5qOA5rWL5Yiw55So5oi35rS75YqoOlwiLCBhY3Rpdml0eVR5cGUsIFwi5Y+R6YCB5Y+W5raI5omY566h6K+35rGCXCIpXG4gICAgICAgIFxuICAgICAgICAvLyDlj5HpgIHlj5bmtojmiZjnrqHor7fmsYJcbiAgICAgICAgdGhpcy5fc2VuZENhbmNlbFRydXN0ZWUoKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDlj5HpgIHlj5bmtojmiZjnrqHor7fmsYLliLDmnI3liqHnq69cbiAgICAgKi9cbiAgICBfc2VuZENhbmNlbFRydXN0ZWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCB8fCAhbXlnbG9iYWwuc29ja2V0KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn46uIFvlj5bmtojmiZjnrqFdIHNvY2tldCDmnKrliJ3lp4vljJZcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmo4Dmn6XmmK/lkKbmnInlr7nlupTnmoTlj5HpgIHmlrnms5VcbiAgICAgICAgaWYgKG15Z2xvYmFsLnNvY2tldC5jYW5jZWxUcnVzdGVlKSB7XG4gICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQuY2FuY2VsVHJ1c3RlZSgpXG4gICAgICAgIH0gZWxzZSBpZiAobXlnbG9iYWwuc29ja2V0LnNlbmQpIHtcbiAgICAgICAgICAgIC8vIOebtOaOpeWPkemAgea2iOaBr1xuICAgICAgICAgICAgdmFyIG1zZyA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImNhbmNlbF90cnVzdGVlXCIsXG4gICAgICAgICAgICAgICAgcGF5bG9hZDoge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG15Z2xvYmFsLnNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KG1zZykpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn46uIFvlj5bmtojmiZjnrqFdIOaXoOazleWPkemAgeWPlua2iOaJmOeuoeivt+axglwiKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDnq4vljbPmm7TmlrDmnKzlnLDnirbmgIHvvIzpgb/lhY3ph43lpI3lj5HpgIFcbiAgICAgICAgdGhpcy5faXNMb2NhbFRydXN0ZWUgPSBmYWxzZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDmn6Xmib7lj6/ku6Xlh7rnmoTniYzvvIjmnKzlnLBmYWxsYmFja++8iVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGxhc3RTZWxlY3RlZCAtIOS4iuasoemAieS4reeahOeJjO+8iOeUqOS6juaJvuS4i+S4gOe7hO+8iVxuICAgICAqIEByZXR1cm5zIHtBcnJheX0g5Y+v5Lul5Ye655qE54mMXG4gICAgICovXG4gICAgX2ZpbmRQbGF5YWJsZUNhcmRzOiBmdW5jdGlvbihsYXN0U2VsZWN0ZWQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIFxuICAgICAgICAvLyDlpoLmnpzmsqHmnInmiYvniYzvvIzkuI3lpITnkIZcbiAgICAgICAgaWYgKCF0aGlzLmhhbmRDYXJkcyB8fCB0aGlzLmhhbmRDYXJkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOe7n+iuoeaJi+eJjFxuICAgICAgICB2YXIgY2FyZENvdW50cyA9IHt9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5oYW5kQ2FyZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gdGhpcy5oYW5kQ2FyZHNbaV0ucmFua1xuICAgICAgICAgICAgaWYgKCFjYXJkQ291bnRzW3JhbmtdKSB7XG4gICAgICAgICAgICAgICAgY2FyZENvdW50c1tyYW5rXSA9IFtdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXJkQ291bnRzW3JhbmtdLnB1c2godGhpcy5oYW5kQ2FyZHNbaV0pXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenOaYr+aWsOS4gOi9ru+8iOW/hemhu+WHuueJjO+8iVxuICAgICAgICBpZiAodGhpcy5fbXVzdFBsYXkgfHwgIXRoaXMuX2xhc3RQbGF5ZWRDYXJkcyB8fCB0aGlzLl9sYXN0UGxheWVkQ2FyZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZmluZFNtYWxsZXN0Q2FyZHMoY2FyZENvdW50cylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5LiN6IO95omT6L+H77yM5LiN5o+Q56S6XG4gICAgICAgIGlmICghdGhpcy5fY2FuQmVhdCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+W5LiK5a6254mM5Z6L5L+h5oGvXG4gICAgICAgIHZhciBsYXN0VHlwZSA9IHRoaXMuX2xhc3RQbGF5ZWRIYW5kVHlwZSB8fCBcIlwiXG4gICAgICAgIHZhciBsYXN0UmFuayA9IHRoaXMuX2dldExhc3RQbGF5ZWRNYWluUmFuaygpXG4gICAgICAgIHZhciBsYXN0Q291bnQgPSB0aGlzLl9sYXN0UGxheWVkQ2FyZHMubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICAvLyDmoLnmja7niYzlnovmn6Xmib7og73miZPov4fnmoTmnIDlsI/niYxcbiAgICAgICAgc3dpdGNoIChsYXN0VHlwZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICBjYXNlIFwic2luZ2xlXCI6IGNhc2UgXCJzb2xvXCI6IGNhc2UgXCLljZXlvKBcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZmluZEJlYXRpbmdTaW5nbGUoY2FyZENvdW50cywgbGFzdFJhbmspXG4gICAgICAgICAgICBjYXNlIFwicGFpclwiOiBjYXNlIFwiZG91YmxlXCI6IGNhc2UgXCLlr7nlrZBcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZmluZEJlYXRpbmdQYWlyKGNhcmRDb3VudHMsIGxhc3RSYW5rKVxuICAgICAgICAgICAgY2FzZSBcInRyaXBsZVwiOiBjYXNlIFwidGhyZWVcIjogY2FzZSBcIuS4ieW8oFwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ1RyaXBsZShjYXJkQ291bnRzLCBsYXN0UmFuaywgMClcbiAgICAgICAgICAgIGNhc2UgXCJ0cmlwbGV3aXRoc2luZ2xlXCI6IGNhc2UgXCJzYW5kYWl5aVwiOiBjYXNlIFwi5LiJ5bim5LiAXCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRCZWF0aW5nVHJpcGxlKGNhcmRDb3VudHMsIGxhc3RSYW5rLCAxKVxuICAgICAgICAgICAgY2FzZSBcInRyaXBsZXdpdGhwYWlyXCI6IGNhc2UgXCJzYW5kYWlkdWlcIjogY2FzZSBcIuS4ieW4puS6jFwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ1RyaXBsZShjYXJkQ291bnRzLCBsYXN0UmFuaywgMilcbiAgICAgICAgICAgIGNhc2UgXCJib21iXCI6IGNhc2UgXCJ6aGFkYW5cIjogY2FzZSBcIueCuOW8uVwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ0JvbWIoY2FyZENvdW50cywgbGFzdFJhbmspXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIC8vIOacquefpeeJjOWei++8jOWwneivleaMieW8oOaVsOWkhOeQhlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ0J5Q291bnQoY2FyZENvdW50cywgbGFzdENvdW50LCBsYXN0UmFuaylcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog6I635Y+W5LiK5a625Ye655qE54mM55qE5Li754mM54K55pWwXG4gICAgICovXG4gICAgX2dldExhc3RQbGF5ZWRNYWluUmFuazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy5fbGFzdFBsYXllZENhcmRzIHx8IHRoaXMuX2xhc3RQbGF5ZWRDYXJkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgIH1cbiAgICAgICAgLy8g57uf6K6h5q+P5Liq54K55pWw5Ye6546w55qE5qyh5pWwXG4gICAgICAgIHZhciBjb3VudHMgPSB7fVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2xhc3RQbGF5ZWRDYXJkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJhbmsgPSB0aGlzLl9sYXN0UGxheWVkQ2FyZHNbaV0ucmFua1xuICAgICAgICAgICAgY291bnRzW3JhbmtdID0gKGNvdW50c1tyYW5rXSB8fCAwKSArIDFcbiAgICAgICAgfVxuICAgICAgICAvLyDmib7lh7rlh7rnjrDmrKHmlbDmnIDlpJrnmoTngrnmlbDvvIjkuLvniYzvvIlcbiAgICAgICAgdmFyIG1heENvdW50ID0gMFxuICAgICAgICB2YXIgbWFpblJhbmsgPSAwXG4gICAgICAgIGZvciAodmFyIHJhbmsgaW4gY291bnRzKSB7XG4gICAgICAgICAgICBpZiAoY291bnRzW3JhbmtdID4gbWF4Q291bnQpIHtcbiAgICAgICAgICAgICAgICBtYXhDb3VudCA9IGNvdW50c1tyYW5rXVxuICAgICAgICAgICAgICAgIG1haW5SYW5rID0gcGFyc2VJbnQocmFuaylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFpblJhbmtcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOaJvuacgOWwj+eahOeJjO+8iOaWsOS4gOi9ruaXtuS9v+eUqO+8iVxuICAgICAqL1xuICAgIF9maW5kU21hbGxlc3RDYXJkczogZnVuY3Rpb24oY2FyZENvdW50cykge1xuICAgICAgICAvLyDmjInngrnmlbDku47lsI/liLDlpKfmjpLluo9cbiAgICAgICAgdmFyIHJhbmtzID0gT2JqZWN0LmtleXMoY2FyZENvdW50cykubWFwKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHBhcnNlSW50KHIpIH0pLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAtIGIgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIOS8mOWFiOWHuuWNleW8oFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmFuayA9IHJhbmtzW2ldXG4gICAgICAgICAgICBpZiAoY2FyZENvdW50c1tyYW5rXS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2NhcmRDb3VudHNbcmFua11bMF1dXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOayoeacieWNleW8oOWImeWHuuacgOWwj+eahOWvueWtkFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmFuayA9IHJhbmtzW2ldXG4gICAgICAgICAgICBpZiAoY2FyZENvdW50c1tyYW5rXS5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FyZENvdW50c1tyYW5rXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlh7rmnIDlsI/nmoTkuInlvKBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByYW5rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJhbmsgPSByYW5rc1tpXVxuICAgICAgICAgICAgaWYgKGNhcmRDb3VudHNbcmFua10ubGVuZ3RoID09PSAzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhcmRDb3VudHNbcmFua11cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5Ye65pyA5bCP55qE54K45by5XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gcmFua3NbaV1cbiAgICAgICAgICAgIGlmIChjYXJkQ291bnRzW3JhbmtdLmxlbmd0aCA9PT0gNCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYXJkQ291bnRzW3JhbmtdXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWFnOW6le+8muWHuuacgOWwj+eahOeJjFxuICAgICAgICBpZiAocmFua3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFtjYXJkQ291bnRzW3JhbmtzWzBdXVswXV1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog5om+6IO95omT6L+H55qE5pyA5bCP5Y2V5bygXG4gICAgICovXG4gICAgX2ZpbmRCZWF0aW5nU2luZ2xlOiBmdW5jdGlvbihjYXJkQ291bnRzLCB0YXJnZXRSYW5rKSB7XG4gICAgICAgIHZhciByYW5rcyA9IE9iamVjdC5rZXlzKGNhcmRDb3VudHMpLm1hcChmdW5jdGlvbihyKSB7IHJldHVybiBwYXJzZUludChyKSB9KS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgLSBiIH0pXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gcmFua3NbaV1cbiAgICAgICAgICAgIGlmIChyYW5rID4gdGFyZ2V0UmFuaykge1xuICAgICAgICAgICAgICAgIHJldHVybiBbY2FyZENvdW50c1tyYW5rXVswXV1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyDmsqHmnInog73miZPov4fnmoTljZXlvKDvvIzlsJ3or5XngrjlvLlcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRTbWFsbGVzdEJvbWIoY2FyZENvdW50cylcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOaJvuiDveaJk+i/h+eahOacgOWwj+WvueWtkFxuICAgICAqL1xuICAgIF9maW5kQmVhdGluZ1BhaXI6IGZ1bmN0aW9uKGNhcmRDb3VudHMsIHRhcmdldFJhbmspIHtcbiAgICAgICAgdmFyIHJhbmtzID0gT2JqZWN0LmtleXMoY2FyZENvdW50cykubWFwKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHBhcnNlSW50KHIpIH0pLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAtIGIgfSlcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByYW5rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJhbmsgPSByYW5rc1tpXVxuICAgICAgICAgICAgaWYgKHJhbmsgPiB0YXJnZXRSYW5rICYmIGNhcmRDb3VudHNbcmFua10ubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2NhcmRDb3VudHNbcmFua11bMF0sIGNhcmRDb3VudHNbcmFua11bMV1dXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8g5rKh5pyJ6IO95omT6L+H55qE5a+55a2Q77yM5bCd6K+V54K45by5XG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kU21hbGxlc3RCb21iKGNhcmRDb3VudHMpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDmib7og73miZPov4fnmoTmnIDlsI/kuInlvKDvvIjluKbmiJbkuI3luKbvvIlcbiAgICAgKi9cbiAgICBfZmluZEJlYXRpbmdUcmlwbGU6IGZ1bmN0aW9uKGNhcmRDb3VudHMsIHRhcmdldFJhbmssIGtpY2tlcnMpIHtcbiAgICAgICAgdmFyIHJhbmtzID0gT2JqZWN0LmtleXMoY2FyZENvdW50cykubWFwKGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHBhcnNlSW50KHIpIH0pLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAtIGIgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIOaJvuS4ieW8oFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmFuayA9IHJhbmtzW2ldXG4gICAgICAgICAgICBpZiAocmFuayA+IHRhcmdldFJhbmsgJiYgY2FyZENvdW50c1tyYW5rXS5sZW5ndGggPj0gMykge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBbY2FyZENvdW50c1tyYW5rXVswXSwgY2FyZENvdW50c1tyYW5rXVsxXSwgY2FyZENvdW50c1tyYW5rXVsyXV1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzpnIDopoHluKbniYxcbiAgICAgICAgICAgICAgICBpZiAoa2lja2VycyA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtpY2tlckNhcmRzID0gdGhpcy5fZmluZEtpY2tlckNhcmRzKGNhcmRDb3VudHMsIHJhbmssIGtpY2tlcnMpXG4gICAgICAgICAgICAgICAgICAgIGlmIChraWNrZXJDYXJkcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdChraWNrZXJDYXJkcylcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWwneivleS7juWbm+W8oOS4reaLhuS4ieW8oFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmFuayA9IHJhbmtzW2ldXG4gICAgICAgICAgICBpZiAocmFuayA+IHRhcmdldFJhbmsgJiYgY2FyZENvdW50c1tyYW5rXS5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gW2NhcmRDb3VudHNbcmFua11bMF0sIGNhcmRDb3VudHNbcmFua11bMV0sIGNhcmRDb3VudHNbcmFua11bMl1dXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKGtpY2tlcnMgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBraWNrZXJDYXJkcyA9IHRoaXMuX2ZpbmRLaWNrZXJDYXJkcyhjYXJkQ291bnRzLCByYW5rLCBraWNrZXJzKVxuICAgICAgICAgICAgICAgICAgICBpZiAoa2lja2VyQ2FyZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQoa2lja2VyQ2FyZHMpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlsJ3or5XngrjlvLlcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRTbWFsbGVzdEJvbWIoY2FyZENvdW50cylcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOaJvuW4pueJjFxuICAgICAqL1xuICAgIF9maW5kS2lja2VyQ2FyZHM6IGZ1bmN0aW9uKGNhcmRDb3VudHMsIGV4Y2x1ZGVSYW5rLCBjb3VudCkge1xuICAgICAgICB2YXIgcmFua3MgPSBPYmplY3Qua2V5cyhjYXJkQ291bnRzKS5tYXAoZnVuY3Rpb24ocikgeyByZXR1cm4gcGFyc2VJbnQocikgfSkuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhIC0gYiB9KVxuICAgICAgICBcbiAgICAgICAgdmFyIGtpY2tlcnMgPSBbXVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmtzLmxlbmd0aCAmJiBraWNrZXJzLmxlbmd0aCA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gcmFua3NbaV1cbiAgICAgICAgICAgIGlmIChyYW5rICE9PSBleGNsdWRlUmFuaykge1xuICAgICAgICAgICAgICAgIHZhciBhdmFpbGFibGUgPSBNYXRoLm1pbihjYXJkQ291bnRzW3JhbmtdLmxlbmd0aCwgY291bnQgLSBraWNrZXJzLmxlbmd0aClcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGF2YWlsYWJsZTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGtpY2tlcnMucHVzaChjYXJkQ291bnRzW3JhbmtdW2pdKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGtpY2tlcnMubGVuZ3RoID09PSBjb3VudCA/IGtpY2tlcnMgOiBudWxsXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDmib7og73miZPov4fnmoTmnIDlsI/ngrjlvLlcbiAgICAgKi9cbiAgICBfZmluZEJlYXRpbmdCb21iOiBmdW5jdGlvbihjYXJkQ291bnRzLCB0YXJnZXRSYW5rKSB7XG4gICAgICAgIHZhciByYW5rcyA9IE9iamVjdC5rZXlzKGNhcmRDb3VudHMpLm1hcChmdW5jdGlvbihyKSB7IHJldHVybiBwYXJzZUludChyKSB9KS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgLSBiIH0pXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmFua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gcmFua3NbaV1cbiAgICAgICAgICAgIGlmIChyYW5rID4gdGFyZ2V0UmFuayAmJiBjYXJkQ291bnRzW3JhbmtdLmxlbmd0aCA9PT0gNCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYXJkQ291bnRzW3JhbmtdXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8g5rKh5pyJ6IO95omT6L+H55qE54K45by577yM5bCd6K+V546L54K4XG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kUm9ja2V0KGNhcmRDb3VudHMpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDmib7mnIDlsI/nmoTngrjlvLlcbiAgICAgKi9cbiAgICBfZmluZFNtYWxsZXN0Qm9tYjogZnVuY3Rpb24oY2FyZENvdW50cykge1xuICAgICAgICB2YXIgcmFua3MgPSBPYmplY3Qua2V5cyhjYXJkQ291bnRzKS5tYXAoZnVuY3Rpb24ocikgeyByZXR1cm4gcGFyc2VJbnQocikgfSkuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhIC0gYiB9KVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmFuayA9IHJhbmtzW2ldXG4gICAgICAgICAgICBpZiAoY2FyZENvdW50c1tyYW5rXS5sZW5ndGggPT09IDQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FyZENvdW50c1tyYW5rXVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kUm9ja2V0KGNhcmRDb3VudHMpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDmib7njovngrhcbiAgICAgKi9cbiAgICBfZmluZFJvY2tldDogZnVuY3Rpb24oY2FyZENvdW50cykge1xuICAgICAgICB2YXIgam9rZXJzID0gW11cbiAgICAgICAgaWYgKGNhcmRDb3VudHNbMTZdICYmIGNhcmRDb3VudHNbMTZdLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGpva2Vycy5wdXNoKGNhcmRDb3VudHNbMTZdWzBdKVxuICAgICAgICB9XG4gICAgICAgIGlmIChjYXJkQ291bnRzWzE3XSAmJiBjYXJkQ291bnRzWzE3XS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBqb2tlcnMucHVzaChjYXJkQ291bnRzWzE3XVswXSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gam9rZXJzLmxlbmd0aCA9PT0gMiA/IGpva2VycyA6IG51bGxcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIOaMieW8oOaVsOaJvuiDveaJk+i/h+eahOeJjFxuICAgICAqL1xuICAgIF9maW5kQmVhdGluZ0J5Q291bnQ6IGZ1bmN0aW9uKGNhcmRDb3VudHMsIGNvdW50LCB0YXJnZXRSYW5rKSB7XG4gICAgICAgIC8vIOeugOWNleWunueOsO+8muaMieW8oOaVsOWkhOeQhlxuICAgICAgICBpZiAoY291bnQgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ1NpbmdsZShjYXJkQ291bnRzLCB0YXJnZXRSYW5rKVxuICAgICAgICB9IGVsc2UgaWYgKGNvdW50ID09PSAyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fZmluZEJlYXRpbmdQYWlyKGNhcmRDb3VudHMsIHRhcmdldFJhbmspXG4gICAgICAgIH0gZWxzZSBpZiAoY291bnQgPT09IDMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ1RyaXBsZShjYXJkQ291bnRzLCB0YXJnZXRSYW5rLCAwKVxuICAgICAgICB9IGVsc2UgaWYgKGNvdW50ID09PSA0KSB7XG4gICAgICAgICAgICAvLyDlj6/og73mmK/ngrjlvLlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kQmVhdGluZ0JvbWIoY2FyZENvdW50cywgdGFyZ2V0UmFuaylcbiAgICAgICAgfSBlbHNlIGlmIChjb3VudCA+PSA1KSB7XG4gICAgICAgICAgICAvLyDlj6/og73mmK/pobrlrZDjgIHov57lr7nnrYnvvIzmmoLkuI3mlK/mjIHmj5DnpLpcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog6YCJ5Lit5oyH5a6a55qE54mMXG4gICAgICogQHBhcmFtIHtBcnJheX0gY2FyZHMgLSDopoHpgInkuK3nmoTniYxcbiAgICAgKi9cbiAgICBfc2VsZWN0Q2FyZHM6IGZ1bmN0aW9uKGNhcmRzKSB7XG4gICAgICAgIGlmICghY2FyZHMgfHwgY2FyZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeWPquS7juaJi+eJjOWuueWZqOS4reafpeaJvu+8jOS4jemBjeWOhm5vZGUucGFyZW50XG4gICAgICAgIHZhciBjYXJkUGFyZW50ID0gdGhpcy5jYXJkc19ub2RlXG4gICAgICAgIGlmICghY2FyZFBhcmVudCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+OriBbX3NlbGVjdENhcmRzXSBjYXJkc19ub2RlIOacquWumuS5ie+8jOWwneivleafpeaJvuaJi+eJjOWuueWZqFwiKVxuICAgICAgICAgICAgLy8g5bCd6K+V6YCa6L+H6IqC54K55ZCN56ew5p+l5om+XG4gICAgICAgICAgICB2YXIgZ2FtZVNjZW5lTm9kZSA9IHRoaXMubm9kZS5wYXJlbnRcbiAgICAgICAgICAgIGlmIChnYW1lU2NlbmVOb2RlKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnYW1lU2NlbmVOb2RlLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGdhbWVTY2VuZU5vZGUuY2hpbGRyZW5baV1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLm5hbWUgPT09IFwiY2FyZHNfbm9kZVwiIHx8IGNoaWxkLm5hbWUgPT09IFwiY2FyZHNcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FyZFBhcmVudCA9IGNoaWxkXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhcmRzX25vZGUgPSBjaGlsZFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY2FyZFBhcmVudCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfjq4gW19zZWxlY3RDYXJkc10g5om+5LiN5Yiw5omL54mM5a655ZmoXCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjaGlsZHJlbiA9IGNhcmRQYXJlbnQuY2hpbGRyZW5cblxuICAgICAgICB2YXIgZm91bmRDb3VudCA9IDBcbiAgICAgICAgdmFyIGFscmVhZHlNYXRjaGVkID0ge30gIC8vIPCflKfjgJDmlrDlop7jgJHorrDlvZXlt7LljLnphY3nmoTniYzvvIzpmLLmraLph43lpI3ljLnphY1cblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2FyZE5vZGUgPSBjaGlsZHJlbltpXVxuICAgICAgICAgICAgdmFyIGNhcmRDb21wID0gY2FyZE5vZGUuZ2V0Q29tcG9uZW50KFwiY2FyZFwiKVxuICAgICAgICAgICAgaWYgKGNhcmRDb21wICYmIGNhcmRDb21wLmNhcmRfZGF0YSkge1xuICAgICAgICAgICAgICAgIC8vIOajgOafpei/meW8oOeJjOaYr+WQpuWcqOimgemAieS4reeahOeJjOS4rVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2FyZHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1hdGNoS2V5ID0gY2FyZHNbal0uc3VpdCArIFwiX1wiICsgY2FyZHNbal0ucmFua1xuICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5qOA5p+l5piv5ZCm5bey57uP5Yy56YWN6L+H6L+Z5byg54mMXG4gICAgICAgICAgICAgICAgICAgIGlmIChhbHJlYWR5TWF0Y2hlZFttYXRjaEtleV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FyZENvbXAuY2FyZF9kYXRhLnJhbmsgPT09IGNhcmRzW2pdLnJhbmsgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRDb21wLmNhcmRfZGF0YS5zdWl0ID09PSBjYXJkc1tqXS5zdWl0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5qOA5p+l5piv5ZCm5bey57uP6YCJ5LitXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWNhcmRDb21wLmZsYWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDpgInkuK3ov5nlvKDniYxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXJkQ29tcC5mbGFnID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhcmROb2RlLnkgKz0gMjAgIC8vIOWQkeS4iuenu+WKqOihqOekuumAieS4rVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hvb3NlX2NhcmRfZGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FyZGlkOiBjYXJkQ29tcC5jYXJkX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXJkX2RhdGE6IGNhcmRDb21wLmNhcmRfZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRDb3VudCsrXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxyZWFkeU1hdGNoZWRbbWF0Y2hLZXldID0gdHJ1ZSAgLy8g5qCH6K6w5bey5Yy56YWNXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgaWYgKGZvdW5kQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMudGlwc0xhYmVsLnN0cmluZyA9IFwi5o+Q56S65aSx6LSl77yM6K+35omL5Yqo6YCJ54mMXCJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnRpcHNMYWJlbC5zdHJpbmcgPSBcIlwiXG4gICAgICAgICAgICB9LCAyMDAwKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNsZWFyT3V0Wm9uZTogZnVuY3Rpb24oYWNjb3VudGlkKSB7XG4gICAgICAgIHZhciBvdXRDYXJkX25vZGUgPSB0aGlzLl9nZXRPdXRDYXJkTm9kZShhY2NvdW50aWQpXG4gICAgICAgIGlmIChvdXRDYXJkX25vZGUpIHtcbiAgICAgICAgICAgIG91dENhcmRfbm9kZS5yZW1vdmVBbGxDaGlsZHJlbih0cnVlKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNob3dPdXRDYXJkczogZnVuY3Rpb24ob3V0Q2FyZF9ub2RlLCBjYXJkcykge1xuICAgICAgICBpZiAoIW91dENhcmRfbm9kZSB8fCAhY2FyZHMgfHwgY2FyZHMubGVuZ3RoID09PSAwKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIG91dENhcmRfbm9kZS5yZW1vdmVBbGxDaGlsZHJlbih0cnVlKVxuICAgICAgICBcbiAgICAgICAgdmFyIGNvdW50ID0gY2FyZHMubGVuZ3RoXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNhcmQgPSBjYXJkc1tpXVxuICAgICAgICAgICAgb3V0Q2FyZF9ub2RlLmFkZENoaWxkKGNhcmQsIGkpXG4gICAgICAgICAgICBjYXJkLnNldFNjYWxlKENhcmRMYXlvdXQub3V0Q2FyZFNjYWxlLCBDYXJkTGF5b3V0Lm91dENhcmRTY2FsZSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHggPSB0aGlzLl9nZXRDYXJkWChpLCBjb3VudCwgQ2FyZExheW91dC5vdXRDYXJkU3BhY2luZylcbiAgICAgICAgICAgIGNhcmQuc2V0UG9zaXRpb24oeCwgMClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDmuLjmiI/nirbmgIHmgaLlpI3vvIjmlq3nur/ph43ov57vvIlcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICByZXN0b3JlR2FtZVN0YXRlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIFxuICAgICAgICB2YXIgZ2FtZVN0YXRlID0gZGF0YS5nYW1lX3N0YXRlXG4gICAgICAgIGlmICghZ2FtZVN0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7jgJHorr7nva7muLjmiI/pmLbmrrVcbiAgICAgICAgaWYgKGdhbWVTdGF0ZS5waGFzZSA9PT0gXCJiaWRkaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX2dhbWVQaGFzZSA9IFwiYmlkZGluZ1wiXG4gICAgICAgICAgICB0aGlzLl9iaWRkaW5nUGhhc2UgPSBcImJpZGRpbmdcIlxuICAgICAgICB9IGVsc2UgaWYgKGdhbWVTdGF0ZS5waGFzZSA9PT0gXCJwbGF5aW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX2dhbWVQaGFzZSA9IFwicGxheWluZ1wiXG4gICAgICAgICAgICB0aGlzLl9iaWRkaW5nUGhhc2UgPSBcImlkbGVcIlxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmgaLlpI3njqnlrrbkv6Hmga9cbiAgICAgICAgaWYgKGdhbWVTdGF0ZS5wbGF5ZXJzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdhbWVTdGF0ZS5wbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSBnYW1lU3RhdGUucGxheWVyc1tpXVxuICAgICAgICAgICAgICAgIGlmIChwLmlzX2xhbmRsb3JkICYmIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLm1hc3Rlcl9hY2NvdW50aWQgPSBwLmlkXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR6YCa55+l5YW25LuW546p5a626IqC54K55pu05pawXG4gICAgICAgICAgICBpZiAodGhpcy5ub2RlICYmIHRoaXMubm9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5vZGUucGFyZW50LmVtaXQoXCJwbGF5ZXJzX3Jlc3RvcmVkX2V2ZW50XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgcGxheWVyczogZ2FtZVN0YXRlLnBsYXllcnNcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5oGi5aSN5omL54mMXG4gICAgICAgIGlmIChnYW1lU3RhdGUuaGFuZCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu44CR6YeN572u5riy5p+T5ZOI5biM77yM56Gu5L+d5omL54mM5Lya6KKr5pu05pawXG4gICAgICAgICAgICB0aGlzLl9sYXN0UmVuZGVySGFzaCA9IFwiXCJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5L+d5a2Y5omL54mM5pWw5o2uXG4gICAgICAgICAgICB0aGlzLmhhbmRDYXJkcyA9IGdhbWVTdGF0ZS5oYW5kXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOagh+iusOWPkeeJjOWujOaIkFxuICAgICAgICAgICAgdGhpcy5jYXJkc1JlYWR5ID0gdHJ1ZVxuICAgICAgICAgICAgdGhpcy5mYXBhaV9lbmQgPSB0cnVlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7jgJHkvb/nlKjpnZnpu5jmm7TmlrDvvIzkuI3op6blj5Hlj5HniYzliqjnlLtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZUhhbmRDYXJkc1NpbGVudCh0aGlzLmhhbmRDYXJkcylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5oGi5aSN5bqV54mMXG4gICAgICAgIGlmIChnYW1lU3RhdGUuYm90dG9tX2NhcmRzICYmIGdhbWVTdGF0ZS5ib3R0b21fY2FyZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5ib3R0b21DYXJkcyA9IGdhbWVTdGF0ZS5ib3R0b21fY2FyZHNcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ib3R0b21fY2FyZC5sZW5ndGggJiYgaSA8IHRoaXMuYm90dG9tQ2FyZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ib3R0b21fY2FyZFtpXSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZENvbXAgPSB0aGlzLmJvdHRvbV9jYXJkW2ldLmdldENvbXBvbmVudChcImNhcmRcIilcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhcmRDb21wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJkQ29tcC5zaG93Q2FyZHModGhpcy5ib3R0b21DYXJkc1tpXSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeaBouWkjeS4iuWutuWHuueahOeJjFxuICAgICAgICBpZiAoZ2FtZVN0YXRlLmxhc3RfcGxheWVkICYmIGdhbWVTdGF0ZS5sYXN0X3BsYXllZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLl9sYXN0UGxheWVkQ2FyZHMgPSBnYW1lU3RhdGUubGFzdF9wbGF5ZWRcbiAgICAgICAgICAgIHRoaXMuX2xhc3RQbGF5ZWRIYW5kVHlwZSA9IGdhbWVTdGF0ZS5sYXN0X3BsYXllZC5oYW5kX3R5cGUgfHwgXCJcIlxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5pi+56S65LiK5a625Ye655qE54mMXG4gICAgICAgICAgICBpZiAoZ2FtZVN0YXRlLmxhc3RfcGxheWVyX2lkKSB7XG4gICAgICAgICAgICAgICAgdmFyIGdhbWVTY2VuZV9zY3JpcHQgPSB0aGlzLm5vZGUucGFyZW50LmdldENvbXBvbmVudChcImdhbWVTY2VuZVwiKVxuICAgICAgICAgICAgICAgIGlmIChnYW1lU2NlbmVfc2NyaXB0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvdXRDYXJkX25vZGUgPSBnYW1lU2NlbmVfc2NyaXB0LmdldFVzZXJPdXRDYXJkUG9zQnlBY2NvdW50KGdhbWVTdGF0ZS5sYXN0X3BsYXllcl9pZClcbiAgICAgICAgICAgICAgICAgICAgaWYgKG91dENhcmRfbm9kZSAmJiB0aGlzLmNhcmRfcHJlZmFiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmuIXpmaTml6fnmoTlh7rniYxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dENhcmRfbm9kZS5yZW1vdmVBbGxDaGlsZHJlbigpXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOaYvuekuuS4iuWutuWHuueahOeJjFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5vZGVfY2FyZHMgPSBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnYW1lU3RhdGUubGFzdF9wbGF5ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2FyZCA9IGNjLmluc3RhbnRpYXRlKHRoaXMuY2FyZF9wcmVmYWIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNhcmRTY3JpcHQgPSBjYXJkLmdldENvbXBvbmVudChcImNhcmRcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhcmRTY3JpcHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhcmRTY3JpcHQuc2hvd0NhcmRzKGdhbWVTdGF0ZS5sYXN0X3BsYXllZFtpXSwgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVfY2FyZHMucHVzaChjYXJkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd091dENhcmRzKG91dENhcmRfbm9kZSwgbm9kZV9jYXJkcylcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5oGi5aSN5Ye654mM6L2u5qyhXG4gICAgICAgIGlmIChnYW1lU3RhdGUucGhhc2UgPT09IFwicGxheWluZ1wiICYmIGdhbWVTdGF0ZS5jdXJyZW50X3R1cm4pIHtcbiAgICAgICAgICAgIHZhciBteVBsYXllcklkID0gd2luZG93Lm15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKCkuaWQgfHwgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7jgJHpmpDol4/miqLlnLDkuLtVSVxuICAgICAgICAgICAgdGhpcy5faGlkZVJvYlVJKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKFN0cmluZyhnYW1lU3RhdGUuY3VycmVudF90dXJuKSA9PT0gU3RyaW5nKG15UGxheWVySWQpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5aW5nVUlfbm9kZS5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkeS/neWtmOWHuueJjOeKtuaAgVxuICAgICAgICAgICAgICAgIHRoaXMuX211c3RQbGF5ID0gZ2FtZVN0YXRlLm11c3RfcGxheSB8fCBmYWxzZVxuICAgICAgICAgICAgICAgIHRoaXMuX2NhbkJlYXQgPSBnYW1lU3RhdGUuY2FuX2JlYXQgfHwgZmFsc2VcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5ZCv5Yqo5Ye654mM5YCS6K6h5pe277yI5aaC5p6c5pyN5Yqh56uv5o+Q5L6b5LqG5Ymp5L2Z5pe26Ze077yJXG4gICAgICAgICAgICAgICAgLy8g5rOo5oSP77ya5pyN5Yqh56uv5bqU6K+l5Zyo6YeN6L+e5ZCO5Y+R6YCBIGNhbl9jaHVfY2FyZF9ub3RpZnkg5raI5oGv5p2l5ZCv5Yqo5YCS6K6h5pe2XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBsYXlpbmdVSV9ub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGxheWluZ1VJX25vZGUuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHlpoLmnpzmmK/miqLlnLDkuLvpmLbmrrVcbiAgICAgICAgaWYgKGdhbWVTdGF0ZS5waGFzZSA9PT0gXCJiaWRkaW5nXCIpIHtcbiAgICAgICAgICAgIC8vIOazqOaEj++8muacjeWKoeerr+W6lOivpeWcqOmHjei/nuWQjuWPkemAgSBjYWxsX2xhbmRsb3JkX3R1cm5fbm90aWZ5IOa2iOaBr+adpeaYvuekuuaKouWcsOS4u+aMiemSrlxuICAgICAgICB9XG4gICAgICAgIFxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDwn5Sn44CQ5paw5aKe44CR5bqV54mM5pi+56S65ZKM5Zyw5Li75omL54mM5pu05pawXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeaYvuekuuW6leeJjOe7meaJgOacieeOqeWutu+8iOe/u+eJjOWKqOeUu++8iVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGNhcmRzIC0g5bqV54mM5pWw5o2uXG4gICAgICovXG4gICAgX3Nob3dCb3R0b21DYXJkc1RvQWxsOiBmdW5jdGlvbihjYXJkcykge1xuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR6aaW5YWI5qOA5p+l6IqC54K55piv5ZCm5pyJ5pWIXG4gICAgICAgIGlmICghdGhpcy5ub2RlIHx8ICF0aGlzLm5vZGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+DjyBbX3Nob3dCb3R0b21DYXJkc1RvQWxsXSDoioLngrnlt7LplIDmr4HmiJbml6DmlYjvvIzot7Pov4dcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIWNhcmRzIHx8IGNhcmRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmo4Dmn6UgYm90dG9tX2NhcmQg5pWw57uE5piv5ZCm5a2Y5ZyoXG4gICAgICAgIGlmICghdGhpcy5ib3R0b21fY2FyZCB8fCAhQXJyYXkuaXNBcnJheSh0aGlzLmJvdHRvbV9jYXJkKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+DjyBbX3Nob3dCb3R0b21DYXJkc1RvQWxsXSBib3R0b21fY2FyZCDmnKrliJ3lp4vljJZcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDlupXniYzmmL7npLpcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYXJkcy5sZW5ndGggJiYgaSA8IHRoaXMuYm90dG9tX2NhcmQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjYXJkTm9kZSA9IHRoaXMuYm90dG9tX2NhcmRbaV1cbiAgICAgICAgICAgIGlmICghY2FyZE5vZGUpIGNvbnRpbnVlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBjYXJkU2NyaXB0ID0gY2FyZE5vZGUuZ2V0Q29tcG9uZW50KFwiY2FyZFwiKVxuICAgICAgICAgICAgaWYgKGNhcmRTY3JpcHQpIHtcbiAgICAgICAgICAgICAgICBjYXJkU2NyaXB0LnNob3dDYXJkcyhjYXJkc1tpXSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkemdmem7mOabtOaWsOWcsOS4u+eahOaJi+eJjO+8iOS4jeinpuWPkeWPkeeJjOWKqOeUu++8iVxuICAgICAqIOWPquWcqOWcsOS4u+aUtuWIsCBMQU5ETE9SRF9DQVJEUyDmtojmga/ml7bosIPnlKhcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBjYXJkcyAtIOWcsOS4u+eahOWujOaVtOaJi+eJjO+8iOWQq+W6leeJjO+8iVxuICAgICAqL1xuICAgIF91cGRhdGVMYW5kbG9yZEhhbmRDYXJkczogZnVuY3Rpb24oY2FyZHMpIHtcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkemmluWFiOajgOafpeiKgueCueaYr+WQpuacieaViFxuICAgICAgICBpZiAoIXRoaXMubm9kZSB8fCAhdGhpcy5ub2RlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCfg48gW191cGRhdGVMYW5kbG9yZEhhbmRDYXJkc10g6IqC54K55bey6ZSA5q+B5oiW5peg5pWI77yM6Lez6L+HXCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFjYXJkcyB8fCBjYXJkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgLy8g5o6S5bqP5omL54mMXG4gICAgICAgIHZhciBzb3J0ZWRDYXJkcyA9IHRoaXMuX3NvcnRDYXJkcyhjYXJkcylcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHnoa7kv53miYvniYzlrrnlmajlrZjlnKhcbiAgICAgICAgdmFyIGNhcmRzUGFyZW50ID0gdGhpcy5jYXJkc19ub2RlXG4gICAgICAgIGlmICghY2FyZHNQYXJlbnQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn4OPIFtfdXBkYXRlTGFuZGxvcmRIYW5kQ2FyZHNdIGNhcmRzX25vZGUg5pyq5a6a5LmJXCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5riF55CG5pen5omL54mM6IqC54K5XG4gICAgICAgIGNhcmRzUGFyZW50LnJlbW92ZUFsbENoaWxkcmVuKClcbiAgICAgICAgXG4gICAgICAgIC8vIOmHjeaWsOWIm+W7uuaJi+eJjOiKgueCue+8iOaXoOWKqOeUu++8iVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNvcnRlZENhcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2FyZERhdGEgPSBzb3J0ZWRDYXJkc1tpXVxuICAgICAgICAgICAgdmFyIHRhcmdldFggPSB0aGlzLl9nZXRDYXJkWChpLCBzb3J0ZWRDYXJkcy5sZW5ndGgsIENhcmRMYXlvdXQuY2FyZFNwYWNpbmcpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBjYXJkID0gY2MuaW5zdGFudGlhdGUodGhpcy5jYXJkX3ByZWZhYilcbiAgICAgICAgICAgIGlmICghY2FyZCkgY29udGludWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FyZC5zY2FsZSA9IENhcmRMYXlvdXQuY2FyZFNjYWxlXG4gICAgICAgICAgICBjYXJkLnBhcmVudCA9IGNhcmRzUGFyZW50ICAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55So56Gu5a6a55qE5omL54mM5a655ZmoXG4gICAgICAgICAgICBjYXJkLnNldFBvc2l0aW9uKHRhcmdldFgsIENhcmRMYXlvdXQuY2FyZFkpXG4gICAgICAgICAgICBjYXJkLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgIGNhcmQuekluZGV4ID0gaVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgY2FyZENvbXAgPSBjYXJkLmdldENvbXBvbmVudChcImNhcmRcIilcbiAgICAgICAgICAgIGlmIChjYXJkQ29tcCkge1xuICAgICAgICAgICAgICAgIGNhcmRDb21wLnNob3dDYXJkcyhjYXJkRGF0YSwgbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SUQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmHjee9rua4suafk+WTiOW4jO+8jOWFgeiuuOWQjue7rea4suafk1xuICAgICAgICB0aGlzLl9sYXN0UmVuZGVySGFzaCA9IEpTT04uc3RyaW5naWZ5KGNhcmRzKVxuICAgICAgICBcbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g8J+UiuOAkOWHuueJjOmfs+aViOezu+e7n+OAkeS9v+eUqOWunumZhemfs+aViOaWh+S7tlxuICAgIC8vIOmfs+aViOaWh+S7tuWRveWQjeinhOWIme+8mlxuICAgIC8vIC0g55S354mIOiBtX2NwX3t0eXBlfV97cmFua30ubXAzIOaIliBtX2NwX3t0eXBlfS5tcDNcbiAgICAvLyAtIOWls+eJiDogbV9jcF9udl97dHlwZX1fe3Jhbmt9Lm1wMyDmiJYgbV9jcF9udl97dHlwZX0ubXAzXG4gICAgLy8g5rOo5oSP77ya5aSn5bCP546LKHJhbms9MTQvMTUp5rKh5pyJ5a+55a2Q6Z+z5pWI77yM5Zug5Li65Lik5byg546L5piv546L54K45LiN5piv5a+55a2QXG4gICAgLy8gXG4gICAgLy8g8J+Up+OAkOmfs+aViOinhOWImeOAkVxuICAgIC8vIDEuIOmmluWHuu+8iGlzX25ld19yb3VuZD10cnVl77yJ77ya5pKt5pS+5a+55bqU54mM5Z6L55qE6Z+z5pWIXG4gICAgLy8gMi4g5Y6L54mM77yIaXNfbmV3X3JvdW5kPWZhbHNlLCBjYW5fYmVhdD10cnVl77yJ77yaXG4gICAgLy8gICAgLSDmnInlr7nlupTpn7PmlYjmlofku7bvvJrmkq3mlL7niYzlnovpn7PmlYhcbiAgICAvLyAgICAtIOaXoOWvueW6lOmfs+aViOaWh+S7tu+8iOWmguWvueWtkDE0LzE177yJ77ya5pKt5pS+XCLlpKfkvaBcIumfs+aViFxuICAgIC8vIDMuIOeCuOW8uS/njovngrjvvJrlp4vnu4jmkq3mlL7ngrjlvLkv546L54K46Z+z5pWIXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiDwn5SKIOaSreaUvuWHuueJjOmfs+aViFxuICAgICAqIPCflKfjgJDlhajpnaLph43mnoTniYjjgJHkuKXmoLzpgbXlvqpcIuWkp+S9oFwi6Z+z5pWI5L2/55So6KeE5YiZXG4gICAgICogXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSDmnI3liqHnq6/lub/mkq3nmoTmlbDmja5cbiAgICAgKiAgIC0gaGFuZF90eXBlOiDniYzlnovlkI3np7AgKHNpbmdsZS9wYWlyL3RyaXBsZS9zdHJhaWdodC9ib21iL3JvY2tldC9saWFuZHVpL3BsYW5lL3NhbmRhaXlpL3NhbmRhaWR1aS9zaWRhaWVyL3NpZGFpbGlhbmdkdWkpXG4gICAgICogICAtIHJhbms6IOS4u+eJjOeCueaVsCAo55So5LqO5Y2V5bygL+WvueWtkC/kuInlvKApXG4gICAgICogICAtIGdlbmRlcjogXCJtYWxlXCIgLyBcImZlbWFsZVwiXG4gICAgICogICAtIGlzX25ld19yb3VuZDog5piv5ZCm5piv5paw5Zue5ZCI77yI6aaW5Ye677yJXG4gICAgICogICAtIGNhbl9iZWF0OiDmmK/lkKbljovov4fkuIrlrrZcbiAgICAgKiBcbiAgICAgKiDjgJDmoLjlv4Pop4TliJnjgJFcIuWkp+S9oFwi6Z+z5pWIKG1fY3BfZGFuaSnnmoTkvb/nlKjlnLrmma/vvJpcbiAgICAgKiBcbiAgICAgKiDlnLrmma8xIC0g6aaW5Ye6KGlzX25ld19yb3VuZD10cnVlKe+8mlxuICAgICAqICAg4pyFIOWPquaSreaUvueJjOWei+mfs+aViFxuICAgICAqICAg4p2MIOemgeatouaSreaUvlwi5aSn5L2gXCJcbiAgICAgKiBcbiAgICAgKiDlnLrmma8yIC0g5Y6L54mMKGlzX25ld19yb3VuZD1mYWxzZSAmJiBjYW5fYmVhdD10cnVlKe+8mlxuICAgICAqICAg8J+OsiA3MCUg5qaC546H5pKt5pS+54mM5Z6L6Z+z5pWIXG4gICAgICogICDwn46yIDMwJSDmpoLnjofmkq3mlL5cIuWkp+S9oFwiXG4gICAgICogICDvvIjlpoLmnpzniYzlnovpn7PmlYjmlofku7bkuI3lrZjlnKjvvIwxMDAl5pKt5pS+XCLlpKfkvaBcIu+8iVxuICAgICAqIFxuICAgICAqIOWcuuaZrzMgLSDngrjlvLkv546L54K477yaXG4gICAgICogICDinIUg5aeL57uI5pKt5pS+54K45by5L+eOi+eCuOmfs+aViFxuICAgICAqL1xuICAgIF9wbGF5Q2FyZFNvdW5kOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGlmICghaXNvcGVuX3NvdW5kKSByZXR1cm5cblxuICAgICAgICAvLyDwn5Sn44CQ6LCD6K+V44CR5omT5Y2w5a6M5pW05pWw5o2u57uT5p6EXG5cbiAgICAgICAgdmFyIGhhbmRUeXBlID0gZGF0YS5oYW5kX3R5cGUgfHwgXCJcIlxuICAgICAgICB2YXIgZ2VuZGVyID0gZGF0YS5nZW5kZXIgfHwgXCJtYWxlXCJcbiAgICAgICAgdmFyIGlzTmV3Um91bmQgPSBkYXRhLmlzX25ld19yb3VuZCAhPT0gdW5kZWZpbmVkID8gZGF0YS5pc19uZXdfcm91bmQgOiB0cnVlXG4gICAgICAgIHZhciBjYW5CZWF0ID0gZGF0YS5jYW5fYmVhdCAhPT0gdW5kZWZpbmVkID8gZGF0YS5jYW5fYmVhdCA6IGZhbHNlXG5cbiAgICAgICAgLy8g8J+Up+OAkOaguOW/g+S/ruWkjeOAkeS8mOWFiOS7jiBjYXJkcyDkuK3mj5Dlj5bkuLvniYzlgLxcbiAgICAgICAgdmFyIHJhbmsgPSB0aGlzLl9leHRyYWN0TWFpblJhbmsoZGF0YSlcbiAgICAgICAgXG4gICAgICAgIC8vIPCflIrjgJDosIPor5Xml6Xlv5fjgJHor6bnu4bovpPlh7rpn7PmlYjmkq3mlL7lj4LmlbBcblxuICAgICAgICAvLyDwn5Sn44CQ5qOA5p+l44CR5piv5ZCm5piv54K45by55oiW546L54K477yI54m55q6K5aSE55CG77yJXG4gICAgICAgIHZhciB0eXBlID0gKGhhbmRUeXBlIHx8IFwiXCIpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgdmFyIGlzQm9tYiA9IHR5cGUgPT09IFwiYm9tYlwiIHx8IHR5cGUgPT09IFwiemhhZGFuXCIgfHwgdHlwZSA9PT0gXCLngrjlvLlcIlxuICAgICAgICB2YXIgaXNSb2NrZXQgPSB0eXBlID09PSBcInJvY2tldFwiIHx8IHR5cGUgPT09IFwid2FuZ3poYVwiIHx8IHR5cGUgPT09IFwi546L54K4XCJcbiAgICAgICAgXG4gICAgICAgIC8vIOeCuOW8ueWSjOeOi+eCuOWni+e7iOaSreaUvuWvueW6lOmfs+aViFxuICAgICAgICBpZiAoaXNCb21iIHx8IGlzUm9ja2V0KSB7XG4gICAgICAgICAgICB2YXIgc291bmROYW1lID0gdGhpcy5fZ2V0Q2FyZFR5cGVTb3VuZChoYW5kVHlwZSwgcmFuaywgZ2VuZGVyKVxuICAgICAgICAgICAgaWYgKHNvdW5kTmFtZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlTb3VuZEVmZmVjdChzb3VuZE5hbWUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIPCflKfjgJDmoLjlv4PjgJHojrflj5bniYzlnovpn7PmlYhcbiAgICAgICAgdmFyIGNhcmRTb3VuZCA9IHRoaXMuX2dldENhcmRUeXBlU291bmQoaGFuZFR5cGUsIHJhbmssIGdlbmRlcilcbiAgICAgICAgdmFyIHByZWZpeCA9IGdlbmRlciA9PT0gXCJmZW1hbGVcIiA/IFwibV9jcF9udl9cIiA6IFwibV9jcF9cIlxuICAgICAgICB2YXIgZGFuaVNvdW5kID0gcHJlZml4ICsgXCJkYW5pXCJcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDmo4Dmn6XjgJHniYzlnovmmK/lkKbmnInlr7nlupTnmoTpn7PmlYjmlofku7ZcbiAgICAgICAgdmFyIGhhc1NwZWNpZmljU291bmQgPSB0aGlzLl9oYXNTcGVjaWZpY0NhcmRTb3VuZChoYW5kVHlwZSwgcmFuaylcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5qC45b+D5L+u5aSN44CR5q2j56Gu55qEXCLlpKfkvaBcIuaSreaUvumAu+i+kVxuICAgICAgICAvLyBcbiAgICAgICAgLy8g6KeE5YiZ6K+05piO77yaXG4gICAgICAgIC8vIDEuIOmmluWHuihpc19uZXdfcm91bmQ9dHJ1ZSnvvJrlj6rmkq3mlL7niYzlnovpn7PmlYjvvIznpoHmraJcIuWkp+S9oFwiXG4gICAgICAgIC8vIDIuIOWOi+eJjChpc19uZXdfcm91bmQ9ZmFsc2UgJiYgY2FuX2JlYXQ9dHJ1ZSnvvJrpmo/mnLrmkq3mlL7vvIw3MCXniYzlnovpn7PmlYjvvIwzMCVcIuWkp+S9oFwiXG4gICAgICAgIC8vIDMuIOWOi+eJjOS9humfs+aViOaWh+S7tue8uuWkse+8muaSreaUvlwi5aSn5L2gXCJcbiAgICAgICAgXG4gICAgICAgIGlmIChpc05ld1JvdW5kKSB7XG4gICAgICAgICAgICAvLyDinIXjgJDlnLrmma8x44CR6aaW5Ye677ya5Y+q5pKt5pS+54mM5Z6L6Z+z5pWI77yM56aB5q2iXCLlpKfkvaBcIlxuICAgICAgICAgICAgaWYgKGNhcmRTb3VuZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlTb3VuZEVmZmVjdChjYXJkU291bmQpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOmmluWHuuS9huayoeacieWvueW6lOmfs+aViOaWh+S7tu+8iOS4jeW6lOivpeWPkeeUn++8jOS9huWuieWFqOWkhOeQhu+8iVxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCflIogW19wbGF5Q2FyZFNvdW5kXSDimqDvuI8g6aaW5Ye65L2G5peg5a+55bqU6Z+z5pWI5paH5Lu2OiBcIiArIGhhbmRUeXBlICsgXCIsIHJhbms9XCIgKyByYW5rKVxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDph43opoHjgJHpppblh7rkuI3mkq3mlL5cIuWkp+S9oFwi77yM6Z2Z6buY6Lez6L+HXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoY2FuQmVhdCkge1xuICAgICAgICAgICAgLy8g4pyF44CQ5Zy65pmvMuOAkeWOi+eJjOWcuuaZr++8mumaj+acuuaSreaUvu+8iDcwJeeJjOWei++8jDMwJeWkp+S9oO+8iVxuICAgICAgICAgICAgaWYgKGhhc1NwZWNpZmljU291bmQgJiYgY2FyZFNvdW5kKSB7XG4gICAgICAgICAgICAgICAgLy8g6ZqP5py66YCJ5oup77yaNzAl54mM5Z6L77yMMzAl5aSn5L2gXG4gICAgICAgICAgICAgICAgdmFyIHJhbmRvbVZhbHVlID0gTWF0aC5yYW5kb20oKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChyYW5kb21WYWx1ZSA8IDAuNykge1xuICAgICAgICAgICAgICAgICAgICAvLyA3MCUg5pKt5pS+54mM5Z6L6Z+z5pWIXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BsYXlTb3VuZEVmZmVjdChjYXJkU291bmQpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gMzAlIOaSreaUvlwi5aSn5L2gXCJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGxheVNvdW5kRWZmZWN0KGRhbmlTb3VuZClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOmfs+aViOaWh+S7tue8uuWkse+8jOaSreaUvlwi5aSn5L2gXCJcbiAgICAgICAgICAgICAgICB0aGlzLl9wbGF5U291bmRFZmZlY3QoZGFuaVNvdW5kKVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g4pyF44CQ5Zy65pmvM+OAkeWOi+eJjOS9hmNhbl9iZWF0PWZhbHNl77yI5LiN5bqU6K+l5Y+R55Sf77yM5L2G5a6J5YWo5aSE55CG77yJXG4gICAgICAgICAgICAvLyDov5nnp43mg4XlhrXnkIborrrkuIrkuI3lupTor6Xlh7rnjrDvvIzlm6DkuLrmnI3liqHnq6/lj6rlnKjmiJDlip/ljovniYzml7borr7nva5jYW5fYmVhdD10cnVlXG4gICAgICAgICAgICBpZiAoY2FyZFNvdW5kKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGxheVNvdW5kRWZmZWN0KGNhcmRTb3VuZClcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+UiiBbX3BsYXlDYXJkU291bmRdIOKaoO+4jyDlvILluLjlnLrmma/vvJrljovniYzkvYZjYW5fYmVhdD1mYWxzZeS4lOaXoOmfs+aViFwiKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHmo4Dmn6XniYzlnovmmK/lkKbmnInlr7nlupTnmoTpn7PmlYjmlofku7ZcbiAgICAgKiDwn5Sn44CQ5L+u5aSN44CR5aKe5Yqg5pu05aSa54mM5Z6L5pSv5oyB77yM56Gu5L+d6KaG55uW5pyN5Yqh56uv5omA5pyJ54mM5Z6L5ZCN56ewXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGhhbmRUeXBlIC0g54mM5Z6L5ZCN56ewXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHJhbmsgLSDkuLvniYzngrnmlbBcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0g5piv5ZCm5pyJ5a+55bqU6Z+z5pWI5paH5Lu2XG4gICAgICovXG4gICAgX2hhc1NwZWNpZmljQ2FyZFNvdW5kOiBmdW5jdGlvbihoYW5kVHlwZSwgcmFuaykge1xuICAgICAgICB2YXIgdHlwZSA9IChoYW5kVHlwZSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIHZhciBzb3VuZEluZGV4ID0gdGhpcy5fcmFua1RvU291bmRJbmRleChyYW5rKVxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIC8vIOWNleW8oO+8muaciTEtMTXnmoTpn7PmlYjmlofku7ZcbiAgICAgICAgLy8g5pyN5Yqh56uv5Y+R6YCBOiBcIuWNleW8oFwiXG4gICAgICAgIGlmICh0eXBlID09PSBcInNpbmdsZVwiIHx8IHR5cGUgPT09IFwic29sb1wiIHx8IHR5cGUuaW5kZXhPZihcIuWNleW8oFwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHZhciBoYXNTb3VuZCA9IHNvdW5kSW5kZXggPj0gMSAmJiBzb3VuZEluZGV4IDw9IDE1XG4gICAgICAgICAgICByZXR1cm4gaGFzU291bmRcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5a+55a2Q77ya5Y+q5pyJMS0xM+eahOmfs+aViOaWh+S7tu+8iOayoeacieWvueWtkDE0LzE177yM5Zug5Li65aSn546L5bCP546L5rKh5pyJ5a+55a2Q6Z+z5pWI77yJXG4gICAgICAgIC8vIOacjeWKoeerr+WPkemAgTogXCLlr7nlrZBcIlxuICAgICAgICBpZiAodHlwZSA9PT0gXCJwYWlyXCIgfHwgdHlwZSA9PT0gXCJkb3VibGVcIiB8fCB0eXBlLmluZGV4T2YoXCLlr7nlrZBcIikgIT09IC0xKSB7XG4gICAgICAgICAgICB2YXIgaGFzU291bmQgPSBzb3VuZEluZGV4ID49IDEgJiYgc291bmRJbmRleCA8PSAxM1xuICAgICAgICAgICAgcmV0dXJuIGhhc1NvdW5kXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOS4ieW8oO+8muWPquaciTEtMTPnmoTpn7PmlYjmlofku7ZcbiAgICAgICAgLy8g5pyN5Yqh56uv5Y+R6YCBOiBcIuS4ieW8oFwiXG4gICAgICAgIGlmICh0eXBlID09PSBcInRyaXBsZVwiIHx8IHR5cGUgPT09IFwidGhyZWVcIiB8fCB0eXBlID09PSBcInRyaW9cIiB8fCB0eXBlLmluZGV4T2YoXCLkuInlvKBcIikgIT09IC0xKSB7XG4gICAgICAgICAgICB2YXIgaGFzU291bmQgPSBzb3VuZEluZGV4ID49IDEgJiYgc291bmRJbmRleCA8PSAxM1xuICAgICAgICAgICAgcmV0dXJuIGhhc1NvdW5kXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOeJueauiueJjOWei+mDveacieWvueW6lOmfs+aViFxuICAgICAgICAvLyDmnI3liqHnq6/lj5HpgIE6IFwi6L+e5a+5XCIsIFwi6aG65a2QXCIsIFwi6aOe5py6XCIsIFwi6aOe5py65bim5Y2VXCIsIFwi6aOe5py65bim5a+5XCIsIFwi5LiJ5bim5LiAXCIsIFwi5LiJ5bim5LqMXCIsIFwi5Zub5bim5LqMXCIsIFwi5Zub5bim5Lik5a+5XCIsIFwi54K45by5XCIsIFwi546L54K4XCJcbiAgICAgICAgdmFyIHNwZWNpYWxUeXBlcyA9IFtcbiAgICAgICAgICAgIC8vIOiLseaWh+WQjeensFxuICAgICAgICAgICAgXCJsaWFuZHVpXCIsIFwic3RyYWlnaHRcIiwgXCJwbGFuZVwiLCBcImZlaWppXCIsXG4gICAgICAgICAgICBcInNhbmRhaXlpXCIsIFwic2FuZGFpZHVpXCIsIFwic2lkYWllclwiLCBcInNpZGFpbGlhbmdkdWlcIixcbiAgICAgICAgICAgIFwiYm9tYlwiLCBcInpoYWRhblwiLCBcInJvY2tldFwiLCBcIndhbmd6aGFcIixcbiAgICAgICAgICAgIC8vIOS4reaWh+WQjeensO+8iOacjeWKoeerr+WPkemAgeeahOWQjeensO+8iVxuICAgICAgICAgICAgXCLov57lr7lcIiwgXCLpobrlrZBcIiwgXCLpo57mnLpcIiwgXCLkuInluKbkuIBcIiwgXCLkuInluKbkuoxcIixcbiAgICAgICAgICAgIFwi5Zub5bim5LqMXCIsIFwi5Zub5bim5Lik5a+5XCIsIFwi54K45by5XCIsIFwi546L54K4XCJcbiAgICAgICAgXVxuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzcGVjaWFsVHlwZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0eXBlLmluZGV4T2Yoc3BlY2lhbFR5cGVzW2ldKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaguOW/g+S/ruWkjeOAkeS7juaVsOaNruS4reaPkOWPluS4u+eJjOeCueaVsFxuICAgICAqIFxuICAgICAqIOS8mOWFiOe6p++8mlxuICAgICAqIDEuIOacjeWKoeerr+S8oOmAkueahCByYW5r77yI5aaC5p6c5pyJ5pWI77yJXG4gICAgICogMi4g5LuOIGNhcmRzIOaVsOe7hOS4reaPkOWPlu+8iOagueaNrueJjOWei++8iVxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0g5pyN5Yqh56uv5bm/5pKt55qE5pWw5o2uXG4gICAgICogQHJldHVybnMge051bWJlcn0g5Li754mM54K55pWw77yI5pyN5Yqh56uvIHJhbmsg5qC85byP77yaMy0xN++8iVxuICAgICAqL1xuICAgIF9leHRyYWN0TWFpblJhbms6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgLy8g5LyY5YWI5L2/55So5pyN5Yqh56uv5Lyg6YCS55qEIHJhbmtcbiAgICAgICAgaWYgKGRhdGEucmFuayAmJiBkYXRhLnJhbmsgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS5yYW5rXG4gICAgICAgIH1cblxuICAgICAgICAvLyDlpoLmnpzmnI3liqHnq68gcmFuayDml6DmlYjvvIzku44gY2FyZHMg5Lit5o+Q5Y+WXG4gICAgICAgIHZhciBjYXJkcyA9IGRhdGEuY2FyZHMgfHwgW11cbiAgICAgICAgdmFyIGhhbmRUeXBlID0gKGRhdGEuaGFuZF90eXBlIHx8IFwiXCIpLnRvTG93ZXJDYXNlKClcblxuICAgICAgICBpZiAoY2FyZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn5SKIFtfZXh0cmFjdE1haW5SYW5rXSBjYXJkc+aVsOe7hOS4uuepuu+8jOaXoOazleaPkOWPlnJhbmtcIilcbiAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgIH1cblxuICAgICAgICAvLyDlr7kgY2FyZHMg6L+b6KGM5o6S5bqP77yI5LuO5aSn5Yiw5bCP77yJXG4gICAgICAgIHZhciBzb3J0ZWRDYXJkcyA9IGNhcmRzLnNsaWNlKCkuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gKGIucmFuayB8fCAwKSAtIChhLnJhbmsgfHwgMClcbiAgICAgICAgfSlcblxuXG4gICAgICAgIC8vIOagueaNrueJjOWei+aPkOWPluS4u+eJjFxuICAgICAgICAvLyDljZXlvKBcbiAgICAgICAgaWYgKGhhbmRUeXBlLmluZGV4T2YoXCJzaW5nbGVcIikgIT09IC0xIHx8IGhhbmRUeXBlLmluZGV4T2YoXCLljZXlvKBcIikgIT09IC0xKSB7XG4gICAgICAgICAgICB2YXIgcmFuayA9IHRoaXMuX2V4dHJhY3RDYXJkUmFuayhzb3J0ZWRDYXJkc1swXSlcbiAgICAgICAgICAgIHJldHVybiByYW5rXG4gICAgICAgIH1cblxuICAgICAgICAvLyDlr7nlrZAgLSDlj5bku7vmhI/kuIDlvKDnmoRyYW5r77yI5a6D5Lus55u45ZCM77yJXG4gICAgICAgIGlmIChoYW5kVHlwZS5pbmRleE9mKFwicGFpclwiKSAhPT0gLTEgfHwgaGFuZFR5cGUuaW5kZXhPZihcIuWvueWtkFwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gdGhpcy5fZXh0cmFjdENhcmRSYW5rKHNvcnRlZENhcmRzWzBdKVxuICAgICAgICAgICAgcmV0dXJuIHJhbmtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS4ieW8oCAtIOWPluS4ieW8oOS4reS7u+aEj+S4gOW8oOeahHJhbmtcbiAgICAgICAgaWYgKGhhbmRUeXBlLmluZGV4T2YoXCJ0cmlwbGVcIikgIT09IC0xIHx8IGhhbmRUeXBlLmluZGV4T2YoXCLkuInlvKBcIikgIT09IC0xIHx8IFxuICAgICAgICAgICAgaGFuZFR5cGUuaW5kZXhPZihcInRyaW9cIikgIT09IC0xIHx8IGhhbmRUeXBlLmluZGV4T2YoXCJ0aHJlZVwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHZhciByYW5rID0gdGhpcy5fZXh0cmFjdENhcmRSYW5rKHNvcnRlZENhcmRzWzBdKVxuICAgICAgICAgICAgcmV0dXJuIHJhbmtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS4ieW4puS4gC/kuInluKbkuowgLSDlj5bmnIDlpKfnmoTkuInlvKBcbiAgICAgICAgaWYgKGhhbmRUeXBlLmluZGV4T2YoXCJzYW5kYWl5aVwiKSAhPT0gLTEgfHwgaGFuZFR5cGUuaW5kZXhPZihcIuS4ieW4puS4gFwiKSAhPT0gLTEgfHxcbiAgICAgICAgICAgIGhhbmRUeXBlLmluZGV4T2YoXCJzYW5kYWlkdWlcIikgIT09IC0xIHx8IGhhbmRUeXBlLmluZGV4T2YoXCLkuInluKbkuoxcIikgIT09IC0xKSB7XG4gICAgICAgICAgICAvLyDnu5/orqHmr4/kuKpyYW5r5Ye6546w55qE5qyh5pWwXG4gICAgICAgICAgICB2YXIgY291bnRzID0ge31cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FyZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgciA9IGNhcmRzW2ldLnJhbmtcbiAgICAgICAgICAgICAgICBjb3VudHNbcl0gPSAoY291bnRzW3JdIHx8IDApICsgMVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5om+5Yiw5Ye6546w5qyh5pWw5pyA5aSa55qEcmFua1xuICAgICAgICAgICAgdmFyIG1heENvdW50ID0gMFxuICAgICAgICAgICAgdmFyIG1haW5SYW5rID0gMFxuICAgICAgICAgICAgZm9yICh2YXIgciBpbiBjb3VudHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoY291bnRzW3JdID49IDMgJiYgY291bnRzW3JdID4gbWF4Q291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF4Q291bnQgPSBjb3VudHNbcl1cbiAgICAgICAgICAgICAgICAgICAgbWFpblJhbmsgPSBwYXJzZUludChyKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtYWluUmFua1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5YW25LuW54mM5Z6LIC0g5Y+W5pyA5aSn55qE54mMXG4gICAgICAgIHZhciByYW5rID0gdGhpcy5fZXh0cmFjdENhcmRSYW5rKHNvcnRlZENhcmRzWzBdKVxuICAgICAgICByZXR1cm4gcmFua1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ6L6F5Yqp44CR5LuO5Y2V5LiqY2FyZOWvueixoeS4reaPkOWPlnJhbmtcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2FyZCAtIOWNoeeJjOWvueixoVxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9IHJhbmvlgLxcbiAgICAgKi9cbiAgICBfZXh0cmFjdENhcmRSYW5rOiBmdW5jdGlvbihjYXJkKSB7XG4gICAgICAgIGlmICghY2FyZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+UiiBbX2V4dHJhY3RDYXJkUmFua10gY2FyZOS4uuepulwiKVxuICAgICAgICAgICAgcmV0dXJuIDBcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWwneivleWQhOenjeWPr+iDveeahOWtl+autVxuICAgICAgICBpZiAoY2FyZC5yYW5rICE9PSB1bmRlZmluZWQgJiYgY2FyZC5yYW5rID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIE51bWJlcihjYXJkLnJhbmspXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNhcmQudmFsdWUgIT09IHVuZGVmaW5lZCAmJiBjYXJkLnZhbHVlID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIE51bWJlcihjYXJkLnZhbHVlKVxuICAgICAgICB9XG4gICAgICAgIGlmIChjYXJkLmxvZ2ljX3ZhbHVlICE9PSB1bmRlZmluZWQgJiYgY2FyZC5sb2dpY192YWx1ZSA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiBOdW1iZXIoY2FyZC5sb2dpY192YWx1ZSlcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FyZC5jYXJkX2RhdGEgJiYgY2FyZC5jYXJkX2RhdGEucmFuayAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gTnVtYmVyKGNhcmQuY2FyZF9kYXRhLnJhbmspXG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLndhcm4oXCLwn5SKIFtfZXh0cmFjdENhcmRSYW5rXSDml6Dms5Xmj5Dlj5ZyYW5r77yMY2FyZDpcIiwgSlNPTi5zdHJpbmdpZnkoY2FyZCkpXG4gICAgICAgIHJldHVybiAwXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmoLjlv4Pkv67lpI3jgJHmnI3liqHnq68gcmFuayDovazmjaLkuLrpn7PmlYjmlofku7bnvJblj7dcbiAgICAgKiBcbiAgICAgKiDmnI3liqHnq68gcmFuayDlrprkuYnvvJpcbiAgICAgKiAtIDMtMTAgPSAzLTEwXG4gICAgICogLSBKPTExLCBRPTEyLCBLPTEzLCBBPTE0LCAyPTE1XG4gICAgICogLSDlsI/njos9MTYsIOWkp+eOiz0xN1xuICAgICAqIFxuICAgICAqIOmfs+aViOaWh+S7tue8luWPt++8mlxuICAgICAqIC0gMSA9IEFcbiAgICAgKiAtIDIgPSAyXG4gICAgICogLSAzLTEzID0gMy1LXG4gICAgICogLSAxNCA9IOWwj+eOi1xuICAgICAqIC0gMTUgPSDlpKfnjotcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gcmFuayAtIOacjeWKoeerr+eJjOmdouWAvCAoMy0xNylcbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfSDpn7PmlYjmlofku7bnvJblj7cgKDEtMTUp77yM5aaC5p6c5peg5rOV6L2s5o2i6L+U5ZueIDBcbiAgICAgKi9cbiAgICBfcmFua1RvU291bmRJbmRleDogZnVuY3Rpb24ocmFuaykge1xuICAgICAgICBpZiAocmFuayA9PT0gMTQpIHJldHVybiAxICAgLy8gQSDihpIgMVxuICAgICAgICBpZiAocmFuayA9PT0gMTUpIHJldHVybiAyICAgLy8gMiDihpIgMlxuICAgICAgICBpZiAocmFuayA+PSAzICYmIHJhbmsgPD0gMTMpIHJldHVybiByYW5rICAvLyAzLUsg55u05o6l5L2/55SoXG4gICAgICAgIGlmIChyYW5rID09PSAxNikgcmV0dXJuIDE0ICAvLyDlsI/njosg4oaSIDE0XG4gICAgICAgIGlmIChyYW5rID09PSAxNykgcmV0dXJuIDE1ICAvLyDlpKfnjosg4oaSIDE1XG4gICAgICAgIHJldHVybiAwICAvLyDml6DmlYhcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+UiiDmoLnmja7niYzlnovojrflj5bpn7PmlYjlkI3np7BcbiAgICAgKiDwn5Sn44CQ5L+u5aSN44CR5L2/55SoIGluZGV4T2Yg5Yy56YWN5Lit5paH54mM5Z6L5ZCN56ew77yM56Gu5L+d5YW85a655pyN5Yqh56uv5Y+R6YCB55qE5Lit5paH5ZCN56ewXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGhhbmRUeXBlIC0g54mM5Z6L5ZCN56ewXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHJhbmsgLSDkuLvniYzngrnmlbAgKOacjeWKoeerr+WumuS5iTogMy0xNywgQT0xNCwgMj0xNSwg5bCP546LPTE2LCDlpKfnjos9MTcpXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGdlbmRlciAtIOaAp+WIq1xuICAgICAqIEByZXR1cm5zIHtTdHJpbmd9IOmfs+aViOWQjeensO+8iOS4jeWQq+i3r+W+hOWSjOaJqeWxleWQje+8ie+8jOWmguaenOayoeacieWvueW6lOmfs+aViOi/lOWbnm51bGxcbiAgICAgKi9cbiAgICBfZ2V0Q2FyZFR5cGVTb3VuZDogZnVuY3Rpb24oaGFuZFR5cGUsIHJhbmssIGdlbmRlcikge1xuICAgICAgICB2YXIgdHlwZSA9IChoYW5kVHlwZSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIHZhciBwcmVmaXggPSBnZW5kZXIgPT09IFwiZmVtYWxlXCIgPyBcIm1fY3BfbnZfXCIgOiBcIm1fY3BfXCJcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlkIjms5XmgKfmoKHpqozjgJHmo4Dmn6VyYW5r5piv5ZCm5pyJ5pWIXG4gICAgICAgIGlmICghcmFuayB8fCByYW5rID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+UiiBbX2dldENhcmRUeXBlU291bmRdIOmdnuazlXJhbms6IFwiICsgcmFuayArIFwiLCBoYW5kVHlwZT1cIiArIGhhbmRUeXBlKVxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeWwhuacjeWKoeerryByYW5rIOi9rOaNouS4uumfs+aViOaWh+S7tue8luWPt1xuICAgICAgICB2YXIgc291bmRJbmRleCA9IHRoaXMuX3JhbmtUb1NvdW5kSW5kZXgocmFuaylcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICAvLyDljZXlvKDvvIjmlK/mjIHkuK3oi7HmlofvvIlcbiAgICAgICAgLy8g5pyN5Yqh56uv5Y+R6YCBOiBcIuWNleW8oFwiXG4gICAgICAgIC8vIOmfs+aViOaWh+S7tue8luWPt++8mjE9QSwgMj0yLCAzLTEzPTMtSywgMTQ95bCP546LLCAxNT3lpKfnjotcbiAgICAgICAgaWYgKHR5cGUgPT09IFwic2luZ2xlXCIgfHwgdHlwZSA9PT0gXCJzb2xvXCIgfHwgdHlwZS5pbmRleE9mKFwi5Y2V5bygXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgaWYgKHNvdW5kSW5kZXggPj0gMSAmJiBzb3VuZEluZGV4IDw9IDE1KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZWZpeCArIFwiZGFuemhhbmdfXCIgKyBzb3VuZEluZGV4XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn5SKIFtfZ2V0Q2FyZFR5cGVTb3VuZF0g5Y2V5byg6Z+z5pWI57Si5byV5peg5pWIOiByYW5rPVwiICsgcmFuayArIFwiLCBzb3VuZEluZGV4PVwiICsgc291bmRJbmRleClcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWvueWtkO+8iOaUr+aMgeS4reiLseaWh++8iVxuICAgICAgICAvLyDmnI3liqHnq6/lj5HpgIE6IFwi5a+55a2QXCJcbiAgICAgICAgLy8g6Z+z5pWI5paH5Lu257yW5Y+377yaMT1BLCAyPTIsIDMtMTM9My1L77yI5rOo5oSP77ya5paH5Lu25Y+q5pyJMS0xM++8jOayoeaciTE0LzE177yJXG4gICAgICAgIGlmICh0eXBlID09PSBcInBhaXJcIiB8fCB0eXBlID09PSBcImRvdWJsZVwiIHx8IHR5cGUuaW5kZXhPZihcIuWvueWtkFwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChzb3VuZEluZGV4ID49IDEgJiYgc291bmRJbmRleCA8PSAxMykge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmVmaXggKyBcImR1aXppX1wiICsgc291bmRJbmRleFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+UiiBbX2dldENhcmRUeXBlU291bmRdIOWvueWtkOmfs+aViOaWh+S7tuS4jeWtmOWcqDogcmFuaz1cIiArIHJhbmsgKyBcIiwgc291bmRJbmRleD1cIiArIHNvdW5kSW5kZXgpXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDkuInlvKDvvIjmlK/mjIHkuK3oi7HmlofvvIlcbiAgICAgICAgLy8g5pyN5Yqh56uv5Y+R6YCBOiBcIuS4ieW8oFwiXG4gICAgICAgIC8vIOmfs+aViOaWh+S7tue8luWPt++8mjE9QSwgMj0yLCAzLTEzPTMtS++8iOazqOaEj++8muaWh+S7tuWPquaciTEtMTPvvIlcbiAgICAgICAgaWYgKHR5cGUgPT09IFwidHJpcGxlXCIgfHwgdHlwZSA9PT0gXCJ0aHJlZVwiIHx8IHR5cGUgPT09IFwidHJpb1wiIHx8IHR5cGUuaW5kZXhPZihcIuS4ieW8oFwiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGlmIChzb3VuZEluZGV4ID49IDEgJiYgc291bmRJbmRleCA8PSAxMykge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmVmaXggKyBcInNhbmdlX1wiICsgc291bmRJbmRleFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+UiiBbX2dldENhcmRUeXBlU291bmRdIOS4ieW8oOmfs+aViOaWh+S7tuS4jeWtmOWcqDogcmFuaz1cIiArIHJhbmsgKyBcIiwgc291bmRJbmRleD1cIiArIHNvdW5kSW5kZXgpXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR54m55q6K54mM5Z6L5pig5bCE6KGo77yI5pSv5oyB5Lit6Iux5paH77yJXG4gICAgICAgIHZhciBzcGVjaWFsVHlwZXMgPSB7XG4gICAgICAgICAgICAvLyDoi7HmloflkI3np7BcbiAgICAgICAgICAgIFwibGlhbmR1aVwiOiBcImxpYW5kdWlcIiwgICAgICAgICAgIC8vIOi/nuWvuVxuICAgICAgICAgICAgXCJzdHJhaWdodFwiOiBcInNodW56aVwiLCAgICAgICAgICAgLy8g6aG65a2QXG4gICAgICAgICAgICBcInBsYW5lXCI6IFwiZmVpamlcIiwgICAgICAgICAgICAgICAvLyDpo57mnLpcbiAgICAgICAgICAgIFwiZmVpamlcIjogXCJmZWlqaVwiLCAgICAgICAgICAgICAgIC8vIOmjnuaculxuICAgICAgICAgICAgXCJzYW5kYWl5aVwiOiBcInNhbmRhaXlpXCIsICAgICAgICAgLy8g5LiJ5bim5LiAXG4gICAgICAgICAgICBcInNhbmRhaWR1aVwiOiBcInNhbmRhaWR1aVwiLCAgICAgICAvLyDkuInluKblr7lcbiAgICAgICAgICAgIFwic2lkYWllclwiOiBcInNpZGFpZXJcIiwgICAgICAgICAgIC8vIOWbm+W4puS6jFxuICAgICAgICAgICAgXCJzaWRhaWxpYW5nZHVpXCI6IFwic2lkYWlsaWFuZ2R1aVwiLCAvLyDlm5vluKbkuKTlr7lcbiAgICAgICAgICAgIFwiYm9tYlwiOiBcInpoYWRhblwiLCAgICAgICAgICAgICAgIC8vIOeCuOW8uVxuICAgICAgICAgICAgXCJ6aGFkYW5cIjogXCJ6aGFkYW5cIiwgICAgICAgICAgICAgLy8g54K45by5XG4gICAgICAgICAgICBcInJvY2tldFwiOiBcIndhbmd6aGFcIiwgICAgICAgICAgICAvLyDnjovngrhcbiAgICAgICAgICAgIFwid2FuZ3poYVwiOiBcIndhbmd6aGFcIiwgICAgICAgICAgIC8vIOeOi+eCuFxuICAgICAgICAgICAgLy8g5Lit5paH5ZCN56ew77yI5pyN5Yqh56uv5Y+R6YCB55qE5ZCN56ew77yJXG4gICAgICAgICAgICBcIui/nuWvuVwiOiBcImxpYW5kdWlcIixcbiAgICAgICAgICAgIFwi6aG65a2QXCI6IFwic2h1bnppXCIsXG4gICAgICAgICAgICBcIumjnuaculwiOiBcImZlaWppXCIsXG4gICAgICAgICAgICBcIumjnuacuuW4puWNlVwiOiBcImZlaWppXCIsXG4gICAgICAgICAgICBcIumjnuacuuW4puWvuVwiOiBcImZlaWppXCIsXG4gICAgICAgICAgICBcIuS4ieW4puS4gFwiOiBcInNhbmRhaXlpXCIsXG4gICAgICAgICAgICBcIuS4ieW4puS6jFwiOiBcInNhbmRhaWR1aVwiLFxuICAgICAgICAgICAgXCLlm5vluKbkuoxcIjogXCJzaWRhaWVyXCIsXG4gICAgICAgICAgICBcIuWbm+W4puS4pOWvuVwiOiBcInNpZGFpbGlhbmdkdWlcIixcbiAgICAgICAgICAgIFwi54K45by5XCI6IFwiemhhZGFuXCIsXG4gICAgICAgICAgICBcIueOi+eCuFwiOiBcIndhbmd6aGFcIlxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmn6Xmib7nibnmrorniYzlnotcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHNwZWNpYWxUeXBlcykge1xuICAgICAgICAgICAgaWYgKHR5cGUuaW5kZXhPZihrZXkpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHZhciBzdWZmaXggPSBzcGVjaWFsVHlwZXNba2V5XVxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlpbPniYjngrjlvLnkvb/nlKggbV9jcF9udl96aGFkYW7vvIjlpoLmnpzlrZjlnKjvvInvvIzlkKbliJnkvb/nlKjnlLfniYhcbiAgICAgICAgICAgICAgICAvLyDms6jmhI/vvJrnm67liY0gbV9jcF9udl96aGFkYW4ubXAzIOS4jeWtmOWcqO+8jOaJgOS7peWls+eJiOS5n+S9v+eUqOeUt+eJiOeCuOW8uemfs+aViFxuICAgICAgICAgICAgICAgIGlmIChzdWZmaXggPT09IFwiemhhZGFuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5YWI5bCd6K+V5aWz54mI54K45by56Z+z5pWIXG4gICAgICAgICAgICAgICAgICAgIGlmIChnZW5kZXIgPT09IFwiZmVtYWxlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcIm1fY3BfemhhZGFuXCIgIC8vIOWls+eJiOaaguaXtuS9v+eUqOeUt+eJiOeCuOW8uemfs+aViO+8iOWboOS4um1fY3BfbnZfemhhZGFu5LiN5a2Y5Zyo77yJXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibV9jcF96aGFkYW5cIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5aWz54mI546L54K45pyJ5Y2V54us6Z+z5pWIXG4gICAgICAgICAgICAgICAgaWYgKHN1ZmZpeCA9PT0gXCJ3YW5nemhhXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByZWZpeCArIFwid2FuZ3poYVwiXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwcmVmaXggKyBzdWZmaXhcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pyq55+l54mM5Z6L77yM6L+U5ZuebnVsbFxuICAgICAgICBjb25zb2xlLndhcm4oXCLwn5SKIFtfZ2V0Q2FyZFR5cGVTb3VuZF0g5pyq55+l54mM5Z6LOiBcIiArIHR5cGUpXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflIog5pKt5pS+5LiN5Ye66Z+z5pWI77yI6ZqP5py65pKt5pS+XCLkuI3opoFcIi9cIuimgeS4jei1t1wi77yJXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSDmnI3liqHnq6/lub/mkq3nmoTmlbDmja5cbiAgICAgKiAgIC0gZ2VuZGVyOiBcIm1hbGVcIiAvIFwiZmVtYWxlXCJcbiAgICAgKi9cbiAgICBfcGxheVBhc3NTb3VuZDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBpZiAoIWlzb3Blbl9zb3VuZCkgcmV0dXJuXG5cbiAgICAgICAgdmFyIGdlbmRlciA9IGRhdGEuZ2VuZGVyIHx8IFwibWFsZVwiXG4gICAgICAgIFxuICAgICAgICAvLyDnlLfniYjvvJrpmo/mnLrmkq3mlL5cIuS4jeimgVwi5oiWXCLopoHkuI3otbdcIlxuICAgICAgICAvLyDmlofku7bvvJptX2NwX2J1eWFvLm1wMywgbV9jcF95YW9idXFpLm1wM1xuICAgICAgICAvLyDlpbPniYjvvJrpmo/mnLrmkq3mlL5cIuS4jeimgVwi5oiWXCLopoHkuI3otbdcIlxuICAgICAgICAvLyDmlofku7bvvJptX2NwX252X2J1eWFvLm1wMywgbV9udl95YW9idXFpLndhdlxuICAgICAgICBcbiAgICAgICAgdmFyIHNvdW5kc1xuICAgICAgICBpZiAoZ2VuZGVyID09PSBcImZlbWFsZVwiKSB7XG4gICAgICAgICAgICBzb3VuZHMgPSBbXCJtX2NwX252X2J1eWFvXCIsIFwibV9udl95YW9idXFpXCJdXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzb3VuZHMgPSBbXCJtX2NwX2J1eWFvXCIsIFwibV9jcF95YW9idXFpXCJdXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmaj+acuumAieaLqeS4gOS4qlxuICAgICAgICB2YXIgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzb3VuZHMubGVuZ3RoKVxuICAgICAgICB2YXIgc291bmROYW1lID0gc291bmRzW3JhbmRvbUluZGV4XVxuXG4gICAgICAgIHRoaXMuX3BsYXlTb3VuZEVmZmVjdChzb3VuZE5hbWUpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflIog5pKt5pS+6IOc5YipL+Wksei0pemfs+aViFxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNXaW4gLSDmmK/lkKbog5zliKlcbiAgICAgKi9cbiAgICBfcGxheUdhbWVSZXN1bHRTb3VuZDogZnVuY3Rpb24oaXNXaW4pIHtcbiAgICAgICAgaWYgKCFpc29wZW5fc291bmQpIHJldHVyblxuXG4gICAgICAgIHZhciBzb3VuZE5hbWUgPSBpc1dpbiA/IFwibV95aW5nbGVcIiA6IFwibV9zaHVsZVwiXG4gICAgICAgIHRoaXMuX3BsYXlTb3VuZEVmZmVjdChzb3VuZE5hbWUpXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflIog5pi+56S65LiN5Ye65pWI5p6cXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGFjY291bnRpZCAtIOeOqeWutklEXG4gICAgICovXG4gICAgX3Nob3dQYXNzRWZmZWN0OiBmdW5jdGlvbihhY2NvdW50aWQpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmo4Dmn6Ugbm9kZS5wYXJlbnQg5piv5ZCm5a2Y5ZyoXG4gICAgICAgIGlmICghdGhpcy5ub2RlIHx8ICF0aGlzLm5vZGUuaXNWYWxpZCB8fCAhdGhpcy5ub2RlLnBhcmVudCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+DjyBbX3Nob3dQYXNzRWZmZWN0XSBub2RlIOaIliBub2RlLnBhcmVudCDmnKrlrprkuYnmiJblt7LplIDmr4FcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5blr7nlupTnjqnlrrbnmoTlh7rniYzljLrln59cbiAgICAgICAgdmFyIGdhbWVTY2VuZV9zY3JpcHQgPSB0aGlzLm5vZGUucGFyZW50LmdldENvbXBvbmVudChcImdhbWVTY2VuZVwiKVxuICAgICAgICBpZiAoIWdhbWVTY2VuZV9zY3JpcHQpIHJldHVyblxuXG4gICAgICAgIHZhciBvdXRDYXJkX25vZGUgPSBnYW1lU2NlbmVfc2NyaXB0LmdldFVzZXJPdXRDYXJkUG9zQnlBY2NvdW50KGFjY291bnRpZClcbiAgICAgICAgaWYgKCFvdXRDYXJkX25vZGUpIHJldHVyblxuXG4gICAgICAgIC8vIOa4heepuuWHuueJjOWMuuWfn1xuICAgICAgICBvdXRDYXJkX25vZGUucmVtb3ZlQWxsQ2hpbGRyZW4odHJ1ZSlcblxuICAgICAgICAvLyDliJvlu7pcIuS4jeWHulwi5paH5a2X5pi+56S6XG4gICAgICAgIHZhciBwYXNzTm9kZSA9IG5ldyBjYy5Ob2RlKFwicGFzc19sYWJlbFwiKVxuICAgICAgICB2YXIgbGFiZWwgPSBwYXNzTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGxhYmVsLnN0cmluZyA9IFwi5LiN5Ye6XCJcbiAgICAgICAgbGFiZWwuZm9udFNpemUgPSAyOFxuICAgICAgICBsYWJlbC5saW5lSGVpZ2h0ID0gMzZcbiAgICAgICAgcGFzc05vZGUuY29sb3IgPSBjYy5jb2xvcigyNTUsIDIwMCwgMTAwKVxuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg5o+P6L65XG4gICAgICAgIHZhciBvdXRsaW5lID0gcGFzc05vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSlcbiAgICAgICAgb3V0bGluZS5jb2xvciA9IGNjLmNvbG9yKDEwMCwgNTAsIDApXG4gICAgICAgIG91dGxpbmUud2lkdGggPSAyXG4gICAgICAgIFxuICAgICAgICBwYXNzTm9kZS5wYXJlbnQgPSBvdXRDYXJkX25vZGVcbiAgICAgICAgcGFzc05vZGUuc2V0UG9zaXRpb24oMCwgMClcblxuICAgICAgICAvLyAy56eS5ZCO6Ieq5Yqo5raI5aSxXG4gICAgICAgIHRoaXMuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHBhc3NOb2RlICYmIHBhc3NOb2RlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICBwYXNzTm9kZS5kZXN0cm95KClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMilcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeiOt+WPlueJjOeahOaYvuekuuWQjeensFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjYXJkIC0g54mM5pWw5o2uIHtzdWl0LCByYW5rfVxuICAgICAqIEByZXR1cm5zIHtTdHJpbmd9IOeJjOeahOS4reaWh+WQjeensO+8jOWmgiBcIuWkp+eOi1wi44CBXCLlsI/njotcIuOAgVwi6buR5qGDQVwiIOetiVxuICAgICAqL1xuICAgIF9nZXRDYXJkRGlzcGxheU5hbWU6IGZ1bmN0aW9uKGNhcmQpIHtcbiAgICAgICAgaWYgKCFjYXJkKSByZXR1cm4gXCLmnKrnn6XniYxcIlxuICAgICAgICBcbiAgICAgICAgdmFyIHN1aXQgPSBjYXJkLnN1aXRcbiAgICAgICAgdmFyIHJhbmsgPSBjYXJkLnJhbmtcbiAgICAgICAgXG4gICAgICAgIC8vIOWkp+Wwj+eOi1xuICAgICAgICBpZiAocmFuayA9PT0gMTcpIHJldHVybiBcIuWkp+eOi1wiXG4gICAgICAgIGlmIChyYW5rID09PSAxNikgcmV0dXJuIFwi5bCP546LXCJcbiAgICAgICAgXG4gICAgICAgIC8vIOiKseiJsuWQjeensFxuICAgICAgICB2YXIgc3VpdE5hbWVzID0geyAwOiBcIum7keahg1wiLCAxOiBcIue6ouW/g1wiLCAyOiBcIuaiheiKsVwiLCAzOiBcIuaWueWdl1wiLCA0OiBcIlwiIH1cbiAgICAgICAgdmFyIHN1aXROYW1lID0gc3VpdE5hbWVzW3N1aXRdIHx8IFwiXCJcbiAgICAgICAgXG4gICAgICAgIC8vIOeJjOmdouWQjeensFxuICAgICAgICB2YXIgcmFua05hbWVzID0ge1xuICAgICAgICAgICAgMzogXCIzXCIsIDQ6IFwiNFwiLCA1OiBcIjVcIiwgNjogXCI2XCIsIDc6IFwiN1wiLCA4OiBcIjhcIiwgOTogXCI5XCIsXG4gICAgICAgICAgICAxMDogXCIxMFwiLCAxMTogXCJKXCIsIDEyOiBcIlFcIiwgMTM6IFwiS1wiLCAxNDogXCJBXCIsIDE1OiBcIjJcIlxuICAgICAgICB9XG4gICAgICAgIHZhciByYW5rTmFtZSA9IHJhbmtOYW1lc1tyYW5rXSB8fCBTdHJpbmcocmFuaylcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBzdWl0TmFtZSArIHJhbmtOYW1lXG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIPCflKfjgJDmlrDlop7jgJHlrqLmiLfnq6/niYzlnovpqozor4FcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHpqozor4HniYzlnovmmK/lkKbmnInmlYhcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBjYXJkcyAtIOimgemqjOivgeeahOeJjOaVsOaNriBbe3N1aXQsIHJhbmssIGNvbG9yfSwgLi4uXVxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IHt2YWxpZDogYm9vbGVhbiwgdHlwZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmd9XG4gICAgICovXG4gICAgX3ZhbGlkYXRlSGFuZFR5cGU6IGZ1bmN0aW9uKGNhcmRzKSB7XG4gICAgICAgIGlmICghY2FyZHMgfHwgY2FyZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWxpZDogZmFsc2UsIHR5cGU6IFwiXCIsIG1lc3NhZ2U6IFwi6K+36YCJ5oup6KaB5Ye655qE54mMXCIgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNvdW50ID0gY2FyZHMubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICAvLyDnu5/orqHlkITngrnmlbDnmoTniYzmlbDph49cbiAgICAgICAgdmFyIHJhbmtDb3VudHMgPSB7fVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmFuayA9IGNhcmRzW2ldLnJhbmtcbiAgICAgICAgICAgIGlmICghcmFua0NvdW50c1tyYW5rXSkge1xuICAgICAgICAgICAgICAgIHJhbmtDb3VudHNbcmFua10gPSAwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByYW5rQ291bnRzW3JhbmtdKytcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOiOt+WPlueCueaVsOWIl+ihqO+8iOaOkuW6j+WQju+8iVxuICAgICAgICB2YXIgcmFua3MgPSBPYmplY3Qua2V5cyhyYW5rQ291bnRzKS5tYXAoZnVuY3Rpb24ocikgeyByZXR1cm4gcGFyc2VJbnQocikgfSkuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhIC0gYiB9KVxuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+W5pWw6YeP57uf6K6hXG4gICAgICAgIHZhciBjb3VudHMgPSBPYmplY3QudmFsdWVzKHJhbmtDb3VudHMpXG4gICAgICAgIHZhciBmb3VycyA9IFtdICAvLyDlm5vlvKBcbiAgICAgICAgdmFyIHRocmVlcyA9IFtdIC8vIOS4ieW8oFxuICAgICAgICB2YXIgcGFpcnMgPSBbXSAgLy8g5a+55a2QXG4gICAgICAgIHZhciBzaW5nbGVzID0gW10gLy8g5Y2V5bygXG4gICAgICAgIFxuICAgICAgICBmb3IgKHZhciByYW5rIGluIHJhbmtDb3VudHMpIHtcbiAgICAgICAgICAgIHZhciBjID0gcmFua0NvdW50c1tyYW5rXVxuICAgICAgICAgICAgaWYgKGMgPT09IDQpIGZvdXJzLnB1c2gocGFyc2VJbnQocmFuaykpXG4gICAgICAgICAgICBlbHNlIGlmIChjID09PSAzKSB0aHJlZXMucHVzaChwYXJzZUludChyYW5rKSlcbiAgICAgICAgICAgIGVsc2UgaWYgKGMgPT09IDIpIHBhaXJzLnB1c2gocGFyc2VJbnQocmFuaykpXG4gICAgICAgICAgICBlbHNlIGlmIChjID09PSAxKSBzaW5nbGVzLnB1c2gocGFyc2VJbnQocmFuaykpXG4gICAgICAgIH1cblxuICAgICAgICAvLyAxLiDnjovngrjvvIjlj4znjovvvIlcbiAgICAgICAgaWYgKGNvdW50ID09PSAyICYmIHJhbmtDb3VudHNbMTZdID09PSAxICYmIHJhbmtDb3VudHNbMTddID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgdHlwZTogXCLnjovngrhcIiwgbWVzc2FnZTogXCJcIiB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyAyLiDljZXlvKBcbiAgICAgICAgaWYgKGNvdW50ID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgdHlwZTogXCLljZXlvKBcIiwgbWVzc2FnZTogXCJcIiB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyAzLiDlr7nlrZBcbiAgICAgICAgaWYgKGNvdW50ID09PSAyICYmIHBhaXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUsIHR5cGU6IFwi5a+55a2QXCIsIG1lc3NhZ2U6IFwiXCIgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gNC4g5LiJ5bygXG4gICAgICAgIGlmIChjb3VudCA9PT0gMyAmJiB0aHJlZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgdHlwZTogXCLkuInlvKBcIiwgbWVzc2FnZTogXCJcIiB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyA1LiDngrjlvLlcbiAgICAgICAgaWYgKGNvdW50ID09PSA0ICYmIGZvdXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUsIHR5cGU6IFwi54K45by5XCIsIG1lc3NhZ2U6IFwiXCIgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gNi4g5LiJ5bim5LiAXG4gICAgICAgIGlmIChjb3VudCA9PT0gNCAmJiB0aHJlZXMubGVuZ3RoID09PSAxICYmIHNpbmdsZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgdHlwZTogXCLkuInluKbkuIBcIiwgbWVzc2FnZTogXCJcIiB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyA3LiDkuInluKbkuoxcbiAgICAgICAgaWYgKGNvdW50ID09PSA1ICYmIHRocmVlcy5sZW5ndGggPT09IDEgJiYgcGFpcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgdHlwZTogXCLkuInluKbkuoxcIiwgbWVzc2FnZTogXCJcIiB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyA4LiDlm5vluKbkuozvvIjljZXvvIlcbiAgICAgICAgaWYgKGNvdW50ID09PSA2ICYmIGZvdXJzLmxlbmd0aCA9PT0gMSAmJiAoc2luZ2xlcy5sZW5ndGggPT09IDIgfHwgcGFpcnMubGVuZ3RoID09PSAxKSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUsIHR5cGU6IFwi5Zub5bim5LqMXCIsIG1lc3NhZ2U6IFwiXCIgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gOS4g5Zub5bim5Lik5a+5XG4gICAgICAgIGlmIChjb3VudCA9PT0gOCAmJiBmb3Vycy5sZW5ndGggPT09IDEgJiYgcGFpcnMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgdHlwZTogXCLlm5vluKbkuKTlr7lcIiwgbWVzc2FnZTogXCJcIiB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyAxMC4g6aG65a2Q77yI6Iez5bCRNeW8oOi/nue7re+8jOS4jeWMheWQqzLlkoznjovvvIlcbiAgICAgICAgaWYgKGNvdW50ID49IDUgJiYgc2luZ2xlcy5sZW5ndGggPT09IGNvdW50KSB7XG4gICAgICAgICAgICAvLyDmo4Dmn6XmmK/lkKbov57nu63kuJTkuI3ljIXlkKsy5ZKM546LXG4gICAgICAgICAgICB2YXIgaXNTZXF1ZW50aWFsID0gdGhpcy5faXNTZXF1ZW50aWFsKHJhbmtzKVxuICAgICAgICAgICAgdmFyIG5vVHdvT3JKb2tlciA9IHJhbmtzLmV2ZXJ5KGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHIgPCAxNSB9KSAvLyByYW5rIDwgMTUg6KGo56S65LiN5pivMuWSjOeOi1xuICAgICAgICAgICAgaWYgKGlzU2VxdWVudGlhbCAmJiBub1R3b09ySm9rZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyB2YWxpZDogdHJ1ZSwgdHlwZTogXCLpobrlrZBcIiwgbWVzc2FnZTogXCJcIiB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyAxMS4g6L+e5a+577yI6Iez5bCRM+Wvuei/nue7re+8iVxuICAgICAgICBpZiAoY291bnQgPj0gNiAmJiBjb3VudCAlIDIgPT09IDAgJiYgcGFpcnMubGVuZ3RoID09PSBjb3VudCAvIDIpIHtcbiAgICAgICAgICAgIHZhciBwYWlyUmFua3MgPSBwYWlycy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgLSBiIH0pXG4gICAgICAgICAgICB2YXIgaXNTZXF1ZW50aWFsID0gdGhpcy5faXNTZXF1ZW50aWFsKHBhaXJSYW5rcylcbiAgICAgICAgICAgIHZhciBub1R3b09ySm9rZXIgPSBwYWlyUmFua3MuZXZlcnkoZnVuY3Rpb24ocikgeyByZXR1cm4gciA8IDE1IH0pXG4gICAgICAgICAgICBpZiAoaXNTZXF1ZW50aWFsICYmIG5vVHdvT3JKb2tlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCB0eXBlOiBcIui/nuWvuVwiLCBtZXNzYWdlOiBcIlwiIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIDEyLiDpo57mnLrvvIjoh7PlsJEy5Liq6L+e57ut5LiJ5byg77yJXG4gICAgICAgIGlmICh0aHJlZXMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgIHZhciB0aHJlZVJhbmtzID0gdGhyZWVzLnNvcnQoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAtIGIgfSlcbiAgICAgICAgICAgIHZhciBpc1NlcXVlbnRpYWwgPSB0aGlzLl9pc1NlcXVlbnRpYWwodGhyZWVSYW5rcylcbiAgICAgICAgICAgIHZhciBub1R3b09ySm9rZXIgPSB0aHJlZVJhbmtzLmV2ZXJ5KGZ1bmN0aW9uKHIpIHsgcmV0dXJuIHIgPCAxNSB9KVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaXNTZXF1ZW50aWFsICYmIG5vVHdvT3JKb2tlcikge1xuICAgICAgICAgICAgICAgIHZhciB0aHJlZUNvdW50ID0gdGhyZWVzLmxlbmd0aFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOmjnuacuuS4jeW4pue/heiGgFxuICAgICAgICAgICAgICAgIGlmIChjb3VudCA9PT0gdGhyZWVDb3VudCAqIDMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUsIHR5cGU6IFwi6aOe5py6XCIsIG1lc3NhZ2U6IFwiXCIgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDpo57mnLrluKbljZVcbiAgICAgICAgICAgICAgICBpZiAoY291bnQgPT09IHRocmVlQ291bnQgKiA0ICYmIHNpbmdsZXMubGVuZ3RoID09PSB0aHJlZUNvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbGlkOiB0cnVlLCB0eXBlOiBcIumjnuacuuW4puWNlVwiLCBtZXNzYWdlOiBcIlwiIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g6aOe5py65bim5a+5XG4gICAgICAgICAgICAgICAgaWYgKGNvdW50ID09PSB0aHJlZUNvdW50ICogNSAmJiBwYWlycy5sZW5ndGggPT09IHRocmVlQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgdmFsaWQ6IHRydWUsIHR5cGU6IFwi6aOe5py65bim5a+5XCIsIG1lc3NhZ2U6IFwiXCIgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOaXoOaViOeJjOWei1xuICAgICAgICByZXR1cm4geyB2YWxpZDogZmFsc2UsIHR5cGU6IFwiXCIsIG1lc3NhZ2U6IFwi5peg5pWI55qE54mM5Z6L77yM6K+36YeN5paw6YCJ5oupXCIgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDmo4Dmn6XngrnmlbDmmK/lkKbov57nu61cbiAgICAgKiBAcGFyYW0ge0FycmF5fSByYW5rcyAtIOaOkuW6j+WQjueahOeCueaVsOaVsOe7hFxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSDmmK/lkKbov57nu61cbiAgICAgKi9cbiAgICBfaXNTZXF1ZW50aWFsOiBmdW5jdGlvbihyYW5rcykge1xuICAgICAgICBpZiAoIXJhbmtzIHx8IHJhbmtzLmxlbmd0aCA8IDIpIHJldHVybiB0cnVlXG4gICAgICAgIFxuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHJhbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAocmFua3NbaV0gLSByYW5rc1tpLTFdICE9PSAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g8J+Up+OAkOaWsOWinuOAkee7k+eul+W8ueeql+ezu+e7n1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLyoqXG4gICAgICog8J+PhiDmmL7npLrmuLjmiI/nu5PnrpflvLnnqpdcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIOacjeWKoeerr+W5v+aSreeahOe7k+eul+aVsOaNrlxuICAgICAqL1xuICAgIF9zaG93R2FtZVJlc3VsdFBvcHVwOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgLy8g44CQ56ue5oqA5Zy644CR5qOA5p+l5piv5ZCm5piv56ue5oqA5Zy65qih5byPXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICBpZiAodGhpcy5faXNDb21wZXRpdGlvbiB8fCBkYXRhLnJvb21fY2F0ZWdvcnkgPT09IDIpIHtcbiAgICAgICAgICAgIC8vIOernuaKgOWcuuaooeW8j+S9v+eUqOeJueauiueahOe7k+eul+mhtVxuICAgICAgICAgICAgdGhpcy5fc2hvd0NvbXBldGl0aW9uUmVzdWx0UG9wdXAoZGF0YSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDliKTmlq3lvZPliY3njqnlrrbmmK/lkKbog5zliKlcbiAgICAgICAgdmFyIG15UGxheWVySWQgPSBteWdsb2JhbC5zb2NrZXQuZ2V0UGxheWVySW5mbygpLmlkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEuc2VydmVyUGxheWVySWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SURcbiAgICAgICAgdmFyIGlzV2lubmVyID0gZmFsc2VcbiAgICAgICAgdmFyIG15V2luR29sZCA9IDBcbiAgICAgICAgXG4gICAgICAgIC8vIOS7jiBwbGF5ZXJzIOaVsOe7hOS4reaJvuWIsOW9k+WJjeeOqeWutueahOe7k+aenFxuICAgICAgICBpZiAoZGF0YS5wbGF5ZXJzICYmIGRhdGEucGxheWVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEucGxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXIgPSBkYXRhLnBsYXllcnNbaV1cbiAgICAgICAgICAgICAgICBpZiAoU3RyaW5nKHBsYXllci5wbGF5ZXJfaWQpID09PSBTdHJpbmcobXlQbGF5ZXJJZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNXaW5uZXIgPSBwbGF5ZXIuaXNfd2lubmVyXG4gICAgICAgICAgICAgICAgICAgIG15V2luR29sZCA9IHBsYXllci53aW5fZ29sZFxuICAgICAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOWFvOWuueaXp+eJiOacrO+8mumAmui/hyB3aW5uZXJfaWQg5Yik5patXG4gICAgICAgICAgICBpc1dpbm5lciA9IFN0cmluZyhkYXRhLndpbm5lcl9pZCkgPT09IFN0cmluZyhteVBsYXllcklkKVxuICAgICAgICAgICAgaWYgKCFpc1dpbm5lciAmJiAhZGF0YS5pc19sYW5kbG9yZCkge1xuICAgICAgICAgICAgICAgIHZhciBpc0xhbmRsb3JkID0gbXlnbG9iYWwucGxheWVyRGF0YS5tYXN0ZXJfYWNjb3VudGlkID09PSBteVBsYXllcklkXG4gICAgICAgICAgICAgICAgaWYgKCFpc0xhbmRsb3JkKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzV2lubmVyID0gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeabtOaWsOacrOWcsOeOqeWutueahOmHkeW4geaVsOmHj1xuICAgICAgICBpZiAobXlnbG9iYWwucGxheWVyRGF0YSAmJiBteVdpbkdvbGQgIT09IDApIHtcbiAgICAgICAgICAgIHZhciBvbGRHb2xkID0gbXlnbG9iYWwucGxheWVyRGF0YS5nb2JhbF9jb3VudCB8fCAwXG4gICAgICAgICAgICB2YXIgbmV3R29sZCA9IG9sZEdvbGQgKyBteVdpbkdvbGRcbiAgICAgICAgICAgIC8vIOehruS/nemHkeW4geS4jeS4uui0n+aVsFxuICAgICAgICAgICAgaWYgKG5ld0dvbGQgPCAwKSB7XG4gICAgICAgICAgICAgICAgbmV3R29sZCA9IDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEuZ29iYWxfY291bnQgPSBuZXdHb2xkXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHmm7TmlrDmiYDmnInnjqnlrrbnmoTph5HluIHmmL7npLpcbiAgICAgICAgaWYgKGRhdGEucGxheWVycyAmJiBkYXRhLnBsYXllcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLnBsYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcGxheWVyID0gZGF0YS5wbGF5ZXJzW2ldXG4gICAgICAgICAgICAgICAgdmFyIHBsYXllcklkID0gcGxheWVyLnBsYXllcl9pZFxuICAgICAgICAgICAgICAgIHZhciBnb2xkQWZ0ZXIgPSBwbGF5ZXIuZ29sZF9hZnRlclxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlj6ropoEgZ29sZEFmdGVyID49IDAg5bCx5pu05paw5pi+56S677yI5YyF5ousIDAg55qE5oOF5Ya177yJXG4gICAgICAgICAgICAgICAgLy8g5pyN5Yqh56uv6L+U5Zue55qEIGdvbGRfYWZ0ZXIgPj0gMCDooajnpLrmn6Xor6LliLDkuobmnInmlYjmlbDmja5cbiAgICAgICAgICAgICAgICBpZiAoZ29sZEFmdGVyID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlUGxheWVyR29sZERpc3BsYXkocGxheWVySWQsIGdvbGRBZnRlcilcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzmnI3liqHnq6/msqHmnInov5Tlm57mnInmlYjnmoQgZ29sZF9hZnRlcu+8jOWImeacrOWcsOiuoeeul1xuICAgICAgICAgICAgICAgICAgICAvLyDov5nnp43mg4XlhrXkuIvvvIzlj6rmm7TmlrDlvZPliY3njqnlrrbnmoTph5HluIFcbiAgICAgICAgICAgICAgICAgICAgaWYgKFN0cmluZyhwbGF5ZXJJZCkgPT09IFN0cmluZyhteVBsYXllcklkKSAmJiBteVdpbkdvbGQgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsb2NhbEdvbGQgPSBteWdsb2JhbC5wbGF5ZXJEYXRhLmdvYmFsX2NvdW50IHx8IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVBsYXllckdvbGREaXNwbGF5KHBsYXllcklkLCBsb2NhbEdvbGQpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOaSreaUvue7k+aenOmfs+aViFxuICAgICAgICB0aGlzLl9wbGF5R2FtZVJlc3VsdFNvdW5kKGlzV2lubmVyKVxuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu657uT566X5by556qXXG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB0aGlzLl9jcmVhdGVHYW1lUmVzdWx0UG9wdXAoZGF0YSwgaXNXaW5uZXIsIG15V2luR29sZCwgZnVuY3Rpb24oYWN0aW9uKSB7XG4gICAgICAgICAgICBpZiAoYWN0aW9uID09PSBcImNvbnRpbnVlXCIpIHtcbiAgICAgICAgICAgICAgICAvLyDnu6fnu63muLjmiI/vvJrlj5HpgIEgcmVhZHkg6K+35rGCXG4gICAgICAgICAgICAgICAgc2VsZi5fY29udGludWVHYW1lKClcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcImxvYmJ5XCIpIHtcbiAgICAgICAgICAgICAgICAvLyDov5Tlm57lpKfljoVcbiAgICAgICAgICAgICAgICBzZWxmLl9yZXR1cm5Ub0xvYmJ5KClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+PhiDliJvlu7rnu5PnrpflvLnnqpdVSSAtIOasouS5kOaWl+WcsOS4u+mrmOe6p+mjjuagvFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0g57uT566X5pWw5o2uXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBpc1dpbm5lciAtIOaYr+WQpuiDnOWIqVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBteVdpbkdvbGQgLSDlvZPliY3njqnlrrbovpPotaLosYblrZBcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIOWbnuiwg+WHveaVsFxuICAgICAqL1xuICAgIF9jcmVhdGVHYW1lUmVzdWx0UG9wdXA6IGZ1bmN0aW9uKGRhdGEsIGlzV2lubmVyLCBteVdpbkdvbGQsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB2YXIgd2luU2l6ZSA9IGNjLndpblNpemVcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHmib7liLBDYW52YXPoioLngrnkvZzkuLrlvLnnqpfniLboioLngrlcbiAgICAgICAgdmFyIGNhbnZhcyA9IGNjLmZpbmQoXCJDYW52YXNcIikgfHwgY2MuZmluZChcIlVJX1JPT1RcIikgfHwgdGhpcy5ub2RlLnBhcmVudFxuICAgICAgICBpZiAoIWNhbnZhcykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfj4YgW19jcmVhdGVHYW1lUmVzdWx0UG9wdXBdIOaJvuS4jeWIsENhbnZhc+iKgueCuVwiKVxuICAgICAgICAgICAgY2FudmFzID0gdGhpcy5ub2RlXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOmBrue9qeWxgiA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgbWFza05vZGUgPSBuZXcgY2MuTm9kZSgpXG4gICAgICAgIG1hc2tOb2RlLm5hbWUgPSBcIkdhbWVSZXN1bHRNYXNrXCJcbiAgICAgICAgbWFza05vZGUuYWRkQ29tcG9uZW50KGNjLkJsb2NrSW5wdXRFdmVudHMpXG4gICAgICAgIHZhciBtYXNrU3ByaXRlID0gbWFza05vZGUuYWRkQ29tcG9uZW50KGNjLlNwcml0ZSlcbiAgICAgICAgbWFza1Nwcml0ZS5zcHJpdGVGcmFtZSA9IG5ldyBjYy5TcHJpdGVGcmFtZSgpXG4gICAgICAgIG1hc2tTcHJpdGUudHlwZSA9IGNjLlNwcml0ZS5UeXBlLlNJTVBMRVxuICAgICAgICBtYXNrU3ByaXRlLnNpemVNb2RlID0gY2MuU3ByaXRlLlNpemVNb2RlLkNVU1RPTVxuICAgICAgICBtYXNrTm9kZS53aWR0aCA9IHdpblNpemUud2lkdGggKiAyXG4gICAgICAgIG1hc2tOb2RlLmhlaWdodCA9IHdpblNpemUuaGVpZ2h0ICogMlxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5LiN6YCa6L+HY29sb3Lorr7nva5hbHBoYe+8jOS9v+eUqG9wYWNpdHnku6Pmm79cbiAgICAgICAgbWFza05vZGUuY29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcigwLCAwLCAzMCkgOiBuZXcgY2MuQ29sb3IoMzAsIDAsIDApXG4gICAgICAgIG1hc2tOb2RlLm9wYWNpdHkgPSAwXG4gICAgICAgIG1hc2tOb2RlLnggPSAwXG4gICAgICAgIG1hc2tOb2RlLnkgPSAwXG4gICAgICAgIG1hc2tOb2RlLnpJbmRleCA9IDk5OSAgLy8g8J+Up+OAkOS/ruWkjeOAkemBrue9qeWxgnpJbmRleFxuICAgICAgICBtYXNrTm9kZS5wYXJlbnQgPSBjYW52YXNcbiAgICAgICAgXG4gICAgICAgIC8vIOmBrue9qea3oeWFpeWKqOeUu1xuICAgICAgICBjYy50d2VlbihtYXNrTm9kZSkudG8oMC4zLCB7IG9wYWNpdHk6IDI1NSB9KS5zdGFydCgpXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDlvLnnqpflrrnlmaggPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdmFyIHBvcHVwTm9kZSA9IG5ldyBjYy5Ob2RlKClcbiAgICAgICAgcG9wdXBOb2RlLm5hbWUgPSBcIkdhbWVSZXN1bHRQb3B1cFwiXG4gICAgICAgIHBvcHVwTm9kZS54ID0gMFxuICAgICAgICBwb3B1cE5vZGUueSA9IDBcbiAgICAgICAgcG9wdXBOb2RlLnNjYWxlID0gMC41XG4gICAgICAgIHBvcHVwTm9kZS5vcGFjaXR5ID0gMFxuICAgICAgICBwb3B1cE5vZGUuekluZGV4ID0gMTAwMCAgLy8g8J+Up+OAkOS/ruWkjeOAkeW8ueeql+WxgnpJbmRleFxuICAgICAgICBwb3B1cE5vZGUucGFyZW50ID0gY2FudmFzXG4gICAgICAgIFxuICAgICAgICAvLyDlvLnnqpflsLrlr7jvvIg3MCXlrr3vvIw3NSXpq5jvvIlcbiAgICAgICAgdmFyIHBvcHVwV2lkdGggPSBNYXRoLm1pbih3aW5TaXplLndpZHRoICogMC43LCA4MDApXG4gICAgICAgIHZhciBwb3B1cEhlaWdodCA9IE1hdGgubWluKHdpblNpemUuaGVpZ2h0ICogMC43NSwgNTUwKVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5Li76IOM5pmvIC0g5riQ5Y+Y5pWI5p6cID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBiZ05vZGUgPSBzZWxmLl9jcmVhdGVHcmFkaWVudEJhY2tncm91bmQocG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQsIGlzV2lubmVyKVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDph5Hovrnmj4/ovrkgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdmFyIGJvcmRlck5vZGUgPSBzZWxmLl9jcmVhdGVHb2xkZW5Cb3JkZXIocG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQsIGlzV2lubmVyKVxuICAgICAgICBib3JkZXJOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g57KS5a2Q54m55pWI5bGCID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBlZmZlY3RMYXllciA9IG5ldyBjYy5Ob2RlKFwiRWZmZWN0TGF5ZXJcIilcbiAgICAgICAgZWZmZWN0TGF5ZXIucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDog5zliKnnspLlrZDnibnmlYhcbiAgICAgICAgaWYgKGlzV2lubmVyKSB7XG4gICAgICAgICAgICBzZWxmLl9jcmVhdGVWaWN0b3J5UGFydGljbGVzKGVmZmVjdExheWVyLCBwb3B1cFdpZHRoLCBwb3B1cEhlaWdodClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYuX2NyZWF0ZURlZmVhdFBhcnRpY2xlcyhlZmZlY3RMYXllciwgcG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOmhtumDqCBCYW5uZXIgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdmFyIGJhbm5lclkgPSBwb3B1cEhlaWdodCAvIDIgLSA2MFxuICAgICAgICB2YXIgYmFubmVyTm9kZSA9IHNlbGYuX2NyZWF0ZVJlc3VsdEJhbm5lcihpc1dpbm5lciwgcG9wdXBXaWR0aClcbiAgICAgICAgYmFubmVyTm9kZS55ID0gYmFubmVyWVxuICAgICAgICBiYW5uZXJOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5Y+z5L6n5YCN5pWw6K+m5oOF5Y2hID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBkZXRhaWxYID0gcG9wdXBXaWR0aCAvIDIgLSAxMzBcbiAgICAgICAgdmFyIGRldGFpbFkgPSAyMFxuICAgICAgICB2YXIgZGV0YWlsTm9kZSA9IHNlbGYuX2NyZWF0ZU11bHRpcGxpZXJEZXRhaWxDYXJkKGRhdGEsIGlzV2lubmVyKVxuICAgICAgICBkZXRhaWxOb2RlLnggPSBkZXRhaWxYXG4gICAgICAgIGRldGFpbE5vZGUueSA9IGRldGFpbFlcbiAgICAgICAgZGV0YWlsTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOS4remXtOeOqeWutue7k+aenOWIl+ihqCA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgbGlzdFdpZHRoID0gcG9wdXBXaWR0aCAqIDAuNTVcbiAgICAgICAgdmFyIGxpc3RYID0gLXBvcHVwV2lkdGggLyAyICsgbGlzdFdpZHRoIC8gMiArIDUwXG4gICAgICAgIHZhciBsaXN0WSA9IC0yMFxuICAgICAgICB2YXIgcGxheWVyTGlzdE5vZGUgPSBzZWxmLl9jcmVhdGVQbGF5ZXJSZXN1bHRMaXN0KGRhdGEsIGlzV2lubmVyLCBteVdpbkdvbGQsIGxpc3RXaWR0aClcbiAgICAgICAgcGxheWVyTGlzdE5vZGUueCA9IGxpc3RYXG4gICAgICAgIHBsYXllckxpc3ROb2RlLnkgPSBsaXN0WVxuICAgICAgICBwbGF5ZXJMaXN0Tm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOW6lemDqOaMiemSruWMuuWfnyA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgYnRuWSA9IC1wb3B1cEhlaWdodCAvIDIgKyA2MFxuICAgICAgICB2YXIgYnV0dG9uQXJlYSA9IHNlbGYuX2NyZWF0ZUJ1dHRvbkFyZWEoaXNXaW5uZXIsIGZ1bmN0aW9uKGFjdGlvbikge1xuICAgICAgICAgICAgc2VsZi5fY2xvc2VHYW1lUmVzdWx0UG9wdXAocG9wdXBOb2RlLCBtYXNrTm9kZSlcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soYWN0aW9uKVxuICAgICAgICB9KVxuICAgICAgICBidXR0b25BcmVhLnkgPSBidG5ZXG4gICAgICAgIGJ1dHRvbkFyZWEucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDlvLnlh7rliqjnlLsgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgY2MudHdlZW4ocG9wdXBOb2RlKVxuICAgICAgICAgICAgLnRvKDAuMzUsIHsgc2NhbGU6IDEsIG9wYWNpdHk6IDI1NSB9LCB7IGVhc2luZzogJ2JhY2tPdXQnIH0pXG4gICAgICAgICAgICAuY2FsbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyDop6blj5HmlbDlrZfmu5rliqjliqjnlLtcbiAgICAgICAgICAgICAgICBzZWxmLl9zdGFydE51bWJlckFuaW1hdGlvbnMocG9wdXBOb2RlLCBkYXRhLCBteVdpbkdvbGQpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgXG4gICAgICAgIC8vIOS/neWtmOW8leeUqFxuICAgICAgICB0aGlzLl9nYW1lUmVzdWx0UG9wdXAgPSBwb3B1cE5vZGVcbiAgICAgICAgdGhpcy5fZ2FtZVJlc3VsdE1hc2sgPSBtYXNrTm9kZVxuICAgICAgICB0aGlzLl9yZXN1bHRFZmZlY3RMYXllciA9IGVmZmVjdExheWVyXG4gICAgfSxcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIPCfjqgg57uT566X5by556qX6KeG6KeJ57uE5Lu2IC0g6auY57qn5pWI5p6cXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiDwn46oIOWIm+W7uua4kOWPmOiDjOaZr1xuICAgICAqL1xuICAgIF9jcmVhdGVHcmFkaWVudEJhY2tncm91bmQ6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIGlzV2lubmVyKSB7XG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkdyYWRpZW50QmdcIilcbiAgICAgICAgdmFyIGdyYXBoaWNzID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgXG4gICAgICAgIC8vIOa4kOWPmOiJslxuICAgICAgICB2YXIgdG9wQ29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcig0MCwgMzAsIDgwLCAyNTUpIDogbmV3IGNjLkNvbG9yKDMwLCAzMCwgNDAsIDI1NSlcbiAgICAgICAgdmFyIGJvdHRvbUNvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoMjAsIDE1LCA1MCwgMjU1KSA6IG5ldyBjYy5Db2xvcigyMCwgMjAsIDMwLCAyNTUpXG4gICAgICAgIFxuICAgICAgICAvLyDnu5jliLbmuJDlj5jnn6nlvaLvvIjmqKHmi5/vvIlcbiAgICAgICAgZ3JhcGhpY3MuZmlsbENvbG9yID0gYm90dG9tQ29sb3JcbiAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC13aWR0aC8yLCAtaGVpZ2h0LzIsIHdpZHRoLCBoZWlnaHQsIDIwKVxuICAgICAgICBncmFwaGljcy5maWxsKClcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOWGheWPkeWFieaViOaenFxuICAgICAgICB2YXIgaW5uZXJHbG93ID0gbmV3IGNjLk5vZGUoXCJJbm5lckdsb3dcIilcbiAgICAgICAgdmFyIGdsb3dTcHJpdGUgPSBpbm5lckdsb3cuYWRkQ29tcG9uZW50KGNjLlNwcml0ZSlcbiAgICAgICAgZ2xvd1Nwcml0ZS5zcHJpdGVGcmFtZSA9IG5ldyBjYy5TcHJpdGVGcmFtZSgpXG4gICAgICAgIGdsb3dTcHJpdGUudHlwZSA9IGNjLlNwcml0ZS5UeXBlLlNMSUNFRFxuICAgICAgICBpbm5lckdsb3cud2lkdGggPSB3aWR0aCAtIDIwXG4gICAgICAgIGlubmVyR2xvdy5oZWlnaHQgPSBoZWlnaHQgLSAyMFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5LiN6YCa6L+HY29sb3Lorr7nva5hbHBoYe+8jOS9v+eUqG9wYWNpdHnku6Pmm79cbiAgICAgICAgaW5uZXJHbG93LmNvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoNjAsIDQwLCAxMDApIDogbmV3IGNjLkNvbG9yKDQwLCA0MCwgNTApXG4gICAgICAgIGlubmVyR2xvdy5vcGFjaXR5ID0gMTAwXG4gICAgICAgIGlubmVyR2xvdy5wYXJlbnQgPSBiZ05vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOiDjOaZr+e6ueeQhuaViOaenFxuICAgICAgICB2YXIgb3ZlcmxheSA9IG5ldyBjYy5Ob2RlKFwiT3ZlcmxheVwiKVxuICAgICAgICB2YXIgb3ZlcmxheVNwcml0ZSA9IG92ZXJsYXkuYWRkQ29tcG9uZW50KGNjLlNwcml0ZSlcbiAgICAgICAgb3ZlcmxheVNwcml0ZS5zcHJpdGVGcmFtZSA9IG5ldyBjYy5TcHJpdGVGcmFtZSgpXG4gICAgICAgIG92ZXJsYXkud2lkdGggPSB3aWR0aFxuICAgICAgICBvdmVybGF5LmhlaWdodCA9IGhlaWdodFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5LiN6YCa6L+HY29sb3Lorr7nva5hbHBoYe+8jOS9v+eUqG9wYWNpdHnku6Pmm79cbiAgICAgICAgb3ZlcmxheS5jb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDgwLCA1MCwgMTIwKSA6IG5ldyBjYy5Db2xvcig1MCwgNTAsIDYwKVxuICAgICAgICBvdmVybGF5Lm9wYWNpdHkgPSAzMFxuICAgICAgICBvdmVybGF5LnBhcmVudCA9IGJnTm9kZVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGJnTm9kZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn46oIOWIm+W7uumHkei+ueaPj+i+uVxuICAgICAqL1xuICAgIF9jcmVhdGVHb2xkZW5Cb3JkZXI6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIGlzV2lubmVyKSB7XG4gICAgICAgIHZhciBib3JkZXJOb2RlID0gbmV3IGNjLk5vZGUoXCJHb2xkZW5Cb3JkZXJcIilcbiAgICAgICAgdmFyIGdyYXBoaWNzID0gYm9yZGVyTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIFxuICAgICAgICAvLyDovrnmoYbpopzoibJcbiAgICAgICAgdmFyIGJvcmRlckNvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDUwLCAyNTUpIDogbmV3IGNjLkNvbG9yKDEwMCwgMTAwLCAxMjAsIDI1NSlcbiAgICAgICAgdmFyIGdsb3dDb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDI1NSwgMTgwLCAwLCAxNTApIDogbmV3IGNjLkNvbG9yKDgwLCA4MCwgMTAwLCAxMDApXG4gICAgICAgIFxuICAgICAgICAvLyDlpJblj5HlhYlcbiAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlQ29sb3IgPSBnbG93Q29sb3JcbiAgICAgICAgZ3JhcGhpY3MubGluZVdpZHRoID0gOFxuICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLXdpZHRoLzIgLSA0LCAtaGVpZ2h0LzIgLSA0LCB3aWR0aCArIDgsIGhlaWdodCArIDgsIDI0KVxuICAgICAgICBncmFwaGljcy5zdHJva2UoKVxuICAgICAgICBcbiAgICAgICAgLy8g5Li76L655qGGXG4gICAgICAgIGdyYXBoaWNzLnN0cm9rZUNvbG9yID0gYm9yZGVyQ29sb3JcbiAgICAgICAgZ3JhcGhpY3MubGluZVdpZHRoID0gM1xuICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLXdpZHRoLzIsIC1oZWlnaHQvMiwgd2lkdGgsIGhlaWdodCwgMjApXG4gICAgICAgIGdyYXBoaWNzLnN0cm9rZSgpXG4gICAgICAgIFxuICAgICAgICAvLyDop5LokL3oo4XppbBcbiAgICAgICAgdmFyIGNvcm5lclNpemUgPSAzMFxuICAgICAgICB2YXIgY29ybmVycyA9IFtcbiAgICAgICAgICAgIHsgeDogLXdpZHRoLzIsIHk6IGhlaWdodC8yLCByb3Q6IDAgfSxcbiAgICAgICAgICAgIHsgeDogd2lkdGgvMiwgeTogaGVpZ2h0LzIsIHJvdDogOTAgfSxcbiAgICAgICAgICAgIHsgeDogd2lkdGgvMiwgeTogLWhlaWdodC8yLCByb3Q6IDE4MCB9LFxuICAgICAgICAgICAgeyB4OiAtd2lkdGgvMiwgeTogLWhlaWdodC8yLCByb3Q6IDI3MCB9XG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29ybmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNvcm5lciA9IGNvcm5lcnNbaV1cbiAgICAgICAgICAgIHZhciBkZWNvck5vZGUgPSBuZXcgY2MuTm9kZShcIkNvcm5lcl9cIiArIGkpXG4gICAgICAgICAgICB2YXIgZGcgPSBkZWNvck5vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICAgICAgZGcuc3Ryb2tlQ29sb3IgPSBib3JkZXJDb2xvclxuICAgICAgICAgICAgZGcubGluZVdpZHRoID0gMlxuICAgICAgICAgICAgZGcubW92ZVRvKDAsIDApXG4gICAgICAgICAgICBkZy5saW5lVG8oY29ybmVyU2l6ZSwgMClcbiAgICAgICAgICAgIGRnLmxpbmVUbyhjb3JuZXJTaXplLCBjb3JuZXJTaXplKVxuICAgICAgICAgICAgZGcuc3Ryb2tlKClcbiAgICAgICAgICAgIGRlY29yTm9kZS54ID0gY29ybmVyLnhcbiAgICAgICAgICAgIGRlY29yTm9kZS55ID0gY29ybmVyLnlcbiAgICAgICAgICAgIGRlY29yTm9kZS5hbmdsZSA9IGNvcm5lci5yb3RcbiAgICAgICAgICAgIGRlY29yTm9kZS5wYXJlbnQgPSBib3JkZXJOb2RlXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBib3JkZXJOb2RlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCfj4Yg5Yib5bu657uT5p6cQmFubmVy77yI6IOc5YipL+Wksei0peagh+mimO+8iVxuICAgICAqL1xuICAgIF9jcmVhdGVSZXN1bHRCYW5uZXI6IGZ1bmN0aW9uKGlzV2lubmVyLCBwb3B1cFdpZHRoKSB7XG4gICAgICAgIHZhciBiYW5uZXJOb2RlID0gbmV3IGNjLk5vZGUoXCJSZXN1bHRCYW5uZXJcIilcbiAgICAgICAgXG4gICAgICAgIC8vIEJhbm5lcuiDjOaZr1xuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCYW5uZXJCZ1wiKVxuICAgICAgICB2YXIgZ3JhcGhpY3MgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICB2YXIgYmFubmVyV2lkdGggPSBwb3B1cFdpZHRoICogMC42XG4gICAgICAgIHZhciBiYW5uZXJIZWlnaHQgPSA3MFxuICAgICAgICBcbiAgICAgICAgaWYgKGlzV2lubmVyKSB7XG4gICAgICAgICAgICAvLyDog5zliKkgLSDph5HoibLmuJDlj5jog4zmma9cbiAgICAgICAgICAgIGdyYXBoaWNzLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcigyMDAsIDE1MCwgMzAsIDIwMClcbiAgICAgICAgICAgIGdyYXBoaWNzLnJvdW5kUmVjdCgtYmFubmVyV2lkdGgvMiwgLWJhbm5lckhlaWdodC8yLCBiYW5uZXJXaWR0aCwgYmFubmVySGVpZ2h0LCAzNSlcbiAgICAgICAgICAgIGdyYXBoaWNzLmZpbGwoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDlj5HlhYnovrnmoYZcbiAgICAgICAgICAgIGdyYXBoaWNzLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjIwLCAxMDAsIDI1NSlcbiAgICAgICAgICAgIGdyYXBoaWNzLmxpbmVXaWR0aCA9IDNcbiAgICAgICAgICAgIGdyYXBoaWNzLnJvdW5kUmVjdCgtYmFubmVyV2lkdGgvMiwgLWJhbm5lckhlaWdodC8yLCBiYW5uZXJXaWR0aCwgYmFubmVySGVpZ2h0LCAzNSlcbiAgICAgICAgICAgIGdyYXBoaWNzLnN0cm9rZSgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDlpLHotKUgLSDmmpfnuqLoibLog4zmma9cbiAgICAgICAgICAgIGdyYXBoaWNzLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig4MCwgNDAsIDUwLCAyMDApXG4gICAgICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLWJhbm5lcldpZHRoLzIsIC1iYW5uZXJIZWlnaHQvMiwgYmFubmVyV2lkdGgsIGJhbm5lckhlaWdodCwgMzUpXG4gICAgICAgICAgICBncmFwaGljcy5maWxsKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMTUwLCAxMDAsIDEwMCwgMjU1KVxuICAgICAgICAgICAgZ3JhcGhpY3MubGluZVdpZHRoID0gMlxuICAgICAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC1iYW5uZXJXaWR0aC8yLCAtYmFubmVySGVpZ2h0LzIsIGJhbm5lcldpZHRoLCBiYW5uZXJIZWlnaHQsIDM1KVxuICAgICAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlKClcbiAgICAgICAgfVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gYmFubmVyTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5qCH6aKY5paH5a2XXG4gICAgICAgIHZhciB0aXRsZU5vZGUgPSBuZXcgY2MuTm9kZShcIlRpdGxlXCIpXG4gICAgICAgIHRpdGxlTm9kZS5hbmNob3JYID0gMC41XG4gICAgICAgIHRpdGxlTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgIHZhciB0aXRsZUxhYmVsID0gdGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdGl0bGVMYWJlbC5zdHJpbmcgPSBpc1dpbm5lciA/IFwi8J+PhiDog5wg5YipIPCfj4ZcIiA6IFwi4pyWIOWksSDotKUg4pyWXCJcbiAgICAgICAgdGl0bGVMYWJlbC5mb250U2l6ZSA9IDQyXG4gICAgICAgIHRpdGxlTGFiZWwubGluZUhlaWdodCA9IDUwXG4gICAgICAgIHRpdGxlTGFiZWwuZm9udEZhbWlseSA9IFwiQXJpYWxcIlxuICAgICAgICB0aXRsZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgdGl0bGVMYWJlbC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVJcbiAgICAgICAgdGl0bGVOb2RlLmNvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSkgOiBuZXcgY2MuQ29sb3IoMjAwLCAxODAsIDE4MClcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOaPj+i+uVxuICAgICAgICB2YXIgb3V0bGluZSA9IHRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKVxuICAgICAgICBvdXRsaW5lLmNvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoMTUwLCAxMDAsIDApIDogbmV3IGNjLkNvbG9yKDgwLCA0MCwgNDApXG4gICAgICAgIG91dGxpbmUud2lkdGggPSAzXG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDlj5HlhYnmlYjmnpzvvIjkvb/nlKjpmLTlvbHmqKHmi5/vvIlcbiAgICAgICAgdmFyIHNoYWRvdyA9IHRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWxTaGFkb3cpXG4gICAgICAgIHNoYWRvdy5jb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDI1NSwgMjAwLCAwLCAyMDApIDogbmV3IGNjLkNvbG9yKDEwMCwgNTAsIDUwLCAxNTApXG4gICAgICAgIHNoYWRvdy5vZmZzZXQgPSBjYy52MigwLCAwKVxuICAgICAgICBzaGFkb3cuYmx1ciA9IDhcbiAgICAgICAgXG4gICAgICAgIHRpdGxlTm9kZS5wYXJlbnQgPSBiYW5uZXJOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDog5zliKnml7bnmoTlkbzlkLjlj5HlhYnliqjnlLtcbiAgICAgICAgaWYgKGlzV2lubmVyKSB7XG4gICAgICAgICAgICBjYy50d2VlbihiYW5uZXJOb2RlKVxuICAgICAgICAgICAgICAgIC5yZXBlYXRGb3JldmVyKFxuICAgICAgICAgICAgICAgICAgICBjYy50d2VlbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAudG8oMS4wLCB7IHNjYWxlOiAxLjAyIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAudG8oMS4wLCB7IHNjYWxlOiAxLjAgfSlcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGJhbm5lck5vZGVcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+TiiDliJvlu7rlgI3mlbDor6bmg4XljaFcbiAgICAgKi9cbiAgICBfY3JlYXRlTXVsdGlwbGllckRldGFpbENhcmQ6IGZ1bmN0aW9uKGRhdGEsIGlzV2lubmVyKSB7XG4gICAgICAgIHZhciBjYXJkTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTXVsdGlwbGllckNhcmRcIilcbiAgICAgICAgdmFyIGNhcmRXaWR0aCA9IDE4MFxuICAgICAgICB2YXIgY2FyZEhlaWdodCA9IDI1MCAgLy8g5aKe5Yqg6auY5bqm5Lul5a6557qz546L54K46KGMXG4gICAgICAgIFxuICAgICAgICAvLyDljaHniYfog4zmma9cbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ2FyZEJnXCIpXG4gICAgICAgIHZhciBncmFwaGljcyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGdyYXBoaWNzLmZpbGxDb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDUwLCAzNSwgNzAsIDIyMCkgOiBuZXcgY2MuQ29sb3IoMzUsIDM1LCA0NSwgMjIwKVxuICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLWNhcmRXaWR0aC8yLCAtY2FyZEhlaWdodC8yLCBjYXJkV2lkdGgsIGNhcmRIZWlnaHQsIDE1KVxuICAgICAgICBncmFwaGljcy5maWxsKClcbiAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlQ29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcigxODAsIDE0MCwgNjAsIDIwMCkgOiBuZXcgY2MuQ29sb3IoODAsIDgwLCAxMDAsIDIwMClcbiAgICAgICAgZ3JhcGhpY3MubGluZVdpZHRoID0gMlxuICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLWNhcmRXaWR0aC8yLCAtY2FyZEhlaWdodC8yLCBjYXJkV2lkdGgsIGNhcmRIZWlnaHQsIDE1KVxuICAgICAgICBncmFwaGljcy5zdHJva2UoKVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gY2FyZE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOagh+mimFxuICAgICAgICB2YXIgdGl0bGVOb2RlID0gbmV3IGNjLk5vZGUoXCJUaXRsZVwiKVxuICAgICAgICB0aXRsZU5vZGUuYW5jaG9yWCA9IDAuNVxuICAgICAgICB0aXRsZU5vZGUuYW5jaG9yWSA9IDAuNVxuICAgICAgICB2YXIgdGl0bGVMYWJlbCA9IHRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHRpdGxlTGFiZWwuc3RyaW5nID0gXCLmnKzlsYDor6bmg4VcIlxuICAgICAgICB0aXRsZUxhYmVsLmZvbnRTaXplID0gMjBcbiAgICAgICAgdGl0bGVMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHRpdGxlTGFiZWwudmVydGljYWxBbGlnbiA9IGNjLkxhYmVsLlZlcnRpY2FsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHRpdGxlTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyMDAsIDIwMCwgMjAwKVxuICAgICAgICB0aXRsZU5vZGUueSA9IGNhcmRIZWlnaHQvMiAtIDI1XG4gICAgICAgIHRpdGxlTm9kZS5wYXJlbnQgPSBjYXJkTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5YiG6ZqU57q/XG4gICAgICAgIHZhciBsaW5lTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTGluZVwiKVxuICAgICAgICB2YXIgbGcgPSBsaW5lTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGxnLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDEwMCwgMTAwLCAxMDAsIDE1MClcbiAgICAgICAgbGcubGluZVdpZHRoID0gMVxuICAgICAgICBsZy5tb3ZlVG8oLWNhcmRXaWR0aC8yICsgMTUsIDApXG4gICAgICAgIGxnLmxpbmVUbyhjYXJkV2lkdGgvMiAtIDE1LCAwKVxuICAgICAgICBsZy5zdHJva2UoKVxuICAgICAgICBsaW5lTm9kZS55ID0gY2FyZEhlaWdodC8yIC0gNTBcbiAgICAgICAgbGluZU5vZGUucGFyZW50ID0gY2FyZE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOivpuaDheWIl+ihqFxuICAgICAgICB2YXIgbXVsdGlEZXRhaWwgPSBkYXRhLm11bHRpX2RldGFpbCB8fCB7fVxuICAgICAgICB2YXIgZGV0YWlscyA9IFtcbiAgICAgICAgICAgIHsgbGFiZWw6IFwi5bqV5YiGXCIsIHZhbHVlOiBkYXRhLmJhc2Vfc2NvcmUgfHwgMTAgfSxcbiAgICAgICAgICAgIHsgbGFiZWw6IFwi5oqi5Zyw5Li7XCIsIHZhbHVlOiBtdWx0aURldGFpbC5xaWFuZ19jb3VudCA+IDAgPyBcInhcIiArIG11bHRpRGV0YWlsLnFpYW5nX211bHRpIDogXCItXCIgfSxcbiAgICAgICAgICAgIHsgbGFiZWw6IFwi54K45by5XCIsIHZhbHVlOiBtdWx0aURldGFpbC5ib21iX2NvdW50ID4gMCA/IFwieFwiICsgbXVsdGlEZXRhaWwuYm9tYl9tdWx0aSA6IFwiLVwiIH0sXG4gICAgICAgICAgICB7IGxhYmVsOiBcIueOi+eCuFwiLCB2YWx1ZTogbXVsdGlEZXRhaWwucm9ja2V0X2NvdW50ID4gMCA/IFwieFwiICsgbXVsdGlEZXRhaWwucm9ja2V0X211bHRpIDogXCItXCIgfSxcbiAgICAgICAgICAgIHsgbGFiZWw6IFwi5pil5aSpXCIsIHZhbHVlOiBtdWx0aURldGFpbC5zcHJpbmdfdHlwZSA+IDAgPyBcIngyXCIgOiBcIi1cIiB9XG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIHZhciBpdGVtWSA9IGNhcmRIZWlnaHQvMiAtIDc1XG4gICAgICAgIHZhciBpdGVtSGVpZ2h0ID0gMjhcbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGV0YWlscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGl0ZW0gPSBkZXRhaWxzW2ldXG4gICAgICAgICAgICB2YXIgaXRlbU5vZGUgPSBuZXcgY2MuTm9kZShcIkl0ZW1fXCIgKyBpKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmoIfnrb5cbiAgICAgICAgICAgIHZhciBsYWJlbE5vZGUgPSBuZXcgY2MuTm9kZShcIkxhYmVsXCIpXG4gICAgICAgICAgICBsYWJlbE5vZGUuYW5jaG9yWCA9IDAuNVxuICAgICAgICAgICAgbGFiZWxOb2RlLmFuY2hvclkgPSAwLjVcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IGxhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICBsYWJlbC5zdHJpbmcgPSBpdGVtLmxhYmVsXG4gICAgICAgICAgICBsYWJlbC5mb250U2l6ZSA9IDE2XG4gICAgICAgICAgICBsYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgICAgICBsYWJlbC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVJcbiAgICAgICAgICAgIGxhYmVsTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigxODAsIDE4MCwgMTgwKVxuICAgICAgICAgICAgbGFiZWxOb2RlLnggPSAtY2FyZFdpZHRoLzIgKyAzNVxuICAgICAgICAgICAgbGFiZWxOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWAvFxuICAgICAgICAgICAgdmFyIHZhbHVlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVmFsdWVcIilcbiAgICAgICAgICAgIHZhbHVlTm9kZS5hbmNob3JYID0gMC41XG4gICAgICAgICAgICB2YWx1ZU5vZGUuYW5jaG9yWSA9IDAuNVxuICAgICAgICAgICAgdmFyIHZhbHVlTGFiZWwgPSB2YWx1ZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgdmFsdWVMYWJlbC5zdHJpbmcgPSBTdHJpbmcoaXRlbS52YWx1ZSlcbiAgICAgICAgICAgIHZhbHVlTGFiZWwuZm9udFNpemUgPSAxNlxuICAgICAgICAgICAgdmFsdWVMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgICAgICB2YWx1ZUxhYmVsLnZlcnRpY2FsQWxpZ24gPSBjYy5MYWJlbC5WZXJ0aWNhbEFsaWduLkNFTlRFUlxuICAgICAgICAgICAgdmFsdWVOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjIwLCAxNTApXG4gICAgICAgICAgICB2YWx1ZU5vZGUueCA9IGNhcmRXaWR0aC8yIC0gNDBcbiAgICAgICAgICAgIHZhbHVlTm9kZS5wYXJlbnQgPSBpdGVtTm9kZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpdGVtTm9kZS55ID0gaXRlbVkgLSBpICogaXRlbUhlaWdodFxuICAgICAgICAgICAgaXRlbU5vZGUucGFyZW50ID0gY2FyZE5vZGVcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5oC75YCN5pWw77yI5aSn5Y+36YeR6Imy77yJXG4gICAgICAgIHZhciB0b3RhbE11bHRpTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVG90YWxNdWx0aVwiKVxuICAgICAgICB2YXIgdG90YWxNdWx0aUJnID0gbmV3IGNjLk5vZGUoXCJCZ1wiKVxuICAgICAgICB2YXIgdG1nID0gdG90YWxNdWx0aUJnLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgdG1nLmZpbGxDb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDgwLCA1MCwgMjAsIDIwMCkgOiBuZXcgY2MuQ29sb3IoNDAsIDQwLCA1MCwgMjAwKVxuICAgICAgICB0bWcucm91bmRSZWN0KC1jYXJkV2lkdGgvMiArIDEwLCAtY2FyZEhlaWdodC8yICsgNSwgY2FyZFdpZHRoIC0gMjAsIDUwLCAxMClcbiAgICAgICAgdG1nLmZpbGwoKVxuICAgICAgICB0b3RhbE11bHRpQmcueSA9IC1jYXJkSGVpZ2h0LzIgKyAzMFxuICAgICAgICB0b3RhbE11bHRpQmcucGFyZW50ID0gdG90YWxNdWx0aU5vZGVcbiAgICAgICAgXG4gICAgICAgIHZhciB0b3RhbExhYmVsID0gbmV3IGNjLk5vZGUoXCJMYWJlbFwiKVxuICAgICAgICB0b3RhbExhYmVsLmFuY2hvclggPSAwLjVcbiAgICAgICAgdG90YWxMYWJlbC5hbmNob3JZID0gMC41XG4gICAgICAgIHZhciB0dGwgPSB0b3RhbExhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdHRsLnN0cmluZyA9IFwi5oC75YCN5pWwXCJcbiAgICAgICAgdHRsLmZvbnRTaXplID0gMTRcbiAgICAgICAgdHRsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgdHRsLnZlcnRpY2FsQWxpZ24gPSBjYy5MYWJlbC5WZXJ0aWNhbEFsaWduLkNFTlRFUlxuICAgICAgICB0b3RhbExhYmVsLmNvbG9yID0gbmV3IGNjLkNvbG9yKDE4MCwgMTgwLCAxODApXG4gICAgICAgIHRvdGFsTGFiZWwueSA9IDEyXG4gICAgICAgIHRvdGFsTGFiZWwucGFyZW50ID0gdG90YWxNdWx0aU5vZGVcbiAgICAgICAgXG4gICAgICAgIHZhciBtdWx0aVZhbHVlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVmFsdWVcIilcbiAgICAgICAgbXVsdGlWYWx1ZU5vZGUubmFtZSA9IFwiTXVsdGlwbGllclZhbHVlXCJcbiAgICAgICAgbXVsdGlWYWx1ZU5vZGUuYW5jaG9yWCA9IDAuNVxuICAgICAgICBtdWx0aVZhbHVlTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgIHZhciBtdmwgPSBtdWx0aVZhbHVlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIG12bC5zdHJpbmcgPSBcInhcIiArIChkYXRhLm11bHRpcGxlIHx8IDEpXG4gICAgICAgIG12bC5mb250U2l6ZSA9IDI4XG4gICAgICAgIG12bC5mb250RmFtaWx5ID0gXCJBcmlhbFwiXG4gICAgICAgIG12bC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIG12bC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVJcbiAgICAgICAgbXVsdGlWYWx1ZU5vZGUuY29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcigyNTUsIDIwMCwgNTApIDogbmV3IGNjLkNvbG9yKDIwMCwgMjAwLCAyMDApXG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDmj4/ovrlcbiAgICAgICAgdmFyIG12byA9IG11bHRpVmFsdWVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpXG4gICAgICAgIG12by5jb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDE1MCwgMTAwLCAwKSA6IG5ldyBjYy5Db2xvcig2MCwgNjAsIDYwKVxuICAgICAgICBtdm8ud2lkdGggPSAyXG4gICAgICAgIFxuICAgICAgICBtdWx0aVZhbHVlTm9kZS55ID0gLThcbiAgICAgICAgbXVsdGlWYWx1ZU5vZGUucGFyZW50ID0gdG90YWxNdWx0aU5vZGVcbiAgICAgICAgXG4gICAgICAgIHRvdGFsTXVsdGlOb2RlLnkgPSAtY2FyZEhlaWdodC8yICsgMzBcbiAgICAgICAgdG90YWxNdWx0aU5vZGUucGFyZW50ID0gY2FyZE5vZGVcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBjYXJkTm9kZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5GlIOWIm+W7uueOqeWutue7k+aenOWIl+ihqFxuICAgICAqL1xuICAgIF9jcmVhdGVQbGF5ZXJSZXN1bHRMaXN0OiBmdW5jdGlvbihkYXRhLCBpc1dpbm5lciwgbXlXaW5Hb2xkLCBsaXN0V2lkdGgpIHtcbiAgICAgICAgdmFyIGxpc3ROb2RlID0gbmV3IGNjLk5vZGUoXCJQbGF5ZXJSZXN1bHRMaXN0XCIpXG4gICAgICAgIHZhciBsaXN0SGVpZ2h0ID0gMjYwXG4gICAgICAgIFxuICAgICAgICAvLyDliJfooajog4zmma9cbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTGlzdEJnXCIpXG4gICAgICAgIHZhciBncmFwaGljcyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGdyYXBoaWNzLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcigwLCAwLCAwLCA4MClcbiAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC1saXN0V2lkdGgvMiwgLWxpc3RIZWlnaHQvMiwgbGlzdFdpZHRoLCBsaXN0SGVpZ2h0LCAxMilcbiAgICAgICAgZ3JhcGhpY3MuZmlsbCgpXG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSBsaXN0Tm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g6KGo5aS0XG4gICAgICAgIHZhciBoZWFkZXJOb2RlID0gbmV3IGNjLk5vZGUoXCJIZWFkZXJcIilcbiAgICAgICAgdmFyIGhlYWRlcnMgPSBbXCLnjqnlrrZcIiwgXCLouqvku71cIiwgXCLovpPotaJcIl1cbiAgICAgICAgdmFyIGhlYWRlclggPSBbLWxpc3RXaWR0aC8yICsgODAsIDIwLCBsaXN0V2lkdGgvMiAtIDYwXVxuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBoZWFkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgaE5vZGUgPSBuZXcgY2MuTm9kZShcIkhfXCIgKyBpKVxuICAgICAgICAgICAgaE5vZGUuYW5jaG9yWCA9IDAuNVxuICAgICAgICAgICAgaE5vZGUuYW5jaG9yWSA9IDAuNVxuICAgICAgICAgICAgdmFyIGhMYWJlbCA9IGhOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgIGhMYWJlbC5zdHJpbmcgPSBoZWFkZXJzW2ldXG4gICAgICAgICAgICBoTGFiZWwuZm9udFNpemUgPSAxOFxuICAgICAgICAgICAgaExhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgICAgIGhMYWJlbC52ZXJ0aWNhbEFsaWduID0gY2MuTGFiZWwuVmVydGljYWxBbGlnbi5DRU5URVJcbiAgICAgICAgICAgIGhOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDE1MCwgMTUwLCAxNjApXG4gICAgICAgICAgICBoTm9kZS54ID0gaGVhZGVyWFtpXVxuICAgICAgICAgICAgaE5vZGUucGFyZW50ID0gaGVhZGVyTm9kZVxuICAgICAgICB9XG4gICAgICAgIGhlYWRlck5vZGUueSA9IGxpc3RIZWlnaHQvMiAtIDI1XG4gICAgICAgIGhlYWRlck5vZGUucGFyZW50ID0gbGlzdE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOWIhumalOe6v1xuICAgICAgICB2YXIgc2VwTm9kZSA9IG5ldyBjYy5Ob2RlKFwiU2VwYXJhdG9yXCIpXG4gICAgICAgIHZhciBzZyA9IHNlcE5vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBzZy5zdHJva2VDb2xvciA9IG5ldyBjYy5Db2xvcigxMDAsIDEwMCwgMTAwLCAxMDApXG4gICAgICAgIHNnLmxpbmVXaWR0aCA9IDFcbiAgICAgICAgc2cubW92ZVRvKC1saXN0V2lkdGgvMiArIDE1LCAwKVxuICAgICAgICBzZy5saW5lVG8obGlzdFdpZHRoLzIgLSAxNSwgMClcbiAgICAgICAgc2cuc3Ryb2tlKClcbiAgICAgICAgc2VwTm9kZS55ID0gbGlzdEhlaWdodC8yIC0gNDVcbiAgICAgICAgc2VwTm9kZS5wYXJlbnQgPSBsaXN0Tm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g546p5a625YiX6KGoXG4gICAgICAgIHZhciBwbGF5ZXJzID0gZGF0YS5wbGF5ZXJzIHx8IFtdXG4gICAgICAgIHZhciBteVBsYXllcklkID0gbXlnbG9iYWwuc29ja2V0LmdldFBsYXllckluZm8oKS5pZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLnNlcnZlclBsYXllcklkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEXG4gICAgICAgIHZhciBpdGVtU3RhcnRZID0gbGlzdEhlaWdodC8yIC0gNzVcbiAgICAgICAgdmFyIGl0ZW1IZWlnaHQgPSA2NVxuICAgICAgICBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwbGF5ZXJzLmxlbmd0aCAmJiBpIDwgMzsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGxheWVyID0gcGxheWVyc1tpXVxuICAgICAgICAgICAgdmFyIGlzQ3VycmVudFBsYXllciA9IFN0cmluZyhwbGF5ZXIucGxheWVyX2lkKSA9PT0gU3RyaW5nKG15UGxheWVySWQpXG4gICAgICAgICAgICB2YXIgaXRlbU5vZGUgPSB0aGlzLl9jcmVhdGVQbGF5ZXJSZXN1bHRJdGVtKHBsYXllciwgaXNDdXJyZW50UGxheWVyLCBpc1dpbm5lciwgbGlzdFdpZHRoLCBpKVxuICAgICAgICAgICAgaXRlbU5vZGUueSA9IGl0ZW1TdGFydFkgLSBpICogaXRlbUhlaWdodFxuICAgICAgICAgICAgaXRlbU5vZGUucGFyZW50ID0gbGlzdE5vZGVcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGxpc3ROb2RlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCfkaQg5Yib5bu65Y2V5Liq546p5a6257uT5p6c6aG5XG4gICAgICovXG4gICAgX2NyZWF0ZVBsYXllclJlc3VsdEl0ZW06IGZ1bmN0aW9uKHBsYXllciwgaXNDdXJyZW50UGxheWVyLCBpc1dpbm5lciwgbGlzdFdpZHRoLCBpbmRleCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgdmFyIGl0ZW1Ob2RlID0gbmV3IGNjLk5vZGUoXCJQbGF5ZXJJdGVtX1wiICsgaW5kZXgpXG4gICAgICAgIHZhciBpdGVtSGVpZ2h0ID0gNTVcbiAgICAgICAgXG4gICAgICAgIC8vIOW9k+WJjeeOqeWutumrmOS6ruiDjOaZr1xuICAgICAgICBpZiAoaXNDdXJyZW50UGxheWVyKSB7XG4gICAgICAgICAgICB2YXIgaGlnaGxpZ2h0ID0gbmV3IGNjLk5vZGUoXCJIaWdobGlnaHRcIilcbiAgICAgICAgICAgIHZhciBoZyA9IGhpZ2hsaWdodC5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgICAgICBoZy5maWxsQ29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcig4MCwgNjAsIDMwLCAxNTApIDogbmV3IGNjLkNvbG9yKDUwLCA0MCwgNTAsIDE1MClcbiAgICAgICAgICAgIGhnLnJvdW5kUmVjdCgtbGlzdFdpZHRoLzIgKyAxMCwgLWl0ZW1IZWlnaHQvMiwgbGlzdFdpZHRoIC0gMjAsIGl0ZW1IZWlnaHQsIDgpXG4gICAgICAgICAgICBoZy5maWxsKClcbiAgICAgICAgICAgIGhnLnN0cm9rZUNvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoMjAwLCAxNTAsIDUwLCAyMDApIDogbmV3IGNjLkNvbG9yKDEwMCwgODAsIDEwMCwgMTUwKVxuICAgICAgICAgICAgaGcubGluZVdpZHRoID0gMlxuICAgICAgICAgICAgaGcucm91bmRSZWN0KC1saXN0V2lkdGgvMiArIDEwLCAtaXRlbUhlaWdodC8yLCBsaXN0V2lkdGggLSAyMCwgaXRlbUhlaWdodCwgOClcbiAgICAgICAgICAgIGhnLnN0cm9rZSgpXG4gICAgICAgICAgICBoaWdobGlnaHQucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5aS05YOP5Yy65Z+fXG4gICAgICAgIHZhciBhdmF0YXJOb2RlID0gbmV3IGNjLk5vZGUoXCJBdmF0YXJcIilcbiAgICAgICAgYXZhdGFyTm9kZS54ID0gLWxpc3RXaWR0aC8yICsgNDVcbiAgICAgICAgXG4gICAgICAgIC8vIOWktOWDj+iDjOaZr++8iOWchuW9ou+8iVxuICAgICAgICB2YXIgYXZhdGFyQmcgPSBuZXcgY2MuTm9kZShcIkF2YXRhckJnXCIpXG4gICAgICAgIHZhciBhZyA9IGF2YXRhckJnLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgdmFyIGlzTGFuZGxvcmQgPSBwbGF5ZXIucm9sZSA9PT0gXCJsYW5kbG9yZFwiXG4gICAgICAgIFxuICAgICAgICAvLyDnu5jliLblnIblvaLlpLTlg4/moYZcbiAgICAgICAgYWcuc3Ryb2tlQ29sb3IgPSBpc0xhbmRsb3JkID8gbmV3IGNjLkNvbG9yKDI1NSwgMjAwLCA1MCwgMjU1KSA6IG5ldyBjYy5Db2xvcigxODAsIDE4MCwgMjAwLCAyNTUpXG4gICAgICAgIGFnLmxpbmVXaWR0aCA9IDNcbiAgICAgICAgYWcuY2lyY2xlKDAsIDAsIDIyKVxuICAgICAgICBhZy5zdHJva2UoKVxuICAgICAgICBhZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoNjAsIDYwLCA4MCwgMjAwKVxuICAgICAgICBhZy5jaXJjbGUoMCwgMCwgMjApXG4gICAgICAgIGFnLmZpbGwoKVxuICAgICAgICBhdmF0YXJCZy5wYXJlbnQgPSBhdmF0YXJOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDlsJ3or5XliqDovb3lpLTlg49cbiAgICAgICAgdmFyIGF2YXRhckluZGV4ID0gKGluZGV4ICUgNCkgKyAxXG4gICAgICAgIHZhciBhdmF0YXJQYXRoID0gXCJVSS9oZWFkaW1hZ2UvYXZhdGFyX1wiICsgYXZhdGFySW5kZXhcbiAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoYXZhdGFyUGF0aCwgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVyciwgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgIGlmICghZXJyICYmIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF2YXRhclNwcml0ZSA9IG5ldyBjYy5Ob2RlKFwiQXZhdGFyU3ByaXRlXCIpXG4gICAgICAgICAgICAgICAgdmFyIHNwID0gYXZhdGFyU3ByaXRlLmFkZENvbXBvbmVudChjYy5TcHJpdGUpXG4gICAgICAgICAgICAgICAgc3Auc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZVxuICAgICAgICAgICAgICAgIHNwLnNpemVNb2RlID0gY2MuU3ByaXRlLlNpemVNb2RlLkNVU1RPTVxuICAgICAgICAgICAgICAgIGF2YXRhclNwcml0ZS53aWR0aCA9IDM2XG4gICAgICAgICAgICAgICAgYXZhdGFyU3ByaXRlLmhlaWdodCA9IDM2XG4gICAgICAgICAgICAgICAgYXZhdGFyU3ByaXRlLnBhcmVudCA9IGF2YXRhck5vZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIOi6q+S7veWbvuagh1xuICAgICAgICB2YXIgcm9sZUljb25Ob2RlID0gbmV3IGNjLk5vZGUoXCJSb2xlSWNvblwiKVxuICAgICAgICB2YXIgcm9sZUxhYmVsID0gcm9sZUljb25Ob2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgcm9sZUxhYmVsLnN0cmluZyA9IGlzTGFuZGxvcmQgPyBcIvCfkZFcIiA6IFwi8J+MvlwiXG4gICAgICAgIHJvbGVMYWJlbC5mb250U2l6ZSA9IDE0XG4gICAgICAgIHJvbGVJY29uTm9kZS54ID0gMThcbiAgICAgICAgcm9sZUljb25Ob2RlLnkgPSAtMTVcbiAgICAgICAgcm9sZUljb25Ob2RlLnBhcmVudCA9IGF2YXRhck5vZGVcbiAgICAgICAgXG4gICAgICAgIGF2YXRhck5vZGUucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOeOqeWutuWQjeensFxuICAgICAgICB2YXIgbmFtZU5vZGUgPSBuZXcgY2MuTm9kZShcIk5hbWVcIilcbiAgICAgICAgbmFtZU5vZGUuYW5jaG9yWCA9IDAuNVxuICAgICAgICBuYW1lTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgIHZhciBuYW1lTGFiZWwgPSBuYW1lTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIG5hbWVMYWJlbC5zdHJpbmcgPSBwbGF5ZXIucGxheWVyX25hbWUgfHwgKFwi546p5a62XCIgKyAoaW5kZXggKyAxKSlcbiAgICAgICAgbmFtZUxhYmVsLmZvbnRTaXplID0gMThcbiAgICAgICAgbmFtZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgbmFtZUxhYmVsLnZlcnRpY2FsQWxpZ24gPSBjYy5MYWJlbC5WZXJ0aWNhbEFsaWduLkNFTlRFUlxuICAgICAgICBuYW1lTm9kZS5jb2xvciA9IGlzQ3VycmVudFBsYXllciA/IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjAwKSA6IG5ldyBjYy5Db2xvcigyMjAsIDIyMCwgMjIwKVxuICAgICAgICBuYW1lTm9kZS54ID0gLWxpc3RXaWR0aC8yICsgMTAwXG4gICAgICAgIG5hbWVOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDouqvku71cbiAgICAgICAgdmFyIHJvbGVOb2RlID0gbmV3IGNjLk5vZGUoXCJSb2xlXCIpXG4gICAgICAgIHJvbGVOb2RlLmFuY2hvclggPSAwLjVcbiAgICAgICAgcm9sZU5vZGUuYW5jaG9yWSA9IDAuNVxuICAgICAgICB2YXIgcm9sZVRleHQgPSByb2xlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHJvbGVUZXh0LnN0cmluZyA9IGlzTGFuZGxvcmQgPyBcIuWcsOS4u1wiIDogXCLlhpzmsJFcIlxuICAgICAgICByb2xlVGV4dC5mb250U2l6ZSA9IDE4XG4gICAgICAgIHJvbGVUZXh0Lmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgcm9sZVRleHQudmVydGljYWxBbGlnbiA9IGNjLkxhYmVsLlZlcnRpY2FsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHJvbGVOb2RlLmNvbG9yID0gaXNMYW5kbG9yZCA/IG5ldyBjYy5Db2xvcigyNTUsIDIwMCwgMTAwKSA6IG5ldyBjYy5Db2xvcigxMjAsIDIwMCwgMTIwKVxuICAgICAgICByb2xlTm9kZS54ID0gMjBcbiAgICAgICAgcm9sZU5vZGUucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOi+k+i1oumHkeminVxuICAgICAgICB2YXIgd2luR29sZCA9IHBsYXllci53aW5fZ29sZCB8fCAwXG4gICAgICAgIHZhciB3aW5Ob2RlID0gbmV3IGNjLk5vZGUoXCJXaW5Hb2xkXCIpXG4gICAgICAgIHdpbk5vZGUubmFtZSA9IFwiV2luR29sZFZhbHVlXCJcbiAgICAgICAgd2luTm9kZS5hbmNob3JYID0gMC41XG4gICAgICAgIHdpbk5vZGUuYW5jaG9yWSA9IDAuNVxuICAgICAgICB2YXIgd2luTGFiZWwgPSB3aW5Ob2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgd2luTGFiZWwuc3RyaW5nID0gKHdpbkdvbGQgPj0gMCA/IFwiK1wiIDogXCJcIikgKyB3aW5Hb2xkXG4gICAgICAgIHdpbkxhYmVsLmZvbnRTaXplID0gMjJcbiAgICAgICAgd2luTGFiZWwuZm9udEZhbWlseSA9IFwiQXJpYWxcIlxuICAgICAgICB3aW5MYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHdpbkxhYmVsLnZlcnRpY2FsQWxpZ24gPSBjYy5MYWJlbC5WZXJ0aWNhbEFsaWduLkNFTlRFUlxuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg5o+P6L65XG4gICAgICAgIHZhciB3aW5PdXRsaW5lID0gd2luTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWxPdXRsaW5lKVxuICAgICAgICB3aW5PdXRsaW5lLmNvbG9yID0gd2luR29sZCA+PSAwID8gbmV3IGNjLkNvbG9yKDAsIDgwLCAwKSA6IG5ldyBjYy5Db2xvcigxMDAsIDAsIDApXG4gICAgICAgIHdpbk91dGxpbmUud2lkdGggPSAyXG4gICAgICAgIFxuICAgICAgICB3aW5Ob2RlLmNvbG9yID0gd2luR29sZCA+PSAwID8gbmV3IGNjLkNvbG9yKDEwMCwgMjU1LCAxMDApIDogbmV3IGNjLkNvbG9yKDI1NSwgMTAwLCAxMDApXG4gICAgICAgIHdpbk5vZGUueCA9IGxpc3RXaWR0aC8yIC0gNTBcbiAgICAgICAgd2luTm9kZS5wYXJlbnQgPSBpdGVtTm9kZVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGl0ZW1Ob2RlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflJgg5Yib5bu65oyJ6ZKu5Yy65Z+fXG4gICAgICovXG4gICAgX2NyZWF0ZUJ1dHRvbkFyZWE6IGZ1bmN0aW9uKGlzV2lubmVyLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgdmFyIGFyZWFOb2RlID0gbmV3IGNjLk5vZGUoXCJCdXR0b25BcmVhXCIpXG4gICAgICAgIFxuICAgICAgICAvLyDnu6fnu63muLjmiI/mjInpkq5cbiAgICAgICAgdmFyIGNvbnRpbnVlQnRuID0gc2VsZi5fY3JlYXRlU3R5bGVkQnV0dG9uKFwi57un57ut5ri45oiPXCIsIGlzV2lubmVyLCB0cnVlKVxuICAgICAgICBjb250aW51ZUJ0bi54ID0gLTEwMFxuICAgICAgICBjb250aW51ZUJ0bi5wYXJlbnQgPSBhcmVhTm9kZVxuICAgICAgICBcbiAgICAgICAgY29udGludWVCdG4ub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soXCJjb250aW51ZVwiKVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8g6L+U5Zue5aSn5Y6F5oyJ6ZKuXG4gICAgICAgIHZhciBsb2JieUJ0biA9IHNlbGYuX2NyZWF0ZVN0eWxlZEJ1dHRvbihcIui/lOWbnuWkp+WOhVwiLCBpc1dpbm5lciwgZmFsc2UpXG4gICAgICAgIGxvYmJ5QnRuLnggPSAxMDBcbiAgICAgICAgbG9iYnlCdG4ucGFyZW50ID0gYXJlYU5vZGVcbiAgICAgICAgXG4gICAgICAgIGxvYmJ5QnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKFwibG9iYnlcIilcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBhcmVhTm9kZVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5SYIOWIm+W7uumrmOe6p+agt+W8j+aMiemSrlxuICAgICAqL1xuICAgIF9jcmVhdGVTdHlsZWRCdXR0b246IGZ1bmN0aW9uKHRleHQsIGlzV2lubmVyLCBpc1ByaW1hcnkpIHtcbiAgICAgICAgdmFyIGJ0bk5vZGUgPSBuZXcgY2MuTm9kZShcIkJ0bl9cIiArIHRleHQpXG4gICAgICAgIHZhciBidG5XaWR0aCA9IDE0MFxuICAgICAgICB2YXIgYnRuSGVpZ2h0ID0gNTBcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHorr7nva7mjInpkq7oioLngrnnmoTlhoXlrrnlpKflsI/vvIznoa7kv53ngrnlh7vljLrln5/mraPnoa5cbiAgICAgICAgYnRuTm9kZS5zZXRDb250ZW50U2l6ZShidG5XaWR0aCwgYnRuSGVpZ2h0KVxuICAgICAgICBidG5Ob2RlLnNldEFuY2hvclBvaW50KDAuNSwgMC41KVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkea3u+WKoCBCbG9ja0lucHV0RXZlbnRzIOe7hOS7tu+8jOehruS/neaMiemSruWPr+S7peaOpeaUtueCueWHu+S6i+S7tlxuICAgICAgICBidG5Ob2RlLmFkZENvbXBvbmVudChjYy5CbG9ja0lucHV0RXZlbnRzKVxuICAgICAgICBcbiAgICAgICAgLy8g5oyJ6ZKu6IOM5pmvXG4gICAgICAgIHZhciBncmFwaGljcyA9IGJ0bk5vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBcbiAgICAgICAgaWYgKGlzUHJpbWFyeSkge1xuICAgICAgICAgICAgLy8g5Li76KaB5oyJ6ZKuIC0g6YeR5qmZ5riQ5Y+YXG4gICAgICAgICAgICBpZiAoaXNXaW5uZXIpIHtcbiAgICAgICAgICAgICAgICBncmFwaGljcy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjAwLCAxNDAsIDMwLCAyNTUpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGdyYXBoaWNzLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig2MCwgMTIwLCAxODAsIDI1NSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIOasoeimgeaMiemSriAtIOiTnee0q+a4kOWPmFxuICAgICAgICAgICAgZ3JhcGhpY3MuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDgwLCA3MCwgMTIwLCAyNTUpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGdyYXBoaWNzLnJvdW5kUmVjdCgtYnRuV2lkdGgvMiwgLWJ0bkhlaWdodC8yLCBidG5XaWR0aCwgYnRuSGVpZ2h0LCAyNSlcbiAgICAgICAgZ3JhcGhpY3MuZmlsbCgpXG4gICAgICAgIFxuICAgICAgICAvLyDovrnmoYZcbiAgICAgICAgaWYgKGlzUHJpbWFyeSAmJiBpc1dpbm5lcikge1xuICAgICAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMjAsIDEwMCwgMjU1KVxuICAgICAgICAgICAgZ3JhcGhpY3MubGluZVdpZHRoID0gMlxuICAgICAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC1idG5XaWR0aC8yLCAtYnRuSGVpZ2h0LzIsIGJ0bldpZHRoLCBidG5IZWlnaHQsIDI1KVxuICAgICAgICAgICAgZ3JhcGhpY3Muc3Ryb2tlKClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5oyJ6ZKu5paH5a2XXG4gICAgICAgIHZhciBsYWJlbE5vZGUgPSBuZXcgY2MuTm9kZShcIkxhYmVsXCIpXG4gICAgICAgIGxhYmVsTm9kZS5hbmNob3JYID0gMC41XG4gICAgICAgIGxhYmVsTm9kZS5hbmNob3JZID0gMC41XG4gICAgICAgIHZhciBsYWJlbCA9IGxhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGxhYmVsLnN0cmluZyA9IHRleHRcbiAgICAgICAgbGFiZWwuZm9udFNpemUgPSAyMlxuICAgICAgICBsYWJlbC5mb250RmFtaWx5ID0gXCJBcmlhbFwiXG4gICAgICAgIGxhYmVsLm92ZXJmbG93ID0gY2MuTGFiZWwuT3ZlcmZsb3cuU0hSSU5LXG4gICAgICAgIGxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgbGFiZWwudmVydGljYWxBbGlnbiA9IGNjLkxhYmVsLlZlcnRpY2FsQWxpZ24uQ0VOVEVSXG4gICAgICAgIGxhYmVsTm9kZS53aWR0aCA9IGJ0bldpZHRoIC0gMjAgIC8vIOeVmeWHuui+uei3nemYsuatoua6ouWHulxuICAgICAgICBsYWJlbE5vZGUuaGVpZ2h0ID0gYnRuSGVpZ2h0IC0gMTBcbiAgICAgICAgbGFiZWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDmj4/ovrlcbiAgICAgICAgdmFyIG91dGxpbmUgPSBsYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSlcbiAgICAgICAgb3V0bGluZS5jb2xvciA9IG5ldyBjYy5Db2xvcigwLCAwLCAwKVxuICAgICAgICBvdXRsaW5lLndpZHRoID0gMlxuICAgICAgICBcbiAgICAgICAgbGFiZWxOb2RlLnBhcmVudCA9IGJ0bk5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOeCueWHu+aViOaenFxuICAgICAgICBidG5Ob2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX1NUQVJULCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNjLnR3ZWVuKGJ0bk5vZGUpLnRvKDAuMSwgeyBzY2FsZTogMC45NSB9KS5zdGFydCgpXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICBidG5Ob2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjYy50d2VlbihidG5Ob2RlKS50bygwLjEsIHsgc2NhbGU6IDEgfSkuc3RhcnQoKVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgYnRuTm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9DQU5DRUwsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2MudHdlZW4oYnRuTm9kZSkudG8oMC4xLCB7IHNjYWxlOiAxIH0pLnN0YXJ0KClcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBidG5Ob2RlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOKcqCDliJvlu7rog5zliKnnspLlrZDnibnmlYhcbiAgICAgKi9cbiAgICBfY3JlYXRlVmljdG9yeVBhcnRpY2xlczogZnVuY3Rpb24ocGFyZW50LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICBcbiAgICAgICAgLy8g6YeR5biB57KS5a2QXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTU7IGkrKykge1xuICAgICAgICAgICAgKGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvaW4gPSBuZXcgY2MuTm9kZShcIkNvaW5fXCIgKyBpbmRleClcbiAgICAgICAgICAgICAgICBjb2luLnggPSAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiB3aWR0aFxuICAgICAgICAgICAgICAgIGNvaW4ueSA9IGhlaWdodCAvIDIgKyA1MFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOe7mOWItumHkeW4gVxuICAgICAgICAgICAgICAgIHZhciBnID0gY29pbi5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgICAgICAgICAgZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDUwLCAyNTUpXG4gICAgICAgICAgICAgICAgZy5jaXJjbGUoMCwgMCwgOClcbiAgICAgICAgICAgICAgICBnLmZpbGwoKVxuICAgICAgICAgICAgICAgIGcuc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjAwLCAxNTAsIDMwLCAyNTUpXG4gICAgICAgICAgICAgICAgZy5saW5lV2lkdGggPSAxXG4gICAgICAgICAgICAgICAgZy5jaXJjbGUoMCwgMCwgOClcbiAgICAgICAgICAgICAgICBnLnN0cm9rZSgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29pbi5wYXJlbnQgPSBwYXJlbnRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDkuIvokL3liqjnlLtcbiAgICAgICAgICAgICAgICB2YXIgZHVyYXRpb24gPSAxLjUgKyBNYXRoLnJhbmRvbSgpICogMS41XG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldFkgPSAtaGVpZ2h0IC8gMiAtIDUwXG4gICAgICAgICAgICAgICAgdmFyIGRlbGF5ID0gTWF0aC5yYW5kb20oKSAqIDAuNVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNjLnR3ZWVuKGNvaW4pXG4gICAgICAgICAgICAgICAgICAgIC5kZWxheShkZWxheSlcbiAgICAgICAgICAgICAgICAgICAgLnBhcmFsbGVsKFxuICAgICAgICAgICAgICAgICAgICAgICAgY2MudHdlZW4oKS50byhkdXJhdGlvbiwgeyB5OiB0YXJnZXRZIH0sIHsgZWFzaW5nOiAncXVhZEluJyB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLnR3ZWVuKCkudG8oZHVyYXRpb24sIHsgeDogY29pbi54ICsgKE1hdGgucmFuZG9tKCkgLSAwLjUpICogMTAwIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2MudHdlZW4oKS50byhkdXJhdGlvbiAvIDIsIHsgYW5nbGU6IC0xODAgfSkudG8oZHVyYXRpb24gLyAyLCB7IGFuZ2xlOiAtMzYwIH0pXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgLmNhbGwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDlvqrnjq9cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvaW4ueSA9IGhlaWdodCAvIDIgKyA1MFxuICAgICAgICAgICAgICAgICAgICAgICAgY29pbi54ID0gKE1hdGgucmFuZG9tKCkgLSAwLjUpICogd2lkdGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLnR3ZWVuKGNvaW4pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnBhcmFsbGVsKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYy50d2VlbigpLnRvKGR1cmF0aW9uLCB7IHk6IHRhcmdldFkgfSwgeyBlYXNpbmc6ICdxdWFkSW4nIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYy50d2VlbigpLnRvKGR1cmF0aW9uLCB7IHg6IGNvaW4ueCArIChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIDEwMCB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2MudHdlZW4oKS50byhkdXJhdGlvbiAvIDIsIHsgYW5nbGU6IC0xODAgfSkudG8oZHVyYXRpb24gLyAyLCB7IGFuZ2xlOiAtMzYwIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdGFydCgpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5zdGFydCgpXG4gICAgICAgICAgICB9KShpKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmmJ/lhYnpl6rng4FcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCA4OyBqKyspIHtcbiAgICAgICAgICAgIChmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgICAgIHZhciBzdGFyID0gbmV3IGNjLk5vZGUoXCJTdGFyX1wiICsgaW5kZXgpXG4gICAgICAgICAgICAgICAgc3Rhci54ID0gKE1hdGgucmFuZG9tKCkgLSAwLjUpICogd2lkdGggKiAwLjhcbiAgICAgICAgICAgICAgICBzdGFyLnkgPSAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiBoZWlnaHQgKiAwLjhcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDnu5jliLbmmJ/mmJ9cbiAgICAgICAgICAgICAgICB2YXIgc2cgPSBzdGFyLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgICAgICAgICBzZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDIwMCwgMjAwKVxuICAgICAgICAgICAgICAgIHNlbGYuX2RyYXdTdGFyKHNnLCAwLCAwLCA2LCA1KVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHN0YXIucGFyZW50ID0gcGFyZW50XG4gICAgICAgICAgICAgICAgc3Rhci5vcGFjaXR5ID0gMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOmXqueDgeWKqOeUu1xuICAgICAgICAgICAgICAgIGNjLnR3ZWVuKHN0YXIpXG4gICAgICAgICAgICAgICAgICAgIC5kZWxheShNYXRoLnJhbmRvbSgpICogMilcbiAgICAgICAgICAgICAgICAgICAgLnJlcGVhdEZvcmV2ZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICBjYy50d2VlbigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvKDAuMywgeyBvcGFjaXR5OiAyNTUsIHNjYWxlOiAxLjIgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudG8oMC4zLCB7IG9wYWNpdHk6IDEwMCwgc2NhbGU6IDAuOCB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50bygwLjMsIHsgb3BhY2l0eTogMjU1LCBzY2FsZTogMS4yIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvKDAuMywgeyBvcGFjaXR5OiAwLCBzY2FsZTogMC41IH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmRlbGF5KDEgKyBNYXRoLnJhbmRvbSgpICogMilcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICAgICAgfSkoailcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn4yn77iPIOWIm+W7uuWksei0peeykuWtkOeJueaViFxuICAgICAqL1xuICAgIF9jcmVhdGVEZWZlYXRQYXJ0aWNsZXM6IGZ1bmN0aW9uKHBhcmVudCwgd2lkdGgsIGhlaWdodCkge1xuICAgICAgICAvLyDok53oibLmvILmta7nspLlrZBcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG4gICAgICAgICAgICAoZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFydGljbGUgPSBuZXcgY2MuTm9kZShcIkRlZmVhdFBhcnRpY2xlX1wiICsgaW5kZXgpXG4gICAgICAgICAgICAgICAgcGFydGljbGUueCA9IChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIHdpZHRoXG4gICAgICAgICAgICAgICAgcGFydGljbGUueSA9IChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIGhlaWdodFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOe7mOWItueykuWtkFxuICAgICAgICAgICAgICAgIHZhciBnID0gcGFydGljbGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICAgICAgICAgIGcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDgwLCAxMDAsIDE1MCwgMTUwKVxuICAgICAgICAgICAgICAgIGcuY2lyY2xlKDAsIDAsIDQgKyBNYXRoLnJhbmRvbSgpICogMylcbiAgICAgICAgICAgICAgICBnLmZpbGwoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHBhcnRpY2xlLnBhcmVudCA9IHBhcmVudFxuICAgICAgICAgICAgICAgIHBhcnRpY2xlLm9wYWNpdHkgPSAwXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g57yT5oWi5ryC5rWu5Yqo55S7XG4gICAgICAgICAgICAgICAgdmFyIGR1cmF0aW9uID0gMyArIE1hdGgucmFuZG9tKCkgKiAyXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2MudHdlZW4ocGFydGljbGUpXG4gICAgICAgICAgICAgICAgICAgIC50bygwLjUsIHsgb3BhY2l0eTogMTUwIH0pXG4gICAgICAgICAgICAgICAgICAgIC5wYXJhbGxlbChcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLnR3ZWVuKCkudG8oZHVyYXRpb24sIHsgeTogcGFydGljbGUueSArIDUwICsgTWF0aC5yYW5kb20oKSAqIDMwIH0sIHsgZWFzaW5nOiAnc2luZUluT3V0JyB9KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLnR3ZWVuKCkudG8oZHVyYXRpb24sIHsgeDogcGFydGljbGUueCArIChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIDQwIH0pXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgLnRvKDAuNSwgeyBvcGFjaXR5OiAwIH0pXG4gICAgICAgICAgICAgICAgICAgIC5jYWxsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFydGljbGUueSA9IChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIGhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFydGljbGUueCA9IChNYXRoLnJhbmRvbSgpIC0gMC41KSAqIHdpZHRoXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5zdGFydCgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5b6q546vXG4gICAgICAgICAgICAgICAgY2MudHdlZW4ocGFydGljbGUpXG4gICAgICAgICAgICAgICAgICAgIC5kZWxheSg0KVxuICAgICAgICAgICAgICAgICAgICAucmVwZWF0Rm9yZXZlcihcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLnR3ZWVuKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudG8oMC41LCB7IG9wYWNpdHk6IDE1MCB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wYXJhbGxlbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2MudHdlZW4oKS50byhkdXJhdGlvbiwgeyB5OiBwYXJ0aWNsZS55ICsgNTAgKyBNYXRoLnJhbmRvbSgpICogMzAgfSwgeyBlYXNpbmc6ICdzaW5lSW5PdXQnIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYy50d2VlbigpLnRvKGR1cmF0aW9uLCB7IHg6IHBhcnRpY2xlLnggKyAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiA0MCB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudG8oMC41LCB7IG9wYWNpdHk6IDAgfSlcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICAgICAgfSkoaSlcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDirZAg57uY5Yi25pif5b2iXG4gICAgICovXG4gICAgX2RyYXdTdGFyOiBmdW5jdGlvbihncmFwaGljcywgY3gsIGN5LCBpbm5lclJhZGl1cywgcG9pbnRzKSB7XG4gICAgICAgIHZhciBvdXRlclJhZGl1cyA9IGlubmVyUmFkaXVzICogMlxuICAgICAgICBncmFwaGljcy5tb3ZlVG8oY3gsIGN5ICsgb3V0ZXJSYWRpdXMpXG4gICAgICAgIFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBvaW50cyAqIDI7IGkrKykge1xuICAgICAgICAgICAgdmFyIHJhZGl1cyA9IGkgJSAyID09PSAwID8gb3V0ZXJSYWRpdXMgOiBpbm5lclJhZGl1c1xuICAgICAgICAgICAgdmFyIGFuZ2xlID0gKGkgKiBNYXRoLlBJKSAvIHBvaW50cyAtIE1hdGguUEkgLyAyXG4gICAgICAgICAgICB2YXIgeCA9IGN4ICsgTWF0aC5jb3MoYW5nbGUpICogcmFkaXVzXG4gICAgICAgICAgICB2YXIgeSA9IGN5ICsgTWF0aC5zaW4oYW5nbGUpICogcmFkaXVzXG4gICAgICAgICAgICBncmFwaGljcy5saW5lVG8oeCwgeSlcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZ3JhcGhpY3MuY2xvc2UoKVxuICAgICAgICBncmFwaGljcy5maWxsKClcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+UoiDlkK/liqjmlbDlrZfliqjnlLtcbiAgICAgKi9cbiAgICBfc3RhcnROdW1iZXJBbmltYXRpb25zOiBmdW5jdGlvbihwb3B1cE5vZGUsIGRhdGEsIG15V2luR29sZCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgXG4gICAgICAgIC8vIOWAjeaVsOa7muWKqOWKqOeUu1xuICAgICAgICB2YXIgbXVsdGlWYWx1ZU5vZGUgPSBzZWxmLl9maW5kTm9kZUJ5TmFtZShwb3B1cE5vZGUsIFwiTXVsdGlwbGllclZhbHVlXCIpXG4gICAgICAgIGlmIChtdWx0aVZhbHVlTm9kZSkge1xuICAgICAgICAgICAgdmFyIHRhcmdldE11bHRpID0gZGF0YS5tdWx0aXBsZSB8fCAxXG4gICAgICAgICAgICBzZWxmLl9hbmltYXRlTnVtYmVyKG11bHRpVmFsdWVOb2RlLCAxLCB0YXJnZXRNdWx0aSwgODAwLCBcInhcIilcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5SiIOaVsOWtl+a7muWKqOWKqOeUu1xuICAgICAqL1xuICAgIF9hbmltYXRlTnVtYmVyOiBmdW5jdGlvbihub2RlLCBmcm9tLCB0bywgZHVyYXRpb24sIHByZWZpeCkge1xuICAgICAgICBpZiAoIW5vZGUpIHJldHVyblxuICAgICAgICB2YXIgbGFiZWwgPSBub2RlLmdldENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgaWYgKCFsYWJlbCkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICB2YXIgc3RhcnRUaW1lID0gRGF0ZS5ub3coKVxuICAgICAgICB2YXIgZGlmZiA9IHRvIC0gZnJvbVxuICAgICAgICBcbiAgICAgICAgdmFyIHVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCFub2RlLmlzVmFsaWQpIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgZWxhcHNlZCA9IERhdGUubm93KCkgLSBzdGFydFRpbWVcbiAgICAgICAgICAgIHZhciBwcm9ncmVzcyA9IE1hdGgubWluKGVsYXBzZWQgLyBkdXJhdGlvbiwgMSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5L2/55So57yT5Yqo5Ye95pWwXG4gICAgICAgICAgICB2YXIgZWFzZVByb2dyZXNzID0gMSAtIE1hdGgucG93KDEgLSBwcm9ncmVzcywgMykgLy8gZWFzZU91dEN1YmljXG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IE1hdGguZmxvb3IoZnJvbSArIGRpZmYgKiBlYXNlUHJvZ3Jlc3MpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxhYmVsLnN0cmluZyA9IChwcmVmaXggfHwgXCJcIikgKyBjdXJyZW50XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChwcm9ncmVzcyA8IDEpIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KHVwZGF0ZSwgMTYpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGxhYmVsLnN0cmluZyA9IChwcmVmaXggfHwgXCJcIikgKyB0b1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB1cGRhdGUoKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5SNIOafpeaJvuiKgueCuVxuICAgICAqL1xuICAgIF9maW5kTm9kZUJ5TmFtZTogZnVuY3Rpb24ocGFyZW50LCBuYW1lKSB7XG4gICAgICAgIGlmICghcGFyZW50KSByZXR1cm4gbnVsbFxuICAgICAgICBcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gcGFyZW50LmNoaWxkcmVuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChjaGlsZHJlbltpXS5uYW1lID09PSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNoaWxkcmVuW2ldXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZm91bmQgPSB0aGlzLl9maW5kTm9kZUJ5TmFtZShjaGlsZHJlbltpXSwgbmFtZSlcbiAgICAgICAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGZvdW5kXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog5YWz6Zet57uT566X5by556qXIC0g5bim57yp5bCP5reh5Ye65Yqo55S7XG4gICAgICovXG4gICAgX2Nsb3NlR2FtZVJlc3VsdFBvcHVwOiBmdW5jdGlvbihwb3B1cE5vZGUsIG1hc2tOb2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICBcbiAgICAgICAgLy8g5YGc5q2i5omA5pyJ57KS5a2Q5Yqo55S7XG4gICAgICAgIGlmICh0aGlzLl9yZXN1bHRFZmZlY3RMYXllcikge1xuICAgICAgICAgICAgdGhpcy5fcmVzdWx0RWZmZWN0TGF5ZXIuc3RvcEFsbEFjdGlvbnMoKVxuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5fcmVzdWx0RWZmZWN0TGF5ZXIuY2hpbGRyZW5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjaGlsZHJlbltpXS5zdG9wQWxsQWN0aW9ucygpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOW8ueeql+e8qeWwj+a3oeWHuuWKqOeUu1xuICAgICAgICBpZiAocG9wdXBOb2RlKSB7XG4gICAgICAgICAgICBjYy50d2Vlbihwb3B1cE5vZGUpXG4gICAgICAgICAgICAgICAgLnRvKDAuMiwgeyBzY2FsZTogMC44LCBvcGFjaXR5OiAwIH0sIHsgZWFzaW5nOiAnYmFja0luJyB9KVxuICAgICAgICAgICAgICAgIC5jYWxsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAocG9wdXBOb2RlICYmIHBvcHVwTm9kZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3B1cE5vZGUuZGVzdHJveSgpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5zdGFydCgpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmBrue9qea3oeWHulxuICAgICAgICBpZiAobWFza05vZGUpIHtcbiAgICAgICAgICAgIGNjLnR3ZWVuKG1hc2tOb2RlKVxuICAgICAgICAgICAgICAgIC50bygwLjIsIHsgb3BhY2l0eTogMCB9KVxuICAgICAgICAgICAgICAgIC5jYWxsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWFza05vZGUgJiYgbWFza05vZGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFza05vZGUuZGVzdHJveSgpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5zdGFydCgpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2dhbWVSZXN1bHRQb3B1cCA9IG51bGxcbiAgICAgICAgdGhpcy5fZ2FtZVJlc3VsdE1hc2sgPSBudWxsXG4gICAgICAgIHRoaXMuX3Jlc3VsdEVmZmVjdExheWVyID0gbnVsbFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDnu6fnu63muLjmiI9cbiAgICAgKi9cbiAgICBfY29udGludWVHYW1lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIGlmICghbXlnbG9iYWwgfHwgIW15Z2xvYmFsLnBsYXllckRhdGEpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5qOA5p+l546p5a626LGG5a2Q5piv5ZCm6Laz5aSf57un57ut5ri45oiPXG4gICAgICAgIHZhciBwbGF5ZXJHb2xkID0gbXlnbG9iYWwucGxheWVyRGF0YS5nb2JhbF9jb3VudCB8fCAwXG4gICAgICAgIHZhciByb29tQ29uZmlnID0gbXlnbG9iYWwuY3VycmVudFJvb21Db25maWcgfHwge31cbiAgICAgICAgdmFyIG1pbkdvbGQgPSByb29tQ29uZmlnLm1pbl9nb2xkIHx8IHJvb21Db25maWcubWluR29sZCB8fCAwXG4gICAgICAgIFxuICAgICAgICBpZiAocGxheWVyR29sZCA8IG1pbkdvbGQpIHtcbiAgICAgICAgICAgIC8vIOixhuWtkOS4jei2s++8jOaYvuekuuixhuWtkOS4jei2s+W8ueeql1xuICAgICAgICAgICAgdGhpcy5fc2hvd0luc3VmZmljaWVudEdvbGRQb3B1cChwbGF5ZXJHb2xkLCBtaW5Hb2xkKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOixhuWtkOi2s+Wkn++8jOe7p+e7rea4uOaIj1xuICAgICAgICB0aGlzLl9kb0NvbnRpbnVlR2FtZSgpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5omn6KGM57un57ut5ri45oiP6YC76L6RXG4gICAgICovXG4gICAgX2RvQ29udGludWVHYW1lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g5riF55CG5b2T5YmN5ri45oiP54q25oCBXG4gICAgICAgIHRoaXMuX3Jlc2V0R2FtZVN0YXRlKClcbiAgICAgICAgXG4gICAgICAgIC8vIOWPkemAgSByZWFkeSDor7fmsYLvvIjlh4blpIfkuIvkuIDlsYDvvIlcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIGlmIChteWdsb2JhbCAmJiBteWdsb2JhbC5zb2NrZXQgJiYgbXlnbG9iYWwuc29ja2V0LnJlcXVlc3RSZWFkeSkge1xuICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LnJlcXVlc3RSZWFkeSgpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOaYvuekuuetieW+heaPkOekulxuICAgICAgICBpZiAodGhpcy50aXBzTGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMudGlwc0xhYmVsLnN0cmluZyA9IFwi562J5b6F5YW25LuW546p5a62Li4uXCJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi50aXBzTGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50aXBzTGFiZWwuc3RyaW5nID0gXCJcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDUwMDApXG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHmmL7npLrosYblrZDkuI3otrPlvLnnqpdcbiAgICAgKi9cbiAgICBfc2hvd0luc3VmZmljaWVudEdvbGRQb3B1cDogZnVuY3Rpb24oY3VycmVudEdvbGQsIHJlcXVpcmVkR29sZCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgXG4gICAgICAgIC8vIOWFs+mXree7k+eul+W8ueeql1xuICAgICAgICB0aGlzLl9jbG9zZUdhbWVSZXN1bHRQb3B1cCgpXG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7rosYblrZDkuI3otrPlvLnnqpdcbiAgICAgICAgdmFyIGNhbnZhcyA9IGNjLmRpcmVjdG9yLmdldFNjZW5lKCkuZ2V0Q2hpbGRCeU5hbWUoXCJDYW52YXNcIilcbiAgICAgICAgaWYgKCFjYW52YXMpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgdmFyIHdpblNpemUgPSBjYy53aW5TaXplXG4gICAgICAgIFxuICAgICAgICAvLyDpga7nvanlsYJcbiAgICAgICAgdmFyIG1hc2tOb2RlID0gbmV3IGNjLk5vZGUoXCJJbnN1ZmZpY2llbnRHb2xkTWFza1wiKVxuICAgICAgICBtYXNrTm9kZS5hZGRDb21wb25lbnQoY2MuQmxvY2tJbnB1dEV2ZW50cylcbiAgICAgICAgdmFyIG1hc2tTcHJpdGUgPSBtYXNrTm9kZS5hZGRDb21wb25lbnQoY2MuU3ByaXRlKVxuICAgICAgICBtYXNrU3ByaXRlLnNwcml0ZUZyYW1lID0gbmV3IGNjLlNwcml0ZUZyYW1lKClcbiAgICAgICAgbWFza1Nwcml0ZS5zaXplTW9kZSA9IGNjLlNwcml0ZS5TaXplTW9kZS5DVVNUT01cbiAgICAgICAgbWFza05vZGUud2lkdGggPSB3aW5TaXplLndpZHRoICogMlxuICAgICAgICBtYXNrTm9kZS5oZWlnaHQgPSB3aW5TaXplLmhlaWdodCAqIDJcbiAgICAgICAgbWFza05vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMCwgMCwgMClcbiAgICAgICAgbWFza05vZGUub3BhY2l0eSA9IDE4MFxuICAgICAgICBtYXNrTm9kZS5wYXJlbnQgPSBjYW52YXNcbiAgICAgICAgXG4gICAgICAgIC8vIOW8ueeql+WuueWZqFxuICAgICAgICB2YXIgcG9wdXBOb2RlID0gbmV3IGNjLk5vZGUoXCJJbnN1ZmZpY2llbnRHb2xkUG9wdXBcIilcbiAgICAgICAgcG9wdXBOb2RlLnggPSAwXG4gICAgICAgIHBvcHVwTm9kZS55ID0gMFxuICAgICAgICBwb3B1cE5vZGUucGFyZW50ID0gY2FudmFzXG4gICAgICAgIFxuICAgICAgICAvLyDlvLnnqpfog4zmma9cbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmdcIilcbiAgICAgICAgdmFyIGdyYXBoaWNzID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgdmFyIHBvcHVwV2lkdGggPSA0NTBcbiAgICAgICAgdmFyIHBvcHVwSGVpZ2h0ID0gMzIwXG4gICAgICAgIGdyYXBoaWNzLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig0MCwgMzUsIDYwKVxuICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoLXBvcHVwV2lkdGgvMiwgLXBvcHVwSGVpZ2h0LzIsIHBvcHVwV2lkdGgsIHBvcHVwSGVpZ2h0LCAyMClcbiAgICAgICAgZ3JhcGhpY3MuZmlsbCgpXG4gICAgICAgIGdyYXBoaWNzLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjAwLCAxMDApXG4gICAgICAgIGdyYXBoaWNzLmxpbmVXaWR0aCA9IDNcbiAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KC1wb3B1cFdpZHRoLzIsIC1wb3B1cEhlaWdodC8yLCBwb3B1cFdpZHRoLCBwb3B1cEhlaWdodCwgMjApXG4gICAgICAgIGdyYXBoaWNzLnN0cm9rZSgpXG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOagh+mimFxuICAgICAgICB2YXIgdGl0bGVOb2RlID0gbmV3IGNjLk5vZGUoXCJUaXRsZVwiKVxuICAgICAgICB2YXIgdGl0bGVMYWJlbCA9IHRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHRpdGxlTGFiZWwuc3RyaW5nID0gXCLosYblrZDkuI3otrNcIlxuICAgICAgICB0aXRsZUxhYmVsLmZvbnRTaXplID0gMjhcbiAgICAgICAgdGl0bGVMYWJlbC5mb250RmFtaWx5ID0gXCJBcmlhbFwiXG4gICAgICAgIHRpdGxlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICB0aXRsZU5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDEwMClcbiAgICAgICAgdGl0bGVOb2RlLnkgPSBwb3B1cEhlaWdodC8yIC0gNDVcbiAgICAgICAgdGl0bGVOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5YiG6ZqU57q/XG4gICAgICAgIHZhciBsaW5lTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTGluZVwiKVxuICAgICAgICB2YXIgbGcgPSBsaW5lTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGxnLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDEwMCwgODAsIDYwKVxuICAgICAgICBsZy5saW5lV2lkdGggPSAxXG4gICAgICAgIGxnLm1vdmVUbygtcG9wdXBXaWR0aC8yICsgMzAsIHBvcHVwSGVpZ2h0LzIgLSA4MClcbiAgICAgICAgbGcubGluZVRvKHBvcHVwV2lkdGgvMiAtIDMwLCBwb3B1cEhlaWdodC8yIC0gODApXG4gICAgICAgIGxnLnN0cm9rZSgpXG4gICAgICAgIGxpbmVOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5YaF5a655Yy65Z+fXG4gICAgICAgIHZhciBjb250ZW50Tm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ29udGVudFwiKVxuICAgICAgICB2YXIgY29udGVudExhYmVsID0gY29udGVudE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBjb250ZW50TGFiZWwuc3RyaW5nID0gXCLlvZPliY3osYblrZA6IFwiICsgdGhpcy5fZm9ybWF0R29sZChjdXJyZW50R29sZCkgKyBcIlxcbumcgOimgeixhuWtkDogXCIgKyB0aGlzLl9mb3JtYXRHb2xkKHJlcXVpcmVkR29sZCkgKyBcIlxcblxcbuingueci+a/gOWKseinhumikeW5v+WRiuWPr+iOt+WPluixhuWtkFwiXG4gICAgICAgIGNvbnRlbnRMYWJlbC5mb250U2l6ZSA9IDIwXG4gICAgICAgIGNvbnRlbnRMYWJlbC5mb250RmFtaWx5ID0gXCJBcmlhbFwiXG4gICAgICAgIGNvbnRlbnRMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIGNvbnRlbnRMYWJlbC5vdmVyZmxvdyA9IGNjLkxhYmVsLk92ZXJmbG93LlJFU0laRV9IRUlHSFRcbiAgICAgICAgY29udGVudE5vZGUud2lkdGggPSBwb3B1cFdpZHRoIC0gNjBcbiAgICAgICAgY29udGVudE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjIwLCAyMjAsIDIyMClcbiAgICAgICAgY29udGVudE5vZGUueSA9IDIwXG4gICAgICAgIGNvbnRlbnROb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5oyJ6ZKu5Yy65Z+fXG4gICAgICAgIHZhciBidG5BcmVhTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQnV0dG9uQXJlYVwiKVxuICAgICAgICBidG5BcmVhTm9kZS55ID0gLXBvcHVwSGVpZ2h0LzIgKyA2MFxuICAgICAgICBidG5BcmVhTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOingueci+W5v+WRiuaMiemSrlxuICAgICAgICB2YXIgYWRCdG4gPSBuZXcgY2MuTm9kZShcIkFkQnRuXCIpXG4gICAgICAgIHZhciBhZEJnID0gYWRCdG4uYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBhZEJnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig4MCwgMTgwLCA4MClcbiAgICAgICAgYWRCZy5yb3VuZFJlY3QoLTEwMCwgLTI1LCAyMDAsIDUwLCAyNSlcbiAgICAgICAgYWRCZy5maWxsKClcbiAgICAgICAgYWRCdG4ueCA9IC0xMTBcbiAgICAgICAgYWRCdG4ucGFyZW50ID0gYnRuQXJlYU5vZGVcbiAgICAgICAgXG4gICAgICAgIHZhciBhZExhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIilcbiAgICAgICAgdmFyIGFkTGFiZWwgPSBhZExhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGFkTGFiZWwuc3RyaW5nID0gXCLop4LnnIvlub/lkYpcIlxuICAgICAgICBhZExhYmVsLmZvbnRTaXplID0gMjBcbiAgICAgICAgYWRMYWJlbC5mb250RmFtaWx5ID0gXCJBcmlhbFwiXG4gICAgICAgIGFkTGFiZWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIGFkTGFiZWxOb2RlLnBhcmVudCA9IGFkQnRuXG4gICAgICAgIFxuICAgICAgICAvLyDov5Tlm57lpKfljoXmjInpkq5cbiAgICAgICAgdmFyIGxvYmJ5QnRuID0gbmV3IGNjLk5vZGUoXCJMb2JieUJ0blwiKVxuICAgICAgICB2YXIgbG9iYnlCZyA9IGxvYmJ5QnRuLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgbG9iYnlCZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMTAwLCA4MCwgMTQwKVxuICAgICAgICBsb2JieUJnLnJvdW5kUmVjdCgtMTAwLCAtMjUsIDIwMCwgNTAsIDI1KVxuICAgICAgICBsb2JieUJnLmZpbGwoKVxuICAgICAgICBsb2JieUJ0bi54ID0gMTEwXG4gICAgICAgIGxvYmJ5QnRuLnBhcmVudCA9IGJ0bkFyZWFOb2RlXG4gICAgICAgIFxuICAgICAgICB2YXIgbG9iYnlMYWJlbE5vZGUgPSBuZXcgY2MuTm9kZShcIkxhYmVsXCIpXG4gICAgICAgIHZhciBsb2JieUxhYmVsID0gbG9iYnlMYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBsb2JieUxhYmVsLnN0cmluZyA9IFwi6L+U5Zue5aSn5Y6FXCJcbiAgICAgICAgbG9iYnlMYWJlbC5mb250U2l6ZSA9IDIwXG4gICAgICAgIGxvYmJ5TGFiZWwuZm9udEZhbWlseSA9IFwiQXJpYWxcIlxuICAgICAgICBsb2JieUxhYmVsTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICBsb2JieUxhYmVsTm9kZS5wYXJlbnQgPSBsb2JieUJ0blxuICAgICAgICBcbiAgICAgICAgLy8g5a2Y5YKo6IqC54K55byV55SoXG4gICAgICAgIHNlbGYuX2luc3VmZmljaWVudEdvbGRQb3B1cCA9IHBvcHVwTm9kZVxuICAgICAgICBzZWxmLl9pbnN1ZmZpY2llbnRHb2xkTWFzayA9IG1hc2tOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDop4LnnIvlub/lkYrmjInpkq7ngrnlh7vkuovku7ZcbiAgICAgICAgYWRCdG4ub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuX3dhdGNoQWRGb3JHb2xkKGZ1bmN0aW9uKHN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICAvLyDlub/lkYrop4LnnIvmiJDlip/vvIzlhbPpl63lvLnnqpflubbnu6fnu63muLjmiI9cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fY2xvc2VJbnN1ZmZpY2llbnRHb2xkUG9wdXAoKVxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9kb0NvbnRpbnVlR2FtZSgpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIOi/lOWbnuWkp+WOheaMiemSrueCueWHu+S6i+S7tlxuICAgICAgICBsb2JieUJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5fY2xvc2VJbnN1ZmZpY2llbnRHb2xkUG9wdXAoKVxuICAgICAgICAgICAgc2VsZi5fcmV0dXJuVG9Mb2JieSgpXG4gICAgICAgIH0pXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5YWz6Zet6LGG5a2Q5LiN6Laz5by556qXXG4gICAgICovXG4gICAgX2Nsb3NlSW5zdWZmaWNpZW50R29sZFBvcHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2luc3VmZmljaWVudEdvbGRQb3B1cCkge1xuICAgICAgICAgICAgdGhpcy5faW5zdWZmaWNpZW50R29sZFBvcHVwLmRlc3Ryb3koKVxuICAgICAgICAgICAgdGhpcy5faW5zdWZmaWNpZW50R29sZFBvcHVwID0gbnVsbFxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9pbnN1ZmZpY2llbnRHb2xkTWFzaykge1xuICAgICAgICAgICAgdGhpcy5faW5zdWZmaWNpZW50R29sZE1hc2suZGVzdHJveSgpXG4gICAgICAgICAgICB0aGlzLl9pbnN1ZmZpY2llbnRHb2xkTWFzayA9IG51bGxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeingueci+a/gOWKseinhumikeW5v+WRiuiOt+WPluixhuWtkFxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0g5Zue6LCD5Ye95pWw77yM5Y+C5pWw5Li65piv5ZCm5oiQ5YqfXG4gICAgICovXG4gICAgX3dhdGNoQWRGb3JHb2xkOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgXG4gICAgICAgIC8vIOajgOafpeaYr+WQpuacieW5v+WRilNES++8iOWPr+agueaNruWunumZhembhuaIkOeahOW5v+WRilNES+iwg+aVtO+8iVxuICAgICAgICAvLyDov5nph4zmj5DkvpvkuIDkuKrpgJrnlKjnmoTlrp7njrDmoYbmnrZcbiAgICAgICAgXG4gICAgICAgIC8vIOaWueW8jzE6IOWmguaenOmbhuaIkOS6huepv+WxseeUsuW5v+WRilNESyAoQnl0ZWRhbmNlKVxuICAgICAgICBpZiAodHlwZW9mIHR0ICE9PSAndW5kZWZpbmVkJyAmJiB0dC5zaG93UmV3YXJkZWRWaWRlb0FkKSB7XG4gICAgICAgICAgICB0dC5zaG93UmV3YXJkZWRWaWRlb0FkKHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5bm/5ZGK6KeC55yL5oiQ5Yqf77yM5aWW5Yqx6LGG5a2QXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3Jld2FyZEdvbGRBZnRlckFkKGNhbGxiYWNrKVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZmFpbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOW5v+WRiuingueci+Wksei0pVxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93TWVzc2FnZShcIuW5v+WRiuWKoOi9veWksei0pe+8jOivt+eojeWQjumHjeivlVwiKVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGZhbHNlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pa55byPMjog5aaC5p6c6ZuG5oiQ5LqG5b6u5L+h5bCP5ri45oiP5bm/5ZGKU0RLXG4gICAgICAgIGlmICh0eXBlb2Ygd3ggIT09ICd1bmRlZmluZWQnICYmIHd4LmNyZWF0ZVJld2FyZGVkVmlkZW9BZCkge1xuICAgICAgICAgICAgdmFyIHJld2FyZGVkVmlkZW9BZCA9IHd4LmNyZWF0ZVJld2FyZGVkVmlkZW9BZCh7XG4gICAgICAgICAgICAgICAgYWRVbml0SWQ6ICdhZHVuaXQteHh4JyAvLyDmm7/mjaLkuLrlrp7pmYXnmoTlub/lkYrljZXlhYNJRFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV3YXJkZWRWaWRlb0FkLm9uQ2xvc2UoZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlcyAmJiByZXMuaXNFbmRlZCkge1xuICAgICAgICAgICAgICAgICAgICAvLyDnlKjmiLflrozmlbTop4LnnIvkuoblub/lkYpcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fcmV3YXJkR29sZEFmdGVyQWQoY2FsbGJhY2spXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g55So5oi35o+Q5YmN5YWz6Zet5LqG5bm/5ZGKXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dNZXNzYWdlKFwi6K+35a6M5pW06KeC55yL5bm/5ZGK6I635Y+W5aWW5YqxXCIpXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soZmFsc2UpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV3YXJkZWRWaWRlb0FkLm9uRXJyb3IoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc2hvd01lc3NhZ2UoXCLlub/lkYrliqDovb3lpLHotKXvvIzor7fnqI3lkI7ph43or5VcIilcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGZhbHNlKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV3YXJkZWRWaWRlb0FkLnNob3coKS5jYXRjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyDlpLHotKXph43or5VcbiAgICAgICAgICAgICAgICByZXdhcmRlZFZpZGVvQWQubG9hZCgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXdhcmRlZFZpZGVvQWQuc2hvdygpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pa55byPMzog5qih5ouf5bm/5ZGK77yI5byA5Y+R5rWL6K+V55So77yJXG4gICAgICAgIC8vIOWcqOWunumZheWPkeW4g+aXtuW6lOivpeWIoOmZpOatpOWIhuaUr+aIluabv+aNouS4uuecn+WunuW5v+WRilNES1xuICAgICAgICBzZWxmLl9zaG93TWVzc2FnZShcIuato+WcqOWKoOi9veW5v+WRii4uLlwiKVxuICAgICAgICBcbiAgICAgICAgLy8g5qih5ouf5bm/5ZGK6KeC55yL6L+H56iL77yIMuenkuWQjuWlluWKseixhuWtkO+8iVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc2VsZi5fcmV3YXJkR29sZEFmdGVyQWQoY2FsbGJhY2spXG4gICAgICAgIH0sIDIwMDApXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5bm/5ZGK6KeC55yL5oiQ5Yqf5ZCO5aWW5Yqx6LGG5a2QXG4gICAgICovXG4gICAgX3Jld2FyZEdvbGRBZnRlckdvbGQ6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAoIW15Z2xvYmFsIHx8ICFteWdsb2JhbC5wbGF5ZXJEYXRhKSB7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKGZhbHNlKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWlluWKseixhuWtkOaVsOmHj++8iOWPr+agueaNruWunumZhemcgOaxguiwg+aVtO+8iVxuICAgICAgICB2YXIgcmV3YXJkQW1vdW50ID0gNTAwMFxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw5pys5Zyw6LGG5a2Q5pWw6YePXG4gICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEudXBkYXRlR29sZChyZXdhcmRBbW91bnQpXG4gICAgICAgIFxuICAgICAgICAvLyDmmL7npLrlpZblirHmj5DnpLpcbiAgICAgICAgdGhpcy5fc2hvd01lc3NhZ2UoXCLojrflvpcgXCIgKyB0aGlzLl9mb3JtYXRHb2xkKHJld2FyZEFtb3VudCkgKyBcIiDosYblrZDvvIFcIilcbiAgICAgICAgXG4gICAgICAgIC8vIOmAmuefpeacjeWKoeerr++8iOWmguaenOmcgOimgeWQjOatpe+8iVxuICAgICAgICBpZiAobXlnbG9iYWwuc29ja2V0ICYmIG15Z2xvYmFsLnNvY2tldC5zZW5kQWRSZXdhcmQpIHtcbiAgICAgICAgICAgIG15Z2xvYmFsLnNvY2tldC5zZW5kQWRSZXdhcmQocmV3YXJkQW1vdW50KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKHRydWUpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5L+u5aSN44CR5bm/5ZGK6KeC55yL5oiQ5Yqf5ZCO5aWW5Yqx6LGG5a2Q77yI5L+u5q2j5pa55rOV5ZCN5ou85YaZ6ZSZ6K+v77yJXG4gICAgICovXG4gICAgX3Jld2FyZEdvbGRBZnRlckFkOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCB8fCAhbXlnbG9iYWwucGxheWVyRGF0YSkge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayhmYWxzZSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlpZblirHosYblrZDmlbDph4/vvIjlj6/moLnmja7lrp7pmYXpnIDmsYLosIPmlbTvvIlcbiAgICAgICAgdmFyIHJld2FyZEFtb3VudCA9IDUwMDBcbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOacrOWcsOixhuWtkOaVsOmHj1xuICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLnVwZGF0ZUdvbGQocmV3YXJkQW1vdW50KVxuICAgICAgICBcbiAgICAgICAgLy8g5pi+56S65aWW5Yqx5o+Q56S6XG4gICAgICAgIHRoaXMuX3Nob3dNZXNzYWdlKFwi6I635b6XIFwiICsgdGhpcy5fZm9ybWF0R29sZChyZXdhcmRBbW91bnQpICsgXCIg6LGG5a2Q77yBXCIpXG4gICAgICAgIFxuICAgICAgICAvLyDpgJrnn6XmnI3liqHnq6/vvIjlpoLmnpzpnIDopoHlkIzmraXvvIlcbiAgICAgICAgaWYgKG15Z2xvYmFsLnNvY2tldCAmJiBteWdsb2JhbC5zb2NrZXQuc2VuZEFkUmV3YXJkKSB7XG4gICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQuc2VuZEFkUmV3YXJkKHJld2FyZEFtb3VudClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKGNhbGxiYWNrKSBjYWxsYmFjayh0cnVlKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeagvOW8j+WMluixhuWtkOaVsOmHj+aYvuekulxuICAgICAqL1xuICAgIF9mb3JtYXRHb2xkOiBmdW5jdGlvbihnb2xkKSB7XG4gICAgICAgIGlmIChnb2xkID49IDEwMDAwKSB7XG4gICAgICAgICAgICByZXR1cm4gKGdvbGQgLyAxMDAwMCkudG9GaXhlZCgxKSArIFwi5LiHXCJcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZ29sZC50b1N0cmluZygpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5pi+56S65raI5oGv5o+Q56S6XG4gICAgICovXG4gICAgX3Nob3dNZXNzYWdlOiBmdW5jdGlvbihtc2cpIHtcbiAgICAgICAgaWYgKHRoaXMudGlwc0xhYmVsKSB7XG4gICAgICAgICAgICB0aGlzLnRpcHNMYWJlbC5zdHJpbmcgPSBtc2dcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi50aXBzTGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50aXBzTGFiZWwuc3RyaW5nID0gXCJcIlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDMwMDApXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog6L+U5Zue5aSn5Y6FXG4gICAgICovXG4gICAgX3JldHVyblRvTG9iYnk6IGZ1bmN0aW9uKCkge1xuICAgICAgICBcbiAgICAgICAgLy8g5riF55CG5b2T5YmN5ri45oiP54q25oCBXG4gICAgICAgIHRoaXMuX3Jlc2V0R2FtZVN0YXRlKClcbiAgICAgICAgXG4gICAgICAgIC8vIOWPkemAgeemu+W8gOaIv+mXtOivt+axglxuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKG15Z2xvYmFsICYmIG15Z2xvYmFsLnNvY2tldCAmJiBteWdsb2JhbC5zb2NrZXQubGVhdmVSb29tKSB7XG4gICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQubGVhdmVSb29tKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn46uIFtfcmV0dXJuVG9Mb2JieV0gbXlnbG9iYWwuc29ja2V0LmxlYXZlUm9vbSDkuI3lj6/nlKhcIilcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5Yqg6L295aSn5Y6F5Zy65pmvXG4gICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZShcImhhbGxTY2VuZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog6YeN572u5ri45oiP54q25oCBXG4gICAgICovXG4gICAgX3Jlc2V0R2FtZVN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g5riF55CG5omL54mMXG4gICAgICAgIHRoaXMuaGFuZENhcmRzID0gW11cbiAgICAgICAgdGhpcy5ib3R0b21DYXJkcyA9IFtdXG4gICAgICAgIHRoaXMuY2hvb3NlX2NhcmRfZGF0YSA9IFtdXG4gICAgICAgIFxuICAgICAgICAvLyDmuIXnkIbljaHniYzoioLngrlcbiAgICAgICAgdGhpcy5jbGVhckFsbENhcmRzKClcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmuIXnkIbmiYDmnInnjqnlrrbnmoTlh7rniYzljLrln5/vvIjmoYzpnaLkuIrnmoTniYzvvIlcbiAgICAgICAgdGhpcy5fY2xlYXJBbGxPdXRDYXJkWm9uZXMoKVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkea4heeQhuW6leeJjOiKgueCuVxuICAgICAgICB0aGlzLl9jbGVhckJvdHRvbUNhcmRzKClcbiAgICAgICAgXG4gICAgICAgIC8vIOmHjee9rua4uOaIj+mYtuautVxuICAgICAgICB0aGlzLl9nYW1lUGhhc2UgPSBcImlkbGVcIlxuICAgICAgICB0aGlzLl9iaWRkaW5nUGhhc2UgPSBcImlkbGVcIlxuICAgICAgICBcbiAgICAgICAgLy8g6ZqQ6JeP5omA5pyJVUlcbiAgICAgICAgdGhpcy5faGlkZVJvYlVJKClcbiAgICAgICAgaWYgKHRoaXMucGxheWluZ1VJX25vZGUpIHtcbiAgICAgICAgICAgIHRoaXMucGxheWluZ1VJX25vZGUuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOaWsOWinuOAkemHjee9ruaJgOacieeOqeWutueahOWHhuWkh+Wbvuagh+eKtuaAgVxuICAgICAgICB0aGlzLl9yZXNldEFsbFBsYXllclJlYWR5U3RhdGUoKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkea4heeQhuaJgOacieeOqeWutueahOWHuueJjOWMuuWfn1xuICAgICAqL1xuICAgIF9jbGVhckFsbE91dENhcmRab25lczogZnVuY3Rpb24oKSB7XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5re75Yqg5pu05a6M5pW055qE56m65YC85qOA5p+lXG4gICAgICAgIGlmICghdGhpcy5ub2RlIHx8ICF0aGlzLm5vZGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+OriBbX2NsZWFyQWxsT3V0Q2FyZFpvbmVzXSB0aGlzLm5vZGUg5Li656m65oiW5bey6ZSA5q+BXCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+WIGdhbWVTY2VuZSDohJrmnKxcbiAgICAgICAgdmFyIGdhbWVTY2VuZV9zY3JpcHQgPSB0aGlzLm5vZGUucGFyZW50ID8gdGhpcy5ub2RlLnBhcmVudC5nZXRDb21wb25lbnQoXCJnYW1lU2NlbmVcIikgOiBudWxsXG4gICAgICAgIGlmICghZ2FtZVNjZW5lX3NjcmlwdCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+OriBbX2NsZWFyQWxsT3V0Q2FyZFpvbmVzXSDml6Dms5Xojrflj5YgZ2FtZVNjZW5lXCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+W546p5a625bqn5L2N6IqC54K5XG4gICAgICAgIHZhciBwbGF5ZXJzX3NlYXRfcG9zID0gZ2FtZVNjZW5lX3NjcmlwdC5wbGF5ZXJzX3NlYXRfcG9zXG4gICAgICAgIGlmICghcGxheWVyc19zZWF0X3Bvcykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+OriBbX2NsZWFyQWxsT3V0Q2FyZFpvbmVzXSDml6Dms5Xojrflj5YgcGxheWVyc19zZWF0X3Bvc1wiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmBjeWOhuaJgOacieW6p+S9je+8jOa4heeQhuWHuueJjOWMuuWfn1xuICAgICAgICB2YXIgY2hpbGRyZW4gPSBwbGF5ZXJzX3NlYXRfcG9zLmNoaWxkcmVuXG4gICAgICAgIGlmICghY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCfjq4gW19jbGVhckFsbE91dENhcmRab25lc10gcGxheWVyc19zZWF0X3Bvcy5jaGlsZHJlbiDkuLrnqbpcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc2VhdE5vZGUgPSBjaGlsZHJlbltpXVxuICAgICAgICAgICAgaWYgKCFzZWF0Tm9kZSkgY29udGludWVcbiAgICAgICAgICAgIC8vIOafpeaJvuWHuueJjOWMuuWfn+iKgueCue+8iGNhcmRzb3V0em9uZTAsIGNhcmRzb3V0em9uZTEsIGNhcmRzb3V0em9uZTLvvIlcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgMzsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG91dFpvbmVOYW1lID0gXCJjYXJkc291dHpvbmVcIiArIGpcbiAgICAgICAgICAgICAgICB2YXIgb3V0Wm9uZSA9IHNlYXROb2RlLmdldENoaWxkQnlOYW1lKG91dFpvbmVOYW1lKVxuICAgICAgICAgICAgICAgIGlmIChvdXRab25lKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dFpvbmUucmVtb3ZlQWxsQ2hpbGRyZW4odHJ1ZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHmuIXnkIblupXniYzoioLngrlcbiAgICAgKi9cbiAgICBfY2xlYXJCb3R0b21DYXJkczogZnVuY3Rpb24oKSB7XG4gICAgICAgIFxuICAgICAgICAvLyDplIDmr4HlupXniYzoioLngrlcbiAgICAgICAgaWYgKHRoaXMuYm90dG9tX2NhcmQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ib3R0b21fY2FyZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmJvdHRvbV9jYXJkW2ldICYmIHRoaXMuYm90dG9tX2NhcmRbaV0uaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJvdHRvbV9jYXJkW2ldLmRlc3Ryb3koKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJvdHRvbV9jYXJkID0gW11cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHph43nva7miYDmnInnjqnlrrbnmoTlh4blpIflm77moIfnirbmgIFcbiAgICAgKi9cbiAgICBfcmVzZXRBbGxQbGF5ZXJSZWFkeVN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGdhbWVTY2VuZV9zY3JpcHQgPSB0aGlzLm5vZGUucGFyZW50ID8gdGhpcy5ub2RlLnBhcmVudC5nZXRDb21wb25lbnQoXCJnYW1lU2NlbmVcIikgOiBudWxsXG4gICAgICAgIGlmICghZ2FtZVNjZW5lX3NjcmlwdCB8fCAhZ2FtZVNjZW5lX3NjcmlwdC5wbGF5ZXJOb2RlTGlzdCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2FtZVNjZW5lX3NjcmlwdC5wbGF5ZXJOb2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHBsYXllck5vZGUgPSBnYW1lU2NlbmVfc2NyaXB0LnBsYXllck5vZGVMaXN0W2ldXG4gICAgICAgICAgICBpZiAocGxheWVyTm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJTY3JpcHQgPSBwbGF5ZXJOb2RlLmdldENvbXBvbmVudChcInBsYXllcl9ub2RlXCIpXG4gICAgICAgICAgICAgICAgaWYgKHBsYXllclNjcmlwdCAmJiBwbGF5ZXJTY3JpcHQucmVhZHlpbWFnZSkge1xuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJTY3JpcHQucmVhZHlpbWFnZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeabtOaWsOeOqeWutuiKgueCueeahOmHkeW4geaYvuekulxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwbGF5ZXJJZCAtIOeOqeWutklEXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGdvbGQgLSDmlrDnmoTph5HluIHmlbDph49cbiAgICAgKi9cbiAgICBfdXBkYXRlUGxheWVyR29sZERpc3BsYXk6IGZ1bmN0aW9uKHBsYXllcklkLCBnb2xkKSB7XG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5YgZ2FtZVNjZW5lIOiEmuacrFxuICAgICAgICB2YXIgZ2FtZVNjZW5lX3NjcmlwdCA9IHRoaXMubm9kZS5wYXJlbnQgPyB0aGlzLm5vZGUucGFyZW50LmdldENvbXBvbmVudChcImdhbWVTY2VuZVwiKSA6IG51bGxcbiAgICAgICAgaWYgKCFnYW1lU2NlbmVfc2NyaXB0IHx8ICFnYW1lU2NlbmVfc2NyaXB0LnBsYXllck5vZGVMaXN0KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn4+GIFtfdXBkYXRlUGxheWVyR29sZERpc3BsYXldIOaXoOazleiOt+WPliBnYW1lU2NlbmUg5oiWIHBsYXllck5vZGVMaXN0XCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6YGN5Y6G5omA5pyJ546p5a626IqC54K577yM5om+5Yiw5Yy56YWN55qE546p5a625bm25pu05paw6YeR5biB5pi+56S6XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ2FtZVNjZW5lX3NjcmlwdC5wbGF5ZXJOb2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHBsYXllck5vZGUgPSBnYW1lU2NlbmVfc2NyaXB0LnBsYXllck5vZGVMaXN0W2ldXG4gICAgICAgICAgICBpZiAoIXBsYXllck5vZGUpIGNvbnRpbnVlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBwbGF5ZXJTY3JpcHQgPSBwbGF5ZXJOb2RlLmdldENvbXBvbmVudChcInBsYXllcl9ub2RlXCIpXG4gICAgICAgICAgICBpZiAoIXBsYXllclNjcmlwdCkgY29udGludWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5Yy56YWN546p5a62SURcbiAgICAgICAgICAgIGlmIChTdHJpbmcocGxheWVyU2NyaXB0LmFjY291bnRpZCkgPT09IFN0cmluZyhwbGF5ZXJJZCkpIHtcbiAgICAgICAgICAgICAgICAvLyDmm7TmlrDph5HluIHmmL7npLpcbiAgICAgICAgICAgICAgICBpZiAocGxheWVyU2NyaXB0Lmdsb2JhbGNvdW50X2xhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHBsYXllclNjcmlwdC5nbG9iYWxjb3VudF9sYWJlbC5zdHJpbmcgPSBTdHJpbmcoZ29sZClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5pu05paw546p5a626IqC54K555qE56ue5oqA5biB5pi+56S677yI56ue5oqA5Zy65qih5byP5LiT55So77yJXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBsYXllcklkIC0g546p5a62SURcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbWF0Y2hDb2luIC0g5paw55qE56ue5oqA5biB5pWw6YePXG4gICAgICovXG4gICAgX3VwZGF0ZVBsYXllck1hdGNoQ29pbkRpc3BsYXk6IGZ1bmN0aW9uKHBsYXllcklkLCBtYXRjaENvaW4pIHtcbiAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtfdXBkYXRlUGxheWVyTWF0Y2hDb2luRGlzcGxheV0g5pu05paw546p5a6256ue5oqA5biBOiBwbGF5ZXJJZD1cIiwgcGxheWVySWQsIFwibWF0Y2hDb2luPVwiLCBtYXRjaENvaW4pXG5cbiAgICAgICAgLy8g6I635Y+WIGdhbWVTY2VuZSDohJrmnKxcbiAgICAgICAgdmFyIGdhbWVTY2VuZV9zY3JpcHQgPSB0aGlzLm5vZGUucGFyZW50ID8gdGhpcy5ub2RlLnBhcmVudC5nZXRDb21wb25lbnQoXCJnYW1lU2NlbmVcIikgOiBudWxsXG4gICAgICAgIGlmICghZ2FtZVNjZW5lX3NjcmlwdCB8fCAhZ2FtZVNjZW5lX3NjcmlwdC5wbGF5ZXJOb2RlTGlzdCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+Pn++4jyBbX3VwZGF0ZVBsYXllck1hdGNoQ29pbkRpc3BsYXldIOaXoOazleiOt+WPliBnYW1lU2NlbmUg5oiWIHBsYXllck5vZGVMaXN0XCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOmBjeWOhuaJgOacieeOqeWutuiKgueCue+8jOaJvuWIsOWMuemFjeeahOeOqeWutuW5tuabtOaWsOernuaKgOW4geaYvuekulxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdhbWVTY2VuZV9zY3JpcHQucGxheWVyTm9kZUxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwbGF5ZXJOb2RlID0gZ2FtZVNjZW5lX3NjcmlwdC5wbGF5ZXJOb2RlTGlzdFtpXVxuICAgICAgICAgICAgaWYgKCFwbGF5ZXJOb2RlKSBjb250aW51ZVxuXG4gICAgICAgICAgICB2YXIgcGxheWVyU2NyaXB0ID0gcGxheWVyTm9kZS5nZXRDb21wb25lbnQoXCJwbGF5ZXJfbm9kZVwiKVxuICAgICAgICAgICAgaWYgKCFwbGF5ZXJTY3JpcHQpIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIC8vIOWMuemFjeeOqeWutklEXG4gICAgICAgICAgICBpZiAoU3RyaW5nKHBsYXllclNjcmlwdC5hY2NvdW50aWQpID09PSBTdHJpbmcocGxheWVySWQpKSB7XG4gICAgICAgICAgICAgICAgLy8g5pu05paw56ue5oqA5biB5pi+56S6XG4gICAgICAgICAgICAgICAgaWYgKHBsYXllclNjcmlwdC5nbG9iYWxjb3VudF9sYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJTY3JpcHQuZ2xvYmFsY291bnRfbGFiZWwuc3RyaW5nID0gU3RyaW5nKG1hdGNoQ29pbilcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtfdXBkYXRlUGxheWVyTWF0Y2hDb2luRGlzcGxheV0g5bey5pu05paw546p5a62IFwiLCBwbGF5ZXJJZCwgXCIg55qE56ue5oqA5biB5pi+56S65Li6IFwiLCBtYXRjaENvaW4pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHkv53lrZjnq57mioDluIHliLDnjqnlrrbohJrmnKzlrp7kvotcbiAgICAgICAgICAgICAgICBwbGF5ZXJTY3JpcHQuX21hdGNoQ29pbiA9IG1hdGNoQ29pblxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g44CQ56ue5oqA5Zy644CR5Yqf6IO95Ye95pWwXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiDwn4+G44CQ56ue5oqA5Zy644CR5pi+56S656ue5oqA5Zy65LiT55So57uT566X5by556qXXG4gICAgICog56ue5oqA5Zy657uT566X6aG15LiO5pmu6YCa5Zy65LiN5ZCM77yaXG4gICAgICogLSDlj6rmmL7npLrvvJrovpPotaLjgIHlgI3mlbDjgIHlvZPliY3mr5TotZvph5HluIFcbiAgICAgKiAtIOS4jeaYvuekuu+8mue7p+e7rea4uOaIj+OAgei/lOWbnuWkp+WOheaMiemSrlxuICAgICAqIC0g5pi+56S677yaXCLkuIvkuIDlsYDlvIDlp4sgMTXnp5JcIiDlgJLorqHml7ZcbiAgICAgKiBcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5aaC5p6c5piv5pyA57uI57uT566X77yI5Y+q5pyJM+S6uu+8ie+8jOi3s+i/h+atpOW8ueeql++8jOetieW+hSBvbkNvbXBldGl0aW9uQ2hhbXBpb24g5raI5oGv5pi+56S65o6S5ZCNXG4gICAgICovXG4gICAgX3Nob3dDb21wZXRpdGlvblJlc3VsdFBvcHVwOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruOAkeajgOafpeaYr+WQpuaYr+acgOe7iOe7k+eul++8iOWPquaciTPkurrlj4LotZvvvIlcbiAgICAgICAgLy8g5aaC5p6c5piv5pyA57uI57uT566X77yM6Lez6L+H5q2k5by556qX77yM562J5b6FIG9uQ29tcGV0aXRpb25DaGFtcGlvbiDmtojmga/mmL7npLrmjpLlkI1cbiAgICAgICAgaWYgKGRhdGEuaXNfZmluYWxfcm91bmQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+PhiBbX3Nob3dDb21wZXRpdGlvblJlc3VsdFBvcHVwXSDmo4DmtYvliLDmnIDnu4jnu5PnrpfvvIjlj6rmnIkz5Lq677yJ77yM6Lez6L+H5Lit6Ze057uT566X5by556qX77yM562J5b6F5o6S5ZCN5raI5oGvXCIpXG4gICAgICAgICAgICAvLyDkuI3mmL7npLrkuK3pl7TlvLnnqpfvvIznm7TmjqXnrYnlvoUgb25Db21wZXRpdGlvbkNoYW1waW9uIOa2iOaBr1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciB3aW5TaXplID0gY2Mud2luU2l6ZVxuICAgICAgICBcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIHZhciBteVBsYXllcklkID0gbXlnbG9iYWwuc29ja2V0LmdldFBsYXllckluZm8oKS5pZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLnNlcnZlclBsYXllcklkIHx8IG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEXG4gICAgICAgIFxuICAgICAgICAvLyDliKTmlq3ovpPotaJcbiAgICAgICAgdmFyIGlzV2lubmVyID0gZmFsc2VcbiAgICAgICAgdmFyIG15V2luR29sZCA9IDBcbiAgICAgICAgdmFyIG15TWF0Y2hDb2luID0gMCAgLy8g8J+Up+OAkOaWsOWinuOAkeW9k+WJjeeOqeWutueahOmHkeW4ge+8iOS7jmRhdGEucGxheWVyc+iOt+WPlu+8iVxuICAgICAgICBcbiAgICAgICAgaWYgKGRhdGEucGxheWVycyAmJiBkYXRhLnBsYXllcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLnBsYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcGxheWVyID0gZGF0YS5wbGF5ZXJzW2ldXG4gICAgICAgICAgICAgICAgaWYgKFN0cmluZyhwbGF5ZXIucGxheWVyX2lkKSA9PT0gU3RyaW5nKG15UGxheWVySWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzV2lubmVyID0gcGxheWVyLmlzX3dpbm5lclxuICAgICAgICAgICAgICAgICAgICBteVdpbkdvbGQgPSBwbGF5ZXIud2luX2dvbGRcbiAgICAgICAgICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeS7juacjeWKoeerr+i/lOWbnueahOeOqeWutuaVsOaNruS4reiOt+WPlumHkeW4gVxuICAgICAgICAgICAgICAgICAgICBpZiAocGxheWVyLm1hdGNoX2NvaW4gIT09IHVuZGVmaW5lZCAmJiBwbGF5ZXIubWF0Y2hfY29pbiA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBteU1hdGNoQ29pbiA9IHBsYXllci5tYXRjaF9jb2luXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmm7TmlrDlvZPliY3njqnlrrbnmoTph5HluIHmmL7npLpcbiAgICAgICAgdGhpcy5fbWF0Y2hDb2luID0gbXlNYXRjaENvaW5cblxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5pu05paw5omA5pyJ546p5a6255qE6YeR5biB5pi+56S6XG4gICAgICAgIGlmIChkYXRhLnBsYXllcnMgJiYgZGF0YS5wbGF5ZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5wbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBsYXllciA9IGRhdGEucGxheWVyc1tpXVxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJJZCA9IHBsYXllci5wbGF5ZXJfaWRcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2hDb2luID0gcGxheWVyLm1hdGNoX2NvaW5cblxuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHnq57mioDlnLrmqKHlvI/kuIvmm7TmlrDnjqnlrrbnmoTph5HluIHmmL7npLpcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hDb2luICE9PSB1bmRlZmluZWQgJiYgbWF0Y2hDb2luID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlUGxheWVyTWF0Y2hDb2luRGlzcGxheShwbGF5ZXJJZCwgbWF0Y2hDb2luKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBjYW52YXMgPSBjYy5maW5kKFwiQ2FudmFzXCIpIHx8IGNjLmZpbmQoXCJVSV9ST09UXCIpIHx8IHRoaXMubm9kZS5wYXJlbnRcbiAgICAgICAgaWYgKCFjYW52YXMpIGNhbnZhcyA9IHRoaXMubm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g6YGu572p5bGCXG4gICAgICAgIHZhciBtYXNrTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ29tcGV0aXRpb25SZXN1bHRNYXNrXCIpXG4gICAgICAgIG1hc2tOb2RlLmFkZENvbXBvbmVudChjYy5CbG9ja0lucHV0RXZlbnRzKVxuICAgICAgICBtYXNrTm9kZS5jb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDAsIDMwLCA1MCkgOiBuZXcgY2MuQ29sb3IoMzAsIDAsIDApXG4gICAgICAgIG1hc2tOb2RlLm9wYWNpdHkgPSAyMDBcbiAgICAgICAgbWFza05vZGUud2lkdGggPSB3aW5TaXplLndpZHRoICogMlxuICAgICAgICBtYXNrTm9kZS5oZWlnaHQgPSB3aW5TaXplLmhlaWdodCAqIDJcbiAgICAgICAgbWFza05vZGUuekluZGV4ID0gOTk5XG4gICAgICAgIG1hc2tOb2RlLnBhcmVudCA9IGNhbnZhc1xuICAgICAgICBcbiAgICAgICAgLy8g5by556qX5a655ZmoXG4gICAgICAgIHZhciBwb3B1cE5vZGUgPSBuZXcgY2MuTm9kZShcIkNvbXBldGl0aW9uUmVzdWx0UG9wdXBcIilcbiAgICAgICAgcG9wdXBOb2RlLnNjYWxlID0gMC41XG4gICAgICAgIHBvcHVwTm9kZS5vcGFjaXR5ID0gMFxuICAgICAgICBwb3B1cE5vZGUuekluZGV4ID0gMTAwMFxuICAgICAgICBwb3B1cE5vZGUucGFyZW50ID0gY2FudmFzXG4gICAgICAgIFxuICAgICAgICB2YXIgcG9wdXBXaWR0aCA9IDQ1MFxuICAgICAgICB2YXIgcG9wdXBIZWlnaHQgPSAzODAgIC8vIPCflKfjgJDosIPmlbTjgJHlop7liqDpq5jluqbku6XlrrnnurPlgJLorqHml7ZcbiAgICAgICAgXG4gICAgICAgIC8vIOiDjOaZr1xuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCZ1wiKVxuICAgICAgICB2YXIgYmcgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBiZy5maWxsQ29sb3IgPSBpc1dpbm5lciA/IG5ldyBjYy5Db2xvcig0MCwgNTAsIDgwLCAyNDApIDogbmV3IGNjLkNvbG9yKDUwLCAzNSwgNDAsIDI0MClcbiAgICAgICAgYmcucm91bmRSZWN0KC1wb3B1cFdpZHRoLzIsIC1wb3B1cEhlaWdodC8yLCBwb3B1cFdpZHRoLCBwb3B1cEhlaWdodCwgMjApXG4gICAgICAgIGJnLmZpbGwoKVxuICAgICAgICBiZy5zdHJva2VDb2xvciA9IGlzV2lubmVyID8gbmV3IGNjLkNvbG9yKDEwMCwgMjAwLCAyNTUpIDogbmV3IGNjLkNvbG9yKDIwMCwgMTAwLCAxMDApXG4gICAgICAgIGJnLmxpbmVXaWR0aCA9IDNcbiAgICAgICAgYmcucm91bmRSZWN0KC1wb3B1cFdpZHRoLzIsIC1wb3B1cEhlaWdodC8yLCBwb3B1cFdpZHRoLCBwb3B1cEhlaWdodCwgMjApXG4gICAgICAgIGJnLnN0cm9rZSgpXG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOagh+mimFxuICAgICAgICB2YXIgdGl0bGVOb2RlID0gbmV3IGNjLk5vZGUoXCJUaXRsZVwiKVxuICAgICAgICB2YXIgdGl0bGVMYWJlbCA9IHRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHRpdGxlTGFiZWwuc3RyaW5nID0gaXNXaW5uZXIgPyBcIvCfjokg6IOc5YipIPCfjolcIiA6IFwi4pyWIOWksei0pSDinJZcIlxuICAgICAgICB0aXRsZUxhYmVsLmZvbnRTaXplID0gMzZcbiAgICAgICAgdGl0bGVOb2RlLmNvbG9yID0gaXNXaW5uZXIgPyBuZXcgY2MuQ29sb3IoMTAwLCAyNTUsIDIwMCkgOiBuZXcgY2MuQ29sb3IoMjU1LCAxNTAsIDE1MClcbiAgICAgICAgdGl0bGVOb2RlLnkgPSBwb3B1cEhlaWdodC8yIC0gNTBcbiAgICAgICAgdGl0bGVOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkei+k+i1oumHkeminSAtIOernuaKgOWcuuaYvuekulwi6YeR5biBXCLvvIjkuI3mmK/nq57mioDluIHvvIlcbiAgICAgICAgdmFyIHJlc3VsdE5vZGUgPSBuZXcgY2MuTm9kZShcIlJlc3VsdFwiKVxuICAgICAgICB2YXIgcmVzdWx0TGFiZWwgPSByZXN1bHROb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgcmVzdWx0TGFiZWwuc3RyaW5nID0gXCLmnKzlsYDnu5Pmnpw6IFwiICsgKG15V2luR29sZCA+PSAwID8gXCIrXCIgOiBcIlwiKSArIG15V2luR29sZCArIFwiIOmHkeW4gVwiXG4gICAgICAgIHJlc3VsdExhYmVsLmZvbnRTaXplID0gMjhcbiAgICAgICAgcmVzdWx0Tm9kZS5jb2xvciA9IG15V2luR29sZCA+PSAwID8gbmV3IGNjLkNvbG9yKDEwMCwgMjU1LCAxMDApIDogbmV3IGNjLkNvbG9yKDI1NSwgMTAwLCAxMDApXG4gICAgICAgIHJlc3VsdE5vZGUueSA9IHBvcHVwSGVpZ2h0LzIgLSAxMDBcbiAgICAgICAgcmVzdWx0Tm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOWAjeaVsFxuICAgICAgICB2YXIgbXVsdGlOb2RlID0gbmV3IGNjLk5vZGUoXCJNdWx0aXBsaWVyXCIpXG4gICAgICAgIHZhciBtdWx0aUxhYmVsID0gbXVsdGlOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgbXVsdGlMYWJlbC5zdHJpbmcgPSBcIuacrOWxgOWAjeaVsDogeFwiICsgKGRhdGEubXVsdGlwbGUgfHwgMSlcbiAgICAgICAgbXVsdGlMYWJlbC5mb250U2l6ZSA9IDI0XG4gICAgICAgIG11bHRpTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIyMCwgMTUwKVxuICAgICAgICBtdWx0aU5vZGUueSA9IHBvcHVwSGVpZ2h0LzIgLSAxNDBcbiAgICAgICAgbXVsdGlOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeW9k+WJjemHkeW4ge+8iOS4jeaYr+ernuaKgOW4ge+8iVxuICAgICAgICB2YXIgY29pbk5vZGUgPSBuZXcgY2MuTm9kZShcIk1hdGNoQ29pblwiKVxuICAgICAgICB2YXIgY29pbkxhYmVsID0gY29pbk5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBjb2luTGFiZWwuc3RyaW5nID0gXCLlvZPliY3ph5HluIE6IFwiICsgdGhpcy5fbWF0Y2hDb2luXG4gICAgICAgIGNvaW5MYWJlbC5mb250U2l6ZSA9IDI0XG4gICAgICAgIGNvaW5Ob2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjAwLCAxMDApXG4gICAgICAgIGNvaW5Ob2RlLnkgPSBwb3B1cEhlaWdodC8yIC0gMTgwXG4gICAgICAgIGNvaW5Ob2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHnq57mioDlnLrlgJLorqHml7ZcbiAgICAgICAgLy8g5LiN5pi+56S6XCLnu6fnu63muLjmiI9cIuWSjFwi6L+U5Zue5aSn5Y6FXCLmjInpkq5cbiAgICAgICAgLy8g5pi+56S65pyN5Yqh56uv5o6n5Yi255qEMzDnp5LlgJLorqHml7ZcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeS7jiBnYW1lX292ZXIg5pWw5o2u5Lit6I635Y+W5Yid5aeL5YCS6K6h5pe277yM56uL5Y2z5ZCv5Yqo5pys5Zyw5YCS6K6h5pe2XG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruOAkeS7juacjeWKoeerr+aVsOaNruiOt+WPluWIneWni+WAkuiuoeaXtuWAvFxuICAgICAgICB2YXIgaW5pdGlhbENvdW50ZG93biA9IGRhdGEuYXJlbmFfY291bnRkb3duIHx8IDMwXG4gICAgICAgIFxuICAgICAgICAvLyDlgJLorqHml7bmmL7npLrlrrnlmahcbiAgICAgICAgdmFyIGNvdW50ZG93bkNvbnRhaW5lciA9IG5ldyBjYy5Ob2RlKFwiQ291bnRkb3duQ29udGFpbmVyXCIpXG4gICAgICAgIGNvdW50ZG93bkNvbnRhaW5lci55ID0gLXBvcHVwSGVpZ2h0LzIgKyA4MFxuICAgICAgICBjb3VudGRvd25Db250YWluZXIucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDlgJLorqHml7bmloflrZdcbiAgICAgICAgdmFyIGNvdW50ZG93bkxhYmVsID0gbmV3IGNjLk5vZGUoXCJDb3VudGRvd25MYWJlbFwiKVxuICAgICAgICB2YXIgY291bnRkb3duTGFiZWxDb21wID0gY291bnRkb3duTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBjb3VudGRvd25MYWJlbENvbXAuc3RyaW5nID0gXCLkuIvkuIDova7lsIblnKggXCIgKyBpbml0aWFsQ291bnRkb3duICsgXCIg56eS5ZCO5byA5aeLXCJcbiAgICAgICAgY291bnRkb3duTGFiZWxDb21wLmZvbnRTaXplID0gMjZcbiAgICAgICAgY291bnRkb3duTGFiZWwuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMTUsIDApICAvLyDph5Hpu4ToibJcbiAgICAgICAgY291bnRkb3duTGFiZWwucGFyZW50ID0gY291bnRkb3duQ29udGFpbmVyXG4gICAgICAgIFxuICAgICAgICAvLyDlgJLorqHml7bmlbDlrZfvvIjlpKflj7fmmL7npLrvvIlcbiAgICAgICAgdmFyIGNvdW50ZG93bk51bWJlciA9IG5ldyBjYy5Ob2RlKFwiQ291bnRkb3duTnVtYmVyXCIpXG4gICAgICAgIHZhciBjb3VudGRvd25OdW1iZXJDb21wID0gY291bnRkb3duTnVtYmVyLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgY291bnRkb3duTnVtYmVyQ29tcC5zdHJpbmcgPSBTdHJpbmcoaW5pdGlhbENvdW50ZG93bilcbiAgICAgICAgY291bnRkb3duTnVtYmVyQ29tcC5mb250U2l6ZSA9IDQ4XG4gICAgICAgIGNvdW50ZG93bk51bWJlci5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICBjb3VudGRvd25OdW1iZXIueSA9IC00NVxuICAgICAgICBjb3VudGRvd25OdW1iZXIucGFyZW50ID0gY291bnRkb3duQ29udGFpbmVyXG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDmj4/ovrnmlYjmnpxcbiAgICAgICAgdmFyIG91dGxpbmUgPSBjb3VudGRvd25OdW1iZXIuYWRkQ29tcG9uZW50KGNjLkxhYmVsT3V0bGluZSlcbiAgICAgICAgb3V0bGluZS5jb2xvciA9IGNjLkNvbG9yLkJMQUNLXG4gICAgICAgIG91dGxpbmUud2lkdGggPSAyXG4gICAgICAgIFxuICAgICAgICAvLyDlvLnlh7rliqjnlLtcbiAgICAgICAgY2MudHdlZW4ocG9wdXBOb2RlKVxuICAgICAgICAgICAgLnRvKDAuMzUsIHsgc2NhbGU6IDEsIG9wYWNpdHk6IDI1NSB9LCB7IGVhc2luZzogJ2JhY2tPdXQnIH0pXG4gICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICBcbiAgICAgICAgLy8g5L+d5a2Y5byV55SoXG4gICAgICAgIHRoaXMuX2dhbWVSZXN1bHRQb3B1cCA9IHBvcHVwTm9kZVxuICAgICAgICB0aGlzLl9nYW1lUmVzdWx0TWFzayA9IG1hc2tOb2RlXG4gICAgICAgIHRoaXMuX2NvdW50ZG93bkxhYmVsTm9kZSA9IGNvdW50ZG93bkxhYmVsXG4gICAgICAgIHRoaXMuX2NvdW50ZG93bk51bWJlck5vZGUgPSBjb3VudGRvd25OdW1iZXJcbiAgICAgICAgdGhpcy5fYXJlbmFDb3VudGRvd25TZWNvbmRzID0gaW5pdGlhbENvdW50ZG93blxuICAgICAgICBcbiAgICAgICAgLy8g5pKt5pS+6Z+z5pWIXG4gICAgICAgIHRoaXMuX3BsYXlHYW1lUmVzdWx0U291bmQoaXNXaW5uZXIpXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgLy8g8J+Up+OAkOWFs+mUruS/ruWkjeOAkeWujOWFqOS+nei1luacjeWKoeerr+aOqOmAgeeahOWAkuiuoeaXtua2iOaBr1xuICAgICAgICAvLyDkuI3kvb/nlKjmnKzlnLDlgJLorqHml7blrprml7blmajvvIznoa7kv53miYDmnInlrqLmiLfnq6/ooYzkuLrkuIDoh7RcbiAgICAgICAgLy8g5pyN5Yqh56uv5q+P56eS5bm/5pKtIGFyZW5hX2NvdW50ZG93bl90aWNrIOa2iOaBr1xuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgXG4gICAgICAgIC8vIOazqOWGjOacjeWKoeerr+WAkuiuoeaXtua2iOaBr+ebkeWQrFxuICAgICAgICB0aGlzLl9zZXR1cEFyZW5hQ291bnRkb3duTGlzdGVuZXJzKClcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBb5pi+56S657uT566X5by556qXXSDliJ3lp4vlgJLorqHml7Y6XCIsIGluaXRpYWxDb3VudGRvd24sIFwi56eS77yM562J5b6F5pyN5Yqh56uv5o6o6YCBLi4uXCIpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5pi+56S6562J5b6F5pyN5Yqh56uv5ZON5bqU5o+Q56S6XG4gICAgICovXG4gICAgX3Nob3dXYWl0aW5nRm9yU2VydmVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g5pu05paw5YCS6K6h5pe25qCH562+5pi+56S6562J5b6F5o+Q56S6XG4gICAgICAgIGlmICh0aGlzLl9jb3VudGRvd25MYWJlbE5vZGUpIHtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IHRoaXMuX2NvdW50ZG93bkxhYmVsTm9kZS5nZXRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5zdHJpbmcgPSBcIuetieW+heacjeWKoeWZqOWTjeW6lC4uLlwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmakOiXj+aVsOWtl1xuICAgICAgICBpZiAodGhpcy5fY291bnRkb3duTnVtYmVyTm9kZSkge1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gdGhpcy5fY291bnRkb3duTnVtYmVyTm9kZS5nZXRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5zdHJpbmcgPSBcIi4uLlwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHorr7nva7nq57mioDlnLrlgJLorqHml7bmtojmga/nm5HlkKxcbiAgICAgKiDwn5Sn44CQ5YWz6ZSu44CR5a6M5YWo5L6d6LWW5pyN5Yqh56uv5o6o6YCB77yM5LiN5L2/55So5pys5Zyw5YCS6K6h5pe25a6a5pe25ZmoXG4gICAgICovXG4gICAgX3NldHVwQXJlbmFDb3VudGRvd25MaXN0ZW5lcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIFxuICAgICAgICBpZiAoIW15Z2xvYmFsIHx8ICFteWdsb2JhbC5zb2NrZXQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCfj5/vuI8gW19zZXR1cEFyZW5hQ291bnRkb3duTGlzdGVuZXJzXSBzb2NrZXTmnKrliJ3lp4vljJZcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDnm5HlkKzlgJLorqHml7blvIDlp4vmtojmga/vvIjlpoLmnpzmnI3liqHnq6/ph43mlrDlj5HpgIHvvIlcbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQXJlbmFSb3VuZENvdW50ZG93bihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW29uQXJlbmFSb3VuZENvdW50ZG93bl0g5pS25Yiw5YCS6K6h5pe25byA5aeLOlwiLCBkYXRhKVxuICAgICAgICAgICAgLy8g5ZCM5q2l5pyN5Yqh56uv55qE5YCS6K6h5pe25YC8XG4gICAgICAgICAgICBzZWxmLl9hcmVuYUNvdW50ZG93blNlY29uZHMgPSBkYXRhLnNlY29uZHMgfHwgMzBcbiAgICAgICAgICAgIHNlbGYuX3VwZGF0ZUFyZW5hQ291bnRkb3duVUkoZGF0YS5zZWNvbmRzKVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8g55uR5ZCs5YCS6K6h5pe25q+P56eS5pu05paw5raI5oGv77yI5ZCM5q2l5pyN5Yqh56uv55qE5YCS6K6h5pe277yJXG4gICAgICAgIG15Z2xvYmFsLnNvY2tldC5vbkFyZW5hQ291bnRkb3duVGljayhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW29uQXJlbmFDb3VudGRvd25UaWNrXSDmnI3liqHnq6/lgJLorqHml7blkIzmraU6XCIsIGRhdGEuc2Vjb25kcylcbiAgICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7jgJHlkIzmraXmnI3liqHnq6/nmoTlgJLorqHml7blgLzvvIznoa7kv53kuI7mnI3liqHnq6/kuIDoh7RcbiAgICAgICAgICAgIHNlbGYuX2FyZW5hQ291bnRkb3duU2Vjb25kcyA9IGRhdGEuc2Vjb25kc1xuICAgICAgICAgICAgc2VsZi5fdXBkYXRlQXJlbmFDb3VudGRvd25VSShkYXRhLnNlY29uZHMpXG4gICAgICAgIH0pXG4gICAgICAgIFxuICAgICAgICAvLyDnm5HlkKzoh6rliqjlh4blpIfmtojmga9cbiAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uQXJlbmFBdXRvUmVhZHkoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtvbkFyZW5hQXV0b1JlYWR5XSDoh6rliqjlh4blpIc6XCIsIGRhdGEubWVzc2FnZSlcbiAgICAgICAgICAgIC8vIOWBnOatouacrOWcsOWAkuiuoeaXtlxuICAgICAgICAgICAgaWYgKHNlbGYuX2xvY2FsQXJlbmFDb3VudGRvd25UaW1lcikge1xuICAgICAgICAgICAgICAgIHNlbGYudW5zY2hlZHVsZShzZWxmLl9sb2NhbEFyZW5hQ291bnRkb3duVGljaylcbiAgICAgICAgICAgICAgICBzZWxmLl9sb2NhbEFyZW5hQ291bnRkb3duVGltZXIgPSBudWxsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLl9zaG93QXJlbmFBdXRvUmVhZHlNZXNzYWdlKGRhdGEubWVzc2FnZSlcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIOebkeWQrOaWree6v+mHjei/nueKtuaAgeaBouWkjVxuICAgICAgICBteWdsb2JhbC5zb2NrZXQub25BcmVuYVJlY29ubmVjdFN0YXRlKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbb25BcmVuYVJlY29ubmVjdFN0YXRlXSDnirbmgIHmgaLlpI06XCIsIGRhdGEpXG4gICAgICAgICAgICBpZiAoZGF0YS5waGFzZSA9PT0gXCJjb3VudGRvd25cIikge1xuICAgICAgICAgICAgICAgIHNlbGYuX2FyZW5hQ291bnRkb3duU2Vjb25kcyA9IGRhdGEuY291bnRkb3duXG4gICAgICAgICAgICAgICAgc2VsZi5fdXBkYXRlQXJlbmFDb3VudGRvd25VSShkYXRhLmNvdW50ZG93bilcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHmm7TmlrDnq57mioDlnLrlgJLorqHml7ZVSVxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBzZWNvbmRzIC0g5Ymp5L2Z56eS5pWwXG4gICAgICovXG4gICAgX3VwZGF0ZUFyZW5hQ291bnRkb3duVUk6IGZ1bmN0aW9uKHNlY29uZHMpIHtcbiAgICAgICAgLy8g5pu05paw5paH5a2XXG4gICAgICAgIGlmICh0aGlzLl9jb3VudGRvd25MYWJlbE5vZGUpIHtcbiAgICAgICAgICAgIHZhciBsYWJlbCA9IHRoaXMuX2NvdW50ZG93bkxhYmVsTm9kZS5nZXRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICBsYWJlbC5zdHJpbmcgPSBcIuS4i+S4gOi9ruWwhuWcqCBcIiArIHNlY29uZHMgKyBcIiDnp5LlkI7lvIDlp4tcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDmlbDlrZdcbiAgICAgICAgaWYgKHRoaXMuX2NvdW50ZG93bk51bWJlck5vZGUpIHtcbiAgICAgICAgICAgIHZhciBudW1MYWJlbCA9IHRoaXMuX2NvdW50ZG93bk51bWJlck5vZGUuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgaWYgKG51bUxhYmVsKSB7XG4gICAgICAgICAgICAgICAgbnVtTGFiZWwuc3RyaW5nID0gU3RyaW5nKHNlY29uZHMpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOacgOWQjjXnp5Lpl6rng4HmlYjmnpxcbiAgICAgICAgICAgIGlmIChzZWNvbmRzIDw9IDUgJiYgc2Vjb25kcyA+IDApIHtcbiAgICAgICAgICAgICAgICBjYy50d2Vlbih0aGlzLl9jb3VudGRvd25OdW1iZXJOb2RlKVxuICAgICAgICAgICAgICAgICAgICAudG8oMC4xLCB7IHNjYWxlOiAxLjIgfSlcbiAgICAgICAgICAgICAgICAgICAgLnRvKDAuMSwgeyBzY2FsZTogMS4wIH0pXG4gICAgICAgICAgICAgICAgICAgIC5zdGFydCgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5Y+Y57qiXG4gICAgICAgICAgICAgICAgdGhpcy5fY291bnRkb3duTnVtYmVyTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDEwMCwgMTAwKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jb3VudGRvd25OdW1iZXJOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHlgZzmraLnq57mioDlnLrlgJLorqHml7ZcbiAgICAgKi9cbiAgICBfc3RvcEFyZW5hQ291bnRkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g5YGc5q2i5pys5Zyw5YCS6K6h5pe25a6a5pe25ZmoXG4gICAgICAgIGlmICh0aGlzLl9sb2NhbEFyZW5hQ291bnRkb3duVGltZXIpIHtcbiAgICAgICAgICAgIHRoaXMudW5zY2hlZHVsZSh0aGlzLl9sb2NhbEFyZW5hQ291bnRkb3duVGljaylcbiAgICAgICAgICAgIHRoaXMuX2xvY2FsQXJlbmFDb3VudGRvd25UaW1lciA9IG51bGxcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbX3N0b3BBcmVuYUNvdW50ZG93bl0g5bey5YGc5q2i5pys5Zyw5YCS6K6h5pe2XCIpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmHjee9ruWAkuiuoeaXtuenkuaVsFxuICAgICAgICB0aGlzLl9hcmVuYUNvdW50ZG93blNlY29uZHMgPSAwXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5pi+56S656ue5oqA5Zy66Ieq5Yqo5YeG5aSH5raI5oGvXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2UgLSDmtojmga/lhoXlrrlcbiAgICAgKi9cbiAgICBfc2hvd0FyZW5hQXV0b1JlYWR5TWVzc2FnZTogZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAvLyDmm7TmlrDlgJLorqHml7bmmL7npLrkuLroh6rliqjlh4blpIfmtojmga9cbiAgICAgICAgaWYgKHRoaXMuX2NvdW50ZG93bkxhYmVsTm9kZSkge1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gdGhpcy5fY291bnRkb3duTGFiZWxOb2RlLmdldENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgIGlmIChsYWJlbCkge1xuICAgICAgICAgICAgICAgIGxhYmVsLnN0cmluZyA9IG1lc3NhZ2UgfHwgXCLns7vnu5/lt7Loh6rliqjlh4blpIdcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDpmpDol4/mlbDlrZdcbiAgICAgICAgaWYgKHRoaXMuX2NvdW50ZG93bk51bWJlck5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvdW50ZG93bk51bWJlck5vZGUuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn4+G44CQ56ue5oqA5Zy644CR5aSE55CG56ue5oqA5Zy654q25oCB5pu05pawXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSB7IHJvb21fY2F0ZWdvcnksIHJvdW5kLCB0b3RhbF9yb3VuZHMsIG1hdGNoX2NvaW4sIC4uLiB9XG4gICAgICovXG4gICAgX29uQ29tcGV0aXRpb25TdGF0dXM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2lzQ29tcGV0aXRpb24gPSAoZGF0YS5yb29tX2NhdGVnb3J5ID09PSAyKVxuICAgICAgICB0aGlzLl9yb29tQ2F0ZWdvcnkgPSBkYXRhLnJvb21fY2F0ZWdvcnkgfHwgMVxuICAgICAgICB0aGlzLl9jb21wZXRpdGlvblJvdW5kID0gZGF0YS5yb3VuZCB8fCAwXG4gICAgICAgIHRoaXMuX2NvbXBldGl0aW9uVG90YWxSb3VuZHMgPSBkYXRhLnRvdGFsX3JvdW5kcyB8fCAwXG4gICAgICAgIHRoaXMuX21hdGNoQ29pbiA9IGRhdGEubWF0Y2hfY29pbiB8fCAwXG4gICAgICAgIFxuICAgICAgICAvLyDlpoLmnpzmmK/nq57mioDlnLrmqKHlvI/vvIzmmL7npLrmr5TotZvph5HluIFcbiAgICAgICAgaWYgKHRoaXMuX2lzQ29tcGV0aXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dNYXRjaENvaW5EaXNwbGF5KClcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+VkOOAkOernuaKgOWcuuOAkeWkhOeQhuernuaKgOWcuuWAkuiuoeaXtlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0geyBjb3VudGRvd24sIG1lc3NhZ2UgfVxuICAgICAqL1xuICAgIF9vbkNvbXBldGl0aW9uQ291bnRkb3duOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9jb21wZXRpdGlvbkNvdW50ZG93biA9IGRhdGEuY291bnRkb3duIHx8IDE1XG4gICAgICAgIFxuICAgICAgICAvLyDlgZzmraLkuYvliY3nmoTlgJLorqHml7ZcbiAgICAgICAgaWYgKHRoaXMuX2NvbXBldGl0aW9uQ291bnRkb3duVGltZXIpIHtcbiAgICAgICAgICAgIHRoaXMudW5zY2hlZHVsZSh0aGlzLl9jb21wZXRpdGlvbkNvdW50ZG93blRpY2spXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOW8gOWni+aWsOeahOWAkuiuoeaXtlxuICAgICAgICB0aGlzLnNjaGVkdWxlKHRoaXMuX2NvbXBldGl0aW9uQ291bnRkb3duVGljaywgMSlcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflZDjgJDnq57mioDlnLrjgJHnq57mioDlnLrlgJLorqHml7ZUaWNrXG4gICAgICovXG4gICAgX2NvbXBldGl0aW9uQ291bnRkb3duVGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9jb21wZXRpdGlvbkNvdW50ZG93biA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnVuc2NoZWR1bGUodGhpcy5fY29tcGV0aXRpb25Db3VudGRvd25UaWNrKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2NvbXBldGl0aW9uQ291bnRkb3duLS1cbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOWAkuiuoeaXtuaYvuekulxuICAgICAgICB0aGlzLl91cGRhdGVDb21wZXRpdGlvbkNvdW50ZG93bkRpc3BsYXkoKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+VkOOAkOernuaKgOWcuuOAkeabtOaWsOernuaKgOWcuuWAkuiuoeaXtuaYvuekulxuICAgICAqL1xuICAgIF91cGRhdGVDb21wZXRpdGlvbkNvdW50ZG93bkRpc3BsYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDlpoLmnpzmnInnu5PnrpflvLnnqpfvvIzmm7TmlrDlhbbkuK3nmoTlgJLorqHml7ZcbiAgICAgICAgaWYgKHRoaXMuX2dhbWVSZXN1bHRQb3B1cCkge1xuICAgICAgICAgICAgdmFyIGNvdW50ZG93bkxhYmVsID0gdGhpcy5fZ2FtZVJlc3VsdFBvcHVwLmdldENoaWxkQnlOYW1lKFwiQ29tcGV0aXRpb25Db3VudGRvd25cIilcbiAgICAgICAgICAgIGlmIChjb3VudGRvd25MYWJlbCAmJiBjb3VudGRvd25MYWJlbC5nZXRDb21wb25lbnQoY2MuTGFiZWwpKSB7XG4gICAgICAgICAgICAgICAgY291bnRkb3duTGFiZWwuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKS5zdHJpbmcgPSBcIuS4i+S4gOWxgOW8gOWniyBcIiArIHRoaXMuX2NvbXBldGl0aW9uQ291bnRkb3duICsgXCLnp5JcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn6qZ44CQ56ue5oqA5Zy644CR5aSE55CG5q+U6LWb6YeR5biB5pu05pawXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSB7IHBsYXllcl9pZCwgbWF0Y2hfY29pbiwgZGVsdGEgfVxuICAgICAqL1xuICAgIF9vbk1hdGNoQ29pblVwZGF0ZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCkgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICB2YXIgbXlQbGF5ZXJJZCA9IG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKCkuaWQgfHwgbXlnbG9iYWwucGxheWVyRGF0YS5zZXJ2ZXJQbGF5ZXJJZCB8fCBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRFxuICAgICAgICBcbiAgICAgICAgLy8g5Y+q5pu05paw6Ieq5bex55qE5q+U6LWb6YeR5biBXG4gICAgICAgIGlmIChTdHJpbmcoZGF0YS5wbGF5ZXJfaWQpID09PSBTdHJpbmcobXlQbGF5ZXJJZCkpIHtcbiAgICAgICAgICAgIHRoaXMuX21hdGNoQ29pbiA9IGRhdGEubWF0Y2hfY29pblxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlTWF0Y2hDb2luRGlzcGxheShkYXRhLm1hdGNoX2NvaW4sIGRhdGEuZGVsdGEpXG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCfqpnjgJDnq57mioDlnLrjgJHmmL7npLrmr5TotZvph5HluIHmmL7npLpcbiAgICAgKi9cbiAgICBfc2hvd01hdGNoQ29pbkRpc3BsYXk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDmo4Dmn6XmmK/lkKblt7LlrZjlnKjmr5TotZvph5HluIHmmL7npLroioLngrlcbiAgICAgICAgaWYgKHRoaXMuX21hdGNoQ29pbk5vZGUpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIGlmICghbXlnbG9iYWwpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65q+U6LWb6YeR5biB5pi+56S66IqC54K5XG4gICAgICAgIHZhciBtYXRjaENvaW5Ob2RlID0gbmV3IGNjLk5vZGUoXCJNYXRjaENvaW5EaXNwbGF5XCIpXG4gICAgICAgIG1hdGNoQ29pbk5vZGUuc2V0UG9zaXRpb24oLTIwMCwgMjgwKSAgLy8g5bem5LiK6KeS5L2N572uXG4gICAgICAgIFxuICAgICAgICAvLyDog4zmma9cbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmdcIilcbiAgICAgICAgdmFyIGJnID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgYmcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDUwLCA0MCwgODAsIDIwMClcbiAgICAgICAgYmcucm91bmRSZWN0KC04MCwgLTIwLCAxNjAsIDQwLCAxMClcbiAgICAgICAgYmcuZmlsbCgpXG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSBtYXRjaENvaW5Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDlm77moIfvvIjph5HluIHlm77moIfvvIlcbiAgICAgICAgdmFyIGljb25Ob2RlID0gbmV3IGNjLk5vZGUoXCJJY29uXCIpXG4gICAgICAgIHZhciBpY29uTGFiZWwgPSBpY29uTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGljb25MYWJlbC5zdHJpbmcgPSBcIvCfqplcIlxuICAgICAgICBpY29uTGFiZWwuZm9udFNpemUgPSAyMFxuICAgICAgICBpY29uTm9kZS5zZXRQb3NpdGlvbigtNTUsIDApXG4gICAgICAgIGljb25Ob2RlLnBhcmVudCA9IG1hdGNoQ29pbk5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOagh+etvlxuICAgICAgICB2YXIgbGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJMYWJlbFwiKVxuICAgICAgICB2YXIgbGFiZWwgPSBsYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBsYWJlbC5zdHJpbmcgPSBcIuavlOi1m+mHkeW4gVwiXG4gICAgICAgIGxhYmVsLmZvbnRTaXplID0gMTRcbiAgICAgICAgbGFiZWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDIwMCwgMjAwLCAyMDApXG4gICAgICAgIGxhYmVsTm9kZS5zZXRQb3NpdGlvbigtMjAsIDApXG4gICAgICAgIGxhYmVsTm9kZS5wYXJlbnQgPSBtYXRjaENvaW5Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmlbDlgLxcbiAgICAgICAgdmFyIHZhbHVlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVmFsdWVcIilcbiAgICAgICAgdmFsdWVOb2RlLm5hbWUgPSBcIk1hdGNoQ29pblZhbHVlXCJcbiAgICAgICAgdmFyIHZhbHVlTGFiZWwgPSB2YWx1ZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB2YWx1ZUxhYmVsLnN0cmluZyA9IFN0cmluZyh0aGlzLl9tYXRjaENvaW4pXG4gICAgICAgIHZhbHVlTGFiZWwuZm9udFNpemUgPSAxOFxuICAgICAgICB2YWx1ZU5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMjAsIDEwMClcbiAgICAgICAgdmFsdWVOb2RlLnNldFBvc2l0aW9uKDQ1LCAwKVxuICAgICAgICB2YWx1ZU5vZGUucGFyZW50ID0gbWF0Y2hDb2luTm9kZVxuICAgICAgICBcbiAgICAgICAgbWF0Y2hDb2luTm9kZS5wYXJlbnQgPSB0aGlzLm5vZGVcbiAgICAgICAgdGhpcy5fbWF0Y2hDb2luTm9kZSA9IG1hdGNoQ29pbk5vZGVcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCfqpnjgJDnq57mioDlnLrjgJHmm7TmlrDmr5TotZvph5HluIHmmL7npLpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbWF0Y2hDb2luIC0g5paw55qE5q+U6LWb6YeR5biB5pWw6YePXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGRlbHRhIC0g5Y+Y5YyW6YePXG4gICAgICovXG4gICAgX3VwZGF0ZU1hdGNoQ29pbkRpc3BsYXk6IGZ1bmN0aW9uKG1hdGNoQ29pbiwgZGVsdGEpIHtcbiAgICAgICAgaWYgKHRoaXMuX21hdGNoQ29pbk5vZGUpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZU5vZGUgPSB0aGlzLl9tYXRjaENvaW5Ob2RlLmdldENoaWxkQnlOYW1lKFwiTWF0Y2hDb2luVmFsdWVcIilcbiAgICAgICAgICAgIGlmICh2YWx1ZU5vZGUgJiYgdmFsdWVOb2RlLmdldENvbXBvbmVudChjYy5MYWJlbCkpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZU5vZGUuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKS5zdHJpbmcgPSBTdHJpbmcobWF0Y2hDb2luKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOacieWinumHj++8jOaYvuekuuWKqOeUu1xuICAgICAgICAgICAgICAgIGlmIChkZWx0YSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zaG93TWF0Y2hDb2luRGVsdGFBbmltYXRpb24oZGVsdGEpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn6qZ44CQ56ue5oqA5Zy644CR5pi+56S65q+U6LWb6YeR5biB5Y+Y5YyW5Yqo55S7XG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGRlbHRhIC0g5Y+Y5YyW6YePXG4gICAgICovXG4gICAgX3Nob3dNYXRjaENvaW5EZWx0YUFuaW1hdGlvbjogZnVuY3Rpb24oZGVsdGEpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9tYXRjaENvaW5Ob2RlKSByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIC8vIOWIm+W7uuWPmOWMlumHj+aYvuekuuiKgueCuVxuICAgICAgICB2YXIgZGVsdGFOb2RlID0gbmV3IGNjLk5vZGUoXCJEZWx0YVwiKVxuICAgICAgICB2YXIgZGVsdGFMYWJlbCA9IGRlbHRhTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGRlbHRhTGFiZWwuc3RyaW5nID0gKGRlbHRhID49IDAgPyBcIitcIiA6IFwiXCIpICsgZGVsdGFcbiAgICAgICAgZGVsdGFMYWJlbC5mb250U2l6ZSA9IDI0XG4gICAgICAgIGRlbHRhTm9kZS5jb2xvciA9IGRlbHRhID49IDAgPyBuZXcgY2MuQ29sb3IoMTAwLCAyNTUsIDEwMCkgOiBuZXcgY2MuQ29sb3IoMjU1LCAxMDAsIDEwMClcbiAgICAgICAgZGVsdGFOb2RlLnNldFBvc2l0aW9uKDgwLCAwKVxuICAgICAgICBkZWx0YU5vZGUucGFyZW50ID0gdGhpcy5fbWF0Y2hDb2luTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g6aOY5a2X5Yqo55S7XG4gICAgICAgIGNjLnR3ZWVuKGRlbHRhTm9kZSlcbiAgICAgICAgICAgIC50bygwLjUsIHsgeTogMzAsIG9wYWNpdHk6IDI1NSB9KVxuICAgICAgICAgICAgLnRvKDAuNSwgeyB5OiA1MCwgb3BhY2l0eTogMCB9KVxuICAgICAgICAgICAgLmNhbGwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZGVsdGFOb2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGFydCgpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn6qZ44CQ56ue5oqA5Zy644CR6ZqQ6JeP5q+U6LWb6YeR5biB5pi+56S6XG4gICAgICovXG4gICAgX2hpZGVNYXRjaENvaW5EaXNwbGF5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX21hdGNoQ29pbk5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX21hdGNoQ29pbk5vZGUuZGVzdHJveSgpXG4gICAgICAgICAgICB0aGlzLl9tYXRjaENvaW5Ob2RlID0gbnVsbFxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDinYzjgJDnq57mioDlnLrjgJHlpITnkIbmt5jmsbDpgJrnn6VcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIHsgcmFuaywgcmVhc29uLCB0b3RhbF9wbGF5ZXJzLCByZXdhcmRzIH1cbiAgICAgKi9cbiAgICBfb25Db21wZXRpdGlvbkVsaW1pbmF0ZWQ6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIOWBnOatouaJgOacieWAkuiuoeaXtlxuICAgICAgICB0aGlzLl9zdG9wUGxheUNvdW50ZG93bigpXG4gICAgICAgIHRoaXMuX3N0b3BCaWRDb3VudGRvd24oKVxuICAgICAgICBcbiAgICAgICAgLy8g6ZqQ6JeP5q+U6LWb6YeR5biB5pi+56S6XG4gICAgICAgIHRoaXMuX2hpZGVNYXRjaENvaW5EaXNwbGF5KClcbiAgICAgICAgXG4gICAgICAgIC8vIOaYvuekuua3mOaxsOW8ueeql1xuICAgICAgICB0aGlzLl9zaG93RWxpbWluYXRlZFBvcHVwKGRhdGEpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDinYzjgJDnq57mioDlnLrjgJHmmL7npLrmt5jmsbDlvLnnqpdcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIHsgcmFuaywgcmVhc29uLCB0b3RhbF9wbGF5ZXJzLCByZXdhcmRzIH1cbiAgICAgKi9cbiAgICBfc2hvd0VsaW1pbmF0ZWRQb3B1cDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgdmFyIHdpblNpemUgPSBjYy53aW5TaXplXG4gICAgICAgIFxuICAgICAgICB2YXIgY2FudmFzID0gY2MuZmluZChcIkNhbnZhc1wiKSB8fCBjYy5maW5kKFwiVUlfUk9PVFwiKSB8fCB0aGlzLm5vZGUucGFyZW50XG4gICAgICAgIGlmICghY2FudmFzKSBjYW52YXMgPSB0aGlzLm5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOmBrue9qeWxglxuICAgICAgICB2YXIgbWFza05vZGUgPSBuZXcgY2MuTm9kZShcIkVsaW1pbmF0ZWRNYXNrXCIpXG4gICAgICAgIG1hc2tOb2RlLmFkZENvbXBvbmVudChjYy5CbG9ja0lucHV0RXZlbnRzKVxuICAgICAgICBtYXNrTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigwLCAwLCAwKVxuICAgICAgICBtYXNrTm9kZS5vcGFjaXR5ID0gMTgwXG4gICAgICAgIG1hc2tOb2RlLndpZHRoID0gd2luU2l6ZS53aWR0aCAqIDJcbiAgICAgICAgbWFza05vZGUuaGVpZ2h0ID0gd2luU2l6ZS5oZWlnaHQgKiAyXG4gICAgICAgIG1hc2tOb2RlLnpJbmRleCA9IDk5OVxuICAgICAgICBtYXNrTm9kZS5wYXJlbnQgPSBjYW52YXNcbiAgICAgICAgXG4gICAgICAgIC8vIOW8ueeql+WuueWZqFxuICAgICAgICB2YXIgcG9wdXBOb2RlID0gbmV3IGNjLk5vZGUoXCJFbGltaW5hdGVkUG9wdXBcIilcbiAgICAgICAgcG9wdXBOb2RlLnNjYWxlID0gMC41XG4gICAgICAgIHBvcHVwTm9kZS5vcGFjaXR5ID0gMFxuICAgICAgICBwb3B1cE5vZGUuekluZGV4ID0gMTAwMFxuICAgICAgICBwb3B1cE5vZGUucGFyZW50ID0gY2FudmFzXG4gICAgICAgIFxuICAgICAgICB2YXIgcG9wdXBXaWR0aCA9IDQwMFxuICAgICAgICB2YXIgcG9wdXBIZWlnaHQgPSAzNTBcbiAgICAgICAgXG4gICAgICAgIC8vIOiDjOaZr1xuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCZ1wiKVxuICAgICAgICB2YXIgYmcgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBiZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoNjAsIDQwLCA1MCwgMjQwKVxuICAgICAgICBiZy5yb3VuZFJlY3QoLXBvcHVwV2lkdGgvMiwgLXBvcHVwSGVpZ2h0LzIsIHBvcHVwV2lkdGgsIHBvcHVwSGVpZ2h0LCAyMClcbiAgICAgICAgYmcuZmlsbCgpXG4gICAgICAgIGJnLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDE1MCwgMTAwLCAxMDApXG4gICAgICAgIGJnLmxpbmVXaWR0aCA9IDNcbiAgICAgICAgYmcucm91bmRSZWN0KC1wb3B1cFdpZHRoLzIsIC1wb3B1cEhlaWdodC8yLCBwb3B1cFdpZHRoLCBwb3B1cEhlaWdodCwgMjApXG4gICAgICAgIGJnLnN0cm9rZSgpXG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOagh+mimFxuICAgICAgICB2YXIgdGl0bGVOb2RlID0gbmV3IGNjLk5vZGUoXCJUaXRsZVwiKVxuICAgICAgICB2YXIgdGl0bGVMYWJlbCA9IHRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHRpdGxlTGFiZWwuc3RyaW5nID0gXCLinYwg5q+U6LWb57uT5p2fIOKdjFwiXG4gICAgICAgIHRpdGxlTGFiZWwuZm9udFNpemUgPSAzMlxuICAgICAgICB0aXRsZU5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAxNTAsIDE1MClcbiAgICAgICAgdGl0bGVOb2RlLnkgPSBwb3B1cEhlaWdodC8yIC0gNTBcbiAgICAgICAgdGl0bGVOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5o6S5ZCNXG4gICAgICAgIHZhciByYW5rTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUmFua1wiKVxuICAgICAgICB2YXIgcmFua0xhYmVsID0gcmFua05vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICByYW5rTGFiZWwuc3RyaW5nID0gXCLmnIDnu4jmjpLlkI06IOesrCBcIiArIGRhdGEucmFuayArIFwiIOWQjVwiXG4gICAgICAgIHJhbmtMYWJlbC5mb250U2l6ZSA9IDI0XG4gICAgICAgIHJhbmtOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjIwLCAxNTApXG4gICAgICAgIHJhbmtOb2RlLnkgPSBwb3B1cEhlaWdodC8yIC0gMTAwXG4gICAgICAgIHJhbmtOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5reY5rGw5Y6f5ZugXG4gICAgICAgIHZhciByZWFzb25Ob2RlID0gbmV3IGNjLk5vZGUoXCJSZWFzb25cIilcbiAgICAgICAgdmFyIHJlYXNvbkxhYmVsID0gcmVhc29uTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHJlYXNvbkxhYmVsLnN0cmluZyA9IGRhdGEucmVhc29uIHx8IFwi5q+U6LWb5aSx5YipXCJcbiAgICAgICAgcmVhc29uTGFiZWwuZm9udFNpemUgPSAxOFxuICAgICAgICByZWFzb25Ob2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDIwMCwgMjAwLCAyMDApXG4gICAgICAgIHJlYXNvbk5vZGUueSA9IHBvcHVwSGVpZ2h0LzIgLSAxNDBcbiAgICAgICAgcmVhc29uTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOWPgui1m+S6uuaVsFxuICAgICAgICB2YXIgdG90YWxOb2RlID0gbmV3IGNjLk5vZGUoXCJUb3RhbFwiKVxuICAgICAgICB2YXIgdG90YWxMYWJlbCA9IHRvdGFsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHRvdGFsTGFiZWwuc3RyaW5nID0gXCLlhbEgXCIgKyAoZGF0YS50b3RhbF9wbGF5ZXJzIHx8IDApICsgXCIg5Lq65Y+C6LWbXCJcbiAgICAgICAgdG90YWxMYWJlbC5mb250U2l6ZSA9IDE2XG4gICAgICAgIHRvdGFsTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigxODAsIDE4MCwgMTgwKVxuICAgICAgICB0b3RhbE5vZGUueSA9IHBvcHVwSGVpZ2h0LzIgLSAxODBcbiAgICAgICAgdG90YWxOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5aWW5Yqx77yI5aaC5p6c5pyJ77yJXG4gICAgICAgIGlmIChkYXRhLnJld2FyZHMpIHtcbiAgICAgICAgICAgIHZhciByZXdhcmROb2RlID0gbmV3IGNjLk5vZGUoXCJSZXdhcmRcIilcbiAgICAgICAgICAgIHZhciByZXdhcmRMYWJlbCA9IHJld2FyZE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICAgICAgcmV3YXJkTGFiZWwuc3RyaW5nID0gXCLojrflvpflpZblirE6IFwiICsgKGRhdGEucmV3YXJkcy5uYW1lIHx8IEpTT04uc3RyaW5naWZ5KGRhdGEucmV3YXJkcykpXG4gICAgICAgICAgICByZXdhcmRMYWJlbC5mb250U2l6ZSA9IDE4XG4gICAgICAgICAgICByZXdhcmROb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjAwLCAxMDApXG4gICAgICAgICAgICByZXdhcmROb2RlLnkgPSBwb3B1cEhlaWdodC8yIC0gMjIwXG4gICAgICAgICAgICByZXdhcmROb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDov5Tlm57lpKfljoXmjInpkq5cbiAgICAgICAgdmFyIGJ0bk5vZGUgPSBuZXcgY2MuTm9kZShcIlJldHVybkJ0blwiKVxuICAgICAgICBidG5Ob2RlLnNldENvbnRlbnRTaXplKDIwMCwgNTApXG4gICAgICAgIGJ0bk5vZGUuYWRkQ29tcG9uZW50KGNjLkJsb2NrSW5wdXRFdmVudHMpXG4gICAgICAgIHZhciBidG5CZyA9IGJ0bk5vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBidG5CZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMTAwLCA4MCwgMTQwKVxuICAgICAgICBidG5CZy5yb3VuZFJlY3QoLTEwMCwgLTI1LCAyMDAsIDUwLCAyNSlcbiAgICAgICAgYnRuQmcuZmlsbCgpXG4gICAgICAgIGJ0bk5vZGUueSA9IC1wb3B1cEhlaWdodC8yICsgNTBcbiAgICAgICAgYnRuTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIHZhciBidG5MYWJlbE5vZGUgPSBuZXcgY2MuTm9kZShcIkxhYmVsXCIpXG4gICAgICAgIHZhciBidG5MYWJlbCA9IGJ0bkxhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGJ0bkxhYmVsLnN0cmluZyA9IFwi6L+U5Zue5aSn5Y6FXCJcbiAgICAgICAgYnRuTGFiZWwuZm9udFNpemUgPSAyMlxuICAgICAgICBidG5MYWJlbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSlcbiAgICAgICAgYnRuTGFiZWxOb2RlLnBhcmVudCA9IGJ0bk5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOeCueWHu+S6i+S7tlxuICAgICAgICBidG5Ob2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyDplIDmr4HlvLnnqpdcbiAgICAgICAgICAgIHBvcHVwTm9kZS5kZXN0cm95KClcbiAgICAgICAgICAgIG1hc2tOb2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgLy8g6L+U5Zue5aSn5Y6FXG4gICAgICAgICAgICBzZWxmLl9yZXR1cm5Ub0xvYmJ5KClcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIOW8ueWHuuWKqOeUu1xuICAgICAgICBjYy50d2Vlbihwb3B1cE5vZGUpXG4gICAgICAgICAgICAudG8oMC4zLCB7IHNjYWxlOiAxLCBvcGFjaXR5OiAyNTUgfSwgeyBlYXNpbmc6ICdiYWNrT3V0JyB9KVxuICAgICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2VsaW1pbmF0ZWRQb3B1cCA9IHBvcHVwTm9kZVxuICAgICAgICB0aGlzLl9lbGltaW5hdGVkTWFzayA9IG1hc2tOb2RlXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDirIbvuI/jgJDnq57mioDlnLrjgJHlpITnkIbmmYvnuqfpgJrnn6VcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIHsgY3VycmVudF9yb3VuZCwgdG90YWxfcm91bmRzLCBtYXRjaF9jb2luLCBtZXNzYWdlIH1cbiAgICAgKi9cbiAgICBfb25Db21wZXRpdGlvbkFkdmFuY2U6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2NvbXBldGl0aW9uUm91bmQgPSBkYXRhLmN1cnJlbnRfcm91bmRcbiAgICAgICAgdGhpcy5fbWF0Y2hDb2luID0gZGF0YS5tYXRjaF9jb2luXG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDmr5TotZvph5HluIHmmL7npLpcbiAgICAgICAgdGhpcy5fdXBkYXRlTWF0Y2hDb2luRGlzcGxheShkYXRhLm1hdGNoX2NvaW4sIDApXG4gICAgICAgIFxuICAgICAgICAvLyDmmL7npLrmmYvnuqfmj5DnpLpcbiAgICAgICAgdGhpcy5fc2hvd0FkdmFuY2VUb2FzdChkYXRhKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog4qyG77iP44CQ56ue5oqA5Zy644CR5pi+56S65pmL57qn5o+Q56S6XG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSB7IGN1cnJlbnRfcm91bmQsIHRvdGFsX3JvdW5kcywgbWF0Y2hfY29pbiwgbWVzc2FnZSB9XG4gICAgICovXG4gICAgX3Nob3dBZHZhbmNlVG9hc3Q6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHZhciB3aW5TaXplID0gY2Mud2luU2l6ZVxuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu6VG9hc3ToioLngrlcbiAgICAgICAgdmFyIHRvYXN0Tm9kZSA9IG5ldyBjYy5Ob2RlKFwiQWR2YW5jZVRvYXN0XCIpXG4gICAgICAgIHRvYXN0Tm9kZS5zZXRQb3NpdGlvbigwLCAxMDApXG4gICAgICAgIHRvYXN0Tm9kZS5vcGFjaXR5ID0gMFxuICAgICAgICB0b2FzdE5vZGUuekluZGV4ID0gMjAwMFxuICAgICAgICB0b2FzdE5vZGUucGFyZW50ID0gdGhpcy5ub2RlXG4gICAgICAgIFxuICAgICAgICAvLyDog4zmma9cbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmdcIilcbiAgICAgICAgdmFyIGJnID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgYmcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDUwLCAxMDAsIDUwLCAyMjApXG4gICAgICAgIGJnLnJvdW5kUmVjdCgtMTUwLCAtMjUsIDMwMCwgNTAsIDI1KVxuICAgICAgICBiZy5maWxsKClcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IHRvYXN0Tm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5paH5a2XXG4gICAgICAgIHZhciBsYWJlbE5vZGUgPSBuZXcgY2MuTm9kZShcIkxhYmVsXCIpXG4gICAgICAgIHZhciBsYWJlbCA9IGxhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGxhYmVsLnN0cmluZyA9IFwi8J+OiSDmmYvnuqfmiJDlip/vvIHnrKwgXCIgKyBkYXRhLmN1cnJlbnRfcm91bmQgKyBcIi9cIiArIGRhdGEudG90YWxfcm91bmRzICsgXCIg6L2uXCJcbiAgICAgICAgbGFiZWwuZm9udFNpemUgPSAyMlxuICAgICAgICBsYWJlbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDIwMClcbiAgICAgICAgbGFiZWxOb2RlLnBhcmVudCA9IHRvYXN0Tm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5Yqo55S7XG4gICAgICAgIGNjLnR3ZWVuKHRvYXN0Tm9kZSlcbiAgICAgICAgICAgIC50bygwLjMsIHsgb3BhY2l0eTogMjU1IH0pXG4gICAgICAgICAgICAuZGVsYXkoMilcbiAgICAgICAgICAgIC50bygwLjMsIHsgb3BhY2l0eTogMCB9KVxuICAgICAgICAgICAgLmNhbGwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdG9hc3ROb2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGFydCgpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn4+G44CQ56ue5oqA5Zy644CR5aSE55CG5Yag5Yab5by556qXXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSB7IHJhbmssIHJld2FyZHMsIHJld2FyZF90eXBlLCByYW5raW5ncywgbWF0Y2hfY29pbiB9XG4gICAgICovXG4gICAgX29uQ29tcGV0aXRpb25DaGFtcGlvbjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBcbiAgICAgICAgLy8g5YGc5q2i5omA5pyJ5YCS6K6h5pe2XG4gICAgICAgIHRoaXMuX3N0b3BQbGF5Q291bnRkb3duKClcbiAgICAgICAgdGhpcy5fc3RvcEJpZENvdW50ZG93bigpXG4gICAgICAgIFxuICAgICAgICAvLyDpmpDol4/mr5TotZvph5HluIHmmL7npLpcbiAgICAgICAgdGhpcy5faGlkZU1hdGNoQ29pbkRpc3BsYXkoKVxuICAgICAgICBcbiAgICAgICAgLy8g5pi+56S65Yag5Yab5by556qXXG4gICAgICAgIHRoaXMuX3Nob3dDaGFtcGlvblBvcHVwKGRhdGEpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn4+G44CQ56ue5oqA5Zy644CR5pi+56S65Yag5Yab5by556qXXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSB7IHJhbmssIHJld2FyZHMsIHJld2FyZF90eXBlLCByYW5raW5ncywgbWF0Y2hfY29pbiB9XG4gICAgICog8J+Up+OAkOmHjeaehOOAkeaYvuekuuWujOaVtOeahOaOkuWQjeWIl+ihqO+8iOWJjTIw5ZCN77yJ77yM5YyF5ous5Yag5Yab44CB5Lqa5Yab44CB5a2j5YabXG4gICAgICovXG4gICAgX3Nob3dDaGFtcGlvblBvcHVwOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICB2YXIgd2luU2l6ZSA9IGNjLndpblNpemVcbiAgICAgICAgXG4gICAgICAgIHZhciBjYW52YXMgPSBjYy5maW5kKFwiQ2FudmFzXCIpIHx8IGNjLmZpbmQoXCJVSV9ST09UXCIpIHx8IHRoaXMubm9kZS5wYXJlbnRcbiAgICAgICAgaWYgKCFjYW52YXMpIGNhbnZhcyA9IHRoaXMubm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOWFs+mXreS5i+WJjeeahOe7k+eul+W8ueeql+OAkVxuICAgICAgICBpZiAodGhpcy5fZ2FtZVJlc3VsdFBvcHVwIHx8IHRoaXMuX2dhbWVSZXN1bHRNYXNrKSB7XG4gICAgICAgICAgICB0aGlzLl9jbG9zZUdhbWVSZXN1bHRQb3B1cCh0aGlzLl9nYW1lUmVzdWx0UG9wdXAsIHRoaXMuX2dhbWVSZXN1bHRNYXNrKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDpga7nvanlsYJcbiAgICAgICAgdmFyIG1hc2tOb2RlID0gbmV3IGNjLk5vZGUoXCJDaGFtcGlvbk1hc2tcIilcbiAgICAgICAgbWFza05vZGUuYWRkQ29tcG9uZW50KGNjLkJsb2NrSW5wdXRFdmVudHMpXG4gICAgICAgIG1hc2tOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDIwLCAxNSwgNDApXG4gICAgICAgIG1hc2tOb2RlLm9wYWNpdHkgPSAyMjBcbiAgICAgICAgbWFza05vZGUud2lkdGggPSB3aW5TaXplLndpZHRoICogMlxuICAgICAgICBtYXNrTm9kZS5oZWlnaHQgPSB3aW5TaXplLmhlaWdodCAqIDJcbiAgICAgICAgbWFza05vZGUuekluZGV4ID0gOTk5XG4gICAgICAgIG1hc2tOb2RlLnBhcmVudCA9IGNhbnZhc1xuICAgICAgICBcbiAgICAgICAgLy8g5by556qX5a655ZmoXG4gICAgICAgIHZhciBwb3B1cE5vZGUgPSBuZXcgY2MuTm9kZShcIkNoYW1waW9uUG9wdXBcIilcbiAgICAgICAgcG9wdXBOb2RlLnNjYWxlID0gMC41XG4gICAgICAgIHBvcHVwTm9kZS5vcGFjaXR5ID0gMFxuICAgICAgICBwb3B1cE5vZGUuekluZGV4ID0gMTAwMFxuICAgICAgICBwb3B1cE5vZGUucGFyZW50ID0gY2FudmFzXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ6LCD5pW044CR5aKe5aSn5by556qX5bC65a+45Lul5a6557qz5pu05aSa5o6S5ZCNXG4gICAgICAgIHZhciBwb3B1cFdpZHRoID0gNTIwXG4gICAgICAgIHZhciBwb3B1cEhlaWdodCA9IDYyMFxuICAgICAgICBcbiAgICAgICAgLy8g6IOM5pmvXG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkJnXCIpXG4gICAgICAgIHZhciBiZyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGJnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig0NSwgMzUsIDcwLCAyNDUpXG4gICAgICAgIGJnLnJvdW5kUmVjdCgtcG9wdXBXaWR0aC8yLCAtcG9wdXBIZWlnaHQvMiwgcG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQsIDIwKVxuICAgICAgICBiZy5maWxsKClcbiAgICAgICAgYmcuc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDgwKVxuICAgICAgICBiZy5saW5lV2lkdGggPSAzXG4gICAgICAgIGJnLnJvdW5kUmVjdCgtcG9wdXBXaWR0aC8yLCAtcG9wdXBIZWlnaHQvMiwgcG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQsIDIwKVxuICAgICAgICBiZy5zdHJva2UoKVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmoIfpophcbiAgICAgICAgdmFyIHRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIilcbiAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB0aXRsZUxhYmVsLnN0cmluZyA9IFwi8J+PhiDmr5TotZvnu5PmnZ8g8J+PhlwiXG4gICAgICAgIHRpdGxlTGFiZWwuZm9udFNpemUgPSAzMlxuICAgICAgICB0aXRsZUxhYmVsLmVuYWJsZUJvbGQgPSB0cnVlXG4gICAgICAgIHRpdGxlTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIyMCwgMTAwKVxuICAgICAgICB0aXRsZU5vZGUueSA9IHBvcHVwSGVpZ2h0LzIgLSA0MFxuICAgICAgICB0aXRsZU5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5YmN5LiJ5ZCN5bGV56S65Yy6XG4gICAgICAgIHZhciByYW5raW5ncyA9IGRhdGEucmFua2luZ3MgfHwgW11cbiAgICAgICAgdmFyIHRvcFRocmVlWSA9IHBvcHVwSGVpZ2h0LzIgLSA5MFxuICAgICAgICBcbiAgICAgICAgaWYgKHJhbmtpbmdzLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICAvLyDlhqDlhptcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVJhbmtpbmdJdGVtKHBvcHVwTm9kZSwgcmFua2luZ3NbMF0sIDEsIC0xMjAsIHRvcFRocmVlWSlcbiAgICAgICAgfVxuICAgICAgICBpZiAocmFua2luZ3MubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgIC8vIOS6muWGm1xuICAgICAgICAgICAgdGhpcy5fY3JlYXRlUmFua2luZ0l0ZW0ocG9wdXBOb2RlLCByYW5raW5nc1sxXSwgMiwgMCwgdG9wVGhyZWVZIC0gMjApXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJhbmtpbmdzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgICAvLyDlraPlhptcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVJhbmtpbmdJdGVtKHBvcHVwTm9kZSwgcmFua2luZ3NbMl0sIDMsIDEyMCwgdG9wVGhyZWVZIC0gNDApXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHlhbbku5bmjpLlkI3liJfooajmoIfpophcbiAgICAgICAgaWYgKHJhbmtpbmdzLmxlbmd0aCA+IDMpIHtcbiAgICAgICAgICAgIHZhciBvdGhlclRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiT3RoZXJUaXRsZVwiKVxuICAgICAgICAgICAgdmFyIG90aGVyVGl0bGVMYWJlbCA9IG90aGVyVGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgIG90aGVyVGl0bGVMYWJlbC5zdHJpbmcgPSBcIuKAlOKAlCDlhbbku5bmjpLlkI0g4oCU4oCUXCJcbiAgICAgICAgICAgIG90aGVyVGl0bGVMYWJlbC5mb250U2l6ZSA9IDE4XG4gICAgICAgICAgICBvdGhlclRpdGxlTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigxODAsIDE4MCwgMjAwKVxuICAgICAgICAgICAgb3RoZXJUaXRsZU5vZGUueSA9IHRvcFRocmVlWSAtIDEwMFxuICAgICAgICAgICAgb3RoZXJUaXRsZU5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHlhbbku5bmjpLlkI3liJfooajvvIjnrKw0LTIw5ZCN77yJXG4gICAgICAgICAgICB2YXIgc3RhcnRZID0gdG9wVGhyZWVZIC0gMTMwXG4gICAgICAgICAgICB2YXIgbWF4T3RoZXJSYW5raW5ncyA9IE1hdGgubWluKHJhbmtpbmdzLmxlbmd0aCwgMjApXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMzsgaSA8IG1heE90aGVyUmFua2luZ3M7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciByYW5rSW5mbyA9IHJhbmtpbmdzW2ldXG4gICAgICAgICAgICAgICAgdmFyIHJhbmtJdGVtTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUmFua0l0ZW1fXCIgKyBpKVxuICAgICAgICAgICAgICAgIHZhciByYW5rSXRlbUxhYmVsID0gcmFua0l0ZW1Ob2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgICAgICByYW5rSXRlbUxhYmVsLnN0cmluZyA9IFwi56ysXCIgKyByYW5rSW5mby5yYW5rICsgXCLlkI06IFwiICsgcmFua0luZm8ucGxheWVyX25hbWUgKyBcIiAg6YeR5biBOiBcIiArIHJhbmtJbmZvLm1hdGNoX2NvaW5cbiAgICAgICAgICAgICAgICByYW5rSXRlbUxhYmVsLmZvbnRTaXplID0gMTZcbiAgICAgICAgICAgICAgICByYW5rSXRlbU5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjAwLCAyMDAsIDIxMClcbiAgICAgICAgICAgICAgICByYW5rSXRlbU5vZGUueSA9IHN0YXJ0WSAtIChpIC0gMykgKiAyNFxuICAgICAgICAgICAgICAgIHJhbmtJdGVtTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5oyJ6ZKu5Yy65Z+fXG4gICAgICAgIHZhciBidG5ZID0gLXBvcHVwSGVpZ2h0LzIgKyA1MFxuICAgICAgICBcbiAgICAgICAgLy8g56Gu5a6a5oyJ6ZKuXG4gICAgICAgIHZhciBjb25maXJtQnRuID0gbmV3IGNjLk5vZGUoXCJDb25maXJtQnRuXCIpXG4gICAgICAgIGNvbmZpcm1CdG4uc2V0Q29udGVudFNpemUoMTgwLCA0NSlcbiAgICAgICAgY29uZmlybUJ0bi5hZGRDb21wb25lbnQoY2MuQmxvY2tJbnB1dEV2ZW50cylcbiAgICAgICAgdmFyIGNvbmZpcm1CZyA9IGNvbmZpcm1CdG4uYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBjb25maXJtQmcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDIwMCwgMTUwLCA1MClcbiAgICAgICAgY29uZmlybUJnLnJvdW5kUmVjdCgtOTAsIC0yMi41LCAxODAsIDQ1LCAyMilcbiAgICAgICAgY29uZmlybUJnLmZpbGwoKVxuICAgICAgICBjb25maXJtQnRuLnkgPSBidG5ZXG4gICAgICAgIGNvbmZpcm1CdG4ucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICB2YXIgY29uZmlybUxhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTGFiZWxcIilcbiAgICAgICAgdmFyIGNvbmZpcm1MYWJlbCA9IGNvbmZpcm1MYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBjb25maXJtTGFiZWwuc3RyaW5nID0gXCLov5Tlm57lpKfljoVcIlxuICAgICAgICBjb25maXJtTGFiZWwuZm9udFNpemUgPSAyMFxuICAgICAgICBjb25maXJtTGFiZWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIGNvbmZpcm1MYWJlbE5vZGUucGFyZW50ID0gY29uZmlybUJ0blxuICAgICAgICBcbiAgICAgICAgY29uZmlybUJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcG9wdXBOb2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgbWFza05vZGUuZGVzdHJveSgpXG4gICAgICAgICAgICBzZWxmLl9yZXR1cm5Ub0xvYmJ5KClcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIOW8ueWHuuWKqOeUu1xuICAgICAgICBjYy50d2Vlbihwb3B1cE5vZGUpXG4gICAgICAgICAgICAudG8oMC40LCB7IHNjYWxlOiAxLCBvcGFjaXR5OiAyNTUgfSwgeyBlYXNpbmc6ICdiYWNrT3V0JyB9KVxuICAgICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgXG4gICAgICAgIC8vIOeykuWtkOeJueaViFxuICAgICAgICB0aGlzLl9jcmVhdGVDaGFtcGlvblBhcnRpY2xlcyhwb3B1cE5vZGUsIHBvcHVwV2lkdGgsIHBvcHVwSGVpZ2h0KVxuICAgICAgICBcbiAgICAgICAgdGhpcy5fY2hhbXBpb25Qb3B1cCA9IHBvcHVwTm9kZVxuICAgICAgICB0aGlzLl9jaGFtcGlvbk1hc2sgPSBtYXNrTm9kZVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+PheOAkOaWsOWinuOAkeWIm+W7uuWNleS4quaOkuWQjemhuVxuICAgICAqIEBwYXJhbSB7Y2MuTm9kZX0gcGFyZW50IC0g54i26IqC54K5XG4gICAgICogQHBhcmFtIHtPYmplY3R9IHJhbmtJbmZvIC0g5o6S5ZCN5L+h5oGvXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHJhbmsgLSDmjpLlkI3vvIgxLCAyLCAz77yJXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHggLSBY5Z2Q5qCHXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHkgLSBZ5Z2Q5qCHXG4gICAgICovXG4gICAgX2NyZWF0ZVJhbmtpbmdJdGVtOiBmdW5jdGlvbihwYXJlbnQsIHJhbmtJbmZvLCByYW5rLCB4LCB5KSB7XG4gICAgICAgIHZhciBpdGVtTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUmFua0l0ZW1fXCIgKyByYW5rKVxuICAgICAgICBpdGVtTm9kZS5zZXRQb3NpdGlvbih4LCB5KVxuICAgICAgICBcbiAgICAgICAgLy8g5o6S5ZCN6IOM5pmvXG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkJnXCIpXG4gICAgICAgIHZhciBiZyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIFxuICAgICAgICAvLyDmoLnmja7mjpLlkI3orr7nva7kuI3lkIzpopzoibJcbiAgICAgICAgdmFyIGJnQ29sb3JcbiAgICAgICAgaWYgKHJhbmsgPT09IDEpIHtcbiAgICAgICAgICAgIGJnQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMTUsIDAsIDIwMCkgIC8vIOmHkeiJslxuICAgICAgICB9IGVsc2UgaWYgKHJhbmsgPT09IDIpIHtcbiAgICAgICAgICAgIGJnQ29sb3IgPSBuZXcgY2MuQ29sb3IoMTkyLCAxOTIsIDE5MiwgMjAwKSAgLy8g6ZO26ImyXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBiZ0NvbG9yID0gbmV3IGNjLkNvbG9yKDIwNSwgMTI3LCA1MCwgMjAwKSAgLy8g6ZOc6ImyXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGJnLmZpbGxDb2xvciA9IGJnQ29sb3JcbiAgICAgICAgYmcucm91bmRSZWN0KC01NSwgLTMwLCAxMTAsIDYwLCAxMClcbiAgICAgICAgYmcuZmlsbCgpXG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSBpdGVtTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5o6S5ZCN5qCH562+XG4gICAgICAgIHZhciByYW5rTGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJSYW5rTGFiZWxcIilcbiAgICAgICAgdmFyIHJhbmtMYWJlbCA9IHJhbmtMYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB2YXIgcmFua1RleHRcbiAgICAgICAgaWYgKHJhbmsgPT09IDEpIHtcbiAgICAgICAgICAgIHJhbmtUZXh0ID0gXCLwn6WHIOWGoOWGm1wiXG4gICAgICAgIH0gZWxzZSBpZiAocmFuayA9PT0gMikge1xuICAgICAgICAgICAgcmFua1RleHQgPSBcIvCfpYgg5Lqa5YabXCJcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJhbmtUZXh0ID0gXCLwn6WJIOWto+WGm1wiXG4gICAgICAgIH1cbiAgICAgICAgcmFua0xhYmVsLnN0cmluZyA9IHJhbmtUZXh0XG4gICAgICAgIHJhbmtMYWJlbC5mb250U2l6ZSA9IDE2XG4gICAgICAgIHJhbmtMYWJlbC5lbmFibGVCb2xkID0gdHJ1ZVxuICAgICAgICByYW5rTGFiZWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIHJhbmtMYWJlbE5vZGUueSA9IDEyXG4gICAgICAgIHJhbmtMYWJlbE5vZGUucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOeOqeWutuWQjeensFxuICAgICAgICB2YXIgbmFtZUxhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTmFtZUxhYmVsXCIpXG4gICAgICAgIHZhciBuYW1lTGFiZWwgPSBuYW1lTGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgbmFtZUxhYmVsLnN0cmluZyA9IHJhbmtJbmZvLnBsYXllcl9uYW1lIHx8IFwi546p5a62XCJcbiAgICAgICAgbmFtZUxhYmVsLmZvbnRTaXplID0gMTRcbiAgICAgICAgbmFtZUxhYmVsTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICBuYW1lTGFiZWxOb2RlLnkgPSAtOFxuICAgICAgICBuYW1lTGFiZWxOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDph5HluIHmlbBcbiAgICAgICAgdmFyIGNvaW5MYWJlbE5vZGUgPSBuZXcgY2MuTm9kZShcIkNvaW5MYWJlbFwiKVxuICAgICAgICB2YXIgY29pbkxhYmVsID0gY29pbkxhYmVsTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIGNvaW5MYWJlbC5zdHJpbmcgPSByYW5rSW5mby5tYXRjaF9jb2luICsgXCIg6YeR5biBXCJcbiAgICAgICAgY29pbkxhYmVsLmZvbnRTaXplID0gMTJcbiAgICAgICAgY29pbkxhYmVsTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjAwKVxuICAgICAgICBjb2luTGFiZWxOb2RlLnkgPSAtMjJcbiAgICAgICAgY29pbkxhYmVsTm9kZS5wYXJlbnQgPSBpdGVtTm9kZVxuICAgICAgICBcbiAgICAgICAgaXRlbU5vZGUucGFyZW50ID0gcGFyZW50XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn46J44CQ56ue5oqA5Zy644CR5Yib5bu65Yag5Yab57KS5a2Q54m55pWIXG4gICAgICovXG4gICAgX2NyZWF0ZUNoYW1waW9uUGFydGljbGVzOiBmdW5jdGlvbihwYXJlbnROb2RlLCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIC8vIOeugOWNleeahOmHkeiJsumXqueDgeeykuWtkOaViOaenFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDIwOyBpKyspIHtcbiAgICAgICAgICAgIChmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJ0aWNsZSA9IG5ldyBjYy5Ob2RlKFwiUGFydGljbGVfXCIgKyBpbmRleClcbiAgICAgICAgICAgICAgICBwYXJ0aWNsZS5zZXRQb3NpdGlvbihcbiAgICAgICAgICAgICAgICAgICAgKE1hdGgucmFuZG9tKCkgLSAwLjUpICogd2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCAvIDIgKyA1MFxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgcGFydGljbGVMYWJlbCA9IHBhcnRpY2xlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgICAgICBwYXJ0aWNsZUxhYmVsLnN0cmluZyA9IFwi4pyoXCJcbiAgICAgICAgICAgICAgICBwYXJ0aWNsZUxhYmVsLmZvbnRTaXplID0gMjAgKyBNYXRoLnJhbmRvbSgpICogMjBcbiAgICAgICAgICAgICAgICBwYXJ0aWNsZS5wYXJlbnQgPSBwYXJlbnROb2RlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2MudHdlZW4ocGFydGljbGUpXG4gICAgICAgICAgICAgICAgICAgIC5kZWxheShNYXRoLnJhbmRvbSgpICogMC41KVxuICAgICAgICAgICAgICAgICAgICAudG8oMiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgeTogLWhlaWdodCAvIDIgLSA1MCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHBhcnRpY2xlLnggKyAoTWF0aC5yYW5kb20oKSAtIDAuNSkgKiAxMDBcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmNhbGwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJ0aWNsZS5kZXN0cm95KClcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnN0YXJ0KClcbiAgICAgICAgICAgIH0pKGkpXG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIPCflKfjgJDmlrDlop7jgJHmnIDnu4jmppzljZXlpITnkIZcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICAvKipcbiAgICAgKiDwn4+G44CQ56ue5oqA5Zy644CR5aSE55CG5pyA57uI5qac5Y2V5raI5oGvXG4gICAgICog5b2T56ue5oqA5Zy65omA5pyJ6L2u5qyh57uT5p2f5pe26LCD55SoXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSB7IHBlcmlvZF9ubywgdG90YWxfcGxheWVycywgdG9wMywgdG9wMjAsIG15X3JhbmssIG15X21hdGNoX2NvaW4gfVxuICAgICAqL1xuICAgIF9vblRvdXJuYW1lbnRGaW5hbFJhbms6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCLwn4+GIFtfb25Ub3VybmFtZW50RmluYWxSYW5rXSDmlLbliLDmnIDnu4jmppzljZXmlbDmja46XCIsIEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICAgICBcbiAgICAgICAgLy8g5YGc5q2i5omA5pyJ5YCS6K6h5pe2XG4gICAgICAgIHRoaXMuX3N0b3BQbGF5Q291bnRkb3duKClcbiAgICAgICAgdGhpcy5fc3RvcEJpZENvdW50ZG93bigpXG4gICAgICAgIGlmICh0aGlzLl9sb2NhbEFyZW5hQ291bnRkb3duVGltZXIpIHtcbiAgICAgICAgICAgIHRoaXMudW5zY2hlZHVsZSh0aGlzLl9sb2NhbEFyZW5hQ291bnRkb3duVGljaylcbiAgICAgICAgICAgIHRoaXMuX2xvY2FsQXJlbmFDb3VudGRvd25UaW1lciA9IG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6ZqQ6JeP5q+U6LWb6YeR5biB5pi+56S6XG4gICAgICAgIHRoaXMuX2hpZGVNYXRjaENvaW5EaXNwbGF5KClcbiAgICAgICAgXG4gICAgICAgIC8vIOWFs+mXreS5i+WJjeeahOe7k+eul+W8ueeql1xuICAgICAgICBpZiAodGhpcy5fZ2FtZVJlc3VsdFBvcHVwIHx8IHRoaXMuX2dhbWVSZXN1bHRNYXNrKSB7XG4gICAgICAgICAgICB0aGlzLl9jbG9zZUdhbWVSZXN1bHRQb3B1cCh0aGlzLl9nYW1lUmVzdWx0UG9wdXAsIHRoaXMuX2dhbWVSZXN1bHRNYXNrKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmmL7npLrmnIDnu4jmppzljZXlvLnnqpdcbiAgICAgICAgdGhpcy5fc2hvd1RvdXJuYW1lbnRGaW5hbFJhbmtEaWFsb2coZGF0YSlcbiAgICB9LFxuICAgIFxuICAgIC8qKlxuICAgICAqIPCfmqrjgJDnq57mioDlnLrjgJHlpITnkIbmt5jmsbDouKLlh7rmiL/pl7TpgJrnn6VcbiAgICAgKiDlvZPnjqnlrrbooqvmt5jmsbDml7bvvIzmnI3liqHnq6/lj5HpgIHmraTmtojmga9cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIHsgcGVyaW9kX25vLCBwbGF5ZXJfaWQsIG1lc3NhZ2UgfVxuICAgICAqL1xuICAgIF9vbkFyZW5hRWxpbWluYXRlZEtpY2s6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCLwn5qqIFtfb25BcmVuYUVsaW1pbmF0ZWRLaWNrXSDmlLbliLDmt5jmsbDouKLlh7rpgJrnn6U6XCIsIEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICAgICBcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHZhciB3aW5TaXplID0gY2Mud2luU2l6ZVxuICAgICAgICBcbiAgICAgICAgLy8g5YGc5q2i5omA5pyJ5YCS6K6h5pe2XG4gICAgICAgIHRoaXMuX3N0b3BQbGF5Q291bnRkb3duKClcbiAgICAgICAgdGhpcy5fc3RvcEJpZENvdW50ZG93bigpXG4gICAgICAgIGlmICh0aGlzLl9sb2NhbEFyZW5hQ291bnRkb3duVGltZXIpIHtcbiAgICAgICAgICAgIHRoaXMudW5zY2hlZHVsZSh0aGlzLl9sb2NhbEFyZW5hQ291bnRkb3duVGljaylcbiAgICAgICAgICAgIHRoaXMuX2xvY2FsQXJlbmFDb3VudGRvd25UaW1lciA9IG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6ZqQ6JeP5q+U6LWb6YeR5biB5pi+56S6XG4gICAgICAgIHRoaXMuX2hpZGVNYXRjaENvaW5EaXNwbGF5KClcbiAgICAgICAgXG4gICAgICAgIC8vIOWFs+mXreS5i+WJjeeahOe7k+eul+W8ueeql1xuICAgICAgICBpZiAodGhpcy5fZ2FtZVJlc3VsdFBvcHVwIHx8IHRoaXMuX2dhbWVSZXN1bHRNYXNrKSB7XG4gICAgICAgICAgICB0aGlzLl9jbG9zZUdhbWVSZXN1bHRQb3B1cCh0aGlzLl9nYW1lUmVzdWx0UG9wdXAsIHRoaXMuX2dhbWVSZXN1bHRNYXNrKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmmL7npLrmt5jmsbDmj5DnpLrlvLnnqpdcbiAgICAgICAgdmFyIGNhbnZhcyA9IGNjLmZpbmQoXCJDYW52YXNcIikgfHwgY2MuZmluZChcIlVJX1JPT1RcIikgfHwgdGhpcy5ub2RlLnBhcmVudFxuICAgICAgICBpZiAoIWNhbnZhcykgY2FudmFzID0gdGhpcy5ub2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOmBrue9qeWxgiA9PT09PT09PT09XG4gICAgICAgIHZhciBtYXNrTm9kZSA9IG5ldyBjYy5Ob2RlKFwiRWxpbWluYXRlZEtpY2tNYXNrXCIpXG4gICAgICAgIG1hc2tOb2RlLmFkZENvbXBvbmVudChjYy5CbG9ja0lucHV0RXZlbnRzKVxuICAgICAgICBtYXNrTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigxMCwgNSwgMzApXG4gICAgICAgIG1hc2tOb2RlLm9wYWNpdHkgPSAyMDBcbiAgICAgICAgbWFza05vZGUud2lkdGggPSB3aW5TaXplLndpZHRoICogMlxuICAgICAgICBtYXNrTm9kZS5oZWlnaHQgPSB3aW5TaXplLmhlaWdodCAqIDJcbiAgICAgICAgbWFza05vZGUuekluZGV4ID0gOTk5XG4gICAgICAgIG1hc2tOb2RlLnBhcmVudCA9IGNhbnZhc1xuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSDlvLnnqpflrrnlmaggPT09PT09PT09PVxuICAgICAgICB2YXIgcG9wdXBOb2RlID0gbmV3IGNjLk5vZGUoXCJFbGltaW5hdGVkS2lja1BvcHVwXCIpXG4gICAgICAgIHBvcHVwTm9kZS5zY2FsZSA9IDAuM1xuICAgICAgICBwb3B1cE5vZGUub3BhY2l0eSA9IDBcbiAgICAgICAgcG9wdXBOb2RlLnpJbmRleCA9IDEwMDBcbiAgICAgICAgcG9wdXBOb2RlLnBhcmVudCA9IGNhbnZhc1xuICAgICAgICBcbiAgICAgICAgLy8g5by556qX5bC65a+4XG4gICAgICAgIHZhciBwb3B1cFdpZHRoID0gNTAwXG4gICAgICAgIHZhciBwb3B1cEhlaWdodCA9IDI4MFxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSDkuLvog4zmma8gPT09PT09PT09PVxuICAgICAgICB2YXIgYmdOb2RlID0gbmV3IGNjLk5vZGUoXCJCZ1wiKVxuICAgICAgICB2YXIgYmcgPSBiZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBiZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMzAsIDIyLCA1NCwgMjUwKVxuICAgICAgICBiZy5yb3VuZFJlY3QoLXBvcHVwV2lkdGgvMiwgLXBvcHVwSGVpZ2h0LzIsIHBvcHVwV2lkdGgsIHBvcHVwSGVpZ2h0LCAxNilcbiAgICAgICAgYmcuZmlsbCgpXG4gICAgICAgIGJnLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMTAwLCAxMDApXG4gICAgICAgIGJnLmxpbmVXaWR0aCA9IDNcbiAgICAgICAgYmcucm91bmRSZWN0KC1wb3B1cFdpZHRoLzIsIC1wb3B1cEhlaWdodC8yLCBwb3B1cFdpZHRoLCBwb3B1cEhlaWdodCwgMTYpXG4gICAgICAgIGJnLnN0cm9rZSgpXG4gICAgICAgIGJnTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0g5qCH6aKYID09PT09PT09PT1cbiAgICAgICAgdmFyIHRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIilcbiAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB0aXRsZUxhYmVsLnN0cmluZyA9IFwi8J+SlCDmt5jmsbDpgJrnn6VcIlxuICAgICAgICB0aXRsZUxhYmVsLmZvbnRTaXplID0gMzJcbiAgICAgICAgdGl0bGVMYWJlbC5saW5lSGVpZ2h0ID0gNDBcbiAgICAgICAgdGl0bGVOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMTAwLCAxMDApXG4gICAgICAgIHRpdGxlTm9kZS55ID0gODBcbiAgICAgICAgdGl0bGVOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSDmtojmga/lhoXlrrkgPT09PT09PT09PVxuICAgICAgICB2YXIgbXNnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTWVzc2FnZVwiKVxuICAgICAgICB2YXIgbXNnTGFiZWwgPSBtc2dOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgbXNnTGFiZWwuc3RyaW5nID0gZGF0YS5tZXNzYWdlIHx8IFwi5oKo5bey6KKr5reY5rGw77yM5Y2z5bCG56a75byA5oi/6Ze0XCJcbiAgICAgICAgbXNnTGFiZWwuZm9udFNpemUgPSAyNFxuICAgICAgICBtc2dMYWJlbC5saW5lSGVpZ2h0ID0gMzJcbiAgICAgICAgbXNnTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyMjAsIDIyMCwgMjIwKVxuICAgICAgICBtc2dOb2RlLnkgPSAyMFxuICAgICAgICBtc2dOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSDnoa7lrprmjInpkq4gPT09PT09PT09PVxuICAgICAgICB2YXIgYnRuTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ29uZmlybUJ0blwiKVxuICAgICAgICB2YXIgYnRuQmcgPSBidG5Ob2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgYnRuQmcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDgwLCAxNDAsIDIwMClcbiAgICAgICAgYnRuQmcucm91bmRSZWN0KC04MCwgLTI1LCAxNjAsIDUwLCA4KVxuICAgICAgICBidG5CZy5maWxsKClcbiAgICAgICAgYnRuTm9kZS55ID0gLTcwXG4gICAgICAgIGJ0bk5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICB2YXIgYnRuTGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJMYWJlbFwiKVxuICAgICAgICB2YXIgYnRuTGFiZWwgPSBidG5MYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBidG5MYWJlbC5zdHJpbmcgPSBcIuehruWumlwiXG4gICAgICAgIGJ0bkxhYmVsLmZvbnRTaXplID0gMjRcbiAgICAgICAgYnRuTGFiZWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIGJ0bkxhYmVsTm9kZS5wYXJlbnQgPSBidG5Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmjInpkq7ngrnlh7vkuovku7ZcbiAgICAgICAgYnRuTm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8g5YWz6Zet5by556qXXG4gICAgICAgICAgICBwb3B1cE5vZGUuZGVzdHJveSgpXG4gICAgICAgICAgICBtYXNrTm9kZS5kZXN0cm95KClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6L+U5Zue5aSn5Y6FXG4gICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIilcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIOW8ueeql+WFpeWcuuWKqOeUu1xuICAgICAgICBwb3B1cE5vZGUucnVuQWN0aW9uKGNjLnNlcXVlbmNlKFxuICAgICAgICAgICAgY2Muc3Bhd24oXG4gICAgICAgICAgICAgICAgY2Muc2NhbGVUbygwLjMsIDEuMCkuZWFzaW5nKGNjLmVhc2VCYWNrT3V0KCkpLFxuICAgICAgICAgICAgICAgIGNjLmZhZGVJbigwLjMpXG4gICAgICAgICAgICApXG4gICAgICAgICkpXG4gICAgICAgIFxuICAgICAgICAvLyAz56eS5ZCO6Ieq5Yqo6L+U5Zue5aSn5Y6FXG4gICAgICAgIHRoaXMuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHBvcHVwTm9kZSAmJiBwb3B1cE5vZGUucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcG9wdXBOb2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgICAgIG1hc2tOb2RlLmRlc3Ryb3koKVxuICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZShcImhhbGxTY2VuZVwiKVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCAzKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog8J+PhuOAkOernuaKgOWcuuOAkeaYvuekuuacgOe7iOamnOWNleW8ueeql++8iOWujOaVtOeJiCAtIOW4pua7muWKqOWIl+ihqO+8iVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0geyBwZXJpb2Rfbm8sIHRvdGFsX3BsYXllcnMsIHRvcDMsIHRvcDIwLCBteV9yYW5rLCBteV9tYXRjaF9jb2luIH1cbiAgICAgKi9cbiAgICBfc2hvd1RvdXJuYW1lbnRGaW5hbFJhbmtEaWFsb2c6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIHZhciB3aW5TaXplID0gY2Mud2luU2l6ZVxuICAgICAgICBcbiAgICAgICAgdmFyIGNhbnZhcyA9IGNjLmZpbmQoXCJDYW52YXNcIikgfHwgY2MuZmluZChcIlVJX1JPT1RcIikgfHwgdGhpcy5ub2RlLnBhcmVudFxuICAgICAgICBpZiAoIWNhbnZhcykgY2FudmFzID0gdGhpcy5ub2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOmBrue9qeWxgiA9PT09PT09PT09XG4gICAgICAgIHZhciBtYXNrTm9kZSA9IG5ldyBjYy5Ob2RlKFwiRmluYWxSYW5rTWFza1wiKVxuICAgICAgICBtYXNrTm9kZS5hZGRDb21wb25lbnQoY2MuQmxvY2tJbnB1dEV2ZW50cylcbiAgICAgICAgbWFza05vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMTAsIDUsIDMwKVxuICAgICAgICBtYXNrTm9kZS5vcGFjaXR5ID0gMjAwXG4gICAgICAgIG1hc2tOb2RlLndpZHRoID0gd2luU2l6ZS53aWR0aCAqIDJcbiAgICAgICAgbWFza05vZGUuaGVpZ2h0ID0gd2luU2l6ZS5oZWlnaHQgKiAyXG4gICAgICAgIG1hc2tOb2RlLnpJbmRleCA9IDk5OVxuICAgICAgICBtYXNrTm9kZS5wYXJlbnQgPSBjYW52YXNcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0g5by556qX5a655ZmoID09PT09PT09PT1cbiAgICAgICAgdmFyIHBvcHVwTm9kZSA9IG5ldyBjYy5Ob2RlKFwiRmluYWxSYW5rUG9wdXBcIilcbiAgICAgICAgcG9wdXBOb2RlLnNjYWxlID0gMC4zXG4gICAgICAgIHBvcHVwTm9kZS5vcGFjaXR5ID0gMFxuICAgICAgICBwb3B1cE5vZGUuekluZGV4ID0gMTAwMFxuICAgICAgICBwb3B1cE5vZGUucGFyZW50ID0gY2FudmFzXG4gICAgICAgIFxuICAgICAgICAvLyDlvLnnqpflsLrlr7jvvIjpq5jluqbmlLnkuLrlsY/luZXpq5jluqbnmoQ4NSXvvIzpgb/lhY3muqLlh7rvvIlcbiAgICAgICAgdmFyIHBvcHVwV2lkdGggPSA2MDBcbiAgICAgICAgdmFyIHBvcHVwSGVpZ2h0ID0gTWF0aC5mbG9vcih3aW5TaXplLmhlaWdodCAqIDAuODUpXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOS4u+iDjOaZryA9PT09PT09PT09XG4gICAgICAgIHZhciBiZ05vZGUgPSBuZXcgY2MuTm9kZShcIkJnXCIpXG4gICAgICAgIHZhciBiZyA9IGJnTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGJnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcigzMCwgMjIsIDU0LCAyNTApXG4gICAgICAgIGJnLnJvdW5kUmVjdCgtcG9wdXBXaWR0aC8yLCAtcG9wdXBIZWlnaHQvMiwgcG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQsIDE2KVxuICAgICAgICBiZy5maWxsKClcbiAgICAgICAgYmcuc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDgwKVxuICAgICAgICBiZy5saW5lV2lkdGggPSAzXG4gICAgICAgIGJnLnJvdW5kUmVjdCgtcG9wdXBXaWR0aC8yLCAtcG9wdXBIZWlnaHQvMiwgcG9wdXBXaWR0aCwgcG9wdXBIZWlnaHQsIDE2KVxuICAgICAgICBiZy5zdHJva2UoKVxuICAgICAgICBiZ05vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOmhtumDqOagh+mimOWMuuWfnyA9PT09PT09PT09XG4gICAgICAgIHZhciB0aXRsZUJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVCZ1wiKVxuICAgICAgICB2YXIgdGl0bGVCZyA9IHRpdGxlQmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgdGl0bGVCZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMTgwLCAxMzAsIDUwLCAyMjApXG4gICAgICAgIHRpdGxlQmcucm91bmRSZWN0KC1wb3B1cFdpZHRoLzIgKyA4LCBwb3B1cEhlaWdodC8yIC0gNTUsIHBvcHVwV2lkdGggLSAxNiwgNTAsIDgpXG4gICAgICAgIHRpdGxlQmcuZmlsbCgpXG4gICAgICAgIHRpdGxlQmdOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgdmFyIHRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiVGl0bGVcIilcbiAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICB0aXRsZUxhYmVsLnN0cmluZyA9IFwi8J+PhiDmr5TotZvnu5PmnZ8g8J+PhlwiXG4gICAgICAgIHRpdGxlTGFiZWwuZm9udFNpemUgPSAzMlxuICAgICAgICB0aXRsZUxhYmVsLmVuYWJsZUJvbGQgPSB0cnVlXG4gICAgICAgIHRpdGxlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICB0aXRsZU5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTAsIDIyMClcbiAgICAgICAgdGl0bGVOb2RlLnkgPSBwb3B1cEhlaWdodC8yIC0gMzJcbiAgICAgICAgdGl0bGVOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g5Y+C6LWb5Lq65pWwXG4gICAgICAgIHZhciB0b3RhbE5vZGUgPSBuZXcgY2MuTm9kZShcIlRvdGFsXCIpXG4gICAgICAgIHZhciB0b3RhbExhYmVsID0gdG90YWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgdG90YWxMYWJlbC5zdHJpbmcgPSBcIuWFsSBcIiArIChkYXRhLnRvdGFsX3BsYXllcnMgfHwgMykgKyBcIiDkurrlj4LotZtcIlxuICAgICAgICB0b3RhbExhYmVsLmZvbnRTaXplID0gMTZcbiAgICAgICAgdG90YWxMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHRvdGFsTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyMDAsIDIwMCwgMjIwKVxuICAgICAgICB0b3RhbE5vZGUueSA9IHBvcHVwSGVpZ2h0LzIgLSA3NVxuICAgICAgICB0b3RhbE5vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IFRPUDMg6aKG5aWW5Y+w77yI57Sn5YeR5biD5bGA77yJPT09PT09PT09PVxuICAgICAgICB2YXIgdG9wMyA9IGRhdGEudG9wMyB8fCBbXVxuICAgICAgICB2YXIgcG9kaXVtWSA9IHBvcHVwSGVpZ2h0LzIgLSAxNDVcbiAgICAgICAgdmFyIHBvZGl1bVNwYWNpbmcgPSAxNzBcbiAgICAgICAgXG4gICAgICAgIC8vIOmTtueJjO+8iOesrOS6jOWQje+8iS0g5bem5L6nXG4gICAgICAgIGlmICh0b3AzLmxlbmd0aCA+PSAyKSB7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVQb2RpdW1FbnRyeShwb3B1cE5vZGUsIHRvcDNbMV0sIDIsIC1wb2RpdW1TcGFjaW5nLCBwb2RpdW1ZKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDph5HniYzvvIjnrKzkuIDlkI3vvIktIOS4remXtO+8iOacgOmrmO+8iVxuICAgICAgICBpZiAodG9wMy5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgdGhpcy5fY3JlYXRlUG9kaXVtRW50cnkocG9wdXBOb2RlLCB0b3AzWzBdLCAxLCAwLCBwb2RpdW1ZICsgMjApXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmTnOeJjO+8iOesrOS4ieWQje+8iS0g5Y+z5L6nXG4gICAgICAgIGlmICh0b3AzLmxlbmd0aCA+PSAzKSB7XG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVQb2RpdW1FbnRyeShwb3B1cE5vZGUsIHRvcDNbMl0sIDMsIHBvZGl1bVNwYWNpbmcsIHBvZGl1bVkgLSAxMClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSDnrKw0LTIw5ZCN5rua5Yqo5YiX6KGo5Yy65Z+fID09PT09PT09PT1cbiAgICAgICAgdmFyIHRvcDIwID0gZGF0YS50b3AyMCB8fCBbXVxuICAgICAgICBpZiAodG9wMjAubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLy8g5YiX6KGo5Yy65Z+f5qCH6aKYXG4gICAgICAgICAgICB2YXIgbGlzdFRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwiTGlzdFRpdGxlXCIpXG4gICAgICAgICAgICB2YXIgbGlzdFRpdGxlTGFiZWwgPSBsaXN0VGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgICAgIGxpc3RUaXRsZUxhYmVsLnN0cmluZyA9IFwi4oCU4oCUIOaOkuihjOamnCDigJTigJRcIlxuICAgICAgICAgICAgbGlzdFRpdGxlTGFiZWwuZm9udFNpemUgPSAxOFxuICAgICAgICAgICAgbGlzdFRpdGxlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICAgICAgbGlzdFRpdGxlTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigxODAsIDE2MCwgMTIwKVxuICAgICAgICAgICAgbGlzdFRpdGxlTm9kZS55ID0gcG9wdXBIZWlnaHQvMiAtIDI2MFxuICAgICAgICAgICAgbGlzdFRpdGxlTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5Yib5bu65rua5Yqo6KeG5Zu+5a655ZmoXG4gICAgICAgICAgICB2YXIgc2Nyb2xsVmlld05vZGUgPSBuZXcgY2MuTm9kZShcIlNjcm9sbFZpZXdcIilcbiAgICAgICAgICAgIHNjcm9sbFZpZXdOb2RlLndpZHRoID0gcG9wdXBXaWR0aCAtIDQwXG4gICAgICAgICAgICBzY3JvbGxWaWV3Tm9kZS5oZWlnaHQgPSAyODBcbiAgICAgICAgICAgIHNjcm9sbFZpZXdOb2RlLnkgPSAtMzBcbiAgICAgICAgICAgIHNjcm9sbFZpZXdOb2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmt7vliqDpga7nvannu4Tku7ZcbiAgICAgICAgICAgIHZhciBtYXNrID0gc2Nyb2xsVmlld05vZGUuYWRkQ29tcG9uZW50KGNjLk1hc2spXG4gICAgICAgICAgICBtYXNrLnR5cGUgPSBjYy5NYXNrLlR5cGUuUkVDVFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDliJvlu7rlhoXlrrnlrrnlmahcbiAgICAgICAgICAgIHZhciBjb250ZW50Tm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ29udGVudFwiKVxuICAgICAgICAgICAgY29udGVudE5vZGUud2lkdGggPSBwb3B1cFdpZHRoIC0gNDBcbiAgICAgICAgICAgIGNvbnRlbnROb2RlLmFuY2hvclkgPSAxXG4gICAgICAgICAgICBjb250ZW50Tm9kZS55ID0gc2Nyb2xsVmlld05vZGUuaGVpZ2h0IC8gMlxuICAgICAgICAgICAgY29udGVudE5vZGUucGFyZW50ID0gc2Nyb2xsVmlld05vZGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkei/h+a7pOaOieW3suWcqFRPUDPkuK3nmoTnjqnlrrbvvIzpgb/lhY3ph43lpI3mmL7npLpcbiAgICAgICAgICAgIHZhciB0b3AzUGxheWVySURzID0ge31cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG9wMy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0b3AzW2ldICYmIHRvcDNbaV0ucGxheWVyX2lkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvcDNQbGF5ZXJJRHNbdG9wM1tpXS5wbGF5ZXJfaWRdID0gdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5Y+q5pi+56S656ysNOWQjeWPiuS5i+WQjueahOeOqeWutu+8iOi/h+a7pOaOiVRPUDPvvIlcbiAgICAgICAgICAgIHZhciBmaWx0ZXJlZFRvcDIwID0gW11cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG9wMjAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcmFua0RhdGEgPSB0b3AyMFtpXVxuICAgICAgICAgICAgICAgIC8vIOi3s+i/h+W3suWcqFRPUDPkuK3nmoTnjqnlrrZcbiAgICAgICAgICAgICAgICBpZiAocmFua0RhdGEgJiYgcmFua0RhdGEucGxheWVyX2lkICYmICF0b3AzUGxheWVySURzW3JhbmtEYXRhLnBsYXllcl9pZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWRUb3AyMC5wdXNoKHJhbmtEYXRhKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5re75Yqg5q+P5Liq5o6S6KGM6aG5XG4gICAgICAgICAgICB2YXIgaXRlbUhlaWdodCA9IDQ1XG4gICAgICAgICAgICB2YXIgc3RhcnRZID0gMFxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWx0ZXJlZFRvcDIwLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJhbmtEYXRhID0gZmlsdGVyZWRUb3AyMFtpXVxuICAgICAgICAgICAgICAgIHZhciBhY3R1YWxSYW5rID0gaSArIDQgIC8vIOesrDTlkI3lvIDlp4tcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgaXRlbU5vZGUgPSB0aGlzLl9jcmVhdGVSYW5rTGlzdEl0ZW0ocmFua0RhdGEsIGFjdHVhbFJhbmssIHBvcHVwV2lkdGggLSA1MClcbiAgICAgICAgICAgICAgICBpdGVtTm9kZS55ID0gc3RhcnRZIC0gaSAqIGl0ZW1IZWlnaHQgLSBpdGVtSGVpZ2h0IC8gMlxuICAgICAgICAgICAgICAgIGl0ZW1Ob2RlLnBhcmVudCA9IGNvbnRlbnROb2RlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOiuvue9ruWGheWuuemrmOW6plxuICAgICAgICAgICAgY29udGVudE5vZGUuaGVpZ2h0ID0gTWF0aC5tYXgoZmlsdGVyZWRUb3AyMC5sZW5ndGggKiBpdGVtSGVpZ2h0LCAyODApXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOa3u+WKoOinpuaRuOa7muWKqFxuICAgICAgICAgICAgdGhpcy5fYWRkU2Nyb2xsVmlld1RvdWNoKHNjcm9sbFZpZXdOb2RlLCBjb250ZW50Tm9kZSwgMjgwKVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOW6lemDqOWMuuWfn++8iOaIkeeahOaOkuWQjSArIOaMiemSru+8iT09PT09PT09PT1cbiAgICAgICAgLy8g5YiG6ZqU57q/XG4gICAgICAgIHZhciBzZXBOb2RlID0gbmV3IGNjLk5vZGUoXCJCb3R0b21TZXBcIilcbiAgICAgICAgdmFyIHNlcCA9IHNlcE5vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBzZXAuc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDgwLCAxMDApXG4gICAgICAgIHNlcC5saW5lV2lkdGggPSAxXG4gICAgICAgIHNlcC5tb3ZlVG8oLXBvcHVwV2lkdGgvMiArIDMwLCAwKVxuICAgICAgICBzZXAubGluZVRvKHBvcHVwV2lkdGgvMiAtIDMwLCAwKVxuICAgICAgICBzZXAuc3Ryb2tlKClcbiAgICAgICAgc2VwTm9kZS55ID0gLXBvcHVwSGVpZ2h0LzIgKyAxNDBcbiAgICAgICAgc2VwTm9kZS5wYXJlbnQgPSBwb3B1cE5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOaIkeeahOaOkuWQjeiDjOaZr1xuICAgICAgICB2YXIgbXlSYW5rQmdOb2RlID0gbmV3IGNjLk5vZGUoXCJNeVJhbmtCZ1wiKVxuICAgICAgICB2YXIgbXlSYW5rQmcgPSBteVJhbmtCZ05vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICBteVJhbmtCZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoNTAsIDQ1LCA4MCwgMjAwKVxuICAgICAgICBteVJhbmtCZy5yb3VuZFJlY3QoLTIwMCwgLTIyLCA0MDAsIDQ0LCA4KVxuICAgICAgICBteVJhbmtCZy5maWxsKClcbiAgICAgICAgbXlSYW5rQmcuc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyMDAsIDgwLCAxNTApXG4gICAgICAgIG15UmFua0JnLmxpbmVXaWR0aCA9IDFcbiAgICAgICAgbXlSYW5rQmcucm91bmRSZWN0KC0yMDAsIC0yMiwgNDAwLCA0NCwgOClcbiAgICAgICAgbXlSYW5rQmcuc3Ryb2tlKClcbiAgICAgICAgbXlSYW5rQmdOb2RlLnkgPSAtcG9wdXBIZWlnaHQvMiArIDEwMFxuICAgICAgICBteVJhbmtCZ05vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmiJHnmoTmjpLlkI3mloflrZdcbiAgICAgICAgdmFyIG15UmFua05vZGUgPSBuZXcgY2MuTm9kZShcIk15UmFua1wiKVxuICAgICAgICB2YXIgbXlSYW5rTGFiZWwgPSBteVJhbmtOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgbXlSYW5rTGFiZWwuc3RyaW5nID0gXCLmiJHnmoTmjpLlkI06IOesrCBcIiArIChkYXRhLm15X3JhbmsgfHwgMSkgKyBcIiDlkI0gIHwgIOavlOi1m+mHkeW4gTogXCIgKyAoZGF0YS5teV9tYXRjaF9jb2luIHx8IDApXG4gICAgICAgIG15UmFua0xhYmVsLmZvbnRTaXplID0gMjBcbiAgICAgICAgbXlSYW5rTGFiZWwuZW5hYmxlQm9sZCA9IHRydWVcbiAgICAgICAgbXlSYW5rTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICBteVJhbmtOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjMwLCAxNTApXG4gICAgICAgIG15UmFua05vZGUueSA9IC1wb3B1cEhlaWdodC8yICsgMTAwXG4gICAgICAgIG15UmFua05vZGUucGFyZW50ID0gcG9wdXBOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOehruWumuaMiemSriA9PT09PT09PT09XG4gICAgICAgIHZhciBidG5Ob2RlID0gbmV3IGNjLk5vZGUoXCJDb25maXJtQnRuXCIpXG4gICAgICAgIGJ0bk5vZGUud2lkdGggPSAxODBcbiAgICAgICAgYnRuTm9kZS5oZWlnaHQgPSA1MFxuICAgICAgICBcbiAgICAgICAgdmFyIGJ0bkJnID0gYnRuTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGJ0bkJnLmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig3NiwgMTc1LCA4MClcbiAgICAgICAgYnRuQmcucm91bmRSZWN0KC05MCwgLTI1LCAxODAsIDUwLCAxMClcbiAgICAgICAgYnRuQmcuZmlsbCgpXG4gICAgICAgIGJ0bkJnLnN0cm9rZUNvbG9yID0gbmV3IGNjLkNvbG9yKDEyOSwgMTk5LCAxMzIpXG4gICAgICAgIGJ0bkJnLmxpbmVXaWR0aCA9IDJcbiAgICAgICAgYnRuQmcucm91bmRSZWN0KC05MCwgLTI1LCAxODAsIDUwLCAxMClcbiAgICAgICAgYnRuQmcuc3Ryb2tlKClcbiAgICAgICAgYnRuTm9kZS55ID0gLXBvcHVwSGVpZ2h0LzIgKyA0MFxuICAgICAgICBidG5Ob2RlLnBhcmVudCA9IHBvcHVwTm9kZVxuICAgICAgICBcbiAgICAgICAgdmFyIGJ0bkxhYmVsID0gbmV3IGNjLk5vZGUoXCJMYWJlbFwiKVxuICAgICAgICB2YXIgYnRuTGFiZWxDb21wID0gYnRuTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBidG5MYWJlbENvbXAuc3RyaW5nID0gXCLnoa4gIOWumlwiXG4gICAgICAgIGJ0bkxhYmVsQ29tcC5mb250U2l6ZSA9IDI0XG4gICAgICAgIGJ0bkxhYmVsQ29tcC5lbmFibGVCb2xkID0gdHJ1ZVxuICAgICAgICBidG5MYWJlbENvbXAuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUlxuICAgICAgICBidG5MYWJlbENvbXAudmVydGljYWxBbGlnbiA9IGNjLkxhYmVsLlZlcnRpY2FsQWxpZ24uQ0VOVEVSXG4gICAgICAgIGJ0bkxhYmVsLnNldENvbnRlbnRTaXplKDE4MCwgNTApXG4gICAgICAgIGJ0bkxhYmVsLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIGJ0bkxhYmVsLnNldFBvc2l0aW9uKDAsIDApXG4gICAgICAgIGJ0bkxhYmVsLnBhcmVudCA9IGJ0bk5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOaMiemSruinpuaRuOaViOaenFxuICAgICAgICBidG5Ob2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX1NUQVJULCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJ0bk5vZGUuc2NhbGUgPSAwLjk1XG4gICAgICAgIH0pXG4gICAgICAgIGJ0bk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJ0bk5vZGUuc2NhbGUgPSAxXG4gICAgICAgICAgICBwb3B1cE5vZGUuZGVzdHJveSgpXG4gICAgICAgICAgICBtYXNrTm9kZS5kZXN0cm95KClcbiAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZShcImhhbGxTY2VuZVwiKVxuICAgICAgICB9KVxuICAgICAgICBidG5Ob2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0NBTkNFTCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBidG5Ob2RlLnNjYWxlID0gMVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSDlvLnlh7rliqjnlLsgPT09PT09PT09PVxuICAgICAgICBjYy50d2Vlbihwb3B1cE5vZGUpXG4gICAgICAgICAgICAudG8oMC4yLCB7IHNjYWxlOiAxLjAsIG9wYWNpdHk6IDI1NSB9LCB7IGVhc2luZzogJ2JhY2tPdXQnIH0pXG4gICAgICAgICAgICAuc3RhcnQoKVxuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCLwn4+GIFtfc2hvd1RvdXJuYW1lbnRGaW5hbFJhbmtEaWFsb2ddIOacgOe7iOamnOWNleW8ueeql+W3suaYvuekulwiKVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog5Yib5bu65o6S6KGM5YiX6KGo6aG5XG4gICAgICovXG4gICAgX2NyZWF0ZVJhbmtMaXN0SXRlbTogZnVuY3Rpb24ocmFua0RhdGEsIHJhbmssIHdpZHRoKSB7XG4gICAgICAgIHZhciBpdGVtTm9kZSA9IG5ldyBjYy5Ob2RlKFwiUmFua0l0ZW1fXCIgKyByYW5rKVxuICAgICAgICBpdGVtTm9kZS53aWR0aCA9IHdpZHRoXG4gICAgICAgIGl0ZW1Ob2RlLmhlaWdodCA9IDQyXG4gICAgICAgIFxuICAgICAgICAvLyDog4zmma/vvIjkuqTmm7/popzoibLvvIlcbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmdcIilcbiAgICAgICAgdmFyIGJnID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgaWYgKHJhbmsgJSAyID09PSAwKSB7XG4gICAgICAgICAgICBiZy5maWxsQ29sb3IgPSBuZXcgY2MuQ29sb3IoNDUsIDM4LCA3MCwgMTgwKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYmcuZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDM4LCAzMiwgNTgsIDE4MClcbiAgICAgICAgfVxuICAgICAgICBiZy5yb3VuZFJlY3QoLXdpZHRoLzIsIC0yMCwgd2lkdGgsIDQwLCA2KVxuICAgICAgICBiZy5maWxsKClcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDmjpLlkI1cbiAgICAgICAgdmFyIHJhbmtOb2RlID0gbmV3IGNjLk5vZGUoXCJSYW5rXCIpXG4gICAgICAgIHZhciByYW5rTGFiZWwgPSByYW5rTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIHJhbmtMYWJlbC5zdHJpbmcgPSBTdHJpbmcocmFuaylcbiAgICAgICAgcmFua0xhYmVsLmZvbnRTaXplID0gMThcbiAgICAgICAgcmFua0xhYmVsLmVuYWJsZUJvbGQgPSB0cnVlXG4gICAgICAgIHJhbmtMYWJlbC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSXG4gICAgICAgIHJhbmtOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjAwLCAxMDApXG4gICAgICAgIHJhbmtOb2RlLnNldFBvc2l0aW9uKC13aWR0aC8yICsgMzUsIDApXG4gICAgICAgIHJhbmtOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR546p5a625aS05YOPXG4gICAgICAgIHZhciBhdmF0YXJOb2RlID0gbmV3IGNjLk5vZGUoXCJBdmF0YXJcIilcbiAgICAgICAgYXZhdGFyTm9kZS5zZXRQb3NpdGlvbigtd2lkdGgvMiArIDc1LCAwKVxuICAgICAgICB2YXIgYXZhdGFyU3ByaXRlID0gYXZhdGFyTm9kZS5hZGRDb21wb25lbnQoY2MuU3ByaXRlKVxuICAgICAgICBhdmF0YXJTcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NXG4gICAgICAgIGF2YXRhck5vZGUuc2V0Q29udGVudFNpemUoMzIsIDMyKVxuICAgICAgICBhdmF0YXJOb2RlLnBhcmVudCA9IGl0ZW1Ob2RlXG4gICAgICAgIFxuICAgICAgICAvLyDliqDovb3lpLTlg49cbiAgICAgICAgdGhpcy5fbG9hZEF2YXRhclNwcml0ZShhdmF0YXJTcHJpdGUsIHJhbmtEYXRhLmF2YXRhciwgcmFua0RhdGEuaXNfcm9ib3QpXG4gICAgICAgIFxuICAgICAgICAvLyDnjqnlrrblkI3np7BcbiAgICAgICAgdmFyIG5hbWVOb2RlID0gbmV3IGNjLk5vZGUoXCJOYW1lXCIpXG4gICAgICAgIHZhciBuYW1lTGFiZWwgPSBuYW1lTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHnm7TmjqXkvb/nlKjmnI3liqHnq6/lj5HpgIHnmoTnjqnlrrbmmLXnp7DvvIzkuI3lho3moLnmja4gaXNfcm9ib3Qg6KaG55uWXG4gICAgICAgIC8vIOacjeWKoeerr+W3sue7j+ato+ehruWPkemAgeS6huecn+WunueOqeWutuaYteensO+8iOWMheaLrOacuuWZqOS6uueOqeWutueahOecn+WunuaYteensO+8iVxuICAgICAgICB2YXIgcGxheWVyTmFtZSA9IHJhbmtEYXRhLnBsYXllcl9uYW1lIHx8IFwi546p5a62XCJcbiAgICAgICAgbmFtZUxhYmVsLnN0cmluZyA9IHBsYXllck5hbWVcbiAgICAgICAgbmFtZUxhYmVsLmZvbnRTaXplID0gMTZcbiAgICAgICAgbmFtZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5MRUZUXG4gICAgICAgIG5hbWVMYWJlbC5vdmVyZmxvdyA9IGNjLkxhYmVsLk92ZXJmbG93LkNMQU1QXG4gICAgICAgIG5hbWVOb2RlLndpZHRoID0gMTUwXG4gICAgICAgIG5hbWVOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpXG4gICAgICAgIG5hbWVOb2RlLnNldFBvc2l0aW9uKC13aWR0aC8yICsgMTQ1LCAwKVxuICAgICAgICBuYW1lTm9kZS5wYXJlbnQgPSBpdGVtTm9kZVxuICAgICAgICBcbiAgICAgICAgLy8g6YeR5biBXG4gICAgICAgIHZhciBjb2luTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ29pblwiKVxuICAgICAgICB2YXIgY29pbkxhYmVsID0gY29pbk5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKVxuICAgICAgICBjb2luTGFiZWwuc3RyaW5nID0gKHJhbmtEYXRhLm1hdGNoX2NvaW4gfHwgMCkgKyBcIiDph5HluIFcIlxuICAgICAgICBjb2luTGFiZWwuZm9udFNpemUgPSAxNVxuICAgICAgICBjb2luTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLlJJR0hUXG4gICAgICAgIGNvaW5Ob2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjIwLCAxNTApXG4gICAgICAgIGNvaW5Ob2RlLnNldFBvc2l0aW9uKHdpZHRoLzIgLSA2MCwgMClcbiAgICAgICAgY29pbk5vZGUucGFyZW50ID0gaXRlbU5vZGVcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpdGVtTm9kZVxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog5re75Yqg5rua5Yqo6KeG5Zu+6Kem5pG45LqL5Lu2XG4gICAgICovXG4gICAgX2FkZFNjcm9sbFZpZXdUb3VjaDogZnVuY3Rpb24oc2Nyb2xsVmlld05vZGUsIGNvbnRlbnROb2RlLCB2aWV3SGVpZ2h0KSB7XG4gICAgICAgIHZhciB0b3VjaFN0YXJ0WSA9IDBcbiAgICAgICAgdmFyIGNvbnRlbnRTdGFydFkgPSAwXG4gICAgICAgIHZhciBtYXhPZmZzZXQgPSBNYXRoLm1heCgwLCBjb250ZW50Tm9kZS5oZWlnaHQgLSB2aWV3SGVpZ2h0KVxuICAgICAgICBcbiAgICAgICAgc2Nyb2xsVmlld05vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfU1RBUlQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB0b3VjaFN0YXJ0WSA9IGV2ZW50LmdldExvY2F0aW9uWSgpXG4gICAgICAgICAgICBjb250ZW50U3RhcnRZID0gY29udGVudE5vZGUueVxuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgc2Nyb2xsVmlld05vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfTU9WRSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciB0b3VjaFkgPSBldmVudC5nZXRMb2NhdGlvblkoKVxuICAgICAgICAgICAgdmFyIGRlbHRhWSA9IHRvdWNoWSAtIHRvdWNoU3RhcnRZXG4gICAgICAgICAgICB2YXIgbmV3WSA9IGNvbnRlbnRTdGFydFkgKyBkZWx0YVlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6ZmQ5Yi25rua5Yqo6IyD5Zu0XG4gICAgICAgICAgICB2YXIgbWluWSA9IHZpZXdIZWlnaHQgLyAyIC0gY29udGVudE5vZGUuaGVpZ2h0XG4gICAgICAgICAgICB2YXIgbWF4WSA9IHZpZXdIZWlnaHQgLyAyXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG5ld1kgPSBNYXRoLm1heChtaW5ZLCBNYXRoLm1pbihtYXhZLCBuZXdZKSlcbiAgICAgICAgICAgIGNvbnRlbnROb2RlLnkgPSBuZXdZXG4gICAgICAgIH0pXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn4+G44CQ56ue5oqA5Zy644CR5Yib5bu66aKG5aWW5Y+w5p2h55uu77yI576O5YyW54mI77yJXG4gICAgICovXG4gICAgX2NyZWF0ZVBvZGl1bUVudHJ5OiBmdW5jdGlvbihwYXJlbnQsIHJhbmtEYXRhLCByYW5rLCB4LCB5KSB7XG4gICAgICAgIHZhciBlbnRyeU5vZGUgPSBuZXcgY2MuTm9kZShcIlBvZGl1bUVudHJ5X1wiICsgcmFuaylcbiAgICAgICAgZW50cnlOb2RlLnNldFBvc2l0aW9uKHgsIHkpXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOaOkuWQjeiDjOaZr++8iOagueaNruaOkuWQjeiuvue9ruminOiJsu+8iT09PT09PT09PT1cbiAgICAgICAgdmFyIGJnTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQmdcIilcbiAgICAgICAgdmFyIGJnID0gYmdOb2RlLmFkZENvbXBvbmVudChjYy5HcmFwaGljcylcbiAgICAgICAgdmFyIGJnQ29sb3IsIGJvcmRlckNvbG9yXG4gICAgICAgIGlmIChyYW5rID09PSAxKSB7XG4gICAgICAgICAgICAvLyDph5HniYwgLSDph5HoibLns7tcbiAgICAgICAgICAgIGJnQ29sb3IgPSBuZXcgY2MuQ29sb3IoMTAwLCA4NSwgNDAsIDIzMClcbiAgICAgICAgICAgIGJvcmRlckNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjE1LCAwKVxuICAgICAgICB9IGVsc2UgaWYgKHJhbmsgPT09IDIpIHtcbiAgICAgICAgICAgIC8vIOmTtueJjCAtIOmTtuiJsuezu1xuICAgICAgICAgICAgYmdDb2xvciA9IG5ldyBjYy5Db2xvcig3MCwgNzUsIDg1LCAyMzApXG4gICAgICAgICAgICBib3JkZXJDb2xvciA9IG5ldyBjYy5Db2xvcigxOTIsIDE5MiwgMTkyKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g6ZOc54mMIC0g6ZOc6Imy57O7XG4gICAgICAgICAgICBiZ0NvbG9yID0gbmV3IGNjLkNvbG9yKDg1LCA2MCwgNDUsIDIzMClcbiAgICAgICAgICAgIGJvcmRlckNvbG9yID0gbmV3IGNjLkNvbG9yKDIwNSwgMTI3LCA1MClcbiAgICAgICAgfVxuICAgICAgICBiZy5maWxsQ29sb3IgPSBiZ0NvbG9yXG4gICAgICAgIGJnLnJvdW5kUmVjdCgtNTUsIC03MCwgMTEwLCAxNDAsIDEyKVxuICAgICAgICBiZy5maWxsKClcbiAgICAgICAgLy8g6L655qGGXG4gICAgICAgIGJnLnN0cm9rZUNvbG9yID0gYm9yZGVyQ29sb3JcbiAgICAgICAgYmcubGluZVdpZHRoID0gMlxuICAgICAgICBiZy5yb3VuZFJlY3QoLTU1LCAtNzAsIDExMCwgMTQwLCAxMilcbiAgICAgICAgYmcuc3Ryb2tlKClcbiAgICAgICAgYmdOb2RlLnBhcmVudCA9IGVudHJ5Tm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSDmjpLlkI3lpZbniYzlm77moIcgPT09PT09PT09PVxuICAgICAgICB2YXIgbWVkYWxOb2RlID0gbmV3IGNjLk5vZGUoXCJNZWRhbFwiKVxuICAgICAgICB2YXIgbWVkYWwgPSBtZWRhbE5vZGUuYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKVxuICAgICAgICB2YXIgbWVkYWxDb2xvclxuICAgICAgICBpZiAocmFuayA9PT0gMSkge1xuICAgICAgICAgICAgbWVkYWxDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIxNSwgMCkgIC8vIOmHkeiJslxuICAgICAgICB9IGVsc2UgaWYgKHJhbmsgPT09IDIpIHtcbiAgICAgICAgICAgIG1lZGFsQ29sb3IgPSBuZXcgY2MuQ29sb3IoMTkyLCAxOTIsIDE5MikgIC8vIOmTtuiJslxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWVkYWxDb2xvciA9IG5ldyBjYy5Db2xvcigyMDUsIDEyNywgNTApICAvLyDpk5zoibJcbiAgICAgICAgfVxuICAgICAgICBtZWRhbC5maWxsQ29sb3IgPSBtZWRhbENvbG9yXG4gICAgICAgIC8vIOe7mOWItuWchuW9ouWllueJjFxuICAgICAgICBtZWRhbC5jaXJjbGUoMCwgNDUsIDIyKVxuICAgICAgICBtZWRhbC5maWxsKClcbiAgICAgICAgbWVkYWwuc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSwgMTUwKVxuICAgICAgICBtZWRhbC5saW5lV2lkdGggPSAyXG4gICAgICAgIG1lZGFsLmNpcmNsZSgwLCA0NSwgMjIpXG4gICAgICAgIG1lZGFsLnN0cm9rZSgpXG4gICAgICAgIG1lZGFsTm9kZS5wYXJlbnQgPSBlbnRyeU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vIOWllueJjOS4iueahOaVsOWtl1xuICAgICAgICB2YXIgcmFua051bU5vZGUgPSBuZXcgY2MuTm9kZShcIlJhbmtOdW1cIilcbiAgICAgICAgdmFyIHJhbmtOdW1MYWJlbCA9IHJhbmtOdW1Ob2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgcmFua051bUxhYmVsLnN0cmluZyA9IFN0cmluZyhyYW5rKVxuICAgICAgICByYW5rTnVtTGFiZWwuZm9udFNpemUgPSAyNFxuICAgICAgICByYW5rTnVtTGFiZWwuZW5hYmxlQm9sZCA9IHRydWVcbiAgICAgICAgcmFua051bUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgcmFua051bU5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoNTAsIDQwLCAzMClcbiAgICAgICAgcmFua051bU5vZGUuc2V0UG9zaXRpb24oMCwgNDUpXG4gICAgICAgIHJhbmtOdW1Ob2RlLnBhcmVudCA9IGVudHJ5Tm9kZVxuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PSDnjqnlrrblpLTlg48gPT09PT09PT09PVxuICAgICAgICB2YXIgYXZhdGFyTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQXZhdGFyXCIpXG4gICAgICAgIGF2YXRhck5vZGUuc2V0UG9zaXRpb24oMCwgMjApXG4gICAgICAgIHZhciBhdmF0YXJTcHJpdGUgPSBhdmF0YXJOb2RlLmFkZENvbXBvbmVudChjYy5TcHJpdGUpXG4gICAgICAgIGF2YXRhclNwcml0ZS5zaXplTW9kZSA9IGNjLlNwcml0ZS5TaXplTW9kZS5DVVNUT01cbiAgICAgICAgYXZhdGFyTm9kZS5zZXRDb250ZW50U2l6ZSg1MCwgNTApXG4gICAgICAgIGF2YXRhck5vZGUucGFyZW50ID0gZW50cnlOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5Yqg6L295aS05YOPXG4gICAgICAgIHRoaXMuX2xvYWRBdmF0YXJTcHJpdGUoYXZhdGFyU3ByaXRlLCByYW5rRGF0YS5hdmF0YXIsIHJhbmtEYXRhLmlzX3JvYm90KVxuICAgICAgICBcbiAgICAgICAgLy8g5aS05YOP6L655qGGXG4gICAgICAgIHZhciBhdmF0YXJGcmFtZU5vZGUgPSBuZXcgY2MuTm9kZShcIkF2YXRhckZyYW1lXCIpXG4gICAgICAgIHZhciBhdmF0YXJGcmFtZSA9IGF2YXRhckZyYW1lTm9kZS5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpXG4gICAgICAgIGF2YXRhckZyYW1lLnN0cm9rZUNvbG9yID0gYm9yZGVyQ29sb3JcbiAgICAgICAgYXZhdGFyRnJhbWUubGluZVdpZHRoID0gMlxuICAgICAgICBhdmF0YXJGcmFtZS5jaXJjbGUoMCwgMjAsIDI2KVxuICAgICAgICBhdmF0YXJGcmFtZS5zdHJva2UoKVxuICAgICAgICBhdmF0YXJGcmFtZU5vZGUucGFyZW50ID0gZW50cnlOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOeOqeWutuWQjeensCA9PT09PT09PT09XG4gICAgICAgIHZhciBuYW1lTGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJOYW1lXCIpXG4gICAgICAgIHZhciBuYW1lTGFiZWwgPSBuYW1lTGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeebtOaOpeS9v+eUqOacjeWKoeerr+WPkemAgeeahOeOqeWutuaYteensO+8jOS4jeWGjeagueaNriBpc19yb2JvdCDopobnm5ZcbiAgICAgICAgLy8g5pyN5Yqh56uv5bey57uP5q2j56Gu5Y+R6YCB5LqG55yf5a6e546p5a625pi156ew77yI5YyF5ous5py65Zmo5Lq6546p5a6255qE55yf5a6e5pi156ew77yJXG4gICAgICAgIHZhciBwbGF5ZXJOYW1lID0gcmFua0RhdGEucGxheWVyX25hbWUgfHwgXCLnjqnlrrZcIlxuICAgICAgICBuYW1lTGFiZWwuc3RyaW5nID0gcGxheWVyTmFtZVxuICAgICAgICBuYW1lTGFiZWwuZm9udFNpemUgPSAxOFxuICAgICAgICBuYW1lTGFiZWwuZW5hYmxlQm9sZCA9IHRydWVcbiAgICAgICAgbmFtZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgbmFtZUxhYmVsTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KVxuICAgICAgICBuYW1lTGFiZWxOb2RlLnkgPSA1XG4gICAgICAgIG5hbWVMYWJlbE5vZGUucGFyZW50ID0gZW50cnlOb2RlXG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09IOavlOi1m+mHkeW4gSA9PT09PT09PT09XG4gICAgICAgIHZhciBjb2luTGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJDb2luXCIpXG4gICAgICAgIHZhciBjb2luTGFiZWwgPSBjb2luTGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbClcbiAgICAgICAgY29pbkxhYmVsLnN0cmluZyA9IChyYW5rRGF0YS5tYXRjaF9jb2luIHx8IDApICsgXCIg6YeR5biBXCJcbiAgICAgICAgY29pbkxhYmVsLmZvbnRTaXplID0gMTZcbiAgICAgICAgY29pbkxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVJcbiAgICAgICAgY29pbkxhYmVsTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDIzMCwgMTUwKVxuICAgICAgICBjb2luTGFiZWxOb2RlLnkgPSAtMjVcbiAgICAgICAgY29pbkxhYmVsTm9kZS5wYXJlbnQgPSBlbnRyeU5vZGVcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT0g5LiN5YaN5pi+56S65py65Zmo5Lq6QUnmoIfnrb4gPT09PT09PT09PVxuICAgICAgICAvLyDnlKjmiLfopoHmsYLvvJrmnLrlmajkurrkuI3mmL7npLpBSeagh+ivhlxuICAgICAgICBcbiAgICAgICAgZW50cnlOb2RlLnBhcmVudCA9IHBhcmVudFxuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog6I635Y+W5py65Zmo5Lq65pi+56S65ZCN56ew77yI5bey5byD55SoIC0g5L+d55WZ5aSH55So77yJXG4gICAgICog8J+Up+OAkOS/ruWkjeOAkeacjeWKoeerr+W3sue7j+ato+ehruWPkemAgeecn+WunueOqeWutuaYteensO+8jOS4jeWGjemcgOimgeatpOaWueazleimhuebllxuICAgICAqL1xuICAgIF9nZXRSb2JvdERpc3BsYXlOYW1lOiBmdW5jdGlvbihwbGF5ZXJJZCwgb3JpZ2luYWxOYW1lKSB7XG4gICAgICAgIC8vIOebtOaOpei/lOWbnuWOn+Wni+WQjeensO+8jOacjeWKoeerr+W3sue7j+WPkemAgeato+ehrueahOaYteensFxuICAgICAgICBpZiAob3JpZ2luYWxOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gb3JpZ2luYWxOYW1lXG4gICAgICAgIH1cbiAgICAgICAgLy8g5aaC5p6c5rKh5pyJ5ZCN56ew77yM6L+U5Zue6buY6K6k5py65Zmo5Lq65ZCN56ewXG4gICAgICAgIHZhciByb2JvdEluZGV4ID0gMVxuICAgICAgICBpZiAocGxheWVySWQpIHtcbiAgICAgICAgICAgIHZhciBsYXN0Q2hhciA9IHBsYXllcklkLnRvU3RyaW5nKCkuc2xpY2UoLTEpXG4gICAgICAgICAgICByb2JvdEluZGV4ID0gcGFyc2VJbnQobGFzdENoYXIpIHx8IDFcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXCLmmbrog73pmarnu4NcIiArIHJvYm90SW5kZXggKyBcIuWPt1wiXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5Yqg6L295aS05YOP57K+54G1XG4gICAgICogQHBhcmFtIHtjYy5TcHJpdGV9IHNwcml0ZSAtIOebruagh+eyvueBtee7hOS7tlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBhdmF0YXJVcmwgLSDlpLTlg49VUkzmiJbotYTmupDlkI1cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzUm9ib3QgLSDmmK/lkKbmmK/mnLrlmajkurpcbiAgICAgKi9cbiAgICBfbG9hZEF2YXRhclNwcml0ZTogZnVuY3Rpb24oc3ByaXRlLCBhdmF0YXJVcmwsIGlzUm9ib3QpIHtcbiAgICAgICAgaWYgKCFzcHJpdGUpIHJldHVyblxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeS8mOWFiOS9v+eUqOacjeWKoeerr+WPkemAgeeahOWktOWDj1VSTO+8jOaXoOiuuiBpc1JvYm90IOWAvOaYr+S7gOS5iFxuICAgICAgICAvLyDmnI3liqHnq6/lt7Lnu4/mraPnoa7lj5HpgIHkuobnnJ/lrp7njqnlrrbnmoTlpLTlg49VUkzvvIjljIXmi6zmnLrlmajkurrnjqnlrrbnmoTlpLTlg4/vvIlcbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenOacieacieaViOeahOWktOWDj1VSTO+8jOS9v+eUqOacjeWKoeerr+WPkemAgeeahFVSTFxuICAgICAgICBpZiAoYXZhdGFyVXJsICYmIGF2YXRhclVybCAhPT0gXCJcIikge1xuICAgICAgICAgICAgLy8g5Yik5pat5pivVVJM6L+Y5piv5pys5Zyw6LWE5rqQ5ZCNXG4gICAgICAgICAgICBpZiAoYXZhdGFyVXJsLmluZGV4T2YoXCJodHRwXCIpID09PSAwIHx8IGF2YXRhclVybC5pbmRleE9mKFwiLy9cIikgPT09IDAgfHwgYXZhdGFyVXJsLmluZGV4T2YoXCIvdXBsb2Fkc1wiKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIOi/nOeoi1VSTCAtIOWkhOeQhuebuOWvuei3r+W+hFxuICAgICAgICAgICAgICAgIHZhciBmdWxsVXJsID0gYXZhdGFyVXJsXG4gICAgICAgICAgICAgICAgaWYgKGF2YXRhclVybC5pbmRleE9mKFwiL3VwbG9hZHNcIikgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgICAgICAgICAgICAgIHZhciBjZG5VcmwgPSBteWdsb2JhbCAmJiBteWdsb2JhbC5jZG5VcmwgPyBteWdsb2JhbC5jZG5VcmwgOiBcImh0dHBzOi8vYXBpcy5ob25neGl1ODguY29tXCJcbiAgICAgICAgICAgICAgICAgICAgZnVsbFVybCA9IGNkblVybCArIGF2YXRhclVybFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYy5hc3NldE1hbmFnZXIubG9hZFJlbW90ZShmdWxsVXJsLCB7IGV4dDogJy5wbmcnIH0sIGZ1bmN0aW9uKGVyciwgdGV4dHVyZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyIHx8ICF0ZXh0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDliqDovb3lpLHotKXvvIzkvb/nlKjpu5jorqTlpLTlg49cbiAgICAgICAgICAgICAgICAgICAgICAgIGNjLnJlc291cmNlcy5sb2FkKFwiVUkvaGVhZGltYWdlL2F2YXRhcl8xXCIsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIyLCBmYWxsYmFja1Nwcml0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZXJyMiAmJiBmYWxsYmFja1Nwcml0ZSAmJiBzcHJpdGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcHJpdGUuc3ByaXRlRnJhbWUgPSBmYWxsYmFja1Nwcml0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwcml0ZS5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNwcml0ZUZyYW1lID0gbmV3IGNjLlNwcml0ZUZyYW1lKHRleHR1cmUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8g5L2/55So6buY6K6k5aS05YOPXG4gICAgICAgICAgICAgICAgICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcIlVJL2hlYWRpbWFnZS9hdmF0YXJfMVwiLCBjYy5TcHJpdGVGcmFtZSwgZnVuY3Rpb24oZXJyMiwgZmFsbGJhY2tTcHJpdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVycjIgJiYgZmFsbGJhY2tTcHJpdGUgJiYgc3ByaXRlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ByaXRlLnNwcml0ZUZyYW1lID0gZmFsbGJhY2tTcHJpdGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5pys5Zyw6LWE5rqQ5ZCNXG4gICAgICAgICAgICB2YXIgcmVzb3VyY2VQYXRoID0gXCJVSS9oZWFkaW1hZ2UvXCIgKyBhdmF0YXJVcmxcbiAgICAgICAgICAgIGNjLnJlc291cmNlcy5sb2FkKHJlc291cmNlUGF0aCwgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVyciwgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWVyciAmJiBzcHJpdGVGcmFtZSAmJiBzcHJpdGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICBzcHJpdGUuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOWKoOi9veWksei0pe+8jOS9v+eUqOm7mOiupOWktOWDj1xuICAgICAgICAgICAgICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcIlVJL2hlYWRpbWFnZS9hdmF0YXJfMVwiLCBjYy5TcHJpdGVGcmFtZSwgZnVuY3Rpb24oZXJyMiwgZmFsbGJhY2tTcHJpdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZXJyMiAmJiBmYWxsYmFja1Nwcml0ZSAmJiBzcHJpdGUuaXNWYWxpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwcml0ZS5zcHJpdGVGcmFtZSA9IGZhbGxiYWNrU3ByaXRlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmsqHmnInlpLTlg49VUkzvvIzkvb/nlKjpu5jorqTlpLTlg49cbiAgICAgICAgdmFyIGRlZmF1bHRJbmRleCA9IGlzUm9ib3QgPyAoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMykgKyAxKSA6IDFcbiAgICAgICAgdmFyIGRlZmF1bHRQYXRoID0gXCJVSS9oZWFkaW1hZ2UvYXZhdGFyX1wiICsgZGVmYXVsdEluZGV4XG4gICAgICAgIGNjLnJlc291cmNlcy5sb2FkKGRlZmF1bHRQYXRoLCBjYy5TcHJpdGVGcmFtZSwgZnVuY3Rpb24oZXJyLCBzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgaWYgKCFlcnIgJiYgc3ByaXRlRnJhbWUgJiYgc3ByaXRlLmlzVmFsaWQpIHtcbiAgICAgICAgICAgICAgICBzcHJpdGUuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0sXG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8g8J+Up+OAkOaJmOeuoeOAkeeUqOaIt+a0u+WKqOajgOa1iyAtIOinpuWPkeWPlua2iOaJmOeuoVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmiZjnrqHjgJHorr7nva7nlKjmiLfmtLvliqjmo4DmtYtcbiAgICAgKiDlvZPnlKjmiLflnKjlsY/luZXkuIrnp7vliqjmiJbngrnlh7vml7bvvIzop6blj5Hlj5bmtojmiZjnrqHor7fmsYJcbiAgICAgKi9cbiAgICBfc2V0dXBVc2VyQWN0aXZpdHlEZXRlY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgXG4gICAgICAgIC8vIOebkeWQrOWFqOWxgOinpuaRuOW8gOWni+S6i+S7tlxuICAgICAgICB0aGlzLm5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfU1RBUlQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBzZWxmLl9vblVzZXJBY3Rpdml0eShcInRvdWNoX3N0YXJ0XCIpXG4gICAgICAgIH0sIHRoaXMpXG4gICAgICAgIFxuICAgICAgICAvLyDnm5HlkKzlhajlsYDop6bmkbjnp7vliqjkuovku7ZcbiAgICAgICAgdGhpcy5ub2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX01PVkUsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBzZWxmLl9vblVzZXJBY3Rpdml0eShcInRvdWNoX21vdmVcIilcbiAgICAgICAgfSwgdGhpcylcbiAgICAgICAgXG4gICAgICAgIC8vIOebkeWQrOWFqOWxgOm8oOagh+enu+WKqOS6i+S7tu+8iFBD56uv77yJXG4gICAgICAgIHRoaXMubm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5NT1VTRV9NT1ZFLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgc2VsZi5fb25Vc2VyQWN0aXZpdHkoXCJtb3VzZV9tb3ZlXCIpXG4gICAgICAgIH0sIHRoaXMpXG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIvCflpDvuI8gW+eUqOaIt+a0u+WKqOajgOa1i10g5bey5ZCv5YqoXCIpXG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5omY566h44CR55So5oi35rS75Yqo5Zue6LCDXG4gICAgICog6IqC5rWB5aSE55CG77yM6YG/5YWN6aKR57mB5Y+R6YCB6K+35rGCXG4gICAgICog8J+Up+OAkOS8mOWMluOAkeWPquimgeeUqOaIt+WcqOa4uOaIj+S4rea0u+WKqO+8jOWwseWPkemAgeWPlua2iOaJmOeuoeivt+axgu+8jOiuqeacjeWKoeerr+WIpOaWreaYr+WQpumcgOimgeWPlua2iFxuICAgICAqL1xuICAgIF9vblVzZXJBY3Rpdml0eTogZnVuY3Rpb24oYWN0aXZpdHlUeXBlKSB7XG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpXG4gICAgICAgIFxuICAgICAgICAvLyDoioLmtYHvvJox56eS5YaF5Y+q5aSE55CG5LiA5qyhXG4gICAgICAgIGlmIChub3cgLSB0aGlzLl9sYXN0VXNlckFjdGl2aXR5VGltZSA8IHRoaXMuX3VzZXJBY3Rpdml0eVRocm90dGxlKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9sYXN0VXNlckFjdGl2aXR5VGltZSA9IG5vd1xuICAgICAgICBcbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm5aSE5LqO5ri45oiP6L+b6KGM5LitXG4gICAgICAgIGlmICh0aGlzLl9nYW1lUGhhc2UgIT09IFwiYmlkZGluZ1wiICYmIHRoaXMuX2dhbWVQaGFzZSAhPT0gXCJwbGF5aW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWxcbiAgICAgICAgaWYgKCFteWdsb2JhbCB8fCAhbXlnbG9iYWwuc29ja2V0KSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS8mOWMluOAkeS4jeWGjeajgOafpeacrOWcsOaJmOeuoeeKtuaAge+8jOebtOaOpeWPkemAgeWPlua2iOaJmOeuoeivt+axglxuICAgICAgICAvLyDmnI3liqHnq6/kvJroh6rlt7HliKTmlq3njqnlrrbmmK/lkKblpITkuo7miZjnrqHnirbmgIHvvIzlpoLmnpzmmK/liJnlj5bmtojmiZjnrqFcbiAgICAgICAgY29uc29sZS5sb2coXCLwn5aQ77iPIFvnlKjmiLfmtLvliqhdIOajgOa1i+WIsOeUqOaIt+a0u+WKqDpcIiwgYWN0aXZpdHlUeXBlLCBcIu+8jOWPkemAgeWPlua2iOaJmOeuoeivt+axglwiKVxuICAgICAgICBcbiAgICAgICAgLy8g5Y+R6YCB5Y+W5raI5omY566h6K+35rGCXG4gICAgICAgIGlmIChteWdsb2JhbC5zb2NrZXQuY2FuY2VsVHJ1c3RlZSkge1xuICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LmNhbmNlbFRydXN0ZWUoKVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5omY566h44CR5qOA5p+l5b2T5YmN546p5a625piv5ZCm5aSE5LqO5omY566h54q25oCBXG4gICAgICog5rOo5oSP77ya5q2k5pa55rOV5bey5LiN5YaN5L2/55So77yM5L+d55WZ5LuF5L6b5Y+C6ICDXG4gICAgICovXG4gICAgX2lzQ3VycmVudFBsYXllclRydXN0ZWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDwn5Sn44CQ5LyY5YyW44CR55u05o6l5qOA5p+l5pys5Zyw5omY566h54q25oCBXG4gICAgICAgIGlmICh0aGlzLl9pc0xvY2FsVHJ1c3RlZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIGlmICghbXlnbG9iYWwgfHwgIW15Z2xvYmFsLnBsYXllckRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmn6Xmib7lvZPliY3njqnlrrbnmoQgcGxheWVyX25vZGVcbiAgICAgICAgdmFyIGdhbWVTY2VuZU5vZGUgPSB0aGlzLm5vZGUucGFyZW50XG4gICAgICAgIGlmICghZ2FtZVNjZW5lTm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBteVBsYXllcklkID0gbXlnbG9iYWwuc29ja2V0LmdldFBsYXllckluZm8oKS5pZCB8fCBcbiAgICAgICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLnNlcnZlclBsYXllcklkIHx8IFxuICAgICAgICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEXG4gICAgICAgIFxuICAgICAgICAvLyDpgY3ljoYgcGxheWVyTm9kZUxpc3Qg5p+l5om+5b2T5YmN546p5a62XG4gICAgICAgIHZhciBwbGF5ZXJOb2RlTGlzdCA9IGdhbWVTY2VuZU5vZGUuZ2V0Q29tcG9uZW50KFwiZ2FtZVNjZW5lXCIpXG4gICAgICAgIGlmIChwbGF5ZXJOb2RlTGlzdCAmJiBwbGF5ZXJOb2RlTGlzdC5wbGF5ZXJOb2RlTGlzdCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwbGF5ZXJOb2RlTGlzdC5wbGF5ZXJOb2RlTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBub2RlID0gcGxheWVyTm9kZUxpc3QucGxheWVyTm9kZUxpc3RbaV1cbiAgICAgICAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2NyaXB0ID0gbm9kZS5nZXRDb21wb25lbnQoXCJwbGF5ZXJfbm9kZVwiKVxuICAgICAgICAgICAgICAgICAgICBpZiAoc2NyaXB0ICYmIFN0cmluZyhzY3JpcHQuYWNjb3VudGlkKSA9PT0gU3RyaW5nKG15UGxheWVySWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NyaXB0Ll9pc1RydXN0ZWUgfHwgZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxufSk7XG4iXX0=