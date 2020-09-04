<template>
    <section
        class="images"
        @drop.prevent="ondrop"
        @dragover.prevent="ondragover"
    >
        <h3>Images</h3>
        images/loading:
        <div
            v-if="loading"
            class="loading"
        >
            Loading...
        </div>
        <div
            v-if="!loading"
            class="loading"
        >
            Not Loading...
        </div>
        <ul class="images__list">
            <li
                v-for="item in srcItems"
                :key="item.Key"
            >
                <p class="images__list-item__title">
                    {{ item.Key }}
                </p>
                <component
                    :is="mode(item)"
                    v-bind="props(mode(item), item)"
                />
            </li>
        </ul>
    </section>
</template>
<script>
import BaseImageItem from './ImageItemTypes/BaseImageItem';
import UploadingImageItem from './ImageItemTypes/UploadingImageItem';
import DeletingImageItem from './ImageItemTypes/DeletingImageItem';
import ProcessingImageItem from './ImageItemTypes/ProcessingImageItem';
import ProcessingPendingImageItem from './ImageItemTypes/ProcessingPendingImageItem';

export default {
    name: 'ImageListSection',
    computed: {
        loading() {
            return this.$store.getters['images/loading'];
        },
        srcItems() {
            return this.$store.getters['images/srcItems'];
        },
    },
    mounted() {
        this.$store.dispatch('images/loadItems');
    },
    methods: {
        mode(item) {
            if (item.uploading) {
                return UploadingImageItem;
            }
            if (item.deleting) {
                return DeletingImageItem;
            }
            if (item.logStoreItem && item.logStoreItem.transcoding) {
                return ProcessingImageItem;
            }
            if (item.processPending) {
                return ProcessingPendingImageItem;
            }
            return BaseImageItem;
        },
        props(mode, item) {
            const transform = {
                s3Key: 'Key',
                logStoreItem: 'logStoreItem',
                optimised: 'optimised',
                webp: 'webp',
                uploading: 'uploading',
                imgData: 'data',
                upProgress: 'progress',
                transcoding: 'transcoding',
                didProcess: 'didProcess',
                size: 'Size',
            };
            return Object.keys(mode.props).reduce((acc, x) => {
                if (x === 'metadata' && item.head) {
                    acc.metadata = item.head.Metadata;
                } else {
                    acc[x] = item[transform[x]];
                }
                return acc;
            }, {});
        },
        ondragover() {
            // needed to stop browser from opening the file on drop
            // using the .prevent
        },
        ondrop(event) {
            for (let i = 0; i < event.dataTransfer.items.length; i += 1) {
                this.$store.dispatch(
                    'images/uploadItem',
                    event.dataTransfer.items[i].getAsFile(),
                );
            }
        },
    },
};
</script>
