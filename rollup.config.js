import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import css from 'rollup-plugin-css-only';
import copy from 'rollup-plugin-copy';

const production = !process.env.ROLLUP_WATCH;

export default {
    input: 'src/main.js',
    output: {
        format: 'iife',
        name: 'app',
        file: 'dist/bundle.js',
    },
    plugins: [
        svelte({
            compilerOptions: {
                // enable run-time checks when not in production
                dev: !production,
            },
        }),
        // we'll extract any component CSS out into
        // a separate file - better for performance
        css({ output: 'bundle.css' }),

        resolve({
            browser: true,
            dedupe: ['svelte'],
        }),
        commonjs(),

        copy({
            targets: [{
                src: ['manifest.json', 'icons', 'popup.html'],
                dest: ['dist'],
            }],
            verbose: true,
        }),

        // Watch the `src` directory and refresh the
        // browser on changes when not in production
        !production && livereload('src'),

        // If we're building for production (npm run build
        // instead of npm run dev), minify
        production && terser(),
    ],
    watch: {
        clearScreen: false,
    },
};