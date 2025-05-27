import {
    cmnPcr,
    s3dElement3DType,
    s3dOperateType,
    s3dUiStatus
} from "../../../commonjs/common/common.js"
import S3dAppSimplePropertyEditor from "./s3dAppSimplePropertyEditor.js"
import "../S3dAppSimpleEditor.css"
import "./S3dAppSimpleTagEditor.css"
import {s3dAppSimpleEditorStatic} from "../s3dAppSimpleEditorStatic.js";
import * as THREE from "three";

//S3dWeb Tag设计
let S3dAppSimpleTagEditor = function (){
    //当前对象
    const thatAppSimpleTagEditor= this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;

    this.dataInfo = null;

    this.editContainer = null;

    this.pageInfo = null;

    this.propertyEditor = null;

    //初始化
    this.init = function(p){
        thatAppSimpleTagEditor.containerId = p.containerId;
        thatAppSimpleTagEditor.manager = p.manager;

        thatAppSimpleTagEditor.manager.viewer.addEventFunction("afterAddNewObject", thatAppSimpleTagEditor.afterAddNewObject);
        thatAppSimpleTagEditor.manager.viewer.addEventFunction("afterRemoveObject", thatAppSimpleTagEditor.afterRemoveObject);
        thatAppSimpleTagEditor.manager.viewer.addEventFunction("onSelectChanged", thatAppSimpleTagEditor.onSelectChanged);
        thatAppSimpleTagEditor.manager.moveHelper.addEventFunction("onObject3DPosRotScaleChanged", thatAppSimpleTagEditor.onObject3DPosRotScaleChanged);
    }

    this.show = function (){
        thatAppSimpleTagEditor.manager.viewer.changeStatus({
            status: s3dUiStatus.normalView
        });

        for(let objectId  in thatAppSimpleTagEditor.manager.viewer.allObject3DMap){
            let object3D = thatAppSimpleTagEditor.manager.viewer.getObject3DById(objectId);
            let unitInfo = object3D.userData.info;
            if(unitInfo.type === s3dElement3DType.tag) {
                object3D.disableSelect = false;
            }
        }
    }

    this.bindItemEvents = function (p) {
        let container = thatAppSimpleTagEditor.editContainer;

        //编辑详情
        $(container).find(".s3dAppSimpleTagEditorPartContainer[name='user']").find(".s3dAppSimpleTagEditorItemTitle").click(function () {
            let tagCode = $(this).parent().parent().attr("tagCode");
            thatAppSimpleTagEditor.editTag(tagCode);
        });

        $(container).find(".s3dAppSimpleTagEditorItem").click(function () {
            let tagCode = $(this).attr("tagCode");
            thatAppSimpleTagEditor.manager.viewer.selectObject3Ds([tagCode]);
        });
        $(container).find(".s3dAppSimpleTagEditorItemBtnClose").click(function () {
            let tagCode = $(this).parent().attr("tagCode");
            thatAppSimpleTagEditor.removeTag(tagCode);
        });
    }

    this.bindEvents = function (p) {
        let container = thatAppSimpleTagEditor.editContainer;
        $(container).find(".s3dAppSimpleTagEditorListHeader").click(function () {
            let partContainer = $(this).parent();
            if ($(partContainer).hasClass("s3dAppSimpleTagEditorPartContainerExpand")) {
                $(partContainer).removeClass("s3dAppSimpleTagEditorPartContainerExpand");
            }
            else {
                $(partContainer).addClass("s3dAppSimpleTagEditorPartContainerExpand");
            }
        });

        $(container).find(".s3dAppSimpleTagEditorToolbarBtnBack").click(function () {
            thatAppSimpleTagEditor.switchSubContainer("list");
            thatAppSimpleTagEditor.propertyEditor = null;
        });

        $(container).find(".s3dAppSimpleTagEditorDetailHeader").click(function () {
            let partContainer = $(this).parent();
            if ($(partContainer).hasClass("s3dAppSimpleTagEditorDetailGroupContainerActive")) {
                $(partContainer).removeClass("s3dAppSimpleTagEditorDetailGroupContainerActive");
            } else {
                $(partContainer).addClass("s3dAppSimpleTagEditorDetailGroupContainerActive");
            }
        });


        $(container).find(".s3dAppSimpleTagEditorListNewPageBtn").click(function () {
            thatAppSimpleTagEditor.addNewTag();
        });
    }

    this.onObject3DPosRotScaleChanged = function (p) {
        if(thatAppSimpleTagEditor.propertyEditor != null) {
            thatAppSimpleTagEditor.propertyEditor.refreshBaseValues(p.objectJson);
        }
    }

    this.onSelectChanged = function (p) {
        if (p.selectedCount === 1) {
            let nodeJson = p.nodeJArray[0];
            let currentTagCode = thatAppSimpleTagEditor.getCurrentTagCode();
            if(currentTagCode !== nodeJson.id) {
                thatAppSimpleTagEditor.focusTag(nodeJson.id);


                let subContainerName = thatAppSimpleTagEditor.getCurrentSubContainerName();
                if (subContainerName === "detail") {
                    thatAppSimpleTagEditor.editTag(nodeJson.id);
                }
            }
        }
    }

    this.afterAddNewObject = function (p){
        switch (p.nodeJson.type){
            case s3dElement3DType.tag: {
                let tagObject = thatAppSimpleTagEditor.manager.viewer.getObject3DById(p.nodeJson.id);
                tagObject.disableSelect = false;
                let tagInfo = tagObject.userData.info;
                thatAppSimpleTagEditor.dataInfo.push(tagInfo.id);
                thatAppSimpleTagEditor.insertTagItem(tagInfo);
                break;
            }
        }
    }

    this.afterRemoveObject = function (p){
        thatAppSimpleTagEditor.switchSubContainer("list");
        let tempTagCodes = [];
        for(let i = 0; i < thatAppSimpleTagEditor.dataInfo.length; i++){
            let tagCode = thatAppSimpleTagEditor.dataInfo[i];
            if(tagCode !== p.nodeId){
                tempTagCodes.push(tagCode);
            }
        }

        let userDataName = s3dAppSimpleEditorStatic.name.userDataName;
        let userDataInfo = thatAppSimpleTagEditor.manager.getUserData(userDataName)
        userDataInfo.tags = tempTagCodes;
        thatAppSimpleTagEditor.dataInfo = tempTagCodes;

        thatAppSimpleTagEditor.removeTagItem(p.nodeId);
    }

    this.addNewTag = function (){
        let parentObject = thatAppSimpleTagEditor.manager.viewer.getObject3DByName(s3dAppSimpleEditorStatic.name.objects);
        let parentUnitInfo = parentObject.userData.info;
        thatAppSimpleTagEditor.manager.internalObjectCreator.showTagSelector({
            groupId: parentUnitInfo.id
        });
    }

    this.focusTag = function (tagCode){
        let container = thatAppSimpleTagEditor.editContainer;
        $(container).find(".s3dAppSimpleTagEditorItem").removeClass("s3dAppSimpleTagEditorItemActive");
        if(tagCode != null) {
            $(container).find(".s3dAppSimpleTagEditorItem[tagCode='" + tagCode + "']").addClass("s3dAppSimpleTagEditorItemActive");
        }
    }

    this.initValues = function (p) {
        thatAppSimpleTagEditor.editContainer = p.editContainer;
        thatAppSimpleTagEditor.dataInfo = p.dataInfo;
        thatAppSimpleTagEditor.pageInfo = p.pageInfo;

        let tagCodes = thatAppSimpleTagEditor.dataInfo;
        thatAppSimpleTagEditor.refreshList(tagCodes);
    }

    this.refreshList = function (tagCodes){
        let tagList = [];
        if(tagCodes != null) {
            for (let i = 0; i < tagCodes.length; i++) {
                let tagCode = tagCodes[i];
                let tagObject = thatAppSimpleTagEditor.manager.viewer.getObject3DById(tagCode);
                let tagInfo = tagObject.userData.info;
                tagList.push(tagInfo);
            }
        }
        let html = thatAppSimpleTagEditor.getTagListHtml(tagList);
        let container = thatAppSimpleTagEditor.editContainer;
        $(container).find(".s3dAppSimpleTagEditorListContainer").html(html);

        thatAppSimpleTagEditor.switchSubContainer("list");
        thatAppSimpleTagEditor.bindItemEvents();
    }

    //获取list html
    this.getHtml = function(){
        let detailContainerId = cmnPcr.createGuid();
        let html = "";
        html += ("<div class='s3dAppSimpleTagEditorContainer'>");

        html += ("<div class='s3dAppSimpleTagEditorSubContainer s3dAppSimpleTagEditorSubContainerActive' name='list'>");
        html += ("<div class='s3dAppSimpleTagEditorPartContainer s3dAppSimpleTagEditorPartContainerExpand' name='user'>");
        html += "<div class='s3dAppSimpleTagEditorListContainer'></div>";
        html += ("<div class='s3dAppSimpleTagEditorListNewItem'><div class='s3dAppSimpleTagEditorListNewPageBtn'><span class='s3dAppSimpleTagEditorListNewPageImage'>&#x2795;</span>新增标注</div></div>");
        html += "</div>";
        html += "</div>";

        html += ("<div class='s3dAppSimpleTagEditorSubContainer' name='detail'>");
        html += ("<div class='s3dAppSimpleTagEditorToolbar'><div class='s3dAppSimpleTagEditorToolbarBtn s3dAppSimpleTagEditorToolbarBtnBack'>&#9668;&nbsp;返回</div></div>");
        html += ("<div class='s3dAppSimpleTagEditorDetailContainer' id='" + detailContainerId + "'></div>");
        html += "</div>";

        html += "</div>";
        return html;
    }

    this.getTagListHtml = function (tagList){
        let html = "";
        if(tagList != null && tagList.length !== 0){
            let sortedList = thatAppSimpleTagEditor.getSortedList(tagList);
            for (let i = 0; i < sortedList.length; i++) {
                let tagInfo = sortedList[i];
                html += thatAppSimpleTagEditor.getTagItemHtml(tagInfo);
            }
        }
        return html;
    }

    this.getTagItemHtml = function (tagInfo){
        let html = "";
        html += ("<div class='s3dAppSimpleTagEditorItem' tagCode='" + tagInfo.id + "'>");
        html += ("<div class='s3dAppSimpleTagEditorItemName'><span class='s3dAppSimpleTagEditorItemTitle'>" + cmnPcr.htmlEncode(tagInfo.name) + "</span></div>");
        html += ("<div class='s3dAppSimpleTagEditorItemBtn s3dAppSimpleTagEditorItemBtnClose'>&#x2716;</div>");
        html += ("</div>");
        return html;
    }

    this.removeTag = function (tagCode){
        thatAppSimpleTagEditor.manager.viewer.removeObjects([tagCode], true);
    }

    this.removeTagItem = function (tagCode){
        let container = thatAppSimpleTagEditor.editContainer;
        let editContainer = $(container).find(".s3dAppSimpleTagEditorContainer");
        $(editContainer).find(".s3dAppSimpleTagEditorItem[tagCode='" + tagCode + "']").remove();
    }

    this.insertTagItem = function (newTagInfo){
        let container = thatAppSimpleTagEditor.editContainer;
        let userTagContainer = $(container).find(".s3dAppSimpleTagEditorContainer").find(".s3dAppSimpleTagEditorPartContainer[name='user'] .s3dAppSimpleTagEditorListContainer");
        let tagItems = $(userTagContainer).find(".s3dAppSimpleTagEditorItem");
        let newTagItemHtml = thatAppSimpleTagEditor.getTagItemHtml(newTagInfo);
        let added = false;
        for(let i = 0; i < tagItems.length; i++){
            let tagItem = tagItems[i];
            let tagCode = $(tagItem).attr("tagCode");
            let tagObject = thatAppSimpleTagEditor.manager.viewer.getObject3DById(tagCode);
            let tagInfo = tagObject.userData.info;
            if(!added && tagInfo.name.localeCompare(tagInfo.name) > 0){
                $(tagItem).before(newTagItemHtml);
                added = true;
            }
        }
        if(!added){
            $(userTagContainer).append(newTagItemHtml);
        }

        let newTagItem = $(userTagContainer).find(".s3dAppSimpleTagEditorItem[tagCode='" + newTagInfo.id + "']");

        $(newTagItem).click(function(){
            let tagCode = $(this).attr("tagCode");
            let tagObject = thatAppSimpleTagEditor.manager.viewer.getObject3DById(tagCode);
            let tagUnitInfo = tagObject.userData.info;
            thatAppSimpleTagEditor.manager.viewer.selectObject3Ds([tagUnitInfo.id]);
        });

        $(newTagItem).find(".s3dAppSimpleTagEditorItemTitle").click(function () {
            let tagCode = $(this).parent().parent().attr("tagCode");
            thatAppSimpleTagEditor.editTag(tagCode);
        });

        $(newTagItem).find(".s3dAppSimpleTagEditorItemBtnClose").click(function () {
            let tagCode = $(this).parent().attr("tagCode");
            thatAppSimpleTagEditor.removeTag(tagCode);
        });
    }

    this.editTag = function (tagCode){
        thatAppSimpleTagEditor.switchSubContainer("detail");
        let container = thatAppSimpleTagEditor.editContainer;
        let detailContainer = $(container).find(".s3dAppSimpleTagEditorDetailContainer");
        let detailContainerId = $(detailContainer).attr("id");

        let propertyEditor = new S3dAppSimplePropertyEditor();
        propertyEditor.init({
            containerId: detailContainerId,
            manager: thatAppSimpleTagEditor.manager,
            objectId: tagCode,
            afterBaseInfoValueChanged: thatAppSimpleTagEditor.afterBaseInfoValueChanged
        });
        thatAppSimpleTagEditor.propertyEditor = propertyEditor;
    }

    this.afterBaseInfoValueChanged = function (p){
        switch (p.propertyName){
            case "name":{
                let container = thatAppSimpleTagEditor.editContainer;
                $(container).find(".s3dAppSimpleTagEditorItem[tagCode='" + p.nodeId + "'] .s3dAppSimpleTagEditorItemTitle").text(p.newValue);
                break;
            }
        }
    }

    this.getUiInfo = function (){
        let container = thatAppSimpleTagEditor.editContainer;
        let detailContainer = $(container).find(".s3dAppSimpleTagEditorDetailContainer")[0];
        return {
            detailScrollTop: detailContainer.scrollTop
        };
    }

    this.switchSubContainer = function (subContainerName){
        let container = thatAppSimpleTagEditor.editContainer;
        $(container).find(".s3dAppSimpleTagEditorSubContainer").removeClass("s3dAppSimpleTagEditorSubContainerActive");
        $(container).find(".s3dAppSimpleTagEditorSubContainer[name='" + subContainerName + "']").addClass("s3dAppSimpleTagEditorSubContainerActive");

        $(container).find(".s3dAppSimpleTagEditorToolbar").removeClass("s3dAppSimpleTagEditorToolbarActive");
        $(container).find(".s3dAppSimpleTagEditorToolbar[name='" + subContainerName + "']").addClass("s3dAppSimpleTagEditorToolbarActive");
    }

    this.getCurrentSubContainerName = function (){
        let container = thatAppSimpleTagEditor.editContainer;
        return $(container).find(".s3dAppSimpleTagEditorSubContainerActive").attr("name");
    }


    this.getCurrentTagCode = function (){
        let container = thatAppSimpleTagEditor.editContainer;
        return $(container).find(".s3dAppSimpleTagEditorItemActive").attr("tagCode");
    }

    this.refreshUILayout = function (uiInfo){
        let container = thatAppSimpleTagEditor.editContainer;
        let detailContainer = $(container).find(".s3dAppSimpleTagEditorDetailContainer")[0];
        detailContainer.scrollTop = uiInfo.detailScrollTop;
    }

    this.getSortedList = function (sourceList){
        let newList = [];
        for(let i = 0; i < sourceList.length; i++){
            let sourceItem = sourceList[i];
            let added = false;
            let tempList = [];
            for(let j = 0; j < newList.length; j++){
                let newItem = newList[j];
                if(!added && newItem.name.localeCompare(sourceItem.name) > 0){
                    tempList.push(sourceItem);
                    added = true;
                }
                tempList.push(newItem);
            }
            if(!added) {
                tempList.push(sourceItem);
            }
            newList = tempList;
        }
        return newList;
    }

    this.addEditingToUndoList = function (editType, targetCode){
        let beginDoOtherInfo = {
            editType: editType,
            targetCode: targetCode
        };
        thatAppSimpleTagEditor.manager.statusBar.beginAddToUndoList({
            operateType: s3dOperateType.edit,
            otherInfo: beginDoOtherInfo
        });

        let endDoOtherInfo= {
            editType: editType,
            targetCode: targetCode
        };
        thatAppSimpleTagEditor.manager.statusBar.endAddToUndoList({
            operateType: s3dOperateType.edit,
            otherInfo: endDoOtherInfo
        });
    }

    //开启添加到undo list
    this.beginAddToUndoList = function(editType, targetCode, tagInfo){
        let doOtherInfo = {
            editType: editType,
            targetCode: targetCode,
            tagInfo: tagInfo
        };
        thatAppSimpleTagEditor.manager.statusBar.beginAddToUndoList({
            operateType: s3dOperateType.edit,
            otherInfo: doOtherInfo
        });
    }

    //结束添加到undo list
    this.endAddToUndoList = function(editType, targetCode, tagInfo) {
        let doOtherInfo = {
            editType: editType,
            targetCode: targetCode,
            tagInfo: tagInfo
        };
        thatAppSimpleTagEditor.manager.statusBar.endAddToUndoList({
            operateType: s3dOperateType.edit,
            otherInfo: doOtherInfo
        });
    }
}

export default S3dAppSimpleTagEditor