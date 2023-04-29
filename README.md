# S3 Drive

## How it works?

You need to create a presigned url using valid AWS credentials (the presigned url will inherit the permissions from the IAM instance or IAM user who generated the link), then another application is able to perform an upload without needing to be authenticated to your AWS account.

## Requirements

- An AWS account
- An S3 bucket
- An IAM user with permissions to upload

## How to run the sample code?

We split our code in 2 sections:

- Express server app which will be used to generate presigned urls (must be authenticated to AWS).
- An angular application that will fetch the presigned url and upload a file (using Angular owns HTTP library).

### Run the Express app

1. Install the dependencies:

   ```bash
   yarn
   ```

2. Run the server

   ```bash
   yarn start
   ```

_Note: keep in mind that the sample does NOT have explicit AWS credentials set, so it will try to fetch them from one of the available sources. Check AWS documentations [here](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html) about how the Node SDK chooses credentials._

### Run Angular app

1. Go to the Angular app directory

   ```bash
   cd angular
   ```

2. Install dependencies

   ```bash
   yarn
   ```

3. Run application

   ```bash
   yarn start
   ```


_Note: for both Angular app and the backend script, the server must be running. Also, inside the backend script, .ENV must be populated._
