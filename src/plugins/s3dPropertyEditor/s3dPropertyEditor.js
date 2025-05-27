import { msgBox, s3dElement3DType, s3dUiStatus, cmnPcr, s3dOperateType } from '../../commonjs/common/common.js';
import './s3dPropertyEditor.css';

//S3dWeb 属性编辑器
let S3dPropertyEditor = function () {
    //当前对象
    const thatS3dPropertyEditor = this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;
    this.positionPrecision = 4;
    this.rotationPrecision = 4;
    this.scalePrecision = 4;
    this.seniorInfoPrecision = 4;
    this.currentObjectJson = null;
    this.seniorInfoChanged = false;
    this.isProperty2DOnly = false;
    this.lastInfo = {
        objectId: null,
        offsetTop: 0
    };

    //事件
    this.eventFunctions = {};
    this.addEventFunction = function (eventName, func) {
        let allFuncs = thatS3dPropertyEditor.eventFunctions[eventName];
        if (allFuncs == null) {
            allFuncs = [];
            thatS3dPropertyEditor.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    };
    this.doEventFunction = function (eventName, p) {
        let allFuncs = thatS3dPropertyEditor.eventFunctions[eventName];
        if (allFuncs != null) {
            for (let i = 0; i < allFuncs.length; i++) {
                let func = allFuncs[i];
                func(p);
            }
        }
    };

    //初始化
    this.init = function (p) {
        thatS3dPropertyEditor.containerId = p.containerId;
        thatS3dPropertyEditor.manager = p.manager;
        thatS3dPropertyEditor.isProperty2DOnly = p.config.isProperty2DOnly ? true : false;
        thatS3dPropertyEditor.showEditor(p.config.title == null ? "属性编辑器" : p.config.title);
        thatS3dPropertyEditor.refreshProperties(null);
        $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorCloseBtn").click(function () {
            thatS3dPropertyEditor.hide();
        });

        //绑定事件
        //构建通用属性值改变后
        if (p.config.afterBaseInfoValueChanged != null) {
            thatS3dPropertyEditor.addEventFunction("afterBaseInfoValueChanged", p.config.afterBaseInfoValueChanged);
        }

        //构建位置、旋转、缩放值改变后
        if (p.config.afterPosRotScaleChanged != null) {
            thatS3dPropertyEditor.addEventFunction("afterPosRotScaleChanged", p.config.afterPosRotScaleChanged);
        }
        thatS3dPropertyEditor.show();
    };

    //隐藏非2D的属性
    this.refreshProperty2DVisible = function (isAllHidden) {
        let container = $("#" + thatS3dPropertyEditor.containerId);
        if (isAllHidden || thatS3dPropertyEditor.isProperty2DOnly) {
            $(container).find(".s3dPropertyEditorItemContainer[hiddenIn2D='true']").css({
                display: "none"
            });
        } else {
            $(container).find(".s3dPropertyEditorItemContainer[hiddenIn2D='true']").css({
                display: "block"
            });
        }
    };

    //隐藏
    this.hide = function () {
        $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorContainer").css({
            "display": "none"
        });
    };

    //隐藏
    this.show = function () {
        $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorContainer").css({
            "display": "block"
        });
    };

    //显示结构树
    this.showEditor = function (title) {
        //构造html
        let editorHtml = thatS3dPropertyEditor.getEditorHtml();
        let container = $("#" + thatS3dPropertyEditor.containerId);
        let blockContainer = $(container).find(".s3dLayoutBlock[name='propertyEditor']");
        $(blockContainer).append(editorHtml);
        $(blockContainer).find(".s3dPropertyEditorTabHeader").click(function () {
            let partContainer = $(this).parent();
            if ($(partContainer).hasClass("s3dPropertyEditorPartContainerActive")) {
                $(partContainer).removeClass("s3dPropertyEditorPartContainerActive");
            } else {
                $(partContainer).addClass("s3dPropertyEditorPartContainerActive");
            }
        });
    };

    //获取editor html
    this.getEditorHtml = function () {
        return "<div class=\"s3dPropertyEditorContainer\">" + "<div class=\"s3dPropertyEditorInnerContainer\">" + "<div class=\"s3dPropertyEditorSummaryContainer\">" + "<div class=\"s3dPropertyEditorSummaryHeader\"><div class=\"s3dPropertyEditorSummaryTitle\"></div></div>" + "</div>" + "<div class=\"s3dPropertyEditorPartContainer s3dPropertyEditorPartContainerActive\" name=\"baseInfo\">" + "<div class=\"s3dPropertyEditorTabHeader\"><div class=\"s3dPropertyEditorTabImage\">&#9654;</div><div class=\"s3dPropertyEditorTabTitle\">基础</div></div>" + "<div class=\"s3dPropertyEditorInfoContainer\"></div>" + "</div>" + "<div class=\"s3dPropertyEditorPartContainer s3dPropertyEditorPartContainerActive\" name=\"materialInfo\">" + "<div class=\"s3dPropertyEditorTabHeader\"><div class=\"s3dPropertyEditorTabImage\">&#9654;</div><div class=\"s3dPropertyEditorTabTitle\">材质</div></div>" + "<div class=\"s3dPropertyEditorInfoContainer\"></div>" + "</div>" + "<div class=\"s3dPropertyEditorPartContainer s3dPropertyEditorPartContainerActive\" name=\"seniorInfo\">" + "<div class=\"s3dPropertyEditorTabHeader\"><div class=\"s3dPropertyEditorTabImage\">&#9654;</div><div class=\"s3dPropertyEditorTabTitle\">参数</div></div>" + "<div class=\"s3dPropertyEditorInfoContainer\"></div>" + "</div>" + "<div class=\"s3dPropertyEditorPartContainer s3dPropertyEditorPartContainerActive\" name=\"animationInfo\">" + "<div class=\"s3dPropertyEditorTabHeader\"><div class=\"s3dPropertyEditorTabImage\">&#9654;</div><div class=\"s3dPropertyEditorTabTitle\">动画</div></div>" + "<div class=\"s3dPropertyEditorInfoContainer\"></div>" + "</div>" + "<div class=\"s3dPropertyEditorPartContainer\" name=\"structureInfo\">" + "<div class=\"s3dPropertyEditorTabHeader\"><div class=\"s3dPropertyEditorTabImage\">&#9654;</div><div class=\"s3dPropertyEditorTabTitle\">结构</div></div>" + "<div class=\"s3dPropertyEditorInfoContainer\"></div>" + "</div>" + "</div>" + "</div>";
    };

    //刷新属性值
    this.refreshPropertyValues = function (objectJson) {
        let componentInfo = null;
        if (objectJson.isInternal) {
            componentInfo = thatS3dPropertyEditor.manager.internalObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
        } else if (objectJson.isServer) {
            componentInfo = thatS3dPropertyEditor.manager.serverObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
        } else {
            componentInfo = null;
        }
        let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
        let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorPartContainer[name='baseInfo'] .s3dPropertyEditorInfoContainer")[0];
        thatS3dPropertyEditor.refreshBaseInfo(objectJson, baseInfoContainer);
        let seniorInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorPartContainer[name='seniorInfo'] .s3dPropertyEditorInfoContainer")[0];
        thatS3dPropertyEditor.refreshSeniorInfo(objectJson, componentInfo, seniorInfoContainer);
        let materialInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorPartContainer[name='materialInfo'] .s3dPropertyEditorInfoContainer")[0];
        thatS3dPropertyEditor.refreshMaterialInfo(objectJson, materialInfoContainer);
    };

    //刷新构造属性编辑器
    this.refreshProperties = function (objectJArray) {
        thatS3dPropertyEditor.blur();
        let container = $("#" + thatS3dPropertyEditor.containerId);
        let propertyEditorContainer = $(container).find(".s3dPropertyEditorContainer")[0];

        //记录最后一次的位置
        if (thatS3dPropertyEditor.currentObjectJson != null) {
            thatS3dPropertyEditor.lastInfo = {
                objectId: thatS3dPropertyEditor.currentObjectJson.id,
                code: thatS3dPropertyEditor.currentObjectJson.code,
                scrollTop: propertyEditorContainer.scrollTop
            };
        }
        if (objectJArray == null || objectJArray.length === 0) {
            thatS3dPropertyEditor.currentObjectJson = null;
            let infoHtml = "已选择 0 个物体";
            $(propertyEditorContainer).find(".s3dPropertyEditorSummaryTitle").html(infoHtml);
            $(propertyEditorContainer).find(".s3dPropertyEditorSummaryContainer").css({
                display: "block"
            });
            $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='baseInfo']").css({
                display: "none"
            });
            $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='seniorInfo']").css({
                display: "none"
            });
            $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='materialInfo']").css({
                display: "none"
            });
            $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='animationInfo']").css({
                display: "none"
            });
            $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='structureInfo']").css({
                display: "none"
            });
        } else if (objectJArray.length > 1) {
            thatS3dPropertyEditor.currentObjectJson = null;
            let infoHtml = "已选择 " + objectJArray.length + " 个物体";
            $(propertyEditorContainer).find(".s3dPropertyEditorSummaryTitle").html(infoHtml);
            $(propertyEditorContainer).find(".s3dPropertyEditorSummaryContainer").css({
                display: "block"
            });
            $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='baseInfo']").css({
                display: "none"
            });
            $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='seniorInfo']").css({
                display: "none"
            });
            $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='materialInfo']").css({
                display: "none"
            });
            $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='animationInfo']").css({
                display: "none"
            });
            $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='structureInfo']").css({
                display: "none"
            });
        } else {
            let infoHtml = "已选择 1 个物体";
            $(propertyEditorContainer).find(".s3dPropertyEditorSummaryTitle").html(infoHtml);
            $(propertyEditorContainer).find(".s3dPropertyEditorSummaryContainer").css({
                display: "none"
            });
            let objectJson = objectJArray[0];
            if (thatS3dPropertyEditor.currentObjectJson == null || thatS3dPropertyEditor.currentObjectJson.id !== objectJson.id) {
                thatS3dPropertyEditor.currentObjectJson = objectJson;
                thatS3dPropertyEditor.initBaseInfoContainer(propertyEditorContainer, objectJson);
                thatS3dPropertyEditor.initMaterialInfoContainer(propertyEditorContainer, objectJson);
                thatS3dPropertyEditor.initAnimationInfoContainer(propertyEditorContainer, objectJson);
                thatS3dPropertyEditor.initSeniorInfoContainer(propertyEditorContainer, objectJson);
                thatS3dPropertyEditor.initStructureInfoContainer(propertyEditorContainer, objectJson);
                $(propertyEditorContainer).find(".s3dPropertyEditorItemContainer").click(function () {
                    let editInnerContainer = $(this).parent().parent().parent()[0];
                    thatS3dPropertyEditor.highlightMaterialItem(this, editInnerContainer);
                });
                $(propertyEditorContainer).find(".s3dPropertyEditorItemInputMaterial").click(function () {
                    let toCode = $(this).attr("toCode");
                    let hasMaterial = toCode != null && toCode.length !== 0 && thatS3dPropertyEditor.manager.localMaterials.getUserMaterialInfo(toCode) != null;
                    if (hasMaterial) {
                        thatS3dPropertyEditor.manager.layout.showBlock("materialEditor");
                        thatS3dPropertyEditor.manager.materialEditor.scrollToItem(toCode);
                    } else {
                        if (msgBox.confirm({
                            info: "尚未自定义材质, 需要创建新材质吗?"
                        })) {
                            let sourceMatName = $(this).attr("matName");
                            thatS3dPropertyEditor.createUserMaterialBySourceMaterial(sourceMatName);
                        }
                    }
                });

                //滚动到上次的位置
                propertyEditorContainer.scrollTop = thatS3dPropertyEditor.lastInfo.scrollTop;
            }
        }
    };

    this.createUserMaterialBySourceMaterial = function (sourceMatName) {
        let objectJson = thatS3dPropertyEditor.currentObjectJson;
        let resourceObjectInfo = thatS3dPropertyEditor.manager.viewer.getResourceObjectInfo(objectJson);
        let objectMaterialHash = resourceObjectInfo.materialInfo.materialHash;
        let materialObject = objectMaterialHash[sourceMatName].material;
        let newMaterialInfo = thatS3dPropertyEditor.manager.localMaterials.createMaterialBySourceMaterial(materialObject);
        thatS3dPropertyEditor.manager.localMaterials.addUserMaterial(newMaterialInfo);
        thatS3dPropertyEditor.manager.materialEditor.insertMaterialItem(newMaterialInfo);
        thatS3dPropertyEditor.manager.materialEditor.editMaterialInfo(newMaterialInfo);

        thatS3dPropertyEditor.afterPickLocalMaterial({
            materialCode: newMaterialInfo.code,
            materialName: newMaterialInfo.name,
            paramInfo: {
                paramName: sourceMatName,
                nodeId: objectJson.id
            }
        });
    };

    this.initSeniorInfoContainer = function (propertyEditorContainer, objectJson) {
        let doesShow = objectJson.type !== s3dElement3DType.group;
        $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='seniorInfo']").css({
            display: doesShow ? "block" : "none"
        });
        if (doesShow) {
            let componentInfo = null;
            let seniorInfoHtml = null;
            if (objectJson.isInternal) {
                componentInfo = thatS3dPropertyEditor.manager.internalObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
                seniorInfoHtml = thatS3dPropertyEditor.getInternalSeniorInfoContainerHtml(objectJson, componentInfo);
            } else if (objectJson.isServer) {
                componentInfo = thatS3dPropertyEditor.manager.serverObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
                seniorInfoHtml = thatS3dPropertyEditor.getSeniorInfoContainerHtml(objectJson, componentInfo);
            } else {
                componentInfo = thatS3dPropertyEditor.manager.localObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
                seniorInfoHtml = thatS3dPropertyEditor.getSeniorInfoContainerHtml(objectJson, componentInfo);
            }
            let seniorInfoContainer = $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='seniorInfo'] .s3dPropertyEditorInfoContainer")[0];
            $(seniorInfoContainer).html(seniorInfoHtml);
            thatS3dPropertyEditor.refreshSeniorInfo(objectJson, componentInfo, seniorInfoContainer);

            //数值类型属性
            let allListInputs = $(seniorInfoContainer).find(".s3dPropertyEditorItemInputList");
            $(allListInputs).change(function (e) {
                thatS3dPropertyEditor.changeSeniorInfoListValue(this);
            });

            //数值类型属性
            let allDecimalInputs = $(seniorInfoContainer).find(".s3dPropertyEditorItemInputDecimal");
            $(allDecimalInputs).bind("keypress", function (e) {
                return e.key >= '0' && e.key <= '9' || e.key == '.' || e.key === '-';
            });
            $(allDecimalInputs).bind("dragenter", function (e) {
                return false;
            });
            $(allDecimalInputs).bind("keydown", function (e) {
                let evt = window.event || e;
                if (evt.keyCode === 13) {
                    thatS3dPropertyEditor.changeSeniorInfoDecimalValue(this);
                }
                return true;
            });
            $(allDecimalInputs).change(function (e) {
                thatS3dPropertyEditor.changeSeniorInfoDecimalValue(this);
            });

            //字符串类型属性
            let allStringInputs = $(seniorInfoContainer).find(".s3dPropertyEditorItemInputString");
            $(allStringInputs).bind("keydown", function (e) {
                let evt = window.event || e;
                if (evt.keyCode === 13) {
                    thatS3dPropertyEditor.changeSeniorInfoStringValue(this);
                }
                return true;
            });
            $(allStringInputs).change(function (e) {
                thatS3dPropertyEditor.changeSeniorInfoStringValue(this);
            });

            //布尔类型属性
            let allBooleanInputs = $(seniorInfoContainer).find(".s3dPropertyEditorItemInputBoolean");
            $(allBooleanInputs).change(function (e) {
                thatS3dPropertyEditor.changeSeniorInfoBooleanValue(this);
            });

            //颜色属性
            let allColorInputs = $(seniorInfoContainer).find(".s3dPropertyEditorItemInputColor");
            $(allColorInputs).change(function (e) {
                thatS3dPropertyEditor.changeSeniorInfoColorValue(this);
            });

            //选点按钮
            let selectPointsInput = $(seniorInfoContainer).find(".s3dPropertyEditorItemSelectPoints");
            $(selectPointsInput).click(function (e) {
                let paramName = $(this).parent().children(".s3dPropertyEditorItemInput").attr("name");
                let objectJson = thatS3dPropertyEditor.currentObjectJson;
                let componentInfo = thatS3dPropertyEditor.manager.serverObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
                let param = componentInfo.parameters[paramName];
                let statusData = {
                    paramName: paramName,
                    locationType: param.paramType,
                    nodeId: objectJson.id
                };
                if (thatS3dPropertyEditor.manager.viewer.changeStatus({
                    status: s3dUiStatus.selectPoints,
                    statusData: statusData
                })) {
                    let pointCount = 0;
                    switch (param.paramType) {
                        case "point2D":
                        case "gisPoint2D":
                        case "point3D":
                        {
                            pointCount = 1;
                            break;
                        }
                        case "polyline2D":
                        case "polyline2DMix":
                        case "gisPolyline2D":
                        case "polyline3D":
                        {
                            pointCount = null;
                            break;
                        }
                    }
                    let defaultValue = param.defaultValue;
                    let inputValue = $(this).parent().find(".s3dPropertyEditorItemInput").val();
                    let pointStr = "";
                    if (defaultValue !== inputValue) {
                        pointStr = inputValue;
                    }
                    thatS3dPropertyEditor.manager.pointSelector.beginPlacePoints({
                        locationType: param.paramType,
                        pointCount: pointCount,
                        paramInfo: {
                            nodeId: objectJson.id,
                            paramName: paramName,
                            pointStr: pointStr,
                            afterSelectPoints: thatS3dPropertyEditor.afterViewerSelectPoints
                        }
                    });
                }
            });

            //选择材质按钮
            selectPointsInput = $(seniorInfoContainer).find(".s3dPropertyEditorItemMaterialPicker");
            $(selectPointsInput).click(function (e) {
                let paramName = $(this).parent().children(".s3dPropertyEditorItemInput").attr("name");
                let objectJson = thatS3dPropertyEditor.currentObjectJson;
                let statusData = {
                    paramName: paramName,
                    nodeId: objectJson.id
                };
                if (thatS3dPropertyEditor.manager.viewer.changeStatus({
                    status: s3dUiStatus.pop,
                    statusData: statusData
                })) {
                    let materialName = $(this).parent().find(".s3dPropertyEditorItemInput").val();
                    thatS3dPropertyEditor.manager.materialPicker.showPicker({
                        paramInfo: {
                            nodeId: objectJson.id,
                            paramName: paramName,
                            materialName: materialName,
                            afterPickMaterial: thatS3dPropertyEditor.afterSeniorPickMaterial
                        }
                    });
                }
            });

            //应用按钮
            let applyBtn = $(seniorInfoContainer).find(".s3dPropertyEditorSeniorApplyBtn")[0];
            $(applyBtn).click(function (e) {
                if (thatS3dPropertyEditor.seniorInfoChanged) {
                    thatS3dPropertyEditor.seniorInfoChanged = false;
                    let objectJson = thatS3dPropertyEditor.currentObjectJson;

                    //开始记录到undo list
                    thatS3dPropertyEditor.beginAddToUndoList(objectJson.id);
                    let newSeniorValues = thatS3dPropertyEditor.getNewSeniorValues(objectJson);
                    thatS3dPropertyEditor.manager.viewer.setObjectParameters(objectJson.id, newSeniorValues);

                    /*改为造型结束后，记录undo，否则位置信息不对
                                   //结束记录到undo list
                                   thatS3dPropertyEditor.endAddToUndoList(objectJson.id, newSeniorValues);
                                    */
                } else {
                    msgBox.alert({
                        info: "请先修改高级属性值."
                    });
                }
            });
        }
    };

    this.applySeniorInfo = function (){
        if (thatS3dPropertyEditor.seniorInfoChanged) {
            thatS3dPropertyEditor.seniorInfoChanged = false;
            let objectJson = thatS3dPropertyEditor.currentObjectJson;

            //开始记录到undo list
            thatS3dPropertyEditor.beginAddToUndoList(objectJson.id);
            let newSeniorValues = thatS3dPropertyEditor.getNewSeniorValues(objectJson);
            thatS3dPropertyEditor.manager.viewer.setObjectParameters(objectJson.id, newSeniorValues);

            /*改为造型结束后，记录undo，否则位置信息不对
                           //结束记录到undo list
                           thatS3dPropertyEditor.endAddToUndoList(objectJson.id, newSeniorValues);
                            */
        }
    }

    this.initStructureInfoContainer = function (propertyEditorContainer, objectJson) {
        let doesShow = objectJson.type === s3dElement3DType.unit;
        $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='structureInfo']").css({
            display: doesShow ? "block" : "none"
        });
        if (doesShow) {
            let structureInfoHtml = objectJson.isServer ? "" : thatS3dPropertyEditor.getStructureInfoContainerHtml(objectJson);
            let structureInfoContainer = $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='structureInfo'] .s3dPropertyEditorInfoContainer")[0];
            $(structureInfoContainer).html(structureInfoHtml);
        }
    };

    this.getStructureInfoContainerHtml = function (objectJson) {
        let object3d = thatS3dPropertyEditor.manager.viewer.getObject3DById(objectJson.id);
        let html = "<div class='s3dPropertyEditorStructureInnerContainer'>Root<br/>";
        html += this.getSubStructureHtml(object3d.children[0].children[0], "&nbsp;&nbsp;&nbsp;");
        html += "</div>";
        return html;
    };

    this.getSubStructureHtml = function (object3d, prefix) {
        let html = "";
        for (let i = 0; i < object3d.children.length; i++) {
            let subObj = object3d.children[i];
            let name = subObj.name.trim();
            if (i === object3d.children.length - 1) {
                html += prefix + "└─" + (name.length === 0 ? "(无名)" : name) + "<br/>";
                html += this.getSubStructureHtml(subObj, prefix + "&nbsp;&nbsp;&nbsp;&nbsp;");
            } else {
                html += prefix + "├─" + (name.length === 0 ? "(无名)" : name) + "<br/>";
                html += this.getSubStructureHtml(subObj, prefix + "│&nbsp;&nbsp;&nbsp;&nbsp;");
            }
        }
        return html;
    };

    this.initAnimationInfoContainer = function (propertyEditorContainer, objectJson) {
        let doesShow = objectJson.type === s3dElement3DType.unit;
        $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='animationInfo']").css({
            display: doesShow ? "block" : "none"
        });
        if (doesShow) {
            let animationInfoHtml = objectJson.isServer ? "" : thatS3dPropertyEditor.getAnimationInfoContainerHtml(objectJson);
            let animationInfoContainer = $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='animationInfo'] .s3dPropertyEditorInfoContainer")[0];
            $(animationInfoContainer).html(animationInfoHtml);
            $(animationInfoContainer).find(".s3dPropertyEditorAnimationRunBtn").click(function () {
                let animationName = $(this).parent().find(".s3dPropertyEditorAnimationName").attr("animationName");
                let objectId = thatS3dPropertyEditor.currentObjectJson.id;
                thatS3dPropertyEditor.manager.viewer.runAnimation(objectId, animationName);
            });
        }
    };

    this.getAnimationInfoContainerHtml = function (objectJson) {
        let resourceObjectInfo = thatS3dPropertyEditor.manager.viewer.getResourceObjectInfo(objectJson);
        let resourceObject3d = resourceObjectInfo.object3D.children[0];
        let animations = resourceObject3d.animations;
        let html = "";
        if (animations == null || animations.length === 0) {
            html += "<div class='s3dPropertyEditorAnimationItem'>无自带动画</div>";
        } else {
            for (let i = 0; i < animations.length; i++) {
                let animation = animations[i];
                html += "<div class='s3dPropertyEditorAnimationItem'><div class='s3dPropertyEditorAnimationName' animationName='" + animation.name + "'>" + animation.name + "</div><div class='s3dPropertyEditorAnimationRunBtn'>执行</div></div>";
            }
        }
        return html;
    };

    this.initMaterialInfoContainer = function (propertyEditorContainer, objectJson) {
        let doesShow = objectJson.type === s3dElement3DType.unit;
        $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='materialInfo']").css({
            display: doesShow ? "block" : "none"
        });
        if (doesShow) {
            let materialInfoHtml = objectJson.isServer ? "" : thatS3dPropertyEditor.getMaterialInfoContainerHtml(objectJson);
            let materialInfoContainer = $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='materialInfo'] .s3dPropertyEditorInfoContainer")[0];
            $(materialInfoContainer).html(materialInfoHtml);
            thatS3dPropertyEditor.refreshMaterialInfo(objectJson, materialInfoContainer);

            //显示材质代码
            $(materialInfoContainer).find(".s3dPropertyEditorMaterialCode").click(function () {
                let materialInfoContainer = $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='materialInfo'] .s3dPropertyEditorInfoContainer")[0];
                let sourceMatName = $(this).parent().parent().attr("matName");
                let toCode = $(materialInfoContainer).find(".s3dPropertyEditorItemInput[name='material'][matName='" + sourceMatName + "']").attr("toCode");
                let matName = toCode == null || toCode.length === 0 ? sourceMatName : toCode;
                let objectId = thatS3dPropertyEditor.currentObjectJson.id;
                let object3d = thatS3dPropertyEditor.manager.viewer.getObject3DById(objectId);
                let objMaterialInfo = thatS3dPropertyEditor.manager.resourceLoader.getObject3DMaterialInfo(object3d);
                let material = objMaterialInfo.materialHash[matName].material;
                let materialJson = material.toJSON();
                if (materialJson.images != null) {
                    for (let i = 0; i < materialJson.images.length; i++) {
                        let image = materialJson.images[i];
                        if (typeof image.url === "string") {
                            if (image.url.startWith("data:image")) {
                                image.url = "data:image";
                            }
                        } else {
                            image.url.data = null;
                        }
                    }
                }
                msgBox.alert({
                    info: JSON.stringify(materialJson, null, 2)
                });
            });

            //选择材质按钮
            let selectPointsInput = $(materialInfoContainer).find(".s3dPropertyEditorItemMaterialPicker");
            $(selectPointsInput).click(function (e) {
                let paramName = $(this).parent().children(".s3dPropertyEditorItemInput").attr("matName");
                let objectJson = thatS3dPropertyEditor.currentObjectJson;
                let statusData = {
                    paramName: paramName,
                    nodeId: objectJson.id
                };
                if (thatS3dPropertyEditor.manager.viewer.changeStatus({
                    status: s3dUiStatus.pop,
                    statusData: statusData
                })) {
                    let materialCode = $(this).parent().find(".s3dPropertyEditorItemInput").attr("toCode");
                    let materialName = $(this).parent().find(".s3dPropertyEditorItemInput").val();
                    thatS3dPropertyEditor.manager.localMaterialPicker.showPicker({
                        paramInfo: {
                            nodeId: objectJson.id,
                            paramName: paramName,
                            materialCode: materialCode,
                            materialName: materialName,
                            afterPickMaterial: thatS3dPropertyEditor.afterPickLocalMaterial
                        }
                    });
                }
            });
        }
    };

    this.scrollToMaterialItem = function (matName) {
        let container = $("#" + thatS3dPropertyEditor.containerId);
        let propertyEditorContainer = $(container).find(".s3dPropertyEditorContainer")[0];
        let editorInnerContainer = $(propertyEditorContainer).find(".s3dPropertyEditorInnerContainer")[0];
        let partContainer = $(editorInnerContainer).find(".s3dPropertyEditorPartContainer[name='materialInfo']")[0];
        $(partContainer).addClass("s3dPropertyEditorPartContainerActive");
        let materialItem = $(partContainer).find(".s3dPropertyEditorItemInputMaterial[matName='" + matName + "']").parent().parent()[0];
        if(materialItem != null) {
            let scrollTop = $(materialItem).offset().top - $(editorInnerContainer).offset().top;
            propertyEditorContainer.scrollTop = scrollTop - 10;
            thatS3dPropertyEditor.highlightMaterialItem(materialItem, editorInnerContainer);
        }
    };

    this.highlightMaterialItem = function (item, editInnerContainer) {
        $(editInnerContainer).find(".s3dPropertyEditorItemContainer").removeClass("s3dPropertyEditorItemContainerHighlight");
        $(item).addClass("s3dPropertyEditorItemContainerHighlight");
    };

    //设置本地构件材质属性值
    this.changeLocalObject3DMaterialPropertyValue = function (objectId, materialName, propertyName, propertyValue) {
        let object3D = thatS3dPropertyEditor.manager.viewer.allObject3DMap[objectId];
        let info = object3D.userData.info;
        if (info.materials == null) {
            info.materials = {};
        }
        let materialInfo = info.materials[materialName];
        if (materialInfo == null) {
            materialInfo = {};
            info.materials[materialName] = materialInfo;
        }
        if (propertyValue == null || propertyValue.length === 0) {
            delete materialInfo[propertyName];
        } else {
            materialInfo[propertyName] = propertyValue;
        }
        return thatS3dPropertyEditor.manager.localObjectCreator.setLocalObject3DMaterialPropertyValue(object3D, info, materialName, propertyName, propertyValue);
    };

    this.afterViewerSelectPoints = function (p) {
        let points = p.points;
        let paramName = p.paramInfo.paramName;
        if (thatS3dPropertyEditor.currentObjectJson != null && thatS3dPropertyEditor.currentObjectJson.id === p.paramInfo.nodeId) {
            let paramValue = "";
            switch (p.locationType) {
                case "point2D":
                case "gisPoint2D":
                {
                    let point = points[0];
                    paramValue = cmnPcr.toFixed(common3DFunction.s2v(point.x, thatS3dPropertyEditor.manager.viewer.distanceRatio), thatS3dPropertyEditor.positionPrecision) + "," + cmnPcr.toFixed(common3DFunction.s2v(point.z, thatS3dPropertyEditor.manager.viewer.distanceRatio), thatS3dPropertyEditor.positionPrecision);
                    break;
                }
                case "point3D":
                {
                    let point = points[0];
                    paramValue = cmnPcr.toFixed(common3DFunction.s2v(point.x, thatS3dPropertyEditor.manager.viewer.distanceRatio), thatS3dPropertyEditor.positionPrecision) + "," + cmnPcr.toFixed(common3DFunction.s2v(point.y, thatS3dPropertyEditor.manager.viewer.distanceRatio), thatS3dPropertyEditor.positionPrecision) + "," + cmnPcr.toFixed(common3DFunction.s2v(point.z, thatS3dPropertyEditor.manager.viewer.distanceRatio), thatS3dPropertyEditor.positionPrecision);
                    break;
                }
                case "polyline2D":
                case "gisPolyline2D":
                {
                    for (let i = 0; i < points.length; i++) {
                        if (i !== 0) {
                            paramValue += ";";
                        }
                        let point = points[i];
                        paramValue += cmnPcr.toFixed(common3DFunction.s2v(point.x, thatS3dPropertyEditor.manager.viewer.distanceRatio), thatS3dPropertyEditor.positionPrecision) + "," + cmnPcr.toFixed(common3DFunction.s2v(point.z, thatS3dPropertyEditor.manager.viewer.distanceRatio), thatS3dPropertyEditor.positionPrecision);
                    }
                    break;
                }
                case "polyline2DMix":
                {
                    for (let i = 0; i < points.length; i++) {
                        if (i !== 0) {
                            paramValue += ";";
                        }
                        let point = points[i];
                        paramValue += cmnPcr.toFixed(common3DFunction.s2v(point.x, thatS3dPropertyEditor.manager.viewer.distanceRatio), thatS3dPropertyEditor.positionPrecision) + "," + cmnPcr.toFixed(common3DFunction.s2v(point.z, thatS3dPropertyEditor.manager.viewer.distanceRatio), thatS3dPropertyEditor.positionPrecision) + (point.isCurve ? ",b" : "");
                    }
                    break;
                }
                case "polyline3D":
                {
                    for (let i = 0; i < points.length; i++) {
                        if (i !== 0) {
                            paramValue += ";";
                        }
                        let point = points[i];
                        paramValue += cmnPcr.toFixed(common3DFunction.s2v(point.x, thatS3dPropertyEditor.manager.viewer.distanceRatio), thatS3dPropertyEditor.positionPrecision) + "," + cmnPcr.toFixed(common3DFunction.s2v(point.y, thatS3dPropertyEditor.manager.viewer.distanceRatio), thatS3dPropertyEditor.positionPrecision) + "," + cmnPcr.toFixed(common3DFunction.s2v(point.z, thatS3dPropertyEditor.manager.viewer.distanceRatio), thatS3dPropertyEditor.positionPrecision);
                    }
                    break;
                }
            }
            let componentInfo = thatS3dPropertyEditor.manager.serverObjectCreator.getComponentInfo(thatS3dPropertyEditor.currentObjectJson.code, thatS3dPropertyEditor.currentObjectJson.versionNum);
            let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
            let seniorInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorPartContainer[name='seniorInfo'] .s3dPropertyEditorInfoContainer")[0];
            let input = $(seniorInfoContainer).find(".s3dPropertyEditorItemInput[name='" + paramName + "']")[0];
            let sourceValue = $(input).attr("sourceValue");
            thatS3dPropertyEditor.setSeniorValue(paramName, paramValue, componentInfo, seniorInfoContainer);
            thatS3dPropertyEditor.seniorInfoValueChange(paramName, sourceValue, paramValue);
            thatS3dPropertyEditor.manager.viewer.changeStatus({
                status: s3dUiStatus.normalView
            });
        }
    };

    this.afterSeniorPickMaterial = function (p) {
        let paramValue = p.materialName;
        let paramName = p.paramInfo.paramName;
        let componentInfo = thatS3dPropertyEditor.manager.serverObjectCreator.getComponentInfo(thatS3dPropertyEditor.currentObjectJson.code, thatS3dPropertyEditor.currentObjectJson.versionNum);
        let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
        let seniorInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorPartContainer[name='seniorInfo'] .s3dPropertyEditorInfoContainer")[0];
        let input = $(seniorInfoContainer).find(".s3dPropertyEditorItemInput[name='" + paramName + "']")[0];
        let sourceValue = $(input).attr("sourceValue");
        thatS3dPropertyEditor.setSeniorValue(paramName, paramValue, componentInfo, seniorInfoContainer);
        thatS3dPropertyEditor.seniorInfoValueChange(paramName, sourceValue, paramValue);
        thatS3dPropertyEditor.manager.viewer.changeStatus({
            status: s3dUiStatus.normalView
        });
    };

    this.afterPickLocalMaterial = function (p) {
        let newMaterialCode = p.materialCode;
        let newMaterialName = p.materialName;
        let sourceMaterialName = p.paramInfo.paramName;
        let objectId = p.paramInfo.nodeId;
        let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
        let materialInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorPartContainer[name='materialInfo'] .s3dPropertyEditorInfoContainer")[0];
        let newMaterial = thatS3dPropertyEditor.changeLocalObject3DMaterial(objectId, sourceMaterialName, newMaterialCode);
        let colorStr = cmnPcr.colorToString(newMaterial.color);
        thatS3dPropertyEditor.setMaterialValue(sourceMaterialName, newMaterialCode, newMaterialName, colorStr, materialInfoContainer);
    };

    //设置本地构件材质
    this.changeLocalObject3DMaterial = function (objectId, sourceMaterialName, newMaterialCode) {
        let object3D = thatS3dPropertyEditor.manager.viewer.allObject3DMap[objectId];
        let info = object3D.userData.info;
        if (info.materials == null) {
            info.materials = {};
        }
        let materialInfo = info.materials[sourceMaterialName];
        if (materialInfo == null) {
            materialInfo = {};
            info.materials[sourceMaterialName] = materialInfo;
        }
        if (newMaterialCode == null || newMaterialCode.length === 0) {
            delete materialInfo.code;
        }
        else {
            materialInfo.code = newMaterialCode;
        }
        return thatS3dPropertyEditor.manager.localObjectCreator.setLocalObject3DMaterial(object3D, info, sourceMaterialName, newMaterialCode);
    };

    this.setMaterialValue = function (sourceMaterialName, newMaterialCode, newMaterialName, colorStr, materialInfoContainer) {
        let input = $(materialInfoContainer).find(".s3dPropertyEditorItemInput[matName='" + sourceMaterialName + "'][name='material']");
        $(input).attr("toCode", newMaterialCode);
        $(input).val(newMaterialName);
        let btn = $(input).parent().find(".s3dPropertyEditorItemMaterialPicker");
        $(btn).css("background-color", colorStr);
        $(input).css("background-color", colorStr);
    };

    this.getNewSeniorValues = function (objectJson) {
        let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
        let seniorInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorPartContainer[name='seniorInfo'] .s3dPropertyEditorInfoContainer")[0];
        let seniorValues = {};
        let componentInfo;
        if (objectJson.isInternal) {
            componentInfo = thatS3dPropertyEditor.manager.internalObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
        } else if (objectJson.isServer) {
            componentInfo = thatS3dPropertyEditor.manager.serverObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
        } else {
            componentInfo = thatS3dPropertyEditor.manager.localObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
        }
        for (let paramName in componentInfo.parameters) {
            let param = componentInfo.parameters[paramName];
            let value = null;
            if (param.isEditable) {
                let input = $(seniorInfoContainer).find(".s3dPropertyEditorItemInput[name='" + paramName + "']")[0];
                let valueStr = $(input).val();
                if (valueStr == null) {
                    valueStr = "";
                }
                switch (param.paramType) {
                    case "string":
                    case "material":
                    {
                        value = valueStr;
                        break;
                    }
                    case "color":
                    {
                        value = valueStr.length === 0 ? "DDDDDD" : valueStr.substr(1);
                        break;
                    }
                    case "boolean":
                    {
                        value = $(input).prop("checked");
                        break;
                    }
                    case "decimal":
                    case "integer":
                    {
                        valueStr = valueStr.trim();
                        value = valueStr.length === 0 ? null : cmnPcr.strToDecimal(valueStr);
                        break;
                    }
                    case "distance":
                    {
                        valueStr = valueStr.trim();
                        value = valueStr.length === 0 ? null : common3DFunction.v2s(cmnPcr.strToDecimal(valueStr), thatS3dPropertyEditor.manager.viewer.distanceRatio);
                        break;
                    }
                    case "angle":
                    {
                        valueStr = valueStr.trim();
                        value = valueStr.length === 0 ? null : common3DFunction.degree2radian(cmnPcr.strToDecimal(valueStr));
                        break;
                    }
                    case "date":
                    {
                        value = valueStr.length === 0 ? null : cmnPcr.strToDate(valueStr);
                        break;
                    }
                    case "time":
                    {
                        value = valueStr.length === 0 ? null : cmnPcr.strToTime(valueStr);
                        break;
                    }
                    default:
                    {
                        value = valueStr;
                        break;
                    }
                }
            } else {
                let objectParam = objectJson.parameters[paramName];
                if (objectParam == null) {
                    switch (param.paramType) {
                        case "string":
                        case "material":
                        {
                            value = "";
                            break;
                        }
                        case "boolean":
                        {
                            value = null;
                            break;
                        }
                        case "decimal":
                        {
                            value = null;
                            break;
                        }
                        default:
                        {
                            value = "";
                            break;
                        }
                    }
                } else {
                    value = objectParam.value;
                }
            }
            seniorValues[paramName] = {
                value: value
            };
        }
        return seniorValues;
    };

    this.initBaseInfoContainer = function (propertyEditorContainer, objectJson) {
        $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='baseInfo']").css({
            display: "block"
        });
        {
            let baseInfoHtml = thatS3dPropertyEditor.getBaseInfoContainerHtml(objectJson);
            let baseInfoContainer = $(propertyEditorContainer).find(".s3dPropertyEditorPartContainer[name='baseInfo'] .s3dPropertyEditorInfoContainer")[0];
            $(baseInfoContainer).html(baseInfoHtml);
            thatS3dPropertyEditor.refreshBaseInfo(objectJson, baseInfoContainer);

            //名称属性
            let nameInput = $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='name']")[0];
            $(nameInput).change(function (e) {
                thatS3dPropertyEditor.changeBaseInfoNameValue(this);
            });

            /* 暂时隐藏
            //useWorldPosition
            let useWorldPositionInput = $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='useWorldPosition']")[0];
            $(useWorldPositionInput).change(function (e) {
                thatS3dPropertyEditor.changeBaseInfoUseWorldPositionValue(this);
            });
             */

            //阴影
            let castShadowInput = $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='castShadow']")[0];
            $(castShadowInput).change(function (e) {
                thatS3dPropertyEditor.changeBaseInfoCastShadowValue(this);
            });
            let receiveShadowInput = $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='receiveShadow']")[0];
            $(receiveShadowInput).change(function (e) {
                thatS3dPropertyEditor.changeBaseInfoReceiveShadowValue(this);
            });

            //位置、旋转属性
            let allDecimalInputs = $(baseInfoContainer).find(".s3dPropertyEditorItemInputDecimal");
            $(allDecimalInputs).bind("keypress", function (e) {
                return event.key >= '0' && event.key <= '9' || event.key === '.' || event.key === '-';
            });
            $(allDecimalInputs).bind("dragenter", function (e) {
                return false;
            });
            $(allDecimalInputs).bind("keydown", function (e) {
                let evt = window.event || e;
                if (evt.keyCode === 13) {
                    thatS3dPropertyEditor.changeBaseInfoDecimalValue(this);
                }
                return true;
            });
            $(allDecimalInputs).change(function (e) {
                thatS3dPropertyEditor.changeBaseInfoDecimalValue(this);
            });
        }
    };

    this.blur = function () {
        let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
        $(propertyEditorInnerContainer).find(".s3dPropertyEditorItemInput").blur();
        if (thatS3dPropertyEditor.seniorInfoChanged) {
            msgBox.alert({
                info: "修改高级属性后未点击应用按钮, 系统放弃编辑结果."
            });
            thatS3dPropertyEditor.seniorInfoChanged = false;
        }
    };

    //当name属性改变时
    this.changeBaseInfoNameValue = function (input) {
        let str = $(input).val().trim();
        let sourceValue = $(input).attr("sourceValue");
        if (str.length === 0) {
            $(input).val(sourceValue);
        } else if (str !== sourceValue) {
            if (thatS3dPropertyEditor.manager.viewer.checkObjectName(str)) {
                //重名
                msgBox.alert({
                    info: "与其它物体重名"
                });
                $(input).val(sourceValue);
            } else {
                $(input).attr("sourceValue", str);
                let baseInfoName = $(input).attr("name");
                thatS3dPropertyEditor.baseInfoValueChange(baseInfoName, sourceValue, str);
            }
        }
    };

    //当下拉的高级属性改变时
    this.changeSeniorInfoListValue = function (input) {
        let itemContainer = $(input).parent().parent()[0];
        let seniorInfoName = $(input).attr("name");
        let str = $(input).val().trim();
        let newValue = null;
        let paramType = $(itemContainer).attr("paramType");
        let sourceValue = $(input).attr("sourceValue");
        switch (paramType) {
            case "string":
            case "material":
            {
                newValue = str;
                break;
            }
            case "boolean":
            {
                newValue = str === "是" || str.toUpperCase() === "TRUE" || str.toUpperCase() === "Y" ? "Y" : "N";
                break;
            }
            case "decimal":
            {
                newValue = cmnPcr.strToDecimal(str);
                break;
            }
            default:
            {
                newValue = str;
                break;
            }
        }
        thatS3dPropertyEditor.seniorInfoValueChange(seniorInfoName, sourceValue, newValue);
    };

    //当Decimal类型高级属性改变时
    this.changeSeniorInfoDecimalValue = function (input) {
        let itemContainer = $(input).parent().parent()[0];
        let seniorInfoName = $(input).attr("name");
        let minValueStr = $(itemContainer).attr("minValue").trim();
        let maxValueStr = $(itemContainer).attr("maxValue").trim();
        let minValue = minValueStr.length === 0 ? null : cmnPcr.strToDecimal(minValueStr);
        let maxValue = maxValueStr.length === 0 ? null : cmnPcr.strToDecimal(maxValueStr);
        let isNullable = $(itemContainer).attr("isNullable") === "true";
        let sourceValue = cmnPcr.strToDecimal($(input).attr("sourceValue"));
        let str = $(input).val().trim();
        let hasChange = false;
        let newValue = null;
        if (str.length === 0) {
            if (isNullable) {
                hasChange = sourceValue.length !== 0;
            } else {
                $(input).val(sourceValue);
            }
        } else {
            let precision = thatS3dPropertyEditor.seniorInfoPrecision;
            if (cmnPcr.isDecimal(str)) {
                newValue = cmnPcr.toFixed(str, precision);
                if (minValue != null && newValue < minValue) {
                    newValue = minValue;
                    $(input).val(newValue);
                    msgBox.alert({
                        info: "属性 " + seniorInfoName + " 的值不能小于" + minValue
                    });
                } else if (maxValue != null && newValue > maxValue) {
                    newValue = maxValue;
                    $(input).val(newValue);
                    msgBox.alert({
                        info: "属性 " + seniorInfoName + " 的值不能大于" + maxValue
                    });
                } else {
                    $(input).attr("sourceValue", newValue);
                    $(input).val(newValue);
                    if (sourceValue !== newValue) {
                        hasChange = true;
                    }
                }
            } else {
                newValue = sourceValue;
                $(input).val(newValue);
            }
        }
        if (hasChange) {
            thatS3dPropertyEditor.seniorInfoValueChange(seniorInfoName, sourceValue, newValue);
        }
    };

    //当String类型高级属性改变时
    this.changeSeniorInfoStringValue = function (input) {
        let itemContainer = $(input).parent().parent()[0];
        let seniorInfoName = $(input).attr("name");
        let isNullable = $(itemContainer).attr("isNullable") === "true";
        let sourceValue = $(input).attr("sourceValue");
        let newValue = $(input).val();
        let hasChange = false;
        if (newValue.length === 0) {
            if (isNullable) {
                hasChange = sourceValue.length !== 0;
                $(input).attr("sourceValue", "");
            } else {
                $(input).val(sourceValue);
            }
        } else {
            if (sourceValue !== newValue) {
                $(input).attr("sourceValue", newValue);
                hasChange = true;
            }
        }
        if (hasChange) {
            thatS3dPropertyEditor.seniorInfoValueChange(seniorInfoName, sourceValue, newValue);
        }
    };

    //当Boolean类型高级属性改变时
    this.changeSeniorInfoBooleanValue = function (input) {
        $(input).parent().parent()[0];
        let seniorInfoName = $(input).attr("name");
        let checked = $(input).prop("checked");
        thatS3dPropertyEditor.seniorInfoValueChange(seniorInfoName, !checked, checked);
    };

    //当颜色类型高级属性改变时
    this.changeSeniorInfoColorValue = function (input) {
        let itemContainer = $(input).parent().parent()[0];
        let seniorInfoName = $(input).attr("name");
        let isNullable = $(itemContainer).attr("isNullable") === "true";
        let sourceValue = $(input).attr("sourceValue");
        let newValue = $(input).val();
        let hasChange = false;
        if (newValue.length === 0) {
            if (isNullable) {
                hasChange = sourceValue.length !== 0;
                $(input).attr("sourceValue", "");
            } else {
                $(input).val(sourceValue);
            }
        } else {
            if (sourceValue !== newValue) {
                $(input).attr("sourceValue", newValue);
                hasChange = true;
            }
        }
        if (hasChange) {
            thatS3dPropertyEditor.seniorInfoValueChange(seniorInfoName, sourceValue, newValue);
        }
    };

    //当位置、旋转属性改变时
    this.changeBaseInfoDecimalValue = function (input) {
        let str = $(input).val();
        if (cmnPcr.trim(str) === "") {
            str = "0";
        }
        let hasChange = false;
        let newValue = null;
        let precision = cmnPcr.strToDecimal($(input).attr("precision"));
        let sourceValue = cmnPcr.strToDecimal($(input).attr("sourceValue"));
        if (cmnPcr.isDecimal(str)) {
            newValue = cmnPcr.toFixed(str, precision);
            $(input).attr("sourceValue", newValue);
            $(input).val(newValue);
            if (sourceValue !== newValue) {
                hasChange = true;
            }
        } else {
            newValue = sourceValue;
            $(input).val(newValue);
        }
        let baseInfoName = $(input).attr("name");
        if (hasChange) {
            thatS3dPropertyEditor.baseInfoValueChange(baseInfoName, sourceValue, newValue);
        }
    };

    //当useWorldPosition属性改变时
    this.changeBaseInfoUseWorldPositionValue = function (input) {
        let checked = $(input).prop("checked");
        let baseInfoName = $(input).attr("name");
        thatS3dPropertyEditor.baseInfoValueChange(baseInfoName, !checked, checked);
    };

    //当产生阴影属性改变时
    this.changeBaseInfoCastShadowValue = function (input) {
        let checked = $(input).prop("checked");
        let baseInfoName = $(input).attr("name");
        thatS3dPropertyEditor.baseInfoValueChange(baseInfoName, !checked, checked);
    };

    //当接收阴影属性改变时
    this.changeBaseInfoReceiveShadowValue = function (input) {
        let checked = $(input).prop("checked");
        let baseInfoName = $(input).attr("name");
        thatS3dPropertyEditor.baseInfoValueChange(baseInfoName, !checked, checked);
    };

    //高级属性改变
    this.seniorInfoValueChange = function (seniorInfoName, oldValue, newValue) {
        thatS3dPropertyEditor.seniorInfoChanged = true;
        $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorSeniorApplyBtn").addClass("s3dPropertyEditorSeniorApplyBtnChanged");
        thatS3dPropertyEditor.applySeniorInfo();
    };

    //开启添加到undo list
    this.beginAddToUndoList = function (nodeId) {
        let nodeJsons = [];
        let tree = thatS3dPropertyEditor.manager.treeEditor.getTreeJson();
        nodeJsons.push(thatS3dPropertyEditor.manager.viewer.cloneJsonById(nodeId));
        thatS3dPropertyEditor.manager.statusBar.beginAddToUndoList({
            operateType: s3dOperateType.edit,
            tree: tree,
            nodeJsons: nodeJsons
        });
    };

    //结束添加到undo list
    this.endAddToUndoList = function (nodeId, seniorInfoParameters) {
        let nodeJsons = [];
        let tree = thatS3dPropertyEditor.manager.treeEditor.getTreeJson();
        let nodeJson = thatS3dPropertyEditor.manager.viewer.cloneJsonById(nodeId);
        if (seniorInfoParameters != null) {
            for (let paramName in seniorInfoParameters) {
                nodeJson.parameters[paramName].value = seniorInfoParameters[paramName].value;
            }
        }
        nodeJsons.push(nodeJson);
        thatS3dPropertyEditor.manager.statusBar.endAddToUndoList({
            operateType: s3dOperateType.edit,
            tree: tree,
            nodeJsons: nodeJsons
        });
    };

    //静默改变属性值
    this.changeObjectInfoInSilence = function (nodeJsons) {
        for (let i = 0; i < nodeJsons.length; i++) {
            let nodeJson = nodeJsons[i];
            nodeJson.id;
            if (nodeJson.isInternal) {
                let newNodeJsons = [];
                newNodeJsons.push(nodeJson);
                thatS3dPropertyEditor.manager.viewer.removeObjectsInSilence(newNodeJsons);
                thatS3dPropertyEditor.manager.viewer.addNewObjectsInSilence(newNodeJsons);
            } else if (nodeJson.isServer) {
                let newNodeJsons = [];
                newNodeJsons.push(nodeJson);
                thatS3dPropertyEditor.manager.viewer.removeObjectsInSilence(newNodeJsons);
                thatS3dPropertyEditor.manager.viewer.addNewObjectsInSilence(newNodeJsons);
            } else {
                let newNodeJsons = [];
                newNodeJsons.push(nodeJson);
                thatS3dPropertyEditor.manager.viewer.removeObjectsInSilence(newNodeJsons);
                thatS3dPropertyEditor.manager.viewer.addNewObjectsInSilence(newNodeJsons);
            }
        }
    };

    //基本属性改变
    this.baseInfoValueChange = function (baseInfoName, oldValue, newValue) {
        let nodeId = thatS3dPropertyEditor.currentObjectJson.id;
        switch (baseInfoName) {
            case "name":
            {
                //开始记录到undo list
                thatS3dPropertyEditor.beginAddToUndoList(nodeId);

                //名称
                thatS3dPropertyEditor.manager.treeEditor.changeNodeName(nodeId, newValue);
                thatS3dPropertyEditor.manager.viewer.changeObject3DName(nodeId, newValue);

                //结束记录到undo list
                thatS3dPropertyEditor.endAddToUndoList(nodeId);
                break;
            }
            case "posX":
            case "posY":
            case "posZ":
            case "rotX":
            case "rotY":
            case "rotZ":
            case "scaleX":
            case "scaleY":
            case "scaleZ":
            case "useWorldPosition":
            {
                //开始记录到undo list
                thatS3dPropertyEditor.beginAddToUndoList(nodeId);
                let newPosition = thatS3dPropertyEditor.getNewPosition();
                let newRotation = thatS3dPropertyEditor.getNewRotation();
                let newScale = thatS3dPropertyEditor.getNewScale();
                let newUseWorldPosition = thatS3dPropertyEditor.getNewUseWorldPosition();
                thatS3dPropertyEditor.manager.viewer.setObjectPositionRotationScaleById(nodeId, newUseWorldPosition, newPosition, newRotation, newScale);

                //设置当前对象为中心点
                thatS3dPropertyEditor.manager.viewer.setCenterObjectById(nodeId);
                let nodeJson = thatS3dPropertyEditor.manager.viewer.getNodeJson(nodeId);
                thatS3dPropertyEditor.manager.moveHelper.attach([nodeJson]);
                thatS3dPropertyEditor.afterChangeUseWorldPosition(newUseWorldPosition);
                thatS3dPropertyEditor.refreshBaseInfoDecimalValues(nodeJson);

                //结束记录到undo list
                thatS3dPropertyEditor.endAddToUndoList(nodeId);
                break;
            }
            case "castShadow":
            {
                //开始记录到undo list
                thatS3dPropertyEditor.beginAddToUndoList(nodeId);
                thatS3dPropertyEditor.manager.viewer.updateObjectCastShadow(nodeId, newValue);

                //结束记录到undo list
                thatS3dPropertyEditor.endAddToUndoList(nodeId);
                break;
            }
            case "receiveShadow":
            {
                //开始记录到undo list
                thatS3dPropertyEditor.beginAddToUndoList(nodeId);
                thatS3dPropertyEditor.manager.viewer.updateObjectReceiveShadow(nodeId, newValue);

                //结束记录到undo list
                thatS3dPropertyEditor.endAddToUndoList(nodeId);
                break;
            }
        }

        //当通用属性值改变后 added by ls 20220922
        thatS3dPropertyEditor.afterBaseInfoValueChanged({
            nodeId: nodeId,
            propertyName: baseInfoName,
            oldValue: oldValue,
            newValue: newValue
        });
        switch (baseInfoName) {
            case "posX":
            case "posY":
            case "posZ":
            {
                thatS3dPropertyEditor.afterPosRotScaleChanged({
                    id: nodeId,
                    propertyName: "position",
                    objectJson: thatS3dPropertyEditor.manager.viewer.getNodeJson(nodeId)
                });
                break;
            }
            case "rotX":
            case "rotY":
            case "rotZ":
            {
                thatS3dPropertyEditor.afterPosRotScaleChanged({
                    id: nodeId,
                    propertyName: "rotation",
                    objectJson: thatS3dPropertyEditor.manager.viewer.getNodeJson(nodeId)
                });
                break;
            }
            case "scaleX":
            case "scaleY":
            case "scaleZ":
            {
                thatS3dPropertyEditor.afterPosRotScaleChanged({
                    id: nodeId,
                    propertyName: "scale",
                    objectJson: thatS3dPropertyEditor.manager.viewer.getNodeJson(nodeId)
                });
                break;
            }
        }
    };
    this.afterBaseInfoValueChanged = function (p) {
        thatS3dPropertyEditor.doEventFunction("afterBaseInfoValueChanged", {
            nodeId: p.nodeId,
            propertyName: p.baseInfoName,
            oldValue: p.oldValue,
            newValue: p.newValue
        });
    };
    this.afterPosRotScaleChanged = function (p) {
        thatS3dPropertyEditor.doEventFunction("afterPosRotScaleChanged", {
            id: p.id,
            propertyName: p.propertyName,
            objectJson: p.objectJson
        });
    };
    this.getNewPosition = function () {
        let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
        let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorPartContainer[name='baseInfo'] .s3dPropertyEditorInfoContainer")[0];
        let posX = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='posX']").val());
        let posY = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='posY']").val());
        let posZ = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='posZ']").val());
        return {
            x: common3DFunction.v2s(posX, thatS3dPropertyEditor.manager.viewer.distanceRatio),
            y: common3DFunction.v2s(posY, thatS3dPropertyEditor.manager.viewer.distanceRatio),
            z: common3DFunction.v2s(posZ, thatS3dPropertyEditor.manager.viewer.distanceRatio)
        };
    };
    this.getNewRotation = function () {
        let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
        let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorPartContainer[name='baseInfo'] .s3dPropertyEditorInfoContainer")[0];
        let rotX = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='rotX']").val());
        let rotY = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='rotY']").val());
        let rotZ = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='rotZ']").val());
        return {
            x: common3DFunction.degree2radian(rotX),
            y: common3DFunction.degree2radian(rotY),
            z: common3DFunction.degree2radian(rotZ)
        };
    };
    this.getNewScale = function () {
        let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
        let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorPartContainer[name='baseInfo'] .s3dPropertyEditorInfoContainer")[0];
        let scaleX = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='scaleX']").val());
        let scaleY = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='scaleY']").val());
        let scaleZ = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='scaleZ']").val());
        return {
            x: scaleX,
            y: scaleY,
            z: scaleZ
        };
    };
    this.getNewUseWorldPosition = function () {
        let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
        let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorPartContainer[name='baseInfo'] .s3dPropertyEditorInfoContainer")[0];
        return $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='useWorldPosition']").prop("checked");
    };
    this.refreshSeniorInfo = function (objectJson, componentInfo, seniorInfoContainer) {
        if (componentInfo == null) {
            for (let paramName in objectJson.parameters) {
                let paramValue = objectJson.parameters[paramName].value;
                let input = $(seniorInfoContainer).find(".s3dPropertyEditorItemInput[name='" + paramName + "']");
                $(input).val(paramValue);
                $(input).attr("sourceValue", paramValue);
            }
        } else {
            for (let paramName in objectJson.parameters) {
                let paramValue = objectJson.parameters[paramName].value;
                this.setSeniorValue(paramName, paramValue, componentInfo, seniorInfoContainer);
            }
        }
    };
    this.refreshMaterialValues = function (objectJson) {
        if (objectJson == null) {
            objectJson = thatS3dPropertyEditor.currentObjectJson;
        }
        if (thatS3dPropertyEditor.currentObjectJson != null) {
            if (objectJson.id === thatS3dPropertyEditor.currentObjectJson.id && objectJson.type === s3dElement3DType.unit && objectJson.isLocal) {
                let objectInfo = thatS3dPropertyEditor.manager.viewer.cloneJsonById(objectJson.id);
                let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
                let materialInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorPartContainer[name='materialInfo'] .s3dPropertyEditorInfoContainer")[0];
                thatS3dPropertyEditor.refreshMaterialInfo(objectInfo, materialInfoContainer);
            }
        }
    };
    this.refreshMaterialInfo = function (objectJson, materialInfoContainer) {
        let resourcePartName = objectJson.parameters["组成部分"].value;
        let resourceObjectInfo = thatS3dPropertyEditor.manager.viewer.getResourceObjectInfo(objectJson);
        let objectMaterialHash = objectJson.materials;
        let materialInfo = resourceObjectInfo.materialInfo;
        let html = "";
        if (materialInfo != null) {
            let partMaterialNameHash = {};
            let pathHash = materialInfo.pathHash;
            for (let path in pathHash) {
                if (resourcePartName == null || resourcePartName.length === 0 || path.startWith(resourcePartName)) {
                    let pathMaterials = pathHash[path];
                    for (let i = 0; i < pathMaterials.length; i++) {
                        let materialName = pathMaterials[i];
                        if (!partMaterialNameHash[materialName]) {
                            partMaterialNameHash[materialName] = true;
                        }
                    }
                }
            }
            let materialHash = materialInfo.materialHash;
            for (let name in materialHash) {
                if (partMaterialNameHash[name]) {
                    let mInfo = materialHash[name];

                    //查看是否已制定替换material
                    let destMaterialInfo = objectMaterialHash == null || objectMaterialHash[name] == null ? null : objectMaterialHash[name];
                    let destMaterialCode = destMaterialInfo == null ? "" : destMaterialInfo.code == null ? "" : destMaterialInfo.code;
                    let materialInfo = thatS3dPropertyEditor.manager.localMaterials.getUserMaterialInfo(destMaterialCode);
                    let destMaterialName = null;
                    let colorStr;
                    if (materialInfo == null) {
                        colorStr = cmnPcr.colorToString(mInfo.color);
                    } else {
                        colorStr = cmnPcr.getColorStr(materialInfo.color);
                        destMaterialName = materialInfo.name;
                    }
                    thatS3dPropertyEditor.setMaterialValue(name, destMaterialCode, destMaterialName, colorStr, materialInfoContainer);
                }
            }
        }
        return html;
    };
    this.setSeniorValue = function (paramName, paramValue, componentInfo, seniorInfoContainer) {
        let comParam = componentInfo.parameters[paramName];
        let input = $(seniorInfoContainer).find(".s3dPropertyEditorItemInput[name='" + paramName + "']");
        if ($(input).hasClass("s3dPropertyEditorItemInputReadonly")) {
            $(input).val(paramValue);
        } else {
            if ($(input).hasClass("s3dPropertyEditorItemInputList")) {
                //处理下拉值类型是decimal的情况
                switch (comParam.paramType) {
                    case "decimal":
                    case "integer":
                    {
                        let options = $(input).children("option");
                        for (let i = 0; i < options.length; i++) {
                            let opValueStr = $(options[i]).text();
                            let opValue = cmnPcr.strToDecimal(opValueStr);
                            if (paramValue === opValue) {
                                $(input).val(opValueStr);
                                $(input).attr("sourceValue", opValueStr);
                                break;
                            }
                        }
                        break;
                    }
                    case "string":
                    {
                        $(input).val(paramValue);
                        $(input).attr("sourceValue", paramValue);
                        break;
                    }
                }
            } else {
                switch (comParam.paramType) {
                    case "color":
                    {
                        let colorValue = "#" + paramValue;
                        $(input).val(colorValue);
                        $(input).attr("sourceValue", colorValue);
                        break;
                    }
                    case "angle":
                    {
                        let angleValue = paramValue == null ? 0 : cmnPcr.toFixed(common3DFunction.radian2degree(paramValue), thatS3dPropertyEditor.rotationPrecision);
                        $(input).val(angleValue);
                        $(input).attr("sourceValue", angleValue);
                        break;
                    }
                    case "distance":
                    {
                        let distanceValue = paramValue == null ? 0 : common3DFunction.s2v(paramValue, thatS3dPropertyEditor.manager.viewer.distanceRatio);
                        $(input).val(distanceValue);
                        $(input).attr("sourceValue", distanceValue);
                        break;
                    }
                    case "boolean":
                    {
                        $(input).prop("checked", paramValue);
                        $(input).attr("sourceValue", paramValue);
                        break;
                    }
                    default:
                    {
                        $(input).val(paramValue);
                        $(input).attr("sourceValue", paramValue);
                        break;
                    }
                }
            }
        }
    };
    this.isSpecialParameter = function (listValues) {
        if (listValues instanceof Array) {
            return false;
        } else if (listValues.startWith("trigger:") || listValues.startWith("pop:") || listValues.startWith("list:")) {
            return true;
        } else {
            return false;
        }
    };
    this.getSeniorInfoContainerHtml = function (objectJson, componentInfo) {
        let html = "";
        if (componentInfo != null) {
            let allGroups = thatS3dPropertyEditor.sortAllGroupParameters(componentInfo.parameters);
            for (let i = 0; i < allGroups.length; i++) {
                let groupJson = allGroups[i];
                html = html + "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"" + (groupJson.name == null ? "" : groupJson.name) + "\">" + "<div class=\"s3dPropertyEditorItemGroup\"><div class=\"s3dPropertyEditorItemGroupTitle\">" + cmnPcr.htmlEncode(groupJson.name == null || groupJson.name.length == 0 ? "默认分组" : groupJson.name) + "</div></div>" + "</div>";
                for (let j = 0; j < groupJson.parameters.length; j++) {
                    let param = groupJson.parameters[j];
                    html = html + "<div class=\"s3dPropertyEditorItemContainer\"" + "paramType=\"" + param.paramType + "\" " + "isNullable=\"" + (param.isNullable ? "true" : "false") + "\" " + "minValue=\"" + param.minValue + "\" " + "maxValue=\"" + param.maxValue + "\" " + "><div class=\"s3dPropertyEditorItemTitle\">" + cmnPcr.htmlEncode(param.name) + "</div>";
                    if (!param.isEditable) {
                        html = html + "<div class=\"s3dPropertyEditorItemValue\"><input name=\"" + param.name + "\" type=\"text\" readonly class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputReadonly\" /></div>";
                    } else if (param.listValues.length > 0 && !thatS3dPropertyEditor.isSpecialParameter(param.listValues)) {
                        html = html + "<div class=\"s3dPropertyEditorItemValue\"><select type=\"text\" name=\"" + param.name + "\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputList\" >";
                        let listValues = param.listValues;
                        for (let k = 0; k < listValues.length; k++) {
                            let listValue = listValues[k];
                            html = html + "<option value=\"" + listValue.code + "\" >" + cmnPcr.htmlEncode(listValue.name) + "</option>";
                        }
                        html = html + "</select></div>";
                    } else {
                        switch (param.paramType) {
                            case "string":
                            {
                                html = html + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"" + param.name + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputString\" /></div>";
                                break;
                            }
                            case "boolean":
                            {
                                html = html + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"checkbox\" name=\"" + param.name + "\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputBoolean\" /></div>";
                                break;
                            }
                            case "decimal":
                            {
                                html = html + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"number\" name=\"" + param.name + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal\" " + (param.minValue == null ? "" : " min='" + param.minValue + "'") + (param.maxValue == null ? "" : " max='" + param.maxValue + "'") + (param.stepValue == null ? "" : " step='" + param.stepValue + "'") + " /></div>";
                                break;
                            }
                            case "material":
                            {
                                html = html + "<div class=\"s3dPropertyEditorItemValue\">" + "<input type=\"text\" name=\"" + param.name + "\" autocomplete=\"off\" readonly class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputString s3dPropertyEditorItemInputPop s3dPropertyEditorItemInputMaterial\" />" + "<div class=\"s3dPropertyEditorItemPop s3dPropertyEditorItemMaterialPicker\"></div>" + "</div>";
                                break;
                            }
                            case "point2D":
                            case "point3D":
                            case "polyline2D":
                            case "polyline2DMix":
                            case "polyline3D":
                            case "gisPoint2D":
                            case "gisPolyline2D":
                            {
                                html = html + "<div class=\"s3dPropertyEditorItemValue\">" + "<input type=\"text\" name=\"" + param.name + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputString s3dPropertyEditorItemInputPop\" />" + "<div class=\"s3dPropertyEditorItemPop s3dPropertyEditorItemSelectPoints\"></div>" + "</div>";
                                break;
                            }
                            default:
                            {
                                html = html + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" readonly name=\"" + param.name + "\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputReadonly\" /></div>";
                                break;
                            }
                        }
                    }
                    html = html + "</div>";
                }
            }
        } else {
            let html = ""
                //标识
                + "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"default\">" + "<div class=\"s3dPropertyEditorItemGroup\"><div class=\"s3dPropertyEditorItemGroupTitle\">默认分组</div></div>" + "</div>";
            for (let paramName in objectJson.parameters) {
                html = html + "<div class=\"s3dPropertyEditorItemContainer\">" + "<div class=\"s3dPropertyEditorItemTitle\">" + cmnPcr.htmlEncode(paramName) + "</div>" + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"" + paramName + "\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputString\" /></div>" + "</div>";
            }
        }
        /* 取消应用按钮
        html = html + "<div class=\"s3dPropertyEditorBottomContainer\">" + "<div class=\"s3dPropertyEditorItemBottom\"><div class=\"s3dPropertyEditorSeniorApplyBtn\">应用</div></div>" + "</div>";
        */
        return html;
    };
    this.getInternalSeniorInfoContainerHtml = function (objectJson, componentInfo) {
        let html = "";
        let allGroups = componentInfo.groups;
        for (let i = 0; i < allGroups.length; i++) {
            let groupJson = allGroups[i];
            html = html + "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"" + (groupJson.name == null ? "" : groupJson.name) + "\">" + "<div class=\"s3dPropertyEditorItemGroup\"><div class=\"s3dPropertyEditorItemGroupTitle\">" + cmnPcr.htmlEncode(groupJson.name == null || groupJson.name.length == 0 ? "默认分组" : groupJson.name) + "</div></div>" + "</div>";
            for (let j = 0; j < groupJson.parameters.length; j++) {
                let paramName = groupJson.parameters[j];
                let param = componentInfo.parameters[paramName];
                html = html + "<div class=\"s3dPropertyEditorItemContainer\"" + "paramType=\"" + param.paramType + "\" " + "isNullable=\"" + (param.isNullable ? "true" : "false") + "\" " + "minValue=\"" + param.minValue + "\" " + "maxValue=\"" + param.maxValue + "\" " + "><div class=\"s3dPropertyEditorItemTitle\">" + cmnPcr.htmlEncode(param.label) + "</div>";
                if (!param.isEditable) {
                    html = html + "<div class=\"s3dPropertyEditorItemValue\"><input name=\"" + param.name + "\" type=\"text\"  readonly class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputReadonly\" /></div>";
                } else if (param.listValues != null && param.listValues.length > 0 && !thatS3dPropertyEditor.isSpecialParameter(param.listValues)) {
                    html = html + "<div class=\"s3dPropertyEditorItemValue\"><select type=\"text\" name=\"" + param.name + "\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputList\" >";
                    let listValues = param.listValues;
                    for (let k = 0; k < listValues.length; k++) {
                        let listValue = listValues[k];
                        html = html + "<option value=\"" + listValue.code + "\" >" + cmnPcr.htmlEncode(listValue.name) + "</option>";
                    }
                    html = html + "</select></div>";
                } else {
                    switch (param.paramType) {
                        case "string":
                        {
                            html = html + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"" + param.name + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputString\" /></div>";
                            break;
                        }
                        case "boolean":
                        {
                            html = html + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"checkbox\" name=\"" + param.name + "\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputBoolean\" /></div>";
                            break;
                        }
                        case "decimal":
                        case "integer":
                        case "angle":
                        case "distance":
                        {
                            html = html + ("<div class=\"s3dPropertyEditorItemValue\"><input type=\"number\" name=\"" + param.name + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal\"" + (param.minValue == null ? "" : " min=\"" + param.minValue + "\"") + (param.maxValue == null ? "" : " max=\"" + param.maxValue + "\"") + (param.stepValue == null ? "" : " step=\"" + param.stepValue + "\"") + " /></div>");
                            break;
                        }
                        case "material":
                        {
                            html = html + "<div class=\"s3dPropertyEditorItemValue\">" + "<input type=\"text\" name=\"" + param.name + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputString s3dPropertyEditorItemInputPop s3dPropertyEditorItemInputMaterial\" />" + "<div class=\"s3dPropertyEditorItemPop s3dPropertyEditorItemMaterialPicker\"></div>" + "</div>";
                            break;
                        }
                        case "color":
                        {
                            html = html + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"color\" name=\"" + param.name + "\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputColor\" /></div>";
                            break;
                        }
                        case "date":
                        {
                            html = html + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"date\" name=\"" + param.name + "\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputString\" /></div>";
                            break;
                        }
                        case "time":
                        {
                            html = html + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"time\" name=\"" + param.name + "\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputString\" /></div>";
                            break;
                        }
                        default:
                        {
                            html = html + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"" + param.name + "\" readonly class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputReadonly\" /></div>";
                            break;
                        }
                    }
                }
                html = html + "</div>";
            }
        }
        /*取消应用按钮
        html = html + "<div class=\"s3dPropertyEditorBottomContainer\">" + "<div class=\"s3dPropertyEditorItemBottom\"><div class=\"s3dPropertyEditorSeniorApplyBtn\">应用</div></div>" + "</div>";
        */
        return html;
    };
    this.getMaterialInfoContainerHtml = function (objectJson) {
        let resourcePartName = objectJson.parameters["组成部分"].value;
        let resourceObjectInfo = thatS3dPropertyEditor.manager.viewer.getResourceObjectInfo(objectJson);
        let objectMaterialHash = objectJson.materials;
        let materialInfo = resourceObjectInfo.materialInfo;
        let html = "";
        if (materialInfo != null) {
            let partMaterialNameHash = {};
            let pathHash = materialInfo.pathHash;
            for (let path in pathHash) {
                if (resourcePartName == null || resourcePartName.length === 0 || path.startWith(resourcePartName)) {
                    let pathMaterials = pathHash[path];
                    for (let i = 0; i < pathMaterials.length; i++) {
                        let materialName = pathMaterials[i];
                        if (!partMaterialNameHash[materialName]) {
                            partMaterialNameHash[materialName] = true;
                        }
                    }
                }
            }
            let materialHash = materialInfo.materialHash;
            for (let name in materialHash) {
                if (partMaterialNameHash[name]) {
                    let mInfo = materialHash[name];
                    let colorStr;

                    //查看是否已制定替换material
                    let destMaterialInfo = objectMaterialHash == null || objectMaterialHash[name] == null ? null : objectMaterialHash[name];
                    let destMaterialCode = destMaterialInfo == null ? "" : destMaterialInfo.code == null ? "" : destMaterialInfo.code;
                    let materialInfo = null;
                    if (destMaterialCode.length === 0) {
                        colorStr = cmnPcr.colorToString(mInfo.color);
                    } else {
                        materialInfo = thatS3dPropertyEditor.manager.localMaterials.getUserMaterialInfo(destMaterialCode);
                        colorStr = cmnPcr.getColorStr(materialInfo == null ? mInfo.color : materialInfo.color);
                    }
                    html = html + "<div class=\"s3dPropertyEditorItemContainer\">" + "<div class=\"s3dPropertyEditorItemTitle s3dPropertyEditorItemMaterialTitle\">" + cmnPcr.htmlEncode(name) + "</div>" + "<div class=\"s3dPropertyEditorItemValue s3dPropertyEditorItemMaterialValue\">" + "<input type=\"text\" readonly matName='" + name + "' toCode=\"" + (materialInfo == null ? "" : materialInfo.code) + "\" name=\"material\" autocomplete=\"off\" " + " class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputString s3dPropertyEditorItemInputPop s3dPropertyEditorItemInputMaterial\"" + " style=\"background-color:" + colorStr + "\"" + " value=\"" + (materialInfo == null ? "" : materialInfo.name) + "\" />" + "<div class=\"s3dPropertyEditorItemPop s3dPropertyEditorItemMaterialPicker\" style=\"background-color:" + colorStr + "\"></div>" + "</div>" + "</div>";
                }
            }
        }
        return html;
    };

    //参数的组、组内参数排序
    this.sortAllGroupParameters = function (parameters) {
        let allGroups = [];
        let groupJsonMap = {};
        for (let paramName in parameters) {
            let param = parameters[paramName];
            let groupName = param.groupName;
            let groupJson = null;
            if (groupJsonMap[groupName] == null) {
                groupJson = {
                    name: groupName,
                    parameters: []
                };
                groupJsonMap[groupName] = groupJson;
                let tempAllGroups = [];
                let groupAdded = false;
                for (let i = 0; i < allGroups.length; i++) {
                    let tempGroup = allGroups[i];
                    if (tempGroup.name > groupName && !groupAdded) {
                        tempAllGroups.push(groupJson);
                        groupAdded = true;
                    }
                    tempAllGroups.push(tempGroup);
                }
                if (!groupAdded) {
                    tempAllGroups.push(groupJson);
                }
                allGroups = tempAllGroups;
            } else {
                groupJson = groupJsonMap[groupName];
            }
            let tempGroupParameters = [];
            let paramAdded = false;
            for (let i = 0; i < groupJson.parameters.length; i++) {
                let tempParam = groupJson.parameters[i];
                if (tempParam.name > paramName && !paramAdded) {
                    tempGroupParameters.push(param);
                    paramAdded = true;
                }
                tempGroupParameters.push(tempParam);
            }
            if (!paramAdded) {
                tempGroupParameters.push(param);
            }
            groupJson.parameters = tempGroupParameters;
        }
        return allGroups;
    };
    this.refreshBaseValues = function (objectJson) {
        if (thatS3dPropertyEditor.currentObjectJson != null) {
            if (objectJson.id === thatS3dPropertyEditor.currentObjectJson.id) {
                let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
                let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorPartContainer[name='baseInfo'] .s3dPropertyEditorInfoContainer")[0];
                thatS3dPropertyEditor.refreshBaseInfo(objectJson, baseInfoContainer);
            }
        }
    };
    this.afterChangeUseWorldPosition = function (useWorldPosition) {
        let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
        let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorPartContainer[name='baseInfo'] .s3dPropertyEditorInfoContainer")[0];
        if (useWorldPosition == null) {
            $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"useWorldPosition\"]").css("display", "none");
        } else {
            let displayValue = useWorldPosition ? "none" : "block";
            $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posX\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posY\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posZ\"]").parent().parent().css("display", displayValue);
            /*
            $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"worldX\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"worldY\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"worldZ\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"minWorldX\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"minWorldY\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"minWorldZ\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"maxWorldX\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"maxWorldY\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"maxWorldZ\"]").parent().parent().css("display", displayValue);
             */
            $(baseInfoContainer).find(".s3dPropertyEditorItemContainer[groupName=\"rotation\"]").css("display", displayValue);
        }
        thatS3dPropertyEditor.refreshProperty2DVisible(useWorldPosition);
    };
    this.refreshBaseInfoDecimalValues = function (objectJson) {
        let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
        let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorPartContainer[name='baseInfo'] .s3dPropertyEditorInfoContainer")[0];
        let posX = cmnPcr.toFixed(common3DFunction.s2v(objectJson.position[0], thatS3dPropertyEditor.manager.viewer.distanceRatio), thatS3dPropertyEditor.positionPrecision);
        let posY = cmnPcr.toFixed(common3DFunction.s2v(objectJson.position[1], thatS3dPropertyEditor.manager.viewer.distanceRatio), thatS3dPropertyEditor.positionPrecision);
        let posZ = cmnPcr.toFixed(common3DFunction.s2v(objectJson.position[2], thatS3dPropertyEditor.manager.viewer.distanceRatio), thatS3dPropertyEditor.positionPrecision);
        let rotX = cmnPcr.toFixed(common3DFunction.radian2degree(objectJson.rotation[0]), thatS3dPropertyEditor.rotationPrecision);
        let rotY = cmnPcr.toFixed(common3DFunction.radian2degree(objectJson.rotation[1]), thatS3dPropertyEditor.rotationPrecision);
        let rotZ = cmnPcr.toFixed(common3DFunction.radian2degree(objectJson.rotation[2]), thatS3dPropertyEditor.rotationPrecision);
        let scaleX = cmnPcr.toFixed(objectJson.scale[0], thatS3dPropertyEditor.scalePrecision);
        let scaleY = cmnPcr.toFixed(objectJson.scale[1], thatS3dPropertyEditor.scalePrecision);
        let scaleZ = cmnPcr.toFixed(objectJson.scale[2], thatS3dPropertyEditor.scalePrecision);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posX\"]").val(posX);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posY\"]").val(posY);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posZ\"]").val(posZ);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"rotX\"]").val(rotX);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"rotY\"]").val(rotY);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"rotZ\"]").val(rotZ);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"scaleX\"]").val(scaleX);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"scaleY\"]").val(scaleY);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"scaleZ\"]").val(scaleZ);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"name\"]").attr("sourceValue", objectJson.name);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posX\"]").attr("sourceValue", posX);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posY\"]").attr("sourceValue", posY);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posZ\"]").attr("sourceValue", posZ);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"rotX\"]").attr("sourceValue", rotX);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"rotY\"]").attr("sourceValue", rotY);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"rotZ\"]").attr("sourceValue", rotZ);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"scaleX\"]").attr("sourceValue", scaleX);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"scaleY\"]").attr("sourceValue", scaleY);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"scaleZ\"]").attr("sourceValue", scaleZ);
    };
    this.refreshBaseInfo = function (objectJson, baseInfoContainer) {
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"name\"]").val(objectJson.name);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"componentCode\"]").val(objectJson.code == null ? "无" : objectJson.code);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"versionNum\"]").val(objectJson.versionNum == null ? "无" : objectJson.versionNum);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"name\"]").attr("sourceValue", objectJson.name);
        $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"useWorldPosition\"]").prop("checked", objectJson.useWorldPosition);
        switch (objectJson.type) {
            case s3dElement3DType.unit:
            {
                $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"castShadow\"]").prop("checked", objectJson.castShadow);
                $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"receiveShadow\"]").prop("checked", objectJson.receiveShadow);
                $(baseInfoContainer).find(".s3dPropertyEditorItemContainer[groupName=\"shadow\"]").css({
                    display: "block"
                });
                break;
            }
            default:
            {
                $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"castShadow\"]").prop("checked", false);
                $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"receiveShadow\"]").prop("checked", false);
                $(baseInfoContainer).find(".s3dPropertyEditorItemContainer[groupName=\"shadow\"]").css({
                    display: "none"
                });
                break;
            }
        }
        thatS3dPropertyEditor.refreshBaseInfoDecimalValues(objectJson);
        thatS3dPropertyEditor.afterChangeUseWorldPosition(objectJson.useWorldPosition);
    };
    this.getBaseInfoContainerHtml = function (objectJson) {
        return ""
            //标识
            + "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"identification\">" + "<div class=\"s3dPropertyEditorItemGroup\"><div class=\"s3dPropertyEditorItemGroupTitle\">标识信息</div></div>" + "</div>"
            //名称
            + "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"identification\">" + "<div class=\"s3dPropertyEditorItemTitle\">名称</div>" + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"name\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputString\" /></div>" + "</div>"
            //类型编码
            + "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"identification\">" + "<div class=\"s3dPropertyEditorItemTitle\">类型编码</div>" + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"componentCode\" readonly class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputReadonly\" /></div>" + "</div>"
            //类型版本
            + "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"identification\">" + "<div class=\"s3dPropertyEditorItemTitle\">类型版本</div>" + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"versionNum\" readonly class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputReadonly\" /></div>" + "</div>"
            //变换
            + "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"position\">" + "<div class=\"s3dPropertyEditorItemGroup\"><div class=\"s3dPropertyEditorItemGroupTitle\">变换</div></div>" + "</div>"
            //位置
            + "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"position\">" + "<div class=\"s3dPropertyEditorItemTitle\">位置</div>" + "<div class=\"s3dPropertyEditorItemValue\">" + "<div class=\"s3dPropertyEditorItemValueTransform\">" + "<input type=\"number\" name=\"posX\" precision=\"" + thatS3dPropertyEditor.positionPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal s3dPropertyEditorItemTransform\" />" + "<input type=\"number\" name=\"posY\" precision=\"" + thatS3dPropertyEditor.positionPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal s3dPropertyEditorItemTransform\" />" + "<input type=\"number\" name=\"posZ\" precision=\"" + thatS3dPropertyEditor.positionPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal s3dPropertyEditorItemTransform\" />" + "</div>" + "</div>" + "</div>"
            //旋转
            + "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"rotation\" hiddenIn2D=\"true\">" + "<div class=\"s3dPropertyEditorItemTitle\">旋转</div>" + "<div class=\"s3dPropertyEditorItemValue\">" + "<div class=\"s3dPropertyEditorItemValueTransform\">" + "<input type=\"number\" name=\"rotX\" precision=\"" + thatS3dPropertyEditor.rotationPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal s3dPropertyEditorItemTransform\" />" + "<input type=\"number\" name=\"rotY\" precision=\"" + thatS3dPropertyEditor.rotationPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal s3dPropertyEditorItemTransform\" />" + "<input type=\"number\" name=\"rotZ\" precision=\"" + thatS3dPropertyEditor.rotationPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal s3dPropertyEditorItemTransform\" />" + "</div>" + "</div>" + "</div>"
            //缩放
            + "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"scale\" hiddenIn2D=\"true\">" + "<div class=\"s3dPropertyEditorItemTitle\">缩放</div>" + "<div class=\"s3dPropertyEditorItemValue\">" + "<div class=\"s3dPropertyEditorItemValueTransform\">" + "<input type=\"number\" name=\"scaleX\" precision=\"" + thatS3dPropertyEditor.scalePrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal s3dPropertyEditorItemTransform\" />" + "<input type=\"number\" name=\"scaleY\" precision=\"" + thatS3dPropertyEditor.scalePrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal s3dPropertyEditorItemTransform\" />" + "<input type=\"number\" name=\"scaleZ\" precision=\"" + thatS3dPropertyEditor.scalePrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal s3dPropertyEditorItemTransform\" />" + "</div>" + "</div>" + "</div>"

            //变换
            + "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"shadow\">" + "<div class=\"s3dPropertyEditorItemGroup\"><div class=\"s3dPropertyEditorItemGroupTitle\">阴影</div></div>" + "</div>"

            //产生阴影
            + "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"shadow\">" + "<div class=\"s3dPropertyEditorItemTitle\">产生阴影</div>" + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"checkbox\" name=\"castShadow\" readonly class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputBoolean\" /></div>" + "</div>"

            //接收阴影
            + "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"shadow\">" + "<div class=\"s3dPropertyEditorItemTitle\">接收阴影</div>" + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"checkbox\" name=\"receiveShadow\" readonly class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputBoolean\" /></div>" + "</div>";
    };

    //获取property html
    this.getPropertyHtml = function (paramName, paramValue) {
        return "<div class=\"s3dPropertyEditorItemContainer\">" + "<div class=\"s3dPropertyEditorItemTitle\">" + cmnPcr.htmlEncode(paramName) + "</div>" + "<div class=\"s3dPropertyEditorItemValue\">" + cmnPcr.htmlEncode(paramValue) + "</div>" + "</div>";
    };
};

export default S3dPropertyEditor
