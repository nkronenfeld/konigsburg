const path = require('path');
const webpack = require('webpack');
module.exports = {
  entry: {
    app: './web/js/main.js',
  },
  output: {
    path: path.resolve(__dirname, 'web/dist'),
    filename: 'bundle.js',
  },
  stats: {
    colors: true
  },
  devtool: 'source-map'
};
