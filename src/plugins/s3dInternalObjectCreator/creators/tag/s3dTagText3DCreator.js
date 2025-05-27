import * as THREE from "three"

let S3dTagText3DCreator = function (){
    var thatTagText3DCreator = this;

    this.defaultFontSize = 200;

    this.getText3DHSize = function (text, fontSize, letterSpacing){
        return {
            x: text.length * fontSize + (letterSpacing * (text.length - 1)),
            y: fontSize,
            z: 1
        };
    }

    this.getText3DVSize = function (text, fontSize, letterSpacing){
        return {
            x: fontSize,
            y: text.length * fontSize + (letterSpacing * (text.length - 1)),
            z: 1
        };
    }

    this.createTextSprite = function (p){
        let textSprite = null;
        switch(p.textDirection){
            case "Horizontal":{
                let canvas = thatTagText3DCreator.createHTextCanvas({
                    text: p.text,
                    bold: p.bold,
                    fontFamily: p.fontFamily,
                    textAlign: "center",
                    textBaseline: "middle",
                    textColor: p.textColor,
                    fontSize: p.fontSize,
                    letterSpacing: p.letterSpacing
                });

                // 将画布转换为纹理
                let texture = new THREE.CanvasTexture(canvas);

                // 创建精灵材质和精灵对象
                let spriteMaterial = new THREE.SpriteMaterial({map: texture, color: p.textColor});
                textSprite = new THREE.Sprite(spriteMaterial);
                let text3DSize = thatTagText3DCreator.getText3DHSize(p.text, p.fontSize, p.letterSpacing);
                textSprite.scale.set(text3DSize.x, text3DSize.y, text3DSize.z); // 设置精灵尺寸
                break;
            }
            case "Vertical":{
                let canvas = thatTagText3DCreator.createVTextCanvas({
                    text: p.text,
                    bold: p.bold,
                    fontFamily: p.fontFamily,
                    textAlign: "center",
                    textBaseline: "middle",
                    textColor: p.textColor,
                    fontSize: p.fontSize,
                    letterSpacing: p.letterSpacing
                });

                // 将画布转换为纹理
                let texture = new THREE.CanvasTexture(canvas);

                // 创建精灵材质和精灵对象
                let spriteMaterial = new THREE.SpriteMaterial({map: texture, color: p.textColor});
                textSprite = new THREE.Sprite(spriteMaterial);
                let text3DSize = thatTagText3DCreator.getText3DVSize(p.text, p.fontSize, p.letterSpacing);
                textSprite.scale.set(text3DSize.x, text3DSize.y, text3DSize.z); // 设置精灵尺寸
                break;
            }
        }
        return textSprite;
    }

    this.createHTextCanvas = function (p){
        let defaultFontSize = thatTagText3DCreator.defaultFontSize;
        let canvas = document.createElement('canvas');
        canvas.width = defaultFontSize * p.text.length  + defaultFontSize * (p.letterSpacing * (p.text.length - 1)) / p.fontSize;
        canvas.height = defaultFontSize;
        let context = canvas.getContext('2d');
        context.font = (p.bold ? "Bold " : "") + defaultFontSize + "px " + (p.fontFamily ? ("'" + p.fontFamily + "'") : "");
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "white";
        //context.fillText(p.text, canvas.width / 2, canvas.height / 2);
        thatTagText3DCreator.letterSpacingHText(canvas, context, p.text, canvas.width / 2, canvas.height / 2, p.letterSpacing * defaultFontSize / p.fontSize);
        return canvas;
    }

    this.letterSpacingHText = function (canvas, context, text, x, y, letterSpacing) {
        let arrText = text.split('');
        // 这里仅考虑水平排列
        let originWidth = context.measureText(text).width;
        // 应用letterSpacing占据宽度
        let actualWidth = originWidth + letterSpacing * (arrText.length - 1);
        // 根据水平对齐方式确定第一个字符的坐标
        let align = context.textAlign || "left";
        if (align === "center") {
            x = x - actualWidth / 2;
        } else if (align === "right") {
            x = x - actualWidth;
        }

        // 临时修改为文本左对齐
        context.textAlign = "left";
        // 开始逐字绘制
        arrText.forEach(function (letter) {
            let letterWidth = context.measureText(letter).width;
            context.fillText(letter, x, y);
            // 确定下一个字符的横坐标
            x = x + letterWidth + letterSpacing;
        });
        // 对齐方式还原
        context.textAlign = align;
    };

    this.createVTextCanvas = function (p){
        let defaultFontSize = thatTagText3DCreator.defaultFontSize;
        let canvas = document.createElement('canvas');
        canvas.width = defaultFontSize;
        canvas.height = defaultFontSize * p.text.length + defaultFontSize * (p.letterSpacing * (p.text.length - 1)) / p.fontSize ;
        let context = canvas.getContext('2d');
        context.font = (p.bold ? "Bold " : "") + defaultFontSize + "px " + (p.fontFamily ? ("'" + p.fontFamily + "'") : "");
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "white";
        //context.fillText(p.text, canvas.width / 2, canvas.height / 2);
        thatTagText3DCreator.letterSpacingVText(canvas, context, p.text, canvas.width / 2, canvas.height / 2, p.letterSpacing * defaultFontSize / p.fontSize);
        return canvas;
    }

    this.letterSpacingVText = function (canvas, context, text, x, y, letterSpacing) {
        let arrText = text.split('');
        // 这里仅考虑水平排列
        let originWidth = context.measureText(text).width;
        // 应用letterSpacing占据宽度
        let actualWidth = originWidth + letterSpacing * (arrText.length - 1);
        // 根据水平对齐方式确定第一个字符的坐标
        let align = context.textAlign || "left";
        let textBaseline = context.textBaseline || "top";
        if (textBaseline === "middle") {
            y = y - actualWidth / 2;
        } else if (textBaseline === "bottom") {
            y = y - actualWidth;
        }

        // 临时修改为文本左对齐
        context.textBaseline = "top";
        context.textAlign = "center";
        // 开始逐字绘制
        for(let index = 0; index < arrText.length; index++){
            let letter = arrText[index];
            let code = letter.charCodeAt(0);
            let rotated = false;
            if(code <= 256){
                context.textAlign = "left";
                context.textBaseline = "middle";
                context.translate(x, y);
                context.rotate(Math.PI / 2);
                context.translate(-x, -y);
                rotated = true;
            }
            let letterWidth = context.measureText(letter).width;
            context.fillText(letter, x, y);

            if(rotated){
                context.translate(x, y);
                context.rotate(-Math.PI / 2);
                context.translate(-x, -y);
                context.textBaseline = "top";
                context.textAlign = "center";
            }

            // 确定下一个字符的横坐标
            y = y + letterWidth + letterSpacing;
        }
        // 对齐方式还原
        context.textBaseline = textBaseline;
        context.textAlign = align;
    };
}

export default S3dTagText3DCreator;
