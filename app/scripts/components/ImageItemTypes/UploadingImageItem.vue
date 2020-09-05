<template>
    <div class="images__list-item">
        <div class="images__img-item">
            <p class="images__img-item__title">
                Uploading:
            </p>
            <img
                class="images__list-item__img--src"
                :src="imgData"
            >
        </div>
        <div class="images__list-item__info">
            <p>Uploading</p>
            <p>upload: {{ percent }}</p>
        </div>
    </div>
</template>
<script>
import prettyBytes from 'pretty-bytes';

export default {
    name: 'Uploading',
    props: {
        uploading: {
            required: true,
            type: Boolean,
        },
        size: {
            type: Number,
            required: true,
        },
        imgData: {
            default: '',
            type: String,
        },
        upProgress: {
            default: 0,
            type: Number,
        },
    },
    computed: {
        percent() {
            const bytes = prettyBytes(this.size);
            const percent = Math.round(this.upProgress * 100);
            return `${percent}% of ${bytes}`;
        },
    },
    mounted() {
        this.$el.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest',
        });
    },
};
</script>
