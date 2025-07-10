/**
 * This code respresents a situation where all the data is ready for consumption.
 * It emits a BEFORE event with a bunch of TRANSFORM events in between and then
 * an AFTER event.
 */

const { PassThrough, Readable  } = require('stream');

const startTime = Date.now();

function log(message) {
  const milliseconds = Date.now();
  console.log(`${message}. Log at ${milliseconds - startTime} milliseconds.`);
}

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
  const sourceStream = Readable.from(numberGenerator(30));
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
    })
  }, 500);
}

main();
