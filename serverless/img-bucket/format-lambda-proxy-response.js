'use strict';

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers':
        'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Cache-Control,Pragma,Debug',
};

module.exports.returnError = function returnError(requestId, err) {
    const errorObj = {
        errorType: 'InternalServerError',
        httpStatus: 500,
        requestId,
        error: {
            name: err.name,
            message: err.message,
            stack: err.stack.split('\n'),
        },
    };
    return {
        isBase64Encoded: false,
        statusCode: 500,
        headers,
        body: JSON.stringify(errorObj),
    };
};

module.exports.returnSuccess = function returnSuccess(obj) {
    return {
        isBase64Encoded: false,
        statusCode: 200,
        headers,
        body: JSON.stringify(obj),
    };
};
