// HTTP API 工具模块
// 用于与服务器HTTP API通信，支持AES-GCM加密解密

var HttpAPI = {};

// 生成随机字符串
HttpAPI.generateNonce = function(length) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// AES-GCM 加密函数 (使用Web Crypto API)
HttpAPI.encryptAESGCM = function(plaintext, keyString) {
    return new Promise(function(resolve, reject) {
        try {

            // 准备密钥 (32字节)
            var keyBytes = new Uint8Array(32);
            for (var i = 0; i < 32 && i < keyString.length; i++) {
                keyBytes[i] = keyString.charCodeAt(i);
            }

            // 生成随机nonce (12字节)
            var nonce = new Uint8Array(12);
            if (window.crypto && window.crypto.getRandomValues) {
                window.crypto.getRandomValues(nonce);
            } else {
                // 降级方案
                for (var j = 0; j < 12; j++) {
                    nonce[j] = Math.floor(Math.random() * 256);
                }
            }

            // 将明文转换为Uint8Array
            var encoder = new TextEncoder('utf-8');
            var data = encoder.encode(plaintext);

            // 使用Web Crypto API加密
            crypto.subtle.importKey(
                'raw',
                keyBytes,
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            ).then(function(cryptoKey) {
                return crypto.subtle.encrypt(
                    {
                        name: 'AES-GCM',
                        iv: nonce,
                        tagLength: 128
                    },
                    cryptoKey,
                    data
                );
            }).then(function(encrypted) {
                // 将nonce和密文合并
                var encryptedArray = new Uint8Array(encrypted);
                var result = new Uint8Array(nonce.length + encryptedArray.length);
                result.set(nonce, 0);
                result.set(encryptedArray, nonce.length);

                // Base64编码
                var base64 = btoa(String.fromCharCode.apply(null, result));
                resolve(base64);
            }).catch(function(err) {
                console.error("加密失败 - 错误:", err);
                reject(err);
            });
        } catch (e) {
            console.error("加密异常:", e);
            reject(e);
        }
    });
};

// AES-GCM 解密函数 (使用Web Crypto API)
HttpAPI.decryptAESGCM = function(encryptedBase64, keyString) {
    return new Promise(function(resolve, reject) {
        try {
            
            // Base64 解码
            var raw = atob(encryptedBase64);
            
            // 将字符串转换为Uint8Array
            var rawLength = raw.length;
            var encrypted = new Uint8Array(rawLength);
            for (var i = 0; i < rawLength; i++) {
                encrypted[i] = raw.charCodeAt(i);
            }
            
            
            // 获取nonce (前12字节)
            var nonce = encrypted.slice(0, 12);
            var ciphertext = encrypted.slice(12);
            
            
            // 准备密钥 (32字节)
            var keyBytes = new Uint8Array(32);
            for (var i = 0; i < 32 && i < keyString.length; i++) {
                keyBytes[i] = keyString.charCodeAt(i);
            }
            
            // 使用Web Crypto API解密
            crypto.subtle.importKey(
                'raw',
                keyBytes,
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            ).then(function(cryptoKey) {
                return crypto.subtle.decrypt(
                    {
                        name: 'AES-GCM',
                        iv: nonce,
                        tagLength: 128
                    },
                    cryptoKey,
                    ciphertext
                );
            }).then(function(decrypted) {
                var decoder = new TextDecoder('utf-8');
                var jsonStr = decoder.decode(decrypted);
                resolve(JSON.parse(jsonStr));
            }).catch(function(err) {
                console.error("解密失败 - 错误:", err);
                reject(err);
            });
        } catch (e) {
            console.error("解密异常:", e);
            reject(e);
        }
    });
};

// 发送GET请求并解密响应
HttpAPI.get = function(url, cryptoKey, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    // 设置超时时间
    xhr.timeout = 10000; // 10秒超时
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    
                    // 检查是否是加密响应
                    if (response.data && response.timestamp && typeof response.data === 'string') {
                        // 加密响应，需要解密
                        HttpAPI.decryptAESGCM(response.data, cryptoKey).then(function(decrypted) {
                            callback(null, decrypted);
                        }).catch(function(err) {
                            console.error('解密失败:', err);
                            callback('解密失败: ' + err.message, null);
                        });
                    } else {
                        // 未加密响应，直接返回
                        callback(null, response);
                    }
                } catch (e) {
                    callback('解析响应失败: ' + e.message, null);
                }
            } else {
                callback('请求失败: HTTP ' + xhr.status, null);
            }
        }
    };
    
    xhr.ontimeout = function() {
        callback('请求超时', null);
    };
    
    xhr.onerror = function() {
        callback('网络错误', null);
    };
    
    xhr.send();
};

