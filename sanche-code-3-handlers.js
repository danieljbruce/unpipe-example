/**
 * This example simulates a situation where there is delay on the data from the
 * server. The transform event occurs about 5 seconds after the BEFORE/AFTER
 * events so these programmatic hooks cannot capture the 1 second spent in the
 * handler.
 */

const { PassThrough, Readable  } = require('stream');

const startTime = Date.now();

function log(message) {
  const milliseconds = Date.now();
  console.log(`${message}. Log at ${milliseconds - startTime} milliseconds.`);
}

const dataEvents = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10
].map(i => i.toString());

class TimedStream extends PassThrough {
  constructor(options) {
    // highWaterMark of 1 is needed to respond to each row
    super({ ...options, highWaterMark: 1});
    this.startTime = 0n;
    this.totalDuration = 0n;
    this.handleBeforeRow = this.handleBeforeRow.bind(this);
    this.handleAfterRow = this.handleAfterRow.bind(this);
    this.on('before_row', this.handleBeforeRow);
    this.on('after_row', this.handleAfterRow);
  }

  _read(size) {
    log(`_read called`);
    super._read(size);
    this.emit('before_row');
    // Defer the after call to the next tick of the event loop
    process.nextTick(() => {
      this.emit('after_row');
    });
  }

  handleBeforeRow() {
    log(`[BEFORE]`);
    this.startTime = process.hrtime.bigint();
  }

  handleAfterRow() {
    const endTime = process.hrtime.bigint();
    const duration = endTime - this.startTime;
    this.totalDuration += duration;
    log(`[AFTER] - Row processing took ${duration / 1_000_000n} ms.`);
  }

  getTotalDurationMs() {
    return Number(this.totalDuration / 1_000_000n);
  }
}

async function main() {

  // set up streams
  function* numberGenerator(n) {
    for (let i = 0; i < n; i++) {
      yield String(i) + "\n";
    }
  }
  const sourceStream = PassThrough();
  const timedStream = new TimedStream({transform: (chunk, encoding, callback) => {
    log(`[TRANSFORM]`);
    callback(null, chunk);
  }});
  sourceStream.pipe(timedStream);

  log('--- Stream Started ---');

  setTimeout(async () => {
    // iterate stream
    timedStream.on('data', async (chunk) => {
      process.stdout.write(chunk.toString());
      // Simulate 1 second of busy work
      const startTime = Date.now();
      while (Date.now() - startTime < 1000) {}
    })
    timedStream.on('end', () => {
      // print results
      log('--- Stream Finished ---');
      const totalMilliseconds = timedStream.getTotalDurationMs();
      log(`\nTotal time spent between 'before_row' and 'after_row' events: ${totalMilliseconds} ms.`);
    });
  }, 500);

  setInterval(() => {
    if (dataEvents.length > 0) {
      const dataEvent = dataEvents.shift();
      sourceStream.write(dataEvent);
    }
  }, 5000)

}

main();
