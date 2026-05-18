cc.Class({
extends: cc.Component,
properties: {
periodNoLabel: {
type: cc.Label,
default: null
},
totalPlayersLabel: {
type: cc.Label,
default: null
},
championNode: {
type: cc.Node,
default: null
},
runnerUpNode: {
type: cc.Node,
default: null
},
thirdPlaceNode: {
type: cc.Node,
default: null
},
top20ScrollView: {
type: cc.ScrollView,
default: null
},
rankItemPrefab: {
type: cc.Prefab,
default: null
},
myRankLabel: {
type: cc.Label,
default: null
},
myCoinLabel: {
type: cc.Label,
default: null
},
confirmBtn: {
type: cc.Button,
default: null
},
trophyNode: {
type: cc.Node,
default: null
},
championGlowNode: {
type: cc.Node,
default: null
}
},
onLoad() {
this._data = null;
this._top3 = [];
this._top10 = [];
this._top20 = [];
this._myRank = 0;
this._myMatchCoin = 0;
this._checkAndCreateDynamicUI();
this.confirmBtn && this.confirmBtn.node.on("click", this.onConfirmClick, this);
},
start() {
this._startChampionEffects();
},
_checkAndCreateDynamicUI: function() {
if (!this.championNode || !this.runnerUpNode || !this.thirdPlaceNode) {
console.log("🏆 [TournamentFinalRankDialog] 检测到prefab未加载，动态创建UI");
this._createDynamicUI();
}
},
_createDynamicUI: function() {
if (cc.find("Canvas")) {
this.node.setContentSize(1280, 720);
this.node.setPosition(0, 0);
var e = new cc.Node("Background");
e.setContentSize(1280, 720);
var o = e.addComponent(cc.Graphics);
o.fillColor = new cc.Color(0, 0, 0, 180);
o.rect(-640, -360, 1280, 720);
o.fill();
e.parent = this.node;
var t = new cc.Node("DialogContainer");
t.setContentSize(1e3, 720);
t.setPosition(0, 0);
var n = new cc.Node("DialogBg"), i = n.addComponent(cc.Graphics);
i.fillColor = new cc.Color(25, 35, 60, 250);
i.roundRect(-500, -360, 1e3, 720, 25);
i.fill();
i.strokeColor = new cc.Color(180, 140, 60);
i.lineWidth = 4;
i.roundRect(-500, -360, 1e3, 720, 25);
i.stroke();
n.parent = t;
t.parent = this.node;
var a = new cc.Node("TitleNode");
a.setPosition(0, 280);
var c = a.addComponent(cc.Label);
c.string = "🏆 比赛结束 🏆";
c.fontSize = 40;
c.lineHeight = 48;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
a.color = new cc.Color(255, 215, 0);
var r = a.addComponent(cc.LabelOutline);
r.color = new cc.Color(100, 60, 0);
r.width = 3;
a.parent = t;
this._periodNoNode = new cc.Node("PeriodNoNode");
this._periodNoNode.setPosition(0, 230);
var l = this._periodNoNode.addComponent(cc.Label);
l.string = "第---期赛事结束";
l.fontSize = 26;
l.lineHeight = 32;
this._periodNoNode.color = new cc.Color(200, 200, 220);
this._periodNoNode.parent = t;
this.periodNoLabel = l;
this._totalPlayersNode = new cc.Node("TotalPlayersNode");
this._totalPlayersNode.setPosition(0, 195);
var s = this._totalPlayersNode.addComponent(cc.Label);
s.string = "共0人参赛";
s.fontSize = 22;
s.lineHeight = 28;
this._totalPlayersNode.color = new cc.Color(180, 180, 200);
this._totalPlayersNode.parent = t;
this.totalPlayersLabel = s;
this._createTop3Podium(t);
this._createMyRankArea(t);
this._createTop10ListArea(t);
this._createConfirmButton(t);
console.log("🏆 [TournamentFinalRankDialog] 动态UI创建完成");
} else console.error("找不到Canvas节点");
},
_createTop3Podium: function(e) {
this.championNode = this._createPodiumItem(1, 0, 90, 1.15);
this.championNode.parent = e;
this.runnerUpNode = this._createPodiumItem(2, -280, 50, 1);
this.runnerUpNode.parent = e;
this.thirdPlaceNode = this._createPodiumItem(3, 280, 50, 1);
this.thirdPlaceNode.parent = e;
this._createPodiumBase(e, -50);
},
_createPodiumItem: function(e, o, t, n) {
var i = new cc.Node("PodiumItem_" + e);
i.setPosition(o, t);
i.scale = n || 1;
var a = new cc.Node("RankLabel");
a.setPosition(0, 65);
var c = a.addComponent(cc.Label);
c.string = this._getRankText(e);
c.fontSize = 22;
c.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
a.color = 1 === e ? new cc.Color(255, 215, 0) : new cc.Color(200, 200, 220);
var r = a.addComponent(cc.LabelOutline);
r.color = new cc.Color(50, 50, 80);
r.width = 2;
a.parent = i;
var l = 1 === e ? 70 : 60, s = l / 2 + 2, d = new cc.Node("AvatarContainer");
d.setPosition(0, 0);
d.setContentSize(l, l);
var p = new cc.Node("AvatarBg"), h = p.addComponent(cc.Graphics);
h.fillColor = new cc.Color(60, 70, 100);
h.circle(0, 0, s);
h.fill();
h.strokeColor = 1 === e ? new cc.Color(255, 215, 0) : new cc.Color(150, 150, 180);
h.lineWidth = 1 === e ? 3 : 2;
h.circle(0, 0, s);
h.stroke();
p.parent = d;
var m = new cc.Node("AvatarMask");
m.setContentSize(l - 4, l - 4);
var C = m.addComponent(cc.Mask);
C.type = cc.Mask.Type.ELLIPSE;
C.segements = 64;
m.parent = d;
var u = new cc.Node("AvatarSprite");
u.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
u.setContentSize(l - 4, l - 4);
u.parent = m;
d.parent = i;
var f = new cc.Node("NameLabel");
f.setPosition(0, -60);
f.setContentSize(120, 30);
var N = f.addComponent(cc.Label);
N.string = "玩家昵称";
N.fontSize = 1 === e ? 20 : 18;
N.lineHeight = 24;
N.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
N.overflow = cc.Label.Overflow.CLAMP;
f.color = new cc.Color(255, 255, 255);
var g = f.addComponent(cc.LabelOutline);
g.color = new cc.Color(30, 30, 50);
g.width = 1;
f.parent = i;
var v = new cc.Node("CoinLabel");
v.setPosition(0, -90);
var _ = v.addComponent(cc.Label);
_.string = "0金币";
_.fontSize = 1 === e ? 18 : 16;
_.lineHeight = 20;
_.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
v.color = 1 === e ? new cc.Color(255, 215, 0) : new cc.Color(255, 200, 100);
var w = v.addComponent(cc.LabelOutline);
w.color = new cc.Color(80, 50, 0);
w.width = 1;
v.parent = i;
return i;
},
_createPodiumBase: function(e, o) {
var t = new cc.Node("ChampionBase");
t.setPosition(0, o - 20);
var n = t.addComponent(cc.Graphics);
n.fillColor = new cc.Color(180, 140, 60, 200);
n.roundRect(-80, -30, 160, 60, 10);
n.fill();
n.strokeColor = new cc.Color(220, 180, 80);
n.lineWidth = 2;
n.roundRect(-80, -30, 160, 60, 10);
n.stroke();
t.parent = e;
var i = new cc.Node("RunnerUpBase");
i.setPosition(-280, o - 30);
var a = i.addComponent(cc.Graphics);
a.fillColor = new cc.Color(120, 130, 150, 200);
a.roundRect(-65, -25, 130, 50, 8);
a.fill();
a.strokeColor = new cc.Color(160, 170, 190);
a.lineWidth = 2;
a.roundRect(-65, -25, 130, 50, 8);
a.stroke();
i.parent = e;
var c = new cc.Node("ThirdBase");
c.setPosition(280, o - 30);
var r = c.addComponent(cc.Graphics);
r.fillColor = new cc.Color(150, 110, 90, 200);
r.roundRect(-65, -25, 130, 50, 8);
r.fill();
r.strokeColor = new cc.Color(180, 140, 110);
r.lineWidth = 2;
r.roundRect(-65, -25, 130, 50, 8);
r.stroke();
c.parent = e;
},
_createTop10ListArea: function(e) {
var o = new cc.Node("Top10ListContainer");
o.setPosition(0, -100);
o.setContentSize(900, 180);
var t = new cc.Node("ListTitle");
t.setPosition(0, 75);
var n = t.addComponent(cc.Label);
n.string = "━━━ 排行榜 TOP 10 ━━━";
n.fontSize = 20;
n.lineHeight = 24;
n.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
t.color = new cc.Color(255, 215, 0);
var i = t.addComponent(cc.LabelOutline);
i.color = new cc.Color(100, 60, 0);
i.width = 2;
t.parent = o;
this._top10ListNode = new cc.Node("Top10ListContent");
this._top10ListNode.setPosition(0, 55);
this._top10ListNode.parent = o;
this._top10ListContainer = o;
o.parent = e;
console.log("🏆 [TournamentFinalRankDialog] TOP10列表区域创建完成");
},
_updateTop10List: function(e) {
if (this._top10ListNode) {
this._top10ListNode.removeAllChildren();
var o = e.slice(3, 10);
if (0 !== o.length) {
console.log("🏆 [TournamentFinalRankDialog] 更新TOP10列表，共" + o.length + "条数据");
for (var t = 0; t < o.length; t++) {
var n = o[t], i = n.rank || t + 4;
this._createTop10ListItem(n, i, t).parent = this._top10ListNode;
}
} else console.log("🏆 [TournamentFinalRankDialog] 没有第4-10名数据");
} else console.warn("🏆 [TournamentFinalRankDialog] TOP10列表节点不存在");
},
_createTop10ListItem: function(e, o, t) {
var n = new cc.Node("Top10Item_" + o), i = 440 * (t < 3 ? 0 : 1) - 220, a = 47 * -(t < 3 ? t : t - 3) + 30;
n.setPosition(i, a);
n.setContentSize(430, 42);
var c, r = new cc.Node("ItemBg"), l = r.addComponent(cc.Graphics);
c = 4 === o ? new cc.Color(60, 80, 100, 200) : o <= 6 ? new cc.Color(50, 70, 90, 180) : new cc.Color(40, 55, 75, 160);
l.fillColor = c;
l.roundRect(-215, -21, 430, 42, 8);
l.fill();
l.strokeColor = new cc.Color(100, 120, 150, 150);
l.lineWidth = 1;
l.roundRect(-215, -21, 430, 42, 8);
l.stroke();
r.parent = n;
var s = new cc.Node("RankLabel");
s.setPosition(-180, 0);
s.setContentSize(50, 30);
var d = s.addComponent(cc.Label);
d.string = "第" + o + "名";
d.fontSize = 16;
d.lineHeight = 20;
d.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.color = 4 === o ? new cc.Color(100, 200, 255) : new cc.Color(180, 180, 200);
s.parent = n;
var p = new cc.Node("Avatar");
p.setPosition(-100, 0);
p.setContentSize(32, 32);
var h = new cc.Node("AvatarBg"), m = h.addComponent(cc.Graphics);
m.fillColor = new cc.Color(60, 70, 100);
m.circle(0, 0, 17);
m.fill();
m.strokeColor = new cc.Color(120, 140, 170);
m.lineWidth = 1;
m.circle(0, 0, 17);
m.stroke();
h.parent = p;
var C = new cc.Node("AvatarMask");
C.setContentSize(30, 30);
var u = C.addComponent(cc.Mask);
u.type = cc.Mask.Type.ELLIPSE;
u.segements = 64;
C.parent = p;
var f = new cc.Node("AvatarSprite"), N = f.addComponent(cc.Sprite);
N.sizeMode = cc.Sprite.SizeMode.CUSTOM;
f.setContentSize(30, 30);
f.parent = C;
this._loadAvatarForListItem(N, e.avatar, e.is_robot);
p.parent = n;
var g = new cc.Node("NameLabel");
g.setPosition(20, 0);
g.setContentSize(150, 30);
var v = g.addComponent(cc.Label), _ = e.player_name || "玩家";
e.is_robot && (_ = this._getRobotDisplayName(e.player_id, e.player_name));
v.string = _;
v.fontSize = 16;
v.lineHeight = 20;
v.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
v.overflow = cc.Label.Overflow.CLAMP;
g.color = new cc.Color(255, 255, 255);
g.parent = n;
var w = new cc.Node("CoinLabel");
w.setPosition(175, 0);
w.setContentSize(80, 30);
var L = w.addComponent(cc.Label);
L.string = this._formatCoin(e.match_coin || 0);
L.fontSize = 16;
L.lineHeight = 20;
L.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
w.color = new cc.Color(255, 200, 100);
w.parent = n;
return n;
},
_loadAvatarForListItem: function(e, o, t) {
if (e) if (t) {
var n = "UI/headimage/avatar_" + (Math.floor(3 * Math.random()) + 1);
cc.resources.load(n, cc.SpriteFrame, function(o, t) {
!o && t && (e.spriteFrame = t);
});
} else if (o && "" !== o) if (0 === o.indexOf("http") || 0 === o.indexOf("//")) cc.assetManager.loadRemote(o, {
ext: ".png"
}, function(o, t) {
if (!o && t) {
var n = new cc.SpriteFrame(t);
e.spriteFrame = n;
} else cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(o, t) {
!o && t && (e.spriteFrame = t);
});
}); else {
var i = "UI/headimage/" + o;
cc.resources.load(i, cc.SpriteFrame, function(o, t) {
!o && t ? e.spriteFrame = t : cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(o, t) {
!o && t && (e.spriteFrame = t);
});
});
} else cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(o, t) {
!o && t && (e.spriteFrame = t);
});
},
_createMyRankArea: function(e) {
var o = new cc.Node("MyRankContainer");
o.setPosition(0, -255);
o.setContentSize(600, 60);
var t = new cc.Node("Bg"), n = t.addComponent(cc.Graphics);
n.fillColor = new cc.Color(40, 50, 80, 230);
n.roundRect(-300, -30, 600, 60, 12);
n.fill();
n.strokeColor = new cc.Color(100, 120, 160);
n.lineWidth = 2;
n.roundRect(-300, -30, 600, 60, 12);
n.stroke();
t.parent = o;
var i = new cc.Node("MyRankLabel");
i.setPosition(-140, 0);
i.setContentSize(200, 40);
var a = i.addComponent(cc.Label);
a.string = "我的排名：第--名";
a.fontSize = 22;
a.lineHeight = 28;
a.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
a.verticalAlign = cc.Label.VerticalAlign.CENTER;
i.color = new cc.Color(100, 200, 255);
i.parent = o;
this.myRankLabel = a;
var c = new cc.Node("Separator");
c.setPosition(0, 0);
var r = c.addComponent(cc.Label);
r.string = "|";
r.fontSize = 24;
r.lineHeight = 28;
c.color = new cc.Color(150, 150, 180);
c.parent = o;
var l = new cc.Node("MyCoinLabel");
l.setPosition(150, 0);
l.setContentSize(200, 40);
var s = l.addComponent(cc.Label);
s.string = "比赛金币：0";
s.fontSize = 22;
s.lineHeight = 28;
s.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
s.verticalAlign = cc.Label.VerticalAlign.CENTER;
l.color = new cc.Color(255, 200, 100);
l.parent = o;
this.myCoinLabel = s;
o.parent = e;
},
_createConfirmButton: function(e) {
var o = new cc.Node("ConfirmBtn");
o.setPosition(0, -310);
o.setContentSize(200, 55);
var t = o.addComponent(cc.Graphics);
t.fillColor = new cc.Color(80, 160, 80);
t.roundRect(-100, -27.5, 200, 55, 12);
t.fill();
t.strokeColor = new cc.Color(120, 200, 120);
t.lineWidth = 3;
t.roundRect(-100, -27.5, 200, 55, 12);
t.stroke();
var n = new cc.Node("Label"), i = n.addComponent(cc.Label);
i.string = "确 定";
i.fontSize = 26;
i.lineHeight = 32;
i.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
n.color = new cc.Color(255, 255, 255);
var a = n.addComponent(cc.LabelOutline);
a.color = new cc.Color(30, 80, 30);
a.width = 2;
n.parent = o;
var c = o.addComponent(cc.Button);
o.on("click", this.onConfirmClick, this);
o.parent = e;
this.confirmBtn = c;
},
setData: function(e) {
console.log("🏆 [TournamentFinalRankDialog] 收到数据:", JSON.stringify(e));
this._data = e;
this._periodNo = e.period_no || "";
this._totalPlayers = e.total_players || 0;
this._top3 = e.top3 || [];
this._top20 = e.top20 || [];
this._myRank = e.my_rank || 0;
this._myMatchCoin = e.my_match_coin || 0;
console.log("🏆 [TournamentFinalRankDialog] TOP3数据:");
for (var o = 0; o < this._top3.length; o++) console.log("  #" + (o + 1) + ":", this._top3[o].player_name, "金币:", this._top3[o].match_coin, "机器人:", this._top3[o].is_robot);
this._updateUI();
},
_updateUI: function() {
this.periodNoLabel && (this.periodNoLabel.string = "第" + this._periodNo + "期赛事结束");
this.totalPlayersLabel && (this.totalPlayersLabel.string = "共" + this._totalPlayers + "人参赛");
this._updateTop3();
var e = this._top20.slice(0, 10);
this._updateTop10List(e);
this.myRankLabel && (this._myRank > 0 ? this.myRankLabel.string = "我的排名：第" + this._myRank + "名" : this.myRankLabel.string = "我的排名：未上榜");
this.myCoinLabel && (this.myCoinLabel.string = "比赛金币：" + this._myMatchCoin);
},
_updateTop3: function() {
this._top3.length >= 1 && this.championNode && this._updatePodiumNode(this.championNode, this._top3[0], 1);
this._top3.length >= 2 && this.runnerUpNode && this._updatePodiumNode(this.runnerUpNode, this._top3[1], 2);
this._top3.length >= 3 && this.thirdPlaceNode && this._updatePodiumNode(this.thirdPlaceNode, this._top3[2], 3);
},
_updatePodiumNode: function(e, o, t) {
var n = e.getChildByName("RankLabel");
n && (r = n.getComponent(cc.Label)) && (r.string = this._getRankText(t));
var i = o.player_name || "玩家";
o.is_robot && (i = this._getRobotDisplayName(o.player_id, o.player_name));
var a = e.getChildByName("NameLabel");
a && (r = a.getComponent(cc.Label)) && (r.string = i);
var c = e.getChildByName("CoinLabel");
if (c) {
var r;
(r = c.getComponent(cc.Label)) && (r.string = this._formatCoin(o.match_coin || 0) + "金币");
}
var l = e.getChildByName("AvatarContainer");
if (l) {
var s = l.getChildByName("AvatarMask"), d = s ? s.getChildByName("AvatarSprite") : null;
d || (d = l.getChildByName("AvatarSprite"));
if (d) {
var p = d.getComponent(cc.Sprite);
p && this._loadAvatar(p, o.avatar, o.is_robot);
}
}
console.log("🏆 [_updatePodiumNode] 排名#" + t + ": " + i + ", 金币=" + o.match_coin + ", 机器人=" + o.is_robot);
},
_loadAvatar: function(e, o, t) {
if (e) if (t) {
var n = "UI/headimage/avatar_" + (Math.floor(3 * Math.random()) + 1);
cc.resources.load(n, cc.SpriteFrame, function(o, t) {
!o && t && (e.spriteFrame = t);
});
} else if (o && "" !== o) if (0 === o.indexOf("http") || 0 === o.indexOf("//")) cc.assetManager.loadRemote(o, {
ext: ".png"
}, function(o, t) {
if (!o && t) {
var n = new cc.SpriteFrame(t);
e.spriteFrame = n;
} else cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(o, t) {
!o && t && (e.spriteFrame = t);
});
}); else {
var i = "UI/headimage/" + o;
cc.resources.load(i, cc.SpriteFrame, function(o, t) {
!o && t ? e.spriteFrame = t : cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(o, t) {
!o && t && (e.spriteFrame = t);
});
});
} else cc.resources.load("UI/headimage/avatar_1", cc.SpriteFrame, function(o, t) {
!o && t && (e.spriteFrame = t);
});
},
_formatCoin: function(e) {
return e >= 1e4 ? (e / 1e4).toFixed(1) + "万" : e.toString();
},
_startChampionEffects: function() {
if (this.trophyNode) {
var e = cc.moveBy(.5, cc.v2(0, 10)), o = cc.moveBy(.5, cc.v2(0, -10)), t = cc.sequence(e, o), n = cc.repeatForever(t);
this.trophyNode.runAction(n);
}
if (this.championGlowNode) {
var i = cc.fadeIn(.5), a = cc.fadeOut(.5);
t = cc.sequence(i, a), n = cc.repeatForever(t);
this.championGlowNode.runAction(n);
}
if (this.championNode) {
var c = cc.scaleTo(.8, 1.05), r = cc.scaleTo(.8, 1);
t = cc.sequence(c, r), n = cc.repeatForever(t);
this.championNode.runAction(n);
}
},
_stopChampionEffects: function() {
this.trophyNode && this.trophyNode.stopAllActions();
this.championGlowNode && this.championGlowNode.stopAllActions();
this.championNode && this.championNode.stopAllActions();
},
onConfirmClick: function() {
console.log("🏆 [TournamentFinalRank] 点击确认，返回大厅");
this._stopChampionEffects();
this.node.destroy();
cc.director.loadScene("hallScene");
},
_getRankText: function(e) {
switch (e) {
case 1:
return "🥇 冠军";

case 2:
return "🥈 亚军";

case 3:
return "🥉 季军";

default:
return "第" + e + "名";
}
},
_getRobotDisplayName: function(e, o) {
if (o && "" !== o) return o;
var t = 1;
if (e) {
var n = e.toString().slice(-1);
t = parseInt(n) || 1;
}
return "智能陪练" + t + "号";
}
});