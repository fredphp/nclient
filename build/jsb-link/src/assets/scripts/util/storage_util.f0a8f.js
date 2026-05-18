var StorageUtil = {
KEYS: {
PLAYER_DATA: "ddz_player_data",
AUTH_TOKEN: "ddz_auth_token",
USER_SETTINGS: "ddz_user_settings",
FORCE_LOGOUT: "ddz_force_logout"
},
getStorageType: function() {
if ("undefined" == typeof cc) return "unknown";
var e = cc.sys.platform;
return e === cc.sys.WECHAT_GAME ? "wechat" : e === cc.sys.ANDROID ? "android" : e === cc.sys.IPHONE || e === cc.sys.IPAD ? "ios" : e === cc.sys.MAC_OS ? "mac" : e === cc.sys.WIN32 ? "windows" : cc.sys.isBrowser ? "browser" : cc.sys.isNative ? "native" : "unknown";
},
isNativeApp: function() {
return "undefined" != typeof cc && cc.sys.isNative;
},
isBrowser: function() {
return "undefined" == typeof cc ? "undefined" != typeof window : cc.sys.isBrowser;
},
setItem: function(e, t) {
try {
var r;
r = "object" == typeof t ? JSON.stringify(t) : String(t);
if ("undefined" != typeof cc && cc.sys && cc.sys.localStorage) {
cc.sys.localStorage.setItem(e, r);
return !0;
}
if ("undefined" != typeof localStorage) {
localStorage.setItem(e, r);
return !0;
}
if ("undefined" != typeof jsb && jsb.fileUtils) {
var o = this._getNativeFilePath(e);
jsb.fileUtils.writeStringToFile(r, o);
return !0;
}
console.warn("[StorageUtil] 无可用的存储方式");
return !1;
} catch (t) {
console.error("[StorageUtil] 存储失败:", e, t);
return !1;
}
},
getItem: function(e, t, r) {
t = void 0 !== t ? t : null;
r = void 0 === r || r;
try {
var o = null;
"undefined" != typeof cc && cc.sys && cc.sys.localStorage && (o = cc.sys.localStorage.getItem(e));
null === o && "undefined" != typeof localStorage && (o = localStorage.getItem(e));
if (null === o && "undefined" != typeof jsb && jsb.fileUtils) {
var i = this._getNativeFilePath(e);
jsb.fileUtils.isFileExist(i) && (o = jsb.fileUtils.getStringFromFile(i));
}
if (null == o) return t;
if (r) try {
return JSON.parse(o);
} catch (e) {
return o;
}
return o;
} catch (r) {
console.error("[StorageUtil] 读取失败:", e, r);
return t;
}
},
removeItem: function(e) {
try {
"undefined" != typeof cc && cc.sys && cc.sys.localStorage && cc.sys.localStorage.removeItem(e);
"undefined" != typeof localStorage && localStorage.removeItem(e);
if ("undefined" != typeof jsb && jsb.fileUtils) {
var t = this._getNativeFilePath(e);
jsb.fileUtils.isFileExist(t) && jsb.fileUtils.removeFile(t);
}
return !0;
} catch (t) {
console.error("[StorageUtil] 删除失败:", e, t);
return !1;
}
},
clearAll: function() {
try {
var e = StorageUtil.KEYS;
for (var t in e) e.hasOwnProperty(t) && StorageUtil.removeItem(e[t]);
return !0;
} catch (e) {
console.error("[StorageUtil] 清除失败:", e);
return !1;
}
},
savePlayerData: function(e) {
if (!e) return !1;
var t = {
uniqueID: e.uniqueID || "",
accountID: e.accountID || "",
nickName: e.nickName || "",
avatarUrl: e.avatarUrl || "",
gobal_count: e.gobal_count || 0,
token: e.token || "",
phone: e.phone || "",
loginType: e.loginType || 0,
savedAt: Date.now(),
version: 2
};
return StorageUtil.setItem(StorageUtil.KEYS.PLAYER_DATA, t);
},
loadPlayerData: function() {
var e = StorageUtil.getItem(StorageUtil.KEYS.PLAYER_DATA, null, !0);
console.log("【StorageUtil】loadPlayerData 读取到数据:", e ? JSON.stringify(e) : "null");
if (!e) return null;
var t = e.savedAt || 0;
if (t > 0 && Date.now() - t > 6048e5) {
console.log("【StorageUtil】数据已过期，清除");
StorageUtil.removeItem(StorageUtil.KEYS.PLAYER_DATA);
StorageUtil.removeItem(StorageUtil.KEYS.AUTH_TOKEN);
return null;
}
console.log("【StorageUtil】返回数据, nickName =", e.nickName);
return e;
},
hasLocalSession: function() {
var e = StorageUtil.loadPlayerData();
if (!e) return !1;
if (!e.token) return !1;
var t = e.savedAt || 0;
return !(Date.now() - t > 6048e5);
},
clearPlayerSession: function() {
StorageUtil.removeItem(StorageUtil.KEYS.PLAYER_DATA);
StorageUtil.removeItem(StorageUtil.KEYS.AUTH_TOKEN);
},
setForceLogout: function(e) {
var t = {
forced: !0,
reason: e || "您已被强制下线",
timestamp: Date.now()
};
StorageUtil.setItem(StorageUtil.KEYS.FORCE_LOGOUT, t);
},
getForceLogout: function() {
var e = StorageUtil.getItem(StorageUtil.KEYS.FORCE_LOGOUT, null, !0);
if (!e || !e.forced) return null;
if (Date.now() - (e.timestamp || 0) > 864e5) {
StorageUtil.clearForceLogout();
return null;
}
return e;
},
clearForceLogout: function() {
StorageUtil.removeItem(StorageUtil.KEYS.FORCE_LOGOUT);
},
_getNativeFilePath: function(e) {
return "undefined" != typeof jsb && jsb.fileUtils ? jsb.fileUtils.getWritablePath() + "ddz_" + e + ".dat" : "";
},
getStorageInfo: function() {
return {
platform: StorageUtil.getStorageType(),
isNative: StorageUtil.isNativeApp(),
isBrowser: StorageUtil.isBrowser(),
hasSession: StorageUtil.hasLocalSession(),
forceLogout: StorageUtil.getForceLogout()
};
}
};

window.StorageUtil = StorageUtil;