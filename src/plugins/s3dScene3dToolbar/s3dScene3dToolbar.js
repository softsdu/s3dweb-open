import {
	cmnPcr,
	s3dNormalViewport,
	s3dTransformMode,
	s3dUiStatus,
	serverAccess
} from "../../commonjs/common/common.js"
import "./s3dScene3dToolbar.css"
import {msgBox} from "../../commonjs/common/common.js"

//S3dWeb场景设计
let S3dScene3dToolbar = function (){
	//当前对象
	const thatS3dScene3dToolbar= this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dScene3dToolbar.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dScene3dToolbar.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dScene3dToolbar.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}
	 
	//初始化
	this.init = function(p){
		thatS3dScene3dToolbar.containerId = p.containerId;
		thatS3dScene3dToolbar.manager = p.manager;

		if(p.config.onButtonClick != null){
			thatS3dScene3dToolbar.addEventFunction("onButtonClick", p.config.onButtonClick);
		}

		thatS3dScene3dToolbar.showScene3dToolbar(p.config.title);
		$("#" + thatS3dScene3dToolbar.containerId).find(".s3dScene3dToolbarCloseBtn").click(function(){
			thatS3dScene3dToolbar.hide();
		});

		thatS3dScene3dToolbar.show();
	}
	
	//隐藏
	this.hide = function(){
		$("#" + thatS3dScene3dToolbar.containerId).find(".s3dScene3dToolbarContainer").css({"display": "none"});
	}
	
	//隐藏
	this.show = function(){
		$("#" + thatS3dScene3dToolbar.containerId).find(".s3dScene3dToolbarContainer").css({"display": "block"});
	}

	this.onButtonClick = function (buttonName){
		let p = {
			buttonName: buttonName,
			processed: false
		};
		thatS3dScene3dToolbar.doEventFunction("onButtonClick", p);
		return p.processed;
	}
	
	//显示
	this.showScene3dToolbar = function(title){
		//构造html
		let listHtml = thatS3dScene3dToolbar.getListHtml();
		let container = $("#" + thatS3dScene3dToolbar.containerId);
		let toolbarContainer = $(container).find(".s3dLayoutBlock[name='scene3dToolbar']");
		$(toolbarContainer).append(listHtml);
		$(toolbarContainer).find(".s3dScene3dToolbarTitle").text(title);

		//resize按钮
		//暂不启用
		//thatS3dScene3dToolbar.updateResizeBtn();

		$(toolbarContainer).find(".s3dScene3dToolbarContainer").find(".s3dScene3dToolbarBtnContainer").each(function (index, element){
			let imageName = $(element).attr("imageName");
			if(imageName != null) {
				let imageUrl = thatS3dScene3dToolbar.manager.layout.imagesFolder + "toolbar/" + imageName + ".png";
				$(element).css("background-image", "url(" + imageUrl + ")");
			}
		});

		//绑定事件
		$(toolbarContainer).find(".s3dScene3dToolbarContainer").find(".s3dScene3dToolbarBtnContainer").click(function (){
			let btnName = $(this).attr("name");

			let processed = thatS3dScene3dToolbar.onButtonClick(btnName);

			switch (btnName){
				case "undo":{
					thatS3dScene3dToolbar.manager.statusBar.undo();
					break;
				}
				case "redo":{
					thatS3dScene3dToolbar.manager.statusBar.redo();
					break;
				}
				case "saveModel":{
					if(!processed){
						thatS3dScene3dToolbar.showUnimplementedMethodAlert(btnName);
					}
					break;
				}
				case "exportModel":{
					if (thatS3dScene3dToolbar.manager.exporter.getVisible()) {
						thatS3dScene3dToolbar.manager.exporter.hide();
					} else {
						thatS3dScene3dToolbar.manager.exporter.show();
					}
					break;
				}
				case "setting":{
					if (thatS3dScene3dToolbar.manager.setting.getVisible()) {
						thatS3dScene3dToolbar.manager.setting.hide();
					}
					else {
						thatS3dScene3dToolbar.manager.setting.show();
					}
					break;
				}
				case "skyBoxSetting":{
					let skyInfo = thatS3dScene3dToolbar.manager.s3dObject.scene.sky;
					thatS3dScene3dToolbar.manager.skyBoxSetting.show({
						skyInfo: skyInfo,
						afterSetSkyBox: function (skyInfo){
							thatS3dScene3dToolbar.manager.s3dObject.scene.sky = skyInfo;
							thatS3dScene3dToolbar.manager.skyBox.setSkyInfo(skyInfo);
						}
					});
					break;
				}
				case "ruler":{
					thatS3dScene3dToolbar.manager.ruler.do();
					break;
				}
				case "splitter":{
					thatS3dScene3dToolbar.manager.splitter.do();
					break;
				}
				case "topViewport":{
					thatS3dScene3dToolbar.manager.viewer.setNormalViewport(s3dNormalViewport.top);
					break;
				}
				case "property":{
					if (thatS3dScene3dToolbar.manager.propertyEditor.getVisible()) {
						thatS3dScene3dToolbar.manager.propertyEditor.hide();
					} else {
						thatS3dScene3dToolbar.manager.propertyEditor.show();
					}
					break;
				}
				case "componentList":{
					if (thatS3dScene3dToolbar.manager.adder.getVisible()) {
						thatS3dScene3dToolbar.manager.adder.hide();
					}
					else {
						thatS3dScene3dToolbar.manager.adder.show();
					}
					break;
				}
				case "statusBar":{
					if (thatS3dScene3dToolbar.manager.statusBar.getVisible()) {
						thatS3dScene3dToolbar.manager.statusBar.hide();
					}
					else {
						thatS3dScene3dToolbar.manager.statusBar.show();
					}
					break;
				}
				case "tree":{
					if (thatS3dScene3dToolbar.manager.treeEditor.getVisible()) {
						thatS3dScene3dToolbar.manager.treeEditor.hide();
					} else {
						thatS3dScene3dToolbar.manager.treeEditor.show();
					}
					break;
				}
				case "rotationMode":{
					//控制器为旋转模式
					thatS3dScene3dToolbar.manager.moveHelper.setMode(s3dTransformMode.rotation);
					break;
				}
				case "scaleMode":{
					//控制器为缩放模式
					thatS3dScene3dToolbar.manager.moveHelper.setMode(s3dTransformMode.scale);
					break;
				}
				case "positionMode":{
					//控制器为位移模式
					thatS3dScene3dToolbar.manager.moveHelper.setMode(s3dTransformMode.position);
					break;
				}
				case "placeOnGround":{
					thatS3dScene3dToolbar.manager.alignment.placeOnGround();
					break;
				}
				case "alignNX":{
					thatS3dScene3dToolbar.manager.alignment.alignNX();
					break;
				}
				case "alignPX":{
					thatS3dScene3dToolbar.manager.alignment.alignPX();
					break;
				}
				case "alignNY":{
					thatS3dScene3dToolbar.manager.alignment.alignNY();
					break;
				}
				case "alignPY":{
					thatS3dScene3dToolbar.manager.alignment.alignPY();
					break;
				}
				case "alignNZ":{
					thatS3dScene3dToolbar.manager.alignment.alignNZ();
					break;
				}
				case "alignPZ":{
					thatS3dScene3dToolbar.manager.alignment.alignPZ();
					break;
				}
				case "againstX":{
					thatS3dScene3dToolbar.manager.alignment.againstX();
					break;
				}
				case "againstY":{
					thatS3dScene3dToolbar.manager.alignment.againstY();
					break;
				}
				case "againstZ":{
					thatS3dScene3dToolbar.manager.alignment.againstZ();
					break;
				}
				case "materialLocator":{
					thatS3dScene3dToolbar.manager.viewer.changeStatus({
						status: s3dUiStatus.locateMaterial
					});
					break;
				}
				case "generateAnimation":{
					thatS3dScene3dToolbar.manager.animationGenerator.show();
					break;
				}
				case "preview":{
					if(!processed){
						thatS3dScene3dToolbar.showUnimplementedMethodAlert(btnName);
					}
					break;
				}
				case "publish":{
					if(!processed){
						thatS3dScene3dToolbar.showUnimplementedMethodAlert(btnName);
					}
					break;
				}
				default:{
					msgBox.alert({info: "未知的按钮. btnName=" + btnName});
					break;
				}
			}
		});
	}

	this.showUnimplementedMethodAlert = function (buttonName){
		msgBox.alert({info: "尚未实现的方法. MethodName=" + buttonName});
	}

	this.updateResizeBtn = function (){
		let toolbarContainer = $("#" + thatS3dScene3dToolbar.containerId).find(".s3dScene3dToolbarContainer")[0];
		let resizeBtns = $(toolbarContainer).find(".s3dScene3dToolbarResizeBtn");

		let newResizeBtnHtml;
		if(resizeBtns.length === 0){
			newResizeBtnHtml = thatS3dScene3dToolbar.getResizeBtnHtml(true);
		}
		else {
			let resizeBtn = resizeBtns[0];
			let status = $(resizeBtn).attr("status");

			//执行隐藏或还原
			switch (status) {
				case "normal": {
					$(toolbarContainer).addClass("s3dScene3dToolbarContainerMin");
					break;
				}
				case "min": {
					$(toolbarContainer).removeClass("s3dScene3dToolbarContainerMin");
					break;
				}
			}

			//获取新的按钮html
			switch (status) {
				case "normal": {
					newResizeBtnHtml = thatS3dScene3dToolbar.getResizeBtnHtml(false);
					break;
				}
				case "min": {
					newResizeBtnHtml = thatS3dScene3dToolbar.getResizeBtnHtml(true);
					break;
				}
			}
			$(resizeBtn).remove();
		}
		$(toolbarContainer).append(newResizeBtnHtml);

		//绑定事件
		$(toolbarContainer).find(".s3dScene3dToolbarResizeBtn").click(function (){
			thatS3dScene3dToolbar.updateResizeBtn();
		});
	}

	this.getResizeBtnHtml = function (closed){
		if(closed){
			return "<div class=\"s3dScene3dToolbarResizeBtn\" title=\"最小化工具栏\" status=\"normal\"><svg xmlns=\"http://www.w3.org/2000/svg\" class=\"s3dScene3dToolbarBtnSvg\" width=\"20\" height=\"24\">"
				+ "<line x1=\"2\" y1=\"10\" x2=\"14\" y2=\"10\" class=\"s3dScene3dToolbarResizeBtnLine\" />"
				+ "<line x1=\"2\" y1=\"11\" x2=\"14\" y2=\"11\" class=\"s3dScene3dToolbarResizeBtnLine\" />"
				+ "</svg></div>";
		}
		else{
			return "<div class=\"s3dScene3dToolbarResizeBtn\" title=\"还原工具栏\" status=\"min\"><svg xmlns=\"http://www.w3.org/2000/svg\" class=\"s3dScene3dToolbarBtnSvg\" width=\"20\" height=\"24\">"
				+ "<line x1=\"2\" y1=\"9\" x2=\"14\" y2=\"9\" class=\"s3dScene3dToolbarResizeBtnLine\" />"
				+ "<line x1=\"2\" y1=\"16\" x2=\"14\" y2=\"16\" class=\"s3dScene3dToolbarResizeBtnLine\" />"
				+ "<line x1=\"2\" y1=\"9\" x2=\"2\" y2=\"16\" class=\"s3dScene3dToolbarResizeBtnLine\" />"
				+ "<line x1=\"14\" y1=\"9\" x2=\"14\" y2=\"16\" class=\"s3dScene3dToolbarResizeBtnLine\" />"
				+ "</svg></div>";
		}
	}
	
	//获取list html
	this.getListHtml = function(){

		let undoBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer s3dScene3dToolbarBtnUndo\" title=\"撤销\" name=\"undo\">&#x21B6;</div>";

		let redoBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer s3dScene3dToolbarBtnRedo\" title=\"重做\" name=\"redo\">&#x21B7;</div>";

		let positionModeBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"positionMode\" title=\"切换为位移模式\" name=\"positionMode\"></div>";

		let rotationModeBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"rotationMode\" title=\"切换为旋转模式\" name=\"rotationMode\"></div>";

		let scaleModeBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"scaleMode\" title=\"切换为缩放模式\" name=\"scaleMode\"></div>";

		let settingBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"setting\" title=\"模型设置\" name=\"setting\"></div>";

		let saveBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"save\" title=\"保存\" name=\"saveModel\"></div>";

		let exportBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"export\" title=\"导出\" name=\"exportModel\"></div>";

		let btnSplitterHtml = "<div class=\"s3dScene3dToolbarBtnSplitter\">"
			+ "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"s3dScene3dToolbarBtnSvg\" width=\"12\" height=\"36\">"
			+ "<line x1=\"6\" y1=\"6\" x2=\"6\" y2=\"30\" class=\"s3dScene3dToolbarBtnSplitterLineA\" />"
			+ "</svg>"
			+ "</div>";

		let topViewportBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"topViewport\" title=\"显示原点\" name=\"topViewport\"></div>";

		let rulerBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"ruler\" title=\"测距\" name=\"ruler\"></div>";

		let splitterBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"splitter\" title=\"分解，将大模型拆成多个小模型\" name=\"splitter\"></div>";

		let generateAnimationBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"generateAnimation\" title=\"生成动画\" name=\"generateAnimation\"></div>";

		let treeBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"tree\" title=\"显示/隐藏模型结构\" name=\"tree\"></div>";

		let propertyBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"property\" title=\"显示/隐藏属性编辑器\" name=\"property\"></div>";

		let componentListBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"componentList\" title=\"显示/隐藏组件库\" name=\"componentList\"></div>";

		let statusBarBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"statusBar\" title=\"显示/隐藏状态栏\" name=\"statusBar\"></div>";

		let skyBoxSettingBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"skyBoxSetting\" title=\"天空设置\" name=\"skyBoxSetting\"></div>";

		let placeOnGroundBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"placeOnGround\" title=\"放置在地面\" name=\"placeOnGround\"></div>";

		let alignNYBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"alignNY\" title=\"底部对齐（Y反方向）\" name=\"alignNY\"></div>";

		let alignPYBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"alignPY\" title=\"顶部对齐（Y正方向）\" name=\"alignPY\"></div>";

		let alignNXBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"alignNX\" title=\"X反方向对齐\" name=\"alignNX\"></div>";

		let alignPXBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"alignPX\" title=\"X正方向对齐\" name=\"alignPX\"></div>";

		let alignNZBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"alignNZ\" title=\"Z反方向对齐\" name=\"alignNZ\"></div>";

		let alignPZBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"alignPZ\" title=\"Z正方向对齐\" name=\"alignPZ\"></div>";

		let againstXBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"againstX\" title=\"X方向贴近\" name=\"againstX\"></div>";

		let againstYBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"againstY\" title=\"竖直方向贴近（Y方向）\" name=\"againstY\"></div>";

		let againstZBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"againstZ\" title=\"Z方向贴近\" name=\"againstZ\"></div>";

		let materialLocatorBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"materialLocator\" title=\"定位材质\" name=\"materialLocator\"></div>";

		let previewBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"preview\" title=\"预览\" name=\"preview\"></div>";

		let publishBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"publish\" title=\"发布\" name=\"publish\"></div>";

		return "<div class=\"s3dScene3dToolbarContainer\">"
			+ "<div class=\"s3dScene3dToolbarInnerContainer\">"
			+ "<div class=\"s3dScene3dToolbarInnerLine\">"
			+ saveBtnHtml
			+ previewBtnHtml
			+ publishBtnHtml
			+ exportBtnHtml
			+ "</div>"
			+ "<div class=\"s3dScene3dToolbarInnerLine\">"
			+ undoBtnHtml
			+ redoBtnHtml
			+ btnSplitterHtml
			+ positionModeBtnHtml
			+ rotationModeBtnHtml
			+ scaleModeBtnHtml
			+ btnSplitterHtml
			+ materialLocatorBtnHtml
			+ "</div>"
			+ "<div class=\"s3dScene3dToolbarInnerLine\">"
			+ topViewportBtnHtml
			+ rulerBtnHtml
			+ btnSplitterHtml
			+ settingBtnHtml
			+ skyBoxSettingBtnHtml
			+ btnSplitterHtml
			+ "</div>"
			+ "<div class=\"s3dScene3dToolbarInnerLine\">"
			+ splitterBtnHtml
			+ generateAnimationBtnHtml
			+ btnSplitterHtml
			+ placeOnGroundBtnHtml
			+ alignPXBtnHtml
			+ alignNXBtnHtml
			+ alignPYBtnHtml
			+ alignNYBtnHtml
			+ alignPZBtnHtml
			+ alignNZBtnHtml
			+ againstXBtnHtml
			+ againstYBtnHtml
			+ againstZBtnHtml
			+ "</div>"
			+ "</div>"
			+ "</div>";
	}
}

export default S3dScene3dToolbar