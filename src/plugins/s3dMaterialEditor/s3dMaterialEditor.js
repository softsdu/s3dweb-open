import {
    cmnPcr,
    msgBox,
    s3dMaterialEditType,
    s3dOperateType
} from "../../commonjs/common/common.js"
import "./s3dMaterialEditor.css"

//S3dWeb场景设计
let S3dMaterialEditor = function (){
    //当前对象
    const thatMaterialEditor= this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;

    this.lastOperateInfo = {
        editingInfo: null,
        uiInfo: null
    };

    //事件
    this.eventFunctions = {};
    this.addEventFunction = function(eventName, func){
        let allFuncs = thatMaterialEditor.eventFunctions[eventName];
        if(allFuncs == null){
            allFuncs = [];
            thatMaterialEditor.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    }
    this.doEventFunction = function(eventName, p){
        let allFuncs = thatMaterialEditor.eventFunctions[eventName];
        if(allFuncs != null){
            for(let i = 0; i < allFuncs.length; i++){
                let func = allFuncs[i];
                func(p);
            }
        }
    }

    //初始化
    this.init = function(p){
        thatMaterialEditor.containerId = p.containerId;
        thatMaterialEditor.manager = p.manager;
        thatMaterialEditor.showMaterialEditor();
    }

    //显示
    this.showMaterialEditor = function(){
        thatMaterialEditor.showMaterialList();
        thatMaterialEditor.showToolbar();
        thatMaterialEditor.bindListEvents();
    }

    this.showMaterialList = function (){
        //构造html
        let html = thatMaterialEditor.getHtml();
        let container = $("#" + thatMaterialEditor.containerId);
        let materialEditorContainer = $(container).find(".s3dLayoutBlock[name='materialEditor']");
        $(materialEditorContainer).html(html);
    }

    this.showToolbar = function (){
        //toolbar
        let toolbarHtml = thatMaterialEditor.getTreeToolbarHtml();
        let container = $("#" + thatMaterialEditor.containerId);
        let toolbarContainer = $(container).find(".s3dLayoutBlockToolbar[name='materialEditor']");
        $(toolbarContainer).html(toolbarHtml);
        thatMaterialEditor.bindToolbarEvents();
    }

    this.bindListEvents = function () {
        let container = $("#" + thatMaterialEditor.containerId);
        $(container).find(".s3dMaterialEditorListHeader").click(function () {
            let partContainer = $(this).parent();
            if ($(partContainer).hasClass("s3dMaterialEditorPartContainerExpand")) {
                $(partContainer).removeClass("s3dMaterialEditorPartContainerExpand");
            } else {
                $(partContainer).addClass("s3dMaterialEditorPartContainerExpand");
            }
        });

        //菜单
        $(container).find(".s3dMaterialEditorItemBtn").click(function (ev) {
            ev.preventDefault();
            let materialCode = $(this).parent().attr("materialCode");
            thatMaterialEditor.showMenu(materialCode, ev);
            return false;
        });

        //编辑详情
        $(container).find(".s3dMaterialEditorPartContainer[name='user']").find(".s3dMaterialEditorItemTitle").click(function () {
            let materialCode = $(this).parent().parent().attr("materialCode");
            thatMaterialEditor.editMaterial(materialCode);
        });

        //查看详情
        $(container).find(".s3dMaterialEditorPartContainer[name='system']").find(".s3dMaterialEditorItemTitle").click(function () {
            let materialCode = $(this).parent().parent().attr("materialCode");
            thatMaterialEditor.showMaterial(materialCode);
        });

        //菜单下拉按钮
        $(container).find(".s3dMaterialEditorItemBtn").contextmenu(function (ev) {
            if (ev.button === 2) {
                ev.preventDefault();
                let materialCode = $(this).parent().attr("materialCode");
                thatMaterialEditor.showMenu(materialCode, ev);
            }
        });
        $(container).find(".s3dMaterialEditorItem").contextmenu(function (ev) {
            if (ev.button === 2) {
                ev.preventDefault();
                let materialCode = $(this).attr("materialCode");
                thatMaterialEditor.showMenu(materialCode, ev);
            }
        });
        $(container).find(".s3dMaterialEditorItem").click(function () {
            let materialCode = $(this).attr("materialCode");
            thatMaterialEditor.focusMaterial(materialCode);
        });
        $(container).find(".s3dMaterialEditorNewMaterialBtn").click(function () {
            thatMaterialEditor.addNewMaterial();
        });

        $(container).find(".s3dMaterialEditorAddUserMaterialBtn").click(function () {
            thatMaterialEditor.addNewMaterial();
        });

        $(container).find(".s3dMaterialEditorDetailHeader").click(function () {
            let partContainer = $(this).parent();
            if ($(partContainer).hasClass("s3dMaterialEditorDetailGroupContainerActive")) {
                $(partContainer).removeClass("s3dMaterialEditorDetailGroupContainerActive");
            } else {
                $(partContainer).addClass("s3dMaterialEditorDetailGroupContainerActive");
            }
        });

        $(container).find(".s3dMaterialEditorDetailItemInput").change(function (){
            thatMaterialEditor.addEditingToUndoList(s3dMaterialEditType.editProperty);
            thatMaterialEditor.applyMaterial();
        });

        //选择图片按钮
        let imagePickerBtn = $(container).find(".s3dMaterialEditorDetailBtnImagePicker");
        $(imagePickerBtn).click(function (e) {
            let inputElement = $(this).parent().children(".s3dMaterialEditorDetailItemInput");
            let propertyName = $(inputElement).attr("propertyName");
            let imageName = $(inputElement).val();

            thatMaterialEditor.manager.localImagePicker.showPicker({
                paramInfo: {
                    propertyName: propertyName,
                    imageUrl: imageName,
                    afterPickImage: thatMaterialEditor.afterPickImage
                }
            });
        });

        //选择系统材质按钮
        let systemMaterialPickerBtn = $(container).find(".s3dMaterialEditorDetailBtnSystemMaterialPicker");
        $(systemMaterialPickerBtn).click(function (e) {
            let inputElement = $(this).parent().children(".s3dMaterialEditorDetailItemInput");
            let propertyName = $(inputElement).attr("propertyName");
            let propertyValue = $(inputElement).attr("propertyValue")

            thatMaterialEditor.manager.systemMaterialPicker.showPicker({
                paramInfo: {
                    propertyName: propertyName,
                    materialCode: propertyValue,
                    afterPickSystemMaterial: thatMaterialEditor.afterPickSystemMaterial
                }
            });
        });
    }

    this.afterPickSystemMaterial = function (p) {
        let systemMaterialInfo = thatMaterialEditor.manager.localMaterials.getSystemMaterialInfo(p.materialCode);
        let detailContainer = $("#" + thatMaterialEditor.containerId).find(".s3dMaterialEditorDetailContainer");
        let newMaterialInfo = thatMaterialEditor.manager.localMaterials.cloneMaterialInfoFromSystemMaterialInfo(systemMaterialInfo);

        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyname='typeCode']").attr("propertyValue", newMaterialInfo.typeCode);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyname='typeCode']").val(newMaterialInfo.typeName);
        let colorStr = cmnPcr.getColorStr(newMaterialInfo.color);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='color']").val(colorStr);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='imageName']").val(newMaterialInfo.imageName);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='opacity']").val(newMaterialInfo.opacity);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='opacityImageName']").val(newMaterialInfo.opacityImageName);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='transparent']").prop("checked", newMaterialInfo.transparent);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='metalness']").val(newMaterialInfo.metalness);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='metalnessImageName']").val(newMaterialInfo.metalnessImageName);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='roughness']").val(newMaterialInfo.roughness);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='roughnessImageName']").val(newMaterialInfo.roughnessImageName);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='normalImageName']").val(newMaterialInfo.normalImageName);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='scaleWidth']").val(newMaterialInfo.scaleWidth);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='scaleHeight']").val(newMaterialInfo.scaleHeight);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='envMapIntensity']").val(newMaterialInfo.envMapIntensity);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='rotation']").val(newMaterialInfo.rotation);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='isMirror']").prop("checked", newMaterialInfo.isMirror);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='isDoubleSide']").prop("checked", newMaterialInfo.isDoubleSide);

        thatMaterialEditor.applyMaterial();
    }

    this.bindToolbarEvents = function () {
        let container = $("#" + thatMaterialEditor.containerId);
        $(container).find(".s3dMaterialEditorDetailBackBtn").click(function () {
            thatMaterialEditor.switchSubContainer("list");
        });

        $(container).find(".s3dMaterialEditorDetailOkBtn").click(function () {
            thatMaterialEditor.saveMaterial();
        });

        $(container).find(".s3dMaterialEditorDetailApplyBtn").click(function () {
            thatMaterialEditor.applyMaterial();
        });
    }

    this.afterPickImage = function(p){
        let newImageUrl = p.imageUrl;
        let propertyName  = p.paramInfo.propertyName;
        let container = $("#" + thatMaterialEditor.containerId);
        let detailContainer = $(container).find(".s3dMaterialEditorDetailContainer")[0];
        let input = $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='" + propertyName + "']")[0];
        let oldImageUrl = $(input).val();
        $(input).val(newImageUrl);
        if(oldImageUrl !== newImageUrl){
            thatMaterialEditor.addEditingToUndoList(s3dMaterialEditType.editProperty);
            thatMaterialEditor.applyMaterial();
        }
    }

    this.focusMaterial = function (materialCode){
        let container = $("#" + thatMaterialEditor.containerId);
        $(container).find(".s3dMaterialEditorItem").removeClass("s3dMaterialEditorItemActive");
        $(container).find(".s3dMaterialEditorItem[materialCode='" + materialCode + "']").addClass("s3dMaterialEditorItemActive");
    }

    this.scrollToItem = function (materialCode){
        thatMaterialEditor.switchSubContainer("list");

        let container = $("#" + thatMaterialEditor.containerId);
        let materialEditorContainer = $(container).find(".s3dMaterialEditorContainer")[0];
        let subContainer = $(materialEditorContainer).find(".s3dMaterialEditorSubContainer[name='list']")[0];
        let userMaterialContainer = $(materialEditorContainer).find(".s3dMaterialEditorPartContainer[name='user']")[0];
        let materialItem = $(subContainer).find(".s3dMaterialEditorItem[materialCode='" + materialCode + "']")[0];
        let listContainer = $(materialItem).parent()[0];
        let partContainer = $(listContainer).parent()[0];
        $(partContainer).addClass("s3dMaterialEditorPartContainerExpand");
        let scrollTop = $(materialItem).offset().top -$(userMaterialContainer).offset().top;
        subContainer.scrollTop = scrollTop - 10;

        thatMaterialEditor.focusMaterial(materialCode);
    }

    this.getSelectedMaterialCode = function (){
        let container = $("#" + thatMaterialEditor.containerId);
        let materialItem = $(container).find(".s3dMaterialEditorItemActive");
        return $(materialItem).attr("materialCode");
    }

    //获取树toolbar html
    this.getTreeToolbarHtml = function() {
        let html = ("<div class='s3dMaterialEditorToolbar s3dMaterialEditorToolbarActive' name='list'>"
            + "<div class='s3dMaterialEditorMaterialBtn s3dMaterialEditorAddUserMaterialBtn' title='添加自定义材质'>&#x2795;</div>"
            + "</div>"
            + "<div class='s3dMaterialEditorToolbar' name='detail'>"
            + "<div class='s3dMaterialEditorMaterialBtn s3dMaterialEditorDetailBackBtn' title='返回到列表'>&#9668;</div>"
            /* 改为编辑后立刻反映到渲染效果，不再需要点击确定
            + "<div class='s3dMaterialEditorMaterialBtn s3dMaterialEditorDetailApplyBtn' title='接受修改'>&#9438;</div>"
            + "<div class='s3dMaterialEditorMaterialBtn s3dMaterialEditorDetailOkBtn' title='确定并返回到列表'>&#10004;</div>"
            */
            + "</div>");
        return html;
    }

    //获取list html
    this.getHtml = function(){
        let html = "";
        html += ("<div class='s3dMaterialEditorContainer'>");
        html += ("<div class='s3dMaterialEditorSubContainer s3dMaterialEditorSubContainerActive' name='list'>");
        html += ("<div class='s3dMaterialEditorPartContainer s3dMaterialEditorPartContainerExpand' name='user'>");
        /* 隐藏标题
        html += ("<div class='s3dMaterialEditorListHeader'><div class='s3dMaterialEditorListHeaderImage'>&#9654;</div><div class='s3dMaterialEditorListHeaderTitle'>自定义材质</div></div>");
        */
        html += ("<div class='s3dMaterialEditorListContainer'>");
        html += thatMaterialEditor.getMaterialListHtml(thatMaterialEditor.manager.localMaterials.userList);
        html += ("<div class='s3dMaterialEditorNewItem'><div class='s3dMaterialEditorNewMaterialBtn'><span class='s3dMaterialEditorNewMaterialImage'>&#x2795;</span>新增材质</div></div>");
        html += "</div>";
        html += "</div>";
        /*隐藏系统材质
        html += ("<div class='s3dMaterialEditorPartContainer s3dMaterialEditorPartContainerExpand' name='system'>");
        html += ("<div class='s3dMaterialEditorListHeader'><div class='s3dMaterialEditorListHeaderImage'>&#9654;</div><div class='s3dMaterialEditorListHeaderTitle'>系统材质</div></div>");
        html += ("<div class='s3dMaterialEditorListContainer'>");
        html += thatMaterialEditor.getMaterialListHtml(thatMaterialEditor.manager.localMaterials.systemList);
        html += "</div>";
        html += "</div>";
        */
        html += "</div>";
        html += ("<div class='s3dMaterialEditorSubContainer' name='detail'>");
        html += thatMaterialEditor.getMaterialDetailHtml();
        html += "</div>";
        html += "</div>";
        return html;
    }

    this.getMaterialListHtml = function (materialList){
        let html = "";
        if(materialList != null && materialList.length !== 0){
            let sortedList = thatMaterialEditor.getSortedList(materialList);
            for (let i = 0; i < sortedList.length; i++) {
                let materialInfo = sortedList[i];
                html += thatMaterialEditor.getMaterialItemHtml(materialInfo);
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
            let imageUrl = thatMaterialEditor.manager.localImages.getImageUrl(materialInfo.imageName);
            style = "background-image: url(" + imageUrl + ");"
        }

        let html = "";
        html += ("<div class='s3dMaterialEditorItem' materialCode='" + materialInfo.code + "'>");
        html += "<div class='s3dMaterialEditorItemImage' style='" + style + "'></div>";
        html += ("<div class='s3dMaterialEditorItemName'><span class='s3dMaterialEditorItemTitle'>" + cmnPcr.htmlEncode(materialInfo.name) + "</span></div>");
        html += ("<div class='s3dMaterialEditorItemBtn'>&#9477;</div>");
        html += ("</div>");
        return html;
    }

    this.showMenu = function(materialCode, ev) {
        thatMaterialEditor.focusMaterial(materialCode);

        let materialInfo = thatMaterialEditor.manager.localMaterials.getUserMaterialInfo(materialCode)

        //初始化菜单项
        if (materialInfo.isSystem) {
            thatMaterialEditor.showSystemMaterialMenu();
        }
        else {
            thatMaterialEditor.showUserMaterialMenu();
        }

        //基本信息
        let container = $("#" + thatMaterialEditor.containerId);
        let menuContainer = $(container).find(".s3dMaterialEditorMenuContainer");
        $(menuContainer).attr("materialCode", materialCode);

        //初始化event
        $(container).find(".s3dMaterialEditorMenuOuterContainer").focus();
        $(container).find(".s3dMaterialEditorMenuBackground").mousedown(function (){
            thatMaterialEditor.closeMenu();
        });
        $(container).find(".s3dMaterialEditorMenuOuterContainer").keydown(function (ev){
            switch(ev.keyCode){
                case 27:{
                    thatMaterialEditor.closeMenu();
                    break;
                }
            }
        });
        $(container).find(".s3dMaterialEditorMenuBackground").click(function (){
            thatMaterialEditor.closeMenu();
        });

        //设置菜单显示位置
        let menuContainerHeight = $(menuContainer).height();
        let menuContainerWidth = $(menuContainer).width();
        let containerHeight = $(container).height();
        let containerWidth = $(container).width();

        if(ev.clientY + menuContainerHeight < containerHeight){
            $(menuContainer).css({
                "top": ev.clientY + "px",
                "bottom": "auto"
            });
        }
        else{
            $(menuContainer).css({
                "top": "auto",
                "bottom": (containerHeight - ev.clientY) + "px"
            });
        }
        if(ev.clientX + menuContainerWidth < containerWidth){
            $(menuContainer).css({
                "left": ev.clientX + "px",
                "right": "auto"
            });
        }
        else{
            $(menuContainer).css({
                "left": "auto",
                "right": (containerWidth - ev.clientX) + "px",
            });
        }
    }

    this.closeMenu = function (){
        let container = $("#" + thatMaterialEditor.containerId);
        $(container).find(".s3dMaterialEditorMenuOuterContainer").remove();
    }

    this.showSystemMaterialMenu = function (){
        let html = "<div class='s3dMaterialEditorMenuOuterContainer'>";
        html += ("<div class='s3dMaterialEditorMenuBackground'></div>");
        html += ("<div class='s3dMaterialEditorMenuContainer'>");
        html += ("<div class='s3dMaterialEditorMenuItem' name='showMaterialBtn' title='查看材质详情'>查看</div>");
        html += ("<div class='s3dMaterialEditorMenuItem' name='copyMaterialBtn' title='复制材质'>复制</div>");
        html += ("</div>");
        html += ("</div>");
        let container = $("#" + thatMaterialEditor.containerId);
        $(container).append(html);

        //查看详情
        $(container).find(".s3dMaterialEditorMenuItem[name='showMaterialBtn']").click(function(){
            thatMaterialEditor.closeMenu();
            let materialCode = $(this).parent().attr("materialCode");
            thatMaterialEditor.showMaterial(materialCode);
        });

        //复制材质
        $(container).find(".s3dMaterialEditorMenuItem[name='copyMaterialBtn']").click(function(){
            thatMaterialEditor.closeMenu();
            let materialCode = $(this).parent().attr("materialCode");
            thatMaterialEditor.copyMaterial(materialCode);
        });
    }

    this.showUserMaterialMenu = function (){
        let html = "<div class='s3dMaterialEditorMenuOuterContainer'>";
        html += ("<div class='s3dMaterialEditorMenuBackground'></div>");
        html += ("<div class='s3dMaterialEditorMenuContainer'>");
        html += ("<div class='s3dMaterialEditorMenuItem' name='editMaterialBtn' title='编辑材质详情'>编辑</div>");
        html += ("<div class='s3dMaterialEditorMenuItem' name='copyMaterialBtn' title='复制材质'>复制</div>");
        html += ("<div class='s3dMaterialEditorMenuItem' name='deleteMaterialBtn' title='删除材质'>删除</div>");
        html += ("</div>");
        html += ("</div>");
        let container = $("#" + thatMaterialEditor.containerId);
        $(container).append(html);

        //编辑详情
        $(container).find(".s3dMaterialEditorMenuItem[name='editMaterialBtn']").click(function(){
            thatMaterialEditor.closeMenu();
            let materialCode = $(this).parent().attr("materialCode");
            thatMaterialEditor.editMaterial(materialCode);
        });

        //复制材质
        $(container).find(".s3dMaterialEditorMenuItem[name='copyMaterialBtn']").click(function(){
            thatMaterialEditor.closeMenu();
            let materialCode = $(this).parent().attr("materialCode");
            thatMaterialEditor.copyMaterial(materialCode);
        });

        //删除材质
        $(container).find(".s3dMaterialEditorMenuItem[name='deleteMaterialBtn']").click(function(){
            thatMaterialEditor.closeMenu();
            let materialCode = $(this).parent().attr("materialCode");
            thatMaterialEditor.deleteMaterial(materialCode);
        });
    }

    this.getMaterialDetailHtml = function (){
        let html = "<div class='s3dMaterialEditorDetailContainer'>";

        //基本信息
        html += ("<div class='s3dMaterialEditorDetailGroupContainer s3dMaterialEditorDetailGroupContainerActive' name='base'>");
        html += ("<div class='s3dMaterialEditorDetailHeader'><div class='s3dMaterialEditorDetailHeaderImage'>&#9654;</div><div class='s3dMaterialEditorDetailHeaderTitle'>基本信息</div></div>");
        html += ("<div class='s3dMaterialEditorDetailGroupInnerContainer'>");

        html += ("<div class='s3dMaterialEditorDetailItem s3dMaterialEditorDetailItemHidden'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>编码</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='text' propertyName='code' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputString' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>名称</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='text' propertyName='name' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputString' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>类型</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='text' propertyName='typeCode' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputString s3dMaterialEditorDetailItemInputPop' />");
        html += ("<div class='s3dMaterialEditorDetailBtnPop s3dMaterialEditorDetailBtnSystemMaterialPicker'></div>");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>颜色</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='color' propertyName='color' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputColor' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>贴图</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='text' propertyName='imageName' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputString s3dMaterialEditorDetailItemInputPop' />");
        html += ("<div class='s3dMaterialEditorDetailBtnPop s3dMaterialEditorDetailBtnImagePicker'></div>");
        html += ("</div>");
        html += ("</div>");

        html += ("</div>");
        html += ("</div>");

        //透明度
        html += ("<div class='s3dMaterialEditorDetailGroupContainer s3dMaterialEditorDetailGroupContainerActive' name='image'>");
        html += ("<div class='s3dMaterialEditorDetailHeader'><div class='s3dMaterialEditorDetailHeaderImage'>&#9654;</div><div class='s3dMaterialEditorDetailHeaderTitle'>透明</div></div>");
        html += ("<div class='s3dMaterialEditorDetailGroupInnerContainer'>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>透明效果</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='checkbox' propertyName='transparent' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputBoolean' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>透明度</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='number' propertyName='opacity' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputDecimal' min='0' max='1' step='0.1' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>贴图</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='text' propertyName='opacityImageName' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputString s3dMaterialEditorDetailItemInputPop' />");
        html += ("<div class='s3dMaterialEditorDetailBtnPop s3dMaterialEditorDetailBtnImagePicker'></div>");
        html += ("</div>");
        html += ("</div>");

        html += ("</div>");
        html += ("</div>");

        //金属度
        html += ("<div class='s3dMaterialEditorDetailGroupContainer s3dMaterialEditorDetailGroupContainerActive' name='image'>");
        html += ("<div class='s3dMaterialEditorDetailHeader'><div class='s3dMaterialEditorDetailHeaderImage'>&#9654;</div><div class='s3dMaterialEditorDetailHeaderTitle'>金属度</div></div>");
        html += ("<div class='s3dMaterialEditorDetailGroupInnerContainer'>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>金属度</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='number' propertyName='metalness' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputDecimal' min='0' max='1' step='0.1' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>贴图</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='text' propertyName='metalnessImageName' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputString s3dMaterialEditorDetailItemInputPop' />");
        html += ("<div class='s3dMaterialEditorDetailBtnPop s3dMaterialEditorDetailBtnImagePicker'></div>");
        html += ("</div>");
        html += ("</div>");

        html += ("</div>");
        html += ("</div>");

        //粗糙度
        html += ("<div class='s3dMaterialEditorDetailGroupContainer s3dMaterialEditorDetailGroupContainerActive' name='image'>");
        html += ("<div class='s3dMaterialEditorDetailHeader'><div class='s3dMaterialEditorDetailHeaderImage'>&#9654;</div><div class='s3dMaterialEditorDetailHeaderTitle'>粗糙度</div></div>");
        html += ("<div class='s3dMaterialEditorDetailGroupInnerContainer'>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>粗糙度</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='number' propertyName='roughness' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputDecimal' min='0' max='1' step='0.1' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>贴图</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='text' propertyName='roughnessImageName' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputString s3dMaterialEditorDetailItemInputPop' />");
        html += ("<div class='s3dMaterialEditorDetailBtnPop s3dMaterialEditorDetailBtnImagePicker'></div>");
        html += ("</div>");
        html += ("</div>");

        html += ("</div>");
        html += ("</div>");

        //法线
        html += ("<div class='s3dMaterialEditorDetailGroupContainer s3dMaterialEditorDetailGroupContainerActive' name='image'>");
        html += ("<div class='s3dMaterialEditorDetailHeader'><div class='s3dMaterialEditorDetailHeaderImage'>&#9654;</div><div class='s3dMaterialEditorDetailHeaderTitle'>法线</div></div>");
        html += ("<div class='s3dMaterialEditorDetailGroupInnerContainer'>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>贴图</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='text' propertyName='normalImageName' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputString s3dMaterialEditorDetailItemInputPop' />");
        html += ("<div class='s3dMaterialEditorDetailBtnPop s3dMaterialEditorDetailBtnImagePicker'></div>");
        html += ("</div>");
        html += ("</div>");

        html += ("</div>");
        html += ("</div>");

        //环境
        html += ("<div class='s3dMaterialEditorDetailGroupContainer s3dMaterialEditorDetailGroupContainerActive' name='image'>");
        html += ("<div class='s3dMaterialEditorDetailHeader'><div class='s3dMaterialEditorDetailHeaderImage'>&#9654;</div><div class='s3dMaterialEditorDetailHeaderTitle'>环境</div></div>");
        html += ("<div class='s3dMaterialEditorDetailGroupInnerContainer'>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>贴图反射率</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='number' propertyName='envMapIntensity' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputDecimal' min='0' max='1' step='0.1' />");
        html += ("</div>");
        html += ("</div>");

        html += ("</div>");
        html += ("</div>");

        //贴图重复
        html += ("<div class='s3dMaterialEditorDetailGroupContainer s3dMaterialEditorDetailGroupContainerActive' name='image'>");
        html += ("<div class='s3dMaterialEditorDetailHeader'><div class='s3dMaterialEditorDetailHeaderImage'>&#9654;</div><div class='s3dMaterialEditorDetailHeaderTitle'>贴图重复</div></div>");
        html += ("<div class='s3dMaterialEditorDetailGroupInnerContainer'>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>横向</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='number' propertyName='scaleWidth' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputDecimal' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>纵向</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='number' propertyName='scaleHeight' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputDecimal' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>旋转</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='number' propertyName='rotation' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputAngle' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>镜像</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='checkbox' propertyName='isMirror' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputBoolean' />");
        html += ("</div>");
        html += ("</div>");

        html += ("<div class='s3dMaterialEditorDetailItem'>");
        html += ("<div class='s3dMaterialEditorDetailItemTitle'>双面显示</div>");
        html += ("<div class='s3dMaterialEditorDetailItemValue'>");
        html += ("<input type='checkbox' propertyName='isDoubleSide' class='s3dMaterialEditorDetailItemInput s3dMaterialEditorDetailItemInputBoolean' />");
        html += ("</div>");
        html += ("</div>");

        html += ("</div>");
        html += ("</div>");

        html += ("</div>");
        return html;
    }

    this.showMaterial = function (materialCode){
        let materialInfo = thatMaterialEditor.manager.localMaterials.getUserMaterialInfo(materialCode);
        thatMaterialEditor.showMaterialInfo(materialInfo);
    }

    this.showMaterialInfo = function (materialInfo){
        thatMaterialEditor.switchSubContainer("detail");
        thatMaterialEditor.refreshMaterialInfoInputValues(materialInfo, true);
    }

    this.editMaterial = function (materialCode){
        let materialInfo = thatMaterialEditor.manager.localMaterials.getUserMaterialInfo(materialCode);
        thatMaterialEditor.editMaterialInfo(materialInfo);
    }

    this.editMaterialInfo = function (materialInfo){
        thatMaterialEditor.switchSubContainer("detail");
        thatMaterialEditor.refreshMaterialInfoInputValues(materialInfo, false);

        thatMaterialEditor.lastOperateInfo = {
            editingInfo: thatMaterialEditor.getEditingInfoFromUI(),
            uiInfo: thatMaterialEditor.getUiInfo()
        };
    }

    this.getUiInfo = function (){
        let detailContainer = $("#" + thatMaterialEditor.containerId).find(".s3dMaterialEditorDetailContainer")[0];
        return {
            detailScrollTop: detailContainer.scrollTop
        };
    }

    this.refreshMaterialInfoInputValues = function (materialInfo, readonly) {
        let container = $("#" + thatMaterialEditor.containerId);
        //更新toolbar按钮是否可用
        let toolbarContainer = $(container).find(".s3dMaterialEditorToolbar[name='detail']");
        $(toolbarContainer).find(".s3dMaterialEditorDetailApplyBtn").css({display: readonly ? "none" : "block"});
        $(toolbarContainer).find(".s3dMaterialEditorDetailOkBtn").css({display: readonly ? "none" : "block"});

        //更新材质参数值
        let detailContainer = $(container).find(".s3dMaterialEditorDetailContainer");
        $(detailContainer).attr("materialCode", materialInfo.code);

        $(detailContainer).find(".s3dMaterialEditorDetailOkBtn").css({display: readonly ? "none" : "block"});
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput").attr("readonly", readonly ? "true" : null);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput").attr("disabled", readonly ? "true" : null);
        if(readonly) {
            $(detailContainer).addClass("s3dMaterialEditorDetailContainerReadonly");
            $(detailContainer).find(".s3dMaterialEditorDetailItemInput").addClass("s3dMaterialEditorDetailItemInputReadonly");
        }
        else{
            $(detailContainer).removeClass("s3dMaterialEditorDetailContainerReadonly");
            $(detailContainer).find(".s3dMaterialEditorDetailItemInput").removeClass("s3dMaterialEditorDetailItemInputReadonly");
        }

        let colorStr = cmnPcr.getColorStr(materialInfo.color);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='color']").val(colorStr);

        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='code']").val(materialInfo.code);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='name']").val(materialInfo.name);

        let typeName = thatMaterialEditor.getTypeName(materialInfo.typeCode);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='typeCode']").attr("propertyValue", materialInfo.typeCode);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='typeCode']").val(typeName);

        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='imageName']").val(materialInfo.imageName);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='transparent']").prop("checked", materialInfo.transparent);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='opacity']").val(materialInfo.opacity);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='opacityImageName']").val(materialInfo.opacityImageName);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='metalness']").val(materialInfo.metalness);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='metalnessImageName']").val(materialInfo.metalnessImageName);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='roughness']").val(materialInfo.roughness);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='roughnessImageName']").val(materialInfo.roughnessImageName);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='normalImageName']").val(materialInfo.normalImageName);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='envMapIntensity']").val(materialInfo.envMapIntensity);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='scaleWidth']").val(materialInfo.scaleWidth);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='scaleHeight']").val(materialInfo.scaleHeight);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='rotation']").val(materialInfo.rotation);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='isMirror']").prop("checked", materialInfo.isMirror);
        $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='isDoubleSide']").prop("checked", materialInfo.isDoubleSide);
    }

    this.getTypeName = function (typeCode){
        let typeInfo = thatMaterialEditor.manager.localMaterials.baseMaterials.getTypeInfo(typeCode);
        return typeInfo == null ? "" : typeInfo.name;
    }

    this.switchSubContainer = function (subContainerName){
        let container = $("#" + thatMaterialEditor.containerId);
        $(container).find(".s3dMaterialEditorSubContainer").removeClass("s3dMaterialEditorSubContainerActive");
        $(container).find(".s3dMaterialEditorSubContainer[name='" + subContainerName + "']").addClass("s3dMaterialEditorSubContainerActive");

        $(container).find(".s3dMaterialEditorToolbar").removeClass("s3dMaterialEditorToolbarActive");
        $(container).find(".s3dMaterialEditorToolbar[name='" + subContainerName + "']").addClass("s3dMaterialEditorToolbarActive");
    }

    this.deleteMaterial = function (materialCode){
        if(msgBox.confirm({info: "确定删除材质吗?"})){
            let materialInfo = thatMaterialEditor.manager.localMaterials.getUserMaterialInfo(materialCode);
            thatMaterialEditor.beginAddToUndoList(s3dMaterialEditType.delete, materialCode, materialInfo);
            thatMaterialEditor.manager.localMaterials.removeUserMaterial(materialCode);
            thatMaterialEditor.endAddToUndoList(s3dMaterialEditType.delete, materialCode, null);
            thatMaterialEditor.manager.propertyEditor.refreshMaterialValues();
            thatMaterialEditor.removeMaterialItem(materialCode);
        }
    }

    this.removeMaterialItem = function (materialCode){
        let editContainer = $("#" + thatMaterialEditor.containerId).find(".s3dMaterialEditorContainer");
        $(editContainer).find(".s3dMaterialEditorItem[materialCode='" + materialCode + "']").remove();
    }

    this.insertMaterialItem = function (newMaterialInfo){
        let userMaterialContainer = $("#" + thatMaterialEditor.containerId).find(".s3dMaterialEditorContainer").find(".s3dMaterialEditorPartContainer[name='user']");
        let materialItems = $(userMaterialContainer).find(".s3dMaterialEditorItem");
        let newMaterialItemHtml = thatMaterialEditor.getMaterialItemHtml(newMaterialInfo);
        let added = false;
        for(let i = 0; i < materialItems.length; i++){
            let materialItem = materialItems[i];
            let matCode = $(materialItem).attr("materialCode");
            let matInfo = thatMaterialEditor.manager.localMaterials.getUserMaterialInfo(matCode);
            if(!added && matInfo.name.localeCompare(newMaterialInfo.name) > 0){
                $(materialItem).before(newMaterialItemHtml);
                added = true;
            }
        }
        if(!added){
            $(userMaterialContainer).find(".s3dMaterialEditorNewItem").before(newMaterialItemHtml);
        }

        let newMaterialItem = $(userMaterialContainer).find(".s3dMaterialEditorItem[materialCode='" + newMaterialInfo.code + "']");
        $(newMaterialItem).contextmenu(function(ev){
            if(ev.button === 2){
                ev.preventDefault();
                let materialCode = $(this).attr("materialCode");
                thatMaterialEditor.showMenu(materialCode, ev);
            }
        });

        //菜单
        $(newMaterialItem).find(".s3dMaterialEditorItemBtn").click(function(ev){
            ev.preventDefault();
            let materialCode = $(this).parent().attr("materialCode");
            thatMaterialEditor.showMenu(materialCode, ev);
            return false;
        });

        //菜单下拉按钮
        $(newMaterialItem).find(".s3dMaterialEditorItemBtn").contextmenu(function(ev){
            if(ev.button === 2){
                ev.preventDefault();
                let materialCode = $(this).parent().attr("materialCode");
                thatMaterialEditor.showMenu(materialCode, ev);
            }
        });

        $(newMaterialItem).click(function(){
            let materialCode = $(this).attr("materialCode");
            thatMaterialEditor.focusMaterial(materialCode);
        });

        $(newMaterialItem).find(".s3dMaterialEditorItemTitle").click(function () {
            let materialCode = $(this).parent().parent().attr("materialCode");
            thatMaterialEditor.editMaterial(materialCode);
        });
    }

    this.addNewMaterial = function (){
        let newMaterialInfo = thatMaterialEditor.manager.localMaterials.getNewMaterialInfo("新材质");
        thatMaterialEditor.manager.localMaterials.addUserMaterial(newMaterialInfo);
        thatMaterialEditor.insertMaterialItem(newMaterialInfo);
        thatMaterialEditor.editMaterialInfo(newMaterialInfo);
    }

    this.copyMaterial = function (sourceMaterialCode){
        let sourceMaterialInfo = thatMaterialEditor.manager.localMaterials.getUserMaterialInfo(sourceMaterialCode);
        let newMaterialInfo = thatMaterialEditor.manager.localMaterials.cloneUserMaterialInfo(sourceMaterialInfo);
        thatMaterialEditor.editMaterialInfo(newMaterialInfo);
    }

    this.applyMaterial = function () {
        let detailContainer = $("#" + thatMaterialEditor.containerId).find(".s3dMaterialEditorDetailContainer");
        let materialCode = $(detailContainer).attr("materialCode");
        let materialName = $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='name']").val();
        if (materialName.length === 0) {
            msgBox.alert({info: "请录入材质名称"});
        }
        if(thatMaterialEditor.manager.localMaterials.checkSameNameMaterial(materialCode, materialName)){
            msgBox.alert({info: "存在重名的材质"});
        }
        else {
            let newMaterialInfo = thatMaterialEditor.getEditingInfoFromUI();
            let isOldMaterial = thatMaterialEditor.manager.localMaterials.checkHasMaterial(newMaterialInfo.code);
            if (isOldMaterial) {
                let oldMaterialInfo = thatMaterialEditor.manager.localMaterials.getUserMaterialInfo(newMaterialInfo.code);
                thatMaterialEditor.beginAddToUndoList(s3dMaterialEditType.edit, oldMaterialInfo.code, oldMaterialInfo);
                thatMaterialEditor.manager.localMaterials.updateUserMaterial(newMaterialInfo);
                thatMaterialEditor.endAddToUndoList(s3dMaterialEditType.edit, newMaterialInfo.code, newMaterialInfo);
                thatMaterialEditor.removeMaterialItem(newMaterialInfo.code);
                thatMaterialEditor.insertMaterialItem(newMaterialInfo);
            } else {
                thatMaterialEditor.beginAddToUndoList(s3dMaterialEditType.edit, newMaterialInfo.code, null);
                thatMaterialEditor.manager.localMaterials.addUserMaterial(newMaterialInfo);
                thatMaterialEditor.endAddToUndoList(s3dMaterialEditType.edit, newMaterialInfo.code, newMaterialInfo);
                thatMaterialEditor.insertMaterialItem(newMaterialInfo);
            }
            thatMaterialEditor.manager.propertyEditor.refreshMaterialValues();

            thatMaterialEditor.focusMaterial(newMaterialInfo.code);
            return newMaterialInfo;
        }
        return null;
    }

    this.getEditingInfoFromUI = function (){
        let detailContainer = $("#" + thatMaterialEditor.containerId).find(".s3dMaterialEditorDetailContainer");
        let materialCode = $(detailContainer).attr("materialCode");
        let materialName = $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='name']").val();
        let typeCode = $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='typeCode']").attr("propertyValue");
        let colorStr = $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='color']").val();
        let color = common3DFunction.stringToRGBInt(colorStr.substr(1));
        let imageName = $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='imageName']").val();
        let transparent = $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='transparent']").is(":checked");
        let opacity = cmnPcr.strToDecimal($(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='opacity']").val());
        let opacityImageName = $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='opacityImageName']").val();
        let metalness = cmnPcr.strToDecimal($(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='metalness']").val());
        let metalnessImageName = $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='metalnessImageName']").val();
        let roughness = cmnPcr.strToDecimal($(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='roughness']").val());
        let roughnessImageName = $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='roughnessImageName']").val();
        let normalImageName = $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='normalImageName']").val();
        let envMapIntensity = cmnPcr.strToDecimal($(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='envMapIntensity']").val());
        let scaleWidth = cmnPcr.strToDecimal($(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='scaleWidth']").val());
        let scaleHeight = cmnPcr.strToDecimal($(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='scaleHeight']").val());
        let rotation = cmnPcr.strToDecimal($(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='rotation']").val());
        let isMirror = $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='isMirror']").is(":checked");
        let isDoubleSide = $(detailContainer).find(".s3dMaterialEditorDetailItemInput[propertyName='isDoubleSide']").is(":checked");
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
        let materialInfo = thatMaterialEditor.applyMaterial();
        if(materialInfo != null){
            thatMaterialEditor.switchSubContainer("list");
            thatMaterialEditor.focusMaterial(materialInfo.code);
        }
    }

    this.closeDetail = function (){
        thatMaterialEditor.switchSubContainer("list");
    }

    this.refreshEditing = function (materialInfo, uiInfo){
        thatMaterialEditor.editMaterialInfo(materialInfo);

        //更新UI布局
        thatMaterialEditor.refreshUILayout(uiInfo);
    }

    this.refreshUILayout = function (uiInfo){
        let detailContainer = $("#" + thatMaterialEditor.containerId).find(".s3dMaterialEditorDetailContainer")[0];
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
            editingInfo: thatMaterialEditor.lastOperateInfo.editingInfo,
            uiInfo: thatMaterialEditor.lastOperateInfo.uiInfo
        };
        thatMaterialEditor.manager.statusBar.beginAddToUndoList({
            operateType: s3dOperateType.material,
            otherInfo: beginDoOtherInfo
        });

        let editingInfo = thatMaterialEditor.getEditingInfoFromUI();
        let uiInfo = thatMaterialEditor.getUiInfo();
        let endDoOtherInfo= {
            editType: editType,
            targetCode: targetCode,
            editingInfo: editingInfo,
            uiInfo: uiInfo
        };
        thatMaterialEditor.manager.statusBar.endAddToUndoList({
            operateType: s3dOperateType.material,
            otherInfo: endDoOtherInfo
        });

        thatMaterialEditor.lastOperateInfo = {
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
        thatMaterialEditor.manager.statusBar.beginAddToUndoList({
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
        thatMaterialEditor.manager.statusBar.endAddToUndoList({
            operateType: s3dOperateType.material,
            otherInfo: doOtherInfo
        });
    }
}

export default S3dMaterialEditor