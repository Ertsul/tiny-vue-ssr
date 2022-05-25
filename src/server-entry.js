import { createApp } from './app'

const isProd = process.env.NODE_EVN === 'production'

export default (context) => {
  return new Promise((resolve, reject) => {
    const { app, router, store } = createApp()

    router.push(context.url)

    router.onReady(() => {
      const matchedComponents = router.getMatchedComponents()
      if (!matchedComponents.length) {
        return reject({ code: 404 })
      }
      Promise.all(
        matchedComponents.map(
          ({ asyncData }) =>
            asyncData &&
            asyncData({
              store,
              route: router.currentRoute
            })
        )
      )
        .then(() => {
          // !isProd && console.log(`data pre-fetch: ${Date.now() - s}ms`)
          context.state = store.state // context.state 在 client 自动序列化为 window.__INITIAL_STATE__
          resolve(app)
        })
        .catch(reject)
    }, reject)
  })
}

