# Create WebP images via AWS Lambda

Proof-of-concypt project using a lambda layer containing cwebp to convert images
to cwebp. It's probably not what you want.

## Getting started

[Serverless blog post](https://www.serverless.com/blog/publish-aws-lambda-layers-serverless-framework)
on creating a layer with a precompiled ffmpeg.

_Note_: After installing docker I had to run `docker logout` to get any images
to pull.

Invoking some of the functions via docker require an .env file with the
following vars:

```
AWS_ACCESS_KEY_ID=XXX
AWS_SECRET_ACCESS_KEY=YYY
AWS_REGION=ZZZ
```

The front end app is authenticated with Auth0. `app/scripts/config.js` will need
to be updated with the account information.

## firebase service account

Several of the functions post their status to firebase for realtime status
updates. It authenticates with a KMS encrypted json file exported from Google
Cloud Platform / IAM / Service Accounts. This is linked to from Firebase project
/ Settings / Service Accounts. The file is in `serverless/[fnFolder]/config/`.

```
aws kms encrypt \
    --key-id alias/XXX \
    --output text \
    --plaintext fileb://XXXX.json \
    | base64 --decode > service-account.encrypted.json
```

## Layers

### libcwebp layer

Build: `serverless/lambda-layers/libwebp/bin/build.sh`

This builds cwebp from source. This is completely unnecessary as there are
better ways to achieve this. The precompiled binaries work fine. I have not
tried the npm packages but those probably work pretty well too.

It gets installed as part of `serverless/img-bucket/serverless.yml`

### imagemin layer

Build: `serverless/lambda-layers/imagemin/bin/build.sh` Mess with it:
`serverless/lambda-layers/imagemin/bin/open-terminal.sh` Consider:
`npm-check --update` from outside and rebuild it.

It gets installed as part of `serverless/img-bucket/serverless.yml`

### imagemin layer

Same as libcwebp.

### pre-installed-for-dev

aws-sdk is not in the main package. The lambda functions need
it when running `serverless invoke local`. `npm install` it before running
invoke.

## Lambda function groups

### get-firebase-token

Update the `serverless.yml` environment variables appropriately.

This function group as a layer to speed up deploys and complicate dependency
resolution.

Build: `serverless/get-firebase-token/bin/layer--build.sh` Mess with it:
`serverless/get-firebase-token/bin/layer--open-terminal.sh` Functional test:
`serverless/get-firebase-token/bin/invoke--via-docker.sh`.

To get a successful result it needs to have a working token copied from the
working app / localstorage:accessToken. Otherwise, it will return an expired
error.

Deploy: `serverless/get-firebase-token/bin/deploy.sh`

### img-bucket

The `get-firebase-token/serverless.yml` needs to be deployed before this group
because it uses its layers. Same routine as get-firebase-token.

## docker reminder notes

list running containers `docker ps` list all containers `docker ps -a` enter a
running container `docker exec -it xxx bash` stop a running container
`docker stop xxx` copy a file out
`docker cp 1efaeba689af:/var/task/archive.tar.gz foo.tar.gz`
