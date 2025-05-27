import * as THREE from "three"
import {s3dLayerType} from "../../../commonjs/common/common.js";
import {S3dTagLinePointText} from "./tag/s3dTagLinePointText.js";
import {S3dTagTextOnly} from "./tag/s3dTagTextOnly.js";
import {S3dTagDistanceText} from "./tag/s3dTagDistanceText.js";

let S3dTagCreator = function (){
    var thatTagCreator = this;

    this.manager = null;

    this.init = function (p){
        thatTagCreator.manager = p.manager;
    }

    this.create = function (p){
        let objectSetting = p.objectSetting;
        let componentInfo = p.componentInfo;
        let tagObj = null;
        switch(objectSetting.code){
            case "Tag-LinePointText":{
                tagObj = thatTagCreator.createLinePointTextTag(objectSetting, componentInfo);
                break;
            }
            case "Tag-TextOnly":{
                tagObj = thatTagCreator.createTextOnlyTag(objectSetting, componentInfo);
                break;
            }
            case "Tag-DistanceText":{
                tagObj = thatTagCreator.createDistanceTextTag(objectSetting, componentInfo);
                break;
            }
            default:{
                throw "未知的标注类型. Code=" + objectSetting.code;
            }
        }

        thatTagCreator.manager.viewer.enableObjectLayer(tagObj, s3dLayerType.viewLayer, true);
        return tagObj;
    }

    this.createHelper = function (tag3D){
        let info = tag3D.userData.info;
        let helper = null;
        switch(info.code){
            default:{
                //无helper
                break;
            }
        }
        if(helper != null){
            thatTagCreator.manager.viewer.enableObjectLayer(helper, s3dLayerType.editLayer, true);
            thatTagCreator.manager.viewer.disableObjectLayer(helper, s3dLayerType.viewLayer, true);
        }
        return helper;
    }

    this.createLinePointTextTag = function (objectSetting, componentInfo){
        let parameters = objectSetting.parameters;
        let text = parameters.text.value;
        let fontSize = parameters.fontSize.value;
        let lineLength = parameters.lineLength.value;
        let pointRadius = parameters.pointRadius.value;
        let fontFamily = parameters.fontFamily.value;
        let bold = parameters.bold.value;
        let letterSpacing = parameters.letterSpacing.value;
        let textDirection = parameters.textDirection.value;
        let rotation = parameters.rotation.value;
        let pointColorStr = parameters.pointColor.value;
        let lineColorStr = parameters.lineColor.value;
        let textColorStr = parameters.textColor.value;
        let pointColor = common3DFunction.stringToRGBInt(pointColorStr);
        let lineColor = common3DFunction.stringToRGBInt(lineColorStr);
        let textColor = common3DFunction.stringToRGBInt(textColorStr);

        let tag=new S3dTagLinePointText({
            text: text,
            fontSize: fontSize,
            bold: bold,
            fontFamily: fontFamily,
            textColor: textColor,
            letterSpacing: letterSpacing,
            textDirection: textDirection,
            pointRadius: pointRadius,
            pointColor: pointColor,
            lineLength: lineLength,
            lineColor: lineColor,
            rotation: rotation
        });
        tag.position.set(objectSetting.position[0], objectSetting.position[1], objectSetting.position[2]).normalize();
        let tagDom = tag.getCSS2DObject();
        $(tagDom.element).attr("objectId", objectSetting.id);
        return tag;
    }

    this.createTextOnlyTag = function (objectSetting, componentInfo){
        let parameters = objectSetting.parameters;
        let text = parameters.text.value;
        let fontSize = parameters.fontSize.value;
        let textColorStr = parameters.textColor.value;
        let fontFamily = parameters.fontFamily.value;
        let bold = parameters.bold.value;
        let letterSpacing = parameters.letterSpacing.value;
        let textDirection = parameters.textDirection.value;
        let textColor = common3DFunction.stringToRGBInt(textColorStr);

        let tag=new S3dTagTextOnly({
            text: text,
            fontSize: fontSize,
            bold: bold,
            fontFamily: fontFamily,
            textColor: textColor,
            letterSpacing: letterSpacing,
            textDirection: textDirection
        });
        tag.position.set(objectSetting.position[0], objectSetting.position[1], objectSetting.position[2]).normalize();
        return tag;
    }

    this.createDistanceTextTag = function (objectSetting, componentInfo){
        let parameters = objectSetting.parameters;
        let text = parameters.text.value;
        let fontSize = parameters.fontSize.value;
        let fontFamily = parameters.fontFamily.value;
        let bold = parameters.bold.value;
        let letterSpacing = parameters.letterSpacing.value;
        let textColorStr = parameters.textColor.value;
        let textColor = common3DFunction.stringToRGBInt(textColorStr);

        let terminalLineLength = parameters.terminalLineLength.value;
        let terminalLineColorStr = parameters.terminalLineColor.value;
        let terminalLineColor = common3DFunction.stringToRGBInt(terminalLineColorStr);

        let lineLength = parameters.lineLength.value;
        let lineColorStr = parameters.lineColor.value;
        let lineColor = common3DFunction.stringToRGBInt(lineColorStr);

        let tag=new S3dTagDistanceText({
            text: text,
            fontSize: fontSize,
            bold: bold,
            fontFamily: fontFamily,
            textColor: textColor,
            letterSpacing: letterSpacing,
            terminalLineLength: terminalLineLength,
            terminalLineColor: terminalLineColor,
            lineLength: lineLength,
            lineColor: lineColor
        });
        tag.position.set(objectSetting.position[0], objectSetting.position[1], objectSetting.position[2]).normalize();
        return tag;
    }
}
export default S3dTagCreator