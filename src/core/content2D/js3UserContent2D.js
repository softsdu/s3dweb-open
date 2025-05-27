import {cmnPcr} from "../../commonjs/common/common.js"
import * as THREE from "three"

let Js3UserContent2D = function(){
    const thatContent2D = this;

    this.manager = null;

    this.pageMap = {};

    this.pageList = null;

    this.navigatorCode = null;

    this.shiftType = null;

    this.cameraId = null;

    this.init = function(p){
        thatContent2D.manager = p.manager;
    }

    this.loadPage = function (pageInfo){
        thatContent2D.pageMap[pageInfo.code] = pageInfo;
    }

    this.initContent2DInfo = function (content2D) {
        let navigatorCode = content2D == null ? "" : content2D.navigatorCode;
        let shiftType = content2D == null ? "" : content2D.shiftType;
        let cameraId = content2D == null ? "" : content2D.cameraId;
        let pageList = content2D == null ? null : content2D.pageList;
        if (pageList == null) {
            pageList = [];
        }
        thatContent2D.navigatorCode = navigatorCode;
        thatContent2D.shiftType = shiftType;
        thatContent2D.cameraId = cameraId;
        thatContent2D.pageList = pageList;
        for (let i = 0; i < pageList.length; i++) {
            let pageInfo = pageList[i];
            thatContent2D.loadPage(pageInfo);
        }
    }

    this.removePage = function (code){
        let newPageList = [];
        for(let i = 0; i < thatContent2D.pageList.length; i++){
            let pageInfo = thatContent2D.pageList[i];
            if(pageInfo.code !== code){
                newPageList.push(pageInfo);
            }
        }
        thatContent2D.pageList = newPageList;
        delete thatContent2D.pageMap[code];
    }

    this.addPage = function (pageInfo){
        thatContent2D.pageList.push(pageInfo);
        thatContent2D.loadPage(pageInfo);
    }

    this.getSortedPageList = function (){
        let pageList =  thatContent2D.pageList;
        let sortedPageList = [];
        if(pageList != null) {
            for (let i = 0; i < pageList.length; i++) {
                let pageInfo = pageList[i];
                let tempPageList = [];
                let added = false;
                for (let j = 0; j < sortedPageList.length; j++) {
                    let pi = sortedPageList[j];
                    if (!added && pi.index > pageInfo.index) {
                        tempPageList.push(pageInfo);
                        added = true;
                    }
                    tempPageList.push(pi);
                }
                if (!added) {
                    tempPageList.push(pageInfo);
                }
                sortedPageList = tempPageList;
            }
        }
        return sortedPageList;
    }

    this.getContentInfo = function (){
        return {
            navigatorCode: thatContent2D.navigatorCode,
            shiftType: thatContent2D.shiftType,
            cameraId: thatContent2D.cameraId,
            pageList: thatContent2D.pageList
        };
    }

    this.getPageInfo = function (code){
        return thatContent2D.pageMap[code];
    }

    this.getPageInfoByName = function (name){
        for(let code in thatContent2D.pageMap) {
            let pageInfo = thatContent2D.pageMap[code];
            if(pageInfo.name === name){
                return pageInfo;
            }
        }
        return null;
    }

    this.checkHasPage = function (code){
        return thatContent2D.pageMap[code] == null;
    }

    this.checkSameNamePage = function (code, name){
        for(let c in thatContent2D.pageMap){
            let pageInfo = thatContent2D.pageMap[c];
            if(pageInfo.name === name && (code === null || pageInfo.code !== code)){
                return true;
            }
        }
        return false;
    }

    this.getNewPageName = function (name){
        let index = 1;
        let newName = name;
        while(thatContent2D.checkSameNamePage(null, newName)){
            newName = name + "_" + index;
            index++;
        }
        return newName;
    }

    this.updateCamera = function (cameraId) {
        thatContent2D.cameraId = cameraId;
    }

    this.updatePage = function (pageInfo) {
        let newPageList = [];
        for(let i = 0; i < thatContent2D.pageList.length; i++){
            let aInfo = thatContent2D.pageList[i];
            if(aInfo.code !== pageInfo.code){
                newPageList.push(aInfo);
            }
        }
        newPageList.push(pageInfo);
        thatContent2D.pageList = newPageList;
        thatContent2D.loadPage(pageInfo);
    }

    this.getNewPageInfo = function (name, themeCode, moduleCode){
        let newName = thatContent2D.getNewPageName(name);
        let newPageInfo = {
            code: cmnPcr.createGuid(),
            name: newName,
            themeCode: themeCode,
            moduleCode: moduleCode,
            index: 99,
            itemMap: {},
            camera: {},
            states: []
        };
        return newPageInfo;
    }

    this.clonePageInfo = function (pageInfo){
        let newName = thatContent2D.getNewPageName(pageInfo.name);
        let newPageInfo = {
            code: cmnPcr.createGuid(),
            name: newName,
            themeCode: pageInfo.themeCode,
            moduleCode: pageInfo.moduleCode,
            index: pageInfo.index + 1,
            itemMap: {},
            camera: {},
            states: []
        };

        //2d页面上的元素
        for(let itemName in pageInfo.itemMap){
            let itemInfo = pageInfo.itemMap[itemName];
            let newItemInfo = {
                name: itemInfo.name,
                value: itemInfo.value
            };
            newPageInfo.itemMap[itemInfo.name] = itemInfo;
        }

        //相机
        if(pageInfo.camera != null) {
            if(newPageInfo.camera.zoom != null) {
                newPageInfo.camera.zoom = pageInfo.camera.zoom;
            }
            if(newPageInfo.camera.target != null) {
                newPageInfo.camera.target = [
                    pageInfo.camera.target[0],
                    pageInfo.camera.target[1],
                    pageInfo.camera.target[2]
                ];
            }
            if(newPageInfo.camera.position != null) {
                newPageInfo.camera.position = [
                    pageInfo.camera.position[0],
                    pageInfo.camera.position[1],
                    pageInfo.camera.position[2]
                ];
            }
        }

        //3d元素的可见性
        for(let i = 0; i < pageInfo.states.length; i++){
            let stateInfo = pageInfo.states[i];
            let newStateInfo = {
                objectId: stateInfo.objectId,
                visible: stateInfo.visible
            };
            newPageInfo.states.push(newStateInfo);
        }
        return newPageInfo;
    }
}
export default Js3UserContent2D