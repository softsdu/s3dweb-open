import {cmnPcr, msgBox, s3dMaterialEditType} from "../../commonjs/common/common.js"
import "./s3dSkyBoxSetting.css"

//S3dSetting 配置
let S3dSkyBoxSetting = function (){
	//当前对象
	const thatS3dSetting = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;  
	
	//title
	this.title = null; 

	this.settings = {};

	this.skyMap = null;

	//初始化
	this.init = function(p){
		thatS3dSetting.containerId = p.containerId;
		thatS3dSetting.manager = p.manager;
		thatS3dSetting.title = p.config.title == null ? "天空盒配置" : p.config.title;
		thatS3dSetting.skyMap = p.config.skyMap;
	}
	 
	//initHtml
	this.initHtml = function(){
		let winHtml = thatS3dSetting.getWinHtml();
		$("#" + thatS3dSetting.containerId).append(winHtml);	 
	}

	this.close = function (){
		let container = $("#" + thatS3dSetting.containerId);
		$(container).find(".s3dSkyBoxSettingContainer").remove();
	}
	
	//隐藏
	this.show = function(p) {
		let container = $("#" + thatS3dSetting.containerId);
		const afterSetSkyBox = p.afterSetSkyBox;
		thatS3dSetting.initHtml();
		$(container).find(".s3dSkyBoxSettingTitle").text(thatS3dSetting.title);
		$(container).find(".s3dSkyBoxSettingCloseBtn").click(function () {
			thatS3dSetting.close();
		});
		$(container).find(".s3dSkyBoxSettingBottomButton[name='cancel']").click(function () {
			thatS3dSetting.close();
		});
		$(container).find(".s3dSkyBoxSettingBottomButton[name='ok']").click(function () {
			let values = thatS3dSetting.getValues();
			thatS3dSetting.close();
			afterSetSkyBox(values);
		});

		//选择图片按钮
		let imagePickerBtn = $(container).find(".s3dSkyBoxSettingItemBtnImagePicker");
		$(imagePickerBtn).click(function (e) {
			let inputElement = $(this).parent().children(".s3dSkyBoxSettingItemInput");
			let propertyName = $(inputElement).attr("name");
			let imageName = $(inputElement).val();

			thatS3dSetting.manager.localImagePicker.showPicker({
				paramInfo: {
					propertyName: propertyName,
					imageUrl: imageName,
					afterPickImage: thatS3dSetting.afterPickImage
				}
			});
		});

		//参数值录入框，数值类型
		let allDecimalInputs = $(container).find(".s3dSkyBoxSettingItemDecimal");
		$(allDecimalInputs).bind("keypress", function (e) {
			return e.key >= '0' && e.key <= '9' || e.key === '.' || e.key === '-';
		});
		$(allDecimalInputs).bind("dragenter", function (e) {
			return false;
		});
		$(allDecimalInputs).change(function (e) {
			thatS3dSetting.changeDecimalValue(this);
		});

		thatS3dSetting.refreshValues(p.skyInfo);
	}

	this.afterPickImage = function (p){
		let newImageUrl = p.imageUrl;
		let propertyName  = p.paramInfo.propertyName;
		let container = $("#" + thatS3dSetting.containerId).find(".s3dSkyBoxSettingContainer")[0];
		let input = $(container).find(".s3dSkyBoxSettingItemInput[name='" + propertyName + "']")[0];
		$(input).val(newImageUrl);
	}

	this.getValues = function(){		
		let container = $("#" + thatS3dSetting.containerId).find(".s3dSkyBoxSettingContainer")[0];
		let name = $(container).find(".s3dSkyBoxSettingItemInput[name='name']").val().trim();

		let backgroundColorStr = $(container).find(".s3dSkyBoxSettingItemInput[name='backgroundColor']").val();
		let backgroundColor = common3DFunction.stringToRGBInt(backgroundColorStr.substr(1));

		let backgroundImage = $(container).find(".s3dSkyBoxSettingItemInput[name='backgroundImage']").val();

		let scale = cmnPcr.strToDecimal($(container).find(".s3dSkyBoxSettingItemInput[name='scale']").val());
		let rotation = common3DFunction.degree2radian(cmnPcr.strToDecimal($(container).find(".s3dSkyBoxSettingItemInput[name='rotation']").val()), thatS3dSetting.manager.viewer.distanceRatio);

		return {
			name: name,
			scale: scale,
			rotation: rotation,
			backgroundColor: backgroundColor,
			backgroundImage:backgroundImage
		};
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

	this.refreshValues = function(skyInfo){
		let container = $("#" + thatS3dSetting.containerId).find(".s3dSkyBoxSettingContainer")[0];

		$(container).find(".s3dSkyBoxSettingItemInput[name='name']").val(skyInfo.name);
		$(container).find(".s3dSkyBoxSettingItemInput[name='scale']").val(skyInfo.scale);

		let backgroundColorStr = cmnPcr.getColorStr(skyInfo.backgroundColor);
		$(container).find(".s3dSkyBoxSettingItemInput[name='backgroundColor']").val(backgroundColorStr);
		$(container).find(".s3dSkyBoxSettingItemInput[name='backgroundImage']").val(skyInfo.backgroundImage);

		$(container).find(".s3dSkyBoxSettingItemInput[name='scale']").val(skyInfo.scale);
		$(container).find(".s3dSkyBoxSettingItemInput[name='rotation']").val(common3DFunction.radian2degree(skyInfo.rotation));
	}

	this.getSkyNameOptions = function(){
		let optionsHtml = "";
		for(let name in thatS3dSetting.skyMap){
			optionsHtml += ("<option value='" + name + "'>" + name + "</option>");
		}
		return optionsHtml;
	}
	
	//获取html
	this.getWinHtml = function(){
		return  "<div class=\"s3dSkyBoxSettingContainer\">"
			+ "<div class=\"s3dSkyBoxSettingBackground\"></div>"
			+ "<div class=\"s3dSkyBoxSettingOuterContainer\">"
			+ "<div class=\"s3dSkyBoxSettingHeader\">"
			+ "<div class=\"s3dSkyBoxSettingTitle\"></div>"
			+ "<div class=\"s3dSkyBoxSettingCloseBtn\">×</div>"
			+ "</div>"
			+ "<div class=\"s3dSkyBoxSettingInnerContainer\">"
			+ "<div class=\"s3dSkyBoxSettingItemContainer\">"
			+ "<div class=\"s3dSkyBoxSettingItemTitle\">名称</div>"
			+ "<div class=\"s3dSkyBoxSettingItemValue\"><select name=\"name\" class=\"s3dSkyBoxSettingItemInput s3dSettingItemString\" >"
			+ thatS3dSetting.getSkyNameOptions()
			+ "</select></div>"
			+ "</div>"
			+ "<div class=\"s3dSkyBoxSettingItemContainer\">"
			+ "<div class=\"s3dSkyBoxSettingItemTitle\">缩放</div>"
			+ "<div class=\"s3dSkyBoxSettingItemValue\"><input type=\"number\" name=\"scale\" class=\"s3dSkyBoxSettingItemInput\" /></div>"
			+ "</div>"
			+ "<div class=\"s3dSkyBoxSettingItemContainer\">"
			+ "<div class=\"s3dSkyBoxSettingItemTitle\">背景色</div>"
			+ "<div class=\"s3dSkyBoxSettingItemValue\"><input type=\"color\" name=\"backgroundColor\" class=\"s3dSkyBoxSettingItemInput s3dSkyBoxSettingItemInputColor\" /></div>"
			+ "</div>"
			+ "<div class=\"s3dSkyBoxSettingItemContainer\">"
			+ "<div class=\"s3dSkyBoxSettingItemTitle\">背景图</div>"
			+ "<div class=\"s3dSkyBoxSettingItemValue\">"
			+ "<input type=\"text\" name=\"backgroundImage\" class=\"s3dSkyBoxSettingItemInput s3dSkyBoxSettingItemInputPop\" />"
			+ "<div class=\"s3dSkyBoxSettingItemBtnPop s3dSkyBoxSettingItemBtnImagePicker\"></div>"
			+ "</div>"
			+ "</div>"
			+ "<div class=\"s3dSkyBoxSettingItemContainer\">"
			+ "<div class=\"s3dSkyBoxSettingItemTitle\">旋转</div>"
			+ "<div class=\"s3dSkyBoxSettingItemValue\"><input type=\"number\" name=\"rotation\" class=\"s3dSkyBoxSettingItemInput\" /></div>"
			+ "</div>"
			+ "<div class=\"s3dSkyBoxSettingBottomContainer\">"
			+ "<div class=\"s3dSkyBoxSettingBottomButton\" name=\"cancel\">取消</div>"
			+ "<div class=\"s3dSkyBoxSettingBottomButton\" name=\"ok\">确定</div>"
			+ "</div>"
			+ "</div>"
			+ "</div>"
			+ "</div>";
	}
}
export default S3dSkyBoxSetting