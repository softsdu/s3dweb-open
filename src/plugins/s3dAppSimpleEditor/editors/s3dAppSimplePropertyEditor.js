import { msgBox, s3dElement3DType, s3dUiStatus, cmnPcr, s3dOperateType } from '../../../commonjs/common/common.js';
import './S3dAppSimplePropertyEditor.css';

//S3dWeb Simple属性编辑器
let S3dAppSimplePropertyEditor = function () {
    //当前对象
    const thatS3dAppSimplePropertyEditor = this;

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
        let allFuncs = thatS3dAppSimplePropertyEditor.eventFunctions[eventName];
        if (allFuncs == null) {
            allFuncs = [];
            thatS3dAppSimplePropertyEditor.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    };
    this.doEventFunction = function (eventName, p) {
        let allFuncs = thatS3dAppSimplePropertyEditor.eventFunctions[eventName];
        if (allFuncs != null) {
            for (let i = 0; i < allFuncs.length; i++) {
                let func = allFuncs[i];
                func(p);
            }
        }
    };

    //初始化
    this.init = function (p) {
        thatS3dAppSimplePropertyEditor.containerId = p.containerId;
        thatS3dAppSimplePropertyEditor.manager = p.manager;
        thatS3dAppSimplePropertyEditor.showEditor();

        let objectJson = thatS3dAppSimplePropertyEditor.manager.viewer.cloneJsonById(p.objectId);
        thatS3dAppSimplePropertyEditor.refreshProperties(objectJson);

        //绑定事件
        //构建通用属性值改变后
        if (p.afterBaseInfoValueChanged != null) {
            thatS3dAppSimplePropertyEditor.addEventFunction("afterBaseInfoValueChanged", p.afterBaseInfoValueChanged);
        }

        //构建位置、旋转、缩放值改变后
        if (p.afterPosRotScaleChanged != null) {
            thatS3dAppSimplePropertyEditor.addEventFunction("afterPosRotScaleChanged", p.afterPosRotScaleChanged);
        }
    };

    //隐藏非2D的属性
    this.refreshProperty2DVisible = function (isAllHidden) {
        let container = $("#" + thatS3dAppSimplePropertyEditor.containerId);
        if (isAllHidden || thatS3dAppSimplePropertyEditor.isProperty2DOnly) {
            $(container).find(".s3dAppSimplePropertyEditorItemContainer[hiddenIn2D='true']").css({
                display: "none"
            });
        } else {
            $(container).find(".s3dAppSimplePropertyEditorItemContainer[hiddenIn2D='true']").css({
                display: "block"
            });
        }
    };

    //显示结构树
    this.showEditor = function () {
        //构造html
        let editorHtml = thatS3dAppSimplePropertyEditor.getEditorHtml();
        let container = $("#" + thatS3dAppSimplePropertyEditor.containerId);
        $(container).html(editorHtml);
        $(container).find(".s3dAppSimplePropertyEditorTabHeader").click(function () {
            let partContainer = $(this).parent();
            if ($(partContainer).hasClass("s3dAppSimplePropertyEditorPartContainerActive")) {
                $(partContainer).removeClass("s3dAppSimplePropertyEditorPartContainerActive");
            } else {
                $(partContainer).addClass("s3dAppSimplePropertyEditorPartContainerActive");
            }
        });
    };

    //获取editor html
    this.getEditorHtml = function () {
        return "<div class=\"s3dAppSimplePropertyEditorContainer\">"
            + "<div class=\"s3dAppSimplePropertyEditorInnerContainer\">"
            + "<div class=\"s3dAppSimplePropertyEditorPartContainer s3dAppSimplePropertyEditorPartContainerActive\" name=\"baseInfo\">"
            + "<div class=\"s3dAppSimplePropertyEditorTabHeader\"><div class=\"s3dAppSimplePropertyEditorTabImage\">&#9654;</div><div class=\"s3dAppSimplePropertyEditorTabTitle\">基础</div></div>"
            + "<div class=\"s3dAppSimplePropertyEditorInfoContainer\"></div>"
            + "</div>"
            + "<div class=\"s3dAppSimplePropertyEditorPartContainer s3dAppSimplePropertyEditorPartContainerActive\" name=\"seniorInfo\">"
            + "<div class=\"s3dAppSimplePropertyEditorTabHeader\"><div class=\"s3dAppSimplePropertyEditorTabImage\">&#9654;</div><div class=\"s3dAppSimplePropertyEditorTabTitle\">参数</div></div>"
            + "<div class=\"s3dAppSimplePropertyEditorInfoContainer\"></div>"
            + "</div>"
            + "</div>"
            + "</div>";
    };

    //刷新属性值
    this.refreshPropertyValues = function (objectJson) {
        let componentInfo = null;
        if (objectJson.isInternal) {
            componentInfo = thatS3dAppSimplePropertyEditor.manager.internalObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
        } else if (objectJson.isServer) {
            componentInfo = thatS3dAppSimplePropertyEditor.manager.serverObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
        } else {
            componentInfo = null;
        }
        let propertyEditorInnerContainer = $("#" + thatS3dAppSimplePropertyEditor.containerId).find(".s3dAppSimplePropertyEditorInnerContainer")[0];
        let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dAppSimplePropertyEditorPartContainer[name='baseInfo'] .s3dAppSimplePropertyEditorInfoContainer")[0];
        thatS3dAppSimplePropertyEditor.refreshBaseInfo(objectJson, baseInfoContainer);
        let seniorInfoContainer = $(propertyEditorInnerContainer).find(".s3dAppSimplePropertyEditorPartContainer[name='seniorInfo'] .s3dAppSimplePropertyEditorInfoContainer")[0];
        thatS3dAppSimplePropertyEditor.refreshSeniorInfo(objectJson, componentInfo, seniorInfoContainer);
    };

    //刷新构造属性编辑器
    this.refreshProperties = function (objectJson) {
        let container = $("#" + thatS3dAppSimplePropertyEditor.containerId);
        let propertyEditorContainer = $(container).find(".s3dAppSimplePropertyEditorContainer")[0];

        thatS3dAppSimplePropertyEditor.currentObjectJson = objectJson;
        thatS3dAppSimplePropertyEditor.initBaseInfoContainer(propertyEditorContainer, objectJson);
        thatS3dAppSimplePropertyEditor.initSeniorInfoContainer(propertyEditorContainer, objectJson);
    }

    this.initSeniorInfoContainer = function (propertyEditorContainer, objectJson) {
        let doesShow = objectJson.type !== s3dElement3DType.group;
        $(propertyEditorContainer).find(".s3dAppSimplePropertyEditorPartContainer[name='seniorInfo']").css({
            display: doesShow ? "block" : "none"
        });
        if (doesShow) {
            let componentInfo = null;
            let seniorInfoHtml = null;
            if (objectJson.isInternal) {
                componentInfo = thatS3dAppSimplePropertyEditor.manager.internalObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
                seniorInfoHtml = thatS3dAppSimplePropertyEditor.getInternalSeniorInfoContainerHtml(objectJson, componentInfo);
            } else if (objectJson.isServer) {
                componentInfo = thatS3dAppSimplePropertyEditor.manager.serverObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
                seniorInfoHtml = thatS3dAppSimplePropertyEditor.getSeniorInfoContainerHtml(objectJson, componentInfo);
            } else {
                componentInfo = thatS3dAppSimplePropertyEditor.manager.localObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
                seniorInfoHtml = thatS3dAppSimplePropertyEditor.getSeniorInfoContainerHtml(objectJson, componentInfo);
            }
            let seniorInfoContainer = $(propertyEditorContainer).find(".s3dAppSimplePropertyEditorPartContainer[name='seniorInfo'] .s3dAppSimplePropertyEditorInfoContainer")[0];
            $(seniorInfoContainer).html(seniorInfoHtml);
            thatS3dAppSimplePropertyEditor.refreshSeniorInfo(objectJson, componentInfo, seniorInfoContainer);

            //数值类型属性
            let allListInputs = $(seniorInfoContainer).find(".s3dAppSimplePropertyEditorItemInputList");
            $(allListInputs).change(function (e) {
                thatS3dAppSimplePropertyEditor.changeSeniorInfoListValue(this);
            });

            //数值类型属性
            let allDecimalInputs = $(seniorInfoContainer).find(".s3dAppSimplePropertyEditorItemInputDecimal");
            $(allDecimalInputs).bind("keypress", function (e) {
                return e.key >= '0' && e.key <= '9' || e.key == '.' || e.key === '-';
            });
            $(allDecimalInputs).bind("dragenter", function (e) {
                return false;
            });
            $(allDecimalInputs).bind("keydown", function (e) {
                let evt = window.event || e;
                if (evt.keyCode === 13) {
                    thatS3dAppSimplePropertyEditor.changeSeniorInfoDecimalValue(this);
                }
                return true;
            });
            $(allDecimalInputs).change(function (e) {
                thatS3dAppSimplePropertyEditor.changeSeniorInfoDecimalValue(this);
            });

            //字符串类型属性
            let allStringInputs = $(seniorInfoContainer).find(".s3dAppSimplePropertyEditorItemInputString");
            $(allStringInputs).bind("keydown", function (e) {
                let evt = window.event || e;
                if (evt.keyCode === 13) {
                    thatS3dAppSimplePropertyEditor.changeSeniorInfoStringValue(this);
                }
                return true;
            });
            $(allStringInputs).change(function (e) {
                thatS3dAppSimplePropertyEditor.changeSeniorInfoStringValue(this);
            });

            //布尔类型属性
            let allBooleanInputs = $(seniorInfoContainer).find(".s3dAppSimplePropertyEditorItemInputBoolean");
            $(allBooleanInputs).change(function (e) {
                thatS3dAppSimplePropertyEditor.changeSeniorInfoBooleanValue(this);
            });

            //颜色属性
            let allColorInputs = $(seniorInfoContainer).find(".s3dAppSimplePropertyEditorItemInputColor");
            $(allColorInputs).change(function (e) {
                thatS3dAppSimplePropertyEditor.changeSeniorInfoColorValue(this);
            });

            //选点按钮
            let selectPointsInput = $(seniorInfoContainer).find(".s3dAppSimplePropertyEditorItemSelectPoints");
            $(selectPointsInput).click(function (e) {
                let paramName = $(this).parent().children(".s3dAppSimplePropertyEditorItemInput").attr("name");
                let objectJson = thatS3dAppSimplePropertyEditor.currentObjectJson;
                let componentInfo = thatS3dAppSimplePropertyEditor.manager.serverObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
                let param = componentInfo.parameters[paramName];
                let statusData = {
                    paramName: paramName,
                    locationType: param.paramType,
                    nodeId: objectJson.id
                };
                if (thatS3dAppSimplePropertyEditor.manager.viewer.changeStatus({
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
                    let inputValue = $(this).parent().find(".s3dAppSimplePropertyEditorItemInput").val();
                    let pointStr = "";
                    if (defaultValue !== inputValue) {
                        pointStr = inputValue;
                    }
                    thatS3dAppSimplePropertyEditor.manager.pointSelector.beginPlacePoints({
                        locationType: param.paramType,
                        pointCount: pointCount,
                        paramInfo: {
                            nodeId: objectJson.id,
                            paramName: paramName,
                            pointStr: pointStr,
                            afterSelectPoints: thatS3dAppSimplePropertyEditor.afterViewerSelectPoints
                        }
                    });
                }
            });

            //选择材质按钮
            selectPointsInput = $(seniorInfoContainer).find(".s3dAppSimplePropertyEditorItemMaterialPicker");
            $(selectPointsInput).click(function (e) {
                let paramName = $(this).parent().children(".s3dAppSimplePropertyEditorItemInput").attr("name");
                let objectJson = thatS3dAppSimplePropertyEditor.currentObjectJson;
                let statusData = {
                    paramName: paramName,
                    nodeId: objectJson.id
                };
                if (thatS3dAppSimplePropertyEditor.manager.viewer.changeStatus({
                    status: s3dUiStatus.pop,
                    statusData: statusData
                })) {
                    let materialName = $(this).parent().find(".s3dAppSimplePropertyEditorItemInput").val();
                    thatS3dAppSimplePropertyEditor.manager.materialPicker.showPicker({
                        paramInfo: {
                            nodeId: objectJson.id,
                            paramName: paramName,
                            materialName: materialName,
                            afterPickMaterial: thatS3dAppSimplePropertyEditor.afterSeniorPickMaterial
                        }
                    });
                }
            });
        }
    };

    this.applySeniorInfo = function (){
        if (thatS3dAppSimplePropertyEditor.seniorInfoChanged) {
            thatS3dAppSimplePropertyEditor.seniorInfoChanged = false;
            let objectJson = thatS3dAppSimplePropertyEditor.currentObjectJson;

            //开始记录到undo list
            thatS3dAppSimplePropertyEditor.beginAddToUndoList(objectJson.id);
            let newSeniorValues = thatS3dAppSimplePropertyEditor.getNewSeniorValues(objectJson);
            thatS3dAppSimplePropertyEditor.manager.viewer.setObjectParameters(objectJson.id, newSeniorValues);
        }
    }

    this.getNewSeniorValues = function (objectJson) {
        let propertyEditorInnerContainer = $("#" + thatS3dAppSimplePropertyEditor.containerId).find(".s3dAppSimplePropertyEditorInnerContainer")[0];
        let seniorInfoContainer = $(propertyEditorInnerContainer).find(".s3dAppSimplePropertyEditorPartContainer[name='seniorInfo'] .s3dAppSimplePropertyEditorInfoContainer")[0];
        let seniorValues = {};
        let componentInfo;
        if (objectJson.isInternal) {
            componentInfo = thatS3dAppSimplePropertyEditor.manager.internalObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
        } else if (objectJson.isServer) {
            componentInfo = thatS3dAppSimplePropertyEditor.manager.serverObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
        } else {
            componentInfo = thatS3dAppSimplePropertyEditor.manager.localObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
        }
        for (let paramName in componentInfo.parameters) {
            let param = componentInfo.parameters[paramName];
            let value = null;
            if (param.isEditable) {
                let input = $(seniorInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='" + paramName + "']")[0];
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
                        value = valueStr.length === 0 ? null : common3DFunction.v2s(cmnPcr.strToDecimal(valueStr), thatS3dAppSimplePropertyEditor.manager.viewer.distanceRatio);
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
        $(propertyEditorContainer).find(".s3dAppSimplePropertyEditorPartContainer[name='baseInfo']").css({
            display: "block"
        });
        {
            let baseInfoHtml = thatS3dAppSimplePropertyEditor.getBaseInfoContainerHtml(objectJson);
            let baseInfoContainer = $(propertyEditorContainer).find(".s3dAppSimplePropertyEditorPartContainer[name='baseInfo'] .s3dAppSimplePropertyEditorInfoContainer")[0];
            $(baseInfoContainer).html(baseInfoHtml);
            thatS3dAppSimplePropertyEditor.refreshBaseInfo(objectJson, baseInfoContainer);

            //名称属性
            let nameInput = $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='name']")[0];
            $(nameInput).change(function (e) {
                thatS3dAppSimplePropertyEditor.changeBaseInfoNameValue(this);
            });

            /* 暂时隐藏
            //useWorldPosition
            let useWorldPositionInput = $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='useWorldPosition']")[0];
            $(useWorldPositionInput).change(function (e) {
                thatS3dAppSimplePropertyEditor.changeBaseInfoUseWorldPositionValue(this);
            });
             */

            //阴影
            let castShadowInput = $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='castShadow']")[0];
            $(castShadowInput).change(function (e) {
                thatS3dAppSimplePropertyEditor.changeBaseInfoCastShadowValue(this);
            });
            let receiveShadowInput = $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='receiveShadow']")[0];
            $(receiveShadowInput).change(function (e) {
                thatS3dAppSimplePropertyEditor.changeBaseInfoReceiveShadowValue(this);
            });

            //位置、旋转属性
            let allDecimalInputs = $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInputDecimal");
            $(allDecimalInputs).bind("keypress", function (e) {
                return event.key >= '0' && event.key <= '9' || event.key === '.' || event.key === '-';
            });
            $(allDecimalInputs).bind("dragenter", function (e) {
                return false;
            });
            $(allDecimalInputs).bind("keydown", function (e) {
                let evt = window.event || e;
                if (evt.keyCode === 13) {
                    thatS3dAppSimplePropertyEditor.changeBaseInfoDecimalValue(this);
                }
                return true;
            });
            $(allDecimalInputs).change(function (e) {
                thatS3dAppSimplePropertyEditor.changeBaseInfoDecimalValue(this);
            });
        }
    };

    this.blur = function () {
        let propertyEditorInnerContainer = $("#" + thatS3dAppSimplePropertyEditor.containerId).find(".s3dAppSimplePropertyEditorInnerContainer")[0];
        $(propertyEditorInnerContainer).find(".s3dAppSimplePropertyEditorItemInput").blur();
        if (thatS3dAppSimplePropertyEditor.seniorInfoChanged) {
            msgBox.alert({
                info: "修改高级属性后未点击应用按钮, 系统放弃编辑结果."
            });
            thatS3dAppSimplePropertyEditor.seniorInfoChanged = false;
        }
    };

    //当name属性改变时
    this.changeBaseInfoNameValue = function (input) {
        let str = $(input).val().trim();
        let sourceValue = $(input).attr("sourceValue");
        if (str.length === 0) {
            $(input).val(sourceValue);
        } else if (str !== sourceValue) {
            if (thatS3dAppSimplePropertyEditor.manager.viewer.checkObjectName(str)) {
                //重名
                msgBox.alert({
                    info: "与其它物体重名"
                });
                $(input).val(sourceValue);
            } else {
                $(input).attr("sourceValue", str);
                let baseInfoName = $(input).attr("name");
                thatS3dAppSimplePropertyEditor.baseInfoValueChange(baseInfoName, sourceValue, str);
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
        thatS3dAppSimplePropertyEditor.seniorInfoValueChange(seniorInfoName, sourceValue, newValue);
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
            let precision = thatS3dAppSimplePropertyEditor.seniorInfoPrecision;
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
            thatS3dAppSimplePropertyEditor.seniorInfoValueChange(seniorInfoName, sourceValue, newValue);
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
            thatS3dAppSimplePropertyEditor.seniorInfoValueChange(seniorInfoName, sourceValue, newValue);
        }
    };

    //当Boolean类型高级属性改变时
    this.changeSeniorInfoBooleanValue = function (input) {
        $(input).parent().parent()[0];
        let seniorInfoName = $(input).attr("name");
        let checked = $(input).prop("checked");
        thatS3dAppSimplePropertyEditor.seniorInfoValueChange(seniorInfoName, !checked, checked);
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
            thatS3dAppSimplePropertyEditor.seniorInfoValueChange(seniorInfoName, sourceValue, newValue);
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
            thatS3dAppSimplePropertyEditor.baseInfoValueChange(baseInfoName, sourceValue, newValue);
        }
    };

    //当useWorldPosition属性改变时
    this.changeBaseInfoUseWorldPositionValue = function (input) {
        let checked = $(input).prop("checked");
        let baseInfoName = $(input).attr("name");
        thatS3dAppSimplePropertyEditor.baseInfoValueChange(baseInfoName, !checked, checked);
    };

    //当产生阴影属性改变时
    this.changeBaseInfoCastShadowValue = function (input) {
        let checked = $(input).prop("checked");
        let baseInfoName = $(input).attr("name");
        thatS3dAppSimplePropertyEditor.baseInfoValueChange(baseInfoName, !checked, checked);
    };

    //当接收阴影属性改变时
    this.changeBaseInfoReceiveShadowValue = function (input) {
        let checked = $(input).prop("checked");
        let baseInfoName = $(input).attr("name");
        thatS3dAppSimplePropertyEditor.baseInfoValueChange(baseInfoName, !checked, checked);
    };

    //高级属性改变
    this.seniorInfoValueChange = function (seniorInfoName, oldValue, newValue) {
        thatS3dAppSimplePropertyEditor.seniorInfoChanged = true;
        $("#" + thatS3dAppSimplePropertyEditor.containerId).find(".s3dAppSimplePropertyEditorSeniorApplyBtn").addClass("s3dAppSimplePropertyEditorSeniorApplyBtnChanged");
        thatS3dAppSimplePropertyEditor.applySeniorInfo();
    };

    //开启添加到undo list
    this.beginAddToUndoList = function (nodeId) {
        let nodeJsons = [];
        let tree = thatS3dAppSimplePropertyEditor.manager.treeEditor.getTreeJson();
        nodeJsons.push(thatS3dAppSimplePropertyEditor.manager.viewer.cloneJsonById(nodeId));
        thatS3dAppSimplePropertyEditor.manager.statusBar.beginAddToUndoList({
            operateType: s3dOperateType.edit,
            tree: tree,
            nodeJsons: nodeJsons
        });
    };

    //结束添加到undo list
    this.endAddToUndoList = function (nodeId, seniorInfoParameters) {
        let nodeJsons = [];
        let tree = thatS3dAppSimplePropertyEditor.manager.treeEditor.getTreeJson();
        let nodeJson = thatS3dAppSimplePropertyEditor.manager.viewer.cloneJsonById(nodeId);
        if (seniorInfoParameters != null) {
            for (let paramName in seniorInfoParameters) {
                nodeJson.parameters[paramName].value = seniorInfoParameters[paramName].value;
            }
        }
        nodeJsons.push(nodeJson);
        thatS3dAppSimplePropertyEditor.manager.statusBar.endAddToUndoList({
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
                thatS3dAppSimplePropertyEditor.manager.viewer.removeObjectsInSilence(newNodeJsons);
                thatS3dAppSimplePropertyEditor.manager.viewer.addNewObjectsInSilence(newNodeJsons);
            } else if (nodeJson.isServer) {
                let newNodeJsons = [];
                newNodeJsons.push(nodeJson);
                thatS3dAppSimplePropertyEditor.manager.viewer.removeObjectsInSilence(newNodeJsons);
                thatS3dAppSimplePropertyEditor.manager.viewer.addNewObjectsInSilence(newNodeJsons);
            } else {
                let newNodeJsons = [];
                newNodeJsons.push(nodeJson);
                thatS3dAppSimplePropertyEditor.manager.viewer.removeObjectsInSilence(newNodeJsons);
                thatS3dAppSimplePropertyEditor.manager.viewer.addNewObjectsInSilence(newNodeJsons);
            }
        }
    };

    //基本属性改变
    this.baseInfoValueChange = function (baseInfoName, oldValue, newValue) {
        let nodeId = thatS3dAppSimplePropertyEditor.currentObjectJson.id;
        switch (baseInfoName) {
            case "name":
            {
                //开始记录到undo list
                thatS3dAppSimplePropertyEditor.beginAddToUndoList(nodeId);

                //名称
                thatS3dAppSimplePropertyEditor.manager.treeEditor.changeNodeName(nodeId, newValue);
                thatS3dAppSimplePropertyEditor.manager.viewer.changeObject3DName(nodeId, newValue);

                //结束记录到undo list
                thatS3dAppSimplePropertyEditor.endAddToUndoList(nodeId);
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
                thatS3dAppSimplePropertyEditor.beginAddToUndoList(nodeId);
                let newPosition = thatS3dAppSimplePropertyEditor.getNewPosition();
                let newRotation = thatS3dAppSimplePropertyEditor.getNewRotation();
                let newScale = thatS3dAppSimplePropertyEditor.getNewScale();
                let newUseWorldPosition = thatS3dAppSimplePropertyEditor.getNewUseWorldPosition();
                thatS3dAppSimplePropertyEditor.manager.viewer.setObjectPositionRotationScaleById(nodeId, newUseWorldPosition, newPosition, newRotation, newScale);

                //设置当前对象为中心点
                thatS3dAppSimplePropertyEditor.manager.viewer.setCenterObjectById(nodeId);
                let nodeJson = thatS3dAppSimplePropertyEditor.manager.viewer.getNodeJson(nodeId);
                thatS3dAppSimplePropertyEditor.manager.moveHelper.attach([nodeJson]);
                thatS3dAppSimplePropertyEditor.afterChangeUseWorldPosition(newUseWorldPosition);
                thatS3dAppSimplePropertyEditor.refreshBaseInfoDecimalValues(nodeJson);

                //结束记录到undo list
                thatS3dAppSimplePropertyEditor.endAddToUndoList(nodeId);
                break;
            }
            case "castShadow":
            {
                //开始记录到undo list
                thatS3dAppSimplePropertyEditor.beginAddToUndoList(nodeId);
                thatS3dAppSimplePropertyEditor.manager.viewer.updateObjectCastShadow(nodeId, newValue);

                //结束记录到undo list
                thatS3dAppSimplePropertyEditor.endAddToUndoList(nodeId);
                break;
            }
            case "receiveShadow":
            {
                //开始记录到undo list
                thatS3dAppSimplePropertyEditor.beginAddToUndoList(nodeId);
                thatS3dAppSimplePropertyEditor.manager.viewer.updateObjectReceiveShadow(nodeId, newValue);

                //结束记录到undo list
                thatS3dAppSimplePropertyEditor.endAddToUndoList(nodeId);
                break;
            }
        }

        //当通用属性值改变后 added by ls 20220922
        thatS3dAppSimplePropertyEditor.afterBaseInfoValueChanged({
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
                thatS3dAppSimplePropertyEditor.afterPosRotScaleChanged({
                    id: nodeId,
                    propertyName: "position",
                    objectJson: thatS3dAppSimplePropertyEditor.manager.viewer.getNodeJson(nodeId)
                });
                break;
            }
            case "rotX":
            case "rotY":
            case "rotZ":
            {
                thatS3dAppSimplePropertyEditor.afterPosRotScaleChanged({
                    id: nodeId,
                    propertyName: "rotation",
                    objectJson: thatS3dAppSimplePropertyEditor.manager.viewer.getNodeJson(nodeId)
                });
                break;
            }
            case "scaleX":
            case "scaleY":
            case "scaleZ":
            {
                thatS3dAppSimplePropertyEditor.afterPosRotScaleChanged({
                    id: nodeId,
                    propertyName: "scale",
                    objectJson: thatS3dAppSimplePropertyEditor.manager.viewer.getNodeJson(nodeId)
                });
                break;
            }
        }
    };
    this.afterBaseInfoValueChanged = function (p) {
        thatS3dAppSimplePropertyEditor.doEventFunction("afterBaseInfoValueChanged", {
            nodeId: p.nodeId,
            propertyName: p.propertyName,
            oldValue: p.oldValue,
            newValue: p.newValue
        });
    };
    this.afterPosRotScaleChanged = function (p) {
        thatS3dAppSimplePropertyEditor.doEventFunction("afterPosRotScaleChanged", {
            id: p.id,
            propertyName: p.propertyName,
            objectJson: p.objectJson
        });
    };
    this.getNewPosition = function () {
        let propertyEditorInnerContainer = $("#" + thatS3dAppSimplePropertyEditor.containerId).find(".s3dAppSimplePropertyEditorInnerContainer")[0];
        let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dAppSimplePropertyEditorPartContainer[name='baseInfo'] .s3dAppSimplePropertyEditorInfoContainer")[0];
        let posX = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='posX']").val());
        let posY = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='posY']").val());
        let posZ = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='posZ']").val());
        return {
            x: common3DFunction.v2s(posX, thatS3dAppSimplePropertyEditor.manager.viewer.distanceRatio),
            y: common3DFunction.v2s(posY, thatS3dAppSimplePropertyEditor.manager.viewer.distanceRatio),
            z: common3DFunction.v2s(posZ, thatS3dAppSimplePropertyEditor.manager.viewer.distanceRatio)
        };
    };
    this.getNewRotation = function () {
        let propertyEditorInnerContainer = $("#" + thatS3dAppSimplePropertyEditor.containerId).find(".s3dAppSimplePropertyEditorInnerContainer")[0];
        let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dAppSimplePropertyEditorPartContainer[name='baseInfo'] .s3dAppSimplePropertyEditorInfoContainer")[0];
        let rotX = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='rotX']").val());
        let rotY = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='rotY']").val());
        let rotZ = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='rotZ']").val());
        return {
            x: common3DFunction.degree2radian(rotX),
            y: common3DFunction.degree2radian(rotY),
            z: common3DFunction.degree2radian(rotZ)
        };
    };

    this.getNewScale = function () {
        let propertyEditorInnerContainer = $("#" + thatS3dAppSimplePropertyEditor.containerId).find(".s3dAppSimplePropertyEditorInnerContainer")[0];
        let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dAppSimplePropertyEditorPartContainer[name='baseInfo'] .s3dAppSimplePropertyEditorInfoContainer")[0];
        let scaleX = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='scaleX']").val());
        let scaleY = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='scaleY']").val());
        let scaleZ = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='scaleZ']").val());
        return {
            x: scaleX,
            y: scaleY,
            z: scaleZ
        };
    };

    this.getNewUseWorldPosition = function () {
        let propertyEditorInnerContainer = $("#" + thatS3dAppSimplePropertyEditor.containerId).find(".s3dAppSimplePropertyEditorInnerContainer")[0];
        let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dAppSimplePropertyEditorPartContainer[name='baseInfo'] .s3dAppSimplePropertyEditorInfoContainer")[0];
        return $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='useWorldPosition']").prop("checked");
    };

    this.refreshSeniorInfo = function (objectJson, componentInfo, seniorInfoContainer) {
        if (componentInfo == null) {
            for (let paramName in objectJson.parameters) {
                let paramValue = objectJson.parameters[paramName].value;
                let input = $(seniorInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='" + paramName + "']");
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

    this.setSeniorValue = function (paramName, paramValue, componentInfo, seniorInfoContainer) {
        let comParam = componentInfo.parameters[paramName];
        let input = $(seniorInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name='" + paramName + "']");
        if ($(input).hasClass("s3dAppSimplePropertyEditorItemInputReadonly")) {
            $(input).val(paramValue);
        } else {
            if ($(input).hasClass("s3dAppSimplePropertyEditorItemInputList")) {
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
                        let angleValue = paramValue == null ? 0 : cmnPcr.toFixed(common3DFunction.radian2degree(paramValue), thatS3dAppSimplePropertyEditor.rotationPrecision);
                        $(input).val(angleValue);
                        $(input).attr("sourceValue", angleValue);
                        break;
                    }
                    case "distance":
                    {
                        let distanceValue = paramValue == null ? 0 : common3DFunction.s2v(paramValue, thatS3dAppSimplePropertyEditor.manager.viewer.distanceRatio);
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
            let allGroups = thatS3dAppSimplePropertyEditor.sortAllGroupParameters(componentInfo.parameters);
            for (let i = 0; i < allGroups.length; i++) {
                let groupJson = allGroups[i];
                html = html + "<div class=\"s3dAppSimplePropertyEditorItemContainer\" groupName=\"" + (groupJson.name == null ? "" : groupJson.name) + "\">" + "<div class=\"s3dAppSimplePropertyEditorItemGroup\"><div class=\"s3dAppSimplePropertyEditorItemGroupTitle\">" + cmnPcr.htmlEncode(groupJson.name == null || groupJson.name.length == 0 ? "默认分组" : groupJson.name) + "</div></div>" + "</div>";
                for (let j = 0; j < groupJson.parameters.length; j++) {
                    let param = groupJson.parameters[j];
                    html = html + "<div class=\"s3dAppSimplePropertyEditorItemContainer\"" + "paramType=\"" + param.paramType + "\" " + "isNullable=\"" + (param.isNullable ? "true" : "false") + "\" " + "minValue=\"" + param.minValue + "\" " + "maxValue=\"" + param.maxValue + "\" " + "><div class=\"s3dAppSimplePropertyEditorItemTitle\">" + cmnPcr.htmlEncode(param.name) + "</div>";
                    if (!param.isEditable) {
                        html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input name=\"" + param.name + "\" type=\"text\" readonly class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputReadonly\" /></div>";
                    } else if (param.listValues.length > 0 && !thatS3dAppSimplePropertyEditor.isSpecialParameter(param.listValues)) {
                        html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><select type=\"text\" name=\"" + param.name + "\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputList\" >";
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
                                html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"text\" name=\"" + param.name + "\" autocomplete=\"off\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputString\" /></div>";
                                break;
                            }
                            case "boolean":
                            {
                                html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"checkbox\" name=\"" + param.name + "\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputBoolean\" /></div>";
                                break;
                            }
                            case "decimal":
                            {
                                html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"number\" name=\"" + param.name + "\" autocomplete=\"off\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputDecimal\" " + (param.minValue == null ? "" : " min='" + param.minValue + "'") + (param.maxValue == null ? "" : " max='" + param.maxValue + "'") + (param.stepValue == null ? "" : " step='" + param.stepValue + "'") + " /></div>";
                                break;
                            }
                            case "material":
                            {
                                html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\">" + "<input type=\"text\" name=\"" + param.name + "\" autocomplete=\"off\" readonly class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputString s3dAppSimplePropertyEditorItemInputPop s3dAppSimplePropertyEditorItemInputMaterial\" />" + "<div class=\"s3dAppSimplePropertyEditorItemPop s3dAppSimplePropertyEditorItemMaterialPicker\"></div>" + "</div>";
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
                                html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\">" + "<input type=\"text\" name=\"" + param.name + "\" autocomplete=\"off\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputString s3dAppSimplePropertyEditorItemInputPop\" />" + "<div class=\"s3dAppSimplePropertyEditorItemPop s3dAppSimplePropertyEditorItemSelectPoints\"></div>" + "</div>";
                                break;
                            }
                            default:
                            {
                                html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"text\" readonly name=\"" + param.name + "\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputReadonly\" /></div>";
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
                + "<div class=\"s3dAppSimplePropertyEditorItemContainer\" groupName=\"default\">" + "<div class=\"s3dAppSimplePropertyEditorItemGroup\"><div class=\"s3dAppSimplePropertyEditorItemGroupTitle\">默认分组</div></div>" + "</div>";
            for (let paramName in objectJson.parameters) {
                html = html + "<div class=\"s3dAppSimplePropertyEditorItemContainer\">" + "<div class=\"s3dAppSimplePropertyEditorItemTitle\">" + cmnPcr.htmlEncode(paramName) + "</div>" + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"text\" name=\"" + paramName + "\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputString\" /></div>" + "</div>";
            }
        }
        /* 取消应用按钮
        html = html + "<div class=\"s3dAppSimplePropertyEditorBottomContainer\">" + "<div class=\"s3dAppSimplePropertyEditorItemBottom\"><div class=\"s3dAppSimplePropertyEditorSeniorApplyBtn\">应用</div></div>" + "</div>";
        */
        return html;
    };

    this.getInternalSeniorInfoContainerHtml = function (objectJson, componentInfo) {
        let html = "";
        let allGroups = componentInfo.groups;
        for (let i = 0; i < allGroups.length; i++) {
            let groupJson = allGroups[i];
            html = html + "<div class=\"s3dAppSimplePropertyEditorItemContainer\" groupName=\"" + (groupJson.name == null ? "" : groupJson.name) + "\">" + "<div class=\"s3dAppSimplePropertyEditorItemGroup\"><div class=\"s3dAppSimplePropertyEditorItemGroupTitle\">" + cmnPcr.htmlEncode(groupJson.name == null || groupJson.name.length == 0 ? "默认分组" : groupJson.name) + "</div></div>" + "</div>";
            for (let j = 0; j < groupJson.parameters.length; j++) {
                let paramName = groupJson.parameters[j];
                let param = componentInfo.parameters[paramName];
                html = html + "<div class=\"s3dAppSimplePropertyEditorItemContainer\"" + "paramType=\"" + param.paramType + "\" " + "isNullable=\"" + (param.isNullable ? "true" : "false") + "\" " + "minValue=\"" + param.minValue + "\" " + "maxValue=\"" + param.maxValue + "\" " + "><div class=\"s3dAppSimplePropertyEditorItemTitle\">" + cmnPcr.htmlEncode(param.label) + "</div>";
                if (!param.isEditable) {
                    html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input name=\"" + param.name + "\" type=\"text\"  readonly class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputReadonly\" /></div>";
                } else if (param.listValues != null && param.listValues.length > 0 && !thatS3dAppSimplePropertyEditor.isSpecialParameter(param.listValues)) {
                    html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><select type=\"text\" name=\"" + param.name + "\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputList\" >";
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
                            html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"text\" name=\"" + param.name + "\" autocomplete=\"off\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputString\" /></div>";
                            break;
                        }
                        case "boolean":
                        {
                            html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"checkbox\" name=\"" + param.name + "\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputBoolean\" /></div>";
                            break;
                        }
                        case "decimal":
                        case "integer":
                        case "angle":
                        case "distance":
                        {
                            html = html + ("<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"number\" name=\"" + param.name + "\" autocomplete=\"off\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputDecimal\"" + (param.minValue == null ? "" : " min=\"" + param.minValue + "\"") + (param.maxValue == null ? "" : " max=\"" + param.maxValue + "\"") + (param.stepValue == null ? "" : " step=\"" + param.stepValue + "\"") + " /></div>");
                            break;
                        }
                        case "material":
                        {
                            html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\">" + "<input type=\"text\" name=\"" + param.name + "\" autocomplete=\"off\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputString s3dAppSimplePropertyEditorItemInputPop s3dAppSimplePropertyEditorItemInputMaterial\" />" + "<div class=\"s3dAppSimplePropertyEditorItemPop s3dAppSimplePropertyEditorItemMaterialPicker\"></div>" + "</div>";
                            break;
                        }
                        case "color":
                        {
                            html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"color\" name=\"" + param.name + "\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputColor\" /></div>";
                            break;
                        }
                        case "date":
                        {
                            html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"date\" name=\"" + param.name + "\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputString\" /></div>";
                            break;
                        }
                        case "time":
                        {
                            html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"time\" name=\"" + param.name + "\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputString\" /></div>";
                            break;
                        }
                        default:
                        {
                            html = html + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"text\" name=\"" + param.name + "\" readonly class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputReadonly\" /></div>";
                            break;
                        }
                    }
                }
                html = html + "</div>";
            }
        }
        /*取消应用按钮
        html = html + "<div class=\"s3dAppSimplePropertyEditorBottomContainer\">" + "<div class=\"s3dAppSimplePropertyEditorItemBottom\"><div class=\"s3dAppSimplePropertyEditorSeniorApplyBtn\">应用</div></div>" + "</div>";
        */
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
        if (thatS3dAppSimplePropertyEditor.currentObjectJson != null) {
            if (objectJson.id === thatS3dAppSimplePropertyEditor.currentObjectJson.id) {
                let propertyEditorInnerContainer = $("#" + thatS3dAppSimplePropertyEditor.containerId).find(".s3dAppSimplePropertyEditorInnerContainer")[0];
                let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dAppSimplePropertyEditorPartContainer[name='baseInfo'] .s3dAppSimplePropertyEditorInfoContainer")[0];
                thatS3dAppSimplePropertyEditor.refreshBaseInfo(objectJson, baseInfoContainer);
            }
        }
    };

    this.afterChangeUseWorldPosition = function (useWorldPosition) {
        let propertyEditorInnerContainer = $("#" + thatS3dAppSimplePropertyEditor.containerId).find(".s3dAppSimplePropertyEditorInnerContainer")[0];
        let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dAppSimplePropertyEditorPartContainer[name='baseInfo'] .s3dAppSimplePropertyEditorInfoContainer")[0];
        if (useWorldPosition == null) {
            $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"useWorldPosition\"]").css("display", "none");
        } else {
            let displayValue = useWorldPosition ? "none" : "block";
            $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"posX\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"posY\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"posZ\"]").parent().parent().css("display", displayValue);
            /*
            $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"worldX\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"worldY\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"worldZ\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"minWorldX\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"minWorldY\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"minWorldZ\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"maxWorldX\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"maxWorldY\"]").parent().parent().css("display", displayValue);
            $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"maxWorldZ\"]").parent().parent().css("display", displayValue);
             */
            $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemContainer[groupName=\"rotation\"]").css("display", displayValue);
        }
        thatS3dAppSimplePropertyEditor.refreshProperty2DVisible(useWorldPosition);
    };

    this.refreshBaseInfoDecimalValues = function (objectJson) {
        let propertyEditorInnerContainer = $("#" + thatS3dAppSimplePropertyEditor.containerId).find(".s3dAppSimplePropertyEditorInnerContainer")[0];
        let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dAppSimplePropertyEditorPartContainer[name='baseInfo'] .s3dAppSimplePropertyEditorInfoContainer")[0];
        let posX = cmnPcr.toFixed(common3DFunction.s2v(objectJson.position[0], thatS3dAppSimplePropertyEditor.manager.viewer.distanceRatio), thatS3dAppSimplePropertyEditor.positionPrecision);
        let posY = cmnPcr.toFixed(common3DFunction.s2v(objectJson.position[1], thatS3dAppSimplePropertyEditor.manager.viewer.distanceRatio), thatS3dAppSimplePropertyEditor.positionPrecision);
        let posZ = cmnPcr.toFixed(common3DFunction.s2v(objectJson.position[2], thatS3dAppSimplePropertyEditor.manager.viewer.distanceRatio), thatS3dAppSimplePropertyEditor.positionPrecision);
        let rotX = cmnPcr.toFixed(common3DFunction.radian2degree(objectJson.rotation[0]), thatS3dAppSimplePropertyEditor.rotationPrecision);
        let rotY = cmnPcr.toFixed(common3DFunction.radian2degree(objectJson.rotation[1]), thatS3dAppSimplePropertyEditor.rotationPrecision);
        let rotZ = cmnPcr.toFixed(common3DFunction.radian2degree(objectJson.rotation[2]), thatS3dAppSimplePropertyEditor.rotationPrecision);
        let scaleX = cmnPcr.toFixed(objectJson.scale[0], thatS3dAppSimplePropertyEditor.scalePrecision);
        let scaleY = cmnPcr.toFixed(objectJson.scale[1], thatS3dAppSimplePropertyEditor.scalePrecision);
        let scaleZ = cmnPcr.toFixed(objectJson.scale[2], thatS3dAppSimplePropertyEditor.scalePrecision);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"posX\"]").val(posX);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"posY\"]").val(posY);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"posZ\"]").val(posZ);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"rotX\"]").val(rotX);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"rotY\"]").val(rotY);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"rotZ\"]").val(rotZ);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"scaleX\"]").val(scaleX);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"scaleY\"]").val(scaleY);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"scaleZ\"]").val(scaleZ);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"name\"]").attr("sourceValue", objectJson.name);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"posX\"]").attr("sourceValue", posX);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"posY\"]").attr("sourceValue", posY);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"posZ\"]").attr("sourceValue", posZ);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"rotX\"]").attr("sourceValue", rotX);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"rotY\"]").attr("sourceValue", rotY);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"rotZ\"]").attr("sourceValue", rotZ);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"scaleX\"]").attr("sourceValue", scaleX);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"scaleY\"]").attr("sourceValue", scaleY);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"scaleZ\"]").attr("sourceValue", scaleZ);
    };

    this.refreshBaseInfo = function (objectJson, baseInfoContainer) {
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"name\"]").val(objectJson.name);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"componentCode\"]").val(objectJson.code == null ? "无" : objectJson.code);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"versionNum\"]").val(objectJson.versionNum == null ? "无" : objectJson.versionNum);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"name\"]").attr("sourceValue", objectJson.name);
        $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"useWorldPosition\"]").prop("checked", objectJson.useWorldPosition);
        switch (objectJson.type) {
            case s3dElement3DType.unit:
            {
                $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"castShadow\"]").prop("checked", objectJson.castShadow);
                $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"receiveShadow\"]").prop("checked", objectJson.receiveShadow);
                $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemContainer[groupName=\"shadow\"]").css({
                    display: "block"
                });
                break;
            }
            default:
            {
                $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"castShadow\"]").prop("checked", false);
                $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemInput[name=\"receiveShadow\"]").prop("checked", false);
                $(baseInfoContainer).find(".s3dAppSimplePropertyEditorItemContainer[groupName=\"shadow\"]").css({
                    display: "none"
                });
                break;
            }
        }
        thatS3dAppSimplePropertyEditor.refreshBaseInfoDecimalValues(objectJson);
        thatS3dAppSimplePropertyEditor.afterChangeUseWorldPosition(objectJson.useWorldPosition);
    };

    this.getBaseInfoContainerHtml = function (objectJson) {
        return ""
            //标识
            + "<div class=\"s3dAppSimplePropertyEditorItemContainer\" groupName=\"identification\">" + "<div class=\"s3dAppSimplePropertyEditorItemGroup\"><div class=\"s3dAppSimplePropertyEditorItemGroupTitle\">标识信息</div></div>" + "</div>"
            //名称
            + "<div class=\"s3dAppSimplePropertyEditorItemContainer\" groupName=\"identification\">" + "<div class=\"s3dAppSimplePropertyEditorItemTitle\">名称</div>" + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"text\" name=\"name\" autocomplete=\"off\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputString\" /></div>" + "</div>"
            //类型编码
            + "<div class=\"s3dAppSimplePropertyEditorItemContainer\" groupName=\"identification\">" + "<div class=\"s3dAppSimplePropertyEditorItemTitle\">类型编码</div>" + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"text\" name=\"componentCode\" readonly class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputReadonly\" /></div>" + "</div>"
            //类型版本
            + "<div class=\"s3dAppSimplePropertyEditorItemContainer\" groupName=\"identification\">" + "<div class=\"s3dAppSimplePropertyEditorItemTitle\">类型版本</div>" + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"text\" name=\"versionNum\" readonly class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputReadonly\" /></div>" + "</div>"
            //变换
            + "<div class=\"s3dAppSimplePropertyEditorItemContainer\" groupName=\"position\">" + "<div class=\"s3dAppSimplePropertyEditorItemGroup\"><div class=\"s3dAppSimplePropertyEditorItemGroupTitle\">变换</div></div>" + "</div>"
            //位置
            + "<div class=\"s3dAppSimplePropertyEditorItemContainer\" groupName=\"position\">" + "<div class=\"s3dAppSimplePropertyEditorItemTitle\">位置</div>" + "<div class=\"s3dAppSimplePropertyEditorItemValue\">" + "<div class=\"s3dAppSimplePropertyEditorItemValueTransform\">" + "<input type=\"number\" name=\"posX\" precision=\"" + thatS3dAppSimplePropertyEditor.positionPrecision + "\" autocomplete=\"off\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputDecimal s3dAppSimplePropertyEditorItemTransform\" />" + "<input type=\"number\" name=\"posY\" precision=\"" + thatS3dAppSimplePropertyEditor.positionPrecision + "\" autocomplete=\"off\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputDecimal s3dAppSimplePropertyEditorItemTransform\" />" + "<input type=\"number\" name=\"posZ\" precision=\"" + thatS3dAppSimplePropertyEditor.positionPrecision + "\" autocomplete=\"off\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputDecimal s3dAppSimplePropertyEditorItemTransform\" />" + "</div>" + "</div>" + "</div>"
            //旋转
            + "<div class=\"s3dAppSimplePropertyEditorItemContainer\" groupName=\"rotation\" hiddenIn2D=\"true\">" + "<div class=\"s3dAppSimplePropertyEditorItemTitle\">旋转</div>" + "<div class=\"s3dAppSimplePropertyEditorItemValue\">" + "<div class=\"s3dAppSimplePropertyEditorItemValueTransform\">" + "<input type=\"number\" name=\"rotX\" precision=\"" + thatS3dAppSimplePropertyEditor.rotationPrecision + "\" autocomplete=\"off\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputDecimal s3dAppSimplePropertyEditorItemTransform\" />" + "<input type=\"number\" name=\"rotY\" precision=\"" + thatS3dAppSimplePropertyEditor.rotationPrecision + "\" autocomplete=\"off\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputDecimal s3dAppSimplePropertyEditorItemTransform\" />" + "<input type=\"number\" name=\"rotZ\" precision=\"" + thatS3dAppSimplePropertyEditor.rotationPrecision + "\" autocomplete=\"off\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputDecimal s3dAppSimplePropertyEditorItemTransform\" />" + "</div>" + "</div>" + "</div>"
            //缩放
            + "<div class=\"s3dAppSimplePropertyEditorItemContainer\" groupName=\"scale\" hiddenIn2D=\"true\">" + "<div class=\"s3dAppSimplePropertyEditorItemTitle\">缩放</div>" + "<div class=\"s3dAppSimplePropertyEditorItemValue\">" + "<div class=\"s3dAppSimplePropertyEditorItemValueTransform\">" + "<input type=\"number\" name=\"scaleX\" precision=\"" + thatS3dAppSimplePropertyEditor.scalePrecision + "\" autocomplete=\"off\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputDecimal s3dAppSimplePropertyEditorItemTransform\" />" + "<input type=\"number\" name=\"scaleY\" precision=\"" + thatS3dAppSimplePropertyEditor.scalePrecision + "\" autocomplete=\"off\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputDecimal s3dAppSimplePropertyEditorItemTransform\" />" + "<input type=\"number\" name=\"scaleZ\" precision=\"" + thatS3dAppSimplePropertyEditor.scalePrecision + "\" autocomplete=\"off\" class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputDecimal s3dAppSimplePropertyEditorItemTransform\" />" + "</div>" + "</div>" + "</div>"

            //变换
            + "<div class=\"s3dAppSimplePropertyEditorItemContainer\" groupName=\"shadow\">" + "<div class=\"s3dAppSimplePropertyEditorItemGroup\"><div class=\"s3dAppSimplePropertyEditorItemGroupTitle\">阴影</div></div>" + "</div>"

            //产生阴影
            + "<div class=\"s3dAppSimplePropertyEditorItemContainer\" groupName=\"shadow\">" + "<div class=\"s3dAppSimplePropertyEditorItemTitle\">产生阴影</div>" + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"checkbox\" name=\"castShadow\" readonly class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputBoolean\" /></div>" + "</div>"

            //接收阴影
            + "<div class=\"s3dAppSimplePropertyEditorItemContainer\" groupName=\"shadow\">" + "<div class=\"s3dAppSimplePropertyEditorItemTitle\">接收阴影</div>" + "<div class=\"s3dAppSimplePropertyEditorItemValue\"><input type=\"checkbox\" name=\"receiveShadow\" readonly class=\"s3dAppSimplePropertyEditorItemInput s3dAppSimplePropertyEditorItemInputBoolean\" /></div>" + "</div>";
    };

    //获取property html
    this.getPropertyHtml = function (paramName, paramValue) {
        return "<div class=\"s3dAppSimplePropertyEditorItemContainer\">" + "<div class=\"s3dAppSimplePropertyEditorItemTitle\">" + cmnPcr.htmlEncode(paramName) + "</div>" + "<div class=\"s3dAppSimplePropertyEditorItemValue\">" + cmnPcr.htmlEncode(paramValue) + "</div>" + "</div>";
    };
};

export default S3dAppSimplePropertyEditor
