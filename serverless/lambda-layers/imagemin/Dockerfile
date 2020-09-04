# not in use, using ./bin/build.sh
FROM lambci/lambda:build-nodejs12.x as build-stage
WORKDIR /var/task
RUN mkdir nodejs
COPY nodejs/package.json /var/task/nodejs/package.json
COPY nodejs/package-lock.json /var/task/nodejs/package-lock.json

WORKDIR /var/task/nodejs
RUN npm install --only=production
# RUN zip -9yr lambda.zip .
# CMD aws lambda update-function-code --function-name mylambda --zip-file fileb://lambda.zip

# --------------------------------------
FROM scratch AS export-stage
COPY --from=build-stage /var/task/nodejs src/nodejs
