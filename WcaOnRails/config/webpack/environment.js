const { environment } = require('@rails/webpacker')
const erb = require('./loaders/erb')

environment.loaders.append('erb', erb)
environment.splitChunks();
module.exports = environment
