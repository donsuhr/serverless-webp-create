import config from 'config';
import EventEmitter from 'events';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';

const FB_LOADING = 'fbLoading';
const emitter = new EventEmitter();

let willAutoSignIn = false;
let loading = true;

export function create({ authService }) {
    emitter.on(FB_LOADING, (isLoading) => {
        loading = isLoading;
    });
    willAutoSignIn = authService.hasValidFirebaseToken();
    if (willAutoSignIn) {
        emitter.emit(FB_LOADING, true);
    }

    const app = firebase.initializeApp({
        apiKey: config.firebase.apiKey,
        databaseURL: config.firebase.databaseURL,
    });

    const auth = app.auth();

    async function updateFirebaseAuth(token) {
        emitter.emit(FB_LOADING, true);
        await firebase.auth().signInWithCustomToken(token);
        emitter.emit(FB_LOADING, false);
    }

    auth.onAuthStateChanged((user) => {
        emitter.emit(FB_LOADING, false);
    });

    if (
        authService.isAuthenticated()
        && !auth.currentUser
        && !willAutoSignIn
        && authService.hasValidFirebaseToken()
    ) {
        updateFirebaseAuth(authService.getFirebaseToken());
    }

    authService.emitter.on(authService.FB_TOKEN_REFRESHED, () => {
        updateFirebaseAuth(authService.getFirebaseToken());
    });

    authService.emitter.on(authService.AUTH_CHANGE, (isAuth) => {
        if (!isAuth && (auth.currentUser || willAutoSignIn)) {
            auth.signOut();
        }
    });

    return {
        app,
        db: app.database(),
        auth,
        ns: firebase,
        emitter,
        FB_LOADING,
        loading,
    };
}
