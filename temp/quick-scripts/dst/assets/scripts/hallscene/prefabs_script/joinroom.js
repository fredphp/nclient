
                (function() {
                    var nodeEnv = typeof require !== 'undefined' && typeof process !== 'undefined';
                    var __module = nodeEnv ? module : {exports:{}};
                    var __filename = 'preview-scripts/assets/scripts/hallscene/prefabs_script/joinroom.js';
                    var __require = nodeEnv ? function (request) {
                        return cc.require(request);
                    } : function (request) {
                        return __quick_compile_project__.require(request, __filename);
                    };
                    function __define (exports, require, module) {
                        if (!nodeEnv) {__quick_compile_project__.registerModule(__filename, module);}"use strict";
cc._RF.push(module, 'f5be7jebVDi+qr1Px4nfSdB', 'joinroom');
// scripts/hallscene/prefabs_script/joinroom.js

"use strict";

// 加入房间脚本

cc.Class({
  "extends": cc.Component,
  properties: {
    room_id_input: {
      type: cc.EditBox,
      "default": null
    }
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
      case "join_room_confirm":
        this._joinRoom();
        break;
      case "join_room_close":
        this.node.destroy();
        break;
      default:
        break;
    }
  },
  _joinRoom: function _joinRoom() {
    var myglobal = window.myglobal;
    if (this.room_id_input && myglobal && myglobal.socket) {
      var roomId = this.room_id_input.string;
      if (roomId && roomId.length > 0) {
        // 发送加入房间请求
        // myglobal.socket.joinRoom(roomId);
      } else {}
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0c1xcc2NyaXB0c1xcaGFsbHNjZW5lXFxwcmVmYWJzX3NjcmlwdFxcam9pbnJvb20uanMiXSwibmFtZXMiOlsiY2MiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJyb29tX2lkX2lucHV0IiwidHlwZSIsIkVkaXRCb3giLCJvbkxvYWQiLCJzdGFydCIsIm9uQnV0dG9uQ2xpY2siLCJldmVudCIsImN1c3RvbURhdGEiLCJteWdsb2JhbCIsIndpbmRvdyIsInNvY2tldCIsImNvbnNvbGUiLCJlcnJvciIsIl9qb2luUm9vbSIsIm5vZGUiLCJkZXN0cm95Iiwicm9vbUlkIiwic3RyaW5nIiwibGVuZ3RoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztBQUVBQSxFQUFFLENBQUNDLEtBQUssQ0FBQztFQUNMLFdBQVNELEVBQUUsQ0FBQ0UsU0FBUztFQUVyQkMsVUFBVSxFQUFFO0lBQ1JDLGFBQWEsRUFBRTtNQUNYQyxJQUFJLEVBQUVMLEVBQUUsQ0FBQ00sT0FBTztNQUNoQixXQUFTO0lBQ2I7RUFDSixDQUFDO0VBRUQ7RUFFQUMsTUFBTSxXQUFBQSxPQUFBLEVBQUk7SUFDTjtFQUFBLENBQ0g7RUFFREMsS0FBSyxXQUFBQSxNQUFBLEVBQUk7SUFDTDtFQUFBLENBQ0g7RUFFRDtFQUNBQyxhQUFhLFdBQUFBLGNBQUNDLEtBQUssRUFBRUMsVUFBVSxFQUFFO0lBQzdCLElBQUlDLFFBQVEsR0FBR0MsTUFBTSxDQUFDRCxRQUFRO0lBQzlCLElBQUksQ0FBQ0EsUUFBUSxJQUFJLENBQUNBLFFBQVEsQ0FBQ0UsTUFBTSxFQUFFO01BQy9CQyxPQUFPLENBQUNDLEtBQUssQ0FBQyxZQUFZLENBQUM7TUFDM0I7SUFDSjtJQUVBLFFBQVFMLFVBQVU7TUFDZCxLQUFLLG1CQUFtQjtRQUNwQixJQUFJLENBQUNNLFNBQVMsRUFBRTtRQUNoQjtNQUNKLEtBQUssaUJBQWlCO1FBQ2xCLElBQUksQ0FBQ0MsSUFBSSxDQUFDQyxPQUFPLEVBQUU7UUFDbkI7TUFDSjtRQUNJO0lBQU07RUFFbEIsQ0FBQztFQUVERixTQUFTLFdBQUFBLFVBQUEsRUFBRztJQUNSLElBQUlMLFFBQVEsR0FBR0MsTUFBTSxDQUFDRCxRQUFRO0lBQzlCLElBQUksSUFBSSxDQUFDUixhQUFhLElBQUlRLFFBQVEsSUFBSUEsUUFBUSxDQUFDRSxNQUFNLEVBQUU7TUFDbkQsSUFBSU0sTUFBTSxHQUFHLElBQUksQ0FBQ2hCLGFBQWEsQ0FBQ2lCLE1BQU07TUFDdEMsSUFBSUQsTUFBTSxJQUFJQSxNQUFNLENBQUNFLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDN0I7UUFDQTtNQUFBLENBQ0gsTUFBTSxDQUNQO0lBQ0o7RUFDSjtBQUNKLENBQUMsQ0FBQyIsInNvdXJjZVJvb3QiOiIvIiwic291cmNlc0NvbnRlbnQiOlsiLy8g5Yqg5YWl5oi/6Ze06ISa5pysXG5cbmNjLkNsYXNzKHtcbiAgICBleHRlbmRzOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIHJvb21faWRfaW5wdXQ6IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLkVkaXRCb3gsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8gTElGRS1DWUNMRSBDQUxMQkFDS1M6XG5cbiAgICBvbkxvYWQgKCkge1xuICAgICAgICAvLyDliJ3lp4vljJZcbiAgICB9LFxuXG4gICAgc3RhcnQgKCkge1xuICAgICAgICAvLyDlvIDlp4tcbiAgICB9LFxuXG4gICAgLy8g5oyJ6ZKu54K55Ye75LqL5Lu25aSE55CGXG4gICAgb25CdXR0b25DbGljayhldmVudCwgY3VzdG9tRGF0YSkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWw7XG4gICAgICAgIGlmICghbXlnbG9iYWwgfHwgIW15Z2xvYmFsLnNvY2tldCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcInNvY2tldCDmnKrov57mjqVcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKGN1c3RvbURhdGEpIHtcbiAgICAgICAgICAgIGNhc2UgXCJqb2luX3Jvb21fY29uZmlybVwiOlxuICAgICAgICAgICAgICAgIHRoaXMuX2pvaW5Sb29tKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiam9pbl9yb29tX2Nsb3NlXCI6XG4gICAgICAgICAgICAgICAgdGhpcy5ub2RlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2pvaW5Sb29tKCkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWw7XG4gICAgICAgIGlmICh0aGlzLnJvb21faWRfaW5wdXQgJiYgbXlnbG9iYWwgJiYgbXlnbG9iYWwuc29ja2V0KSB7XG4gICAgICAgICAgICB2YXIgcm9vbUlkID0gdGhpcy5yb29tX2lkX2lucHV0LnN0cmluZztcbiAgICAgICAgICAgIGlmIChyb29tSWQgJiYgcm9vbUlkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAvLyDlj5HpgIHliqDlhaXmiL/pl7Tor7fmsYJcbiAgICAgICAgICAgICAgICAvLyBteWdsb2JhbC5zb2NrZXQuam9pblJvb20ocm9vbUlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59KTtcbiJdfQ==