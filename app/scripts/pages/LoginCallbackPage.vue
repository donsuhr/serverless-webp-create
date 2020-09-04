<template>
    <section class="login-callback-page auth-page container">
        <div
            v-if="!error"
            class="loading--placeholder"
        >
            Loading...
        </div>
        <p v-if="error">
            Error logging in
        </p>
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
    data: () => ({
        error: false,
    }),
    created() {
        this.authService
            .handleLoginCallback()
            .then(() => {
                this.$router.push({ name: 'home' });
            })
            .catch(() => {
                this.error = true;
            });
    },
};
</script>
