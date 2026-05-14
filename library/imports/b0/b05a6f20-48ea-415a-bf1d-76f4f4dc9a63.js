"use strict";
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