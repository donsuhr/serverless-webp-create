<template>
    <section class="login-page auth-page container">
        <h2>Login</h2>
        <button
            v-if="!authenticated"
            type="button"
            @click.prevent="onLoginClick"
        >
            Login
        </button>
        <button
            v-if="authenticated"
            type="button"
            @click.prevent="onLogoutClick"
        >
            Logout
        </button>
    </section>
</template>
<script>
export default {
    name: 'LoginPage',
    props: {
        // eslint-disable-next-line vue/require-prop-types
        authService: {
            required: true,
        },
    },
    computed: {
        authenticated() {
            return this.$store.getters['authenticated/isAuth0Auth'];
        },
    },
    methods: {
        onLoginClick() {
            this.authService.login();
        },
        onLogoutClick() {
            this.authService.logout();
        },
    },
};
</script>
