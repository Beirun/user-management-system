import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { configureFakeBackend } from './_helpers/fake-backend';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'

const app = createApp(App)

configureFakeBackend();


const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)

app.mount('#app')
