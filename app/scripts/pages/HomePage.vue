<template>
    <section class="home-page auth-page container">
        <h2>Home</h2>
        <p>authenticated/loading: {{ loading }}</p>
        <p>authenticated/isAuth: {{ isAuth }}</p>
        <p v-if="!authenticated">
            Not Logged In
        </p>
        <div v-if="authenticated">
            Logged In
            <firebase-log />
            <image-list-section />
            <image-compare />
        </div>
    </section>
</template>
<script>
import FirebaseLog from '../components/FirebaseLog';
import ImageListSection from '../components/ImageListSection';
import ImageCompare from '../components/ImageCompare';

export default {
    name: 'HomePage',
    components: {
        FirebaseLog,
        ImageListSection,
        ImageCompare,
    },
    computed: {
        authenticated() {
            return this.$store.getters['authenticated/isAuth0Auth'];
        },
        loading() {
            return this.$store.getters['authenticated/loading'];
        },
        isAuth() {
            return this.$store.getters['authenticated/isAuth'];
        },
    },
};
</script>
