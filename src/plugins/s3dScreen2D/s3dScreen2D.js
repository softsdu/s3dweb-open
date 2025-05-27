import {cmnPcr, s3dContent2DShiftType} from "../../commonjs/common/common.js"
import "./S3dScreen2D.css"

//S3dWeb 屏幕
let S3dScreen2D = function (){
	//当前对象
	const thatS3dScreen2D = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	this.currentPageIndex = 0;

	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dScreen2D.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dScreen2D.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dScreen2D.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}
	 
	//初始化
	this.init = function(p){
		thatS3dScreen2D.containerId = p.containerId;
		thatS3dScreen2D.manager = p.manager;

		let screenDiv = document.createElement("div");
		screenDiv.className = "s3dScreen2DContainer";
		screenDiv.id = cmnPcr.createGuid();
		thatS3dScreen2D.manager.viewer.renderer2d.domElement.appendChild(screenDiv);

		let html = "<div class='s3dScreen2DCaptionContainer'></div>"
			+ "<div class='s3dScreen2DInnerContainer'>"
			+ "<div class='s3dScreen2DContentPageContainer'></div>"
			+ "</div>";
		$(screenDiv).html(html);
	}

	this.getScreenId = function (){
		return $("#" + thatS3dScreen2D.containerId).find(".s3dScreen2DContainer").attr("id");
	}

	this.getContent2DContainer = function (){
		let container = $("#" + thatS3dScreen2D.containerId).find(".s3dScreen2DContainer");
		return $(container).find(".s3dScreen2DContentPageContainer");
	}

	this.updateContent2DItem = function (p){
		let container = $("#" + thatS3dScreen2D.containerId).find(".s3dScreen2DContainer");
		let content2DPageContainer = $(container).find(".s3dScreen2DContentPageContainer");
		let viewItem = $(content2DPageContainer).find("[s3dEditable='true'][itemCode='" + p.code + "']");
		let itemType = $(viewItem).attr("itemType");
		switch(itemType){
			case "link":{
				$(viewItem).attr("itemValue", p.value);
				break;
			}
			case "text":
			default:{
				$(viewItem).text(p.value);
				break;
			}
		}
	}


	this.getContent2DItemValue = function (itemCode){
		let container = $("#" + thatS3dScreen2D.containerId).find(".s3dScreen2DContainer");
		let content2DPageContainer = $(container).find(".s3dScreen2DContentPageContainer");
		let viewItem = $(content2DPageContainer).find("[s3dEditable='true'][itemCode='" + itemCode + "']");
		let itemType = $(viewItem).attr("itemType");
		switch(itemType){
			case "link":{
				return $(viewItem).attr("itemValue");
			}
			case "text":
			default:{
				return $(viewItem).text();
			}
		}
	}

	this.addNavigator = function (html){
		let container = $("#" + thatS3dScreen2D.containerId).find(".s3dScreen2DContainer");
		let innerContainer = $(container).find(".s3dScreen2DInnerContainer");
		$(innerContainer).append(html);
	}

	this.updateContent2D = function (p){
		thatS3dScreen2D.currentPageIndex = p.pageIndex;
		let html = p.html;
		let shiftType = p.shiftType;
		let isForward = p.isForward;
		const animationTime = p.shiftAnimationTime;
		let container = $("#" + thatS3dScreen2D.containerId).find(".s3dScreen2DContainer");
		const pageContainer = $(container).find(".s3dScreen2DContentPageContainer");
		let oldInnerContainer = $(pageContainer).find(".s3dScreen2DContentPageInnerContainer");
		let innerContainerId = cmnPcr.createGuid();

		let innerHtml = "<div class='s3dScreen2DContentPageInnerContainer' id='" + innerContainerId + "'>";
		innerHtml += html;
		if(p.editing) {
			innerHtml += "<div class='s3dScreen2DContentPageMaskContainer'></div>";
		}
		innerHtml += "</div>";
		$(pageContainer).append(innerHtml);

		let newInnerContainer = $(pageContainer).find(".s3dScreen2DContentPageInnerContainer[id='" + innerContainerId + "']");
		if(oldInnerContainer.length > 0) {
			switch(shiftType){
				case s3dContent2DShiftType.fadeInOut: {
					$(newInnerContainer).css({
						opacity: 0
					});
					$(oldInnerContainer).fadeOut(animationTime / 2, function () {
						$(oldInnerContainer).remove();
						$(newInnerContainer).fadeIn(animationTime / 2, function (){
							$(newInnerContainer).css({
								opacity: 1
							});
						});
					});
					break;
				}
				case s3dContent2DShiftType.horizontal: {
					if(isForward) {
						$(newInnerContainer).css({
							left: "100%"
						});
						$(oldInnerContainer).animate({
							left: "-100%"
						}, animationTime, function () {
							$(oldInnerContainer).remove();
						});
						$(newInnerContainer).animate({
							left: "0"
						}, animationTime, function () {
							$(newInnerContainer).css({
								left: "0"
							});
						});
					}
					else{
						$(newInnerContainer).css({
							left: "-100%"
						});
						$(oldInnerContainer).animate({
							left: "100%"
						}, animationTime, function () {
							$(oldInnerContainer).remove();
						});
						$(newInnerContainer).animate({
							left: "0"
						}, animationTime, function () {
							$(newInnerContainer).css({
								left: "0"
							});
						});
					}
					break;
				}
				case s3dContent2DShiftType.vertical: {
					if (isForward) {
						$(newInnerContainer).css({
							top: "100%"
						});
						$(oldInnerContainer).animate({
							top: "-100%"
						}, animationTime, function () {
							$(oldInnerContainer).remove();
						});
						$(newInnerContainer).animate({
							top: "0"
						}, animationTime, function () {
							$(newInnerContainer).css({
								top: "0"
							});
						});
					} else {
						$(newInnerContainer).css({
							top: "-100%"
						});
						$(oldInnerContainer).animate({
							top: "100%"
						}, animationTime, function () {
							$(oldInnerContainer).remove();
						});
						$(newInnerContainer).animate({
							top: "0"
						}, animationTime, function () {
							$(newInnerContainer).css({
								top: "0"
							});
						});

					}
					break;
				}
				default: {
					$(oldInnerContainer).remove();
					break;
				}
			}
		}
		else {
			$(oldInnerContainer).remove();
		}
		return innerContainerId;
	}

	this.clearContent2D = function (){
		let container = $("#" + thatS3dScreen2D.containerId).find(".s3dScreen2DContainer");
		let innerContainer = $(container).find(".s3dScreen2DContentPageContainer");
		$(innerContainer).empty();
	}

	this.updateCaption = function (captionContainer, captionIndex, caption){
		let html = ("<div class='s3dScreen2DCaptionItem' index='" + captionIndex + "'  startFrame='" + caption.startFrame + "'  endFrame='" + caption.endFrame + "' >"
			+  cmnPcr.htmlEncode(caption.text)
			+ "</div>");
		$(captionContainer).html(html);
	}

	this.clearCaption = function (captionContainer){
		$(captionContainer).empty();
	}

	this.removeCaption = function(captionContainer, captionIndex){
		$(captionContainer).find("s3dScreen2DCaptionItem[index='" + captionIndex + "']").remove();
	}

	this.autoUpdateCaption = function (p) {
		const captionList = p.captionList;
		const captionContainer = p.captionContainer;
		const preFrameSpanTime = p.preFrameSpanTime;
		const captionBeforeDisappearTime = p.captionBeforeDisappearTime;
		const captionBeforeDisappearFrame = p.captionBeforeDisappearFrame;
		let clock = thatS3dScreen2D.manager.viewer.runAnimationInfo.clock;
		if (clock != null) {
			let currentFrame = clock.elapsedTime / preFrameSpanTime;

			let currentCaptionIndex = -1;
			let currentCaptionEndFrame = -1;
			let captionItem = $(captionContainer).find(".s3dScreen2DCaptionItem");

			if (captionItem.length !== 0) {
				currentCaptionIndex = cmnPcr.strToDecimal($(captionItem).attr("index"));
				currentCaptionEndFrame = cmnPcr.strToDecimal($(captionItem).attr("endFrame"));
				//让之前的字幕消失
				if (currentCaptionEndFrame < currentFrame + captionBeforeDisappearFrame) {
					$(captionItem).addClass("s3dScreen2DCaptionItemOut");
					const disappearCaptionIndex = currentCaptionIndex;
					setTimeout(function (){
						thatS3dScreen2D.removeCaption(captionContainer, disappearCaptionIndex);
					}, captionBeforeDisappearTime * 1000);
				}
			}
			for (let i = currentCaptionIndex + 1; i < captionList.length; i++) {
				let caption = captionList[i];
				if ((currentFrame > caption.startFrame)
					&& (currentFrame < caption.endFrame)
					&& currentCaptionIndex !== i) {
					//显示新的字幕
					thatS3dScreen2D.updateCaption(captionContainer, i, caption);
					break;
				}
			}
			setTimeout(function (){
				thatS3dScreen2D.autoUpdateCaption({
					captionList: captionList,
					captionContainer: captionContainer,
					preFrameSpanTime: preFrameSpanTime,
					captionBeforeDisappearTime: captionBeforeDisappearTime,
					captionBeforeDisappearFrame: captionBeforeDisappearFrame
				});
			});
		}
		else{
			thatS3dScreen2D.clearCaption(captionContainer);
		}
	}

	//设置字幕
	//captionList的格式内容为[{startFrame: 10, endFrame: 20, text: ""}, ....]
	this.setCaptionList = function (captionList){
		let container = $("#" + thatS3dScreen2D.containerId).find(".s3dScreen2DContainer");
		let captionContainer = $(container).find(".s3dScreen2DCaptionContainer");
		let defaultFPS = thatS3dScreen2D.manager.userAnimations.defaultFPS;
		let preFrameSpanTime = 1 / defaultFPS;
		let captionBeforeDisappearTime = 0.3;
		let captionBeforeDisappearFrame = captionBeforeDisappearTime / preFrameSpanTime;

		thatS3dScreen2D.autoUpdateCaption({
			captionList: captionList,
			captionContainer: captionContainer,
			preFrameSpanTime: preFrameSpanTime,
			captionBeforeDisappearTime: captionBeforeDisappearTime,
			captionBeforeDisappearFrame: captionBeforeDisappearFrame
		});
	}
	
	//隐藏
	this.hide = function(){
		$("#" + thatS3dScreen2D.containerId).find(".s3dScreen2DContainer").css({"display": "none"});
	}
	
	//隐藏
	this.show = function(){
		$("#" + thatS3dScreen2D.containerId).find(".s3dScreen2DContainer").css({"display": "block"});
	}
	 
}
export default S3dScreen2D