'use strict';

const jwt = require('jsonwebtoken'); // eslint-disable-line import/no-unresolved
const jwksClient = require('jwks-rsa'); // eslint-disable-line import/no-unresolved

const client = jwksClient({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    strictSsl: true, // Default value
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});

function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err);
        }
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

module.exports.verifyToken = function verifyToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, getKey, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                resolve(decoded);
            }
        });
    });
};
