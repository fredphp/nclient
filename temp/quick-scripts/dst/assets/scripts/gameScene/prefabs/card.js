
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

    var rankName = this._getRankName(card.rank);

    var spriteFrame = this.cards_sprite_atlas.getSpriteFrame(spriteKey);

    if (spriteFrame) {
      this.node.getComponent(cc.Sprite).spriteFrame = spriteFrame;
      this.setTouchEvent();
    } else {
      console.error("🃏 [showCards] 找不到精灵帧:", spriteKey);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2dhbWVTY2VuZS9wcmVmYWJzL2NhcmQuanMiXSwibmFtZXMiOlsiUm9vbVN0YXRlIiwid2luZG93IiwiY2MiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJjYXJkc19zcHJpdGVfYXRsYXMiLCJTcHJpdGVBdGxhcyIsIm9uTG9hZCIsImZsYWciLCJvZmZzZXRfeSIsIm5vZGUiLCJvbiIsImV2ZW50IiwieSIsImJpbmQiLCJzdGFydCIsImluaXRfZGF0YSIsImRhdGEiLCJzZXRUb3VjaEV2ZW50IiwibXlnbG9iYWwiLCJwbGF5ZXJEYXRhIiwiYWNjb3VudGlkIiwiYWNjb3VudElEIiwiTm9kZSIsIkV2ZW50VHlwZSIsIlRPVUNIX1NUQVJUIiwiZ2FtZVNjZW5lX25vZGUiLCJfZmluZEdhbWVTY2VuZU5vZGUiLCJjb25zb2xlIiwid2FybiIsImdhbWVTY2VuZSIsImdldENvbXBvbmVudCIsInJvb21zdGF0ZSIsIlJPT01fUExBWUlORyIsImVtaXQiLCJjYXJkaWQiLCJjYXJkX2lkIiwiY2FyZF9kYXRhIiwicGFyZW50Iiwic2hvd0NhcmRzIiwiY2FyZCIsImVycm9yIiwic3VpdCIsInJhbmsiLCJzcHJpdGVLZXkiLCJfZ2V0U3ByaXRlS2V5IiwiSlNPTiIsInN0cmluZ2lmeSIsInN1aXROYW1lIiwiX2dldFN1aXROYW1lIiwicmFua05hbWUiLCJfZ2V0UmFua05hbWUiLCJzcHJpdGVGcmFtZSIsImdldFNwcml0ZUZyYW1lIiwiU3ByaXRlIiwic3VpdE5hbWVzIiwicmFua05hbWVzIiwiU3RyaW5nIiwicG9pbnRJbmRleCIsImJhc2VPZmZzZXQiLCJjYXJkSW5kZXgiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUEsSUFBSUEsU0FBUyxHQUFHQyxNQUFNLENBQUNELFNB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b290IjoiLyIsInNvdXJjZXNDb250ZW50IjpbIi8vIOS9v+eUqOWFqOWxgOWPmOmHj++8jOS4jeS9v+eUqCByZXF1aXJlXG4vLyDjgJDlvbvlupXkv67lpI3niYjmnKzjgJHln7rkuo7nsr7ngbXlm77pm4blrp7pmYXlm77niYfnmoTmmKDlsITooahcbi8vXG4vLyDwn5Sn44CQ6YeN6KaB44CR5q2j56Gu55qE57K+54G15pig5bCE6KGo77yI5qC55o2u5a6e6ZmF5Zu+54mH6aqM6K+B77yJ77yaXG4vLyAtIGNhcmRfNTMgPSDnuqLoibJKT0tFUiA9IOWkp+eOi1xuLy8gLSBjYXJkXzU0ID0g6buR6ImySk9LRVIgPSDlsI/njotcbi8vIC0gY2FyZF81NSA9IOiDjOmdolxuLy8gLSBjYXJkXzEgfiBjYXJkXzEzID0g5pa55Z2XIEEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwLCBKLCBRLCBLXG4vLyAtIGNhcmRfMTQgfiBjYXJkXzI2ID0g5qKF6IqxIEEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwLCBKLCBRLCBLXG4vLyAtIGNhcmRfMjcgfiBjYXJkXzM5ID0g57qi5b+DIEEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwLCBKLCBRLCBLXG4vLyAtIGNhcmRfNDAgfiBjYXJkXzUyID0g6buR5qGDIEEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwLCBKLCBRLCBLXG4vL1xuLy8g5pyN5Yqh56uv5pWw5o2u5qC85byP77yaXG4vLyAtIHN1aXQ6IDA94pmgKOm7keahgyksIDE94pmlKOe6ouW/gyksIDI94pmjKOaiheiKsSksIDM94pmmKOaWueWdlyksIDQ9546LXG4vLyAtIHJhbms6IDMtMTQ9M+WIsEEsIDE1PTIsIDE2PeWwj+eOiywgMTc95aSn546LXG5cbnZhciBSb29tU3RhdGUgPSB3aW5kb3cuUm9vbVN0YXRlIHx8IHt9XG5cbmNjLkNsYXNzKHtcbiAgICBleHRlbmRzOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIGNhcmRzX3Nwcml0ZV9hdGxhczogY2MuU3ByaXRlQXRsYXMsXG4gICAgfSxcblxuICAgIG9uTG9hZCAoKSB7XG4gICAgICAgIHRoaXMuZmxhZyA9IGZhbHNlXG4gICAgICAgIHRoaXMub2Zmc2V0X3kgPSAyMFxuXG4gICAgICAgIHRoaXMubm9kZS5vbihcInJlc2V0X2NhcmRfZmxhZ1wiLCBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICBpZih0aGlzLmZsYWcgPT0gdHJ1ZSl7XG4gICAgICAgICAgICAgICAgdGhpcy5mbGFnID0gZmFsc2VcbiAgICAgICAgICAgICAgICB0aGlzLm5vZGUueSAtPSB0aGlzLm9mZnNldF95XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICB9LFxuXG4gICAgc3RhcnQgKCkge30sXG5cbiAgICBpbml0X2RhdGEgKGRhdGEpIHt9LFxuXG4gICAgc2V0VG91Y2hFdmVudCAoKSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAoIW15Z2xvYmFsIHx8ICFteWdsb2JhbC5wbGF5ZXJEYXRhKSByZXR1cm5cblxuICAgICAgICBpZiAodGhpcy5hY2NvdW50aWQgPT0gbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SUQpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9TVEFSVCwgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHlkJHkuIrmn6Xmib4gZ2FtZVNjZW5lIOiKgueCuVxuICAgICAgICAgICAgICAgIHZhciBnYW1lU2NlbmVfbm9kZSA9IHRoaXMuX2ZpbmRHYW1lU2NlbmVOb2RlKClcbiAgICAgICAgICAgICAgICBpZiAoIWdhbWVTY2VuZV9ub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCfg48gW2NhcmRdIOacquaJvuWIsCBnYW1lU2NlbmUg6IqC54K5XCIpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBnYW1lU2NlbmUgPSBnYW1lU2NlbmVfbm9kZS5nZXRDb21wb25lbnQoXCJnYW1lU2NlbmVcIilcbiAgICAgICAgICAgICAgICBpZiAoIWdhbWVTY2VuZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn4OPIFtjYXJkXSDmnKrmib7liLAgZ2FtZVNjZW5lIOe7hOS7tlwiKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZ2FtZVNjZW5lLnJvb21zdGF0ZSA9PSBSb29tU3RhdGUuUk9PTV9QTEFZSU5HKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmZsYWcgPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmxhZyA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubm9kZS55ICs9IHRoaXMub2Zmc2V0X3lcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkvb/nlKjllK/kuIDmoIfor4bnrKYge3N1aXQsIHJhbmt9IOmAieeJjFxuICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZVNjZW5lX25vZGUuZW1pdChcImNob29zZV9jYXJkX2V2ZW50XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXJkaWQ6IHRoaXMuY2FyZF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXJkX2RhdGE6IHRoaXMuY2FyZF9kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmxhZyA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5vZGUueSAtPSB0aGlzLm9mZnNldF95XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5L2/55So5ZSv5LiA5qCH6K+G56ymIHtzdWl0LCByYW5rfSDlj5bmtojpgInniYxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVTY2VuZV9ub2RlLmVtaXQoXCJ1bmNob29zZV9jYXJkX2V2ZW50XCIsIHRoaXMuY2FyZF9pZClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5ZCR5LiK5p+l5om+IGdhbWVTY2VuZSDoioLngrlcbiAgICAgKi9cbiAgICBfZmluZEdhbWVTY2VuZU5vZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMubm9kZVxuICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgdmFyIGdhbWVTY2VuZSA9IG5vZGUuZ2V0Q29tcG9uZW50KFwiZ2FtZVNjZW5lXCIpXG4gICAgICAgICAgICBpZiAoZ2FtZVNjZW5lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5vZGUgPSBub2RlLnBhcmVudFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIOOAkOaguOW/g+OAkeaYvuekuuWNoeeJjFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjYXJkIC0g5pyN5Yqh56uv5Y6f5aeL5Y2h54mM5pWw5o2uXG4gICAgICovXG4gICAgc2hvd0NhcmRzIChjYXJkLCBhY2NvdW50aWQpIHtcbiAgICAgICAgaWYgKCFjYXJkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+DjyBbc2hvd0NhcmRzXSDljaHniYzmlbDmja7kuLrnqbpcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYXJkX2RhdGEgPSBjYXJkXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHkvb/nlKggc3VpdCtyYW5rIOe7hOWQiOS9nOS4uuWUr+S4gOagh+ivhuespu+8jOiAjOS4jeaYr+WPqueUqCByYW5rXG4gICAgICAgIC8vIOi/meagt+WPr+S7peato+ehruWMuuWIhuebuOWQjOeJjOmdouWAvOS9huS4jeWQjOiKseiJsueahOeJjO+8iOWmgiDimaBKIOWSjCDimaVK77yJXG4gICAgICAgIHRoaXMuY2FyZF9pZCA9IHtcbiAgICAgICAgICAgIHN1aXQ6IGNhcmQuc3VpdCxcbiAgICAgICAgICAgIHJhbms6IGNhcmQucmFua1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFjY291bnRpZCkge1xuICAgICAgICAgICAgdGhpcy5hY2NvdW50aWQgPSBhY2NvdW50aWRcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzcHJpdGVLZXkgPSB0aGlzLl9nZXRTcHJpdGVLZXkoY2FyZClcblxuICAgICAgICBpZiAoIXNwcml0ZUtleSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfg48gW3Nob3dDYXJkc10g5peg5rOV6K+G5Yir55qE54mM5pWw5o2uOlwiLCBKU09OLnN0cmluZ2lmeShjYXJkKSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN1aXROYW1lID0gdGhpcy5fZ2V0U3VpdE5hbWUoY2FyZC5zdWl0KVxuICAgICAgICB2YXIgcmFua05hbWUgPSB0aGlzLl9nZXRSYW5rTmFtZShjYXJkLnJhbmspXG5cbiAgICAgICAgdmFyIHNwcml0ZUZyYW1lID0gdGhpcy5jYXJkc19zcHJpdGVfYXRsYXMuZ2V0U3ByaXRlRnJhbWUoc3ByaXRlS2V5KVxuICAgICAgICBpZiAoc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZS5nZXRDb21wb25lbnQoY2MuU3ByaXRlKS5zcHJpdGVGcmFtZSA9IHNwcml0ZUZyYW1lXG4gICAgICAgICAgICB0aGlzLnNldFRvdWNoRXZlbnQoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfg48gW3Nob3dDYXJkc10g5om+5LiN5Yiw57K+54G15binOlwiLCBzcHJpdGVLZXkpXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2dldFN1aXROYW1lOiBmdW5jdGlvbihzdWl0KSB7XG4gICAgICAgIHZhciBzdWl0TmFtZXMgPSB7IDA6IFwi4pmgXCIsIDE6IFwi4pmlXCIsIDI6IFwi4pmjXCIsIDM6IFwi4pmmXCIsIDQ6IFwi546LXCIgfVxuICAgICAgICByZXR1cm4gc3VpdE5hbWVzW3N1aXRdIHx8IFwiP1wiXG4gICAgfSxcblxuICAgIF9nZXRSYW5rTmFtZTogZnVuY3Rpb24ocmFuaykge1xuICAgICAgICBpZiAocmFuayA9PT0gMTYpIHJldHVybiBcIuWwj+eOi1wiXG4gICAgICAgIGlmIChyYW5rID09PSAxNykgcmV0dXJuIFwi5aSn546LXCJcbiAgICAgICAgdmFyIHJhbmtOYW1lcyA9IHtcbiAgICAgICAgICAgIDM6IFwiM1wiLCA0OiBcIjRcIiwgNTogXCI1XCIsIDY6IFwiNlwiLCA3OiBcIjdcIiwgODogXCI4XCIsIDk6IFwiOVwiLFxuICAgICAgICAgICAgMTA6IFwiMTBcIiwgMTE6IFwiSlwiLCAxMjogXCJRXCIsIDEzOiBcIktcIiwgMTQ6IFwiQVwiLCAxNTogXCIyXCJcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmFua05hbWVzW3JhbmtdIHx8IFN0cmluZyhyYW5rKVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDjgJDmoLjlv4PjgJHmoLnmja7mnI3liqHnq6/mlbDmja7orqHnrpfnsr7ngbXplK7lkI1cbiAgICAgKlxuICAgICAqIPCflKfjgJDlt7Lpqozor4HjgJHmraPnoa7nmoTnsr7ngbXmmKDlsITooajvvIjmoLnmja7lrp7pmYXlm77niYfvvInvvJpcbiAgICAgKiAtIGNhcmRfNTMgPSDnuqLoibJKT0tFUiA9IOWkp+eOi1xuICAgICAqIC0gY2FyZF81NCA9IOm7keiJskpPS0VSID0g5bCP546LXG4gICAgICogLSBjYXJkXzU1ID0g6IOM6Z2iXG4gICAgICogLSBjYXJkXzEgfiBjYXJkXzEzID0g5pa55Z2XIEEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwLCBKLCBRLCBLXG4gICAgICogLSBjYXJkXzE0IH4gY2FyZF8yNiA9IOaiheiKsSBBLCAyLCAzLCA0LCA1LCA2LCA3LCA4LCA5LCAxMCwgSiwgUSwgS1xuICAgICAqIC0gY2FyZF8yNyB+IGNhcmRfMzkgPSDnuqLlv4MgQSwgMiwgMywgNCwgNSwgNiwgNywgOCwgOSwgMTAsIEosIFEsIEtcbiAgICAgKiAtIGNhcmRfNDAgfiBjYXJkXzUyID0g6buR5qGDIEEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwLCBKLCBRLCBLXG4gICAgICpcbiAgICAgKiDmnI3liqHnq6/mlbDmja7moLzlvI/vvJpcbiAgICAgKiAtIHN1aXQ6IDA94pmgKOm7keahgyksIDE94pmlKOe6ouW/gyksIDI94pmjKOaiheiKsSksIDM94pmmKOaWueWdlyksIDQ9546LXG4gICAgICogLSByYW5rOiAzLTE0PTPliLBBLCAxNT0yLCAxNj3lsI/njossIDE3PeWkp+eOi1xuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNhcmQgLSDmnI3liqHnq6/ljaHniYzmlbDmja5cbiAgICAgKiBAcmV0dXJucyB7U3RyaW5nfSDnsr7ngbXplK7lkI1cbiAgICAgKi9cbiAgICBfZ2V0U3ByaXRlS2V5OiBmdW5jdGlvbihjYXJkKSB7XG4gICAgICAgIHZhciBzdWl0ID0gY2FyZC5zdWl0XG4gICAgICAgIHZhciByYW5rID0gY2FyZC5yYW5rXG5cbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeWkp+Wwj+eOi+aYoOWwhCAtIOW3suabtOato1xuICAgICAgICAvLyDnsr7ngbXlm77pm4bkuK3vvJpcbiAgICAgICAgLy8gLSBjYXJkXzUzID0g57qi6ImySk9LRVIgPSDlpKfnjotcbiAgICAgICAgLy8gLSBjYXJkXzU0ID0g6buR6ImySk9LRVIgPSDlsI/njotcbiAgICAgICAgLy8g5pyN5Yqh56uv5pWw5o2u77yaXG4gICAgICAgIC8vIC0gcmFuayA9IDE2ID0g5bCP546LXG4gICAgICAgIC8vIC0gcmFuayA9IDE3ID0g5aSn546LXG4gICAgICAgIGlmIChyYW5rID09PSAxNikgcmV0dXJuIFwiY2FyZF81NFwiICAgLy8g5bCP546LIOKGkiDpu5HoibJKT0tFUlxuICAgICAgICBpZiAocmFuayA9PT0gMTcpIHJldHVybiBcImNhcmRfNTNcIiAgIC8vIOWkp+eOiyDihpIg57qi6ImySk9LRVJcblxuICAgICAgICAvLyDpqozor4HmlbDmja7mnInmlYjmgKdcbiAgICAgICAgaWYgKHN1aXQgPCAwIHx8IHN1aXQgPiAzIHx8IHJhbmsgPCAzIHx8IHJhbmsgPiAxNSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfg48gW19nZXRTcHJpdGVLZXldIOaXoOaViOeahOeJjOaVsOaNrjogc3VpdD1cIiArIHN1aXQgKyBcIiwgcmFuaz1cIiArIHJhbmspXG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5bCG5pyN5Yqh56uvcmFua+i9rOaNouS4uueyvueBtee0ouW8le+8iEE9MCwgMj0xLCAzPTIsIC4uLiwgSz0xMu+8iVxuICAgICAgICB2YXIgcG9pbnRJbmRleFxuICAgICAgICBpZiAocmFuayA9PT0gMTQpIHtcbiAgICAgICAgICAgIHBvaW50SW5kZXggPSAwICAgLy8gQVxuICAgICAgICB9IGVsc2UgaWYgKHJhbmsgPT09IDE1KSB7XG4gICAgICAgICAgICBwb2ludEluZGV4ID0gMSAgIC8vIDJcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBvaW50SW5kZXggPSByYW5rIC0gMSAgLy8gMy0xMyAtPiAyLTEyXG4gICAgICAgIH1cblxuICAgICAgICAvLyDmoLnmja7oirHoibLorqHnrpfln7rnoYDlgY/np7tcbiAgICAgICAgLy8g5pyN5Yqh56uvOiBzdWl0IDA94pmgKOm7keahgyksIDE94pmlKOe6ouW/gyksIDI94pmjKOaiheiKsSksIDM94pmmKOaWueWdlylcbiAgICAgICAgLy8g57K+54G1OiBjYXJkXzF+MTM95pa55Z2XLCBjYXJkXzE0fjI2PeaiheiKsSwgY2FyZF8yN34zOT3nuqLlv4MsIGNhcmRfNDB+NTI96buR5qGDXG4gICAgICAgIHZhciBiYXNlT2Zmc2V0XG4gICAgICAgIHN3aXRjaCAoc3VpdCkge1xuICAgICAgICAgICAgY2FzZSAzOiBiYXNlT2Zmc2V0ID0gMDsgYnJlYWsgICAvLyDmlrnlnZc6IGNhcmRfMSB+IGNhcmRfMTNcbiAgICAgICAgICAgIGNhc2UgMjogYmFzZU9mZnNldCA9IDEzOyBicmVhayAgLy8g5qKF6IqxOiBjYXJkXzE0IH4gY2FyZF8yNlxuICAgICAgICAgICAgY2FzZSAxOiBiYXNlT2Zmc2V0ID0gMjY7IGJyZWFrICAvLyDnuqLlv4M6IGNhcmRfMjcgfiBjYXJkXzM5XG4gICAgICAgICAgICBjYXNlIDA6IGJhc2VPZmZzZXQgPSAzOTsgYnJlYWsgIC8vIOm7keahgzogY2FyZF80MCB+IGNhcmRfNTJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGJhc2VPZmZzZXQgPSAwXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2FyZEluZGV4ID0gYmFzZU9mZnNldCArIHBvaW50SW5kZXggKyAxXG5cbiAgICAgICAgcmV0dXJuIFwiY2FyZF9cIiArIGNhcmRJbmRleFxuICAgIH1cbn0pO1xuIl19