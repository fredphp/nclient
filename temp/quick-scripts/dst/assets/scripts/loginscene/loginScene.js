
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
    phoneInput.setAttribute('autocomplete', 'off'); // 🔧【修复】禁用浏览器自动填充历史记录

    phoneInput.setAttribute('autocapitalize', 'off'); // 禁用自动大写

    phoneInput.setAttribute('autocorrect', 'off'); // 禁用自动纠正

    phoneInput.style.cssText = ['position: absolute', 'left: ' + phoneScreen.left + 'px', 'top: ' + phoneScreen.top + 'px', 'width: ' + phoneScreen.width + 'px', 'height: ' + phoneScreen.height + 'px', 'background: transparent', 'border: none', 'border-radius: 0', 'font-size: 12px', 'color: #333', 'padding: 0 8px', 'box-sizing: border-box', 'outline: none', 'pointer-events: auto', 'z-index: 100000', 'cursor: text', 'font-family: Arial, "Microsoft YaHei", sans-serif', 'line-height: ' + phoneScreen.height + 'px', 'text-align: left'].join('; ');
    container.appendChild(phoneInput); // 创建验证码输入框

    var codeInput = document.createElement('input');
    codeInput.id = 'native-code-input';
    codeInput.type = 'text';
    codeInput.placeholder = '验证码';
    codeInput.maxLength = 6;
    codeInput.setAttribute('autocomplete', 'off'); // 🔧【修复】禁用浏览器自动填充历史记录

    codeInput.setAttribute('autocapitalize', 'off'); // 禁用自动大写

    codeInput.setAttribute('autocorrect', 'off'); // 禁用自动纠正

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
      // 初始化场景中预置的手机登录弹窗（login 节点）
      this._initPhoneLoginPopup();
    } catch (e) {
      console.error("初始化手机登录弹窗时出错:", e);
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
    console.log(">>> _showPhoneLoginPopup 被调用");

    this._createPhoneLoginPopup();
  },
  _createPhoneLoginPopup: function _createPhoneLoginPopup() {
    console.log(">>> _createPhoneLoginPopup 被调用");

    try {
      var popup = this._createPhoneLoginDynamic();

      console.log(">>> 登录弹窗显示完成:", popup ? popup.name : "null");
      this._phoneLoginPopup = popup;
    } catch (e) {
      console.error("显示手机登录弹窗失败:", e);

      this._showError("无法显示登录弹窗: " + e.message);

      this._phoneLoginPopupShowing = false;
    }
  },
  // 初始化场景中预置的 login 弹窗节点与事件（仅执行一次）
  _initPhoneLoginPopup: function _initPhoneLoginPopup() {
    var self = this;
    var popup = this.node.getChildByName("login");

    if (!popup) {
      console.error("login 弹窗节点未找到，请在 loginScene 中创建 login 节点");
      return;
    }

    popup.active = false;

    if (!popup.getComponent(cc.BlockInputEvents)) {
      popup.addComponent(cc.BlockInputEvents);
    }

    var panel = popup.getChildByName("login_bg") || popup;
    var closeBtn = popup.getChildByName("closeBtn");
    var phoneInputNode = popup.getChildByName("login_phone");
    var codeInputNode = popup.getChildByName("login_code");
    var getCodeBtn = popup.getChildByName("get_mobile_code");
    var loginBtn = popup.getChildByName("btn_mobile_login");
    var wxBtn = popup.getChildByName("icon_wx");
    var tipNode = popup.getChildByName("tip");
    var phoneEditBox = phoneInputNode ? phoneInputNode.getComponent(cc.EditBox) : null;
    var codeEditBox = codeInputNode ? codeInputNode.getComponent(cc.EditBox) : null;

    if (phoneEditBox) {
      phoneEditBox.maxLength = 11;
      phoneEditBox.inputMode = cc.EditBox.InputMode.PHONE_NUMBER;
    }

    if (codeEditBox) {
      codeEditBox.maxLength = 6;
      codeEditBox.inputMode = cc.EditBox.InputMode.NUMERIC;
    }

    var getCodeBtnComp = getCodeBtn ? getCodeBtn.getComponent(cc.Button) : null;
    var btnLabelNode = getCodeBtn ? getCodeBtn.getChildByName("btnlabel") : null;
    var countdownLabelNode = getCodeBtn ? getCodeBtn.getChildByName("countdownlabel") : null;
    var btnLabelComp = btnLabelNode ? btnLabelNode.getComponent(cc.Label) : null;
    var countdownLabelComp = countdownLabelNode ? countdownLabelNode.getComponent(cc.Label) : null;
    var tipLabelComp = tipNode ? tipNode.getComponent(cc.Label) : null;

    if (countdownLabelNode) {
      countdownLabelNode.active = false;
    }

    if (tipNode) {
      tipNode.active = false;
    }

    this._phoneLoginUI = {
      popup: popup,
      panel: panel,
      closeBtn: closeBtn,
      phoneInputNode: phoneInputNode,
      codeInputNode: codeInputNode,
      phoneEditBox: phoneEditBox,
      codeEditBox: codeEditBox,
      getCodeBtn: getCodeBtn,
      getCodeBtnComp: getCodeBtnComp,
      loginBtn: loginBtn,
      wxBtn: wxBtn,
      tipNode: tipNode,
      tipLabelComp: tipLabelComp,
      btnLabelNode: btnLabelNode,
      btnLabelComp: btnLabelComp,
      countdownLabelNode: countdownLabelNode,
      countdownLabelComp: countdownLabelComp,
      countdown: 0
    };

    if (closeBtn) {
      closeBtn.off(cc.Node.EventType.TOUCH_END);
      closeBtn.on(cc.Node.EventType.TOUCH_END, function () {
        self._closePhoneLoginPopup();
      }, this);
    }

    if (getCodeBtn) {
      getCodeBtn.off(cc.Node.EventType.TOUCH_END);
      getCodeBtn.on(cc.Node.EventType.TOUCH_END, function () {
        self._onPhoneLoginGetCode();
      }, this);
    }

    if (loginBtn) {
      loginBtn.off(cc.Node.EventType.TOUCH_END);
      loginBtn.on(cc.Node.EventType.TOUCH_END, function () {
        self._onPhoneLoginSubmit();
      }, this);
    }

    if (wxBtn) {
      wxBtn.off(cc.Node.EventType.TOUCH_END);
      wxBtn.on(cc.Node.EventType.TOUCH_END, function () {
        self._onPhoneLoginWx();
      }, this);
    }
  },
  _getPhoneLoginInputValue: function _getPhoneLoginInputValue(inputId, editBox) {
    if (cc.sys.isBrowser) {
      var input = document.getElementById(inputId);
      return input ? input.value : "";
    }

    return editBox ? editBox.string || "" : "";
  },
  _validatePhoneLoginPhone: function _validatePhoneLoginPhone(phone) {
    if (!phone || phone.length !== 11) return false;
    return /^1[3-9]\d{9}$/.test(phone);
  },
  _showPhoneLoginTip: function _showPhoneLoginTip(msg, isError) {
    var ui = this._phoneLoginUI;
    if (!ui || !ui.tipNode || !ui.tipLabelComp) return;
    ui.tipNode.active = true;
    ui.tipLabelComp.string = msg;
    ui.tipNode.color = isError ? new cc.Color(255, 80, 80) : new cc.Color(100, 200, 100);
  },
  _resetPhoneLoginCountdownUI: function _resetPhoneLoginCountdownUI() {
    var ui = this._phoneLoginUI;
    if (!ui) return;
    ui.countdown = 0;
    if (ui.getCodeBtnComp) ui.getCodeBtnComp.interactable = true;
    if (ui.getCodeBtn) ui.getCodeBtn.opacity = 255;
    if (ui.btnLabelNode) ui.btnLabelNode.active = true;

    if (ui.countdownLabelNode) {
      ui.countdownLabelNode.active = false;
      if (ui.countdownLabelComp) ui.countdownLabelComp.string = "";
    }
  },
  _startPhoneLoginCountdown: function _startPhoneLoginCountdown() {
    var self = this;
    var ui = this._phoneLoginUI;
    if (!ui) return;
    ui.countdown = 60;
    if (ui.getCodeBtnComp) ui.getCodeBtnComp.interactable = false;
    if (ui.getCodeBtn) ui.getCodeBtn.opacity = 150;
    if (ui.btnLabelNode) ui.btnLabelNode.active = false;
    if (ui.countdownLabelNode) ui.countdownLabelNode.active = true;

    var tick = function tick() {
      if (!self._phoneLoginUI || !cc.isValid(self._phoneLoginUI.popup)) return;
      var cur = self._phoneLoginUI;
      cur.countdown--;

      if (cur.countdown <= 0) {
        self._resetPhoneLoginCountdownUI();
      } else {
        if (cur.countdownLabelComp) {
          cur.countdownLabelComp.string = cur.countdown + "s";
        }

        self.scheduleOnce(tick, 1);
      }
    };

    if (ui.countdownLabelComp) {
      ui.countdownLabelComp.string = ui.countdown + "s";
    }

    self.scheduleOnce(tick, 1);
  },
  _closePhoneLoginPopup: function _closePhoneLoginPopup() {
    var self = this;
    var ui = this._phoneLoginUI;

    if (!ui || !ui.popup || !cc.isValid(ui.popup)) {
      this._phoneLoginPopupShowing = false;
      return;
    }

    this._phoneLoginPopupShowing = false;

    _removeNativeInputElements();

    var panel = ui.panel;
    var popup = ui.popup;

    if (ui.phoneEditBox) {
      ui.phoneEditBox.string = "";
    }

    if (ui.codeEditBox) {
      ui.codeEditBox.string = "";
    }

    if (ui.tipNode) {
      ui.tipNode.active = false;
    }

    this._resetPhoneLoginCountdownUI();

    cc.tween(panel).to(0.15, {
      scale: 0.8,
      opacity: 0
    }, {
      easing: 'backIn'
    }).call(function () {
      if (cc.isValid(popup)) {
        popup.active = false;
        panel.scale = 1;
        panel.opacity = 255;
      }
    }).start();
  },
  _onPhoneLoginGetCode: function _onPhoneLoginGetCode() {
    var self = this;
    var ui = this._phoneLoginUI;
    if (!ui || ui.countdown > 0) return;

    var phone = this._getPhoneLoginInputValue('native-phone-input', ui.phoneEditBox);

    if (!this._validatePhoneLoginPhone(phone)) {
      this._showPhoneLoginTip("请输入正确的手机号", true);

      return;
    }

    var defines = window.defines;

    if (!defines || !defines.apiUrl) {
      this._showPhoneLoginTip("验证码已发送(测试)", false);

      this._startPhoneLoginCountdown();

      return;
    }

    var HttpAPI = window.HttpAPI;

    if (HttpAPI && defines.cryptoKey) {
      HttpAPI.postEncrypted(defines.apiUrl + '/api/v1/auth/send-code', 'send_code', {
        phone: phone
      }, defines.cryptoKey, function (err, resp) {
        if (err) {
          self._showPhoneLoginTip(err || "发送失败", true);

          return;
        }

        if (resp && resp.code === 0) {
          self._showPhoneLoginTip("验证码已发送", false);

          self._startPhoneLoginCountdown();
        } else {
          self._showPhoneLoginTip(resp.message || "发送失败", true);
        }
      });
    } else {
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
                self._showPhoneLoginTip("验证码已发送", false);

                self._startPhoneLoginCountdown();
              } else {
                self._showPhoneLoginTip(resp.message || "发送失败", true);
              }
            } catch (e) {
              self._showPhoneLoginTip("解析响应失败", true);
            }
          } else {
            self._showPhoneLoginTip("网络请求失败", true);
          }
        }
      };

      xhr.send(JSON.stringify({
        phone: phone
      }));
    }
  },
  _onPhoneLoginSubmit: function _onPhoneLoginSubmit() {
    var self = this;
    var ui = this._phoneLoginUI;
    if (!ui) return;

    var phone = this._getPhoneLoginInputValue('native-phone-input', ui.phoneEditBox);

    var code = this._getPhoneLoginInputValue('native-code-input', ui.codeEditBox);

    if (!this._validatePhoneLoginPhone(phone)) {
      this._showPhoneLoginTip("请输入正确的手机号", true);

      return;
    }

    this._showPhoneLoginTip("正在登录...", false);

    var defines = window.defines;

    if (!defines || !defines.apiUrl) {
      if (window.myglobal) {
        window.myglobal.onLoginSuccess({
          uniqueID: "phone_" + phone,
          accountID: "phone_" + phone,
          nickName: "玩家" + phone.substr(-4),
          avatarUrl: "",
          goldCount: 1000,
          token: "test_token_" + Date.now(),
          phone: phone,
          loginType: 1
        });
      }

      this._showPhoneLoginTip("登录成功", false);

      this.scheduleOnce(function () {
        _removeNativeInputElements();

        if (cc.isValid(ui.popup)) {
          ui.popup.active = false;
        }

        self._phoneLoginPopupShowing = false;
        cc.director.loadScene("hallScene");
      }, 0.5);
      return;
    }

    var HttpAPI = window.HttpAPI;

    if (HttpAPI && defines.cryptoKey) {
      HttpAPI.postEncrypted(defines.apiUrl + '/api/v1/auth/phone-login', 'phone_login', {
        phone: phone,
        code: code
      }, defines.cryptoKey, function (err, resp) {
        if (err) {
          self._showPhoneLoginTip(err || "登录失败", true);

          return;
        }

        if (resp && resp.code === 0 && resp.data) {
          self._showPhoneLoginTip("登录成功", false);

          if (window.myglobal) {
            window.myglobal.onLoginSuccess({
              uniqueID: resp.data.uniqueID || "",
              accountID: resp.data.accountID || "",
              nickName: resp.data.nickName || "玩家",
              avatarUrl: resp.data.avatarUrl || "",
              goldCount: resp.data.goldcount || 0,
              token: resp.data.token || "",
              phone: phone,
              loginType: 1
            });
          }

          self.scheduleOnce(function () {
            _removeNativeInputElements();

            if (cc.isValid(ui.popup)) {
              ui.popup.active = false;
            }

            self._phoneLoginPopupShowing = false;
            cc.director.loadScene("hallScene");
          }, 0.5);
        } else {
          self._showPhoneLoginTip(resp.message || "登录失败", true);
        }
      });
    } else {
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
                self._showPhoneLoginTip("登录成功", false);

                if (window.myglobal) {
                  window.myglobal.onLoginSuccess({
                    uniqueID: resp.data.uniqueID || resp.data.player_id || "",
                    accountID: resp.data.accountID || resp.data.account_id || "",
                    nickName: resp.data.nickName || resp.data.nickname || "玩家",
                    avatarUrl: resp.data.avatarUrl || resp.data.avatar || "",
                    goldCount: resp.data.goldcount || resp.data.gold || 0,
                    token: resp.data.token || "",
                    phone: phone,
                    loginType: 1
                  });
                }

                self.scheduleOnce(function () {
                  _removeNativeInputElements();

                  if (cc.isValid(ui.popup)) {
                    ui.popup.active = false;
                  }

                  self._phoneLoginPopupShowing = false;
                  cc.director.loadScene("hallScene");
                }, 0.5);
              } else {
                self._showPhoneLoginTip(resp.message || "登录失败", true);
              }
            } catch (e) {
              self._showPhoneLoginTip("解析响应失败", true);
            }
          } else {
            self._showPhoneLoginTip("网络请求失败", true);
          }
        }
      };

      xhr.send(JSON.stringify({
        phone: phone,
        code: code
      }));
    }
  },
  _onPhoneLoginWx: function _onPhoneLoginWx() {
    var self = this;
    var ui = this._phoneLoginUI;
    if (!ui) return;

    this._showPhoneLoginTip("正在登录...", false);

    var defines = window.defines;

    if (!defines || !defines.apiUrl) {
      if (window.myglobal) {
        window.myglobal.onLoginSuccess({
          uniqueID: "wx_" + Date.now(),
          accountID: "wx_" + Date.now(),
          nickName: "微信用户",
          avatarUrl: "",
          goldCount: 1000,
          token: "test_wx_token_" + Date.now(),
          loginType: 2
        });
      }

      this._showPhoneLoginTip("登录成功", false);

      this.scheduleOnce(function () {
        _removeNativeInputElements();

        if (cc.isValid(ui.popup)) ui.popup.active = false;
        self._phoneLoginPopupShowing = false;
        cc.director.loadScene("hallScene");
      }, 0.5);
      return;
    }

    var HttpAPI = window.HttpAPI;

    if (HttpAPI && defines.cryptoKey) {
      HttpAPI.postEncrypted(defines.apiUrl + '/api/v1/auth/wx-login', 'wx_login', {
        code: "test_code_" + Date.now()
      }, defines.cryptoKey, function (err, resp) {
        if (err) {
          self._showPhoneLoginTip(err || "登录失败", true);

          return;
        }

        if (resp && resp.code === 0 && resp.data) {
          self._showPhoneLoginTip("登录成功", false);

          if (window.myglobal && window.myglobal.playerData) {
            window.myglobal.playerData.uniqueID = resp.data.uniqueID || "";
            window.myglobal.playerData.accountID = resp.data.accountID || "";
            window.myglobal.playerData.nickName = resp.data.nickName || "微信用户";
            window.myglobal.playerData.userName = resp.data.username || "";
            window.myglobal.playerData.avatar = resp.data.avatarUrl || "";
            window.myglobal.playerData.gobal_count = resp.data.goldCount || 0;
            window.myglobal.playerData.token = resp.data.token || "";
            window.myglobal.playerData.saveToLocal();
          }

          if (window.myglobal && window.myglobal.socket && window.myglobal.socket.initSocket) {
            window.myglobal.socket.initSocket();
          }

          self.scheduleOnce(function () {
            _removeNativeInputElements();

            if (cc.isValid(ui.popup)) ui.popup.active = false;
            self._phoneLoginPopupShowing = false;
            cc.director.loadScene("hallScene");
          }, 0.5);
        } else {
          self._showPhoneLoginTip(resp.message || "登录失败", true);
        }
      });
    } else {
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
                self._showPhoneLoginTip("登录成功", false);

                if (window.myglobal && window.myglobal.playerData) {
                  window.myglobal.playerData.uniqueID = resp.data.player_id || "";
                  window.myglobal.playerData.accountID = resp.data.account_id || "";
                  window.myglobal.playerData.nickName = resp.data.nickname || "微信用户";
                  window.myglobal.playerData.userName = resp.data.username || "";
                  window.myglobal.playerData.avatar = resp.data.avatar || "";
                  window.myglobal.playerData.gobal_count = resp.data.gold || 0;
                  window.myglobal.playerData.token = resp.data.token || "";
                  window.myglobal.playerData.saveToLocal();
                }

                if (window.myglobal && window.myglobal.socket && window.myglobal.socket.initSocket) {
                  window.myglobal.socket.initSocket();
                }

                self.scheduleOnce(function () {
                  _removeNativeInputElements();

                  if (cc.isValid(ui.popup)) ui.popup.active = false;
                  self._phoneLoginPopupShowing = false;
                  cc.director.loadScene("hallScene");
                }, 0.5);
              } else {
                self._showPhoneLoginTip(resp.message || "登录失败", true);
              }
            } catch (e) {
              self._showPhoneLoginTip("解析响应失败", true);
            }
          } else {
            self._showPhoneLoginTip("网络请求失败", true);
          }
        }
      };

      xhr.send(JSON.stringify({
        code: "test_code_" + Date.now()
      }));
    }
  },
  // 显示场景中预置的 login 弹窗（原动态创建，现使用场景节点）
  _createPhoneLoginDynamic: function _createPhoneLoginDynamic() {
    var self = this;

    if (!this._phoneLoginUI) {
      this._initPhoneLoginPopup();
    }

    var ui = this._phoneLoginUI;

    if (!ui || !ui.popup) {
      throw new Error("login 弹窗未初始化");
    }

    var popup = ui.popup;
    var panel = ui.panel;
    var phoneInputNode = ui.phoneInputNode;
    var codeInputNode = ui.codeInputNode;

    _removeNativeInputElements();

    if (ui.phoneEditBox) ui.phoneEditBox.string = "";
    if (ui.codeEditBox) ui.codeEditBox.string = "";
    if (ui.tipNode) ui.tipNode.active = false;

    this._resetPhoneLoginCountdownUI();

    var panelWidth = panel.width || 520;
    var panelHeight = panel.height || 680;
    var inputWidth = phoneInputNode ? phoneInputNode.width : 220;
    var inputHeight = phoneInputNode ? phoneInputNode.height : 45;
    var codeInputW = codeInputNode ? codeInputNode.width : 120;
    popup.active = true;
    popup.zIndex = 1000;
    panel.scale = 0.7;
    panel.opacity = 0;
    cc.tween(panel).to(0.25, {
      scale: 1,
      opacity: 255
    }, {
      easing: 'backOut'
    }).call(function () {
      if (!cc.isValid(popup)) return;

      if (cc.sys.isBrowser && phoneInputNode && codeInputNode) {
        _createNativeInputElements(panel, phoneInputNode, codeInputNode, inputWidth, inputHeight, codeInputW, panelWidth, panelHeight);
      } else if (ui.phoneEditBox && ui.codeEditBox) {
        ui.phoneEditBox.stayOnTop = true;
        ui.codeEditBox.stayOnTop = true;
      }

      console.log("手机登录弹窗输入框就绪");
    }).start();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFzc2V0cy9zY3JpcHRzL2xvZ2luc2NlbmUvbG9naW5TY2VuZS5qcyJdLCJuYW1lcyI6WyJfZ2xvYmFsU3R5bGVGaXhBcHBsaWVkIiwiX2ZpeEVkaXRCb3hTdHlsZSIsImVkaXRCb3giLCJmb250Q29sb3IiLCJiZ0NvbG9yIiwiY2MiLCJzeXMiLCJpc0Jyb3dzZXIiLCJfYXBwbHlJbnB1dFN0eWxlcyIsInNldFRpbWVvdXQiLCJfaW5qZWN0R2xvYmFsU3R5bGVzIiwiaW5wdXRzIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yQWxsIiwiaSIsImxlbmd0aCIsImlucHV0IiwiX3N0eWxlU2luZ2xlSW5wdXQiLCJ0ZXh0YXJlYXMiLCJqIiwiZSIsImNvbnNvbGUiLCJlcnJvciIsImlkIiwic3R5bGUiLCJzZXRQcm9wZXJ0eSIsImNvbG9yIiwiYmFja2dyb3VuZENvbG9yIiwiZGlzcGxheSIsImFsaWduSXRlbXMiLCJqdXN0aWZ5Q29udGVudCIsImJveFNpemluZyIsInBhZGRpbmciLCJsaW5lSGVpZ2h0IiwiaGVpZ2h0IiwiZm9udFNpemUiLCJ3ZWJraXRUZXh0RmlsbENvbG9yIiwib3BhY2l0eSIsInZpc2liaWxpdHkiLCJjYXJldENvbG9yIiwidGV4dFNoYWRvdyIsIm91dGxpbmUiLCJib3JkZXIiLCJyZW1vdmVQcm9wZXJ0eSIsInN0eWxlSWQiLCJnZXRFbGVtZW50QnlJZCIsImNzcyIsImNyZWF0ZUVsZW1lbnQiLCJ0eXBlIiwiYXBwZW5kQ2hpbGQiLCJjcmVhdGVUZXh0Tm9kZSIsImhlYWQiLCJfY3JlYXRlTmF0aXZlSW5wdXRFbGVtZW50cyIsInBhbmVsIiwicGhvbmVJbnB1dE5vZGUiLCJjb2RlSW5wdXROb2RlIiwiaW5wdXRXaWR0aCIsImlucHV0SGVpZ2h0IiwiY29kZUlucHV0VyIsInBhbmVsV2lkdGgiLCJwYW5lbEhlaWdodCIsImNhbnZhcyIsInF1ZXJ5U2VsZWN0b3IiLCJjYW52YXNSZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0Iiwid2luU2l6ZSIsImxvZyIsImxlZnQiLCJ0b3AiLCJ3aWR0aCIsInNjYWxlWCIsInNjYWxlWSIsInRvRml4ZWQiLCJwaG9uZVdvcmxkUG9zIiwiY29udmVydFRvV29ybGRTcGFjZUFSIiwidjIiLCJjb2RlV29ybGRQb3MiLCJ4IiwieSIsInBob25lT2Zmc2V0WCIsInBob25lT2Zmc2V0WSIsImNvZGVPZmZzZXRYIiwiY29kZU9mZnNldFkiLCJhY3R1YWxJbnB1dFdpZHRoIiwiYWN0dWFsSW5wdXRIZWlnaHQiLCJhY3R1YWxDb2RlSW5wdXRXaWR0aCIsImNhbGNTY3JlZW5Qb3NGcm9tV29ybGQiLCJ3b3JsZFBvcyIsIm5vZGVXaWR0aCIsIm5vZGVIZWlnaHQiLCJvZmZzZXRYIiwib2Zmc2V0WSIsInNjcmVlblgiLCJzY3JlZW5ZIiwiY2FudmFzWCIsImNhbnZhc1kiLCJhY3R1YWxXaWR0aCIsImFjdHVhbEhlaWdodCIsInBob25lU2NyZWVuIiwiY29kZVNjcmVlbiIsIk1hdGgiLCJtYXgiLCJtaW4iLCJvbGRDb250YWluZXIiLCJyZW1vdmUiLCJjb250YWluZXIiLCJjc3NUZXh0Iiwiam9pbiIsImJvZHkiLCJwaG9uZUlucHV0IiwicGxhY2Vob2xkZXIiLCJtYXhMZW5ndGgiLCJzZXRBdHRyaWJ1dGUiLCJjb2RlSW5wdXQiLCJhZGRFdmVudExpc3RlbmVyIiwicGhvbmVDaGVjayIsImNvZGVDaGVjayIsInJlY3QiLCJfcmVtb3ZlTmF0aXZlSW5wdXRFbGVtZW50cyIsIl9maXhFZGl0Qm94SW5wdXRFbGVtZW50cyIsInBob25lRWRpdEJveCIsImNvZGVFZGl0Qm94Iiwid29ybGRUb1NjcmVlbiIsInBob25lU2NyZWVuUG9zIiwicG9zaXRpb24iLCJ6SW5kZXgiLCJwb2ludGVyRXZlbnRzIiwiY3Vyc29yIiwiYmFja2dyb3VuZCIsImJvcmRlclJhZGl1cyIsImNvZGVTY3JlZW5Qb3MiLCJfc3RhcnRJbnB1dE9ic2VydmVyIiwib2JzZXJ2ZXIiLCJNdXRhdGlvbk9ic2VydmVyIiwibXV0YXRpb25zIiwiZm9yRWFjaCIsIm11dGF0aW9uIiwiYWRkZWROb2RlcyIsIm5vZGUiLCJub2RlTmFtZSIsImlucCIsIm9ic2VydmUiLCJjaGlsZExpc3QiLCJzdWJ0cmVlIiwid2FybiIsIkNsYXNzIiwiQ29tcG9uZW50IiwicHJvcGVydGllcyIsIndhaXRfbm9kZSIsIk5vZGUiLCJ1c2VyX2FncmVlbWVudF9wcmVmYWJzIiwiUHJlZmFiIiwicGhvbmVfbG9naW5fcHJlZmFiIiwib25Mb2FkIiwic2VsZiIsInZpZXciLCJlbmFibGVBdXRvRnVsbFNjcmVlbiIsInNjcmVlbiIsImRpc2FibGVBdXRvRnVsbFNjcmVlbiIsIl9pc0FncmVlbWVudENoZWNrZWQiLCJfcGhvbmVMb2dpblBvcHVwU2hvd2luZyIsIl9pbml0V2FpdE5vZGUiLCJfaW5pdENoZWNrYm94IiwiX2luaXRMb2dpbkJ1dHRvbnMiLCJfaW5pdFBob25lTG9naW5Qb3B1cCIsIl9pbml0VXNlckFncmVlbWVudExpbmsiLCJfcHJlbG9hZFNjZW5lcyIsIl9jaGVja0F1dG9Mb2dpbiIsIndpbmRvdyIsIm15Z2xvYmFsIiwiX3dhaXRGb3JNeWdsb2JhbCIsIl9pbml0QW5kU3RhcnQiLCJ3YXNGb3JjZUxvZ2dlZE91dCIsIl9zaG93RXJyb3IiLCJnZXRGb3JjZUxvZ291dFJlYXNvbiIsImhhc0xvY2FsU2Vzc2lvbiIsInZlcmlmeVRva2VuIiwidmFsaWQiLCJtZXNzYWdlIiwicmVjb25uZWN0SW5mbyIsInNvY2tldCIsImxvYWRSZWNvbm5lY3RJbmZvIiwidG9rZW4iLCJwbGF5ZXJJZCIsInJvb21Db2RlIiwic2NoZWR1bGVPbmNlIiwiaW5pdFNvY2tldCIsIm9uUm9vbVJlc3RvcmVkIiwiZGF0YSIsImRpcmVjdG9yIiwibG9hZFNjZW5lIiwiZXZ0IiwiZXZlbnRMaXN0ZXIiLCJvbiIsIl9sb2FkaW5nSW1hZ2UiLCJnZXRDaGlsZEJ5TmFtZSIsImxibE5vZGUiLCJfd2FpdExhYmVsIiwiZ2V0Q29tcG9uZW50IiwiTGFiZWwiLCJhY3RpdmUiLCJjaGVja01hcmtOb2RlIiwiX2NoZWNrTWFya05vZGUiLCJjaGVja21hcmsiLCJfY2hlY2ttYXJrSWNvbiIsImJ1dHRvbiIsIkJ1dHRvbiIsImVuYWJsZWQiLCJvZmYiLCJFdmVudFR5cGUiLCJUT1VDSF9FTkQiLCJldmVudCIsIl90b2dnbGVDaGVja2JveCIsInN0YXJ0IiwicGhvbmVMb2dpbk5vZGUiLCJoYXNUb3VjaExpc3RlbmVycyIsInN0b3BQcm9wYWdhdGlvbiIsIl9kb1Bob25lTG9naW4iLCJ3eExvZ2luTm9kZSIsIl9kb1d4TG9naW4iLCJuYW1lIiwiY2hpbGRyZW4iLCJpbnRlcmFjdGFibGUiLCJjbGlja0V2ZW50cyIsImhhbmRsZXIiLCJFdmVudEhhbmRsZXIiLCJ0YXJnZXQiLCJjb21wb25lbnQiLCJjdXN0b21FdmVudERhdGEiLCJwdXNoIiwibGlua05vZGUiLCJfb25XeExvZ2luQ2xpY2siLCJfb25QaG9uZUxvZ2luQ2xpY2siLCJfb25Vc2VyQWdyZWVtZW50TGlua0NsaWNrIiwiX3Nob3dVc2VyQWdyZWVtZW50UG9wdXAiLCJfY2hlY2tBZ3JlZW1lbnQiLCJwcmVsb2FkU2NlbmUiLCJlcnIiLCJhdHRlbXB0cyIsImNoZWNrIiwiaW5pdCIsIl9zaG93TG9hZGluZyIsInBsYXllckRhdGEiLCJwbGF5ZXJfaWQiLCJuaWNrTmFtZSIsInBsYXllcl9uYW1lIiwic2F2ZVRvTG9jYWwiLCJnb2JhbF9jb3VudCIsImdvbGQiLCJfaW5pdEJhY2tncm91bmRNdXNpYyIsImlzb3Blbl9zb3VuZCIsIl9tdXNpY1BsYXlpbmciLCJfdG91Y2hMaXN0ZW5lckFkZGVkIiwicmVzb3VyY2VzIiwibG9hZCIsIkF1ZGlvQ2xpcCIsImNsaXAiLCJpc1ZhbGlkIiwiX3NldHVwR2xvYmFsVG91Y2hGb3JNdXNpYyIsIl9iZ011c2ljQ2xpcCIsImF1ZGlvRW5naW5lIiwicGxheU11c2ljIiwiX3JlbW92ZUdsb2JhbFRvdWNoRm9yTXVzaWMiLCJfcGxheU11c2ljT25Ub3VjaCIsImlzTXVzaWNQbGF5aW5nIiwiX2NvY29zVG91Y2hIYW5kbGVyIiwiVE9VQ0hfU1RBUlQiLCJfYnJvd3NlclRvdWNoSGFuZGxlciIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJfc2hvd1dhaXROb2RlIiwiX2hpZGVXYWl0Tm9kZSIsInNob3ciLCJzdHJpbmciLCJfaXNBbmltYXRpbmciLCJfZHJhd0lucHV0QmciLCJncmFwaGljcyIsInJhZGl1cyIsInJvdW5kUmVjdCIsInVwZGF0ZSIsImR0IiwiYW5nbGUiLCJyZXF1ZXN0X3d4TG9naW4iLCJ1bmlxdWVJRCIsImFjY291bnRJRCIsImF2YXRhclVybCIsInJlc3VsdCIsImdvbGRjb3VudCIsIl9zaG93UGhvbmVMb2dpblBvcHVwIiwiX2NyZWF0ZVBob25lTG9naW5Qb3B1cCIsInBvcHVwIiwiX2NyZWF0ZVBob25lTG9naW5EeW5hbWljIiwiX3Bob25lTG9naW5Qb3B1cCIsIkJsb2NrSW5wdXRFdmVudHMiLCJhZGRDb21wb25lbnQiLCJjbG9zZUJ0biIsImdldENvZGVCdG4iLCJsb2dpbkJ0biIsInd4QnRuIiwidGlwTm9kZSIsIkVkaXRCb3giLCJpbnB1dE1vZGUiLCJJbnB1dE1vZGUiLCJQSE9ORV9OVU1CRVIiLCJOVU1FUklDIiwiZ2V0Q29kZUJ0bkNvbXAiLCJidG5MYWJlbE5vZGUiLCJjb3VudGRvd25MYWJlbE5vZGUiLCJidG5MYWJlbENvbXAiLCJjb3VudGRvd25MYWJlbENvbXAiLCJ0aXBMYWJlbENvbXAiLCJfcGhvbmVMb2dpblVJIiwiY291bnRkb3duIiwiX2Nsb3NlUGhvbmVMb2dpblBvcHVwIiwiX29uUGhvbmVMb2dpbkdldENvZGUiLCJfb25QaG9uZUxvZ2luU3VibWl0IiwiX29uUGhvbmVMb2dpbld4IiwiX2dldFBob25lTG9naW5JbnB1dFZhbHVlIiwiaW5wdXRJZCIsInZhbHVlIiwiX3ZhbGlkYXRlUGhvbmVMb2dpblBob25lIiwicGhvbmUiLCJ0ZXN0IiwiX3Nob3dQaG9uZUxvZ2luVGlwIiwibXNnIiwiaXNFcnJvciIsInVpIiwiQ29sb3IiLCJfcmVzZXRQaG9uZUxvZ2luQ291bnRkb3duVUkiLCJfc3RhcnRQaG9uZUxvZ2luQ291bnRkb3duIiwidGljayIsImN1ciIsInR3ZWVuIiwidG8iLCJzY2FsZSIsImVhc2luZyIsImNhbGwiLCJkZWZpbmVzIiwiYXBpVXJsIiwiSHR0cEFQSSIsImNyeXB0b0tleSIsInBvc3RFbmNyeXB0ZWQiLCJyZXNwIiwiY29kZSIsInhociIsIlhNTEh0dHBSZXF1ZXN0Iiwib3BlbiIsInNldFJlcXVlc3RIZWFkZXIiLCJ0aW1lb3V0Iiwib25yZWFkeXN0YXRlY2hhbmdlIiwicmVhZHlTdGF0ZSIsInN0YXR1cyIsIkpTT04iLCJwYXJzZSIsInJlc3BvbnNlVGV4dCIsInNlbmQiLCJzdHJpbmdpZnkiLCJvbkxvZ2luU3VjY2VzcyIsInN1YnN0ciIsImdvbGRDb3VudCIsIkRhdGUiLCJub3ciLCJsb2dpblR5cGUiLCJhY2NvdW50X2lkIiwibmlja25hbWUiLCJhdmF0YXIiLCJ1c2VyTmFtZSIsInVzZXJuYW1lIiwiRXJyb3IiLCJzdGF5T25Ub3AiLCJfY3JlYXRlQWdyZWVtZW50UG9wdXAiLCJwYXJlbnQiLCJzZXRDb250ZW50U2l6ZSIsInNpemUiLCJzZXRQb3NpdGlvbiIsImJnTWFzayIsImJnTWFza1Nwcml0ZSIsIlNwcml0ZSIsInNpemVNb2RlIiwiU2l6ZU1vZGUiLCJDVVNUT00iLCJwYW5lbFNwcml0ZSIsIlNwcml0ZUZyYW1lIiwic3ByaXRlRnJhbWUiLCJ0aXRsZU5vZGUiLCJ0aXRsZUxhYmVsIiwiaG9yaXpvbnRhbEFsaWduIiwiSG9yaXpvbnRhbEFsaWduIiwiQ0VOVEVSIiwiY2xvc2VCdG5CZyIsImNsb3NlQmdTcHJpdGUiLCJjbG9zZUxhYmVsTm9kZSIsImNsb3NlTGFiZWwiLCJjbG9zZUJ0bkNvbXAiLCJ0cmFuc2l0aW9uIiwiVHJhbnNpdGlvbiIsIlNDQUxFIiwiem9vbVNjYWxlIiwiY2xvc2VIYW5kbGVyIiwiZGl2aWRlckxpbmUiLCJkaXZpZGVyU3ByaXRlIiwic2Nyb2xsTm9kZSIsInNjcm9sbFZpZXciLCJTY3JvbGxWaWV3IiwiaG9yaXpvbnRhbCIsInZlcnRpY2FsIiwiaW5lcnRpYSIsImVsYXN0aWMiLCJ2aWV3Tm9kZSIsIm1hc2siLCJNYXNrIiwiVHlwZSIsIlJFQ1QiLCJjb250ZW50Tm9kZSIsImFuY2hvclgiLCJhbmNob3JZIiwiY29udGVudCIsInJpY2hUZXh0Tm9kZSIsInJpY2hUZXh0IiwiUmljaFRleHQiLCJtYXhXaWR0aCIsImFncmVlbWVudFRleHQiLCJzY3JvbGxUb1RvcCIsIl91c2VyQWdyZWVtZW50UG9wdXAiLCJfY2xvc2VVc2VyQWdyZWVtZW50UG9wdXAiLCJkZXN0cm95Iiwib25EZXN0cm95Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFFQTtBQUNBLElBQUlBLHNCQUFzQixHQUFHLEtBQTdCLEVBRUE7O0FBQ0EsSUFBSUMsZ0JBQWdCLEdBQUcsU0FBbkJBLGdCQUFtQixDQUFTQyxPQUFULEVBQWtCQyxTQUFsQixFQUE2QkMsT0FBN0IsRUFBc0M7RUFDekQsSUFBSSxDQUFDQyxFQUFFLENBQUNDLEdBQUgsQ0FBT0MsU0FBWixFQUF1QjtFQUV2QkosU0FBUyxHQUFHQSxTQUFTLElBQUksU0FBekI7RUFDQUMsT0FBTyxHQUFHQSxPQUFPLElBQUksU0FBckIsQ0FKeUQsQ0FPekQ7O0VBQ0FJLGlCQUFpQixDQUFDTCxTQUFELEVBQVlDLE9BQVosQ0FBakIsQ0FSeUQsQ0FVekQ7OztFQUNBSyxVQUFVLENBQUMsWUFBVztJQUFFRCxpQkFBaUIsQ0FBQ0wsU0FBRCxFQUFZQyxPQUFaLENBQWpCO0VBQXdDLENBQXRELEVBQXdELEVBQXhELENBQVY7RUFDQUssVUFBVSxDQUFDLFlBQVc7SUFBRUQsaUJBQWlCLENBQUNMLFNBQUQsRUFBWUMsT0FBWixDQUFqQjtFQUF3QyxDQUF0RCxFQUF3RCxHQUF4RCxDQUFWO0VBQ0FLLFVBQVUsQ0FBQyxZQUFXO0lBQUVELGlCQUFpQixDQUFDTCxTQUFELEVBQVlDLE9BQVosQ0FBakI7RUFBd0MsQ0FBdEQsRUFBd0QsR0FBeEQsQ0FBVjtFQUNBSyxVQUFVLENBQUMs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dXJjZXNDb250ZW50IjpbIi8vIOeZu+W9leWcuuaZr+aOp+WItuWZqFxuLy8g5L2/55So54K55Ye75LqL5Lu25a6e546w5aSN6YCJ5qGG5Yqf6IO977yI5LiN5L6d6LWWIFRvZ2dsZSDnu4Tku7bvvIlcblxuLy8g5YWo5bGA5qC35byP5L+u5aSN5Ye95pWwIC0g5pu05by65aSn55qE54mI5pysXG52YXIgX2dsb2JhbFN0eWxlRml4QXBwbGllZCA9IGZhbHNlO1xuXG4vLyDovoXliqnlh73mlbDvvJrkv67lpI1XZWLlubPlj7BFZGl0Qm9455qEQ1NT5qC35byP77yI5aKe5by654mI77yJXG52YXIgX2ZpeEVkaXRCb3hTdHlsZSA9IGZ1bmN0aW9uKGVkaXRCb3gsIGZvbnRDb2xvciwgYmdDb2xvcikge1xuICAgIGlmICghY2Muc3lzLmlzQnJvd3NlcikgcmV0dXJuO1xuXG4gICAgZm9udENvbG9yID0gZm9udENvbG9yIHx8ICcjMDAwMDAwJztcbiAgICBiZ0NvbG9yID0gYmdDb2xvciB8fCAnI2ZmZmZmZic7XG5cblxuICAgIC8vIOeri+WNs+WwneivleS/ruWkjVxuICAgIF9hcHBseUlucHV0U3R5bGVzKGZvbnRDb2xvciwgYmdDb2xvcik7XG5cbiAgICAvLyDlu7bov5/kv67lpI3vvIjnrYnlvoVIVE1MIGlucHV05YWD57Sg5Yib5bu677yJXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgX2FwcGx5SW5wdXRTdHlsZXMoZm9udENvbG9yLCBiZ0NvbG9yKTsgfSwgNTApO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IF9hcHBseUlucHV0U3R5bGVzKGZvbnRDb2xvciwgYmdDb2xvcik7IH0sIDEwMCk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgX2FwcGx5SW5wdXRTdHlsZXMoZm9udENvbG9yLCBiZ0NvbG9yKTsgfSwgMjAwKTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBfYXBwbHlJbnB1dFN0eWxlcyhmb250Q29sb3IsIGJnQ29sb3IpOyB9LCA1MDApO1xuXG4gICAgLy8g5rOo5YWl5YWo5bGAQ1NT5qC35byP77yI5pyA6auY5LyY5YWI57qn77yJXG4gICAgaWYgKCFfZ2xvYmFsU3R5bGVGaXhBcHBsaWVkKSB7XG4gICAgICAgIF9nbG9iYWxTdHlsZUZpeEFwcGxpZWQgPSB0cnVlO1xuICAgICAgICBfaW5qZWN0R2xvYmFsU3R5bGVzKGZvbnRDb2xvciwgYmdDb2xvcik7XG4gICAgfVxufTtcblxuLy8g5bqU55So5qC35byP5Yiw5omA5pyJaW5wdXTlhYPntKBcbnZhciBfYXBwbHlJbnB1dFN0eWxlcyA9IGZ1bmN0aW9uKGZvbnRDb2xvciwgYmdDb2xvcikge1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBpbnB1dHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdpbnB1dCcpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgaW5wdXQgPSBpbnB1dHNbaV07XG4gICAgICAgICAgICBfc3R5bGVTaW5nbGVJbnB1dChpbnB1dCwgZm9udENvbG9yLCBiZ0NvbG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOS5n+WkhOeQhiB0ZXh0YXJlYe+8iOWPr+iDveiiq+eUqOS6jiBFZGl0Qm9477yJXG4gICAgICAgIHZhciB0ZXh0YXJlYXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCd0ZXh0YXJlYScpO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRleHRhcmVhcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgX3N0eWxlU2luZ2xlSW5wdXQodGV4dGFyZWFzW2pdLCBmb250Q29sb3IsIGJnQ29sb3IpO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfkv67lpI1FZGl0Qm945qC35byP5aSx6LSlOicsIGUpO1xuICAgIH1cbn07XG5cbi8vIOagt+W8j+WMluWNleS4qmlucHV05YWD57SgIC0g5L+u5aSN54mI77ya5paH5a2X5Z6C55u05bGF5LitICsg6YCP5piO6IOM5pmv5LiN6YGu5oyh6L655qGGXG4vLyDms6jmhI/vvJrot7Pov4fljp/nlJ/ovpPlhaXmoYbvvIhuYXRpdmUtcGhvbmUtaW5wdXQsIG5hdGl2ZS1jb2RlLWlucHV077yJ77yM5Zug5Li65a6D5Lus5pyJ57K+56Gu55qE5L2N572u6K6+572uXG52YXIgX3N0eWxlU2luZ2xlSW5wdXQgPSBmdW5jdGlvbihpbnB1dCwgZm9udENvbG9yLCBiZ0NvbG9yKSB7XG4gICAgLy8g4piFIOi3s+i/h+WOn+eUn+i+k+WFpeahhu+8jOWug+S7rOW3sue7j+acieato+ehrueahOagt+W8j1xuICAgIGlmIChpbnB1dC5pZCA9PT0gJ25hdGl2ZS1waG9uZS1pbnB1dCcgfHwgaW5wdXQuaWQgPT09ICduYXRpdmUtY29kZS1pbnB1dCcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDmoLjlv4PmoLflvI/orr7nva4gPT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICAvLyAxLiDmloflrZfpopzoibJcbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnY29sb3InLCBmb250Q29sb3IsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS5jb2xvciA9IGZvbnRDb2xvcjtcbiAgICBcbiAgICAvLyAyLiDlhbPplK7vvJrorr7nva7pgI/mmI7og4zmma/vvIzorqkgQ29jb3Mg57uY5Yi255qE6L655qGG5Y+v6KeBXG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJ2JhY2tncm91bmQtY29sb3InLCAndHJhbnNwYXJlbnQnLCAnaW1wb3J0YW50Jyk7XG4gICAgaW5wdXQuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3RyYW5zcGFyZW50JztcbiAgICBcbiAgICAvLyAzLiDmloflrZflnoLnm7TlsYXkuK0gLSDkvb/nlKggRmxleGJveCDmlrnmoYjvvIjmnIDlj6/pnaDvvIlcbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnZGlzcGxheScsICdmbGV4JywgJ2ltcG9ydGFudCcpO1xuICAgIGlucHV0LnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJ2FsaWduLWl0ZW1zJywgJ2NlbnRlcicsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS5hbGlnbkl0ZW1zID0gJ2NlbnRlcic7XG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJ2p1c3RpZnktY29udGVudCcsICdmbGV4LXN0YXJ0JywgJ2ltcG9ydGFudCcpO1xuICAgIGlucHV0LnN0eWxlLmp1c3RpZnlDb250ZW50ID0gJ2ZsZXgtc3RhcnQnO1xuICAgIFxuICAgIC8vIDQuIOebkuaooeWei+iuvue9rlxuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdib3gtc2l6aW5nJywgJ2JvcmRlci1ib3gnLCAnaW1wb3J0YW50Jyk7XG4gICAgaW5wdXQuc3R5bGUuYm94U2l6aW5nID0gJ2JvcmRlci1ib3gnO1xuICAgIFxuICAgIC8vIDUuIOWGhei+uei3nSAtIOe7meaWh+Wtl+eVmeWHuuepuumXtO+8jOmBv+WFjei0tOi+uVxuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdwYWRkaW5nJywgJzAgMTJweCcsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS5wYWRkaW5nID0gJzAgMTJweCc7XG4gICAgXG4gICAgLy8gNi4g6KGM6auY6K6+572uIC0g5LiO5a2X5L2T5aSn5bCP5Yy56YWN77yM56Gu5L+d5Z6C55u05bGF5LitXG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJ2xpbmUtaGVpZ2h0JywgJzEnLCAnaW1wb3J0YW50Jyk7XG4gICAgaW5wdXQuc3R5bGUubGluZUhlaWdodCA9ICcxJztcbiAgICBcbiAgICAvLyA3LiDpq5jluqboh6rpgILlupTlhoXlrrlcbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnaGVpZ2h0JywgJzEwMCUnLCAnaW1wb3J0YW50Jyk7XG4gICAgaW5wdXQuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09IOWtl+S9k+iuvue9riA9PT09PT09PT09PT09PT09PT09PVxuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdmb250LXNpemUnLCAnMjBweCcsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS5mb250U2l6ZSA9ICcyMHB4JztcbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnZm9udC1mYW1pbHknLCAnQXJpYWwsIFwiTWljcm9zb2Z0IFlhSGVpXCIsIHNhbnMtc2VyaWYnLCAnaW1wb3J0YW50Jyk7XG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT0gV2ViS2l0IOeJueauiuS/ruWkjSA9PT09PT09PT09PT09PT09PT09PVxuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCctd2Via2l0LXRleHQtZmlsbC1jb2xvcicsIGZvbnRDb2xvciwgJ2ltcG9ydGFudCcpO1xuICAgIGlucHV0LnN0eWxlLndlYmtpdFRleHRGaWxsQ29sb3IgPSBmb250Q29sb3I7XG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5Y+v6KeB5oCn56Gu5L+dID09PT09PT09PT09PT09PT09PT09XG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJ29wYWNpdHknLCAnMScsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCd2aXNpYmlsaXR5JywgJ3Zpc2libGUnLCAnaW1wb3J0YW50Jyk7XG4gICAgaW5wdXQuc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcbiAgICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDlhYnmoIfpopzoibIgPT09PT09PT09PT09PT09PT09PT1cbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnY2FyZXQtY29sb3InLCBmb250Q29sb3IsICdpbXBvcnRhbnQnKTtcbiAgICBpbnB1dC5zdHlsZS5jYXJldENvbG9yID0gZm9udENvbG9yO1xuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09IOenu+mZpOW5suaJsOagt+W8jyA9PT09PT09PT09PT09PT09PT09PVxuICAgIGlucHV0LnN0eWxlLnRleHRTaGFkb3cgPSAnbm9uZSc7XG4gICAgaW5wdXQuc3R5bGUuc2V0UHJvcGVydHkoJ3RleHQtc2hhZG93JywgJ25vbmUnLCAnaW1wb3J0YW50Jyk7XG4gICAgaW5wdXQuc3R5bGUub3V0bGluZSA9ICdub25lJztcbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnb3V0bGluZScsICdub25lJywgJ2ltcG9ydGFudCcpO1xuICAgIGlucHV0LnN0eWxlLmJvcmRlciA9ICdub25lJztcbiAgICBpbnB1dC5zdHlsZS5zZXRQcm9wZXJ0eSgnYm9yZGVyJywgJ25vbmUnLCAnaW1wb3J0YW50Jyk7XG4gICAgXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT0g56e76Zmk5a6a5L2N5bmy5omwID09PT09PT09PT09PT09PT09PT09XG4gICAgaW5wdXQuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ3RvcCcpO1xuICAgIGlucHV0LnN0eWxlLnJlbW92ZVByb3BlcnR5KCdtYXJnaW4tdG9wJyk7XG4gICAgaW5wdXQuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ21hcmdpbicpO1xuICAgIFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09IOiBmueEpuaXtuS/neaMgeagt+W8jyA9PT09PT09PT09PT09PT09PT09PVxuICAgIGlucHV0LnN0eWxlLnNldFByb3BlcnR5KCdvdXRsaW5lLW9mZnNldCcsICcwJywgJ2ltcG9ydGFudCcpO1xufTtcblxuLy8g5rOo5YWl5YWo5bGAQ1NT5qC35byPIC0g5L+u5aSN54mI77yI5o6S6Zmk5Y6f55Sf6L6T5YWl5qGG77yJXG52YXIgX2luamVjdEdsb2JhbFN0eWxlcyA9IGZ1bmN0aW9uKGZvbnRDb2xvciwgYmdDb2xvcikge1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBzdHlsZUlkID0gJ2NvY29zLWVkaXRib3gtZml4LXN0eWxlJztcbiAgICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHN0eWxlSWQpKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGNzcyA9IGBcbiAgICAgICAgICAgIC8qIOi+k+WFpeahhuWfuuehgOagt+W8jyAtIOmAj+aYjuiDjOaZryArIOaWh+Wtl+WxheS4rSAqL1xuICAgICAgICAgICAgLyog5rOo5oSP77ya5o6S6Zmk5Y6f55Sf6L6T5YWl5qGGICNuYXRpdmUtcGhvbmUtaW5wdXQsICNuYXRpdmUtY29kZS1pbnB1dCAqL1xuICAgICAgICAgICAgaW5wdXQ6bm90KCNuYXRpdmUtcGhvbmUtaW5wdXQpOm5vdCgjbmF0aXZlLWNvZGUtaW5wdXQpLCBcbiAgICAgICAgICAgIHRleHRhcmVhOm5vdCgjbmF0aXZlLXBob25lLWlucHV0KTpub3QoI25hdGl2ZS1jb2RlLWlucHV0KSB7XG4gICAgICAgICAgICAgICAgY29sb3I6ICR7Zm9udENvbG9yfSAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMSAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIHZpc2liaWxpdHk6IHZpc2libGUgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBmb250LXNpemU6IDIwcHggIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICAtd2Via2l0LXRleHQtZmlsbC1jb2xvcjogJHtmb250Q29sb3J9ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgY2FyZXQtY29sb3I6ICR7Zm9udENvbG9yfSAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIGxpbmUtaGVpZ2h0OiAxICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgYm9yZGVyOiBub25lICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgb3V0bGluZTogbm9uZSAhaW1wb3J0YW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvKiBQbGFjZWhvbGRlciDmoLflvI8gKi9cbiAgICAgICAgICAgIGlucHV0OjpwbGFjZWhvbGRlciwgdGV4dGFyZWE6OnBsYWNlaG9sZGVyIHtcbiAgICAgICAgICAgICAgICBjb2xvcjogIzg4ODg4OCAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDEgIWltcG9ydGFudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLyog6IGa54Sm54q25oCBICovXG4gICAgICAgICAgICBpbnB1dDpmb2N1czpub3QoI25hdGl2ZS1waG9uZS1pbnB1dCk6bm90KCNuYXRpdmUtY29kZS1pbnB1dCksIFxuICAgICAgICAgICAgdGV4dGFyZWE6Zm9jdXM6bm90KCNuYXRpdmUtcGhvbmUtaW5wdXQpOm5vdCgjbmF0aXZlLWNvZGUtaW5wdXQpIHtcbiAgICAgICAgICAgICAgICBjb2xvcjogJHtmb250Q29sb3J9ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgb3V0bGluZTogbm9uZSAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8qIOaWh+acrOexu+Wei+i+k+WFpeahhiAtIEZsZXhib3gg5Z6C55u05bGF5Lit77yI5o6S6Zmk5Y6f55Sf6L6T5YWl5qGG77yJKi9cbiAgICAgICAgICAgIGlucHV0W3R5cGU9XCJ0ZXh0XCJdOm5vdCgjbmF0aXZlLXBob25lLWlucHV0KTpub3QoI25hdGl2ZS1jb2RlLWlucHV0KSwgXG4gICAgICAgICAgICBpbnB1dFt0eXBlPVwibnVtYmVyXCJdOm5vdCgjbmF0aXZlLXBob25lLWlucHV0KTpub3QoI25hdGl2ZS1jb2RlLWlucHV0KSwgXG4gICAgICAgICAgICBpbnB1dFt0eXBlPVwidGVsXCJdOm5vdCgjbmF0aXZlLXBob25lLWlucHV0KTpub3QoI25hdGl2ZS1jb2RlLWlucHV0KSxcbiAgICAgICAgICAgIGlucHV0W3R5cGU9XCJwYXNzd29yZFwiXTpub3QoI25hdGl2ZS1waG9uZS1pbnB1dCk6bm90KCNuYXRpdmUtY29kZS1pbnB1dCkge1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGZsZXggIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveCAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIHBhZGRpbmc6IDAgMTJweCAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIGhlaWdodDogMTAwJSAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIGxpbmUtaGVpZ2h0OiAxICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgYm9yZGVyOiBub25lICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8qIOenu+mZpOa1j+iniOWZqOm7mOiupOagt+W8jyAqL1xuICAgICAgICAgICAgaW5wdXQ6Zm9jdXMsXG4gICAgICAgICAgICB0ZXh0YXJlYTpmb2N1cyB7XG4gICAgICAgICAgICAgICAgYm94LXNoYWRvdzogbm9uZSAhaW1wb3J0YW50O1xuICAgICAgICAgICAgfVxuICAgICAgICBgO1xuXG4gICAgICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIHN0eWxlLmlkID0gc3R5bGVJZDtcbiAgICAgICAgc3R5bGUudHlwZSA9ICd0ZXh0L2Nzcyc7XG4gICAgICAgIHN0eWxlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNzcykpO1xuICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcblxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcign5rOo5YWl5YWo5bGA5qC35byP5aSx6LSlOicsIGUpO1xuICAgIH1cbn07XG5cbi8vIOWIm+W7uuWOn+eUnyBIVE1MIGlucHV0IOWFg+e0oO+8iOe7lei/hyBDb2NvcyBFZGl0Qm94IOeahOmXrumimO+8iVxuLy8g5pS56L+b54mIIHY077ya5L2/55So6IqC54K55LiW55WM5Z2Q5qCH57K+56Gu5a6a5L2NXG52YXIgX2NyZWF0ZU5hdGl2ZUlucHV0RWxlbWVudHMgPSBmdW5jdGlvbihwYW5lbCwgcGhvbmVJbnB1dE5vZGUsIGNvZGVJbnB1dE5vZGUsIGlucHV0V2lkdGgsIGlucHV0SGVpZ2h0LCBjb2RlSW5wdXRXLCBwYW5lbFdpZHRoLCBwYW5lbEhlaWdodCkge1xuICAgIGlmICghY2Muc3lzLmlzQnJvd3NlcikgcmV0dXJuO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICAgIC8vIOiOt+WPliBDYW52YXMg5YWD57SgXG4gICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnR2FtZUNhbnZhcycpIHx8IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2NhbnZhcycpO1xuICAgICAgICBpZiAoIWNhbnZhcykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcign5om+5LiN5YiwIENhbnZhcyDlhYPntKAnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIGNhbnZhc1JlY3QgPSBjYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIHZhciB3aW5TaXplID0gY2Mud2luU2l6ZTtcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKCc9PT0g5Yib5bu65Y6f55Sf6L6T5YWl5qGG77yIdjQgLSDkvb/nlKjoioLngrnkuJbnlYzlnZDmoIfvvIk9PT0nKTtcbiAgICAgICAgY29uc29sZS5sb2coJ0NhbnZhcyDkvY3nva46JywgY2FudmFzUmVjdC5sZWZ0LCBjYW52YXNSZWN0LnRvcCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdDYW52YXMg5bC65a+4OicsIGNhbnZhc1JlY3Qud2lkdGgsICd4JywgY2FudmFzUmVjdC5oZWlnaHQpO1xuICAgICAgICBjb25zb2xlLmxvZygn5ri45oiP5YiG6L6o546HOicsIHdpblNpemUud2lkdGgsICd4Jywgd2luU2l6ZS5oZWlnaHQpO1xuICAgICAgICBcbiAgICAgICAgLy8g6K6h566X57yp5pS+5q+U5L6L77yIQ2FudmFzIOWunumZheWwuuWvuCAvIOa4uOaIj+iuvuiuoeWIhui+qOeOh++8iVxuICAgICAgICB2YXIgc2NhbGVYID0gY2FudmFzUmVjdC53aWR0aCAvIHdpblNpemUud2lkdGg7XG4gICAgICAgIHZhciBzY2FsZVkgPSBjYW52YXNSZWN0LmhlaWdodCAvIHdpblNpemUuaGVpZ2h0O1xuICAgICAgICBjb25zb2xlLmxvZygn57yp5pS+5q+U5L6LOicsIHNjYWxlWC50b0ZpeGVkKDMpLCBzY2FsZVkudG9GaXhlZCgzKSk7XG4gICAgICAgIFxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDlhbPplK7mlLnov5vvvJrkvb/nlKjoioLngrnkuJbnlYzlnZDmoIcgPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgLy8g55u05o6l5L2/55SoIENvY29zIOiKgueCueeahOS4lueVjOWdkOagh++8jOiAjOS4jeaYr+aJi+WKqOiuoeeul+WBj+enu1xuICAgICAgICBcbiAgICAgICAgLy8g6I635Y+W6L6T5YWl5qGG6IqC54K555qE5LiW55WM5Z2Q5qCHXG4gICAgICAgIHZhciBwaG9uZVdvcmxkUG9zID0gcGhvbmVJbnB1dE5vZGUuY29udmVydFRvV29ybGRTcGFjZUFSKGNjLnYyKDAsIDApKTtcbiAgICAgICAgdmFyIGNvZGVXb3JsZFBvcyA9IGNvZGVJbnB1dE5vZGUuY29udmVydFRvV29ybGRTcGFjZUFSKGNjLnYyKDAsIDApKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKCfmiYvmnLrovpPlhaXmoYbkuJbnlYzlnZDmoIc6JywgcGhvbmVXb3JsZFBvcy54LnRvRml4ZWQoMSksIHBob25lV29ybGRQb3MueS50b0ZpeGVkKDEpKTtcbiAgICAgICAgY29uc29sZS5sb2coJ+mqjOivgeeggei+k+WFpeahhuS4lueVjOWdkOaghzonLCBjb2RlV29ybGRQb3MueC50b0ZpeGVkKDEpLCBjb2RlV29ybGRQb3MueS50b0ZpeGVkKDEpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOKYheKYheKYhSDkvY3nva7lvq7osIPlj4LmlbDvvIjlpoLmnpzpnIDopoHlvq7osIPvvIzkv67mlLnov5nph4zvvInimIXimIXimIVcbiAgICAgICAgdmFyIHBob25lT2Zmc2V0WCA9IDA7ICAgIC8vIOaJi+acuui+k+WFpeahhiBYIOWBj+enu1xuICAgICAgICB2YXIgcGhvbmVPZmZzZXRZID0gMDsgICAgLy8g5omL5py66L6T5YWl5qGGIFkg5YGP56e7XG4gICAgICAgIHZhciBjb2RlT2Zmc2V0WCA9IDA7ICAgICAvLyDpqozor4HnoIHovpPlhaXmoYYgWCDlgY/np7tcbiAgICAgICAgdmFyIGNvZGVPZmZzZXRZID0gMDsgICAgIC8vIOmqjOivgeeggei+k+WFpeahhiBZIOWBj+enu1xuICAgICAgICBcbiAgICAgICAgLy8g4piF4piF4piFIOWwuuWvuOWPguaVsCDimIXimIXimIVcbiAgICAgICAgdmFyIGFjdHVhbElucHV0V2lkdGggPSBpbnB1dFdpZHRoOyAgICAgIC8vIOS9v+eUqOS8oOWFpeeahOi+k+WFpeahhuWuveW6plxuICAgICAgICB2YXIgYWN0dWFsSW5wdXRIZWlnaHQgPSBpbnB1dEhlaWdodDsgICAgLy8g5L2/55So5Lyg5YWl55qE6L6T5YWl5qGG6auY5bqmXG4gICAgICAgIHZhciBhY3R1YWxDb2RlSW5wdXRXaWR0aCA9IGNvZGVJbnB1dFc7ICAvLyDkvb/nlKjkvKDlhaXnmoTpqozor4HnoIHovpPlhaXmoYblrr3luqZcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKCc9PT0g6L6T5YWl5qGG5bC65a+4ID09PScpO1xuICAgICAgICBjb25zb2xlLmxvZygn5omL5py66L6T5YWl5qGGOicsIGFjdHVhbElucHV0V2lkdGgsICd4JywgYWN0dWFsSW5wdXRIZWlnaHQpO1xuICAgICAgICBjb25zb2xlLmxvZygn6aqM6K+B56CB6L6T5YWl5qGGOicsIGFjdHVhbENvZGVJbnB1dFdpZHRoLCAneCcsIGFjdHVhbElucHV0SGVpZ2h0KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOiuoeeul+Wxj+W5leS9jee9ru+8iOS4lueVjOWdkOaghyAtPiDlsY/luZXlnZDmoIfvvIlcbiAgICAgICAgLy8gQ29jb3Mg5Z2Q5qCH57O777ya5Y6f54K55bem5LiL6KeS77yMWSDlkJHkuIpcbiAgICAgICAgLy8gSFRNTCDlnZDmoIfns7vvvJrljp/ngrnlt6bkuIrop5LvvIxZIOWQkeS4i1xuICAgICAgICB2YXIgY2FsY1NjcmVlblBvc0Zyb21Xb3JsZCA9IGZ1bmN0aW9uKHdvcmxkUG9zLCBub2RlV2lkdGgsIG5vZGVIZWlnaHQsIG9mZnNldFgsIG9mZnNldFkpIHtcbiAgICAgICAgICAgIC8vIOS4lueVjOWdkOagh+i9rOaNouS4uuWxj+W5leWdkOagh1xuICAgICAgICAgICAgdmFyIHNjcmVlblggPSB3b3JsZFBvcy54ICsgb2Zmc2V0WDtcbiAgICAgICAgICAgIHZhciBzY3JlZW5ZID0gd29ybGRQb3MueSArIG9mZnNldFk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOi9rOaNouS4uiBDYW52YXMg5Z2Q5qCHXG4gICAgICAgICAgICB2YXIgY2FudmFzWCA9IHNjcmVlblggKiBzY2FsZVg7XG4gICAgICAgICAgICB2YXIgY2FudmFzWSA9IGNhbnZhc1JlY3QuaGVpZ2h0IC0gc2NyZWVuWSAqIHNjYWxlWTsgIC8vIFkg6L2057+76L2sXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOiuoeeul+WunumZheWwuuWvuFxuICAgICAgICAgICAgdmFyIGFjdHVhbFdpZHRoID0gbm9kZVdpZHRoICogc2NhbGVYO1xuICAgICAgICAgICAgdmFyIGFjdHVhbEhlaWdodCA9IG5vZGVIZWlnaHQgKiBzY2FsZVk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbGVmdDogY2FudmFzUmVjdC5sZWZ0ICsgY2FudmFzWCAtIGFjdHVhbFdpZHRoIC8gMixcbiAgICAgICAgICAgICAgICB0b3A6IGNhbnZhc1JlY3QudG9wICsgY2FudmFzWSAtIGFjdHVhbEhlaWdodCAvIDIsXG4gICAgICAgICAgICAgICAgd2lkdGg6IGFjdHVhbFdpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogYWN0dWFsSGVpZ2h0XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgdmFyIHBob25lU2NyZWVuID0gY2FsY1NjcmVlblBvc0Zyb21Xb3JsZChwaG9uZVdvcmxkUG9zLCBhY3R1YWxJbnB1dFdpZHRoLCBhY3R1YWxJbnB1dEhlaWdodCwgcGhvbmVPZmZzZXRYLCBwaG9uZU9mZnNldFkpO1xuICAgICAgICB2YXIgY29kZVNjcmVlbiA9IGNhbGNTY3JlZW5Qb3NGcm9tV29ybGQoY29kZVdvcmxkUG9zLCBhY3R1YWxDb2RlSW5wdXRXaWR0aCwgYWN0dWFsSW5wdXRIZWlnaHQsIGNvZGVPZmZzZXRYLCBjb2RlT2Zmc2V0WSk7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZygn5omL5py66L6T5YWl5qGG5bGP5bmV5L2N572uOicsIHBob25lU2NyZWVuKTtcbiAgICAgICAgY29uc29sZS5sb2coJ+mqjOivgeeggei+k+WFpeahhuWxj+W5leS9jee9rjonLCBjb2RlU2NyZWVuKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOi+ueeVjOajgOafpe+8muehruS/nei+k+WFpeahhuWcqOWxj+W5leWPr+ingeWMuuWfn+WGhVxuICAgICAgICBwaG9uZVNjcmVlbi5sZWZ0ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oY2FudmFzUmVjdC53aWR0aCAtIHBob25lU2NyZWVuLndpZHRoLCBwaG9uZVNjcmVlbi5sZWZ0KSk7XG4gICAgICAgIHBob25lU2NyZWVuLnRvcCA9IE1hdGgubWF4KDAsIE1hdGgubWluKGNhbnZhc1JlY3QuaGVpZ2h0IC0gcGhvbmVTY3JlZW4uaGVpZ2h0LCBwaG9uZVNjcmVlbi50b3ApKTtcbiAgICAgICAgY29kZVNjcmVlbi5sZWZ0ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oY2FudmFzUmVjdC53aWR0aCAtIGNvZGVTY3JlZW4ud2lkdGgsIGNvZGVTY3JlZW4ubGVmdCkpO1xuICAgICAgICBjb2RlU2NyZWVuLnRvcCA9IE1hdGgubWF4KDAsIE1hdGgubWluKGNhbnZhc1JlY3QuaGVpZ2h0IC0gY29kZVNjcmVlbi5oZWlnaHQsIGNvZGVTY3JlZW4udG9wKSk7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZygn6L6555WM5qOA5p+l5ZCO5L2N572uOicpO1xuICAgICAgICBjb25zb2xlLmxvZygnICDmiYvmnLrovpPlhaXmoYY6JywgcGhvbmVTY3JlZW4ubGVmdC50b0ZpeGVkKDEpLCBwaG9uZVNjcmVlbi50b3AudG9GaXhlZCgxKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCcgIOmqjOivgeeggei+k+WFpeahhjonLCBjb2RlU2NyZWVuLmxlZnQudG9GaXhlZCgxKSwgY29kZVNjcmVlbi50b3AudG9GaXhlZCgxKSk7XG4gICAgICAgIFxuICAgICAgICAvLyDnp7vpmaTml6fnmoTlrrnlmajlkozovpPlhaXmoYZcbiAgICAgICAgdmFyIG9sZENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXRpdmUtaW5wdXQtY29udGFpbmVyJyk7XG4gICAgICAgIGlmIChvbGRDb250YWluZXIpIHtcbiAgICAgICAgICAgIG9sZENvbnRhaW5lci5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65paw55qE5a655Zmo77yI55u05o6l5pS+5ZyoIGJvZHkg5LiL77yM56Gu5L+d5LiN6KKr6YGu5oyh77yJXG4gICAgICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgY29udGFpbmVyLmlkID0gJ25hdGl2ZS1pbnB1dC1jb250YWluZXInO1xuICAgICAgICBjb250YWluZXIuc3R5bGUuY3NzVGV4dCA9IFtcbiAgICAgICAgICAgICdwb3NpdGlvbjogZml4ZWQnLFxuICAgICAgICAgICAgJ3RvcDogMCcsXG4gICAgICAgICAgICAnbGVmdDogMCcsXG4gICAgICAgICAgICAnd2lkdGg6IDEwMCUnLFxuICAgICAgICAgICAgJ2hlaWdodDogMTAwJScsXG4gICAgICAgICAgICAncG9pbnRlci1ldmVudHM6IG5vbmUnLFxuICAgICAgICAgICAgJ3otaW5kZXg6IDk5OTk5J1xuICAgICAgICBdLmpvaW4oJzsgJyk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWIm+W7uuaJi+acuuWPt+i+k+WFpeahhlxuICAgICAgICB2YXIgcGhvbmVJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgIHBob25lSW5wdXQuaWQgPSAnbmF0aXZlLXBob25lLWlucHV0JztcbiAgICAgICAgcGhvbmVJbnB1dC50eXBlID0gJ3RlbCc7XG4gICAgICAgIHBob25lSW5wdXQucGxhY2Vob2xkZXIgPSAn6K+36L6T5YWl5omL5py65Y+3JztcbiAgICAgICAgcGhvbmVJbnB1dC5tYXhMZW5ndGggPSAxMTtcbiAgICAgICAgcGhvbmVJbnB1dC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb21wbGV0ZScsICdvZmYnKTsgIC8vIPCflKfjgJDkv67lpI3jgJHnpoHnlKjmtY/op4jlmajoh6rliqjloavlhYXljoblj7LorrDlvZVcbiAgICAgICAgcGhvbmVJbnB1dC5zZXRBdHRyaWJ1dGUoJ2F1dG9jYXBpdGFsaXplJywgJ29mZicpOyAvLyDnpoHnlKjoh6rliqjlpKflhplcbiAgICAgICAgcGhvbmVJbnB1dC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb3JyZWN0JywgJ29mZicpOyAgICAvLyDnpoHnlKjoh6rliqjnuqDmraNcbiAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS5jc3NUZXh0ID0gW1xuICAgICAgICAgICAgJ3Bvc2l0aW9uOiBhYnNvbHV0ZScsXG4gICAgICAgICAgICAnbGVmdDogJyArIHBob25lU2NyZWVuLmxlZnQgKyAncHgnLFxuICAgICAgICAgICAgJ3RvcDogJyArIHBob25lU2NyZWVuLnRvcCArICdweCcsXG4gICAgICAgICAgICAnd2lkdGg6ICcgKyBwaG9uZVNjcmVlbi53aWR0aCArICdweCcsXG4gICAgICAgICAgICAnaGVpZ2h0OiAnICsgcGhvbmVTY3JlZW4uaGVpZ2h0ICsgJ3B4JyxcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICAnYm9yZGVyOiBub25lJyxcbiAgICAgICAgICAgICdib3JkZXItcmFkaXVzOiAwJyxcbiAgICAgICAgICAgICdmb250LXNpemU6IDEycHgnLFxuICAgICAgICAgICAgJ2NvbG9yOiAjMzMzJyxcbiAgICAgICAgICAgICdwYWRkaW5nOiAwIDhweCcsXG4gICAgICAgICAgICAnYm94LXNpemluZzogYm9yZGVyLWJveCcsXG4gICAgICAgICAgICAnb3V0bGluZTogbm9uZScsXG4gICAgICAgICAgICAncG9pbnRlci1ldmVudHM6IGF1dG8nLFxuICAgICAgICAgICAgJ3otaW5kZXg6IDEwMDAwMCcsXG4gICAgICAgICAgICAnY3Vyc29yOiB0ZXh0JyxcbiAgICAgICAgICAgICdmb250LWZhbWlseTogQXJpYWwsIFwiTWljcm9zb2Z0IFlhSGVpXCIsIHNhbnMtc2VyaWYnLFxuICAgICAgICAgICAgJ2xpbmUtaGVpZ2h0OiAnICsgcGhvbmVTY3JlZW4uaGVpZ2h0ICsgJ3B4JyxcbiAgICAgICAgICAgICd0ZXh0LWFsaWduOiBsZWZ0J1xuICAgICAgICBdLmpvaW4oJzsgJyk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChwaG9uZUlucHV0KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWIm+W7uumqjOivgeeggei+k+WFpeahhlxuICAgICAgICB2YXIgY29kZUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgY29kZUlucHV0LmlkID0gJ25hdGl2ZS1jb2RlLWlucHV0JztcbiAgICAgICAgY29kZUlucHV0LnR5cGUgPSAndGV4dCc7XG4gICAgICAgIGNvZGVJbnB1dC5wbGFjZWhvbGRlciA9ICfpqozor4HnoIEnO1xuICAgICAgICBjb2RlSW5wdXQubWF4TGVuZ3RoID0gNjtcbiAgICAgICAgY29kZUlucHV0LnNldEF0dHJpYnV0ZSgnYXV0b2NvbXBsZXRlJywgJ29mZicpOyAgLy8g8J+Up+OAkOS/ruWkjeOAkeemgeeUqOa1j+iniOWZqOiHquWKqOWhq+WFheWOhuWPsuiusOW9lVxuICAgICAgICBjb2RlSW5wdXQuc2V0QXR0cmlidXRlKCdhdXRvY2FwaXRhbGl6ZScsICdvZmYnKTsgLy8g56aB55So6Ieq5Yqo5aSn5YaZXG4gICAgICAgIGNvZGVJbnB1dC5zZXRBdHRyaWJ1dGUoJ2F1dG9jb3JyZWN0JywgJ29mZicpOyAgICAvLyDnpoHnlKjoh6rliqjnuqDmraNcbiAgICAgICAgY29kZUlucHV0LnN0eWxlLmNzc1RleHQgPSBbXG4gICAgICAgICAgICAncG9zaXRpb246IGFic29sdXRlJyxcbiAgICAgICAgICAgICdsZWZ0OiAnICsgY29kZVNjcmVlbi5sZWZ0ICsgJ3B4JyxcbiAgICAgICAgICAgICd0b3A6ICcgKyBjb2RlU2NyZWVuLnRvcCArICdweCcsXG4gICAgICAgICAgICAnd2lkdGg6ICcgKyBjb2RlU2NyZWVuLndpZHRoICsgJ3B4JyxcbiAgICAgICAgICAgICdoZWlnaHQ6ICcgKyBjb2RlU2NyZWVuLmhlaWdodCArICdweCcsXG4gICAgICAgICAgICAnYmFja2dyb3VuZDogdHJhbnNwYXJlbnQnLFxuICAgICAgICAgICAgJ2JvcmRlcjogbm9uZScsXG4gICAgICAgICAgICAnYm9yZGVyLXJhZGl1czogMCcsXG4gICAgICAgICAgICAnZm9udC1zaXplOiAxMnB4JyxcbiAgICAgICAgICAgICdjb2xvcjogIzMzMycsXG4gICAgICAgICAgICAncGFkZGluZzogMCA4cHgnLFxuICAgICAgICAgICAgJ2JveC1zaXppbmc6IGJvcmRlci1ib3gnLFxuICAgICAgICAgICAgJ291dGxpbmU6IG5vbmUnLFxuICAgICAgICAgICAgJ3BvaW50ZXItZXZlbnRzOiBhdXRvJyxcbiAgICAgICAgICAgICd6LWluZGV4OiAxMDAwMDAnLFxuICAgICAgICAgICAgJ2N1cnNvcjogdGV4dCcsXG4gICAgICAgICAgICAnZm9udC1mYW1pbHk6IEFyaWFsLCBcIk1pY3Jvc29mdCBZYUhlaVwiLCBzYW5zLXNlcmlmJyxcbiAgICAgICAgICAgICdsaW5lLWhlaWdodDogJyArIGNvZGVTY3JlZW4uaGVpZ2h0ICsgJ3B4JyxcbiAgICAgICAgICAgICd0ZXh0LWFsaWduOiBsZWZ0J1xuICAgICAgICBdLmpvaW4oJzsgJyk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjb2RlSW5wdXQpO1xuICAgICAgICBcbiAgICAgICAgLy8g5re75Yqg54Sm54K55LqL5Lu26LCD6K+VXG4gICAgICAgIHBob25lSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfmiYvmnLrovpPlhaXmoYbojrflvpfnhKbngrknKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHBob25lSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfmiYvmnLrovpPlhaXmoYbooqvngrnlh7snKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvZGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ+mqjOivgeeggei+k+WFpeahhuiOt+W+l+eEpueCuScpO1xuICAgICAgICB9KTtcbiAgICAgICAgY29kZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygn6aqM6K+B56CB6L6T5YWl5qGG6KKr54K55Ye7Jyk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coJ+WOn+eUn+i+k+WFpeahhuWIm+W7uuWujOaIkCcpO1xuICAgICAgICBcbiAgICAgICAgLy8g5bu26L+f5qOA5p+l6L6T5YWl5qGG5piv5ZCm5q2j56Gu5Yib5bu6XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgcGhvbmVDaGVjayA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduYXRpdmUtcGhvbmUtaW5wdXQnKTtcbiAgICAgICAgICAgIHZhciBjb2RlQ2hlY2sgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF0aXZlLWNvZGUtaW5wdXQnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfovpPlhaXmoYbmo4Dmn6U6Jyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnICDmiYvmnLrovpPlhaXmoYY6JywgcGhvbmVDaGVjayA/ICflrZjlnKgnIDogJ+S4jeWtmOWcqCcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJyAg6aqM6K+B56CB6L6T5YWl5qGGOicsIGNvZGVDaGVjayA/ICflrZjlnKgnIDogJ+S4jeWtmOWcqCcpO1xuICAgICAgICAgICAgaWYgKHBob25lQ2hlY2spIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVjdCA9IHBob25lQ2hlY2suZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJyAg5omL5py66L6T5YWl5qGG5L2N572uOicsIHJlY3QubGVmdCwgcmVjdC50b3AsIHJlY3Qud2lkdGgsICd4JywgcmVjdC5oZWlnaHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAxMDApO1xuICAgICAgICBcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+WIm+W7uuWOn+eUn+i+k+WFpeahhuWksei0pTonLCBlKTtcbiAgICB9XG59O1xuXG4vLyDnp7vpmaTljp/nlJ8gSFRNTCDovpPlhaXmoYblhYPntKDvvIjnmbvlvZXmiJDlip/miJblhbPpl63lvLnnqpfml7bosIPnlKjvvIlcbnZhciBfcmVtb3ZlTmF0aXZlSW5wdXRFbGVtZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghY2Muc3lzLmlzQnJvd3NlcikgcmV0dXJuO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmF0aXZlLWlucHV0LWNvbnRhaW5lcicpO1xuICAgICAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgICAgICBjb250YWluZXIucmVtb3ZlKCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygn5Y6f55Sf6L6T5YWl5qGG5bey56e76ZmkJyk7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ+enu+mZpOWOn+eUn+i+k+WFpeahhuWksei0pTonLCBlKTtcbiAgICB9XG59O1xuXG4vLyDkv67lpI0gRWRpdEJveCDnmoQgSFRNTCBpbnB1dCDlhYPntKDkvY3nva7lkozlsLrlr7hcbnZhciBfZml4RWRpdEJveElucHV0RWxlbWVudHMgPSBmdW5jdGlvbihwYW5lbCwgcGhvbmVJbnB1dE5vZGUsIGNvZGVJbnB1dE5vZGUsIGlucHV0V2lkdGgsIGlucHV0SGVpZ2h0LCBjb2RlSW5wdXRXLCBwaG9uZUVkaXRCb3gsIGNvZGVFZGl0Qm94KSB7XG4gICAgaWYgKCFjYy5zeXMuaXNCcm93c2VyKSByZXR1cm47XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgICAgLy8g6I635Y+WIENhbnZhcyDlhYPntKBcbiAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdHYW1lQ2FudmFzJykgfHwgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignY2FudmFzJyk7XG4gICAgICAgIGlmICghY2FudmFzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfmib7kuI3liLAgQ2FudmFzIOWFg+e0oCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB2YXIgY2FudmFzUmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc29sZS5sb2coJ0NhbnZhcyDlsLrlr7g6JywgY2FudmFzUmVjdC53aWR0aCwgJ3gnLCBjYW52YXNSZWN0LmhlaWdodCk7XG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5bmuLjmiI/orr7orqHnmoTliIbovqjnjodcbiAgICAgICAgdmFyIHdpblNpemUgPSBjYy53aW5TaXplO1xuICAgICAgICBjb25zb2xlLmxvZygn5ri45oiP5YiG6L6o546HOicsIHdpblNpemUud2lkdGgsICd4Jywgd2luU2l6ZS5oZWlnaHQpO1xuICAgICAgICBcbiAgICAgICAgLy8g6K6h566X57yp5pS+5q+U5L6LXG4gICAgICAgIHZhciBzY2FsZVggPSBjYW52YXNSZWN0LndpZHRoIC8gd2luU2l6ZS53aWR0aDtcbiAgICAgICAgdmFyIHNjYWxlWSA9IGNhbnZhc1JlY3QuaGVpZ2h0IC8gd2luU2l6ZS5oZWlnaHQ7XG4gICAgICAgIGNvbnNvbGUubG9nKCfnvKnmlL7mr5Tkvos6Jywgc2NhbGVYLCBzY2FsZVkpO1xuICAgICAgICBcbiAgICAgICAgLy8g6L6F5Yqp5Ye95pWw77ya5bCGIENvY29zIOS4lueVjOWdkOagh+i9rOaNouS4uiBIVE1MIOWxj+W5leWdkOagh1xuICAgICAgICB2YXIgd29ybGRUb1NjcmVlbiA9IGZ1bmN0aW9uKHdvcmxkUG9zLCBub2RlV2lkdGgsIG5vZGVIZWlnaHQpIHtcbiAgICAgICAgICAgIC8vIENvY29zIOWdkOagh+ezu++8muWOn+eCueWcqOW3puS4i+inku+8jFnovbTlkJHkuIpcbiAgICAgICAgICAgIC8vIEhUTUwg5Z2Q5qCH57O777ya5Y6f54K55Zyo5bem5LiK6KeS77yMWei9tOWQkeS4i1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDkuJbnlYzlnZDmoIfovazmjaLkuLrnm7jlr7nkuo7orr7orqHliIbovqjnjofnmoTkvY3nva7vvIgwIOWIsCB3aW5TaXpl77yJXG4gICAgICAgICAgICAvLyDnhLblkI7nvKnmlL7liLAgQ2FudmFzIOWwuuWvuFxuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgc2NyZWVuWCA9ICh3b3JsZFBvcy54IC0gbm9kZVdpZHRoIC8gMikgKiBzY2FsZVg7XG4gICAgICAgICAgICB2YXIgc2NyZWVuWSA9IGNhbnZhc1JlY3QuaGVpZ2h0IC0gKHdvcmxkUG9zLnkgKyBub2RlSGVpZ2h0IC8gMikgKiBzY2FsZVk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB7IHg6IHNjcmVlblgsIHk6IHNjcmVlblkgfTtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIC8vIOiuoeeul+aJi+acuui+k+WFpeahhueahOS4lueVjOWdkOagh1xuICAgICAgICB2YXIgcGhvbmVXb3JsZFBvcyA9IHBob25lSW5wdXROb2RlLmNvbnZlcnRUb1dvcmxkU3BhY2VBUihjYy52MigwLCAwKSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCfmiYvmnLrovpPlhaXmoYbkuJbnlYzlnZDmoIc6JywgcGhvbmVXb3JsZFBvcy54LCBwaG9uZVdvcmxkUG9zLnkpO1xuICAgICAgICBcbiAgICAgICAgdmFyIHBob25lU2NyZWVuUG9zID0gd29ybGRUb1NjcmVlbihwaG9uZVdvcmxkUG9zLCBpbnB1dFdpZHRoLCBpbnB1dEhlaWdodCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCfmiYvmnLrovpPlhaXmoYblsY/luZXkvY3nva46JywgcGhvbmVTY3JlZW5Qb3MueCwgcGhvbmVTY3JlZW5Qb3MueSk7XG4gICAgICAgIFxuICAgICAgICAvLyDmn6Xmib4gSFRNTCBpbnB1dCDlhYPntKBcbiAgICAgICAgdmFyIGlucHV0cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0Jyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCfmib7liLAgJyArIGlucHV0cy5sZW5ndGggKyAnIOS4qiBpbnB1dCDlhYPntKAnKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenOWPquacieS4gOS4qiBpbnB1dO+8jOmcgOimgeaJi+WKqOWIm+W7uuesrOS6jOS4qlxuICAgICAgICBpZiAoaW5wdXRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgdmFyIHBob25lSW5wdXQgPSBpbnB1dHNbMF07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOiuvue9ruagt+W8j1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLmxlZnQgPSBNYXRoLm1heCgwLCBwaG9uZVNjcmVlblBvcy54KSArICdweCc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLnRvcCA9IE1hdGgubWF4KDAsIHBob25lU2NyZWVuUG9zLnkpICsgJ3B4JztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUud2lkdGggPSAoaW5wdXRXaWR0aCAqIHNjYWxlWCkgKyAncHgnO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS5oZWlnaHQgPSAoaW5wdXRIZWlnaHQgKiBzY2FsZVkpICsgJ3B4JztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUuekluZGV4ID0gJzk5OTknO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS5vcGFjaXR5ID0gJzEnO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdhdXRvJztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUuY3Vyc29yID0gJ3RleHQnO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYmEoMjU1LDI1NSwyNTUsMC41KSc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLmJvcmRlciA9ICcycHggc29saWQgZ29sZCc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLm91dGxpbmUgPSAnbm9uZSc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLmZvbnRTaXplID0gJzE2cHgnO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS5jb2xvciA9ICcjMzMzMzMzJztcbiAgICAgICAgICAgIHBob25lSW5wdXQuc3R5bGUucGFkZGluZyA9ICc1cHgnO1xuICAgICAgICAgICAgcGhvbmVJbnB1dC5zdHlsZS5ib3hTaXppbmcgPSAnYm9yZGVyLWJveCc7XG4gICAgICAgICAgICBwaG9uZUlucHV0LnN0eWxlLmJvcmRlclJhZGl1cyA9ICc1cHgnO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zb2xlLmxvZygn5omL5py66L6T5YWl5qGG5qC35byP5bey5L+u5aSN77yM5L2N572uOicsIHBob25lSW5wdXQuc3R5bGUubGVmdCwgcGhvbmVJbnB1dC5zdHlsZS50b3ApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDpqozor4HnoIHovpPlhaXmoYZcbiAgICAgICAgdmFyIGNvZGVXb3JsZFBvcyA9IGNvZGVJbnB1dE5vZGUuY29udmVydFRvV29ybGRTcGFjZUFSKGNjLnYyKDAsIDApKTtcbiAgICAgICAgY29uc29sZS5sb2coJ+mqjOivgeeggei+k+WFpeahhuS4lueVjOWdkOaghzonLCBjb2RlV29ybGRQb3MueCwgY29kZVdvcmxkUG9zLnkpO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNvZGVTY3JlZW5Qb3MgPSB3b3JsZFRvU2NyZWVuKGNvZGVXb3JsZFBvcywgY29kZUlucHV0VywgaW5wdXRIZWlnaHQpO1xuICAgICAgICBjb25zb2xlLmxvZygn6aqM6K+B56CB6L6T5YWl5qGG5bGP5bmV5L2N572uOicsIGNvZGVTY3JlZW5Qb3MueCwgY29kZVNjcmVlblBvcy55KTtcbiAgICAgICAgXG4gICAgICAgIGlmIChpbnB1dHMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgIHZhciBjb2RlSW5wdXQgPSBpbnB1dHNbMV07XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLmxlZnQgPSBNYXRoLm1heCgwLCBjb2RlU2NyZWVuUG9zLngpICsgJ3B4JztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS50b3AgPSBNYXRoLm1heCgwLCBjb2RlU2NyZWVuUG9zLnkpICsgJ3B4JztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS53aWR0aCA9IChjb2RlSW5wdXRXICogc2NhbGVYKSArICdweCc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUuaGVpZ2h0ID0gKGlucHV0SGVpZ2h0ICogc2NhbGVZKSArICdweCc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUuekluZGV4ID0gJzk5OTknO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLm9wYWNpdHkgPSAnMSc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ2F1dG8nO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLmN1cnNvciA9ICd0ZXh0JztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS5iYWNrZ3JvdW5kID0gJ3JnYmEoMjU1LDI1NSwyNTUsMC41KSc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUuYm9yZGVyID0gJzJweCBzb2xpZCBnb2xkJztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS5vdXRsaW5lID0gJ25vbmUnO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLmZvbnRTaXplID0gJzE2cHgnO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLmNvbG9yID0gJyMzMzMzMzMnO1xuICAgICAgICAgICAgY29kZUlucHV0LnN0eWxlLnBhZGRpbmcgPSAnNXB4JztcbiAgICAgICAgICAgIGNvZGVJbnB1dC5zdHlsZS5ib3hTaXppbmcgPSAnYm9yZGVyLWJveCc7XG4gICAgICAgICAgICBjb2RlSW5wdXQuc3R5bGUuYm9yZGVyUmFkaXVzID0gJzVweCc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfpqozor4HnoIHovpPlhaXmoYbmoLflvI/lt7Lkv67lpI0nKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6LCD6K+V77ya5pi+56S66L6T5YWl5qGG55qE5a6e6ZmF5L2N572uXG4gICAgICAgIGNvbnNvbGUubG9nKCc9PT0g6LCD6K+V5L+h5oGvID09PScpO1xuICAgICAgICBjb25zb2xlLmxvZygnQ2FudmFzIOS9jee9rjonLCBjYW52YXNSZWN0LmxlZnQsIGNhbnZhc1JlY3QudG9wKTtcbiAgICAgICAgY29uc29sZS5sb2coJ+iuvuiuoeWIhui+qOeOhzonLCB3aW5TaXplLndpZHRoLCAneCcsIHdpblNpemUuaGVpZ2h0KTtcbiAgICAgICAgY29uc29sZS5sb2coJ+i+k+WFpeahhuiKgueCueWwuuWvuDonLCBpbnB1dFdpZHRoLCAneCcsIGlucHV0SGVpZ2h0KTtcbiAgICAgICAgY29uc29sZS5sb2coJ+mqjOivgeeggei+k+WFpeahhuWwuuWvuDonLCBjb2RlSW5wdXRXLCAneCcsIGlucHV0SGVpZ2h0KTtcbiAgICAgICAgXG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCfkv67lpI0gRWRpdEJveCDmoLflvI/lpLHotKU6JywgZSk7XG4gICAgfVxufTtcblxuLy8gTXV0YXRpb25PYnNlcnZlciDnm5HlkKzmlrDliJvlu7rnmoRpbnB1dOWFg+e0oFxudmFyIF9zdGFydElucHV0T2JzZXJ2ZXIgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIWNjLnN5cy5pc0Jyb3dzZXIpIHJldHVybjtcblxuICAgIHRyeSB7XG4gICAgICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uKG11dGF0aW9ucykge1xuICAgICAgICAgICAgbXV0YXRpb25zLmZvckVhY2goZnVuY3Rpb24obXV0YXRpb24pIHtcbiAgICAgICAgICAgICAgICBtdXRhdGlvbi5hZGRlZE5vZGVzLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5ub2RlTmFtZSA9PT0gJ0lOUFVUJyB8fCBub2RlLm5vZGVOYW1lID09PSAnVEVYVEFSRUEnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfc3R5bGVTaW5nbGVJbnB1dChub2RlLCAnIzAwMDAwMCcsICcjZmZmZmZmJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8g5qOA5p+l5a2Q6IqC54K5XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLnF1ZXJ5U2VsZWN0b3JBbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbnB1dHMgPSBub2RlLnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0LCB0ZXh0YXJlYScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRzLmZvckVhY2goZnVuY3Rpb24oaW5wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3N0eWxlU2luZ2xlSW5wdXQoaW5wLCAnIzAwMDAwMCcsICcjZmZmZmZmJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xuICAgICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgICAgc3VidHJlZTogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCflkK/liqhJbnB1dOebkeWQrOWZqOWksei0pTonLCBlKTtcbiAgICB9XG59O1xuXG5jYy5DbGFzcyh7XG4gICAgZXh0ZW5kczogY2MuQ29tcG9uZW50LFxuXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICB3YWl0X25vZGU6IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLk5vZGUsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH0sXG4gICAgICAgIHVzZXJfYWdyZWVtZW50X3ByZWZhYnM6IHtcbiAgICAgICAgICAgIHR5cGU6IGNjLlByZWZhYixcbiAgICAgICAgICAgIGRlZmF1bHQ6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgcGhvbmVfbG9naW5fcHJlZmFiOiB7XG4gICAgICAgICAgICB0eXBlOiBjYy5QcmVmYWIsXG4gICAgICAgICAgICBkZWZhdWx0OiBudWxsXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgb25Mb2FkICgpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhcImxvZ2luU2NlbmUgb25Mb2FkIOW8gOWni+aJp+ihjFwiKTtcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XCIpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDwn5SnIOS/ruWkje+8muemgeeUqOiHquWKqOWFqOWxj+WKn+iDve+8iOWPjOmHjeS/nemZqe+8jOenu+mZpCBpc01vYmlsZSDmo4Dmn6XvvIlcbiAgICAgICAgICAgIC8vIOWNs+S9vyBtYWluLmpzIOS4reeahOiuvue9ruayoeacieeUn+aViO+8jOi/memHjOS5n+S8muWGjeasoeemgeeUqFxuICAgICAgICAgICAgaWYgKGNjLnZpZXcgJiYgY2Mudmlldy5lbmFibGVBdXRvRnVsbFNjcmVlbikge1xuICAgICAgICAgICAgICAgIGNjLnZpZXcuZW5hYmxlQXV0b0Z1bGxTY3JlZW4oZmFsc2UpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibG9naW5TY2VuZTog5bey56aB55So6Ieq5Yqo5YWo5bGP5Yqf6IO9XCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDwn5SnIOmineWkluS/nemZqe+8muemgeeUqCBzY3JlZW4g55qE6Ieq5Yqo5YWo5bGP6Kem5pG455uR5ZCs5ZmoXG4gICAgICAgICAgICBpZiAoY2Muc2NyZWVuICYmIGNjLnNjcmVlbi5kaXNhYmxlQXV0b0Z1bGxTY3JlZW4pIHtcbiAgICAgICAgICAgICAgICBjYy5zY3JlZW4uZGlzYWJsZUF1dG9GdWxsU2NyZWVuKCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJsb2dpblNjZW5lOiDlt7LnpoHnlKggc2NyZWVuIOiHquWKqOWFqOWxj+inpuaRuOebkeWQrOWZqFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuemgeeUqOiHquWKqOWFqOWxj+aXtuWHuumUmTpcIiwgZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g5ZCv5YqoV2Vi5bmz5Y+wSW5wdXTmoLflvI/nm5HlkKzlmahcbiAgICAgICAgICAgIF9zdGFydElucHV0T2JzZXJ2ZXIoKTtcbiAgICAgICAgICAgIF9pbmplY3RHbG9iYWxTdHlsZXMoJyMwMDAwMDAnLCAnI2ZmZmZmZicpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi5Yid5aeL5YyW5qC35byP55uR5ZCs5Zmo5pe25Ye66ZSZOlwiLCBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2lzQWdyZWVtZW50Q2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9waG9uZUxvZ2luUG9wdXBTaG93aW5nID0gZmFsc2U7ICAvLyDliJ3lp4vljJblvLnnqpfmoIflv5fkvY1cbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLl9pbml0V2FpdE5vZGUoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuWIneWni+WMluetieW+heiKgueCueaXtuWHuumUmTpcIiwgZSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDliJ3lp4vljJblpI3pgInmoYbvvIjkvb/nlKjngrnlh7vkuovku7bvvIlcbiAgICAgICAgICAgIHRoaXMuX2luaXRDaGVja2JveCgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi5Yid5aeL5YyW5aSN6YCJ5qGG5pe25Ye66ZSZOlwiLCBlKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOWIneWni+WMlueZu+W9leaMiemSrlxuICAgICAgICAgICAgdGhpcy5faW5pdExvZ2luQnV0dG9ucygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi5Yid5aeL5YyW55m75b2V5oyJ6ZKu5pe25Ye66ZSZOlwiLCBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDliJ3lp4vljJblnLrmma/kuK3pooTnva7nmoTmiYvmnLrnmbvlvZXlvLnnqpfvvIhsb2dpbiDoioLngrnvvIlcbiAgICAgICAgICAgIHRoaXMuX2luaXRQaG9uZUxvZ2luUG9wdXAoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuWIneWni+WMluaJi+acuueZu+W9leW8ueeql+aXtuWHuumUmTpcIiwgZSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDliJ3lp4vljJbnlKjmiLfljY/orq7pk77mjqXngrnlh7vkuovku7ZcbiAgICAgICAgICAgIHRoaXMuX2luaXRVc2VyQWdyZWVtZW50TGluaygpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi5Yid5aeL5YyW55So5oi35Y2P6K6u6ZO+5o6l5pe25Ye66ZSZOlwiLCBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDwn5qA44CQ5oCn6IO95LyY5YyW44CR6aKE5Yqg6L295aSn5Y6F5Zy65pmv5ZKM5ri45oiP5Zy65pmvXG4gICAgICAgICAgICB0aGlzLl9wcmVsb2FkU2NlbmVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLpooTliqDovb3lnLrmma/ml7blh7rplJk6XCIsIGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpuacieacrOWcsOeZu+W9leS8muivne+8jOWwneivleiHquWKqOeZu+W9lVxuICAgICAgICAgICAgdGhpcy5fY2hlY2tBdXRvTG9naW4oKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIuajgOafpeiHquWKqOeZu+W9leaXtuWHuumUmTpcIiwgZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5teWdsb2JhbCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJteWdsb2JhbCDmnKrlrprkuYnvvIzlsJ3or5XnrYnlvoUuLi5cIik7XG4gICAgICAgICAgICB0aGlzLl93YWl0Rm9yTXlnbG9iYWwoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2luaXRBbmRTdGFydCgpO1xuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhcImxvZ2luU2NlbmUgb25Mb2FkIOaJp+ihjOWujOaIkFwiKTtcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XCIpO1xuICAgIH0sXG5cbiAgICAvLyDmo4Dmn6Xoh6rliqjnmbvlvZVcbiAgICBfY2hlY2tBdXRvTG9naW46IGZ1bmN0aW9uKCkge1xuICAgICAgICBcbiAgICAgICAgdmFyIG15Z2xvYmFsID0gd2luZG93Lm15Z2xvYmFsO1xuICAgICAgICBpZiAoIW15Z2xvYmFsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmo4Dmn6XmmK/lkKbooqvlvLrliLbkuIvnur9cbiAgICAgICAgaWYgKG15Z2xvYmFsLndhc0ZvcmNlTG9nZ2VkT3V0KCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dFcnJvcihteWdsb2JhbC5nZXRGb3JjZUxvZ291dFJlYXNvbigpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOajgOafpeaYr+WQpuacieacrOWcsOS8muivnVxuICAgICAgICBpZiAobXlnbG9iYWwuaGFzTG9jYWxTZXNzaW9uKCkpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgbXlnbG9iYWwudmVyaWZ5VG9rZW4oZnVuY3Rpb24odmFsaWQsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAodmFsaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd0Vycm9yKFwi6Ieq5Yqo55m75b2V5LitLi4uXCIpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8g5qOA5p+l5piv5ZCm5pyJ5L+d5a2Y55qE5oi/6Ze05L+h5oGv77yI5Yi35paw6aG16Z2i5ZCO5oGi5aSN5Yiw5ri45oiP5Zy65pmv77yJXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWNvbm5lY3RJbmZvID0gbXlnbG9iYWwuc29ja2V0ICYmIG15Z2xvYmFsLnNvY2tldC5sb2FkUmVjb25uZWN0SW5mbyA/IFxuICAgICAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LmxvYWRSZWNvbm5lY3RJbmZvKCkgOiB7IHRva2VuOiAnJywgcGxheWVySWQ6ICcnLCByb29tQ29kZTogJycgfTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDlpoLmnpzmnInmiL/pl7Tlj7fvvIzor7TmmI7kuYvliY3lnKjmuLjmiI/kuK3vvIzpnIDopoHmgaLlpI3liLDmuLjmiI/lnLrmma9cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlY29ubmVjdEluZm8ucm9vbUNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG15Z2xvYmFsLnNvY2tldCAmJiBteWdsb2JhbC5zb2NrZXQuaW5pdFNvY2tldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQuaW5pdFNvY2tldCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyDnm5HlkKzmiL/pl7TmgaLlpI3kuovku7ZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQub25Sb29tUmVzdG9yZWQoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJnYW1lU2NlbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8g55uR5ZCs5pmu6YCa6L+e5o6l5oiQ5Yqf77yI5LiN5Zyo5oi/6Ze05Lit77yJXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV2dCA9IHdpbmRvdy5ldmVudExpc3RlciA/IHdpbmRvdy5ldmVudExpc3Rlcih7fSkgOiBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZ0Lm9uKFwiY29ubmVjdGlvbl9zdWNjZXNzXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZShcImdhbWVTY2VuZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMC41KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIOayoeacieaIv+mXtOS/oeaBr++8jOato+W4uOi3s+i9rOWIsOWkp+WOhVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG15Z2xvYmFsLnNvY2tldCAmJiBteWdsb2JhbC5zb2NrZXQuaW5pdFNvY2tldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQuaW5pdFNvY2tldCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCAwLjUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVG9rZW7ml6DmlYjvvIzmmL7npLrplJnor6/kv6Hmga/lubblgZznlZnlnKjnmbvlvZXpobXpnaJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd0Vycm9yKG1lc3NhZ2UgfHwgXCLnmbvlvZXlt7Lov4fmnJ/vvIzor7fph43mlrDnmbvlvZVcIik7XG4gICAgICAgICAgICAgICAgICAgIC8vIG15Z2xvYmFsLnZlcmlmeVRva2VuIOW3sue7j+a4hemZpOS6huacrOWcsOeKtuaAge+8jOi/memHjOS4jemcgOimgeWGjeasoea4hemZpFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9pbml0V2FpdE5vZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy53YWl0X25vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2xvYWRpbmdJbWFnZSA9IHRoaXMud2FpdF9ub2RlLmdldENoaWxkQnlOYW1lKFwibG9hZGluZ19pbWFnZVwiKTtcbiAgICAgICAgICAgIHZhciBsYmxOb2RlID0gdGhpcy53YWl0X25vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJsYmxjb250ZW50X0xhYmVsXCIpO1xuICAgICAgICAgICAgaWYgKGxibE5vZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93YWl0TGFiZWwgPSBsYmxOb2RlLmdldENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLndhaXRfbm9kZS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfaW5pdENoZWNrYm94OiBmdW5jdGlvbigpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIC8vIGxvZ2luU2NlbmUg6ISa5pys5oyC6L295ZyoIFJPT1RfVUkg6IqC54K55LiK77yM5omA5LulIHRoaXMubm9kZSDlsLHmmK8gUk9PVF9VSVxuICAgICAgICB2YXIgY2hlY2tNYXJrTm9kZSA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcImNoZWNrX21hcmtcIik7XG4gICAgICAgIGlmICghY2hlY2tNYXJrTm9kZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImNoZWNrX21hcmsg6IqC54K55pyq5om+5YiwXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICB0aGlzLl9jaGVja01hcmtOb2RlID0gY2hlY2tNYXJrTm9kZTtcbiAgICAgICAgXG4gICAgICAgIHZhciBjaGVja21hcmsgPSBjaGVja01hcmtOb2RlLmdldENoaWxkQnlOYW1lKFwiY2hlY2ttYXJrXCIpO1xuICAgICAgICBpZiAoY2hlY2ttYXJrKSB7XG4gICAgICAgICAgICB0aGlzLl9jaGVja21hcmtJY29uID0gY2hlY2ttYXJrO1xuICAgICAgICAgICAgY2hlY2ttYXJrLmFjdGl2ZSA9IHRydWU7ICAvLyDpu5jorqTpgInkuK1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5faXNBZ3JlZW1lbnRDaGVja2VkID0gdHJ1ZTsgIC8vIOm7mOiupOW3suWQjOaEj+WNj+iurlxuICAgICAgICBcbiAgICAgICAgdmFyIGJ1dHRvbiA9IGNoZWNrTWFya05vZGUuZ2V0Q29tcG9uZW50KGNjLkJ1dHRvbik7XG4gICAgICAgIGlmIChidXR0b24pIHtcbiAgICAgICAgICAgIGJ1dHRvbi5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNoZWNrTWFya05vZGUub2ZmKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCk7XG4gICAgICAgIGNoZWNrTWFya05vZGUub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgc2VsZi5fdG9nZ2xlQ2hlY2tib3goKTtcbiAgICAgICAgfSwgc2VsZik7XG4gICAgfSxcblxuICAgIF90b2dnbGVDaGVja2JveDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX2lzQWdyZWVtZW50Q2hlY2tlZCA9ICF0aGlzLl9pc0FncmVlbWVudENoZWNrZWQ7XG4gICAgICAgIGlmICh0aGlzLl9jaGVja21hcmtJY29uKSB7XG4gICAgICAgICAgICB0aGlzLl9jaGVja21hcmtJY29uLmFjdGl2ZSA9IHRoaXMuX2lzQWdyZWVtZW50Q2hlY2tlZDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzdGFydCAoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVwiKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJsb2dpblNjZW5lIHN0YXJ0IOaWueazleaJp+ihjFwiKTtcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XCIpO1xuICAgICAgICBcbiAgICAgICAgLy8g5aSH55So5pa55qGI77ya5ZyoIHN0YXJ0IOS4reWGjeasoeajgOafpeaMiemSruaYr+WQpuato+ehruWIneWni+WMllxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4g5bu26L+f5qOA5p+l5oyJ6ZKu54q25oCBLi4uXCIpO1xuICAgICAgICAgICAgdmFyIHBob25lTG9naW5Ob2RlID0gc2VsZi5ub2RlLmdldENoaWxkQnlOYW1lKFwibG9naW5fcGhvbmVcIik7XG4gICAgICAgICAgICBpZiAocGhvbmVMb2dpbk5vZGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIj4+PiBsb2dpbl9waG9uZSDoioLngrnlrZjlnKhcIik7XG4gICAgICAgICAgICAgICAgdmFyIGhhc1RvdWNoTGlzdGVuZXJzID0gcGhvbmVMb2dpbk5vZGUuZ2V0Q29tcG9uZW50KGNjLkJ1dHRvbikgIT09IG51bGw7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4g5piv5ZCm5pyJIEJ1dHRvbiDnu4Tku7Y6XCIsIGhhc1RvdWNoTGlzdGVuZXJzKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDlho3mrKHnoa7kv53kuovku7bnu5HlrppcbiAgICAgICAgICAgICAgICBwaG9uZUxvZ2luTm9kZS5vZmYoY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5EKTtcbiAgICAgICAgICAgICAgICBwaG9uZUxvZ2luTm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IFtzdGFydOWkh+eUqF0g5omL5py655m75b2V5oyJ6ZKuIFRPVUNIX0VORCDkuovku7bop6blj5FcIik7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9kb1Bob25lTG9naW4oKTtcbiAgICAgICAgICAgICAgICB9LCBzZWxmKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIj4+PiDlt7Lph43mlrDnu5HlrprmiYvmnLrnmbvlvZXmjInpkq7kuovku7ZcIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCI+Pj4gbG9naW5fcGhvbmUg6IqC54K55LiN5a2Y5Zyo77yBXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgd3hMb2dpbk5vZGUgPSBzZWxmLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJsb2dpbl93eFwiKTtcbiAgICAgICAgICAgIGlmICh3eExvZ2luTm9kZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IGxvZ2luX3d4IOiKgueCueWtmOWcqFwiKTtcbiAgICAgICAgICAgICAgICB3eExvZ2luTm9kZS5vZmYoY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5EKTtcbiAgICAgICAgICAgICAgICB3eExvZ2luTm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IFtzdGFydOWkh+eUqF0g5b6u5L+h55m75b2V5oyJ6ZKuIFRPVUNIX0VORCDkuovku7bop6blj5FcIik7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX2RvV3hMb2dpbigpO1xuICAgICAgICAgICAgICAgIH0sIHNlbGYpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOW3sumHjeaWsOe7keWumuW+ruS/oeeZu+W9leaMiemSruS6i+S7tlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMC41KTtcbiAgICB9LFxuXG4gICAgX2luaXRMb2dpbkJ1dHRvbnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhcIj09PSDliJ3lp4vljJbnmbvlvZXmjInpkq4gPT09XCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIuW9k+WJjeiKgueCuTpcIiwgdGhpcy5ub2RlID8gdGhpcy5ub2RlLm5hbWUgOiBcIm51bGxcIik7XG4gICAgICAgIFxuICAgICAgICAvLyDmiZPljbDmiYDmnInlrZDoioLngrnlkI3np7BcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5ub2RlLmNoaWxkcmVuO1xuICAgICAgICBjb25zb2xlLmxvZyhcIuWtkOiKgueCueaVsOmHjzpcIiwgY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCIgIOWtkOiKgueCuVtcIiArIGkgKyBcIl06XCIsIGNoaWxkcmVuW2ldLm5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbG9naW5TY2VuZSDohJrmnKzmjILovb3lnKggUk9PVF9VSSDoioLngrnkuIrvvIzmiYDku6UgdGhpcy5ub2RlIOWwseaYryBST09UX1VJXG4gICAgICAgIHZhciB3eExvZ2luTm9kZSA9IHRoaXMubm9kZS5nZXRDaGlsZEJ5TmFtZShcImxvZ2luX3d4XCIpO1xuICAgICAgICBjb25zb2xlLmxvZyhcInd4TG9naW5Ob2RlOlwiLCB3eExvZ2luTm9kZSA/IFwi5om+5YiwXCIgOiBcIuacquaJvuWIsFwiKTtcbiAgICAgICAgaWYgKHd4TG9naW5Ob2RlKSB7XG4gICAgICAgICAgICB2YXIgYnV0dG9uID0gd3hMb2dpbk5vZGUuZ2V0Q29tcG9uZW50KGNjLkJ1dHRvbik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInd4TG9naW5Ob2RlIEJ1dHRvbjpcIiwgYnV0dG9uID8gXCLlrZjlnKhcIiA6IFwi5LiN5a2Y5ZyoXCIpO1xuICAgICAgICAgICAgaWYgKGJ1dHRvbikge1xuICAgICAgICAgICAgICAgIGJ1dHRvbi5pbnRlcmFjdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJ1dHRvbi5jbGlja0V2ZW50cyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSBuZXcgY2MuQ29tcG9uZW50LkV2ZW50SGFuZGxlcigpO1xuICAgICAgICAgICAgICAgIGhhbmRsZXIudGFyZ2V0ID0gdGhpcy5ub2RlO1xuICAgICAgICAgICAgICAgIGhhbmRsZXIuY29tcG9uZW50ID0gXCJsb2dpblNjZW5lXCI7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5oYW5kbGVyID0gXCJfb25XeExvZ2luQ2xpY2tcIjtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmN1c3RvbUV2ZW50RGF0YSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgYnV0dG9uLmNsaWNrRXZlbnRzLnB1c2goaGFuZGxlcik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCLlvq7kv6HnmbvlvZXmjInpkq7liJ3lp4vljJblrozmiJBcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOa3u+WKoOWkh+eUqOeahOinpuaRuOS6i+S7tuebkeWQrO+8iOehruS/neeCueWHu+S6i+S7tuS4gOWumuiDveinpuWPke+8iVxuICAgICAgICAgICAgd3hMb2dpbk5vZGUub2ZmKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCk7XG4gICAgICAgICAgICB3eExvZ2luTm9kZS5vbihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4g5b6u5L+h55m75b2V5oyJ6ZKuIFRPVUNIX0VORCDkuovku7bop6blj5FcIik7XG4gICAgICAgICAgICAgICAgc2VsZi5fZG9XeExvZ2luKCk7XG4gICAgICAgICAgICB9LCBzZWxmKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLmnKrmib7liLAgbG9naW5fd3gg6IqC54K577yBXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHBob25lTG9naW5Ob2RlID0gdGhpcy5ub2RlLmdldENoaWxkQnlOYW1lKFwibG9naW5fcGhvbmVcIik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwicGhvbmVMb2dpbk5vZGU6XCIsIHBob25lTG9naW5Ob2RlID8gXCLmib7liLBcIiA6IFwi5pyq5om+5YiwXCIpO1xuICAgICAgICBpZiAocGhvbmVMb2dpbk5vZGUpIHtcbiAgICAgICAgICAgIHZhciBidXR0b24gPSBwaG9uZUxvZ2luTm9kZS5nZXRDb21wb25lbnQoY2MuQnV0dG9uKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicGhvbmVMb2dpbk5vZGUgQnV0dG9uOlwiLCBidXR0b24gPyBcIuWtmOWcqFwiIDogXCLkuI3lrZjlnKhcIik7XG4gICAgICAgICAgICBpZiAoYnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgYnV0dG9uLmludGVyYWN0YWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnV0dG9uLmNsaWNrRXZlbnRzID0gW107XG5cbiAgICAgICAgICAgICAgICB2YXIgaGFuZGxlciA9IG5ldyBjYy5Db21wb25lbnQuRXZlbnRIYW5kbGVyKCk7XG4gICAgICAgICAgICAgICAgaGFuZGxlci50YXJnZXQgPSB0aGlzLm5vZGU7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5jb21wb25lbnQgPSBcImxvZ2luU2NlbmVcIjtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmhhbmRsZXIgPSBcIl9vblBob25lTG9naW5DbGlja1wiO1xuICAgICAgICAgICAgICAgIGhhbmRsZXIuY3VzdG9tRXZlbnREYXRhID0gXCJcIjtcbiAgICAgICAgICAgICAgICBidXR0b24uY2xpY2tFdmVudHMucHVzaChoYW5kbGVyKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIuaJi+acuueZu+W9leaMiemSruWIneWni+WMluWujOaIkFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8g5re75Yqg5aSH55So55qE6Kem5pG45LqL5Lu255uR5ZCs77yI56Gu5L+d54K55Ye75LqL5Lu25LiA5a6a6IO96Kem5Y+R77yJXG4gICAgICAgICAgICBwaG9uZUxvZ2luTm9kZS5vZmYoY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5EKTtcbiAgICAgICAgICAgIHBob25lTG9naW5Ob2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIj4+PiDmiYvmnLrnmbvlvZXmjInpkq4gVE9VQ0hfRU5EIOS6i+S7tuinpuWPkVwiKTtcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTsgIC8vIOmYu+atouS6i+S7tuWGkuazoVxuICAgICAgICAgICAgICAgIHNlbGYuX2RvUGhvbmVMb2dpbigpO1xuICAgICAgICAgICAgfSwgc2VsZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi5pyq5om+5YiwIGxvZ2luX3Bob25lIOiKgueCue+8gVwiKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT0g55m75b2V5oyJ6ZKu5Yid5aeL5YyW57uT5p2fID09PVwiKTtcbiAgICB9LFxuXG4gICAgX2luaXRVc2VyQWdyZWVtZW50TGluazogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIC8vIGxvZ2luU2NlbmUg6ISa5pys5oyC6L295ZyoIFJPT1RfVUkg6IqC54K55LiK77yM5omA5LulIHRoaXMubm9kZSDlsLHmmK8gUk9PVF9VSVxuICAgICAgICB2YXIgbGlua05vZGUgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJ1c2VyX2FncmVlbWVudF9saW5rXCIpO1xuICAgICAgICBpZiAobGlua05vZGUpIHtcbiAgICAgICAgICAgIGxpbmtOb2RlLmFjdGl2ZSA9IHRydWU7XG5cbiAgICAgICAgICAgIHZhciBidXR0b24gPSBsaW5rTm9kZS5nZXRDb21wb25lbnQoY2MuQnV0dG9uKTtcbiAgICAgICAgICAgIGlmIChidXR0b24pIHtcbiAgICAgICAgICAgICAgICBidXR0b24uaW50ZXJhY3RhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBidXR0b24uY2xpY2tFdmVudHMgPSBbXTtcblxuICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyID0gbmV3IGNjLkNvbXBvbmVudC5FdmVudEhhbmRsZXIoKTtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLnRhcmdldCA9IHRoaXMubm9kZTtcbiAgICAgICAgICAgICAgICBoYW5kbGVyLmNvbXBvbmVudCA9IFwibG9naW5TY2VuZVwiO1xuICAgICAgICAgICAgICAgIGhhbmRsZXIuaGFuZGxlciA9IFwiX29uVXNlckFncmVlbWVudExpbmtDbGlja1wiO1xuICAgICAgICAgICAgICAgIGhhbmRsZXIuY3VzdG9tRXZlbnREYXRhID0gXCJcIjtcbiAgICAgICAgICAgICAgICBidXR0b24uY2xpY2tFdmVudHMucHVzaChoYW5kbGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfb25XeExvZ2luQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIj09PSDlvq7kv6HnmbvlvZXmjInpkq7ooqvngrnlh7sgPT09XCIpO1xuICAgICAgICB0aGlzLl9kb1d4TG9naW4oKTtcbiAgICB9LFxuXG4gICAgX29uUGhvbmVMb2dpbkNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCI9PT0g5omL5py655m75b2V5oyJ6ZKu6KKr54K55Ye7ID09PVwiKTtcbiAgICAgICAgdGhpcy5fZG9QaG9uZUxvZ2luKCk7XG4gICAgfSxcblxuICAgIF9vblVzZXJBZ3JlZW1lbnRMaW5rQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9zaG93VXNlckFncmVlbWVudFBvcHVwKCk7XG4gICAgfSxcblxuICAgIF9jaGVja0FncmVlbWVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc0FncmVlbWVudENoZWNrZWQ7XG4gICAgfSxcblxuICAgIC8vIPCfmoDjgJDmgKfog73kvJjljJbjgJHpooTliqDovb3lnLrmma9cbiAgICBfcHJlbG9hZFNjZW5lczogZnVuY3Rpb24oKSB7XG4gICAgICAgIFxuICAgICAgICAvLyDpooTliqDovb3lpKfljoXlnLrmma9cbiAgICAgICAgY2MuZGlyZWN0b3IucHJlbG9hZFNjZW5lKFwiaGFsbFNjZW5lXCIsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLwn5qAIFvpooTliqDovb1dIOWkp+WOheWcuuaZr+mihOWKoOi9veWksei0pTpcIiwgZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8g6aKE5Yqg6L295ri45oiP5Zy65pmvXG4gICAgICAgIGNjLmRpcmVjdG9yLnByZWxvYWRTY2VuZShcImdhbWVTY2VuZVwiLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwi8J+agCBb6aKE5Yqg6L29XSDmuLjmiI/lnLrmma/pooTliqDovb3lpLHotKU6XCIsIGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX3dhaXRGb3JNeWdsb2JhbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGF0dGVtcHRzID0gMDtcblxuICAgICAgICB2YXIgY2hlY2sgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGF0dGVtcHRzKys7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5teWdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9pbml0QW5kU3RhcnQoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYXR0ZW1wdHMgPCAyMCkge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY2hlY2ssIDEwMCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dFcnJvcihcIuWKoOi9veWksei0pe+8jOivt+WIt+aWsOmhtemdoumHjeivlVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgc2V0VGltZW91dChjaGVjaywgMTAwKTtcbiAgICB9LFxuXG4gICAgX2luaXRBbmRTdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbDtcblxuICAgICAgICBpZiAoIW15Z2xvYmFsLnNvY2tldCAmJiAhbXlnbG9iYWwuaW5pdCgpKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93RXJyb3IoXCLliJ3lp4vljJblpLHotKXvvIzor7fliLfmlrDpobXpnaLph43or5VcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmo4Dmn6XmmK/lkKbmnInkv53lrZjnmoTph43ov57kv6Hmga/vvIjliLfmlrDpobXpnaLlkI7mgaLlpI3vvIlcbiAgICAgICAgaWYgKG15Z2xvYmFsLnNvY2tldCAmJiBteWdsb2JhbC5zb2NrZXQubG9hZFJlY29ubmVjdEluZm8pIHtcbiAgICAgICAgICAgIHZhciByZWNvbm5lY3RJbmZvID0gbXlnbG9iYWwuc29ja2V0LmxvYWRSZWNvbm5lY3RJbmZvKClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHJlY29ubmVjdEluZm8udG9rZW4gJiYgcmVjb25uZWN0SW5mby5wbGF5ZXJJZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Nob3dMb2FkaW5nKHRydWUsIFwi5q2j5Zyo5oGi5aSN55m75b2V54q25oCBLi4uXCIpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5Yid5aeL5YyWIFdlYlNvY2tldCDov57mjqVcbiAgICAgICAgICAgICAgICBpZiAobXlnbG9iYWwuc29ja2V0LmluaXRTb2NrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwuc29ja2V0LmluaXRTb2NrZXQoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDnm5HlkKzmiL/pl7TmgaLlpI3kuovku7ZcbiAgICAgICAgICAgICAgICBteWdsb2JhbC5zb2NrZXQub25Sb29tUmVzdG9yZWQoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93TG9hZGluZyhmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIOaBouWkjeeOqeWutuaVsOaNrlxuICAgICAgICAgICAgICAgICAgICBteWdsb2JhbC5wbGF5ZXJEYXRhLnBsYXllcklkID0gZGF0YS5wbGF5ZXJfaWRcbiAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YS5uaWNrTmFtZSA9IGRhdGEucGxheWVyX25hbWVcbiAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YS5zYXZlVG9Mb2NhbCgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyDot7PovazliLDmuLjmiI/lnLrmma9cbiAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwiZ2FtZVNjZW5lXCIpXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDnm5HlkKzmma7pgJrov57mjqXmiJDlip/vvIjkuI3lnKjmiL/pl7TkuK3vvIlcbiAgICAgICAgICAgICAgICB2YXIgZXZ0ID0gd2luZG93LmV2ZW50TGlzdGVyID8gd2luZG93LmV2ZW50TGlzdGVyKHt9KSA6IG51bGxcbiAgICAgICAgICAgICAgICBpZiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2dC5vbihcImNvbm5lY3Rpb25fc3VjY2Vzc1wiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93TG9hZGluZyhmYWxzZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEucGxheWVySWQgPSBkYXRhLnBsYXllcl9pZFxuICAgICAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YS5uaWNrTmFtZSA9IGRhdGEucGxheWVyX25hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIG15Z2xvYmFsLnBsYXllckRhdGEuZ29iYWxfY291bnQgPSBkYXRhLmdvbGQgfHwgMFxuICAgICAgICAgICAgICAgICAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YS5zYXZlVG9Mb2NhbCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIilcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDliJ3lp4vljJbog4zmma/pn7PkuZAgLSDlpITnkIbmtY/op4jlmajoh6rliqjmkq3mlL7nrZbnlaVcbiAgICAgICAgdGhpcy5faW5pdEJhY2tncm91bmRNdXNpYygpO1xuXG4gICAgICAgIGlmIChteWdsb2JhbC5zb2NrZXQgJiYgbXlnbG9iYWwuc29ja2V0LmluaXRTb2NrZXQpIHtcbiAgICAgICAgICAgIG15Z2xvYmFsLnNvY2tldC5pbml0U29ja2V0KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g5Yid5aeL5YyW6IOM5pmv6Z+z5LmQIC0g5aSE55CG5rWP6KeI5Zmo6Ieq5Yqo5pKt5pS+562W55WlXG4gICAgX2luaXRCYWNrZ3JvdW5kTXVzaWM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICAvLyDpn7PmlYjlvIDlhbPmo4Dmn6VcbiAgICAgICAgdmFyIGlzb3Blbl9zb3VuZCA9ICh0eXBlb2Ygd2luZG93Lmlzb3Blbl9zb3VuZCAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93Lmlzb3Blbl9zb3VuZCA6IDE7XG4gICAgICAgIGlmICghaXNvcGVuX3NvdW5kKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWIneWni+WMlueKtuaAgVxuICAgICAgICB0aGlzLl9tdXNpY1BsYXlpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fdG91Y2hMaXN0ZW5lckFkZGVkID0gZmFsc2U7XG4gICAgICAgIFxuICAgICAgICAvLyDkvb/nlKggY2MucmVzb3VyY2VzLmxvYWQg5Yqg6L296Z+z6aKRXG4gICAgICAgIGNjLnJlc291cmNlcy5sb2FkKFwic291bmQvbG9naW5fYmdcIiwgY2MuQXVkaW9DbGlwLCBmdW5jdGlvbihlcnIsIGNsaXApIHtcbiAgICAgICAgICAgIGlmICghY2MuaXNWYWxpZChzZWxmLm5vZGUpKSByZXR1cm47XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc2V0dXBHbG9iYWxUb3VjaEZvck11c2ljKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyDkv53lrZjpn7PpopHliarovpFcbiAgICAgICAgICAgIHNlbGYuX2JnTXVzaWNDbGlwID0gY2xpcDtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyDkvb/nlKggcGxheU11c2ljIOaSreaUvuiDjOaZr+mfs+S5kO+8iOe7n+S4gOeahOiDjOaZr+mfs+S5kOeuoeeQhu+8iVxuICAgICAgICAgICAgICAgIGNjLmF1ZGlvRW5naW5lLnBsYXlNdXNpYyhjbGlwLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9tdXNpY1BsYXlpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIOaIkOWKn+aSreaUvu+8jOehruS/neebkeWQrOWZqOiiq+enu+mZpFxuICAgICAgICAgICAgICAgIHNlbGYuX3JlbW92ZUdsb2JhbFRvdWNoRm9yTXVzaWMoKTtcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgIHNlbGYuX3NldHVwR2xvYmFsVG91Y2hGb3JNdXNpYygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIFxuICAgIC8vIOmAmui/h+inpuaRuOaSreaUvumfs+S5kFxuICAgIF9wbGF5TXVzaWNPblRvdWNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgLy8g6aaW5YWI5qOA5p+l5piv5ZCm5pyJ5q2j5Zyo5pKt5pS+55qE6Z+z5LmQXG4gICAgICAgIGlmIChjYy5hdWRpb0VuZ2luZS5pc011c2ljUGxheWluZygpKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW1vdmVHbG9iYWxUb3VjaEZvck11c2ljKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOWmguaenOW3sue7j+aciemfs+mikeWJqui+ke+8jOebtOaOpeaSreaUvlxuICAgICAgICBpZiAodGhpcy5fYmdNdXNpY0NsaXApIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY2MuYXVkaW9FbmdpbmUucGxheU11c2ljKHRoaXMuX2JnTXVzaWNDbGlwLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tdXNpY1BsYXlpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbW92ZUdsb2JhbFRvdWNoRm9yTXVzaWMoKTtcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDmsqHmnInpn7PpopHliarovpHvvIzpnIDopoHliqDovb1cbiAgICAgICAgY2MucmVzb3VyY2VzLmxvYWQoXCJzb3VuZC9sb2dpbl9iZ1wiLCBjYy5BdWRpb0NsaXAsIGZ1bmN0aW9uKGVyciwgY2xpcCkge1xuICAgICAgICAgICAgaWYgKCFjYy5pc1ZhbGlkKHNlbGYubm9kZSkpIHJldHVybjtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYuX2JnTXVzaWNDbGlwID0gY2xpcDtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjYy5hdWRpb0VuZ2luZS5wbGF5TXVzaWMoY2xpcCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgc2VsZi5fbXVzaWNQbGF5aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzZWxmLl9yZW1vdmVHbG9iYWxUb3VjaEZvck11c2ljKCk7XG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBcbiAgICAvLyDorr7nva7lhajlsYDop6bmkbjnm5HlkKwgLSDnlKjmiLfngrnlh7vku7vmhI/kvY3nva7op6blj5Hpn7PkuZBcbiAgICBfc2V0dXBHbG9iYWxUb3VjaEZvck11c2ljOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g6Ziy5q2i6YeN5aSN5re75Yqg55uR5ZCs5ZmoXG4gICAgICAgIGlmICh0aGlzLl90b3VjaExpc3RlbmVyQWRkZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLl90b3VjaExpc3RlbmVyQWRkZWQgPSB0cnVlO1xuICAgICAgICBcbiAgICAgICAgLy8gQ29jb3MgQ3JlYXRvciDlsYLpnaLnmoTnm5HlkKxcbiAgICAgICAgdGhpcy5fY29jb3NUb3VjaEhhbmRsZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuX3BsYXlNdXNpY09uVG91Y2goKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5ub2RlLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX1NUQVJULCB0aGlzLl9jb2Nvc1RvdWNoSGFuZGxlciwgdGhpcyk7XG4gICAgICAgIFxuICAgICAgICAvLyBXZWIg5rWP6KeI5Zmo5bGC6Z2i55qE55uR5ZCsXG4gICAgICAgIGlmIChjYy5zeXMuaXNCcm93c2VyKSB7XG4gICAgICAgICAgICB0aGlzLl9icm93c2VyVG91Y2hIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fcGxheU11c2ljT25Ub3VjaCgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX2Jyb3dzZXJUb3VjaEhhbmRsZXIsIHRydWUpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fYnJvd3NlclRvdWNoSGFuZGxlciwgdHJ1ZSk7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX2Jyb3dzZXJUb3VjaEhhbmRsZXIsIHRydWUpO1xuICAgICAgICAgICAgXG4gICAgICAgIH1cbiAgICB9LFxuICAgIFxuICAgIC8vIOenu+mZpOWFqOWxgOinpuaRuOebkeWQrFxuICAgIF9yZW1vdmVHbG9iYWxUb3VjaEZvck11c2ljOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8g56e76ZmkIENvY29zIENyZWF0b3Ig5bGC6Z2i55qE55uR5ZCsXG4gICAgICAgIGlmICh0aGlzLl9jb2Nvc1RvdWNoSGFuZGxlcikge1xuICAgICAgICAgICAgdGhpcy5ub2RlLm9mZihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9TVEFSVCwgdGhpcy5fY29jb3NUb3VjaEhhbmRsZXIsIHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5fY29jb3NUb3VjaEhhbmRsZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyDnp7vpmaTmtY/op4jlmajlsYLpnaLnmoTnm5HlkKxcbiAgICAgICAgaWYgKGNjLnN5cy5pc0Jyb3dzZXIgJiYgdGhpcy5fYnJvd3NlclRvdWNoSGFuZGxlcikge1xuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuX2Jyb3dzZXJUb3VjaEhhbmRsZXIsIHRydWUpO1xuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fYnJvd3NlclRvdWNoSGFuZGxlciwgdHJ1ZSk7XG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuX2Jyb3dzZXJUb3VjaEhhbmRsZXIsIHRydWUpO1xuICAgICAgICAgICAgdGhpcy5fYnJvd3NlclRvdWNoSGFuZGxlciA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuX3RvdWNoTGlzdGVuZXJBZGRlZCA9IGZhbHNlO1xuICAgIH0sXG5cbiAgICBfc2hvd0Vycm9yOiBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgIHRoaXMuX3Nob3dXYWl0Tm9kZShtZXNzYWdlKTtcbiAgICAgICAgdGhpcy5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl9oaWRlV2FpdE5vZGUoKTtcbiAgICAgICAgfSwgMik7XG4gICAgfSxcblxuICAgIF9zaG93TG9hZGluZzogZnVuY3Rpb24oc2hvdywgbWVzc2FnZSkge1xuICAgICAgICBpZiAoc2hvdykge1xuICAgICAgICAgICAgdGhpcy5fc2hvd1dhaXROb2RlKG1lc3NhZ2UgfHwgXCLmraPlnKjlpITnkIYuLi5cIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9oaWRlV2FpdE5vZGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfc2hvd1dhaXROb2RlOiBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgIGlmICh0aGlzLndhaXRfbm9kZSkge1xuICAgICAgICAgICAgdGhpcy53YWl0X25vZGUuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICh0aGlzLl93YWl0TGFiZWwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93YWl0TGFiZWwuc3RyaW5nID0gbWVzc2FnZSB8fCBcIuato+WcqOWkhOeQhi4uLlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX2xvYWRpbmdJbWFnZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2lzQW5pbWF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfaGlkZVdhaXROb2RlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMud2FpdF9ub2RlKSB7XG4gICAgICAgICAgICB0aGlzLndhaXRfbm9kZS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX2lzQW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g57uY5Yi25ZyG6KeS55+p5b2i6L6T5YWl5qGG6IOM5pmv77yI6L6F5Yqp5pa55rOV77yJXG4gICAgLy8g5rOo5oSP77yaQ29jb3MgQ3JlYXRvciBHcmFwaGljcyDnu4Tku7bmsqHmnIkgYXJjVG8g5pa55rOV77yM5L2/55SoIHJvdW5kUmVjdCDku6Pmm79cbiAgICBfZHJhd0lucHV0Qmc6IGZ1bmN0aW9uKGdyYXBoaWNzLCB3aWR0aCwgaGVpZ2h0LCByYWRpdXMpIHtcbiAgICAgICAgdmFyIHggPSAtd2lkdGggLyAyO1xuICAgICAgICB2YXIgeSA9IC1oZWlnaHQgLyAyO1xuICAgICAgICAvLyDkvb/nlKggQ29jb3MgQ3JlYXRvciBHcmFwaGljcyDnmoQgcm91bmRSZWN0IOaWueazlVxuICAgICAgICBncmFwaGljcy5yb3VuZFJlY3QoeCwgeSwgd2lkdGgsIGhlaWdodCwgcmFkaXVzKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlOiBmdW5jdGlvbihkdCkge1xuICAgICAgICBpZiAodGhpcy5faXNBbmltYXRpbmcgJiYgdGhpcy5fbG9hZGluZ0ltYWdlKSB7XG4gICAgICAgICAgICAvLyDkvb/nlKggYW5nbGUg5pu/5Luj5bey5bqf5byD55qEIHJvdGF0aW9uIOWxnuaAp1xuICAgICAgICAgICAgdGhpcy5fbG9hZGluZ0ltYWdlLmFuZ2xlICs9IGR0ICogNDU7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2RvV3hMb2dpbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBpZiAoIXRoaXMuX2NoZWNrQWdyZWVtZW50KCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dFcnJvcihcIuivt+WFiOWQjOaEj+eUqOaIt+WNj+iurlwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBteWdsb2JhbCA9IHdpbmRvdy5teWdsb2JhbDtcbiAgICAgICAgaWYgKCFteWdsb2JhbCB8fCAhbXlnbG9iYWwuc29ja2V0KSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93RXJyb3IoXCLnvZHnu5zmnKrov57mjqXvvIzor7fnqI3lkI7ph43or5VcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zaG93TG9hZGluZyh0cnVlLCBcIuato+WcqOeZu+W9lS4uLlwiKTtcblxuICAgICAgICBteWdsb2JhbC5zb2NrZXQucmVxdWVzdF93eExvZ2luKHtcbiAgICAgICAgICAgIHVuaXF1ZUlEOiBteWdsb2JhbC5wbGF5ZXJEYXRhLnVuaXF1ZUlELFxuICAgICAgICAgICAgYWNjb3VudElEOiBteWdsb2JhbC5wbGF5ZXJEYXRhLmFjY291bnRJRCxcbiAgICAgICAgICAgIG5pY2tOYW1lOiBteWdsb2JhbC5wbGF5ZXJEYXRhLm5pY2tOYW1lLFxuICAgICAgICAgICAgYXZhdGFyVXJsOiBteWdsb2JhbC5wbGF5ZXJEYXRhLmF2YXRhclVybCxcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyLCByZXN1bHQpIHtcbiAgICAgICAgICAgIHNlbGYuX3Nob3dMb2FkaW5nKGZhbHNlKTtcblxuICAgICAgICAgICAgaWYgKGVyciAhPSAwKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fc2hvd0Vycm9yKFwi55m75b2V5aSx6LSl77yM6K+36YeN6K+VXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbXlnbG9iYWwucGxheWVyRGF0YS5nb2JhbF9jb3VudCA9IHJlc3VsdC5nb2xkY291bnQgfHwgMDtcbiAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZShcImhhbGxTY2VuZVwiKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9kb1Bob25lTG9naW46IGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcIj4+PiBfZG9QaG9uZUxvZ2luIOiiq+iwg+eUqFwiKTtcblxuICAgICAgICAvLyDwn5SnIOS/ruWkje+8mumYsuatoumHjeWkjeeCueWHu+WvvOiHtOWkmuS4quW8ueeql1xuICAgICAgICBpZiAodGhpcy5fcGhvbmVMb2dpblBvcHVwU2hvd2luZykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCI+Pj4g55m75b2V5by556qX5q2j5Zyo5pi+56S65Lit77yM5b+955Wl6YeN5aSN6LCD55SoXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLl9jaGVja0FncmVlbWVudCgpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIj4+PiDnlKjmiLfmnKrlkIzmhI/ljY/orq5cIik7XG4gICAgICAgICAgICB0aGlzLl9zaG93RXJyb3IoXCLor7flhYjlkIzmhI/nlKjmiLfljY/orq5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyDorr7nva7moIflv5fkvY3vvIzpmLLmraLph43lpI3lvLnnqpdcbiAgICAgICAgdGhpcy5fcGhvbmVMb2dpblBvcHVwU2hvd2luZyA9IHRydWU7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCI+Pj4g5YeG5aSH5pi+56S65omL5py655m75b2V5by556qXXCIpO1xuICAgICAgICB0aGlzLl9zaG93UGhvbmVMb2dpblBvcHVwKCk7XG4gICAgfSxcblxuICAgIF9zaG93UGhvbmVMb2dpblBvcHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCI+Pj4gX3Nob3dQaG9uZUxvZ2luUG9wdXAg6KKr6LCD55SoXCIpO1xuICAgICAgICB0aGlzLl9jcmVhdGVQaG9uZUxvZ2luUG9wdXAoKTtcbiAgICB9LFxuXG4gICAgX2NyZWF0ZVBob25lTG9naW5Qb3B1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IF9jcmVhdGVQaG9uZUxvZ2luUG9wdXAg6KKr6LCD55SoXCIpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHBvcHVwID0gdGhpcy5fY3JlYXRlUGhvbmVMb2dpbkR5bmFtaWMoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiPj4+IOeZu+W9leW8ueeql+aYvuekuuWujOaIkDpcIiwgcG9wdXAgPyBwb3B1cC5uYW1lIDogXCJudWxsXCIpO1xuICAgICAgICAgICAgdGhpcy5fcGhvbmVMb2dpblBvcHVwID0gcG9wdXA7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCLmmL7npLrmiYvmnLrnmbvlvZXlvLnnqpflpLHotKU6XCIsIGUpO1xuICAgICAgICAgICAgdGhpcy5fc2hvd0Vycm9yKFwi5peg5rOV5pi+56S655m75b2V5by556qXOiBcIiArIGUubWVzc2FnZSk7XG4gICAgICAgICAgICB0aGlzLl9waG9uZUxvZ2luUG9wdXBTaG93aW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLy8g5Yid5aeL5YyW5Zy65pmv5Lit6aKE572u55qEIGxvZ2luIOW8ueeql+iKgueCueS4juS6i+S7tu+8iOS7heaJp+ihjOS4gOasoe+8iVxuICAgIF9pbml0UGhvbmVMb2dpblBvcHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgcG9wdXAgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoXCJsb2dpblwiKTtcbiAgICAgICAgaWYgKCFwb3B1cCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImxvZ2luIOW8ueeql+iKgueCueacquaJvuWIsO+8jOivt+WcqCBsb2dpblNjZW5lIOS4reWIm+W7uiBsb2dpbiDoioLngrlcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwb3B1cC5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgaWYgKCFwb3B1cC5nZXRDb21wb25lbnQoY2MuQmxvY2tJbnB1dEV2ZW50cykpIHtcbiAgICAgICAgICAgIHBvcHVwLmFkZENvbXBvbmVudChjYy5CbG9ja0lucHV0RXZlbnRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwYW5lbCA9IHBvcHVwLmdldENoaWxkQnlOYW1lKFwibG9naW5fYmdcIikgfHwgcG9wdXA7XG4gICAgICAgIHZhciBjbG9zZUJ0biA9IHBvcHVwLmdldENoaWxkQnlOYW1lKFwiY2xvc2VCdG5cIik7XG4gICAgICAgIHZhciBwaG9uZUlucHV0Tm9kZSA9IHBvcHVwLmdldENoaWxkQnlOYW1lKFwibG9naW5fcGhvbmVcIik7XG4gICAgICAgIHZhciBjb2RlSW5wdXROb2RlID0gcG9wdXAuZ2V0Q2hpbGRCeU5hbWUoXCJsb2dpbl9jb2RlXCIpO1xuICAgICAgICB2YXIgZ2V0Q29kZUJ0biA9IHBvcHVwLmdldENoaWxkQnlOYW1lKFwiZ2V0X21vYmlsZV9jb2RlXCIpO1xuICAgICAgICB2YXIgbG9naW5CdG4gPSBwb3B1cC5nZXRDaGlsZEJ5TmFtZShcImJ0bl9tb2JpbGVfbG9naW5cIik7XG4gICAgICAgIHZhciB3eEJ0biA9IHBvcHVwLmdldENoaWxkQnlOYW1lKFwiaWNvbl93eFwiKTtcbiAgICAgICAgdmFyIHRpcE5vZGUgPSBwb3B1cC5nZXRDaGlsZEJ5TmFtZShcInRpcFwiKTtcblxuICAgICAgICB2YXIgcGhvbmVFZGl0Qm94ID0gcGhvbmVJbnB1dE5vZGUgPyBwaG9uZUlucHV0Tm9kZS5nZXRDb21wb25lbnQoY2MuRWRpdEJveCkgOiBudWxsO1xuICAgICAgICB2YXIgY29kZUVkaXRCb3ggPSBjb2RlSW5wdXROb2RlID8gY29kZUlucHV0Tm9kZS5nZXRDb21wb25lbnQoY2MuRWRpdEJveCkgOiBudWxsO1xuICAgICAgICBpZiAocGhvbmVFZGl0Qm94KSB7XG4gICAgICAgICAgICBwaG9uZUVkaXRCb3gubWF4TGVuZ3RoID0gMTE7XG4gICAgICAgICAgICBwaG9uZUVkaXRCb3guaW5wdXRNb2RlID0gY2MuRWRpdEJveC5JbnB1dE1vZGUuUEhPTkVfTlVNQkVSO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2RlRWRpdEJveCkge1xuICAgICAgICAgICAgY29kZUVkaXRCb3gubWF4TGVuZ3RoID0gNjtcbiAgICAgICAgICAgIGNvZGVFZGl0Qm94LmlucHV0TW9kZSA9IGNjLkVkaXRCb3guSW5wdXRNb2RlLk5VTUVSSUM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZ2V0Q29kZUJ0bkNvbXAgPSBnZXRDb2RlQnRuID8gZ2V0Q29kZUJ0bi5nZXRDb21wb25lbnQoY2MuQnV0dG9uKSA6IG51bGw7XG4gICAgICAgIHZhciBidG5MYWJlbE5vZGUgPSBnZXRDb2RlQnRuID8gZ2V0Q29kZUJ0bi5nZXRDaGlsZEJ5TmFtZShcImJ0bmxhYmVsXCIpIDogbnVsbDtcbiAgICAgICAgdmFyIGNvdW50ZG93bkxhYmVsTm9kZSA9IGdldENvZGVCdG4gPyBnZXRDb2RlQnRuLmdldENoaWxkQnlOYW1lKFwiY291bnRkb3dubGFiZWxcIikgOiBudWxsO1xuICAgICAgICB2YXIgYnRuTGFiZWxDb21wID0gYnRuTGFiZWxOb2RlID8gYnRuTGFiZWxOb2RlLmdldENvbXBvbmVudChjYy5MYWJlbCkgOiBudWxsO1xuICAgICAgICB2YXIgY291bnRkb3duTGFiZWxDb21wID0gY291bnRkb3duTGFiZWxOb2RlID8gY291bnRkb3duTGFiZWxOb2RlLmdldENvbXBvbmVudChjYy5MYWJlbCkgOiBudWxsO1xuICAgICAgICB2YXIgdGlwTGFiZWxDb21wID0gdGlwTm9kZSA/IHRpcE5vZGUuZ2V0Q29tcG9uZW50KGNjLkxhYmVsKSA6IG51bGw7XG5cbiAgICAgICAgaWYgKGNvdW50ZG93bkxhYmVsTm9kZSkge1xuICAgICAgICAgICAgY291bnRkb3duTGFiZWxOb2RlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aXBOb2RlKSB7XG4gICAgICAgICAgICB0aXBOb2RlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcGhvbmVMb2dpblVJID0ge1xuICAgICAgICAgICAgcG9wdXA6IHBvcHVwLFxuICAgICAgICAgICAgcGFuZWw6IHBhbmVsLFxuICAgICAgICAgICAgY2xvc2VCdG46IGNsb3NlQnRuLFxuICAgICAgICAgICAgcGhvbmVJbnB1dE5vZGU6IHBob25lSW5wdXROb2RlLFxuICAgICAgICAgICAgY29kZUlucHV0Tm9kZTogY29kZUlucHV0Tm9kZSxcbiAgICAgICAgICAgIHBob25lRWRpdEJveDogcGhvbmVFZGl0Qm94LFxuICAgICAgICAgICAgY29kZUVkaXRCb3g6IGNvZGVFZGl0Qm94LFxuICAgICAgICAgICAgZ2V0Q29kZUJ0bjogZ2V0Q29kZUJ0bixcbiAgICAgICAgICAgIGdldENvZGVCdG5Db21wOiBnZXRDb2RlQnRuQ29tcCxcbiAgICAgICAgICAgIGxvZ2luQnRuOiBsb2dpbkJ0bixcbiAgICAgICAgICAgIHd4QnRuOiB3eEJ0bixcbiAgICAgICAgICAgIHRpcE5vZGU6IHRpcE5vZGUsXG4gICAgICAgICAgICB0aXBMYWJlbENvbXA6IHRpcExhYmVsQ29tcCxcbiAgICAgICAgICAgIGJ0bkxhYmVsTm9kZTogYnRuTGFiZWxOb2RlLFxuICAgICAgICAgICAgYnRuTGFiZWxDb21wOiBidG5MYWJlbENvbXAsXG4gICAgICAgICAgICBjb3VudGRvd25MYWJlbE5vZGU6IGNvdW50ZG93bkxhYmVsTm9kZSxcbiAgICAgICAgICAgIGNvdW50ZG93bkxhYmVsQ29tcDogY291bnRkb3duTGFiZWxDb21wLFxuICAgICAgICAgICAgY291bnRkb3duOiAwXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGNsb3NlQnRuKSB7XG4gICAgICAgICAgICBjbG9zZUJ0bi5vZmYoY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5EKTtcbiAgICAgICAgICAgIGNsb3NlQnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fY2xvc2VQaG9uZUxvZ2luUG9wdXAoKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGdldENvZGVCdG4pIHtcbiAgICAgICAgICAgIGdldENvZGVCdG4ub2ZmKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCk7XG4gICAgICAgICAgICBnZXRDb2RlQnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fb25QaG9uZUxvZ2luR2V0Q29kZSgpO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobG9naW5CdG4pIHtcbiAgICAgICAgICAgIGxvZ2luQnRuLm9mZihjYy5Ob2RlLkV2ZW50VHlwZS5UT1VDSF9FTkQpO1xuICAgICAgICAgICAgbG9naW5CdG4ub24oY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5ELCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9vblBob25lTG9naW5TdWJtaXQoKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHd4QnRuKSB7XG4gICAgICAgICAgICB3eEJ0bi5vZmYoY2MuTm9kZS5FdmVudFR5cGUuVE9VQ0hfRU5EKTtcbiAgICAgICAgICAgIHd4QnRuLm9uKGNjLk5vZGUuRXZlbnRUeXBlLlRPVUNIX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fb25QaG9uZUxvZ2luV3goKTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9nZXRQaG9uZUxvZ2luSW5wdXRWYWx1ZTogZnVuY3Rpb24oaW5wdXRJZCwgZWRpdEJveCkge1xuICAgICAgICBpZiAoY2Muc3lzLmlzQnJvd3Nlcikge1xuICAgICAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaW5wdXRJZCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQgPyBpbnB1dC52YWx1ZSA6IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVkaXRCb3ggPyAoZWRpdEJveC5zdHJpbmcgfHwgXCJcIikgOiBcIlwiO1xuICAgIH0sXG5cbiAgICBfdmFsaWRhdGVQaG9uZUxvZ2luUGhvbmU6IGZ1bmN0aW9uKHBob25lKSB7XG4gICAgICAgIGlmICghcGhvbmUgfHwgcGhvbmUubGVuZ3RoICE9PSAxMSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICByZXR1cm4gL14xWzMtOV1cXGR7OX0kLy50ZXN0KHBob25lKTtcbiAgICB9LFxuXG4gICAgX3Nob3dQaG9uZUxvZ2luVGlwOiBmdW5jdGlvbihtc2csIGlzRXJyb3IpIHtcbiAgICAgICAgdmFyIHVpID0gdGhpcy5fcGhvbmVMb2dpblVJO1xuICAgICAgICBpZiAoIXVpIHx8ICF1aS50aXBOb2RlIHx8ICF1aS50aXBMYWJlbENvbXApIHJldHVybjtcbiAgICAgICAgdWkudGlwTm9kZS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICB1aS50aXBMYWJlbENvbXAuc3RyaW5nID0gbXNnO1xuICAgICAgICB1aS50aXBOb2RlLmNvbG9yID0gaXNFcnJvciA/IG5ldyBjYy5Db2xvcigyNTUsIDgwLCA4MCkgOiBuZXcgY2MuQ29sb3IoMTAwLCAyMDAsIDEwMCk7XG4gICAgfSxcblxuICAgIF9yZXNldFBob25lTG9naW5Db3VudGRvd25VSTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB1aSA9IHRoaXMuX3Bob25lTG9naW5VSTtcbiAgICAgICAgaWYgKCF1aSkgcmV0dXJuO1xuICAgICAgICB1aS5jb3VudGRvd24gPSAwO1xuICAgICAgICBpZiAodWkuZ2V0Q29kZUJ0bkNvbXApIHVpLmdldENvZGVCdG5Db21wLmludGVyYWN0YWJsZSA9IHRydWU7XG4gICAgICAgIGlmICh1aS5nZXRDb2RlQnRuKSB1aS5nZXRDb2RlQnRuLm9wYWNpdHkgPSAyNTU7XG4gICAgICAgIGlmICh1aS5idG5MYWJlbE5vZGUpIHVpLmJ0bkxhYmVsTm9kZS5hY3RpdmUgPSB0cnVlO1xuICAgICAgICBpZiAodWkuY291bnRkb3duTGFiZWxOb2RlKSB7XG4gICAgICAgICAgICB1aS5jb3VudGRvd25MYWJlbE5vZGUuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAodWkuY291bnRkb3duTGFiZWxDb21wKSB1aS5jb3VudGRvd25MYWJlbENvbXAuc3RyaW5nID0gXCJcIjtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfc3RhcnRQaG9uZUxvZ2luQ291bnRkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgdWkgPSB0aGlzLl9waG9uZUxvZ2luVUk7XG4gICAgICAgIGlmICghdWkpIHJldHVybjtcblxuICAgICAgICB1aS5jb3VudGRvd24gPSA2MDtcbiAgICAgICAgaWYgKHVpLmdldENvZGVCdG5Db21wKSB1aS5nZXRDb2RlQnRuQ29tcC5pbnRlcmFjdGFibGUgPSBmYWxzZTtcbiAgICAgICAgaWYgKHVpLmdldENvZGVCdG4pIHVpLmdldENvZGVCdG4ub3BhY2l0eSA9IDE1MDtcbiAgICAgICAgaWYgKHVpLmJ0bkxhYmVsTm9kZSkgdWkuYnRuTGFiZWxOb2RlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICBpZiAodWkuY291bnRkb3duTGFiZWxOb2RlKSB1aS5jb3VudGRvd25MYWJlbE5vZGUuYWN0aXZlID0gdHJ1ZTtcblxuICAgICAgICB2YXIgdGljayA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCFzZWxmLl9waG9uZUxvZ2luVUkgfHwgIWNjLmlzVmFsaWQoc2VsZi5fcGhvbmVMb2dpblVJLnBvcHVwKSkgcmV0dXJuO1xuICAgICAgICAgICAgdmFyIGN1ciA9IHNlbGYuX3Bob25lTG9naW5VSTtcbiAgICAgICAgICAgIGN1ci5jb3VudGRvd24tLTtcbiAgICAgICAgICAgIGlmIChjdXIuY291bnRkb3duIDw9IDApIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9yZXNldFBob25lTG9naW5Db3VudGRvd25VSSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoY3VyLmNvdW50ZG93bkxhYmVsQ29tcCkge1xuICAgICAgICAgICAgICAgICAgICBjdXIuY291bnRkb3duTGFiZWxDb21wLnN0cmluZyA9IGN1ci5jb3VudGRvd24gKyBcInNcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi5zY2hlZHVsZU9uY2UodGljaywgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGlmICh1aS5jb3VudGRvd25MYWJlbENvbXApIHtcbiAgICAgICAgICAgIHVpLmNvdW50ZG93bkxhYmVsQ29tcC5zdHJpbmcgPSB1aS5jb3VudGRvd24gKyBcInNcIjtcbiAgICAgICAgfVxuICAgICAgICBzZWxmLnNjaGVkdWxlT25jZSh0aWNrLCAxKTtcbiAgICB9LFxuXG4gICAgX2Nsb3NlUGhvbmVMb2dpblBvcHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgdWkgPSB0aGlzLl9waG9uZUxvZ2luVUk7XG4gICAgICAgIGlmICghdWkgfHwgIXVpLnBvcHVwIHx8ICFjYy5pc1ZhbGlkKHVpLnBvcHVwKSkge1xuICAgICAgICAgICAgdGhpcy5fcGhvbmVMb2dpblBvcHVwU2hvd2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcGhvbmVMb2dpblBvcHVwU2hvd2luZyA9IGZhbHNlO1xuICAgICAgICBfcmVtb3ZlTmF0aXZlSW5wdXRFbGVtZW50cygpO1xuXG4gICAgICAgIHZhciBwYW5lbCA9IHVpLnBhbmVsO1xuICAgICAgICB2YXIgcG9wdXAgPSB1aS5wb3B1cDtcbiAgICAgICAgaWYgKHVpLnBob25lRWRpdEJveCkge1xuICAgICAgICAgICAgdWkucGhvbmVFZGl0Qm94LnN0cmluZyA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVpLmNvZGVFZGl0Qm94KSB7XG4gICAgICAgICAgICB1aS5jb2RlRWRpdEJveC5zdHJpbmcgPSBcIlwiO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1aS50aXBOb2RlKSB7XG4gICAgICAgICAgICB1aS50aXBOb2RlLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Jlc2V0UGhvbmVMb2dpbkNvdW50ZG93blVJKCk7XG5cbiAgICAgICAgY2MudHdlZW4ocGFuZWwpXG4gICAgICAgICAgICAudG8oMC4xNSwgeyBzY2FsZTogMC44LCBvcGFjaXR5OiAwIH0sIHsgZWFzaW5nOiAnYmFja0luJyB9KVxuICAgICAgICAgICAgLmNhbGwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNjLmlzVmFsaWQocG9wdXApKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvcHVwLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBwYW5lbC5zY2FsZSA9IDE7XG4gICAgICAgICAgICAgICAgICAgIHBhbmVsLm9wYWNpdHkgPSAyNTU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGFydCgpO1xuICAgIH0sXG5cbiAgICBfb25QaG9uZUxvZ2luR2V0Q29kZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHVpID0gdGhpcy5fcGhvbmVMb2dpblVJO1xuICAgICAgICBpZiAoIXVpIHx8IHVpLmNvdW50ZG93biA+IDApIHJldHVybjtcblxuICAgICAgICB2YXIgcGhvbmUgPSB0aGlzLl9nZXRQaG9uZUxvZ2luSW5wdXRWYWx1ZSgnbmF0aXZlLXBob25lLWlucHV0JywgdWkucGhvbmVFZGl0Qm94KTtcbiAgICAgICAgaWYgKCF0aGlzLl92YWxpZGF0ZVBob25lTG9naW5QaG9uZShwaG9uZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dQaG9uZUxvZ2luVGlwKFwi6K+36L6T5YWl5q2j56Gu55qE5omL5py65Y+3XCIsIHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGRlZmluZXMgPSB3aW5kb3cuZGVmaW5lcztcbiAgICAgICAgaWYgKCFkZWZpbmVzIHx8ICFkZWZpbmVzLmFwaVVybCkge1xuICAgICAgICAgICAgdGhpcy5fc2hvd1Bob25lTG9naW5UaXAoXCLpqozor4HnoIHlt7Llj5HpgIEo5rWL6K+VKVwiLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLl9zdGFydFBob25lTG9naW5Db3VudGRvd24oKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBIdHRwQVBJID0gd2luZG93Lkh0dHBBUEk7XG4gICAgICAgIGlmIChIdHRwQVBJICYmIGRlZmluZXMuY3J5cHRvS2V5KSB7XG4gICAgICAgICAgICBIdHRwQVBJLnBvc3RFbmNyeXB0ZWQoXG4gICAgICAgICAgICAgICAgZGVmaW5lcy5hcGlVcmwgKyAnL2FwaS92MS9hdXRoL3NlbmQtY29kZScsXG4gICAgICAgICAgICAgICAgJ3NlbmRfY29kZScsXG4gICAgICAgICAgICAgICAgeyBwaG9uZTogcGhvbmUgfSxcbiAgICAgICAgICAgICAgICBkZWZpbmVzLmNyeXB0b0tleSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihlcnIsIHJlc3ApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd1Bob25lTG9naW5UaXAoZXJyIHx8IFwi5Y+R6YCB5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwICYmIHJlc3AuY29kZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd1Bob25lTG9naW5UaXAoXCLpqozor4HnoIHlt7Llj5HpgIFcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fc3RhcnRQaG9uZUxvZ2luQ291bnRkb3duKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93UGhvbmVMb2dpblRpcChyZXNwLm1lc3NhZ2UgfHwgXCLlj5HpgIHlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICAgeGhyLm9wZW4oJ1BPU1QnLCBkZWZpbmVzLmFwaVVybCArICcvYXBpL3YxL2F1dGgvc2VuZC1jb2RlJywgdHJ1ZSk7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHhoci50aW1lb3V0ID0gMTAwMDA7XG4gICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcC5jb2RlID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dQaG9uZUxvZ2luVGlwKFwi6aqM6K+B56CB5bey5Y+R6YCBXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fc3RhcnRQaG9uZUxvZ2luQ291bnRkb3duKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd1Bob25lTG9naW5UaXAocmVzcC5tZXNzYWdlIHx8IFwi5Y+R6YCB5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93UGhvbmVMb2dpblRpcChcIuino+aekOWTjeW6lOWksei0pVwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dQaG9uZUxvZ2luVGlwKFwi572R57uc6K+35rGC5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KHsgcGhvbmU6IHBob25lIH0pKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfb25QaG9uZUxvZ2luU3VibWl0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgdWkgPSB0aGlzLl9waG9uZUxvZ2luVUk7XG4gICAgICAgIGlmICghdWkpIHJldHVybjtcblxuICAgICAgICB2YXIgcGhvbmUgPSB0aGlzLl9nZXRQaG9uZUxvZ2luSW5wdXRWYWx1ZSgnbmF0aXZlLXBob25lLWlucHV0JywgdWkucGhvbmVFZGl0Qm94KTtcbiAgICAgICAgdmFyIGNvZGUgPSB0aGlzLl9nZXRQaG9uZUxvZ2luSW5wdXRWYWx1ZSgnbmF0aXZlLWNvZGUtaW5wdXQnLCB1aS5jb2RlRWRpdEJveCk7XG5cbiAgICAgICAgaWYgKCF0aGlzLl92YWxpZGF0ZVBob25lTG9naW5QaG9uZShwaG9uZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dQaG9uZUxvZ2luVGlwKFwi6K+36L6T5YWl5q2j56Gu55qE5omL5py65Y+3XCIsIHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc2hvd1Bob25lTG9naW5UaXAoXCLmraPlnKjnmbvlvZUuLi5cIiwgZmFsc2UpO1xuXG4gICAgICAgIHZhciBkZWZpbmVzID0gd2luZG93LmRlZmluZXM7XG4gICAgICAgIGlmICghZGVmaW5lcyB8fCAhZGVmaW5lcy5hcGlVcmwpIHtcbiAgICAgICAgICAgIGlmICh3aW5kb3cubXlnbG9iYWwpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwub25Mb2dpblN1Y2Nlc3Moe1xuICAgICAgICAgICAgICAgICAgICB1bmlxdWVJRDogXCJwaG9uZV9cIiArIHBob25lLFxuICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IFwicGhvbmVfXCIgKyBwaG9uZSxcbiAgICAgICAgICAgICAgICAgICAgbmlja05hbWU6IFwi546p5a62XCIgKyBwaG9uZS5zdWJzdHIoLTQpLFxuICAgICAgICAgICAgICAgICAgICBhdmF0YXJVcmw6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGdvbGRDb3VudDogMTAwMCxcbiAgICAgICAgICAgICAgICAgICAgdG9rZW46IFwidGVzdF90b2tlbl9cIiArIERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgIHBob25lOiBwaG9uZSxcbiAgICAgICAgICAgICAgICAgICAgbG9naW5UeXBlOiAxXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9zaG93UGhvbmVMb2dpblRpcChcIueZu+W9leaIkOWKn1wiLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBfcmVtb3ZlTmF0aXZlSW5wdXRFbGVtZW50cygpO1xuICAgICAgICAgICAgICAgIGlmIChjYy5pc1ZhbGlkKHVpLnBvcHVwKSkge1xuICAgICAgICAgICAgICAgICAgICB1aS5wb3B1cC5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi5fcGhvbmVMb2dpblBvcHVwU2hvd2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZShcImhhbGxTY2VuZVwiKTtcbiAgICAgICAgICAgIH0sIDAuNSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgSHR0cEFQSSA9IHdpbmRvdy5IdHRwQVBJO1xuICAgICAgICBpZiAoSHR0cEFQSSAmJiBkZWZpbmVzLmNyeXB0b0tleSkge1xuICAgICAgICAgICAgSHR0cEFQSS5wb3N0RW5jcnlwdGVkKFxuICAgICAgICAgICAgICAgIGRlZmluZXMuYXBpVXJsICsgJy9hcGkvdjEvYXV0aC9waG9uZS1sb2dpbicsXG4gICAgICAgICAgICAgICAgJ3Bob25lX2xvZ2luJyxcbiAgICAgICAgICAgICAgICB7IHBob25lOiBwaG9uZSwgY29kZTogY29kZSB9LFxuICAgICAgICAgICAgICAgIGRlZmluZXMuY3J5cHRvS2V5LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGVyciwgcmVzcCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93UGhvbmVMb2dpblRpcChlcnIgfHwgXCLnmbvlvZXlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3AgJiYgcmVzcC5jb2RlID09PSAwICYmIHJlc3AuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd1Bob25lTG9naW5UaXAoXCLnmbvlvZXmiJDlip9cIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5teWdsb2JhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5vbkxvZ2luU3VjY2Vzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXF1ZUlEOiByZXNwLmRhdGEudW5pcXVlSUQgfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiByZXNwLmRhdGEuYWNjb3VudElEIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5pY2tOYW1lOiByZXNwLmRhdGEubmlja05hbWUgfHwgXCLnjqnlrrZcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXZhdGFyVXJsOiByZXNwLmRhdGEuYXZhdGFyVXJsIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvbGRDb3VudDogcmVzcC5kYXRhLmdvbGRjb3VudCB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b2tlbjogcmVzcC5kYXRhLnRva2VuIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBob25lOiBwaG9uZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9naW5UeXBlOiAxXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfcmVtb3ZlTmF0aXZlSW5wdXRFbGVtZW50cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYy5pc1ZhbGlkKHVpLnBvcHVwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1aS5wb3B1cC5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fcGhvbmVMb2dpblBvcHVwU2hvd2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZShcImhhbGxTY2VuZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDAuNSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93UGhvbmVMb2dpblRpcChyZXNwLm1lc3NhZ2UgfHwgXCLnmbvlvZXlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICAgeGhyLm9wZW4oJ1BPU1QnLCBkZWZpbmVzLmFwaVVybCArICcvYXBpL3YxL2F1dGgvcGhvbmUtbG9naW4nLCB0cnVlKTtcbiAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ1gtRGV2aWNlLUlEJywgJ3dlYl8nICsgRGF0ZS5ub3coKSk7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignWC1EZXZpY2UtVHlwZScsICdXZWIgQnJvd3NlcicpO1xuICAgICAgICAgICAgeGhyLnRpbWVvdXQgPSAxMDAwMDtcbiAgICAgICAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3AgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwLmNvZGUgPT09IDAgJiYgcmVzcC5kYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dQaG9uZUxvZ2luVGlwKFwi55m75b2V5oiQ5YqfXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5teWdsb2JhbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLm9uTG9naW5TdWNjZXNzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmlxdWVJRDogcmVzcC5kYXRhLnVuaXF1ZUlEIHx8IHJlc3AuZGF0YS5wbGF5ZXJfaWQgfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHJlc3AuZGF0YS5hY2NvdW50SUQgfHwgcmVzcC5kYXRhLmFjY291bnRfaWQgfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuaWNrTmFtZTogcmVzcC5kYXRhLm5pY2tOYW1lIHx8IHJlc3AuZGF0YS5uaWNrbmFtZSB8fCBcIueOqeWutlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF2YXRhclVybDogcmVzcC5kYXRhLmF2YXRhclVybCB8fCByZXNwLmRhdGEuYXZhdGFyIHx8IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29sZENvdW50OiByZXNwLmRhdGEuZ29sZGNvdW50IHx8IHJlc3AuZGF0YS5nb2xkIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW46IHJlc3AuZGF0YS50b2tlbiB8fCBcIlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBob25lOiBwaG9uZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dpblR5cGU6IDFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2NoZWR1bGVPbmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX3JlbW92ZU5hdGl2ZUlucHV0RWxlbWVudHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYy5pc1ZhbGlkKHVpLnBvcHVwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVpLnBvcHVwLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fcGhvbmVMb2dpblBvcHVwU2hvd2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2MuZGlyZWN0b3IubG9hZFNjZW5lKFwiaGFsbFNjZW5lXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwLjUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dQaG9uZUxvZ2luVGlwKHJlc3AubWVzc2FnZSB8fCBcIueZu+W9leWksei0pVwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd1Bob25lTG9naW5UaXAoXCLop6PmnpDlk43lupTlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93UGhvbmVMb2dpblRpcChcIue9kee7nOivt+axguWksei0pVwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB4aHIuc2VuZChKU09OLnN0cmluZ2lmeSh7IHBob25lOiBwaG9uZSwgY29kZTogY29kZSB9KSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX29uUGhvbmVMb2dpbld4OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgdWkgPSB0aGlzLl9waG9uZUxvZ2luVUk7XG4gICAgICAgIGlmICghdWkpIHJldHVybjtcblxuICAgICAgICB0aGlzLl9zaG93UGhvbmVMb2dpblRpcChcIuato+WcqOeZu+W9lS4uLlwiLCBmYWxzZSk7XG5cbiAgICAgICAgdmFyIGRlZmluZXMgPSB3aW5kb3cuZGVmaW5lcztcbiAgICAgICAgaWYgKCFkZWZpbmVzIHx8ICFkZWZpbmVzLmFwaVVybCkge1xuICAgICAgICAgICAgaWYgKHdpbmRvdy5teWdsb2JhbCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5vbkxvZ2luU3VjY2Vzcyh7XG4gICAgICAgICAgICAgICAgICAgIHVuaXF1ZUlEOiBcInd4X1wiICsgRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBcInd4X1wiICsgRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgbmlja05hbWU6IFwi5b6u5L+h55So5oi3XCIsXG4gICAgICAgICAgICAgICAgICAgIGF2YXRhclVybDogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZ29sZENvdW50OiAxMDAwLFxuICAgICAgICAgICAgICAgICAgICB0b2tlbjogXCJ0ZXN0X3d4X3Rva2VuX1wiICsgRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgbG9naW5UeXBlOiAyXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9zaG93UGhvbmVMb2dpblRpcChcIueZu+W9leaIkOWKn1wiLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLnNjaGVkdWxlT25jZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBfcmVtb3ZlTmF0aXZlSW5wdXRFbGVtZW50cygpO1xuICAgICAgICAgICAgICAgIGlmIChjYy5pc1ZhbGlkKHVpLnBvcHVwKSkgdWkucG9wdXAuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgc2VsZi5fcGhvbmVMb2dpblBvcHVwU2hvd2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZShcImhhbGxTY2VuZVwiKTtcbiAgICAgICAgICAgIH0sIDAuNSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgSHR0cEFQSSA9IHdpbmRvdy5IdHRwQVBJO1xuICAgICAgICBpZiAoSHR0cEFQSSAmJiBkZWZpbmVzLmNyeXB0b0tleSkge1xuICAgICAgICAgICAgSHR0cEFQSS5wb3N0RW5jcnlwdGVkKFxuICAgICAgICAgICAgICAgIGRlZmluZXMuYXBpVXJsICsgJy9hcGkvdjEvYXV0aC93eC1sb2dpbicsXG4gICAgICAgICAgICAgICAgJ3d4X2xvZ2luJyxcbiAgICAgICAgICAgICAgICB7IGNvZGU6IFwidGVzdF9jb2RlX1wiICsgRGF0ZS5ub3coKSB9LFxuICAgICAgICAgICAgICAgIGRlZmluZXMuY3J5cHRvS2V5LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGVyciwgcmVzcCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93UGhvbmVMb2dpblRpcChlcnIgfHwgXCLnmbvlvZXlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3AgJiYgcmVzcC5jb2RlID09PSAwICYmIHJlc3AuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd1Bob25lTG9naW5UaXAoXCLnmbvlvZXmiJDlip9cIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5teWdsb2JhbCAmJiB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnVuaXF1ZUlEID0gcmVzcC5kYXRhLnVuaXF1ZUlEIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEID0gcmVzcC5kYXRhLmFjY291bnRJRCB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLm5pY2tOYW1lID0gcmVzcC5kYXRhLm5pY2tOYW1lIHx8IFwi5b6u5L+h55So5oi3XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEudXNlck5hbWUgPSByZXNwLmRhdGEudXNlcm5hbWUgfHwgXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5hdmF0YXIgPSByZXNwLmRhdGEuYXZhdGFyVXJsIHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuZ29iYWxfY291bnQgPSByZXNwLmRhdGEuZ29sZENvdW50IHx8IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEudG9rZW4gPSByZXNwLmRhdGEudG9rZW4gfHwgXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS5zYXZlVG9Mb2NhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5teWdsb2JhbCAmJiB3aW5kb3cubXlnbG9iYWwuc29ja2V0ICYmIHdpbmRvdy5teWdsb2JhbC5zb2NrZXQuaW5pdFNvY2tldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5zb2NrZXQuaW5pdFNvY2tldCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3JlbW92ZU5hdGl2ZUlucHV0RWxlbWVudHMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2MuaXNWYWxpZCh1aS5wb3B1cCkpIHVpLnBvcHVwLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3Bob25lTG9naW5Qb3B1cFNob3dpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYy5kaXJlY3Rvci5sb2FkU2NlbmUoXCJoYWxsU2NlbmVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCAwLjUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd1Bob25lTG9naW5UaXAocmVzcC5tZXNzYWdlIHx8IFwi55m75b2V5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIHhoci5vcGVuKCdQT1NUJywgZGVmaW5lcy5hcGlVcmwgKyAnL2FwaS92MS9hdXRoL3d4LWxvZ2luJywgdHJ1ZSk7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHhoci50aW1lb3V0ID0gMTAwMDA7XG4gICAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXNwID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcC5jb2RlID09PSAwICYmIHJlc3AuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93UGhvbmVMb2dpblRpcChcIueZu+W9leaIkOWKn1wiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cubXlnbG9iYWwgJiYgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnVuaXF1ZUlEID0gcmVzcC5kYXRhLnBsYXllcl9pZCB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYWNjb3VudElEID0gcmVzcC5kYXRhLmFjY291bnRfaWQgfHwgXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLm5pY2tOYW1lID0gcmVzcC5kYXRhLm5pY2tuYW1lIHx8IFwi5b6u5L+h55So5oi3XCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubXlnbG9iYWwucGxheWVyRGF0YS51c2VyTmFtZSA9IHJlc3AuZGF0YS51c2VybmFtZSB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuYXZhdGFyID0gcmVzcC5kYXRhLmF2YXRhciB8fCBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEuZ29iYWxfY291bnQgPSByZXNwLmRhdGEuZ29sZCB8fCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnBsYXllckRhdGEudG9rZW4gPSByZXNwLmRhdGEudG9rZW4gfHwgXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5teWdsb2JhbC5wbGF5ZXJEYXRhLnNhdmVUb0xvY2FsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5teWdsb2JhbCAmJiB3aW5kb3cubXlnbG9iYWwuc29ja2V0ICYmIHdpbmRvdy5teWdsb2JhbC5zb2NrZXQuaW5pdFNvY2tldCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm15Z2xvYmFsLnNvY2tldC5pbml0U29ja2V0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zY2hlZHVsZU9uY2UoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfcmVtb3ZlTmF0aXZlSW5wdXRFbGVtZW50cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNjLmlzVmFsaWQodWkucG9wdXApKSB1aS5wb3B1cC5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3Bob25lTG9naW5Qb3B1cFNob3dpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNjLmRpcmVjdG9yLmxvYWRTY2VuZShcImhhbGxTY2VuZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMC41KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaG93UGhvbmVMb2dpblRpcChyZXNwLm1lc3NhZ2UgfHwgXCLnmbvlvZXlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3Nob3dQaG9uZUxvZ2luVGlwKFwi6Kej5p6Q5ZON5bqU5aSx6LSlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2hvd1Bob25lTG9naW5UaXAoXCLnvZHnu5zor7fmsYLlpLHotKVcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgeGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyBjb2RlOiBcInRlc3RfY29kZV9cIiArIERhdGUubm93KCkgfSkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIOaYvuekuuWcuuaZr+S4remihOe9rueahCBsb2dpbiDlvLnnqpfvvIjljp/liqjmgIHliJvlu7rvvIznjrDkvb/nlKjlnLrmma/oioLngrnvvIlcbiAgICBfY3JlYXRlUGhvbmVMb2dpbkR5bmFtaWM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCF0aGlzLl9waG9uZUxvZ2luVUkpIHtcbiAgICAgICAgICAgIHRoaXMuX2luaXRQaG9uZUxvZ2luUG9wdXAoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdWkgPSB0aGlzLl9waG9uZUxvZ2luVUk7XG4gICAgICAgIGlmICghdWkgfHwgIXVpLnBvcHVwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJsb2dpbiDlvLnnqpfmnKrliJ3lp4vljJZcIik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcG9wdXAgPSB1aS5wb3B1cDtcbiAgICAgICAgdmFyIHBhbmVsID0gdWkucGFuZWw7XG4gICAgICAgIHZhciBwaG9uZUlucHV0Tm9kZSA9IHVpLnBob25lSW5wdXROb2RlO1xuICAgICAgICB2YXIgY29kZUlucHV0Tm9kZSA9IHVpLmNvZGVJbnB1dE5vZGU7XG5cbiAgICAgICAgX3JlbW92ZU5hdGl2ZUlucHV0RWxlbWVudHMoKTtcblxuICAgICAgICBpZiAodWkucGhvbmVFZGl0Qm94KSB1aS5waG9uZUVkaXRCb3guc3RyaW5nID0gXCJcIjtcbiAgICAgICAgaWYgKHVpLmNvZGVFZGl0Qm94KSB1aS5jb2RlRWRpdEJveC5zdHJpbmcgPSBcIlwiO1xuICAgICAgICBpZiAodWkudGlwTm9kZSkgdWkudGlwTm9kZS5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fcmVzZXRQaG9uZUxvZ2luQ291bnRkb3duVUkoKTtcblxuICAgICAgICB2YXIgcGFuZWxXaWR0aCA9IHBhbmVsLndpZHRoIHx8IDUyMDtcbiAgICAgICAgdmFyIHBhbmVsSGVpZ2h0ID0gcGFuZWwuaGVpZ2h0IHx8IDY4MDtcbiAgICAgICAgdmFyIGlucHV0V2lkdGggPSBwaG9uZUlucHV0Tm9kZSA/IHBob25lSW5wdXROb2RlLndpZHRoIDogMjIwO1xuICAgICAgICB2YXIgaW5wdXRIZWlnaHQgPSBwaG9uZUlucHV0Tm9kZSA/IHBob25lSW5wdXROb2RlLmhlaWdodCA6IDQ1O1xuICAgICAgICB2YXIgY29kZUlucHV0VyA9IGNvZGVJbnB1dE5vZGUgPyBjb2RlSW5wdXROb2RlLndpZHRoIDogMTIwO1xuXG4gICAgICAgIHBvcHVwLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgIHBvcHVwLnpJbmRleCA9IDEwMDA7XG4gICAgICAgIHBhbmVsLnNjYWxlID0gMC43O1xuICAgICAgICBwYW5lbC5vcGFjaXR5ID0gMDtcblxuICAgICAgICBjYy50d2VlbihwYW5lbClcbiAgICAgICAgICAgIC50bygwLjI1LCB7IHNjYWxlOiAxLCBvcGFjaXR5OiAyNTUgfSwgeyBlYXNpbmc6ICdiYWNrT3V0JyB9KVxuICAgICAgICAgICAgLmNhbGwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjYy5pc1ZhbGlkKHBvcHVwKSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGlmIChjYy5zeXMuaXNCcm93c2VyICYmIHBob25lSW5wdXROb2RlICYmIGNvZGVJbnB1dE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgX2NyZWF0ZU5hdGl2ZUlucHV0RWxlbWVudHMoXG4gICAgICAgICAgICAgICAgICAgICAgICBwYW5lbCwgcGhvbmVJbnB1dE5vZGUsIGNvZGVJbnB1dE5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dFdpZHRoLCBpbnB1dEhlaWdodCwgY29kZUlucHV0VyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhbmVsV2lkdGgsIHBhbmVsSGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh1aS5waG9uZUVkaXRCb3ggJiYgdWkuY29kZUVkaXRCb3gpIHtcbiAgICAgICAgICAgICAgICAgICAgdWkucGhvbmVFZGl0Qm94LnN0YXlPblRvcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHVpLmNvZGVFZGl0Qm94LnN0YXlPblRvcCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwi5omL5py655m75b2V5by556qX6L6T5YWl5qGG5bCx57uqXCIpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGFydCgpO1xuXG4gICAgICAgIHJldHVybiBwb3B1cDtcbiAgICB9LFxuXG5cbiAgICBfc2hvd1VzZXJBZ3JlZW1lbnRQb3B1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX2NyZWF0ZUFncmVlbWVudFBvcHVwKCk7XG4gICAgfSxcblxuICAgIC8vIOWIm+W7uueUqOaIt+WNj+iuruW8ueeql1xuICAgIF9jcmVhdGVBZ3JlZW1lbnRQb3B1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOW8ueeql+agueiKgueCuSA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgcG9wdXAgPSBuZXcgY2MuTm9kZShcInVzZXJfYWdyZWVtZW50X3BvcHVwXCIpO1xuICAgICAgICBwb3B1cC5wYXJlbnQgPSB0aGlzLm5vZGU7XG4gICAgICAgIHBvcHVwLnNldENvbnRlbnRTaXplKGNjLnNpemUoMTI4MCwgNzIwKSk7XG4gICAgICAgIHBvcHVwLnNldFBvc2l0aW9uKDAsIDApO1xuICAgICAgICBwb3B1cC56SW5kZXggPSAxMDAwO1xuICAgICAgICBcbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5Y2K6YCP5piO6buR6Imy6IOM5pmv6YGu572pID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBiZ01hc2sgPSBuZXcgY2MuTm9kZShcImJnX21hc2tcIik7XG4gICAgICAgIGJnTWFzay5wYXJlbnQgPSBwb3B1cDtcbiAgICAgICAgYmdNYXNrLnNldENvbnRlbnRTaXplKGNjLnNpemUoMTI4MCwgNzIwKSk7XG4gICAgICAgIGJnTWFzay5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgdmFyIGJnTWFza1Nwcml0ZSA9IGJnTWFzay5hZGRDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgYmdNYXNrU3ByaXRlLnNpemVNb2RlID0gY2MuU3ByaXRlLlNpemVNb2RlLkNVU1RPTTtcbiAgICAgICAgYmdNYXNrLmNvbG9yID0gbmV3IGNjLkNvbG9yKDAsIDAsIDApO1xuICAgICAgICBiZ01hc2sub3BhY2l0eSA9IDE4MDtcbiAgICAgICAgXG4gICAgICAgIC8vID09PT09PT09PT09PT09PT09PT09IOS4u+mdouadvyA9PT09PT09PT09PT09PT09PT09PVxuICAgICAgICB2YXIgcGFuZWwgPSBuZXcgY2MuTm9kZShcImNvbnRlbnRfcGFuZWxcIik7XG4gICAgICAgIHBhbmVsLnBhcmVudCA9IHBvcHVwO1xuICAgICAgICBwYW5lbC5zZXRDb250ZW50U2l6ZShjYy5zaXplKDkwMCwgNTIwKSk7XG4gICAgICAgIHBhbmVsLnNldFBvc2l0aW9uKDAsIDApO1xuICAgICAgICB2YXIgcGFuZWxTcHJpdGUgPSBwYW5lbC5hZGRDb21wb25lbnQoY2MuU3ByaXRlKTtcbiAgICAgICAgcGFuZWxTcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NO1xuICAgICAgICBwYW5lbC5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1MCwgMjQwKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWKoOi9veiDjOaZr+WbvueJh1xuICAgICAgICBjYy5yZXNvdXJjZXMubG9hZChcImltYWdlcy91c2VyX2FncmVlbWVudF9iZ1wiLCBjYy5TcHJpdGVGcmFtZSwgZnVuY3Rpb24oZXJyLCBzcHJpdGVGcmFtZSkge1xuICAgICAgICAgICAgaWYgKCFjYy5pc1ZhbGlkKHBhbmVsKSkgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCFlcnIgJiYgc3ByaXRlRnJhbWUpIHtcbiAgICAgICAgICAgICAgICBwYW5lbFNwcml0ZS5zcHJpdGVGcmFtZSA9IHNwcml0ZUZyYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDmoIfpopggPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdmFyIHRpdGxlTm9kZSA9IG5ldyBjYy5Ob2RlKFwidGl0bGVfbGFiZWxcIik7XG4gICAgICAgIHRpdGxlTm9kZS5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgdGl0bGVOb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoMzAwLCA2MCkpO1xuICAgICAgICB0aXRsZU5vZGUuc2V0UG9zaXRpb24oMCwgMjMwKTtcbiAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSB0aXRsZU5vZGUuYWRkQ29tcG9uZW50KGNjLkxhYmVsKTtcbiAgICAgICAgdGl0bGVMYWJlbC5zdHJpbmcgPSBcIueUqOaIt+WNj+iurlwiO1xuICAgICAgICB0aXRsZUxhYmVsLmZvbnRTaXplID0gMzY7XG4gICAgICAgIHRpdGxlTGFiZWwubGluZUhlaWdodCA9IDYwO1xuICAgICAgICB0aXRsZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIHRpdGxlTm9kZS5jb2xvciA9IG5ldyBjYy5Db2xvcigzMCwgMzAsIDMwKTtcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDlhbPpl63mjInpkq4gPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgdmFyIGNsb3NlQnRuID0gbmV3IGNjLk5vZGUoXCJjbG9zZV9idG5cIik7XG4gICAgICAgIGNsb3NlQnRuLnBhcmVudCA9IHBhbmVsO1xuICAgICAgICBjbG9zZUJ0bi5zZXRDb250ZW50U2l6ZShjYy5zaXplKDYwLCA2MCkpO1xuICAgICAgICBjbG9zZUJ0bi5zZXRQb3NpdGlvbig0MDAsIDIzMCk7XG4gICAgICAgIFxuICAgICAgICB2YXIgY2xvc2VCdG5CZyA9IG5ldyBjYy5Ob2RlKFwiYmdcIik7XG4gICAgICAgIGNsb3NlQnRuQmcucGFyZW50ID0gY2xvc2VCdG47XG4gICAgICAgIGNsb3NlQnRuQmcuc2V0Q29udGVudFNpemUoY2Muc2l6ZSg1MCwgNTApKTtcbiAgICAgICAgY2xvc2VCdG5CZy5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgdmFyIGNsb3NlQmdTcHJpdGUgPSBjbG9zZUJ0bkJnLmFkZENvbXBvbmVudChjYy5TcHJpdGUpO1xuICAgICAgICBjbG9zZUJnU3ByaXRlLnNpemVNb2RlID0gY2MuU3ByaXRlLlNpemVNb2RlLkNVU1RPTTtcbiAgICAgICAgY2xvc2VCdG5CZy5jb2xvciA9IG5ldyBjYy5Db2xvcigyNTUsIDI1NSwgMjU1KTtcbiAgICAgICAgXG4gICAgICAgIHZhciBjbG9zZUxhYmVsTm9kZSA9IG5ldyBjYy5Ob2RlKFwieFwiKTtcbiAgICAgICAgY2xvc2VMYWJlbE5vZGUucGFyZW50ID0gY2xvc2VCdG47XG4gICAgICAgIGNsb3NlTGFiZWxOb2RlLnNldFBvc2l0aW9uKDAsIDApO1xuICAgICAgICB2YXIgY2xvc2VMYWJlbCA9IGNsb3NlTGFiZWxOb2RlLmFkZENvbXBvbmVudChjYy5MYWJlbCk7XG4gICAgICAgIGNsb3NlTGFiZWwuc3RyaW5nID0gXCLDl1wiO1xuICAgICAgICBjbG9zZUxhYmVsLmZvbnRTaXplID0gNDA7XG4gICAgICAgIGNsb3NlTGFiZWwubGluZUhlaWdodCA9IDUwO1xuICAgICAgICBjbG9zZUxhYmVsLmhvcml6b250YWxBbGlnbiA9IGNjLkxhYmVsLkhvcml6b250YWxBbGlnbi5DRU5URVI7XG4gICAgICAgIGNsb3NlTGFiZWxOb2RlLmNvbG9yID0gbmV3IGNjLkNvbG9yKDgwLCA4MCwgODApO1xuICAgICAgICBcbiAgICAgICAgdmFyIGNsb3NlQnRuQ29tcCA9IGNsb3NlQnRuLmFkZENvbXBvbmVudChjYy5CdXR0b24pO1xuICAgICAgICBjbG9zZUJ0bkNvbXAudHJhbnNpdGlvbiA9IGNjLkJ1dHRvbi5UcmFuc2l0aW9uLlNDQUxFO1xuICAgICAgICBjbG9zZUJ0bkNvbXAuem9vbVNjYWxlID0gMS4yO1xuICAgICAgICBjbG9zZUJ0bkNvbXAuaW50ZXJhY3RhYmxlID0gdHJ1ZTtcbiAgICAgICAgXG4gICAgICAgIHZhciBjbG9zZUhhbmRsZXIgPSBuZXcgY2MuQ29tcG9uZW50LkV2ZW50SGFuZGxlcigpO1xuICAgICAgICBjbG9zZUhhbmRsZXIudGFyZ2V0ID0gdGhpcy5ub2RlO1xuICAgICAgICBjbG9zZUhhbmRsZXIuY29tcG9uZW50ID0gXCJsb2dpblNjZW5lXCI7XG4gICAgICAgIGNsb3NlSGFuZGxlci5oYW5kbGVyID0gXCJfY2xvc2VVc2VyQWdyZWVtZW50UG9wdXBcIjtcbiAgICAgICAgY2xvc2VIYW5kbGVyLmN1c3RvbUV2ZW50RGF0YSA9IFwiXCI7XG4gICAgICAgIGNsb3NlQnRuQ29tcC5jbGlja0V2ZW50cy5wdXNoKGNsb3NlSGFuZGxlcik7XG5cbiAgICAgICAgLy8gPT09PT09PT09PT09PT09PT09PT0g5YiG6ZqU57q/ID09PT09PT09PT09PT09PT09PT09XG4gICAgICAgIHZhciBkaXZpZGVyTGluZSA9IG5ldyBjYy5Ob2RlKFwiZGl2aWRlclwiKTtcbiAgICAgICAgZGl2aWRlckxpbmUucGFyZW50ID0gcGFuZWw7XG4gICAgICAgIGRpdmlkZXJMaW5lLnNldENvbnRlbnRTaXplKGNjLnNpemUoODUwLCAxKSk7XG4gICAgICAgIGRpdmlkZXJMaW5lLnNldFBvc2l0aW9uKDAsIDE5NSk7XG4gICAgICAgIHZhciBkaXZpZGVyU3ByaXRlID0gZGl2aWRlckxpbmUuYWRkQ29tcG9uZW50KGNjLlNwcml0ZSk7XG4gICAgICAgIGRpdmlkZXJTcHJpdGUuc2l6ZU1vZGUgPSBjYy5TcHJpdGUuU2l6ZU1vZGUuQ1VTVE9NO1xuICAgICAgICBkaXZpZGVyTGluZS5jb2xvciA9IG5ldyBjYy5Db2xvcigyMjAsIDIyMCwgMjIwKTtcblxuICAgICAgICAvLyA9PT09PT09PT09PT09PT09PT09PSDlhoXlrrnmu5rliqjljLrln58gPT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgLy8g5pW05L2T5LiK56e777yM5aKe5Yqg5bqV6YOo56m66Ze077yM5re75Yqg5rua5Yqo5Yqf6IO9XG4gICAgICAgIHZhciBzY3JvbGxOb2RlID0gbmV3IGNjLk5vZGUoXCJzY3JvbGxfdmlld1wiKTtcbiAgICAgICAgc2Nyb2xsTm9kZS5wYXJlbnQgPSBwYW5lbDtcbiAgICAgICAgc2Nyb2xsTm9kZS5zZXRDb250ZW50U2l6ZShjYy5zaXplKDgyMCwgMzgwKSk7ICAvLyDosIPmlbTlrr3luqZcbiAgICAgICAgc2Nyb2xsTm9kZS5zZXRQb3NpdGlvbigwLCAwKTsgIC8vIOS4iuenu1xuICAgICAgICBcbiAgICAgICAgLy8g5re75YqgIFNjcm9sbFZpZXcg57uE5Lu25a6e546w5rua5Yqo5Yqf6IO9XG4gICAgICAgIHZhciBzY3JvbGxWaWV3ID0gc2Nyb2xsTm9kZS5hZGRDb21wb25lbnQoY2MuU2Nyb2xsVmlldyk7XG4gICAgICAgIHNjcm9sbFZpZXcuaG9yaXpvbnRhbCA9IGZhbHNlOyAgLy8g56aB55So5rC05bmz5rua5YqoXG4gICAgICAgIHNjcm9sbFZpZXcudmVydGljYWwgPSB0cnVlOyAgICAgLy8g5ZCv55So5Z6C55u05rua5YqoXG4gICAgICAgIHNjcm9sbFZpZXcuaW5lcnRpYSA9IHRydWU7ICAgICAgLy8g5rua5Yqo5oOv5oCnXG4gICAgICAgIHNjcm9sbFZpZXcuZWxhc3RpYyA9IHRydWU7ICAgICAgLy8g5by55oCn5pWI5p6cXG4gICAgICAgIFxuICAgICAgICB2YXIgdmlld05vZGUgPSBuZXcgY2MuTm9kZShcInZpZXdcIik7XG4gICAgICAgIHZpZXdOb2RlLnBhcmVudCA9IHNjcm9sbE5vZGU7XG4gICAgICAgIHZpZXdOb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoODIwLCAzODApKTsgIC8vIOiwg+aVtOWuveW6plxuICAgICAgICB2aWV3Tm9kZS5zZXRQb3NpdGlvbigwLCAwKTtcbiAgICAgICAgXG4gICAgICAgIHZhciBtYXNrID0gdmlld05vZGUuYWRkQ29tcG9uZW50KGNjLk1hc2spO1xuICAgICAgICBtYXNrLnR5cGUgPSBjYy5NYXNrLlR5cGUuUkVDVDtcbiAgICAgICAgXG4gICAgICAgIHZhciBjb250ZW50Tm9kZSA9IG5ldyBjYy5Ob2RlKFwiY29udGVudFwiKTtcbiAgICAgICAgY29udGVudE5vZGUucGFyZW50ID0gdmlld05vZGU7XG4gICAgICAgIGNvbnRlbnROb2RlLmFuY2hvclggPSAwLjU7XG4gICAgICAgIGNvbnRlbnROb2RlLmFuY2hvclkgPSAxO1xuICAgICAgICBjb250ZW50Tm9kZS5zZXRQb3NpdGlvbigwLCAxOTApOyAgLy8g5bGF5Lit5a+56b2QXG4gICAgICAgIGNvbnRlbnROb2RlLnNldENvbnRlbnRTaXplKGNjLnNpemUoODIwLCA4MDApKTsgIC8vIOWinuWKoOmrmOW6puS7peWuuee6s+aJgOacieWGheWuuVxuICAgICAgICBcbiAgICAgICAgLy8g6K6+572uIFNjcm9sbFZpZXcg55qEIGNvbnRlbnQg5bGe5oCnXG4gICAgICAgIHNjcm9sbFZpZXcuY29udGVudCA9IGNvbnRlbnROb2RlO1xuICAgICAgICBcbiAgICAgICAgdmFyIHJpY2hUZXh0Tm9kZSA9IG5ldyBjYy5Ob2RlKFwicmljaF90ZXh0XCIpO1xuICAgICAgICByaWNoVGV4dE5vZGUucGFyZW50ID0gY29udGVudE5vZGU7XG4gICAgICAgIHJpY2hUZXh0Tm9kZS5hbmNob3JYID0gMDtcbiAgICAgICAgcmljaFRleHROb2RlLmFuY2hvclkgPSAxO1xuICAgICAgICByaWNoVGV4dE5vZGUuc2V0UG9zaXRpb24oLTM4NSwgLTE1KTsgIC8vIOWinuWKoOW3pui+uei3ne+8jOaWh+Wtl+aVtOS9k+S4iuenu1xuICAgICAgICBcbiAgICAgICAgdmFyIHJpY2hUZXh0ID0gcmljaFRleHROb2RlLmFkZENvbXBvbmVudChjYy5SaWNoVGV4dCk7XG4gICAgICAgIHJpY2hUZXh0LmZvbnRTaXplID0gMTY7ICAvLyDlrZflj7fliqDlpKfvvJoxNCAtPiAxNlxuICAgICAgICByaWNoVGV4dC5saW5lSGVpZ2h0ID0gMjY7ICAvLyDooYzpq5jliqDlpKfvvJoyNCAtPiAyNlxuICAgICAgICByaWNoVGV4dC5tYXhXaWR0aCA9IDc2MDsgIC8vIOiwg+aVtOWuveW6pu+8jOehruS/neW3puWPs+i+uei3nVxuICAgICAgICBcbiAgICAgICAgLy8g6K6+572u5paH5a2X6aKc6Imy5Li66buR6ImyXG4gICAgICAgIHZhciBhZ3JlZW1lbnRUZXh0ID0gXCI8Yj48Y29sb3I9IzAwMDAwMD7nlKjmiLfljY/orq48L2NvbG9yPjwvYj5cXG5cXG5cIiArXG4gICAgICAgICAgICBcIjxjb2xvcj0jMDAwMDAwPuasoui/juS9v+eUqOacrOa4uOaIj++8geWcqOS9v+eUqOWJje+8jOivt+S7lOe7humYheivu+S7peS4i+WNj+iuru+8mjwvY29sb3I+XFxuXFxuXCIgK1xuICAgICAgICAgICAgXCI8Yj48Y29sb3I9IzAwMDAwMD7kuIDjgIHmnI3liqHmnaHmrL48L2NvbG9yPjwvYj5cXG5cIiArXG4gICAgICAgICAgICBcIjxjb2xvcj0jMDAwMDAwPjEuIOeUqOaIt+W6lOmBteWuiOWbveWutuazleW+i+azleinhO+8jOaWh+aYjua4uOaIj+OAgjwvY29sb3I+XFxuXCIgK1xuICAgICAgICAgICAgXCI8Y29sb3I9IzAwMDAwMD4yLiDnpoHmraLkvb/nlKjlpJbmjILjgIHkvZzlvIrova/ku7bnrYnnoLTlnY/muLjmiI/lhazlubPmgKfnmoTooYzkuLrjgII8L2NvbG9yPlxcblwiICtcbiAgICAgICAgICAgIFwiPGNvbG9yPSMwMDAwMDA+My4g55So5oi36LSm5Y+35a6J5YWo55Sx55So5oi36Ieq6KGM6LSf6LSj77yM6K+35aal5ZaE5L+d566h6LSm5Y+35a+G56CB44CCPC9jb2xvcj5cXG5cXG5cIiArXG4gICAgICAgICAgICBcIjxiPjxjb2xvcj0jMDAwMDAwPuS6jOOAgemakOengeaUv+etljwvY29sb3I+PC9iPlxcblwiICtcbiAgICAgICAgICAgIFwiPGNvbG9yPSMwMDAwMDA+MS4g5oiR5Lus5Lya5pS26ZuG5b+F6KaB55qE55So5oi35L+h5oGv55So5LqO5o+Q5L6b5pyN5Yqh44CCPC9jb2xvcj5cXG5cIiArXG4gICAgICAgICAgICBcIjxjb2xvcj0jMDAwMDAwPjIuIOaIkeS7rOaJv+ivuuS/neaKpOeUqOaIt+makOenge+8jOS4jeS8muWQkeesrOS4ieaWueazhOmcsueUqOaIt+S/oeaBr+OAgjwvY29sb3I+XFxuXCIgK1xuICAgICAgICAgICAgXCI8Y29sb3I9IzAwMDAwMD4zLiDnlKjmiLfmnInmnYPopoHmsYLliKDpmaTkuKrkurrmlbDmja7jgII8L2NvbG9yPlxcblxcblwiICtcbiAgICAgICAgICAgIFwiPGI+PGNvbG9yPSMwMDAwMDA+5LiJ44CB5YWN6LSj5aOw5piOPC9jb2xvcj48L2I+XFxuXCIgK1xuICAgICAgICAgICAgXCI8Y29sb3I9IzAwMDAwMD4xLiDlm6DkuI3lj6/mipflipvlr7zoh7TnmoTmnI3liqHkuK3mlq3vvIzmiJHku6zkuI3mib/mi4XotKPku7vjgII8L2NvbG9yPlxcblwiICtcbiAgICAgICAgICAgIFwiPGNvbG9yPSMwMDAwMDA+Mi4g55So5oi35Zug6L+d6KeE5pON5L2c6YCg5oiQ55qE5o2f5aSx77yM55Sx55So5oi36Ieq6KGM5om/5ouF44CCPC9jb2xvcj5cXG5cXG5cIiArXG4gICAgICAgICAgICBcIjxjb2xvcj0jMDAwMDAwPuWmguacieeWkemXru+8jOivt+iBlOezu+WuouacjeOAgjwvY29sb3I+XCI7XG4gICAgICAgIFxuICAgICAgICByaWNoVGV4dC5zdHJpbmcgPSBhZ3JlZW1lbnRUZXh0O1xuICAgICAgICBcbiAgICAgICAgLy8g5rua5Yqo5Yiw6aG26YOoXG4gICAgICAgIHNjcm9sbFZpZXcuc2Nyb2xsVG9Ub3AoMCk7XG5cbiAgICAgICAgdGhpcy5fdXNlckFncmVlbWVudFBvcHVwID0gcG9wdXA7XG4gICAgfSxcblxuICAgIF9jbG9zZVVzZXJBZ3JlZW1lbnRQb3B1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl91c2VyQWdyZWVtZW50UG9wdXApIHtcbiAgICAgICAgICAgIHRoaXMuX3VzZXJBZ3JlZW1lbnRQb3B1cC5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLl91c2VyQWdyZWVtZW50UG9wdXAgPSBudWxsO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICAvLyDplIDmr4Hml7bmuIXnkIZcbiAgICBvbkRlc3Ryb3kgKCkge1xuICAgICAgICB0aGlzLl9yZW1vdmVHbG9iYWxUb3VjaEZvck11c2ljKCk7XG4gICAgfVxufSk7XG4iXX0=