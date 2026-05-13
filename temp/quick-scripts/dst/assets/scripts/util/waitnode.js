
                (function() {
                    var nodeEnv = typeof require !== 'undefined' && typeof process !== 'undefined';
                    var __module = nodeEnv ? module : {exports:{}};
                    var __filename = 'preview-scripts/assets/scripts/util/waitnode.js';
                    var __require = nodeEnv ? function (request) {
                        return cc.require(request);
                    } : function (request) {
                        return __quick_compile_project__.require(request, __filename);
                    };
                    function __define (exports, require, module) {
                        if (!nodeEnv) {__quick_compile_project__.registerModule(__filename, module);}"use strict";
cc._RF.push(module, '17318Pv1MxELb6d+o/SHo0s', 'waitnode');
// scripts/util/waitnode.js

"use strict";

cc.Class({
  "extends": cc.Component,
  properties: {
    loadimage_target: {
      type: cc.Node,
      "default": null
    },
    lblContent: {
      type: cc.Label,
      "default": null
    }
  },
  // LIFE-CYCLE CALLBACKS:
  onLoad: function onLoad() {
    this._isShow = false;
    this._isValid = true;
  },
  onDestroy: function onDestroy() {
    this._isValid = false;
  },
  start: function start() {
    if (this._isValid && this.node) {
      this.node.active = this._isShow;
    }
  },
  update: function update(dt) {
    if (!this._isValid || !this.node) return;
    if (this.loadimage_target && this.loadimage_target.isValid) {
      // 使用 angle 替代已废弃的 rotation 属性
      this.loadimage_target.angle = this.loadimage_target.angle + dt * 45;
    }
  },
  //content为label显示的内容
  show: function show(content) {
    if (!this._isValid || !this.node) return;
    this._isShow = true;
    this.node.active = this._isShow;
    if (this.lblContent && this.lblContent.isValid) {
      if (content == null) {
        content = "";
      }
      this.lblContent.string = content;
    }
  },
  hide: function hide() {
    if (!this._isValid || !this.node) return;
    this._isShow = false;
    this.node.active = this._isShow;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0c1xcc2NyaXB0c1xcdXRpbFxcd2FpdG5vZGUuanMiXSwibmFtZXMiOlsiY2MiLCJDbGFzcyIsIkNvbXBvbmVudCIsInByb3BlcnRpZXMiLCJsb2FkaW1hZ2VfdGFyZ2V0IiwidHlwZSIsIk5vZGUiLCJsYmxDb250ZW50IiwiTGFiZWwiLCJvbkxvYWQiLCJfaXNTaG93IiwiX2lzVmFsaWQiLCJvbkRlc3Ryb3kiLCJzdGFydCIsIm5vZGUiLCJhY3RpdmUiLCJ1cGRhdGUiLCJkdCIsImlzVmFsaWQiLCJhbmdsZSIsInNob3ciLCJjb250ZW50Iiwic3RyaW5nIiwiaGlkZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQUEsRUFBRSxDQUFDQyxLQUFLLENBQUM7RUFDTCxXQUFTRCxFQUFFLENBQUNFLFNBQVM7RUFFckJDLFVBQVUsRUFBRTtJQUNSQyxnQkFBZ0IsRUFBRTtNQUNkQyxJQUFJLEVBQUVMLEVBQUUsQ0FBQ00sSUFBSTtNQUNiLFdBQVM7SUFDYixDQUFDO0lBQ0RDLFVBQVUsRUFBRTtNQUNSRixJQUFJLEVBQUVMLEVBQUUsQ0FBQ1EsS0FBSztNQUNkLFdBQVM7SUFDYjtFQUNKLENBQUM7RUFFRDtFQUVBQyxNQUFNLFdBQUFBLE9BQUEsRUFBSTtJQUNOLElBQUksQ0FBQ0MsT0FBTyxHQUFHLEtBQUs7SUFDcEIsSUFBSSxDQUFDQyxRQUFRLEdBQUcsSUFBSTtFQUN4QixDQUFDO0VBRURDLFNBQVMsV0FBQUEsVUFBQSxFQUFJO0lBQ1QsSUFBSSxDQUFDRCxRQUFRLEdBQUcsS0FBSztFQUN6QixDQUFDO0VBRURFLEtBQUssV0FBQUEsTUFBQSxFQUFJO0lBQ0wsSUFBSSxJQUFJLENBQUNGLFFBQVEsSUFBSSxJQUFJLENBQUNHLElBQUksRUFBRTtNQUM1QixJQUFJLENBQUNBLElBQUksQ0FBQ0MsTUFBTSxHQUFHLElBQUksQ0FBQ0wsT0FBTztJQUNuQztFQUNKLENBQUM7RUFFRE0sTUFBTSxXQUFBQSxPQUFFQyxFQUFFLEVBQUU7SUFDUixJQUFJLENBQUMsSUFBSSxDQUFDTixRQUFRLElBQUksQ0FBQyxJQUFJLENBQUNHLElBQUksRUFBRTtJQUVsQyxJQUFJLElBQUksQ0FBQ1YsZ0JBQWdCLElBQUksSUFBSSxDQUFDQSxnQkFBZ0IsQ0FBQ2MsT0FBTyxFQUFFO01BQ3hEO01BQ0EsSUFBSSxDQUFDZCxnQkFBZ0IsQ0FBQ2UsS0FBSyxHQUFHLElBQUksQ0FBQ2YsZ0JBQWdCLENBQUNlLEtBQUssR0FBR0YsRUFBRSxHQUFHLEVBQUU7SUFDdkU7RUFDSixDQUFDO0VBRUQ7RUFDQUcsSUFBSSxXQUFBQSxLQUFDQyxPQUFPLEVBQUM7SUFDVCxJQUFJLENBQUMsSUFBSSxDQUFDVixRQUFRLElBQUksQ0FBQyxJQUFJLENBQUNHLElBQUksRUFBRTtJQUVsQyxJQUFJLENBQUNKLE9BQU8sR0FBRyxJQUFJO0lBQ25CLElBQUksQ0FBQ0ksSUFBSSxDQUFDQyxNQUFNLEdBQUcsSUFBSSxDQUFDTCxPQUFPO0lBRS9CLElBQUksSUFBSSxDQUFDSCxVQUFVLElBQUksSUFBSSxDQUFDQSxVQUFVLENBQUNXLE9BQU8sRUFBRTtNQUM1QyxJQUFJRyxPQUFPLElBQUksSUFBSSxFQUFFO1FBQ2pCQSxPQUFPLEdBQUcsRUFBRTtNQUNoQjtNQUNBLElBQUksQ0FBQ2QsVUFBVSxDQUFDZSxNQUFNLEdBQUdELE9BQU87SUFDcEM7RUFDSixDQUFDO0VBRURFLElBQUksV0FBQUEsS0FBQSxFQUFFO0lBQ0YsSUFBSSxDQUFDLElBQUksQ0FBQ1osUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDRyxJQUFJLEVBQUU7SUFFbEMsSUFBSSxDQUFDSixPQUFPLEdBQUcsS0FBSztJQUNwQixJQUFJLENBQUNJLElBQUksQ0FBQ0MsTUFBTSxHQUFHLElBQUksQ0FBQ0wsT0FBTztFQUNuQztBQUVKLENBQUMsQ0FBQyIsInNvdXJjZVJvb3QiOiIvIiwic291cmNlc0NvbnRlbnQiOlsiXG5jYy5DbGFzcyh7XG4gICAgZXh0ZW5kczogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBsb2FkaW1hZ2VfdGFyZ2V0OiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5Ob2RlLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICBsYmxDb250ZW50OiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5MYWJlbCxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvLyBMSUZFLUNZQ0xFIENBTExCQUNLUzpcblxuICAgIG9uTG9hZCAoKSB7XG4gICAgICAgIHRoaXMuX2lzU2hvdyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9pc1ZhbGlkID0gdHJ1ZTtcbiAgICB9LFxuICAgIFxuICAgIG9uRGVzdHJveSAoKSB7XG4gICAgICAgIHRoaXMuX2lzVmFsaWQgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgc3RhcnQgKCkge1xuICAgICAgICBpZiAodGhpcy5faXNWYWxpZCAmJiB0aGlzLm5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZS5hY3RpdmUgPSB0aGlzLl9pc1Nob3c7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgdXBkYXRlIChkdCkge1xuICAgICAgICBpZiAoIXRoaXMuX2lzVmFsaWQgfHwgIXRoaXMubm9kZSkgcmV0dXJuO1xuXG4gICAgICAgIGlmICh0aGlzLmxvYWRpbWFnZV90YXJnZXQgJiYgdGhpcy5sb2FkaW1hZ2VfdGFyZ2V0LmlzVmFsaWQpIHtcbiAgICAgICAgICAgIC8vIOS9v+eUqCBhbmdsZSDmm7/ku6Plt7Llup/lvIPnmoQgcm90YXRpb24g5bGe5oCnXG4gICAgICAgICAgICB0aGlzLmxvYWRpbWFnZV90YXJnZXQuYW5nbGUgPSB0aGlzLmxvYWRpbWFnZV90YXJnZXQuYW5nbGUgKyBkdCAqIDQ1O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vY29udGVudOS4umxhYmVs5pi+56S655qE5YaF5a65XG4gICAgc2hvdyhjb250ZW50KXtcbiAgICAgICAgaWYgKCF0aGlzLl9pc1ZhbGlkIHx8ICF0aGlzLm5vZGUpIHJldHVybjtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2lzU2hvdyA9IHRydWU7XG4gICAgICAgIHRoaXMubm9kZS5hY3RpdmUgPSB0aGlzLl9pc1Nob3c7ICAgXG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5sYmxDb250ZW50ICYmIHRoaXMubGJsQ29udGVudC5pc1ZhbGlkKSB7XG4gICAgICAgICAgICBpZiAoY29udGVudCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29udGVudCA9IFwiXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmxibENvbnRlbnQuc3RyaW5nID0gY29udGVudDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBoaWRlKCl7XG4gICAgICAgIGlmICghdGhpcy5faXNWYWxpZCB8fCAhdGhpcy5ub2RlKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9pc1Nob3cgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5ub2RlLmFjdGl2ZSA9IHRoaXMuX2lzU2hvdzsgICBcbiAgICB9XG5cbn0pO1xuIl19