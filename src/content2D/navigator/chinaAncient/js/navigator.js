function ChinaAncientNavigator(){
    const thatChinaAncientNavigator = this;

    this.containerId = null;

    this.manager = null;

    this.pageInfo = {
        totalCount: 1,
        currentIndex: 0
    };

    this.shiftAnimationTime = 400;

    //事件
    this.eventFunctions = {};
    this.addEventFunction = function(eventName, func){
        let allFuncs = thatChinaAncientNavigator.eventFunctions[eventName];
        if(allFuncs == null){
            allFuncs = [];
            thatChinaAncientNavigator.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    }
    this.doEventFunction = function(eventName, p){
        let allFuncs = thatChinaAncientNavigator.eventFunctions[eventName];
        if(allFuncs != null){
            for(let i = 0; i < allFuncs.length; i++){
                let func = allFuncs[i];
                func(p);
            }
        }
    }

    this.init = function (p){
        thatChinaAncientNavigator.containerId = p.containerId;
        thatChinaAncientNavigator.manager = p.manager;
        thatChinaAncientNavigator.pageInfo.totalCount = p.pageInfo.totalCount;
        thatChinaAncientNavigator.pageInfo.currentIndex = p.pageInfo.currentIndex;

        if(p.onGoToNextPage != null){
            thatChinaAncientNavigator.addEventFunction("onGoToNextPage", p.onGoToNextPage);
        }
        if(p.onGoToPreviousPage != null){
            thatChinaAncientNavigator.addEventFunction("onGoToPreviousPage", p.onGoToPreviousPage);
        }


        thatChinaAncientNavigator.initHtml();
        thatChinaAncientNavigator.setPageIndex(thatChinaAncientNavigator.pageInfo.currentIndex);
    }

    this.initHtml = function (){
        let navigatorContainer = $("#" + thatChinaAncientNavigator.containerId).find(".chinaAncientNavigatorContainer");
        let html = thatChinaAncientNavigator.getHtml();
        $(navigatorContainer).append(html);

        thatChinaAncientNavigator.bindEvents();
    }

    this.getHtml = function () {
        let html= "<div class='chinaAncientNavigatorInner'>";
        html += "<div class='chinaAncientNavigatorPart chinaAncientNavigatorPre'><div class='chinaAncientNavigatorPageTurnBtn chinaAncientNavigatorPageTurnBtnPre'>&#x2039;</div></div>";
        html += "<div class='chinaAncientNavigatorPart chinaAncientNavigatorCenter'><div class='chinaAncientNavigatorPageList'>";
        for(let i = 0; i < thatChinaAncientNavigator.pageInfo.totalCount; i++){
            html += "<div class='chinaAncientNavigatorPageItem' pageIndex='" + i + "'>&#x25CF;</div>";
        }
        html += "</div></div>";
        html += "<div class='chinaAncientNavigatorPart chinaAncientNavigatorNext'><div class='chinaAncientNavigatorPageTurnBtn chinaAncientNavigatorPageTurnBtnNext'>&#x203A;</div></div>";
        html += "</div>";
        return html;
    }

    this.bindEvents = function (){
        let container = $("#" + thatChinaAncientNavigator.containerId)[0];
        $(container).find(".chinaAncientNavigatorPageTurnBtnPre").mousedown(function (){
            thatChinaAncientNavigator.goToPreviousPage();
        });
        $(container).find(".chinaAncientNavigatorPageTurnBtnNext").mousedown(function (){
            thatChinaAncientNavigator.goToNextPage();
        });
        $(container).find(".chinaAncientNavigatorPageItem").mousedown(function (){
            let pageIndex = parseInt($(this).attr("pageIndex"));
            thatChinaAncientNavigator.goToPageByIndex(pageIndex);
        });
    }

    this.setPageIndex = function (pageIndex){
        let container = $("#" + thatChinaAncientNavigator.containerId)[0];
        thatChinaAncientNavigator.pageInfo.currentIndex = pageIndex;
        $(container).find(".chinaAncientNavigatorPageItem").removeClass("chinaAncientNavigatorPageItemActive");
        $(container).find(".chinaAncientNavigatorPageItem[pageIndex='" + pageIndex + "']").addClass("chinaAncientNavigatorPageItemActive");
    }

    this.goToNextPage = function (){
        let nextPageIndex = thatChinaAncientNavigator.pageInfo.currentIndex + 1;
        if(nextPageIndex >= thatChinaAncientNavigator.pageInfo.totalCount) {
            nextPageIndex = 0;
        }
        thatChinaAncientNavigator.setPageIndex(nextPageIndex);
        thatChinaAncientNavigator.manager.localContent2D.initPageByIndex(nextPageIndex, true, true, thatChinaAncientNavigator.shiftAnimationTime);
        thatChinaAncientNavigator.doEventFunction("onGoToPage", {
            pageIndex: nextPageIndex
        });

    }

    this.goToPreviousPage = function (){
        let previousPageIndex = thatChinaAncientNavigator.pageInfo.currentIndex - 1;
        if(previousPageIndex < 0) {
            previousPageIndex = thatChinaAncientNavigator.pageInfo.totalCount - 1;
        }
        thatChinaAncientNavigator.setPageIndex(previousPageIndex);
        thatChinaAncientNavigator.manager.localContent2D.initPageByIndex(previousPageIndex, true, false, thatChinaAncientNavigator.shiftAnimationTime);
        thatChinaAncientNavigator.doEventFunction("onGoToPage", {
            pageIndex: previousPageIndex
        });
    }

    this.goToPageByIndex = function (pageIndex){
        if(pageIndex >= 0 && pageIndex < thatChinaAncientNavigator.pageInfo.totalCount) {
            let lastPageIndex = thatChinaAncientNavigator.pageInfo.currentIndex;
            thatChinaAncientNavigator.setPageIndex(pageIndex);
            thatChinaAncientNavigator.manager.localContent2D.initPageByIndex(pageIndex, true, pageIndex > lastPageIndex, thatChinaAncientNavigator.shiftAnimationTime);
            thatChinaAncientNavigator.doEventFunction("onGoToPage", {
                pageIndex: pageIndex
            });
        }
    }

}

export default ChinaAncientNavigator