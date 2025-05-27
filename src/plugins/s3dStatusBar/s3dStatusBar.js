import {
	cmnPcr,
	msgBox,
	s3dUiStatusText,
	s3dOperateType,
	s3dOperateTypeName,
	s3dAnimationEditType, s3dMaterialEditType
} from "../../commonjs/common/common.js"
import "./s3dStatusBar.css"
import s3dAnimationEditor from "../s3dAnimationEditor/s3dAnimationEditor.js";

//S3dWeb 状态栏
let S3dStatusBar = function (){
	//当前对象
	const thatS3dStatusBar = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;  

	//列表最大长度
	this.maxListCount = 30;
	
	//undo列表
	this.undoInfoList = [];

	//redo列表
	this.redoInfoList = [];

	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dStatusBar.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dStatusBar.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dStatusBar.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}
	 
	//初始化
	this.init = function(p){
		thatS3dStatusBar.containerId = p.containerId;
		thatS3dStatusBar.manager = p.manager; 		       
		thatS3dStatusBar.showStatusbar(p.config.title == null ? "状态栏" : p.config.title);

		thatS3dStatusBar.show();
	}
	
	//隐藏
	this.hide = function(){
		$("#" + thatS3dStatusBar.containerId).find(".s3dStatusBarContainer").css({"display": "none"});
	}
	
	//隐藏
	this.show = function(){
		$("#" + thatS3dStatusBar.containerId).find(".s3dStatusBarContainer").css({"display": "block"});
	}
	
	//显示结构树
	this.showStatusbar = function(title){
		//构造html
		let container = $("#" + thatS3dStatusBar.containerId);
		let statusBarContainer = $(container).find(".s3dLayoutBlock[name='statusBar']");
		let barHtml = thatS3dStatusBar.getStatusbarHtml();
		$(statusBarContainer).append(barHtml);

		//toolbar
		let toolbarContainer = $(container).find(".s3dLayoutBlockToolbar[name='statusBar']");
		let toolbarHtml = thatS3dStatusBar.getTreeToolbarHtml();
		$(toolbarContainer).append(toolbarHtml);

		$(statusBarContainer).find(".s3dStatusBarTitle").text(title);
		
		$(toolbarContainer).find(".s3dStatusBarCloseBtn").click(function(){
			thatS3dStatusBar.hide();
		});
		
		$(toolbarContainer).find(".s3dStatusBarUndoBtn").click(function(){
			thatS3dStatusBar.undo();
		});
		
		$(toolbarContainer).find(".s3dStatusBarRedoBtn").click(function(){
			thatS3dStatusBar.redo();
		});
	}
	
	//撤销
	this.undo = function(){
		let operateInfo = thatS3dStatusBar.fetchLastUndoInfo();
		if(operateInfo != null){
			thatS3dStatusBar.addRedoInfoToList(operateInfo);	
			//刷新propertyEditor选中空
			thatS3dStatusBar.manager.viewer.cancelSelectObject3Ds();

			switch(operateInfo.operateType){
				case s3dOperateType.transform:{
					//静默改变nodeData
					thatS3dStatusBar.manager.moveHelper.transformObjectInSilence(operateInfo.begin.nodeJsons);
					break;
				}
				case s3dOperateType.changeParent:{
					//更换所属组
					thatS3dStatusBar.manager.viewer.changeParentGroupInSilence(operateInfo.end.nodeJsons);

					//重载tree
					thatS3dStatusBar.manager.treeEditor.refreshTreeInSilence(operateInfo.begin.tree);
					break;
				}
				case s3dOperateType.edit:{
					//静默改变nodeData
					thatS3dStatusBar.manager.propertyEditor.changeObjectInfoInSilence(operateInfo.begin.nodeJsons);

					//重载tree
					thatS3dStatusBar.manager.treeEditor.refreshTreeInSilence(operateInfo.begin.tree);
					break;
				}
				case s3dOperateType.add:{
					//静默删除节点
					thatS3dStatusBar.manager.viewer.removeObjectsInSilence(operateInfo.begin.nodeJsons);

					//重载tree
					thatS3dStatusBar.manager.treeEditor.refreshTreeInSilence(operateInfo.begin.tree);
					break;
				}
				case s3dOperateType.delete:{
					//静默添加节点
					thatS3dStatusBar.manager.viewer.addNewObjectsInSilence(operateInfo.begin.nodeJsons);

					//重载tree
					thatS3dStatusBar.manager.treeEditor.refreshTreeInSilence(operateInfo.begin.tree);
					break;
				}
				case s3dOperateType.splitLocal:{
					//静默删除节点
					thatS3dStatusBar.manager.viewer.removeObjectsInSilence(operateInfo.begin.nodeJsons);

					//静默添加节点
					thatS3dStatusBar.manager.viewer.addNewObjectsInSilence(operateInfo.begin.otherInfo.sourceNodeJsons);

					//重载tree
					thatS3dStatusBar.manager.treeEditor.refreshTreeInSilence(operateInfo.begin.tree);

					break;
				}
				case s3dOperateType.animation:{
					let editType = operateInfo.begin.otherInfo.editType;
					switch(editType){
						case s3dAnimationEditType.add:{
							//关闭编辑窗口
							thatS3dStatusBar.manager.animationEditor.closeAnimation(false);

							//静默删除节点
							thatS3dStatusBar.manager.userAnimations.removeAnimation(operateInfo.begin.otherInfo.targetCode);

							//重载列表
							thatS3dStatusBar.manager.animationList.showAnimationList();
							break;
						}
						case s3dAnimationEditType.edit:{
							//关闭编辑窗口
							thatS3dStatusBar.manager.animationEditor.closeAnimation(false);

							//静默更新节点
							thatS3dStatusBar.manager.userAnimations.updateAnimation(operateInfo.begin.otherInfo.animationInfo);

							//重载列表
							thatS3dStatusBar.manager.animationList.showAnimationList();
							break;
						}
						case s3dAnimationEditType.delete:{
							//关闭编辑窗口
							thatS3dStatusBar.manager.animationEditor.closeAnimation(false);

							//静默添加节点
							thatS3dStatusBar.manager.userAnimations.addAnimation(operateInfo.begin.otherInfo.animationInfo);

							//重载列表
							thatS3dStatusBar.manager.animationList.showAnimationList();

							break;
						}
						default:{
							//刷新编辑内容
							thatS3dStatusBar.manager.animationEditor.refreshEditing(operateInfo.begin.otherInfo.editingInfo, operateInfo.begin.otherInfo.uiInfo);
							break;
						}
					}
					break;
				}
				case s3dOperateType.material:{
					let editType = operateInfo.begin.otherInfo.editType;
					switch(editType){
						case s3dMaterialEditType.add:{
							//关闭编辑窗口
							thatS3dStatusBar.manager.materialEditor.closeDetail();

							//静默删除节点
							thatS3dStatusBar.manager.localMaterials.removeUserMaterial(operateInfo.begin.otherInfo.targetCode);

							//重载列表
							thatS3dStatusBar.manager.materialEditor.showMaterialList();
							break;
						}
						case s3dMaterialEditType.edit:{
							//关闭编辑窗口
							thatS3dStatusBar.manager.materialEditor.closeDetail();

							//静默更新节点
							thatS3dStatusBar.manager.localMaterials.updateUserMaterial(operateInfo.begin.otherInfo.materialInfo);

							//重载列表
							thatS3dStatusBar.manager.materialEditor.showMaterialList();
							break;
						}
						case s3dAnimationEditType.delete:{
							//关闭编辑窗口
							thatS3dStatusBar.manager.materialEditor.closeDetail();

							//静默添加节点
							thatS3dStatusBar.manager.localMaterials.addUserMaterial(operateInfo.begin.otherInfo.materialInfo);

							//重载列表
							thatS3dStatusBar.manager.materialEditor.showMaterialList();

							break;
						}
						default:{
							//刷新编辑内容
							thatS3dStatusBar.manager.materialEditor.refreshEditing(operateInfo.begin.otherInfo.editingInfo, operateInfo.begin.otherInfo.uiInfo);
							break;
						}
					}
					break;
				}
				default:{
					msgBox.alert({info: "不支持的操作: " + operateInfo.operateType});
					break;
				}
			}
			thatS3dStatusBar.refreshStatusText({
				status: thatS3dStatusBar.manager.viewer.status,
				message: "撤销 '" + s3dOperateTypeName[operateInfo.operateType] + "' 操作"
			});
		}
		else{
			msgBox.alert({info: "没有可执行的撤销操作 "});
		}
	}
	
	//撤销
	this.redo = function(){
		let operateInfo = thatS3dStatusBar.fetchLastRedoInfo();
		if(operateInfo != null){
			thatS3dStatusBar.addUndoInfoToList(operateInfo, true);
			//刷新propertyEditor选中空
			thatS3dStatusBar.manager.viewer.cancelSelectObject3Ds();

			switch(operateInfo.operateType){
				case s3dOperateType.transform:{
					//静默改变nodeData
					thatS3dStatusBar.manager.moveHelper.transformObjectInSilence(operateInfo.end.nodeJsons);
					break;
				}
				case s3dOperateType.changeParent:{
					//更换所属组
					thatS3dStatusBar.manager.viewer.changeParentGroupInSilence(operateInfo.end.nodeJsons);

					//重载tree
					thatS3dStatusBar.manager.treeEditor.refreshTreeInSilence(operateInfo.end.tree);
					break;
				}
				case s3dOperateType.edit:{
					//静默改变nodeData
					thatS3dStatusBar.manager.propertyEditor.changeObjectInfoInSilence(operateInfo.end.nodeJsons);

					//重载tree
					thatS3dStatusBar.manager.treeEditor.refreshTreeInSilence(operateInfo.end.tree);
					break;
				}
				case s3dOperateType.add:{
					//静默删除节点
					thatS3dStatusBar.manager.viewer.addNewObjectsInSilence(operateInfo.end.nodeJsons);

					//重载tree
					thatS3dStatusBar.manager.treeEditor.refreshTreeInSilence(operateInfo.end.tree);
					break;
				}
				case s3dOperateType.delete:{
					//静默添加节点
					thatS3dStatusBar.manager.viewer.removeObjectsInSilence(operateInfo.end.nodeJsons);
					
					//重载tree
					thatS3dStatusBar.manager.treeEditor.refreshTreeInSilence(operateInfo.end.tree);
					break;
				}
				case s3dOperateType.splitLocal:{
					//静默删除节点
					thatS3dStatusBar.manager.viewer.addNewObjectsInSilence(operateInfo.end.nodeJsons);

					//静默添加节点
					thatS3dStatusBar.manager.viewer.removeObjectsInSilence(operateInfo.end.otherInfo.sourceNodeJsons);

					//重载tree
					thatS3dStatusBar.manager.treeEditor.refreshTreeInSilence(operateInfo.end.tree);
					break;
				}
				case s3dOperateType.animation:{
					let editType = operateInfo.end.otherInfo.editType;
					switch(editType){
						case s3dAnimationEditType.add:{
							//关闭编辑窗口
							thatS3dStatusBar.manager.animationEditor.closeAnimation(false);

							//静默添加节点
							thatS3dStatusBar.manager.userAnimations.addAnimation(operateInfo.end.otherInfo.animationInfo);

							//重载列表
							thatS3dStatusBar.manager.animationList.showAnimationList();
							break;
						}
						case s3dAnimationEditType.edit:{
							//关闭编辑窗口
							thatS3dStatusBar.manager.animationEditor.closeAnimation(false);

							//静默更新节点
							thatS3dStatusBar.manager.userAnimations.updateAnimation(operateInfo.end.otherInfo.animationInfo);

							//重载列表
							thatS3dStatusBar.manager.animationList.showAnimationList();
							break;
						}
						case s3dAnimationEditType.delete:{
							//关闭编辑窗口
							thatS3dStatusBar.manager.animationEditor.closeAnimation(false);

							//静默删除节点
							thatS3dStatusBar.manager.userAnimations.removeAnimation(operateInfo.end.otherInfo.targetCode);

							//重载列表
							thatS3dStatusBar.manager.animationList.showAnimationList();

							break;
						}
						default:{
							//刷新编辑内容
							thatS3dStatusBar.manager.animationEditor.refreshEditing(operateInfo.end.otherInfo.editingInfo, operateInfo.end.otherInfo.uiInfo);
							break;
						}
					}
					break;
				}
				case s3dOperateType.material:{
					let editType = operateInfo.end.otherInfo.editType;
					switch(editType){
						case s3dMaterialEditType.add:{
							//关闭编辑窗口
							thatS3dStatusBar.manager.materialEditor.closeDetail();

							//静默添加节点
							thatS3dStatusBar.manager.localMaterials.addUserMaterial(operateInfo.end.otherInfo.materialInfo);

							//重载列表
							thatS3dStatusBar.manager.materialEditor.showMaterialList();
							break;
						}
						case s3dMaterialEditType.edit:{
							//关闭编辑窗口
							thatS3dStatusBar.manager.materialEditor.closeDetail();

							//静默更新节点
							thatS3dStatusBar.manager.localMaterials.updateUserMaterial(operateInfo.end.otherInfo.materialInfo);

							//重载列表
							thatS3dStatusBar.manager.materialEditor.showMaterialList();
							break;
						}
						case s3dAnimationEditType.delete:{
							//关闭编辑窗口
							thatS3dStatusBar.manager.materialEditor.closeDetail();

							//静默删除节点
							thatS3dStatusBar.manager.localMaterials.removeUserMaterial(operateInfo.end.otherInfo.targetCode);

							//重载列表
							thatS3dStatusBar.manager.materialEditor.showMaterialList();

							break;
						}
						default:{
							//刷新编辑内容
							thatS3dStatusBar.manager.materialEditor.refreshEditing(operateInfo.end.otherInfo.editingInfo, operateInfo.end.otherInfo.uiInfo);
							break;
						}
					}
					break;
				}
				default:{
					msgBox.alert({info: "不支持的操作: " + operateInfo.operateType});
					break;
				}
			}
			thatS3dStatusBar.refreshStatusText({
				status: thatS3dStatusBar.manager.viewer.status,
				message: "重做 '" + s3dOperateTypeName[operateInfo.operateType] + "' 操作"
			});
		}
		else{
			msgBox.alert({info: "没有可执行的重做操作 "});
		}
	}

	//获取树toolbar html
	this.getTreeToolbarHtml = function(){
		let html = "<div class=\"s3dStatusBarBtn s3dStatusBarUndoBtn\" title=\"撤销\">&#x21b6;</div>"
			+ "<div class=\"s3dStatusBarBtn s3dStatusBarRedoBtn\" title=\"重做\">&#x21b7;</div>";
		return html;
	}

	//获取list html
	this.getStatusbarHtml = function(){
		return  "<div class=\"s3dStatusBarContainer\">"
			+ "<div class=\"s3dStatusBarInnerContainer\">"
			+ "</div>"
			+ "</div>";
	} 

	//新添加的undo信息，临时数据
	this.newUndoInfo = {
		begin: null,
		end: null
	};

	//开始添加undo信息
	this.beginAddToUndoList = function(p, mergeOperateCode){
		if(thatS3dStatusBar.newUndoInfo.begin != null){
			msgBox.alert({info: "不能重复开启添加undo状态"});
		}
		else{
			thatS3dStatusBar.newUndoInfo.begin = p;
		}
	}

	//取消之前开始添加的undo信息
	this.cancelAddToUndoList = function(p){
		if(thatS3dStatusBar.newUndoInfo.begin == null){
			msgBox.alert({info: "此前并没有开启添加undo信息状态，无法取消"});
		}
		else{ 
			thatS3dStatusBar.newUndoInfo.begin = null;
			thatS3dStatusBar.newUndoInfo.end = null;
		}
	}

	this.removeTempOperateFromList = function (operateType, remainEditTypes){
		for(let i = thatS3dStatusBar.undoInfoList.length - 1; i >= 0; i--){
			let undoInfo = thatS3dStatusBar.undoInfoList[i];
			if(undoInfo.operateType === operateType){
				let canRemove = true;
				for(let i = 0; i < remainEditTypes.length; i++){
					if(undoInfo.begin.otherInfo.editType === remainEditTypes[i]){
						canRemove = false;
						break;
					}
				}
				if(canRemove){
					thatS3dStatusBar.removeUndoInfo(undoInfo);
				}
				else{
					break;
				}
			}
		}
		for(let i = thatS3dStatusBar.redoInfoList.length - 1; i >= 0; i--){
			let redoInfo = thatS3dStatusBar.redoInfoList[i];
			if(redoInfo.operateType === operateType){
				let canRemove = true;
				for(let i = 0; i < remainEditTypes.length; i++){
					if(redoInfo.end.otherInfo.editType === remainEditTypes[i]){
						canRemove = false;
						break;
					}
				}
				if(canRemove){
					thatS3dStatusBar.removeRedoInfo(redoInfo);
				}
				else{
					break;
				}
			}
		}
	}

	this.removeUndoInfo = function (undoInfo){
		let tempList = [];
		for(let i = 0; i < thatS3dStatusBar.undoInfoList.length; i++){
			let info = thatS3dStatusBar.undoInfoList[i];
			if(info !== undoInfo){
				tempList.push(info);
			}
		}
		thatS3dStatusBar.undoInfoList = tempList;
	}

	this.removeRedoInfo = function (redoInfo){
		let tempList = [];
		for(let i = 0; i < thatS3dStatusBar.redoInfoList.length; i++){
			let info = thatS3dStatusBar.redoInfoList[i];
			if(info !== redoInfo){
				tempList.push(info);
			}
		}
		thatS3dStatusBar.redoInfoList = tempList;
	}

	//如果是animation、material，那么如果遇到edit、add、delete的时候，取消之前的其他操作（从undo、redo列表中）
	this.removeTempOperate = function (p){
		let remainEditTypes = null;
		switch(p.operateType){
			case s3dOperateType.animation:{
				remainEditTypes = [s3dAnimationEditType.add, s3dAnimationEditType.edit, s3dAnimationEditType.delete];
				break;
			}
			case s3dOperateType.material:{
				remainEditTypes = [s3dMaterialEditType.add, s3dMaterialEditType.edit, s3dMaterialEditType.delete];
				break;
			}
		}

		let needRemove = false;
		if(remainEditTypes != null) {
			for (let i = 0; i < remainEditTypes.length; i++) {
				if (p.otherInfo.editType === remainEditTypes[i]) {
					needRemove = true;
				}
			}
			if (needRemove) {
				thatS3dStatusBar.removeTempOperateFromList(p.operateType, remainEditTypes);
				return true;
			}
		}
		return false;
	}

	//完成添加undo信息
	//mergeCode与最后一次undo相同时，合并为一次操作
	this.endAddToUndoList = function(p, mergeCode){
		if(thatS3dStatusBar.newUndoInfo.begin == null){
			msgBox.alert({info: "没有开启添加undo信息状态"});
		}
		else{
			let needMerge = false;

			//如果是animation、material，那么如果遇到edit、add、delete的时候，取消之前的其他操作（从undo、redo列表中）
			if(!thatS3dStatusBar.removeTempOperate(p)) {
				if (mergeCode != null && thatS3dStatusBar.undoInfoList.length > 0) {
					let lastUndoInfo = thatS3dStatusBar.undoInfoList[thatS3dStatusBar.undoInfoList.length - 1];
					if (lastUndoInfo.mergeCode === mergeCode) {
						needMerge = true;
					}
				}
			}

			if(needMerge) {
				//需要合并操作，记录为一次可undo的操作
				let lastUndoInfo = thatS3dStatusBar.undoInfoList[thatS3dStatusBar.undoInfoList.length - 1];
				lastUndoInfo.end = p;
			}
			else {
				thatS3dStatusBar.newUndoInfo.end = p;
				if (thatS3dStatusBar.newUndoInfo.end.operateType === thatS3dStatusBar.newUndoInfo.begin.operateType) {
					let operateInfo = {
						operateType: p.operateType,
						mergeCode: mergeCode,
						begin: thatS3dStatusBar.newUndoInfo.begin,
						end: thatS3dStatusBar.newUndoInfo.end
					};
					thatS3dStatusBar.addUndoInfoToList(operateInfo);
				} else {
					msgBox.alert({info: "无法添加undo信息, 开启和结束的操作类型不同"});
				}
			}
			
			thatS3dStatusBar.newUndoInfo.begin = null;
			thatS3dStatusBar.newUndoInfo.end = null;
		}
	}

	//添加操作到undo类别
	this.addUndoInfoToList = function(p, isFromRedoList){
		if(p.operateType !== s3dOperateType.none){
			if(thatS3dStatusBar.undoInfoList.length >= thatS3dStatusBar.maxListCount){
				let newList = [];
				for(let i = thatS3dStatusBar.undoInfoList.length - thatS3dStatusBar.maxListCount + 1; i < thatS3dStatusBar.maxListCount; i++){
					newList.push(thatS3dStatusBar.undoInfoList[i]);
				}
				thatS3dStatusBar.undoInfoList = newList;
			}
			thatS3dStatusBar.undoInfoList.push(p);
			if(!isFromRedoList){
				//如果不是从redo list来的，那么清除redo list
				thatS3dStatusBar.clearRedoList();
				
				thatS3dStatusBar.refreshStatusText({
					status: thatS3dStatusBar.manager.viewer.status,
					message: "执行 '" + s3dOperateTypeName[p.operateType] +"' 操作"
				});
			}
		}
	}

	//取出undo列表里的最后一次操作
	this.fetchLastUndoInfo = function(){
		if(thatS3dStatusBar.undoInfoList.length > 0){
			let lastUndoInfo = thatS3dStatusBar.undoInfoList[thatS3dStatusBar.undoInfoList.length - 1];
			let newList = [];
			for(let i = 0; i < thatS3dStatusBar.undoInfoList.length - 1; i++){
				newList.push(thatS3dStatusBar.undoInfoList[i]);
			}
			thatS3dStatusBar.undoInfoList = newList;
			return lastUndoInfo;
		}
		else{
			return null;
		}
	}

	//添加操作到redo列表
	this.addRedoInfoToList = function(p){
		if(p.operateType !== s3dOperateType.none){
			if(thatS3dStatusBar.redoInfoList.length >= thatS3dStatusBar.maxDoListCount){
				let newList = [];
				for(let i = thatS3dStatusBar.redoInfoList.length - thatS3dStatusBar.maxDoListCount + 1; i < thatS3dStatusBar.maxDoListCount; i++){
					newList.push(thatS3dStatusBar.redoInfoList[i]);
				}
				thatS3dStatusBar.redoInfoList = newList;
			}
			thatS3dStatusBar.redoInfoList.push(p);
		}
	}

	//取出redo列表里的最后一次操作
	this.fetchLastRedoInfo = function(){
		if(thatS3dStatusBar.redoInfoList.length > 0){
			let lastRedoInfo = thatS3dStatusBar.redoInfoList[thatS3dStatusBar.redoInfoList.length - 1];
			let newList = [];
			for(let i = 0; i < thatS3dStatusBar.redoInfoList.length - 1; i++){
				newList.push(thatS3dStatusBar.redoInfoList[i]);
			}
			thatS3dStatusBar.redoInfoList = newList;
			return lastRedoInfo;
		}
		else{
			return null;
		}
	}

	//清除redo列表
	this.clearRedoList = function(){
		thatS3dStatusBar.redoInfoList = [];
	}
	
	//刷新状态文字
	this.refreshStatusText = function(p){
		let container = $("#" + thatS3dStatusBar.containerId);
		let barInnerContainers = $(container).find(".s3dStatusBarInnerContainer");
		if(barInnerContainers.length > 0) {
			let barInnerContainer = barInnerContainers[0];
			let barSubTitle = $(container).find(".s3dStatusBarSubTitle")[0];
			let statusText = s3dUiStatusText[p.status];
			$(barSubTitle).html(" - 当前状态: " + statusText);
			let statusHtml = thatS3dStatusBar.getStatusHtml(p.message);
			$(barInnerContainer).append(statusHtml);
			barInnerContainer.scrollTop = barInnerContainer.scrollHeight;
		}
	}
	
	//获取status html
	this.getStatusHtml = function(message){
		return "<div class=\"s3dStatusBarItemContainer\">"
			+ "<div class=\"s3dStatusBarItemTitle\">" + cmnPcr.datetimeToStr(new Date(), "HH:mm:ss") + "</div>"
			+ "<div class=\"s3dStatusBarItemValue\">" + cmnPcr.htmlEncode(message) + "</div>"
			+ "</div>";
	}
}
export default S3dStatusBar