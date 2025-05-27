import {msgBox} from "../../../../../commonjs/common/common.js";
import "../../../../common/js/common.js"
import {content2DCommon} from "../../../../common/js/common.js";

function BasicGray(){
    const thatGray = this;

    this.containerId = null;

    this.manager = null;


    this.init = function (p) {
        thatGray.containerId = p.containerId;
        thatGray.manager = p.manager;

        thatGray.initElements();
        thatGray.bindEvents();
    }

    this.initElements = function (){
        let container = $("#" + thatGray.containerId).find(".basicContainer");

        let tagCount = thatGray.manager.appSimpleRunner.getTagCount();
        if(tagCount === 0){
            $(container).find(".basicGrayBtnTag").css({
                display: "none"
            });
        }
    }

    this.bindEvents = function (){
        let container = $("#" + thatGray.containerId).find(".basicContainer");

        $(container).find(".basicGrayBtnHome").mousedown(function (){
            window.location.url = $(this).attr("itemValue");
            return false;
        });

        $(container).find(".basicGrayBtnRotate").mousedown(function (){
            if(thatGray.manager.viewer.runAnimationInfo.allFinished){
                thatGray.manager.appSimpleRunner.playCurrentPageAnimations();
            }
            else {
                thatGray.manager.appSimpleRunner.stopAnimations();
            }
            return false;
        });

        $(container).find(".basicGrayBtnShare").mousedown(function (){
            content2DCommon.showQRCode({
               containerId: thatGray.manager.containerId,
               text: window.location.href
            });
            return false;
        });

        $(container).find(".basicGrayBtnTag").mousedown(function (){
            let tagVisible = $(this).attr("tagVisible") === "true";
            $(this).attr("tagVisible", tagVisible ? "false" : "true");
            thatGray.manager.appSimpleRunner.setAllTagsVisible(!tagVisible);
            return false;
        });

        $(container).find(".basicGrayBtnLike").mousedown(function (){
            msgBox.alert({info: "点赞"});
            return false;
        });

        $(container).find(".basicGrayDescription").mousedown(function (){
            let container = $("#" + thatGray.containerId).find(".basicContainer");
            let descriptionElement = $(container).find(".basicGrayDescription");
            if($(descriptionElement).hasClass("basicGrayDescriptionFull")){
                $(descriptionElement).removeClass("basicGrayDescriptionFull");
            }
            else{
                $(descriptionElement).addClass("basicGrayDescriptionFull");
            }
            return false;
        });
    }

}
export default BasicGray