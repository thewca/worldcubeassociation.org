const environment = require('./environment')

module.exports = Object.assign({}, environment.toWebpackConfig(), {
  devtool: 'none'
});
