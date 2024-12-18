import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
  input: 'sidepanel/index.js', // Your entry file
  output: {
    file: 'dist/sidepanel.bundle.js', // Output bundle file
    format: 'iife', // Output format (e.g., 'cjs', 'esm', 'iife', 'umd')
    sourcemap: true, // Include sourcemaps for debugging
  },
  plugins: [
    resolve(), // Resolves Node.js modules
    commonjs(), // Converts CommonJS modules to ES modules
    terser(), // Minifies the output for production
  ],
};