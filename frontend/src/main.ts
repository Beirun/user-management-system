import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { configureFakeBackend } from './_helpers/fake-backend';

import App from './App.vue'
import router from './router'

const app = createApp(App)
// configureFakeBackend();

app.use(createPinia())
app.use(router)

app.mount('#app')
