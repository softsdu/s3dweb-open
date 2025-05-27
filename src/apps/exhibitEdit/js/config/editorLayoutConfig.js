export const editorLayoutConfig = {
    header: {
        height: 60,
        sections: [
            {
                visible: true,
                hasHeader: false,
                blocks: [
                    {
                        name: "appSimpleHeader",
                        visible: true
                    }
                ]
            }
        ]
    },
    left:{
        width: 70,
        sections: [
            {
                visible: true,
                hasHeader: false,
                blocks:[
                    {
                        name: "appSimpleToolbar",
                        visible: true
                    },
                    {
                        name: "treeEditor",
                        visible: false
                    }
                ]
            }
        ]
    },
    center:{
        sections: [
            {
                visible: true,
                hasHeader: false,
                blocks:[
                    {
                        name: "viewer",
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
                hasHeader: false,
                blocks:[
                    {
                        name: "appSimpleEditor",
                        visible: true
                    }
                ]
            }
        ]
    }
};