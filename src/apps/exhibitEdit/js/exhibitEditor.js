import "../../../commonjs/jQuery/jquery.min.js";
import "../../../commonjs/common/common.js"
import {editorLayoutConfig} from "./config/editorLayoutConfig.js";
import S3dExhibitEditor from "./s3dExhibitEditor.js";
import {cmnPcr, msgBox, serverAccess} from "../../../commonjs/common/common.js";

const editorInfo = {
	app:{
		key: "1600ad87-e6db-4583-8428-4e0038731b3f",
		name: "ExhibitEditor"
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
	let editor = new S3dExhibitEditor();
	editor.init({
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
		layoutConfig: editorLayoutConfig
	});
}

initEditor();