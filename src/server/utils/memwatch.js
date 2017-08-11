import memwatch from 'memwatch-next';
import process from 'process';

// eslint-disable-next-line global-require
require('heapdump');

/*
 * NOTES:
 *
 * Send SIGPIPE to force a garbage collection.
 * Send SIGUSR2 to create a heap dump.
 *
 * Ex: $ kill -USR2 <pid>
 */

const processStart = new Date();
const msFromStart = () => new Date() - processStart;

export const defaultOptions = {
  logLeaks: true,
  logGCStats: true,
  logHeapUsageEvery: 10,
  logHeapDiffInitialAfter: 120,
  logHeapDiffEndAfter: 60
};

export const doGC = () => {
  try {
    global.gc();
    console.log('<doGC>Manual GC performed.</doGC>');
  } catch (e) {
    console.warn("Warning: to GC, you must run program with 'node --expose-gc index.js'");
  }
};

process.on('SIGPIPE', doGC);

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
  doGC();
};

export default start;
