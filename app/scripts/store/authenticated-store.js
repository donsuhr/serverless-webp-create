function createAuthenticatedStore({ authService }) {
    return {
        namespaced: true,
        state: {
            isAuth0Auth: null,
            auth0Loading: false,
            fbAuthLoading: false,
            isFbAuth: null,
            fbKeyLoading: false,
        },
        mutations: {
            setAuth0Auth(state, authenticated) {
                state.isAuth0Auth = authenticated;
            },
            setAuth0Loading(state, loading) {
                state.auth0Loading = loading;
            },
            setFbAuthLoading(state, loading) {
                state.fbAuthLoading = loading;
            },
            setFbAuth(state, authenticated) {
                state.isFbAuth = authenticated;
            },
            setFbKeyLoading(state, loading) {
                state.fbKeyLoading = loading;
            },
        },
        actions: {
            checkAuth({ commit, state, rootState }) {
                const isAuth0Auth = authService.isAuthenticated();
                commit('setAuth0Auth', isAuth0Auth);
            },
            setAuth0Auth({ commit, state, rootState }, isAuth) {
                commit('setAuth0Auth', isAuth);
            },
            setAuth0Loading({ commit, state, rootState }, isLoading) {
                commit('setAuth0Loading', isLoading);
            },
            setFbAuthLoading({ commit, state, rootState }, isLoading) {
                commit('setFbAuthLoading', isLoading);
            },
            setFbAuth({ commit, state, rootState }, isAuth) {
                commit('setFbAuth', isAuth);
            },
        },
        getters: {
            auth0Loading: (state) => state.auth0Loading,
            isAuth0Auth: (state) => state.isAuth0Auth,
            isFbAuth: (state) => state.isFbAuth,
            fbKeyLoading: (state) => state.fbKeyLoading,
            loading: (state) =>
                state.auth0Loading || state.fbAuthLoading || state.fbKeyLoading,
            isAuth: (state) => !!state.isFbAuth && !!state.isAuth0Auth,
        },
    };
}

function addListeners({ store, authService, fbService }) {
    authService.emitter.on(authService.AUTH_CHANGE, (isAuth) => {
        store.dispatch('authenticated/setAuth0Auth', isAuth);
    });
    authService.emitter.on(authService.AUTH_LOADING, (isLoading) => {
        store.dispatch('authenticated/setAuth0Loading', isLoading);
    });
    authService.emitter.on(authService.FB_LOADING, (isLoading) => {
        store.commit('authenticated/setFbKeyLoading', isLoading);
    });
    fbService.emitter.on(fbService.FB_LOADING, (isLoading) => {
        store.dispatch('authenticated/setFbAuthLoading', isLoading);
    });
    fbService.auth.onAuthStateChanged((user) => {
        store.dispatch('authenticated/setFbAuth', !!user);
    });
    store.dispatch('authenticated/setFbAuthLoading', fbService.loading);
    store.dispatch('authenticated/setAuth0Loading', authService.isLoading());
    store.dispatch('authenticated/checkAuth');
}

export { createAuthenticatedStore, addListeners };
