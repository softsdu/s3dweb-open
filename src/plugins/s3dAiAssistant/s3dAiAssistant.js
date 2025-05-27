import {
    cmnPcr,
    msgBox,
    s3dAnimationEditType,
    s3dElement3DType,
    s3dOperateType,
    s3dUiStatus, serverAccess
} from "../../commonjs/common/common.js"
import "./S3dAiAssistant.css"

//S3dWeb AI助手
let S3dAiAssistant = function (){
    //当前对象
    const thatAiAssistant= this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;


    this.containerId = null;

    this.repCode = null;

    this.repId = null;

    this.serverUrl = null;

    this.currentConversationId = null;

    this.currentMessageId = null;

    //事件
    this.eventFunctions = {};

    this.addEventFunction = function(eventName, func){
        let allFuncs = thatAiAssistant.eventFunctions[eventName];
        if(allFuncs == null){
            allFuncs = [];
            thatAiAssistant.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    }

    this.doEventFunction = function(eventName, p){
        let allFuncs = thatAiAssistant.eventFunctions[eventName];
        if(allFuncs != null){
            for(let i = 0; i < allFuncs.length; i++){
                let func = allFuncs[i];
                func(p);
            }
        }
    }

    //初始化
    this.init = function(p){
        thatAiAssistant.containerId = p.containerId;
        thatAiAssistant.manager = p.manager;
        thatAiAssistant.repCode = p.config.repCode;
        thatAiAssistant.serverUrl = p.config.serverUrl;
        thatAiAssistant.initHtml();
        thatAiAssistant.getRepInfo(thatAiAssistant.repCode);
        thatAiAssistant.initBtnEvent();
    }

    this.initHtml = function () {
        let html = "<div class='s3dAiAssistantContainer'>"
            + "            <div class='s3dAiAssistantMessageOuterContainer'>"
            + "                <div class='s3dAiAssistantMessageContainer'></div>"
            + "                <div class='s3dAiAssistantInputContainer'>"
            + "                    <div class='s3dAiAssistantInputMsgContainer'><input type='text' class='s3dAiAssistantInputMsg' placeholder=\"请输入问题\"/></div>"
            + "                    <div class='s3dAiAssistantSendBtnContainer'>"
            + "                        <div class='s3dAiAssistantSendBtn'>发&nbsp;送</div>"
            + "                    </div>"
            + "                    <div class='s3dAiAssistantCancelBtnContainer'>"
            + "                        <div class='s3dAiAssistantCancelBtn'>停 止</div>"
            + "                    </div>"
            + "                </div>"
            + "                <div class='s3dAiAssistantAlertContainer'>"
            + "                    <div class='s3dAiAssistantAlertText'>内容由AI生成，无法确保真实准确，仅供参考</div>"
            + "                </div>"
            + "            </div>"
            + "        </div>";

        let container = $("#" + thatAiAssistant.containerId);
        let blockContainer = $(container).find(".s3dLayoutBlock[name='aiAssistant']");
        $(blockContainer).html(html);
    }

    this.initBtnEvent = function () {
        let container = $("#" + thatAiAssistant.containerId);
        $(container).find(".s3dAiAssistantSendBtn").click(function () {
            let container = $("#" + thatAiAssistant.containerId);
            let inputElement = $(container).find(".s3dAiAssistantInputMsg");
            let message = $(inputElement).val();
            thatAiAssistant.sendMessage(thatAiAssistant.repId, thatAiAssistant.currentConversationId, message);
            $(inputElement).val("");
            $(inputElement).focus();
        });


        $(container).find(".s3dAiAssistantInputMsg").keydown(function (event) {
            let container = $("#" + thatAiAssistant.containerId);
            switch (event.keyCode){
                case 13:{
                    if(!event.shiftKey) {
                        let inputElement = $(container).find(".s3dAiAssistantInputMsg");
                        let message = $(inputElement).val();
                        thatAiAssistant.sendMessage(thatAiAssistant.repId, thatAiAssistant.currentConversationId, message);
                        $(inputElement).val("");
                        $(inputElement).focus();
                    }
                    break;
                }
            }
        });
    }

    this.getRepInfo = function (repCode){
        let requestParam = {
            serverUrl: thatAiAssistant.serverUrl,
            serviceName: "ragChatNcpService",
            waitingBarParentId: "chatContainerId",
            funcName: "getRepInfoByCode",
            successFunc: function (obj) {
                let repInfo = obj.result.repInfo;
                thatAiAssistant.repId = repInfo.id;
                thatAiAssistant.clearChatContainer();
            },
            failFunc: function (obj) {
                msgBox.alert({
                    title: "提示",
                    info: obj.detailMessage
                });
            },
            args: {
                requestParam: cmnPcr.jsonToStr({
                    repCode: repCode
                })
            }
        };
        serverAccess.request(requestParam);
    }

    this.sendMessage = function (repId, conversationId, message){
        message = message.trim();
        if(message.length === 0){
            msgBox.alert({info: "请输入您的问题."});
        }
        else {
            const clientMsgId = thatAiAssistant.addUserMessage(message, new Date());
            thatAiAssistant.addAIMessage(clientMsgId);
            thatAiAssistant.changeChatAcceptingStatus(true);
            try {
                let xhr = new XMLHttpRequest();
                let url = thatAiAssistant.serverUrl + "rag/sendChatMessageAnonymous"
                xhr.open("POST", url, true);
                thatAiAssistant.currentMessageId = clientMsgId;

                xhr.onprogress = function () {
                    let responseText = xhr.responseText;
                    thatAiAssistant.processBackMessage(clientMsgId, responseText);
                }
                xhr.onloadend = function () {
                    let responseText = xhr.responseText;
                    thatAiAssistant.processBackMessage(clientMsgId, responseText);
                    if (xhr.status === 200) { // 请求成功
                        thatAiAssistant.handlePartialData(clientMsgId, "Completed!");
                    }
                    else {
                        thatAiAssistant.handlePartialData(clientMsgId, "Error: " + xhr.status);
                    }
                }

                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
                let formData = new FormData();
                formData.append("repId", repId);
                formData.append("conversationId", conversationId == null ? "" : conversationId);
                formData.append("message", message);
                let encodedData = new URLSearchParams(formData).toString();
                xhr.send(encodedData);
            }
            catch(e){
                thatAiAssistant.processAIBackMessage(clientMsgId, {
                    event: "error",
                    message: e.message,
                    createTime: cmnPcr.datetimeToStr(new Date(), "yyyy-MM-dd HH:mm:ss")
                });
                thatAiAssistant.changeChatAcceptingStatus(false);
            }
        }
    }

    this.processBackMessage = function (clientMsgId, backMessage){
        let dataBeginMark = "##data_begin##";
        let dataEndMark = "##data_end##";
        let tempParts = backMessage.split(dataBeginMark);

        let container = $("#" + thatAiAssistant.containerId);
        let aiMessageText = $(container).find(".s3dAiAssistantMessageContainer").find(".s3dAiAssistantAiMessageItemContainer[clientMsgId='" + clientMsgId + "'] .s3dAiAssistantAiMessageText");
        $(aiMessageText).empty();

        for(let i = 0; i < tempParts.length; i++){
            let tempPart = tempParts[i];
            if(tempPart.endWith(dataEndMark)){
                thatAiAssistant.handlePartialData(clientMsgId, tempPart.substring(0, tempPart.length - dataEndMark.length));
            }
        }
    }

    this.changeChatAcceptingStatus = function (accepting){
        let container = $("#" + thatAiAssistant.containerId);
        if(accepting){
            $(container).find(".s3dAiAssistantCancelBtnContainer").css("display", "block");
            $(container).find(".s3dAiAssistantSendBtnContainer").css("display", "none");
        }
        else{
            $(container).find(".s3dAiAssistantCancelBtnContainer").css("display", "none");
            $(container).find(".s3dAiAssistantSendBtnContainer").css("display", "block");
        }
    }

    this.handlePartialData = function (clientMsgId, backText) {
        if(backText.startWith("Completed")){
            //结束消息
            thatAiAssistant.changeChatAcceptingStatus(false);
        }
        else if(backText.startWith("Error")){
            //存在错误
            thatAiAssistant.changeChatAcceptingStatus(false);
        }
        else{
            let backJson = cmnPcr.strToJson(backText);
            thatAiAssistant.processAIBackMessage(clientMsgId, backJson);
        }
    }

    this.addAIMessage = function (clientMsgId){
        let container = $("#" + thatAiAssistant.containerId);
        let html = "<div class='s3dAiAssistantAiMessageItemContainer' clientMsgId='" + clientMsgId + "'>"
            + "<div class='s3dAiAssistantAiLogo'></div>"
            + "<div class='s3dAiAssistantAiMessageText'></div>"
            + "<div class='s3dAiAssistantAiMessageTime'></div>"
            + "</div>";
        let chatMessageContainer = $(container).find(".s3dAiAssistantMessageContainer");
        $(chatMessageContainer).append(html);
        thatAiAssistant.scrollToChatBottom();
    }

    this.addAIHistoryMessage = function (messageId, status, message, error, createTimeStr){
        let container = $("#" + thatAiAssistant.containerId);
        let createTime = cmnPcr.strToTime(createTimeStr);
        let text = "";
        switch(status){
            case "error":{
                text = "Error: " + error;
                break;
            }
            default:{
                text = message;
                break;
            }
        }
        let html = "<div class='s3dAiAssistantAiMessageItemContainer' messageId='" + messageId + "'>"
            + "<div class='s3dAiAssistantAiLogo'></div>"
            + "<div class='s3dAiAssistantAiMessageText'>" + cmnPcr.htmlEncode(text) + "</div>"
            + "<div class='s3dAiAssistantAiMessageTime'>" + cmnPcr.datetimeToStr(createTime, "M-d H:m") + "</div>"
            + "</div>";
        let chatMessageContainer = $(container).find(".s3dAiAssistantMessageContainer");
        $(chatMessageContainer).prepend(html);
    }

    this.addUserHistoryMessage = function (messageId, message, createTimeStr){
        let container = $("#" + thatAiAssistant.containerId);
        let createTime = cmnPcr.strToTime(createTimeStr);
        let html = "<div class='s3dAiAssistantUserMessageItemContainer' messageId='" + messageId + "'>"
            + "<div class='s3dAiAssistantUserLogo'></div>"
            + "<div class='s3dAiAssistantUserMessageText'>" + cmnPcr.htmlEncode(message) + "</div>"
            + "<div class='s3dAiAssistantUserMessageTime'>" + cmnPcr.datetimeToStr(createTime, "M-d H:m") + "</div>"
            + "</div>";
        let chatMessageContainer = $(container).find(".s3dAiAssistantMessageContainer");
        $(chatMessageContainer).prepend(html);
    }

    this.getHistoryMessageInfo = function (repId, conversationId, firstMessageId){
        //加载历史消息
        let requestParam = {
            serverUrl: thatAiAssistant.serverUrl,
            serviceName: "ragChatNcpService",
            waitingBarParentId: "chatContainerId",
            funcName: "getHistoryMessageInfo",
            successFunc: function (obj) {
                let messageInfo = obj.result.messageInfo;
                let messages = messageInfo.messages;
                for(let i = messages.length - 1; i >= 0; i--){
                    let message = messages[i];
                    thatAiAssistant.addAIHistoryMessage(message.id, message.status, message.answer, message.error, message.createTime);
                    thatAiAssistant.addUserHistoryMessage(message.id, message.query, message.createTime);
                }
                if(firstMessageId.length === 0){
                    thatAiAssistant.scrollToChatBottom();
                }
                thatAiAssistant.addHasMoreHistoryMessage(messageInfo.hasMore);
            },
            failFunc: function (obj) {
                msgBox.alert({
                    title: "提示",
                    info: obj.detailMessage
                });
            },
            args: {
                requestParam: cmnPcr.jsonToStr({
                    repId: repId,
                    conversationId: conversationId,
                    firstMessageId: firstMessageId
                })
            }
        };
        serverAccess.request(requestParam);
    }

    this.addHasMoreHistoryMessage = function (hasMore){
        let container = $("#" + thatAiAssistant.containerId);
        let moreHistoryMessageHtml = "<div class='s3dAiAssistantMoreHistoryMessageContainer'><hr class='lineHr' />";
        if(hasMore) {
            moreHistoryMessageHtml += "<span class='s3dAiAssistantMoreHistoryMessageBtn'>显示更多</span>";
        }
        else{
            moreHistoryMessageHtml += "<span class='s3dAiAssistantMoMoreHistoryMessageBtn'>没有更多了</span>";
        }
        moreHistoryMessageHtml += "</div>";
        let chatMessageContainer = $(container).find(".s3dAiAssistantMessageContainer");
        $(chatMessageContainer).find(".s3dAiAssistantMoreHistoryMessageContainer").remove();
        $(chatMessageContainer).prepend(moreHistoryMessageHtml);

        $(chatMessageContainer).find(".s3dAiAssistantMoreHistoryMessageBtn").click(function (){
            let container = $("#" + thatAiAssistant.containerId);
            let aiMessageItems = $(container).find(".s3dAiAssistantMessageContainer").find(".s3dAiAssistantAiMessageItemContainer:first");
            if(aiMessageItems.length > 0){
                let aiMessageItem = aiMessageItems[0];
                let messageId = $(aiMessageItem).attr("messageId");
                thatAiAssistant.getHistoryMessageInfo(thatAiAssistant.repId, thatAiAssistant.currentConversationId, messageId)
            }
        });
    }

    this.processAIBackMessage = function (clientMsgId, messageJson){
        let container = $("#" + thatAiAssistant.containerId);
        thatAiAssistant.currentConversationId = messageJson.conversationId;
        let chatMessageContainer = $(container).find(".s3dAiAssistantMessageContainer");
        let aiMessageItem = $(chatMessageContainer).find(".s3dAiAssistantAiMessageItemContainer[clientMsgId='" + clientMsgId + "']");
        $(aiMessageItem).attr("messageId", messageJson.messageId);

        let aiMessageTime = $(aiMessageItem).find(".chatAiMessageTime");
        $(aiMessageTime).html(cmnPcr.datetimeToStr(cmnPcr.strToTime(messageJson.createTime), "M-d H:m"));

        let aiMessageText = $(aiMessageItem).find(".s3dAiAssistantAiMessageText");
        switch(messageJson.event){
            case "error":{
                $(aiMessageText).append(cmnPcr.htmlEncode(messageJson.message));
                break;
            }
            case "message":{
                $(aiMessageText).append(cmnPcr.htmlEncode(messageJson.answer));
                break;
            }
            case "agent_message":
            case "agent_thought":{
                $(aiMessageText).append(cmnPcr.htmlEncode("暂不支持的消息类型." + messageJson.event));
                break;
            }
            case "message_end":{
                $(aiMessageText).append(cmnPcr.htmlEncode(messageJson.answer));
                break;
            }
            case "message_file":{
                //不做处理
                break;
            }
            case "tts_message":{
                //不做处理
                break;
            }
            case "tts_message_end":{
                //不做处理
                break;
            }
            case "message_replace":{
                $(aiMessageText).html(cmnPcr.htmlEncode("命中了审查条件：" + messageJson.answer));
                break;
            }
            case "conversation_name":{
                break;
            }
            case "ping":{
                //不做处理
                break;
            }
        }
    }

    this.addUserMessage = function (message, time){
        let container = $("#" + thatAiAssistant.containerId);
        let clientMsgId = cmnPcr.createGuid();
        let html = "<div class='s3dAiAssistantUserMessageItemContainer' clientMsgId='" + clientMsgId + "'>"
            + "<div class='s3dAiAssistantUserLogo'></div>"
            + "<div class='s3dAiAssistantUserMessageText'>" + cmnPcr.htmlEncode(message) + "</div>"
            + "<div class='s3dAiAssistantUserMessageTime'>" + cmnPcr.datetimeToStr(time, "M-d H:m") + "</div>"
            + "</div>";
        let chatMessageContainer = $(container).find(".s3dAiAssistantMessageContainer");
        $(chatMessageContainer).append(html);
        thatAiAssistant.scrollToChatBottom();
        return clientMsgId;
    }

    this.scrollToChatBottom = function () {
        let container = $("#" + thatAiAssistant.containerId);
        let chatMessageContainer = $(container).find(".s3dAiAssistantMessageContainer")[0];
        $(chatMessageContainer).scrollTop(chatMessageContainer.scrollHeight);
    }
    this.sendMessage1 = function (repId, conversationId, message){
        message = message.trim();
        if(message.length === 0){
            msgBox.alert({info: "请输入您的问题."});
        }
        else {
            let requestParam = {
                serverUrl: thatAiAssistant.serverUrl,
                serviceName: "ragChatNcpService",
                waitingBarParentId: "chatContainerId",
                funcName: "sendMessage",
                successFunc: function (obj) {
                    let aaa = obj.result;
                },
                failFunc: function (obj) {
                    msgBox.alert({
                        title: "提示",
                        info: obj.detailMessage
                    });
                },
                args: {
                    requestParam: cmnPcr.jsonToStr({
                        repId: repId,
                        conversationId: conversationId,
                        message: message
                    })
                }
            };
            serverAccess.request(requestParam);
        }
    }

    this.clearChatContainer = function (){
        let container = $("#" + thatAiAssistant.containerId);
        thatAiAssistant.currentConversationId = null;
        let chatOuterContainer = $(container).find(".s3dAiAssistantOuterContainer");
        $(chatOuterContainer).find(".s3dAiAssistantMessageContainer").empty();
        let inputElement = $(chatOuterContainer).find(".s3dAiAssistantInputMsg");
        $(inputElement).val("");
        $(inputElement).focus();
    }

    this.sendDefaultQuestion = function (){
        let args = cmnPcr.getQueryStringArgs();
        let question = args["question"];
        thatAiAssistant.sendMessage(thatAiAssistant.repId, thatAiAssistant.currentConversationId, question);
    }
}

export default S3dAiAssistant