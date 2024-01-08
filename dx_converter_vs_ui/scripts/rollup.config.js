import html from './plugin-html';
import lwc from '@lwc/rollup-plugin';
import path from 'path';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

import copy from 'rollup-plugin-copy-glob';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

const input = path.join(process.cwd(), 'src', 'index.js');
const outputDir = path.resolve(process.cwd(), 'dist');
const ASSETS = [{ files: 'src/resources/**', dest: 'dist/resources/' }];

module.exports = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isWatch = process.env.ROLLUP_WATCH;
  return {
    input,
    output: {
      file: path.join(outputDir, 'index.js'),
      format: 'esm'
    },
    plugins: [
      html(),
      nodeResolve(),
      lwc({
        rootDir: 'src/modules',
        modules: [
          { npm: 'lightning-base-components' }
        ],
        enableDynamicComponents:true,
        enableLwcSpread:true
      }),
      commonjs(),
      replace({
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }),
      copy(ASSETS, { watch: false }),
      isProduction && terser(),
      isWatch && serve('dist'),
      isWatch && livereload('dist')
    ],
    watch: {
      exclude: ['node_modules/**']
    }
  };
};
