
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
var _globalStyleFixApplied = false; // 辅助函数：修复Web平台EditBox的CSS样式（增强版）

var _fixEditBoxStyle = function _fixEditBoxStyle(editBox, fontColor, bgColor) {
  if (!cc.sys.isBrowser) return;
  fontColor = fontColor || '#000000';
  bgColor = bgColor || '#ffffff'; // 立即尝试修复

  _applyInputStyles(fontColor, bgColor); // 延迟修复（等待HTML input元素创建）


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
  }, 500); // 注入全局CSS样式（最高优先级）

  if (!_globalStyleFixApplied) {
    _globalStyleFixApplied = true;

    _injectGlobalStyles(fontColor, bgColor);
  }
}; // 应用样式到所有input元素


var _applyInputStyles = function _applyInputStyles(fontColor, bgColor) {
  try {
    var inputs = document.querySelectorAll('input');

    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];

      _styleSingleInput(input, fontColor, bgColor);
    } // 也处理 textarea（可能被用于 EditBox）


    var textareas = document.querySelectorAll('textarea');

    for (var j = 0; j < textareas.length; j++) {
      _styleSingleInput(textareas[j], fontColor, bgColor);
    }
  } catch (e) {
    console.error('修复EditBox样式失败:', e);
  }
}; // 样式化单个input元素 - 修复版：文字垂直居中 + 透明背景不遮挡边框
// 注意：跳过原生输入框（native-phone-input, native-code-input），因为它们有精确的位置设置


var _styleSingleInput = function _styleSingleInput(input, fontColor, bgColor) {
  // ★ 跳过原生输入框，它们已经有正确的样式
  if (input.id === 'native-phone-input' || input.id === 'native-code-input') {
    return;
  } // ==================== 核心样式设置 ====================
  // 1. 文字颜色


  input.style.setProperty('color', fontColor, 'important');
  input.style.color = fontColor; // 2. 关键：设置透明背景，让 Cocos 绘制的边框可见

  input.style.setProperty('background-color', 'transparent', 'important');
  input.style.backgroundColor = 'transparent'; // 3. 文字垂直居中 - 使用 Flexbox 方案（最可靠）

  input.style.setProperty('display', 'flex', 'important');
  input.style.display = 'flex';
  input.style.setProperty('align-items', 'center', 'important');
  input.style.alignItems = 'center';
  input.style.setProperty('justify-content', 'flex-start', 'important');
  input.style.justifyContent = 'flex-start'; // 4. 盒模型设置

  input.style.setProperty('box-sizing', 'border-box', 'important');
  input.style.boxSizing = 'border-box'; // 5. 内边距 - 给文字留出空间，避免贴边

  input.style.setProperty('padding', '0 12px', 'important');
  input.style.padding = '0 12px'; // 6. 行高设置 - 与字体大小匹配，确保垂直居中

  input.style.setProperty('line-height', '1', 'important');
  input.style.lineHeight = '1'; // 7. 高度自适应内容

  input.style.setProperty('height', '100%', 'important');
  input.style.height = '100%'; // ==================== 字体设置 ====================

  input.style.setProperty('font-size', '20px', 'important');
  input.style.fontSize = '20px';
  input.style.setProperty('font-family', 'Arial, "Microsoft YaHei", sans-serif', 'important'); // ==================== WebKit 特殊修复 ====================

  input.style.setProperty('-webkit-text-fill-color', fontColor, 'important');
  input.style.webkitTextFillColor = fontColor; // ==================== 可见性确保 ====================

  input.style.setProperty('opacity', '1', 'important');
  input.style.opacity = '1';
  input.style.setProperty('visibility', 'visible', 'important');
  input.style.visibility = 'visible'; // ==================== 光标颜色 ====================

  input.style.setProperty('caret-color', fontColor, 'important');
  input.style.caretColor = fontColor; // ==================== 移除干扰样式 ====================

  input.style.textShadow = 'none';
  input.style.setProperty('text-shadow', 'none', 'important');
  input.style.outline = 'none';
  input.style.setProperty('outline', 'none', 'important');
  input.style.border = 'none';
  input.style.setProperty('border', 'none', 'important'); // ==================== 移除定位干扰 ====================

  input.style.removeProperty('top');
  input.style.removeProperty('margin-top');
  input.style.removeProperty('margin'); // ==================== 聚焦时保持样式 ====================

  input.style.setProperty('outline-offset', '0', 'important');
}; // 注入全局CSS样式 - 修复版（排除原生输入框）


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
}; // 创建原生 HTML input 元素（绕过 Cocos EditBox 的问题）
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
    console.log('游戏分辨率:', winSize.width, 'x', winSize.height); // 计算缩放比例（Canvas 实际尺寸 / 游戏设计分辨率）

    var scaleX = canvasRect.width / winSize.width;
    var scaleY = canvasRect.height / winSize.height;
    console.log('缩放比例:', scaleX.toFixed(3), scaleY.toFixed(3)); // ==================== 关键改进：使用节点世界坐标 ====================
    // 直接使用 Cocos 节点的世界坐标，而不是手动计算偏移
    // 获取输入框节点的世界坐标

    var phoneWorldPos = phoneInputNode.convertToWorldSpaceAR(cc.v2(0, 0));
    var codeWorldPos = codeInputNode.convertToWorldSpaceAR(cc.v2(0, 0));
    console.log('手机输入框世界坐标:', phoneWorldPos.x.toFixed(1), phoneWorldPos.y.toFixed(1));
    console.log('验证码输入框世界坐标:', codeWorldPos.x.toFixed(1), codeWorldPos.y.toFixed(1)); // ★★★ 位置微调参数（如果需要微调，修改这里）★★★

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
    console.log('验证码输入框:', actualCodeInputWidth, 'x', actualInputHeight); // 计算屏幕位置（世界坐标 -> 屏幕坐标）
    // Cocos 坐标系：原点左下角，Y 向上
    // HTML 坐标系：原点左上角，Y 向下

    var calcScreenPosFromWorld = function calcScreenPosFromWorld(worldPos, nodeWidth, nodeHeight, offsetX, offsetY) {
      // 世界坐标转换为屏幕坐标
      var screenX = worldPos.x + offsetX;
      var screenY = worldPos.y + offsetY; // 转换为 Canvas 坐标

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
    console.log('验证码输入框屏幕位置:', codeScreen); // 边界检查：确保输入框在屏幕可见区域内

    phoneScreen.left = Math.max(0, Math.min(canvasRect.width - phoneScreen.width, phoneScreen.left));
    phoneScreen.top = Math.max(0, Math.min(canvasRect.height - phoneScreen.height, phoneScreen.top));
    codeScreen.left = Math.max(0, Math.min(canvasRect.width - codeScreen.width, codeScreen.left));
    codeScreen.top = Math.max(0, Math.min(canvasRect.height - codeScreen.height, codeScreen.top));
    console.log('边界检查后位置:');
    console.log('  手机输入框:', phoneScreen.left.toFixed(1), phoneScreen.top.toFixed(1));
    console.log('  验证码输入框:', codeScreen.left.toFixed(1), codeScreen.top.toFixed(1)); // 移除旧的容器和输入框

    var oldContainer = document.getElementById('native-input-container');

    if (oldContainer) {
      oldContainer.remove();
    } // 创建新的容器（直接放在 body 下，确保不被遮挡）


    var container = document.createElement('div');
    container.id = 'native-input-container';
    container.style.cssText = ['position: fixed', 'top: 0', 'left: 0', 'width: 100%', 'height: 100%', 'pointer-events: none', 'z-index: 99999'].join('; ');
    document.body.appendChild(container); // 创建手机号输入框

    var phoneInput = document.createElement('input');
    phoneInput.id = 'native-phone-input';
    phoneInput.type = 'tel';
    phoneInput.placeholder = '请输入手机号';
    phoneInput.maxLength = 11;
    phoneInput.style.cssText = ['position: absolute', 'left: ' + phoneScreen.left + 'px', 'top: ' + phoneScreen.top + 'px', 'width: ' + phoneScreen.width + 'px', 'height: ' + phoneScreen.height + 'px', 'background: transparent', 'border: none', 'border-radius: 0', 'font-size: 12px', 'color: #333', 'padding: 0 8px', 'box-sizing: border-box', 'outline: none', 'pointer-events: auto', 'z-index: 100000', 'cursor: text', 'font-family: Arial, "Microsoft YaHei", sans-serif', 'line-height: ' + phoneScreen.height + 'px', 'text-align: left'].join('; ');
    container.appendChild(phoneInput); // 创建验证码输入框

    var codeInput = document.createElement('input');
    codeInput.id = 'native-code-input';
    codeInput.type = 'text';
    codeInput.placeholder = '验证码';
    codeInput.maxLength = 6;
    codeInput.style.cssText = ['position: absolute', 'left: ' + codeScreen.left + 'px', 'top: ' + codeScreen.top + 'px', 'width: ' + codeScreen.width + 'px', 'height: ' + codeScreen.height + 'px', 'background: transparent', 'border: none', 'border-radius: 0', 'font-size: 12px', 'color: #333', 'padding: 0 8px', 'box-sizing: border-box', 'outline: none', 'pointer-events: auto', 'z-index: 100000', 'cursor: text', 'font-family: Arial, "Microsoft YaHei", sans-serif', 'line-height: ' + codeScreen.height + 'px', 'text-align: left'].join('; ');
    container.appendChild(codeInput); // 添加焦点事件调试

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
    console.log('原生输入框创建完成'); // 延迟检查输入框是否正确创建

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
}; // 移除原生 HTML 输入框元素（登录成功或关闭弹窗时调用）


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
}; // 修复 EditBox 的 HTML input 元素位置和尺寸


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
    console.log('Canvas 尺寸:', canvasRect.width, 'x', canvasRect.height); // 获取游戏设计的分辨率

    var winSize = cc.winSize;
    console.log('游戏分辨率:', winSize.width, 'x', winSize.height); // 计算缩放比例

    var scaleX = canvasRect.width / winSize.width;
    var scaleY = canvasRect.height / winSize.height;
    console.log('缩放比例:', scaleX, scaleY); // 辅助函数：将 Cocos 世界坐标转换为 HTML 屏幕坐标

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
    }; // 计算手机输入框的世界坐标


    var phoneWorldPos = phoneInputNode.convertToWorldSpaceAR(cc.v2(0, 0));
    console.log('手机输入框世界坐标:', phoneWorldPos.x, phoneWorldPos.y);
    var phoneScreenPos = worldToScreen(phoneWorldPos, inputWidth, inputHeight);
    console.log('手机输入框屏幕位置:', phoneScreenPos.x, phoneScreenPos.y); // 查找 HTML input 元素

    var inputs = document.querySelectorAll('input');
    console.log('找到 ' + inputs.length + ' 个 input 元素'); // 如果只有一个 input，需要手动创建第二个

    if (inputs.length === 1) {
      var phoneInput = inputs[0]; // 设置样式

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
    } // 验证码输入框


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
    } // 调试：显示输入框的实际位置


    console.log('=== 调试信息 ===');
    console.log('Canvas 位置:', canvasRect.left, canvasRect.top);
    console.log('设计分辨率:', winSize.width, 'x', winSize.height);
    console.log('输入框节点尺寸:', inputWidth, 'x', inputHeight);
    console.log('验证码输入框尺寸:', codeInputW, 'x', inputHeight);
  } catch (e) {
    console.error('修复 EditBox 样式失败:', e);
  }
}; // MutationObserver 监听新创建的input元素


