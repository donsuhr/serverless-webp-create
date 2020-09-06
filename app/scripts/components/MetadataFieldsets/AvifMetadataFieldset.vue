<style lang="scss">
.images__img-form__label--quality {
    display: block;
    margin-bottom: 1em;
}
</style>
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
            <li>
                <label
                    class="images__img-form__label images__img-form__label--quality"
                >Quality</label>
                <ejs-slider
                    id="range"
                    v-model="rangeValue"
                    type="Range"
                    min="0"
                    max="63"
                    enabled="true"
                    :ticks="{
                        placement: 'Before',
                        largeStep: 20,
                        smallStep: 5,
                        showSmallTicks: true,
                    }"
                    :tooltip="{
                        placement: 'Before',
                        isVisible: true,
                        showOn: 'Always',
                    }"
                />

                <p class="images__img-form__field-info">
                    Set min/max quantizer for color (0-63, where 0 is lossless)
                </p>
            </li>
        </ul>
    </fieldset>
</template>
<script>
const DEFAULT_SPEED = '8';
const DEFAULT_MINQ = 33;
const DEFAULT_MAXQ = 63;

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
        avifMinQ: {
            type: String,
            required: false,
            default: null,
        },
        avifMaxQ: {
            type: String,
            required: false,
            default: null,
        },
    },
    data() {
        // '.avif': ['avifSpeed', 'avifLossless', 'avifMinQ', 'avifMaxQ'],
        return {
            form: {
                avifLossless: this.avifLossless === 'true',
                avifSpeed: this.avifSpeed,
                avifMinQ: this.avifMinQ ?? DEFAULT_MINQ,
                avifMaxQ: this.avifMaxQ ?? DEFAULT_MAXQ,
            },
        };
    },
    computed: {
        speedPlaceholder() {
            return this.avifSpeed ? null : DEFAULT_SPEED;
        },
        minQmax() {
            return this.form.avifMaxQ;
        },
        rangeValue: {
            get() {
                return [this.form.avifMinQ, this.form.avifMaxQ];
            },
            set(val) {
                [this.form.avifMinQ, this.form.avifMaxQ] = val;
            },
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
            if (this.form.avifMinQ !== DEFAULT_MINQ && this.form.avifMinQ) {
                ret.avifMinQ = this.form.avifMinQ;
            }
            if (this.form.avifMaxQ !== DEFAULT_MAXQ && this.form.avifMaxQ) {
                ret.avifMaxQ = this.form.avifMaxQ;
            }
            return ret;
        },
    },
};
</script>
