<template>
    <div class="images__img-form">
        <form @submit.prevent="onFormSubmit">
            <fieldset>
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
                            Values: 1 (brute-force) to 11 (fastest)
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
            <fieldset>
                <legend>WebP</legend>
                <ul />
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
        strip: {
            type: String,
            required: false,
        },
        quality: {
            type: String,
        },
        speed: {
            type: String,
        },
    },
    data() {
        return {
            form: {
                strip: this.strip === 'true',
                // quality: this.quality,
                speed: this.speed,
            },
        };
    },
    computed: {
        speedPlaceholder() {
            return this.speed ? null : '3';
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