// 发送POST请求
HttpAPI.post = function(url, data, cryptoKey, callback) {
    
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    // 设置超时时间
    xhr.timeout = 10000; // 10秒超时
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    
                    // 检查是否是加密响应
                    if (response.data && response.timestamp && typeof response.data === 'string') {
                        // 加密响应，需要解密
                        HttpAPI.decryptAESGCM(response.data, cryptoKey).then(function(decrypted) {
                            callback(null, decrypted);
                        }).catch(function(err) {
                            console.error('HttpAPI.post - 解密失败:', err);
                            callback('解密失败: ' + (err.message || err), null);
                        });
                    } else {
                        // 未加密响应，直接返回
                        callback(null, response);
                    }
                } catch (e) {
                    console.error('HttpAPI.post - 解析响应失败:', e);
                    callback('解析响应失败: ' + e.message, null);
                }
            } else {
                callback('请求失败: HTTP ' + xhr.status, null);
            }
        }
    };
    
    xhr.ontimeout = function() {
        console.error("HttpAPI.post - 请求超时");
        callback('请求超时', null);
    };
    
    xhr.onerror = function(e) {
        console.error("HttpAPI.post - 网络错误:", e);
        callback('网络错误', null);
    };
    
    xhr.send(JSON.stringify(data || {}));
};

// 获取用户协议（带缓存）
// 重要：无论成功或失败，都会调用 callback
HttpAPI.getUserAgreement = function(apiUrl, cryptoKey, callback) {
    // 检查内存缓存
    if (HttpAPI._userAgreementCache) {
        callback(null, HttpAPI._userAgreementCache);
        return;
    }
    
    // 尝试从localStorage加载缓存
    try {
        var cached = localStorage.getItem('user_agreement_cache');
        if (cached) {
            var cacheData = JSON.parse(cached);
            HttpAPI._userAgreementCache = cacheData;
            callback(null, cacheData);
            return;
        }
    } catch (e) {
        // 忽略缓存错误
    }
    
    // 从服务器获取（带解密）
    
    HttpAPI.get(
        apiUrl + '/api/v1/user-agreement/latest',
        cryptoKey,
        function(err, result) {
            if (err) {
                console.warn("获取用户协议API失败:", err);
                // 返回错误，但让调用者决定如何显示
                callback(err, null);
                return;
            }
            
            // result 已经是解密后的数据
            if (result && result.code === 0 && result.data) {
                // 缓存结果
                HttpAPI._userAgreementCache = result.data;
                try {
                    localStorage.setItem('user_agreement_cache', JSON.stringify(result.data));
                } catch (e) {
                    // 忽略缓存错误
                }
                callback(null, result.data);
            } else if (result && result.data) {
                // 兼容解密后直接返回data的情况
                HttpAPI._userAgreementCache = result.data;
                try {
                    localStorage.setItem('user_agreement_cache', JSON.stringify(result.data));
                } catch (e) {
                    // 忽略缓存错误
                }
                callback(null, result.data);
            } else {
                console.warn("用户协议数据格式无效:", result);
                callback(result ? result.message : '获取用户协议失败', null);
            }
        }
    );
};

// 清除用户协议缓存
HttpAPI.clearUserAgreementCache = function() {
    HttpAPI._userAgreementCache = null;
    try {
        localStorage.removeItem('user_agreement_cache');
    } catch (e) {
        // 忽略错误
    }
};

