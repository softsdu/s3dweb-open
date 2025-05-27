export const defaultLayoutConfig = {
    left:{
        width: 300,
        sections: [
            {
                visible: true,
                hasHeader: true,
                blocks:[
                    {
                        name: "treeEditor",
                        visible: true
                    }
                ]
            },
            {
                height: 500,
                visible: true,
                hasHeader: true,
                blocks:[
                    {
                        name: "scene3dToolbar",
                        visible: true
                    },
                    {
                        name: "statusBar",
                        visible: true
                    }
                ]
            }
        ]
    },
    center:{
        sections: [
            {
                visible: true,
                hasHeader: true,
                blocks:[
                    {
                        name: "viewer",
                        visible: true
                    },
                    {
                        name: "cameraRender",
                        visible: true
                    }
                ],
            },
            {
                height: 350,
                visible: false,
                blocks:[
                    {
                        name: "animationEditor",
                        visible: true
                    },
                    {
                        name: "progressEditor",
                        visible: true
                    },
                    {
                        name: "content2DEditor",
                        visible: true
                    }
                ],
            }
        ]
    },
    right:{
        width: 300,
        sections: [
            {
                visible: true,
                hasHeader: true,
                blocks:[
                    {
                        name: "propertyEditor",
                        visible: true
                    },
                    {
                        name: "animationList",
                        visible: true
                    },
                    {
                        name: "progressList",
                        visible: true
                    },
                    {
                        name: "content2DList",
                        visible: true
                    }
                ]
            },
            {
                height: 500,
                visible: true,
                hasHeader: true,
                blocks:[
                    {
                        name: "materialEditor",
                        visible: true
                    }
                ]
            }
        ]
    }
};