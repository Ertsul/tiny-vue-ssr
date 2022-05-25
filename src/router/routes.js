export default [
  {
    path: '/',
    component: () => import(/* webpackChunkName: "Home" */ '../views/Home.vue')
  }
]

