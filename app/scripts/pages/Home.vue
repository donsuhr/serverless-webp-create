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
            <Log />
            <Images />
            <Zoomer />
        </div>
    </section>
</template>
<script>
import Log from '../components/Log';
import Images from '../components/Images';
import Zoomer from '../components/Zoomer';

export default {
    name: 'Home',
    components: {
        Log,
        Images,
        Zoomer,
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
