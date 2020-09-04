'use strict';

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    strictSsl: true, // Default value
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});

function getKey(header, callback) {
    client
        .getSigningKeyAsync(header.kid)
        .then((key) => {
            const signingKey = key.publicKey || key.rsaPublicKey;
            callback(null, signingKey);
        })
        .catch((err) => {
            callback(err);
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
