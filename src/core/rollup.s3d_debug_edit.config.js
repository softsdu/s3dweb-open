import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel'
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-copy';

//生成s3d核心多个js
export default [{
    input: './src/core/manager/s3dWebEditManager.js',
    output: {
        //file: './dist/js/s3dWebEditManager.module.js',
        format: 'esm',
        dir: 'dist/debugEdit',
        preserveModules: true,
        preserveModulesRoot: 'src'
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
                    dest: "./dist/debugEdit/content2D"
                },
                {
                    src: "./src/images/*",
                    dest: "./dist/debugEdit/images"
                },
                {
                    src: "./src/fonts/*",
                    dest: "./dist/debugEdit/fonts"
                }
            ]
        })
    ]
}];