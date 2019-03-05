function create() {
    return {
        namespaced: true,
        state: {
            zoom: {
                beforeUrl: '',
                compareImgUrl: '',
                afterLabel: '',
                showing: false,
            },
        },
        mutations: {
            setZoom(state, zoom) {
                state.zoom = zoom;
            },
        },
        actions: {
            updateZoom(context, zoom) {
                context.commit('setZoom', {
                    ...zoom,
                    showing: true,
                });
            },
            closeZoom(context) {
                context.commit('setZoom', {
                    ...context.state.zoom,
                    showing: false,
                });
            },
        },
        getters: {
            zoom: state => state.zoom,
        },
    };
}

export { create };
