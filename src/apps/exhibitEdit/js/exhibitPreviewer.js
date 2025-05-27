import "../../../commonjs/jQuery/jquery.min.js";
import "../../../commonjs/common/common.js"
import {previewerLayoutConfig} from "./config/previewerLayoutConfig.js";
import S3dExhibitPreviewer from "./s3dExhibitPreviewer.js";
import {cmnPcr, msgBox, serverAccess} from "../../../commonjs/common/common.js";

const editorInfo = {
	app:{
		key: "1600ad87-e6db-4583-8428-4e0038731b3f",
		name: "ExhibitPreviewer"
	},
	ui: {
		containerId: "mainContainerId"
	}
};

function initEditor(){
	let serverRootUrl = getServerRootUrl();
	let modelId = getModelIdFromArgs();
	createEditor({
		serverRootUrl: serverRootUrl,
		modelId: modelId
	});
}

function getServerRootUrl(){
	return $("#" + editorInfo.ui.containerId).attr("serverRootUrl");
}

function getModelIdFromArgs(){
	let args = cmnPcr.getQueryStringArgs();
	return args["modelId"];
}

function createEditor(p) {
	let previewer = new S3dExhibitPreviewer();
	previewer.init({
		containerId: editorInfo.ui.containerId,
		timestamp: "20250206",
		app:{
			key: editorInfo.app.key,
			name: editorInfo.app.name
		},
		server: {
			rootUrl: p.serverRootUrl
		},
		model: {
			id: p.modelId
		},
		layoutConfig: previewerLayoutConfig
	});
}

initEditor();