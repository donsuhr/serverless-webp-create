import Vue from 'vue';
import createStore from './store';
import createRouter from './router';
import App from './App';
import * as authService from './service/auth-service';
import { create as createFirebase } from './service/firebase-service';

import '../styles/main.scss';

const el = '#app';

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
    render: h => h(App, {}),
});

// book-transcode1@donsuhr.com
// test
