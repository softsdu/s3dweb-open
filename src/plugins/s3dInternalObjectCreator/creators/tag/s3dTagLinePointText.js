import * as THREE from "three"
import {cmnPcr, s3dLayerType, s3dTextDirections} from "../../../../commonjs/common/common.js";
import {S3dCSS2DTagObject} from "./s3dCSS2DTagObject.js"
import S3dTagText3DCreator from "./S3dTagText3DCreator.js";

class S3dTagLinePointText extends THREE.Object3D{
    constructor(options = {}) {
        super();

        this.options = options;

        this.inited2D = false;

        let sprite2d  = this.createSprite(options);
        this.add(sprite2d);

        let tagObject  = this.createCss2TagObject(options);
        this.add(tagObject);
    }

    getCSS2DObject() {
        return this.children[1];
    }

    onRemove(){
        let text2d = this.getCSS2DObject();
        $(text2d.element).remove();
    }

    createSprite(p){
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');
        canvas.width = 1;
        canvas.height = 1;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, 1, 1);
        let texture = new THREE.CanvasTexture(canvas);
        let spriteMaterial = new THREE.SpriteMaterial({ map: texture, color: p.pointColor });
        let sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.001, 0.001, 0.001);
        return sprite;
    }

    createCss2TagObject (p){
        const div = document.createElement('div');
        $(div).css({
            width: "auto",
            height: "auto"
        });
        $(div).addClass("s3dInternalObjectTag");
        $(div).html("<div class='s3dInternalObjectTagLine2D'></div>"
            + "<div class='s3dInternalObjectTagPoint2D' canIntersect='true'></div>"
            + "<div class='s3dInternalObjectTagText2D' canIntersect='true'>");
        let tagObject = new S3dCSS2DTagObject(div);
        return tagObject;
    }

    initCSS2DObject(){
        let tagObject = this.getCSS2DObject();
        let containerDiv = tagObject.element;
        let options = this.options;
        let textDom = $(containerDiv).find(".s3dInternalObjectTagText2D")[0];
        this.initText(textDom, options);
        let pointDom = $(containerDiv).find(".s3dInternalObjectTagPoint2D")[0];
        this.initPoint(pointDom, options);
        let lineDom = $(containerDiv).find(".s3dInternalObjectTagLine2D")[0];
        this.initLine(lineDom, options);
    }

    initText(textDom, p){
        $(textDom).css({
            color: cmnPcr.getColorStr(p.textColor),
            fontFamily: p.fontFamily,
            letterSpacing: p.letterSpacing + "px",
            fontSize: p.fontSize + "px",
            position: "absolute",
            zIndex: 2,
            fontWeight: p.bold ? "600" : "400",
            pointerEvents: "auto",
            writingMode: p.textDirection === "Horizontal" ? "horizontal-tb" : "vertical-rl",
            whiteSpace: "nowrap"
        });
        $(textDom).text(p.text);

        let width = $(textDom).width();
        let height = $(textDom).height();

        //根据旋转确定位置
        let endPoint = {
            x: p.lineLength * Math.cos(p.rotation * Math.PI / 180),
            y: p.lineLength * Math.sin(p.rotation * Math.PI / 180)
        }

        let textPos = {
            x: 0,
            y: 0
        };

        let angle = p.rotation % 360;
        if(angle < 0){
            angle = angle + 360;
        }
        if(angle > 315 || angle <= 45){
            textPos.x = endPoint.x + p.lineLength;
            textPos.y = endPoint.y + p.lineLength - height / 2;
        }
        else if(angle > 45 && angle <= 135){
            textPos.x = endPoint.x + p.lineLength - width / 2;
            textPos.y = endPoint.y + p.lineLength;
        }
        else if(angle > 135 && angle <= 225){
            textPos.x = endPoint.x + p.lineLength - width;
            textPos.y = endPoint.y + p.lineLength - height / 2;
        }
        else if(angle > 225 && angle <= 315){
            textPos.x = endPoint.x + p.lineLength - width / 2;
            textPos.y = endPoint.y + p.lineLength - height;
        }
        $(textDom).css({
            left: textPos.x,
            top: textPos.y
        });
    }

    initLine(lineDom, p){
        let endPoint = {
            x: p.lineLength + p.lineLength * Math.cos(p.rotation * Math.PI / 180),
            y: p.lineLength + p.lineLength * Math.sin(p.rotation * Math.PI / 180)
        }
        let html = "<svg width='" + (p.lineLength * 2)  + "' height='" + (p.lineLength * 2) + "' viewBox=\"0 0 " + (p.lineLength * 2) + " " + (p.lineLength * 2) + "\" style=\"border:0 solid #ffffff;\">"
            + "<line x1='" + p.lineLength + "' y1='" + p.lineLength + "' x2='" + endPoint.x + "' y2='" + endPoint.y + "' stroke='" + cmnPcr.getColorStr(p.lineColor) + "'></line>"
            + "</svg>"
        $(lineDom).html(html);
        $(lineDom).css({
            width: (p.lineLength * 2) + "px",
            height: (p.lineLength * 2) + "px",
            position: "relative"
        });
    }
    initPoint(pointDom, p){
        let html = "<svg width='" + (p.pointRadius * 2)  + "' height='" + (p.pointRadius * 2) + "' viewBox=\"0 0 " + (p.pointRadius * 2) + " " + (p.pointRadius * 2) + "\" style=\"border:0 solid #ffffff;\">"
            + "<circle class='s3dInternalObjectTagPoint2D' cx='" + p.pointRadius + "' cy='" + p.pointRadius + "' r='" + p.pointRadius + "' fill='" + cmnPcr.getColorStr(p.pointColor) + "'/>"
            + "</svg>"
        $(pointDom).html(html);
        $(pointDom).css({
            left: p.lineLength - p.pointRadius,
            top: p.lineLength - p.pointRadius,
            width: (p.pointRadius * 2) + "px",
            height: (p.pointRadius * 2) + "px",
            position: "absolute"
        });
    }
}

export { S3dTagLinePointText };
