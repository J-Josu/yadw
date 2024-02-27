import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { defineConfig } from 'rollup';

// The lib code must be compiled in CommonJS format to support any Node.js environment
export default defineConfig({
    input: 'src/main/index.js',
    output: {
        file: 'dist/index.cjs',
        format: 'umd',
        name: 'yadwjs'
    },
    plugins: [resolve(), commonjs(), terser()],
    external: [/node_modules/],
});
