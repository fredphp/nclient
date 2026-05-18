
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
      // 🔧【修复】游戏重新开始时清理抢地主/不抢图标，避免重叠显示

      if (this.robIcon_Sp) this.robIcon_Sp.active = false;
      if (this.robnoIcon_Sp) this.robnoIcon_Sp.active = false;

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
    }.bind(this)); // 🔧【新增】清理抢地主/不抢图标事件（重新发牌时调用）

    this.node.on("clear_rob_state_event", function () {
      console.log("🔄 [player_node] 清理抢地主/不抢图标, accountid:", this.accountid);
      if (this.robIcon_Sp) this.robIcon_Sp.active = false;
      if (this.robnoIcon_Sp) this.robnoIcon_Sp.active = false;
      if (this.qiangdidzhu_node) this.qiangdidzhu_node.active = false;
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
    var myglobal = window.myglobal; // 🔧【修复】兼容 accountid 和 accountId 两种命名

    this.accountid = data.accountid || data.accountId || "";
    this.seat_index = index; // 🔧【调试】输出 accountid 设置

    console.log("🎮 [player_node.init_data] accountid:", this.accountid, "seat_index:", this.seat_index, "nick_name:", data.nick_name); // 同步玩家ID

    if (myglobal && myglobal.playerData && !myglobal.playerData.serverPlayerId) {
      if (myglobal.socket && myglobal.socket.getPlayerInfo) {
        var playerInfo = myglobal.socket.getPlayerInfo();

        if (playerInfo && playerInfo.id) {
          myglobal.playerData.serverPlayerId = playerInfo.id;
        }
      }
    }

    this.account_label.node.active = false; // 🔧【修复】设置昵称标签溢出模式：超长名字用省略号显示

    if (this.nickname_label) {
      this.nickname_label.overflow = cc.Label.Overflow.CLAMP;
      this.nickname_label.enableEllipsis = true; // 设置最大宽度（根据UI设计调整）

      this.nickname_label.node.width = 100;
    }

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
    // 🔧【修复】headimage（头像）应该在 room_touxiang（头像框）的上层


    if (this.room_touxiang && this.headimage) {
      this.room_touxiang.node.zIndex = 0; // 头像框在底层

      this.headimage.node.zIndex = 100; // 头像在上层显示

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
    } // 🔧【优化】优先使用预加载的缓存头像


    var myglobal = window.myglobal;

    if (myglobal && myglobal._avatarCache && myglobal._avatarCache[avatarUrl]) {
      var cachedSpriteFrame = myglobal._avatarCache[avatarUrl];

      if (cachedSpriteFrame) {
        console.log("🖼️ [player_node] 使用缓存头像:", avatarUrl);

        self._setAvatarSprite(cachedSpriteFrame);

        return;
      }
    } // 🔧【修复】处理以 / 开头的路径（服务器相对路径）


    if (avatarUrl.indexOf('/') === 0 && avatarUrl.indexOf('/uploads/') === 0) {
      // 拼接服务器地址
      var cdnUrl = myglobal && myglobal.cdnUrl ? myglobal.cdnUrl : "https://apis.hongxiu88.com";
      var serverUrl = cdnUrl + avatarUrl;
      console.log("🖼️ [player_node] 加载服务器头像(格式1):", serverUrl);

      this._loadRemoteAvatar(serverUrl);

      return;
    } // 判断是否是远程URL


    if (avatarUrl.indexOf('http://') === 0 || avatarUrl.indexOf('https://') === 0) {
      // 远程URL头像
      console.log("🖼️ [player_node] 加载远程头像:", avatarUrl);

      this._loadRemoteAvatar(avatarUrl);
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
   * 🔧【新增】加载远程头像
   * @param {string} url - 完整的远程URL
   */
  _loadRemoteAvatar: function _loadRemoteAvatar(url) {
    var self = this; // 🔧【修复】根据URL确定正确的扩展名，避免加载失败

    var ext = '.png'; // 默认扩展名

    if (url.indexOf('.jpg') > 0 || url.indexOf('.jpeg') > 0) {
      ext = '.jpg';
    } else if (url.indexOf('.png') > 0) {
      ext = '.png';
    }

    console.log("🖼️ [player_node] 开始加载远程头像:", url, "扩展名:", ext);
    cc.assetManager.loadRemote(url, function (err, texture) {
      if (err || !texture) {
        console.warn("🖼️ [player_node] 远程头像加载失败，使用默认头像:", err);

        self._loadDefaultAvatar();

        return;
      }

      try {
        var spriteFrame = new cc.SpriteFrame(texture);

        if (spriteFrame) {
          self._setAvatarSprite(spriteFrame);

          console.log("🖼️ [player_node] 远程头像加载成功:", url);
        }
      } catch (e) {
        console.warn("🖼️ [player_node] 创建SpriteFrame失败:", e);

        self._loadDefaultAvatar();
      }
    });
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

  /**
   * 🔧【新增】更新竞技场玩家数据（头像、金币等）
   * 当收到 ROOM_JOINED 消息后调用，更新从服务端获取的正确数据
   * @param {Object} data - 包含 gold_count, arena_gold, match_coin, avatar, avatarUrl
   */
  updateArenaData: function updateArenaData(data) {
    console.log("🏟️ [player_node] updateArenaData 被调用, accountid:", this.accountid, "data:", JSON.stringify(data)); // 🔧【修复】竞技场模式优先使用 match_coin，其次 arena_gold

    var displayValue = 0;

    if (data.match_coin !== undefined && data.match_coin !== null && data.match_coin > 0) {
      displayValue = data.match_coin;
      console.log("🏟️ [player_node] 更新 match_coin:", data.match_coin);
    } else if (data.arena_gold !== undefined && data.arena_gold !== null && data.arena_gold > 0) {
      displayValue = data.arena_gold;
      console.log("🏟️ [player_node] 更新 arena_gold:", data.arena_gold);
    } else if (data.gold_count !== undefined && data.gold_count !== null && data.gold_count > 0) {
      displayValue = data.gold_count;
      console.log("🏟️ [player_node] 更新 gold_count:", data.gold_count);
    } // 🔧【关键修复】使用正确的 globalcount_label 而非 gold_label


    if (displayValue > 0 && this.globalcount_label) {
      this.globalcount_label.string = displayValue.toString();
      this._arenaGold = displayValue; // 更新保存的赛事金币

      console.log("🏟️ [player_node] 金币已更新为:", displayValue);
    } else if (displayValue === 0) {
      console.log("🏟️ [player_node] 警告：displayValue 为 0，跳过更新");
    } else if (!this.globalcount_label) {
      console.warn("🏟️ [player_node] 错误：globalcount_label 未绑定！");
    } // 更新头像


    var avatarUrl = data.avatar || data.avatarUrl;

    if (avatarUrl && avatarUrl !== "" && avatarUrl !== "avatar_1") {
      console.log("🏟️ [player_node] 更新头像:", avatarUrl);

      this._loadAvatar(avatarUrl);
    }
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
    } // 更新托管状态变量


    this._isTrustee = data.is_trustee || false;
    console.log("🔄 [player_node] 托管状态更新:", data.player_name, "is_trustee:", this._isTrustee, "reason:", data.reason);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2dhbWVTY2VuZS9wcmVmYWJzL3BsYXllcl9ub2RlLmpzIl0sIm5hbWVzIjpbInFpYW5fc3RhdGUiLCJ3aW5kb3ciLCJidXFpYW5nIiwicWlhbiIsImlzb3Blbl9zb3VuZCIsImNjIiwiQ2xhc3MiLCJDb21wb25lbnQiLCJwcm9wZXJ0aWVzIiwiYWNjb3VudF9sYWJlbCIsIkxhYmVsIiwibmlja25hbWVfbGFiZWwiLCJyb29tX3RvdXhpYW5nIiwiU3ByaXRlIiwiZ2xvYmFsY291bnRfbGFiZWwiLCJyb29tX21vbmV5X2ZyYW1lIiwiTm9kZSIsImhlYWRpbWFnZSIsInJlYWR5aW1hZ2UiLCJvZmZsaW5laW1hZ2UiLCJ0cnVzdGVlaW1hZ2UiLCJjYXJkX25vZGUiLCJjYXJkX3ByZWZhYiIsIlByZWZhYiIsImNsb2NraW1hZ2UiLCJxaWFuZ2RpZHpodV9ub2RlIiwidGltZV9sYWJlbCIsInJvYmltYWdlX3NwIiwiU3ByaXRlRnJhbWUiLCJyb2Jub2ltYWdlX3NwIiwicm9iSWNvblNwIiwicm9iSWNvbl9TcCIsInJvYm5vSWNvbl9TcCIsIm1hc3Rlckljb24iLCJvbkxvYWQiLCJhY3RpdmUiLCJjdXJyZW50Q2FyZENvdW50IiwiY2FyZGxpc3Rfbm9kZSIsIm5vZGUiLCJvbiIsImV2ZW50IiwicmVtb3ZlQWxsQ2hpbGRyZW4iLCJiaW5kIiwibXlnbG9iYWwiLCJjb25zb2xlIiwiZXJyb3IiLCJteVBsYXllcklkIiwiX2dldE15UGxheWVySWQiLCJhY2NvdW50SWRTdHIiLCJTdHJpbmciLCJhY2NvdW50aWQiLCJzaG93Q2FyZEJhY2tzIiwiZGV0YWlsIiwicm91bmQiLCJpc0NhbGwiLCJzdGF0ZSIsImxvZyIsImRhdGEiLCJjb3VudCIsIl91cGRhdGVQbGF5ZXJTdGF0ZSIsIl91cGRhdGVUcnVzdGVlU3RhdGUiLCJzZWF0X2luZGV4Iiwic3RyaW5nIiwicmVtYWluaW5nIiwic3RhcnQiLCJzb2NrZXQiLCJnZXRQbGF5ZXJJbmZvIiwicGxheWVySW5mbyIsImlkIiwicGxheWVyRGF0YSIsInNlcnZlclBsYXllcklkIiwiYWNjb3VudElEIiwiaW5pdF9kYXRhIiwiaW5kZXgiLCJhY2NvdW50SWQiLCJuaWNrX25hbWUiLCJvdmVyZmxvdyIsIk92ZXJmbG93IiwiQ0xBTVAiLCJlbmFibGVFbGxpcHNpcyIsIndpZHRoIiwiZGlzcGxheVZhbHVlIiwiaXNBcmVuYU1vZGUiLCJyb29tX2NhdGVnb3J5IiwiX2lzQXJlbmFNb2RlIiwiYXJlbmFfZ29sZCIsInVuZGVmaW5lZCIsInBlcmlvZF9ubyIsIm1hdGNoX2NvaW4iLCJnb2xkX2NvdW50IiwiZ29sZGNvdW50IiwiX2FyZW5hR29sZCIsIl9wZXJpb2RObyIsImlzUmVhZHkiLCJpc3JlYWR5IiwicmVhZHkiLCJJc1JlYWR5IiwieCIsInkiLCJhbmNob3JYIiwiYW5jaG9yWSIsInpJbmRleCIsInBhcmVudCIsInNvcnRBbGxDaGlsZHJlbiIsImF2YXRhclVybCIsImF2YXRhciIsImF2YXRhcnVybCIsIl9sb2FkQXZhdGFyIiwicmVhZHlQbGF5ZXJJZCIsInBsYXllcl9pZCIsInBsYXllcklkIiwidGltZW91dCIsIl9zZXJ2ZXJUaW1lb3V0IiwiX3NldEF2YXRhclNwcml0ZSIsInNwcml0ZUZyYW1lIiwiZW5hYmxlZCIsInNldENvbnRlbnRTaXplIiwic2NhbGUiLCJzZWxmIiwid2FybiIsIl9sb2FkRGVmYXVsdEF2YXRhciIsIl9hdmF0YXJDYWNoZSIsImNhY2hlZFNwcml0ZUZyYW1lIiwiaW5kZXhPZiIsImNkblVybCIsInNlcnZlclVybCIsIl9sb2FkUmVtb3RlQXZhdGFyIiwibG9jYWxQYXRoIiwibG9hZGVyIiwibG9hZFJlcyIsImVyciIsInVybCIsImV4dCIsImFzc2V0TWFuYWdlciIsImxvYWRSZW1vdGUiLCJ0ZXh0dXJlIiwiZSIsInVwZGF0ZUFyZW5hRGF0YSIsIkpTT04iLCJzdHJpbmdpZnkiLCJ0b1N0cmluZyIsImkiLCJjYXJkIiwiaW5zdGFudGlhdGUiLCJoZWlnaHQiLCJwdXNoIiwiY2FyZHNfY291bnQiLCJpc19sYW5kbG9yZCIsIl9pc1RydXN0ZWUiLCJpc190cnVzdGVlIiwicGxheWVyX25hbWUiLCJyZWFzb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUEsSUFBSUEsVUFBVSxHQUFHQyxNQUFNLENBQUNELFVBQVAsSUFBcUI7RUFBRUUsT0FBTyxFQUFFLENBQVg7RUFBY0MsSUFBSSxFQUFFO0FBQXBCLENBQXRDO0FBQ0EsSUFBSUMsWUFBWSxHQUFHSCxNQUFNLENBQUNHLFlBQVAsSUFBdUIsQ0FBMUMsRUFFQTs7QUFFQUMsRUFBRSxDQUFDQyxLQUFILENBQVM7RUFDTCxXQUFTRCxFQUFFLENBQUNFLFNBRFA7RUFHTEMsVUFBVSxFQUFFO0lBQ1JDLGFBQWEsRUFBRUosRUFBRSxDQUFDSyxLQURWO0lBRVJDLGNBQWMsRUFBRU4sRUFBRSxDQUFDSyxLQUZYO0lBR1JFLGFBQWEsRUFBRVAsRUFBRSxDQUFDUSxNQUhWO0lBSVJDLGlCQUFpQixFQUFFVCxFQUFFLENBQUNLLEtBSmQ7SUFLUkssZ0JBQWdCLEVBQUVWLEVBQUUsQ0FBQ1csSUFMYjtJQUt1QjtJQUMvQkMsU0FBUyxFQUFFWixFQUFFLENBQUNRLE1BTk47SUFPUkssVUFBVSxFQUFFYixFQUFFLENBQUNXLElBUFA7SUFRUkcsWUFBWSxFQUFFZCxFQUFFLENBQUNXLElBUlQ7SUFTUkksWUFBWSxFQUFFZixFQUFFLENBQUNXLElBVFQ7SUFTbUI7SUFDM0JLLFNBQVMsRUFBRWhCLEVBQUUsQ0FBQ1csSUFWTjtJQVdSTSxXQUFXLEVBQUVqQixFQUFFLENBQUNrQixNQVhSO0lBWVJDLFVBQVUsRUFBRW5CLEVBQUUsQ0FBQ1csSUFaUDtJQWFSUyxnQkFBZ0IsRUFBRXBCLEVBQUUsQ0FBQ1csSUFiYjtJQWNSVSxVQUFVLEVBQUVyQixFQUFFLENBQUNLLEtBZFA7SUFlUmlCLFdBQVcsRUFBRXRCLEVBQUUsQ0FBQ3VCLFdBZlI7SUFnQlJDLGFBQWEsRUFBRXhCLEVB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Y2VzQ29udGVudCI6WyIvLyDkvb/nlKjlhajlsYDlj5jph4/vvIzkuI3kvb/nlKggcmVxdWlyZVxuLy8g44CQ5L+u5aSN54mI5pys44CR566A5YyW5a+55omL54mM6IOM5pi+56S677yM55u05o6l5Yib5bu6IDE3IOW8oOeJjOiDjFxuLy8g5qC45b+D5Y6f5YiZ77yaXG4vLyAxLiDmlLbliLAgcHVzaF9jYXJkX2V2ZW50IOWQjuebtOaOpeaYvuekuiAxNyDlvKDniYzog4xcbi8vIDIuIOS4jeS+nei1luWumuaXtuWZqOaIluWKqOeUu+iwg+W6plxuLy8gMy4g5L+d6K+B5pWw5o2u5q2j56Gu5oCnXG5cbnZhciBxaWFuX3N0YXRlID0gd2luZG93LnFpYW5fc3RhdGUgfHwgeyBidXFpYW5nOiAwLCBxaWFuOiAxIH1cbnZhciBpc29wZW5fc291bmQgPSB3aW5kb3cuaXNvcGVuX3NvdW5kIHx8IDFcblxuLy8g4pqg77iP44CQ5bey5Yig6Zmk44CRcGxheVJvYlNvdW5kIOWHveaVsCAtIOmfs+aViOaSreaUvue7n+S4gOeUsSBnYW1laW5nVUkuX3BsYXlSb2JTb3VuZCDlpITnkIZcblxuY2MuQ2xhc3Moe1xuICAgIGV4dGVuZHM6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgYWNjb3VudF9sYWJlbDogY2MuTGFiZWwsXG4gICAgICAgIG5pY2tuYW1lX2xhYmVsOiBjYy5MYWJlbCxcbiAgICAgICAgcm9vbV90b3V4aWFuZzogY2MuU3ByaXRlLFxuICAgICAgICBnbG9iYWxjb3VudF9sYWJlbDogY2MuTGFiZWwsXG4gICAgICAgIHJvb21fbW9uZXlfZnJhbWU6IGNjLk5vZGUsICAgICAvLyDph5HluIHog4zmma/moYZcbiAgICAgICAgaGVhZGltYWdlOiBjYy5TcHJpdGUsXG4gICAgICAgIHJlYWR5aW1hZ2U6IGNjLk5vZGUsXG4gICAgICAgIG9mZmxpbmVpbWFnZTogY2MuTm9kZSxcbiAgICAgICAgdHJ1c3RlZWltYWdlOiBjYy5Ob2RlLCAgICAgLy8g8J+Up+OAkOaJmOeuoeOAkeaJmOeuoeeKtuaAgeWbvuagh1xuICAgICAgICBjYXJkX25vZGU6IGNjLk5vZGUsXG4gICAgICAgIGNhcmRfcHJlZmFiOiBjYy5QcmVmYWIsXG4gICAgICAgIGNsb2NraW1hZ2U6IGNjLk5vZGUsXG4gICAgICAgIHFpYW5nZGlkemh1X25vZGU6IGNjLk5vZGUsXG4gICAgICAgIHRpbWVfbGFiZWw6IGNjLkxhYmVsLFxuICAgICAgICByb2JpbWFnZV9zcDogY2MuU3ByaXRlRnJhbWUsXG4gICAgICAgIHJvYm5vaW1hZ2Vfc3A6IGNjLlNwcml0ZUZyYW1lLFxuICAgICAgICByb2JJY29uU3A6IGNjLlNwcml0ZSxcbiAgICAgICAgcm9iSWNvbl9TcDogY2MuTm9kZSxcbiAgICAgICAgcm9ibm9JY29uX1NwOiBjYy5Ob2RlLFxuICAgICAgICBtYXN0ZXJJY29uOiBjYy5Ob2RlXG4gICAgfSxcblxuICAgIG9uTG9hZCAoKSB7XG4gICAgICB0aGlzLnJlYWR5aW1hZ2UuYWN0aXZlID0gZmFsc2VcbiAgICAgIHRoaXMub2ZmbGluZWltYWdlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICBpZiAodGhpcy50cnVzdGVlaW1hZ2UpIHRoaXMudHJ1c3RlZWltYWdlLmFjdGl2ZSA9IGZhbHNlICAvLyDwn5Sn44CQ5omY566h44CR5Yid5aeL5YyW5omY566h5Zu+5qCHXG4gICAgICBpZiAodGhpcy5tYXN0ZXJJY29uKSB0aGlzLm1hc3Rlckljb24uYWN0aXZlID0gZmFsc2UgIC8vIPCflKfjgJDkv67lpI3jgJHliJ3lp4vljJblnLDkuLvlm77moIfkuLrpmpDol49cbiAgICAgIHRoaXMuY3VycmVudENhcmRDb3VudCA9IDE3XG4gICAgICB0aGlzLmNhcmRsaXN0X25vZGUgPSBbXVxuICAgICAgXG4gICAgICAvLyDmuLjmiI/lvIDlp4vkuovku7ZcbiAgICAgIHRoaXMubm9kZS5vbihcImdhbWVzdGFydF9ldmVudFwiLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB0aGlzLnJlYWR5aW1hZ2UuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgaWYgKHRoaXMubWFzdGVySWNvbikgdGhpcy5tYXN0ZXJJY29uLmFjdGl2ZSA9IGZhbHNlICAvLyDwn5Sn44CQ5L+u5aSN44CR5ri45oiP5byA5aeL5pe26ZqQ6JeP5Zyw5Li75Zu+5qCHXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmuLjmiI/ph43mlrDlvIDlp4vml7bmuIXnkIbmiqLlnLDkuLsv5LiN5oqi5Zu+5qCH77yM6YG/5YWN6YeN5Y+g5pi+56S6XG4gICAgICAgIGlmICh0aGlzLnJvYkljb25fU3ApIHRoaXMucm9iSWNvbl9TcC5hY3RpdmUgPSBmYWxzZVxuICAgICAgICBpZiAodGhpcy5yb2Jub0ljb25fU3ApIHRoaXMucm9ibm9JY29uX1NwLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgIGlmICh0aGlzLmNhcmRfbm9kZSkge1xuICAgICAgICAgICAgdGhpcy5jYXJkX25vZGUuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgICAgIHRoaXMuY2FyZF9ub2RlLnJlbW92ZUFsbENoaWxkcmVuKHRydWUpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jYXJkbGlzdF9ub2RlID0gW11cbiAgICAgICAgdGhpcy5jdXJyZW50Q2FyZENvdW50ID0gMTdcbiAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgLy8g44CQ5qC45b+D44CR5Y+R54mM5LqL5Lu2IC0g55u05o6l5pi+56S6IDE3IOW8oOeJjOiDjFxuICAgICAgdGhpcy5ub2RlLm9uKFwicHVzaF9jYXJkX2V2ZW50XCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBcbiAgICAgICAgaWYgKCFteWdsb2JhbCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfg48gW3BsYXllcl9ub2RlXSBwdXNoX2NhcmRfZXZlbnQ6IG15Z2xvYmFsIOS4jeWtmOWcqO+8gVwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBteVBsYXllcklkID0gdGhpcy5fZ2V0TXlQbGF5ZXJJZChteWdsb2JhbClcbiAgICAgICAgdmFyIGFjY291bnRJZFN0ciA9IFN0cmluZyh0aGlzLmFjY291bnRpZCB8fCBcIlwiKVxuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5piv6Ieq5bex77yM6Lez6L+HXG4gICAgICAgIGlmKG15UGxheWVySWQgPT09IGFjY291bnRJZFN0ciAmJiBhY2NvdW50SWRTdHIgIT09IFwiXCIpe1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuc2hvd0NhcmRCYWNrcygxNylcbiAgICAgIH0uYmluZCh0aGlzKSlcblxuICAgICAgLy8g5oqi5Zyw5Li75LqL5Lu2XG4gICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5omA5pyJ546p5a626IqC54K56YO96IO95pi+56S65oqi5Zyw5Li7L+S4jeaKoueKtuaAgVxuICAgICAgLy8g4pqg77iP44CQ6YeN6KaB44CR6Z+z5pWI5pKt5pS+57uf5LiA55SxIGdhbWVpbmdVSS5fcGxheVJvYlNvdW5kIOWkhOeQhu+8jOatpOWkhOS4jeWGjeaSreaUvumfs+aViFxuICAgICAgdGhpcy5ub2RlLm9uKFwicGxheWVybm9kZV9yb2Jfc3RhdGVfZXZlbnRcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICB2YXIgZGV0YWlsID0gZXZlbnRcbiAgICAgICAgICBcbiAgICAgICAgICAvLyDpmpDol4/miqLlnLDkuLvmjInpkq7vvIjlvZPliY3mk43kvZznmoTnjqnlrrbvvIlcbiAgICAgICAgICBpZihkZXRhaWwuYWNjb3VudGlkID09IHRoaXMuYWNjb3VudGlkKXtcbiAgICAgICAgICAgIHRoaXMucWlhbmdkaWR6aHVfbm9kZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIPCflKfjgJDlhbPplK7kv67lpI3jgJHmiYDmnInnjqnlrrboioLngrnpg73mmL7npLrlr7nlupTnjqnlrrbnmoTmiqLlnLDkuLvnirbmgIFcbiAgICAgICAgICBpZih0aGlzLmFjY291bnRpZCA9PSBkZXRhaWwuYWNjb3VudGlkKXtcbiAgICAgICAgICAgIC8vIPCflKfjgJDmlrDlop7jgJHmoLnmja7ova7mrKHljLrliIZcIuWPq+WcsOS4uy/kuI3lj6tcIuWSjFwi5oqi5Zyw5Li7L+S4jeaKolwiXG4gICAgICAgICAgICB2YXIgcm91bmQgPSBkZXRhaWwucm91bmQgfHwgMVxuICAgICAgICAgICAgdmFyIGlzQ2FsbCA9IGRldGFpbC5zdGF0ZSA9PSBxaWFuX3N0YXRlLnFpYW4gfHwgZGV0YWlsLnN0YXRlID09PSB0cnVlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmKGlzQ2FsbCl7XG4gICAgICAgICAgICAgIHRoaXMucm9iSWNvbl9TcC5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICAgIC8vIOKaoO+4j+OAkOW3suWIoOmZpOOAkemfs+aViOaSreaUvuenu+iHsyBnYW1laW5nVUkuX3BsYXlSb2JTb3VuZO+8iOacjeWKoeerr+W5v+aSreinpuWPke+8iVxuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgIHRoaXMucm9ibm9JY29uX1NwLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgICAgLy8g4pqg77iP44CQ5bey5Yig6Zmk44CR6Z+z5pWI5pKt5pS+56e76IezIGdhbWVpbmdVSS5fcGxheVJvYlNvdW5k77yI5pyN5Yqh56uv5bm/5pKt6Kem5Y+R77yJXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAvLyDwn5Sn44CQ5paw5aKe44CR5riF55CG5oqi5Zyw5Li7L+S4jeaKouWbvuagh+S6i+S7tu+8iOmHjeaWsOWPkeeJjOaXtuiwg+eUqO+8iVxuICAgICAgdGhpcy5ub2RlLm9uKFwiY2xlYXJfcm9iX3N0YXRlX2V2ZW50XCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+UhCBbcGxheWVyX25vZGVdIOa4heeQhuaKouWcsOS4uy/kuI3miqLlm77moIcsIGFjY291bnRpZDpcIiwgdGhpcy5hY2NvdW50aWQpXG4gICAgICAgICAgaWYgKHRoaXMucm9iSWNvbl9TcCkgdGhpcy5yb2JJY29uX1NwLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICAgaWYgKHRoaXMucm9ibm9JY29uX1NwKSB0aGlzLnJvYm5vSWNvbl9TcC5hY3RpdmUgPSBmYWxzZVxuICAgICAgICAgIGlmICh0aGlzLnFpYW5nZGlkemh1X25vZGUpIHRoaXMucWlhbmdkaWR6aHVfbm9kZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAvLyDmiJDkuLrlnLDkuLvkuovku7ZcbiAgICAgIHRoaXMubm9kZS5vbihcInBsYXllcm5vZGVfY2hhbmdlbWFzdGVyX2V2ZW50XCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICB2YXIgZGV0YWlsID0gZXZlbnQgXG4gICAgICAgICB0aGlzLnJvYkljb25fU3AuYWN0aXZlID0gZmFsc2VcbiAgICAgICAgIHRoaXMucm9ibm9JY29uX1NwLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICBpZihkZXRhaWwgPT0gdGhpcy5hY2NvdW50aWQpe1xuICAgICAgICAgICAgdGhpcy5tYXN0ZXJJY29uLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgIHRoaXMuY3VycmVudENhcmRDb3VudCA9IDIwXG4gICAgICAgICAgICB0aGlzLnNob3dDYXJkQmFja3MoMjApXG4gICAgICAgICB9XG4gICAgICB9LmJpbmQodGhpcykpXG4gICAgICBcbiAgICAgIC8vIOeJjOaVsOabtOaWsOS6i+S7tlxuICAgICAgdGhpcy5ub2RlLm9uKFwidXBkYXRlX2NhcmRfY291bnRfZXZlbnRcIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgaWYoZGF0YS5hY2NvdW50aWQgPT0gdGhpcy5hY2NvdW50aWQpe1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZENvdW50ID0gZGF0YS5jb3VudFxuICAgICAgICAgICAgdGhpcy5zaG93Q2FyZEJhY2tzKGRhdGEuY291bnQpXG4gICAgICAgICB9XG4gICAgICB9LmJpbmQodGhpcykpXG4gICAgICBcbiAgICAgIC8vIOOAkOaWsOWinuOAkeeOqeWutueKtuaAgeabtOaWsOS6i+S7tu+8iOaOiee6vy/kuIrnur8v5omY566h77yJXG4gICAgICB0aGlzLm5vZGUub24oXCJwbGF5ZXJfc3RhdGVfdXBkYXRlXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgIHRoaXMuX3VwZGF0ZVBsYXllclN0YXRlKGRhdGEpXG4gICAgICB9LmJpbmQodGhpcykpXG4gICAgICBcbiAgICAgIC8vIPCflKfjgJDmiZjnrqHjgJHmiZjnrqHnirbmgIHmm7TmlrDkuovku7ZcbiAgICAgIHRoaXMubm9kZS5vbihcInRydXN0ZWVfc3RhdGVfdXBkYXRlXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgIHRoaXMuX3VwZGF0ZVRydXN0ZWVTdGF0ZShkYXRhKVxuICAgICAgfS5iaW5kKHRoaXMpKVxuICAgICAgXG4gICAgICAvLyDwn5WQ44CQ5paw5aKe44CR5YCS6K6h5pe25pu05paw5LqL5Lu2XG4gICAgICB0aGlzLm5vZGUub24oXCJ1cGRhdGVfY291bnRkb3duX2V2ZW50XCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgIC8vIOWPquabtOaWsOW9k+WJjeeOqeWutueahOWAkuiuoeaXtuaYvuekulxuICAgICAgICAgaWYgKHRoaXMuc2VhdF9pbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgaWYgKHRoaXMudGltZV9sYWJlbCkge1xuICAgICAgICAgICAgICAgdGhpcy50aW1lX2xhYmVsLnN0cmluZyA9IFN0cmluZyhkYXRhLnJlbWFpbmluZylcbiAgICAgICAgICAgIH1cbiAgICAgICAgIH1cbiAgICAgIH0uYmluZCh0aGlzKSlcbiAgICB9LFxuXG4gICAgc3RhcnQgKCkge1xuICAgIH0sXG4gICAgXG4gICAgLyoqXG4gICAgICog6I635Y+W5b2T5YmN546p5a62SURcbiAgICAgKi9cbiAgICBfZ2V0TXlQbGF5ZXJJZDogZnVuY3Rpb24obXlnbG9iYWwpIHtcbiAgICAgICAgdmFyIG15UGxheWVySWQgPSBudWxsXG4gICAgICAgIFxuICAgICAgICBpZiAobXlnbG9iYWwuc29ja2V0ICYmIG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKSB7XG4gICAgICAgICAgICB2YXIgcGxheWVySW5mbyA9IG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKClcbiAgICAgICAgICAgIGlmIChwbGF5ZXJJbmZvICYmIHBsYXllckluZm8uaWQpIHtcbiAgICAgICAgICAgICAgICBteVBsYXllcklkID0gcGxheWVySW5mby5pZFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIW15UGxheWVySWQgJiYgbXlnbG9iYWwucGxheWVyRGF0YSAmJiBteWdsb2JhbC5wbGF5ZXJEYXRhLnNlcnZlclBsYXllcklkKSB7XG4gICAgICAgICAgICBteVBsYXllcklkID0gbXlnbG9iYWwucGxheWVyRGF0YS5zZXJ2ZXJQbGF5ZXJJZFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoIW15UGxheWVySWQgJiYgbXlnbG9iYWwucGxheWVyRGF0YSAmJiBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRCkge1xuICAgICAgICAgICAgbXlQbGF5ZXJJZCA9IG15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBTdHJpbmcobXlQbGF5ZXJJZCB8fCBcIlwiKVxuICAgIH0sXG5cbiAgICBpbml0X2RhdGEoZGF0YSwgaW5kZXgpIHtcbiAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuXG4gICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5YW85a65IGFjY291bnRpZCDlkowgYWNjb3VudElkIOS4pOenjeWRveWQjVxuICAgICAgdGhpcy5hY2NvdW50aWQgPSBkYXRhLmFjY291bnRpZCB8fCBkYXRhLmFjY291bnRJZCB8fCBcIlwiXG4gICAgICB0aGlzLnNlYXRfaW5kZXggPSBpbmRleFxuICAgICAgXG4gICAgICAvLyDwn5Sn44CQ6LCD6K+V44CR6L6T5Ye6IGFjY291bnRpZCDorr7nva5cbiAgICAgIGNvbnNvbGUubG9nKFwi8J+OriBbcGxheWVyX25vZGUuaW5pdF9kYXRhXSBhY2NvdW50aWQ6XCIsIHRoaXMuYWNjb3VudGlkLCBcInNlYXRfaW5kZXg6XCIsIHRoaXMuc2VhdF9pbmRleCwgXCJuaWNrX25hbWU6XCIsIGRhdGEubmlja19uYW1lKVxuXG4gICAgICAvLyDlkIzmraXnjqnlrrZJRFxuICAgICAgaWYgKG15Z2xvYmFsICYmIG15Z2xvYmFsLnBsYXllckRhdGEgJiYgIW15Z2xvYmFsLnBsYXllckRhdGEuc2VydmVyUGxheWVySWQpIHtcbiAgICAgICAgICBpZiAobXlnbG9iYWwuc29ja2V0ICYmIG15Z2xvYmFsLnNvY2tldC5nZXRQbGF5ZXJJbmZvKSB7XG4gICAgICAgICAgICAgIHZhciBwbGF5ZXJJbmZvID0gbXlnbG9iYWwuc29ja2V0LmdldFBsYXllckluZm8oKVxuICAgICAgICAgICAgICBpZiAocGxheWVySW5mbyAmJiBwbGF5ZXJJbmZvLmlkKSB7XG4gICAgICAgICAgICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLnNlcnZlclBsYXllcklkID0gcGxheWVySW5mby5pZFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLmFjY291bnRfbGFiZWwubm9kZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgXG4gICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR6K6+572u5pi156ew5qCH562+5rqi5Ye65qih5byP77ya6LaF6ZW/5ZCN5a2X55So55yB55Wl5Y+35pi+56S6XG4gICAgICBpZiAodGhpcy5uaWNrbmFtZV9sYWJlbCkge1xuICAgICAgICAgIHRoaXMubmlja25hbWVfbGFiZWwub3ZlcmZsb3cgPSBjYy5MYWJlbC5PdmVyZmxvdy5DTEFNUFxuICAgICAgICAgIHRoaXMubmlja25hbWVfbGFiZWwuZW5hYmxlRWxsaXBzaXMgPSB0cnVlXG4gICAgICAgICAgLy8g6K6+572u5pyA5aSn5a695bqm77yI5qC55o2uVUnorr7orqHosIPmlbTvvIlcbiAgICAgICAgICB0aGlzLm5pY2tuYW1lX2xhYmVsLm5vZGUud2lkdGggPSAxMDBcbiAgICAgIH1cbiAgICAgIFxuICAgICAgdGhpcy5uaWNrbmFtZV9sYWJlbC5zdHJpbmcgPSBkYXRhLm5pY2tfbmFtZSB8fCAoXCLnjqnlrrZcIiArIChpbmRleCArIDEpKVxuXG4gICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5Yy65YiG5pmu6YCa5Zy65ZKM56ue5oqA5Zy655qE6YeR5biB5pi+56S6XG4gICAgICAvLyDnq57mioDlnLrmqKHlvI/kuIvmmL7npLogYXJlbmFfZ29sZO+8iOW9k+acn+i1m+S6i+mHkeW4ge+8ie+8jOaZrumAmuWcuuaYvuekuiBnb2xkX2NvdW5077yI5qyi5LmQ6LGG77yJXG4gICAgICB2YXIgZGlzcGxheVZhbHVlID0gMFxuICAgICAgdmFyIGlzQXJlbmFNb2RlID0gZGF0YS5yb29tX2NhdGVnb3J5ID09PSAyIHx8IHRoaXMuX2lzQXJlbmFNb2RlXG5cbiAgICAgIGlmIChpc0FyZW5hTW9kZSkge1xuICAgICAgICAgIC8vIOernuaKgOWcuuaooeW8j++8muS8mOWFiOaYvuekuiBhcmVuYV9nb2xk77yI5b2T5pyf6LWb5LqL6YeR5biB77yJXG4gICAgICAgICAgaWYgKGRhdGEuYXJlbmFfZ29sZCAhPT0gdW5kZWZpbmVkICYmIGRhdGEuYXJlbmFfZ29sZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICBkaXNwbGF5VmFsdWUgPSBkYXRhLmFyZW5hX2dvbGRcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtwbGF5ZXJfbm9kZV0g56ue5oqA5Zy65qih5byPIC0g5pi156ewOlwiLCBkYXRhLm5pY2tfbmFtZSwgXCJhcmVuYV9nb2xkOlwiLCBkYXRhLmFyZW5hX2dvbGQsIFwi5pyf5Y+3OlwiLCBkYXRhLnBlcmlvZF9ubylcbiAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEubWF0Y2hfY29pbiAhPT0gdW5kZWZpbmVkICYmIGRhdGEubWF0Y2hfY29pbiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICBkaXNwbGF5VmFsdWUgPSBkYXRhLm1hdGNoX2NvaW5cbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtwbGF5ZXJfbm9kZV0g56ue5oqA5Zy65qih5byPKOWFvOWuuSkgLSDmmLXnp7A6XCIsIGRhdGEubmlja19uYW1lLCBcIm1hdGNoX2NvaW46XCIsIGRhdGEubWF0Y2hfY29pbilcbiAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEuZ29sZF9jb3VudCAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZ29sZF9jb3VudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICBkaXNwbGF5VmFsdWUgPSBkYXRhLmdvbGRfY291bnRcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtwbGF5ZXJfbm9kZV0g56ue5oqA5Zy65qih5byP77yI5pegYXJlbmFfZ29sZO+8iS0g5L2/55SoIGdvbGRfY291bnQ6XCIsIGRhdGEuZ29sZF9jb3VudClcbiAgICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIOaZrumAmuWcuu+8muaYvuekuuasouS5kOixhlxuICAgICAgICAgIGlmIChkYXRhLmdvbGRfY291bnQgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmdvbGRfY291bnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgZGlzcGxheVZhbHVlID0gZGF0YS5nb2xkX2NvdW50XG4gICAgICAgICAgfSBlbHNlIGlmIChkYXRhLmdvbGRjb3VudCAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZ29sZGNvdW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIGRpc3BsYXlWYWx1ZSA9IGRhdGEuZ29sZGNvdW50XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+qmSBbcGxheWVyX25vZGVdIOaZrumAmuWcuiAtIOaYteensDpcIiwgZGF0YS5uaWNrX25hbWUsIFwiZ29sZF9jb3VudDpcIiwgZGF0YS5nb2xkX2NvdW50LCBcIuacgOe7iOmHkeW4gTpcIiwgZGlzcGxheVZhbHVlKVxuICAgICAgfVxuXG4gICAgICB0aGlzLmdsb2JhbGNvdW50X2xhYmVsLnN0cmluZyA9IFN0cmluZyhkaXNwbGF5VmFsdWUpXG4gICAgICB0aGlzLl9pc0FyZW5hTW9kZSA9IGlzQXJlbmFNb2RlIC8vIOS/neWtmOernuaKgOWcuuaooeW8j+eKtuaAgVxuICAgICAgdGhpcy5fYXJlbmFHb2xkID0gZGlzcGxheVZhbHVlIC8vIPCflKfjgJDmlrDlop7jgJHkv53lrZjlvZPliY3otZvkuovph5HluIFcbiAgICAgIHRoaXMuX3BlcmlvZE5vID0gZGF0YS5wZXJpb2Rfbm8gfHwgXCJcIiAvLyDwn5Sn44CQ5paw5aKe44CR5L+d5a2Y5pyf5Y+3XG4gICAgICB0aGlzLmNhcmRsaXN0X25vZGUgPSBbXVxuXG4gICAgICAvLyDmo4Dmn6Xlh4blpIfnirbmgIFcbiAgICAgIHZhciBpc1JlYWR5ID0gZGF0YS5pc3JlYWR5IHx8IGRhdGEucmVhZHkgfHwgZGF0YS5Jc1JlYWR5IHx8IGZhbHNlXG4gICAgICBpZihpc1JlYWR5ID09IHRydWUgfHwgaXNSZWFkeSA9PT0gXCJ0cnVlXCIgfHwgaXNSZWFkeSA9PT0gMSl7XG4gICAgICAgIHRoaXMucmVhZHlpbWFnZS5hY3RpdmUgPSB0cnVlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlYWR5aW1hZ2UuYWN0aXZlID0gZmFsc2VcbiAgICAgIH1cblxuICAgICAgLy8g44CQ5qC45b+D5L+u5pS544CR5b2T5YmN546p5a6277yIaW5kZXggPT0gMO+8ie+8mumakOiXj+eJjOiDjO+8jOiwg+aVtOWktOWDj+S9jee9rlxuICAgICAgaWYgKGluZGV4ID09IDApIHtcbiAgICAgICAgLy8g6ZqQ6JeP54mM6IOM6IqC54K5XG4gICAgICAgIGlmICh0aGlzLmNhcmRfbm9kZSkge1xuICAgICAgICAgIHRoaXMuY2FyZF9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgLy8g6LCD5pW05aS05YOP5L2N572u5Yiw54mM6IOM5L2N572u77yI54mM6IOM5L2N572u77yaWzgwLCAzMl3vvIlcbiAgICAgICAgaWYgKHRoaXMucm9vbV90b3V4aWFuZykge1xuICAgICAgICAgIHRoaXMucm9vbV90b3V4aWFuZy5ub2RlLnggPSA4MFxuICAgICAgICAgIHRoaXMucm9vbV90b3V4aWFuZy5ub2RlLnkgPSAzMlxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmhlYWRpbWFnZSkge1xuICAgICAgICAgIHRoaXMuaGVhZGltYWdlLm5vZGUueCA9IDgwXG4gICAgICAgICAgdGhpcy5oZWFkaW1hZ2Uubm9kZS55ID0gMzJcbiAgICAgICAgfVxuICAgICAgICAvLyDosIPmlbTmmLXnp7DmoIfnrb7kvY3nva7vvIjlpLTlg4/mraPkuIrmlrnvvIzlsYXkuK3mmL7npLrvvIlcbiAgICAgICAgaWYgKHRoaXMubmlja25hbWVfbGFiZWwgJiYgdGhpcy5uaWNrbmFtZV9sYWJlbC5ub2RlKSB7XG4gICAgICAgICAgLy8g6K6+572u6ZSa54K55Li65Lit5b+D77yM56Gu5L+d5bGF5Lit5pi+56S6XG4gICAgICAgICAgdGhpcy5uaWNrbmFtZV9sYWJlbC5ub2RlLmFuY2hvclggPSAwLjVcbiAgICAgICAgICB0aGlzLm5pY2tuYW1lX2xhYmVsLm5vZGUuYW5jaG9yWSA9IDAuNVxuICAgICAgICAgIC8vIOS9jee9ruS4juWktOWDjyB4IOebuOWQjO+8jHkg5Zyo5aS05YOP5LiK5pa5XG4gICAgICAgICAgdGhpcy5uaWNrbmFtZV9sYWJlbC5ub2RlLnggPSA4MFxuICAgICAgICAgIHRoaXMubmlja25hbWVfbGFiZWwubm9kZS55ID0gOTBcbiAgICAgICAgfVxuICAgICAgICAvLyDosIPmlbTph5HluIHmoIfnrb7kvY3nva7vvIjlpLTlg4/kuIvmlrnvvIzlsYXkuK3mmL7npLrvvIlcbiAgICAgICAgaWYgKHRoaXMuZ2xvYmFsY291bnRfbGFiZWwgJiYgdGhpcy5nbG9iYWxjb3VudF9sYWJlbC5ub2RlKSB7XG4gICAgICAgICAgLy8g6K6+572u6ZSa54K55Li65Lit5b+D77yM56Gu5L+d5bGF5Lit5pi+56S6XG4gICAgICAgICAgdGhpcy5nbG9iYWxjb3VudF9sYWJlbC5ub2RlLmFuY2hvclggPSAwLjVcbiAgICAgICAgICB0aGlzLmdsb2JhbGNvdW50X2xhYmVsLm5vZGUuYW5jaG9yWSA9IDAuNVxuICAgICAgICAgIC8vIOS9jee9ruS4juWktOWDjyB4IOebuOWQjO+8jHkg5Zyo5aS05YOP5LiL5pa5XG4gICAgICAgICAgdGhpcy5nbG9iYWxjb3VudF9sYWJlbC5ub2RlLnggPSA4MFxuICAgICAgICAgIHRoaXMuZ2xvYmFsY291bnRfbGFiZWwubm9kZS55ID0gLTI4XG4gICAgICAgIH1cbiAgICAgICAgLy8g6LCD5pW06YeR5biB6IOM5pmv5qGG5L2N572u77yI5LiO6YeR5biB5qCH562+5a+56b2Q77yJXG4gICAgICAgIGlmICh0aGlzLnJvb21fbW9uZXlfZnJhbWUpIHtcbiAgICAgICAgICB0aGlzLnJvb21fbW9uZXlfZnJhbWUueCA9IDgwXG4gICAgICAgICAgdGhpcy5yb29tX21vbmV5X2ZyYW1lLnkgPSAtMjhcbiAgICAgICAgfVxuICAgICAgICAvLyDosIPmlbTlh4blpIflm77moIfkvY3nva7vvIjlpLTlg4/lj7PkuIvop5LvvIlcbiAgICAgICAgaWYgKHRoaXMucmVhZHlpbWFnZSkge1xuICAgICAgICAgIHRoaXMucmVhZHlpbWFnZS54ID0gMTA1XG4gICAgICAgICAgdGhpcy5yZWFkeWltYWdlLnkgPSA1XG4gICAgICAgIH1cbiAgICAgICAgLy8g6LCD5pW05Zyw5Li75Zu+5qCH5L2N572u77yI5aS05YOP5Y+z5LiL6KeS77yJXG4gICAgICAgIGlmICh0aGlzLm1hc3Rlckljb24pIHtcbiAgICAgICAgICB0aGlzLm1hc3Rlckljb24ueCA9IDEwNVxuICAgICAgICAgIHRoaXMubWFzdGVySWNvbi55ID0gNVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIOiuvue9ruWxgue6p1xuICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkWhlYWRpbWFnZe+8iOWktOWDj++8ieW6lOivpeWcqCByb29tX3RvdXhpYW5n77yI5aS05YOP5qGG77yJ55qE5LiK5bGCXG4gICAgICBpZiAodGhpcy5yb29tX3RvdXhpYW5nICYmIHRoaXMuaGVhZGltYWdlKSB7XG4gICAgICAgICAgdGhpcy5yb29tX3RvdXhpYW5nLm5vZGUuekluZGV4ID0gMCAgIC8vIOWktOWDj+ahhuWcqOW6leWxglxuICAgICAgICAgIHRoaXMuaGVhZGltYWdlLm5vZGUuekluZGV4ID0gMTAwICAgICAvLyDlpLTlg4/lnKjkuIrlsYLmmL7npLpcbiAgICAgICAgICB0aGlzLmhlYWRpbWFnZS5ub2RlLnBhcmVudC5zb3J0QWxsQ2hpbGRyZW4oKVxuICAgICAgfVxuXG4gICAgICAvLyDwn5Sn44CQ5L+u5aSN44CR5Yqg6L295aS05YOPIC0g5pSv5oyB6L+c56iLVVJM5ZKM5pys5Zyw6LWE5rqQXG4gICAgICAvLyDmnI3liqHnq6/lj6/og73ov5Tlm54gYXZhdGFyLCBhdmF0YXJVcmwsIOaIliBhdmF0YXJ1cmwg5a2X5q61XG4gICAgICB2YXIgYXZhdGFyVXJsID0gZGF0YS5hdmF0YXIgfHwgZGF0YS5hdmF0YXJVcmwgfHwgZGF0YS5hdmF0YXJ1cmwgfHwgXCJhdmF0YXJfMVwiXG4gICAgICB0aGlzLl9sb2FkQXZhdGFyKGF2YXRhclVybClcblxuICAgICAgLy8g5YeG5aSH6YCa55+lXG4gICAgICB0aGlzLm5vZGUub24oXCJwbGF5ZXJfcmVhZHlfbm90aWZ5XCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgdmFyIGRldGFpbCA9IGV2ZW50XG4gICAgICAgICAgdmFyIHJlYWR5UGxheWVySWQgPSBcIlwiXG4gICAgICAgICAgaWYgKHR5cGVvZiBkZXRhaWwgPT09ICdvYmplY3QnICYmIGRldGFpbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICByZWFkeVBsYXllcklkID0gZGV0YWlsLnBsYXllcl9pZCB8fCBkZXRhaWwucGxheWVySWQgfHwgZGV0YWlsLmlkIHx8IFwiXCJcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZWFkeVBsYXllcklkID0gZGV0YWlsXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYocmVhZHlQbGF5ZXJJZCA9PSB0aGlzLmFjY291bnRpZCl7XG4gICAgICAgICAgICAgIHRoaXMucmVhZHlpbWFnZS5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgfVxuICAgICAgfS5iaW5kKHRoaXMpKVxuXG4gICAgICAvLyDmiqLlnLDkuLvpgJrnn6VcbiAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmjqXmlLbljIXlkKsgcGxheWVyX2lkIOWSjCB0aW1lb3V0IOeahOS6i+S7tuWvueixoe+8jOS4jeWGjeehrOe8lueggVxuICAgICAgdGhpcy5ub2RlLm9uKFwicGxheWVybm9kZV9jYW5yb2JfZXZlbnRcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyDlhbzlrrnlpITnkIbvvJpldmVudCDlj6/og73mmK/lrZfnrKbkuLLvvIjml6fmoLzlvI/vvInmiJblr7nosaHvvIjmlrDmoLzlvI/vvIlcbiAgICAgICAgICB2YXIgcGxheWVySWQgPSBldmVudFxuICAgICAgICAgIHZhciB0aW1lb3V0ID0gMTUgIC8vIOm7mOiupCAxNSDnp5JcbiAgICAgICAgICBcbiAgICAgICAgICBpZiAodHlwZW9mIGV2ZW50ID09PSAnb2JqZWN0JyAmJiBldmVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICBwbGF5ZXJJZCA9IGV2ZW50LnBsYXllcl9pZFxuICAgICAgICAgICAgICB0aW1lb3V0ID0gZXZlbnQudGltZW91dCB8fCAxNVxuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyDlrZjlgqggdGltZW91dCDlgLzkvpvlgJLorqHml7bmm7TmlrDkvb/nlKhcbiAgICAgICAgICB0aGlzLl9zZXJ2ZXJUaW1lb3V0ID0gdGltZW91dFxuICAgICAgICAgIFxuICAgICAgICAgIGlmKHBsYXllcklkID09IHRoaXMuYWNjb3VudGlkKXtcbiAgICAgICAgICAgIHRoaXMucWlhbmdkaWR6aHVfbm9kZS5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICBpZiAodGhpcy50aW1lX2xhYmVsKSB7XG4gICAgICAgICAgICAgIHRoaXMudGltZV9sYWJlbC5zdHJpbmcgPSBTdHJpbmcodGltZW91dClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9LmJpbmQodGhpcykpXG4gICAgICBcbiAgICAgIC8vIPCflZAg5a2Y5YKo5pyN5Yqh56uv5Lyg6YCS55qEIHRpbWVvdXQg5YC8XG4gICAgICB0aGlzLl9zZXJ2ZXJUaW1lb3V0ID0gMTVcblxuICAgICAgaWYoaW5kZXggPT0gMSl7XG4gICAgICAgIHRoaXMuY2FyZF9ub2RlLnggPSAtdGhpcy5jYXJkX25vZGUueCAtIDMwXG4gICAgICB9XG4gICAgfSxcblxuICAgIF9zZXRBdmF0YXJTcHJpdGU6IGZ1bmN0aW9uKHNwcml0ZUZyYW1lKSB7XG4gICAgICAgIGlmICghdGhpcy5oZWFkaW1hZ2UgfHwgIXNwcml0ZUZyYW1lKSByZXR1cm5cbiAgICAgICAgdGhpcy5oZWFkaW1hZ2UuZW5hYmxlZCA9IHRydWVcbiAgICAgICAgdGhpcy5oZWFkaW1hZ2Uuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZVxuICAgICAgICB0aGlzLmhlYWRpbWFnZS5ub2RlLnNldENvbnRlbnRTaXplKDgwLCA4MClcbiAgICAgICAgdGhpcy5oZWFkaW1hZ2Uubm9kZS5zY2FsZSA9IDFcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeWKoOi9veWktOWDjyAtIOaUr+aMgei/nOeoi1VSTOWSjOacrOWcsOi1hOa6kFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBhdmF0YXJVcmwgLSDlpLTlg49VUkzmiJbmnKzlnLDotYTmupDlkI1cbiAgICAgKi9cbiAgICBfbG9hZEF2YXRhcjogZnVuY3Rpb24oYXZhdGFyVXJsKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLmhlYWRpbWFnZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+WvO+4jyBbcGxheWVyX25vZGVdIGhlYWRpbWFnZSDmnKrnu5HlrppcIilcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8g56m65YC85aSE55CGXG4gICAgICAgIGlmICghYXZhdGFyVXJsIHx8IGF2YXRhclVybCA9PT0gXCJcIikge1xuICAgICAgICAgICAgdGhpcy5fbG9hZERlZmF1bHRBdmF0YXIoKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICAvLyDwn5Sn44CQ5LyY5YyW44CR5LyY5YWI5L2/55So6aKE5Yqg6L2955qE57yT5a2Y5aS05YOPXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbFxuICAgICAgICBpZiAobXlnbG9iYWwgJiYgbXlnbG9iYWwuX2F2YXRhckNhY2hlICYmIG15Z2xvYmFsLl9hdmF0YXJDYWNoZVthdmF0YXJVcmxdKSB7XG4gICAgICAgICAgICB2YXIgY2FjaGVkU3ByaXRlRnJhbWUgPSBteWdsb2JhbC5fYXZhdGFyQ2FjaGVbYXZhdGFyVXJsXVxuICAgICAgICAgICAgaWYgKGNhY2hlZFNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn5a877iPIFtwbGF5ZXJfbm9kZV0g5L2/55So57yT5a2Y5aS05YOPOlwiLCBhdmF0YXJVcmwpXG4gICAgICAgICAgICAgICAgc2VsZi5fc2V0QXZhdGFyU3ByaXRlKGNhY2hlZFNwcml0ZUZyYW1lKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeWkhOeQhuS7pSAvIOW8gOWktOeahOi3r+W+hO+8iOacjeWKoeWZqOebuOWvuei3r+W+hO+8iVxuICAgICAgICBpZiAoYXZhdGFyVXJsLmluZGV4T2YoJy8nKSA9PT0gMCAmJiBhdmF0YXJVcmwuaW5kZXhPZignL3VwbG9hZHMvJykgPT09IDApIHtcbiAgICAgICAgICAgIC8vIOaLvOaOpeacjeWKoeWZqOWcsOWdgFxuICAgICAgICAgICAgdmFyIGNkblVybCA9IG15Z2xvYmFsICYmIG15Z2xvYmFsLmNkblVybCA/IG15Z2xvYmFsLmNkblVybCA6IFwiaHR0cHM6Ly9hcGlzLmhvbmd4aXU4OC5jb21cIlxuICAgICAgICAgICAgdmFyIHNlcnZlclVybCA9IGNkblVybCArIGF2YXRhclVybFxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn5a877iPIFtwbGF5ZXJfbm9kZV0g5Yqg6L295pyN5Yqh5Zmo5aS05YOPKOagvOW8jzEpOlwiLCBzZXJ2ZXJVcmwpXG4gICAgICAgICAgICB0aGlzLl9sb2FkUmVtb3RlQXZhdGFyKHNlcnZlclVybClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Yik5pat5piv5ZCm5piv6L+c56iLVVJMXG4gICAgICAgIGlmIChhdmF0YXJVcmwuaW5kZXhPZignaHR0cDovLycpID09PSAwIHx8IGF2YXRhclVybC5pbmRleE9mKCdodHRwczovLycpID09PSAwKSB7XG4gICAgICAgICAgICAvLyDov5znqItVUkzlpLTlg49cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+WvO+4jyBbcGxheWVyX25vZGVdIOWKoOi9vei/nOeoi+WktOWDjzpcIiwgYXZhdGFyVXJsKVxuICAgICAgICAgICAgdGhpcy5fbG9hZFJlbW90ZUF2YXRhcihhdmF0YXJVcmwpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDmnKzlnLDotYTmupDlpLTlg49cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+WvO+4jyBbcGxheWVyX25vZGVdIOWKoOi9veacrOWcsOWktOWDjzpcIiwgYXZhdGFyVXJsKVxuICAgICAgICAgICAgdmFyIGxvY2FsUGF0aCA9IFwiVUkvaGVhZGltYWdlL1wiICsgYXZhdGFyVXJsXG4gICAgICAgICAgICBjYy5sb2FkZXIubG9hZFJlcyhsb2NhbFBhdGgsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVyciB8fCAhc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi8J+WvO+4jyBbcGxheWVyX25vZGVdIOacrOWcsOWktOWDj+WKoOi9veWksei0pe+8jOS9v+eUqOm7mOiupOWktOWDjzpcIiwgZXJyKVxuICAgICAgICAgICAgICAgICAgICBzZWxmLl9sb2FkRGVmYXVsdEF2YXRhcigpXG4gICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLl9zZXRBdmF0YXJTcHJpdGUoc3ByaXRlRnJhbWUpXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn5a877iPIFtwbGF5ZXJfbm9kZV0g5pys5Zyw5aS05YOP5Yqg6L295oiQ5YqfXCIpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIPCflKfjgJDmlrDlop7jgJHliqDovb3ov5znqIvlpLTlg49cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0g5a6M5pW055qE6L+c56iLVVJMXG4gICAgICovXG4gICAgX2xvYWRSZW1vdGVBdmF0YXI6IGZ1bmN0aW9uKHVybCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgXG4gICAgICAgIC8vIPCflKfjgJDkv67lpI3jgJHmoLnmja5VUkznoa7lrprmraPnoa7nmoTmianlsZXlkI3vvIzpgb/lhY3liqDovb3lpLHotKVcbiAgICAgICAgdmFyIGV4dCA9ICcucG5nJyAgLy8g6buY6K6k5omp5bGV5ZCNXG4gICAgICAgIGlmICh1cmwuaW5kZXhPZignLmpwZycpID4gMCB8fCB1cmwuaW5kZXhPZignLmpwZWcnKSA+IDApIHtcbiAgICAgICAgICAgIGV4dCA9ICcuanBnJ1xuICAgICAgICB9IGVsc2UgaWYgKHVybC5pbmRleE9mKCcucG5nJykgPiAwKSB7XG4gICAgICAgICAgICBleHQgPSAnLnBuZydcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCLwn5a877iPIFtwbGF5ZXJfbm9kZV0g5byA5aeL5Yqg6L296L+c56iL5aS05YOPOlwiLCB1cmwsIFwi5omp5bGV5ZCNOlwiLCBleHQpXG4gICAgICAgIFxuICAgICAgICBjYy5hc3NldE1hbmFnZXIubG9hZFJlbW90ZSh1cmwsIGZ1bmN0aW9uKGVyciwgdGV4dHVyZSkge1xuICAgICAgICAgICAgaWYgKGVyciB8fCAhdGV4dHVyZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCflrzvuI8gW3BsYXllcl9ub2RlXSDov5znqIvlpLTlg4/liqDovb3lpLHotKXvvIzkvb/nlKjpu5jorqTlpLTlg486XCIsIGVycilcbiAgICAgICAgICAgICAgICBzZWxmLl9sb2FkRGVmYXVsdEF2YXRhcigpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBzcHJpdGVGcmFtZSA9IG5ldyBjYy5TcHJpdGVGcmFtZSh0ZXh0dXJlKVxuICAgICAgICAgICAgICAgIGlmIChzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zZXRBdmF0YXJTcHJpdGUoc3ByaXRlRnJhbWUpXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+WvO+4jyBbcGxheWVyX25vZGVdIOi/nOeoi+WktOWDj+WKoOi9veaIkOWKnzpcIiwgdXJsKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLwn5a877iPIFtwbGF5ZXJfbm9kZV0g5Yib5bu6U3ByaXRlRnJhbWXlpLHotKU6XCIsIGUpXG4gICAgICAgICAgICAgICAgc2VsZi5fbG9hZERlZmF1bHRBdmF0YXIoKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5paw5aKe44CR5Yqg6L296buY6K6k5aS05YOPXG4gICAgICovXG4gICAgX2xvYWREZWZhdWx0QXZhdGFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgIGNjLmxvYWRlci5sb2FkUmVzKFwiVUkvaGVhZGltYWdlL2F2YXRhcl8xXCIsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoIWVyciAmJiBzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3NldEF2YXRhclNwcml0ZShzcHJpdGVGcmFtZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICog8J+Up+OAkOaWsOWinuOAkeabtOaWsOernuaKgOWcuueOqeWutuaVsOaNru+8iOWktOWDj+OAgemHkeW4geetie+8iVxuICAgICAqIOW9k+aUtuWIsCBST09NX0pPSU5FRCDmtojmga/lkI7osIPnlKjvvIzmm7TmlrDku47mnI3liqHnq6/ojrflj5bnmoTmraPnoa7mlbDmja5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIOWMheWQqyBnb2xkX2NvdW50LCBhcmVuYV9nb2xkLCBtYXRjaF9jb2luLCBhdmF0YXIsIGF2YXRhclVybFxuICAgICAqL1xuICAgIHVwZGF0ZUFyZW5hRGF0YTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW3BsYXllcl9ub2RlXSB1cGRhdGVBcmVuYURhdGEg6KKr6LCD55SoLCBhY2NvdW50aWQ6XCIsIHRoaXMuYWNjb3VudGlkLCBcImRhdGE6XCIsIEpTT04uc3RyaW5naWZ5KGRhdGEpKVxuICAgICAgICBcbiAgICAgICAgLy8g8J+Up+OAkOS/ruWkjeOAkeernuaKgOWcuuaooeW8j+S8mOWFiOS9v+eUqCBtYXRjaF9jb2lu77yM5YW25qyhIGFyZW5hX2dvbGRcbiAgICAgICAgdmFyIGRpc3BsYXlWYWx1ZSA9IDBcbiAgICAgICAgaWYgKGRhdGEubWF0Y2hfY29pbiAhPT0gdW5kZWZpbmVkICYmIGRhdGEubWF0Y2hfY29pbiAhPT0gbnVsbCAmJiBkYXRhLm1hdGNoX2NvaW4gPiAwKSB7XG4gICAgICAgICAgICBkaXNwbGF5VmFsdWUgPSBkYXRhLm1hdGNoX2NvaW5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbcGxheWVyX25vZGVdIOabtOaWsCBtYXRjaF9jb2luOlwiLCBkYXRhLm1hdGNoX2NvaW4pXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5hcmVuYV9nb2xkICE9PSB1bmRlZmluZWQgJiYgZGF0YS5hcmVuYV9nb2xkICE9PSBudWxsICYmIGRhdGEuYXJlbmFfZ29sZCA+IDApIHtcbiAgICAgICAgICAgIGRpc3BsYXlWYWx1ZSA9IGRhdGEuYXJlbmFfZ29sZFxuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtwbGF5ZXJfbm9kZV0g5pu05pawIGFyZW5hX2dvbGQ6XCIsIGRhdGEuYXJlbmFfZ29sZClcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLmdvbGRfY291bnQgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmdvbGRfY291bnQgIT09IG51bGwgJiYgZGF0YS5nb2xkX2NvdW50ID4gMCkge1xuICAgICAgICAgICAgZGlzcGxheVZhbHVlID0gZGF0YS5nb2xkX2NvdW50XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIvCfj5/vuI8gW3BsYXllcl9ub2RlXSDmm7TmlrAgZ29sZF9jb3VudDpcIiwgZGF0YS5nb2xkX2NvdW50KVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDwn5Sn44CQ5YWz6ZSu5L+u5aSN44CR5L2/55So5q2j56Gu55qEIGdsb2JhbGNvdW50X2xhYmVsIOiAjOmdniBnb2xkX2xhYmVsXG4gICAgICAgIGlmIChkaXNwbGF5VmFsdWUgPiAwICYmIHRoaXMuZ2xvYmFsY291bnRfbGFiZWwpIHtcbiAgICAgICAgICAgIHRoaXMuZ2xvYmFsY291bnRfbGFiZWwuc3RyaW5nID0gZGlzcGxheVZhbHVlLnRvU3RyaW5nKClcbiAgICAgICAgICAgIHRoaXMuX2FyZW5hR29sZCA9IGRpc3BsYXlWYWx1ZSAvLyDmm7TmlrDkv53lrZjnmoTotZvkuovph5HluIFcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi8J+Pn++4jyBbcGxheWVyX25vZGVdIOmHkeW4geW3suabtOaWsOS4ujpcIiwgZGlzcGxheVZhbHVlKVxuICAgICAgICB9IGVsc2UgaWYgKGRpc3BsYXlWYWx1ZSA9PT0gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtwbGF5ZXJfbm9kZV0g6K2m5ZGK77yaZGlzcGxheVZhbHVlIOS4uiAw77yM6Lez6L+H5pu05pawXCIpXG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuZ2xvYmFsY291bnRfbGFiZWwpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIvCfj5/vuI8gW3BsYXllcl9ub2RlXSDplJnor6/vvJpnbG9iYWxjb3VudF9sYWJlbCDmnKrnu5HlrprvvIFcIilcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5pu05paw5aS05YOPXG4gICAgICAgIHZhciBhdmF0YXJVcmwgPSBkYXRhLmF2YXRhciB8fCBkYXRhLmF2YXRhclVybFxuICAgICAgICBpZiAoYXZhdGFyVXJsICYmIGF2YXRhclVybCAhPT0gXCJcIiAmJiBhdmF0YXJVcmwgIT09IFwiYXZhdGFyXzFcIikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCLwn4+f77iPIFtwbGF5ZXJfbm9kZV0g5pu05paw5aS05YOPOlwiLCBhdmF0YXJVcmwpXG4gICAgICAgICAgICB0aGlzLl9sb2FkQXZhdGFyKGF2YXRhclVybClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyDjgJDmoLjlv4PjgJHnm7TmjqXmmL7npLrniYzog4zvvIjml6DliqjnlLvvvIzkv53or4HmlbDmja7mraPnoa7mgKfvvIlcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICAvKipcbiAgICAgKiDmmL7npLrmjIflrprmlbDph4/nmoTniYzog4xcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY291bnQgLSDniYzog4zmlbDph49cbiAgICAgKiDjgJDph43opoHjgJHlvZPliY3njqnlrrbvvIhpbmRleCA9PSAw77yJ5LiN5pi+56S654mM6IOMXG4gICAgICovXG4gICAgc2hvd0NhcmRCYWNrczogZnVuY3Rpb24oY291bnQpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIOOAkOaguOW/g+OAkeajgOafpeaYr+WQpuaYr+W9k+WJjeeOqeWutu+8iGluZGV4ID09IDDvvInvvIzlpoLmnpzmmK/liJnkuI3mmL7npLrniYzog4xcbiAgICAgICAgaWYgKHRoaXMuc2VhdF9pbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcy5jYXJkX25vZGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn4OPIFtwbGF5ZXJfbm9kZV0gY2FyZF9ub2RlIOacque7keWumlwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOa4heeQhuaXp+eJjFxuICAgICAgICB0aGlzLmNhcmRfbm9kZS5yZW1vdmVBbGxDaGlsZHJlbih0cnVlKVxuICAgICAgICB0aGlzLmNhcmRsaXN0X25vZGUgPSBbXVxuICAgICAgICBcbiAgICAgICAgaWYgKGNvdW50IDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuY2FyZF9ub2RlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDYXJkQ291bnQgPSAwXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5jYXJkX25vZGUuYWN0aXZlID0gdHJ1ZVxuICAgICAgICB0aGlzLmN1cnJlbnRDYXJkQ291bnQgPSBjb3VudFxuICAgICAgICBcbiAgICAgICAgaWYgKCF0aGlzLmNhcmRfcHJlZmFiKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+DjyBbcGxheWVyX25vZGVdIGNhcmRfcHJlZmFiIOacque7keWumlwiKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOebtOaOpeWIm+W7uuaJgOacieeJjOiDjO+8iOaXoOWKqOeUu++8iVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjYXJkID0gY2MuaW5zdGFudGlhdGUodGhpcy5jYXJkX3ByZWZhYilcbiAgICAgICAgICAgIGlmICghY2FyZCkgY29udGludWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FyZC5zY2FsZSA9IDAuNlxuICAgICAgICAgICAgY2FyZC5wYXJlbnQgPSB0aGlzLmNhcmRfbm9kZVxuICAgICAgICAgICAgY2FyZC5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOWeguebtOWghuWPoOW4g+WxgFxuICAgICAgICAgICAgdmFyIGhlaWdodCA9IGNhcmQuaGVpZ2h0XG4gICAgICAgICAgICBjYXJkLnkgPSAoY291bnQgLSAxKSAqIDAuNSAqIGhlaWdodCAqIDAuNCAqIDAuMyAtIGhlaWdodCAqIDAuNCAqIDAuMyAqIGlcbiAgICAgICAgICAgIGNhcmQueCA9IDBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5jYXJkbGlzdF9ub2RlLnB1c2goY2FyZClcbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9LFxuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIOOAkOaWsOWinuOAkeeOqeWutueKtuaAgeabtOaWsOWkhOeQhlxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIOabtOaWsOeOqeWutueKtuaAgVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0g5YyF5ZCrIHN0YXRlLCBjYXJkc19jb3VudCwgaXNfbGFuZGxvcmQsIHRpbWVvdXRcbiAgICAgKi9cbiAgICBfdXBkYXRlUGxheWVyU3RhdGU6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOemu+e6vy/miZjnrqHnirbmgIHmmL7npLpcbiAgICAgICAgaWYgKGRhdGEuc3RhdGUgPT09IFwib2ZmbGluZVwiKSB7XG4gICAgICAgICAgICAvLyDnjqnlrrbnprvnur/vvIzmmL7npLrnprvnur/lm77moIdcbiAgICAgICAgICAgIGlmICh0aGlzLm9mZmxpbmVpbWFnZSkge1xuICAgICAgICAgICAgICAgIHRoaXMub2ZmbGluZWltYWdlLmFjdGl2ZSA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLnN0YXRlID09PSBcInJvYm90XCIpIHtcbiAgICAgICAgICAgIC8vIOacuuWZqOS6uuaJmOeuoe+8jOaYvuekuuaJmOeuoeWbvuagh1xuICAgICAgICAgICAgaWYgKHRoaXMudHJ1c3RlZWltYWdlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50cnVzdGVlaW1hZ2UuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5YW85a6577ya5aaC5p6c5rKh5pyJ5omY566h5Zu+5qCH77yM5aSN55So56a757q/5Zu+5qCHXG4gICAgICAgICAgICBpZiAoIXRoaXMudHJ1c3RlZWltYWdlICYmIHRoaXMub2ZmbGluZWltYWdlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vZmZsaW5laW1hZ2UuYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuc3RhdGUgPT09IFwib25saW5lXCIpIHtcbiAgICAgICAgICAgIC8vIOeOqeWutuWcqOe6v++8jOmakOiXj+emu+e6vy/miZjnrqHlm77moIdcbiAgICAgICAgICAgIGlmICh0aGlzLm9mZmxpbmVpbWFnZSkge1xuICAgICAgICAgICAgICAgIHRoaXMub2ZmbGluZWltYWdlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy50cnVzdGVlaW1hZ2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRydXN0ZWVpbWFnZS5hY3RpdmUgPSBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmm7TmlrDniYzmlbBcbiAgICAgICAgaWYgKGRhdGEuY2FyZHNfY291bnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FyZENvdW50ID0gZGF0YS5jYXJkc19jb3VudFxuICAgICAgICAgICAgdGhpcy5zaG93Q2FyZEJhY2tzKGRhdGEuY2FyZHNfY291bnQpXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOWcsOS4u+agh+ivhlxuICAgICAgICBpZiAoZGF0YS5pc19sYW5kbG9yZCAhPT0gdW5kZWZpbmVkICYmIGRhdGEuaXNfbGFuZGxvcmQgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1hc3Rlckljb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1hc3Rlckljb24uYWN0aXZlID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvKipcbiAgICAgKiDwn5Sn44CQ5omY566h44CR5pu05paw5omY566h54q25oCBXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSDljIXlkKsgcGxheWVyX2lkLCBwbGF5ZXJfbmFtZSwgaXNfdHJ1c3RlZSwgcmVhc29uXG4gICAgICovXG4gICAgX3VwZGF0ZVRydXN0ZWVTdGF0ZTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAvLyDlj6rlpITnkIblvZPliY3njqnlrrbnmoTmiZjnrqHnirbmgIFcbiAgICAgICAgaWYgKGRhdGEucGxheWVyX2lkICE9PSB0aGlzLmFjY291bnRpZCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOabtOaWsOaJmOeuoeeKtuaAgeWPmOmHj1xuICAgICAgICB0aGlzLl9pc1RydXN0ZWUgPSBkYXRhLmlzX3RydXN0ZWUgfHwgZmFsc2VcbiAgICAgICAgY29uc29sZS5sb2coXCLwn5SEIFtwbGF5ZXJfbm9kZV0g5omY566h54q25oCB5pu05pawOlwiLCBkYXRhLnBsYXllcl9uYW1lLCBcImlzX3RydXN0ZWU6XCIsIHRoaXMuX2lzVHJ1c3RlZSwgXCJyZWFzb246XCIsIGRhdGEucmVhc29uKVxuICAgICAgICBcbiAgICAgICAgaWYgKGRhdGEuaXNfdHJ1c3RlZSkge1xuICAgICAgICAgICAgLy8g5byA5ZCv5omY566h54q25oCBXG4gICAgICAgICAgICBpZiAodGhpcy50cnVzdGVlaW1hZ2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRydXN0ZWVpbWFnZS5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDlhbzlrrnvvJrlpoLmnpzmsqHmnInmiZjnrqHlm77moIfvvIzlpI3nlKjnprvnur/lm77moIdcbiAgICAgICAgICAgIGlmICghdGhpcy50cnVzdGVlaW1hZ2UgJiYgdGhpcy5vZmZsaW5laW1hZ2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9mZmxpbmVpbWFnZS5hY3RpdmUgPSB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDlj5bmtojmiZjnrqHnirbmgIFcbiAgICAgICAgICAgIGlmICh0aGlzLnRydXN0ZWVpbWFnZSkge1xuICAgICAgICAgICAgICAgIHRoaXMudHJ1c3RlZWltYWdlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDlkIzml7bpmpDol4/nprvnur/lm77moIdcbiAgICAgICAgICAgIGlmICh0aGlzLm9mZmxpbmVpbWFnZSkge1xuICAgICAgICAgICAgICAgIHRoaXMub2ZmbGluZWltYWdlLmFjdGl2ZSA9IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59KTtcbiJdfQ==