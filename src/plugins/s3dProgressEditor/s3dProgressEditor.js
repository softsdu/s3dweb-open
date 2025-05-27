import { s3dProgressEditType, cmnPcr, msgBox, PopupContainer, s3dProgressGroupType, s3dOperateType } from '../../commonjs/common/common.js';
import './S3dProgressEditor.css';

//编辑流程
let S3dProgressEditor = function () {
    //当前对象
    const thatProgressEditor = this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;

    //正在编辑的流程编码
    this.editingProgressCode = null;

    //对应的动画编码
    this.relatedAnimationCode = null;

    //上一步操作的结果
    this.lastOperateInfo = null;

    //一帧的间隔
    this.spanWidth = 1;

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

    //事件
    this.eventFunctions = {};
    this.addEventFunction = function (eventName, func) {
        let allFuncs = thatProgressEditor.eventFunctions[eventName];
        if (allFuncs == null) {
            allFuncs = [];
            thatProgressEditor.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    };
    this.doEventFunction = function (eventName, p) {
        let allFuncs = thatProgressEditor.eventFunctions[eventName];
        if (allFuncs != null) {
            for (let i = 0; i < allFuncs.length; i++) {
                let func = allFuncs[i];
                func(p);
            }
        }
    };

    //初始化
    this.init = function (p) {
        thatProgressEditor.containerId = p.containerId;
        thatProgressEditor.manager = p.manager;
        thatProgressEditor.showProgressEditor(p.config.title);

        //关闭时保存并清除界面
        thatProgressEditor.bindCloseEvent();
    };

    thatProgressEditor.bindCloseEvent = function (){
        thatProgressEditor.manager.layout.addEventFunction("beforeHideBlock", function (p){
            thatProgressEditor.showProgress(null);
        })
    }

    //显示
    this.showProgressEditor = function (title) {
        //构造html
        let html = thatProgressEditor.getHtml();
        let container = $("#" + thatProgressEditor.containerId);
        let progressEditorContainer = $(container).find(".s3dLayoutBlock[name='progressEditor']");
        $(progressEditorContainer).append(html);

        //toolbar
        let toolbarContainer = $(container).find(".s3dLayoutBlockToolbar[name='progressEditor']");
        let toolbarHtml = thatProgressEditor.getToolbarHtml();
        $(toolbarContainer).append(toolbarHtml);
        thatProgressEditor.bindEvents();
    };
    this.setZoomLevel = function (zoomLevel, ev) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let editorTimeLine = $(editContainer).find(".s3dProgressEditorTimeline");
        let oldZoomLevel = parseInt($(editorTimeLine).attr("zoomLevel"));
        if (zoomLevel !== oldZoomLevel) {
            let classPrefix = "s3dProgressEditorZoomLevel";
            let lastClass = classPrefix + oldZoomLevel;
            let newClass = classPrefix + zoomLevel;
            $(editorTimeLine).removeClass(lastClass);
            $(editorTimeLine).addClass(newClass);
            $(editorTimeLine).attr("zoomLevel", zoomLevel);
            thatProgressEditor.refreshSpanWidth();
            thatProgressEditor.updateNetworkChart();
            thatProgressEditor.refreshCenterSubContainerWidth(ev);
        }
    };
    this.bindEvents = function () {
        let container = $("#" + thatProgressEditor.containerId);
        $(container).find(".s3dProgressEditorInputProgressName").change(function () {
            thatProgressEditor.applyProgress();
        });
        $(container).find(".s3dProgressEditorAddGroupBtn").click(function () {
            thatProgressEditor.processAddNewGroup(null);
        });
        $(container).find(".s3dProgressEditorAddStepBtn").click(function () {
            thatProgressEditor.processAddNewStep(null);
        });
        $(container).find(".s3dProgressEditorGenerateAnimationBtn").click(function () {
            thatProgressEditor.generateAnimation();
        });
        $(container).find(".s3dProgressEditorToolbarMainCloseBtn").click(function () {
            thatProgressEditor.closeProgress(true);
        });
        $(container).find(".s3dProgressEditorToolbarBtnMainApplyBtn").click(function () {
            thatProgressEditor.applyProgress();
        });
        $(container).find(".s3dProgressEditorToolbarBtnMainOkBtn").click(function () {
            thatProgressEditor.saveProgress();
        });

        //left和center竖直同步滚动
        $(container).find(".s3dProgressEditorLeftInner").scroll(function () {
            thatProgressEditor.syncScrollLeftInnerAndTrackContainer(this.scrollTop);
        });
        $(container).find(".s3dProgressEditorSubContainer[name='track']").scroll(function () {
            thatProgressEditor.syncScrollLeftInnerAndTrackContainer(this.scrollTop);
        });

        //center的header和inner的水平同步滚动
        $(container).find(".s3dProgressEditorCenterInner").scroll(function () {
            thatProgressEditor.syncScrollCenterHeaderAndInner(this.scrollLeft);
        });

        //时间轴滚动
        $(container).find(".s3dProgressEditorCenterInner").bind("mousewheel", function (ev) {
            let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
            let editorTimeLine = $(editContainer).find(".s3dProgressEditorTimeline");
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
            thatProgressEditor.setZoomLevel(newZoomLevel);
            ev.preventDefault();
        });
    };

    this.refreshSpanWidth = function () {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let editorTimeline = $(editContainer).find(".s3dProgressEditorTimeline");
        thatProgressEditor.spanWidth = $(editorTimeline).find(".s3dProgressEditorTimeSpan").width();
    };


    this.syncScrollLeftInnerAndTrackContainer = function (scrollTop) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let leftContainer = $(editContainer).find(".s3dProgressEditorLeftInner")[0];
        let trackContainer = $(editContainer).find(".s3dProgressEditorSubContainer[name='track']")[0];
        leftContainer.scrollTop = scrollTop;
        trackContainer.scrollTop = scrollTop;
    };

    //获取树toolbar html
    this.getToolbarHtml = function () {
        let html = "<div class='s3dProgressEditorToolbar'>"
            /*放弃toolbar的功能
            + "<div class='s3dProgressEditorToolbarBtn s3dProgressEditorToolbarGenerateAnimationBtn' title='生成动画'>&#x2756;</div>"
            + "<div class='s3dProgressEditorToolbarBtn s3dProgressEditorToolbarMainCloseBtn' title='取消编辑'>&#10006;</div>"
            + "<div class='s3dProgressEditorToolbarBtn s3dProgressEditorToolbarBtnMainApplyBtn' title='接受修改'>&#9438;</div>"
            + "<div class='s3dProgressEditorToolbarBtn s3dProgressEditorToolbarBtnMainOkBtn' title='确定'>&#10004;</div>"
            */
            + "</div>";
        return html;
    };

    //获取list html
    this.getHtml = function () {
        let html = "<div class='s3dProgressEditorContainer'>";
        html += "<div class='s3dProgressEditorLeftContainer'>";
        html += "<div class='s3dProgressEditorLeftHeader'>";

        //流程名称
        html += "<div class='s3dProgressEditorInputContainer'><input class='s3dProgressEditorInputProgressName' placeholder='请输入流程名称' /></div>";

        //添加分组按钮
        html += "<div class='s3dProgressEditorBtn s3dProgressEditorAddGroupBtn' title='添加分组'>&#10012;</div>";

        //添加步骤按钮
        html += "<div class='s3dProgressEditorBtn s3dProgressEditorAddStepBtn' title='添加步骤'>&#x21b3;</div>";
        //添加步骤按钮
        html += "<div class='s3dProgressEditorBtn s3dProgressEditorGenerateAnimationBtn' title='生成动画'>&#x2756;</div>";
        html += "</div>";
        html += "<div class='s3dProgressEditorLeftInner'>";
        //罗列属性（分组），showProgress时显示
        html += "</div>";
        html += "</div>";
        html += "<div class='s3dProgressEditorCenterContainer'>";
        html += "<div class='s3dProgressEditorCenterHeader'>";
        //显示时间轴
        html += "<div class='s3dProgressEditorTimeline s3dProgressEditorZoomLevel5' zoomLevel='5'>";
        html += "</div>";
        html += "</div>";
        html += "<div class='s3dProgressEditorCenterInner'>";
        html += "<div class='s3dProgressEditorSubContainer s3dProgressEditorSubContainerActive' name='track'>Track</div>";
        html += "</div>";
        html += "</div>";
        html += "</div>";
        return html;
    };

    this.calcFrameCount = function () {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let keyFrameBtns = $(editContainer).find(".s3dProgressEditorKeyFrameBtn");
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
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let uiInfo = {
            leftScrollTop: $(editContainer).find(".s3dProgressEditorLeftInner")[0].scrollTop,
            centerScrollLeft: $(editContainer).find(".s3dProgressEditorCenterInner")[0].scrollLeft,
            timeLineZoomLevel: parseInt($(editContainer).find(".s3dProgressEditorTimeline").attr("zoomLevel"))
        };
        return uiInfo;
    };
    this.getEditingInfoFromUI = function () {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let progressName = $(editContainer).find(".s3dProgressEditorInputProgressName").val();
        let frameCount = thatProgressEditor.calcFrameCount();
        let editingInfo = {
            code: thatProgressEditor.editingProgressCode,
            name: progressName,
            relatedAnimationCode: thatProgressEditor.relatedAnimationCode,
            frameCount: frameCount,
            children: [],
            nodeMap: {},
            states: []
        };
        let rootContainer = $(editContainer).find(".s3dProgressEditorLeftInner")[0];
        editingInfo.children = thatProgressEditor.getEditingChildrenInfos(null, rootContainer, editingInfo.nodeMap);
        for (let objectId in thatProgressEditor.manager.viewer.allObject3DMap) {
            let object3D = thatProgressEditor.manager.viewer.allObject3DMap[objectId];
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
    this.getEditingChildrenInfos = function (parentId, parentContainer, nodeMap) {
        let childrenInfos = [];
        let allNodeContainers = $(parentContainer).children(".s3dProgressEditorNode");
        for (let i = 0; i < allNodeContainers.length; i++) {
            let nodeContainer = allNodeContainers[i];
            let isGroup = $(nodeContainer).hasClass("s3dProgressEditorGroupContainer");
            if (isGroup) {
                let groupJson = cmnPcr.strToJson($(nodeContainer).attr("groupJson"));
                let groupInfo = {
                    id: groupJson.id,
                    code: groupJson.code,
                    name: groupJson.name,
                    caption: groupJson.caption,
                    description: groupJson.description,
                    isGroup: true,
                    parentId: parentId,
                    children: null
                };
                let childrenContainer = $(nodeContainer).children(".s3dProgressEditorGroupInner")[0];
                groupInfo.children = thatProgressEditor.getEditingChildrenInfos(groupJson.id, childrenContainer, nodeMap);
                nodeMap[groupInfo.id] = groupInfo;
                childrenInfos.push(groupInfo.id);
            } else {
                let stepJson = cmnPcr.strToJson($(nodeContainer).attr("stepJson"));
                let startFrameStr = $(nodeContainer).attr("startFrame");
                let startFrame = startFrameStr == null || startFrameStr.length === 0 ? 0 : cmnPcr.strToDecimal(startFrameStr);
                let stepInfo = {
                    id: stepJson.id,
                    code: stepJson.code,
                    name: stepJson.name,
                    caption: stepJson.caption,
                    description: stepJson.description,
                    isGroup: false,
                    parentId: parentId,
                    objectId: stepJson.objectId,
                    startFrame: startFrame,
                    durationFrame: stepJson.durationFrame,
                    delayFrame: stepJson.delayFrame,
                    fadeIn: stepJson.fadeIn,
                    fadeOut: stepJson.fadeOut,
                    propertyMap: stepJson.propertyMap,
                    previousNodeIds: stepJson.previousNodeIds
                };
                nodeMap[stepInfo.id] = stepInfo;
                childrenInfos.push(stepInfo.id);
            }
        }
        return childrenInfos;
    };
    this.convertToProgressInfo = function (editingInfo) {
        let progressInfo = {
            code: editingInfo.code,
            name: editingInfo.name,
            relatedAnimationCode: editingInfo.relatedAnimationCode,
            frameCount: editingInfo.frameCount,
            children: [],
            nodeMap: {},
            states: []
        };
        for (let i = 0; i < editingInfo.children.length; i++) {
            let nodeId = editingInfo.children[i];
            progressInfo.children.push(nodeId);
        }
        for (let nodeId in editingInfo.nodeMap) {
            let editingNode = editingInfo.nodeMap[nodeId];
            if (editingNode.isGroup) {
                let group = {
                    id: editingNode.id,
                    code: editingNode.code,
                    name: editingNode.name,
                    caption: editingNode.caption,
                    description: editingNode.description,
                    isGroup: true,
                    parentId: editingNode.parentId,
                    children: []
                };
                for (let j = 0; j < editingNode.children.length; j++) {
                    let nodeId = editingNode.children[j];
                    group.children.push(nodeId);
                }
                progressInfo.nodeMap[group.id] = group;
            } else {
                let step = {
                    id: editingNode.id,
                    code: editingNode.code,
                    name: editingNode.name,
                    caption: editingNode.caption,
                    description: editingNode.description,
                    isGroup: false,
                    parentId: editingNode.parentId,
                    objectId: editingNode.objectId,
                    startFrame: editingNode.startFrame,
                    durationFrame: editingNode.durationFrame,
                    delayFrame: editingNode.delayFrame,
                    fadeIn: editingNode.fadeIn,
                    fadeOut: editingNode.fadeOut,
                    propertyMap: {},
                    previousNodeIds: []
                };
                for (let j = 0; j < editingNode.previousNodeIds.length; j++) {
                    let nodeId = editingNode.previousNodeIds[j];
                    step.previousNodeIds.push(nodeId);
                }
                for (let propertyName in editingNode.propertyMap) {
                    let editingProperty = editingNode.propertyMap[propertyName];
                    let property = {
                        name: editingProperty.name,
                        fromValues: [],
                        toValues: [],
                        fromLineType: editingProperty.fromLineType,
                        toLineType: editingProperty.toLineType
                    };
                    for (let j = 0; j < editingProperty.fromValues.length; j++) {
                        let editingValue = editingProperty.fromValues[j];
                        let value = thatProgressEditor.convertToProgressValue(editingValue, property.name);
                        property.fromValues.push(value);
                    }
                    for (let j = 0; j < editingProperty.toValues.length; j++) {
                        let editingValue = editingProperty.toValues[j];
                        let value = thatProgressEditor.convertToProgressValue(editingValue, property.name);
                        property.toValues.push(value);
                    }
                    step.propertyMap[property.name] = property;
                }
                progressInfo.nodeMap[step.id] = step;
            }
        }
        for (let i = 0; i < editingInfo.states.length; i++) {
            let editingState = editingInfo.states[i];
            let state = {
                objectId: editingState.objectId,
                visible: editingState.visible
            };
            progressInfo.states.push(state);
        }
        return progressInfo;
    };
    this.convertToEditingInfo = function (progressInfo) {
        let editingInfo = {
            code: progressInfo.code,
            name: progressInfo.name,
            relatedAnimationCode: progressInfo.relatedAnimationCode,
            frameCount: progressInfo.frameCount,
            children: [],
            nodeMap: {},
            states: [],
            errors: []
        };
        for (let nodeId in progressInfo.nodeMap) {
            let node = progressInfo.nodeMap[nodeId];
            if (!node.isGroup) {
                let object3D = thatProgressEditor.manager.viewer.getObject3DById(node.objectId);
                if (object3D == null) {
                    editingInfo.errors.push("流程中使用了已被删除的对象, StepName=" + node.name + ", ObjectId=" + node.objectId);
                }
            }
        }
        for (let i = 0; i < progressInfo.children.length; i++) {
            let nodeId = progressInfo.children[i];
            editingInfo.children.push(nodeId);
        }
        for (let nodeId in progressInfo.nodeMap) {
            let node = progressInfo.nodeMap[nodeId];
            if (node.isGroup) {
                let editingGroup = {
                    id: node.id,
                    code: node.code,
                    name: node.name,
                    caption: node.caption,
                    description: node.description,
                    isGroup: true,
                    parentId: node.parentId,
                    children: []
                };
                for (let j = 0; j < node.children.length; j++) {
                    let nodeId = node.children[j];
                    editingGroup.children.push(nodeId);
                }
                editingInfo.nodeMap[editingGroup.id] = editingGroup;
            } else {
                let editingStep = {
                    id: node.id,
                    code: node.code,
                    name: node.name,
                    caption: node.caption,
                    description: node.description,
                    isGroup: false,
                    parentId: node.parentId,
                    objectId: node.objectId,
                    startFrame: node.startFrame,
                    durationFrame: node.durationFrame,
                    delayFrame: node.delayFrame,
                    fadeIn: node.fadeIn,
                    fadeOut: node.fadeOut,
                    propertyMap: {},
                    previousNodeIds: []
                };
                for (let j = 0; j < node.previousNodeIds.length; j++) {
                    let nodeId = node.previousNodeIds[j];
                    editingStep.previousNodeIds.push(nodeId);
                }
                for (let propertyName in node.propertyMap) {
                    let property = node.propertyMap[propertyName];
                    let editingProperty = {
                        name: property.name,
                        fromValues: [],
                        toValues: [],
                        fromLineType: property.fromLineType,
                        toLineType: property.toLineType
                    };
                    for (let j = 0; j < property.fromValues.length; j++) {
                        let value = property.fromValues[j];
                        let editingValue = thatProgressEditor.convertToEditingPropertyValue(value, property.name);
                        editingProperty.fromValues.push(editingValue);
                    }
                    for (let j = 0; j < property.toValues.length; j++) {
                        let value = property.toValues[j];
                        let editingValue = thatProgressEditor.convertToEditingPropertyValue(value, property.name);
                        editingProperty.toValues.push(editingValue);
                    }
                    editingStep.propertyMap[editingProperty.name] = editingProperty;
                }
                editingInfo.nodeMap[editingStep.id] = editingStep;
            }
        }
        for (let i = 0; i < progressInfo.states.length; i++) {
            let state = progressInfo.states[i];
            let editingState = {
                objectId: state.objectId,
                visible: state.visible
            };
            editingInfo.states.push(editingState);
        }
        return editingInfo;
    };
    this.processAddNewStep = function (parentId) {
        let selectedObject3DIds = thatProgressEditor.manager.viewer.getSelectedObject3DIds();
        if (selectedObject3DIds.length === 0) {
            msgBox.alert({
                info: "请先选择一个物体, 再点击此按钮."
            });
        } else if (selectedObject3DIds.length > 1) {
            msgBox.alert({
                info: "仅可选择一个物体."
            });
        } else {
            let selectedObject3DId = selectedObject3DIds[0];
            let step = thatProgressEditor.addStep(parentId, selectedObject3DId);
            thatProgressEditor.addStepTrack(step);
            thatProgressEditor.refreshTrackHeaderValues();
            thatProgressEditor.bindStepEvents(step.id);
            thatProgressEditor.bindTrackEvents(step.id);
            thatProgressEditor.addEditingToUndoList(s3dProgressEditType.addStep);
            thatProgressEditor.showStepPropertyWindow(step.id);
        }
    };
    this.getNewNodeInfo = function (parentId, isGroup) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let parentContainer = null;
        let newCodePrefix = "";
        let newNamePrefix = isGroup ? "分组_" : "步骤_";
        if (parentId == null) {
            parentContainer = $(editContainer).find(".s3dProgressEditorLeftInner")[0];
        } else {
            let parentGroupContainer = $(editContainer).find(".s3dProgressEditorLeftInner").find(".s3dProgressEditorGroupContainer[nodeId='" + parentId + "']")[0];
            let parentGroupJson = cmnPcr.strToJson($(parentGroupContainer).attr("groupJson"));
            newCodePrefix = parentGroupJson.code + ".";
            parentContainer = $(parentGroupContainer).children(".s3dProgressEditorGroupInner")[0];
        }
        let existInfos = [];
        let groupContainers = $(parentContainer).children(".s3dProgressEditorGroupContainer");
        for (let i = 0; i < groupContainers.length; i++) {
            let groupContainer = groupContainers[i];
            let groupJson = cmnPcr.strToJson($(groupContainer).attr("groupJson"));
            existInfos.push({
                code: groupJson.code,
                name: groupJson.name
            });
        }
        let stepContainers = $(parentContainer).children(".s3dProgressEditorStepHeader");
        for (let i = 0; i < stepContainers.length; i++) {
            let stepContainer = stepContainers[i];
            let stepJson = cmnPcr.strToJson($(stepContainer).attr("stepJson"));
            existInfos.push({
                code: stepJson.code,
                name: stepJson.name
            });
        }
        let postfix = 1;
        let newInfo = {
            id: cmnPcr.createGuid(),
            code: newCodePrefix + postfix,
            name: newNamePrefix + postfix,
            caption: "",
            description: "",
            isGroup: isGroup,
            parentId: parentId
        };
        let hasSame = true;
        while (hasSame) {
            hasSame = false;
            for (let i = 0; i < existInfos.length; i++) {
                let existInfo = existInfos[i];
                if (existInfo.code === newInfo.code || existInfo.name === newInfo.name) {
                    hasSame = true;
                    postfix++;
                    newInfo.code = newCodePrefix + postfix;
                    newInfo.name = newNamePrefix + postfix;
                }
            }
        }
        return newInfo;
    };
    this.processAddNewGroup = function (parentId) {
        let group = thatProgressEditor.addGroup(parentId);
        thatProgressEditor.addGroupTrack(group);
        thatProgressEditor.refreshTrackHeaderValues();
        thatProgressEditor.bindGroupEvents(group.id);
        thatProgressEditor.bindTrackEvents(group.id);
        thatProgressEditor.addEditingToUndoList(s3dProgressEditType.addGroup);
        thatProgressEditor.showGroupPropertyWindow(group.id);
    };
    this.removeGroup = function (groupId) {
        let groupContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorGroupContainer[nodeId='" + groupId + "']");
        $(groupContainer).remove();
    };
    this.removeStep = function (stepId) {
        let stepContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorStepHeader[nodeId='" + stepId + "']");
        $(stepContainer).remove();
    };
    this.removeGroupTrackList = function (groupAllChildNodes) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        for (let i = 0; i < groupAllChildNodes.length; i++) {
            let nodeInfo = groupAllChildNodes[i];
            let trackItems = $(editContainer).find(".s3dProgressEditorTrackItem[nodeId='" + nodeInfo.id + "']");
            $(trackItems).remove();
        }
    };
    this.removeStepTrack = function (stepId) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let trackItems = $(editContainer).find(".s3dProgressEditorTrackItem[nodeId='" + stepId + "']");
        $(trackItems).remove();
    };
    this.addGroupTrack = function (group) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let trackContainer = $(editContainer).find(".s3dProgressEditorSubContainer[name='track']");
        if (group.parentId != null) {
            trackContainer = $(trackContainer).find(".s3dProgressEditorTrackContainer[nodeId='" + group.parentId + "']").children(".s3dProgressEditorTrackSubContainer");
        }
        let html = thatProgressEditor.getGroupTrackItemHtml(group.id, group.parentId, null);
        $(trackContainer).append(html);
    };
    this.addStepTrack = function (step) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let trackContainer = $(editContainer).find(".s3dProgressEditorSubContainer[name='track']");
        if (step.parentId != null) {
            trackContainer = $(trackContainer).find(".s3dProgressEditorTrackContainer[nodeId='" + step.parentId + "']").children(".s3dProgressEditorTrackSubContainer");
        }
        let html = thatProgressEditor.getTrackItemHtml(step.id, step.parentId);
        $(trackContainer).append(html);
    };
    this.addGroup = function (parentId) {
        let groupInfo = thatProgressEditor.getNewNodeInfo(parentId, true);
        groupInfo.children = {};
        let groupHtml = thatProgressEditor.getGroupHtml(groupInfo);
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let parentContainer = null;
        if (parentId == null) {
            parentContainer = $(editContainer).find(".s3dProgressEditorLeftInner")[0];
        } else {
            parentContainer = $(editContainer).find(".s3dProgressEditorLeftInner").find(".s3dProgressEditorGroupContainer[nodeId='" + parentId + "']").children(".s3dProgressEditorGroupInner")[0];
        }
        $(parentContainer).append(groupHtml);
        return groupInfo;
    };
    this.addStep = function (parentId, objectId) {
        let stepInfo = thatProgressEditor.getNewNodeInfo(parentId, false);
        stepInfo.objectId = objectId;
        stepInfo.durationFrame = 120;
        stepInfo.delayFrame = 0;
        stepInfo.fadeIn = false;
        stepInfo.fadeOut = false;
        stepInfo.propertyMap = {};
        stepInfo.previousNodeIds = [];
        let stepHeaderHtml = thatProgressEditor.getStepHeaderHtml(stepInfo);
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let parentContainer = null;
        if (parentId == null) {
            parentContainer = $(editContainer).find(".s3dProgressEditorLeftInner")[0];
        } else {
            parentContainer = $(editContainer).find(".s3dProgressEditorLeftInner").find(".s3dProgressEditorGroupContainer[nodeId='" + parentId + "']").children(".s3dProgressEditorGroupInner")[0];
        }
        $(parentContainer).append(stepHeaderHtml);
        return stepInfo;
    };
    this.bindGroupEvents = function (groupId) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let groupContainer = $(editContainer).find(".s3dProgressEditorGroupContainer[nodeId='" + groupId + "']");
        $(groupContainer).children(".s3dProgressEditorGroupHeader").find(".s3dProgressEditorGroupHeaderImage").click(function () {
            let groupContainer = $(this).parent().parent();
            $(groupContainer).children(".s3dProgressEditorGroupInner");
            let groupId = $(groupContainer).attr("nodeId");
            let trackContainer = $(editContainer).find(".s3dProgressEditorTrackContainer[nodeId='" + groupId + "']");
            $(trackContainer).children(".s3dProgressEditorTrackSubContainer");
            let expand = $(groupContainer).hasClass("s3dProgressEditorGroupContainerExpand");
            if (expand) {
                $(groupContainer).removeClass("s3dProgressEditorGroupContainerExpand");
                $(trackContainer).removeClass("s3dProgressEditorTrackContainerExpand");
            } else {
                $(groupContainer).addClass("s3dProgressEditorGroupContainerExpand");
                $(trackContainer).addClass("s3dProgressEditorTrackContainerExpand");
            }
        });
        $(groupContainer).children(".s3dProgressEditorGroupHeader").find(".s3dProgressEditorGroupHeaderDeleteBtn").click(function () {
            if (msgBox.confirm({
                info: "确定删除吗?"
            })) {
                let groupContainer = $(this).parent().parent();
                let groupId = $(groupContainer).attr("nodeId");
                let groupAllChildNodes = thatProgressEditor.getAllChildEditingNodesInGroup(groupId);
                thatProgressEditor.removeGroup(groupId);
                thatProgressEditor.removeGroupTrackList(groupAllChildNodes);
                thatProgressEditor.addEditingToUndoList(s3dProgressEditType.removeGroup);
            }
        });
        $(groupContainer).children(".s3dProgressEditorGroupHeader").find(".s3dProgressEditorGroupHeaderAddSubGroupBtn").click(function () {
            let groupContainer = $(this).parent().parent();
            let groupId = $(groupContainer).attr("nodeId");
            thatProgressEditor.processAddNewGroup(groupId);
        });
        $(groupContainer).children(".s3dProgressEditorGroupHeader").find(".s3dProgressEditorGroupHeaderAddSubStepBtn").click(function () {
            let groupContainer = $(this).parent().parent();
            let groupId = $(groupContainer).attr("nodeId");
            thatProgressEditor.processAddNewStep(groupId);
        });
        $(groupContainer).children(".s3dProgressEditorGroupHeader").find(".s3dProgressEditorGroupHeaderEditBtn").click(function () {
            let groupContainer = $(this).parent().parent();
            let groupId = $(groupContainer).attr("nodeId");
            thatProgressEditor.showGroupPropertyWindow(groupId);
        });
        $(groupContainer).children(".s3dProgressEditorGroupHeader").click(function () {
            let groupContainer = $(this).parent();
            let groupId = $(groupContainer).attr("nodeId");
            thatProgressEditor.focusTrack(true, groupId);
        });
    };
    this.showStepPropertyWindow = function (stepId) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let stepHeader = $(editContainer).find(".s3dProgressEditorStepHeader[nodeId='" + stepId + "']");
        let stepJson = cmnPcr.strToJson($(stepHeader).attr("stepJson"));
        let popContainer = new PopupContainer({
            width: 700,
            height: 680,
            top: 50,
            canClose: true,
            title: "编辑步骤属性",
            containerId: thatProgressEditor.containerId
        });
        popContainer.show();
        let innerHtml = thatProgressEditor.getStepPropertyEditHtml(stepId);
        $("#" + popContainer.contentId).html(innerHtml);
        thatProgressEditor.setStepPropertyEditValues(popContainer, stepJson);
        thatProgressEditor.bindStepPropertyEditEvents(popContainer);
    };
    this.showGroupPropertyWindow = function (groupId) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let groupContainer = $(editContainer).find(".s3dProgressEditorGroupContainer[nodeId='" + groupId + "']");
        let groupJson = cmnPcr.strToJson($(groupContainer).attr("groupJson"));
        let popContainer = new PopupContainer({
            width: 600,
            height: 480,
            top: 50,
            canClose: true,
            title: "编辑分组属性",
            containerId: thatProgressEditor.containerId
        });
        popContainer.show();
        let innerHtml = thatProgressEditor.getGroupPropertyEditHtml();
        $("#" + popContainer.contentId).html(innerHtml);
        thatProgressEditor.setGroupPropertyEditValues(popContainer, groupJson);
        thatProgressEditor.bindGroupPropertyEditEvents(popContainer);
    };
    this.setGroupPropertyEditValues = function (popContainer, groupJson) {
        let propertyEditContainer = $("#" + popContainer.contentId).find(".s3dProgressEditorPropertyEditContainer");
        $(propertyEditContainer).attr("nodeId", groupJson.id);
        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='code']").val(groupJson.code);
        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='name']").val(groupJson.name);
        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='caption']").val(groupJson.caption);
        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='description']").val(groupJson.description);
    };
    this.setStepPropertyEditValues = function (popContainer, stepJson) {
        let propertyEditContainer = $("#" + popContainer.contentId).find(".s3dProgressEditorPropertyEditContainer");
        $(propertyEditContainer).attr("nodeId", stepJson.id);
        $(propertyEditContainer).attr("objectId", stepJson.objectId);
        let object3D = thatProgressEditor.manager.viewer.getObject3DById(stepJson.objectId);
        let objectName = object3D.userData.info.name;
        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='code']").val(stepJson.code);
        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='name']").val(stepJson.name);
        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='caption']").val(stepJson.caption);
        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='description']").val(stepJson.description);
        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='objectName']").val(objectName);
        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='durationFrame']").val(stepJson.durationFrame);
        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='delayFrame']").val(stepJson.delayFrame);
        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='fadeIn']").prop("checked", stepJson.fadeIn);
        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='fadeOut']").prop("checked", stepJson.fadeOut);

        //初始化lineType下拉
        let lineTypeSelects = $(propertyEditContainer).find(".s3dPropertyEditorItemInputLineType");
        $(lineTypeSelects).append("<option value='linear'>线性</option>");
        $(lineTypeSelects).append("<option value='curve'>贝塞尔曲线</option>");
        $(lineTypeSelects).append("<option value='' selected>&nbsp;</option>");

        //位置
        let positionPropertyJson = stepJson.propertyMap["position"];
        if (positionPropertyJson != null) {
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionFromLineType']").val(positionPropertyJson.fromLineType);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionToLineType']").val(positionPropertyJson.toLineType);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionFromX']").val(positionPropertyJson.fromValues[0]);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionFromY']").val(positionPropertyJson.fromValues[1]);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionFromZ']").val(positionPropertyJson.fromValues[2]);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionToX']").val(positionPropertyJson.toValues[0]);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionToY']").val(positionPropertyJson.toValues[1]);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionToZ']").val(positionPropertyJson.toValues[2]);
        }

        //旋转
        let rotationPropertyJson = stepJson.propertyMap["rotation"];
        if (rotationPropertyJson != null) {
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationFromLineType']").val(rotationPropertyJson.fromLineType);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationToLineType']").val(rotationPropertyJson.toLineType);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationFromX']").val(rotationPropertyJson.fromValues[0]);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationFromY']").val(rotationPropertyJson.fromValues[1]);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationFromZ']").val(rotationPropertyJson.fromValues[2]);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationToX']").val(rotationPropertyJson.toValues[0]);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationToY']").val(rotationPropertyJson.toValues[1]);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationToZ']").val(rotationPropertyJson.toValues[2]);
        }

        //缩放
        let scalePropertyJson = stepJson.propertyMap["scale"];
        if (scalePropertyJson != null) {
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleFromLineType']").val(scalePropertyJson.fromLineType);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleToLineType']").val(scalePropertyJson.toLineType);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleFromX']").val(scalePropertyJson.fromValues[0]);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleFromY']").val(scalePropertyJson.fromValues[1]);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleFromZ']").val(scalePropertyJson.fromValues[2]);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleToX']").val(scalePropertyJson.toValues[0]);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleToY']").val(scalePropertyJson.toValues[1]);
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleToZ']").val(scalePropertyJson.toValues[2]);
        }

        //前置
        for (let i = 0; i < stepJson.previousNodeIds.length; i++) {
            let previousNodeId = stepJson.previousNodeIds[i];
            $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemCheckboxContainer[stepId='" + previousNodeId + "'] .s3dProgressEditorPropertyEditItemCheckbox").prop('checked', true);
        }
    };
    this.bindGroupPropertyEditEvents = function (popContainer) {
        let propertyEditContainer = $("#" + popContainer.contentId).find(".s3dProgressEditorPropertyEditContainer");
        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditBtn[name='ok']").click(function () {
            let propertyEditContainer = $("#" + popContainer.contentId).find(".s3dProgressEditorPropertyEditContainer");
            let nodeId = $(propertyEditContainer).attr("nodeId");
            let code = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='code']").val();
            let name = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='name']").val();
            let caption = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='caption']").val();
            let description = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='description']").val();
            let errors = [];
            if (code.length === 0) {
                errors.push("编码不能为空.");
            }
            if (name.length === 0) {
                errors.push("编码不能为空.");
            }
            if (errors.length > 0) {
                msgBox.alert({
                    info: cmnPcr.arrayToString(errors, "\r\n")
                });
            } else {
                let groupJson = {
                    id: nodeId,
                    code: code,
                    name: name,
                    caption: caption,
                    description: description
                };
                thatProgressEditor.refreshGroupValues(groupJson);
                popContainer.close();
            }
        });
    };
    this.bindStepPropertyEditEvents = function (popContainer) {
        let propertyEditContainer = $("#" + popContainer.contentId).find(".s3dProgressEditorPropertyEditContainer");
        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInputTransformBtn").click(function () {
            let propertyEditContainer = $("#" + popContainer.contentId).find(".s3dProgressEditorPropertyEditContainer");
            let objectId = $(propertyEditContainer).attr("objectId");
            let object3D = thatProgressEditor.manager.viewer.getObject3DById(objectId);
            if (object3D != null) {
                let btnName = $(this).attr("name");
                switch (btnName) {
                    case "positionFromBtn":
                    {
                        let showValue = thatProgressEditor.convertGroupValueToShowValue(object3D.position, "position", s3dProgressGroupType.property);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionFromX']").val(showValue.x);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionFromY']").val(showValue.y);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionFromZ']").val(showValue.z);
                        break;
                    }
                    case "positionToBtn":
                    {
                        let showValue = thatProgressEditor.convertGroupValueToShowValue(object3D.position, "position", s3dProgressGroupType.property);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionToX']").val(showValue.x);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionToY']").val(showValue.y);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionToZ']").val(showValue.z);
                        break;
                    }
                    case "rotationFromBtn":
                    {
                        let showValue = thatProgressEditor.convertGroupValueToShowValue(object3D.rotation, "rotation", s3dProgressGroupType.property);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationFromX']").val(showValue.x);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationFromY']").val(showValue.y);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationFromZ']").val(showValue.z);
                        break;
                    }
                    case "rotationToBtn":
                    {
                        let showValue = thatProgressEditor.convertGroupValueToShowValue(object3D.rotation, "rotation", s3dProgressGroupType.property);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationToX']").val(showValue.x);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationToY']").val(showValue.y);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationToZ']").val(showValue.z);
                        break;
                    }
                    case "scaleFromBtn":
                    {
                        let showValue = thatProgressEditor.convertGroupValueToShowValue(object3D.scale, "scale", s3dProgressGroupType.property);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleFromX']").val(showValue.x);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleFromY']").val(showValue.y);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleFromZ']").val(showValue.z);
                        break;
                    }
                    case "scaleToBtn":
                    {
                        let showValue = thatProgressEditor.convertGroupValueToShowValue(object3D.scale, "scale", s3dProgressGroupType.property);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleToX']").val(showValue.x);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleToY']").val(showValue.y);
                        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleToZ']").val(showValue.z);
                        break;
                    }
                }
            } else {
                msgBox.alert({
                    info: "当前操作对象不存在, ObjectId=" + objectId
                });
            }
        });
        $(propertyEditContainer).find(".s3dProgressEditorPropertyEditBtn[name='ok']").click(function () {
            let propertyEditContainer = $("#" + popContainer.contentId).find(".s3dProgressEditorPropertyEditContainer");
            let nodeId = $(propertyEditContainer).attr("nodeId");
            let objectId = $(propertyEditContainer).attr("objectId");
            let code = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='code']").val();
            let name = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='name']").val();
            let caption = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='caption']").val();
            let description = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='description']").val();
            let durationFrameStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='durationFrame']").val();
            let delayFrameStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='delayFrame']").val();
            let fadeIn = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='fadeIn']").prop("checked");
            let fadeOut = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='fadeOut']").prop("checked");

            let positionFromLineType = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionFromLineType']").val();
            let positionToLineType = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionToLineType']").val();
            let positionFromXStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionFromX']").val();
            let positionFromYStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionFromY']").val();
            let positionFromZStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionFromZ']").val();
            let positionToXStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionToX']").val();
            let positionToYStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionToY']").val();
            let positionToZStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='positionToZ']").val();

            let rotationFromLineType = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationFromLineType']").val();
            let rotationToLineType = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationToLineType']").val();
            let rotationFromXStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationFromX']").val();
            let rotationFromYStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationFromY']").val();
            let rotationFromZStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationFromZ']").val();
            let rotationToXStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationToX']").val();
            let rotationToYStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationToY']").val();
            let rotationToZStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='rotationToZ']").val();

            let scaleFromLineType = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleFromLineType']").val();
            let scaleToLineType = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleToLineType']").val();
            let scaleFromXStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleFromX']").val();
            let scaleFromYStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleFromY']").val();
            let scaleFromZStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleFromZ']").val();
            let scaleToXStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleToX']").val();
            let scaleToYStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleToY']").val();
            let scaleToZStr = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemInput[name='scaleToZ']").val();
            let previousNodeIds = [];
            let previousNodes = $(propertyEditContainer).find(".s3dProgressEditorPropertyEditItemCheckboxContainer");
            for (let i = 0; i < previousNodes.length; i++) {
                let previousNode = previousNodes[i];
                if ($(previousNode).find(".s3dProgressEditorPropertyEditItemCheckbox").prop("checked")) {
                    previousNodeIds.push($(previousNode).attr("stepId"));
                }
            }
            let errors = [];
            if (code.length === 0) {
                errors.push("编码不能为空.");
            }
            if (name.length === 0) {
                errors.push("编码不能为空.");
            }
            let positionActive = positionFromXStr.length !== 0 || positionFromYStr.length !== 0 || positionFromZStr.length !== 0 || positionToXStr.length !== 0 || positionToYStr.length !== 0 || positionToZStr.length !== 0;
            if (positionActive) {
                if (positionFromXStr.length === 0 || positionFromYStr.length === 0 || positionFromZStr.length === 0 || positionToXStr.length === 0 || positionToYStr.length === 0 || positionToZStr.length === 0) {
                    errors.push("位置信息不完整.");
                }
            }
            let rotationActive = rotationFromXStr.length !== 0 || rotationFromYStr.length !== 0 || rotationFromZStr.length !== 0 || rotationToXStr.length !== 0 || rotationToYStr.length !== 0 || rotationToZStr.length !== 0;
            if (rotationActive) {
                if (rotationFromXStr.length === 0 || rotationFromYStr.length === 0 || rotationFromZStr.length === 0 || rotationToXStr.length === 0 || rotationToYStr.length === 0 || rotationToZStr.length === 0) {
                    errors.push("旋转信息不完整.");
                }
            }
            let scaleActive = scaleFromXStr.length !== 0 || scaleFromYStr.length !== 0 || scaleFromZStr.length !== 0 || scaleToXStr.length !== 0 || scaleToYStr.length !== 0 || scaleToZStr.length !== 0;
            if (scaleActive) {
                if (scaleFromXStr.length === 0 || scaleFromYStr.length === 0 || scaleFromZStr.length === 0 || scaleToXStr.length === 0 || scaleToYStr.length === 0 || scaleToZStr.length === 0) {
                    errors.push("缩放信息不完整.");
                }
            }
            if (errors.length > 0) {
                msgBox.alert({
                    info: cmnPcr.arrayToString(errors, "\r\n")
                });
            } else {
                let stepJson = {
                    id: nodeId,
                    code: code,
                    name: name,
                    caption: caption,
                    description: description,
                    objectId: objectId,
                    durationFrame: cmnPcr.strToDecimal(durationFrameStr),
                    delayFrame: cmnPcr.strToDecimal(delayFrameStr),
                    fadeIn: fadeIn,
                    fadeOut: fadeOut,
                    propertyMap: {},
                    previousNodeIds: previousNodeIds
                };
                if (positionActive) {
                    stepJson.propertyMap.position = {
                        name: "position",
                        fromLineType: positionFromLineType,
                        toLineType: positionToLineType,
                        fromValues: [positionFromXStr.length === 0 ? null : cmnPcr.strToDecimal(positionFromXStr), positionFromYStr.length === 0 ? null : cmnPcr.strToDecimal(positionFromYStr), positionFromZStr.length === 0 ? null : cmnPcr.strToDecimal(positionFromZStr)],
                        toValues: [positionToXStr.length === 0 ? null : cmnPcr.strToDecimal(positionToXStr), positionToYStr.length === 0 ? null : cmnPcr.strToDecimal(positionToYStr), positionToZStr.length === 0 ? null : cmnPcr.strToDecimal(positionToZStr)]
                    };
                }
                if (rotationActive) {
                    stepJson.propertyMap.rotation = {
                        name: "rotation",
                        fromLineType: rotationFromLineType,
                        toLineType: rotationToLineType,
                        fromValues: [rotationFromXStr.length === 0 ? null : cmnPcr.strToDecimal(rotationFromXStr), rotationFromYStr.length === 0 ? null : cmnPcr.strToDecimal(rotationFromYStr), rotationFromZStr.length === 0 ? null : cmnPcr.strToDecimal(rotationFromZStr)],
                        toValues: [rotationToXStr.length === 0 ? null : cmnPcr.strToDecimal(rotationToXStr), rotationToYStr.length === 0 ? null : cmnPcr.strToDecimal(rotationToYStr), rotationToZStr.length === 0 ? null : cmnPcr.strToDecimal(rotationToZStr)]
                    };
                }
                if (scaleActive) {
                    stepJson.propertyMap.scale = {
                        name: "scale",
                        fromLineType: scaleFromLineType,
                        toLineType: scaleToLineType,
                        fromValues: [scaleFromXStr.length === 0 ? null : cmnPcr.strToDecimal(scaleFromXStr), scaleFromYStr.length === 0 ? null : cmnPcr.strToDecimal(scaleFromYStr), scaleFromZStr.length === 0 ? null : cmnPcr.strToDecimal(scaleFromZStr)],
                        toValues: [scaleToXStr.length === 0 ? null : cmnPcr.strToDecimal(scaleToXStr), scaleToYStr.length === 0 ? null : cmnPcr.strToDecimal(scaleToYStr), scaleToZStr.length === 0 ? null : cmnPcr.strToDecimal(scaleToZStr)]
                    };
                }
                popContainer.close();
                thatProgressEditor.refreshStepValues(stepJson);
                thatProgressEditor.updateStepStartFrames();
                thatProgressEditor.updateNetworkChart();
            }
        });
    };
    this.refreshGroupValues = function (groupJson) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let groupContainer = $(editContainer).find(".s3dProgressEditorGroupContainer[nodeId='" + groupJson.id + "']");
        let groupJsonStr = cmnPcr.jsonToStr(groupJson);
        $(groupContainer).attr("groupJson", groupJsonStr);
        let titleContainer = $(groupContainer).children(".s3dProgressEditorGroupHeader").children(".s3dProgressEditorGroupHeaderTitle");
        $(titleContainer).find(".s3dProgressEditorTitleCode").text(groupJson.code);
        $(titleContainer).find(".s3dProgressEditorTitleName").text(groupJson.name);
    };
    this.refreshStepValues = function (stepJson) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let stepContainer = $(editContainer).find(".s3dProgressEditorStepHeader[nodeId='" + stepJson.id + "']");
        let stepJsonStr = cmnPcr.jsonToStr(stepJson);
        $(stepContainer).attr("stepJson", stepJsonStr);
        let titleContainer = $(stepContainer).children(".s3dProgressEditorStepHeaderTitle");
        $(titleContainer).find(".s3dProgressEditorTitleCode").text(stepJson.code);
        $(titleContainer).find(".s3dProgressEditorTitleName").text(stepJson.name);
        let object3D = thatProgressEditor.manager.viewer.getObject3DById(stepJson.objectId);
        let objectName = object3D.userData.info.name;
        $(titleContainer).find(".s3dProgressEditorTitleSubName").text("(" + objectName + ")");
    };
    this.getGroupPropertyEditHtml = function () {
        return "<div class='s3dProgressEditorPropertyEditContainer'>" + "<div class='s3dProgressEditorPropertyEditInnerContainer'>"

            //编码
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>编码</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<input type='text' name='code' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dProgressEditorPropertyEditItemInputString' />" + "</div>" + "</div>"

            //名称
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>名称</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<input type='text' name='name' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dProgressEditorPropertyEditItemInputString' />" + "</div>" + "</div>"

            //标题
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>标题</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<input type='text' name='caption' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dProgressEditorPropertyEditItemInputString' />" + "</div>" + "</div>"

            //名称
            + "<div class='s3dProgressEditorPropertyEditItemContainer' style='height:300px'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>描述</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<textarea name='description' autocomplete='off' style='height:300px' class='s3dProgressEditorPropertyEditItemInput s3dProgressEditorPropertyEditItemInputMultiLineString' />" + "</div>" + "</div>" + "</div>" + "<div class='s3dProgressEditorPropertyEditBottomContainer'>" + "<div class='s3dProgressEditorPropertyEditBtn' name='ok'>确定</div>" + "</div>" + "</div>";
    };
    this.getStepPropertyEditHtml = function (stepId) {
        let html = "<div class='s3dProgressEditorPropertyEditContainer'>" + "<div class='s3dProgressEditorPropertyEditInnerContainer'>"

            //基本信息
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemGroup'>" + "<div class='s3dProgressEditorPropertyEditItemGroupTitle'>基本信息</div>" + "</div>" + "</div>"

            //编码
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>编码</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<input type='text' name='code' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dProgressEditorPropertyEditItemInputString' />" + "</div>" + "</div>"

            //名称
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>名称</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<input type='text' name='name' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dProgressEditorPropertyEditItemInputString' />" + "</div>" + "</div>"

            //标题
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>标题</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<input type='text' name='caption' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dProgressEditorPropertyEditItemInputString' />" + "</div>" + "</div>"

            //描述
            + "<div class='s3dProgressEditorPropertyEditItemContainer' style='height:100px'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>描述</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<textarea name='description' autocomplete='off' style='height:100px' class='s3dProgressEditorPropertyEditItemInput s3dProgressEditorPropertyEditItemInputMultiLineString' />" + "</div>" + "</div>"

            //执行操作
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemGroup'>" + "<div class='s3dProgressEditorPropertyEditItemGroupTitle'>执行操作</div>" + "</div>" + "</div>"

            //操作信息
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>对象</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<input type='text' name='objectName' autocomplete='off' readonly class='s3dProgressEditorPropertyEditItemInput s3dProgressEditorPropertyEditItemInputReadonly' />" + "</div>" + "</div>"

            //持续帧数
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>持续帧数</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<input type='number' name='durationFrame' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal' />" + "</div>" + "</div>"

            //延迟帧数
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>延迟帧数</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<input type='number' name='delayFrame' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal' />" + "</div>" + "</div>"

            //淡入
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>淡入</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<input type='checkbox' name='fadeIn' class='s3dProgressEditorPropertyEditItemInput s3dProgressEditorPropertyEditItemInputBoolean' />" + "</div>" + "</div>"

            //淡入
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>淡出</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<input type='checkbox' name='fadeOut' class='s3dProgressEditorPropertyEditItemInput s3dProgressEditorPropertyEditItemInputBoolean' />" + "</div>" + "</div>"

            //位置信息
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemGroup'>" + "<div class='s3dProgressEditorPropertyEditItemGroupTitle'>位置信息</div>" + "</div>" + "</div>"

            //位置起始速度变化
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>起始方式</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<select name='positionFromLineType' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputLineType' />" + "</div>" + "</div>"

            //位置结束速度变化
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>结束方式</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<select name='positionToLineType' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputLineType' />" + "</div>" + "</div>"

            //位置起始
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>起始位置</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<div class='s3dProgressEditorPropertyEditItemValueTransform'>" + "<input type='number' name='positionFromX' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<input type='number' name='positionFromY' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<input type='number' name='positionFromZ' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<div name='positionFromBtn' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputBtn s3dProgressEditorPropertyEditItemInputTransformBtn'>获取当前值</div>" + "</div>" + "</div>" + "</div>"

            //位置结束
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>结束位置</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<div class='s3dProgressEditorPropertyEditItemValueTransform'>" + "<input type='number' name='positionToX' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<input type='number' name='positionToY' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<input type='number' name='positionToZ' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<div name='positionToBtn' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputBtn s3dProgressEditorPropertyEditItemInputTransformBtn'>获取当前值</div>" + "</div>" + "</div>" + "</div>"

            //旋转信息
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemGroup'>" + "<div class='s3dProgressEditorPropertyEditItemGroupTitle'>旋转信息</div>" + "</div>" + "</div>"

            //旋转起始速度变化
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>起始方式</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<select name='rotationFromLineType' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputLineType' />" + "</div>" + "</div>"

            //旋转结束速度变化
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>结束方式</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<select name='rotationToLineType' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputLineType' />" + "</div>" + "</div>"

            //旋转起始
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>起始旋转</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<div class='s3dProgressEditorPropertyEditItemValueTransform'>" + "<input type='number' name='rotationFromX' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<input type='number' name='rotationFromY' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<input type='number' name='rotationFromZ' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<div name='rotationFromBtn' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputBtn s3dProgressEditorPropertyEditItemInputTransformBtn'>获取当前值</div>" + "</div>" + "</div>" + "</div>"

            //旋转结束
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>结束旋转</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<div class='s3dProgressEditorPropertyEditItemValueTransform'>" + "<input type='number' name='rotationToX' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<input type='number' name='rotationToY' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<input type='number' name='rotationToZ' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<div name='rotationToBtn' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputBtn s3dProgressEditorPropertyEditItemInputTransformBtn'>获取当前值</div>" + "</div>" + "</div>" + "</div>"

            //缩放信息
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemGroup'>" + "<div class='s3dProgressEditorPropertyEditItemGroupTitle'>缩放信息</div>" + "</div>" + "</div>"

            //缩放起始速度变化
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>起始方式</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<select name='scaleFromLineType' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputLineType' />" + "</div>" + "</div>"

            //缩放结束速度变化
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>结束方式</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<select name='scaleToLineType' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputLineType' />" + "</div>" + "</div>"

            //缩放起始
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>起始缩放</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<div class='s3dProgressEditorPropertyEditItemValueTransform'>" + "<input type='number' name='scaleFromX' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<input type='number' name='scaleFromY' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<input type='number' name='scaleFromZ' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<div name='scaleFromBtn' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputBtn s3dProgressEditorPropertyEditItemInputTransformBtn'>获取当前值</div>" + "</div>" + "</div>" + "</div>"

            //缩放结束
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemTitle'>结束缩放</div>" + "<div class='s3dProgressEditorPropertyEditItemValue'>" + "<div class='s3dProgressEditorPropertyEditItemValueTransform'>" + "<input type='number' name='scaleToX' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<input type='number' name='scaleToY' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<input type='number' name='scaleToZ' precision='4' autocomplete='off' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputDecimal s3dProgressEditorPropertyEditItemInputTransform' />" + "<div name='scaleToBtn' class='s3dProgressEditorPropertyEditItemInput s3dPropertyEditorItemInputBtn s3dProgressEditorPropertyEditItemInputTransformBtn'>获取当前值</div>" + "</div>" + "</div>" + "</div>"

            //前置步骤
            + "<div class='s3dProgressEditorPropertyEditItemContainer'>" + "<div class='s3dProgressEditorPropertyEditItemGroup'>" + "<div class='s3dProgressEditorPropertyEditItemGroupTitle'>前置步骤</div>" + "</div>" + "</div>"

            //前置步骤
            + "<div class='s3dProgressEditorPropertyEditItemContainer' style='height:auto;padding-left:50px;'>";

        //所有步骤
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let allStepHeaders = $(editContainer).find(".s3dProgressEditorStepHeader");
        for (let i = 0; i < allStepHeaders.length; i++) {
            let stepHeader = allStepHeaders[i];
            let stepJson = cmnPcr.strToJson($(stepHeader).attr("stepJson"));
            if (stepJson.id !== stepId) {
                let checkboxId = "progressEditorStepProperty_" + stepJson.id;
                html += "<div class='s3dProgressEditorPropertyEditItemCheckboxContainer' stepId='" + stepJson.id + "'>" + "<input id='" + checkboxId + "' type='checkbox' class='s3dProgressEditorPropertyEditItemCheckbox' />" + "<label for='" + checkboxId + "' class='s3dProgressEditorPropertyEditItemCheckboxTitle'>" + "<span class='s3dProgressEditorTitleCode'>" + cmnPcr.htmlEncode(stepJson.code) + "</span>" + "<span class='s3dProgressEditorTitleName'>" + cmnPcr.htmlEncode(stepJson.name) + "</span>" + "</label>" + "</div>";
            }
        }
        html += "</div>" + "</div>" + "<div class='s3dProgressEditorPropertyEditBottomContainer'>" + "<div class='s3dProgressEditorPropertyEditBtn' name='ok'>确定</div>" + "</div>" + "</div>";
        return html;
    };
    this.bindStepEvents = function (stepId) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let stepHeader = $(editContainer).find(".s3dProgressEditorStepHeader[nodeId='" + stepId + "']");
        $(stepHeader).find(".s3dProgressEditorStepHeaderRemoveBtn").click(function () {
            if (msgBox.confirm({
                info: "确定删除吗?"
            })) {
                let stepHeader = $(this).parent();
                let stepId = $(stepHeader).attr("nodeId");
                thatProgressEditor.removeStep(stepId);
                thatProgressEditor.removeStepTrack(stepId);
                thatProgressEditor.addEditingToUndoList(s3dProgressEditType.removeStep);
            }
        });
        $(stepHeader).find(".s3dProgressEditorStepHeaderEditBtn").click(function () {
            let nodeId = $(this).parent().attr("nodeId");
            thatProgressEditor.showStepPropertyWindow(nodeId);
        });
        $(stepHeader).click(function () {
            let nodeId = $(this).attr("nodeId");
            thatProgressEditor.focusTrack(false, nodeId);
        });
    };

    //深度优先搜索
    this.depthFirstSearch = function (stepInfos, recStack, visited, stepId) {
        if (recStack[stepId]) {
            return true;
        }
        if (visited[stepId]) {
            return false;
        }
        visited[stepId] = true;
        recStack[stepId] = true;
        let stepInfo = stepInfos.find(s => s.id === stepId);
        if (stepInfo) {
            for (let prevId of stepInfo.previousNodeIds) {
                if (thatProgressEditor.depthFirstSearch(stepInfos, recStack, visited, prevId)) {
                    return true;
                }
            }
        }
        recStack[stepId] = false;
        return false;
    };

    //检查是否存在循环依赖
    this.checkStepCycle = function (stepInfos) {
        let visited = {};
        let recStack = {};
        for (let stepInfo of stepInfos) {
            if (thatProgressEditor.depthFirstSearch(stepInfos, recStack, visited, stepInfo.id)) {
                //输出环上的step
                let cycleNames = [];
                for (let stepId in recStack) {
                    for (let i = 0; i < stepInfos.length; i++) {
                        let s = stepInfos[i];
                        if (s.id === stepId) {
                            cycleNames.push(s.code + " " + s.name);
                            break;
                        }
                    }
                }
                throw "存在环形步骤: \r\n" + cmnPcr.arrayToString(cycleNames, "\r\n");
            }
        }
    };
    this.updateNetworkChart = function () {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let stepHeaders = $(editContainer).find(".s3dProgressEditorStepHeader");
        for (let i = 0; i < stepHeaders.length; i++) {
            let stepHeader = stepHeaders[i];
            let stepId = $(stepHeader).attr("nodeId");
            let startFrameStr = $(stepHeader).attr("startFrame");
            let stepJson = cmnPcr.strToJson($(stepHeader).attr("stepJson"));
            if (startFrameStr != null) {
                let startFrame = cmnPcr.strToDecimal(startFrameStr);
                thatProgressEditor.drawNetworkStepBar(stepId, startFrame, stepJson.durationFrame);
            }
        }
    };
    this.drawNetworkStepBar = function (stepId, startFrame, durationFrame) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let left = thatProgressEditor.calcTimeSplitLinePosition(startFrame);
        let width = durationFrame * thatProgressEditor.spanWidth;
        let html = "<div class='s3dProgressEditorTrackItemBar' style='left:" + left + "px;width:" + width + "px;' startFrame='" + startFrame + "' durationFrame='" + durationFrame + "'>" + "<div class='s3dProgressEditorTrackItemBarValue s3dProgressEditorTrackItemBarValueStart'>" + startFrame + "</div>" + "<div class='s3dProgressEditorTrackItemBarValue s3dProgressEditorTrackItemBarValueEnd'>" + (startFrame + durationFrame) + "</div>" + "</div>";
        $(editContainer).find(".s3dProgressEditorTrackItem[nodeId='" + stepId + "']").html(html);
    };
    this.updateStepStartFrames = function () {
        let stepInfos = [];
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let stepHeaders = $(editContainer).find(".s3dProgressEditorStepHeader");
        for (let i = 0; i < stepHeaders.length; i++) {
            let stepHeader = stepHeaders[i];
            let stepJson = cmnPcr.strToJson($(stepHeader).attr("stepJson"));
            stepInfos.push(stepJson);
        }
        try {
            let stepId2StartFrameMap = thatProgressEditor.calculateStepStartFrames(stepInfos);
            for (let i = 0; i < stepHeaders.length; i++) {
                let stepHeader = stepHeaders[i];
                let stepId = $(stepHeader).attr("nodeId");
                let startFrame = stepId2StartFrameMap[stepId];
                $(stepHeader).attr("startFrame", startFrame);
            }
        } catch (e) {
            msgBox.alert({
                info: e
            });
        }
    };
    this.calculateStepStartFrames = function (stepInfos) {
        // 初始化每个步骤的开始时间为 null
        let stepId2StartFrameMap = {};
        for (let i = 0; i < stepInfos.length; i++) {
            let stepInfo = stepInfos[i];
            stepId2StartFrameMap[stepInfo.id] = null;
        }
        thatProgressEditor.checkStepCycle(stepInfos);

        // 拓扑排序计算开始时间
        let inDegree = {};
        let queue = [];

        // 计算每个步骤的入度
        stepInfos.forEach(step => {
            inDegree[step.id] = step.previousNodeIds.length;
            if (inDegree[step.id] === 0) {
                stepId2StartFrameMap[step.id] = step.delayFrame;
                queue.push(step.id);
            }
        });
        while (queue.length > 0) {
            let currentId = queue.shift();
            stepInfos.find(s => s.id === currentId);
            stepInfos.forEach(stepInfo => {
                if (stepInfo.previousNodeIds.includes(currentId)) {
                    inDegree[stepInfo.id]--;
                    if (inDegree[stepInfo.id] === 0) {
                        const maxPreviousEndTime = stepInfo.previousNodeIds.reduce((max, prevId) => {
                            const prevEndTime = stepId2StartFrameMap[prevId] + stepInfos.find(s => s.id === prevId).durationFrame;
                            return Math.max(max, prevEndTime);
                        }, 0);
                        //stepId2StartFrameMap[stepInfo.id] = Math.max(maxPreviousEndTime, stepInfo.delayFrame);
                        stepId2StartFrameMap[stepInfo.id] = maxPreviousEndTime + stepInfo.delayFrame;
                        queue.push(stepInfo.id);
                    }
                }
            });
        }
        return stepId2StartFrameMap;
    };
    this.getAllChildEditingNodesInGroup = function (parentId) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let groupContainer = $(editContainer).find(".s3dProgressEditorGroupContainer[nodeId='" + parentId + "']");
        let nodeItems = $(groupContainer).find(".s3dProgressEditorNode");
        let allNodeInfos = [];
        allNodeInfos.push({
            id: parentId,
            isGroup: true
        });
        for (let i = 0; i < nodeItems.length; i++) {
            let nodeItem = nodeItems[i];
            let nodeId = $(nodeItem).attr("nodeId");
            let isGroup = $(nodeItem).attr("isGroup") === "true";
            allNodeInfos.push({
                id: nodeId,
                isGroup: isGroup
            });
        }
        return allNodeInfos;
    };
    this.setTrackHeaderPosRotScaleInputValue = function (objectId, groupName, valueObj) {
        thatProgressEditor.setTrackHeaderInputValue(objectId, groupName, valueObj, s3dProgressGroupType.property);
    };
    this.focusTrack = function (isGroup, nodeId) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        $(editContainer).find(".s3dProgressEditorGroupHeader").removeClass("s3dProgressEditorItemActive");
        $(editContainer).find(".s3dProgressEditorStepHeader").removeClass("s3dProgressEditorItemActive");
        $(editContainer).find(".s3dProgressEditorTrackItem").removeClass("s3dProgressEditorItemActive");
        if (isGroup) {
            //group的header
            $(editContainer).find(".s3dProgressEditorGroupHeader[nodeId='" + nodeId + "']").addClass("s3dProgressEditorItemActive");
            $(editContainer).find(".s3dProgressEditorTrackItem[nodeId='" + nodeId + "']").addClass("s3dProgressEditorItemActive");
        } else {
            //明细
            $(editContainer).find(".s3dProgressEditorStepHeader[nodeId='" + nodeId + "']").addClass("s3dProgressEditorItemActive");
            $(editContainer).find(".s3dProgressEditorTrackItem[nodeId='" + nodeId + "']").addClass("s3dProgressEditorItemActive");
        }
    };
    this.bindTrackEvents = function (nodeId) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        $(editContainer).find(".s3dProgressEditorTrackItem[nodeId='" + nodeId + "']").click(function () {
            let isGroup = $(this).attr("isGroup") === "true";
            let nodeId = $(this).attr("nodeId");
            thatProgressEditor.focusTrack(isGroup, nodeId);
        });
    };
    this.checkHasObject3DAndProperty = function (objectId, propertyName) {
        let allGroupContainers = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorGroupContainer");
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
        html += "<div class='s3dProgressEditorPropertyList'>";
        for (let i = 0; i < thatProgressEditor.propertyList.length; i++) {
            let property = thatProgressEditor.propertyList[i];
            html += "<div class='s3dProgressEditorPropertyItem' name='" + property.name + "'>" + cmnPcr.htmlEncode(property.text) + "</div>";
        }
        html += "</div>";
        return html;
    };
    this.getObject3DMaterialPropertyMap = function (objectId) {
        let materialPropertyMap = {};
        let properties = ["opacity", "color"];
        let materialMap = thatProgressEditor.manager.viewer.getObject3DMaterialMap(objectId);
        for (let materialName in materialMap) {
            let materialObjItem = materialMap[materialName];
            for (let i = 0; i < properties.length; i++) {
                let property = properties[i];
                let propertyPath = materialObjItem.path + "." + property;
                let propertyText = materialObjItem.text + "." + thatProgressEditor.getMaterialPropertyText(property);
                materialPropertyMap[propertyPath] = {
                    path: propertyPath,
                    text: propertyText,
                    material: materialObjItem.material
                };
            }
        }
        return materialPropertyMap;
    };
    this.getMaterialListHtml = function (objectId) {
        let html = "";
        html += "<div class='s3dProgressEditorPropertyList'>";
        let materialPropertyMap = thatProgressEditor.getObject3DMaterialPropertyMap(objectId);
        for (let materialPropertyName in materialPropertyMap) {
            let materialPropertyObjItem = materialPropertyMap[materialPropertyName];
            html += "<div class='s3dProgressEditorPropertyItem' name='" + materialPropertyObjItem.path + "'>" + cmnPcr.htmlEncode(materialPropertyObjItem.text) + "</div>";
        }
        html += "</div>";
        return html;
    };
    this.clearProgress = function () {
        thatProgressEditor.showName("");
        thatProgressEditor.clearGroups();
        thatProgressEditor.clearTrackList();
        thatProgressEditor.clearTimeline();
    };
    this.showProgress = function (progressCode) {
        //保存之前編輯的流程
        if(thatProgressEditor.editingProgressCode != null){
            thatProgressEditor.applyProgress();
        }

        //打开需要编辑的流程
        let progressInfo = thatProgressEditor.manager.userProgresses.getProgressInfo(progressCode);
        thatProgressEditor.editingProgressCode = progressCode;
        if (progressInfo == null) {
            thatProgressEditor.clearProgress();
        } else {
            thatProgressEditor.relatedAnimationCode = progressInfo.relatedAnimationCode;
            let editingInfo = thatProgressEditor.convertToEditingInfo(progressInfo);
            if (editingInfo.errors.length !== 0) {
                msgBox.alert({
                    info: cmnPcr.arrayToString(editingInfo.errors, "\r\n")
                });
            }
            thatProgressEditor.initTimeline();
            thatProgressEditor.showName(editingInfo.name);
            thatProgressEditor.showAllNodes(editingInfo);
            thatProgressEditor.showAllTrackList(editingInfo);
            thatProgressEditor.showAllStates(editingInfo);
            thatProgressEditor.showNetworkChart();
        }
        thatProgressEditor.lastOperateInfo = {
            editingInfo: thatProgressEditor.getEditingInfoFromUI(),
            uiInfo: thatProgressEditor.getUiInfo()
        };
    };
    this.refreshEditing = function (editingInfo, uiInfo) {
        thatProgressEditor.closeMenu();

        //取消正在编辑的内容
        thatProgressEditor.showName("");
        thatProgressEditor.clearGroups();
        thatProgressEditor.clearTrackList();
        thatProgressEditor.clearCurve();
        thatProgressEditor.clearTimeline();

        //讲新的editing内容
        thatProgressEditor.initTimeline();
        thatProgressEditor.showName(editingInfo.name);
        thatProgressEditor.showAllNodes(editingInfo);
        thatProgressEditor.showAllTrackList(editingInfo);
        thatProgressEditor.showNetworkChart();

        //更新UI布局
        thatProgressEditor.refreshUILayout(uiInfo);
    };
    this.refreshUILayout = function (uiInfo) {
        thatProgressEditor.setZoomLevel(uiInfo.timeLineZoomLevel);
        thatProgressEditor.syncScrollCenterHeaderAndInner(uiInfo.centerScrollLeft);
        thatProgressEditor.syncScrollLeftInnerAndTrackContainer(uiInfo.leftScrollTop);
    };
    this.showName = function (name) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        $(editContainer).find(".s3dProgressEditorInputProgressName").val(name);
        $(editContainer).find(".s3dProgressEditorInputProgressName").attr("lastValue", name);
    };
    this.clearGroups = function () {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let leftInnerContainer = $(editContainer).find(".s3dProgressEditorLeftInner");
        $(leftInnerContainer).empty();
    };
    this.clearTrackList = function () {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let trackContainer = $(editContainer).find(".s3dProgressEditorSubContainer[name='track']");
        $(trackContainer).empty();
    };
    this.clearCurve = function () {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let curveContainer = $(editContainer).find(".s3dProgressEditorSubContainer[name='curve']");
        $(curveContainer).empty();
    };
    this.showAllNodes = function (editingInfo) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let leftInnerContainer = $(editContainer).find(".s3dProgressEditorLeftInner");
        let html = "";
        for (let i = 0; i < editingInfo.children.length; i++) {
            let nodeId = editingInfo.children[i];
            let node = editingInfo.nodeMap[nodeId];
            if (node.isGroup) {
                html += thatProgressEditor.getGroupHtml(node, editingInfo.nodeMap);
            } else {
                html += thatProgressEditor.getStepHeaderHtml(node);
            }
        }
        $(leftInnerContainer).html(html);
        thatProgressEditor.bindAllGroupAndStepEvents(editingInfo);
    };
    this.showAllStates = function (editingInfo) {
        let hiddenObjectIdMap = {};
        for (let i = 0; i < editingInfo.states.length; i++) {
            let stateInfo = editingInfo.states[i];
            hiddenObjectIdMap[stateInfo.objectId] = true;
        }
        let displayObjectIds = [];
        let hiddenObjectIds = [];
        for (let objectId in thatProgressEditor.manager.viewer.allObject3DMap) {
            if (hiddenObjectIdMap[objectId]) {
                hiddenObjectIds.push(objectId);
            } else {
                displayObjectIds.push(objectId);
            }
        }
        thatProgressEditor.manager.viewer.setObject3DsVisible(displayObjectIds, true);
        thatProgressEditor.manager.viewer.setObject3DsVisible(hiddenObjectIds, false);
        thatProgressEditor.manager.treeEditor.refreshAllNodeCheckStatus();
    };
    this.bindAllGroupAndStepEvents = function (editingInfo) {
        for (let nodeId in editingInfo.nodeMap) {
            let node = editingInfo.nodeMap[nodeId];
            if (node.isGroup) {
                thatProgressEditor.bindGroupEvents(node.id);
            } else {
                thatProgressEditor.bindStepEvents(node.id);
            }
        }
    };
    this.bindAllTrackEvents = function (editingInfo) {
        for (let nodeId in editingInfo.nodeMap) {
            let node = editingInfo.nodeMap[nodeId];
            thatProgressEditor.bindTrackEvents(node.id);
        }
    };
    this.showAllTrackList = function (editingInfo) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let trackContainer = $(editContainer).find(".s3dProgressEditorSubContainer[name='track']");
        let html = "";
        for (let i = 0; i < editingInfo.children.length; i++) {
            let nodeId = editingInfo.children[i];
            let nodeInfo = editingInfo.nodeMap[nodeId];
            if (nodeInfo.isGroup) {
                html += thatProgressEditor.getGroupTrackItemHtml(nodeInfo.id, nodeInfo.parentId, editingInfo.nodeMap);
            } else {
                html += thatProgressEditor.getTrackItemHtml(nodeInfo.id, null);
            }
        }
        $(trackContainer).html(html);
        thatProgressEditor.bindAllTrackEvents(editingInfo);
    };
    this.getEditValueFromOriginal = function (objectId, groupName, groupType) {
        switch (groupType) {
            case s3dProgressGroupType.property:
            {
                return thatProgressEditor.getEditValueFromOriginalProperty(objectId, groupName);
            }
            case s3dProgressGroupType.material:
            {
                return thatProgressEditor.getEditValueFromOriginalMaterial(objectId, groupName);
            }
            default:
            {
                throw "不支持的分组类型. GroupType=" + groupType;
            }
        }
    };
    this.getMaterialPropertyItemByPath = function (objectId, path) {
        let materialPropertyMap = thatProgressEditor.getObject3DMaterialPropertyMap(objectId);
        for (let materialPropertyName in materialPropertyMap) {
            let materialPropertyObjItem = materialPropertyMap[materialPropertyName];
            if (materialPropertyObjItem.path === path) {
                return materialPropertyObjItem;
            }
        }
    };
    this.getEditValueFromOriginalMaterial = function (objectId, path) {
        let showValue = null;
        let materialPropertyItem = thatProgressEditor.getMaterialPropertyItemByPath(objectId, path);
        if (materialPropertyItem != null) {
            let materialPropertyName = thatProgressEditor.manager.userProgresses.getMaterialPropertyPostfix(path);
            switch (materialPropertyName) {
                case "opacity":
                {
                    showValue = {
                        value: materialPropertyItem.material.opacity
                    };
                    break;
                }
                case "color":
                {
                    showValue = {
                        r: materialPropertyItem.material.color.r,
                        g: materialPropertyItem.material.color.g,
                        b: materialPropertyItem.material.color.b
                    };
                    break;
                }
            }
        }
        return showValue;
    };
    this.getEditValueFromOriginalProperty = function (objectId, propertyName) {
        let showValue = null;
        let object3D = thatProgressEditor.manager.viewer.getObject3DById(objectId);
        if (object3D != null) {
            switch (propertyName) {
                case "position":
                {
                    showValue = thatProgressEditor.convertGroupValueToShowValue(object3D.position, propertyName, s3dProgressGroupType.property);
                    break;
                }
                case "rotation":
                {
                    showValue = thatProgressEditor.convertGroupValueToShowValue(object3D.rotation, propertyName, s3dProgressGroupType.property);
                    break;
                }
                case "scale":
                {
                    showValue = thatProgressEditor.convertGroupValueToShowValue(object3D.scale, propertyName, s3dProgressGroupType.property);
                    break;
                }
            }
        }
        return showValue;
    };
    this.convertToEditingPropertyValue = function (value, propertyName) {
        let editValue = null;
        switch (propertyName) {
            case "position":
            {
                editValue = cmnPcr.toFixed(common3DFunction.s2v(value, thatProgressEditor.manager.viewer.distanceRatio), thatProgressEditor.manager.propertyEditor.positionPrecision);
                break;
            }
            case "rotation":
            {
                editValue = cmnPcr.toFixed(common3DFunction.radian2degree(value), thatProgressEditor.manager.propertyEditor.rotationPrecision);
                break;
            }
            case "scale":
            {
                editValue = cmnPcr.toFixed(value, thatProgressEditor.manager.propertyEditor.scalePrecision);
                break;
            }
        }
        return editValue;
    };
    this.convertToProgressValue = function (value, propertyName) {
        let editValue = null;
        switch (propertyName) {
            case "position":
            {
                editValue = common3DFunction.v2s(value, thatProgressEditor.manager.viewer.distanceRatio);
                break;
            }
            case "rotation":
            {
                editValue = common3DFunction.degree2radian(value);
                break;
            }
            case "scale":
            {
                editValue = value;
                break;
            }
            default:
            {
                editValue = value;
            }
        }
        return editValue;
    };
    this.convertGroupValueToShowValue = function (propertyValue, groupName, groupType) {
        switch (groupType) {
            case s3dProgressGroupType.property:
            {
                return thatProgressEditor.convertPropertyValueToShowValue(propertyValue, groupName);
            }
            case s3dProgressGroupType.material:
            {
                return thatProgressEditor.convertMaterialValueToShowValue(value, groupName);
            }
            default:
            {
                throw "去支持的分组类型. GroupType=" + groupType;
            }
        }
    };
    this.convertMaterialValueToShowValue = function (propertyValue, propertyPath) {
        let materialPropertyName = thatProgressEditor.manager.userProgresses.getMaterialPropertyPostfix(propertyPath);
        let showValue = {};
        switch (materialPropertyName) {
            case "opacity":
            {
                showValue.value = propertyValue.value;
                break;
            }
            case "color":
            {
                showValue.r = propertyValue.r;
                showValue.g = propertyValue.g;
                showValue.b = propertyValue.b;
                break;
            }
        }
        return showValue;
    };
    this.convertPropertyValueToShowValue = function (propertyValue, propertyName) {
        let showValue = {};
        switch (propertyName) {
            case "position":
            {
                showValue.x = cmnPcr.toFixed(common3DFunction.s2v(propertyValue.x, thatProgressEditor.manager.viewer.distanceRatio), thatProgressEditor.manager.propertyEditor.positionPrecision);
                showValue.y = cmnPcr.toFixed(common3DFunction.s2v(propertyValue.y, thatProgressEditor.manager.viewer.distanceRatio), thatProgressEditor.manager.propertyEditor.positionPrecision);
                showValue.z = cmnPcr.toFixed(common3DFunction.s2v(propertyValue.z, thatProgressEditor.manager.viewer.distanceRatio), thatProgressEditor.manager.propertyEditor.positionPrecision);
                break;
            }
            case "rotation":
            {
                showValue.x = cmnPcr.toFixed(common3DFunction.radian2degree(propertyValue.x), thatProgressEditor.manager.propertyEditor.rotationPrecision);
                showValue.y = cmnPcr.toFixed(common3DFunction.radian2degree(propertyValue.y), thatProgressEditor.manager.propertyEditor.rotationPrecision);
                showValue.z = cmnPcr.toFixed(common3DFunction.radian2degree(propertyValue.z), thatProgressEditor.manager.propertyEditor.rotationPrecision);
                break;
            }
            case "scale":
            {
                showValue.x = cmnPcr.toFixed(propertyValue.x, thatProgressEditor.manager.propertyEditor.scalePrecision);
                showValue.y = cmnPcr.toFixed(propertyValue.y, thatProgressEditor.manager.propertyEditor.scalePrecision);
                showValue.z = cmnPcr.toFixed(propertyValue.z, thatProgressEditor.manager.propertyEditor.scalePrecision);
                break;
            }
        }
        return showValue;
    };
    this.getStepTitleHtml = function (stepCode, stepName, objectId) {
        let object3D = thatProgressEditor.manager.viewer.getObject3DById(objectId);
        let objectName = object3D.userData.info.name;
        return "<span class='s3dProgressEditorTitleCode'>" + cmnPcr.htmlEncode(stepCode) + "</span><span class='s3dProgressEditorTitleName'>" + stepName + "</span><span class='s3dProgressEditorTitleSubName'>(" + objectName + ")</span>";
    };
    this.getTrackMapByObjectGroup = function (groupName, groupType) {
        switch (groupType) {
            case s3dProgressGroupType.property:
            {
                return thatProgressEditor.getTrackMapByObjectProperty(groupName);
            }
            case s3dProgressGroupType.material:
            {
                return thatProgressEditor.getTrackMapByObjectMaterial(groupName);
            }
            default:
            {
                throw "不支持的分组类型. GroupType=" + groupType;
            }
        }
    };
    this.getTrackMapByObjectMaterial = function (propertyPath) {
        let materialPropertyName = thatProgressEditor.manager.userProgresses.getMaterialPropertyPostfix(propertyPath);
        let trackMap = {};
        switch (materialPropertyName) {
            case "opacity":
            {
                trackMap["value"] = "value";
                break;
            }
            case "color":
            {
                trackMap["r"] = "r";
                trackMap["g"] = "g";
                trackMap["b"] = "b";
                break;
            }
        }
        return trackMap;
    };
    this.getTrackMapByObjectProperty = function (propertyName) {
        let trackMap = {};
        switch (propertyName) {
            case "position":
            {
                trackMap["x"] = "x";
                trackMap["y"] = "y";
                trackMap["z"] = "z";
                break;
            }
            case "rotation":
            {
                trackMap["x"] = "x";
                trackMap["y"] = "y";
                trackMap["z"] = "z";
                break;
            }
            case "scale":
            {
                trackMap["x"] = "x";
                trackMap["y"] = "y";
                trackMap["z"] = "z";
                break;
            }
        }
        return trackMap;
    };
    this.getGroupHtml = function (groupInfo, nodeMap) {
        let groupTitleHtml = thatProgressEditor.getGroupTitleHtml(groupInfo.code, groupInfo.name);
        let html = "";
        let groupJson = {
            id: groupInfo.id,
            code: groupInfo.code,
            name: groupInfo.name,
            caption: groupInfo.caption,
            description: groupInfo.description
        };
        let groupJsonStr = cmnPcr.jsonToStr(groupJson);
        html += "<div class='s3dProgressEditorNode s3dProgressEditorGroupContainer s3dProgressEditorGroupContainerExpand'";
        html += "nodeId='" + groupInfo.id + "'";
        html += "groupJson='" + groupJsonStr + "'";
        html += ">";
        html += "<div class='s3dProgressEditorGroupHeader' nodeId='" + groupInfo.id + "'>";
        html += "<div class='s3dProgressEditorGroupHeaderImage'>&#9654;</div>";
        html += "<div class='s3dProgressEditorGroupHeaderTitle'>" + groupTitleHtml + "</div>";
        html += "<div class='s3dProgressEditorGroupHeaderBtn s3dProgressEditorGroupHeaderAddSubGroupBtn' title='添加子分组'>&#10012;</div>";
        html += "<div class='s3dProgressEditorGroupHeaderBtn s3dProgressEditorGroupHeaderAddSubStepBtn' title='添加子步骤'>&#x21b3;</div>";
        html += "<div class='s3dProgressEditorGroupHeaderBtn s3dProgressEditorGroupHeaderEditBtn' title='编辑分组属性'>&#x25a4;</div>";
        html += "<div class='s3dProgressEditorGroupHeaderBtn s3dProgressEditorGroupHeaderDeleteBtn' title='删除分组'>&#10006;</div>";
        html += "</div>";
        html += "<div class='s3dProgressEditorGroupInner'>";
        for (let i = 0; i < groupInfo.children.length; i++) {
            let nodeId = groupInfo.children[i];
            let nodeInfo = nodeMap[nodeId];
            if (nodeInfo.isGroup) {
                html += thatProgressEditor.getGroupHtml(nodeInfo, nodeMap);
            } else {
                html += thatProgressEditor.getStepHeaderHtml(nodeInfo);
            }
        }
        html += "</div>";
        html += "</div>";
        return html;
    };
    this.restoreAllOriginalValues = function () {
        let allGroupContainers = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer .s3dProgressEditorGroupContainer");
        for (let i = 0; i < allGroupContainers.length; i++) {
            let groupContainer = allGroupContainers[i];
            let objectId = $(groupContainer).attr("objectId");
            let groupName = $(groupContainer).attr("groupName");
            let groupType = $(groupContainer).attr("groupType");
            thatProgressEditor.restoreOriginalValue(objectId, groupName, groupType);
        }
    };
    this.restoreOriginalValue = function (objectId, propertyName, groupType) {
        switch (groupType) {
            case s3dProgressGroupType.material:
            {
                thatProgressEditor.restoreOriginalMaterialValue(objectId, propertyName);
                break;
            }
            case s3dProgressGroupType.property:
            {
                thatProgressEditor.restoreOriginalPropertyValue(objectId, propertyName);
                break;
            }
            default:
            {
                throw "不支持的分组类型. GroupType=" + groupType;
            }
        }
    };
    this.restoreOriginalMaterialValue = function (objectId, path) {
        let groupContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer .s3dProgressEditorGroupContainer[objectId='" + objectId + "'][groupName='" + path + "']");
        let trackHeaders = groupContainer.find(".s3dProgressEditorStepHeader");
        let materialPropertyItem = thatProgressEditor.getMaterialPropertyItemByPath(objectId, path);
        if (materialPropertyItem != null) {
            let originalValue = {};
            for (let i = 0; i < trackHeaders.length; i++) {
                let trackHeader = trackHeaders[i];
                let trackName = $(trackHeader).attr("trackName");
                originalValue[trackName] = parseFloat($(trackHeader).attr("originalValue"));
            }
            let materialPropertyName = thatProgressEditor.manager.userProgresses.getMaterialPropertyPostfix(path);
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
        let groupContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer .s3dProgressEditorGroupContainer[objectId='" + objectId + "'][groupName='" + propertyName + "']");
        let trackHeaders = groupContainer.find(".s3dProgressEditorStepHeader");
        let originalValue = {};
        for (let i = 0; i < trackHeaders.length; i++) {
            let trackHeader = trackHeaders[i];
            let trackName = $(trackHeader).attr("trackName");
            originalValue[trackName] = parseFloat($(trackHeader).attr("originalValue"));
        }
        let object3D = thatProgressEditor.manager.viewer.getObject3DById(objectId);
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
                objectPropertyInfo.position.x = common3DFunction.v2s(originalValue.x, thatProgressEditor.manager.viewer.distanceRatio);
                objectPropertyInfo.position.y = common3DFunction.v2s(originalValue.y, thatProgressEditor.manager.viewer.distanceRatio);
                objectPropertyInfo.position.z = common3DFunction.v2s(originalValue.z, thatProgressEditor.manager.viewer.distanceRatio);
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
        thatProgressEditor.manager.viewer.setObjectPositionRotationScaleById(objectId, object3D.userData.info.userWorldPosition, objectPropertyInfo.position, objectPropertyInfo.rotation, objectPropertyInfo.scale);
    };
    this.getGroupTitleHtml = function (groupCode, groupName) {
        return "<span class='s3dProgressEditorTitleCode'>" + cmnPcr.htmlEncode(groupCode) + "</span><span class='s3dProgressEditorTitleName'>" + groupName + "</span>";
    };
    this.getMaterialText = function (objectId, path) {
        let materialPropertyItem = thatProgressEditor.getMaterialPropertyItemByPath(objectId, path);
        return "材质." + (materialPropertyItem == null ? "" : materialPropertyItem.text);
    };
    this.getMaterialPropertyText = function (propertyName) {
        let text = "";
        switch (propertyName) {
            case "opacity":
            {
                text = "透明度";
                break;
            }
            case "color":
            {
                text = "颜色";
                break;
            }
        }
        return text;
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
            case s3dProgressGroupType.property:
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
            case s3dProgressGroupType.material:
            {
                let propertyName = thatProgressEditor.manager.userProgresses.getMaterialPropertyPostfix(groupName);
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
            case s3dProgressGroupType.property:
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
            case s3dProgressGroupType.material:
            {
                let propertyName = thatProgressEditor.manager.userProgresses.getMaterialPropertyPostfix(groupName);
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
    this.getStepHeaderHtml = function (stepInfo) {
        let stepTitleHtml = thatProgressEditor.getStepTitleHtml(stepInfo.code, stepInfo.name, stepInfo.objectId);
        let stepJson = cmnPcr.jsonToStr(stepInfo);
        let html = "";
        html += "<div class='s3dProgressEditorNode s3dProgressEditorStepHeader' nodeId = '" + stepInfo.id + "' stepJson='" + stepJson + "'>";
        html += "<div class='s3dProgressEditorStepHeaderTitle'>" + stepTitleHtml + "</div>";
        html += "<div class='s3dProgressEditorStepHeaderBtn s3dProgressEditorStepHeaderEditBtn' title='编辑步骤属性'>&#x25a4;</div>";
        html += "<div class='s3dProgressEditorStepHeaderBtn s3dProgressEditorStepHeaderRemoveBtn' title='删除步骤'>&#10006;</div>";
        html += "</div>";
        return html;
    };
    this.getGroupTrackItemHtml = function (nodeId, parentId, nodeMap) {
        let html = "";
        html += "<div class='s3dProgressEditorTrackContainer s3dProgressEditorTrackContainerExpand' nodeId='" + nodeId + "' parentId='" + parentId + "'>";
        html += "<div class='s3dProgressEditorTrackItem' isGroup = 'true' nodeId='" + nodeId + "' parentId='" + parentId + "'></div>";
        html += "<div class='s3dProgressEditorTrackSubContainer'>";
        if (nodeMap != null) {
            let groupInfo = nodeMap[nodeId];
            for (let i = 0; i < groupInfo.children.length; i++) {
                let childNodeId = groupInfo.children[i];
                let childNodeInfo = nodeMap[childNodeId];
                if (childNodeInfo.isGroup) {
                    html += thatProgressEditor.getGroupTrackItemHtml(childNodeInfo.id, childNodeInfo.parentId, nodeMap);
                } else {
                    html += thatProgressEditor.getTrackItemHtml(childNodeInfo.id, childNodeInfo.parentId);
                }
            }
        }
        html += "</div></div>";
        return html;
    };
    this.getTrackItemHtml = function (nodeId, parentId) {
        let html = "";
        html += "<div class='s3dProgressEditorTrackItem' isGroup = 'false' nodeId='" + nodeId + "' parentId='" + parentId + "'>";
        html += "</div>";
        return html;
    };
    this.applyProgress = function () {
        if(thatProgressEditor.editingProgressCode != null) {
            let editingInfo = thatProgressEditor.getEditingInfoFromUI();
            let newProgressInfo = thatProgressEditor.convertToProgressInfo(editingInfo);
            if (newProgressInfo.name.length === 0) {
                msgBox.alert({
                    info: "请录入流程名称"
                });
            } else if (thatProgressEditor.manager.userProgresses.checkSameNameProgress(newProgressInfo.code, newProgressInfo.name)) {
                msgBox.alert({
                    info: "存在重名的流程"
                });
            } else {
                let oldProgressInfo = thatProgressEditor.manager.userProgresses.getProgressInfo(newProgressInfo.code);
                thatProgressEditor.manager.progressList.beginAddToUndoList(s3dProgressEditType.edit, oldProgressInfo.code, oldProgressInfo);
                thatProgressEditor.manager.userProgresses.updateProgress(newProgressInfo);
                thatProgressEditor.manager.progressList.refreshProgress(newProgressInfo.code);
                thatProgressEditor.manager.progressList.endAddToUndoList(s3dProgressEditType.edit, newProgressInfo.code, newProgressInfo);
                return newProgressInfo;
            }
        }
    };
    this.closeProgress = function (hasConfirm) {
        if (!hasConfirm || msgBox.confirm({
            info: "取消编辑吗?"
        })) {
            thatProgressEditor.manager.layout.hideBlock("progressEditor");
            thatProgressEditor.clearProgress();
        }
    };
    this.saveProgress = function () {
        let newProgressInfo = thatProgressEditor.applyProgress();
        if (newProgressInfo) {
            thatProgressEditor.manager.layout.hideBlock("progressEditor");
            thatProgressEditor.clearProgress();
        }
    };
    this.clearTimeline = function () {
        let editorTimeline = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorTimeline");
        $(editorTimeline).empty();
    };
    this.initTimeline = function () {
        let html = "";
        for (let i = 0; i <= thatProgressEditor.manager.userProgresses.enableMaxFrameCount; i++) {
            html += thatProgressEditor.getTimeSpanHtml(i);
        }
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let editorTimeline = $(editContainer).find(".s3dProgressEditorTimeline");
        $(editorTimeline).html(html);
        thatProgressEditor.refreshSpanWidth();
        thatProgressEditor.refreshCenterSubContainerWidth();
    };
    this.updateTrackKeyFrameValue = function (trackCode, frameIndex, value) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let trackItem = $(editContainer).find(".s3dProgressEditorTrackItem[trackCode='" + trackCode + "'] .s3dProgressEditorKeyFrameBtn[frameIndex='" + frameIndex + "']");
        $(trackItem).attr("value", value);
    };
    this.removeTrackKeyFrameBtn = function (btnCode) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let keyFrameBtn = $(editContainer).find(".s3dProgressEditorKeyFrameBtn[btnCode='" + btnCode + "']");
        $(keyFrameBtn).remove();
    };
    this.addTrackKeyFrameBtn = function (p) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let trackItem = $(editContainer).find(".s3dProgressEditorTrackItem[trackCode='" + p.trackCode + "']");
        let keyFrameBtn = $(trackItem).find(".s3dProgressEditorKeyFrameBtn[frameIndex='" + p.frameIndex + "']");
        if (keyFrameBtn.length === 0) {
            let x = thatProgressEditor.calcTrackKeyFramePosition(p.frameIndex);
            let style = "left:" + x + "px;";
            style += "z-index:" + p.frameIndex + ";";
            if (p.value == null) {
                p.value = thatProgressEditor.calcKeyFrameValue(p.trackCode, p.frameIndex);
            }
            let btnCode = cmnPcr.createGuid();
            let btnHtml = "<div class='s3dProgressEditorKeyFrameBtn'" + " btnCode='" + btnCode + "'" + " leftLineType='" + p.leftLineType + "'" + " rightLineType='" + p.rightLineType + "'" + " style='" + style + "'" + " frameIndex='" + p.frameIndex + "' " + " value='" + (p.value == null ? "" : p.value) + "'>&#9830;</div>";
            $(trackItem).append(btnHtml);
            thatProgressEditor.bindTrackKeyFrameEvents(p.trackCode, btnCode, p.frameIndex);
        }
    };
    this.bindTrackKeyFrameEvents = function (trackCode, btnCode, frameIndex) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let trackItem = $(editContainer).find(".s3dProgressEditorTrackItem[trackCode='" + trackCode + "']");
        let trackKeyFrameBtn = $(trackItem).find(".s3dProgressEditorKeyFrameBtn[btnCode='" + btnCode + "']");
        $(trackKeyFrameBtn).click(function () {
            thatProgressEditor.focusTrackKeyFrameBtn(btnCode);
        });
        $(trackKeyFrameBtn).mousedown(function () {
            if ($(this).hasClass("s3dProgressEditorKeyFrameBtnActive")) {
                let frameIndex = parseInt($(this).attr("frameIndex"));
                let trackItem = $(this).parent();
                let groupCode = $(trackItem).attr("groupCode");
                let trackCode = $(trackItem).attr("trackCode");
                let btnCode = $(this).attr("btnCode");
                thatProgressEditor.keyFrameDragInfo = {
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
            thatProgressEditor.showKeyFrameMenu({
                btnCode,
                leftLineType: leftLineType,
                rightLineType: rightLineType
            }, ev);
        });
    };
    this.refreshTrackKeyFrame = function () {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let trackKeyFrameBtns = $(editContainer).find(".s3dProgressEditorKeyFrameBtn");
        for (let i = 0; i < trackKeyFrameBtns.length; i++) {
            let trackKeyFrameBtn = trackKeyFrameBtns[i];
            let frameIndex = parseInt($(trackKeyFrameBtn).attr("frameIndex"));
            let x = thatProgressEditor.calcTrackKeyFramePosition(frameIndex);
            $(trackKeyFrameBtn).css({
                left: x + "px"
            });
        }
    };
    this.updateTrackKeyFrameByBtnCode = function (btnCode, newFrameIndex, value) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let trackKeyFrameBtn = $(editContainer).find(".s3dProgressEditorKeyFrameBtn[btnCode='" + btnCode + "']");
        let x = thatProgressEditor.calcTrackKeyFramePosition(newFrameIndex);
        $(trackKeyFrameBtn).css({
            left: x + "px"
        });
        $(trackKeyFrameBtn).attr("frameIndex", newFrameIndex);
        $(trackKeyFrameBtn).attr("value", value);
    };
    this.showNetworkChart = function () {
        thatProgressEditor.updateStepStartFrames();
        thatProgressEditor.updateNetworkChart();
    };
    this.refreshViewerObject = function (objectId, groupName, groupType, groupFrameValue) {
        switch (groupType) {
            case s3dProgressGroupType.material:
            {
                return thatProgressEditor.refreshViewerObjectMaterial(objectId, groupName, groupFrameValue);
            }
            case s3dProgressGroupType.property:
            {
                return thatProgressEditor.refreshViewerObjectProperty(objectId, groupName, groupFrameValue);
            }
            default:
            {
                throw "不支持的分组类型. GroupType=" + groupType;
            }
        }
    };
    this.refreshViewerObjectMaterial = function (objectId, path, groupFrameValue) {
        let materialPropertyItem = thatProgressEditor.getMaterialPropertyItemByPath(objectId, path);
        if (materialPropertyItem != null) {
            let materialPropertyName = thatProgressEditor.manager.userProgresses.getMaterialPropertyPostfix(path);
            switch (materialPropertyName) {
                case "opacity":
                {
                    materialPropertyItem.material.opacity = groupFrameValue.value;
                    break;
                }
                case "color":
                {
                    materialPropertyItem.material.color.r = groupFrameValue.r;
                    materialPropertyItem.material.color.g = groupFrameValue.g;
                    materialPropertyItem.material.color.b = groupFrameValue.b;
                    break;
                }
            }
        }
    };
    this.refreshViewerObjectProperty = function (objectId, propertyName, groupFrameValue) {
        let object3D = thatProgressEditor.manager.viewer.getObject3DById(objectId);
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
                objectPropertyInfo.position.x = common3DFunction.v2s(groupFrameValue.x, thatProgressEditor.manager.viewer.distanceRatio);
                objectPropertyInfo.position.y = common3DFunction.v2s(groupFrameValue.y, thatProgressEditor.manager.viewer.distanceRatio);
                objectPropertyInfo.position.z = common3DFunction.v2s(groupFrameValue.z, thatProgressEditor.manager.viewer.distanceRatio);
                break;
            }
            case "rotation":
            {
                objectPropertyInfo.rotation.x = common3DFunction.degree2radian(groupFrameValue.x);
                objectPropertyInfo.rotation.y = common3DFunction.degree2radian(groupFrameValue.y);
                objectPropertyInfo.rotation.z = common3DFunction.degree2radian(groupFrameValue.z);
                break;
            }
            case "scale":
            {
                objectPropertyInfo.scale.x = groupFrameValue.x;
                objectPropertyInfo.scale.y = groupFrameValue.y;
                objectPropertyInfo.scale.z = groupFrameValue.z;
                break;
            }
        }
        thatProgressEditor.manager.viewer.setObjectPositionRotationScaleById(objectId, object3D.userData.info.userWorldPosition, objectPropertyInfo.position, objectPropertyInfo.rotation, objectPropertyInfo.scale);
    };
    this.refreshTrackHeaderValues = function () {};
    this.updateTrackHeaderValues = function (frameIndex) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let allTrackHeaders = $(editContainer).find(".s3dProgressEditorStepHeader");
        for (let i = 0; i < allTrackHeaders.length; i++) {
            let trackHeader = allTrackHeaders[i];
            let trackCode = $(trackHeader).attr("trackCode");
            thatProgressEditor.updateTrackHeaderValue(trackCode, frameIndex);
        }
    };
    this.refreshCenterSubContainerWidth = function (ev) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let centerInner = $(editContainer).find(".s3dProgressEditorCenterInner");
        let trackListContainer = $(editContainer).find(".s3dProgressEditorSubContainer[name='track']");
        let curveContainer = $(editContainer).find(".s3dProgressEditorSubContainer[name='curve']");
        let editorTimeline = $(editContainer).find(".s3dProgressEditorTimeline");
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
        thatProgressEditor.syncScrollCenterHeaderAndInner(offsetLeft);
    };
    this.syncScrollCenterHeaderAndInner = function (scrollLeft) {
        let editContainer = $("#" + thatProgressEditor.containerId).find(".s3dProgressEditorContainer");
        let center = $(editContainer).find(".s3dProgressEditorCenterInner")[0];
        let centerHeader = $(editContainer).find(".s3dProgressEditorCenterHeader")[0];
        center.scrollLeft = scrollLeft;
        centerHeader.scrollLeft = scrollLeft;
    };
    this.getTimeSpanHtml = function (frameIndex) {
        let secondIndex = Math.floor(frameIndex / thatProgressEditor.manager.userProgresses.defaultFPS);
        let partIndex = frameIndex % thatProgressEditor.manager.userProgresses.defaultFPS;
        let html = "";
        let isIntDiv5 = frameIndex % 5 === 0;
        let isIntDiv15 = frameIndex % 15 === 0;
        let isIntDiv30 = frameIndex % 30 === 0;
        let isIntDiv60 = frameIndex % 60 === 0;
        html += "<div class='s3dProgressEditorTimeSpan' frameIndex='" + frameIndex + "'>";
        html += "<div class='s3dProgressEditorTimeSpanInner";
        if (isIntDiv60) {
            html += " s3dProgressEditorIntDiv60";
        } else if (isIntDiv30) {
            html += " s3dProgressEditorIntDiv30";
        } else if (isIntDiv15) {
            html += " s3dProgressEditorIntDiv15";
        } else if (isIntDiv5) {
            html += " s3dProgressEditorIntDiv5";
        } else {
            html += " s3dProgressEditorIntDiv1";
        }
        html += "'>";
        html += "<div class='s3dProgressEditorTimeSpanLine'></div>";
        html += "<div class='s3dProgressEditorTimeSpanText'>" + secondIndex + ":" + partIndex.toString().padStart(2, "0") + "</div>";
        html += "</div>";
        html += "</div>";
        return html;
    };
    this.closeMenu = function () {
        let container = $("#" + thatProgressEditor.containerId);
        $(container).find(".s3dProgressEditorMenuOuterContainer").remove();
    };
    this.addEditingToUndoList = function (editType, targetCode) {
        let beginDoOtherInfo = {
            editType: editType,
            targetCode: targetCode,
            editingInfo: thatProgressEditor.lastOperateInfo.editingInfo,
            uiInfo: thatProgressEditor.lastOperateInfo.uiInfo
        };
        thatProgressEditor.manager.statusBar.beginAddToUndoList({
            operateType: s3dOperateType.progress,
            otherInfo: beginDoOtherInfo
        });
        let editingInfo = thatProgressEditor.getEditingInfoFromUI();
        let uiInfo = thatProgressEditor.getUiInfo();
        let endDoOtherInfo = {
            editType: editType,
            targetCode: targetCode,
            editingInfo: editingInfo,
            uiInfo: uiInfo
        };
        let mergeCode = null;
        thatProgressEditor.manager.statusBar.endAddToUndoList({
            operateType: s3dOperateType.progress,
            otherInfo: endDoOtherInfo
        }, mergeCode);
        thatProgressEditor.lastOperateInfo = {
            editingInfo: editingInfo,
            uiInfo: uiInfo
        };
    };
    this.calcTrackKeyFramePosition = function (frameIndex) {
        let x = thatProgressEditor.calcTimeSplitLinePosition(frameIndex);
        return x - 5;
    };
    this.calcTimeSplitLinePosition = function (frameIndex) {
        let left = frameIndex * thatProgressEditor.spanWidth + thatProgressEditor.spanWidth / 2;
        return left;
    };
    this.generateAnimation = function () {
        let editingInfo = thatProgressEditor.getEditingInfoFromUI();
        let newProgressInfo = thatProgressEditor.convertToProgressInfo(editingInfo);
        let newAnimationInfo = null;
        if (thatProgressEditor.relatedAnimationCode != null) {
            newAnimationInfo = thatProgressEditor.manager.userAnimations.getAnimationInfo(thatProgressEditor.relatedAnimationCode);
        }
        if (newAnimationInfo == null) {
            newAnimationInfo = thatProgressEditor.manager.userAnimations.getNewAnimationInfo(newProgressInfo.name);
            thatProgressEditor.relatedAnimationCode = newAnimationInfo.code;
        }
        let errors = [];
        thatProgressEditor.manager.userProgresses.copyProgressToAnimation(newProgressInfo, newAnimationInfo, errors);
        if (errors.length > 0) {
            msgBox.alert({
                info: "转换失败:\r\n" + cmnPcr.arrayToString(errors, "\r\n")
            });
        } else {
            thatProgressEditor.manager.userAnimations.updateAnimation(newAnimationInfo);
            thatProgressEditor.manager.animationList.refreshAnimation(newAnimationInfo.code);
            thatProgressEditor.manager.animationList.showAnimationInfo(newAnimationInfo.code);
            thatProgressEditor.applyProgress();
        }
    };
};

export default S3dProgressEditor
