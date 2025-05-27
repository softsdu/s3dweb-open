import {cmnPcr, msgBox} from "../../commonjs/common/common.js"
import "./s3dSetting.css"

//S3dSetting 配置
let S3dSetting = function (){
	//当前对象
	const thatS3dSetting = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;  
	
	//title
	this.title = null; 

	this.settings = {};

	//初始化
	this.init = function(p){
		thatS3dSetting.containerId = p.containerId;
		thatS3dSetting.manager = p.manager;
		thatS3dSetting.title = p.config.title == null ? "配置" : p.config.title;
	}
	 
	//initHtml
	this.initHtml = function(){
		let winHtml = thatS3dSetting.getWinHtml();
		$("#" + thatS3dSetting.containerId).append(winHtml);	 
	}  

	this.getCurrentCameraInfo = function(){
		let container = $("#" + thatS3dSetting.containerId).find(".s3dSettingContainer")[0];

		let cameraInfo = thatS3dSetting.manager.viewer.getCurrentCameraInfo();
		$(container).find(".s3dSettingItemInput[name='cameraTarget']").val(
			common3DFunction.s2v(cameraInfo.target[0], thatS3dSetting.manager.viewer.distanceRatio).toFixed(0) + ", " +
			common3DFunction.s2v(cameraInfo.target[1], thatS3dSetting.manager.viewer.distanceRatio).toFixed(0) + ", " +
			common3DFunction.s2v(cameraInfo.target[2], thatS3dSetting.manager.viewer.distanceRatio).toFixed(0));
		$(container).find(".s3dSettingItemInput[name='cameraPosition']").val(
			common3DFunction.s2v(cameraInfo.position[0], thatS3dSetting.manager.viewer.distanceRatio).toFixed(0) + ", " +
			common3DFunction.s2v(cameraInfo.position[1], thatS3dSetting.manager.viewer.distanceRatio).toFixed(0) + ", " +
			common3DFunction.s2v(cameraInfo.position[2], thatS3dSetting.manager.viewer.distanceRatio).toFixed(0));
		$(container).find(".s3dSettingItemInput[name='cameraZoom']").val(cameraInfo.zoom.toFixed(2));
	}
    	
	//隐藏
	this.hide = function(){
		$("#" + thatS3dSetting.containerId).find(".s3dSettingContainer").css({"display": "none"});
	}
	
	//获取显示状态
	this.getVisible = function(){
		return $("#" + thatS3dSetting.containerId).find(".s3dSettingContainer").css("display") === "block";
	}
	
	//隐藏
	this.show = function(){
		let container = $("#" + thatS3dSetting.containerId);
		if($(container).find(".s3dSettingContainer").length === 0){
			thatS3dSetting.initHtml(); 
			$(container).find(".s3dSettingTitle").text(thatS3dSetting.title);
			$(container).find(".s3dSettingCloseBtn").click(function(){
				thatS3dSetting.hide();
			});
			$(container).find(".s3dSettingBottomButton[name='cancel']").click(function(){
				thatS3dSetting.hide();
			});
			$(container.find(".s3dSettingBottomButton[name='ok']")).click(function(){
				if(thatS3dSetting.save()) {
					thatS3dSetting.hide();
				}
			});
			$(container).find(".s3dSettingGroupButton[name='getCurrentCameraInfo']").click(function(){
				thatS3dSetting.getCurrentCameraInfo();
			});

			//参数值录入框，数值类型
			let allDecimalInputs = $(container).find(".s3dSettingItemDecimal");
			$(allDecimalInputs).bind("keypress", function(e) {
				return e.key >= '0' && e.key <= '9' || e.key === '.' || e.key === '-';
			}); 
			$(allDecimalInputs).bind("dragenter", function(e) {
				return false;
			});  
			$(allDecimalInputs).change( function(e) {
				thatS3dSetting.changeDecimalValue(this);
			}); 

		}
		$(container).find(".s3dSettingContainer").css({"display": "block"});
		
		thatS3dSetting.refreshValues();
	}

	this.getValues = function(){		
		let container = $("#" + thatS3dSetting.containerId).find(".s3dSettingContainer")[0];
		let targetStr = $(container).find(".s3dSettingItemInput[name='cameraTarget']").val();
		let positionStr = $(container).find(".s3dSettingItemInput[name='cameraPosition']").val();
		let zoomStr = $(container).find(".s3dSettingItemInput[name='cameraZoom']").val();
		let cameraType = $(container).find(".s3dSettingItemInput[name='cameraType']").val();
		let cameraInfo = null;
		if(targetStr.length !== 0){
			let targetStrs = targetStr.split(",");
			let positionStrs = positionStr.split(",");
			cameraInfo = {
				type: cameraType,
				target: [
					common3DFunction.v2s(cmnPcr.strToDecimal(targetStrs[0]), thatS3dSetting.manager.viewer.distanceRatio),
					common3DFunction.v2s(cmnPcr.strToDecimal(targetStrs[1]), thatS3dSetting.manager.viewer.distanceRatio),
					common3DFunction.v2s(cmnPcr.strToDecimal(targetStrs[2]), thatS3dSetting.manager.viewer.distanceRatio)
				],
				position: [
					common3DFunction.v2s(cmnPcr.strToDecimal(positionStrs[0]), thatS3dSetting.manager.viewer.distanceRatio),
					common3DFunction.v2s(cmnPcr.strToDecimal(positionStrs[1]), thatS3dSetting.manager.viewer.distanceRatio),
					common3DFunction.v2s(cmnPcr.strToDecimal(positionStrs[2]), thatS3dSetting.manager.viewer.distanceRatio)
				],
				zoom: cmnPcr.strToDecimal(zoomStr)
			};
		}

		let modelName = $(container).find(".s3dSettingItemInput[name='modelName']").val().trim();

		let axisSizeX = common3DFunction.v2s(cmnPcr.strToDecimal($(container).find(".s3dSettingItemInput[name='axisSizeX']").val()), thatS3dSetting.manager.viewer.distanceRatio);
		let axisSizeY = common3DFunction.v2s(cmnPcr.strToDecimal($(container).find(".s3dSettingItemInput[name='axisSizeY']").val()), thatS3dSetting.manager.viewer.distanceRatio);
		let axisSizeZ = common3DFunction.v2s(cmnPcr.strToDecimal($(container).find(".s3dSettingItemInput[name='axisSizeZ']").val()), thatS3dSetting.manager.viewer.distanceRatio);
		let gridSpace = common3DFunction.v2s(cmnPcr.strToDecimal($(container).find(".s3dSettingItemInput[name='gridSpace']").val()), thatS3dSetting.manager.viewer.distanceRatio);
		let fontSize = common3DFunction.v2s(cmnPcr.strToDecimal($(container).find(".s3dSettingItemInput[name='fontSize']").val()), thatS3dSetting.manager.viewer.distanceRatio);

		return {
			modelName: modelName,
			cameraInfo: cameraInfo,
			axisInfo: {
				size: {
					x: axisSizeX,
					y: axisSizeY,
					z: axisSizeZ,
				},
				gridSpace: gridSpace,
				fontSize: fontSize
			}
		};
	}
	this.save = function(){
		let values = thatS3dSetting.getValues();
		let errorInfo = "";
		if(values.modelName.length === 0){
			errorInfo += "'模型名称'不可为空.\r\n";
		}
		if(errorInfo.length > 0){
			msgBox.alert({info: errorInfo});
			return false;
		}
		else{
			thatS3dSetting.manager.viewer.setModelName(values.modelName);
			thatS3dSetting.manager.viewer.setCameraInfo(values.cameraInfo);
			thatS3dSetting.manager.axis.setAxisInfo(values.axisInfo);
			return true;
		}
	}

	this.changeDecimalValue = function(inputCtrl){
		let propertyName = $(inputCtrl).attr("name");
		let precision = parseInt($(inputCtrl).attr("precision"));
		let propertyValueStr = $(inputCtrl).val().trim(); 
		if(propertyValueStr.length > 0){
			let propertyValue = cmnPcr.strToDecimal(propertyValueStr);
			propertyValue = cmnPcr.toFixed(propertyValue, precision);
			$(inputCtrl).val(propertyValue);
		}
	}

	this.refreshValues = function(){
		let container = $("#" + thatS3dSetting.containerId).find(".s3dSettingContainer")[0];

		let cameraInfo = thatS3dSetting.manager.viewer.getCameraInfo();
		$(container).find(".s3dSettingItemInput[name='cameraType']").val(cameraInfo.type);
		$(container).find(".s3dSettingItemInput[name='cameraTarget']").val(common3DFunction.s2v(cameraInfo.target[0], thatS3dSetting.manager.viewer.distanceRatio)
			+ ", " + common3DFunction.s2v(cameraInfo.target[1], thatS3dSetting.manager.viewer.distanceRatio)
			+ ", " + common3DFunction.s2v(cameraInfo.target[2], thatS3dSetting.manager.viewer.distanceRatio));
		$(container).find(".s3dSettingItemInput[name='cameraPosition']").val(common3DFunction.s2v(cameraInfo.position[0], thatS3dSetting.manager.viewer.distanceRatio)
			+ ", " + common3DFunction.s2v(cameraInfo.position[1], thatS3dSetting.manager.viewer.distanceRatio)
			+ ", " + common3DFunction.s2v(cameraInfo.position[2], thatS3dSetting.manager.viewer.distanceRatio));
		$(container).find(".s3dSettingItemInput[name='cameraZoom']").val(cameraInfo.zoom);


		let modelName = thatS3dSetting.manager.s3dObject.name;
		$(container).find(".s3dSettingItemInput[name='modelName']").val(modelName)

		let axisInfo = thatS3dSetting.manager.s3dObject.axis;
		$(container).find(".s3dSettingItemInput[name='axisSizeX']").val(common3DFunction.s2v(axisInfo.size.x, thatS3dSetting.manager.viewer.distanceRatio));
		$(container).find(".s3dSettingItemInput[name='axisSizeY']").val(common3DFunction.s2v(axisInfo.size.y, thatS3dSetting.manager.viewer.distanceRatio));
		$(container).find(".s3dSettingItemInput[name='axisSizeZ']").val(common3DFunction.s2v(axisInfo.size.z, thatS3dSetting.manager.viewer.distanceRatio));
		$(container).find(".s3dSettingItemInput[name='gridSpace']").val(common3DFunction.s2v(axisInfo.gridSpace, thatS3dSetting.manager.viewer.distanceRatio));
		$(container).find(".s3dSettingItemInput[name='fontSize']").val(common3DFunction.s2v(axisInfo.fontSize, thatS3dSetting.manager.viewer.distanceRatio));
	}

	//获取html
	this.getWinHtml = function(){
		return  "<div class=\"s3dSettingContainer\">"
			+ "<div class=\"s3dSettingBackground\"></div>"
			+ "<div class=\"s3dSettingOuterContainer\">"
			+ "<div class=\"s3dSettingHeader\">"
			+ "<div class=\"s3dSettingTitle\"></div>"
			+ "<div class=\"s3dSettingCloseBtn\">×</div>"
			+ "</div>"
			+ "<div class=\"s3dSettingInnerContainer\">"
			+ "<div class=\"s3dSettingItemGroupContainer\">"
			+ "<div class=\"s3dSettingItemGroupTitle\">基本信息</div>"
			+ "</div>"
			+ "<div class=\"s3dSettingItemContainer\">"
			+ "<div class=\"s3dSettingItemTitle\">模型名称</div>"
			+ "<div class=\"s3dSettingItemValue\"><input type=\"text\" name=\"modelName\" class=\"s3dSettingItemInput s3dSettingItemString\" /></div>"
			+ "</div>"
			+ "<div class=\"s3dSettingItemGroupContainer\">"
			+ "<div class=\"s3dSettingItemGroupTitle\">网格</div>"
			+ "</div>"
			+ "<div class=\"s3dSettingItemContainer\">"
			+ "<div class=\"s3dSettingItemTitle\">X</div>"
			+ "<div class=\"s3dSettingItemValue\"><input type=\"number\" name=\"axisSizeX\" min=\"1\" class=\"s3dSettingItemInput s3dSettingItemString\"></input></div>"
			+ "</div>"
			+ "<div class=\"s3dSettingItemContainer\">"
			+ "<div class=\"s3dSettingItemTitle\">Y</div>"
			+ "<div class=\"s3dSettingItemValue\"><input type=\"number\" name=\"axisSizeY\" min=\"1\" class=\"s3dSettingItemInput s3dSettingItemString\"></input></div>"
			+ "</div>"
			+ "<div class=\"s3dSettingItemContainer\">"
			+ "<div class=\"s3dSettingItemTitle\">Z</div>"
			+ "<div class=\"s3dSettingItemValue\"><input type=\"number\" name=\"axisSizeZ\" min=\"1\" class=\"s3dSettingItemInput s3dSettingItemString\"></input></div>"
			+ "</div>"
			+ "<div class=\"s3dSettingItemContainer\">"
			+ "<div class=\"s3dSettingItemTitle\">间隔大小</div>"
			+ "<div class=\"s3dSettingItemValue\"><input type=\"number\" name=\"gridSpace\" min=\"1\" class=\"s3dSettingItemInput s3dSettingItemString\"></input></div>"
			+ "</div>"
			+ "<div class=\"s3dSettingItemContainer\">"
			+ "<div class=\"s3dSettingItemTitle\">字体大小</div>"
			+ "<div class=\"s3dSettingItemValue\"><input type=\"number\" name=\"fontSize\" min=\"1\" class=\"s3dSettingItemInput s3dSettingItemString\"></input></div>"
			+ "</div>"
			+ "<div class=\"s3dSettingItemGroupContainer\">"
			+ "<div class=\"s3dSettingItemGroupTitle\">初始视角</div>"
			+ "<div name=\"getCurrentCameraInfo\" class=\"s3dSettingGroupButton\">获取当前视角</div>"
			+ "</div>"
			+ "<div class=\"s3dSettingItemContainer\">"
			+ "<div class=\"s3dSettingItemTitle\">投影类型</div>"
			+ "<div class=\"s3dSettingItemValue\"><select name=\"cameraType\" class=\"s3dSettingItemInput s3dSettingItemString\" >"
			+ "<option value='Orthographic'>Orthographic</option>"
			+ "<option value='Perspective'>Perspective</option>"
			+ "</select></div>"
			+ "</div>"
			+ "<div class=\"s3dSettingItemContainer\">"
			+ "<div class=\"s3dSettingItemTitle\">目标坐标</div>"
			+ "<div class=\"s3dSettingItemValue\"><input type=\"text\" placeholder=\"未指定\" name=\"cameraTarget\" readonly=\"readonly\" class=\"s3dSettingItemInput s3dSettingItemReadonly\" /></div>"
			+ "</div>"
			+ "<div class=\"s3dSettingItemContainer\">"
			+ "<div class=\"s3dSettingItemTitle\">摄像机坐标</div>"
			+ "<div class=\"s3dSettingItemValue\"><input type=\"text\" placeholder=\"未指定\" name=\"cameraPosition\" readonly=\"readonly\" class=\"s3dSettingItemInput s3dSettingItemReadonly\" /></div>"
			+ "</div>"  
			+ "<div class=\"s3dSettingItemContainer\">"
			+ "<div class=\"s3dSettingItemTitle\">缩放</div>"
			+ "<div class=\"s3dSettingItemValue\"><input type=\"text\" placeholder=\"未指定\" name=\"cameraZoom\" readonly=\"readonly\" class=\"s3dSettingItemInput s3dSettingItemReadonly\" /></div>"
			+ "</div>"
			+ "<div class=\"s3dSettingBottomContainer\">"
			+ "<div class=\"s3dSettingBottomButton\" name=\"cancel\">取消</div>"
			+ "<div class=\"s3dSettingBottomButton\" name=\"ok\">确定</div>"
			+ "</div>"  
			+ "</div>"
			+ "</div>"
			+ "</div>";
	}
}
export default S3dSetting