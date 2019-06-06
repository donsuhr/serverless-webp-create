import config from 'config';
import EventEmitter from 'events'; // eslint-disable-line import/no-extraneous-dependencies
import auth0 from 'auth0-js';
import jwtDecode from 'jwt-decode';
import { parseJSON, checkStatus } from 'fetch-json-helpers';

export const LS_KEY_IS_AUTH = 'isAuth';
export const LS_KEY_ACCESS_TOKEN = 'accessToken';
export const LS_KEY_ID_TOKEN = 'idToken';
export const LS_KEY_FIREBASE_TOKEN = 'firebaseToken';
export const AUTH_CHANGE = 'authChange';
export const AUTH_LOADING = 'authLoading';
export const FB_LOADING = 'fbLoading';
export const FB_TOKEN_REFRESHED = 'firebaseTokenRefreshed';

export const emitter = new EventEmitter();
let auth0isLoading = false;
emitter.on(AUTH_LOADING, (loading) => {
    auth0isLoading = loading;
});

const webAuth = new auth0.WebAuth({
    domain: config.auth0.domain,
    clientID: config.auth0.clientId,
    redirectUri: config.auth0.callbackUrl,
    responseType: 'token id_token',
    scope: 'openid',
    audience: 'https://cmc.auth0.com/api/v2/',
});

const refreshTimers = {
    auth0: null,
    firebase: null,
};
// eslint-disable-next-line no-use-before-define
startRefreshTimers();

// *************************************************

function startRefreshTimers() {
    // eslint-disable-next-line no-use-before-define
    startRefreshTimer('auth0', getAccessToken, refreshSession).then(() => {
        // eslint-disable-next-line no-use-before-define
        startRefreshTimer('firebase', getFirebaseToken, loadFirebaseToken);
    });
}

async function startRefreshTimer(refreshTimerKey, getTokenFn, refreshFn) {
    clearTimeout(refreshTimers[refreshTimerKey]);
    const token = getTokenFn();
    if (!token) {
        return;
    }

    const decoded = jwtDecode(token);
    const now = new Date().getTime() / 1000;
    const tenMinutes = 10 * 60;
    const tenMinutesFromNow = now + tenMinutes;

    if (tenMinutesFromNow > decoded.exp) {
        await refreshFn();
        return;
    }

    const nineMinutes = 9 * 60;
    const nineMinutesLeft = decoded.exp - nineMinutes - now;
    refreshTimers[refreshTimerKey] = setTimeout(
        () => startRefreshTimer(refreshTimerKey, getTokenFn, refreshFn),
        nineMinutesLeft * 1000,
    );
}

export function isLoading() {
    return auth0isLoading;
}

function isExpired(token) {
    const decoded = jwtDecode(token);
    const now = new Date().getTime() / 1000;
    return now > decoded.exp;
}

export function getIdToken() {
    return localStorage.getItem(LS_KEY_ID_TOKEN);
}

export function getAccessToken() {
    return localStorage.getItem(LS_KEY_ACCESS_TOKEN);
}

export function getFirebaseToken() {
    return localStorage.getItem(LS_KEY_FIREBASE_TOKEN);
}

export function hasValidFirebaseToken() {
    const token = getFirebaseToken();
    return token && !isExpired(token);
}

export function isAuthenticated() {
    return (
        localStorage.getItem(LS_KEY_IS_AUTH) === 'true'
        && !isExpired(getIdToken())
    );
}

async function setSession(authResult) {
    localStorage.setItem(LS_KEY_ACCESS_TOKEN, authResult.accessToken);
    localStorage.setItem(LS_KEY_ID_TOKEN, authResult.idToken);
    localStorage.setItem(LS_KEY_IS_AUTH, true);
    // eslint-disable-next-line no-use-before-define
    await loadFirebaseToken();
    startRefreshTimers();
    emitter.emit(AUTH_CHANGE, true);
}

function removeSession() {
    localStorage.removeItem(LS_KEY_IS_AUTH);
    localStorage.removeItem(LS_KEY_ACCESS_TOKEN);
    localStorage.removeItem(LS_KEY_ID_TOKEN);
    localStorage.removeItem(LS_KEY_FIREBASE_TOKEN);
    clearTimeout(refreshTimers.auth0);
    clearTimeout(refreshTimers.firebase);
    emitter.emit(AUTH_CHANGE, false);
}

export function refreshSession() {
    emitter.emit(AUTH_LOADING, true);
    return new Promise((resolve, reject) => {
        webAuth.checkSession({}, async (err, authResult) => {
            if (authResult && authResult.accessToken && authResult.idToken) {
                await setSession(authResult);
                resolve();
            } else if (err) {
                // eslint-disable-next-line no-console
                console.log(err);
                removeSession();
                reject(err);
            }
            emitter.emit(AUTH_LOADING, false);
        });
    });
}

function loadFirebaseToken() {
    emitter.emit(FB_LOADING, true);
    const url = `${config.AWS.apiGatewayUrl}/firebaseToken`;
    const accessToken = getAccessToken();
    if (isExpired(accessToken)) {
        return refreshSession();
    }
    return fetch(url, {
        headers: new Headers({
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        }),
    })
        .then(checkStatus)
        .then(parseJSON)
        .then(({ firebaseToken }) => {
            localStorage.setItem(LS_KEY_FIREBASE_TOKEN, firebaseToken);
            startRefreshTimers();
            emitter.emit(FB_TOKEN_REFRESHED);
            emitter.emit(FB_LOADING, false);
        });
}

export function handleLoginCallback() {
    emitter.emit(AUTH_LOADING, true);
    return new Promise((resolve, reject) => {
        webAuth.parseHash(async (err, authResult) => {
            if (authResult && authResult.accessToken && authResult.idToken) {
                await setSession(authResult);
                resolve();
            }
            if (err) {
                // eslint-disable-next-line no-console
                console.log(err);
                reject(err);
            }
            emitter.emit(AUTH_LOADING, false);
        });
    });
}

export function login() {
    webAuth.authorize();
}

export function logout() {
    webAuth.logout({
        clientID: config.auth0.clientId,
        returnTo: config.auth0.logoutUrl,
    });
    removeSession();
}
