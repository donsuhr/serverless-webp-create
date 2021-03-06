import config from 'config';
import { parseJSON, checkStatus } from 'fetch-json-helpers';
import futch from '../util/futch';

function sortByKey(a, b) {
    const x = a.Key.toLowerCase();
    const y = b.Key.toLowerCase();
    // eslint-disable-next-line no-nested-ternary
    return x < y ? -1 : x > y ? 1 : 0;
}

const defaultItemProps = {
    uploading: false,
    data: null,
    progress: 0,
    deleting: false,
    processPending: false,
    didProcess: false,
};

function correctHeaderCase(headObj) {
    // .png : ['pngSpeed', 'strip', 'pngQ', 'pngLossless'],
    // .jpg : ['progressive', 'jpgQ', 'jpgLossless'],
    // .gif : ['interlaced', 'optimizationLevel', 'gifQ', 'gifLossless'],
    // .avif: ['avifSpeed', 'avifLossless', 'avifMinQ', 'avifMaxQ'
    // .webp: ['webpQ', 'webpLossless'];
    const correctCase = {
        optimizationlevel: 'optimizationLevel',
        pngspeed: 'pngSpeed',
        pngq: 'pngQ',
        pnglossless: 'pngLossless',
        jpgq: 'jpgQ',
        jpglossless: 'jpgLossless',
        gifq: 'gifQ',
        giflossless: 'gifLossless',
        avifspeed: 'avifSpeed',
        avifLossless: 'avifLossless',
        avifminq: 'avifMinQ',
        avifmaxq: 'avifMaxQ',
        webpq: 'webpQ',
        webplossless: 'webpLossless',
    };
    return Object.keys(headObj).reduce((acc, x) => {
        if (Object.hasOwnProperty.call(correctCase, x)) {
            acc[correctCase[x]] = headObj[x];
        } else {
            acc[x] = headObj[x];
        }
        return acc;
    }, {});
}

