<template>
    <fieldset>
        <legend>PNG</legend>
        <ul>
            <li class="images__img-form__field">
                <label
                    class="images__img-form__label"
                    :for="'pngSpeed-' + s3Key"
                >
                    Speed
                </label>
                <input
                    :id="'pngSpeed-' + s3Key"
                    v-model="form.pngSpeed"
                    class="images__img-form__input"
                    name="pngSpeed"
                    :placeholder="speedPlaceholder"
                    type="number"
                    min="1"
                    max="11"
                >
                <p class="images__img-form__field-info">
                    Default: 3
                    <br>
                    Values: 1 (brute-force) to 11 (fastest) <br>
                    (0:small..11:big)
                </p>
            </li>
            <li class="images__img-form__field">
                <label
                    class="images__img-form__label"
                    :for="'strip-' + s3Key"
                >
                    Strip
                </label>
                <input
                    :id="'strip-' + s3Key"
                    v-model="form.strip"
                    class="images__img-form__input"
                    type="checkbox"
                    name="strip"
                >
                <p class="images__img-form__field-info">
                    Default: off
                    <br>
                    Remove optional metadata.
                </p>
            </li>
        </ul>
    </fieldset>
</template>
<script>
const DEFAULT_SPEED = '3';
const DEFAULT_Q = '75';

export default {
    name: 'PngMetadataFieldset',
    props: {
        s3Key: {
            type: String,
            required: true,
        },
        strip: {
            type: String,
            required: false,
            default: null,
        },
        pngQ: {
            type: String,
            required: false,
            default: null,
        },
        pngSpeed: {
            type: String,
            required: false,
            default: null,
        },
        pngLossless: {
            type: String,
            required: false,
            default: null,
        },
    },
    data() {
        // '.png': ['pngSpeed', 'strip', 'pngQ', 'pngLossless'],
        return {
            form: {
                strip: this.strip === 'true',
                pngSpeed: this.pngSpeed,
                pngLossless: this.pngLossless === 'true',
                pngQ: this.pngQ,
            },
        };
    },
    computed: {
        speedPlaceholder() {
            return this.pngSpeed ? null : DEFAULT_SPEED;
        },
        qPlaceholder() {
            return this.pngQ ? null : DEFAULT_Q;
        },
    },
    methods: {
        getFormData() {
            const ret = {};
            if (this.form.strip) {
                ret.strip = 'true';
            }
            if (this.form.pngQ !== DEFAULT_Q && this.form.pngQ) {
                ret.pngQ = this.form.pngQ;
            }
            if (this.form.pngSpeed !== DEFAULT_SPEED && this.form.pngSpeed) {
                ret.pngSpeed = this.form.pngSpeed;
            }
            if (this.form.pngLossless) {
                ret.pngLossless = 'true';
            }
            return ret;
        },
    },
};
</script>
