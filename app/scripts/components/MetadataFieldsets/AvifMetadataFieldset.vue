<template>
    <fieldset>
        <legend>Avif</legend>
        <ul>
            <li class="images__img-form__field">
                <label
                    class="images__img-form__label"
                    :for="'avifSpeed-' + s3Key"
                >
                    speed
                </label>
                <input
                    :id="'avifSpeed-' + s3Key"
                    v-model="form.avifSpeed"
                    class="images__img-form__input"
                    type="number"
                    name="avifSpeed"
                    :placeholder="speedPlaceholder"
                    min="0"
                    max="10"
                >
                <p class="images__img-form__field-info">
                    Default: 8
                    <br>
                    Encoder speed <br>
                    (0:slowest..10:fastest)<br>
                    &lt; 8 times out 🤷
                </p>
            </li>
            <li class="images__img-form__field">
                <label
                    class="images__img-form__label"
                    :for="'avifLossless-' + s3Key"
                >
                    Lossless
                </label>
                <input
                    :id="'avifLossless-' + s3Key"
                    v-model="form.avifLossless"
                    class="images__img-form__input"
                    type="checkbox"
                    name="avifLossless"
                >
                <p class="images__img-form__field-info">
                    Encode the image without any loss.
                </p>
            </li>
        </ul>
    </fieldset>
</template>
<script>
const DEFAULT_SPEED = '8';

export default {
    name: 'WebpMetadataFieldset',
    props: {
        s3Key: {
            type: String,
            required: true,
        },
        avifSpeed: {
            type: String,
            required: false,
            default: null,
        },
        avifLossless: {
            type: String,
            required: false,
            default: null,
        },
    },
    data() {
        // '.avif': ['avifSpeed', 'avifLossless'],
        return {
            form: {
                avifLossless: this.avifLossless === 'true',
                avifSpeed: this.avifSpeed,
            },
        };
    },
    computed: {
        speedPlaceholder() {
            return this.avifSpeed ? null : DEFAULT_SPEED;
        },
    },
    methods: {
        getFormData() {
            const ret = {};
            if (this.form.avifSpeed !== DEFAULT_SPEED && this.form.avifSpeed) {
                ret.avifSpeed = this.form.avifSpeed;
            }
            if (this.form.avifLossless) {
                ret.avifLossless = 'true';
            }
            return ret;
        },
    },
};
</script>
