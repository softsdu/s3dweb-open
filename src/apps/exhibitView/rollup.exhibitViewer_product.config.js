import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel'
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-copy';

export default [{
    input: './src/apps/exhibitView/js/s3dExhibitViewer.js',
    output: {
        format: 'esm',
        dir: '../../dist/exhibitProView',
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
                    dest: "./dist/exhibitProView/apps/exhibitView/"
                },
                {
                    src: "./src/apps/exhibitView/favicon.ico",
                    dest: "./dist/exhibitProView/apps/exhibitView/"
                },
                {
                    src: "./src/apps/exhibitView/js/*",
                    dest: "./dist/exhibitProView/apps/exhibitView/js"
                },
                {
                    src: "./src/apps/exhibitView/css/*",
                    dest: "./dist/exhibitProView/apps/exhibitView/css"
                }
            ]
        })
    ]
}];