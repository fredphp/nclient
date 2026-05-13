
                (function() {
                    var nodeEnv = typeof require !== 'undefined' && typeof process !== 'undefined';
                    var __module = nodeEnv ? module : {exports:{}};
                    var __filename = 'preview-scripts/assets/scripts/hallscene/prefabs_script/creatroom.js';
                    var __require = nodeEnv ? function (request) {
                        return cc.require(request);
                    } : function (request) {
                        return __quick_compile_project__.require(request, __filename);
                    };
                    function __define (exports, require, module) {
                        if (!nodeEnv) {__quick_compile_project__.registerModule(__filename, module);}"use strict";
cc._RF.push(module, '7bce5zzoXI04qsNEuZ579+P', 'creatroom');
// scripts/hallscene/prefabs_script/creatroom.js

"use strict";

// 创建房间脚本

cc.Class({
  "extends": cc.Component,
  properties: {
    // 房间配置选项可以在这里添加
  },
  // LIFE-CYCLE CALLBACKS:
  onLoad: function onLoad() {
    // 初始化
  },
  start: function start() {
    // 开始
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
          myglobal.playerData.rate = 1;

          // 保存重连信息到 localStorage
          myglobal.socket.saveReconnectInfo();

          // 🚀【性能优化】跳转到游戏场景（已预加载，应秒进）
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
                    }
                    if (nodeEnv) {
                        __define(__module.exports, __require, __module);
                    }
                    else {
                        __quick_compile_project__.registerModuleFunc(__filename, function () {
                            __define(__module.exports, __require, __module);
                        });
                    }
                })();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0c1xcc2NyaXB0c1xcaGFsbHNjZW5lXFxwcmVmYWJzX3NjcmlwdFxcY3JlYXRyb29tLmpzIl0sIm5hbWVzIjpbImNjIiwiQ2xhc3MiLCJDb21wb25lbnQiLCJwcm9wZXJ0aWVzIiwib25Mb2FkIiwic3RhcnQiLCJvbkJ1dHRvbkNsaWNrIiwiZXZlbnQiLCJjdXN0b21EYXRhIiwibXlnbG9iYWwiLCJ3aW5kb3ciLCJzb2NrZXQiLCJjb25zb2xlIiwiZXJyb3IiLCJfY3JlYXRlUm9vbSIsIm5vZGUiLCJkZXN0cm95Iiwicm9vbUNvbmZpZ0lkIiwiY3JlYXRlUm9vbSIsInJlc3VsdCIsImRhdGEiLCJwbGF5ZXJEYXRhIiwicm9vbWlkIiwicm9vbV9jb2RlIiwiYm90dG9tIiwicmF0ZSIsInNhdmVSZWNvbm5lY3RJbmZvIiwic3RhcnRUaW1lIiwiRGF0ZSIsIm5vdyIsImRpcmVjdG9yIiwibG9hZFNjZW5lIiwiZXJyIiwiZWxhcHNlZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFFQUEsRUFBRSxDQUFDQyxLQUFLLENBQUM7RUFDTCxXQUFTRCxFQUFFLENBQUNFLFNBQVM7RUFFckJDLFVBQVUsRUFBRTtJQUNSO0VBQUEsQ0FDSDtFQUVEO0VBRUFDLE1BQU0sV0FBQUEsT0FBQSxFQUFJO0lBQ047RUFBQSxDQUNIO0VBRURDLEtBQUssV0FBQUEsTUFBQSxFQUFJO0lBQ0w7RUFBQSxDQUNIO0VBRUQ7RUFDQUMsYUFBYSxXQUFBQSxjQUFDQyxLQUFLLEVBQUVDLFVBQVUsRUFBRTtJQUM3QixJQUFJQyxRQUFRLEdBQUdDLE1BQU0sQ0FBQ0QsUUFBUTtJQUM5QixJQUFJLENBQUNBLFFBQVEsSUFBSSxDQUFDQSxRQUFRLENBQUNFLE1BQU0sRUFBRTtNQUMvQkMsT0FBTyxDQUFDQyxLQUFLLENBQUMsWUFBWSxDQUFDO01BQzNCO0lBQ0o7SUFFQSxRQUFRTCxVQUFVO01BQ2QsS0FBSyxlQUFlO1FBQ2hCLElBQUksQ0FBQ00sV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUU7UUFDdEI7TUFDSixLQUFLLGVBQWU7UUFDaEIsSUFBSSxDQUFDQSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRTtRQUN0QjtNQUNKLEtBQUssZUFBZTtRQUNoQixJQUFJLENBQUNBLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFO1FBQ3RCO01BQ0osS0FBSyxlQUFlO1FBQ2hCLElBQUksQ0FBQ0EsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUU7UUFDdEI7TUFDSixLQUFLLG1CQUFtQjtRQUNwQixJQUFJLENBQUNDLElBQUksQ0FBQ0MsT0FBTyxFQUFFO1FBQ25CO01BQ0o7UUFDSTtJQUFNO0VBRWxCLENBQUM7RUFFREYsV0FBVyxXQUFBQSxZQUFDRyxZQUFZLEVBQUU7SUFDdEIsSUFBSVIsUUFBUSxHQUFHQyxNQUFNLENBQUNELFFBQVE7SUFDOUIsSUFBSUEsUUFBUSxJQUFJQSxRQUFRLENBQUNFLE1BQU0sRUFBRTtNQUM3QjtNQUNBRixRQUFRLENBQUNFLE1BQU0sQ0FBQ08sVUFBVSxDQUFDRCxZQUFZLEVBQUUsVUFBU0UsTUFBTSxFQUFFQyxJQUFJLEVBQUU7UUFDNUQsSUFBSUQsTUFBTSxLQUFLLENBQUMsRUFBRTtVQUVkO1VBQ0FWLFFBQVEsQ0FBQ1ksVUFBVSxDQUFDQyxNQUFNLEdBQUdGLElBQUksQ0FBQ0csU0FBUztVQUMzQ2QsUUFBUSxDQUFDWSxVQUFVLENBQUNHLE1BQU0sR0FBRyxHQUFHO1VBQ2hDZixRQUFRLENBQUNZLFVBQVUsQ0FBQ0ksSUFBSSxHQUFHLENBQUM7O1VBRTVCO1VBQ0FoQixRQUFRLENBQUNFLE1BQU0sQ0FBQ2UsaUJBQWlCLEVBQUU7O1VBRW5DO1VBQ0EsSUFBSUMsU0FBUyxHQUFHQyxJQUFJLENBQUNDLEdBQUcsRUFBRTtVQUMxQjdCLEVBQUUsQ0FBQzhCLFFBQVEsQ0FBQ0MsU0FBUyxDQUFDLFdBQVcsRUFBRSxVQUFTQyxHQUFHLEVBQUU7WUFDN0MsSUFBSUEsR0FBRyxFQUFFO2NBQ0xwQixPQUFPLENBQUNDLEtBQUssQ0FBQyxxQkFBcUIsRUFBRW1CLEdBQUcsQ0FBQztjQUN6QztZQUNKO1lBQ0EsSUFBSUMsT0FBTyxHQUFHTCxJQUFJLENBQUNDLEdBQUcsRUFBRSxHQUFHRixTQUFTO1VBQ3hDLENBQUMsQ0FBQztRQUNOLENBQUMsTUFBTTtVQUNIZixPQUFPLENBQUNDLEtBQUssQ0FBQyxRQUFRLENBQUM7UUFDM0I7TUFDSixDQUFDLENBQUM7SUFDTjtFQUNKO0FBQ0osQ0FBQyxDQUFDIiwic291cmNlUm9vdCI6Ii8iLCJzb3VyY2VzQ29udGVudCI6WyIvLyDliJvlu7rmiL/pl7TohJrmnKxcblxuY2MuQ2xhc3Moe1xuICAgIGV4dGVuZHM6IGNjLkNvbXBvbmVudCxcblxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgLy8g5oi/6Ze06YWN572u6YCJ6aG55Y+v5Lul5Zyo6L+Z6YeM5re75YqgXG4gICAgfSxcblxuICAgIC8vIExJRkUtQ1lDTEUgQ0FMTEJBQ0tTOlxuXG4gICAgb25Mb2FkICgpIHtcbiAgICAgICAgLy8g5Yid5aeL5YyWXG4gICAgfSxcblxuICAgIHN0YXJ0ICgpIHtcbiAgICAgICAgLy8g5byA5aeLXG4gICAgfSxcblxuICAgIC8vIOaMiemSrueCueWHu+S6i+S7tuWkhOeQhlxuICAgIG9uQnV0dG9uQ2xpY2soZXZlbnQsIGN1c3RvbURhdGEpIHtcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICBpZiAoIW15Z2xvYmFsIHx8ICFteWdsb2JhbC5zb2NrZXQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzb2NrZXQg5pyq6L+e5o6lXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoIChjdXN0b21EYXRhKSB7XG4gICAgICAgICAgICBjYXNlIFwiY3JlYXRlX3Jvb21fMVwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVJvb20oMSk7ICAvLyDmiL/pl7TphY3nva5JRCA9IDFcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJjcmVhdGVfcm9vbV8yXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5fY3JlYXRlUm9vbSgyKTsgIC8vIOaIv+mXtOmFjee9rklEID0gMlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImNyZWF0ZV9yb29tXzNcIjpcbiAgICAgICAgICAgICAgICB0aGlzLl9jcmVhdGVSb29tKDMpOyAgLy8g5oi/6Ze06YWN572uSUQgPSAzXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiY3JlYXRlX3Jvb21fNFwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVJvb20oNCk7ICAvLyDmiL/pl7TphY3nva5JRCA9IDRcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJjcmVhdGVfcm9vbV9jbG9zZVwiOlxuICAgICAgICAgICAgICAgIHRoaXMubm9kZS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9jcmVhdGVSb29tKHJvb21Db25maWdJZCkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWw7XG4gICAgICAgIGlmIChteWdsb2JhbCAmJiBteWdsb2JhbC5zb2NrZXQpIHtcbiAgICAgICAgICAgIC8vIOWPkemAgeWIm+W7uuaIv+mXtOivt+axgu+8jOaQuuW4puaIv+mXtOmFjee9rklEXG4gICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQuY3JlYXRlUm9vbShyb29tQ29uZmlnSWQsIGZ1bmN0aW9uKHJlc3VsdCwgZGF0YSkge1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOS/neWtmOaIv+mXtOS/oeaBr+WIsCBwbGF5ZXJEYXRhXG4gICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEucm9vbWlkID0gZGF0YS5yb29tX2NvZGVcbiAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YS5ib3R0b20gPSAxMDBcbiAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YS5yYXRlID0gMVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5L+d5a2Y6YeN6L+e5L+h5oGv5YiwIGxvY2FsU3RvcmFnZVxuICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQuc2F2ZVJlY29ubmVjdEluZm8oKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g8J+agOOAkOaAp+iDveS8mOWMluOAkei3s+i9rOWIsOa4uOaIj+WcuuaZr++8iOW3sumihOWKoOi9ve+8jOW6lOenkui/m++8iVxuICAgICAgICAgICAgICAgICAgICB2YXIgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwiZ2FtZVNjZW5lXCIsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn5qAIFvliJvlu7rmiL/pl7RdIOWKoOi9vea4uOaIj+WcuuaZr+Wksei0pTpcIiwgZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWxhcHNlZCA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLliJvlu7rmiL/pl7TlpLHotKVcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcbiJdfQ==