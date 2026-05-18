const TournamentStatus = {
WAITING: "WAITING",
CALCULATING: "CALCULATING",
MATCHING: "MATCHING"
};

cc.Class({
extends: cc.Component,
properties: {
periodNoLabel: {
type: cc.Label,
default: null
},
roundLabel: {
type: cc.Label,
default: null
},
progressLabel: {
type: cc.Label,
default: null
},
progressBar: {
type: cc.ProgressBar,
default: null
},
tipLabel: {
type: cc.Label,
default: null
},
statusLabel: {
type: cc.Label,
default: null
},
loadingNode: {
type: cc.Node,
default: null
},
pokerSprite: {
type: cc.Sprite,
default: null
}
},
onLoad() {
this._periodNo = "";
this._round = 1;
this._totalRounds = 1;
this._finishedTables = 0;
this._totalTables = 0;
this._isWaiting = !1;
this._status = TournamentStatus.WAITING;
this._registerEvents();
},
start() {
this._startLoadingAnimation();
},
onDestroy() {
this._unregisterEvents();
},
_registerEvents: function() {
var t = this;
if (window.socketCtr) {
window.socketCtr().onTournamentWaitProgress(function(s) {
t._onWaitProgress(s);
});
window.socketCtr().onTournamentRoundAdvance(function(s) {
t._onRoundAdvance(s);
});
window.socketCtr().onTournamentFinalRank(function(s) {
t._onFinalRank(s);
});
}
},
_unregisterEvents: function() {},
setData: function(t) {
this._periodNo = t.period_no || "";
this._round = t.round || 1;
this._totalRounds = t.total_rounds || 1;
this._finishedTables = t.finished_tables || 0;
this._totalTables = t.total_tables || 0;
this._status = t.status || TournamentStatus.WAITING;
this._updateUI();
},
updateProgress: function(t) {
this._finishedTables = t;
this._updateProgressUI();
},
_onWaitProgress: function(t) {
console.log("🏆 [TournamentWaiting] 收到进度更新:", JSON.stringify(t));
if (!this._periodNo || t.period_no === this._periodNo) {
this._periodNo = t.period_no;
this._round = t.round;
this._totalRounds = t.total_rounds;
this._finishedTables = t.finished_tables;
this._totalTables = t.total_tables;
this._status = t.status || TournamentStatus.WAITING;
this._updateUI();
}
},
_onRoundAdvance: function(t) {
console.log("🏆 [TournamentWaiting] 进入下一轮:", JSON.stringify(t));
if (!this._periodNo || t.period_no === this._periodNo) {
this._round = t.new_round;
this._totalRounds = t.total_rounds;
this._finishedTables = 0;
this._status = TournamentStatus.MATCHING;
this.tipLabel && (this.tipLabel.string = t.message || "进入下一轮...");
this._playRoundChangeAnimation();
}
},
_onFinalRank: function(t) {
console.log("🏆 [TournamentWaiting] 比赛结束，显示最终榜单:", JSON.stringify(t));
this._periodNo && t.period_no !== this._periodNo || this._showFinalRankDialog(t);
},
_updateUI: function() {
this.periodNoLabel && (this.periodNoLabel.string = "第" + this._periodNo + "期");
this.roundLabel && (this.roundLabel.string = "第" + this._round + "轮 / 共" + this._totalRounds + "轮");
this._updateProgressUI();
this._updateStatusUI();
},
_updateProgressUI: function() {
this.progressLabel && (this.progressLabel.string = this._finishedTables + " / " + this._totalTables);
if (this.progressBar && this._totalTables > 0) {
var t = this._finishedTables / this._totalTables;
this.progressBar.progress = Math.min(t, 1);
}
if (this.tipLabel) if (this._finishedTables >= this._totalTables) this.tipLabel.string = "全部完成，即将进入下一轮..."; else {
var s = this._totalTables - this._finishedTables;
this.tipLabel.string = "正在等待其他玩家完成... (剩余" + s + "桌)";
}
},
_updateStatusUI: function() {
if (this.statusLabel) switch (this._status) {
case TournamentStatus.CALCULATING:
this.statusLabel.string = "正在统计全场排名...";
this.statusLabel.node.color = new cc.Color(255, 200, 100);
break;

case TournamentStatus.MATCHING:
this.statusLabel.string = "晋级成功！正在匹配下一轮...";
this.statusLabel.node.color = new cc.Color(100, 255, 100);
break;

default:
if (this._finishedTables >= this._totalTables) {
this.statusLabel.string = "本轮结束，请稍候...";
this.statusLabel.node.color = new cc.Color(255, 220, 150);
} else {
this.statusLabel.string = "正在等待其他玩家完成...";
this.statusLabel.node.color = new cc.Color(200, 200, 220);
}
}
if (this.tipLabel) switch (this._status) {
case TournamentStatus.CALCULATING:
this.tipLabel.string = "正在统计全场排名...";
break;

case TournamentStatus.MATCHING:
this.tipLabel.string = "晋级成功！正在匹配下一轮...";
break;

default:
if (this._finishedTables >= this._totalTables) this.tipLabel.string = "全部完成，即将进入下一轮..."; else {
var t = this._totalTables - this._finishedTables;
this.tipLabel.string = "正在等待其他玩家完成... (剩余" + t + "桌)";
}
}
},
_startLoadingAnimation: function() {
if (this.pokerSprite) {
var t = cc.rotateBy(2, 360), s = cc.repeatForever(t);
this.pokerSprite.node.runAction(s);
}
},
_stopLoadingAnimation: function() {
this.pokerSprite && this.pokerSprite.node.stopAllActions();
},
_playRoundChangeAnimation: function() {
if (this.roundLabel) {
var t = cc.scaleTo(.3, 1.2), s = cc.scaleTo(.3, 1), i = cc.sequence(t, s);
this.roundLabel.node.runAction(i);
}
},
_showFinalRankDialog: function(t) {
this._stopLoadingAnimation();
var s = new cc.Node("TournamentFinalRankDialog");
s.setPosition(0, 0);
s.setContentSize(cc.winSize.width, cc.winSize.height);
var i = s.addComponent("TournamentFinalRankDialog");
this.node.addChild(s);
i && i.setData(t);
console.log("🏆 [TournamentWaiting] 最终榜单弹窗已创建");
},
onBackToHallClick: function() {
cc.director.loadScene("hallScene");
}
});