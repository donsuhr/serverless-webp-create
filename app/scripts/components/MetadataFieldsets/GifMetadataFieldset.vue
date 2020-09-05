<template>
    <fieldset>
        <legend>GIF</legend>
        <ul>
            <li class="images__img-form__field">
                <label
                    class="images__img-form__label"
                    :for="'optimizationLevel-' + s3Key"
                >
                    optimizationLevel
                </label>
                <input
                    :id="'optimizationLevel-' + s3Key"
                    v-model="form.optimizationLevel"
                    class="images__img-form__input"
                    type="number"
                    name="optimizationLevel"
                    :placeholder="optimizationLevelPlaceholder"
                    min="1"
                    max="3"
                >
                <p class="images__img-form__field-info">
                    Default: 1
                    <br>
                    1: Stores only the changed portion of each image.
                    <br>
                    2: Also uses transparency to shrink the file further.
                    <br>
                    3: Try several optimization methods (usually slower,
                    sometimes better results)
                    <br>
                </p>
            </li>
            <li class="images__img-form__field">
                <label
                    class="images__img-form__label"
                    :for="'interlaced-' + s3Key"
                >
                    interlaced
                </label>
                <input
                    :id="'interlaced-' + s3Key"
                    v-model="form.interlaced"
                    class="images__img-form__input"
                    type="checkbox"
                    name="interlaced"
                >
                <p class="images__img-form__field-info">
                    Interlace gif for progressive rendering.
                </p>
            </li>
        </ul>
    </fieldset>
</template>
<script>
const DEFAULT_Q = '75';
const DEFAULT_LEVEL = '1';

export default {
    name: 'GifMetadataFieldset',
    props: {
        s3Key: {
            type: String,
            required: true,
        },
        optimizationLevel: {
            type: String,
            required: false,
            default: null,
        },
        interlaced: {
            type: String,
            required: false,
            default: null,
        },
        gifQ: {
            type: String,
            required: false,
            default: null,
        },
        gifLossless: {
            type: String,
            required: false,
            default: null,
        },
    },
    data() {
        // '.gif': ['interlaced', 'optimizationLevel', 'gifQ', 'gifLossless'],
        return {
            form: {
                interlaced: this.interlaced === 'true',
                gifLossless: this.gifLossless === 'true',
                optimizationLevel: this.optimizationLevel,
                gifQ: this.gifQ,
            },
        };
    },
    computed: {
        optimizationLevelPlaceholder() {
            return this.optimizationLevel ? null : DEFAULT_LEVEL;
        },
        qPlaceholder() {
            return this.pngQ ? null : DEFAULT_Q;
        },
    },
    methods: {
        getFormData() {
            const ret = {};
            if (this.form.interlaced) {
                ret.interlaced = 'true';
            }
            if (this.form.gifQ !== DEFAULT_Q && this.form.gifQ) {
                ret.jpgQ = this.form.jpgQ;
            }
            if (
                this.form.optimizationLevel !== DEFAULT_LEVEL
                && this.form.optimizationLevel
            ) {
                ret.optimizationLevel = this.form.optimizationLevel;
            }
            if (this.form.gifLossless) {
                ret.gifLossless = 'true';
            }
            return ret;
        },
    },
};
</script>
