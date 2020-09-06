import Vue from 'vue';
import { SliderPlugin } from '@syncfusion/ej2-vue-inputs';
import createStore from './store';
import createRouter from './router';
import App from './App';
import * as authService from './service/auth-service';
import { create as createFirebase } from './service/firebase-service';

import '../styles/main.scss';
import '@syncfusion/ej2-vue-inputs/styles/material.css';

const el = '#app';
Vue.use(SliderPlugin);

const router = createRouter({ authService });
const fbService = createFirebase({ authService });
const store = createStore({
    authService,
    router,
    fbService,
});

// eslint-disable-next-line  no-new
new Vue({
    el,
    store,
    router,
    render: (h) => h(App, {}),
});
