const { environment } = require('@rails/webpacker')
const erb = require('./loaders/erb')

const webpack = require('webpack');
environment.plugins.append('Provide', new webpack.ProvidePlugin({
  $: 'jquery/src/jquery',
  jQuery: 'jquery/src/jquery',
}));

environment.loaders.append('erb', erb)
environment.splitChunks((config) => {
  return Object.assign({}, config, {
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
        }
      }
    },
  });
});
module.exports = environment
