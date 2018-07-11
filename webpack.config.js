const path = require('path');
const webpack = require('webpack');
module.exports = {
  context: path.resolve('.', 'web/js'),
  entry: {
    app: './main.js',
  },
  output: {
    path: path.resolve('.', 'dist'),
    filename: 'app.bundle.js',
  },
};
