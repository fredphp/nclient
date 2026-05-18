var HttpAPI = {
generateNonce: function(t) {
for (var e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", n = "", r = 0; r < t; r++) n += e.charAt(Math.floor(Math.random() * e.length));
return n;
},
encryptAESGCM: function(t, e) {
return new Promise(function(n, r) {
try {
for (var o = new Uint8Array(32), a = 0; a < 32 && a < e.length; a++) o[a] = e.charCodeAt(a);
var c = new Uint8Array(12);
if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(c); else for (var s = 0; s < 12; s++) c[s] = Math.floor(256 * Math.random());
var l = new TextEncoder("utf-8").encode(t);
crypto.subtle.importKey("raw", o, {
name: "AES-GCM"
}, !1, [ "encrypt" ]).then(function(t) {
return crypto.subtle.encrypt({
name: "AES-GCM",
iv: c,
tagLength: 128
}, t, l);
}).then(function(t) {
var e = new Uint8Array(t), r = new Uint8Array(c.length + e.length);
r.set(c, 0);
r.set(e, c.length);
var o = btoa(String.fromCharCode.apply(null, r));
n(o);
}).catch(function(t) {
console.error("加密失败 - 错误:", t);
r(t);
});
} catch (t) {
console.error("加密异常:", t);
r(t);
}
});
},
decryptAESGCM: function(t, e) {
return new Promise(function(n, r) {
try {
for (var o = atob(t), a = o.length, c = new Uint8Array(a), s = 0; s < a; s++) c[s] = o.charCodeAt(s);
var l = c.slice(0, 12), i = c.slice(12), u = new Uint8Array(32);
for (s = 0; s < 32 && s < e.length; s++) u[s] = e.charCodeAt(s);
crypto.subtle.importKey("raw", u, {
name: "AES-GCM"
}, !1, [ "decrypt" ]).then(function(t) {
return crypto.subtle.decrypt({
name: "AES-GCM",
iv: l,
tagLength: 128
}, t, i);
}).then(function(t) {
var e = new TextDecoder("utf-8").decode(t);
n(JSON.parse(e));
}).catch(function(t) {
console.error("解密失败 - 错误:", t);
r(t);
});
} catch (t) {
console.error("解密异常:", t);
r(t);
}
});
},
get: function(t, e, n) {
var r = new XMLHttpRequest();
r.open("GET", t, !0);
r.setRequestHeader("Content-Type", "application/json");
r.timeout = 1e4;
r.onreadystatechange = function() {
if (4 === r.readyState) if (r.status >= 200 && r.status < 300) try {
var t = JSON.parse(r.responseText);
t.data && t.timestamp && "string" == typeof t.data ? HttpAPI.decryptAESGCM(t.data, e).then(function(t) {
n(null, t);
}).catch(function(t) {
console.error("解密失败:", t);
n("解密失败: " + t.message, null);
}) : n(null, t);
} catch (t) {
n("解析响应失败: " + t.message, null);
} else n("请求失败: HTTP " + r.status, null);
};
r.ontimeout = function() {
n("请求超时", null);
};
r.onerror = function() {
n("网络错误", null);
};
r.send();
},
post: function(t, e, n, r) {
var o = new XMLHttpRequest();
o.open("POST", t, !0);
o.setRequestHeader("Content-Type", "application/json");
o.timeout = 1e4;
o.onreadystatechange = function() {
if (4 === o.readyState) if (o.status >= 200 && o.status < 300) try {
var t = JSON.parse(o.responseText);
t.data && t.timestamp && "string" == typeof t.data ? HttpAPI.decryptAESGCM(t.data, n).then(function(t) {
r(null, t);
}).catch(function(t) {
console.error("HttpAPI.post - 解密失败:", t);
r("解密失败: " + (t.message || t), null);
}) : r(null, t);
} catch (t) {
console.error("HttpAPI.post - 解析响应失败:", t);
r("解析响应失败: " + t.message, null);
} else r("请求失败: HTTP " + o.status, null);
};
o.ontimeout = function() {
console.error("HttpAPI.post - 请求超时");
r("请求超时", null);
};
o.onerror = function(t) {
console.error("HttpAPI.post - 网络错误:", t);
r("网络错误", null);
};
o.send(JSON.stringify(e || {}));
},
getUserAgreement: function(t, e, n) {
if (HttpAPI._userAgreementCache) n(null, HttpAPI._userAgreementCache); else {
try {
var r = localStorage.getItem("user_agreement_cache");
if (r) {
var o = JSON.parse(r);
HttpAPI._userAgreementCache = o;
n(null, o);
return;
}
} catch (t) {}
HttpAPI.get(t + "/api/v1/user-agreement/latest", e, function(t, e) {
if (t) {
console.warn("获取用户协议API失败:", t);
n(t, null);
} else if (e && 0 === e.code && e.data) {
HttpAPI._userAgreementCache = e.data;
try {
localStorage.setItem("user_agreement_cache", JSON.stringify(e.data));
} catch (t) {}
n(null, e.data);
} else if (e && e.data) {
HttpAPI._userAgreementCache = e.data;
try {
localStorage.setItem("user_agreement_cache", JSON.stringify(e.data));
} catch (t) {}
n(null, e.data);
} else {
console.warn("用户协议数据格式无效:", e);
n(e ? e.message : "获取用户协议失败", null);
}
});
}
},
clearUserAgreementCache: function() {
HttpAPI._userAgreementCache = null;
try {
localStorage.removeItem("user_agreement_cache");
} catch (t) {}
},
getRoomConfigList: function(t, e, n) {
if (HttpAPI._roomConfigCache) n(null, HttpAPI._roomConfigCache); else {
try {
var r = localStorage.getItem("room_config_cache");
if (r) {
var o = JSON.parse(r);
HttpAPI._roomConfigCache = o;
n(null, o);
return;
}
} catch (t) {}
HttpAPI.get(t + "/api/v1/room/config/list", e, function(t, e) {
if (t) {
console.warn("获取房间配置API失败:", t);
n(t, null);
} else if (e && 0 === e.code && e.data) {
HttpAPI._roomConfigCache = e.data;
try {
localStorage.setItem("room_config_cache", JSON.stringify(e.data));
} catch (t) {}
n(null, e.data);
} else if (e && Array.isArray(e)) {
HttpAPI._roomConfigCache = e;
try {
localStorage.setItem("room_config_cache", JSON.stringify(e));
} catch (t) {}
n(null, e);
} else {
console.warn("房间配置数据格式无效:", e);
n(e ? e.message : "获取房间配置失败", null);
}
});
}
},
clearRoomConfigCache: function() {
HttpAPI._roomConfigCache = null;
try {
localStorage.removeItem("room_config_cache");
} catch (t) {}
},
checkPlayerEntry: function(t, e, n, r, o) {
var a = t + "/api/v1/room/check-entry?player_id=" + e + "&room_type=" + n;
HttpAPI.get(a, r, function(t, e) {
t ? o(t, null) : e && 0 === e.code && e.data ? o(null, e.data) : e && void 0 !== e.can_enter ? o(null, e) : o(e ? e.message : "检查入场条件失败", null);
});
},
postEncrypted: function(t, e, n, r, o) {
var a = {
action: e,
params: n || {}
}, c = JSON.stringify(a);
HttpAPI.encryptAESGCM(c, r).then(function(e) {
var n = {
data: e,
timestamp: Date.now(),
nonce: HttpAPI.generateNonce(16)
}, a = new XMLHttpRequest();
a.open("POST", t, !0);
a.setRequestHeader("Content-Type", "application/json");
a.timeout = 1e4;
a.onreadystatechange = function() {
if (4 === a.readyState) if (a.status >= 200 && a.status < 300) try {
var t = JSON.parse(a.responseText);
t.data && t.timestamp && "string" == typeof t.data ? HttpAPI.decryptAESGCM(t.data, r).then(function(t) {
o(null, t);
}).catch(function(t) {
console.error("HttpAPI.postEncrypted - 解密失败:", t);
o("解密失败: " + (t.message || t), null);
}) : o(null, t);
} catch (t) {
console.error("HttpAPI.postEncrypted - 解析响应失败:", t);
o("解析响应失败: " + t.message, null);
} else o("请求失败: HTTP " + a.status, null);
};
a.ontimeout = function() {
console.error("HttpAPI.postEncrypted - 请求超时");
o("请求超时", null);
};
a.onerror = function(t) {
console.error("HttpAPI.postEncrypted - 网络错误:", t);
o("网络错误", null);
};
a.send(JSON.stringify(n));
}).catch(function(t) {
console.error("HttpAPI.postEncrypted - 加密失败:", t);
o("加密失败: " + (t.message || t), null);
});
}
};

window.HttpAPI = HttpAPI;