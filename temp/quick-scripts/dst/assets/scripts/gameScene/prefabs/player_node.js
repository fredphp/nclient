
                (function() {
                    var nodeEnv = typeof require !== 'undefined' && typeof process !== 'undefined';
                    var __module = nodeEnv ? module : {exports:{}};
                    var __filename = 'preview-scripts/assets/scripts/gameScene/prefabs/player_node.js';
                    var __require = nodeEnv ? function (request) {
                        return cc.require(request);
                    } : function (request) {
                        return __quick_compile_project__.require(request, __filename);
                    };
                    function __define (exports, require, module) {
                        if (!nodeEnv) {__quick_compile_project__.registerModule(__filename, module);}"use strict";
cc._RF.push(module, 'a2125ra91BLLoSvnFm+7Qba', 'player_node');
// scripts/gameScene/prefabs/player_node.js

"use strict";

// 使用全局变量，不使用 require
// 【修复版本】简化对手牌背显示，直接创建 17 张牌背
// 核心原则：
// 1. 收到 push_card_event 后直接显示 17 张牌背
// 2. 不依赖定时器或动画调度
// 3. 保证数据正确性
var qian_state = window.qian_state || {
  buqiang: 0,
  qian: 1
};
var isopen_sound = window.isopen_sound || 1; // ⚠️【已删除】playRobSound 函数 - 音效播放统一由 gameingUI._playRobSound 处理

cc.Class({
  "extends": cc.Component,
  properties: {
    account_label: cc.Label,
    nickname_label: cc.Label,
    room_touxiang: cc.Sprite,
    globalcount_label: cc.Label,
    room_money_frame: cc.Node,
    // 金币背景框
    headimage: cc.Sprite,
    readyimage: cc.Node,
    offlineimage: cc.Node,
    trusteeimage: cc.Node,
    // 🔧【托管】托管状态图标
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
  onLoad: function onLoad() {
    this.readyimage.active = false;
    this.offlineimage.active = false;
    if (this.trusteeimage) this.trusteeimage.active = false; // 🔧【托管】初始化托管图标

    if (this.masterIcon) this.masterIcon.active = false; // 🔧【修复】初始化地主图标为隐藏

    this.currentCardCount = 17;
    this.cardlist_node = []; // 游戏开始事件

    this.node.on("gamestart_event", function (event) {
      this.readyimage.active = false;
      if (this.masterIcon) this.masterIcon.active = false; // 🔧【修复】游戏开始时隐藏地主图标

      if (this.card_node) {
        this.card_node.active = false;
        this.card_node.removeAllChildren(true);
      }

      this.cardlist_node = [];
      this.currentCardCount = 17;
    }.bind(this)); // 【核心】发牌事件 - 直接显示 17 张牌背

    this.node.on("push_card_event", function (event) {
      var myglobal = window.myglobal;

      if (!myglobal) {
        console.error("🃏 [player_node] push_card_event: myglobal 不存在！");
        return;
      }

      var myPlayerId = this._getMyPlayerId(myglobal);

      var accountIdStr = String(this.accountid || ""); // 如果是自己，跳过

      if (myPlayerId === accountIdStr && accountIdStr !== "") {
        return;
      }

      this.showCardBacks(17);
    }.bind(this)); // 抢地主事件
    // 🔧【修复】所有玩家节点都能显示抢地主/不抢状态
    // ⚠️【重要】音效播放统一由 gameingUI._playRobSound 处理，此处不再播放音效

    this.node.on("playernode_rob_state_event", function (event) {
      var detail = event; // 隐藏抢地主按钮（当前操作的玩家）

      if (detail.accountid == this.accountid) {
        this.qiangdidzhu_node.active = false;
      } // 🔧【关键修复】所有玩家节点都显示对应玩家的抢地主状态


      if (this.accountid == detail.accountid) {
        // 🔧【新增】根据轮次区分"叫地主/不叫"和"抢地主/不抢"
        var round = detail.round || 1;
        var isCall = detail.state == qian_state.qian || detail.state === true;

        if (isCall) {
          this.robIcon_Sp.active = true; // ⚠️【已删除】音效播放移至 gameingUI._playRobSound（服务端广播触发）
        } else {
          this.robnoIcon_Sp.active = true; // ⚠️【已删除】音效播放移至 gameingUI._playRobSound（服务端广播触发）
        }
      }
    }.bind(this)); // 成为地主事件

    this.node.on("playernode_changemaster_event", function (event) {
      var detail = event;
      this.robIcon_Sp.active = false;
      this.robnoIcon_Sp.active = false;

      if (detail == this.accountid) {
        this.masterIcon.active = true;
        this.currentCardCount = 20;
        this.showCardBacks(20);
      }
    }.bind(this)); // 牌数更新事件

    this.node.on("update_card_count_event", function (data) {
      if (data.accountid == this.accountid) {
        this.currentCardCount = data.count;
        this.showCardBacks(data.count);
      }
    }.bind(this)); // 【新增】玩家状态更新事件（掉线/上线/托管）

    this.node.on("player_state_update", function (data) {
      this._updatePlayerState(data);
    }.bind(this)); // 🔧【托管】托管状态更新事件

    this.node.on("trustee_state_update", function (data) {
      this._updateTrusteeState(data);
    }.bind(this)); // 🕐【新增】倒计时更新事件

    this.node.on("update_countdown_event", function (data) {
      // 只更新当前玩家的倒计时显示
      if (this.seat_index === 0) {
        if (this.time_label) {
          this.time_label.string = String(data.remaining);
        }
      }
    }.bind(this));
  },
  start: function start() {},

  /**
   * 获取当前玩家ID
   */
  _getMyPlayerId: function _getMyPlayerId(myglobal) {
    var myPlayerId = null;

    if (myglobal.socket && myglobal.socket.getPlayerInfo) {
      var playerInfo = myglobal.socket.getPlayerInfo();

      if (playerInfo && playerInfo.id) {
        myPlayerId = playerInfo.id;
      }
    }

    if (!myPlayerId && myglobal.playerData && myglobal.playerData.serverPlayerId) {
      myPlayerId = myglobal.playerData.serverPlayerId;
    }

    if (!myPlayerId && myglobal.playerData && myglobal.playerData.accountID) {
      myPlayerId = myglobal.playerData.accountID;
    }

    return String(myPlayerId || "");
  },
  init_data: function init_data(data, index) {
    var myglobal = window.myglobal;
    this.accountid = data.accountid;
    this.seat_index = index; // 同步玩家ID

    if (myglobal && myglobal.playerData && !myglobal.playerData.serverPlayerId) {
      if (myglobal.socket && myglobal.socket.getPlayerInfo) {
        var playerInfo = myglobal.socket.getPlayerInfo();

        if (playerInfo && playerInfo.id) {
          myglobal.playerData.serverPlayerId = playerInfo.id;
        }
      }
    }

    this.account_label.node.active = false;
    this.nickname_label.string = data.nick_name || "玩家" + (index + 1); // 🔧【修复】区分普通场和竞技场的金币显示
    // 竞技场模式下显示 arena_gold（当期赛事金币），普通场显示 gold_count（欢乐豆）

    var displayValue = 0;
    var isArenaMode = data.room_category === 2 || this._isArenaMode;

    if (isArenaMode) {
      // 竞技场模式：优先显示 arena_gold（当期赛事金币）
      if (data.arena_gold !== undefined && data.arena_gold !== null) {
        displayValue = data.arena_gold;
        console.log("🏟️ [player_node] 竞技场模式 - 昵称:", data.nick_name, "arena_gold:", data.arena_gold, "期号:", data.period_no);
      } else if (data.match_coin !== undefined && data.match_coin !== null) {
        displayValue = data.match_coin;
        console.log("🏟️ [player_node] 竞技场模式(兼容) - 昵称:", data.nick_name, "match_coin:", data.match_coin);
      } else if (data.gold_count !== undefined && data.gold_count !== null) {
        displayValue = data.gold_count;
        console.log("🏟️ [player_node] 竞技场模式（无arena_gold）- 使用 gold_count:", data.gold_count);
      }
    } else {
      // 普通场：显示欢乐豆
      if (data.gold_count !== undefined && data.gold_count !== null) {
        displayValue = data.gold_count;
      } else if (data.goldcount !== undefined && data.goldcount !== null) {
        displayValue = data.goldcount;
      }

      console.log("🪙 [player_node] 普通场 - 昵称:", data.nick_name, "gold_count:", data.gold_count, "最终金币:", displayValue);
    }

    this.globalcount_label.string = String(displayValue);
    this._isArenaMode = isArenaMode; // 保存竞技场模式状态

    this._arenaGold = displayValue; // 🔧【新增】保存当前赛事金币

    this._periodNo = data.period_no || ""; // 🔧【新增】保存期号

    this.cardlist_node = []; // 检查准备状态

    var isReady = data.isready || data.ready || data.IsReady || false;

    if (isReady == true || isReady === "true" || isReady === 1) {
      this.readyimage.active = true;
    } else {
      this.readyimage.active = false;
    } // 【核心修改】当前玩家（index == 0）：隐藏牌背，调整头像位置


    if (index == 0) {
      // 隐藏牌背节点
      if (this.card_node) {
        this.card_node.active = false;
      } // 调整头像位置到牌背位置（牌背位置：[80, 32]）


      if (this.room_touxiang) {
        this.room_touxiang.node.x = 80;
        this.room_touxiang.node.y = 32;
      }

      if (this.headimage) {
        this.headimage.node.x = 80;
        this.headimage.node.y = 32;
      } // 调整昵称标签位置（头像正上方，居中显示）


      if (this.nickname_label && this.nickname_label.node) {
        // 设置锚点为中心，确保居中显示
        this.nickname_label.node.anchorX = 0.5;
        this.nickname_label.node.anchorY = 0.5; // 位置与头像 x 相同，y 在头像上方

        this.nickname_label.node.x = 80;
        this.nickname_label.node.y = 90;
      } // 调整金币标签位置（头像下方，居中显示）


      if (this.globalcount_label && this.globalcount_label.node) {
        // 设置锚点为中心，确保居中显示
        this.globalcount_label.node.anchorX = 0.5;
        this.globalcount_label.node.anchorY = 0.5; // 位置与头像 x 相同，y 在头像下方

        this.globalcount_label.node.x = 80;
        this.globalcount_label.node.y = -28;
      } // 调整金币背景框位置（与金币标签对齐）


      if (this.room_money_frame) {
        this.room_money_frame.x = 80;
        this.room_money_frame.y = -28;
      } // 调整准备图标位置（头像右下角）


      if (this.readyimage) {
        this.readyimage.x = 105;
        this.readyimage.y = 5;
      } // 调整地主图标位置（头像右下角）


      if (this.masterIcon) {
        this.masterIcon.x = 105;
        this.masterIcon.y = 5;
      }
    } // 设置层级


    if (this.room_touxiang && this.headimage) {
      this.headimage.node.zIndex = 0;
      this.room_touxiang.node.zIndex = 100;
      this.headimage.node.parent.sortAllChildren();
    } // 🔧【修复】加载头像 - 支持远程URL和本地资源
    // 服务端可能返回 avatar, avatarUrl, 或 avatarurl 字段


    var avatarUrl = data.avatar || data.avatarUrl || data.avatarurl || "avatar_1";

    this._loadAvatar(avatarUrl); // 准备通知


    this.node.on("player_ready_notify", function (event) {
      var detail = event;
      var readyPlayerId = "";

      if (typeof detail === 'object' && detail !== null) {
        readyPlayerId = detail.player_id || detail.playerId || detail.id || "";
      } else {
        readyPlayerId = detail;
      }

      if (readyPlayerId == this.accountid) {
        this.readyimage.active = true;
      }
    }.bind(this)); // 抢地主通知
    // 🔧【修复】接收包含 player_id 和 timeout 的事件对象，不再硬编码

    this.node.on("playernode_canrob_event", function (event) {
      // 兼容处理：event 可能是字符串（旧格式）或对象（新格式）
      var playerId = event;
      var timeout = 15; // 默认 15 秒

      if (typeof event === 'object' && event !== null) {
        playerId = event.player_id;
        timeout = event.timeout || 15;
      } // 存储 timeout 值供倒计时更新使用


      this._serverTimeout = timeout;

      if (playerId == this.accountid) {
        this.qiangdidzhu_node.active = true;

        if (this.time_label) {
          this.time_label.string = String(timeout);
        }
      }
    }.bind(this)); // 🕐 存储服务端传递的 timeout 值

    this._serverTimeout = 15;

    if (index == 1) {
      this.card_node.x = -this.card_node.x - 30;
    }
  },
  _setAvatarSprite: function _setAvatarSprite(spriteFrame) {
    if (!this.headimage || !spriteFrame) return;
    this.headimage.enabled = true;
    this.headimage.spriteFrame = spriteFrame;
    this.headimage.node.setContentSize(80, 80);
    this.headimage.node.scale = 1;
  },

  /**
   * 🔧【新增】加载头像 - 支持远程URL和本地资源
   * @param {string} avatarUrl - 头像URL或本地资源名
   */
  _loadAvatar: function _loadAvatar(avatarUrl) {
    var self = this;

    if (!this.headimage) {
      console.warn("🖼️ [player_node] headimage 未绑定");
      return;
    } // 空值处理


    if (!avatarUrl || avatarUrl === "") {
      this._loadDefaultAvatar();

      return;
    } // 判断是否是远程URL


    if (avatarUrl.indexOf('http://') === 0 || avatarUrl.indexOf('https://') === 0) {
      // 远程URL头像
      console.log("🖼️ [player_node] 加载远程头像:", avatarUrl);
      cc.assetManager.loadRemote(avatarUrl, {
        ext: '.png'
      }, function (err, texture) {
        if (err || !texture) {
          console.warn("🖼️ [player_node] 远程头像加载失败，使用默认头像:", err);

          self._loadDefaultAvatar();

          return;
        }

        try {
          var spriteFrame = new cc.SpriteFrame(texture);

          if (spriteFrame) {
            self._setAvatarSprite(spriteFrame);

            console.log("🖼️ [player_node] 远程头像加载成功");
          }
        } catch (e) {
          console.warn("🖼️ [player_node] 创建SpriteFrame失败:", e);

          self._loadDefaultAvatar();
        }
      });
    } else {
      // 本地资源头像
      console.log("🖼️ [player_node] 加载本地头像:", avatarUrl);
      var localPath = "UI/headimage/" + avatarUrl;
      cc.loader.loadRes(localPath, cc.SpriteFrame, function (err, spriteFrame) {
        if (err || !spriteFrame) {
          console.warn("🖼️ [player_node] 本地头像加载失败，使用默认头像:", err);

          self._loadDefaultAvatar();

          return;
        }

        self._setAvatarSprite(spriteFrame);

        console.log("🖼️ [player_node] 本地头像加载成功");
      });
    }
  },

  /**
   * 🔧【新增】加载默认头像
   */
  _loadDefaultAvatar: function _loadDefaultAvatar() {
    var self = this;
    cc.loader.loadRes("UI/headimage/avatar_1", cc.SpriteFrame, function (err, spriteFrame) {
      if (!err && spriteFrame) {
        self._setAvatarSprite(spriteFrame);
      }
    });
  },
  // ============================================================
  // 【核心】直接显示牌背（无动画，保证数据正确性）
  // ============================================================

  /**
   * 显示指定数量的牌背
   * @param {number} count - 牌背数量
   * 【重要】当前玩家（index == 0）不显示牌背
   */
  showCardBacks: function showCardBacks(count) {
    // 【核心】检查是否是当前玩家（index == 0），如果是则不显示牌背
    if (this.seat_index === 0) {
      return;
    }

    if (!this.card_node) {
      console.error("🃏 [player_node] card_node 未绑定");
      return;
    } // 清理旧牌


    this.card_node.removeAllChildren(true);
    this.cardlist_node = [];

    if (count <= 0) {
      this.card_node.active = false;
      this.currentCardCount = 0;
      return;
    }

    this.card_node.active = true;
    this.currentCardCount = count;

    if (!this.card_prefab) {
      console.error("🃏 [player_node] card_prefab 未绑定");
      return;
    } // 直接创建所有牌背（无动画）


    for (var i = 0; i < count; i++) {
      var card = cc.instantiate(this.card_prefab);
      if (!card) continue;
      card.scale = 0.6;
      card.parent = this.card_node;
      card.active = true; // 垂直堆叠布局

      var height = card.height;
      card.y = (count - 1) * 0.5 * height * 0.4 * 0.3 - height * 0.4 * 0.3 * i;
      card.x = 0;
      this.cardlist_node.push(card);
    }
  },
  // ============================================================
  // 【新增】玩家状态更新处理
  // ============================================================

  /**
   * 更新玩家状态
   * @param {Object} data - 包含 state, cards_count, is_landlord, timeout
   */
  _updatePlayerState: function _updatePlayerState(data) {
    // 更新离线/托管状态显示
    if (data.state === "offline") {
      // 玩家离线，显示离线图标
      if (this.offlineimage) {
        this.offlineimage.active = true;
      }
    } else if (data.state === "robot") {
      // 机器人托管，显示托管图标
      if (this.trusteeimage) {
        this.trusteeimage.active = true;
      } // 兼容：如果没有托管图标，复用离线图标


      if (!this.trusteeimage && this.offlineimage) {
        this.offlineimage.active = true;
      }
    } else if (data.state === "online") {
      // 玩家在线，隐藏离线/托管图标
      if (this.offlineimage) {
        this.offlineimage.active = false;
      }

      if (this.trusteeimage) {
        this.trusteeimage.active = false;
      }
    } // 更新牌数


    if (data.cards_count !== undefined) {
      this.currentCardCount = data.cards_count;
      this.showCardBacks(data.cards_count);
    } // 更新地主标识


    if (data.is_landlord !== undefined && data.is_landlord === true) {
      if (this.masterIcon) {
        this.masterIcon.active = true;
      }
    }
  },

  /**
   * 🔧【托管】更新托管状态
   * @param {Object} data - 包含 player_id, player_name, is_trustee, reason
   */
  _updateTrusteeState: function _updateTrusteeState(data) {
    // 只处理当前玩家的托管状态
    if (data.player_id !== this.accountid) {
      return;
    }

    if (data.is_trustee) {
      // 开启托管状态
      if (this.trusteeimage) {
        this.trusteeimage.active = true;
      } // 兼容：如果没有托管图标，复用离线图标


      if (!this.trusteeimage && this.offlineimage) {
        this.offlineimage.active = true;
      }
    } else {
      // 取消托管状态
      if (this.trusteeimage) {
        this.trusteeimage.active = false;
      } // 同时隐藏离线图标


      if (this.offlineimage) {
        this.offlineimage.active = false;
      }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2dhbWVTY2VuZS9wcmVmYWJzL3BsYXllcl9ub2RlLmpzIl0sIm5hbWVzIjpbInFpYW5fc3RhdGUiLCJ3aW5kb3ciLCJidXFpYW5nIiwicWlhbiIsImlzb3Blbl9zb3VuZCIsImNjIiwiQ2xhc3MiLCJDb21wb25lbnQiLCJwcm9wZXJ0aWVzIiwiYWNjb3VudF9sYWJlbCIsIkxhYmVsIiwibmlja25hbWVfbGFiZWwiLCJyb29tX3RvdXhpYW5nIiwiU3ByaXRlIiwiZ2xvYmFsY291bnRfbGFiZWwiLCJyb29tX21vbmV5X2ZyYW1lIiwiTm9kZSIsImhlYWRpbWFnZSIsInJlYWR5aW1hZ2UiLCJvZmZsaW5laW1hZ2UiLCJ0cnVzdGVlaW1hZ2UiLCJjYXJkX25vZGUiLCJjYXJkX3ByZWZhYiIsIlByZWZhYiIsImNsb2NraW1hZ2UiLCJxaWFuZ2RpZHpodV9ub2RlIiwidGltZV9sYWJlbCIsInJvYmltYWdlX3NwIiwiU3ByaXRlRnJhbWUiLCJyb2Jub2ltYWdlX3NwIiwicm9iSWNvblNwIiwicm9iSWNvbl9TcCIsInJvYm5vSWNvbl9TcCIsIm1hc3Rlckljb24iLCJvbkxvYWQiLCJhY3RpdmUiLCJjdXJyZW50Q2FyZENvdW50IiwiY2FyZGxpc3Rfbm9kZSIsIm5vZGUiLCJvbiIsImV2ZW50IiwicmVtb3ZlQWxsQ2hpbGRyZW4iLCJiaW5kIiwibXlnbG9iYWwiLCJjb25zb2xlIiwiZXJyb3IiLCJteVBsYXllcklkIiwiX2dldE15UGxheWVySWQiLCJhY2NvdW50SWRTdHIiLCJTdHJpbmciLCJhY2NvdW50aWQiLCJzaG93Q2FyZEJhY2tzIiwiZGV0YWlsIiwicm91bmQiLCJpc0NhbGwiLCJzdGF0ZSIsImRhdGEiLCJjb3VudCIsIl91cGRhdGVQbGF5ZXJTdGF0ZSIsIl91cGRhdGVUcnVzdGVlU3RhdGUiLCJzZWF0X2luZGV4Iiwic3RyaW5nIiwicmVtYWluaW5nIiwic3RhcnQiLCJzb2NrZXQiLCJnZXRQbGF5ZXJJbmZvIiwicGxheWVySW5mbyIsImlkIiwicGxheWVyRGF0YSIsInNlcnZlclBsYXllcklkIiwiYWNjb3VudElEIiwiaW5pdF9kYXRhIiwiaW5kZXgiLCJuaWNrX25hbWUiLCJkaXNwbGF5VmFsdWUiLCJpc0FyZW5hTW9kZSIsInJvb21fY2F0ZWdvcnkiLCJfaXNBcmVuYU1vZGUiLCJhcmVuYV9nb2xkIiwidW5kZWZpbmVkIiwibG9nIiwicGVyaW9kX25vIiwibWF0Y2hfY29pbiIsImdvbGRfY291bnQiLCJnb2xkY291bnQiLCJfYXJlbmFHb2xkIiwiX3BlcmlvZE5vIiwiaXNSZWFkeSIsImlzcmVhZHkiLCJyZWFkeSIsIklzUmVhZHkiLCJ4IiwieSIsImFuY2hvclgiLCJhbmNob3JZIiwiekluZGV4IiwicGFyZW50Iiwic29ydEFsbENoaWxkcmVuIiwiYXZhdGFyVXJsIiwiYXZhdGFyIiwiYXZhdGFydXJsIiwiX2xvYWRBdmF0YXIiLCJyZWFkeVBsYXllcklkIiwicGxheWVyX2lkIiwicGxheWVySWQiLCJ0aW1lb3V0IiwiX3NlcnZlclRpbWVvdXQiLCJfc2V0QXZhdGFyU3ByaXRlIiwic3ByaXRlRnJhbWUiLCJlbmFibGVkIiwic2V0Q29udGVudFNpemUiLCJzY2FsZSIsInNlbGYiLCJ3YXJuIiwiX2xvYWREZWZhdWx0QXZhdGFyIiwiaW5kZXhPZiIsImFzc2V0TWFuYWdlciIsImxvYWRSZW1vdGUiLCJleHQiLCJlcnIiLCJ0ZXh0dXJlIiwiZSIsImxvY2FsUGF0aCIsImxvYWRlciIsImxvYWRSZXMiLCJpIiwiY2FyZCIsImluc3RhbnRpYXRlIiwiaGVpZ2h0IiwicHVzaCIsImNhcmRzX2NvdW50IiwiaXNfbGFuZGxvcmQiLCJpc190cnVzdGVlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBLElBQUlBLFVBQVUsR0FBR0MsTUFBTSxDQUFDRCxVQUFQLElBQXFCO0VBQUVFLE9BQU8sRUFBRSxDQUFYO0VBQWNDLElBQUksRUFBRTtBQUFwQixDQUF0QztBQUNBLElBQUlDLFlBQVksR0FBR0gsTUFBTSxDQUFDRyxZQUFQLElBQXVCLENBQTFDLEVBRUE7O0FBRUFDLEVBQUUsQ0FBQ0MsS0FBSCxDQUFTO0VBQ0wsV0FBU0QsRUFBRSxDQUFDRSxTQURQO0VBR0xDLFVBQVUsRUFBRTtJQUNSQyxhQUFhLEVBQUVKLEVBQUUsQ0FBQ0ssS0FEVjtJQUVSQyxjQUFjLEVBQUVOLEVBQUUsQ0FBQ0ssS0FGWDtJQUdSRSxhQUFhLEVBQUVQLEVBQUUsQ0FBQ1EsTUFIVjtJQUlSQyxpQkFBaUIsRUFBRVQsRUFBRSxDQUFDSyxLQUpkO0lBS1JLLGdCQUFnQixFQUFFVixFQUFFLENBQUNXLElBTGI7SUFLdUI7SUFDL0JDLFNBQVMsRUFBRVosRUFBRSxDQUFDUSxNQU5OO0lBT1JLLFVBQVUsRUFBRWIsRUFBRSxDQUFDVyxJQVBQO0lBUVJHLFlBQVksRUFBRWQsRUFBRSxDQUFDVyxJQVJUO0lBU1JJLFlBQVksRUFBRWYsRUFBRSxDQUFDVyxJQVRUO0lBU21CO0lBQzNCSyxTQUFTLEVBQUVoQixFQUFFLENBQUNXLElBVk47SUFXUk0sV0FBVyxFQUFFakIsRUFBRSxDQUFDa0IsTUFYUjtJQVlSQyxVQUFVLEVBQUVuQixFQUFFLENBQUNXLElBWlA7SUFhUlMsZ0JBQWdCLEVBQUVwQixFQUFFLENBQUNXLElBYmI7SUFjUlUsVUFBVSxFQUFFckIsRUFBRSxDQUFDSyxLQWRQO0lBZVJpQixXQUFXLEVBQUV0QixFQUFFLENBQUN1QixXQWZSO0lBZ0JSQyxhQUFhLEVBQUV4QixFQUFFLENBQUN1QixXQWhCVjtJQWlCUkUsU0FBUyxFQUFFekIsRUFBRSxDQUFDUSxNQWpCTjtJQWtCUmtCLFVBQVUsRUFBRTFCLEVBQUUsQ0FBQ1csSUFsQlA7SUFtQlJnQixZQUFZLEVBQUUzQixFQUFFLENBQUNXLElBbkJUO0lBb0JSaUIsVUFBVSxFQUFFNUIsRUFBRSxDQUFDVztFQXBCUCxDQUhQO0VBMEJMa0IsTUExQkssb0JBMEJLO0lBQ1IsS0FBS2hCLFVBQUwsQ0FBZ0JpQixNQUFoQixHQUF5QixLQUF6QjtJQUNBLEtBQUtoQixZQUFMLENBQWtCZ0IsTUFBbEIsR0FBMkIsS0FBM0I7SUFDQSxJQUFJLEtBQUtmLFlBQVQsRUFBdUIsS0FBS0EsWUFBTCxDQUFrQmUsTUFBbEIsR0FBMkIsS0FBM0IsQ0FIZixDQUdpRDs7SUFDekQsSUFBSSxLQUFLRixVQUFULEVBQXFCLEtBQUtBLFVBQUwsQ0FBZ0JFLE1BQWhCLEdBQXlCLEtBQXpCLENBSmIsQ0FJNkM7O0lBQ3JELEtBQUtDLGdCQUFMLEdBQXdCLEVBQXhCO0lBQ0EsS0FBS0MsYUFBTCxHQUFxQixFQUFyQixDQU5RLENBUVI7O0lBQ0EsS0FBS0MsSUFBTCxDQUFVQyxFQUFWLENBQWEsaUJBQWIsRUFBZ0MsVUFBU0MsS0FBVCxFQUFnQjtNQUM5QyxLQUFLdEIsVUFBTCxDQUFnQmlCLE1BQWhCLEdBQXlCLEtBQXpCO01BQ0EsSUFBSSxLQUFLRixVQUFULEVBQXFCLEtBQUtBLFVBQUwsQ0FBZ0JFLE1BQWhCLEdBQXlCLEtBQXpCLENBRnlCLENBRU87O01BQ3JELElBQUksS0FBS2QsU0FBVCxFQUFvQjtRQUNoQixLQUFLQSxTQUFMLENBQWVjLE1BQWYsR0FBd0IsS0FBeEI7UUFDQSxLQUFLZCxTQUFMLENBQWVvQixpQkFBZixDQUFpQyxJQUFqQztNQUNIOztNQUNELEtBQUtKLGFBQUwsR0FBcUIsRUFBckI7TUFDQSxLQUFLRCxnQkFBTCxHQUF3QixFQUF4QjtJQUNELENBVCtCLENBUzlCTSxJQVQ4QixDQVN6QixJQVR5QixDQUFoQyxFQVRRLENBb0JSOztJQUNBLEtBQUtKLElBQUwsQ0FBVUMsRUFBVixDQUFhLGlCQUFiLEVBQWdDLFVBQVNDLEtBQVQsRUFBZ0I7TUFDOUMsSUFBSUcsUUFBUSxHQUFHMUMsTUFBTSxDQUFDMEMsUUFBdEI7O01BRUEsSUFBSSxDQUFDQSxRQUFMLEVBQWU7UUFDWEMsT0FBTyxDQUFDQyxLQUFSLENBQWMsaURBQWQ7UUFDQTtNQUNIOztNQUVELElBQUlDLFVBQVUsR0FBRyxLQUFLQyxjQUFMLENBQW9CSixRQUFwQixDQUFqQjs7TUFDQSxJQUFJSyxZQUFZLEdBQUdDLE1BQU0sQ0FBQyxLQUFLQyxTQUFMLElBQWtCLEVBQW5CLENBQXpCLENBVDhDLENBVzlDOztNQUNBLElBQUdKLFVBQVUsS0FBS0UsWUFBZixJQUErQkEsWUFBWSxLQUFLLEVBQW5ELEVBQXNEO1FBQ2xEO01BQ0g7O01BRUQsS0FBS0csYUFBTCxDQUFtQixFQUFuQjtJQUNELENBakIrQixDQWlCOUJULElBakI4QixDQWlCekIsSUFqQnlCLENBQWhDLEVBckJRLENBd0NSO0lBQ0E7SUFDQTs7SUFDQSxLQUFLSixJQUFMLENBQVVDLEVBQVYsQ0FBYSw0QkFBYixFQUEyQyxVQUFTQyxLQUFULEVBQWdCO01BQ3ZELElBQUlZLE1BQU0sR0FBR1osS0FBYixDQUR1RCxDQUd2RDs7TUFDQSxJQUFHWSxNQUFNLENBQUNGLFNBQVAsSUFBb0IsS0FBS0EsU0FBNUIsRUFBc0M7UUFDcEMsS0FBS3pCLGdCQUFMLENBQXNCVSxNQUF0QixHQUErQixLQUEvQjtNQUNELENBTnNELENBUXZEOzs7TUFDQSxJQUFHLEtBQUtlLFNBQUwsSUFBa0JFLE1BQU0sQ0FBQ0YsU0FBNUIsRUFBc0M7UUFDcEM7UUFDQSxJQUFJRyxLQUFLLEdBQUdELE1BQU0sQ0FBQ0MsS0FBUCxJQUFnQixDQUE1QjtRQUNBLElBQUlDLE1BQU0sR0FBR0YsTUFBTSxDQUFDRyxLQUFQLElBQWdCdkQsVUFBVSxDQUFDRyxJQUEzQixJQUFtQ2lELE1BQU0sQ0FBQ0csS0FBUCxLQUFpQixJQUFqRTs7UUFFQSxJQUFHRCxNQUFILEVBQVU7VUFDUixLQUFLdkIsVUFBTCxDQUFnQkksTUFBaEIsR0FBeUIsSUFBekIsQ0FEUSxDQUVSO1FBQ0QsQ0FIRCxNQUdLO1VBQ0gsS0FBS0gsWUFBTCxDQUFrQkcsTUFBbEIsR0FBMkIsSUFBM0IsQ0FERyxDQUVIO1FBQ0Q7TUFDRjtJQUNKLENBdEIwQyxDQXNCekNPLElBdEJ5QyxDQXNCcEMsSUF0Qm9DLENBQTNDLEVBM0NRLENBbUVSOztJQUNBLEtBQUtKLElBQUwsQ0FBVUMsRUFBVixDQUFhLCtCQUFiLEVBQThDLFVBQVNDLEtBQVQsRUFBZ0I7TUFDM0QsSUFBSVksTUFBTSxHQUFHWixLQUFiO01BQ0EsS0FBS1QsVUFBTCxDQUFnQkksTUFBaEIsR0FBeUIsS0FBekI7TUFDQSxLQUFLSCxZQUFMLENBQWtCRyxNQUFsQixHQUEyQixLQUEzQjs7TUFDQSxJQUFHaUIsTUFBTSxJQUFJLEtBQUtGLFNBQWxCLEVBQTRCO1FBQ3pCLEtBQUtqQixVQUFMLENBQWdCRSxNQUFoQixHQUF5QixJQUF6QjtRQUNBLEtBQUtDLGdCQUFMLEdBQXdCLEVBQXhCO1FBQ0EsS0FBS2UsYUFBTCxDQUFtQixFQUFuQjtNQUNGO0lBQ0gsQ0FUNkMsQ0FTNUNULElBVDRDLENBU3ZDLElBVHVDLENBQTlDLEVBcEVRLENBK0VSOztJQUNBLEtBQUtKLElBQUwsQ0FBVUMsRUFBVixDQUFhLHlCQUFiLEVBQXdDLFVBQVNpQixJQUFULEVBQWU7TUFDcEQsSUFBR0EsSUFBSSxDQUFDTixTQUFMLElBQWtCLEtBQUtBLFNBQTFCLEVBQW9DO1FBQ2pDLEtBQUtkLGdCQUFMLEdBQXdCb0IsSUFBSSxDQUFDQyxLQUE3QjtRQUNBLEtBQUtOLGFBQUwsQ0FBbUJLLElBQUksQ0FBQ0MsS0FBeEI7TUFDRjtJQUNILENBTHVDLENBS3RDZixJQUxzQyxDQUtqQyxJQUxpQyxDQUF4QyxFQWhGUSxDQXVGUjs7SUFDQSxLQUFLSixJQUFMLENBQVVDLEVBQVYsQ0FBYSxxQkFBYixFQUFvQyxVQUFTaUIsSUFBVCxFQUFlO01BQ2hELEtBQUtFLGtCQUFMLENBQXdCRixJQUF4QjtJQUNGLENBRm1DLENBRWxDZCxJQUZrQyxDQUU3QixJQUY2QixDQUFwQyxFQXhGUSxDQTRGUjs7SUFDQSxLQUFLSixJQUFMLENBQVVDLEVBQVYsQ0FBYSxzQkFBYixFQUFxQyxVQUFTaUIsSUFBVCxFQUFlO01BQ2pELEtBQUtHLG1CQUFMLENBQXlCSCxJQUF6QjtJQUNGLENBRm9DLENBRW5DZCxJQUZtQyxDQUU5QixJQUY4QixDQUFyQyxFQTdGUSxDQWlHUjs7SUFDQSxLQUFLSixJQUFMLENBQVVDLEVBQVYsQ0FBYSx3QkFBYixFQUF1QyxVQUFTaUIsSUFBVCxFQUFlO01BQ25EO01BQ0EsSUFBSSxLQUFLSSxVQUFMLEtBQW9CLENBQXhCLEVBQTJCO1FBQ3hCLElBQUksS0FBS2xDLFVBQVQsRUFBcUI7VUFDbEIsS0FBS0EsVUFBTCxDQUFnQm1DLE1BQWhCLEdBQXlCWixNQUFNLENBQUNPLElBQUksQ0FBQ00sU0FBTixDQUEvQjtRQUNGO01BQ0g7SUFDSCxDQVBzQyxDQU9yQ3BCLElBUHFDLENBT2hDLElBUGdDLENBQXZDO0VBUUQsQ0FwSUk7RUFzSUxxQixLQXRJSyxtQkFzSUksQ0FDUixDQXZJSTs7RUF5SUw7QUFDSjtBQUNBO0VBQ0loQixjQUFjLEVBQUUsd0JBQVNKLFFBQVQsRUFBbUI7SUFDL0IsSUFBSUcsVUFBVSxHQUFHLElBQWpCOztJQUVBLElBQUlILFFBQVEsQ0FBQ3FCLE1BQVQsSUFBbUJyQixRQUFRLENBQUNxQixNQUFULENBQWdCQyxhQUF2QyxFQUFzRDtNQUNsRCxJQUFJQyxVQUFVLEdBQUd2QixRQUFRLENBQUNxQixNQUFULENBQWdCQyxhQUFoQixFQUFqQjs7TUFDQSxJQUFJQyxVQUFVLElBQUlBLFVBQVUsQ0FBQ0MsRUFBN0IsRUFBaUM7UUFDN0JyQixVQUFVLEdBQUdvQixVQUFVLENBQUNDLEVBQXhCO01BQ0g7SUFDSjs7SUFFRCxJQUFJLENBQUNyQixVQUFELElBQWVILFFBQVEsQ0FBQ3lCLFVBQXhCLElBQXNDekIsUUFBUSxDQUFDeUIsVUFBVCxDQUFvQkMsY0FBOUQsRUFBOEU7TUFDMUV2QixVQUFVLEdBQUdILFFBQVEsQ0FBQ3lCLFVBQVQsQ0FBb0JDLGNBQWpDO0lBQ0g7O0lBRUQsSUFBSSxDQUFDdkIsVUFBRCxJQUFlSCxRQUFRLENBQUN5QixVQUF4QixJQUFzQ3pCLFFBQVEsQ0FBQ3lCLFVBQVQsQ0FBb0JFLFNBQTlELEVBQXlFO01BQ3JFeEIsVUFBVSxHQUFHSCxRQUFRLENBQUN5QixVQUFULENBQW9CRSxTQUFqQztJQUNIOztJQUVELE9BQU9yQixNQUFNLENBQUNILFVBQVUsSUFBSSxFQUFmLENBQWI7RUFDSCxDQS9KSTtFQWlLTHlCLFNBaktLLHFCQWlLS2YsSUFqS0wsRUFpS1dnQixLQWpLWCxFQWlLa0I7SUFDckIsSUFBSTdCLFFBQVEsR0FBRzFDLE1BQU0sQ0FBQzBDLFFBQXRCO0lBRUEsS0FBS08sU0FBTCxHQUFpQk0sSUFBSSxDQUFDTixTQUF0QjtJQUNBLEtBQUtVLFVBQUwsR0FBa0JZLEtBQWxCLENBSnFCLENBTXJCOztJQUNBLElBQUk3QixRQUFRLElBQUlBLFFBQVEsQ0FBQ3lCLFVBQXJCLElBQW1DLENBQUN6QixRQUFRLENBQUN5QixVQUFULENBQW9CQyxjQUE1RCxFQUE0RTtNQUN4RSxJQUFJMUIsUUFBUSxDQUFDcUIsTUFBVCxJQUFtQnJCLFFBQVEsQ0FBQ3FCLE1BQVQsQ0FBZ0JDLGFBQXZDLEVBQXNEO1FBQ2xELElBQUlDLFVBQVUsR0FBR3ZCLFFBQVEsQ0FBQ3FCLE1BQVQsQ0FBZ0JDLGFBQWhCLEVBQWpCOztRQUNBLElBQUlDLFVBQVUsSUFBSUEsVUFBVSxDQUFDQyxFQUE3QixFQUFpQztVQUM3QnhCLFFBQVEsQ0FBQ3lCLFVBQVQsQ0FBb0JDLGNBQXBCLEdBQXFDSCxVQUFVLENBQUNDLEVBQWhEO1FBQ0g7TUFDSjtJQUNKOztJQUVELEtBQUsxRCxhQUFMLENBQW1CNkIsSUFBbkIsQ0FBd0JILE1BQXhCLEdBQWlDLEtBQWpDO0lBQ0EsS0FBS3hCLGNBQUwsQ0FBb0JrRCxNQUFwQixHQUE2QkwsSUFBSSxDQUFDaUIsU0FBTCxJQUFtQixRQUFRRCxLQUFLLEdBQUcsQ0FBaEIsQ0FBaEQsQ0FqQnFCLENBbUJyQjtJQUNBOztJQUNBLElBQUlFLFlBQVksR0FBRyxDQUFuQjtJQUNBLElBQUlDLFdBQVcsR0FBR25CLElBQUksQ0FBQ29CLGFBQUwsS0FBdUIsQ0FBdkIsSUFBNEIsS0FBS0MsWUFBbkQ7O0lBRUEsSUFBSUYsV0FBSixFQUFpQjtNQUNiO01BQ0EsSUFBSW5CLElBQUksQ0FBQ3NCLFVBQUwsS0FBb0JDLFNBQXBCLElBQWlDdkIsSUFBSSxDQUFDc0IsVUFBTCxLQUFvQixJQUF6RCxFQUErRDtRQUMzREosWUFBWSxHQUFHbEIsSUFBSSxDQUFDc0IsVUFBcEI7UUFDQWxDLE9BQU8sQ0FBQ29DLEdBQVIsQ0FBWSwrQkFBWixFQUE2Q3hCLElBQUksQ0FBQ2lCLFNBQWxELEVBQTZELGFBQTdELEVBQTRFakIsSUFBSSxDQUFDc0IsVUFBakYsRUFBNkYsS0FBN0YsRUFBb0d0QixJQUFJLENBQUN5QixTQUF6RztNQUNILENBSEQsTUFHTyxJQUFJekIsSUFBSSxDQUFDMEIsVUFBTCxLQUFvQkgsU0FBcEIsSUFBaUN2QixJQUFJLENBQUMwQixVQUFMLEtBQW9CLElBQXpELEVBQStEO1FBQ2xFUixZQUFZLEdBQUdsQixJQUFJLENBQUMwQixVQUFwQjtRQUNBdEMsT0FBTyxDQUFDb0MsR0FBUixDQUFZLG1DQUFaLEVBQWlEeEIsSUFBSSxDQUFDaUIsU0FBdEQsRUFBaUUsYUFBakUsRUFBZ0ZqQixJQUFJLENBQUMwQixVQUFyRjtNQUNILENBSE0sTUFHQSxJQUFJMUIsSUFBSSxDQUFDMkIsVUFBTCxLQUFvQkosU0FBcEIsSUFBaUN2QixJQUFJLENBQUMyQixVQUFMLEtBQW9CLElBQXpELEVBQStEO1FBQ2xFVCxZQUFZLEdBQUdsQixJQUFJLENBQUMyQixVQUFwQjtRQUNBdkMsT0FBTyxDQUFDb0MsR0FBUixDQUFZLHNEQUFaLEVBQW9FeEIsSUFBSSxDQUFDMkIsVUFBekU7TUFDSDtJQUNKLENBWkQsTUFZTztNQUNIO01BQ0EsSUFBSTNCLElBQUksQ0FBQzJCLFVBQUwsS0FBb0JKLFNBQXBCLElBQWlDdkIsSUFBSSxDQUFDMkIsVUFBTCxLQUFvQixJQUF6RCxFQUErRDtRQUMzRFQsWUFBWSxHQUFHbEIsSUFBSSxDQUFDMkIsVUFBcEI7TUFDSCxDQUZELE1BRU8sSUFBSTNCLElBQUksQ0FBQzRCLFNBQUwsS0FBbUJMLFNBQW5CLElBQWdDdkIsSUFBSSxDQUFDNEIsU0FBTCxLQUFtQixJQUF2RCxFQUE2RDtRQUNoRVYsWUFBWSxHQUFHbEIsSUFBSSxDQUFDNEIsU0FBcEI7TUFDSDs7TUFDRHhDLE9BQU8sQ0FBQ29DLEdBQVIsQ0FBWSw0QkFBWixFQUEwQ3hCLElBQUksQ0FBQ2lCLFNBQS9DLEVBQTBELGFBQTFELEVBQXlFakIsSUFBSSxDQUFDMkIsVUFBOUUsRUFBMEYsT0FBMUYsRUFBbUdULFlBQW5HO0lBQ0g7O0lBRUQsS0FBSzVELGlCQUFMLENBQXVCK0MsTUFBdkIsR0FBZ0NaLE1BQU0sQ0FBQ3lCLFlBQUQsQ0FBdEM7SUFDQSxLQUFLRyxZQUFMLEdBQW9CRixXQUFwQixDQS9DcUIsQ0ErQ1c7O0lBQ2hDLEtBQUtVLFVBQUwsR0FBa0JYLFlBQWxCLENBaERxQixDQWdEVTs7SUFDL0IsS0FBS1ksU0FBTCxHQUFpQjlCLElBQUksQ0FBQ3lCLFNBQUwsSUFBa0IsRUFBbkMsQ0FqRHFCLENBaURpQjs7SUFDdEMsS0FBSzVDLGFBQUwsR0FBcUIsRUFBckIsQ0FsRHFCLENBb0RyQjs7SUFDQSxJQUFJa0QsT0FBTyxHQUFHL0IsSUFBSSxDQUFDZ0MsT0FBTCxJQUFnQmhDLElBQUksQ0FBQ2lDLEtBQXJCLElBQThCakMsSUFBSSxDQUFDa0MsT0FBbkMsSUFBOEMsS0FBNUQ7O0lBQ0EsSUFBR0gsT0FBTyxJQUFJLElBQVgsSUFBbUJBLE9BQU8sS0FBSyxNQUEvQixJQUF5Q0EsT0FBTyxLQUFLLENBQXhELEVBQTBEO01BQ3hELEtBQUtyRSxVQUFMLENBQWdCaUIsTUFBaEIsR0FBeUIsSUFBekI7SUFDRCxDQUZELE1BRU87TUFDTCxLQUFLakIsVUFBTCxDQUFnQmlCLE1BQWhCLEdBQXlCLEtBQXpCO0lBQ0QsQ0ExRG9CLENBNERyQjs7O0lBQ0EsSUFBSXFDLEtBQUssSUFBSSxDQUFiLEVBQWdCO01BQ2Q7TUFDQSxJQUFJLEtBQUtuRCxTQUFULEVBQW9CO1FBQ2xCLEtBQUtBLFNBQUwsQ0FBZWMsTUFBZixHQUF3QixLQUF4QjtNQUNELENBSmEsQ0FLZDs7O01BQ0EsSUFBSSxLQUFLdkIsYUFBVCxFQUF3QjtRQUN0QixLQUFLQSxhQUFMLENBQW1CMEIsSUFBbkIsQ0FBd0JxRCxDQUF4QixHQUE0QixFQUE1QjtRQUNBLEtBQUsvRSxhQUFMLENBQW1CMEIsSUFBbkIsQ0FBd0JzRCxDQUF4QixHQUE0QixFQUE1QjtNQUNEOztNQUNELElBQUksS0FBSzNFLFNBQVQsRUFBb0I7UUFDbEIsS0FBS0EsU0FBTCxDQUFlcUIsSUFBZixDQUFvQnFELENBQXBCLEdBQXdCLEVBQXhCO1FBQ0EsS0FBSzFFLFNBQUwsQ0FBZXFCLElBQWYsQ0FBb0JzRCxDQUFwQixHQUF3QixFQUF4QjtNQUNELENBYmEsQ0FjZDs7O01BQ0EsSUFBSSxLQUFLakYsY0FBTCxJQUF1QixLQUFLQSxjQUFMLENBQW9CMkIsSUFBL0MsRUFBcUQ7UUFDbkQ7UUFDQSxLQUFLM0IsY0FBTCxDQUFvQjJCLElBQXBCLENBQXlCdUQsT0FBekIsR0FBbUMsR0FBbkM7UUFDQSxLQUFLbEYsY0FBTCxDQUFvQjJCLElBQXBCLENBQXlCd0QsT0FBekIsR0FBbUMsR0FBbkMsQ0FIbUQsQ0FJbkQ7O1FBQ0EsS0FBS25GLGNBQUwsQ0FBb0IyQixJQUFwQixDQUF5QnFELENBQXpCLEdBQTZCLEVBQTdCO1FBQ0EsS0FBS2hGLGNBQUwsQ0FBb0IyQixJQUFwQixDQUF5QnNELENBQXpCLEdBQTZCLEVBQTdCO01BQ0QsQ0F0QmEsQ0F1QmQ7OztNQUNBLElBQUksS0FBSzlFLGlCQUFMLElBQTBCLEtBQUtBLGlCQUFMLENBQXVCd0IsSUFBckQsRUFBMkQ7UUFDekQ7UUFDQSxLQUFLeEIsaUJBQUwsQ0FBdUJ3QixJQUF2QixDQUE0QnVELE9BQTVCLEdBQXNDLEdBQXRDO1FBQ0EsS0FBSy9FLGlCQUFMLENBQXVCd0IsSUFBdkIsQ0FBNEJ3RCxPQUE1QixHQUFzQyxHQUF0QyxDQUh5RCxDQUl6RDs7UUFDQSxLQUFLaEYsaUJBQUwsQ0FBdUJ3QixJQUF2QixDQUE0QnFELENBQTVCLEdBQWdDLEVBQWhDO1FBQ0EsS0FBSzdFLGlCQUFMLENBQXVCd0IsSUFBdkIsQ0FBNEJzRCxDQUE1QixHQUFnQyxDQUFDLEVBQWpDO01BQ0QsQ0EvQmEsQ0FnQ2Q7OztNQUNBLElBQUksS0FBSzdFLGdCQUFULEVBQTJCO1FBQ3pCLEtBQUtBLGdCQUFMLENBQXNCNEUsQ0FBdEIsR0FBMEIsRUFBMUI7UUFDQSxLQUFLNUUsZ0JBQUwsQ0FBc0I2RSxDQUF0QixHQUEwQixDQUFDLEVBQTNCO01BQ0QsQ0FwQ2EsQ0FxQ2Q7OztNQUNBLElBQUksS0FBSzFFLFVBQVQsRUFBcUI7UUFDbkIsS0FBS0EsVUFBTCxDQUFnQnlFLENBQWhCLEdBQW9CLEdBQXBCO1FBQ0EsS0FBS3pFLFVBQUwsQ0FBZ0IwRSxDQUFoQixHQUFvQixDQUFwQjtNQUNELENBekNhLENBMENkOzs7TUFDQSxJQUFJLEtBQUszRCxVQUFULEVBQXFCO1FBQ25CLEtBQUtBLFVBQUwsQ0FBZ0IwRCxDQUFoQixHQUFvQixHQUFwQjtRQUNBLEtBQUsxRCxVQUFMLENBQWdCMkQsQ0FBaEIsR0FBb0IsQ0FBcEI7TUFDRDtJQUNGLENBNUdvQixDQThHckI7OztJQUNBLElBQUksS0FBS2hGLGFBQUwsSUFBc0IsS0FBS0ssU0FBL0IsRUFBMEM7TUFDdEMsS0FBS0EsU0FBTCxDQUFlcUIsSUFBZixDQUFvQnlELE1BQXBCLEdBQTZCLENBQTdCO01BQ0EsS0FBS25GLGFBQUwsQ0FBbUIwQixJQUFuQixDQUF3QnlELE1BQXhCLEdBQWlDLEdBQWpDO01BQ0EsS0FBSzlFLFNBQUwsQ0FBZXFCLElBQWYsQ0FBb0IwRCxNQUFwQixDQUEyQkMsZUFBM0I7SUFDSCxDQW5Ib0IsQ0FxSHJCO0lBQ0E7OztJQUNBLElBQUlDLFNBQVMsR0FBRzFDLElBQUksQ0FBQzJDLE1BQUwsSUFBZTNDLElBQUksQ0FBQzBDLFNBQXBCLElBQWlDMUMsSUFBSSxDQUFDNEMsU0FBdEMsSUFBbUQsVUFBbkU7O0lBQ0EsS0FBS0MsV0FBTCxDQUFpQkgsU0FBakIsRUF4SHFCLENBMEhyQjs7O0lBQ0EsS0FBSzVELElBQUwsQ0FBVUMsRUFBVixDQUFhLHFCQUFiLEVBQW9DLFVBQVNDLEtBQVQsRUFBZ0I7TUFDaEQsSUFBSVksTUFBTSxHQUFHWixLQUFiO01BQ0EsSUFBSThELGFBQWEsR0FBRyxFQUFwQjs7TUFDQSxJQUFJLE9BQU9sRCxNQUFQLEtBQWtCLFFBQWxCLElBQThCQSxNQUFNLEtBQUssSUFBN0MsRUFBbUQ7UUFDL0NrRCxhQUFhLEdBQUdsRCxNQUFNLENBQUNtRCxTQUFQLElBQW9CbkQsTUFBTSxDQUFDb0QsUUFBM0IsSUFBdUNwRCxNQUFNLENBQUNlLEVBQTlDLElBQW9ELEVBQXBFO01BQ0gsQ0FGRCxNQUVPO1FBQ0htQyxhQUFhLEdBQUdsRCxNQUFoQjtNQUNIOztNQUVELElBQUdrRCxhQUFhLElBQUksS0FBS3BELFNBQXpCLEVBQW1DO1FBQy9CLEtBQUtoQyxVQUFMLENBQWdCaUIsTUFBaEIsR0FBeUIsSUFBekI7TUFDSDtJQUNKLENBWm1DLENBWWxDTyxJQVprQyxDQVk3QixJQVo2QixDQUFwQyxFQTNIcUIsQ0F5SXJCO0lBQ0E7O0lBQ0EsS0FBS0osSUFBTCxDQUFVQyxFQUFWLENBQWEseUJBQWIsRUFBd0MsVUFBU0MsS0FBVCxFQUFnQjtNQUVwRDtNQUNBLElBQUlnRSxRQUFRLEdBQUdoRSxLQUFmO01BQ0EsSUFBSWlFLE9BQU8sR0FBRyxFQUFkLENBSm9ELENBSWxDOztNQUVsQixJQUFJLE9BQU9qRSxLQUFQLEtBQWlCLFFBQWpCLElBQTZCQSxLQUFLLEtBQUssSUFBM0MsRUFBaUQ7UUFDN0NnRSxRQUFRLEdBQUdoRSxLQUFLLENBQUMrRCxTQUFqQjtRQUNBRSxPQUFPLEdBQUdqRSxLQUFLLENBQUNpRSxPQUFOLElBQWlCLEVBQTNCO01BQ0gsQ0FUbUQsQ0FXcEQ7OztNQUNBLEtBQUtDLGNBQUwsR0FBc0JELE9BQXRCOztNQUVBLElBQUdELFFBQVEsSUFBSSxLQUFLdEQsU0FBcEIsRUFBOEI7UUFDNUIsS0FBS3pCLGdCQUFMLENBQXNCVSxNQUF0QixHQUErQixJQUEvQjs7UUFDQSxJQUFJLEtBQUtULFVBQVQsRUFBcUI7VUFDbkIsS0FBS0EsVUFBTCxDQUFnQm1DLE1BQWhCLEdBQXlCWixNQUFNLENBQUN3RCxPQUFELENBQS9CO1FBQ0Q7TUFDRjtJQUNKLENBcEJ1QyxDQW9CdEMvRCxJQXBCc0MsQ0FvQmpDLElBcEJpQyxDQUF4QyxFQTNJcUIsQ0FpS3JCOztJQUNBLEtBQUtnRSxjQUFMLEdBQXNCLEVBQXRCOztJQUVBLElBQUdsQyxLQUFLLElBQUksQ0FBWixFQUFjO01BQ1osS0FBS25ELFNBQUwsQ0FBZXNFLENBQWYsR0FBbUIsQ0FBQyxLQUFLdEUsU0FBTCxDQUFlc0UsQ0FBaEIsR0FBb0IsRUFBdkM7SUFDRDtFQUNGLENBeFVJO0VBMFVMZ0IsZ0JBQWdCLEVBQUUsMEJBQVNDLFdBQVQsRUFBc0I7SUFDcEMsSUFBSSxDQUFDLEtBQUszRixTQUFOLElBQW1CLENBQUMyRixXQUF4QixFQUFxQztJQUNyQyxLQUFLM0YsU0FBTCxDQUFlNEYsT0FBZixHQUF5QixJQUF6QjtJQUNBLEtBQUs1RixTQUFMLENBQWUyRixXQUFmLEdBQTZCQSxXQUE3QjtJQUNBLEtBQUszRixTQUFMLENBQWVxQixJQUFmLENBQW9Cd0UsY0FBcEIsQ0FBbUMsRUFBbkMsRUFBdUMsRUFBdkM7SUFDQSxLQUFLN0YsU0FBTCxDQUFlcUIsSUFBZixDQUFvQnlFLEtBQXBCLEdBQTRCLENBQTVCO0VBQ0gsQ0FoVkk7O0VBa1ZMO0FBQ0o7QUFDQTtBQUNBO0VBQ0lWLFdBQVcsRUFBRSxxQkFBU0gsU0FBVCxFQUFvQjtJQUM3QixJQUFJYyxJQUFJLEdBQUcsSUFBWDs7SUFFQSxJQUFJLENBQUMsS0FBSy9GLFNBQVYsRUFBcUI7TUFDakIyQixPQUFPLENBQUNxRSxJQUFSLENBQWEsaUNBQWI7TUFDQTtJQUNILENBTjRCLENBUTdCOzs7SUFDQSxJQUFJLENBQUNmLFNBQUQsSUFBY0EsU0FBUyxLQUFLLEVBQWhDLEVBQW9DO01BQ2hDLEtBQUtnQixrQkFBTDs7TUFDQTtJQUNILENBWjRCLENBYzdCOzs7SUFDQSxJQUFJaEIsU0FBUyxDQUFDaUIsT0FBVixDQUFrQixTQUFsQixNQUFpQyxDQUFqQyxJQUFzQ2pCLFNBQVMsQ0FBQ2lCLE9BQVYsQ0FBa0IsVUFBbEIsTUFBa0MsQ0FBNUUsRUFBK0U7TUFDM0U7TUFDQXZFLE9BQU8sQ0FBQ29DLEdBQVIsQ0FBWSwyQkFBWixFQUF5Q2tCLFNBQXpDO01BQ0E3RixFQUFFLENBQUMrRyxZQUFILENBQWdCQyxVQUFoQixDQUEyQm5CLFNBQTNCLEVBQXNDO1FBQUVvQixHQUFHLEVBQUU7TUFBUCxDQUF0QyxFQUF1RCxVQUFTQyxHQUFULEVBQWNDLE9BQWQsRUFBdUI7UUFDMUUsSUFBSUQsR0FBRyxJQUFJLENBQUNDLE9BQVosRUFBcUI7VUFDakI1RSxPQUFPLENBQUNxRSxJQUFSLENBQWEsb0NBQWIsRUFBbURNLEdBQW5EOztVQUNBUCxJQUFJLENBQUNFLGtCQUFMOztVQUNBO1FBQ0g7O1FBQ0QsSUFBSTtVQUNBLElBQUlOLFdBQVcsR0FBRyxJQUFJdkcsRUFBRSxDQUFDdUIsV0FBUCxDQUFtQjRGLE9BQW5CLENBQWxCOztVQUNBLElBQUlaLFdBQUosRUFBaUI7WUFDYkksSUFBSSxDQUFDTCxnQkFBTCxDQUFzQkMsV0FBdEI7O1lBQ0FoRSxPQUFPLENBQUNvQyxHQUFSLENBQVksNEJBQVo7VUFDSDtRQUNKLENBTkQsQ0FNRSxPQUFPeUMsQ0FBUCxFQUFVO1VBQ1I3RSxPQUFPLENBQUNxRSxJQUFSLENBQWEsb0NBQWIsRUFBbURRLENBQW5EOztVQUNBVCxJQUFJLENBQUNFLGtCQUFMO1FBQ0g7TUFDSixDQWhCRDtJQWlCSCxDQXBCRCxNQW9CTztNQUNIO01BQ0F0RSxPQUFPLENBQUNvQyxHQUFSLENBQVksMkJBQVosRUFBeUNrQixTQUF6QztNQUNBLElBQUl3QixTQUFTLEdBQUcsa0JBQWtCeEIsU0FBbEM7TUFDQTdGLEVBQUUsQ0FBQ3NILE1BQUgsQ0FBVUMsT0FBVixDQUFrQkYsU0FBbEIsRUFBNkJySCxFQUFFLENBQUN1QixXQUFoQyxFQUE2QyxVQUFTMkYsR0FBVCxFQUFjWCxXQUFkLEVBQTJCO1FBQ3BFLElBQUlXLEdBQUcsSUFBSSxDQUFDWCxXQUFaLEVBQXlCO1VBQ3JCaEUsT0FBTyxDQUFDcUUsSUFBUixDQUFhLG9DQUFiLEVBQW1ETSxHQUFuRDs7VUFDQVAsSUFBSSxDQUFDRSxrQkFBTDs7VUFDQTtRQUNIOztRQUNERixJQUFJLENBQUNMLGdCQUFMLENBQXNCQyxXQUF0Qjs7UUFDQWhFLE9BQU8sQ0FBQ29DLEdBQVIsQ0FBWSw0QkFBWjtNQUNILENBUkQ7SUFTSDtFQUNKLENBdllJOztFQXlZTDtBQUNKO0FBQ0E7RUFDSWtDLGtCQUFrQixFQUFFLDhCQUFXO0lBQzNCLElBQUlGLElBQUksR0FBRyxJQUFYO0lBQ0EzRyxFQUFFLENBQUNzSCxNQUFILENBQVVDLE9BQVYsQ0FBa0IsdUJBQWxCLEVBQTJDdkgsRUFBRSxDQUFDdUIsV0FBOUMsRUFBMkQsVUFBUzJGLEdBQVQsRUFBY1gsV0FBZCxFQUEyQjtNQUNsRixJQUFJLENBQUNXLEdBQUQsSUFBUVgsV0FBWixFQUF5QjtRQUNyQkksSUFBSSxDQUFDTCxnQkFBTCxDQUFzQkMsV0FBdEI7TUFDSDtJQUNKLENBSkQ7RUFLSCxDQW5aSTtFQXFaTDtFQUNBO0VBQ0E7O0VBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtFQUNJekQsYUFBYSxFQUFFLHVCQUFTTSxLQUFULEVBQWdCO0lBRTNCO0lBQ0EsSUFBSSxLQUFLRyxVQUFMLEtBQW9CLENBQXhCLEVBQTJCO01BQ3ZCO0lBQ0g7O0lBRUQsSUFBSSxDQUFDLEtBQUt2QyxTQUFWLEVBQXFCO01BQ2pCdUIsT0FBTyxDQUFDQyxLQUFSLENBQWMsZ0NBQWQ7TUFDQTtJQUNILENBVjBCLENBWTNCOzs7SUFDQSxLQUFLeEIsU0FBTCxDQUFlb0IsaUJBQWYsQ0FBaUMsSUFBakM7SUFDQSxLQUFLSixhQUFMLEdBQXFCLEVBQXJCOztJQUVBLElBQUlvQixLQUFLLElBQUksQ0FBYixFQUFnQjtNQUNaLEtBQUtwQyxTQUFMLENBQWVjLE1BQWYsR0FBd0IsS0FBeEI7TUFDQSxLQUFLQyxnQkFBTCxHQUF3QixDQUF4QjtNQUNBO0lBQ0g7O0lBRUQsS0FBS2YsU0FBTCxDQUFlYyxNQUFmLEdBQXdCLElBQXhCO0lBQ0EsS0FBS0MsZ0JBQUwsR0FBd0JxQixLQUF4Qjs7SUFFQSxJQUFJLENBQUMsS0FBS25DLFdBQVYsRUFBdUI7TUFDbkJzQixPQUFPLENBQUNDLEtBQVIsQ0FBYyxrQ0FBZDtNQUNBO0lBQ0gsQ0E1QjBCLENBOEIzQjs7O0lBQ0EsS0FBSyxJQUFJZ0YsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR3BFLEtBQXBCLEVBQTJCb0UsQ0FBQyxFQUE1QixFQUFnQztNQUM1QixJQUFJQyxJQUFJLEdBQUd6SCxFQUFFLENBQUMwSCxXQUFILENBQWUsS0FBS3pHLFdBQXBCLENBQVg7TUFDQSxJQUFJLENBQUN3RyxJQUFMLEVBQVc7TUFFWEEsSUFBSSxDQUFDZixLQUFMLEdBQWEsR0FBYjtNQUNBZSxJQUFJLENBQUM5QixNQUFMLEdBQWMsS0FBSzNFLFNBQW5CO01BQ0F5RyxJQUFJLENBQUMzRixNQUFMLEdBQWMsSUFBZCxDQU40QixDQVE1Qjs7TUFDQSxJQUFJNkYsTUFBTSxHQUFHRixJQUFJLENBQUNFLE1BQWxCO01BQ0FGLElBQUksQ0FBQ2xDLENBQUwsR0FBUyxDQUFDbkMsS0FBSyxHQUFHLENBQVQsSUFBYyxHQUFkLEdBQW9CdUUsTUFBcEIsR0FBNkIsR0FBN0IsR0FBbUMsR0FBbkMsR0FBeUNBLE1BQU0sR0FBRyxHQUFULEdBQWUsR0FBZixHQUFxQkgsQ0FBdkU7TUFDQUMsSUFBSSxDQUFDbkMsQ0FBTCxHQUFTLENBQVQ7TUFFQSxLQUFLdEQsYUFBTCxDQUFtQjRGLElBQW5CLENBQXdCSCxJQUF4QjtJQUNIO0VBRUosQ0E3Y0k7RUErY0w7RUFDQTtFQUNBOztFQUVBO0FBQ0o7QUFDQTtBQUNBO0VBQ0lwRSxrQkFBa0IsRUFBRSw0QkFBU0YsSUFBVCxFQUFlO0lBRS9CO0lBQ0EsSUFBSUEsSUFBSSxDQUFDRCxLQUFMLEtBQWUsU0FBbkIsRUFBOEI7TUFDMUI7TUFDQSxJQUFJLEtBQUtwQyxZQUFULEVBQXVCO1FBQ25CLEtBQUtBLFlBQUwsQ0FBa0JnQixNQUFsQixHQUEyQixJQUEzQjtNQUNIO0lBQ0osQ0FMRCxNQUtPLElBQUlxQixJQUFJLENBQUNELEtBQUwsS0FBZSxPQUFuQixFQUE0QjtNQUMvQjtNQUNBLElBQUksS0FBS25DLFlBQVQsRUFBdUI7UUFDbkIsS0FBS0EsWUFBTCxDQUFrQmUsTUFBbEIsR0FBMkIsSUFBM0I7TUFDSCxDQUo4QixDQUsvQjs7O01BQ0EsSUFBSSxDQUFDLEtBQUtmLFlBQU4sSUFBc0IsS0FBS0QsWUFBL0IsRUFBNkM7UUFDekMsS0FBS0EsWUFBTCxDQUFrQmdCLE1BQWxCLEdBQTJCLElBQTNCO01BQ0g7SUFDSixDQVRNLE1BU0EsSUFBSXFCLElBQUksQ0FBQ0QsS0FBTCxLQUFlLFFBQW5CLEVBQTZCO01BQ2hDO01BQ0EsSUFBSSxLQUFLcEMsWUFBVCxFQUF1QjtRQUNuQixLQUFLQSxZQUFMLENBQWtCZ0IsTUFBbEIsR0FBMkIsS0FBM0I7TUFDSDs7TUFDRCxJQUFJLEtBQUtmLFlBQVQsRUFBdUI7UUFDbkIsS0FBS0EsWUFBTCxDQUFrQmUsTUFBbEIsR0FBMkIsS0FBM0I7TUFDSDtJQUNKLENBekI4QixDQTJCL0I7OztJQUNBLElBQUlxQixJQUFJLENBQUMwRSxXQUFMLEtBQXFCbkQsU0FBekIsRUFBb0M7TUFDaEMsS0FBSzNDLGdCQUFMLEdBQXdCb0IsSUFBSSxDQUFDMEUsV0FBN0I7TUFDQSxLQUFLL0UsYUFBTCxDQUFtQkssSUFBSSxDQUFDMEUsV0FBeEI7SUFDSCxDQS9COEIsQ0FpQy9COzs7SUFDQSxJQUFJMUUsSUFBSSxDQUFDMkUsV0FBTCxLQUFxQnBELFNBQXJCLElBQWtDdkIsSUFBSSxDQUFDMkUsV0FBTCxLQUFxQixJQUEzRCxFQUFpRTtNQUM3RCxJQUFJLEtBQUtsRyxVQUFULEVBQXFCO1FBQ2pCLEtBQUtBLFVBQUwsQ0FBZ0JFLE1BQWhCLEdBQXlCLElBQXpCO01BQ0g7SUFDSjtFQUNKLENBOWZJOztFQWdnQkw7QUFDSjtBQUNBO0FBQ0E7RUFDSXdCLG1CQUFtQixFQUFFLDZCQUFTSCxJQUFULEVBQWU7SUFDaEM7SUFDQSxJQUFJQSxJQUFJLENBQUMrQyxTQUFMLEtBQW1CLEtBQUtyRCxTQUE1QixFQUF1QztNQUNuQztJQUNIOztJQUVELElBQUlNLElBQUksQ0FBQzRFLFVBQVQsRUFBcUI7TUFDakI7TUFDQSxJQUFJLEtBQUtoSCxZQUFULEVBQXVCO1FBQ25CLEtBQUtBLFlBQUwsQ0FBa0JlLE1BQWxCLEdBQTJCLElBQTNCO01BQ0gsQ0FKZ0IsQ0FLakI7OztNQUNBLElBQUksQ0FBQyxLQUFLZixZQUFOLElBQXNCLEtBQUtELFlBQS9CLEVBQTZDO1FBQ3pDLEtBQUtBLFlBQUwsQ0FBa0JnQixNQUFsQixHQUEyQixJQUEzQjtNQUNIO0lBQ0osQ0FURCxNQVNPO01BQ0g7TUFDQSxJQUFJLEtBQUtmLFlBQVQsRUFBdUI7UUFDbkIsS0FBS0EsWUFBTCxDQUFrQmUsTUFBbEIsR0FBMkIsS0FBM0I7TUFDSCxDQUpFLENBS0g7OztNQUNBLElBQUksS0FBS2hCLFlBQVQsRUFBdUI7UUFDbkIsS0FBS0EsWUFBTCxDQUFrQmdCLE1BQWxCLEdBQTJCLEtBQTNCO01BQ0g7SUFDSjtFQUNKO0FBN2hCSSxDQUFUIiwic291cmNlUm9vdCI6Ii8iLCJzb3VyY2VzQ29udGVudCI6WyIvLyDkvb/nlKjlhajlsYDlj5jph4/vvIzkuI3kvb/nlKggcmVxdWlyZVxuLy8g44CQ5L+u5aSN54mI5pys44CR566A5YyW5a+55omL54mM6IOM5pi+56S677yM55u05o6l5Yib5bu6IDE3IOW8oOeJjOiDjFxuLy8g5qC45b+D5Y6f5YiZ77yaXG4vLyAxLiDmlLbliLAgcHVzaF9jYXJkX2V2ZW50IOWQjuebtOaOpeaYvuekuiAxNyDlvKDniYzog4xcbi8vIDIuIOS4jeS+nei1luWumuaXtuWZqOaIluWKqOeUu+iwg+W6plxuLy8gMy4g5L+d6K+B5pWw5o2u5q2j56Gu5oCnXG5cbnZhciBxaWFuX3N0YXRlID0gd2luZG93LnFpYW5fc3RhdGUgfHwgeyBidXFpYW5nOiAwLCBxaWFuOiAxIH1cbnZhciBpc29wZW5fc291bmQgPSB3aW5kb3cuaXNvcGVuX3NvdW5kIHx8IDFcblxuLy8g4pqg77iP44CQ5bey5Yig6Zmk44CRcGxheVJvYlNvdW5kIOWHveaVsCAtIOmfs+aViOaSreaUvue7n+S4gOeUsSBnYW1laW5nVUkuX3BsYXlSb2JTb3VuZCDlpITnkIZcblxuY2MuQ2xhc3Moe1xuICAgIGV4dGVuZHM6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgYWNjb3VudF9sYWJlbDogY2MuTGFiZWwsXG4gICAgICAgIG5pY2tuYW1lX2xhYmVsOiBjYy5MYWJlbCxcbiAgICAgICAgcm9vbV90b3V4aWFuZzogY2MuU3ByaXRlLFxuICAgICAgICBnbG9iYWxjb3VudF9sYWJlbDogY2MuTGFiZWwsXG4gICAgICAgIHJvb21fbW9uZXlfZnJhbWU6IGNjLk5vZGUsICAgICAvLyDph5HluIHog4zmma/moYZcbiAgICAgICAgaGVhZGltYWdlOiBjYy5TcHJpdGUsXG4gICAgICAgIHJlYWR5aW1hZ2U6IGNjLk5vZGUsXG4gICAgICAgIG9mZmxpbmVpbWFnZTogY2MuTm9kZSxcbiAgICAgICAgdHJ1c3RlZWltYWdlOiBjYy5Ob2RlLCAgICAgLy8g8J+Up+OAkOaJmOeuoeOAkeaJmOeuoeeKtuaAgeWbvuagh1xuICAgICAgICBjYXJkX25vZGU6IGNjLk5vZGUsXG4gICAgICAgIGNhcmRfcHJlZmFiOiBjYy5QcmVmYWIsXG4gICAgICAgIGNsb2NraW1hZ2U6IGNjLk5vZGUsXG4gICAgICAgIHFpYW5nZGlkemh1X25vZGU6IGNjLk5vZGUsXG4gICAgICAgIHRpbWVfbGFiZWw6IGNjLkxhYmVsLFxuICAgICAgICByb2JpbWFnZV9zcDogY2MuU3ByaXRlRnJhbWUsXG4gICAgICAgIHJvYm5vaW1hZ2Vfc3A6IGNjLlNwcml0ZUZyYW1lLFxuICAgICAgICByb2JJY29uU3A6IGNjLlNwcml0ZSxcbiAgICAgICAgcm9iSWNvbl9TcDogY2MuTm9kZSxcbiAgICAgICAgcm9ibm9JY29uX1NwOiBjYy5Ob2RlLFxuICAgICAgICBtYXN0ZXJJY29uOiBjYy5Ob2RlXG4gICAgfSxcblxuICAgIG9uTG9hZCAoKSB7XG4gICAgICB0aGlzLnJlYWR5aW1hZ2UuYWN0aXZlID0gZmFsc2VcbiAgICAgIHRoaXMub2ZmbGluZWltYWdlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICBpZiAodGhpcy50cnVzdGVlaW1hZ2UpIHRoaXMudHJ1c3RlZWltYWdlLmFjdGl2ZSA9IGZhbHNlICAvLyDwn5Sn44CQ5omY566h44CR5Yid5aeL5YyW5omY566h5Zu+5qCHXG4gICAgICBpZiAodGhpcy5tYXN0ZXJJY29uKSB0aGlzLm1hc3Rlckljb24uYWN0aXZlID0gZmFsc2UgIC8vIPCflKfjgJDkv67lpI3jgJHliJ3lp4vljJblnLDkuLvlm77moIfkuLrpmpDol49cbiAgICAgIHRoaXMuY3VycmVudENhcmRDb3VudCA9IDE3XG4gICAgICB0aGlzLmNhcmRsaXN0X25vZGUgPSBbXVxuICAgICAgXG4gICAgICAvLyDmuLjmiI/lvIDlp4vkuovku7ZcbiAgICAgIHRoaXMubm9kZS5vbihcImdhbWVzdGFydF9ldmVudFwiLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB0aGlzLnJlYWR5aW1hZ2UuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgaWYgKHRoaXMubWFzdGVySWNvbikgdGhpcy5tYXN0ZXJJY29uLmFjdGl2ZSA9IGZhbHNlICAvLyDwn5Sn44CQ5L+u5aSN44CR5ri45oiP5byA5aeL5pe26ZqQ6JeP5Zyw5Li75Zu+5qCHXG4gICAgICAgIGlmICh0aGlzLmNhcmRfbm9kZSkge1xuICAgICAgICAgICAgdGhpcy5jYXJkX25vZGUuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgICAgIHRoaXMuY2FyZF9ub2RlLnJlbW92ZUFsbENoaWxkcmVuKHRydWUpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jYXJkbGlzdF9ub2RlID0gW11cbiAgICAgICAgdGhpcy5jdXJyZW50Q2FyZENvdW50ID0gMTdcbiAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgLy8g44CQ5qC45b+D44CR5Y+R54mM5LqL5Lu2IC0g55u05o6l5pi+56S6IDE3IOW8oOeJjOiDjFxuICAgICAgdGhpcy5ub2RlLm9uKFwicHVzaF9jYXJkX2V2ZW50XCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBcbiAgICAgICAgaWYgKCFteWdsb2JhbCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfg48gW3BsYXllcl9ub2RlXSBwdXNoX2NhcmRfZXZlbnQ6IG15Z2xvYmFsIOS4jeWtmOWcqO+8gVwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBteVBsYXllcklkID0gdGhpcy5fZ2V0TXlQbGF5ZXJJZChteWdsb2JhbClcbiAgICAgICAgdmFyIGFjY291bnRJZFN0ciA9IFN0cmluZyh0aGlzLmFjY291bnRpZCB8fCBcIlwiKVxuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5piv6Ieq5bex77yM6Lez6L+HXG4gICAgICAgIGlmKG15UGxheWVySWQgPT09IGFjY291bnRJZFN0ciAmJiBhY2NvdW50SWRTdHIgIT09IFwiXCIpe1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuc2hvd0NhcmRCYWNrcygxNylcbiAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgLy8g5oqi5Zyw5Li75LqL5Lu2XG4gICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5omA5pyJ546p5a626IqC54K56YO96IO95pi+56S65oqi5Zyw5Li7L+S4jeaKoueKtuaAgVxuICAgICAgLy8g4pqg77iP44CQ6YeN6KaB44CR6Z+z5pWI5pKt5pS+57uf5LiA55SxIGdhbWVpbmdVSS5fcGxheVJvYlNvdW5kIOWkhOeQhu+8jOatpOWkhOS4jeWGjeaSreaUvumfs+aViFxuICAgICAgdGhpcy5ub2RlLm9uKFwicGxheWVybm9kZV9yb2Jfc3RhdGVfZXZlbnRcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICB2YXIgZGV0YWlsID0gZXZlbnRcbiAgICAgICAgICBcbiAgICAgICAgICAvLyDpmpDol4/miqLlnLDkuLvmjInpkq7vvIjlvZPliY3mk43kvZznmoTnjqnlrrbvvIlcbiAgICAgICAgICBpZihkZXRhaWwuYWNjb3VudGlkID09IHRoaXMuYWNjb3VudGlkKXtcbiAgICAgICAgICAgIHRoaXMucWlhbmdkaWR6aHVfbm9kZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHmiYDmnInnjqnlrrboioLngrnpg73mmL7npLrlr7nlupTnjqnlrrbnmoTmiqLlnLDkuLvnirbmgIFcbiAgICAgICAgICBpZih0aGlzLmFjY291bnRpZCA9PSBkZXRhaWwuYWNjb3VudGlkKXtcbiAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHmoLnmja7ova7mrKHljLrliIZcIuWPq+WcsOS4uy/kuI3lj6tcIuWSjFwi5oqi5Zyw5Li7L+S4jeaKolwiXG4gICAgICAgICAgICB2YXIgcm91bmQgPSBkZXRhaWwucm91bmQgfHwgMVxuICAgICAgICAgICAgdmFyIGlzQ2FsbCA9IGRldGFpbC5zdGF0ZSA9PSBxaWFuX3N0YXRlLnFpYW4gfHwgZGV0YWlsLnN0YXRlID09PSB0cnVlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmKGlzQ2FsbCl7XG4gICAgICAgICAgICAgIHRoaXMucm9iSWNvbl9TcC5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgIC8vIOKaoO+4j+OAkOW3suWIoOmZpOOAkemfs+aViOaSreaUvuenu+iHsyBnYW1laW5nVUkuX3BsYXlSb2JTb3VuZO+8iOacjeWKoeerr+W5v+aSreinpuWPke+8iVxuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgIHRoaXMucm9ibm9JY29uX1NwLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgICAgLy8g4pqg77iP44CQ5bey5Yig6Zmk44CR6Z+z5pWI5pKt5pS+56e76IezIGdhbWVpbmdVSS5fcGxheVJvYlNvdW5k77yI5pyN5Yqh56uv5bm/5pKt6Kem5Y+R77yJXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAvLyDmiJDkuLrlnLDkuLvkuovku7ZcbiAgICAgIHRoaXMubm9kZS5vbihcInBsYXllcm5vZGVfY2hhbmdlbWFzdGVyX2V2ZW50XCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICB2YXIgZGV0YWlsID0gZXZlbnQgXG4gICAgICAgICB0aGlzLnJvYkljb25fU3AuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgIHRoaXMucm9ibm9JY29uX1NwLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICBpZihkZXRhaWwgPT0gdGhpcy5hY2NvdW50aWQpe1xuICAgICAgICAgICAgdGhpcy5tYXN0ZXJJY29uLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgIHRoaXMuY3VycmVudENhcmRDb3VudCA9IDIwXG4gICAgICAgICAgICB0aGlzLnNob3dDYXJkQmFja3MoMjApXG4gICAgICAgICB9XG4gICAgICB9LmJpbmQodGhpcykpXG4gICAgICBcbiAgICAgIC8vIOeJjOaVsOabtOaWsOS6i+S7tlxuICAgICAgdGhpcy5ub2RlLm9uKFwidXBkYXRlX2NhcmRfY291bnRfZXZlbnRcIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgaWYoZGF0YS5hY2NvdW50aWQgPT0gdGhpcy5hY2NvdW50aWQpe1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZENvdW50ID0gZGF0YS5jb3VudFxuICAgICAgICAgICAgdGhpcy5zaG93Q2FyZEJhY2tzKGRhdGEuY291bnQpXG4gICAgICAgICB9XG4gICAgICB9LmJpbmQodGhpcykpXG4gICAgICBcbiAgICAgIC8vIOOAkOaWsOWinuOAkeeOqeWutueKtuaAgeabtOaWsOS6i+S7tu+8iOaOiee6vy/kuIrnur8v5omY566h77yJXG4gICAgICB0aGlzLm5vZGUub24oXCJwbGF5ZXJfc3RhdGVfdXBkYXRlXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgIHRoaXMuX3VwZGF0ZVBsYXllclN0YXRlKGRhdGEpXG4gICAgICB9LmJpbmQodGhpcykpXG4gICAgICBcbiAgICAgIC8vIPCflKfjgJDmiZjnrqHjgJHmiZjnrqHnirbmgIHmm7TmlrDkuovku7ZcbiAgICAgIHRoaXMubm9kZS5vbihcInRydXN0ZWVfc3RhdGVfdXBkYXRlXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgIHRoaXMuX3VwZGF0ZVRydXN0ZWVTdGF0ZShkYXRhKVxuICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgXG4gICAgICAvLyDwn5WQ44CQ5paw5aKe44CR5YCS6K6h5pe25pu05paw5LqL5Lu2XG4gICAgICB0aGlzLm5vZGUub24oXCJ1cGRhdGVfY291bnRkb3duX2V2ZW50XCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgIC8vIOWPquabtOaWsOW9k+WJjeeOqeWutueahOWAkuiuoeaXtuaYvuekulxuICAgICAgICAgaWYgKHRoaXMuc2VhdF9pbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgaWYgKHRoaXMudGltZV9sYWJlbCkge1xuICAgICAgICAgICAgICAgdGhpcy50aW1lX2xhYmVsLnN0cmluZyA9IFN0cmluZyhkYXRhLnJlbWFpbmluZylcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH1cbiAgICAgIH0uYmluZCh0aGlzKSlcbiAgICB9LFxuXG4gICAgc3RhcnQgKCkge1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog6I635Y+W5b2T5YmN546p5a62SURcbiAgICAgKi9cbiAgICBfZ2V0TXlQbGF5ZXJJZDogZnVuY3Rpb24obXlnbG9iYWwpIHtcbiAgICAgICAgdmFyIG15UGxheWVySWQgPSBudWxsXG4gICAgICAgIFxuICAgICAgICBpZiAobXlnbG9iYWwuc29ja2V0ICYmIG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKSB7XG4gICAgICAgICAgICB2YXIgcGxheWVySW5mbyA9IG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKClcbiAgICAgICAgICAgIGlmIChwbGF5ZXJJbmZvICYmIHBsYXllckluZm8uaWQpIHtcbiAgICAgICAgICAgICAgICBteVBsYXllcklkID0gcGxheWVySW5mby5pZFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIW15UGxheWVySWQgJiYgbXlnbG9iYWwucGxheWVyRGF0YSAmJiBteWdsb2JhbC5wbGF5ZXJEYXRhLnNlcnZlclBsYXllcklkKSB7XG4gICAgICAgICAgICBteVBsYXllcklkID0gbXlnbG9iYWwucGxheWVyRGF0YS5zZXJ2ZXJQbGF5ZXJJZFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIW15UGxheWVySWQgJiYgbXlnbG9iYWwucGxheWVyRGF0YSAmJiBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRCkge1xuICAgICAgICAgICAgbXlQbGF5ZXJJZCA9IG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBTdHJpbmcobXlQbGF5ZXJJZCB8fCBcIlwiKVxuICAgIH0sXG5cbiAgICBpbml0X2RhdGEoZGF0YSwgaW5kZXgpIHtcbiAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuXG4gICAgICB0aGlzLmFjY291bnRpZCA9IGRhdGEuYWNjb3VudGlkXG4gICAgICB0aGlzLnNlYXRfaW5kZXggPSBpbmRleFxuXG4gICAgICAvLyDlkIzmraXnjqnlrrZJRFxuICAgICAgaWYgKG15Z2xvYmFsICYmIG15Z2xvYmFsLnBsYXllckRhdGEgJiYgIW15Z2xvYmFsLnBsYXllckRhdGEuc2VydmVyUGxheWVySWQpIHtcbiAgICAgICAgICBpZiAobXlnbG9iYWwuc29ja2V0ICYmIG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKSB7XG4gICAgICAgICAgICAgIHZhciBwbGF5ZXJJbmZvID0gbXlnbG9iYWwuc29ja2V0LmdldFBsYXllckluZm8oKVxuICAgICAgICAgICAgICBpZiAocGxheWVySW5mbyAmJiBwbGF5ZXJJbmZvLmlkKSB7XG4gICAgICAgICAgICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLnNlcnZlclBsYXllcklkID0gcGxheWVySW5mby5pZFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLmFjY291bnRfbGFiZWwubm9kZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgdGhpcy5uaWNrbmFtZV9sYWJlbC5zdHJpbmcgPSBkYXRhLm5pY2tfbmFtZSB8fCAoXCLnjqnlrrZcIiArIChpbmRleCArIDEpKVxuXG4gICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5Yy65YiG5pmu6YCa5Zy65ZKM56ue5oqA5Zy655qE6YeR5biB5pi+56S6XG4gICAgICAvLyDnq57mioDlnLrmqKHlvI/kuIvmmL7npLogYXJlbmFfZ29sZO+8iOW9k+acn+i1m+S6i+mHkeW4ge+8ie+8jOaZrumAmuWcuuaYvuekuiBnb2xkX2NvdW5077yI5qyi5LmQ6LGG77yJXG4gICAgICB2YXIgZGlzcGxheVZhbHVlID0gMFxuICAgICAgdmFyIGlzQXJlbmFNb2RlID0gZGF0YS5yb29tX2NhdGVnb3J5ID09PSAyIHx8IHRoaXMuX2lzQXJlbmFNb2RlXG5cbiAgICAgIGlmIChpc0FyZW5hTW9kZSkge1xuICAgICAgICAgIC8vIOernuaKgOWcuuaooeW8j++8muS8mOWFiOaYvuekuiBhcmVuYV9nb2xk77yI5b2T5pyf6LWb5LqL6YeR5biB77yJXG4gICAgICAgICAgaWYgKGRhdGEuYXJlbmFfZ29sZCAhPT0gdW5kZWZpbmVkICYmIGRhdGEuYXJlbmFfZ29sZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICBkaXNwbGF5VmFsdWUgPSBkYXRhLmFyZW5hX2dvbGRcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtwbGF5ZXJfbm9kZV0g56ue5oqA5Zy65qih5byPIC0g5pi156ewOlwiLCBkYXRhLm5pY2tfbmFtZSwgXCJhcmVuYV9nb2xkOlwiLCBkYXRhLmFyZW5hX2dvbGQsIFwi5pyf5Y+3OlwiLCBkYXRhLnBlcmlvZF9ubylcbiAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEubWF0Y2hfY29pbiAhPT0gdW5kZWZpbmVkICYmIGRhdGEubWF0Y2hfY29pbiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICBkaXNwbGF5VmFsdWUgPSBkYXRhLm1hdGNoX2NvaW5cbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtwbGF5ZXJfbm9kZV0g56ue5oqA5Zy65qih5byPKOWFvOWuuSkgLSDmmLXnp7A6XCIsIGRhdGEubmlja19uYW1lLCBcIm1hdGNoX2NvaW46XCIsIGRhdGEubWF0Y2hfY29pbilcbiAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEuZ29sZF9jb3VudCAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZ29sZF9jb3VudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICBkaXNwbGF5VmFsdWUgPSBkYXRhLmdvbGRfY291bnRcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtwbGF5ZXJfbm9kZV0g56ue5oqA5Zy65qih5byP77yI5pegYXJlbmFfZ29sZO+8iS0g5L2/55SoIGdvbGRfY291bnQ6XCIsIGRhdGEuZ29sZF9jb3VudClcbiAgICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIOaZrumAmuWcuu+8muaYvuekuuasouS5kOixhlxuICAgICAgICAgIGlmIChkYXRhLmdvbGRfY291bnQgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmdvbGRfY291bnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgZGlzcGxheVZhbHVlID0gZGF0YS5nb2xkX2NvdW50XG4gICAgICAgICAgfSBlbHNlIGlmIChkYXRhLmdvbGRjb3VudCAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZ29sZGNvdW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIGRpc3BsYXlWYWx1ZSA9IGRhdGEuZ29sZGNvdW50XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+qmSBbcGxheWVyX25vZGVdIOaZrumAmuWcuiAtIOaYteensDpcIiwgZGF0YS5uaWNrX25hbWUsIFwiZ29sZF9jb3VudDpcIiwgZGF0YS5nb2xkX2NvdW50LCBcIuacgOe7iOmHkeW4gTpcIiwgZGlzcGxheVZhbHVlKVxuICAgICAgfVxuXG4gICAgICB0aGlzLmdsb2JhbGNvdW50X2xhYmVsLnN0cmluZyA9IFN0cmluZyhkaXNwbGF5VmFsdWUpXG4gICAgICB0aGlzLl9pc0FyZW5hTW9kZSA9IGlzQXJlbmFNb2RlIC8vIOS/neWtmOernuaKgOWcuuaooeW8j+eKtuaAgVxuICAgICAgdGhpcy5fYXJlbmFHb2xkID0gZGlzcGxheVZhbHVlIC8vIPCflKfjgJDmlrDlop7jgJHkv53lrZjlvZPliY3otZvkuovph5HluIFcbiAgICAgIHRoaXMuX3BlcmlvZE5vID0gZGF0YS5wZXJpb2Rfbm8gfHwgXCJcIiAvLyDwn5Sn44CQ5paw5aKe44CR5L+d5a2Y5pyf5Y+3XG4gICAgICB0aGlzLmNhcmRsaXN0X25vZGUgPSBbXVxuXG4gICAgICAvLyDmo4Dmn6Xlh4blpIfnirbmgIFcbiAgICAgIHZhciBpc1JlYWR5ID0gZGF0YS5pc3JlYWR5IHx8IGRhdGEucmVhZHkgfHwgZGF0YS5Jc1JlYWR5IHx8IGZhbHNlXG4gICAgICBpZihpc1JlYWR5ID09IHRydWUgfHwgaXNSZWFkeSA9PT0gXCJ0cnVlXCIgfHwgaXNSZWFkeSA9PT0gMSl7XG4gICAgICAgIHRoaXMucmVhZHlpbWFnZS5hY3RpdmUgPSB0cnVlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlYWR5aW1hZ2UuYWN0aXZlID0gZmFsc2VcbiAgICAgIH1cblxuICAgICAgLy8g44CQ5qC45b+D5L+u5pS544CR5b2T5YmN546p5a6277yIaW5kZXggPT0gMO+8ie+8mumakOiXj+eJjOiDjO+8jOiwg+aVtOWktOWDj+S9jee9rlxuICAgICAgaWYgKGluZGV4ID09IDApIHtcbiAgICAgICAgLy8g6ZqQ6JeP54mM6IOM6IqC54K5XG4gICAgICAgIGlmICh0aGlzLmNhcmRfbm9kZSkge1xuICAgICAgICAgIHRoaXMuY2FyZF9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgLy8g6LCD5pW05aS05YOP5L2N572u5Yiw54mM6IOM5L2N572u77yI54mM6IOM5L2N572u77yaWzgwLCAzMl3vvIlcbiAgICAgICAgaWYgKHRoaXMucm9vbV90b3V4aWFuZykge1xuICAgICAgICAgIHRoaXMucm9vbV90b3V4aWFuZy5ub2RlLnggPSA4MFxuICAgICAgICAgIHRoaXMucm9vbV90b3V4aWFuZy5ub2RlLnkgPSAzMlxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmhlYWRpbWFnZSkge1xuICAgICAgICAgIHRoaXMuaGVhZGltYWdlLm5vZGUueCA9IDgwXG4gICAgICAgICAgdGhpcy5oZWFkaW1hZ2Uubm9kZS55ID0gMzJcbiAgICAgICAgfVxuICAgICAgICAvLyDosIPmlbTmmLXnp7DmoIfnrb7kvY3nva7vvIjlpLTlg4/mraPkuIrmlrnvvIzlsYXkuK3mmL7npLrvvIlcbiAgICAgICAgaWYgKHRoaXMubmlja25hbWVfbGFiZWwgJiYgdGhpcy5uaWNrbmFtZV9sYWJlbC5ub2RlKSB7XG4gICAgICAgICAgLy8g6K6+572u6ZSa54K55Li65Lit5b+D77yM56Gu5L+d5bGF5Lit5pi+56S6XG4gICAgICAgICAgdGhpcy5uaWNrbmFtZV9sYWJlbC5ub2RlLmFuY2hvclggPSAwLjVcbiAgICAgICAgICB0aGlzLm5pY2tuYW1lX2xhYmVsLm5vZGUuYW5jaG9yWSA9IDAuNVxuICAgICAgICAgIC8vIOS9jee9ruS4juWktOWDjyB4IOebuOWQjO+8jHkg5Zyo5aS05YOP5LiK5pa5XG4gICAgICAgICAgdGhpcy5uaWNrbmFtZV9sYWJlbC5ub2RlLnggPSA4MFxuICAgICAgICAgIHRoaXMubmlja25hbWVfbGFiZWwubm9kZS55ID0gOTBcbiAgICAgICAgfVxuICAgICAgICAvLyDosIPmlbTph5HluIHmoIfnrb7kvY3nva7vvIjlpLTlg4/kuIvmlrnvvIzlsYXkuK3mmL7npLrvvIlcbiAgICAgICAgaWYgKHRoaXMuZ2xvYmFsY291bnRfbGFiZWwgJiYgdGhpcy5nbG9iYWxjb3VudF9sYWJlbC5ub2RlKSB7XG4gICAgICAgICAgLy8g6K6+572u6ZSa54K55Li65Lit5b+D77yM56Gu5L+d5bGF5Lit5pi+56S6XG4gICAgICAgICAgdGhpcy5nbG9iYWxjb3VudF9sYWJlbC5ub2RlLmFuY2hvclggPSAwLjVcbiAgICAgICAgICB0aGlzLmdsb2JhbGNvdW50X2xhYmVsLm5vZGUuYW5jaG9yWSA9IDAuNVxuICAgICAgICAgIC8vIOS9jee9ruS4juWktOWDjyB4IOebuOWQjO+8jHkg5Zyo5aS05YOP5LiL5pa5XG4gICAgICAgICAgdGhpcy5nbG9iYWxjb3VudF9sYWJlbC5ub2RlLnggPSA4MFxuICAgICAgICAgIHRoaXMuZ2xvYmFsY291bnRfbGFiZWwubm9kZS55ID0gLTI4XG4gICAgICAgIH1cbiAgICAgICAgLy8g6LCD5pW06YeR5biB6IOM5pmv5qGG5L2N572u77yI5LiO6YeR5biB5qCH562+5a+56b2Q77yJXG4gICAgICAgIGlmICh0aGlzLnJvb21fbW9uZXlfZnJhbWUpIHtcbiAgICAgICAgICB0aGlzLnJvb21fbW9uZXlfZnJhbWUueCA9IDgwXG4gICAgICAgICAgdGhpcy5yb29tX21vbmV5X2ZyYW1lLnkgPSAtMjhcbiAgICAgICAgfVxuICAgICAgICAvLyDosIPmlbTlh4blpIflm77moIfkvY3nva7vvIjlpLTlg4/lj7PkuIvop5LvvIlcbiAgICAgICAgaWYgKHRoaXMucmVhZHlpbWFnZSkge1xuICAgICAgICAgIHRoaXMucmVhZHlpbWFnZS54ID0gMTA1XG4gICAgICAgICAgdGhpcy5yZWFkeWltYWdlLnkgPSA1XG4gICAgICAgIH1cbiAgICAgICAgLy8g6LCD5pW05Zyw5Li75Zu+5qCH5L2N572u77yI5aS05YOP5Y+z5LiL6KeS77yJXG4gICAgICAgIGlmICh0aGlzLm1hc3Rlckljb24pIHtcbiAgICAgICAgICB0aGlzLm1hc3Rlckljb24ueCA9IDEwNVxuICAgICAgICAgIHRoaXMubWFzdGVySWNvbi55ID0gNVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIOiuvue9ruWxgue6p1xuICAgICAgaWYgKHRoaXMucm9vbV90b3V4aWFuZyAmJiB0aGlzLmhlYWRpbWFnZSkge1xuICAgICAgICAgIHRoaXMuaGVhZGltYWdlLm5vZGUuekluZGV4ID0gMFxuICAgICAgICAgIHRoaXMucm9vbV90b3V4aWFuZy5ub2RlLnpJbmRleCA9IDEwMFxuICAgICAgICAgIHRoaXMuaGVhZGltYWdlLm5vZGUucGFyZW50LnNvcnRBbGxDaGlsZHJlbigpXG4gICAgICB9XG5cbiAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHliqDovb3lpLTlg48gLSDmlK/mjIHov5znqItVUkzlkozmnKzlnLDotYTmupBcbiAgICAgIC8vIOacjeWKoeerr+WPr+iDvei/lOWbniBhdmF0YXIsIGF2YXRhclVybCwg5oiWIGF2YXRhcnVybCDlrZfmrrVcbiAgICAgIHZhciBhdmF0YXJVcmwgPSBkYXRhLmF2YXRhciB8fCBkYXRhLmF2YXRhclVybCB8fCBkYXRhLmF2YXRhcnVybCB8fCBcImF2YXRhcl8xXCJcbiAgICAgIHRoaXMuX2xvYWRBdmF0YXIoYXZhdGFyVXJsKVxuXG4gICAgICAvLyDlh4blpIfpgJrnn6VcbiAgICAgIHRoaXMubm9kZS5vbihcInBsYXllcl9yZWFkeV9ub3RpZnlcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICB2YXIgZGV0YWlsID0gZXZlbnRcbiAgICAgICAgICB2YXIgcmVhZHlQbGF5ZXJJZCA9IFwiXCJcbiAgICAgICAgICBpZiAodHlwZW9mIGRldGFpbCA9PT0gJ29iamVjdCcgJiYgZGV0YWlsICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIHJlYWR5UGxheWVySWQgPSBkZXRhaWwucGxheWVyX2lkIHx8IGRldGFpbC5wbGF5ZXJJZCB8fCBkZXRhaWwuaWQgfHwgXCJcIlxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlYWR5UGxheWVySWQgPSBkZXRhaWxcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZihyZWFkeVBsYXllcklkID09IHRoaXMuYWNjb3VudGlkKXtcbiAgICAgICAgICAgICAgdGhpcy5yZWFkeWltYWdlLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICB9XG4gICAgICB9LmJpbmQodGhpcykpXG5cbiAgICAgIC8vIOaKouWcsOS4u+mAmuefpVxuICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeaOpeaUtuWMheWQqyBwbGF5ZXJfaWQg5ZKMIHRpbWVvdXQg55qE5LqL5Lu25a+56LGh77yM5LiN5YaN56Gs57yW56CBXG4gICAgICB0aGlzLm5vZGUub24oXCJwbGF5ZXJub2RlX2NhbnJvYl9ldmVudFwiLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIOWFvOWuueWkhOeQhu+8mmV2ZW50IOWPr+iDveaYr+Wtl+espuS4su+8iOaXp+agvOW8j++8ieaIluWvueixoe+8iOaWsOagvOW8j++8iVxuICAgICAgICAgIHZhciBwbGF5ZXJJZCA9IGV2ZW50XG4gICAgICAgICAgdmFyIHRpbWVvdXQgPSAxNSAgLy8g6buY6K6kIDE1IOenklxuICAgICAgICAgIFxuICAgICAgICAgIGlmICh0eXBlb2YgZXZlbnQgPT09ICdvYmplY3QnICYmIGV2ZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIHBsYXllcklkID0gZXZlbnQucGxheWVyX2lkXG4gICAgICAgICAgICAgIHRpbWVvdXQgPSBldmVudC50aW1lb3V0IHx8IDE1XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIOWtmOWCqCB0aW1lb3V0IOWAvOS+m+WAkuiuoeaXtuabtOaWsOS9v+eUqFxuICAgICAgICAgIHRoaXMuX3NlcnZlclRpbWVvdXQgPSB0aW1lb3V0XG4gICAgICAgICAgXG4gICAgICAgICAgaWYocGxheWVySWQgPT0gdGhpcy5hY2NvdW50aWQpe1xuICAgICAgICAgICAgdGhpcy5xaWFuZ2RpZHpodV9ub2RlLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgIGlmICh0aGlzLnRpbWVfbGFiZWwpIHtcbiAgICAgICAgICAgICAgdGhpcy50aW1lX2xhYmVsLnN0cmluZyA9IFN0cmluZyh0aW1lb3V0KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH0uYmluZCh0aGlzKSlcbiAgICAgIFxuICAgICAgLy8g8J+VkCDlrZjlgqjmnI3liqHnq6/kvKDpgJLnmoQgdGltZW91dCDlgLxcbiAgICAgIHRoaXMuX3NlcnZlclRpbWVvdXQgPSAxNVxuXG4gICAgICBpZihpbmRleCA9PSAxKXtcbiAgICAgICAgdGhpcy5jYXJkX25vZGUueCA9IC10aGlzLmNhcmRfbm9kZS54IC0gMzBcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgX3NldEF2YXRhclNwcml0ZTogZnVuY3Rpb24oc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmhlYWRpbWFnZSB8fCAhc3ByaXRlRnJhbWUpIHJldHVyblxuICAgICAgICB0aGlzLmhlYWRpbWFnZS5lbmFibGVkID0gdHJ1ZVxuICAgICAgICB0aGlzLmhlYWRpbWFnZS5zcHJpdGVGcmFtZSA9IHNwcml0ZUZyYW1lXG4gICAgICAgIHRoaXMuaGVhZGltYWdlLm5vZGUuc2V0Q29udGVudFNpemUoODAsIDgwKVxuICAgICAgICB0aGlzLmhlYWRpbWFnZS5ub2RlLnNjYWxlID0gMVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5Yqg6L295aS05YOPIC0g5pSv5oyB6L+c56iLVVJM5ZKM5pys5Zyw6LWE5rqQXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGF2YXRhclVybCAtIOWktOWDj1VSTOaIluacrOWcsOi1hOa6kOWQjVxuICAgICAqL1xuICAgIF9sb2FkQXZhdGFyOiBmdW5jdGlvbihhdmF0YXJVcmwpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIFxuICAgICAgICBpZiAoIXRoaXMuaGVhZGltYWdlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn5a877iPIFtwbGF5ZXJfbm9kZV0gaGVhZGltYWdlIOacque7keWumlwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICAvLyDnqbrlgLzlpITnkIZcbiAgICAgICAgaWYgKCFhdmF0YXJVcmwgfHwgYXZhdGFyVXJsID09PSBcIlwiKSB7XG4gICAgICAgICAgICB0aGlzLl9sb2FkRGVmYXVsdEF2YXRhcigpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWIpOaWreaYr+WQpuaYr+i/nOeoi1VSTFxuICAgICAgICBpZiAoYXZhdGFyVXJsLmluZGV4T2YoJ2h0dHA6Ly8nKSA9PT0gMCB8fCBhdmF0YXJVcmwuaW5kZXhPZignaHR0cHM6Ly8nKSA9PT0gMCkge1xuICAgICAgICAgICAgLy8g6L+c56iLVVJM5aS05YOPXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCflrzvuI8gW3BsYXllcl9ub2RlXSDliqDovb3ov5znqIvlpLTlg486XCIsIGF2YXRhclVybClcbiAgICAgICAgICAgIGNjLmFzc2V0TWFuYWdlci5sb2FkUmVtb3RlKGF2YXRhclVybCwgeyBleHQ6ICcucG5nJyB9LCBmdW5jdGlvbihlcnIsIHRleHR1cmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyIHx8ICF0ZXh0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCflrzvuI8gW3BsYXllcl9ub2RlXSDov5znqIvlpLTlg4/liqDovb3lpLHotKXvvIzkvb/nlKjpu5jorqTlpLTlg486XCIsIGVycilcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fbG9hZERlZmF1bHRBdmF0YXIoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNwcml0ZUZyYW1lID0gbmV3IGNjLlNwcml0ZUZyYW1lKHRleHR1cmUpXG4gICAgICAgICAgICAgICAgICAgIGlmIChzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2V0QXZhdGFyU3ByaXRlKHNwcml0ZUZyYW1lKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn5a877iPIFtwbGF5ZXJfbm9kZV0g6L+c56iL5aS05YOP5Yqg6L295oiQ5YqfXCIpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCflrzvuI8gW3BsYXllcl9ub2RlXSDliJvlu7pTcHJpdGVGcmFtZeWksei0pTpcIiwgZSlcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fbG9hZERlZmF1bHRBdmF0YXIoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDmnKzlnLDotYTmupDlpLTlg49cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+WvO+4jyBbcGxheWVyX25vZGVdIOWKoOi9veacrOWcsOWktOWDjzpcIiwgYXZhdGFyVXJsKVxuICAgICAgICAgICAgdmFyIGxvY2FsUGF0aCA9IFwiVUkvaGVhZGltYWdlL1wiICsgYXZhdGFyVXJsXG4gICAgICAgICAgICBjYy5sb2FkZXIubG9hZFJlcyhsb2NhbFBhdGgsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVyciB8fCAhc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+WvO+4jyBbcGxheWVyX25vZGVdIOacrOWcsOWktOWDj+WKoOi9veWksei0pe+8jOS9v+eUqOm7mOiupOWktOWDjzpcIiwgZXJyKVxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2FkRGVmYXVsdEF2YXRhcigpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLl9zZXRBdmF0YXJTcHJpdGUoc3ByaXRlRnJhbWUpXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn5a877iPIFtwbGF5ZXJfbm9kZV0g5pys5Zyw5aS05YOP5Yqg6L295oiQ5YqfXCIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHliqDovb3pu5jorqTlpLTlg49cbiAgICAgKi9cbiAgICBfbG9hZERlZmF1bHRBdmF0YXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgY2MubG9hZGVyLmxvYWRSZXMoXCJVSS9oZWFkaW1hZ2UvYXZhdGFyXzFcIiwgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVyciwgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgIGlmICghZXJyICYmIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc2V0QXZhdGFyU3ByaXRlKHNwcml0ZUZyYW1lKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDjgJDmoLjlv4PjgJHnm7TmjqXmmL7npLrniYzog4zvvIjml6DliqjnlLvvvIzkv53or4HmlbDmja7mraPnoa7mgKfvvIlcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICAvKipcbiAgICAgKiDmmL7npLrmjIflrprmlbDph4/nmoTniYzog4xcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY291bnQgLSDniYzog4zmlbDph49cbiAgICAgKiDjgJDph43opoHjgJHlvZPliY3njqnlrrbvvIhpbmRleCA9PSAw77yJ5LiN5pi+56S654mM6IOMXG4gICAgICovXG4gICAgc2hvd0NhcmRCYWNrczogZnVuY3Rpb24oY291bnQpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIOOAkOaguOW/g+OAkeajgOafpeaYr+WQpuaYr+W9k+WJjeeOqeWutu+8iGluZGV4ID09IDDvvInvvIzlpoLmnpzmmK/liJnkuI3mmL7npLrniYzog4xcbiAgICAgICAgaWYgKHRoaXMuc2VhdF9pbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcy5jYXJkX25vZGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn4OPIFtwbGF5ZXJfbm9kZV0gY2FyZF9ub2RlIOacque7keWumlwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOa4heeQhuaXp+eJjFxuICAgICAgICB0aGlzLmNhcmRfbm9kZS5yZW1vdmVBbGxDaGlsZHJlbih0cnVlKVxuICAgICAgICB0aGlzLmNhcmRsaXN0X25vZGUgPSBbXVxuICAgICAgICBcbiAgICAgICAgaWYgKGNvdW50IDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuY2FyZF9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDYXJkQ291bnQgPSAwXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jYXJkX25vZGUuYWN0aXZlID0gdHJ1ZVxuICAgICAgICB0aGlzLmN1cnJlbnRDYXJkQ291bnQgPSBjb3VudFxuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLmNhcmRfcHJlZmFiKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+DjyBbcGxheWVyX25vZGVdIGNhcmRfcHJlZmFiIOacque7keWumlwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOebtOaOpeWIm+W7uuaJgOacieeJjOiDjO+8iOaXoOWKqOeUu++8iVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjYXJkID0gY2MuaW5zdGFudGlhdGUodGhpcy5jYXJkX3ByZWZhYilcbiAgICAgICAgICAgIGlmICghY2FyZCkgY29udGludWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FyZC5zY2FsZSA9IDAuNlxuICAgICAgICAgICAgY2FyZC5wYXJlbnQgPSB0aGlzLmNhcmRfbm9kZVxuICAgICAgICAgICAgY2FyZC5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWeguebtOWghuWPoOW4g+WxgFxuICAgICAgICAgICAgdmFyIGhlaWdodCA9IGNhcmQuaGVpZ2h0XG4gICAgICAgICAgICBjYXJkLnkgPSAoY291bnQgLSAxKSAqIDAuNSAqIGhlaWdodCAqIDAuNCAqIDAuMyAtIGhlaWdodCAqIDAuNCAqIDAuMyAqIGlcbiAgICAgICAgICAgIGNhcmQueCA9IDBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5jYXJkbGlzdF9ub2RlLnB1c2goY2FyZClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9LFxuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOOAkOaWsOWinuOAkeeOqeWutueKtuaAgeabtOaWsOWkhOeQhlxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIOabtOaWsOeOqeWutueKtuaAgVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0g5YyF5ZCrIHN0YXRlLCBjYXJkc19jb3VudCwgaXNfbGFuZGxvcmQsIHRpbWVvdXRcbiAgICAgKi9cbiAgICBfdXBkYXRlUGxheWVyU3RhdGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOemu+e6vy/miZjnrqHnirbmgIHmmL7npLpcbiAgICAgICAgaWYgKGRhdGEuc3RhdGUgPT09IFwib2ZmbGluZVwiKSB7XG4gICAgICAgICAgICAvLyDnjqnlrrbnprvnur/vvIzmmL7npLrnprvnur/lm77moIdcbiAgICAgICAgICAgIGlmICh0aGlzLm9mZmxpbmVpbWFnZSkge1xuICAgICAgICAgICAgICAgIHRoaXMub2ZmbGluZWltYWdlLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLnN0YXRlID09PSBcInJvYm90XCIpIHtcbiAgICAgICAgICAgIC8vIOacuuWZqOS6uuaJmOeuoe+8jOaYvuekuuaJmOeuoeWbvuagh1xuICAgICAgICAgICAgaWYgKHRoaXMudHJ1c3RlZWltYWdlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50cnVzdGVlaW1hZ2UuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5YW85a6577ya5aaC5p6c5rKh5pyJ5omY566h5Zu+5qCH77yM5aSN55So56a757q/5Zu+5qCHXG4gICAgICAgICAgICBpZiAoIXRoaXMudHJ1c3RlZWltYWdlICYmIHRoaXMub2ZmbGluZWltYWdlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vZmZsaW5laW1hZ2UuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuc3RhdGUgPT09IFwib25saW5lXCIpIHtcbiAgICAgICAgICAgIC8vIOeOqeWutuWcqOe6v++8jOmakOiXj+emu+e6vy/miZjnrqHlm77moIdcbiAgICAgICAgICAgIGlmICh0aGlzLm9mZmxpbmVpbWFnZSkge1xuICAgICAgICAgICAgICAgIHRoaXMub2ZmbGluZWltYWdlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy50cnVzdGVlaW1hZ2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRydXN0ZWVpbWFnZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDniYzmlbBcbiAgICAgICAgaWYgKGRhdGEuY2FyZHNfY291bnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZENvdW50ID0gZGF0YS5jYXJkc19jb3VudFxuICAgICAgICAgICAgdGhpcy5zaG93Q2FyZEJhY2tzKGRhdGEuY2FyZHNfY291bnQpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOWcsOS4u+agh+ivhlxuICAgICAgICBpZiAoZGF0YS5pc19sYW5kbG9yZCAhPT0gdW5kZWZpbmVkICYmIGRhdGEuaXNfbGFuZGxvcmQgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1hc3Rlckljb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1hc3Rlckljb24uYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5omY566h44CR5pu05paw5omY566h54q25oCBXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSDljIXlkKsgcGxheWVyX2lkLCBwbGF5ZXJfbmFtZSwgaXNfdHJ1c3RlZSwgcmVhc29uXG4gICAgICovXG4gICAgX3VwZGF0ZVRydXN0ZWVTdGF0ZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAvLyDlj6rlpITnkIblvZPliY3njqnlrrbnmoTmiZjnrqHnirbmgIFcbiAgICAgICAgaWYgKGRhdGEucGxheWVyX2lkICE9PSB0aGlzLmFjY291bnRpZCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChkYXRhLmlzX3RydXN0ZWUpIHtcbiAgICAgICAgICAgIC8vIOW8gOWQr+aJmOeuoeeKtuaAgVxuICAgICAgICAgICAgaWYgKHRoaXMudHJ1c3RlZWltYWdlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50cnVzdGVlaW1hZ2UuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5YW85a6577ya5aaC5p6c5rKh5pyJ5omY566h5Zu+5qCH77yM5aSN55So56a757q/5Zu+5qCHXG4gICAgICAgICAgICBpZiAoIXRoaXMudHJ1c3RlZWltYWdlICYmIHRoaXMub2ZmbGluZWltYWdlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vZmZsaW5laW1hZ2UuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8g5Y+W5raI5omY566h54q25oCBXG4gICAgICAgICAgICBpZiAodGhpcy50cnVzdGVlaW1hZ2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRydXN0ZWVpbWFnZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5ZCM5pe26ZqQ6JeP56a757q/5Zu+5qCHXG4gICAgICAgICAgICBpZiAodGhpcy5vZmZsaW5laW1hZ2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9mZmxpbmVpbWFnZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSk7XG4iXX0=