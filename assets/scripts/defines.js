// 斗地主配置文件
// 纯全局变量方式，不使用 module.exports

var defines = {};

// Go 后端 WebSocket 地址（生产环境）
// 开发环境请改为: ws://localhost:1780/ws
defines.serverUrl = "wss://apis.hongxiu88.com/ws";

// Go 后端 HTTP API 地址（生产环境）
defines.apiUrl = "https://apis.hongxiu88.com";

// API 数据加密密钥（与服务端配置一致，必须是32字节）
defines.cryptoKey = "qqddz2026gameaes256secretkey123!";

// 设置全局变量
window.defines = defines;

// 房间状态（与服务端一致）
// 服务端定义：
// RoomStateWaiting  = 0  // 等待中
// RoomStateReady    = 1  // 准备中
// RoomStateBidding  = 2  // 叫地主阶段
// RoomStatePlaying  = 3  // 游戏中（出牌阶段）
// RoomStateFinished = 4  // 已结算
// RoomStateEnded    = 5  // 已结束
window.RoomState = {
    ROOM_INVALID: -1,
    ROOM_WAITREADY: 0,  // 等待中（服务端 RoomStateWaiting）
    ROOM_GAMESTART: 1,  // 准备中（服务端 RoomStateReady）
    ROOM_PUSHCARD: 2,   // 叫地主阶段（服务端 RoomStateBidding）
    ROOM_ROBSTATE: 2,   // 叫地主阶段（服务端 RoomStateBidding，与 ROOM_PUSHCARD 相同）
    ROOM_SHOWBOTTOMCARD: 2, // 叫地主阶段
    ROOM_PLAYING: 3,    // 出牌阶段（服务端 RoomStatePlaying）
    ROOM_FINISHED: 4,   // 已结算
    ROOM_ENDED: 5,      // 已结束
};

// 抢地主状态
window.qian_state = {
    "buqiang": 0,
    "qian": 1,
};

// 创建房间配置
window.createRoomConfig = {
    'rate_1': { needCostGold: 10, bottom: 1, rate: 1 },
    'rate_2': { needCostGold: 100, bottom: 10, rate: 2 },
    'rate_3': { needCostGold: 200, bottom: 20, rate: 3 },
    'rate_4': { needCostGold: 500, bottom: 50, rate: 4 }
};

// 牌型定义
window.CardsValue = {
    'one': { name: 'One', value: 1 },
    'double': { name: 'Double', value: 1 },
    'three': { name: 'Three', value: 1 },
    'boom': { name: 'Boom', value: 2 },
    'threeWithOne': { name: 'ThreeWithOne', value: 1 },
    'threeWithTwo': { name: 'ThreeWithTwo', value: 1 },
    'plane': { name: 'Plane', value: 1 },
    'planeWithOne': { name: 'PlaneWithOne', value: 1 },
    'planeWithTwo': { name: 'PlaneWithTwo', value: 1 },
    'scroll': { name: 'Scroll', value: 1 },
    'doubleScroll': { name: 'DoubleScroll', value: 1 },
    'kingboom': { name: 'kingboom', value: 3 },
};

// 音效开关
window.isopen_sound = 1;

