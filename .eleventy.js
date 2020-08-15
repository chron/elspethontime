const format = require('date-fns/format');

// Others (e.g. WFH) don't count towards the total
const ELIGIBLE_STATES = ['yes', 'no'];

function streaks(dayArray) {
  return dayArray.reduce(([current, max], day) => {
    if(day.state === 'upcoming') { return [current, max]; }

    const newCurrent = day.state === 'no' ? 0 : (
      day.state === 'yes' ? current + 1 : current
    );
    const newMax = Math.max(max, newCurrent);

    return [newCurrent, newMax];
  }, [0, 0]);
}

module.exports = function(config) {
  config.addLiquidFilter('currentStreak', dayArray => {
    const [current] = streaks(dayArray);
    return current;
  });

  config.addLiquidFilter('bestStreak', dayArray => {
    const [, best] = streaks(dayArray);
    return best;
  });

  config.addLiquidFilter('yesPercentage', dayArray => {
    const [yes,elig] = dayArray.reduce(([yesCount,eligibleCount],c) => {
      return [yesCount + (c.state === 'yes' ? 1 : 0), eligibleCount + (ELIGIBLE_STATES.includes(c.state) ? 1 : 0)]
    }, [0, 0]);

    return Math.round(yes / elig * 100);
  });


  config.addLiquidFilter('cuteDate', date => {
    return format(date, 'MMMM do');
  });

  config.addPassthroughCopy({ "src/assets": "/" });

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
