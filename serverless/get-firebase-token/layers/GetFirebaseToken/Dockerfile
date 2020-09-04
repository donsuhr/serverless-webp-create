FROM lambci/lambda:build-nodejs12.x as build-stage
WORKDIR /var/task
RUN mkdir nodejs
COPY . .
WORKDIR /var/task/nodejs
RUN npm install
# RUN zip -9yr lambda.zip .
# CMD aws lambda update-function-code --function-name mylambda --zip-file fileb://lambda.zip