// 获取房间配置列表（带缓存）
HttpAPI.getRoomConfigList = function(apiUrl, cryptoKey, callback) {
    // 检查内存缓存
    if (HttpAPI._roomConfigCache) {
        callback(null, HttpAPI._roomConfigCache);
        return;
    }
    
    // 尝试从localStorage加载缓存
    try {
        var cached = localStorage.getItem('room_config_cache');
        if (cached) {
            var cacheData = JSON.parse(cached);
            HttpAPI._roomConfigCache = cacheData;
            callback(null, cacheData);
            return;
        }
    } catch (e) {
        // 忽略缓存错误
    }
    
    // 从服务器获取
    
    HttpAPI.get(
        apiUrl + '/api/v1/room/config/list',
        cryptoKey,
        function(err, result) {
            if (err) {
                console.warn("获取房间配置API失败:", err);
                callback(err, null);
                return;
            }
            
            // result 已经是解密后的数据
            if (result && result.code === 0 && result.data) {
                // 缓存结果
                HttpAPI._roomConfigCache = result.data;
                try {
                    localStorage.setItem('room_config_cache', JSON.stringify(result.data));
                } catch (e) {
                    // 忽略缓存错误
                }
                callback(null, result.data);
            } else if (result && Array.isArray(result)) {
                // 兼容直接返回数组的情况
                HttpAPI._roomConfigCache = result;
                try {
                    localStorage.setItem('room_config_cache', JSON.stringify(result));
                } catch (e) {
                    // 忽略缓存错误
                }
                callback(null, result);
            } else {
                console.warn("房间配置数据格式无效:", result);
                callback(result ? result.message : '获取房间配置失败', null);
            }
        }
    );
};

// 清除房间配置缓存
HttpAPI.clearRoomConfigCache = function() {
    HttpAPI._roomConfigCache = null;
    try {
        localStorage.removeItem('room_config_cache');
    } catch (e) {
        // 忽略错误
    }
};

// 检查玩家是否可以进入房间
HttpAPI.checkPlayerEntry = function(apiUrl, playerId, roomType, cryptoKey, callback) {
    var url = apiUrl + '/api/v1/room/check-entry?player_id=' + playerId + '&room_type=' + roomType;
    
    HttpAPI.get(url, cryptoKey, function(err, result) {
        if (err) {
            callback(err, null);
            return;
        }
        
        if (result && result.code === 0 && result.data) {
            callback(null, result.data);
        } else if (result && result.can_enter !== undefined) {
            // 兼容直接返回结果的情况
            callback(null, result);
        } else {
            callback(result ? result.message : '检查入场条件失败', null);
        }
    });
};

// 发送加密POST请求
// action: 请求动作名称
// params: 请求参数
// cryptoKey: 加密密钥
// callback: 回调函数
HttpAPI.postEncrypted = function(url, action, params, cryptoKey, callback) {

    // 构造请求数据
    var requestData = {
        action: action,
        params: params || {}
    };
    var plaintext = JSON.stringify(requestData);

    // 加密请求数据
    HttpAPI.encryptAESGCM(plaintext, cryptoKey).then(function(encryptedData) {
        // 构造加密请求结构
        var encryptedRequest = {
            data: encryptedData,
            timestamp: Date.now(),
            nonce: HttpAPI.generateNonce(16)
        };


        var xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 10000; // 10秒超时

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {

                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        var response = JSON.parse(xhr.responseText);

                        // 检查是否是加密响应
                        if (response.data && response.timestamp && typeof response.data === 'string') {
                            HttpAPI.decryptAESGCM(response.data, cryptoKey).then(function(decrypted) {
                                callback(null, decrypted);
                            }).catch(function(err) {
                                console.error('HttpAPI.postEncrypted - 解密失败:', err);
                                callback('解密失败: ' + (err.message || err), null);
                            });
                        } else {
                            callback(null, response);
                        }
                    } catch (e) {
                        console.error('HttpAPI.postEncrypted - 解析响应失败:', e);
                        callback('解析响应失败: ' + e.message, null);
                    }
                } else {
                    callback('请求失败: HTTP ' + xhr.status, null);
                }
            }
        };

        xhr.ontimeout = function() {
            console.error("HttpAPI.postEncrypted - 请求超时");
            callback('请求超时', null);
        };

        xhr.onerror = function(e) {
            console.error("HttpAPI.postEncrypted - 网络错误:", e);
            callback('网络错误', null);
        };

        xhr.send(JSON.stringify(encryptedRequest));
    }).catch(function(err) {
        console.error("HttpAPI.postEncrypted - 加密失败:", err);
        callback('加密失败: ' + (err.message || err), null);
    });
};

// 设置全局变量
window.HttpAPI = HttpAPI;

