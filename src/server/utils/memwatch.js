import memwatch from 'memwatch-next';

// eslint-disable-next-line global-require
require('heapdump');

const processStart = new Date();
const msFromStart = () => new Date() - processStart;

export const defaultOptions = {
  logLeaks: true,
  logGCStats: true,
  logHeapUsageEvery: 10,
  logHeapDiffInitialAfter: 120,
  logHeapDiffEndAfter: 60
};

const memwatchLog = (event, obj) => {
  console.log(`<${event}>`);
  console.log(JSON.stringify(obj, null, 2));
  console.log(`/<${event}>`);
};

const logLeak = (info) => memwatchLog('memwatchLeak', info);
const logGCStats = (stats) => memwatchLog('memwatchGCStats', stats);
const logDiff = (diff) => memwatchLog('memwatchHeapDiff', diff);
const logHeapUsage = () => memwatchLog('memwatchHeapUsage',
  {uptimeMs: msFromStart(), memoryUsage: process.memoryUsage().heapUsed});

const start = (options = defaultOptions) => {
  let hd;

  if (options.logLeaks) {
    memwatch.on('leak', logLeak);
  }
  if (options.logGCStats) {
    memwatch.on('stats', logGCStats);
  }
  if (options.logHeapUsageEvery > 0) {
    setInterval(logHeapUsage, options.logHeapUsageEvery * 1000);
  }
  if (options.logHeapDiffInitialAfter > 0) {
    hd = new memwatch.HeapDiff();
    setTimeout(() => {
      hd = new memwatch.HeapDiff();
      console.log(`<memwatchHeapDiff
  message="snapshot taken!"
  endSec="${options.logHeapDiffEndAfter}"`);
    }, options.logHeapDiffInitialAfter * 1000);
  }
  if (options.logHeapDiffEndAfter > 0) {
    setTimeout(() => logDiff(hd.end()),
      (options.logHeapDiffInitialAfter + options.logHeapDiffEndAfter) * 1000
    );
  }

  // force garbage collection after initialization is finished
  try {
    global.gc();
  } catch (e) {
    console.log("You must run program with 'node --expose-gc index.js' or 'npm start'");
    process.exit();
  }
};

export default start;
