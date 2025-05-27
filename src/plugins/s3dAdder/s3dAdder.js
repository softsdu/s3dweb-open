import {cmnPcr, s3dUiStatus, msgBox, PopupContainer, s3dElement3DType} from "../../commonjs/common/common.js"
import "./s3dAdder.css"

//S3dWeb 模型新增
let S3dAdder = function (){
	//当前对象
	const thatS3dAdder = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null; 

	//服务器地址
	this.serverUrl = null;
	
	//所有类型节点数据（树形）
	this.categoryJArray = null;

	//组件数据
	this.componentJArray = null;

	this.adderWindow = null;

	//标题
	this.title = "添加物体";

	//新添加物体所属分组ID
	this.groupId = null;

	this.onePageItemCount = 20;

	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dAdder.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dAdder.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dAdder.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	} 
	 
	//初始化
	this.init = function(p){
		thatS3dAdder.containerId = p.containerId;
		thatS3dAdder.manager = p.manager;
		thatS3dAdder.title = p.config.title == null ? thatS3dAdder.title : p.config.title;

		if(p.config.onButtonClick != null){
			thatS3dAdder.addEventFunction("onButtonClick", p.config.onButtonClick);
		}

		if(p.config.onUploadComponent != null){
			thatS3dAdder.addEventFunction("onUploadComponent", p.config.onUploadComponent);
		}

		if(p.config.onRemoveComponent != null){
			thatS3dAdder.addEventFunction("onRemoveComponent", p.config.onRemoveComponent);
		}
	}
	
	//隐藏
	this.hide = function(){
		thatS3dAdder.adderWindow.hide();
	}
	
	//隐藏
	this.show = function(p){
		thatS3dAdder.groupId = p.groupId;
		if(thatS3dAdder.adderWindow == null){
			thatS3dAdder.initAdderWindow();
			thatS3dAdder.initCategoryTree();
			if(p.beforeAddComponent != null) {
				thatS3dAdder.addEventFunction("beforeAddComponent", p.beforeAddComponent);
			}
		}
		else{
			thatS3dAdder.adderWindow.show();
		}
	}
	
	//获取显示状态
	this.getVisible = function(){
		return $("#" + thatS3dAdder.containerId).find(".s3dAdderContainer").css("display") === "block";
	}

	//初始化html
	this.initAdderWindow = function(){
		let popContainer = new PopupContainer( {
			width : 1000,
			height : 800,
			top : 50,
			canClose: false,
			title: thatS3dAdder.title,
			containerId: thatS3dAdder.containerId
		});

		popContainer.show();

		let container = $("#" + popContainer.contentId);
		let innerHtml = thatS3dAdder.getAdderHtml();
		$(container).html(innerHtml);
		thatS3dAdder.adderWindow = popContainer;

		$(container).find(".s3dAdderComponentListQueryInput").change(function (){
			let keyword = $(this).val().trim();
			let categoryCode = $(container).find(".s3dAdderNodeHeaderActive").parent().attr("categoryCode");
			let componentsInfo = thatS3dAdder.manager.componentLibrary.getComponents(categoryCode, keyword, 0, thatS3dAdder.onePageItemCount);
			thatS3dAdder.showComponentList(componentsInfo);
		});

		$(container).find(".s3dAdderComponentMoreBtn").click(function (){
			let container = $("#" + thatS3dAdder.adderWindow.contentId).find(".s3dAdderContainer")[0];
			let nextPageIndex = parseInt($(this).attr("nextPageIndex"));
			let keyword = $(container).find(".s3dAdderComponentListQueryInput").val().trim();
			let categoryCode = $(container).find(".s3dAdderNodeHeaderActive").parent().attr("categoryCode");
			let componentsInfo = thatS3dAdder.manager.componentLibrary.getComponents(categoryCode, keyword, nextPageIndex, thatS3dAdder.onePageItemCount);
			thatS3dAdder.showComponentList(componentsInfo);
		});
	}

	//从加载构件分类
	this.initCategoryTree = function (){
		if(thatS3dAdder.manager.componentLibrary != null && thatS3dAdder.manager.componentLibrary.categories != null) {
			thatS3dAdder.showCategoryTree(thatS3dAdder.manager.componentLibrary.categories);

			//显示根节点对应的组件列表和子类
			let container = $("#" + thatS3dAdder.containerId);
			let firstRootItem = $(container).find(".s3dAdderNodeContainer .s3dAdderNodeHeader")[0];
			$(firstRootItem).children(".s3dAdderNodeTitle").click();
			$(firstRootItem).children(".s3dAdderNode").click();
		}
	}

	//构造html
	this.getAdderHtml = function(){
		return "<div class='s3dAdderContainer'>"
			+ "<div class='s3dAdderCategoryTreeContainer'></div>"
			+ "<div class='s3dAdderBottomContainer'>"
			+ "<div class='s3dAdderUploadContainer'>"
			+ "<input class='s3dAdderCategoryUploadFileInput' style='display:none;' type='file' multiple name='modelInput' accept='.fbx, image/png, image/jpeg' />"
			+ "<div class='s3dAdderBottomBtn s3dAdderUploadBtn' name='uploadComponentLocal'>本地模型...</div>"
			+ "</div>"
			+ "<div class='s3dAdderBottomBtn s3dAdderCancelBtn' name='cancel'>取&nbsp;&nbsp;消</div>"
			+ "</div>"
			+ "<div class='s3dAdderComponentCenterContainer'>"
			+ "<div class='s3dAdderComponentListHeader'><input type='text' class='s3dAdderComponentListQueryInput' placeholder='请输入关键词' /></div>"
			+ "<div class='s3dAdderComponentListContainer'>"
			+ "<div class='s3dAdderComponentListInnerContainer'></div>"
			+ "<div class='s3dAdderComponentListMoreContainer'><div class='s3dAdderComponentMoreBtn'>更多...</div></div>"
			+ "<div class='s3dAdderComponentListNoMoreContainer'>- 无更多物体 -</div>"
			+ "</div>"
			+ "</div>"
			+ "</div>";
	}

	this.updateComponentList = function (){
		let container = $("#" + thatS3dAdder.containerId);
		let categoryCode = $(container).find(".s3dAdderNodeHeaderActive").parent().attr("categoryCode");
		if(categoryCode != null) {
			thatS3dAdder.initComponentList({
				categoryCode: categoryCode,
				keyword: "",
				pageIndex: 0
			});
		}
	}
	
	//显示结构树
	this.showCategoryTree = function(categoryJArray){
		//构造html
		let categoryTreeHtml = thatS3dAdder.getCategoryTreeHtml(categoryJArray);
		let container = $("#" + thatS3dAdder.containerId);
		$(container).find(".s3dAdderCategoryTreeContainer").html(categoryTreeHtml);

		//点击节点名称事件
		$(container).find(".s3dAdderNodeContainer .s3dAdderNodeHeader .s3dAdderNodeTitle").click(function(){
			let categoryCode = $(this).parent().parent().attr("categoryCode");
			thatS3dAdder.initComponentList({
				categoryCode: categoryCode,
				keyword: "",
				pageIndex: 0
			});
			let container = $("#" + thatS3dAdder.containerId);
			$(container).find(".s3dAdderNodeHeader").removeClass("s3dAdderNodeHeaderActive");
			$(container).find(".s3dAdderNodeContainer[categoryCode='" + categoryCode + "']").children(".s3dAdderNodeHeader").addClass("s3dAdderNodeHeaderActive");
		});

		//点击折叠或展开
		$(container).find(".s3dAdderNodeContainer .s3dAdderNodeHeader .s3dAdderNode").click(function(){
			if($(this).hasClass("s3dAdderNodeExpand")){
				$(this).removeClass("s3dAdderNodeExpand");
				$(this).addClass("s3dAdderNodeCollapse");
				$(this).parent().parent().children(".s3dAdderChildrenContainer").addClass("s3dAdderHidden");
			}
			else{
				$(this).removeClass("s3dAdderNodeCollapse");
				$(this).addClass("s3dAdderNodeExpand");
				$(this).parent().parent().children(".s3dAdderChildrenContainer").removeClass("s3dAdderHidden");
			}
		});


		$(container).find(".s3dAdderBottomBtn").click(function (){
			let btnName = $(this).attr("name");

			let processed = thatS3dAdder.onButtonClick(btnName);

			switch (btnName){
				case "uploadComponentLocal":{
					thatS3dAdder.popComponentLocalSelectWindow();
					break;
				}
				case "cancel":{
					thatS3dAdder.hideContainer();
					thatS3dAdder.manager.viewer.changeStatus({
						status: s3dUiStatus.normalView
					});
					break;
				}
				default:{
					break;
				}
			}
		});

		$(container).find(".s3dAdderCategoryUploadFileInput").change(function (){
			let container = $("#" + thatS3dAdder.containerId);
			let input = $(container).find(".s3dAdderCategoryUploadFileInput")[0];

			let categoryCode = (container).find(".s3dAdderNodeHeaderActive").parent().attr("categoryCode");

			if (input.files) {
				thatS3dAdder.onUploadComponent({
					files: input.files,
					comTypeCode: categoryCode
				});
			}
		});
	}

	this.hideContainer = function(p){
		thatS3dAdder.adderWindow.hide();
	}

	this.onUploadComponent = function (p){
		let funcParameter = {
			files: p.files,
			comTypeCode: p.comTypeCode,
			processed: false
		};
		thatS3dAdder.doEventFunction("onUploadComponent",  funcParameter);
		if(!funcParameter.processed){
			msgBox.alert({info: "尚未实现上传模型的服务器端方法."});
		}
	}

	this.onRemoveComponent = function (p){
		let funcParameter = {
			componentCode: p.componentCode,
			versionNum: p.versionNum,
			processed: false
		};
		thatS3dAdder.doEventFunction("onRemoveComponent",  funcParameter);
		if(!funcParameter.processed){
			msgBox.alert({info: "尚未实现删除模型的服务器端方法."});
		}
	}

	this.onButtonClick = function (buttonName){
		let p = {
			buttonName: buttonName,
			processed: false
		};
		thatS3dAdder.doEventFunction("onButtonClick", p);
		return p.processed;
	}

	this.popComponentLocalSelectWindow = function (){
		$("#" + thatS3dAdder.containerId).find(".s3dAdderUploadContainer .s3dAdderCategoryUploadFileInput").click();
	}

	//获取构件列表
	this.initComponentList = function(p){
		let componentsInfo = thatS3dAdder.manager.componentLibrary.getComponents(p.categoryCode, p.keyword, p.pageIndex, thatS3dAdder.onePageItemCount);
		thatS3dAdder.showComponentList(componentsInfo);
	}

	//是否包含子节点
	this.checkHasChildren = function(categoryId){
		return $("#" + thatS3dAdder.containerId).find(".s3dAdderNodeContainer[categoryId='" + categoryId + "']").attr("isLeaf") === "false";
	}

	//获取server category树html
	this.getCategoryTreeHtml = function(nodeJArray){
		let treeHtml = "";
		for(let i = 0; i < nodeJArray.length; i++){
			let nodeJson = nodeJArray[i];
			let childNodeHtml = thatS3dAdder.getCategoryNodeHtml(nodeJson, 1);
			treeHtml += childNodeHtml;
		}
		return treeHtml;
	}

	//获取node节点html
	this.getCategoryNodeHtml = function(nodeJson, levelIndex){
		let hasChildren = nodeJson.children !== null && nodeJson.children !== undefined && nodeJson.children.length > 0;
		let expanded = levelIndex === 0;
		let nodeHtml = "";
		let nodeText = decodeURIComponent(nodeJson.name);
		nodeHtml += "<div class=\"s3dAdderNodeContainer\" categoryCode=\"" + nodeJson.code + "\" isLeaf=\"" + (hasChildren ? "false" : "true") + "\">";
		nodeHtml += "<div class=\"s3dAdderNodeHeader\">";
		nodeHtml += (hasChildren ? ("<div class=\"s3dAdderNode " + (expanded ? "s3dAdderNodeExpand" : "s3dAdderNodeCollapse") + "\"></div>") : "");
		nodeHtml += ("<div class=\"s3dAdderNodeTitle\">" + cmnPcr.htmlEncode(nodeText) + "</div>");
		nodeHtml += "</div>";
		if(hasChildren){
			nodeHtml += ("<div class=\"s3dAdderChildrenContainer" + (expanded ? "" : " s3dAdderHidden") + "\">");
			for(let i = 0; i < nodeJson.children.length; i++){
				let childNodeJson = nodeJson.children[i];
				let childNodeNodeHtml = thatS3dAdder.getCategoryNodeHtml(childNodeJson, levelIndex + 1);
				nodeHtml += childNodeNodeHtml;
			}
			nodeHtml += "</div>";
		}
		nodeHtml += "</div>";
		return nodeHtml;
	}

	//构件列表
	this.showComponentList = function(componentsInfo){
		let container = $("#" + thatS3dAdder.containerId).find(".s3dAdderContainer");
		if(componentsInfo.pageIndex === 0){
			//清除列表里的内容
			$(container).find(".s3dAdderComponentListInnerContainer").empty();
		}
		let componentListHtml = thatS3dAdder.getComponentListHtml(componentsInfo.components);
		$(container).find(".s3dAdderComponentListInnerContainer").append(componentListHtml);
        //$(container).find(".s3dAdderComponentListInnerContainer")[0].scrollTop =  0;

		$(container).find(".s3dAdderComponentMoreBtn").attr("nextPageIndex", componentsInfo.pageIndex + 1);

		if(componentsInfo.components.length < thatS3dAdder.onePageItemCount){
			//没有更多记录了
			$(container).find(".s3dAdderComponentListNoMoreContainer").removeClass("s3dAdderHidden");
			$(container).find(".s3dAdderComponentListMoreContainer").addClass("s3dAdderHidden");
		}
		else{
			$(container).find(".s3dAdderComponentListNoMoreContainer").addClass("s3dAdderHidden");
			$(container).find(".s3dAdderComponentListMoreContainer").removeClass("s3dAdderHidden");
		}

		for(let i = 0; i < componentsInfo.components.length; i++) {
			let componentInfo = componentsInfo.components[i];
			$(container).find(".s3dAdderComponentContainer[componentCode='" + componentInfo.code + "'] .s3dAdderComponentDelete").click(function (ev) {
				ev.preventDefault();
				let componentCode = $(this).parent().parent().attr("componentCode");
				let versionNum = $(this).parent().parent().attr("versionNum");
				if (msgBox.confirm({info: "确定删除吗?"})) {
					thatS3dAdder.onRemoveComponent({
						componentCode: componentCode,
						versionNum: versionNum
					});
					$(this).parent().parent().remove();
				}
				return false;
			});

			$(container).find(".s3dAdderComponentContainer[componentCode='" + componentInfo.code + "']").click(function () {
				let componentName = $(this).attr("componentName");
				let componentId = $(this).attr("componentId");
				let componentCode = $(this).attr("componentCode");
				let versionNum = $(this).attr("versionNum");
				let isServer = $(this).attr("isServer") === "true";
				let isLocal = $(this).attr("isLocal") === "true";
				let isInternal = $(this).attr("isInternal") === "true";
				thatS3dAdder.addComponent({
					componentName: componentName,
					componentId: componentId,
					componentCode: componentCode,
					versionNum: versionNum,
					isServer: isServer,
					isLocal: isLocal,
					isInternal: isInternal
				});
				thatS3dAdder.hide();
				/*
                thatS3dAdder.waitAddComponent({
                    componentName: componentName,
                    componentId: componentId,
                    componentCode: componentCode,
                    versionNum: versionNum,
                    isServer: isServer,
                    isLocal: isLocal,
                    isInternal: isInternal
                });
                 */
			});
		}
	}

	//插入构件到当前组
	this.addComponent = function (p){
		thatS3dAdder.manager.viewer.cancelSelectObject3Ds();
		let unitJson = null;

		if(p.isServer){
			unitJson = {
				position: [0, 0, 0],
				rotation: [0, 0, 0],
				scale: [1, 1, 1],
				castShadow: p.castShadow == null ? true : p.castShadow,
				receiveShadow: p.receiveShadow == null ? true : p.receiveShadow,
				name: p.componentName,
				code: p.componentCode,
				versionNum: p.versionNum,
				isOnGround: true,
				needSelectAfterAdd: true,
				parentId: thatS3dAdder.groupId,
				parameters: {},
				isServer: true,
				isInternal: false,
				isLocal: false,
				type: s3dElement3DType.unit
			};
		}
		else {
			let componentInfo = thatS3dAdder.manager.localObjectCreator.getComponentInfo(p.componentCode, p.versionNum);
			let parameters = {};
			for(let paramName in componentInfo.parameters){
				let param = componentInfo.parameters[paramName];
				parameters[paramName] = {
					value: param.defaultValue,
					isGeo: param.isGeo
				}
			}

			unitJson = {
				position: [0, 0, 0],
				rotation: [0, 0, 0],
				scale: componentInfo.scale == null ? [1, 1, 1] : [componentInfo.scale.x, componentInfo.scale.y, componentInfo.scale.z],
				castShadow: componentInfo.castShadow == null ? true : componentInfo.castShadow,
				receiveShadow: componentInfo.receiveShadow == null ? true : componentInfo.receiveShadow,
				name: p.componentName,
				code: p.componentCode,
				versionNum: p.versionNum,
				isOnGround: true,
				needSelectAfterAdd: true,
				parentId: thatS3dAdder.groupId,
				parameters: parameters,
				isServer: false,
				isInternal: false,
				isLocal: true,
				type: s3dElement3DType.unit
			};
		}

		thatS3dAdder.doEventFunction("beforeAddComponent", {
			unitJson: unitJson
		});

		if(p.isServer){
			thatS3dAdder.manager.viewer.addNewServerObject(unitJson);
		}
		else {
			thatS3dAdder.manager.viewer.addNewLocalObject(unitJson);
		}
	}

	//等待添加新构件到模型中
	this.waitAddComponent = function(p){
		let container = $("#" + thatS3dAdder.containerId);
		if(p == null){
			$(container).find(".s3dAdderComponentContainer").removeClass("s3dAdderComponentContainerActive");
		}
		else{
			$(container).find(".s3dAdderComponentContainer").removeClass("s3dAdderComponentContainerActive");
			$(container).find(".s3dAdderComponentContainer[componentCode='" + p.componentCode + "']").addClass("s3dAdderComponentContainerActive");
			if(p.isServer) {
				thatS3dAdder.manager.serverObjectCreator.getComponentJsons([{
					code: p.componentCode,
					versionNum: p.versionNum
				}], thatS3dAdder.changeToAddStatus);
			}
			if(p.isLocal) {
				thatS3dAdder.manager.localObjectCreator.getComponentJsons([{
					code: p.componentCode,
					versionNum: p.versionNum
				}], thatS3dAdder.changeToAddStatus);
			}
		}
	}

	//取消等待添加新构件到模型中
	this.cancelWaitAddComponent = function(){
		$("#" + thatS3dAdder.containerId).find(".s3dAdderComponentContainer").removeClass("s3dAdderComponentContainerActive");
	}

	this.changeToAddStatus = function(ps){
		let p = ps[0];
		thatS3dAdder.manager.viewer.changeStatus({
			status: s3dUiStatus.add,
			statusData: {
				componentName: p.name,
				componentId: p.id,
				componentCode: p.code,
				versionNum: p.versionNum,
				componentJson: p.json,
				isServer: p.isServer,
				isLocal: p.isLocal
			}
		});
	}
	
	//获取构件列表html
	this.getComponentListHtml = function(componentJArray){
		let html = "";
		for(let i = 0; i < componentJArray.length; i++){
			let componentJson = componentJArray[i];
			html += thatS3dAdder.getComponentItemHtml(componentJson);
		}
		return html;
	}
	
	//获取构件条目html
	this.getComponentItemHtml = function(componentJson){
		let componentName = decodeURIComponent(componentJson.name); 
		let componentCode = decodeURIComponent(componentJson.code);
		let versionNum = componentJson.versionNum;
		let imgUrl = null;
		let isServer = componentJson.isServer;
		let isLocal = componentJson.isLocal;
		if(isServer) {
			imgUrl = componentJson.imgId == null ? null : (thatS3dAdder.manager.service.url + "accessory/getImage?id=" + componentJson.imgId);
		}
		if(isLocal){
			imgUrl =componentJson.imgUrl == null ? null : (thatS3dAdder.manager.layout.resourcesUserFolder + "files/" + componentJson.imgUrl);
		}
		let tag = "名称: " + componentName + "\r\n编码: " + componentCode + "\r\n版本: " + versionNum;
		return "<div class=\"s3dAdderComponentContainer\" isServer=\"" + (isServer ? "true" : "false") + "\"  isLocal=\"" + (isLocal ? "true" : "false") + "\" title=\"" + tag + "\"componentName=\"" + componentName + "\" componentCode=\"" + componentCode + "\" versionNum=\"" + versionNum + "\">"
			+ "<div class=\"s3dAdderComponentInnerContainer\">"
			+ "<div class=\"s3dAdderComponentImageContainer\">"
			+ (imgUrl == null ? ("<div class=\"s3dAdderComponentImageText\">无缩略图</div>") : ("<img class=\"s3dAdderComponentImage\" src=\"" + imgUrl + "\" />"))
			+ "</div>"
			+ (componentJson.isPublic ? "" : ("<div class=\"s3dAdderComponentDelete\">&#10005;</div>"))
			+ "<div class=\"s3dAdderComponentHeader\">"
			+ "<div class=\"s3dAdderComponentHeaderBackground\">&nbsp;</div>"
			+ ("<div class=\"s3dAdderComponentTitle\">" + cmnPcr.htmlEncode(componentName) + "</div>")
			+ "</div>"
			+ "</div>"
			+ "</div>";
	}
}
export default S3dAdder