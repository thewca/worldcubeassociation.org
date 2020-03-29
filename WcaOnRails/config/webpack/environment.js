const { environment } = require('@rails/webpacker')
const erb = require('./loaders/erb')

const webpack = require('webpack');
environment.plugins.append('Provide', new webpack.ProvidePlugin({
  $: 'jquery/src/jquery',
  jQuery: 'jquery/src/jquery',
}));

environment.loaders.append('erb', erb)
environment.splitChunks();
module.exports = environment
