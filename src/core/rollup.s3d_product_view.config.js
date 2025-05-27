import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel'
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-copy';

//生成s3d核心单个js
export default [{
    input: './src/core/manager/s3dWebViewManager.js',
    output: {
        file: './dist/exhibitProView/core/manager/s3dWebViewManager.module.js',
        format: 'esm'
    },
    globals: [

    ],
    plugins: [
        resolve({
            //moduleDirectories: ['commonjs']
        }),
        commonjs({
            include: ['node_modules/**']
        }),
        babel({
            exclude: ['node_modules/**'],
            babelHelpers: "bundled"
        }),
        postcss({
            extensions: ['.css'],
        }),
        copy({
            targets: [
                {
                    src: "./src/content2D/*",
                    dest: "./dist/exhibitProView/content2D"
                },
                {
                    src: "./src/images/*",
                    dest: "./dist/exhibitProView/images"
                },
                {
                    src: "./src/fonts/*",
                    dest: "./dist/exhibitProView/fonts"
                }
            ]
        })
    ]
}];