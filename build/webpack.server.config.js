const webpack = require('webpack')
const { merge } = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin')
const baseConfig = require('./webpack.base.config.js')

module.exports = merge(baseConfig, {
  target: 'node',
  mode: 'production',
  entry: require('path').resolve(__dirname, '../src/server-entry.js'),
  devtool: 'source-map',
  output: {
    filename: 'server-bundle.js',
    libraryTarget: 'commonjs2'
  },
  externals: nodeExternals({
    allowlist: /\.css$/
  }),
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV || 'development'
      ),
      'process.env.VUE_ENV': '"server"'
    }),
    new VueSSRServerPlugin(),
    new webpack.optimize.LimitChunkCountPlugin({
      // 解决 mini-css-extract-plugin 静态化 render route 时 document is not defined 问题
      maxChunks: 1
    })
  ]
})

