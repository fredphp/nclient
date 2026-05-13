"use strict";
cc._RF.push(module, '7bce5zzoXI04qsNEuZ579+P', 'creatroom');
// scripts/hallscene/prefabs_script/creatroom.js

"use strict";

// 创建房间脚本
cc.Class({
  "extends": cc.Component,
  properties: {// 房间配置选项可以在这里添加
  },
  // LIFE-CYCLE CALLBACKS:
  onLoad: function onLoad() {// 初始化
  },
  start: function start() {// 开始
  },
  // 按钮点击事件处理
  onButtonClick: function onButtonClick(event, customData) {
    var myglobal = window.myglobal;

    if (!myglobal || !myglobal.socket) {
      console.error("socket 未连接");
      return;
    }

    switch (customData) {
      case "create_room_1":
        this._createRoom(1); // 房间配置ID = 1


        break;

      case "create_room_2":
        this._createRoom(2); // 房间配置ID = 2


        break;

      case "create_room_3":
        this._createRoom(3); // 房间配置ID = 3


        break;

      case "create_room_4":
        this._createRoom(4); // 房间配置ID = 4


        break;

      case "create_room_close":
        this.node.destroy();
        break;

      default:
        break;
    }
  },
  _createRoom: function _createRoom(roomConfigId) {
    var myglobal = window.myglobal;

    if (myglobal && myglobal.socket) {
      // 发送创建房间请求，携带房间配置ID
      myglobal.socket.createRoom(roomConfigId, function (result, data) {
        if (result === 0) {
          // 保存房间信息到 playerData
          myglobal.playerData.roomid = data.room_code;
          myglobal.playerData.bottom = 100;
          myglobal.playerData.rate = 1; // 保存重连信息到 localStorage

          myglobal.socket.saveReconnectInfo(); // 🚀【性能优化】跳转到游戏场景（已预加载，应秒进）

          var startTime = Date.now();
          cc.director.loadScene("gameScene", function (err) {
            if (err) {
              console.error("🚀 [创建房间] 加载游戏场景失败:", err);
              return;
            }

            var elapsed = Date.now() - startTime;
          });
        } else {
          console.error("创建房间失败");
        }
      });
    }
  }
});

cc._RF.pop();