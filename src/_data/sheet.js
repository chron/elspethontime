require('dotenv').config();
const fetch = require('node-fetch');
const { query, Client } = require('faunadb');
const addDays = require('date-fns/addDays');
const format = require('date-fns/format');

const { Match, Paginate, Index } = query;

const NUM_PLACEHOLDERS = 6;

function addDaysSkipWeekends(date, numDays) {
  const newDate = addDays(date, numDays);
  const day = newDate.getDay();

  if (day === 6) {
    return addDays(newDate, 2);
  } else if (day === 0) {
    return addDays(newDate, 1);
  } else {
    return newDate;
  }
}

module.exports = async () => {
  const fauna = new Client({ secret: process.env.FAUNADB_SECRET_KEY });
  let response = await fauna.query(Paginate(Match(Index('all_days'))));

  let transformedData = response.data.map(([itemDate, state]) => {
    const date = new Date(Date.parse(itemDate));

    if (date.getDay() === 0 || date.getDay() === 6) { return null; }

    return { date, state };
  }).filter(Boolean);

  let lastDate = transformedData[transformedData.length - 1].date;
  // This is really not DST-compatible
  const nowInNZT = new Date(Date.now() + 12 * 60 * 60 * 1000);

  while (format(lastDate, 'yyyyMMdd') < format(nowInNZT, 'yyyyMMdd')) {
    lastDate = addDaysSkipWeekends(lastDate, 1);

    transformedData = transformedData.concat({
      date: lastDate,
      state: 'unknown',
    });
  }
  const placeholders = new Array(NUM_PLACEHOLDERS).fill(null).map(() => {
    lastDate = addDaysSkipWeekends(lastDate, 1);

    return {
      date: lastDate,
      state: 'upcoming',
    };
  });

  transformedData = transformedData.concat(placeholders);

  return transformedData;
};
