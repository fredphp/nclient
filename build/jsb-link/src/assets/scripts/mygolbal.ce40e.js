(function() {
"use strict";
(function() {
var e = console.log;
console.log = function() {
for (var t = Array.prototype.slice.call(arguments), i = 0; i < t.length; i++) if ("string" == typeof t[i] && (-1 !== t[i].indexOf("[Action update]") || -1 !== t[i].indexOf("override me") || -1 !== t[i].indexOf("032CCDebug"))) return;
return e.apply(console, arguments);
};
var t = function() {
if ("undefined" != typeof cc && cc.Action) {
if (cc.Action.prototype.update) {
var e = cc.Action.prototype.update.toString();
-1 === e.indexOf("override me") && -1 === e.indexOf("CCDebug") || (cc.Action.prototype.update = function() {});
}
} else setTimeout(t, 100);
};
"complete" === document.readyState ? setTimeout(t, 500) : window.addEventListener("load", function() {
setTimeout(t, 500);
});
})();
if (!window.myglobal) {
var e = {
socket: null,
playerData: null,
eventlister: null,
_initialized: !1,
_forceLogout: !1,
_forceLogoutReason: "",
cdnUrl: "https://apis.hongxiu88.com",
_onlineStatusListeners: [],
_isOnline: !0,
_connectionCheckInterval: null,
_tokenCheckInterval: null,
_lastActivityTime: Date.now(),
_inactiveTimeout: 18e5,
_checkDependencies: function() {
var e = [];
"undefined" == typeof window.socketCtr && e.push("socketCtr (socket_ctr.js)");
"undefined" == typeof window.playerData && e.push("playerData (player.js)");
"undefined" == typeof window.eventLister && e.push("eventLister (event_lister.js)");
return !(e.length > 0);
},
init: function() {
if (this._initialized) return !0;
if (!this._checkDependencies()) return !1;
try {
this.socket = window.socketCtr();
this.playerData = window.playerData();
this.eventlister = window.eventLister({});
this._initialized = !0;
window.defines && window.defines.cdnUrl && (this.cdnUrl = window.defines.cdnUrl);
this.playerData.loadFromLocal() ? console.log("【myglobal】从本地存储恢复玩家数据成功, nickName =", this.playerData.nickName) : console.log("【myglobal】本地存储无玩家数据");
return !0;
} catch (e) {
console.error("myglobal 初始化失败:", e);
return !1;
}
},
autoInit: function() {
var e = this, t = 0, i = function() {
t++;
e.init() || (t < 20 ? setTimeout(i, 100) : console.error("myglobal 自动初始化失败，请检查依赖脚本是否正确加载"));
};
setTimeout(i, 100);
},
hasLocalSession: function() {
return !!this.playerData && this.playerData.hasLocalSession();
},
isLoggedIn: function() {
return !!this.playerData && this.playerData.isLoggedIn();
},
onLoginSuccess: function(e) {
this.playerData && this.playerData.updateFromLogin(e);
this._forceLogout = !1;
this._forceLogoutReason = "";
if (this.socket && this.socket.initSocket) {
console.log("🔧 [myglobal] 登录成功后检查WebSocket连接状态...");
this.socket.initSocket();
}
},
logout: function() {
this.playerData && this.playerData.logout();
this._forceLogout = !1;
this._forceLogoutReason = "";
this.socket && this.socket.disconnect && this.socket.disconnect();
"undefined" != typeof cc && cc.director && cc.director.loadScene("loginScene");
},
onForceLogout: function(e) {
this._forceLogout = !0;
this._forceLogoutReason = e || "您已被强制下线";
console.warn("⚠️ 用户被强制下线:", e);
this.playerData && this.playerData.clearLocal();
this.socket && this.socket.disconnect && this.socket.disconnect();
this.showForceLogoutMessage(e);
},
showForceLogoutMessage: function(e) {
var t = e || "您已被管理员强制下线";
if ("undefined" != typeof cc) setTimeout(function() {
alert(t + "\n\n请重新登录");
cc.director && cc.director.loadScene("loginScene");
}, 100); else {
alert(t + "\n\n请重新登录");
window.location.reload();
}
},
wasForceLoggedOut: function() {
return this._forceLogout;
},
getForceLogoutReason: function() {
return this._forceLogoutReason;
},
verifyToken: function(e) {
var t = this;
if (this.playerData && this.playerData.token) {
var i = window.defines;
if (i && i.apiUrl) {
var n = window.HttpAPI;
if (n) {
var o = i.cryptoKey || "";
n.post(i.apiUrl + "/api/v1/auth/verify-token", {
token: this.playerData.token,
player_id: this.playerData.uniqueID
}, o, function(i, n) {
if (i) e(!0, "使用本地缓存"); else if (n && 0 === n.code && n.data) if (n.data.valid) {
n.data.player && t.playerData.updateFromLogin(n.data.player);
e(!0, "Token有效");
} else {
t.playerData.clearLocal();
e(!1, n.data.message || "Token无效");
} else if (n && void 0 !== n.valid) if (n.valid) {
n.player && t.playerData.updateFromLogin(n.player);
e(!0, "Token有效");
} else {
t.playerData.clearLocal();
e(!1, n.message || "Token无效");
} else e(!0, "使用本地缓存");
});
} else this._verifyTokenWithXHR(e);
} else e(!0, "无API配置，使用本地缓存");
} else e(!1, "无登录凭证");
},
_verifyTokenWithXHR: function(e) {
var t = this, i = window.defines, n = new XMLHttpRequest();
n.open("POST", i.apiUrl + "/api/v1/auth/verify-token", !0);
n.setRequestHeader("Content-Type", "application/json");
n.timeout = 1e4;
n.onreadystatechange = function() {
if (4 === n.readyState) if (n.status >= 200 && n.status < 300) try {
var i = JSON.parse(n.responseText);
if (i.data && i.timestamp && "string" == typeof i.data) {
e(!0, "使用本地缓存");
return;
}
if (0 === i.code && i.data) if (i.data.valid) {
i.data.player && t.playerData.updateFromLogin(i.data.player);
e(!0, "Token有效");
} else {
t.playerData.clearLocal();
e(!1, i.data.message || "Token无效");
} else e(!0, "使用本地缓存");
} catch (t) {
e(!0, "使用本地缓存");
} else if (404 === n.status) e(!0, "使用本地缓存"); else if (401 === n.status || 403 === n.status) {
t.playerData.clearLocal();
e(!1, "Token无效或已过期");
} else e(!0, "使用本地缓存");
};
n.onerror = function() {
e(!0, "使用本地缓存");
};
n.ontimeout = function() {
e(!0, "使用本地缓存");
};
n.send(JSON.stringify({
token: this.playerData.token,
player_id: this.playerData.uniqueID
}));
},
startOnlineMonitoring: function() {
var e = this;
this.stopOnlineMonitoring();
this._lastActivityTime = Date.now();
this._isInitializing = !0;
this._initTimeout = setTimeout(function() {
e._isInitializing = !1;
}, 1e4);
if ("undefined" != typeof window) {
var t = function() {
e._lastActivityTime = Date.now();
};
window.addEventListener("mousedown", t);
window.addEventListener("keydown", t);
window.addEventListener("touchstart", t);
window.addEventListener("scroll", t);
this._activityListeners = {
mousedown: t,
keydown: t,
touchstart: t,
scroll: t
};
}
this._connectionCheckInterval = setInterval(function() {
e._checkOnlineStatus();
}, 1e4);
this._tokenCheckInterval = setInterval(function() {
e._checkTokenValidity();
}, 3e5);
if (this.socket && this.socket.addStateListener) {
this._socketStateListener = function(t) {
if ("connected" === t) {
e._isInitializing = !1;
if (e._initTimeout) {
clearTimeout(e._initTimeout);
e._initTimeout = null;
}
e._setOnlineStatus(!0);
} else "disconnected" === t && (e._isInitializing || e._setOnlineStatus(!1));
};
this.socket.addStateListener(this._socketStateListener);
}
if (this.eventlister) {
this.eventlister.on("heartbeat_success", function() {
e._lastActivityTime = Date.now();
e._setOnlineStatus(!0);
});
this.eventlister.on("auto_reconnect_success", function() {
console.log("✅ [mygolbal] 自动重连成功，更新在线状态");
e._lastActivityTime = Date.now();
e._setOnlineStatus(!0);
});
this.eventlister.on("connection_lost", function(t) {
console.warn("💔 连接丢失:", t.reason);
e._setOnlineStatus(!1);
e._handleConnectionLost();
});
}
},
stopOnlineMonitoring: function() {
if (this._initTimeout) {
clearTimeout(this._initTimeout);
this._initTimeout = null;
}
this._isInitializing = !1;
if (this._connectionCheckInterval) {
clearInterval(this._connectionCheckInterval);
this._connectionCheckInterval = null;
}
if (this._tokenCheckInterval) {
clearInterval(this._tokenCheckInterval);
this._tokenCheckInterval = null;
}
if ("undefined" != typeof window && this._activityListeners) {
window.removeEventListener("mousedown", this._activityListeners.mousedown);
window.removeEventListener("keydown", this._activityListeners.keydown);
window.removeEventListener("touchstart", this._activityListeners.touchstart);
window.removeEventListener("scroll", this._activityListeners.scroll);
this._activityListeners = null;
}
if (this.socket && this.socket.removeStateListener && this._socketStateListener) {
this.socket.removeStateListener(this._socketStateListener);
this._socketStateListener = null;
}
},
_checkOnlineStatus: function() {
if (!this._isInitializing) {
var e = !1;
this.socket && this.socket.isWebSocketOpen && (e = this.socket.isWebSocketOpen());
var t = this.socket && this.socket.isConnected && this.socket.isConnected(), i = e || t;
if (!i && this._isOnline) {
var n = this;
this._offlineCheckTimer || (this._offlineCheckTimer = setTimeout(function() {
!(n.socket && n.socket.isWebSocketOpen && n.socket.isWebSocketOpen()) && n._setOnlineStatus(!1);
n._offlineCheckTimer = null;
}, 3e3));
} else if (i) {
if (this._offlineCheckTimer) {
clearTimeout(this._offlineCheckTimer);
this._offlineCheckTimer = null;
}
this._setOnlineStatus(!0);
}
}
},
_checkTokenValidity: function() {
var e = this;
this.playerData && this.playerData.token && this.verifyToken(function(t, i) {
if (!t) {
console.warn("⚠️ Token 已失效:", i);
e._handleTokenExpired();
}
});
},
_setOnlineStatus: function(e) {
if (this._isOnline !== e) {
this._isOnline = e;
for (var t = 0; t < this._onlineStatusListeners.length; t++) try {
this._onlineStatusListeners[t](e);
} catch (e) {
console.error("在线状态监听器执行错误:", e);
}
this.eventlister && this.eventlister.fire("online_status_changed", {
isOnline: e
});
}
},
addOnlineStatusListener: function(e) {
if ("function" == typeof e) {
this._onlineStatusListeners.push(e);
this._isInitializing ? e(!0) : e(this._isOnline);
}
},
removeOnlineStatusListener: function(e) {
for (var t = this._onlineStatusListeners.length - 1; t >= 0; t--) this._onlineStatusListeners[t] === e && this._onlineStatusListeners.splice(t, 1);
},
isOnline: function() {
return this._isOnline;
},
onConnectionLost: function() {
console.warn("💔 检测到连接丢失");
this._setOnlineStatus(!1);
this.showConnectionLostMessage();
},
showConnectionLostMessage: function() {
if ("undefined" != typeof cc) {
"function" == typeof alert && alert("网络连接已断开，请检查网络后重试");
this._tryReconnect();
} else {
alert("网络连接已断开，请检查网络后重试");
window.location.reload();
}
},
_tryReconnect: function() {
var e = this, t = 0, i = function() {
t++;
if (e.socket && e.socket.initSocket) {
e.socket.initSocket();
setTimeout(function() {
if (e.socket.isConnected && e.socket.isConnected()) e._setOnlineStatus(!0); else if (t < 3) setTimeout(i, 2e3); else {
console.error("❌ 重新连接失败");
"undefined" != typeof cc && cc.director && cc.director.loadScene("loginScene");
}
}, 3e3);
}
};
i();
},
_handleTokenExpired: function() {
console.warn("⚠️ Token 已过期，需要重新登录");
this.playerData && this.playerData.clearLocal();
"function" == typeof alert && alert("登录已过期，请重新登录");
this.stopOnlineMonitoring();
"undefined" != typeof cc && cc.director && cc.director.loadScene("loginScene");
},
updateActivity: function() {
this._lastActivityTime = Date.now();
}
};
window.myglobal = e;
"undefined" != typeof window && ("complete" === document.readyState ? e.autoInit() : window.addEventListener("load", function() {
e.autoInit();
}));
}
})();