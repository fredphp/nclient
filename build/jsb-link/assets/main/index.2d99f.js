window.__require = function e(o, n, t) {
function a(r, c) {
if (!n[r]) {
if (!o[r]) {
var l = r.split("/");
l = l[l.length - 1];
if (!o[l]) {
var s = "function" == typeof __require && __require;
if (!c && s) return s(l, !0);
if (i) return i(l, !0);
throw new Error("Cannot find module '" + r + "'");
}
r = l;
}
var d = n[r] = {
exports: {}
};
o[r][0].call(d.exports, function(e) {
return a(o[r][1][e] || e);
}, d, d.exports, e, o, n, t);
}
return n[r].exports;
}
for (var i = "function" == typeof __require && __require, r = 0; r < t.length; r++) a(t[r]);
return a;
}({
ArenaEnterWaitingScene: [ function(e, o) {
"use strict";
cc._RF.push(o, "becf0KiEm1GR5ggywQq+KZw", "ArenaEnterWaitingScene");
cc.Class({
extends: cc.Component,
properties: {
periodNoLabel: {
type: cc.Label,
default: null
},
roomNameLabel: {
type: cc.Label,
default: null
},
countdownLabel: {
type: cc.Label,
default: null
},
messageLabel: {
type: cc.Label,
default: null
},
playerCountLabel: {
type: cc.Label,
default: null
},
playerListContainer: {
type: cc.Node,
default: null
},
playerItemPrefab: {
type: cc.Prefab,
default: null
},
loadingNode: {
type: cc.Node,
default: null
},
phaseLabel: {
type: cc.Label,
default: null
},
progressBar: {
type: cc.ProgressBar,
default: null
}
},
onLoad: function() {
this._periodNo = "";
this._roomId = 0;
this._roomName = "";
this._phase = "waiting";
this._countdown = 60;
this._totalPlayers = 0;
this._enteredPlayers = 0;
this._players = [];
this._startTime = 0;
this._registerEvents();
console.log("🏟️ [ArenaEnterWaiting] 等待界面加载完成");
},
start: function() {
this._startLoadingAnimation();
},
onDestroy: function() {
this._unregisterEvents();
this._stopLoadingAnimation();
},
_registerEvents: function() {
var e = this, o = window.myglobal, n = o && o.eventlister;
if (n) {
this._waitingStatusHandler = function(o) {
console.log("🏟️ [ArenaEnterWaiting] 收到等待状态:", JSON.stringify(o));
e._onWaitingStatus(o);
};
n.on("arena_waiting_status_notify", this._waitingStatusHandler);
this._waitingTickHandler = function(o) {
console.log("🏟️ [ArenaEnterWaiting] 倒计时更新:", o.countdown);
e._onWaitingTick(o);
};
n.on("arena_waiting_tick_notify", this._waitingTickHandler);
this._assignStartHandler = function(o) {
console.log("🏟️ [ArenaEnterWaiting] 分配阶段开始:", JSON.stringify(o));
e._onAssignStart(o);
};
n.on("arena_assign_start_notify", this._assignStartHandler);
console.log("🏟️ [ArenaEnterWaiting] 事件监听注册完成");
} else console.error("🏟️ [ArenaEnterWaiting] 事件监听器不可用");
},
_unregisterEvents: function() {
var e = window.myglobal, o = e && e.eventlister;
if (o) {
this._waitingStatusHandler && o.off("arena_waiting_status_notify", this._waitingStatusHandler);
this._waitingTickHandler && o.off("arena_waiting_tick_notify", this._waitingTickHandler);
this._assignStartHandler && o.off("arena_assign_start_notify", this._assignStartHandler);
console.log("🏟️ [ArenaEnterWaiting] 事件监听已取消");
}
},
setData: function(e) {
this._periodNo = e.period_no || "";
this._roomId = e.room_id || 0;
this._roomName = e.room_name || "";
this._phase = e.phase || "waiting";
this._countdown = e.countdown || 60;
this._totalPlayers = e.total_players || 0;
this._enteredPlayers = e.entered_players || 0;
this._players = e.players || [];
this._startTime = e.start_time || Date.now();
this._updateUI();
},
_onWaitingStatus: function(e) {
if (!this._periodNo || e.period_no === this._periodNo) {
this._periodNo = e.period_no;
this._roomId = e.room_id;
this._roomName = e.room_name;
this._phase = e.phase;
this._countdown = e.countdown;
this._totalPlayers = e.total_players;
this._enteredPlayers = e.entered_players;
this._players = e.players;
this._startTime = e.start_time;
this._updateUI();
}
},
_onWaitingTick: function(e) {
if (!this._periodNo || e.period_no === this._periodNo) {
this._countdown = e.countdown;
this._enteredPlayers = e.entered_players;
this._updateCountdownUI();
this._updatePlayerCountUI();
}
},
_onAssignStart: function(e) {
if (!this._periodNo || e.period_no === this._periodNo) {
this._phase = "assigning";
this._countdown = e.countdown;
this._totalPlayers = e.total_players;
this._enteredPlayers = e.total_players;
this._updateUI();
if (this.messageLabel) {
this.messageLabel.string = e.message || "正在分配玩家，即将进入游戏...";
this.messageLabel.node.color = new cc.Color(255, 220, 100);
}
}
},
_updateUI: function() {
this.periodNoLabel && (this.periodNoLabel.string = "期号: " + this._periodNo);
this.roomNameLabel && (this.roomNameLabel.string = this._roomName || "竞技场");
this._updateCountdownUI();
this._updatePlayerCountUI();
this._updatePhaseUI();
this._updatePlayerListUI();
this._updateProgressBar();
},
_updateCountdownUI: function() {
if (this.countdownLabel) {
this.countdownLabel.string = this._countdown + "秒";
if (this._countdown <= 10 && this._countdown > 0) {
this.countdownLabel.node.color = new cc.Color(255, 100, 100);
this._startCountdownFlash();
} else {
this.countdownLabel.node.color = new cc.Color(255, 255, 255);
this._stopCountdownFlash();
}
}
},
_updatePlayerCountUI: function() {
this.playerCountLabel && (this.playerCountLabel.string = "已进入: " + this._enteredPlayers + " / " + this._totalPlayers);
},
_updatePhaseUI: function() {
if (this.phaseLabel) switch (this._phase) {
case "waiting":
this.phaseLabel.string = "等待玩家进入";
this.phaseLabel.node.color = new cc.Color(100, 200, 255);
break;

case "assigning":
this.phaseLabel.string = "正在分配玩家";
this.phaseLabel.node.color = new cc.Color(255, 220, 100);
break;

case "entering":
this.phaseLabel.string = "即将进入游戏";
this.phaseLabel.node.color = new cc.Color(100, 255, 100);
}
if (this.messageLabel) switch (this._phase) {
case "waiting":
this.messageLabel.string = "等待其他玩家进入...";
this.messageLabel.node.color = new cc.Color(200, 200, 220);
break;

case "assigning":
this.messageLabel.string = "正在分配玩家到各桌...";
this.messageLabel.node.color = new cc.Color(255, 220, 100);
break;

case "entering":
this.messageLabel.string = "正在进入游戏...";
this.messageLabel.node.color = new cc.Color(100, 255, 100);
}
},
_updatePlayerListUI: function() {
if (this.playerListContainer) {
this.playerListContainer.removeAllChildren();
for (var e = 0; e < this._players.length; e++) {
var o = this._players[e];
this._createPlayerItem(o, e);
}
}
},
_createPlayerItem: function(e, o) {
var n = new cc.Node("PlayerItem_" + o);
n.setContentSize(cc.size(200, 40));
var t = new cc.Node("Bg"), a = t.addComponent(cc.Graphics);
a.fillColor = new cc.Color(50, 50, 70, 150);
a.roundRect(-100, -20, 200, 40, 5);
a.fill();
t.parent = n;
var i = new cc.Node("NameLabel"), r = i.addComponent(cc.Label);
r.string = e.player_name || "玩家" + e.player_id;
r.fontSize = 18;
r.lineHeight = 24;
i.color = new cc.Color(255, 255, 255);
i.setPosition(-40, 0);
i.anchorX = 0;
i.parent = n;
var c = 50 * -o;
this.playerListContainer.children.length > 0 && (c = this.playerListContainer.children[this.playerListContainer.children.length - 1].y - 50);
n.setPosition(0, c > 0 ? 0 : c);
n.parent = this.playerListContainer;
},
_updateProgressBar: function() {
if (this.progressBar && this._totalPlayers > 0) {
var e = this._enteredPlayers / this._totalPlayers;
this.progressBar.progress = Math.min(e, 1);
}
},
_startLoadingAnimation: function() {
if (this.loadingNode) {
var e = cc.rotateBy(2, 360), o = cc.repeatForever(e);
this.loadingNode.runAction(o);
}
},
_stopLoadingAnimation: function() {
this.loadingNode && this.loadingNode.stopAllActions();
},
_startCountdownFlash: function() {
if (this.countdownLabel) {
this._flashAction = cc.sequence(cc.fadeTo(.3, 128), cc.fadeTo(.3, 255));
this._flashAction = cc.repeatForever(this._flashAction);
this.countdownLabel.node.runAction(this._flashAction);
}
},
_stopCountdownFlash: function() {
if (this.countdownLabel && this._flashAction) {
this.countdownLabel.node.stopAction(this._flashAction);
this.countdownLabel.node.opacity = 255;
}
},
onCancelClick: function() {
console.log("🏟️ [ArenaEnterWaiting] 玩家点击取消");
window.myglobal && window.myglobal.socket && window.myglobal.socket.emit("arena_cancel_enter", {
period_no: this._periodNo,
room_id: this._roomId
});
cc.director.loadScene("hallScene");
}
});
cc._RF.pop();
}, {} ],
ArenaMatchWaitingScene: [ function(e, o) {
"use strict";
cc._RF.push(o, "38a3d0afaecf439abdfa63", "ArenaMatchWaitingScene");
cc.Class({
extends: cc.Component,
properties: {},
onLoad: function() {
this._periodNo = "";
this._roomId = 0;
this._roomName = "";
this._countdown = 60;
this._totalPlayers = 0;
this._enteredPlayers = 0;
this._players = [];
this._startTime = 0;
this._createUI();
this._registerEvents();
this._initFromGlobalData();
this._registerRoomJoinedHandler();
console.log("🏟️ [ArenaMatchWaiting] 等待界面加载完成");
},
_createUI: function() {
var e = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), o = e ? e.designResolution.height : 720, n = e ? e.designResolution.width : 1280;
this._createBackground(n, o);
this._createTopBar(n, o);
this._createPlayerListContainer(n, o);
},
_createBackground: function(e, o) {
var n = new cc.Node("Background");
n.setContentSize(cc.size(e, o));
n.setPosition(0, 0);
n.zIndex = -100;
var t = n.addComponent(cc.Sprite);
t.type = cc.Sprite.Type.SIMPLE;
t.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("join_bk", cc.SpriteFrame, function(a, i) {
if (a) {
console.warn("🏟️ [ArenaMatchWaiting] 无法加载背景图 join_bk.png，使用纯色背景");
var r = n.addComponent(cc.Graphics);
r.fillColor = cc.color(25, 30, 50, 255);
r.rect(-e / 2, -o / 2, e, o);
r.fill();
} else t && t.node && t.node.isValid && (t.spriteFrame = i);
});
n.parent = this.node;
this._bgNode = n;
},
_createTopBar: function(e, o) {
var n = new cc.Node("TopBar");
n.setContentSize(cc.size(e - 100, 100));
n.setPosition(0, o / 2 - 80);
var t = new cc.Node("Bg");
t.setContentSize(cc.size(e - 100, 100));
var a = t.addComponent(cc.Graphics);
a.fillColor = cc.color(0, 0, 0, 150);
a.roundRect(-(e - 100) / 2, -50, e - 100, 100, 10);
a.fill();
t.parent = n;
var i = new cc.Node("PeriodNo");
i.setPosition(-e / 2 + 150, 25);
var r = i.addComponent(cc.Label);
r.string = "期号: --";
r.fontSize = 22;
r.lineHeight = 28;
i.color = cc.color(255, 215, 0);
var c = i.addComponent(cc.LabelOutline);
c.color = cc.color(0, 0, 0);
c.width = 2;
i.parent = n;
this._periodNoLabel = r;
var l = new cc.Node("RoomName");
l.setPosition(0, 25);
var s = l.addComponent(cc.Label);
s.string = "竞技场";
s.fontSize = 28;
s.lineHeight = 36;
l.color = cc.color(255, 215, 0);
var d = l.addComponent(cc.LabelOutline);
d.color = cc.color(0, 0, 0);
d.width = 2;
l.parent = n;
this._roomNameLabel = s;
var h = new cc.Node("Countdown");
h.setPosition(e / 2 - 150, 25);
var u = h.addComponent(cc.Label);
u.string = "60秒";
u.fontSize = 24;
u.lineHeight = 32;
h.color = cc.color(100, 255, 100);
var p = h.addComponent(cc.LabelOutline);
p.color = cc.color(0, 0, 0);
p.width = 2;
h.parent = n;
this._countdownLabel = u;
var g = new cc.Node("PlayerCount");
g.setPosition(0, -15);
var _ = g.addComponent(cc.Label);
_.string = "已进入: 0 / 0";
_.fontSize = 20;
_.lineHeight = 28;
g.color = cc.color(200, 200, 220);
g.parent = n;
this._playerCountLabel = _;
var f = new cc.Node("Message");
f.setPosition(0, -45);
var m = f.addComponent(cc.Label);
m.string = "等待其他玩家进入...";
m.fontSize = 16;
m.lineHeight = 24;
f.color = cc.color(255, 200, 100);
f.parent = n;
this._messageLabel = m;
n.parent = this.node;
this._topBar = n;
},
_createPlayerListContainer: function() {
var e = new cc.Node("PlayerArea");
e.setContentSize(cc.size(1160, 440));
e.setPosition(0, -25);
var o = new cc.Node("Bg");
o.setContentSize(cc.size(1160, 440));
var n = o.addComponent(cc.Graphics);
n.fillColor = cc.color(0, 0, 0, 80);
n.roundRect(-580, -220, 1160, 440, 10);
n.fill();
o.parent = e;
var t = new cc.Node("Content");
t.setContentSize(cc.size(1150, 420));
t.anchorX = 0;
t.anchorY = 1;
t.setPosition(-575, 210);
t.parent = e;
e.parent = this.node;
this._playerListContent = t;
this._playerListContainer = e;
},
_initFromGlobalData: function() {
var e = window.myglobal;
if (e && e.arenaWaitingStatusCache) {
var o = e.arenaWaitingStatusCache;
console.log("🏟️ [ArenaMatchWaiting] 发现缓存的等待状态数据，玩家数量:", o.players ? o.players.length : 0);
var n = e.arenaWaitingData ? e.arenaWaitingData.period_no : "";
if (!n || o.period_no === n) {
this._periodNo = o.period_no || "";
this._roomId = o.room_id || 0;
this._roomName = o.room_name || "";
this._countdown = o.countdown || 60;
this._totalPlayers = o.total_players || 0;
this._enteredPlayers = o.entered_players || 1;
this._players = o.players || [];
this._startTime = o.start_time || Date.now();
this._updateUI();
console.log("🏟️ [ArenaMatchWaiting] 从缓存数据初始化完成，显示玩家:", this._players.length);
e.arenaWaitingStatusCache = null;
return;
}
}
if (e && e.arenaWaitingData) {
var t = e.arenaWaitingData;
this._periodNo = t.period_no || "";
this._roomId = t.room_id || 0;
this._roomName = t.room_name || "";
this._countdown = t.countdown || 60;
this._totalPlayers = t.total_players || 0;
this._enteredPlayers = t.entered_players || 1;
this._players = t.players || [];
this._startTime = t.start_time || Date.now();
this._updateUI();
console.log("🏟️ [ArenaMatchWaiting] 从全局变量初始化数据完成");
if (0 === this._players.length) {
console.log("🏟️ [ArenaMatchWaiting] 玩家列表为空，请求服务端推送状态");
this._requestWaitingStatus();
}
}
},
_requestWaitingStatus: function() {
var e = window.myglobal, o = e && e.socket;
if (o && o.sendArenaEnter) {
o.sendArenaEnter({
period_no: this._periodNo,
room_id: this._roomId
});
console.log("🏟️ [ArenaMatchWaiting] 已请求服务端推送等待状态");
}
},
_registerRoomJoinedHandler: function() {
var e = this, o = window.myglobal, n = o && o.socket;
n && n.onRoomJoined && n.onRoomJoined(function(n) {
console.log("🏟️ [ArenaMatchWaiting] 收到 room_joined，准备进入游戏场景:", JSON.stringify(n));
if (o && o._isEnteringGameScene) console.log("🏟️ [ArenaMatchWaiting] 已在加载游戏场景中，跳过重复请求"); else if (2 === (n.room_category || 1)) {
o && (o._isEnteringGameScene = !0);
e._stopLoadingAnimation();
var t = n.players || [], a = {
roomid: n.room_code || "ARENA",
room_code: n.room_code || "ARENA",
seatindex: n.player ? n.player.seat + 1 : 1,
playerdata: t.map(function(e, o) {
return {
accountid: e.id,
nick_name: e.name,
avatarUrl: e.avatar || "avatar_1",
gold_count: e.gold_count || 0,
goldcount: e.gold_count || 0,
seatindex: (void 0 !== e.seat ? e.seat : o) + 1,
isready: e.ready || !1,
arena_gold: e.arena_gold || 0,
match_coin: e.match_coin || 0,
period_no: e.period_no || ""
};
}),
housemanageid: n.creator_id || "",
creator_id: n.creator_id || "",
room_category: 2,
period_no: e._periodNo
};
if (o) {
o.roomData = a;
o.arenaMatchData = {
periodNo: e._periodNo,
roomId: e._roomId,
roomName: e._roomName,
totalPlayers: e._totalPlayers,
totalTables: e._totalTables || 0,
players: e._players,
matchRounds: n.match_rounds || 0,
currentRound: n.current_round || 1
};
console.log("🏟️ [ArenaMatchWaiting] 预加载数据已保存:");
console.log("  - myglobal.roomData.playerdata:", a.playerdata.length, "人");
console.log("  - myglobal.arenaMatchData.periodNo:", e._periodNo);
console.log("  - 头像缓存数量:", o._avatarCache ? Object.keys(o._avatarCache).length : 0);
}
console.log("🏟️ [ArenaMatchWaiting] 进入游戏场景...");
cc.director.loadScene("gameScene", function(e) {
if (e) {
console.error("🏟️ [ArenaMatchWaiting] 加载游戏场景失败:", e);
o && (o._isEnteringGameScene = !1);
} else setTimeout(function() {
o && (o._isEnteringGameScene = !1);
}, 2e3);
});
} else console.log("🏟️ [ArenaMatchWaiting] 不是竞技场房间，忽略");
});
},
onDestroy: function() {
this._stopLoadingAnimation();
this._unregisterEvents();
console.log("🏟️ [ArenaMatchWaiting] 场景销毁，已停止加载动画");
},
_registerEvents: function() {
var e = this, o = window.myglobal, n = o && o.eventlister;
console.log("🏟️ [ArenaMatchWaiting] 注册事件监听, evt:", n ? "存在" : "不存在");
if (n) {
this._waitingStatusHandler = function(o) {
console.log("🏟️ [ArenaMatchWaiting] ✅ 收到等待状态:", JSON.stringify(o));
e._onWaitingStatus(o);
};
n.on("arena_waiting_status_notify", this._waitingStatusHandler);
this._waitingTickHandler = function(o) {
console.log("🏟️ [ArenaMatchWaiting] 倒计时更新:", o.countdown);
e._onWaitingTick(o);
};
n.on("arena_waiting_tick_notify", this._waitingTickHandler);
this._playerJoinedHandler = function(o) {
console.log("🏟️ [ArenaMatchWaiting] 玩家加入:", JSON.stringify(o));
e._onPlayerJoined(o);
};
n.on("arena_player_joined_notify", this._playerJoinedHandler);
this._assignStartHandler = function(o) {
console.log("🏟️ [ArenaMatchWaiting] 分配阶段开始:", JSON.stringify(o));
e._onAssignStart(o);
};
n.on("arena_assign_start_notify", this._assignStartHandler);
console.log("🏟️ [ArenaMatchWaiting] ✅ 事件监听注册完成");
} else console.warn("🏟️ [ArenaMatchWaiting] eventlister 不存在，无法注册事件");
},
_unregisterEvents: function() {
var e = window.myglobal, o = e && e.eventlister;
if (o) {
this._waitingStatusHandler && o.off("arena_waiting_status_notify", this._waitingStatusHandler);
this._waitingTickHandler && o.off("arena_waiting_tick_notify", this._waitingTickHandler);
this._playerJoinedHandler && o.off("arena_player_joined_notify", this._playerJoinedHandler);
this._assignStartHandler && o.off("arena_assign_start_notify", this._assignStartHandler);
console.log("🏟️ [ArenaMatchWaiting] 事件监听已取消");
}
},
setData: function(e) {
this._periodNo = e.period_no || "";
this._roomId = e.room_id || 0;
this._roomName = e.room_name || "";
this._countdown = e.countdown || 60;
this._totalPlayers = e.total_players || 0;
this._enteredPlayers = e.entered_players || 0;
this._players = e.players || [];
this._startTime = e.start_time || Date.now();
this._updateUI();
},
_onWaitingStatus: function(e) {
if (!this._periodNo || e.period_no === this._periodNo) {
this._periodNo = e.period_no;
this._roomId = e.room_id;
this._roomName = e.room_name;
this._countdown = e.countdown;
this._totalPlayers = e.total_players;
this._enteredPlayers = e.entered_players;
this._players = e.players;
this._startTime = e.start_time;
this._updateUI();
}
},
_onWaitingTick: function(e) {
if (!this._periodNo || e.period_no === this._periodNo) {
this._countdown = e.countdown;
this._enteredPlayers = e.entered_players;
this._updateCountdownUI();
this._updatePlayerCountUI();
}
},
_onPlayerJoined: function(e) {
if (!this._periodNo || e.period_no === this._periodNo) {
this._players = e.players || [];
this._enteredPlayers = e.entered_players;
this._totalPlayers = e.total_players;
var o = e.player;
o && o.player_name && this._showJoinMessage(o.player_name + " 进入了比赛");
this._updatePlayerListUI();
this._updatePlayerCountUI();
}
},
_onAssignStart: function(e) {
if (!this._periodNo || e.period_no === this._periodNo) {
console.log("🏟️ [ArenaMatchWaiting] 分配阶段开始:", JSON.stringify(e));
this._countdown = e.countdown;
this._totalPlayers = e.total_players;
this._enteredPlayers = e.total_players;
this._totalTables = e.total_tables || 0;
this._showAssigningLoadingUI(e);
this._preloadAllPlayerAvatars();
this._updateUI();
}
},
_showAssigningLoadingUI: function(e) {
if (this._messageLabel) {
this._messageLabel.string = e.message || "系统分配中...";
this._messageLabel.node.color = cc.color(255, 220, 100);
}
var o = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), n = o ? o.designResolution.height : 720, t = o ? o.designResolution.width : 1280, a = new cc.Node("AssigningLoadingOverlay");
a.setContentSize(cc.size(t, n));
a.setPosition(0, 0);
a.zIndex = 1e3;
var i = new cc.Node("Bg");
i.setContentSize(cc.size(t, n));
var r = i.addComponent(cc.Graphics);
r.fillColor = cc.color(0, 0, 0, 150);
r.rect(-t / 2, -n / 2, t, n);
r.fill();
i.parent = a;
var c = new cc.Node("LoadingContainer");
c.setPosition(0, 50);
c.parent = a;
var l = new cc.Node("LoadingIcon");
l.setContentSize(cc.size(60, 60));
var s = l.addComponent(cc.Graphics);
s.strokeColor = cc.color(255, 215, 0);
s.lineWidth = 4;
s.arc(0, 0, 25, 0, 1.5 * Math.PI, !1);
s.stroke();
l.parent = c;
this._loadingIconNode = l;
var d = new cc.Node("LoadingLabel");
d.setPosition(0, -30);
var h = d.addComponent(cc.Label);
h.string = "系统分配中...";
h.fontSize = 28;
h.lineHeight = 36;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
d.color = cc.color(255, 220, 100);
var u = d.addComponent(cc.LabelOutline);
u.color = cc.color(0, 0, 0);
u.width = 2;
d.parent = c;
this._assigningLoadingLabel = h;
a.parent = this.node;
this._assigningLoadingOverlay = a;
this._startLoadingAnimation();
console.log("🏟️ [ArenaMatchWaiting] 显示'系统分配中'加载动画");
},
_startLoadingAnimation: function() {
var e = this;
this._loadingAnimScheduled = !0;
this.schedule(function() {
e._loadingIconNode && e._loadingIconNode.isValid && (e._loadingIconNode.angle += 5);
}, .016);
},
_stopLoadingAnimation: function() {
if (this._loadingAnimScheduled) {
this.unschedule(this._startLoadingAnimation);
this._loadingAnimScheduled = !1;
}
if (this._assigningLoadingOverlay && this._assigningLoadingOverlay.isValid) {
this._assigningLoadingOverlay.destroy();
this._assigningLoadingOverlay = null;
}
this._loadingIconNode = null;
},
_preloadAllPlayerAvatars: function() {
if (this._players && 0 !== this._players.length) {
for (var e = [], o = 0; o < this._players.length; o++) {
var n = this._players[o], t = n.avatar || n.avatarUrl || "avatar_1";
t && -1 === e.indexOf(t) && e.push(t);
}
console.log("🏟️ [ArenaMatchWaiting] 预加载玩家头像数量:", e.length);
var a = window.myglobal;
a && !a._avatarCache && (a._avatarCache = {});
for (var i = 0, r = e.length, c = function() {
++i >= r && console.log("🏟️ [ArenaMatchWaiting] 所有玩家头像预加载完成");
}, l = 0; l < e.length; l++) this._preloadSingleAvatar(e[l], c);
} else console.log("🏟️ [ArenaMatchWaiting] 没有玩家头像需要预加载");
},
_preloadSingleAvatar: function(e, o) {
var n = window.myglobal;
n && n._avatarCache && n._avatarCache[e] ? o && o() : 0 === e.indexOf("http://") || 0 === e.indexOf("https://") ? cc.assetManager.loadRemote(e, {
ext: ".png"
}, function(t, a) {
if (!t && a && n && n._avatarCache) try {
n._avatarCache[e] = new cc.SpriteFrame(a);
console.log("🏟️ [ArenaMatchWaiting] 远程头像预加载成功:", e);
} catch (e) {
console.warn("🏟️ [ArenaMatchWaiting] 缓存头像失败:", e);
}
o && o();
}) : cc.resources.load("UI/headimage/" + e, cc.SpriteFrame, function(t, a) {
if (!t && a && n && n._avatarCache) {
n._avatarCache[e] = a;
console.log("🏟️ [ArenaMatchWaiting] 本地头像预加载成功:", e);
}
o && o();
});
},
_updateUI: function() {
this._periodNoLabel && (this._periodNoLabel.string = "期号: " + this._periodNo);
this._roomNameLabel && (this._roomNameLabel.string = this._roomName || "竞技场");
this._updateCountdownUI();
this._updatePlayerCountUI();
this._updatePlayerListUI();
},
_updateCountdownUI: function() {
if (this._countdownLabel) {
this._countdownLabel.string = this._countdown + "秒";
this._countdown <= 10 && this._countdown > 0 ? this._countdownLabel.node.color = cc.color(255, 100, 100) : this._countdownLabel.node.color = cc.color(100, 255, 100);
}
},
_updatePlayerCountUI: function() {
this._playerCountLabel && (this._playerCountLabel.string = "已进入: " + this._enteredPlayers + " / " + this._totalPlayers);
},
_updatePlayerListUI: function() {
if (this._playerListContent) {
this._playerListContent.removeAllChildren();
var e = this._players || [];
console.log("🏟️ [ArenaMatchWaiting] 更新玩家列表，玩家数量:", e.length);
if (0 !== e.length) {
var o = e.slice().sort(function(e, o) {
var n = e.entered_at && e.entered_at > 0, t = o.entered_at && o.entered_at > 0;
return n && !t ? -1 : !n && t ? 1 : (e.entered_at || 0) - (o.entered_at || 0);
});
console.log("🏟️ [ArenaMatchWaiting] 排序后玩家:", o.map(function(e) {
return e.player_name + (e.entered_at > 0 ? "(已进入)" : "(等待中)");
}).join(", "));
for (var n = 0; n < o.length; n++) {
var t = o[n], a = t.entered_at && t.entered_at > 0 ? "(已进入)" : "(等待中)";
console.log("🏟️ [ArenaMatchWaiting] 创建玩家卡片:", n, t.player_name, a);
var i = this._createPlayerItem(t, n), r = 60 + n % 10 * 110, c = -10 - 150 * Math.floor(n / 10) - 70;
i.setPosition(r, c);
i.parent = this._playerListContent;
}
} else console.log("🏟️ [ArenaMatchWaiting] 没有玩家数据，跳过渲染");
}
},
_createPlayerItem: function(e, o) {
var n = new cc.Node("PlayerCard_" + o);
n.setContentSize(cc.size(100, 140));
var t = new cc.Node("Bg");
t.setContentSize(cc.size(95, 135));
var a = t.addComponent(cc.Graphics);
a.fillColor = cc.color(40, 60, 80, 230);
a.roundRect(-47.5, -67.5, 95, 135, 8);
a.fill();
t.parent = n;
var i = new cc.Node("Rank");
i.setPosition(-30, 55);
var r = i.addComponent(cc.Label);
r.string = "#" + (e.rank || o + 1);
r.fontSize = 12;
r.lineHeight = 14;
i.color = cc.color(255, 215, 0);
var c = i.addComponent(cc.LabelOutline);
c.color = cc.color(0, 0, 0);
c.width = 1;
i.parent = n;
var l = new cc.Node("AvatarMask");
l.setPosition(0, 30);
l.setContentSize(cc.size(50, 50));
var s = l.addComponent(cc.Mask);
s.type = cc.Mask.Type.ELLIPSE;
s.segements = 64;
var d = new cc.Node("AvatarBg"), h = d.addComponent(cc.Graphics);
h.fillColor = cc.color(80, 80, 100, 255);
h.circle(0, 0, 28);
h.fill();
d.parent = l;
var u = new cc.Node("Avatar");
u.setContentSize(cc.size(50, 50));
var p = u.addComponent(cc.Sprite);
p.type = cc.Sprite.Type.SIMPLE;
p.sizeMode = cc.Sprite.SizeMode.CUSTOM;
this._loadPlayerAvatar(e.avatar, p);
u.parent = l;
l.parent = n;
var g = new cc.Node("Name");
g.setPosition(0, -10);
var _ = g.addComponent(cc.Label);
_.string = e.player_name || e.name || "玩家" + (o + 1);
_.fontSize = 12;
_.lineHeight = 16;
g.setContentSize(cc.size(90, 16));
_.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
g.color = cc.color(150, 220, 255);
g.parent = n;
var f = new cc.Node("Coin");
f.setPosition(0, -28);
var m = f.addComponent(cc.Label), C = e.match_coin || 0;
m.string = C >= 1e4 ? (C / 1e4).toFixed(1) + "万" : C.toString();
m.fontSize = 11;
m.lineHeight = 14;
f.color = cc.color(255, 215, 0);
f.parent = n;
var v = new cc.Node("Status");
v.setPosition(0, -48);
var w = v.addComponent(cc.Label);
w.fontSize = 10;
w.lineHeight = 12;
w.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
if (e.entered_at && e.entered_at > 0) {
w.string = "已进入";
v.color = cc.color(100, 255, 150);
} else {
w.string = "等待中";
v.color = cc.color(255, 200, 100);
}
v.parent = n;
return n;
},
_loadPlayerAvatar: function(e, o) {
if (o) if (e) if (0 !== e.indexOf("http://") && 0 !== e.indexOf("https://")) {
var n = window.myglobal, t = n && n.cdnUrl ? n.cdnUrl : "https://apis.hongxiu88.com";
if (0 !== e.indexOf("/uploads/")) cc.resources.load("UI/headimage/" + e, cc.SpriteFrame, function(e, n) {
!e && n && o && o.node && o.node.isValid && (o.spriteFrame = n);
}); else {
var a = t + e;
console.log("🏟️ [ArenaMatchWaiting] 加载头像(相对路径):", a);
cc.assetManager.loadRemote(a, {
ext: ".png"
}, function(e, n) {
if (!e && n && o && o.node && o.node.isValid) try {
var t = new cc.SpriteFrame(n);
o.spriteFrame = t;
} catch (e) {
console.warn("🏟️ [ArenaMatchWaiting] 头像加载失败:", a);
} else if (e) {
console.warn("🏟️ [ArenaMatchWaiting] 头像加载错误:", e);
cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(e, n) {
!e && n && o && o.node && o.node.isValid && (o.spriteFrame = n);
});
}
});
}
} else cc.assetManager.loadRemote(e, {
ext: ".png"
}, function(e, n) {
if (!e && n && o && o.node && o.node.isValid) try {
var t = new cc.SpriteFrame(n);
o.spriteFrame = t;
} catch (e) {}
}); else cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(e, n) {
!e && n && o && o.node && o.node.isValid && (o.spriteFrame = n);
});
},
_showJoinMessage: function(e) {
var o = new cc.Node("JoinTip");
o.setPosition(0, 100);
var n = o.addComponent(cc.Label);
n.string = e;
n.fontSize = 24;
n.lineHeight = 32;
n.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.color = cc.color(100, 255, 100);
var t = o.addComponent(cc.LabelOutline);
t.color = cc.color(0, 0, 0);
t.width = 2;
o.parent = this.node;
o.runAction(cc.sequence(cc.moveBy(1.5, cc.v2(0, 50)), cc.fadeOut(.5), cc.removeSelf()));
}
});
cc._RF.pop();
}, {} ],
arenaData: [ function(e, o) {
"use strict";
cc._RF.push(o, "813dcvepIxFjad6cNQB7j3m", "arenaData");
window.arenaData = function() {
var e = {
_signedUpArenas: {},
_arenaDetails: {},
_countdownTimers: {},
_statusListeners: [],
getArenaList: function(o) {
var n = window.defines ? window.defines.apiUrl : "", t = window.defines ? window.defines.cryptoKey : "";
n && window.HttpAPI ? HttpAPI.get(n + "/api/v1/arena/list", t, function(n, t) {
if (n) o && o(n, null); else {
var a = null;
t && 0 === t.code && t.data ? a = t.data : t && Array.isArray(t) && (a = t);
if (a) {
for (var i = 0; i < a.length; i++) {
var r = a[i];
e._arenaDetails[r.id] = r;
}
o && o(null, a);
} else o && o("获取竞技场列表失败", null);
}
}) : o && o("API未配置", null);
},
signup: function(o, n) {
var t = window.myglobal && window.myglobal.socket ? window.myglobal.socket : null;
if (t) if (t.isConnected && "function" == typeof t.isConnected) {
var a = function(e) {
if (t.isAuthenticated && t.isAuthenticated()) {
console.log("🏟️ [ArenaData] WebSocket 已认证，可以发送请求");
e();
} else {
console.log("🏟️ [ArenaData] WebSocket 未认证，等待认证完成...");
var o = 0;
setTimeout(function a() {
o++;
if (t.isAuthenticated && t.isAuthenticated()) {
console.log("🏟️ [ArenaData] WebSocket 认证完成，可以发送请求");
e();
} else if (o < 20) {
console.log("🏟️ [ArenaData] 等待认证... 重试次数:", o);
setTimeout(a, 500);
} else {
console.warn("🏟️ [ArenaData] 等待 WebSocket 认证超时");
n && n("认证超时，请刷新页面重试", null);
}
}, 500);
}
};
if (t.isConnected() && t.isWebSocketOpen()) a(function() {
e._doSignup(t, o, n);
}); else {
console.log("🏟️ [ArenaData] WebSocket 未连接，等待连接完成后重试...");
var i = t.getConnectionState ? t.getConnectionState() : "unknown";
console.log("🏟️ [ArenaData] 当前连接状态:", i);
if ("connecting" === i) {
var r = 0, c = 10, l = 500, s = function() {
r++;
if (t.isConnected() && t.isWebSocketOpen()) {
console.log("🏟️ [ArenaData] WebSocket 已连接，等待认证完成");
a(function() {
e._doSignup(t, o, n);
});
} else if (r < c) {
console.log("🏟️ [ArenaData] 等待连接... 重试次数:", r);
setTimeout(s, l);
} else {
console.warn("🏟️ [ArenaData] 等待 WebSocket 连接超时");
n && n("连接超时，请稍后重试", null);
}
};
setTimeout(s, l);
return;
}
console.log("🏟️ [ArenaData] WebSocket 未连接，尝试初始化连接...");
t.initSocket && t.initSocket();
r = 0, c = 10, l = 500, s = function() {
r++;
if (t.isConnected() && t.isWebSocketOpen()) {
console.log("🏟️ [ArenaData] WebSocket 已连接，等待认证完成");
a(function() {
e._doSignup(t, o, n);
});
} else r < c ? setTimeout(s, l) : n && n("连接超时，请稍后重试", null);
};
setTimeout(s, l);
}
} else {
console.error("🏟️ [ArenaData] socketCtr.isConnected 不是函数");
n && n("WebSocket连接状态异常，请刷新页面重试", null);
} else n && n("WebSocket未初始化，请刷新页面重试", null);
},
_doSignup: function(o, n, t) {
console.log("🏟️ [ArenaData] 通过 WebSocket 发送报名请求, roomId:", n);
var a = !1, i = null, r = function() {
i && clearTimeout(i);
o.offArenaSignupSuccess(c);
o.offArenaSignupFailed(l);
}, c = function(o) {
if (!a && o.room_id === n) {
a = !0;
r();
var i = e._arenaDetails[n] || {};
e._signedUpArenas[n] = {
signupTime: o.signup_time || Date.now(),
status: "signed_up",
arenaConfig: i,
periodNo: o.period_no,
signupFee: o.signup_fee
};
e.saveToLocal();
if (window.myglobal && window.myglobal.playerData && void 0 !== o.balance_after) {
window.myglobal.playerData.arena_coin = o.balance_after;
window.myglobal.playerData.saveToLocal();
window.myglobal.eventlister && window.myglobal.eventlister.fire("arena_coin_updated", {
arena_coin: o.balance_after
});
}
e._notifyStatusChange(n, "signed_up");
t && t(null, {
success: !0,
message: "报名成功",
period_no: o.period_no,
signup_fee: o.signup_fee,
balance_after: o.balance_after
});
}
}, l = function(e) {
if (!a) {
a = !0;
r();
t && t(e.message || "报名失败", null);
}
};
o.onArenaSignupSuccess(c);
o.onArenaSignupFailed(l);
i = setTimeout(function() {
if (!a) {
a = !0;
t && t("报名请求超时，请重试", null);
}
}, 1e4);
o.sendArenaSignup({
room_id: n
});
},
cancelSignup: function(o, n) {
var t = window.myglobal && window.myglobal.socket ? window.myglobal.socket : null;
if (t) if (t.isConnected && "function" == typeof t.isConnected) if (t.isConnected() && t.isWebSocketOpen()) e._doCancelSignup(t, o, n); else {
console.log("🏟️ [ArenaData] WebSocket 未连接，等待连接完成后重试...");
if ("connecting" === (t.getConnectionState ? t.getConnectionState() : "unknown")) {
var a = 0, i = 10, r = 500, c = function() {
a++;
t.isConnected() && t.isWebSocketOpen() ? e._doCancelSignup(t, o, n) : a < i ? setTimeout(c, r) : n && n("连接超时，请稍后重试", null);
};
setTimeout(c, r);
return;
}
t.initSocket && t.initSocket();
a = 0, i = 10, r = 500, c = function() {
a++;
t.isConnected() && t.isWebSocketOpen() ? e._doCancelSignup(t, o, n) : a < i ? setTimeout(c, r) : n && n("连接超时，请稍后重试", null);
};
setTimeout(c, r);
} else {
console.error("🏟️ [ArenaData] socketCtr.isConnected 不是函数");
n && n("WebSocket连接状态异常，请刷新页面重试", null);
} else n && n("WebSocket未初始化，请刷新页面重试", null);
},
_doCancelSignup: function(o, n, t) {
console.log("🏟️ [ArenaData] 通过 WebSocket 发送取消报名请求, roomId:", n);
var a = !1, i = null, r = function() {
i && clearTimeout(i);
o.offArenaCancelSuccess(c);
o.offArenaCancelFailed(l);
}, c = function(o) {
if (!a && o.room_id === n) {
a = !0;
r();
delete e._signedUpArenas[n];
e.saveToLocal();
if (window.myglobal && window.myglobal.playerData && void 0 !== o.balance_after) {
window.myglobal.playerData.arena_coin = o.balance_after;
window.myglobal.playerData.saveToLocal();
window.myglobal.eventlister && window.myglobal.eventlister.fire("arena_coin_updated", {
arena_coin: o.balance_after
});
}
if (e._countdownTimers[n]) {
clearInterval(e._countdownTimers[n]);
delete e._countdownTimers[n];
}
e._notifyStatusChange(n, "cancelled");
t && t(null, {
success: !0,
message: "取消报名成功",
refund_amount: o.refund_amount,
balance_after: o.balance_after
});
}
}, l = function(e) {
if (!a) {
a = !0;
r();
t && t(e.message || "取消报名失败", null);
}
};
o.onArenaCancelSuccess(c);
o.onArenaCancelFailed(l);
i = setTimeout(function() {
if (!a) {
a = !0;
t && t("取消报名请求超时，请重试", null);
}
}, 1e4);
o.sendArenaCancelSignup({
room_id: n
});
},
getSignupStatus: function(o) {
return e._signedUpArenas[o] || null;
},
isSignedUp: function(o) {
return !!e._signedUpArenas[o];
},
getCountdown: function(o) {
var n = e._signedUpArenas[o];
if (!n || !n.countdownEnd) return -1;
var t = Date.now(), a = Math.floor((n.countdownEnd - t) / 1e3);
return a > 0 ? a : 0;
},
formatCountdown: function(e) {
if (e < 0) return "";
if (0 === e) return "即将开赛";
var o = Math.floor(e / 3600), n = Math.floor(e % 3600 / 60), t = e % 60;
return o > 0 ? o + ":" + (n < 10 ? "0" : "") + n + ":" + (t < 10 ? "0" : "") + t : (n < 10 ? "0" : "") + n + ":" + (t < 10 ? "0" : "") + t;
},
getArenaConfig: function(o) {
return e._arenaDetails[o] || null;
},
getSignupFee: function(e) {
return e.signup_fee || e.signupFee || 0;
},
getChampionReward: function(e) {
return e.champion_reward || e.championReward || {
coins: 0,
items: []
};
},
watchAdForReward: function(e, o) {
var n = window.defines ? window.defines.apiUrl : "", t = window.defines ? window.defines.cryptoKey : "", a = window.myglobal && window.myglobal.playerData ? window.myglobal.playerData.token : "";
if (n && window.HttpAPI) {
var i = {
token: a,
type: e,
ad_type: "reward_video"
};
HttpAPI.post(n + "/api/ad/reward", i, t, function(e, n) {
if (e) o && o(e, null); else if (n && (0 === n.code || n.success)) {
if (window.myglobal && window.myglobal.playerData && n.data) {
n.data.gold && (window.myglobal.playerData.gobal_count = n.data.gold);
n.data.arena_coin && (window.myglobal.playerData.arena_coin = n.data.arena_coin);
window.myglobal.playerData.saveToLocal();
}
o && o(null, {
success: !0,
reward: n.data || {}
});
} else o && o(n ? n.message : "获取奖励失败", null);
});
} else o && o("API未配置", null);
},
refreshBalance: function(e) {
var o = window.defines ? window.defines.apiUrl : "", n = window.defines ? window.defines.cryptoKey : "", t = window.myglobal && window.myglobal.playerData ? window.myglobal.playerData.token : "";
o && window.HttpAPI ? HttpAPI.get(o + "/api/v1/player/balance?token=" + encodeURIComponent(t), n, function(o, n) {
if (o) e && e(o, null); else if (n && (0 === n.code || n.data)) {
var t = n.data || n;
if (window.myglobal && window.myglobal.playerData) {
void 0 !== t.gold && (window.myglobal.playerData.gobal_count = t.gold);
void 0 !== t.arena_coin && (window.myglobal.playerData.arena_coin = t.arena_coin);
window.myglobal.playerData.saveToLocal();
}
e && e(null, t);
} else e && e(n ? n.message : "获取余额失败", null);
}) : e && e("API未配置", null);
},
addStatusListener: function(o) {
e._statusListeners.push(o);
},
removeStatusListener: function(o) {
var n = e._statusListeners.indexOf(o);
n > -1 && e._statusListeners.splice(n, 1);
},
_notifyStatusChange: function(o, n) {
for (var t = 0; t < e._statusListeners.length; t++) try {
e._statusListeners[t](o, n);
} catch (e) {
console.error("状态监听器执行错误:", e);
}
},
startCountdown: function(o, n) {
e._countdownTimers[o] && clearInterval(e._countdownTimers[o]);
e._countdownTimers[o] = setInterval(function() {
var t = e.getCountdown(o);
n && n(t);
if (t <= 0) {
clearInterval(e._countdownTimers[o]);
delete e._countdownTimers[o];
e._notifyStatusChange(o, "starting");
}
}, 1e3);
},
stopCountdown: function(o) {
if (e._countdownTimers[o]) {
clearInterval(e._countdownTimers[o]);
delete e._countdownTimers[o];
}
},
clearAllCountdowns: function() {
for (var o in e._countdownTimers) clearInterval(e._countdownTimers[o]);
e._countdownTimers = {};
},
saveToLocal: function() {
try {
var o = {
signedUpArenas: e._signedUpArenas,
savedAt: Date.now()
};
localStorage.setItem("arena_data", JSON.stringify(o));
} catch (e) {
console.error("保存竞技场数据失败:", e);
}
},
loadFromLocal: function() {
try {
var o = localStorage.getItem("arena_data");
if (o) {
var n = JSON.parse(o);
Date.now() - (n.savedAt || 0) < 864e5 && (e._signedUpArenas = n.signedUpArenas || {});
}
} catch (e) {
console.error("加载竞技场数据失败:", e);
}
},
fetchSignupStatusFromServer: function(o) {
var n = window.defines ? window.defines.apiUrl : "", t = window.defines ? window.defines.cryptoKey : "", a = window.myglobal && window.myglobal.playerData ? window.myglobal.playerData.token : "";
n && window.HttpAPI ? HttpAPI.get(n + "/api/v1/arena/signup-status?token=" + encodeURIComponent(a), t, function(n, t) {
if (n) {
console.error("🏟️ [arenaData] 获取报名状态失败:", n);
o && o(n, null);
} else {
var a = [];
if (t && (0 === t.code || t.data)) {
a = (t.data || t).signed_up_rooms || [];
e._signedUpArenas = {};
for (var i = 0; i < a.length; i++) {
var r = a[i];
e._signedUpArenas[r.room_id] = {
signupTime: r.signup_time,
status: "signed_up",
periodNo: r.period_no,
signupFee: r.signup_fee
};
}
e.saveToLocal();
}
o && o(null, a);
}
}) : o && o("API未配置", null);
},
clearAllSignupStatus: function() {
e._signedUpArenas = {};
e.saveToLocal();
}
};
e.loadFromLocal();
return e;
}();
cc._RF.pop();
}, {} ],
card: [ function(e, o) {
"use strict";
cc._RF.push(o, "2afe8rz92BOl7CbQfKSCoLh", "card");
var n = window.RoomState || {};
cc.Class({
extends: cc.Component,
properties: {
cards_sprite_atlas: cc.SpriteAtlas
},
onLoad: function() {
this.flag = !1;
this.offset_y = 20;
this._touchEventAdded = !1;
this.node.on("reset_card_flag", function() {
if (1 == this.flag) {
this.flag = !1;
this.node.y -= this.offset_y;
}
}.bind(this));
},
start: function() {},
init_data: function() {},
setTouchEvent: function() {
var e = window.myglobal;
if (e && e.playerData && !this._touchEventAdded && this.accountid == e.playerData.accountID) {
this._touchEventAdded = !0;
this.node.on(cc.Node.EventType.TOUCH_START, function() {
var e = this._findGameSceneNode();
if (e) {
var o = e.getComponent("gameScene");
if (o) {
if (o.roomstate == n.ROOM_PLAYING) if (0 == this.flag) {
this.flag = !0;
this.node.y += this.offset_y;
e.emit("choose_card_event", {
cardid: this.card_id,
card_data: this.card_data
});
} else {
this.flag = !1;
this.node.y -= this.offset_y;
e.emit("unchoose_card_event", this.card_id);
}
} else console.warn("🃏 [card] 未找到 gameScene 组件");
} else console.warn("🃏 [card] 未找到 gameScene 节点");
}.bind(this));
}
},
_findGameSceneNode: function() {
for (var e = this.node; e; ) {
if (e.getComponent("gameScene")) return e;
e = e.parent;
}
return null;
},
showCards: function(e, o) {
if (e) {
this.card_data = e;
this.card_id = {
suit: e.suit,
rank: e.rank
};
o && (this.accountid = o);
var n = this._getSpriteKey(e);
if (n) {
this._getSuitName(e.suit), this._getRankName(e.rank);
var t = this.cards_sprite_atlas || window._cardAtlas;
if (!t) {
console.warn("🃏 [showCards] 图集未预加载，尝试同步加载...");
var a = this._loadAtlasSync();
if (!a) {
console.error("🃏 [showCards] 无法加载卡牌图集！");
return;
}
t = a;
window._cardAtlas = t;
window._cardAtlasLoaded = !0;
}
var i = t.getSpriteFrame(n);
if (i) {
this.node.getComponent(cc.Sprite).spriteFrame = i;
this.setTouchEvent();
} else console.error("🃏 [showCards] 找不到精灵帧:", n);
} else console.error("🃏 [showCards] 无法识别的牌数据:", JSON.stringify(e));
} else console.error("🃏 [showCards] 卡牌数据为空");
},
_loadAtlasSync: function() {
if (window._cardAtlasLoading) return null;
var e = cc.loader.getRes("UI/card/card", cc.SpriteAtlas);
if (e) {
console.log("🃏 [_loadAtlasSync] 从缓存获取图集成功");
return e;
}
window._cardAtlasLoading = !0;
cc.resources.load("UI/card/card", cc.SpriteAtlas, function(e, o) {
window._cardAtlasLoading = !1;
if (e) console.error("🃏 [_loadAtlasSync] 加载失败:", e); else {
window._cardAtlas = o;
window._cardAtlasLoaded = !0;
console.log("🃏 [_loadAtlasSync] 后台加载成功");
}
});
return null;
},
_getSuitName: function(e) {
return {
0: "♠",
1: "♥",
2: "♣",
3: "♦",
4: "王"
}[e] || "?";
},
_getRankName: function(e) {
return 16 === e ? "小王" : 17 === e ? "大王" : {
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
}[e] || String(e);
},
_getSpriteKey: function(e) {
var o, n, t = e.suit, a = e.rank;
if (16 === a) return "card_54";
if (17 === a) return "card_53";
if (t < 0 || t > 3 || a < 3 || a > 15) {
console.error("🃏 [_getSpriteKey] 无效的牌数据: suit=" + t + ", rank=" + a);
return null;
}
o = 14 === a ? 0 : 15 === a ? 1 : a - 1;
switch (t) {
case 3:
n = 0;
break;

case 2:
n = 13;
break;

case 1:
n = 26;
break;

case 0:
n = 39;
break;

default:
n = 0;
}
return "card_" + (n + o + 1);
}
});
cc._RF.pop();
}, {} ],
creatroom: [ function(e, o) {
"use strict";
cc._RF.push(o, "7bce5zzoXI04qsNEuZ579+P", "creatroom");
cc.Class({
extends: cc.Component,
properties: {},
onLoad: function() {},
start: function() {},
onButtonClick: function(e, o) {
var n = window.myglobal;
if (n && n.socket) switch (o) {
case "create_room_1":
this._createRoom(1);
break;

case "create_room_2":
this._createRoom(2);
break;

case "create_room_3":
this._createRoom(3);
break;

case "create_room_4":
this._createRoom(4);
break;

case "create_room_close":
this.node.destroy();
} else console.error("socket 未连接");
},
_createRoom: function(e) {
var o = window.myglobal;
o && o.socket && o.socket.createRoom(e, function(e, n) {
if (0 === e) {
o.playerData.roomid = n.room_code;
o.playerData.bottom = 100;
o.playerData.rate = 1;
o.socket.saveReconnectInfo();
Date.now();
cc.director.loadScene("gameScene", function(e) {
e ? console.error("🚀 [创建房间] 加载游戏场景失败:", e) : Date.now();
});
} else console.error("创建房间失败");
});
}
});
cc._RF.pop();
}, {} ],
gameScene: [ function(e, o) {
"use strict";
cc._RF.push(o, "e2b3cTV5veJAavN7xI0Vnkx", "gameScene");
cc.Class({
extends: cc.Component,
properties: {
di_label: cc.Label,
beishu_label: cc.Label,
roomid_label: cc.Label,
player_node_prefabs: cc.Prefab,
players_seat_pos: cc.Node
},
onLoad: function() {
var e = window.myglobal, o = window.RoomState || {
ROOM_INVALID: -1
}, n = window.isopen_sound || 1;
if (e && e.playerData && e.socket) {
this._initScene(e, o, n);
this._startOnlineMonitoring();
} else {
console.error("gameScene: myglobal、playerData 或 socket 未定义");
this._waitForInit();
}
},
_startOnlineMonitoring: function() {
var e = window.myglobal;
if (e) {
var o = this;
this._onlineStatusHandler = function(e) {
e || o._showOfflineMessage();
};
e.addOnlineStatusListener && e.addOnlineStatusListener(this._onlineStatusHandler);
e.eventlister && e.eventlister.on("force_logout", function(e) {
console.warn("🚫 游戏场景收到强制下线事件:", e);
o._handleForceLogout(e);
});
} else console.warn("gameScene: myglobal 未定义，无法启动在线监测");
},
_showOfflineMessage: function() {
console.warn("💔 游戏场景：网络连接已断开");
},
_handleForceLogout: function(e) {
var o = e.reason || "您已被强制下线";
console.warn("🚫 游戏场景强制下线:", o);
var n = window.myglobal;
n && n.stopOnlineMonitoring && n.stopOnlineMonitoring();
this.scheduleOnce(function() {
"function" == typeof alert && alert(o + "\n\n请重新登录");
cc.director.loadScene("loginScene");
}, .5);
},
_stopOnlineMonitoring: function() {
var e = window.myglobal;
if (e && e.removeOnlineStatusListener && this._onlineStatusHandler) {
e.removeOnlineStatusListener(this._onlineStatusHandler);
this._onlineStatusHandler = null;
}
},
_waitForInit: function() {
var e = this, o = 0;
setTimeout(function n() {
o++;
var t = window.myglobal;
if (t && t.playerData && t.socket) {
var a = window.RoomState || {
ROOM_INVALID: -1
}, i = window.isopen_sound || 1;
e._initScene(t, a, i);
} else o < 20 ? setTimeout(n, 100) : console.error("gameScene 初始化超时");
}, 100);
},
_initScene: function(e, o, n) {
this.playerNodeList = [];
var t = e.playerData.bottom || 1, a = e.playerData.rate || 1;
this.di_label.string = "底:" + t;
this.beishu_label.string = "倍数:" + a;
this.roomstate = o.ROOM_INVALID;
this._isWaitingForPlayers = !1;
this.node.on("pushcard_other_event", function() {
for (var e = 0; e < this.playerNodeList.length; e++) {
var o = this.playerNodeList[e];
o && o.emit("push_card_event");
}
}.bind(this));
e.socket.onRoomChangeState(function(e) {
this.roomstate = e;
e !== o.ROOM_INVALID && this._isWaitingForPlayers && this._hideWaitingUI();
}.bind(this));
this.node.on("canrob_event", function(e) {
for (var o = 0; o < this.playerNodeList.length; o++) {
var n = this.playerNodeList[o];
n && n.emit("playernode_canrob_event", e);
}
}.bind(this));
this.node.on("choose_card_event", function(e) {
var o = this.node.getChildByName("gameingUI");
null != o && o.emit("choose_card_event", e);
}.bind(this));
this.node.on("unchoose_card_event", function(e) {
var o = this.node.getChildByName("gameingUI");
null != o && o.emit("unchoose_card_event", e);
}.bind(this));
var i = e.socket.getCurrentRoomCode(), r = e.socket.isInRoom(), c = e.roomData;
r && i && !c && (c = {
roomid: i,
room_code: i,
seatindex: 1,
playerdata: [ {
accountid: e.playerData.accountid || e.playerData.playerId,
nick_name: e.playerData.nickName,
avatarUrl: "avatar_1",
gold_count: e.playerData.gobal_count || 1e3,
goldcount: e.playerData.gobal_count || 1e3,
seatindex: 1,
isready: !0
} ]
});
c ? this._processRoomData(c, e, n) : e.socket.request_enter_room({}, function(o, t) {
0 != o || this._processRoomData(t, e, n);
}.bind(this));
e.socket.onPlayerJoinRoom(function(e) {
this.addPlayerNode(e);
this._playerdataList || (this._playerdataList = []);
this._playerdataList.push(e);
this._isWaitingForPlayers && this._showWaitingUI(3 - this._playerdataList.length, this._currentRoomCode);
this.playerNodeList.length >= 3 && this._hideWaitingUI();
}.bind(this));
e.socket.onPlayerLeft(function(e) {
console.log("👋 [gameScene] 收到玩家离开通知:", JSON.stringify(e));
this._onPlayerLeft(e);
}.bind(this));
e.socket.onPlayerReady(function(e) {
for (var o = 0; o < this.playerNodeList.length; o++) {
var n = this.playerNodeList[o];
n && n.emit("player_ready_notify", e);
}
}.bind(this));
e.socket.onGameStart(function() {
for (var e = 0; e < this.playerNodeList.length; e++) {
var o = this.playerNodeList[e];
o && o.emit("gamestart_event");
}
var n = this.node.getChildByName("gamebeforeUI");
n && (n.active = !1);
}.bind(this));
e.socket.onRestartGame(function() {
console.log("🔄 [gameScene] 收到重新发牌消息，清理玩家节点的抢地主/不抢图标");
for (var e = 0; e < this.playerNodeList.length; e++) {
var o = this.playerNodeList[e];
o && o.emit("clear_rob_state_event");
}
}.bind(this));
e.socket.onRobState(function(e) {
for (var o = Object.assign({}, e, {
round: 2
}), n = 0; n < this.playerNodeList.length; n++) {
var t = this.playerNodeList[n];
t && t.emit("playernode_rob_state_event", o);
}
}.bind(this));
e.socket.onBidResult(function(e) {
for (var o = Object.assign({}, e, {
round: 1
}), n = 0; n < this.playerNodeList.length; n++) {
var t = this.playerNodeList[n];
t && t.emit("playernode_rob_state_event", o);
}
}.bind(this));
e.socket.onChangeMaster(function(o) {
e.playerData.master_accountid = o;
for (var n = 0; n < this.playerNodeList.length; n++) {
var t = this.playerNodeList[n];
t && t.emit("playernode_changemaster_event", o);
}
}.bind(this));
e.socket.onPlayStart(function() {
this.roomstate = o.ROOM_PLAYING;
}.bind(this));
this.node.on("update_card_count_event", function(e) {
for (var o = 0; o < this.playerNodeList.length; o++) {
var n = this.playerNodeList[o];
n && n.emit("update_card_count_event", e);
}
}.bind(this));
e.socket.onShowBottomCard(function(e) {
var o = this.node.getChildByName("gameingUI");
null != o && o.emit("show_bottom_card_event", e);
}.bind(this));
e.socket.onRoomRestored(function(o) {
if (o.room_code) {
var t = {
roomid: o.room_code,
room_code: o.room_code,
seatindex: 1,
playerdata: [ {
accountid: o.player_id,
nick_name: o.player_name,
avatarUrl: "avatar_1",
gold_count: o.gold_count || 1e3,
goldcount: o.gold_count || 1e3,
seatindex: 1
} ]
};
this._processRoomData(t, e, n);
}
}.bind(this));
this.node.on("game_state_restored", function(e) {
this._onGameStateRestored(e);
}.bind(this));
e.socket.onPlayerOffline(function(e) {
this._onPlayerOffline(e);
}.bind(this));
e.socket.onPlayerOnline(function(e) {
this._onPlayerOnline(e);
}.bind(this));
e.socket.onTournamentWaitProgress(function(e) {
this._onArenaWaitProgress(e);
}.bind(this));
e.socket.onTournamentRoundAdvance(function(e) {
this._onArenaRoundAdvance(e);
}.bind(this));
e.socket.onTournamentFinalRank(function(e) {
this._onArenaFinalRank(e);
}.bind(this));
},
setPlayerSeatPos: function(e) {
if (!(e < 1 || e > 3)) switch (e) {
case 1:
this.playerdata_list_pos[1] = 0;
this.playerdata_list_pos[2] = 1;
this.playerdata_list_pos[3] = 2;
break;

case 2:
this.playerdata_list_pos[2] = 0;
this.playerdata_list_pos[3] = 1;
this.playerdata_list_pos[1] = 2;
break;

case 3:
this.playerdata_list_pos[3] = 0;
this.playerdata_list_pos[1] = 1;
this.playerdata_list_pos[2] = 2;
}
},
addPlayerNode: function(e) {
if (this.player_node_prefabs) if (this.players_seat_pos) {
var o = cc.instantiate(this.player_node_prefabs);
if (o) {
o.parent = this.node;
this.playerNodeList.push(o);
if (!e.room_category) {
e.room_category = this._roomCategory || 1;
console.log("🏟️ [addPlayerNode] 设置 player_data.room_category =", e.room_category);
}
!e.period_no && this._periodNo && (e.period_no = this._periodNo);
var n = this.playerdata_list_pos[e.seatindex];
if (null != n) if (this.players_seat_pos.children && this.players_seat_pos.children[n]) {
o.position = this.players_seat_pos.children[n].position;
var t = o.getComponent("player_node");
t ? t.init_data(e, n) : console.error("无法获取 player_node 组件");
} else console.error("座位节点不存在，index:", n); else console.error("无效的座位索引:", e.seatindex);
} else console.error("无法实例化 player_node_prefabs");
} else console.error("players_seat_pos 未绑定！"); else console.error("player_node_prefabs 未绑定！");
},
start: function() {},
onDestroy: function() {
this._stopOnlineMonitoring();
},
getUserOutCardPosByAccount: function(e) {
if (!this.playerNodeList || !this.players_seat_pos) {
console.error("playerNodeList 或 players_seat_pos 未初始化");
return null;
}
for (var o = String(e || ""), n = 0; n < this.playerNodeList.length; n++) {
var t = this.playerNodeList[n];
if (t) {
var a = t.getComponent("player_node");
if (a && String(a.accountid || "") === o) {
if (void 0 === a.seat_index || null === a.seat_index) {
console.error("无效的 seat_index");
return null;
}
if (!this.players_seat_pos.children || !this.players_seat_pos.children[a.seat_index]) {
console.error("座位节点不存在，seat_index:", a.seat_index);
return null;
}
var i = this.players_seat_pos.children[a.seat_index];
if (!i) {
console.error("seat_node 为空，seat_index:", a.seat_index);
return null;
}
var r = "cardsoutzone" + a.seat_index, c = i.getChildByName(r);
console.log("🃏 [getUserOutCardPosByAccount] accountid:", e, "seat_index:", a.seat_index, "out_card_node:", c ? c.name : "null");
return c;
}
}
}
console.warn("🃏 [getUserOutCardPosByAccount] 未找到玩家节点, accountid:", e, "playerNodeList.length:", this.playerNodeList.length);
return null;
},
_processRoomData: function(e, o, n) {
console.log("🎮 [_processRoomData] 接收到的数据:", JSON.stringify(e));
var t = e.seatindex || 1;
this.playerdata_list_pos = [];
this.setPlayerSeatPos(t);
var a = e.playerdata || [], i = e.roomid || e.room_code || e.roomCode || "WAITING", r = 2 === e.room_category;
if (r && o.arenaMatchData) {
console.log("🏟️ [_processRoomData] 使用预加载的竞技场数据:", JSON.stringify(o.arenaMatchData));
!e.base_score && o.arenaMatchData.base_score && (e.base_score = o.arenaMatchData.base_score);
!e.multiplier && o.arenaMatchData.multiplier && (e.multiplier = o.arenaMatchData.multiplier);
!e.match_rounds && o.arenaMatchData.match_rounds && (e.match_rounds = o.arenaMatchData.match_rounds);
!e.match_duration && o.arenaMatchData.match_duration && (e.match_duration = o.arenaMatchData.match_duration);
!e.initial_arena_gold && o.arenaMatchData.initial_arena_gold && (e.initial_arena_gold = o.arenaMatchData.initial_arena_gold);
}
r && console.log("🏟️ [_processRoomData] 竞技场模式: room_category=2, playerdata数量=" + a.length + ", 期号=" + e.period_no);
this._roomCategory = e.room_category || 1;
this._isArenaMode = r;
this._periodNo = e.period_no || "";
this._baseScore = e.base_score || 1;
this._multiplier = e.multiplier || 1;
this._matchRounds = e.match_rounds || 1;
this._initialArenaGold = e.initial_arena_gold || 1e3;
this._playerdataList = a;
this.roomid_label ? this.roomid_label.string = "房间号:" + i : console.error("🎮 [游戏场景] roomid_label 未绑定！");
this.di_label && e.base_score && (this.di_label.string = "底:" + e.base_score);
this.beishu_label && e.multiplier && (this.beishu_label.string = "倍数:" + e.multiplier);
o.playerData.housemanageid = e.housemanageid || e.creator_id || e.creatorId || "";
o.socket && o.socket.getPlayerInfo && o.socket.getPlayerInfo();
for (var c = 0; c < a.length; c++) {
console.log("🎮 [_processRoomData] 添加玩家节点: " + JSON.stringify(a[c]));
this.addPlayerNode(a[c]);
}
if (n) {
cc.audioEngine.stopAll();
cc.resources.load("sound/bg", cc.AudioClip, function(e, o) {
e || cc.audioEngine.play(o, !0, 1);
});
}
var l = this.node.getChildByName("gamebeforeUI");
if (l) {
l.active = !0;
l.zIndex = 1e3;
l.emit("init");
}
r ? console.log("🏟️ [_processRoomData] 竞技场模式：不显示等待玩家UI，玩家数量=" + a.length) : a.length < 3 && this._showWaitingUI(3 - a.length, i);
},
_showWaitingUI: function(e, o) {
var n = this;
this._isWaitingForPlayers = !0;
this._needPlayers = e;
this._currentRoomCode = o || "";
this._hideWaitingUI();
var t = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), a = t ? t.designResolution.height : 720, i = t ? t.designResolution.width : 1280, r = new cc.Node("WaitingForPlayersUI");
r.setContentSize(cc.size(i, a));
r.anchorX = .5;
r.anchorY = .5;
r.x = 0;
r.y = 0;
r.parent = this.node;
this._waitingUINode = r;
if (o) {
var c = new cc.Node("RoomInfo");
c.x = -i / 2 + 20;
c.y = a / 2 - 30;
c.anchorX = 0;
c.anchorY = .5;
var l = c.addComponent(cc.Label);
l.string = "房间号: " + o;
l.fontSize = 24;
l.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
c.color = cc.color(255, 215, 0);
var s = c.addComponent(cc.LabelOutline);
s.color = cc.color(0, 0, 0);
s.width = 2;
c.parent = r;
}
var d = new cc.Node("LeaveBtn");
d.x = i / 2 - 100;
d.y = -a / 2 + 50;
d.anchorX = .5;
d.anchorY = .5;
d.setContentSize(cc.size(140, 40));
var h = d.addComponent(cc.Graphics);
h.fillColor = cc.color(180, 60, 60, 230);
h.roundRect(-70, -20, 140, 40, 8);
h.fill();
h.strokeColor = cc.color(220, 100, 100);
h.lineWidth = 2;
h.roundRect(-70, -20, 140, 40, 8);
h.stroke();
d.parent = r;
var u = new cc.Node("Label");
u.anchorX = .5;
u.anchorY = .5;
var p = u.addComponent(cc.Label);
p.string = "离开房间";
p.fontSize = 20;
p.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
u.color = cc.color(255, 255, 255);
var g = u.addComponent(cc.LabelOutline);
g.color = cc.color(100, 30, 30);
g.width = 2;
u.parent = d;
d.on(cc.Node.EventType.TOUCH_START, function() {
d.scale = .95;
});
d.on(cc.Node.EventType.TOUCH_END, function() {
d.scale = 1;
n._leaveRoom();
});
d.on(cc.Node.EventType.TOUCH_CANCEL, function() {
d.scale = 1;
});
this._updateWaitingAnimation();
},
_updateWaitingUI: function() {
this._isWaitingForPlayers && this.playerNodeList.length >= 3 && this._hideWaitingUI();
},
_updateWaitingAnimation: function() {
var e = this;
this._isWaitingForPlayers && this._waitingUINode && this.scheduleOnce(function() {
e._updateWaitingAnimation();
}, 1 / 60);
},
_hideWaitingUI: function() {
this._isWaitingForPlayers = !1;
if (this._waitingUINode) {
this._waitingUINode.destroy();
this._waitingUINode = null;
}
},
_leaveRoom: function() {
var e = window.myglobal;
e && e.socket && e.socket.leaveRoom && e.socket.leaveRoom();
this._hideWaitingUI();
cc.director.loadScene("hallScene");
},
_onGameStateRestored: function(e) {
if (e.players) for (var o = 0; o < this.playerNodeList.length; o++) {
var n = this.playerNodeList[o];
if (n) {
var t = n.getComponent("player_node");
if (t) for (var a = 0; a < e.players.length; a++) {
var i = e.players[a];
if (i.id === t.accountid) {
n.emit("player_state_update", {
state: i.state,
cards_count: i.cards_count,
is_landlord: i.is_landlord
});
break;
}
}
}
}
var r = this.node.getChildByName("gamebeforeUI");
r && (r.active = !1);
var c = this.node.getChildByName("gameingUI");
c && (c.active = !0);
},
_onPlayerOffline: function(e) {
for (var o = 0; o < this.playerNodeList.length; o++) {
var n = this.playerNodeList[o];
if (n) {
var t = n.getComponent("player_node");
if (t && t.accountid === e.player_id) {
n.emit("player_state_update", {
state: "offline",
timeout: e.timeout
});
break;
}
}
}
},
_onPlayerOnline: function(e) {
for (var o = 0; o < this.playerNodeList.length; o++) {
var n = this.playerNodeList[o];
if (n) {
var t = n.getComponent("player_node");
if (t && t.accountid === e.player_id) {
n.emit("player_state_update", {
state: "online"
});
break;
}
}
}
},
_onPlayerLeft: function(e) {
console.log("👋 [_onPlayerLeft] 处理玩家离开, player_id:", e.player_id, "player_name:", e.player_name);
var o = e.player_id;
if (o) {
for (var n = 0; n < this.playerNodeList.length; n++) {
var t = this.playerNodeList[n];
if (t) {
var a = t.getComponent("player_node");
if (a && a.accountid === o) {
console.log("👋 [_onPlayerLeft] 找到离开的玩家节点，准备移除:", o);
t.destroy();
this.playerNodeList.splice(n, 1);
break;
}
}
}
if (this._playerdataList) for (n = 0; n < this._playerdataList.length; n++) if (this._playerdataList[n].accountid === o) {
this._playerdataList.splice(n, 1);
console.log("👋 [_onPlayerLeft] 从玩家数据列表中移除:", o);
break;
}
var i = this.playerNodeList.length;
console.log("👋 [_onPlayerLeft] 当前玩家数量:", i);
if (!this._isArenaMode && i < 3 && !this._isWaitingForPlayers) {
var r = this._currentRoomCode || "";
this.roomid_label && (r = this.roomid_label.string.replace("房间号:", ""));
this._showWaitingUI(3 - i, r);
}
var c = window.myglobal;
if (c && c.playerData && e.new_creator_id) {
c.playerData.housemanageid = e.new_creator_id;
console.log("👋 [_onPlayerLeft] 新房主ID:", e.new_creator_id);
}
} else console.warn("👋 [_onPlayerLeft] 缺少 player_id");
},
_showArenaWaitingUI: function(e) {
if (this._isArenaMode) {
console.log("🏟️ [_showArenaWaitingUI] 显示竞技场等待UI:", JSON.stringify(e));
this._hideArenaWaitingUI();
var o = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), n = o ? o.designResolution.height : 720, t = o ? o.designResolution.width : 1280, a = new cc.Node("ArenaWaitingUI");
a.setContentSize(cc.size(t, n));
a.anchorX = .5;
a.anchorY = .5;
a.x = 0;
a.y = 0;
a.zIndex = 2e3;
a.parent = this.node;
this._arenaWaitingUINode = a;
this._arenaWaitingData = {
periodNo: e.period_no || "",
round: e.round || 1,
totalRounds: e.total_rounds || 1,
finishedTables: e.finished_tables || 0,
totalTables: e.total_tables || 0,
status: e.status || "WAITING"
};
var i = new cc.Node("Bg"), r = i.addComponent(cc.Graphics);
r.fillColor = cc.color(0, 0, 0, 180);
r.rect(-t / 2, -n / 2, t, n);
r.fill();
i.parent = a;
var c = new cc.Node("Card");
c.setContentSize(cc.size(400, 280));
c.anchorX = .5;
c.anchorY = .5;
c.x = 0;
c.y = 0;
var l = c.addComponent(cc.Graphics);
l.fillColor = cc.color(30, 60, 100, 230);
l.roundRect(-200, -140, 400, 280, 15);
l.fill();
l.strokeColor = cc.color(255, 215, 0);
l.lineWidth = 3;
l.roundRect(-200, -140, 400, 280, 15);
l.stroke();
c.parent = a;
var s = new cc.Node("Title");
s.y = 105;
var d = s.addComponent(cc.Label);
d.string = "🏆 竞技场等待中";
d.fontSize = 28;
d.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.color = cc.color(255, 215, 0);
var h = s.addComponent(cc.LabelOutline);
h.color = cc.color(0, 0, 0);
h.width = 2;
s.parent = c;
this._arenaPeriodLabel = new cc.Node("PeriodLabel");
this._arenaPeriodLabel.y = 60;
var u = this._arenaPeriodLabel.addComponent(cc.Label);
u.string = "第 " + (e.period_no || "--") + " 期";
u.fontSize = 20;
u.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
this._arenaPeriodLabel.color = cc.color(200, 200, 220);
this._arenaPeriodLabel.parent = c;
this._arenaRoundLabel = new cc.Node("RoundLabel");
this._arenaRoundLabel.y = 30;
var p = this._arenaRoundLabel.addComponent(cc.Label);
p.string = "第 " + (e.round || 1) + " 轮 / 共 " + (e.total_rounds || 1) + " 轮";
p.fontSize = 18;
p.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
this._arenaRoundLabel.color = cc.color(180, 180, 200);
this._arenaRoundLabel.parent = c;
this._arenaCoinLabel = new cc.Node("CoinLabel");
this._arenaCoinLabel.y = 0;
var g = this._arenaCoinLabel.addComponent(cc.Label), _ = this._getMyMatchCoin ? this._getMyMatchCoin() : 0;
g.string = "💰 当前金币: " + _;
g.fontSize = 18;
g.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
this._arenaCoinLabel.color = cc.color(255, 215, 0);
this._arenaCoinLabel.parent = c;
this._arenaProgressBar = new cc.Node("ProgressBar");
this._arenaProgressBar.setContentSize(cc.size(320, 20));
this._arenaProgressBar.y = 0;
var f = this._arenaProgressBar.addComponent(cc.Graphics);
f.fillColor = cc.color(50, 50, 70, 200);
f.roundRect(-160, -10, 320, 20, 5);
f.fill();
this._arenaProgressBar.parent = c;
this._arenaProgressFill = new cc.Node("ProgressFill");
this._arenaProgressFill.y = 0;
var m = this._arenaProgressFill.addComponent(cc.Graphics);
this._arenaProgressFill._graphics = m;
this._arenaProgressFill.parent = c;
this._arenaProgressLabel = new cc.Node("ProgressLabel");
this._arenaProgressLabel.y = -40;
var C = this._arenaProgressLabel.addComponent(cc.Label);
C.string = (e.finished_tables || 0) + " / " + (e.total_tables || 0);
C.fontSize = 24;
C.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
this._arenaProgressLabel.color = cc.color(255, 255, 255);
this._arenaProgressLabel.parent = c;
this._arenaStatusLabel = new cc.Node("StatusLabel");
this._arenaStatusLabel.y = -80;
var v = this._arenaStatusLabel.addComponent(cc.Label);
v.string = "正在等待其他玩家完成...";
v.fontSize = 16;
v.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
this._arenaStatusLabel.color = cc.color(150, 200, 255);
this._arenaStatusLabel.parent = c;
this._arenaLoadingNode = new cc.Node("LoadingNode");
this._arenaLoadingNode.y = -120;
var w = this._arenaLoadingNode.addComponent(cc.Sprite);
cc.resources.load("UI/card_back", cc.SpriteFrame, function(e, o) {
!e && o && w && (w.spriteFrame = o);
});
this._arenaLoadingNode.scale = .5;
this._arenaLoadingNode.parent = c;
this._startArenaLoadingAnimation();
this._updateArenaWaitingUI(e);
console.log("🏟️ [_showArenaWaitingUI] 竞技场等待UI已创建");
} else console.log("🏟️ [_showArenaWaitingUI] 非竞技场模式，不显示等待UI");
},
_hideArenaWaitingUI: function() {
this._stopArenaLoadingAnimation();
if (this._arenaWaitingUINode) {
this._arenaWaitingUINode.destroy();
this._arenaWaitingUINode = null;
}
this._arenaPeriodLabel = null;
this._arenaRoundLabel = null;
this._arenaCoinLabel = null;
this._arenaProgressBar = null;
this._arenaProgressFill = null;
this._arenaProgressLabel = null;
this._arenaStatusLabel = null;
this._arenaLoadingNode = null;
this._arenaWaitingData = null;
console.log("🏟️ [_hideArenaWaitingUI] 竞技场等待UI已隐藏");
},
_updateArenaWaitingUI: function(e) {
if (this._arenaWaitingUINode) {
e && (this._arenaWaitingData = {
periodNo: e.period_no || this._arenaWaitingData.periodNo,
round: e.round || this._arenaWaitingData.round,
totalRounds: e.total_rounds || this._arenaWaitingData.totalRounds,
finishedTables: e.finished_tables || this._arenaWaitingData.finishedTables,
totalTables: e.total_tables || this._arenaWaitingData.totalTables,
status: e.status || this._arenaWaitingData.status
});
var o = this._arenaWaitingData;
if (this._arenaPeriodLabel) {
var n = this._arenaPeriodLabel.getComponent(cc.Label);
n && (n.string = "第 " + (o.periodNo || "--") + " 期");
}
if (this._arenaRoundLabel) {
var t = this._arenaRoundLabel.getComponent(cc.Label);
t && (t.string = "第 " + o.round + " 轮 / 共 " + o.totalRounds + " 轮");
}
if (this._arenaProgressLabel) {
var a = this._arenaProgressLabel.getComponent(cc.Label);
a && (a.string = o.finishedTables + " / " + o.totalTables);
}
if (this._arenaProgressFill && o.totalTables > 0) {
var i = 320 * Math.min(o.finishedTables / o.totalTables, 1), r = this._arenaProgressFill._graphics;
if (r) {
r.clear();
if (i > 0) {
r.fillColor = cc.color(100, 200, 100, 255);
r.roundRect(-160, -8, i, 16, 3);
r.fill();
}
}
}
if (this._arenaStatusLabel) {
var c = this._arenaStatusLabel.getComponent(cc.Label);
if (c) if (o.finishedTables >= o.totalTables) {
c.string = "全部完成，即将进入下一轮...";
this._arenaStatusLabel.color = cc.color(100, 255, 100);
} else {
var l = o.totalTables - o.finishedTables;
c.string = "正在等待其他玩家完成... (剩余 " + l + " 桌)";
this._arenaStatusLabel.color = cc.color(150, 200, 255);
}
}
}
},
_startArenaLoadingAnimation: function() {
if (this._arenaLoadingNode) {
this._stopArenaLoadingAnimation();
var e = this;
this._arenaLoadingAnimation = !0;
(function o() {
if (e._arenaLoadingAnimation && e._arenaLoadingNode) {
e._arenaLoadingNode.angle += 3;
setTimeout(o, 16);
}
})();
}
},
_stopArenaLoadingAnimation: function() {
this._arenaLoadingAnimation = !1;
this._arenaLoadingNode && (this._arenaLoadingNode.angle = 0);
},
_getMyMatchCoin: function() {
var e = window.myglobal;
if (!e || !e.playerData) return 0;
var o = 0;
if (this.player_node_prefabs && this.player_node_prefabs.length > 0) for (var n = 0; n < this.player_node_prefabs.length; n++) {
var t = this.player_node_prefabs[n];
if (t && t.player_data) {
var a = t.player_data, i = e.playerData.accountID || e.playerData.uniqueID;
if (a.accountid === i || a.accountid === String(i)) {
o = a.match_coin || a.arena_gold || 0;
break;
}
}
}
0 === o && e.arenaMatchData && (o = e.arenaMatchData.myMatchCoin || 0);
return o;
},
_onArenaWaitProgress: function(e) {
console.log("🏟️ [_onArenaWaitProgress] 收到进度更新:", JSON.stringify(e));
this._arenaWaitingData && this._arenaWaitingData.periodNo && e.period_no && e.period_no !== this._arenaWaitingData.periodNo || (!this._arenaWaitingUINode && this._isArenaMode ? this._showArenaWaitingUI(e) : this._updateArenaWaitingUI(e));
},
_onArenaRoundAdvance: function(e) {
console.log("🏟️ [_onArenaRoundAdvance] 进入下一轮:", JSON.stringify(e));
if (!(this._arenaWaitingData && this._arenaWaitingData.periodNo && e.period_no && e.period_no !== this._arenaWaitingData.periodNo)) {
if (this._arenaWaitingData) {
this._arenaWaitingData.round = e.new_round || this._arenaWaitingData.round + 1;
this._arenaWaitingData.totalRounds = e.total_rounds || this._arenaWaitingData.totalRounds;
this._arenaWaitingData.finishedTables = 0;
}
if (this._arenaRoundLabel) {
var o = this._arenaRoundLabel.getComponent(cc.Label);
if (o) {
o.string = "第 " + (e.new_round || 1) + " 轮 / 共 " + (e.total_rounds || 1) + " 轮";
var n = cc.scaleTo(.2, 1.3), t = cc.scaleTo(.2, 1), a = cc.sequence(n, t);
this._arenaRoundLabel.runAction(a);
}
}
if (this._arenaStatusLabel) {
var i = this._arenaStatusLabel.getComponent(cc.Label);
if (i) {
i.string = e.message || "晋级成功！正在匹配下一轮...";
this._arenaStatusLabel.color = cc.color(100, 255, 100);
}
}
}
},
_onArenaFinalRank: function(e) {
console.log("🏟️ [_onArenaFinalRank] 比赛结束，显示最终榜单:", JSON.stringify(e));
if (!(this._arenaWaitingData && this._arenaWaitingData.periodNo && e.period_no && e.period_no !== this._arenaWaitingData.periodNo)) {
this._stopArenaLoadingAnimation();
this._hideArenaWaitingUI();
this._showArenaFinalRankDialog(e);
}
},
_showArenaFinalRankDialog: function(e) {
console.log("🏆 [_showArenaFinalRankDialog] 显示完整排行榜弹窗, data:", JSON.stringify(e));
var o = this._createFinalRankDialog(e);
if (o) {
this.node.addChild(o);
o.zIndex = 3e3;
this._arenaFinalRankDialog = o;
console.log("🏆 [_showArenaFinalRankDialog] 完整排行榜弹窗已创建");
} else console.error("🏆 [_showArenaFinalRankDialog] 创建弹窗失败");
},
_createFinalRankDialog: function(e) {
var o = new cc.Node("TournamentFinalRankDialog");
o.setPosition(0, 0);
o.setContentSize(1280, 720);
var n = new cc.Node("Background");
n.setContentSize(1280, 720);
var t = n.addComponent(cc.Graphics);
t.fillColor = new cc.Color(0, 0, 0, 180);
t.rect(-640, -360, 1280, 720);
t.fill();
n.parent = o;
var a = new cc.Node("DialogContainer");
a.setContentSize(1e3, 650);
a.setPosition(0, 0);
var i = new cc.Node("DialogBg"), r = i.addComponent(cc.Graphics);
r.fillColor = new cc.Color(25, 35, 60, 250);
r.roundRect(-500, -325, 1e3, 650, 25);
r.fill();
r.strokeColor = new cc.Color(180, 140, 60);
r.lineWidth = 4;
r.roundRect(-500, -325, 1e3, 650, 25);
r.stroke();
i.parent = a;
a.parent = o;
var c = new cc.Node("Title");
c.setPosition(0, 270);
var l = c.addComponent(cc.Label);
l.string = "🏆 比赛结束 🏆";
l.fontSize = 40;
l.lineHeight = 48;
l.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.color = new cc.Color(255, 215, 0);
var s = c.addComponent(cc.LabelOutline);
s.color = new cc.Color(100, 60, 0);
s.width = 3;
c.parent = a;
var d = e.period_no || "---", h = e.total_players || 0, u = new cc.Node("PeriodNo");
u.setPosition(0, 220);
var p = u.addComponent(cc.Label);
p.string = "第" + d + "期赛事结束  共" + h + "人参赛";
p.fontSize = 24;
p.lineHeight = 30;
p.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
u.color = new cc.Color(200, 200, 220);
u.parent = a;
var g = e.top3 || [];
g.length >= 1 && this._createPodiumItem(a, g[0], 1, 0, 80, 1.15);
g.length >= 2 && this._createPodiumItem(a, g[1], 2, -280, 40, 1);
g.length >= 3 && this._createPodiumItem(a, g[2], 3, 280, 40, 1);
var _ = e.my_rank || 0, f = e.my_match_coin || 0, m = new cc.Node("MyRankContainer");
m.setPosition(0, -200);
m.setContentSize(600, 50);
var C = new cc.Node("Bg"), v = C.addComponent(cc.Graphics);
v.fillColor = new cc.Color(40, 50, 80, 230);
v.roundRect(-300, -25, 600, 50, 12);
v.fill();
v.strokeColor = new cc.Color(100, 120, 160);
v.lineWidth = 2;
v.roundRect(-300, -25, 600, 50, 12);
v.stroke();
C.parent = m;
var w = new cc.Node("MyRankLabel");
w.setPosition(-140, 0);
var y = w.addComponent(cc.Label);
y.string = _ > 0 ? "我的排名：第" + _ + "名" : "我的排名：未上榜";
y.fontSize = 22;
y.lineHeight = 28;
y.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
w.color = new cc.Color(100, 200, 255);
w.parent = m;
var b = new cc.Node("MyCoinLabel");
b.setPosition(140, 0);
var S = b.addComponent(cc.Label);
S.string = "比赛金币：" + f;
S.fontSize = 22;
S.lineHeight = 28;
S.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
b.color = new cc.Color(255, 200, 100);
b.parent = m;
m.parent = a;
var N = new cc.Node("ConfirmBtn");
N.setPosition(0, -270);
N.setContentSize(200, 50);
var L = N.addComponent(cc.Graphics);
L.fillColor = new cc.Color(80, 160, 80);
L.roundRect(-100, -25, 200, 50, 12);
L.fill();
L.strokeColor = new cc.Color(120, 200, 120);
L.lineWidth = 3;
L.roundRect(-100, -25, 200, 50, 12);
L.stroke();
var A = new cc.Node("Label"), T = A.addComponent(cc.Label);
T.string = "确 定";
T.fontSize = 26;
T.lineHeight = 32;
T.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
A.color = new cc.Color(255, 255, 255);
var R = A.addComponent(cc.LabelOutline);
R.color = new cc.Color(30, 80, 30);
R.width = 2;
A.parent = N;
N.addComponent(cc.Button);
N.on("click", function() {
console.log("🏆 [TournamentFinalRank] 点击确认，返回大厅");
o.destroy();
cc.director.loadScene("hallScene");
}, this);
N.parent = a;
return o;
},
_createPodiumItem: function(e, o, n, t, a, i) {
var r = new cc.Node("PodiumItem_" + n);
r.setPosition(t, a);
r.scale = i || 1;
var c = new cc.Node("RankLabel");
c.setPosition(0, 60);
var l = c.addComponent(cc.Label);
l.string = {
1: "🥇 冠军",
2: "🥈 亚军",
3: "🥉 季军"
}[n] || "第" + n + "名";
l.fontSize = 22;
l.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.color = 1 === n ? new cc.Color(255, 215, 0) : new cc.Color(200, 200, 220);
var s = c.addComponent(cc.LabelOutline);
s.color = new cc.Color(50, 50, 80);
s.width = 2;
c.parent = r;
var d = 1 === n ? 70 : 60, h = new cc.Node("AvatarContainer");
h.setPosition(0, 0);
h.setContentSize(d, d);
var u = new cc.Node("AvatarBg"), p = u.addComponent(cc.Graphics);
p.fillColor = new cc.Color(60, 70, 100);
p.circle(0, 0, d / 2 + 2);
p.fill();
p.strokeColor = 1 === n ? new cc.Color(255, 215, 0) : new cc.Color(150, 150, 180);
p.lineWidth = 1 === n ? 3 : 2;
p.circle(0, 0, d / 2 + 2);
p.stroke();
u.parent = h;
var g = new cc.Node("AvatarSprite");
g.setPosition(0, 0);
g.setContentSize(d - 4, d - 4);
var _ = g.addComponent(cc.Sprite);
_.sizeMode = cc.Sprite.SizeMode.CUSTOM;
g.color = new cc.Color(255, 255, 255);
g.parent = h;
console.log("🖼️ [_createPodiumItem] 创建头像节点, rank:", n, "avatarUrl:", o.avatar);
this._loadAvatarForPodium(_, g, o.avatar, o.is_robot, d - 4);
h.parent = r;
var f = new cc.Node("NameLabel");
f.setPosition(0, -55);
f.setContentSize(120, 30);
var m = f.addComponent(cc.Label), C = o.player_name || "玩家";
C.length > 6 && (C = C.substring(0, 6) + "...");
m.string = C;
m.fontSize = 1 === n ? 20 : 18;
m.lineHeight = 24;
m.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
m.overflow = cc.Label.Overflow.CLAMP;
f.color = new cc.Color(255, 255, 255);
var v = f.addComponent(cc.LabelOutline);
v.color = new cc.Color(30, 30, 50);
v.width = 1;
f.parent = r;
var w = new cc.Node("CoinLabel");
w.setPosition(0, -85);
var y = w.addComponent(cc.Label);
y.string = this._formatMatchCoin(o.match_coin || 0) + "金币";
y.fontSize = 1 === n ? 18 : 16;
y.lineHeight = 20;
y.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
w.color = 1 === n ? new cc.Color(255, 215, 0) : new cc.Color(255, 200, 100);
var b = w.addComponent(cc.LabelOutline);
b.color = new cc.Color(80, 50, 0);
b.width = 1;
w.parent = r;
r.parent = e;
return r;
},
_loadAvatarForPodium: function(e, o, n, t, a) {
if (e) {
console.log("🖼️ [_loadAvatarForPodium] 开始加载头像, URL:", n, "isRobot:", t, "size:", a);
var i = a || 60;
if (o) {
o.active = !0;
o.opacity = 255;
o.color = new cc.Color(255, 255, 255);
}
if (n && "" !== n) if (0 === n.indexOf("http") || 0 === n.indexOf("//")) {
console.log("🖼️ [_loadAvatarForPodium] 加载远程头像...");
cc.assetManager.loadRemote(n, function(n, t) {
if (n) {
console.error("🖼️ [_loadAvatarForPodium] 加载远程头像失败:", n);
cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(o, n) {
if (!o && n && e && e.isValid) {
e.spriteFrame = n;
console.log("🖼️ [_loadAvatarForPodium] 使用默认头像");
}
});
} else if (t) if (e && e.isValid) {
console.log("🖼️ [_loadAvatarForPodium] 远程头像加载成功, texture:", t.width, "x", t.height);
var a = new cc.SpriteFrame(t);
e.spriteFrame = a;
if (o && o.isValid) {
o.setContentSize(i, i);
o.opacity = 255;
o.active = !0;
console.log("🖼️ [_loadAvatarForPodium] 节点尺寸已设置为:", i);
}
e.sizeMode = cc.Sprite.SizeMode.CUSTOM;
e.markForRender();
console.log("🖼️ [_loadAvatarForPodium] 头像设置完成！");
} else console.warn("🖼️ [_loadAvatarForPodium] sprite 组件已失效，跳过设置"); else console.error("🖼️ [_loadAvatarForPodium] texture 为空");
});
} else {
var r = "UI/headimage/" + n;
console.log("🖼️ [_loadAvatarForPodium] 加载本地头像:", r);
cc.resources.load(r, cc.SpriteFrame, function(o, n) {
if (!o && n) {
if (e && e.isValid) {
e.spriteFrame = n;
console.log("🖼️ [_loadAvatarForPodium] 本地头像设置成功");
}
} else {
console.error("🖼️ [_loadAvatarForPodium] 加载本地头像失败:", o);
cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(o, n) {
!o && n && e && e.isValid && (e.spriteFrame = n);
});
}
});
} else {
console.log("🖼️ [_loadAvatarForPodium] 头像URL为空，使用默认头像");
cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(o, n) {
if (!o && n && e && e.isValid) {
e.spriteFrame = n;
console.log("🖼️ [_loadAvatarForPodium] 默认头像设置成功");
}
});
}
} else console.error("🖼️ [_loadAvatarForPodium] sprite 为空，无法加载头像");
},
_getRobotDisplayName: function(e, o) {
if (o && 0 === o.indexOf("智能陪练")) return o;
var n = 1;
if (e) {
var t = e.toString().slice(-1);
n = parseInt(t) || 1;
}
return "智能陪练" + n + "号";
},
_formatMatchCoin: function(e) {
return e >= 1e4 ? (e / 1e4).toFixed(1) + "万" : e.toString();
},
_hideArenaFinalRankDialog: function() {
if (this._arenaFinalRankDialog) {
this._arenaFinalRankDialog.destroy();
this._arenaFinalRankDialog = null;
}
}
});
cc._RF.pop();
}, {} ],
gamebeforeUI: [ function(e, o) {
"use strict";
cc._RF.push(o, "dda57PiQJFCspcrrRDykXWP", "gamebeforeUI");
cc.Class({
extends: cc.Component,
properties: {
btn_ready: cc.Node,
btn_gamestart: cc.Node
},
onLoad: function() {
var e = window.myglobal;
if (e) {
this.btn_gamestart.active = !1;
this.btn_ready.active = !1;
this._createChangeRoomButton();
this.node.on("init", function() {
this._initProcessed = !0;
if (2 === (e.roomData || {}).room_category) {
console.log("🏟️ [gamebeforeUI] 竞技场模式：隐藏所有按钮，等待游戏自动开始");
this.btn_gamestart.active = !1;
this.btn_ready.active = !1;
this._hideChangeRoomButton();
} else {
var o = e.playerData.housemanageid, n = "";
e.socket && e.socket.getPlayerInfo && (n = e.socket.getPlayerInfo().id);
n || (n = e.playerData.accountID);
if (o && n && o == n) {
this.btn_gamestart.active = !1;
this.btn_ready.active = !1;
this._showChangeRoomButton(!0);
} else {
this.btn_gamestart.active = !1;
this.btn_ready.active = !0;
this._showChangeRoomButton(!1);
}
}
}.bind(this));
e.socket.onChangeHouseManage(function(o) {
e.playerData.housemanageid = o;
if (2 === (e.roomData || {}).room_category) {
this.btn_gamestart.active = !1;
this.btn_ready.active = !1;
this._hideChangeRoomButton();
} else {
var n = e.playerData.housemanageid, t = "";
e.socket && e.socket.getPlayerInfo && (t = e.socket.getPlayerInfo().id);
t || (t = e.playerData.accountID);
if (n && t && n == t) {
this.btn_gamestart.active = !1;
this.btn_ready.active = !1;
this._showChangeRoomButton(!0);
} else {
this.btn_gamestart.active = !1;
this.btn_ready.active = !0;
this._showChangeRoomButton(!1);
}
}
}.bind(this));
} else console.error("myglobal 未定义");
},
_createChangeRoomButton: function() {
var e = this, o = new cc.Node("btn_changeRoom");
o.x = 0;
o.y = 0;
o.anchorX = .5;
o.anchorY = .5;
o.setContentSize(cc.size(147, 46));
o.active = !1;
cc.resources.load("UI/btnchange", cc.SpriteFrame, function(e, n) {
if (e) {
var t = o.addComponent(cc.Graphics);
t.fillColor = cc.color(255, 180, 0, 255);
t.roundRect(-73.5, -23, 147, 46, 10);
t.fill();
t.strokeColor = cc.color(200, 140, 0);
t.lineWidth = 2;
t.roundRect(-73.5, -23, 147, 46, 10);
t.stroke();
var a = new cc.Node("Label"), i = a.addComponent(cc.Label);
i.string = "换房";
i.fontSize = 22;
i.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
a.color = cc.color(255, 255, 255);
var r = a.addComponent(cc.LabelOutline);
r.color = cc.color(100, 60, 0);
r.width = 2;
a.parent = o;
} else {
var c = o.addComponent(cc.Sprite);
c.spriteFrame = n;
c.sizeMode = cc.Sprite.SizeMode.RAW;
}
});
var n = o.addComponent(cc.Button);
n.transition = cc.Button.Transition.SCALE;
n.duration = .1;
o.on(cc.Node.EventType.TOUCH_END, function() {
e._changeRoom();
});
o.parent = this.node;
this._btnChangeRoom = o;
},
_hideChangeRoomButton: function() {
this._btnChangeRoom && (this._btnChangeRoom.active = !1);
},
_showChangeRoomButton: function(e) {
if (this._btnChangeRoom) {
this._btnChangeRoom.active = !0;
if (e) {
this._btnChangeRoom.x = 0;
this.btn_ready && (this.btn_ready.x = 0);
} else {
this._btnChangeRoom.x = -103;
this.btn_ready && (this.btn_ready.x = 93.5);
}
}
},
_changeRoom: function() {
var e = window.myglobal;
e && e.socket && e.socket.leaveRoom && e.socket.leaveRoom();
cc.director.loadScene("hallScene");
},
start: function() {
var e = window.myglobal;
e && this.scheduleOnce(function() {
if (!this._initProcessed) if (2 === (e.roomData || {}).room_category) {
console.log("🏟️ [gamebeforeUI] start: 竞技场模式，隐藏所有按钮");
this.btn_gamestart.active = !1;
this.btn_ready.active = !1;
this._hideChangeRoomButton();
} else {
var o = e.playerData.housemanageid, n = "";
e.socket && e.socket.getPlayerInfo && (n = e.socket.getPlayerInfo().id);
n || (n = e.playerData.accountID);
if (o && n && o == n) {
this.btn_ready.active = !1;
this._showChangeRoomButton(!0);
} else {
this.btn_ready.active = !0;
this._showChangeRoomButton(!1);
}
}
}.bind(this), .5);
},
onButtonClick: function(e, o) {
var n = window.myglobal;
switch (o) {
case "btn_ready":
this._playReadySound();
n.socket.requestReady();
this.btn_ready.active = !1;
this._showChangeRoomButton(!0);
break;

case "btn_start":
n.socket.requestStart(function() {});
}
},
_playReadySound: function() {
window.isopen_sound, cc.resources.load("sound/start", cc.AudioClip, function(e, o) {
e ? console.warn("🔊 准备音效加载失败:", e) : cc.audioEngine.playEffect(o, !1);
});
}
});
cc._RF.pop();
}, {} ],
gameingUI: [ function(e, o) {
"use strict";
cc._RF.push(o, "77743SDxfxJ26racOmhW9tt", "gameingUI");
var n, t = window.isopen_sound || 1, a = window.qian_state || {
buqiang: 0,
qian: 1
}, i = (window.CardsValue, window.RoomState, {}), r = {
animDuration: .12,
deckPosition: cc.v2(0, 100),
cardInterval: 80
};
function c(e) {
if (!t) return null;
if (i[e]) return cc.audioEngine.play(i[e], !1, 1);
cc.resources.load(e, cc.AudioClip, function(o, n) {
if (!o) {
i[e] = n;
cc.audioEngine.play(n, !1, 1);
}
});
return null;
}
cc.Class(((n = {
extends: cc.Component,
properties: {
gameingUI: cc.Node,
card_prefab: cc.Prefab,
robUI: cc.Node,
bottom_card_pos_node: cc.Node,
playingUI_node: cc.Node,
tipsLabel: cc.Label,
cards_node: cc.Node,
bidCountdownLabel: cc.Label,
playCountdownLabel: cc.Label,
tickAudio: {
default: null,
type: cc.AudioClip
}
},
onLoad: function() {
var e = window.myglobal;
if (e) {
this._preloadCardAtlas();
if (!this.cards_node) {
var o = this.node.parent;
if (o) {
for (var n = 0; n < o.children.length; n++) {
var t = o.children[n];
if ("cards_node" === t.name || "cards" === t.name || "handCards" === t.name) {
this.cards_node = t;
break;
}
}
if (!this.cards_node) {
var a = new cc.Node("cards_node");
a.parent = o;
a.setPosition(0, 0);
a.setAnchorPoint(.5, .5);
a.setContentSize(cc.size(800, 200));
this.cards_node = a;
}
}
}
this.handCards = [];
this.bottomCards = [];
this.choose_card_data = [];
this.rob_player_accountid = 0;
this._biddingPhase = "idle";
this._gamePhase = "idle";
this.cardsReady = !1;
this._pendingBidUI = !1;
this._pendingBidRound = 1;
this._bidTimeout = 0;
this._playTimeout = 0;
this._bidCountdownTimer = null;
this._playCountdownTimer = null;
this._bidTimeLeft = 0;
this._playTimeLeft = 0;
this._isBidCountdownTicking = !1;
this._isPlayCountdownTicking = !1;
this._isBidWarning = !1;
this._isPlayWarning = !1;
this._bidExpiresAt = 0;
this.bottom_card = [];
this._isCompetition = !1;
this._roomCategory = 1;
this._matchCoin = 0;
this._competitionRound = 0;
this._competitionTotalRounds = 0;
this._competitionCountdown = 0;
this._competitionCountdownTimer = null;
this._wasDisconnected = !1;
this._lastUserActivityTime = 0;
this._userActivityThrottle = 1e3;
this._setupUserActivityDetection();
e.socket.onPushCards(function(e) {
console.log("🃏 ========== 服务端发牌消息 ==========");
console.log("🃏 服务端原始手牌:", JSON.stringify(e.cards));
console.log("🃏 服务端原始底牌:", JSON.stringify(e.bottom_cards));
if (this._gameResultPopup || this._gameResultMask) {
console.log("🃏 [onPushCards] 关闭上一轮的结算弹窗");
this._closeGameResultPopup(this._gameResultPopup, this._gameResultMask);
}
this._stopArenaCountdown();
console.log("🃏 [onPushCards] 清理桌面上的牌");
this._clearAllOutCardZones();
this.handCards = e.cards || [];
this.bottomCards = e.bottom_cards || [];
this.renderCards(this.handCards);
}.bind(this));
e.socket.onBidTurn(function() {}.bind(this));
e.socket.onBidResult(function(e) {
this._stopBidCountdown();
this.node && this.node.parent && this.node.parent.emit("bid_result_event", {
player_id: e.accountid,
bid: e.state
});
}.bind(this));
e.socket.onCanRobState(function() {}.bind(this));
e.socket.onCanChuCard(function(o) {
var n = o.player_id || o, t = e.socket.getPlayerInfo().id || e.playerData.serverPlayerId || e.playerData.accountID;
this._stopPlayCountdown();
this._mustPlay = o.must_play || !1;
this._canBeat = o.can_beat || !1;
this._lastPlayedCards = null;
if (String(n) === String(t)) {
this._hideRobUI();
this.clearOutZone(t);
this.playingUI_node.active = !0;
this._playTimeout = o.timeout || 15;
this._startPlayCountdown();
} else this.playingUI_node && (this.playingUI_node.active = !1);
}.bind(this));
e.socket.onOtherPlayerChuCard(function(o) {
this._stopPlayCountdown();
this.playingUI_node && (this.playingUI_node.active = !1);
if (o.is_pass) {
this._playPassSound(o);
this._showPassEffect(o.accountid);
} else {
this._lastPlayedCards = o.cards || [];
this._lastPlayedHandType = o.hand_type || "";
if (this.node && this.node.parent) {
var n = e.socket.getPlayerInfo() || {}, t = e.playerData && e.playerData.serverPlayerId || "", a = e.playerData && e.playerData.accountID || "", i = n.id || t || a;
String(o.accountid || "") === String(i || "") && this._removeCardsFromHand(o.cards);
this._playCardSound(o);
var r = this.node.parent.getComponent("gameScene");
if (r) {
var c = r.getUserOutCardPosByAccount(o.accountid);
console.log("🃏 [onOtherPlayerChuCard] data.accountid:", o.accountid, "outCard_node:", c ? c.name : "null");
if (c && this.card_prefab) {
for (var l = [], s = 0; s < o.cards.length; s++) {
var d = cc.instantiate(this.card_prefab);
if (d) {
var h = d.getComponent("card");
h && h.showCards(o.cards[s], e.playerData.accountID);
l.push(d);
}
}
this.showOutCards(c, l);
void 0 !== o.cards_left && this.node.parent.emit("update_card_count_event", {
accountid: o.accountid,
count: o.cards_left
});
} else console.error("🃏 [onOtherPlayerChuCard] outCard_node 或 card_prefab 为空, outCard_node:", !!c, "card_prefab:", !!this.card_prefab);
} else console.error("🃏 [onOtherPlayerChuCard] gameScene_script 为空");
}
}
}.bind(this));
e.socket.onCallLandlordStart(function() {
this._biddingPhase = "bidding";
this._gamePhase = "bidding";
}.bind(this));
e.socket.onCallLandlordTurn(function(e) {
this._processCallLandlordTurn(e);
}.bind(this));
e.socket.onCallLandlordResult(function(e) {
this._stopBidCountdown();
this._playRobSound(e);
this.node && this.node.parent && this.node.parent.emit("call_landlord_result_event", e);
}.bind(this));
e.socket.onCallLandlordEnd(function(e) {
this._stopBidCountdown();
this._hideRobUI();
this._biddingPhase = "idle";
this.rob_player_accountid = 0;
this.cardsReady = !1;
e.bottom_cards && e.bottom_cards.length > 0 && (this.bottomCards = e.bottom_cards);
this._showBottomCardsToAll(e.bottom_cards);
}.bind(this));
e.socket.onLandlordCards(function(o) {
var n = e.socket.getPlayerInfo().id || e.playerData.serverPlayerId || e.playerData.accountID, t = o.landlord_id || "";
if (String(t) === String(n)) {
this.handCards = o.cards || [];
this.bottomCards = o.bottom_cards || [];
this._updateLandlordHandCards(this.handCards);
}
}.bind(this));
e.socket.onRestartGame(function() {
this._stopBidCountdown();
this._stopPlayCountdown();
this._hideRobUI();
this._biddingPhase = "idle";
this._gamePhase = "idle";
this.cardsReady = !1;
this.handCards = [];
this.bottomCards = [];
this.choose_card_data = [];
this.clearAllCards();
}.bind(this));
e.socket.onPlayStart(function() {
this._gamePhase = "playing";
this._biddingPhase = "idle";
this._hideRobUI();
}.bind(this));
e.socket.onGameOver(function(e) {
this._stopPlayCountdown();
this._gamePhase = "idle";
this._biddingPhase = "idle";
this._resetAllPlayerReadyState();
this._showGameResultPopup(e);
}.bind(this));
e.socket.onGameStateRestore(function(e) {
this.restoreGameState(e);
}.bind(this));
e.socket.onHintResult(function(e) {
this._onHintResult(e);
}.bind(this));
e.socket.onTrusteeStateNotify(function(e) {
this._onTrusteeStateNotify(e);
}.bind(this));
this._isLocalTrustee = !1;
this._lastActivityTime = 0;
this._activityThrottleMs = 500;
this._setupUserActivityListener();
e.socket.onCompetitionStatus(function(e) {
this._onCompetitionStatus(e);
}.bind(this));
e.socket.onCompetitionCountdown(function(e) {
this._onCompetitionCountdown(e);
}.bind(this));
e.socket.onMatchCoinUpdate(function(e) {
this._onMatchCoinUpdate(e);
}.bind(this));
e.socket.onCompetitionEliminated(function(e) {
this._onCompetitionEliminated(e);
}.bind(this));
e.socket.onCompetitionAdvance(function(e) {
this._onCompetitionAdvance(e);
}.bind(this));
e.socket.onCompetitionChampion(function(e) {
this._onCompetitionChampion(e);
}.bind(this));
e.socket.onTournamentFinalRank(function(e) {
console.log("🏆 [gameingUI] 收到最终榜单:", JSON.stringify(e));
this._onTournamentFinalRank(e);
}.bind(this));
e.socket.onArenaEliminatedKick(function(e) {
console.log("🚪 [gameingUI] 收到淘汰踢出通知:", JSON.stringify(e));
this._onArenaEliminatedKick(e);
}.bind(this));
this.node.on("show_bottom_card_event", function(e) {
var o = e;
e && e.cards && (o = e.cards);
o && o.length;
}.bind(this));
var i = this.node.parent;
if (i) {
i.on("choose_card_event", function(e) {
this.choose_card_data.push(e);
this._updateSelectedCountDisplay();
}.bind(this));
i.on("unchoose_card_event", function(e) {
for (var o = 0; o < this.choose_card_data.length; o++) {
var n = this.choose_card_data[o].cardid;
if (n && void 0 !== n.suit && void 0 !== n.rank) {
if (n.suit === e.suit && n.rank === e.rank) {
this.choose_card_data.splice(o, 1);
break;
}
} else if (n == e) {
this.choose_card_data.splice(o, 1);
break;
}
}
this._updateSelectedCountDisplay();
}.bind(this));
}
} else console.error("myglobal 未定义");
},
start: function() {},
_preloadCardAtlas: function() {
window._cardAtlasLoaded || cc.resources.load("UI/card/card", cc.SpriteAtlas, function(e, o) {
if (e) console.error("🃏 [_preloadCardAtlas] 加载卡牌图集失败:", e); else {
window._cardAtlasLoaded = !0;
window._cardAtlas = o;
console.log("🃏 [_preloadCardAtlas] 卡牌图集预加载成功");
}
});
},
onDestroy: function() {
this._stopPlayCountdown();
this._stopBidCountdown();
if (this._competitionCountdownTimer) {
this.unschedule(this._competitionCountdownTick);
this._competitionCountdownTimer = null;
}
if (this._localArenaCountdownTimer) {
this.unschedule(this._localArenaCountdownTick);
this._localArenaCountdownTimer = null;
}
this._hideMatchCoinDisplay();
},
renderCards: function(e) {
if (this.node && this.node.isValid) if (e && 0 !== e.length) if (window._cardAtlasLoaded) this._doRenderCards(e); else {
console.log("🎮 [renderCards] 卡牌图集未加载完成，等待中...");
this._waitForAtlasAndRender(e);
} else console.warn("🎮 [renderCards] 没有牌可渲染"); else console.warn("🎮 [renderCards] 节点已销毁或无效，跳过渲染");
},
_waitForAtlasAndRender: function(e) {
var o = this, n = 0;
(function t() {
n++;
if (window._cardAtlasLoaded) {
console.log("🎮 [renderCards] 卡牌图集加载完成，开始渲染");
o._doRenderCards(e);
} else if (n < 50) setTimeout(t, 100); else {
console.error("🎮 [renderCards] 等待卡牌图集超时，强制重新加载");
cc.resources.load("UI/card/card", cc.SpriteAtlas, function(n, t) {
if (n) console.error("🎮 [renderCards] 强制加载卡牌图集失败:", n); else {
window._cardAtlasLoaded = !0;
window._cardAtlas = t;
console.log("🎮 [renderCards] 强制加载卡牌图集成功");
o._doRenderCards(e);
}
});
}
})();
},
_doRenderCards: function(e) {
if (!this.cards_node) {
console.warn("🎮 [renderCards] cards_node 未定义，尝试重新查找或创建");
var o = this.node.parent;
if (o) {
for (var n = 0; n < o.children.length; n++) {
var t = o.children[n];
if ("cards_node" === t.name || "cards" === t.name || "handCards" === t.name) {
this.cards_node = t;
console.log("🎮 [renderCards] 找到 cards_node:", t.name);
break;
}
}
if (!this.cards_node) {
var a = new cc.Node("cards_node");
a.parent = o;
a.setPosition(0, 0);
a.setAnchorPoint(.5, .5);
a.setContentSize(cc.size(800, 200));
this.cards_node = a;
console.log("🎮 [renderCards] 创建新的 cards_node");
}
}
if (!this.cards_node) {
console.error("🎮 [renderCards] 无法创建 cards_node，放弃渲染");
return;
}
}
var i = JSON.stringify(e);
if (this._lastRenderHash !== i) {
this._lastRenderHash = i;
console.log("🎮 [renderCards] 开始渲染 " + e.length + " 张牌");
var r = this._sortCards(e);
this.clearAllCards();
this._createBottomCards();
this.playingUI_node && (this.playingUI_node.active = !1);
this._dealCardsWithAnimation(r);
} else console.log("🎮 [renderCards] 牌与上次相同，跳过渲染");
},
_dealCardsWithAnimation: function(e) {
var o = this, n = (window.myglobal, r.cardInterval / 1e3), t = r.animDuration, a = this.cards_node;
if (a) {
var i = cc.v2(r.deckPosition.x, r.deckPosition.y);
if (window._cardAtlasLoaded && window._cardAtlas) this._doDealCards(e, a, n, t, i); else {
console.log("🎮 [_dealCardsWithAnimation] 图集未加载，先加载图集...");
cc.resources.load("UI/card/card", cc.SpriteAtlas, function(r, c) {
if (r) console.error("🎮 [_dealCardsWithAnimation] 加载图集失败:", r); else {
window._cardAtlasLoaded = !0;
window._cardAtlas = c;
console.log("🎮 [_dealCardsWithAnimation] 图集加载完成，开始发牌");
o._doDealCards(e, a, n, t, i);
}
});
}
} else console.error("🎮 [_dealCardsWithAnimation] cards_node 未定义");
},
_doDealCards: function(e, o, n, a, i) {
for (var r = this, l = window.myglobal, s = 0; s < e.length; s++) (function(s) {
r.scheduleOnce(function() {
var n = e[s], d = r._getCardX(s, e.length, 35), h = cc.v2(d, -250), u = cc.instantiate(r.card_prefab);
if (u) {
u.scale = .8;
u.parent = o;
u.setPosition(i);
u.active = !0;
u.zIndex = s;
var p = u.getComponent("card");
p && p.showCards(n, l.playerData.accountID);
cc.tween(u).to(a, {
position: h
}, {
easing: "sineOut"
}).call(function() {}).start();
t && c("sound/fapai1");
}
}, s * n);
})(s);
var d = e.length * n + a;
this.scheduleOnce(function() {
r._onDealCardsComplete(e);
}, d);
},
_onDealCardsComplete: function() {
this.cardsReady = !0;
this.fapai_end = !0;
this.node.parent && this.node.parent.emit("pushcard_other_event");
this._checkAndShowRobUI();
},
getCardValue: function(e) {
var o = e.rank;
return 3 === o ? 1 : 4 === o ? 2 : 5 === o ? 3 : 6 === o ? 4 : 7 === o ? 5 : 8 === o ? 6 : 9 === o ? 7 : 10 === o ? 8 : 11 === o ? 9 : 12 === o ? 10 : 13 === o ? 11 : 14 === o ? 12 : 15 === o ? 13 : 16 === o ? 14 : 17 === o ? 15 : 0;
},
_sortCards: function(e) {
var o = this, n = e.slice();
n.sort(function(e, n) {
var t = o.getCardValue(e), a = o.getCardValue(n);
return t !== a ? a - t : e.suit - n.suit;
});
return n;
},
clearAllCards: function() {
if (this.node && this.node.isValid) {
this.cards_node ? this.cards_node.removeAllChildren() : console.warn("🎮 [clearAllCards] cards_node 未定义");
this.choose_card_data = [];
} else console.warn("🎮 [clearAllCards] 节点已销毁或无效，跳过");
},
_getCardX: function(e, o, n) {
return -(o - 1) * n / 2 + e * n;
},
_createBottomCards: function() {
if (this.bottom_card) for (var e = 0; e < this.bottom_card.length; e++) this.bottom_card[e] && this.bottom_card[e].destroy();
this.bottom_card = [];
if (this.bottom_card_pos_node && this.card_prefab) {
var o = this.bottom_card_pos_node.y, n = this.bottom_card_pos_node.x - 25;
for (e = 0; e < 3; e++) {
var t = cc.instantiate(this.card_prefab);
if (t) {
t.scale = .4;
t.setPosition(n + 25 * e, o);
t.parent = this.node.parent;
t.active = !0;
this.bottom_card.push(t);
}
}
}
},
_checkAndShowRobUI: function() {
var e = window.myglobal;
if (e) {
console.log("🃏 [_checkAndShowRobUI] 检查是否需要显示抢地主UI, cardsReady:", this.cardsReady, "_pendingBidUI:", this._pendingBidUI, "_biddingPhase:", this._biddingPhase, "_gamePhase:", this._gamePhase);
if ("playing" !== this._gamePhase) {
var o = e.socket.getPlayerInfo().id || e.playerData.serverPlayerId || e.playerData.accountID;
if (this._pendingBidUI && this.cardsReady && this.robUI && !this.robUI.active) {
console.log("🃏 [_checkAndShowRobUI] 发牌完成，显示待处理的抢地主UI, round:", this._pendingBidRound);
1 === this._pendingBidRound ? this._showBidUI("叫地主", "不叫") : this._showBidUI("抢地主", "不抢");
this._pendingBidUI = !1;
} else {
console.log("🃏 [_checkAndShowRobUI] rob_player_accountid:", this.rob_player_accountid, "myPlayerId:", o);
if (this.rob_player_accountid == o && this.cardsReady && this.robUI && !this.robUI.active) {
console.log("🃏 [_checkAndShowRobUI] 轮到我，显示抢地主按钮, _biddingPhase:", this._biddingPhase);
"bidding" === this._biddingPhase ? this._showBidUI("叫地主", "不叫") : this._showBidUI("抢地主", "不抢");
}
}
} else console.log("🃏 [_checkAndShowRobUI] 当前是出牌阶段，不显示抢地主按钮");
}
},
_processCallLandlordTurn: function(e) {
var o = window.myglobal;
if (o) {
var n = e.player_id, t = e.timeout || 15, a = e.round || 1, i = e.expires_at || 0;
this._stopBidCountdown();
this._gamePhase = "bidding";
this.rob_player_accountid = n;
this._bidTimeout = t;
this._biddingPhase = 1 === a ? "bidding" : "robbing";
this._bidExpiresAt = i;
var r = o.socket.getPlayerInfo().id || o.playerData.serverPlayerId || o.playerData.accountID;
console.log("🃏 [_processCallLandlordTurn] playerId:", n, "myPlayerId:", r, "round:", a, "cardsReady:", this.cardsReady);
if (String(n) === String(r)) if (this.cardsReady) {
console.log("🃏 [_processCallLandlordTurn] 发牌已完成，直接显示抢地主按钮");
1 === a ? this._showBidUI("叫地主", "不叫") : this._showBidUI("抢地主", "不抢");
} else {
console.log("🃏 [_processCallLandlordTurn] 发牌未完成，等待发牌完成后再显示抢地主按钮");
this._pendingBidUI = !0;
this._pendingBidRound = a;
} else {
this._hideRobUI();
this._pendingBidUI = !1;
this.node && this.node.parent && this.node.parent.emit("call_landlord_turn_event", {
player_id: n,
timeout: t,
round: a,
expires_at: i
});
}
}
},
_showBidUI: function(e, o) {
console.log("🎯 ========== [_showBidUI] 显示抢地主按钮 ==========");
console.log("🎯 [_showBidUI] confirmText:", e, "cancelText:", o);
console.log("🎯 [_showBidUI] robUI 存在:", !!this.robUI);
if (this.robUI) {
this.playingUI_node && (this.playingUI_node.active = !1);
var n = this.robUI.getChildByName("qiangzhuang"), t = this.robUI.getChildByName("buqiangzhuang");
console.log("🎯 [_showBidUI] confirmBtn 存在:", !!n, "cancelBtn 存在:", !!t);
if (n && (a = n.getChildByName("Label")) && a.getComponent(cc.Label)) {
a.getComponent(cc.Label).string = e;
console.log("🎯 [_showBidUI] 设置确认按钮文字:", e);
}
if (t) {
var a;
if ((a = t.getChildByName("Label")) && a.getComponent(cc.Label)) {
a.getComponent(cc.Label).string = o;
console.log("🎯 [_showBidUI] 设置取消按钮文字:", o);
}
}
this.robUI.active = !0;
console.log("🎯 [_showBidUI] robUI.active 已设置为 true");
this._startBidCountdown();
this.node && this.node.parent && this.node.parent.emit("canrob_event", {
player_id: this.rob_player_accountid,
timeout: this._bidTimeout || 15
});
console.log("🎯 [_showBidUI] ========== 抢地主按钮显示完成 ==========");
} else console.error("🎯 [_showBidUI] robUI 为空，无法显示按钮！");
},
_hideRobUI: function() {
this.robUI && (this.robUI.active = !1);
this._stopBidCountdown();
},
_startBidCountdown: function(e) {
this._stopBidCountdown();
var o = e || this._bidTimeout || 15, n = this._bidExpiresAt || 0, t = o;
if (n > 0) {
var a = Date.now();
t = Math.max(0, Math.floor((n - a) / 1e3));
}
this._bidTimeLeft = t;
this._isBidCountdownTicking = !0;
this._isBidWarning = !1;
this._updateBidCountdownUI();
this.schedule(this._bidCountdownTick, 1);
},
_bidCountdownTick: function() {
if (this._isBidCountdownTicking) {
this._bidTimeLeft--;
this._updateBidCountdownUI();
5 === this._bidTimeLeft && this._enterBidWarningState();
this._bidTimeLeft <= 3 && this._bidTimeLeft > 0 && this._playTickSound();
this._bidTimeLeft <= 0 && this._onBidCountdownEnd();
}
},
_updateBidCountdownUI: function() {
var e = this._bidTimeLeft;
this.bidCountdownLabel && (this.bidCountdownLabel.string = String(e));
if (this.robUI) {
var o = this.robUI.getChildByName("clock");
if (o) for (var n = o.children, t = 0; t < n.length; t++) {
var a = n[t], i = a.getComponent(cc.Label);
if (i) {
i.string = String(e);
a.active = !0;
a.opacity = 255;
i.fontSize = 32;
i.lineHeight = 40;
a.setContentSize(50, 50);
a.color = new cc.Color(255, 255, 255);
a.zIndex = 100;
break;
}
}
}
this.node && this.node.parent && this.node.parent.emit("update_countdown_event", {
type: "bid",
remaining: e
});
},
_enterBidWarningState: function() {
if (!this._isBidWarning) {
this._isBidWarning = !0;
var e = this._getBidCountdownLabelNode();
if (e) {
e.color = cc.Color.RED;
e.stopAllActions();
cc.tween(e).repeatForever(cc.tween().to(.3, {
scale: 1.2
}).to(.3, {
scale: 1
})).start();
}
}
},
_getBidCountdownLabelNode: function() {
if (this.bidCountdownLabel && this.bidCountdownLabel.node) return this.bidCountdownLabel.node;
if (this.robUI) {
var e = this.robUI.getChildByName("clock");
if (e) for (var o = e.children, n = 0; n < o.length; n++) if (o[n].getComponent(cc.Label)) return o[n];
for (var t = [ "clock_ Label", "clock_Label", "time_label", "countdown" ], a = 0; a < t.length; a++) {
var i = this.robUI.getChildByName(t[a]);
if (i && i.getComponent(cc.Label)) return i;
}
}
return null;
},
_onBidCountdownEnd: function() {
this._isBidCountdownTicking = !1;
this.unschedule(this._bidCountdownTick);
var e = this._getBidCountdownLabelNode();
if (e) {
e.stopAllActions();
e.scale = 1;
e.color = cc.Color.WHITE;
}
},
_stopBidCountdown: function() {
this._isBidCountdownTicking = !1;
this.unschedule(this._bidCountdownTick);
var e = this._getBidCountdownLabelNode();
if (e) {
e.stopAllActions();
e.scale = 1;
e.color = cc.Color.WHITE;
}
this._isBidWarning = !1;
},
_startPlayCountdown: function(e) {
this._stopPlayCountdown();
var o = e || this._playTimeout || 15;
this._playTimeLeft = o;
this._isPlayCountdownTicking = !0;
this._isPlayWarning = !1;
this._updatePlayCountdownUI();
this.schedule(this._playCountdownTick, 1);
},
_playCountdownTick: function() {
if (this._isPlayCountdownTicking) {
this._playTimeLeft--;
this._updatePlayCountdownUI();
5 === this._playTimeLeft && this._enterPlayWarningState();
this._playTimeLeft <= 3 && this._playTimeLeft > 0 && this._playTickSound();
this._playTimeLeft <= 0 && this._onPlayCountdownEnd();
}
},
_updatePlayCountdownUI: function() {
var e = this._playTimeLeft;
this.playCountdownLabel && (this.playCountdownLabel.string = String(e));
if (this.node && this.node.parent) {
var o = new cc.Event.EventCustom("update_countdown_event", !0);
o.setUserData({
type: "play",
remaining: e
});
this.node.parent.dispatchEvent(o);
}
if (this.playingUI_node) {
var n = this.playingUI_node.getChildByName("clock");
if (n) {
n.active = !0;
n.opacity = 255;
var t = n.getChildByName("playing_clocl_label");
if (t) {
if (r = t.getComponent(cc.Label)) {
r.string = String(e);
t.active = !0;
t.opacity = 255;
}
} else for (var a = n.children, i = 0; i < a.length; i++) {
var r, c = a[i];
if (r = c.getComponent(cc.Label)) {
r.string = String(e);
c.active = !0;
c.opacity = 255;
break;
}
}
}
}
},
_updateClockTimeLabel: function(e) {
var o = this.node.parent;
if (o) for (var n = o.children, t = 0; t < n.length; t++) {
var a = n[t].getComponent("player_node");
if (a && 0 === a.seat_index) {
a.time_label && (a.time_label.string = String(e));
if (a.clockimage) {
var i = a.clockimage;
i.active = !0;
i.opacity = 255;
for (var r = i.children, c = 0; c < r.length; c++) {
var l = r[c], s = l.getComponent(cc.Label);
if (s) {
s.string = String(e);
l.active = !0;
l.opacity = 255;
s.fontSize = 32;
s.lineHeight = 40;
l.setContentSize(50, 50);
l.color = new cc.Color(255, 255, 255);
l.zIndex = 100;
break;
}
}
var d = i.getComponent(cc.Label);
d && (d.string = String(e));
}
break;
}
}
},
_enterPlayWarningState: function() {
if (!this._isPlayWarning) {
this._isPlayWarning = !0;
var e = this._getPlayCountdownLabelNode();
if (e) {
e.color = cc.Color.RED;
e.stopAllActions();
cc.tween(e).repeatForever(cc.tween().to(.3, {
scale: 1.2
}).to(.3, {
scale: 1
})).start();
}
}
},
_getPlayCountdownLabelNode: function() {
if (this.playCountdownLabel && this.playCountdownLabel.node) return this.playCountdownLabel.node;
if (this.playingUI_node) {
var e = this.playingUI_node.getChildByName("clock");
if (e) {
var o = e.getChildByName("playing_clocl_label");
if (o) return o;
for (var n = e.children, t = 0; t < n.length; t++) if (n[t].getComponent(cc.Label)) return n[t];
}
}
return null;
},
_onPlayCountdownEnd: function() {
this._isPlayCountdownTicking = !1;
this.unschedule(this._playCountdownTick);
var e = this._getPlayCountdownLabelNode();
if (e) {
e.stopAllActions();
e.scale = 1;
e.color = cc.Color.WHITE;
}
},
_stopPlayCountdown: function() {
this._isPlayCountdownTicking = !1;
this.unschedule(this._playCountdownTick);
var e = this._getPlayCountdownLabelNode();
if (e) {
e.stopAllActions();
e.scale = 1;
e.color = cc.Color.WHITE;
}
this._isPlayWarning = !1;
},
_playTickSound: function() {
t && (this.tickAudio ? cc.audioEngine.playEffect(this.tickAudio, !1) : c("sound/fapai1"));
},
_playPlayTickSound: function() {
t && (this.tickAudio ? cc.audioEngine.playEffect(this.tickAudio, !1) : c("sound/fapai1"));
},
_playRobSound: function(e) {
if (t) {
var o = e.action, n = e.gender || "male", a = e.order || 1, i = e.round || 1, r = (e.player_id || "") + "_" + o + "_" + i + "_" + a;
if (this._lastRobSoundKey !== r) {
this._lastRobSoundKey = r;
if ("pass" !== o) if ("female" === n) if (1 === i && 1 === a) this._playSoundEffect("m_nv_qiangdizhu_01"); else {
var c = [ "m_nv_qiangdizhu_02", "m_nv_qiangdizhu_woqiang_01" ];
this._playRandomSound(c);
} else if (1 === i && 1 === a) this._playSoundEffect("m_nan_qiangdizhu"); else {
c = [ "m_nan_qiangdizhu", "m_nan_qiangdizhu_woqiang" ];
this._playRandomSound(c);
} else {
var l = "female" === n ? "m_nv_buqiang" : "m_nan_buqiang";
this._playSoundEffect(l);
}
}
}
},
_playSoundEffect: function(e, o, n) {
var t = this;
cc.resources.load("sound/" + e, cc.AudioClip, function(a, i) {
if (a) {
console.warn("🔊 [_playSoundEffect] 加载音效失败: " + e, a.message || a);
o ? cc.resources.load("sound/" + o, cc.AudioClip, function(a, i) {
if (a) {
console.warn("🔊 [_playSoundEffect] fallback 也失败: " + o, a.message || a);
n && "m_cp_dani" !== o && "m_cp_dani" !== e && t._playSoundEffect("m_cp_dani", null, !1);
} else cc.audioEngine.playEffect(i, !1);
}) : n && "m_cp_dani" !== e && t._playSoundEffect("m_cp_dani", null, !1);
} else cc.audioEngine.playEffect(i, !1);
});
},
_playRandomSound: function(e) {
if (e && 0 !== e.length) {
var o = Math.floor(Math.random() * e.length);
this._playSoundEffect(e[o]);
}
},
onButtonClick: function(e, o) {
var n = window.myglobal;
switch (o) {
case "btn_qiandz":
if ("bidding" === this._biddingPhase) {
this._hideRobUI();
n.socket.requestBid(!0);
} else {
this._hideRobUI();
n.socket.requestRobState(a.qian);
}
break;

case "btn_buqiandz":
if ("bidding" === this._biddingPhase) {
this._hideRobUI();
n.socket.requestBid(!1);
} else {
this._hideRobUI();
n.socket.requestRobState(a.buqiang);
}
break;

case "nopushcard":
this._stopPlayCountdown();
n.socket.request_buchu_card([], null);
this.playingUI_node.active = !1;
break;

case "tipcard":
this._onHintButtonClick();
break;

case "pushcard":
if (0 === this.choose_card_data.length) {
this.tipsLabel.string = "请选择牌!";
var t = this;
setTimeout(function() {
t.tipsLabel.string = "";
}, 2e3);
return;
}
for (var i = [], r = 0; r < this.choose_card_data.length; r++) {
var c = this.choose_card_data[r], l = c.card_data || c, s = this._getCardDisplayName(l);
i.push(s);
}
var d = this.choose_card_data.map(function(e) {
return e.card_data || e;
}), h = {}, u = !1;
for (r = 0; r < d.length; r++) {
var p = d[r].suit + "_" + d[r].rank;
if (h[p]) {
u = !0;
console.error("🃏 [pushcard] 检测到重复的牌:", d[r]);
break;
}
h[p] = !0;
}
if (u) {
this.tipsLabel.string = "选牌异常，请重新选牌";
t = this;
this._resetCardFlags();
this.choose_card_data = [];
setTimeout(function() {
t.tipsLabel.string = "";
}, 2e3);
return;
}
var g = this._validateHandType(d);
if (!g.valid) {
this.tipsLabel.string = g.message;
t = this;
setTimeout(function() {
t.tipsLabel.string = "";
}, 2e3);
return;
}
t = this;
this._stopPlayCountdown();
n.socket.request_chu_card(this.choose_card_data, function(e, o) {
if (e) {
var n = o && o.msg || "出牌失败", a = g.type || "未知牌型", r = t.choose_card_data.length, c = t._lastPlayedHandType || "未知", l = t._lastPlayedCards ? t._lastPlayedCards.length : 0, s = "";
if (t._lastPlayedCards && t._lastPlayedCards.length > 0) {
for (var d = [], h = 0; h < t._lastPlayedCards.length; h++) d.push(t._getCardDisplayName(t._lastPlayedCards[h]));
s = d.join(",");
}
var u = n;
if (n.indexOf("大不过") >= 0 || n.indexOf("打不过") >= 0) {
var p = i.join(",");
u = r !== l && l > 0 ? "牌数不匹配！上家出" + c + "，你选了" + p : a !== c && "炸弹" !== c && "王炸" !== c ? "牌型不匹配！上家出" + c + "，你选了" + p : s ? "打不过！上家出" + s + "，你选了" + p : "牌太小！你选了" + p + "打不过上家";
}
t.tipsLabel.string = u;
setTimeout(function() {
t.tipsLabel.string = "";
}, 3e3);
t._resetCardFlags();
t.choose_card_data = [];
} else {
t.playingUI_node.active = !1;
t.choose_card_data = [];
}
});
}
},
_resetCardFlags: function() {
var e = this.cards_node;
if (!e) {
console.warn("🎮 [_resetCardFlags] cards_node 未定义，尝试查找手牌容器");
var o = this.node.parent;
if (o) for (var n = 0; n < o.children.length; n++) {
var t = o.children[n];
if ("cards_node" === t.name || "cards" === t.name) {
e = t;
this.cards_node = t;
break;
}
}
}
if (e) {
var a = e.children;
for (n = 0; n < a.length; n++) a[n].emit("reset_card_flag");
} else console.error("🎮 [_resetCardFlags] 找不到手牌容器");
this._updateSelectedCountDisplay();
},
_updateSelectedCountDisplay: function() {
if (0 !== this.choose_card_data.length) {
var e = this.choose_card_data.map(function(e) {
return e.card_data || e;
}), o = this._validateHandType(e);
o.valid ? o.type : o.message;
}
},
pushThreeCard: function() {},
_removeCardsFromHand: function(e) {
if (e && 0 !== e.length) {
for (var o = 0; o < e.length; o++) for (var n = e[o], t = this.handCards.length - 1; t >= 0; t--) if (this.handCards[t].rank === n.rank && this.handCards[t].suit === n.suit) {
this.handCards.splice(t, 1);
break;
}
this.choose_card_data = [];
this._updateHandCardsSilent(this.handCards);
}
},
_updateHandCardsSilent: function(e) {
if (e) {
var o = window.myglobal;
if (o) {
var n = this._sortCards(e), t = this.cards_node;
if (t) {
for (var a = t.children, i = a.length - 1; i >= 0; i--) {
var r = a[i];
r.off(cc.Node.EventType.TOUCH_START);
r.destroy();
}
t.removeAllChildren();
this.choose_card_data = [];
for (i = 0; i < n.length; i++) {
var c = n[i], l = this._getCardX(i, n.length, 35), s = cc.instantiate(this.card_prefab);
if (s) {
s.scale = .8;
s.parent = t;
s.setPosition(l, -250);
s.active = !0;
s.zIndex = i;
var d = s.getComponent("card");
d && d.showCards(c, o.playerData.accountID);
}
}
this._lastRenderHash = JSON.stringify(e);
} else console.error("🎮 [_updateHandCardsSilent] cards_node 未定义");
}
}
},
destoryCard: function(e, o) {
if (0 !== o.length) {
for (var n = 0; n < o.length; n++) for (var t = this.handCards.length - 1; t >= 0; t--) if (this.handCards[t].rank === o[n].card_data.rank && this.handCards[t].suit === o[n].card_data.suit) {
this.handCards.splice(t, 1);
break;
}
this.renderCards(this.handCards);
if (this.cards_node && this.cards_node.children.length > 0) {
var a = this._getOutCardNode(e);
if (a) {
var i = [], r = this.cards_node.children;
for (n = 0; n < r.length; n++) {
var c = r[n].getComponent("card");
c && c.flag && i.push(r[n]);
}
this.showOutCards(a, i);
}
}
}
},
_getOutCardNode: function(e) {
if (!this.node || !this.node.isValid || !this.node.parent) {
console.warn("🃏 [_getOutCardNode] node 或 node.parent 未定义或已销毁");
return null;
}
var o = this.node.parent.getComponent("gameScene");
return o ? o.getUserOutCardPosByAccount(e) : null;
},
_onHintButtonClick: function() {
this._resetCardFlags();
this.choose_card_data = [];
var e = window.myglobal;
e && e.socket && e.socket.sendHintRequest();
},
_onHintResult: function(e) {
if (e && e.cards && 0 !== e.cards.length) this._selectCards(e.cards); else {
var o = this;
o._stopPlayCountdown();
var n = window.myglobal;
n && n.socket && n.socket.request_buchu_card([], null);
o.playingUI_node && (o.playingUI_node.active = !1);
setTimeout(function() {
o.tipsLabel.string = "";
}, 1500);
}
},
_onTrusteeStateNotify: function(e) {
var o = window.myglobal;
if (o) {
var n = o.socket.getPlayerInfo().id || o.playerData.serverPlayerId || o.playerData.accountID;
if (String(e.player_id) === String(n)) {
this._isLocalTrustee = e.is_trustee;
console.log("🎮 [托管] 本地托管状态更新:", e.is_trustee, "原因:", e.reason);
}
this.node && this.node.parent && this.node.parent.emit("trustee_state_update", e);
}
},
_setupUserActivityListener: function() {
var e = this;
cc.systemEvent.on(cc.SystemEvent.EventType.MOUSE_MOVE, function() {
e._onUserActivity("mouse_move");
});
cc.systemEvent.on(cc.SystemEvent.EventType.MOUSE_DOWN, function() {
e._onUserActivity("mouse_down");
});
cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_START, function() {
e._onUserActivity("touch_start");
});
cc.systemEvent.on(cc.SystemEvent.EventType.TOUCH_MOVE, function() {
e._onUserActivity("touch_move");
});
console.log("🎮 [用户活动] 已注册全局活动监听器");
},
_onUserActivity: function(e) {
if (this._isLocalTrustee) {
var o = Date.now();
if (!(o - this._lastActivityTime < this._activityThrottleMs)) {
this._lastActivityTime = o;
console.log("🎮 [用户活动] 检测到用户活动:", e, "发送取消托管请求");
this._sendCancelTrustee();
}
}
},
_sendCancelTrustee: function() {
var e = window.myglobal;
if (e && e.socket) {
e.socket.cancelTrustee ? e.socket.cancelTrustee() : e.socket.send ? e.socket.send(JSON.stringify({
type: "cancel_trustee",
payload: {}
})) : console.warn("🎮 [取消托管] 无法发送取消托管请求");
this._isLocalTrustee = !1;
} else console.warn("🎮 [取消托管] socket 未初始化");
},
_findPlayableCards: function() {
if (!this.handCards || 0 === this.handCards.length) return null;
for (var e = {}, o = 0; o < this.handCards.length; o++) {
var n = this.handCards[o].rank;
e[n] || (e[n] = []);
e[n].push(this.handCards[o]);
}
if (this._mustPlay || !this._lastPlayedCards || 0 === this._lastPlayedCards.length) return this._findSmallestCards(e);
if (!this._canBeat) return null;
var t = this._lastPlayedHandType || "", a = this._getLastPlayedMainRank(), i = this._lastPlayedCards.length;
switch (t.toLowerCase()) {
case "single":
case "solo":
case "单张":
return this._findBeatingSingle(e, a);

case "pair":
case "double":
case "对子":
return this._findBeatingPair(e, a);

case "triple":
case "three":
case "三张":
return this._findBeatingTriple(e, a, 0);

case "triplewithsingle":
case "sandaiyi":
case "三带一":
return this._findBeatingTriple(e, a, 1);

case "triplewithpair":
case "sandaidui":
case "三带二":
return this._findBeatingTriple(e, a, 2);

case "bomb":
case "zhadan":
case "炸弹":
return this._findBeatingBomb(e, a);

default:
return this._findBeatingByCount(e, i, a);
}
},
_getLastPlayedMainRank: function() {
if (!this._lastPlayedCards || 0 === this._lastPlayedCards.length) return 0;
for (var e = {}, o = 0; o < this._lastPlayedCards.length; o++) e[a = this._lastPlayedCards[o].rank] = (e[a] || 0) + 1;
var n = 0, t = 0;
for (var a in e) if (e[a] > n) {
n = e[a];
t = parseInt(a);
}
return t;
},
_findSmallestCards: function(e) {
for (var o = Object.keys(e).map(function(e) {
return parseInt(e);
}).sort(function(e, o) {
return e - o;
}), n = 0; n < o.length; n++) if (1 === e[t = o[n]].length) return [ e[t][0] ];
for (n = 0; n < o.length; n++) if (2 === e[t = o[n]].length) return e[t];
for (n = 0; n < o.length; n++) if (3 === e[t = o[n]].length) return e[t];
for (n = 0; n < o.length; n++) {
var t;
if (4 === e[t = o[n]].length) return e[t];
}
return o.length > 0 ? [ e[o[0]][0] ] : null;
},
_findBeatingSingle: function(e, o) {
for (var n = Object.keys(e).map(function(e) {
return parseInt(e);
}).sort(function(e, o) {
return e - o;
}), t = 0; t < n.length; t++) {
var a = n[t];
if (a > o) return [ e[a][0] ];
}
return this._findSmallestBomb(e);
},
_findBeatingPair: function(e, o) {
for (var n = Object.keys(e).map(function(e) {
return parseInt(e);
}).sort(function(e, o) {
return e - o;
}), t = 0; t < n.length; t++) {
var a = n[t];
if (a > o && e[a].length >= 2) return [ e[a][0], e[a][1] ];
}
return this._findSmallestBomb(e);
},
_findBeatingTriple: function(e, o, n) {
for (var t = Object.keys(e).map(function(e) {
return parseInt(e);
}).sort(function(e, o) {
return e - o;
}), a = 0; a < t.length; a++) if ((r = t[a]) > o && e[r].length >= 3) {
var i = [ e[r][0], e[r][1], e[r][2] ];
if (!(n > 0)) return i;
if (c = this._findKickerCards(e, r, n)) return i.concat(c);
}
for (a = 0; a < t.length; a++) {
var r;
if ((r = t[a]) > o && 4 === e[r].length) {
var c;
i = [ e[r][0], e[r][1], e[r][2] ];
if (!(n > 0)) return i;
if (c = this._findKickerCards(e, r, n)) return i.concat(c);
}
}
return this._findSmallestBomb(e);
},
_findKickerCards: function(e, o, n) {
for (var t = Object.keys(e).map(function(e) {
return parseInt(e);
}).sort(function(e, o) {
return e - o;
}), a = [], i = 0; i < t.length && a.length < n; i++) {
var r = t[i];
if (r !== o) for (var c = Math.min(e[r].length, n - a.length), l = 0; l < c; l++) a.push(e[r][l]);
}
return a.length === n ? a : null;
},
_findBeatingBomb: function(e, o) {
for (var n = Object.keys(e).map(function(e) {
return parseInt(e);
}).sort(function(e, o) {
return e - o;
}), t = 0; t < n.length; t++) {
var a = n[t];
if (a > o && 4 === e[a].length) return e[a];
}
return this._findRocket(e);
},
_findSmallestBomb: function(e) {
for (var o = Object.keys(e).map(function(e) {
return parseInt(e);
}).sort(function(e, o) {
return e - o;
}), n = 0; n < o.length; n++) {
var t = o[n];
if (4 === e[t].length) return e[t];
}
return this._findRocket(e);
},
_findRocket: function(e) {
var o = [];
e[16] && e[16].length > 0 && o.push(e[16][0]);
e[17] && e[17].length > 0 && o.push(e[17][0]);
return 2 === o.length ? o : null;
},
_findBeatingByCount: function(e, o, n) {
return 1 === o ? this._findBeatingSingle(e, n) : 2 === o ? this._findBeatingPair(e, n) : 3 === o ? this._findBeatingTriple(e, n, 0) : 4 === o ? this._findBeatingBomb(e, n) : null;
},
_selectCards: function(e) {
if (e && 0 !== e.length) {
var o = this.cards_node;
if (!o) {
console.warn("🎮 [_selectCards] cards_node 未定义，尝试查找手牌容器");
var n = this.node.parent;
if (n) for (var t = 0; t < n.children.length; t++) {
var a = n.children[t];
if ("cards_node" === a.name || "cards" === a.name) {
o = a;
this.cards_node = a;
break;
}
}
}
if (o) {
var i = o.children, r = 0, c = {};
for (t = 0; t < i.length; t++) {
var l = i[t], s = l.getComponent("card");
if (s && s.card_data) for (var d = 0; d < e.length; d++) {
var h = e[d].suit + "_" + e[d].rank;
if (!c[h] && s.card_data.rank === e[d].rank && s.card_data.suit === e[d].suit) {
if (!s.flag) {
s.flag = !0;
l.y += 20;
this.choose_card_data.push({
cardid: s.card_id,
card_data: s.card_data
});
r++;
c[h] = !0;
}
break;
}
}
}
if (0 === r) {
this.tipsLabel.string = "提示失败，请手动选牌";
var u = this;
setTimeout(function() {
u.tipsLabel.string = "";
}, 2e3);
}
} else console.error("🎮 [_selectCards] 找不到手牌容器");
}
},
clearOutZone: function(e) {
var o = this._getOutCardNode(e);
o && o.removeAllChildren(!0);
},
showOutCards: function(e, o) {
if (e && o && 0 !== o.length) {
e.removeAllChildren(!0);
for (var n = o.length, t = 0; t < n; t++) {
var a = o[t];
e.addChild(a, t);
a.setScale(.5, .5);
var i = this._getCardX(t, n, 25);
a.setPosition(i, 0);
}
}
},
restoreGameState: function(e) {
var o = e.game_state;
if (o) {
if ("bidding" === o.phase) {
this._gamePhase = "bidding";
this._biddingPhase = "bidding";
} else if ("playing" === o.phase) {
this._gamePhase = "playing";
this._biddingPhase = "idle";
}
if (o.players) {
for (var n = 0; n < o.players.length; n++) {
var t = o.players[n];
t.is_landlord && window.myglobal.playerData && (window.myglobal.playerData.master_accountid = t.id);
}
this.node && this.node.parent && this.node.parent.emit("players_restored_event", {
players: o.players
});
}
if (o.hand) {
this._lastRenderHash = "";
this.handCards = o.hand;
this.cardsReady = !0;
this.fapai_end = !0;
this._updateHandCardsSilent(this.handCards);
}
if (o.bottom_cards && o.bottom_cards.length > 0) {
this.bottomCards = o.bottom_cards;
for (n = 0; n < this.bottom_card.length && n < this.bottomCards.length; n++) if (this.bottom_card[n]) {
var a = this.bottom_card[n].getComponent("card");
a && a.showCards(this.bottomCards[n]);
}
}
if (o.last_played && o.last_played.length > 0) {
this._lastPlayedCards = o.last_played;
this._lastPlayedHandType = o.last_played.hand_type || "";
if (o.last_player_id) {
var i = this.node.parent.getComponent("gameScene");
if (i) {
var r = i.getUserOutCardPosByAccount(o.last_player_id);
if (r && this.card_prefab) {
r.removeAllChildren();
var c = [];
for (n = 0; n < o.last_played.length; n++) {
var l = cc.instantiate(this.card_prefab);
if (l) {
var s = l.getComponent("card");
s && s.showCards(o.last_played[n], window.myglobal.playerData.accountID);
c.push(l);
}
}
this.showOutCards(r, c);
}
}
}
}
if ("playing" === o.phase && o.current_turn) {
var d = window.myglobal.socket.getPlayerInfo().id || window.myglobal.playerData.accountID;
this._hideRobUI();
if (String(o.current_turn) === String(d)) {
this.playingUI_node.active = !0;
this._mustPlay = o.must_play || !1;
this._canBeat = o.can_beat || !1;
} else this.playingUI_node && (this.playingUI_node.active = !1);
}
o.phase;
}
},
_showBottomCardsToAll: function(e) {
if (this.node && this.node.isValid) {
if (e && 0 !== e.length) if (this.bottom_card && Array.isArray(this.bottom_card)) for (var o = 0; o < e.length && o < this.bottom_card.length; o++) {
var n = this.bottom_card[o];
if (n) {
var t = n.getComponent("card");
t && t.showCards(e[o]);
}
} else console.warn("🃏 [_showBottomCardsToAll] bottom_card 未初始化");
} else console.warn("🃏 [_showBottomCardsToAll] 节点已销毁或无效，跳过");
},
_updateLandlordHandCards: function(e) {
if (this.node && this.node.isValid) {
if (e && 0 !== e.length) {
var o = window.myglobal;
if (o) {
var n = this._sortCards(e), t = this.cards_node;
if (t) {
t.removeAllChildren();
for (var a = 0; a < n.length; a++) {
var i = n[a], r = this._getCardX(a, n.length, 35), c = cc.instantiate(this.card_prefab);
if (c) {
c.scale = .8;
c.parent = t;
c.setPosition(r, -250);
c.active = !0;
c.zIndex = a;
var l = c.getComponent("card");
l && l.showCards(i, o.playerData.accountID);
}
}
this._lastRenderHash = JSON.stringify(e);
} else console.error("🃏 [_updateLandlordHandCards] cards_node 未定义");
}
}
} else console.warn("🃏 [_updateLandlordHandCards] 节点已销毁或无效，跳过");
},
_playCardSound: function(e) {
if (t) {
var o = e.hand_type || "", n = e.gender || "male", a = void 0 === e.is_new_round || e.is_new_round, i = void 0 !== e.can_beat && e.can_beat, r = this._extractMainRank(e), c = (o || "").toLowerCase();
if ("bomb" === c || "zhadan" === c || "炸弹" === c || "rocket" === c || "wangzha" === c || "王炸" === c) {
var l = this._getCardTypeSound(o, r, n);
l && this._playSoundEffect(l);
} else {
var s = this._getCardTypeSound(o, r, n), d = ("female" === n ? "m_cp_nv_" : "m_cp_") + "dani", h = this._hasSpecificCardSound(o, r);
a ? s ? this._playSoundEffect(s) : console.warn("🔊 [_playCardSound] ⚠️ 首出但无对应音效文件: " + o + ", rank=" + r) : i ? h && s && Math.random() < .7 ? this._playSoundEffect(s) : this._playSoundEffect(d) : s ? this._playSoundEffect(s) : console.warn("🔊 [_playCardSound] ⚠️ 异常场景：压牌但can_beat=false且无音效");
}
}
},
_hasSpecificCardSound: function(e, o) {
var n = (e || "").toLowerCase(), t = this._rankToSoundIndex(o);
if ("single" === n || "solo" === n || -1 !== n.indexOf("单张")) return t >= 1 && t <= 15;
if ("pair" === n || "double" === n || -1 !== n.indexOf("对子")) return t >= 1 && t <= 13;
if ("triple" === n || "three" === n || "trio" === n || -1 !== n.indexOf("三张")) return t >= 1 && t <= 13;
for (var a = [ "liandui", "straight", "plane", "feiji", "sandaiyi", "sandaidui", "sidaier", "sidailiangdui", "bomb", "zhadan", "rocket", "wangzha", "连对", "顺子", "飞机", "三带一", "三带二", "四带二", "四带两对", "炸弹", "王炸" ], i = 0; i < a.length; i++) if (-1 !== n.indexOf(a[i])) return !0;
return !1;
},
_extractMainRank: function(e) {
if (e.rank && e.rank > 0) return e.rank;
var o = e.cards || [], n = (e.hand_type || "").toLowerCase();
if (0 === o.length) {
console.warn("🔊 [_extractMainRank] cards数组为空，无法提取rank");
return 0;
}
var t = o.slice().sort(function(e, o) {
return (o.rank || 0) - (e.rank || 0);
});
if (-1 !== n.indexOf("single") || -1 !== n.indexOf("单张")) return this._extractCardRank(t[0]);
if (-1 !== n.indexOf("pair") || -1 !== n.indexOf("对子")) return this._extractCardRank(t[0]);
if (-1 !== n.indexOf("triple") || -1 !== n.indexOf("三张") || -1 !== n.indexOf("trio") || -1 !== n.indexOf("three")) return this._extractCardRank(t[0]);
if (-1 !== n.indexOf("sandaiyi") || -1 !== n.indexOf("三带一") || -1 !== n.indexOf("sandaidui") || -1 !== n.indexOf("三带二")) {
for (var a = {}, i = 0; i < o.length; i++) a[l = o[i].rank] = (a[l] || 0) + 1;
var r = 0, c = 0;
for (var l in a) if (a[l] >= 3 && a[l] > r) {
r = a[l];
c = parseInt(l);
}
return c;
}
return this._extractCardRank(t[0]);
},
_extractCardRank: function(e) {
if (!e) {
console.warn("🔊 [_extractCardRank] card为空");
return 0;
}
if (void 0 !== e.rank && e.rank > 0) return Number(e.rank);
if (void 0 !== e.value && e.value > 0) return Number(e.value);
if (void 0 !== e.logic_value && e.logic_value > 0) return Number(e.logic_value);
if (e.card_data && void 0 !== e.card_data.rank) return Number(e.card_data.rank);
console.warn("🔊 [_extractCardRank] 无法提取rank，card:", JSON.stringify(e));
return 0;
},
_rankToSoundIndex: function(e) {
return 14 === e ? 1 : 15 === e ? 2 : e >= 3 && e <= 13 ? e : 16 === e ? 14 : 17 === e ? 15 : 0;
},
_getCardTypeSound: function(e, o, n) {
var t = (e || "").toLowerCase(), a = "female" === n ? "m_cp_nv_" : "m_cp_";
if (!o || 0 === o) {
console.error("🔊 [_getCardTypeSound] 非法rank: " + o + ", handType=" + e);
return null;
}
var i = this._rankToSoundIndex(o);
if ("single" === t || "solo" === t || -1 !== t.indexOf("单张")) {
if (i >= 1 && i <= 15) return a + "danzhang_" + i;
console.warn("🔊 [_getCardTypeSound] 单张音效索引无效: rank=" + o + ", soundIndex=" + i);
return null;
}
if ("pair" === t || "double" === t || -1 !== t.indexOf("对子")) {
if (i >= 1 && i <= 13) return a + "duizi_" + i;
console.warn("🔊 [_getCardTypeSound] 对子音效文件不存在: rank=" + o + ", soundIndex=" + i);
return null;
}
if ("triple" === t || "three" === t || "trio" === t || -1 !== t.indexOf("三张")) {
if (i >= 1 && i <= 13) return a + "sange_" + i;
console.warn("🔊 [_getCardTypeSound] 三张音效文件不存在: rank=" + o + ", soundIndex=" + i);
return null;
}
var r = {
liandui: "liandui",
straight: "shunzi",
plane: "feiji",
feiji: "feiji",
sandaiyi: "sandaiyi",
sandaidui: "sandaidui",
sidaier: "sidaier",
sidailiangdui: "sidailiangdui",
bomb: "zhadan",
zhadan: "zhadan",
rocket: "wangzha",
wangzha: "wangzha",
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
for (var c in r) if (-1 !== t.indexOf(c)) {
var l = r[c];
return "zhadan" === l ? "m_cp_zhadan" : "wangzha" === l ? a + "wangzha" : a + l;
}
console.warn("🔊 [_getCardTypeSound] 未知牌型: " + t);
return null;
},
_playPassSound: function(e) {
if (t) {
var o, n = (o = "female" === (e.gender || "male") ? [ "m_cp_nv_buyao", "m_nv_yaobuqi" ] : [ "m_cp_buyao", "m_cp_yaobuqi" ])[Math.floor(Math.random() * o.length)];
this._playSoundEffect(n);
}
},
_playGameResultSound: function(e) {
if (t) {
var o = e ? "m_yingle" : "m_shule";
this._playSoundEffect(o);
}
},
_showPassEffect: function(e) {
if (this.node && this.node.isValid && this.node.parent) {
var o = this.node.parent.getComponent("gameScene");
if (o) {
var n = o.getUserOutCardPosByAccount(e);
if (n) {
n.removeAllChildren(!0);
var t = new cc.Node("pass_label"), a = t.addComponent(cc.Label);
a.string = "不出";
a.fontSize = 28;
a.lineHeight = 36;
t.color = cc.color(255, 200, 100);
var i = t.addComponent(cc.LabelOutline);
i.color = cc.color(100, 50, 0);
i.width = 2;
t.parent = n;
t.setPosition(0, 0);
this.scheduleOnce(function() {
t && t.isValid && t.destroy();
}, 2);
}
}
} else console.warn("🃏 [_showPassEffect] node 或 node.parent 未定义或已销毁");
},
_getCardDisplayName: function(e) {
if (!e) return "未知牌";
var o = e.suit, n = e.rank;
return 17 === n ? "大王" : 16 === n ? "小王" : ({
0: "黑桃",
1: "红心",
2: "梅花",
3: "方块",
4: ""
}[o] || "") + ({
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
}[n] || String(n));
},
_validateHandType: function(e) {
if (!e || 0 === e.length) return {
valid: !1,
type: "",
message: "请选择要出的牌"
};
for (var o = e.length, n = {}, t = 0; t < e.length; t++) {
n[s = e[t].rank] || (n[s] = 0);
n[s]++;
}
var a = Object.keys(n).map(function(e) {
return parseInt(e);
}).sort(function(e, o) {
return e - o;
}), i = (Object.values(n), []), r = [], c = [], l = [];
for (var s in n) {
var d = n[s];
4 === d ? i.push(parseInt(s)) : 3 === d ? r.push(parseInt(s)) : 2 === d ? c.push(parseInt(s)) : 1 === d && l.push(parseInt(s));
}
if (2 === o && 1 === n[16] && 1 === n[17]) return {
valid: !0,
type: "王炸",
message: ""
};
if (1 === o) return {
valid: !0,
type: "单张",
message: ""
};
if (2 === o && 1 === c.length) return {
valid: !0,
type: "对子",
message: ""
};
if (3 === o && 1 === r.length) return {
valid: !0,
type: "三张",
message: ""
};
if (4 === o && 1 === i.length) return {
valid: !0,
type: "炸弹",
message: ""
};
if (4 === o && 1 === r.length && 1 === l.length) return {
valid: !0,
type: "三带一",
message: ""
};
if (5 === o && 1 === r.length && 1 === c.length) return {
valid: !0,
type: "三带二",
message: ""
};
if (6 === o && 1 === i.length && (2 === l.length || 1 === c.length)) return {
valid: !0,
type: "四带二",
message: ""
};
if (8 === o && 1 === i.length && 2 === c.length) return {
valid: !0,
type: "四带两对",
message: ""
};
if (o >= 5 && l.length === o) {
var h = this._isSequential(a), u = a.every(function(e) {
return e < 15;
});
if (h && u) return {
valid: !0,
type: "顺子",
message: ""
};
}
if (o >= 6 && o % 2 == 0 && c.length === o / 2) {
var p = c.sort(function(e, o) {
return e - o;
});
h = this._isSequential(p), u = p.every(function(e) {
return e < 15;
});
if (h && u) return {
valid: !0,
type: "连对",
message: ""
};
}
if (r.length >= 2) {
var g = r.sort(function(e, o) {
return e - o;
});
h = this._isSequential(g), u = g.every(function(e) {
return e < 15;
});
if (h && u) {
var _ = r.length;
if (o === 3 * _) return {
valid: !0,
type: "飞机",
message: ""
};
if (o === 4 * _ && l.length === _) return {
valid: !0,
type: "飞机带单",
message: ""
};
if (o === 5 * _ && c.length === _) return {
valid: !0,
type: "飞机带对",
message: ""
};
}
}
return {
valid: !1,
type: "",
message: "无效的牌型，请重新选择"
};
},
_isSequential: function(e) {
if (!e || e.length < 2) return !0;
for (var o = 1; o < e.length; o++) if (e[o] - e[o - 1] != 1) return !1;
return !0;
},
_showGameResultPopup: function(e) {
if (this._isCompetition || 2 === e.room_category) this._showCompetitionResultPopup(e); else {
var o = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID, n = !1, t = 0;
if (e.players && e.players.length > 0) for (var a = 0; a < e.players.length; a++) {
var i = e.players[a];
if (String(i.player_id) === String(o)) {
n = i.is_winner;
t = i.win_gold;
break;
}
} else (n = String(e.winner_id) === String(o)) || e.is_landlord || myglobal.playerData.master_accountid === o || (n = !0);
if (myglobal.playerData && 0 !== t) {
var r = (myglobal.playerData.gobal_count || 0) + t;
r < 0 && (r = 0);
myglobal.playerData.gobal_count = r;
}
if (e.players && e.players.length > 0) for (a = 0; a < e.players.length; a++) {
var c = (i = e.players[a]).player_id, l = i.gold_after;
if (l >= 0) this._updatePlayerGoldDisplay(c, l); else if (String(c) === String(o) && 0 !== t) {
var s = myglobal.playerData.gobal_count || 0;
this._updatePlayerGoldDisplay(c, s);
}
}
this._playGameResultSound(n);
var d = this;
this._createGameResultPopup(e, n, t, function(e) {
"continue" === e ? d._continueGame() : "lobby" === e && d._returnToLobby();
});
}
},
_createGameResultPopup: function(e, o, n, t) {
var a = this, i = cc.winSize, r = cc.find("Canvas") || cc.find("UI_ROOT") || this.node.parent;
if (!r) {
console.error("🏆 [_createGameResultPopup] 找不到Canvas节点");
r = this.node;
}
var c = new cc.Node();
c.name = "GameResultMask";
c.addComponent(cc.BlockInputEvents);
var l = c.addComponent(cc.Sprite);
l.spriteFrame = new cc.SpriteFrame();
l.type = cc.Sprite.Type.SIMPLE;
l.sizeMode = cc.Sprite.SizeMode.CUSTOM;
c.width = 2 * i.width;
c.height = 2 * i.height;
c.color = o ? new cc.Color(0, 0, 30) : new cc.Color(30, 0, 0);
c.opacity = 0;
c.x = 0;
c.y = 0;
c.zIndex = 999;
c.parent = r;
cc.tween(c).to(.3, {
opacity: 255
}).start();
var s = new cc.Node();
s.name = "GameResultPopup";
s.x = 0;
s.y = 0;
s.scale = .5;
s.opacity = 0;
s.zIndex = 1e3;
s.parent = r;
var d = Math.min(.7 * i.width, 800), h = Math.min(.75 * i.height, 550);
a._createGradientBackground(d, h, o).parent = s;
a._createGoldenBorder(d, h, o).parent = s;
var u = new cc.Node("EffectLayer");
u.parent = s;
o ? a._createVictoryParticles(u, d, h) : a._createDefeatParticles(u, d, h);
var p = h / 2 - 60, g = a._createResultBanner(o, d);
g.y = p;
g.parent = s;
var _ = d / 2 - 130, f = a._createMultiplierDetailCard(e, o);
f.x = _;
f.y = 20;
f.parent = s;
var m = .55 * d, C = -d / 2 + m / 2 + 50, v = a._createPlayerResultList(e, o, n, m);
v.x = C;
v.y = -20;
v.parent = s;
var w = -h / 2 + 60, y = a._createButtonArea(o, function(e) {
a._closeGameResultPopup(s, c);
t && t(e);
});
y.y = w;
y.parent = s;
cc.tween(s).to(.35, {
scale: 1,
opacity: 255
}, {
easing: "backOut"
}).call(function() {
a._startNumberAnimations(s, e, n);
}).start();
this._gameResultPopup = s;
this._gameResultMask = c;
this._resultEffectLayer = u;
},
_createGradientBackground: function(e, o, n) {
var t = new cc.Node("GradientBg"), a = t.addComponent(cc.Graphics), i = (n ? new cc.Color(40, 30, 80, 255) : new cc.Color(30, 30, 40, 255), 
n ? new cc.Color(20, 15, 50, 255) : new cc.Color(20, 20, 30, 255));
a.fillColor = i;
a.roundRect(-e / 2, -o / 2, e, o, 20);
a.fill();
var r = new cc.Node("InnerGlow"), c = r.addComponent(cc.Sprite);
c.spriteFrame = new cc.SpriteFrame();
c.type = cc.Sprite.Type.SLICED;
r.width = e - 20;
r.height = o - 20;
r.color = n ? new cc.Color(60, 40, 100) : new cc.Color(40, 40, 50);
r.opacity = 100;
r.parent = t;
var l = new cc.Node("Overlay");
l.addComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame();
l.width = e;
l.height = o;
l.color = n ? new cc.Color(80, 50, 120) : new cc.Color(50, 50, 60);
l.opacity = 30;
l.parent = t;
return t;
},
_createGoldenBorder: function(e, o, n) {
var t = new cc.Node("GoldenBorder"), a = t.addComponent(cc.Graphics), i = n ? new cc.Color(255, 200, 50, 255) : new cc.Color(100, 100, 120, 255), r = n ? new cc.Color(255, 180, 0, 150) : new cc.Color(80, 80, 100, 100);
a.strokeColor = r;
a.lineWidth = 8;
a.roundRect(-e / 2 - 4, -o / 2 - 4, e + 8, o + 8, 24);
a.stroke();
a.strokeColor = i;
a.lineWidth = 3;
a.roundRect(-e / 2, -o / 2, e, o, 20);
a.stroke();
for (var c = [ {
x: -e / 2,
y: o / 2,
rot: 0
}, {
x: e / 2,
y: o / 2,
rot: 90
}, {
x: e / 2,
y: -o / 2,
rot: 180
}, {
x: -e / 2,
y: -o / 2,
rot: 270
} ], l = 0; l < c.length; l++) {
var s = c[l], d = new cc.Node("Corner_" + l), h = d.addComponent(cc.Graphics);
h.strokeColor = i;
h.lineWidth = 2;
h.moveTo(0, 0);
h.lineTo(30, 0);
h.lineTo(30, 30);
h.stroke();
d.x = s.x;
d.y = s.y;
d.angle = s.rot;
d.parent = t;
}
return t;
},
_createResultBanner: function(e, o) {
var n = new cc.Node("ResultBanner"), t = new cc.Node("BannerBg"), a = t.addComponent(cc.Graphics), i = .6 * o;
if (e) {
a.fillColor = new cc.Color(200, 150, 30, 200);
a.roundRect(-i / 2, -35, i, 70, 35);
a.fill();
a.strokeColor = new cc.Color(255, 220, 100, 255);
a.lineWidth = 3;
a.roundRect(-i / 2, -35, i, 70, 35);
a.stroke();
} else {
a.fillColor = new cc.Color(80, 40, 50, 200);
a.roundRect(-i / 2, -35, i, 70, 35);
a.fill();
a.strokeColor = new cc.Color(150, 100, 100, 255);
a.lineWidth = 2;
a.roundRect(-i / 2, -35, i, 70, 35);
a.stroke();
}
t.parent = n;
var r = new cc.Node("Title");
r.anchorX = .5;
r.anchorY = .5;
var c = r.addComponent(cc.Label);
c.string = e ? "🏆 胜 利 🏆" : "✖ 失 败 ✖";
c.fontSize = 42;
c.lineHeight = 50;
c.fontFamily = "Arial";
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
r.color = e ? new cc.Color(255, 255, 255) : new cc.Color(200, 180, 180);
var l = r.addComponent(cc.LabelOutline);
l.color = e ? new cc.Color(150, 100, 0) : new cc.Color(80, 40, 40);
l.width = 3;
var s = r.addComponent(cc.LabelShadow);
s.color = e ? new cc.Color(255, 200, 0, 200) : new cc.Color(100, 50, 50, 150);
s.offset = cc.v2(0, 0);
s.blur = 8;
r.parent = n;
e && cc.tween(n).repeatForever(cc.tween().to(1, {
scale: 1.02
}).to(1, {
scale: 1
})).start();
return n;
},
_createMultiplierDetailCard: function(e, o) {
var n = new cc.Node("MultiplierCard"), t = new cc.Node("CardBg"), a = t.addComponent(cc.Graphics);
a.fillColor = o ? new cc.Color(50, 35, 70, 220) : new cc.Color(35, 35, 45, 220);
a.roundRect(-90, -125, 180, 250, 15);
a.fill();
a.strokeColor = o ? new cc.Color(180, 140, 60, 200) : new cc.Color(80, 80, 100, 200);
a.lineWidth = 2;
a.roundRect(-90, -125, 180, 250, 15);
a.stroke();
t.parent = n;
var i = new cc.Node("Title");
i.anchorX = .5;
i.anchorY = .5;
var r = i.addComponent(cc.Label);
r.string = "本局详情";
r.fontSize = 20;
r.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
r.verticalAlign = cc.Label.VerticalAlign.CENTER;
i.color = new cc.Color(200, 200, 200);
i.y = 100;
i.parent = n;
var c = new cc.Node("Line"), l = c.addComponent(cc.Graphics);
l.strokeColor = new cc.Color(100, 100, 100, 150);
l.lineWidth = 1;
l.moveTo(-75, 0);
l.lineTo(75, 0);
l.stroke();
c.y = 75;
c.parent = n;
for (var s = e.multi_detail || {}, d = [ {
label: "底分",
value: e.base_score || 10
}, {
label: "抢地主",
value: s.qiang_count > 0 ? "x" + s.qiang_multi : "-"
}, {
label: "炸弹",
value: s.bomb_count > 0 ? "x" + s.bomb_multi : "-"
}, {
label: "王炸",
value: s.rocket_count > 0 ? "x" + s.rocket_multi : "-"
}, {
label: "春天",
value: s.spring_type > 0 ? "x2" : "-"
} ], h = 0; h < d.length; h++) {
var u = d[h], p = new cc.Node("Item_" + h), g = new cc.Node("Label");
g.anchorX = .5;
g.anchorY = .5;
var _ = g.addComponent(cc.Label);
_.string = u.label;
_.fontSize = 16;
_.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
_.verticalAlign = cc.Label.VerticalAlign.CENTER;
g.color = new cc.Color(180, 180, 180);
g.x = -55;
g.parent = p;
var f = new cc.Node("Value");
f.anchorX = .5;
f.anchorY = .5;
var m = f.addComponent(cc.Label);
m.string = String(u.value);
m.fontSize = 16;
m.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
m.verticalAlign = cc.Label.VerticalAlign.CENTER;
f.color = new cc.Color(255, 220, 150);
f.x = 50;
f.parent = p;
p.y = 50 - 28 * h;
p.parent = n;
}
var C = new cc.Node("TotalMulti"), v = new cc.Node("Bg"), w = v.addComponent(cc.Graphics);
w.fillColor = o ? new cc.Color(80, 50, 20, 200) : new cc.Color(40, 40, 50, 200);
w.roundRect(-80, -120, 160, 50, 10);
w.fill();
v.y = -95;
v.parent = C;
var y = new cc.Node("Label");
y.anchorX = .5;
y.anchorY = .5;
var b = y.addComponent(cc.Label);
b.string = "总倍数";
b.fontSize = 14;
b.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
b.verticalAlign = cc.Label.VerticalAlign.CENTER;
y.color = new cc.Color(180, 180, 180);
y.y = 12;
y.parent = C;
var S = new cc.Node("Value");
S.name = "MultiplierValue";
S.anchorX = .5;
S.anchorY = .5;
var N = S.addComponent(cc.Label);
N.string = "x" + (e.multiple || 1);
N.fontSize = 28;
N.fontFamily = "Arial";
N.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
N.verticalAlign = cc.Label.VerticalAlign.CENTER;
S.color = o ? new cc.Color(255, 200, 50) : new cc.Color(200, 200, 200);
var L = S.addComponent(cc.LabelOutline);
L.color = o ? new cc.Color(150, 100, 0) : new cc.Color(60, 60, 60);
L.width = 2;
S.y = -8;
S.parent = C;
C.y = -95;
C.parent = n;
return n;
},
_createPlayerResultList: function(e, o, n, t) {
var a = new cc.Node("PlayerResultList"), i = new cc.Node("ListBg"), r = i.addComponent(cc.Graphics);
r.fillColor = new cc.Color(0, 0, 0, 80);
r.roundRect(-t / 2, -130, t, 260, 12);
r.fill();
i.parent = a;
for (var c = new cc.Node("Header"), l = [ "玩家", "身份", "输赢" ], s = [ -t / 2 + 80, 20, t / 2 - 60 ], d = 0; d < l.length; d++) {
var h = new cc.Node("H_" + d);
h.anchorX = .5;
h.anchorY = .5;
var u = h.addComponent(cc.Label);
u.string = l[d];
u.fontSize = 18;
u.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
u.verticalAlign = cc.Label.VerticalAlign.CENTER;
h.color = new cc.Color(150, 150, 160);
h.x = s[d];
h.parent = c;
}
c.y = 105;
c.parent = a;
var p = new cc.Node("Separator"), g = p.addComponent(cc.Graphics);
g.strokeColor = new cc.Color(100, 100, 100, 100);
g.lineWidth = 1;
g.moveTo(-t / 2 + 15, 0);
g.lineTo(t / 2 - 15, 0);
g.stroke();
p.y = 85;
p.parent = a;
var _ = e.players || [], f = myglobal.socket.getPlayerInfo().id || myglobal.playerData.serverPlayerId || myglobal.playerData.accountID;
for (d = 0; d < _.length && d < 3; d++) {
var m = _[d], C = String(m.player_id) === String(f), v = this._createPlayerResultItem(m, C, o, t, d);
v.y = 55 - 65 * d;
v.parent = a;
}
return a;
},
_createPlayerResultItem: function(e, o, n, t, a) {
var i = new cc.Node("PlayerItem_" + a);
if (o) {
var r = new cc.Node("Highlight"), c = r.addComponent(cc.Graphics);
c.fillColor = n ? new cc.Color(80, 60, 30, 150) : new cc.Color(50, 40, 50, 150);
c.roundRect(-t / 2 + 10, -27.5, t - 20, 55, 8);
c.fill();
c.strokeColor = n ? new cc.Color(200, 150, 50, 200) : new cc.Color(100, 80, 100, 150);
c.lineWidth = 2;
c.roundRect(-t / 2 + 10, -27.5, t - 20, 55, 8);
c.stroke();
r.parent = i;
}
var l = new cc.Node("Avatar");
l.x = -t / 2 + 45;
var s = new cc.Node("AvatarBg"), d = s.addComponent(cc.Graphics), h = "landlord" === e.role;
d.strokeColor = h ? new cc.Color(255, 200, 50, 255) : new cc.Color(180, 180, 200, 255);
d.lineWidth = 3;
d.circle(0, 0, 22);
d.stroke();
d.fillColor = new cc.Color(60, 60, 80, 200);
d.circle(0, 0, 20);
d.fill();
s.parent = l;
var u = "UI/headimage/avatar_" + (a % 4 + 1);
cc.resources.load(u, cc.SpriteFrame, function(e, o) {
if (!e && o) {
var n = new cc.Node("AvatarSprite"), t = n.addComponent(cc.Sprite);
t.spriteFrame = o;
t.sizeMode = cc.Sprite.SizeMode.CUSTOM;
n.width = 36;
n.height = 36;
n.parent = l;
}
});
var p = new cc.Node("RoleIcon"), g = p.addComponent(cc.Label);
g.string = h ? "👑" : "🌾";
g.fontSize = 14;
p.x = 18;
p.y = -15;
p.parent = l;
l.parent = i;
var _ = new cc.Node("Name");
_.anchorX = .5;
_.anchorY = .5;
var f = _.addComponent(cc.Label);
f.string = e.player_name || "玩家" + (a + 1);
f.fontSize = 18;
f.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
f.verticalAlign = cc.Label.VerticalAlign.CENTER;
_.color = o ? new cc.Color(255, 255, 200) : new cc.Color(220, 220, 220);
_.x = -t / 2 + 100;
_.parent = i;
var m = new cc.Node("Role");
m.anchorX = .5;
m.anchorY = .5;
var C = m.addComponent(cc.Label);
C.string = h ? "地主" : "农民";
C.fontSize = 18;
C.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
C.verticalAlign = cc.Label.VerticalAlign.CENTER;
m.color = h ? new cc.Color(255, 200, 100) : new cc.Color(120, 200, 120);
m.x = 20;
m.parent = i;
var v = e.win_gold || 0, w = new cc.Node("WinGold");
w.name = "WinGoldValue";
w.anchorX = .5;
w.anchorY = .5;
var y = w.addComponent(cc.Label);
y.string = (v >= 0 ? "+" : "") + v;
y.fontSize = 22;
y.fontFamily = "Arial";
y.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
y.verticalAlign = cc.Label.VerticalAlign.CENTER;
var b = w.addComponent(cc.LabelOutline);
b.color = v >= 0 ? new cc.Color(0, 80, 0) : new cc.Color(100, 0, 0);
b.width = 2;
w.color = v >= 0 ? new cc.Color(100, 255, 100) : new cc.Color(255, 100, 100);
w.x = t / 2 - 50;
w.parent = i;
return i;
},
_createButtonArea: function(e, o) {
var n = new cc.Node("ButtonArea"), t = this._createStyledButton("继续游戏", e, !0);
t.x = -100;
t.parent = n;
t.on(cc.Node.EventType.TOUCH_END, function() {
o && o("continue");
});
var a = this._createStyledButton("返回大厅", e, !1);
a.x = 100;
a.parent = n;
a.on(cc.Node.EventType.TOUCH_END, function() {
o && o("lobby");
});
return n;
},
_createStyledButton: function(e, o, n) {
var t = new cc.Node("Btn_" + e);
t.setContentSize(140, 50);
t.setAnchorPoint(.5, .5);
t.addComponent(cc.BlockInputEvents);
var a = t.addComponent(cc.Graphics);
a.fillColor = n ? o ? new cc.Color(200, 140, 30, 255) : new cc.Color(60, 120, 180, 255) : new cc.Color(80, 70, 120, 255);
a.roundRect(-70, -25, 140, 50, 25);
a.fill();
if (n && o) {
a.strokeColor = new cc.Color(255, 220, 100, 255);
a.lineWidth = 2;
a.roundRect(-70, -25, 140, 50, 25);
a.stroke();
}
var i = new cc.Node("Label");
i.anchorX = .5;
i.anchorY = .5;
var r = i.addComponent(cc.Label);
r.string = e;
r.fontSize = 22;
r.fontFamily = "Arial";
r.overflow = cc.Label.Overflow.SHRINK;
r.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
r.verticalAlign = cc.Label.VerticalAlign.CENTER;
i.width = 120;
i.height = 40;
i.color = new cc.Color(255, 255, 255);
var c = i.addComponent(cc.LabelOutline);
c.color = new cc.Color(0, 0, 0);
c.width = 2;
i.parent = t;
t.on(cc.Node.EventType.TOUCH_START, function() {
cc.tween(t).to(.1, {
scale: .95
}).start();
});
t.on(cc.Node.EventType.TOUCH_END, function() {
cc.tween(t).to(.1, {
scale: 1
}).start();
});
t.on(cc.Node.EventType.TOUCH_CANCEL, function() {
cc.tween(t).to(.1, {
scale: 1
}).start();
});
return t;
},
_createVictoryParticles: function(e, o, n) {
for (var t = this, a = 0; a < 15; a++) (function(t) {
var a = new cc.Node("Coin_" + t);
a.x = (Math.random() - .5) * o;
a.y = n / 2 + 50;
var i = a.addComponent(cc.Graphics);
i.fillColor = new cc.Color(255, 200, 50, 255);
i.circle(0, 0, 8);
i.fill();
i.strokeColor = new cc.Color(200, 150, 30, 255);
i.lineWidth = 1;
i.circle(0, 0, 8);
i.stroke();
a.parent = e;
var r = 1.5 + 1.5 * Math.random(), c = -n / 2 - 50, l = .5 * Math.random();
cc.tween(a).delay(l).parallel(cc.tween().to(r, {
y: c
}, {
easing: "quadIn"
}), cc.tween().to(r, {
x: a.x + 100 * (Math.random() - .5)
}), cc.tween().to(r / 2, {
angle: -180
}).to(r / 2, {
angle: -360
})).call(function() {
a.y = n / 2 + 50;
a.x = (Math.random() - .5) * o;
cc.tween(a).parallel(cc.tween().to(r, {
y: c
}, {
easing: "quadIn"
}), cc.tween().to(r, {
x: a.x + 100 * (Math.random() - .5)
}), cc.tween().to(r / 2, {
angle: -180
}).to(r / 2, {
angle: -360
})).start();
}).start();
})(a);
for (var i = 0; i < 8; i++) (function(a) {
var i = new cc.Node("Star_" + a);
i.x = (Math.random() - .5) * o * .8;
i.y = (Math.random() - .5) * n * .8;
var r = i.addComponent(cc.Graphics);
r.fillColor = new cc.Color(255, 255, 200, 200);
t._drawStar(r, 0, 0, 6, 5);
i.parent = e;
i.opacity = 0;
cc.tween(i).delay(2 * Math.random()).repeatForever(cc.tween().to(.3, {
opacity: 255,
scale: 1.2
}).to(.3, {
opacity: 100,
scale: .8
}).to(.3, {
opacity: 255,
scale: 1.2
}).to(.3, {
opacity: 0,
scale: .5
}).delay(1 + 2 * Math.random())).start();
})(i);
},
_createDefeatParticles: function(e, o, n) {
for (var t = 0; t < 10; t++) (function(t) {
var a = new cc.Node("DefeatParticle_" + t);
a.x = (Math.random() - .5) * o;
a.y = (Math.random() - .5) * n;
var i = a.addComponent(cc.Graphics);
i.fillColor = new cc.Color(80, 100, 150, 150);
i.circle(0, 0, 4 + 3 * Math.random());
i.fill();
a.parent = e;
a.opacity = 0;
var r = 3 + 2 * Math.random();
cc.tween(a).to(.5, {
opacity: 150
}).parallel(cc.tween().to(r, {
y: a.y + 50 + 30 * Math.random()
}, {
easing: "sineInOut"
}), cc.tween().to(r, {
x: a.x + 40 * (Math.random() - .5)
})).to(.5, {
opacity: 0
}).call(function() {
a.y = (Math.random() - .5) * n;
a.x = (Math.random() - .5) * o;
}).start();
cc.tween(a).delay(4).repeatForever(cc.tween().to(.5, {
opacity: 150
}).parallel(cc.tween().to(r, {
y: a.y + 50 + 30 * Math.random()
}, {
easing: "sineInOut"
}), cc.tween().to(r, {
x: a.x + 40 * (Math.random() - .5)
})).to(.5, {
opacity: 0
})).start();
})(t);
},
_drawStar: function(e, o, n, t, a) {
var i = 2 * t;
e.moveTo(o, n + i);
for (var r = 0; r < 2 * a; r++) {
var c = r % 2 == 0 ? i : t, l = r * Math.PI / a - Math.PI / 2, s = o + Math.cos(l) * c, d = n + Math.sin(l) * c;
e.lineTo(s, d);
}
e.close();
e.fill();
},
_startNumberAnimations: function(e, o) {
var n = this._findNodeByName(e, "MultiplierValue");
if (n) {
var t = o.multiple || 1;
this._animateNumber(n, 1, t, 800, "x");
}
},
_animateNumber: function(e, o, n, t, a) {
if (e) {
var i = e.getComponent(cc.Label);
if (i) {
var r = Date.now(), c = n - o;
(function l() {
if (e.isValid) {
var s = Date.now() - r, d = Math.min(s / t, 1), h = 1 - Math.pow(1 - d, 3), u = Math.floor(o + c * h);
i.string = (a || "") + u;
d < 1 ? setTimeout(l, 16) : i.string = (a || "") + n;
}
})();
}
}
},
_findNodeByName: function(e, o) {
if (!e) return null;
for (var n = e.children, t = 0; t < n.length; t++) {
if (n[t].name === o) return n[t];
var a = this._findNodeByName(n[t], o);
if (a) return a;
}
return null;
},
_closeGameResultPopup: function(e, o) {
if (this._resultEffectLayer) {
this._resultEffectLayer.stopAllActions();
for (var n = this._resultEffectLayer.children, t = 0; t < n.length; t++) n[t].stopAllActions();
}
e && cc.tween(e).to(.2, {
scale: .8,
opacity: 0
}, {
easing: "backIn"
}).call(function() {
e && e.isValid && e.destroy();
}).start();
o && cc.tween(o).to(.2, {
opacity: 0
}).call(function() {
o && o.isValid && o.destroy();
}).start();
this._gameResultPopup = null;
this._gameResultMask = null;
this._resultEffectLayer = null;
},
_continueGame: function() {
var e = window.myglobal;
if (e && e.playerData) {
var o = e.playerData.gobal_count || 0, n = e.currentRoomConfig || {}, t = n.min_gold || n.minGold || 0;
o < t ? this._showInsufficientGoldPopup(o, t) : this._doContinueGame();
}
},
_doContinueGame: function() {
this._resetGameState();
var e = window.myglobal;
e && e.socket && e.socket.requestReady && e.socket.requestReady();
if (this.tipsLabel) {
this.tipsLabel.string = "等待其他玩家...";
var o = this;
setTimeout(function() {
o.tipsLabel && (o.tipsLabel.string = "");
}, 5e3);
}
},
_showInsufficientGoldPopup: function(e, o) {
var n = this;
this._closeGameResultPopup();
var t = cc.director.getScene().getChildByName("Canvas");
if (t) {
var a = cc.winSize, i = new cc.Node("InsufficientGoldMask");
i.addComponent(cc.BlockInputEvents);
var r = i.addComponent(cc.Sprite);
r.spriteFrame = new cc.SpriteFrame();
r.sizeMode = cc.Sprite.SizeMode.CUSTOM;
i.width = 2 * a.width;
i.height = 2 * a.height;
i.color = new cc.Color(0, 0, 0);
i.opacity = 180;
i.parent = t;
var c = new cc.Node("InsufficientGoldPopup");
c.x = 0;
c.y = 0;
c.parent = t;
var l = new cc.Node("Bg"), s = l.addComponent(cc.Graphics);
s.fillColor = new cc.Color(40, 35, 60);
s.roundRect(-225, -160, 450, 320, 20);
s.fill();
s.strokeColor = new cc.Color(255, 200, 100);
s.lineWidth = 3;
s.roundRect(-225, -160, 450, 320, 20);
s.stroke();
l.parent = c;
var d = new cc.Node("Title"), h = d.addComponent(cc.Label);
h.string = "豆子不足";
h.fontSize = 28;
h.fontFamily = "Arial";
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
d.color = new cc.Color(255, 200, 100);
d.y = 115;
d.parent = c;
var u = new cc.Node("Line"), p = u.addComponent(cc.Graphics);
p.strokeColor = new cc.Color(100, 80, 60);
p.lineWidth = 1;
p.moveTo(-195, 80);
p.lineTo(195, 80);
p.stroke();
u.parent = c;
var g = new cc.Node("Content"), _ = g.addComponent(cc.Label);
_.string = "当前豆子: " + this._formatGold(e) + "\n需要豆子: " + this._formatGold(o) + "\n\n观看激励视频广告可获取豆子";
_.fontSize = 20;
_.fontFamily = "Arial";
_.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
_.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
g.width = 390;
g.color = new cc.Color(220, 220, 220);
g.y = 20;
g.parent = c;
var f = new cc.Node("ButtonArea");
f.y = -100;
f.parent = c;
var m = new cc.Node("AdBtn"), C = m.addComponent(cc.Graphics);
C.fillColor = new cc.Color(80, 180, 80);
C.roundRect(-100, -25, 200, 50, 25);
C.fill();
m.x = -110;
m.parent = f;
var v = new cc.Node("Label"), w = v.addComponent(cc.Label);
w.string = "观看广告";
w.fontSize = 20;
w.fontFamily = "Arial";
v.color = new cc.Color(255, 255, 255);
v.parent = m;
var y = new cc.Node("LobbyBtn"), b = y.addComponent(cc.Graphics);
b.fillColor = new cc.Color(100, 80, 140);
b.roundRect(-100, -25, 200, 50, 25);
b.fill();
y.x = 110;
y.parent = f;
var S = new cc.Node("Label"), N = S.addComponent(cc.Label);
N.string = "返回大厅";
N.fontSize = 20;
N.fontFamily = "Arial";
S.color = new cc.Color(255, 255, 255);
S.parent = y;
n._insufficientGoldPopup = c;
n._insufficientGoldMask = i;
m.on(cc.Node.EventType.TOUCH_END, function() {
n._watchAdForGold(function(e) {
if (e) {
n._closeInsufficientGoldPopup();
n._doContinueGame();
}
});
});
y.on(cc.Node.EventType.TOUCH_END, function() {
n._closeInsufficientGoldPopup();
n._returnToLobby();
});
}
},
_closeInsufficientGoldPopup: function() {
if (this._insufficientGoldPopup) {
this._insufficientGoldPopup.destroy();
this._insufficientGoldPopup = null;
}
if (this._insufficientGoldMask) {
this._insufficientGoldMask.destroy();
this._insufficientGoldMask = null;
}
},
_watchAdForGold: function(e) {
var o = this;
if ("undefined" != typeof tt && tt.showRewardedVideoAd) tt.showRewardedVideoAd({
success: function() {
o._rewardGoldAfterAd(e);
},
fail: function() {
o._showMessage("广告加载失败，请稍后重试");
e && e(!1);
}
}); else if ("undefined" != typeof wx && wx.createRewardedVideoAd) {
var n = wx.createRewardedVideoAd({
adUnitId: "adunit-xxx"
});
n.onClose(function(n) {
if (n && n.isEnded) o._rewardGoldAfterAd(e); else {
o._showMessage("请完整观看广告获取奖励");
e && e(!1);
}
});
n.onError(function() {
o._showMessage("广告加载失败，请稍后重试");
e && e(!1);
});
n.show().catch(function() {
n.load().then(function() {
return n.show();
});
});
} else {
o._showMessage("正在加载广告...");
setTimeout(function() {
o._rewardGoldAfterAd(e);
}, 2e3);
}
},
_rewardGoldAfterGold: function(e) {
var o = window.myglobal;
if (o && o.playerData) {
o.playerData.updateGold(5e3);
this._showMessage("获得 " + this._formatGold(5e3) + " 豆子！");
o.socket && o.socket.sendAdReward && o.socket.sendAdReward(5e3);
e && e(!0);
} else e && e(!1);
},
_rewardGoldAfterAd: function(e) {
var o = window.myglobal;
if (o && o.playerData) {
o.playerData.updateGold(5e3);
this._showMessage("获得 " + this._formatGold(5e3) + " 豆子！");
o.socket && o.socket.sendAdReward && o.socket.sendAdReward(5e3);
e && e(!0);
} else e && e(!1);
},
_formatGold: function(e) {
return e >= 1e4 ? (e / 1e4).toFixed(1) + "万" : e.toString();
},
_showMessage: function(e) {
if (this.tipsLabel) {
this.tipsLabel.string = e;
var o = this;
setTimeout(function() {
o.tipsLabel && (o.tipsLabel.string = "");
}, 3e3);
}
},
_returnToLobby: function() {
this._resetGameState();
var e = window.myglobal;
e && e.socket && e.socket.leaveRoom ? e.socket.leaveRoom() : console.error("🎮 [_returnToLobby] myglobal.socket.leaveRoom 不可用");
cc.director.loadScene("hallScene", function() {});
},
_resetGameState: function() {
this.handCards = [];
this.bottomCards = [];
this.choose_card_data = [];
this.clearAllCards();
this._clearAllOutCardZones();
this._clearBottomCards();
this._gamePhase = "idle";
this._biddingPhase = "idle";
this._hideRobUI();
this.playingUI_node && (this.playingUI_node.active = !1);
this._resetAllPlayerReadyState();
},
_clearAllOutCardZones: function() {
if (this.node && this.node.isValid) {
var e = this.node.parent ? this.node.parent.getComponent("gameScene") : null;
if (e) {
var o = e.players_seat_pos;
if (o) {
var n = o.children;
if (n) for (var t = 0; t < n.length; t++) {
var a = n[t];
if (a) for (var i = 0; i < 3; i++) {
var r = "cardsoutzone" + i, c = a.getChildByName(r);
c && c.removeAllChildren(!0);
}
} else console.warn("🎮 [_clearAllOutCardZones] players_seat_pos.children 为空");
} else console.warn("🎮 [_clearAllOutCardZones] 无法获取 players_seat_pos");
} else console.warn("🎮 [_clearAllOutCardZones] 无法获取 gameScene");
} else console.warn("🎮 [_clearAllOutCardZones] this.node 为空或已销毁");
},
_clearBottomCards: function() {
if (this.bottom_card) for (var e = 0; e < this.bottom_card.length; e++) this.bottom_card[e] && this.bottom_card[e].isValid && this.bottom_card[e].destroy();
this.bottom_card = [];
},
_resetAllPlayerReadyState: function() {
var e = this.node.parent ? this.node.parent.getComponent("gameScene") : null;
if (e && e.playerNodeList) for (var o = 0; o < e.playerNodeList.length; o++) {
var n = e.playerNodeList[o];
if (n) {
var t = n.getComponent("player_node");
t && t.readyimage && (t.readyimage.active = !1);
}
}
},
_updatePlayerGoldDisplay: function(e, o) {
var n = this.node.parent ? this.node.parent.getComponent("gameScene") : null;
if (n && n.playerNodeList) for (var t = 0; t < n.playerNodeList.length; t++) {
var a = n.playerNodeList[t];
if (a) {
var i = a.getComponent("player_node");
if (i && String(i.accountid) === String(e)) {
i.globalcount_label && (i.globalcount_label.string = String(o));
break;
}
}
} else console.warn("🏆 [_updatePlayerGoldDisplay] 无法获取 gameScene 或 playerNodeList");
},
_updatePlayerMatchCoinDisplay: function(e, o) {
console.log("🏟️ [_updatePlayerMatchCoinDisplay] 更新玩家竞技币: playerId=", e, "matchCoin=", o);
var n = this.node.parent ? this.node.parent.getComponent("gameScene") : null;
if (n && n.playerNodeList) for (var t = 0; t < n.playerNodeList.length; t++) {
var a = n.playerNodeList[t];
if (a) {
var i = a.getComponent("player_node");
if (i && String(i.accountid) === String(e)) {
if (i.globalcount_label) {
i.globalcount_label.string = String(o);
console.log("🏟️ [_updatePlayerMatchCoinDisplay] 已更新玩家 ", e, " 的竞技币显示为 ", o);
}
i._matchCoin = o;
break;
}
}
} else console.warn("🏟️ [_updatePlayerMatchCoinDisplay] 无法获取 gameScene 或 playerNodeList");
},
_showCompetitionResultPopup: function(e) {
if (e.is_final_round) console.log("🏆 [_showCompetitionResultPopup] 检测到最终结算（只有3人），跳过中间结算弹窗，等待排名消息"); else {
var o = cc.winSize, n = window.myglobal, t = n.socket.getPlayerInfo().id || n.playerData.serverPlayerId || n.playerData.accountID, a = !1, i = 0, r = 0;
if (e.players && e.players.length > 0) for (var c = 0; c < e.players.length; c++) {
var l = e.players[c];
if (String(l.player_id) === String(t)) {
a = l.is_winner;
i = l.win_gold;
void 0 !== l.match_coin && l.match_coin >= 0 && (r = l.match_coin);
break;
}
}
this._matchCoin = r;
if (e.players && e.players.length > 0) for (c = 0; c < e.players.length; c++) {
var s = (l = e.players[c]).player_id, d = l.match_coin;
void 0 !== d && d >= 0 && this._updatePlayerMatchCoinDisplay(s, d);
}
var h = cc.find("Canvas") || cc.find("UI_ROOT") || this.node.parent;
h || (h = this.node);
var u = new cc.Node("CompetitionResultMask");
u.addComponent(cc.BlockInputEvents);
u.color = a ? new cc.Color(0, 30, 50) : new cc.Color(30, 0, 0);
u.opacity = 200;
u.width = 2 * o.width;
u.height = 2 * o.height;
u.zIndex = 999;
u.parent = h;
var p = new cc.Node("CompetitionResultPopup");
p.scale = .5;
p.opacity = 0;
p.zIndex = 1e3;
p.parent = h;
var g = new cc.Node("Bg"), _ = g.addComponent(cc.Graphics);
_.fillColor = a ? new cc.Color(40, 50, 80, 240) : new cc.Color(50, 35, 40, 240);
_.roundRect(-225, -190, 450, 380, 20);
_.fill();
_.strokeColor = a ? new cc.Color(100, 200, 255) : new cc.Color(200, 100, 100);
_.lineWidth = 3;
_.roundRect(-225, -190, 450, 380, 20);
_.stroke();
g.parent = p;
var f = new cc.Node("Title"), m = f.addComponent(cc.Label);
m.string = a ? "🎉 胜利 🎉" : "✖ 失败 ✖";
m.fontSize = 36;
f.color = a ? new cc.Color(100, 255, 200) : new cc.Color(255, 150, 150);
f.y = 140;
f.parent = p;
var C = new cc.Node("Result"), v = C.addComponent(cc.Label);
v.string = "本局结果: " + (i >= 0 ? "+" : "") + i + " 金币";
v.fontSize = 28;
C.color = i >= 0 ? new cc.Color(100, 255, 100) : new cc.Color(255, 100, 100);
C.y = 90;
C.parent = p;
var w = new cc.Node("Multiplier"), y = w.addComponent(cc.Label);
y.string = "本局倍数: x" + (e.multiple || 1);
y.fontSize = 24;
w.color = new cc.Color(255, 220, 150);
w.y = 50;
w.parent = p;
var b = new cc.Node("MatchCoin"), S = b.addComponent(cc.Label);
S.string = "当前金币: " + this._matchCoin;
S.fontSize = 24;
b.color = new cc.Color(255, 200, 100);
b.y = 10;
b.parent = p;
var N = e.arena_countdown || 30, L = new cc.Node("CountdownContainer");
L.y = -110;
L.parent = p;
var A = new cc.Node("CountdownLabel"), T = A.addComponent(cc.Label);
T.string = "下一轮将在 " + N + " 秒后开始";
T.fontSize = 26;
A.color = new cc.Color(255, 215, 0);
A.parent = L;
var R = new cc.Node("CountdownNumber"), k = R.addComponent(cc.Label);
k.string = String(N);
k.fontSize = 48;
R.color = new cc.Color(255, 255, 255);
R.y = -45;
R.parent = L;
var z = R.addComponent(cc.LabelOutline);
z.color = cc.Color.BLACK;
z.width = 2;
cc.tween(p).to(.35, {
scale: 1,
opacity: 255
}, {
easing: "backOut"
}).start();
this._gameResultPopup = p;
this._gameResultMask = u;
this._countdownLabelNode = A;
this._countdownNumberNode = R;
this._arenaCountdownSeconds = N;
this._playGameResultSound(a);
this._setupArenaCountdownListeners();
console.log("🏟️ [显示结算弹窗] 初始倒计时:", N, "秒，等待服务端推送...");
}
},
_showWaitingForServer: function() {
this._countdownLabelNode && (e = this._countdownLabelNode.getComponent(cc.Label)) && (e.string = "等待服务器响应...");
if (this._countdownNumberNode) {
var e;
(e = this._countdownNumberNode.getComponent(cc.Label)) && (e.string = "...");
}
},
_setupArenaCountdownListeners: function() {
var e = this, o = window.myglobal;
if (o && o.socket) {
o.socket.onArenaRoundCountdown(function(o) {
console.log("🏟️ [onArenaRoundCountdown] 收到倒计时开始:", o);
e._arenaCountdownSeconds = o.seconds || 30;
e._updateArenaCountdownUI(o.seconds);
});
o.socket.onArenaCountdownTick(function(o) {
console.log("🏟️ [onArenaCountdownTick] 服务端倒计时同步:", o.seconds);
e._arenaCountdownSeconds = o.seconds;
e._updateArenaCountdownUI(o.seconds);
});
o.socket.onArenaAutoReady(function(o) {
console.log("🏟️ [onArenaAutoReady] 自动准备:", o.message);
if (e._localArenaCountdownTimer) {
e.unschedule(e._localArenaCountdownTick);
e._localArenaCountdownTimer = null;
}
e._showArenaAutoReadyMessage(o.message);
});
o.socket.onArenaReconnectState(function(o) {
console.log("🏟️ [onArenaReconnectState] 状态恢复:", o);
if ("countdown" === o.phase) {
e._arenaCountdownSeconds = o.countdown;
e._updateArenaCountdownUI(o.countdown);
}
});
} else console.warn("🏟️ [_setupArenaCountdownListeners] socket未初始化");
},
_updateArenaCountdownUI: function(e) {
if (this._countdownLabelNode) {
var o = this._countdownLabelNode.getComponent(cc.Label);
o && (o.string = "下一轮将在 " + e + " 秒后开始");
}
if (this._countdownNumberNode) {
var n = this._countdownNumberNode.getComponent(cc.Label);
n && (n.string = String(e));
if (e <= 5 && e > 0) {
cc.tween(this._countdownNumberNode).to(.1, {
scale: 1.2
}).to(.1, {
scale: 1
}).start();
this._countdownNumberNode.color = new cc.Color(255, 100, 100);
} else this._countdownNumberNode.color = new cc.Color(255, 255, 255);
}
},
_stopArenaCountdown: function() {
if (this._localArenaCountdownTimer) {
this.unschedule(this._localArenaCountdownTick);
this._localArenaCountdownTimer = null;
console.log("🏟️ [_stopArenaCountdown] 已停止本地倒计时");
}
this._arenaCountdownSeconds = 0;
},
_showArenaAutoReadyMessage: function(e) {
if (this._countdownLabelNode) {
var o = this._countdownLabelNode.getComponent(cc.Label);
o && (o.string = e || "系统已自动准备");
}
this._countdownNumberNode && (this._countdownNumberNode.active = !1);
},
_onCompetitionStatus: function(e) {
this._isCompetition = 2 === e.room_category;
this._roomCategory = e.room_category || 1;
this._competitionRound = e.round || 0;
this._competitionTotalRounds = e.total_rounds || 0;
this._matchCoin = e.match_coin || 0;
this._isCompetition && this._showMatchCoinDisplay();
},
_onCompetitionCountdown: function(e) {
this._competitionCountdown = e.countdown || 15;
this._competitionCountdownTimer && this.unschedule(this._competitionCountdownTick);
this.schedule(this._competitionCountdownTick, 1);
},
_competitionCountdownTick: function() {
if (this._competitionCountdown <= 0) this.unschedule(this._competitionCountdownTick); else {
this._competitionCountdown--;
this._updateCompetitionCountdownDisplay();
}
},
_updateCompetitionCountdownDisplay: function() {
if (this._gameResultPopup) {
var e = this._gameResultPopup.getChildByName("CompetitionCountdown");
e && e.getComponent(cc.Label) && (e.getComponent(cc.Label).string = "下一局开始 " + this._competitionCountdown + "秒");
}
},
_onMatchCoinUpdate: function(e) {
var o = window.myglobal;
if (o) {
var n = o.socket.getPlayerInfo().id || o.playerData.serverPlayerId || o.playerData.accountID;
if (String(e.player_id) === String(n)) {
this._matchCoin = e.match_coin;
this._updateMatchCoinDisplay(e.match_coin, e.delta);
}
}
},
_showMatchCoinDisplay: function() {
if (!this._matchCoinNode && window.myglobal) {
var e = new cc.Node("MatchCoinDisplay");
e.setPosition(-200, 280);
var o = new cc.Node("Bg"), n = o.addComponent(cc.Graphics);
n.fillColor = new cc.Color(50, 40, 80, 200);
n.roundRect(-80, -20, 160, 40, 10);
n.fill();
o.parent = e;
var t = new cc.Node("Icon"), a = t.addComponent(cc.Label);
a.string = "🪙";
a.fontSize = 20;
t.setPosition(-55, 0);
t.parent = e;
var i = new cc.Node("Label"), r = i.addComponent(cc.Label);
r.string = "比赛金币";
r.fontSize = 14;
i.color = new cc.Color(200, 200, 200);
i.setPosition(-20, 0);
i.parent = e;
var c = new cc.Node("Value");
c.name = "MatchCoinValue";
var l = c.addComponent(cc.Label);
l.string = String(this._matchCoin);
l.fontSize = 18;
c.color = new cc.Color(255, 220, 100);
c.setPosition(45, 0);
c.parent = e;
e.parent = this.node;
this._matchCoinNode = e;
}
},
_updateMatchCoinDisplay: function(e, o) {
if (this._matchCoinNode) {
var n = this._matchCoinNode.getChildByName("MatchCoinValue");
if (n && n.getComponent(cc.Label)) {
n.getComponent(cc.Label).string = String(e);
0 !== o && this._showMatchCoinDeltaAnimation(o);
}
}
},
_showMatchCoinDeltaAnimation: function(e) {
if (this._matchCoinNode) {
var o = new cc.Node("Delta"), n = o.addComponent(cc.Label);
n.string = (e >= 0 ? "+" : "") + e;
n.fontSize = 24;
o.color = e >= 0 ? new cc.Color(100, 255, 100) : new cc.Color(255, 100, 100);
o.setPosition(80, 0);
o.parent = this._matchCoinNode;
cc.tween(o).to(.5, {
y: 30,
opacity: 255
}).to(.5, {
y: 50,
opacity: 0
}).call(function() {
o.destroy();
}).start();
}
},
_hideMatchCoinDisplay: function() {
if (this._matchCoinNode) {
this._matchCoinNode.destroy();
this._matchCoinNode = null;
}
},
_onCompetitionEliminated: function(e) {
this._stopPlayCountdown();
this._stopBidCountdown();
this._hideMatchCoinDisplay();
this._showEliminatedPopup(e);
},
_showEliminatedPopup: function(e) {
var o = this, n = cc.winSize, t = cc.find("Canvas") || cc.find("UI_ROOT") || this.node.parent;
t || (t = this.node);
var a = new cc.Node("EliminatedMask");
a.addComponent(cc.BlockInputEvents);
a.color = new cc.Color(0, 0, 0);
a.opacity = 180;
a.width = 2 * n.width;
a.height = 2 * n.height;
a.zIndex = 999;
a.parent = t;
var i = new cc.Node("EliminatedPopup");
i.scale = .5;
i.opacity = 0;
i.zIndex = 1e3;
i.parent = t;
var r = new cc.Node("Bg"), c = r.addComponent(cc.Graphics);
c.fillColor = new cc.Color(60, 40, 50, 240);
c.roundRect(-200, -175, 400, 350, 20);
c.fill();
c.strokeColor = new cc.Color(150, 100, 100);
c.lineWidth = 3;
c.roundRect(-200, -175, 400, 350, 20);
c.stroke();
r.parent = i;
var l = new cc.Node("Title"), s = l.addComponent(cc.Label);
s.string = "❌ 比赛结束 ❌";
s.fontSize = 32;
l.color = new cc.Color(255, 150, 150);
l.y = 125;
l.parent = i;
var d = new cc.Node("Rank"), h = d.addComponent(cc.Label);
h.string = "最终排名: 第 " + e.rank + " 名";
h.fontSize = 24;
d.color = new cc.Color(255, 220, 150);
d.y = 75;
d.parent = i;
var u = new cc.Node("Reason"), p = u.addComponent(cc.Label);
p.string = e.reason || "比赛失利";
p.fontSize = 18;
u.color = new cc.Color(200, 200, 200);
u.y = 35;
u.parent = i;
var g = new cc.Node("Total"), _ = g.addComponent(cc.Label);
_.string = "共 " + (e.total_players || 0) + " 人参赛";
_.fontSize = 16;
g.color = new cc.Color(180, 180, 180);
g.y = -5;
g.parent = i;
if (e.rewards) {
var f = new cc.Node("Reward"), m = f.addComponent(cc.Label);
m.string = "获得奖励: " + (e.rewards.name || JSON.stringify(e.rewards));
m.fontSize = 18;
f.color = new cc.Color(255, 200, 100);
f.y = -45;
f.parent = i;
}
var C = new cc.Node("ReturnBtn");
C.setContentSize(200, 50);
C.addComponent(cc.BlockInputEvents);
var v = C.addComponent(cc.Graphics);
v.fillColor = new cc.Color(100, 80, 140);
v.roundRect(-100, -25, 200, 50, 25);
v.fill();
C.y = -125;
C.parent = i;
var w = new cc.Node("Label"), y = w.addComponent(cc.Label);
y.string = "返回大厅";
y.fontSize = 22;
w.color = new cc.Color(255, 255, 255);
w.parent = C;
C.on(cc.Node.EventType.TOUCH_END, function() {
i.destroy();
a.destroy();
o._returnToLobby();
});
cc.tween(i).to(.3, {
scale: 1,
opacity: 255
}, {
easing: "backOut"
}).start();
this._eliminatedPopup = i;
this._eliminatedMask = a;
},
_onCompetitionAdvance: function(e) {
this._competitionRound = e.current_round;
this._matchCoin = e.match_coin;
this._updateMatchCoinDisplay(e.match_coin, 0);
this._showAdvanceToast(e);
},
_showAdvanceToast: function(e) {
cc.winSize;
var o = new cc.Node("AdvanceToast");
o.setPosition(0, 100);
o.opacity = 0;
o.zIndex = 2e3;
o.parent = this.node;
var n = new cc.Node("Bg"), t = n.addComponent(cc.Graphics);
t.fillColor = new cc.Color(50, 100, 50, 220);
t.roundRect(-150, -25, 300, 50, 25);
t.fill();
n.parent = o;
var a = new cc.Node("Label"), i = a.addComponent(cc.Label);
i.string = "🎉 晋级成功！第 " + e.current_round + "/" + e.total_rounds + " 轮";
i.fontSize = 22;
a.color = new cc.Color(255, 255, 200);
a.parent = o;
cc.tween(o).to(.3, {
opacity: 255
}).delay(2).to(.3, {
opacity: 0
}).call(function() {
o.destroy();
}).start();
},
_onCompetitionChampion: function(e) {
this._stopPlayCountdown();
this._stopBidCountdown();
this._hideMatchCoinDisplay();
this._showChampionPopup(e);
},
_showChampionPopup: function(e) {
var o = this, n = cc.winSize, t = cc.find("Canvas") || cc.find("UI_ROOT") || this.node.parent;
t || (t = this.node);
(this._gameResultPopup || this._gameResultMask) && this._closeGameResultPopup(this._gameResultPopup, this._gameResultMask);
var a = new cc.Node("ChampionMask");
a.addComponent(cc.BlockInputEvents);
a.color = new cc.Color(20, 15, 40);
a.opacity = 220;
a.width = 2 * n.width;
a.height = 2 * n.height;
a.zIndex = 999;
a.parent = t;
var i = new cc.Node("ChampionPopup");
i.scale = .5;
i.opacity = 0;
i.zIndex = 1e3;
i.parent = t;
var r = new cc.Node("Bg"), c = r.addComponent(cc.Graphics);
c.fillColor = new cc.Color(45, 35, 70, 245);
c.roundRect(-260, -310, 520, 620, 20);
c.fill();
c.strokeColor = new cc.Color(255, 200, 80);
c.lineWidth = 3;
c.roundRect(-260, -310, 520, 620, 20);
c.stroke();
r.parent = i;
var l = new cc.Node("Title"), s = l.addComponent(cc.Label);
s.string = "🏆 比赛结束 🏆";
s.fontSize = 32;
s.enableBold = !0;
l.color = new cc.Color(255, 220, 100);
l.y = 270;
l.parent = i;
var d = e.rankings || [];
d.length >= 1 && this._createRankingItem(i, d[0], 1, -120, 220);
d.length >= 2 && this._createRankingItem(i, d[1], 2, 0, 200);
d.length >= 3 && this._createRankingItem(i, d[2], 3, 120, 180);
if (d.length > 3) {
var h = new cc.Node("OtherTitle"), u = h.addComponent(cc.Label);
u.string = "—— 其他排名 ——";
u.fontSize = 18;
h.color = new cc.Color(180, 180, 200);
h.y = 120;
h.parent = i;
for (var p = Math.min(d.length, 20), g = 3; g < p; g++) {
var _ = d[g], f = new cc.Node("RankItem_" + g), m = f.addComponent(cc.Label);
m.string = "第" + _.rank + "名: " + _.player_name + "  金币: " + _.match_coin;
m.fontSize = 16;
f.color = new cc.Color(200, 200, 210);
f.y = 90 - 24 * (g - 3);
f.parent = i;
}
}
var C = new cc.Node("ConfirmBtn");
C.setContentSize(180, 45);
C.addComponent(cc.BlockInputEvents);
var v = C.addComponent(cc.Graphics);
v.fillColor = new cc.Color(200, 150, 50);
v.roundRect(-90, -22.5, 180, 45, 22);
v.fill();
C.y = -260;
C.parent = i;
var w = new cc.Node("Label"), y = w.addComponent(cc.Label);
y.string = "返回大厅";
y.fontSize = 20;
w.color = new cc.Color(255, 255, 255);
w.parent = C;
C.on(cc.Node.EventType.TOUCH_END, function() {
i.destroy();
a.destroy();
o._returnToLobby();
});
cc.tween(i).to(.4, {
scale: 1,
opacity: 255
}, {
easing: "backOut"
}).start();
this._createChampionParticles(i, 520, 620);
this._championPopup = i;
this._championMask = a;
},
_createRankingItem: function(e, o, n, t, a) {
var i = new cc.Node("RankItem_" + n);
i.setPosition(t, a);
var r, c = new cc.Node("Bg"), l = c.addComponent(cc.Graphics);
r = 1 === n ? new cc.Color(255, 215, 0, 200) : 2 === n ? new cc.Color(192, 192, 192, 200) : new cc.Color(205, 127, 50, 200);
l.fillColor = r;
l.roundRect(-55, -30, 110, 60, 10);
l.fill();
c.parent = i;
var s, d = new cc.Node("RankLabel"), h = d.addComponent(cc.Label);
s = 1 === n ? "🥇 冠军" : 2 === n ? "🥈 亚军" : "🥉 季军";
h.string = s;
h.fontSize = 16;
h.enableBold = !0;
d.color = new cc.Color(255, 255, 255);
d.y = 12;
d.parent = i;
var u = new cc.Node("NameLabel"), p = u.addComponent(cc.Label);
p.string = o.player_name || "玩家";
p.fontSize = 14;
u.color = new cc.Color(255, 255, 255);
u.y = -8;
u.parent = i;
var g = new cc.Node("CoinLabel"), _ = g.addComponent(cc.Label);
_.string = o.match_coin + " 金币";
_.fontSize = 12;
g.color = new cc.Color(255, 255, 200);
g.y = -22;
g.parent = i;
i.parent = e;
},
_createChampionParticles: function(e, o, n) {
for (var t = 0; t < 20; t++) (function(t) {
var a = new cc.Node("Particle_" + t);
a.setPosition((Math.random() - .5) * o, n / 2 + 50);
var i = a.addComponent(cc.Label);
i.string = "✨";
i.fontSize = 20 + 20 * Math.random();
a.parent = e;
cc.tween(a).delay(.5 * Math.random()).to(2, {
y: -n / 2 - 50,
x: a.x + 100 * (Math.random() - .5)
}).call(function() {
a.destroy();
}).start();
})(t);
},
_onTournamentFinalRank: function(e) {
console.log("🏆 [_onTournamentFinalRank] 收到最终榜单数据:", JSON.stringify(e));
this._stopPlayCountdown();
this._stopBidCountdown();
if (this._localArenaCountdownTimer) {
this.unschedule(this._localArenaCountdownTick);
this._localArenaCountdownTimer = null;
}
this._hideMatchCoinDisplay();
(this._gameResultPopup || this._gameResultMask) && this._closeGameResultPopup(this._gameResultPopup, this._gameResultMask);
this._showTournamentFinalRankDialog(e);
},
_onArenaEliminatedKick: function(e) {
console.log("🚪 [_onArenaEliminatedKick] 收到淘汰踢出通知:", JSON.stringify(e));
var o = cc.winSize;
this._stopPlayCountdown();
this._stopBidCountdown();
if (this._localArenaCountdownTimer) {
this.unschedule(this._localArenaCountdownTick);
this._localArenaCountdownTimer = null;
}
this._hideMatchCoinDisplay();
(this._gameResultPopup || this._gameResultMask) && this._closeGameResultPopup(this._gameResultPopup, this._gameResultMask);
var n = cc.find("Canvas") || cc.find("UI_ROOT") || this.node.parent;
n || (n = this.node);
var t = new cc.Node("EliminatedKickMask");
t.addComponent(cc.BlockInputEvents);
t.color = new cc.Color(10, 5, 30);
t.opacity = 200;
t.width = 2 * o.width;
t.height = 2 * o.height;
t.zIndex = 999;
t.parent = n;
var a = new cc.Node("EliminatedKickPopup");
a.scale = .3;
a.opacity = 0;
a.zIndex = 1e3;
a.parent = n;
var i = new cc.Node("Bg"), r = i.addComponent(cc.Graphics);
r.fillColor = new cc.Color(30, 22, 54, 250);
r.roundRect(-250, -140, 500, 280, 16);
r.fill();
r.strokeColor = new cc.Color(255, 100, 100);
r.lineWidth = 3;
r.roundRect(-250, -140, 500, 280, 16);
r.stroke();
i.parent = a;
var c = new cc.Node("Title"), l = c.addComponent(cc.Label);
l.string = "💔 淘汰通知";
l.fontSize = 32;
l.lineHeight = 40;
c.color = new cc.Color(255, 100, 100);
c.y = 80;
c.parent = a;
var s = new cc.Node("Message"), d = s.addComponent(cc.Label);
d.string = e.message || "您已被淘汰，即将离开房间";
d.fontSize = 24;
d.lineHeight = 32;
s.color = new cc.Color(220, 220, 220);
s.y = 20;
s.parent = a;
var h = new cc.Node("ConfirmBtn"), u = h.addComponent(cc.Graphics);
u.fillColor = new cc.Color(80, 140, 200);
u.roundRect(-80, -25, 160, 50, 8);
u.fill();
h.y = -70;
h.parent = a;
var p = new cc.Node("Label"), g = p.addComponent(cc.Label);
g.string = "确定";
g.fontSize = 24;
p.color = new cc.Color(255, 255, 255);
p.parent = h;
h.on(cc.Node.EventType.TOUCH_END, function() {
a.destroy();
t.destroy();
cc.director.loadScene("hallScene");
});
a.runAction(cc.sequence(cc.spawn(cc.scaleTo(.3, 1).easing(cc.easeBackOut()), cc.fadeIn(.3))));
this.scheduleOnce(function() {
if (a && a.parent) {
a.destroy();
t.destroy();
cc.director.loadScene("hallScene");
}
}, 3);
},
_showTournamentFinalRankDialog: function(e) {
var o = cc.winSize, n = cc.find("Canvas") || cc.find("UI_ROOT") || this.node.parent;
n || (n = this.node);
var t = new cc.Node("FinalRankMask");
t.addComponent(cc.BlockInputEvents);
t.color = new cc.Color(10, 5, 30);
t.opacity = 200;
t.width = 2 * o.width;
t.height = 2 * o.height;
t.zIndex = 999;
t.parent = n;
var a = new cc.Node("FinalRankPopup");
a.scale = .3;
a.opacity = 0;
a.zIndex = 1e3;
a.parent = n;
var i = Math.floor(.85 * o.height), r = new cc.Node("Bg"), c = r.addComponent(cc.Graphics);
c.fillColor = new cc.Color(30, 22, 54, 250);
c.roundRect(-300, -i / 2, 600, i, 16);
c.fill();
c.strokeColor = new cc.Color(255, 200, 80);
c.lineWidth = 3;
c.roundRect(-300, -i / 2, 600, i, 16);
c.stroke();
r.parent = a;
var l = new cc.Node("TitleBg"), s = l.addComponent(cc.Graphics);
s.fillColor = new cc.Color(180, 130, 50, 220);
s.roundRect(-292, i / 2 - 55, 584, 50, 8);
s.fill();
l.parent = a;
var d = new cc.Node("Title"), h = d.addComponent(cc.Label);
h.string = "🏆 比赛结束 🏆";
h.fontSize = 32;
h.enableBold = !0;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
d.color = new cc.Color(255, 250, 220);
d.y = i / 2 - 32;
d.parent = a;
var u = new cc.Node("Total"), p = u.addComponent(cc.Label);
p.string = "共 " + (e.total_players || 3) + " 人参赛";
p.fontSize = 16;
p.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
u.color = new cc.Color(200, 200, 220);
u.y = i / 2 - 75;
u.parent = a;
var g = e.top3 || [], _ = i / 2 - 145;
g.length >= 2 && this._createPodiumEntry(a, g[1], 2, -170, _);
g.length >= 1 && this._createPodiumEntry(a, g[0], 1, 0, _ + 20);
g.length >= 3 && this._createPodiumEntry(a, g[2], 3, 170, _ - 10);
var f = e.top20 || [];
if (f.length > 0) {
var m = new cc.Node("ListTitle"), C = m.addComponent(cc.Label);
C.string = "—— 排行榜 ——";
C.fontSize = 18;
C.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
m.color = new cc.Color(180, 160, 120);
m.y = i / 2 - 260;
m.parent = a;
var v = new cc.Node("ScrollView");
v.width = 560;
v.height = 280;
v.y = -30;
v.parent = a;
v.addComponent(cc.Mask).type = cc.Mask.Type.RECT;
var w = new cc.Node("Content");
w.width = 560;
w.anchorY = 1;
w.y = v.height / 2;
w.parent = v;
for (var y = {}, b = 0; b < g.length; b++) g[b] && g[b].player_id && (y[g[b].player_id] = !0);
var S = [];
for (b = 0; b < f.length; b++) (N = f[b]) && N.player_id && !y[N.player_id] && S.push(N);
for (b = 0; b < S.length; b++) {
var N = S[b], L = b + 4, A = this._createRankListItem(N, L, 550);
A.y = 0 - 45 * b - 22.5;
A.parent = w;
}
w.height = Math.max(45 * S.length, 280);
this._addScrollViewTouch(v, w, 280);
}
var T = new cc.Node("BottomSep"), R = T.addComponent(cc.Graphics);
R.strokeColor = new cc.Color(255, 200, 80, 100);
R.lineWidth = 1;
R.moveTo(-270, 0);
R.lineTo(270, 0);
R.stroke();
T.y = -i / 2 + 140;
T.parent = a;
var k = new cc.Node("MyRankBg"), z = k.addComponent(cc.Graphics);
z.fillColor = new cc.Color(50, 45, 80, 200);
z.roundRect(-200, -22, 400, 44, 8);
z.fill();
z.strokeColor = new cc.Color(255, 200, 80, 150);
z.lineWidth = 1;
z.roundRect(-200, -22, 400, 44, 8);
z.stroke();
k.y = -i / 2 + 100;
k.parent = a;
var P = new cc.Node("MyRank"), E = P.addComponent(cc.Label);
E.string = "我的排名: 第 " + (e.my_rank || 1) + " 名  |  比赛金币: " + (e.my_match_coin || 0);
E.fontSize = 20;
E.enableBold = !0;
E.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
P.color = new cc.Color(255, 230, 150);
P.y = -i / 2 + 100;
P.parent = a;
var I = new cc.Node("ConfirmBtn");
I.width = 180;
I.height = 50;
var D = I.addComponent(cc.Graphics);
D.fillColor = new cc.Color(76, 175, 80);
D.roundRect(-90, -25, 180, 50, 10);
D.fill();
D.strokeColor = new cc.Color(129, 199, 132);
D.lineWidth = 2;
D.roundRect(-90, -25, 180, 50, 10);
D.stroke();
I.y = -i / 2 + 40;
I.parent = a;
var B = new cc.Node("Label"), M = B.addComponent(cc.Label);
M.string = "确  定";
M.fontSize = 24;
M.enableBold = !0;
M.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
M.verticalAlign = cc.Label.VerticalAlign.CENTER;
B.setContentSize(180, 50);
B.color = new cc.Color(255, 255, 255);
B.setPosition(0, 0);
B.parent = I;
I.on(cc.Node.EventType.TOUCH_START, function() {
I.scale = .95;
});
I.on(cc.Node.EventType.TOUCH_END, function() {
I.scale = 1;
a.destroy();
t.destroy();
cc.director.loadScene("hallScene");
});
I.on(cc.Node.EventType.TOUCH_CANCEL, function() {
I.scale = 1;
});
cc.tween(a).to(.2, {
scale: 1,
opacity: 255
}, {
easing: "backOut"
}).start();
console.log("🏆 [_showTournamentFinalRankDialog] 最终榜单弹窗已显示");
},
_createRankListItem: function(e, o, n) {
var t = new cc.Node("RankItem_" + o);
t.width = n;
t.height = 42;
var a = new cc.Node("Bg"), i = a.addComponent(cc.Graphics);
i.fillColor = o % 2 == 0 ? new cc.Color(45, 38, 70, 180) : new cc.Color(38, 32, 58, 180);
i.roundRect(-n / 2, -20, n, 40, 6);
i.fill();
a.parent = t;
var r = new cc.Node("Rank"), c = r.addComponent(cc.Label);
c.string = String(o);
c.fontSize = 18;
c.enableBold = !0;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
r.color = new cc.Color(255, 200, 100);
r.setPosition(-n / 2 + 35, 0);
r.parent = t;
var l = new cc.Node("Avatar");
l.setPosition(-n / 2 + 75, 0);
var s = l.addComponent(cc.Sprite);
s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
l.setContentSize(32, 32);
l.parent = t;
this._loadAvatarSprite(s, e.avatar, e.is_robot);
var d = new cc.Node("Name"), h = d.addComponent(cc.Label), u = e.player_name || "玩家";
h.string = u;
h.fontSize = 16;
h.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
h.overflow = cc.Label.Overflow.CLAMP;
d.width = 150;
d.color = new cc.Color(255, 255, 255);
d.setPosition(-n / 2 + 145, 0);
d.parent = t;
var p = new cc.Node("Coin"), g = p.addComponent(cc.Label);
g.string = (e.match_coin || 0) + " 金币";
g.fontSize = 15;
g.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
p.color = new cc.Color(255, 220, 150);
p.setPosition(n / 2 - 60, 0);
p.parent = t;
return t;
},
_addScrollViewTouch: function(e, o, n) {
var t = 0, a = 0;
Math.max(0, o.height - n);
e.on(cc.Node.EventType.TOUCH_START, function(e) {
t = e.getLocationY();
a = o.y;
});
e.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
var i = e.getLocationY(), r = a + (i - t), c = n / 2 - o.height, l = n / 2;
r = Math.max(c, Math.min(l, r));
o.y = r;
});
},
_createPodiumEntry: function(e, o, n, t, a) {
var i = new cc.Node("PodiumEntry_" + n);
i.setPosition(t, a);
var r, c, l = new cc.Node("Bg"), s = l.addComponent(cc.Graphics);
if (1 === n) {
r = new cc.Color(100, 85, 40, 230);
c = new cc.Color(255, 215, 0);
} else if (2 === n) {
r = new cc.Color(70, 75, 85, 230);
c = new cc.Color(192, 192, 192);
} else {
r = new cc.Color(85, 60, 45, 230);
c = new cc.Color(205, 127, 50);
}
s.fillColor = r;
s.roundRect(-55, -70, 110, 140, 12);
s.fill();
s.strokeColor = c;
s.lineWidth = 2;
s.roundRect(-55, -70, 110, 140, 12);
s.stroke();
l.parent = i;
var d, h = new cc.Node("Medal"), u = h.addComponent(cc.Graphics);
d = 1 === n ? new cc.Color(255, 215, 0) : 2 === n ? new cc.Color(192, 192, 192) : new cc.Color(205, 127, 50);
u.fillColor = d;
u.circle(0, 45, 22);
u.fill();
u.strokeColor = new cc.Color(255, 255, 255, 150);
u.lineWidth = 2;
u.circle(0, 45, 22);
u.stroke();
h.parent = i;
var p = new cc.Node("RankNum"), g = p.addComponent(cc.Label);
g.string = String(n);
g.fontSize = 24;
g.enableBold = !0;
g.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
p.color = new cc.Color(50, 40, 30);
p.setPosition(0, 45);
p.parent = i;
var _ = new cc.Node("Avatar");
_.setPosition(0, 20);
var f = _.addComponent(cc.Sprite);
f.sizeMode = cc.Sprite.SizeMode.CUSTOM;
_.setContentSize(50, 50);
_.parent = i;
this._loadAvatarSprite(f, o.avatar, o.is_robot);
var m = new cc.Node("AvatarFrame"), C = m.addComponent(cc.Graphics);
C.strokeColor = c;
C.lineWidth = 2;
C.circle(0, 20, 26);
C.stroke();
m.parent = i;
var v = new cc.Node("Name"), w = v.addComponent(cc.Label), y = o.player_name || "玩家";
w.string = y;
w.fontSize = 18;
w.enableBold = !0;
w.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
v.color = new cc.Color(255, 255, 255);
v.y = 5;
v.parent = i;
var b = new cc.Node("Coin"), S = b.addComponent(cc.Label);
S.string = (o.match_coin || 0) + " 金币";
S.fontSize = 16;
S.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
b.color = new cc.Color(255, 230, 150);
b.y = -25;
b.parent = i;
i.parent = e;
},
_getRobotDisplayName: function(e, o) {
if (o) return o;
var n = 1;
if (e) {
var t = e.toString().slice(-1);
n = parseInt(t) || 1;
}
return "智能陪练" + n + "号";
},
_loadAvatarSprite: function(e, o, n) {
if (e) if (o && "" !== o) {
if (0 === o.indexOf("http") || 0 === o.indexOf("//") || 0 === o.indexOf("/uploads")) {
var t = o;
if (0 === o.indexOf("/uploads")) {
var a = window.myglobal;
t = (a && a.cdnUrl ? a.cdnUrl : "https://apis.hongxiu88.com") + o;
}
cc.assetManager.loadRemote(t, {
ext: ".png"
}, function(o, n) {
if (!o && n) try {
if (e.isValid) {
var t = new cc.SpriteFrame(n);
e.spriteFrame = t;
}
} catch (o) {
cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(o, n) {
!o && n && e.isValid && (e.spriteFrame = n);
});
} else cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(o, n) {
!o && n && e.isValid && (e.spriteFrame = n);
});
});
return;
}
var i = "UI/headimage/" + o;
cc.resources.load(i, cc.SpriteFrame, function(o, n) {
!o && n && e.isValid ? e.spriteFrame = n : cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(o, n) {
!o && n && e.isValid && (e.spriteFrame = n);
});
});
} else {
var r = "UI/headimage/avatar_" + (n ? Math.floor(3 * Math.random()) + 1 : 1);
cc.resources.load(r, cc.SpriteFrame, function(o, n) {
!o && n && e.isValid && (e.spriteFrame = n);
});
}
},
_setupUserActivityDetection: function() {
var e = this;
this.node.on(cc.Node.EventType.TOUCH_START, function() {
e._onUserActivity("touch_start");
}, this);
this.node.on(cc.Node.EventType.TOUCH_MOVE, function() {
e._onUserActivity("touch_move");
}, this);
this.node.on(cc.Node.EventType.MOUSE_MOVE, function() {
e._onUserActivity("mouse_move");
}, this);
console.log("🖐️ [用户活动检测] 已启动");
}
})._onUserActivity = function(e) {
var o = Date.now();
if (!(o - this._lastUserActivityTime < this._userActivityThrottle)) {
this._lastUserActivityTime = o;
if ("bidding" === this._gamePhase || "playing" === this._gamePhase) {
var n = window.myglobal;
if (n && n.socket) {
console.log("🖐️ [用户活动] 检测到用户活动:", e, "，发送取消托管请求");
n.socket.cancelTrustee && n.socket.cancelTrustee();
}
}
}
}, n._isCurrentPlayerTrustee = function() {
if (this._isLocalTrustee) return !0;
var e = window.myglobal;
if (!e || !e.playerData) return !1;
var o = this.node.parent;
if (!o) return !1;
var n = e.socket.getPlayerInfo().id || e.playerData.serverPlayerId || e.playerData.accountID, t = o.getComponent("gameScene");
if (t && t.playerNodeList) for (var a = 0; a < t.playerNodeList.length; a++) {
var i = t.playerNodeList[a];
if (i) {
var r = i.getComponent("player_node");
if (r && String(r.accountid) === String(n)) return r._isTrustee || !1;
}
}
return !1;
}, n));
cc._RF.pop();
}, {} ],
hallScene: [ function(e, o) {
"use strict";
cc._RF.push(o, "d2b3cTV5veJAavN7xI0Vnkh", "hallScene");
var n;
cc.Class(((n = {
extends: cc.Component,
properties: {
nickname_label: cc.Label,
headimage: cc.Sprite,
gobal_count: cc.Label,
arena_coin_label: cc.Label,
creatroom_prefabs: cc.Prefab,
joinroom_prefabs: cc.Prefab,
user_agreement_prefabs: cc.Prefab
},
onLoad: function() {
if (window.myglobal) this._initWithPlayerData(); else {
console.warn("myglobal 未定义，等待初始化...");
this._waitForMyglobal();
}
},
update: function(e) {
this._loadingImageAnimating && this._loadingImageNode && this._loadingImageNode.isValid && (this._loadingImageNode.angle += 180 * e);
this._quickEnterAnimating && this._quickEnterLoadingNode && this._quickEnterLoadingNode.isValid && (this._quickEnterLoadingNode.angle += 180 * e);
this._wsLoadingAnimating && this._wsLoadingSpriteNode && this._wsLoadingSpriteNode.isValid && (this._wsLoadingSpriteNode.angle += 180 * e);
},
_waitForMyglobal: function() {
var e = this, o = 0;
setTimeout(function n() {
o++;
if (window.myglobal && window.myglobal.playerData) e._initWithPlayerData(); else if (o < 20) setTimeout(n, 100); else {
console.error("myglobal 初始化超时");
cc.director.loadScene("loginScene");
}
}, 100);
},
_initWithPlayerData: function() {
var e = window.myglobal;
if (e && e.playerData) {
this._arenaRoomJoinedProcessed = !1;
this._arenaLoadingInProgress = !1;
this._enterGameSceneInProgress = !1;
if (e.playerData.token) {
var o = this;
if ("function" == typeof e.verifyToken) try {
e.verifyToken(function(e) {
e ? o._initUIAfterAuth() : cc.director.loadScene("loginScene");
});
} catch (e) {
console.error("verifyToken 调用失败:", e);
o._initUIAfterAuth();
} else {
console.warn("verifyToken 方法不存在，跳过验证");
o._initUIAfterAuth();
}
} else cc.director.loadScene("loginScene");
} else {
console.error("myglobal 或 playerData 未定义");
cc.director.loadScene("loginScene");
}
},
_initUIAfterAuth: function() {
try {
this._checkAndShowWebSocketLoading();
this._initUserSettings();
var e = window.myglobal, o = e ? e.playerData : null;
if (!o) {
console.warn("playerData 为空，使用默认值");
o = {
nickName: "游客",
gobal_count: 0,
avatarUrl: null
};
}
var n = this.nickname_label;
if (!n || void 0 === n.string) {
var t = this._findNodeByName(this.node, "nickname_label");
t && (n = t.getComponent(cc.Label));
}
n ? n.string = o.nickName || "游客" : console.warn("【大厅】nickname_label 未找到，请检查场景文件");
this._currentRoomCategory = 1;
this._updateCurrencyDisplay();
this._adjustGoldElementsPosition();
this._loadUserAvatar(o.avatarUrl);
this.roomConfigs = [];
this._initArenaCoinDisplay();
this._refreshPlayerBalance();
this._listenArenaCoinUpdate();
this._playHallBackgroundMusic();
this._adjustBottomButtons();
this._hideBackgroundCharacters();
this._initWebSocket();
this._startOnlineMonitoring();
this._fetchRoomConfigs();
this._removeNoticeBoard();
this._preloadGameScene();
this._initTopButtons();
} catch (e) {
console.error("_initUIAfterAuth 异常:", e);
}
},
_startOnlineMonitoring: function() {
var e = window.myglobal;
if (e) {
e.startOnlineMonitoring && e.startOnlineMonitoring();
var o = this;
this._onlineStatusHandler = function(n) {
n || e._isInitializing ? !n && e._isInitializing : o._showOfflineMessage();
};
e.addOnlineStatusListener && e.addOnlineStatusListener(this._onlineStatusHandler);
e.eventlister && e.eventlister.on("force_logout", function(e) {
console.warn("🚫 收到强制下线事件:", e);
o._handleForceLogout(e);
});
} else console.warn("myglobal 未定义，无法启动在线监测");
},
_showOfflineMessage: function() {
this.node && this.node.isValid ? this._showMessage("网络连接已断开，正在重新连接...") : console.log("🏟️ [HallScene] 节点已销毁，跳过离线提示");
},
_handleForceLogout: function(e) {
var o = e.reason || "您已被强制下线";
this._showMessage(o);
var n = window.myglobal;
n && n.stopOnlineMonitoring && n.stopOnlineMonitoring();
this.scheduleOnce(function() {
cc.director.loadScene("loginScene");
}, 2);
},
_stopOnlineMonitoring: function() {
var e = window.myglobal;
e && e.stopOnlineMonitoring && e.stopOnlineMonitoring();
if (e && e.removeOnlineStatusListener && this._onlineStatusHandler) {
e.removeOnlineStatusListener(this._onlineStatusHandler);
this._onlineStatusHandler = null;
}
},
_preloadGameScene: function() {
var e = this;
Date.now();
cc.director.preloadScene("gameScene", function(o) {
if (o) console.error("🚀 [预加载] 游戏场景预加载失败:", o); else {
Date.now();
e._gameScenePreloaded = !0;
}
});
},
_checkAndShowWebSocketLoading: function() {
var e = window.myglobal, o = e && e.socket, n = o && o.isWebSocketOpen && o.isWebSocketOpen(), t = o && o.isConnected && o.isConnected(), a = o && o.isAuthenticated && o.isAuthenticated(), i = o && o.hasConnectionToken && o.hasConnectionToken();
console.log("🔌 [WebSocket] 检查连接状态: isWebSocketOpen=" + n + ", isConnected=" + t + ", isAuthenticated=" + a + ", hasConnectionToken=" + i);
if (n) console.log("🔌 [WebSocket] 物理连接已建立，跳过Loading界面"); else {
this._showWebSocketLoading();
var r = this, c = window.evt || window.myglobal && window.myglobal.eventlister;
if (c) {
var l = function e() {
console.log("🔌 [WebSocket] 连接成功，关闭Loading界面");
r._hideWebSocketLoading();
c.off("connection_success", e);
};
c.on("connection_success", l);
this._wsLoadingTimeout = setTimeout(function() {
console.log("🔌 [WebSocket] 连接超时，关闭Loading界面");
r._hideWebSocketLoading();
c.off("connection_success", l);
}, 5e3);
}
}
},
_showWebSocketLoading: function() {
if (!this._wsLoadingNode || !this._wsLoadingNode.isValid) {
console.log("🔌 [WebSocket] 显示Loading界面");
var e = new cc.Node("WebSocketLoading");
e.setPosition(0, 0);
e.setContentSize(1280, 720);
var o = new cc.Node("Background");
o.setContentSize(1280, 720);
var n = o.addComponent(cc.Graphics);
n.fillColor = new cc.Color(0, 0, 0, 180);
n.rect(-640, -360, 1280, 720);
n.fill();
o.parent = e;
var t = new cc.Node("Container");
t.setPosition(0, 0);
t.setContentSize(200, 200);
cc.resources.load("UI/loading_image", cc.SpriteFrame, function(o, n) {
if (o) console.error("🔌 [WebSocket] 加载loading_image失败:", o); else if (e && e.isValid && t && t.isValid) {
var a = new cc.Node("LoadingSprite");
a.addComponent(cc.Sprite).spriteFrame = n;
a.setPosition(0, 0);
a.parent = t;
a.angle = 0;
this._wsLoadingSpriteNode = a;
}
}.bind(this));
var a = new cc.Node("TipLabel");
a.setPosition(0, -120);
var i = a.addComponent(cc.Label);
i.string = "正在连接服务器...";
i.fontSize = 24;
i.lineHeight = 30;
i.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
a.color = new cc.Color(255, 255, 255);
a.parent = t;
t.parent = e;
this.node.addChild(e);
e.zIndex = 9999;
this._wsLoadingNode = e;
this._wsLoadingAnimating = !0;
}
},
_hideWebSocketLoading: function() {
if (this._wsLoadingTimeout) {
clearTimeout(this._wsLoadingTimeout);
this._wsLoadingTimeout = null;
}
if (this._wsLoadingNode && this._wsLoadingNode.isValid) {
this._wsLoadingNode.destroy();
this._wsLoadingNode = null;
}
this._wsLoadingAnimating = !1;
this._wsLoadingSpriteNode = null;
console.log("🔌 [WebSocket] Loading界面已关闭");
},
_initWebSocket: function() {
var e = window.myglobal;
if (e && e.socket) {
if (!e.socket.isAuthenticated || !e.socket.isAuthenticated()) {
e.playerData && e.playerData.token && e.socket.hasConnectionToken && !e.socket.hasConnectionToken() && console.log("🔌 [HallScene] 检测到连接无Token，需要重新连接...");
e.socket.initSocket && e.socket.initSocket();
}
} else console.warn("socket 未初始化");
},
_findNodeByName: function(e, o) {
var n = e.getChildByName(o);
if (n) return n;
for (var t = e.children, a = 0; a < t.length; a++) {
var i = t[a];
if (n = this._findNodeByName(i, o)) return n;
}
return null;
},
_hideBackgroundCharacters: function() {
var e = this.node.getChildByName("xiongmao1"), o = this.node.getChildByName("xiongmao2");
e && (e.active = !1);
o && (o.active = !1);
},
_adjustBottomButtons: function() {
for (var e = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), o = e ? e.designResolution.height : 720, n = e ? e.designResolution.width : 1280, t = [ "btn_create_room", "btn_join_room", "btn_user_agreement", "user_agreement", "btn_setting", "btn_help" ], a = [], i = 0; i < t.length; i++) (l = this.node.getChildByName(t[i])) && !1 !== l.active && a.push(l);
if (0 === a.length) {
var r = this.node.children;
for (i = 0; i < r.length; i++) {
var c = r[i];
c.name && c.name.toLowerCase().indexOf("btn") >= 0 && c.y < 0 && a.push(c);
}
}
for (i = 0; i < a.length; i++) {
var l, s = (l = a[i]).getComponent(cc.Widget);
s && (s.enabled = !1);
l.scale = .7;
l.anchorX = 1;
l.anchorY = 0;
var d = n / 2 - 30 - 99 * i, h = -o / 2 + 30;
l.x = d;
l.y = h;
}
},
_loadUserAvatar: function(e) {
var o = this;
this.headimage && (e ? 0 === e.indexOf("http://") || 0 === e.indexOf("https://") ? cc.assetManager.loadRemote(e, {
ext: ".png"
}, function(e, n) {
if (!e && n) try {
var t = new cc.SpriteFrame(n);
t && (o.headimage.spriteFrame = t);
} catch (e) {
o._loadDefaultAvatar();
} else o._loadDefaultAvatar();
}) : cc.resources.load("UI/headimage/" + e, cc.SpriteFrame, function(e, n) {
if (!e && n) try {
o.headimage.spriteFrame = n;
} catch (e) {
o._loadDefaultAvatar();
} else o._loadDefaultAvatar();
}) : this._loadDefaultAvatar());
},
_loadDefaultAvatar: function() {
var e = this;
cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(o, n) {
if (!o && n) try {
e.headimage.spriteFrame = n;
} catch (e) {}
});
},
_initUserSettings: function() {
var e = {
bgm: 1,
sfx: 1,
vibration: 1
};
if ("undefined" != typeof StorageUtil) {
var o = StorageUtil.getItem(StorageUtil.KEYS.USER_SETTINGS, null, !0);
if (o && "object" == typeof o) {
e.bgm = void 0 !== o.bgm ? o.bgm : 1;
e.sfx = void 0 !== o.sfx ? o.sfx : 1;
e.vibration = void 0 !== o.vibration ? o.vibration : 1;
}
}
window.isopen_sound = e.bgm;
window.isopen_sfx = e.sfx;
window.isopen_vibration = e.vibration;
console.log("[Settings] 初始化设置完成:", JSON.stringify(e));
},
_playHallBackgroundMusic: function() {
window.isopen_sound;
try {
cc.audioEngine.stopMusic();
cc.audioEngine.stopAllEffects();
cc.resources.load("sound/login_bg", cc.AudioClip, function(e, o) {
if (!e && o) try {
cc.audioEngine.playMusic(o, !0);
} catch (e) {}
});
} catch (e) {}
},
_fetchRoomConfigs: function() {
var e = this, o = window.defines ? window.defines.apiUrl : "", n = window.defines ? window.defines.cryptoKey : "";
if (o && window.HttpAPI) try {
HttpAPI._roomConfigCache && (HttpAPI._roomConfigCache = null);
try {
localStorage.removeItem("room_config_cache");
} catch (e) {}
HttpAPI.get(o + "/api/v1/room/config/list", n, function(o, n) {
if (o) {
console.warn("API请求失败:", o);
e._initRoomButtons(e._getDefaultRoomConfigs());
} else {
var t = null;
n && 0 === n.code && n.data ? t = n.data : n && Array.isArray(n) && (t = n);
if (t) for (var a = 0; a < t.length; a++) t[a];
if (t && t.length > 0) {
e.roomConfigs = t;
e._initRoomButtons(t);
} else e._initRoomButtons(e._getDefaultRoomConfigs());
}
});
} catch (o) {
console.error("_fetchRoomConfigs 异常:", o);
e._initRoomButtons(e._getDefaultRoomConfigs());
} else e._initRoomButtons(e._getDefaultRoomConfigs());
},
_getDefaultRoomConfigs: function() {
return [ {
id: 1,
room_name: "初级房",
room_type: 2,
base_score: 1,
multiplier: 1,
min_gold: 0,
max_gold: 5e4,
description: "底分1",
status: 1,
sort_order: 0,
room_category: 1
}, {
id: 2,
room_name: "中级房",
room_type: 3,
base_score: 2,
multiplier: 1,
min_gold: 5e4,
max_gold: 2e5,
description: "底分2",
status: 1,
sort_order: 1,
room_category: 1
}, {
id: 3,
room_name: "高级房",
room_type: 4,
base_score: 5,
multiplier: 2,
min_gold: 2e5,
max_gold: 1e6,
description: "底分5",
status: 1,
sort_order: 2,
room_category: 2
}, {
id: 4,
room_name: "娱乐房",
room_type: 5,
base_score: 10,
multiplier: 3,
min_gold: 1e6,
max_gold: 5e6,
description: "底分10",
status: 1,
sort_order: 3,
room_category: 2
}, {
id: 5,
room_name: "娱乐房",
room_type: 6,
base_score: 20,
multiplier: 5,
min_gold: 5e6,
max_gold: 0,
description: "底分20",
status: 1,
sort_order: 4,
room_category: 2
} ];
},
_hideUnwantedButtons: function() {
var e = this.node.getChildByName("btn_create_room"), o = this.node.getChildByName("btn_join_room");
e && (e.active = !1);
o && (o.active = !1);
},
_initRoomButtons: function(e) {
var o = this, n = {
2: "btn_room_junior",
3: "btn_room_middle",
4: "btn_room_senior",
5: "btn_room_master",
6: "btn_room_supreme"
};
for (var t in n) (d = this.node.getChildByName(n[t])) && (d.active = !1);
for (var a = [], i = 0; i < e.length; i++) {
var r = e[i], c = r.sort_order || r.sortOrder || r.sort || 0, l = r.room_type || r.roomType, s = n[l];
if (s) {
var d;
if (d = this.node.getChildByName(s)) {
var h = {
node: d,
config: r,
roomType: l,
sortOrder: c,
roomName: r.room_name || r.roomName || "未知房间",
minGold: r.min_gold || r.minGold || 0,
maxGold: r.max_gold || r.maxGold || 0,
roomCategory: r.room_category || r.roomCategory || 1
};
a.push(h);
}
}
}
a.sort(function(e, o) {
return e.sortOrder - o.sortOrder;
});
for (i = 0; i < a.length; i++) {
var u = a[i];
u.node.active = !0;
u.node.roomConfig = u.config;
o._loadRoomButtonBg(u.node, u.roomType);
o._updateMinGoldLabel(u.node, u.config);
var p = u.node.getComponent(cc.Button);
if (p) {
p.transition = cc.Button.Transition.SCALE;
p.duration = .1;
p.zoomScale = 1.1;
}
if (2 === u.roomCategory) {
o._arenaRooms || (o._arenaRooms = []);
o._arenaRooms.push(u);
}
(function(e, n, t, a) {
n.off(cc.Node.EventType.TOUCH_END);
n.on(cc.Node.EventType.TOUCH_END, function(n) {
n.stopPropagation();
2 !== a && o._onRoomButtonClick(e);
});
})(u.config, u.node, u.roomName, u.roomCategory);
}
this._renderRoomLayout(a);
this._addArenaSignupButtons();
this._fetchSignupStatusAndUpdateUI();
},
_fetchSignupStatusAndUpdateUI: function() {
var e = this;
window.arenaData && window.arenaData.fetchSignupStatusFromServer ? window.arenaData.fetchSignupStatusFromServer(function(o) {
o && console.warn("🏟️ 获取报名状态失败，使用本地缓存:", o);
e._updateArenaSignupStatus();
}) : this._updateArenaSignupStatus();
},
_renderRoomLayout: function(e) {
var o = this.node.getChildByName("CardContainer"), n = this.node.getChildByName("LeftArea"), t = this.node.getChildByName("RightArea");
o && o.destroy();
n && n.destroy();
t && t.destroy();
if (0 !== e.length) {
var a = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), i = (a && a.designResolution.height, 
a ? a.designResolution.width : 1280), r = 180 * e.length + 30 * (e.length - 1), c = Math.max(r + 40, i - 100), l = new cc.Node("CardContainer");
l.setContentSize(c, 160);
l.anchorX = .5;
l.anchorY = .5;
l.x = 0;
l.y = 20;
l.parent = this.node;
for (var s = -r / 2 + 90, d = 0; d < e.length; d++) {
var h = e[d], u = h.node.getComponent(cc.Widget);
u && (u.enabled = !1);
h.node.anchorX = .5;
h.node.anchorY = .5;
h.node.scale = 1;
h.node.active = !0;
h.node.parent = l;
h.node.x = s + 210 * d;
h.node.y = 0;
}
}
},
_addAreaTitle: function(e, o, n, t) {
var a = new cc.Node("AreaTitle");
a.setPosition(n, t);
a.anchorX = .5;
a.anchorY = .5;
var i = a.addComponent(cc.Label);
i.string = o;
i.fontSize = 28;
i.lineHeight = 36;
i.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
a.color = cc.color(255, 215, 0);
var r = a.addComponent(cc.LabelOutline);
r.color = cc.color(0, 0, 0);
r.width = 2;
a.parent = e;
},
_prepareCardNodeResponsive: function(e, o) {
var n = e.getComponent(cc.Widget);
n && (n.enabled = !1);
e.anchorX = .5;
e.anchorY = .5;
e.scale = o || 1;
}
})._addAreaTitle = function(e, o, n, t) {
var a = new cc.Node("Title");
a.setPosition(n, t);
a.anchorX = 0;
a.anchorY = .5;
var i = a.addComponent(cc.Label);
i.string = o;
i.fontSize = 28;
i.lineHeight = 36;
i.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
a.color = cc.color(255, 215, 0);
var r = a.addComponent(cc.LabelOutline);
r.color = cc.color(0, 0, 0);
r.width = 2;
a.parent = e;
}, n._loadRoomButtonBg = function(e, o) {
var n = this, t = e.getComponent(cc.Sprite);
t && cc.resources.load("UI/btn_happy_" + o, cc.SpriteFrame, function(o, a) {
if (!o && a) try {
t.spriteFrame = a;
} catch (o) {
n._loadDefaultRoomButtonBg(e);
} else n._loadDefaultRoomButtonBg(e);
});
}, n._loadDefaultRoomButtonBg = function(e) {
var o = e.getComponent(cc.Sprite);
o && cc.resources.load("UI/btn_happy_2", cc.SpriteFrame, function(e, n) {
if (!e && n) try {
o.spriteFrame = n;
} catch (e) {}
});
}, n._updateMinGoldLabel = function(e, o) {
var n = e.getChildByName("min_gold_label"), t = o.room_category || o.roomCategory || 1;
if (!n) {
(c = (n = new cc.Node("min_gold_label")).addComponent(cc.Label)).fontSize = 22;
c.lineHeight = 28;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
n.anchorX = .5;
n.anchorY = .5;
var a = n.addComponent(cc.LabelOutline);
a.color = cc.color(0, 0, 0);
a.width = 2;
n.zIndex = 100;
n.parent = e;
}
var i, r, c = n.getComponent(cc.Label);
if (2 === t) {
i = o.min_arena_coin || o.minArenaCoin || 0;
r = "币";
n.color = cc.color(255, 255, 255);
c.string = this._formatGold(i) + " " + r;
} else {
i = o.min_gold || o.minGold || 0;
r = "豆";
n.color = cc.color(255, 255, 255);
c.string = "最低 " + this._formatGold(i) + " " + r;
}
var l = e.height || 375, s = -l / 2 + .16 * l;
n.setPosition(0, s);
}, n._onRoomButtonClick = function(e) {
window.myglobal;
var o = e.room_category || e.roomCategory || 1;
this._currentRoomCategory = o;
this._updateCurrencyDisplay();
2 === o ? this._onArenaRoomButtonClick(e) : this._onNormalRoomButtonClick(e);
}, n._onNormalRoomButtonClick = function(e) {
var o = window.myglobal, n = o && o.playerData ? o.playerData.gobal_count : 0, t = e.min_gold || e.minGold || 0, a = e.max_gold || e.maxGold || 0;
if (n < t) this._showAdRewardDialog("gold", t - n); else if (a > 0 && n > a) this._showMessage("欢乐豆超过上限，请前往更高级房间"); else {
if (o) {
o.currentRoomConfig = e;
o.currentRoomLevel = e.room_type;
o.currentRoomName = e.room_name;
}
this._quickMatch(e, n);
}
}, n._onArenaRoomButtonClick = function(e, o) {
window.myglobal;
var n = e.id;
window.arenaData && window.arenaData.isSignedUp(n) ? this._showMessage("您已报名此竞技场") : window.arenaData && this._hasSignedUpOtherArena(n) ? this._showMessage("您已报名其他竞技场，每场只能报名一个级别") : this._doArenaSignup(e, o);
}, n._hasSignedUpOtherArena = function(e) {
if (!window.arenaData || !this._arenaRooms) return !1;
for (var o = 0; o < this._arenaRooms.length; o++) {
var n = this._arenaRooms[o].config.id;
if (n !== e && window.arenaData.isSignedUp(n)) return !0;
}
return !1;
}, n._doArenaSignup = function(e) {
var o = this;
this._showMessage("正在报名...");
window.arenaData && window.arenaData.signup(e.id, function(e) {
if (e) o._showMessage(e || "报名失败"); else {
o._showMessage("报名成功！");
window.arenaData.refreshBalance && window.arenaData.refreshBalance();
o._updateArenaSignupStatus();
}
});
}, n._addArenaSignupButtons = function() {
var e = this;
if (this._arenaRooms) {
var o = this.node.getChildByName("CardContainer");
if (o) {
var n = o.getChildByName("ArenaSignupButtons");
n && n.destroy();
var t = o.getChildByName("ArenaCountdowns");
t && t.destroy();
var a = new cc.Node("ArenaSignupButtons");
a.parent = o;
var i = new cc.Node("ArenaCountdowns");
i.parent = o;
for (var r = 0; r < this._arenaRooms.length; r++) {
var c = this._arenaRooms[r], l = c.node, s = c.config, d = cc.color(255, 180, 100, 140), h = new cc.Node("RoomStatusItem_" + s.id);
h.setContentSize(cc.size(l.width, 72));
h.anchorX = .5;
h.anchorY = .5;
h.x = l.x;
h.y = l.y + l.height / 2 - 36 + 10;
h.roomConfig = s;
h.cardNode = l;
var u = new cc.Node("Bg"), p = u.addComponent(cc.Graphics);
p.fillColor = d;
p.roundRect(-80, -36, 160, 72, 5);
p.fill();
u.parent = h;
var g = new cc.Node("PeriodLabel"), _ = g.addComponent(cc.Label);
_.string = "期号: --";
_.fontSize = 16;
_.lineHeight = 20;
_.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
_.verticalAlign = cc.Label.VerticalAlign.CENTER;
_.enableBold = !0;
g.color = cc.color(255, 255, 255);
g.anchorX = .5;
g.anchorY = .5;
g.y = 14;
g.parent = h;
var f = g.addComponent(cc.LabelOutline);
f.color = cc.color(138, 66, 0);
f.width = 2;
var m = new cc.Node("TitleLabel"), C = m.addComponent(cc.Label);
C.string = "暂未开放";
C.fontSize = 16;
C.lineHeight = 20;
C.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
C.verticalAlign = cc.Label.VerticalAlign.CENTER;
C.enableBold = !0;
m.color = cc.color(255, 255, 255);
m.anchorX = .5;
m.anchorY = .5;
m.y = -14;
m.parent = h;
var v = m.addComponent(cc.LabelOutline);
v.color = cc.color(138, 66, 0);
v.width = 2;
h.parent = i;
var w = new cc.Node("SignupBtn_" + s.id), y = w.addComponent(cc.Sprite);
y.type = cc.Sprite.Type.SIMPLE;
y.sizeMode = cc.Sprite.SizeMode.CUSTOM;
w.setContentSize(cc.size(160, 65));
w.anchorX = .5;
w.anchorY = .5;
w.x = l.x;
w.y = l.y - l.height / 2 + 32.5 - 10;
w.roomConfig = s;
w.roomId = s.id;
w.cardNode = l;
var b = w.addComponent(cc.Button);
b.transition = cc.Button.Transition.SCALE;
b.duration = .1;
b.zoomScale = 1.08;
(function(o, n, t) {
t.on(cc.Node.EventType.TOUCH_END, function(a) {
a.stopPropagation();
e._onArenaSignupButtonClick(o, n, t);
});
})(s, l, w);
w.parent = a;
}
var S = o.height;
o.setContentSize(o.width, S + 70);
this._loadSignupButtonImages();
this._startCountdownTimer();
} else console.warn("CardContainer not found");
}
}, n._loadSignupButtonImages = function() {
var e = this, o = [ "UI/button/btn_baoming", "UI/button/btn_quxiaobaoming", "UI/button/btn_no_baoming" ];
this._signupBtnFrames = {};
for (var n = 0, t = 0; t < o.length; t++) (function(t) {
cc.resources.load(o[t], cc.SpriteFrame, function(a, i) {
if (!a && i) {
var r = o[t].split("/").pop();
e._signupBtnFrames[r] = i;
}
++n === o.length && e._updateArenaSignupStatus();
});
})(t);
}, n._isInMatchTime = function(e) {
var o = e.match_time_ranges || e.matchTimeRanges;
if (!o) return !0;
try {
var n = "string" == typeof o ? JSON.parse(o) : o;
if (!n || 0 === n.length) return !0;
for (var t = new Date(), a = 60 * t.getHours() + t.getMinutes(), i = 0; i < n.length; i++) {
var r = n[i], c = r.start.split(":"), l = r.end.split(":"), s = 60 * parseInt(c[0]) + parseInt(c[1]), d = 60 * parseInt(l[0]) + parseInt(l[1]);
if (a >= s && a <= d) return !0;
}
return !1;
} catch (e) {
console.error("🕐 [_isInMatchTime] parse error:", e);
return !0;
}
}, n._canSignupArena = function(e) {
var o = e.match_time_ranges || e.matchTimeRanges, n = e.match_duration || e.matchDuration || e.interval_minutes || e.intervalMinutes;
return !(!o || !n) && this._isInMatchTime(e);
}, n._getNextSignupDeadline = function(e) {
var o = e.match_time_ranges || e.matchTimeRanges, n = e.match_duration || e.matchDuration || e.interval_minutes || e.intervalMinutes;
if (!o || !n) return null;
if (!this._isInMatchTime(e)) return null;
try {
var t = "string" == typeof o ? JSON.parse(o) : o;
if (!t || 0 === t.length) return null;
for (var a = new Date(), i = 60 * a.getHours() + a.getMinutes(), r = null, c = 0, l = 0; l < t.length; l++) {
var s = t[l], d = s.start.split(":"), h = s.end.split(":"), u = 60 * parseInt(d[0]) + parseInt(d[1]), p = 60 * parseInt(h[0]) + parseInt(h[1]);
if (i >= u && i <= p) {
r = s;
c = u;
break;
}
}
if (!r) return null;
var g, _ = i - c, f = _ % n;
f >= n - 1 ? g = i + (n - f) : (g = c + Math.ceil(_ / n) * n) <= i && (g += n);
var m = g - 1, C = Math.floor(m / 60) % 24, v = m % 60;
return (C < 10 ? "0" : "") + C + ":" + (v < 10 ? "0" : "") + v;
} catch (e) {
console.error("⏰ [_getNextSignupDeadline] error:", e);
return null;
}
}, n._getSignupCountdownSeconds = function(e) {
var o = e.match_time_ranges || e.matchTimeRanges, n = e.match_duration || e.matchDuration || e.interval_minutes || e.intervalMinutes;
if (!o || !n) return -1;
if (!this._isInMatchTime(e)) return -1;
try {
var t = "string" == typeof o ? JSON.parse(o) : o;
if (!t || 0 === t.length) return -1;
for (var a = new Date(), i = 60 * a.getHours() + a.getMinutes(), r = a.getSeconds(), c = null, l = 0, s = 0; s < t.length; s++) {
var d = t[s], h = d.start.split(":"), u = d.end.split(":"), p = 60 * parseInt(h[0]) + parseInt(h[1]), g = 60 * parseInt(u[0]) + parseInt(u[1]);
if (i >= p && i <= g) {
c = d;
l = p;
break;
}
}
if (!c) return -1;
var _ = 60 * n;
return _ - (60 * i + r - 60 * l) % _;
} catch (e) {
console.error("⏰ [_getSignupCountdownSeconds] error:", e);
return -1;
}
}, n._getNearestMatchTimeRange = function(e) {
var o = e.match_time_ranges || e.matchTimeRanges;
if (!o) return null;
try {
var n = "string" == typeof o ? JSON.parse(o) : o;
if (!n || 0 === n.length) return null;
for (var t = new Date(), a = 60 * t.getHours() + t.getMinutes(), i = (t.getSeconds(), 
[]), r = 0; r < n.length; r++) {
var c = n[r], l = c.start.split(":"), s = c.end.split(":"), d = 60 * parseInt(l[0]) + parseInt(l[1]), h = 60 * parseInt(s[0]) + parseInt(s[1]);
i.push({
start: c.start,
end: c.end,
startMinutes: d,
endMinutes: h
});
}
for (r = 0; r < i.length; r++) if (a >= (g = i[r]).startMinutes && a <= g.endMinutes) return {
inRange: !0,
range: g
};
var u = null, p = Infinity;
for (r = 0; r < i.length; r++) {
var g, _;
if ((_ = (g = i[r]).startMinutes > a ? g.startMinutes - a : 1440 - a + g.startMinutes) < p) {
p = _;
u = g;
}
}
return {
inRange: !1,
range: u,
minutesUntilStart: p
};
} catch (e) {
return null;
}
}, n._getNextMatchCountdown = function(e) {
var o = e.match_time_ranges || e.matchTimeRanges, n = e.match_duration || e.matchDuration || e.interval_minutes || e.intervalMinutes || 10, t = new Date(), a = 60 * t.getHours() + t.getMinutes(), i = 60 * a + t.getSeconds();
if (!o) return {
inMatchTime: !0,
seconds: (p = 60 * n) - i % p,
matchDuration: n
};
try {
var r = "string" == typeof o ? JSON.parse(o) : o;
if (!r || 0 === r.length) return {
inMatchTime: !0,
seconds: (p = 60 * n) - i % p,
matchDuration: n
};
for (var c = 0; c < r.length; c++) {
var l = r[c], s = l.start.split(":"), d = l.end.split(":"), h = 60 * parseInt(s[0]) + parseInt(s[1]), u = 60 * parseInt(d[0]) + parseInt(d[1]);
if (a >= h && a <= u) {
var p;
return {
inMatchTime: !0,
seconds: (p = 60 * n) - (i - 60 * h) % p,
matchDuration: n,
currentRange: l
};
}
}
return {
inMatchTime: !1,
seconds: 0,
matchDuration: n
};
} catch (e) {
return {
inMatchTime: !1,
seconds: 0,
matchDuration: n
};
}
}, n._formatCountdown = function(e) {
var o = Math.floor(e / 60), n = Math.floor(e % 60);
return (o < 10 ? "0" : "") + o + ":" + (n < 10 ? "0" : "") + n;
}, n._formatMatchTimeRange = function(e) {
return e ? e.start + "-" + e.end : "";
}, n._getCurrentPeriodNo = function(e) {
var o = e.match_time_ranges || e.matchTimeRanges, n = e.match_duration || e.matchDuration || e.interval_minutes || e.intervalMinutes || 5;
if (!o || !n) return 0;
try {
var t = "string" == typeof o ? JSON.parse(o) : o;
if (!t || 0 === t.length) return 0;
for (var a = new Date(), i = 60 * a.getHours() + a.getMinutes(), r = 60 * i + a.getSeconds(), c = null, l = 0, s = 0; s < t.length; s++) {
var d = t[s], h = d.start.split(":"), u = d.end.split(":"), p = 60 * parseInt(h[0]) + parseInt(h[1]), g = 60 * parseInt(u[0]) + parseInt(u[1]);
if (i >= p && i <= g) {
c = d;
l = p;
break;
}
}
if (!c) return 0;
var _ = r - 60 * l, f = 60 * n;
return Math.floor(_ / f) + 1;
} catch (e) {
return 0;
}
}, n._onArenaSignupButtonClick = function(e, o, n) {
var t = window.myglobal, a = t && t.playerData ? t.playerData.arena_coin : 0, i = e.id;
if (window.arenaData && window.arenaData.isSignedUp(i)) this._doCancelSignup(e, o, n); else if (this._canSignupArena(e)) if (this._hasSignedUpOtherArena(i)) this._showMessage("您已报名其他竞技场，每场只能报名一个级别"); else {
var r = e.min_arena_coin || e.minArenaCoin || 0;
a < r ? this._showMessage("竞技币不足，需要 " + r + " 竞技币") : this._doArenaSignup(e, o, n);
} else {
var c = e.match_time_ranges || e.matchTimeRanges, l = e.match_duration || e.matchDuration || e.interval_minutes || e.intervalMinutes;
c || l ? c && !l ? this._showMessage("该房间暂未配置每场时长") : this._isInMatchTime(e) ? this._showMessage("暂不可报名") : this._showMessage("当前不在开赛时间段，无法报名") : this._showMessage("该房间暂未配置开赛时间");
}
}, n._doCancelSignup = function(e) {
var o = this;
this._showMessage("正在取消报名...");
window.arenaData && window.arenaData.cancelSignup(e.id, function(e) {
if (e) o._showMessage(e || "取消报名失败"); else {
o._showMessage("取消报名成功，竞技币已返还");
window.arenaData.refreshBalance && window.arenaData.refreshBalance();
o._updateArenaSignupStatus();
}
});
}, n._startCountdownTimer = function() {
var e = this;
console.log("🏟️ [Arena] ========== 开始初始化竞技场监听器 ==========");
console.log("🏟️ [Arena] _startCountdownTimer 被调用");
this._countdownTimer && clearInterval(this._countdownTimer);
this._localArenaStatus = {};
var o = window.myglobal && window.myglobal.socket;
console.log("🏟️ [Arena] socket 对象:", o ? "存在" : "不存在");
console.log("🏟️ [Arena] socket.onArenaStatus:", o && o.onArenaStatus ? "存在" : "不存在");
console.log("🏟️ [Arena] socket.onArenaMatchStart:", o && o.onArenaMatchStart ? "存在" : "不存在");
console.log("🏟️ [Arena] socket.onArenaCloseDialog:", o && o.onArenaCloseDialog ? "存在" : "不存在");
if (this._arenaSocketListenersRegistered) console.log("🏟️ [Arena] ⚠️ 监听器已注册，跳过重复注册"); else {
if (o && o.onArenaStatus) {
o.onArenaStatus(function(o) {
e.node && e.node.isValid && o && o.arenas && e._onArenaStatusPush(o.arenas);
});
console.log("🏟️ [Arena] ✅ onArenaStatus 监听器注册成功");
} else console.warn("🏟️ [Arena] socket 或 onArenaStatus 方法不可用，无法监听竞技场状态");
if (o && o.onArenaMatchStart) {
o.onArenaMatchStart(function(o) {
console.log("🏆 [Arena] ========== 收到 arena_match_start 消息 ==========");
console.log("🏆 [Arena] 数据:", JSON.stringify(o));
if (e.node && e.node.isValid) {
console.log("🏆 [Arena] 节点有效，准备显示弹窗");
e._onArenaMatchStart(o);
} else console.warn("🏆 [Arena] 节点无效，无法显示弹窗");
});
console.log("🏟️ [Arena] ✅ onArenaMatchStart 监听器注册成功");
} else console.warn("🏟️ [Arena] ⚠️ socket 或 onArenaMatchStart 方法不可用");
if (o && o.onArenaCloseDialog) {
o.onArenaCloseDialog(function(o) {
console.log("🏟️ [Arena] 收到关闭弹窗通知:", JSON.stringify(o));
e.node && e.node.isValid && e._onArenaCloseDialog(o);
});
console.log("🏟️ [Arena] ✅ onArenaCloseDialog 监听器注册成功");
} else console.warn("🏟️ [Arena] ⚠️ socket 或 onArenaCloseDialog 方法不可用");
if (o && o.onArenaChampionBroadcast) {
o.onArenaChampionBroadcast(function(o) {
console.log("🏆 [Arena] 收到冠军跑马灯广播:", JSON.stringify(o));
e.node && e.node.isValid && e._showChampionBroadcast(o);
});
console.log("🏆 [Arena] ✅ onArenaChampionBroadcast 监听器注册成功");
} else console.warn("🏆 [Arena] ⚠️ socket 或 onArenaChampionBroadcast 方法不可用");
if (o && o.onRoomJoined) {
this._hallSceneRoomJoinedHandler = function(o) {
console.log("🏟️ [HallScene] ✅ 收到 room_joined 消息:", JSON.stringify(o));
if (2 === (o.room_category || 1)) if (e._arenaRoomJoinedProcessed) console.log("🏟️ [HallScene] room_joined 已处理过，跳过"); else {
e._arenaRoomJoinedProcessed = !0;
if (e._arenaMatchStartDialog && e._arenaMatchStartDialog.isValid) {
e._arenaMatchStartDialog.destroy();
e._arenaMatchStartDialog = null;
}
console.log("🏟️ [HallScene] 从 room_joined 进入游戏场景");
e._enterArenaGameSceneFromRoomJoined(o);
} else console.log("🏟️ [HallScene] 不是竞技场房间，忽略");
};
o.onRoomJoined(this._hallSceneRoomJoinedHandler);
console.log("🏟️ [Arena] ✅ room_joined 监听器已注册（大厅场景）");
} else console.warn("🏟️ [Arena] ⚠️ socket 或 onRoomJoined 方法不可用");
this._arenaSocketListenersRegistered = !0;
console.log("🏟️ [Arena] ========== 竞技场监听器注册完成 ==========");
}
if (o) {
console.log("🏟️ [Arena] 🔄 请求竞技场状态（智能连接）...");
if (o.requestArenaStatusWhenConnected) o.requestArenaStatusWhenConnected(); else {
console.log("🏟️ [Arena] ⚠️ requestArenaStatusWhenConnected 不存在，尝试初始化连接...");
o.initSocket && !o.isConnected() && o.initSocket();
setTimeout(function() {
o.requestArenaStatus && o.requestArenaStatus();
}, 1e3);
}
}
this._initLocalArenaStatusFromConfig();
this._setupVisibilityChangeListener();
this._countdownTimer = setInterval(function() {
e.node && e.node.isValid && e._updateLocalCountdown();
}, 1e3);
}, n._setupVisibilityChangeListener = function() {
var e = this;
if (!this._visibilityChangeListenerAdded) {
this._visibilityChangeListenerAdded = !0;
this._lastArenaStatusRequestTime = 0;
var o = function() {
if ("visible" === document.visibilityState) {
console.log("📱 [Visibility] 页面从后台恢复，重新请求竞技场状态");
var o = Date.now();
if (o - e._lastArenaStatusRequestTime > 5e3) {
e._lastArenaStatusRequestTime = o;
setTimeout(function() {
if (e.node && e.node.isValid) {
var o = window.myglobal && window.myglobal.socket;
if (o && o.requestArenaStatusWhenConnected) {
console.log("🏟️ [Arena] 页面恢复后重新请求竞技场状态");
o.requestArenaStatusWhenConnected();
}
}
}, 500);
} else console.log("📱 [Visibility] 距离上次请求时间较短，跳过重新请求");
}
};
if ("undefined" != typeof document && document.addEventListener) {
document.addEventListener("visibilitychange", o);
console.log("📱 [Visibility] 已注册页面可见性监听器");
this._visibilityChangeHandler = o;
}
}
}, n._onArenaMatchStart = function(e) {
console.log("🏆 [Arena] _onArenaMatchStart 开始处理，data:", JSON.stringify(e));
if (this._arenaWaitingNode && this._arenaWaitingNode.isValid) {
console.log("🏆 [Arena] 已在等待界面，跳过弹窗显示");
if (this._arenaWaitingData) {
this._arenaWaitingData.periodNo = e.period_no || this._arenaWaitingData.periodNo;
this._arenaWaitingData.totalPlayers = e.total_players || this._arenaWaitingData.totalPlayers;
this._arenaWaitingData.countdown = e.countdown || this._arenaWaitingData.countdown;
}
} else {
this._closeArenaMatchStartDialog();
this._currentMatchData = e;
console.log("🏆 [Arena] 准备调用 _showArenaMatchStartDialog");
this._showArenaMatchStartDialog(e);
}
}, n._closeArenaMatchStartDialog = function() {
if (this._arenaMatchStartDialog && this._arenaMatchStartDialog.isValid) {
if (this._matchStartCountdownTimer) {
clearInterval(this._matchStartCountdownTimer);
this._matchStartCountdownTimer = null;
}
this._arenaMatchStartDialog.destroy();
this._arenaMatchStartDialog = null;
}
this._currentMatchData = null;
}, n._onArenaCloseDialog = function(e) {
console.log("🏟️ [Arena] 收到关闭弹窗通知:", JSON.stringify(e));
if (this._arenaMatchStartDialog && this._arenaMatchStartDialog.isValid) if (e.room_id && this._arenaMatchStartDialogRoomId) {
if (e.room_id === this._arenaMatchStartDialogRoomId) {
console.log("🏟️ [Arena] 关闭匹配的弹窗，room_id:", e.room_id);
this._closeArenaMatchStartDialog();
}
} else {
console.log("🏟️ [Arena] 关闭所有竞技场弹窗");
this._closeArenaMatchStartDialog();
}
}, n._showChampionBroadcast = function(e) {
console.log("🏆 [Champion] 显示冠军跑马灯:", e.message);
var o = e.message || "恭喜 " + e.champion_name + " 在期号 " + e.period_no + " 夺得" + (e.room_name || "竞技场") + "冠军！", n = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), t = n ? n.designResolution.height : 720, a = n ? n.designResolution.width : 1280, i = new cc.Node("ChampionMarquee");
i.setPosition(cc.v2(0, t / 2 - 80));
i.zIndex = 9999;
var r = new cc.Node("Bg");
r.setContentSize(cc.size(a - 40, 50));
var c = r.addComponent(cc.Graphics);
c.fillColor = cc.color(255, 215, 0, 230);
c.roundRect(-(a - 40) / 2, -25, a - 40, 50, 10);
c.fill();
r.parent = i;
var l = new cc.Node("Icon");
l.setPosition(cc.v2(-a / 2 + 50, 0));
var s = l.addComponent(cc.Label);
s.string = "🏆";
s.fontSize = 28;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
l.parent = i;
var d = new cc.Node("Text");
d.setPosition(cc.v2(0, 0));
var h = d.addComponent(cc.Label);
h.string = o;
h.fontSize = 22;
h.lineHeight = 28;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
d.color = cc.color(139, 69, 19);
d.parent = i;
i.parent = this.node;
i.y = t / 2 + 100;
var u = cc.moveTo(.5, cc.v2(0, t / 2 - 80)).easing(cc.easeBackOut()), p = cc.delayTime(5), g = cc.moveTo(.5, cc.v2(0, t / 2 + 100)), _ = cc.callFunc(function() {
i && i.isValid && i.destroy();
});
i.runAction(cc.sequence(u, p, g, _));
console.log("🏆 [Champion] 跑马灯显示完成:", o);
}, n._showArenaMatchStartDialog = function(e) {
var o = this;
console.log("🏆 [Arena] _showArenaMatchStartDialog 开始创建弹窗...");
var n = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), t = n ? n.designResolution.height : 720, a = n ? n.designResolution.width : 1280;
console.log("🏆 [Arena] 屏幕尺寸:", a, "x", t);
var i = new cc.Node("ArenaMatchStartDialog");
i.setContentSize(cc.size(a, t));
i.anchorX = .5;
i.anchorY = .5;
i.x = 0;
i.y = 0;
i.zIndex = 5e3;
i.parent = this.node;
console.log("🏆 [Arena] 弹窗容器已创建，zIndex=", i.zIndex);
this._arenaMatchStartDialog = i;
this._arenaMatchStartDialogRoomId = e.room_id;
this._arenaMatchStartDialogPeriodNo = e.period_no;
var r = new cc.Node("Bg");
r.setContentSize(cc.size(a, t));
var c = r.addComponent(cc.Graphics);
c.fillColor = cc.color(0, 0, 0, 180);
c.rect(-a / 2, -t / 2, a, t);
c.fill();
r.parent = i;
var l = new cc.Node("Card");
l.setContentSize(cc.size(450, 380));
var s = l.addComponent(cc.Graphics);
s.fillColor = cc.color(40, 45, 65, 255);
s.roundRect(-225, -190, 450, 380, 15);
s.fill();
s.strokeColor = cc.color(255, 215, 0);
s.lineWidth = 3;
s.roundRect(-225, -190, 450, 380, 15);
s.stroke();
l.parent = i;
var d = new cc.Node("Title");
d.y = 145;
var h = d.addComponent(cc.Label);
h.string = "🏆 竞技场比赛开始";
h.fontSize = 32;
h.lineHeight = 40;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
d.color = cc.color(255, 215, 0);
var u = d.addComponent(cc.LabelOutline);
u.color = cc.color(100, 80, 0);
u.width = 2;
d.parent = l;
var p = new cc.Node("Period");
p.y = 95;
var g = p.addComponent(cc.Label);
g.string = "期号: " + (e.period_no || "--");
g.fontSize = 22;
g.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
p.color = cc.color(200, 200, 220);
p.parent = l;
var _ = new cc.Node("Room");
_.y = 60;
var f = _.addComponent(cc.Label);
f.string = "房间: " + (e.room_name || "未知房间");
f.fontSize = 20;
f.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
_.color = cc.color(180, 180, 200);
_.parent = l;
var m = new cc.Node("Countdown");
m.y = 25;
var C = m.addComponent(cc.Label), v = e.countdown || 60;
if (e.start_time) {
var w = Date.now(), y = w - e.start_time, b = Math.floor(y / 1e3);
v = Math.max(0, (e.countdown || 60) - b);
console.log("🏆 [Arena] 使用 start_time 计算剩余时间: start_time=" + e.start_time + ", now=" + w + ", elapsed=" + b + "s, remaining=" + v + "s");
}
C.string = "倒计时: " + v + " 秒";
C.fontSize = 24;
C.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
m.color = cc.color(255, 100, 100);
m.parent = l;
o._matchStartCountdownTimer && clearInterval(o._matchStartCountdownTimer);
o._matchStartCountdownTimer = setInterval(function() {
if (i && i.isValid) {
var n = e.countdown || 60;
if (e.start_time) {
var t = Date.now() - e.start_time, a = Math.floor(t / 1e3);
n = Math.max(0, (e.countdown || 60) - a);
} else n = v - 1;
v = n;
if (n <= 0) {
clearInterval(o._matchStartCountdownTimer);
o._matchStartCountdownTimer = null;
console.log("🏟️ [Arena] 弹窗倒计时结束，自动进入等待场景 ArenaMatchWaitingScene");
o._arenaMatchStartDialog = null;
o._arenaMatchStartDialogRoomId = null;
o._arenaMatchStartDialogPeriodNo = null;
i && i.isValid && i.destroy();
o._enterArenaMatch(e);
} else {
C.string = "倒计时: " + n + " 秒";
n <= 10 && (C.color = n % 2 == 0 ? cc.color(255, 50, 50) : cc.color(255, 150, 150));
}
} else {
clearInterval(o._matchStartCountdownTimer);
o._matchStartCountdownTimer = null;
}
}, 1e3);
var S = new cc.Node("Message");
S.y = -50;
var N = S.addComponent(cc.Label);
N.string = e.message || "比赛即将开始，请准备进入游戏！";
N.fontSize = 16;
N.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
S.color = cc.color(255, 200, 100);
S.parent = l;
var L = new cc.Node("EnterBtn");
L.setContentSize(cc.size(180, 50));
L.setPosition(-100, -135);
L.anchorX = .5;
L.anchorY = .5;
var A = L.addComponent(cc.Graphics);
A.fillColor = cc.color(76, 175, 80);
A.roundRect(-90, -25, 180, 50, 8);
A.fill();
var T = new cc.Node("Label");
T.anchorX = .5;
T.anchorY = .5;
var R = T.addComponent(cc.Label);
R.string = "进入比赛";
R.fontSize = 22;
R.lineHeight = 28;
R.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
T.color = cc.color(255, 255, 255);
T.parent = L;
var k = L.addComponent(cc.Button);
k.transition = cc.Button.Transition.SCALE;
k.duration = .1;
k.zoomScale = 1.1;
L.parent = l;
L.on(cc.Node.EventType.TOUCH_END, function(n) {
n.stopPropagation();
o._arenaMatchStartDialog = null;
o._arenaMatchStartDialogRoomId = null;
o._arenaMatchStartDialogPeriodNo = null;
i.destroy();
o._enterArenaMatch(e);
});
var z = new cc.Node("CancelBtn");
z.setContentSize(cc.size(120, 50));
z.setPosition(100, -135);
z.anchorX = .5;
z.anchorY = .5;
var P = z.addComponent(cc.Graphics);
P.fillColor = cc.color(180, 80, 80);
P.roundRect(-60, -25, 120, 50, 8);
P.fill();
var E = new cc.Node("Label");
E.anchorX = .5;
E.anchorY = .5;
var I = E.addComponent(cc.Label);
I.string = "取消";
I.fontSize = 20;
I.lineHeight = 26;
I.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
E.color = cc.color(255, 255, 255);
E.parent = z;
var D = z.addComponent(cc.Button);
D.transition = cc.Button.Transition.SCALE;
D.duration = .1;
D.zoomScale = 1.1;
z.parent = l;
z.on(cc.Node.EventType.TOUCH_END, function(n) {
n.stopPropagation();
o._cancelArenaSignup(e);
o._arenaMatchStartDialog = null;
o._arenaMatchStartDialogRoomId = null;
o._arenaMatchStartDialogPeriodNo = null;
i.destroy();
});
console.log("🏆 [Arena] ✅ 弹窗创建完成！dialogNode.parent =", i.parent ? "已挂载" : "未挂载");
console.log("🏆 [Arena] 弹窗子节点数量:", i.children.length);
}, n._cancelArenaSignup = function(e) {
var o = window.myglobal;
console.log("🏟️ [Arena] 取消报名，退还竞技币，room_id:", e.room_id);
var n = o && o.socket;
n && n.sendArenaCancelSignup && n.sendArenaCancelSignup({
room_id: e.room_id
});
if (window.arenaData && window.arenaData._signedUpArenas) {
delete window.arenaData._signedUpArenas[e.room_id];
window.arenaData.saveToLocal && window.arenaData.saveToLocal();
}
this._currentMatchData = null;
}, n._enterArenaMatch = function(e) {
var o = window.myglobal;
console.log("🏟️ [Arena] 进入竞技场比赛，data:", JSON.stringify(e));
o && (o.currentArenaMatch = e);
if (window.arenaData && window.arenaData._signedUpArenas) {
delete window.arenaData._signedUpArenas[e.room_id];
window.arenaData.saveToLocal && window.arenaData.saveToLocal();
}
if (o) {
o.arenaWaitingData = {
period_no: e.period_no || "",
room_id: e.room_id || 0,
room_name: e.room_name || "竞技场",
total_players: e.total_players || 0,
entered_players: 1,
start_time: e.start_time || Date.now(),
countdown: e.countdown || 60,
players: [],
message: e.message || "比赛即将开始！"
};
o.currentRoomConfig = {
id: e.room_id,
room_name: e.room_name,
room_config_id: e.room_config_id,
room_category: 2,
min_arena_coin: e.signup_fee,
match_rounds: e.match_rounds,
match_duration: e.match_duration
};
o.currentRoomLevel = e.room_id;
o.currentRoomName = e.room_name;
console.log("🏟️ [Arena] 已保存等待数据到 myglobal.arenaWaitingData");
}
var n = o && o.socket;
if (n && n.sendArenaEnter) {
n.sendArenaEnter({
period_no: e.period_no,
room_id: e.room_id
});
console.log("🏟️ [Arena] 已发送 arena_enter 请求");
}
console.log("🏟️ [Arena] 跳转到等待场景 ArenaMatchWaitingScene");
cc.director.loadScene("ArenaMatchWaitingScene");
}, n._showArenaWaitingUI = function(e) {
console.log("🏟️ [Arena] 显示等待界面");
this._hideArenaWaitingUI();
var o = this.node;
if (o && o.isValid) {
console.log("🏟️ [Arena] Canvas 节点已找到:", o.name);
var n = new cc.Node("ArenaWaitingUI");
n.setContentSize(cc.size(1280, 720));
n.setPosition(0, 0);
n.zIndex = 1e3;
var t = new cc.Node("Mask");
t.setContentSize(cc.size(1280, 720));
t.setPosition(0, 0);
var a = t.addComponent(cc.Graphics);
a.fillColor = cc.color(0, 0, 0, 180);
a.rect(-640, -360, 1280, 720);
a.fill();
t.parent = n;
(y = new cc.Node("Background")).setContentSize(cc.size(1280, 720));
y.setPosition(0, 0);
var i = y.addComponent(cc.Sprite);
i.type = cc.Sprite.Type.SIMPLE;
i.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("join_bk", cc.SpriteFrame, function(e, o) {
if (e) {
console.warn("🏟️ [Arena] 无法加载背景图 join_bk.png");
var n = y.addComponent(cc.Graphics);
n.fillColor = cc.color(25, 30, 50, 255);
n.rect(-640, -360, 1280, 720);
n.fill();
} else i && i.node && i.node.isValid && (i.spriteFrame = o);
});
y.parent = n;
var r = new cc.Node("TopBar");
r.setContentSize(cc.size(1180, 100));
r.setPosition(0, 280);
var c = new cc.Node("Bg");
c.setContentSize(cc.size(1180, 100));
var l = c.addComponent(cc.Graphics);
l.fillColor = cc.color(0, 0, 0, 150);
l.roundRect(-590, -50, 1180, 100, 10);
l.fill();
c.parent = r;
var s = new cc.Node("PeriodNo");
s.setPosition(-480, 20);
var d = s.addComponent(cc.Label);
d.string = "期号: " + (e.period_no || "--");
d.fontSize = 22;
d.lineHeight = 28;
s.color = cc.color(255, 215, 0);
var h = s.addComponent(cc.LabelOutline);
h.color = cc.color(0, 0, 0);
h.width = 2;
s.parent = r;
var u = new cc.Node("RoomName");
u.setPosition(0, 20);
var p = u.addComponent(cc.Label);
p.string = e.room_name || "竞技场";
p.fontSize = 28;
p.lineHeight = 36;
u.color = cc.color(255, 255, 255);
var g = u.addComponent(cc.LabelOutline);
g.color = cc.color(0, 0, 0);
g.width = 2;
u.parent = r;
var _ = void 0 !== e.countdown && null !== e.countdown ? e.countdown : 60;
console.log("🏟️ [Arena] 等待界面初始倒计时: data.countdown=" + e.countdown + ", 使用值=" + _);
var f = new cc.Node("Countdown");
f.setPosition(480, 20);
var m = f.addComponent(cc.Label);
m.string = _ + "秒";
m.fontSize = 24;
m.lineHeight = 32;
f.color = cc.color(100, 255, 100);
var C = f.addComponent(cc.LabelOutline);
C.color = cc.color(0, 0, 0);
C.width = 2;
f.parent = r;
var v = new cc.Node("PlayerCount");
v.setPosition(0, -20);
var w = v.addComponent(cc.Label);
w.string = "已进入: 0 / " + (e.total_players || 0);
w.fontSize = 20;
w.lineHeight = 28;
v.color = cc.color(200, 200, 220);
v.parent = r;
r.parent = n;
var y, b = new cc.Node("PlayerArea");
b.setContentSize(cc.size(1160, 440));
b.setPosition(0, -25);
(y = new cc.Node("Bg")).setContentSize(cc.size(1160, 440));
var S = y.addComponent(cc.Graphics);
S.fillColor = cc.color(0, 0, 0, 80);
S.roundRect(-580, -220, 1160, 440, 10);
S.fill();
y.parent = b;
var N = new cc.Node("Content");
N.setContentSize(cc.size(1150, 420));
N.anchorX = 0;
N.anchorY = 1;
N.setPosition(-575, 210);
N.parent = b;
b.parent = n;
n.parent = o;
var L = void 0 !== e.countdown && null !== e.countdown ? e.countdown : 60;
console.log("🏟️ [Arena] 等待界面保存数据: data.countdown=" + e.countdown + ", 使用值=" + L);
this._arenaWaitingNode = n;
this._arenaWaitingData = {
periodNo: e.period_no || "",
roomId: e.room_id || 0,
roomName: e.room_name || "竞技场",
countdown: L,
totalPlayers: e.total_players || 0,
enteredPlayers: 0,
players: [],
serverCountdown: L,
lastServerUpdateTime: Date.now(),
startTime: e.start_time || Date.now()
};
this._arenaWaitingLabels = {
period: d,
room: p,
countdown: m,
playerCount: w
};
this._arenaWaitingContent = N;
this._startArenaLocalCountdownTimer();
this._ensureArenaWaitingEventsRegistered();
console.log("🏟️ [Arena] 检查缓存数据...");
var A = window.myglobal;
A && A.arenaWaitingStatusCache && console.log("🏟️ [Arena] 发现缓存数据:", JSON.stringify(A.arenaWaitingStatusCache));
var T = this._checkArenaWaitingCache();
console.log("🏟️ [Arena] 缓存数据检查结果:", T);
if (!T) {
console.log("🏟️ [Arena] 没有缓存数据，显示占位");
this._showArenaWaitingPlaceholder(e);
}
console.log("🏟️ [Arena] 等待界面已创建，当前玩家列表:", this._arenaWaitingData.players.length);
} else console.error("🏟️ [Arena] Canvas 节点无效");
}, n._showArenaWaitingPlaceholder = function(e) {
var o = window.myglobal, n = o && o.playerData ? o.playerData : null, t = n && n.avatar ? n.avatar : "", a = n && n.player_name ? n.player_name : "我", i = n && n.player_id ? n.player_id : "me";
this._arenaWaitingData.players = [ {
player_id: i,
player_name: a,
avatar: t,
is_robot: !1,
entered_at: Date.now()
} ];
this._arenaWaitingData.enteredPlayers = 1;
this._updateArenaPlayerListUI();
this._arenaWaitingLabels && this._arenaWaitingLabels.playerCount && (this._arenaWaitingLabels.playerCount.string = "已进入: 1 / " + (e.total_players || 1));
console.log("🏟️ [Arena] 显示占位玩家");
}, n._hideArenaWaitingUI = function() {
this._stopArenaLocalCountdownTimer();
if (this._arenaWaitingNode) {
this._arenaWaitingNode.destroy();
this._arenaWaitingNode = null;
}
this._arenaWaitingLabels = null;
this._arenaWaitingContent = null;
this._unregisterArenaWaitingEvents();
}, n._registerArenaWaitingEvents = function() {
var e = this, o = window.myglobal, n = o && o.eventlister;
console.log("🏟️ [ArenaWaiting] 注册事件监听, evt:", n ? "存在" : "不存在");
if (n) {
this._arenaWaitingStatusHandler = function(o) {
console.log("🏟️ [ArenaWaiting] ✅ 收到等待状态通知，玩家数:", o.players ? o.players.length : 0);
console.log("🏟️ [ArenaWaiting] 等待状态数据:", JSON.stringify(o));
e._onArenaWaitingStatus(o);
};
n.on("arena_waiting_status_notify", this._arenaWaitingStatusHandler);
this._arenaWaitingTickHandler = function(o) {
e._onArenaWaitingTick(o);
};
n.on("arena_waiting_tick_notify", this._arenaWaitingTickHandler);
this._arenaPlayerJoinedHandler = function(o) {
console.log("🏟️ [ArenaWaiting] ✅ 收到玩家加入通知，玩家数:", o.players ? o.players.length : 0);
console.log("🏟️ [ArenaWaiting] 玩家加入数据:", JSON.stringify(o));
e._onArenaPlayerJoined(o);
};
n.on("arena_player_joined_notify", this._arenaPlayerJoinedHandler);
this._arenaAssignStartHandler = function(o) {
console.log("🏟️ [ArenaWaiting] ✅ 收到分配阶段开始通知:", JSON.stringify(o));
e._onArenaAssignStart(o);
};
n.on("arena_assign_start_notify", this._arenaAssignStartHandler);
var t = o && o.socket;
if (t && t.onRoomJoined) {
this._arenaRoomJoinedHandler = function(o) {
console.log("🏟️ [ArenaWaiting] ✅ 收到 room_joined，准备进入游戏场景:", JSON.stringify(o));
if (2 === (o.room_category || 1)) if (e._arenaRoomJoinedProcessed) console.log("🏟️ [ArenaWaiting] room_joined 已处理过，跳过"); else {
e._arenaRoomJoinedProcessed = !0;
e._hideArenaWaitingUI();
e._enterArenaGameSceneFromRoomJoined(o);
} else console.log("🏟️ [ArenaWaiting] 不是竞技场房间，忽略");
};
t.onRoomJoined(this._arenaRoomJoinedHandler);
}
} else console.warn("🏟️ [ArenaWaiting] eventlister 不存在，无法注册事件");
}, n._ensureArenaWaitingEventsRegistered = function() {
if (this._arenaWaitingEventsRegistered) console.log("🏟️ [ArenaWaiting] 事件监听器已注册，跳过"); else {
console.log("🏟️ [ArenaWaiting] 注册事件监听器");
this._registerArenaWaitingEvents();
this._arenaWaitingEventsRegistered = !0;
}
}, n._unregisterArenaWaitingEvents = function() {
var e = window.myglobal, o = e && e.eventlister;
if (o) {
this._arenaWaitingStatusHandler && o.off("arena_waiting_status_notify", this._arenaWaitingStatusHandler);
this._arenaWaitingTickHandler && o.off("arena_waiting_tick_notify", this._arenaWaitingTickHandler);
this._arenaPlayerJoinedHandler && o.off("arena_player_joined_notify", this._arenaPlayerJoinedHandler);
this._arenaAssignStartHandler && o.off("arena_assign_start_notify", this._arenaAssignStartHandler);
this._arenaWaitingEventsRegistered = !1;
}
}, n._checkArenaWaitingCache = function() {
var e = window.myglobal;
if (e && e.arenaWaitingStatusCache) {
var o = e.arenaWaitingStatusCache;
console.log("🏟️ [ArenaWaiting] 发现缓存数据，玩家数量:", o.players ? o.players.length : 0);
if ((!this._arenaWaitingData.periodNo || o.period_no === this._arenaWaitingData.periodNo) && (o.players || []).length > 0) {
this._onArenaWaitingStatus(o);
e.arenaWaitingStatusCache = null;
return !0;
}
}
return !1;
}, n._onArenaWaitingStatus = function(e) {
console.log("🏟️ [ArenaWaiting] 收到等待状态，countdown=" + e.countdown + ", players=" + (e.players ? e.players.length : 0));
if (this._arenaWaitingNode) {
if (!this._arenaWaitingData.periodNo || e.period_no === this._arenaWaitingData.periodNo) {
this._arenaWaitingData.periodNo = e.period_no || "";
this._arenaWaitingData.roomId = e.room_id || 0;
this._arenaWaitingData.roomName = e.room_name || "竞技场";
this._arenaWaitingData.countdown = e.countdown;
this._arenaWaitingData.totalPlayers = e.total_players || 0;
this._arenaWaitingData.enteredPlayers = e.entered_players || 0;
this._arenaWaitingData.players = e.players || [];
console.log("🏟️ [ArenaWaiting] 更新等待状态，倒计时=" + e.countdown + "，玩家数量:", this._arenaWaitingData.players.length);
this._updateArenaWaitingUI();
}
} else {
if (this._pendingArenaEnterData) {
var o = {
period_no: e.period_no || this._pendingArenaEnterData.period_no,
room_id: e.room_id || this._pendingArenaEnterData.room_id,
room_name: e.room_name || this._pendingArenaEnterData.room_name,
countdown: e.countdown,
total_players: e.total_players || this._pendingArenaEnterData.total_players,
start_time: e.start_time,
entered_players: e.entered_players || 0,
players: e.players || [],
message: e.message || this._pendingArenaEnterData.message
};
console.log("🏟️ [ArenaWaiting] 创建等待界面，服务端倒计时=" + e.countdown);
this._showArenaWaitingUI(o);
this._pendingArenaEnterData = null;
return;
}
if (e.period_no && void 0 !== e.countdown) {
console.log("🏟️ [ArenaWaiting] 直接创建等待界面，服务端倒计时=" + e.countdown);
this._showArenaWaitingUI({
period_no: e.period_no,
room_id: e.room_id,
room_name: e.room_name,
countdown: e.countdown,
total_players: e.total_players,
start_time: e.start_time,
entered_players: e.entered_players || 0,
players: e.players || [],
message: e.message
});
return;
}
console.warn("🏟️ [ArenaWaiting] 没有足够数据创建等待界面");
}
}, n._onArenaWaitingTick = function(e) {
if (this._arenaWaitingNode && (!this._arenaWaitingData.periodNo || e.period_no === this._arenaWaitingData.periodNo)) {
this._arenaWaitingData.serverCountdown = e.countdown;
this._arenaWaitingData.countdown = e.countdown;
this._arenaWaitingData.lastServerUpdateTime = Date.now();
this._arenaWaitingData.enteredPlayers = e.entered_players;
if (this._arenaWaitingLabels && this._arenaWaitingLabels.countdown) {
this._arenaWaitingLabels.countdown.string = e.countdown + "秒";
e.countdown <= 10 && e.countdown > 0 ? this._arenaWaitingLabels.countdown.node.color = cc.color(255, 100, 100) : this._arenaWaitingLabels.countdown.node.color = cc.color(100, 255, 100);
}
this._arenaWaitingLabels && this._arenaWaitingLabels.playerCount && (this._arenaWaitingLabels.playerCount.string = "已进入: " + e.entered_players + " / " + this._arenaWaitingData.totalPlayers);
}
}, n._startArenaLocalCountdownTimer = function() {
var e = this;
if (this._arenaLocalCountdownTimer) {
clearInterval(this._arenaLocalCountdownTimer);
this._arenaLocalCountdownTimer = null;
}
this._arenaLocalCountdownTimer = setInterval(function() {
if (e._arenaWaitingNode && e._arenaWaitingData) {
var o = window.myglobal, n = o && o.socket, t = n && n.isConnected && n.isConnected(), a = Date.now() - (e._arenaWaitingData.lastServerUpdateTime || 0);
if (!t || a > 2e3) {
if (e._arenaWaitingData.countdown > 0) {
e._arenaWaitingData.countdown--;
if (e._arenaWaitingLabels && e._arenaWaitingLabels.countdown) {
e._arenaWaitingLabels.countdown.string = e._arenaWaitingData.countdown + "秒";
e._arenaWaitingData.countdown <= 10 && e._arenaWaitingData.countdown > 0 ? e._arenaWaitingLabels.countdown.node.color = cc.color(255, 100, 100) : e._arenaWaitingLabels.countdown.node.color = cc.color(100, 255, 100);
}
console.log("🏟️ [ArenaWaiting] 本地倒计时(断线递减):", e._arenaWaitingData.countdown);
}
} else t && void 0 !== e._arenaWaitingData.serverCountdown && (e._arenaWaitingData.countdown = e._arenaWaitingData.serverCountdown);
}
}, 1e3);
}, n._stopArenaLocalCountdownTimer = function() {
if (this._arenaLocalCountdownTimer) {
clearInterval(this._arenaLocalCountdownTimer);
this._arenaLocalCountdownTimer = null;
}
}, n._onArenaPlayerJoined = function(e) {
if (this._arenaWaitingNode && (!this._arenaWaitingData.periodNo || e.period_no === this._arenaWaitingData.periodNo)) {
this._arenaWaitingData.players = e.players || [];
this._arenaWaitingData.enteredPlayers = e.entered_players;
this._arenaWaitingData.totalPlayers = e.total_players;
console.log("🏟️ [ArenaWaiting] 玩家加入，更新列表，玩家数量:", this._arenaWaitingData.players.length);
this._updateArenaPlayerListUI();
this._arenaWaitingLabels && this._arenaWaitingLabels.playerCount && (this._arenaWaitingLabels.playerCount.string = "已进入: " + e.entered_players + " / " + e.total_players);
}
}, n._onArenaAssignStart = function() {
if (this._arenaWaitingNode) {
console.log("🏟️ [ArenaWaiting] 分配阶段开始，准备进入游戏");
this._arenaRoomJoinedProcessed = !0;
this._hideArenaWaitingUI();
var e = window.myglobal;
if (e && e.currentArenaMatch) {
var o = e.currentArenaMatch, n = {
id: o.room_id,
room_name: o.room_name,
room_category: 2
};
this._enterArenaGameScene(o, n);
}
}
}, n._updateArenaWaitingUI = function() {
if (this._arenaWaitingNode) {
var e = this._arenaWaitingLabels;
if (e) {
e.period && (e.period.string = "期号: " + this._arenaWaitingData.periodNo);
e.room && (e.room.string = this._arenaWaitingData.roomName);
e.countdown && (e.countdown.string = this._arenaWaitingData.countdown + "秒");
e.playerCount && (e.playerCount.string = "已进入: " + this._arenaWaitingData.enteredPlayers + " / " + this._arenaWaitingData.totalPlayers);
this._updateArenaPlayerListUI();
}
}
}, n._updateArenaPlayerListUI = function() {
if (this._arenaWaitingContent) {
this._arenaWaitingContent.removeAllChildren();
var e = this._arenaWaitingData.players || [];
console.log("🏟️ [ArenaWaiting] 更新玩家列表，玩家数量:", e.length);
if (0 !== e.length) {
var o = e.slice().sort(function(e, o) {
var n = e.entered_at && e.entered_at > 0, t = o.entered_at && o.entered_at > 0;
return n && !t ? -1 : !n && t ? 1 : (e.entered_at || 0) - (o.entered_at || 0);
});
console.log("🏟️ [ArenaWaiting] 排序后玩家:", o.map(function(e) {
return e.player_name + (e.entered_at > 0 ? "(已进入)" : "(等待中)");
}).join(", "));
for (var n = 0; n < o.length; n++) {
var t = o[n], a = t.entered_at && t.entered_at > 0 ? "(已进入)" : "(等待中)";
console.log("🏟️ [ArenaWaiting] 创建玩家卡片:", n, t.player_name, a);
var i = this._createArenaPlayerItemNew(t, n), r = 60 + n % 10 * 110, c = -10 - 130 * Math.floor(n / 10) - 60;
i.setPosition(r, c);
i.parent = this._arenaWaitingContent;
}
} else console.log("🏟️ [ArenaWaiting] 没有玩家数据，跳过渲染");
}
}, n._createArenaPlayerItemNew = function(e, o) {
var n = new cc.Node("PlayerCard_" + o);
n.setContentSize(cc.size(100, 120));
var t = new cc.Node("Bg");
t.setContentSize(cc.size(95, 115));
var a = t.addComponent(cc.Graphics);
a.fillColor = cc.color(40, 60, 80, 230);
a.roundRect(-47.5, -57.5, 95, 115, 8);
a.fill();
t.parent = n;
var i = new cc.Node("AvatarMask");
i.setPosition(0, 25);
i.setContentSize(cc.size(60, 60));
var r = i.addComponent(cc.Mask);
r.type = cc.Mask.Type.ELLIPSE;
r.segements = 64;
var c = new cc.Node("AvatarBg"), l = c.addComponent(cc.Graphics);
l.fillColor = cc.color(80, 80, 100, 255);
l.circle(0, 0, 32);
l.fill();
c.parent = i;
var s = new cc.Node("Avatar");
s.setContentSize(cc.size(60, 60));
var d = s.addComponent(cc.Sprite);
d.type = cc.Sprite.Type.SIMPLE;
d.sizeMode = cc.Sprite.SizeMode.CUSTOM;
this._loadArenaPlayerAvatar(e.avatar, d);
s.parent = i;
i.parent = n;
var h = new cc.Node("Name");
h.setPosition(0, -25);
var u = h.addComponent(cc.Label);
u.string = e.player_name || e.name || "玩家" + (o + 1);
u.fontSize = 14;
u.lineHeight = 18;
h.setContentSize(cc.size(90, 18));
u.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
h.color = cc.color(255, 255, 255);
h.parent = n;
var p = new cc.Node("Status");
p.setPosition(0, -45);
var g = p.addComponent(cc.Label);
g.fontSize = 12;
g.lineHeight = 14;
g.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
if (e.entered_at && e.entered_at > 0) {
g.string = "已进入";
p.color = cc.color(100, 255, 150);
} else {
g.string = "等待中";
p.color = cc.color(255, 200, 100);
}
p.parent = n;
return n;
}, n._loadArenaPlayerAvatar = function(e, o) {
if (o) if (e) if (0 !== e.indexOf("http://") && 0 !== e.indexOf("https://")) {
var n = window.myglobal, t = n && n.cdnUrl ? n.cdnUrl : "https://apis.hongxiu88.com";
if (0 !== e.indexOf("/uploads/")) if (0 !== e.indexOf("uploads/")) cc.resources.load("UI/headimage/" + e.replace(/\.png$|\.jpg$|\.jpeg$/gi, ""), cc.SpriteFrame, function(e, n) {
!e && n && o && o.node && o.node.isValid && (o.spriteFrame = n);
}); else {
a = t + "/" + e;
console.log("🏟️ [Avatar] 加载头像(格式2):", a);
cc.assetManager.loadRemote(a, {
ext: ".png"
}, function(e, n) {
if (!e && n && o && o.node && o.node.isValid) try {
var t = new cc.SpriteFrame(n);
o.spriteFrame = t;
} catch (e) {
console.warn("🏟️ [Avatar] 头像加载失败:", a);
} else e && console.warn("🏟️ [Avatar] 头像加载错误:", e);
});
} else {
var a = t + e;
console.log("🏟️ [Avatar] 加载头像(格式1):", a);
cc.assetManager.loadRemote(a, {
ext: ".png"
}, function(e, n) {
if (!e && n && o && o.node && o.node.isValid) try {
var t = new cc.SpriteFrame(n);
o.spriteFrame = t;
} catch (e) {
console.warn("🏟️ [Avatar] 头像加载失败:", a);
} else e && console.warn("🏟️ [Avatar] 头像加载错误:", e);
});
}
} else cc.assetManager.loadRemote(e, {
ext: ".png"
}, function(e, n) {
if (!e && n && o && o.node && o.node.isValid) try {
var t = new cc.SpriteFrame(n);
o.spriteFrame = t;
} catch (e) {}
}); else cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(e, n) {
!e && n && o && o.node && o.node.isValid && (o.spriteFrame = n);
});
}, n._onArenaWaitingCancel = function() {
console.log("🏟️ [ArenaWaiting] 玩家点击取消");
var e = window.myglobal;
e && e.socket && e.socket.emit("arena_cancel_enter", {
period_no: this._arenaWaitingData.periodNo,
room_id: this._arenaWaitingData.roomId
});
this._hideArenaWaitingUI();
}, n._enterArenaGameScene = function(e, o) {
var n = this, t = window.myglobal;
if (this._enterGameSceneInProgress) console.log("🏟️ [Arena] 已在进入游戏场景中，跳过"); else {
this._arenaRoomJoinedProcessed = !0;
this._showMessageCenter("正在进入竞技场...");
var a = this._arenaWaitingData && this._arenaWaitingData.players ? this._arenaWaitingData.players : [];
console.log("🏟️ [Arena] 从等待数据获取玩家数量:", a.length);
var i = a.map(function(o, n) {
return {
accountid: o.player_id || o.id,
nick_name: o.player_name || o.name,
avatar: o.avatar || "avatar_1",
avatarUrl: o.avatar || "avatar_1",
gold_count: o.gold_count || 0,
goldcount: o.gold_count || 0,
seatindex: n + 1,
isready: o.entered_at && o.entered_at > 0,
is_robot: o.is_robot || !1,
room_category: 2,
period_no: e.period_no
};
}), r = {
room_code: e.room_code || "",
room_id: e.room_id,
room_name: e.room_name,
room_category: 2,
base_score: o.base_score || 1,
multiplier: o.multiplier || 1,
period_no: e.period_no,
match_rounds: e.match_rounds,
playerdata: i
};
if (t) {
t.roomData = r;
t.playerData = t.playerData || {};
t.playerData.bottom = o.base_score || 1;
t.playerData.rate = o.multiplier || 1;
console.log("🏟️ [Arena] myglobal.roomData 已设置, playerdata 数量:", i.length);
}
var c = 500;
e.wait_time && e.wait_time > 0 && (c = Math.min(1e3 * e.wait_time, 2e3));
console.log("🏟️ [Arena] 将在 " + c + "ms 后进入游戏场景");
this._arenaEnterTimer = setTimeout(function() {
n._arenaEnterTimer = null;
console.log("🏟️ [Arena] 进入游戏场景");
n._enterGameScene(r);
}, c);
}
}, n._enterArenaGameSceneFromRoomJoined = function(e) {
console.log("🏟️ [Arena] 从 room_joined 进入游戏场景, roomData=" + JSON.stringify(e));
if (this._enterGameSceneInProgress) console.log("🏟️ [Arena] 已在进入游戏场景中，跳过（来自 room_joined）"); else {
var o = window.myglobal, n = e.players || [], t = e.room_category || 2, a = e.period_no || "", i = n.map(function(e, o) {
return {
accountid: e.id,
nick_name: e.name,
avatar: e.avatar || "avatar_1",
avatarUrl: e.avatar || "avatar_1",
gold_count: e.gold_count || 0,
goldcount: e.gold_count || 0,
seatindex: (void 0 !== e.seat ? e.seat : o) + 1,
isready: e.ready || !0,
match_coin: e.match_coin || 0,
arena_gold: e.arena_gold || 0,
room_category: t,
period_no: a
};
});
console.log("🏟️ [Arena] 转换后的 playerdata 数量: " + i.length + ", room_category=" + t);
if (o) {
o.roomData = {
roomid: e.room_code,
room_code: e.room_code,
room_id: e.room_id,
room_name: e.room_name || "竞技场",
room_category: t,
period_no: a,
base_score: e.base_score || 1,
multiplier: e.multiplier || 1,
seatindex: e.player ? e.player.seat + 1 : 1,
playerdata: i,
housemanageid: e.creator_id || "",
creator_id: e.creator_id || ""
};
o.playerData = o.playerData || {};
o.playerData.bottom = e.base_score || 1;
o.playerData.rate = e.multiplier || 1;
e.player && (o.playerData.seatIndex = e.player.seat + 1);
console.log("🏟️ [Arena] myglobal.roomData 已保存, playerdata=" + i.length + "人");
}
var r = o && o._avatarCache && Object.keys(o._avatarCache).length > 0;
console.log("🏟️ [Arena] 头像缓存状态:", r ? "已有缓存" : "无缓存");
if (r) {
console.log("🏟️ [Arena] 使用预加载的头像缓存，直接进入场景");
this._enterGameScene(o.roomData);
} else this._showArenaLoadingAndPreload(i, o.roomData);
}
}, n._showArenaLoadingAndPreload = function(e, o) {
var n = this;
if (this._arenaLoadingInProgress) console.log("🏟️ [ArenaLoading] 已在进行中，跳过"); else {
this._arenaLoadingInProgress = !0;
console.log("🏟️ [ArenaLoading] 显示加载界面，准备预加载头像...");
n._showArenaLoadingUI();
for (var t = [], a = 0; a < e.length; a++) {
var i = e[a].avatar || e[a].avatarUrl || "avatar_1";
i && -1 === t.indexOf(i) && t.push(i);
}
console.log("🏟️ [ArenaLoading] 需要预加载的头像数量:", t.length);
if (0 !== t.length) {
for (var r = 0, c = t.length, l = function() {
r++;
console.log("🏟️ [ArenaLoading] 头像加载进度:", r + "/" + c);
if (r >= c) {
console.log("🏟️ [ArenaLoading] 所有头像预加载完成，准备进入场景");
setTimeout(function() {
n._hideArenaLoadingUI();
n._enterGameScene(o);
}, 500);
}
}, s = 0; s < t.length; s++) {
var d = t[s];
n._preloadAvatar(d, l);
}
n._arenaLoadingTimeout = setTimeout(function() {
console.warn("🏟️ [ArenaLoading] 预加载超时，强制进入场景");
n._hideArenaLoadingUI();
n._enterGameScene(o);
}, 3e3);
} else {
n._hideArenaLoadingUI();
n._enterGameScene(o);
}
}
}, n._preloadAvatar = function(e, o) {
if (0 === e.indexOf("http://") || 0 === e.indexOf("https://")) cc.assetManager.loadRemote(e, {
ext: ".png"
}, function(n, t) {
if (n || !t) console.warn("🏟️ [ArenaLoading] 远程头像预加载失败:", e); else {
console.log("🏟️ [ArenaLoading] 远程头像预加载成功:", e);
var a = window.myglobal;
if (a) {
a._avatarCache || (a._avatarCache = {});
try {
a._avatarCache[e] = new cc.SpriteFrame(t);
} catch (e) {
console.warn("🏟️ [ArenaLoading] 缓存头像失败:", e);
}
}
}
o && o();
}); else {
var n = "UI/headimage/" + e;
cc.loader.loadRes(n, cc.SpriteFrame, function(t, a) {
if (t || !a) console.warn("🏟️ [ArenaLoading] 本地头像预加载失败:", n); else {
console.log("🏟️ [ArenaLoading] 本地头像预加载成功:", n);
var i = window.myglobal;
if (i) {
i._avatarCache || (i._avatarCache = {});
i._avatarCache[e] = a;
}
}
o && o();
});
}
}, n._showArenaLoadingUI = function() {
var e = this;
if (this.node && this.node.isValid) {
this._hideArenaLoadingUI();
var o = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), n = o ? o.designResolution.height : 720, t = o ? o.designResolution.width : 1280, a = new cc.Node("ArenaLoadingMask");
a.setContentSize(cc.size(2 * t, 2 * n));
a.color = cc.color(0, 0, 0);
a.opacity = 0;
a.zIndex = 9999;
a.addComponent(cc.BlockInputEvents);
a.parent = this.node;
var i = new cc.Node("LoadingContainer");
i.parent = a;
cc.resources.load("UI/loading_image", cc.SpriteFrame, function(o, n) {
if (a && a.isValid) if (o || !n) {
console.warn("🏟️ [ArenaLoading] 加载图片不存在，使用文字提示");
var t = new cc.Node("LoadingLabel");
(d = t.addComponent(cc.Label)).string = "房间分配中...";
d.fontSize = 28;
d.lineHeight = 36;
d.fontFamily = "Arial";
t.color = cc.color(255, 255, 255);
t.parent = i;
var r = new cc.Node("TipLabel");
r.y = -50;
var c = r.addComponent(cc.Label);
c.string = "请稍候";
c.fontSize = 20;
c.lineHeight = 28;
c.fontFamily = "Arial";
r.color = cc.color(200, 200, 200);
r.parent = i;
} else {
var l = new cc.Node("LoadingImage");
l.setContentSize(cc.size(100, 100));
var s = l.addComponent(cc.Sprite);
s.spriteFrame = n;
s.type = cc.Sprite.Type.SIMPLE;
s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
l.parent = i;
e._arenaLoadingImageNode = l;
var d, h = new cc.Node("TextLabel");
h.y = -80;
(d = h.addComponent(cc.Label)).string = "房间分配中...";
d.fontSize = 24;
d.lineHeight = 32;
d.fontFamily = "Arial";
h.color = cc.color(255, 255, 255);
h.parent = i;
}
});
cc.tween(a).to(.2, {
opacity: 220
}).start();
this._arenaLoadingMask = a;
console.log("🏟️ [ArenaLoading] 加载界面已显示");
} else console.warn("🏟️ [ArenaLoading] 节点不存在，无法显示加载界面");
}, n._hideArenaLoadingUI = function() {
if (this._arenaLoadingTimeout) {
clearTimeout(this._arenaLoadingTimeout);
this._arenaLoadingTimeout = null;
}
if (this._arenaLoadingMask) {
this._arenaLoadingMask.isValid && this._arenaLoadingMask.destroy();
this._arenaLoadingMask = null;
}
this._arenaLoadingImageNode = null;
console.log("🏟️ [ArenaLoading] 加载界面已隐藏");
}, n._initLocalArenaStatusFromConfig = function() {
if (this._arenaRooms) {
for (var e = Date.now(), o = 0; o < this._arenaRooms.length; o++) {
var n = this._arenaRooms[o].config, t = n.id;
if (!this._localArenaStatus[t]) {
var a = this._calculatePhaseInfo(n);
this._localArenaStatus[t] = {
periodNo: a.periodNo,
periodNoStr: a.periodNoStr,
phase: a.phase,
countdown: a.countdown,
canSignup: a.canSignup,
totalPlayers: 0,
statusText: "",
lastUpdate: e,
isLocalCalculated: !0
};
}
}
this._updateCountdownFromLocalCache();
}
}, n._onArenaStatusPush = function(e) {
if (e) {
for (var o = Date.now(), n = 0; n < e.length; n++) {
var t = e[n], a = t.room_id, i = t.period_no_str || t.periodNoStr || "", r = this._localArenaStatus[a];
if (r && r.periodNoStr && i && r.periodNoStr !== i && window.arenaData && window.arenaData._signedUpArenas && window.arenaData._signedUpArenas[a]) {
window.arenaData._signedUpArenas[a].periodNo;
delete window.arenaData._signedUpArenas[a];
window.arenaData.saveToLocal && window.arenaData.saveToLocal();
}
this._localArenaStatus[a] = {
periodNo: t.period_no,
periodNoStr: i,
phase: t.phase || 0,
countdown: t.countdown,
canSignup: t.can_signup,
totalPlayers: t.total_players || t.totalPlayers || 0,
statusText: t.status_text || t.statusText || "",
lastUpdate: o,
isLocalCalculated: !1
};
}
this._updateCountdownFromLocalCache();
}
}, n._updateLocalCountdown = function() {
if (this._localArenaStatus) {
var e = Date.now(), o = !1;
for (var n in this._localArenaStatus) {
var t = this._localArenaStatus[n];
if ((e - t.lastUpdate) / 1e3 > 35) {
if (i = this._getArenaConfigByRoomId(parseInt(n))) {
var a = this._calculatePhaseInfo(i);
if (t.periodNoStr !== a.periodNoStr && "" !== a.periodNoStr) {
t.totalPlayers = 0;
if (window.arenaData && window.arenaData._signedUpArenas && window.arenaData._signedUpArenas[n]) {
window.arenaData._signedUpArenas[n].periodNo;
delete window.arenaData._signedUpArenas[n];
window.arenaData.saveToLocal && window.arenaData.saveToLocal();
}
}
t.phase = a.phase;
t.countdown = a.countdown;
t.canSignup = a.canSignup;
t.periodNo = a.periodNo;
t.periodNoStr = a.periodNoStr;
t.isLocalCalculated = !0;
o = !0;
}
} else if (t.countdown > 0) {
t.countdown--;
o = !0;
if (0 === t.countdown) {
var i;
if (i = this._getArenaConfigByRoomId(parseInt(n))) {
a = this._calculatePhaseInfo(i);
if (t.periodNoStr !== a.periodNoStr && "" !== a.periodNoStr) {
t.totalPlayers = 0;
if (window.arenaData && window.arenaData._signedUpArenas && window.arenaData._signedUpArenas[n]) {
window.arenaData._signedUpArenas[n].periodNo;
delete window.arenaData._signedUpArenas[n];
window.arenaData.saveToLocal && window.arenaData.saveToLocal();
}
}
t.phase = a.phase;
t.countdown = a.countdown;
t.canSignup = a.canSignup;
t.periodNo = a.periodNo;
t.periodNoStr = a.periodNoStr;
}
}
}
}
o && this._updateCountdownFromLocalCache();
}
}, n._calculatePhaseInfo = function(e) {
var o = {
phase: 0,
countdown: -1,
canSignup: !1,
periodNo: 0,
periodNoStr: ""
}, n = e.match_time_ranges || e.matchTimeRanges, t = e.match_duration || e.matchDuration || e.interval_minutes || e.intervalMinutes || 5;
e.room_type || e.roomType;
if (!n || !t) return o;
try {
var a = "string" == typeof n ? JSON.parse(n) : n;
if (!a || 0 === a.length) return o;
for (var i = new Date(), r = 60 * i.getHours() + i.getMinutes(), c = 60 * r + i.getSeconds(), l = null, s = 0, d = 0; d < a.length; d++) {
var h = a[d], u = h.start.split(":"), p = h.end.split(":"), g = 60 * parseInt(u[0]) + parseInt(u[1]), _ = 60 * parseInt(p[0]) + parseInt(p[1]);
if (r >= g && r <= _) {
l = h;
s = g;
break;
}
}
if (!l) return o;
var f = c - 60 * s, m = 60 * t, C = Math.floor(f / m) + 1, v = f % m, w = String(i.getFullYear()).slice(-2) + String(i.getMonth() + 1).padStart(2, "0") + String(i.getDate()).padStart(2, "0"), y = e.id || e.room_id || 0, b = w + String(y % 100).padStart(2, "0") + String(C).padStart(4, "0");
if (v < 60) {
o.phase = 1;
o.countdown = 60 - v;
o.canSignup = !1;
} else {
o.phase = 2;
o.countdown = m - v;
o.canSignup = o.countdown > 0;
}
o.periodNo = C;
o.periodNoStr = b;
} catch (e) {
console.error("⏰ [_calculatePhaseInfo] error:", e);
}
return o;
}, n._getArenaConfigByRoomId = function(e) {
if (!this._arenaRooms) return null;
for (var o = 0; o < this._arenaRooms.length; o++) if (this._arenaRooms[o].config.id === e) return this._arenaRooms[o].config;
return null;
}, n._updateCountdownFromLocalCache = function() {
if (this._arenaRooms && this._localArenaStatus) for (var e = this.node.getChildByName("CardContainer"), o = e ? e.getChildByName("ArenaCountdowns") : null, n = e ? e.getChildByName("ArenaSignupButtons") : null, t = 0; t < this._arenaRooms.length; t++) {
var a = this._arenaRooms[t].config.id, i = this._localArenaStatus[a];
if (i) {
var r = o ? o.getChildByName("RoomStatusItem_" + a) : null;
if (r) {
var c = r.getChildByName("PeriodLabel"), l = r.getChildByName("TitleLabel"), s = n ? n.getChildByName("SignupBtn_" + a) : null;
if (c) {
var d = c.getComponent(cc.Label), h = i.period_no_str || i.periodNoStr || i.periodNo;
if (h && 0 !== i.phase) {
d.string = "期号: " + h;
c.color = cc.color(255, 215, 0);
} else {
d.string = "期号: --";
c.color = cc.color(180, 180, 180);
}
}
if (l) {
var u = l.getComponent(cc.Label), p = i.phase || 0, g = i.total_players || i.totalPlayers || 0;
if (1 === p) {
var _ = i.countdown || 0;
u.string = "准备中 " + _ + "秒";
l.color = cc.color(255, 200, 100);
} else if (2 === p) {
var f = Math.floor((i.countdown || 0) / 60), m = (f < 10 ? "0" : "") + f + ":" + ((_ = (i.countdown || 0) % 60) < 10 ? "0" : "") + _;
u.string = "报名中 " + m + " (" + g + "人)";
l.color = cc.color(0, 255, 100);
} else {
u.string = "暂未开放";
l.color = cc.color(200, 200, 200);
}
}
if (s) {
var C = s.getComponent(cc.Sprite), v = s.getComponent(cc.Button);
C.sizeMode = cc.Sprite.SizeMode.CUSTOM;
s.setContentSize(cc.size(160, 65));
if (2 === (p = i.phase || 0) && i.canSignup) if (window.arenaData && window.arenaData.isSignedUp(a)) {
this._signupBtnFrames && this._signupBtnFrames.btn_quxiaobaoming && (C.spriteFrame = this._signupBtnFrames.btn_quxiaobaoming);
s.active = !0;
v && (v.enabled = !0);
} else {
this._signupBtnFrames && this._signupBtnFrames.btn_baoming && (C.spriteFrame = this._signupBtnFrames.btn_baoming);
s.active = !0;
v && (v.enabled = !0);
} else {
this._signupBtnFrames && this._signupBtnFrames.btn_no_baoming && (C.spriteFrame = this._signupBtnFrames.btn_no_baoming);
s.active = !0;
v && (v.enabled = !1);
}
}
}
}
}
}, n._updateCountdownFromServer = function(e) {
this._onArenaStatusPush(e);
}, n._updateCountdownDisplay = function() {
this._updateCountdownFromLocalCache();
}, n._updateArenaSignupStatus = function() {
this._updateCountdownDisplay();
}, n._showLoadingProgress = function(e, o) {
var n = this, t = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), a = t ? t.designResolution.height : 720, i = t ? t.designResolution.width : 1280, r = new cc.Node("LoadingProgressNode");
r.setContentSize(cc.size(i, a));
r.anchorX = .5;
r.anchorY = .5;
r.x = 0;
r.y = 0;
r.zIndex = 3e3;
r.parent = this.node;
var c = new cc.Node("Bg");
c.setContentSize(cc.size(i, a));
var l = c.addComponent(cc.Graphics);
l.fillColor = cc.color(20, 20, 40, 250);
l.rect(-i / 2, -a / 2, i, a);
l.fill();
c.parent = r;
this._addLoadingDecorations(r, i, a);
var s = new cc.Node("Title");
s.y = 150;
var d = s.addComponent(cc.Label);
d.string = "斗地主";
d.fontSize = 56;
d.lineHeight = 72;
d.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.color = cc.color(255, 215, 0);
var h = s.addComponent(cc.LabelOutline);
h.color = cc.color(139, 69, 19);
h.width = 3;
s.parent = r;
var u = new cc.Node("RoomName");
u.y = 80;
var p = u.addComponent(cc.Label);
p.string = "进入【" + e.room_name + "】";
p.fontSize = 32;
p.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
u.color = cc.color(200, 200, 220);
u.parent = r;
var g = new cc.Node("Tip");
g.y = -100;
var _ = g.addComponent(cc.Label);
_.string = "正在加载资源...";
_.fontSize = 24;
_.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
g.color = cc.color(150, 150, 170);
g.parent = r;
var f = new cc.Node("ProgressBg");
f.setContentSize(cc.size(500, 30));
f.y = -160;
var m = f.addComponent(cc.Graphics);
m.fillColor = cc.color(40, 40, 60, 255);
m.roundRect(-250, -15, 500, 30, 15);
m.fill();
m.strokeColor = cc.color(80, 80, 100);
m.lineWidth = 2;
m.roundRect(-250, -15, 500, 30, 15);
m.stroke();
f.parent = r;
var C = new cc.Node("ProgressFill");
C.y = -160;
var v = C.addComponent(cc.Graphics);
C.parent = r;
var w = new cc.Node("Percent");
w.y = -160;
var y = w.addComponent(cc.Label);
y.string = "0%";
y.fontSize = 20;
y.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
w.color = cc.color(255, 255, 255);
w.parent = r;
var b = new cc.Node("BottomTip");
b.y = -220;
var S = b.addComponent(cc.Label);
S.string = "正在连接服务器...";
S.fontSize = 18;
S.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
b.color = cc.color(100, 100, 120);
b.parent = r;
var N = [ "正在加载资源...", "正在连接服务器...", "正在获取房间列表...", "正在准备游戏数据...", "即将进入房间..." ], L = 0, A = 0;
(function t() {
if (L >= 100) n.scheduleOnce(function() {
r && r.isValid && r.destroy();
n._showRoomListScene(e, o);
}, .3); else {
(L += 2) > 100 && (L = 100);
var a = L / 100 * 480;
v.clear();
if (a > 0) {
v.fillColor = cc.color(76, 175, 80);
v.roundRect(-240, -12, a, 24, 12);
v.fill();
}
y.string = L + "%";
var i = Math.floor(L / 20);
if (i < N.length && i !== A) {
A = i;
_.string = N[A];
S.string = N[A];
}
n.scheduleOnce(t, .05);
}
})();
}, n._addLoadingDecorations = function(e, o, n) {
for (var t = [ "♠", "♥", "♣", "♦" ], a = [ cc.color(50, 50, 70, 100), cc.color(180, 50, 50, 100), cc.color(50, 50, 70, 100), cc.color(180, 50, 50, 100) ], i = [ cc.v2(-o / 2 + 80, n / 2 - 80), cc.v2(o / 2 - 80, n / 2 - 80), cc.v2(-o / 2 + 80, -n / 2 + 80), cc.v2(o / 2 - 80, -n / 2 + 80) ], r = 0; r < 4; r++) {
var c = new cc.Node("CardSymbol" + r);
c.setPosition(i[r]);
var l = c.addComponent(cc.Label);
l.string = t[r];
l.fontSize = 60;
c.color = a[r];
c.parent = e;
}
}, n._showRoomListScene = function(e, o) {
window.myglobal;
var n = this.node.getChildByName("RoomListScene");
n && n.destroy();
var t = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), a = t ? t.designResolution.height : 720, i = t ? t.designResolution.width : 1280, r = new cc.Node("RoomListScene");
r.setContentSize(cc.size(i, a));
r.anchorX = .5;
r.anchorY = .5;
r.x = 0;
r.y = 0;
r.zIndex = 2500;
r.parent = this.node;
this._createRoomListBackground(r, i, a);
this._createRoomListHeader(r, i, a, e);
this._createRoomListActions(r, i, a, e, o);
this._createRoomListContent(r, i, a, e, o);
this._createRoomListFooter(r, i, a, o, e);
}, n._createRoomListBackground = function(e, o, n) {
var t = new cc.Node("BgLayer");
t.setContentSize(cc.size(o, n));
var a = t.addComponent(cc.Graphics);
a.fillColor = cc.color(20, 25, 45, 255);
a.rect(-o / 2, -n / 2, o, n);
a.fill();
t.parent = e;
var i = new cc.Node("Border"), r = i.addComponent(cc.Graphics);
r.strokeColor = cc.color(180, 140, 60, 150);
r.lineWidth = 3;
r.roundRect(-o / 2 + 5, -n / 2 + 5, o - 10, n - 10, 10);
r.stroke();
i.parent = e;
for (var c = [ {
x: -o / 2 + 30,
y: n / 2 - 30,
rot: 0
}, {
x: o / 2 - 30,
y: n / 2 - 30,
rot: 90
}, {
x: o / 2 - 30,
y: -n / 2 + 30,
rot: 180
}, {
x: -o / 2 + 30,
y: -n / 2 + 30,
rot: 270
} ], l = 0; l < c.length; l++) {
var s = c[l], d = new cc.Node("Corner" + l);
d.setPosition(s.x, s.y);
d.angle = -s.rot;
var h = d.addComponent(cc.Graphics);
h.strokeColor = cc.color(220, 180, 80, 200);
h.lineWidth = 2;
h.moveTo(0, 0);
h.lineTo(40, 0);
h.lineTo(40, 15);
h.moveTo(0, 0);
h.lineTo(0, 40);
h.lineTo(15, 40);
h.stroke();
d.parent = e;
}
}, n._createRoomListHeader = function(e, o, n, t) {
var a = n / 2 - 55, i = new cc.Node("HeaderBg");
i.setContentSize(cc.size(o - 60, 80));
i.setPosition(0, a);
var r = i.addComponent(cc.Graphics);
r.fillColor = cc.color(35, 30, 50, 240);
r.roundRect(-(o - 60) / 2, -40, o - 60, 80, 8);
r.fill();
r.strokeColor = cc.color(180, 140, 60, 200);
r.lineWidth = 2;
r.roundRect(-(o - 60) / 2, -40, o - 60, 80, 8);
r.stroke();
i.parent = e;
var c = new cc.Node("LeftDeco");
c.setPosition(-o / 2 + 80, a);
var l = c.addComponent(cc.Graphics);
l.fillColor = cc.color(200, 160, 60, 220);
l.circle(0, 0, 8);
l.fill();
c.parent = e;
var s = new cc.Node("RightDeco");
s.setPosition(o / 2 - 80, a);
var d = s.addComponent(cc.Graphics);
d.fillColor = cc.color(200, 160, 60, 220);
d.circle(0, 0, 8);
d.fill();
s.parent = e;
var h = new cc.Node("TitleText");
h.setPosition(0, a + 12);
h.anchorX = .5;
h.anchorY = .5;
var u = h.addComponent(cc.Label);
u.string = t.room_name || "游戏房间";
u.fontSize = 28;
u.lineHeight = 36;
u.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
h.color = cc.color(255, 220, 100);
var p = h.addComponent(cc.LabelOutline);
p.color = cc.color(80, 50, 0);
p.width = 2;
h.parent = e;
var g = new cc.Node("SubText");
g.setPosition(0, a - 14);
g.anchorX = .5;
g.anchorY = .5;
var _ = g.addComponent(cc.Label);
_.string = "底分 " + (t.base_score || 1) + "  ·  倍率 " + (t.multiplier || 1) + "x";
_.fontSize = 18;
_.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
g.color = cc.color(200, 180, 140);
g.parent = e;
}, n._createRoomListActions = function(e, o, n, t, a) {
var i = this, r = n / 2 - 125, c = new cc.Node("ActionBarBg");
c.setPosition(0, r);
var l = c.addComponent(cc.Graphics);
l.fillColor = cc.color(30, 27, 45, 230);
l.roundRect(-o / 2 + 30, -32.5, o - 60, 65, 6);
l.fill();
c.parent = e;
var s = -o / 2 + 200;
this._createSimpleInputBox("输入房间号", s, r, 180, 44).parent = e;
this._createActionButton("加入房间", cc.color(76, 175, 80), s + 160, r, 110, 44, function() {
var o = e.getChildByName("RoomCodeInput"), n = o ? o.getComponent(cc.EditBox) : null, r = n ? n.string : "";
r && r.length > 0 ? i._joinRoom(r, t, a) : i._showTipInScene(e, "请输入房间号");
}).parent = e;
var d = o / 2 - 170;
this._createActionButton("创建房间", cc.color(255, 152, 0), d - 85, r, 120, 44, function() {
i._showCreateRoomDialog(e, t, a);
}).parent = e;
this._createActionButton("快速开始", cc.color(33, 150, 243), d + 85, r, 120, 44, function() {
var o = e.getChildByName("RoomListScene") || e;
o.destroy && o.destroy();
i._quickMatch(t, a);
}).parent = e;
}, n._createSimpleInputBox = function(e, o, n, t, a) {
var i = new cc.Node("RoomCodeInput");
i.setContentSize(cc.size(t, a));
i.setPosition(o, n);
i.anchorX = .5;
i.anchorY = .5;
var r = i.addComponent(cc.Graphics);
r.fillColor = cc.color(45, 40, 60, 255);
r.roundRect(-t / 2, -a / 2, t, a, 6);
r.fill();
r.strokeColor = cc.color(120, 100, 70, 220);
r.lineWidth = 2;
r.roundRect(-t / 2, -a / 2, t, a, 6);
r.stroke();
var c = i.addComponent(cc.EditBox);
c.string = "";
c.placeholder = e;
c.fontSize = 18;
c.fontColor = cc.color(255, 255, 255);
c.placeholderFontSize = 16;
c.placeholderFontColor = cc.color(130, 120, 110);
c.maxLength = 20;
c.inputMode = cc.EditBox.InputMode.NUMERIC;
c.returnType = cc.EditBox.KeyboardReturnType.DONE;
c.lineHeight = a - 8;
c.node.on("editing-did-begin", function() {
r.clear();
r.fillColor = cc.color(55, 50, 75, 255);
r.roundRect(-t / 2, -a / 2, t, a, 6);
r.fill();
r.strokeColor = cc.color(180, 150, 80, 255);
r.lineWidth = 2;
r.roundRect(-t / 2, -a / 2, t, a, 6);
r.stroke();
});
c.node.on("editing-did-end", function() {
r.clear();
r.fillColor = cc.color(45, 40, 60, 255);
r.roundRect(-t / 2, -a / 2, t, a, 6);
r.fill();
r.strokeColor = cc.color(120, 100, 70, 220);
r.lineWidth = 2;
r.roundRect(-t / 2, -a / 2, t, a, 6);
r.stroke();
});
return i;
}, n._createActionButton = function(e, o, n, t, a, i, r) {
var c = new cc.Node("ActionBtn_" + e);
c.setContentSize(cc.size(a, i));
c.setPosition(n, t);
c.anchorX = .5;
c.anchorY = .5;
var l = c.addComponent(cc.Graphics);
l.fillColor = o;
l.roundRect(-a / 2, -i / 2, a, i, 8);
l.fill();
l.fillColor = cc.color(255, 255, 255, 40);
l.roundRect(-a / 2 + 2, 2, a - 4, i / 2 - 2, 6);
l.fill();
var s = new cc.Node("Text");
s.anchorX = .5;
s.anchorY = .5;
var d = s.addComponent(cc.Label);
d.string = e;
d.fontSize = 18;
d.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
d.verticalAlign = cc.Label.VerticalAlign.CENTER;
s.color = cc.color(255, 255, 255);
var h = s.addComponent(cc.LabelOutline);
h.color = cc.color(0, 0, 0, 150);
h.width = 1;
s.parent = c;
c.on(cc.Node.EventType.TOUCH_START, function(e) {
e.stopPropagation();
c.scale = .95;
});
c.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
c.scale = 1;
r && r();
});
c.on(cc.Node.EventType.TOUCH_CANCEL, function() {
c.scale = 1;
});
return c;
}, n._createRoomListContent = function(e, o, n, t, a) {
var i = n - 280, r = o - 60, c = new cc.Node("ListBg");
c.setContentSize(cc.size(r, i));
c.setPosition(0, -30);
var l = c.addComponent(cc.Graphics);
l.fillColor = cc.color(25, 22, 40, 240);
l.roundRect(-r / 2, -i / 2, r, i, 8);
l.fill();
l.strokeColor = cc.color(80, 65, 50, 150);
l.lineWidth = 1;
l.roundRect(-r / 2, -i / 2, r, i, 8);
l.stroke();
c.parent = e;
var s = i / 2 - 30 - 25, d = new cc.Node("TableHeader");
d.setPosition(0, s);
var h = d.addComponent(cc.Graphics);
h.fillColor = cc.color(40, 35, 55, 255);
h.roundRect(-r / 2 + 5, -20, r - 10, 40, 4);
h.fill();
d.parent = e;
for (var u = r / 5, p = [ "房间号", "人数", "底分", "状态", "操作" ], g = 0; g < p.length; g++) {
var _ = new cc.Node("H" + g);
_.x = -r / 2 + u * (g + .5);
_.y = s;
_.anchorX = .5;
_.anchorY = .5;
var f = _.addComponent(cc.Label);
f.string = p[g];
f.fontSize = 16;
f.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
_.color = cc.color(240, 200, 120);
var m = _.addComponent(cc.LabelOutline);
m.color = cc.color(60, 50, 40);
m.width = 1;
_.parent = e;
}
var C = new cc.Node("RoomListContainer");
C.setContentSize(cc.size(r - 20, i - 70));
C.y = -50;
C.parent = e;
var v = new cc.Node("LoadingLabel");
v.anchorX = .5;
v.anchorY = .5;
var w = v.addComponent(cc.Label);
w.string = "正在加载房间列表...";
w.fontSize = 18;
w.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
v.color = cc.color(160, 150, 140);
v.parent = C;
this._fetchAndRenderRoomListForScene(C, v, t, a, e);
}, n._createRoomListFooter = function(e, o, n, t, a) {
var i = this, r = -n / 2 + 50, c = new cc.Node("FooterBg");
c.setPosition(0, r);
var l = c.addComponent(cc.Graphics);
l.fillColor = cc.color(28, 25, 42, 240);
l.roundRect(-o / 2 + 30, -25, o - 60, 50, 6);
l.fill();
c.parent = e;
this._createActionButton("返回大厅", cc.color(90, 85, 100), -o / 2 + 120, r, 110, 40, function() {
var o = e.getChildByName("RoomListScene") || e;
o.destroy && o.destroy();
}).parent = e;
var s = new cc.Node("GoldIcon");
s.setPosition(30, r);
var d = s.addComponent(cc.Graphics);
d.fillColor = cc.color(230, 180, 50);
d.circle(0, 0, 10);
d.fill();
d.fillColor = cc.color(250, 210, 80);
d.circle(0, 0, 6);
d.fill();
s.parent = e;
var h = new cc.Node("GoldText");
h.setPosition(50, r);
h.anchorX = 0;
h.anchorY = .5;
var u = h.addComponent(cc.Label);
u.string = this._formatGold(t);
u.fontSize = 16;
h.color = cc.color(230, 190, 80);
h.parent = e;
this._createActionButton("刷新列表", cc.color(60, 130, 180), o / 2 - 100, r, 100, 40, function() {
var o = e.getChildByName("RoomListContainer");
if (o) {
var n = o.getChildByName("LoadingLabel");
if (n) {
n.active = !0;
n.getComponent(cc.Label).string = "正在刷新...";
}
for (var r = o.children.slice(), c = 0; c < r.length; c++) "LoadingLabel" !== r[c].name && r[c].destroy();
i._fetchAndRenderRoomListForScene(o, n, a, t, e);
}
}).parent = e;
}, n._createButtonNode = function(e, o, n, t, a, i, r, c) {
var l = new cc.Node("Btn_" + e);
l.setContentSize(cc.size(a, i));
l.setPosition(n, t);
l.anchorX = .5;
l.anchorY = .5;
var s = new cc.Node("BgNode");
s.setPosition(0, 0);
s.anchorX = .5;
s.anchorY = .5;
var d = s.addComponent(cc.Graphics);
d.fillColor = o;
d.roundRect(-a / 2, -i / 2, a, i, 5);
d.fill();
var h = cc.color(Math.min(255, o.r + 40), Math.min(255, o.g + 40), Math.min(255, o.b + 40));
d.strokeColor = h;
d.lineWidth = 1;
d.roundRect(-a / 2, -i / 2, a, i, 5);
d.stroke();
if (c) {
d.fillColor = cc.color(255, 255, 255, 50);
d.roundRect(-a / 2 + 2, 2, a - 4, i / 2 - 2, 3);
d.fill();
}
s.parent = l;
var u = new cc.Node("TextNode");
u.setPosition(0, 0);
u.anchorX = .5;
u.anchorY = .5;
u.width = a;
u.height = i;
var p = u.addComponent(cc.Label);
p.string = e;
p.fontSize = Math.floor(.42 * i);
p.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
p.verticalAlign = cc.Label.VerticalAlign.CENTER;
p.overflow = cc.Label.Overflow.NONE;
u.color = cc.color(255, 255, 255);
var g = u.addComponent(cc.LabelOutline);
g.color = cc.color(0, 0, 0, 120);
g.width = 1;
u.parent = l;
l.on(cc.Node.EventType.TOUCH_START, function(e) {
e.stopPropagation();
l.scale = .95;
});
l.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
l.scale = 1;
r && r();
});
l.on(cc.Node.EventType.TOUCH_CANCEL, function() {
l.scale = 1;
});
return l;
}, n._createImageButtonNode = function(e, o, n, t, a, i, r) {
var c = this, l = new cc.Node("Btn_" + o);
l.setContentSize(cc.size(a, i));
l.setPosition(n, t);
l.anchorX = .5;
l.anchorY = .5;
var s = l.addComponent(cc.Sprite);
s.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load(e, cc.SpriteFrame, function(n, t) {
if (n) {
console.warn("加载按钮图片失败:", e);
c._createButtonFallback(l, o, a, i);
} else s.spriteFrame = t;
});
var d = l.addComponent(cc.Button);
d.transition = cc.Button.Transition.SCALE;
d.duration = .1;
d.zoomScale = .95;
l.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
r && r();
});
return l;
}, n._createButtonFallback = function(e, o, n, t) {
var a, i = e.addComponent(cc.Graphics);
a = o.indexOf("创建") >= 0 ? cc.color(30, 90, 160) : o.indexOf("加入") >= 0 || o.indexOf("进入") >= 0 ? cc.color(40, 130, 60) : o.indexOf("快速") >= 0 ? cc.color(200, 120, 40) : cc.color(80, 80, 80);
i.fillColor = a;
i.roundRect(-n / 2, -t / 2, n, t, 6);
i.fill();
i.strokeColor = cc.color(255, 255, 255, 80);
i.lineWidth = 2;
i.roundRect(-n / 2, -t / 2, n, t, 6);
i.stroke();
var r = new cc.Node("Label"), c = r.addComponent(cc.Label);
c.string = o;
c.fontSize = Math.floor(.4 * t);
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
r.color = cc.color(255, 255, 255);
r.parent = e;
}, n._createInputNode = function(e, o, n, t, a) {
var i = new cc.Node("InputNode");
i.setContentSize(cc.size(t, a));
i.setPosition(o, n);
i.anchorX = .5;
i.anchorY = .5;
i.name = "RoomCodeInput";
var r = new cc.Node("InputBg");
r.setPosition(0, 0);
r.anchorX = .5;
r.anchorY = .5;
var c = r.addComponent(cc.Graphics);
c.fillColor = cc.color(45, 40, 60, 255);
c.roundRect(-t / 2, -a / 2, t, a, 5);
c.fill();
c.strokeColor = cc.color(100, 90, 70, 200);
c.lineWidth = 1;
c.roundRect(-t / 2, -a / 2, t, a, 5);
c.stroke();
r.parent = i;
var l = new cc.Node("Placeholder");
l.setPosition(0, 0);
l.anchorX = .5;
l.anchorY = .5;
l.width = t - 20;
l.height = a;
var s = l.addComponent(cc.Label);
s.string = e;
s.fontSize = Math.floor(.4 * a);
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
l.color = cc.color(130, 120, 110);
l.parent = i;
return i;
}, n._createStyledButton = function(e, o, n, t, a, i) {
a = a || 100;
i = i || 40;
var r = new cc.Node("Btn_" + e);
r.setContentSize(cc.size(a, i));
r.setPosition(n, 0);
var c = r.addComponent(cc.Graphics);
c.fillColor = o;
c.roundRect(-a / 2, -i / 2, a, i, 8);
c.fill();
var l = r.addComponent(cc.Label);
l.string = e;
l.fontSize = 18;
l.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
l.verticalAlign = cc.Label.VerticalAlign.CENTER;
r.color = cc.color(255, 255, 255);
r.on(cc.Node.EventType.TOUCH_START, function(e) {
e.stopPropagation();
r.scale = .95;
});
r.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
r.scale = 1;
t && t();
});
r.on(cc.Node.EventType.TOUCH_CANCEL, function() {
r.scale = 1;
});
return r;
}, n._showTipInScene = function(e, o) {
var n = e.getChildByName("SceneTip");
n && n.destroy();
(n = new cc.Node("SceneTip")).y = 100;
var t = n.addComponent(cc.Graphics);
t.fillColor = cc.color(0, 0, 0, 180);
t.roundRect(-150, -20, 300, 40, 8);
t.fill();
var a = n.addComponent(cc.Label);
a.string = o;
a.fontSize = 20;
a.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
n.color = cc.color(255, 255, 0);
n.parent = e;
this.scheduleOnce(function() {
n && n.isValid && n.destroy();
}, 2);
}, n._showCreateRoomDialog = function(e, o, n) {
var t = this, a = e.getChildByName("CreateRoomDialog");
a && a.destroy();
var i = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), r = i ? i.designResolution.height : 720, c = i ? i.designResolution.width : 1280, l = new cc.Node("CreateRoomDialog");
l.setContentSize(cc.size(c, r));
l.setPosition(0, 0);
l.zIndex = 3e3;
l.parent = e;
var s = new cc.Node("Mask");
s.setContentSize(cc.size(c, r));
var d = s.addComponent(cc.Graphics);
d.fillColor = cc.color(0, 0, 0, 180);
d.rect(-c / 2, -r / 2, c, r);
d.fill();
s.parent = l;
s.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
l.destroy();
});
var h = new cc.Node("DialogBg");
h.setContentSize(cc.size(480, 420));
var u = h.addComponent(cc.Graphics);
u.fillColor = cc.color(0, 0, 0, 80);
u.roundRect(-235, -215, 480, 420, 12);
u.fill();
u.fillColor = cc.color(35, 32, 50, 255);
u.roundRect(-240, -210, 480, 420, 12);
u.fill();
u.strokeColor = cc.color(255, 180, 60, 200);
u.lineWidth = 2;
u.roundRect(-240, -210, 480, 420, 12);
u.stroke();
h.parent = l;
var p = new cc.Node("HeaderBar");
p.y = 180;
var g = p.addComponent(cc.Graphics);
g.fillColor = cc.color(255, 152, 0);
g.roundRect(-240, -25, 480, 50, [ 12, 12, 0, 0 ]);
g.fill();
p.parent = l;
var _ = new cc.Node("Title");
_.y = 180;
_.anchorX = .5;
_.anchorY = .5;
var f = _.addComponent(cc.Label);
f.string = "创建房间";
f.fontSize = 24;
f.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
_.color = cc.color(255, 255, 255);
var m = _.addComponent(cc.LabelOutline);
m.color = cc.color(120, 60, 0);
m.width = 2;
_.parent = l;
var C = new cc.Node("CloseBtn");
C.setContentSize(cc.size(30, 30));
C.x = 215;
C.y = 180;
var v = C.addComponent(cc.Graphics);
v.fillColor = cc.color(0, 0, 0, 80);
v.circle(0, 0, 15);
v.fill();
C.parent = l;
var w = new cc.Node("X");
w.anchorX = .5;
w.anchorY = .5;
var y = w.addComponent(cc.Label);
y.string = "×";
y.fontSize = 24;
y.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
w.color = cc.color(255, 255, 255);
w.parent = C;
C.on(cc.Node.EventType.TOUCH_END, function() {
l.destroy();
});
var b = new cc.Node("RoomTypeBg");
b.y = 130;
var S = b.addComponent(cc.Graphics);
S.fillColor = cc.color(60, 55, 80, 200);
S.roundRect(-80, -16, 160, 32, 16);
S.fill();
b.parent = l;
var N = new cc.Node("RoomType");
N.y = 130;
N.anchorX = .5;
N.anchorY = .5;
var L = N.addComponent(cc.Label);
L.string = o.room_name || "初级房";
L.fontSize = 16;
L.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
N.color = cc.color(255, 220, 120);
N.parent = l;
var A = new cc.Node("NameLabel");
A.x = -210;
A.y = 80;
A.anchorX = 0;
A.anchorY = .5;
var T = A.addComponent(cc.Label);
T.string = "房间名称:";
T.fontSize = 18;
A.color = cc.color(220, 210, 190);
A.parent = l;
this._createEditBoxInput("输入房间名称（可选）", 40, 45, 400, 48, "NameInput", {
value: ""
}).parent = l;
var R = new cc.Node("PwdLabel");
R.x = -210;
R.y = -25;
R.anchorX = 0;
R.anchorY = .5;
var k = R.addComponent(cc.Label);
k.string = "房间密码:";
k.fontSize = 18;
R.color = cc.color(220, 210, 190);
R.parent = l;
this._createEditBoxInput("设置密码（可选）", 40, -60, 400, 48, "PwdInput", {
value: ""
}).parent = l;
var z = new cc.Node("Tip");
z.y = -110;
z.anchorX = .5;
z.anchorY = .5;
var P = z.addComponent(cc.Label);
P.string = "留空密码则创建公开房间，任何人可直接加入";
P.fontSize = 14;
P.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
z.color = cc.color(160, 150, 140);
z.parent = l;
this._createDialogButton("取消", cc.color(80, 75, 95), -90, -160, 130, 48, function() {
l.destroy();
}).parent = l;
this._createDialogButton("创建房间", cc.color(255, 152, 0), 90, -160, 150, 48, function() {
var a = l.getChildByName("NameInput"), i = l.getChildByName("PwdInput"), r = a ? a.getComponent(cc.EditBox) : null, c = i ? i.getComponent(cc.EditBox) : null, s = r && r.string || o.room_name || "我的房间", d = c && c.string || "", h = window.myglobal;
h && (h.createRoomInfo = {
roomName: s,
password: d,
roomConfig: o
});
l.destroy();
var u = e.getChildByName("RoomListScene") || e;
u.destroy && u.destroy();
t._createRoom(o, n);
}).parent = l;
}, n._createEditBoxInput = function(e, o, n, t, a, i, r) {
var c = new cc.Node(i);
c.setContentSize(cc.size(t, a));
c.setPosition(o, n);
c.anchorX = 0;
c.anchorY = .5;
var l = c.addComponent(cc.Graphics);
l.fillColor = cc.color(50, 45, 65, 255);
l.roundRect(0, -a / 2, t, a, 8);
l.fill();
l.strokeColor = cc.color(120, 100, 70, 220);
l.lineWidth = 2;
l.roundRect(0, -a / 2, t, a, 8);
l.stroke();
var s = c.addComponent(cc.EditBox);
s.string = "";
s.placeholder = e;
s.fontSize = 18;
s.fontColor = cc.color(255, 255, 255);
s.placeholderFontSize = 16;
s.placeholderFontColor = cc.color(130, 120, 110);
s.maxLength = 30;
s.inputMode = cc.EditBox.InputMode.ANY;
s.returnType = cc.EditBox.KeyboardReturnType.DONE;
s.lineHeight = a - 10;
s.node.on("text-changed", function(e) {
r && (r.value = e.string);
});
s.node.on("editing-did-begin", function() {
l.clear();
l.fillColor = cc.color(60, 55, 80, 255);
l.roundRect(0, -a / 2, t, a, 8);
l.fill();
l.strokeColor = cc.color(255, 180, 80, 255);
l.lineWidth = 2;
l.roundRect(0, -a / 2, t, a, 8);
l.stroke();
});
s.node.on("editing-did-end", function() {
l.clear();
l.fillColor = cc.color(50, 45, 65, 255);
l.roundRect(0, -a / 2, t, a, 8);
l.fill();
l.strokeColor = cc.color(120, 100, 70, 220);
l.lineWidth = 2;
l.roundRect(0, -a / 2, t, a, 8);
l.stroke();
});
return c;
}, n._createInputDialogInput = function(e, o, n, t, a, i, r) {
var c = new cc.Node(i);
c.setContentSize(cc.size(t, a));
c.setPosition(o, n);
c.anchorX = .5;
c.anchorY = .5;
var l = c.addComponent(cc.Graphics);
l.fillColor = cc.color(50, 45, 65, 255);
l.roundRect(-t / 2, -a / 2, t, a, 6);
l.fill();
l.strokeColor = cc.color(120, 100, 70, 200);
l.lineWidth = 1;
l.roundRect(-t / 2, -a / 2, t, a, 6);
l.stroke();
var s = new cc.Node("Text");
s.anchorX = .5;
s.anchorY = .5;
s.parent = c;
var d = s.addComponent(cc.Label);
d.string = e;
d.fontSize = 14;
d.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.color = cc.color(130, 120, 110);
c.on(cc.Node.EventType.TOUCH_END, function(o) {
o.stopPropagation();
var n = "";
try {
"undefined" != typeof window && window.prompt && (n = window.prompt(e, r.value || "") || "");
} catch (e) {}
if (n) {
r.value = n;
d.string = n;
s.color = cc.color(255, 255, 255);
} else if (r.value) {
d.string = r.value;
s.color = cc.color(255, 255, 255);
} else {
d.string = e;
s.color = cc.color(130, 120, 110);
}
});
return c;
}, n._createDialogButton = function(e, o, n, t, a, i, r) {
var c = new cc.Node("Btn_" + e);
c.setContentSize(cc.size(a, i));
c.setPosition(n, t);
c.anchorX = .5;
c.anchorY = .5;
var l = c.addComponent(cc.Graphics);
l.fillColor = o;
l.roundRect(-a / 2, -i / 2, a, i, 8);
l.fill();
l.strokeColor = cc.color(Math.min(255, o.r + 30), Math.min(255, o.g + 30), Math.min(255, o.b + 30));
l.lineWidth = 2;
l.roundRect(-a / 2, -i / 2, a, i, 8);
l.stroke();
var s = new cc.Node("Text");
s.anchorX = .5;
s.anchorY = .5;
var d = s.addComponent(cc.Label);
d.string = e;
d.fontSize = 18;
d.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.color = cc.color(255, 255, 255);
s.parent = c;
c.on(cc.Node.EventType.TOUCH_START, function(e) {
e.stopPropagation();
c.scale = .95;
});
c.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
c.scale = 1;
r && r();
});
c.on(cc.Node.EventType.TOUCH_CANCEL, function() {
c.scale = 1;
});
return c;
}, n._createBeautifulInput = function(e, o, n, t, a, i) {
var r = new cc.Node(i || "BeautifulInput");
r.setContentSize(cc.size(t, a));
r.setPosition(o, n);
r.anchorX = .5;
r.anchorY = .5;
var c = new cc.Node("InputBg");
c.setPosition(0, 0);
c.anchorX = .5;
c.anchorY = .5;
var l = c.addComponent(cc.Graphics);
l.fillColor = cc.color(55, 45, 70, 255);
l.roundRect(-t / 2, -a / 2, t, a, 6);
l.fill();
l.strokeColor = cc.color(150, 120, 80, 200);
l.lineWidth = 2;
l.roundRect(-t / 2, -a / 2, t, a, 6);
l.stroke();
l.strokeColor = cc.color(80, 70, 100, 100);
l.lineWidth = 1;
l.roundRect(-t / 2 + 3, -a / 2 + 3, t - 6, a - 6, 4);
l.stroke();
c.parent = r;
var s = new cc.Node("Placeholder");
s.setPosition(0, 0);
s.anchorX = .5;
s.anchorY = .5;
s.width = t - 20;
s.height = a;
var d = s.addComponent(cc.Label);
d.string = e;
d.fontSize = 14;
d.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
d.verticalAlign = cc.Label.VerticalAlign.CENTER;
s.color = cc.color(140, 130, 120);
s.parent = r;
return r;
}, n._createBeautifulButton = function(e, o, n, t, a, i, r, c, l) {
var s = new cc.Node("BeautifulBtn_" + e);
s.setContentSize(cc.size(i, r));
s.setPosition(t, a);
s.anchorX = .5;
s.anchorY = .5;
var d = new cc.Node("BgNode");
d.setPosition(0, 0);
d.anchorX = .5;
d.anchorY = .5;
var h = d.addComponent(cc.Graphics);
h.fillColor = o;
h.roundRect(-i / 2, -r / 2, i, r, 8);
h.fill();
h.strokeColor = n;
h.lineWidth = 2;
h.roundRect(-i / 2, -r / 2, i, r, 8);
h.stroke();
if (l) {
h.fillColor = cc.color(255, 255, 255, 40);
h.roundRect(-i / 2 + 3, 3, i - 6, r / 2 - 3, 5);
h.fill();
h.fillColor = cc.color(0, 0, 0, 30);
h.roundRect(-i / 2 + 3, -r / 2 + 3, i - 6, r / 3, 3);
h.fill();
}
d.parent = s;
var u = new cc.Node("TextNode");
u.setPosition(0, 0);
u.anchorX = .5;
u.anchorY = .5;
u.width = i;
u.height = r;
var p = u.addComponent(cc.Label);
p.string = e;
p.fontSize = Math.floor(.4 * r);
p.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
p.verticalAlign = cc.Label.VerticalAlign.CENTER;
u.color = cc.color(255, 255, 255);
var g = u.addComponent(cc.LabelOutline);
g.color = cc.color(0, 0, 0, 150);
g.width = 2;
u.parent = s;
s.on(cc.Node.EventType.TOUCH_START, function(e) {
e.stopPropagation();
s.scale = .95;
});
s.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
s.scale = 1;
c && c();
});
s.on(cc.Node.EventType.TOUCH_CANCEL, function() {
s.scale = 1;
});
return s;
}, n._createDialogInput = function(e, o, n, t, a, i) {
var r = new cc.Node(i || "DialogInput");
r.setContentSize(cc.size(t, a));
r.setPosition(o, n);
r.anchorX = .5;
r.anchorY = .5;
var c = new cc.Node("InputBg");
c.setPosition(0, 0);
c.anchorX = .5;
c.anchorY = .5;
var l = c.addComponent(cc.Graphics);
l.fillColor = cc.color(50, 45, 65, 255);
l.roundRect(-t / 2, -a / 2, t, a, 5);
l.fill();
l.strokeColor = cc.color(100, 90, 70, 200);
l.lineWidth = 1;
l.roundRect(-t / 2, -a / 2, t, a, 5);
l.stroke();
c.parent = r;
var s = new cc.Node("Placeholder");
s.setPosition(0, 0);
s.anchorX = .5;
s.anchorY = .5;
s.width = t - 20;
s.height = a;
var d = s.addComponent(cc.Label);
d.string = e;
d.fontSize = Math.floor(.4 * a);
d.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
d.verticalAlign = cc.Label.VerticalAlign.CENTER;
s.color = cc.color(120, 110, 100);
s.parent = r;
return r;
}, n._showPasswordDialog = function(e, o, n, t) {
var a = this, i = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), r = i ? i.designResolution.height : 720, c = i ? i.designResolution.width : 1280, l = new cc.Node("PasswordDialog");
l.setContentSize(cc.size(c, r));
l.setPosition(0, 0);
l.zIndex = 3500;
l.parent = this.node;
var s = new cc.Node("Mask"), d = s.addComponent(cc.Graphics);
d.fillColor = cc.color(0, 0, 0, 180);
d.rect(-c / 2, -r / 2, c, r);
d.fill();
s.parent = l;
s.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
});
var h = new cc.Node("DialogBg");
h.setContentSize(cc.size(350, 220));
var u = h.addComponent(cc.Graphics);
u.fillColor = cc.color(35, 30, 50, 250);
u.roundRect(-175, -110, 350, 220, 12);
u.fill();
u.strokeColor = cc.color(180, 140, 60, 200);
u.lineWidth = 3;
u.roundRect(-175, -110, 350, 220, 12);
u.stroke();
h.parent = l;
var p = new cc.Node("Title");
p.setPosition(0, 70);
p.anchorX = .5;
p.anchorY = .5;
var g = p.addComponent(cc.Label);
g.string = "该房间需要密码";
g.fontSize = 22;
g.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
p.color = cc.color(255, 220, 100);
p.parent = l;
var _ = new cc.Node("RoomCode");
_.setPosition(0, 35);
_.anchorX = .5;
_.anchorY = .5;
var f = _.addComponent(cc.Label);
f.string = "房间号: " + e;
f.fontSize = 14;
f.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
_.color = cc.color(160, 150, 130);
_.parent = l;
this._createDialogInput("请输入密码", 0, 10, 200, 36, "PwdInput").parent = l;
this._createButtonNode("取消", cc.color(80, 75, 90), -70, -65, 80, 34, function() {
l.destroy();
}).parent = l;
this._createButtonNode("确认", cc.color(40, 130, 70), 70, -65, 80, 34, function() {
var e = l.getChildByName("PwdInput"), o = e ? e.getChildByName("Placeholder") : null, n = o ? o.getComponent(cc.Label).string : "";
if (n && "请输入密码" !== n) {
l.destroy();
t && t(n);
} else a._showTipInDialog(l, "请输入密码");
}, !0).parent = l;
return l;
}, n._showTipInDialog = function(e, o) {
var n = e.getChildByName("TipText");
n && n.destroy();
(n = new cc.Node("TipText")).setPosition(0, -50);
n.anchorX = .5;
n.anchorY = .5;
var t = n.addComponent(cc.Label);
t.string = o;
t.fontSize = 14;
t.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
n.color = cc.color(255, 150, 100);
n.parent = e;
this.scheduleOnce(function() {
n && n.isValid && n.destroy();
}, 2);
}, n._fetchAndRenderRoomListForScene = function(e, o, n, t, a) {
var i = this, r = window.myglobal, c = r && r.socket ? r.socket : null, l = c && c.isConnected && c.isConnected(), s = c && c.isWebSocketOpen && c.isWebSocketOpen(), d = [], h = function(o) {
var r = o.action_type, c = o.room_code, l = o.room;
if ("add" === r && l) d.some(function(e) {
return (e.room_code || e.roomCode) === (l.room_code || l.roomCode);
}) || d.push(l); else if ("update" === r && l) {
for (var s = 0; s < d.length; s++) if ((d[s].room_code || d[s].roomCode) === (l.room_code || l.roomCode)) {
d[s] = l;
break;
}
} else "remove" === r && (d = d.filter(function(e) {
return (e.room_code || e.roomCode) !== c;
}));
var h = d.filter(function(e) {
var o = e.player_count || e.playerCount || 0;
return o > 0 && o < 3;
});
i._renderRoomListInScene(e, h, n, t, a);
};
c && c.onRoomListUpdate && c.onRoomListUpdate(h);
a._roomListUpdateHandler = h;
if (c && l && s) {
var u = setTimeout(function() {
o && o.isValid && (o.active = !1);
i._renderRoomListInScene(e, [], n, t, a);
}, 5e3);
c.getRoomList(function(r, c) {
clearTimeout(u);
o && o.isValid && (o.active = !1);
if (0 === r && c && c.length > 0) {
d = c;
var l = c.filter(function(e) {
var o = e.player_count || e.playerCount || 0;
return o > 0 && o < 3;
});
i._renderRoomListInScene(e, l, n, t, a);
} else i._renderRoomListInScene(e, [], n, t, a);
});
} else this.scheduleOnce(function() {
o && o.isValid && (o.active = !1);
i._renderRoomListInScene(e, [], n, t, a);
}, .5);
}, n._renderRoomListInScene = function(e, o, n, t, a) {
for (var i = this, r = e.children.slice(), c = 0; c < r.length; c++) "LoadingLabel" !== r[c].name && r[c].destroy();
var l = e.width, s = l / 5, d = e.height / 2 - 15;
if (o && 0 !== o.length) for (c = 0; c < o.length && c < 8; c++) {
var h = o[c], u = d - 50 * c, p = new cc.Node("RoomItem_" + c);
p.setContentSize(cc.size(l - 5, 46));
p.setPosition(0, u);
var g = p.addComponent(cc.Graphics);
g.fillColor = c % 2 == 0 ? cc.color(35, 30, 50, 220) : cc.color(30, 28, 45, 220);
g.roundRect(-(l - 5) / 2, -23, l - 5, 46, 4);
g.fill();
p.parent = e;
var _ = h.player_count || h.playerCount || 0, f = h.room_code || h.roomCode || "未知", m = new cc.Node("CodeText");
m.x = -l / 2 + .5 * s;
m.anchorX = .5;
m.anchorY = .5;
var C = m.addComponent(cc.Label);
C.string = f;
C.fontSize = 16;
C.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
m.color = cc.color(220, 200, 160);
m.parent = p;
var v = new cc.Node("CountText");
v.x = -l / 2 + 1.5 * s;
v.anchorX = .5;
v.anchorY = .5;
var w = v.addComponent(cc.Label);
w.string = _ + "/3";
w.fontSize = 16;
w.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
v.color = _ >= 3 ? cc.color(220, 100, 80) : cc.color(100, 200, 100);
v.parent = p;
var y = new cc.Node("ScoreText");
y.x = -l / 2 + 2.5 * s;
y.anchorX = .5;
y.anchorY = .5;
var b = y.addComponent(cc.Label);
b.string = "" + (h.base_score || n.base_score || 1);
b.fontSize = 16;
b.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
y.color = cc.color(220, 180, 80);
y.parent = p;
var S = new cc.Node("StatusText");
S.x = -l / 2 + 3.5 * s;
S.anchorX = .5;
S.anchorY = .5;
var N = S.addComponent(cc.Label);
N.string = _ >= 3 ? "已满" : "等待中";
N.fontSize = 16;
N.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
S.color = _ >= 3 ? cc.color(220, 100, 80) : cc.color(100, 200, 100);
S.parent = p;
(function(e) {
i._createActionButton("加入", cc.color(76, 175, 80), -l / 2 + 4.5 * s, 0, 70, 36, function() {
var o = e.room_code || e.roomCode, r = a.getChildByName("RoomListScene") || a;
r.destroy && r.destroy();
i._joinRoom(o, n, t);
}).parent = p;
})(h);
} else {
var L = new cc.Node("EmptyTip");
L.anchorX = .5;
L.anchorY = .5;
var A = L.addComponent(cc.Label);
A.string = "暂无可加入的房间";
A.fontSize = 18;
A.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
L.color = cc.color(160, 150, 140);
L.parent = e;
}
}, n._showRoomListDialog = function(e, o) {
var n = this, t = (window.myglobal, this.node.getChildByName("RoomListDialog"));
t && t.destroy();
var a = this.node.getChildByName("room_tip");
a && a.destroy();
var i = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), r = i ? i.designResolution.height : 720, c = i ? i.designResolution.width : 1280, l = new cc.Node("RoomListDialog");
l.setContentSize(cc.size(650, 450));
l.anchorX = .5;
l.anchorY = .5;
l.x = 0;
l.y = 50;
l.zIndex = 1e3;
l.parent = this.node;
var s = new cc.Node("Mask");
s.setContentSize(cc.size(c, r));
s.anchorX = .5;
s.anchorY = .5;
s.x = 0;
s.y = -50;
var d = s.addComponent(cc.Graphics);
d.fillColor = cc.color(0, 0, 0, 180);
d.rect(-c / 2, -r / 2, c, r);
d.fill();
s.parent = l;
s.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
l.destroy();
});
var h = new cc.Node("BgNode");
h.setContentSize(cc.size(620, 420));
var u = h.addComponent(cc.Graphics);
u.fillColor = cc.color(45, 45, 65, 255);
u.roundRect(-310, -210, 620, 420, 15);
u.fill();
u.strokeColor = cc.color(100, 100, 140, 255);
u.lineWidth = 3;
u.roundRect(-310, -210, 620, 420, 15);
u.stroke();
h.parent = l;
var p = new cc.Node("Title");
p.y = 170;
var g = p.addComponent(cc.Label);
g.string = "【" + e.room_name + "】";
g.fontSize = 36;
g.lineHeight = 44;
g.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
p.color = cc.color(255, 215, 0);
p.parent = l;
var _ = new cc.Node("SubTitle");
_.y = 130;
var f = _.addComponent(cc.Label);
f.string = "选择游戏方式";
f.fontSize = 24;
f.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
_.color = cc.color(180, 180, 200);
_.parent = l;
var m = new cc.Node("ListContainer");
m.setContentSize(cc.size(580, 120));
m.y = 50;
m.parent = l;
var C = new cc.Node("LoadingLabel");
C.y = 0;
var v = C.addComponent(cc.Label);
v.string = "正在获取房间列表...";
v.fontSize = 22;
v.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
C.color = cc.color(150, 150, 170);
C.parent = m;
var w = new cc.Node("BtnContainer");
w.y = -60;
w.parent = l;
this._createButton("🎮 快速匹配", cc.color(46, 125, 50), -200, function() {
l.destroy();
n._quickMatch(e, o);
}, 180, 55).parent = w;
this._createButton("🏠 创建房间", cc.color(21, 101, 192), 0, function() {
l.destroy();
n._createRoom(e, o);
}, 180, 55).parent = w;
this._createButton("✖ 关闭", cc.color(120, 120, 120), 200, function() {
l.destroy();
}, 100, 45).parent = w;
var y = new cc.Node("InputContainer");
y.y = -140;
y.parent = l;
var b = new cc.Node("InputLabel");
b.x = -250;
var S = b.addComponent(cc.Label);
S.string = "房间号:";
S.fontSize = 22;
b.color = cc.color(200, 200, 200);
b.parent = y;
var N = new cc.Node("InputBg");
N.setContentSize(cc.size(180, 40));
N.x = -110;
var L = N.addComponent(cc.Graphics);
L.fillColor = cc.color(60, 60, 80, 255);
L.roundRect(-90, -20, 180, 40, 5);
L.fill();
N.parent = y;
var A = N.addComponent(cc.Label);
A.string = "点击输入房间号";
A.fontSize = 18;
A.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
A.verticalAlign = cc.Label.VerticalAlign.CENTER;
this._createButton("➤ 加入", cc.color(230, 126, 34), 100, function() {
var t = A.string;
if (t && "点击输入房间号" !== t) {
l.destroy();
n._joinRoom(t, e, o);
} else n._showMessageCenter("请输入房间号");
}, 90, 40).parent = y;
var T = new cc.Node("Tip");
T.y = -185;
var R = T.addComponent(cc.Label);
R.string = "提示：快速匹配将自动为您分配房间";
R.fontSize = 16;
R.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
T.color = cc.color(120, 120, 140);
T.parent = l;
this._fetchRoomList(m, C);
}, n._createButton = function(e, o, n, t, a, i) {
a = a || 140;
i = i || 50;
var r = new cc.Node(e + "Btn");
r.setContentSize(cc.size(a, i));
r.x = n;
var c = r.addComponent(cc.Graphics);
c.fillColor = o;
c.roundRect(-a / 2, -i / 2, a, i, 8);
c.fill();
var l = r.addComponent(cc.Label);
l.string = e;
l.fontSize = 20;
l.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
l.verticalAlign = cc.Label.VerticalAlign.CENTER;
r.color = cc.color(255, 255, 255);
r.on(cc.Node.EventType.TOUCH_START, function(e) {
e.stopPropagation();
r.scale = .95;
});
r.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
r.scale = 1;
t && t();
});
r.on(cc.Node.EventType.TOUCH_CANCEL, function() {
r.scale = 1;
});
return r;
}, n._fetchRoomList = function(e, o) {
var n = this, t = window.myglobal, a = t && t.socket ? t.socket : null, i = a && a.isConnected && a.isConnected(), r = a && a.isWebSocketOpen && a.isWebSocketOpen();
if (a && i && r) {
var c = setTimeout(function() {
o && o.isValid && o.destroy();
n._renderRoomList(e, []);
}, 5e3);
a.getRoomList(function(t, a) {
clearTimeout(c);
o && o.isValid && o.destroy();
0 === t && a && a.length > 0 ? n._renderRoomList(e, a) : n._renderRoomList(e, []);
});
} else {
o.getComponent(cc.Label).string = "未连接服务器";
this.scheduleOnce(function() {
o && o.isValid && o.destroy();
n._renderRoomList(e, []);
}, .5);
}
}, n._renderRoomList = function(e, o) {
var n = this;
if (o && 0 !== o.length) for (var t = 0; t < o.length && t < 5; t++) {
var a = o[t], i = new cc.Node("RoomItem_" + t);
i.setContentSize(cc.size(540, 35));
i.y = 70 - 40 * t;
i.addComponent(cc.Sprite).color = t % 2 == 0 ? cc.color(50, 50, 70) : cc.color(45, 45, 65);
var r = new cc.Node();
r.x = -200;
var c = r.addComponent(cc.Label);
c.string = "房间: " + (a.room_code || a.roomCode || "未知");
c.fontSize = 18;
r.color = cc.color(200, 200, 200);
r.parent = i;
var l = new cc.Node();
l.x = 50;
var s = l.addComponent(cc.Label);
s.string = "人数: " + (a.player_count || a.playerCount || 0) + "/3";
s.fontSize = 18;
l.color = cc.color(150, 200, 150);
l.parent = i;
var d = this._createButton("加入", cc.color(76, 175, 80), 200, function() {
var e = a.room_code || a.roomCode;
n._joinRoom(e, myglobal.currentRoomConfig, myglobal.playerData.gobal_count);
});
d.setContentSize(cc.size(70, 30));
d.x = 220;
d.parent = i;
i.parent = e;
} else {
var h = new cc.Node("EmptyTip");
h.y = 0;
var u = h.addComponent(cc.Graphics);
u.fillColor = cc.color(35, 30, 50, 200);
u.roundRect(-150, -25, 300, 50, 8);
u.fill();
u.strokeColor = cc.color(100, 80, 50, 150);
u.lineWidth = 1;
u.roundRect(-150, -25, 300, 50, 8);
u.stroke();
var p = new cc.Node("Label");
p.anchorX = .5;
p.anchorY = .5;
var g = p.addComponent(cc.Label);
g.string = "暂无房间，请创建或刷新";
g.fontSize = 16;
g.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
p.color = cc.color(180, 160, 120);
p.parent = h;
h.parent = e;
}
}, n._quickMatch = function(e, o) {
var n = window.myglobal, t = n && n.socket ? n.socket : null, a = t && t.isWebSocketOpen && t.isWebSocketOpen();
this._showMessageCenter("正在智能匹配...");
if (t && a) this._smartMatch(e, o); else {
t && t.initSocket && t.initSocket();
this._waitForConnectionAndSmartMatch(e, o);
}
}, n._smartMatch = function(e, o) {
var n = this, t = window.myglobal, a = t && t.socket ? t.socket : null;
if (a) a.getRoomList ? a.getRoomList(function(t, a) {
a && a.length;
if (0 === t && a && a.length > 0) {
for (var i = null, r = 0; r < a.length; r++) {
var c = a[r], l = void 0 !== c.player_count ? c.player_count : c.playerCount;
c.room_code || c.roomCode;
if (l < 3) {
i = c;
break;
}
}
if (i) {
var s = i.room_code || i.roomCode;
n._showMessageCenter("找到等待房间，正在加入...");
n._joinRoom(s, e, o);
return;
}
}
n._showMessageCenter("创建新房间，等待其他玩家...");
n._createRoom(e, o);
}) : n._createRoom(e, o); else {
n._hideMessageCenter();
n._showMessage("服务器连接异常，请稍后重试");
}
}, n._waitForConnectionAndSmartMatch = function(e, o) {
var n = this, t = window.myglobal && window.myglobal.socket ? window.myglobal.socket : null, a = 0;
setTimeout(function i() {
a++;
if (t && t.isWebSocketOpen && t.isWebSocketOpen()) n._smartMatch(e, o); else if (a < 15) setTimeout(i, 200); else {
n._hideMessageCenter();
n._showMessage("连接服务器失败，请检查网络后重试");
}
}, 100);
}, n._sendQuickMatchRequest = function(e) {
var o = this, n = window.myglobal, t = n && n.socket ? n.socket : null;
if (t && t.request_enter_room) {
if (this._enterRoomTimeout) {
clearTimeout(this._enterRoomTimeout);
this._enterRoomTimeout = null;
}
t.request_enter_room({
room_level: e.room_type
}, function(t, a) {
if (o._enterRoomTimeout) {
clearTimeout(o._enterRoomTimeout);
o._enterRoomTimeout = null;
}
if (0 === t && a) {
if (n) {
n.roomData = a;
n.playerData.bottom = e.base_score || 1;
n.playerData.rate = e.multiplier || 1;
}
o._enterGameScene(a);
} else {
o._hideMessageCenter();
o._showMessage("匹配失败，请稍后重试");
}
});
this._enterRoomTimeout = setTimeout(function() {
o._enterRoomTimeout = null;
o._hideMessageCenter();
o._showMessage("匹配超时，请检查网络连接");
}, 15e3);
} else {
o._hideMessageCenter();
o._showMessage("服务器连接异常，请稍后重试");
}
}, n._createRoom = function(e, o) {
var n = window.myglobal, t = n && n.socket ? n.socket : null, a = t && t.isWebSocketOpen && t.isWebSocketOpen();
this._showMessageCenter("正在进入游戏...");
if (t && a) this._sendCreateRoomRequest(e, o); else {
t && t.initSocket && t.initSocket();
this._waitForConnectionAndCreateRoom(e, o);
}
}, n._sendCreateRoomRequest = function(e, o) {
var n = this, t = window.myglobal, a = t && t.socket ? t.socket : null;
if (a && a.createRoom) {
var i = "";
if (a.getPlayerInfo) {
var r = a.getPlayerInfo();
i = r.id;
}
var c = e ? e.id : null;
a.createRoom(c, function(a, r) {
if (0 === a && r) {
var c = r.player || {}, l = {
accountid: c.id || i || t.playerData.accountID || t.playerData.uniqueID,
nick_name: c.name || t.playerData.nickName,
avatarUrl: t.playerData.avatarUrl || "avatar_1",
gold_count: c.gold_count || o || 0,
goldcount: c.gold_count || o || 0,
seatindex: (void 0 !== c.seat ? c.seat : 0) + 1,
isready: c.ready || !0
}, s = {
roomid: r.room_code || r.roomCode || "NEW_ROOM",
room_code: r.room_code || r.roomCode || "NEW_ROOM",
seatindex: (void 0 !== c.seat ? c.seat : 0) + 1,
playerdata: [ l ],
housemanageid: c.id || i || t.playerData.accountID || t.playerData.uniqueID
};
t.roomData = s;
t.playerData.bottom = e.base_score || 1;
t.playerData.rate = e.multiplier || 1;
t.playerData.roomid = s.room_code;
t.socket && t.socket.saveReconnectInfo && t.socket.saveReconnectInfo();
n._enterGameScene(s);
} else {
n._hideMessageCenter();
n._showMessage("创建房间失败，请稍后重试");
}
});
} else {
n._hideMessageCenter();
n._showMessage("服务器连接异常，请稍后重试");
}
}, n._waitForConnectionAndCreateRoom = function(e, o) {
var n = this, t = window.myglobal && window.myglobal.socket ? window.myglobal.socket : null, a = 0;
setTimeout(function i() {
a++;
if (t && t.isWebSocketOpen && t.isWebSocketOpen()) n._sendCreateRoomRequest(e, o); else if (a < 15) setTimeout(i, 200); else {
n._hideMessageCenter();
n._showMessage("连接服务器失败，请检查网络后重试");
}
}, 100);
}, n._joinRoom = function(e, o, n) {
var t = window.myglobal, a = t && t.socket ? t.socket : null, i = a && a.isWebSocketOpen && a.isWebSocketOpen();
this._showMessageCenter("正在加入房间 " + e + "...");
if (a && i) this._sendJoinRoomRequest(e, o, n); else {
a && a.initSocket && a.initSocket();
this._waitForConnectionAndJoinRoom(e, o, n);
}
}, n._sendJoinRoomRequest = function(e, o) {
var n = this, t = window.myglobal, a = t && t.socket ? t.socket : null;
if (a && a.joinRoom) a.joinRoom(e, function(a, i) {
if (0 === a && i) {
var r = i.players || [], c = i.creator_id || i.creatorId || "";
t.socket && t.socket.getPlayerInfo && t.socket.getPlayerInfo();
var l = {
roomid: i.room_code || i.roomCode || e,
room_code: i.room_code || i.roomCode || e,
seatindex: i.player ? i.player.seat + 1 : 1,
playerdata: r.map(function(e, o) {
return {
accountid: e.id,
nick_name: e.name,
avatarUrl: e.avatar || "avatar_1",
gold_count: e.gold_count || 0,
goldcount: e.gold_count || 0,
seatindex: (void 0 !== e.seat ? e.seat : o) + 1,
isready: e.ready || !1
};
}),
housemanageid: c,
creator_id: c
};
t.roomData = l;
t.playerData.bottom = o.base_score || 1;
t.playerData.rate = o.multiplier || 1;
n._enterGameScene(l);
} else {
n._hideMessageCenter();
n._showMessage("加入房间失败，房间可能不存在");
}
}); else {
n._hideMessageCenter();
n._showMessage("服务器连接异常，请稍后重试");
}
}, n._waitForConnectionAndJoinRoom = function(e, o, n) {
var t = this, a = window.myglobal && window.myglobal.socket ? window.myglobal.socket : null, i = 0;
setTimeout(function r() {
i++;
if (a && a.isWebSocketOpen && a.isWebSocketOpen()) t._sendJoinRoomRequest(e, o, n); else if (i < 15) setTimeout(r, 200); else {
t._hideMessageCenter();
t._showMessage("连接服务器失败，请检查网络后重试");
}
}, 100);
}, n._waitForConnectionAndEnterRoom = function(e, o, n) {
var t = this, a = (window.myglobal, 0);
setTimeout(function i() {
a++;
if (o && o.isWebSocketOpen && o.isWebSocketOpen()) t._sendQuickMatchRequest(e, n); else if (a < 10) setTimeout(i, 500); else {
console.error("WebSocket 连接超时");
t._hideMessageCenter();
t._showMessage("连接服务器超时，请检查网络设置");
}
}, 500);
}, n._formatGold = function(e) {
return e >= 1e4 ? (e / 1e4).toFixed(1) + "万" : e.toString();
}, n._enterGameScene = function(e) {
Date.now();
if (this._enterGameSceneInProgress) console.log("🚀 [进入场景] 已在进行中，跳过"); else {
this._enterGameSceneInProgress = !0;
var o = this;
setTimeout(function() {
if (o._enterGameSceneInProgress) {
console.log("🚀 [进入场景] 超时自动重置标志位");
o._enterGameSceneInProgress = !1;
}
}, 5e3);
console.log("🚀 [进入场景] 开始加载游戏场景");
if (this.node && this.node.isValid) {
this._hideMessageCenter();
this._showQuickEnterAnimation();
}
var n = window.myglobal;
if (n && e && (!n.roomData || !n.roomData.playerdata || 0 === n.roomData.playerdata.length)) {
n.roomData = e;
console.log("🚀 [进入场景] 保存 roomData 到 myglobal, playerdata 数量:", e.playerdata ? e.playerdata.length : 0);
}
this._gameScenePreloaded ? cc.director.runSceneImmediate(new cc.Scene(), function() {
cc.director.loadScene("gameScene", function(e) {
e ? console.error("🚀 [进入场景] 加载游戏场景失败:", e) : Date.now();
});
}) : cc.director.loadScene("gameScene", function(e) {
e ? console.error("🚀 [进入场景] 加载游戏场景失败:", e) : Date.now();
});
}
}, n._showQuickEnterAnimation = function() {
var e = this, o = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), n = o ? o.designResolution.height : 720, t = o ? o.designResolution.width : 1280, a = new cc.Node("QuickEnterMask");
a.setContentSize(cc.size(2 * t, 2 * n));
a.color = cc.color(0, 0, 0);
a.opacity = 0;
a.zIndex = 9999;
a.addComponent(cc.BlockInputEvents);
a.parent = this.node;
cc.resources.load("UI/loading_image", cc.SpriteFrame, function(o, n) {
if (a && a.isValid) if (!o && n) {
var t = new cc.Node("LoadingImage");
t.setContentSize(cc.size(120, 120));
t.anchorX = .5;
t.anchorY = .5;
var i = t.addComponent(cc.Sprite);
i.spriteFrame = n;
i.type = cc.Sprite.Type.SIMPLE;
i.sizeMode = cc.Sprite.SizeMode.CUSTOM;
t.parent = a;
e._quickEnterLoadingNode = t;
e._quickEnterAnimating = !0;
} else {
console.warn("加载 loading_image.png 失败，使用文字提示");
var r = new cc.Node("LoadingText");
r.y = 0;
var c = r.addComponent(cc.Label);
c.string = "正在进入游戏...";
c.fontSize = 32;
c.lineHeight = 40;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
r.color = cc.color(255, 255, 255);
r.parent = a;
} else console.log("加载图片回调时节点已销毁，跳过");
});
cc.tween(a).to(.15, {
opacity: 200
}).start();
this._quickEnterMask = a;
}, n._showMessage = function(e) {
if (this.node && this.node.isValid) {
var o = this.node.getChildByName("room_tip");
o && o.destroy();
(o = new cc.Node("room_tip")).anchorX = .5;
o.anchorY = .5;
o.x = 0;
o.y = 311;
var n = o.addComponent(cc.Label);
n.string = e;
n.fontSize = 22;
n.lineHeight = 28;
n.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
o.color = cc.color(255, 255, 0);
o.parent = this.node;
this.scheduleOnce(function() {
o && o.isValid && o.destroy();
}, 2);
} else console.warn("_showMessage: 节点不存在或已销毁");
}, n._showMessageCenter = function(e) {
if (this.node && this.node.isValid) {
var o = this, n = this.node.getChildByName("center_tip");
n && n.destroy();
var t = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), a = t ? t.designResolution.height : 720, i = t ? t.designResolution.width : 1280;
(n = new cc.Node("center_tip")).zIndex = 2e3;
n.parent = this.node;
var r = new cc.Node("Mask");
r.setContentSize(cc.size(i, a));
var c = r.addComponent(cc.Graphics);
c.fillColor = cc.color(0, 0, 0, 100);
c.rect(-i / 2, -a / 2, i, a);
c.fill();
r.parent = n;
cc.resources.load("UI/loading_image", cc.SpriteFrame, function(t, a) {
if (!t && a) {
var i = new cc.Node("LoadingImage");
i.setContentSize(cc.size(120, 120));
i.anchorX = .5;
i.anchorY = .5;
var r = i.addComponent(cc.Sprite);
r.spriteFrame = a;
r.type = cc.Sprite.Type.SIMPLE;
r.sizeMode = cc.Sprite.SizeMode.CUSTOM;
i.parent = n;
o._loadingImageAnimating = !0;
o._loadingImageNode = i;
} else {
console.warn("加载 loading_image.png 失败，使用文字提示");
var c = new cc.Node("Label"), l = c.addComponent(cc.Label);
l.string = e;
l.fontSize = 26;
l.lineHeight = 36;
l.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.color = cc.color(255, 255, 255);
c.parent = n;
}
});
this._centerTipNode = n;
} else console.warn("_showMessageCenter: 节点不存在或已销毁");
}, n._hideMessageCenter = function() {
this._loadingImageAnimating = !1;
this._loadingImageNode = null;
if (this._centerTipNode && this._centerTipNode.isValid) {
this._centerTipNode.destroy();
this._centerTipNode = null;
}
if (this.node && this.node.isValid) {
var e = this.node.getChildByName("center_tip");
e && e.isValid && e.destroy();
}
}, n._removeNoticeBoard = function() {
for (var e = [ "notice", "gonggao", "公告", "notice_board", "dingbuuibantoumingdi", "xiongmao3", "title", "Title", "标签" ], o = 0; o < e.length; o++) {
var n = this.node.getChildByName(e[o]);
n && (n.active = !1);
}
this._hideNodesWithText(this.node, "游戏公告");
this._hideNodesWithText(this.node, "娱乐休闲");
this._hideBackgroundLabels();
}, n._hideBackgroundLabels = function() {
for (var e = [ "竞技场", "普通场", "初级场", "中级场", "高级场", "选择房间", "房间选择" ], o = 0; o < e.length; o++) for (var n = this._findNodesByName(this.node, e[o]), t = 0; t < n.length; t++) "AreaTitle" !== n[t].name && (n[t].active = !1);
}, n._findNodesByName = function(e, o) {
var n = [];
if (!e || !e.children) return n;
for (var t = 0; t < e.children.length; t++) {
var a = e.children[t];
a.name === o && n.push(a);
var i = this._findNodesByName(a, o);
n = n.concat(i);
}
return n;
}, n._adjustGoldElementsPosition = function() {
var e = this.node.getChildByName("player_node");
if (e) {
e.getChildByName("head_bg");
var o = e.getChildByName("nickname_label"), n = o ? o.y : 43, t = e.getChildByName("yuanbaoIcon"), a = e.getChildByName("gold_frame"), i = e.getChildByName("gobal_count_label");
t && (t.active = !1);
a && (a.active = !1);
i && (i.active = !1);
var r = n - 28, c = this._createCurrencyContainerRow(e, "currency_display_row", 145, r);
this._happyBeanLabelNode = c ? c.happyBeanLabel : null;
this._arenaCoinLabelNode = c ? c.arenaCoinLabel : null;
this._updateBothCurrencyDisplay();
}
}, n._createCurrencyContainerRow = function(e, o, n, t) {
if (!e) return null;
var a = e.getChildByName(o);
if (a) return {
happyBeanLabel: a.getChildByName("happy_bean_value"),
arenaCoinLabel: a.getChildByName("arena_coin_value")
};
var i = new cc.Node(o);
i.setPosition(n, t);
i.anchorX = 0;
i.anchorY = .5;
i.setContentSize(200, 40);
i.zIndex = 100;
i.parent = e;
var r = new cc.Node("happy_bean_icon");
r.anchorX = .5;
r.anchorY = .5;
r.x = 11;
r.y = 0;
r.setContentSize(22, 22);
var c = r.addComponent(cc.Graphics);
c.fillColor = cc.color(255, 180, 50);
c.circle(0, 0, 11);
c.fill();
r.parent = i;
var l = new cc.Node("text");
l.anchorX = .5;
l.anchorY = .5;
l.x = 0;
l.y = 0;
var s = l.addComponent(cc.Label);
s.string = "豆";
s.fontSize = 13;
s.lineHeight = 22;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
l.color = cc.color(139, 69, 19);
l.parent = r;
var d = new cc.Node("happy_bean_value");
d.anchorX = 0;
d.anchorY = .5;
d.x = 27;
d.y = 0;
var h = d.addComponent(cc.Label);
h.string = "0";
h.fontSize = 20;
h.lineHeight = 40;
h.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
h.verticalAlign = cc.Label.VerticalAlign.CENTER;
d.color = cc.color(255, 215, 0);
var u = d.addComponent(cc.LabelOutline);
u.color = cc.color(0, 0, 0);
u.width = 1;
d.parent = i;
var p = new cc.Node("arena_coin_icon");
p.anchorX = .5;
p.anchorY = .5;
p.x = 118;
p.y = 0;
p.setContentSize(22, 22);
var g = p.addComponent(cc.Graphics);
g.fillColor = cc.color(100, 180, 255);
g.circle(0, 0, 11);
g.fill();
p.parent = i;
var _ = new cc.Node("text");
_.anchorX = .5;
_.anchorY = .5;
_.x = 0;
_.y = 0;
var f = _.addComponent(cc.Label);
f.string = "币";
f.fontSize = 13;
f.lineHeight = 22;
f.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
f.verticalAlign = cc.Label.VerticalAlign.CENTER;
_.color = cc.color(255, 255, 255);
_.parent = p;
var m = new cc.Node("arena_coin_value");
m.anchorX = 0;
m.anchorY = .5;
m.x = 134;
m.y = 0;
var C = m.addComponent(cc.Label);
C.string = "0";
C.fontSize = 20;
C.lineHeight = 40;
C.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
C.verticalAlign = cc.Label.VerticalAlign.CENTER;
m.color = cc.color(100, 200, 255);
var v = m.addComponent(cc.LabelOutline);
v.color = cc.color(0, 0, 0);
v.width = 1;
m.parent = i;
return {
happyBeanLabel: d,
arenaCoinLabel: m
};
}, n._updateBothCurrencyDisplay = function() {
var e = window.myglobal, o = e ? e.playerData : null;
if (o) {
this._happyBeanLabelNode && (n = this._happyBeanLabelNode.getComponent(cc.Label)) && (n.string = this._formatGold(o.gobal_count || 0));
if (this._arenaCoinLabelNode) {
var n;
(n = this._arenaCoinLabelNode.getComponent(cc.Label)) && (n.string = this._formatGold(o.arena_coin || 0));
}
this.gobal_count && (this.gobal_count.string = this._formatGold(o.gobal_count || 0));
}
}, n._hideNodesWithText = function(e, o) {
if (e) {
var n = e.children;
if (n) for (var t = 0; t < n.length; t++) {
var a = n[t], i = a.getComponent(cc.Label);
i && i.string && i.string.indexOf(o) >= 0 && (a.active = !1);
this._hideNodesWithText(a, o);
}
}
}, n._createEnterRoomButton = function() {
var e = this, o = this.node.getChildByName("EnterRoomButton");
o && o.destroy();
var n = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), t = (n && n.designResolution.height, 
n ? n.designResolution.width : 1280), a = new cc.Node("EnterRoomButton");
a.setContentSize(cc.size(180, 60));
a.anchorX = .5;
a.anchorY = .5;
a.x = -t / 2 + 120;
a.y = 0;
a.zIndex = 1e3;
a.parent = this.node;
var i = a.addComponent(cc.Sprite);
i.sizeMode = cc.Sprite.SizeMode.CUSTOM;
cc.resources.load("UI/btn_enter_room", cc.SpriteFrame, function(o, n) {
if (o) {
console.warn("加载 btn_enter_room 失败，使用备用样式");
e._createEnterRoomButtonFallback(a);
} else i.spriteFrame = n;
});
var r = a.addComponent(cc.Button);
r.transition = cc.Button.Transition.SCALE;
r.duration = .1;
r.zoomScale = 1.1;
a.on(cc.Node.EventType.TOUCH_END, function(o) {
o.stopPropagation();
e._showEnterRoomPopup();
}, this);
}, n._createEnterRoomButtonFallback = function(e) {
var o = e.getComponent(cc.Sprite);
o || (o = e.addComponent(cc.Sprite));
o.sizeMode = cc.Sprite.SizeMode.CUSTOM;
var n = e.addComponent(cc.Graphics);
n.fillColor = cc.color(255, 140, 0);
n.roundRect(-90, -30, 180, 60, 12);
n.fill();
n.strokeColor = cc.color(255, 200, 100);
n.lineWidth = 3;
n.roundRect(-90, -30, 180, 60, 12);
n.stroke();
var t = new cc.Node("Icon"), a = t.addComponent(cc.Label);
a.string = "🚪";
a.fontSize = 22;
t.x = -45;
t.parent = e;
var i = new cc.Node("Label"), r = i.addComponent(cc.Label);
r.string = "输入房号";
r.fontSize = 22;
r.lineHeight = 30;
r.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
i.color = cc.color(255, 255, 255);
i.parent = e;
}, n._showEnterRoomPopup = function() {
var e = this, o = this.node.getChildByName("EnterRoomPopup");
o && o.destroy();
var n = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), t = n ? n.designResolution.height : 720, a = n ? n.designResolution.width : 1280, i = new cc.Node("EnterRoomPopup");
i.setContentSize(cc.size(a, t));
i.anchorX = .5;
i.anchorY = .5;
i.x = 0;
i.y = 0;
i.zIndex = 2e3;
i.parent = this.node;
i.addComponent(cc.BlockInputEvents);
var r = new cc.Node("BgMask");
r.setContentSize(cc.size(a, t));
var c = r.addComponent(cc.Graphics);
c.fillColor = cc.color(0, 0, 0, 180);
c.rect(-a / 2, -t / 2, a, t);
c.fill();
r.parent = i;
r.on(cc.Node.EventType.TOUCH_END, function() {
i.destroy();
}, this);
var l = new cc.Node("Panel");
l.setContentSize(cc.size(500, 380));
l.parent = i;
var s = new cc.Node("Shadow"), d = s.addComponent(cc.Graphics);
d.fillColor = cc.color(0, 0, 0, 60);
d.roundRect(-242, -198, 500, 380, 16);
d.fill();
s.parent = l;
var h = new cc.Node("MainBg");
h.setContentSize(cc.size(500, 380));
var u = h.addComponent(cc.Graphics);
u.fillColor = cc.color(30, 28, 45, 255);
u.roundRect(-250, -190, 500, 380, 16);
u.fill();
u.strokeColor = cc.color(100, 85, 60);
u.lineWidth = 3;
u.roundRect(-250, -190, 500, 380, 16);
u.stroke();
h.parent = l;
var p = new cc.Node("TopBar");
p.setContentSize(cc.size(500, 8));
p.y = 186;
var g = p.addComponent(cc.Graphics);
g.fillColor = cc.color(76, 175, 80);
g.roundRect(-250, -4, 500, 8, [ 16, 16, 0, 0 ]);
g.fill();
p.parent = l;
var _ = new cc.Node("TitleBg");
_.setContentSize(cc.size(460, 60));
_.y = 140;
var f = _.addComponent(cc.Graphics);
f.fillColor = cc.color(45, 42, 65, 250);
f.roundRect(-230, -30, 460, 60, 10);
f.fill();
_.parent = l;
var m = new cc.Node("Icon"), C = m.addComponent(cc.Label);
C.string = "🔑";
C.fontSize = 32;
m.x = -100;
m.y = 140;
m.parent = l;
var v = new cc.Node("Title"), w = v.addComponent(cc.Label);
w.string = "加入房间";
w.fontSize = 28;
w.lineHeight = 40;
w.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
v.color = cc.color(255, 255, 255);
v.y = 140;
v.parent = l;
var y = new cc.Node("Subtitle"), b = y.addComponent(cc.Label);
b.string = "输入好友分享的房间号即可加入游戏";
b.fontSize = 14;
b.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
y.color = cc.color(180, 170, 150);
y.y = 95;
y.parent = l;
var S = new cc.Node("InputLabel"), N = S.addComponent(cc.Label);
N.string = "房间号";
N.fontSize = 16;
S.color = cc.color(200, 190, 160);
S.x = -180;
S.y = 65;
S.parent = l;
var L = new cc.Node("InputBg");
L.setContentSize(cc.size(360, 55));
L.y = 20;
var A = L.addComponent(cc.Graphics);
A.fillColor = cc.color(50, 45, 70, 255);
A.roundRect(-180, -27.5, 360, 55, 10);
A.fill();
A.strokeColor = cc.color(76, 175, 80);
A.lineWidth = 2;
A.roundRect(-180, -27.5, 360, 55, 10);
A.stroke();
L.parent = l;
var T = new cc.Node("RoomIdInput");
T.setContentSize(cc.size(340, 50));
var R = T.addComponent(cc.EditBox);
R.placeholder = "请输入6位数字房间号";
R.fontSize = 24;
R.placeholderFontSize = 18;
R.fontColor = cc.color(255, 255, 255);
R.placeholderFontColor = cc.color(120, 115, 100);
R.inputFlag = cc.EditBox.InputFlag.SENSITIVE;
R.inputMode = cc.EditBox.InputMode.NUMERIC;
R.maxLength = 10;
R.backgroundColor = cc.color(0, 0, 0, 0);
T.parent = L;
var k = new cc.Node("TipBg");
k.setContentSize(cc.size(360, 35));
k.y = -35;
var z = k.addComponent(cc.Graphics);
z.fillColor = cc.color(40, 35, 55, 200);
z.roundRect(-180, -17.5, 360, 35, 8);
z.fill();
k.parent = l;
var P = new cc.Node("TipIcon"), E = P.addComponent(cc.Label);
E.string = "💡";
E.fontSize = 16;
P.x = -150;
P.y = -35;
P.parent = l;
var I = new cc.Node("Tip"), D = I.addComponent(cc.Label);
D.string = "房间号由好友创建房间后获取，为6位数字";
D.fontSize = 13;
D.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
I.color = cc.color(150, 145, 130);
I.y = -35;
I.parent = l;
var B = new cc.Node("CancelBtn");
B.setContentSize(cc.size(140, 48));
B.x = -90;
B.y = -135;
var M = B.addComponent(cc.Graphics);
M.fillColor = cc.color(70, 65, 85);
M.roundRect(-70, -24, 140, 48, 10);
M.fill();
M.strokeColor = cc.color(100, 95, 115);
M.lineWidth = 2;
M.roundRect(-70, -24, 140, 48, 10);
M.stroke();
B.parent = l;
var x = new cc.Node("Label"), U = x.addComponent(cc.Label);
U.string = "取消";
U.fontSize = 20;
U.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
x.color = cc.color(200, 195, 180);
x.parent = B;
var H = B.addComponent(cc.Button);
H.transition = cc.Button.Transition.SCALE;
H.zoomScale = .95;
B.on(cc.Node.EventType.TOUCH_END, function() {
i.destroy();
}, this);
var O = new cc.Node("ConfirmBtn");
O.setContentSize(cc.size(160, 48));
O.x = 100;
O.y = -135;
var W = O.addComponent(cc.Graphics);
W.fillColor = cc.color(76, 175, 80);
W.roundRect(-80, -24, 160, 48, 10);
W.fill();
W.strokeColor = cc.color(100, 200, 105);
W.lineWidth = 2;
W.roundRect(-80, -24, 160, 48, 10);
W.stroke();
O.parent = l;
var F = new cc.Node("Icon"), G = F.addComponent(cc.Label);
G.string = "✓";
G.fontSize = 20;
F.x = -50;
F.color = cc.color(255, 255, 255);
F.parent = O;
var V = new cc.Node("Label"), X = V.addComponent(cc.Label);
X.string = "加入房间";
X.fontSize = 20;
X.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
V.color = cc.color(255, 255, 255);
V.parent = O;
var Y = O.addComponent(cc.Button);
Y.transition = cc.Button.Transition.SCALE;
Y.zoomScale = .95;
O.on(cc.Node.EventType.TOUCH_END, function() {
var o = R.string;
o && 0 !== o.length ? e._joinRoomById(o, i) : e._showMessage("请输入房间号");
}, this);
var q = new cc.Node("CloseBtn");
q.setContentSize(cc.size(40, 40));
q.x = 225;
q.y = 165;
var J = q.addComponent(cc.Graphics);
J.fillColor = cc.color(60, 55, 75);
J.circle(0, 0, 20);
J.fill();
q.parent = l;
var j = new cc.Node("X"), K = j.addComponent(cc.Label);
K.string = "×";
K.fontSize = 28;
K.lineHeight = 36;
K.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
j.color = cc.color(180, 170, 160);
j.parent = q;
q.on(cc.Node.EventType.TOUCH_END, function() {
i.destroy();
}, this);
}, n._joinRoomById = function(e, o) {
var n = this, t = window.myglobal;
if (t && t.socket) {
this._showMessage("正在加入房间...");
t.socket.request_joinRoom({
roomId: e
}, function(e, a) {
if (0 === e) {
n._showMessage("加入成功！");
o && o.destroy();
a && a.roomId && (t.currentRoomId = a.roomId);
n.scheduleOnce(function() {
cc.director.loadScene("gameScene");
}, .5);
} else n._showMessage("加入房间失败: " + (a || "房间不存在"));
});
} else this._showMessage("网络未连接，请稍后重试");
}, n._updateCurrencyDisplay = function() {
var e = window.myglobal;
e && e.playerData && this._updateBothCurrencyDisplay();
}, n._updateCurrencyIcon = function(e) {
var o = this.node.getChildByName("player_node");
if (o) {
var n = o.getChildByName("currency_icon");
if (!n) {
(n = new cc.Node("currency_icon")).setPosition(-100, 80);
n.zIndex = 10;
n.parent = o;
}
var t = n.getComponent(cc.Label);
t || (t = n.addComponent(cc.Label));
t.string = 2 === e ? "币" : "豆";
t.fontSize = 24;
n.color = cc.color(255, 215, 0);
var a = n.getComponent(cc.LabelOutline);
a || (a = n.addComponent(cc.LabelOutline));
a.color = cc.color(0, 0, 0);
a.width = 2;
}
}, n._initArenaCoinDisplay = function() {
var e = window.myglobal, o = e ? e.playerData : null;
this.arena_coin_label && o && (this.arena_coin_label.string = "竞技币: " + this._formatGold(o.arena_coin || 0));
this._updateBothCurrencyDisplay();
}, n._listenArenaCoinUpdate = function() {
var e = this, o = window.myglobal;
if (o && o.eventlister) {
o.eventlister.on("arena_coin_updated", function(n) {
console.log("🏟️ [HallScene] 收到竞技币更新事件:", n);
n && void 0 !== n.arena_coin && o.playerData && (o.playerData.arena_coin = n.arena_coin);
e._updateBothCurrencyDisplay();
e.arena_coin_label && n && void 0 !== n.arena_coin && (e.arena_coin_label.string = "竞技币: " + e._formatGold(n.arena_coin));
});
console.log("🏟️ [HallScene] 已注册竞技币更新事件监听");
} else console.warn("🏟️ [HallScene] eventlister 未初始化，无法监听竞技币更新");
}, n._refreshPlayerBalance = function() {
var e = this;
window.arenaData && window.arenaData.refreshBalance && window.arenaData.refreshBalance(function(o, n) {
if (o) console.warn("获取玩家余额失败:", o); else {
e._updateCurrencyDisplay();
e.arena_coin_label && void 0 !== n.arena_coin && (e.arena_coin_label.string = "竞技币: " + e._formatGold(n.arena_coin));
}
});
}, n._showSignupDialog = function(e) {
var o = this, n = window.myglobal, t = n ? n.playerData : null, a = t && t.arena_coin || 0, i = e.signup_fee || e.signupFee || 0, r = this.node.getChildByName("SignupDialog");
r && r.destroy();
var c = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), l = c ? c.designResolution.height : 720, s = c ? c.designResolution.width : 1280, d = new cc.Node("SignupDialog");
d.setContentSize(cc.size(s, l));
d.setPosition(0, 0);
d.zIndex = 3e3;
d.parent = this.node;
var h = new cc.Node("Mask"), u = h.addComponent(cc.Graphics);
u.fillColor = cc.color(0, 0, 0, 180);
u.rect(-s / 2, -l / 2, s, l);
u.fill();
h.parent = d;
h.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
});
var p = new cc.Node("DialogBg");
p.setContentSize(cc.size(420, 380));
var g = p.addComponent(cc.Graphics);
g.fillColor = cc.color(35, 30, 50, 250);
g.roundRect(-210, -190, 420, 380, 12);
g.fill();
g.strokeColor = cc.color(180, 140, 60, 200);
g.lineWidth = 3;
g.roundRect(-210, -190, 420, 380, 12);
g.stroke();
p.parent = d;
var _ = new cc.Node("Title");
_.setPosition(0, 150);
_.anchorX = .5;
_.anchorY = .5;
var f = _.addComponent(cc.Label);
f.string = "竞技场报名";
f.fontSize = 26;
f.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
_.color = cc.color(255, 220, 100);
var m = _.addComponent(cc.LabelOutline);
m.color = cc.color(80, 50, 0);
m.width = 2;
_.parent = d;
var C = new cc.Node("RoomName");
C.setPosition(0, 110);
C.anchorX = .5;
C.anchorY = .5;
var v = C.addComponent(cc.Label);
v.string = e.room_name || "竞技场";
v.fontSize = 20;
v.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
C.color = cc.color(200, 180, 140);
C.parent = d;
var w = new cc.Node("FeeLabel");
w.setPosition(-180, 60);
w.anchorX = 0;
w.anchorY = .5;
var y = w.addComponent(cc.Label);
y.string = "报名费：";
y.fontSize = 18;
w.color = cc.color(220, 210, 190);
w.parent = d;
var b = new cc.Node("FeeValue");
b.setPosition(60, 60);
b.anchorX = 0;
b.anchorY = .5;
var S = b.addComponent(cc.Label);
S.string = this._formatGold(i) + " 竞技币";
S.fontSize = 20;
b.color = cc.color(255, 215, 0);
b.parent = d;
var N = new cc.Node("BalanceLabel");
N.setPosition(-180, 20);
N.anchorX = 0;
N.anchorY = .5;
var L = N.addComponent(cc.Label);
L.string = "当前余额：";
L.fontSize = 18;
N.color = cc.color(220, 210, 190);
N.parent = d;
var A = new cc.Node("BalanceValue");
A.setPosition(60, 20);
A.anchorX = 0;
A.anchorY = .5;
var T = A.addComponent(cc.Label);
T.string = this._formatGold(a) + " 竞技币";
T.fontSize = 20;
A.color = a >= i ? cc.color(100, 220, 100) : cc.color(255, 100, 100);
A.parent = d;
var R = new cc.Node("RewardLabel");
R.setPosition(-180, -20);
R.anchorX = 0;
R.anchorY = .5;
var k = R.addComponent(cc.Label);
k.string = "冠军奖励：";
k.fontSize = 18;
R.color = cc.color(220, 210, 190);
R.parent = d;
var z = e.champion_reward || e.championReward || {
coins: 0
}, P = new cc.Node("RewardValue");
P.setPosition(60, -20);
P.anchorX = 0;
P.anchorY = .5;
var E = P.addComponent(cc.Label);
E.string = this._formatGold(z.coins || 0) + " 竞技币";
E.fontSize = 20;
P.color = cc.color(255, 180, 50);
P.parent = d;
var I = a >= i;
this._createDialogButton("取消", cc.color(80, 75, 95), -90, -135, 130, 48, function() {
d.destroy();
}).parent = d;
if (I) this._createDialogButton("确认报名", cc.color(76, 175, 80), 90, -135, 150, 48, function() {
o._doSignup(e, d);
}).parent = d; else {
this._createDialogButton("观看广告获取", cc.color(255, 152, 0), 90, -135, 150, 48, function() {
d.destroy();
o._showAdRewardDialog("arena_coin", i - a);
}).parent = d;
var D = new cc.Node("Tip");
D.setPosition(0, -90);
D.anchorX = .5;
D.anchorY = .5;
var B = D.addComponent(cc.Label);
B.string = "竞技币不足，观看广告获取更多";
B.fontSize = 14;
B.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
D.color = cc.color(255, 150, 100);
D.parent = d;
}
var M = new cc.Node("CloseBtn");
M.setContentSize(cc.size(30, 30));
M.x = 185;
M.y = 160;
var x = M.addComponent(cc.Graphics);
x.fillColor = cc.color(0, 0, 0, 80);
x.circle(0, 0, 15);
x.fill();
M.parent = d;
var U = new cc.Node("X");
U.anchorX = .5;
U.anchorY = .5;
var H = U.addComponent(cc.Label);
H.string = "×";
H.fontSize = 24;
H.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
U.color = cc.color(255, 255, 255);
U.parent = M;
M.on(cc.Node.EventType.TOUCH_END, function() {
d.destroy();
});
}, n._doSignup = function(e, o) {
var n = this;
if (window.arenaData) {
this._showMessageCenter("正在报名...");
window.arenaData.signup(e.id, function(t) {
if (t) n._showMessageCenter("报名失败: " + t); else {
n._showMessageCenter("报名成功！");
o && o.destroy();
window.arenaData.refreshBalance && window.arenaData.refreshBalance();
n._updateCurrencyDisplay();
n.scheduleOnce(function() {
n._showSignedUpDialog(e);
}, .5);
}
});
} else this._showMessage("竞技场数据未初始化");
}, n._showSignedUpDialog = function(e) {
var o = this, n = this.node.getChildByName("SignedUpDialog");
n && n.destroy();
var t = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), a = t ? t.designResolution.height : 720, i = t ? t.designResolution.width : 1280, r = new cc.Node("SignedUpDialog");
r.setContentSize(cc.size(i, a));
r.setPosition(0, 0);
r.zIndex = 3e3;
r.parent = this.node;
var c = new cc.Node("Mask"), l = c.addComponent(cc.Graphics);
l.fillColor = cc.color(0, 0, 0, 180);
l.rect(-i / 2, -a / 2, i, a);
l.fill();
c.parent = r;
c.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
});
var s = new cc.Node("DialogBg");
s.setContentSize(cc.size(380, 320));
var d = s.addComponent(cc.Graphics);
d.fillColor = cc.color(35, 30, 50, 250);
d.roundRect(-190, -160, 380, 320, 12);
d.fill();
d.strokeColor = cc.color(76, 175, 80, 200);
d.lineWidth = 3;
d.roundRect(-190, -160, 380, 320, 12);
d.stroke();
s.parent = r;
var h = new cc.Node("Title");
h.setPosition(0, 120);
h.anchorX = .5;
h.anchorY = .5;
var u = h.addComponent(cc.Label);
u.string = "已报名";
u.fontSize = 26;
u.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
h.color = cc.color(100, 220, 100);
h.parent = r;
var p = new cc.Node("RoomName");
p.setPosition(0, 80);
p.anchorX = .5;
p.anchorY = .5;
var g = p.addComponent(cc.Label);
g.string = e.room_name || "竞技场";
g.fontSize = 20;
g.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
p.color = cc.color(200, 180, 140);
p.parent = r;
var _ = new cc.Node("CountdownLabel");
_.setPosition(0, 30);
_.anchorX = .5;
_.anchorY = .5;
var f = _.addComponent(cc.Label);
f.string = "开赛倒计时：计算中...";
f.fontSize = 18;
f.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
_.color = cc.color(255, 220, 100);
_.parent = r;
(function n() {
if (r && r.isValid) {
var t = window.arenaData ? window.arenaData.getCountdown(e.id) : -1;
f.string = t >= 0 ? "开赛倒计时：" + (window.arenaData.formatCountdown ? window.arenaData.formatCountdown(t) : t + "秒") : "等待开赛...";
if (0 === t) {
o._showMessageCenter("比赛即将开始！");
r.destroy();
} else o.scheduleOnce(n, 1);
}
})();
this._createDialogButton("取消报名", cc.color(200, 100, 80), -80, -105, 130, 48, function() {
o._cancelSignup(e, r);
}).parent = r;
this._createDialogButton("关闭", cc.color(80, 75, 95), 80, -105, 100, 48, function() {
r.destroy();
}).parent = r;
}, n._cancelSignup = function(e, o) {
var n = this;
window.arenaData ? window.arenaData.cancelSignup(e.id, function(e) {
if (e) n._showMessageCenter("取消报名失败: " + e); else {
n._showMessageCenter("已取消报名");
o && o.destroy();
n._updateCurrencyDisplay();
}
}) : this._showMessage("竞技场数据未初始化");
}, n._showAdRewardDialog = function(e, o) {
var n = this, t = this.node.getChildByName("AdRewardDialog");
t && t.destroy();
var a = this.node.getComponent(cc.Canvas) || cc.find("Canvas").getComponent(cc.Canvas), i = a ? a.designResolution.height : 720, r = a ? a.designResolution.width : 1280, c = new cc.Node("AdRewardDialog");
c.setContentSize(cc.size(r, i));
c.setPosition(0, 0);
c.zIndex = 3e3;
c.parent = this.node;
var l = new cc.Node("Mask"), s = l.addComponent(cc.Graphics);
s.fillColor = cc.color(0, 0, 0, 180);
s.rect(-r / 2, -i / 2, r, i);
s.fill();
l.parent = c;
l.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
});
var d = new cc.Node("DialogBg");
d.setContentSize(cc.size(380, 300));
var h = d.addComponent(cc.Graphics);
h.fillColor = cc.color(35, 30, 50, 250);
h.roundRect(-190, -150, 380, 300, 12);
h.fill();
h.strokeColor = cc.color(255, 152, 0, 200);
h.lineWidth = 3;
h.roundRect(-190, -150, 380, 300, 12);
h.stroke();
d.parent = c;
var u = new cc.Node("Title");
u.setPosition(0, 110);
u.anchorX = .5;
u.anchorY = .5;
var p = u.addComponent(cc.Label);
p.string = "arena_coin" === e ? "竞技币不足" : "欢乐豆不足";
p.fontSize = 26;
p.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
u.color = cc.color(255, 150, 100);
u.parent = c;
var g = new cc.Node("Desc");
g.setPosition(0, 60);
g.anchorX = .5;
g.anchorY = .5;
var _ = g.addComponent(cc.Label);
_.string = "观看激励视频领取" + this._formatGold(o) + ("arena_coin" === e ? "竞技币" : "欢乐豆") + "继续游戏";
_.fontSize = 16;
_.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
g.color = cc.color(200, 190, 170);
g.parent = c;
var f = new cc.Node("AdIcon");
f.setPosition(0, 0);
f.anchorX = .5;
f.anchorY = .5;
var m = f.addComponent(cc.Label);
m.string = "🎬";
m.fontSize = 48;
f.parent = c;
this._createDialogButton("取消", cc.color(80, 75, 95), -80, -95, 120, 48, function() {
c.destroy();
}).parent = c;
this._createDialogButton("观看领取", cc.color(255, 152, 0), 80, -95, 140, 48, function() {
n._watchAdAndGetReward(e, c);
}).parent = c;
}, n._watchAdAndGetReward = function(e, o) {
var n = this;
this._showMessageCenter("正在加载广告...");
this.scheduleOnce(function() {
window.arenaData ? window.arenaData.watchAdForReward(e, function(e) {
if (e) n._showMessageCenter("获取奖励失败: " + e); else {
n._showMessageCenter("获得奖励！");
o && o.destroy();
n._updateCurrencyDisplay();
}
}) : n._showMessageCenter("数据未初始化");
}, 1.5);
}, n._initTopButtons = function() {
var e = this, o = this.node.getChildByName("shezhi");
if (o) {
o.off(cc.Node.EventType.TOUCH_END);
o.on(cc.Node.EventType.TOUCH_END, function(o) {
o.stopPropagation();
e._showSettingsDialog();
});
}
var n = this.node.getChildByName("bangzhu");
if (n) {
n.off(cc.Node.EventType.TOUCH_END);
n.on(cc.Node.EventType.TOUCH_END, function(o) {
o.stopPropagation();
e._showHelpDialog();
});
}
var t = this.node.getChildByName("xiao'xi");
if (t) {
t.off(cc.Node.EventType.TOUCH_END);
t.on(cc.Node.EventType.TOUCH_END, function(o) {
o.stopPropagation();
e._showMessageCenter("暂无新消息");
});
}
}, n._showSettingsDialog = function() {
var e = this, o = this.node.getChildByName("SettingsDialog");
if (o) o.destroy(); else {
var n = function(e, o) {
var n = {
bgm: void 0 !== window.isopen_sound ? window.isopen_sound : 1,
sfx: void 0 !== window.isopen_sfx ? window.isopen_sfx : 1,
vibration: void 0 !== window.isopen_vibration ? window.isopen_vibration : 1,
savedAt: Date.now()
};
n[e] = o;
if ("undefined" != typeof StorageUtil) {
StorageUtil.setItem(StorageUtil.KEYS.USER_SETTINGS, n);
console.log("[Settings] 已保存设置:", e, "=", o);
}
}, t = function() {
var e = {
bgm: 1,
sfx: 1,
vibration: 1
};
if ("undefined" != typeof StorageUtil) {
var o = StorageUtil.getItem(StorageUtil.KEYS.USER_SETTINGS, null, !0);
if (o && "object" == typeof o) {
e.bgm = void 0 !== o.bgm ? o.bgm : 1;
e.sfx = void 0 !== o.sfx ? o.sfx : 1;
e.vibration = void 0 !== o.vibration ? o.vibration : 1;
}
}
window.isopen_sound = e.bgm;
window.isopen_vibration = e.vibration;
window.isopen_sfx = e.sfx;
return e;
}(), a = new cc.Node("SettingsDialog");
a.setPosition(0, 0);
a.anchorX = .5;
a.anchorY = .5;
a.zIndex = 1e3;
a.parent = this.node;
var i = new cc.Node("Mask");
i.setPosition(0, 0);
i.setContentSize(cc.size(1280, 720));
i.anchorX = .5;
i.anchorY = .5;
var r = i.addComponent(cc.Graphics);
r.fillColor = cc.color(0, 0, 0, 160);
r.rect(-640, -360, 1280, 720);
r.fill();
i.parent = a;
i.on(cc.Node.EventType.TOUCH_END, function() {
a.destroy();
});
var c = new cc.Node("BgNode");
c.setPosition(0, 0);
c.setContentSize(cc.size(420, 380));
c.anchorX = .5;
c.anchorY = .5;
var l = c.addComponent(cc.Graphics);
l.fillColor = cc.color(0, 0, 0, 60);
l.roundRect(-205, -195, 420, 380, 16);
l.fill();
l.fillColor = cc.color(35, 35, 50, 250);
l.roundRect(-210, -190, 420, 380, 16);
l.fill();
l.strokeColor = cc.color(218, 165, 32, 255);
l.lineWidth = 2;
l.stroke();
c.parent = a;
var s = new cc.Node("TitleBar");
s.setPosition(0, 165);
s.setContentSize(cc.size(416, 50));
s.anchorX = .5;
s.anchorY = .5;
var d = s.addComponent(cc.Graphics);
d.fillColor = cc.color(60, 50, 80, 255);
d.roundRect(-208, -25, 416, 50, 14);
d.fill();
s.parent = a;
var h = new cc.Node("Title");
h.setPosition(0, 165);
var u = h.addComponent(cc.Label);
u.string = "设  置";
u.fontSize = 24;
u.lineHeight = 50;
u.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
u.verticalAlign = cc.Label.VerticalAlign.CENTER;
h.color = cc.color(255, 215, 0);
h.parent = a;
var p = function(o, t, i, r, c, l) {
var s = new cc.Node("ItemContainer_" + c);
s.setPosition(0, i);
s.setContentSize(cc.size(390, 52));
s.anchorX = .5;
s.anchorY = .5;
s.parent = a;
var d = new cc.Node("ItemBg");
d.setPosition(0, 0);
d.setContentSize(cc.size(390, 48));
d.anchorX = .5;
d.anchorY = .5;
var h = d.addComponent(cc.Graphics);
h.fillColor = cc.color(55, 50, 70, 255);
h.roundRect(-195, -24, 390, 48, 10);
h.fill();
d.parent = s;
var u = new cc.Node("Icon");
u.setPosition(-167, 0);
var p = u.addComponent(cc.Label);
p.string = t;
p.fontSize = 22;
p.lineHeight = 52;
p.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
p.verticalAlign = cc.Label.VerticalAlign.CENTER;
u.parent = s;
var g = new cc.Node("Label");
g.setPosition(-130, 0);
var _ = g.addComponent(cc.Label);
_.string = o;
_.fontSize = 18;
_.lineHeight = 52;
_.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
_.verticalAlign = cc.Label.VerticalAlign.CENTER;
g.color = cc.color(240, 240, 240);
g.parent = s;
var f = new cc.Node("ToggleContainer");
f.setPosition(157, 0);
f.setContentSize(cc.size(56, 28));
f.anchorX = .5;
f.anchorY = .5;
f.parent = s;
var m = r ? 1 : 0, C = function(e, o) {
var n = o.getComponent(cc.Graphics) || o.addComponent(cc.Graphics);
n.clear();
n.fillColor = 1 === e ? cc.color(76, 175, 80, 255) : cc.color(80, 80, 80, 255);
n.roundRect(-28, -14, 56, 28, 14);
n.fill();
var t = 1 === e ? 14 : -14;
n.fillColor = cc.color(0, 0, 0, 50);
n.circle(t, -2, 11);
n.fill();
n.fillColor = cc.color(255, 255, 255, 255);
n.circle(t, 0, 11);
n.fill();
};
C(m, f);
f._toggleState = m;
f._key = c;
f._callback = l;
s.on(cc.Node.EventType.TOUCH_END, function(o) {
o.stopPropagation();
var t = 1 === f._toggleState ? 0 : 1;
f._toggleState = t;
C(t, f);
if ("bgm" === f._key) {
window.isopen_sound = t;
n("bgm", t);
1 === t ? e._playHallBackgroundMusic() : cc.audioEngine.stopMusic();
} else if ("sfx" === f._key) {
window.isopen_sfx = t;
n("sfx", t);
1 === t && e._playClickSound && e._playClickSound();
} else if ("vibration" === f._key) {
window.isopen_vibration = t;
n("vibration", t);
1 === t && cc.vibrateShort && cc.vibrateShort();
}
l && l(t);
});
return s;
};
p("背景音乐", "🎵", 84, t.bgm, "bgm");
p("游戏音效", "🔊", 24, t.sfx, "sfx");
p("震动反馈", "📳", -36, t.vibration, "vibration");
var g = new cc.Node("Line");
g.setPosition(0, -77);
var _ = g.addComponent(cc.Graphics);
_.strokeColor = cc.color(100, 90, 120, 150);
_.lineWidth = 1;
_.moveTo(-190, 0);
_.lineTo(190, 0);
_.stroke();
g.parent = a;
var f = new cc.Node("LogoutBtn");
f.setPosition(0, -112);
f.setContentSize(cc.size(140, 42));
f.anchorX = .5;
f.anchorY = .5;
var m = f.addComponent(cc.Graphics);
m.fillColor = cc.color(0, 0, 0, 80);
m.roundRect(-72, -23, 144, 46, 8);
m.fill();
m.fillColor = cc.color(220, 53, 69, 255);
m.roundRect(-70, -21, 140, 42, 8);
m.fill();
f.parent = a;
var C = new cc.Node("Label"), v = C.addComponent(cc.Label);
v.string = "退出登录";
v.fontSize = 18;
v.lineHeight = 42;
v.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
v.verticalAlign = cc.Label.VerticalAlign.CENTER;
C.color = cc.color(255, 255, 255);
C.parent = f;
f.on(cc.Node.EventType.TOUCH_END, function(o) {
o.stopPropagation();
e._showLogoutConfirm(a);
});
var w = new cc.Node("CloseBtn");
w.setPosition(182, 162);
w.setContentSize(cc.size(32, 32));
w.anchorX = .5;
w.anchorY = .5;
var y = w.addComponent(cc.Graphics);
y.fillColor = cc.color(100, 90, 110, 230);
y.circle(0, 0, 16);
y.fill();
y.strokeColor = cc.color(180, 170, 190, 150);
y.lineWidth = 1;
y.circle(0, 0, 16);
y.stroke();
w.parent = a;
var b = new cc.Node("X"), S = b.addComponent(cc.Label);
S.string = "✕";
S.fontSize = 18;
S.lineHeight = 32;
S.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
S.verticalAlign = cc.Label.VerticalAlign.CENTER;
b.color = cc.color(255, 255, 255);
b.parent = w;
w.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
a.destroy();
});
}
}, n._showLogoutConfirm = function(e) {
var o = new cc.Node("LogoutConfirmDialog");
o.setPosition(0, 0);
o.anchorX = .5;
o.anchorY = .5;
o.zIndex = 1100;
o.parent = this.node;
var n = new cc.Node("Mask");
n.setContentSize(cc.size(1280, 720));
var t = n.addComponent(cc.Graphics);
t.fillColor = cc.color(0, 0, 0, 100);
t.rect(-640, -360, 1280, 720);
t.fill();
n.parent = o;
var a = new cc.Node("Bg");
a.setContentSize(cc.size(320, 170));
a.anchorX = .5;
a.anchorY = .5;
var i = a.addComponent(cc.Graphics);
i.fillColor = cc.color(0, 0, 0, 50);
i.roundRect(-156, -89, 320, 170, 12);
i.fill();
i.fillColor = cc.color(40, 38, 55, 255);
i.roundRect(-160, -85, 320, 170, 12);
i.fill();
i.strokeColor = cc.color(218, 165, 32, 200);
i.lineWidth = 2;
i.stroke();
a.parent = o;
var r = new cc.Node("Tip");
r.setPosition(0, 25);
var c = r.addComponent(cc.Label);
c.string = "确定要退出登录吗？";
c.fontSize = 20;
c.lineHeight = 50;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
c.verticalAlign = cc.Label.VerticalAlign.CENTER;
r.color = cc.color(255, 255, 255);
r.parent = o;
var l = new cc.Node("CancelBtn");
l.setPosition(-60, -40);
l.setContentSize(cc.size(100, 38));
l.anchorX = .5;
l.anchorY = .5;
var s = l.addComponent(cc.Graphics);
s.fillColor = cc.color(70, 65, 85, 255);
s.roundRect(-50, -19, 100, 38, 6);
s.fill();
s.strokeColor = cc.color(100, 95, 115, 200);
s.lineWidth = 1;
s.stroke();
l.parent = o;
var d = new cc.Node("Label"), h = d.addComponent(cc.Label);
h.string = "取消";
h.fontSize = 16;
h.lineHeight = 38;
h.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
h.verticalAlign = cc.Label.VerticalAlign.CENTER;
d.color = cc.color(240, 240, 240);
d.parent = l;
l.on(cc.Node.EventType.TOUCH_END, function(e) {
e.stopPropagation();
o.destroy();
});
var u = new cc.Node("ConfirmBtn");
u.setPosition(60, -40);
u.setContentSize(cc.size(100, 38));
u.anchorX = .5;
u.anchorY = .5;
var p = u.addComponent(cc.Graphics);
p.fillColor = cc.color(220, 53, 69, 255);
p.roundRect(-50, -19, 100, 38, 6);
p.fill();
u.parent = o;
var g = new cc.Node("Label"), _ = g.addComponent(cc.Label);
_.string = "退出";
_.fontSize = 16;
_.lineHeight = 38;
_.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
_.verticalAlign = cc.Label.VerticalAlign.CENTER;
g.color = cc.color(255, 255, 255);
g.parent = u;
u.on(cc.Node.EventType.TOUCH_END, function(n) {
n.stopPropagation();
window.myglobal && (window.myglobal.playerData = null);
if ("undefined" != typeof StorageUtil) StorageUtil.clearPlayerSession(); else try {
localStorage.removeItem("token");
localStorage.removeItem("playerData");
} catch (e) {}
o.destroy();
e && e.destroy();
cc.director.loadScene("loginScene");
});
}, n._showHelpDialog = function() {
var e = this, o = this.node.getChildByName("HelpDialog");
if (o) o.destroy(); else {
var n = new cc.Node("HelpDialog");
n.setPosition(0, 0);
n.anchorX = .5;
n.anchorY = .5;
n.zIndex = 1e3;
n.parent = this.node;
(u = new cc.Node("Mask")).setContentSize(cc.size(1280, 720));
u.anchorX = .5;
u.anchorY = .5;
var t = u.addComponent(cc.Graphics);
t.fillColor = cc.color(0, 0, 0, 160);
t.rect(-640, -360, 1280, 720);
t.fill();
u.parent = n;
u.on(cc.Node.EventType.TOUCH_END, function() {
e._helpScrollView = null;
n.destroy();
});
var a = new cc.Node("BgNode");
a.setPosition(0, 0);
a.setContentSize(cc.size(650, 520));
a.anchorX = .5;
a.anchorY = .5;
var i = a.addComponent(cc.Graphics);
i.fillColor = cc.color(0, 0, 0, 60);
i.roundRect(-320, -265, 650, 520, 16);
i.fill();
i.fillColor = cc.color(35, 35, 50, 250);
i.roundRect(-325, -260, 650, 520, 16);
i.fill();
i.strokeColor = cc.color(218, 165, 32, 255);
i.lineWidth = 2;
i.stroke();
a.parent = n;
var r = new cc.Node("TitleBar");
r.setPosition(0, 235);
r.setContentSize(cc.size(646, 50));
r.anchorX = .5;
r.anchorY = .5;
var c = r.addComponent(cc.Graphics);
c.fillColor = cc.color(60, 50, 80, 255);
c.roundRect(-323, -25, 646, 50, 14);
c.fill();
r.parent = n;
var l = new cc.Node("Title");
l.setPosition(0, 235);
var s = l.addComponent(cc.Label);
s.string = "游 戏 帮 助";
s.fontSize = 24;
s.lineHeight = 50;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
l.color = cc.color(255, 215, 0);
l.parent = n;
var d = new cc.Node("ScrollView");
d.setPosition(0, -5);
d.setContentSize(cc.size(610, 390));
d.anchorX = .5;
d.anchorY = .5;
d.parent = n;
var h = d.addComponent(cc.ScrollView);
h.horizontal = !1;
h.vertical = !0;
h.inertia = !0;
h.brake = .5;
h.elastic = !0;
h.bounceDuration = .5;
var u, p = new cc.Node("view");
p.setContentSize(cc.size(610, 390));
p.anchorX = .5;
p.anchorY = .5;
p.x = 0;
p.y = 0;
p.parent = d;
(u = p.addComponent(cc.Mask)).type = cc.Mask.Type.RECT;
var g = new cc.Node("content");
g.setContentSize(cc.size(610, 390));
g.anchorX = .5;
g.anchorY = 1;
g.x = 0;
g.y = 195;
g.parent = p;
h.content = g;
var _ = new cc.Node("LoadingLabel");
_.setPosition(0, -175);
var f = _.addComponent(cc.Label);
f.string = "正在加载帮助内容...";
f.fontSize = 18;
f.lineHeight = 24;
f.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
f.verticalAlign = cc.Label.VerticalAlign.CENTER;
_.color = cc.color(180, 180, 180);
_.parent = g;
e._helpScrollView = h;
setTimeout(function() {
var o = window.defines ? window.defines.apiUrl : "", n = window.defines ? window.defines.cryptoKey : "";
console.log("【帮助弹窗】开始获取帮助内容，apiUrl:", o);
if (o) {
var t = o + "/api/v1/help-article/list";
console.log("【帮助弹窗】请求URL:", t);
var a = new XMLHttpRequest();
a.open("GET", t, !0);
a.setRequestHeader("Content-Type", "application/json");
a.onreadystatechange = function() {
if (4 === a.readyState) {
console.log("【帮助弹窗】请求完成，状态:", a.status);
if (200 === a.status) try {
var o = JSON.parse(a.responseText);
console.log("【帮助弹窗】响应数据:", JSON.stringify(o).substring(0, 500));
if (o.data && o.timestamp && "string" == typeof o.data) {
console.log("【帮助弹窗】检测到加密响应，准备解密");
if (window.HttpAPI && window.HttpAPI.decryptAESGCM) window.HttpAPI.decryptAESGCM(o.data, n).then(function(o) {
console.log("【帮助弹窗】解密成功，数据类型:", typeof o, "是否数组:", Array.isArray(o));
console.log("【帮助弹窗】解密后数据:", JSON.stringify(o).substring(0, 1e3));
o && "object" == typeof o && console.log("【帮助弹窗】解密后对象的属性:", Object.keys(o));
var n = null;
if (Array.isArray(o)) n = o; else if (o && "object" == typeof o) if (Array.isArray(o.data)) n = o.data; else if (Array.isArray(o.list)) n = o.list; else if (Array.isArray(o.items)) n = o.items; else if (Array.isArray(o.records)) n = o.records; else if (Array.isArray(o.rows)) n = o.rows; else if (Array.isArray(o.articles)) n = o.articles; else for (var t in o) if (Array.isArray(o[t])) {
n = o[t];
console.log("【帮助弹窗】从属性 '" + t + "' 提取到数组");
break;
}
console.log("【帮助弹窗】解析后helpItems条数:", n ? n.length : 0);
if (n && n.length > 0) {
console.log("【帮助弹窗】helpItems[0]原始content:", n[0].content ? n[0].content.substring(0, 200) : "空");
var a = n.map(function(o) {
var n = e._stripHtmlTags(o.content || "");
console.log("【帮助弹窗】处理后标题:", o.title, "内容长度:", n.length);
return {
title: o.title || "无标题",
content: n
};
});
console.log("【帮助弹窗】准备显示手风琴数据，条数:", a.length);
e._showHelpContentFromList(g, _, a);
} else {
console.warn("【帮助弹窗】helpItems为空，使用默认内容");
e._showHelpContent(g, _, "【游戏规则】\n\n本游戏为经典斗地主扑克牌游戏，支持3人玩法。\n\n【基本规则】\n• 一副牌54张，一人17张，留3张做底牌\n• 叫地主：玩家可选择叫地主或不叫，叫地主者获得3张底牌\n• 出牌：地主先出牌，按逆时针顺序出牌\n• 牌型：单张、对子、三张、三带一、三带二、顺子、连对、飞机、炸弹、王炸等\n\n【牌型大小】\n• 王炸 > 炸弹 > 其他牌型\n• 同牌型按点数比较大小\n• 大王 > 小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3\n\n【获胜条件】\n• 地主：先出完所有牌即获胜\n• 农民：任一农民先出完牌，农民方获胜\n\n【货币说明】\n• 欢乐豆：普通场游戏货币，用于报名参赛\n• 竞技币：竞技场专用货币，参与锦标赛使用\n\n【联系客服】\n如有问题，请联系客服处理。");
}
}).catch(function(o) {
console.error("【帮助弹窗】解密失败:", o);
e._showHelpContent(g, _, "【游戏规则】\n\n本游戏为经典斗地主扑克牌游戏，支持3人玩法。\n\n【基本规则】\n• 一副牌54张，一人17张，留3张做底牌\n• 叫地主：玩家可选择叫地主或不叫，叫地主者获得3张底牌\n• 出牌：地主先出牌，按逆时针顺序出牌\n• 牌型：单张、对子、三张、三带一、三带二、顺子、连对、飞机、炸弹、王炸等\n\n【牌型大小】\n• 王炸 > 炸弹 > 其他牌型\n• 同牌型按点数比较大小\n• 大王 > 小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3\n\n【获胜条件】\n• 地主：先出完所有牌即获胜\n• 农民：任一农民先出完牌，农民方获胜\n\n【货币说明】\n• 欢乐豆：普通场游戏货币，用于报名参赛\n• 竞技币：竞技场专用货币，参与锦标赛使用\n\n【联系客服】\n如有问题，请联系客服处理。");
}); else {
console.warn("【帮助弹窗】HttpAPI.decryptAESGCM 不可用，使用默认内容");
e._showHelpContent(g, _, "【游戏规则】\n\n本游戏为经典斗地主扑克牌游戏，支持3人玩法。\n\n【基本规则】\n• 一副牌54张，一人17张，留3张做底牌\n• 叫地主：玩家可选择叫地主或不叫，叫地主者获得3张底牌\n• 出牌：地主先出牌，按逆时针顺序出牌\n• 牌型：单张、对子、三张、三带一、三带二、顺子、连对、飞机、炸弹、王炸等\n\n【牌型大小】\n• 王炸 > 炸弹 > 其他牌型\n• 同牌型按点数比较大小\n• 大王 > 小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3\n\n【获胜条件】\n• 地主：先出完所有牌即获胜\n• 农民：任一农民先出完牌，农民方获胜\n\n【货币说明】\n• 欢乐豆：普通场游戏货币，用于报名参赛\n• 竞技币：竞技场专用货币，参与锦标赛使用\n\n【联系客服】\n如有问题，请联系客服处理。");
}
} else if (0 === o.code && o.data) {
console.log("【帮助弹窗】检测到非加密响应，code=0");
var t = null;
Array.isArray(o.data) && (t = o.data);
console.log("【帮助弹窗】非加密响应helpItems条数:", t ? t.length : 0);
if (t && t.length > 0) {
console.log("【帮助弹窗】非加密helpItems[0]原始content:", t[0].content ? t[0].content.substring(0, 200) : "空");
var i = t.map(function(o) {
var n = e._stripHtmlTags(o.content || "");
console.log("【帮助弹窗】处理后标题:", o.title, "内容长度:", n.length);
return {
title: o.title || "无标题",
content: n
};
});
console.log("【帮助弹窗】准备显示手风琴数据，条数:", i.length);
e._showHelpContentFromList(g, _, i);
} else {
console.warn("【帮助弹窗】helpItems为空，使用默认内容");
e._showHelpContent(g, _, "【游戏规则】\n\n本游戏为经典斗地主扑克牌游戏，支持3人玩法。\n\n【基本规则】\n• 一副牌54张，一人17张，留3张做底牌\n• 叫地主：玩家可选择叫地主或不叫，叫地主者获得3张底牌\n• 出牌：地主先出牌，按逆时针顺序出牌\n• 牌型：单张、对子、三张、三带一、三带二、顺子、连对、飞机、炸弹、王炸等\n\n【牌型大小】\n• 王炸 > 炸弹 > 其他牌型\n• 同牌型按点数比较大小\n• 大王 > 小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3\n\n【获胜条件】\n• 地主：先出完所有牌即获胜\n• 农民：任一农民先出完牌，农民方获胜\n\n【货币说明】\n• 欢乐豆：普通场游戏货币，用于报名参赛\n• 竞技币：竞技场专用货币，参与锦标赛使用\n\n【联系客服】\n如有问题，请联系客服处理。");
}
} else {
console.warn("【帮助弹窗】响应格式不正确，code:", o.code, "data:", o.data ? "存在" : "不存在");
e._showHelpContent(g, _, "【游戏规则】\n\n本游戏为经典斗地主扑克牌游戏，支持3人玩法。\n\n【基本规则】\n• 一副牌54张，一人17张，留3张做底牌\n• 叫地主：玩家可选择叫地主或不叫，叫地主者获得3张底牌\n• 出牌：地主先出牌，按逆时针顺序出牌\n• 牌型：单张、对子、三张、三带一、三带二、顺子、连对、飞机、炸弹、王炸等\n\n【牌型大小】\n• 王炸 > 炸弹 > 其他牌型\n• 同牌型按点数比较大小\n• 大王 > 小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3\n\n【获胜条件】\n• 地主：先出完所有牌即获胜\n• 农民：任一农民先出完牌，农民方获胜\n\n【货币说明】\n• 欢乐豆：普通场游戏货币，用于报名参赛\n• 竞技币：竞技场专用货币，参与锦标赛使用\n\n【联系客服】\n如有问题，请联系客服处理。");
}
} catch (o) {
console.error("【帮助弹窗】解析帮助内容失败:", o);
e._showHelpContent(g, _, "【游戏规则】\n\n本游戏为经典斗地主扑克牌游戏，支持3人玩法。\n\n【基本规则】\n• 一副牌54张，一人17张，留3张做底牌\n• 叫地主：玩家可选择叫地主或不叫，叫地主者获得3张底牌\n• 出牌：地主先出牌，按逆时针顺序出牌\n• 牌型：单张、对子、三张、三带一、三带二、顺子、连对、飞机、炸弹、王炸等\n\n【牌型大小】\n• 王炸 > 炸弹 > 其他牌型\n• 同牌型按点数比较大小\n• 大王 > 小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3\n\n【获胜条件】\n• 地主：先出完所有牌即获胜\n• 农民：任一农民先出完牌，农民方获胜\n\n【货币说明】\n• 欢乐豆：普通场游戏货币，用于报名参赛\n• 竞技币：竞技场专用货币，参与锦标赛使用\n\n【联系客服】\n如有问题，请联系客服处理。");
} else {
console.warn("【帮助弹窗】获取帮助内容失败，状态码:", a.status);
e._showHelpContent(g, _, "【游戏规则】\n\n本游戏为经典斗地主扑克牌游戏，支持3人玩法。\n\n【基本规则】\n• 一副牌54张，一人17张，留3张做底牌\n• 叫地主：玩家可选择叫地主或不叫，叫地主者获得3张底牌\n• 出牌：地主先出牌，按逆时针顺序出牌\n• 牌型：单张、对子、三张、三带一、三带二、顺子、连对、飞机、炸弹、王炸等\n\n【牌型大小】\n• 王炸 > 炸弹 > 其他牌型\n• 同牌型按点数比较大小\n• 大王 > 小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3\n\n【获胜条件】\n• 地主：先出完所有牌即获胜\n• 农民：任一农民先出完牌，农民方获胜\n\n【货币说明】\n• 欢乐豆：普通场游戏货币，用于报名参赛\n• 竞技币：竞技场专用货币，参与锦标赛使用\n\n【联系客服】\n如有问题，请联系客服处理。");
}
}
};
a.onerror = function() {
console.error("【帮助弹窗】请求失败，网络错误");
e._showHelpContent(g, _, "【游戏规则】\n\n本游戏为经典斗地主扑克牌游戏，支持3人玩法。\n\n【基本规则】\n• 一副牌54张，一人17张，留3张做底牌\n• 叫地主：玩家可选择叫地主或不叫，叫地主者获得3张底牌\n• 出牌：地主先出牌，按逆时针顺序出牌\n• 牌型：单张、对子、三张、三带一、三带二、顺子、连对、飞机、炸弹、王炸等\n\n【牌型大小】\n• 王炸 > 炸弹 > 其他牌型\n• 同牌型按点数比较大小\n• 大王 > 小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3\n\n【获胜条件】\n• 地主：先出完所有牌即获胜\n• 农民：任一农民先出完牌，农民方获胜\n\n【货币说明】\n• 欢乐豆：普通场游戏货币，用于报名参赛\n• 竞技币：竞技场专用货币，参与锦标赛使用\n\n【联系客服】\n如有问题，请联系客服处理。");
};
a.send();
} else {
console.warn("【帮助弹窗】apiUrl 为空，使用默认内容");
e._showHelpContent(g, _, "【游戏规则】\n\n本游戏为经典斗地主扑克牌游戏，支持3人玩法。\n\n【基本规则】\n• 一副牌54张，一人17张，留3张做底牌\n• 叫地主：玩家可选择叫地主或不叫，叫地主者获得3张底牌\n• 出牌：地主先出牌，按逆时针顺序出牌\n• 牌型：单张、对子、三张、三带一、三带二、顺子、连对、飞机、炸弹、王炸等\n\n【牌型大小】\n• 王炸 > 炸弹 > 其他牌型\n• 同牌型按点数比较大小\n• 大王 > 小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3\n\n【获胜条件】\n• 地主：先出完所有牌即获胜\n• 农民：任一农民先出完牌，农民方获胜\n\n【货币说明】\n• 欢乐豆：普通场游戏货币，用于报名参赛\n• 竞技币：竞技场专用货币，参与锦标赛使用\n\n【联系客服】\n如有问题，请联系客服处理。");
}
}, 100);
var m = new cc.Node("ConfirmBtn");
m.setPosition(0, -220);
m.setContentSize(cc.size(120, 40));
m.anchorX = .5;
m.anchorY = .5;
var C = m.addComponent(cc.Graphics);
C.fillColor = cc.color(76, 175, 80, 255);
C.roundRect(-60, -20, 120, 40, 8);
C.fill();
m.parent = n;
var v = new cc.Node("Label"), w = v.addComponent(cc.Label);
w.string = "我知道了";
w.fontSize = 16;
w.lineHeight = 40;
w.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
w.verticalAlign = cc.Label.VerticalAlign.CENTER;
v.color = cc.color(255, 255, 255);
v.parent = m;
m.on(cc.Node.EventType.TOUCH_END, function(o) {
o.stopPropagation();
e._helpScrollView = null;
n.destroy();
});
var y = new cc.Node("CloseBtn");
y.setPosition(297, 232);
y.setContentSize(cc.size(32, 32));
y.anchorX = .5;
y.anchorY = .5;
var b = y.addComponent(cc.Graphics);
b.fillColor = cc.color(100, 90, 110, 230);
b.circle(0, 0, 16);
b.fill();
b.strokeColor = cc.color(180, 170, 190, 150);
b.lineWidth = 1;
b.circle(0, 0, 16);
b.stroke();
y.parent = n;
var S = new cc.Node("X"), N = S.addComponent(cc.Label);
N.string = "✕";
N.fontSize = 18;
N.lineHeight = 32;
N.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
N.verticalAlign = cc.Label.VerticalAlign.CENTER;
S.color = cc.color(255, 255, 255);
S.parent = y;
y.on(cc.Node.EventType.TOUCH_END, function(o) {
o.stopPropagation();
e._helpScrollView = null;
n.destroy();
});
}
}, n._stripHtmlTags = function(e) {
if (!e) return "";
var o = e.replace(/<br\s*\/?>/gi, "\n");
return (o = (o = (o = (o = (o = (o = (o = (o = (o = (o = (o = o.replace(/<\/p>/gi, "\n")).replace(/<\/h[1-6]>/gi, "\n\n")).replace(/<li>/gi, "• ")).replace(/<[^>]+>/g, "")).replace(/&nbsp;/g, " ")).replace(/&lt;/g, "<")).replace(/&gt;/g, ">")).replace(/&amp;/g, "&")).replace(/&quot;/g, '"')).replace(/&#39;/g, "'")).replace(/\n\s*\n\s*\n/g, "\n\n")).trim();
}, n._showHelpContentFromList = function(e, o, n) {
console.log("【帮助弹窗】_showHelpContentFromList 被调用，数据条数:", n ? n.length : 0);
o && o.parent && (o.parent = null);
if (Array.isArray(n) && 0 !== n.length) {
console.log("【帮助弹窗】第一条数据:", JSON.stringify(n[0]));
console.log("【帮助弹窗】第一条数据content字段:", n[0].content);
console.log("【帮助弹窗】第一条数据content长度:", n[0].content ? n[0].content.length : 0);
var t = this, a = {}, i = [], r = new cc.Node("HelpContent");
r.setContentSize(cc.size(e.width, 100));
r.anchorX = .5;
r.anchorY = 1;
r.x = 0;
r.y = 0;
r.parent = e;
console.log("【帮助弹窗】contentNode 创建完成，尺寸:", e.width, "x", e.height);
n.forEach(function(e, o) {
var c = new cc.Node("item_" + o);
c.width = r.width;
c.anchorX = .5;
c.anchorY = 1;
c.x = 0;
var l = new cc.Node("titleBg");
l.setPosition(0, 0);
l.setContentSize(cc.size(560, 45));
l.anchorX = .5;
l.anchorY = 1;
var s = l.addComponent(cc.Graphics);
s.fillColor = cc.color(60, 55, 75, 255);
s.roundRect(-280, -45, 560, 45, 6);
s.fill();
s.strokeColor = cc.color(100, 90, 120, 255);
s.lineWidth = 1;
s.stroke();
var d = new cc.Node("title"), h = d.addComponent(cc.Label);
h.string = o + 1 + ". " + e.title;
h.fontSize = 18;
h.lineHeight = 22;
h.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
d.color = cc.color(255, 220, 100);
d.anchorX = 0;
d.anchorY = .5;
d.x = -265;
d.y = -22.5;
var u = new cc.Node("icon"), p = u.addComponent(cc.Label);
p.string = "▶";
p.fontSize = 14;
u.color = cc.color(200, 200, 200);
u.anchorY = .5;
u.x = 260;
u.y = -22.5;
var g = new cc.Node("contentBox");
g.setPosition(0, -45);
g.setContentSize(cc.size(560, 200));
g.anchorX = .5;
g.anchorY = 1;
var _ = new cc.Node("contentBg");
_.setContentSize(cc.size(560, 200));
_.anchorX = .5;
_.anchorY = 1;
var f = _.addComponent(cc.Graphics);
f.fillColor = cc.color(45, 42, 55, 200);
f.roundRect(-280, -200, 560, 200, 4);
f.fill();
_.y = 0;
_.parent = g;
var m = new cc.Node("contentLabel"), C = m.addComponent(cc.Label);
C.fontSize = 14;
C.lineHeight = 20;
C.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
C.enableWrapText = !0;
C.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
console.log("【帮助弹窗】第" + (o + 1) + "条wrapWidth:", 530);
C.wrapWidth = 530;
m.setContentSize(cc.size(530, 20));
m.color = cc.color(220, 220, 220);
m.anchorX = 0;
m.anchorY = 1;
m.x = -265;
m.y = -10;
m.parent = g;
var v = e.content || "暂无内容";
console.log("【帮助弹窗】第" + (o + 1) + "条内容长度:", v.length);
C.string = v;
console.log("【帮助弹窗】第" + (o + 1) + "条contentLabel初始高度:", m.height);
console.log("【帮助弹窗】第" + (o + 1) + "条contentBox初始高度:", g.height);
i.push({
contentBox: g,
labelComp: C,
contentBg: _,
index: o
});
l.on(cc.Node.EventType.TOUCH_END, function() {
var e = g.active;
for (var i in a) if (i != o && a[i]) {
var c = r.getChildByName("item_" + i);
if (c) {
var l = c.getChildByName("contentBox"), s = c.getChildByName("titleBg").getChildByName("icon");
l && (l.active = !1);
s && (s.getComponent(cc.Label).string = "▶");
a[i] = !1;
}
}
g.active = !e;
p.string = g.active ? "▼" : "▶";
a[o] = g.active;
t._relayoutHelpItems(r, n, 45, a);
});
d.parent = l;
u.parent = l;
l.parent = c;
g.parent = c;
c.parent = r;
a[o] = !1;
});
this.scheduleOnce(function() {
console.log("【帮助弹窗】延迟更新Label高度");
i.forEach(function(e, o) {
var n = e.labelComp.node.height;
console.log("【帮助弹窗】第" + (o + 1) + "条actualHeight:", n);
var t = 200;
if (n > 0 && n < 5e3) t = n + 30; else {
var a = e.labelComp.string, i = Math.floor(530 / 8.4);
t = 20 * Math.ceil(a.length / i) + 30;
console.log("【帮助弹窗】第" + (o + 1) + "条估算高度:", t);
}
e.contentBox.setContentSize(cc.size(560, t));
e.contentBg.setContentSize(cc.size(560, t));
var r = e.contentBg.getComponent(cc.Graphics);
if (r) {
r.clear();
r.fillColor = cc.color(45, 42, 55, 200);
r.roundRect(-280, -t, 560, t, 4);
r.fill();
}
console.log("【帮助弹窗】第" + (o + 1) + "条更新后高度:", t);
e.contentBox.active = !1;
});
t._relayoutHelpItems(r, n, 45, a);
}, .2);
this._relayoutHelpItems(r, n, 45, a);
console.log("【帮助弹窗】UI创建完成，内容高度:", r.height);
console.log("【帮助弹窗】itemNode 数量:", r.children.length);
} else {
console.warn("【帮助弹窗】helpItems 为空或不是数组，使用默认内容");
this._showPlainText(e, "【游戏规则】\n\n本游戏为经典斗地主扑克牌游戏，支持3人玩法。\n\n【基本规则】\n• 一副牌54张，一人17张，留3张做底牌\n• 叫地主：玩家可选择叫地主或不叫，叫地主者获得3张底牌\n• 出牌：地主先出牌，按逆时针顺序出牌\n• 牌型：单张、对子、三张、三带一、三带二、顺子、连对、飞机、炸弹、王炸等\n\n【牌型大小】\n• 王炸 > 炸弹 > 其他牌型\n• 同牌型按点数比较大小\n• 大王 > 小王 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3\n\n【获胜条件】\n• 地主：先出完所有牌即获胜\n• 农民：任一农民先出完牌，农民方获胜\n\n【货币说明】\n• 欢乐豆：普通场游戏货币，用于报名参赛\n• 竞技币：竞技场专用货币，参与锦标赛使用\n\n【联系客服】\n如有问题，请联系客服处理。");
}
}, n._showHelpContent = function(e, o, n) {
o && o.parent && (o.parent = null);
var t = null;
try {
t = JSON.parse(n);
} catch (o) {
this._showPlainText(e, n);
return;
}
if (Array.isArray(t) && 0 !== t.length) {
var a = new cc.Node("HelpContent");
a.setContentSize(cc.size(e.width, 100));
a.anchorX = .5;
a.anchorY = 1;
a.x = 0;
a.y = 0;
a.parent = e;
var i = {};
t.forEach(function(e, o) {
var n = new cc.Node("item_" + o);
n.width = a.width;
n.anchorX = .5;
n.anchorY = 1;
n.x = 0;
var r = new cc.Node("titleBg");
r.setPosition(0, 0);
r.width = a.width - 10;
r.height = 45;
r.anchorX = .5;
r.anchorY = 1;
var c = r.addComponent(cc.Graphics);
c.fillColor = cc.color(60, 55, 75, 255);
c.roundRect(-r.width / 2, -r.height, r.width, r.height, 6);
c.fill();
c.strokeColor = cc.color(100, 90, 120, 255);
c.lineWidth = 1;
c.stroke();
var l = new cc.Node("title"), s = l.addComponent(cc.Label);
s.string = o + 1 + ". " + e.title;
s.fontSize = 18;
s.lineHeight = 22;
s.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
l.color = cc.color(255, 220, 100);
l.anchorX = 0;
l.anchorY = .5;
l.x = -r.width / 2 + 15;
l.y = -22.5;
var d = new cc.Node("icon"), h = d.addComponent(cc.Label);
h.string = "▶";
h.fontSize = 14;
d.color = cc.color(200, 200, 200);
d.anchorY = .5;
d.x = r.width / 2 - 20;
d.y = -22.5;
var u = new cc.Node("contentBox");
u.setPosition(0, -45);
u.width = a.width - 20;
u.anchorX = .5;
u.anchorY = 1;
var p = new cc.Node("contentLabel"), g = p.addComponent(cc.Label);
g.string = e.content;
g.fontSize = 14;
g.lineHeight = 20;
g.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
g.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
g.wrapWidth = u.width - 30;
p.color = cc.color(220, 220, 220);
p.anchorX = 0;
p.anchorY = 1;
p.x = -u.width / 2 + 15;
p.y = -10;
p.parent = u;
u.height = g.node.height + 20;
u.active = !1;
r.on(cc.Node.EventType.TOUCH_END, function() {
var e = u.active;
for (var n in i) if (n != o && i[n]) {
var r = a.getChildByName("item_" + n);
if (r) {
var c = r.getChildByName("contentBox"), l = r.getChildByName("titleBg").getChildByName("icon");
c && (c.active = !1);
l && (l.getComponent(cc.Label).string = "▶");
i[n] = !1;
}
}
u.active = !e;
h.string = u.active ? "▼" : "▶";
i[o] = u.active;
this._relayoutHelpItems(a, t, 45, i);
}.bind(this));
l.parent = r;
d.parent = r;
r.parent = n;
u.parent = n;
n.parent = a;
i[o] = !1;
}.bind(this));
this._relayoutHelpItems(a, t, 45, i);
console.log("【帮助弹窗】UI创建完成（简化版），内容高度:", a.height);
} else this._showPlainText(e, n);
}, n._relayoutHelpItems = function(e, o, n, t) {
var a = 0;
o.forEach(function(o, i) {
var r = e.getChildByName("item_" + i);
if (r) {
r.y = -a;
a += n + 8;
var c = r.getChildByName("contentBox");
if (c && t[i]) {
var l = c.height || 80;
c.y = -n - 5;
a += l + 8;
}
}
});
e.height = Math.max(a + 20, 100);
var i = e.parent;
if (i) {
var r = this._helpScrollView;
if (r) {
i.height = Math.max(a + 40, i.height);
r.scrollToTop(.1);
}
}
console.log("【帮助弹窗】布局更新，总高度:", e.height);
}, n._showPlainText = function(e, o) {
var n = new cc.Node("ContentLabel");
n.setPosition(0, 0);
var t = n.addComponent(cc.Label);
t.string = o;
t.fontSize = 16;
t.lineHeight = 24;
t.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
t.verticalAlign = cc.Label.VerticalAlign.TOP;
t.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
t.wrapWidth = e.width - 20;
n.color = cc.color(240, 240, 240);
n.anchorX = .5;
n.anchorY = 1;
n.parent = e;
var a = this;
this.scheduleOnce(function() {
var o = n.height + 40;
e.height = Math.max(o, e.height);
a._helpScrollView && a._helpScrollView.scrollToTop(0);
}, .05);
}, n.onDestroy = function() {
if (this._countdownTimer) {
clearInterval(this._countdownTimer);
this._countdownTimer = null;
}
window.arenaData && window.arenaData.clearAllCountdowns && window.arenaData.clearAllCountdowns();
if (this._visibilityChangeHandler && document.removeEventListener) {
document.removeEventListener("visibilitychange", this._visibilityChangeHandler);
this._visibilityChangeHandler = null;
}
}, n.start = function() {}, n));
cc._RF.pop();
}, {} ],
joinroom: [ function(e, o) {
"use strict";
cc._RF.push(o, "f5be7jebVDi+qr1Px4nfSdB", "joinroom");
cc.Class({
extends: cc.Component,
properties: {
room_id_input: {
type: cc.EditBox,
default: null
}
},
onLoad: function() {},
start: function() {},
onButtonClick: function(e, o) {
var n = window.myglobal;
if (n && n.socket) switch (o) {
case "join_room_confirm":
this._joinRoom();
break;

case "join_room_close":
this.node.destroy();
} else console.error("socket 未连接");
},
_joinRoom: function() {
var e = window.myglobal;
if (this.room_id_input && e && e.socket) {
var o = this.room_id_input.string;
o && o.length;
}
}
});
cc._RF.pop();
}, {} ],
loginScene: [ function(e, o) {
"use strict";
cc._RF.push(o, "b05a68gSOpBWr8ddvT03Jpj", "loginScene");
var n = function(e, o) {
if ("native-phone-input" !== e.id && "native-code-input" !== e.id) {
e.style.setProperty("color", o, "important");
e.style.color = o;
e.style.setProperty("background-color", "transparent", "important");
e.style.backgroundColor = "transparent";
e.style.setProperty("display", "flex", "important");
e.style.display = "flex";
e.style.setProperty("align-items", "center", "important");
e.style.alignItems = "center";
e.style.setProperty("justify-content", "flex-start", "important");
e.style.justifyContent = "flex-start";
e.style.setProperty("box-sizing", "border-box", "important");
e.style.boxSizing = "border-box";
e.style.setProperty("padding", "0 12px", "important");
e.style.padding = "0 12px";
e.style.setProperty("line-height", "1", "important");
e.style.lineHeight = "1";
e.style.setProperty("height", "100%", "important");
e.style.height = "100%";
e.style.setProperty("font-size", "20px", "important");
e.style.fontSize = "20px";
e.style.setProperty("font-family", 'Arial, "Microsoft YaHei", sans-serif', "important");
e.style.setProperty("-webkit-text-fill-color", o, "important");
e.style.webkitTextFillColor = o;
e.style.setProperty("opacity", "1", "important");
e.style.opacity = "1";
e.style.setProperty("visibility", "visible", "important");
e.style.visibility = "visible";
e.style.setProperty("caret-color", o, "important");
e.style.caretColor = o;
e.style.textShadow = "none";
e.style.setProperty("text-shadow", "none", "important");
e.style.outline = "none";
e.style.setProperty("outline", "none", "important");
e.style.border = "none";
e.style.setProperty("border", "none", "important");
e.style.removeProperty("top");
e.style.removeProperty("margin-top");
e.style.removeProperty("margin");
e.style.setProperty("outline-offset", "0", "important");
}
}, t = function(e) {
try {
var o = "cocos-editbox-fix-style";
if (document.getElementById(o)) return;
var n = "\n            /* 输入框基础样式 - 透明背景 + 文字居中 */\n            /* 注意：排除原生输入框 #native-phone-input, #native-code-input */\n            input:not(#native-phone-input):not(#native-code-input), \n            textarea:not(#native-phone-input):not(#native-code-input) {\n                color: " + e + " !important;\n                background-color: transparent !important;\n                opacity: 1 !important;\n                visibility: visible !important;\n                font-size: 20px !important;\n                -webkit-text-fill-color: " + e + " !important;\n                caret-color: " + e + " !important;\n                line-height: 1 !important;\n                border: none !important;\n                outline: none !important;\n            }\n            \n            /* Placeholder 样式 */\n            input::placeholder, textarea::placeholder {\n                color: #888888 !important;\n                opacity: 1 !important;\n            }\n            \n            /* 聚焦状态 */\n            input:focus:not(#native-phone-input):not(#native-code-input), \n            textarea:focus:not(#native-phone-input):not(#native-code-input) {\n                color: " + e + ' !important;\n                outline: none !important;\n                background-color: transparent !important;\n            }\n            \n            /* 文本类型输入框 - Flexbox 垂直居中（排除原生输入框）*/\n            input[type="text"]:not(#native-phone-input):not(#native-code-input), \n            input[type="number"]:not(#native-phone-input):not(#native-code-input), \n            input[type="tel"]:not(#native-phone-input):not(#native-code-input),\n            input[type="password"]:not(#native-phone-input):not(#native-code-input) {\n                display: flex !important;\n                align-items: center !important;\n                justify-content: flex-start !important;\n                box-sizing: border-box !important;\n                padding: 0 12px !important;\n                height: 100% !important;\n                line-height: 1 !important;\n                border: none !important;\n            }\n            \n            /* 移除浏览器默认样式 */\n            input:focus,\n            textarea:focus {\n                box-shadow: none !important;\n            }\n        ', t = document.createElement("style");
t.id = o;
t.type = "text/css";
t.appendChild(document.createTextNode(n));
document.head.appendChild(t);
} catch (e) {
console.error("注入全局样式失败:", e);
}
}, a = function(e, o, n, t, a, i) {
if (cc.sys.isBrowser) try {
var r = document.getElementById("GameCanvas") || document.querySelector("canvas");
if (!r) {
console.error("找不到 Canvas 元素");
return;
}
var c = r.getBoundingClientRect(), l = cc.winSize;
console.log("=== 创建原生输入框（v4 - 使用节点世界坐标）===");
console.log("Canvas 位置:", c.left, c.top);
console.log("Canvas 尺寸:", c.width, "x", c.height);
console.log("游戏分辨率:", l.width, "x", l.height);
var s = c.width / l.width, d = c.height / l.height;
console.log("缩放比例:", s.toFixed(3), d.toFixed(3));
var h = o.convertToWorldSpaceAR(cc.v2(0, 0)), u = n.convertToWorldSpaceAR(cc.v2(0, 0));
console.log("手机输入框世界坐标:", h.x.toFixed(1), h.y.toFixed(1));
console.log("验证码输入框世界坐标:", u.x.toFixed(1), u.y.toFixed(1));
var p = t, g = a, _ = i;
console.log("=== 输入框尺寸 ===");
console.log("手机输入框:", p, "x", g);
console.log("验证码输入框:", _, "x", g);
var f = function(e, o, n, t, a) {
var i = e.x + t, r = e.y + a, l = i * s, h = c.height - r * d, u = o * s, p = n * d;
return {
left: c.left + l - u / 2,
top: c.top + h - p / 2,
width: u,
height: p
};
}, m = f(h, p, g, 0, 0), C = f(u, _, g, 0, 0);
console.log("手机输入框屏幕位置:", m);
console.log("验证码输入框屏幕位置:", C);
m.left = Math.max(0, Math.min(c.width - m.width, m.left));
m.top = Math.max(0, Math.min(c.height - m.height, m.top));
C.left = Math.max(0, Math.min(c.width - C.width, C.left));
C.top = Math.max(0, Math.min(c.height - C.height, C.top));
console.log("边界检查后位置:");
console.log("  手机输入框:", m.left.toFixed(1), m.top.toFixed(1));
console.log("  验证码输入框:", C.left.toFixed(1), C.top.toFixed(1));
var v = document.getElementById("native-input-container");
v && v.remove();
var w = document.createElement("div");
w.id = "native-input-container";
w.style.cssText = [ "position: fixed", "top: 0", "left: 0", "width: 100%", "height: 100%", "pointer-events: none", "z-index: 99999" ].join("; ");
document.body.appendChild(w);
var y = document.createElement("input");
y.id = "native-phone-input";
y.type = "tel";
y.placeholder = "请输入手机号";
y.maxLength = 11;
y.setAttribute("autocomplete", "off");
y.setAttribute("autocapitalize", "off");
y.setAttribute("autocorrect", "off");
y.style.cssText = [ "position: absolute", "left: " + m.left + "px", "top: " + m.top + "px", "width: " + m.width + "px", "height: " + m.height + "px", "background: transparent", "border: none", "border-radius: 0", "font-size: 12px", "color: #333", "padding: 0 8px", "box-sizing: border-box", "outline: none", "pointer-events: auto", "z-index: 100000", "cursor: text", 'font-family: Arial, "Microsoft YaHei", sans-serif', "line-height: " + m.height + "px", "text-align: left" ].join("; ");
w.appendChild(y);
var b = document.createElement("input");
b.id = "native-code-input";
b.type = "text";
b.placeholder = "验证码";
b.maxLength = 6;
b.setAttribute("autocomplete", "off");
b.setAttribute("autocapitalize", "off");
b.setAttribute("autocorrect", "off");
b.style.cssText = [ "position: absolute", "left: " + C.left + "px", "top: " + C.top + "px", "width: " + C.width + "px", "height: " + C.height + "px", "background: transparent", "border: none", "border-radius: 0", "font-size: 12px", "color: #333", "padding: 0 8px", "box-sizing: border-box", "outline: none", "pointer-events: auto", "z-index: 100000", "cursor: text", 'font-family: Arial, "Microsoft YaHei", sans-serif', "line-height: " + C.height + "px", "text-align: left" ].join("; ");
w.appendChild(b);
y.addEventListener("focus", function() {
console.log("手机输入框获得焦点");
});
y.addEventListener("click", function() {
console.log("手机输入框被点击");
});
b.addEventListener("focus", function() {
console.log("验证码输入框获得焦点");
});
b.addEventListener("click", function() {
console.log("验证码输入框被点击");
});
console.log("原生输入框创建完成");
setTimeout(function() {
var e = document.getElementById("native-phone-input"), o = document.getElementById("native-code-input");
console.log("输入框检查:");
console.log("  手机输入框:", e ? "存在" : "不存在");
console.log("  验证码输入框:", o ? "存在" : "不存在");
if (e) {
var n = e.getBoundingClientRect();
console.log("  手机输入框位置:", n.left, n.top, n.width, "x", n.height);
}
}, 100);
} catch (e) {
console.error("创建原生输入框失败:", e);
}
}, i = function() {
if (cc.sys.isBrowser) try {
var e = document.getElementById("native-input-container");
if (e) {
e.remove();
console.log("原生输入框已移除");
}
} catch (e) {
console.error("移除原生输入框失败:", e);
}
}, r = function() {
if (cc.sys.isBrowser) try {
new MutationObserver(function(e) {
e.forEach(function(e) {
e.addedNodes.forEach(function(e) {
"INPUT" !== e.nodeName && "TEXTAREA" !== e.nodeName || n(e, "#000000");
e.querySelectorAll && e.querySelectorAll("input, textarea").forEach(function(e) {
n(e, "#000000");
});
});
});
}).observe(document.body, {
childList: !0,
subtree: !0
});
} catch (e) {
console.warn("启动Input监听器失败:", e);
}
};
cc.Class({
extends: cc.Component,
properties: {
wait_node: {
type: cc.Node,
default: null
},
user_agreement_prefabs: {
type: cc.Prefab,
default: null
},
phone_login_prefab: {
type: cc.Prefab,
default: null
}
},
onLoad: function() {
console.log("========================================");
console.log("loginScene onLoad 开始执行");
console.log("========================================");
try {
if (cc.view && cc.view.enableAutoFullScreen) {
cc.view.enableAutoFullScreen(!1);
console.log("loginScene: 已禁用自动全屏功能");
}
if (cc.screen && cc.screen.disableAutoFullScreen) {
cc.screen.disableAutoFullScreen();
console.log("loginScene: 已禁用 screen 自动全屏触摸监听器");
}
} catch (e) {
console.error("禁用自动全屏时出错:", e);
}
try {
r();
t("#000000");
} catch (e) {
console.error("初始化样式监听器时出错:", e);
}
this._isAgreementChecked = !1;
this._phoneLoginPopupShowing = !1;
try {
this._initWaitNode();
} catch (e) {
console.error("初始化等待节点时出错:", e);
}
try {
this._initCheckbox();
} catch (e) {
console.error("初始化复选框时出错:", e);
}
try {
this._initLoginButtons();
} catch (e) {
console.error("初始化登录按钮时出错:", e);
}
try {
this._initPhoneLoginPopup();
} catch (e) {
console.error("初始化手机登录弹窗时出错:", e);
}
try {
this._initUserAgreementLink();
} catch (e) {
console.error("初始化用户协议链接时出错:", e);
}
try {
this._preloadScenes();
} catch (e) {
console.error("预加载场景时出错:", e);
}
try {
this._checkAutoLogin();
} catch (e) {
console.error("检查自动登录时出错:", e);
}
if ("undefined" != typeof window.myglobal) {
this._initAndStart();
console.log("========================================");
console.log("loginScene onLoad 执行完成");
console.log("========================================");
} else {
console.error("myglobal 未定义，尝试等待...");
this._waitForMyglobal();
}
},
_checkAutoLogin: function() {
var e = window.myglobal;
if (e) if (e.wasForceLoggedOut()) this._showError(e.getForceLogoutReason()); else if (e.hasLocalSession()) {
var o = this;
e.verifyToken(function(n, t) {
if (n) {
o._showError("自动登录中...");
(e.socket && e.socket.loadReconnectInfo ? e.socket.loadReconnectInfo() : {
token: "",
playerId: "",
roomCode: ""
}).roomCode ? o.scheduleOnce(function() {
e.socket && e.socket.initSocket && e.socket.initSocket();
e.socket.onRoomRestored(function() {
cc.director.loadScene("gameScene");
});
var o = window.eventLister ? window.eventLister({}) : null;
o && o.on("connection_success", function() {
cc.director.loadScene("gameScene");
});
}, .5) : o.scheduleOnce(function() {
e.socket && e.socket.initSocket && e.socket.initSocket();
cc.director.loadScene("hallScene");
}, .5);
} else o._showError(t || "登录已过期，请重新登录");
});
}
},
_initWaitNode: function() {
if (this.wait_node) {
this._loadingImage = this.wait_node.getChildByName("loading_image");
var e = this.wait_node.getChildByName("lblcontent_Label");
e && (this._waitLabel = e.getComponent(cc.Label));
this.wait_node.active = !1;
}
},
_initCheckbox: function() {
var e = this, o = this.node.getChildByName("check_mark");
if (o) {
this._checkMarkNode = o;
var n = o.getChildByName("checkmark");
if (n) {
this._checkmarkIcon = n;
n.active = !0;
}
this._isAgreementChecked = !0;
var t = o.getComponent(cc.Button);
t && (t.enabled = !1);
o.off(cc.Node.EventType.TOUCH_END);
o.on(cc.Node.EventType.TOUCH_END, function() {
e._toggleCheckbox();
}, e);
} else console.error("check_mark 节点未找到");
},
_toggleCheckbox: function() {
this._isAgreementChecked = !this._isAgreementChecked;
this._checkmarkIcon && (this._checkmarkIcon.active = this._isAgreementChecked);
},
start: function() {
console.log("========================================");
console.log("loginScene start 方法执行");
console.log("========================================");
var e = this;
this.scheduleOnce(function() {
console.log(">>> 延迟检查按钮状态...");
var o = e.node.getChildByName("login_phone");
if (o) {
console.log(">>> login_phone 节点存在");
var n = null !== o.getComponent(cc.Button);
console.log(">>> 是否有 Button 组件:", n);
o.off(cc.Node.EventType.TOUCH_END);
o.on(cc.Node.EventType.TOUCH_END, function(o) {
console.log(">>> [start备用] 手机登录按钮 TOUCH_END 事件触发");
o.stopPropagation();
e._doPhoneLogin();
}, e);
console.log(">>> 已重新绑定手机登录按钮事件");
} else console.error(">>> login_phone 节点不存在！");
var t = e.node.getChildByName("login_wx");
if (t) {
console.log(">>> login_wx 节点存在");
t.off(cc.Node.EventType.TOUCH_END);
t.on(cc.Node.EventType.TOUCH_END, function() {
console.log(">>> [start备用] 微信登录按钮 TOUCH_END 事件触发");
e._doWxLogin();
}, e);
console.log(">>> 已重新绑定微信登录按钮事件");
}
}, .5);
},
_initLoginButtons: function() {
var e = this;
console.log("=== 初始化登录按钮 ===");
console.log("当前节点:", this.node ? this.node.name : "null");
var o = this.node.children;
console.log("子节点数量:", o.length);
for (var n = 0; n < o.length; n++) console.log("  子节点[" + n + "]:", o[n].name);
var t = this.node.getChildByName("login_wx");
console.log("wxLoginNode:", t ? "找到" : "未找到");
if (t) {
var a = t.getComponent(cc.Button);
console.log("wxLoginNode Button:", a ? "存在" : "不存在");
if (a) {
a.interactable = !0;
a.clickEvents = [];
(r = new cc.Component.EventHandler()).target = this.node;
r.component = "loginScene";
r.handler = "_onWxLoginClick";
r.customEventData = "";
a.clickEvents.push(r);
console.log("微信登录按钮初始化完成");
}
t.off(cc.Node.EventType.TOUCH_END);
t.on(cc.Node.EventType.TOUCH_END, function() {
console.log(">>> 微信登录按钮 TOUCH_END 事件触发");
e._doWxLogin();
}, e);
} else console.error("未找到 login_wx 节点！");
var i = this.node.getChildByName("login_phone");
console.log("phoneLoginNode:", i ? "找到" : "未找到");
if (i) {
a = i.getComponent(cc.Button);
console.log("phoneLoginNode Button:", a ? "存在" : "不存在");
if (a) {
a.interactable = !0;
a.clickEvents = [];
var r;
(r = new cc.Component.EventHandler()).target = this.node;
r.component = "loginScene";
r.handler = "_onPhoneLoginClick";
r.customEventData = "";
a.clickEvents.push(r);
console.log("手机登录按钮初始化完成");
}
i.off(cc.Node.EventType.TOUCH_END);
i.on(cc.Node.EventType.TOUCH_END, function(o) {
console.log(">>> 手机登录按钮 TOUCH_END 事件触发");
o.stopPropagation();
e._doPhoneLogin();
}, e);
} else console.error("未找到 login_phone 节点！");
console.log("=== 登录按钮初始化结束 ===");
},
_initUserAgreementLink: function() {
var e = this.node.getChildByName("user_agreement_link");
if (e) {
e.active = !0;
var o = e.getComponent(cc.Button);
if (o) {
o.interactable = !0;
o.clickEvents = [];
var n = new cc.Component.EventHandler();
n.target = this.node;
n.component = "loginScene";
n.handler = "_onUserAgreementLinkClick";
n.customEventData = "";
o.clickEvents.push(n);
}
}
},
_onWxLoginClick: function() {
console.log("=== 微信登录按钮被点击 ===");
this._doWxLogin();
},
_onPhoneLoginClick: function() {
console.log("=== 手机登录按钮被点击 ===");
this._doPhoneLogin();
},
_onUserAgreementLinkClick: function() {
this._showUserAgreementPopup();
},
_checkAgreement: function() {
return this._isAgreementChecked;
},
_preloadScenes: function() {
cc.director.preloadScene("hallScene", function(e) {
e && console.error("🚀 [预加载] 大厅场景预加载失败:", e);
});
cc.director.preloadScene("gameScene", function(e) {
e && console.error("🚀 [预加载] 游戏场景预加载失败:", e);
});
},
_waitForMyglobal: function() {
var e = this, o = 0;
setTimeout(function n() {
o++;
"undefined" != typeof window.myglobal ? e._initAndStart() : o < 20 ? setTimeout(n, 100) : e._showError("加载失败，请刷新页面重试");
}, 100);
},
_initAndStart: function() {
var e = window.myglobal;
if (e.socket || e.init()) {
if (e.socket && e.socket.loadReconnectInfo) {
var o = e.socket.loadReconnectInfo();
if (o.token && o.playerId) {
this._showLoading(!0, "正在恢复登录状态...");
e.socket.initSocket && e.socket.initSocket();
var n = this;
e.socket.onRoomRestored(function(o) {
n._showLoading(!1);
e.playerData.playerId = o.player_id;
e.playerData.nickName = o.player_name;
e.playerData.saveToLocal();
cc.director.loadScene("gameScene");
});
var t = window.eventLister ? window.eventLister({}) : null;
t && t.on("connection_success", function(o) {
n._showLoading(!1);
e.playerData.playerId = o.player_id;
e.playerData.nickName = o.player_name;
e.playerData.gobal_count = o.gold || 0;
e.playerData.saveToLocal();
cc.director.loadScene("hallScene");
});
return;
}
}
this._initBackgroundMusic();
e.socket && e.socket.initSocket && e.socket.initSocket();
} else this._showError("初始化失败，请刷新页面重试");
},
_initBackgroundMusic: function() {
var e = this;
if ("undefined" == typeof window.isopen_sound || window.isopen_sound) {
this._musicPlaying = !1;
this._touchListenerAdded = !1;
cc.resources.load("sound/login_bg", cc.AudioClip, function(o, n) {
if (cc.isValid(e.node)) if (o) e._setupGlobalTouchForMusic(); else {
e._bgMusicClip = n;
try {
cc.audioEngine.playMusic(n, !0);
e._musicPlaying = !0;
e._removeGlobalTouchForMusic();
} catch (o) {
e._setupGlobalTouchForMusic();
}
}
});
}
},
_playMusicOnTouch: function() {
var e = this;
if (cc.audioEngine.isMusicPlaying()) this._removeGlobalTouchForMusic(); else if (this._bgMusicClip) try {
cc.audioEngine.playMusic(this._bgMusicClip, !0);
this._musicPlaying = !0;
this._removeGlobalTouchForMusic();
} catch (e) {} else cc.resources.load("sound/login_bg", cc.AudioClip, function(o, n) {
if (cc.isValid(e.node) && !o) {
e._bgMusicClip = n;
try {
cc.audioEngine.playMusic(n, !0);
e._musicPlaying = !0;
e._removeGlobalTouchForMusic();
} catch (e) {}
}
});
},
_setupGlobalTouchForMusic: function() {
if (!this._touchListenerAdded) {
var e = this;
this._touchListenerAdded = !0;
this._cocosTouchHandler = function() {
e._playMusicOnTouch();
};
this.node.on(cc.Node.EventType.TOUCH_START, this._cocosTouchHandler, this);
if (cc.sys.isBrowser) {
this._browserTouchHandler = function() {
e._playMusicOnTouch();
};
document.addEventListener("touchstart", this._browserTouchHandler, !0);
document.addEventListener("mousedown", this._browserTouchHandler, !0);
document.addEventListener("click", this._browserTouchHandler, !0);
}
}
},
_removeGlobalTouchForMusic: function() {
if (this._cocosTouchHandler) {
this.node.off(cc.Node.EventType.TOUCH_START, this._cocosTouchHandler, this);
this._cocosTouchHandler = null;
}
if (cc.sys.isBrowser && this._browserTouchHandler) {
document.removeEventListener("touchstart", this._browserTouchHandler, !0);
document.removeEventListener("mousedown", this._browserTouchHandler, !0);
document.removeEventListener("click", this._browserTouchHandler, !0);
this._browserTouchHandler = null;
}
this._touchListenerAdded = !1;
},
_showError: function(e) {
this._showWaitNode(e);
this.scheduleOnce(function() {
this._hideWaitNode();
}, 2);
},
_showLoading: function(e, o) {
e ? this._showWaitNode(o || "正在处理...") : this._hideWaitNode();
},
_showWaitNode: function(e) {
if (this.wait_node) {
this.wait_node.active = !0;
this._waitLabel && (this._waitLabel.string = e || "正在处理...");
this._loadingImage && (this._isAnimating = !0);
}
},
_hideWaitNode: function() {
if (this.wait_node) {
this.wait_node.active = !1;
this._isAnimating = !1;
}
},
_drawInputBg: function(e, o, n, t) {
var a = -o / 2, i = -n / 2;
e.roundRect(a, i, o, n, t);
},
update: function(e) {
this._isAnimating && this._loadingImage && (this._loadingImage.angle += 45 * e);
},
_doWxLogin: function() {
var e = this;
if (this._checkAgreement()) {
var o = window.myglobal;
if (o && o.socket) {
this._showLoading(!0, "正在登录...");
o.socket.request_wxLogin({
uniqueID: o.playerData.uniqueID,
accountID: o.playerData.accountID,
nickName: o.playerData.nickName,
avatarUrl: o.playerData.avatarUrl
}, function(n, t) {
e._showLoading(!1);
if (0 == n) {
o.playerData.gobal_count = t.goldcount || 0;
cc.director.loadScene("hallScene");
} else e._showError("登录失败，请重试");
});
} else this._showError("网络未连接，请稍后重试");
} else this._showError("请先同意用户协议");
},
_doPhoneLogin: function() {
console.log(">>> _doPhoneLogin 被调用");
if (this._phoneLoginPopupShowing) console.log(">>> 登录弹窗正在显示中，忽略重复调用"); else if (this._checkAgreement()) {
this._phoneLoginPopupShowing = !0;
console.log(">>> 准备显示手机登录弹窗");
this._showPhoneLoginPopup();
} else {
console.log(">>> 用户未同意协议");
this._showError("请先同意用户协议");
}
},
_showPhoneLoginPopup: function() {
console.log(">>> _showPhoneLoginPopup 被调用");
this._createPhoneLoginPopup();
},
_createPhoneLoginPopup: function() {
console.log(">>> _createPhoneLoginPopup 被调用");
try {
var e = this._createPhoneLoginDynamic();
console.log(">>> 登录弹窗显示完成:", e ? e.name : "null");
this._phoneLoginPopup = e;
} catch (e) {
console.error("显示手机登录弹窗失败:", e);
this._showError("无法显示登录弹窗: " + e.message);
this._phoneLoginPopupShowing = !1;
}
},
_initPhoneLoginPopup: function() {
var e = this, o = this.node.getChildByName("login");
if (o) {
o.active = !1;
o.getComponent(cc.BlockInputEvents) || o.addComponent(cc.BlockInputEvents);
var n = o.getChildByName("login_bg") || o, t = o.getChildByName("closeBtn"), a = o.getChildByName("login_phone"), i = o.getChildByName("login_code"), r = o.getChildByName("get_mobile_code"), c = o.getChildByName("btn_mobile_login"), l = o.getChildByName("icon_wx"), s = o.getChildByName("tip"), d = a ? a.getComponent(cc.EditBox) : null, h = i ? i.getComponent(cc.EditBox) : null;
if (d) {
d.maxLength = 11;
d.inputMode = cc.EditBox.InputMode.PHONE_NUMBER;
}
if (h) {
h.maxLength = 6;
h.inputMode = cc.EditBox.InputMode.NUMERIC;
}
var u = r ? r.getComponent(cc.Button) : null, p = r ? r.getChildByName("btnlabel") : null, g = r ? r.getChildByName("countdownlabel") : null, _ = p ? p.getComponent(cc.Label) : null, f = g ? g.getComponent(cc.Label) : null, m = s ? s.getComponent(cc.Label) : null;
g && (g.active = !1);
s && (s.active = !1);
this._phoneLoginUI = {
popup: o,
panel: n,
closeBtn: t,
phoneInputNode: a,
codeInputNode: i,
phoneEditBox: d,
codeEditBox: h,
getCodeBtn: r,
getCodeBtnComp: u,
loginBtn: c,
wxBtn: l,
tipNode: s,
tipLabelComp: m,
btnLabelNode: p,
btnLabelComp: _,
countdownLabelNode: g,
countdownLabelComp: f,
countdown: 0
};
if (t) {
t.off(cc.Node.EventType.TOUCH_END);
t.on(cc.Node.EventType.TOUCH_END, function() {
e._closePhoneLoginPopup();
}, this);
}
if (r) {
r.off(cc.Node.EventType.TOUCH_END);
r.on(cc.Node.EventType.TOUCH_END, function() {
e._onPhoneLoginGetCode();
}, this);
}
if (c) {
c.off(cc.Node.EventType.TOUCH_END);
c.on(cc.Node.EventType.TOUCH_END, function() {
e._onPhoneLoginSubmit();
}, this);
}
if (l) {
l.off(cc.Node.EventType.TOUCH_END);
l.on(cc.Node.EventType.TOUCH_END, function() {
e._onPhoneLoginWx();
}, this);
}
} else console.error("login 弹窗节点未找到，请在 loginScene 中创建 login 节点");
},
_getPhoneLoginInputValue: function(e, o) {
if (cc.sys.isBrowser) {
var n = document.getElementById(e);
return n ? n.value : "";
}
return o && o.string || "";
},
_validatePhoneLoginPhone: function(e) {
return !(!e || 11 !== e.length) && /^1[3-9]\d{9}$/.test(e);
},
_showPhoneLoginTip: function(e, o) {
var n = this._phoneLoginUI;
if (n && n.tipNode && n.tipLabelComp) {
n.tipNode.active = !0;
n.tipLabelComp.string = e;
n.tipNode.color = o ? new cc.Color(255, 80, 80) : new cc.Color(100, 200, 100);
}
},
_resetPhoneLoginCountdownUI: function() {
var e = this._phoneLoginUI;
if (e) {
e.countdown = 0;
e.getCodeBtnComp && (e.getCodeBtnComp.interactable = !0);
e.getCodeBtn && (e.getCodeBtn.opacity = 255);
e.btnLabelNode && (e.btnLabelNode.active = !0);
if (e.countdownLabelNode) {
e.countdownLabelNode.active = !1;
e.countdownLabelComp && (e.countdownLabelComp.string = "");
}
}
},
_startPhoneLoginCountdown: function() {
var e = this, o = this._phoneLoginUI;
if (o) {
o.countdown = 60;
o.getCodeBtnComp && (o.getCodeBtnComp.interactable = !1);
o.getCodeBtn && (o.getCodeBtn.opacity = 150);
o.btnLabelNode && (o.btnLabelNode.active = !1);
o.countdownLabelNode && (o.countdownLabelNode.active = !0);
o.countdownLabelComp && (o.countdownLabelComp.string = o.countdown + "s");
e.scheduleOnce(function o() {
if (e._phoneLoginUI && cc.isValid(e._phoneLoginUI.popup)) {
var n = e._phoneLoginUI;
n.countdown--;
if (n.countdown <= 0) e._resetPhoneLoginCountdownUI(); else {
n.countdownLabelComp && (n.countdownLabelComp.string = n.countdown + "s");
e.scheduleOnce(o, 1);
}
}
}, 1);
}
},
_closePhoneLoginPopup: function() {
var e = this._phoneLoginUI;
if (e && e.popup && cc.isValid(e.popup)) {
this._phoneLoginPopupShowing = !1;
i();
var o = e.panel, n = e.popup;
e.phoneEditBox && (e.phoneEditBox.string = "");
e.codeEditBox && (e.codeEditBox.string = "");
e.tipNode && (e.tipNode.active = !1);
this._resetPhoneLoginCountdownUI();
cc.tween(o).to(.15, {
scale: .8,
opacity: 0
}, {
easing: "backIn"
}).call(function() {
if (cc.isValid(n)) {
n.active = !1;
o.scale = 1;
o.opacity = 255;
}
}).start();
} else this._phoneLoginPopupShowing = !1;
},
_onPhoneLoginGetCode: function() {
var e = this, o = this._phoneLoginUI;
if (o && !(o.countdown > 0)) {
var n = this._getPhoneLoginInputValue("native-phone-input", o.phoneEditBox);
if (this._validatePhoneLoginPhone(n)) {
var t = window.defines;
if (t && t.apiUrl) {
var a = window.HttpAPI;
if (a && t.cryptoKey) a.postEncrypted(t.apiUrl + "/api/v1/auth/send-code", "send_code", {
phone: n
}, t.cryptoKey, function(o, n) {
if (o) e._showPhoneLoginTip(o || "发送失败", !0); else if (n && 0 === n.code) {
e._showPhoneLoginTip("验证码已发送", !1);
e._startPhoneLoginCountdown();
} else e._showPhoneLoginTip(n.message || "发送失败", !0);
}); else {
var i = new XMLHttpRequest();
i.open("POST", t.apiUrl + "/api/v1/auth/send-code", !0);
i.setRequestHeader("Content-Type", "application/json");
i.timeout = 1e4;
i.onreadystatechange = function() {
if (4 === i.readyState) if (i.status >= 200 && i.status < 300) try {
var o = JSON.parse(i.responseText);
if (0 === o.code) {
e._showPhoneLoginTip("验证码已发送", !1);
e._startPhoneLoginCountdown();
} else e._showPhoneLoginTip(o.message || "发送失败", !0);
} catch (o) {
e._showPhoneLoginTip("解析响应失败", !0);
} else e._showPhoneLoginTip("网络请求失败", !0);
};
i.send(JSON.stringify({
phone: n
}));
}
} else {
this._showPhoneLoginTip("验证码已发送(测试)", !1);
this._startPhoneLoginCountdown();
}
} else this._showPhoneLoginTip("请输入正确的手机号", !0);
}
},
_onPhoneLoginSubmit: function() {
var e = this, o = this._phoneLoginUI;
if (o) {
var n = this._getPhoneLoginInputValue("native-phone-input", o.phoneEditBox), t = this._getPhoneLoginInputValue("native-code-input", o.codeEditBox);
if (this._validatePhoneLoginPhone(n)) {
this._showPhoneLoginTip("正在登录...", !1);
var a = window.defines;
if (a && a.apiUrl) {
var r = window.HttpAPI;
if (r && a.cryptoKey) r.postEncrypted(a.apiUrl + "/api/v1/auth/phone-login", "phone_login", {
phone: n,
code: t
}, a.cryptoKey, function(t, a) {
if (t) e._showPhoneLoginTip(t || "登录失败", !0); else if (a && 0 === a.code && a.data) {
e._showPhoneLoginTip("登录成功", !1);
window.myglobal && window.myglobal.onLoginSuccess({
uniqueID: a.data.uniqueID || "",
accountID: a.data.accountID || "",
nickName: a.data.nickName || "玩家",
avatarUrl: a.data.avatarUrl || "",
goldCount: a.data.goldcount || 0,
token: a.data.token || "",
phone: n,
loginType: 1
});
e.scheduleOnce(function() {
i();
cc.isValid(o.popup) && (o.popup.active = !1);
e._phoneLoginPopupShowing = !1;
cc.director.loadScene("hallScene");
}, .5);
} else e._showPhoneLoginTip(a.message || "登录失败", !0);
}); else {
var c = new XMLHttpRequest();
c.open("POST", a.apiUrl + "/api/v1/auth/phone-login", !0);
c.setRequestHeader("Content-Type", "application/json");
c.setRequestHeader("X-Device-ID", "web_" + Date.now());
c.setRequestHeader("X-Device-Type", "Web Browser");
c.timeout = 1e4;
c.onreadystatechange = function() {
if (4 === c.readyState) if (c.status >= 200 && c.status < 300) try {
var t = JSON.parse(c.responseText);
if (0 === t.code && t.data) {
e._showPhoneLoginTip("登录成功", !1);
window.myglobal && window.myglobal.onLoginSuccess({
uniqueID: t.data.uniqueID || t.data.player_id || "",
accountID: t.data.accountID || t.data.account_id || "",
nickName: t.data.nickName || t.data.nickname || "玩家",
avatarUrl: t.data.avatarUrl || t.data.avatar || "",
goldCount: t.data.goldcount || t.data.gold || 0,
token: t.data.token || "",
phone: n,
loginType: 1
});
e.scheduleOnce(function() {
i();
cc.isValid(o.popup) && (o.popup.active = !1);
e._phoneLoginPopupShowing = !1;
cc.director.loadScene("hallScene");
}, .5);
} else e._showPhoneLoginTip(t.message || "登录失败", !0);
} catch (o) {
e._showPhoneLoginTip("解析响应失败", !0);
} else e._showPhoneLoginTip("网络请求失败", !0);
};
c.send(JSON.stringify({
phone: n,
code: t
}));
}
} else {
window.myglobal && window.myglobal.onLoginSuccess({
uniqueID: "phone_" + n,
accountID: "phone_" + n,
nickName: "玩家" + n.substr(-4),
avatarUrl: "",
goldCount: 1e3,
token: "test_token_" + Date.now(),
phone: n,
loginType: 1
});
this._showPhoneLoginTip("登录成功", !1);
this.scheduleOnce(function() {
i();
cc.isValid(o.popup) && (o.popup.active = !1);
e._phoneLoginPopupShowing = !1;
cc.director.loadScene("hallScene");
}, .5);
}
} else this._showPhoneLoginTip("请输入正确的手机号", !0);
}
},
_onPhoneLoginWx: function() {
var e = this, o = this._phoneLoginUI;
if (o) {
this._showPhoneLoginTip("正在登录...", !1);
var n = window.defines;
if (n && n.apiUrl) {
var t = window.HttpAPI;
if (t && n.cryptoKey) t.postEncrypted(n.apiUrl + "/api/v1/auth/wx-login", "wx_login", {
code: "test_code_" + Date.now()
}, n.cryptoKey, function(n, t) {
if (n) e._showPhoneLoginTip(n || "登录失败", !0); else if (t && 0 === t.code && t.data) {
e._showPhoneLoginTip("登录成功", !1);
if (window.myglobal && window.myglobal.playerData) {
window.myglobal.playerData.uniqueID = t.data.uniqueID || "";
window.myglobal.playerData.accountID = t.data.accountID || "";
window.myglobal.playerData.nickName = t.data.nickName || "微信用户";
window.myglobal.playerData.userName = t.data.username || "";
window.myglobal.playerData.avatar = t.data.avatarUrl || "";
window.myglobal.playerData.gobal_count = t.data.goldCount || 0;
window.myglobal.playerData.token = t.data.token || "";
window.myglobal.playerData.saveToLocal();
}
window.myglobal && window.myglobal.socket && window.myglobal.socket.initSocket && window.myglobal.socket.initSocket();
e.scheduleOnce(function() {
i();
cc.isValid(o.popup) && (o.popup.active = !1);
e._phoneLoginPopupShowing = !1;
cc.director.loadScene("hallScene");
}, .5);
} else e._showPhoneLoginTip(t.message || "登录失败", !0);
}); else {
var a = new XMLHttpRequest();
a.open("POST", n.apiUrl + "/api/v1/auth/wx-login", !0);
a.setRequestHeader("Content-Type", "application/json");
a.timeout = 1e4;
a.onreadystatechange = function() {
if (4 === a.readyState) if (a.status >= 200 && a.status < 300) try {
var n = JSON.parse(a.responseText);
if (0 === n.code && n.data) {
e._showPhoneLoginTip("登录成功", !1);
if (window.myglobal && window.myglobal.playerData) {
window.myglobal.playerData.uniqueID = n.data.player_id || "";
window.myglobal.playerData.accountID = n.data.account_id || "";
window.myglobal.playerData.nickName = n.data.nickname || "微信用户";
window.myglobal.playerData.userName = n.data.username || "";
window.myglobal.playerData.avatar = n.data.avatar || "";
window.myglobal.playerData.gobal_count = n.data.gold || 0;
window.myglobal.playerData.token = n.data.token || "";
window.myglobal.playerData.saveToLocal();
}
window.myglobal && window.myglobal.socket && window.myglobal.socket.initSocket && window.myglobal.socket.initSocket();
e.scheduleOnce(function() {
i();
cc.isValid(o.popup) && (o.popup.active = !1);
e._phoneLoginPopupShowing = !1;
cc.director.loadScene("hallScene");
}, .5);
} else e._showPhoneLoginTip(n.message || "登录失败", !0);
} catch (o) {
e._showPhoneLoginTip("解析响应失败", !0);
} else e._showPhoneLoginTip("网络请求失败", !0);
};
a.send(JSON.stringify({
code: "test_code_" + Date.now()
}));
}
} else {
window.myglobal && window.myglobal.onLoginSuccess({
uniqueID: "wx_" + Date.now(),
accountID: "wx_" + Date.now(),
nickName: "微信用户",
avatarUrl: "",
goldCount: 1e3,
token: "test_wx_token_" + Date.now(),
loginType: 2
});
this._showPhoneLoginTip("登录成功", !1);
this.scheduleOnce(function() {
i();
cc.isValid(o.popup) && (o.popup.active = !1);
e._phoneLoginPopupShowing = !1;
cc.director.loadScene("hallScene");
}, .5);
}
}
},
_createPhoneLoginDynamic: function() {
this._phoneLoginUI || this._initPhoneLoginPopup();
var e = this._phoneLoginUI;
if (!e || !e.popup) throw new Error("login 弹窗未初始化");
var o = e.popup, n = e.panel, t = e.phoneInputNode, r = e.codeInputNode;
i();
e.phoneEditBox && (e.phoneEditBox.string = "");
e.codeEditBox && (e.codeEditBox.string = "");
e.tipNode && (e.tipNode.active = !1);
this._resetPhoneLoginCountdownUI();
n.width, n.height;
var c = t ? t.width : 220, l = t ? t.height : 45, s = r ? r.width : 120;
o.active = !0;
o.zIndex = 1e3;
n.scale = .7;
n.opacity = 0;
cc.tween(n).to(.25, {
scale: 1,
opacity: 255
}, {
easing: "backOut"
}).call(function() {
if (cc.isValid(o)) {
if (cc.sys.isBrowser && t && r) a(0, t, r, c, l, s); else if (e.phoneEditBox && e.codeEditBox) {
e.phoneEditBox.stayOnTop = !0;
e.codeEditBox.stayOnTop = !0;
}
console.log("手机登录弹窗输入框就绪");
}
}).start();
return o;
},
_showUserAgreementPopup: function() {
this._createAgreementPopup();
},
_createAgreementPopup: function() {
var e = new cc.Node("user_agreement_popup");
e.parent = this.node;
e.setContentSize(cc.size(1280, 720));
e.setPosition(0, 0);
e.zIndex = 1e3;
var o = new cc.Node("bg_mask");
o.parent = e;
o.setContentSize(cc.size(1280, 720));
o.setPosition(0, 0);
o.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
o.color = new cc.Color(0, 0, 0);
o.opacity = 180;
var n = new cc.Node("content_panel");
n.parent = e;
n.setContentSize(cc.size(900, 520));
n.setPosition(0, 0);
var t = n.addComponent(cc.Sprite);
t.sizeMode = cc.Sprite.SizeMode.CUSTOM;
n.color = new cc.Color(255, 250, 240);
cc.resources.load("images/user_agreement_bg", cc.SpriteFrame, function(e, o) {
cc.isValid(n) && !e && o && (t.spriteFrame = o);
});
var a = new cc.Node("title_label");
a.parent = n;
a.setContentSize(cc.size(300, 60));
a.setPosition(0, 230);
var i = a.addComponent(cc.Label);
i.string = "用户协议";
i.fontSize = 36;
i.lineHeight = 60;
i.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
a.color = new cc.Color(30, 30, 30);
var r = new cc.Node("close_btn");
r.parent = n;
r.setContentSize(cc.size(60, 60));
r.setPosition(400, 230);
var c = new cc.Node("bg");
c.parent = r;
c.setContentSize(cc.size(50, 50));
c.setPosition(0, 0);
c.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
c.color = new cc.Color(255, 255, 255);
var l = new cc.Node("x");
l.parent = r;
l.setPosition(0, 0);
var s = l.addComponent(cc.Label);
s.string = "×";
s.fontSize = 40;
s.lineHeight = 50;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
l.color = new cc.Color(80, 80, 80);
var d = r.addComponent(cc.Button);
d.transition = cc.Button.Transition.SCALE;
d.zoomScale = 1.2;
d.interactable = !0;
var h = new cc.Component.EventHandler();
h.target = this.node;
h.component = "loginScene";
h.handler = "_closeUserAgreementPopup";
h.customEventData = "";
d.clickEvents.push(h);
var u = new cc.Node("divider");
u.parent = n;
u.setContentSize(cc.size(850, 1));
u.setPosition(0, 195);
u.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
u.color = new cc.Color(220, 220, 220);
var p = new cc.Node("scroll_view");
p.parent = n;
p.setContentSize(cc.size(820, 380));
p.setPosition(0, 0);
var g = p.addComponent(cc.ScrollView);
g.horizontal = !1;
g.vertical = !0;
g.inertia = !0;
g.elastic = !0;
var _ = new cc.Node("view");
_.parent = p;
_.setContentSize(cc.size(820, 380));
_.setPosition(0, 0);
_.addComponent(cc.Mask).type = cc.Mask.Type.RECT;
var f = new cc.Node("content");
f.parent = _;
f.anchorX = .5;
f.anchorY = 1;
f.setPosition(0, 190);
f.setContentSize(cc.size(820, 800));
g.content = f;
var m = new cc.Node("rich_text");
m.parent = f;
m.anchorX = 0;
m.anchorY = 1;
m.setPosition(-385, -15);
var C = m.addComponent(cc.RichText);
C.fontSize = 16;
C.lineHeight = 26;
C.maxWidth = 760;
C.string = "<b><color=#000000>用户协议</color></b>\n\n<color=#000000>欢迎使用本游戏！在使用前，请仔细阅读以下协议：</color>\n\n<b><color=#000000>一、服务条款</color></b>\n<color=#000000>1. 用户应遵守国家法律法规，文明游戏。</color>\n<color=#000000>2. 禁止使用外挂、作弊软件等破坏游戏公平性的行为。</color>\n<color=#000000>3. 用户账号安全由用户自行负责，请妥善保管账号密码。</color>\n\n<b><color=#000000>二、隐私政策</color></b>\n<color=#000000>1. 我们会收集必要的用户信息用于提供服务。</color>\n<color=#000000>2. 我们承诺保护用户隐私，不会向第三方泄露用户信息。</color>\n<color=#000000>3. 用户有权要求删除个人数据。</color>\n\n<b><color=#000000>三、免责声明</color></b>\n<color=#000000>1. 因不可抗力导致的服务中断，我们不承担责任。</color>\n<color=#000000>2. 用户因违规操作造成的损失，由用户自行承担。</color>\n\n<color=#000000>如有疑问，请联系客服。</color>";
g.scrollToTop(0);
this._userAgreementPopup = e;
},
_closeUserAgreementPopup: function() {
if (this._userAgreementPopup) {
this._userAgreementPopup.destroy();
this._userAgreementPopup = null;
}
},
onDestroy: function() {
this._removeGlobalTouchForMusic();
}
});
cc._RF.pop();
}, {} ],
phone_login: [ function(e, o) {
"use strict";
cc._RF.push(o, "d8d26bcwexC2ICpbya9WK0B", "phone_login");
cc.Class({
extends: cc.Component,
properties: {
phone_input: {
type: cc.EditBox,
default: null
},
code_input: {
type: cc.EditBox,
default: null
},
send_code_btn: {
type: cc.Button,
default: null
},
login_btn: {
type: cc.Button,
default: null
},
close_btn: {
type: cc.Button,
default: null
},
wx_login_btn: {
type: cc.Sprite,
default: null
},
send_code_label: {
type: cc.Label,
default: null
},
message_label: {
type: cc.Label,
default: null
},
countdown_time: 60,
BASE_WIDTH: 400,
BASE_HEIGHT: 520
},
onLoad: function() {
this._countdown = 0;
this._phone = "";
this._code = "";
this.adaptDialog();
var e = this;
cc.view.setResizeCallback(function() {
e.adaptDialog();
});
this._initPanelAnimation();
this._drawInputBorders();
this._initEditBoxes();
this._initButtons();
this._initWechatButton();
this._hideMessage();
this.phone_input && (this._phone = this.phone_input.string || "");
this.code_input && (this._code = this.code_input.string || "");
},
_initEditBoxes: function() {
var e = this;
if (this.phone_input) {
this.phone_input.stayOnTop = !0;
this.phone_input.fontSize = 20;
this.phone_input.lineHeight = 40;
this.phone_input.fontColor = new cc.Color(50, 50, 50, 255);
this.phone_input.placeholderFontColor = new cc.Color(150, 150, 150, 255);
this.phone_input.node.on("editing-did-began", function() {
e._onPhoneInputFocus();
}, this);
this.phone_input.node.on("editing-did-ended", function() {
e._onPhoneInputBlur();
}, this);
this.phone_input.node.on("text-changed", function(o) {
e._phone = o.string;
}, this);
}
if (this.code_input) {
this.code_input.stayOnTop = !0;
this.code_input.fontSize = 20;
this.code_input.lineHeight = 40;
this.code_input.fontColor = new cc.Color(50, 50, 50, 255);
this.code_input.placeholderFontColor = new cc.Color(150, 150, 150, 255);
this.code_input.node.on("editing-did-began", function() {
e._onCodeInputFocus();
}, this);
this.code_input.node.on("editing-did-ended", function() {
e._onCodeInputBlur();
}, this);
this.code_input.node.on("text-changed", function(o) {
e._code = o.string;
}, this);
}
},
_onPhoneInputFocus: function() {},
_onPhoneInputBlur: function() {
this.phone_input && this.phone_input.string && (this._phone = this.phone_input.string);
},
_onCodeInputFocus: function() {},
_onCodeInputBlur: function() {
this.code_input && this.code_input.string && (this._code = this.code_input.string);
},
adaptDialog: function() {
var e = this.node.getChildByName("content_panel");
if (e) {
var o = cc.winSize.width, n = cc.winSize.height, t = .6 * o, a = (t = Math.max(300, Math.min(t, .8 * o))) / this.BASE_WIDTH, i = .8 * n / this.BASE_HEIGHT;
a = Math.min(a, i);
a = Math.max(.7, Math.min(a, 1.3));
e.scale = a;
console.log("【登录弹窗】屏幕:", o, "x", n, "目标宽度:", Math.round(t), "缩放:", a.toFixed(2), "实际尺寸:", Math.round(this.BASE_WIDTH * a), "x", Math.round(this.BASE_HEIGHT * a));
}
},
_initPanelAnimation: function() {
var e = this.node.getChildByName("content_panel");
if (e) {
var o = e.scale;
e.scale = .7 * o;
e.opacity = 0;
cc.tween(e).to(.25, {
scale: o,
opacity: 255
}, {
easing: "backOut"
}).start();
}
},
_drawInputBorders: function() {
var e = this.node.getChildByName("content_panel");
if (e) {
var o = e.getChildByName("phone_bg");
if (o) {
if (c = o.getComponent(cc.Graphics)) {
c.clear();
c.fillColor = new cc.Color(255, 252, 240, 230);
this._drawRoundRect(c, -160, -25, 320, 50, 14);
c.fill();
c.strokeColor = new cc.Color(218, 165, 32, 255);
c.lineWidth = 2;
this._drawRoundRect(c, -160, -25, 320, 50, 14);
c.stroke();
}
var n = o.getChildByName("phone_input");
if (n) {
n.zIndex = 10;
o.zIndex = 5;
}
}
var t = e.getChildByName("code_row");
if (t) {
var a = t.getChildByName("code_bg");
if (a) {
if (c = a.getComponent(cc.Graphics)) {
c.clear();
c.fillColor = new cc.Color(255, 252, 240, 230);
this._drawRoundRect(c, -95, -25, 190, 50, 14);
c.fill();
c.strokeColor = new cc.Color(218, 165, 32, 255);
c.lineWidth = 2;
this._drawRoundRect(c, -95, -25, 190, 50, 14);
c.stroke();
}
var i = a.getChildByName("code_input");
if (i) {
i.zIndex = 10;
a.zIndex = 5;
}
}
}
var r = e.getChildByName("divider");
if (r) {
var c;
if (c = r.getComponent(cc.Graphics)) {
c.clear();
c.strokeColor = new cc.Color(200, 180, 140, 180);
c.lineWidth = 1;
c.moveTo(-170, 0);
c.lineTo(170, 0);
c.stroke();
}
}
}
},
_drawRoundRect: function(e, o, n, t, a, i) {
e.moveTo(o + i, n);
e.lineTo(o + t - i, n);
e.arcTo(o + t, n, o + t, n + i, i);
e.lineTo(o + t, n + a - i);
e.arcTo(o + t, n + a, o + t - i, n + a, i);
e.lineTo(o + i, n + a);
e.arcTo(o, n + a, o, n + a - i, i);
e.lineTo(o, n + i);
e.arcTo(o, n, o + i, n, i);
},
_initWechatButton: function() {
var e = this.node.getChildByName("content_panel");
if (e) {
var o = e.getChildByName("wx_login_container");
if (o) {
var n = o.getChildByName("wx_login_btn");
if (n) {
n.on(cc.Node.EventType.TOUCH_START, function() {
n.scale = .95;
}, this);
n.on(cc.Node.EventType.TOUCH_END, function() {
n.scale = 1;
this._onWechatLoginClick();
}, this);
n.on(cc.Node.EventType.TOUCH_CANCEL, function() {
n.scale = 1;
}, this);
this._createWechatLabel(o);
}
}
}
},
_createWechatLabel: function(e) {
if (!e.getChildByName("wx_login_label")) {
var o = new cc.Node("wx_login_label");
o.parent = e;
o.y = -35;
var n = o.addComponent(cc.Label);
n.string = "微信登录";
n.fontSize = 18;
n.lineHeight = 22;
n.fontFamily = "Arial";
n.fontColor = new cc.Color(120, 100, 80, 255);
n.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
}
},
_initButtons: function() {
var e = this;
if (this.close_btn) {
this.close_btn.node.off(cc.Node.EventType.TOUCH_END);
this.close_btn.node.on(cc.Node.EventType.TOUCH_END, function() {
e._onCloseClick();
}, this);
}
if (this.send_code_btn) {
this.send_code_btn.node.off(cc.Node.EventType.TOUCH_END);
this.send_code_btn.node.on(cc.Node.EventType.TOUCH_END, function() {
e._onSendCodeClick();
}, this);
}
if (this.login_btn) {
this.login_btn.node.off(cc.Node.EventType.TOUCH_END);
this.login_btn.node.on(cc.Node.EventType.TOUCH_END, function() {
e._onLoginClick();
}, this);
}
},
_onWechatLoginClick: function() {
console.log("【微信登录】点击微信登录按钮");
window.myglobal && window.myglobal.wechatLogin ? window.myglobal.wechatLogin() : this._showMessage("微信登录功能暂未开放", !0);
},
onPhoneInputChanged: function(e) {
this._phone = e.string;
},
onCodeInputChanged: function(e) {
this._code = e.string;
},
_onSendCodeClick: function() {
var e = this;
if (!(this._countdown > 0)) {
this.phone_input && (this._phone = this.phone_input.string || "");
if (this._validatePhone(this._phone)) {
this._showMessage("正在发送...", !1);
this._setInteractable(!1);
this._sendCodeRequest(this._phone, function(o, n) {
e._setInteractable(!0);
if (o) {
e._startCountdown();
e._showMessage("验证码已发送", !1);
} else e._showMessage(n || "发送失败，请重试", !0);
});
} else this._showMessage("请输入正确的手机号", !0);
}
},
_onLoginClick: function() {
var e = this;
this.phone_input && (this._phone = this.phone_input.string || "");
this.code_input && (this._code = this.code_input.string || "");
if (this._validatePhone(this._phone)) if (this._validateCode(this._code)) {
this._showMessage("正在登录...", !1);
this._setInteractable(!1);
this._phoneLoginRequest(this._phone, this._code, function(o, n, t) {
e._setInteractable(!0);
if (o) {
e._showMessage("登录成功", !1);
if (window.myglobal && window.myglobal.playerData && t) {
window.myglobal.playerData.uniqueID = t.uniqueID || "";
window.myglobal.playerData.accountID = t.accountID || "";
window.myglobal.playerData.nickName = t.nickName || "玩家";
window.myglobal.playerData.avatarUrl = t.avatarUrl || "";
window.myglobal.playerData.gobal_count = t.goldcount || 0;
window.myglobal.playerData.token = t.token || "";
window.myglobal.playerData.saveToLocal();
console.log("【手机登录】用户数据已保存, nickName =", window.myglobal.playerData.nickName);
if (window.myglobal.socket && window.myglobal.socket.reconnectWithToken) {
console.log("🔄 【手机登录】重新建立带Token的WebSocket连接...");
window.myglobal.socket.reconnectWithToken();
}
}
e.scheduleOnce(function() {
e._onCloseClick();
cc.director.loadScene("hallScene");
}, .5);
} else e._showMessage(n || "登录失败，请重试", !0);
});
} else this._showMessage("请输入验证码", !0); else this._showMessage("请输入正确的手机号", !0);
},
_onCloseClick: function() {
if (this.node && this.node.isValid) {
this._countdown > 0 && this.unschedule(this._countdownTick);
this.node.destroy();
}
},
_validatePhone: function(e) {
return !(!e || 11 !== e.length) && /^1[3-9]\d{9}$/.test(e);
},
_validateCode: function(e) {
return e && e.length > 0;
},
_startCountdown: function() {
this._countdown = this.countdown_time;
this._updateCountdownLabel();
this.schedule(this._countdownTick, 1);
},
_countdownTick: function() {
this._countdown--;
if (this._countdown <= 0) {
this.unschedule(this._countdownTick);
this._resetSendCodeBtn();
} else this._updateCountdownLabel();
},
_updateCountdownLabel: function() {
this.send_code_label && (this.send_code_label.string = this._countdown + "秒后重试");
this.send_code_btn && (this.send_code_btn.interactable = !1);
},
_resetSendCodeBtn: function() {
this.send_code_label && (this.send_code_label.string = "获取验证码");
this.send_code_btn && (this.send_code_btn.interactable = !0);
},
_showMessage: function(e, o) {
if (this.message_label) {
this.message_label.node.active = !0;
this.message_label.string = e;
this.message_label.node.color = o ? new cc.Color(255, 100, 100) : new cc.Color(100, 200, 100);
} else console.log(o ? "[错误]" : "[信息]", e);
},
_hideMessage: function() {
this.message_label && (this.message_label.node.active = !1);
},
_setInteractable: function(e) {
this.login_btn && (this.login_btn.interactable = e);
this.send_code_btn && this._countdown <= 0 && (this.send_code_btn.interactable = e);
},
_sendCodeRequest: function(e, o) {
var n = window.defines;
if (n && n.apiUrl) {
var t = n.apiUrl + "/api/v1/auth/send-code", a = n.cryptoKey || "";
if (window.HttpAPI && window.HttpAPI.postEncrypted) window.HttpAPI.postEncrypted(t, "send_code", {
phone: e
}, a, function(e, n) {
if (e) {
console.error("发送验证码失败:", e);
o(!1, e);
} else if (n && 0 === n.code) {
var t = "验证码已发送";
n.data && n.data.code && (t = "验证码: " + n.data.code);
o(!0, t);
} else o(!1, n ? n.message : "发送失败");
}); else {
console.warn("HttpAPI未加载，使用原始请求");
var i = new XMLHttpRequest();
i.open("POST", t, !0);
i.setRequestHeader("Content-Type", "application/json");
i.timeout = 1e4;
i.onreadystatechange = function() {
if (4 === i.readyState) if (i.status >= 200 && i.status < 300) try {
var e = JSON.parse(i.responseText);
e.data && e.timestamp && "string" == typeof e.data ? o(!1, "服务器返回加密数据，请刷新页面重试") : 0 === e.code ? o(!0, "验证码已发送") : o(!1, e.message || "发送失败");
} catch (e) {
o(!1, "解析响应失败");
} else o(!1, "网络请求失败");
};
i.ontimeout = function() {
o(!1, "请求超时");
};
i.onerror = function() {
o(!1, "网络错误");
};
i.send(JSON.stringify({
phone: e
}));
}
} else o(!0, "发送成功");
},
_phoneLoginRequest: function(e, o, n) {
var t = window.defines;
if (t && t.apiUrl) {
var a = t.apiUrl + "/api/v1/auth/phone-login", i = t.cryptoKey || "", r = {
phone: e,
code: o
};
if (window.HttpAPI && window.HttpAPI.postEncrypted) window.HttpAPI.postEncrypted(a, "phone_login", r, i, function(e, o) {
if (e) {
console.error("登录请求失败:", e);
n(!1, e, null);
} else o && 0 === o.code && o.data ? n(!0, "登录成功", o.data) : n(!1, o ? o.message : "登录失败", null);
}); else {
console.warn("HttpAPI未加载，使用原始请求");
var c = new XMLHttpRequest();
c.open("POST", a, !0);
c.setRequestHeader("Content-Type", "application/json");
c.setRequestHeader("X-Device-ID", this._getDeviceID());
c.setRequestHeader("X-Device-Type", this._getDeviceType());
c.timeout = 1e4;
c.onreadystatechange = function() {
if (4 === c.readyState) if (c.status >= 200 && c.status < 300) try {
var e = JSON.parse(c.responseText);
e.data && e.timestamp && "string" == typeof e.data ? window.HttpAPI && window.HttpAPI.decryptAESGCM ? window.HttpAPI.decryptAESGCM(e.data, i).then(function(e) {
e && 0 === e.code && e.data ? n(!0, "登录成功", e.data) : n(!1, e ? e.message : "登录失败", null);
}).catch(function(e) {
console.error("解密失败:", e);
n(!1, "解密响应失败", null);
}) : n(!1, "服务器返回加密数据，请刷新页面重试", null) : 0 === e.code && e.data ? n(!0, "登录成功", e.data) : n(!1, e.message || "登录失败", null);
} catch (e) {
console.error("解析响应失败:", e);
n(!1, "解析响应失败", null);
} else n(!1, "网络请求失败: HTTP " + c.status, null);
};
c.ontimeout = function() {
n(!1, "请求超时", null);
};
c.onerror = function() {
n(!1, "网络错误", null);
};
c.send(JSON.stringify(r));
}
} else n(!0, "登录成功", {
uniqueID: "phone_" + e,
accountID: "phone_" + e,
nickName: "玩家" + e.substr(-4),
avatarUrl: "",
goldcount: 1e3,
token: "mock_token_" + Date.now()
});
},
_getDeviceID: function() {
var e = "";
try {
e = cc.sys.localStorage.getItem("ddz_device_id");
} catch (e) {}
if (!e) {
e = this._generateUUID();
try {
cc.sys.localStorage.setItem("ddz_device_id", e);
} catch (e) {}
}
return e;
},
_getDeviceType: function() {
var e = cc.sys.platform, o = cc.sys.os, n = "Unknown";
e === cc.sys.WECHAT_GAME ? n = "WeChat" : e === cc.sys.ANDROID ? n = "Android" : e === cc.sys.IPHONE ? n = "iPhone" : e === cc.sys.IPAD ? n = "iPad" : e === cc.sys.MAC_OS ? n = "Mac" : e === cc.sys.WINDOWS ? n = "Windows" : e === cc.sys.LINUX ? n = "Linux" : e === cc.sys.MOBILE_BROWSER ? n = o === cc.sys.OS_IOS ? "iOS Browser" : o === cc.sys.OS_ANDROID ? "Android Browser" : "Mobile Browser" : e === cc.sys.DESKTOP_BROWSER && (n = o === cc.sys.OS_WINDOWS ? "Windows Browser" : o === cc.sys.OS_OSX ? "Mac Browser" : o === cc.sys.OS_LINUX ? "Linux Browser" : "Desktop Browser");
var t = cc.sys.browserType;
t && (n += " (" + t + ")");
return n;
},
_generateUUID: function() {
var e = new Date().getTime();
return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(o) {
var n = (e + 16 * Math.random()) % 16 | 0;
e = Math.floor(e / 16);
return ("x" === o ? n : 3 & n | 8).toString(16);
});
}
});
cc._RF.pop();
}, {} ],
player_node: [ function(e, o) {
"use strict";
cc._RF.push(o, "a2125ra91BLLoSvnFm+7Qba", "player_node");
var n = window.qian_state || {
buqiang: 0,
qian: 1
};
window.isopen_sound;
cc.Class({
extends: cc.Component,
properties: {
account_label: cc.Label,
nickname_label: cc.Label,
room_touxiang: cc.Sprite,
globalcount_label: cc.Label,
room_money_frame: cc.Node,
headimage: cc.Sprite,
readyimage: cc.Node,
offlineimage: cc.Node,
trusteeimage: cc.Node,
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
onLoad: function() {
this.readyimage.active = !1;
this.offlineimage.active = !1;
this.trusteeimage && (this.trusteeimage.active = !1);
this.masterIcon && (this.masterIcon.active = !1);
this.currentCardCount = 17;
this.cardlist_node = [];
this.node.on("gamestart_event", function() {
this.readyimage.active = !1;
this.masterIcon && (this.masterIcon.active = !1);
this.robIcon_Sp && (this.robIcon_Sp.active = !1);
this.robnoIcon_Sp && (this.robnoIcon_Sp.active = !1);
if (this.card_node) {
this.card_node.active = !1;
this.card_node.removeAllChildren(!0);
}
this.cardlist_node = [];
this.currentCardCount = 17;
}.bind(this));
this.node.on("push_card_event", function() {
var e = window.myglobal;
if (e) {
var o = this._getMyPlayerId(e), n = String(this.accountid || "");
o === n && "" !== n || this.showCardBacks(17);
} else console.error("🃏 [player_node] push_card_event: myglobal 不存在！");
}.bind(this));
this.node.on("playernode_rob_state_event", function(e) {
var o = e;
o.accountid == this.accountid && (this.qiangdidzhu_node.active = !1);
if (this.accountid == o.accountid) {
o.round;
o.state == n.qian || !0 === o.state ? this.robIcon_Sp.active = !0 : this.robnoIcon_Sp.active = !0;
}
}.bind(this));
this.node.on("clear_rob_state_event", function() {
console.log("🔄 [player_node] 清理抢地主/不抢图标, accountid:", this.accountid);
this.robIcon_Sp && (this.robIcon_Sp.active = !1);
this.robnoIcon_Sp && (this.robnoIcon_Sp.active = !1);
this.qiangdidzhu_node && (this.qiangdidzhu_node.active = !1);
}.bind(this));
this.node.on("playernode_changemaster_event", function(e) {
var o = e;
this.robIcon_Sp.active = !1;
this.robnoIcon_Sp.active = !1;
if (o == this.accountid) {
this.masterIcon.active = !0;
this.currentCardCount = 20;
this.showCardBacks(20);
}
}.bind(this));
this.node.on("update_card_count_event", function(e) {
if (e.accountid == this.accountid) {
this.currentCardCount = e.count;
this.showCardBacks(e.count);
}
}.bind(this));
this.node.on("player_state_update", function(e) {
this._updatePlayerState(e);
}.bind(this));
this.node.on("trustee_state_update", function(e) {
this._updateTrusteeState(e);
}.bind(this));
this.node.on("update_countdown_event", function(e) {
0 === this.seat_index && this.time_label && (this.time_label.string = String(e.remaining));
}.bind(this));
},
start: function() {},
_getMyPlayerId: function(e) {
var o = null;
if (e.socket && e.socket.getPlayerInfo) {
var n = e.socket.getPlayerInfo();
n && n.id && (o = n.id);
}
!o && e.playerData && e.playerData.serverPlayerId && (o = e.playerData.serverPlayerId);
!o && e.playerData && e.playerData.accountID && (o = e.playerData.accountID);
return String(o || "");
},
init_data: function(e, o) {
var n = window.myglobal;
this.accountid = e.accountid || e.accountId || "";
this.seat_index = o;
console.log("🎮 [player_node.init_data] accountid:", this.accountid, "seat_index:", this.seat_index, "nick_name:", e.nick_name);
if (n && n.playerData && !n.playerData.serverPlayerId && n.socket && n.socket.getPlayerInfo) {
var t = n.socket.getPlayerInfo();
t && t.id && (n.playerData.serverPlayerId = t.id);
}
this.account_label.node.active = !1;
if (this.nickname_label) {
this.nickname_label.overflow = cc.Label.Overflow.CLAMP;
this.nickname_label.enableEllipsis = !0;
this.nickname_label.node.width = 100;
}
this.nickname_label.string = e.nick_name || "玩家" + (o + 1);
var a = 0, i = 2 === e.room_category || this._isArenaMode;
if (i) {
if (void 0 !== e.arena_gold && null !== e.arena_gold) {
a = e.arena_gold;
console.log("🏟️ [player_node] 竞技场模式 - 昵称:", e.nick_name, "arena_gold:", e.arena_gold, "期号:", e.period_no);
} else if (void 0 !== e.match_coin && null !== e.match_coin) {
a = e.match_coin;
console.log("🏟️ [player_node] 竞技场模式(兼容) - 昵称:", e.nick_name, "match_coin:", e.match_coin);
} else if (void 0 !== e.gold_count && null !== e.gold_count) {
a = e.gold_count;
console.log("🏟️ [player_node] 竞技场模式（无arena_gold）- 使用 gold_count:", e.gold_count);
}
} else {
void 0 !== e.gold_count && null !== e.gold_count ? a = e.gold_count : void 0 !== e.goldcount && null !== e.goldcount && (a = e.goldcount);
console.log("🪙 [player_node] 普通场 - 昵称:", e.nick_name, "gold_count:", e.gold_count, "最终金币:", a);
}
this.globalcount_label.string = String(a);
this._isArenaMode = i;
this._arenaGold = a;
this._periodNo = e.period_no || "";
this.cardlist_node = [];
var r = e.isready || e.ready || e.IsReady || !1;
this.readyimage.active = 1 == r || "true" === r || 1 === r;
if (0 == o) {
this.card_node && (this.card_node.active = !1);
if (this.room_touxiang) {
this.room_touxiang.node.x = 80;
this.room_touxiang.node.y = 32;
}
if (this.headimage) {
this.headimage.node.x = 80;
this.headimage.node.y = 32;
}
if (this.nickname_label && this.nickname_label.node) {
this.nickname_label.node.anchorX = .5;
this.nickname_label.node.anchorY = .5;
this.nickname_label.node.x = 80;
this.nickname_label.node.y = 90;
}
if (this.globalcount_label && this.globalcount_label.node) {
this.globalcount_label.node.anchorX = .5;
this.globalcount_label.node.anchorY = .5;
this.globalcount_label.node.x = 80;
this.globalcount_label.node.y = -28;
}
if (this.room_money_frame) {
this.room_money_frame.x = 80;
this.room_money_frame.y = -28;
}
if (this.readyimage) {
this.readyimage.x = 105;
this.readyimage.y = 5;
}
if (this.masterIcon) {
this.masterIcon.x = 105;
this.masterIcon.y = 5;
}
}
if (this.room_touxiang && this.headimage) {
this.room_touxiang.node.zIndex = 0;
this.headimage.node.zIndex = 100;
this.headimage.node.parent.sortAllChildren();
}
var c = e.avatar || e.avatarUrl || e.avatarurl || "avatar_1";
this._loadAvatar(c);
this.node.on("player_ready_notify", function(e) {
var o = e;
("object" == typeof o && null !== o ? o.player_id || o.playerId || o.id || "" : o) == this.accountid && (this.readyimage.active = !0);
}.bind(this));
this.node.on("playernode_canrob_event", function(e) {
var o = e, n = 15;
if ("object" == typeof e && null !== e) {
o = e.player_id;
n = e.timeout || 15;
}
this._serverTimeout = n;
if (o == this.accountid) {
this.qiangdidzhu_node.active = !0;
this.time_label && (this.time_label.string = String(n));
}
}.bind(this));
this._serverTimeout = 15;
1 == o && (this.card_node.x = -this.card_node.x - 30);
},
_setAvatarSprite: function(e) {
if (this.headimage && e) {
this.headimage.enabled = !0;
this.headimage.spriteFrame = e;
this.headimage.node.setContentSize(80, 80);
this.headimage.node.scale = 1;
}
},
_loadAvatar: function(e) {
var o = this;
if (this.headimage) if (e && "" !== e) {
var n = window.myglobal;
if (n && n._avatarCache && n._avatarCache[e]) {
var t = n._avatarCache[e];
if (t) {
console.log("🖼️ [player_node] 使用缓存头像:", e);
o._setAvatarSprite(t);
return;
}
}
if (0 !== e.indexOf("/") || 0 !== e.indexOf("/uploads/")) if (0 === e.indexOf("http://") || 0 === e.indexOf("https://")) {
console.log("🖼️ [player_node] 加载远程头像:", e);
this._loadRemoteAvatar(e);
} else {
console.log("🖼️ [player_node] 加载本地头像:", e);
var a = "UI/headimage/" + e;
cc.loader.loadRes(a, cc.SpriteFrame, function(e, n) {
if (!e && n) {
o._setAvatarSprite(n);
console.log("🖼️ [player_node] 本地头像加载成功");
} else {
console.warn("🖼️ [player_node] 本地头像加载失败，使用默认头像:", e);
o._loadDefaultAvatar();
}
});
} else {
var i = (n && n.cdnUrl ? n.cdnUrl : "https://apis.hongxiu88.com") + e;
console.log("🖼️ [player_node] 加载服务器头像(格式1):", i);
this._loadRemoteAvatar(i);
}
} else this._loadDefaultAvatar(); else console.warn("🖼️ [player_node] headimage 未绑定");
},
_loadRemoteAvatar: function(e) {
var o = this, n = ".png";
e.indexOf(".jpg") > 0 || e.indexOf(".jpeg") > 0 ? n = ".jpg" : e.indexOf(".png") > 0 && (n = ".png");
console.log("🖼️ [player_node] 开始加载远程头像:", e, "扩展名:", n);
cc.assetManager.loadRemote(e, function(n, t) {
if (!n && t) try {
var a = new cc.SpriteFrame(t);
if (a) {
o._setAvatarSprite(a);
console.log("🖼️ [player_node] 远程头像加载成功:", e);
}
} catch (e) {
console.warn("🖼️ [player_node] 创建SpriteFrame失败:", e);
o._loadDefaultAvatar();
} else {
console.warn("🖼️ [player_node] 远程头像加载失败，使用默认头像:", n);
o._loadDefaultAvatar();
}
});
},
_loadDefaultAvatar: function() {
var e = this;
cc.loader.loadRes("UI/headimage/avatar_1", cc.SpriteFrame, function(o, n) {
!o && n && e._setAvatarSprite(n);
});
},
updateArenaData: function(e) {
console.log("🏟️ [player_node] updateArenaData 被调用, accountid:", this.accountid, "data:", JSON.stringify(e));
var o = 0;
if (void 0 !== e.match_coin && null !== e.match_coin && e.match_coin > 0) {
o = e.match_coin;
console.log("🏟️ [player_node] 更新 match_coin:", e.match_coin);
} else if (void 0 !== e.arena_gold && null !== e.arena_gold && e.arena_gold > 0) {
o = e.arena_gold;
console.log("🏟️ [player_node] 更新 arena_gold:", e.arena_gold);
} else if (void 0 !== e.gold_count && null !== e.gold_count && e.gold_count > 0) {
o = e.gold_count;
console.log("🏟️ [player_node] 更新 gold_count:", e.gold_count);
}
if (o > 0 && this.globalcount_label) {
this.globalcount_label.string = o.toString();
this._arenaGold = o;
console.log("🏟️ [player_node] 金币已更新为:", o);
} else 0 === o ? console.log("🏟️ [player_node] 警告：displayValue 为 0，跳过更新") : this.globalcount_label || console.warn("🏟️ [player_node] 错误：globalcount_label 未绑定！");
var n = e.avatar || e.avatarUrl;
if (n && "" !== n && "avatar_1" !== n) {
console.log("🏟️ [player_node] 更新头像:", n);
this._loadAvatar(n);
}
},
showCardBacks: function(e) {
if (0 !== this.seat_index) if (this.card_node) {
this.card_node.removeAllChildren(!0);
this.cardlist_node = [];
if (e <= 0) {
this.card_node.active = !1;
this.currentCardCount = 0;
} else {
this.card_node.active = !0;
this.currentCardCount = e;
if (this.card_prefab) for (var o = 0; o < e; o++) {
var n = cc.instantiate(this.card_prefab);
if (n) {
n.scale = .6;
n.parent = this.card_node;
n.active = !0;
var t = n.height;
n.y = .5 * (e - 1) * t * .12 - .12 * t * o;
n.x = 0;
this.cardlist_node.push(n);
}
} else console.error("🃏 [player_node] card_prefab 未绑定");
}
} else console.error("🃏 [player_node] card_node 未绑定");
},
_updatePlayerState: function(e) {
if ("offline" === e.state) this.offlineimage && (this.offlineimage.active = !0); else if ("robot" === e.state) {
this.trusteeimage && (this.trusteeimage.active = !0);
!this.trusteeimage && this.offlineimage && (this.offlineimage.active = !0);
} else if ("online" === e.state) {
this.offlineimage && (this.offlineimage.active = !1);
this.trusteeimage && (this.trusteeimage.active = !1);
}
if (void 0 !== e.cards_count) {
this.currentCardCount = e.cards_count;
this.showCardBacks(e.cards_count);
}
void 0 !== e.is_landlord && !0 === e.is_landlord && this.masterIcon && (this.masterIcon.active = !0);
},
_updateTrusteeState: function(e) {
if (e.player_id === this.accountid) {
this._isTrustee = e.is_trustee || !1;
console.log("🔄 [player_node] 托管状态更新:", e.player_name, "is_trustee:", this._isTrustee, "reason:", e.reason);
if (e.is_trustee) {
this.trusteeimage && (this.trusteeimage.active = !0);
!this.trusteeimage && this.offlineimage && (this.offlineimage.active = !0);
} else {
this.trusteeimage && (this.trusteeimage.active = !1);
this.offlineimage && (this.offlineimage.active = !1);
}
}
}
});
cc._RF.pop();
}, {} ],
userAgreement: [ function(e, o) {
"use strict";
cc._RF.push(o, "b2c3dTl9niQq83vEjRWeJq8", "userAgreement");
cc.Class({
extends: cc.Component,
properties: {
title_label: {
type: cc.Label,
default: null
},
content_label: {
type: cc.Label,
default: null
},
version_label: {
type: cc.Label,
default: null
},
loading_node: {
type: cc.Node,
default: null
},
scroll_view: {
type: cc.ScrollView,
default: null
},
confirm_btn: {
type: cc.Node,
default: null
},
header_node: {
type: cc.Node,
default: null
},
spade_icon: {
type: cc.Node,
default: null
}
},
onLoad: function() {
this._isValid = !0;
this._defaultContent = "欢迎使用本游戏！在使用前，请您仔细阅读以下用户协议：\n\n1. 服务条款：本游戏提供的服务仅供娱乐目的，用户需遵守相关法律法规。\n\n2. 账号安全：用户应妥善保管账号信息，因个人原因导致的账号损失由用户自行承担。\n\n3. 游戏规则：禁止使用外挂、作弊等违规行为，违者将受到封号等处罚。\n\n4. 隐私保护：我们重视用户隐私，相关信息仅用于提供和优化服务。";
this._defaultTitle = "用户协议";
this._defaultVersion = "";
this._setupMouseWheel();
this._initPopup();
this._fetchUserAgreement();
},
_setupMouseWheel: function() {
var e = this;
this.scroll_view && this.scroll_view.node && this.scroll_view.node.on(cc.Node.EventType.MOUSE_WHEEL, function(o) {
var n = o.getScrollY(), t = e.scroll_view;
if (t) {
var a = t.getScrollOffset(), i = a.y + .5 * n;
t.scrollToOffset(cc.v2(a.x, i), .1);
}
}, this);
},
_initPopup: function() {
this.title_label && (this.title_label.string = this._defaultTitle);
this.content_label && (this.content_label.string = "正在加载...");
this.version_label && (this.version_label.string = "");
this._showLoading(!0);
},
onDestroy: function() {
this._isValid = !1;
},
start: function() {},
_fetchUserAgreement: function() {
var e = this, o = window.defines, n = window.HttpAPI;
if (o && o.apiUrl) if (n) n.getUserAgreement(o.apiUrl, o.cryptoKey || "", function(o, n) {
if (e._isValid && e.node) {
e._showLoading(!1);
if (o) {
console.warn("获取用户协议失败:", o);
e._showDefaultContent();
} else n ? e._updateContent(n) : e._showDefaultContent();
}
}); else {
console.warn("HttpAPI未加载，使用默认内容");
e._showDefaultContent();
} else {
console.warn("API配置未定义，使用默认内容");
e._showDefaultContent();
}
},
_showDefaultContent: function() {
if (this._isValid && this.node) {
this.title_label && (this.title_label.string = this._defaultTitle);
if (this.content_label) {
this.content_label.string = this._defaultContent;
this._updateContentHeight();
}
this.version_label && (this.version_label.string = "");
this._showLoading(!1);
this.scroll_view && (this.scroll_view.node.active = !0);
}
},
_updateContent: function(e) {
if (this._isValid && this.node) {
this.title_label && e.title && (this.title_label.string = e.title);
if (this.content_label && e.content) {
this.content_label.string = e.content;
this._updateContentHeight();
}
this.version_label && e.version && (this.version_label.string = "版本: " + e.version);
}
},
_updateContentHeight: function() {
if (this._isValid && this.node && this.content_label) {
this.content_label.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
this.content_label.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
this.content_label.wrapWidth = 680;
this.content_label.node.color = cc.color(0, 0, 0, 255);
var e = this.content_label.node, o = this;
this.scheduleOnce(function() {
if (o._isValid && o.node) {
var n = e.height, t = Math.max(n + 60, 400);
e.height = t;
o.scroll_view && o.scroll_view.scrollToTop(0);
}
}, .1);
}
},
_showLoading: function(e) {
if (this._isValid && this.node) {
this.loading_node && (this.loading_node.active = e);
this.scroll_view && (this.scroll_view.node.active = !e);
}
},
_showError: function(e) {
if (this._isValid && this.node) {
this._showLoading(!1);
this.content_label && (this.content_label.string = e || this._defaultContent);
this.scroll_view && (this.scroll_view.node.active = !0);
}
},
onButtonClick: function(e, o) {
if (this._isValid && this.node) switch (o) {
case "close":
case "confirm":
this._isValid = !1;
this.node.destroy();
}
}
});
cc._RF.pop();
}, {} ],
user_agreement: [ function(e, o) {
"use strict";
cc._RF.push(o, "7e1ccYbD5xDzpnVEE2yJxYX", "user_agreement");
cc.Class({
extends: cc.Component,
properties: {
title_label: {
type: cc.Label,
default: null
},
content_label: {
type: cc.Label,
default: null
},
version_label: {
type: cc.Label,
default: null
},
loading_node: {
type: cc.Node,
default: null
},
scroll_view: {
type: cc.ScrollView,
default: null
},
confirm_btn: {
type: cc.Button,
default: null
},
header_node: {
type: cc.Node,
default: null
},
spade_icon: {
type: cc.Node,
default: null
}
},
onLoad: function() {
this.loadUserAgreement();
},
start: function() {
this.version_label && (this.version_label.string = "版本 V1.0.0");
},
loadUserAgreement: function() {
this.loading_node && (this.loading_node.active = !0);
this.fetchUserAgreement();
},
fetchUserAgreement: function() {
var e = this;
fetch("/api/user-agreement").then(function(e) {
if (!e.ok) throw new Error("网络请求失败");
return e.json();
}).then(function(o) {
o && o.content ? e.setContent(o.content) : e.setContent("暂无用户协议内容");
}).catch(function(o) {
console.error("加载用户协议失败:", o);
e.setContent("加载失败，请稍后重试");
});
},
setContent: function(e) {
this.loading_node && (this.loading_node.active = !1);
this.content_label && (this.content_label.string = e);
},
onButtonClick: function(e, o) {
switch (o) {
case "close":
this.closePanel();
break;

case "confirm":
this.confirmAgreement();
}
},
closePanel: function() {
this.playClickSound();
this.node.destroy();
},
confirmAgreement: function() {
this.playClickSound();
try {
localStorage.setItem("user_agreement_accepted", "true");
} catch (e) {
console.warn("无法存储用户协议状态:", e);
}
this.node.destroy();
},
playClickSound: function() {}
});
cc._RF.pop();
}, {} ],
waitnode: [ function(e, o) {
"use strict";
cc._RF.push(o, "17318Pv1MxELb6d+o/SHo0s", "waitnode");
cc.Class({
extends: cc.Component,
properties: {
loadimage_target: {
type: cc.Node,
default: null
},
lblContent: {
type: cc.Label,
default: null
}
},
onLoad: function() {
this._isShow = !1;
this._isValid = !0;
},
onDestroy: function() {
this._isValid = !1;
},
start: function() {
this._isValid && this.node && (this.node.active = this._isShow);
},
update: function(e) {
this._isValid && this.node && this.loadimage_target && this.loadimage_target.isValid && (this.loadimage_target.angle = this.loadimage_target.angle + 45 * e);
},
show: function(e) {
if (this._isValid && this.node) {
this._isShow = !0;
this.node.active = this._isShow;
if (this.lblContent && this.lblContent.isValid) {
null == e && (e = "");
this.lblContent.string = e;
}
}
},
hide: function() {
if (this._isValid && this.node) {
this._isShow = !1;
this.node.active = this._isShow;
}
}
});
cc._RF.pop();
}, {} ]
}, {}, [ "arenaData", "ArenaEnterWaitingScene", "ArenaMatchWaitingScene", "gameScene", "gamebeforeUI", "gameingUI", "card", "player_node", "hallScene", "creatroom", "joinroom", "userAgreement", "loginScene", "phone_login", "user_agreement", "waitnode" ]);