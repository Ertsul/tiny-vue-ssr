const webpack = require('webpack')
const MFS = require('memory-fs')
const fs = require('fs')
const chokidar = require('chokidar')

const readFile = (fs, file, outputPath) => {
  try {
    return fs.readFileSync(require('path').join(outputPath, file), 'utf-8')
  } catch (err) {
    console.error(err)
  }
}

function createClientWebpackConfig() {
  const clientWebpackConfig = require('./webpack.client.config.js')
  clientWebpackConfig.mode = 'development'
  clientWebpackConfig.output.filename = '[name].js'
  // 设置 webpack-hot-middleware
  clientWebpackConfig.entry.app = [
    'webpack-hot-middleware/client',
    clientWebpackConfig.entry.app
  ]
  clientWebpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin())
  if (!('optimization' in clientWebpackConfig)) {
    clientWebpackConfig.optimization = {}
  }
  clientWebpackConfig.optimization.noEmitOnErrors = true

  return clientWebpackConfig
}

function createServerWebpackConfig() {
  const serverWebpackConfig = require('./webpack.server.config.js')
  serverWebpackConfig.mode = 'development'
  return serverWebpackConfig
}

module.exports = async function setupDevServer(app, templatePath, cb) {
  try {
    let bundle
    let template
    let clientManifest
    let ready
    const readyPromise = new Promise((r) => {
      ready = r
    })
    const update = () => {
      if (bundle && clientManifest) {
        ready()
        cb(bundle, {
          template,
          clientManifest
        })
      }
    }

    template = fs.readFileSync(templatePath, 'utf-8')
    chokidar.watch(templatePath).on('change', () => {
      template = fs.readFileSync(templatePath, 'utf-8')
      console.log('index.html template updated.')
      update()
    })

    // 初始化 client webpack
    const clientWebpackConfig = createClientWebpackConfig()
    const outputPath = clientWebpackConfig.output.path
    const clientCompiler = webpack(clientWebpackConfig)
    const devMiddleware = require('webpack-dev-middleware')(clientCompiler, {
      publicPath: clientWebpackConfig.output.publicPath
      // noInfo: true
    })
    app
      .use(devMiddleware) // 使用 webpack-dev-middleware 中间件
      .use(
        // 使用 webpack-hot-middleware 中间件
        require('webpack-hot-middleware')(clientCompiler, {
          heartbeat: 5000
        })
      )
    clientCompiler.hooks.done.tap('done', (stats) => {
      stats = stats.toJson()
      stats.errors.forEach((err) => console.error(err))
      stats.warnings.forEach((err) => console.warn(err))
      if (stats.errors.length) return
      clientManifest = JSON.parse(
        readFile(
          devMiddleware.context.outputFileSystem,
          'vue-ssr-client-manifest.json',
          outputPath
        )
      )
      update()
    })

    // 初始化 server webpack
    const serverWebpackConfig = createServerWebpackConfig()
    const serverCompiler = webpack(serverWebpackConfig)
    const mfs = new MFS()
    serverCompiler.outputFileSystem = mfs
    serverCompiler.watch({}, (err, stats) => {
      if (err) throw err
      stats = stats.toJson()
      if (stats.errors.length) return
      bundle = JSON.parse(
        readFile(mfs, 'vue-ssr-server-bundle.json', outputPath)
      )
      update()
    })

    return readyPromise
  } catch (error) {
    console.error('>> setupDevServer error :', error)
  }
}

