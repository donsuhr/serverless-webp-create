const config = {
    firebase: {
        apiKey: 'AIzaSyCgXlSGDZyKoUuIlSt6SVJTZcJsIDYcQ84',
        databaseURL: 'https://video-transcoder-776cd.firebaseio.com',
    },
    auth0: {
        domain: 'cmc.auth0.com',
        clientId: '41ICIEm0P4ha7gVagIrNduUtMU3Zloh6',
        callbackUrl: 'https://cmc.suhrthing.com:9001/callback',
        logoutUrl: 'https://cmc.suhrthing.com:9001/logout',
    },
    AWS: {
        queueTable: 'queuev7-DynamoStack-15ORN7Q958TRV-queues-v2',
        AWS_REGION: 'us-west-2',
        IDENTITY_POOL_ID: 'us-west-2:0214373e-4f0a-4721-9a82-a555307771d1',
        USER_POOL_ID: 'us-west-2_ObqHsXRQl',
        CLIENT_ID: '7tm5lr7nelq14t4ouh9deqohbh',
        apiGatewayUrl:
            'https://z8hojechm0.execute-api.us-west-2.amazonaws.com/dev',
        s3Prefix:
            'https://s3-us-west-2.amazonaws.com/dev-webp-create--bucket--img-upload-2',
    },
};
export default config;
