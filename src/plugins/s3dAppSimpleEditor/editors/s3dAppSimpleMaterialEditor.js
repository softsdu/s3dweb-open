import {
    cmnPcr,
    msgBox,
    s3dMaterialEditType,
    s3dOperateType, s3dUiStatus
} from "../../../commonjs/common/common.js"
import "./s3dAppSimpleMaterialEditor.css"
import {s3dAppSimpleEditorStatic} from "../s3dAppSimpleEditorStatic.js";

//S3dWeb场景设计
let S3dAppSimpleMaterialEditor = function (){
    //当前对象
    const thatAppSimpleMaterialEditor= this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;

    this.lastOperateInfo = {
        editingInfo: null,
        uiInfo: null
    };

    this.dataInfo = null;

    this.editContainer = null;

    this.pageInfo = null;

    //初始化
    this.init = function(p){
        thatAppSimpleMaterialEditor.containerId = p.containerId;
        thatAppSimpleMaterialEditor.manager = p.manager;
    }

    this.show = function (){
        thatAppSimpleMaterialEditor.manager.viewer.changeStatus({
            status: s3dUiStatus.locateMaterial
        });
    }

    this.scrollToMaterialItem = function (sourceMaterialName){
        let targetObject = thatAppSimpleMaterialEditor.manager.viewer.getObject3DByName(s3dAppSimpleEditorStatic.name.target);
        let targetUnitInfo = targetObject.userData.info;
        let materialCodeInfo = targetUnitInfo.materials[sourceMaterialName];
        if(materialCodeInfo != null) {
            thatAppSimpleMaterialEditor.scrollToItem(materialCodeInfo.code);
        }
    }

    this.bindItemEvents = function (p) {
        let container = thatAppSimpleMaterialEditor.editContainer;

        //编辑详情
        $(container).find(".s3dAppSimpleMaterialEditorPartContainer[name='user']").find(".s3dAppSimpleMaterialEditorItemTitle").click(function () {
            let materialCode = $(this).parent().parent().attr("materialCode");
            thatAppSimpleMaterialEditor.editMaterial(materialCode);
        });

        $(container).find(".s3dAppSimpleMaterialEditorItem").click(function () {
            let materialCode = $(this).attr("materialCode");
            thatAppSimpleMaterialEditor.focusMaterial(materialCode);
        });
    }


    this.bindEvents = function (p) {
        let container = thatAppSimpleMaterialEditor.editContainer;
        $(container).find(".s3dAppSimpleMaterialEditorListHeader").click(function () {
            let partContainer = $(this).parent();
            if ($(partContainer).hasClass("s3dAppSimpleMaterialEditorPartContainerExpand")) {
                $(partContainer).removeClass("s3dAppSimpleMaterialEditorPartContainerExpand");
            }
            else {
                $(partContainer).addClass("s3dAppSimpleMaterialEditorPartContainerExpand");
            }
        });

        $(container).find(".s3dAppSimpleMaterialEditorToolbarBtnBack").click(function () {
            thatAppSimpleMaterialEditor.switchSubContainer("list");
        });

        $(container).find(".s3dAppSimpleMaterialEditorDetailHeader").click(function () {
            let partContainer = $(this).parent();
            if ($(partContainer).hasClass("s3dAppSimpleMaterialEditorDetailGroupContainerActive")) {
                $(partContainer).removeClass("s3dAppSimpleMaterialEditorDetailGroupContainerActive");
            } else {
                $(partContainer).addClass("s3dAppSimpleMaterialEditorDetailGroupContainerActive");
            }
        });

        $(container).find(".s3dAppSimpleMaterialEditorDetailItemInput").change(function (){
            thatAppSimpleMaterialEditor.addEditingToUndoList(s3dMaterialEditType.editProperty);
            thatAppSimpleMaterialEditor.applyMaterial();
        });

        //选择图片按钮
        let imagePickerBtn = $(container).find(".s3dAppSimpleMaterialEditorDetailBtnImagePicker");
        $(imagePickerBtn).click(function (e) {
            let inputElement = $(this).parent().children(".s3dAppSimpleMaterialEditorDetailItemInput");
            let propertyName = $(inputElement).attr("propertyName");
            let imageName = $(inputElement).val();

            thatAppSimpleMaterialEditor.manager.localImagePicker.showPicker({
                paramInfo: {
                    propertyName: propertyName,
                    imageUrl: imageName,
                    afterPickImage: thatAppSimpleMaterialEditor.afterPickImage
                }
            });
        });

        //选择系统材质按钮
        let systemMaterialPickerBtn = $(container).find(".s3dAppSimpleMaterialEditorDetailBtnSystemMaterialPicker");
        $(systemMaterialPickerBtn).click(function (e) {
            let inputElement = $(this).parent().children(".s3dAppSimpleMaterialEditorDetailItemInput");
            let propertyName = $(inputElement).attr("propertyName");
            let propertyValue = $(inputElement).attr("propertyValue")

            thatAppSimpleMaterialEditor.manager.systemMaterialPicker.showPicker({
                paramInfo: {
                    propertyName: propertyName,
                    materialCode: propertyValue,
                    afterPickSystemMaterial: thatAppSimpleMaterialEditor.afterPickSystemMaterial
                }
            });
        });
    }

    this.afterPickSystemMaterial = function (p) {
        let systemMaterialInfo = thatAppSimpleMaterialEditor.manager.localMaterials.getSystemMaterialInfo(p.materialCode);
        let container = thatAppSimpleMaterialEditor.editContainer;
        let detailContainer = $(container).find(".s3dAppSimpleMaterialEditorDetailContainer");
        let newMaterialInfo = thatAppSimpleMaterialEditor.manager.localMaterials.cloneMaterialInfoFromSystemMaterialInfo(systemMaterialInfo);

        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyname='typeCode']").attr("propertyValue", newMaterialInfo.typeCode);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyname='typeCode']").val(newMaterialInfo.typeName);
        let colorStr = cmnPcr.getColorStr(newMaterialInfo.color);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='color']").val(colorStr);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='imageName']").val(newMaterialInfo.imageName);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='opacity']").val(newMaterialInfo.opacity);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='opacityImageName']").val(newMaterialInfo.opacityImageName);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='transparent']").prop("checked", newMaterialInfo.transparent);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='metalness']").val(newMaterialInfo.metalness);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='metalnessImageName']").val(newMaterialInfo.metalnessImageName);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='roughness']").val(newMaterialInfo.roughness);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='roughnessImageName']").val(newMaterialInfo.roughnessImageName);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='normalImageName']").val(newMaterialInfo.normalImageName);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='scaleWidth']").val(newMaterialInfo.scaleWidth);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='scaleHeight']").val(newMaterialInfo.scaleHeight);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='envMapIntensity']").val(newMaterialInfo.envMapIntensity);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='rotation']").val(newMaterialInfo.rotation);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='isMirror']").prop("checked", newMaterialInfo.isMirror);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='isDoubleSide']").prop("checked", newMaterialInfo.isDoubleSide);

        thatAppSimpleMaterialEditor.applyMaterial();
    }

    this.afterPickImage = function(p){
        let newImageUrl = p.imageUrl;
        let propertyName  = p.paramInfo.propertyName;
        let container = thatAppSimpleMaterialEditor.editContainer;
        let detailContainer = $(container).find(".s3dAppSimpleMaterialEditorDetailContainer")[0];
        let input = $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='" + propertyName + "']")[0];
        let oldImageUrl = $(input).val();
        $(input).val(newImageUrl);
        if(oldImageUrl !== newImageUrl){
            thatAppSimpleMaterialEditor.addEditingToUndoList(s3dMaterialEditType.editProperty);
            thatAppSimpleMaterialEditor.applyMaterial();
        }
    }

    this.focusMaterial = function (materialCode){
        let container = thatAppSimpleMaterialEditor.editContainer;
        $(container).find(".s3dAppSimpleMaterialEditorItem").removeClass("s3dAppSimpleMaterialEditorItemActive");
        $(container).find(".s3dAppSimpleMaterialEditorItem[materialCode='" + materialCode + "']").addClass("s3dAppSimpleMaterialEditorItemActive");
    }

    this.scrollToItem = function (materialCode){
        thatAppSimpleMaterialEditor.switchSubContainer("list");

        let container = thatAppSimpleMaterialEditor.editContainer;
        let materialEditorContainer = $(container).find(".s3dAppSimpleMaterialEditorContainer")[0];
        let subContainer = $(materialEditorContainer).find(".s3dAppSimpleMaterialEditorSubContainer[name='list']")[0];
        let userMaterialContainer = $(materialEditorContainer).find(".s3dAppSimpleMaterialEditorPartContainer[name='user']")[0];
        let materialItem = $(subContainer).find(".s3dAppSimpleMaterialEditorItem[materialCode='" + materialCode + "']")[0];
        if(materialItem != null) {
            let listContainer = $(materialItem).parent()[0];
            let partContainer = $(listContainer).parent()[0];
            $(partContainer).addClass("s3dAppSimpleMaterialEditorPartContainerExpand");
            let scrollTop = $(materialItem).offset().top - $(userMaterialContainer).offset().top;
            subContainer.scrollTop = scrollTop - 10;

            thatAppSimpleMaterialEditor.focusMaterial(materialCode);
        }
    }

    this.getSelectedMaterialCode = function (){
        let container = thatAppSimpleMaterialEditor.editContainer;
        let materialItem = $(container).find(".s3dAppSimpleMaterialEditorItemActive");
        return $(materialItem).attr("materialCode");
    }

    this.initValues = function (p) {
        thatAppSimpleMaterialEditor.editContainer = p.editContainer;
        thatAppSimpleMaterialEditor.dataInfo = p.dataInfo;
        thatAppSimpleMaterialEditor.pageInfo = p.pageInfo;

        let materialCodes = thatAppSimpleMaterialEditor.dataInfo;
        thatAppSimpleMaterialEditor.refreshList(materialCodes);
    }

    this.refreshList = function (materialCodes){
        let materialList = [];
        if(materialCodes != null) {
            for (let i = 0; i < materialCodes.length; i++) {
                let materialCode = materialCodes[i];
                let materialInfo = thatAppSimpleMaterialEditor.manager.localMaterials.getUserMaterialInfo(materialCode);
                materialList.push(materialInfo);
            }
        }
        let html = thatAppSimpleMaterialEditor.getMaterialListHtml(materialList);
        let container = thatAppSimpleMaterialEditor.editContainer;
        $(container).find(".s3dAppSimpleMaterialEditorListContainer").html(html);

        thatAppSimpleMaterialEditor.switchSubContainer("list");
        thatAppSimpleMaterialEditor.bindItemEvents();
    }

    //获取list html
    this.getHtml = function(){
        let html = "";
        html += ("<div class='s3dAppSimpleMaterialEditorContainer'>");

        html += ("<div class='s3dAppSimpleMaterialEditorSubContainer s3dAppSimpleMaterialEditorSubContainerActive' name='list'>");
        html += ("<div class='s3dAppSimpleMaterialEditorPartContainer s3dAppSimpleMaterialEditorPartContainerExpand' name='user'>");
        html += ("<div class='s3dAppSimpleMaterialEditorListContainer'>");
        html += "</div>";
        html += "</div>";
        html += "</div>";

        html += ("<div class='s3dAppSimpleMaterialEditorSubContainer' name='detail'>");
        html += ("<div class='s3dAppSimpleMaterialEditorToolbar'><div class='s3dAppSimpleMaterialEditorToolbarBtn s3dAppSimpleMaterialEditorToolbarBtnBack'>&#9668;&nbsp;返回</div></div>");
        html += thatAppSimpleMaterialEditor.getMaterialDetailHtml();
        html += "</div>";

        html += "</div>";
        return html;
    }

    this.getMaterialListHtml = function (materialList){
        let html = "";
        if(materialList != null && materialList.length !== 0){
            let sortedList = thatAppSimpleMaterialEditor.getSortedList(materialList);
            for (let i = 0; i < sortedList.length; i++) {
                let materialInfo = sortedList[i];
                html += thatAppSimpleMaterialEditor.getMaterialItemHtml(materialInfo);
            }
        }
        return html;
    }

    this.getMaterialItemHtml = function (materialInfo){
        let style = "";
        if(materialInfo.imageName == null || materialInfo.imageName.length === 0){
            let colorStr = cmnPcr.getColorStr(materialInfo.color);
            //显示颜色
            style = "background-color: " + colorStr + ";"
        }
        else{
            //显示图片
            let imageUrl = thatAppSimpleMaterialEditor.manager.localImages.getImageUrl(materialInfo.imageName);
            style = "background-image: url(" + imageUrl + ");"
        }

        let html = "";
        html += ("<div class='s3dAppSimpleMaterialEditorItem' materialCode='" + materialInfo.code + "'>");
        html += "<div class='s3dAppSimpleMaterialEditorItemImage' style='" + style + "'></div>";
        html += ("<div class='s3dAppSimpleMaterialEditorItemName'><span class='s3dAppSimpleMaterialEditorItemTitle'>" + cmnPcr.htmlEncode(materialInfo.name) + "</span></div>");
        html += ("</div>");
        return html;
    }

    this.removeMaterialItem = function (materialCode){
        let container = thatAppSimpleMaterialEditor.editContainer;
        let editContainer = $(container).find(".s3dAppSimpleMaterialEditorContainer");
        $(editContainer).find(".s3dAppSimpleMaterialEditorItem[materialCode='" + materialCode + "']").remove();
    }

    this.insertMaterialItem = function (newMaterialInfo){
        let container = thatAppSimpleMaterialEditor.editContainer;
        let userMaterialContainer = $(container).find(".s3dAppSimpleMaterialEditorContainer").find(".s3dAppSimpleMaterialEditorPartContainer[name='user']");
        let materialItems = $(userMaterialContainer).find(".s3dAppSimpleMaterialEditorItem");
        let newMaterialItemHtml = thatAppSimpleMaterialEditor.getMaterialItemHtml(newMaterialInfo);
        let added = false;
        for(let i = 0; i < materialItems.length; i++){
            let materialItem = materialItems[i];
            let matCode = $(materialItem).attr("materialCode");
            let matInfo = thatAppSimpleMaterialEditor.manager.localMaterials.getUserMaterialInfo(matCode);
            if(!added && matInfo.name.localeCompare(newMaterialInfo.name) > 0){
                $(materialItem).before(newMaterialItemHtml);
                added = true;
            }
        }
        if(!added){
            $(userMaterialContainer).find(".s3dAppSimpleMaterialEditorNewItem").before(newMaterialItemHtml);
        }

        let newMaterialItem = $(userMaterialContainer).find(".s3dAppSimpleMaterialEditorItem[materialCode='" + newMaterialInfo.code + "']");

        $(newMaterialItem).click(function(){
            let materialCode = $(this).attr("materialCode");
            thatAppSimpleMaterialEditor.focusMaterial(materialCode);
        });

        $(newMaterialItem).find(".s3dAppSimpleMaterialEditorItemTitle").click(function () {
            let materialCode = $(this).parent().parent().attr("materialCode");
            thatAppSimpleMaterialEditor.editMaterial(materialCode);
        });
    }

    this.getMaterialDetailHtml = function (){
        let html = "<div class='s3dAppSimpleMaterialEditorDetailContainer'>";

        //基本信息
        html += ("<div class='s3dAppSimpleMaterialEditorDetailGroupContainer s3dAppSimpleMaterialEditorDetailGroupContainerActive' name='base'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailHeader'><div class='s3dAppSimpleMaterialEditorDetailHeaderImage'>&#9654;</div><div class='s3dAppSimpleMaterialEditorDetailHeaderTitle'>基本信息</div></div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailGroupInnerContainer'>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem s3dAppSimpleMaterialEditorDetailItemHidden'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>编码</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='text' propertyName='code' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputString' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>名称</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='text' propertyName='name' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputString' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>类型</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='text' propertyName='typeCode' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputString s3dAppSimpleMaterialEditorDetailItemInputPop' />");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailBtnPop s3dAppSimpleMaterialEditorDetailBtnSystemMaterialPicker'></div>");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>颜色</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='color' propertyName='color' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputColor' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>贴图</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='text' propertyName='imageName' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputString s3dAppSimpleMaterialEditorDetailItemInputPop' />");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailBtnPop s3dAppSimpleMaterialEditorDetailBtnImagePicker'></div>");
        html += ("</div>");
        html += ("</div>");

        html += ("</div>");
        html += ("</div>");

        //透明度
        html += ("<div class='s3dAppSimpleMaterialEditorDetailGroupContainer s3dAppSimpleMaterialEditorDetailGroupContainerActive' name='image'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailHeader'><div class='s3dAppSimpleMaterialEditorDetailHeaderImage'>&#9654;</div><div class='s3dAppSimpleMaterialEditorDetailHeaderTitle'>透明</div></div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailGroupInnerContainer'>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>透明效果</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='checkbox' propertyName='transparent' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputBoolean' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>透明度</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='number' propertyName='opacity' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputDecimal' min='0' max='1' step='0.1' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>贴图</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='text' propertyName='opacityImageName' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputString s3dAppSimpleMaterialEditorDetailItemInputPop' />");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailBtnPop s3dAppSimpleMaterialEditorDetailBtnImagePicker'></div>");
        html += ("</div>");
        html += ("</div>");

        html += ("</div>");
        html += ("</div>");

        //金属度
        html += ("<div class='s3dAppSimpleMaterialEditorDetailGroupContainer s3dAppSimpleMaterialEditorDetailGroupContainerActive' name='image'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailHeader'><div class='s3dAppSimpleMaterialEditorDetailHeaderImage'>&#9654;</div><div class='s3dAppSimpleMaterialEditorDetailHeaderTitle'>金属度</div></div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailGroupInnerContainer'>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>金属度</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='number' propertyName='metalness' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputDecimal' min='0' max='1' step='0.1' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>贴图</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='text' propertyName='metalnessImageName' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputString s3dAppSimpleMaterialEditorDetailItemInputPop' />");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailBtnPop s3dAppSimpleMaterialEditorDetailBtnImagePicker'></div>");
        html += ("</div>");
        html += ("</div>");

        html += ("</div>");
        html += ("</div>");

        //粗糙度
        html += ("<div class='s3dAppSimpleMaterialEditorDetailGroupContainer s3dAppSimpleMaterialEditorDetailGroupContainerActive' name='image'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailHeader'><div class='s3dAppSimpleMaterialEditorDetailHeaderImage'>&#9654;</div><div class='s3dAppSimpleMaterialEditorDetailHeaderTitle'>粗糙度</div></div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailGroupInnerContainer'>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>粗糙度</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='number' propertyName='roughness' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputDecimal' min='0' max='1' step='0.1' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>贴图</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='text' propertyName='roughnessImageName' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputString s3dAppSimpleMaterialEditorDetailItemInputPop' />");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailBtnPop s3dAppSimpleMaterialEditorDetailBtnImagePicker'></div>");
        html += ("</div>");
        html += ("</div>");

        html += ("</div>");
        html += ("</div>");

        //法线
        html += ("<div class='s3dAppSimpleMaterialEditorDetailGroupContainer s3dAppSimpleMaterialEditorDetailGroupContainerActive' name='image'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailHeader'><div class='s3dAppSimpleMaterialEditorDetailHeaderImage'>&#9654;</div><div class='s3dAppSimpleMaterialEditorDetailHeaderTitle'>法线</div></div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailGroupInnerContainer'>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>贴图</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='text' propertyName='normalImageName' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputString s3dAppSimpleMaterialEditorDetailItemInputPop' />");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailBtnPop s3dAppSimpleMaterialEditorDetailBtnImagePicker'></div>");
        html += ("</div>");
        html += ("</div>");

        html += ("</div>");
        html += ("</div>");

        //环境
        html += ("<div class='s3dAppSimpleMaterialEditorDetailGroupContainer s3dAppSimpleMaterialEditorDetailGroupContainerActive' name='image'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailHeader'><div class='s3dAppSimpleMaterialEditorDetailHeaderImage'>&#9654;</div><div class='s3dAppSimpleMaterialEditorDetailHeaderTitle'>环境</div></div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailGroupInnerContainer'>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>贴图反射率</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='number' propertyName='envMapIntensity' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputDecimal' min='0' max='1' step='0.1' />");
        html += ("</div>");
        html += ("</div>");

        html += ("</div>");
        html += ("</div>");

        //贴图重复
        html += ("<div class='s3dAppSimpleMaterialEditorDetailGroupContainer s3dAppSimpleMaterialEditorDetailGroupContainerActive' name='image'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailHeader'><div class='s3dAppSimpleMaterialEditorDetailHeaderImage'>&#9654;</div><div class='s3dAppSimpleMaterialEditorDetailHeaderTitle'>贴图重复</div></div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailGroupInnerContainer'>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>横向</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='number' propertyName='scaleWidth' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputDecimal' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>纵向</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='number' propertyName='scaleHeight' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputDecimal' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>旋转</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='number' propertyName='rotation' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputAngle' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>镜像</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='checkbox' propertyName='isMirror' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputBoolean' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dAppSimpleMaterialEditorDetailItem'>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemTitle'>双面显示</div>");
        html += ("<div class='s3dAppSimpleMaterialEditorDetailItemValue'>");
        html += ("<input type='checkbox' propertyName='isDoubleSide' class='s3dAppSimpleMaterialEditorDetailItemInput s3dAppSimpleMaterialEditorDetailItemInputBoolean' />");
        html += ("</div>");
        html += ("</div>");

        html += ("</div>");
        html += ("</div>");

        html += ("</div>");
        return html;
    }

    this.showMaterial = function (materialCode){
        let materialInfo = thatAppSimpleMaterialEditor.manager.localMaterials.getUserMaterialInfo(materialCode);
        thatAppSimpleMaterialEditor.showMaterialInfo(materialInfo);
    }

    this.showMaterialInfo = function (materialInfo){
        thatAppSimpleMaterialEditor.switchSubContainer("detail");
        thatAppSimpleMaterialEditor.refreshMaterialInfoInputValues(materialInfo, true);
    }

    this.editMaterial = function (materialCode){
        let materialInfo = thatAppSimpleMaterialEditor.manager.localMaterials.getUserMaterialInfo(materialCode);
        thatAppSimpleMaterialEditor.editMaterialInfo(materialInfo);
    }

    this.editMaterialInfo = function (materialInfo){
        thatAppSimpleMaterialEditor.switchSubContainer("detail");
        thatAppSimpleMaterialEditor.refreshMaterialInfoInputValues(materialInfo, false);

        thatAppSimpleMaterialEditor.lastOperateInfo = {
            editingInfo: thatAppSimpleMaterialEditor.getEditingInfoFromUI(),
            uiInfo: thatAppSimpleMaterialEditor.getUiInfo()
        };
    }

    this.getUiInfo = function (){
        let container = thatAppSimpleMaterialEditor.editContainer;
        let detailContainer = $(container).find(".s3dAppSimpleMaterialEditorDetailContainer")[0];
        return {
            detailScrollTop: detailContainer.scrollTop
        };
    }

    this.refreshMaterialInfoInputValues = function (materialInfo, readonly) {
        let container = thatAppSimpleMaterialEditor.editContainer;

        //更新材质参数值
        let detailContainer = $(container).find(".s3dAppSimpleMaterialEditorDetailContainer");
        $(detailContainer).attr("materialCode", materialInfo.code);

        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailOkBtn").css({display: readonly ? "none" : "block"});
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput").attr("readonly", readonly ? "true" : null);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput").attr("disabled", readonly ? "true" : null);
        if(readonly) {
            $(detailContainer).addClass("s3dAppSimpleMaterialEditorDetailContainerReadonly");
            $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput").addClass("s3dAppSimpleMaterialEditorDetailItemInputReadonly");
        }
        else{
            $(detailContainer).removeClass("s3dAppSimpleMaterialEditorDetailContainerReadonly");
            $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput").removeClass("s3dAppSimpleMaterialEditorDetailItemInputReadonly");
        }

        let colorStr = cmnPcr.getColorStr(materialInfo.color);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='color']").val(colorStr);

        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='code']").val(materialInfo.code);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='name']").val(materialInfo.name);

        let typeName = thatAppSimpleMaterialEditor.getTypeName(materialInfo.typeCode);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='typeCode']").attr("propertyValue", materialInfo.typeCode);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='typeCode']").val(typeName);

        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='imageName']").val(materialInfo.imageName);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='transparent']").prop("checked", materialInfo.transparent);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='opacity']").val(materialInfo.opacity);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='opacityImageName']").val(materialInfo.opacityImageName);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='metalness']").val(materialInfo.metalness);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='metalnessImageName']").val(materialInfo.metalnessImageName);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='roughness']").val(materialInfo.roughness);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='roughnessImageName']").val(materialInfo.roughnessImageName);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='normalImageName']").val(materialInfo.normalImageName);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='envMapIntensity']").val(materialInfo.envMapIntensity);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='scaleWidth']").val(materialInfo.scaleWidth);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='scaleHeight']").val(materialInfo.scaleHeight);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='rotation']").val(materialInfo.rotation);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='isMirror']").prop("checked", materialInfo.isMirror);
        $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='isDoubleSide']").prop("checked", materialInfo.isDoubleSide);
    }

    this.getTypeName = function (typeCode){
        let typeInfo = thatAppSimpleMaterialEditor.manager.localMaterials.baseMaterials.getTypeInfo(typeCode);
        return typeInfo == null ? "" : typeInfo.name;
    }

    this.switchSubContainer = function (subContainerName){
        let container = thatAppSimpleMaterialEditor.editContainer;
        $(container).find(".s3dAppSimpleMaterialEditorSubContainer").removeClass("s3dAppSimpleMaterialEditorSubContainerActive");
        $(container).find(".s3dAppSimpleMaterialEditorSubContainer[name='" + subContainerName + "']").addClass("s3dAppSimpleMaterialEditorSubContainerActive");

        $(container).find(".s3dAppSimpleMaterialEditorToolbar").removeClass("s3dAppSimpleMaterialEditorToolbarActive");
        $(container).find(".s3dAppSimpleMaterialEditorToolbar[name='" + subContainerName + "']").addClass("s3dAppSimpleMaterialEditorToolbarActive");
    }

    this.applyMaterial = function () {
        let container = thatAppSimpleMaterialEditor.editContainer;
        let detailContainer = $(container).find(".s3dAppSimpleMaterialEditorDetailContainer");
        let materialCode = $(detailContainer).attr("materialCode");
        let materialName = $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='name']").val();
        if (materialName.length === 0) {
            msgBox.alert({info: "请录入材质名称"});
        }
        if(thatAppSimpleMaterialEditor.manager.localMaterials.checkSameNameMaterial(materialCode, materialName)){
            msgBox.alert({info: "存在重名的材质"});
        }
        else {
            $(container).find(".s3dAppSimpleMaterialEditorItem[materialCode='" + materialCode + "'] .s3dAppSimpleMaterialEditorItemTitle").text(materialName);

            let newMaterialInfo = thatAppSimpleMaterialEditor.getEditingInfoFromUI();
            let isOldMaterial = thatAppSimpleMaterialEditor.manager.localMaterials.checkHasMaterial(newMaterialInfo.code);
            if (isOldMaterial) {
                let oldMaterialInfo = thatAppSimpleMaterialEditor.manager.localMaterials.getUserMaterialInfo(newMaterialInfo.code);
                thatAppSimpleMaterialEditor.beginAddToUndoList(s3dMaterialEditType.edit, oldMaterialInfo.code, oldMaterialInfo);
                thatAppSimpleMaterialEditor.manager.localMaterials.updateUserMaterial(newMaterialInfo);
                thatAppSimpleMaterialEditor.endAddToUndoList(s3dMaterialEditType.edit, newMaterialInfo.code, newMaterialInfo);
            } else {
                thatAppSimpleMaterialEditor.beginAddToUndoList(s3dMaterialEditType.edit, newMaterialInfo.code, null);
                thatAppSimpleMaterialEditor.manager.localMaterials.addUserMaterial(newMaterialInfo);
                thatAppSimpleMaterialEditor.endAddToUndoList(s3dMaterialEditType.edit, newMaterialInfo.code, newMaterialInfo);
            }

            thatAppSimpleMaterialEditor.focusMaterial(newMaterialInfo.code);
            return newMaterialInfo;
        }
        return null;
    }

    this.getEditingInfoFromUI = function (){
        let container = thatAppSimpleMaterialEditor.editContainer;
        let detailContainer = $(container).find(".s3dAppSimpleMaterialEditorDetailContainer");
        let materialCode = $(detailContainer).attr("materialCode");
        let materialName = $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='name']").val();
        let typeCode = $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='typeCode']").attr("propertyValue");
        let colorStr = $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='color']").val();
        let color = common3DFunction.stringToRGBInt(colorStr.substr(1));
        let imageName = $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='imageName']").val();
        let transparent = $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='transparent']").is(":checked");
        let opacity = cmnPcr.strToDecimal($(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='opacity']").val());
        let opacityImageName = $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='opacityImageName']").val();
        let metalness = cmnPcr.strToDecimal($(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='metalness']").val());
        let metalnessImageName = $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='metalnessImageName']").val();
        let roughness = cmnPcr.strToDecimal($(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='roughness']").val());
        let roughnessImageName = $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='roughnessImageName']").val();
        let normalImageName = $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='normalImageName']").val();
        let envMapIntensity = cmnPcr.strToDecimal($(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='envMapIntensity']").val());
        let scaleWidth = cmnPcr.strToDecimal($(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='scaleWidth']").val());
        let scaleHeight = cmnPcr.strToDecimal($(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='scaleHeight']").val());
        let rotation = cmnPcr.strToDecimal($(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='rotation']").val());
        let isMirror = $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='isMirror']").is(":checked");
        let isDoubleSide = $(detailContainer).find(".s3dAppSimpleMaterialEditorDetailItemInput[propertyName='isDoubleSide']").is(":checked");
        let materialInfo = {
            code: materialCode,
            name: materialName,
            typeCode: typeCode,
            color: color,
            imageName: imageName,
            transparent: transparent,
            opacity: opacity,
            opacityImageName: opacityImageName,
            metalness: metalness,
            metalnessImageName: metalnessImageName,
            roughness: roughness,
            roughnessImageName: roughnessImageName,
            normalImageName: normalImageName,
            envMapIntensity: envMapIntensity,
            scaleWidth: scaleWidth,
            scaleHeight: scaleHeight,
            rotation: rotation,
            isMirror: isMirror,
            isDoubleSide: isDoubleSide,
            isServer: false,
            isSystem: false
        };
        return materialInfo;
    }

    this.saveMaterial = function () {
        let materialInfo = thatAppSimpleMaterialEditor.applyMaterial();
        if(materialInfo != null){
            thatAppSimpleMaterialEditor.switchSubContainer("list");
            thatAppSimpleMaterialEditor.focusMaterial(materialInfo.code);
        }
    }

    this.closeDetail = function (){
        thatAppSimpleMaterialEditor.switchSubContainer("list");
    }

    this.refreshEditing = function (materialInfo, uiInfo){
        thatAppSimpleMaterialEditor.editMaterialInfo(materialInfo);

        //更新UI布局
        thatAppSimpleMaterialEditor.refreshUILayout(uiInfo);
    }

    this.refreshUILayout = function (uiInfo){
        let container = thatAppSimpleMaterialEditor.editContainer;
        let detailContainer = $(container).find(".s3dAppSimpleMaterialEditorDetailContainer")[0];
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
            targetCode: targetCode,
            editingInfo: thatAppSimpleMaterialEditor.lastOperateInfo.editingInfo,
            uiInfo: thatAppSimpleMaterialEditor.lastOperateInfo.uiInfo
        };
        thatAppSimpleMaterialEditor.manager.statusBar.beginAddToUndoList({
            operateType: s3dOperateType.material,
            otherInfo: beginDoOtherInfo
        });

        let editingInfo = thatAppSimpleMaterialEditor.getEditingInfoFromUI();
        let uiInfo = thatAppSimpleMaterialEditor.getUiInfo();
        let endDoOtherInfo= {
            editType: editType,
            targetCode: targetCode,
            editingInfo: editingInfo,
            uiInfo: uiInfo
        };
        thatAppSimpleMaterialEditor.manager.statusBar.endAddToUndoList({
            operateType: s3dOperateType.material,
            otherInfo: endDoOtherInfo
        });

        thatAppSimpleMaterialEditor.lastOperateInfo = {
            editingInfo: editingInfo,
            uiInfo: uiInfo
        };
    }

    //开启添加到undo list
    this.beginAddToUndoList = function(editType, targetCode, materialInfo){
        let doOtherInfo = {
            editType: editType,
            targetCode: targetCode,
            materialInfo: materialInfo
        };
        thatAppSimpleMaterialEditor.manager.statusBar.beginAddToUndoList({
            operateType: s3dOperateType.material,
            otherInfo: doOtherInfo
        });
    }

    //结束添加到undo list
    this.endAddToUndoList = function(editType, targetCode, materialInfo) {
        let doOtherInfo = {
            editType: editType,
            targetCode: targetCode,
            materialInfo: materialInfo
        };
        thatAppSimpleMaterialEditor.manager.statusBar.endAddToUndoList({
            operateType: s3dOperateType.material,
            otherInfo: doOtherInfo
        });
    }
}

export default S3dAppSimpleMaterialEditor