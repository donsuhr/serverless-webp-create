import Vue from 'vue';
import Vuex from 'vuex';
import { createAuthenticatedStore, addListeners } from './authenticated-store';
import {
    create as createLogStore,
    addListeners as addLogListeners,
} from './log-store';
import { create as createImagesStore } from './s3-list-store';
import { create as createUiStore } from './ui-store';

Vue.use(Vuex);

const imagesStoreKey = 'images';
const logStoreKey = 'log';

export default function createStore({ authService, fbService }) {
    const authenticatedStore = createAuthenticatedStore({ authService });
    const logStore = createLogStore({ authService, fbService, imagesStoreKey });
    const imagesStore = createImagesStore();
    const uiStore = createUiStore();
    const store = new Vuex.Store({
        modules: {
            ui: uiStore,
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
