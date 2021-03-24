import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import externals from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';


export default {
    input: 'src/index.ts',
    preserveModules: true,
    treeshake: true,
    output: [
        {
            dir: 'lib/cjs',
            format: 'cjs',
            exports: 'named',
            sourcemap: true
        },
        {
            dir: 'lib/es',
            format: 'es',
            exports: 'named',
            sourcemap: true
        }
    ],
    plugins: [
        externals({
            includeDependencies: true
        }),
        resolve(),
        typescript(),
        babel({
            babelHelpers: 'runtime',
        }),
        commonjs()
    ]
}