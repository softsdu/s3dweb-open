import {msgBox, cmnPcr} from "../../../commonjs/common/common.js";

export const content2DCommon = {
    showQRCode: function (p){
        const containerId = p.containerId;

        let innerHtml = "<div class='content2DCommonQRCodeOutContainer'>";
        innerHtml += "<div class='content2DCommonQRCodeBackground'></div>";
        innerHtml += "<div class='content2DCommonQRCodeInnerContainer'>";
        innerHtml += "<div class='content2DCommonQRCodeClose'>&#x2716;</div>";
        innerHtml += "</div>";
        innerHtml += "<div class='content2DCommonQRCodeTextContainer'>长按转发或扫码分享</div>";
        innerHtml += "</div>";
        let container = $("#" + containerId);
        $(container).append(innerHtml);

        const closeQRCode = function (){
            let container = $("#" + containerId);
            let outContainer = $(container).find(".content2DCommonQRCodeOutContainer");
            outContainer.remove();
        }
        $(container).find(".content2DCommonQRCodeBackground").click(function (){
            closeQRCode();
        });
        $(container).find(".content2DCommonQRCodeClose").click(function (){
            closeQRCode();
        });

        let innerContainer = $(container).find(".content2DCommonQRCodeInnerContainer")[0];
        let qrHtml = cmnPcr.getQRCodeHtml(p.text);
        $(innerContainer).append(qrHtml);
        $(innerContainer).find("img").addClass("content2DCommonQRCodeImage");
    }
}