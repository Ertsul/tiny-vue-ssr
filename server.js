const fs = require('fs')
const { resolve } = require('path')
const express = require('express')
const { createBundleRenderer } = require('vue-server-renderer')
const app = express()

const serve = (path, cache) =>
  express.static(resolve(path), {
    maxAge: 0
  })

const isProd = process.env.NODE_ENV === 'production'
const resolvePath = (str) => resolve(__dirname, str)
const templatePath = resolvePath('./src/template.index.html')
const createHtml = (renderer, context) =>
  new Promise((resolve, reject) => {
    renderer.renderToString(context, (err, html) => {
      if (err) {
        return reject(err)
      }
      resolve(html)
    })
  })

let renderer = null
if (isProd) {
  const serverBundle = require('./dist/vue-ssr-server-bundle.json')
  const clientManifest = require('./dist/vue-ssr-client-manifest.json')
  const template = fs.readFileSync(templatePath, {
    encoding: 'utf-8'
  })

  renderer = createBundleRenderer(serverBundle, {
    runInNewContext: false,
    clientManifest,
    template
  })
} else {
  require('./build/setup-dev-server.js')(
    app,
    templatePath,
    (bundle, options) => {
      renderer = createBundleRenderer(bundle, options)
    }
  )
}

app
  .use('/dist', serve('./dist', true))
  .get('*', async (req, res) => {
    try {
      if (req.path === '/favicon.ico') {
        return
      }
      const context = {
        title: 'My mini vue ssr project.',
        url: req.url
      }
      const html = await createHtml(renderer, context)
      res.send(html)
    } catch (error) {
      console.error('>> res :', error)
    }
  })
  .listen(8080, () => {
    console.log(`服务器地址: localhost:8080`)
  })

