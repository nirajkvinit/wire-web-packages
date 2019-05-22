const pkg = require('./package.json');
const webpack = require('webpack');

const projectName = pkg.name.replace('@wireapp/', '');

module.exports = {
  devtool: 'source-map',
  entry: {
    [projectName]: `${__dirname}/${pkg.main}`,
  },
  externals: {
    dexie: 'Dexie',
    'fs-extra': '{}',
  },
  mode: 'production',
  node: {
    fs: 'empty',
    path: 'empty',
  },
  output: {
    filename: '[name].bundle.js',
    library: 'StoreEngine',
    path: `${__dirname}/dist`,
    publicPath: '/',
  },
  plugins: [new webpack.BannerPlugin(`${pkg.name} v${pkg.version}`)],
};
