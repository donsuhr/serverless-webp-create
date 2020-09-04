<template>
    <div
        class="zoomer"
        :hidden="!showing"
    >
        <TwentyTwenty
            v-if="beforeUrl"
            ref="twentytwenty"
            offset="0.7"
            :before="beforeUrl"
            before-label="Original"
            :after="compareImgUrl"
            :after-label="afterLabel"
        />
        <button
            ref="foo"
            type="button"
            class="zoomer__close-btn"
            @click.prevent="onCloseClicked"
        >
            Close
        </button>
    </div>
</template>

<script>
import 'vue-twentytwenty/dist/vue-twentytwenty.css';
import TwentyTwenty from 'vue-twentytwenty';

export default {
    name: 'ImageCompare',
    components: {
        TwentyTwenty,
    },
    data() {
        return {
            willOpen: false,
        };
    },
    computed: {
        beforeUrl() {
            return this.$store.getters['ui/zoom'].beforeUrl;
        },
        compareImgUrl() {
            return this.$store.getters['ui/zoom'].compareImgUrl;
        },
        afterLabel() {
            return this.$store.getters['ui/zoom'].afterLabel;
        },
        showing() {
            return this.$store.getters['ui/zoom'].showing;
        },
    },
    watch: {
        showing(newVal, oldVal) {
            if (!oldVal && newVal) {
                this.willOpen = true;
            } else {
                window.removeEventListener('keyup', this.onEscapePressed);
            }
        },
    },
    updated() {
        if (this.willOpen) {
            this.$nextTick(() => {
                this.$refs.twentytwenty.resize();
                window.addEventListener('keyup', this.onEscapePressed);
                this.willOpen = false;
                setTimeout(() => {
                    this.$refs.twentytwenty.resize();
                }, 300);
            });
        }
    },
    destroyed() {
        window.removeEventListener('keyup', this.onEscapePressed);
    },
    methods: {
        onCloseClicked() {
            this.$store.dispatch('ui/closeZoom');
        },
        onEscapePressed(event) {
            if (event.key === 'Escape') {
                this.$store.dispatch('ui/closeZoom');
            }
        },
    },
};
</script>
