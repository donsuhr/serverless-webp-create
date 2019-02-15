import Vue from 'vue';
import Vuex from 'vuex';
import { createAuthenticatedStore, addListeners } from './authenticated-store';
import {
    create as createLogStore,
    addListeners as addLogListeners,
} from './log-store';
import { create as createImagesStore } from './s3-list-store';

Vue.use(Vuex);

const imagesStoreKey = 'images';
const logStoreKey = 'log';

export default function createStore({ authService, fbService }) {
    const authenticatedStore = createAuthenticatedStore({ authService });
    const logStore = createLogStore({ authService, fbService, imagesStoreKey });
    const imagesStore = createImagesStore();
    const store = new Vuex.Store({
        modules: {
            authenticated: authenticatedStore,
            [logStoreKey]: logStore,
            [imagesStoreKey]: imagesStore,
        },
    });
    addListeners({ store, authService, fbService });
    addLogListeners({
        store, authService, fbService, keyPrefix: logStoreKey,
    });
    return store;
}
