
                (function() {
                    var nodeEnv = typeof require !== 'undefined' && typeof process !== 'undefined';
                    var __module = nodeEnv ? module : {exports:{}};
                    var __filename = 'preview-scripts/assets/scripts/loginscene/loginScene.js';
                    var __require = nodeEnv ? function (request) {
                        return cc.require(request);
                    } : function (request) {
                        return __quick_compile_project__.require(request, __filename);
                    };
                    function __define (exports, require, module) {
                        if (!nodeEnv) {__quick_compile_project__.registerModule(__filename, module);}"use strict";
cc._RF.push(module, 'b05a68gSOpBWr8ddvT03Jpj', 'loginScene');
// scripts/loginscene/loginScene.js

"use strict";

// 登录场景控制器
// 使用点击事件实现复选框功能（不依赖 Toggle 组件）

// 全局样式修复函数 - 更强大的版本
var _globalStyleFixApplied = false;

// 辅助函数：修复Web平台EditBox的CSS样式（增强版）
var _fixEditBoxStyle = function _fixEditBoxStyle(editBox, fontColor, bgColor) {
  if (!cc.sys.isBrowser) return;
  fontColor = fontColor || '#000000';
  bgColor = bgColor || '#ffffff';

  // 立即尝试修复
  _applyInputStyles(fontColor, bgColor);

  // 延迟修复（等待HTML input元素创建）
  setTimeout(function () {
    _applyInputStyles(fontColor, bgColor);
  }, 50);
  setTimeout(function () {
    _applyInputStyles(fontColor, bgColor);
  }, 100);
  setTimeout(function () {
    _applyInputStyles(fontColor, bgColor);
  }, 200);
  setTimeout(function () {
    _applyInputStyles(fontColor, bgColor);
  }, 500);

  // 注入全局CSS样式（最高优先级）
  if (!_globalStyleFixApplied) {
    _globalStyleFixApplied = true;
    _injectGlobalStyles(fontColor, bgColor);
  }
};

// 应用样式到所有input元素
var _applyInputStyles = function _applyInputStyles(fontColor, bgColor) {
  try {
    var inputs = document.querySelectorAll('input');
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      _styleSingleInput(input, fontColor, bgColor);
    }

    // 也处理 textarea（可能被用于 EditBox）
    var textareas = document.querySelectorAll('textarea');
    for (var j = 0; j < textareas.length; j++) {
      _styleSingleInput(textareas[j], fontColor, bgColor);
    }
  } catch (e) {
    console.error('修复EditBox样式失败:', e);
  }
};

// 样式化单个input元素 - 修复版：文字垂直居中 + 透明背景不遮挡边框
// 注意：跳过原生输入框（native-phone-input, native-code-input），因为它们有精确的位置设置
var _styleSingleInput = function _styleSingleInput(input, fontColor, bgColor) {
  // ★ 跳过原生输入框，它们已经有正确的样式
  if (input.id === 'native-phone-input' || input.id === 'native-code-input') {
    return;
  }

  // ==================== 核心样式设置 ====================

  // 1. 文字颜色
  input.style.setProperty('color', fontColor, 'important');
  input.style.color = fontColor;

  // 2. 关键：设置透明背景，让 Cocos 绘制的边框可见
  input.style.setProperty('background-color', 'transparent', 'important');
  input.style.backgroundColor = 'transparent';

  // 3. 文字垂直居中 - 使用 Flexbox 方案（最可靠）
  input.style.setProperty('display', 'flex', 'important');
  input.style.display = 'flex';
  input.style.setProperty('align-items', 'center', 'important');
  input.style.alignItems = 'center';
  input.style.setProperty('justify-content', 'flex-start', 'important');
  input.style.justifyContent = 'flex-start';

  // 4. 盒模型设置
  input.style.setProperty('box-sizing', 'border-box', 'important');
  input.style.boxSizing = 'border-box';

  // 5. 内边距 - 给文字留出空间，避免贴边
  input.style.setProperty('padding', '0 12px', 'important');
  input.style.padding = '0 12px';

  // 6. 行高设置 - 与字体大小匹配，确保垂直居中
  input.style.setProperty('line-height', '1', 'important');
  input.style.lineHeight = '1';

  // 7. 高度自适应内容
  input.style.setProperty('height', '100%', 'important');
  input.style.height = '100%';

  // ==================== 字体设置 ====================
  input.style.setProperty('font-size', '20px', 'important');
  input.style.fontSize = '20px';
  input.style.setProperty('font-family', 'Arial, "Microsoft YaHei", sans-serif', 'important');

  // ==================== WebKit 特殊修复 ====================
  input.style.setProperty('-webkit-text-fill-color', fontColor, 'important');
  input.style.webkitTextFillColor = fontColor;

  // ==================== 可见性确保 ====================
  input.style.setProperty('opacity', '1', 'important');
  input.style.opacity = '1';
  input.style.setProperty('visibility', 'visible', 'important');
  input.style.visibility = 'visible';

  // ==================== 光标颜色 ====================
  input.style.setProperty('caret-color', fontColor, 'important');
  input.style.caretColor = fontColor;

  // ==================== 移除干扰样式 ====================
  input.style.textShadow = 'none';
  input.style.setProperty('text-shadow', 'none', 'important');
  input.style.outline = 'none';
  input.style.setProperty('outline', 'none', 'important');
  input.style.border = 'none';
  input.style.setProperty('border', 'none', 'important');

  // ==================== 移除定位干扰 ====================
  input.style.removeProperty('top');
  input.style.removeProperty('margin-top');
  input.style.removeProperty('margin');

  // ==================== 聚焦时保持样式 ====================
  input.style.setProperty('outline-offset', '0', 'important');
};

// 注入全局CSS样式 - 修复版（排除原生输入框）
var _injectGlobalStyles = function _injectGlobalStyles(fontColor, bgColor) {
  try {
    var styleId = 'cocos-editbox-fix-style';
    if (document.getElementById(styleId)) return;
    var css = "\n            /* \u8F93\u5165\u6846\u57FA\u7840\u6837\u5F0F - \u900F\u660E\u80CC\u666F + \u6587\u5B57\u5C45\u4E2D */\n            /* \u6CE8\u610F\uFF1A\u6392\u9664\u539F\u751F\u8F93\u5165\u6846 #native-phone-input, #native-code-input */\n            input:not(#native-phone-input):not(#native-code-input), \n            textarea:not(#native-phone-input):not(#native-code-input) {\n                color: " + fontColor + " !important;\n                background-color: transparent !important;\n                opacity: 1 !important;\n                visibility: visible !important;\n                font-size: 20px !important;\n                -webkit-text-fill-color: " + fontColor + " !important;\n                caret-color: " + fontColor + " !important;\n                line-height: 1 !important;\n                border: none !important;\n                outline: none !important;\n            }\n            \n            /* Placeholder \u6837\u5F0F */\n            input::placeholder, textarea::placeholder {\n                color: #888888 !important;\n                opacity: 1 !important;\n            }\n            \n            /* \u805A\u7126\u72B6\u6001 */\n            input:focus:not(#native-phone-input):not(#native-code-input), \n            textarea:focus:not(#native-phone-input):not(#native-code-input) {\n                color: " + fontColor + " !important;\n                outline: none !important;\n                background-color: transparent !important;\n            }\n            \n            /* \u6587\u672C\u7C7B\u578B\u8F93\u5165\u6846 - Flexbox \u5782\u76F4\u5C45\u4E2D\uFF08\u6392\u9664\u539F\u751F\u8F93\u5165\u6846\uFF09*/\n            input[type=\"text\"]:not(#native-phone-input):not(#native-code-input), \n            input[type=\"number\"]:not(#native-phone-input):not(#native-code-input), \n            input[type=\"tel\"]:not(#native-phone-input):not(#native-code-input),\n            input[type=\"password\"]:not(#native-phone-input):not(#native-code-input) {\n                display: flex !important;\n                align-items: center !important;\n                justify-content: flex-start !important;\n                box-sizing: border-box !important;\n                padding: 0 12px !important;\n                height: 100% !important;\n                line-height: 1 !important;\n                border: none !important;\n            }\n            \n            /* \u79FB\u9664\u6D4F\u89C8\u5668\u9ED8\u8BA4\u6837\u5F0F */\n            input:focus,\n            textarea:focus {\n                box-shadow: none !important;\n            }\n        ";
    var style = document.createElement('style');
    style.id = styleId;
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  } catch (e) {
    console.error('注入全局样式失败:', e);
  }
};

// 创建原生 HTML input 元素（绕过 Cocos EditBox 的问题）
// 改进版 v4：使用节点世界坐标精确定位
var _createNativeInputElements = function _createNativeInputElements(panel, phoneInputNode, codeInputNode, inputWidth, inputHeight, codeInputW, panelWidth, panelHeight) {
  if (!cc.sys.isBrowser) return;
  try {
    // 获取 Canvas 元素
    var canvas = document.getElementById('GameCanvas') || document.querySelector('canvas');
    if (!canvas) {
      console.error('找不到 Canvas 元素');
      return;
    }
    var canvasRect = canvas.getBoundingClientRect();
    var winSize = cc.winSize;
    console.log('=== 创建原生输入框（v4 - 使用节点世界坐标）===');
    console.log('Canvas 位置:', canvasRect.left, canvasRect.top);
    console.log('Canvas 尺寸:', canvasRect.width, 'x', canvasRect.height);
    console.log('游戏分辨率:', winSize.width, 'x', winSize.height);

    // 计算缩放比例（Canvas 实际尺寸 / 游戏设计分辨率）
    var scaleX = canvasRect.width / winSize.width;
    var scaleY = canvasRect.height / winSize.height;
    console.log('缩放比例:', scaleX.toFixed(3), scaleY.toFixed(3));

    // ==================== 关键改进：使用节点世界坐标 ====================
    // 直接使用 Cocos 节点的世界坐标，而不是手动计算偏移

    // 获取输入框节点的世界坐标
    var phoneWorldPos = phoneInputNode.convertToWorldSpaceAR(cc.v2(0, 0));
    var codeWorldPos = codeInputNode.convertToWorldSpaceAR(cc.v2(0, 0));
    console.log('手机输入框世界坐标:', phoneWorldPos.x.toFixed(1), phoneWorldPos.y.toFixed(1));
    console.log('验证码输入框世界坐标:', codeWorldPos.x.toFixed(1), codeWorldPos.y.toFixed(1));

    // ★★★ 位置微调参数（如果需要微调，修改这里）★★★
    var phoneOffsetX = 0; // 手机输入框 X 偏移
    var phoneOffsetY = 0; // 手机输入框 Y 偏移
    var codeOffsetX = 0; // 验证码输入框 X 偏移
    var codeOffsetY = 0; // 验证码输入框 Y 偏移

    // ★★★ 尺寸参数 ★★★
    var actualInputWidth = inputWidth; // 使用传入的输入框宽度
    var actualInputHeight = inputHeight; // 使用传入的输入框高度
    var actualCodeInputWidth = codeInputW; // 使用传入的验证码输入框宽度

    console.log('=== 输入框尺寸 ===');
    console.log('手机输入框:', actualInputWidth, 'x', actualInputHeight);
    console.log('验证码输入框:', actualCodeInputWidth, 'x', actualInputHeight);

    // 计算屏幕位置（世界坐标 -> 屏幕坐标）
    // Cocos 坐标系：原点左下角，Y 向上
    // HTML 坐标系：原点左上角，Y 向下
    var calcScreenPosFromWorld = function calcScreenPosFromWorld(worldPos, nodeWidth, nodeHeight, offsetX, offsetY) {
      // 世界坐标转换为屏幕坐标
      var screenX = worldPos.x + offsetX;
      var screenY = worldPos.y + offsetY;

      // 转换为 Canvas 坐标
      var canvasX = screenX * scaleX;
      var canvasY = canvasRect.height - screenY * scaleY; // Y 轴翻转

      // 计算实际尺寸
      var actualWidth = nodeWidth * scaleX;
      var actualHeight = nodeHeight * scaleY;
      return {
        left: canvasRect.left + canvasX - actualWidth / 2,
        top: canvasRect.top + canvasY - actualHeight / 2,
        width: actualWidth,
        height: actualHeight
      };
    };
    var phoneScreen = calcScreenPosFromWorld(phoneWorldPos, actualInputWidth, actualInputHeight, phoneOffsetX, phoneOffsetY);
    var codeScreen = calcScreenPosFromWorld(codeWorldPos, actualCodeInputWidth, actualInputHeight, codeOffsetX, codeOffsetY);
    console.log('手机输入框屏幕位置:', phoneScreen);
    console.log('验证码输入框屏幕位置:', codeScreen);

    // 边界检查：确保输入框在屏幕可见区域内
    phoneScreen.left = Math.max(0, Math.min(canvasRect.width - phoneScreen.width, phoneScreen.left));
    phoneScreen.top = Math.max(0, Math.min(canvasRect.height - phoneScreen.height, phoneScreen.top));
    codeScreen.left = Math.max(0, Math.min(canvasRect.width - codeScreen.width, codeScreen.left));
    codeScreen.top = Math.max(0, Math.min(canvasRect.height - codeScreen.height, codeScreen.top));
    console.log('边界检查后位置:');
    console.log('  手机输入框:', phoneScreen.left.toFixed(1), phoneScreen.top.toFixed(1));
    console.log('  验证码输入框:', codeScreen.left.toFixed(1), codeScreen.top.toFixed(1));

    // 移除旧的容器和输入框
    var oldContainer = document.getElementById('native-input-container');
    if (oldContainer) {
      oldContainer.remove();
    }

    // 创建新的容器（直接放在 body 下，确保不被遮挡）
    var container = document.createElement('div');
    container.id = 'native-input-container';
    container.style.cssText = ['position: fixed', 'top: 0', 'left: 0', 'width: 100%', 'height: 100%', 'pointer-events: none', 'z-index: 99999'].join('; ');
    document.body.appendChild(container);

    // 创建手机号输入框
    var phoneInput = document.createElement('input');
    phoneInput.id = 'native-phone-input';
    phoneInput.type = 'tel';
    phoneInput.placeholder = '请输入手机号';
    phoneInput.maxLength = 11;
    phoneInput.style.cssText = ['position: absolute', 'left: ' + phoneScreen.left + 'px', 'top: ' + phoneScreen.top + 'px', 'width: ' + phoneScreen.width + 'px', 'height: ' + phoneScreen.height + 'px', 'background: transparent', 'border: none', 'border-radius: 0', 'font-size: 12px', 'color: #333', 'padding: 0 8px', 'box-sizing: border-box', 'outline: none', 'pointer-events: auto', 'z-index: 100000', 'cursor: text', 'font-family: Arial, "Microsoft YaHei", sans-serif', 'line-height: ' + phoneScreen.height + 'px', 'text-align: left'].join('; ');
    container.appendChild(phoneInput);

    // 创建验证码输入框
    var codeInput = document.createElement('input');
    codeInput.id = 'native-code-input';
    codeInput.type = 'text';
    codeInput.placeholder = '验证码';
    codeInput.maxLength = 6;
    codeInput.style.cssText = ['position: absolute', 'left: ' + codeScreen.left + 'px', 'top: ' + codeScreen.top + 'px', 'width: ' + codeScreen.width + 'px', 'height: ' + codeScreen.height + 'px', 'background: transparent', 'border: none', 'border-radius: 0', 'font-size: 12px', 'color: #333', 'padding: 0 8px', 'box-sizing: border-box', 'outline: none', 'pointer-events: auto', 'z-index: 100000', 'cursor: text', 'font-family: Arial, "Microsoft YaHei", sans-serif', 'line-height: ' + codeScreen.height + 'px', 'text-align: left'].join('; ');
    container.appendChild(codeInput);

    // 添加焦点事件调试
    phoneInput.addEventListener('focus', function () {
      console.log('手机输入框获得焦点');
    });
    phoneInput.addEventListener('click', function () {
      console.log('手机输入框被点击');
    });
    codeInput.addEventListener('focus', function () {
      console.log('验证码输入框获得焦点');
    });
    codeInput.addEventListener('click', function () {
      console.log('验证码输入框被点击');
    });
    console.log('原生输入框创建完成');

    // 延迟检查输入框是否正确创建
    setTimeout(function () {
      var phoneCheck = document.getElementById('native-phone-input');
      var codeCheck = document.getElementById('native-code-input');
      console.log('输入框检查:');
      console.log('  手机输入框:', phoneCheck ? '存在' : '不存在');
      console.log('  验证码输入框:', codeCheck ? '存在' : '不存在');
      if (phoneCheck) {
        var rect = phoneCheck.getBoundingClientRect();
        console.log('  手机输入框位置:', rect.left, rect.top, rect.width, 'x', rect.height);
      }
    }, 100);
  } catch (e) {
    console.error('创建原生输入框失败:', e);
  }
};

// 移除原生 HTML 输入框元素（登录成功或关闭弹窗时调用）
var _removeNativeInputElements = function _removeNativeInputElements() {
  if (!cc.sys.isBrowser) return;
  try {
    var container = document.getElementById('native-input-container');
    if (container) {
      container.remove();
      console.log('原生输入框已移除');
    }
  } catch (e) {
    console.error('移除原生输入框失败:', e);
  }
};

// 修复 EditBox 的 HTML input 元素位置和尺寸
var _fixEditBoxInputElements = function _fixEditBoxInputElements(panel, phoneInputNode, codeInputNode, inputWidth, inputHeight, codeInputW, phoneEditBox, codeEditBox) {
  if (!cc.sys.isBrowser) return;
  try {
    // 获取 Canvas 元素
    var canvas = document.getElementById('GameCanvas') || document.querySelector('canvas');
    if (!canvas) {
      console.error('找不到 Canvas 元素');
      return;
    }
    var canvasRect = canvas.getBoundingClientRect();
    console.log('Canvas 尺寸:', canvasRect.width, 'x', canvasRect.height);

    // 获取游戏设计的分辨率
    var winSize = cc.winSize;
    console.log('游戏分辨率:', winSize.width, 'x', winSize.height);

    // 计算缩放比例
    var scaleX = canvasRect.width / winSize.width;
    var scaleY = canvasRect.height / winSize.height;
    console.log('缩放比例:', scaleX, scaleY);

    // 辅助函数：将 Cocos 世界坐标转换为 HTML 屏幕坐标
    var worldToScreen = function worldToScreen(worldPos, nodeWidth, nodeHeight) {
      // Cocos 坐标系：原点在左下角，Y轴向上
      // HTML 坐标系：原点在左上角，Y轴向下

      // 世界坐标转换为相对于设计分辨率的位置（0 到 winSize）
      // 然后缩放到 Canvas 尺寸

      var screenX = (worldPos.x - nodeWidth / 2) * scaleX;
      var screenY = canvasRect.height - (worldPos.y + nodeHeight / 2) * scaleY;
      return {
        x: screenX,
        y: screenY
      };
    };

    // 计算手机输入框的世界坐标
    var phoneWorldPos = phoneInputNode.convertToWorldSpaceAR(cc.v2(0, 0));
    console.log('手机输入框世界坐标:', phoneWorldPos.x, phoneWorldPos.y);
    var phoneScreenPos = worldToScreen(phoneWorldPos, inputWidth, inputHeight);
    console.log('手机输入框屏幕位置:', phoneScreenPos.x, phoneScreenPos.y);

    // 查找 HTML input 元素
    var inputs = document.querySelectorAll('input');
    console.log('找到 ' + inputs.length + ' 个 input 元素');

    // 如果只有一个 input，需要手动创建第二个
    if (inputs.length === 1) {
      var phoneInput = inputs[0];

      // 设置样式
      phoneInput.style.position = 'absolute';
      phoneInput.style.left = Math.max(0, phoneScreenPos.x) + 'px';
      phoneInput.style.top = Math.max(0, phoneScreenPos.y) + 'px';
      phoneInput.style.width = inputWidth * scaleX + 'px';
      phoneInput.style.height = inputHeight * scaleY + 'px';
      phoneInput.style.zIndex = '9999';
      phoneInput.style.opacity = '1';
      phoneInput.style.visibility = 'visible';
      phoneInput.style.display = 'block';
      phoneInput.style.pointerEvents = 'auto';
      phoneInput.style.cursor = 'text';
      phoneInput.style.background = 'rgba(255,255,255,0.5)';
      phoneInput.style.border = '2px solid gold';
      phoneInput.style.outline = 'none';
      phoneInput.style.fontSize = '16px';
      phoneInput.style.color = '#333333';
      phoneInput.style.padding = '5px';
      phoneInput.style.boxSizing = 'border-box';
      phoneInput.style.borderRadius = '5px';
      console.log('手机输入框样式已修复，位置:', phoneInput.style.left, phoneInput.style.top);
    }

    // 验证码输入框
    var codeWorldPos = codeInputNode.convertToWorldSpaceAR(cc.v2(0, 0));
    console.log('验证码输入框世界坐标:', codeWorldPos.x, codeWorldPos.y);
    var codeScreenPos = worldToScreen(codeWorldPos, codeInputW, inputHeight);
    console.log('验证码输入框屏幕位置:', codeScreenPos.x, codeScreenPos.y);
    if (inputs.length >= 2) {
      var codeInput = inputs[1];
      codeInput.style.position = 'absolute';
      codeInput.style.left = Math.max(0, codeScreenPos.x) + 'px';
      codeInput.style.top = Math.max(0, codeScreenPos.y) + 'px';
      codeInput.style.width = codeInputW * scaleX + 'px';
      codeInput.style.height = inputHeight * scaleY + 'px';
      codeInput.style.zIndex = '9999';
      codeInput.style.opacity = '1';
      codeInput.style.visibility = 'visible';
      codeInput.style.display = 'block';
      codeInput.style.pointerEvents = 'auto';
      codeInput.style.cursor = 'text';
      codeInput.style.background = 'rgba(255,255,255,0.5)';
      codeInput.style.border = '2px solid gold';
      codeInput.style.outline = 'none';
      codeInput.style.fontSize = '16px';
      codeInput.style.color = '#333333';
      codeInput.style.padding = '5px';
      codeInput.style.boxSizing = 'border-box';
      codeInput.style.borderRadius = '5px';
      console.log('验证码输入框样式已修复');
    }

    // 调试：显示输入框的实际位置
    console.log('=== 调试信息 ===');
    console.log('Canvas 位置:', canvasRect.left, canvasRect.top);
    console.log('设计分辨率:', winSize.width, 'x', winSize.height);
    console.log('输入框节点尺寸:', inputWidth, 'x', inputHeight);
    console.log('验证码输入框尺寸:', codeInputW, 'x', inputHeight);
  } catch (e) {
    console.error('修复 EditBox 样式失败:', e);
  }
};

// MutationObserver 监听新创建的input元素
var _startInputObserver = function _startInputObserver() {
  if (!cc.sys.isBrowser) return;
  try {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeName === 'INPUT' || node.nodeName === 'TEXTAREA') {
            _styleSingleInput(node, '#000000', '#ffffff');
          }
          // 检查子节点
          if (node.querySelectorAll) {
            var inputs = node.querySelectorAll('input, textarea');
            inputs.forEach(function (inp) {
              _styleSingleInput(inp, '#000000', '#ffffff');
            });
          }
        });
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } catch (e) {
    console.warn('启动Input监听器失败:', e);
  }
};
cc.Class({
  "extends": cc.Component,
  properties: {
    wait_node: {
      type: cc.Node,
      "default": null
    },
    user_agreement_prefabs: {
      type: cc.Prefab,
      "default": null
    },
    phone_login_prefab: {
      type: cc.Prefab,
      "default": null
    }
  },
  onLoad: function onLoad() {
    var self = this;
    console.log("========================================");
    console.log("loginScene onLoad 开始执行");
    console.log("========================================");
    try {
      // 🔧 修复：禁用自动全屏功能（双重保险，移除 isMobile 检查）
      // 即使 main.js 中的设置没有生效，这里也会再次禁用
      if (cc.view && cc.view.enableAutoFullScreen) {
        cc.view.enableAutoFullScreen(false);
        console.log("loginScene: 已禁用自动全屏功能");
      }

      // 🔧 额外保险：禁用 screen 的自动全屏触摸监听器
      if (cc.screen && cc.screen.disableAutoFullScreen) {
        cc.screen.disableAutoFullScreen();
        console.log("loginScene: 已禁用 screen 自动全屏触摸监听器");
      }
    } catch (e) {
      console.error("禁用自动全屏时出错:", e);
    }
    try {
      // 启动Web平台Input样式监听器
      _startInputObserver();
      _injectGlobalStyles('#000000', '#ffffff');
    } catch (e) {
      console.error("初始化样式监听器时出错:", e);
    }
    this._isAgreementChecked = false;
    this._phoneLoginPopupShowing = false; // 初始化弹窗标志位

    try {
      this._initWaitNode();
    } catch (e) {
      console.error("初始化等待节点时出错:", e);
    }
    try {
      // 初始化复选框（使用点击事件）
      this._initCheckbox();
    } catch (e) {
      console.error("初始化复选框时出错:", e);
    }
    try {
      // 初始化登录按钮
      this._initLoginButtons();
    } catch (e) {
      console.error("初始化登录按钮时出错:", e);
    }
    try {
      // 初始化用户协议链接点击事件
      this._initUserAgreementLink();
    } catch (e) {
      console.error("初始化用户协议链接时出错:", e);
    }
    try {
      // 🚀【性能优化】预加载大厅场景和游戏场景
      this._preloadScenes();
    } catch (e) {
      console.error("预加载场景时出错:", e);
    }
    try {
      // 检查是否有本地登录会话，尝试自动登录
      this._checkAutoLogin();
    } catch (e) {
      console.error("检查自动登录时出错:", e);
    }
    if (typeof window.myglobal === 'undefined') {
      console.error("myglobal 未定义，尝试等待...");
      this._waitForMyglobal();
      return;
    }
    this._initAndStart();
    console.log("========================================");
    console.log("loginScene onLoad 执行完成");
    console.log("========================================");
  },
  // 检查自动登录
  _checkAutoLogin: function _checkAutoLogin() {
    var myglobal = window.myglobal;
    if (!myglobal) {
      return;
    }

    // 检查是否被强制下线
    if (myglobal.wasForceLoggedOut()) {
      this._showError(myglobal.getForceLogoutReason());
      return;
    }

    // 检查是否有本地会话
    if (myglobal.hasLocalSession()) {
      var self = this;
      myglobal.verifyToken(function (valid, message) {
        if (valid) {
          self._showError("自动登录中...");

          // 检查是否有保存的房间信息（刷新页面后恢复到游戏场景）
          var reconnectInfo = myglobal.socket && myglobal.socket.loadReconnectInfo ? myglobal.socket.loadReconnectInfo() : {
            token: '',
            playerId: '',
            roomCode: ''
          };

          // 如果有房间号，说明之前在游戏中，需要恢复到游戏场景
          if (reconnectInfo.roomCode) {
            self.scheduleOnce(function () {
              if (myglobal.socket && myglobal.socket.initSocket) {
                myglobal.socket.initSocket();
              }

              // 监听房间恢复事件
              myglobal.socket.onRoomRestored(function (data) {
                cc.director.loadScene("gameScene");
              });

              // 监听普通连接成功（不在房间中）
              var evt = window.eventLister ? window.eventLister({}) : null;
              if (evt) {
                evt.on("connection_success", function (data) {
                  cc.director.loadScene("gameScene");
                });
              }
            }, 0.5);
          } else {
            // 没有房间信息，正常跳转到大厅
            self.scheduleOnce(function () {
              if (myglobal.socket && myglobal.socket.initSocket) {
                myglobal.socket.initSocket();
              }
              cc.director.loadScene("hallScene");
            }, 0.5);
          }
        } else {
          // Token无效，显示错误信息并停留在登录页面
          self._showError(message || "登录已过期，请重新登录");
          // myglobal.verifyToken 已经清除了本地状态，这里不需要再次清除
        }
      });
    } else {}
  },
  _initWaitNode: function _initWaitNode() {
    if (this.wait_node) {
      this._loadingImage = this.wait_node.getChildByName("loading_image");
      var lblNode = this.wait_node.getChildByName("lblcontent_Label");
      if (lblNode) {
        this._waitLabel = lblNode.getComponent(cc.Label);
      }
      this.wait_node.active = false;
    }
  },
  _initCheckbox: function _initCheckbox() {
    var self = this;

    // loginScene 脚本挂载在 ROOT_UI 节点上，所以 this.node 就是 ROOT_UI
    var checkMarkNode = this.node.getChildByName("check_mark");
    if (!checkMarkNode) {
      console.error("check_mark 节点未找到");
      return;
    }
    this._checkMarkNode = checkMarkNode;
    var checkmark = checkMarkNode.getChildByName("checkmark");
    if (checkmark) {
      this._checkmarkIcon = checkmark;
      checkmark.active = true; // 默认选中
    }

    this._isAgreementChecked = true; // 默认已同意协议

    var button = checkMarkNode.getComponent(cc.Button);
    if (button) {
      button.enabled = false;
    }
    checkMarkNode.off(cc.Node.EventType.TOUCH_END);
    checkMarkNode.on(cc.Node.EventType.TOUCH_END, function (event) {
      self._toggleCheckbox();
    }, self);
  },
  _toggleCheckbox: function _toggleCheckbox() {
    this._isAgreementChecked = !this._isAgreementChecked;
    if (this._checkmarkIcon) {
      this._checkmarkIcon.active = this._isAgreementChecked;
    }
  },
  start: function start() {
    console.log("========================================");
    console.log("loginScene start 方法执行");
    console.log("========================================");

    // 备用方案：在 start 中再次检查按钮是否正确初始化
    var self = this;
    this.scheduleOnce(function () {
      console.log(">>> 延迟检查按钮状态...");
      var phoneLoginNode = self.node.getChildByName("login_phone");
      if (phoneLoginNode) {
        console.log(">>> login_phone 节点存在");
        var hasTouchListeners = phoneLoginNode.getComponent(cc.Button) !== null;
        console.log(">>> 是否有 Button 组件:", hasTouchListeners);

        // 再次确保事件绑定
        phoneLoginNode.off(cc.Node.EventType.TOUCH_END);
        phoneLoginNode.on(cc.Node.EventType.TOUCH_END, function (event) {
          console.log(">>> [start备用] 手机登录按钮 TOUCH_END 事件触发");
          event.stopPropagation();
          self._doPhoneLogin();
        }, self);
        console.log(">>> 已重新绑定手机登录按钮事件");
      } else {
        console.error(">>> login_phone 节点不存在！");
      }
      var wxLoginNode = self.node.getChildByName("login_wx");
      if (wxLoginNode) {
        console.log(">>> login_wx 节点存在");
        wxLoginNode.off(cc.Node.EventType.TOUCH_END);
        wxLoginNode.on(cc.Node.EventType.TOUCH_END, function (event) {
          console.log(">>> [start备用] 微信登录按钮 TOUCH_END 事件触发");
          self._doWxLogin();
        }, self);
        console.log(">>> 已重新绑定微信登录按钮事件");
      }
    }, 0.5);
  },
  _initLoginButtons: function _initLoginButtons() {
    var self = this;
    console.log("=== 初始化登录按钮 ===");
    console.log("当前节点:", this.node ? this.node.name : "null");

    // 打印所有子节点名称
    var children = this.node.children;
    console.log("子节点数量:", children.length);
    for (var i = 0; i < children.length; i++) {
      console.log("  子节点[" + i + "]:", children[i].name);
    }

    // loginScene 脚本挂载在 ROOT_UI 节点上，所以 this.node 就是 ROOT_UI
    var wxLoginNode = this.node.getChildByName("login_wx");
    console.log("wxLoginNode:", wxLoginNode ? "找到" : "未找到");
    if (wxLoginNode) {
      var button = wxLoginNode.getComponent(cc.Button);
      console.log("wxLoginNode Button:", button ? "存在" : "不存在");
      if (button) {
        button.interactable = true;
        button.clickEvents = [];
        var handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = "loginScene";
        handler.handler = "_onWxLoginClick";
        handler.customEventData = "";
        button.clickEvents.push(handler);
        console.log("微信登录按钮初始化完成");
      }

      // 添加备用的触摸事件监听（确保点击事件一定能触发）
      wxLoginNode.off(cc.Node.EventType.TOUCH_END);
      wxLoginNode.on(cc.Node.EventType.TOUCH_END, function (event) {
        console.log(">>> 微信登录按钮 TOUCH_END 事件触发");
        self._doWxLogin();
      }, self);
    } else {
      console.error("未找到 login_wx 节点！");
    }
    var phoneLoginNode = this.node.getChildByName("login_phone");
    console.log("phoneLoginNode:", phoneLoginNode ? "找到" : "未找到");
    if (phoneLoginNode) {
      var button = phoneLoginNode.getComponent(cc.Button);
      console.log("phoneLoginNode Button:", button ? "存在" : "不存在");
      if (button) {
        button.interactable = true;
        button.clickEvents = [];
        var handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = "loginScene";
        handler.handler = "_onPhoneLoginClick";
        handler.customEventData = "";
        button.clickEvents.push(handler);
        console.log("手机登录按钮初始化完成");
      }

      // 添加备用的触摸事件监听（确保点击事件一定能触发）
      phoneLoginNode.off(cc.Node.EventType.TOUCH_END);
      phoneLoginNode.on(cc.Node.EventType.TOUCH_END, function (event) {
        console.log(">>> 手机登录按钮 TOUCH_END 事件触发");
        event.stopPropagation(); // 阻止事件冒泡
        self._doPhoneLogin();
      }, self);
    } else {
      console.error("未找到 login_phone 节点！");
    }
    console.log("=== 登录按钮初始化结束 ===");
  },
  _initUserAgreementLink: function _initUserAgreementLink() {
    var self = this;

    // loginScene 脚本挂载在 ROOT_UI 节点上，所以 this.node 就是 ROOT_UI
    var linkNode = this.node.getChildByName("user_agreement_link");
    if (linkNode) {
      linkNode.active = true;
      var button = linkNode.getComponent(cc.Button);
      if (button) {
        button.interactable = true;
        button.clickEvents = [];
        var handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = "loginScene";
        handler.handler = "_onUserAgreementLinkClick";
        handler.customEventData = "";
        button.clickEvents.push(handler);
      }
    }
  },
  _onWxLoginClick: function _onWxLoginClick() {
    console.log("=== 微信登录按钮被点击 ===");
    this._doWxLogin();
  },
  _onPhoneLoginClick: function _onPhoneLoginClick() {
    console.log("=== 手机登录按钮被点击 ===");
    this._doPhoneLogin();
  },
  _onUserAgreementLinkClick: function _onUserAgreementLinkClick() {
    this._showUserAgreementPopup();
  },
  _checkAgreement: function _checkAgreement() {
    return this._isAgreementChecked;
  },
  // 🚀【性能优化】预加载场景
  _preloadScenes: function _preloadScenes() {
    // 预加载大厅场景
    cc.director.preloadScene("hallScene", function (err) {
      if (err) {
        console.error("🚀 [预加载] 大厅场景预加载失败:", err);
        return;
      }
    });

    // 预加载游戏场景
    cc.director.preloadScene("gameScene", function (err) {
      if (err) {
        console.error("🚀 [预加载] 游戏场景预加载失败:", err);
        return;
      }
    });
  },
  _waitForMyglobal: function _waitForMyglobal() {
    var self = this;
    var attempts = 0;
    var check = function check() {
      attempts++;
      if (typeof window.myglobal !== 'undefined') {
        self._initAndStart();
      } else if (attempts < 20) {
        setTimeout(check, 100);
      } else {
        self._showError("加载失败，请刷新页面重试");
      }
    };
    setTimeout(check, 100);
  },
  _initAndStart: function _initAndStart() {
    var myglobal = window.myglobal;
    if (!myglobal.socket && !myglobal.init()) {
      this._showError("初始化失败，请刷新页面重试");
      return;
    }

    // 检查是否有保存的重连信息（刷新页面后恢复）
    if (myglobal.socket && myglobal.socket.loadReconnectInfo) {
      var reconnectInfo = myglobal.socket.loadReconnectInfo();
      if (reconnectInfo.token && reconnectInfo.playerId) {
        this._showLoading(true, "正在恢复登录状态...");

        // 初始化 WebSocket 连接
        if (myglobal.socket.initSocket) {
          myglobal.socket.initSocket();
        }
        var self = this;

        // 监听房间恢复事件
        myglobal.socket.onRoomRestored(function (data) {
          self._showLoading(false);

          // 恢复玩家数据
          myglobal.playerData.playerId = data.player_id;
          myglobal.playerData.nickName = data.player_name;
          myglobal.playerData.saveToLocal();

          // 跳转到游戏场景
          cc.director.loadScene("gameScene");
        });

        // 监听普通连接成功（不在房间中）
        var evt = window.eventLister ? window.eventLister({}) : null;
        if (evt) {
          evt.on("connection_success", function (data) {
            self._showLoading(false);
            myglobal.playerData.playerId = data.player_id;
            myglobal.playerData.nickName = data.player_name;
            myglobal.playerData.gobal_count = data.gold || 0;
            myglobal.playerData.saveToLocal();
            cc.director.loadScene("hallScene");
          });
        }
        return;
      }
    }

    // 初始化背景音乐 - 处理浏览器自动播放策略
    this._initBackgroundMusic();
    if (myglobal.socket && myglobal.socket.initSocket) {
      myglobal.socket.initSocket();
    }
  },
  // 初始化背景音乐 - 处理浏览器自动播放策略
  _initBackgroundMusic: function _initBackgroundMusic() {
    var self = this;

    // 音效开关检查
    var isopen_sound = typeof window.isopen_sound !== 'undefined' ? window.isopen_sound : 1;
    if (!isopen_sound) {
      return;
    }

    // 初始化状态
    this._musicPlaying = false;
    this._touchListenerAdded = false;

    // 使用 cc.resources.load 加载音频
    cc.resources.load("sound/login_bg", cc.AudioClip, function (err, clip) {
      if (!cc.isValid(self.node)) return;
      if (err) {
        self._setupGlobalTouchForMusic();
        return;
      }

      // 保存音频剪辑
      self._bgMusicClip = clip;
      try {
        // 使用 playMusic 播放背景音乐（统一的背景音乐管理）
        cc.audioEngine.playMusic(clip, true);
        self._musicPlaying = true;
        // 成功播放，确保监听器被移除
        self._removeGlobalTouchForMusic();
      } catch (e) {
        self._setupGlobalTouchForMusic();
      }
    });
  },
  // 通过触摸播放音乐
  _playMusicOnTouch: function _playMusicOnTouch() {
    var self = this;

    // 首先检查是否有正在播放的音乐
    if (cc.audioEngine.isMusicPlaying()) {
      this._removeGlobalTouchForMusic();
      return;
    }

    // 如果已经有音频剪辑，直接播放
    if (this._bgMusicClip) {
      try {
        cc.audioEngine.playMusic(this._bgMusicClip, true);
        this._musicPlaying = true;
        this._removeGlobalTouchForMusic();
      } catch (e) {}
      return;
    }

    // 没有音频剪辑，需要加载
    cc.resources.load("sound/login_bg", cc.AudioClip, function (err, clip) {
      if (!cc.isValid(self.node)) return;
      if (err) {
        return;
      }
      self._bgMusicClip = clip;
      try {
        cc.audioEngine.playMusic(clip, true);
        self._musicPlaying = true;
        self._removeGlobalTouchForMusic();
      } catch (e) {}
    });
  },
  // 设置全局触摸监听 - 用户点击任意位置触发音乐
  _setupGlobalTouchForMusic: function _setupGlobalTouchForMusic() {
    // 防止重复添加监听器
    if (this._touchListenerAdded) {
      return;
    }
    var self = this;
    this._touchListenerAdded = true;

    // Cocos Creator 层面的监听
    this._cocosTouchHandler = function () {
      self._playMusicOnTouch();
    };
    this.node.on(cc.Node.EventType.TOUCH_START, this._cocosTouchHandler, this);

    // Web 浏览器层面的监听
    if (cc.sys.isBrowser) {
      this._browserTouchHandler = function () {
        self._playMusicOnTouch();
      };
      document.addEventListener('touchstart', this._browserTouchHandler, true);
      document.addEventListener('mousedown', this._browserTouchHandler, true);
      document.addEventListener('click', this._browserTouchHandler, true);
    }
  },
  // 移除全局触摸监听
  _removeGlobalTouchForMusic: function _removeGlobalTouchForMusic() {
    // 移除 Cocos Creator 层面的监听
    if (this._cocosTouchHandler) {
      this.node.off(cc.Node.EventType.TOUCH_START, this._cocosTouchHandler, this);
      this._cocosTouchHandler = null;
    }

    // 移除浏览器层面的监听
    if (cc.sys.isBrowser && this._browserTouchHandler) {
      document.removeEventListener('touchstart', this._browserTouchHandler, true);
      document.removeEventListener('mousedown', this._browserTouchHandler, true);
      document.removeEventListener('click', this._browserTouchHandler, true);
      this._browserTouchHandler = null;
    }
    this._touchListenerAdded = false;
  },
  _showError: function _showError(message) {
    this._showWaitNode(message);
    this.scheduleOnce(function () {
      this._hideWaitNode();
    }, 2);
  },
  _showLoading: function _showLoading(show, message) {
    if (show) {
      this._showWaitNode(message || "正在处理...");
    } else {
      this._hideWaitNode();
    }
  },
  _showWaitNode: function _showWaitNode(message) {
    if (this.wait_node) {
      this.wait_node.active = true;
      if (this._waitLabel) {
        this._waitLabel.string = message || "正在处理...";
      }
      if (this._loadingImage) {
        this._isAnimating = true;
      }
    }
  },
  _hideWaitNode: function _hideWaitNode() {
    if (this.wait_node) {
      this.wait_node.active = false;
      this._isAnimating = false;
    }
  },
  // 绘制圆角矩形输入框背景（辅助方法）
  // 注意：Cocos Creator Graphics 组件没有 arcTo 方法，使用 roundRect 代替
  _drawInputBg: function _drawInputBg(graphics, width, height, radius) {
    var x = -width / 2;
    var y = -height / 2;
    // 使用 Cocos Creator Graphics 的 roundRect 方法
    graphics.roundRect(x, y, width, height, radius);
  },
  update: function update(dt) {
    if (this._isAnimating && this._loadingImage) {
      // 使用 angle 替代已废弃的 rotation 属性
      this._loadingImage.angle += dt * 45;
    }
  },
  _doWxLogin: function _doWxLogin() {
    var self = this;
    if (!this._checkAgreement()) {
      this._showError("请先同意用户协议");
      return;
    }
    var myglobal = window.myglobal;
    if (!myglobal || !myglobal.socket) {
      this._showError("网络未连接，请稍后重试");
      return;
    }
    this._showLoading(true, "正在登录...");
    myglobal.socket.request_wxLogin({
      uniqueID: myglobal.playerData.uniqueID,
      accountID: myglobal.playerData.accountID,
      nickName: myglobal.playerData.nickName,
      avatarUrl: myglobal.playerData.avatarUrl
    }, function (err, result) {
      self._showLoading(false);
      if (err != 0) {
        self._showError("登录失败，请重试");
        return;
      }
      myglobal.playerData.gobal_count = result.goldcount || 0;
      cc.director.loadScene("hallScene");
    });
  },
  _doPhoneLogin: function _doPhoneLogin() {
    console.log(">>> _doPhoneLogin 被调用");

    // 🔧 修复：防止重复点击导致多个弹窗
    if (this._phoneLoginPopupShowing) {
      console.log(">>> 登录弹窗正在显示中，忽略重复调用");
      return;
    }
    if (!this._checkAgreement()) {
      console.log(">>> 用户未同意协议");
      this._showError("请先同意用户协议");
      return;
    }

    // 设置标志位，防止重复弹窗
    this._phoneLoginPopupShowing = true;
    console.log(">>> 准备显示手机登录弹窗");
    this._showPhoneLoginPopup();
  },
  _showPhoneLoginPopup: function _showPhoneLoginPopup() {
    var self = this;
    console.log(">>> _showPhoneLoginPopup 被调用");
    console.log(">>> phone_login_prefab:", this.phone_login_prefab ? "存在" : "不存在");
    if (this.phone_login_prefab) {
      this._createPhoneLoginPopup(this.phone_login_prefab);
    } else {
      console.log(">>> 动态加载 prefabs/phone_login");
      cc.resources.load("prefabs/phone_login", cc.Prefab, function (err, prefab) {
        if (!cc.isValid(self.node)) return;
        if (err) {
          console.error("加载 phone_login prefab 失败:", err);
          self._showError("无法显示登录弹窗");
          return;
        }
        console.log(">>> phone_login prefab 加载成功");
        self._createPhoneLoginPopup(prefab);
      });
    }
  },
  _createPhoneLoginPopup: function _createPhoneLoginPopup(prefab) {
    console.log(">>> _createPhoneLoginPopup 被调用");

    // 动态创建弹窗（使用正确的背景图和尺寸）
    try {
      console.log(">>> 开始动态创建登录弹窗");
      var popup = this._createPhoneLoginDynamic();
      console.log(">>> 登录弹窗创建完成:", popup ? popup.name : "null");
      this._phoneLoginPopup = popup;
    } catch (e) {
      console.error("创建手机登录弹窗失败:", e);
      this._showError("无法显示登录弹窗: " + e.message);
      // 🔧 修复：创建失败时重置标志位，允许下次点击重试
      this._phoneLoginPopupShowing = false;
    }
  },
  // 动态创建手机登录弹窗 - 使用正确的背景图和尺寸
  _createPhoneLoginDynamic: function _createPhoneLoginDynamic() {
    var self = this;

    // ==================== 弹窗尺寸（固定尺寸，与图片匹配）====================
    // 使用固定尺寸：宽度520px，高度680px（与login_bg.png图片尺寸一致）
    // 在小屏幕上自动缩放
    var winW = cc.winSize.width;
    var winH = cc.winSize.height;

    // 图片原始尺寸 - 调宽弹窗
    var imgWidth = 580; // 原来是520，增加到580
    var imgHeight = 680;

    // 如果屏幕太小，按比例缩小
    var scale = 1.0;
    if (winW < imgWidth + 40) {
      scale = (winW - 40) / imgWidth;
    }
    var panelWidth = imgWidth * scale;
    var panelHeight = imgHeight * scale;
    console.log("登录弹窗尺寸: " + panelWidth + " x " + panelHeight + ", 缩放比例: " + scale);

    // ==================== 弹窗根节点 ====================
    var popup = new cc.Node("LoginDialog");
    popup.parent = this.node;
    popup.setContentSize(cc.size(winW, winH));
    popup.setPosition(0, 0);
    popup.zIndex = 1000;

    // 添加 BlockInputEvents 组件阻止底层点击
    popup.addComponent(cc.BlockInputEvents);

    // ==================== 半透明背景遮罩 ====================
    var mask = new cc.Node("Mask");
    mask.parent = popup;
    mask.setContentSize(cc.size(winW, winH));
    mask.setPosition(0, 0);
    var maskSprite = mask.addComponent(cc.Sprite);
    maskSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    mask.color = new cc.Color(0, 0, 0);
    mask.opacity = 150;

    // 🔧 修复：点击遮罩层关闭弹窗
    mask.on(cc.Node.EventType.TOUCH_END, function () {
      console.log(">>> 点击遮罩层关闭弹窗");
      // 重置标志位
      self._phoneLoginPopupShowing = false;

      // 清理原生 HTML input 元素
      if (cc.sys.isBrowser) {
        var container = document.getElementById('native-input-container');
        if (container) {
          container.remove();
        }
      }
      // 关闭动画
      cc.tween(panel).to(0.15, {
        scale: 0.8,
        opacity: 0
      }, {
        easing: 'backIn'
      }).call(function () {
        if (cc.isValid(popup)) {
          popup.destroy();
        }
      }).start();
    }, this);

    // ==================== 弹窗面板 ====================
    var panel = new cc.Node("Panel");
    panel.parent = popup;
    panel.setContentSize(cc.size(panelWidth, panelHeight));
    panel.setPosition(0, 0);
    panel.scale = 0.7;
    panel.opacity = 0;

    // ==================== 弹窗背景（使用正确的 login_bg 图片）====================
    var bg = new cc.Node("Bg");
    bg.parent = panel;
    // 先设置一个临时尺寸
    bg.setContentSize(cc.size(panelWidth, panelHeight));
    bg.setPosition(0, 0);
    bg.zIndex = 0; // 背景在最底层

    // 先添加Sprite组件并设置sizeMode
    var bgSprite = bg.addComponent(cc.Sprite);
    bgSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM; // 使用自定义尺寸，不跟随图片
    bgSprite.srcBlendFactor = cc.macro.BlendFactor.SRC_ALPHA;
    bgSprite.dstBlendFactor = cc.macro.BlendFactor.ONE_MINUS_SRC_ALPHA;

    // 加载背景图（使用 UI/login/login_bg.png）
    cc.resources.load("UI/login/login_bg", cc.SpriteFrame, function (err, spriteFrame) {
      if (!cc.isValid(bg)) return;
      if (err) {
        console.warn("加载 login_bg 失败，使用默认背景:", err);
        // 降级：使用渐变背景
        bg.removeComponent(cc.Sprite);
        var bgGfx = bg.addComponent(cc.Graphics);
        bgGfx.fillColor = new cc.Color(45, 35, 25);
        bgGfx.roundRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 20);
        bgGfx.fill();
        return;
      }

      // 设置spriteFrame
      bgSprite.spriteFrame = spriteFrame;

      // 关键：再次确保尺寸正确（防止被图片尺寸覆盖）
      bg.setContentSize(cc.size(panelWidth, panelHeight));
      console.log("背景图加载成功，显示尺寸: " + bg.width + " x " + bg.height);
    });

    // ==================== 标题文字（欢乐登录）====================
    // 金色描边，白色主体，居中，顶部距边40px
    var titleNode = new cc.Node("Title");
    titleNode.parent = panel;
    titleNode.setPosition(0, panelHeight / 2 - 60);
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = "欢乐登录";
    titleLabel.fontSize = 36;
    titleLabel.lineHeight = 44;
    titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    titleNode.color = new cc.Color(255, 255, 255);

    // 金色描边
    var titleOutline = titleNode.addComponent(cc.LabelOutline);
    titleOutline.color = new cc.Color(218, 165, 32); // 金色
    titleOutline.width = 3;

    // ==================== 关闭按钮（右上角圆形，红金色，46x46）====================
    var closeBtn = new cc.Node("BtnClose");
    closeBtn.parent = panel;
    closeBtn.setContentSize(cc.size(46, 46));
    closeBtn.setPosition(panelWidth / 2 - 35, panelHeight / 2 - 35);

    // 红金色圆形背景
    var closeGfx = closeBtn.addComponent(cc.Graphics);
    closeGfx.fillColor = new cc.Color(200, 60, 60); // 红色
    closeGfx.circle(0, 0, 23);
    closeGfx.fill();
    closeGfx.strokeColor = new cc.Color(218, 165, 32); // 金色边框
    closeGfx.lineWidth = 2;
    closeGfx.circle(0, 0, 22);
    closeGfx.stroke();

    // X 符号
    var closeX = new cc.Node("X");
    closeX.parent = closeBtn;
    var closeXLabel = closeX.addComponent(cc.Label);
    closeXLabel.string = "×";
    closeXLabel.fontSize = 28;
    closeXLabel.lineHeight = 32;
    closeXLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    closeX.color = new cc.Color(255, 255, 255);
    closeBtn.on(cc.Node.EventType.TOUCH_END, function () {
      console.log(">>> 点击关闭按钮");
      // 🔧 修复：重置弹窗显示标志位
      self._phoneLoginPopupShowing = false;
      console.log(">>> 已重置 _phoneLoginPopupShowing 为 false");

      // 清理原生 HTML input 元素
      if (cc.sys.isBrowser) {
        var container = document.getElementById('native-input-container');
        if (container) {
          container.remove();
        }
      }
      // 关闭动画
      cc.tween(panel).to(0.15, {
        scale: 0.8,
        opacity: 0
      }, {
        easing: 'backIn'
      }).call(function () {
        if (cc.isValid(popup)) {
          popup.destroy();
        }
      }).start();
    }, this);

    // ==================== 表单布局参数 ====================
    // 根据背景图login_bg.png(520x680)的精确预留位置设置元素
    // 使用项目现有的UI资源：
    //   icon_phone.png - 手机图标
    //   icon_shield.png - 验证码图标
    //   get_mobile_code.png - 获取验证码按钮

    // 计算缩放比例（小屏幕适配）
    var scaleRatio = panelWidth / 520;

    // 输入框尺寸
    var inputWidth = 220 * scaleRatio; // 输入框宽度
    var inputHeight = 45 * scaleRatio; // 输入框高度（减小）
    var iconSize = 25 * scaleRatio; // 图标大小
    var formY1 = 130 * scaleRatio; // 第一个输入框Y坐标（向下移动）
    var formY2 = 50 * scaleRatio; // 第二个输入框Y坐标
    var getCodeBtnWidth = 90 * scaleRatio; // 获取验证码按钮宽度
    var btnHeight = 45 * scaleRatio; // 统一按钮高度

    console.log("布局参数: scaleRatio=" + scaleRatio.toFixed(2));

    // ==================== 手机号输入行 ====================
    // 布局：[图标] [输入框] 整体居中
    var phoneRowWidth = iconSize + 15 + inputWidth; // 总宽度
    var phoneRowX = 0; // 整体居中

    // 手机图标 - 放在输入框左边
    var phoneIconNode = new cc.Node("PhoneIcon");
    phoneIconNode.parent = panel;
    phoneIconNode.setPosition(-phoneRowWidth / 2 + iconSize / 2 + 10, formY1);
    phoneIconNode.setContentSize(cc.size(iconSize, iconSize));
    cc.resources.load("UI/login/icon_phone", cc.SpriteFrame, function (err, spriteFrame) {
      if (err || !cc.isValid(phoneIconNode)) return;
      var iconSprite = phoneIconNode.addComponent(cc.Sprite);
      iconSprite.spriteFrame = spriteFrame;
      iconSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    });

    // ==================== 手机号输入框 ====================
    // login_bg.png 中已包含输入框背景，只需放置透明的 EditBox
    // 注意：由于 panel 有缩放动画，EditBox 需要在动画完成后创建，否则点击区域位置不对
    var phoneInputNode = new cc.Node("PhoneInput");
    phoneInputNode.parent = panel;
    phoneInputNode.setContentSize(cc.size(inputWidth, inputHeight));
    phoneInputNode.setPosition(-phoneRowWidth / 2 + iconSize + 15 + inputWidth / 2, formY1);
    phoneInputNode.zIndex = 100;
    var phoneEditBox = null; // 延迟创建

    // ==================== 验证码输入行 ====================
    // 布局：[图标] [输入框] [获取验证码按钮] 整体居中
    var codeInputW = inputWidth - getCodeBtnWidth - 10; // 验证码输入框宽度
    var codeRowWidth = iconSize + 5 + codeInputW + 5 + getCodeBtnWidth; // 总宽度

    // 验证码图标
    var codeIconNode = new cc.Node("CodeIcon");
    codeIconNode.parent = panel;
    codeIconNode.setPosition(-codeRowWidth / 2 + iconSize / 2 + 10, formY2);
    codeIconNode.setContentSize(cc.size(iconSize, iconSize));
    cc.resources.load("UI/login/icon_shield", cc.SpriteFrame, function (err, spriteFrame) {
      if (err || !cc.isValid(codeIconNode)) return;
      var iconSprite = codeIconNode.addComponent(cc.Sprite);
      iconSprite.spriteFrame = spriteFrame;
      iconSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    });

    // ==================== 验证码输入框 ====================
    // login_bg.png 中已包含输入框背景，只需放置透明的 EditBox
    // 注意：由于 panel 有缩放动画，EditBox 需要在动画完成后创建，否则点击区域位置不对
    var codeInputNode = new cc.Node("CodeInput");
    codeInputNode.parent = panel;
    codeInputNode.setContentSize(cc.size(codeInputW, inputHeight));
    codeInputNode.setPosition(-codeRowWidth / 2 + iconSize + 5 + codeInputW / 2, formY2);
    codeInputNode.zIndex = 100;
    var codeEditBox = null; // 延迟创建

    // 获取验证码按钮
    var getCodeBtn = new cc.Node("BtnGetCode");
    getCodeBtn.parent = panel;
    getCodeBtn.setContentSize(cc.size(getCodeBtnWidth, btnHeight));
    getCodeBtn.setPosition(codeRowWidth / 2 - getCodeBtnWidth / 2, formY2);
    var getCodeBtnComp = getCodeBtn.addComponent(cc.Button);
    getCodeBtnComp.transition = cc.Button.Transition.SCALE;
    getCodeBtnComp.zoomScale = 0.95;
    cc.resources.load("UI/login/get_mobile_code", cc.SpriteFrame, function (err, spriteFrame) {
      if (!cc.isValid(getCodeBtn)) return;
      if (err) {
        console.warn("加载获取验证码按钮图片失败:", err);
        // 降级：使用纯色按钮
        var btnGfx = getCodeBtn.addComponent(cc.Graphics);
        btnGfx.fillColor = new cc.Color(255, 165, 0);
        btnGfx.roundRect(-getCodeBtnWidth / 2, -inputHeight / 2, getCodeBtnWidth, inputHeight, 5);
        btnGfx.fill();
        var btnLabel = new cc.Node("Label");
        btnLabel.parent = getCodeBtn;
        var labelComp = btnLabel.addComponent(cc.Label);
        labelComp.string = "获取验证码";
        labelComp.fontSize = 12 * scaleRatio;
        labelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        btnLabel.color = new cc.Color(255, 255, 255);
        return;
      }
      var btnSprite = getCodeBtn.addComponent(cc.Sprite);
      btnSprite.spriteFrame = spriteFrame;
      btnSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
      getCodeBtn.setContentSize(cc.size(getCodeBtnWidth, btnHeight));
    });

    // 倒计时状态
    var countdown = 0;
    var countdownLabel = null;

    // 开始倒计时
    var startCountdown = function startCountdown() {
      countdown = 60;
      getCodeBtnComp.interactable = false;
      getCodeBtn.opacity = 150;
      var tick = function tick() {
        countdown--;
        if (countdown <= 0) {
          getCodeBtnComp.interactable = true;
          getCodeBtn.opacity = 255;
          if (countdownLabel) {
            countdownLabel.string = "";
          }
        } else {
          if (!countdownLabel) {
            countdownLabel = new cc.Node("Countdown");
            countdownLabel.parent = getCodeBtn;
            countdownLabel.color = new cc.Color(255, 255, 255);
            var labelComp = countdownLabel.addComponent(cc.Label);
            labelComp.fontSize = 14 * scaleRatio;
            labelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
          }
          countdownLabel.getComponent(cc.Label).string = countdown + "s";
          self.scheduleOnce(tick, 1);
        }
      };
      self.scheduleOnce(tick, 1);
    };

    // ==================== 手机登录按钮 ====================
    // btn_mobile_login.png 原始尺寸: 340 x 50，宽高比 6.8:1
    var loginBtnY = formY2 - 70 * scaleRatio;
    var loginBtnHeight = 50 * scaleRatio; // 按钮高度
    var loginBtnWidth = loginBtnHeight * 6.8; // 按图片原始比例计算宽度 (340/50=6.8)

    var loginBtn = new cc.Node("BtnLogin");
    loginBtn.parent = panel;
    loginBtn.setContentSize(cc.size(loginBtnWidth, loginBtnHeight));
    loginBtn.setPosition(0, loginBtnY);

    // 尝试加载按钮图片
    cc.resources.load("UI/login/btn_mobile_login", cc.SpriteFrame, function (err, spriteFrame) {
      if (!cc.isValid(loginBtn)) return;
      if (err) {
        // 降级：使用纯色按钮
        var loginGfx = loginBtn.addComponent(cc.Graphics);
        loginGfx.fillColor = new cc.Color(255, 140, 0);
        loginGfx.roundRect(-loginBtnWidth / 2, -loginBtnHeight / 2, loginBtnWidth, loginBtnHeight, 8 * scaleRatio);
        loginGfx.fill();
        return;
      }
      var loginSprite = loginBtn.addComponent(cc.Sprite);
      loginSprite.spriteFrame = spriteFrame;
      loginSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
      loginBtn.setContentSize(cc.size(loginBtnWidth, loginBtnHeight));
    });
    var loginBtnComp = loginBtn.addComponent(cc.Button);
    loginBtnComp.transition = cc.Button.Transition.SCALE;
    loginBtnComp.zoomScale = 0.95;

    // ==================== 微信登录按钮 ====================
    // icon_wechat.png 原始尺寸: 48 x 48（正方形）
    var wxBtnY = loginBtnY - 155 * scaleRatio; // 往下移动更多
    var wxBtnSize = 48 * scaleRatio; // 使用图片原始尺寸 48

    var wxBtn = new cc.Node("BtnWechat");
    wxBtn.parent = panel;
    wxBtn.setContentSize(cc.size(wxBtnSize, wxBtnSize));
    wxBtn.setPosition(0, wxBtnY);

    // 尝试加载微信图标
    cc.resources.load("UI/login/icon_wechat", cc.SpriteFrame, function (err, spriteFrame) {
      if (!cc.isValid(wxBtn)) return;
      if (err) {
        // 降级：使用绿色圆形背景
        var wxBgGfx = wxBtn.addComponent(cc.Graphics);
        wxBgGfx.fillColor = new cc.Color(7, 193, 96);
        wxBgGfx.circle(0, 0, wxBtnSize / 2);
        wxBgGfx.fill();
        return;
      }
      var wxSprite = wxBtn.addComponent(cc.Sprite);
      wxSprite.spriteFrame = spriteFrame;
      wxSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
      wxBtn.setContentSize(cc.size(wxBtnSize, wxBtnSize));
    });
    var wxBtnComp = wxBtn.addComponent(cc.Button);
    wxBtnComp.transition = cc.Button.Transition.SCALE;
    wxBtnComp.zoomScale = 0.95;

    // 微信登录文字 - 隐藏
    // var wxLabel = new cc.Node("LabelWechat");
    // wxLabel.parent = panel;
    // wxLabel.setPosition(0, wxBtnY - 35 * scaleRatio);
    // var wxLabelComp = wxLabel.addComponent(cc.Label);
    // wxLabelComp.string = "微信登录";
    // wxLabelComp.fontSize = 12 * scaleRatio;
    // wxLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    // wxLabel.color = new cc.Color(100, 80, 60);

    console.log("按钮位置: loginBtnY=" + loginBtnY.toFixed(0) + ", wxBtnY=" + wxBtnY.toFixed(0));

    // ==================== 消息提示（隐藏）====================
    var messageLabel = new cc.Node("MessageLabel");
    messageLabel.parent = panel;
    messageLabel.setPosition(0, -panelHeight / 2 + 50);
    var messageLabelComp = messageLabel.addComponent(cc.Label);
    messageLabelComp.string = "";
    messageLabelComp.fontSize = 14;
    messageLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    messageLabel.active = false;

    // ==================== 弹窗进入动画 ====================
    cc.tween(panel).to(0.25, {
      scale: 1,
      opacity: 255
    }, {
      easing: 'backOut'
    }).call(function () {
      // Web 平台：直接创建原生 HTML input 元素
      if (cc.sys.isBrowser) {
        _createNativeInputElements(panel, phoneInputNode, codeInputNode, inputWidth, inputHeight, codeInputW, panelWidth, panelHeight);
      } else {
        // 非 Web 平台：使用 Cocos EditBox
        phoneEditBox = phoneInputNode.addComponent(cc.EditBox);
        phoneEditBox.placeholder = "请输入手机号";
        phoneEditBox.fontSize = 18;
        phoneEditBox.placeholderFontSize = 14;
        phoneEditBox.fontColor = new cc.Color(50, 50, 50, 255);
        phoneEditBox.placeholderFontColor = new cc.Color(150, 150, 150, 255);
        phoneEditBox.inputFlag = cc.EditBox.InputFlag.SENSITIVE;
        phoneEditBox.inputMode = cc.EditBox.InputMode.NUMERIC;
        phoneEditBox.maxLength = 11;
        phoneEditBox.backgroundColor = new cc.Color(0, 0, 0, 0);
        codeEditBox = codeInputNode.addComponent(cc.EditBox);
        codeEditBox.placeholder = "验证码";
        codeEditBox.fontSize = 18;
        codeEditBox.placeholderFontSize = 14;
        codeEditBox.fontColor = new cc.Color(50, 50, 50, 255);
        codeEditBox.placeholderFontColor = new cc.Color(150, 150, 150, 255);
        codeEditBox.inputFlag = cc.EditBox.InputFlag.SENSITIVE;
        codeEditBox.inputMode = cc.EditBox.InputMode.NUMERIC;
        codeEditBox.maxLength = 6;
        codeEditBox.backgroundColor = new cc.Color(0, 0, 0, 0);
      }
      console.log("输入框创建完成");
    }).start();

    // ==================== 功能逻辑 ====================
    var phone = "";
    var code = "";

    // 获取输入值的辅助函数（支持原生 HTML input）
    var getInputValue = function getInputValue(inputId) {
      if (cc.sys.isBrowser) {
        var input = document.getElementById(inputId);
        return input ? input.value : "";
      }
      return "";
    };

    // 验证手机号
    var validatePhone = function validatePhone(phone) {
      if (!phone || phone.length !== 11) return false;
      return /^1[3-9]\d{9}$/.test(phone);
    };

    // 显示消息
    var showMessage = function showMessage(msg, isError) {
      messageLabel.active = true;
      messageLabelComp.string = msg;
      messageLabel.color = isError ? new cc.Color(255, 80, 80) : new cc.Color(100, 200, 100);
    };

    // 获取验证码 - onGetCode()
    getCodeBtn.on(cc.Node.EventType.TOUCH_END, function () {
      // 支持原生 HTML input 或 Cocos EditBox
      if (cc.sys.isBrowser) {
        phone = getInputValue('native-phone-input');
      } else if (phoneEditBox) {
        phone = phoneEditBox.string || "";
      }
      if (!validatePhone(phone)) {
        showMessage("请输入正确的手机号", true);
        return;
      }
      var defines = window.defines;
      if (!defines || !defines.apiUrl) {
        showMessage("验证码已发送(测试)", false);
        startCountdown();
        return;
      }

      // 使用加密请求发送验证码
      var HttpAPI = window.HttpAPI;
      if (HttpAPI && defines.cryptoKey) {
        HttpAPI.postEncrypted(defines.apiUrl + '/api/v1/auth/send-code', 'send_code', {
          phone: phone
        }, defines.cryptoKey, function (err, resp) {
          if (err) {
            showMessage(err || "发送失败", true);
            return;
          }
          if (resp && resp.code === 0) {
            showMessage("验证码已发送", false);
            startCountdown();
          } else {
            showMessage(resp.message || "发送失败", true);
          }
        });
      } else {
        // 降级：使用明文请求
        var xhr = new XMLHttpRequest();
        xhr.open('POST', defines.apiUrl + '/api/v1/auth/send-code', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 10000;
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                var resp = JSON.parse(xhr.responseText);
                if (resp.code === 0) {
                  showMessage("验证码已发送", false);
                  startCountdown();
                } else {
                  showMessage(resp.message || "发送失败", true);
                }
              } catch (e) {
                showMessage("解析响应失败", true);
              }
            } else {
              showMessage("网络请求失败", true);
            }
          }
        };
        xhr.send(JSON.stringify({
          phone: phone
        }));
      }
    });

    // 手机登录 - onPhoneLogin()
    loginBtn.on(cc.Node.EventType.TOUCH_END, function () {
      // 支持原生 HTML input 或 Cocos EditBox
      if (cc.sys.isBrowser) {
        phone = getInputValue('native-phone-input');
        code = getInputValue('native-code-input');
      } else {
        if (phoneEditBox) phone = phoneEditBox.string || "";
        if (codeEditBox) code = codeEditBox.string || "";
      }
      if (!validatePhone(phone)) {
        showMessage("请输入正确的手机号", true);
        return;
      }
      showMessage("正在登录...", false);
      var defines = window.defines;
      if (!defines || !defines.apiUrl) {
        // 无API配置，模拟登录成功
        if (window.myglobal) {
          var loginData = {
            uniqueID: "phone_" + phone,
            accountID: "phone_" + phone,
            nickName: "玩家" + phone.substr(-4),
            avatarUrl: "",
            goldCount: 1000,
            token: "test_token_" + Date.now(),
            phone: phone,
            loginType: 1
          };
          window.myglobal.onLoginSuccess(loginData);
        }
        showMessage("登录成功", false);
        self.scheduleOnce(function () {
          _removeNativeInputElements();
          if (cc.isValid(popup)) {
            popup.destroy();
          }
          cc.director.loadScene("hallScene");
        }, 0.5);
        return;
      }

      // 使用加密请求登录
      var HttpAPI = window.HttpAPI;
      if (HttpAPI && defines.cryptoKey) {
        HttpAPI.postEncrypted(defines.apiUrl + '/api/v1/auth/phone-login', 'phone_login', {
          phone: phone,
          code: code
        }, defines.cryptoKey, function (err, resp) {
          if (err) {
            showMessage(err || "登录失败", true);
            return;
          }
          if (resp && resp.code === 0 && resp.data) {
            showMessage("登录成功", false);
            // 使用 myglobal.onLoginSuccess 保存登录状态
            if (window.myglobal) {
              var loginData = {
                uniqueID: resp.data.uniqueID || "",
                accountID: resp.data.accountID || "",
                nickName: resp.data.nickName || "玩家",
                avatarUrl: resp.data.avatarUrl || "",
                goldCount: resp.data.goldcount || 0,
                token: resp.data.token || "",
                phone: phone,
                loginType: 1
              };
              window.myglobal.onLoginSuccess(loginData);
            }
            self.scheduleOnce(function () {
              _removeNativeInputElements();
              if (cc.isValid(popup)) {
                popup.destroy();
              }
              cc.director.loadScene("hallScene");
            }, 0.5);
          } else {
            showMessage(resp.message || "登录失败", true);
          }
        });
      } else {
        // 降级：使用明文请求
        var xhr = new XMLHttpRequest();
        xhr.open('POST', defines.apiUrl + '/api/v1/auth/phone-login', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-Device-ID', 'web_' + Date.now());
        xhr.setRequestHeader('X-Device-Type', 'Web Browser');
        xhr.timeout = 10000;
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                var resp = JSON.parse(xhr.responseText);
                if (resp.code === 0 && resp.data) {
                  showMessage("登录成功", false);
                  // 使用 myglobal.onLoginSuccess 保存登录状态
                  if (window.myglobal) {
                    var loginData = {
                      uniqueID: resp.data.uniqueID || resp.data.player_id || "",
                      accountID: resp.data.accountID || resp.data.account_id || "",
                      nickName: resp.data.nickName || resp.data.nickname || "玩家",
                      avatarUrl: resp.data.avatarUrl || resp.data.avatar || "",
                      goldCount: resp.data.goldcount || resp.data.gold || 0,
                      token: resp.data.token || "",
                      phone: phone,
                      loginType: 1
                    };
                    window.myglobal.onLoginSuccess(loginData);
                  }
                  self.scheduleOnce(function () {
                    _removeNativeInputElements();
                    if (cc.isValid(popup)) {
                      popup.destroy();
                    }
                    cc.director.loadScene("hallScene");
                  }, 0.5);
                } else {
                  showMessage(resp.message || "登录失败", true);
                }
              } catch (e) {
                showMessage("解析响应失败", true);
              }
            } else {
              showMessage("网络请求失败", true);
            }
          }
        };
        xhr.send(JSON.stringify({
          phone: phone,
          code: code
        }));
      }
    });

    // 微信登录 - onWechatLogin()
    wxBtn.on(cc.Node.EventType.TOUCH_END, function () {
      showMessage("正在登录...", false);
      var defines = window.defines;
      if (!defines || !defines.apiUrl) {
        // 无API配置，模拟登录成功
        if (window.myglobal) {
          var loginData = {
            uniqueID: "wx_" + Date.now(),
            accountID: "wx_" + Date.now(),
            nickName: "微信用户",
            avatarUrl: "",
            goldCount: 1000,
            token: "test_wx_token_" + Date.now(),
            loginType: 2
          };
          window.myglobal.onLoginSuccess(loginData);
        }
        showMessage("登录成功", false);
        self.scheduleOnce(function () {
          _removeNativeInputElements();
          if (cc.isValid(popup)) {
            popup.destroy();
          }
          cc.director.loadScene("hallScene");
        }, 0.5);
        return;
      }

      // 使用加密请求微信登录
      var HttpAPI = window.HttpAPI;
      if (HttpAPI && defines.cryptoKey) {
        HttpAPI.postEncrypted(defines.apiUrl + '/api/v1/auth/wx-login', 'wx_login', {
          code: "test_code_" + Date.now()
        }, defines.cryptoKey, function (err, resp) {
          if (err) {
            showMessage(err || "登录失败", true);
            return;
          }
          if (resp && resp.code === 0 && resp.data) {
            showMessage("登录成功", false);
            if (window.myglobal && window.myglobal.playerData) {
              window.myglobal.playerData.uniqueID = resp.data.uniqueID || "";
              window.myglobal.playerData.accountID = resp.data.accountID || "";
              window.myglobal.playerData.nickName = resp.data.nickName || "微信用户";
              window.myglobal.playerData.userName = resp.data.username || "";
              window.myglobal.playerData.avatar = resp.data.avatarUrl || "";
              window.myglobal.playerData.gobal_count = resp.data.goldCount || 0;
              window.myglobal.playerData.token = resp.data.token || "";
              // 保存到本地存储
              window.myglobal.playerData.saveToLocal();
              console.log("【微信登录】用户数据已保存, nickName =", window.myglobal.playerData.nickName);
            }
            self.scheduleOnce(function () {
              _removeNativeInputElements();
              if (cc.isValid(popup)) {
                popup.destroy();
              }
              cc.director.loadScene("hallScene");
            }, 0.5);
          } else {
            showMessage(resp.message || "登录失败", true);
          }
        });
      } else {
        // 降级：使用明文请求
        var xhr = new XMLHttpRequest();
        xhr.open('POST', defines.apiUrl + '/api/v1/auth/wx-login', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 10000;
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                var resp = JSON.parse(xhr.responseText);
                if (resp.code === 0 && resp.data) {
                  showMessage("登录成功", false);
                  if (window.myglobal && window.myglobal.playerData) {
                    window.myglobal.playerData.uniqueID = resp.data.player_id || "";
                    window.myglobal.playerData.accountID = resp.data.account_id || "";
                    window.myglobal.playerData.nickName = resp.data.nickname || "微信用户";
                    window.myglobal.playerData.userName = resp.data.username || "";
                    window.myglobal.playerData.avatar = resp.data.avatar || "";
                    window.myglobal.playerData.gobal_count = resp.data.gold || 0;
                    window.myglobal.playerData.token = resp.data.token || "";
                    // 保存到本地存储
                    window.myglobal.playerData.saveToLocal();
                    console.log("【微信登录XHR】用户数据已保存, nickName =", window.myglobal.playerData.nickName);
                  }
                  self.scheduleOnce(function () {
                    _removeNativeInputElements();
                    if (cc.isValid(popup)) {
                      popup.destroy();
                    }
                    cc.director.loadScene("hallScene");
                  }, 0.5);
                } else {
                  showMessage(resp.message || "登录失败", true);
                }
              } catch (e) {
                showMessage("解析响应失败", true);
              }
            } else {
              showMessage("网络请求失败", true);
            }
          }
        };
        xhr.send(JSON.stringify({
          code: "test_code_" + Date.now()
        }));
      }
    });
    return popup;
  },
  _showUserAgreementPopup: function _showUserAgreementPopup() {
    this._createAgreementPopup();
  },
  // 创建用户协议弹窗
  _createAgreementPopup: function _createAgreementPopup() {
    var self = this;

    // ==================== 弹窗根节点 ====================
    var popup = new cc.Node("user_agreement_popup");
    popup.parent = this.node;
    popup.setContentSize(cc.size(1280, 720));
    popup.setPosition(0, 0);
    popup.zIndex = 1000;

    // ==================== 半透明黑色背景遮罩 ====================
    var bgMask = new cc.Node("bg_mask");
    bgMask.parent = popup;
    bgMask.setContentSize(cc.size(1280, 720));
    bgMask.setPosition(0, 0);
    var bgMaskSprite = bgMask.addComponent(cc.Sprite);
    bgMaskSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    bgMask.color = new cc.Color(0, 0, 0);
    bgMask.opacity = 180;

    // ==================== 主面板 ====================
    var panel = new cc.Node("content_panel");
    panel.parent = popup;
    panel.setContentSize(cc.size(900, 520));
    panel.setPosition(0, 0);
    var panelSprite = panel.addComponent(cc.Sprite);
    panelSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    panel.color = new cc.Color(255, 250, 240);

    // 加载背景图片
    cc.resources.load("images/user_agreement_bg", cc.SpriteFrame, function (err, spriteFrame) {
      if (!cc.isValid(panel)) return;
      if (!err && spriteFrame) {
        panelSprite.spriteFrame = spriteFrame;
      }
    });

    // ==================== 标题 ====================
    var titleNode = new cc.Node("title_label");
    titleNode.parent = panel;
    titleNode.setContentSize(cc.size(300, 60));
    titleNode.setPosition(0, 230);
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = "用户协议";
    titleLabel.fontSize = 36;
    titleLabel.lineHeight = 60;
    titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    titleNode.color = new cc.Color(30, 30, 30);

    // ==================== 关闭按钮 ====================
    var closeBtn = new cc.Node("close_btn");
    closeBtn.parent = panel;
    closeBtn.setContentSize(cc.size(60, 60));
    closeBtn.setPosition(400, 230);
    var closeBtnBg = new cc.Node("bg");
    closeBtnBg.parent = closeBtn;
    closeBtnBg.setContentSize(cc.size(50, 50));
    closeBtnBg.setPosition(0, 0);
    var closeBgSprite = closeBtnBg.addComponent(cc.Sprite);
    closeBgSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    closeBtnBg.color = new cc.Color(255, 255, 255);
    var closeLabelNode = new cc.Node("x");
    closeLabelNode.parent = closeBtn;
    closeLabelNode.setPosition(0, 0);
    var closeLabel = closeLabelNode.addComponent(cc.Label);
    closeLabel.string = "×";
    closeLabel.fontSize = 40;
    closeLabel.lineHeight = 50;
    closeLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    closeLabelNode.color = new cc.Color(80, 80, 80);
    var closeBtnComp = closeBtn.addComponent(cc.Button);
    closeBtnComp.transition = cc.Button.Transition.SCALE;
    closeBtnComp.zoomScale = 1.2;
    closeBtnComp.interactable = true;
    var closeHandler = new cc.Component.EventHandler();
    closeHandler.target = this.node;
    closeHandler.component = "loginScene";
    closeHandler.handler = "_closeUserAgreementPopup";
    closeHandler.customEventData = "";
    closeBtnComp.clickEvents.push(closeHandler);

    // ==================== 分隔线 ====================
    var dividerLine = new cc.Node("divider");
    dividerLine.parent = panel;
    dividerLine.setContentSize(cc.size(850, 1));
    dividerLine.setPosition(0, 195);
    var dividerSprite = dividerLine.addComponent(cc.Sprite);
    dividerSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    dividerLine.color = new cc.Color(220, 220, 220);

    // ==================== 内容滚动区域 ====================
    // 整体上移，增加底部空间，添加滚动功能
    var scrollNode = new cc.Node("scroll_view");
    scrollNode.parent = panel;
    scrollNode.setContentSize(cc.size(820, 380)); // 调整宽度
    scrollNode.setPosition(0, 0); // 上移

    // 添加 ScrollView 组件实现滚动功能
    var scrollView = scrollNode.addComponent(cc.ScrollView);
    scrollView.horizontal = false; // 禁用水平滚动
    scrollView.vertical = true; // 启用垂直滚动
    scrollView.inertia = true; // 滚动惯性
    scrollView.elastic = true; // 弹性效果

    var viewNode = new cc.Node("view");
    viewNode.parent = scrollNode;
    viewNode.setContentSize(cc.size(820, 380)); // 调整宽度
    viewNode.setPosition(0, 0);
    var mask = viewNode.addComponent(cc.Mask);
    mask.type = cc.Mask.Type.RECT;
    var contentNode = new cc.Node("content");
    contentNode.parent = viewNode;
    contentNode.anchorX = 0.5;
    contentNode.anchorY = 1;
    contentNode.setPosition(0, 190); // 居中对齐
    contentNode.setContentSize(cc.size(820, 800)); // 增加高度以容纳所有内容

    // 设置 ScrollView 的 content 属性
    scrollView.content = contentNode;
    var richTextNode = new cc.Node("rich_text");
    richTextNode.parent = contentNode;
    richTextNode.anchorX = 0;
    richTextNode.anchorY = 1;
    richTextNode.setPosition(-385, -15); // 增加左边距，文字整体上移

    var richText = richTextNode.addComponent(cc.RichText);
    richText.fontSize = 16; // 字号加大：14 -> 16
    richText.lineHeight = 26; // 行高加大：24 -> 26
    richText.maxWidth = 760; // 调整宽度，确保左右边距

    // 设置文字颜色为黑色
    var agreementText = "<b><color=#000000>用户协议</color></b>\n\n" + "<color=#000000>欢迎使用本游戏！在使用前，请仔细阅读以下协议：</color>\n\n" + "<b><color=#000000>一、服务条款</color></b>\n" + "<color=#000000>1. 用户应遵守国家法律法规，文明游戏。</color>\n" + "<color=#000000>2. 禁止使用外挂、作弊软件等破坏游戏公平性的行为。</color>\n" + "<color=#000000>3. 用户账号安全由用户自行负责，请妥善保管账号密码。</color>\n\n" + "<b><color=#000000>二、隐私政策</color></b>\n" + "<color=#000000>1. 我们会收集必要的用户信息用于提供服务。</color>\n" + "<color=#000000>2. 我们承诺保护用户隐私，不会向第三方泄露用户信息。</color>\n" + "<color=#000000>3. 用户有权要求删除个人数据。</color>\n\n" + "<b><color=#000000>三、免责声明</color></b>\n" + "<color=#000000>1. 因不可抗力导致的服务中断，我们不承担责任。</color>\n" + "<color=#000000>2. 用户因违规操作造成的损失，由用户自行承担。</color>\n\n" + "<color=#000000>如有疑问，请联系客服。</color>";
    richText.string = agreementText;

    // 滚动到顶部
    scrollView.scrollToTop(0);
    this._userAgreementPopup = popup;
  },
  _closeUserAgreementPopup: function _closeUserAgreementPopup() {
    if (this._userAgreementPopup) {
      this._userAgreementPopup.destroy();
      this._userAgreementPopup = null;
    }
  },
  // 销毁时清理
  onDestroy: function onDestroy() {
    this._removeGlobalTouchForMusic();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0c1xcc2NyaXB0c1xcbG9naW5zY2VuZVxcbG9naW5TY2VuZS5qcyJdLCJuYW1lcyI6WyJfZ2xvYmFsU3R5bGVGaXhBcHBsaWVkIiwiX2ZpeEVkaXRCb3hTdHlsZSIsImVkaXRCb3giLCJmb250Q29sb3IiLCJiZ0NvbG9yIiwiY2MiLCJzeXMiLCJpc0Jyb3dzZXIiLCJfYXBwbHlJbnB1dFN0eWxlcyIsInNldFRpbWVvdXQiLCJfaW5qZWN0R2xvYmFsU3R5bGVzIiwiaW5wdXRzIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yQWxsIiwiaSIsImxlbmd0aCIsImlucHV0IiwiX3N0eWxlU2luZ2xlSW5wdXQiLCJ0ZXh0YXJlYXMiLCJqIiwiZSIsImNvbnNvbGUiLCJlcnJvciIsImlkIiwic3R5bGUiLCJzZXRQcm9wZXJ0eSIsImNvbG9yIiwiYmFja2dyb3VuZENvbG9yIiwiZGlzcGxheSIsImFsaWduSXRlbXMiLCJqdXN0aWZ5Q29udGVudCIsImJveFNpemluZyIsInBhZGRpbmciLCJsaW5lSGVpZ2h0IiwiaGVpZ2h0IiwiZm9udFNpemUiLCJ3ZWJraXRUZXh0RmlsbENvbG9yIiwib3BhY2l0eSIsInZpc2liaWxpdHkiLCJjYXJldENvbG9yIiwidGV4dFNoYWRvdyIsIm91dGxpbmUiLCJib3JkZXIiLCJyZW1vdmVQcm9wZXJ0eSIsInN0eWxlSWQiLCJnZXRFbGVtZW50QnlJZCIsImNzcyIsImNyZWF0ZUVsZW1lbnQiLCJ0eXBlIiwiYXBwZW5kQ2hpbGQiLCJjcmVhdGVUZXh0Tm9kZSIsImhlYWQiLCJfY3JlYXRlTmF0aXZlSW5wdXRFbGVtZW50cyIsInBhbmVsIiwicGhvbmVJbnB1dE5vZGUiLCJjb2RlSW5wdXROb2RlIiwiaW5wdXRXaWR0aCIsImlucHV0SGVpZ2h0IiwiY29kZUlucHV0VyIsInBhbmVsV2lkdGgiLCJwYW5lbEhlaWdodCIsImNhbnZhcyIsInF1ZXJ5U2VsZWN0b3IiLCJjYW52YXNSZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0Iiwid2luU2l6ZSIsImxvZyIsImxlZnQiLCJ0b3AiLCJ3aWR0aCIsInNjYWxlWCIsInNjYWxlWSIsInRvRml4ZWQiLCJwaG9uZVdvcmxkUG9zIiwiY29udmVydFRvV29ybGRTcGFjZUFSIiwidjIiLCJjb2RlV29ybGRQb3MiLCJ4IiwieSIsInBob25lT2Zmc2V0WCIsInBob25lT2Zmc2V0WSIsImNvZGVPZmZzZXRYIiwiY29kZU9mZnNldFkiLCJhY3R1YWxJbnB1dFdpZHRoIiwiYWN0dWFsSW5wdXRIZWlnaHQiLCJhY3R1YWxDb2RlSW5wdXRXaWR0aCIsImNhbGNTY3JlZW5Qb3NGcm9tV29ybGQiLCJ3b3JsZFBvcyIsIm5vZGVXaWR0aCIsIm5vZGVIZWlnaHQiLCJvZmZzZXRYIiwib2Zmc2V0WSIsInNjcmVlblgiLCJzY3JlZW5ZIiwiY2FudmFzWCIsImNhbnZhc1kiLCJhY3R1YWxXaWR0aCIsImFjdHVhbEhlaWdodCIsInBob25lU2NyZWVuIiwiY29kZVNjcmVlbiIsIk1hdGgiLCJtYXgiLCJtaW4iLCJvbGRDb250YWluZXIiLCJyZW1vdmUiLCJjb250YWluZXIiLCJjc3NUZXh0Iiwiam9pbiIsImJvZHkiLCJwaG9uZUlucHV0IiwicGxhY2Vob2xkZXIiLCJtYXhMZW5ndGgiLCJjb2RlSW5wdXQiLCJhZGRFdmVudExpc3RlbmVyIiwicGhvbmVDaGVjayIsImNvZGVDaGVjayIsInJlY3QiLCJfcmVtb3ZlTmF0aXZlSW5wdXRFbGVtZW50cyIsIl9maXhFZGl0Qm94SW5wdXRFbGVtZW50cyIsInBob25lRWRpdEJveCIsImNvZGVFZGl0Qm94Iiwid29ybGRUb1NjcmVlbiIsInBob25lU2NyZWVuUG9zIiwicG9zaXRpb24iLCJ6SW5kZXgiLCJwb2ludGVyRXZlbnRzIiwiY3Vyc29yIiwiYmFja2dyb3VuZCIsImJvcmRlclJhZGl1cyIsImNvZGVTY3JlZW5Qb3MiLCJfc3RhcnRJbnB1dE9ic2VydmVyIiwib2JzZXJ2ZXIiLCJNdXRhdGlvbk9ic2VydmVyIiwibXV0YXRpb25zIiwiZm9yRWFjaCIsIm11dGF0aW9uIiwiYWRkZWROb2RlcyIsIm5vZGUiLCJub2RlTmFtZSIsImlucCIsIm9ic2VydmUiLCJjaGlsZExpc3QiLCJzdWJ0cmVlIiwid2FybiIsIkNsYXNzIiwiQ29tcG9uZW50IiwicHJvcGVydGllcyIsIndhaXRfbm9kZSIsIk5vZGUiLCJ1c2VyX2FncmVlbWVudF9wcmVmYWJzIiwiUHJlZmFiIiwicGhvbmVfbG9naW5fcHJlZmFiIiwib25Mb2FkIiwic2VsZiIsInZpZXciLCJlbmFibGVBdXRvRnVsbFNjcmVlbiIsInNjcmVlbiIsImRpc2FibGVBdXRvRnVsbFNjcmVlbiIsIl9pc0FncmVlbWVudENoZWNrZWQiLCJfcGhvbmVMb2dpblBvcHVwU2hvd2luZyIsIl9pbml0V2FpdE5vZGUiLCJfaW5pdENoZWNrYm94IiwiX2luaXRMb2dpbkJ1dHRvbnMiLCJfaW5pdFVzZXJBZ3JlZW1lbnRMaW5rIiwiX3ByZWxvYWRTY2VuZXMiLCJfY2hlY2tBdXRvTG9naW4iLCJ3aW5kb3ciLCJteWdsb2JhbCIsIl93YWl0Rm9yTXlnbG9iYWwiLCJfaW5pdEFuZFN0YXJ0Iiwid2FzRm9yY2VMb2dnZWRPdXQiLCJfc2hvd0Vycm9yIiwiZ2V0Rm9yY2VMb2dvdXRSZWFzb24iLCJoYXNMb2NhbFNlc3Npb24iLCJ2ZXJpZnlUb2tlbiIsInZhbGlkIiwibWVzc2FnZSIsInJlY29ubmVjdEluZm8iLCJzb2NrZXQiLCJsb2FkUmVjb25uZWN0SW5mbyIsInRva2VuIiwicGxheWVySWQiLCJyb29tQ29kZSIsInNjaGVkdWxlT25jZSIsImluaXRTb2NrZXQiLCJvblJvb21SZXN0b3JlZCIsImRhdGEiLCJkaXJlY3RvciIsImxvYWRTY2VuZSIsImV2dCIsImV2ZW50TGlzdGVyIiwib24iLCJfbG9hZGluZ0ltYWdlIiwiZ2V0Q2hpbGRCeU5hbWUiLCJsYmxOb2RlIiwiX3dhaXRMYWJlbCIsImdldENvbXBvbmVudCIsIkxhYmVsIiwiYWN0aXZlIiwiY2hlY2tNYXJrTm9kZSIsIl9jaGVja01hcmtOb2RlIiwiY2hlY2ttYXJrIiwiX2NoZWNrbWFya0ljb24iLCJidXR0b24iLCJCdXR0b24iLCJlbmFibGVkIiwib2ZmIiwiRXZlbnRUeXBlIiwiVE9VQ0hfRU5EIiwiZXZlbnQiLCJfdG9nZ2xlQ2hlY2tib3giLCJzdGFydCIsInBob25lTG9naW5Ob2RlIiwiaGFzVG91Y2hMaXN0ZW5lcnMiLCJzdG9wUHJvcGFnYXRpb24iLCJfZG9QaG9uZUxvZ2luIiwid3hMb2dpbk5vZGUiLCJfZG9XeExvZ2luIiwibmFtZSIsImNoaWxkcmVuIiwiaW50ZXJhY3RhYmxlIiwiY2xpY2tFdmVudHMiLCJoYW5kbGVyIiwiRXZlbnRIYW5kbGVyIiwidGFyZ2V0IiwiY29tcG9uZW50IiwiY3VzdG9tRXZlbnREYXRhIiwicHVzaCIsImxpbmtOb2RlIiwiX29uV3hMb2dpbkNsaWNrIiwiX29uUGhvbmVMb2dpbkNsaWNrIiwiX29uVXNlckFncmVlbWVudExpbmtDbGljayIsIl9zaG93VXNlckFncmVlbWVudFBvcHVwIiwiX2NoZWNrQWdyZWVtZW50IiwicHJlbG9hZFNjZW5lIiwiZXJyIiwiYXR0ZW1wdHMiLCJjaGVjayIsImluaXQiLCJfc2hvd0xvYWRpbmciLCJwbGF5ZXJEYXRhIiwicGxheWVyX2lkIiwibmlja05hbWUiLCJwbGF5ZXJfbmFtZSIsInNhdmVUb0xvY2FsIiwiZ29iYWxfY291bnQiLCJnb2xkIiwiX2luaXRCYWNrZ3JvdW5kTXVzaWMiLCJpc29wZW5fc291bmQiLCJfbXVzaWNQbGF5aW5nIiwiX3RvdWNoTGlzdGVuZXJBZGRlZCIsInJlc291cmNlcyIsImxvYWQiLCJBdWRpb0NsaXAiLCJjbGlwIiwiaXNWYWxpZCIsIl9zZXR1cEdsb2JhbFRvdWNoRm9yTXVzaWMiLCJfYmdNdXNpY0NsaXAiLCJhdWRpb0VuZ2luZSIsInBsYXlNdXNpYyIsIl9yZW1vdmVHbG9iYWxUb3VjaEZvck11c2ljIiwiX3BsYXlNdXNpY09uVG91Y2giLCJpc011c2ljUGxheWluZyIsIl9jb2Nvc1RvdWNoSGFuZGxlciIsIlRPVUNIX1NUQVJUIiwiX2Jyb3dzZXJUb3VjaEhhbmRsZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiX3Nob3dXYWl0Tm9kZSIsIl9oaWRlV2FpdE5vZGUiLCJzaG93Iiwic3RyaW5nIiwiX2lzQW5pbWF0aW5nIiwiX2RyYXdJbnB1dEJnIiwiZ3JhcGhpY3MiLCJyYWRpdXMiLCJyb3VuZFJlY3QiLCJ1cGRhdGUiLCJkdCIsImFuZ2xlIiwicmVxdWVzdF93eExvZ2luIiwidW5pcXVlSUQiLCJhY2NvdW50SUQiLCJhdmF0YXJVcmwiLCJyZXN1bHQiLCJnb2xkY291bnQiLCJfc2hvd1Bob25lTG9naW5Qb3B1cCIsIl9jcmVhdGVQaG9uZUxvZ2luUG9wdXAiLCJwcmVmYWIiLCJwb3B1cCIsIl9jcmVhdGVQaG9uZUxvZ2luRHluYW1pYyIsIl9waG9uZUxvZ2luUG9wdXAiLCJ3aW5XIiwid2luSCIsImltZ1dpZHRoIiwiaW1nSGVpZ2h0Iiwic2NhbGUiLCJwYXJlbnQiLCJzZXRDb250ZW50U2l6ZSIsInNpemUiLCJzZXRQb3NpdGlvbiIsImFkZENvbXBvbmVudCIsIkJsb2NrSW5wdXRFdmVudHMiLCJtYXNrIiwibWFza1Nwcml0ZSIsIlNwcml0ZSIsInNpemVNb2RlIiwiU2l6ZU1vZGUiLCJDVVNUT00iLCJDb2xvciIsInR3ZWVuIiwidG8iLCJlYXNpbmciLCJjYWxsIiwiZGVzdHJveSIsImJnIiwiYmdTcHJpdGUiLCJzcmNCbGVuZEZhY3RvciIsIm1hY3JvIiwiQmxlbmRGYWN0b3IiLCJTUkNfQUxQSEEiLCJkc3RCbGVuZEZhY3RvciIsIk9ORV9NSU5VU19TUkNfQUxQSEEiLCJTcHJpdGVGcmFtZSIsInNwcml0ZUZyYW1lIiwicmVtb3ZlQ29tcG9uZW50IiwiYmdHZngiLCJHcmFwaGljcyIsImZpbGxDb2xvciIsImZpbGwiLCJ0aXRsZU5vZGUiLCJ0aXRsZUxhYmVsIiwiaG9yaXpvbnRhbEFsaWduIiwiSG9yaXpvbnRhbEFsaWduIiwiQ0VOVEVSIiwidGl0bGVPdXRsaW5lIiwiTGFiZWxPdXRsaW5lIiwiY2xvc2VCdG4iLCJjbG9zZUdmeCIsImNpcmNsZSIsInN0cm9rZUNvbG9yIiwibGluZVdpZHRoIiwic3Ryb2tlIiwiY2xvc2VYIiwiY2xvc2VYTGFiZWwiLCJzY2FsZVJhdGlvIiwiaWNvblNpemUiLCJmb3JtWTEiLCJmb3JtWTIiLCJnZXRDb2RlQnRuV2lkdGgiLCJidG5IZWlnaHQiLCJwaG9uZVJvd1dpZHRoIiwicGhvbmVSb3dYIiwicGhvbmVJY29uTm9kZSIsImljb25TcHJpdGUiLCJjb2RlUm93V2lkdGgiLCJjb2RlSWNvbk5vZGUiLCJnZXRDb2RlQnRuIiwiZ2V0Q29kZUJ0bkNvbXAiLCJ0cmFuc2l0aW9uIiwiVHJhbnNpdGlvbiIsIlNDQUxFIiwiem9vbVNjYWxlIiwiYnRuR2Z4IiwiYnRuTGFiZWwiLCJsYWJlbENvbXAiLCJidG5TcHJpdGUiLCJjb3VudGRvd24iLCJjb3VudGRvd25MYWJlbCIsInN0YXJ0Q291bnRkb3duIiwidGljayIsImxvZ2luQnRuWSIsImxvZ2luQnRuSGVpZ2h0IiwibG9naW5CdG5XaWR0aCIsImxvZ2luQnRuIiwibG9naW5HZngiLCJsb2dpblNwcml0ZSIsImxvZ2luQnRuQ29tcCIsInd4QnRuWSIsInd4QnRuU2l6ZSIsInd4QnRuIiwid3hCZ0dmeCIsInd4U3ByaXRlIiwid3hCdG5Db21wIiwibWVzc2FnZUxhYmVsIiwibWVzc2FnZUxhYmVsQ29tcCIsIkVkaXRCb3giLCJwbGFjZWhvbGRlckZvbnRTaXplIiwicGxhY2Vob2xkZXJGb250Q29sb3IiLCJpbnB1dEZsYWciLCJJbnB1dEZsYWciLCJTRU5TSVRJVkUiLCJpbnB1dE1vZGUiLCJJbnB1dE1vZGUiLCJOVU1FUklDIiwicGhvbmUiLCJjb2RlIiwiZ2V0SW5wdXRWYWx1ZSIsImlucHV0SWQiLCJ2YWx1ZSIsInZhbGlkYXRlUGhvbmUiLCJ0ZXN0Iiwic2hvd01lc3NhZ2UiLCJtc2ciLCJpc0Vycm9yIiwiZGVmaW5lcyIsImFwaVVybCIsIkh0dHBBUEkiLCJjcnlwdG9LZXkiLCJwb3N0RW5jcnlwdGVkIiwicmVzcCIsInhociIsIlhNTEh0dHBSZXF1ZXN0Iiwib3BlbiIsInNldFJlcXVlc3RIZWFkZXIiLCJ0aW1lb3V0Iiwib25yZWFkeXN0YXRlY2hhbmdlIiwicmVhZHlTdGF0ZSIsInN0YXR1cyIsIkpTT04iLCJwYXJzZSIsInJlc3BvbnNlVGV4dCIsInNlbmQiLCJzdHJpbmdpZnkiLCJsb2dpbkRhdGEiLCJzdWJzdHIiLCJnb2xkQ291bnQiLCJEYXRlIiwibm93IiwibG9naW5UeXBlIiwib25Mb2dpblN1Y2Nlc3MiLCJhY2NvdW50X2lkIiwibmlja25hbWUiLCJhdmF0YXIiLCJ1c2VyTmFtZSIsInVzZXJuYW1lIiwiX2NyZWF0ZUFncmVlbWVudFBvcHVwIiwiYmdNYXNrIiwiYmdNYXNrU3ByaXRlIiwicGFuZWxTcHJpdGUiLCJjbG9zZUJ0bkJnIiwiY2xvc2VCZ1Nwcml0ZSIsImNsb3NlTGFiZWxOb2RlIiwiY2xvc2VMYWJlbCIsImNsb3NlQnRuQ29tcCIsImNsb3NlSGFuZGxlciIsImRpdmlkZXJMaW5lIiwiZGl2aWRlclNwcml0ZSIsInNjcm9sbE5vZGUiLCJzY3JvbGxWaWV3IiwiU2Nyb2xsVmlldyIsImhvcml6b250YWwiLCJ2ZXJ0aWNhbCIsImluZXJ0aWEiLCJlbGFzdGljIiwidmlld05vZGUiLCJNYXNrIiwiVHlwZSIsIlJFQ1QiLCJjb250ZW50Tm9kZSIsImFuY2hvclgiLCJhbmNob3JZIiwiY29udGVudCIsInJpY2hUZXh0Tm9kZSIsInJpY2hUZXh0IiwiUmljaFRleHQiLCJtYXhXaWR0aCIsImFncmVlbWVudFRleHQiLCJzY3JvbGxUb1RvcCIsIl91c2VyQWdyZWVtZW50UG9wdXAiLCJfY2xvc2VVc2VyQWdyZWVtZW50UG9wdXAiLCJvbkRlc3Ryb3kiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTs7QUFFQTtBQUNBLElBQUlBLHNCQUFzQixHQUFHLEtBQUs7O0FBRWxDO0FBQ0EsSUFBSUMsZ0JBQWdCLEdBQUcsU0FBbkJBLGdCQUFnQkEsQ0FBWUMsT0FBTyxFQUFFQyxTQUFTLEVBQUVDLE9BQU8sRUFBRTtFQUN6RCxJQUFJLENB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O0lBRXhDSCxRQUFRLENBQUNqTSxNQUFNLEdBQUdvTSxhQUFhOztJQUUvQjtJQUNBbEIsVUFBVSxDQUFDbUIsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUV6QixJQUFJLENBQUNDLG1CQUFtQixHQUFHcEwsS0FBSztFQUNwQyxDQUFDO0VBRURxTCx3QkFBd0IsRUFBRSxTQUFBQSx5QkFBQSxFQUFXO0lBQ2pDLElBQUksSUFBSSxDQUFDRCxtQkFBbUIsRUFBRTtNQUMxQixJQUFJLENBQUNBLG1CQUFtQixDQUFDM0osT0FBTyxFQUFFO01BQ2xDLElBQUksQ0FBQzJKLG1CQUFtQixHQUFHLElBQUk7SUFDbkM7RUFDSixDQUFDO0VBRUQ7RUFDQUUsU0FBUyxXQUFBQSxVQUFBLEVBQUk7SUFDVCxJQUFJLENBQUNsTiwwQkFBMEIsRUFBRTtFQUNyQztBQUNKLENBQUMsQ0FBQyIsInNvdXJjZVJvb3QiOiIvIiwic291cmNlc0NvbnRlbnQiOlsiLy8g55m75b2V5Zy65pmv5o6n5Yi25ZmoXG4vLyDkvb/nlKjngrnlh7vkuovku7blrp7njrDlpI3pgInmoYblip/og73vvIjkuI3kvp3otZYgVG9nZ2xlIOe7hOS7tu+8iVxuXG4vLyDlhajlsYDmoLflvI/kv67lpI3lh73mlbAgLSDmm7TlvLrlpKfnmoTniYjmnKxcbnZhciBfZ2xvYmFsU3R5bGVGaXhBcHBsaWVkID0gZmFsc2U7XG5cbi8vIOi+heWKqeWHveaVsO+8muS/ruWkjVdlYuW5s+WPsEVkaXRCb3jnmoRDU1PmoLflvI/vvIjlop7lvLrniYjvvIlcbnZhciBfZml4RWRpdEJveFN0eWxlID0gZnVuY3Rpb24oZWRpdEJveCwgZm9udENvbG9yLCBiZ0NvbG9yKSB7XG4gICAgaWYgKCFjYy5zeXMuaXNCcm93c2VyKSByZXR1cm47XG5cbiAgICBmb250Q29sb3IgPSBmb250Q29sb3IgfHwgJyMwMDAwMDAnO1xuICAgIGJnQ29sb3IgPSBiZ0NvbG9yIHx8ICcjZmZmZmZmJztcblxuXG4gICAgLy8g56uL5Y2z5bCd6K+V5L+u5aSNXG4gICAgX2FwcGx5SW5wdXRTdHlsZXMoZm9udENvbG9yLCBiZ0NvbG9yKTtcblxuICAgIC8vIOW7tui/n+S/ruWkje+8iOetieW+hUhUTUwgaW5wdXTlhYPntKDliJvlu7rvvIlcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBfYXBwbHlJbnB1dFN0eWxlcyhmb250Q29sb3IsIGJnQ29sb3IpOyB9LCA1MCk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgX2FwcGx5SW5wdXRTdHlsZXMoZm9udENvbG9yLCBiZ0NvbG9yKTsgfSwgMTAwKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBfYXBwbHlJbnB1dFN0eWxlcyhmb250Q29sb3IsIGJnQ29sb3IpOyB9LCAyMDApO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IF9hcHBseUlucHV0U3R5bGVzKGZvbnRDb2xvciwgYmdDb2xvcik7IH0sIDUwMCk7XG5cbiAgICAvLyDms6jlhaXlhajlsYBDU1PmoLflvI/vvIjmnIDpq5jkvJjlhYjnuqfvvIlcbiAgICBpZiAoIV9nbG9iYWxTdHlsZUZpeEFwcGxpZWQpIHtcbiAgICAgICAgX2dsb2JhbFN0eWxlRml4QXBwbGllZCA9IHRydWU7XG4gICAgICAgIF9pbmplY3RHbG9iYWxTdHlsZXMoZm9udENvbG9yLCBiZ0NvbG9yKTtcbiAgICB9XG59O1xuXG4vLyDlupTnlKjmoLflvI/liLDmiYDmnIlpbnB1dOWFg+e0oFxudmFyIF9hcHBseUlucHV0U3R5bGVzID0gZnVuY3Rpb24oZm9udENvbG9yLCBiZ0NvbG9yKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIGlucHV0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0Jyk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBpbnB1dCA9IGlucHV0c1tpXTtcbiAgICAgICAgICAgIF9zdHlsZVNpbmdsZUlucHV0KGlucHV0LCBmb250Q29sb3IsIGJnQ29sb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Lmf5aSE55CGIHRleHRhcmVh77yI5Y+v6IO96KKr55So5LqOIEVkaXRCb3jvvIlcbiAgICAgICAgdmFyIHRleHRhcmVhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RleHRhcmVhJyk7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGV4dGFyZWFzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBfc3R5bGVTaW5nbGVJbnB1dCh0ZXh0YXJlYXNbal0sIGZvbnRDb2xvciwgYmdDb2xvcik7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+S/ruWkjUVkaXRCb3jmoLflvI/lpLHotKU6JywgZSk7XG4gICAgfVxufTtcblxuLy8g5qC35byP5YyW5Y2V5LiqaW5wdXTlhYPntKAgLSDkv67lpI3niYjvvJrmloflrZflnoLnm7TlsYXkuK0gKyDpgI/mmI7og4zmma/kuI3pga7mjKHovrnmoYZcbi8vIOazqOaEj++8mui3s+i/h+WOn+eUn+i+k+WFpeahhu+8iG5hdGl2ZS1waG9uZS1pbnB1dCwgbmF0aXZlLWNvZGUtaW5wdXTvvInvvIzlm6DkuLrlroPku6zmnInnsr7noa7nmoTkvY3nva7orr7nva5cbnZhciBfc3R5bGVTaW5nbGVJbnB1dCA9IGZ1bmN0aW9uKGlucHV0LCBmb250Q29sb3IsIGJnQ29sb3IpIHtcbiAgICAvLyDimIUg6Lez6L+H5Y6f55Sf6L6T5YWl5qGG77yM5a6D5Lus5bey57uP5pyJ5q2j56Gu55qE5qC35byPXG4gICAgaWYgKGlucHV0LmlkID09PSAnbmF0aXZlLXBob25lLWlucHV0JyB8fCBpbnB1dC5pZCA9PT0gJ25hdGl2ZS1jb2RlLWlucHV0Jykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09IOaguOW/g+agt+W8j+iuvue9riA9PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8vIDEuIOaWh+Wtl+minOiJslxuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdjb2xvcicsIGZvbnRDb2xvciwgJ2ltcG9ydGFudCcpO1xuICAgIGlucHV0LnN0eWxlLmNvbG9yID0gZm9udENvbG9yO1xuICAgIFxuICAgIC8vIDIuIOWFs+mUru+8muiuvue9rumAj+aYjuiDjOaZr++8jOiuqSBDb2NvcyDnu5jliLbnmoTovrnmoYblj6/op4FcbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnYmFja2dyb3VuZC1jb2xvcicsICd0cmFuc3BhcmVudCcsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgIFxuICAgIC8vIDMuIOaWh+Wtl+WeguebtOWxheS4rSAtIOS9v+eUqCBGbGV4Ym94IOaWueahiO+8iOacgOWPr+mdoO+8iVxuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdkaXNwbGF5JywgJ2ZsZXgnLCAnaW1wb3J0YW50Jyk7XG4gICAgaW5wdXQuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnYWxpZ24taXRlbXMnLCAnY2VudGVyJywgJ2ltcG9ydGFudCcpO1xuICAgIGlucHV0LnN0eWxlLmFsaWduSXRlbXMgPSAnY2VudGVyJztcbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnanVzdGlmeS1jb250ZW50JywgJ2ZsZXgtc3RhcnQnLCAnaW1wb3J0YW50Jyk7XG4gICAgaW5wdXQuc3R5bGUuanVzdGlmeUNvbnRlbnQgPSAnZmxleC1zdGFydCc7XG4gICAgXG4gICAgLy8gNC4g55uS5qih5Z6L6K6+572uXG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJ2JveC1zaXppbmcnLCAnYm9yZGVyLWJveCcsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS5ib3hTaXppbmcgPSAnYm9yZGVyLWJveCc7XG4gICAgXG4gICAgLy8gNS4g5YaF6L656LedIC0g57uZ5paH5a2X55WZ5Ye656m66Ze077yM6YG/5YWN6LS06L65XG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJ3BhZGRpbmcnLCAnMCAxMnB4JywgJ2ltcG9ydGFudCcpO1xuICAgIGlucHV0LnN0eWxlLnBhZGRpbmcgPSAnMCAxMnB4JztcbiAgICBcbiAgICAvLyA2LiDooYzpq5jorr7nva4gLSDkuI7lrZfkvZPlpKflsI/ljLnphY3vvIznoa7kv53lnoLnm7TlsYXkuK1cbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnbGluZS1oZWlnaHQnLCAnMScsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS5saW5lSGVpZ2h0ID0gJzEnO1xuICAgIFxuICAgIC8vIDcuIOmrmOW6puiHqumAguW6lOWGheWuuVxuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdoZWlnaHQnLCAnMTAwJScsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5a2X5L2T6K6+572uID09PT09PT09PT09PT09PT09PT09XG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJ2ZvbnQtc2l6ZScsICcyMHB4JywgJ2ltcG9ydGFudCcpO1xuICAgIGlucHV0LnN0eWxlLmZvbnRTaXplID0gJzIwcHgnO1xuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdmb250LWZhbWlseScsICdBcmlhbCwgXCJNaWNyb3NvZnQgWWFIZWlcIiwgc2Fucy1zZXJpZicsICdpbXBvcnRhbnQnKTtcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PSBXZWJLaXQg54m55q6K5L+u5aSNID09PT09PT09PT09PT09PT09PT09XG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJy13ZWJraXQtdGV4dC1maWxsLWNvbG9yJywgZm9udENvbG9yLCAnaW1wb3J0YW50Jyk7XG4gICAgaW5wdXQuc3R5bGUud2Via2l0VGV4dEZpbGxDb2xvciA9IGZvbnRDb2xvcjtcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDlj6/op4HmgKfnoa7kv50gPT09PT09PT09PT09PT09PT09PT1cbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnb3BhY2l0eScsICcxJywgJ2ltcG9ydGFudCcpO1xuICAgIGlucHV0LnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09IOWFieagh+minOiJsiA9PT09PT09PT09PT09PT09PT09PVxuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdjYXJldC1jb2xvcicsIGZvbnRDb2xvciwgJ2ltcG9ydGFudCcpO1xuICAgIGlucHV0LnN0eWxlLmNhcmV0Q29sb3IgPSBmb250Q29sb3I7XG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT0g56e76Zmk5bmy5omw5qC35byPID09PT09PT09PT09PT09PT09PT09XG4gICAgaW5wdXQuc3R5bGUudGV4dFNoYWRvdyA9ICdub25lJztcbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgndGV4dC1zaGFkb3cnLCAnbm9uZScsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS5vdXRsaW5lID0gJ25vbmUnO1xuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdvdXRsaW5lJywgJ25vbmUnLCAnaW1wb3J0YW50Jyk7XG4gICAgaW5wdXQuc3R5bGUuYm9yZGVyID0gJ25vbmUnO1xuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdib3JkZXInLCAnbm9uZScsICdpbXBvcnRhbnQnKTtcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDnp7vpmaTlrprkvY3lubLmibAgPT09PT09PT09PT09PT09PT09PT1cbiAgICBpbnB1dC5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgndG9wJyk7XG4gICAgaW5wdXQuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ21hcmdpbi10b3AnKTtcbiAgICBpbnB1dC5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgnbWFyZ2luJyk7XG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT0g6IGa54Sm5pe25L+d5oyB5qC35byPID09PT09PT09PT09PT09PT09PT09XG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJ291dGxpbmUtb2Zmc2V0JywgJzAnLCAnaW1wb3J0YW50Jyk7XG59O1xuXG4vLyDms6jlhaXlhajlsYBDU1PmoLflvI8gLSDkv67lpI3niYjvvIjmjpLpmaTljp/nlJ/ovpPlhaXmoYbvvIlcbnZhciBfaW5qZWN0R2xvYmFsU3R5bGVzID0gZnVuY3Rpb24oZm9udENvbG9yLCBiZ0NvbG9yKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHN0eWxlSWQgPSAnY29jb3MtZWRpdGJveC1maXgtc3R5bGUnO1xuICAgICAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoc3R5bGVJZCkpIHJldHVybjtcblxuICAgICAgICB2YXIgY3NzID0gYFxuICAgICAgICAgICAgLyog6L6T5YWl5qGG5Z+656GA5qC35byPIC0g6YCP5piO6IOM5pmvICsg5paH5a2X5bGF5LitICovXG4gICAgICAgICAgICAvKiDms6jmhI/vvJrmjpLpmaTljp/nlJ/ovpPlhaXmoYYgI25hdGl2ZS1waG9uZS1pbnB1dCwgI25hdGl2ZS1jb2RlLWlucHV0ICovXG4gICAgICAgICAgICBpbnB1dDpub3QoI25hdGl2ZS1waG9uZS1pbnB1dCk6bm90KCNuYXRpdmUtY29kZS1pbnB1dCksIFxuICAgICAgICAgICAgdGV4dGFyZWE6bm90KCNuYXRpdmUtcGhvbmUtaW5wdXQpOm5vdCgjbmF0aXZlLWNvZGUtaW5wdXQpIHtcbiAgICAgICAgICAgICAgICBjb2xvcjogJHtmb250Q29sb3J9ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAxICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogdmlzaWJsZSAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMjBweCAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIC13ZWJraXQtdGV4dC1maWxsLWNvbG9yOiAke2ZvbnRDb2xvcn0gIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBjYXJldC1jb2xvcjogJHtmb250Q29sb3J9ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgbGluZS1oZWlnaHQ6IDEgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBib3JkZXI6IG5vbmUgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBvdXRsaW5lOiBub25lICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8qIFBsYWNlaG9sZGVyIOagt+W8jyAqL1xuICAgICAgICAgICAgaW5wdXQ6OnBsYWNlaG9sZGVyLCB0ZXh0YXJlYTo6cGxhY2Vob2xkZXIge1xuICAgICAgICAgICAgICAgIGNvbG9yOiAjODg4ODg4ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMSAhaW1wb3J0YW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvKiDogZrnhKbnirbmgIEgKi9cbiAgICAgICAgICAgIGlucHV0OmZvY3VzOm5vdCgjbmF0aXZlLXBob25lLWlucHV0KTpub3QoI25hdGl2ZS1jb2RlLWlucHV0KSwgXG4gICAgICAgICAgICB0ZXh0YXJlYTpmb2N1czpub3QoI25hdGl2ZS1waG9uZS1pbnB1dCk6bm90KCNuYXRpdmUtY29kZS1pbnB1dCkge1xuICAgICAgICAgICAgICAgIGNvbG9yOiAke2ZvbnRDb2xvcn0gIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBvdXRsaW5lOiBub25lICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQgIWltcG9ydGFudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLyog5paH5pys57G75Z6L6L6T5YWl5qGGIC0gRmxleGJveCDlnoLnm7TlsYXkuK3vvIjmjpLpmaTljp/nlJ/ovpPlhaXmoYbvvIkqL1xuICAgICAgICAgICAgaW5wdXRbdHlwZT1cInRleHRcIl06bm90KCNuYXRpdmUtcGhvbmUtaW5wdXQpOm5vdCgjbmF0aXZlLWNvZGUtaW5wdXQpLCBcbiAgICAgICAgICAgIGlucHV0W3R5cGU9XCJudW1iZXJcIl06bm90KCNuYXRpdmUtcGhvbmUtaW5wdXQpOm5vdCgjbmF0aXZlLWNvZGUtaW5wdXQpLCBcbiAgICAgICAgICAgIGlucHV0W3R5cGU9XCJ0ZWxcIl06bm90KCNuYXRpdmUtcGhvbmUtaW5wdXQpOm5vdCgjbmF0aXZlLWNvZGUtaW5wdXQpLFxuICAgICAgICAgICAgaW5wdXRbdHlwZT1cInBhc3N3b3JkXCJdOm5vdCgjbmF0aXZlLXBob25lLWlucHV0KTpub3QoI25hdGl2ZS1jb2RlLWlucHV0KSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheTogZmxleCAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXIgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgcGFkZGluZzogMCAxMnB4ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAxMDAlICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgbGluZS1oZWlnaHQ6IDEgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBib3JkZXI6IG5vbmUgIWltcG9ydGFudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLyog56e76Zmk5rWP6KeI5Zmo6buY6K6k5qC35byPICovXG4gICAgICAgICAgICBpbnB1dDpmb2N1cyxcbiAgICAgICAgICAgIHRleHRhcmVhOmZvY3VzIHtcbiAgICAgICAgICAgICAgICBib3gtc2hhZG93OiBub25lICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIGA7XG5cbiAgICAgICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgc3R5bGUuaWQgPSBzdHlsZUlkO1xuICAgICAgICBzdHlsZS50eXBlID0gJ3RleHQvY3NzJztcbiAgICAgICAgc3R5bGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzKSk7XG4gICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfms6jlhaXlhajlsYDmoLflvI/lpLHotKU6JywgZSk7XG4gICAgfVxufTtcblxuLy8g5Yib5bu65Y6f55SfIEhUTUwgaW5wdXQg5YWD57Sg77yI57uV6L+HIENvY29zIEVkaXRCb3gg55qE6Zeu6aKY77yJXG4vLyDmlLnov5vniYggdjTvvJrkvb/nlKjoioLngrnkuJbnlYzlnZDmoIfnsr7noa7lrprkvY1cbnZhciBfY3JlYXRlTmF0aXZlSW5wdXRFbGVtZW50cyA9IGZ1bmN0aW9uKHBhbmVsLCBwaG9uZUlucHV0Tm9kZSwgY29kZUlucHV0Tm9kZSwgaW5wdXRXaWR0aCwgaW5wdXRIZWlnaHQsIGNvZGVJbnB1dFcsIHBhbmVsV2lkdGgsIHBhbmVsSGVpZ2h0KSB7XG4gICAgaWYgKCFjYy5zeXMuaXNCcm93c2VyKSByZXR1cm47XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgICAgLy8g6I635Y+WIENhbnZhcyDlhYPntKBcbiAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdHYW1lQ2FudmFzJykgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignY2FudmFzJyk7XG4gICAgICAgIGlmICghY2FudmFzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfmib7kuI3liLAgQ2FudmFzIOWFg+e0oCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgY2FudmFzUmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgdmFyIHdpblNpemUgPSBjYy53aW5TaXplO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coJz09PSDliJvlu7rljp/nlJ/ovpPlhaXmoYbvvIh2NCAtIOS9v+eUqOiKgueCueS4lueVjOWdkOagh++8iT09PScpO1xuICAgICAgICBjb25zb2xlLmxvZygnQ2FudmFzIOS9jee9rjonLCBjYW52YXNSZWN0LmxlZnQsIGNhbnZhc1JlY3QudG9wKTtcbiAgICAgICAgY29uc29sZS5sb2coJ0NhbnZhcyDlsLrlr7g6JywgY2FudmFzUmVjdC53aWR0aCwgJ3gnLCBjYW52YXNSZWN0LmhlaWdodCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCfmuLjmiI/liIbovqjnjoc6Jywgd2luU2l6ZS53aWR0aCwgJ3gnLCB3aW5TaXplLmhlaWdodCk7XG4gICAgICAgIFxuICAgICAgICAvLyDorqHnrpfnvKnmlL7mr5TkvovvvIhDYW52YXMg5a6e6ZmF5bC65a+4IC8g5ri45oiP6K6+6K6h5YiG6L6o546H77yJXG4gICAgICAgIHZhciBzY2FsZVggPSBjYW52YXNSZWN0LndpZHRoIC8gd2luU2l6ZS53aWR0aDtcbiAgICAgICAgdmFyIHNjYWxlWSA9IGNhbnZhc1JlY3QuaGVpZ2h0IC8gd2luU2l6ZS5oZWlnaHQ7XG4gICAgICAgIGNvbnNvbGUubG9nKCfnvKnmlL7mr5Tkvos6Jywgc2NhbGVYLnRvRml4ZWQoMyksIHNjYWxlWS50b0ZpeGVkKDMpKTtcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOWFs+mUruaUuei/m++8muS9v+eUqOiKgueCueS4lueVjOWdkOaghyA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyDnm7TmjqXkvb/nlKggQ29jb3Mg6IqC54K555qE5LiW55WM5Z2Q5qCH77yM6ICM5LiN5piv5omL5Yqo6K6h566X5YGP56e7XG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5bovpPlhaXmoYboioLngrnnmoTkuJbnlYzlnZDmoIdcbiAgICAgICAgdmFyIHBob25lV29ybGRQb3MgPSBwaG9uZUlucHV0Tm9kZS5jb252ZXJ0VG9Xb3JsZFNwYWNlQVIoY2MudjIoMCwgMCkpO1xuICAgICAgICB2YXIgY29kZVdvcmxkUG9zID0gY29kZUlucHV0Tm9kZS5jb252ZXJ0VG9Xb3JsZFNwYWNlQVIoY2MudjIoMCwgMCkpO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coJ+aJi+acuui+k+WFpeahhuS4lueVjOWdkOaghzonLCBwaG9uZVdvcmxkUG9zLngudG9GaXhlZCgxKSwgcGhvbmVXb3JsZFBvcy55LnRvRml4ZWQoMSkpO1xuICAgICAgICBjb25zb2xlLmxvZygn6aqM6K+B56CB6L6T5YWl5qGG5LiW55WM5Z2Q5qCHOicsIGNvZGVXb3JsZFBvcy54LnRvRml4ZWQoMSksIGNvZGVXb3JsZFBvcy55LnRvRml4ZWQoMSkpO1xuICAgICAgICBcbiAgICAgICAgLy8g4piF4piF4piFIOS9jee9ruW+ruiwg+WPguaVsO+8iOWmguaenOmcgOimgeW+ruiwg++8jOS/ruaUuei/memHjO+8ieKYheKYheKYhVxuICAgICAgICB2YXIgcGhvbmVPZmZzZXRYID0gMDsgICAgLy8g5omL5py66L6T5YWl5qGGIFgg5YGP56e7XG4gICAgICAgIHZhciBwaG9uZU9mZnNldFkgPSAwOyAgICAvLyDmiYvmnLrovpPlhaXmoYYgWSDlgY/np7tcbiAgICAgICAgdmFyIGNvZGVPZmZzZXRYID0gMDsgICAgIC8vIOmqjOivgeeggei+k+WFpeahhiBYIOWBj+enu1xuICAgICAgICB2YXIgY29kZU9mZnNldFkgPSAwOyAgICAgLy8g6aqM6K+B56CB6L6T5YWl5qGGIFkg5YGP56e7XG4gICAgICAgIFxuICAgICAgICAvLyDimIXimIXimIUg5bC65a+45Y+C5pWwIOKYheKYheKYhVxuICAgICAgICB2YXIgYWN0dWFsSW5wdXRXaWR0aCA9IGlucHV0V2lkdGg7ICAgICAgLy8g5L2/55So5Lyg5YWl55qE6L6T5YWl5qGG5a695bqmXG4gICAgICAgIHZhciBhY3R1YWxJbnB1dEhlaWdodCA9IGlucHV0SGVpZ2h0OyAgICAvLyDkvb/nlKjkvKDlhaXnmoTovpPlhaXmoYbpq5jluqZcbiAgICAgICAgdmFyIGFjdHVhbENvZGVJbnB1dFdpZHRoID0gY29kZUlucHV0VzsgIC8vIOS9v+eUqOS8oOWFpeeahOmqjOivgeeggei+k+WFpeahhuWuveW6plxuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coJz09PSDovpPlhaXmoYblsLrlr7ggPT09Jyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCfmiYvmnLrovpPlhaXmoYY6JywgYWN0dWFsSW5wdXRXaWR0aCwgJ3gnLCBhY3R1YWxJbnB1dEhlaWdodCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCfpqozor4HnoIHovpPlhaXmoYY6JywgYWN0dWFsQ29kZUlucHV0V2lkdGgsICd4JywgYWN0dWFsSW5wdXRIZWlnaHQpO1xuICAgICAgICBcbiAgICAgICAgLy8g6K6h566X5bGP5bmV5L2N572u77yI5LiW55WM5Z2Q5qCHIC0+IOWxj+W5leWdkOagh++8iVxuICAgICAgICAvLyBDb2NvcyDlnZDmoIfns7vvvJrljp/ngrnlt6bkuIvop5LvvIxZIOWQkeS4ilxuICAgICAgICAvLyBIVE1MIOWdkOagh+ezu++8muWOn+eCueW3puS4iuinku+8jFkg5ZCR5LiLXG4gICAgICAgIHZhciBjYWxjU2NyZWVuUG9zRnJvbVdvcmxkID0gZnVuY3Rpb24od29ybGRQb3MsIG5vZGVXaWR0aCwgbm9kZUhlaWdodCwgb2Zmc2V0WCwgb2Zmc2V0WSkge1xuICAgICAgICAgICAgLy8g5LiW55WM5Z2Q5qCH6L2s5o2i5Li65bGP5bmV5Z2Q5qCHXG4gICAgICAgICAgICB2YXIgc2NyZWVuWCA9IHdvcmxkUG9zLnggKyBvZmZzZXRYO1xuICAgICAgICAgICAgdmFyIHNjcmVlblkgPSB3b3JsZFBvcy55ICsgb2Zmc2V0WTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6L2s5o2i5Li6IENhbnZhcyDlnZDmoIdcbiAgICAgICAgICAgIHZhciBjYW52YXNYID0gc2NyZWVuWCAqIHNjYWxlWDtcbiAgICAgICAgICAgIHZhciBjYW52YXNZID0gY2FudmFzUmVjdC5oZWlnaHQgLSBzY3JlZW5ZICogc2NhbGVZOyAgLy8gWSDovbTnv7vovaxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6K6h566X5a6e6ZmF5bC65a+4XG4gICAgICAgICAgICB2YXIgYWN0dWFsV2lkdGggPSBub2RlV2lkdGggKiBzY2FsZVg7XG4gICAgICAgICAgICB2YXIgYWN0dWFsSGVpZ2h0ID0gbm9kZUhlaWdodCAqIHNjYWxlWTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBsZWZ0OiBjYW52YXNSZWN0LmxlZnQgKyBjYW52YXNYIC0gYWN0dWFsV2lkdGggLyAyLFxuICAgICAgICAgICAgICAgIHRvcDogY2FudmFzUmVjdC50b3AgKyBjYW52YXNZIC0gYWN0dWFsSGVpZ2h0IC8gMixcbiAgICAgICAgICAgICAgICB3aWR0aDogYWN0dWFsV2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBhY3R1YWxIZWlnaHRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICB2YXIgcGhvbmVTY3JlZW4gPSBjYWxjU2NyZWVuUG9zRnJvbVdvcmxkKHBob25lV29ybGRQb3MsIGFjdHVhbElucHV0V2lkdGgsIGFjdHVhbElucHV0SGVpZ2h0LCBwaG9uZU9mZnNldFgsIHBob25lT2Zmc2V0WSk7XG4gICAgICAgIHZhciBjb2RlU2NyZWVuID0gY2FsY1NjcmVlblBvc0Zyb21Xb3JsZChjb2RlV29ybGRQb3MsIGFjdHVhbENvZGVJbnB1dFdpZHRoLCBhY3R1YWxJbnB1dEhlaWdodCwgY29kZU9mZnNldFgsIGNvZGVPZmZzZXRZKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKCfmiYvmnLrovpPlhaXmoYblsY/luZXkvY3nva46JywgcGhvbmVTY3JlZW4pO1xuICAgICAgICBjb25zb2xlLmxvZygn6aqM6K+B56CB6L6T5YWl5qGG5bGP5bmV5L2N572uOicsIGNvZGVTY3JlZW4pO1xuICAgICAgICBcbiAgICAgICAgLy8g6L6555WM5qOA5p+l77ya56Gu5L+d6L6T5YWl5qGG5Zyo5bGP5bmV5Y+v6KeB5Yy65Z+f5YaFXG4gICAgICAgIHBob25lU2NyZWVuLmxlZnQgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihjYW52YXNSZWN0LndpZHRoIC0gcGhvbmVTY3JlZW4ud2lkdGgsIHBob25lU2NyZWVuLmxlZnQpKTtcbiAgICAgICAgcGhvbmVTY3JlZW4udG9wID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oY2FudmFzUmVjdC5oZWlnaHQgLSBwaG9uZVNjcmVlbi5oZWlnaHQsIHBob25lU2NyZWVuLnRvcCkpO1xuICAgICAgICBjb2RlU2NyZWVuLmxlZnQgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihjYW52YXNSZWN0LndpZHRoIC0gY29kZVNjcmVlbi53aWR0aCwgY29kZVNjcmVlbi5sZWZ0KSk7XG4gICAgICAgIGNvZGVTY3JlZW4udG9wID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oY2FudmFzUmVjdC5oZWlnaHQgLSBjb2RlU2NyZWVuLmhlaWdodCwgY29kZVNjcmVlbi50b3ApKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKCfovrnnlYzmo4Dmn6XlkI7kvY3nva46Jyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCcgIOaJi+acuui+k+WFpeahhjonLCBwaG9uZVNjcmVlbi5sZWZ0LnRvRml4ZWQoMSksIHBob25lU2NyZWVuLnRvcC50b0ZpeGVkKDEpKTtcbiAgICAgICAgY29uc29sZS5sb2coJyAg6aqM6K+B56CB6L6T5YWl5qGGOicsIGNvZGVTY3JlZW4ubGVmdC50b0ZpeGVkKDEpLCBjb2RlU2NyZWVuLnRvcC50b0ZpeGVkKDEpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOenu+mZpOaXp+eahOWuueWZqOWSjOi+k+WFpeahhlxuICAgICAgICB2YXIgb2xkQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdGl2ZS1pbnB1dC1jb250YWluZXInKTtcbiAgICAgICAgaWYgKG9sZENvbnRhaW5lcikge1xuICAgICAgICAgICAgb2xkQ29udGFpbmVyLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7rmlrDnmoTlrrnlmajvvIjnm7TmjqXmlL7lnKggYm9keSDkuIvvvIznoa7kv53kuI3ooqvpga7mjKHvvIlcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBjb250YWluZXIuaWQgPSAnbmF0aXZlLWlucHV0LWNvbnRhaW5lcic7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5jc3NUZXh0ID0gW1xuICAgICAgICAgICAgJ3Bvc2l0aW9uOiBmaXhlZCcsXG4gICAgICAgICAgICAndG9wOiAwJyxcbiAgICAgICAgICAgICdsZWZ0OiAwJyxcbiAgICAgICAgICAgICd3aWR0aDogMTAwJScsXG4gICAgICAgICAgICAnaGVpZ2h0OiAxMDAlJyxcbiAgICAgICAgICAgICdwb2ludGVyLWV2ZW50czogbm9uZScsXG4gICAgICAgICAgICAnei1pbmRleDogOTk5OTknXG4gICAgICAgIF0uam9pbignOyAnKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65omL5py65Y+36L6T5YWl5qGGXG4gICAgICAgIHZhciBwaG9uZUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgcGhvbmVJbnB1dC5pZCA9ICduYXRpdmUtcGhvbmUtaW5wdXQnO1xuICAgICAgICBwaG9uZUlucHV0LnR5cGUgPSAndGVsJztcbiAgICAgICAgcGhvbmVJbnB1dC5wbGFjZWhvbGRlciA9ICfor7fovpPlhaXmiYvmnLrlj7cnO1xuICAgICAgICBwaG9uZUlucHV0Lm1heExlbmd0aCA9IDExO1xuICAgICAgICBwaG9uZUlucHV0LnN0eWxlLmNzc1RleHQgPSBbXG4gICAgICAgICAgICAncG9zaXRpb246IGFic29sdXRlJyxcbiAgICAgICAgICAgICdsZWZ0OiAnICsgcGhvbmVTY3JlZW4ubGVmdCArICdweCcsXG4gICAgICAgICAgICAndG9wOiAnICsgcGhvbmVTY3JlZW4udG9wICsgJ3B4JyxcbiAgICAgICAgICAgICd3aWR0aDogJyArIHBob25lU2NyZWVuLndpZHRoICsgJ3B4JyxcbiAgICAgICAgICAgICdoZWlnaHQ6ICcgKyBwaG9uZVNjcmVlbi5oZWlnaHQgKyAncHgnLFxuICAgICAgICAgICAgJ2JhY2tncm91bmQ6IHRyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICdib3JkZXI6IG5vbmUnLFxuICAgICAgICAgICAgJ2JvcmRlci1yYWRpdXM6IDAnLFxuICAgICAgICAgICAgJ2ZvbnQtc2l6ZTogMTJweCcsXG4gICAgICAgICAgICAnY29sb3I6ICMzMzMnLFxuICAgICAgICAgICAgJ3BhZGRpbmc6IDAgOHB4JyxcbiAgICAgICAgICAgICdib3gtc2l6aW5nOiBib3JkZXItYm94JyxcbiAgICAgICAgICAgICdvdXRsaW5lOiBub25lJyxcbiAgICAgICAgICAgICdwb2ludGVyLWV2ZW50czogYXV0bycsXG4gICAgICAgICAgICAnei1pbmRleDogMTAwMDAwJyxcbiAgICAgICAgICAgICdjdXJzb3I6IHRleHQnLFxuICAgICAgICAgICAgJ2ZvbnQtZmFtaWx5OiBBcmlhbCwgXCJNaWNyb3NvZnQgWWFIZWlcIiwgc2Fucy1zZXJpZicsXG4gICAgICAgICAgICAnbGluZS1oZWlnaHQ6ICcgKyBwaG9uZVNjcmVlbi5oZWlnaHQgKyAncHgnLFxuICAgICAgICAgICAgJ3RleHQtYWxpZ246IGxlZnQnXG4gICAgICAgIF0uam9pbignOyAnKTtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHBob25lSW5wdXQpO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu66aqM6K+B56CB6L6T5YWl5qGGXG4gICAgICAgIHZhciBjb2RlSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICBjb2RlSW5wdXQuaWQgPSAnbmF0aXZlLWNvZGUtaW5wdXQnO1xuICAgICAgICBjb2RlSW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgICAgICAgY29kZUlucHV0LnBsYWNlaG9sZGVyID0gJ+mqjOivgeeggSc7XG4gICAgICAgIGNvZGVJbnB1dC5tYXhMZW5ndGggPSA2O1xuICAgICAgICBjb2RlSW5wdXQuc3R5bGUuY3NzVGV4dCA9IFtcbiAgICAgICAgICAgICdwb3NpdGlvbjogYWJzb2x1dGUnLFxuICAgICAgICAgICAgJ2xlZnQ6ICcgKyBjb2RlU2NyZWVuLmxlZnQgKyAncHgnLFxuICAgICAgICAgICAgJ3RvcDogJyArIGNvZGVTY3JlZW4udG9wICsgJ3B4JyxcbiAgICAgICAgICAgICd3aWR0aDogJyArIGNvZGVTY3JlZW4ud2lkdGggKyAncHgnLFxuICAgICAgICAgICAgJ2hlaWdodDogJyArIGNvZGVTY3JlZW4uaGVpZ2h0ICsgJ3B4JyxcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAnYm9yZGVyOiBub25lJyxcbiAgICAgICAgICAgICdib3JkZXItcmFkaXVzOiAwJyxcbiAgICAgICAgICAgICdmb250LXNpemU6IDEycHgnLFxuICAgICAgICAgICAgJ2NvbG9yOiAjMzMzJyxcbiAgICAgICAgICAgICdwYWRkaW5nOiAwIDhweCcsXG4gICAgICAgICAgICAnYm94LXNpemluZzogYm9yZGVyLWJveCcsXG4gICAgICAgICAgICAnb3V0bGluZTogbm9uZScsXG4gICAgICAgICAgICAncG9pbnRlci1ldmVudHM6IGF1dG8nLFxuICAgICAgICAgICAgJ3otaW5kZXg6IDEwMDAwMCcsXG4gICAgICAgICAgICAnY3Vyc29yOiB0ZXh0JyxcbiAgICAgICAgICAgICdmb250LWZhbWlseTogQXJpYWwsIFwiTWljcm9zb2Z0IFlhSGVpXCIsIHNhbnMtc2VyaWYnLFxuICAgICAgICAgICAgJ2xpbmUtaGVpZ2h0OiAnICsgY29kZVNjcmVlbi5oZWlnaHQgKyAncHgnLFxuICAgICAgICAgICAgJ3RleHQtYWxpZ246IGxlZnQnXG4gICAgICAgIF0uam9pbignOyAnKTtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNvZGVJbnB1dCk7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDnhKbngrnkuovku7bosIPor5VcbiAgICAgICAgcGhvbmVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ+aJi+acuui+k+WFpeahhuiOt+W+l+eEpueCuScpO1xuICAgICAgICB9KTtcbiAgICAgICAgcGhvbmVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ+aJi+acuui+k+WFpeahhuiiq+eCueWHuycpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29kZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygn6aqM6K+B56CB6L6T5YWl5qGG6I635b6X54Sm54K5Jyk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb2RlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfpqozor4HnoIHovpPlhaXmoYbooqvngrnlh7snKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZygn5Y6f55Sf6L6T5YWl5qGG5Yib5bu65a6M5oiQJyk7XG4gICAgICAgIFxuICAgICAgICAvLyDlu7bov5/mo4Dmn6XovpPlhaXmoYbmmK/lkKbmraPnoa7liJvlu7pcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBwaG9uZUNoZWNrID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdGl2ZS1waG9uZS1pbnB1dCcpO1xuICAgICAgICAgICAgdmFyIGNvZGVDaGVjayA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXRpdmUtY29kZS1pbnB1dCcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ+i+k+WFpeahhuajgOafpTonKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCcgIOaJi+acuui+k+WFpeahhjonLCBwaG9uZUNoZWNrID8gJ+WtmOWcqCcgOiAn5LiN5a2Y5ZyoJyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnICDpqozor4HnoIHovpPlhaXmoYY6JywgY29kZUNoZWNrID8gJ+WtmOWcqCcgOiAn5LiN5a2Y5ZyoJyk7XG4gICAgICAgICAgICBpZiAocGhvbmVDaGVjaykge1xuICAgICAgICAgICAgICAgIHZhciByZWN0ID0gcGhvbmVDaGVjay5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnICDmiYvmnLrovpPlhaXmoYbkvY3nva46JywgcmVjdC5sZWZ0LCByZWN0LnRvcCwgcmVjdC53aWR0aCwgJ3gnLCByZWN0LmhlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDEwMCk7XG4gICAgICAgIFxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign5Yib5bu65Y6f55Sf6L6T5YWl5qGG5aSx6LSlOicsIGUpO1xuICAgIH1cbn07XG5cbi8vIOenu+mZpOWOn+eUnyBIVE1MIOi+k+WFpeahhuWFg+e0oO+8iOeZu+W9leaIkOWKn+aIluWFs+mXreW8ueeql+aXtuiwg+eUqO+8iVxudmFyIF9yZW1vdmVOYXRpdmVJbnB1dEVsZW1lbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFjYy5zeXMuaXNCcm93c2VyKSByZXR1cm47XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXRpdmUtaW5wdXQtY29udGFpbmVyJyk7XG4gICAgICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgICAgICAgIGNvbnRhaW5lci5yZW1vdmUoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfljp/nlJ/ovpPlhaXmoYblt7Lnp7vpmaQnKTtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign56e76Zmk5Y6f55Sf6L6T5YWl5qGG5aSx6LSlOicsIGUpO1xuICAgIH1cbn07XG5cbi8vIOS/ruWkjSBFZGl0Qm94IOeahCBIVE1MIGlucHV0IOWFg+e0oOS9jee9ruWSjOWwuuWvuFxudmFyIF9maXhFZGl0Qm94SW5wdXRFbGVtZW50cyA9IGZ1bmN0aW9uKHBhbmVsLCBwaG9uZUlucHV0Tm9kZSwgY29kZUlucHV0Tm9kZSwgaW5wdXRXaWR0aCwgaW5wdXRIZWlnaHQsIGNvZGVJbnB1dFcsIHBob25lRWRpdEJveCwgY29kZUVkaXRCb3gpIHtcbiAgICBpZiAoIWNjLnN5cy5pc0Jyb3dzZXIpIHJldHVybjtcbiAgICBcbiAgICB0cnkge1xuICAgICAgICAvLyDojrflj5YgQ2FudmFzIOWFg+e0oFxuICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ0dhbWVDYW52YXMnKSB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdjYW52YXMnKTtcbiAgICAgICAgaWYgKCFjYW52YXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+aJvuS4jeWIsCBDYW52YXMg5YWD57SgJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBjYW52YXNSZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zb2xlLmxvZygnQ2FudmFzIOWwuuWvuDonLCBjYW52YXNSZWN0LndpZHRoLCAneCcsIGNhbnZhc1JlY3QuaGVpZ2h0KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPlua4uOaIj+iuvuiuoeeahOWIhui+qOeOh1xuICAgICAgICB2YXIgd2luU2l6ZSA9IGNjLndpblNpemU7XG4gICAgICAgIGNvbnNvbGUubG9nKCfmuLjmiI/liIbovqjnjoc6Jywgd2luU2l6ZS53aWR0aCwgJ3gnLCB3aW5TaXplLmhlaWdodCk7XG4gICAgICAgIFxuICAgICAgICAvLyDorqHnrpfnvKnmlL7mr5TkvotcbiAgICAgICAgdmFyIHNjYWxlWCA9IGNhbnZhc1JlY3Qud2lkdGggLyB3aW5TaXplLndpZHRoO1xuICAgICAgICB2YXIgc2NhbGVZID0gY2FudmFzUmVjdC5oZWlnaHQgLyB3aW5TaXplLmhlaWdodDtcbiAgICAgICAgY29uc29sZS5sb2coJ+e8qeaUvuavlOS+izonLCBzY2FsZVgsIHNjYWxlWSk7XG4gICAgICAgIFxuICAgICAgICAvLyDovoXliqnlh73mlbDvvJrlsIYgQ29jb3Mg5LiW55WM5Z2Q5qCH6L2s5o2i5Li6IEhUTUwg5bGP5bmV5Z2Q5qCHXG4gICAgICAgIHZhciB3b3JsZFRvU2NyZWVuID0gZnVuY3Rpb24od29ybGRQb3MsIG5vZGVXaWR0aCwgbm9kZUhlaWdodCkge1xuICAgICAgICAgICAgLy8gQ29jb3Mg5Z2Q5qCH57O777ya5Y6f54K55Zyo5bem5LiL6KeS77yMWei9tOWQkeS4ilxuICAgICAgICAgICAgLy8gSFRNTCDlnZDmoIfns7vvvJrljp/ngrnlnKjlt6bkuIrop5LvvIxZ6L205ZCR5LiLXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOS4lueVjOWdkOagh+i9rOaNouS4uuebuOWvueS6juiuvuiuoeWIhui+qOeOh+eahOS9jee9ru+8iDAg5YiwIHdpblNpemXvvIlcbiAgICAgICAgICAgIC8vIOeEtuWQjue8qeaUvuWIsCBDYW52YXMg5bC65a+4XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBzY3JlZW5YID0gKHdvcmxkUG9zLnggLSBub2RlV2lkdGggLyAyKSAqIHNjYWxlWDtcbiAgICAgICAgICAgIHZhciBzY3JlZW5ZID0gY2FudmFzUmVjdC5oZWlnaHQgLSAod29ybGRQb3MueSArIG5vZGVIZWlnaHQgLyAyKSAqIHNjYWxlWTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHsgeDogc2NyZWVuWCwgeTogc2NyZWVuWSB9O1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLy8g6K6h566X5omL5py66L6T5YWl5qGG55qE5LiW55WM5Z2Q5qCHXG4gICAgICAgIHZhciBwaG9uZVdvcmxkUG9zID0gcGhvbmVJbnB1dE5vZGUuY29udmVydFRvV29ybGRTcGFjZUFSKGNjLnYyKDAsIDApKTtcbiAgICAgICAgY29uc29sZS5sb2coJ+aJi+acuui+k+WFpeahhuS4lueVjOWdkOaghzonLCBwaG9uZVdvcmxkUG9zLngsIHBob25lV29ybGRQb3MueSk7XG4gICAgICAgIFxuICAgICAgICB2YXIgcGhvbmVTY3JlZW5Qb3MgPSB3b3JsZFRvU2NyZWVuKHBob25lV29ybGRQb3MsIGlucHV0V2lkdGgsIGlucHV0SGVpZ2h0KTtcbiAgICAgICAgY29uc29sZS5sb2coJ+aJi+acuui+k+WFpeahhuWxj+W5leS9jee9rjonLCBwaG9uZVNjcmVlblBvcy54LCBwaG9uZVNjcmVlblBvcy55KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOafpeaJviBIVE1MIGlucHV0IOWFg+e0oFxuICAgICAgICB2YXIgaW5wdXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaW5wdXQnKTtcbiAgICAgICAgY29uc29sZS5sb2coJ+aJvuWIsCAnICsgaW5wdXRzLmxlbmd0aCArICcg5LiqIGlucHV0IOWFg+e0oCcpO1xuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5Y+q5pyJ5LiA5LiqIGlucHV077yM6ZyA6KaB5omL5Yqo5Yib5bu656ys5LqM5LiqXG4gICAgICAgIGlmIChpbnB1dHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICB2YXIgcGhvbmVJbnB1dCA9IGlucHV0c1swXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6K6+572u5qC35byPXG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUubGVmdCA9IE1hdGgubWF4KDAsIHBob25lU2NyZWVuUG9zLngpICsgJ3B4JztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUudG9wID0gTWF0aC5tYXgoMCwgcGhvbmVTY3JlZW5Qb3MueSkgKyAncHgnO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS53aWR0aCA9IChpbnB1dFdpZHRoICogc2NhbGVYKSArICdweCc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLmhlaWdodCA9IChpbnB1dEhlaWdodCAqIHNjYWxlWSkgKyAncHgnO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS56SW5kZXggPSAnOTk5OSc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS5jdXJzb3IgPSAndGV4dCc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLmJhY2tncm91bmQgPSAncmdiYSgyNTUsMjU1LDI1NSwwLjUpJztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUuYm9yZGVyID0gJzJweCBzb2xpZCBnb2xkJztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUub3V0bGluZSA9ICdub25lJztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUuZm9udFNpemUgPSAnMTZweCc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLmNvbG9yID0gJyMzMzMzMzMnO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS5wYWRkaW5nID0gJzVweCc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLmJveFNpemluZyA9ICdib3JkZXItYm94JztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUuYm9yZGVyUmFkaXVzID0gJzVweCc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfmiYvmnLrovpPlhaXmoYbmoLflvI/lt7Lkv67lpI3vvIzkvY3nva46JywgcGhvbmVJbnB1dC5zdHlsZS5sZWZ0LCBwaG9uZUlucHV0LnN0eWxlLnRvcCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmqjOivgeeggei+k+WFpeahhlxuICAgICAgICB2YXIgY29kZVdvcmxkUG9zID0gY29kZUlucHV0Tm9kZS5jb252ZXJ0VG9Xb3JsZFNwYWNlQVIoY2MudjIoMCwgMCkpO1xuICAgICAgICBjb25zb2xlLmxvZygn6aqM6K+B56CB6L6T5YWl5qGG5LiW55WM5Z2Q5qCHOicsIGNvZGVXb3JsZFBvcy54LCBjb2RlV29ybGRQb3MueSk7XG4gICAgICAgIFxuICAgICAgICB2YXIgY29kZVNjcmVlblBvcyA9IHdvcmxkVG9TY3JlZW4oY29kZVdvcmxkUG9zLCBjb2RlSW5wdXRXLCBpbnB1dEhlaWdodCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCfpqozor4HnoIHovpPlhaXmoYblsY/luZXkvY3nva46JywgY29kZVNjcmVlblBvcy54LCBjb2RlU2NyZWVuUG9zLnkpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGlucHV0cy5sZW5ndGggPj0gMikge1xuICAgICAgICAgICAgdmFyIGNvZGVJbnB1dCA9IGlucHV0c1sxXTtcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUubGVmdCA9IE1hdGgubWF4KDAsIGNvZGVTY3JlZW5Qb3MueCkgKyAncHgnO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLnRvcCA9IE1hdGgubWF4KDAsIGNvZGVTY3JlZW5Qb3MueSkgKyAncHgnO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLndpZHRoID0gKGNvZGVJbnB1dFcgKiBzY2FsZVgpICsgJ3B4JztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS5oZWlnaHQgPSAoaW5wdXRIZWlnaHQgKiBzY2FsZVkpICsgJ3B4JztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS56SW5kZXggPSAnOTk5OSc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUub3BhY2l0eSA9ICcxJztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUuY3Vyc29yID0gJ3RleHQnO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLmJhY2tncm91bmQgPSAncmdiYSgyNTUsMjU1LDI1NSwwLjUpJztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS5ib3JkZXIgPSAnMnB4IHNvbGlkIGdvbGQnO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLm91dGxpbmUgPSAnbm9uZSc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUuZm9udFNpemUgPSAnMTZweCc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUuY29sb3IgPSAnIzMzMzMzMyc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUucGFkZGluZyA9ICc1cHgnO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLmJveFNpemluZyA9ICdib3JkZXItYm94JztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnNXB4JztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc29sZS5sb2coJ+mqjOivgeeggei+k+WFpeahhuagt+W8j+W3suS/ruWkjScpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDosIPor5XvvJrmmL7npLrovpPlhaXmoYbnmoTlrp7pmYXkvY3nva5cbiAgICAgICAgY29uc29sZS5sb2coJz09PSDosIPor5Xkv6Hmga8gPT09Jyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdDYW52YXMg5L2N572uOicsIGNhbnZhc1JlY3QubGVmdCwgY2FudmFzUmVjdC50b3ApO1xuICAgICAgICBjb25zb2xlLmxvZygn6K6+6K6h5YiG6L6o546HOicsIHdpblNpemUud2lkdGgsICd4Jywgd2luU2l6ZS5oZWlnaHQpO1xuICAgICAgICBjb25zb2xlLmxvZygn6L6T5YWl5qGG6IqC54K55bC65a+4OicsIGlucHV0V2lkdGgsICd4JywgaW5wdXRIZWlnaHQpO1xuICAgICAgICBjb25zb2xlLmxvZygn6aqM6K+B56CB6L6T5YWl5qGG5bC65a+4OicsIGNvZGVJbnB1dFcsICd4JywgaW5wdXRIZWlnaHQpO1xuICAgICAgICBcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+S/ruWkjSBFZGl0Qm94IOagt+W8j+Wksei0pTonLCBlKTtcbiAgICB9XG59O1xuXG4vLyBNdXRhdGlvbk9ic2VydmVyIOebkeWQrOaWsOWIm+W7uueahGlucHV05YWD57SgXG52YXIgX3N0YXJ0SW5wdXRPYnNlcnZlciA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghY2Muc3lzLmlzQnJvd3NlcikgcmV0dXJuO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24obXV0YXRpb25zKSB7XG4gICAgICAgICAgICBtdXRhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihtdXRhdGlvbikge1xuICAgICAgICAgICAgICAgIG11dGF0aW9uLmFkZGVkTm9kZXMuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLm5vZGVOYW1lID09PSAnSU5QVVQnIHx8IG5vZGUubm9kZU5hbWUgPT09ICdURVhUQVJFQScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zdHlsZVNpbmdsZUlucHV0KG5vZGUsICcjMDAwMDAwJywgJyNmZmZmZmYnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyDmo4Dmn6XlrZDoioLngrlcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUucXVlcnlTZWxlY3RvckFsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlucHV0cyA9IG5vZGUucXVlcnlTZWxlY3RvckFsbCgnaW5wdXQsIHRleHRhcmVhJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dHMuZm9yRWFjaChmdW5jdGlvbihpbnApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfc3R5bGVTaW5nbGVJbnB1dChpbnAsICcjMDAwMDAwJywgJyNmZmZmZmYnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7XG4gICAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ+WQr+WKqElucHV055uR5ZCs5Zmo5aSx6LSlOicsIGUpO1xuICAgIH1cbn07XG5cbmNjLkNsYXNzKHtcbiAgICBleHRlbmRzOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIHdhaXRfbm9kZToge1xuICAgICAgICAgICAgdHlwZTogY2MuTm9kZSxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgdXNlcl9hZ3JlZW1lbnRfcHJlZmFiczoge1xuICAgICAgICAgICAgdHlwZTogY2MuUHJlZmFiLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICBwaG9uZV9sb2dpbl9wcmVmYWI6IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLlByZWZhYixcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbkxvYWQgKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cIik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwibG9naW5TY2VuZSBvbkxvYWQg5byA5aeL5omn6KGMXCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cIik7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIPCflKcg5L+u5aSN77ya56aB55So6Ieq5Yqo5YWo5bGP5Yqf6IO977yI5Y+M6YeN5L+d6Zmp77yM56e76ZmkIGlzTW9iaWxlIOajgOafpe+8iVxuICAgICAgICAgICAgLy8g5Y2z5L2/IG1haW4uanMg5Lit55qE6K6+572u5rKh5pyJ55Sf5pWI77yM6L+Z6YeM5Lmf5Lya5YaN5qyh56aB55SoXG4gICAgICAgICAgICBpZiAoY2MudmlldyAmJiBjYy52aWV3LmVuYWJsZUF1dG9GdWxsU2NyZWVuKSB7XG4gICAgICAgICAgICAgICAgY2Mudmlldy5lbmFibGVBdXRvRnVsbFNjcmVlbihmYWxzZSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJsb2dpblNjZW5lOiDlt7LnpoHnlKjoh6rliqjlhajlsY/lip/og71cIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIPCflKcg6aKd5aSW5L+d6Zmp77ya56aB55SoIHNjcmVlbiDnmoToh6rliqjlhajlsY/op6bmkbjnm5HlkKzlmahcbiAgICAgICAgICAgIGlmIChjYy5zY3JlZW4gJiYgY2Muc2NyZWVuLmRpc2FibGVBdXRvRnVsbFNjcmVlbikge1xuICAgICAgICAgICAgICAgIGNjLnNjcmVlbi5kaXNhYmxlQXV0b0Z1bGxTY3JlZW4oKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImxvZ2luU2NlbmU6IOW3suemgeeUqCBzY3JlZW4g6Ieq5Yqo5YWo5bGP6Kem5pG455uR5ZCs5ZmoXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi56aB55So6Ieq5Yqo5YWo5bGP5pe25Ye66ZSZOlwiLCBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDlkK/liqhXZWLlubPlj7BJbnB1dOagt+W8j+ebkeWQrOWZqFxuICAgICAgICAgICAgX3N0YXJ0SW5wdXRPYnNlcnZlcigpO1xuICAgICAgICAgICAgX2luamVjdEdsb2JhbFN0eWxlcygnIzAwMDAwMCcsICcjZmZmZmZmJyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLliJ3lp4vljJbmoLflvI/nm5HlkKzlmajml7blh7rplJk6XCIsIGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5faXNBZ3JlZW1lbnRDaGVja2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3Bob25lTG9naW5Qb3B1cFNob3dpbmcgPSBmYWxzZTsgIC8vIOWIneWni+WMluW8ueeql+agh+W/l+S9jVxuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuX2luaXRXYWl0Tm9kZSgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi5Yid5aeL5YyW562J5b6F6IqC54K55pe25Ye66ZSZOlwiLCBlKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOWIneWni+WMluWkjemAieahhu+8iOS9v+eUqOeCueWHu+S6i+S7tu+8iVxuICAgICAgICAgICAgdGhpcy5faW5pdENoZWNrYm94KCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLliJ3lp4vljJblpI3pgInmoYbml7blh7rplJk6XCIsIGUpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g5Yid5aeL5YyW55m75b2V5oyJ6ZKuXG4gICAgICAgICAgICB0aGlzLl9pbml0TG9naW5CdXR0b25zKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLliJ3lp4vljJbnmbvlvZXmjInpkq7ml7blh7rplJk6XCIsIGUpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g5Yid5aeL5YyW55So5oi35Y2P6K6u6ZO+5o6l54K55Ye75LqL5Lu2XG4gICAgICAgICAgICB0aGlzLl9pbml0VXNlckFncmVlbWVudExpbmsoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuWIneWni+WMlueUqOaIt+WNj+iurumTvuaOpeaXtuWHuumUmTpcIiwgZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g8J+agOOAkOaAp+iDveS8mOWMluOAkemihOWKoOi9veWkp+WOheWcuuaZr+WSjOa4uOaIj+WcuuaZr1xuICAgICAgICAgICAgdGhpcy5fcHJlbG9hZFNjZW5lcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi6aKE5Yqg6L295Zy65pmv5pe25Ye66ZSZOlwiLCBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDmo4Dmn6XmmK/lkKbmnInmnKzlnLDnmbvlvZXkvJror53vvIzlsJ3or5Xoh6rliqjnmbvlvZVcbiAgICAgICAgICAgIHRoaXMuX2NoZWNrQXV0b0xvZ2luKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLmo4Dmn6Xoh6rliqjnmbvlvZXml7blh7rplJk6XCIsIGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cubXlnbG9iYWwgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwibXlnbG9iYWwg5pyq5a6a5LmJ77yM5bCd6K+V562J5b6FLi4uXCIpO1xuICAgICAgICAgICAgdGhpcy5fd2FpdEZvck15Z2xvYmFsKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pbml0QW5kU3RhcnQoKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwiPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVwiKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJsb2dpblNjZW5lIG9uTG9hZCDmiafooYzlrozmiJBcIik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVwiKTtcbiAgICB9LFxuXG4gICAgLy8g5qOA5p+l6Ieq5Yqo55m75b2VXG4gICAgX2NoZWNrQXV0b0xvZ2luOiBmdW5jdGlvbigpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbDtcbiAgICAgICAgaWYgKCFteWdsb2JhbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm6KKr5by65Yi25LiL57q/XG4gICAgICAgIGlmIChteWdsb2JhbC53YXNGb3JjZUxvZ2dlZE91dCgpKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93RXJyb3IobXlnbG9iYWwuZ2V0Rm9yY2VMb2dvdXRSZWFzb24oKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmo4Dmn6XmmK/lkKbmnInmnKzlnLDkvJror51cbiAgICAgICAgaWYgKG15Z2xvYmFsLmhhc0xvY2FsU2Vzc2lvbigpKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIG15Z2xvYmFsLnZlcmlmeVRva2VuKGZ1bmN0aW9uKHZhbGlkLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dFcnJvcihcIuiHquWKqOeZu+W9leS4rS4uLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpuacieS/neWtmOeahOaIv+mXtOS/oeaBr++8iOWIt+aWsOmhtemdouWQjuaBouWkjeWIsOa4uOaIj+WcuuaZr++8iVxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVjb25uZWN0SW5mbyA9IG15Z2xvYmFsLnNvY2tldCAmJiBteWdsb2JhbC5zb2NrZXQubG9hZFJlY29ubmVjdEluZm8gPyBcbiAgICAgICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnNvY2tldC5sb2FkUmVjb25uZWN0SW5mbygpIDogeyB0b2tlbjogJycsIHBsYXllcklkOiAnJywgcm9vbUNvZGU6ICcnIH07XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c5pyJ5oi/6Ze05Y+377yM6K+05piO5LmL5YmN5Zyo5ri45oiP5Lit77yM6ZyA6KaB5oGi5aSN5Yiw5ri45oiP5Zy65pmvXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWNvbm5lY3RJbmZvLnJvb21Db2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChteWdsb2JhbC5zb2NrZXQgJiYgbXlnbG9iYWwuc29ja2V0LmluaXRTb2NrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LmluaXRTb2NrZXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g55uR5ZCs5oi/6Ze05oGi5aSN5LqL5Lu2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uUm9vbVJlc3RvcmVkKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwiZ2FtZVNjZW5lXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOebkeWQrOaZrumAmui/nuaOpeaIkOWKn++8iOS4jeWcqOaIv+mXtOS4re+8iVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBldnQgPSB3aW5kb3cuZXZlbnRMaXN0ZXIgPyB3aW5kb3cuZXZlbnRMaXN0ZXIoe30pIDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2dC5vbihcImNvbm5lY3Rpb25fc3VjY2Vzc1wiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJnYW1lU2NlbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDAuNSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmsqHmnInmiL/pl7Tkv6Hmga/vvIzmraPluLjot7PovazliLDlpKfljoVcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChteWdsb2JhbC5zb2NrZXQgJiYgbXlnbG9iYWwuc29ja2V0LmluaXRTb2NrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LmluaXRTb2NrZXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwiaGFsbFNjZW5lXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMC41KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRva2Vu5peg5pWI77yM5pi+56S66ZSZ6K+v5L+h5oGv5bm25YGc55WZ5Zyo55m75b2V6aG16Z2iXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dFcnJvcihtZXNzYWdlIHx8IFwi55m75b2V5bey6L+H5pyf77yM6K+36YeN5paw55m75b2VXCIpO1xuICAgICAgICAgICAgICAgICAgICAvLyBteWdsb2JhbC52ZXJpZnlUb2tlbiDlt7Lnu4/muIXpmaTkuobmnKzlnLDnirbmgIHvvIzov5nph4zkuI3pnIDopoHlho3mrKHmuIXpmaRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfaW5pdFdhaXROb2RlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMud2FpdF9ub2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9sb2FkaW5nSW1hZ2UgPSB0aGlzLndhaXRfbm9kZS5nZXRDaGlsZEJ5TmFtZShcImxvYWRpbmdfaW1hZ2VcIik7XG4gICAgICAgICAgICB2YXIgbGJsTm9kZSA9IHRoaXMud2FpdF9ub2RlLmdldENoaWxkQnlOYW1lKFwibGJsY29udGVudF9MYWJlbFwiKTtcbiAgICAgICAgICAgIGlmIChsYmxOb2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2FpdExhYmVsID0gbGJsTm9kZS5nZXRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy53YWl0X25vZGUuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2luaXRDaGVja2JveDogZnVuY3Rpb24oKSB7XG4gICAgICAgIFxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICAvLyBsb2dpblNjZW5lIOiEmuacrOaMgui9veWcqCBST09UX1VJIOiKgueCueS4iu+8jOaJgOS7pSB0aGlzLm5vZGUg5bCx5pivIFJPT1RfVUlcbiAgICAgICAgdmFyIGNoZWNrTWFya05vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJjaGVja19tYXJrXCIpO1xuICAgICAgICBpZiAoIWNoZWNrTWFya05vZGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJjaGVja19tYXJrIOiKgueCueacquaJvuWIsFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5fY2hlY2tNYXJrTm9kZSA9IGNoZWNrTWFya05vZGU7XG4gICAgICAgIFxuICAgICAgICB2YXIgY2hlY2ttYXJrID0gY2hlY2tNYXJrTm9kZS5nZXRDaGlsZEJ5TmFtZShcImNoZWNrbWFya1wiKTtcbiAgICAgICAgaWYgKGNoZWNrbWFyaykge1xuICAgICAgICAgICAgdGhpcy5fY2hlY2ttYXJrSWNvbiA9IGNoZWNrbWFyaztcbiAgICAgICAgICAgIGNoZWNrbWFyay5hY3RpdmUgPSB0cnVlOyAgLy8g6buY6K6k6YCJ5LitXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2lzQWdyZWVtZW50Q2hlY2tlZCA9IHRydWU7ICAvLyDpu5jorqTlt7LlkIzmhI/ljY/orq5cbiAgICAgICAgXG4gICAgICAgIHZhciBidXR0b24gPSBjaGVja01hcmtOb2RlLmdldENvbXBvbmVudChjYy5CdXR0b24pO1xuICAgICAgICBpZiAoYnV0dG9uKSB7XG4gICAgICAgICAgICBidXR0b24uZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjaGVja01hcmtOb2RlLm9mZihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQpO1xuICAgICAgICBjaGVja01hcmtOb2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHNlbGYuX3RvZ2dsZUNoZWNrYm94KCk7XG4gICAgICAgIH0sIHNlbGYpO1xuICAgIH0sXG5cbiAgICBfdG9nZ2xlQ2hlY2tib3g6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9pc0FncmVlbWVudENoZWNrZWQgPSAhdGhpcy5faXNBZ3JlZW1lbnRDaGVja2VkO1xuICAgICAgICBpZiAodGhpcy5fY2hlY2ttYXJrSWNvbikge1xuICAgICAgICAgICAgdGhpcy5fY2hlY2ttYXJrSWNvbi5hY3RpdmUgPSB0aGlzLl9pc0FncmVlbWVudENoZWNrZWQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc3RhcnQgKCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cIik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwibG9naW5TY2VuZSBzdGFydCDmlrnms5XmiafooYxcIik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVwiKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWkh+eUqOaWueahiO+8muWcqCBzdGFydCDkuK3lho3mrKHmo4Dmn6XmjInpkq7mmK/lkKbmraPnoa7liJ3lp4vljJZcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOW7tui/n+ajgOafpeaMiemSrueKtuaAgS4uLlwiKTtcbiAgICAgICAgICAgIHZhciBwaG9uZUxvZ2luTm9kZSA9IHNlbGYubm9kZS5nZXRDaGlsZEJ5TmFtZShcImxvZ2luX3Bob25lXCIpO1xuICAgICAgICAgICAgaWYgKHBob25lTG9naW5Ob2RlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4gbG9naW5fcGhvbmUg6IqC54K55a2Y5ZyoXCIpO1xuICAgICAgICAgICAgICAgIHZhciBoYXNUb3VjaExpc3RlbmVycyA9IHBob25lTG9naW5Ob2RlLmdldENvbXBvbmVudChjYy5CdXR0b24pICE9PSBudWxsO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOaYr+WQpuaciSBCdXR0b24g57uE5Lu2OlwiLCBoYXNUb3VjaExpc3RlbmVycyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5YaN5qyh56Gu5L+d5LqL5Lu257uR5a6aXG4gICAgICAgICAgICAgICAgcGhvbmVMb2dpbk5vZGUub2ZmKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCk7XG4gICAgICAgICAgICAgICAgcGhvbmVMb2dpbk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIj4+PiBbc3RhcnTlpIfnlKhdIOaJi+acuueZu+W9leaMiemSriBUT1VDSF9FTkQg5LqL5Lu26Kem5Y+RXCIpO1xuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fZG9QaG9uZUxvZ2luKCk7XG4gICAgICAgICAgICAgICAgfSwgc2VsZik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4g5bey6YeN5paw57uR5a6a5omL5py655m75b2V5oyJ6ZKu5LqL5Lu2XCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiPj4+IGxvZ2luX3Bob25lIOiKgueCueS4jeWtmOWcqO+8gVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHd4TG9naW5Ob2RlID0gc2VsZi5ub2RlLmdldENoaWxkQnlOYW1lKFwibG9naW5fd3hcIik7XG4gICAgICAgICAgICBpZiAod3hMb2dpbk5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIj4+PiBsb2dpbl93eCDoioLngrnlrZjlnKhcIik7XG4gICAgICAgICAgICAgICAgd3hMb2dpbk5vZGUub2ZmKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCk7XG4gICAgICAgICAgICAgICAgd3hMb2dpbk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIj4+PiBbc3RhcnTlpIfnlKhdIOW+ruS/oeeZu+W9leaMiemSriBUT1VDSF9FTkQg5LqL5Lu26Kem5Y+RXCIpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9kb1d4TG9naW4oKTtcbiAgICAgICAgICAgICAgICB9LCBzZWxmKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIj4+PiDlt7Lph43mlrDnu5Hlrprlvq7kv6HnmbvlvZXmjInpkq7kuovku7ZcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDAuNSk7XG4gICAgfSxcblxuICAgIF9pbml0TG9naW5CdXR0b25zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT0g5Yid5aeL5YyW55m75b2V5oyJ6ZKuID09PVwiKTtcbiAgICAgICAgY29uc29sZS5sb2coXCLlvZPliY3oioLngrk6XCIsIHRoaXMubm9kZSA/IHRoaXMubm9kZS5uYW1lIDogXCJudWxsXCIpO1xuICAgICAgICBcbiAgICAgICAgLy8g5omT5Y2w5omA5pyJ5a2Q6IqC54K55ZCN56ewXG4gICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMubm9kZS5jaGlsZHJlbjtcbiAgICAgICAgY29uc29sZS5sb2coXCLlrZDoioLngrnmlbDph486XCIsIGNoaWxkcmVuLmxlbmd0aCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiICDlrZDoioLngrlbXCIgKyBpICsgXCJdOlwiLCBjaGlsZHJlbltpXS5uYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGxvZ2luU2NlbmUg6ISa5pys5oyC6L295ZyoIFJPT1RfVUkg6IqC54K55LiK77yM5omA5LulIHRoaXMubm9kZSDlsLHmmK8gUk9PVF9VSVxuICAgICAgICB2YXIgd3hMb2dpbk5vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJsb2dpbl93eFwiKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJ3eExvZ2luTm9kZTpcIiwgd3hMb2dpbk5vZGUgPyBcIuaJvuWIsFwiIDogXCLmnKrmib7liLBcIik7XG4gICAgICAgIGlmICh3eExvZ2luTm9kZSkge1xuICAgICAgICAgICAgdmFyIGJ1dHRvbiA9IHd4TG9naW5Ob2RlLmdldENvbXBvbmVudChjYy5CdXR0b24pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ3eExvZ2luTm9kZSBCdXR0b246XCIsIGJ1dHRvbiA/IFwi5a2Y5ZyoXCIgOiBcIuS4jeWtmOWcqFwiKTtcbiAgICAgICAgICAgIGlmIChidXR0b24pIHtcbiAgICAgICAgICAgICAgICBidXR0b24uaW50ZXJhY3RhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBidXR0b24uY2xpY2tFdmVudHMgPSBbXTtcblxuICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyID0gbmV3IGNjLkNvbXBvbmVudC5FdmVudEhhbmRsZXIoKTtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLnRhcmdldCA9IHRoaXMubm9kZTtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmNvbXBvbmVudCA9IFwibG9naW5TY2VuZVwiO1xuICAgICAgICAgICAgICAgIGhhbmRsZXIuaGFuZGxlciA9IFwiX29uV3hMb2dpbkNsaWNrXCI7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5jdXN0b21FdmVudERhdGEgPSBcIlwiO1xuICAgICAgICAgICAgICAgIGJ1dHRvbi5jbGlja0V2ZW50cy5wdXNoKGhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi5b6u5L+h55m75b2V5oyJ6ZKu5Yid5aeL5YyW5a6M5oiQXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmt7vliqDlpIfnlKjnmoTop6bmkbjkuovku7bnm5HlkKzvvIjnoa7kv53ngrnlh7vkuovku7bkuIDlrprog73op6blj5HvvIlcbiAgICAgICAgICAgIHd4TG9naW5Ob2RlLm9mZihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQpO1xuICAgICAgICAgICAgd3hMb2dpbk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOW+ruS/oeeZu+W9leaMiemSriBUT1VDSF9FTkQg5LqL5Lu26Kem5Y+RXCIpO1xuICAgICAgICAgICAgICAgIHNlbGYuX2RvV3hMb2dpbigpO1xuICAgICAgICAgICAgfSwgc2VsZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi5pyq5om+5YiwIGxvZ2luX3d4IOiKgueCue+8gVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwaG9uZUxvZ2luTm9kZSA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcImxvZ2luX3Bob25lXCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhcInBob25lTG9naW5Ob2RlOlwiLCBwaG9uZUxvZ2luTm9kZSA/IFwi5om+5YiwXCIgOiBcIuacquaJvuWIsFwiKTtcbiAgICAgICAgaWYgKHBob25lTG9naW5Ob2RlKSB7XG4gICAgICAgICAgICB2YXIgYnV0dG9uID0gcGhvbmVMb2dpbk5vZGUuZ2V0Q29tcG9uZW50KGNjLkJ1dHRvbik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInBob25lTG9naW5Ob2RlIEJ1dHRvbjpcIiwgYnV0dG9uID8gXCLlrZjlnKhcIiA6IFwi5LiN5a2Y5ZyoXCIpO1xuICAgICAgICAgICAgaWYgKGJ1dHRvbikge1xuICAgICAgICAgICAgICAgIGJ1dHRvbi5pbnRlcmFjdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJ1dHRvbi5jbGlja0V2ZW50cyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSBuZXcgY2MuQ29tcG9uZW50LkV2ZW50SGFuZGxlcigpO1xuICAgICAgICAgICAgICAgIGhhbmRsZXIudGFyZ2V0ID0gdGhpcy5ub2RlO1xuICAgICAgICAgICAgICAgIGhhbmRsZXIuY29tcG9uZW50ID0gXCJsb2dpblNjZW5lXCI7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5oYW5kbGVyID0gXCJfb25QaG9uZUxvZ2luQ2xpY2tcIjtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmN1c3RvbUV2ZW50RGF0YSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgYnV0dG9uLmNsaWNrRXZlbnRzLnB1c2goaGFuZGxlcik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLmiYvmnLrnmbvlvZXmjInpkq7liJ3lp4vljJblrozmiJBcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOa3u+WKoOWkh+eUqOeahOinpuaRuOS6i+S7tuebkeWQrO+8iOehruS/neeCueWHu+S6i+S7tuS4gOWumuiDveinpuWPke+8iVxuICAgICAgICAgICAgcGhvbmVMb2dpbk5vZGUub2ZmKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCk7XG4gICAgICAgICAgICBwaG9uZUxvZ2luTm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4g5omL5py655m75b2V5oyJ6ZKuIFRPVUNIX0VORCDkuovku7bop6blj5FcIik7XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7ICAvLyDpmLvmraLkuovku7blhpLms6FcbiAgICAgICAgICAgICAgICBzZWxmLl9kb1Bob25lTG9naW4oKTtcbiAgICAgICAgICAgIH0sIHNlbGYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuacquaJvuWIsCBsb2dpbl9waG9uZSDoioLngrnvvIFcIik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwiPT09IOeZu+W9leaMiemSruWIneWni+WMlue7k+adnyA9PT1cIik7XG4gICAgfSxcblxuICAgIF9pbml0VXNlckFncmVlbWVudExpbms6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICAvLyBsb2dpblNjZW5lIOiEmuacrOaMgui9veWcqCBST09UX1VJIOiKgueCueS4iu+8jOaJgOS7pSB0aGlzLm5vZGUg5bCx5pivIFJPT1RfVUlcbiAgICAgICAgdmFyIGxpbmtOb2RlID0gdGhpcy5ub2RlLmdldENoaWxkQnlOYW1lKFwidXNlcl9hZ3JlZW1lbnRfbGlua1wiKTtcbiAgICAgICAgaWYgKGxpbmtOb2RlKSB7XG4gICAgICAgICAgICBsaW5rTm9kZS5hY3RpdmUgPSB0cnVlO1xuXG4gICAgICAgICAgICB2YXIgYnV0dG9uID0gbGlua05vZGUuZ2V0Q29tcG9uZW50KGNjLkJ1dHRvbik7XG4gICAgICAgICAgICBpZiAoYnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgYnV0dG9uLmludGVyYWN0YWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnV0dG9uLmNsaWNrRXZlbnRzID0gW107XG5cbiAgICAgICAgICAgICAgICB2YXIgaGFuZGxlciA9IG5ldyBjYy5Db21wb25lbnQuRXZlbnRIYW5kbGVyKCk7XG4gICAgICAgICAgICAgICAgaGFuZGxlci50YXJnZXQgPSB0aGlzLm5vZGU7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5jb21wb25lbnQgPSBcImxvZ2luU2NlbmVcIjtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmhhbmRsZXIgPSBcIl9vblVzZXJBZ3JlZW1lbnRMaW5rQ2xpY2tcIjtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmN1c3RvbUV2ZW50RGF0YSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgYnV0dG9uLmNsaWNrRXZlbnRzLnB1c2goaGFuZGxlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX29uV3hMb2dpbkNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT0g5b6u5L+h55m75b2V5oyJ6ZKu6KKr54K55Ye7ID09PVwiKTtcbiAgICAgICAgdGhpcy5fZG9XeExvZ2luKCk7XG4gICAgfSxcblxuICAgIF9vblBob25lTG9naW5DbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiPT09IOaJi+acuueZu+W9leaMiemSruiiq+eCueWHuyA9PT1cIik7XG4gICAgICAgIHRoaXMuX2RvUGhvbmVMb2dpbigpO1xuICAgIH0sXG5cbiAgICBfb25Vc2VyQWdyZWVtZW50TGlua0NsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fc2hvd1VzZXJBZ3JlZW1lbnRQb3B1cCgpO1xuICAgIH0sXG5cbiAgICBfY2hlY2tBZ3JlZW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNBZ3JlZW1lbnRDaGVja2VkO1xuICAgIH0sXG5cbiAgICAvLyDwn5qA44CQ5oCn6IO95LyY5YyW44CR6aKE5Yqg6L295Zy65pmvXG4gICAgX3ByZWxvYWRTY2VuZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBcbiAgICAgICAgLy8g6aKE5Yqg6L295aSn5Y6F5Zy65pmvXG4gICAgICAgIGNjLmRpcmVjdG9yLnByZWxvYWRTY2VuZShcImhhbGxTY2VuZVwiLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+agCBb6aKE5Yqg6L29XSDlpKfljoXlnLrmma/pooTliqDovb3lpLHotKU6XCIsIGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOmihOWKoOi9vea4uOaIj+WcuuaZr1xuICAgICAgICBjYy5kaXJlY3Rvci5wcmVsb2FkU2NlbmUoXCJnYW1lU2NlbmVcIiwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfmoAgW+mihOWKoOi9vV0g5ri45oiP5Zy65pmv6aKE5Yqg6L295aSx6LSlOlwiLCBlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF93YWl0Rm9yTXlnbG9iYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBhdHRlbXB0cyA9IDA7XG5cbiAgICAgICAgdmFyIGNoZWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhdHRlbXB0cysrO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cubXlnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5faW5pdEFuZFN0YXJ0KCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGF0dGVtcHRzIDwgMjApIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrLCAxMDApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zaG93RXJyb3IoXCLliqDovb3lpLHotKXvvIzor7fliLfmlrDpobXpnaLph43or5VcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHNldFRpbWVvdXQoY2hlY2ssIDEwMCk7XG4gICAgfSxcblxuICAgIF9pbml0QW5kU3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWw7XG5cbiAgICAgICAgaWYgKCFteWdsb2JhbC5zb2NrZXQgJiYgIW15Z2xvYmFsLmluaXQoKSkge1xuICAgICAgICAgICAgdGhpcy5fc2hvd0Vycm9yKFwi5Yid5aeL5YyW5aSx6LSl77yM6K+35Yi35paw6aG16Z2i6YeN6K+VXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm5pyJ5L+d5a2Y55qE6YeN6L+e5L+h5oGv77yI5Yi35paw6aG16Z2i5ZCO5oGi5aSN77yJXG4gICAgICAgIGlmIChteWdsb2JhbC5zb2NrZXQgJiYgbXlnbG9iYWwuc29ja2V0LmxvYWRSZWNvbm5lY3RJbmZvKSB7XG4gICAgICAgICAgICB2YXIgcmVjb25uZWN0SW5mbyA9IG15Z2xvYmFsLnNvY2tldC5sb2FkUmVjb25uZWN0SW5mbygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChyZWNvbm5lY3RJbmZvLnRva2VuICYmIHJlY29ubmVjdEluZm8ucGxheWVySWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zaG93TG9hZGluZyh0cnVlLCBcIuato+WcqOaBouWkjeeZu+W9leeKtuaAgS4uLlwiKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOWIneWni+WMliBXZWJTb2NrZXQg6L+e5o6lXG4gICAgICAgICAgICAgICAgaWYgKG15Z2xvYmFsLnNvY2tldC5pbml0U29ja2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnNvY2tldC5pbml0U29ja2V0KClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g55uR5ZCs5oi/6Ze05oGi5aSN5LqL5Lu2XG4gICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uUm9vbVJlc3RvcmVkKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd0xvYWRpbmcoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDmgaLlpI3njqnlrrbmlbDmja5cbiAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YS5wbGF5ZXJJZCA9IGRhdGEucGxheWVyX2lkXG4gICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEubmlja05hbWUgPSBkYXRhLnBsYXllcl9uYW1lXG4gICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEuc2F2ZVRvTG9jYWwoKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g6Lez6L2s5Yiw5ri45oiP5Zy65pmvXG4gICAgICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZShcImdhbWVTY2VuZVwiKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g55uR5ZCs5pmu6YCa6L+e5o6l5oiQ5Yqf77yI5LiN5Zyo5oi/6Ze05Lit77yJXG4gICAgICAgICAgICAgICAgdmFyIGV2dCA9IHdpbmRvdy5ldmVudExpc3RlciA/IHdpbmRvdy5ldmVudExpc3Rlcih7fSkgOiBudWxsXG4gICAgICAgICAgICAgICAgaWYgKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBldnQub24oXCJjb25uZWN0aW9uX3N1Y2Nlc3NcIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd0xvYWRpbmcoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLnBsYXllcklkID0gZGF0YS5wbGF5ZXJfaWRcbiAgICAgICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEubmlja05hbWUgPSBkYXRhLnBsYXllcl9uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLmdvYmFsX2NvdW50ID0gZGF0YS5nb2xkIHx8IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEuc2F2ZVRvTG9jYWwoKVxuICAgICAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwiaGFsbFNjZW5lXCIpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Yid5aeL5YyW6IOM5pmv6Z+z5LmQIC0g5aSE55CG5rWP6KeI5Zmo6Ieq5Yqo5pKt5pS+562W55WlXG4gICAgICAgIHRoaXMuX2luaXRCYWNrZ3JvdW5kTXVzaWMoKTtcblxuICAgICAgICBpZiAobXlnbG9iYWwuc29ja2V0ICYmIG15Z2xvYmFsLnNvY2tldC5pbml0U29ja2V0KSB7XG4gICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQuaW5pdFNvY2tldCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOWIneWni+WMluiDjOaZr+mfs+S5kCAtIOWkhOeQhua1j+iniOWZqOiHquWKqOaSreaUvuetlueVpVxuICAgIF9pbml0QmFja2dyb3VuZE11c2ljOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgLy8g6Z+z5pWI5byA5YWz5qOA5p+lXG4gICAgICAgIHZhciBpc29wZW5fc291bmQgPSAodHlwZW9mIHdpbmRvdy5pc29wZW5fc291bmQgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdy5pc29wZW5fc291bmQgOiAxO1xuICAgICAgICBpZiAoIWlzb3Blbl9zb3VuZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDliJ3lp4vljJbnirbmgIFcbiAgICAgICAgdGhpcy5fbXVzaWNQbGF5aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3RvdWNoTGlzdGVuZXJBZGRlZCA9IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgLy8g5L2/55SoIGNjLnJlc291cmNlcy5sb2FkIOWKoOi9vemfs+mikVxuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcInNvdW5kL2xvZ2luX2JnXCIsIGNjLkF1ZGlvQ2xpcCwgZnVuY3Rpb24oZXJyLCBjbGlwKSB7XG4gICAgICAgICAgICBpZiAoIWNjLmlzVmFsaWQoc2VsZi5ub2RlKSkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHNlbGYuX3NldHVwR2xvYmFsVG91Y2hGb3JNdXNpYygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5L+d5a2Y6Z+z6aKR5Ymq6L6RXG4gICAgICAgICAgICBzZWxmLl9iZ011c2ljQ2xpcCA9IGNsaXA7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8g5L2/55SoIHBsYXlNdXNpYyDmkq3mlL7og4zmma/pn7PkuZDvvIjnu5/kuIDnmoTog4zmma/pn7PkuZDnrqHnkIbvvIlcbiAgICAgICAgICAgICAgICBjYy5hdWRpb0VuZ2luZS5wbGF5TXVzaWMoY2xpcCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgc2VsZi5fbXVzaWNQbGF5aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvLyDmiJDlip/mkq3mlL7vvIznoa7kv53nm5HlkKzlmajooqvnp7vpmaRcbiAgICAgICAgICAgICAgICBzZWxmLl9yZW1vdmVHbG9iYWxUb3VjaEZvck11c2ljKCk7XG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zZXR1cEdsb2JhbFRvdWNoRm9yTXVzaWMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBcbiAgICAvLyDpgJrov4fop6bmkbjmkq3mlL7pn7PkuZBcbiAgICBfcGxheU11c2ljT25Ub3VjaDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIC8vIOmmluWFiOajgOafpeaYr+WQpuacieato+WcqOaSreaUvueahOmfs+S5kFxuICAgICAgICBpZiAoY2MuYXVkaW9FbmdpbmUuaXNNdXNpY1BsYXlpbmcoKSkge1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlR2xvYmFsVG91Y2hGb3JNdXNpYygpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlpoLmnpzlt7Lnu4/mnInpn7PpopHliarovpHvvIznm7TmjqXmkq3mlL5cbiAgICAgICAgaWYgKHRoaXMuX2JnTXVzaWNDbGlwKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNjLmF1ZGlvRW5naW5lLnBsYXlNdXNpYyh0aGlzLl9iZ011c2ljQ2xpcCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbXVzaWNQbGF5aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVHbG9iYWxUb3VjaEZvck11c2ljKCk7XG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5rKh5pyJ6Z+z6aKR5Ymq6L6R77yM6ZyA6KaB5Yqg6L29XG4gICAgICAgIGNjLnJlc291cmNlcy5sb2FkKFwic291bmQvbG9naW5fYmdcIiwgY2MuQXVkaW9DbGlwLCBmdW5jdGlvbihlcnIsIGNsaXApIHtcbiAgICAgICAgICAgIGlmICghY2MuaXNWYWxpZChzZWxmLm5vZGUpKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZWxmLl9iZ011c2ljQ2xpcCA9IGNsaXA7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2MuYXVkaW9FbmdpbmUucGxheU11c2ljKGNsaXAsIHRydWUpO1xuICAgICAgICAgICAgICAgIHNlbGYuX211c2ljUGxheWluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2VsZi5fcmVtb3ZlR2xvYmFsVG91Y2hGb3JNdXNpYygpO1xuICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgXG4gICAgLy8g6K6+572u5YWo5bGA6Kem5pG455uR5ZCsIC0g55So5oi354K55Ye75Lu75oSP5L2N572u6Kem5Y+R6Z+z5LmQXG4gICAgX3NldHVwR2xvYmFsVG91Y2hGb3JNdXNpYzogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOmYsuatoumHjeWkjea3u+WKoOebkeWQrOWZqFxuICAgICAgICBpZiAodGhpcy5fdG91Y2hMaXN0ZW5lckFkZGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5fdG91Y2hMaXN0ZW5lckFkZGVkID0gdHJ1ZTtcbiAgICAgICAgXG4gICAgICAgIC8vIENvY29zIENyZWF0b3Ig5bGC6Z2i55qE55uR5ZCsXG4gICAgICAgIHRoaXMuX2NvY29zVG91Y2hIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLl9wbGF5TXVzaWNPblRvdWNoKCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMubm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9TVEFSVCwgdGhpcy5fY29jb3NUb3VjaEhhbmRsZXIsIHRoaXMpO1xuICAgICAgICBcbiAgICAgICAgLy8gV2ViIOa1j+iniOWZqOWxgumdoueahOebkeWQrFxuICAgICAgICBpZiAoY2Muc3lzLmlzQnJvd3Nlcikge1xuICAgICAgICAgICAgdGhpcy5fYnJvd3NlclRvdWNoSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3BsYXlNdXNpY09uVG91Y2goKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9icm93c2VyVG91Y2hIYW5kbGVyLCB0cnVlKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX2Jyb3dzZXJUb3VjaEhhbmRsZXIsIHRydWUpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9icm93c2VyVG91Y2hIYW5kbGVyLCB0cnVlKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyDnp7vpmaTlhajlsYDop6bmkbjnm5HlkKxcbiAgICBfcmVtb3ZlR2xvYmFsVG91Y2hGb3JNdXNpYzogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOenu+mZpCBDb2NvcyBDcmVhdG9yIOWxgumdoueahOebkeWQrFxuICAgICAgICBpZiAodGhpcy5fY29jb3NUb3VjaEhhbmRsZXIpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZS5vZmYoY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfU1RBUlQsIHRoaXMuX2NvY29zVG91Y2hIYW5kbGVyLCB0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuX2NvY29zVG91Y2hIYW5kbGVyID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g56e76Zmk5rWP6KeI5Zmo5bGC6Z2i55qE55uR5ZCsXG4gICAgICAgIGlmIChjYy5zeXMuaXNCcm93c2VyICYmIHRoaXMuX2Jyb3dzZXJUb3VjaEhhbmRsZXIpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9icm93c2VyVG91Y2hIYW5kbGVyLCB0cnVlKTtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX2Jyb3dzZXJUb3VjaEhhbmRsZXIsIHRydWUpO1xuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9icm93c2VyVG91Y2hIYW5kbGVyLCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuX2Jyb3dzZXJUb3VjaEhhbmRsZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl90b3VjaExpc3RlbmVyQWRkZWQgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgX3Nob3dFcnJvcjogZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICB0aGlzLl9zaG93V2FpdE5vZGUobWVzc2FnZSk7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5faGlkZVdhaXROb2RlKCk7XG4gICAgICAgIH0sIDIpO1xuICAgIH0sXG5cbiAgICBfc2hvd0xvYWRpbmc6IGZ1bmN0aW9uKHNob3csIG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKHNob3cpIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dXYWl0Tm9kZShtZXNzYWdlIHx8IFwi5q2j5Zyo5aSE55CGLi4uXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5faGlkZVdhaXROb2RlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3Nob3dXYWl0Tm9kZTogZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICBpZiAodGhpcy53YWl0X25vZGUpIHtcbiAgICAgICAgICAgIHRoaXMud2FpdF9ub2RlLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICBpZiAodGhpcy5fd2FpdExhYmVsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2FpdExhYmVsLnN0cmluZyA9IG1lc3NhZ2UgfHwgXCLmraPlnKjlpITnkIYuLi5cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLl9sb2FkaW5nSW1hZ2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pc0FuaW1hdGluZyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2hpZGVXYWl0Tm9kZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLndhaXRfbm9kZSkge1xuICAgICAgICAgICAgdGhpcy53YWl0X25vZGUuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl9pc0FuaW1hdGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOe7mOWItuWchuinkuefqeW9oui+k+WFpeahhuiDjOaZr++8iOi+heWKqeaWueazle+8iVxuICAgIC8vIOazqOaEj++8mkNvY29zIENyZWF0b3IgR3JhcGhpY3Mg57uE5Lu25rKh5pyJIGFyY1RvIOaWueazle+8jOS9v+eUqCByb3VuZFJlY3Qg5Luj5pu/XG4gICAgX2RyYXdJbnB1dEJnOiBmdW5jdGlvbihncmFwaGljcywgd2lkdGgsIGhlaWdodCwgcmFkaXVzKSB7XG4gICAgICAgIHZhciB4ID0gLXdpZHRoIC8gMjtcbiAgICAgICAgdmFyIHkgPSAtaGVpZ2h0IC8gMjtcbiAgICAgICAgLy8g5L2/55SoIENvY29zIENyZWF0b3IgR3JhcGhpY3Mg55qEIHJvdW5kUmVjdCDmlrnms5VcbiAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KHgsIHksIHdpZHRoLCBoZWlnaHQsIHJhZGl1cyk7XG4gICAgfSxcblxuICAgIHVwZGF0ZTogZnVuY3Rpb24oZHQpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzQW5pbWF0aW5nICYmIHRoaXMuX2xvYWRpbmdJbWFnZSkge1xuICAgICAgICAgICAgLy8g5L2/55SoIGFuZ2xlIOabv+S7o+W3suW6n+W8g+eahCByb3RhdGlvbiDlsZ7mgKdcbiAgICAgICAgICAgIHRoaXMuX2xvYWRpbmdJbWFnZS5hbmdsZSArPSBkdCAqIDQ1O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9kb1d4TG9naW46IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCF0aGlzLl9jaGVja0FncmVlbWVudCgpKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93RXJyb3IoXCLor7flhYjlkIzmhI/nlKjmiLfljY/orq5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWw7XG4gICAgICAgIGlmICghbXlnbG9iYWwgfHwgIW15Z2xvYmFsLnNvY2tldCkge1xuICAgICAgICAgICAgdGhpcy5fc2hvd0Vycm9yKFwi572R57uc5pyq6L+e5o6l77yM6K+356iN5ZCO6YeN6K+VXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc2hvd0xvYWRpbmcodHJ1ZSwgXCLmraPlnKjnmbvlvZUuLi5cIik7XG5cbiAgICAgICAgbXlnbG9iYWwuc29ja2V0LnJlcXVlc3Rfd3hMb2dpbih7XG4gICAgICAgICAgICB1bmlxdWVJRDogbXlnbG9iYWwucGxheWVyRGF0YS51bmlxdWVJRCxcbiAgICAgICAgICAgIGFjY291bnRJRDogbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SUQsXG4gICAgICAgICAgICBuaWNrTmFtZTogbXlnbG9iYWwucGxheWVyRGF0YS5uaWNrTmFtZSxcbiAgICAgICAgICAgIGF2YXRhclVybDogbXlnbG9iYWwucGxheWVyRGF0YS5hdmF0YXJVcmwsXG4gICAgICAgIH0sIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG4gICAgICAgICAgICBzZWxmLl9zaG93TG9hZGluZyhmYWxzZSk7XG5cbiAgICAgICAgICAgIGlmIChlcnIgIT0gMCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dFcnJvcihcIueZu+W9leWksei0pe+8jOivt+mHjeivlVwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEuZ29iYWxfY291bnQgPSByZXN1bHQuZ29sZGNvdW50IHx8IDA7XG4gICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIik7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfZG9QaG9uZUxvZ2luOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCI+Pj4gX2RvUGhvbmVMb2dpbiDooqvosIPnlKhcIik7XG5cbiAgICAgICAgLy8g8J+UpyDkv67lpI3vvJrpmLLmraLph43lpI3ngrnlh7vlr7zoh7TlpJrkuKrlvLnnqpdcbiAgICAgICAgaWYgKHRoaXMuX3Bob25lTG9naW5Qb3B1cFNob3dpbmcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOeZu+W9leW8ueeql+ato+WcqOaYvuekuuS4re+8jOW/veeVpemHjeWkjeiwg+eUqFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5fY2hlY2tBZ3JlZW1lbnQoKSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4g55So5oi35pyq5ZCM5oSP5Y2P6K6uXCIpO1xuICAgICAgICAgICAgdGhpcy5fc2hvd0Vycm9yKFwi6K+35YWI5ZCM5oSP55So5oi35Y2P6K6uXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6K6+572u5qCH5b+X5L2N77yM6Ziy5q2i6YeN5aSN5by556qXXG4gICAgICAgIHRoaXMuX3Bob25lTG9naW5Qb3B1cFNob3dpbmcgPSB0cnVlO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOWHhuWkh+aYvuekuuaJi+acuueZu+W9leW8ueeql1wiKTtcbiAgICAgICAgdGhpcy5fc2hvd1Bob25lTG9naW5Qb3B1cCgpO1xuICAgIH0sXG5cbiAgICBfc2hvd1Bob25lTG9naW5Qb3B1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IF9zaG93UGhvbmVMb2dpblBvcHVwIOiiq+iwg+eUqFwiKTtcbiAgICAgICAgY29uc29sZS5sb2coXCI+Pj4gcGhvbmVfbG9naW5fcHJlZmFiOlwiLCB0aGlzLnBob25lX2xvZ2luX3ByZWZhYiA/IFwi5a2Y5ZyoXCIgOiBcIuS4jeWtmOWcqFwiKTtcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLnBob25lX2xvZ2luX3ByZWZhYikge1xuICAgICAgICAgICAgdGhpcy5fY3JlYXRlUGhvbmVMb2dpblBvcHVwKHRoaXMucGhvbmVfbG9naW5fcHJlZmFiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOWKqOaAgeWKoOi9vSBwcmVmYWJzL3Bob25lX2xvZ2luXCIpO1xuICAgICAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoXCJwcmVmYWJzL3Bob25lX2xvZ2luXCIsIGNjLlByZWZhYiwgZnVuY3Rpb24oZXJyLCBwcmVmYWIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNjLmlzVmFsaWQoc2VsZi5ub2RlKSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuWKoOi9vSBwaG9uZV9sb2dpbiBwcmVmYWIg5aSx6LSlOlwiLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93RXJyb3IoXCLml6Dms5XmmL7npLrnmbvlvZXlvLnnqpdcIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4gcGhvbmVfbG9naW4gcHJlZmFiIOWKoOi9veaIkOWKn1wiKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9jcmVhdGVQaG9uZUxvZ2luUG9wdXAocHJlZmFiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9jcmVhdGVQaG9uZUxvZ2luUG9wdXA6IGZ1bmN0aW9uKHByZWZhYikge1xuICAgICAgICBjb25zb2xlLmxvZyhcIj4+PiBfY3JlYXRlUGhvbmVMb2dpblBvcHVwIOiiq+iwg+eUqFwiKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWKqOaAgeWIm+W7uuW8ueeql++8iOS9v+eUqOato+ehrueahOiDjOaZr+WbvuWSjOWwuuWvuO+8iVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4g5byA5aeL5Yqo5oCB5Yib5bu655m75b2V5by556qXXCIpO1xuICAgICAgICAgICAgdmFyIHBvcHVwID0gdGhpcy5fY3JlYXRlUGhvbmVMb2dpbkR5bmFtaWMoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOeZu+W9leW8ueeql+WIm+W7uuWujOaIkDpcIiwgcG9wdXAgPyBwb3B1cC5uYW1lIDogXCJudWxsXCIpO1xuICAgICAgICAgICAgdGhpcy5fcGhvbmVMb2dpblBvcHVwID0gcG9wdXA7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLliJvlu7rmiYvmnLrnmbvlvZXlvLnnqpflpLHotKU6XCIsIGUpO1xuICAgICAgICAgICAgdGhpcy5fc2hvd0Vycm9yKFwi5peg5rOV5pi+56S655m75b2V5by556qXOiBcIiArIGUubWVzc2FnZSk7XG4gICAgICAgICAgICAvLyDwn5SnIOS/ruWkje+8muWIm+W7uuWksei0peaXtumHjee9ruagh+W/l+S9je+8jOWFgeiuuOS4i+asoeeCueWHu+mHjeivlVxuICAgICAgICAgICAgdGhpcy5fcGhvbmVMb2dpblBvcHVwU2hvd2luZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOWKqOaAgeWIm+W7uuaJi+acuueZu+W9leW8ueeqlyAtIOS9v+eUqOato+ehrueahOiDjOaZr+WbvuWSjOWwuuWvuFxuICAgIF9jcmVhdGVQaG9uZUxvZ2luRHluYW1pYzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDlvLnnqpflsLrlr7jvvIjlm7rlrprlsLrlr7jvvIzkuI7lm77niYfljLnphY3vvIk9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyDkvb/nlKjlm7rlrprlsLrlr7jvvJrlrr3luqY1MjBweO+8jOmrmOW6pjY4MHB477yI5LiObG9naW5fYmcucG5n5Zu+54mH5bC65a+45LiA6Ie077yJXG4gICAgICAgIC8vIOWcqOWwj+Wxj+W5leS4iuiHquWKqOe8qeaUvlxuICAgICAgICB2YXIgd2luVyA9IGNjLndpblNpemUud2lkdGg7XG4gICAgICAgIHZhciB3aW5IID0gY2Mud2luU2l6ZS5oZWlnaHQ7XG5cbiAgICAgICAgLy8g5Zu+54mH5Y6f5aeL5bC65a+4IC0g6LCD5a695by556qXXG4gICAgICAgIHZhciBpbWdXaWR0aCA9IDU4MDsgIC8vIOWOn+adpeaYrzUyMO+8jOWinuWKoOWIsDU4MFxuICAgICAgICB2YXIgaW1nSGVpZ2h0ID0gNjgwO1xuXG4gICAgICAgIC8vIOWmguaenOWxj+W5leWkquWwj++8jOaMieavlOS+i+e8qeWwj1xuICAgICAgICB2YXIgc2NhbGUgPSAxLjA7XG4gICAgICAgIGlmICh3aW5XIDwgaW1nV2lkdGggKyA0MCkge1xuICAgICAgICAgICAgc2NhbGUgPSAod2luVyAtIDQwKSAvIGltZ1dpZHRoO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYW5lbFdpZHRoID0gaW1nV2lkdGggKiBzY2FsZTtcbiAgICAgICAgdmFyIHBhbmVsSGVpZ2h0ID0gaW1nSGVpZ2h0ICogc2NhbGU7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCLnmbvlvZXlvLnnqpflsLrlr7g6IFwiICsgcGFuZWxXaWR0aCArIFwiIHggXCIgKyBwYW5lbEhlaWdodCArIFwiLCDnvKnmlL7mr5Tkvos6IFwiICsgc2NhbGUpO1xuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOW8ueeql+agueiKgueCuSA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgcG9wdXAgPSBuZXcgY2MuTm9kZShcIkxvZ2luRGlhbG9nXCIpO1xuICAgICAgICBwb3B1cC5wYXJlbnQgPSB0aGlzLm5vZGU7XG4gICAgICAgIHBvcHVwLnNldENvbnRlbnRTaXplKGNjLnNpemUod2luVywgd2luSCkpO1xuICAgICAgICBwb3B1cC5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgcG9wdXAuekluZGV4ID0gMTAwMDtcblxuICAgICAgICAvLyDmt7vliqAgQmxvY2tJbnB1dEV2ZW50cyDnu4Tku7bpmLvmraLlupXlsYLngrnlh7tcbiAgICAgICAgcG9wdXAuYWRkQ29tcG9uZW50KGNjLkJsb2NrSW5wdXRFdmVudHMpO1xuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOWNiumAj+aYjuiDjOaZr+mBrue9qSA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgbWFzayA9IG5ldyBjYy5Ob2RlKFwiTWFza1wiKTtcbiAgICAgICAgbWFzay5wYXJlbnQgPSBwb3B1cDtcbiAgICAgICAgbWFzay5zZXRDb250ZW50U2l6ZShjYy5zaXplKHdpblcsIHdpbkgpKTtcbiAgICAgICAgbWFzay5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgdmFyIG1hc2tTcHJpdGUgPSBtYXNrLmFkZENvbXBvbmVudChjYy5TcHJpdGUpO1xuICAgICAgICBtYXNrU3ByaXRlLnNpemVNb2RlID0gY2MuU3ByaXRlLlNpemVNb2RlLkNVU1RPTTtcbiAgICAgICAgbWFzay5jb2xvciA9IG5ldyBjYy5Db2xvcigwLCAwLCAwKTtcbiAgICAgICAgbWFzay5vcGFjaXR5ID0gMTUwO1xuXG4gICAgICAgIC8vIPCflKcg5L+u5aSN77ya54K55Ye76YGu572p5bGC5YWz6Zet5by556qXXG4gICAgICAgIG1hc2sub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOeCueWHu+mBrue9qeWxguWFs+mXreW8ueeql1wiKTtcbiAgICAgICAgICAgIC8vIOmHjee9ruagh+W/l+S9jVxuICAgICAgICAgICAgc2VsZi5fcGhvbmVMb2dpblBvcHVwU2hvd2luZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAvLyDmuIXnkIbljp/nlJ8gSFRNTCBpbnB1dCDlhYPntKBcbiAgICAgICAgICAgIGlmIChjYy5zeXMuaXNCcm93c2VyKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXRpdmUtaW5wdXQtY29udGFpbmVyJyk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXIucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5YWz6Zet5Yqo55S7XG4gICAgICAgICAgICBjYy50d2VlbihwYW5lbClcbiAgICAgICAgICAgICAgICAudG8oMC4xNSwgeyBzY2FsZTogMC44LCBvcGFjaXR5OiAwIH0sIHsgZWFzaW5nOiAnYmFja0luJyB9KVxuICAgICAgICAgICAgICAgIC5jYWxsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2MuaXNWYWxpZChwb3B1cCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnN0YXJ0KCk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOW8ueeql+mdouadvyA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgcGFuZWwgPSBuZXcgY2MuTm9kZShcIlBhbmVsXCIpO1xuICAgICAgICBwYW5lbC5wYXJlbnQgPSBwb3B1cDtcbiAgICAgICAgcGFuZWwuc2V0Q29udGVudFNpemUoY2Muc2l6ZShwYW5lbFdpZHRoLCBwYW5lbEhlaWdodCkpO1xuICAgICAgICBwYW5lbC5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgcGFuZWwuc2NhbGUgPSAwLjc7XG4gICAgICAgIHBhbmVsLm9wYWNpdHkgPSAwO1xuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOW8ueeql+iDjOaZr++8iOS9v+eUqOato+ehrueahCBsb2dpbl9iZyDlm77niYfvvIk9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgYmcgPSBuZXcgY2MuTm9kZShcIkJnXCIpO1xuICAgICAgICBiZy5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgLy8g5YWI6K6+572u5LiA5Liq5Li05pe25bC65a+4XG4gICAgICAgIGJnLnNldENvbnRlbnRTaXplKGNjLnNpemUocGFuZWxXaWR0aCwgcGFuZWxIZWlnaHQpKTtcbiAgICAgICAgYmcuc2V0UG9zaXRpb24oMCwgMCk7XG4gICAgICAgIGJnLnpJbmRleCA9IDA7ICAvLyDog4zmma/lnKjmnIDlupXlsYJcblxuICAgICAgICAvLyDlhYjmt7vliqBTcHJpdGXnu4Tku7blubborr7nva5zaXplTW9kZVxuICAgICAgICB2YXIgYmdTcHJpdGUgPSBiZy5hZGRDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgYmdTcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NOyAgLy8g5L2/55So6Ieq5a6a5LmJ5bC65a+477yM5LiN6Lef6ZqP5Zu+54mHXG4gICAgICAgIGJnU3ByaXRlLnNyY0JsZW5kRmFjdG9yID0gY2MubWFjcm8uQmxlbmRGYWN0b3IuU1JDX0FMUEhBO1xuICAgICAgICBiZ1Nwcml0ZS5kc3RCbGVuZEZhY3RvciA9IGNjLm1hY3JvLkJsZW5kRmFjdG9yLk9ORV9NSU5VU19TUkNfQUxQSEE7XG5cbiAgICAgICAgLy8g5Yqg6L296IOM5pmv5Zu+77yI5L2/55SoIFVJL2xvZ2luL2xvZ2luX2JnLnBuZ++8iVxuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcIlVJL2xvZ2luL2xvZ2luX2JnXCIsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoIWNjLmlzVmFsaWQoYmcpKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi5Yqg6L29IGxvZ2luX2JnIOWksei0pe+8jOS9v+eUqOm7mOiupOiDjOaZrzpcIiwgZXJyKTtcbiAgICAgICAgICAgICAgICAvLyDpmY3nuqfvvJrkvb/nlKjmuJDlj5jog4zmma9cbiAgICAgICAgICAgICAgICBiZy5yZW1vdmVDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgICAgICAgICB2YXIgYmdHZnggPSBiZy5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICAgICAgICAgIGJnR2Z4LmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig0NSwgMzUsIDI1KTtcbiAgICAgICAgICAgICAgICBiZ0dmeC5yb3VuZFJlY3QoLXBhbmVsV2lkdGgvMiwgLXBhbmVsSGVpZ2h0LzIsIHBhbmVsV2lkdGgsIHBhbmVsSGVpZ2h0LCAyMCk7XG4gICAgICAgICAgICAgICAgYmdHZnguZmlsbCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g6K6+572uc3ByaXRlRnJhbWVcbiAgICAgICAgICAgIGJnU3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWU7XG5cbiAgICAgICAgICAgIC8vIOWFs+mUru+8muWGjeasoeehruS/neWwuuWvuOato+ehru+8iOmYsuatouiiq+WbvueJh+WwuuWvuOimhueblu+8iVxuICAgICAgICAgICAgYmcuc2V0Q29udGVudFNpemUoY2Muc2l6ZShwYW5lbFdpZHRoLCBwYW5lbEhlaWdodCkpO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuiDjOaZr+WbvuWKoOi9veaIkOWKn++8jOaYvuekuuWwuuWvuDogXCIgKyBiZy53aWR0aCArIFwiIHggXCIgKyBiZy5oZWlnaHQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDmoIfpopjmloflrZfvvIjmrKLkuZDnmbvlvZXvvIk9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyDph5HoibLmj4/ovrnvvIznmb3oibLkuLvkvZPvvIzlsYXkuK3vvIzpobbpg6jot53ovrk0MHB4XG4gICAgICAgIHZhciB0aXRsZU5vZGUgPSBuZXcgY2MuTm9kZShcIlRpdGxlXCIpO1xuICAgICAgICB0aXRsZU5vZGUucGFyZW50ID0gcGFuZWw7XG4gICAgICAgIHRpdGxlTm9kZS5zZXRQb3NpdGlvbigwLCBwYW5lbEhlaWdodC8yIC0gNjApO1xuICAgICAgICBcbiAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgdGl0bGVMYWJlbC5zdHJpbmcgPSBcIuasouS5kOeZu+W9lVwiO1xuICAgICAgICB0aXRsZUxhYmVsLmZvbnRTaXplID0gMzY7XG4gICAgICAgIHRpdGxlTGFiZWwubGluZUhlaWdodCA9IDQ0O1xuICAgICAgICB0aXRsZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIHRpdGxlTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOmHkeiJsuaPj+i+uVxuICAgICAgICB2YXIgdGl0bGVPdXRsaW5lID0gdGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpO1xuICAgICAgICB0aXRsZU91dGxpbmUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjE4LCAxNjUsIDMyKTsgLy8g6YeR6ImyXG4gICAgICAgIHRpdGxlT3V0bGluZS53aWR0aCA9IDM7XG5cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5YWz6Zet5oyJ6ZKu77yI5Y+z5LiK6KeS5ZyG5b2i77yM57qi6YeR6Imy77yMNDZ4NDbvvIk9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgY2xvc2VCdG4gPSBuZXcgY2MuTm9kZShcIkJ0bkNsb3NlXCIpO1xuICAgICAgICBjbG9zZUJ0bi5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgY2xvc2VCdG4uc2V0Q29udGVudFNpemUoY2Muc2l6ZSg0NiwgNDYpKTtcbiAgICAgICAgY2xvc2VCdG4uc2V0UG9zaXRpb24ocGFuZWxXaWR0aC8yIC0gMzUsIHBhbmVsSGVpZ2h0LzIgLSAzNSk7XG4gICAgICAgIFxuICAgICAgICAvLyDnuqLph5HoibLlnIblvaLog4zmma9cbiAgICAgICAgdmFyIGNsb3NlR2Z4ID0gY2xvc2VCdG4uYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgY2xvc2VHZnguZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDIwMCwgNjAsIDYwKTsgLy8g57qi6ImyXG4gICAgICAgIGNsb3NlR2Z4LmNpcmNsZSgwLCAwLCAyMyk7XG4gICAgICAgIGNsb3NlR2Z4LmZpbGwoKTtcbiAgICAgICAgY2xvc2VHZnguc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjE4LCAxNjUsIDMyKTsgLy8g6YeR6Imy6L655qGGXG4gICAgICAgIGNsb3NlR2Z4LmxpbmVXaWR0aCA9IDI7XG4gICAgICAgIGNsb3NlR2Z4LmNpcmNsZSgwLCAwLCAyMik7XG4gICAgICAgIGNsb3NlR2Z4LnN0cm9rZSgpO1xuICAgICAgICBcbiAgICAgICAgLy8gWCDnrKblj7dcbiAgICAgICAgdmFyIGNsb3NlWCA9IG5ldyBjYy5Ob2RlKFwiWFwiKTtcbiAgICAgICAgY2xvc2VYLnBhcmVudCA9IGNsb3NlQnRuO1xuICAgICAgICB2YXIgY2xvc2VYTGFiZWwgPSBjbG9zZVguYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgY2xvc2VYTGFiZWwuc3RyaW5nID0gXCLDl1wiO1xuICAgICAgICBjbG9zZVhMYWJlbC5mb250U2l6ZSA9IDI4O1xuICAgICAgICBjbG9zZVhMYWJlbC5saW5lSGVpZ2h0ID0gMzI7XG4gICAgICAgIGNsb3NlWExhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIGNsb3NlWC5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KTtcblxuICAgICAgICBjbG9zZUJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4g54K55Ye75YWz6Zet5oyJ6ZKuXCIpO1xuICAgICAgICAgICAgLy8g8J+UpyDkv67lpI3vvJrph43nva7lvLnnqpfmmL7npLrmoIflv5fkvY1cbiAgICAgICAgICAgIHNlbGYuX3Bob25lTG9naW5Qb3B1cFNob3dpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOW3sumHjee9riBfcGhvbmVMb2dpblBvcHVwU2hvd2luZyDkuLogZmFsc2VcIik7XG5cbiAgICAgICAgICAgIC8vIOa4heeQhuWOn+eUnyBIVE1MIGlucHV0IOWFg+e0oFxuICAgICAgICAgICAgaWYgKGNjLnN5cy5pc0Jyb3dzZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdGl2ZS1pbnB1dC1jb250YWluZXInKTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDlhbPpl63liqjnlLtcbiAgICAgICAgICAgIGNjLnR3ZWVuKHBhbmVsKVxuICAgICAgICAgICAgICAgIC50bygwLjE1LCB7IHNjYWxlOiAwLjgsIG9wYWNpdHk6IDAgfSwgeyBlYXNpbmc6ICdiYWNrSW4nIH0pXG4gICAgICAgICAgICAgICAgLmNhbGwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYy5pc1ZhbGlkKHBvcHVwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXAuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3RhcnQoKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g6KGo5Y2V5biD5bGA5Y+C5pWwID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIOagueaNruiDjOaZr+WbvmxvZ2luX2JnLnBuZyg1MjB4NjgwKeeahOeyvuehrumihOeVmeS9jee9ruiuvue9ruWFg+e0oFxuICAgICAgICAvLyDkvb/nlKjpobnnm67njrDmnInnmoRVSei1hOa6kO+8mlxuICAgICAgICAvLyAgIGljb25fcGhvbmUucG5nIC0g5omL5py65Zu+5qCHXG4gICAgICAgIC8vICAgaWNvbl9zaGllbGQucG5nIC0g6aqM6K+B56CB5Zu+5qCHXG4gICAgICAgIC8vICAgZ2V0X21vYmlsZV9jb2RlLnBuZyAtIOiOt+WPlumqjOivgeeggeaMiemSrlxuXG4gICAgICAgIC8vIOiuoeeul+e8qeaUvuavlOS+i++8iOWwj+Wxj+W5lemAgumFje+8iVxuICAgICAgICB2YXIgc2NhbGVSYXRpbyA9IHBhbmVsV2lkdGggLyA1MjA7XG5cbiAgICAgICAgLy8g6L6T5YWl5qGG5bC65a+4XG4gICAgICAgIHZhciBpbnB1dFdpZHRoID0gMjIwICogc2NhbGVSYXRpbzsgICAvLyDovpPlhaXmoYblrr3luqZcbiAgICAgICAgdmFyIGlucHV0SGVpZ2h0ID0gNDUgKiBzY2FsZVJhdGlvOyAgIC8vIOi+k+WFpeahhumrmOW6pu+8iOWHj+Wwj++8iVxuICAgICAgICB2YXIgaWNvblNpemUgPSAyNSAqIHNjYWxlUmF0aW87ICAgICAgLy8g5Zu+5qCH5aSn5bCPXG4gICAgICAgIHZhciBmb3JtWTEgPSAxMzAgKiBzY2FsZVJhdGlvOyAgICAgICAgLy8g56ys5LiA5Liq6L6T5YWl5qGGWeWdkOagh++8iOWQkeS4i+enu+WKqO+8iVxuICAgICAgICB2YXIgZm9ybVkyID0gNTAgKiBzY2FsZVJhdGlvOyAgICAgICAvLyDnrKzkuozkuKrovpPlhaXmoYZZ5Z2Q5qCHXG4gICAgICAgIHZhciBnZXRDb2RlQnRuV2lkdGggPSA5MCAqIHNjYWxlUmF0aW87ICAvLyDojrflj5bpqozor4HnoIHmjInpkq7lrr3luqZcbiAgICAgICAgdmFyIGJ0bkhlaWdodCA9IDQ1ICogc2NhbGVSYXRpbzsgICAgIC8vIOe7n+S4gOaMiemSrumrmOW6plxuXG4gICAgICAgIGNvbnNvbGUubG9nKFwi5biD5bGA5Y+C5pWwOiBzY2FsZVJhdGlvPVwiICsgc2NhbGVSYXRpby50b0ZpeGVkKDIpKTtcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDmiYvmnLrlj7fovpPlhaXooYwgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgLy8g5biD5bGA77yaW+Wbvuagh10gW+i+k+WFpeahhl0g5pW05L2T5bGF5LitXG4gICAgICAgIHZhciBwaG9uZVJvd1dpZHRoID0gaWNvblNpemUgKyAxNSArIGlucHV0V2lkdGg7ICAvLyDmgLvlrr3luqZcbiAgICAgICAgdmFyIHBob25lUm93WCA9IDA7ICAvLyDmlbTkvZPlsYXkuK1cblxuICAgICAgICAvLyDmiYvmnLrlm77moIcgLSDmlL7lnKjovpPlhaXmoYblt6bovrlcbiAgICAgICAgdmFyIHBob25lSWNvbk5vZGUgPSBuZXcgY2MuTm9kZShcIlBob25lSWNvblwiKTtcbiAgICAgICAgcGhvbmVJY29uTm9kZS5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgcGhvbmVJY29uTm9kZS5zZXRQb3NpdGlvbigtcGhvbmVSb3dXaWR0aC8yICsgaWNvblNpemUvMiArIDEwLCBmb3JtWTEpO1xuICAgICAgICBwaG9uZUljb25Ob2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoaWNvblNpemUsIGljb25TaXplKSk7XG5cbiAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoXCJVSS9sb2dpbi9pY29uX3Bob25lXCIsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoZXJyIHx8ICFjYy5pc1ZhbGlkKHBob25lSWNvbk5vZGUpKSByZXR1cm47XG4gICAgICAgICAgICB2YXIgaWNvblNwcml0ZSA9IHBob25lSWNvbk5vZGUuYWRkQ29tcG9uZW50KGNjLlNwcml0ZSk7XG4gICAgICAgICAgICBpY29uU3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWU7XG4gICAgICAgICAgICBpY29uU3ByaXRlLnNpemVNb2RlID0gY2MuU3ByaXRlLlNpemVNb2RlLkNVU1RPTTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5omL5py65Y+36L6T5YWl5qGGID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIGxvZ2luX2JnLnBuZyDkuK3lt7LljIXlkKvovpPlhaXmoYbog4zmma/vvIzlj6rpnIDmlL7nva7pgI/mmI7nmoQgRWRpdEJveFxuICAgICAgICAvLyDms6jmhI/vvJrnlLHkuo4gcGFuZWwg5pyJ57yp5pS+5Yqo55S777yMRWRpdEJveCDpnIDopoHlnKjliqjnlLvlrozmiJDlkI7liJvlu7rvvIzlkKbliJnngrnlh7vljLrln5/kvY3nva7kuI3lr7lcbiAgICAgICAgdmFyIHBob25lSW5wdXROb2RlID0gbmV3IGNjLk5vZGUoXCJQaG9uZUlucHV0XCIpO1xuICAgICAgICBwaG9uZUlucHV0Tm9kZS5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgcGhvbmVJbnB1dE5vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZShpbnB1dFdpZHRoLCBpbnB1dEhlaWdodCkpO1xuICAgICAgICBwaG9uZUlucHV0Tm9kZS5zZXRQb3NpdGlvbigtcGhvbmVSb3dXaWR0aC8yICsgaWNvblNpemUgKyAxNSArIGlucHV0V2lkdGgvMiwgZm9ybVkxKTtcbiAgICAgICAgcGhvbmVJbnB1dE5vZGUuekluZGV4ID0gMTAwO1xuXG4gICAgICAgIHZhciBwaG9uZUVkaXRCb3ggPSBudWxsOyAgLy8g5bu26L+f5Yib5bu6XG5cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g6aqM6K+B56CB6L6T5YWl6KGMID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIOW4g+WxgO+8mlvlm77moIddIFvovpPlhaXmoYZdIFvojrflj5bpqozor4HnoIHmjInpkq5dIOaVtOS9k+WxheS4rVxuICAgICAgICB2YXIgY29kZUlucHV0VyA9IGlucHV0V2lkdGggLSBnZXRDb2RlQnRuV2lkdGggLSAxMDsgIC8vIOmqjOivgeeggei+k+WFpeahhuWuveW6plxuICAgICAgICB2YXIgY29kZVJvd1dpZHRoID0gaWNvblNpemUgKyA1ICsgY29kZUlucHV0VyArIDUgKyBnZXRDb2RlQnRuV2lkdGg7ICAvLyDmgLvlrr3luqZcblxuICAgICAgICAvLyDpqozor4HnoIHlm77moIdcbiAgICAgICAgdmFyIGNvZGVJY29uTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ29kZUljb25cIik7XG4gICAgICAgIGNvZGVJY29uTm9kZS5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgY29kZUljb25Ob2RlLnNldFBvc2l0aW9uKC1jb2RlUm93V2lkdGgvMiArIGljb25TaXplLzIgKyAxMCwgZm9ybVkyKTtcbiAgICAgICAgY29kZUljb25Ob2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoaWNvblNpemUsIGljb25TaXplKSk7XG5cbiAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoXCJVSS9sb2dpbi9pY29uX3NoaWVsZFwiLCBjYy5TcHJpdGVGcmFtZSwgZnVuY3Rpb24oZXJyLCBzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgaWYgKGVyciB8fCAhY2MuaXNWYWxpZChjb2RlSWNvbk5vZGUpKSByZXR1cm47XG4gICAgICAgICAgICB2YXIgaWNvblNwcml0ZSA9IGNvZGVJY29uTm9kZS5hZGRDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgICAgIGljb25TcHJpdGUuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZTtcbiAgICAgICAgICAgIGljb25TcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDpqozor4HnoIHovpPlhaXmoYYgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgLy8gbG9naW5fYmcucG5nIOS4reW3suWMheWQq+i+k+WFpeahhuiDjOaZr++8jOWPqumcgOaUvue9rumAj+aYjueahCBFZGl0Qm94XG4gICAgICAgIC8vIOazqOaEj++8mueUseS6jiBwYW5lbCDmnInnvKnmlL7liqjnlLvvvIxFZGl0Qm94IOmcgOimgeWcqOWKqOeUu+WujOaIkOWQjuWIm+W7uu+8jOWQpuWImeeCueWHu+WMuuWfn+S9jee9ruS4jeWvuVxuICAgICAgICB2YXIgY29kZUlucHV0Tm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ29kZUlucHV0XCIpO1xuICAgICAgICBjb2RlSW5wdXROb2RlLnBhcmVudCA9IHBhbmVsO1xuICAgICAgICBjb2RlSW5wdXROb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoY29kZUlucHV0VywgaW5wdXRIZWlnaHQpKTtcbiAgICAgICAgY29kZUlucHV0Tm9kZS5zZXRQb3NpdGlvbigtY29kZVJvd1dpZHRoLzIgKyBpY29uU2l6ZSArIDUgKyBjb2RlSW5wdXRXLzIsIGZvcm1ZMik7XG4gICAgICAgIGNvZGVJbnB1dE5vZGUuekluZGV4ID0gMTAwO1xuXG4gICAgICAgIHZhciBjb2RlRWRpdEJveCA9IG51bGw7ICAvLyDlu7bov5/liJvlu7pcblxuICAgICAgICAvLyDojrflj5bpqozor4HnoIHmjInpkq5cbiAgICAgICAgdmFyIGdldENvZGVCdG4gPSBuZXcgY2MuTm9kZShcIkJ0bkdldENvZGVcIik7XG4gICAgICAgIGdldENvZGVCdG4ucGFyZW50ID0gcGFuZWw7XG4gICAgICAgIGdldENvZGVCdG4uc2V0Q29udGVudFNpemUoY2Muc2l6ZShnZXRDb2RlQnRuV2lkdGgsIGJ0bkhlaWdodCkpO1xuICAgICAgICBnZXRDb2RlQnRuLnNldFBvc2l0aW9uKGNvZGVSb3dXaWR0aC8yIC0gZ2V0Q29kZUJ0bldpZHRoLzIsIGZvcm1ZMik7XG5cbiAgICAgICAgdmFyIGdldENvZGVCdG5Db21wID0gZ2V0Q29kZUJ0bi5hZGRDb21wb25lbnQoY2MuQnV0dG9uKTtcbiAgICAgICAgZ2V0Q29kZUJ0bkNvbXAudHJhbnNpdGlvbiA9IGNjLkJ1dHRvbi5UcmFuc2l0aW9uLlNDQUxFO1xuICAgICAgICBnZXRDb2RlQnRuQ29tcC56b29tU2NhbGUgPSAwLjk1O1xuXG4gICAgICAgIGNjLnJlc291cmNlcy5sb2FkKFwiVUkvbG9naW4vZ2V0X21vYmlsZV9jb2RlXCIsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoIWNjLmlzVmFsaWQoZ2V0Q29kZUJ0bikpIHJldHVybjtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLliqDovb3ojrflj5bpqozor4HnoIHmjInpkq7lm77niYflpLHotKU6XCIsIGVycik7XG4gICAgICAgICAgICAgICAgLy8g6ZmN57qn77ya5L2/55So57qv6Imy5oyJ6ZKuXG4gICAgICAgICAgICAgICAgdmFyIGJ0bkdmeCA9IGdldENvZGVCdG4uYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgICAgICAgICBidG5HZnguZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMTY1LCAwKTtcbiAgICAgICAgICAgICAgICBidG5HZngucm91bmRSZWN0KC1nZXRDb2RlQnRuV2lkdGgvMiwgLWlucHV0SGVpZ2h0LzIsIGdldENvZGVCdG5XaWR0aCwgaW5wdXRIZWlnaHQsIDUpO1xuICAgICAgICAgICAgICAgIGJ0bkdmeC5maWxsKCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgYnRuTGFiZWwgPSBuZXcgY2MuTm9kZShcIkxhYmVsXCIpO1xuICAgICAgICAgICAgICAgIGJ0bkxhYmVsLnBhcmVudCA9IGdldENvZGVCdG47XG4gICAgICAgICAgICAgICAgdmFyIGxhYmVsQ29tcCA9IGJ0bkxhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgICAgICAgICAgbGFiZWxDb21wLnN0cmluZyA9IFwi6I635Y+W6aqM6K+B56CBXCI7XG4gICAgICAgICAgICAgICAgbGFiZWxDb21wLmZvbnRTaXplID0gMTIgKiBzY2FsZVJhdGlvO1xuICAgICAgICAgICAgICAgIGxhYmVsQ29tcC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICAgICAgICAgIGJ0bkxhYmVsLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBidG5TcHJpdGUgPSBnZXRDb2RlQnRuLmFkZENvbXBvbmVudChjYy5TcHJpdGUpO1xuICAgICAgICAgICAgYnRuU3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWU7XG4gICAgICAgICAgICBidG5TcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NO1xuICAgICAgICAgICAgZ2V0Q29kZUJ0bi5zZXRDb250ZW50U2l6ZShjYy5zaXplKGdldENvZGVCdG5XaWR0aCwgYnRuSGVpZ2h0KSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOWAkuiuoeaXtueKtuaAgVxuICAgICAgICB2YXIgY291bnRkb3duID0gMDtcbiAgICAgICAgdmFyIGNvdW50ZG93bkxhYmVsID0gbnVsbDtcblxuICAgICAgICAvLyDlvIDlp4vlgJLorqHml7ZcbiAgICAgICAgdmFyIHN0YXJ0Q291bnRkb3duID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb3VudGRvd24gPSA2MDtcbiAgICAgICAgICAgIGdldENvZGVCdG5Db21wLmludGVyYWN0YWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgZ2V0Q29kZUJ0bi5vcGFjaXR5ID0gMTUwO1xuXG4gICAgICAgICAgICB2YXIgdGljayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGNvdW50ZG93bi0tO1xuICAgICAgICAgICAgICAgIGlmIChjb3VudGRvd24gPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICBnZXRDb2RlQnRuQ29tcC5pbnRlcmFjdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBnZXRDb2RlQnRuLm9wYWNpdHkgPSAyNTU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb3VudGRvd25MYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRkb3duTGFiZWwuc3RyaW5nID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY291bnRkb3duTGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ZG93bkxhYmVsID0gbmV3IGNjLk5vZGUoXCJDb3VudGRvd25cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudGRvd25MYWJlbC5wYXJlbnQgPSBnZXRDb2RlQnRuO1xuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRkb3duTGFiZWwuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFiZWxDb21wID0gY291bnRkb3duTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsQ29tcC5mb250U2l6ZSA9IDE0ICogc2NhbGVSYXRpbztcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsQ29tcC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvdW50ZG93bkxhYmVsLmdldENvbXBvbmVudChjYy5MYWJlbCkuc3RyaW5nID0gY291bnRkb3duICsgXCJzXCI7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKHRpY2ssIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBzZWxmLnNjaGVkdWxlT25jZSh0aWNrLCAxKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDmiYvmnLrnmbvlvZXmjInpkq4gPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgLy8gYnRuX21vYmlsZV9sb2dpbi5wbmcg5Y6f5aeL5bC65a+4OiAzNDAgeCA1MO+8jOWuvemrmOavlCA2Ljg6MVxuICAgICAgICB2YXIgbG9naW5CdG5ZID0gZm9ybVkyIC0gNzAgKiBzY2FsZVJhdGlvO1xuICAgICAgICB2YXIgbG9naW5CdG5IZWlnaHQgPSA1MCAqIHNjYWxlUmF0aW87ICAvLyDmjInpkq7pq5jluqZcbiAgICAgICAgdmFyIGxvZ2luQnRuV2lkdGggPSBsb2dpbkJ0bkhlaWdodCAqIDYuODsgIC8vIOaMieWbvueJh+WOn+Wni+avlOS+i+iuoeeul+WuveW6piAoMzQwLzUwPTYuOClcblxuICAgICAgICB2YXIgbG9naW5CdG4gPSBuZXcgY2MuTm9kZShcIkJ0bkxvZ2luXCIpO1xuICAgICAgICBsb2dpbkJ0bi5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgbG9naW5CdG4uc2V0Q29udGVudFNpemUoY2Muc2l6ZShsb2dpbkJ0bldpZHRoLCBsb2dpbkJ0bkhlaWdodCkpO1xuICAgICAgICBsb2dpbkJ0bi5zZXRQb3NpdGlvbigwLCBsb2dpbkJ0blkpO1xuXG4gICAgICAgIC8vIOWwneivleWKoOi9veaMiemSruWbvueJh1xuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcIlVJL2xvZ2luL2J0bl9tb2JpbGVfbG9naW5cIiwgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVyciwgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgIGlmICghY2MuaXNWYWxpZChsb2dpbkJ0bikpIHJldHVybjtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAvLyDpmY3nuqfvvJrkvb/nlKjnuq/oibLmjInpkq5cbiAgICAgICAgICAgICAgICB2YXIgbG9naW5HZnggPSBsb2dpbkJ0bi5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICAgICAgICAgIGxvZ2luR2Z4LmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDE0MCwgMCk7XG4gICAgICAgICAgICAgICAgbG9naW5HZngucm91bmRSZWN0KC1sb2dpbkJ0bldpZHRoLzIsIC1sb2dpbkJ0bkhlaWdodC8yLCBsb2dpbkJ0bldpZHRoLCBsb2dpbkJ0bkhlaWdodCwgOCAqIHNjYWxlUmF0aW8pO1xuICAgICAgICAgICAgICAgIGxvZ2luR2Z4LmZpbGwoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbG9naW5TcHJpdGUgPSBsb2dpbkJ0bi5hZGRDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgICAgIGxvZ2luU3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWU7XG4gICAgICAgICAgICBsb2dpblNwcml0ZS5zaXplTW9kZSA9IGNjLlNwcml0ZS5TaXplTW9kZS5DVVNUT007XG4gICAgICAgICAgICBsb2dpbkJ0bi5zZXRDb250ZW50U2l6ZShjYy5zaXplKGxvZ2luQnRuV2lkdGgsIGxvZ2luQnRuSGVpZ2h0KSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBsb2dpbkJ0bkNvbXAgPSBsb2dpbkJ0bi5hZGRDb21wb25lbnQoY2MuQnV0dG9uKTtcbiAgICAgICAgbG9naW5CdG5Db21wLnRyYW5zaXRpb24gPSBjYy5CdXR0b24uVHJhbnNpdGlvbi5TQ0FMRTtcbiAgICAgICAgbG9naW5CdG5Db21wLnpvb21TY2FsZSA9IDAuOTU7XG5cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5b6u5L+h55m75b2V5oyJ6ZKuID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIGljb25fd2VjaGF0LnBuZyDljp/lp4vlsLrlr7g6IDQ4IHggNDjvvIjmraPmlrnlvaLvvIlcbiAgICAgICAgdmFyIHd4QnRuWSA9IGxvZ2luQnRuWSAtIDE1NSAqIHNjYWxlUmF0aW87ICAvLyDlvoDkuIvnp7vliqjmm7TlpJpcbiAgICAgICAgdmFyIHd4QnRuU2l6ZSA9IDQ4ICogc2NhbGVSYXRpbzsgIC8vIOS9v+eUqOWbvueJh+WOn+Wni+WwuuWvuCA0OFxuXG4gICAgICAgIHZhciB3eEJ0biA9IG5ldyBjYy5Ob2RlKFwiQnRuV2VjaGF0XCIpO1xuICAgICAgICB3eEJ0bi5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgd3hCdG4uc2V0Q29udGVudFNpemUoY2Muc2l6ZSh3eEJ0blNpemUsIHd4QnRuU2l6ZSkpO1xuICAgICAgICB3eEJ0bi5zZXRQb3NpdGlvbigwLCB3eEJ0blkpO1xuXG4gICAgICAgIC8vIOWwneivleWKoOi9veW+ruS/oeWbvuagh1xuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcIlVJL2xvZ2luL2ljb25fd2VjaGF0XCIsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoIWNjLmlzVmFsaWQod3hCdG4pKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgLy8g6ZmN57qn77ya5L2/55So57u/6Imy5ZyG5b2i6IOM5pmvXG4gICAgICAgICAgICAgICAgdmFyIHd4QmdHZnggPSB3eEJ0bi5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICAgICAgICAgIHd4QmdHZnguZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDcsIDE5MywgOTYpO1xuICAgICAgICAgICAgICAgIHd4QmdHZnguY2lyY2xlKDAsIDAsIHd4QnRuU2l6ZS8yKTtcbiAgICAgICAgICAgICAgICB3eEJnR2Z4LmZpbGwoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgd3hTcHJpdGUgPSB3eEJ0bi5hZGRDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgICAgIHd4U3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWU7XG4gICAgICAgICAgICB3eFNwcml0ZS5zaXplTW9kZSA9IGNjLlNwcml0ZS5TaXplTW9kZS5DVVNUT007XG4gICAgICAgICAgICB3eEJ0bi5zZXRDb250ZW50U2l6ZShjYy5zaXplKHd4QnRuU2l6ZSwgd3hCdG5TaXplKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciB3eEJ0bkNvbXAgPSB3eEJ0bi5hZGRDb21wb25lbnQoY2MuQnV0dG9uKTtcbiAgICAgICAgd3hCdG5Db21wLnRyYW5zaXRpb24gPSBjYy5CdXR0b24uVHJhbnNpdGlvbi5TQ0FMRTtcbiAgICAgICAgd3hCdG5Db21wLnpvb21TY2FsZSA9IDAuOTU7XG5cbiAgICAgICAgLy8g5b6u5L+h55m75b2V5paH5a2XIC0g6ZqQ6JePXG4gICAgICAgIC8vIHZhciB3eExhYmVsID0gbmV3IGNjLk5vZGUoXCJMYWJlbFdlY2hhdFwiKTtcbiAgICAgICAgLy8gd3hMYWJlbC5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgLy8gd3hMYWJlbC5zZXRQb3NpdGlvbigwLCB3eEJ0blkgLSAzNSAqIHNjYWxlUmF0aW8pO1xuICAgICAgICAvLyB2YXIgd3hMYWJlbENvbXAgPSB3eExhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIC8vIHd4TGFiZWxDb21wLnN0cmluZyA9IFwi5b6u5L+h55m75b2VXCI7XG4gICAgICAgIC8vIHd4TGFiZWxDb21wLmZvbnRTaXplID0gMTIgKiBzY2FsZVJhdGlvO1xuICAgICAgICAvLyB3eExhYmVsQ29tcC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICAvLyB3eExhYmVsLmNvbG9yID0gbmV3IGNjLkNvbG9yKDEwMCwgODAsIDYwKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIuaMiemSruS9jee9rjogbG9naW5CdG5ZPVwiICsgbG9naW5CdG5ZLnRvRml4ZWQoMCkgKyBcIiwgd3hCdG5ZPVwiICsgd3hCdG5ZLnRvRml4ZWQoMCkpO1xuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOa2iOaBr+aPkOekuu+8iOmakOiXj++8iT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBtZXNzYWdlTGFiZWwgPSBuZXcgY2MuTm9kZShcIk1lc3NhZ2VMYWJlbFwiKTtcbiAgICAgICAgbWVzc2FnZUxhYmVsLnBhcmVudCA9IHBhbmVsO1xuICAgICAgICBtZXNzYWdlTGFiZWwuc2V0UG9zaXRpb24oMCwgLXBhbmVsSGVpZ2h0LzIgKyA1MCk7XG4gICAgICAgIHZhciBtZXNzYWdlTGFiZWxDb21wID0gbWVzc2FnZUxhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIG1lc3NhZ2VMYWJlbENvbXAuc3RyaW5nID0gXCJcIjtcbiAgICAgICAgbWVzc2FnZUxhYmVsQ29tcC5mb250U2l6ZSA9IDE0O1xuICAgICAgICBtZXNzYWdlTGFiZWxDb21wLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIG1lc3NhZ2VMYWJlbC5hY3RpdmUgPSBmYWxzZTtcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDlvLnnqpfov5vlhaXliqjnlLsgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgY2MudHdlZW4ocGFuZWwpXG4gICAgICAgICAgICAudG8oMC4yNSwgeyBzY2FsZTogMSwgb3BhY2l0eTogMjU1IH0sIHsgZWFzaW5nOiAnYmFja091dCcgfSlcbiAgICAgICAgICAgIC5jYWxsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIFdlYiDlubPlj7DvvJrnm7TmjqXliJvlu7rljp/nlJ8gSFRNTCBpbnB1dCDlhYPntKBcbiAgICAgICAgICAgICAgICBpZiAoY2Muc3lzLmlzQnJvd3Nlcikge1xuICAgICAgICAgICAgICAgICAgICBfY3JlYXRlTmF0aXZlSW5wdXRFbGVtZW50cyhwYW5lbCwgcGhvbmVJbnB1dE5vZGUsIGNvZGVJbnB1dE5vZGUsIGlucHV0V2lkdGgsIGlucHV0SGVpZ2h0LCBjb2RlSW5wdXRXLCBwYW5lbFdpZHRoLCBwYW5lbEhlaWdodCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g6Z2eIFdlYiDlubPlj7DvvJrkvb/nlKggQ29jb3MgRWRpdEJveFxuICAgICAgICAgICAgICAgICAgICBwaG9uZUVkaXRCb3ggPSBwaG9uZUlucHV0Tm9kZS5hZGRDb21wb25lbnQoY2MuRWRpdEJveCk7XG4gICAgICAgICAgICAgICAgICAgIHBob25lRWRpdEJveC5wbGFjZWhvbGRlciA9IFwi6K+36L6T5YWl5omL5py65Y+3XCI7XG4gICAgICAgICAgICAgICAgICAgIHBob25lRWRpdEJveC5mb250U2l6ZSA9IDE4O1xuICAgICAgICAgICAgICAgICAgICBwaG9uZUVkaXRCb3gucGxhY2Vob2xkZXJGb250U2l6ZSA9IDE0O1xuICAgICAgICAgICAgICAgICAgICBwaG9uZUVkaXRCb3guZm9udENvbG9yID0gbmV3IGNjLkNvbG9yKDUwLCA1MCwgNTAsIDI1NSk7XG4gICAgICAgICAgICAgICAgICAgIHBob25lRWRpdEJveC5wbGFjZWhvbGRlckZvbnRDb2xvciA9IG5ldyBjYy5Db2xvcigxNTAsIDE1MCwgMTUwLCAyNTUpO1xuICAgICAgICAgICAgICAgICAgICBwaG9uZUVkaXRCb3guaW5wdXRGbGFnID0gY2MuRWRpdEJveC5JbnB1dEZsYWcuU0VOU0lUSVZFO1xuICAgICAgICAgICAgICAgICAgICBwaG9uZUVkaXRCb3guaW5wdXRNb2RlID0gY2MuRWRpdEJveC5JbnB1dE1vZGUuTlVNRVJJQztcbiAgICAgICAgICAgICAgICAgICAgcGhvbmVFZGl0Qm94Lm1heExlbmd0aCA9IDExO1xuICAgICAgICAgICAgICAgICAgICBwaG9uZUVkaXRCb3guYmFja2dyb3VuZENvbG9yID0gbmV3IGNjLkNvbG9yKDAsIDAsIDAsIDApO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY29kZUVkaXRCb3ggPSBjb2RlSW5wdXROb2RlLmFkZENvbXBvbmVudChjYy5FZGl0Qm94KTtcbiAgICAgICAgICAgICAgICAgICAgY29kZUVkaXRCb3gucGxhY2Vob2xkZXIgPSBcIumqjOivgeeggVwiO1xuICAgICAgICAgICAgICAgICAgICBjb2RlRWRpdEJveC5mb250U2l6ZSA9IDE4O1xuICAgICAgICAgICAgICAgICAgICBjb2RlRWRpdEJveC5wbGFjZWhvbGRlckZvbnRTaXplID0gMTQ7XG4gICAgICAgICAgICAgICAgICAgIGNvZGVFZGl0Qm94LmZvbnRDb2xvciA9IG5ldyBjYy5Db2xvcig1MCwgNTAsIDUwLCAyNTUpO1xuICAgICAgICAgICAgICAgICAgICBjb2RlRWRpdEJveC5wbGFjZWhvbGRlckZvbnRDb2xvciA9IG5ldyBjYy5Db2xvcigxNTAsIDE1MCwgMTUwLCAyNTUpO1xuICAgICAgICAgICAgICAgICAgICBjb2RlRWRpdEJveC5pbnB1dEZsYWcgPSBjYy5FZGl0Qm94LklucHV0RmxhZy5TRU5TSVRJVkU7XG4gICAgICAgICAgICAgICAgICAgIGNvZGVFZGl0Qm94LmlucHV0TW9kZSA9IGNjLkVkaXRCb3guSW5wdXRNb2RlLk5VTUVSSUM7XG4gICAgICAgICAgICAgICAgICAgIGNvZGVFZGl0Qm94Lm1heExlbmd0aCA9IDY7XG4gICAgICAgICAgICAgICAgICAgIGNvZGVFZGl0Qm94LmJhY2tncm91bmRDb2xvciA9IG5ldyBjYy5Db2xvcigwLCAwLCAwLCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLovpPlhaXmoYbliJvlu7rlrozmiJBcIik7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0YXJ0KCk7XG5cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5Yqf6IO96YC76L6RID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBwaG9uZSA9IFwiXCI7XG4gICAgICAgIHZhciBjb2RlID0gXCJcIjtcblxuICAgICAgICAvLyDojrflj5bovpPlhaXlgLznmoTovoXliqnlh73mlbDvvIjmlK/mjIHljp/nlJ8gSFRNTCBpbnB1dO+8iVxuICAgICAgICB2YXIgZ2V0SW5wdXRWYWx1ZSA9IGZ1bmN0aW9uKGlucHV0SWQpIHtcbiAgICAgICAgICAgIGlmIChjYy5zeXMuaXNCcm93c2VyKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaW5wdXRJZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlucHV0ID8gaW5wdXQudmFsdWUgOiBcIlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8g6aqM6K+B5omL5py65Y+3XG4gICAgICAgIHZhciB2YWxpZGF0ZVBob25lID0gZnVuY3Rpb24ocGhvbmUpIHtcbiAgICAgICAgICAgIGlmICghcGhvbmUgfHwgcGhvbmUubGVuZ3RoICE9PSAxMSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIC9eMVszLTldXFxkezl9JC8udGVzdChwaG9uZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8g5pi+56S65raI5oGvXG4gICAgICAgIHZhciBzaG93TWVzc2FnZSA9IGZ1bmN0aW9uKG1zZywgaXNFcnJvcikge1xuICAgICAgICAgICAgbWVzc2FnZUxhYmVsLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICBtZXNzYWdlTGFiZWxDb21wLnN0cmluZyA9IG1zZztcbiAgICAgICAgICAgIG1lc3NhZ2VMYWJlbC5jb2xvciA9IGlzRXJyb3IgPyBuZXcgY2MuQ29sb3IoMjU1LCA4MCwgODApIDogbmV3IGNjLkNvbG9yKDEwMCwgMjAwLCAxMDApO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIOiOt+WPlumqjOivgeeggSAtIG9uR2V0Q29kZSgpXG4gICAgICAgIGdldENvZGVCdG4ub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIOaUr+aMgeWOn+eUnyBIVE1MIGlucHV0IOaIliBDb2NvcyBFZGl0Qm94XG4gICAgICAgICAgICBpZiAoY2Muc3lzLmlzQnJvd3Nlcikge1xuICAgICAgICAgICAgICAgIHBob25lID0gZ2V0SW5wdXRWYWx1ZSgnbmF0aXZlLXBob25lLWlucHV0Jyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHBob25lRWRpdEJveCkge1xuICAgICAgICAgICAgICAgIHBob25lID0gcGhvbmVFZGl0Qm94LnN0cmluZyB8fCBcIlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIXZhbGlkYXRlUGhvbmUocGhvbmUpKSB7XG4gICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoXCLor7fovpPlhaXmraPnoa7nmoTmiYvmnLrlj7dcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZGVmaW5lcyA9IHdpbmRvdy5kZWZpbmVzO1xuICAgICAgICAgICAgaWYgKCFkZWZpbmVzIHx8ICFkZWZpbmVzLmFwaVVybCkge1xuICAgICAgICAgICAgICAgIHNob3dNZXNzYWdlKFwi6aqM6K+B56CB5bey5Y+R6YCBKOa1i+ivlSlcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHN0YXJ0Q291bnRkb3duKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDkvb/nlKjliqDlr4bor7fmsYLlj5HpgIHpqozor4HnoIFcbiAgICAgICAgICAgIHZhciBIdHRwQVBJID0gd2luZG93Lkh0dHBBUEk7XG4gICAgICAgICAgICBpZiAoSHR0cEFQSSAmJiBkZWZpbmVzLmNyeXB0b0tleSkge1xuICAgICAgICAgICAgICAgIEh0dHBBUEkucG9zdEVuY3J5cHRlZChcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lcy5hcGlVcmwgKyAnL2FwaS92MS9hdXRoL3NlbmQtY29kZScsXG4gICAgICAgICAgICAgICAgICAgICdzZW5kX2NvZGUnLFxuICAgICAgICAgICAgICAgICAgICB7IHBob25lOiBwaG9uZSB9LFxuICAgICAgICAgICAgICAgICAgICBkZWZpbmVzLmNyeXB0b0tleSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oZXJyLCByZXNwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoZXJyIHx8IFwi5Y+R6YCB5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwICYmIHJlc3AuY29kZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3dNZXNzYWdlKFwi6aqM6K+B56CB5bey5Y+R6YCBXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydENvdW50ZG93bigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93TWVzc2FnZShyZXNwLm1lc3NhZ2UgfHwgXCLlj5HpgIHlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDpmY3nuqfvvJrkvb/nlKjmmI7mlofor7fmsYJcbiAgICAgICAgICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICAgICAgeGhyLm9wZW4oJ1BPU1QnLCBkZWZpbmVzLmFwaVVybCArICcvYXBpL3YxL2F1dGgvc2VuZC1jb2RlJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgICAgeGhyLnRpbWVvdXQgPSAxMDAwMDtcbiAgICAgICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwLmNvZGUgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3dNZXNzYWdlKFwi6aqM6K+B56CB5bey5Y+R6YCBXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0Q291bnRkb3duKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93TWVzc2FnZShyZXNwLm1lc3NhZ2UgfHwgXCLlj5HpgIHlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoXCLop6PmnpDlk43lupTlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93TWVzc2FnZShcIue9kee7nOivt+axguWksei0pVwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgeGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBwaG9uZTogcGhvbmUgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyDmiYvmnLrnmbvlvZUgLSBvblBob25lTG9naW4oKVxuICAgICAgICBsb2dpbkJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8g5pSv5oyB5Y6f55SfIEhUTUwgaW5wdXQg5oiWIENvY29zIEVkaXRCb3hcbiAgICAgICAgICAgIGlmIChjYy5zeXMuaXNCcm93c2VyKSB7XG4gICAgICAgICAgICAgICAgcGhvbmUgPSBnZXRJbnB1dFZhbHVlKCduYXRpdmUtcGhvbmUtaW5wdXQnKTtcbiAgICAgICAgICAgICAgICBjb2RlID0gZ2V0SW5wdXRWYWx1ZSgnbmF0aXZlLWNvZGUtaW5wdXQnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHBob25lRWRpdEJveCkgcGhvbmUgPSBwaG9uZUVkaXRCb3guc3RyaW5nIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgaWYgKGNvZGVFZGl0Qm94KSBjb2RlID0gY29kZUVkaXRCb3guc3RyaW5nIHx8IFwiXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdmFsaWRhdGVQaG9uZShwaG9uZSkpIHtcbiAgICAgICAgICAgICAgICBzaG93TWVzc2FnZShcIuivt+i+k+WFpeato+ehrueahOaJi+acuuWPt1wiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNob3dNZXNzYWdlKFwi5q2j5Zyo55m75b2VLi4uXCIsIGZhbHNlKTtcblxuICAgICAgICAgICAgdmFyIGRlZmluZXMgPSB3aW5kb3cuZGVmaW5lcztcbiAgICAgICAgICAgIGlmICghZGVmaW5lcyB8fCAhZGVmaW5lcy5hcGlVcmwpIHtcbiAgICAgICAgICAgICAgICAvLyDml6BBUEnphY3nva7vvIzmqKHmi5/nmbvlvZXmiJDlip9cbiAgICAgICAgICAgICAgICBpZiAod2luZG93Lm15Z2xvYmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2dpbkRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1bmlxdWVJRDogXCJwaG9uZV9cIiArIHBob25lLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBcInBob25lX1wiICsgcGhvbmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBuaWNrTmFtZTogXCLnjqnlrrZcIiArIHBob25lLnN1YnN0cigtNCksXG4gICAgICAgICAgICAgICAgICAgICAgICBhdmF0YXJVcmw6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBnb2xkQ291bnQ6IDEwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbjogXCJ0ZXN0X3Rva2VuX1wiICsgRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBob25lOiBwaG9uZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2luVHlwZTogMVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwub25Mb2dpblN1Y2Nlc3MobG9naW5EYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoXCLnmbvlvZXmiJDlip9cIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBfcmVtb3ZlTmF0aXZlSW5wdXRFbGVtZW50cygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2MuaXNWYWxpZChwb3B1cCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIik7XG4gICAgICAgICAgICAgICAgfSwgMC41KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOS9v+eUqOWKoOWvhuivt+axgueZu+W9lVxuICAgICAgICAgICAgdmFyIEh0dHBBUEkgPSB3aW5kb3cuSHR0cEFQSTtcbiAgICAgICAgICAgIGlmIChIdHRwQVBJICYmIGRlZmluZXMuY3J5cHRvS2V5KSB7XG4gICAgICAgICAgICAgICAgSHR0cEFQSS5wb3N0RW5jcnlwdGVkKFxuICAgICAgICAgICAgICAgICAgICBkZWZpbmVzLmFwaVVybCArICcvYXBpL3YxL2F1dGgvcGhvbmUtbG9naW4nLFxuICAgICAgICAgICAgICAgICAgICAncGhvbmVfbG9naW4nLFxuICAgICAgICAgICAgICAgICAgICB7IHBob25lOiBwaG9uZSwgY29kZTogY29kZSB9LFxuICAgICAgICAgICAgICAgICAgICBkZWZpbmVzLmNyeXB0b0tleSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oZXJyLCByZXNwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoZXJyIHx8IFwi55m75b2V5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwICYmIHJlc3AuY29kZSA9PT0gMCAmJiByZXNwLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93TWVzc2FnZShcIueZu+W9leaIkOWKn1wiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5L2/55SoIG15Z2xvYmFsLm9uTG9naW5TdWNjZXNzIOS/neWtmOeZu+W9leeKtuaAgVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cubXlnbG9iYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxvZ2luRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXF1ZUlEOiByZXNwLmRhdGEudW5pcXVlSUQgfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogcmVzcC5kYXRhLmFjY291bnRJRCB8fCBcIlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmlja05hbWU6IHJlc3AuZGF0YS5uaWNrTmFtZSB8fCBcIueOqeWutlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhdGFyVXJsOiByZXNwLmRhdGEuYXZhdGFyVXJsIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2xkQ291bnQ6IHJlc3AuZGF0YS5nb2xkY291bnQgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2VuOiByZXNwLmRhdGEudG9rZW4gfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBob25lOiBwaG9uZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2luVHlwZTogMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwub25Mb2dpblN1Y2Nlc3MobG9naW5EYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9yZW1vdmVOYXRpdmVJbnB1dEVsZW1lbnRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYy5pc1ZhbGlkKHBvcHVwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXAuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZShcImhhbGxTY2VuZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93TWVzc2FnZShyZXNwLm1lc3NhZ2UgfHwgXCLnmbvlvZXlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDpmY3nuqfvvJrkvb/nlKjmmI7mlofor7fmsYJcbiAgICAgICAgICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICAgICAgeGhyLm9wZW4oJ1BPU1QnLCBkZWZpbmVzLmFwaVVybCArICcvYXBpL3YxL2F1dGgvcGhvbmUtbG9naW4nLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignWC1EZXZpY2UtSUQnLCAnd2ViXycgKyBEYXRlLm5vdygpKTtcbiAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignWC1EZXZpY2UtVHlwZScsICdXZWIgQnJvd3NlcicpO1xuICAgICAgICAgICAgICAgIHhoci50aW1lb3V0ID0gMTAwMDA7XG4gICAgICAgICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3AgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcC5jb2RlID09PSAwICYmIHJlc3AuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoXCLnmbvlvZXmiJDlip9cIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5L2/55SoIG15Z2xvYmFsLm9uTG9naW5TdWNjZXNzIOS/neWtmOeZu+W9leeKtuaAgVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5teWdsb2JhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsb2dpbkRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXF1ZUlEOiByZXNwLmRhdGEudW5pcXVlSUQgfHwgcmVzcC5kYXRhLnBsYXllcl9pZCB8fCBcIlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHJlc3AuZGF0YS5hY2NvdW50SUQgfHwgcmVzcC5kYXRhLmFjY291bnRfaWQgfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmlja05hbWU6IHJlc3AuZGF0YS5uaWNrTmFtZSB8fCByZXNwLmRhdGEubmlja25hbWUgfHwgXCLnjqnlrrZcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhdGFyVXJsOiByZXNwLmRhdGEuYXZhdGFyVXJsIHx8IHJlc3AuZGF0YS5hdmF0YXIgfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29sZENvdW50OiByZXNwLmRhdGEuZ29sZGNvdW50IHx8IHJlc3AuZGF0YS5nb2xkIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2VuOiByZXNwLmRhdGEudG9rZW4gfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGhvbmU6IHBob25lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dpblR5cGU6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5vbkxvZ2luU3VjY2Vzcyhsb2dpbkRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3JlbW92ZU5hdGl2ZUlucHV0RWxlbWVudHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2MuaXNWYWxpZChwb3B1cCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXAuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UocmVzcC5tZXNzYWdlIHx8IFwi55m75b2V5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3dNZXNzYWdlKFwi6Kej5p6Q5ZON5bqU5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoXCLnvZHnu5zor7fmsYLlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KHsgcGhvbmU6IHBob25lLCBjb2RlOiBjb2RlIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5b6u5L+h55m75b2VIC0gb25XZWNoYXRMb2dpbigpXG4gICAgICAgIHd4QnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzaG93TWVzc2FnZShcIuato+WcqOeZu+W9lS4uLlwiLCBmYWxzZSk7XG5cbiAgICAgICAgICAgIHZhciBkZWZpbmVzID0gd2luZG93LmRlZmluZXM7XG5cbiAgICAgICAgICAgIGlmICghZGVmaW5lcyB8fCAhZGVmaW5lcy5hcGlVcmwpIHtcbiAgICAgICAgICAgICAgICAvLyDml6BBUEnphY3nva7vvIzmqKHmi5/nmbvlvZXmiJDlip9cbiAgICAgICAgICAgICAgICBpZiAod2luZG93Lm15Z2xvYmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2dpbkRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1bmlxdWVJRDogXCJ3eF9cIiArIERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IFwid3hfXCIgKyBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmlja05hbWU6IFwi5b6u5L+h55So5oi3XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBhdmF0YXJVcmw6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBnb2xkQ291bnQ6IDEwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbjogXCJ0ZXN0X3d4X3Rva2VuX1wiICsgRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2luVHlwZTogMlxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwub25Mb2dpblN1Y2Nlc3MobG9naW5EYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoXCLnmbvlvZXmiJDlip9cIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBfcmVtb3ZlTmF0aXZlSW5wdXRFbGVtZW50cygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2MuaXNWYWxpZChwb3B1cCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIik7XG4gICAgICAgICAgICAgICAgfSwgMC41KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOS9v+eUqOWKoOWvhuivt+axguW+ruS/oeeZu+W9lVxuICAgICAgICAgICAgdmFyIEh0dHBBUEkgPSB3aW5kb3cuSHR0cEFQSTtcbiAgICAgICAgICAgIGlmIChIdHRwQVBJICYmIGRlZmluZXMuY3J5cHRvS2V5KSB7XG4gICAgICAgICAgICAgICAgSHR0cEFQSS5wb3N0RW5jcnlwdGVkKFxuICAgICAgICAgICAgICAgICAgICBkZWZpbmVzLmFwaVVybCArICcvYXBpL3YxL2F1dGgvd3gtbG9naW4nLFxuICAgICAgICAgICAgICAgICAgICAnd3hfbG9naW4nLFxuICAgICAgICAgICAgICAgICAgICB7IGNvZGU6IFwidGVzdF9jb2RlX1wiICsgRGF0ZS5ub3coKSB9LFxuICAgICAgICAgICAgICAgICAgICBkZWZpbmVzLmNyeXB0b0tleSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oZXJyLCByZXNwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoZXJyIHx8IFwi55m75b2V5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwICYmIHJlc3AuY29kZSA9PT0gMCAmJiByZXNwLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93TWVzc2FnZShcIueZu+W9leaIkOWKn1wiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5teWdsb2JhbCAmJiB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS51bmlxdWVJRCA9IHJlc3AuZGF0YS51bmlxdWVJRCB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SUQgPSByZXNwLmRhdGEuYWNjb3VudElEIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLm5pY2tOYW1lID0gcmVzcC5kYXRhLm5pY2tOYW1lIHx8IFwi5b6u5L+h55So5oi3XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnVzZXJOYW1lID0gcmVzcC5kYXRhLnVzZXJuYW1lIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLmF2YXRhciA9IHJlc3AuZGF0YS5hdmF0YXJVcmwgfHwgXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuZ29iYWxfY291bnQgPSByZXNwLmRhdGEuZ29sZENvdW50IHx8IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnRva2VuID0gcmVzcC5kYXRhLnRva2VuIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOS/neWtmOWIsOacrOWcsOWtmOWCqFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5zYXZlVG9Mb2NhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIuOAkOW+ruS/oeeZu+W9leOAkeeUqOaIt+aVsOaNruW3suS/neWtmCwgbmlja05hbWUgPVwiLCB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5uaWNrTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfcmVtb3ZlTmF0aXZlSW5wdXRFbGVtZW50cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2MuaXNWYWxpZChwb3B1cCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMC41KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UocmVzcC5tZXNzYWdlIHx8IFwi55m75b2V5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8g6ZmN57qn77ya5L2/55So5piO5paH6K+35rGCXG4gICAgICAgICAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICAgICAgIHhoci5vcGVuKCdQT1NUJywgZGVmaW5lcy5hcGlVcmwgKyAnL2FwaS92MS9hdXRoL3d4LWxvZ2luJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgICAgeGhyLnRpbWVvdXQgPSAxMDAwMDtcbiAgICAgICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwLmNvZGUgPT09IDAgJiYgcmVzcC5kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93TWVzc2FnZShcIueZu+W9leaIkOWKn1wiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAod2luZG93Lm15Z2xvYmFsICYmIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEudW5pcXVlSUQgPSByZXNwLmRhdGEucGxheWVyX2lkIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEID0gcmVzcC5kYXRhLmFjY291bnRfaWQgfHwgXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5uaWNrTmFtZSA9IHJlc3AuZGF0YS5uaWNrbmFtZSB8fCBcIuW+ruS/oeeUqOaIt1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnVzZXJOYW1lID0gcmVzcC5kYXRhLnVzZXJuYW1lIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYXZhdGFyID0gcmVzcC5kYXRhLmF2YXRhciB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLmdvYmFsX2NvdW50ID0gcmVzcC5kYXRhLmdvbGQgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS50b2tlbiA9IHJlc3AuZGF0YS50b2tlbiB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOS/neWtmOWIsOacrOWcsOWtmOWCqFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnNhdmVUb0xvY2FsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLjgJDlvq7kv6HnmbvlvZVYSFLjgJHnlKjmiLfmlbDmja7lt7Lkv53lrZgsIG5pY2tOYW1lID1cIiwgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEubmlja05hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3JlbW92ZU5hdGl2ZUlucHV0RWxlbWVudHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2MuaXNWYWxpZChwb3B1cCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXAuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UocmVzcC5tZXNzYWdlIHx8IFwi55m75b2V5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3dNZXNzYWdlKFwi6Kej5p6Q5ZON5bqU5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoXCLnvZHnu5zor7fmsYLlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KHsgY29kZTogXCJ0ZXN0X2NvZGVfXCIgKyBEYXRlLm5vdygpIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gcG9wdXA7XG4gICAgfSxcblxuICAgIF9zaG93VXNlckFncmVlbWVudFBvcHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fY3JlYXRlQWdyZWVtZW50UG9wdXAoKTtcbiAgICB9LFxuXG4gICAgLy8g5Yib5bu655So5oi35Y2P6K6u5by556qXXG4gICAgX2NyZWF0ZUFncmVlbWVudFBvcHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5by556qX5qC56IqC54K5ID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBwb3B1cCA9IG5ldyBjYy5Ob2RlKFwidXNlcl9hZ3JlZW1lbnRfcG9wdXBcIik7XG4gICAgICAgIHBvcHVwLnBhcmVudCA9IHRoaXMubm9kZTtcbiAgICAgICAgcG9wdXAuc2V0Q29udGVudFNpemUoY2Muc2l6ZSgxMjgwLCA3MjApKTtcbiAgICAgICAgcG9wdXAuc2V0UG9zaXRpb24oMCwgMCk7XG4gICAgICAgIHBvcHVwLnpJbmRleCA9IDEwMDA7XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDljYrpgI/mmI7pu5HoibLog4zmma/pga7nvakgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdmFyIGJnTWFzayA9IG5ldyBjYy5Ob2RlKFwiYmdfbWFza1wiKTtcbiAgICAgICAgYmdNYXNrLnBhcmVudCA9IHBvcHVwO1xuICAgICAgICBiZ01hc2suc2V0Q29udGVudFNpemUoY2Muc2l6ZSgxMjgwLCA3MjApKTtcbiAgICAgICAgYmdNYXNrLnNldFBvc2l0aW9uKDAsIDApO1xuICAgICAgICB2YXIgYmdNYXNrU3ByaXRlID0gYmdNYXNrLmFkZENvbXBvbmVudChjYy5TcHJpdGUpO1xuICAgICAgICBiZ01hc2tTcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NO1xuICAgICAgICBiZ01hc2suY29sb3IgPSBuZXcgY2MuQ29sb3IoMCwgMCwgMCk7XG4gICAgICAgIGJnTWFzay5vcGFjaXR5ID0gMTgwO1xuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5Li76Z2i5p2/ID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBwYW5lbCA9IG5ldyBjYy5Ob2RlKFwiY29udGVudF9wYW5lbFwiKTtcbiAgICAgICAgcGFuZWwucGFyZW50ID0gcG9wdXA7XG4gICAgICAgIHBhbmVsLnNldENvbnRlbnRTaXplKGNjLnNpemUoOTAwLCA1MjApKTtcbiAgICAgICAgcGFuZWwuc2V0UG9zaXRpb24oMCwgMCk7XG4gICAgICAgIHZhciBwYW5lbFNwcml0ZSA9IHBhbmVsLmFkZENvbXBvbmVudChjYy5TcHJpdGUpO1xuICAgICAgICBwYW5lbFNwcml0ZS5zaXplTW9kZSA9IGNjLlNwcml0ZS5TaXplTW9kZS5DVVNUT007XG4gICAgICAgIHBhbmVsLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjUwLCAyNDApO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yqg6L296IOM5pmv5Zu+54mHXG4gICAgICAgIGNjLnJlc291cmNlcy5sb2FkKFwiaW1hZ2VzL3VzZXJfYWdyZWVtZW50X2JnXCIsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoIWNjLmlzVmFsaWQocGFuZWwpKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIWVyciAmJiBzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgICAgIHBhbmVsU3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOagh+mimCA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgdGl0bGVOb2RlID0gbmV3IGNjLk5vZGUoXCJ0aXRsZV9sYWJlbFwiKTtcbiAgICAgICAgdGl0bGVOb2RlLnBhcmVudCA9IHBhbmVsO1xuICAgICAgICB0aXRsZU5vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZSgzMDAsIDYwKSk7XG4gICAgICAgIHRpdGxlTm9kZS5zZXRQb3NpdGlvbigwLCAyMzApO1xuICAgICAgICB2YXIgdGl0bGVMYWJlbCA9IHRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICB0aXRsZUxhYmVsLnN0cmluZyA9IFwi55So5oi35Y2P6K6uXCI7XG4gICAgICAgIHRpdGxlTGFiZWwuZm9udFNpemUgPSAzNjtcbiAgICAgICAgdGl0bGVMYWJlbC5saW5lSGVpZ2h0ID0gNjA7XG4gICAgICAgIHRpdGxlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgdGl0bGVOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDMwLCAzMCwgMzApO1xuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOWFs+mXreaMiemSriA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgY2xvc2VCdG4gPSBuZXcgY2MuTm9kZShcImNsb3NlX2J0blwiKTtcbiAgICAgICAgY2xvc2VCdG4ucGFyZW50ID0gcGFuZWw7XG4gICAgICAgIGNsb3NlQnRuLnNldENvbnRlbnRTaXplKGNjLnNpemUoNjAsIDYwKSk7XG4gICAgICAgIGNsb3NlQnRuLnNldFBvc2l0aW9uKDQwMCwgMjMwKTtcbiAgICAgICAgXG4gICAgICAgIHZhciBjbG9zZUJ0bkJnID0gbmV3IGNjLk5vZGUoXCJiZ1wiKTtcbiAgICAgICAgY2xvc2VCdG5CZy5wYXJlbnQgPSBjbG9zZUJ0bjtcbiAgICAgICAgY2xvc2VCdG5CZy5zZXRDb250ZW50U2l6ZShjYy5zaXplKDUwLCA1MCkpO1xuICAgICAgICBjbG9zZUJ0bkJnLnNldFBvc2l0aW9uKDAsIDApO1xuICAgICAgICB2YXIgY2xvc2VCZ1Nwcml0ZSA9IGNsb3NlQnRuQmcuYWRkQ29tcG9uZW50KGNjLlNwcml0ZSk7XG4gICAgICAgIGNsb3NlQmdTcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NO1xuICAgICAgICBjbG9zZUJ0bkJnLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNsb3NlTGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJ4XCIpO1xuICAgICAgICBjbG9zZUxhYmVsTm9kZS5wYXJlbnQgPSBjbG9zZUJ0bjtcbiAgICAgICAgY2xvc2VMYWJlbE5vZGUuc2V0UG9zaXRpb24oMCwgMCk7XG4gICAgICAgIHZhciBjbG9zZUxhYmVsID0gY2xvc2VMYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgY2xvc2VMYWJlbC5zdHJpbmcgPSBcIsOXXCI7XG4gICAgICAgIGNsb3NlTGFiZWwuZm9udFNpemUgPSA0MDtcbiAgICAgICAgY2xvc2VMYWJlbC5saW5lSGVpZ2h0ID0gNTA7XG4gICAgICAgIGNsb3NlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgY2xvc2VMYWJlbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoODAsIDgwLCA4MCk7XG4gICAgICAgIFxuICAgICAgICB2YXIgY2xvc2VCdG5Db21wID0gY2xvc2VCdG4uYWRkQ29tcG9uZW50KGNjLkJ1dHRvbik7XG4gICAgICAgIGNsb3NlQnRuQ29tcC50cmFuc2l0aW9uID0gY2MuQnV0dG9uLlRyYW5zaXRpb24uU0NBTEU7XG4gICAgICAgIGNsb3NlQnRuQ29tcC56b29tU2NhbGUgPSAxLjI7XG4gICAgICAgIGNsb3NlQnRuQ29tcC5pbnRlcmFjdGFibGUgPSB0cnVlO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNsb3NlSGFuZGxlciA9IG5ldyBjYy5Db21wb25lbnQuRXZlbnRIYW5kbGVyKCk7XG4gICAgICAgIGNsb3NlSGFuZGxlci50YXJnZXQgPSB0aGlzLm5vZGU7XG4gICAgICAgIGNsb3NlSGFuZGxlci5jb21wb25lbnQgPSBcImxvZ2luU2NlbmVcIjtcbiAgICAgICAgY2xvc2VIYW5kbGVyLmhhbmRsZXIgPSBcIl9jbG9zZVVzZXJBZ3JlZW1lbnRQb3B1cFwiO1xuICAgICAgICBjbG9zZUhhbmRsZXIuY3VzdG9tRXZlbnREYXRhID0gXCJcIjtcbiAgICAgICAgY2xvc2VCdG5Db21wLmNsaWNrRXZlbnRzLnB1c2goY2xvc2VIYW5kbGVyKTtcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDliIbpmpTnur8gPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdmFyIGRpdmlkZXJMaW5lID0gbmV3IGNjLk5vZGUoXCJkaXZpZGVyXCIpO1xuICAgICAgICBkaXZpZGVyTGluZS5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgZGl2aWRlckxpbmUuc2V0Q29udGVudFNpemUoY2Muc2l6ZSg4NTAsIDEpKTtcbiAgICAgICAgZGl2aWRlckxpbmUuc2V0UG9zaXRpb24oMCwgMTk1KTtcbiAgICAgICAgdmFyIGRpdmlkZXJTcHJpdGUgPSBkaXZpZGVyTGluZS5hZGRDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgZGl2aWRlclNwcml0ZS5zaXplTW9kZSA9IGNjLlNwcml0ZS5TaXplTW9kZS5DVVNUT007XG4gICAgICAgIGRpdmlkZXJMaW5lLmNvbG9yID0gbmV3IGNjLkNvbG9yKDIyMCwgMjIwLCAyMjApO1xuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOWGheWuuea7muWKqOWMuuWfnyA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyDmlbTkvZPkuIrnp7vvvIzlop7liqDlupXpg6jnqbrpl7TvvIzmt7vliqDmu5rliqjlip/og71cbiAgICAgICAgdmFyIHNjcm9sbE5vZGUgPSBuZXcgY2MuTm9kZShcInNjcm9sbF92aWV3XCIpO1xuICAgICAgICBzY3JvbGxOb2RlLnBhcmVudCA9IHBhbmVsO1xuICAgICAgICBzY3JvbGxOb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoODIwLCAzODApKTsgIC8vIOiwg+aVtOWuveW6plxuICAgICAgICBzY3JvbGxOb2RlLnNldFBvc2l0aW9uKDAsIDApOyAgLy8g5LiK56e7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqAgU2Nyb2xsVmlldyDnu4Tku7blrp7njrDmu5rliqjlip/og71cbiAgICAgICAgdmFyIHNjcm9sbFZpZXcgPSBzY3JvbGxOb2RlLmFkZENvbXBvbmVudChjYy5TY3JvbGxWaWV3KTtcbiAgICAgICAgc2Nyb2xsVmlldy5ob3Jpem9udGFsID0gZmFsc2U7ICAvLyDnpoHnlKjmsLTlubPmu5rliqhcbiAgICAgICAgc2Nyb2xsVmlldy52ZXJ0aWNhbCA9IHRydWU7ICAgICAvLyDlkK/nlKjlnoLnm7Tmu5rliqhcbiAgICAgICAgc2Nyb2xsVmlldy5pbmVydGlhID0gdHJ1ZTsgICAgICAvLyDmu5rliqjmg6/mgKdcbiAgICAgICAgc2Nyb2xsVmlldy5lbGFzdGljID0gdHJ1ZTsgICAgICAvLyDlvLnmgKfmlYjmnpxcbiAgICAgICAgXG4gICAgICAgIHZhciB2aWV3Tm9kZSA9IG5ldyBjYy5Ob2RlKFwidmlld1wiKTtcbiAgICAgICAgdmlld05vZGUucGFyZW50ID0gc2Nyb2xsTm9kZTtcbiAgICAgICAgdmlld05vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZSg4MjAsIDM4MCkpOyAgLy8g6LCD5pW05a695bqmXG4gICAgICAgIHZpZXdOb2RlLnNldFBvc2l0aW9uKDAsIDApO1xuICAgICAgICBcbiAgICAgICAgdmFyIG1hc2sgPSB2aWV3Tm9kZS5hZGRDb21wb25lbnQoY2MuTWFzayk7XG4gICAgICAgIG1hc2sudHlwZSA9IGNjLk1hc2suVHlwZS5SRUNUO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNvbnRlbnROb2RlID0gbmV3IGNjLk5vZGUoXCJjb250ZW50XCIpO1xuICAgICAgICBjb250ZW50Tm9kZS5wYXJlbnQgPSB2aWV3Tm9kZTtcbiAgICAgICAgY29udGVudE5vZGUuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgY29udGVudE5vZGUuYW5jaG9yWSA9IDE7XG4gICAgICAgIGNvbnRlbnROb2RlLnNldFBvc2l0aW9uKDAsIDE5MCk7ICAvLyDlsYXkuK3lr7npvZBcbiAgICAgICAgY29udGVudE5vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZSg4MjAsIDgwMCkpOyAgLy8g5aKe5Yqg6auY5bqm5Lul5a6557qz5omA5pyJ5YaF5a65XG4gICAgICAgIFxuICAgICAgICAvLyDorr7nva4gU2Nyb2xsVmlldyDnmoQgY29udGVudCDlsZ7mgKdcbiAgICAgICAgc2Nyb2xsVmlldy5jb250ZW50ID0gY29udGVudE5vZGU7XG4gICAgICAgIFxuICAgICAgICB2YXIgcmljaFRleHROb2RlID0gbmV3IGNjLk5vZGUoXCJyaWNoX3RleHRcIik7XG4gICAgICAgIHJpY2hUZXh0Tm9kZS5wYXJlbnQgPSBjb250ZW50Tm9kZTtcbiAgICAgICAgcmljaFRleHROb2RlLmFuY2hvclggPSAwO1xuICAgICAgICByaWNoVGV4dE5vZGUuYW5jaG9yWSA9IDE7XG4gICAgICAgIHJpY2hUZXh0Tm9kZS5zZXRQb3NpdGlvbigtMzg1LCAtMTUpOyAgLy8g5aKe5Yqg5bem6L656Led77yM5paH5a2X5pW05L2T5LiK56e7XG4gICAgICAgIFxuICAgICAgICB2YXIgcmljaFRleHQgPSByaWNoVGV4dE5vZGUuYWRkQ29tcG9uZW50KGNjLlJpY2hUZXh0KTtcbiAgICAgICAgcmljaFRleHQuZm9udFNpemUgPSAxNjsgIC8vIOWtl+WPt+WKoOWkp++8mjE0IC0+IDE2XG4gICAgICAgIHJpY2hUZXh0LmxpbmVIZWlnaHQgPSAyNjsgIC8vIOihjOmrmOWKoOWkp++8mjI0IC0+IDI2XG4gICAgICAgIHJpY2hUZXh0Lm1heFdpZHRoID0gNzYwOyAgLy8g6LCD5pW05a695bqm77yM56Gu5L+d5bem5Y+z6L656LedXG4gICAgICAgIFxuICAgICAgICAvLyDorr7nva7mloflrZfpopzoibLkuLrpu5HoibJcbiAgICAgICAgdmFyIGFncmVlbWVudFRleHQgPSBcIjxiPjxjb2xvcj0jMDAwMDAwPueUqOaIt+WNj+iurjwvY29sb3I+PC9iPlxcblxcblwiICtcbiAgICAgICAgICAgIFwiPGNvbG9yPSMwMDAwMDA+5qyi6L+O5L2/55So5pys5ri45oiP77yB5Zyo5L2/55So5YmN77yM6K+35LuU57uG6ZiF6K+75Lul5LiL5Y2P6K6u77yaPC9jb2xvcj5cXG5cXG5cIiArXG4gICAgICAgICAgICBcIjxiPjxjb2xvcj0jMDAwMDAwPuS4gOOAgeacjeWKoeadoeasvjwvY29sb3I+PC9iPlxcblwiICtcbiAgICAgICAgICAgIFwiPGNvbG9yPSMwMDAwMDA+MS4g55So5oi35bqU6YG15a6I5Zu95a625rOV5b6L5rOV6KeE77yM5paH5piO5ri45oiP44CCPC9jb2xvcj5cXG5cIiArXG4gICAgICAgICAgICBcIjxjb2xvcj0jMDAwMDAwPjIuIOemgeatouS9v+eUqOWkluaMguOAgeS9nOW8iui9r+S7tuetieegtOWdj+a4uOaIj+WFrOW5s+aAp+eahOihjOS4uuOAgjwvY29sb3I+XFxuXCIgK1xuICAgICAgICAgICAgXCI8Y29sb3I9IzAwMDAwMD4zLiDnlKjmiLfotKblj7flronlhajnlLHnlKjmiLfoh6rooYzotJ/otKPvvIzor7flpqXlloTkv53nrqHotKblj7flr4bnoIHjgII8L2NvbG9yPlxcblxcblwiICtcbiAgICAgICAgICAgIFwiPGI+PGNvbG9yPSMwMDAwMDA+5LqM44CB6ZqQ56eB5pS/562WPC9jb2xvcj48L2I+XFxuXCIgK1xuICAgICAgICAgICAgXCI8Y29sb3I9IzAwMDAwMD4xLiDmiJHku6zkvJrmlLbpm4blv4XopoHnmoTnlKjmiLfkv6Hmga/nlKjkuo7mj5DkvpvmnI3liqHjgII8L2NvbG9yPlxcblwiICtcbiAgICAgICAgICAgIFwiPGNvbG9yPSMwMDAwMDA+Mi4g5oiR5Lus5om/6K+65L+d5oqk55So5oi36ZqQ56eB77yM5LiN5Lya5ZCR56ys5LiJ5pa55rOE6Zyy55So5oi35L+h5oGv44CCPC9jb2xvcj5cXG5cIiArXG4gICAgICAgICAgICBcIjxjb2xvcj0jMDAwMDAwPjMuIOeUqOaIt+acieadg+imgeaxguWIoOmZpOS4quS6uuaVsOaNruOAgjwvY29sb3I+XFxuXFxuXCIgK1xuICAgICAgICAgICAgXCI8Yj48Y29sb3I9IzAwMDAwMD7kuInjgIHlhY3otKPlo7DmmI48L2NvbG9yPjwvYj5cXG5cIiArXG4gICAgICAgICAgICBcIjxjb2xvcj0jMDAwMDAwPjEuIOWboOS4jeWPr+aKl+WKm+WvvOiHtOeahOacjeWKoeS4reaWre+8jOaIkeS7rOS4jeaJv+aLhei0o+S7u+OAgjwvY29sb3I+XFxuXCIgK1xuICAgICAgICAgICAgXCI8Y29sb3I9IzAwMDAwMD4yLiDnlKjmiLflm6Dov53op4Tmk43kvZzpgKDmiJDnmoTmjZ/lpLHvvIznlLHnlKjmiLfoh6rooYzmib/mi4XjgII8L2NvbG9yPlxcblxcblwiICtcbiAgICAgICAgICAgIFwiPGNvbG9yPSMwMDAwMDA+5aaC5pyJ55aR6Zeu77yM6K+36IGU57O75a6i5pyN44CCPC9jb2xvcj5cIjtcbiAgICAgICAgXG4gICAgICAgIHJpY2hUZXh0LnN0cmluZyA9IGFncmVlbWVudFRleHQ7XG4gICAgICAgIFxuICAgICAgICAvLyDmu5rliqjliLDpobbpg6hcbiAgICAgICAgc2Nyb2xsVmlldy5zY3JvbGxUb1RvcCgwKTtcblxuICAgICAgICB0aGlzLl91c2VyQWdyZWVtZW50UG9wdXAgPSBwb3B1cDtcbiAgICB9LFxuXG4gICAgX2Nsb3NlVXNlckFncmVlbWVudFBvcHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3VzZXJBZ3JlZW1lbnRQb3B1cCkge1xuICAgICAgICAgICAgdGhpcy5fdXNlckFncmVlbWVudFBvcHVwLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMuX3VzZXJBZ3JlZW1lbnRQb3B1cCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vIOmUgOavgeaXtua4heeQhlxuICAgIG9uRGVzdHJveSAoKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZUdsb2JhbFRvdWNoRm9yTXVzaWMoKTtcbiAgICB9XG59KTtcbiJdfQ==