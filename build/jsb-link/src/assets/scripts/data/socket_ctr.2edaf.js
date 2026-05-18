window.socketCtr = function() {
var e = {}, n = {}, o = 0, a = null, t = null, r = !1, i = !1, c = !1, l = !1, s = "", _ = "", d = "", u = "", f = !1, y = null, m = null, p = 0, g = 0, b = !1, k = [], v = "disconnected", w = null, h = null, S = "wss://apis.hongxiu88.com/ws";
"undefined" != typeof window && window.defines && window.defines.serverUrl && (S = window.defines.serverUrl);
var A = function() {
if (window.myglobal && window.myglobal.eventlister) {
if (t !== window.myglobal.eventlister) {
t = window.myglobal.eventlister;
console.log("🔧 [socket_ctr] 使用 myglobal.eventlister 共享实例");
}
} else if (!t) {
if ("undefined" == typeof window.eventLister) {
console.error("eventLister 未定义，请确保 event_lister.js 已作为插件脚本加载");
return null;
}
t = window.eventLister({});
console.log("🔧 [socket_ctr] 创建新的事件实例（myglobal 未初始化）");
}
return t;
}, C = function(e, n, o) {
console.log("📤 [_sendmsg] 准备发送消息, type=" + e + ", readyState=" + (a ? a.readyState : "null"));
if (a && a.readyState === WebSocket.OPEN) {
var t = {
type: e,
payload: n || {},
callIndex: o || null
};
console.log("📤 [_sendmsg] 发送消息: " + JSON.stringify(t));
a.send(JSON.stringify(t));
} else console.error("❌ [_sendmsg] WebSocket 未连接，无法发送消息: " + e);
}, O = function(e, a, t) {
n[++o] = t;
C(e, a, o);
}, R = function(o) {
var a = A();
if (a) {
var t = o.type, i = o.payload || o.data || {}, c = o.callIndex;
if ("room_joined" === t || "room_created" === t) {
u = i.room_code;
f = !0;
}
if (c && n[c]) {
(0, n[c])(o.result || 0, i);
delete n[c];
} else switch (t) {
case "connected":
console.log("✅ [socket_ctr] 收到 connected 消息, player_id:", i.player_id, "player_name:", i.player_name);
s = i.player_id;
_ = i.player_name;
d = i.reconnect_token;
r = !0;
q("connected");
window.myglobal && window.myglobal.playerData && (window.myglobal.playerData.serverPlayerId = i.player_id);
N();
console.log("✅ [socket_ctr] 连接认证成功, _playerId =", s, "isAuthenticated =", e.isAuthenticated());
a.fire("connection_success", i);
break;

case "reconnected":
s = i.player_id;
_ = i.player_name;
r = !0;
q("connected");
window.myglobal && window.myglobal.playerData && (window.myglobal.playerData.serverPlayerId = i.player_id);
N();
if (i.game_state) {
u = i.room_code;
f = !0;
a.fire("game_state_restore", {
room_code: i.room_code,
player_id: i.player_id,
player_name: i.player_name,
game_state: i.game_state
});
} else if (i.room_code) {
u = i.room_code;
f = !0;
a.fire("room_restored", i);
} else a.fire("connection_success", i);
console.log("🏟️ [Reconnect] 重连成功，延迟请求竞技场状态...");
setTimeout(function() {
e.requestArenaStatus && e.requestArenaStatus();
}, 500);
break;

case "room_created":
if (i.player && i.player.id) {
s = i.player.id;
_ = i.player.name || _;
window.myglobal && window.myglobal.playerData && (window.myglobal.playerData.serverPlayerId = i.player.id);
}
a.fire("room_created", i);
break;

case "room_joined":
console.log("🏠 [socket_ctr] ROOM_JOINED 原始数据:", JSON.stringify(i));
if (i.players) {
console.log("🏠 [socket_ctr] ROOM_JOINED players 金币数据:");
for (var l = 0; l < i.players.length; l++) console.log("   玩家", l, ":", i.players[l].name, "gold_count=", i.players[l].gold_count);
}
i.player && console.log("🏠 [socket_ctr] ROOM_JOINED 当前玩家:", i.player.name, "gold_count=", i.player.gold_count);
if (i.player && i.player.id) {
s = i.player.id;
_ = i.player.name || _;
window.myglobal && window.myglobal.playerData && (window.myglobal.playerData.serverPlayerId = i.player.id);
}
W(i);
a.fire("room_joined", i);
break;

case "player_joined":
console.log("🚪 [socket_ctr] PLAYER_JOINED 原始数据:", JSON.stringify(i));
var y = {
accountid: i.player ? i.player.id : "",
nick_name: i.player ? i.player.name : "",
avatarUrl: i.player && i.player.avatar || "avatar_1",
gold_count: i.player ? i.player.gold_count : 0,
goldcount: i.player && i.player.gold_count || 0,
match_coin: i.player && i.player.match_coin || 0,
seatindex: i.player ? i.player.seat + 1 : 1,
isready: !!i.player && i.player.ready
};
console.log("🚪 [socket_ctr] PLAYER_JOINED 转换后数据:", JSON.stringify(y));
a.fire("player_joinroom_notify", y);
break;

case "player_left":
a.fire("player_left", i);
break;

case "player_ready":
a.fire("player_ready_notify", i);
break;

case "match_found":
a.fire("match_found", i);
break;

case "room_list_result":
a.fire("room_list_result", i);
break;

case "room_list_update":
a.fire("room_list_update", i);
break;

case "game_start":
a.fire("gameStart_notify", i);
break;

case "deal_cards":
a.fire("pushcard_notify", {
cards: i.cards || [],
bottom_cards: i.bottom_cards || []
});
break;

case "call_landlord_start":
a.fire("call_landlord_start_notify", i);
break;

case "call_landlord_turn":
a.fire("call_landlord_turn_notify", {
player_id: i.player_id,
player_name: i.player_name,
timeout: i.timeout || 15,
round: i.round || 1,
turn_index: i.turn_index || 1,
expires_at: i.expires_at || 0
});
1 === i.round ? a.fire("bid_turn_notify", {
player_id: i.player_id,
timeout: i.timeout || 15
}) : a.fire("canrob_notify", {
player_id: i.player_id,
timeout: i.timeout || 15
});
break;

case "call_landlord_result":
a.fire("call_landlord_result_notify", {
player_id: i.player_id,
player_name: i.player_name,
action: i.action,
round: i.round,
turn_index: i.turn_index,
gender: i.gender || "male",
order: i.order || 1
});
1 === i.round ? a.fire("bid_result_notify", {
accountid: i.player_id,
state: "call" === i.action
}) : a.fire("canrob_state_notify", {
accountid: i.player_id,
state: "call" === i.action
});
break;

case "call_landlord_end":
a.fire("call_landlord_end_notify", i);
a.fire("change_master_notify", i.landlord_id);
a.fire("change_showcard_notify", {
cards: i.bottom_cards || []
});
break;

case "restart_game":
a.fire("restart_game_notify", i);
break;

case "card_played":
a.fire("other_chucard_notify", {
accountid: i.player_id,
cards: i.cards || [],
cards_left: i.cards_left,
hand_type: i.hand_type || "",
rank: i.rank || 0,
gender: i.gender || "male",
is_new_round: i.is_new_round || !1,
can_beat: i.can_beat || !1
});
break;

case "landlord":
a.fire("change_master_notify", i.player_id);
a.fire("change_showcard_notify", {
cards: i.bottom_cards || []
});
break;

case "landlord_cards":
a.fire("landlord_cards_notify", {
landlord_id: i.landlord_id || "",
landlord_name: i.landlord_name || "",
cards: i.cards || [],
bottom_cards: i.bottom_cards || []
});
break;

case "play_turn":
a.fire("can_chu_card_notify", {
player_id: i.player_id,
timeout: i.timeout || 15,
must_play: i.must_play || !1,
can_beat: i.can_beat || !1
});
break;

case "bid_turn":
a.fire("bid_turn_notify", {
player_id: i.player_id,
timeout: i.timeout || 15
});
break;

case "bid_result":
a.fire("bid_result_notify", {
accountid: i.player_id,
state: i.bid
});
break;

case "rob_turn":
a.fire("canrob_notify", {
player_id: i.player_id,
timeout: i.timeout || 15
});
break;

case "rob_result":
a.fire("canrob_state_notify", {
accountid: i.player_id,
state: i.rob
});
break;

case "play_start":
a.fire("play_start_notify", {
landlord_id: i.landlord_id
});
break;

case "player_pass":
a.fire("other_chucard_notify", {
accountid: i.player_id,
cards: [],
is_pass: !0,
gender: i.gender || "male"
});
break;

case "game_over":
a.fire("game_over", i);
break;

case "error":
console.error("服务器错误:", i.message);
a.fire("error", i);
break;

case "force_logout":
console.warn("🚫 收到强制下线通知:", i);
P(i);
break;

case "pong":
J(i);
break;

case "player_offline":
a.fire("player_offline_notify", {
player_id: i.player_id,
player_name: i.player_name,
timeout: i.timeout || 0
});
break;

case "player_online":
a.fire("player_online_notify", {
player_id: i.player_id,
player_name: i.player_name
});
break;

case "trustee_state":
a.fire("trustee_state_notify", {
player_id: i.player_id,
player_name: i.player_name,
is_trustee: i.is_trustee,
reason: i.reason
});
break;

case "hint_result":
a.fire("hint_result_notify", i);
break;

case "arena_status":
console.log("🏟️ [Arena] 收到 arena_status 消息, arenas 数量:", i.arenas ? i.arenas.length : 0);
a.fire("arena_status_notify", i);
break;

case "arena_match_start":
console.log("🏆 [Arena] 收到 arena_match_start 消息:", JSON.stringify(i));
a.fire("arena_match_start_notify", {
period_no: i.period_no || "",
room_id: i.room_id || 0,
room_name: i.room_name || "",
room_config_id: i.room_config_id || 0,
signup_fee: i.signup_fee || 0,
total_players: i.total_players || 0,
match_duration: i.match_duration || 0,
match_rounds: i.match_rounds || 0,
countdown: i.countdown || 10,
message: i.message || ""
});
break;

case "arena_close_dialog":
a.fire("arena_close_dialog_notify", {
room_id: i.room_id || 0,
period_no: i.period_no || "",
reason: i.reason || "",
message: i.message || ""
});
break;

case "competition_status":
a.fire("competition_status_notify", i);
break;

case "competition_countdown":
a.fire("competition_countdown_notify", {
countdown: i.countdown || 15,
message: i.message || ""
});
break;

case "match_coin_update":
a.fire("match_coin_update_notify", {
player_id: i.player_id,
match_coin: i.match_coin || 0,
delta: i.delta || 0
});
break;

case "competition_eliminated":
a.fire("competition_eliminated_notify", {
rank: i.rank || 0,
reason: i.reason || "",
total_players: i.total_players || 0,
rewards: i.rewards || null
});
break;

case "competition_advance":
a.fire("competition_advance_notify", {
current_round: i.current_round || 0,
total_rounds: i.total_rounds || 0,
match_coin: i.match_coin || 0,
message: i.message || ""
});
break;

case "competition_champion":
a.fire("competition_champion_notify", {
rank: 1,
rewards: i.rewards || null,
reward_type: i.reward_type || "virtual",
rankings: i.rankings || [],
match_coin: i.match_coin || 0
});
break;

case "arena_round_countdown":
a.fire("arena_round_countdown_notify", {
seconds: i.seconds || 30,
round: i.round || 1,
period_no: i.period_no || "",
room_id: i.room_id || 0,
message: i.message || ""
});
break;

case "arena_countdown_tick":
a.fire("arena_countdown_tick_notify", {
seconds: i.seconds || 0,
period_no: i.period_no || "",
room_id: i.room_id || 0
});
break;

case "arena_auto_ready":
a.fire("arena_auto_ready_notify", {
period_no: i.period_no || "",
room_id: i.room_id || 0,
message: i.message || "系统已自动准备"
});
break;

case "arena_reconnect_state":
a.fire("arena_reconnect_state_notify", {
phase: i.phase || "",
period_no: i.period_no || "",
room_id: i.room_id || 0,
round: i.round || 0,
countdown: i.countdown || 0,
message: i.message || ""
});
break;

case "tournament_wait_progress":
a.fire("tournament_wait_progress_notify", {
period_no: i.period_no || "",
round: i.round || 1,
total_rounds: i.total_rounds || 1,
finished_tables: i.finished_tables || 0,
total_tables: i.total_tables || 0,
player_table_done: i.player_table_done || !1,
message: i.message || ""
});
break;

case "tournament_round_advance":
a.fire("tournament_round_advance_notify", {
period_no: i.period_no || "",
new_round: i.new_round || 1,
total_rounds: i.total_rounds || 1,
message: i.message || ""
});
break;

case "tournament_final_rank":
a.fire("tournament_final_rank_notify", {
period_no: i.period_no || "",
total_players: i.total_players || 0,
top3: i.top3 || [],
top20: i.top20 || [],
my_rank: i.my_rank || 0,
my_match_coin: i.my_match_coin || 0,
message: i.message || ""
});
break;

case "arena_waiting_status":
var m = void 0 !== i.countdown && null !== i.countdown ? i.countdown : 60;
console.log("🏟️ [Arena] 收到等待状态推送，服务端倒计时=" + i.countdown + "，使用值=" + m);
var p = {
period_no: i.period_no || "",
room_id: i.room_id || 0,
room_name: i.room_name || "",
phase: i.phase || "waiting",
countdown: m,
start_time: i.start_time || 0,
total_players: i.total_players || 0,
entered_players: i.entered_players || 0,
players: i.players || [],
message: i.message || ""
};
if (window.myglobal) {
window.myglobal.arenaWaitingStatusCache = p;
console.log("🏟️ [Arena] 缓存等待状态数据，玩家数量:", i.players ? i.players.length : 0);
}
a.fire("arena_waiting_status_notify", p);
break;

case "arena_waiting_tick":
var g = void 0 !== i.countdown && null !== i.countdown ? i.countdown : 0;
console.log("🏟️ [Arena] 收到倒计时更新，服务端倒计时=" + g);
a.fire("arena_waiting_tick_notify", {
period_no: i.period_no || "",
room_id: i.room_id || 0,
countdown: g,
entered_players: i.entered_players || 0
});
break;

case "arena_assign_start":
a.fire("arena_assign_start_notify", {
period_no: i.period_no || "",
room_id: i.room_id || 0,
total_players: i.total_players || 0,
total_tables: i.total_tables || 0,
countdown: i.countdown || 10,
message: i.message || ""
});
break;

case "arena_champion_broadcast":
console.log("🏆 [Arena] 收到冠军跑马灯广播:", JSON.stringify(i));
a.fire("arena_champion_broadcast_notify", {
period_no: i.period_no || "",
room_id: i.room_id || 0,
room_name: i.room_name || "竞技场",
champion_id: i.champion_id || 0,
champion_name: i.champion_name || "",
champion_avatar: i.champion_avatar || "",
runner_up_name: i.runner_up_name || "",
third_name: i.third_name || "",
total_players: i.total_players || 0,
match_coin: i.match_coin || 0,
message: i.message || "",
timestamp: i.timestamp || 0
});
break;

case "arena_player_joined":
console.log("🏟️ [Arena] 收到玩家加入广播:", JSON.stringify(i));
var b = {
period_no: i.period_no || "",
room_id: i.room_id || 0,
player: i.player || {},
entered_players: i.entered_players || 0,
total_players: i.total_players || 0,
players: i.players || [],
message: i.message || ""
};
if (window.myglobal) if (window.myglobal.arenaWaitingStatusCache) {
window.myglobal.arenaWaitingStatusCache.players = b.players;
window.myglobal.arenaWaitingStatusCache.entered_players = b.entered_players;
window.myglobal.arenaWaitingStatusCache.total_players = b.total_players;
console.log("🏟️ [Arena] 更新缓存数据，玩家数量:", b.players.length);
} else {
window.myglobal.arenaWaitingStatusCache = {
period_no: b.period_no,
room_id: b.room_id,
players: b.players,
entered_players: b.entered_players,
total_players: b.total_players,
message: b.message
};
console.log("🏟️ [Arena] 创建缓存数据，玩家数量:", b.players.length);
}
a.fire("arena_player_joined_notify", b);
break;

case "arena_eliminated_kick":
console.log("🚪 [Arena] 收到淘汰踢出通知:", JSON.stringify(i));
u = "";
f = !1;
a.fire("arena_eliminated_kick_notify", {
period_no: i.period_no || "",
player_id: i.player_id || "",
message: i.message || "您已被淘汰，即将离开房间"
});
break;

case "arena_signup_success":
console.log("🏟️ [Arena] 报名成功:", JSON.stringify(i));
a.fire("arena_signup_success_notify", {
period_no: i.period_no || "",
room_id: i.room_id || 0,
signup_fee: i.signup_fee || 0,
balance_after: i.balance_after || 0,
signup_time: i.signup_time || Date.now()
});
break;

case "arena_signup_failed":
console.log("🏟️ [Arena] 报名失败:", JSON.stringify(i));
a.fire("arena_signup_failed_notify", {
code: i.code || 0,
message: i.message || "报名失败"
});
break;

case "arena_cancel_success":
console.log("🏟️ [Arena] 取消报名成功:", JSON.stringify(i));
a.fire("arena_cancel_success_notify", {
period_no: i.period_no || "",
room_id: i.room_id || 0,
refund_amount: i.refund_amount || 0,
balance_after: i.balance_after || 0
});
break;

case "arena_cancel_failed":
console.log("🏟️ [Arena] 取消报名失败:", JSON.stringify(i));
a.fire("arena_cancel_failed_notify", {
code: i.code || 0,
message: i.message || "取消报名失败"
});
break;

default:
a.fire(t, i);
}
}
};
e.initSocket = function() {
var e = A();
if (e) {
var n = window.myglobal, o = n && n.playerData && n.playerData.token;
if (c) {
console.log("🔧 [initSocket] 正在重连中，跳过本次请求（设置pending标记）");
l = !0;
} else {
if (r) {
if (i) {
console.log("🔧 [initSocket] 已连接且当前连接带Token，跳过重新连接");
return;
}
if (!o) {
console.log("🔧 [initSocket] 已连接且无Token，保持现有连接");
return;
}
console.log("🔧 [initSocket] 当前连接无Token，但现在有Token了，需要重新连接");
}
c = !0;
if (!a || a.readyState !== WebSocket.OPEN && a.readyState !== WebSocket.CONNECTING) T(o, e); else {
console.log("🔧 [initSocket] 关闭旧连接...");
D();
var t = a;
t.onclose = function() {
console.log("🔧 [initSocket] 旧连接已关闭，开始建立新连接");
a = null;
r = !1;
i = !1;
T(o, e);
};
t.close();
}
}
} else console.error("无法初始化 WebSocket：eventLister 未定义");
};
var T = function(n, o) {
var t = window.myglobal;
q("connecting");
var s = S;
0 !== s.indexOf("ws://") && 0 !== s.indexOf("wss://") && (s = "ws://" + s + "/ws");
if (n) {
var _ = s.indexOf("?") > 0 ? "&" : "?";
s = s + _ + "token=" + encodeURIComponent(t.playerData.token);
console.log("🔧 [initSocket] 连接时带上Token: " + t.playerData.token.substring(0, 10) + "...");
} else console.log("⚠️ [initSocket] 没有Token，将建立未认证连接");
try {
(a = new WebSocket(s)).onopen = function() {
r = !0;
i = n;
c = !1;
l = !1;
q("connected");
console.log("🔧 [initSocket] WebSocket 已连接, _connectionHasToken =", i);
setTimeout(function() {
if (a && a.readyState === WebSocket.OPEN) {
var e = {
type: "ping",
data: {
timestamp: Date.now()
}
};
a.send(JSON.stringify(e));
}
}, 0);
};
a.onmessage = function(e) {
try {
if (e.data instanceof Blob) {
var n = new FileReader();
n.onload = function(e) {
try {
var n = e.target.result;
if ("{" === n.trim().charAt(0)) {
var o = JSON.parse(n);
R(o);
}
} catch (e) {}
};
n.readAsText(e.data);
} else {
var o = JSON.parse(e.data);
R(o);
}
} catch (e) {
console.error("解析消息失败:", e);
}
};
a.onerror = function(n) {
console.error("WebSocket 错误:", n);
c = !1;
q("disconnected");
o.fire("connection_error", n);
if (l) {
l = !1;
setTimeout(function() {
e.initSocket();
}, 100);
}
};
a.onclose = function(n) {
r = !1;
i = !1;
c = !1;
q("disconnected");
D();
o.fire("connection_closed", n);
if (l) {
l = !1;
setTimeout(function() {
e.initSocket();
}, 100);
}
};
} catch (e) {
console.error("创建 WebSocket 失败:", e);
c = !1;
q("disconnected");
}
};
e.request_wxLogin = function(e, n) {
var o = A();
o && (r ? n && n(0, {
player_id: s,
player_name: _
}) : o.on("connection_success", function(e) {
n && n(0, e);
}));
};
e.request_creatroom = function(e, n) {
O("create_room", {}, function(e, o) {
n && n(e, {
roomid: o.room_code,
bottom: 100,
rate: 1
});
});
};
e.request_jion = function(e, n) {
O("join_room", {
room_code: e.roomid
}, function(e, o) {
0 === e ? n && n(0, {
roomid: o.room_code,
bottom: 100,
rate: 1,
gold: 1e3
}) : n && n(-1, {});
});
};
e.request_enter_room = function(e, n) {
w = n;
h && clearTimeout(h);
h = setTimeout(function() {
if (w) {
var e = w;
w = null;
e(-1, {});
}
}, 15e3);
C("quick_match", {}, null);
};
var W = function(e) {
if (w) {
var n = w;
w = null;
if (h) {
clearTimeout(h);
h = null;
}
var o = e.room_category || 1, a = (e.players || []).map(function(e, n) {
console.log("🪙 [request_enter_room] 转换玩家数据:", e.name, "gold_count=", e.gold_count, "match_coin=", e.match_coin, "arena_gold=", e.arena_gold, "avatar=", e.avatar);
return {
accountid: e.id,
nick_name: e.name,
avatarUrl: e.avatar || "avatar_1",
gold_count: e.gold_count || 0,
goldcount: e.gold_count || 0,
match_coin: e.match_coin || 0,
arena_gold: e.arena_gold || e.match_coin || 0,
period_no: e.period_no || "",
seatindex: (void 0 !== e.seat ? e.seat : n) + 1,
isready: e.ready || !1,
room_category: o
};
});
n(0, {
seatindex: e.player ? e.player.seat + 1 : 1,
playerdata: a,
roomid: e.room_code || "MATCH",
room_code: e.room_code || "MATCH",
housemanageid: e.creator_id || "",
room_category: o,
period_no: e.period_no || ""
});
}
};
e.getRoomList = function(e) {
O("get_room_list", {}, function(n, o) {
0 === n && o && o.rooms ? e && e(0, o.rooms) : e && e(-1, []);
});
};
e.createRoom = function(e, n) {
O("create_room", {}, function(e, o) {
0 === e && o ? n && n(0, o) : n && n(-1, {});
});
};
e.joinRoom = function(e, n) {
O("join_room", {
room_code: e
}, function(e, o) {
0 === e && o ? n && n(0, o) : n && n(-1, {});
});
};
e.onRoomListResult = function(e) {
var n = A();
n && n.on("room_list_result", e);
};
e.onRoomListUpdate = function(e) {
var n = A();
n && n.on("room_list_update", e);
};
e.offRoomListUpdate = function(e) {
var n = A();
n && n.off("room_list_update", e);
};
e.onRoomCreated = function(e) {
var n = A();
n && n.on("room_created", e);
};
e.onRoomJoined = function(e) {
var n = A();
n && n.on("room_joined", e);
};
e.requestReady = function() {
C("ready", {}, null);
};
e.requestStart = function(e) {
O("ready", {}, e);
};
e.requestBid = function(e) {
C("bid", {
bid: e
}, null);
};
e.requestCallLandlord = function(e) {
C("call_landlord", {
action: e
}, null);
};
e.requestRobState = function(e) {
var n = !1;
"object" == typeof e && null !== e ? n = e.bid || !1 : 1 !== e && !0 !== e || (n = !0);
C("rob", {
rob: n
}, null);
};
e.request_chu_card = function(e, n) {
var o = e.map(function(e) {
var n = e.card_data || e;
return {
suit: n.suit || 0,
rank: n.rank || 0,
color: n.color || 0
};
});
O("play_cards", {
cards: o
}, n);
};
e.request_buchu_card = function(e, n) {
O("pass", {}, n);
};
e.requestHint = function(e) {
O("hint_request", {}, e);
};
e.sendHintRequest = function() {
C("hint_request", {}, null);
};
e.onPlayerJoinRoom = function(e) {
var n = A();
n && n.on("player_joinroom_notify", e);
};
e.onPlayerReady = function(e) {
var n = A();
n && n.on("player_ready_notify", e);
};
e.onPlayerLeft = function(e) {
var n = A();
n && n.on("player_left", e);
};
e.onGameStart = function(e) {
var n = A();
n && n.on("gameStart_notify", e);
};
e.onChangeHouseManage = function(e) {
var n = A();
n && n.on("changehousemanage_notify", e);
};
e.onPushCards = function(e) {
var n = A();
n && n.on("pushcard_notify", e);
};
e.onBidTurn = function(e) {
var n = A();
n && n.on("bid_turn_notify", e);
};
e.onBidResult = function(e) {
var n = A();
n && n.on("bid_result_notify", e);
};
e.onCanRobState = function(e) {
var n = A();
n && n.on("canrob_notify", e);
};
e.onRobState = function(e) {
var n = A();
n && n.on("canrob_state_notify", e);
};
e.onCanChuCard = function(e) {
var n = A();
n && n.on("can_chu_card_notify", e);
};
e.onOtherPlayerChuCard = function(e) {
var n = A();
n && n.on("other_chucard_notify", e);
};
e.onChangeMaster = function(e) {
var n = A();
n && n.on("change_master_notify", e);
};
e.onPlayStart = function(e) {
var n = A();
n && n.on("play_start_notify", e);
};
e.onChangeShowCard = function(e) {
var n = A();
n && n.on("change_showcard_notify", e);
};
e.onGameOver = function(e) {
var n = A();
n && n.on("game_over", e);
};
e.onGameStateRestore = function(e) {
var n = A();
n && n.on("game_state_restore", e);
};
e.onCallLandlordStart = function(e) {
var n = A();
n && n.on("call_landlord_start_notify", e);
};
e.onCallLandlordTurn = function(e) {
var n = A();
n && n.on("call_landlord_turn_notify", e);
};
e.onCallLandlordResult = function(e) {
var n = A();
n && n.on("call_landlord_result_notify", e);
};
e.onCallLandlordEnd = function(e) {
var n = A();
n && n.on("call_landlord_end_notify", e);
};
e.onRestartGame = function(e) {
var n = A();
n && n.on("restart_game_notify", e);
};
e.onLandlordCards = function(e) {
var n = A();
n && n.on("landlord_cards_notify", e);
};
e.onHintResult = function(e) {
var n = A();
n && n.on("hint_result_notify", e);
};
e.onTrusteeStateNotify = function(e) {
var n = A();
n && n.on("trustee_state_notify", e);
};
e.cancelTrustee = function() {
console.log("📤 [cancelTrustee] 发送取消托管请求");
C("cancel_trustee", {});
};
e.onArenaStatus = function(e) {
var n = A();
n && n.on("arena_status_notify", e);
};
e.onArenaMatchStart = function(e) {
var n = A();
n && n.on("arena_match_start_notify", e);
};
e.onArenaCloseDialog = function(e) {
var n = A();
n && n.on("arena_close_dialog_notify", e);
};
e.onCompetitionStatus = function(e) {
var n = A();
n && n.on("competition_status_notify", e);
};
e.onCompetitionCountdown = function(e) {
var n = A();
n && n.on("competition_countdown_notify", e);
};
e.onMatchCoinUpdate = function(e) {
var n = A();
n && n.on("match_coin_update_notify", e);
};
e.onCompetitionEliminated = function(e) {
var n = A();
n && n.on("competition_eliminated_notify", e);
};
e.onCompetitionAdvance = function(e) {
var n = A();
n && n.on("competition_advance_notify", e);
};
e.onCompetitionChampion = function(e) {
var n = A();
n && n.on("competition_champion_notify", e);
};
e.onArenaSignupSuccess = function(e) {
var n = A();
n && n.on("arena_signup_success_notify", e);
};
e.offArenaSignupSuccess = function(e) {
var n = A();
n && n.off("arena_signup_success_notify", e);
};
e.onArenaSignupFailed = function(e) {
var n = A();
n && n.on("arena_signup_failed_notify", e);
};
e.offArenaSignupFailed = function(e) {
var n = A();
n && n.off("arena_signup_failed_notify", e);
};
e.onArenaCancelSuccess = function(e) {
var n = A();
n && n.on("arena_cancel_success_notify", e);
};
e.offArenaCancelSuccess = function(e) {
var n = A();
n && n.off("arena_cancel_success_notify", e);
};
e.onArenaCancelFailed = function(e) {
var n = A();
n && n.on("arena_cancel_failed_notify", e);
};
e.offArenaCancelFailed = function(e) {
var n = A();
n && n.off("arena_cancel_failed_notify", e);
};
e.sendArenaSignup = function(e) {
console.log("🏟️ [Arena] 发送 arena_signup 请求:", JSON.stringify(e));
C("arena_signup", e, null);
};
e.sendArenaCancelSignup = function(e) {
console.log("🏟️ [Arena] 发送 arena_cancel_signup 请求:", JSON.stringify(e));
C("arena_cancel_signup", e, null);
};
e.sendArenaEnter = function(e) {
console.log("🏟️ [Arena] 发送 arena_enter 请求:", JSON.stringify(e));
C("arena_enter", e, null);
};
e.requestArenaStatus = function() {
console.log("🏟️ [Arena] requestArenaStatus 被调用");
if (a && a.readyState === WebSocket.OPEN) C("get_arena_status", {}, null); else {
console.log("🏟️ [Arena] WebSocket 未连接，先初始化连接...");
if (!a || a.readyState === WebSocket.CLOSED || a.readyState === WebSocket.CLOSING) {
console.log("🏟️ [Arena] 🔌 主动初始化 WebSocket 连接...");
e.initSocket();
}
var n = A();
if (n) {
var o = function() {
console.log("🏟️ [Arena] ✅ 连接成功后请求竞技场状态");
n.off("connection_success", o);
setTimeout(function() {
C("get_arena_status", {}, null);
}, 100);
};
n.on("connection_success", o);
setTimeout(function() {
n.off("connection_success", o);
}, 5e3);
}
}
};
e.requestArenaStatusWhenConnected = function() {
console.log("🏟️ [Arena] requestArenaStatusWhenConnected 被调用");
if (a && a.readyState === WebSocket.OPEN) {
console.log("🏟️ [Arena] WebSocket 已连接，立即请求竞技场状态");
e.requestArenaStatus();
} else {
console.log("🏟️ [Arena] WebSocket 未连接，准备主动连接...");
var n = A();
if (n) {
if (!a || a.readyState === WebSocket.CLOSED || a.readyState === WebSocket.CLOSING) {
console.log("🏟️ [Arena] 🔌 主动初始化 WebSocket 连接...");
e.initSocket();
}
var o = function() {
console.log("🏟️ [Arena] ✅ WebSocket 连接成功，现在请求竞技场状态");
n.off("connection_success", o);
setTimeout(function() {
e.requestArenaStatus();
}, 100);
};
n.on("connection_success", o);
setTimeout(function() {
n.off("connection_success", o);
if (a && a.readyState === WebSocket.OPEN) {
console.log("🏟️ [Arena] 超时后检查到已连接，请求竞技场状态");
e.requestArenaStatus();
} else console.warn("🏟️ [Arena] 连接超时，WebSocket 仍未连接");
}, 5e3);
} else {
console.warn("🏟️ [Arena] eventLister 未初始化，延迟重试");
setTimeout(function() {
e.requestArenaStatusWhenConnected();
}, 500);
}
}
};
e.onShowBottomCard = function(e) {
var n = A();
n && n.on("change_showcard_notify", e);
};
e.onRoomChangeState = function(e) {
var n = A();
n && n.on("room_state_notify", e);
};
e.onRoomRestored = function(e) {
var n = A();
n && n.on("room_restored", e);
};
e.onPlayerOffline = function(e) {
var n = A();
n && n.on("player_offline_notify", e);
};
e.onPlayerOnline = function(e) {
var n = A();
n && n.on("player_online_notify", e);
};
e.isInRoom = function() {
return f;
};
e.getCurrentRoomCode = function() {
return u;
};
e.leaveRoom = function(e) {
C("leave_room", {}, null);
u = "";
f = !1;
e && e();
};
e.getPlayerInfo = function() {
return {
id: s,
name: _
};
};
e.getRoomCode = function() {
return u;
};
e.isConnected = function() {
return r;
};
e.isWebSocketOpen = function() {
return a && a.readyState === WebSocket.OPEN;
};
e.isAuthenticated = function() {
return r && i && s && s > 0;
};
e.hasConnectionToken = function() {
return i;
};
e.reconnectWithToken = function() {
var n = window.myglobal;
if (n && n.playerData && n.playerData.token) if (s && s > 0) console.log("🔧 [reconnectWithToken] 当前连接已有PlayerID:", s, "跳过重新连接"); else {
console.log("🔄 [reconnectWithToken] 关闭旧连接，重新建立带Token的连接...");
if (a) {
D();
a.close();
a = null;
r = !1;
q("disconnected");
}
setTimeout(function() {
e.initSocket();
}, 100);
} else console.log("⚠️ [reconnectWithToken] 没有Token，无法重新连接");
};
e.getPlayerId = function() {
return s;
};
var N = function() {
if (!b) {
b = !0;
g = 0;
p = Date.now();
y = setInterval(function() {
if (a && a.readyState === WebSocket.OPEN) {
var e = Date.now() - p;
e > 6e4 && console.log("⚠️ [Heartbeat] 检测到可能的心跳延迟，时间差:", Math.round(e / 1e3), "秒");
C("ping", {
timestamp: Date.now()
}, null);
p = Date.now();
m && clearTimeout(m);
m = setTimeout(function() {
g++;
console.log("⚠️ [Heartbeat] 心跳响应超时，累计:", g);
if (g >= 3) {
console.log("🔄 [Heartbeat] 连续多次心跳无响应，尝试重连...");
g = 0;
a && a.close();
x();
}
}, 5e4);
} else D();
}, 3e4);
}
}, D = function() {
b = !1;
if (y) {
clearInterval(y);
y = null;
}
if (m) {
clearTimeout(m);
m = null;
}
}, J = function() {
g = 0;
if (m) {
clearTimeout(m);
m = null;
}
}, q = function(e) {
v = e;
k.forEach(function(n) {
n(e);
});
};
e.onConnectionStateChange = function(e) {
k.push(e);
};
e.getConnectionState = function() {
return v;
};
var P = function(e) {
console.warn("🚫 强制下线:", e.message || "未知原因");
D();
a && a.close();
evt.fire("force_logout", e);
};
e.onArenaRoundCountdown = function(e) {
var n = A();
n && n.on("arena_round_countdown_notify", e);
};
e.onArenaCountdownTick = function(e) {
var n = A();
n && n.on("arena_countdown_tick_notify", e);
};
e.onArenaAutoReady = function(e) {
var n = A();
n && n.on("arena_auto_ready_notify", e);
};
e.onArenaReconnectState = function(e) {
var n = A();
n && n.on("arena_reconnect_state_notify", e);
};
e.onArenaChampionBroadcast = function(e) {
var n = A();
n && n.on("arena_champion_broadcast_notify", e);
};
e.onTournamentWaitProgress = function(e) {
var n = A();
n && n.on("tournament_wait_progress_notify", e);
};
e.onTournamentRoundAdvance = function(e) {
var n = A();
n && n.on("tournament_round_advance_notify", e);
};
e.onTournamentFinalRank = function(e) {
var n = A();
n && n.on("tournament_final_rank_notify", e);
};
e.onArenaEliminatedKick = function(e) {
var n = A();
n && n.on("arena_eliminated_kick_notify", e);
};
var E = null, L = Date.now(), I = null, x = function() {
if ("connecting" !== v) if (d) {
console.log("🔄 [AutoReconnect] 使用 token 尝试重连...");
q("connecting");
var n = S;
0 !== n.indexOf("ws://") && 0 !== n.indexOf("wss://") && (n = "ws://" + n + "/ws");
try {
var o = new WebSocket(n);
o.onopen = function() {
a = o;
r = !0;
g = 0;
console.log("✅ [AutoReconnect] WebSocket 连接成功，发送 reconnect 消息...");
C("reconnect", {
token: d,
player_id: s
}, null);
};
o.onmessage = function(e) {
try {
if (e.data instanceof Blob) {
var n = new FileReader();
n.onload = function(e) {
try {
var n = e.target.result;
if ("{" === n.trim().charAt(0)) {
var o = JSON.parse(n);
R(o);
}
} catch (e) {}
};
n.readAsText(e.data);
} else {
var o = JSON.parse(e.data);
R(o);
}
} catch (e) {
console.error("解析消息失败:", e);
}
};
o.onerror = function(e) {
console.error("🔄 [AutoReconnect] 重连失败:", e);
q("disconnected");
};
o.onclose = function() {
r = !1;
q("disconnected");
D();
};
} catch (e) {
console.error("🔄 [AutoReconnect] 创建连接失败:", e);
q("disconnected");
}
} else {
console.log("🔄 [AutoReconnect] 没有 reconnect_token，执行全新连接...");
e.initSocket();
} else console.log("🔄 [AutoReconnect] 正在重连中，跳过...");
};
e.cleanupVisibilityListener = function() {
if (E) {
document.removeEventListener("visibilitychange", E);
E = null;
}
if (I) {
clearInterval(I);
I = null;
}
};
"undefined" != typeof document && function() {
if (!E) {
E = function() {
if ("visible" === document.visibilityState) {
var e = Date.now() - L;
console.log("📱 [Visibility] 页面从后台恢复，后台时长:", Math.round(e / 1e3), "秒");
if (e < 45e3) {
console.log("📱 [Visibility] 后台时间较短，跳过连接检查");
g = 0;
return;
}
console.log("📱 [Visibility] 后台时间较长，重置心跳计数");
g = 0;
if (a && a.readyState === WebSocket.OPEN) {
console.log("📱 [Visibility] 连接正常，发送心跳确认");
C("ping", {
timestamp: Date.now()
}, null);
} else {
console.log("📱 [Visibility] 连接已断开，尝试自动重连...");
x();
}
} else {
L = Date.now();
console.log("📱 [Visibility] 页面进入后台");
}
};
document.addEventListener("visibilitychange", E);
}
}();
return e;
};