import {cmnPcr, PopupContainer, s3dUiStatus} from "../../commonjs/common/common.js"
import "./s3dLocalMaterialPicker.css"

//S3dWeb 选择本地材质
let S3dLocalMaterialPicker = function (){
	//当前对象
	const thatS3dLocalMaterialPicker = this;

	this.manager = null;
	
	//containerId
	this.containerId = null;

	//参数信息
	this.paramInfo = null;

	//选中的材质编码
	this.materialCode = null;

	//选中的材质编码
	this.materialName = null;

	this.popContainer = null;

	//初始化
	this.init = function(p){
		thatS3dLocalMaterialPicker.manager = p.manager;
		thatS3dLocalMaterialPicker.containerId = p.containerId;
		thatS3dLocalMaterialPicker.title = p.config.title == null ? "选择材质" : p.config.title;
	}  
	
	//显示材质选择器
	this.showPicker = function(p){
		thatS3dLocalMaterialPicker.paramInfo = p.paramInfo;
		thatS3dLocalMaterialPicker.materialCode = p.paramInfo.materialCode;
		thatS3dLocalMaterialPicker.materialName = p.paramInfo.materialName;
		//材质列表
		thatS3dLocalMaterialPicker.showContainer();
    } 

	//添加条目
	this.addItemToList = function(p){
		let container = $("#" + thatS3dLocalMaterialPicker.popContainer.contentId).find(".s3dLocalMaterialPickerContainer")[0];
		let innerContainer = $(container).find(".s3dLocalMaterialPickerInnerContainer")[0];
		p.index = $(innerContainer).children().length;
		let itemHtml = thatS3dLocalMaterialPicker.getItemHtml(p);
		$(innerContainer).append(itemHtml); 
	} 

	//显示选择器的容器
	this.showContainer = function(p){
		let popContainer = new PopupContainer({
			width: 800,
			height: 600,
			top: 50,
			canClose: true,
			title: "选择材质",
			containerId: thatS3dLocalMaterialPicker.containerId
		});
		popContainer.show();
		thatS3dLocalMaterialPicker.popContainer = popContainer;

		let winHtml = thatS3dLocalMaterialPicker.getListHtml();
		$("#" + thatS3dLocalMaterialPicker.popContainer.contentId).html(winHtml);

		let container = $("#" + thatS3dLocalMaterialPicker.popContainer.contentId).find(".s3dLocalMaterialPickerContainer")[0];

		$(container).find(".s3dLocalMaterialPickerItemContainer").click(function(event){
			let container = $("#" + thatS3dLocalMaterialPicker.popContainer.contentId).find(".s3dLocalMaterialPickerContainer")[0];
			$(container).find(".s3dLocalMaterialPickerItemContainer").removeClass("s3dLocalMaterialPickerItemContainerActive");
			$(this).addClass("s3dLocalMaterialPickerItemContainerActive");
			thatS3dLocalMaterialPicker.materialCode = $(this).attr("materialCode");
			thatS3dLocalMaterialPicker.materialName = $(this).attr("materialName");

			thatS3dLocalMaterialPicker.endPick();
			thatS3dLocalMaterialPicker.manager.viewer.changeStatus({
				status: s3dUiStatus.normalView
			});
		});

		$(container).find(".s3dLocalMaterialPickerTitle").text(thatS3dLocalMaterialPicker.title);
		$(container).find(".s3dLocalMaterialPickerCloseBtn").click(function(event){
			thatS3dLocalMaterialPicker.hideContainer();
			thatS3dLocalMaterialPicker.manager.viewer.changeStatus({
				status: s3dUiStatus.normalView
			}); 
		})
		$(container).find(".s3dLocalMaterialPickerBtnCancel").click(function(event){
			thatS3dLocalMaterialPicker.hideContainer();
			thatS3dLocalMaterialPicker.manager.viewer.changeStatus({
				status: s3dUiStatus.normalView
			});
		})
		$(container).find(".s3dLocalMaterialPickerBtnClear").click(function(event){
			thatS3dLocalMaterialPicker.materialCode = "";
			thatS3dLocalMaterialPicker.materialName = "";
			thatS3dLocalMaterialPicker.endPick();
			thatS3dLocalMaterialPicker.manager.viewer.changeStatus({
				status: s3dUiStatus.normalView
			});
		})


		$(container).find(".s3dLocalMaterialPickerListHeader").click(function (){
			let partContainer= $(this).parent();
			if($(partContainer).hasClass("s3dLocalMaterialPickerPartContainerExpand")){
				$(partContainer).removeClass("s3dLocalMaterialPickerPartContainerExpand");
			}
			else {
				$(partContainer).addClass("s3dLocalMaterialPickerPartContainerExpand");
			}
		});
	}
	 
	//构造材质列表html
	this.getListHtml = function(p){
		let html = "<div class=\"s3dLocalMaterialPickerContainer\">"
			+ "<div class=\"s3dLocalMaterialPickerInnerContainer\">";

		html += thatS3dLocalMaterialPicker.getPartListHtml("user", "自定义材质", thatS3dLocalMaterialPicker.manager.localMaterials.userList);

		/*不再显示系统自带材质
		html += thatS3dLocalMaterialPicker.getPartListHtml("system", "系统材质", thatS3dLocalMaterialPicker.manager.localMaterials.systemList);
		*/

		html += ("</div>"
		+ "<div class=\"s3dLocalMaterialPickerBottomContainer\">"
		+ "<div class=\"s3dLocalMaterialPickerBottomBtn s3dLocalMaterialPickerBtnClear\">清&nbsp;&nbsp;除</div>"
		+ "<div class=\"s3dLocalMaterialPickerBottomBtn s3dLocalMaterialPickerBtnCancel\">取&nbsp;&nbsp;消</div>"
		+ "</div>"
		+ "</div>");
		return html; 
	}

	this.getPartListHtml = function (partName, partTitle, materialList){
		let html = "";
		html += ("<div class=\"s3dLocalMaterialPickerPartContainer s3dLocalMaterialPickerPartContainerExpand\" name='" + partName + "'>");
		/*不再显示标题栏
		html += ("<div class='s3dLocalMaterialPickerListHeader'><div class=\"s3dLocalMaterialPickerListHeaderImage\">&#9654;</div><div class='s3dLocalMaterialPickerListHeaderTitle'>" + partTitle + "<span class='s3dLocalMaterialPickerListHeaderCount'>(" + materialList.length + ")</span></div></div>");
		*/
		html += "<div class=\"s3dLocalMaterialPickerListContainer\">";
		if(materialList == null || materialList.length === 0) {
			html += ("<div class=\"s3dLocalMaterialPickerNoneItemContainer\">无材质记录</div>");
		}
		else {
			for (let i = 0; i < materialList.length; i++) {
				let materialInfo = materialList[i];
				let itemHtml = thatS3dLocalMaterialPicker.getItemHtml({
					index: i,
					code: materialInfo.code,
					name: materialInfo.name,
					color: materialInfo.color,
					imageName: materialInfo.imageName,
					opacity: materialInfo.opacity,
					selected: materialInfo.code === thatS3dLocalMaterialPicker.paramInfo.materialCode
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
		let html = "<div class=\"s3dLocalMaterialPickerItemContainer\" materialCode=\"" + p.code + "\" materialName=\"" + p.name + "\">"
		+ "<div class=\"s3dLocalMaterialPickerItemCell s3dLocalMaterialPickerItemName\">" + p.name + "</div>";
		if(p.imageName.length === 0){
			html += "<div class=\"s3dLocalMaterialPickerItemCell s3dLocalMaterialPickerItemColor\" style=\"background-color:" + cmnPcr.getColorStr(p.color) + "\">&nbsp;</div>"
		}
		else{
			let imageUrl = thatS3dLocalMaterialPicker.manager.localImages.getImageUrl(p.imageName);
			html += "<div class=\"s3dLocalMaterialPickerItemCell s3dLocalMaterialPickerItemColor\" style=\"background-image:url(" + imageUrl + ")\">&nbsp;</div>"
		}
		html +=  "</div>";
		return html;
	}

	//取消选择
	this.cancelPick = function(p){
		thatS3dLocalMaterialPicker.hideContainer(p);
	}  

	//隐藏选择器容器
	this.hideContainer = function(p){
		thatS3dLocalMaterialPicker.popContainer.close();
	}

	//结束选择
	this.endPick = function(){
		let materialCode =  thatS3dLocalMaterialPicker.materialCode;
		let materialName =  thatS3dLocalMaterialPicker.materialName;
		thatS3dLocalMaterialPicker.hideContainer();

		thatS3dLocalMaterialPicker.paramInfo.afterPickMaterial({
			materialCode: materialCode,
			materialName: materialName,
			paramInfo: thatS3dLocalMaterialPicker.paramInfo
		});
		
	}
}
export default S3dLocalMaterialPicker