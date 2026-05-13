/**
 * 跨平台本地存储工具
 * 支持 Web 浏览器、iOS App、Android App
 * 使用 Cocos Creator 的 cc.sys.localStorage API
 */

var StorageUtil = {};

// 存储键名常量
StorageUtil.KEYS = {
    PLAYER_DATA: 'ddz_player_data',
    AUTH_TOKEN: 'ddz_auth_token',
    USER_SETTINGS: 'ddz_user_settings',
    FORCE_LOGOUT: 'ddz_force_logout'
};

// 存储类型检测
StorageUtil.getStorageType = function() {
    if (typeof cc === 'undefined') {
        return 'unknown';
    }
    
    // cc.sys.platform 判断平台
    var platform = cc.sys.platform;
    
    if (platform === cc.sys.WECHAT_GAME) {
        return 'wechat';
    } else if (platform === cc.sys.ANDROID) {
        return 'android';
    } else if (platform === cc.sys.IPHONE || platform === cc.sys.IPAD) {
        return 'ios';
    } else if (platform === cc.sys.MAC_OS) {
        return 'mac';
    } else if (platform === cc.sys.WIN32) {
        return 'windows';
    } else if (cc.sys.isBrowser) {
        return 'browser';
    } else if (cc.sys.isNative) {
        return 'native';
    }
    
    return 'unknown';
};

// 是否为原生平台（打包成 App）
StorageUtil.isNativeApp = function() {
    if (typeof cc === 'undefined') {
        return false;
    }
    return cc.sys.isNative;
};

// 是否为浏览器平台
StorageUtil.isBrowser = function() {
    if (typeof cc === 'undefined') {
        return typeof window !== 'undefined';
    }
    return cc.sys.isBrowser;
};

// ==================== 核心存储方法 ====================

/**
 * 存储数据
 * @param {string} key - 存储键名
 * @param {any} value - 存储值（对象会自动 JSON 序列化）
 * @returns {boolean} 是否成功
 */
StorageUtil.setItem = function(key, value) {
    try {
        var dataStr;
        
        if (typeof value === 'object') {
            dataStr = JSON.stringify(value);
        } else {
            dataStr = String(value);
        }
        
        // 优先使用 Cocos Creator 的跨平台存储 API
        if (typeof cc !== 'undefined' && cc.sys && cc.sys.localStorage) {
            cc.sys.localStorage.setItem(key, dataStr);
            return true;
        }
        
        // 降级到浏览器 localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, dataStr);
            return true;
        }
        
        // 原生平台没有 localStorage 时，尝试使用 jsb 存储
        if (typeof jsb !== 'undefined' && jsb.fileUtils) {
            var filePath = this._getNativeFilePath(key);
            jsb.fileUtils.writeStringToFile(dataStr, filePath);
            return true;
        }
        
        console.warn("[StorageUtil] 无可用的存储方式");
        return false;
    } catch (e) {
        console.error("[StorageUtil] 存储失败:", key, e);
        return false;
    }
};

/**
 * 读取数据
 * @param {string} key - 存储键名
 * @param {any} defaultValue - 默认值
 * @param {boolean} parseJson - 是否尝试解析 JSON
 * @returns {any} 存储值
 */
StorageUtil.getItem = function(key, defaultValue, parseJson) {
    defaultValue = defaultValue !== undefined ? defaultValue : null;
    parseJson = parseJson !== undefined ? parseJson : true;
    
    try {
        var dataStr = null;
        
        // 优先使用 Cocos Creator 的跨平台存储 API
        if (typeof cc !== 'undefined' && cc.sys && cc.sys.localStorage) {
            dataStr = cc.sys.localStorage.getItem(key);
        }
        
        // 降级到浏览器 localStorage
        if (dataStr === null && typeof localStorage !== 'undefined') {
            dataStr = localStorage.getItem(key);
        }
        
        // 原生平台文件存储
        if (dataStr === null && typeof jsb !== 'undefined' && jsb.fileUtils) {
            var filePath = this._getNativeFilePath(key);
            if (jsb.fileUtils.isFileExist(filePath)) {
                dataStr = jsb.fileUtils.getStringFromFile(filePath);
            }
        }
        
        if (dataStr === null || dataStr === undefined) {
            return defaultValue;
        }
        
        // 尝试解析 JSON
        if (parseJson) {
            try {
                return JSON.parse(dataStr);
            } catch (e) {
                // 不是 JSON 格式，直接返回字符串
                return dataStr;
            }
        }
        
        return dataStr;
    } catch (e) {
        console.error("[StorageUtil] 读取失败:", key, e);
        return defaultValue;
    }
};

/**
 * 删除数据
 * @param {string} key - 存储键名
 * @returns {boolean} 是否成功
 */
StorageUtil.removeItem = function(key) {
    try {
        // Cocos Creator
        if (typeof cc !== 'undefined' && cc.sys && cc.sys.localStorage) {
            cc.sys.localStorage.removeItem(key);
        }
        
        // 浏览器 localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(key);
        }
        
        // 原生平台文件存储
        if (typeof jsb !== 'undefined' && jsb.fileUtils) {
            var filePath = this._getNativeFilePath(key);
            if (jsb.fileUtils.isFileExist(filePath)) {
                jsb.fileUtils.removeFile(filePath);
            }
        }
        
        return true;
    } catch (e) {
        console.error("[StorageUtil] 删除失败:", key, e);
        return false;
    }
};