var _startInputObserver = function _startInputObserver() {
  if (!cc.sys.isBrowser) return;

  try {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeName === 'INPUT' || node.nodeName === 'TEXTAREA') {
            _styleSingleInput(node, '#000000', '#ffffff');
          } // 检查子节点


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
      } // 🔧 额外保险：禁用 screen 的自动全屏触摸监听器


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
    } // 检查是否被强制下线


    if (myglobal.wasForceLoggedOut()) {
      this._showError(myglobal.getForceLogoutReason());

      return;
    } // 检查是否有本地会话


    if (myglobal.hasLocalSession()) {
      var self = this;
      myglobal.verifyToken(function (valid, message) {
        if (valid) {
          self._showError("自动登录中..."); // 检查是否有保存的房间信息（刷新页面后恢复到游戏场景）


          var reconnectInfo = myglobal.socket && myglobal.socket.loadReconnectInfo ? myglobal.socket.loadReconnectInfo() : {
            token: '',
            playerId: '',
            roomCode: ''
          }; // 如果有房间号，说明之前在游戏中，需要恢复到游戏场景

          if (reconnectInfo.roomCode) {
            self.scheduleOnce(function () {
              if (myglobal.socket && myglobal.socket.initSocket) {
                myglobal.socket.initSocket();
              } // 监听房间恢复事件


              myglobal.socket.onRoomRestored(function (data) {
                cc.director.loadScene("gameScene");
              }); // 监听普通连接成功（不在房间中）

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
          self._showError(message || "登录已过期，请重新登录"); // myglobal.verifyToken 已经清除了本地状态，这里不需要再次清除

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
    var self = this; // loginScene 脚本挂载在 ROOT_UI 节点上，所以 this.node 就是 ROOT_UI

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
    console.log("========================================"); // 备用方案：在 start 中再次检查按钮是否正确初始化

    var self = this;
    this.scheduleOnce(function () {
      console.log(">>> 延迟检查按钮状态...");
      var phoneLoginNode = self.node.getChildByName("login_phone");

      if (phoneLoginNode) {
        console.log(">>> login_phone 节点存在");
        var hasTouchListeners = phoneLoginNode.getComponent(cc.Button) !== null;
        console.log(">>> 是否有 Button 组件:", hasTouchListeners); // 再次确保事件绑定

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
    console.log("当前节点:", this.node ? this.node.name : "null"); // 打印所有子节点名称

    var children = this.node.children;
    console.log("子节点数量:", children.length);

    for (var i = 0; i < children.length; i++) {
      console.log("  子节点[" + i + "]:", children[i].name);
    } // loginScene 脚本挂载在 ROOT_UI 节点上，所以 this.node 就是 ROOT_UI


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
      } // 添加备用的触摸事件监听（确保点击事件一定能触发）


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
      } // 添加备用的触摸事件监听（确保点击事件一定能触发）


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
    var self = this; // loginScene 脚本挂载在 ROOT_UI 节点上，所以 this.node 就是 ROOT_UI

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
    }); // 预加载游戏场景

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
    } // 检查是否有保存的重连信息（刷新页面后恢复）


    if (myglobal.socket && myglobal.socket.loadReconnectInfo) {
      var reconnectInfo = myglobal.socket.loadReconnectInfo();

      if (reconnectInfo.token && reconnectInfo.playerId) {
        this._showLoading(true, "正在恢复登录状态..."); // 初始化 WebSocket 连接


        if (myglobal.socket.initSocket) {
          myglobal.socket.initSocket();
        }

        var self = this; // 监听房间恢复事件

        myglobal.socket.onRoomRestored(function (data) {
          self._showLoading(false); // 恢复玩家数据


          myglobal.playerData.playerId = data.player_id;
          myglobal.playerData.nickName = data.player_name;
          myglobal.playerData.saveToLocal(); // 跳转到游戏场景

          cc.director.loadScene("gameScene");
        }); // 监听普通连接成功（不在房间中）

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
    } // 初始化背景音乐 - 处理浏览器自动播放策略


    this._initBackgroundMusic();

    if (myglobal.socket && myglobal.socket.initSocket) {
      myglobal.socket.initSocket();
    }
  },
  // 初始化背景音乐 - 处理浏览器自动播放策略
  _initBackgroundMusic: function _initBackgroundMusic() {
    var self = this; // 音效开关检查

    var isopen_sound = typeof window.isopen_sound !== 'undefined' ? window.isopen_sound : 1;

    if (!isopen_sound) {
      return;
    } // 初始化状态


    this._musicPlaying = false;
    this._touchListenerAdded = false; // 使用 cc.resources.load 加载音频

    cc.resources.load("sound/login_bg", cc.AudioClip, function (err, clip) {
      if (!cc.isValid(self.node)) return;

      if (err) {
        self._setupGlobalTouchForMusic();

        return;
      } // 保存音频剪辑


      self._bgMusicClip = clip;

      try {
        // 使用 playMusic 播放背景音乐（统一的背景音乐管理）
        cc.audioEngine.playMusic(clip, true);
        self._musicPlaying = true; // 成功播放，确保监听器被移除

        self._removeGlobalTouchForMusic();
      } catch (e) {
        self._setupGlobalTouchForMusic();
      }
    });
  },
  // 通过触摸播放音乐
  _playMusicOnTouch: function _playMusicOnTouch() {
    var self = this; // 首先检查是否有正在播放的音乐

    if (cc.audioEngine.isMusicPlaying()) {
      this._removeGlobalTouchForMusic();

      return;
    } // 如果已经有音频剪辑，直接播放


    if (this._bgMusicClip) {
      try {
        cc.audioEngine.playMusic(this._bgMusicClip, true);
        this._musicPlaying = true;

        this._removeGlobalTouchForMusic();
      } catch (e) {}

      return;
    } // 没有音频剪辑，需要加载


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
    this._touchListenerAdded = true; // Cocos Creator 层面的监听

    this._cocosTouchHandler = function () {
      self._playMusicOnTouch();
    };

    this.node.on(cc.Node.EventType.TOUCH_START, this._cocosTouchHandler, this); // Web 浏览器层面的监听

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
    } // 移除浏览器层面的监听


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
    var y = -height / 2; // 使用 Cocos Creator Graphics 的 roundRect 方法

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
    console.log(">>> _doPhoneLogin 被调用"); // 🔧 修复：防止重复点击导致多个弹窗

    if (this._phoneLoginPopupShowing) {
      console.log(">>> 登录弹窗正在显示中，忽略重复调用");
      return;
    }

    if (!this._checkAgreement()) {
      console.log(">>> 用户未同意协议");

      this._showError("请先同意用户协议");

      return;
    } // 设置标志位，防止重复弹窗


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
    console.log(">>> _createPhoneLoginPopup 被调用"); // 动态创建弹窗（使用正确的背景图和尺寸）

    try {
      console.log(">>> 开始动态创建登录弹窗");

      var popup = this._createPhoneLoginDynamic();

      console.log(">>> 登录弹窗创建完成:", popup ? popup.name : "null");
      this._phoneLoginPopup = popup;
    } catch (e) {
      console.error("创建手机登录弹窗失败:", e);

      this._showError("无法显示登录弹窗: " + e.message); // 🔧 修复：创建失败时重置标志位，允许下次点击重试


      this._phoneLoginPopupShowing = false;
    }
  },
  // 动态创建手机登录弹窗 - 使用正确的背景图和尺寸
  _createPhoneLoginDynamic: function _createPhoneLoginDynamic() {
    var self = this; // ==================== 弹窗尺寸（固定尺寸，与图片匹配）====================
    // 使用固定尺寸：宽度520px，高度680px（与login_bg.png图片尺寸一致）
    // 在小屏幕上自动缩放

    var winW = cc.winSize.width;
    var winH = cc.winSize.height; // 图片原始尺寸 - 调宽弹窗

    var imgWidth = 580; // 原来是520，增加到580

    var imgHeight = 680; // 如果屏幕太小，按比例缩小

    var scale = 1.0;

    if (winW < imgWidth + 40) {
      scale = (winW - 40) / imgWidth;
    }

    var panelWidth = imgWidth * scale;
    var panelHeight = imgHeight * scale;
    console.log("登录弹窗尺寸: " + panelWidth + " x " + panelHeight + ", 缩放比例: " + scale); // ==================== 弹窗根节点 ====================

    var popup = new cc.Node("LoginDialog");
    popup.parent = this.node;
    popup.setContentSize(cc.size(winW, winH));
    popup.setPosition(0, 0);
    popup.zIndex = 1000; // 添加 BlockInputEvents 组件阻止底层点击

    popup.addComponent(cc.BlockInputEvents); // ==================== 半透明背景遮罩 ====================

    var mask = new cc.Node("Mask");
    mask.parent = popup;
    mask.setContentSize(cc.size(winW, winH));
    mask.setPosition(0, 0);
    var maskSprite = mask.addComponent(cc.Sprite);
    maskSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    mask.color = new cc.Color(0, 0, 0);
    mask.opacity = 150; // 🔧 修复：点击遮罩层关闭弹窗

    mask.on(cc.Node.EventType.TOUCH_END, function () {
      console.log(">>> 点击遮罩层关闭弹窗"); // 重置标志位

      self._phoneLoginPopupShowing = false; // 清理原生 HTML input 元素

      if (cc.sys.isBrowser) {
        var container = document.getElementById('native-input-container');

        if (container) {
          container.remove();
        }
      } // 关闭动画


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
    }, this); // ==================== 弹窗面板 ====================

    var panel = new cc.Node("Panel");
    panel.parent = popup;
    panel.setContentSize(cc.size(panelWidth, panelHeight));
    panel.setPosition(0, 0);
    panel.scale = 0.7;
    panel.opacity = 0; // ==================== 弹窗背景（使用正确的 login_bg 图片）====================

    var bg = new cc.Node("Bg");
    bg.parent = panel; // 先设置一个临时尺寸

    bg.setContentSize(cc.size(panelWidth, panelHeight));
    bg.setPosition(0, 0);
    bg.zIndex = 0; // 背景在最底层
    // 先添加Sprite组件并设置sizeMode

    var bgSprite = bg.addComponent(cc.Sprite);
    bgSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM; // 使用自定义尺寸，不跟随图片

    bgSprite.srcBlendFactor = cc.macro.BlendFactor.SRC_ALPHA;
    bgSprite.dstBlendFactor = cc.macro.BlendFactor.ONE_MINUS_SRC_ALPHA; // 加载背景图（使用 UI/login/login_bg.png）

    cc.resources.load("UI/login/login_bg", cc.SpriteFrame, function (err, spriteFrame) {
      if (!cc.isValid(bg)) return;

      if (err) {
        console.warn("加载 login_bg 失败，使用默认背景:", err); // 降级：使用渐变背景

        bg.removeComponent(cc.Sprite);
        var bgGfx = bg.addComponent(cc.Graphics);
        bgGfx.fillColor = new cc.Color(45, 35, 25);
        bgGfx.roundRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 20);
        bgGfx.fill();
        return;
      } // 设置spriteFrame


      bgSprite.spriteFrame = spriteFrame; // 关键：再次确保尺寸正确（防止被图片尺寸覆盖）

      bg.setContentSize(cc.size(panelWidth, panelHeight));
      console.log("背景图加载成功，显示尺寸: " + bg.width + " x " + bg.height);
    }); // ==================== 标题文字（欢乐登录）====================
    // 金色描边，白色主体，居中，顶部距边40px

    var titleNode = new cc.Node("Title");
    titleNode.parent = panel;
    titleNode.setPosition(0, panelHeight / 2 - 60);
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = "欢乐登录";
    titleLabel.fontSize = 36;
    titleLabel.lineHeight = 44;
    titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    titleNode.color = new cc.Color(255, 255, 255); // 金色描边

    var titleOutline = titleNode.addComponent(cc.LabelOutline);
    titleOutline.color = new cc.Color(218, 165, 32); // 金色

    titleOutline.width = 3; // ==================== 关闭按钮（右上角圆形，红金色，46x46）====================

    var closeBtn = new cc.Node("BtnClose");
    closeBtn.parent = panel;
    closeBtn.setContentSize(cc.size(46, 46));
    closeBtn.setPosition(panelWidth / 2 - 35, panelHeight / 2 - 35); // 红金色圆形背景

    var closeGfx = closeBtn.addComponent(cc.Graphics);
    closeGfx.fillColor = new cc.Color(200, 60, 60); // 红色

    closeGfx.circle(0, 0, 23);
    closeGfx.fill();
    closeGfx.strokeColor = new cc.Color(218, 165, 32); // 金色边框

    closeGfx.lineWidth = 2;
    closeGfx.circle(0, 0, 22);
    closeGfx.stroke(); // X 符号

    var closeX = new cc.Node("X");
    closeX.parent = closeBtn;
    var closeXLabel = closeX.addComponent(cc.Label);
    closeXLabel.string = "×";
    closeXLabel.fontSize = 28;
    closeXLabel.lineHeight = 32;
    closeXLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    closeX.color = new cc.Color(255, 255, 255);
    closeBtn.on(cc.Node.EventType.TOUCH_END, function () {
      console.log(">>> 点击关闭按钮"); // 🔧 修复：重置弹窗显示标志位

      self._phoneLoginPopupShowing = false;
      console.log(">>> 已重置 _phoneLoginPopupShowing 为 false"); // 清理原生 HTML input 元素

      if (cc.sys.isBrowser) {
        var container = document.getElementById('native-input-container');

        if (container) {
          container.remove();
        }
      } // 关闭动画


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
    }, this); // ==================== 表单布局参数 ====================
    // 根据背景图login_bg.png(520x680)的精确预留位置设置元素
    // 使用项目现有的UI资源：
    //   icon_phone.png - 手机图标
    //   icon_shield.png - 验证码图标
    //   get_mobile_code.png - 获取验证码按钮
    // 计算缩放比例（小屏幕适配）

    var scaleRatio = panelWidth / 520; // 输入框尺寸

    var inputWidth = 220 * scaleRatio; // 输入框宽度

    var inputHeight = 45 * scaleRatio; // 输入框高度（减小）

    var iconSize = 25 * scaleRatio; // 图标大小

    var formY1 = 130 * scaleRatio; // 第一个输入框Y坐标（向下移动）

    var formY2 = 50 * scaleRatio; // 第二个输入框Y坐标

    var getCodeBtnWidth = 90 * scaleRatio; // 获取验证码按钮宽度

    var btnHeight = 45 * scaleRatio; // 统一按钮高度

    console.log("布局参数: scaleRatio=" + scaleRatio.toFixed(2)); // ==================== 手机号输入行 ====================
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
    }); // ==================== 手机号输入框 ====================
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
    }); // ==================== 验证码输入框 ====================
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
        console.warn("加载获取验证码按钮图片失败:", err); // 降级：使用纯色按钮

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
    }); // 倒计时状态

    var countdown = 0;
    var countdownLabel = null; // 开始倒计时

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
    }; // ==================== 手机登录按钮 ====================
    // btn_mobile_login.png 原始尺寸: 340 x 50，宽高比 6.8:1


    var loginBtnY = formY2 - 70 * scaleRatio;
    var loginBtnHeight = 50 * scaleRatio; // 按钮高度

    var loginBtnWidth = loginBtnHeight * 6.8; // 按图片原始比例计算宽度 (340/50=6.8)

    var loginBtn = new cc.Node("BtnLogin");
    loginBtn.parent = panel;
    loginBtn.setContentSize(cc.size(loginBtnWidth, loginBtnHeight));
    loginBtn.setPosition(0, loginBtnY); // 尝试加载按钮图片

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
    loginBtnComp.zoomScale = 0.95; // ==================== 微信登录按钮 ====================
    // icon_wechat.png 原始尺寸: 48 x 48（正方形）

    var wxBtnY = loginBtnY - 155 * scaleRatio; // 往下移动更多

    var wxBtnSize = 48 * scaleRatio; // 使用图片原始尺寸 48

    var wxBtn = new cc.Node("BtnWechat");
    wxBtn.parent = panel;
    wxBtn.setContentSize(cc.size(wxBtnSize, wxBtnSize));
    wxBtn.setPosition(0, wxBtnY); // 尝试加载微信图标

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
    wxBtnComp.zoomScale = 0.95; // 微信登录文字 - 隐藏
    // var wxLabel = new cc.Node("LabelWechat");
    // wxLabel.parent = panel;
    // wxLabel.setPosition(0, wxBtnY - 35 * scaleRatio);
    // var wxLabelComp = wxLabel.addComponent(cc.Label);
    // wxLabelComp.string = "微信登录";
    // wxLabelComp.fontSize = 12 * scaleRatio;
    // wxLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    // wxLabel.color = new cc.Color(100, 80, 60);

    console.log("按钮位置: loginBtnY=" + loginBtnY.toFixed(0) + ", wxBtnY=" + wxBtnY.toFixed(0)); // ==================== 消息提示（隐藏）====================

    var messageLabel = new cc.Node("MessageLabel");
    messageLabel.parent = panel;
    messageLabel.setPosition(0, -panelHeight / 2 + 50);
    var messageLabelComp = messageLabel.addComponent(cc.Label);
    messageLabelComp.string = "";
    messageLabelComp.fontSize = 14;
    messageLabelComp.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    messageLabel.active = false; // ==================== 弹窗进入动画 ====================

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
    }).start(); // ==================== 功能逻辑 ====================

    var phone = "";
    var code = ""; // 获取输入值的辅助函数（支持原生 HTML input）

    var getInputValue = function getInputValue(inputId) {
      if (cc.sys.isBrowser) {
        var input = document.getElementById(inputId);
        return input ? input.value : "";
      }

      return "";
    }; // 验证手机号


    var validatePhone = function validatePhone(phone) {
      if (!phone || phone.length !== 11) return false;
      return /^1[3-9]\d{9}$/.test(phone);
    }; // 显示消息


    var showMessage = function showMessage(msg, isError) {
      messageLabel.active = true;
      messageLabelComp.string = msg;
      messageLabel.color = isError ? new cc.Color(255, 80, 80) : new cc.Color(100, 200, 100);
    }; // 获取验证码 - onGetCode()


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
      } // 使用加密请求发送验证码


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
    }); // 手机登录 - onPhoneLogin()

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
      } // 使用加密请求登录


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
            showMessage("登录成功", false); // 使用 myglobal.onLoginSuccess 保存登录状态

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
                  showMessage("登录成功", false); // 使用 myglobal.onLoginSuccess 保存登录状态

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
    }); // 微信登录 - onWechatLogin()

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
      } // 使用加密请求微信登录


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
              window.myglobal.playerData.token = resp.data.token || ""; // 保存到本地存储

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
                    window.myglobal.playerData.token = resp.data.token || ""; // 保存到本地存储

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
    var self = this; // ==================== 弹窗根节点 ====================

    var popup = new cc.Node("user_agreement_popup");
    popup.parent = this.node;
    popup.setContentSize(cc.size(1280, 720));
    popup.setPosition(0, 0);
    popup.zIndex = 1000; // ==================== 半透明黑色背景遮罩 ====================

    var bgMask = new cc.Node("bg_mask");
    bgMask.parent = popup;
    bgMask.setContentSize(cc.size(1280, 720));
    bgMask.setPosition(0, 0);
    var bgMaskSprite = bgMask.addComponent(cc.Sprite);
    bgMaskSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    bgMask.color = new cc.Color(0, 0, 0);
    bgMask.opacity = 180; // ==================== 主面板 ====================

    var panel = new cc.Node("content_panel");
    panel.parent = popup;
    panel.setContentSize(cc.size(900, 520));
    panel.setPosition(0, 0);
    var panelSprite = panel.addComponent(cc.Sprite);
    panelSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    panel.color = new cc.Color(255, 250, 240); // 加载背景图片

    cc.resources.load("images/user_agreement_bg", cc.SpriteFrame, function (err, spriteFrame) {
      if (!cc.isValid(panel)) return;

      if (!err && spriteFrame) {
        panelSprite.spriteFrame = spriteFrame;
      }
    }); // ==================== 标题 ====================

    var titleNode = new cc.Node("title_label");
    titleNode.parent = panel;
    titleNode.setContentSize(cc.size(300, 60));
    titleNode.setPosition(0, 230);
    var titleLabel = titleNode.addComponent(cc.Label);
    titleLabel.string = "用户协议";
    titleLabel.fontSize = 36;
    titleLabel.lineHeight = 60;
    titleLabel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    titleNode.color = new cc.Color(30, 30, 30); // ==================== 关闭按钮 ====================

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
    closeBtnComp.clickEvents.push(closeHandler); // ==================== 分隔线 ====================

    var dividerLine = new cc.Node("divider");
    dividerLine.parent = panel;
    dividerLine.setContentSize(cc.size(850, 1));
    dividerLine.setPosition(0, 195);
    var dividerSprite = dividerLine.addComponent(cc.Sprite);
    dividerSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    dividerLine.color = new cc.Color(220, 220, 220); // ==================== 内容滚动区域 ====================
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
    richText.string = agreementText; // 滚动到顶部

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2xvZ2luc2NlbmUvbG9naW5TY2VuZS5qcyJdLCJuYW1lcyI6WyJfZ2xvYmFsU3R5bGVGaXhBcHBsaWVkIiwiX2ZpeEVkaXRCb3hTdHlsZSIsImVkaXRCb3giLCJmb250Q29sb3IiLCJiZ0NvbG9yIiwiY2MiLCJzeXMiLCJpc0Jyb3dzZXIiLCJfYXBwbHlJbnB1dFN0eWxlcyIsInNldFRpbWVvdXQiLCJfaW5qZWN0R2xvYmFsU3R5bGVzIiwiaW5wdXRzIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yQWxsIiwiaSIsImxlbmd0aCIsImlucHV0IiwiX3N0eWxlU2luZ2xlSW5wdXQiLCJ0ZXh0YXJlYXMiLCJqIiwiZSIsImNvbnNvbGUiLCJlcnJvciIsImlkIiwic3R5bGUiLCJzZXRQcm9wZXJ0eSIsImNvbG9yIiwiYmFja2dyb3VuZENvbG9yIiwiZGlzcGxheSIsImFsaWduSXRlbXMiLCJqdXN0aWZ5Q29udGVudCIsImJveFNpemluZyIsInBhZGRpbmciLCJsaW5lSGVpZ2h0IiwiaGVpZ2h0IiwiZm9udFNpemUiLCJ3ZWJraXRUZXh0RmlsbENvbG9yIiwib3BhY2l0eSIsInZpc2liaWxpdHkiLCJjYXJldENvbG9yIiwidGV4dFNoYWRvdyIsIm91dGxpbmUiLCJib3JkZXIiLCJyZW1vdmVQcm9wZXJ0eSIsInN0eWxlSWQiLCJnZXRFbGVtZW50QnlJZCIsImNzcyIsImNyZWF0ZUVsZW1lbnQiLCJ0eXBlIiwiYXBwZW5kQ2hpbGQiLCJjcmVhdGVUZXh0Tm9kZSIsImhlYWQiLCJfY3JlYXRlTmF0aXZlSW5wdXRFbGVtZW50cyIsInBhbmVsIiwicGhvbmVJbnB1dE5vZGUiLCJjb2RlSW5wdXROb2RlIiwiaW5wdXRXaWR0aCIsImlucHV0SGVpZ2h0IiwiY29kZUlucHV0VyIsInBhbmVsV2lkdGgiLCJwYW5lbEhlaWdodCIsImNhbnZhcyIsInF1ZXJ5U2VsZWN0b3IiLCJjYW52YXNSZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0Iiwid2luU2l6ZSIsImxvZyIsImxlZnQiLCJ0b3AiLCJ3aWR0aCIsInNjYWxlWCIsInNjYWxlWSIsInRvRml4ZWQiLCJwaG9uZVdvcmxkUG9zIiwiY29udmVydFRvV29ybGRTcGFjZUFSIiwidjIiLCJjb2RlV29ybGRQb3MiLCJ4IiwieSIsInBob25lT2Zmc2V0WCIsInBob25lT2Zmc2V0WSIsImNvZGVPZmZzZXRYIiwiY29kZU9mZnNldFkiLCJhY3R1YWxJbnB1dFdpZHRoIiwiYWN0dWFsSW5wdXRIZWlnaHQiLCJhY3R1YWxDb2RlSW5wdXRXaWR0aCIsImNhbGNTY3JlZW5Qb3NGcm9tV29ybGQiLCJ3b3JsZFBvcyIsIm5vZGVXaWR0aCIsIm5vZGVIZWlnaHQiLCJvZmZzZXRYIiwib2Zmc2V0WSIsInNjcmVlblgiLCJzY3JlZW5ZIiwiY2FudmFzWCIsImNhbnZhc1kiLCJhY3R1YWxXaWR0aCIsImFjdHVhbEhlaWdodCIsInBob25lU2NyZWVuIiwiY29kZVNjcmVlbiIsIk1hdGgiLCJtYXgiLCJtaW4iLCJvbGRDb250YWluZXIiLCJyZW1vdmUiLCJjb250YWluZXIiLCJjc3NUZXh0Iiwiam9pbiIsImJvZHkiLCJwaG9uZUlucHV0IiwicGxhY2Vob2xkZXIiLCJtYXhMZW5ndGgiLCJjb2RlSW5wdXQiLCJhZGRFdmVudExpc3RlbmVyIiwicGhvbmVDaGVjayIsImNvZGVDaGVjayIsInJlY3QiLCJfcmVtb3ZlTmF0aXZlSW5wdXRFbGVtZW50cyIsIl9maXhFZGl0Qm94SW5wdXRFbGVtZW50cyIsInBob25lRWRpdEJveCIsImNvZGVFZGl0Qm94Iiwid29ybGRUb1NjcmVlbiIsInBob25lU2NyZWVuUG9zIiwicG9zaXRpb24iLCJ6SW5kZXgiLCJwb2ludGVyRXZlbnRzIiwiY3Vyc29yIiwiYmFja2dyb3VuZCIsImJvcmRlclJhZGl1cyIsImNvZGVTY3JlZW5Qb3MiLCJfc3RhcnRJbnB1dE9ic2VydmVyIiwib2JzZXJ2ZXIiLCJNdXRhdGlvbk9ic2VydmVyIiwibXV0YXRpb25zIiwiZm9yRWFjaCIsIm11dGF0aW9uIiwiYWRkZWROb2RlcyIsIm5vZGUiLCJub2RlTmFtZSIsImlucCIsIm9ic2VydmUiLCJjaGlsZExpc3QiLCJzdWJ0cmVlIiwid2FybiIsIkNsYXNzIiwiQ29tcG9uZW50IiwicHJvcGVydGllcyIsIndhaXRfbm9kZSIsIk5vZGUiLCJ1c2VyX2FncmVlbWVudF9wcmVmYWJzIiwiUHJlZmFiIiwicGhvbmVfbG9naW5fcHJlZmFiIiwib25Mb2FkIiwic2VsZiIsInZpZXciLCJlbmFibGVBdXRvRnVsbFNjcmVlbiIsInNjcmVlbiIsImRpc2FibGVBdXRvRnVsbFNjcmVlbiIsIl9pc0FncmVlbWVudENoZWNrZWQiLCJfcGhvbmVMb2dpblBvcHVwU2hvd2luZyIsIl9pbml0V2FpdE5vZGUiLCJfaW5pdENoZWNrYm94IiwiX2luaXRMb2dpbkJ1dHRvbnMiLCJfaW5pdFVzZXJBZ3JlZW1lbnRMaW5rIiwiX3ByZWxvYWRTY2VuZXMiLCJfY2hlY2tBdXRvTG9naW4iLCJ3aW5kb3ciLCJteWdsb2JhbCIsIl93YWl0Rm9yTXlnbG9iYWwiLCJfaW5pdEFuZFN0YXJ0Iiwid2FzRm9yY2VMb2dnZWRPdXQiLCJfc2hvd0Vycm9yIiwiZ2V0Rm9yY2VMb2dvdXRSZWFzb24iLCJoYXNMb2NhbFNlc3Npb24iLCJ2ZXJpZnlUb2tlbiIsInZhbGlkIiwibWVzc2FnZSIsInJlY29ubmVjdEluZm8iLCJzb2NrZXQiLCJsb2FkUmVjb25uZWN0SW5mbyIsInRva2VuIiwicGxheWVySWQiLCJyb29tQ29kZSIsInNjaGVkdWxlT25jZSIsImluaXRTb2NrZXQiLCJvblJvb21SZXN0b3JlZCIsImRhdGEiLCJkaXJlY3RvciIsImxvYWRTY2VuZSIsImV2dCIsImV2ZW50TGlzdGVyIiwib24iLCJfbG9hZGluZ0ltYWdlIiwiZ2V0Q2hpbGRCeU5hbWUiLCJsYmxOb2RlIiwiX3dhaXRMYWJlbCIsImdldENvbXBvbmVudCIsIkxhYmVsIiwiYWN0aXZlIiwiY2hlY2tNYXJrTm9kZSIsIl9jaGVja01hcmtOb2RlIiwiY2hlY2ttYXJrIiwiX2NoZWNrbWFya0ljb24iLCJidXR0b24iLCJCdXR0b24iLCJlbmFibGVkIiwib2ZmIiwiRXZlbnRUeXBlIiwiVE9VQ0hfRU5EIiwiZXZlbnQiLCJfdG9nZ2xlQ2hlY2tib3giLCJzdGFydCIsInBob25lTG9naW5Ob2RlIiwiaGFzVG91Y2hMaXN0ZW5lcnMiLCJzdG9wUHJvcGFnYXRpb24iLCJfZG9QaG9uZUxvZ2luIiwid3hMb2dpbk5vZGUiLCJfZG9XeExvZ2luIiwibmFtZSIsImNoaWxkcmVuIiwiaW50ZXJhY3RhYmxlIiwiY2xpY2tFdmVudHMiLCJoYW5kbGVyIiwiRXZlbnRIYW5kbGVyIiwidGFyZ2V0IiwiY29tcG9uZW50IiwiY3VzdG9tRXZlbnREYXRhIiwicHVzaCIsImxpbmtOb2RlIiwiX29uV3hMb2dpbkNsaWNrIiwiX29uUGhvbmVMb2dpbkNsaWNrIiwiX29uVXNlckFncmVlbWVudExpbmtDbGljayIsIl9zaG93VXNlckFncmVlbWVudFBvcHVwIiwiX2NoZWNrQWdyZWVtZW50IiwicHJlbG9hZFNjZW5lIiwiZXJyIiwiYXR0ZW1wdHMiLCJjaGVjayIsImluaXQiLCJfc2hvd0xvYWRpbmciLCJwbGF5ZXJEYXRhIiwicGxheWVyX2lkIiwibmlja05hbWUiLCJwbGF5ZXJfbmFtZSIsInNhdmVUb0xvY2FsIiwiZ29iYWxfY291bnQiLCJnb2xkIiwiX2luaXRCYWNrZ3JvdW5kTXVzaWMiLCJpc29wZW5fc291bmQiLCJfbXVzaWNQbGF5aW5nIiwiX3RvdWNoTGlzdGVuZXJBZGRlZCIsInJlc291cmNlcyIsImxvYWQiLCJBdWRpb0NsaXAiLCJjbGlwIiwiaXNWYWxpZCIsIl9zZXR1cEdsb2JhbFRvdWNoRm9yTXVzaWMiLCJfYmdNdXNpY0NsaXAiLCJhdWRpb0VuZ2luZSIsInBsYXlNdXNpYyIsIl9yZW1vdmVHbG9iYWxUb3VjaEZvck11c2ljIiwiX3BsYXlNdXNpY09uVG91Y2giLCJpc011c2ljUGxheWluZyIsIl9jb2Nvc1RvdWNoSGFuZGxlciIsIlRPVUNIX1NUQVJUIiwiX2Jyb3dzZXJUb3VjaEhhbmRsZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiX3Nob3dXYWl0Tm9kZSIsIl9oaWRlV2FpdE5vZGUiLCJzaG93Iiwic3RyaW5nIiwiX2lzQW5pbWF0aW5nIiwiX2RyYXdJbnB1dEJnIiwiZ3JhcGhpY3MiLCJyYWRpdXMiLCJyb3VuZFJlY3QiLCJ1cGRhdGUiLCJkdCIsImFuZ2xlIiwicmVxdWVzdF93eExvZ2luIiwidW5pcXVlSUQiLCJhY2NvdW50SUQiLCJhdmF0YXJVcmwiLCJyZXN1bHQiLCJnb2xkY291bnQiLCJfc2hvd1Bob25lTG9naW5Qb3B1cCIsIl9jcmVhdGVQaG9uZUxvZ2luUG9wdXAiLCJwcmVmYWIiLCJwb3B1cCIsIl9jcmVhdGVQaG9uZUxvZ2luRHluYW1pYyIsIl9waG9uZUxvZ2luUG9wdXAiLCJ3aW5XIiwid2luSCIsImltZ1dpZHRoIiwiaW1nSGVpZ2h0Iiwic2NhbGUiLCJwYXJlbnQiLCJzZXRDb250ZW50U2l6ZSIsInNpemUiLCJzZXRQb3NpdGlvbiIsImFkZENvbXBvbmVudCIsIkJsb2NrSW5wdXRFdmVudHMiLCJtYXNrIiwibWFza1Nwcml0ZSIsIlNwcml0ZSIsInNpemVNb2RlIiwiU2l6ZU1vZGUiLCJDVVNUT00iLCJDb2xvciIsInR3ZWVuIiwidG8iLCJlYXNpbmciLCJjYWxsIiwiZGVzdHJveSIsImJnIiwiYmdTcHJpdGUiLCJzcmNCbGVuZEZhY3RvciIsIm1hY3JvIiwiQmxlbmRGYWN0b3IiLCJTUkNfQUxQSEEiLCJkc3RCbGVuZEZhY3RvciIsIk9ORV9NSU5VU19TUkNfQUxQSEEiLCJTcHJpdGVGcmFtZSIsInNwcml0ZUZyYW1lIiwicmVtb3ZlQ29tcG9uZW50IiwiYmdHZngiLCJHcmFwaGljcyIsImZpbGxDb2xvciIsImZpbGwiLCJ0aXRsZU5vZGUiLCJ0aXRsZUxhYmVsIiwiaG9yaXpvbnRhbEFsaWduIiwiSG9yaXpvbnRhbEFsaWduIiwiQ0VOVEVSIiwidGl0bGVPdXRsaW5lIiwiTGFiZWxPdXRsaW5lIiwiY2xvc2VCdG4iLCJjbG9zZUdmeCIsImNpcmNsZSIsInN0cm9rZUNvbG9yIiwibGluZVdpZHRoIiwic3Ryb2tlIiwiY2xvc2VYIiwiY2xvc2VYTGFiZWwiLCJzY2FsZVJhdGlvIiwiaWNvblNpemUiLCJmb3JtWTEiLCJmb3JtWTIiLCJnZXRDb2RlQnRuV2lkdGgiLCJidG5IZWlnaHQiLCJwaG9uZVJvd1dpZHRoIiwicGhvbmVSb3dYIiwicGhvbmVJY29uTm9kZSIsImljb25TcHJpdGUiLCJjb2RlUm93V2lkdGgiLCJjb2RlSWNvbk5vZGUiLCJnZXRDb2RlQnRuIiwiZ2V0Q29kZUJ0bkNvbXAiLCJ0cmFuc2l0aW9uIiwiVHJhbnNpdGlvbiIsIlNDQUxFIiwiem9vbVNjYWxlIiwiYnRuR2Z4IiwiYnRuTGFiZWwiLCJsYWJlbENvbXAiLCJidG5TcHJpdGUiLCJjb3VudGRvd24iLCJjb3VudGRvd25MYWJlbCIsInN0YXJ0Q291bnRkb3duIiwidGljayIsImxvZ2luQnRuWSIsImxvZ2luQnRuSGVpZ2h0IiwibG9naW5CdG5XaWR0aCIsImxvZ2luQnRuIiwibG9naW5HZngiLCJsb2dpblNwcml0ZSIsImxvZ2luQnRuQ29tcCIsInd4QnRuWSIsInd4QnRuU2l6ZSIsInd4QnRuIiwid3hCZ0dmeCIsInd4U3ByaXRlIiwid3hCdG5Db21wIiwibWVzc2FnZUxhYmVsIiwibWVzc2FnZUxhYmVsQ29tcCIsIkVkaXRCb3giLCJwbGFjZWhvbGRlckZvbnRTaXplIiwicGxhY2Vob2xkZXJGb250Q29sb3IiLCJpbnB1dEZsYWciLCJJbnB1dEZsYWciLCJTRU5TSVRJVkUiLCJpbnB1dE1vZGUiLCJJbnB1dE1vZGUiLCJOVU1FUklDIiwicGhvbmUiLCJjb2RlIiwiZ2V0SW5wdXRWYWx1ZSIsImlucHV0SWQiLCJ2YWx1ZSIsInZhbGlkYXRlUGhvbmUiLCJ0ZXN0Iiwic2hvd01lc3NhZ2UiLCJtc2ciLCJpc0Vycm9yIiwiZGVmaW5lcyIsImFwaVVybCIsIkh0dHBBUEkiLCJjcnlwdG9LZXkiLCJwb3N0RW5jcnlwdGVkIiwicmVzcCIsInhociIsIlhNTEh0dHBSZXF1ZXN0Iiwib3BlbiIsInNldFJlcXVlc3RIZWFkZXIiLCJ0aW1lb3V0Iiwib25yZWFkeXN0YXRlY2hhbmdlIiwicmVhZHlTdGF0ZSIsInN0YXR1cyIsIkpTT04iLCJwYXJzZSIsInJlc3BvbnNlVGV4dCIsInNlbmQiLCJzdHJpbmdpZnkiLCJsb2dpbkRhdGEiLCJzdWJzdHIiLCJnb2xkQ291bnQiLCJEYXRlIiwibm93IiwibG9naW5UeXBlIiwib25Mb2dpblN1Y2Nlc3MiLCJhY2NvdW50X2lkIiwibmlja25hbWUiLCJhdmF0YXIiLCJ1c2VyTmFtZSIsInVzZXJuYW1lIiwiX2NyZWF0ZUFncmVlbWVudFBvcHVwIiwiYmdNYXNrIiwiYmdNYXNrU3ByaXRlIiwicGFuZWxTcHJpdGUiLCJjbG9zZUJ0bkJnIiwiY2xvc2VCZ1Nwcml0ZSIsImNsb3NlTGFiZWxOb2RlIiwiY2xvc2VMYWJlbCIsImNsb3NlQnRuQ29tcCIsImNsb3NlSGFuZGxlciIsImRpdmlkZXJMaW5lIiwiZGl2aWRlclNwcml0ZSIsInNjcm9sbE5vZGUiLCJzY3JvbGxWaWV3IiwiU2Nyb2xsVmlldyIsImhvcml6b250YWwiLCJ2ZXJ0aWNhbCIsImluZXJ0aWEiLCJlbGFzdGljIiwidmlld05vZGUiLCJNYXNrIiwiVHlwZSIsIlJFQ1QiLCJjb250ZW50Tm9kZSIsImFuY2hvclgiLCJhbmNob3JZIiwiY29udGVudCIsInJpY2hUZXh0Tm9kZSIsInJpY2hUZXh0IiwiUmljaFRleHQiLCJtYXhXaWR0aCIsImFncmVlbWVudFRleHQiLCJzY3JvbGxUb1RvcCIsIl91c2VyQWdyZWVtZW50UG9wdXAiLCJfY2xvc2VVc2VyQWdyZWVtZW50UG9wdXAiLCJvbkRlc3Ryb3kiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUVBO0FBQ0EsSUFBSUEsc0JBQXNCLEdBQUcsS0FBN0IsRUFFQTs7QUFDQSxJQUFJQyxnQkFBZ0IsR0FBRyxTQUFuQkEsZ0JBQW1CLENBQVNDLE9BQVQsRUFBa0JDLFNBQWxCLEVBQTZCQyxPQUE3QixFQUFzQztFQUN6RCxJQUFJLENB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QjhhLFFBQVEsQ0FBQ0UsUUFBVCxHQUFvQixHQUFwQixDQXZJOEIsQ0F1SUo7SUFFMUI7O0lBQ0EsSUFBSUMsYUFBYSxHQUFHLDJDQUNoQixvREFEZ0IsR0FFaEIsd0NBRmdCLEdBR2hCLCtDQUhnQixHQUloQixxREFKZ0IsR0FLaEIsd0RBTGdCLEdBTWhCLHdDQU5nQixHQU9oQixpREFQZ0IsR0FRaEIsc0RBUmdCLEdBU2hCLDZDQVRnQixHQVVoQix3Q0FWZ0IsR0FXaEIsbURBWGdCLEdBWWhCLHFEQVpnQixHQWFoQixvQ0FiSjtJQWVBSCxRQUFRLENBQUNqTSxNQUFULEdBQWtCb00sYUFBbEIsQ0F6SjhCLENBMko5Qjs7SUFDQWxCLFVBQVUsQ0FBQ21CLFdBQVgsQ0FBdUIsQ0FBdkI7SUFFQSxLQUFLQyxtQkFBTCxHQUEyQnBMLEtBQTNCO0VBQ0gsQ0FuckRJO0VBcXJETHFMLHdCQUF3QixFQUFFLG9DQUFXO0lBQ2pDLElBQUksS0FBS0QsbUJBQVQsRUFBOEI7TUFDMUIsS0FBS0EsbUJBQUwsQ0FBeUIzSixPQUF6Qjs7TUFDQSxLQUFLMkosbUJBQUwsR0FBMkIsSUFBM0I7SUFDSDtFQUNKLENBMXJESTtFQTRyREw7RUFDQUUsU0E3ckRLLHVCQTZyRFE7SUFDVCxLQUFLbE4sMEJBQUw7RUFDSDtBQS9yREksQ0FBVCIsInNvdXJjZVJvb3QiOiIvIiwic291cmNlc0NvbnRlbnQiOlsiLy8g55m75b2V5Zy65pmv5o6n5Yi25ZmoXG4vLyDkvb/nlKjngrnlh7vkuovku7blrp7njrDlpI3pgInmoYblip/og73vvIjkuI3kvp3otZYgVG9nZ2xlIOe7hOS7tu+8iVxuXG4vLyDlhajlsYDmoLflvI/kv67lpI3lh73mlbAgLSDmm7TlvLrlpKfnmoTniYjmnKxcbnZhciBfZ2xvYmFsU3R5bGVGaXhBcHBsaWVkID0gZmFsc2U7XG5cbi8vIOi+heWKqeWHveaVsO+8muS/ruWkjVdlYuW5s+WPsEVkaXRCb3jnmoRDU1PmoLflvI/vvIjlop7lvLrniYjvvIlcbnZhciBfZml4RWRpdEJveFN0eWxlID0gZnVuY3Rpb24oZWRpdEJveCwgZm9udENvbG9yLCBiZ0NvbG9yKSB7XG4gICAgaWYgKCFjYy5zeXMuaXNCcm93c2VyKSByZXR1cm47XG5cbiAgICBmb250Q29sb3IgPSBmb250Q29sb3IgfHwgJyMwMDAwMDAnO1xuICAgIGJnQ29sb3IgPSBiZ0NvbG9yIHx8ICcjZmZmZmZmJztcblxuXG4gICAgLy8g56uL5Y2z5bCd6K+V5L+u5aSNXG4gICAgX2FwcGx5SW5wdXRTdHlsZXMoZm9udENvbG9yLCBiZ0NvbG9yKTtcblxuICAgIC8vIOW7tui/n+S/ruWkje+8iOetieW+hUhUTUwgaW5wdXTlhYPntKDliJvlu7rvvIlcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBfYXBwbHlJbnB1dFN0eWxlcyhmb250Q29sb3IsIGJnQ29sb3IpOyB9LCA1MCk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgX2FwcGx5SW5wdXRTdHlsZXMoZm9udENvbG9yLCBiZ0NvbG9yKTsgfSwgMTAwKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBfYXBwbHlJbnB1dFN0eWxlcyhmb250Q29sb3IsIGJnQ29sb3IpOyB9LCAyMDApO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IF9hcHBseUlucHV0U3R5bGVzKGZvbnRDb2xvciwgYmdDb2xvcik7IH0sIDUwMCk7XG5cbiAgICAvLyDms6jlhaXlhajlsYBDU1PmoLflvI/vvIjmnIDpq5jkvJjlhYjnuqfvvIlcbiAgICBpZiAoIV9nbG9iYWxTdHlsZUZpeEFwcGxpZWQpIHtcbiAgICAgICAgX2dsb2JhbFN0eWxlRml4QXBwbGllZCA9IHRydWU7XG4gICAgICAgIF9pbmplY3RHbG9iYWxTdHlsZXMoZm9udENvbG9yLCBiZ0NvbG9yKTtcbiAgICB9XG59O1xuXG4vLyDlupTnlKjmoLflvI/liLDmiYDmnIlpbnB1dOWFg+e0oFxudmFyIF9hcHBseUlucHV0U3R5bGVzID0gZnVuY3Rpb24oZm9udENvbG9yLCBiZ0NvbG9yKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIGlucHV0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0Jyk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBpbnB1dCA9IGlucHV0c1tpXTtcbiAgICAgICAgICAgIF9zdHlsZVNpbmdsZUlucHV0KGlucHV0LCBmb250Q29sb3IsIGJnQ29sb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Lmf5aSE55CGIHRleHRhcmVh77yI5Y+v6IO96KKr55So5LqOIEVkaXRCb3jvvIlcbiAgICAgICAgdmFyIHRleHRhcmVhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RleHRhcmVhJyk7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGV4dGFyZWFzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBfc3R5bGVTaW5nbGVJbnB1dCh0ZXh0YXJlYXNbal0sIGZvbnRDb2xvciwgYmdDb2xvcik7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+S/ruWkjUVkaXRCb3jmoLflvI/lpLHotKU6JywgZSk7XG4gICAgfVxufTtcblxuLy8g5qC35byP5YyW5Y2V5LiqaW5wdXTlhYPntKAgLSDkv67lpI3niYjvvJrmloflrZflnoLnm7TlsYXkuK0gKyDpgI/mmI7og4zmma/kuI3pga7mjKHovrnmoYZcbi8vIOazqOaEj++8mui3s+i/h+WOn+eUn+i+k+WFpeahhu+8iG5hdGl2ZS1waG9uZS1pbnB1dCwgbmF0aXZlLWNvZGUtaW5wdXTvvInvvIzlm6DkuLrlroPku6zmnInnsr7noa7nmoTkvY3nva7orr7nva5cbnZhciBfc3R5bGVTaW5nbGVJbnB1dCA9IGZ1bmN0aW9uKGlucHV0LCBmb250Q29sb3IsIGJnQ29sb3IpIHtcbiAgICAvLyDimIUg6Lez6L+H5Y6f55Sf6L6T5YWl5qGG77yM5a6D5Lus5bey57uP5pyJ5q2j56Gu55qE5qC35byPXG4gICAgaWYgKGlucHV0LmlkID09PSAnbmF0aXZlLXBob25lLWlucHV0JyB8fCBpbnB1dC5pZCA9PT0gJ25hdGl2ZS1jb2RlLWlucHV0Jykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09IOaguOW/g+agt+W8j+iuvue9riA9PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8vIDEuIOaWh+Wtl+minOiJslxuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdjb2xvcicsIGZvbnRDb2xvciwgJ2ltcG9ydGFudCcpO1xuICAgIGlucHV0LnN0eWxlLmNvbG9yID0gZm9udENvbG9yO1xuICAgIFxuICAgIC8vIDIuIOWFs+mUru+8muiuvue9rumAj+aYjuiDjOaZr++8jOiuqSBDb2NvcyDnu5jliLbnmoTovrnmoYblj6/op4FcbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnYmFja2dyb3VuZC1jb2xvcicsICd0cmFuc3BhcmVudCcsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAndHJhbnNwYXJlbnQnO1xuICAgIFxuICAgIC8vIDMuIOaWh+Wtl+WeguebtOWxheS4rSAtIOS9v+eUqCBGbGV4Ym94IOaWueahiO+8iOacgOWPr+mdoO+8iVxuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdkaXNwbGF5JywgJ2ZsZXgnLCAnaW1wb3J0YW50Jyk7XG4gICAgaW5wdXQuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnYWxpZ24taXRlbXMnLCAnY2VudGVyJywgJ2ltcG9ydGFudCcpO1xuICAgIGlucHV0LnN0eWxlLmFsaWduSXRlbXMgPSAnY2VudGVyJztcbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnanVzdGlmeS1jb250ZW50JywgJ2ZsZXgtc3RhcnQnLCAnaW1wb3J0YW50Jyk7XG4gICAgaW5wdXQuc3R5bGUuanVzdGlmeUNvbnRlbnQgPSAnZmxleC1zdGFydCc7XG4gICAgXG4gICAgLy8gNC4g55uS5qih5Z6L6K6+572uXG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJ2JveC1zaXppbmcnLCAnYm9yZGVyLWJveCcsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS5ib3hTaXppbmcgPSAnYm9yZGVyLWJveCc7XG4gICAgXG4gICAgLy8gNS4g5YaF6L656LedIC0g57uZ5paH5a2X55WZ5Ye656m66Ze077yM6YG/5YWN6LS06L65XG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJ3BhZGRpbmcnLCAnMCAxMnB4JywgJ2ltcG9ydGFudCcpO1xuICAgIGlucHV0LnN0eWxlLnBhZGRpbmcgPSAnMCAxMnB4JztcbiAgICBcbiAgICAvLyA2LiDooYzpq5jorr7nva4gLSDkuI7lrZfkvZPlpKflsI/ljLnphY3vvIznoa7kv53lnoLnm7TlsYXkuK1cbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnbGluZS1oZWlnaHQnLCAnMScsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS5saW5lSGVpZ2h0ID0gJzEnO1xuICAgIFxuICAgIC8vIDcuIOmrmOW6puiHqumAguW6lOWGheWuuVxuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdoZWlnaHQnLCAnMTAwJScsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5a2X5L2T6K6+572uID09PT09PT09PT09PT09PT09PT09XG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJ2ZvbnQtc2l6ZScsICcyMHB4JywgJ2ltcG9ydGFudCcpO1xuICAgIGlucHV0LnN0eWxlLmZvbnRTaXplID0gJzIwcHgnO1xuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdmb250LWZhbWlseScsICdBcmlhbCwgXCJNaWNyb3NvZnQgWWFIZWlcIiwgc2Fucy1zZXJpZicsICdpbXBvcnRhbnQnKTtcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PSBXZWJLaXQg54m55q6K5L+u5aSNID09PT09PT09PT09PT09PT09PT09XG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJy13ZWJraXQtdGV4dC1maWxsLWNvbG9yJywgZm9udENvbG9yLCAnaW1wb3J0YW50Jyk7XG4gICAgaW5wdXQuc3R5bGUud2Via2l0VGV4dEZpbGxDb2xvciA9IGZvbnRDb2xvcjtcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDlj6/op4HmgKfnoa7kv50gPT09PT09PT09PT09PT09PT09PT1cbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnb3BhY2l0eScsICcxJywgJ2ltcG9ydGFudCcpO1xuICAgIGlucHV0LnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09IOWFieagh+minOiJsiA9PT09PT09PT09PT09PT09PT09PVxuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdjYXJldC1jb2xvcicsIGZvbnRDb2xvciwgJ2ltcG9ydGFudCcpO1xuICAgIGlucHV0LnN0eWxlLmNhcmV0Q29sb3IgPSBmb250Q29sb3I7XG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT0g56e76Zmk5bmy5omw5qC35byPID09PT09PT09PT09PT09PT09PT09XG4gICAgaW5wdXQuc3R5bGUudGV4dFNoYWRvdyA9ICdub25lJztcbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgndGV4dC1zaGFkb3cnLCAnbm9uZScsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS5vdXRsaW5lID0gJ25vbmUnO1xuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdvdXRsaW5lJywgJ25vbmUnLCAnaW1wb3J0YW50Jyk7XG4gICAgaW5wdXQuc3R5bGUuYm9yZGVyID0gJ25vbmUnO1xuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdib3JkZXInLCAnbm9uZScsICdpbXBvcnRhbnQnKTtcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDnp7vpmaTlrprkvY3lubLmibAgPT09PT09PT09PT09PT09PT09PT1cbiAgICBpbnB1dC5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgndG9wJyk7XG4gICAgaW5wdXQuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ21hcmdpbi10b3AnKTtcbiAgICBpbnB1dC5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgnbWFyZ2luJyk7XG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT0g6IGa54Sm5pe25L+d5oyB5qC35byPID09PT09PT09PT09PT09PT09PT09XG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJ291dGxpbmUtb2Zmc2V0JywgJzAnLCAnaW1wb3J0YW50Jyk7XG59O1xuXG4vLyDms6jlhaXlhajlsYBDU1PmoLflvI8gLSDkv67lpI3niYjvvIjmjpLpmaTljp/nlJ/ovpPlhaXmoYbvvIlcbnZhciBfaW5qZWN0R2xvYmFsU3R5bGVzID0gZnVuY3Rpb24oZm9udENvbG9yLCBiZ0NvbG9yKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHN0eWxlSWQgPSAnY29jb3MtZWRpdGJveC1maXgtc3R5bGUnO1xuICAgICAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoc3R5bGVJZCkpIHJldHVybjtcblxuICAgICAgICB2YXIgY3NzID0gYFxuICAgICAgICAgICAgLyog6L6T5YWl5qGG5Z+656GA5qC35byPIC0g6YCP5piO6IOM5pmvICsg5paH5a2X5bGF5LitICovXG4gICAgICAgICAgICAvKiDms6jmhI/vvJrmjpLpmaTljp/nlJ/ovpPlhaXmoYYgI25hdGl2ZS1waG9uZS1pbnB1dCwgI25hdGl2ZS1jb2RlLWlucHV0ICovXG4gICAgICAgICAgICBpbnB1dDpub3QoI25hdGl2ZS1waG9uZS1pbnB1dCk6bm90KCNuYXRpdmUtY29kZS1pbnB1dCksIFxuICAgICAgICAgICAgdGV4dGFyZWE6bm90KCNuYXRpdmUtcGhvbmUtaW5wdXQpOm5vdCgjbmF0aXZlLWNvZGUtaW5wdXQpIHtcbiAgICAgICAgICAgICAgICBjb2xvcjogJHtmb250Q29sb3J9ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAxICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgdmlzaWJpbGl0eTogdmlzaWJsZSAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMjBweCAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIC13ZWJraXQtdGV4dC1maWxsLWNvbG9yOiAke2ZvbnRDb2xvcn0gIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBjYXJldC1jb2xvcjogJHtmb250Q29sb3J9ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgbGluZS1oZWlnaHQ6IDEgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBib3JkZXI6IG5vbmUgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBvdXRsaW5lOiBub25lICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8qIFBsYWNlaG9sZGVyIOagt+W8jyAqL1xuICAgICAgICAgICAgaW5wdXQ6OnBsYWNlaG9sZGVyLCB0ZXh0YXJlYTo6cGxhY2Vob2xkZXIge1xuICAgICAgICAgICAgICAgIGNvbG9yOiAjODg4ODg4ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMSAhaW1wb3J0YW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvKiDogZrnhKbnirbmgIEgKi9cbiAgICAgICAgICAgIGlucHV0OmZvY3VzOm5vdCgjbmF0aXZlLXBob25lLWlucHV0KTpub3QoI25hdGl2ZS1jb2RlLWlucHV0KSwgXG4gICAgICAgICAgICB0ZXh0YXJlYTpmb2N1czpub3QoI25hdGl2ZS1waG9uZS1pbnB1dCk6bm90KCNuYXRpdmUtY29kZS1pbnB1dCkge1xuICAgICAgICAgICAgICAgIGNvbG9yOiAke2ZvbnRDb2xvcn0gIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBvdXRsaW5lOiBub25lICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQgIWltcG9ydGFudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLyog5paH5pys57G75Z6L6L6T5YWl5qGGIC0gRmxleGJveCDlnoLnm7TlsYXkuK3vvIjmjpLpmaTljp/nlJ/ovpPlhaXmoYbvvIkqL1xuICAgICAgICAgICAgaW5wdXRbdHlwZT1cInRleHRcIl06bm90KCNuYXRpdmUtcGhvbmUtaW5wdXQpOm5vdCgjbmF0aXZlLWNvZGUtaW5wdXQpLCBcbiAgICAgICAgICAgIGlucHV0W3R5cGU9XCJudW1iZXJcIl06bm90KCNuYXRpdmUtcGhvbmUtaW5wdXQpOm5vdCgjbmF0aXZlLWNvZGUtaW5wdXQpLCBcbiAgICAgICAgICAgIGlucHV0W3R5cGU9XCJ0ZWxcIl06bm90KCNuYXRpdmUtcGhvbmUtaW5wdXQpOm5vdCgjbmF0aXZlLWNvZGUtaW5wdXQpLFxuICAgICAgICAgICAgaW5wdXRbdHlwZT1cInBhc3N3b3JkXCJdOm5vdCgjbmF0aXZlLXBob25lLWlucHV0KTpub3QoI25hdGl2ZS1jb2RlLWlucHV0KSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheTogZmxleCAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXIgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgcGFkZGluZzogMCAxMnB4ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAxMDAlICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgbGluZS1oZWlnaHQ6IDEgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBib3JkZXI6IG5vbmUgIWltcG9ydGFudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLyog56e76Zmk5rWP6KeI5Zmo6buY6K6k5qC35byPICovXG4gICAgICAgICAgICBpbnB1dDpmb2N1cyxcbiAgICAgICAgICAgIHRleHRhcmVhOmZvY3VzIHtcbiAgICAgICAgICAgICAgICBib3gtc2hhZG93OiBub25lICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIGA7XG5cbiAgICAgICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgc3R5bGUuaWQgPSBzdHlsZUlkO1xuICAgICAgICBzdHlsZS50eXBlID0gJ3RleHQvY3NzJztcbiAgICAgICAgc3R5bGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzKSk7XG4gICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfms6jlhaXlhajlsYDmoLflvI/lpLHotKU6JywgZSk7XG4gICAgfVxufTtcblxuLy8g5Yib5bu65Y6f55SfIEhUTUwgaW5wdXQg5YWD57Sg77yI57uV6L+HIENvY29zIEVkaXRCb3gg55qE6Zeu6aKY77yJXG4vLyDmlLnov5vniYggdjTvvJrkvb/nlKjoioLngrnkuJbnlYzlnZDmoIfnsr7noa7lrprkvY1cbnZhciBfY3JlYXRlTmF0aXZlSW5wdXRFbGVtZW50cyA9IGZ1bmN0aW9uKHBhbmVsLCBwaG9uZUlucHV0Tm9kZSwgY29kZUlucHV0Tm9kZSwgaW5wdXRXaWR0aCwgaW5wdXRIZWlnaHQsIGNvZGVJbnB1dFcsIHBhbmVsV2lkdGgsIHBhbmVsSGVpZ2h0KSB7XG4gICAgaWYgKCFjYy5zeXMuaXNCcm93c2VyKSByZXR1cm47XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgICAgLy8g6I635Y+WIENhbnZhcyDlhYPntKBcbiAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdHYW1lQ2FudmFzJykgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignY2FudmFzJyk7XG4gICAgICAgIGlmICghY2FudmFzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfmib7kuI3liLAgQ2FudmFzIOWFg+e0oCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgY2FudmFzUmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgdmFyIHdpblNpemUgPSBjYy53aW5TaXplO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coJz09PSDliJvlu7rljp/nlJ/ovpPlhaXmoYbvvIh2NCAtIOS9v+eUqOiKgueCueS4lueVjOWdkOagh++8iT09PScpO1xuICAgICAgICBjb25zb2xlLmxvZygnQ2FudmFzIOS9jee9rjonLCBjYW52YXNSZWN0LmxlZnQsIGNhbnZhc1JlY3QudG9wKTtcbiAgICAgICAgY29uc29sZS5sb2coJ0NhbnZhcyDlsLrlr7g6JywgY2FudmFzUmVjdC53aWR0aCwgJ3gnLCBjYW52YXNSZWN0LmhlaWdodCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCfmuLjmiI/liIbovqjnjoc6Jywgd2luU2l6ZS53aWR0aCwgJ3gnLCB3aW5TaXplLmhlaWdodCk7XG4gICAgICAgIFxuICAgICAgICAvLyDorqHnrpfnvKnmlL7mr5TkvovvvIhDYW52YXMg5a6e6ZmF5bC65a+4IC8g5ri45oiP6K6+6K6h5YiG6L6o546H77yJXG4gICAgICAgIHZhciBzY2FsZVggPSBjYW52YXNSZWN0LndpZHRoIC8gd2luU2l6ZS53aWR0aDtcbiAgICAgICAgdmFyIHNjYWxlWSA9IGNhbnZhc1JlY3QuaGVpZ2h0IC8gd2luU2l6ZS5oZWlnaHQ7XG4gICAgICAgIGNvbnNvbGUubG9nKCfnvKnmlL7mr5Tkvos6Jywgc2NhbGVYLnRvRml4ZWQoMyksIHNjYWxlWS50b0ZpeGVkKDMpKTtcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOWFs+mUruaUuei/m++8muS9v+eUqOiKgueCueS4lueVjOWdkOaghyA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyDnm7TmjqXkvb/nlKggQ29jb3Mg6IqC54K555qE5LiW55WM5Z2Q5qCH77yM6ICM5LiN5piv5omL5Yqo6K6h566X5YGP56e7XG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5bovpPlhaXmoYboioLngrnnmoTkuJbnlYzlnZDmoIdcbiAgICAgICAgdmFyIHBob25lV29ybGRQb3MgPSBwaG9uZUlucHV0Tm9kZS5jb252ZXJ0VG9Xb3JsZFNwYWNlQVIoY2MudjIoMCwgMCkpO1xuICAgICAgICB2YXIgY29kZVdvcmxkUG9zID0gY29kZUlucHV0Tm9kZS5jb252ZXJ0VG9Xb3JsZFNwYWNlQVIoY2MudjIoMCwgMCkpO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coJ+aJi+acuui+k+WFpeahhuS4lueVjOWdkOaghzonLCBwaG9uZVdvcmxkUG9zLngudG9GaXhlZCgxKSwgcGhvbmVXb3JsZFBvcy55LnRvRml4ZWQoMSkpO1xuICAgICAgICBjb25zb2xlLmxvZygn6aqM6K+B56CB6L6T5YWl5qGG5LiW55WM5Z2Q5qCHOicsIGNvZGVXb3JsZFBvcy54LnRvRml4ZWQoMSksIGNvZGVXb3JsZFBvcy55LnRvRml4ZWQoMSkpO1xuICAgICAgICBcbiAgICAgICAgLy8g4piF4piF4piFIOS9jee9ruW+ruiwg+WPguaVsO+8iOWmguaenOmcgOimgeW+ruiwg++8jOS/ruaUuei/memHjO+8ieKYheKYheKYhVxuICAgICAgICB2YXIgcGhvbmVPZmZzZXRYID0gMDsgICAgLy8g5omL5py66L6T5YWl5qGGIFgg5YGP56e7XG4gICAgICAgIHZhciBwaG9uZU9mZnNldFkgPSAwOyAgICAvLyDmiYvmnLrovpPlhaXmoYYgWSDlgY/np7tcbiAgICAgICAgdmFyIGNvZGVPZmZzZXRYID0gMDsgICAgIC8vIOmqjOivgeeggei+k+WFpeahhiBYIOWBj+enu1xuICAgICAgICB2YXIgY29kZU9mZnNldFkgPSAwOyAgICAgLy8g6aqM6K+B56CB6L6T5YWl5qGGIFkg5YGP56e7XG4gICAgICAgIFxuICAgICAgICAvLyDimIXimIXimIUg5bC65a+45Y+C5pWwIOKYheKYheKYhVxuICAgICAgICB2YXIgYWN0dWFsSW5wdXRXaWR0aCA9IGlucHV0V2lkdGg7ICAgICAgLy8g5L2/55So5Lyg5YWl55qE6L6T5YWl5qGG5a695bqmXG4gICAgICAgIHZhciBhY3R1YWxJbnB1dEhlaWdodCA9IGlucHV0SGVpZ2h0OyAgICAvLyDkvb/nlKjkvKDlhaXnmoTovpPlhaXmoYbpq5jluqZcbiAgICAgICAgdmFyIGFjdHVhbENvZGVJbnB1dFdpZHRoID0gY29kZUlucHV0VzsgIC8vIOS9v+eUqOS8oOWFpeeahOmqjOivgeeggei+k+WFpeahhuWuveW6plxuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coJz09PSDovpPlhaXmoYblsLrlr7ggPT09Jyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCfmiYvmnLrovpPlhaXmoYY6JywgYWN0dWFsSW5wdXRXaWR0aCwgJ3gnLCBhY3R1YWxJbnB1dEhlaWdodCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCfpqozor4HnoIHovpPlhaXmoYY6JywgYWN0dWFsQ29kZUlucHV0V2lkdGgsICd4JywgYWN0dWFsSW5wdXRIZWlnaHQpO1xuICAgICAgICBcbiAgICAgICAgLy8g6K6h566X5bGP5bmV5L2N572u77yI5LiW55WM5Z2Q5qCHIC0+IOWxj+W5leWdkOagh++8iVxuICAgICAgICAvLyBDb2NvcyDlnZDmoIfns7vvvJrljp/ngrnlt6bkuIvop5LvvIxZIOWQkeS4ilxuICAgICAgICAvLyBIVE1MIOWdkOagh+ezu++8muWOn+eCueW3puS4iuinku+8jFkg5ZCR5LiLXG4gICAgICAgIHZhciBjYWxjU2NyZWVuUG9zRnJvbVdvcmxkID0gZnVuY3Rpb24od29ybGRQb3MsIG5vZGVXaWR0aCwgbm9kZUhlaWdodCwgb2Zmc2V0WCwgb2Zmc2V0WSkge1xuICAgICAgICAgICAgLy8g5LiW55WM5Z2Q5qCH6L2s5o2i5Li65bGP5bmV5Z2Q5qCHXG4gICAgICAgICAgICB2YXIgc2NyZWVuWCA9IHdvcmxkUG9zLnggKyBvZmZzZXRYO1xuICAgICAgICAgICAgdmFyIHNjcmVlblkgPSB3b3JsZFBvcy55ICsgb2Zmc2V0WTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6L2s5o2i5Li6IENhbnZhcyDlnZDmoIdcbiAgICAgICAgICAgIHZhciBjYW52YXNYID0gc2NyZWVuWCAqIHNjYWxlWDtcbiAgICAgICAgICAgIHZhciBjYW52YXNZID0gY2FudmFzUmVjdC5oZWlnaHQgLSBzY3JlZW5ZICogc2NhbGVZOyAgLy8gWSDovbTnv7vovaxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6K6h566X5a6e6ZmF5bC65a+4XG4gICAgICAgICAgICB2YXIgYWN0dWFsV2lkdGggPSBub2RlV2lkdGggKiBzY2FsZVg7XG4gICAgICAgICAgICB2YXIgYWN0dWFsSGVpZ2h0ID0gbm9kZUhlaWdodCAqIHNjYWxlWTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBsZWZ0OiBjYW52YXNSZWN0LmxlZnQgKyBjYW52YXNYIC0gYWN0dWFsV2lkdGggLyAyLFxuICAgICAgICAgICAgICAgIHRvcDogY2FudmFzUmVjdC50b3AgKyBjYW52YXNZIC0gYWN0dWFsSGVpZ2h0IC8gMixcbiAgICAgICAgICAgICAgICB3aWR0aDogYWN0dWFsV2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBhY3R1YWxIZWlnaHRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICB2YXIgcGhvbmVTY3JlZW4gPSBjYWxjU2NyZWVuUG9zRnJvbVdvcmxkKHBob25lV29ybGRQb3MsIGFjdHVhbElucHV0V2lkdGgsIGFjdHVhbElucHV0SGVpZ2h0LCBwaG9uZU9mZnNldFgsIHBob25lT2Zmc2V0WSk7XG4gICAgICAgIHZhciBjb2RlU2NyZWVuID0gY2FsY1NjcmVlblBvc0Zyb21Xb3JsZChjb2RlV29ybGRQb3MsIGFjdHVhbENvZGVJbnB1dFdpZHRoLCBhY3R1YWxJbnB1dEhlaWdodCwgY29kZU9mZnNldFgsIGNvZGVPZmZzZXRZKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKCfmiYvmnLrovpPlhaXmoYblsY/luZXkvY3nva46JywgcGhvbmVTY3JlZW4pO1xuICAgICAgICBjb25zb2xlLmxvZygn6aqM6K+B56CB6L6T5YWl5qGG5bGP5bmV5L2N572uOicsIGNvZGVTY3JlZW4pO1xuICAgICAgICBcbiAgICAgICAgLy8g6L6555WM5qOA5p+l77ya56Gu5L+d6L6T5YWl5qGG5Zyo5bGP5bmV5Y+v6KeB5Yy65Z+f5YaFXG4gICAgICAgIHBob25lU2NyZWVuLmxlZnQgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihjYW52YXNSZWN0LndpZHRoIC0gcGhvbmVTY3JlZW4ud2lkdGgsIHBob25lU2NyZWVuLmxlZnQpKTtcbiAgICAgICAgcGhvbmVTY3JlZW4udG9wID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oY2FudmFzUmVjdC5oZWlnaHQgLSBwaG9uZVNjcmVlbi5oZWlnaHQsIHBob25lU2NyZWVuLnRvcCkpO1xuICAgICAgICBjb2RlU2NyZWVuLmxlZnQgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihjYW52YXNSZWN0LndpZHRoIC0gY29kZVNjcmVlbi53aWR0aCwgY29kZVNjcmVlbi5sZWZ0KSk7XG4gICAgICAgIGNvZGVTY3JlZW4udG9wID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oY2FudmFzUmVjdC5oZWlnaHQgLSBjb2RlU2NyZWVuLmhlaWdodCwgY29kZVNjcmVlbi50b3ApKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKCfovrnnlYzmo4Dmn6XlkI7kvY3nva46Jyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCcgIOaJi+acuui+k+WFpeahhjonLCBwaG9uZVNjcmVlbi5sZWZ0LnRvRml4ZWQoMSksIHBob25lU2NyZWVuLnRvcC50b0ZpeGVkKDEpKTtcbiAgICAgICAgY29uc29sZS5sb2coJyAg6aqM6K+B56CB6L6T5YWl5qGGOicsIGNvZGVTY3JlZW4ubGVmdC50b0ZpeGVkKDEpLCBjb2RlU2NyZWVuLnRvcC50b0ZpeGVkKDEpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOenu+mZpOaXp+eahOWuueWZqOWSjOi+k+WFpeahhlxuICAgICAgICB2YXIgb2xkQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdGl2ZS1pbnB1dC1jb250YWluZXInKTtcbiAgICAgICAgaWYgKG9sZENvbnRhaW5lcikge1xuICAgICAgICAgICAgb2xkQ29udGFpbmVyLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDliJvlu7rmlrDnmoTlrrnlmajvvIjnm7TmjqXmlL7lnKggYm9keSDkuIvvvIznoa7kv53kuI3ooqvpga7mjKHvvIlcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBjb250YWluZXIuaWQgPSAnbmF0aXZlLWlucHV0LWNvbnRhaW5lcic7XG4gICAgICAgIGNvbnRhaW5lci5zdHlsZS5jc3NUZXh0ID0gW1xuICAgICAgICAgICAgJ3Bvc2l0aW9uOiBmaXhlZCcsXG4gICAgICAgICAgICAndG9wOiAwJyxcbiAgICAgICAgICAgICdsZWZ0OiAwJyxcbiAgICAgICAgICAgICd3aWR0aDogMTAwJScsXG4gICAgICAgICAgICAnaGVpZ2h0OiAxMDAlJyxcbiAgICAgICAgICAgICdwb2ludGVyLWV2ZW50czogbm9uZScsXG4gICAgICAgICAgICAnei1pbmRleDogOTk5OTknXG4gICAgICAgIF0uam9pbignOyAnKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65omL5py65Y+36L6T5YWl5qGGXG4gICAgICAgIHZhciBwaG9uZUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgcGhvbmVJbnB1dC5pZCA9ICduYXRpdmUtcGhvbmUtaW5wdXQnO1xuICAgICAgICBwaG9uZUlucHV0LnR5cGUgPSAndGVsJztcbiAgICAgICAgcGhvbmVJbnB1dC5wbGFjZWhvbGRlciA9ICfor7fovpPlhaXmiYvmnLrlj7cnO1xuICAgICAgICBwaG9uZUlucHV0Lm1heExlbmd0aCA9IDExO1xuICAgICAgICBwaG9uZUlucHV0LnN0eWxlLmNzc1RleHQgPSBbXG4gICAgICAgICAgICAncG9zaXRpb246IGFic29sdXRlJyxcbiAgICAgICAgICAgICdsZWZ0OiAnICsgcGhvbmVTY3JlZW4ubGVmdCArICdweCcsXG4gICAgICAgICAgICAndG9wOiAnICsgcGhvbmVTY3JlZW4udG9wICsgJ3B4JyxcbiAgICAgICAgICAgICd3aWR0aDogJyArIHBob25lU2NyZWVuLndpZHRoICsgJ3B4JyxcbiAgICAgICAgICAgICdoZWlnaHQ6ICcgKyBwaG9uZVNjcmVlbi5oZWlnaHQgKyAncHgnLFxuICAgICAgICAgICAgJ2JhY2tncm91bmQ6IHRyYW5zcGFyZW50JyxcbiAgICAgICAgICAgICdib3JkZXI6IG5vbmUnLFxuICAgICAgICAgICAgJ2JvcmRlci1yYWRpdXM6IDAnLFxuICAgICAgICAgICAgJ2ZvbnQtc2l6ZTogMTJweCcsXG4gICAgICAgICAgICAnY29sb3I6ICMzMzMnLFxuICAgICAgICAgICAgJ3BhZGRpbmc6IDAgOHB4JyxcbiAgICAgICAgICAgICdib3gtc2l6aW5nOiBib3JkZXItYm94JyxcbiAgICAgICAgICAgICdvdXRsaW5lOiBub25lJyxcbiAgICAgICAgICAgICdwb2ludGVyLWV2ZW50czogYXV0bycsXG4gICAgICAgICAgICAnei1pbmRleDogMTAwMDAwJyxcbiAgICAgICAgICAgICdjdXJzb3I6IHRleHQnLFxuICAgICAgICAgICAgJ2ZvbnQtZmFtaWx5OiBBcmlhbCwgXCJNaWNyb3NvZnQgWWFIZWlcIiwgc2Fucy1zZXJpZicsXG4gICAgICAgICAgICAnbGluZS1oZWlnaHQ6ICcgKyBwaG9uZVNjcmVlbi5oZWlnaHQgKyAncHgnLFxuICAgICAgICAgICAgJ3RleHQtYWxpZ246IGxlZnQnXG4gICAgICAgIF0uam9pbignOyAnKTtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHBob25lSW5wdXQpO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu66aqM6K+B56CB6L6T5YWl5qGGXG4gICAgICAgIHZhciBjb2RlSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICBjb2RlSW5wdXQuaWQgPSAnbmF0aXZlLWNvZGUtaW5wdXQnO1xuICAgICAgICBjb2RlSW5wdXQudHlwZSA9ICd0ZXh0JztcbiAgICAgICAgY29kZUlucHV0LnBsYWNlaG9sZGVyID0gJ+mqjOivgeeggSc7XG4gICAgICAgIGNvZGVJbnB1dC5tYXhMZW5ndGggPSA2O1xuICAgICAgICBjb2RlSW5wdXQuc3R5bGUuY3NzVGV4dCA9IFtcbiAgICAgICAgICAgICdwb3NpdGlvbjogYWJzb2x1dGUnLFxuICAgICAgICAgICAgJ2xlZnQ6ICcgKyBjb2RlU2NyZWVuLmxlZnQgKyAncHgnLFxuICAgICAgICAgICAgJ3RvcDogJyArIGNvZGVTY3JlZW4udG9wICsgJ3B4JyxcbiAgICAgICAgICAgICd3aWR0aDogJyArIGNvZGVTY3JlZW4ud2lkdGggKyAncHgnLFxuICAgICAgICAgICAgJ2hlaWdodDogJyArIGNvZGVTY3JlZW4uaGVpZ2h0ICsgJ3B4JyxcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAnYm9yZGVyOiBub25lJyxcbiAgICAgICAgICAgICdib3JkZXItcmFkaXVzOiAwJyxcbiAgICAgICAgICAgICdmb250LXNpemU6IDEycHgnLFxuICAgICAgICAgICAgJ2NvbG9yOiAjMzMzJyxcbiAgICAgICAgICAgICdwYWRkaW5nOiAwIDhweCcsXG4gICAgICAgICAgICAnYm94LXNpemluZzogYm9yZGVyLWJveCcsXG4gICAgICAgICAgICAnb3V0bGluZTogbm9uZScsXG4gICAgICAgICAgICAncG9pbnRlci1ldmVudHM6IGF1dG8nLFxuICAgICAgICAgICAgJ3otaW5kZXg6IDEwMDAwMCcsXG4gICAgICAgICAgICAnY3Vyc29yOiB0ZXh0JyxcbiAgICAgICAgICAgICdmb250LWZhbWlseTogQXJpYWwsIFwiTWljcm9zb2Z0IFlhSGVpXCIsIHNhbnMtc2VyaWYnLFxuICAgICAgICAgICAgJ2xpbmUtaGVpZ2h0OiAnICsgY29kZVNjcmVlbi5oZWlnaHQgKyAncHgnLFxuICAgICAgICAgICAgJ3RleHQtYWxpZ246IGxlZnQnXG4gICAgICAgIF0uam9pbignOyAnKTtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNvZGVJbnB1dCk7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDnhKbngrnkuovku7bosIPor5VcbiAgICAgICAgcGhvbmVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ+aJi+acuui+k+WFpeahhuiOt+W+l+eEpueCuScpO1xuICAgICAgICB9KTtcbiAgICAgICAgcGhvbmVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ+aJi+acuui+k+WFpeahhuiiq+eCueWHuycpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29kZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygn6aqM6K+B56CB6L6T5YWl5qGG6I635b6X54Sm54K5Jyk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb2RlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfpqozor4HnoIHovpPlhaXmoYbooqvngrnlh7snKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZygn5Y6f55Sf6L6T5YWl5qGG5Yib5bu65a6M5oiQJyk7XG4gICAgICAgIFxuICAgICAgICAvLyDlu7bov5/mo4Dmn6XovpPlhaXmoYbmmK/lkKbmraPnoa7liJvlu7pcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBwaG9uZUNoZWNrID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdGl2ZS1waG9uZS1pbnB1dCcpO1xuICAgICAgICAgICAgdmFyIGNvZGVDaGVjayA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXRpdmUtY29kZS1pbnB1dCcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ+i+k+WFpeahhuajgOafpTonKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCcgIOaJi+acuui+k+WFpeahhjonLCBwaG9uZUNoZWNrID8gJ+WtmOWcqCcgOiAn5LiN5a2Y5ZyoJyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnICDpqozor4HnoIHovpPlhaXmoYY6JywgY29kZUNoZWNrID8gJ+WtmOWcqCcgOiAn5LiN5a2Y5ZyoJyk7XG4gICAgICAgICAgICBpZiAocGhvbmVDaGVjaykge1xuICAgICAgICAgICAgICAgIHZhciByZWN0ID0gcGhvbmVDaGVjay5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnICDmiYvmnLrovpPlhaXmoYbkvY3nva46JywgcmVjdC5sZWZ0LCByZWN0LnRvcCwgcmVjdC53aWR0aCwgJ3gnLCByZWN0LmhlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDEwMCk7XG4gICAgICAgIFxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign5Yib5bu65Y6f55Sf6L6T5YWl5qGG5aSx6LSlOicsIGUpO1xuICAgIH1cbn07XG5cbi8vIOenu+mZpOWOn+eUnyBIVE1MIOi+k+WFpeahhuWFg+e0oO+8iOeZu+W9leaIkOWKn+aIluWFs+mXreW8ueeql+aXtuiwg+eUqO+8iVxudmFyIF9yZW1vdmVOYXRpdmVJbnB1dEVsZW1lbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFjYy5zeXMuaXNCcm93c2VyKSByZXR1cm47XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXRpdmUtaW5wdXQtY29udGFpbmVyJyk7XG4gICAgICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgICAgICAgIGNvbnRhaW5lci5yZW1vdmUoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfljp/nlJ/ovpPlhaXmoYblt7Lnp7vpmaQnKTtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign56e76Zmk5Y6f55Sf6L6T5YWl5qGG5aSx6LSlOicsIGUpO1xuICAgIH1cbn07XG5cbi8vIOS/ruWkjSBFZGl0Qm94IOeahCBIVE1MIGlucHV0IOWFg+e0oOS9jee9ruWSjOWwuuWvuFxudmFyIF9maXhFZGl0Qm94SW5wdXRFbGVtZW50cyA9IGZ1bmN0aW9uKHBhbmVsLCBwaG9uZUlucHV0Tm9kZSwgY29kZUlucHV0Tm9kZSwgaW5wdXRXaWR0aCwgaW5wdXRIZWlnaHQsIGNvZGVJbnB1dFcsIHBob25lRWRpdEJveCwgY29kZUVkaXRCb3gpIHtcbiAgICBpZiAoIWNjLnN5cy5pc0Jyb3dzZXIpIHJldHVybjtcbiAgICBcbiAgICB0cnkge1xuICAgICAgICAvLyDojrflj5YgQ2FudmFzIOWFg+e0oFxuICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ0dhbWVDYW52YXMnKSB8fCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdjYW52YXMnKTtcbiAgICAgICAgaWYgKCFjYW52YXMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+aJvuS4jeWIsCBDYW52YXMg5YWD57SgJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBjYW52YXNSZWN0ID0gY2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zb2xlLmxvZygnQ2FudmFzIOWwuuWvuDonLCBjYW52YXNSZWN0LndpZHRoLCAneCcsIGNhbnZhc1JlY3QuaGVpZ2h0KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOiOt+WPlua4uOaIj+iuvuiuoeeahOWIhui+qOeOh1xuICAgICAgICB2YXIgd2luU2l6ZSA9IGNjLndpblNpemU7XG4gICAgICAgIGNvbnNvbGUubG9nKCfmuLjmiI/liIbovqjnjoc6Jywgd2luU2l6ZS53aWR0aCwgJ3gnLCB3aW5TaXplLmhlaWdodCk7XG4gICAgICAgIFxuICAgICAgICAvLyDorqHnrpfnvKnmlL7mr5TkvotcbiAgICAgICAgdmFyIHNjYWxlWCA9IGNhbnZhc1JlY3Qud2lkdGggLyB3aW5TaXplLndpZHRoO1xuICAgICAgICB2YXIgc2NhbGVZID0gY2FudmFzUmVjdC5oZWlnaHQgLyB3aW5TaXplLmhlaWdodDtcbiAgICAgICAgY29uc29sZS5sb2coJ+e8qeaUvuavlOS+izonLCBzY2FsZVgsIHNjYWxlWSk7XG4gICAgICAgIFxuICAgICAgICAvLyDovoXliqnlh73mlbDvvJrlsIYgQ29jb3Mg5LiW55WM5Z2Q5qCH6L2s5o2i5Li6IEhUTUwg5bGP5bmV5Z2Q5qCHXG4gICAgICAgIHZhciB3b3JsZFRvU2NyZWVuID0gZnVuY3Rpb24od29ybGRQb3MsIG5vZGVXaWR0aCwgbm9kZUhlaWdodCkge1xuICAgICAgICAgICAgLy8gQ29jb3Mg5Z2Q5qCH57O777ya5Y6f54K55Zyo5bem5LiL6KeS77yMWei9tOWQkeS4ilxuICAgICAgICAgICAgLy8gSFRNTCDlnZDmoIfns7vvvJrljp/ngrnlnKjlt6bkuIrop5LvvIxZ6L205ZCR5LiLXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOS4lueVjOWdkOagh+i9rOaNouS4uuebuOWvueS6juiuvuiuoeWIhui+qOeOh+eahOS9jee9ru+8iDAg5YiwIHdpblNpemXvvIlcbiAgICAgICAgICAgIC8vIOeEtuWQjue8qeaUvuWIsCBDYW52YXMg5bC65a+4XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBzY3JlZW5YID0gKHdvcmxkUG9zLnggLSBub2RlV2lkdGggLyAyKSAqIHNjYWxlWDtcbiAgICAgICAgICAgIHZhciBzY3JlZW5ZID0gY2FudmFzUmVjdC5oZWlnaHQgLSAod29ybGRQb3MueSArIG5vZGVIZWlnaHQgLyAyKSAqIHNjYWxlWTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHsgeDogc2NyZWVuWCwgeTogc2NyZWVuWSB9O1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLy8g6K6h566X5omL5py66L6T5YWl5qGG55qE5LiW55WM5Z2Q5qCHXG4gICAgICAgIHZhciBwaG9uZVdvcmxkUG9zID0gcGhvbmVJbnB1dE5vZGUuY29udmVydFRvV29ybGRTcGFjZUFSKGNjLnYyKDAsIDApKTtcbiAgICAgICAgY29uc29sZS5sb2coJ+aJi+acuui+k+WFpeahhuS4lueVjOWdkOaghzonLCBwaG9uZVdvcmxkUG9zLngsIHBob25lV29ybGRQb3MueSk7XG4gICAgICAgIFxuICAgICAgICB2YXIgcGhvbmVTY3JlZW5Qb3MgPSB3b3JsZFRvU2NyZWVuKHBob25lV29ybGRQb3MsIGlucHV0V2lkdGgsIGlucHV0SGVpZ2h0KTtcbiAgICAgICAgY29uc29sZS5sb2coJ+aJi+acuui+k+WFpeahhuWxj+W5leS9jee9rjonLCBwaG9uZVNjcmVlblBvcy54LCBwaG9uZVNjcmVlblBvcy55KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOafpeaJviBIVE1MIGlucHV0IOWFg+e0oFxuICAgICAgICB2YXIgaW5wdXRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaW5wdXQnKTtcbiAgICAgICAgY29uc29sZS5sb2coJ+aJvuWIsCAnICsgaW5wdXRzLmxlbmd0aCArICcg5LiqIGlucHV0IOWFg+e0oCcpO1xuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5Y+q5pyJ5LiA5LiqIGlucHV077yM6ZyA6KaB5omL5Yqo5Yib5bu656ys5LqM5LiqXG4gICAgICAgIGlmIChpbnB1dHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICB2YXIgcGhvbmVJbnB1dCA9IGlucHV0c1swXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g6K6+572u5qC35byPXG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUubGVmdCA9IE1hdGgubWF4KDAsIHBob25lU2NyZWVuUG9zLngpICsgJ3B4JztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUudG9wID0gTWF0aC5tYXgoMCwgcGhvbmVTY3JlZW5Qb3MueSkgKyAncHgnO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS53aWR0aCA9IChpbnB1dFdpZHRoICogc2NhbGVYKSArICdweCc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLmhlaWdodCA9IChpbnB1dEhlaWdodCAqIHNjYWxlWSkgKyAncHgnO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS56SW5kZXggPSAnOTk5OSc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS5jdXJzb3IgPSAndGV4dCc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLmJhY2tncm91bmQgPSAncmdiYSgyNTUsMjU1LDI1NSwwLjUpJztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUuYm9yZGVyID0gJzJweCBzb2xpZCBnb2xkJztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUub3V0bGluZSA9ICdub25lJztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUuZm9udFNpemUgPSAnMTZweCc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLmNvbG9yID0gJyMzMzMzMzMnO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS5wYWRkaW5nID0gJzVweCc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLmJveFNpemluZyA9ICdib3JkZXItYm94JztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUuYm9yZGVyUmFkaXVzID0gJzVweCc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfmiYvmnLrovpPlhaXmoYbmoLflvI/lt7Lkv67lpI3vvIzkvY3nva46JywgcGhvbmVJbnB1dC5zdHlsZS5sZWZ0LCBwaG9uZUlucHV0LnN0eWxlLnRvcCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOmqjOivgeeggei+k+WFpeahhlxuICAgICAgICB2YXIgY29kZVdvcmxkUG9zID0gY29kZUlucHV0Tm9kZS5jb252ZXJ0VG9Xb3JsZFNwYWNlQVIoY2MudjIoMCwgMCkpO1xuICAgICAgICBjb25zb2xlLmxvZygn6aqM6K+B56CB6L6T5YWl5qGG5LiW55WM5Z2Q5qCHOicsIGNvZGVXb3JsZFBvcy54LCBjb2RlV29ybGRQb3MueSk7XG4gICAgICAgIFxuICAgICAgICB2YXIgY29kZVNjcmVlblBvcyA9IHdvcmxkVG9TY3JlZW4oY29kZVdvcmxkUG9zLCBjb2RlSW5wdXRXLCBpbnB1dEhlaWdodCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCfpqozor4HnoIHovpPlhaXmoYblsY/luZXkvY3nva46JywgY29kZVNjcmVlblBvcy54LCBjb2RlU2NyZWVuUG9zLnkpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGlucHV0cy5sZW5ndGggPj0gMikge1xuICAgICAgICAgICAgdmFyIGNvZGVJbnB1dCA9IGlucHV0c1sxXTtcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUubGVmdCA9IE1hdGgubWF4KDAsIGNvZGVTY3JlZW5Qb3MueCkgKyAncHgnO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLnRvcCA9IE1hdGgubWF4KDAsIGNvZGVTY3JlZW5Qb3MueSkgKyAncHgnO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLndpZHRoID0gKGNvZGVJbnB1dFcgKiBzY2FsZVgpICsgJ3B4JztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS5oZWlnaHQgPSAoaW5wdXRIZWlnaHQgKiBzY2FsZVkpICsgJ3B4JztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS56SW5kZXggPSAnOTk5OSc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUub3BhY2l0eSA9ICcxJztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLnBvaW50ZXJFdmVudHMgPSAnYXV0byc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUuY3Vyc29yID0gJ3RleHQnO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLmJhY2tncm91bmQgPSAncmdiYSgyNTUsMjU1LDI1NSwwLjUpJztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS5ib3JkZXIgPSAnMnB4IHNvbGlkIGdvbGQnO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLm91dGxpbmUgPSAnbm9uZSc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUuZm9udFNpemUgPSAnMTZweCc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUuY29sb3IgPSAnIzMzMzMzMyc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUucGFkZGluZyA9ICc1cHgnO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLmJveFNpemluZyA9ICdib3JkZXItYm94JztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnNXB4JztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc29sZS5sb2coJ+mqjOivgeeggei+k+WFpeahhuagt+W8j+W3suS/ruWkjScpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDosIPor5XvvJrmmL7npLrovpPlhaXmoYbnmoTlrp7pmYXkvY3nva5cbiAgICAgICAgY29uc29sZS5sb2coJz09PSDosIPor5Xkv6Hmga8gPT09Jyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdDYW52YXMg5L2N572uOicsIGNhbnZhc1JlY3QubGVmdCwgY2FudmFzUmVjdC50b3ApO1xuICAgICAgICBjb25zb2xlLmxvZygn6K6+6K6h5YiG6L6o546HOicsIHdpblNpemUud2lkdGgsICd4Jywgd2luU2l6ZS5oZWlnaHQpO1xuICAgICAgICBjb25zb2xlLmxvZygn6L6T5YWl5qGG6IqC54K55bC65a+4OicsIGlucHV0V2lkdGgsICd4JywgaW5wdXRIZWlnaHQpO1xuICAgICAgICBjb25zb2xlLmxvZygn6aqM6K+B56CB6L6T5YWl5qGG5bC65a+4OicsIGNvZGVJbnB1dFcsICd4JywgaW5wdXRIZWlnaHQpO1xuICAgICAgICBcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+S/ruWkjSBFZGl0Qm94IOagt+W8j+Wksei0pTonLCBlKTtcbiAgICB9XG59O1xuXG4vLyBNdXRhdGlvbk9ic2VydmVyIOebkeWQrOaWsOWIm+W7uueahGlucHV05YWD57SgXG52YXIgX3N0YXJ0SW5wdXRPYnNlcnZlciA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghY2Muc3lzLmlzQnJvd3NlcikgcmV0dXJuO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24obXV0YXRpb25zKSB7XG4gICAgICAgICAgICBtdXRhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihtdXRhdGlvbikge1xuICAgICAgICAgICAgICAgIG11dGF0aW9uLmFkZGVkTm9kZXMuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLm5vZGVOYW1lID09PSAnSU5QVVQnIHx8IG5vZGUubm9kZU5hbWUgPT09ICdURVhUQVJFQScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zdHlsZVNpbmdsZUlucHV0KG5vZGUsICcjMDAwMDAwJywgJyNmZmZmZmYnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyDmo4Dmn6XlrZDoioLngrlcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUucXVlcnlTZWxlY3RvckFsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlucHV0cyA9IG5vZGUucXVlcnlTZWxlY3RvckFsbCgnaW5wdXQsIHRleHRhcmVhJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dHMuZm9yRWFjaChmdW5jdGlvbihpbnApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfc3R5bGVTaW5nbGVJbnB1dChpbnAsICcjMDAwMDAwJywgJyNmZmZmZmYnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5ib2R5LCB7XG4gICAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgICBzdWJ0cmVlOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ+WQr+WKqElucHV055uR5ZCs5Zmo5aSx6LSlOicsIGUpO1xuICAgIH1cbn07XG5cbmNjLkNsYXNzKHtcbiAgICBleHRlbmRzOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIHdhaXRfbm9kZToge1xuICAgICAgICAgICAgdHlwZTogY2MuTm9kZSxcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgdXNlcl9hZ3JlZW1lbnRfcHJlZmFiczoge1xuICAgICAgICAgICAgdHlwZTogY2MuUHJlZmFiLFxuICAgICAgICAgICAgZGVmYXVsdDogbnVsbFxuICAgICAgICB9LFxuICAgICAgICBwaG9uZV9sb2dpbl9wcmVmYWI6IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLlByZWZhYixcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBvbkxvYWQgKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cIik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwibG9naW5TY2VuZSBvbkxvYWQg5byA5aeL5omn6KGMXCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cIik7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIPCflKcg5L+u5aSN77ya56aB55So6Ieq5Yqo5YWo5bGP5Yqf6IO977yI5Y+M6YeN5L+d6Zmp77yM56e76ZmkIGlzTW9iaWxlIOajgOafpe+8iVxuICAgICAgICAgICAgLy8g5Y2z5L2/IG1haW4uanMg5Lit55qE6K6+572u5rKh5pyJ55Sf5pWI77yM6L+Z6YeM5Lmf5Lya5YaN5qyh56aB55SoXG4gICAgICAgICAgICBpZiAoY2MudmlldyAmJiBjYy52aWV3LmVuYWJsZUF1dG9GdWxsU2NyZWVuKSB7XG4gICAgICAgICAgICAgICAgY2Mudmlldy5lbmFibGVBdXRvRnVsbFNjcmVlbihmYWxzZSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJsb2dpblNjZW5lOiDlt7LnpoHnlKjoh6rliqjlhajlsY/lip/og71cIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIPCflKcg6aKd5aSW5L+d6Zmp77ya56aB55SoIHNjcmVlbiDnmoToh6rliqjlhajlsY/op6bmkbjnm5HlkKzlmahcbiAgICAgICAgICAgIGlmIChjYy5zY3JlZW4gJiYgY2Muc2NyZWVuLmRpc2FibGVBdXRvRnVsbFNjcmVlbikge1xuICAgICAgICAgICAgICAgIGNjLnNjcmVlbi5kaXNhYmxlQXV0b0Z1bGxTY3JlZW4oKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImxvZ2luU2NlbmU6IOW3suemgeeUqCBzY3JlZW4g6Ieq5Yqo5YWo5bGP6Kem5pG455uR5ZCs5ZmoXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi56aB55So6Ieq5Yqo5YWo5bGP5pe25Ye66ZSZOlwiLCBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDlkK/liqhXZWLlubPlj7BJbnB1dOagt+W8j+ebkeWQrOWZqFxuICAgICAgICAgICAgX3N0YXJ0SW5wdXRPYnNlcnZlcigpO1xuICAgICAgICAgICAgX2luamVjdEdsb2JhbFN0eWxlcygnIzAwMDAwMCcsICcjZmZmZmZmJyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLliJ3lp4vljJbmoLflvI/nm5HlkKzlmajml7blh7rplJk6XCIsIGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5faXNBZ3JlZW1lbnRDaGVja2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3Bob25lTG9naW5Qb3B1cFNob3dpbmcgPSBmYWxzZTsgIC8vIOWIneWni+WMluW8ueeql+agh+W/l+S9jVxuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuX2luaXRXYWl0Tm9kZSgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi5Yid5aeL5YyW562J5b6F6IqC54K55pe25Ye66ZSZOlwiLCBlKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOWIneWni+WMluWkjemAieahhu+8iOS9v+eUqOeCueWHu+S6i+S7tu+8iVxuICAgICAgICAgICAgdGhpcy5faW5pdENoZWNrYm94KCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLliJ3lp4vljJblpI3pgInmoYbml7blh7rplJk6XCIsIGUpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g5Yid5aeL5YyW55m75b2V5oyJ6ZKuXG4gICAgICAgICAgICB0aGlzLl9pbml0TG9naW5CdXR0b25zKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLliJ3lp4vljJbnmbvlvZXmjInpkq7ml7blh7rplJk6XCIsIGUpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g5Yid5aeL5YyW55So5oi35Y2P6K6u6ZO+5o6l54K55Ye75LqL5Lu2XG4gICAgICAgICAgICB0aGlzLl9pbml0VXNlckFncmVlbWVudExpbmsoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuWIneWni+WMlueUqOaIt+WNj+iurumTvuaOpeaXtuWHuumUmTpcIiwgZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g8J+agOOAkOaAp+iDveS8mOWMluOAkemihOWKoOi9veWkp+WOheWcuuaZr+WSjOa4uOaIj+WcuuaZr1xuICAgICAgICAgICAgdGhpcy5fcHJlbG9hZFNjZW5lcygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi6aKE5Yqg6L295Zy65pmv5pe25Ye66ZSZOlwiLCBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDmo4Dmn6XmmK/lkKbmnInmnKzlnLDnmbvlvZXkvJror53vvIzlsJ3or5Xoh6rliqjnmbvlvZVcbiAgICAgICAgICAgIHRoaXMuX2NoZWNrQXV0b0xvZ2luKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLmo4Dmn6Xoh6rliqjnmbvlvZXml7blh7rplJk6XCIsIGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cubXlnbG9iYWwgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwibXlnbG9iYWwg5pyq5a6a5LmJ77yM5bCd6K+V562J5b6FLi4uXCIpO1xuICAgICAgICAgICAgdGhpcy5fd2FpdEZvck15Z2xvYmFsKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pbml0QW5kU3RhcnQoKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwiPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVwiKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJsb2dpblNjZW5lIG9uTG9hZCDmiafooYzlrozmiJBcIik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVwiKTtcbiAgICB9LFxuXG4gICAgLy8g5qOA5p+l6Ieq5Yqo55m75b2VXG4gICAgX2NoZWNrQXV0b0xvZ2luOiBmdW5jdGlvbigpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbDtcbiAgICAgICAgaWYgKCFteWdsb2JhbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm6KKr5by65Yi25LiL57q/XG4gICAgICAgIGlmIChteWdsb2JhbC53YXNGb3JjZUxvZ2dlZE91dCgpKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93RXJyb3IobXlnbG9iYWwuZ2V0Rm9yY2VMb2dvdXRSZWFzb24oKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmo4Dmn6XmmK/lkKbmnInmnKzlnLDkvJror51cbiAgICAgICAgaWYgKG15Z2xvYmFsLmhhc0xvY2FsU2Vzc2lvbigpKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIG15Z2xvYmFsLnZlcmlmeVRva2VuKGZ1bmN0aW9uKHZhbGlkLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKHZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dFcnJvcihcIuiHquWKqOeZu+W9leS4rS4uLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpuacieS/neWtmOeahOaIv+mXtOS/oeaBr++8iOWIt+aWsOmhtemdouWQjuaBouWkjeWIsOa4uOaIj+WcuuaZr++8iVxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVjb25uZWN0SW5mbyA9IG15Z2xvYmFsLnNvY2tldCAmJiBteWdsb2JhbC5zb2NrZXQubG9hZFJlY29ubmVjdEluZm8gPyBcbiAgICAgICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnNvY2tldC5sb2FkUmVjb25uZWN0SW5mbygpIDogeyB0b2tlbjogJycsIHBsYXllcklkOiAnJywgcm9vbUNvZGU6ICcnIH07XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5aaC5p6c5pyJ5oi/6Ze05Y+377yM6K+05piO5LmL5YmN5Zyo5ri45oiP5Lit77yM6ZyA6KaB5oGi5aSN5Yiw5ri45oiP5Zy65pmvXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWNvbm5lY3RJbmZvLnJvb21Db2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChteWdsb2JhbC5zb2NrZXQgJiYgbXlnbG9iYWwuc29ja2V0LmluaXRTb2NrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LmluaXRTb2NrZXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g55uR5ZCs5oi/6Ze05oGi5aSN5LqL5Lu2XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uUm9vbVJlc3RvcmVkKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwiZ2FtZVNjZW5lXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOebkeWQrOaZrumAmui/nuaOpeaIkOWKn++8iOS4jeWcqOaIv+mXtOS4re+8iVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBldnQgPSB3aW5kb3cuZXZlbnRMaXN0ZXIgPyB3aW5kb3cuZXZlbnRMaXN0ZXIoe30pIDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2dC5vbihcImNvbm5lY3Rpb25fc3VjY2Vzc1wiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJnYW1lU2NlbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDAuNSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDmsqHmnInmiL/pl7Tkv6Hmga/vvIzmraPluLjot7PovazliLDlpKfljoVcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChteWdsb2JhbC5zb2NrZXQgJiYgbXlnbG9iYWwuc29ja2V0LmluaXRTb2NrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LmluaXRTb2NrZXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwiaGFsbFNjZW5lXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMC41KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRva2Vu5peg5pWI77yM5pi+56S66ZSZ6K+v5L+h5oGv5bm25YGc55WZ5Zyo55m75b2V6aG16Z2iXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dFcnJvcihtZXNzYWdlIHx8IFwi55m75b2V5bey6L+H5pyf77yM6K+36YeN5paw55m75b2VXCIpO1xuICAgICAgICAgICAgICAgICAgICAvLyBteWdsb2JhbC52ZXJpZnlUb2tlbiDlt7Lnu4/muIXpmaTkuobmnKzlnLDnirbmgIHvvIzov5nph4zkuI3pnIDopoHlho3mrKHmuIXpmaRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfaW5pdFdhaXROb2RlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMud2FpdF9ub2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9sb2FkaW5nSW1hZ2UgPSB0aGlzLndhaXRfbm9kZS5nZXRDaGlsZEJ5TmFtZShcImxvYWRpbmdfaW1hZ2VcIik7XG4gICAgICAgICAgICB2YXIgbGJsTm9kZSA9IHRoaXMud2FpdF9ub2RlLmdldENoaWxkQnlOYW1lKFwibGJsY29udGVudF9MYWJlbFwiKTtcbiAgICAgICAgICAgIGlmIChsYmxOb2RlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2FpdExhYmVsID0gbGJsTm9kZS5nZXRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy53YWl0X25vZGUuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2luaXRDaGVja2JveDogZnVuY3Rpb24oKSB7XG4gICAgICAgIFxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICAvLyBsb2dpblNjZW5lIOiEmuacrOaMgui9veWcqCBST09UX1VJIOiKgueCueS4iu+8jOaJgOS7pSB0aGlzLm5vZGUg5bCx5pivIFJPT1RfVUlcbiAgICAgICAgdmFyIGNoZWNrTWFya05vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJjaGVja19tYXJrXCIpO1xuICAgICAgICBpZiAoIWNoZWNrTWFya05vZGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJjaGVja19tYXJrIOiKgueCueacquaJvuWIsFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5fY2hlY2tNYXJrTm9kZSA9IGNoZWNrTWFya05vZGU7XG4gICAgICAgIFxuICAgICAgICB2YXIgY2hlY2ttYXJrID0gY2hlY2tNYXJrTm9kZS5nZXRDaGlsZEJ5TmFtZShcImNoZWNrbWFya1wiKTtcbiAgICAgICAgaWYgKGNoZWNrbWFyaykge1xuICAgICAgICAgICAgdGhpcy5fY2hlY2ttYXJrSWNvbiA9IGNoZWNrbWFyaztcbiAgICAgICAgICAgIGNoZWNrbWFyay5hY3RpdmUgPSB0cnVlOyAgLy8g6buY6K6k6YCJ5LitXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX2lzQWdyZWVtZW50Q2hlY2tlZCA9IHRydWU7ICAvLyDpu5jorqTlt7LlkIzmhI/ljY/orq5cbiAgICAgICAgXG4gICAgICAgIHZhciBidXR0b24gPSBjaGVja01hcmtOb2RlLmdldENvbXBvbmVudChjYy5CdXR0b24pO1xuICAgICAgICBpZiAoYnV0dG9uKSB7XG4gICAgICAgICAgICBidXR0b24uZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjaGVja01hcmtOb2RlLm9mZihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQpO1xuICAgICAgICBjaGVja01hcmtOb2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHNlbGYuX3RvZ2dsZUNoZWNrYm94KCk7XG4gICAgICAgIH0sIHNlbGYpO1xuICAgIH0sXG5cbiAgICBfdG9nZ2xlQ2hlY2tib3g6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9pc0FncmVlbWVudENoZWNrZWQgPSAhdGhpcy5faXNBZ3JlZW1lbnRDaGVja2VkO1xuICAgICAgICBpZiAodGhpcy5fY2hlY2ttYXJrSWNvbikge1xuICAgICAgICAgICAgdGhpcy5fY2hlY2ttYXJrSWNvbi5hY3RpdmUgPSB0aGlzLl9pc0FncmVlbWVudENoZWNrZWQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc3RhcnQgKCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cIik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwibG9naW5TY2VuZSBzdGFydCDmlrnms5XmiafooYxcIik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVwiKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWkh+eUqOaWueahiO+8muWcqCBzdGFydCDkuK3lho3mrKHmo4Dmn6XmjInpkq7mmK/lkKbmraPnoa7liJ3lp4vljJZcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOW7tui/n+ajgOafpeaMiemSrueKtuaAgS4uLlwiKTtcbiAgICAgICAgICAgIHZhciBwaG9uZUxvZ2luTm9kZSA9IHNlbGYubm9kZS5nZXRDaGlsZEJ5TmFtZShcImxvZ2luX3Bob25lXCIpO1xuICAgICAgICAgICAgaWYgKHBob25lTG9naW5Ob2RlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4gbG9naW5fcGhvbmUg6IqC54K55a2Y5ZyoXCIpO1xuICAgICAgICAgICAgICAgIHZhciBoYXNUb3VjaExpc3RlbmVycyA9IHBob25lTG9naW5Ob2RlLmdldENvbXBvbmVudChjYy5CdXR0b24pICE9PSBudWxsO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOaYr+WQpuaciSBCdXR0b24g57uE5Lu2OlwiLCBoYXNUb3VjaExpc3RlbmVycyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5YaN5qyh56Gu5L+d5LqL5Lu257uR5a6aXG4gICAgICAgICAgICAgICAgcGhvbmVMb2dpbk5vZGUub2ZmKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCk7XG4gICAgICAgICAgICAgICAgcGhvbmVMb2dpbk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIj4+PiBbc3RhcnTlpIfnlKhdIOaJi+acuueZu+W9leaMiemSriBUT1VDSF9FTkQg5LqL5Lu26Kem5Y+RXCIpO1xuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fZG9QaG9uZUxvZ2luKCk7XG4gICAgICAgICAgICAgICAgfSwgc2VsZik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4g5bey6YeN5paw57uR5a6a5omL5py655m75b2V5oyJ6ZKu5LqL5Lu2XCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiPj4+IGxvZ2luX3Bob25lIOiKgueCueS4jeWtmOWcqO+8gVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHd4TG9naW5Ob2RlID0gc2VsZi5ub2RlLmdldENoaWxkQnlOYW1lKFwibG9naW5fd3hcIik7XG4gICAgICAgICAgICBpZiAod3hMb2dpbk5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIj4+PiBsb2dpbl93eCDoioLngrnlrZjlnKhcIik7XG4gICAgICAgICAgICAgICAgd3hMb2dpbk5vZGUub2ZmKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCk7XG4gICAgICAgICAgICAgICAgd3hMb2dpbk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIj4+PiBbc3RhcnTlpIfnlKhdIOW+ruS/oeeZu+W9leaMiemSriBUT1VDSF9FTkQg5LqL5Lu26Kem5Y+RXCIpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9kb1d4TG9naW4oKTtcbiAgICAgICAgICAgICAgICB9LCBzZWxmKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIj4+PiDlt7Lph43mlrDnu5Hlrprlvq7kv6HnmbvlvZXmjInpkq7kuovku7ZcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDAuNSk7XG4gICAgfSxcblxuICAgIF9pbml0TG9naW5CdXR0b25zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT0g5Yid5aeL5YyW55m75b2V5oyJ6ZKuID09PVwiKTtcbiAgICAgICAgY29uc29sZS5sb2coXCLlvZPliY3oioLngrk6XCIsIHRoaXMubm9kZSA/IHRoaXMubm9kZS5uYW1lIDogXCJudWxsXCIpO1xuICAgICAgICBcbiAgICAgICAgLy8g5omT5Y2w5omA5pyJ5a2Q6IqC54K55ZCN56ewXG4gICAgICAgIHZhciBjaGlsZHJlbiA9IHRoaXMubm9kZS5jaGlsZHJlbjtcbiAgICAgICAgY29uc29sZS5sb2coXCLlrZDoioLngrnmlbDph486XCIsIGNoaWxkcmVuLmxlbmd0aCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiICDlrZDoioLngrlbXCIgKyBpICsgXCJdOlwiLCBjaGlsZHJlbltpXS5uYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGxvZ2luU2NlbmUg6ISa5pys5oyC6L295ZyoIFJPT1RfVUkg6IqC54K55LiK77yM5omA5LulIHRoaXMubm9kZSDlsLHmmK8gUk9PVF9VSVxuICAgICAgICB2YXIgd3hMb2dpbk5vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJsb2dpbl93eFwiKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJ3eExvZ2luTm9kZTpcIiwgd3hMb2dpbk5vZGUgPyBcIuaJvuWIsFwiIDogXCLmnKrmib7liLBcIik7XG4gICAgICAgIGlmICh3eExvZ2luTm9kZSkge1xuICAgICAgICAgICAgdmFyIGJ1dHRvbiA9IHd4TG9naW5Ob2RlLmdldENvbXBvbmVudChjYy5CdXR0b24pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ3eExvZ2luTm9kZSBCdXR0b246XCIsIGJ1dHRvbiA/IFwi5a2Y5ZyoXCIgOiBcIuS4jeWtmOWcqFwiKTtcbiAgICAgICAgICAgIGlmIChidXR0b24pIHtcbiAgICAgICAgICAgICAgICBidXR0b24uaW50ZXJhY3RhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBidXR0b24uY2xpY2tFdmVudHMgPSBbXTtcblxuICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyID0gbmV3IGNjLkNvbXBvbmVudC5FdmVudEhhbmRsZXIoKTtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLnRhcmdldCA9IHRoaXMubm9kZTtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmNvbXBvbmVudCA9IFwibG9naW5TY2VuZVwiO1xuICAgICAgICAgICAgICAgIGhhbmRsZXIuaGFuZGxlciA9IFwiX29uV3hMb2dpbkNsaWNrXCI7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5jdXN0b21FdmVudERhdGEgPSBcIlwiO1xuICAgICAgICAgICAgICAgIGJ1dHRvbi5jbGlja0V2ZW50cy5wdXNoKGhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi5b6u5L+h55m75b2V5oyJ6ZKu5Yid5aeL5YyW5a6M5oiQXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmt7vliqDlpIfnlKjnmoTop6bmkbjkuovku7bnm5HlkKzvvIjnoa7kv53ngrnlh7vkuovku7bkuIDlrprog73op6blj5HvvIlcbiAgICAgICAgICAgIHd4TG9naW5Ob2RlLm9mZihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQpO1xuICAgICAgICAgICAgd3hMb2dpbk5vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOW+ruS/oeeZu+W9leaMiemSriBUT1VDSF9FTkQg5LqL5Lu26Kem5Y+RXCIpO1xuICAgICAgICAgICAgICAgIHNlbGYuX2RvV3hMb2dpbigpO1xuICAgICAgICAgICAgfSwgc2VsZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi5pyq5om+5YiwIGxvZ2luX3d4IOiKgueCue+8gVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwaG9uZUxvZ2luTm9kZSA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcImxvZ2luX3Bob25lXCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhcInBob25lTG9naW5Ob2RlOlwiLCBwaG9uZUxvZ2luTm9kZSA/IFwi5om+5YiwXCIgOiBcIuacquaJvuWIsFwiKTtcbiAgICAgICAgaWYgKHBob25lTG9naW5Ob2RlKSB7XG4gICAgICAgICAgICB2YXIgYnV0dG9uID0gcGhvbmVMb2dpbk5vZGUuZ2V0Q29tcG9uZW50KGNjLkJ1dHRvbik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInBob25lTG9naW5Ob2RlIEJ1dHRvbjpcIiwgYnV0dG9uID8gXCLlrZjlnKhcIiA6IFwi5LiN5a2Y5ZyoXCIpO1xuICAgICAgICAgICAgaWYgKGJ1dHRvbikge1xuICAgICAgICAgICAgICAgIGJ1dHRvbi5pbnRlcmFjdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJ1dHRvbi5jbGlja0V2ZW50cyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSBuZXcgY2MuQ29tcG9uZW50LkV2ZW50SGFuZGxlcigpO1xuICAgICAgICAgICAgICAgIGhhbmRsZXIudGFyZ2V0ID0gdGhpcy5ub2RlO1xuICAgICAgICAgICAgICAgIGhhbmRsZXIuY29tcG9uZW50ID0gXCJsb2dpblNjZW5lXCI7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5oYW5kbGVyID0gXCJfb25QaG9uZUxvZ2luQ2xpY2tcIjtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmN1c3RvbUV2ZW50RGF0YSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgYnV0dG9uLmNsaWNrRXZlbnRzLnB1c2goaGFuZGxlcik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLmiYvmnLrnmbvlvZXmjInpkq7liJ3lp4vljJblrozmiJBcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOa3u+WKoOWkh+eUqOeahOinpuaRuOS6i+S7tuebkeWQrO+8iOehruS/neeCueWHu+S6i+S7tuS4gOWumuiDveinpuWPke+8iVxuICAgICAgICAgICAgcGhvbmVMb2dpbk5vZGUub2ZmKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCk7XG4gICAgICAgICAgICBwaG9uZUxvZ2luTm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4g5omL5py655m75b2V5oyJ6ZKuIFRPVUNIX0VORCDkuovku7bop6blj5FcIik7XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7ICAvLyDpmLvmraLkuovku7blhpLms6FcbiAgICAgICAgICAgICAgICBzZWxmLl9kb1Bob25lTG9naW4oKTtcbiAgICAgICAgICAgIH0sIHNlbGYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuacquaJvuWIsCBsb2dpbl9waG9uZSDoioLngrnvvIFcIik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwiPT09IOeZu+W9leaMiemSruWIneWni+WMlue7k+adnyA9PT1cIik7XG4gICAgfSxcblxuICAgIF9pbml0VXNlckFncmVlbWVudExpbms6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICAvLyBsb2dpblNjZW5lIOiEmuacrOaMgui9veWcqCBST09UX1VJIOiKgueCueS4iu+8jOaJgOS7pSB0aGlzLm5vZGUg5bCx5pivIFJPT1RfVUlcbiAgICAgICAgdmFyIGxpbmtOb2RlID0gdGhpcy5ub2RlLmdldENoaWxkQnlOYW1lKFwidXNlcl9hZ3JlZW1lbnRfbGlua1wiKTtcbiAgICAgICAgaWYgKGxpbmtOb2RlKSB7XG4gICAgICAgICAgICBsaW5rTm9kZS5hY3RpdmUgPSB0cnVlO1xuXG4gICAgICAgICAgICB2YXIgYnV0dG9uID0gbGlua05vZGUuZ2V0Q29tcG9uZW50KGNjLkJ1dHRvbik7XG4gICAgICAgICAgICBpZiAoYnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgYnV0dG9uLmludGVyYWN0YWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnV0dG9uLmNsaWNrRXZlbnRzID0gW107XG5cbiAgICAgICAgICAgICAgICB2YXIgaGFuZGxlciA9IG5ldyBjYy5Db21wb25lbnQuRXZlbnRIYW5kbGVyKCk7XG4gICAgICAgICAgICAgICAgaGFuZGxlci50YXJnZXQgPSB0aGlzLm5vZGU7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5jb21wb25lbnQgPSBcImxvZ2luU2NlbmVcIjtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmhhbmRsZXIgPSBcIl9vblVzZXJBZ3JlZW1lbnRMaW5rQ2xpY2tcIjtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmN1c3RvbUV2ZW50RGF0YSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgYnV0dG9uLmNsaWNrRXZlbnRzLnB1c2goaGFuZGxlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX29uV3hMb2dpbkNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT0g5b6u5L+h55m75b2V5oyJ6ZKu6KKr54K55Ye7ID09PVwiKTtcbiAgICAgICAgdGhpcy5fZG9XeExvZ2luKCk7XG4gICAgfSxcblxuICAgIF9vblBob25lTG9naW5DbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiPT09IOaJi+acuueZu+W9leaMiemSruiiq+eCueWHuyA9PT1cIik7XG4gICAgICAgIHRoaXMuX2RvUGhvbmVMb2dpbigpO1xuICAgIH0sXG5cbiAgICBfb25Vc2VyQWdyZWVtZW50TGlua0NsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fc2hvd1VzZXJBZ3JlZW1lbnRQb3B1cCgpO1xuICAgIH0sXG5cbiAgICBfY2hlY2tBZ3JlZW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5faXNBZ3JlZW1lbnRDaGVja2VkO1xuICAgIH0sXG5cbiAgICAvLyDwn5qA44CQ5oCn6IO95LyY5YyW44CR6aKE5Yqg6L295Zy65pmvXG4gICAgX3ByZWxvYWRTY2VuZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBcbiAgICAgICAgLy8g6aKE5Yqg6L295aSn5Y6F5Zy65pmvXG4gICAgICAgIGNjLmRpcmVjdG9yLnByZWxvYWRTY2VuZShcImhhbGxTY2VuZVwiLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+agCBb6aKE5Yqg6L29XSDlpKfljoXlnLrmma/pooTliqDovb3lpLHotKU6XCIsIGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOmihOWKoOi9vea4uOaIj+WcuuaZr1xuICAgICAgICBjYy5kaXJlY3Rvci5wcmVsb2FkU2NlbmUoXCJnYW1lU2NlbmVcIiwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIvCfmoAgW+mihOWKoOi9vV0g5ri45oiP5Zy65pmv6aKE5Yqg6L295aSx6LSlOlwiLCBlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF93YWl0Rm9yTXlnbG9iYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBhdHRlbXB0cyA9IDA7XG5cbiAgICAgICAgdmFyIGNoZWNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBhdHRlbXB0cysrO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cubXlnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5faW5pdEFuZFN0YXJ0KCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGF0dGVtcHRzIDwgMjApIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrLCAxMDApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zaG93RXJyb3IoXCLliqDovb3lpLHotKXvvIzor7fliLfmlrDpobXpnaLph43or5VcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHNldFRpbWVvdXQoY2hlY2ssIDEwMCk7XG4gICAgfSxcblxuICAgIF9pbml0QW5kU3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWw7XG5cbiAgICAgICAgaWYgKCFteWdsb2JhbC5zb2NrZXQgJiYgIW15Z2xvYmFsLmluaXQoKSkge1xuICAgICAgICAgICAgdGhpcy5fc2hvd0Vycm9yKFwi5Yid5aeL5YyW5aSx6LSl77yM6K+35Yi35paw6aG16Z2i6YeN6K+VXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5qOA5p+l5piv5ZCm5pyJ5L+d5a2Y55qE6YeN6L+e5L+h5oGv77yI5Yi35paw6aG16Z2i5ZCO5oGi5aSN77yJXG4gICAgICAgIGlmIChteWdsb2JhbC5zb2NrZXQgJiYgbXlnbG9iYWwuc29ja2V0LmxvYWRSZWNvbm5lY3RJbmZvKSB7XG4gICAgICAgICAgICB2YXIgcmVjb25uZWN0SW5mbyA9IG15Z2xvYmFsLnNvY2tldC5sb2FkUmVjb25uZWN0SW5mbygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChyZWNvbm5lY3RJbmZvLnRva2VuICYmIHJlY29ubmVjdEluZm8ucGxheWVySWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zaG93TG9hZGluZyh0cnVlLCBcIuato+WcqOaBouWkjeeZu+W9leeKtuaAgS4uLlwiKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOWIneWni+WMliBXZWJTb2NrZXQg6L+e5o6lXG4gICAgICAgICAgICAgICAgaWYgKG15Z2xvYmFsLnNvY2tldC5pbml0U29ja2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnNvY2tldC5pbml0U29ja2V0KClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g55uR5ZCs5oi/6Ze05oGi5aSN5LqL5Lu2XG4gICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0Lm9uUm9vbVJlc3RvcmVkKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd0xvYWRpbmcoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDmgaLlpI3njqnlrrbmlbDmja5cbiAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YS5wbGF5ZXJJZCA9IGRhdGEucGxheWVyX2lkXG4gICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEubmlja05hbWUgPSBkYXRhLnBsYXllcl9uYW1lXG4gICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEuc2F2ZVRvTG9jYWwoKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g6Lez6L2s5Yiw5ri45oiP5Zy65pmvXG4gICAgICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZShcImdhbWVTY2VuZVwiKVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g55uR5ZCs5pmu6YCa6L+e5o6l5oiQ5Yqf77yI5LiN5Zyo5oi/6Ze05Lit77yJXG4gICAgICAgICAgICAgICAgdmFyIGV2dCA9IHdpbmRvdy5ldmVudExpc3RlciA/IHdpbmRvdy5ldmVudExpc3Rlcih7fSkgOiBudWxsXG4gICAgICAgICAgICAgICAgaWYgKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBldnQub24oXCJjb25uZWN0aW9uX3N1Y2Nlc3NcIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd0xvYWRpbmcoZmFsc2UpXG4gICAgICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLnBsYXllcklkID0gZGF0YS5wbGF5ZXJfaWRcbiAgICAgICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEubmlja05hbWUgPSBkYXRhLnBsYXllcl9uYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLmdvYmFsX2NvdW50ID0gZGF0YS5nb2xkIHx8IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEuc2F2ZVRvTG9jYWwoKVxuICAgICAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwiaGFsbFNjZW5lXCIpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Yid5aeL5YyW6IOM5pmv6Z+z5LmQIC0g5aSE55CG5rWP6KeI5Zmo6Ieq5Yqo5pKt5pS+562W55WlXG4gICAgICAgIHRoaXMuX2luaXRCYWNrZ3JvdW5kTXVzaWMoKTtcblxuICAgICAgICBpZiAobXlnbG9iYWwuc29ja2V0ICYmIG15Z2xvYmFsLnNvY2tldC5pbml0U29ja2V0KSB7XG4gICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQuaW5pdFNvY2tldCgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOWIneWni+WMluiDjOaZr+mfs+S5kCAtIOWkhOeQhua1j+iniOWZqOiHquWKqOaSreaUvuetlueVpVxuICAgIF9pbml0QmFja2dyb3VuZE11c2ljOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgLy8g6Z+z5pWI5byA5YWz5qOA5p+lXG4gICAgICAgIHZhciBpc29wZW5fc291bmQgPSAodHlwZW9mIHdpbmRvdy5pc29wZW5fc291bmQgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdy5pc29wZW5fc291bmQgOiAxO1xuICAgICAgICBpZiAoIWlzb3Blbl9zb3VuZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDliJ3lp4vljJbnirbmgIFcbiAgICAgICAgdGhpcy5fbXVzaWNQbGF5aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3RvdWNoTGlzdGVuZXJBZGRlZCA9IGZhbHNlO1xuICAgICAgICBcbiAgICAgICAgLy8g5L2/55SoIGNjLnJlc291cmNlcy5sb2FkIOWKoOi9vemfs+mikVxuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcInNvdW5kL2xvZ2luX2JnXCIsIGNjLkF1ZGlvQ2xpcCwgZnVuY3Rpb24oZXJyLCBjbGlwKSB7XG4gICAgICAgICAgICBpZiAoIWNjLmlzVmFsaWQoc2VsZi5ub2RlKSkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHNlbGYuX3NldHVwR2xvYmFsVG91Y2hGb3JNdXNpYygpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5L+d5a2Y6Z+z6aKR5Ymq6L6RXG4gICAgICAgICAgICBzZWxmLl9iZ011c2ljQ2xpcCA9IGNsaXA7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8g5L2/55SoIHBsYXlNdXNpYyDmkq3mlL7og4zmma/pn7PkuZDvvIjnu5/kuIDnmoTog4zmma/pn7PkuZDnrqHnkIbvvIlcbiAgICAgICAgICAgICAgICBjYy5hdWRpb0VuZ2luZS5wbGF5TXVzaWMoY2xpcCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgc2VsZi5fbXVzaWNQbGF5aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvLyDmiJDlip/mkq3mlL7vvIznoa7kv53nm5HlkKzlmajooqvnp7vpmaRcbiAgICAgICAgICAgICAgICBzZWxmLl9yZW1vdmVHbG9iYWxUb3VjaEZvck11c2ljKCk7XG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9zZXR1cEdsb2JhbFRvdWNoRm9yTXVzaWMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBcbiAgICAvLyDpgJrov4fop6bmkbjmkq3mlL7pn7PkuZBcbiAgICBfcGxheU11c2ljT25Ub3VjaDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIC8vIOmmluWFiOajgOafpeaYr+WQpuacieato+WcqOaSreaUvueahOmfs+S5kFxuICAgICAgICBpZiAoY2MuYXVkaW9FbmdpbmUuaXNNdXNpY1BsYXlpbmcoKSkge1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlR2xvYmFsVG91Y2hGb3JNdXNpYygpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDlpoLmnpzlt7Lnu4/mnInpn7PpopHliarovpHvvIznm7TmjqXmkq3mlL5cbiAgICAgICAgaWYgKHRoaXMuX2JnTXVzaWNDbGlwKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNjLmF1ZGlvRW5naW5lLnBsYXlNdXNpYyh0aGlzLl9iZ011c2ljQ2xpcCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbXVzaWNQbGF5aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVHbG9iYWxUb3VjaEZvck11c2ljKCk7XG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5rKh5pyJ6Z+z6aKR5Ymq6L6R77yM6ZyA6KaB5Yqg6L29XG4gICAgICAgIGNjLnJlc291cmNlcy5sb2FkKFwic291bmQvbG9naW5fYmdcIiwgY2MuQXVkaW9DbGlwLCBmdW5jdGlvbihlcnIsIGNsaXApIHtcbiAgICAgICAgICAgIGlmICghY2MuaXNWYWxpZChzZWxmLm5vZGUpKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZWxmLl9iZ011c2ljQ2xpcCA9IGNsaXA7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2MuYXVkaW9FbmdpbmUucGxheU11c2ljKGNsaXAsIHRydWUpO1xuICAgICAgICAgICAgICAgIHNlbGYuX211c2ljUGxheWluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2VsZi5fcmVtb3ZlR2xvYmFsVG91Y2hGb3JNdXNpYygpO1xuICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgXG4gICAgLy8g6K6+572u5YWo5bGA6Kem5pG455uR5ZCsIC0g55So5oi354K55Ye75Lu75oSP5L2N572u6Kem5Y+R6Z+z5LmQXG4gICAgX3NldHVwR2xvYmFsVG91Y2hGb3JNdXNpYzogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOmYsuatoumHjeWkjea3u+WKoOebkeWQrOWZqFxuICAgICAgICBpZiAodGhpcy5fdG91Y2hMaXN0ZW5lckFkZGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5fdG91Y2hMaXN0ZW5lckFkZGVkID0gdHJ1ZTtcbiAgICAgICAgXG4gICAgICAgIC8vIENvY29zIENyZWF0b3Ig5bGC6Z2i55qE55uR5ZCsXG4gICAgICAgIHRoaXMuX2NvY29zVG91Y2hIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLl9wbGF5TXVzaWNPblRvdWNoKCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMubm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9TVEFSVCwgdGhpcy5fY29jb3NUb3VjaEhhbmRsZXIsIHRoaXMpO1xuICAgICAgICBcbiAgICAgICAgLy8gV2ViIOa1j+iniOWZqOWxgumdoueahOebkeWQrFxuICAgICAgICBpZiAoY2Muc3lzLmlzQnJvd3Nlcikge1xuICAgICAgICAgICAgdGhpcy5fYnJvd3NlclRvdWNoSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3BsYXlNdXNpY09uVG91Y2goKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9icm93c2VyVG91Y2hIYW5kbGVyLCB0cnVlKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX2Jyb3dzZXJUb3VjaEhhbmRsZXIsIHRydWUpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9icm93c2VyVG91Y2hIYW5kbGVyLCB0cnVlKTtcbiAgICAgICAgICAgIFxuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyDnp7vpmaTlhajlsYDop6bmkbjnm5HlkKxcbiAgICBfcmVtb3ZlR2xvYmFsVG91Y2hGb3JNdXNpYzogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIOenu+mZpCBDb2NvcyBDcmVhdG9yIOWxgumdoueahOebkeWQrFxuICAgICAgICBpZiAodGhpcy5fY29jb3NUb3VjaEhhbmRsZXIpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZS5vZmYoY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfU1RBUlQsIHRoaXMuX2NvY29zVG91Y2hIYW5kbGVyLCB0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuX2NvY29zVG91Y2hIYW5kbGVyID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g56e76Zmk5rWP6KeI5Zmo5bGC6Z2i55qE55uR5ZCsXG4gICAgICAgIGlmIChjYy5zeXMuaXNCcm93c2VyICYmIHRoaXMuX2Jyb3dzZXJUb3VjaEhhbmRsZXIpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9icm93c2VyVG91Y2hIYW5kbGVyLCB0cnVlKTtcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMuX2Jyb3dzZXJUb3VjaEhhbmRsZXIsIHRydWUpO1xuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLl9icm93c2VyVG91Y2hIYW5kbGVyLCB0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuX2Jyb3dzZXJUb3VjaEhhbmRsZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl90b3VjaExpc3RlbmVyQWRkZWQgPSBmYWxzZTtcbiAgICB9LFxuXG4gICAgX3Nob3dFcnJvcjogZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICB0aGlzLl9zaG93V2FpdE5vZGUobWVzc2FnZSk7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5faGlkZVdhaXROb2RlKCk7XG4gICAgICAgIH0sIDIpO1xuICAgIH0sXG5cbiAgICBfc2hvd0xvYWRpbmc6IGZ1bmN0aW9uKHNob3csIG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKHNob3cpIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dXYWl0Tm9kZShtZXNzYWdlIHx8IFwi5q2j5Zyo5aSE55CGLi4uXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5faGlkZVdhaXROb2RlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3Nob3dXYWl0Tm9kZTogZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICBpZiAodGhpcy53YWl0X25vZGUpIHtcbiAgICAgICAgICAgIHRoaXMud2FpdF9ub2RlLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICBpZiAodGhpcy5fd2FpdExhYmVsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fd2FpdExhYmVsLnN0cmluZyA9IG1lc3NhZ2UgfHwgXCLmraPlnKjlpITnkIYuLi5cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLl9sb2FkaW5nSW1hZ2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9pc0FuaW1hdGluZyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2hpZGVXYWl0Tm9kZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLndhaXRfbm9kZSkge1xuICAgICAgICAgICAgdGhpcy53YWl0X25vZGUuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl9pc0FuaW1hdGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOe7mOWItuWchuinkuefqeW9oui+k+WFpeahhuiDjOaZr++8iOi+heWKqeaWueazle+8iVxuICAgIC8vIOazqOaEj++8mkNvY29zIENyZWF0b3IgR3JhcGhpY3Mg57uE5Lu25rKh5pyJIGFyY1RvIOaWueazle+8jOS9v+eUqCByb3VuZFJlY3Qg5Luj5pu/XG4gICAgX2RyYXdJbnB1dEJnOiBmdW5jdGlvbihncmFwaGljcywgd2lkdGgsIGhlaWdodCwgcmFkaXVzKSB7XG4gICAgICAgIHZhciB4ID0gLXdpZHRoIC8gMjtcbiAgICAgICAgdmFyIHkgPSAtaGVpZ2h0IC8gMjtcbiAgICAgICAgLy8g5L2/55SoIENvY29zIENyZWF0b3IgR3JhcGhpY3Mg55qEIHJvdW5kUmVjdCDmlrnms5VcbiAgICAgICAgZ3JhcGhpY3Mucm91bmRSZWN0KHgsIHksIHdpZHRoLCBoZWlnaHQsIHJhZGl1cyk7XG4gICAgfSxcblxuICAgIHVwZGF0ZTogZnVuY3Rpb24oZHQpIHtcbiAgICAgICAgaWYgKHRoaXMuX2lzQW5pbWF0aW5nICYmIHRoaXMuX2xvYWRpbmdJbWFnZSkge1xuICAgICAgICAgICAgLy8g5L2/55SoIGFuZ2xlIOabv+S7o+W3suW6n+W8g+eahCByb3RhdGlvbiDlsZ7mgKdcbiAgICAgICAgICAgIHRoaXMuX2xvYWRpbmdJbWFnZS5hbmdsZSArPSBkdCAqIDQ1O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9kb1d4TG9naW46IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCF0aGlzLl9jaGVja0FncmVlbWVudCgpKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93RXJyb3IoXCLor7flhYjlkIzmhI/nlKjmiLfljY/orq5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbXlnbG9iYWwgPSB3aW5kb3cubXlnbG9iYWw7XG4gICAgICAgIGlmICghbXlnbG9iYWwgfHwgIW15Z2xvYmFsLnNvY2tldCkge1xuICAgICAgICAgICAgdGhpcy5fc2hvd0Vycm9yKFwi572R57uc5pyq6L+e5o6l77yM6K+356iN5ZCO6YeN6K+VXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc2hvd0xvYWRpbmcodHJ1ZSwgXCLmraPlnKjnmbvlvZUuLi5cIik7XG5cbiAgICAgICAgbXlnbG9iYWwuc29ja2V0LnJlcXVlc3Rfd3hMb2dpbih7XG4gICAgICAgICAgICB1bmlxdWVJRDogbXlnbG9iYWwucGxheWVyRGF0YS51bmlxdWVJRCxcbiAgICAgICAgICAgIGFjY291bnRJRDogbXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SUQsXG4gICAgICAgICAgICBuaWNrTmFtZTogbXlnbG9iYWwucGxheWVyRGF0YS5uaWNrTmFtZSxcbiAgICAgICAgICAgIGF2YXRhclVybDogbXlnbG9iYWwucGxheWVyRGF0YS5hdmF0YXJVcmwsXG4gICAgICAgIH0sIGZ1bmN0aW9uKGVyciwgcmVzdWx0KSB7XG4gICAgICAgICAgICBzZWxmLl9zaG93TG9hZGluZyhmYWxzZSk7XG5cbiAgICAgICAgICAgIGlmIChlcnIgIT0gMCkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dFcnJvcihcIueZu+W9leWksei0pe+8jOivt+mHjeivlVwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEuZ29iYWxfY291bnQgPSByZXN1bHQuZ29sZGNvdW50IHx8IDA7XG4gICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIik7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBfZG9QaG9uZUxvZ2luOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCI+Pj4gX2RvUGhvbmVMb2dpbiDooqvosIPnlKhcIik7XG5cbiAgICAgICAgLy8g8J+UpyDkv67lpI3vvJrpmLLmraLph43lpI3ngrnlh7vlr7zoh7TlpJrkuKrlvLnnqpdcbiAgICAgICAgaWYgKHRoaXMuX3Bob25lTG9naW5Qb3B1cFNob3dpbmcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOeZu+W9leW8ueeql+ato+WcqOaYvuekuuS4re+8jOW/veeVpemHjeWkjeiwg+eUqFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5fY2hlY2tBZ3JlZW1lbnQoKSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4g55So5oi35pyq5ZCM5oSP5Y2P6K6uXCIpO1xuICAgICAgICAgICAgdGhpcy5fc2hvd0Vycm9yKFwi6K+35YWI5ZCM5oSP55So5oi35Y2P6K6uXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6K6+572u5qCH5b+X5L2N77yM6Ziy5q2i6YeN5aSN5by556qXXG4gICAgICAgIHRoaXMuX3Bob25lTG9naW5Qb3B1cFNob3dpbmcgPSB0cnVlO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOWHhuWkh+aYvuekuuaJi+acuueZu+W9leW8ueeql1wiKTtcbiAgICAgICAgdGhpcy5fc2hvd1Bob25lTG9naW5Qb3B1cCgpO1xuICAgIH0sXG5cbiAgICBfc2hvd1Bob25lTG9naW5Qb3B1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IF9zaG93UGhvbmVMb2dpblBvcHVwIOiiq+iwg+eUqFwiKTtcbiAgICAgICAgY29uc29sZS5sb2coXCI+Pj4gcGhvbmVfbG9naW5fcHJlZmFiOlwiLCB0aGlzLnBob25lX2xvZ2luX3ByZWZhYiA/IFwi5a2Y5ZyoXCIgOiBcIuS4jeWtmOWcqFwiKTtcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLnBob25lX2xvZ2luX3ByZWZhYikge1xuICAgICAgICAgICAgdGhpcy5fY3JlYXRlUGhvbmVMb2dpblBvcHVwKHRoaXMucGhvbmVfbG9naW5fcHJlZmFiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOWKqOaAgeWKoOi9vSBwcmVmYWJzL3Bob25lX2xvZ2luXCIpO1xuICAgICAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoXCJwcmVmYWJzL3Bob25lX2xvZ2luXCIsIGNjLlByZWZhYiwgZnVuY3Rpb24oZXJyLCBwcmVmYWIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNjLmlzVmFsaWQoc2VsZi5ub2RlKSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuWKoOi9vSBwaG9uZV9sb2dpbiBwcmVmYWIg5aSx6LSlOlwiLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93RXJyb3IoXCLml6Dms5XmmL7npLrnmbvlvZXlvLnnqpdcIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4gcGhvbmVfbG9naW4gcHJlZmFiIOWKoOi9veaIkOWKn1wiKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9jcmVhdGVQaG9uZUxvZ2luUG9wdXAocHJlZmFiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9jcmVhdGVQaG9uZUxvZ2luUG9wdXA6IGZ1bmN0aW9uKHByZWZhYikge1xuICAgICAgICBjb25zb2xlLmxvZyhcIj4+PiBfY3JlYXRlUGhvbmVMb2dpblBvcHVwIOiiq+iwg+eUqFwiKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWKqOaAgeWIm+W7uuW8ueeql++8iOS9v+eUqOato+ehrueahOiDjOaZr+WbvuWSjOWwuuWvuO+8iVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4g5byA5aeL5Yqo5oCB5Yib5bu655m75b2V5by556qXXCIpO1xuICAgICAgICAgICAgdmFyIHBvcHVwID0gdGhpcy5fY3JlYXRlUGhvbmVMb2dpbkR5bmFtaWMoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOeZu+W9leW8ueeql+WIm+W7uuWujOaIkDpcIiwgcG9wdXAgPyBwb3B1cC5uYW1lIDogXCJudWxsXCIpO1xuICAgICAgICAgICAgdGhpcy5fcGhvbmVMb2dpblBvcHVwID0gcG9wdXA7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLliJvlu7rmiYvmnLrnmbvlvZXlvLnnqpflpLHotKU6XCIsIGUpO1xuICAgICAgICAgICAgdGhpcy5fc2hvd0Vycm9yKFwi5peg5rOV5pi+56S655m75b2V5by556qXOiBcIiArIGUubWVzc2FnZSk7XG4gICAgICAgICAgICAvLyDwn5SnIOS/ruWkje+8muWIm+W7uuWksei0peaXtumHjee9ruagh+W/l+S9je+8jOWFgeiuuOS4i+asoeeCueWHu+mHjeivlVxuICAgICAgICAgICAgdGhpcy5fcGhvbmVMb2dpblBvcHVwU2hvd2luZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOWKqOaAgeWIm+W7uuaJi+acuueZu+W9leW8ueeqlyAtIOS9v+eUqOato+ehrueahOiDjOaZr+WbvuWSjOWwuuWvuFxuICAgIF9jcmVhdGVQaG9uZUxvZ2luRHluYW1pYzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDlvLnnqpflsLrlr7jvvIjlm7rlrprlsLrlr7jvvIzkuI7lm77niYfljLnphY3vvIk9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyDkvb/nlKjlm7rlrprlsLrlr7jvvJrlrr3luqY1MjBweO+8jOmrmOW6pjY4MHB477yI5LiObG9naW5fYmcucG5n5Zu+54mH5bC65a+45LiA6Ie077yJXG4gICAgICAgIC8vIOWcqOWwj+Wxj+W5leS4iuiHquWKqOe8qeaUvlxuICAgICAgICB2YXIgd2luVyA9IGNjLndpblNpemUud2lkdGg7XG4gICAgICAgIHZhciB3aW5IID0gY2Mud2luU2l6ZS5oZWlnaHQ7XG5cbiAgICAgICAgLy8g5Zu+54mH5Y6f5aeL5bC65a+4IC0g6LCD5a695by556qXXG4gICAgICAgIHZhciBpbWdXaWR0aCA9IDU4MDsgIC8vIOWOn+adpeaYrzUyMO+8jOWinuWKoOWIsDU4MFxuICAgICAgICB2YXIgaW1nSGVpZ2h0ID0gNjgwO1xuXG4gICAgICAgIC8vIOWmguaenOWxj+W5leWkquWwj++8jOaMieavlOS+i+e8qeWwj1xuICAgICAgICB2YXIgc2NhbGUgPSAxLjA7XG4gICAgICAgIGlmICh3aW5XIDwgaW1nV2lkdGggKyA0MCkge1xuICAgICAgICAgICAgc2NhbGUgPSAod2luVyAtIDQwKSAvIGltZ1dpZHRoO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYW5lbFdpZHRoID0gaW1nV2lkdGggKiBzY2FsZTtcbiAgICAgICAgdmFyIHBhbmVsSGVpZ2h0ID0gaW1nSGVpZ2h0ICogc2NhbGU7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCLnmbvlvZXlvLnnqpflsLrlr7g6IFwiICsgcGFuZWxXaWR0aCArIFwiIHggXCIgKyBwYW5lbEhlaWdodCArIFwiLCDnvKnmlL7mr5Tkvos6IFwiICsgc2NhbGUpO1xuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOW8ueeql+agueiKgueCuSA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgcG9wdXAgPSBuZXcgY2MuTm9kZShcIkxvZ2luRGlhbG9nXCIpO1xuICAgICAgICBwb3B1cC5wYXJlbnQgPSB0aGlzLm5vZGU7XG4gICAgICAgIHBvcHVwLnNldENvbnRlbnRTaXplKGNjLnNpemUod2luVywgd2luSCkpO1xuICAgICAgICBwb3B1cC5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgcG9wdXAuekluZGV4ID0gMTAwMDtcblxuICAgICAgICAvLyDmt7vliqAgQmxvY2tJbnB1dEV2ZW50cyDnu4Tku7bpmLvmraLlupXlsYLngrnlh7tcbiAgICAgICAgcG9wdXAuYWRkQ29tcG9uZW50KGNjLkJsb2NrSW5wdXRFdmVudHMpO1xuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOWNiumAj+aYjuiDjOaZr+mBrue9qSA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgbWFzayA9IG5ldyBjYy5Ob2RlKFwiTWFza1wiKTtcbiAgICAgICAgbWFzay5wYXJlbnQgPSBwb3B1cDtcbiAgICAgICAgbWFzay5zZXRDb250ZW50U2l6ZShjYy5zaXplKHdpblcsIHdpbkgpKTtcbiAgICAgICAgbWFzay5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgdmFyIG1hc2tTcHJpdGUgPSBtYXNrLmFkZENvbXBvbmVudChjYy5TcHJpdGUpO1xuICAgICAgICBtYXNrU3ByaXRlLnNpemVNb2RlID0gY2MuU3ByaXRlLlNpemVNb2RlLkNVU1RPTTtcbiAgICAgICAgbWFzay5jb2xvciA9IG5ldyBjYy5Db2xvcigwLCAwLCAwKTtcbiAgICAgICAgbWFzay5vcGFjaXR5ID0gMTUwO1xuXG4gICAgICAgIC8vIPCflKcg5L+u5aSN77ya54K55Ye76YGu572p5bGC5YWz6Zet5by556qXXG4gICAgICAgIG1hc2sub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOeCueWHu+mBrue9qeWxguWFs+mXreW8ueeql1wiKTtcbiAgICAgICAgICAgIC8vIOmHjee9ruagh+W/l+S9jVxuICAgICAgICAgICAgc2VsZi5fcGhvbmVMb2dpblBvcHVwU2hvd2luZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAvLyDmuIXnkIbljp/nlJ8gSFRNTCBpbnB1dCDlhYPntKBcbiAgICAgICAgICAgIGlmIChjYy5zeXMuaXNCcm93c2VyKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXRpdmUtaW5wdXQtY29udGFpbmVyJyk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICBjb250YWluZXIucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8g5YWz6Zet5Yqo55S7XG4gICAgICAgICAgICBjYy50d2VlbihwYW5lbClcbiAgICAgICAgICAgICAgICAudG8oMC4xNSwgeyBzY2FsZTogMC44LCBvcGFjaXR5OiAwIH0sIHsgZWFzaW5nOiAnYmFja0luJyB9KVxuICAgICAgICAgICAgICAgIC5jYWxsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2MuaXNWYWxpZChwb3B1cCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnN0YXJ0KCk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOW8ueeql+mdouadvyA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgcGFuZWwgPSBuZXcgY2MuTm9kZShcIlBhbmVsXCIpO1xuICAgICAgICBwYW5lbC5wYXJlbnQgPSBwb3B1cDtcbiAgICAgICAgcGFuZWwuc2V0Q29udGVudFNpemUoY2Muc2l6ZShwYW5lbFdpZHRoLCBwYW5lbEhlaWdodCkpO1xuICAgICAgICBwYW5lbC5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgcGFuZWwuc2NhbGUgPSAwLjc7XG4gICAgICAgIHBhbmVsLm9wYWNpdHkgPSAwO1xuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOW8ueeql+iDjOaZr++8iOS9v+eUqOato+ehrueahCBsb2dpbl9iZyDlm77niYfvvIk9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgYmcgPSBuZXcgY2MuTm9kZShcIkJnXCIpO1xuICAgICAgICBiZy5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgLy8g5YWI6K6+572u5LiA5Liq5Li05pe25bC65a+4XG4gICAgICAgIGJnLnNldENvbnRlbnRTaXplKGNjLnNpemUocGFuZWxXaWR0aCwgcGFuZWxIZWlnaHQpKTtcbiAgICAgICAgYmcuc2V0UG9zaXRpb24oMCwgMCk7XG4gICAgICAgIGJnLnpJbmRleCA9IDA7ICAvLyDog4zmma/lnKjmnIDlupXlsYJcblxuICAgICAgICAvLyDlhYjmt7vliqBTcHJpdGXnu4Tku7blubborr7nva5zaXplTW9kZVxuICAgICAgICB2YXIgYmdTcHJpdGUgPSBiZy5hZGRDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgYmdTcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NOyAgLy8g5L2/55So6Ieq5a6a5LmJ5bC65a+477yM5LiN6Lef6ZqP5Zu+54mHXG4gICAgICAgIGJnU3ByaXRlLnNyY0JsZW5kRmFjdG9yID0gY2MubWFjcm8uQmxlbmRGYWN0b3IuU1JDX0FMUEhBO1xuICAgICAgICBiZ1Nwcml0ZS5kc3RCbGVuZEZhY3RvciA9IGNjLm1hY3JvLkJsZW5kRmFjdG9yLk9ORV9NSU5VU19TUkNfQUxQSEE7XG5cbiAgICAgICAgLy8g5Yqg6L296IOM5pmv5Zu+77yI5L2/55SoIFVJL2xvZ2luL2xvZ2luX2JnLnBuZ++8iVxuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcIlVJL2xvZ2luL2xvZ2luX2JnXCIsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoIWNjLmlzVmFsaWQoYmcpKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwi5Yqg6L29IGxvZ2luX2JnIOWksei0pe+8jOS9v+eUqOm7mOiupOiDjOaZrzpcIiwgZXJyKTtcbiAgICAgICAgICAgICAgICAvLyDpmY3nuqfvvJrkvb/nlKjmuJDlj5jog4zmma9cbiAgICAgICAgICAgICAgICBiZy5yZW1vdmVDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgICAgICAgICB2YXIgYmdHZnggPSBiZy5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICAgICAgICAgIGJnR2Z4LmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcig0NSwgMzUsIDI1KTtcbiAgICAgICAgICAgICAgICBiZ0dmeC5yb3VuZFJlY3QoLXBhbmVsV2lkdGgvMiwgLXBhbmVsSGVpZ2h0LzIsIHBhbmVsV2lkdGgsIHBhbmVsSGVpZ2h0LCAyMCk7XG4gICAgICAgICAgICAgICAgYmdHZnguZmlsbCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g6K6+572uc3ByaXRlRnJhbWVcbiAgICAgICAgICAgIGJnU3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWU7XG5cbiAgICAgICAgICAgIC8vIOWFs+mUru+8muWGjeasoeehruS/neWwuuWvuOato+ehru+8iOmYsuatouiiq+WbvueJh+WwuuWvuOimhueblu+8iVxuICAgICAgICAgICAgYmcuc2V0Q29udGVudFNpemUoY2Muc2l6ZShwYW5lbFdpZHRoLCBwYW5lbEhlaWdodCkpO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIuiDjOaZr+WbvuWKoOi9veaIkOWKn++8jOaYvuekuuWwuuWvuDogXCIgKyBiZy53aWR0aCArIFwiIHggXCIgKyBiZy5oZWlnaHQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDmoIfpopjmloflrZfvvIjmrKLkuZDnmbvlvZXvvIk9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyDph5HoibLmj4/ovrnvvIznmb3oibLkuLvkvZPvvIzlsYXkuK3vvIzpobbpg6jot53ovrk0MHB4XG4gICAgICAgIHZhciB0aXRsZU5vZGUgPSBuZXcgY2MuTm9kZShcIlRpdGxlXCIpO1xuICAgICAgICB0aXRsZU5vZGUucGFyZW50ID0gcGFuZWw7XG4gICAgICAgIHRpdGxlTm9kZS5zZXRQb3NpdGlvbigwLCBwYW5lbEhlaWdodC8yIC0gNjApO1xuICAgICAgICBcbiAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgdGl0bGVMYWJlbC5zdHJpbmcgPSBcIuasouS5kOeZu+W9lVwiO1xuICAgICAgICB0aXRsZUxhYmVsLmZvbnRTaXplID0gMzY7XG4gICAgICAgIHRpdGxlTGFiZWwubGluZUhlaWdodCA9IDQ0O1xuICAgICAgICB0aXRsZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIHRpdGxlTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOmHkeiJsuaPj+i+uVxuICAgICAgICB2YXIgdGl0bGVPdXRsaW5lID0gdGl0bGVOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbE91dGxpbmUpO1xuICAgICAgICB0aXRsZU91dGxpbmUuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjE4LCAxNjUsIDMyKTsgLy8g6YeR6ImyXG4gICAgICAgIHRpdGxlT3V0bGluZS53aWR0aCA9IDM7XG5cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5YWz6Zet5oyJ6ZKu77yI5Y+z5LiK6KeS5ZyG5b2i77yM57qi6YeR6Imy77yMNDZ4NDbvvIk9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgY2xvc2VCdG4gPSBuZXcgY2MuTm9kZShcIkJ0bkNsb3NlXCIpO1xuICAgICAgICBjbG9zZUJ0bi5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgY2xvc2VCdG4uc2V0Q29udGVudFNpemUoY2Muc2l6ZSg0NiwgNDYpKTtcbiAgICAgICAgY2xvc2VCdG4uc2V0UG9zaXRpb24ocGFuZWxXaWR0aC8yIC0gMzUsIHBhbmVsSGVpZ2h0LzIgLSAzNSk7XG4gICAgICAgIFxuICAgICAgICAvLyDnuqLph5HoibLlnIblvaLog4zmma9cbiAgICAgICAgdmFyIGNsb3NlR2Z4ID0gY2xvc2VCdG4uYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgY2xvc2VHZnguZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDIwMCwgNjAsIDYwKTsgLy8g57qi6ImyXG4gICAgICAgIGNsb3NlR2Z4LmNpcmNsZSgwLCAwLCAyMyk7XG4gICAgICAgIGNsb3NlR2Z4LmZpbGwoKTtcbiAgICAgICAgY2xvc2VHZnguc3Ryb2tlQ29sb3IgPSBuZXcgY2MuQ29sb3IoMjE4LCAxNjUsIDMyKTsgLy8g6YeR6Imy6L655qGGXG4gICAgICAgIGNsb3NlR2Z4LmxpbmVXaWR0aCA9IDI7XG4gICAgICAgIGNsb3NlR2Z4LmNpcmNsZSgwLCAwLCAyMik7XG4gICAgICAgIGNsb3NlR2Z4LnN0cm9rZSgpO1xuICAgICAgICBcbiAgICAgICAgLy8gWCDnrKblj7dcbiAgICAgICAgdmFyIGNsb3NlWCA9IG5ldyBjYy5Ob2RlKFwiWFwiKTtcbiAgICAgICAgY2xvc2VYLnBhcmVudCA9IGNsb3NlQnRuO1xuICAgICAgICB2YXIgY2xvc2VYTGFiZWwgPSBjbG9zZVguYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgY2xvc2VYTGFiZWwuc3RyaW5nID0gXCLDl1wiO1xuICAgICAgICBjbG9zZVhMYWJlbC5mb250U2l6ZSA9IDI4O1xuICAgICAgICBjbG9zZVhMYWJlbC5saW5lSGVpZ2h0ID0gMzI7XG4gICAgICAgIGNsb3NlWExhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIGNsb3NlWC5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KTtcblxuICAgICAgICBjbG9zZUJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4g54K55Ye75YWz6Zet5oyJ6ZKuXCIpO1xuICAgICAgICAgICAgLy8g8J+UpyDkv67lpI3vvJrph43nva7lvLnnqpfmmL7npLrmoIflv5fkvY1cbiAgICAgICAgICAgIHNlbGYuX3Bob25lTG9naW5Qb3B1cFNob3dpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOW3sumHjee9riBfcGhvbmVMb2dpblBvcHVwU2hvd2luZyDkuLogZmFsc2VcIik7XG5cbiAgICAgICAgICAgIC8vIOa4heeQhuWOn+eUnyBIVE1MIGlucHV0IOWFg+e0oFxuICAgICAgICAgICAgaWYgKGNjLnN5cy5pc0Jyb3dzZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25hdGl2ZS1pbnB1dC1jb250YWluZXInKTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyDlhbPpl63liqjnlLtcbiAgICAgICAgICAgIGNjLnR3ZWVuKHBhbmVsKVxuICAgICAgICAgICAgICAgIC50bygwLjE1LCB7IHNjYWxlOiAwLjgsIG9wYWNpdHk6IDAgfSwgeyBlYXNpbmc6ICdiYWNrSW4nIH0pXG4gICAgICAgICAgICAgICAgLmNhbGwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYy5pc1ZhbGlkKHBvcHVwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXAuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3RhcnQoKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g6KGo5Y2V5biD5bGA5Y+C5pWwID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIOagueaNruiDjOaZr+WbvmxvZ2luX2JnLnBuZyg1MjB4NjgwKeeahOeyvuehrumihOeVmeS9jee9ruiuvue9ruWFg+e0oFxuICAgICAgICAvLyDkvb/nlKjpobnnm67njrDmnInnmoRVSei1hOa6kO+8mlxuICAgICAgICAvLyAgIGljb25fcGhvbmUucG5nIC0g5omL5py65Zu+5qCHXG4gICAgICAgIC8vICAgaWNvbl9zaGllbGQucG5nIC0g6aqM6K+B56CB5Zu+5qCHXG4gICAgICAgIC8vICAgZ2V0X21vYmlsZV9jb2RlLnBuZyAtIOiOt+WPlumqjOivgeeggeaMiemSrlxuXG4gICAgICAgIC8vIOiuoeeul+e8qeaUvuavlOS+i++8iOWwj+Wxj+W5lemAgumFje+8iVxuICAgICAgICB2YXIgc2NhbGVSYXRpbyA9IHBhbmVsV2lkdGggLyA1MjA7XG5cbiAgICAgICAgLy8g6L6T5YWl5qGG5bC65a+4XG4gICAgICAgIHZhciBpbnB1dFdpZHRoID0gMjIwICogc2NhbGVSYXRpbzsgICAvLyDovpPlhaXmoYblrr3luqZcbiAgICAgICAgdmFyIGlucHV0SGVpZ2h0ID0gNDUgKiBzY2FsZVJhdGlvOyAgIC8vIOi+k+WFpeahhumrmOW6pu+8iOWHj+Wwj++8iVxuICAgICAgICB2YXIgaWNvblNpemUgPSAyNSAqIHNjYWxlUmF0aW87ICAgICAgLy8g5Zu+5qCH5aSn5bCPXG4gICAgICAgIHZhciBmb3JtWTEgPSAxMzAgKiBzY2FsZVJhdGlvOyAgICAgICAgLy8g56ys5LiA5Liq6L6T5YWl5qGGWeWdkOagh++8iOWQkeS4i+enu+WKqO+8iVxuICAgICAgICB2YXIgZm9ybVkyID0gNTAgKiBzY2FsZVJhdGlvOyAgICAgICAvLyDnrKzkuozkuKrovpPlhaXmoYZZ5Z2Q5qCHXG4gICAgICAgIHZhciBnZXRDb2RlQnRuV2lkdGggPSA5MCAqIHNjYWxlUmF0aW87ICAvLyDojrflj5bpqozor4HnoIHmjInpkq7lrr3luqZcbiAgICAgICAgdmFyIGJ0bkhlaWdodCA9IDQ1ICogc2NhbGVSYXRpbzsgICAgIC8vIOe7n+S4gOaMiemSrumrmOW6plxuXG4gICAgICAgIGNvbnNvbGUubG9nKFwi5biD5bGA5Y+C5pWwOiBzY2FsZVJhdGlvPVwiICsgc2NhbGVSYXRpby50b0ZpeGVkKDIpKTtcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDmiYvmnLrlj7fovpPlhaXooYwgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgLy8g5biD5bGA77yaW+Wbvuagh10gW+i+k+WFpeahhl0g5pW05L2T5bGF5LitXG4gICAgICAgIHZhciBwaG9uZVJvd1dpZHRoID0gaWNvblNpemUgKyAxNSArIGlucHV0V2lkdGg7ICAvLyDmgLvlrr3luqZcbiAgICAgICAgdmFyIHBob25lUm93WCA9IDA7ICAvLyDmlbTkvZPlsYXkuK1cblxuICAgICAgICAvLyDmiYvmnLrlm77moIcgLSDmlL7lnKjovpPlhaXmoYblt6bovrlcbiAgICAgICAgdmFyIHBob25lSWNvbk5vZGUgPSBuZXcgY2MuTm9kZShcIlBob25lSWNvblwiKTtcbiAgICAgICAgcGhvbmVJY29uTm9kZS5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgcGhvbmVJY29uTm9kZS5zZXRQb3NpdGlvbigtcGhvbmVSb3dXaWR0aC8yICsgaWNvblNpemUvMiArIDEwLCBmb3JtWTEpO1xuICAgICAgICBwaG9uZUljb25Ob2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoaWNvblNpemUsIGljb25TaXplKSk7XG5cbiAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoXCJVSS9sb2dpbi9pY29uX3Bob25lXCIsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoZXJyIHx8ICFjYy5pc1ZhbGlkKHBob25lSWNvbk5vZGUpKSByZXR1cm47XG4gICAgICAgICAgICB2YXIgaWNvblNwcml0ZSA9IHBob25lSWNvbk5vZGUuYWRkQ29tcG9uZW50KGNjLlNwcml0ZSk7XG4gICAgICAgICAgICBpY29uU3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWU7XG4gICAgICAgICAgICBpY29uU3ByaXRlLnNpemVNb2RlID0gY2MuU3ByaXRlLlNpemVNb2RlLkNVU1RPTTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5omL5py65Y+36L6T5YWl5qGGID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIGxvZ2luX2JnLnBuZyDkuK3lt7LljIXlkKvovpPlhaXmoYbog4zmma/vvIzlj6rpnIDmlL7nva7pgI/mmI7nmoQgRWRpdEJveFxuICAgICAgICAvLyDms6jmhI/vvJrnlLHkuo4gcGFuZWwg5pyJ57yp5pS+5Yqo55S777yMRWRpdEJveCDpnIDopoHlnKjliqjnlLvlrozmiJDlkI7liJvlu7rvvIzlkKbliJnngrnlh7vljLrln5/kvY3nva7kuI3lr7lcbiAgICAgICAgdmFyIHBob25lSW5wdXROb2RlID0gbmV3IGNjLk5vZGUoXCJQaG9uZUlucHV0XCIpO1xuICAgICAgICBwaG9uZUlucHV0Tm9kZS5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgcGhvbmVJbnB1dE5vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZShpbnB1dFdpZHRoLCBpbnB1dEhlaWdodCkpO1xuICAgICAgICBwaG9uZUlucHV0Tm9kZS5zZXRQb3NpdGlvbigtcGhvbmVSb3dXaWR0aC8yICsgaWNvblNpemUgKyAxNSArIGlucHV0V2lkdGgvMiwgZm9ybVkxKTtcbiAgICAgICAgcGhvbmVJbnB1dE5vZGUuekluZGV4ID0gMTAwO1xuXG4gICAgICAgIHZhciBwaG9uZUVkaXRCb3ggPSBudWxsOyAgLy8g5bu26L+f5Yib5bu6XG5cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g6aqM6K+B56CB6L6T5YWl6KGMID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIOW4g+WxgO+8mlvlm77moIddIFvovpPlhaXmoYZdIFvojrflj5bpqozor4HnoIHmjInpkq5dIOaVtOS9k+WxheS4rVxuICAgICAgICB2YXIgY29kZUlucHV0VyA9IGlucHV0V2lkdGggLSBnZXRDb2RlQnRuV2lkdGggLSAxMDsgIC8vIOmqjOivgeeggei+k+WFpeahhuWuveW6plxuICAgICAgICB2YXIgY29kZVJvd1dpZHRoID0gaWNvblNpemUgKyA1ICsgY29kZUlucHV0VyArIDUgKyBnZXRDb2RlQnRuV2lkdGg7ICAvLyDmgLvlrr3luqZcblxuICAgICAgICAvLyDpqozor4HnoIHlm77moIdcbiAgICAgICAgdmFyIGNvZGVJY29uTm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ29kZUljb25cIik7XG4gICAgICAgIGNvZGVJY29uTm9kZS5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgY29kZUljb25Ob2RlLnNldFBvc2l0aW9uKC1jb2RlUm93V2lkdGgvMiArIGljb25TaXplLzIgKyAxMCwgZm9ybVkyKTtcbiAgICAgICAgY29kZUljb25Ob2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoaWNvblNpemUsIGljb25TaXplKSk7XG5cbiAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoXCJVSS9sb2dpbi9pY29uX3NoaWVsZFwiLCBjYy5TcHJpdGVGcmFtZSwgZnVuY3Rpb24oZXJyLCBzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgaWYgKGVyciB8fCAhY2MuaXNWYWxpZChjb2RlSWNvbk5vZGUpKSByZXR1cm47XG4gICAgICAgICAgICB2YXIgaWNvblNwcml0ZSA9IGNvZGVJY29uTm9kZS5hZGRDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgICAgIGljb25TcHJpdGUuc3ByaXRlRnJhbWUgPSBzcHJpdGVGcmFtZTtcbiAgICAgICAgICAgIGljb25TcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDpqozor4HnoIHovpPlhaXmoYYgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgLy8gbG9naW5fYmcucG5nIOS4reW3suWMheWQq+i+k+WFpeahhuiDjOaZr++8jOWPqumcgOaUvue9rumAj+aYjueahCBFZGl0Qm94XG4gICAgICAgIC8vIOazqOaEj++8mueUseS6jiBwYW5lbCDmnInnvKnmlL7liqjnlLvvvIxFZGl0Qm94IOmcgOimgeWcqOWKqOeUu+WujOaIkOWQjuWIm+W7uu+8jOWQpuWImeeCueWHu+WMuuWfn+S9jee9ruS4jeWvuVxuICAgICAgICB2YXIgY29kZUlucHV0Tm9kZSA9IG5ldyBjYy5Ob2RlKFwiQ29kZUlucHV0XCIpO1xuICAgICAgICBjb2RlSW5wdXROb2RlLnBhcmVudCA9IHBhbmVsO1xuICAgICAgICBjb2RlSW5wdXROb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoY29kZUlucHV0VywgaW5wdXRIZWlnaHQpKTtcbiAgICAgICAgY29kZUlucHV0Tm9kZS5zZXRQb3NpdGlvbigtY29kZVJvd1dpZHRoLzIgKyBpY29uU2l6ZSArIDUgKyBjb2RlSW5wdXRXLzIsIGZvcm1ZMik7XG4gICAgICAgIGNvZGVJbnB1dE5vZGUuekluZGV4ID0gMTAwO1xuXG4gICAgICAgIHZhciBjb2RlRWRpdEJveCA9IG51bGw7ICAvLyDlu7bov5/liJvlu7pcblxuICAgICAgICAvLyDojrflj5bpqozor4HnoIHmjInpkq5cbiAgICAgICAgdmFyIGdldENvZGVCdG4gPSBuZXcgY2MuTm9kZShcIkJ0bkdldENvZGVcIik7XG4gICAgICAgIGdldENvZGVCdG4ucGFyZW50ID0gcGFuZWw7XG4gICAgICAgIGdldENvZGVCdG4uc2V0Q29udGVudFNpemUoY2Muc2l6ZShnZXRDb2RlQnRuV2lkdGgsIGJ0bkhlaWdodCkpO1xuICAgICAgICBnZXRDb2RlQnRuLnNldFBvc2l0aW9uKGNvZGVSb3dXaWR0aC8yIC0gZ2V0Q29kZUJ0bldpZHRoLzIsIGZvcm1ZMik7XG5cbiAgICAgICAgdmFyIGdldENvZGVCdG5Db21wID0gZ2V0Q29kZUJ0bi5hZGRDb21wb25lbnQoY2MuQnV0dG9uKTtcbiAgICAgICAgZ2V0Q29kZUJ0bkNvbXAudHJhbnNpdGlvbiA9IGNjLkJ1dHRvbi5UcmFuc2l0aW9uLlNDQUxFO1xuICAgICAgICBnZXRDb2RlQnRuQ29tcC56b29tU2NhbGUgPSAwLjk1O1xuXG4gICAgICAgIGNjLnJlc291cmNlcy5sb2FkKFwiVUkvbG9naW4vZ2V0X21vYmlsZV9jb2RlXCIsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoIWNjLmlzVmFsaWQoZ2V0Q29kZUJ0bikpIHJldHVybjtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCLliqDovb3ojrflj5bpqozor4HnoIHmjInpkq7lm77niYflpLHotKU6XCIsIGVycik7XG4gICAgICAgICAgICAgICAgLy8g6ZmN57qn77ya5L2/55So57qv6Imy5oyJ6ZKuXG4gICAgICAgICAgICAgICAgdmFyIGJ0bkdmeCA9IGdldENvZGVCdG4uYWRkQ29tcG9uZW50KGNjLkdyYXBoaWNzKTtcbiAgICAgICAgICAgICAgICBidG5HZnguZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMTY1LCAwKTtcbiAgICAgICAgICAgICAgICBidG5HZngucm91bmRSZWN0KC1nZXRDb2RlQnRuV2lkdGgvMiwgLWlucHV0SGVpZ2h0LzIsIGdldENvZGVCdG5XaWR0aCwgaW5wdXRIZWlnaHQsIDUpO1xuICAgICAgICAgICAgICAgIGJ0bkdmeC5maWxsKCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgYnRuTGFiZWwgPSBuZXcgY2MuTm9kZShcIkxhYmVsXCIpO1xuICAgICAgICAgICAgICAgIGJ0bkxhYmVsLnBhcmVudCA9IGdldENvZGVCdG47XG4gICAgICAgICAgICAgICAgdmFyIGxhYmVsQ29tcCA9IGJ0bkxhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgICAgICAgICAgbGFiZWxDb21wLnN0cmluZyA9IFwi6I635Y+W6aqM6K+B56CBXCI7XG4gICAgICAgICAgICAgICAgbGFiZWxDb21wLmZvbnRTaXplID0gMTIgKiBzY2FsZVJhdGlvO1xuICAgICAgICAgICAgICAgIGxhYmVsQ29tcC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICAgICAgICAgIGJ0bkxhYmVsLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBidG5TcHJpdGUgPSBnZXRDb2RlQnRuLmFkZENvbXBvbmVudChjYy5TcHJpdGUpO1xuICAgICAgICAgICAgYnRuU3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWU7XG4gICAgICAgICAgICBidG5TcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NO1xuICAgICAgICAgICAgZ2V0Q29kZUJ0bi5zZXRDb250ZW50U2l6ZShjYy5zaXplKGdldENvZGVCdG5XaWR0aCwgYnRuSGVpZ2h0KSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOWAkuiuoeaXtueKtuaAgVxuICAgICAgICB2YXIgY291bnRkb3duID0gMDtcbiAgICAgICAgdmFyIGNvdW50ZG93bkxhYmVsID0gbnVsbDtcblxuICAgICAgICAvLyDlvIDlp4vlgJLorqHml7ZcbiAgICAgICAgdmFyIHN0YXJ0Q291bnRkb3duID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb3VudGRvd24gPSA2MDtcbiAgICAgICAgICAgIGdldENvZGVCdG5Db21wLmludGVyYWN0YWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgZ2V0Q29kZUJ0bi5vcGFjaXR5ID0gMTUwO1xuXG4gICAgICAgICAgICB2YXIgdGljayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGNvdW50ZG93bi0tO1xuICAgICAgICAgICAgICAgIGlmIChjb3VudGRvd24gPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICBnZXRDb2RlQnRuQ29tcC5pbnRlcmFjdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBnZXRDb2RlQnRuLm9wYWNpdHkgPSAyNTU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb3VudGRvd25MYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRkb3duTGFiZWwuc3RyaW5nID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY291bnRkb3duTGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50ZG93bkxhYmVsID0gbmV3IGNjLk5vZGUoXCJDb3VudGRvd25cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudGRvd25MYWJlbC5wYXJlbnQgPSBnZXRDb2RlQnRuO1xuICAgICAgICAgICAgICAgICAgICAgICAgY291bnRkb3duTGFiZWwuY29sb3IgPSBuZXcgY2MuQ29sb3IoMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFiZWxDb21wID0gY291bnRkb3duTGFiZWwuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsQ29tcC5mb250U2l6ZSA9IDE0ICogc2NhbGVSYXRpbztcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsQ29tcC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvdW50ZG93bkxhYmVsLmdldENvbXBvbmVudChjYy5MYWJlbCkuc3RyaW5nID0gY291bnRkb3duICsgXCJzXCI7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKHRpY2ssIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBzZWxmLnNjaGVkdWxlT25jZSh0aWNrLCAxKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDmiYvmnLrnmbvlvZXmjInpkq4gPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgLy8gYnRuX21vYmlsZV9sb2dpbi5wbmcg5Y6f5aeL5bC65a+4OiAzNDAgeCA1MO+8jOWuvemrmOavlCA2Ljg6MVxuICAgICAgICB2YXIgbG9naW5CdG5ZID0gZm9ybVkyIC0gNzAgKiBzY2FsZVJhdGlvO1xuICAgICAgICB2YXIgbG9naW5CdG5IZWlnaHQgPSA1MCAqIHNjYWxlUmF0aW87ICAvLyDmjInpkq7pq5jluqZcbiAgICAgICAgdmFyIGxvZ2luQnRuV2lkdGggPSBsb2dpbkJ0bkhlaWdodCAqIDYuODsgIC8vIOaMieWbvueJh+WOn+Wni+avlOS+i+iuoeeul+WuveW6piAoMzQwLzUwPTYuOClcblxuICAgICAgICB2YXIgbG9naW5CdG4gPSBuZXcgY2MuTm9kZShcIkJ0bkxvZ2luXCIpO1xuICAgICAgICBsb2dpbkJ0bi5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgbG9naW5CdG4uc2V0Q29udGVudFNpemUoY2Muc2l6ZShsb2dpbkJ0bldpZHRoLCBsb2dpbkJ0bkhlaWdodCkpO1xuICAgICAgICBsb2dpbkJ0bi5zZXRQb3NpdGlvbigwLCBsb2dpbkJ0blkpO1xuXG4gICAgICAgIC8vIOWwneivleWKoOi9veaMiemSruWbvueJh1xuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcIlVJL2xvZ2luL2J0bl9tb2JpbGVfbG9naW5cIiwgY2MuU3ByaXRlRnJhbWUsIGZ1bmN0aW9uKGVyciwgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgIGlmICghY2MuaXNWYWxpZChsb2dpbkJ0bikpIHJldHVybjtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAvLyDpmY3nuqfvvJrkvb/nlKjnuq/oibLmjInpkq5cbiAgICAgICAgICAgICAgICB2YXIgbG9naW5HZnggPSBsb2dpbkJ0bi5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICAgICAgICAgIGxvZ2luR2Z4LmZpbGxDb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDE0MCwgMCk7XG4gICAgICAgICAgICAgICAgbG9naW5HZngucm91bmRSZWN0KC1sb2dpbkJ0bldpZHRoLzIsIC1sb2dpbkJ0bkhlaWdodC8yLCBsb2dpbkJ0bldpZHRoLCBsb2dpbkJ0bkhlaWdodCwgOCAqIHNjYWxlUmF0aW8pO1xuICAgICAgICAgICAgICAgIGxvZ2luR2Z4LmZpbGwoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbG9naW5TcHJpdGUgPSBsb2dpbkJ0bi5hZGRDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgICAgIGxvZ2luU3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWU7XG4gICAgICAgICAgICBsb2dpblNwcml0ZS5zaXplTW9kZSA9IGNjLlNwcml0ZS5TaXplTW9kZS5DVVNUT007XG4gICAgICAgICAgICBsb2dpbkJ0bi5zZXRDb250ZW50U2l6ZShjYy5zaXplKGxvZ2luQnRuV2lkdGgsIGxvZ2luQnRuSGVpZ2h0KSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBsb2dpbkJ0bkNvbXAgPSBsb2dpbkJ0bi5hZGRDb21wb25lbnQoY2MuQnV0dG9uKTtcbiAgICAgICAgbG9naW5CdG5Db21wLnRyYW5zaXRpb24gPSBjYy5CdXR0b24uVHJhbnNpdGlvbi5TQ0FMRTtcbiAgICAgICAgbG9naW5CdG5Db21wLnpvb21TY2FsZSA9IDAuOTU7XG5cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5b6u5L+h55m75b2V5oyJ6ZKuID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIC8vIGljb25fd2VjaGF0LnBuZyDljp/lp4vlsLrlr7g6IDQ4IHggNDjvvIjmraPmlrnlvaLvvIlcbiAgICAgICAgdmFyIHd4QnRuWSA9IGxvZ2luQnRuWSAtIDE1NSAqIHNjYWxlUmF0aW87ICAvLyDlvoDkuIvnp7vliqjmm7TlpJpcbiAgICAgICAgdmFyIHd4QnRuU2l6ZSA9IDQ4ICogc2NhbGVSYXRpbzsgIC8vIOS9v+eUqOWbvueJh+WOn+Wni+WwuuWvuCA0OFxuXG4gICAgICAgIHZhciB3eEJ0biA9IG5ldyBjYy5Ob2RlKFwiQnRuV2VjaGF0XCIpO1xuICAgICAgICB3eEJ0bi5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgd3hCdG4uc2V0Q29udGVudFNpemUoY2Muc2l6ZSh3eEJ0blNpemUsIHd4QnRuU2l6ZSkpO1xuICAgICAgICB3eEJ0bi5zZXRQb3NpdGlvbigwLCB3eEJ0blkpO1xuXG4gICAgICAgIC8vIOWwneivleWKoOi9veW+ruS/oeWbvuagh1xuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcIlVJL2xvZ2luL2ljb25fd2VjaGF0XCIsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoIWNjLmlzVmFsaWQod3hCdG4pKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgLy8g6ZmN57qn77ya5L2/55So57u/6Imy5ZyG5b2i6IOM5pmvXG4gICAgICAgICAgICAgICAgdmFyIHd4QmdHZnggPSB3eEJ0bi5hZGRDb21wb25lbnQoY2MuR3JhcGhpY3MpO1xuICAgICAgICAgICAgICAgIHd4QmdHZnguZmlsbENvbG9yID0gbmV3IGNjLkNvbG9yKDcsIDE5MywgOTYpO1xuICAgICAgICAgICAgICAgIHd4QmdHZnguY2lyY2xlKDAsIDAsIHd4QnRuU2l6ZS8yKTtcbiAgICAgICAgICAgICAgICB3eEJnR2Z4LmZpbGwoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgd3hTcHJpdGUgPSB3eEJ0bi5hZGRDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgICAgIHd4U3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWU7XG4gICAgICAgICAgICB3eFNwcml0ZS5zaXplTW9kZSA9IGNjLlNwcml0ZS5TaXplTW9kZS5DVVNUT007XG4gICAgICAgICAgICB3eEJ0bi5zZXRDb250ZW50U2l6ZShjYy5zaXplKHd4QnRuU2l6ZSwgd3hCdG5TaXplKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciB3eEJ0bkNvbXAgPSB3eEJ0bi5hZGRDb21wb25lbnQoY2MuQnV0dG9uKTtcbiAgICAgICAgd3hCdG5Db21wLnRyYW5zaXRpb24gPSBjYy5CdXR0b24uVHJhbnNpdGlvbi5TQ0FMRTtcbiAgICAgICAgd3hCdG5Db21wLnpvb21TY2FsZSA9IDAuOTU7XG5cbiAgICAgICAgLy8g5b6u5L+h55m75b2V5paH5a2XIC0g6ZqQ6JePXG4gICAgICAgIC8vIHZhciB3eExhYmVsID0gbmV3IGNjLk5vZGUoXCJMYWJlbFdlY2hhdFwiKTtcbiAgICAgICAgLy8gd3hMYWJlbC5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgLy8gd3hMYWJlbC5zZXRQb3NpdGlvbigwLCB3eEJ0blkgLSAzNSAqIHNjYWxlUmF0aW8pO1xuICAgICAgICAvLyB2YXIgd3hMYWJlbENvbXAgPSB3eExhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIC8vIHd4TGFiZWxDb21wLnN0cmluZyA9IFwi5b6u5L+h55m75b2VXCI7XG4gICAgICAgIC8vIHd4TGFiZWxDb21wLmZvbnRTaXplID0gMTIgKiBzY2FsZVJhdGlvO1xuICAgICAgICAvLyB3eExhYmVsQ29tcC5ob3Jpem9udGFsQWxpZ24gPSBjYy5MYWJlbC5Ib3Jpem9udGFsQWxpZ24uQ0VOVEVSO1xuICAgICAgICAvLyB3eExhYmVsLmNvbG9yID0gbmV3IGNjLkNvbG9yKDEwMCwgODAsIDYwKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIuaMiemSruS9jee9rjogbG9naW5CdG5ZPVwiICsgbG9naW5CdG5ZLnRvRml4ZWQoMCkgKyBcIiwgd3hCdG5ZPVwiICsgd3hCdG5ZLnRvRml4ZWQoMCkpO1xuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOa2iOaBr+aPkOekuu+8iOmakOiXj++8iT09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBtZXNzYWdlTGFiZWwgPSBuZXcgY2MuTm9kZShcIk1lc3NhZ2VMYWJlbFwiKTtcbiAgICAgICAgbWVzc2FnZUxhYmVsLnBhcmVudCA9IHBhbmVsO1xuICAgICAgICBtZXNzYWdlTGFiZWwuc2V0UG9zaXRpb24oMCwgLXBhbmVsSGVpZ2h0LzIgKyA1MCk7XG4gICAgICAgIHZhciBtZXNzYWdlTGFiZWxDb21wID0gbWVzc2FnZUxhYmVsLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIG1lc3NhZ2VMYWJlbENvbXAuc3RyaW5nID0gXCJcIjtcbiAgICAgICAgbWVzc2FnZUxhYmVsQ29tcC5mb250U2l6ZSA9IDE0O1xuICAgICAgICBtZXNzYWdlTGFiZWxDb21wLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIG1lc3NhZ2VMYWJlbC5hY3RpdmUgPSBmYWxzZTtcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDlvLnnqpfov5vlhaXliqjnlLsgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgY2MudHdlZW4ocGFuZWwpXG4gICAgICAgICAgICAudG8oMC4yNSwgeyBzY2FsZTogMSwgb3BhY2l0eTogMjU1IH0sIHsgZWFzaW5nOiAnYmFja091dCcgfSlcbiAgICAgICAgICAgIC5jYWxsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIFdlYiDlubPlj7DvvJrnm7TmjqXliJvlu7rljp/nlJ8gSFRNTCBpbnB1dCDlhYPntKBcbiAgICAgICAgICAgICAgICBpZiAoY2Muc3lzLmlzQnJvd3Nlcikge1xuICAgICAgICAgICAgICAgICAgICBfY3JlYXRlTmF0aXZlSW5wdXRFbGVtZW50cyhwYW5lbCwgcGhvbmVJbnB1dE5vZGUsIGNvZGVJbnB1dE5vZGUsIGlucHV0V2lkdGgsIGlucHV0SGVpZ2h0LCBjb2RlSW5wdXRXLCBwYW5lbFdpZHRoLCBwYW5lbEhlaWdodCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g6Z2eIFdlYiDlubPlj7DvvJrkvb/nlKggQ29jb3MgRWRpdEJveFxuICAgICAgICAgICAgICAgICAgICBwaG9uZUVkaXRCb3ggPSBwaG9uZUlucHV0Tm9kZS5hZGRDb21wb25lbnQoY2MuRWRpdEJveCk7XG4gICAgICAgICAgICAgICAgICAgIHBob25lRWRpdEJveC5wbGFjZWhvbGRlciA9IFwi6K+36L6T5YWl5omL5py65Y+3XCI7XG4gICAgICAgICAgICAgICAgICAgIHBob25lRWRpdEJveC5mb250U2l6ZSA9IDE4O1xuICAgICAgICAgICAgICAgICAgICBwaG9uZUVkaXRCb3gucGxhY2Vob2xkZXJGb250U2l6ZSA9IDE0O1xuICAgICAgICAgICAgICAgICAgICBwaG9uZUVkaXRCb3guZm9udENvbG9yID0gbmV3IGNjLkNvbG9yKDUwLCA1MCwgNTAsIDI1NSk7XG4gICAgICAgICAgICAgICAgICAgIHBob25lRWRpdEJveC5wbGFjZWhvbGRlckZvbnRDb2xvciA9IG5ldyBjYy5Db2xvcigxNTAsIDE1MCwgMTUwLCAyNTUpO1xuICAgICAgICAgICAgICAgICAgICBwaG9uZUVkaXRCb3guaW5wdXRGbGFnID0gY2MuRWRpdEJveC5JbnB1dEZsYWcuU0VOU0lUSVZFO1xuICAgICAgICAgICAgICAgICAgICBwaG9uZUVkaXRCb3guaW5wdXRNb2RlID0gY2MuRWRpdEJveC5JbnB1dE1vZGUuTlVNRVJJQztcbiAgICAgICAgICAgICAgICAgICAgcGhvbmVFZGl0Qm94Lm1heExlbmd0aCA9IDExO1xuICAgICAgICAgICAgICAgICAgICBwaG9uZUVkaXRCb3guYmFja2dyb3VuZENvbG9yID0gbmV3IGNjLkNvbG9yKDAsIDAsIDAsIDApO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgY29kZUVkaXRCb3ggPSBjb2RlSW5wdXROb2RlLmFkZENvbXBvbmVudChjYy5FZGl0Qm94KTtcbiAgICAgICAgICAgICAgICAgICAgY29kZUVkaXRCb3gucGxhY2Vob2xkZXIgPSBcIumqjOivgeeggVwiO1xuICAgICAgICAgICAgICAgICAgICBjb2RlRWRpdEJveC5mb250U2l6ZSA9IDE4O1xuICAgICAgICAgICAgICAgICAgICBjb2RlRWRpdEJveC5wbGFjZWhvbGRlckZvbnRTaXplID0gMTQ7XG4gICAgICAgICAgICAgICAgICAgIGNvZGVFZGl0Qm94LmZvbnRDb2xvciA9IG5ldyBjYy5Db2xvcig1MCwgNTAsIDUwLCAyNTUpO1xuICAgICAgICAgICAgICAgICAgICBjb2RlRWRpdEJveC5wbGFjZWhvbGRlckZvbnRDb2xvciA9IG5ldyBjYy5Db2xvcigxNTAsIDE1MCwgMTUwLCAyNTUpO1xuICAgICAgICAgICAgICAgICAgICBjb2RlRWRpdEJveC5pbnB1dEZsYWcgPSBjYy5FZGl0Qm94LklucHV0RmxhZy5TRU5TSVRJVkU7XG4gICAgICAgICAgICAgICAgICAgIGNvZGVFZGl0Qm94LmlucHV0TW9kZSA9IGNjLkVkaXRCb3guSW5wdXRNb2RlLk5VTUVSSUM7XG4gICAgICAgICAgICAgICAgICAgIGNvZGVFZGl0Qm94Lm1heExlbmd0aCA9IDY7XG4gICAgICAgICAgICAgICAgICAgIGNvZGVFZGl0Qm94LmJhY2tncm91bmRDb2xvciA9IG5ldyBjYy5Db2xvcigwLCAwLCAwLCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLovpPlhaXmoYbliJvlu7rlrozmiJBcIik7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnN0YXJ0KCk7XG5cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5Yqf6IO96YC76L6RID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBwaG9uZSA9IFwiXCI7XG4gICAgICAgIHZhciBjb2RlID0gXCJcIjtcblxuICAgICAgICAvLyDojrflj5bovpPlhaXlgLznmoTovoXliqnlh73mlbDvvIjmlK/mjIHljp/nlJ8gSFRNTCBpbnB1dO+8iVxuICAgICAgICB2YXIgZ2V0SW5wdXRWYWx1ZSA9IGZ1bmN0aW9uKGlucHV0SWQpIHtcbiAgICAgICAgICAgIGlmIChjYy5zeXMuaXNCcm93c2VyKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaW5wdXRJZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlucHV0ID8gaW5wdXQudmFsdWUgOiBcIlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8g6aqM6K+B5omL5py65Y+3XG4gICAgICAgIHZhciB2YWxpZGF0ZVBob25lID0gZnVuY3Rpb24ocGhvbmUpIHtcbiAgICAgICAgICAgIGlmICghcGhvbmUgfHwgcGhvbmUubGVuZ3RoICE9PSAxMSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIC9eMVszLTldXFxkezl9JC8udGVzdChwaG9uZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8g5pi+56S65raI5oGvXG4gICAgICAgIHZhciBzaG93TWVzc2FnZSA9IGZ1bmN0aW9uKG1zZywgaXNFcnJvcikge1xuICAgICAgICAgICAgbWVzc2FnZUxhYmVsLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICBtZXNzYWdlTGFiZWxDb21wLnN0cmluZyA9IG1zZztcbiAgICAgICAgICAgIG1lc3NhZ2VMYWJlbC5jb2xvciA9IGlzRXJyb3IgPyBuZXcgY2MuQ29sb3IoMjU1LCA4MCwgODApIDogbmV3IGNjLkNvbG9yKDEwMCwgMjAwLCAxMDApO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIOiOt+WPlumqjOivgeeggSAtIG9uR2V0Q29kZSgpXG4gICAgICAgIGdldENvZGVCdG4ub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIOaUr+aMgeWOn+eUnyBIVE1MIGlucHV0IOaIliBDb2NvcyBFZGl0Qm94XG4gICAgICAgICAgICBpZiAoY2Muc3lzLmlzQnJvd3Nlcikge1xuICAgICAgICAgICAgICAgIHBob25lID0gZ2V0SW5wdXRWYWx1ZSgnbmF0aXZlLXBob25lLWlucHV0Jyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHBob25lRWRpdEJveCkge1xuICAgICAgICAgICAgICAgIHBob25lID0gcGhvbmVFZGl0Qm94LnN0cmluZyB8fCBcIlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIXZhbGlkYXRlUGhvbmUocGhvbmUpKSB7XG4gICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoXCLor7fovpPlhaXmraPnoa7nmoTmiYvmnLrlj7dcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZGVmaW5lcyA9IHdpbmRvdy5kZWZpbmVzO1xuICAgICAgICAgICAgaWYgKCFkZWZpbmVzIHx8ICFkZWZpbmVzLmFwaVVybCkge1xuICAgICAgICAgICAgICAgIHNob3dNZXNzYWdlKFwi6aqM6K+B56CB5bey5Y+R6YCBKOa1i+ivlSlcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHN0YXJ0Q291bnRkb3duKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDkvb/nlKjliqDlr4bor7fmsYLlj5HpgIHpqozor4HnoIFcbiAgICAgICAgICAgIHZhciBIdHRwQVBJID0gd2luZG93Lkh0dHBBUEk7XG4gICAgICAgICAgICBpZiAoSHR0cEFQSSAmJiBkZWZpbmVzLmNyeXB0b0tleSkge1xuICAgICAgICAgICAgICAgIEh0dHBBUEkucG9zdEVuY3J5cHRlZChcbiAgICAgICAgICAgICAgICAgICAgZGVmaW5lcy5hcGlVcmwgKyAnL2FwaS92MS9hdXRoL3NlbmQtY29kZScsXG4gICAgICAgICAgICAgICAgICAgICdzZW5kX2NvZGUnLFxuICAgICAgICAgICAgICAgICAgICB7IHBob25lOiBwaG9uZSB9LFxuICAgICAgICAgICAgICAgICAgICBkZWZpbmVzLmNyeXB0b0tleSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oZXJyLCByZXNwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoZXJyIHx8IFwi5Y+R6YCB5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwICYmIHJlc3AuY29kZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3dNZXNzYWdlKFwi6aqM6K+B56CB5bey5Y+R6YCBXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydENvdW50ZG93bigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93TWVzc2FnZShyZXNwLm1lc3NhZ2UgfHwgXCLlj5HpgIHlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDpmY3nuqfvvJrkvb/nlKjmmI7mlofor7fmsYJcbiAgICAgICAgICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICAgICAgeGhyLm9wZW4oJ1BPU1QnLCBkZWZpbmVzLmFwaVVybCArICcvYXBpL3YxL2F1dGgvc2VuZC1jb2RlJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgICAgeGhyLnRpbWVvdXQgPSAxMDAwMDtcbiAgICAgICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwLmNvZGUgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3dNZXNzYWdlKFwi6aqM6K+B56CB5bey5Y+R6YCBXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0Q291bnRkb3duKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93TWVzc2FnZShyZXNwLm1lc3NhZ2UgfHwgXCLlj5HpgIHlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoXCLop6PmnpDlk43lupTlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93TWVzc2FnZShcIue9kee7nOivt+axguWksei0pVwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgeGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBwaG9uZTogcGhvbmUgfSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyDmiYvmnLrnmbvlvZUgLSBvblBob25lTG9naW4oKVxuICAgICAgICBsb2dpbkJ0bi5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8g5pSv5oyB5Y6f55SfIEhUTUwgaW5wdXQg5oiWIENvY29zIEVkaXRCb3hcbiAgICAgICAgICAgIGlmIChjYy5zeXMuaXNCcm93c2VyKSB7XG4gICAgICAgICAgICAgICAgcGhvbmUgPSBnZXRJbnB1dFZhbHVlKCduYXRpdmUtcGhvbmUtaW5wdXQnKTtcbiAgICAgICAgICAgICAgICBjb2RlID0gZ2V0SW5wdXRWYWx1ZSgnbmF0aXZlLWNvZGUtaW5wdXQnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHBob25lRWRpdEJveCkgcGhvbmUgPSBwaG9uZUVkaXRCb3guc3RyaW5nIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgaWYgKGNvZGVFZGl0Qm94KSBjb2RlID0gY29kZUVkaXRCb3guc3RyaW5nIHx8IFwiXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdmFsaWRhdGVQaG9uZShwaG9uZSkpIHtcbiAgICAgICAgICAgICAgICBzaG93TWVzc2FnZShcIuivt+i+k+WFpeato+ehrueahOaJi+acuuWPt1wiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNob3dNZXNzYWdlKFwi5q2j5Zyo55m75b2VLi4uXCIsIGZhbHNlKTtcblxuICAgICAgICAgICAgdmFyIGRlZmluZXMgPSB3aW5kb3cuZGVmaW5lcztcbiAgICAgICAgICAgIGlmICghZGVmaW5lcyB8fCAhZGVmaW5lcy5hcGlVcmwpIHtcbiAgICAgICAgICAgICAgICAvLyDml6BBUEnphY3nva7vvIzmqKHmi5/nmbvlvZXmiJDlip9cbiAgICAgICAgICAgICAgICBpZiAod2luZG93Lm15Z2xvYmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2dpbkRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1bmlxdWVJRDogXCJwaG9uZV9cIiArIHBob25lLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBcInBob25lX1wiICsgcGhvbmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBuaWNrTmFtZTogXCLnjqnlrrZcIiArIHBob25lLnN1YnN0cigtNCksXG4gICAgICAgICAgICAgICAgICAgICAgICBhdmF0YXJVcmw6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBnb2xkQ291bnQ6IDEwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbjogXCJ0ZXN0X3Rva2VuX1wiICsgRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBob25lOiBwaG9uZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2luVHlwZTogMVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwub25Mb2dpblN1Y2Nlc3MobG9naW5EYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoXCLnmbvlvZXmiJDlip9cIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBfcmVtb3ZlTmF0aXZlSW5wdXRFbGVtZW50cygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2MuaXNWYWxpZChwb3B1cCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIik7XG4gICAgICAgICAgICAgICAgfSwgMC41KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOS9v+eUqOWKoOWvhuivt+axgueZu+W9lVxuICAgICAgICAgICAgdmFyIEh0dHBBUEkgPSB3aW5kb3cuSHR0cEFQSTtcbiAgICAgICAgICAgIGlmIChIdHRwQVBJICYmIGRlZmluZXMuY3J5cHRvS2V5KSB7XG4gICAgICAgICAgICAgICAgSHR0cEFQSS5wb3N0RW5jcnlwdGVkKFxuICAgICAgICAgICAgICAgICAgICBkZWZpbmVzLmFwaVVybCArICcvYXBpL3YxL2F1dGgvcGhvbmUtbG9naW4nLFxuICAgICAgICAgICAgICAgICAgICAncGhvbmVfbG9naW4nLFxuICAgICAgICAgICAgICAgICAgICB7IHBob25lOiBwaG9uZSwgY29kZTogY29kZSB9LFxuICAgICAgICAgICAgICAgICAgICBkZWZpbmVzLmNyeXB0b0tleSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oZXJyLCByZXNwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoZXJyIHx8IFwi55m75b2V5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwICYmIHJlc3AuY29kZSA9PT0gMCAmJiByZXNwLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93TWVzc2FnZShcIueZu+W9leaIkOWKn1wiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5L2/55SoIG15Z2xvYmFsLm9uTG9naW5TdWNjZXNzIOS/neWtmOeZu+W9leeKtuaAgVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cubXlnbG9iYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxvZ2luRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXF1ZUlEOiByZXNwLmRhdGEudW5pcXVlSUQgfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogcmVzcC5kYXRhLmFjY291bnRJRCB8fCBcIlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmlja05hbWU6IHJlc3AuZGF0YS5uaWNrTmFtZSB8fCBcIueOqeWutlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhdGFyVXJsOiByZXNwLmRhdGEuYXZhdGFyVXJsIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2xkQ291bnQ6IHJlc3AuZGF0YS5nb2xkY291bnQgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2VuOiByZXNwLmRhdGEudG9rZW4gfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBob25lOiBwaG9uZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2luVHlwZTogMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwub25Mb2dpblN1Y2Nlc3MobG9naW5EYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9yZW1vdmVOYXRpdmVJbnB1dEVsZW1lbnRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYy5pc1ZhbGlkKHBvcHVwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXAuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZShcImhhbGxTY2VuZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93TWVzc2FnZShyZXNwLm1lc3NhZ2UgfHwgXCLnmbvlvZXlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDpmY3nuqfvvJrkvb/nlKjmmI7mlofor7fmsYJcbiAgICAgICAgICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICAgICAgeGhyLm9wZW4oJ1BPU1QnLCBkZWZpbmVzLmFwaVVybCArICcvYXBpL3YxL2F1dGgvcGhvbmUtbG9naW4nLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignWC1EZXZpY2UtSUQnLCAnd2ViXycgKyBEYXRlLm5vdygpKTtcbiAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignWC1EZXZpY2UtVHlwZScsICdXZWIgQnJvd3NlcicpO1xuICAgICAgICAgICAgICAgIHhoci50aW1lb3V0ID0gMTAwMDA7XG4gICAgICAgICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3AgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcC5jb2RlID09PSAwICYmIHJlc3AuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoXCLnmbvlvZXmiJDlip9cIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g5L2/55SoIG15Z2xvYmFsLm9uTG9naW5TdWNjZXNzIOS/neWtmOeZu+W9leeKtuaAgVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5teWdsb2JhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsb2dpbkRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXF1ZUlEOiByZXNwLmRhdGEudW5pcXVlSUQgfHwgcmVzcC5kYXRhLnBsYXllcl9pZCB8fCBcIlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHJlc3AuZGF0YS5hY2NvdW50SUQgfHwgcmVzcC5kYXRhLmFjY291bnRfaWQgfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmlja05hbWU6IHJlc3AuZGF0YS5uaWNrTmFtZSB8fCByZXNwLmRhdGEubmlja25hbWUgfHwgXCLnjqnlrrZcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhdGFyVXJsOiByZXNwLmRhdGEuYXZhdGFyVXJsIHx8IHJlc3AuZGF0YS5hdmF0YXIgfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29sZENvdW50OiByZXNwLmRhdGEuZ29sZGNvdW50IHx8IHJlc3AuZGF0YS5nb2xkIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRva2VuOiByZXNwLmRhdGEudG9rZW4gfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGhvbmU6IHBob25lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dpblR5cGU6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5vbkxvZ2luU3VjY2Vzcyhsb2dpbkRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3JlbW92ZU5hdGl2ZUlucHV0RWxlbWVudHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2MuaXNWYWxpZChwb3B1cCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXAuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UocmVzcC5tZXNzYWdlIHx8IFwi55m75b2V5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3dNZXNzYWdlKFwi6Kej5p6Q5ZON5bqU5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoXCLnvZHnu5zor7fmsYLlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KHsgcGhvbmU6IHBob25lLCBjb2RlOiBjb2RlIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5b6u5L+h55m75b2VIC0gb25XZWNoYXRMb2dpbigpXG4gICAgICAgIHd4QnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzaG93TWVzc2FnZShcIuato+WcqOeZu+W9lS4uLlwiLCBmYWxzZSk7XG5cbiAgICAgICAgICAgIHZhciBkZWZpbmVzID0gd2luZG93LmRlZmluZXM7XG5cbiAgICAgICAgICAgIGlmICghZGVmaW5lcyB8fCAhZGVmaW5lcy5hcGlVcmwpIHtcbiAgICAgICAgICAgICAgICAvLyDml6BBUEnphY3nva7vvIzmqKHmi5/nmbvlvZXmiJDlip9cbiAgICAgICAgICAgICAgICBpZiAod2luZG93Lm15Z2xvYmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2dpbkRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1bmlxdWVJRDogXCJ3eF9cIiArIERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IFwid3hfXCIgKyBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmlja05hbWU6IFwi5b6u5L+h55So5oi3XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBhdmF0YXJVcmw6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBnb2xkQ291bnQ6IDEwMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2tlbjogXCJ0ZXN0X3d4X3Rva2VuX1wiICsgRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2luVHlwZTogMlxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwub25Mb2dpblN1Y2Nlc3MobG9naW5EYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoXCLnmbvlvZXmiJDlip9cIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBfcmVtb3ZlTmF0aXZlSW5wdXRFbGVtZW50cygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2MuaXNWYWxpZChwb3B1cCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIik7XG4gICAgICAgICAgICAgICAgfSwgMC41KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOS9v+eUqOWKoOWvhuivt+axguW+ruS/oeeZu+W9lVxuICAgICAgICAgICAgdmFyIEh0dHBBUEkgPSB3aW5kb3cuSHR0cEFQSTtcbiAgICAgICAgICAgIGlmIChIdHRwQVBJICYmIGRlZmluZXMuY3J5cHRvS2V5KSB7XG4gICAgICAgICAgICAgICAgSHR0cEFQSS5wb3N0RW5jcnlwdGVkKFxuICAgICAgICAgICAgICAgICAgICBkZWZpbmVzLmFwaVVybCArICcvYXBpL3YxL2F1dGgvd3gtbG9naW4nLFxuICAgICAgICAgICAgICAgICAgICAnd3hfbG9naW4nLFxuICAgICAgICAgICAgICAgICAgICB7IGNvZGU6IFwidGVzdF9jb2RlX1wiICsgRGF0ZS5ub3coKSB9LFxuICAgICAgICAgICAgICAgICAgICBkZWZpbmVzLmNyeXB0b0tleSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oZXJyLCByZXNwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoZXJyIHx8IFwi55m75b2V5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwICYmIHJlc3AuY29kZSA9PT0gMCAmJiByZXNwLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93TWVzc2FnZShcIueZu+W9leaIkOWKn1wiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5teWdsb2JhbCAmJiB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS51bmlxdWVJRCA9IHJlc3AuZGF0YS51bmlxdWVJRCB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5hY2NvdW50SUQgPSByZXNwLmRhdGEuYWNjb3VudElEIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLm5pY2tOYW1lID0gcmVzcC5kYXRhLm5pY2tOYW1lIHx8IFwi5b6u5L+h55So5oi3XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnVzZXJOYW1lID0gcmVzcC5kYXRhLnVzZXJuYW1lIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLmF2YXRhciA9IHJlc3AuZGF0YS5hdmF0YXJVcmwgfHwgXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuZ29iYWxfY291bnQgPSByZXNwLmRhdGEuZ29sZENvdW50IHx8IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnRva2VuID0gcmVzcC5kYXRhLnRva2VuIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOS/neWtmOWIsOacrOWcsOWtmOWCqFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5zYXZlVG9Mb2NhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIuOAkOW+ruS/oeeZu+W9leOAkeeUqOaIt+aVsOaNruW3suS/neWtmCwgbmlja05hbWUgPVwiLCB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5uaWNrTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfcmVtb3ZlTmF0aXZlSW5wdXRFbGVtZW50cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2MuaXNWYWxpZChwb3B1cCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMC41KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UocmVzcC5tZXNzYWdlIHx8IFwi55m75b2V5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8g6ZmN57qn77ya5L2/55So5piO5paH6K+35rGCXG4gICAgICAgICAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICAgICAgIHhoci5vcGVuKCdQT1NUJywgZGVmaW5lcy5hcGlVcmwgKyAnL2FwaS92MS9hdXRoL3d4LWxvZ2luJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICAgICAgeGhyLnRpbWVvdXQgPSAxMDAwMDtcbiAgICAgICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwLmNvZGUgPT09IDAgJiYgcmVzcC5kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93TWVzc2FnZShcIueZu+W9leaIkOWKn1wiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAod2luZG93Lm15Z2xvYmFsICYmIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEudW5pcXVlSUQgPSByZXNwLmRhdGEucGxheWVyX2lkIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEID0gcmVzcC5kYXRhLmFjY291bnRfaWQgfHwgXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5uaWNrTmFtZSA9IHJlc3AuZGF0YS5uaWNrbmFtZSB8fCBcIuW+ruS/oeeUqOaIt1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnVzZXJOYW1lID0gcmVzcC5kYXRhLnVzZXJuYW1lIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYXZhdGFyID0gcmVzcC5kYXRhLmF2YXRhciB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLmdvYmFsX2NvdW50ID0gcmVzcC5kYXRhLmdvbGQgfHwgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS50b2tlbiA9IHJlc3AuZGF0YS50b2tlbiB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOS/neWtmOWIsOacrOWcsOWtmOWCqFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnNhdmVUb0xvY2FsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLjgJDlvq7kv6HnmbvlvZVYSFLjgJHnlKjmiLfmlbDmja7lt7Lkv53lrZgsIG5pY2tOYW1lID1cIiwgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEubmlja05hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3JlbW92ZU5hdGl2ZUlucHV0RWxlbWVudHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2MuaXNWYWxpZChwb3B1cCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXAuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UocmVzcC5tZXNzYWdlIHx8IFwi55m75b2V5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3dNZXNzYWdlKFwi6Kej5p6Q5ZON5bqU5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvd01lc3NhZ2UoXCLnvZHnu5zor7fmsYLlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KHsgY29kZTogXCJ0ZXN0X2NvZGVfXCIgKyBEYXRlLm5vdygpIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gcG9wdXA7XG4gICAgfSxcblxuICAgIF9zaG93VXNlckFncmVlbWVudFBvcHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fY3JlYXRlQWdyZWVtZW50UG9wdXAoKTtcbiAgICB9LFxuXG4gICAgLy8g5Yib5bu655So5oi35Y2P6K6u5by556qXXG4gICAgX2NyZWF0ZUFncmVlbWVudFBvcHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5by556qX5qC56IqC54K5ID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBwb3B1cCA9IG5ldyBjYy5Ob2RlKFwidXNlcl9hZ3JlZW1lbnRfcG9wdXBcIik7XG4gICAgICAgIHBvcHVwLnBhcmVudCA9IHRoaXMubm9kZTtcbiAgICAgICAgcG9wdXAuc2V0Q29udGVudFNpemUoY2Muc2l6ZSgxMjgwLCA3MjApKTtcbiAgICAgICAgcG9wdXAuc2V0UG9zaXRpb24oMCwgMCk7XG4gICAgICAgIHBvcHVwLnpJbmRleCA9IDEwMDA7XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDljYrpgI/mmI7pu5HoibLog4zmma/pga7nvakgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdmFyIGJnTWFzayA9IG5ldyBjYy5Ob2RlKFwiYmdfbWFza1wiKTtcbiAgICAgICAgYmdNYXNrLnBhcmVudCA9IHBvcHVwO1xuICAgICAgICBiZ01hc2suc2V0Q29udGVudFNpemUoY2Muc2l6ZSgxMjgwLCA3MjApKTtcbiAgICAgICAgYmdNYXNrLnNldFBvc2l0aW9uKDAsIDApO1xuICAgICAgICB2YXIgYmdNYXNrU3ByaXRlID0gYmdNYXNrLmFkZENvbXBvbmVudChjYy5TcHJpdGUpO1xuICAgICAgICBiZ01hc2tTcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NO1xuICAgICAgICBiZ01hc2suY29sb3IgPSBuZXcgY2MuQ29sb3IoMCwgMCwgMCk7XG4gICAgICAgIGJnTWFzay5vcGFjaXR5ID0gMTgwO1xuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5Li76Z2i5p2/ID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBwYW5lbCA9IG5ldyBjYy5Ob2RlKFwiY29udGVudF9wYW5lbFwiKTtcbiAgICAgICAgcGFuZWwucGFyZW50ID0gcG9wdXA7XG4gICAgICAgIHBhbmVsLnNldENvbnRlbnRTaXplKGNjLnNpemUoOTAwLCA1MjApKTtcbiAgICAgICAgcGFuZWwuc2V0UG9zaXRpb24oMCwgMCk7XG4gICAgICAgIHZhciBwYW5lbFNwcml0ZSA9IHBhbmVsLmFkZENvbXBvbmVudChjYy5TcHJpdGUpO1xuICAgICAgICBwYW5lbFNwcml0ZS5zaXplTW9kZSA9IGNjLlNwcml0ZS5TaXplTW9kZS5DVVNUT007XG4gICAgICAgIHBhbmVsLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjUwLCAyNDApO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yqg6L296IOM5pmv5Zu+54mHXG4gICAgICAgIGNjLnJlc291cmNlcy5sb2FkKFwiaW1hZ2VzL3VzZXJfYWdyZWVtZW50X2JnXCIsIGNjLlNwcml0ZUZyYW1lLCBmdW5jdGlvbihlcnIsIHNwcml0ZUZyYW1lKSB7XG4gICAgICAgICAgICBpZiAoIWNjLmlzVmFsaWQocGFuZWwpKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoIWVyciAmJiBzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgICAgIHBhbmVsU3ByaXRlLnNwcml0ZUZyYW1lID0gc3ByaXRlRnJhbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOagh+mimCA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgdGl0bGVOb2RlID0gbmV3IGNjLk5vZGUoXCJ0aXRsZV9sYWJlbFwiKTtcbiAgICAgICAgdGl0bGVOb2RlLnBhcmVudCA9IHBhbmVsO1xuICAgICAgICB0aXRsZU5vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZSgzMDAsIDYwKSk7XG4gICAgICAgIHRpdGxlTm9kZS5zZXRQb3NpdGlvbigwLCAyMzApO1xuICAgICAgICB2YXIgdGl0bGVMYWJlbCA9IHRpdGxlTm9kZS5hZGRDb21wb25lbnQoY2MuTGFiZWwpO1xuICAgICAgICB0aXRsZUxhYmVsLnN0cmluZyA9IFwi55So5oi35Y2P6K6uXCI7XG4gICAgICAgIHRpdGxlTGFiZWwuZm9udFNpemUgPSAzNjtcbiAgICAgICAgdGl0bGVMYWJlbC5saW5lSGVpZ2h0ID0gNjA7XG4gICAgICAgIHRpdGxlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgdGl0bGVOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDMwLCAzMCwgMzApO1xuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOWFs+mXreaMiemSriA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgY2xvc2VCdG4gPSBuZXcgY2MuTm9kZShcImNsb3NlX2J0blwiKTtcbiAgICAgICAgY2xvc2VCdG4ucGFyZW50ID0gcGFuZWw7XG4gICAgICAgIGNsb3NlQnRuLnNldENvbnRlbnRTaXplKGNjLnNpemUoNjAsIDYwKSk7XG4gICAgICAgIGNsb3NlQnRuLnNldFBvc2l0aW9uKDQwMCwgMjMwKTtcbiAgICAgICAgXG4gICAgICAgIHZhciBjbG9zZUJ0bkJnID0gbmV3IGNjLk5vZGUoXCJiZ1wiKTtcbiAgICAgICAgY2xvc2VCdG5CZy5wYXJlbnQgPSBjbG9zZUJ0bjtcbiAgICAgICAgY2xvc2VCdG5CZy5zZXRDb250ZW50U2l6ZShjYy5zaXplKDUwLCA1MCkpO1xuICAgICAgICBjbG9zZUJ0bkJnLnNldFBvc2l0aW9uKDAsIDApO1xuICAgICAgICB2YXIgY2xvc2VCZ1Nwcml0ZSA9IGNsb3NlQnRuQmcuYWRkQ29tcG9uZW50KGNjLlNwcml0ZSk7XG4gICAgICAgIGNsb3NlQmdTcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NO1xuICAgICAgICBjbG9zZUJ0bkJnLmNvbG9yID0gbmV3IGNjLkNvbG9yKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNsb3NlTGFiZWxOb2RlID0gbmV3IGNjLk5vZGUoXCJ4XCIpO1xuICAgICAgICBjbG9zZUxhYmVsTm9kZS5wYXJlbnQgPSBjbG9zZUJ0bjtcbiAgICAgICAgY2xvc2VMYWJlbE5vZGUuc2V0UG9zaXRpb24oMCwgMCk7XG4gICAgICAgIHZhciBjbG9zZUxhYmVsID0gY2xvc2VMYWJlbE5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgY2xvc2VMYWJlbC5zdHJpbmcgPSBcIsOXXCI7XG4gICAgICAgIGNsb3NlTGFiZWwuZm9udFNpemUgPSA0MDtcbiAgICAgICAgY2xvc2VMYWJlbC5saW5lSGVpZ2h0ID0gNTA7XG4gICAgICAgIGNsb3NlTGFiZWwuaG9yaXpvbnRhbEFsaWduID0gY2MuTGFiZWwuSG9yaXpvbnRhbEFsaWduLkNFTlRFUjtcbiAgICAgICAgY2xvc2VMYWJlbE5vZGUuY29sb3IgPSBuZXcgY2MuQ29sb3IoODAsIDgwLCA4MCk7XG4gICAgICAgIFxuICAgICAgICB2YXIgY2xvc2VCdG5Db21wID0gY2xvc2VCdG4uYWRkQ29tcG9uZW50KGNjLkJ1dHRvbik7XG4gICAgICAgIGNsb3NlQnRuQ29tcC50cmFuc2l0aW9uID0gY2MuQnV0dG9uLlRyYW5zaXRpb24uU0NBTEU7XG4gICAgICAgIGNsb3NlQnRuQ29tcC56b29tU2NhbGUgPSAxLjI7XG4gICAgICAgIGNsb3NlQnRuQ29tcC5pbnRlcmFjdGFibGUgPSB0cnVlO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNsb3NlSGFuZGxlciA9IG5ldyBjYy5Db21wb25lbnQuRXZlbnRIYW5kbGVyKCk7XG4gICAgICAgIGNsb3NlSGFuZGxlci50YXJnZXQgPSB0aGlzLm5vZGU7XG4gICAgICAgIGNsb3NlSGFuZGxlci5jb21wb25lbnQgPSBcImxvZ2luU2NlbmVcIjtcbiAgICAgICAgY2xvc2VIYW5kbGVyLmhhbmRsZXIgPSBcIl9jbG9zZVVzZXJBZ3JlZW1lbnRQb3B1cFwiO1xuICAgICAgICBjbG9zZUhhbmRsZXIuY3VzdG9tRXZlbnREYXRhID0gXCJcIjtcbiAgICAgICAgY2xvc2VCdG5Db21wLmNsaWNrRXZlbnRzLnB1c2goY2xvc2VIYW5kbGVyKTtcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDliIbpmpTnur8gPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdmFyIGRpdmlkZXJMaW5lID0gbmV3IGNjLk5vZGUoXCJkaXZpZGVyXCIpO1xuICAgICAgICBkaXZpZGVyTGluZS5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgZGl2aWRlckxpbmUuc2V0Q29udGVudFNpemUoY2Muc2l6ZSg4NTAsIDEpKTtcbiAgICAgICAgZGl2aWRlckxpbmUuc2V0UG9zaXRpb24oMCwgMTk1KTtcbiAgICAgICAgdmFyIGRpdmlkZXJTcHJpdGUgPSBkaXZpZGVyTGluZS5hZGRDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgZGl2aWRlclNwcml0ZS5zaXplTW9kZSA9IGNjLlNwcml0ZS5TaXplTW9kZS5DVVNUT007XG4gICAgICAgIGRpdmlkZXJMaW5lLmNvbG9yID0gbmV3IGNjLkNvbG9yKDIyMCwgMjIwLCAyMjApO1xuXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOWGheWuuea7muWKqOWMuuWfnyA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICAvLyDmlbTkvZPkuIrnp7vvvIzlop7liqDlupXpg6jnqbrpl7TvvIzmt7vliqDmu5rliqjlip/og71cbiAgICAgICAgdmFyIHNjcm9sbE5vZGUgPSBuZXcgY2MuTm9kZShcInNjcm9sbF92aWV3XCIpO1xuICAgICAgICBzY3JvbGxOb2RlLnBhcmVudCA9IHBhbmVsO1xuICAgICAgICBzY3JvbGxOb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoODIwLCAzODApKTsgIC8vIOiwg+aVtOWuveW6plxuICAgICAgICBzY3JvbGxOb2RlLnNldFBvc2l0aW9uKDAsIDApOyAgLy8g5LiK56e7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqAgU2Nyb2xsVmlldyDnu4Tku7blrp7njrDmu5rliqjlip/og71cbiAgICAgICAgdmFyIHNjcm9sbFZpZXcgPSBzY3JvbGxOb2RlLmFkZENvbXBvbmVudChjYy5TY3JvbGxWaWV3KTtcbiAgICAgICAgc2Nyb2xsVmlldy5ob3Jpem9udGFsID0gZmFsc2U7ICAvLyDnpoHnlKjmsLTlubPmu5rliqhcbiAgICAgICAgc2Nyb2xsVmlldy52ZXJ0aWNhbCA9IHRydWU7ICAgICAvLyDlkK/nlKjlnoLnm7Tmu5rliqhcbiAgICAgICAgc2Nyb2xsVmlldy5pbmVydGlhID0gdHJ1ZTsgICAgICAvLyDmu5rliqjmg6/mgKdcbiAgICAgICAgc2Nyb2xsVmlldy5lbGFzdGljID0gdHJ1ZTsgICAgICAvLyDlvLnmgKfmlYjmnpxcbiAgICAgICAgXG4gICAgICAgIHZhciB2aWV3Tm9kZSA9IG5ldyBjYy5Ob2RlKFwidmlld1wiKTtcbiAgICAgICAgdmlld05vZGUucGFyZW50ID0gc2Nyb2xsTm9kZTtcbiAgICAgICAgdmlld05vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZSg4MjAsIDM4MCkpOyAgLy8g6LCD5pW05a695bqmXG4gICAgICAgIHZpZXdOb2RlLnNldFBvc2l0aW9uKDAsIDApO1xuICAgICAgICBcbiAgICAgICAgdmFyIG1hc2sgPSB2aWV3Tm9kZS5hZGRDb21wb25lbnQoY2MuTWFzayk7XG4gICAgICAgIG1hc2sudHlwZSA9IGNjLk1hc2suVHlwZS5SRUNUO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNvbnRlbnROb2RlID0gbmV3IGNjLk5vZGUoXCJjb250ZW50XCIpO1xuICAgICAgICBjb250ZW50Tm9kZS5wYXJlbnQgPSB2aWV3Tm9kZTtcbiAgICAgICAgY29udGVudE5vZGUuYW5jaG9yWCA9IDAuNTtcbiAgICAgICAgY29udGVudE5vZGUuYW5jaG9yWSA9IDE7XG4gICAgICAgIGNvbnRlbnROb2RlLnNldFBvc2l0aW9uKDAsIDE5MCk7ICAvLyDlsYXkuK3lr7npvZBcbiAgICAgICAgY29udGVudE5vZGUuc2V0Q29udGVudFNpemUoY2Muc2l6ZSg4MjAsIDgwMCkpOyAgLy8g5aKe5Yqg6auY5bqm5Lul5a6557qz5omA5pyJ5YaF5a65XG4gICAgICAgIFxuICAgICAgICAvLyDorr7nva4gU2Nyb2xsVmlldyDnmoQgY29udGVudCDlsZ7mgKdcbiAgICAgICAgc2Nyb2xsVmlldy5jb250ZW50ID0gY29udGVudE5vZGU7XG4gICAgICAgIFxuICAgICAgICB2YXIgcmljaFRleHROb2RlID0gbmV3IGNjLk5vZGUoXCJyaWNoX3RleHRcIik7XG4gICAgICAgIHJpY2hUZXh0Tm9kZS5wYXJlbnQgPSBjb250ZW50Tm9kZTtcbiAgICAgICAgcmljaFRleHROb2RlLmFuY2hvclggPSAwO1xuICAgICAgICByaWNoVGV4dE5vZGUuYW5jaG9yWSA9IDE7XG4gICAgICAgIHJpY2hUZXh0Tm9kZS5zZXRQb3NpdGlvbigtMzg1LCAtMTUpOyAgLy8g5aKe5Yqg5bem6L656Led77yM5paH5a2X5pW05L2T5LiK56e7XG4gICAgICAgIFxuICAgICAgICB2YXIgcmljaFRleHQgPSByaWNoVGV4dE5vZGUuYWRkQ29tcG9uZW50KGNjLlJpY2hUZXh0KTtcbiAgICAgICAgcmljaFRleHQuZm9udFNpemUgPSAxNjsgIC8vIOWtl+WPt+WKoOWkp++8mjE0IC0+IDE2XG4gICAgICAgIHJpY2hUZXh0LmxpbmVIZWlnaHQgPSAyNjsgIC8vIOihjOmrmOWKoOWkp++8mjI0IC0+IDI2XG4gICAgICAgIHJpY2hUZXh0Lm1heFdpZHRoID0gNzYwOyAgLy8g6LCD5pW05a695bqm77yM56Gu5L+d5bem5Y+z6L656LedXG4gICAgICAgIFxuICAgICAgICAvLyDorr7nva7mloflrZfpopzoibLkuLrpu5HoibJcbiAgICAgICAgdmFyIGFncmVlbWVudFRleHQgPSBcIjxiPjxjb2xvcj0jMDAwMDAwPueUqOaIt+WNj+iurjwvY29sb3I+PC9iPlxcblxcblwiICtcbiAgICAgICAgICAgIFwiPGNvbG9yPSMwMDAwMDA+5qyi6L+O5L2/55So5pys5ri45oiP77yB5Zyo5L2/55So5YmN77yM6K+35LuU57uG6ZiF6K+75Lul5LiL5Y2P6K6u77yaPC9jb2xvcj5cXG5cXG5cIiArXG4gICAgICAgICAgICBcIjxiPjxjb2xvcj0jMDAwMDAwPuS4gOOAgeacjeWKoeadoeasvjwvY29sb3I+PC9iPlxcblwiICtcbiAgICAgICAgICAgIFwiPGNvbG9yPSMwMDAwMDA+MS4g55So5oi35bqU6YG15a6I5Zu95a625rOV5b6L5rOV6KeE77yM5paH5piO5ri45oiP44CCPC9jb2xvcj5cXG5cIiArXG4gICAgICAgICAgICBcIjxjb2xvcj0jMDAwMDAwPjIuIOemgeatouS9v+eUqOWkluaMguOAgeS9nOW8iui9r+S7tuetieegtOWdj+a4uOaIj+WFrOW5s+aAp+eahOihjOS4uuOAgjwvY29sb3I+XFxuXCIgK1xuICAgICAgICAgICAgXCI8Y29sb3I9IzAwMDAwMD4zLiDnlKjmiLfotKblj7flronlhajnlLHnlKjmiLfoh6rooYzotJ/otKPvvIzor7flpqXlloTkv53nrqHotKblj7flr4bnoIHjgII8L2NvbG9yPlxcblxcblwiICtcbiAgICAgICAgICAgIFwiPGI+PGNvbG9yPSMwMDAwMDA+5LqM44CB6ZqQ56eB5pS/562WPC9jb2xvcj48L2I+XFxuXCIgK1xuICAgICAgICAgICAgXCI8Y29sb3I9IzAwMDAwMD4xLiDmiJHku6zkvJrmlLbpm4blv4XopoHnmoTnlKjmiLfkv6Hmga/nlKjkuo7mj5DkvpvmnI3liqHjgII8L2NvbG9yPlxcblwiICtcbiAgICAgICAgICAgIFwiPGNvbG9yPSMwMDAwMDA+Mi4g5oiR5Lus5om/6K+65L+d5oqk55So5oi36ZqQ56eB77yM5LiN5Lya5ZCR56ys5LiJ5pa55rOE6Zyy55So5oi35L+h5oGv44CCPC9jb2xvcj5cXG5cIiArXG4gICAgICAgICAgICBcIjxjb2xvcj0jMDAwMDAwPjMuIOeUqOaIt+acieadg+imgeaxguWIoOmZpOS4quS6uuaVsOaNruOAgjwvY29sb3I+XFxuXFxuXCIgK1xuICAgICAgICAgICAgXCI8Yj48Y29sb3I9IzAwMDAwMD7kuInjgIHlhY3otKPlo7DmmI48L2NvbG9yPjwvYj5cXG5cIiArXG4gICAgICAgICAgICBcIjxjb2xvcj0jMDAwMDAwPjEuIOWboOS4jeWPr+aKl+WKm+WvvOiHtOeahOacjeWKoeS4reaWre+8jOaIkeS7rOS4jeaJv+aLhei0o+S7u+OAgjwvY29sb3I+XFxuXCIgK1xuICAgICAgICAgICAgXCI8Y29sb3I9IzAwMDAwMD4yLiDnlKjmiLflm6Dov53op4Tmk43kvZzpgKDmiJDnmoTmjZ/lpLHvvIznlLHnlKjmiLfoh6rooYzmib/mi4XjgII8L2NvbG9yPlxcblxcblwiICtcbiAgICAgICAgICAgIFwiPGNvbG9yPSMwMDAwMDA+5aaC5pyJ55aR6Zeu77yM6K+36IGU57O75a6i5pyN44CCPC9jb2xvcj5cIjtcbiAgICAgICAgXG4gICAgICAgIHJpY2hUZXh0LnN0cmluZyA9IGFncmVlbWVudFRleHQ7XG4gICAgICAgIFxuICAgICAgICAvLyDmu5rliqjliLDpobbpg6hcbiAgICAgICAgc2Nyb2xsVmlldy5zY3JvbGxUb1RvcCgwKTtcblxuICAgICAgICB0aGlzLl91c2VyQWdyZWVtZW50UG9wdXAgPSBwb3B1cDtcbiAgICB9LFxuXG4gICAgX2Nsb3NlVXNlckFncmVlbWVudFBvcHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3VzZXJBZ3JlZW1lbnRQb3B1cCkge1xuICAgICAgICAgICAgdGhpcy5fdXNlckFncmVlbWVudFBvcHVwLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMuX3VzZXJBZ3JlZW1lbnRQb3B1cCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vIOmUgOavgeaXtua4heeQhlxuICAgIG9uRGVzdHJveSAoKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZUdsb2JhbFRvdWNoRm9yTXVzaWMoKTtcbiAgICB9XG59KTtcbiJdfQ==