const { VueLoaderPlugin } = require('vue-loader')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const path = require('path')

const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  devtool: isProd ? false : '#cheap-module-source-map',
  output: {
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/dist/',
    chunkFilename: 'common/[name].[chunkhash:8].js',
    filename: 'common/[name].[chunkhash].js'
  },
  resolve: {
    extensions: ['.js', '.json', '.vue', '.scss', '.css'],
    alias: {
      '@': path.resolve(__dirname, '..', 'src')
    }
  },
  optimization: {
    minimize: isProd,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: {
            warnings: false,
            drop_console: isProd, // Pass true to discard calls to console.* functions
            drop_debugger: isProd // Pass true to remove debugger; statements
          },
          output: {
            comments: false
          }
        },
        extractComments: false
      })
    ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: ['@babel/preset-env'],
          plugins: [
            '@babel/plugin-transform-runtime',
            '@babel/plugin-transform-modules-commonjs'
          ]
        }
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.(c|sa|sc)ss$/,
        use: [
          !isProd ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { minimize: isProd }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {}
            }
          },
          {
            loader: 'sass-loader'
          }
        ]
      }
    ]
  },
  plugins: isProd
    ? [
        new MiniCssExtractPlugin({
          filename: 'common/[name].[contenthash:8].css',
          ignoreOrder: true
        }),
        new VueLoaderPlugin()
      ]
    : [new VueLoaderPlugin()]
}

