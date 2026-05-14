
                (function() {
                    var nodeEnv = typeof require !== 'undefined' && typeof process !== 'undefined';
                    var __module = nodeEnv ? module : {exports:{}};
                    var __filename = 'preview-scripts/__qc_index__.js';
                    var __require = nodeEnv ? function (request) {
                        return cc.require(request);
                    } : function (request) {
                        return __quick_compile_project__.require(request, __filename);
                    };
                    function __define (exports, require, module) {
                        if (!nodeEnv) {__quick_compile_project__.registerModule(__filename, module);}
require('./assets/scripts/data/arenaData');
require('./assets/scripts/ddz/tournament/ArenaEnterWaitingScene');
require('./assets/scripts/gameScene/gameScene');
require('./assets/scripts/gameScene/gamebeforeUI');
require('./assets/scripts/gameScene/gameingUI');
require('./assets/scripts/gameScene/prefabs/card');
require('./assets/scripts/gameScene/prefabs/player_node');
require('./assets/scripts/hallscene/hallScene');
require('./assets/scripts/hallscene/prefabs_script/creatroom');
require('./assets/scripts/hallscene/prefabs_script/joinroom');
require('./assets/scripts/hallscene/prefabs_script/userAgreement');
require('./assets/scripts/loginscene/loginScene');
require('./assets/scripts/prefabs/phone_login');
require('./assets/scripts/util/waitnode');

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