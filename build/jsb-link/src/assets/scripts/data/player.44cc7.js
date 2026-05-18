var getRandomStr = function(t) {
for (var o = "", e = 0; e < t; e++) o += Math.floor(10 * Math.random());
return o;
};

window.playerData = function() {
var t = {};
t.uniqueID = "1" + getRandomStr(6);
t.accountID = "2" + getRandomStr(6);
t.serverPlayerId = "";
t.nickName = "玩家" + getRandomStr(3);
var o = "avatar_" + (Math.floor(3 * Math.random()) + 1);
t.avatarUrl = o;
t.gobal_count = 0;
t.arena_coin = 0;
t.master_accountid = 0;
t.bottom = 100;
t.rate = 1;
t.housemanageid = "";
t.token = "";
t.phone = "";
t.loginType = 0;
t.lastSaveTime = 0;
var e = function() {
return "undefined" != typeof window.StorageUtil ? window.StorageUtil : {
savePlayerData: function(t) {
try {
localStorage.setItem("ddz_player_data", JSON.stringify(t));
return !0;
} catch (t) {
console.error("保存失败:", t);
return !1;
}
},
loadPlayerData: function() {
try {
var t = localStorage.getItem("ddz_player_data");
return t ? JSON.parse(t) : null;
} catch (t) {
return null;
}
},
clearPlayerSession: function() {
localStorage.removeItem("ddz_player_data");
localStorage.removeItem("ddz_auth_token");
},
setForceLogout: function(t) {
localStorage.setItem("ddz_force_logout", JSON.stringify({
forced: !0,
reason: t,
timestamp: Date.now()
}));
},
getForceLogout: function() {
try {
var t = JSON.parse(localStorage.getItem("ddz_force_logout"));
if (!t || !t.forced) return null;
if (Date.now() - (t.timestamp || 0) > 864e5) {
localStorage.removeItem("ddz_force_logout");
return null;
}
return t;
} catch (t) {
return null;
}
},
clearForceLogout: function() {
localStorage.removeItem("ddz_force_logout");
},
hasLocalSession: function() {
var t = this.loadPlayerData();
return !(!t || !t.token) && !(Date.now() - (t.savedAt || 0) > 6048e5);
}
};
};
t.saveToLocal = function() {
var t = e(), o = {
uniqueID: this.uniqueID,
accountID: this.accountID,
serverPlayerId: this.serverPlayerId,
nickName: this.nickName,
avatarUrl: this.avatarUrl,
gobal_count: this.gobal_count,
arena_coin: this.arena_coin,
master_accountid: this.master_accountid,
bottom: this.bottom,
rate: this.rate,
housemanageid: this.housemanageid,
token: this.token,
phone: this.phone,
loginType: this.loginType,
savedAt: Date.now(),
version: 3
}, a = t.savePlayerData(o);
if (a) {
this.lastSaveTime = Date.now();
window.StorageUtil;
} else console.warn("【playerData】saveToLocal 失败");
return a;
};
t.loadFromLocal = function() {
var t = e().loadPlayerData();
if (!t) return !1;
var o = t.savedAt || 0;
if (Date.now() - o > 6048e5) {
this.clearLocal();
return !1;
}
this.uniqueID = t.uniqueID || this.uniqueID;
this.accountID = t.accountID || this.accountID;
this.serverPlayerId = t.serverPlayerId || "";
this.nickName = t.nickName || this.nickName;
this.avatarUrl = t.avatarUrl || this.avatarUrl;
this.gobal_count = t.gobal_count || 0;
this.arena_coin = t.arena_coin || 0;
this.master_accountid = t.master_accountid || 0;
this.bottom = t.bottom || 100;
this.rate = t.rate || 1;
this.housemanageid = t.housemanageid || "";
this.token = t.token || "";
this.phone = t.phone || "";
this.loginType = t.loginType || 0;
return !0;
};
t.clearLocal = function() {
e().clearPlayerSession();
this.token = "";
this.phone = "";
this.loginType = 0;
};
t.isLoggedIn = function() {
return !!this.token && this.token.length > 0;
};
t.hasLocalSession = function() {
return e().hasLocalSession();
};
t.logout = function() {
this.callLogoutAPI();
this.token = "";
this.clearLocal();
};
t.callLogoutAPI = function() {
var t = window.defines;
if (t && t.apiUrl && this.token) try {
var o = new XMLHttpRequest();
o.open("POST", t.apiUrl + "/api/v1/auth/logout", !0);
o.setRequestHeader("Content-Type", "application/json");
o.timeout = 5e3;
o.send(JSON.stringify({
token: this.token
}));
} catch (t) {
console.warn("调用登出API失败:", t);
}
};
t.updateFromLogin = function(t) {
if (t) {
this.uniqueID = t.uniqueID || t.player_id || this.uniqueID;
this.accountID = t.accountID || t.account_id || this.accountID;
this.nickName = t.nickName || t.nickname || this.nickName;
this.avatarUrl = t.avatarUrl || t.avatar || this.avatarUrl;
this.gobal_count = t.goldCount || t.gold || t.goldcount || this.gobal_count;
this.arena_coin = t.arenaCoin || t.arena_coin || this.arena_coin;
this.token = t.token || this.token;
this.loginType = t.loginType || this.loginType;
t.phone && (this.phone = t.phone);
e().clearForceLogout();
this.saveToLocal();
}
};
t.setForceLogout = function(t) {
e().setForceLogout(t);
};
t.wasForceLoggedOut = function() {
return null !== e().getForceLogout();
};
t.getForceLogoutReason = function() {
var t = e().getForceLogout();
return t ? t.reason : "";
};
t.clearForceLogout = function() {
e().clearForceLogout();
};
t.autoSave = function() {
Date.now() - this.lastSaveTime > 3e4 && this.saveToLocal();
};
t.updateGold = function(t) {
this.gobal_count += t;
this.saveToLocal();
};
this.setGold = function(t) {
this.gobal_count = t;
this.saveToLocal();
};
t.updateArenaCoin = function(t) {
this.arena_coin += t;
this.saveToLocal();
};
t.setArenaCoin = function(t) {
this.arena_coin = t;
this.saveToLocal();
};
return t;
};