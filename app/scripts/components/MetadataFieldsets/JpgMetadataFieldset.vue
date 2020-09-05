<template>
    <fieldset>
        <legend>JPG</legend>
        <ul>
            <li class="images__img-form__field">
                <label
                    class="images__img-form__label"
                    :for="'progressive-' + s3Key"
                >
                    progressive
                </label>
                <input
                    :id="'progressive-' + s3Key"
                    v-model="form.progressive"
                    class="images__img-form__input"
                    type="checkbox"
                    name="progressive"
                >
                <p class="images__img-form__field-info">
                    Default: off
                    <br>
                    Lossless conversion to progressive.
                </p>
            </li>
        </ul>
    </fieldset>
</template>
<script>
const DEFAULT_Q = '75';

export default {
    name: 'JpgMetadataFieldset',
    props: {
        s3Key: {
            type: String,
            required: true,
        },
        progressive: {
            type: String,
            required: false,
            default: null,
        },
        jpgQ: {
            type: String,
            required: false,
            default: null,
        },
        jpgLossless: {
            type: String,
            required: false,
            default: null,
        },
    },
    data() {
        // '.jpg': ['progressive', 'jpgQ', 'jpgLossless'],
        return {
            form: {
                progressive: this.progressive === 'true',
                jpgLossless: this.jpgLossless === 'true',
                jpgQ: this.jpgQ,
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
            if (this.form.progressive) {
                ret.progressive = 'true';
            }
            if (this.form.jpgQ !== DEFAULT_Q && this.form.jpgQ) {
                ret.jpgQ = this.form.jpgQ;
            }
            if (this.form.jpgLossless) {
                ret.jpgLossless = 'true';
            }
            return ret;
        },
    },
};
</script>
