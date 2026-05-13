// Common configuration applying to client and server configuration
const { generateWebpackConfig, merge } = require('shakapacker');
const webpack = require('webpack');

const baseClientWebpackConfig = generateWebpackConfig();

const customConfig = {
  resolve: {
    extensions: ['.css', '.sass', '.scss', '.css', '.module.sass', '.module.scss', '.module.css', '.png', '.svg', '.gif', '.jpeg', '.jpg'],
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
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
  ignoreWarnings: [
    /Module not found: Error: Can't resolve 'react-dom\/client'/,
    // cf. https://github.com/Hacker0x01/react-datepicker/issues/6181
    /the request of a dependency is an expression/,
  ],
};

// Copy the object using merge b/c the baseClientWebpackConfig and commonOptions are mutable globals
const commonWebpackConfig = () => merge({}, baseClientWebpackConfig, customConfig);

module.exports = commonWebpackConfig;
