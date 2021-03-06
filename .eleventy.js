const format = require('date-fns/format');

// Others (e.g. WFH) don't count towards the total
const ELIGIBLE_STATES = ['yes', 'no'];
const TIERS = [
  {
    threshold: 0,
    foregroundColor: 'black',
    backgroundColor: 'linear-gradient(#25d49d, #0CBB84)',
  },
  {
    threshold: 10,
    foregroundColor: 'black',
    backgroundColor: 'linear-gradient(#E63946, #D00000)',
  },
  {
    threshold: 20,
  },
];

function streaks(dayArray) {
  return dayArray.reduce(([current, max], day) => {
    const realState = day.state === 'everyoneelse' ? 'no' : day.state;

    const newCurrent = realState === 'no' ? 0 : (
      realState === 'yes' ? current + 1 : current
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

  config.addLiquidFilter('filterGhosts', dayArray => {
    return dayArray.filter(d => d.state !== 'ghost');
  });

  config.addLiquidFilter('nextTier', streak => {
    return TIERS.find(t => t.threshold > streak);
  });

  config.addLiquidFilter('currentTier', streak => {
    return TIERS.slice().reverse().find(t => t.threshold <= streak);
  });

  config.addLiquidFilter('yesPercentage', dayArray => {
    const [yes,elig] = dayArray.reduce(([yesCount,eligibleCount],c) => {
      return [yesCount + (c.state === 'yes' ? 1 : 0), eligibleCount + (ELIGIBLE_STATES.includes(c.state) ? 1 : 0)]
    }, [0, 0]);

    return Math.round(yes / elig * 100);
  });

  config.addLiquidFilter('chooseImage', (record, allStates) => {
    const options = allStates[record.state];

    if (Array.isArray(options)) {
      return options[(record.total - 1) % options.length];
    } else {
      return options;
    }
  });

  config.addLiquidFilter('cuteDate', date => {
    return format(date, 'MMMM do');
  });

  config.addLiquidFilter('weekday', date => {
    return format(date, 'EEEE').toLowerCase();
  });

  config.addPassthroughCopy({ "src/assets": "/" });

  return {
    dir: {
      input: "src",
      output: "dist",
    },
  };
}
