# Did Elspeth make it to work on time?

A static site and [associated twitter bot](https://twitter.com/elspethontime) for keeping track of
whether Elspeth makes it to work on time.

The production version of the site is at [didelspethmakeit.com](https://didelspethmakeit.com).

Pull request are welcome!

## Dev setup

```
npm install
npm i -g netlify-cli
ntl init
ntl dev
```

Or, without Netlify hooked up:

```
npm install
npm run start
```

(In that case you'll need a `.env` file with at least the FaunaDB key in it)

## Architecture

The site is an Eleventy-powered static site.  Backend information is stored in a collection in FaunaDB
and compiled into static HTML / CSS at build time.

There's one piece of server-side logic which is in `functions/update.js`.  It will create a new record
in FaunaDB based on the state you provide as a query param.  After that it will post a related message to
twitter, and then trigger a rebuild of the site via a Netlify build hook.

![Architecture diagram](/documentation/architecture.png?raw=true)

## Environment variables:

(These will be set up automatically if you're hooked up to Netlify)

| Variable | Description |
| --- | --- |
| FAUNADB_SECRET_KEY | The server key for the FaunaDB database to use as a backend. |
| BACKEND_PASSWORD | The password required for using POST /update.  I know, it's the worst. |
| BUILD_WEBHOOK_URL | A Netlify build hook URL to trigger at the end of the update function. |
| TWITTER_API_KEY | Twitter auth nonsense. |
| TWITTER_API_SECRET | Twitter auth nonsense. |
| TWITTER_ACCESS_KEY | Twitter auth nonsense. |
| TWITTER_ACCESS_SECRET | Twitter auth nonsense. |

## Dedication

To Elspeth, for being an inspirational colleague and generally a good sport.  I appreciate you!
