<template>
    <div class="images__img-form">
        <form @submit.prevent="onFormSubmit">
            <fieldset v-if="ext === 'png'">
                <legend>PNG</legend>
                <ul>
                    <li class="images__img-form__field">
                        <label
                            class="images__img-form__label"
                            for="speed"
                        >
                            Speed
                        </label>
                        <input
                            id="speed"
                            v-model="form.speed"
                            class="images__img-form__input"
                            type="text"
                            name="speed"
                            :placeholder="speedPlaceholder"
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
                            for="strip"
                        >
                            Strip
                        </label>
                        <input
                            id="strip"
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

            <fieldset v-if="ext === 'jpg'">
                <legend>JPG</legend>
                <ul>
                    <li class="images__img-form__field">
                        <label
                            class="images__img-form__label"
                            for="progressive"
                        >
                            progressive
                        </label>
                        <input
                            id="progressive"
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

            <fieldset v-if="ext === 'gif'">
                <legend>GIF</legend>
                <ul>
                    <li class="images__img-form__field">
                        <label
                            class="images__img-form__label"
                            for="optimizationLevel"
                        >
                            optimizationLevel
                        </label>
                        <input
                            id="optimizationLevel"
                            v-model="form.optimizationLevel"
                            class="images__img-form__input"
                            type="text"
                            name="optimizationLevel"
                            :placeholder="optimizationLevelPlaceholder"
                        >
                        <p class="images__img-form__field-info">
                            Default: 1
                            <br>
                            1: Stores only the changed portion of each image.
                            <br>
                            2: Also uses transparency to shrink the file
                            further.
                            <br>
                            3: Try several optimization methods (usually slower,
                            sometimes better results)
                            <br>
                        </p>
                    </li>
                    <li class="images__img-form__field">
                        <label
                            class="images__img-form__label"
                            for="interlaced"
                        >
                            interlaced
                        </label>
                        <input
                            id="interlaced"
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

            <fieldset v-if="ext !== 'svg'">
                <legend>WebP</legend>
                <ul>
                    <li class="images__img-form__field">
                        <label
                            class="images__img-form__label"
                            for="q"
                        >
                            q
                        </label>
                        <input
                            id="q"
                            v-model="form.q"
                            class="images__img-form__input"
                            type="number"
                            name="q"
                            :placeholder="qPlaceholder"
                            min="0"
                            max="100"
                        >
                        <p class="images__img-form__field-info">
                            Default: 75
                            <br>
                            Specify the compression factor for RGB channels
                            between 0 and 100.<br>
                            (0:small..100:big)
                        </p>
                    </li>
                    <li class="images__img-form__field">
                        <label
                            class="images__img-form__label"
                            for="lossless"
                        >
                            Lossless
                        </label>
                        <input
                            id="lossless"
                            v-model="form.lossless"
                            class="images__img-form__input"
                            type="checkbox"
                            name="lossless"
                        >
                        <p class="images__img-form__field-info">
                            Encode the image without any loss.
                        </p>
                    </li>
                </ul>
            </fieldset>
            <input
                type="submit"
                value="Update Settings"
            >
        </form>
    </div>
</template>
<script>
export default {
    name: 'MetaDataForm',
    props: {
        s3Key: {
            type: String,
            required: true,
        },
        // png
        strip: {
            type: String,
            required: false,
            default: null,
        },
        speed: {
            type: String,
            required: false,
            default: null,
        },
        // jpg
        progressive: {
            type: String,
            required: false,
            default: null,
        },
        // gif
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
        // webP
        q: {
            type: String,
            required: false,
            default: null,
        },
        lossless: {
            type: String,
            required: false,
            default: null,
        },
    },
    data() {
        return {
            form: {
                strip: this.strip === 'true',
                speed: this.speed,
                lossless: this.lossless === 'true',
                q: this.q,
                interlaced: this.interlaced === 'true',
                optimizationLevel: this.optimizationLevel,
            },
        };
    },
    computed: {
        speedPlaceholder() {
            return this.speed ? null : '3';
        },
        qPlaceholder() {
            return this.q ? null : '75';
        },
        optimizationLevelPlaceholder() {
            return this.optimizationLevel ? null : '1';
        },
        ext() {
            return this.s3Key.split('.').pop();
        },
    },
    methods: {
        onFormSubmit() {
            // eslint-disable-next-line no-underscore-dangle
            const data = { ...this._data };
            this.$store.dispatch('images/updateItem', {
                key: this.s3Key,
                data: data.form,
            });
        },
    },
};
</script>
