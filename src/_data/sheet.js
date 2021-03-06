require('dotenv').config();
const { query, Client } = require('faunadb');
const addDays = require('date-fns/addDays');
const format = require('date-fns/format');

const { Match, Paginate, Index, Let, Filter, Lambda, LTE, Var } = query;

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
  const cutoffDate = new Date(2021, 0, 14);

  const fauna = new Client({ secret: process.env.FAUNADB_SECRET_KEY });
  let response = await fauna.query(
    Let(
      { cutoff: query.Date(format(cutoffDate, 'yyyy-MM-dd')) },
      Filter(
        Paginate(Match(Index('all_days')), { size: 10000 }),
        Lambda(["date", "state"], LTE(query.Date(Var("date")), Var("cutoff")))
      )
    )
  );

  let transformedData = response.data.map(([itemDate, state]) => {
    const date = new Date(Date.parse(itemDate));

    if (date.getDay() === 0 || date.getDay() === 6) { return null; }

    return { date, state };
  }).filter(Boolean);

  let lastDate = transformedData[transformedData.length - 1].date;

  while (format(lastDate, 'yyyy-MM-dd') < format(cutoffDate, 'yyyy-MM-dd')) {
    lastDate = addDaysSkipWeekends(lastDate, 1);

    transformedData = transformedData.concat({
      date: lastDate,
      state: 'unknown',
    });
  }

  // lastDate = addDaysSkipWeekends(lastDate, 1);
  // transformedData = transformedData.concat([{ date: lastDate, state: 'everyoneelse' }]);

  // Add placeholder squares to the end so we always have a full week
  while(format(lastDate, 'i') < 5) {
    lastDate = addDaysSkipWeekends(lastDate, 1);

    transformedData = transformedData.concat({
      date: lastDate,
      state: 'ghost',
    });
  }

  // Decorate all entries with a run attribute which is an integer number of
  // consecutive days with the same state, as well as a total for that state
  // at that point in time.
  let currentState, currentRun;
  let totalForState = {};

  transformedData = transformedData.map(d => {
    if (d.state === currentState) {
      currentRun += 1;
    } else {
      currentRun = 1;
      currentState = d.state;
    }

    if (totalForState[d.state] === undefined) { totalForState[d.state] = 0; }
    totalForState[d.state] += 1;

    return { ...d, run: currentRun, total: totalForState[d.state] };
  })

  return transformedData;
};
