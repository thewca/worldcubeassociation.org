const webpackConfig = require('./serverClientOrBoth');

const productionEnvOnly = (_clientWebpackConfig, _serverWebpackConfig) => {
  // place any code here that is for production only
  // eslint-disable-next-line no-param-reassign
  _clientWebpackConfig.output.publicPath = `${process.env.SHAKAPACKER_ASSET_HOST}/${process.env.BUILD_TAG}/packs/`;
};

module.exports = webpackConfig(productionEnvOnly);
