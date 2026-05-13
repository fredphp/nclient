"use strict";
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