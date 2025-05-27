import ChinaAncientNavigator from "./navigator.js"
import {cmnPcr} from "../../../../commonjs/common/common.js";
let args = cmnPcr.getQueryArgsFromUrl(import.meta.url);
let containerId = args.containerId;
let totalCount = parseInt(args.totalCount);
let currentIndex = parseInt(args.currentIndex);
let navigator = new ChinaAncientNavigator();
navigator.init({
    containerId: containerId,
    pageInfo: {
        totalCount: totalCount,
        currentIndex: currentIndex
    }
});