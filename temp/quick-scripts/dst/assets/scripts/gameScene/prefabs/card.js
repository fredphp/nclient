
                (function() {
                    var nodeEnv = typeof require !== 'undefined' && typeof process !== 'undefined';
                    var __module = nodeEnv ? module : {exports:{}};
                    var __filename = 'preview-scripts/assets/scripts/gameScene/prefabs/card.js';
                    var __require = nodeEnv ? function (request) {
                        return cc.require(request);
                    } : function (request) {
                        return __quick_compile_project__.require(request, __filename);
                    };
                    function __define (exports, require, module) {
                        if (!nodeEnv) {__quick_compile_project__.registerModule(__filename, module);}"use strict";
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
var RoomState = window.RoomState || {};
cc.Class({
  "extends": cc.Component,
  properties: {
    cards_sprite_atlas: cc.SpriteAtlas
  },
  onLoad: function onLoad() {
    this.flag = false;
    this.offset_y = 20;
    this._touchEventAdded = false; // 🔧【修复】标记是否已添加触摸监听器，防止重复添加

    this.node.on("reset_card_flag", function (event) {
      if (this.flag == true) {
        this.flag = false;
        this.node.y -= this.offset_y;
      }
    }.bind(this));
  },
  start: function start() {},
  init_data: function init_data(data) {},
  setTouchEvent: function setTouchEvent() {
    var myglobal = window.myglobal;
    if (!myglobal || !myglobal.playerData) return; // 🔧【修复】防止重复添加触摸监听器
    // 每次调用 showCards 时都会调用此函数，但只应添加一次监听器

    if (this._touchEventAdded) {
      return;
    }

    if (this.accountid == myglobal.playerData.accountID) {
      this._touchEventAdded = true; // 标记已添加

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

    var rankName = this._getRankName(card.rank); // 🔧【修复】获取卡牌图集


    var atlas = this.cards_sprite_atlas || window._cardAtlas; // 🔧【关键修复】如果图集未加载，尝试同步加载（阻塞式）

    if (!atlas) {
      console.warn("🃏 [showCards] 图集未预加载，尝试同步加载..."); // 同步加载图集（使用 cc.loader.get 或直接加载）

      var loadedAtlas = this._loadAtlasSync();

      if (loadedAtlas) {
        atlas = loadedAtlas;
        window._cardAtlas = atlas;
        window._cardAtlasLoaded = true;
      } else {
        console.error("🃏 [showCards] 无法加载卡牌图集！"); // 设置一个默认的红色方块背景，防止完全看不到牌

        return;
      }
    }

    var spriteFrame = atlas.getSpriteFrame(spriteKey);

    if (spriteFrame) {
      this.node.getComponent(cc.Sprite).spriteFrame = spriteFrame;
      this.setTouchEvent();
    } else {
      console.error("🃏 [showCards] 找不到精灵帧:", spriteKey);
    }
  },

  /**
   * 🔧【新增】同步加载卡牌图集
   * 在预加载失败时作为兜底方案
   */
  _loadAtlasSync: function _loadAtlasSync() {
    // 检查是否已经在加载队列中
    if (window._cardAtlasLoading) {
      return null;
    } // 尝试从资源缓存中获取


    var cache = cc.loader.getRes("UI/card/card", cc.SpriteAtlas);

    if (cache) {
      console.log("🃏 [_loadAtlasSync] 从缓存获取图集成功");
      return cache;
    } // 标记正在加载


    window._cardAtlasLoading = true; // 异步加载（这次调用会失败，但下次就能从缓存获取）

    cc.resources.load("UI/card/card", cc.SpriteAtlas, function (err, atlas) {
      window._cardAtlasLoading = false;

      if (err) {
        console.error("🃏 [_loadAtlasSync] 加载失败:", err);
        return;
      }

      window._cardAtlas = atlas;
      window._cardAtlasLoaded = true;
      console.log("🃏 [_loadAtlasSync] 后台加载成功");
    });
    return null;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2dhbWVTY2VuZS9wcmVmYWJzL2NhcmQuanMiXSwibmFtZXMiOlsiUm9vbVN0YXRlIiwid2luZG93IiwiY2MiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJjYXJkc19zcHJpdGVfYXRsYXMiLCJTcHJpdGVBdGxhcyIsIm9uTG9hZCIsImZsYWciLCJvZmZzZXRfeSIsIl90b3VjaEV2ZW50QWRkZWQiLCJub2RlIiwib24iLCJldmVudCIsInkiLCJiaW5kIiwic3RhcnQiLCJpbml0X2RhdGEiLCJkYXRhIiwic2V0VG91Y2hFdmVudCIsIm15Z2xvYmFsIiwicGxheWVyRGF0YSIsImFjY291bnRpZCIsImFjY291bnRJRCIsIk5vZGUiLCJFdmVudFR5cGUiLCJUT1VDSF9TVEFSVCIsImdhbWVTY2VuZV9ub2RlIiwiX2ZpbmRHYW1lU2NlbmVOb2RlIiwiY29uc29sZSIsIndhcm4iLCJnYW1lU2NlbmUiLCJnZXRDb21wb25lbnQiLCJyb29tc3RhdGUiLCJST09NX1BMQVlJTkciLCJlbWl0IiwiY2FyZGlkIiwiY2FyZF9pZCIsImNhcmRfZGF0YSIsInBhcmVudCIsInNob3dDYXJkcyIsImNhcmQiLCJlcnJvciIsInN1aXQiLCJyYW5rIiwic3ByaXRlS2V5IiwiX2dldFNwcml0ZUtleSIsIkpTT04iLCJzdHJpbmdpZnkiLCJzdWl0TmFtZSIsIl9nZXRTdWl0TmFtZSIsInJhbmtOYW1lIiwiX2dldFJhbmtOYW1lIiwiYXRsYXMiLCJfY2FyZEF0bGFzIiwibG9hZGVkQXRsYXMiLCJfbG9hZEF0bGFzU3luYyIsIl9jYXJkQXRsYXNMb2FkZWQiLCJzcHJpdGVGcmFtZSIsImdldFNwcml0ZUZyYW1lIiwiU3ByaXRlIiwiX2NhcmRBdGxhc0xvYWRpbmciLCJjYWNoZSIsImxvYWRlciIsImdldFJlcyIsImxvZyIsInJlc291cmNlcyIsImxvYWQiLCJlcnIiLCJzdWl0TmFtZXMiLCJyYW5rTmFtZXMiLCJTdHJpbmciLCJwb2ludEluZGV4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O0lBQ3BCLENBRkQsTUFFTyxJQUFJNUIsSUFBSSxLQUFLLEVBQWIsRUFBaUI7TUFDcEI0QixVQUFVLEdBQUcsQ0FBYixDQURvQixDQUNIO0lBQ3BCLENBRk0sTUFFQTtNQUNIQSxVQUFVLEdBQUc1QixJQUFJLEdBQUcsQ0FBcEIsQ0FERyxDQUNvQjtJQUMxQixDQTVCeUIsQ0E4QjFCO0lBQ0E7SUFDQTs7O0lBQ0EsSUFBSTZCLFVBQUo7O0lBQ0EsUUFBUTlCLElBQVI7TUFDSSxLQUFLLENBQUw7UUFBUThCLFVBQVUsR0FBRyxDQUFiO1FBQWdCO01BQVE7O01BQ2hDLEtBQUssQ0FBTDtRQUFRQSxVQUFVLEdBQUcsRUFBYjtRQUFpQjtNQUFPOztNQUNoQyxLQUFLLENBQUw7UUFBUUEsVUFBVSxHQUFHLEVBQWI7UUFBaUI7TUFBTzs7TUFDaEMsS0FBSyxDQUFMO1FBQVFBLFVBQVUsR0FBRyxFQUFiO1FBQWlCO01BQU87O01BQ2hDO1FBQVNBLFVBQVUsR0FBRyxDQUFiO0lBTGI7O0lBUUEsSUFBSUMsU0FBUyxHQUFHRCxVQUFVLEdBQUdELFVBQWIsR0FBMEIsQ0FBMUM7SUFFQSxPQUFPLFVBQVVFLFNBQWpCO0VBQ0g7QUFwUUksQ0FBVCIsInNvdXJjZVJvb3QiOiIvIiwic291cmNlc0NvbnRlbnQiOlsiLy8g5L2/55So5YWo5bGA5Y+Y6YeP77yM5LiN5L2/55SoIHJlcXVpcmVcbi8vIOOAkOW9u+W6leS/ruWkjeeJiOacrOOAkeWfuuS6jueyvueBteWbvumbhuWunumZheWbvueJh+eahOaYoOWwhOihqFxuLy9cbi8vIPCflKfjgJDph43opoHjgJHmraPnoa7nmoTnsr7ngbXmmKDlsITooajvvIjmoLnmja7lrp7pmYXlm77niYfpqozor4HvvInvvJpcbi8vIC0gY2FyZF81MyA9IOe6ouiJskpPS0VSID0g5aSn546LXG4vLyAtIGNhcmRfNTQgPSDpu5HoibJKT0tFUiA9IOWwj+eOi1xuLy8gLSBjYXJkXzU1ID0g6IOM6Z2iXG4vLyAtIGNhcmRfMSB+IGNhcmRfMTMgPSDmlrnlnZcgQSwgMiwgMywgNCwgNSwgNiwgNywgOCwgOSwgMTAsIEosIFEsIEtcbi8vIC0gY2FyZF8xNCB+IGNhcmRfMjYgPSDmooXoirEgQSwgMiwgMywgNCwgNSwgNiwgNywgOCwgOSwgMTAsIEosIFEsIEtcbi8vIC0gY2FyZF8yNyB+IGNhcmRfMzkgPSDnuqLlv4MgQSwgMiwgMywgNCwgNSwgNiwgNywgOCwgOSwgMTAsIEosIFEsIEtcbi8vIC0gY2FyZF80MCB+IGNhcmRfNTIgPSDpu5HmoYMgQSwgMiwgMywgNCwgNSwgNiwgNywgOCwgOSwgMTAsIEosIFEsIEtcbi8vXG4vLyDmnI3liqHnq6/mlbDmja7moLzlvI/vvJpcbi8vIC0gc3VpdDogMD3imaAo6buR5qGDKSwgMT3imaUo57qi5b+DKSwgMj3imaMo5qKF6IqxKSwgMz3imaYo5pa55Z2XKSwgND3njotcbi8vIC0gcmFuazogMy0xND0z5YiwQSwgMTU9MiwgMTY95bCP546LLCAxNz3lpKfnjotcblxudmFyIFJvb21TdGF0ZSA9IHdpbmRvdy5Sb29tU3RhdGUgfHwge31cblxuY2MuQ2xhc3Moe1xuICAgIGV4dGVuZHM6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgY2FyZHNfc3ByaXRlX2F0bGFzOiBjYy5TcHJpdGVBdGxhcyxcbiAgICB9LFxuXG4gICAgb25Mb2FkICgpIHtcbiAgICAgICAgdGhpcy5mbGFnID0gZmFsc2VcbiAgICAgICAgdGhpcy5vZmZzZXRfeSA9IDIwXG4gICAgICAgIHRoaXMuX3RvdWNoRXZlbnRBZGRlZCA9IGZhbHNlICAvLyDwn5Sn44CQ5L+u5aSN44CR5qCH6K6w5piv5ZCm5bey5re75Yqg6Kem5pG455uR5ZCs5Zmo77yM6Ziy5q2i6YeN5aSN5re75YqgXG5cbiAgICAgICAgdGhpcy5ub2RlLm9uKFwicmVzZXRfY2FyZF9mbGFnXCIsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgIGlmKHRoaXMuZmxhZyA9PSB0cnVlKXtcbiAgICAgICAgICAgICAgICB0aGlzLmZsYWcgPSBmYWxzZVxuICAgICAgICAgICAgICAgIHRoaXMubm9kZS55IC09IHRoaXMub2Zmc2V0X3lcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKVxuICAgIH0sXG5cbiAgICBzdGFydCAoKSB7fSxcblxuICAgIGluaXRfZGF0YSAoZGF0YSkge30sXG5cbiAgICBzZXRUb3VjaEV2ZW50ICgpIHtcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsXG4gICAgICAgIGlmICghbXlnbG9iYWwgfHwgIW15Z2xvYmFsLnBsYXllckRhdGEpIHJldHVyblxuXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHpmLLmraLph43lpI3mt7vliqDop6bmkbjnm5HlkKzlmahcbiAgICAgICAgLy8g5q+P5qyh6LCD55SoIHNob3dDYXJkcyDml7bpg73kvJrosIPnlKjmraTlh73mlbDvvIzkvYblj6rlupTmt7vliqDkuIDmrKHnm5HlkKzlmahcbiAgICAgICAgaWYgKHRoaXMuX3RvdWNoRXZlbnRBZGRlZCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5hY2NvdW50aWQgPT0gbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SUQpIHtcbiAgICAgICAgICAgIHRoaXMuX3RvdWNoRXZlbnRBZGRlZCA9IHRydWUgIC8vIOagh+iusOW3sua3u+WKoFxuXG4gICAgICAgICAgICB0aGlzLm5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfU1RBUlQsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5ZCR5LiK5p+l5om+IGdhbWVTY2VuZSDoioLngrlcbiAgICAgICAgICAgICAgICB2YXIgZ2FtZVNjZW5lX25vZGUgPSB0aGlzLl9maW5kR2FtZVNjZW5lTm9kZSgpXG4gICAgICAgICAgICAgICAgaWYgKCFnYW1lU2NlbmVfbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn4OPIFtjYXJkXSDmnKrmib7liLAgZ2FtZVNjZW5lIOiKgueCuVwiKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgZ2FtZVNjZW5lID0gZ2FtZVNjZW5lX25vZGUuZ2V0Q29tcG9uZW50KFwiZ2FtZVNjZW5lXCIpXG4gICAgICAgICAgICAgICAgaWYgKCFnYW1lU2NlbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+DjyBbY2FyZF0g5pyq5om+5YiwIGdhbWVTY2VuZSDnu4Tku7ZcIilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGdhbWVTY2VuZS5yb29tc3RhdGUgPT0gUm9vbVN0YXRlLlJPT01fUExBWUlORykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5mbGFnID09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZsYWcgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5vZGUueSArPSB0aGlzLm9mZnNldF95XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55So5ZSv5LiA5qCH6K+G56ymIHtzdWl0LCByYW5rfSDpgInniYxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVTY2VuZV9ub2RlLmVtaXQoXCJjaG9vc2VfY2FyZF9ldmVudFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FyZGlkOiB0aGlzLmNhcmRfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FyZF9kYXRhOiB0aGlzLmNhcmRfZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZsYWcgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ub2RlLnkgLT0gdGhpcy5vZmZzZXRfeVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeS9v+eUqOWUr+S4gOagh+ivhuespiB7c3VpdCwgcmFua30g5Y+W5raI6YCJ54mMXG4gICAgICAgICAgICAgICAgICAgICAgICBnYW1lU2NlbmVfbm9kZS5lbWl0KFwidW5jaG9vc2VfY2FyZF9ldmVudFwiLCB0aGlzLmNhcmRfaWQpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeWQkeS4iuafpeaJviBnYW1lU2NlbmUg6IqC54K5XG4gICAgICovXG4gICAgX2ZpbmRHYW1lU2NlbmVOb2RlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLm5vZGVcbiAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgIHZhciBnYW1lU2NlbmUgPSBub2RlLmdldENvbXBvbmVudChcImdhbWVTY2VuZVwiKVxuICAgICAgICAgICAgaWYgKGdhbWVTY2VuZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBub2RlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlID0gbm9kZS5wYXJlbnRcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDjgJDmoLjlv4PjgJHmmL7npLrljaHniYxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY2FyZCAtIOacjeWKoeerr+WOn+Wni+WNoeeJjOaVsOaNrlxuICAgICAqL1xuICAgIHNob3dDYXJkcyAoY2FyZCwgYWNjb3VudGlkKSB7XG4gICAgICAgIGlmICghY2FyZCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfg48gW3Nob3dDYXJkc10g5Y2h54mM5pWw5o2u5Li656m6XCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FyZF9kYXRhID0gY2FyZFxuICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55SoIHN1aXQrcmFuayDnu4TlkIjkvZzkuLrllK/kuIDmoIfor4bnrKbvvIzogIzkuI3mmK/lj6rnlKggcmFua1xuICAgICAgICAvLyDov5nmoLflj6/ku6XmraPnoa7ljLrliIbnm7jlkIzniYzpnaLlgLzkvYbkuI3lkIzoirHoibLnmoTniYzvvIjlpoIg4pmgSiDlkowg4pmlSu+8iVxuICAgICAgICB0aGlzLmNhcmRfaWQgPSB7XG4gICAgICAgICAgICBzdWl0OiBjYXJkLnN1aXQsXG4gICAgICAgICAgICByYW5rOiBjYXJkLnJhbmtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhY2NvdW50aWQpIHtcbiAgICAgICAgICAgIHRoaXMuYWNjb3VudGlkID0gYWNjb3VudGlkXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3ByaXRlS2V5ID0gdGhpcy5fZ2V0U3ByaXRlS2V5KGNhcmQpXG5cbiAgICAgICAgaWYgKCFzcHJpdGVLZXkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn4OPIFtzaG93Q2FyZHNdIOaXoOazleivhuWIq+eahOeJjOaVsOaNrjpcIiwgSlNPTi5zdHJpbmdpZnkoY2FyZCkpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdWl0TmFtZSA9IHRoaXMuX2dldFN1aXROYW1lKGNhcmQuc3VpdClcbiAgICAgICAgdmFyIHJhbmtOYW1lID0gdGhpcy5fZ2V0UmFua05hbWUoY2FyZC5yYW5rKVxuXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHojrflj5bljaHniYzlm77pm4ZcbiAgICAgICAgdmFyIGF0bGFzID0gdGhpcy5jYXJkc19zcHJpdGVfYXRsYXMgfHwgd2luZG93Ll9jYXJkQXRsYXNcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHlpoLmnpzlm77pm4bmnKrliqDovb3vvIzlsJ3or5XlkIzmraXliqDovb3vvIjpmLvloZ7lvI/vvIlcbiAgICAgICAgaWYgKCFhdGxhcykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+DjyBbc2hvd0NhcmRzXSDlm77pm4bmnKrpooTliqDovb3vvIzlsJ3or5XlkIzmraXliqDovb0uLi5cIilcbiAgICAgICAgICAgIC8vIOWQjOatpeWKoOi9veWbvumbhu+8iOS9v+eUqCBjYy5sb2FkZXIuZ2V0IOaIluebtOaOpeWKoOi9ve+8iVxuICAgICAgICAgICAgdmFyIGxvYWRlZEF0bGFzID0gdGhpcy5fbG9hZEF0bGFzU3luYygpXG4gICAgICAgICAgICBpZiAobG9hZGVkQXRsYXMpIHtcbiAgICAgICAgICAgICAgICBhdGxhcyA9IGxvYWRlZEF0bGFzXG4gICAgICAgICAgICAgICAgd2luZG93Ll9jYXJkQXRsYXMgPSBhdGxhc1xuICAgICAgICAgICAgICAgIHdpbmRvdy5fY2FyZEF0bGFzTG9hZGVkID0gdHJ1ZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+DjyBbc2hvd0NhcmRzXSDml6Dms5XliqDovb3ljaHniYzlm77pm4bvvIFcIilcbiAgICAgICAgICAgICAgICAvLyDorr7nva7kuIDkuKrpu5jorqTnmoTnuqLoibLmlrnlnZfog4zmma/vvIzpmLLmraLlrozlhajnnIvkuI3liLDniYxcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzcHJpdGVGcmFtZSA9IGF0bGFzLmdldFNwcml0ZUZyYW1lKHNwcml0ZUtleSlcbiAgICAgICAgaWYgKHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGUuZ2V0Q29tcG9uZW50KGNjLlNwcml0ZSkuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZVxuICAgICAgICAgICAgdGhpcy5zZXRUb3VjaEV2ZW50KClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn4OPIFtzaG93Q2FyZHNdIOaJvuS4jeWIsOeyvueBteW4pzpcIiwgc3ByaXRlS2V5KVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5ZCM5q2l5Yqg6L295Y2h54mM5Zu+6ZuGXG4gICAgICog5Zyo6aKE5Yqg6L295aSx6LSl5pe25L2c5Li65YWc5bqV5pa55qGIXG4gICAgICovXG4gICAgX2xvYWRBdGxhc1N5bmM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyDmo4Dmn6XmmK/lkKblt7Lnu4/lnKjliqDovb3pmJ/liJfkuK1cbiAgICAgICAgaWYgKHdpbmRvdy5fY2FyZEF0bGFzTG9hZGluZykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5bCd6K+V5LuO6LWE5rqQ57yT5a2Y5Lit6I635Y+WXG4gICAgICAgIHZhciBjYWNoZSA9IGNjLmxvYWRlci5nZXRSZXMoXCJVSS9jYXJkL2NhcmRcIiwgY2MuU3ByaXRlQXRsYXMpXG4gICAgICAgIGlmIChjYWNoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4OPIFtfbG9hZEF0bGFzU3luY10g5LuO57yT5a2Y6I635Y+W5Zu+6ZuG5oiQ5YqfXCIpXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5qCH6K6w5q2j5Zyo5Yqg6L29XG4gICAgICAgIHdpbmRvdy5fY2FyZEF0bGFzTG9hZGluZyA9IHRydWVcbiAgICAgICAgXG4gICAgICAgIC8vIOW8guatpeWKoOi9ve+8iOi/measoeiwg+eUqOS8muWksei0pe+8jOS9huS4i+asoeWwseiDveS7jue8k+WtmOiOt+WPlu+8iVxuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcIlVJL2NhcmQvY2FyZFwiLCBjYy5TcHJpdGVBdGxhcywgZnVuY3Rpb24oZXJyLCBhdGxhcykge1xuICAgICAgICAgICAgd2luZG93Ll9jYXJkQXRsYXNMb2FkaW5nID0gZmFsc2VcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+DjyBbX2xvYWRBdGxhc1N5bmNdIOWKoOi9veWksei0pTpcIiwgZXJyKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2luZG93Ll9jYXJkQXRsYXMgPSBhdGxhc1xuICAgICAgICAgICAgd2luZG93Ll9jYXJkQXRsYXNMb2FkZWQgPSB0cnVlXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfg48gW19sb2FkQXRsYXNTeW5jXSDlkI7lj7DliqDovb3miJDlip9cIilcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfSxcblxuICAgIF9nZXRTdWl0TmFtZTogZnVuY3Rpb24oc3VpdCkge1xuICAgICAgICB2YXIgc3VpdE5hbWVzID0geyAwOiBcIuKZoFwiLCAxOiBcIuKZpVwiLCAyOiBcIuKZo1wiLCAzOiBcIuKZplwiLCA0OiBcIueOi1wiIH1cbiAgICAgICAgcmV0dXJuIHN1aXROYW1lc1tzdWl0XSB8fCBcIj9cIlxuICAgIH0sXG5cbiAgICBfZ2V0UmFua05hbWU6IGZ1bmN0aW9uKHJhbmspIHtcbiAgICAgICAgaWYgKHJhbmsgPT09IDE2KSByZXR1cm4gXCLlsI/njotcIlxuICAgICAgICBpZiAocmFuayA9PT0gMTcpIHJldHVybiBcIuWkp+eOi1wiXG4gICAgICAgIHZhciByYW5rTmFtZXMgPSB7XG4gICAgICAgICAgICAzOiBcIjNcIiwgNDogXCI0XCIsIDU6IFwiNVwiLCA2OiBcIjZcIiwgNzogXCI3XCIsIDg6IFwiOFwiLCA5OiBcIjlcIixcbiAgICAgICAgICAgIDEwOiBcIjEwXCIsIDExOiBcIkpcIiwgMTI6IFwiUVwiLCAxMzogXCJLXCIsIDE0OiBcIkFcIiwgMTU6IFwiMlwiXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJhbmtOYW1lc1tyYW5rXSB8fCBTdHJpbmcocmFuaylcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog44CQ5qC45b+D44CR5qC55o2u5pyN5Yqh56uv5pWw5o2u6K6h566X57K+54G16ZSu5ZCNXG4gICAgICpcbiAgICAgKiDwn5Sn44CQ5bey6aqM6K+B44CR5q2j56Gu55qE57K+54G15pig5bCE6KGo77yI5qC55o2u5a6e6ZmF5Zu+54mH77yJ77yaXG4gICAgICogLSBjYXJkXzUzID0g57qi6ImySk9LRVIgPSDlpKfnjotcbiAgICAgKiAtIGNhcmRfNTQgPSDpu5HoibJKT0tFUiA9IOWwj+eOi1xuICAgICAqIC0gY2FyZF81NSA9IOiDjOmdolxuICAgICAqIC0gY2FyZF8xIH4gY2FyZF8xMyA9IOaWueWdlyBBLCAyLCAzLCA0LCA1LCA2LCA3LCA4LCA5LCAxMCwgSiwgUSwgS1xuICAgICAqIC0gY2FyZF8xNCB+IGNhcmRfMjYgPSDmooXoirEgQSwgMiwgMywgNCwgNSwgNiwgNywgOCwgOSwgMTAsIEosIFEsIEtcbiAgICAgKiAtIGNhcmRfMjcgfiBjYXJkXzM5ID0g57qi5b+DIEEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwLCBKLCBRLCBLXG4gICAgICogLSBjYXJkXzQwIH4gY2FyZF81MiA9IOm7keahgyBBLCAyLCAzLCA0LCA1LCA2LCA3LCA4LCA5LCAxMCwgSiwgUSwgS1xuICAgICAqXG4gICAgICog5pyN5Yqh56uv5pWw5o2u5qC85byP77yaXG4gICAgICogLSBzdWl0OiAwPeKZoCjpu5HmoYMpLCAxPeKZpSjnuqLlv4MpLCAyPeKZoyjmooXoirEpLCAzPeKZpijmlrnlnZcpLCA0PeeOi1xuICAgICAqIC0gcmFuazogMy0xND0z5YiwQSwgMTU9MiwgMTY95bCP546LLCAxNz3lpKfnjotcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjYXJkIC0g5pyN5Yqh56uv5Y2h54mM5pWw5o2uXG4gICAgICogQHJldHVybnMge1N0cmluZ30g57K+54G16ZSu5ZCNXG4gICAgICovXG4gICAgX2dldFNwcml0ZUtleTogZnVuY3Rpb24oY2FyZCkge1xuICAgICAgICB2YXIgc3VpdCA9IGNhcmQuc3VpdFxuICAgICAgICB2YXIgcmFuayA9IGNhcmQucmFua1xuXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlpKflsI/njovmmKDlsIQgLSDlt7Lmm7TmraNcbiAgICAgICAgLy8g57K+54G15Zu+6ZuG5Lit77yaXG4gICAgICAgIC8vIC0gY2FyZF81MyA9IOe6ouiJskpPS0VSID0g5aSn546LXG4gICAgICAgIC8vIC0gY2FyZF81NCA9IOm7keiJskpPS0VSID0g5bCP546LXG4gICAgICAgIC8vIOacjeWKoeerr+aVsOaNru+8mlxuICAgICAgICAvLyAtIHJhbmsgPSAxNiA9IOWwj+eOi1xuICAgICAgICAvLyAtIHJhbmsgPSAxNyA9IOWkp+eOi1xuICAgICAgICBpZiAocmFuayA9PT0gMTYpIHJldHVybiBcImNhcmRfNTRcIiAgIC8vIOWwj+eOiyDihpIg6buR6ImySk9LRVJcbiAgICAgICAgaWYgKHJhbmsgPT09IDE3KSByZXR1cm4gXCJjYXJkXzUzXCIgICAvLyDlpKfnjosg4oaSIOe6ouiJskpPS0VSXG5cbiAgICAgICAgLy8g6aqM6K+B5pWw5o2u5pyJ5pWI5oCnXG4gICAgICAgIGlmIChzdWl0IDwgMCB8fCBzdWl0ID4gMyB8fCByYW5rIDwgMyB8fCByYW5rID4gMTUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn4OPIFtfZ2V0U3ByaXRlS2V5XSDml6DmlYjnmoTniYzmlbDmja46IHN1aXQ9XCIgKyBzdWl0ICsgXCIsIHJhbms9XCIgKyByYW5rKVxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWwhuacjeWKoeerr3JhbmvovazmjaLkuLrnsr7ngbXntKLlvJXvvIhBPTAsIDI9MSwgMz0yLCAuLi4sIEs9MTLvvIlcbiAgICAgICAgdmFyIHBvaW50SW5kZXhcbiAgICAgICAgaWYgKHJhbmsgPT09IDE0KSB7XG4gICAgICAgICAgICBwb2ludEluZGV4ID0gMCAgIC8vIEFcbiAgICAgICAgfSBlbHNlIGlmIChyYW5rID09PSAxNSkge1xuICAgICAgICAgICAgcG9pbnRJbmRleCA9IDEgICAvLyAyXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwb2ludEluZGV4ID0gcmFuayAtIDEgIC8vIDMtMTMgLT4gMi0xMlxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5qC55o2u6Iqx6Imy6K6h566X5Z+656GA5YGP56e7XG4gICAgICAgIC8vIOacjeWKoeerrzogc3VpdCAwPeKZoCjpu5HmoYMpLCAxPeKZpSjnuqLlv4MpLCAyPeKZoyjmooXoirEpLCAzPeKZpijmlrnlnZcpXG4gICAgICAgIC8vIOeyvueBtTogY2FyZF8xfjEzPeaWueWdlywgY2FyZF8xNH4yNj3mooXoirEsIGNhcmRfMjd+Mzk957qi5b+DLCBjYXJkXzQwfjUyPem7keahg1xuICAgICAgICB2YXIgYmFzZU9mZnNldFxuICAgICAgICBzd2l0Y2ggKHN1aXQpIHtcbiAgICAgICAgICAgIGNhc2UgMzogYmFzZU9mZnNldCA9IDA7IGJyZWFrICAgLy8g5pa55Z2XOiBjYXJkXzEgfiBjYXJkXzEzXG4gICAgICAgICAgICBjYXNlIDI6IGJhc2VPZmZzZXQgPSAxMzsgYnJlYWsgIC8vIOaiheiKsTogY2FyZF8xNCB+IGNhcmRfMjZcbiAgICAgICAgICAgIGNhc2UgMTogYmFzZU9mZnNldCA9IDI2OyBicmVhayAgLy8g57qi5b+DOiBjYXJkXzI3IH4gY2FyZF8zOVxuICAgICAgICAgICAgY2FzZSAwOiBiYXNlT2Zmc2V0ID0gMzk7IGJyZWFrICAvLyDpu5HmoYM6IGNhcmRfNDAgfiBjYXJkXzUyXG4gICAgICAgICAgICBkZWZhdWx0OiBiYXNlT2Zmc2V0ID0gMFxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNhcmRJbmRleCA9IGJhc2VPZmZzZXQgKyBwb2ludEluZGV4ICsgMVxuXG4gICAgICAgIHJldHVybiBcImNhcmRfXCIgKyBjYXJkSW5kZXhcbiAgICB9XG59KTtcbiJdfQ==