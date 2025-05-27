import {cmnPcr, msgBox, s3dNormalViewport, s3dTransformMode, s3dUiStatus} from "../../commonjs/common/common.js"
import "./S3dAppSimpleHeader.css"

let S3dAppSimpleHeader = function (){
	
	//当前对象
	const thatS3dAppSimpleHeader = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	//标题
	this.title = "";

	//事件
	this.eventFunctions = {};
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dAppSimpleHeader.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dAppSimpleHeader.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dAppSimpleHeader.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		}
	}

	//初始化
	this.init = function(p){
		thatS3dAppSimpleHeader.containerId = p.containerId;
		thatS3dAppSimpleHeader.manager = p.manager;
		thatS3dAppSimpleHeader.title = p.config.title;

		if(p.config.onButtonClick != null){
			thatS3dAppSimpleHeader.addEventFunction("onButtonClick", p.config.onButtonClick);
		}

		thatS3dAppSimpleHeader.initHtml();
		thatS3dAppSimpleHeader.initEvents();
	}

	this.refreshSubTitle = function (p){
		let container = $("#" + thatS3dAppSimpleHeader.containerId);
		let subTitle = $(container).find(".s3dAppSimpleHeaderContainer .s3dAppSimpleHeaderSubTitle");
		$(subTitle).text(p.subTitle);
		$("title").text("编辑 - " + p.subTitle + " - 数孪·万象");
	}

	this.initHtml = function (){
		let headerHtml = "<div class='s3dAppSimpleHeaderContainer'>";
		headerHtml += "<div class='s3dAppSimpleHeaderLeftContainer'>";
		headerHtml += "<div class='s3dAppSimpleHeaderLogo'></div>";
		headerHtml += ("<div class='s3dAppSimpleHeaderTitle'>" + cmnPcr.htmlEncode(thatS3dAppSimpleHeader.title) + "</div>");
		headerHtml += ("<div class='s3dAppSimpleHeaderSubTitle'><span class='s3dAppSimpleHeaderFileLogo'>&#x270E;</span>" + cmnPcr.htmlEncode(thatS3dAppSimpleHeader.manager.s3dObject.name) + "</div>");
		headerHtml += "</div>";
		headerHtml += "<div class='s3dAppSimpleHeaderRightContainer'>";
		headerHtml += "<div class='s3dAppSimpleHeaderBtn s3dAppSimpleHeaderBtnSave' name='saveModel'>保存</div>";
		headerHtml += "<div class='s3dAppSimpleHeaderBtn s3dAppSimpleHeaderBtnPreview' name='preview'>预览</div>";
		headerHtml += "<div class='s3dAppSimpleHeaderBtn s3dAppSimpleHeaderBtnPublish' name='publish'>发布</div>";

		/*暂不启用
		headerHtml += "<div class='s3dAppSimpleHeaderBtn s3dAppSimpleHeaderBtnShare' name='share'>分享</div>";
		 */

		headerHtml += "</div>";
		headerHtml += "</div>";

		let container = $("#" + thatS3dAppSimpleHeader.containerId);
		let headerContainer = $(container).find(".s3dLayoutBlock[name='appSimpleHeader']");
		$(headerContainer).append(headerHtml);

	}

	this.onButtonClick = function (buttonName){
		let p = {
			buttonName: buttonName,
			processed: false
		};
		thatS3dAppSimpleHeader.doEventFunction("onButtonClick", p);
		return p.processed;
	}

	this.initEvents = function () {
		let container = $("#" + thatS3dAppSimpleHeader.containerId);
		let headerContainer = $(container).find(".s3dLayoutBlock[name='appSimpleHeader']");

		//绑定事件
		$(headerContainer).find(".s3dAppSimpleHeaderRightContainer").find(".s3dAppSimpleHeaderBtn").click(function () {
			let btnName = $(this).attr("name");
			let processed = thatS3dAppSimpleHeader.onButtonClick(btnName);
			switch (btnName) {
				case "saveModel": {
					if (!processed) {
						thatS3dAppSimpleHeader.showUnimplementedMethodAlert(btnName);
					}
					break;
				}
				case "preview": {
					if (!processed) {
						thatS3dAppSimpleHeader.showUnimplementedMethodAlert(btnName);
					}
					break;
				}
				case "publish": {
					if (!processed) {
						thatS3dAppSimpleHeader.showUnimplementedMethodAlert(btnName);
					}
					break;
				}
				default: {
					msgBox.alert({info: "未知的按钮. btnName=" + btnName});
					break;
				}
			}
		});
	}

	this.showUnimplementedMethodAlert = function (buttonName){
		msgBox.alert({info: "尚未实现的方法. MethodName=" + buttonName});
	}
}
export default S3dAppSimpleHeader