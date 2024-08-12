const webpackConfig = require('./serverClientOrBoth');

const productionEnvOnly = (_clientWebpackConfig, _serverWebpackConfig) => {
  // place any code here that is for production only
  _clientWebpackConfig.config.set('output.publicPath', `${process.env.BUILD_TAG}/packs`);
};

module.exports = webpackConfig(productionEnvOnly);
