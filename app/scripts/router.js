import Vue from 'vue';
import Router from 'vue-router';
import LoginPage from './pages/LoginPage';
import LoginCallbackPage from './pages/LoginCallbackPage';
import HomePage from './pages/HomePage';

Vue.use(Router);

export default function createRouter({ authService }) {
    const router = new Router({
        mode: 'history',
        routes: [
            {
                path: '/',
                name: 'home',
                component: HomePage,
            },
            {
                path: '/login',
                name: 'login',
                component: LoginPage,
                props: {
                    authService,
                },
            },
            {
                path: '/callback',
                name: 'login-callback',
                component: LoginCallbackPage,
                props: {
                    authService,
                },
            },
            {
                path: '/logout',
                name: 'logout-callback',
                beforeEnter: (to, from, next) => {
                    next({ path: '/' });
                },
            },
        ],
    });
    // router.beforeEach((to, from, next) => {
    //     return next();
    // });
    return router;
}
