import Vue from 'vue';
import Router from 'vue-router';
import Login from './pages/Login';
import LoginCallback from './pages/LoginCallback';
import Home from './pages/Home';

Vue.use(Router);

export default function createRouter({ authService }) {
    const router = new Router({
        mode: 'history',
        routes: [
            {
                path: '/',
                name: 'home',
                component: Home,
            },
            {
                path: '/login',
                name: 'login',
                component: Login,
                props: {
                    authService,
                },
            },
            {
                path: '/callback',
                name: 'login-callback',
                component: LoginCallback,
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
