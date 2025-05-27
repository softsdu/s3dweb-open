import {msgBox} from "../../../../../commonjs/common/common.js";

function ChinaAncient01BronzeWare(){
    const thatBronzeWare = this;

    this.containerId = null;

    this.manager = null;


    this.init = function (p) {
        thatBronzeWare.containerId = p.containerId;
        thatBronzeWare.manager = p.manager;
        thatBronzeWare.bindEvents();
    }

    this.bindEvents = function (){
        let container = $("#" + thatBronzeWare.containerId).find(".chinaAncient01OverviewInnerContainer");

        $(container).find(".chinaAncient01BronzeWareBtnHome").click(function (){
            window.location.url = $(this).attr("itemValue");
            return false;
        });

        $(container).find(".chinaAncient01BronzeWareBtnRotate").click(function (){
            msgBox.alert({info: "动画"});
            return false;
        });

        $(container).find(".chinaAncient01BronzeWareBtnShare").click(function (){
            msgBox.alert({info: "分享"});
            return false;
        });

        $(container).find(".chinaAncient01BronzeWareBtnLike").click(function (){
            msgBox.alert({info: "点赞"});
            return false;
        });
    }

}
export default ChinaAncient01BronzeWare