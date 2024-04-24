const webpackConfig = require('./serverClientOrBoth');

const developmentEnvOnly = (_clientWebpackConfig, _serverWebpackConfig) => {
  // place any code here that is for dev only
};

module.exports = webpackConfig(developmentEnvOnly);