function create() {
    return {
        namespaced: true,
        state: {
            srcItems: [],
            loading: false,
        },
        mutations: {
            setSrcItems(state, items) {
                state.srcItems = items;
            },
            setLoading(state, loading) {
                state.loading = loading;
            },
            setUploadProgress(state, data) {
                const { Key, progress } = data;
                const index = state.srcItems.findIndex((x) => x.Key === Key);
                if (index !== -1) {
                    const newItem = {
                        ...state.srcItems[index],
                        progress,
                    };
                    state.srcItems = [
                        ...state.srcItems.slice(0, index),
                        newItem,
                        ...state.srcItems.slice(index + 1),
                    ];
                }
            },
            setUploadState(state, data) {
                const { Key, uploading, processPending } = data;
                const index = state.srcItems.findIndex((x) => x.Key === Key);
                if (index !== -1) {
                    const newItem = {
                        ...state.srcItems[index],
                        uploading,
                        processPending,
                    };
                    state.srcItems = [
                        ...state.srcItems.slice(0, index),
                        newItem,
                        ...state.srcItems.slice(index + 1),
                    ];
                }
            },
            setProcessingData(state, data) {
                const index = state.srcItems.findIndex((x) => x.Key === data.Key);
                if (index !== -1) {
                    const currentItem = state.srcItems[index];
                    const newItem = {
                        ...currentItem,
                        logStoreItem: data,
                    };
                    if (currentItem.processPending && !data.transcoding) {
                        newItem.didProcess = true;
                        newItem.processPending = false;
                    }
                    const optKey = currentItem.Key.replace(
                        'src/',
                        'optimized/',
                    );
                    const ext = currentItem.Key.substring(
                        currentItem.Key.lastIndexOf('.'),
                    );
                    if (!newItem?.optimized) {
                        newItem.optimized = {
                            Key: optKey,
                        };
                    }
                    if (!newItem?.webp) {
                        newItem.webp = {
                            Key: optKey.replace(ext, '.webp'),
                        };
                    }
                    if (!newItem?.avif) {
                        newItem.avif = {
                            Key: optKey.replace(ext, '.avif'),
                        };
                    }
                    if (!data.transcoding) {
                        newItem.optimized.Size = data.imageminFileSize;
                        newItem.webp.Size = data.webpFileSize;
                        newItem.avif.Size = data.avifFileSize;
                    }
                    state.srcItems = [
                        ...state.srcItems.slice(0, index),
                        newItem,
                        ...state.srcItems.slice(index + 1),
                    ];
                }
            },

            setItemUploading(state, newItem) {
                const index = state.srcItems.findIndex(
                    (x) => x.Key === newItem.Key,
                );
                if (index !== -1) {
                    state.srcItems = [
                        ...state.srcItems.slice(0, index),
                        newItem,
                        ...state.srcItems.slice(index + 1),
                    ];
                } else {
                    state.srcItems = [...state.srcItems, newItem].sort(
                        sortByKey,
                    );
                }
            },
            deletedItem(state, key) {
                const index = state.srcItems.findIndex((x) => x.Key === key);
                state.srcItems = [
                    ...state.srcItems.slice(0, index),
                    ...state.srcItems.slice(index + 1),
                ];
            },
            deletingItem(state, key) {
                const index = state.srcItems.findIndex((x) => x.Key === key);
                if (index !== -1) {
                    const newItem = {
                        ...state.srcItems[index],
                        deleting: true,
                    };
                    state.srcItems = [
                        ...state.srcItems.slice(0, index),
                        newItem,
                        ...state.srcItems.slice(index + 1),
                    ];
                }
            },
            updatingItem(state, { key, data }) {
                const index = state.srcItems.findIndex((x) => x.Key === key);
                if (index !== -1) {
                    const Metadata = Object.keys(data).reduce((acc, x) => {
                        acc[x] = String(data[x]);
                        return acc;
                    }, {});
                    const newItem = {
                        ...state.srcItems[index],
                        processPending: true,
                        head: {
                            Metadata,
                        },
                    };
                    state.srcItems = [
                        ...state.srcItems.slice(0, index),
                        newItem,
                        ...state.srcItems.slice(index + 1),
                    ];
                }
            },
        },
        actions: {
            async loadItems({ commit, rootGetters }) {
                commit('setLoading', true);
                const url = `${config.AWS.apiGatewayUrl}/images`;
                const data = await fetch(url, {
                    headers: new Headers({
                        'Content-Type': 'application/json',
                    }),
                })
                    .then(checkStatus)
                    .then(parseJSON);
                const filtered = data.items.filter((x) =>
                    x.Key.startsWith('src/'));
                const sorted = filtered.sort(sortByKey);
                const mapped = sorted.map((x) => {
                    const optKey = x.Key.replace('src/', 'optimized/');
                    const ext = x.Key.substring(x.Key.lastIndexOf('.'));
                    const webpKey = optKey.replace(ext, '.webp');
                    const avifKey = optKey.replace(ext, '.avif');
                    x.head.Metadata = correctHeaderCase(x.head.Metadata);
                    return {
                        ...defaultItemProps,
                        ...x,
                        logStoreItem: rootGetters['log/itemByKey'](x.Key),
                        optimized: data.items.find(
                            (y) => y.Key === optKey && y.Key.endsWith(ext),
                        ),
                        webp: data.items.find((y) => y.Key === webpKey),
                        avif: data.items.find((y) => y.Key === avifKey),
                    };
                });
                commit('setSrcItems', mapped);
                commit('setLoading', false);
            },

            uploadItem({
                commit, state, rooState, rootGetters,
            }, file) {
                const newKey = `src/${file.name}`;
                const item = state.srcItems.find((x) => x.Key === newKey);
                const newItem = {
                    ...defaultItemProps,
                    ...item,
                    Size: file.size,
                    Key: newKey,
                    uploading: true,
                    logStoreItem: rootGetters['log/itemByKey'](newKey) || {},
                };

                const reader = new FileReader();
                const onReaderLoad = () => {
                    newItem.data = reader.result;
                    reader.removeEventListener('load', onReaderLoad);
                };
                reader.addEventListener('load', onReaderLoad);
                reader.readAsDataURL(file);

                commit('setItemUploading', newItem);
                const url = `${config.AWS.apiGatewayUrl}/images`;

                const onProgress = (event) => {
                    commit('setUploadProgress', {
                        Key: newKey,
                        progress: event.loaded / event.total,
                    });
                };

                const body = new FormData();
                body.append('upload', file);

                futch(
                    url,
                    {
                        method: 'POST',
                        body,
                        'Content-Type': 'multipart/form-data',
                        headers: {
                            Debug: 'postImage:upload',
                        },
                    },
                    onProgress,
                )
                    .then(() => {
                        commit('setUploadState', {
                            Key: newKey,
                            uploading: false,
                            processPending: true,
                        });
                    })
                    .catch((err) => {
                        // eslint-disable-next-line no-console
                        console.log('uploadItem futch error', err);
                    });
            },
            logUpdateItem(context, key) {
                const logStoreItem = context.rootGetters['log/itemByKey'](key);
                context.commit('setProcessingData', logStoreItem);
            },
            async deleteItem(context, key) {
                context.commit('setLoading', true);
                context.commit('deletingItem', key);
                const url = `${
                    config.AWS.apiGatewayUrl
                }/images/${encodeURIComponent(key)}`;
                await fetch(url, {
                    method: 'delete',
                })
                    .then(checkStatus)
                    .then(parseJSON);
                context.commit('deletedItem', key);
                context.commit('setLoading', false);
            },
            async updateItem(context, { key, data }) {
                context.commit('setLoading', true);
                context.commit('updatingItem', { key, data });
                const url = `${
                    config.AWS.apiGatewayUrl
                }/images/${encodeURIComponent(key)}`;
                await fetch(url, {
                    method: 'post',
                    body: JSON.stringify(data),
                    headers: {
                        Debug: 'updateImageMeta:event updateImageMeta:update',
                    },
                })
                    .then(checkStatus)
                    .then(parseJSON);
                context.commit('setLoading', false);
            },
        },
        getters: {
            loading: (state) => state.loading,
            srcItems: (state) => state.srcItems,
            itemByKey: (state) => (Key) => state.srcItems.find((x) => x.Key === Key),
        },
    };
}

export { create };
