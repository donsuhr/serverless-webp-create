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
                Deleting...
            </p>
        </div>
    </div>
</template>
<script>
import prettyBytes from 'pretty-bytes';
import config from 'config';

export default {
    name: 'Deleting',
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
    methods: {
        formatBytes(bytes) {
            return bytes ? prettyBytes(bytes) : '';
        },
        generateImgUrl(key) {
            return `${config.AWS.s3Prefix}/${key}`;
        },
    },
};
</script>
