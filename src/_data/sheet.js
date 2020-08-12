require('dotenv').config();
const Cache = require("@11ty/eleventy-cache-assets");
const addDays = require('date-fns/addDays');
const format = require('date-fns/format');

const { GOOGLE_SHEET_ID } = process.env;
const GOOGLE_SHEET_URL = `https://spreadsheets.google.com/feeds/list/${GOOGLE_SHEET_ID}/od6/public/values?alt=json`;
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
  let data = await Cache(GOOGLE_SHEET_URL, {
    duration: "1d",
    type: "json"
  });

  let transformedData = data.feed.entry.map(item => {
    const date = new Date(item.gsx$date.$t);

    if (date.getDay() === 0 || date.getDay() === 6) { return null; }

    return {
      date,
      state: item.gsx$state.$t,
    };
  }).filter(Boolean);

  let lastDate = transformedData[transformedData.length - 1].date;
  const nowInNZT = new Date(Date.now() - 12 * 60 * 60 * 1000);

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
