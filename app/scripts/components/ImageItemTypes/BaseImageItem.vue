<template>
    <div class="images__list-item">
        <div class="images__img-item">
            <p class="images__img-item__title">
                Original: ({{ formatBytes(size) }})
            </p>
            <img
                class="images__list-item__img--src"
                :src="generateImgUrl(s3Key)"
            >
        </div>
        <div
            class="images__img-item"
            @click.prevent="onOptClick"
        >
            <p class="images__img-item__title">
                Optimized: ({{ formatBytes(optimized.Size) }})
            </p>
            <img
                class="images__list-item__img--opt"
                :src="generateImgUrl(optimized.Key)"
            >
            <img
                class="images__img-zoom-btn__img"
                src="img/mag.svg"
            >
        </div>

        <div
            v-if="shouldHaveWebP"
            class="images__img-item"
            @click.prevent="onWebpClick"
        >
            <p class="images__img-item__title">
                WebP: ({{ formatBytes(webp.Size) }})
            </p>
            <img
                class="images__list-item__img--webp"
                :src="generateImgUrl(webp.Key)"
            >
            <img
                class="images__img-zoom-btn__img"
                src="img/mag.svg"
            >
        </div>
        <div
            v-if="shouldHaveAvif"
            class="images__img-item"
            @click.prevent="onAvifClick"
        >
            <p class="images__img-item__title">
                Avif: ({{ formatBytes(avif.Size) }})
            </p>
            <img
                class="images__list-item__img--avif"
                :src="generateImgUrl(avif.Key)"
            >
            <img
                class="images__img-zoom-btn__img"
                src="img/mag.svg"
            >
        </div>
        <div class="images__list-item__info">
            <div v-if="logStoreItem">
                <p>updated: {{ formatDate(logStoreItem.updatedAt) }}</p>
                <p v-if="logStoreItem.error">
                    {{ logStoreItem.error }}
                </p>
            </div>
        </div>
        <div class="images__form-wrapper">
            <metadata-form
                :s3-key="s3Key"
                :metadata="metadata"
            />
            <button
                type="button"
                @click.prevent="onDeleteClicked(s3Key)"
            >
                Delete Image
            </button>
        </div>
    </div>
</template>

<script>
import config from 'config';
import { format } from 'date-fns';
import prettyBytes from 'pretty-bytes';
import MetadataForm from '../MetadataForm';

export default {
    name: 'Base',
    components: {
        MetadataForm,
    },
    props: {
        size: {
            type: Number,
            required: true,
        },
        s3Key: {
            type: String,
            required: true,
        },
        logStoreItem: {
            type: Object,
            default: () => ({
                updatedAt: '',
                Size: 0,
            }),
        },
        optimized: {
            type: Object,
            default: () => ({
                Key: '',
                Size: 0,
            }),
        },
        webp: {
            type: Object,
            default: () => ({
                Key: '',
                Size: 0,
            }),
        },
        avif: {
            type: Object,
            default: () => ({
                Key: '',
                Size: 0,
            }),
        },
        didProcess: {
            type: Boolean,
            default: false,
        },
        metadata: {
            type: Object,
            required: false,
            default: () => ({}),
        },
    },
    computed: {
        shouldHaveWebP() {
            const ext = this.s3Key.split('.').pop();
            return ext !== 'svg';
        },
        shouldHaveAvif() {
            const ext = this.s3Key.split('.').pop();
            const whitelist = ['jpg', 'png'];
            return whitelist.includes(ext);
        },
    },
    created() {
        this.setEpochSeconds();
    },
    beforeUpdate() {
        this.setEpochSeconds();
    },
    methods: {
        setEpochSeconds() {
            this.ts = Math.floor(new Date().getTime() / 1000);
        },
        generateImgUrl(key) {
            if (this.didProcess) {
                return `${config.AWS.s3Prefix}/${key}?${this.ts}`;
            }
            return `${config.AWS.s3Prefix}/${key}`;
        },
        formatDate(dateString) {
            const date = new Date(dateString);
            if (date instanceof Date && !Number.isNaN(Number(date))) {
                return format(date, 'yyyy-MM-dd hh:mma');
            }
            return '';
        },
        formatBytes(bytes) {
            return bytes ? prettyBytes(bytes) : '';
        },
        onDeleteClicked(key) {
            this.$store.dispatch('images/deleteItem', key);
        },
        onWebpClick() {
            this.$store.dispatch('ui/updateZoom', {
                beforeUrl: this.generateImgUrl(this.s3Key),
                compareImgUrl: this.generateImgUrl(this.webp.Key),
                afterLabel: 'WebP',
            });
        },
        onOptClick() {
            this.$store.dispatch('ui/updateZoom', {
                beforeUrl: this.generateImgUrl(this.s3Key),
                compareImgUrl: this.generateImgUrl(this.optimized.Key),
                afterLabel: 'Optimized',
            });
        },
        onAvifClick() {
            this.$store.dispatch('ui/updateZoom', {
                beforeUrl: this.generateImgUrl(this.s3Key),
                compareImgUrl: this.generateImgUrl(this.avif.Key),
                afterLabel: 'Optimized',
            });
        },
    },
};
</script>
