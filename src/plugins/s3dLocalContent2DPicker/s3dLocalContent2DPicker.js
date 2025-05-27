import {cmnPcr, PopupContainer, s3dUiStatus} from "../../commonjs/common/common.js"
import "./s3dLocalContent2DPicker.css"

//S3dWeb 选择本地Content2D
let S3dLocalContent2DPicker = function (){
	//当前对象
	const thatS3dLocalContent2DPicker = this;

	this.manager = null;
	
	//containerId
	this.containerId = null;

	//参数信息
	this.paramInfo = null;

	//选中的模板编码
	this.moduleCode = null;

	//选中的模板名称
	this.moduleName = null;

	//选中的主题编码
	this.themeCode = null;

	//选中的主题名称
	this.themeName = null;

	//初始化
	this.init = function(p){
		thatS3dLocalContent2DPicker.manager = p.manager;
		thatS3dLocalContent2DPicker.containerId = p.containerId;
		thatS3dLocalContent2DPicker.title = p.config.title == null ? "选择页面模板" : p.config.title;
	}  
	
	//显示材质选择器
	this.showPicker = function(p){
		thatS3dLocalContent2DPicker.paramInfo = p.paramInfo;
		thatS3dLocalContent2DPicker.showContainer();
    } 

	//添加条目
	this.addItemToList = function(p){
		let container = $("#" + thatS3dLocalContent2DPicker.popContainer.contentId);
		let innerContainer = $(container).find(".s3dLocalContent2DPickerInnerContainer")[0];
		p.index = $(innerContainer).children().length;
		let itemHtml = thatS3dLocalContent2DPicker.getItemHtml(p);
		$(innerContainer).append(itemHtml); 
	} 

	//显示选择器的容器
	this.showContainer = function(p){
		let popContainer = new PopupContainer({
			width: 820,
			height: 600,
			top: 50,
			canClose: true,
			title: "选择图片",
			containerId: thatS3dLocalContent2DPicker.containerId
		});
		popContainer.show();
		thatS3dLocalContent2DPicker.popContainer = popContainer;

		let winHtml = thatS3dLocalContent2DPicker.getListHtml();
		let container = $("#" + thatS3dLocalContent2DPicker.popContainer.contentId);
		$(container).append(winHtml);

		$(container).find(".s3dLocalContent2DPickerItemContainer").click(function(event){
			$(container).find(".s3dLocalContent2DPickerItemContainer").removeClass("s3dLocalContent2DPickerItemContainerActive");
			$(this).addClass("s3dLocalContent2DPickerItemContainerActive");
			thatS3dLocalContent2DPicker.moduleCode = $(this).attr("moduleCode");
			thatS3dLocalContent2DPicker.moduleName = $(this).attr("moduleName");
			thatS3dLocalContent2DPicker.themeCode = $(this).attr("themeCode");
			thatS3dLocalContent2DPicker.themeName = $(this).attr("themeName");

			thatS3dLocalContent2DPicker.endPick();
			thatS3dLocalContent2DPicker.manager.viewer.changeStatus({
				status: s3dUiStatus.normalView
			});
		});

		$(container).find(".s3dLocalContent2DPickerTitle").text(thatS3dLocalContent2DPicker.title);
		$(container).find(".s3dLocalContent2DPickerCloseBtn").click(function(event){
			thatS3dLocalContent2DPicker.hideContainer();
			thatS3dLocalContent2DPicker.manager.viewer.changeStatus({
				status: s3dUiStatus.normalView
			}); 
		})
		$(container).find(".s3dLocalContent2DPickerBtnCancel").click(function(event){
			thatS3dLocalContent2DPicker.hideContainer();
			thatS3dLocalContent2DPicker.manager.viewer.changeStatus({
				status: s3dUiStatus.normalView
			});
		})
		$(container).find(".s3dLocalContent2DPickerBtnClear").click(function(event){
			thatS3dLocalContent2DPicker.moduleCode = "";
			thatS3dLocalContent2DPicker.moduleName = "";
			thatS3dLocalContent2DPicker.themeCode = "";
			thatS3dLocalContent2DPicker.themeName = "";
			thatS3dLocalContent2DPicker.endPick();
			thatS3dLocalContent2DPicker.manager.viewer.changeStatus({
				status: s3dUiStatus.normalView
			});
		})


		$(container).find(".s3dLocalContent2DPickerListHeader").click(function (){
			let partContainer= $(this).parent();
			if($(partContainer).hasClass("s3dLocalContent2DPickerPartContainerExpand")){
				$(partContainer).removeClass("s3dLocalContent2DPickerPartContainerExpand");
			}
			else {
				$(partContainer).addClass("s3dLocalContent2DPickerPartContainerExpand");
			}
		});
	}
	 
	//构造材质列表html
	this.getListHtml = function(p) {
		let html = "<div class=\"s3dLocalContent2DPickerContainer\">"
			+ "<div class=\"s3dLocalContent2DPickerInnerContainer\">";
		for (let i = 0; i < thatS3dLocalContent2DPicker.manager.localContent2D.themes.length; i++) {
			let themeInfo = thatS3dLocalContent2DPicker.manager.localContent2D.themes[i];
			html += thatS3dLocalContent2DPicker.getPartListHtml(themeInfo.code, themeInfo.name, themeInfo.modules);
		}

		html += ("</div>"
			+ "<div class=\"s3dLocalContent2DPickerBottomContainer\">"
			+ "<div class=\"s3dLocalContent2DPickerBottomBtn s3dLocalContent2DPickerBtnClear\">清&nbsp;&nbsp;除</div>"
			+ "<div class=\"s3dLocalContent2DPickerBottomBtn s3dLocalContent2DPickerBtnCancel\">取&nbsp;&nbsp;消</div>"
			+ "</div>"
			+ "</div>");
		return html;
	}

	this.getPartListHtml = function (themeCode, themeName, moduleList){
		let html = "";
		html += ("<div class=\"s3dLocalContent2DPickerPartContainer s3dLocalContent2DPickerPartContainerExpand\" code='" + themeCode + "'>");
		html += ("<div class='s3dLocalContent2DPickerListHeader'><div class=\"s3dLocalContent2DPickerListHeaderImage\">&#9654;</div><div class='s3dLocalContent2DPickerListHeaderTitle'>" + themeName + "<span class='s3dLocalContent2DPickerListHeaderCount'>(" + moduleList.length + ")</span></div></div>");
		html += "<div class=\"s3dLocalContent2DPickerListContainer\">";
		if(moduleList == null || moduleList.length === 0) {
			html += ("<div class=\"s3dLocalContent2DPickerNoneItemContainer\">无模板记录</div>");
		}
		else {
			for (let i = 0; i < moduleList.length; i++) {
				let moduleInfo = moduleList[i];
				let itemHtml = thatS3dLocalContent2DPicker.getItemHtml({
					index: i,
					moduleCode: moduleInfo.code,
					moduleName: moduleInfo.name,
					themeCode: themeCode,
					themeName: themeName,
					imageName: moduleInfo.imageName
				});
				html += itemHtml;
			}
		}
		html += "</div>";
		html += "</div>";
		return html;
	}

	//构造材质条目html
	this.getItemHtml = function(p){
		let html = "<div class=\"s3dLocalContent2DPickerItemContainer\" moduleCode=\"" + p.moduleCode + "\" moduleName=\"" + p.moduleName + "\" themeCode=\"" + p.themeCode + "\" themeName=\"" + p.themeName + "\" >"
		+ "<div class=\"s3dLocalContent2DPickerItemCell s3dLocalContent2DPickerItemName\">" + p.moduleName + "</div>";
		if(p.imageName == null || p.imageName.length === 0){
			html += "<div class=\"s3dLocalContent2DPickerItemCell s3dLocalContent2DPickerItemCellImage s3dLocalContent2DPickerItemCellNoneImage\">&nbsp;</div>"
		}
		html +=  "</div>";
		return html;
	}

	//取消选择
	this.cancelPick = function(p){
		thatS3dLocalContent2DPicker.hideContainer(p);
	}  

	//隐藏选择器容器
	this.hideContainer = function(p){
		thatS3dLocalContent2DPicker.popContainer.close();
	}

	//结束选择
	this.endPick = function(){
		thatS3dLocalContent2DPicker.hideContainer();

		thatS3dLocalContent2DPicker.paramInfo.afterPickContent2D({
			moduleCode: thatS3dLocalContent2DPicker.moduleCode,
			moduleName: thatS3dLocalContent2DPicker.moduleName,
			themeCode: thatS3dLocalContent2DPicker.themeCode,
			themeName: thatS3dLocalContent2DPicker.themeName
		});
		
	}
}
export default S3dLocalContent2DPicker