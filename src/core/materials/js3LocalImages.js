import {s3dImageSourceType} from "../../commonjs/common/common.js";

let JS3LocalImages = function(){
    const thatLocalImages = this;

    this.manager = null;

    this.list = null;

    this.infoMap = {};

    this.init = function(p){
        thatLocalImages.manager = p.manager;
        thatLocalImages.list = p.imageList;
        thatLocalImages.initImageInfos();
    }

    this.updateImageList = function (imageList){
        thatLocalImages.list = imageList;
    }

    this.queryImages = function (keyword, pageIndex, onePageItemCount){
        let imageList = [];
        let index = 0;
        let rangeBeginIndex = pageIndex * onePageItemCount;
        let rangeEndIndex = (pageIndex + 1) * onePageItemCount - 1;
        keyword = keyword.toLowerCase();
        for(let i = 0; i < thatLocalImages.list.length; i++){
            let image = thatLocalImages.list[i];
            if(image.name.toLowerCase().indexOf(keyword) >= 0){
                if(index >= rangeBeginIndex){
                    if(index <= rangeEndIndex){
                        imageList.push(image);
                    }
                    else {
                        break;
                    }
                }
                index++;
            }
        }
        return {
            pageIndex: pageIndex,
            images: imageList
        };
    }

    this.getImageUrl = function (imageName){
        let imageUrl = "";
        let splitter = "://";
        let splitterIndex = imageName.indexOf(splitter);
        let imageResourceType = s3dImageSourceType.local;
        if(splitterIndex >= 0) {
            imageResourceType = imageName.substr(0, splitterIndex);
            imageName = imageName.substr(imageResourceType.length + splitter.length);
        }
        switch (imageResourceType) {
            case s3dImageSourceType.object: {
                imageUrl = thatLocalImages.manager.resourceLoader.getLocalFilesDirUrl() + imageName;
                break;
            }
            case s3dImageSourceType.system: {
                if(thatLocalImages.manager.isEditor) {
                    imageUrl = thatLocalImages.manager.layout.resourcesPublicFolder + "../../common/img/material/" + imageName + ".jpg";
                }
                else if(thatLocalImages.manager.isViewer){
                    imageUrl = thatLocalImages.manager.layout.resourcesUserFolder + "images/system/" + imageName;
                }
                break;
            }
            case s3dImageSourceType.local:
            default: {
                if(thatLocalImages.manager.isEditor) {
                    imageUrl = thatLocalImages.manager.layout.resourcesUserFolder + "images/" + imageName;
                }
                else if(thatLocalImages.manager.isViewer){
                    imageUrl = thatLocalImages.manager.layout.resourcesUserFolder + "images/user/" + imageName;
                }
                break;
            }
        }
        return imageUrl;
    }


    this.getImageInfo = function(code){
        if(code == null || code.length === 0) {
            return null;
        }
        else{
            let imageInfo = thatLocalImages.infoMap[code];
            if (imageInfo == null) {
                console.log("None image. Code=" + code)
                return null;
            } else {
                return imageInfo;
            }
        }
    }

    this.load = function(code, name, url){
        thatLocalImages.infoMap[code] = {
            code: code,
            name: name,
            url: url
        };
    }
    this.initImageInfos = function (){
        let imageInfos = thatLocalImages.list;
        if(imageInfos != null) {
            for (let i = 0; i < imageInfos.length; i++) {
                let imageInfo = imageInfos[i];
                thatLocalImages.load(
                    imageInfo.code,
                    imageInfo.name,
                    imageInfo.url);
            }
        }
    }
}
export default JS3LocalImages