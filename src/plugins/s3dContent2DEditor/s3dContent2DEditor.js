import {
    s3dContent2DEditType,
    cmnPcr,
    msgBox,
    PopupContainer,
    s3dOperateType,
    s3dMaterialEditType
} from '../../commonjs/common/common.js';
import './S3dContent2DEditor.css';

//编辑2D页面
let S3dContent2DEditor = function () {
    //当前对象
    const thatContent2DEditor = this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;

    //正在编辑的页面的编码
    this.editingPageCode = null;

    //上一步操作的结果
    this.lastOperateInfo = null;

    //页面html
    this.moduleHtml = null;

    //ref json
    this.refJson = null;

    //支持的事件
    this.eventList = [{
        name: "onLoad",
        text: "页面加载完成后",
        parameters: [{
            name: "manager",
            type: "S3dManager"
        }, {
            name: "pageCode",
            type: "String"
        }]
    }, {
        name: "onLeave",
        text: "离开页面时",
        parameters: [{
            name: "manager",
            type: "S3dManager"
        }, {
            name: "pageCode",
            type: "String"
        }]
    }];

    //事件
    this.eventFunctions = {};

    this.addEventFunction = function (eventName, func) {
        let allFuncs = thatContent2DEditor.eventFunctions[eventName];
        if (allFuncs == null) {
            allFuncs = [];
            thatContent2DEditor.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    };
    this.doEventFunction = function (eventName, p) {
        let allFuncs = thatContent2DEditor.eventFunctions[eventName];
        if (allFuncs != null) {
            for (let i = 0; i < allFuncs.length; i++) {
                let func = allFuncs[i];
                func(p);
            }
        }
    };

    //初始化
    this.init = function (p) {
        thatContent2DEditor.containerId = p.containerId;
        thatContent2DEditor.manager = p.manager;
        thatContent2DEditor.showPageEditor();

        //关闭时保存并清除界面
        thatContent2DEditor.bindCloseEvent();
    };

    thatContent2DEditor.bindCloseEvent = function (){
        thatContent2DEditor.manager.layout.addEventFunction("beforeHideBlock", function (p){
            thatContent2DEditor.showPage(null);
        })
    }

    //显示
    this.showPageEditor = function () {
        //构造html
        let html = thatContent2DEditor.getHtml();
        let container = $("#" + thatContent2DEditor.containerId);
        let pageEditorContainer = $(container).find(".s3dLayoutBlock[name='content2DEditor']");
        $(pageEditorContainer).append(html);

        //toolbar
        let toolbarContainer = $(container).find(".s3dLayoutBlockToolbar[name='content2DEditor']");
        let toolbarHtml = thatContent2DEditor.getToolbarHtml();
        $(toolbarContainer).append(toolbarHtml);
        thatContent2DEditor.bindEvents();
    };

    this.bindEvents = function () {
        let container = $("#" + thatContent2DEditor.containerId);
        $(container).find(".s3dContent2DEditorToolbarMainCloseBtn").click(function () {
            thatContent2DEditor.closePage(true);
        });
        $(container).find(".s3dContent2DEditorToolbarBtnMainApplyBtn").click(function () {
            thatContent2DEditor.applyPage();
        });
        $(container).find(".s3dContent2DEditorToolbarBtnMainOkBtn").click(function () {
            thatContent2DEditor.savePage();
        });

        $(container).find(".s3dContent2DEditorGroupContainer .s3dContent2DEditorItem[name='name'] .s3dContent2DEditorItemInput").change(function () {
            thatContent2DEditor.applyPage();
        });

        $(container).find(".s3dContent2DEditorItem[name='event'] .s3dContent2DEditorItemPop").click(function () {
            thatContent2DEditor.showPopEditEventWindow();
        });

        $(container).find(".s3dContent2DEditorItem[name='camera'] .s3dContent2DEditorItemPop").click(function () {
            thatContent2DEditor.getCurrentCameraInfo();
        });
        $(container).find(".s3dContent2DEditorItem[name='objectVisible'] .s3dContent2DEditorItemPop").click(function () {
            thatContent2DEditor.getCurrentObjectVisibleInfo();
        });
        $(container).find(".s3dContent2DEditorItem[name='sky'] .s3dContent2DEditorItemPop").click(function () {
            thatContent2DEditor.showSkyInfoSetting();
        });
        $(container).find(".s3dContent2DEditorItem[name='animation'] .s3dContent2DEditorItemPop").click(function () {
            thatContent2DEditor.showSelectAnimationWindow();
        });

        $(container).find(".s3dContent2DEditorItem[name='image'] .s3dContent2DEditorItemPop").click(function () {
            let inputElement = $(this).parent().children(".s3dContent2DEditorItemInput");
            let propertyName = $(this).parent().parent().attr("name");
            let imageName = $(inputElement).val();

            thatContent2DEditor.manager.localImagePicker.showPicker({
                paramInfo: {
                    propertyName: propertyName,
                    imageUrl: imageName,
                    afterPickImage: thatContent2DEditor.afterPickImage
                }
            });
        });
    };

    this.afterPickImage = function(p){
        let propertyName  = p.paramInfo.propertyName;
        let container = $("#" + thatContent2DEditor.containerId);
        let imageItem = $(container).find(".s3dContent2DEditorItem[name='" + propertyName + "']");
        let itemInput = $(imageItem).find(".s3dContent2DEditorItemInput");
        $(itemInput).val(p.imageUrl);
    }

    this.showSkyInfoSetting = function () {
        let container = $("#" + thatContent2DEditor.containerId);
        let skyItem = $(container).find(".s3dContent2DEditorItem[name='sky']");
        let skyInfoJsonStr = $(skyItem).attr("skyInfoJson");
        let skyInfo = thatContent2DEditor.manager.s3dObject.scene.sky;
        if(skyInfoJsonStr != null && skyInfoJsonStr.length > 0){
            skyInfo = cmnPcr.strToJson(skyInfoJsonStr);
        }
        thatContent2DEditor.manager.skyBoxSetting.show({
            skyInfo: skyInfo,
            afterSetSkyBox: function (skyInfo){
                thatContent2DEditor.showSky(skyInfo);
                thatContent2DEditor.manager.skyBox.setSkyInfo(skyInfo, true);
            }
        });
    };

    this.getCurrentCameraInfo = function () {
        let cameraInfoJson = thatContent2DEditor.manager.viewer.getCurrentCameraInfo();
        thatContent2DEditor.showCamera(cameraInfoJson);
        msgBox.alert({
            info: "已成功设定本页面的相机."
        });

    };

    this.getCurrentObjectVisibleInfo = function () {
        let objectVisibleJsons = [];
        for (let id in thatContent2DEditor.manager.viewer.allObject3DMap) {
            let object3D = thatContent2DEditor.manager.viewer.allObject3DMap[id];
            objectVisibleJsons.push({
                objectId: id,
                visible: object3D.visible
            });
        }
        thatContent2DEditor.showStates(objectVisibleJsons);
        msgBox.alert({
            info: "已成功设定本页面的物体可见性."
        });
    };

    this.previewPage = function () {
    };

    //获取树toolbar html
    this.getToolbarHtml = function () {
        let html = "<div class='s3dContent2DEditorToolbar'>"
            /* 取消显示toolbar按钮
            + "<div class='s3dContent2DEditorToolbarBtn s3dContent2DEditorToolbarMainCloseBtn' title='取消编辑'>&#10006;</div>"
            + "<div class='s3dContent2DEditorToolbarBtn s3dContent2DEditorToolbarBtnMainApplyBtn' title='接受修改'>&#9438;</div>"
            + "<div class='s3dContent2DEditorToolbarBtn s3dContent2DEditorToolbarBtnMainOkBtn' title='确定'>&#10004;</div>"
            */
            + "</div>";
        return html;
    };

    //获取list html
    this.getHtml = function () {
        let html = "<div class='s3dContent2DEditorContainer'>";
        html += "<div class='s3dContent2DEditorInner'>";

        //基本信息
        html += "<div class='s3dContent2DEditorGroupContainer' name='content3D'>";
        html += "<div class='s3dContent2DEditorGroupHeader'><div class='s3dContent2DEditorGroupTitle'>基本信息</div></div>";
        html += "<div class='s3dContent2DEditorSubContainer'>";
        html += "<div class='s3dContent2DEditorItem' name='name'><div class='s3dContent2DEditorItemTitle'>名称</div><div class='s3dContent2DEditorItemValue'><input type='text' class='s3dContent2DEditorItemInput'></div></div>";
        html += "<div class='s3dContent2DEditorItem' name='image'><div class='s3dContent2DEditorItemTitle'>图片</div><div class='s3dContent2DEditorItemValue'><input type='text' readonly class='s3dContent2DEditorItemInput s3dContent2DEditorItemInputReadonly' ><div class='s3dContent2DEditorItemPop'>&#x273F;</div></div></div>";
        html += "<div class='s3dContent2DEditorItem' name='event'><div class='s3dContent2DEditorItemTitle'>事件</div><div class='s3dContent2DEditorItemValue'><input type='text' readonly class='s3dContent2DEditorItemInput s3dContent2DEditorItemInputReadonly' ><div class='s3dContent2DEditorItemPop'>&#x21AF;</div></div></div>";
        html += "</div>";
        html += "</div>";

        //3D内容
        html += "<div class='s3dContent2DEditorGroupContainer' name='content3D'>";
        html += "<div class='s3dContent2DEditorGroupHeader'><div class='s3dContent2DEditorGroupTitle'>3D内容</div></div>";
        html += "<div class='s3dContent2DEditorSubContainer'>";
        html += "<div class='s3dContent2DEditorItem' name='camera'><div class='s3dContent2DEditorItemTitle'>相机</div><div class='s3dContent2DEditorItemValue'><input type='text' readonly class='s3dContent2DEditorItemInput s3dContent2DEditorItemInputReadonly' ><div class='s3dContent2DEditorItemPop'>&#x398;</div></div></div>";
        html += "<div class='s3dContent2DEditorItem' name='objectVisible'><div class='s3dContent2DEditorItemTitle'>可见物体</div><div class='s3dContent2DEditorItemValue'><input type='text' readonly class='s3dContent2DEditorItemInput s3dContent2DEditorItemInputReadonly' ><div class='s3dContent2DEditorItemPop'>&#x273E;</div></div></div>";
        html += "<div class='s3dContent2DEditorItem' name='sky'><div class='s3dContent2DEditorItemTitle'>天空盒</div><div class='s3dContent2DEditorItemValue'><input type='text' readonly class='s3dContent2DEditorItemInput s3dContent2DEditorItemInputReadonly' ><div class='s3dContent2DEditorItemPop'>&#x2601;</div></div></div>";
        html += "<div class='s3dContent2DEditorItem' name='animation'><div class='s3dContent2DEditorItemTitle'>动画</div><div class='s3dContent2DEditorItemValue'><input type='text' readonly class='s3dContent2DEditorItemInput s3dContent2DEditorItemInputReadonly' ><div class='s3dContent2DEditorItemPop'>&#x2708;</div></div></div>";
        html += "</div>";
        html += "</div>";

        //2D内容
        html += "<div class='s3dContent2DEditorGroupContainer' name='content2D'>";
        html += "<div class='s3dContent2DEditorGroupHeader'><div class='s3dContent2DEditorGroupTitle'>2D内容</div></div>";
        html += "<div class='s3dContent2DEditorSubContainer'></div>";
        html += "</div>";

        html += "</div>";
        html += "</div>";
        return html;
    };

    this.getEditingInfoFromUI = function () {
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let nameItem = $(editContainer).find(".s3dContent2DEditorItem[name='name']");
        let pageName = $(nameItem).find(".s3dContent2DEditorItemInput").val();
        let moduleCode = $(nameItem).attr("moduleCode");
        let themeCode = $(nameItem).attr("themeCode");
        let index = $(nameItem).attr("index");
        let imageItem = $(editContainer).find(".s3dContent2DEditorItem[name='image']");
        let imageName = $(imageItem).find(".s3dContent2DEditorItemInput").val();
        let editingInfo = {
            code: thatContent2DEditor.editingPageCode,
            name: pageName,
            imageName: imageName,
            moduleCode: moduleCode,
            themeCode: themeCode,
            index: index,
            itemMap: {},
            eventMap: {},
            states: [],
            animations: [],
            camera: null
        };

        let eventItem = $(editContainer).find(".s3dContent2DEditorItem[name='event']");
        let eventMapJsonStr = $(eventItem).attr("eventMapJson");
        if(eventMapJsonStr != null && eventMapJsonStr.length > 0){
            let eventMapJson = cmnPcr.strToJson(eventMapJsonStr);
            for(let eventName in eventMapJson){
                let eventInfo = eventMapJson[eventName];
                editingInfo.eventMap[eventName] = eventInfo;
            }
        }

        let animationItem = $(editContainer).find(".s3dContent2DEditorItem[name='animation']");
        let animationJsonStr = $(animationItem).attr("animationJson");
        if (animationJsonStr != null && animationJsonStr.length > 0) {
            let animationJsons = cmnPcr.strToJson(animationJsonStr);
            for (let i = 0; i < animationJsons.length; i++) {
                let animationJson = animationJsons[i];
                editingInfo.animations.push({
                    code: animationJson.code,
                    loop: animationJson.loop
                });
            }
        }

        let objectVisibleItem = $(editContainer).find(".s3dContent2DEditorItem[name='objectVisible']");
        let objectVisibleStr = $(objectVisibleItem).attr("objectVisibleJson");
        if (objectVisibleStr != null && objectVisibleStr.length > 0) {
            let objectVisibleJsons = cmnPcr.strToJson(objectVisibleStr);
            for (let i = 0; i < objectVisibleJsons.length; i++) {
                let objectVisibleJson = objectVisibleJsons[i];
                editingInfo.states.push({
                    objectId: objectVisibleJson.objectId,
                    visible: objectVisibleJson.visible
                });
            }
        }

        let skyItem = $(editContainer).find(".s3dContent2DEditorItem[name='sky']");
        let skyInfoStr = $(skyItem).attr("skyInfoJson");
        if (skyInfoStr != null && skyInfoStr.length > 0) {
            let skyInfoJson = cmnPcr.strToJson(skyInfoStr);
            editingInfo.sky = {
                name: skyInfoJson.name,
                scale: skyInfoJson.scale,
                rotation: skyInfoJson.rotation,
                backgroundColor: skyInfoJson.backgroundColor,
                backgroundImage: skyInfoJson.backgroundImage
            };
        }

        let cameraItem = $(editContainer).find(".s3dContent2DEditorItem[name='camera']");
        let cameraInfoStr = $(cameraItem).attr("cameraInfoJson");
        if (cameraInfoStr != null && cameraInfoStr.length > 0) {
            let cameraInfoJson = cmnPcr.strToJson(cameraInfoStr);
            editingInfo.camera = {
                target: cameraInfoJson.target,
                position: cameraInfoJson.position,
                zoom: cameraInfoJson.zoom
            };
        }

        let itemContainer = $(editContainer).find(".s3dContent2DEditorInner .s3dContent2DEditorGroupContainer[name='content2D'] .s3dContent2DEditorSubContainer");
        let allItems = $(itemContainer).find(".s3dContent2DEditorItem");
        for (let i = 0; i < allItems.length; i++) {
            let item = allItems[i];
            let itemCode = $(item).attr("itemCode");
            let itemValue = thatContent2DEditor.manager.screen2D.getContent2DItemValue(itemCode);
            let itemInfo = {
                code: itemCode,
                value: itemValue
            };
            editingInfo.itemMap[itemCode] = itemInfo;
        }

        return editingInfo;
    };

    this.convertToPageInfo = function (editingInfo) {
        let pageInfo = {
            code: editingInfo.code,
            name: editingInfo.name,
            imageName: editingInfo.imageName,
            themeCode: editingInfo.themeCode,
            moduleCode: editingInfo.moduleCode,
            index: editingInfo.index,
            itemMap: {},
            states: [],
            animations: [],
            camera: null
        };

        if(editingInfo.eventMap != null){
            for(let eventName in editingInfo.eventMap){
                let editingEventInfo = editingInfo.eventMap[eventName];
                pageInfo.eventMap[eventName] = editingEventInfo;
            }
        }

        for (let itemCode in editingInfo.itemMap) {
            let editingItem = editingInfo.itemMap[itemCode];
            let itemInfo = {
                code: editingItem.code,
                value: editingItem.value
            };
            pageInfo.itemMap[itemCode] = itemInfo;
        }
        for (let i = 0; i < editingInfo.states.length; i++) {
            let editingState = editingInfo.states[i];
            let state = {
                objectId: editingState.objectId,
                visible: editingState.visible
            };
            pageInfo.states.push(state);
        }

        for (let i = 0; i < editingInfo.animations.length; i++) {
            let editingAnimation = editingInfo.animations[i];
            let animation = {
                code: editingAnimation.code,
                loop: editingAnimation.loop
            };
            pageInfo.animations.push(animation);
        }

        if (editingInfo.camera != null) {
            pageInfo.camera = {
                target: [editingInfo.camera.target[0], editingInfo.camera.target[1], editingInfo.camera.target[2]],
                position: [editingInfo.camera.position[0], editingInfo.camera.position[1], editingInfo.camera.position[2]],
                zoom: editingInfo.camera.zoom
            };
        }

        if (editingInfo.sky != null) {
            pageInfo.sky = {
                name: editingInfo.sky.name,
                scale: editingInfo.sky.scale,
                rotation: editingInfo.sky.rotation,
                backgroundColor: editingInfo.sky.backgroundColor,
                backgroundImage: editingInfo.sky.backgroundImage
            };
        }
        return pageInfo;
    };

    this.convertToEditingInfo = function (pageInfo) {
        let editingInfo = {
            code: pageInfo.code,
            themeCode: pageInfo.themeCode,
            moduleCode: pageInfo.moduleCode,
            name: pageInfo.name,
            imageName: pageInfo.imageName,
            index: pageInfo.index,
            itemMap: {},
            eventMap: {},
            states: [],
            animations: [],
            camera: null,
            errors: []
        };

        if(pageInfo.eventMap != null){
            for(let eventName in pageInfo.eventMap){
                let eventInfo = pageInfo.eventMap[eventName];
                editingInfo.eventMap[eventName] = eventInfo;
            }
        }

        for (let itemCode in pageInfo.itemMap) {
            let item = pageInfo.itemMap[itemCode];
            let editingItemInfo = {
                code: item.code,
                value: item.value
            };
            editingInfo.itemMap[itemCode] = editingItemInfo;
        }

        if(pageInfo.states != null) {
            for (let i = 0; i < pageInfo.states.length; i++) {
                let state = pageInfo.states[i];
                let editingState = {
                    objectId: state.objectId,
                    visible: state.visible
                };
                editingInfo.states.push(editingState);
            }
        }

        if(pageInfo.animations != null) {
            for (let i = 0; i < pageInfo.animations.length; i++) {
                let animation = pageInfo.animations[i];
                let editingAnimation = {
                    code: animation.code,
                    loop: animation.loop
                };
                editingInfo.animations.push(editingAnimation);
            }
        }

        if (pageInfo.camera != null) {
            editingInfo.camera = {};
            if (pageInfo.camera.zoom != null) {
                editingInfo.camera.zoom = pageInfo.camera.zoom;
            }
            if (pageInfo.camera.target != null) {
                editingInfo.camera.target = [pageInfo.camera.target[0], pageInfo.camera.target[1], pageInfo.camera.target[2]];
            }
            if (pageInfo.camera.position != null) {
                editingInfo.camera.position = [pageInfo.camera.position[0], pageInfo.camera.position[1], pageInfo.camera.position[2]];
            }
        }
        if (pageInfo.sky != null) {
            editingInfo.sky = {
                name: pageInfo.sky.name,
                scale: pageInfo.sky.scale,
                rotation: pageInfo.sky.rotation,
                backgroundColor: pageInfo.sky.backgroundColor,
                backgroundImage: pageInfo.sky.backgroundImage
            };
        }
        return editingInfo;
    };

    this.showSelectAnimationWindow = function (){
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let animationItem = $(editContainer).find(".s3dContent2DEditorItem[name='animation']");
        let animationJsonStr = $(animationItem).attr("animationJson");
        let animationJsons = [];
        if(animationJsonStr != null && animationJsonStr.length > 0){
            animationJsons = cmnPcr.strToJson(animationJsonStr);
        }

        let popContainer = new PopupContainer({
            width: 500,
            height: 400,
            top: 50,
            canClose: true,
            title: "选择动画",
            containerId: thatContent2DEditor.containerId
        });
        popContainer.show();
        let innerHtml = thatContent2DEditor.getAnimationSelectHtml(animationJsons);
        $("#" + popContainer.contentId).html(innerHtml);

        thatContent2DEditor.setAnimationSelectValues(popContainer, animationJsons);
        thatContent2DEditor.bindAnimationSelectEvents(popContainer);
    }

    this.getAnimationSelectHtml = function () {
        let html = "<div class='s3dContent2DEditorAnimationSelectContainer'>";

        //已选择的动画条目列表
        html += "<div class='s3dContent2DEditorAnimationSelectInnerContainer'>";
        html += "<div class='s3dContent2DEditorAnimationSelectHeader'>";
        html += "<div class='s3dContent2DEditorAnimationSelectHeaderTitle s3dContent2DEditorAnimationSelectHeaderTitleName'>名称</div>";
        html += "<div class='s3dContent2DEditorAnimationSelectHeaderTitle s3dContent2DEditorAnimationSelectHeaderTitleLoop'>循环执行</div>";
        html += "<div class='s3dContent2DEditorAnimationSelectHeaderTitle s3dContent2DEditorAnimationSelectHeaderTitleOperate'>操作</div>";
        html += "</div>";
        html += "<div class='s3dContent2DEditorAnimationSelectListContainer'></div>";
        html += "</div>";

        //底部
        html += "<div class='s3dContent2DEditorAnimationSelectBottomContainer'><div class='s3dContent2DEditorAnimationSelectBtn s3dContent2DEditorAnimationSelectBtnAddItem' name='addItem'>添加动画</div><div class='s3dContent2DEditorAnimationSelectBtn s3dContent2DEditorAnimationSelectBtnOk' name='ok'>确定</div></div>";

        //关闭container
        html += "</div>";
        return html;
    };

    this.bindAnimationSelectEvents = function (popContainer) {
        let eventEditContainer = $("#" + popContainer.contentId).find(".s3dContent2DEditorAnimationSelectContainer");
        $(eventEditContainer).find(".s3dContent2DEditorAnimationSelectBtn[name='ok']").click(function () {
            let animationSelectContainer = $("#" + popContainer.contentId).find(".s3dContent2DEditorAnimationSelectContainer");
            let itemElements = $(animationSelectContainer).find(".s3dContent2DEditorAnimationSelectItem");
            let animationJsons = [];
            for (let i = 0; i < itemElements.length; i++) {
                let itemElement = itemElements[i];
                let nameInput = $(itemElement).find(".s3dContent2DEditorAnimationSelectItemInputName");
                let animationCode = $(nameInput).val();
                let loopInput = $(itemElement).find(".s3dContent2DEditorAnimationSelectItemInputLoop");
                let loop = $(loopInput).prop("checked");
                animationJsons.push({
                    code: animationCode,
                    loop: loop
                });
            }
            thatContent2DEditor.showAnimations(animationJsons);
            popContainer.close();
        });
        $(eventEditContainer).find(".s3dContent2DEditorAnimationSelectBtn[name='addItem']").click(function () {
            thatContent2DEditor.addAnimationSelectItem(popContainer);
        });
    };

    this.addAnimationSelectItem = function (popContainer){
        let listContainer = $("#" + popContainer.contentId).find(".s3dContent2DEditorAnimationSelectListContainer");
        let itemId = cmnPcr.createGuid();
        let html = thatContent2DEditor.getAnimationSelectItemHtml(itemId);
        $(listContainer).append(html);

        thatContent2DEditor.addAnimationSelectItemEvents(popContainer, itemId);

        thatContent2DEditor.refreshAnimationSelectNoneItem(popContainer);
    }

    this.addAnimationSelectItemEvents = function (popContainer, itemId) {
        let listContainer = $("#" + popContainer.contentId).find(".s3dContent2DEditorAnimationSelectListContainer");
        let selectItem = $(listContainer).find(".s3dContent2DEditorAnimationSelectItem[itemId='" + itemId + "']");
        $(selectItem).find(".s3dContent2DEditorAnimationSelectItemRemoveBtn").click(function () {
            let selectItem = $(this).parent().parent();
            $(selectItem).remove();
        });
    }

    this.setAnimationSelectValues = function (popContainer, animationJsons) {
        let listContainer = $("#" + popContainer.contentId).find(".s3dContent2DEditorAnimationSelectListContainer");
        let html = thatContent2DEditor.getAnimationSelectNoneItemHtml();
        $(listContainer).append(html);
        let noneItemElement = $(listContainer).find(".s3dContent2DEditorAnimationSelectNoneItem");

        if (animationJsons != null && animationJsons.length > 0) {
            for (let i = 0; i < animationJsons.length; i++) {
                let animationJson = animationJsons[i];
                let itemId = cmnPcr.createGuid();
                let html = thatContent2DEditor.getAnimationSelectItemHtml(itemId, animationJson);
                $(noneItemElement).before(html);
                thatContent2DEditor.addAnimationSelectItemEvents(popContainer, itemId);
            }
        }

        thatContent2DEditor.refreshAnimationSelectNoneItem(popContainer);
    };

    this.refreshAnimationSelectNoneItem = function (popContainer){
        let listContainer = $("#" + popContainer.contentId).find(".s3dContent2DEditorAnimationSelectListContainer");
        let itemElements = $(listContainer).find(".s3dContent2DEditorAnimationSelectItem");
        let noneItemElement = $(listContainer).find(".s3dContent2DEditorAnimationSelectNoneItem");
        if(itemElements.length === 0){
            $(noneItemElement).removeClass("")
        }
        else {
            $(noneItemElement).addClass("s3dContent2DEditorAnimationSelectNoneItemHidden")
        }
    }

    this.getAnimationSelectNoneItemHtml = function (){
        let html = "<div class='s3dContent2DEditorAnimationSelectNoneItem'>暂未选择动画, 请点击\"添加动画\"按钮.</div>";
        return html;
    };

    this.getAnimationSelectItemHtml = function (itemId, animationJson){
        let html = "<div class='s3dContent2DEditorAnimationSelectItem' itemId='" + itemId + "'><select class='s3dContent2DEditorAnimationSelectItemInput s3dContent2DEditorAnimationSelectItemInputName'>";
        let animationInfos = thatContent2DEditor.manager.userAnimations.animationList;
        for(let i = 0; i < animationInfos.length; i++){
            let animationInfo = animationInfos[i];
            html += ("<option value='" + animationInfo.code + "' " + (animationJson != null && animationJson.code === animationInfo.code ? "selected" : "") +">" + cmnPcr.htmlEncode(animationInfo.name) + "</option>");
        }
        html += "</select>";
        html += ("<input type='checkbox' class='s3dContent2DEditorAnimationSelectItemInput s3dContent2DEditorAnimationSelectItemInputLoop' " + (animationJson != null && animationJson.loop ? "checked" : "") + " />");
        html += ("<div class='s3dContent2DEditorAnimationSelectItemInput s3dContent2DEditorAnimationSelectItemInputOperate'><div class='s3dContent2DEditorAnimationSelectItemRemoveBtn'>&#x2715;</div></div>");
        html += "</div>";
        return html;
    }

    this.showPopEditEventWindow = function () {
        let popContainer = new PopupContainer({
            width: 800,
            height: 700,
            top: 50,
            canClose: true,
            title: "编辑事件",
            containerId: thatContent2DEditor.containerId
        });
        popContainer.show();
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let eventItem = $(editContainer).find(".s3dContent2DEditorItem[name='event']");
        let eventMapJsonStr = $(eventItem).attr("eventMapJson");
        let eventMap = (eventMapJsonStr === null || eventMapJsonStr.length === 0 ? {} : cmnPcr.strToJson(eventMapJsonStr));
        let innerHtml = thatContent2DEditor.getEventEditHtml();
        $("#" + popContainer.contentId).html(innerHtml);
        thatContent2DEditor.setEventEditValues(popContainer, eventMap);
        thatContent2DEditor.bindEventEditEvents(popContainer);
    };

    this.setEventEditValues = function (popContainer, eventMap) {
        let eventEditContainer = $("#" + popContainer.contentId).find(".s3dContent2DEditorEventEditContainer");
        if (eventMap != null) {
            for (let eventName in eventMap) {
                let event = eventMap[eventName];
                $(eventEditContainer).find(".s3dContent2DEditorEventEditContentItem[name='" + eventName + "'] .s3dContent2DEditorEventEditItemInput").val(event.jsCode);
            }
        }
    };

    this.bindEventEditEvents = function (popContainer) {
        let eventEditContainer = $("#" + popContainer.contentId).find(".s3dContent2DEditorEventEditContainer");
        $(eventEditContainer).find(".s3dContent2DEditorEventEditItemInput").bind("keydown", function (e) {
            if (e.key === 'Tab') {
                // 阻止默认的焦点切换行为
                e.preventDefault();
                let start = this.selectionStart;
                let end = this.selectionEnd;
                // 获取当前文本区域的内容
                let value = this.value;
                // 在光标位置插入四个空格作为 Tab 字符
                this.value = value.substring(0, start) + '    ' + value.substring(end);
                // 设置新的光标位置
                this.selectionStart = this.selectionEnd = start + 4;
            }
        });
        $(eventEditContainer).find(".s3dContent2DEditorEventEditHeaderItem").click(function () {
            let eventEditContainer = $("#" + popContainer.contentId).find(".s3dContent2DEditorEventEditContainer");
            $(eventEditContainer).find(".s3dContent2DEditorEventEditHeaderItem").removeClass("s3dContent2DEditorEventEditHeaderItemActive");
            $(eventEditContainer).find(".s3dContent2DEditorEventEditContentItem").removeClass("s3dContent2DEditorEventEditContentItemActive");
            let eventName = $(this).attr("name");
            $(eventEditContainer).find(".s3dContent2DEditorEventEditHeaderItem[name='" + eventName + "']").addClass("s3dContent2DEditorEventEditHeaderItemActive");
            $(eventEditContainer).find(".s3dContent2DEditorEventEditContentItem[name='" + eventName + "']").addClass("s3dContent2DEditorEventEditContentItemActive");
        });
        $(eventEditContainer).find(".s3dContent2DEditorEventEditBtn[name='ok']").click(function () {
            let eventEditContainer = $("#" + popContainer.contentId).find(".s3dContent2DEditorEventEditContainer");
            let jsCodeInputs = $(eventEditContainer).find(".s3dContent2DEditorEventEditContentItem .s3dContent2DEditorEventEditItemInput");
            let eventMap = {};
            for (let i = 0; i < jsCodeInputs.length; i++) {
                let jsCodeInput = jsCodeInputs[i];
                let eventName = $(jsCodeInput).parent().attr("name");
                let jsCode = $(jsCodeInput).val().trim();
                if (jsCode.length > 0) {
                    eventMap[eventName] = {
                        name: eventName,
                        jsCode: jsCode
                    };
                }
            }
            thatContent2DEditor.showEventSummary(eventMap);
            popContainer.close();
        });
    };

    this.getEventEditHtml = function () {
        let html = "<div class='s3dContent2DEditorEventEditContainer'>" + "<div class='s3dContent2DEditorEventEditInnerContainer'>";

        //标题栏
        html += "<div class='s3dContent2DEditorEventEditHeader'>";
        for (let i = 0; i < thatContent2DEditor.eventList.length; i++) {
            let eventInfo = thatContent2DEditor.eventList[i];
            html += "<div class='s3dContent2DEditorEventEditHeaderItem" + (i === 0 ? " s3dContent2DEditorEventEditHeaderItemActive" : "") + "' name='" + eventInfo.name + "'>" + "<div class='s3dContent2DEditorEventEditHeaderItemTitle'>" + cmnPcr.htmlEncode(eventInfo.text) + "</div>" + "</div>";
        }
        html += "</div>";

        //事件代码
        html += "<div class='s3dContent2DEditorEventEditContentContainer'>";
        for (let i = 0; i < thatContent2DEditor.eventList.length; i++) {
            let eventInfo = thatContent2DEditor.eventList[i];
            let parameterStr = "";
            for (let j = 0; j < eventInfo.parameters.length; j++) {
                if (j !== 0) {
                    parameterStr += ", ";
                }
                parameterStr += eventInfo.parameters[j].name;
            }
            html += "<div class='s3dContent2DEditorEventEditContentItem" + (i === 0 ? " s3dContent2DEditorEventEditContentItemActive" : "") + "' name='" + eventInfo.name + "'>" + "<div class='s3dContent2DEditorEventEditItemInputPrefix'>function " + eventInfo.name + "(" + parameterStr + ") {</div>" + "<textarea class='s3dContent2DEditorEventEditItemInput'></textarea>" + "<div class='s3dContent2DEditorEventEditItemInputPostfix'>}</div>" + "</div>";
        }
        html += "</div>";

        //关闭innerContainer
        html += "</div>";

        //底部
        html += "<div class='s3dContent2DEditorEventEditBottomContainer'>" + "<div class='s3dContent2DEditorEventEditBtn' name='ok'>确定</div>" + "</div>";

        //关闭container
        html += "</div>";
        return html;
    };

    this.clearPage = function () {
        thatContent2DEditor.showName("", "", "");
        thatContent2DEditor.clearImageName();
        thatContent2DEditor.clearEventSummary();
        thatContent2DEditor.clearItems();
        thatContent2DEditor.clearCamera();
        thatContent2DEditor.clearSky();
        thatContent2DEditor.clearStates();
        thatContent2DEditor.clearAnimations();
        thatContent2DEditor.clearContentInScreen2D();
    };

    this.showPage = function (pageCode) {
        //保存之前編輯的页面
        if(thatContent2DEditor.editingPageCode != null){
            thatContent2DEditor.applyPage();
        }

        //打开需要编辑的页面
        let pageInfo = thatContent2DEditor.manager.userContent2D.getPageInfo(pageCode);
        if (pageInfo == null) {
            thatContent2DEditor.clearPage();
            thatContent2DEditor.editingPageCode = null;
        }
        else {
            thatContent2DEditor.editingPageCode = pageInfo.code;
            thatContent2DEditor.manager.localContent2D.getPageRefJson({
                themeCode: pageInfo.themeCode,
                moduleCode: pageInfo.moduleCode,
                afterGetPageRefJson: function (p){
                    thatContent2DEditor.refJson = p.refJson;
                    thatContent2DEditor.initPageUIInfo();
                }
            });

            thatContent2DEditor.manager.localContent2D.getPageHtml({
                themeCode: pageInfo.themeCode,
                moduleCode: pageInfo.moduleCode,
                afterGetPageHtml: function (p){
                    thatContent2DEditor.moduleHtml = p.moduleHtml;
                    thatContent2DEditor.initPageUIInfo();
                }
            });
        }
    };

    this.initPageUIInfo = function () {
        if (thatContent2DEditor.moduleHtml != null && thatContent2DEditor.refJson != null) {
            let moduleHtml = thatContent2DEditor.moduleHtml;
            let refJson = thatContent2DEditor.refJson;
            let pageInfo = thatContent2DEditor.manager.userContent2D.getPageInfo(thatContent2DEditor.editingPageCode);
            let editingInfo = thatContent2DEditor.convertToEditingInfo(pageInfo);
            if (editingInfo.errors.length !== 0) {
                msgBox.alert({
                    info: cmnPcr.arrayToString(pageInfo.errors, "\r\n")
                });
            }
            thatContent2DEditor.showName(editingInfo.name, editingInfo.themeCode, editingInfo.moduleCode, editingInfo.index);
            thatContent2DEditor.showImageName(editingInfo.imageName);
            thatContent2DEditor.showEventSummary(editingInfo.eventMap);
            thatContent2DEditor.showCamera(editingInfo.camera);
            thatContent2DEditor.showSky(editingInfo.sky);
            thatContent2DEditor.showStates(editingInfo.states);
            thatContent2DEditor.showAnimations(editingInfo.animations);
            thatContent2DEditor.showItems(editingInfo, moduleHtml, refJson);
            thatContent2DEditor.lastOperateInfo = {
                editingInfo: editingInfo
            };
        }
    };

    this.refreshEditing = function (editingInfo) {
        thatContent2DEditor.closeMenu();
        thatContent2DEditor.showName("");
        thatContent2DEditor.clearImageName();
        thatContent2DEditor.clearEventSummary();
        thatContent2DEditor.clearItems();
        thatContent2DEditor.clearCamera();
        thatContent2DEditor.clearSky();
        thatContent2DEditor.clearStates();
        thatContent2DEditor.clearAnimations();
        thatContent2DEditor.clearContentInScreen2D();
    };

    this.clearItems = function () {
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let itemContainer = $(editContainer).find(".s3dContent2DEditorInner .s3dContent2DEditorGroupContainer[name='content2D'] .s3dContent2DEditorSubContainer");
        $(itemContainer).empty();
    };

    this.clearImageName = function () {
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let imageItem = $(editContainer).find(".s3dContent2DEditorItem[name='image']");
        let itemInput = $(imageItem).find(".s3dContent2DEditorItemInput");
        $(itemInput).val("");
    };

    this.clearEventSummary = function () {
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let eventItem = $(editContainer).find(".s3dContent2DEditorItem[name='event']");
        let itemInput = $(eventItem).find(".s3dContent2DEditorItemInput");
        $(itemInput).val("");
    };

    this.clearCamera = function () {
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let cameraInfoItem = $(editContainer).find(".s3dContent2DEditorItem[name='camera']");
        $(cameraInfoItem).attr("cameraInfoJson", "");
        let itemInput = $(cameraInfoItem).find(".s3dContent2DEditorItemInput");
        $(itemInput).val("");
    };

    this.clearSky = function () {
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let skyInfoItem = $(editContainer).find(".s3dContent2DEditorItem[name='sky']");
        $(skyInfoItem).attr("skyInfoJson", "");
        let itemInput = $(skyInfoItem).find(".s3dContent2DEditorItemInput");
        $(itemInput).val("");

        let skyInfo = thatContent2DEditor.manager.s3dObject.scene.sky;
        thatContent2DEditor.manager.skyBox.setSkyInfo(skyInfo);
    };

    this.clearStates = function () {
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let objectVisibleItem = $(editContainer).find(".s3dContent2DEditorItem[name='objectVisible']");
        $(objectVisibleItem).attr("objectVisibleJson", "");
        let itemInput = $(objectVisibleItem).find(".s3dContent2DEditorItemInput");
        $(itemInput).val("");
    };


    this.clearAnimations = function () {
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let animationItem = $(editContainer).find(".s3dContent2DEditorItem[name='animation']");
        $(animationItem).attr("animationJson", "");
        let itemInput = $(animationItem).find(".s3dContent2DEditorItemInput");
        $(itemInput).val("");
    };

    this.clearContentInScreen2D = function () {
        thatContent2DEditor.manager.screen2D.clearContent2D();
    };

    this.showName = function (name, themeCode, moduleCode, index) {
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let nameItem = $(editContainer).find(".s3dContent2DEditorItem[name='name']");
        $(nameItem).find(".s3dContent2DEditorItemInput").val(name);
        $(nameItem).attr("lastValue", name);
        $(nameItem).attr("themeCode", themeCode);
        $(nameItem).attr("moduleCode", moduleCode);
        $(nameItem).attr("index", index);
    };

    this.showImageName = function (imageName) {
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let imageItem = $(editContainer).find(".s3dContent2DEditorItem[name='image']");
        $(imageItem).find(".s3dContent2DEditorItemInput").val(imageName);
    };

    this.showEventSummary = function (eventMap) {
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let eventItem = $(editContainer).find(".s3dContent2DEditorItem[name='event']");

        let eventMapJsonStr = cmnPcr.jsonToStr(eventMap);
        $(eventItem).attr("eventMapJson", eventMapJsonStr);

        let eventSummary = "";
        if(eventMap != null){
            for(let i = 0; i < thatContent2DEditor.eventList.length; i++){
                let eventInfo = thatContent2DEditor.eventList[i];
                if(eventMap[eventInfo.name]){
                    eventSummary += ((eventSummary.length === 0 ? "" : "; " ) + eventInfo.text);
                }
            }
        }
        $(eventItem).find(".s3dContent2DEditorItemInput").val(eventSummary);
    };

    this.showItems = function (editingInfo, moduleHtml, refJson) {

        thatContent2DEditor.manager.localContent2D.showPageInScreen2D({
            pageInfo: editingInfo,
            moduleHtml: moduleHtml,
            refJson: refJson
        });

        let content2DContainer = thatContent2DEditor.manager.screen2D.getContent2DContainer();
        let itemElements = $(content2DContainer).find("[s3dEditable='true']");
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let editSubContainer = $(editContainer).find(".s3dContent2DEditorInner .s3dContent2DEditorGroupContainer[name='content2D'] .s3dContent2DEditorSubContainer");
        let html = "";
        for (let i = 0; i < itemElements.length; i++) {
            let itemElement = itemElements[i];
            let itemCode = $(itemElement).attr("itemCode");
            let itemName = $(itemElement).attr("itemName");
            html += "<div class='s3dContent2DEditorItem' itemCode='" + itemCode + "'>" + " <div class='s3dContent2DEditorItemTitle'>" + cmnPcr.htmlEncode(itemName) + "</div>" + "<div class='s3dContent2DEditorItemValue'><input class='s3dContent2DEditorItemInput' ></div>" + "</div>";
        }
        $(editSubContainer).html(html);
        for (let i = 0; i < itemElements.length; i++) {
            let itemElement = itemElements[i];
            let itemCode = $(itemElement).attr("itemCode");
            let itemInfo = editingInfo.itemMap[itemCode];
            let itemValue = itemInfo == null ? $(itemElement).text() : itemInfo.value;
            $(editSubContainer).find(".s3dContent2DEditorItem[itemCode='" + itemCode + "'] .s3dContent2DEditorItemInput").val(itemValue);
            thatContent2DEditor.manager.screen2D.updateContent2DItem({
                code: itemCode,
                value: itemValue
            });
        }
        $(editSubContainer).find(".s3dContent2DEditorItem .s3dContent2DEditorItemInput").change(function () {
            let editItem = $(this).parent().parent();
            let itemCode = $(editItem).attr("itemCode");
            let itemValue = $(this).val();
            thatContent2DEditor.manager.screen2D.updateContent2DItem({
                code: itemCode,
                value: itemValue
            });
        });
    };

    this.showCamera = function (cameraInfo) {
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let animationItem = $(editContainer).find(".s3dContent2DEditorItem[name='camera']");
        let cameraInfoStr = "";
        if (cameraInfo != null && cameraInfo.zoom != null && cameraInfo.position != null && cameraInfo.target != null) {
            let cameraInfoJsonStr = cmnPcr.jsonToStr(cameraInfo);
            $(animationItem).attr("cameraInfoJson", cameraInfoJsonStr);
            thatContent2DEditor.manager.viewer.setViewport(cameraInfo.target, cameraInfo.position, cameraInfo.zoom);

            cameraInfoStr += ("位置: (" + cameraInfo.position[0] + "," + cameraInfo.position[1] + "," + cameraInfo.position[2] + "); ");
            cameraInfoStr += ("目标: (" + cameraInfo.target[0] + "," + cameraInfo.target[1] + "," + cameraInfo.target[2] + "); ");
            cameraInfoStr += ("缩放: " + cameraInfo.zoom + "");
        }
        else{
            cameraInfoStr = "未设定";
        }

        let itemInput = $(animationItem).find(".s3dContent2DEditorItemInput");
        $(itemInput).val(cameraInfoStr);
    };

    this.showSky = function (skyInfo) {
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let skyItem = $(editContainer).find(".s3dContent2DEditorItem[name='sky']");
        let skyInfoStr = "";
        if (skyInfo != null) {
            let skyInfoJsonStr = cmnPcr.jsonToStr(skyInfo);
            $(skyItem).attr("skyInfoJson", skyInfoJsonStr);
            thatContent2DEditor.manager.skyBox.setSkyInfo(skyInfo, true);

            skyInfoStr += ("名称: " + skyInfo.name + "; ");
            skyInfoStr += ("缩放: " + skyInfo.scale + "; ");
            skyInfoStr += ("旋转: " + skyInfo.rotation + "; ");
            skyInfoStr += ("背景色: " + (skyInfo.backgroundColor == null ? "无" : cmnPcr.getColorStr(skyInfo.backgroundColor))  + "; ");
            skyInfoStr += ("背景图: " + (skyInfo.backgroundImage == null || skyInfo.backgroundImage.length === 0 ? "无" : skyInfo.backgroundImage) + "");
        }
        else{
            skyInfoStr = "未设定";
        }

        let itemInput = $(skyItem).find(".s3dContent2DEditorItemInput");
        $(itemInput).val(skyInfoStr);
    }

    this.showStates = function (states) {
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let objectVisibleItem = $(editContainer).find(".s3dContent2DEditorItem[name='objectVisible']");
        let objectVisibleJsonStr = cmnPcr.jsonToStr(states);
        $(objectVisibleItem).attr("objectVisibleJson", objectVisibleJsonStr);
        let displayObjectIds = [];
        let hiddenObjectIds = [];
        let objectVisibleStr = "";
        if(states.length > 0) {
            for (let i = 0; i < states.length; i++) {
                let stateInfo = states[i];
                if (stateInfo.visible) {
                    displayObjectIds.push(stateInfo.objectId);
                    let object3D = thatContent2DEditor.manager.viewer.getObject3DById(stateInfo.objectId);
                    if(object3D != null){
                        let unitInfo = object3D.userData.info;
                        objectVisibleStr += ((objectVisibleStr.length === 0 ? "" : "; ") + unitInfo.name);
                    }
                }
                else {
                    hiddenObjectIds.push(stateInfo.objectId);
                }
            }
        }
        else{
            objectVisibleStr = "未设定";
        }
        thatContent2DEditor.manager.viewer.setObject3DsVisible(displayObjectIds, true);
        thatContent2DEditor.manager.viewer.setObject3DsVisible(hiddenObjectIds, false);
        thatContent2DEditor.manager.treeEditor.refreshAllNodeCheckStatus();

        let itemInput = $(objectVisibleItem).find(".s3dContent2DEditorItemInput");
        $(itemInput).val(objectVisibleStr);
    };

    this.showAnimations = function (animations) {
        let editContainer = $("#" + thatContent2DEditor.containerId).find(".s3dContent2DEditorContainer");
        let animationItem = $(editContainer).find(".s3dContent2DEditorItem[name='animation']");
        let animationJsonStr = cmnPcr.jsonToStr(animations);
        $(animationItem).attr("animationJson", animationJsonStr);
        let animationStr = "";
        if(animations != null && animations.length > 0) {
            for (let i = 0; i < animations.length; i++) {
                let animationJson = animations[i];
                let animationInfo = thatContent2DEditor.manager.userAnimations.getAnimationInfo(animationJson.code);
                animationStr += ((animationStr.length === 0 ? "" : "; ") + animationInfo.name + (animationJson.loop ? ("(循环)") : ""));
            }
        }
        else{
            animationStr = "未设定";
        }

        let itemInput = $(animationItem).find(".s3dContent2DEditorItemInput");
        $(itemInput).val(animationStr);
    };

    this.applyPage = function () {
        if(thatContent2DEditor.editingPageCode != null) {
            let editingInfo = thatContent2DEditor.getEditingInfoFromUI();
            let newPageInfo = thatContent2DEditor.convertToPageInfo(editingInfo);
            if (newPageInfo.name.length === 0) {
                msgBox.alert({
                    info: "请录入页面名称"
                });
            } else if (thatContent2DEditor.manager.userContent2D.checkSameNamePage(newPageInfo.code, newPageInfo.name)) {
                msgBox.alert({
                    info: "存在重名的页面"
                });
            } else {
                let oldPageInfo = thatContent2DEditor.manager.userContent2D.getPageInfo(newPageInfo.code);
                thatContent2DEditor.manager.content2DList.beginAddToUndoList(s3dContent2DEditType.edit, oldPageInfo.code, oldPageInfo);
                thatContent2DEditor.manager.userContent2D.updatePage(newPageInfo);
                thatContent2DEditor.manager.content2DList.refreshPage(newPageInfo.code);
                thatContent2DEditor.manager.content2DList.endAddToUndoList(s3dContent2DEditType.edit, newPageInfo.code, newPageInfo);
                return newPageInfo;
            }
        }
    };

    this.closePage = function (hasConfirm) {
        if (!hasConfirm || msgBox.confirm({
            info: "取消编辑吗?"
        })) {
            thatContent2DEditor.manager.layout.hideBlock("content2DEditor");
            thatContent2DEditor.clearPage();
        }
    };

    this.savePage = function () {
        let newPageInfo = thatContent2DEditor.applyPage();
        if (newPageInfo) {
            thatContent2DEditor.manager.layout.hideBlock("content2DEditor");
            thatContent2DEditor.clearPage();
        }
    };

    this.closeMenu = function () {
        let container = $("#" + thatContent2DEditor.containerId);
        $(container).find(".s3dContent2DEditorMenuOuterContainer").remove();
    };

    this.addEditingToUndoList = function (editType) {
        let beginDoOtherInfo = {
            editType: editType,
            editingInfo: thatContent2DEditor.lastOperateInfo.editingInfo
        };
        thatContent2DEditor.manager.statusBar.beginAddToUndoList({
            operateType: s3dOperateType.content2D,
            otherInfo: beginDoOtherInfo
        });
        let editingInfo = thatContent2DEditor.getEditingInfoFromUI();
        let endDoOtherInfo = {
            editType: editType,
            editingInfo: editingInfo
        };
        thatContent2DEditor.manager.statusBar.endAddToUndoList({
            operateType: s3dOperateType.content2D,
            otherInfo: endDoOtherInfo
        });
        thatContent2DEditor.lastOperateInfo = {
            editingInfo: editingInfo
        };
    }
}

export default S3dContent2DEditor