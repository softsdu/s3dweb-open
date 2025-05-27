import { s3dAnimationEditType, cmnPcr, msgBox, PopupContainer, s3dAnimationGroupType, s3dOperateType } from '../../commonjs/common/common.js';
import * as THREE from "three";
import './S3dAnimationEditor.css';

//编辑动画
let S3dAnimationEditor = function () {
    //当前对象
    const thatAnimationEditor = this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;

    //正在编辑的动画的编码
    this.editingAnimationCode = null;

    //正在编辑的动画的事件信息
    this.editingAnimationEventMap = null;

    //上一步操作的结果
    this.lastOperateInfo = null;

    //一帧的间隔
    this.spanWidth = 1;

    //支持的事件
    this.eventList = [{
        name: "onStart",
        text: "动画开始时",
        parameters: [{
            name: "manager",
            type: "S3dManager"
        }, {
            name: "animationCode",
            type: "String"
        }]
    }, {
        name: "onEnd",
        text: "动画结束时",
        parameters: [{
            name: "manager",
            type: "S3dManager"
        }, {
            name: "animationCode",
            type: "String"
        }]
    }, {
        name: "onFinish",
        text: "动画完成时",
        parameters: [{
            name: "manager",
            type: "S3dManager"
        }, {
            name: "animationCode",
            type: "String"
        }]
    }];

    //支持的属性
    this.propertyList = [{
        name: "position",
        text: "位置"
    }, {
        name: "rotation",
        text: "旋转"
    }, {
        name: "scale",
        text: "缩放"
    }];
    this.keyFrameDragInfo = {
        id: null,
        dragging: false,
        btnCode: null,
        trackCode: null,
        groupCode: null,
        frameIndex: null
    };

    //事件
    this.eventFunctions = {};
    this.addEventFunction = function (eventName, func) {
        let allFuncs = thatAnimationEditor.eventFunctions[eventName];
        if (allFuncs == null) {
            allFuncs = [];
            thatAnimationEditor.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    };
    this.doEventFunction = function (eventName, p) {
        let allFuncs = thatAnimationEditor.eventFunctions[eventName];
        if (allFuncs != null) {
            for (let i = 0; i < allFuncs.length; i++) {
                let func = allFuncs[i];
                func(p);
            }
        }
    };

    //初始化
    this.init = function (p) {
        thatAnimationEditor.containerId = p.containerId;
        thatAnimationEditor.manager = p.manager;
        thatAnimationEditor.showAnimationEditor(p.config.title);

        //关闭时保存并清除界面
        thatAnimationEditor.bindCloseEvent();
    };

    thatAnimationEditor.bindCloseEvent = function (){
        thatAnimationEditor.manager.layout.addEventFunction("beforeHideBlock", function (p){
            thatAnimationEditor.showAnimation(null);
        })
    }

    //显示
    this.showAnimationEditor = function (title) {
        //构造html
        let html = thatAnimationEditor.getHtml();
        let container = $("#" + thatAnimationEditor.containerId);
        let animationEditorContainer = $(container).find(".s3dLayoutBlock[name='animationEditor']");
        $(animationEditorContainer).append(html);

        //toolbar
        let toolbarContainer = $(container).find(".s3dLayoutBlockToolbar[name='animationEditor']");
        let toolbarHtml = thatAnimationEditor.getToolbarHtml();
        $(toolbarContainer).append(toolbarHtml);
        thatAnimationEditor.bindEvents();
    };
    this.setZoomLevel = function (zoomLevel, ev) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let editorTimeLine = $(editContainer).find(".s3dAnimationEditorTimeline");
        let oldZoomLevel = parseInt($(editorTimeLine).attr("zoomLevel"));
        if (zoomLevel !== oldZoomLevel) {
            let classPrefix = "s3dAnimationEditorZoomLevel";
            let lastClass = classPrefix + oldZoomLevel;
            let newClass = classPrefix + zoomLevel;
            $(editorTimeLine).removeClass(lastClass);
            $(editorTimeLine).addClass(newClass);
            $(editorTimeLine).attr("zoomLevel", zoomLevel);
            thatAnimationEditor.refreshSpanWidth();
            thatAnimationEditor.refreshCenterSubContainerWidth(ev);
            thatAnimationEditor.refreshTimeSplitLine();
            thatAnimationEditor.refreshTrackKeyFrame();
            thatAnimationEditor.refreshKeyFrameRange();

            //刷新曲线
            if ($(editContainer).find(".s3dAnimationEditorTabBtnActive").attr("name") === "curve") {
                thatAnimationEditor.refreshCurve();
            }
        }
    };
    this.bindEvents = function () {
        let container = $("#" + thatAnimationEditor.containerId);
        $(container).find(".s3dAnimationEditorInputAnimationName").change(function () {
            thatAnimationEditor.applyAnimation();
        });
        $(container).find(".s3dAnimationEditorTabBtn").click(function () {
            let tabName = $(this).attr("name");
            thatAnimationEditor.switchCenterContainer(tabName);
        });
        $(container).find(".s3dAnimationEditorAddObjectGroupBtn").click(function () {
            thatAnimationEditor.showPopObjectAndObjectPropertyWindow();
        });
        $(container).find(".s3dAnimationEditorAddMaterialGroupBtn").click(function () {
            thatAnimationEditor.showPopObjectAndObjectMaterialWindow();
        });
        $(container).find(".s3dAnimationEditorEditEventBtn").click(function () {
            thatAnimationEditor.showPopEditEventWindow();
        });
        $(container).find(".s3dAnimationEditorAddKeyFrameBtn").click(function () {
            thatAnimationEditor.addKeyFrame();
        });
        $(container).find(".s3dAnimationEditorPreviewBtn").click(function () {
            if ($(this).hasClass("s3dAnimationEditorStopBtn")) {
                thatAnimationEditor.stopAnimation();
            } else {
                thatAnimationEditor.previewAnimation();
            }
        });
        $(container).find(".s3dAnimationEditorToolbarMainCloseBtn").click(function () {
            thatAnimationEditor.closeAnimation(true);
        });
        $(container).find(".s3dAnimationEditorToolbarBtnMainApplyBtn").click(function () {
            thatAnimationEditor.applyAnimation();
        });
        $(container).find(".s3dAnimationEditorToolbarBtnMainOkBtn").click(function () {
            thatAnimationEditor.saveAnimation();
        });

        //left和center竖直同步滚动
        $(container).find(".s3dAnimationEditorLeftInner").scroll(function () {
            thatAnimationEditor.syncScrollLeftInnerAndTrackContainer(this.scrollTop);
        });
        $(container).find(".s3dAnimationEditorSubContainer[name='track']").scroll(function () {
            thatAnimationEditor.syncScrollLeftInnerAndTrackContainer(this.scrollTop);
        });

        //center的header和inner的水平同步滚动
        $(container).find(".s3dAnimationEditorCenterInner").scroll(function () {
            thatAnimationEditor.syncScrollCenterHeaderAndInner(this.scrollLeft);
        });

        //时间轴滚动
        $(container).find(".s3dAnimationEditorCenterInner").bind("mousewheel", function (ev) {
            let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
            let editorTimeLine = $(editContainer).find(".s3dAnimationEditorTimeline");
            let oldZoomLevel = parseInt($(editorTimeLine).attr("zoomLevel"));
            let newZoomLevel = oldZoomLevel;
            if (ev.originalEvent.deltaY > 0) {
                //向下滑动，缩小
                if (oldZoomLevel > 1) {
                    newZoomLevel = oldZoomLevel - 1;
                }
            }
            if (ev.originalEvent.deltaY < 0) {
                //向上滑动，放大,最大设置为7
                if (oldZoomLevel < 7) {
                    newZoomLevel = oldZoomLevel + 1;
                }
            }
            thatAnimationEditor.setZoomLevel(newZoomLevel);
            ev.preventDefault();
        });

        //拖拽移动keyFrameBtn
        $(container).find(".s3dAnimationEditorSubContainer[name='track']").bind("mousemove", function (ev) {
            if (ev.buttons === 1 && thatAnimationEditor.keyFrameDragInfo.dragging) {
                let trackCode = thatAnimationEditor.keyFrameDragInfo.trackCode;
                let xInTrack = ev.clientX - $(this).offset().left;
                let frameIndex = Math.floor(xInTrack / thatAnimationEditor.spanWidth);
                if (thatAnimationEditor.keyFrameDragInfo.frameIndex !== frameIndex) {
                    let value = thatAnimationEditor.getTrackKeyFrameBtnValueByBtnCode(trackCode, thatAnimationEditor.keyFrameDragInfo.btnCode);
                    thatAnimationEditor.updateTrackKeyFrameByBtnCode(thatAnimationEditor.keyFrameDragInfo.btnCode, frameIndex, value);
                    thatAnimationEditor.keyFrameDragInfo.frameIndex = frameIndex;
                    thatAnimationEditor.refreshKeyFrameRange();
                    thatAnimationEditor.addEditingToUndoList(s3dAnimationEditType.editKeyFrameIndex, thatAnimationEditor.keyFrameDragInfo.id);
                }
            } else {
                thatAnimationEditor.keyFrameDragInfo = {
                    id: null,
                    dragging: false,
                    btnCode: null,
                    groupCode: null,
                    trackCode: null,
                    frameIndex: null
                };
            }
        });
    };
    thatAnimationEditor.refreshSpanWidth = function () {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let editorTimeline = $(editContainer).find(".s3dAnimationEditorTimeline");
        thatAnimationEditor.spanWidth = $(editorTimeline).find(".s3dAnimationEditorTimeSpan").width();
    };
    this.stopAnimation = function () {
        thatAnimationEditor.manager.viewer.stopAnimations(true);
        thatAnimationEditor.afterStopAnimation();
        thatAnimationEditor.updateTimeSplitLine(0);
        thatAnimationEditor.refreshViewerObjects(0);
    };
    this.afterStopAnimation = function () {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let previewBtn = $(editContainer).find(".s3dAnimationEditorPreviewBtn");
        $(previewBtn).html("&#9658;");
        $(previewBtn).removeClass("s3dAnimationEditorStopBtn");
    };
    this.refreshTimeSplitLineOnAnimation = function (timeSplitLine, allFrameCount) {
        setTimeout(function () {
            let clock = thatAnimationEditor.manager.viewer.runAnimationInfo.clock;
            let userStop = thatAnimationEditor.manager.viewer.runAnimationInfo.userStop;
            let allFinished = thatAnimationEditor.manager.viewer.runAnimationInfo.allFinished;
            if (allFinished && !userStop) {
                thatAnimationEditor.updateTimeSplitLinePosition(timeSplitLine, allFrameCount);
                thatAnimationEditor.afterStopAnimation();
            }
            else if (clock != null && clock.running) {
                let elapsedTime = clock.elapsedTime;
                let frameIndex = Math.floor(elapsedTime * thatAnimationEditor.manager.userAnimations.defaultFPS) % allFrameCount;
                thatAnimationEditor.updateTimeSplitLinePosition(timeSplitLine, frameIndex);
                thatAnimationEditor.refreshTimeSplitLineOnAnimation(timeSplitLine, allFrameCount);
            }
        }, 100);
    };
    this.previewAnimation = function (loop) {
        thatAnimationEditor.manager.viewer.stopAnimations();
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let previewBtn = $(editContainer).find(".s3dAnimationEditorPreviewBtn");
        $(previewBtn).html("&#9724;");
        $(previewBtn).addClass("s3dAnimationEditorStopBtn");
        let editingInfo = thatAnimationEditor.getEditingInfoFromUI();
        let animationInfo = thatAnimationEditor.convertToAnimationInfo(editingInfo);
        let runJson = thatAnimationEditor.manager.userAnimations.animationInfoToRunJson(animationInfo, animationInfo.originalValueMap);
        let animationClipMap = thatAnimationEditor.manager.userAnimations.generateAnimationClipMap(runJson);
        let mixerActions = [];
        for (let objectId in animationClipMap) {
            let object3d = thatAnimationEditor.manager.viewer.getObject3DById(objectId);
            let animation = animationClipMap[objectId];
            let mixer = new THREE.AnimationMixer(object3d);
            let animationAction = mixer.clipAction(animation);
            animationAction.timeScale = 1;
            animationAction.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
            animationAction.clampWhenFinished = true;
            mixerActions.push({
                mixer: mixer,
                action: animationAction,
                animationCode: animationInfo.code
            });
        }
        let timeSplitLine = $(editContainer).find(".s3dAnimationEditorTimeSplitLine");
        thatAnimationEditor.refreshTimeSplitLineOnAnimation(timeSplitLine, editingInfo.frameCount);
        thatAnimationEditor.manager.viewer.playAnimations(mixerActions, [animationInfo]);
    };
    this.calcKeyFrameValue = function (trackCode, frameIndex) {
        let sortedKeyFrameValues = thatAnimationEditor.getSortedKeyFrameValuesInTrack(trackCode);
        if (sortedKeyFrameValues == null) {
            return null;
        } else {
            if (sortedKeyFrameValues.length === 0) {
                let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
                let originalValue = parseFloat($(editContainer).find(".s3dAnimationEditorTrackHeader[trackCode='" + trackCode + "']").attr("originalValue"));
                return originalValue;
            } else if (sortedKeyFrameValues.length === 1) {
                return sortedKeyFrameValues[0].value;
            } else {
                let firstFrameValue = sortedKeyFrameValues[0];
                let lastFrameValue = sortedKeyFrameValues[sortedKeyFrameValues.length - 1];
                if (frameIndex <= firstFrameValue.frameIndex) {
                    return firstFrameValue.value;
                } else if (frameIndex >= lastFrameValue.frameIndex) {
                    return lastFrameValue.value;
                } else {
                    for (let i = 0; i < sortedKeyFrameValues.length - 1; i++) {
                        let frameValueA = sortedKeyFrameValues[i];
                        let frameValueB = sortedKeyFrameValues[i + 1];
                        if (frameValueA.frameIndex === frameIndex) {
                            return frameValueA.value;
                        } else if (frameValueB.frameIndex === frameIndex) {
                            return frameValueB.value;
                        } else if (frameValueA.frameIndex < frameIndex && frameValueB.frameIndex > frameIndex) {
                            let curvePoints = thatAnimationEditor.manager.userAnimations.calcCurvePoints(frameValueA, frameValueB);
                            let curvePoint = curvePoints[frameIndex - frameValueA.frameIndex];
                            let value = cmnPcr.toFixed(curvePoint.value, 4);
                            return value;
                        } else ;
                    }
                }

                //不会出现这种情况
                return null;
            }
        }
    };
    this.getTrackFullCurvePoints = function (trackCode) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let originalValue = parseFloat($(editContainer).find(".s3dAnimationEditorTrackHeader[trackCode='" + trackCode + "']").attr("originalValue"));
        let sortedKeyFrameValues = thatAnimationEditor.getSortedKeyFrameValuesInTrack(trackCode);
        return thatAnimationEditor.manager.userAnimations.calcFullCurvePoints(sortedKeyFrameValues, thatAnimationEditor.manager.userAnimations.enableMaxFrameCount, originalValue);
    };
    this.drawTrackCurves = function (drawPoints) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let curveContainer = $(editContainer).find(".s3dAnimationEditorSubContainer[name='curve']")[0];
        let height = $(curveContainer).height();
        let width = $(curveContainer).width();
        let pathStr = "";
        for (let i = 0; i < drawPoints.length; i++) {
            let point = drawPoints[i];
            if (i === 0) {
                pathStr += "M ";
            } else {
                pathStr += "L ";
            }
            pathStr += point.x + "," + point.y + " ";
        }
        let html = "<svg width='" + width + "' height='" + height + "' xmlns='http://www.w3.org/2000/svg'><path d='" + pathStr + "' fill='none' stroke='#FFD800' stroke-width='1' /></svg>";
        $(curveContainer).html(html);
    };
    this.calcCurveDrawPoints = function (fullCurvePoints) {
        let maxValue = -Number.MAX_VALUE;
        let minValue = Number.MAX_VALUE;
        for (let i = 0; i < fullCurvePoints.length; i++) {
            let curvePoint = fullCurvePoints[i];
            if (curvePoint.value > maxValue) {
                maxValue = curvePoint.value;
            }
            if (curvePoint.value < minValue) {
                minValue = curvePoint.value;
            }
        }
        let midValue = (maxValue + minValue) / 2;
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let containerHeight = $(editContainer).find(".s3dAnimationEditorCenterInner").height();
        let halfHeight = containerHeight / 2;
        let drawPoints = [];
        for (let i = 0; i < fullCurvePoints.length; i++) {
            let curvePoint = fullCurvePoints[i];
            let x = curvePoint.frameIndex * thatAnimationEditor.spanWidth + thatAnimationEditor.spanWidth / 2;
            let y = maxValue === midValue ? halfHeight : halfHeight - 0.8 * halfHeight * (curvePoint.value - midValue) / (maxValue - midValue);
            drawPoints.push({
                x: x,
                y: y
            });
        }
        return drawPoints;
    };
    this.refreshCurve = function () {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let trackHeaders = $(editContainer).find(".s3dAnimationEditorTrackHeader");
        let activeTrackCode = null;
        for (let i = 0; i < trackHeaders.length; i++) {
            let trackHeader = trackHeaders[i];
            if ($(trackHeader).hasClass("s3dAnimationEditorItemActive")) {
                activeTrackCode = $(trackHeader).attr("trackCode");
                break;
            }
        }
        thatAnimationEditor.refreshTrackCurve(activeTrackCode);
    };
    this.refreshTrackCurve = function (trackCode) {
        thatAnimationEditor.clearCurve();
        if (trackCode != null) {
            let fullCurvePoints = thatAnimationEditor.getTrackFullCurvePoints(trackCode);
            let drawPoints = thatAnimationEditor.calcCurveDrawPoints(fullCurvePoints);
            thatAnimationEditor.drawTrackCurves(drawPoints);
        }
    };
    this.getTrackKeyFrameBtnValue = function (trackCode, frameIndex) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let keyFrameBtn = $(editContainer).find(".s3dAnimationEditorTrackItem[trackCode='" + trackCode + "'] .s3dAnimationEditorKeyFrameBtn[frameIndex='" + frameIndex + "']");
        return parseFloat($(keyFrameBtn).attr("value"));
    };
    this.getTrackKeyFrameBtnValueByBtnCode = function (trackCode, btnCode) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let keyFrameBtn = $(editContainer).find(".s3dAnimationEditorTrackItem[trackCode='" + trackCode + "'] .s3dAnimationEditorKeyFrameBtn[btnCode='" + btnCode + "']");
        return parseFloat($(keyFrameBtn).attr("value"));
    };
    this.getSortedKeyFrameValuesInTrack = function (trackCode) {
        if (trackCode == null || trackCode.length === 0) {
            return null;
        } else {
            let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
            let keyFrameBtns = $(editContainer).find(".s3dAnimationEditorTrackItem[trackCode='" + trackCode + "'] .s3dAnimationEditorKeyFrameBtn");
            let keyFrameValues = [];
            for (let i = 0; i < keyFrameBtns.length; i++) {
                let keyFrameBtn = keyFrameBtns[i];
                keyFrameValues.push({
                    frameIndex: parseInt($(keyFrameBtn).attr("frameIndex")),
                    value: parseFloat($(keyFrameBtn).attr("value")),
                    leftLineType: $(keyFrameBtn).attr("leftLineType"),
                    rightLineType: $(keyFrameBtn).attr("rightLineType")
                });
            }
            return thatAnimationEditor.manager.userAnimations.sortKeyFrameValues(keyFrameValues);
        }
    };
    this.syncScrollLeftInnerAndTrackContainer = function (scrollTop) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let leftContainer = $(editContainer).find(".s3dAnimationEditorLeftInner")[0];
        let trackContainer = $(editContainer).find(".s3dAnimationEditorSubContainer[name='track']")[0];
        leftContainer.scrollTop = scrollTop;
        trackContainer.scrollTop = scrollTop;
    };

    //获取树toolbar html
    this.getToolbarHtml = function () {
        let html = "<div class='s3dAnimationEditorToolbar'>"
            /*放弃toolbar的功能
            + "<div class='s3dAnimationEditorToolbarBtn s3dAnimationEditorToolbarMainCloseBtn' title='取消编辑'>&#10006;</div>"
            + "<div class='s3dAnimationEditorToolbarBtn s3dAnimationEditorToolbarBtnMainApplyBtn' title='接受修改'>&#9438;</div>"
            + "<div class='s3dAnimationEditorToolbarBtn s3dAnimationEditorToolbarBtnMainOkBtn' title='确定'>&#10004;</div>"
            */
            + "</div>";
        return html;
    };

    //获取list html
    this.getHtml = function () {
        let html = "<div class='s3dAnimationEditorContainer'>";
        html += "<div class='s3dAnimationEditorLeftContainer'>";
        html += "<div class='s3dAnimationEditorLeftHeader'>";
        //动画名称
        html += "<div class='s3dAnimationEditorInputContainer'><input class='s3dAnimationEditorInputAnimationName' placeholder='请输入动画名称' /></div>";
        //预览按钮
        html += "<div class='s3dAnimationEditorBtn s3dAnimationEditorPreviewBtn' title='预览'>&#9658;</div>";
        //添加关键帧按钮
        html += "<div class='s3dAnimationEditorBtn s3dAnimationEditorAddKeyFrameBtn' title='添加关键帧'>&#9830;</div>";
        //添加物体属性按钮
        html += "<div class='s3dAnimationEditorBtn s3dAnimationEditorAddObjectGroupBtn' title='设置物体属性'>&#10012;</div>";
        //设置材质属性按钮
        html += "<div class='s3dAnimationEditorBtn s3dAnimationEditorAddMaterialGroupBtn' title='设置材质属性'>M</div>";
        //设置材质属性按钮
        html += "<div class='s3dAnimationEditorBtn s3dAnimationEditorEditEventBtn' title='定义事件'>&#x21AF;</div>";
        html += "</div>";
        html += "<div class='s3dAnimationEditorLeftInner'>";
        //罗列属性（分组），showAnimation时显示
        html += "</div>";
        html += "<div class='s3dAnimationEditorLeftFooter'>";
        //按钮，切换
        html += "<div class='s3dAnimationEditorTabBtn s3dAnimationEditorTabBtnActive' name='track'>轨道</div>";
        html += "<div class='s3dAnimationEditorTabBtn' name='curve'>曲线</div>";
        html += "</div>";
        html += "</div>";
        html += "<div class='s3dAnimationEditorCenterContainer'>";
        html += "<div class='s3dAnimationEditorCenterHeader'>";
        html += "<div class='s3dAnimationEditorKeyFrameRange'></div>";
        //显示时间轴
        html += "<div class='s3dAnimationEditorTimeline s3dAnimationEditorZoomLevel5' zoomLevel='5'>";
        html += "</div>";
        html += "</div>";
        html += "<div class='s3dAnimationEditorCenterInner'>";
        html += "<div class='s3dAnimationEditorSubContainer s3dAnimationEditorSubContainerActive' name='track'>Track</div>";
        html += "<div class='s3dAnimationEditorSubContainer' name='curve'>Curve</div>";
        html += "</div>";
        html += "<div class='s3dAnimationEditorCenterFooter'>";
        html += "</div>";
        html += "</div>";
        html += "</div>";
        return html;
    };
    this.calcFrameCount = function () {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let keyFrameBtns = $(editContainer).find(".s3dAnimationEditorKeyFrameBtn");
        let maxFrameIndex = 0;
        for (let i = 0; i < keyFrameBtns.length; i++) {
            let keyFrameBtn = keyFrameBtns[i];
            let frameIndex = parseInt($(keyFrameBtn).attr("frameIndex"));
            if (frameIndex > maxFrameIndex) {
                maxFrameIndex = frameIndex;
            }
        }
        return maxFrameIndex;
    };

    //记录UI相关信息（用于redo、undo）
    this.getUiInfo = function () {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let uiInfo = {
            leftScrollTop: $(editContainer).find(".s3dAnimationEditorLeftInner")[0].scrollTop,
            centerScrollLeft: $(editContainer).find(".s3dAnimationEditorCenterInner")[0].scrollLeft,
            timeLineZoomLevel: parseInt($(editContainer).find(".s3dAnimationEditorTimeline").attr("zoomLevel"))
        };
        return uiInfo;
    };
    this.getEditingInfoFromUI = function () {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let animationName = $(editContainer).find(".s3dAnimationEditorInputAnimationName").val();
        let frameCount = thatAnimationEditor.calcFrameCount();
        let editingInfo = {
            code: thatAnimationEditor.editingAnimationCode,
            name: animationName,
            frameCount: frameCount,
            groupCodes: [],
            groupMap: {},
            states: [],
            originalValueMap: {},
            eventMap: thatAnimationEditor.editingAnimationEventMap
        };
        let allGroupContainers = $(editContainer).find(".s3dAnimationEditorGroupContainer");
        for (let i = 0; i < allGroupContainers.length; i++) {
            let groupContainer = allGroupContainers[i];
            let groupType = $(groupContainer).attr("groupType");
            let groupCode = $(groupContainer).attr("groupCode");
            let groupName = $(groupContainer).attr("groupName");
            let objectId = $(groupContainer).attr("objectId");
            let group = {
                name: groupName,
                code: groupCode,
                type: groupType,
                objectId: objectId,
                trackCodes: [],
                trackMap: {}
            };
            let trackHeaders = $(groupContainer).find(".s3dAnimationEditorTrackHeader");
            for (let j = 0; j < trackHeaders.length; j++) {
                let trackHeader = trackHeaders[j];
                let trackCode = $(trackHeader).attr("trackCode");
                let trackName = $(trackHeader).attr("trackName");
                let track = {
                    code: trackCode,
                    name: trackName,
                    keyFrames: []
                };
                let keyFrameBtns = $(editContainer).find(".s3dAnimationEditorTrackItem[trackCode='" + trackCode + "'] .s3dAnimationEditorKeyFrameBtn");
                for (let k = 0; k < keyFrameBtns.length; k++) {
                    let keyFrameBtn = keyFrameBtns[k];
                    let frameIndex = parseInt($(keyFrameBtn).attr("frameIndex"));
                    let value = parseFloat($(keyFrameBtn).attr("value"));
                    let leftLineType = $(keyFrameBtn).attr("leftLineType");
                    let rightLineType = $(keyFrameBtn).attr("rightLineType");
                    let keyFrame = {
                        frameIndex: frameIndex,
                        value: value,
                        leftLineType: leftLineType,
                        rightLineType: rightLineType
                    };
                    track.keyFrames.push(keyFrame);
                }
                group.trackCodes.push(trackCode);
                group.trackMap[trackCode] = track;
            }
            editingInfo.groupCodes.push(groupCode);
            editingInfo.groupMap[groupCode] = group;

            //记录原始值
            let objectOriginalValue = editingInfo.originalValueMap[objectId];
            if (objectOriginalValue == null) {
                let object3D = thatAnimationEditor.manager.viewer.getObject3DById(objectId);
                let info = object3D.userData.info;
                objectOriginalValue = {
                    objectId: objectId,
                    name: info.name,
                    propertyMap: {}
                };
                editingInfo.originalValueMap[objectId] = objectOriginalValue;
            }
            let groupOriginalValue = {};
            objectOriginalValue.propertyMap[groupName] = groupOriginalValue;
            for (let j = 0; j < trackHeaders.length; j++) {
                let trackHeader = trackHeaders[j];
                let trackName = $(trackHeader).attr("trackName");
                let originalValue = parseFloat($(trackHeader).attr("originalValue"));
                groupOriginalValue[trackName] = originalValue;
            }
        }
        for (let objectId in thatAnimationEditor.manager.viewer.allObject3DMap) {
            let object3D = thatAnimationEditor.manager.viewer.allObject3DMap[objectId];
            let visible = object3D.visible;
            if (!visible) {
                editingInfo.states.push({
                    objectId: objectId,
                    visible: visible
                });
            }
        }
        return editingInfo;
    };
    this.convertToAnimationInfo = function (editingInfo) {
        let animationInfo = {
            code: editingInfo.code,
            name: editingInfo.name,
            frameCount: editingInfo.frameCount,
            groups: [],
            states: [],
            originalValueMap: {},
            eventMap: editingInfo.eventMap
        };
        for (let objectId in editingInfo.originalValueMap) {
            let editingOriginalValue = editingInfo.originalValueMap[objectId];
            let animationOriginalValue = {
                name: editingOriginalValue.name,
                objectId: objectId,
                propertyMap: {}
            };
            for (let propertyName in editingOriginalValue.propertyMap) {
                let editingPropertyOriginalValue = editingOriginalValue.propertyMap[propertyName];
                let propertyOriginalValue = {};
                for (let partName in editingPropertyOriginalValue) {
                    propertyOriginalValue[partName] = thatAnimationEditor.manager.userAnimations.convertToGroupValue(editingPropertyOriginalValue[partName], propertyName);
                }
                animationOriginalValue.propertyMap[propertyName] = propertyOriginalValue;
            }
            animationInfo.originalValueMap[objectId] = animationOriginalValue;
        }
        for (let i = 0; i < editingInfo.groupCodes.length; i++) {
            let groupCode = editingInfo.groupCodes[i];
            let editingGroup = editingInfo.groupMap[groupCode];
            let group = {
                type: editingGroup.type,
                code: editingGroup.code,
                objectId: editingGroup.objectId,
                name: editingGroup.name,
                tracks: []
            };
            for (let j = 0; j < editingGroup.trackCodes.length; j++) {
                let trackCode = editingGroup.trackCodes[j];
                let editingTrack = editingGroup.trackMap[trackCode];
                let track = {
                    code: editingTrack.code,
                    name: editingTrack.name,
                    keyFrames: []
                };
                for (let k = 0; k < editingTrack.keyFrames.length; k++) {
                    let editingKeyFrame = editingTrack.keyFrames[k];
                    let keyFrame = {
                        frameIndex: editingKeyFrame.frameIndex,
                        value: thatAnimationEditor.manager.userAnimations.convertToGroupValue(editingKeyFrame.value, editingGroup.name, editingGroup.type),
                        leftLineType: editingKeyFrame.leftLineType,
                        rightLineType: editingKeyFrame.rightLineType
                    };
                    track.keyFrames.push(keyFrame);
                }
                group.tracks.push(track);
            }
            animationInfo.groups.push(group);
        }
        for (let i = 0; i < editingInfo.states.length; i++) {
            let editingState = editingInfo.states[i];
            let state = {
                objectId: editingState.objectId,
                visible: editingState.visible
            };
            animationInfo.states.push(state);
        }
        return animationInfo;
    };
    this.convertToEditingInfo = function (animationInfo) {
        let editingInfo = {
            code: animationInfo.code,
            name: animationInfo.name,
            frameCount: animationInfo.frameCount,
            groupCodes: [],
            groupMap: {},
            states: [],
            errors: [],
            eventMap: animationInfo.eventMap
        };
        for (let i = 0; i < animationInfo.groups.length; i++) {
            let group = animationInfo.groups[i];
            let object3D = thatAnimationEditor.manager.viewer.getObject3DById(group.objectId);
            if (object3D == null) {
                editingInfo.errors.push("动画中使用了已被删除的对象, GroupName=" + group.name + ", ObjectId=" + group.objectId);
            } else {
                let editingGroup = {
                    type: group.type,
                    code: group.code,
                    objectId: group.objectId,
                    name: group.name,
                    trackCodes: [],
                    trackMap: {}
                };
                for (let j = 0; j < group.tracks.length; j++) {
                    let track = group.tracks[j];
                    let editingTrack = {
                        code: track.code,
                        name: track.name,
                        keyFrames: []
                    };
                    for (let k = 0; k < track.keyFrames.length; k++) {
                        let keyFrame = track.keyFrames[k];
                        let editingKeyFrame = {
                            frameIndex: keyFrame.frameIndex,
                            value: thatAnimationEditor.manager.userAnimations.convertToEditingValue(keyFrame.value, group.name, group.type),
                            leftLineType: keyFrame.leftLineType,
                            rightLineType: keyFrame.rightLineType
                        };
                        editingTrack.keyFrames.push(editingKeyFrame);
                    }
                    editingGroup.trackCodes.push(editingTrack.code);
                    editingGroup.trackMap[editingTrack.code] = editingTrack;
                }
                editingInfo.groupMap[editingGroup.code] = editingGroup;
                editingInfo.groupCodes.push(editingGroup.code);
            }
        }
        for (let i = 0; i < animationInfo.states.length; i++) {
            let state = animationInfo.states[i];
            let editingState = {
                objectId: state.objectId,
                visible: state.visible
            };
            editingInfo.states.push(editingState);
        }
        return editingInfo;
    };
    this.showPopObjectAndObjectPropertyWindow = function () {
        let selectedObject3DIds = thatAnimationEditor.manager.viewer.getSelectedObject3DIds();
        if (selectedObject3DIds.length === 0) {
            msgBox.alert({
                info: "请先选择一个物体, 再点击此按钮."
            });
        } else if (selectedObject3DIds.length > 1) {
            msgBox.alert({
                info: "仅可选择一个物体."
            });
        } else {
            let container = $("#" + thatAnimationEditor.containerId);
            let addGroupBtn = $(container).find(".s3dAnimationEditorAddObjectGroupBtn");
            let top = $(addGroupBtn).offset().top - $(container).offset().top + $(addGroupBtn).height();
            let left = $(addGroupBtn).offset().left - $(container).offset().left + $(addGroupBtn).width();
            const selectedObject3DId = selectedObject3DIds[0];
            const selectPropertyContainer = new PopupContainer({
                width: 150,
                height: 200,
                top: top,
                left: left,
                title: "选择物体属性",
                containerId: thatAnimationEditor.containerId
            });
            selectPropertyContainer.show();
            let html = thatAnimationEditor.getPropertyListHtml();
            let popContainer = $("#" + selectPropertyContainer.contentId);
            $(popContainer).html(html);
            $(popContainer).find(".s3dAnimationEditorPropertyItem").click(function () {
                let propertyName = $(this).attr("name");
                if (thatAnimationEditor.checkHasObject3DAndProperty(selectedObject3DId, propertyName)) {
                    msgBox.alert({
                        info: "已存在的物体属性，请勿重复添加."
                    });
                } else {
                    selectPropertyContainer.close();
                    let group = thatAnimationEditor.addGroup(selectedObject3DId, propertyName, s3dAnimationGroupType.property);
                    thatAnimationEditor.addGroupTrackList(group);
                    thatAnimationEditor.refreshTrackHeaderValues();
                    thatAnimationEditor.bindGroupEvents(group.code);
                    thatAnimationEditor.bindGroupTrackListEvents(group.code);
                    thatAnimationEditor.addEditingToUndoList(s3dAnimationEditType.addGroup);
                }
            });
        }
    };
    this.showPopEditEventWindow = function () {
        let popContainer = new PopupContainer({
            width: 800,
            height: 700,
            top: 50,
            canClose: true,
            title: "编辑事件",
            containerId: thatAnimationEditor.containerId
        });
        popContainer.show();
        let eventMap = thatAnimationEditor.editingAnimationEventMap;
        let innerHtml = thatAnimationEditor.getEventEditHtml();
        $("#" + popContainer.contentId).html(innerHtml);
        thatAnimationEditor.setEventEditValues(popContainer, eventMap);
        thatAnimationEditor.bindEventEditEvents(popContainer);
    };
    this.setEventEditValues = function (popContainer, eventMap) {
        let eventEditContainer = $("#" + popContainer.contentId).find(".s3dAnimationEditorEventEditContainer");
        if (eventMap != null) {
            for (let eventName in eventMap) {
                let event = eventMap[eventName];
                $(eventEditContainer).find(".s3dAnimationEditorEventEditContentItem[name='" + eventName + "'] .s3dAnimationEditorEventEditItemInput").val(event.jsCode);
            }
        }
    };
    this.bindEventEditEvents = function (popContainer) {
        let eventEditContainer = $("#" + popContainer.contentId).find(".s3dAnimationEditorEventEditContainer");
        $(eventEditContainer).find(".s3dAnimationEditorEventEditItemInput").bind("keydown", function (e) {
            if (e.key === 'Tab') {
                // 阻止默认的焦点切换行为
                e.preventDefault();
                let start = this.selectionStart;
                let end = this.selectionEnd;
                // 获取当前文本区域的内容
                let value = this.value;
                // 在光标位置插入四个空格作为 Tab 字符
                this.value = value.substring(0, start) + '    ' + value.substring(end);
                // 设置新的光标位置
                this.selectionStart = this.selectionEnd = start + 4;
            }
        });
        $(eventEditContainer).find(".s3dAnimationEditorEventEditHeaderItem").click(function () {
            let eventEditContainer = $("#" + popContainer.contentId).find(".s3dAnimationEditorEventEditContainer");
            $(eventEditContainer).find(".s3dAnimationEditorEventEditHeaderItem").removeClass("s3dAnimationEditorEventEditHeaderItemActive");
            $(eventEditContainer).find(".s3dAnimationEditorEventEditContentItem").removeClass("s3dAnimationEditorEventEditContentItemActive");
            let eventName = $(this).attr("name");
            $(eventEditContainer).find(".s3dAnimationEditorEventEditHeaderItem[name='" + eventName + "']").addClass("s3dAnimationEditorEventEditHeaderItemActive");
            $(eventEditContainer).find(".s3dAnimationEditorEventEditContentItem[name='" + eventName + "']").addClass("s3dAnimationEditorEventEditContentItemActive");
        });
        $(eventEditContainer).find(".s3dAnimationEditorEventEditBtn[name='ok']").click(function () {
            let eventEditContainer = $("#" + popContainer.contentId).find(".s3dAnimationEditorEventEditContainer");
            let jsCodeInputs = $(eventEditContainer).find(".s3dAnimationEditorEventEditContentItem .s3dAnimationEditorEventEditItemInput");
            let eventMap = {};
            for (let i = 0; i < jsCodeInputs.length; i++) {
                let jsCodeInput = jsCodeInputs[i];
                let eventName = $(jsCodeInput).parent().attr("name");
                let jsCode = $(jsCodeInput).val().trim();
                if (jsCode.length > 0) {
                    eventMap[eventName] = {
                        name: eventName,
                        jsCode: jsCode
                    };
                }
            }
            thatAnimationEditor.editingAnimationEventMap = eventMap;
            popContainer.close();
        });
    };
    this.getEventEditHtml = function () {
        let html = "<div class='s3dAnimationEditorEventEditContainer'>" + "<div class='s3dAnimationEditorEventEditInnerContainer'>";

        //标题栏
        html += "<div class='s3dAnimationEditorEventEditHeader'>";
        for (let i = 0; i < thatAnimationEditor.eventList.length; i++) {
            let eventInfo = thatAnimationEditor.eventList[i];
            html += "<div class='s3dAnimationEditorEventEditHeaderItem" + (i === 0 ? " s3dAnimationEditorEventEditHeaderItemActive" : "") + "' name='" + eventInfo.name + "'>" + "<div class='s3dAnimationEditorEventEditHeaderItemTitle'>" + cmnPcr.htmlEncode(eventInfo.text) + "</div>" + "</div>";
        }
        html += "</div>";

        //事件代码
        html += "<div class='s3dAnimationEditorEventEditContentContainer'>";
        for (let i = 0; i < thatAnimationEditor.eventList.length; i++) {
            let eventInfo = thatAnimationEditor.eventList[i];
            let parameterStr = "";
            for (let j = 0; j < eventInfo.parameters.length; j++) {
                if (j !== 0) {
                    parameterStr += ", ";
                }
                parameterStr += eventInfo.parameters[j].name;
            }
            html += "<div class='s3dAnimationEditorEventEditContentItem" + (i === 0 ? " s3dAnimationEditorEventEditContentItemActive" : "") + "' name='" + eventInfo.name + "'>" + "<div class='s3dAnimationEditorEventEditItemInputPrefix'>function " + eventInfo.name + "(" + parameterStr + ") {</div>" + "<textarea class='s3dAnimationEditorEventEditItemInput'></textarea>" + "<div class='s3dAnimationEditorEventEditItemInputPostfix'>}</div>" + "</div>";
        }
        html += "</div>";

        //关闭innerContainer
        html += "</div>";

        //底部
        html += "<div class='s3dAnimationEditorEventEditBottomContainer'>" + "<div class='s3dAnimationEditorEventEditBtn' name='ok'>确定</div>" + "</div>";

        //关闭container
        html += "</div>";
        return html;
    };
    this.showPopObjectAndObjectMaterialWindow = function () {
        let selectedObject3DIds = thatAnimationEditor.manager.viewer.getSelectedObject3DIds();
        if (selectedObject3DIds.length === 0) {
            msgBox.alert({
                info: "请先选择一个物体, 再点击此按钮."
            });
        } else if (selectedObject3DIds.length > 1) {
            msgBox.alert({
                info: "仅可选择一个物体."
            });
        } else {
            let container = $("#" + thatAnimationEditor.containerId);
            let addGroupBtn = $(container).find(".s3dAnimationEditorAddObjectGroupBtn");
            let top = $(addGroupBtn).offset().top - $(container).offset().top + $(addGroupBtn).height();
            let left = $(addGroupBtn).offset().left - $(container).offset().left + $(addGroupBtn).width();
            const selectedObject3DId = selectedObject3DIds[0];
            const selectPropertyContainer = new PopupContainer({
                width: 400,
                height: 200,
                top: top,
                left: left,
                title: "选择物体材质",
                containerId: thatAnimationEditor.containerId
            });
            selectPropertyContainer.show();
            let html = thatAnimationEditor.getMaterialListHtml(selectedObject3DId);
            let popContainer = $("#" + selectPropertyContainer.contentId);
            $(popContainer).html(html);
            $(popContainer).find(".s3dAnimationEditorPropertyItem").click(function () {
                let propertyName = $(this).attr("name");
                if (thatAnimationEditor.checkHasObject3DAndProperty(selectedObject3DId, propertyName)) {
                    msgBox.alert({
                        info: "已存在的物体材质，请勿重复添加."
                    });
                } else {
                    selectPropertyContainer.close();
                    let group = thatAnimationEditor.addGroup(selectedObject3DId, propertyName, s3dAnimationGroupType.material);
                    thatAnimationEditor.addGroupTrackList(group);
                    thatAnimationEditor.refreshTrackHeaderValues();
                    thatAnimationEditor.bindGroupEvents(group.code);
                    thatAnimationEditor.bindGroupTrackListEvents(group.code);
                    thatAnimationEditor.addEditingToUndoList(s3dAnimationEditType.addGroup);
                }
            });
        }
    };
    this.removeGroup = function (groupCode) {
        let groupContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorGroupContainer[groupCode='" + groupCode + "']");
        $(groupContainer).remove();
    };
    this.removeGroupTrackList = function (groupCode) {
        let trackItems = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorTrackItem[groupCode='" + groupCode + "']");
        $(trackItems).remove();
    };
    this.addGroupTrackList = function (group) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let trackContainer = $(editContainer).find(".s3dAnimationEditorSubContainer[name='track']");
        let html = thatAnimationEditor.getTrackItemHtml(group.code, "");
        for (let j = 0; j < group.trackCodes.length; j++) {
            let trackCode = group.trackCodes[j];
            let track = group.trackMap[trackCode];
            html += thatAnimationEditor.getTrackItemHtml(group.code, track.code);
        }
        $(trackContainer).append(html);
    };
    this.addGroup = function (objectId, groupName, groupType) {
        let trackNames = thatAnimationEditor.getGroupDefaultTrackNames(objectId, groupName, groupType);
        let group = {
            code: cmnPcr.createGuid(),
            name: groupName,
            type: groupType,
            objectId: objectId,
            trackCodes: [],
            trackMap: {}
        };
        for (let i = 0; i < trackNames.length; i++) {
            let trackName = trackNames[i];
            group.trackCodes.push(trackName);
            group.trackMap[trackName] = {
                code: cmnPcr.createGuid(),
                name: trackName,
                keyFrames: []
            };
        }
        let groupHtml = thatAnimationEditor.getGroupHtml(group);
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let leftInnerContainer = $(editContainer).find(".s3dAnimationEditorLeftInner");
        $(leftInnerContainer).append(groupHtml);
        return group;
    };
    this.bindGroupEvents = function (groupCode) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let groupContainer = $(editContainer).find(".s3dAnimationEditorGroupContainer[groupCode='" + groupCode + "']");
        $(groupContainer).find(".s3dAnimationEditorGroupHeader").click(function () {
            let groupContainer = $(this).parent();
            if ($(groupContainer).hasClass("s3dAnimationEditorGroupContainerExpand")) {
                $(groupContainer).removeClass("s3dAnimationEditorGroupContainerExpand");
                $(editContainer).find(".s3dAnimationEditorTrackItem[groupCode='" + groupCode + "'][trackCode!='']").addClass("s3dAnimationEditorTrackItemHidden");
            } else {
                $(groupContainer).addClass("s3dAnimationEditorGroupContainerExpand");
                $(editContainer).find(".s3dAnimationEditorTrackItem[groupCode='" + groupCode + "'][trackCode!='']").removeClass("s3dAnimationEditorTrackItemHidden");
            }
        });
        $(groupContainer).find(".s3dAnimationEditorGroupHeader .s3dAnimationEditorGroupHeaderDeleteBtn").click(function () {
            if (msgBox.confirm({
                info: "确定删除吗?"
            })) {
                let groupContainer = $(this).parent().parent();
                let groupCode = $(groupContainer).attr("groupCode");
                let objectId = $(groupContainer).attr("objectId");
                let groupName = $(groupContainer).attr("groupName");
                let groupType = $(groupContainer).attr("groupType");
                thatAnimationEditor.restoreOriginalValue(objectId, groupName, groupType);
                thatAnimationEditor.removeGroup(groupCode);
                thatAnimationEditor.removeGroupTrackList(groupCode);
                thatAnimationEditor.refreshTimeSplitLine();
                thatAnimationEditor.clearCurve();
                thatAnimationEditor.addEditingToUndoList(s3dAnimationEditType.removeGroup);
            }
        });
        $(groupContainer).find(".s3dAnimationEditorGroupHeader").click(function () {
            let groupContainer = $(this).parent();
            let groupCode = $(groupContainer).attr("groupCode");
            thatAnimationEditor.focusTrack(groupCode, null);
            thatAnimationEditor.clearCurve();
        });
        $(groupContainer).find(".s3dAnimationEditorTrackHeader").click(function () {
            let groupCode = $(this).attr("groupCode");
            let trackCode = $(this).attr("trackCode");
            thatAnimationEditor.focusTrack(groupCode, trackCode);
            //刷新曲线
            if ($(editContainer).find(".s3dAnimationEditorTabBtnActive").attr("name") === "curve") {
                thatAnimationEditor.refreshTrackCurve(trackCode);
            }
        });
        $(groupContainer).find(".s3dAnimationEditorTrackHeader .s3dAnimationEditorInputValue").change(function () {
            let value = parseFloat($(this).val());
            let trackCode = $(this).parent().parent().attr("trackCode");
            let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
            let timeSplitLine = $(editContainer).find(".s3dAnimationEditorTimeSplitLine");
            let frameIndex = parseInt($(timeSplitLine).attr("frameIndex"));
            thatAnimationEditor.updateTrackKeyFrameValue(trackCode, frameIndex, value);
            thatAnimationEditor.refreshTimeSplitLine();

            //刷新曲线
            if ($(editContainer).find(".s3dAnimationEditorTabBtnActive").attr("name") === "curve") {
                thatAnimationEditor.refreshTrackCurve(trackCode);
            }
            thatAnimationEditor.addEditingToUndoList(s3dAnimationEditType.editKeyFrameValue);
        });
    };
    this.setTrackHeaderPosRotScaleInputValue = function (objectId, groupName, valueObj) {
        thatAnimationEditor.setTrackHeaderInputValue(objectId, groupName, valueObj, s3dAnimationGroupType.property);
    };
    this.setTrackHeaderInputValue = function (objectId, groupName, valueObj, groupType) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        if (thatAnimationEditor.editingAnimationCode != null && thatAnimationEditor.editingAnimationCode.length !== 0) {
            let groupContainer = $(editContainer).find(".s3dAnimationEditorGroupContainer[objectId='" + objectId + "'][groupName='" + groupName + "']");
            if (groupContainer.length !== 0) {
                let curveTrackCode = null;
                let timeSplitLine = $(editContainer).find(".s3dAnimationEditorTimeSplitLine");
                let frameIndex = parseInt($(timeSplitLine).attr("frameIndex"));
                let trackMap = thatAnimationEditor.manager.userAnimations.getTrackMapByObjectGroup(groupName, groupType);
                for (let trackName in trackMap) {
                    let showValue = thatAnimationEditor.manager.userAnimations.convertGroupValueToShowValue(valueObj, groupName, groupType);
                    let trackHeader = $(groupContainer).find(".s3dAnimationEditorTrackHeader[trackName='" + trackName + "']");
                    let trackCode = $(trackHeader).attr("trackCode");
                    let trackInput = $(trackHeader).find(".s3dAnimationEditorInputValue");
                    if (!$(trackInput).hasClass("s3dAnimationEditorInputValueReadonly")) {
                        let value = showValue[trackName];
                        $(trackInput).val(value);
                        thatAnimationEditor.updateTrackKeyFrameValue(trackCode, frameIndex, value);
                        if ($(trackHeader).hasClass("s3dAnimationEditorItemActive")) {
                            curveTrackCode = trackCode;
                        }
                    }
                }
                thatAnimationEditor.refreshTimeSplitLine();
                //刷新曲线
                if (curveTrackCode !== null && $(editContainer).find(".s3dAnimationEditorTabBtnActive").attr("name") === "curve") {
                    thatAnimationEditor.refreshTrackCurve(curveTrackCode);
                }
            }
        }
    };
    this.focusTrack = function (groupCode, trackCode) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        $(editContainer).find(".s3dAnimationEditorGroupHeader").removeClass("s3dAnimationEditorItemActive");
        $(editContainer).find(".s3dAnimationEditorTrackHeader").removeClass("s3dAnimationEditorItemActive");
        $(editContainer).find(".s3dAnimationEditorTrackItem").removeClass("s3dAnimationEditorItemActive");
        if (trackCode == null || trackCode.length === 0) {
            //group的header
            $(editContainer).find(".s3dAnimationEditorGroupHeader[groupCode='" + groupCode + "']").addClass("s3dAnimationEditorItemActive");
            $(editContainer).find(".s3dAnimationEditorTrackItem[groupCode='" + groupCode + "'][trackCode='']").addClass("s3dAnimationEditorItemActive");
        } else {
            //明细
            $(editContainer).find(".s3dAnimationEditorTrackHeader[groupCode='" + groupCode + "'][trackCode='" + trackCode + "']").addClass("s3dAnimationEditorItemActive");
            $(editContainer).find(".s3dAnimationEditorTrackItem[groupCode='" + groupCode + "'][trackCode='" + trackCode + "']").addClass("s3dAnimationEditorItemActive");
        }
    };
    this.bindGroupTrackListEvents = function (groupCode) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        $(editContainer).find(".s3dAnimationEditorTrackItem[groupCode='" + groupCode + "']").click(function () {
            let groupCode = $(this).attr("groupCode");
            let trackCode = $(this).attr("trackCode");
            thatAnimationEditor.focusTrack(groupCode, trackCode);
        });
    };
    this.checkHasObject3DAndProperty = function (objectId, propertyName) {
        let allGroupContainers = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorGroupContainer");
        for (let i = 0; i < allGroupContainers.length; i++) {
            let groupContainer = allGroupContainers[0];
            let groupObjectId = $(groupContainer).attr("objectId");
            let groupName = $(groupContainer).attr("groupName");
            if (groupObjectId === objectId && groupName === propertyName) {
                return true;
            }
        }
        return false;
    };
    this.getPropertyListHtml = function () {
        let html = "";
        html += "<div class='s3dAnimationEditorPropertyList'>";
        for (let i = 0; i < thatAnimationEditor.propertyList.length; i++) {
            let property = thatAnimationEditor.propertyList[i];
            html += "<div class='s3dAnimationEditorPropertyItem' name='" + property.name + "'>" + cmnPcr.htmlEncode(property.text) + "</div>";
        }
        html += "</div>";
        return html;
    };
    this.getMaterialListHtml = function (objectId) {
        let html = "";
        html += "<div class='s3dAnimationEditorPropertyList'>";
        let materialPropertyMap = thatAnimationEditor.getObject3DMaterialPropertyMap(objectId);
        for (let materialPropertyName in materialPropertyMap) {
            let materialPropertyObjItem = materialPropertyMap[materialPropertyName];
            html += "<div class='s3dAnimationEditorPropertyItem' name='" + materialPropertyObjItem.path + "'>" + cmnPcr.htmlEncode(materialPropertyObjItem.text) + "</div>";
        }
        html += "</div>";
        return html;
    };
    this.clearAnimation = function () {
        thatAnimationEditor.restoreAllOriginalValues();
        thatAnimationEditor.showName("");
        thatAnimationEditor.clearGroups();
        thatAnimationEditor.clearTrackList();
        thatAnimationEditor.clearCurve();
        thatAnimationEditor.clearTimeline();
        thatAnimationEditor.clearTimeSplitLine();
        thatAnimationEditor.clearAllTrackKeyFrames();
        thatAnimationEditor.refreshKeyFrameRange();
    };
    this.showAnimation = function (animationCode) {
        //保存之前編輯的动画
        if(thatAnimationEditor.editingAnimationCode != null){
            thatAnimationEditor.applyAnimation();
        }

        //打开需要编辑的动画
        let animationInfo = thatAnimationEditor.manager.userAnimations.getAnimationInfo(animationCode);
        if (animationInfo == null) {
            thatAnimationEditor.clearAnimation();
            thatAnimationEditor.editingAnimationCode = null;
            thatAnimationEditor.editingAnimationEventMap = null;
        } else {
            let editingInfo = thatAnimationEditor.convertToEditingInfo(animationInfo);
            if (editingInfo.errors.length !== 0) {
                msgBox.alert({
                    info: cmnPcr.arrayToString(editingInfo.errors, "\r\n")
                });
            }
            thatAnimationEditor.editingAnimationCode = editingInfo.code;
            thatAnimationEditor.editingAnimationEventMap = editingInfo.eventMap;
            thatAnimationEditor.initTimeline();
            thatAnimationEditor.showName(editingInfo.name);
            thatAnimationEditor.showAllGroups(editingInfo);
            thatAnimationEditor.showAllTrackList(editingInfo);
            thatAnimationEditor.showAllTrackKeyFrames(editingInfo);
            thatAnimationEditor.showAllStates(editingInfo);
            thatAnimationEditor.refreshKeyFrameRange();
            thatAnimationEditor.bindAllGroupAndTrackListEvents(editingInfo);
            thatAnimationEditor.clearCurve();
            thatAnimationEditor.updateTimeSplitLine(0);
            thatAnimationEditor.refreshViewerObjects(0);
            thatAnimationEditor.switchCenterContainer("track");
        }
        thatAnimationEditor.lastOperateInfo = {
            editingInfo: thatAnimationEditor.getEditingInfoFromUI(),
            uiInfo: thatAnimationEditor.getUiInfo()
        };
    };
    this.refreshEditing = function (editingInfo, uiInfo) {
        thatAnimationEditor.stopAnimation();
        thatAnimationEditor.closeMenu();

        //取消正在编辑的内容
        thatAnimationEditor.showName("");
        thatAnimationEditor.clearGroups();
        thatAnimationEditor.clearTrackList();
        thatAnimationEditor.clearCurve();
        thatAnimationEditor.clearTimeline();
        thatAnimationEditor.clearTimeSplitLine();
        thatAnimationEditor.clearAllTrackKeyFrames();
        thatAnimationEditor.refreshKeyFrameRange();

        //讲新的editing内容
        thatAnimationEditor.initTimeline();
        thatAnimationEditor.showName(editingInfo.name);
        thatAnimationEditor.showAllGroups(editingInfo);
        thatAnimationEditor.showAllTrackList(editingInfo);
        thatAnimationEditor.showAllTrackKeyFrames(editingInfo);
        thatAnimationEditor.refreshKeyFrameRange();
        thatAnimationEditor.bindAllGroupAndTrackListEvents(editingInfo);
        thatAnimationEditor.clearCurve();
        thatAnimationEditor.updateTimeSplitLine(0);
        thatAnimationEditor.refreshViewerObjects(0);
        thatAnimationEditor.switchCenterContainer("track");

        //更新UI布局
        thatAnimationEditor.refreshUILayout(uiInfo);
    };
    this.refreshUILayout = function (uiInfo) {
        thatAnimationEditor.setZoomLevel(uiInfo.timeLineZoomLevel);
        thatAnimationEditor.syncScrollCenterHeaderAndInner(uiInfo.centerScrollLeft);
        thatAnimationEditor.syncScrollLeftInnerAndTrackContainer(uiInfo.leftScrollTop);
    };
    this.switchCenterContainer = function (tabName) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        $(editContainer).find(".s3dAnimationEditorTabBtn").removeClass("s3dAnimationEditorTabBtnActive");
        $(editContainer).find(".s3dAnimationEditorTabBtn[name='" + tabName + "']").addClass("s3dAnimationEditorTabBtnActive");
        $(editContainer).find(".s3dAnimationEditorSubContainer").removeClass("s3dAnimationEditorSubContainerActive");
        $(editContainer).find(".s3dAnimationEditorSubContainer[name='" + tabName + "']").addClass("s3dAnimationEditorSubContainerActive");
        if (tabName === "curve") {
            thatAnimationEditor.refreshCurve();
        }
    };
    this.showName = function (name) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        $(editContainer).find(".s3dAnimationEditorInputAnimationName").val(name);
        $(editContainer).find(".s3dAnimationEditorInputAnimationName").attr("lastValue", name);
    };
    this.clearGroups = function () {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let leftInnerContainer = $(editContainer).find(".s3dAnimationEditorLeftInner");
        $(leftInnerContainer).empty();
    };
    this.clearTrackList = function () {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let trackContainer = $(editContainer).find(".s3dAnimationEditorSubContainer[name='track']");
        $(trackContainer).empty();
    };
    this.clearCurve = function () {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let curveContainer = $(editContainer).find(".s3dAnimationEditorSubContainer[name='curve']");
        $(curveContainer).empty();
    };
    this.showAllGroups = function (editingInfo) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let leftInnerContainer = $(editContainer).find(".s3dAnimationEditorLeftInner");
        let html = "";
        for (let i = 0; i < editingInfo.groupCodes.length; i++) {
            let groupCode = editingInfo.groupCodes[i];
            let group = editingInfo.groupMap[groupCode];
            html += thatAnimationEditor.getGroupHtml(group);
        }
        $(leftInnerContainer).html(html);
    };
    this.showAllStates = function (editingInfo) {
        let hiddenObjectIdMap = {};
        for (let i = 0; i < editingInfo.states.length; i++) {
            let stateInfo = editingInfo.states[i];
            hiddenObjectIdMap[stateInfo.objectId] = true;
        }
        let displayObjectIds = [];
        let hiddenObjectIds = [];
        for (let objectId in thatAnimationEditor.manager.viewer.allObject3DMap) {
            if (hiddenObjectIdMap[objectId]) {
                hiddenObjectIds.push(objectId);
            } else {
                displayObjectIds.push(objectId);
            }
        }
        thatAnimationEditor.manager.viewer.setObject3DsVisible(displayObjectIds, true);
        thatAnimationEditor.manager.viewer.setObject3DsVisible(hiddenObjectIds, false);
        thatAnimationEditor.manager.treeEditor.refreshAllNodeCheckStatus();
    };
    this.bindAllGroupAndTrackListEvents = function (editingInfo) {
        $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        for (let i = 0; i < editingInfo.groupCodes.length; i++) {
            let groupCode = editingInfo.groupCodes[i];
            thatAnimationEditor.bindGroupEvents(groupCode);
            thatAnimationEditor.bindGroupTrackListEvents(groupCode);
        }
    };
    this.showAllTrackList = function (editingInfo) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let trackContainer = $(editContainer).find(".s3dAnimationEditorSubContainer[name='track']");
        let html = "";
        for (let i = 0; i < editingInfo.groupCodes.length; i++) {
            let groupCode = editingInfo.groupCodes[i];
            let group = editingInfo.groupMap[groupCode];
            html += thatAnimationEditor.getTrackItemHtml(groupCode, "");
            for (let j = 0; j < group.trackCodes.length; j++) {
                let trackCode = group.trackCodes[j];
                let track = group.trackMap[trackCode];
                html += thatAnimationEditor.getTrackItemHtml(groupCode, track.code);
            }
        }
        $(trackContainer).html(html);
        thatAnimationEditor.bindGroupEvents();
    };
    this.getGroupHtml = function (group) {
        let object3D = thatAnimationEditor.manager.viewer.getObject3DById(group.objectId);
        let objectName = object3D == null ? "" : object3D.userData.info.name;
        let limitInfo = thatAnimationEditor.getGroupInputLimit(group.name, group.type);
        let groupText = thatAnimationEditor.getGroupText(group.objectId, group.name, group.type);
        let originalValue = thatAnimationEditor.manager.userAnimations.getEditValueFromOriginal(group.objectId, group.name, group.type);
        let html = "";
        html += "<div class='s3dAnimationEditorGroupContainer s3dAnimationEditorGroupContainerExpand'";
        html += "objectId='" + group.objectId + "'";
        html += "groupCode='" + group.code + "'";
        html += "groupName='" + group.name + "'";
        html += "groupType='" + group.type + "'";
        html += ">";
        html += "<div class='s3dAnimationEditorGroupHeader' groupCode='" + group.code + "'>";
        html += "<div class='s3dAnimationEditorGroupHeaderImage'>&#9654;</div>";
        html += "<div class='s3dAnimationEditorGroupHeaderTitle'>" + cmnPcr.htmlEncode(objectName + "." + groupText) + "</div>";
        html += "<div class='s3dAnimationEditorGroupHeaderDeleteBtn'>&#10006;</div>";
        html += "</div>";
        html += "<div class='s3dAnimationEditorGroupInner'>";
        for (let i = 0; i < group.trackCodes.length; i++) {
            let trackCode = group.trackCodes[i];
            let track = group.trackMap[trackCode];
            let trackOriginalValue = originalValue[track.name];
            html += thatAnimationEditor.getTrackHeaderHtml(group.code, groupText, group.name, group.type, track.code, track.name, limitInfo, trackOriginalValue);
        }
        html += "</div>";
        html += "</div>";
        return html;
    };
    this.restoreAllOriginalValues = function () {
        let allGroupContainers = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer .s3dAnimationEditorGroupContainer");
        for (let i = 0; i < allGroupContainers.length; i++) {
            let groupContainer = allGroupContainers[i];
            let objectId = $(groupContainer).attr("objectId");
            let groupName = $(groupContainer).attr("groupName");
            let groupType = $(groupContainer).attr("groupType");
            thatAnimationEditor.restoreOriginalValue(objectId, groupName, groupType);
        }
    };
    this.restoreOriginalValue = function (objectId, propertyName, groupType) {
        switch (groupType) {
            case s3dAnimationGroupType.material:
            {
                thatAnimationEditor.restoreOriginalMaterialValue(objectId, propertyName);
                break;
            }
            case s3dAnimationGroupType.property:
            {
                thatAnimationEditor.restoreOriginalPropertyValue(objectId, propertyName);
                break;
            }
            default:
            {
                throw "不支持的分组类型. GroupType=" + groupType;
            }
        }
    };
    this.restoreOriginalMaterialValue = function (objectId, path) {
        let groupContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer .s3dAnimationEditorGroupContainer[objectId='" + objectId + "'][groupName='" + path + "']");
        let trackHeaders = groupContainer.find(".s3dAnimationEditorTrackHeader");
        let materialPropertyItem = thatAnimationEditor.getMaterialPropertyItemByPath(objectId, path);
        if (materialPropertyItem != null) {
            let originalValue = {};
            for (let i = 0; i < trackHeaders.length; i++) {
                let trackHeader = trackHeaders[i];
                let trackName = $(trackHeader).attr("trackName");
                originalValue[trackName] = parseFloat($(trackHeader).attr("originalValue"));
            }
            let materialPropertyName = thatAnimationEditor.manager.userAnimations.getMaterialPropertyPostfix(path);
            switch (materialPropertyName) {
                case "opacity":
                {
                    materialPropertyItem.material.opacity = originalValue.value;
                    break;
                }
                case "color":
                {
                    materialPropertyItem.material.color.r = originalValue.r;
                    materialPropertyItem.material.color.g = originalValue.g;
                    materialPropertyItem.material.color.b = originalValue.b;
                    break;
                }
            }
        }
    };
    this.restoreOriginalPropertyValue = function (objectId, propertyName) {
        let groupContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer .s3dAnimationEditorGroupContainer[objectId='" + objectId + "'][groupName='" + propertyName + "']");
        let trackHeaders = groupContainer.find(".s3dAnimationEditorTrackHeader");
        let originalValue = {};
        for (let i = 0; i < trackHeaders.length; i++) {
            let trackHeader = trackHeaders[i];
            let trackName = $(trackHeader).attr("trackName");
            originalValue[trackName] = parseFloat($(trackHeader).attr("originalValue"));
        }
        let object3D = thatAnimationEditor.manager.viewer.getObject3DById(objectId);
        let objectPropertyInfo = {
            position: {
                x: object3D.position.x,
                y: object3D.position.y,
                z: object3D.position.z
            },
            rotation: {
                x: object3D.rotation.x,
                y: object3D.rotation.y,
                z: object3D.rotation.z
            },
            scale: {
                x: object3D.scale.x,
                y: object3D.scale.y,
                z: object3D.scale.z
            }
        };
        switch (propertyName) {
            case "position":
            {
                objectPropertyInfo.position.x = common3DFunction.v2s(originalValue.x, thatAnimationEditor.manager.viewer.distanceRatio);
                objectPropertyInfo.position.y = common3DFunction.v2s(originalValue.y, thatAnimationEditor.manager.viewer.distanceRatio);
                objectPropertyInfo.position.z = common3DFunction.v2s(originalValue.z, thatAnimationEditor.manager.viewer.distanceRatio);
                break;
            }
            case "rotation":
            {
                objectPropertyInfo.rotation.x = common3DFunction.degree2radian(originalValue.x);
                objectPropertyInfo.rotation.y = common3DFunction.degree2radian(originalValue.y);
                objectPropertyInfo.rotation.z = common3DFunction.degree2radian(originalValue.z);
                break;
            }
            case "scale":
            {
                objectPropertyInfo.scale.x = originalValue.x;
                objectPropertyInfo.scale.y = originalValue.y;
                objectPropertyInfo.scale.z = originalValue.z;
                break;
            }
        }
        thatAnimationEditor.manager.viewer.setObjectPositionRotationScaleById(objectId, object3D.userData.info.userWorldPosition, objectPropertyInfo.position, objectPropertyInfo.rotation, objectPropertyInfo.scale);
    };
    this.getGroupText = function (objectId, groupName, groupType) {
        switch (groupType) {
            case s3dAnimationGroupType.material:
            {
                return thatAnimationEditor.getMaterialText(objectId, groupName);
            }
            case s3dAnimationGroupType.property:
            {
                return thatAnimationEditor.getPropertyText(groupName);
            }
            default:
            {
                throw "不支持的分组类型. GroupType=" + groupType;
            }
        }
    };
    this.getMaterialText = function (objectId, path) {
        let materialPropertyItem = thatAnimationEditor.getMaterialPropertyItemByPath(objectId, path);
        return "材质." + (materialPropertyItem == null ? "" : materialPropertyItem.text);
    };
    this.getPropertyText = function (propertyName) {
        let text = "";
        switch (propertyName) {
            case "position":
            {
                text = "位置";
                break;
            }
            case "rotation":
            {
                text = "旋转";
                break;
            }
            case "scale":
            {
                text = "缩放";
                break;
            }
        }
        return text;
    };
    this.getGroupDefaultTrackNames = function (objectId, groupName, groupType) {
        let trackNames = [];
        switch (groupType) {
            case s3dAnimationGroupType.property:
            {
                switch (groupName) {
                    case "position":
                    case "rotation":
                    case "scale":
                    {
                        trackNames.push("x");
                        trackNames.push("y");
                        trackNames.push("z");
                        break;
                    }
                }
                break;
            }
            case s3dAnimationGroupType.material:
            {
                let propertyName = thatAnimationEditor.manager.userAnimations.getMaterialPropertyPostfix(groupName);
                switch (propertyName) {
                    case "opacity":
                    {
                        trackNames.push("value");
                        break;
                    }
                    case "color":
                    {
                        trackNames.push("r");
                        trackNames.push("g");
                        trackNames.push("b");
                        break;
                    }
                }
                break;
            }
        }
        return trackNames;
    };
    this.getGroupInputLimit = function (groupName, groupType) {
        let min = null;
        let max = null;
        let step = null;
        switch (groupType) {
            case s3dAnimationGroupType.property:
            {
                switch (groupName) {
                    case "position":
                    {
                        step = 1;
                        break;
                    }
                    case "rotation":
                    {
                        step = 5;
                        break;
                    }
                    case "scale":
                    {
                        step = 0.1;
                        break;
                    }
                }
                break;
            }
            case s3dAnimationGroupType.material:
            {
                let propertyName = thatAnimationEditor.manager.userAnimations.getMaterialPropertyPostfix(groupName);
                switch (propertyName) {
                    case "opacity":
                    {
                        min = 0;
                        max = 1;
                        step = 0.1;
                        break;
                    }
                    case "color":
                    {
                        min = 0;
                        max = 1;
                        step = 0.1;
                        break;
                    }
                }
                break;
            }
        }
        return {
            min: min,
            max: max,
            step: step
        };
    };
    this.getTrackHeaderHtml = function (groupCode, groupText, groupName, groupType, trackCode, trackName, limitInfo, trackOriginalValue) {
        let trackText = thatAnimationEditor.manager.userAnimations.getTrackText(trackName, groupType, groupName);
        let html = "";
        html += "<div class='s3dAnimationEditorTrackHeader ' groupCode = '" + groupCode + "' trackCode='" + trackCode + "'  trackName='" + trackName + "' originalValue='" + trackOriginalValue + "'>";
        html += "<div class='s3dAnimationEditorTrackHeaderTitle'>" + cmnPcr.htmlEncode(trackText) + "</div>";
        html += "<div class='s3dAnimationEditorTrackHeaderValue'>";
        html += "<input type='number' class='s3dAnimationEditorInputValue' ";
        if (limitInfo.min != null) {
            html += " min='" + limitInfo.min + "'";
        }
        if (limitInfo.max != null) {
            html += " max='" + limitInfo.max + "'";
        }
        if (limitInfo.step != null) {
            html += " step='" + limitInfo.step + "'";
        }
        html += " />";
        html += "</div>";
        html += "</div>";
        return html;
    };
    this.getTrackItemHtml = function (groupCode, trackCode) {
        let html = "";
        html += "<div class='s3dAnimationEditorTrackItem' groupCode = '" + groupCode + "' trackCode='" + trackCode + "'>";
        html += "</div>";
        return html;
    };
    this.applyAnimation = function () {
        if(thatAnimationEditor.editingAnimationCode != null) {
            thatAnimationEditor.stopAnimation();
            let editingInfo = thatAnimationEditor.getEditingInfoFromUI();
            let newAnimationInfo = thatAnimationEditor.convertToAnimationInfo(editingInfo);
            if (newAnimationInfo.name.length === 0) {
                msgBox.alert({
                    info: "请录入动画名称"
                });
            } else if (thatAnimationEditor.manager.userAnimations.checkSameNameAnimation(newAnimationInfo.code, newAnimationInfo.name)) {
                msgBox.alert({
                    info: "存在重名的动画"
                });
            } else {
                let oldAnimationInfo = thatAnimationEditor.manager.userAnimations.getAnimationInfo(newAnimationInfo.code);
                thatAnimationEditor.manager.animationList.beginAddToUndoList(s3dAnimationEditType.edit, oldAnimationInfo.code, oldAnimationInfo);
                thatAnimationEditor.manager.userAnimations.updateAnimation(newAnimationInfo);
                thatAnimationEditor.manager.animationList.refreshAnimation(newAnimationInfo.code);
                thatAnimationEditor.manager.animationList.endAddToUndoList(s3dAnimationEditType.edit, newAnimationInfo.code, newAnimationInfo);
                return newAnimationInfo;
            }
        }
    };
    this.closeAnimation = function (hasConfirm) {
        if (!hasConfirm || msgBox.confirm({
            info: "取消编辑吗?"
        })) {
            thatAnimationEditor.stopAnimation();
            thatAnimationEditor.manager.layout.hideBlock("animationEditor");
            thatAnimationEditor.clearAnimation();
        }
    };
    this.saveAnimation = function () {
        let newAnimationInfo = thatAnimationEditor.applyAnimation();
        if (newAnimationInfo) {
            thatAnimationEditor.manager.layout.hideBlock("animationEditor");
            thatAnimationEditor.clearAnimation();
        }
    };
    this.clearTimeline = function () {
        let editorTimeline = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorTimeline");
        $(editorTimeline).empty();
    };
    this.initTimeline = function () {
        let html = "";
        for (let i = 0; i <= thatAnimationEditor.manager.userAnimations.enableMaxFrameCount; i++) {
            html += thatAnimationEditor.getTimeSpanHtml(i);
        }
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let editorTimeline = $(editContainer).find(".s3dAnimationEditorTimeline");
        $(editorTimeline).html(html);
        thatAnimationEditor.refreshSpanWidth();
        thatAnimationEditor.refreshCenterSubContainerWidth();
        thatAnimationEditor.showTimeSplitLine(0);
        thatAnimationEditor.bindTimelineEvents();
    };
    this.bindTimelineEvents = function () {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let editorTimeline = $(editContainer).find(".s3dAnimationEditorTimeline");
        $(editorTimeline).find(".s3dAnimationEditorTimeSpan").click(function () {
            let frameIndex = parseInt($(this).attr("frameIndex"));
            thatAnimationEditor.updateTimeSplitLine(frameIndex);
            thatAnimationEditor.refreshViewerObjects(frameIndex);
        });
        $(editorTimeline).find(".s3dAnimationEditorTimeSpan").mousemove(function (ev) {
            if (ev.buttons === 1) {
                let frameIndex = parseInt($(this).attr("frameIndex"));
                thatAnimationEditor.updateTimeSplitLine(frameIndex);
                thatAnimationEditor.refreshViewerObjects(frameIndex);
                ev.preventDefault();
            }
        });
    };

    //插入关键帧
    this.addKeyFrame = function () {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let timeSplitLine = $(editContainer).find(".s3dAnimationEditorTimeSplitLine");
        let frameIndex = parseInt($(timeSplitLine).attr("frameIndex"));
        let allTrackItems = $(editContainer).find(".s3dAnimationEditorTrackItem[trackCode!='']");
        for (let i = 0; i < allTrackItems.length; i++) {
            let trackItem = allTrackItems[i];
            let trackCode = $(trackItem).attr("trackCode");
            let leftLineType = "linear";
            let rightLineType = "linear";
            thatAnimationEditor.addTrackKeyFrameBtn({
                trackCode: trackCode,
                frameIndex: frameIndex,
                leftLineType: leftLineType,
                rightLineType: rightLineType
            });
        }
        thatAnimationEditor.refreshTrackHeaderValues();
        thatAnimationEditor.refreshKeyFrameRange();
        thatAnimationEditor.addEditingToUndoList(s3dAnimationEditType.addKeyFrame);
    };
    this.updateTrackKeyFrameValue = function (trackCode, frameIndex, value) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let trackItem = $(editContainer).find(".s3dAnimationEditorTrackItem[trackCode='" + trackCode + "'] .s3dAnimationEditorKeyFrameBtn[frameIndex='" + frameIndex + "']");
        $(trackItem).attr("value", value);
    };
    this.removeTrackKeyFrameBtn = function (btnCode) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let keyFrameBtn = $(editContainer).find(".s3dAnimationEditorKeyFrameBtn[btnCode='" + btnCode + "']");
        $(keyFrameBtn).remove();
    };
    this.refreshKeyFrameRange = function () {
        let maxFrameIndex = thatAnimationEditor.calcFrameCount();
        let rangeWidth = thatAnimationEditor.calcTimeSplitLinePosition(maxFrameIndex);
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        $(editContainer).find(".s3dAnimationEditorKeyFrameRange").width(rangeWidth);
    };
    this.addTrackKeyFrameBtn = function (p) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let trackItem = $(editContainer).find(".s3dAnimationEditorTrackItem[trackCode='" + p.trackCode + "']");
        let keyFrameBtn = $(trackItem).find(".s3dAnimationEditorKeyFrameBtn[frameIndex='" + p.frameIndex + "']");
        if (keyFrameBtn.length === 0) {
            let x = thatAnimationEditor.calcTrackKeyFramePosition(p.frameIndex);
            let style = "left:" + x + "px;";
            style += "z-index:" + p.frameIndex + ";";
            if (p.value == null) {
                p.value = thatAnimationEditor.calcKeyFrameValue(p.trackCode, p.frameIndex);
            }
            let btnCode = cmnPcr.createGuid();
            let btnHtml = "<div class='s3dAnimationEditorKeyFrameBtn'" + " btnCode='" + btnCode + "'" + " leftLineType='" + p.leftLineType + "'" + " rightLineType='" + p.rightLineType + "'" + " style='" + style + "'" + " frameIndex='" + p.frameIndex + "' " + " value='" + (p.value == null ? "" : p.value) + "'>&#9830;</div>";
            $(trackItem).append(btnHtml);
            thatAnimationEditor.bindTrackKeyFrameEvents(p.trackCode, btnCode, p.frameIndex);
        }
    };
    this.focusTrackKeyFrameBtn = function (btnCode) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        $(editContainer).find(".s3dAnimationEditorKeyFrameBtn").removeClass("s3dAnimationEditorKeyFrameBtnActive");
        let keyFrameBtn = $(editContainer).find(".s3dAnimationEditorKeyFrameBtn[btnCode='" + btnCode + "']");
        $(keyFrameBtn).addClass("s3dAnimationEditorKeyFrameBtnActive");
        let frameIndex = parseInt($(keyFrameBtn).attr("frameIndex"));
        thatAnimationEditor.updateTimeSplitLine(frameIndex);
        thatAnimationEditor.refreshViewerObjects(frameIndex);
    };
    this.bindTrackKeyFrameEvents = function (trackCode, btnCode, frameIndex) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let trackItem = $(editContainer).find(".s3dAnimationEditorTrackItem[trackCode='" + trackCode + "']");
        let trackKeyFrameBtn = $(trackItem).find(".s3dAnimationEditorKeyFrameBtn[btnCode='" + btnCode + "']");
        $(trackKeyFrameBtn).click(function () {
            thatAnimationEditor.focusTrackKeyFrameBtn(btnCode);
        });
        $(trackKeyFrameBtn).mousedown(function () {
            if ($(this).hasClass("s3dAnimationEditorKeyFrameBtnActive")) {
                let frameIndex = parseInt($(this).attr("frameIndex"));
                let trackItem = $(this).parent();
                let groupCode = $(trackItem).attr("groupCode");
                let trackCode = $(trackItem).attr("trackCode");
                let btnCode = $(this).attr("btnCode");
                thatAnimationEditor.keyFrameDragInfo = {
                    id: cmnPcr.createGuid(),
                    dragging: true,
                    btnCode: btnCode,
                    groupCode: groupCode,
                    trackCode: trackCode,
                    frameIndex: frameIndex
                };
            }
        });
        $(trackKeyFrameBtn).contextmenu(function (ev) {
            ev.preventDefault();
            let btnCode = $(this).attr("btnCode");
            let leftLineType = $(this).attr("leftLineType");
            let rightLineType = $(this).attr("rightLineType");
            thatAnimationEditor.showKeyFrameMenu({
                btnCode,
                leftLineType: leftLineType,
                rightLineType: rightLineType
            }, ev);
        });
    };
    this.refreshTrackKeyFrame = function () {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let trackKeyFrameBtns = $(editContainer).find(".s3dAnimationEditorKeyFrameBtn");
        for (let i = 0; i < trackKeyFrameBtns.length; i++) {
            let trackKeyFrameBtn = trackKeyFrameBtns[i];
            let frameIndex = parseInt($(trackKeyFrameBtn).attr("frameIndex"));
            let x = thatAnimationEditor.calcTrackKeyFramePosition(frameIndex);
            $(trackKeyFrameBtn).css({
                left: x + "px"
            });
        }
    };
    this.updateTrackKeyFrameByBtnCode = function (btnCode, newFrameIndex, value) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let trackKeyFrameBtn = $(editContainer).find(".s3dAnimationEditorKeyFrameBtn[btnCode='" + btnCode + "']");
        let x = thatAnimationEditor.calcTrackKeyFramePosition(newFrameIndex);
        $(trackKeyFrameBtn).css({
            left: x + "px"
        });
        $(trackKeyFrameBtn).attr("frameIndex", newFrameIndex);
        $(trackKeyFrameBtn).attr("value", value);
    };
    this.showAllTrackKeyFrames = function (editingInfo) {
        for (let i = 0; i < editingInfo.groupCodes.length; i++) {
            let groupCode = editingInfo.groupCodes[i];
            let group = editingInfo.groupMap[groupCode];
            for (let j = 0; j < group.trackCodes.length; j++) {
                let trackCode = group.trackCodes[j];
                let track = group.trackMap[trackCode];
                for (let k = 0; k < track.keyFrames.length; k++) {
                    let keyFrame = track.keyFrames[k];
                    thatAnimationEditor.addTrackKeyFrameBtn({
                        trackCode: trackCode,
                        frameIndex: keyFrame.frameIndex,
                        leftLineType: keyFrame.leftLineType,
                        rightLineType: keyFrame.rightLineType,
                        value: keyFrame.value
                    });
                }
            }
        }
    };
    this.clearAllTrackKeyFrames = function () {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        $(editContainer).find(".s3dAnimationEditorKeyFrameBtn").remove();
    };
    this.calcTrackKeyFramePosition = function (frameIndex) {
        let x = thatAnimationEditor.calcTimeSplitLinePosition(frameIndex);
        return x - 5;
    };
    this.calcTimeSplitLinePosition = function (frameIndex) {
        let left = frameIndex * thatAnimationEditor.spanWidth + thatAnimationEditor.spanWidth / 2;
        return left;
    };
    this.clearTimeSplitLine = function () {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        $(editContainer).find(".s3dAnimationEditorTimeSplitLine").remove();
    };
    this.refreshTimeSplitLine = function () {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let timeSplitLine = $(editContainer).find(".s3dAnimationEditorTimeSplitLine");
        let frameIndex = parseInt($(timeSplitLine).attr("frameIndex"));
        let x = thatAnimationEditor.calcTimeSplitLinePosition(frameIndex);
        $(timeSplitLine).css({
            left: x + "px"
        });
        thatAnimationEditor.updateTrackHeaderValues(frameIndex);
        thatAnimationEditor.refreshViewerObjects(frameIndex);
    };
    this.refreshViewerObjects = function (frameIndex) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let allGroupContainers = $(editContainer).find(".s3dAnimationEditorGroupContainer");
        for (let i = 0; i < allGroupContainers.length; i++) {
            let groupContainer = allGroupContainers[i];
            let objectId = $(groupContainer).attr("objectId");
            let groupName = $(groupContainer).attr("groupName");
            let groupType = $(groupContainer).attr("groupType");
            let groupFrameValue = {};
            let allTrackHeaders = $(groupContainer).find(".s3dAnimationEditorTrackHeader");
            for (let j = 0; j < allTrackHeaders.length; j++) {
                let trackHeader = allTrackHeaders[j];
                let trackCode = $(trackHeader).attr("trackCode");
                let trackName = $(trackHeader).attr("trackName");
                let frameValue = thatAnimationEditor.calcKeyFrameValue(trackCode, frameIndex);
                groupFrameValue[trackName] = frameValue;
            }
            thatAnimationEditor.manager.userAnimations.refreshViewerObject(objectId, groupName, groupType, groupFrameValue);
        }
    };
    this.updateTimeSplitLinePosition = function (timeSplitLine, frameIndex) {
        let x = frameIndex * thatAnimationEditor.spanWidth + thatAnimationEditor.spanWidth / 2;
        $(timeSplitLine).css({
            left: x + "px"
        });
    };
    this.updateTimeSplitLine = function (frameIndex) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let timeSplitLine = $(editContainer).find(".s3dAnimationEditorTimeSplitLine");
        $(timeSplitLine).attr("frameIndex", frameIndex);
        let x = thatAnimationEditor.calcTimeSplitLinePosition(frameIndex);
        $(timeSplitLine).css({
            left: x + "px"
        });

        //刷新trackHeader中显示的值
        thatAnimationEditor.updateTrackHeaderValues(frameIndex);
    };
    this.refreshTrackHeaderValues = function () {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let timeSplitLine = $(editContainer).find(".s3dAnimationEditorTimeSplitLine");
        let frameIndex = parseInt($(timeSplitLine).attr("frameIndex"));
        thatAnimationEditor.updateTrackHeaderValues(frameIndex);
    };
    this.updateTrackHeaderValues = function (frameIndex) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let allTrackHeaders = $(editContainer).find(".s3dAnimationEditorTrackHeader");
        for (let i = 0; i < allTrackHeaders.length; i++) {
            let trackHeader = allTrackHeaders[i];
            let trackCode = $(trackHeader).attr("trackCode");
            thatAnimationEditor.updateTrackHeaderValue(trackCode, frameIndex);
        }
    };
    this.updateTrackHeaderValue = function (trackCode, frameIndex) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let trackHeaderInput = $(editContainer).find(".s3dAnimationEditorTrackHeader[trackCode='" + trackCode + "'] .s3dAnimationEditorInputValue");
        let frameValue = thatAnimationEditor.calcKeyFrameValue(trackCode, frameIndex);
        $(trackHeaderInput).val(frameValue);

        //判断是否可编辑（如果没有对应的关键帧，那么不允许编辑）
        let keyFrameBtns = $(editContainer).find(".s3dAnimationEditorTrackItem[trackCode='" + trackCode + "'] .s3dAnimationEditorKeyFrameBtn[frameIndex='" + frameIndex + "']");
        if (keyFrameBtns.length === 0) {
            $(trackHeaderInput).attr("readonly", true);
            $(trackHeaderInput).addClass("s3dAnimationEditorInputValueReadonly");
        } else {
            $(trackHeaderInput).attr("readonly", false);
            $(trackHeaderInput).removeClass("s3dAnimationEditorInputValueReadonly");
        }
    };
    this.showTimeSplitLine = function (frameIndex) {
        let x = thatAnimationEditor.calcTimeSplitLinePosition(frameIndex);
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let editorTimeline = $(editContainer).find(".s3dAnimationEditorTimeline");
        let centerInnerContainer = $(editContainer).find(".s3dAnimationEditorCenterInner");
        let timeSplitLineHtml = "<div class='s3dAnimationEditorTimeSplitLine' frameIndex='" + frameIndex + "'></div>";
        $(editorTimeline).append(timeSplitLineHtml);
        $(centerInnerContainer).append(timeSplitLineHtml);
        $(editContainer).find(".s3dAnimationEditorTimeSplitLine").css({
            left: x + "px"
        });
    };
    this.refreshCenterSubContainerWidth = function (ev) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let centerInner = $(editContainer).find(".s3dAnimationEditorCenterInner");
        let trackListContainer = $(editContainer).find(".s3dAnimationEditorSubContainer[name='track']");
        let curveContainer = $(editContainer).find(".s3dAnimationEditorSubContainer[name='curve']");
        let editorTimeline = $(editContainer).find(".s3dAnimationEditorTimeline");
        let newWidth = $(editorTimeline).width();
        let offsetLeft = 0;
        if (ev != null) {
            let xInTrack = ev.clientX - $(trackListContainer).offset().left;
            let lastWidth = $(trackListContainer).width();
            let xInCenter = ev.clientX - $(centerInner).offset().left;
            let xInTrackNew = xInTrack * newWidth / lastWidth;
            offsetLeft = xInTrackNew - xInCenter;
            if (offsetLeft < 0) {
                offsetLeft = 0;
            }
        }
        $(trackListContainer).width(newWidth);
        $(curveContainer).width(newWidth);
        thatAnimationEditor.syncScrollCenterHeaderAndInner(offsetLeft);
    };
    this.syncScrollCenterHeaderAndInner = function (scrollLeft) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let center = $(editContainer).find(".s3dAnimationEditorCenterInner")[0];
        let centerHeader = $(editContainer).find(".s3dAnimationEditorCenterHeader")[0];
        center.scrollLeft = scrollLeft;
        centerHeader.scrollLeft = scrollLeft;
    };
    this.getTimeSpanHtml = function (frameIndex) {
        let secondIndex = Math.floor(frameIndex / thatAnimationEditor.manager.userAnimations.defaultFPS);
        let partIndex = frameIndex % thatAnimationEditor.manager.userAnimations.defaultFPS;
        let html = "";
        let isIntDiv5 = frameIndex % 5 === 0;
        let isIntDiv15 = frameIndex % 15 === 0;
        let isIntDiv30 = frameIndex % 30 === 0;
        let isIntDiv60 = frameIndex % 60 === 0;
        html += "<div class='s3dAnimationEditorTimeSpan' frameIndex='" + frameIndex + "'>";
        html += "<div class='s3dAnimationEditorTimeSpanInner";
        if (isIntDiv60) {
            html += " s3dAnimationEditorIntDiv60";
        } else if (isIntDiv30) {
            html += " s3dAnimationEditorIntDiv30";
        } else if (isIntDiv15) {
            html += " s3dAnimationEditorIntDiv15";
        } else if (isIntDiv5) {
            html += " s3dAnimationEditorIntDiv5";
        } else {
            html += " s3dAnimationEditorIntDiv1";
        }
        html += "'>";
        html += "<div class='s3dAnimationEditorTimeSpanLine'></div>";
        html += "<div class='s3dAnimationEditorTimeSpanText'>" + secondIndex + ":" + partIndex.toString().padStart(2, "0") + "</div>";
        html += "</div>";
        html += "</div>";
        return html;
    };
    this.closeMenu = function () {
        let container = $("#" + thatAnimationEditor.containerId);
        $(container).find(".s3dAnimationEditorMenuOuterContainer").remove();
    };
    this.showKeyFrameMenu = function (p, ev) {
        let html = "<div class='s3dAnimationEditorMenuOuterContainer'>";
        html += "<div class='s3dAnimationEditorMenuBackground'></div>";
        html += "<div class='s3dAnimationEditorMenuContainer'>";
        html += "<div class='s3dAnimationEditorMenuItem s3dAnimationEditorKeyFrameTypeBtn' sideType='left' lineType='linear' title='将左侧设置为直线'><span class='s3dAnimationEditorMenuItemImage'>" + (p.leftLineType === "linear" ? "&#10004;" : "") + "</span>左侧直线</div>";
        html += "<div class='s3dAnimationEditorMenuItem s3dAnimationEditorKeyFrameTypeBtn' sideType='left' lineType='curve' title='将左侧设置为曲线'><span class='s3dAnimationEditorMenuItemImage'>" + (p.leftLineType === "curve" ? "&#10004;" : "") + "</span>左侧曲线</div>";
        html += "<div class='s3dAnimationEditorMenuItemSplitter'><span class='s3dAnimationEditorMenuItemSplitterLine'></span></div>";
        html += "<div class='s3dAnimationEditorMenuItem s3dAnimationEditorKeyFrameTypeBtn' sideType='right' lineType='linear' title='将右侧设置为直线'><span class='s3dAnimationEditorMenuItemImage'>" + (p.rightLineType === "linear" ? "&#10004;" : "") + "</span>右侧直线</div>";
        html += "<div class='s3dAnimationEditorMenuItem s3dAnimationEditorKeyFrameTypeBtn' sideType='right' lineType='curve' title='将右侧设置为曲线'><span class='s3dAnimationEditorMenuItemImage'>" + (p.rightLineType === "curve" ? "&#10004;" : "") + "</span>右侧曲线</div>";
        html += "<div class='s3dAnimationEditorMenuItemSplitter'><span class='s3dAnimationEditorMenuItemSplitterLine'></span></div>";
        html += "<div class='s3dAnimationEditorMenuItem s3dAnimationEditorDeleteKeyFrameBtn' title='删除关键帧'><span class='s3dAnimationEditorMenuItemImage'></span>删除</div>";
        html += "</div>";
        html += "</div>";
        let container = $("#" + thatAnimationEditor.containerId);
        $(container).append(html);

        //编辑详情
        $(container).find(".s3dAnimationEditorKeyFrameTypeBtn").click(function () {
            thatAnimationEditor.closeMenu();
            let btnCode = $(this).parent().attr("btnCode");
            let sideType = $(this).attr("sideType");
            let lineType = $(this).attr("lineType");
            thatAnimationEditor.setKeyFrameLineType(btnCode, sideType, lineType);
            thatAnimationEditor.addEditingToUndoList(s3dAnimationEditType.editKeyFrameLineType);
        });

        //删除关键帧
        $(container).find(".s3dAnimationEditorDeleteKeyFrameBtn").click(function () {
            thatAnimationEditor.closeMenu();
            if (msgBox.confirm({
                info: "确定删除吗?"
            })) {
                let btnCode = $(this).parent().attr("btnCode");
                thatAnimationEditor.removeTrackKeyFrameBtn(btnCode);
                thatAnimationEditor.refreshTimeSplitLine();
                thatAnimationEditor.refreshKeyFrameRange();
                thatAnimationEditor.addEditingToUndoList(s3dAnimationEditType.removeKeyFrame);
            }
        });

        //基本信息
        let menuContainer = $(container).find(".s3dAnimationEditorMenuContainer");
        $(menuContainer).attr("btnCode", p.btnCode);

        //初始化event
        $(container).find(".s3dAnimationEditorMenuOuterContainer").focus();
        $(container).find(".s3dAnimationEditorMenuBackground").mousedown(function () {
            thatAnimationEditor.closeMenu();
        });
        $(container).find(".s3dAnimationEditorMenuOuterContainer").keydown(function (ev) {
            switch (ev.keyCode) {
                case 27:
                {
                    thatAnimationEditor.closeMenu();
                    break;
                }
            }
        });
        $(container).find(".s3dAnimationEditorMenuBackground").click(function () {
            thatAnimationEditor.closeMenu();
        });

        //设置菜单显示位置
        let menuContainerHeight = $(menuContainer).height();
        let menuContainerWidth = $(menuContainer).width();
        let containerHeight = $(container).height();
        let containerWidth = $(container).width();
        if (ev.clientY + menuContainerHeight < containerHeight) {
            $(menuContainer).css({
                "top": ev.clientY + "px",
                "bottom": "auto"
            });
        } else {
            $(menuContainer).css({
                "top": "auto",
                "bottom": containerHeight - ev.clientY + "px"
            });
        }
        if (ev.clientX + menuContainerWidth < containerWidth) {
            $(menuContainer).css({
                "left": ev.clientX + "px",
                "right": "auto"
            });
        } else {
            $(menuContainer).css({
                "left": "auto",
                "right": containerWidth - ev.clientX + "px"
            });
        }
    };
    this.setKeyFrameLineType = function (btnCode, sideType, lineType) {
        let editContainer = $("#" + thatAnimationEditor.containerId).find(".s3dAnimationEditorContainer");
        let keyFrameBtn = $(editContainer).find(".s3dAnimationEditorKeyFrameBtn[btnCode='" + btnCode + "']");
        switch (sideType) {
            case "left":
            {
                $(keyFrameBtn).attr("leftLineType", lineType);
                break;
            }
            case "right":
            {
                $(keyFrameBtn).attr("rightLineType", lineType);
                break;
            }
        }
    };
    this.addEditingToUndoList = function (editType, targetCode) {
        let beginDoOtherInfo = {
            editType: editType,
            targetCode: targetCode,
            editingInfo: thatAnimationEditor.lastOperateInfo.editingInfo,
            uiInfo: thatAnimationEditor.lastOperateInfo.uiInfo
        };
        thatAnimationEditor.manager.statusBar.beginAddToUndoList({
            operateType: s3dOperateType.animation,
            otherInfo: beginDoOtherInfo
        });
        let editingInfo = thatAnimationEditor.getEditingInfoFromUI();
        let uiInfo = thatAnimationEditor.getUiInfo();
        let endDoOtherInfo = {
            editType: editType,
            targetCode: targetCode,
            editingInfo: editingInfo,
            uiInfo: uiInfo
        };
        let mergeCode = null;
        switch (editType) {
            case s3dAnimationEditType.editName:
            case s3dAnimationEditType.addGroup:
            case s3dAnimationEditType.removeGroup:
            case s3dAnimationEditType.addKeyFrame:
            case s3dAnimationEditType.removeKeyFrame:
            case s3dAnimationEditType.editKeyFrameLineType:
            {
                break;
            }
            case s3dAnimationEditType.editKeyFrameIndex:
            case s3dAnimationEditType.editKeyFrameValue:
            {
                mergeCode = editType + "_" + targetCode;
                break;
            }
        }
        thatAnimationEditor.manager.statusBar.endAddToUndoList({
            operateType: s3dOperateType.animation,
            otherInfo: endDoOtherInfo
        }, mergeCode);
        thatAnimationEditor.lastOperateInfo = {
            editingInfo: editingInfo,
            uiInfo: uiInfo
        };
    };
};

export default S3dAnimationEditor
