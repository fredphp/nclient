// 用户协议弹窗控制器
// 用于显示用户协议内容

cc.Class({
    extends: cc.Component,

    properties: {
        // 标题标签
        title_label: {
            type: cc.Label,
            default: null
        },
        // 内容标签
        content_label: {
            type: cc.Label,
            default: null
        },
        // 版本标签
        version_label: {
            type: cc.Label,
            default: null
        },
        // 加载提示节点
        loading_node: {
            type: cc.Node,
            default: null
        },
        // 滚动视图
        scroll_view: {
            type: cc.ScrollView,
            default: null
        },
        // 确认按钮
        confirm_btn: {
            type: cc.Button,
            default: null
        },
        // 头部节点
        header_node: {
            type: cc.Node,
            default: null
        },
        // 黑桃图标
        spade_icon: {
            type: cc.Node,
            default: null
        }
    },

    onLoad() {
        // 初始化
        this.loadUserAgreement();
    },

    start() {
        // 设置版本号
        if (this.version_label) {
            this.version_label.string = '版本 V1.0.0';
        }
    },

    // 加载用户协议内容
    loadUserAgreement() {
        // 显示加载中
        if (this.loading_node) {
            this.loading_node.active = true;
        }

        // 从服务器加载用户协议
        this.fetchUserAgreement();
    },

    // 从服务器获取用户协议
    fetchUserAgreement() {
        const self = this;

        // 构建API URL
        const apiUrl = '/api/user-agreement';

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络请求失败');
                }
                return response.json();
            })
            .then(data => {
                if (data && data.content) {
                    self.setContent(data.content);
                } else {
                    self.setContent('暂无用户协议内容');
                }
            })
            .catch(error => {
                console.error('加载用户协议失败:', error);
                self.setContent('加载失败，请稍后重试');
            });
    },

    // 设置内容
    setContent(content) {
        // 隐藏加载中
        if (this.loading_node) {
            this.loading_node.active = false;
        }

        // 设置内容
        if (this.content_label) {
            this.content_label.string = content;
        }
    },

    // 按钮点击事件
    onButtonClick(event, customEventData) {
        switch (customEventData) {
            case 'close':
                this.closePanel();
                break;
            case 'confirm':
                this.confirmAgreement();
                break;
        }
    },

    // 关闭面板
    closePanel() {
        // 播放音效
        this.playClickSound();

        // 关闭弹窗
        this.node.destroy();
    },

    // 确认协议
    confirmAgreement() {
        // 播放音效
        this.playClickSound();

        // 存储用户已同意协议
        try {
            localStorage.setItem('user_agreement_accepted', 'true');
        } catch (e) {
            console.warn('无法存储用户协议状态:', e);
        }

        // 关闭弹窗
        this.node.destroy();
    },

    // 播放点击音效
    playClickSound() {
        // TODO: 添加音效播放逻辑
        // cc.audioEngine.playEffect(this.clickAudio, false);
    }
});
