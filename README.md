# edx-marketing-site-frontend

## Development

Install all dependencies:

    $ npm install

Run Webpack in watch mode:

    $ npm run watch

Run the webserver:

    $ npm start

## Deployment

Static assets are compiled by Webpack and pushed to S3.

    $ npm run build

Application code is deployed to AWS API Gateway + Lambda (server code) using [ClaudiaJS](https://claudiajs.com/). 

    $ npm run deploy
    
### Scheduled Event

Scheduled events can be created in CloudWatch to periodically poll the Lambda to prevent cold starts. The command below
will create a new scheduled event that makes a GET request to the health endpoint (`/health`) every 15 minutes.

    $ AWS_PROFILE=claudia ./node_modules/.bin/claudia add-scheduled-event --event ./schedule.json --name warmer --schedule "rate(15 minutes)"


## Internationalization (i18n)

Translations are managed with [i18n-abide](https://www.npmjs.com/package/i18n-abide). This package is responsible for
extracting and compiling translations.

**Note #1:** Translations are only used server-side. If client-side translations are needed, the translation files will
 need to be pushed client-side. 

**Note #2:** We call `jsxgettext` directly instead of using `extract-pot` due to [a bug in the current version of 
`i18n-abide`](https://github.com/mozilla/i18n-abide/pull/111).

## Install gettext

    $ brew install gettext
    $ brew link gettext --force

## Extract translations

    $ npm run extract-translations

## Transifex

    # TODO: Install Transifex client
    # TODO: Command to push files to Transifex
    # TODO: Command to pull files from Transifex

## Compile translations

    $ npm run compile-translations 
