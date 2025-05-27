import {cmnPcr, paramType, s3dTextDirections} from "../../../commonjs/common/common.js";
export const tagComponentList = [
	{
		code: "Tag-LinePointText",
		name: "点线文字标注",
		versionNum: "1.0",
		isInternal: true,
		image: "LinePointTextTag.png",
		position: [0, 0.5, 0],
		rotation: [0, 0, 0],
		hasSystemInfo: {
			position: true,
			rotation: true,
			scale: true
		},
		parameters: {
			text: {
				name: "text",
				label: "显示文字",
				description: "显示文字",
				isEditable: true,
				defaultValue: "标注示例",
				paramType: paramType.string
			},
			fontSize: {
				name: "fontSize",
				label: "字号",
				description: "字号",
				isEditable: true,
				defaultValue: 25,
				paramType: paramType.decimal,
				minValue: 1,
				stepValue: 1
			},
			lineLength: {
				name: "lineLength",
				label: "线长度（像素）",
				description: "文字与点之间的连接线长度，为像素数",
				isEditable: true,
				defaultValue: 200,
				paramType: paramType.decimal,
				minValue: 0,
				stepValue: 1
			},
			rotation: {
				name: "rotation",
				label: "旋转角度",
				description: "旋转角度",
				isEditable: true,
				defaultValue: 0,
				paramType: paramType.decimal,
				stepValue: 1
			},
			lineColor: {
				name: "lineColor",
				label: "线颜色",
				description: "文字与点之间的连接线颜色",
				isEditable: true,
				defaultValue: "888888",
				paramType: paramType.color
			},
			pointRadius: {
				name: "pointRadius",
				label: "圆点半经（像素）",
				description: "圆点半经，为像素数",
				isEditable: true,
				defaultValue: 5,
				paramType: paramType.decimal,
				minValue: 1,
				stepValue: 1
			},
			pointColor: {
				name: "pointColor",
				label: "圆点颜色",
				description: "指示点的颜色",
				isEditable: true,
				defaultValue: "FFFFFF",
				paramType: paramType.color
			},
			textColor: {
				name: "textColor",
				label: "文字颜色",
				description: "文字的颜色",
				isEditable: true,
				defaultValue: "FFFFFF",
				paramType: paramType.color
			},
			fontFamily: {
				name: "fontFamily",
				label: "字体",
				description: "字体",
				isEditable: true,
				defaultValue: "KaiTi",
				paramType: paramType.string,
				listValues: cmnPcr.getSortedWebFonts()
			},
			textDirection: {
				name: "textDirection",
				label: "文字方向",
				description: "文字方向",
				isEditable: true,
				defaultValue: "Horizontal",
				paramType: paramType.string,
				listValues: s3dTextDirections
			},
			letterSpacing: {
				name: "letterSpacing",
				label: "字间距",
				description: "字间距",
				isEditable: true,
				defaultValue: 1,
				paramType: paramType.decimal,
				minValue: 0,
				stepValue: 0.1
			},
			bold: {
				name: "bold",
				label: "字体加粗",
				description: "字体加粗",
				isEditable: true,
				defaultValue: false,
				paramType: paramType.boolean
			}
		},
		groups: [
			{
				name: "文字信息",
				parameters: [
					"text",
					"fontFamily",
					"fontSize",
					"letterSpacing",
					"textDirection",
					"textColor",
					"bold"
				]
			},
			{
				name: "连接线信息",
				parameters: [
					"lineLength",
					"lineColor",
					"rotation"
				]
			},
			{
				name: "圆点信息",
				parameters: [
					"pointRadius",
					"pointColor"
				]
			}
		]
	},
	{
		code: "Tag-TextOnly",
		name: "文字标注",
		versionNum: "1.0",
		isInternal: true,
		image: "TextOnlyTag.png",
		position: [0, 0.5, 0],
		rotation: [0, 0, 0],
		hasSystemInfo: {
			position: true,
			rotation: true,
			scale: true
		},
		parameters: {
			text: {
				name: "text",
				label: "显示文字",
				description: "显示文字",
				isEditable: true,
				defaultValue: "标注示例",
				paramType: paramType.string
			},
			fontSize: {
				name: "fontSize",
				label: "文字大小",
				description: "文字大小",
				isEditable: true,
				defaultValue: 0.5,
				paramType: paramType.decimal,
				minValue: 0,
				stepValue: 0.1
			},
			textColor: {
				name: "textColor",
				label: "文字颜色",
				description: "文字的颜色",
				isEditable: true,
				defaultValue: "FFFFFF",
				paramType: paramType.color
			},
			fontFamily: {
				name: "fontFamily",
				label: "字体",
				description: "字体",
				isEditable: true,
				defaultValue: "KaiTi",
				paramType: paramType.string,
				listValues: cmnPcr.getSortedWebFonts()
			},
			textDirection: {
				name: "textDirection",
				label: "文字方向",
				description: "文字方向",
				isEditable: true,
				defaultValue: "Horizontal",
				paramType: paramType.string,
				listValues: s3dTextDirections
			},
			letterSpacing: {
				name: "letterSpacing",
				label: "字间距",
				description: "字间距",
				isEditable: true,
				defaultValue: 0,
				paramType: paramType.decimal,
				minValue: 0,
				stepValue: 0.1
			},
			bold: {
				name: "bold",
				label: "粗体",
				description: "粗体",
				isEditable: true,
				defaultValue: false,
				paramType: paramType.boolean
			}
		},
		groups: [
			{
				name: "文字信息",
				parameters: [
					"text",
					"fontFamily",
					"fontSize",
					"letterSpacing",
					"textDirection",
					"textColor",
					"bold"
				]
			}
		]
	},
	{
		code: "Tag-DistanceText",
		name: "距离标注",
		versionNum: "1.0",
		isInternal: true,
		image: "DistanceTextTag.png",
		position: [0, 0.5, 0],
		rotation: [0, 0, 0],
		hasSystemInfo: {
			position: true,
			rotation: true,
			scale: true
		},
		parameters: {
			text: {
				name: "text",
				label: "显示文字",
				description: "显示文字",
				isEditable: true,
				defaultValue: "标注示例",
				paramType: paramType.string
			},
			fontSize: {
				name: "fontSize",
				label: "文字大小",
				description: "文字大小",
				isEditable: true,
				defaultValue: 0.5,
				paramType: paramType.decimal,
				minValue: 0,
				stepValue: 0.1
			},
			textColor: {
				name: "textColor",
				label: "文字颜色",
				description: "文字的颜色",
				isEditable: true,
				defaultValue: "FFFFFF",
				paramType: paramType.color
			},
			terminalLineLength: {
				name: "terminalLineLength",
				label: "端线长度",
				description: "端线长度",
				isEditable: true,
				defaultValue: 0.5,
				paramType: paramType.decimal,
				minValue: 0,
				stepValue: 0.1
			},
			terminalLineColor: {
				name: "terminalLineColor",
				label: "端线颜色",
				description: "端线的颜色",
				isEditable: true,
				defaultValue: "FFFFFF",
				paramType: paramType.color
			},
			lineLength: {
				name: "lineLength",
				label: "距离线长度",
				description: "距离线长度",
				isEditable: true,
				defaultValue: 2,
				paramType: paramType.decimal,
				minValue: 0,
				stepValue: 0.1
			},
			lineColor: {
				name: "lineColor",
				label: "距离线颜色",
				description: "距离线的颜色",
				isEditable: true,
				defaultValue: "FFFFFF",
				paramType: paramType.color
			},
			fontFamily: {
				name: "fontFamily",
				label: "字体",
				description: "字体",
				isEditable: true,
				defaultValue: "KaiTi",
				paramType: paramType.string,
				listValues: cmnPcr.getSortedWebFonts()
			},
			letterSpacing: {
				name: "letterSpacing",
				label: "字间距",
				description: "字间距",
				isEditable: true,
				defaultValue: 0,
				paramType: paramType.decimal,
				minValue: 0,
				stepValue: 0.1
			},
			bold: {
				name: "bold",
				label: "粗体",
				description: "粗体",
				isEditable: true,
				defaultValue: false,
				paramType: paramType.boolean
			}
		},
		groups: [
			{
				name: "文字信息",
				parameters: [
					"text",
					"fontFamily",
					"fontSize",
					"letterSpacing",
					"textColor",
					"bold"
				]
			},
			{
				name: "距离线信息",
				parameters: [
					"lineLength",
					"lineColor"
				]
			},
			{
				name: "端线信息",
				parameters: [
					"terminalLineLength",
					"terminalLineColor"
				]
			}
		]
	}
];