/**
 * 清除所有应用数据
 * @returns {boolean} 是否成功
 */
StorageUtil.clearAll = function() {
    try {
        var keys = StorageUtil.KEYS;
        for (var k in keys) {
            if (keys.hasOwnProperty(k)) {
                StorageUtil.removeItem(keys[k]);
            }
        }
        return true;
    } catch (e) {
        console.error("[StorageUtil] 清除失败:", e);
        return false;
    }
};

// ==================== 玩家数据专用方法 ====================

/**
 * 保存玩家数据
 * @param {object} playerData - 玩家数据对象
 */
StorageUtil.savePlayerData = function(playerData) {
    if (!playerData) return false;
    
    var data = {
        uniqueID: playerData.uniqueID || "",
        accountID: playerData.accountID || "",
        nickName: playerData.nickName || "",
        avatarUrl: playerData.avatarUrl || "",
        gobal_count: playerData.gobal_count || 0,
        token: playerData.token || "",
        phone: playerData.phone || "",
        loginType: playerData.loginType || 0,
        savedAt: Date.now(),
        version: 2 // 数据版本号，便于后续迁移
    };
    
    return StorageUtil.setItem(StorageUtil.KEYS.PLAYER_DATA, data);
};

/**
 * 加载玩家数据
 * @returns {object|null} 玩家数据对象或 null
 */
StorageUtil.loadPlayerData = function() {
    var data = StorageUtil.getItem(StorageUtil.KEYS.PLAYER_DATA, null, true);
    
    console.log("【StorageUtil】loadPlayerData 读取到数据:", data ? JSON.stringify(data) : "null");
    
    if (!data) {
        return null;
    }
    
    // 检查数据版本 - 如果没有version字段，仍然返回数据（兼容旧数据）
    // if (!data.version || data.version < 2) {
    //     // 可以在这里添加数据迁移逻辑
    // }
    
    // 检查是否过期（7天）- 如果没有savedAt字段，仍然返回数据
    var savedAt = data.savedAt || 0;
    if (savedAt > 0) {
        var expireTime = 7 * 24 * 60 * 60 * 1000; // 7天
        if (Date.now() - savedAt > expireTime) {
            console.log("【StorageUtil】数据已过期，清除");
            StorageUtil.removeItem(StorageUtil.KEYS.PLAYER_DATA);
            StorageUtil.removeItem(StorageUtil.KEYS.AUTH_TOKEN);
            return null;
        }
    }
    
    console.log("【StorageUtil】返回数据, nickName =", data.nickName);
    return data;
};

/**
 * 检查是否有本地登录会话
 * @returns {boolean}
 */
StorageUtil.hasLocalSession = function() {
    var data = StorageUtil.loadPlayerData();
    if (!data) return false;
    if (!data.token) return false;
    
    // 检查是否过期
    var savedAt = data.savedAt || 0;
    var expireTime = 7 * 24 * 60 * 60 * 1000; // 7天
    if (Date.now() - savedAt > expireTime) {
        return false;
    }
    
    return true;
};

/**
 * 清除玩家登录状态
 */
StorageUtil.clearPlayerSession = function() {
    StorageUtil.removeItem(StorageUtil.KEYS.PLAYER_DATA);
    StorageUtil.removeItem(StorageUtil.KEYS.AUTH_TOKEN);
};

// ==================== 强制下线标记 ====================

/**
 * 设置强制下线标记
 * @param {string} reason - 下线原因
 */
StorageUtil.setForceLogout = function(reason) {
    var data = {
        forced: true,
        reason: reason || "您已被强制下线",
        timestamp: Date.now()
    };
    StorageUtil.setItem(StorageUtil.KEYS.FORCE_LOGOUT, data);
};

/**
 * 检查是否被强制下线
 * @returns {object|null} { forced: boolean, reason: string, timestamp: number }
 */
StorageUtil.getForceLogout = function() {
    var data = StorageUtil.getItem(StorageUtil.KEYS.FORCE_LOGOUT, null, true);
    if (!data || !data.forced) return null;
    
    // 强制下线标记有效期 24 小时
    var expireTime = 24 * 60 * 60 * 1000;
    if (Date.now() - (data.timestamp || 0) > expireTime) {
        StorageUtil.clearForceLogout();
        return null;
    }
    
    return data;
};

/**
 * 清除强制下线标记
 */
StorageUtil.clearForceLogout = function() {
    StorageUtil.removeItem(StorageUtil.KEYS.FORCE_LOGOUT);
};

// ==================== 辅助方法 ====================

/**
 * 获取原生平台文件路径
 * @private
 */
StorageUtil._getNativeFilePath = function(key) {
    if (typeof jsb === 'undefined' || !jsb.fileUtils) {
        return '';
    }
    
    var writablePath = jsb.fileUtils.getWritablePath();
    return writablePath + 'ddz_' + key + '.dat';
};

/**
 * 获取存储信息
 * @returns {object} 存储统计信息
 */
StorageUtil.getStorageInfo = function() {
    return {
        platform: StorageUtil.getStorageType(),
        isNative: StorageUtil.isNativeApp(),
        isBrowser: StorageUtil.isBrowser(),
        hasSession: StorageUtil.hasLocalSession(),
        forceLogout: StorageUtil.getForceLogout()
    };
};

// 设置全局变量
window.StorageUtil = StorageUtil;

