require('dotenv');
const Twit = require('twit');
const { query, Client } = require('faunadb');
const format = require('date-fns/format');

const { Collection, Create } = query;

const Twitter = new Twit({
  consumer_key: process.env.TWITTER_API_KEY,
  consumer_secret: process.env.TWITTER_API_SECRET,
  access_token: process.env.TWITTER_ACCESS_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET,
});

const MESSAGES_BY_STATE = {
  yes: `Elspeth made it to work on time!`,
  no: `Elspeth didn't make it to work on time.`,
  wfh: `Elspeth is working from home today.`,
};

async function tweet(status) {
  return new Promise((resolve, reject) => {
    Twitter.post('statuses/update', { status }, (err, data, _response) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.text);
      }
    });
  });
}

exports.handler = async function(event, _context) {
  const { state, password } = event.queryStringParameters;

  if (password !== process.env.BACKEND_PASSWORD) {
    return { statusCode: 401, body: "Bad" };
  }

  const date = format(new Date(), 'yyyy-MM-dd');

  const fauna = new Client({ secret: process.env.FAUNADB_SECRET_KEY });

  try {
    await fauna.query(Create(Collection('days'), { data: { date, state }}));
    await tweet(MESSAGES_BY_STATE[state]);

    if (process.env.BUILD_WEBHOOK_URL) {
      await fetch(process.env.BUILD_WEBHOOK_URL, { method: 'POST' })
    }

    return {
      statusCode: 204,
      body: "",
    }
  } catch (e) {
    console.error(e);

    return {
      statusCode: 500,
      body: "Darn",
    };
  }
}
