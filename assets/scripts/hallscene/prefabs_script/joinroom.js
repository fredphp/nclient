// 加入房间脚本

cc.Class({
    extends: cc.Component,

    properties: {
        room_id_input: {
            type: cc.EditBox,
            default: null
        }
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 初始化
    },

    start () {
        // 开始
    },

    // 按钮点击事件处理
    onButtonClick(event, customData) {
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

    _joinRoom() {
        var myglobal = window.myglobal;
        if (this.room_id_input && myglobal && myglobal.socket) {
            var roomId = this.room_id_input.string;
            if (roomId && roomId.length > 0) {
                // 发送加入房间请求
                // myglobal.socket.joinRoom(roomId);
            } else {
            }
        }
    }
});
