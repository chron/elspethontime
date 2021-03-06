require('dotenv');
const Twit = require('twit');
const { query, Client } = require('faunadb');
const format = require('date-fns/format');
const fetch = require('node-fetch');

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
  sick: `Elspeth is off sick today.`,
  otherplans: `Elspeth had something better to do today.`,
  holiday: `Elspeth is on holiday!`,
  publicholiday: `We are all on holiday!`,
  actofgod: `The fates conspired against Elspeth today (but it wasn't her fault).`,
  everyoneelse: `Bianca, Andy, and two different Pauls made it on time.`,
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

  console.log('Triggering update');

  if (password !== process.env.BACKEND_PASSWORD) {
    console.log('Incorrect password, aborting');
    return { statusCode: 401, body: "Wrong password" };
  }

  if (!Object.keys(MESSAGES_BY_STATE).includes(state)) {
    console.log('Invalid state, aborting');
    return { statusCode: 400, body: "Unknown or blank state provided" };
  }

  const date = format(new Date(), 'yyyy-MM-dd');

  console.log(`State = ${state}, date = ${date}`);

  const fauna = new Client({ secret: process.env.FAUNADB_SECRET_KEY });

  try {
    console.log('Creating record in FaunaDB');

    await fauna.query(Create(Collection('days'), { data: { date, state }}));

    console.log('Posting to twitter');
    await tweet(MESSAGES_BY_STATE[state]);

    if (process.env.SLACK_WEBHOOK_URL) {
      console.log('Posting to Slack webhook');

      const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: '#elspeth-accountability',
          text: MESSAGES_BY_STATE[state],
          icon_emoji: ':daria:',
          username: 'Did Elspeth make it?',
          link_names: 1,
        }),
      });

      console.log(response);
    } else {
      console.log('No Slack webhook configured');
    }

    if (process.env.BUILD_WEBHOOK_URL) {
      console.log('Triggering POST request to build webhook');
      await fetch(process.env.BUILD_WEBHOOK_URL, { method: 'POST' })
    } else {
      console.log('No build webhook configured');
    }

    console.log('Done!');

    return {
      statusCode: 200,
      body: "Done!",
    }
  } catch (e) {
    console.error(e);

    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  }
}
