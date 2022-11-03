const { webpackConfig, merge } = require('shakapacker');
const webpack = require('webpack');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const path = require('path');

const smp = new SpeedMeasurePlugin();

const customConfig = smp.wrap({
  resolve: {
    extensions: [
      '.css', '.sass', '.scss', '.css', '.module.sass', '.module.scss', '.module.css',
      '.png', '.svg', '.gif', '.jpeg', '.jpg',
      '.ts', '.tsx',
    ],
    symlinks: false,
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
    new ForkTsCheckerWebpackPlugin(),
  ],
  module: {
    rules: [
      {
        test: require.resolve('jquery'),
        loader: 'expose-loader',
        options: {
          exposes: ['$', 'jQuery'],
        },
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        include: path.resolve(__dirname, '../../app/webpacker'),
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          // This force the extraction of react and react-dom to their own chunk.
          // It gives a chunk of 200KB, but it's used (or will be used) basically
          // everywhere on the website, so we need to force sharing this!
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'vendor',
          chunks: 'all',
        },
        jquery: {
          // This force the extraction of jquery.
          test: /[\\/]node_modules[\\/]jquery[\\/]/,
          name: 'jquery',
          chunks: 'all',
        },
        styles: {
          test: /\.(css|scss)$/,
          enforce: true,
        },
      },
    },
  },
  devtool: 'source-map',
});

module.exports = merge(webpackConfig, customConfig);
