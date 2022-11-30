var path = require('path');

var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    index : './dist/index.js',
    viewer: './dist/viewer.js',
    modeler: './dist/modeler.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: __dirname + '/dist'
  },
  module: {
    rules: [
      {
        test: /\.bpmn$/,
        use: {
          loader: 'raw-loader'
        }
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns:[
      { from: './node_modules/diagram-js/assets/diagram-js.css', to: './css' },
      { from: './node_modules/bpmn-font/dist/css/bpmn-embedded.css', to: './css' },
      { from: './assets/fonts/*', to: './fonts'},
      { from: './assets/css/*',  to: './css'}
    ]})
  ],
  target : 'node'
};