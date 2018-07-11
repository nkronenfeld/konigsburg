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
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2015']
          }
        }
      }
    ]
},
  stats: {
    colors: true
  },
  devtool: 'source-map'
};
