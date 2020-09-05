<template>
    <div class="images__img-form">
        <form @submit.prevent="onFormSubmit">
            <png-metadata-fieldset
                v-if="ext === 'png'"
                ref="pngFieldset"
                v-bind="metadata"
                :s3-key="s3Key"
            />
            <jpg-metadata-fieldset
                v-if="ext === 'jpg'"
                ref="jpgFieldset"
                v-bind="metadata"
                :s3-key="s3Key"
            />
            <gif-metadata-fieldset
                v-if="ext === 'gif'"
                ref="gifFieldset"
                v-bind="metadata"
                :s3-key="s3Key"
            />
            <webp-metadata-fieldset
                v-if="ext !== 'svg'"
                ref="webpFieldset"
                v-bind="metadata"
                :s3-key="s3Key"
            />
            <avif-metadata-fieldset
                v-if="shouldHaveAvif"
                ref="avifFieldset"
                v-bind="metadata"
                :s3-key="s3Key"
            />
            <input
                type="submit"
                value="Update Settings"
            >
        </form>
    </div>
</template>
<script>
import PngMetadataFieldset from './MetadataFieldsets/PngMetadataFieldset';
import JpgMetadataFieldset from './MetadataFieldsets/JpgMetadataFieldset';
import GifMetadataFieldset from './MetadataFieldsets/GifMetadataFieldset';
import WebpMetadataFieldset from './MetadataFieldsets/WebpMetadataFieldset';
import AvifMetadataFieldset from './MetadataFieldsets/AvifMetadataFieldset';

export default {
    name: 'MetadataForm',
    components: {
        PngMetadataFieldset,
        JpgMetadataFieldset,
        GifMetadataFieldset,
        WebpMetadataFieldset,
        AvifMetadataFieldset,
    },
    props: {
        s3Key: {
            type: String,
            required: true,
        },
        metadata: {
            type: Object,
            required: false,
            default: () => ({}),
        },
    },
    computed: {
        ext() {
            return this.s3Key.split('.').pop();
        },
        shouldHaveAvif() {
            return this.ext === 'jpg' || this.ext === 'png';
        },
    },
    methods: {
        onFormSubmit() {
            // eslint-disable-next-line no-underscore-dangle
            const data = {
                ...this.$refs.pngFieldset?.getFormData(),
                ...this.$refs.jpgFieldset?.getFormData(),
                ...this.$refs.gifFieldset?.getFormData(),
                ...this.$refs.webpFieldset?.getFormData(),
                ...this.$refs.avifFieldset?.getFormData(),
            };
            this.$store.dispatch('images/updateItem', {
                key: this.s3Key,
                data,
            });
        },
    },
};
</script>
