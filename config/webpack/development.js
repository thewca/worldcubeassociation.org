const webpackConfig = require('./serverClientOrBoth');

const { inliningCss } = require('shakapacker');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const developmentEnvOnly = (_clientWebpackConfig, _serverWebpackConfig) => {
  // place any code here that is for dev only
  if (inliningCss) {
    _clientWebpackConfig.plugins.push(
      new ReactRefreshWebpackPlugin({
        overlay: {
          sockIntegration: 'wds',
        },
      }),
    );
  }
};

module.exports = webpackConfig(developmentEnvOnly);
