<template>
    <fieldset>
        <legend>WebP</legend>
        <ul>
            <li class="images__img-form__field">
                <label
                    class="images__img-form__label"
                    :for="'webpQ-' + s3Key"
                > q </label>
                <input
                    :id="'webpQ-' + s3Key"
                    v-model="form.webpQ"
                    class="images__img-form__input"
                    type="number"
                    name="webpQ"
                    :placeholder="qPlaceholder"
                    min="0"
                    max="100"
                >
                <p class="images__img-form__field-info">
                    Default: 75
                    <br>
                    Specify the compression factor for RGB channels between 0
                    and 100.<br>
                    (0:small..100:big)
                </p>
            </li>
            <li class="images__img-form__field">
                <label
                    class="images__img-form__label"
                    :for="'webpLossless-' + s3Key"
                >
                    Lossless
                </label>
                <input
                    :id="'webpLossless-' + s3Key"
                    v-model="form.webpLossless"
                    class="images__img-form__input"
                    type="checkbox"
                    name="webpLossless"
                >
                <p class="images__img-form__field-info">
                    Encode the image without any loss.
                </p>
            </li>
        </ul>
    </fieldset>
</template>
<script>
const DEFAULT_Q = '75';

export default {
    name: 'WebpMetadataFieldset',
    props: {
        s3Key: {
            type: String,
            required: true,
        },
        webpQ: {
            type: String,
            required: false,
            default: null,
        },
        webpLossless: {
            type: String,
            required: false,
            default: null,
        },
    },
    data() {
        // '.webp': ['webpQ', 'webpLossless'],
        return {
            form: {
                webpLossless: this.webpLossless === 'true',
                webpQ: this.webpQ,
            },
        };
    },
    computed: {
        qPlaceholder() {
            return this.pngQ ? null : DEFAULT_Q;
        },
    },
    methods: {
        getFormData() {
            const ret = {};
            if (this.form.webpQ !== DEFAULT_Q && this.form.webpQ) {
                ret.webpQ = this.form.webpQ;
            }
            if (this.form.webpLossless) {
                ret.webpLossless = 'true';
            }
            return ret;
        },
    },
};
</script>
