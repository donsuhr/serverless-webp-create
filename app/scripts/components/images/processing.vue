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
        <div class="images__list-item__info">
            <p>
                Processing...
            </p>
        </div>
    </div>
</template>
<script>
import prettyBytes from 'pretty-bytes';
import config from 'config';

export default {
    name: 'Processing',
    props: {
        size: {
            type: Number,
            required: true,
        },
        s3Key: {
            type: String,
            required: true,
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
        formatBytes(bytes) {
            return bytes ? prettyBytes(bytes) : '';
        },
        generateImgUrl(key) {
            return `${config.AWS.s3Prefix}/${key}?${this.ts}`;
        },
    },
};
</script>
