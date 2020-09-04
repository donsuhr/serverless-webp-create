function create({ authService, db, imagesStoreKey }) {
    return {
        namespaced: true,
        state: {
            items: [],
            loading: false,
        },
        mutations: {
            setLoading(state, loading) {
                state.loading = loading;
            },
            childAddOrChange(state, data) {
                const index = state.items.findIndex((x) => x.Key === data.Key);
                if (index !== -1) {
                    const newItem = {
                        ...data,
                    };
                    state.items = [
                        ...state.items.slice(0, index),
                        newItem,
                        ...state.items.slice(index + 1),
                    ];
                } else {
                    state.items = [...state.items, data];
                }
            },
            childRemoved(state, data) {
                const index = state.items.findIndex((x) => x.Key === data.Key);
                if (index !== -1) {
                    state.items = [
                        ...state.items.slice(0, index),
                        ...state.items.slice(index + 1),
                    ];
                }
            },
        },
        actions: {
            childAddOrChange(context, data) {
                context.commit('childAddOrChange', data);
                context.dispatch(`${imagesStoreKey}/logUpdateItem`, data.Key, {
                    root: true,
                });
            },
            childRemoved(context, data) {
                context.commit('childRemoved', data);
            },
        },
        getters: {
            loading: (state) => state.loading,
            items: (state) => state.items,
            itemByKey: (state) => (Key) => state.items.find((x) => x.Key === Key),
        },
    };
}

function addListeners({
    store, authService, fbService, keyPrefix,
}) {
    const ref = fbService.db.ref('videos');

    const onChildAddedOrChanged = (data) => {
        store.dispatch(`${keyPrefix}/childAddOrChange`, data.val());
    };
    const onChildRemoved = (data) => {
        store.dispatch(`${keyPrefix}/childRemoved`, data.val());
    };
    fbService.auth.onAuthStateChanged((user) => {
        if (user) {
            ref.on('child_added', onChildAddedOrChanged);
            ref.on('child_changed', onChildAddedOrChanged);
            ref.on('child_removed', onChildRemoved);
        } else {
            ref.off('child_added', onChildAddedOrChanged);
            ref.off('child_changed', onChildAddedOrChanged);
            ref.off('child_removed', onChildRemoved);
        }
    });
}

export { create, addListeners };
