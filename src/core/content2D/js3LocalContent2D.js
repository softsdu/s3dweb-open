import {msgBox, s3dContent2DShiftType} from "../../commonjs/common/common.js";
import * as TWEEN from "../../commonjs/threejs/custom/tween.module.js"

let JS3LocalContent2D = function(){
    const thatLocalContent2D = this;

    this.manager = null;

    this.navigators = null;

    this.themes = null;

    this.init = function(p){
        thatLocalContent2D.manager = p.manager;
        thatLocalContent2D.navigators = p.content2D.navigators;
        thatLocalContent2D.themes = p.content2D.themes;
    }

    this.getNavigatorRootDir = function (navigatorCode){
        return "../../content2D/navigators/" + navigatorCode;
    }

    this.getThemeRootDir = function (themeCode){
        return "../../content2D/theme/" + themeCode;
    }

    this.getPageRefJsonUrl = function (themeCode, moduleCode){
        return "../../content2D/theme/" + themeCode + "/" + moduleCode + "/ref.json";
    }

    this.getPageHtmlUrl = function (themeCode, moduleCode){
        return "../../content2D/theme/" + themeCode + "/" + moduleCode + "/module.html";
    }

    this.getNavigatorRefJsonUrl = function (navigatorCode){
        return "../../content2D/navigator/" + navigatorCode + "/ref.json";
    }

    this.getNavigatorHtmlUrl = function (navigatorCode){
        return "../../content2D/navigator/" + navigatorCode + "/module.html";
    }


    this.getPageRefJson = function (p) {
        let themeCode = p.themeCode;
        let moduleCode = p.moduleCode;
        const afterGetPageRefJson = p.afterGetPageRefJson;
        const pageRefJsonUrl = thatLocalContent2D.manager.localContent2D.getPageRefJsonUrl(themeCode, moduleCode);
        fetch(pageRefJsonUrl).then(async response => {
            if (!response.ok) {
                msgBox.alert({
                    info: "获取文件失败. URL=" + pageRefJsonUrl + ", Status=" + response.status
                });
                throw new Error(`HTTP 错误! 状态: ${response.status}`);
            } else {
                afterGetPageRefJson({
                    refJson: await response.json()
                });
            }
        }).then(data => data).catch(error => {
            msgBox.alert({
                info: "加载文件出错. URL=" + pageRefJsonUrl + ", Error=" + error
            });
            console.error('加载 JSON 时出错:', error);
            return null;
        });
    };

    this.getPageHtml = function (p) {
        let themeCode = p.themeCode;
        let moduleCode = p.moduleCode;
        const afterGetPageHtml = p.afterGetPageHtml;
        const pageHtmlUrl = thatLocalContent2D.manager.localContent2D.getPageHtmlUrl(themeCode, moduleCode);
        fetch(pageHtmlUrl).then(async response => {
            if (!response.ok) {
                msgBox.alert({
                    info: "获取文件失败. URL=" + pageHtmlUrl + ", Status=" + response.status
                });
                throw new Error(`HTTP 错误! 状态: ${response.status}`);
            } else {
                afterGetPageHtml({
                    moduleHtml: await response.text()
                });
            }
        }).then(data => data).catch(error => {
            msgBox.alert({
                info: "加载文件出错. URL=" + pageHtmlUrl + ", Error=" + error
            });
            console.error('加载 JSON 时出错:', error);
            return null;
        });
    };

    this.getNavigatorRefJson = function (p) {
        let navigatorCode = p.navigatorCode;
        const afterGetNavigatorRefJson = p.afterGetNavigatorRefJson;
        const navigatorRefJsonUrl = thatLocalContent2D.manager.localContent2D.getNavigatorRefJsonUrl(navigatorCode);
        fetch(navigatorRefJsonUrl).then(async response => {
            if (!response.ok) {
                msgBox.alert({
                    info: "获取文件失败. URL=" + navigatorRefJsonUrl + ", Status=" + response.status
                });
                throw new Error(`HTTP 错误! 状态: ${response.status}`);
            } else {
                afterGetNavigatorRefJson({
                    refJson: await response.json()
                });
            }
        }).then(data => data).catch(error => {
            msgBox.alert({
                info: "加载文件出错. URL=" + navigatorRefJsonUrl + ", Error=" + error
            });
            console.error('加载 JSON 时出错:', error);
            return null;
        });
    };

    this.getNavigatorHtml = function (p) {
        let navigatorCode = p.navigatorCode;
        const afterGetNavigatorHtml = p.afterGetNavigatorHtml;
        const navigatorHtmlUrl = thatLocalContent2D.manager.localContent2D.getNavigatorHtmlUrl(navigatorCode);
        fetch(navigatorHtmlUrl).then(async response => {
            if (!response.ok) {
                msgBox.alert({
                    info: "获取文件失败. URL=" + navigatorHtmlUrl + ", Status=" + response.status
                });
                throw new Error(`HTTP 错误! 状态: ${response.status}`);
            } else {
                afterGetNavigatorHtml({
                    moduleHtml: await response.text()
                });
            }
        }).then(data => data).catch(error => {
            msgBox.alert({
                info: "加载文件出错. URL=" + navigatorHtmlUrl + ", Error=" + error
            });
            console.error('加载 JSON 时出错:', error);
            return null;
        });
    };

    this.showPageInScreen2D = function(p) {
        //pageInfo, moduleHtml, refJson, isForward, shiftAnimationTime, shiftType
        let moduleHtml = p.moduleHtml;
        if (p.refJson != null) {
            if (p.refJson.css != null) {
                for (let i = 0; i < p.refJson.css.length; i++) {
                    let cssInfo = p.refJson.css[i];
                    moduleHtml += "<link rel='stylesheet' type='text/css' href='" + cssInfo.url + "' />";
                }
            }
        }

        let content2DContainerId = thatLocalContent2D.manager.screen2D.updateContent2D({
            pageIndex: p.pageInfo.pageIndex,
            html: moduleHtml,
            shiftType: p.shiftType,
            isForward: p.isForward,
            shiftAnimationTime: p.shiftAnimationTime,
            editing: p.editing
        });
        let content2DContainer = $("#" + content2DContainerId)[0];
        for(let itemCode in p.pageInfo.itemMap){
            let itemInfo = p.pageInfo.itemMap[itemCode];
            $(content2DContainer).find("[s3dEditable='true'][itemCode='" + itemInfo.code + "']").text(itemInfo.value);
        }
    };

    this.showNavigatorInScreen2D = function(navigatorCode, moduleHtml, refJson, totalCount, currentIndex) {
        if (refJson.css != null) {
            for (let i = 0; i < refJson.css.length; i++) {
                let cssInfo = refJson.css[i];
                moduleHtml += "<link rel='stylesheet' type='text/css' href='" + cssInfo.url + "' />";
            }
        }
        thatLocalContent2D.manager.screen2D.addNavigator(moduleHtml);
        thatLocalContent2D.loadNavigatorRefJs(navigatorCode, refJson, 0, totalCount, currentIndex);
    }

    this.loadNavigatorRefJs = function (navigatorCode, refJson, jsIndex, totalCount, currentIndex){
        let jsInfo = refJson.js[jsIndex];
        import(jsInfo.url)
            .then((module) => {
                let nextJsIndex = jsIndex + 1;
                if (nextJsIndex < refJson.js.length) {
                    thatLocalContent2D.loadNavigatorRefJs(navigatorCode, refJson, nextJsIndex, totalCount, currentIndex);
                }
                let navigatorClassName = navigatorCode.charAt(0).toUpperCase() + navigatorCode.slice(1) + "Navigator";
                if (module.default != null && module.default.name === navigatorClassName) {
                    let p = {
                        containerId: thatLocalContent2D.manager.containerId,
                        manager: thatLocalContent2D.manager,
                        pageInfo: {
                            totalCount: totalCount,
                            currentIndex: currentIndex
                        }
                    };
                    let navigator = new module.default();
                    navigator.init(p);
                }
            })
            .catch((error) => {
                console.error('Failed to load module', error);
            });
    }

    this.showContent2DNavigator = function () {
        //显示第一页
        let navigatorCode = thatLocalContent2D.manager.userContent2D.navigatorCode
        let pageList = thatLocalContent2D.manager.userContent2D.pageList;
        if(navigatorCode !== null && navigatorCode.length > 0 && pageList != null && pageList.length > 0){
            const navigatorUIInfo = {
                moduleHtml: null,
                refJson: null,
                navigatorCode: navigatorCode,
                pageCount: pageList.length,
                currentIndex: 0
            };
            thatLocalContent2D.getNavigatorHtml({
                navigatorCode: navigatorCode,
                afterGetNavigatorHtml: function (p) {
                    navigatorUIInfo.moduleHtml = p.moduleHtml;
                    thatLocalContent2D.initContent2DNavigator(navigatorUIInfo);
                }
            });
            thatLocalContent2D.getNavigatorRefJson({
                navigatorCode: navigatorCode,
                afterGetNavigatorRefJson: function (p) {
                    navigatorUIInfo.refJson = p.refJson;
                    thatLocalContent2D.initContent2DNavigator(navigatorUIInfo);
                }
            });
        }
    }

    this.initContent2DNavigator = function (navigatorUIInfo) {
        if (navigatorUIInfo.moduleHtml != null && navigatorUIInfo.refJson != null) {
            thatLocalContent2D.showNavigatorInScreen2D(
                navigatorUIInfo.navigatorCode,
                navigatorUIInfo.moduleHtml,
                navigatorUIInfo.refJson,
                navigatorUIInfo.pageCount,
                navigatorUIInfo.currentIndex);
        }
    }

    this.showContent2DPage = function (){
        //使用相机
        let cameraId = thatLocalContent2D.manager.userContent2D.cameraId;
        if(cameraId != null
            && cameraId.length !== 0) {
            let cameraObject = thatLocalContent2D.manager.viewer.getObject3DById(cameraId);
            thatLocalContent2D.manager.viewer.switchCamera(cameraObject);
            thatLocalContent2D.manager.viewer.initControls();
            thatLocalContent2D.manager.viewer.animate();
        }
        //显示第一页
        thatLocalContent2D.initPageByIndex(0, false);
    }

    this.initPageByIndex = function (pageIndex, userCameraAnimation, isForward, shiftAnimationTime){
        let pageList = thatLocalContent2D.manager.userContent2D.getSortedPageList();
        let shiftType = thatLocalContent2D.manager.userContent2D.shiftType;
        if(pageList.length > pageIndex){
            let pageInfo = pageList[pageIndex];
            pageInfo.pageIndex = pageIndex;
            const pageUIInfo = {
                moduleHtml: null,
                refJson: null,
                pageInfo: pageInfo,
                userCameraAnimation: userCameraAnimation,
                isForward: isForward,
                shiftAnimationTime: shiftAnimationTime,
                shiftType: shiftType
            };
            thatLocalContent2D.getPageHtml({
                themeCode: pageInfo.themeCode,
                moduleCode: pageInfo.moduleCode,
                afterGetPageHtml: function (p) {
                    pageUIInfo.moduleHtml = p.moduleHtml;
                    thatLocalContent2D.initContent2DPage(pageUIInfo);
                }
            });
            thatLocalContent2D.getPageRefJson({
                themeCode: pageInfo.themeCode,
                moduleCode:pageInfo.moduleCode,
                afterGetPageRefJson: function (p) {
                    pageUIInfo.refJson = p.refJson;
                    thatLocalContent2D.initContent2DPage(pageUIInfo);
                }
            });
        }
    }

    this.beforeLeavePage = function (){
        thatLocalContent2D.manager.userAnimations.stopAnimations();
    }

    this.shiftCameraViewport = function (toCameraInfo, shiftAnimationTime){
        let fromCameraInfo = thatLocalContent2D.manager.viewer.getCurrentCameraInfo();

        //旋转camera
        let rotateCameraStep = new TWEEN.Tween({
                positionX: fromCameraInfo.position[0],
                positionY: fromCameraInfo.position[1],
                positionZ: fromCameraInfo.position[2],
                targetX: fromCameraInfo.target[0],
                targetY: fromCameraInfo.target[1],
                targetZ: fromCameraInfo.target[2],
                zoom: fromCameraInfo.zoom
        }).to({
            positionX: toCameraInfo.position[0],
            positionY: toCameraInfo.position[1],
            positionZ: toCameraInfo.position[2],
            targetX: toCameraInfo.target[0],
            targetY: toCameraInfo.target[1],
            targetZ: toCameraInfo.target[2],
            zoom: toCameraInfo.zoom
        }, shiftAnimationTime).onUpdate(function(p){
            thatLocalContent2D.updateCameraAnimation(p);
        });

        rotateCameraStep.start();

        //thatLocalContent2D.manager.viewer.setViewport(cameraInfo.target, cameraInfo.position, cameraInfo.zoom);
    }

    this.updateCameraAnimation = function(p){
        thatLocalContent2D.manager.viewer.setViewport(
            [p.targetX, p.targetY, p.targetZ],
            [p.positionX, p.positionY, p.positionZ],
            p.zoom);
    }

    this.hasPageCameraAnimation = function (pageInfo){
        let animations = pageInfo.animations;
        if(animations != null){
            for(let i = 0; i < animations.length; i++){
                let animation = animations[i];
                let animationInfo = thatLocalContent2D.manager.userAnimations.getAnimationInfo(animation.code);
                if(animationInfo != null){
                    let groups = animationInfo.groups;
                    if(groups != null){
                        for(let j = 0; j < groups.length; j++){
                            let groupInfo = groups[j];
                            if(groupInfo.objectId === thatLocalContent2D.manager.userContent2D.cameraId){
                                return false;
                            }
                        }
                    }
                }
            }
        }
        return true;
    }

    this.initContent2DPage = function (pageUIInfo){
        if (pageUIInfo.moduleHtml != null && pageUIInfo.refJson != null) {

            thatLocalContent2D.beforeLeavePage();

            let moduleHtml = pageUIInfo.moduleHtml;
            let refJson = pageUIInfo.refJson;
            let pageInfo = pageUIInfo.pageInfo;
            let useCameraAnimation = pageUIInfo.userCameraAnimation;
            let isForward = pageUIInfo.isForward;
            let shiftAnimationTime = pageUIInfo.shiftAnimationTime;
            let shiftType = pageUIInfo.shiftType;
            thatLocalContent2D.showPageInScreen2D({
                pageInfo: pageInfo,
                moduleHtml: moduleHtml,
                refJson: refJson,
                isForward: isForward,
                shiftAnimationTime: shiftAnimationTime,
                shiftType: shiftType
            });

            thatLocalContent2D.loadPageRefJs(pageInfo.themeCode, pageInfo.moduleCode, refJson, 0);

            //设置相机
            let cameraInfo = pageInfo.camera;
            if (cameraInfo != null && cameraInfo.zoom != null && cameraInfo.position != null && cameraInfo.target != null) {
                if(!useCameraAnimation || !thatLocalContent2D.hasPageCameraAnimation(pageInfo)){
                    thatLocalContent2D.manager.viewer.setViewport(cameraInfo.target, cameraInfo.position, cameraInfo.zoom);
                }
                else {
                    thatLocalContent2D.shiftCameraViewport(cameraInfo, shiftAnimationTime);
                }
            }

            //设置天空盒
            let skyInfo = pageInfo.sky;
            if (skyInfo != null) {
                thatLocalContent2D.manager.skyBox.setSkyInfo(skyInfo, true);
            }

            //设置物体显示状态
            let states = pageInfo.states;
            if(states.length > 0) {
                let displayObjectIds = [];
                let hiddenObjectIds = [];
                for (let i = 0; i < states.length; i++) {
                    let stateInfo = states[i];
                    if (stateInfo.visible) {
                        displayObjectIds.push(stateInfo.objectId);
                    }
                    else {
                        hiddenObjectIds.push(stateInfo.objectId);
                    }
                }
                thatLocalContent2D.manager.viewer.setObject3DsVisible(displayObjectIds, true);
                thatLocalContent2D.manager.viewer.setObject3DsVisible(hiddenObjectIds, false);
            }

            //执行动画
            let animations = pageInfo.animations;
            if(animations != null && animations.length > 0) {
                thatLocalContent2D.manager.userAnimations.playAnimations(animations);
            }
        }
    }

    this.loadPageRefJs = function (themeCode, moduleCode, refJson, jsIndex){
        let jsInfo = refJson.js[jsIndex];
        import(jsInfo.url)
            .then((module) => {
                let nextJsIndex = jsIndex + 1;
                if (nextJsIndex < refJson.js.length) {
                    thatLocalContent2D.loadPageRefJs(themeCode, moduleCode, refJson, nextJsIndex);
                }
                let pageClassName = themeCode.charAt(0).toUpperCase() + themeCode.slice(1) + moduleCode.charAt(0).toUpperCase() + moduleCode.slice(1) ;
                if (module.default != null && module.default.name === pageClassName) {
                    let p = {
                        containerId: thatLocalContent2D.manager.containerId,
                        manager: thatLocalContent2D.manager
                    };
                    let pageObj = new module.default();
                    pageObj.init(p);
                }
            })
            .catch((error) => {
                console.error('Failed to load module', error);
            });
    }
}
export default JS3LocalContent2D