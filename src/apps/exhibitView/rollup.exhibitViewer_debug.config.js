import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel'
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-copy';

export default [{
    input: './src/apps/exhibitView/js/s3dExhibitViewer.js',
    output: {
        format: 'esm',
        dir: '../../dist/debugView',
        preserveModules: true,
        preserveModulesRoot: 'src'
    },
    globals: [

    ],
    plugins: [
        resolve({
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
                    src: "./src/apps/exhibitView/exhibitViewer.html",
                    dest: "./dist/debugView/apps/exhibitView/"
                },
                {
                    src: "./src/apps/exhibitView/favicon.ico",
                    dest: "./dist/debugView/apps/exhibitView/"
                },
                {
                    src: "./src/apps/exhibitView/js/*",
                    dest: "./dist/debugView/apps/exhibitView/js"
                },
                {
                    src: "./src/apps/exhibitView/css/*",
                    dest: "./dist/debugView/apps/exhibitView/css"
                }
            ]
        })
    ]
}];