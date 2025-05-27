import {cmnPcr, PopupContainer, s3dElement3DType} from "../../../commonjs/common/common.js"
import {orbitComponentList} from "../componentList/orbitComponentList.js";
import "../s3dInternalObjectCreator.css"

let S3dOrbitSelector = function (){
    //当前对象
    const thatOrbitSelector = this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;

    //选择窗口
    this.selectorWindow = null;

    //标题
    this.title = "添加相机轨道";

    //新添加物体所属分组ID
    this.groupId = null;

    //事件
    this.eventFunctions = {};
    this.addEventFunction = function(eventName, func){
        let allFuncs = thatOrbitSelector.eventFunctions[eventName];
        if(allFuncs == null){
            allFuncs = [];
            thatOrbitSelector.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    }
    this.doEventFunction = function(eventName, p){
        let allFuncs = thatOrbitSelector.eventFunctions[eventName];
        if(allFuncs != null){
            for(let i = 0; i < allFuncs.length; i++){
                let func = allFuncs[i];
                func(p);
            }
        }
    }

    //初始化
    this.init = function(p){
        thatOrbitSelector.containerId = p.containerId;
        thatOrbitSelector.manager = p.manager;
    }

    //隐藏
    this.hide = function(){
        thatOrbitSelector.selectorWindow.hide();
    }

    //隐藏
    this.show = function(p){
        thatOrbitSelector.groupId = p.groupId;
        if(thatOrbitSelector.selectorWindow == null){
            thatOrbitSelector.initWindow();
            thatOrbitSelector.initComponentList();
        }
        else{
            thatOrbitSelector.selectorWindow.show();
        }
    }

    //获取显示状态
    this.getVisible = function(){
        return $("#" + thatOrbitSelector.containerId).find(".s3dInternalObjectCreatorSelectorContainer").css("display") === "block";
    }

    //初始化html
    this.initWindow = function(){
        let popContainer = new PopupContainer( {
            width : 640,
            height : 180,
            top : 50,
            canClose: false,
            title: thatOrbitSelector.title,
            containerId: thatOrbitSelector.containerId
        });

        popContainer.show();

        let innerHtml = thatOrbitSelector.getHtml();
        $("#" + popContainer.contentId).html(innerHtml);
        thatOrbitSelector.selectorWindow = popContainer;
    }

    //构造html
    this.getHtml = function(){
        return "<div class=\"s3dInternalObjectCreatorSelectorContainer\">"
            + "<div class=\"s3dInternalObjectCreatorSelectorListContainer\" name='orbit'></div>"
            + "</div>";
    }

    //获取构件列表
    this.initComponentList = function(p){
        let componentListHtml = thatOrbitSelector.getComponentListHtml(orbitComponentList);
        let orbitContainer = $("#" + thatOrbitSelector.containerId).find(".s3dInternalObjectCreatorSelectorListContainer[name='orbit']");
        $(orbitContainer).html(componentListHtml);
        $(orbitContainer)[0].scrollTop =  0;

        $(orbitContainer).find(".s3dInternalObjectCreatorSelectorComponentContainer").click(function(){
            let componentName = $(this).attr("componentName");
            let componentId = $(this).attr("componentId");
            let componentCode = $(this).attr("componentCode");
            let versionNum = $(this).attr("versionNum");
            let isServer = $(this).attr("isServer") === "true";
            let isLocal = $(this).attr("isLocal") === "true";
            let isInternal = $(this).attr("isInternal") === "true";
            thatOrbitSelector.addComponent({
                componentName: componentName,
                componentId: componentId,
                componentCode: componentCode,
                versionNum: versionNum,
                isServer: isServer,
                isLocal: isLocal,
                isInternal: isInternal
            });
            thatOrbitSelector.hide();
        });
    }

    //插入构件到当前组
    this.addComponent = function (p) {
        thatOrbitSelector.manager.viewer.cancelSelectObject3Ds();
        thatOrbitSelector.manager.viewer.addNewInternalObject({
            position: null,
            rotation: null,
            scale: null,
            name: p.componentName,
            code: p.componentCode,
            versionNum: p.versionNum,
            isOnGround: true,
            needSelectAfterAdd: true,
            parentId: thatOrbitSelector.groupId,
            parameters: {},
            isServer: false,
            isLocal: false,
            isInternal: true,
            type: s3dElement3DType.orbit
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
                html += thatOrbitSelector.getComponentItemHtml(componentJson);
            }
        }
        return html;
    }

    //获取构件条目html
    this.getComponentItemHtml = function(componentJson){
        let componentName = decodeURIComponent(componentJson.name);
        let componentCode = decodeURIComponent(componentJson.code);
        let versionNum = componentJson.versionNum;
        let imgUrl = componentJson.image == null ? null : (thatOrbitSelector.manager.layout.imagesFolder + "internal/orbit/" + componentJson.image);
        let orbit = "名称: " + componentName + "\r\n编码: " + componentCode + "\r\n版本: " + versionNum;
        return "<div class=\"s3dInternalObjectCreatorSelectorComponentContainer\" title=\"" + orbit + "\"componentName=\"" + componentName + "\" componentCode=\"" + componentCode + "\" versionNum=\"" + versionNum + "\">"
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
export default S3dOrbitSelector