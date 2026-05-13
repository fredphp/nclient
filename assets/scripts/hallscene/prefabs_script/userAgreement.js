// 用户协议弹窗脚本
// 功能：从 API 获取用户协议内容并显示，无论 API 成功失败都必须显示弹窗
// 设计：绿色头部 + 黑桃图标 + 米色内容区 + 黄色确认按钮

cc.Class({
    extends: cc.Component,

    properties: {
        // 标题标签（在绿色头部中）
        title_label: {
            type: cc.Label,
            default: null
        },
        // 内容标签（在滚动视图中）
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
        // 内容滚动视图
        scroll_view: {
            type: cc.ScrollView,
            default: null
        },
        // 确认按钮节点
        confirm_btn: {
            type: cc.Node,
            default: null
        },
        // 头部节点（用于设置绿色背景）
        header_node: {
            type: cc.Node,
            default: null
        },
        // 黑桃图标节点
        spade_icon: {
            type: cc.Node,
            default: null
        }
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        // 标记节点是否有效
        this._isValid = true;
        
        // 默认协议内容（API 失败时显示）
        this._defaultContent = "欢迎使用本游戏！在使用前，请您仔细阅读以下用户协议：\n\n1. 服务条款：本游戏提供的服务仅供娱乐目的，用户需遵守相关法律法规。\n\n2. 账号安全：用户应妥善保管账号信息，因个人原因导致的账号损失由用户自行承担。\n\n3. 游戏规则：禁止使用外挂、作弊等违规行为，违者将受到封号等处罚。\n\n4. 隐私保护：我们重视用户隐私，相关信息仅用于提供和优化服务。";
        this._defaultTitle = "用户协议";
        this._defaultVersion = "";
        
        // 添加鼠标滚轮支持
        this._setupMouseWheel();
        
        // 初始化弹窗（先显示默认内容）
        this._initPopup();
        
        // 调用 API 获取用户协议
        this._fetchUserAgreement();
    },
    
    // 设置鼠标滚轮支持
    _setupMouseWheel: function() {
        var self = this;
        if (this.scroll_view && this.scroll_view.node) {
            this.scroll_view.node.on(cc.Node.EventType.MOUSE_WHEEL, function(event) {
                var scrollY = event.getScrollY();
                var scrollView = self.scroll_view;
                if (scrollView) {
                    var currentOffset = scrollView.getScrollOffset();
                    var newOffsetY = currentOffset.y + scrollY * 0.5;
                    scrollView.scrollToOffset(cc.v2(currentOffset.x, newOffsetY), 0.1);
                }
            }, this);
        }
    },

    // 初始化弹窗 - 显示加载中状态
    _initPopup: function() {
        if (this.title_label) {
            this.title_label.string = this._defaultTitle;
        }
        
        if (this.content_label) {
            this.content_label.string = "正在加载...";
        }
        
        if (this.version_label) {
            this.version_label.string = "";
        }
        
        this._showLoading(true);
    },

    onDestroy() {
        // 标记节点已销毁
        this._isValid = false;
    },

    start() {
        // 空实现
    },

    // 获取用户协议数据
    _fetchUserAgreement: function() {
        var self = this;
        var defines = window.defines;
        var HttpAPI = window.HttpAPI;
        
        // 检查配置
        if (!defines || !defines.apiUrl) {
            console.warn("API配置未定义，使用默认内容");
            self._showDefaultContent();
            return;
        }

        if (!HttpAPI) {
            console.warn("HttpAPI未加载，使用默认内容");
            self._showDefaultContent();
            return;
        }

        // 获取用户协议（带加密解密）
        HttpAPI.getUserAgreement(
            defines.apiUrl,
            defines.cryptoKey || '',
            function(err, data) {
                // 检查节点是否仍然有效
                if (!self._isValid || !self.node) {
                    return;
                }
                
                self._showLoading(false);
                
                if (err) {
                    console.warn("获取用户协议失败:", err);
                    // API 失败时显示默认内容（弹窗必须显示）
                    self._showDefaultContent();
                    return;
                }
                
                if (data) {
                    self._updateContent(data);
                } else {
                    // 无数据时显示默认内容
                    self._showDefaultContent();
                }
            }
        );
    },

    // 显示默认内容（API 失败时）
    _showDefaultContent: function() {
        if (!this._isValid || !this.node) return;
        
        if (this.title_label) {
            this.title_label.string = this._defaultTitle;
        }
        
        if (this.content_label) {
            this.content_label.string = this._defaultContent;
            this._updateContentHeight();
        }
        
        if (this.version_label) {
            this.version_label.string = "";
        }
        
        this._showLoading(false);
        if (this.scroll_view) {
            this.scroll_view.node.active = true;
        }
    },

    // 更新内容显示
    _updateContent: function(data) {
        if (!this._isValid || !this.node) return;
        
        if (this.title_label && data.title) {
            this.title_label.string = data.title;
        }
        
        if (this.content_label && data.content) {
            this.content_label.string = data.content;
            this._updateContentHeight();
        }
        
        if (this.version_label && data.version) {
            this.version_label.string = "版本: " + data.version;
        }
    },
    
    // 更新 content 容器高度
    _updateContentHeight: function() {
        if (!this._isValid || !this.node) return;
        
        if (this.content_label) {
            // 设置左对齐，文字颜色为黑色
            this.content_label.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
            this.content_label.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
            this.content_label.wrapWidth = 680;  // 调整宽度以增加左右边距
            
            // 确保文字颜色为黑色
            this.content_label.node.color = cc.color(0, 0, 0, 255);
            
            var contentNode = this.content_label.node;
            
            // 延迟更新高度
            var self = this;
            this.scheduleOnce(function() {
                if (!self._isValid || !self.node) return;
                
                var labelHeight = contentNode.height;
                var minHeight = 400;
                var newHeight = Math.max(labelHeight + 60, minHeight);  // 增加底部空间
                contentNode.height = newHeight;
                
                // 重置滚动位置到顶部
                if (self.scroll_view) {
                    self.scroll_view.scrollToTop(0);
                }
            }, 0.1);
        }
    },

    // 显示加载状态
    _showLoading: function(show) {
        if (!this._isValid || !this.node) return;
        
        if (this.loading_node) {
            this.loading_node.active = show;
        }
        if (this.scroll_view) {
            this.scroll_view.node.active = !show;
        }
    },

    // 显示错误信息（仍然显示弹窗）
    _showError: function(message) {
        if (!this._isValid || !this.node) return;
        
        this._showLoading(false);
        if (this.content_label) {
            this.content_label.string = message || this._defaultContent;
        }
        if (this.scroll_view) {
            this.scroll_view.node.active = true;
        }
    },

    // 按钮点击事件
    onButtonClick(event, customData) {
        if (!this._isValid || !this.node) {
            return;
        }
        
        switch (customData) {
            case "close":
                // 关闭按钮（头部右侧的X按钮）
                this._isValid = false;
                this.node.destroy();
                break;
            case "confirm":
                // "我知道了"按钮（底部黄色按钮）
                this._isValid = false;
                this.node.destroy();
                break;
            default:
                break;
        }
    }
});
