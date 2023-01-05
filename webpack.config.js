/* eslint-env node */

const CopyWebpackPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');

const path = require('path');

const basePath = '.';

const absoluteBasePath = path.resolve(path.join(__dirname, basePath));

module.exports = (env, argv) => {

  const mode = argv.mode || 'development';

  const devtool = mode === 'development' ? 'eval-source-map' : 'source-map';

  return {
    mode,
    entry: {
      viewer: './example/viewer.js',
      modeler: './example/modeler.js'
    },
    output: {
      filename: '[name].bundle.js',
      path: __dirname + '/example'
    },
    module: {
      rules: [
        {test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              [ '@babel/plugin-transform-react-jsx', {
                'importSource': '@bpmn-io/properties-panel/preact',
                'runtime': 'automatic'
              } ]
            ]
          }
        }
      },
        {
          test: /\.bpmn$/,
          type: 'asset/source'
        },
          {
            test: /\.xml$/i,
            use: 'raw-loader',
          },
      ]
    },
    resolve: {
      mainFields: [
        'browser',
        'module',
        'main'
      ],
      alias: {
        'react': '@bpmn-io/properties-panel/preact/compat'
      },
      modules: [
        'node_modules',
        absoluteBasePath
      ]
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
         // { from: './assets', to: 'dist/vendor/bpmn-js-token-simulation/assets' },
          { from: 'bpmn-js/dist/assets', context: 'node_modules', to: 'dist/vendor/bpmn-js/assets' },
          { from: 'bpmn-js-properties-panel/dist/assets', context: 'node_modules', to: 'dist/vendor/bpmn-js-properties-panel/assets' }
        ]
      }),
      new DefinePlugin({
        'process.env.TOKEN_SIMULATION_VERSION': JSON.stringify(require('./package.json').version)
      })
    ],
    devtool
  };

};