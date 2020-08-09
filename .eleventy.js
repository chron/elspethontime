const format = require('date-fns/format');

function streaks(dayArray) {
  return dayArray.reduce(([current, max], day) => {
    if(day.state === 'upcoming') { return [current, max]; }

    const newCurrent = day.state === 'yes' ? current + 1 : 0;
    const newMax = Math.max(max, newCurrent);

    return [newCurrent, newMax];
  }, [0, 0]);
}

module.exports = function(config) {
  config.addLiquidFilter("currentStreak", dayArray => {
    const [current] = streaks(dayArray);
    return current;
  });

  config.addLiquidFilter("bestStreak", dayArray => {
    const [, best] = streaks(dayArray);
    return best;
  });

  config.addLiquidFilter('cuteDate', date => {
    return format(date, 'MMMM do');
  });

  config.addPassthroughCopy("src/assets");

  return {
    dir: {
      input: "src",
      output: "dist",
      //data: `_data/${env}`
    },
    // templateFormats : ["njk"],
    // htmlTemplateEngine : "njk",
    // markdownTemplateEngine : "njk"
  };
}
