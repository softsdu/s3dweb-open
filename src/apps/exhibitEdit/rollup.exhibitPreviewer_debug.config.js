import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel'
import postcss from 'rollup-plugin-postcss';
import copy from 'rollup-plugin-copy';

export default [{
    input: './src/apps/exhibitEdit/js/s3dExhibitPreviewer.js',
    output: {
        format: 'esm',
        dir: '../../dist/debugEdit',
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
                    src: "./src/apps/exhibitEdit/exhibitPreviewer.html",
                    dest: "./dist/debugEdit/apps/exhibitEdit/"
                },
                {
                    src: "./src/apps/exhibitEdit/favicon.ico",
                    dest: "./dist/debugEdit/apps/exhibitEdit/"
                },
                {
                    src: "./src/apps/exhibitEdit/js/*",
                    dest: "./dist/debugEdit/apps/exhibitEdit/js"
                }
            ]
        })
    ]
}];