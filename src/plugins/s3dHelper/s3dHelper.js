import {cmnPcr} from "../../commonjs/common/common.js"
import "./s3dHelper.css"

//S3dWeb 帮助
let S3dHelper = function (){
	
	//当前对象
	const thatS3dHelper = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;  

	//节点ID与helper object3D
	this.nodeId2HelperObject3D = null;

	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dHelper.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dHelper.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dHelper.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}

	//初始化
	this.init = function(p){
		thatS3dHelper.containerId = p.containerId;
		thatS3dHelper.manager = p.manager;
		thatS3dHelper.nodeId2HelperObject3D = {};
		thatS3dHelper.initContainer();

		let container = $("#" + thatS3dHelper.containerId);
		$(container).on("touchstart", thatS3dHelper.onDocumentClick);
		$(container).on("click", thatS3dHelper.onDocumentClick);

        if(p.config.onHelperClick != null){
        	thatS3dHelper.addEventFunction("onHelperClick", p.config.onHelperClick); 
        }
	}

	this.onDocumentClick = function(ev){
		if($(ev.target).hasClass("s3dHelperLink")){
			let nodeId = $(ev.target).parent().parent().attr("nodeId");
			thatS3dHelper.onHelperClick({
				nodeId: nodeId	
			});
		}
	}

	this.onHelperClick = function(p){
    	thatS3dHelper.doEventFunction("onHelperClick", p);
	}
	
	//添加标注
	this.addHelper = function(p){ 
		let existHelper3D = thatS3dHelper.nodeId2HelperObject3D[p.nodeId];
		if(existHelper3D != null){
			thatS3dHelper.removeHelper(p);
		}
		let object3D = thatS3dHelper.manager.viewer.getObject3DById(p.nodeId);		
		if(object3D == null){
			throw "Unknown object3D. nodeId = " + p.nodeId;
		}
		p.helperId = cmnPcr.getRandomValue();
		let helperHtml = p.linkUrl == null ? thatS3dHelper.getHelperHtml(p) : thatS3dHelper.getHelperWithLinkHtml(p);
		$("#" + thatS3dHelper.containerId).find(".s3dHelperLayerContainer").append(helperHtml);
		let helperDiv = $("#" + p.helperId)[0]; 
		let helper2D = new THREE.CSS2DObject(helperDiv);
		helper2D.isHelper = true;
		let posToRoot = thatS3dHelper.manager.viewer.getPositionInRoot(object3D);
		if(p.shift == null){
			helper2D.position.set(posToRoot.x, posToRoot.y, posToRoot.z);		
		}
		else {
			helper2D.position.set(posToRoot.x + p.shift.x, posToRoot.y + p.shift.y, posToRoot.z + p.shift.z);		
		}
		let rootObject3D = thatS3dHelper.manager.viewer.getRootObject3D(); 
		rootObject3D.add(helper2D);
		thatS3dHelper.nodeId2HelperObject3D[p.nodeId] = helper2D;
		/*
		$("#" + thatS3dHelper.containerId).find(".s3dHelperLink").click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dHelper.onHelperClick({
				nodeId: nodeId	
			});
		});
		*/
	}
	
	//添加标注
	this.addHelperByPosition = function(p){ 
		let existHelper3D = thatS3dHelper.nodeId2HelperObject3D[p.nodeId];
		if(existHelper3D != null){
			thatS3dHelper.removeHelper(p);
		}
		p.helperId = cmnPcr.getRandomValue();
		let helperHtml = p.linkUrl == null ? thatS3dHelper.getHelperHtml(p) : thatS3dHelper.getHelperWithLinkHtml(p);
		$("#" + thatS3dHelper.containerId).find(".s3dHelperLayerContainer").append(helperHtml);
		let helperDiv = $("#" + p.helperId)[0]; 
		let helper2D = new THREE.CSS2DObject(helperDiv);
		helper2D.isHelper = true; 
		helper2D.position.set(p.position.x, p.position.y, p.position.z);		
		let rootObject3D = thatS3dHelper.manager.viewer.getRootObject3D(); 
		rootObject3D.add(helper2D);
		thatS3dHelper.nodeId2HelperObject3D[p.nodeId] = helper2D;
		/*
		$("#" + thatS3dHelper.containerId).find(".s3dHelperLink").click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dHelper.onHelperClick({
				nodeId: nodeId	
			});
		});
		*/
	}
	
	this.removeHelper = function(p){
		let existHelper3D = thatS3dHelper.nodeId2HelperObject3D[p.nodeId];
		if(existHelper3D != null){
			let rootObject3D = thatS3dHelper.manager.viewer.getRootObject3D(); 
			rootObject3D.remove(existHelper3D);
			delete thatS3dHelper.nodeId2HelperObject3D[p.nodeId];			
		}
	}
	
	//获取helper html
	this.getHelperHtml = function(p){  
		return  "<div class=\"s3dHelperContainer\" id=\"" + p.helperId + "\" nodeId=\"" + p.nodeId + "\">"
		 	+ "<div class=\"s3dHelperBackground\"></div>"
		 	+ "<div class=\"s3dHelperContent\">" + cmnPcr.htmlEncode(p.content) + "</div>"
			+ "</div>";
	}
	
	//获取helper html
	this.getHelperWithLinkHtml = function(p){
		return "<div class=\"s3dHelperContainer\" id=\"" + p.helperId + "\" nodeId=\"" + p.nodeId + "\">"
		 	+ "<div class=\"s3dHelperBackground\"></div>"
		 	+ "<div class=\"s3dHelperContentWithLink\"><a class=\"s3dHelperLink\">" + cmnPcr.htmlEncode(p.content) + "</a></div>"
			+ "</div>";
	}
	
	this.initContainer = function(){
		let html = "<div class=\"s3dHelperLayerContainer\"></div>"
		$("#" + thatS3dHelper.containerId).append(html);
	}
}
export default S3dHelper