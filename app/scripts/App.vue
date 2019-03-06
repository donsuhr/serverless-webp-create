<template>
    <main>
        <header class="container">
            <h1 class="main-title">
                Images
            </h1>
            <nav>
                <RouterLink
                    v-if="!isLoginPage"
                    :to="{ name: 'login' }"
                    class="nav-link"
                >
                    Login
                </RouterLink>
                <RouterLink
                    v-if="!isHomePage"
                    :to="{ name: 'home' }"
                    class="nav-link"
                >
                    Home
                </RouterLink>
            </nav>
        </header>
        <RouterView />
    </main>
</template>

<script>
export default {
    name: 'App',
    computed: {
        isLoginPage() {
            return this.$route.name === 'login';
        },
        isHomePage() {
            return this.$route.name === 'home';
        },
        authenticated() {
            return this.$store.getters['authenticated/isAuth0Auth'];
        },
    },
};
</script>
