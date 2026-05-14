"use strict";
cc._RF.push(module, '2afe8rz92BOl7CbQfKSCoLh', 'card');
// scripts/gameScene/prefabs/card.js

"use strict";

// 使用全局变量，不使用 require
// 【彻底修复版本】基于精灵图集实际图片的映射表
//
// 🔧【重要】正确的精灵映射表（根据实际图片验证）：
// - card_53 = 红色JOKER = 大王
// - card_54 = 黑色JOKER = 小王
// - card_55 = 背面
// - card_1 ~ card_13 = 方块 A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K
// - card_14 ~ card_26 = 梅花 A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K
// - card_27 ~ card_39 = 红心 A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K
// - card_40 ~ card_52 = 黑桃 A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K
//
// 服务端数据格式：
// - suit: 0=♠(黑桃), 1=♥(红心), 2=♣(梅花), 3=♦(方块), 4=王
// - rank: 3-14=3到A, 15=2, 16=小王, 17=大王
var RoomState = window.RoomState || {}; // 🔧【新增】缓存已加载的精灵图集

var _cachedAtlas = null;
cc.Class({
  "extends": cc.Component,
  properties: {
    cards_sprite_atlas: cc.SpriteAtlas
  },
  onLoad: function onLoad() {
    this.flag = false;
    this.offset_y = 20; // 🔧【关键修复】如果 cards_sprite_atlas 为空，尝试从缓存或动态加载

    if (!this.cards_sprite_atlas) {
      this._loadCardAtlas();
    }

    this.node.on("reset_card_flag", function (event) {
      if (this.flag == true) {
        this.flag = false;
        this.node.y -= this.offset_y;
      }
    }.bind(this));
  },

  /**
   * 🔧【新增】动态加载卡牌精灵图集
   */
  _loadCardAtlas: function _loadCardAtlas() {
    var self = this; // 优先使用全局缓存

    if (window._cardAtlas && window._cardAtlasLoaded) {
      this.cards_sprite_atlas = window._cardAtlas;
      _cachedAtlas = window._cardAtlas;
      return;
    } // 使用本地缓存


    if (_cachedAtlas) {
      this.cards_sprite_atlas = _cachedAtlas;
      return;
    } // 🔧【修复】正确的精灵图集路径：resources/UI/card/card


    cc.resources.load("UI/card/card", cc.SpriteAtlas, function (err, atlas) {
      if (err) {
        console.error("🃏 [_loadCardAtlas] 加载卡牌图集失败:", err);
        return;
      }

      _cachedAtlas = atlas;
      window._cardAtlas = atlas;
      window._cardAtlasLoaded = true;
      self.cards_sprite_atlas = atlas;
      console.log("🃏 [_loadCardAtlas] 卡牌图集加载成功");
    });
  },
  start: function start() {},
  init_data: function init_data(data) {},
  setTouchEvent: function setTouchEvent() {
    var myglobal = window.myglobal;
    if (!myglobal || !myglobal.playerData) return;

    if (this.accountid == myglobal.playerData.accountID) {
      this.node.on(cc.Node.EventType.TOUCH_START, function (event) {
        // 🔧【修复】向上查找 gameScene 节点
        var gameScene_node = this._findGameSceneNode();

        if (!gameScene_node) {
          console.warn("🃏 [card] 未找到 gameScene 节点");
          return;
        }

        var gameScene = gameScene_node.getComponent("gameScene");

        if (!gameScene) {
          console.warn("🃏 [card] 未找到 gameScene 组件");
          return;
        }

        if (gameScene.roomstate == RoomState.ROOM_PLAYING) {
          if (this.flag == false) {
            this.flag = true;
            this.node.y += this.offset_y; // 🔧【修复】使用唯一标识符 {suit, rank} 选牌

            gameScene_node.emit("choose_card_event", {
              cardid: this.card_id,
              card_data: this.card_data
            });
          } else {
            this.flag = false;
            this.node.y -= this.offset_y; // 🔧【修复】使用唯一标识符 {suit, rank} 取消选牌

            gameScene_node.emit("unchoose_card_event", this.card_id);
          }
        }
      }.bind(this));
    }
  },

  /**
   * 🔧【新增】向上查找 gameScene 节点
   */
  _findGameSceneNode: function _findGameSceneNode() {
    var node = this.node;

    while (node) {
      var gameScene = node.getComponent("gameScene");

      if (gameScene) {
        return node;
      }

      node = node.parent;
    }

    return null;
  },

  /**
   * 【核心】显示卡牌
   * @param {Object} card - 服务端原始卡牌数据
   */
  showCards: function showCards(card, accountid) {
    if (!card) {
      console.error("🃏 [showCards] 卡牌数据为空");
      return;
    }

    this.card_data = card; // 🔧【修复】使用 suit+rank 组合作为唯一标识符，而不是只用 rank
    // 这样可以正确区分相同牌面值但不同花色的牌（如 ♠J 和 ♥J）

    this.card_id = {
      suit: card.suit,
      rank: card.rank
    };

    if (accountid) {
      this.accountid = accountid;
    }

    var spriteKey = this._getSpriteKey(card);

    if (!spriteKey) {
      console.error("🃏 [showCards] 无法识别的牌数据:", JSON.stringify(card));
      return;
    }

    var suitName = this._getSuitName(card.suit);

    var rankName = this._getRankName(card.rank); // 🔧【关键修复】检查 cards_sprite_atlas 是否可用


    if (!this.cards_sprite_atlas) {
      // 优先使用全局缓存
      if (window._cardAtlas && window._cardAtlasLoaded) {
        this.cards_sprite_atlas = window._cardAtlas;
        _cachedAtlas = window._cardAtlas;
      } else if (_cachedAtlas) {
        this.cards_sprite_atlas = _cachedAtlas;
      } else {
        console.error("🃏 [showCards] 卡牌精灵图集未加载，无法显示卡牌"); // 尝试异步加载，稍后重试

        var self = this;

        this._loadCardAtlas(); // 延迟重试


        this.scheduleOnce(function () {
          if (self.cards_sprite_atlas) {
            self._doShowCard(spriteKey);
          }
        }, 0.1);
        return;
      }
    }

    this._doShowCard(spriteKey);
  },

  /**
   * 🔧【新增】实际显示卡牌
   */
  _doShowCard: function _doShowCard(spriteKey) {
    // 🔧【修复】尝试带 .png 和不带 .png 两种格式
    var spriteFrame = this.cards_sprite_atlas.getSpriteFrame(spriteKey);

    if (!spriteFrame) {
      // 尝试带 .png 扩展名
      spriteFrame = this.cards_sprite_atlas.getSpriteFrame(spriteKey + ".png");
    }

    if (spriteFrame) {
      this.node.getComponent(cc.Sprite).spriteFrame = spriteFrame;
      this.setTouchEvent();
    } else {
      console.error("🃏 [showCards] 找不到精灵帧:", spriteKey); // 打印所有可用的精灵帧名称，帮助调试

      if (this.cards_sprite_atlas && this.cards_sprite_atlas.getSpriteFrames) {
        var frames = this.cards_sprite_atlas.getSpriteFrames();

        if (frames && frames.length > 0) {
          console.log("🃏 可用的精灵帧:", frames.slice(0, 10).map(function (f) {
            return f.name;
          }));
        }
      }
    }
  },
  _getSuitName: function _getSuitName(suit) {
    var suitNames = {
      0: "♠",
      1: "♥",
      2: "♣",
      3: "♦",
      4: "王"
    };
    return suitNames[suit] || "?";
  },
  _getRankName: function _getRankName(rank) {
    if (rank === 16) return "小王";
    if (rank === 17) return "大王";
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
    return rankNames[rank] || String(rank);
  },

  /**
   * 【核心】根据服务端数据计算精灵键名
   *
   * 🔧【已验证】正确的精灵映射表（根据实际图片）：
   * - card_53 = 红色JOKER = 大王
   * - card_54 = 黑色JOKER = 小王
   * - card_55 = 背面
   * - card_1 ~ card_13 = 方块 A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K
   * - card_14 ~ card_26 = 梅花 A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K
   * - card_27 ~ card_39 = 红心 A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K
   * - card_40 ~ card_52 = 黑桃 A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K
   *
   * 服务端数据格式：
   * - suit: 0=♠(黑桃), 1=♥(红心), 2=♣(梅花), 3=♦(方块), 4=王
   * - rank: 3-14=3到A, 15=2, 16=小王, 17=大王
   *
   * @param {Object} card - 服务端卡牌数据
   * @returns {String} 精灵键名
   */
  _getSpriteKey: function _getSpriteKey(card) {
    var suit = card.suit;
    var rank = card.rank; // 🔧【修复】大小王映射 - 已更正
    // 精灵图集中：
    // - card_53 = 红色JOKER = 大王
    // - card_54 = 黑色JOKER = 小王
    // 服务端数据：
    // - rank = 16 = 小王
    // - rank = 17 = 大王

    if (rank === 16) return "card_54"; // 小王 → 黑色JOKER

    if (rank === 17) return "card_53"; // 大王 → 红色JOKER
    // 验证数据有效性

    if (suit < 0 || suit > 3 || rank < 3 || rank > 15) {
      console.error("🃏 [_getSpriteKey] 无效的牌数据: suit=" + suit + ", rank=" + rank);
      return null;
    } // 将服务端rank转换为精灵索引（A=0, 2=1, 3=2, ..., K=12）


    var pointIndex;

    if (rank === 14) {
      pointIndex = 0; // A
    } else if (rank === 15) {
      pointIndex = 1; // 2
    } else {
      pointIndex = rank - 1; // 3-13 -> 2-12
    } // 根据花色计算基础偏移
    // 服务端: suit 0=♠(黑桃), 1=♥(红心), 2=♣(梅花), 3=♦(方块)
    // 精灵: card_1~13=方块, card_14~26=梅花, card_27~39=红心, card_40~52=黑桃


    var baseOffset;

    switch (suit) {
      case 3:
        baseOffset = 0;
        break;
      // 方块: card_1 ~ card_13

      case 2:
        baseOffset = 13;
        break;
      // 梅花: card_14 ~ card_26

      case 1:
        baseOffset = 26;
        break;
      // 红心: card_27 ~ card_39

      case 0:
        baseOffset = 39;
        break;
      // 黑桃: card_40 ~ card_52

      default:
        baseOffset = 0;
    }

    var cardIndex = baseOffset + pointIndex + 1;
    return "card_" + cardIndex;
  }
});

cc._RF.pop();