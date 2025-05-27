import {cmnPcr, s3dElement3DType} from "../../commonjs/common/common.js";
import "./s3dCameraRender.css"
import * as THREE from "three"
import Stats from "three/addons/libs/stats.module.js";
import {CSS2DRenderer} from "three/addons/renderers/CSS2DRenderer.js";

let S3dCameraRender = function (){
    var thatCameraRender = this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;

    this.cameraObject3D = null;

    this.normalRender = null;

    this.normalRender2D = null;

    this.miniRender = null;

    this.stats = null;

    this.miniMaxSize = 300;

    //初始化
    this.init = function(p){
        thatCameraRender.containerId = p.containerId;
        thatCameraRender.manager = p.manager;
        thatCameraRender.initRender();
    }

    this.rebindCamera = function (nodeArray){
        if(nodeArray == null || nodeArray.length !== 1){
            thatCameraRender.cameraObject3D = null;
            thatCameraRender.setRenderContainerVisible(false);
            thatCameraRender.removeStats();
        }
        else{
            let nodeJson = nodeArray[0];
            let object3D = thatCameraRender.manager.viewer.getObject3DById(nodeJson.id);
            let info = object3D.userData.info;
            if(info.type === s3dElement3DType.camera){
                thatCameraRender.cameraObject3D = object3D;
                thatCameraRender.setRenderContainerVisible(true);
                thatCameraRender.normalAnimate();
                thatCameraRender.miniAnimate();
                thatCameraRender.addStats();
            }
            else{
                thatCameraRender.cameraObject3D = null;
                thatCameraRender.setRenderContainerVisible(false);
                thatCameraRender.removeStats();
            }
        }
    }

    this.setRenderContainerVisible = function (visible){
        let container = $("#" + thatCameraRender.containerId);
        let cameraRenderContainer = $(container).find(".s3dLayoutBlock[name='cameraRender']");
        $(cameraRenderContainer).find(".s3dCameraRenderNormalViewContainer").css({display: visible ? "block" : "none"});
        let normalViewContainer = $(cameraRenderContainer).find(".s3dCameraRenderNormalViewContainer");

        let ratio = 1;
        if(visible){
            let info = thatCameraRender.cameraObject3D.userData.info;
            let aspectStr = info.parameters["aspect"].value;
            if(aspectStr === "auto"){
                let width = $(cameraRenderContainer).width();
                let height = $(cameraRenderContainer).height();
                ratio = width / height;
            }
            else {
                let expression = info.parameters["aspect"].value.replace(":", "/");
                let ratioFunc = new Function("return " + expression);
                ratio = ratioFunc();
            }
        }
        let normalWidth = $(cameraRenderContainer).width();
        let normalHeight = $(cameraRenderContainer).height();
        if(normalWidth / normalHeight > ratio){
            //宽度大
            normalWidth = normalHeight * ratio;
        }
        else{
            //高度大
            normalHeight = normalWidth / ratio;
        }
        $(normalViewContainer).width(normalWidth);
        $(normalViewContainer).height(normalHeight);
        thatCameraRender.normalRender.setSize(normalWidth, normalHeight);
        thatCameraRender.normalRender.setPixelRatio(ratio);
        thatCameraRender.normalRender2D.setSize(normalWidth, normalHeight);

        let viewerContainer = $(container).find(".s3dLayoutBlock[name='viewer']");
        $(viewerContainer).find(".s3dCameraRenderMiniView").css({display: visible ? "block" : "none"});
        let miniViewContainer = $(viewerContainer).find(".s3dCameraRenderMiniViewContainer");
        let miniWidth = thatCameraRender.miniMaxSize;
        let miniHeight = thatCameraRender.miniMaxSize;
        if(miniWidth / miniHeight > ratio){
            //宽度大
            miniWidth = miniHeight * ratio;
        }
        else{
            //高度大
            miniHeight = miniWidth / ratio;

        }
        $(miniViewContainer).width(miniWidth);
        $(miniViewContainer).height(miniHeight);
        thatCameraRender.miniRender.setSize(miniWidth, miniHeight);
        thatCameraRender.miniRender.setPixelRatio(ratio);
    }


    //初始化Render
    this.initRender = function() {
        let container = $("#" + thatCameraRender.containerId);

        //normalRender放到block里
        let cameraRenderContainer = $(container).find(".s3dLayoutBlock[name='cameraRender']");
        let normalHtml = "<div class='s3dCameraRenderContainer'>"
            + "<div class='s3dCameraRenderMessageContainer'><div class='s3dCameraRenderMessage'>请选择一个相机.</div></div>"
            + "<div class='s3dCameraRenderNormalViewContainer'></div>"
            + "</div>";
        $(cameraRenderContainer).append(normalHtml);
        thatCameraRender.normalRender = thatCameraRender.createRender($(cameraRenderContainer).find(".s3dCameraRenderNormalViewContainer"));
        thatCameraRender.normalRender2D = thatCameraRender.createRender2D($(cameraRenderContainer).find(".s3dCameraRenderNormalViewContainer"));
        $(cameraRenderContainer).find(".s3dCameraRenderNormalViewContainer").append(thatCameraRender.normalRender.domElement);
        $(cameraRenderContainer).find(".s3dCameraRenderNormalViewContainer").append(thatCameraRender.normalRender2D.domElement);

        //miniRender放到编辑窗口右下角
        let viewerContainer = $(container).find(".s3dLayoutBlock[name='viewer']");
        let miniHtml = "<div class='s3dCameraRenderMiniView'>"
            + "<div class='s3dCameraRenderMiniViewContainer'></div>"
            + "</div>";
        $(viewerContainer).append(miniHtml);
        thatCameraRender.miniRender = thatCameraRender.createRender($(viewerContainer).find(".s3dCameraRenderMiniViewContainer"));
        $(viewerContainer).find(".s3dCameraRenderMiniViewContainer").append(thatCameraRender.miniRender.domElement);
    };

    //删除统计
    this.removeStats = function (){
        thatCameraRender.stats = null;
        let container = $("#" + thatCameraRender.containerId);
        $(container).find(".s3dCameraRenderNormalViewContainer .s3dCameraRenderStats").remove();
    };

    //添加统计
    this.addStats = function (){
        setTimeout(function () {
            let container = $("#" + thatCameraRender.containerId);
            let stats = new Stats();
            $(stats.dom).addClass("s3dCameraRenderStats");
            $(stats.dom).css({
                "position": "",
                "top": "",
                "left": ""
            })
            $(container).find(".s3dCameraRenderNormalViewContainer").append(stats.dom);
            thatCameraRender.stats = stats;
        }, 200);
    }

    this.createRender2D = function (cameraViewContainer){
        let renderer2d = new CSS2DRenderer();
        let width = $(cameraViewContainer).find(".s3dViewerInnerContainer").width();
        let height = $(cameraViewContainer).find(".s3dViewerInnerContainer").height();
        renderer2d.setSize( width, height );
        renderer2d.domElement.style.position = 'absolute';
        renderer2d.domElement.style.top = '0px';
        renderer2d.domElement.tabIndex = 0;
        return renderer2d;
    }

    this.createRender = function (cameraViewContainer){
        let renderer = new THREE.WebGLRenderer({
            antialias: true,
            logarithmicDepthBuffer: true,
            alpha: thatCameraRender.manager.viewer.alpha
        });
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.localClippingEnabled = true;
        renderer.physicallyCorrectLights = true;

        renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        renderer.toneMapping = THREE.LinearToneMapping;
        renderer.toneMappingExposure = 1.0;

        let width = $(cameraViewContainer).find(".viewInnerContainer").width();
        let height = $(cameraViewContainer).find(".viewInnerContainer").height();
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        return renderer;
    }

    this.updateStats = function (){
        if(thatCameraRender.stats != null) {
            thatCameraRender.stats.update();
        }
    }

    this.normalAnimate = function() {
        if(thatCameraRender.cameraObject3D != null) {
            let renderer = thatCameraRender.normalRender;
            let renderer2D = thatCameraRender.normalRender2D;
            renderer.render(thatCameraRender.manager.viewer.scene, thatCameraRender.cameraObject3D);
            renderer2D.render(thatCameraRender.manager.viewer.scene, thatCameraRender.cameraObject3D);
            thatCameraRender.updateStats();
            requestAnimationFrame(thatCameraRender.normalAnimate);
        }
    };

    this.miniAnimate = function() {
        if(thatCameraRender.cameraObject3D != null) {
            let renderer = thatCameraRender.miniRender;
            renderer.render(thatCameraRender.manager.viewer.scene, thatCameraRender.cameraObject3D);
            requestAnimationFrame(thatCameraRender.miniAnimate);
        }
    };
}

export default S3dCameraRender