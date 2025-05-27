import {cmnPcr, s3dUiStatus, msgBox, PopupContainer, s3dElement3DType} from "../../../commonjs/common/common.js"
import {lightComponentList} from "../componentList/lightComponentList.js";
import "../s3dInternalObjectCreator.css"

let S3dLightSelector = function (){
    //当前对象
    const thatLightSelector = this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;

    //选择窗口
    this.selectorWindow = null;

    //标题
    this.title = "添加光照";

    //新添加物体所属分组ID
    this.groupId = null;

    //事件
    this.eventFunctions = {};
    this.addEventFunction = function(eventName, func){
        let allFuncs = thatLightSelector.eventFunctions[eventName];
        if(allFuncs == null){
            allFuncs = [];
            thatLightSelector.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    }
    this.doEventFunction = function(eventName, p){
        let allFuncs = thatLightSelector.eventFunctions[eventName];
        if(allFuncs != null){
            for(let i = 0; i < allFuncs.length; i++){
                let func = allFuncs[i];
                func(p);
            }
        }
    }

    //初始化
    this.init = function(p){
        thatLightSelector.containerId = p.containerId;
        thatLightSelector.manager = p.manager;
    }

    //隐藏
    this.hide = function(){
        thatLightSelector.selectorWindow.hide();
    }

    //隐藏
    this.show = function(p){
        thatLightSelector.groupId = p.groupId;
        if(thatLightSelector.selectorWindow == null){
            thatLightSelector.initWindow();
            thatLightSelector.initComponentList();
        }
        else{
            thatLightSelector.selectorWindow.show();
        }
    }

    //获取显示状态
    this.getVisible = function(){
        return $("#" + thatLightSelector.containerId).find(".s3dInternalObjectCreatorSelectorContainer").css("display") === "block";
    }

    //初始化html
    this.initWindow = function(){
        let popContainer = new PopupContainer( {
            width : 640,
            height : 180,
            top : 50,
            canClose: false,
            title: thatLightSelector.title,
            containerId: thatLightSelector.containerId
        });

        popContainer.show();

        let innerHtml = thatLightSelector.getHtml();
        $("#" + popContainer.contentId).html(innerHtml);
        thatLightSelector.selectorWindow = popContainer;
    }

    //构造html
    this.getHtml = function(){
        return "<div class=\"s3dInternalObjectCreatorSelectorContainer\">"
            + "<div class=\"s3dInternalObjectCreatorSelectorListContainer\" name='light'></div>"
            + "</div>";
    }

    //获取构件列表
    this.initComponentList = function(p){
        let componentListHtml = thatLightSelector.getComponentListHtml(lightComponentList);
        let lightContainer = $("#" + thatLightSelector.containerId).find(".s3dInternalObjectCreatorSelectorListContainer[name='light']");
        $(lightContainer).html(componentListHtml);
        $(lightContainer)[0].scrollTop =  0;

        $(lightContainer).find(".s3dInternalObjectCreatorSelectorComponentContainer").click(function(){
            let componentName = $(this).attr("componentName");
            let componentId = $(this).attr("componentId");
            let componentCode = $(this).attr("componentCode");
            let versionNum = $(this).attr("versionNum");
            let isServer = $(this).attr("isServer") === "true";
            let isLocal = $(this).attr("isLocal") === "true";
            let isInternal = $(this).attr("isInternal") === "true";
            thatLightSelector.addComponent({
                componentName: componentName,
                componentId: componentId,
                componentCode: componentCode,
                versionNum: versionNum,
                isServer: isServer,
                isLocal: isLocal,
                isInternal: isInternal
            });
            thatLightSelector.hide();
        });
    }

    //插入构件到当前组
    this.addComponent = function (p) {
        thatLightSelector.manager.viewer.cancelSelectObject3Ds();
        thatLightSelector.manager.viewer.addNewInternalObject({
            position: null,
            rotation: null,
            scale: null,
            name: p.componentName,
            code: p.componentCode,
            versionNum: p.versionNum,
            isOnGround: true,
            needSelectAfterAdd: true,
            parentId: thatLightSelector.groupId,
            parameters: {},
            isServer: false,
            isLocal: false,
            isInternal: true,
            type: s3dElement3DType.light
        });
    }

    //获取构件列表html
    this.getComponentListHtml = function(componentJArray){
        let html = "";
        if(componentJArray.length === 0){
            html += ("<div class=\"s3dInternalObjectCreatorSelectorComponentNone\">没有找到该类型组件</div>");
        }
        else{
            for(let i = 0; i < componentJArray.length; i++){
                let componentJson = componentJArray[i];
                html += thatLightSelector.getComponentItemHtml(componentJson);
            }
        }
        return html;
    }

    //获取构件条目html
    this.getComponentItemHtml = function(componentJson){
        let componentName = decodeURIComponent(componentJson.name);
        let componentCode = decodeURIComponent(componentJson.code);
        let versionNum = componentJson.versionNum;
        let imgUrl = componentJson.image == null ? null : (thatLightSelector.manager.layout.imagesFolder + "internal/light/" + componentJson.image);
        let tag = "名称: " + componentName + "\r\n编码: " + componentCode + "\r\n版本: " + versionNum;
        return "<div class=\"s3dInternalObjectCreatorSelectorComponentContainer\" title=\"" + tag + "\"componentName=\"" + componentName + "\" componentCode=\"" + componentCode + "\" versionNum=\"" + versionNum + "\">"
            + "<div class=\"s3dInternalObjectCreatorSelectorComponentImageContainer\">"
            + (imgUrl == null ? ("<div class=\"s3dInternalObjectCreatorSelectorComponentImageText\">无缩略图</div>") : ("<img class=\"s3dInternalObjectCreatorSelectorComponentImage\" src=\"" + imgUrl + "\" />"))
            + "</div>"
            + "<div class=\"s3dInternalObjectCreatorSelectorComponentHeader\">"
            + "<div class=\"s3dInternalObjectCreatorSelectorComponentHeaderBackground\">&nbsp;</div>"
            + ("<div class=\"s3dInternalObjectCreatorSelectorComponentTitle\">" + cmnPcr.htmlEncode(componentName) + "</div>")
            + "</div>"
            + "</div>";
    }
}
export default S3dLightSelector