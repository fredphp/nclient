
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

      if (roomId && roomId.length > 0) {// 发送加入房间请求
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2hhbGxzY2VuZS9wcmVmYWJzX3NjcmlwdC9qb2lucm9vbS5qcyJdLCJuYW1lcyI6WyJjYyIsIkNsYXNzIiwiQ29tcG9uZW50IiwicHJvcGVydGllcyIsInJvb21faWRfaW5wdXQiLCJ0eXBlIiwiRWRpdEJveCIsIm9uTG9hZCIsInN0YXJ0Iiwib25CdXR0b25DbGljayIsImV2ZW50IiwiY3VzdG9tRGF0YSIsIm15Z2xvYmFsIiwid2luZG93Iiwic29ja2V0IiwiY29uc29sZSIsImVycm9yIiwiX2pvaW5Sb29tIiwibm9kZSIsImRlc3Ryb3kiLCJyb29tSWQiLCJzdHJpbmciLCJsZW5ndGgiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFFQUEsRUFBRSxDQUFDQyxLQUFILENBQVM7RUFDTCxXQUFTRCxFQUFFLENBQUNFLFNBRFA7RUFHTEMsVUFBVSxFQUFFO0lBQ1JDLGFBQWEsRUFBRTtNQUNYQyxJQUFJLEVBQUVMLEVBQUUsQ0FBQ00sT0FERTtNQUVYLFdBQVM7SUFGRTtFQURQLENBSFA7RUFVTDtFQUVBQyxNQVpLLG9CQVlLLENBQ047RUFDSCxDQWRJO0VBZ0JMQyxLQWhCSyxtQkFnQkksQ0FDTDtFQUNILENBbEJJO0VBb0JMO0VBQ0FDLGFBckJLLHlCQXFCU0MsS0FyQlQsRUFxQmdCQyxVQXJCaEIsRUFxQjRCO0lBQzdCLElBQUlDLFFBQVEsR0FBR0MsTUFBTSxDQUFDRCxRQUF0Qjs7SUFDQSxJQUFJLENBQUNBLFFBQUQsSUFBYSxDQUFDQSxRQUFRLENBQUNFLE1BQTNCLEVBQW1DO01BQy9CQyxPQUFPLENBQUNDLEtBQVIsQ0FBYyxZQUFkO01BQ0E7SUFDSDs7SUFFRCxRQUFRTCxVQUFSO01BQ0ksS0FBSyxtQkFBTDtRQUNJLEtBQUtNLFNBQUw7O1FBQ0E7O01BQ0osS0FBSyxpQkFBTDtRQUNJLEtBQUtDLElBQUwsQ0FBVUMsT0FBVjtRQUNBOztNQUNKO1FBQ0k7SUFSUjtFQVVILENBdENJO0VBd0NMRixTQXhDSyx1QkF3Q087SUFDUixJQUFJTCxRQUFRLEdBQUdDLE1BQU0sQ0FBQ0QsUUFBdEI7O0lBQ0EsSUFBSSxLQUFLUixhQUFMLElBQXNCUSxRQUF0QixJQUFrQ0EsUUFBUSxDQUFDRSxNQUEvQyxFQUF1RDtNQUNuRCxJQUFJTSxNQUFNLEdBQUcsS0FBS2hCLGFBQUwsQ0FBbUJpQixNQUFoQzs7TUFDQSxJQUFJRCxNQUFNLElBQUlBLE1BQU0sQ0FBQ0UsTUFBUCxHQUFnQixDQUE5QixFQUFpQyxDQUM3QjtRQUNBO01BQ0gsQ0FIRCxNQUdPLENBQ047SUFDSjtFQUNKO0FBbERJLENBQVQiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXNDb250ZW50IjpbIi8vIOWKoOWFpeaIv+mXtOiEmuacrFxuXG5jYy5DbGFzcyh7XG4gICAgZXh0ZW5kczogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICByb29tX2lkX2lucHV0OiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5FZGl0Qm94LFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIExJRkUtQ1lDTEUgQ0FMTEJBQ0tTOlxuXG4gICAgb25Mb2FkICgpIHtcbiAgICAgICAgLy8g5Yid5aeL5YyWXG4gICAgfSxcblxuICAgIHN0YXJ0ICgpIHtcbiAgICAgICAgLy8g5byA5aeLXG4gICAgfSxcblxuICAgIC8vIOaMiemSrueCueWHu+S6i+S7tuWkhOeQhlxuICAgIG9uQnV0dG9uQ2xpY2soZXZlbnQsIGN1c3RvbURhdGEpIHtcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICBpZiAoIW15Z2xvYmFsIHx8ICFteWdsb2JhbC5zb2NrZXQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJzb2NrZXQg5pyq6L+e5o6lXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoIChjdXN0b21EYXRhKSB7XG4gICAgICAgICAgICBjYXNlIFwiam9pbl9yb29tX2NvbmZpcm1cIjpcbiAgICAgICAgICAgICAgICB0aGlzLl9qb2luUm9vbSgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImpvaW5fcm9vbV9jbG9zZVwiOlxuICAgICAgICAgICAgICAgIHRoaXMubm9kZS5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9qb2luUm9vbSgpIHtcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICBpZiAodGhpcy5yb29tX2lkX2lucHV0ICYmIG15Z2xvYmFsICYmIG15Z2xvYmFsLnNvY2tldCkge1xuICAgICAgICAgICAgdmFyIHJvb21JZCA9IHRoaXMucm9vbV9pZF9pbnB1dC5zdHJpbmc7XG4gICAgICAgICAgICBpZiAocm9vbUlkICYmIHJvb21JZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgLy8g5Y+R6YCB5Yqg5YWl5oi/6Ze06K+35rGCXG4gICAgICAgICAgICAgICAgLy8gbXlnbG9iYWwuc29ja2V0LmpvaW5Sb29tKHJvb21JZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSk7XG4iXX0=