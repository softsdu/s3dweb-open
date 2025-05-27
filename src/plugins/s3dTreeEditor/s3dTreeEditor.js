import {
	cmnPcr,
	msgBox,
	PopupContainer,
	s3dElement3DType,
	s3dOperateType,
	s3dTransformMode
} from "../../commonjs/common/common.js";
import "./s3dTreeEditor.css"

//S3dWeb 模型结构树
let S3dTreeEditor = function (){
	//当前对象
	const thatS3dTreeEditor = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null; 

	//title
	this.title = null;
	
	//所有节点数据（树形）
	this.nodeJArray = null;

	//节点ID与json
	this.id2NodeJsonMap = null;

	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dTreeEditor.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dTreeEditor.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dTreeEditor.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}
	
	//获取节点json
	this.getNodeJson = function(nodeId){
		return thatS3dTreeEditor.id2NodeJsonMap[nodeId];
	}
	 
	//初始化
	this.init = function(p){
		thatS3dTreeEditor.containerId = p.containerId;
		thatS3dTreeEditor.manager = p.manager; 
		thatS3dTreeEditor.title = p.config.title;

		thatS3dTreeEditor.nodeJArray = thatS3dTreeEditor.initGroupNodeJArray(p.manager.s3dObject);
		
		thatS3dTreeEditor.id2NodeJsonMap = {};
		thatS3dTreeEditor.initId2NodeJsonMap(thatS3dTreeEditor.nodeJArray, thatS3dTreeEditor.id2NodeJsonMap);

		if(p.config.onNodeClick != null){
			thatS3dTreeEditor.addEventFunction("onNodeClick", p.config.onNodeClick); 
		} 
		if(p.config.onNodeCheckStatusChange != null){
			thatS3dTreeEditor.addEventFunction("onNodeCheckStatusChange", p.config.onNodeCheckStatusChange); 
		}

		thatS3dTreeEditor.showTree(p.config.title, thatS3dTreeEditor.nodeJArray, thatS3dTreeEditor.id2NodeJsonMap);

		let container = $("#" + thatS3dTreeEditor.containerId);
		$(container).find(".s3dTreeEditorCloseBtn").click(function(){
			thatS3dTreeEditor.hide();
		});
		
		$(container).find(".s3dTreeEditorAddRootGroupBtn").click(function(){
			thatS3dTreeEditor.addGroup(null);
		});
		
		$(container).find(".s3dTreeEditorMultiNodeChangeParentBtn").click(function(){
			let nodeIds = thatS3dTreeEditor.manager.viewer.getSelectedObject3DIds();
			thatS3dTreeEditor.changeParentGroup(nodeIds);
		});

		$(container).find(".s3dTreeEditorContainer").click(function(){
			return false;
		});

		thatS3dTreeEditor.show();
	}

	//初始化NodeJArray
	this.initGroupNodeJArray = function(s3dObject) {
		let nodeJArray = [];
		thatS3dTreeEditor.initSubGroupNodesJArray(nodeJArray, null, s3dObject.groups, s3dObject.groupMap, s3dObject.objectMap)
		return nodeJArray;
	}

	this.initSubGroupNodesJArray = function (nodeJArray, parentId, groupIds, groupMap, objectMap){
		if(groupIds != null){
		for(let i = 0; i < groupIds.length; i++) {
			let groupId = groupIds[i];
			let groupJson = groupMap[groupId];
			let groupNodeJson = {
				id: groupJson.id,
				name: groupJson.name,
				parentId: parentId,
				isDefault: groupJson.isDefault,
				position: groupJson.position,
				rotation: groupJson.rotation,
				scale: groupJson.scale,
				children: []
			};
			if(groupJson.groups != null) {
				for (let j = 0; j < groupJson.groups.length; j++) {
					let subGroupId = groupJson.groups[j];
					let subGroupJson = groupMap[subGroupId];
					groupNodeJson.children.push({
						id: subGroupId,
						name: subGroupJson.name,
						isGroup: true
					});
				}
			}
			if(groupJson.objects != null) {
				for (let j = 0; j < groupJson.objects.length; j++) {
					let oId = groupJson.objects[j];
					let oJson = objectMap[oId];
					groupNodeJson.children.push({
						id: oId,
						name: oJson.name,
						isGroup: false
					});
				}
			}
			nodeJArray.push(groupNodeJson);

			thatS3dTreeEditor.initSubGroupNodesJArray(nodeJArray, groupId, groupJson.groups, groupMap, objectMap);
		}
		}
	}

	//静默刷新树
	this.refreshTreeInSilence = function(treeJson){
		thatS3dTreeEditor.id2NodeJsonMap = {};
		thatS3dTreeEditor.initId2NodeJsonMap(treeJson.children, thatS3dTreeEditor.id2NodeJsonMap);
		thatS3dTreeEditor.showTree(thatS3dTreeEditor.title, treeJson.children, thatS3dTreeEditor.id2NodeJsonMap);
	}
	
	//隐藏
	this.hide = function(){
		$("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorContainer").css({"display": "none"});
	}
	
	//隐藏
	this.show = function(){
		$("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorContainer").css({"display": "block"});
	}

	this.highlightNodes = function(nodeJArray){
		let container = $("#" + thatS3dTreeEditor.containerId);
		$(container).find(".s3dTreeEditorNodeHeader").removeClass("s3dTreeEditorNodeHeaderActive");
		for(let i = 0; i < nodeJArray.length; i++){
			let nodeJson = nodeJArray[i];
			let nodeContainer = $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeJson.id + "']");
			$(nodeContainer).children(".s3dTreeEditorNodeHeader").addClass("s3dTreeEditorNodeHeaderActive");

			//展开上级（递归）
			let childContainer = $(nodeContainer).parent();
			while($(childContainer).hasClass("s3dTreeEditorChildrenContainer")) {
				let groupNode = $(childContainer).parent();
				let nodeId = $(groupNode).attr("nodeId");
				thatS3dTreeEditor.expandGroupNode(nodeId);
				childContainer  = $(childContainer).parent().parent();
			}
		}
	}

	this.nodeTitleClick = function(nodeId){
		let nodeJson = thatS3dTreeEditor.id2NodeJsonMap[nodeId];
		thatS3dTreeEditor.doEventFunction("onNodeClick", { 
			nodeJson: nodeJson
		});
		let container = $("#" + thatS3dTreeEditor.containerId);
		$(container).find(".s3dTreeEditorNodeHeader").removeClass("s3dTreeEditorNodeHeaderActive");
		$(container).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']").children(".s3dTreeEditorNodeHeader").addClass("s3dTreeEditorNodeHeaderActive");
	}

	this.changeNodeExpandStatus = function(nodeId){
		let expandBtn = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']").children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNode")[0];
		if($(expandBtn).hasClass("s3dTreeEditorNodeExpand")){
			thatS3dTreeEditor.collapseGroupNode(nodeId);
		}
		else{
			thatS3dTreeEditor.expandGroupNode(nodeId);
		}
	}

	this.collapseGroupNode = function (nodeId){
		let expandBtn = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']").children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNode")[0];
		$(expandBtn).removeClass("s3dTreeEditorNodeExpand");
		$(expandBtn).addClass("s3dTreeEditorNodeCollapse");
		$(expandBtn).parent().parent().children(".s3dTreeEditorChildrenContainer").addClass("s3dTreeEditorHidden");
	}

	this.expandGroupNode = function (nodeId){
		let expandBtn = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']").children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNode")[0];
		$(expandBtn).removeClass("s3dTreeEditorNodeCollapse");
		$(expandBtn).addClass("s3dTreeEditorNodeExpand");
		$(expandBtn).parent().parent().children(".s3dTreeEditorChildrenContainer").removeClass("s3dTreeEditorHidden");
	}

	this.checkNode = function(nodeId){
		let nodeItem = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']")[0]; 
		let checkInput = $(nodeItem).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeCheckbox")[0];
		let changedNodeIds = [];
		let checked = $(checkInput).hasClass("s3dTreeEditorNodeCheckboxNone") || $(checkInput).hasClass("s3dTreeEditorNodeCheckboxPart");  
		
		//改变选中状态，且更新所有children
		thatS3dTreeEditor.setNodeCheckStatus(nodeItem, checked, changedNodeIds);
		
		//更新所有的父级节点
		thatS3dTreeEditor.refreshAllParentCheckStatus(nodeItem);
		
		//出发选中状态改变事件
		thatS3dTreeEditor.doEventFunction("onNodeCheckStatusChange", {
			checked: checked,
			changedNodeIds: changedNodeIds
		});
	}
	
	//显示结构树
	this.showTree = function(title, nodeJArray, id2NodeJsonMap){
		let container = $("#" + thatS3dTreeEditor.containerId);

		//toolbar
		let toolbarContainer = $(container).find(".s3dLayoutBlockToolbar[name='treeEditor']");
		let toolbarHtml = thatS3dTreeEditor.getTreeToolbarHtml();
		$(toolbarContainer).append(toolbarHtml);

		//构造html
		let blockContainer = $(container).find(".s3dLayoutBlock[name='treeEditor']");
		$(blockContainer).find(".s3dTreeEditorContainer").remove();
		let treeHtml = thatS3dTreeEditor.getTreeContainerHtml(nodeJArray, id2NodeJsonMap);
		$(blockContainer).append(treeHtml);
		for(let nodeId in id2NodeJsonMap){
			thatS3dTreeEditor.bindNodeEvent(nodeId);
		}

		//快捷键
		$(blockContainer).find(".s3dTreeEditorContainer").mousedown(function(){
			$(this).focus();	
		});
		$(blockContainer).find(".s3dTreeEditorContainer").keydown(thatS3dTreeEditor.onKeyDown);
		
	}
	
	//快捷键
    this.onKeyDown = function(ev) {			
		switch(ev.keyCode){				
			case 27: // esc 取消选择 
			case 70: //f 居中
			case 87: //w
			case 69: //e
			case 82: //r
			case 46:{ //del 删除
				thatS3dTreeEditor.manager.viewer.onKeyDown(ev); 
				break;
			}
			default:
				break;
		}
	}

	this.addObject = function(parentNodeId){
		thatS3dTreeEditor.manager.adder.show({
			groupId: parentNodeId
		});
	}

	this.addLight = function(parentNodeId){
		thatS3dTreeEditor.manager.internalObjectCreator.showLightSelector({
			groupId: parentNodeId
		});
	}

	this.addTag = function(parentNodeId){
		thatS3dTreeEditor.manager.internalObjectCreator.showTagSelector({
			groupId: parentNodeId
		});
	}

	this.addOrbit = function(parentNodeId){
		thatS3dTreeEditor.manager.internalObjectCreator.showOrbitSelector({
			groupId: parentNodeId
		});
	}

	this.addParticle = function(parentNodeId){
		thatS3dTreeEditor.manager.internalObjectCreator.showParticleSelector({
			groupId: parentNodeId
		});
	}

	this.addCamera = function(parentNodeId){
		thatS3dTreeEditor.manager.internalObjectCreator.showCameraSelector({
			groupId: parentNodeId
		});
	}

	this.addGroup = function(parentNodeId){
		let winContainerId = cmnPcr.getRandomValue();
		let nameWinHtml = thatS3dTreeEditor.getNameWinHtml(winContainerId, "新建空物体");
		$("#" + thatS3dTreeEditor.containerId).append(nameWinHtml);
		let winContainer = $("#" + winContainerId)[0];

		$(winContainer).find(".s3dTreeEditorNameInput").focus();
		$(winContainer).find(".s3dTreeEditorNameInput").keydown(function (ev){
			switch(ev.keyCode){
				case 13:{
					let newGroupName = $(this).val().trim();
					if(newGroupName.length === 0){
						msgBox.alert({info: "请输入名称"});
					}
					else{
						let groupInfo = {
							id: cmnPcr.createGuid(),
							name: newGroupName,
							parentId: parentNodeId,
							isGroup: true,
							otherInfo: {
								needSelectAfterAdd: true
							}
						};
						thatS3dTreeEditor.manager.viewer.addNewGroupObject(groupInfo);

						$(winContainer).remove();
					}
					break;
				}
			}
		});

		$(winContainer).find(".s3dTreeEditorNameCloseBtn").click(function(){
			let winContainer = $("#" + winContainerId)[0];
			$(winContainer).remove();
		});
		$(winContainer).find(".s3dTreeEditorNameButton").click(function(){
			let winContainer = $("#" + winContainerId)[0];
			let newGroupName = $(winContainer).find(".s3dTreeEditorNameInput").val().trim();
			if(newGroupName.length === 0){
				msgBox.alert({info: "请输入名称"});
			}
			else{
				let groupInfo = {
					id: cmnPcr.createGuid(),
					name: newGroupName,
					parentId: parentNodeId,
					isGroup: true,
					otherInfo: {
						needSelectAfterAdd: true
					}
				};
				thatS3dTreeEditor.manager.viewer.addNewGroupObject(groupInfo);

				$(winContainer).remove();
			}
		});
	}

	this.changeParentGroup = function(nodeIds){
		let winContainerId = cmnPcr.getRandomValue();

		let changeParentPopContainer = new PopupContainer({
			width: 400,
			height: 500,
			top: 50,
			canClose: true,
			title: "选择分组",
			containerId: thatS3dTreeEditor.containerId
		});
		changeParentPopContainer.show();
		thatS3dTreeEditor.changeParentPopContainer = changeParentPopContainer;

		let changeParentWinHtml = thatS3dTreeEditor.getChangeParentWinHtml(winContainerId, nodeIds);
		let winContainer = $("#" + thatS3dTreeEditor.changeParentPopContainer.contentId)[0];
		$(winContainer).append(changeParentWinHtml);
		$(winContainer).find(".s3dTreeEditorChangeParentCloseBtn").click(function(){
			let winContainer = $("#" + winContainerId)[0];
			$(winContainer).remove();
		});
		$(winContainer).find(".s3dTreeEditorChangeParentNodeHeader").click(function(){
			let nodeId = $(this).parent().attr("nodeId");
			let winContainer = $("#" + winContainerId)[0];
			$(winContainer).find(".s3dTreeEditorChangeParentNodeHeader").removeClass("s3dTreeEditorChangeParentNodeHeaderActive");
			$(winContainer).find(".s3dTreeEditorChangeParentNodeItem[nodeId='" + nodeId + "']").children(".s3dTreeEditorChangeParentNodeHeader").addClass("s3dTreeEditorChangeParentNodeHeaderActive");
		});

		$(winContainer).find(".s3dTreeEditorChangeParentButtonOk").click(function(){
			let winContainer = $("#" + winContainerId)[0];
			let activeHeaders = $(winContainer).find(".s3dTreeEditorChangeParentNodeHeaderActive");
			if(activeHeaders.length === 0){
				msgBox.alert({info: "请选择目标分组"});
			}
			else {
				let targetNodeId = $(activeHeaders).parent().attr("nodeId");
				thatS3dTreeEditor.manager.viewer.changeParentGroup(nodeIds, targetNodeId);
				thatS3dTreeEditor.changeParentPopContainer.close();
			}
		});

		$(winContainer).find(".s3dTreeEditorChangeParentButtonRoot").click(function(){
			thatS3dTreeEditor.manager.viewer.changeParentGroup(nodeIds, null);
			thatS3dTreeEditor.changeParentPopContainer.close();
		});
	}

	this.changeNodeParentInSilence = function(nodeId, targetNodeId){
		let container = $("#" + thatS3dTreeEditor.containerId);
		let oldParentNodeId = thatS3dTreeEditor.getGroupId(nodeId);
		if (targetNodeId == null) {
			//根节点
			let nodeContainer = $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']")[0];
			let targetChildrenContainer = $(container).find(".s3dTreeEditorInnerContainer")[0];
			$(nodeContainer).appendTo(targetChildrenContainer);
		} else {
			let nodeContainer = $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']")[0];
			let targetChildrenContainer = $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + targetNodeId + "']").children(".s3dTreeEditorChildrenContainer")[0];
			$(nodeContainer).appendTo(targetChildrenContainer);
		}
		thatS3dTreeEditor.refreshGroupObjectCount(oldParentNodeId);

		thatS3dTreeEditor.sortChildNodes(targetNodeId);
		thatS3dTreeEditor.refreshGroupObjectCount(targetNodeId);
	}

	this.sortSameGroupNodes = function(nodeId){
		let childrenContainer =  $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']").parent()[0];
		thatS3dTreeEditor.addToSortedChildrenContainer(childrenContainer);
	}

	this.sortChildNodes = function(parentNodeId){
		let container = $("#" + thatS3dTreeEditor.containerId);
		let childrenContainer = parentNodeId == null ? $(container).find(".s3dTreeEditorInnerContainer")[0] :  $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + parentNodeId + "']").children(".s3dTreeEditorChildrenContainer")[0];
		thatS3dTreeEditor.addToSortedChildrenContainer(childrenContainer);
	}

	this.addToSortedChildrenContainer = function(childrenContainer){
		let newContainerId = cmnPcr.getRandomValue();		let containerClass = $(childrenContainer).attr("class");
		let newContainerHtml = "<div id=\"" + newContainerId + "\" class=\"" + containerClass + "\"></div>";
		
		$(childrenContainer).parent().append(newContainerHtml);
		let newContainer = $("#" + thatS3dTreeEditor.containerId).find("#" + newContainerId);

		let childContainers = $(childrenContainer).children(".s3dTreeEditorNodeContainer");
		let sortedChildContainers = [];
		for(let i = 0; i < childContainers.length; i++){
			let added = false;
			let childContainer = childContainers[i];
			let nodeName = $(childContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text();
			let newSortedChildContainers = [];
			for(let j = 0; j < sortedChildContainers.length; j++){
				let sortedChildContainer = sortedChildContainers[j];
				let sortedNodeName =  $(sortedChildContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text();
				if(!added && sortedNodeName.localeCompare(nodeName) > 0){
					newSortedChildContainers.push(childContainer);
					added = true;
				}
				newSortedChildContainers.push(sortedChildContainer);
			}
			if(!added){
				newSortedChildContainers.push(childContainer);
			}
			sortedChildContainers = newSortedChildContainers;
		}
		$(newContainer).append(sortedChildContainers);
		$(childrenContainer).remove();
	}

	this.addNodeInSilence = function (nodeJson){
		thatS3dTreeEditor.id2NodeJsonMap[nodeJson.id] = nodeJson;
		if(nodeJson.parentId == null && nodeJson.type === s3dElement3DType.group){
			thatS3dTreeEditor.nodeJArray.push(nodeJson);
		}
		else{
			let parentJson = thatS3dTreeEditor.id2NodeJsonMap[nodeJson.parentId];
			parentJson.children.push(nodeJson.id);
		}

		switch(nodeJson.type){
			case s3dElement3DType.group:{
				this.addGroupNodeInSilence(nodeJson, thatS3dTreeEditor.id2NodeJsonMap);
				break;
			}
			default:{
				this.addLeafNodeInSilence(nodeJson, thatS3dTreeEditor.id2NodeJsonMap);
				break;
			}
		}
	}

	this.addLeafNodeInSilence = function(nodeJson, id2NodeJsonMap){
		let nodeHtml = thatS3dTreeEditor.getNodeHtml(nodeJson, false, false, id2NodeJsonMap);
		if(nodeJson.parentId == null){
			$("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorInnerContainer").append(nodeHtml);
		}
		else{
			$("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeJson.parentId + "']").children(".s3dTreeEditorChildrenContainer").append(nodeHtml);
		}
		thatS3dTreeEditor.id2NodeJsonMap[nodeJson.id] = nodeJson;
		thatS3dTreeEditor.bindNodeEvent(nodeJson.id);
		thatS3dTreeEditor.sortSameGroupNodes(nodeJson.id);
		thatS3dTreeEditor.refreshGroupObjectCount(nodeJson.parentId);
	}

	this.addGroupNodeInSilence = function(nodeJson){
		let id2NodeJsonMap = thatS3dTreeEditor.id2NodeJsonMap;
		let nodeHtml = thatS3dTreeEditor.getNodeHtml(nodeJson, true, true, id2NodeJsonMap);
		if(nodeJson.parentId == null){
			$("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorInnerContainer").append(nodeHtml);
		}
		else{
			$("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeJson.parentId + "']").children(".s3dTreeEditorChildrenContainer").append(nodeHtml);
		}
		thatS3dTreeEditor.id2NodeJsonMap[nodeJson.id] = nodeJson;
		thatS3dTreeEditor.bindNodeEvent(nodeJson.id);
		thatS3dTreeEditor.sortSameGroupNodes(nodeJson.id);
		thatS3dTreeEditor.refreshGroupObjectCount(nodeJson.parentId);
	}

	this.addLeafNodesInSilence = function(nodeJsons, parentNodeId){
		let id2NodeJsonMap = thatS3dTreeEditor.id2NodeJsonMap;
		let nodeHtml = "";
		for(let i = 0; i < nodeJsons.length; i++) {
			let nodeJson = nodeJsons[i];
			nodeHtml += thatS3dTreeEditor.getNodeHtml(nodeJson, false, false, id2NodeJsonMap);
		}
		if(parentNodeId == null){
			$("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorInnerContainer").append(nodeHtml);
		}
		else{
			$("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + parentNodeId + "']").children(".s3dTreeEditorChildrenContainer").append(nodeHtml);
		}
		for(let i = 0; i < nodeJsons.length; i++) {
			let nodeJson = nodeJsons[i];
			thatS3dTreeEditor.id2NodeJsonMap[nodeJson.id] = nodeJson;
			thatS3dTreeEditor.bindNodeEvent(nodeJson.id);
		}
		thatS3dTreeEditor.sortChildNodes(parentNodeId);
		thatS3dTreeEditor.refreshGroupObjectCount(parentNodeId);
	}


	this.refreshGroupName = function (nodeId, groupName){
		let nodeContainer = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
		$(nodeContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text(groupName);
	}

	this.refreshGroupObjectCount = function (nodeId){
		let nodeContainer = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
		let objectCount = $(nodeContainer).children(".s3dTreeEditorChildrenContainer").children(".s3dTreeEditorNodeContainer").length;
		$(nodeContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeObjectCount").text("(" + objectCount + ")");
	}

	this.hasSameNameGroup = function(groupName, nodeId, parentNodeId){
		let sameGroupNodeContainers = [];
		if(nodeId != null){
			let nodeContainer = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
			sameGroupNodeContainers = $(nodeContainer).parent().children(".s3dTreeEditorNodeContainer");
		}
		else if(parentNodeId != null){
			let parentNodeContainer = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
			sameGroupNodeContainers = $(parentNodeContainer).children(".s3dTreeEditorChildrenContainer").children(".s3dTreeEditorNodeContainer");
		}
		else{
			sameGroupNodeContainers = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorInnerContainer").children(".s3dTreeEditorNodeContainer");
		}
		for(let i = 0; i < sameGroupNodeContainers.length; i++){
			let sameGroupNodeContainer = sameGroupNodeContainers[i];
			let nId = $(sameGroupNodeContainer).attr("nodeId");
			if(nId !== nodeId){
				let nName = $(sameGroupNodeContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text();
				if(nName === groupName){
					return true;
				}
			}
		}
		return false;
	}

	//获取name html(重命名分组、新建分组)
	this.getNameWinHtml = function(winContainerId, title){
		return "<div class=\"s3dTreeEditorNameContainer\" id=\"" + winContainerId + "\">"
			+ "<div class=\"s3dTreeEditorNameBackground\"></div>"
			+ "<div class=\"s3dTreeEditorNameOuterContainer\">"
			+ "<div class=\"s3dTreeEditorNameHeader\">"
			+ "<div class=\"s3dTreeEditorNameTitle\">" + title + "</div>"
			+ "<div class=\"s3dTreeEditorNameCloseBtn\">×</div>"
			+ "</div>"
			+ "<div class=\"s3dTreeEditorNameInnerContainer\">"
			+ "<div class=\"s3dTreeEditorNameItem\">"
			+ "<div class=\"s3dTreeEditorNameItemTitle\">名称</div>"
			+ "<div class=\"s3dTreeEditorNameItemValue\"><input type=\"text\" class=\"s3dTreeEditorNameInput\" /></div>"
			+ "</div>"
			+ "<div class=\"s3dTreeEditorNameItem\">"
			+ "<div class=\"s3dTreeEditorNameItemTitle\"></div>"
			+ "<div class=\"s3dTreeEditorNameItemValue\"><div class=\"s3dTreeEditorNameButton\">确 定</div></div>"
			+ "</div>"
			+ "</div>"
			+ "</div>"
			+ "</div>"
			+ "</div>";
	}

	//获取name html(重命名分组、新建分组)
	this.getChangeParentWinHtml = function(winContainerId, needChangeNodeIds){
		return  "<div class=\"s3dTreeEditorChangeParentContainer\" id=\"" + winContainerId + "\">"
			+ "<div class=\"s3dTreeEditorChangeParentInnerContainer\">"
			+ "<div class=\"s3dTreeEditorChangeParentTree\">"
			+ thatS3dTreeEditor.getChangeParentSubHtml(null, needChangeNodeIds)
			+ "</div>"
			+ "<div class=\"s3dTreeEditorChangeParentBottom\">"
			/*暂不启用
			+ "<div class=\"s3dTreeEditorChangeParentButton s3dTreeEditorChangeParentButtonRoot\">设为根节点</div>"
			 */
			+ "<div class=\"s3dTreeEditorChangeParentButton s3dTreeEditorChangeParentButtonOK\">确 定</div>"
			+ "</div>"
			+ "</div>"
			+ "</div>"
			+ "</div>";
	}

	this.getChangeParentSubHtml = function(parentNodeId, needChangeNodeIds){
		let container = $("#" + thatS3dTreeEditor.containerId);
		let html = "";
		let treeEditorNodeContainers = parentNodeId == null ? $(container).find(".s3dTreeEditorInnerContainer").children() : $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + parentNodeId + "']").children(".s3dTreeEditorChildrenContainer").children();
		for(let i = 0; i < treeEditorNodeContainers.length; i++){
			let treeEditorNodeContainer = treeEditorNodeContainers[i];
			let nodeId = $(treeEditorNodeContainer).attr("nodeId");
			if(!needChangeNodeIds.contains(nodeId)) {
				let isLeaf = $(treeEditorNodeContainer).attr("isLeaf") === "true";
				let childNodes = $(treeEditorNodeContainer).children(".s3dTreeEditorChildrenContainer").children();
				let nodeName = $(treeEditorNodeContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text();
				if (!isLeaf) {
					html += "<div class=\"s3dTreeEditorChangeParentNodeItem\" nodeId=\"" + nodeId + "\">";
					html += "<div class=\"s3dTreeEditorChangeParentNodeHeader\"><div class=\"s3dTreeEditorChangeParentNodeTitle\">" + cmnPcr.htmlEncode(nodeName) + "</div></div>";
					if (childNodes.length > 0) {
						html += "<div class=\"s3dTreeEditorChangeParentSubNodeContainer\">";
						html += thatS3dTreeEditor.getChangeParentSubHtml(nodeId, needChangeNodeIds);
						html += "</div>";
					}
					html += "</div>";
				}
			}
		}
		return html;
	}

	this.removeNode = function(nodeId){
		let container = $("#" + thatS3dTreeEditor.containerId);
		let nodeContainer = $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
		let nodeName = $(nodeContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text();
		if(msgBox.confirm({info: "确定删除 " + nodeName + " 吗?"})){
			thatS3dTreeEditor.manager.viewer.removeObjects([nodeId], false);
		}
	}

	this.removeNodeInSilence = function(nodeId){
		let container = $("#" + thatS3dTreeEditor.containerId);
		let nodeContainer = $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
		let parentNodeId = $(nodeContainer).parent().parent().attr("nodeId");
		let subNodeContainers = $(nodeContainer).find(".s3dTreeEditorNodeContainer");
		let nodeIdMap = {};
		for(let i = 0; i < subNodeContainers.length; i++){
			let subNodeId = $(subNodeContainers[i]).attr("nodeId");
			nodeIdMap[subNodeId] = true;
		}
		nodeIdMap[nodeId] = true;

		let nodeJArray = [];
		for(let i = 0; i < thatS3dTreeEditor.nodeJArray.length; i++){
			let nId = thatS3dTreeEditor.nodeJArray[i];
			if(!nodeIdMap[nId]){
				nodeJArray.push(nId);
			}
			delete thatS3dTreeEditor.id2NodeJsonMap[nId];
		}
		thatS3dTreeEditor.nodeJArray = nodeJArray;
		$(nodeContainer).remove();
		if(parentNodeId != null) {
			thatS3dTreeEditor.refreshGroupObjectCount(parentNodeId);
		}
	}

	this.getGroupId = function (nodeId){
		return $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']").parent().parent().attr("nodeId");
	}

	this.showMenu = function(nodeId, ev) {
		thatS3dTreeEditor.nodeTitleClick(nodeId);

		//初始化菜单项
		let object3D = thatS3dTreeEditor.manager.viewer.getObject3DById(nodeId);
		let info = object3D.userData.info;
		switch (info.type) {
			case s3dElement3DType.group: {
				thatS3dTreeEditor.showGroupMenu(info);
				break;
			}
			case s3dElement3DType.unit: {
				thatS3dTreeEditor.showUnitMenu(info);
				break;
			}
			case s3dElement3DType.light: {
				thatS3dTreeEditor.showLightMenu(info);
				break;
			}
			case s3dElement3DType.camera: {
				thatS3dTreeEditor.showCameraMenu(info);
				break;
			}
			case s3dElement3DType.particle: {
				thatS3dTreeEditor.showParticleMenu(info);
				break;
			}
			case s3dElement3DType.tag: {
				thatS3dTreeEditor.showTagMenu(info);
				break;
			}
		}

		//基本信息
		let container = $("#" + thatS3dTreeEditor.containerId);
		let menuContainer = $(container).find(".s3dTreeEditorMenuContainer");
		$(menuContainer).attr("nodeId", nodeId);

		//初始化event
		$(container).find(".s3dTreeEditorMenuOuterContainer").focus();
		$(container).find(".s3dTreeEditorMenuBackground").mousedown(function (){
			thatS3dTreeEditor.closeMenu();
		});
		$(container).find(".s3dTreeEditorMenuOuterContainer").keydown(function (ev){
			switch(ev.keyCode){
				case 27:{
					thatS3dTreeEditor.closeMenu();
					break;
				}
			}
		});
		$(container).find(".s3dTreeEditorMenuBackground").click(function (){
			thatS3dTreeEditor.closeMenu();
		});


		//设置菜单显示位置
		let menuContainerHeight = $(menuContainer).height();
		let menuContainerWidth = $(menuContainer).width();
		let containerHeight = $(container).height();
		let containerWidth = $(container).width();

		if(ev.clientY + menuContainerHeight < containerHeight){
			$(menuContainer).css({
				"top": ev.clientY + "px",
				"bottom": "auto"
			});
		}
		else{
			$(menuContainer).css({
				"top": "auto",
				"bottom": (containerHeight - ev.clientY) + "px"
			});
		}
		if(ev.clientX + menuContainerWidth < containerWidth){
			$(menuContainer).css({
				"left": ev.clientX + "px",
				"right": "auto"
			});
		}
		else{
			$(menuContainer).css({
				"left": "auto",
				"right": (containerWidth - ev.clientX) + "px",
			});
		}

	}

	this.closeMenu = function (){
		let container = $("#" + thatS3dTreeEditor.containerId);
		$(container).find(".s3dTreeEditorMenuOuterContainer").remove();
	}

	this.showGroupMenu = function (info){
		let html = "<div class=\"s3dTreeEditorMenuOuterContainer\">";
		html += ("<div class=\"s3dTreeEditorMenuBackground\"></div>");
		html += ("<div class=\"s3dTreeEditorMenuContainer\">");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"addUnitBtn\">添加物体</div>");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"addSubGroupBtn\">添加空物体</div>");
		html += ("<div class=\"s3dTreeEditorMenuItemSplitter\"><div class=\"s3dTreeEditorMenuItemSplitterLine\"></div></div>");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"addLightBtn\">添加光照</div>");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"addCameraBtn\">添加相机</div>");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"addTagBtn\">添加标注</div>");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"addOrbitBtn\">添加路径</div>");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"addParticleBtn\">添加粒子</div>");
		html += ("<div class=\"s3dTreeEditorMenuItemSplitter\"><div class=\"s3dTreeEditorMenuItemSplitterLine\"></div></div>");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"changeParentBtn\">更换上级</div>");
		html += ("<div class=\"s3dTreeEditorMenuItemSplitter\"><div class=\"s3dTreeEditorMenuItemSplitterLine\"></div></div>");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"deleteBtn\">删除</div>");
		html += ("</div>");
		html += ("</div>");
		let container = $("#" + thatS3dTreeEditor.containerId);
		$(container).append(html);

		//删除节点
		$(container).find(".s3dTreeEditorMenuItem[name='deleteBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.removeNode(nodeId);
		});

		//添加下级分组
		$(container).find(".s3dTreeEditorMenuItem[name='addSubGroupBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.addGroup(nodeId);
		});

		//添加物体
		$(container).find(".s3dTreeEditorMenuItem[name='addUnitBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.addObject(nodeId);
		});

		//添加相机
		$(container).find(".s3dTreeEditorMenuItem[name='addCameraBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.addCamera(nodeId);
		});

		//添加光照
		$(container).find(".s3dTreeEditorMenuItem[name='addLightBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.addLight(nodeId);
		});

		//添加粒子
		$(container).find(".s3dTreeEditorMenuItem[name='addTagBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.addTag(nodeId);
		});

		//添加路径
		$(container).find(".s3dTreeEditorMenuItem[name='addOrbitBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.addOrbit(nodeId);
		});

		//添加粒子
		$(container).find(".s3dTreeEditorMenuItem[name='addParticleBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.addParticle(nodeId);
		});

		//更换所属分组
		$(container).find(".s3dTreeEditorMenuItem[name='changeParentBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.changeParentGroup([nodeId]);
		});
	}

	this.showUnitMenu = function (info){
		let html = "<div class=\"s3dTreeEditorMenuOuterContainer\">";
		html += ("<div class=\"s3dTreeEditorMenuBackground\"></div>");
		html += ("<div class=\"s3dTreeEditorMenuContainer\">");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"changeParentBtn\">更换上级</div>");
		html += ("<div class=\"s3dTreeEditorMenuItemSplitter\"><div class=\"s3dTreeEditorMenuItemSplitterLine\"></div></div>");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"deleteBtn\">删除</div>");
		html += ("</div>");
		html += ("</div>");
		let container = $("#" + thatS3dTreeEditor.containerId);
		$(container).append(html);
		//删除节点
		$(container).find(".s3dTreeEditorMenuItem[name='deleteBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.removeNode(nodeId);
		});

		//更换所属分组
		$(container).find(".s3dTreeEditorMenuItem[name='changeParentBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.changeParentGroup([nodeId]);
		});
	}

	this.showLightMenu = function (info){
		let html = "<div class=\"s3dTreeEditorMenuOuterContainer\">";
		html += ("<div class=\"s3dTreeEditorMenuBackground\"></div>");
		html += ("<div class=\"s3dTreeEditorMenuContainer\">");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"changeParentBtn\">更换上级</div>");
		html += ("<div class=\"s3dTreeEditorMenuItemSplitter\"><div class=\"s3dTreeEditorMenuItemSplitterLine\"></div></div>");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"deleteBtn\">删除</div>");
		html += ("</div>");
		html += ("</div>");
		let container = $("#" + thatS3dTreeEditor.containerId);
		$(container).append(html);

		//删除节点
		$(container).find(".s3dTreeEditorMenuItem[name='deleteBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.removeNode(nodeId);
		});

		//更换所属分组
		$(container).find(".s3dTreeEditorMenuItem[name='changeParentBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.changeParentGroup([nodeId]);
		});
	}

	this.showCameraMenu = function (info){
		let html = "<div class=\"s3dTreeEditorMenuOuterContainer\">";
		html += ("<div class=\"s3dTreeEditorMenuBackground\"></div>");
		html += ("<div class=\"s3dTreeEditorMenuContainer\">");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"changeParentBtn\">更换上级</div>");
		html += ("<div class=\"s3dTreeEditorMenuItemSplitter\"><div class=\"s3dTreeEditorMenuItemSplitterLine\"></div></div>");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"deleteBtn\">删除</div>");
		html += ("</div>");
		html += ("</div>");
		let container = $("#" + thatS3dTreeEditor.containerId);
		$(container).append(html);

		//删除节点
		$(container).find(".s3dTreeEditorMenuItem[name='deleteBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.removeNode(nodeId);
		});

		//更换所属分组
		$(container).find(".s3dTreeEditorMenuItem[name='changeParentBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.changeParentGroup([nodeId]);
		});
	}

	this.showParticleMenu = function (info){
		let html = "<div class=\"s3dTreeEditorMenuOuterContainer\">";
		html += ("<div class=\"s3dTreeEditorMenuBackground\"></div>");
		html += ("<div class=\"s3dTreeEditorMenuContainer\">");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"changeParentBtn\">更换上级</div>");
		html += ("<div class=\"s3dTreeEditorMenuItemSplitter\"><div class=\"s3dTreeEditorMenuItemSplitterLine\"></div></div>");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"deleteBtn\">删除</div>");
		html += ("</div>");
		html += ("</div>");
		let container = $("#" + thatS3dTreeEditor.containerId);
		$(container).append(html);

		//删除节点
		$(container).find(".s3dTreeEditorMenuItem[name='deleteBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.removeNode(nodeId);
		});

		//更换所属分组
		$(container).find(".s3dTreeEditorMenuItem[name='changeParentBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.changeParentGroup([nodeId]);
		});
	}

	this.showTagMenu = function (info){
		let html = "<div class=\"s3dTreeEditorMenuOuterContainer\">";
		html += ("<div class=\"s3dTreeEditorMenuBackground\"></div>");
		html += ("<div class=\"s3dTreeEditorMenuContainer\">");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"changeParentBtn\">更换上级</div>");
		html += ("<div class=\"s3dTreeEditorMenuItemSplitter\"><div class=\"s3dTreeEditorMenuItemSplitterLine\"></div></div>");
		html += ("<div class=\"s3dTreeEditorMenuItem\" name=\"deleteBtn\">删除</div>");
		html += ("</div>");
		html += ("</div>");
		let container = $("#" + thatS3dTreeEditor.containerId);
		$(container).append(html);

		//删除节点
		$(container).find(".s3dTreeEditorMenuItem[name='deleteBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.removeNode(nodeId);
		});

		//更换所属分组
		$(container).find(".s3dTreeEditorMenuItem[name='changeParentBtn']").click(function(){
			thatS3dTreeEditor.closeMenu();
			let nodeId = $(this).parent().attr("nodeId");
			thatS3dTreeEditor.changeParentGroup([nodeId]);
		});
	}

	this.bindNodeEvent = function(nodeId){
		let container = $("#" + thatS3dTreeEditor.containerId);
		let nodeHeader = $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "'] .s3dTreeEditorNodeHeader")[0];
		let expandBtn = $(nodeHeader).children(".s3dTreeEditorNode")[0];
		let nodeTitle = $(nodeHeader).children(".s3dTreeEditorNodeTitle")[0];
		let checkInput = $(nodeHeader).children(".s3dTreeEditorNodeCheckbox")[0];
		let nodeBtn = $(nodeHeader).children(".s3dTreeEditorNodeBtn")[0];

		//点击节点名称事件
		$(nodeTitle).click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.nodeTitleClick(nodeId);
		});

		//点击折叠或展开
		$(expandBtn).click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.changeNodeExpandStatus(nodeId);
		});

		//复选框
		$(checkInput).click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.checkNode(nodeId);
		});

		//菜单下拉按钮
		$(nodeBtn).click(function(ev){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.showMenu(nodeId, ev);
			return false;
		});

		//菜单下拉按钮
		$(nodeBtn).contextmenu(function(ev){
			if(ev.button === 2){
				ev.preventDefault();
				let nodeId = $(this).parent().parent().attr("nodeId");
				thatS3dTreeEditor.showMenu(nodeId, ev);
			}
		});
		$(nodeTitle).contextmenu(function(ev){
			if(ev.button === 2){
				ev.preventDefault();
				let nodeId = $(this).parent().parent().attr("nodeId");
				thatS3dTreeEditor.showMenu(nodeId, ev);
			}
		});

	}
	
	//设置节点选中状态
	this.setNodeCheckStatus = function(nodeItem, checked, changedNodeIds){
		let checkbox = $(nodeItem).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeCheckbox");
		let childrenContainers = $(nodeItem).children(".s3dTreeEditorChildrenContainer");
		let hasChildren = childrenContainers.length !== 0;
		if(hasChildren){
			let childrenNodeItems = $(childrenContainers[0]).children(".s3dTreeEditorNodeContainer");
			for(let i = 0; i < childrenNodeItems.length; i++){
				let childNodeItem = childrenNodeItems[i];
				thatS3dTreeEditor.setNodeCheckStatus(childNodeItem, checked, changedNodeIds);
			}
		}	
		else{
			//记录变化状态的node
			if((checked && $(checkbox).hasClass("s3dTreeEditorNodeCheckboxNone"))
				||(!checked && $(checkbox).hasClass("s3dTreeEditorNodeCheckboxChecked"))){
				let nodeId = $(nodeItem).attr("nodeId");
				changedNodeIds.push(nodeId); 
			}
		}
		if(checked){
			$(checkbox).removeClass("s3dTreeEditorNodeCheckboxPart");
			$(checkbox).removeClass("s3dTreeEditorNodeCheckboxNone");
			$(checkbox).addClass("s3dTreeEditorNodeCheckboxChecked");
		}
		else {
			$(checkbox).removeClass("s3dTreeEditorNodeCheckboxPart");
			$(checkbox).removeClass("s3dTreeEditorNodeCheckboxChecked");
			$(checkbox).addClass("s3dTreeEditorNodeCheckboxNone");
		}
	}

	//刷新所有节点选中状态（递归）
	this.refreshAllNodeCheckStatus = function(){
		let container = $("#" + thatS3dTreeEditor.containerId);
		let nextProcessNodeIds = [];
		let processedNodeIdMap = {};
		for(let objectId in thatS3dTreeEditor.manager.viewer.allObject3DMap) {
			let object3D = thatS3dTreeEditor.manager.viewer.allObject3DMap[objectId];
			if(object3D.userData.info.type !== s3dElement3DType.group) {
				let nodeItem = $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + objectId + "']")[0];
				let checkbox = $(nodeItem).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeCheckbox");
				if (object3D.visible) {
					$(checkbox).removeClass("s3dTreeEditorNodeCheckboxNone");
					$(checkbox).addClass("s3dTreeEditorNodeCheckboxChecked");
				} else {
					$(checkbox).removeClass("s3dTreeEditorNodeCheckboxChecked");
					$(checkbox).addClass("s3dTreeEditorNodeCheckboxNone");
				}
				processedNodeIdMap[objectId] = true;
				nextProcessNodeIds.push(objectId);
			}
		}
		while(nextProcessNodeIds.length > 0) {
			let processingNodeIds = nextProcessNodeIds;
			nextProcessNodeIds = [];
			for (let i = 0; i < processingNodeIds.length; i++) {
				let processingNodeId = processingNodeIds[i];
				let nodeItem = $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + processingNodeId + "']")[0];
				let parentNodeItem = $(nodeItem).parent().parent()[0];
				let parentId = $(parentNodeItem).attr("nodeId");
				if (parentId != null && !processedNodeIdMap[parentId]) {
					let childNodes = $(parentNodeItem).children(".s3dTreeEditorChildrenContainer").children(".s3dTreeEditorNodeContainer");
					let allChildProcessed = true;
					for(let j = 0; j < childNodes.length; j++){
						let childNode = childNodes[j];
						let childNodeId = $(childNode).attr("nodeId");
						if(!processedNodeIdMap[childNodeId]){
							allChildProcessed = false;
							break;
						}
					}
					if(allChildProcessed) {
						let checkStatus = thatS3dTreeEditor.getAllChildrenCheckStatus(parentNodeItem);
						let checkbox = $(parentNodeItem).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeCheckbox");
						if (checkStatus.allChecked) {
							$(checkbox).removeClass("s3dTreeEditorNodeCheckboxPart");
							$(checkbox).removeClass("s3dTreeEditorNodeCheckboxNone");
							$(checkbox).addClass("s3dTreeEditorNodeCheckboxChecked");
						} else if (checkStatus.allUnchecked) {
							$(checkbox).removeClass("s3dTreeEditorNodeCheckboxPart");
							$(checkbox).removeClass("s3dTreeEditorNodeCheckboxChecked");
							$(checkbox).addClass("s3dTreeEditorNodeCheckboxNone");
						} else {
							$(checkbox).removeClass("s3dTreeEditorNodeCheckboxChecked");
							$(checkbox).removeClass("s3dTreeEditorNodeCheckboxNone");
							$(checkbox).addClass("s3dTreeEditorNodeCheckboxPart");
						}
						nextProcessNodeIds.push(parentId);
						processedNodeIdMap[parentId] = true;
					}
				}
			}
		}
	}

	//刷新所有父节点选中状态（递归）
	this.refreshAllParentCheckStatus = function(nodeItem){
		let parentNodeItem = $(nodeItem).parent().parent()[0];
		while($(parentNodeItem).hasClass("s3dTreeEditorNodeContainer")){
			let checkStatus = thatS3dTreeEditor.getAllChildrenCheckStatus(parentNodeItem);
			let checkbox = $(parentNodeItem).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeCheckbox");
			if(checkStatus.allChecked){
				$(checkbox).removeClass("s3dTreeEditorNodeCheckboxPart");
				$(checkbox).removeClass("s3dTreeEditorNodeCheckboxNone");
				$(checkbox).addClass("s3dTreeEditorNodeCheckboxChecked");
			}
			else if(checkStatus.allUnchecked){
				$(checkbox).removeClass("s3dTreeEditorNodeCheckboxPart");
				$(checkbox).removeClass("s3dTreeEditorNodeCheckboxChecked");
				$(checkbox).addClass("s3dTreeEditorNodeCheckboxNone");
			}
			else {
				$(checkbox).removeClass("s3dTreeEditorNodeCheckboxChecked");
				$(checkbox).removeClass("s3dTreeEditorNodeCheckboxNone");
				$(checkbox).addClass("s3dTreeEditorNodeCheckboxPart");
			}
			parentNodeItem = $(parentNodeItem).parent().parent();
		}
	}
	
	//获取子节点选中状态
	this.getAllChildrenCheckStatus = function(parentNodeItem){
		let allChecked = true;
		let allUnchecked = true;
		let childrenContainer = $(parentNodeItem).children(".s3dTreeEditorChildrenContainer")[0];
		let allChildrenNodeItems = $(childrenContainer).children(".s3dTreeEditorNodeContainer").children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeCheckbox");
		for(let i = 0; i < allChildrenNodeItems.length; i++){
			let childNodeItem = allChildrenNodeItems[i];
			if($(childNodeItem).hasClass("s3dTreeEditorNodeCheckboxNone")){
				allChecked = false;
			}
			else if($(childNodeItem).hasClass("s3dTreeEditorNodeCheckboxPart")){
				allChecked = false;
				allUnchecked = false;
			}
			else{
				allUnchecked = false;
			}
		}
		return {
			allChecked: allChecked,
			allUnchecked: allUnchecked
		};
	}
	
	//初始化节点id与json对照
	this.initId2NodeJsonMap = function(nodeJArray, id2NodeJsonMap){
		if(nodeJArray != null && nodeJArray.length > 0){
			for(let i = 0; i < nodeJArray.length; i++){
				let nodeJson = nodeJArray[i];
				id2NodeJsonMap[nodeJson.id] = nodeJson;
				thatS3dTreeEditor.initId2NodeJsonMap(nodeJson.children, id2NodeJsonMap);
			}
		}
	}

	//该节点下的所有叶节点id
	this.getChildNodeIds = function(nodeId){
		let leafNodes = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']").find(".s3dTreeEditorNodeContainer[isLeaf='true']");
		let nodeIds = [];
		for(let i = 0; i < leafNodes.length; i++){
			let leafNode = leafNodes[i];
			nodeIds.push($(leafNode).attr("nodeId"));
		}
		return nodeIds;
	}
	
	//该节点下的所有叶节点Json
	this.getChildNodeJsons = function(nodeId){
		let leafNodes = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']").find(".s3dTreeEditorNodeContainer[isLeaf='true']");
		let nodeJsons = [];
		for(let i = 0; i < leafNodes.length; i++){
			let leafNode = leafNodes[i];
			let leafNodeId = $(leafNode).attr("nodeId");
			nodeJsons.push(thatS3dTreeEditor.id2NodeJsonMap[leafNodeId]);
		}
		return nodeJsons;
	}
	
	//是否包含子节点
	this.checkHasChildren = function(nodeId){
		return $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']").attr("isLeaf") === "false";
	}

	//获取树toolbar html
	this.getTreeToolbarHtml = function(){
		let html = "<div class=\"s3dTreeEditorHeaderBtn s3dTreeEditorAddRootGroupBtn\" title=\"添加分组\">&#x2795;</div>";
		return html;
	}

	//获取树html
	this.getTreeContainerHtml = function(nodeJArray, id2NodeJsonMap){
		let treeHtml = "<div class=\"s3dTreeEditorContainer\" tabindex=\"1\">";
		treeHtml += "<div class=\"s3dTreeEditorMenuContainer\"></div>";
		treeHtml += "<div class=\"s3dTreeEditorInnerContainer\">";
		if(nodeJArray != null){
			for(let i = 0; i < nodeJArray.length; i++){
				let nodeJson = nodeJArray[i];
				if(nodeJson.parentId == null) {
					let childNodeHtml = thatS3dTreeEditor.getNodeHtml(nodeJson, false, true, id2NodeJsonMap);
					treeHtml += childNodeHtml;
				}
			}
		}
		treeHtml += "</div>";
		treeHtml += "</div>";
		return treeHtml;
	}
	
	//获取node节点html
	this.getNodeHtml = function(nodeJson, expanded, isGroup, id2NodeJsonMap){
		let isDefault = nodeJson.isDefault;
		let nodeHtml = "";
		nodeHtml += "<div class=\"s3dTreeEditorNodeContainer\" nodeId=\"" + nodeJson.id + "\" isLeaf=\"" + (isGroup ? "false" : "true") + "\" isDefault=\"" + (isDefault ? "true" : "false") + "\">";
		nodeHtml += "<div class=\"s3dTreeEditorNodeHeader\">";
		nodeHtml += ("<div class=\"s3dTreeEditorNodeCheckbox s3dTreeEditorNodeCheckboxChecked\"></div>");
		nodeHtml += (isGroup ? ("<div class=\"s3dTreeEditorNode " + (expanded ? "s3dTreeEditorNodeExpand" : "s3dTreeEditorNodeCollapse") + "\"></div>") : "");
		nodeHtml += "<div class=\"s3dTreeEditorNodeTitle\">";
		nodeHtml += ("<span class=\"s3dTreeEditorNodeName\">" + cmnPcr.htmlEncode(nodeJson.name) + "</span>");
		if(isGroup) {
			let objectCount = nodeJson.children == null ? 0 : nodeJson.children.length;
			nodeHtml += ("&nbsp;<span class=\"s3dTreeEditorNodeObjectCount\">(" + objectCount + ")</span>");
		}
		nodeHtml += "</div>";
		nodeHtml += "<div class=\"s3dTreeEditorNodeBtn\" title=\"操作\">&#9477;</div>";
		nodeHtml += "</div>";
		if(isGroup){
			nodeHtml += ("<div class=\"s3dTreeEditorChildrenContainer" + (expanded ? "" : " s3dTreeEditorHidden") + "\">");
			if(nodeJson.children != null){
				for(let i = 0; i < nodeJson.children.length; i++){
					let childNodeJson = nodeJson.children[i];
					let hasChildChildren = childNodeJson.children != null && childNodeJson.children.length > 0;
					let isChildGroup = childNodeJson.isGroup == undefined ? false : childNodeJson.isGroup;
					let childNodenodeHtml = null;
					if(isChildGroup) {
						let childGroupJson = id2NodeJsonMap[childNodeJson.id];
						childNodenodeHtml = thatS3dTreeEditor.getNodeHtml(childGroupJson, false, true, id2NodeJsonMap);
					}
					else{
						childNodenodeHtml = thatS3dTreeEditor.getNodeHtml(childNodeJson, false, false, id2NodeJsonMap);
					}
					nodeHtml += childNodenodeHtml;
				}
			}
			nodeHtml += "</div>";
		}
		nodeHtml += "</div>";
		return nodeHtml;
	}

	this.getTreeJson = function(){
		let parentContainer = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorInnerContainer");
		let treeRootJson = {};
		thatS3dTreeEditor.getTreeNodeJson(treeRootJson, parentContainer);
		return treeRootJson;
	}

	this.getTreeNodeJson = function(parentNodeJson, parentContainer){
		let childContainers = $(parentContainer).children(".s3dTreeEditorNodeContainer");
		if(childContainers.length > 0){
			parentNodeJson.children = [];
			for(let i = 0; i < childContainers.length; i++){
				let childContainer = childContainers[i];
				let isGroup = $(childContainer).attr("isLeaf") !== "true";
				let childNodeId = $(childContainer).attr("nodeId");
				let childNodeName = $(childContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text();
				let childNodeJson = {
					id: childNodeId,
					name: childNodeName,
					isGroup: isGroup
				};
				let childNextLevelContainer = $(childContainer).children(".s3dTreeEditorChildrenContainer");
				thatS3dTreeEditor.getTreeNodeJson(childNodeJson, childNextLevelContainer);
				parentNodeJson.children.push(childNodeJson);
			}
		}
	}

	//更改节点名称（唯一标识）
	this.changeNodeName = function(nodeId, nodeName){
		let nodeContainer = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
		$(nodeContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text(nodeName);
		thatS3dTreeEditor.sortSameGroupNodes(nodeId);
	}

	//获取当前的分组id
	this.getCurrentGroupId = function(){
		let container = $("#" + thatS3dTreeEditor.containerId);
		let activeNodeHeaders = $(container).find(".s3dTreeEditorNodeHeaderActive");
		if(activeNodeHeaders.length === 0){
			let defaultGroupContainer = $(container).find(".s3dTreeEditorNodeContainer[isDefault='true']");
			return $(defaultGroupContainer).attr("nodeId");
		}
		else{
			let nodeContainer = $(activeNodeHeaders[0]).parent();
			let isLeaf= $(nodeContainer).attr("isLeaf") === "true";
			if(isLeaf){
				//找到其父节点为group
				let parentContainer = $(nodeContainer).parent()[0];
				if($(parentContainer).hasClass("s3dTreeEditorInnerContainer")){
					//根节点
					return null;
				}
				else{
					let groupContainer = $(parentContainer).parent()[0];
					return $(groupContainer).attr("nodeId");
				}
			}
			else{
				//当前选中的节点就是group
				return $(activeNodeHeaders[0]).parent().attr("nodeId");
			}
		}
	}


	this.getResultGroups = function(){
		let parentContainer = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorInnerContainer");
		return thatS3dTreeEditor.getGroupJsons(parentContainer);
	}

	this.getGroupJsons = function(parentContainer){
		let groupJsons = [];
		let childContainers = $(parentContainer).children(".s3dTreeEditorNodeContainer");
		if(childContainers.length > 0){
			for(let i = 0; i < childContainers.length; i++){
				let childContainer = childContainers[i];
				let childNodeId = $(childContainer).attr("nodeId");
				groupJsons.push(childNodeId);
			}
		}
		return groupJsons;
	}
}
export default S3dTreeEditor