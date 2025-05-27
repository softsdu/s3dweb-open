import {cmnPcr, msgBox, PopupContainer, s3dImageSourceType, s3dUiStatus} from "../../commonjs/common/common.js"
import "./s3dLocalImagePicker.css"

//S3dWeb 选择本地图片
let s3dLocalImagePicker = function (){
    //当前对象
    const thatLocalImagePicker = this;

    this.manager = null;

    //containerId
    this.containerId = null;

    //参数信息
    this.paramInfo = null;

    //选中的图片地址（相对路径）
    this.imageUrl = null;

    this.onePageItemCount = 20;

    //事件
    this.eventFunctions = {};
    this.addEventFunction = function(eventName, func){
        let allFuncs = thatLocalImagePicker.eventFunctions[eventName];
        if(allFuncs == null){
            allFuncs = [];
            thatLocalImagePicker.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    }
    this.doEventFunction = function(eventName, p){
        let allFuncs = thatLocalImagePicker.eventFunctions[eventName];
        if(allFuncs != null){
            for(let i = 0; i < allFuncs.length; i++){
                let func = allFuncs[i];
                func(p);
            }
        }
    }

    //初始化
    this.init = function(p){
        thatLocalImagePicker.manager = p.manager;
        thatLocalImagePicker.containerId = p.containerId;
        thatLocalImagePicker.title = p.config.title == null ? "选择图片" : p.config.title;

        if(p.config.onButtonClick != null){
            thatLocalImagePicker.addEventFunction("onButtonClick", p.config.onButtonClick);
        }

        if(p.config.onUploadImage != null){
            thatLocalImagePicker.addEventFunction("onUploadImage", p.config.onUploadImage);
        }

        if(p.config.onRemoveImage != null){
            thatLocalImagePicker.addEventFunction("onRemoveImage", p.config.onRemoveImage);
        }
    }

    //显示图片选择器
    this.showPicker = function(p){
        thatLocalImagePicker.paramInfo = p.paramInfo;
        thatLocalImagePicker.imageUrl = p.paramInfo.imageUrl;
        //图片列表
        thatLocalImagePicker.showContainer();
    }

    //添加条目
    this.addItemToList = function(p){
        let container = $("#" + thatLocalImagePicker.popContainer.contentId)[0];
        let innerContainer = $(container).find(".s3dLocalImagePickerInnerContainer")[0];
        p.index = $(innerContainer).children().length;
        let itemHtml = thatLocalImagePicker.getItemHtml(p);
        $(innerContainer).append(itemHtml);
    }

    this.onButtonClick = function (buttonName){
        let p = {
            buttonName: buttonName,
            processed: false
        };
        thatLocalImagePicker.doEventFunction("onButtonClick", p);
        return p.processed;
    }

    this.removeImage = function (imageCode){
        let p = {
            imageCode: imageCode,
            processed: false
        };
        thatLocalImagePicker.doEventFunction("onRemoveImage", p);
        if(p.processed){
            let container = $("#" + thatLocalImagePicker.popContainer.contentId)[0];
            $(container).find(".s3dLocalImagePickerItemContainer[imageCode='" + imageCode + "']").remove();
        }
        else{
            msgBox.alert({info: "尚未实现删除图片的服务器端方法."});
        }
    }

    //显示选择器的容器
    this.showContainer = function(p){

        let popContainer = new PopupContainer({
            width: 1000,
            height: 800,
            top: 50,
            canClose: true,
            title: "选择图片",
            containerId: thatLocalImagePicker.containerId
        });
        popContainer.show();
        thatLocalImagePicker.popContainer = popContainer;


        let container = $("#" + thatLocalImagePicker.popContainer.contentId)[0];
        let winHtml = thatLocalImagePicker.getMainHtml();
        $(container).html(winHtml);

        let imagesInfo = thatLocalImagePicker.queryImages("", 0, thatLocalImagePicker.onePageItemCount);
        thatLocalImagePicker.showList(imagesInfo);

        $(container).find(".s3dLocalImagePickerQueryInput").change(function (){
            let keyword = $(this).val().trim();
            let materialsInfo = thatLocalImagePicker.queryImages(keyword, 0, thatLocalImagePicker.onePageItemCount);
            thatLocalImagePicker.showList(materialsInfo);
        });

        $(container).find(".s3dLocalImagePickerMoreBtn").click(function (){
            let container = $("#" + thatLocalImagePicker.popContainer.contentId).find(".s3dLocalImagePickerContainer")[0];
            let nextPageIndex = parseInt($(this).attr("nextPageIndex"));
            let keyword = $(container).find(".s3dLocalImagePickerQueryInput").val().trim();
            let imagesInfo = thatLocalImagePicker.queryImages(keyword, nextPageIndex, thatLocalImagePicker.onePageItemCount);
            thatLocalImagePicker.showList(imagesInfo);
        });

        $(container).find(".s3dLocalImagePickerTitle").text(thatLocalImagePicker.title);
        $(container).find(".s3dLocalImagePickerCloseBtn").click(function(event){
            thatLocalImagePicker.hideContainer();
            thatLocalImagePicker.manager.viewer.changeStatus({
                status: s3dUiStatus.normalView
            });
        })

        $(container).find(".s3dLocalImagePickerBottomBtn").click(function (){
            let btnName = $(this).attr("name");

            let processed = thatLocalImagePicker.onButtonClick(btnName);

            switch (btnName){
                case "localImage":{
                    thatLocalImagePicker.popLocalImageSelectWindow();
                    break;
                }
                case "cancel":{
                    thatLocalImagePicker.hideContainer();
                    thatLocalImagePicker.manager.viewer.changeStatus({
                        status: s3dUiStatus.normalView
                    });
                    break;
                }
                case "clear":{
                    thatLocalImagePicker.imageUrl = "";
                    thatLocalImagePicker.endPick();
                    thatLocalImagePicker.manager.viewer.changeStatus({
                        status: s3dUiStatus.normalView
                    });
                    break;
                }
                default:{
                    break;
                }
            }
        });

        $(container).find(".s3dLocalImagePickerListHeader").click(function (){
            let partContainer= $(this).parent();
            if($(partContainer).hasClass("s3dLocalImagePickerPartContainerExpand")){
                $(partContainer).removeClass("s3dLocalImagePickerPartContainerExpand");
            }
            else {
                $(partContainer).addClass("s3dLocalImagePickerPartContainerExpand");
            }
        });

        $(container).find(".s3dLocalImagePickerUploadFileInput").change(function (){
            let container = $("#" + thatLocalImagePicker.popContainer.contentId)[0];
            let input = $(container).find(".s3dLocalImagePickerUploadFileInput")[0];

            if (input.files && input.files[0]) {
                thatLocalImagePicker.onUploadImage(input.files[0]);
            }
        });
    }

    //添加条目
    this.addItemToList = function(p){
        let container = $("#" + thatLocalImagePicker.popContainer.contentId).find(".s3dLocalImagePickerInnerContainer")[0];
        let listContainer = $(container).find(".s3dLocalImagePickerListContainer")[0];
        p.index = $(listContainer).children().length;
        let itemHtml = thatLocalImagePicker.getItemHtml(p);
        $(listContainer).append(itemHtml);
    }

    this.onUploadImage = function (file){
        let p = {
            file: file,
            processed: false
        };
        thatLocalImagePicker.doEventFunction("onUploadImage", p);
        if(!p.processed){
            msgBox.alert({info: "尚未实现文件上传的服务器端方法."});
        }
    }

    this.popLocalImageSelectWindow = function (){
        let container = $("#" + thatLocalImagePicker.popContainer.contentId)[0];
        $(container).find(".s3dLocalImagePickerBottomContainer .s3dLocalImagePickerUploadFileInput").click();
    }

    this.showUnimplementedMethodAlert = function (buttonName){
        msgBox.alert({info: "尚未实现的方法. MethodName=" + buttonName});
    }

    this.getMainHtml = function(p){
        let html = "<div class='s3dLocalImagePickerContainer'>"
            + "<div class='s3dLocalImagePickerInnerContainer'>";
        html += "<div class='s3dLocalImagePickerHeader'><input type='text' class='s3dLocalImagePickerQueryInput' placeholder='请输入关键词' /></div>";
        html += ("<div class='s3dLocalImagePickerPartContainer'>");
        html += "<div class='s3dLocalImagePickerListContainer'></div>";
        html += "<div class='s3dLocalImagePickerListMoreContainer'><div class='s3dLocalImagePickerMoreBtn'>更多...</div></div>";
        html += "<div class='s3dLocalImagePickerListNoMoreContainer'>- 无更多图片 -</div>";
        html += "</div>";
        html += ("</div>"
            + "<div class='s3dLocalImagePickerBottomContainer'>"
            + "<input class='s3dLocalImagePickerUploadFileInput' style='display:none;' type='file' name='imageInput' accept='image/png, image/jpeg'>"
            + "<div class='s3dLocalImagePickerBottomBtn s3dLocalImagePickerBtnUpload' name='localImage'>本地图片...</div>"
            + "<div class='s3dLocalImagePickerBottomBtn s3dLocalImagePickerBtnClear' name='clear'>清&nbsp;&nbsp;除</div>"
            + "<div class='s3dLocalImagePickerBottomBtn s3dLocalImagePickerBtnCancel' name='cancel'>取&nbsp;&nbsp;消</div>"
            + "</div>"
            + "</div>");
        return html;
    }

    this.queryImages = function (keyword, pageIndex, onePageItemCount){
        return thatLocalImagePicker.manager.localImages.queryImages(keyword, pageIndex, onePageItemCount);
    }

    //构造图片条目html
    this.getItemHtml = function(p) {
        let imageUrl = thatLocalImagePicker.manager.localImages.getImageUrl(p.url);
        let html = "<div class='s3dLocalImagePickerItemContainer" + (p.selected ? " s3dLocalImagePickerItemContainerActive" : "") + "' imageCode='" + p.code + "' imageUrl='" + p.url + "'>";
        html += "<div class='s3dLocalImagePickerItemInnerContainer'>";
        html += "<div class='s3dLocalImagePickerItemCell s3dLocalImagePickerItemName'>" + p.name + "</div>";
        html += ("<div class='s3dLocalImagePickerItemCell s3dLocalImagePickerItemColor' style='background-image:url(" + imageUrl + ");'>&nbsp;</div>");
        html += "<div class='s3dLocalImagePickerItemDelete'>&#10005;</div>";
        html += "</div>";
        html += "</div>";
        return html;
    }

    this.showList = function (imagesInfo){
        let container = $("#" + thatLocalImagePicker.popContainer.contentId).find(".s3dLocalImagePickerContainer")[0];
        if(imagesInfo.pageIndex === 0){
            //清除列表里的内容
            $(container).find(".s3dLocalImagePickerListContainer").empty();
        }

        for(let i = 0; i < imagesInfo.images.length; i++) {
            let image = imagesInfo.images[i];
            thatLocalImagePicker.addItemToList(image);

            let itemContainer = $(container).find(".s3dLocalImagePickerItemContainer[imageCode='" + image.code +"']");

            $(itemContainer).click(function(){
                thatLocalImagePicker.imageUrl = $(this).attr("imageUrl");
                thatLocalImagePicker.endPick();
                thatLocalImagePicker.manager.viewer.changeStatus({
                    status: s3dUiStatus.normalView
                });
            });

            $(itemContainer).find(".s3dLocalImagePickerItemDelete").click(function(event){
                let imageCode = $(this).parent().parent().attr("imageCode");
                if(msgBox.confirm({info: "确定删除吗?"})) {
                    thatLocalImagePicker.removeImage(imageCode);
                }
            });
        }

        $(container).find(".s3dLocalImagePickerMoreBtn").attr("nextPageIndex", imagesInfo.pageIndex + 1);

        if(imagesInfo.images.length < thatLocalImagePicker.onePageItemCount){
            //没有更多记录了
            $(container).find(".s3dLocalImagePickerListNoMoreContainer").removeClass("s3dLocalImagePickerHidden");
            $(container).find(".s3dLocalImagePickerListMoreContainer").addClass("s3dLocalImagePickerHidden");
        }
        else{
            $(container).find(".s3dLocalImagePickerListNoMoreContainer").addClass("s3dLocalImagePickerHidden");
            $(container).find(".s3dLocalImagePickerListMoreContainer").removeClass("s3dLocalImagePickerHidden");
        }

    }

    //取消选择
    this.cancelPick = function(p){
        thatLocalImagePicker.hideContainer(p);
    }

    //隐藏选择器容器
    this.hideContainer = function(p){
        thatLocalImagePicker.popContainer.close();
    }

    //结束选择
    this.endPick = function(){
        let imageUrl =  thatLocalImagePicker.imageUrl;
        thatLocalImagePicker.hideContainer();

        thatLocalImagePicker.paramInfo.afterPickImage({
            imageUrl: imageUrl == null || imageUrl.length === 0 ? "" : (s3dImageSourceType.local + "://" + imageUrl),
            paramInfo: thatLocalImagePicker.paramInfo
        });

    }
}
export default s3dLocalImagePicker