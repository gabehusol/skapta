import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createAuth0, authGuard } from '@auth0/auth0-vue'
import App from './App.vue'
import DashboardView from './DashboardView.vue'
import './index.css'

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID

if (!domain || !clientId) {
  throw new Error('Missing Auth0 environment variables. Check your .env file.')
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    // authGuard waits for Auth0 to finish loading before redirecting — never call
    // loginWithRedirect() during render (causes a redirect loop).
    { path: '/dashboard', component: DashboardView, beforeEnter: authGuard },
  ],
})

createApp(App)
  .use(router)
  .use(
    createAuth0({
      domain,
      clientId,
      authorizationParams: {
        redirect_uri: window.location.origin + '/dashboard',
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      },
    }),
  )
  .mount('#app')
