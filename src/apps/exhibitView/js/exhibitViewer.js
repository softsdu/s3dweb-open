import "../../../commonjs/jQuery/jquery.min.js";
import {viewerLayoutConfig} from "./config/viewerLayoutConfig.js";
import S3dExhibitViewer from "./s3dExhibitViewer.js";
import {cmnPcr} from "../../../commonjs/common/common.js";


const viewerInfo = {
	app:{
		key: "1600ad87-e6db-4583-8428-4e0038731b3c",
		name: "ExhibitViewer"
	},
	ui: {
		containerId: "mainContainerId"
	}
};

function initViewer(){
	let modelId = getModelIdFromArgs();
	let userId = getUserIdFromArgs();
	createViewer({
		modelId: modelId,
		userId: userId
	});
}

function getModelIdFromArgs(){
	let args = cmnPcr.getQueryStringArgs();
	return args["model"];
}
function getUserIdFromArgs(){
	let args = cmnPcr.getQueryStringArgs();
	return args["user"];
}

function createViewer(p) {
	let viewer = new S3dExhibitViewer();
	viewer.init({
		containerId: viewerInfo.ui.containerId,
		timestamp: "20250206",
		app:{
			key: viewerInfo.app.key,
			name: viewerInfo.app.name
		},
		model: {
			id: p.modelId
		},
		user: {
			id: p.userId
		},
		layoutConfig: viewerLayoutConfig
	});
}

initViewer();