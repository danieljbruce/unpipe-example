const { Transform, Readable } = require('stream');
const { pipeline } = require('stream/promises');

const startTime = Date.now();

function log(message) {
  const milliseconds = Date.now();
  console.log(`${message}. Log at ${milliseconds - startTime} milliseconds.`);
}

// The custom stream, now using _transform to process each chunk
class TimedStream extends Transform {
  constructor(options) {
    super(options);
    this.totalDuration = 0n; // Use BigInt for high-resolution time
  }

  // _transform is called for each chunk of data passing through the stream
  _transform(chunk, encoding, callback) {
    const beforeTime = process.hrtime.bigint();
    log(`[BEFORE] - Processing chunk: ${chunk.toString().trim()}`);

    // Simulate 1 second of busy work for this chunk
    const startWorkTime = Date.now();
    while (Date.now() - startWorkTime < 1000) {
      // Blocking for 1 second
    }

    const afterTime = process.hrtime.bigint();
    const duration = afterTime - beforeTime;
    this.totalDuration += duration;

    log(`[AFTER] - Row processing took ${duration / 1_000_000n} ms.`);

    // Pass the chunk along to the next stream in the pipeline
    callback(null, chunk);
  }

  getTotalDurationMs() {
    // Convert BigInt nanoseconds to number milliseconds
    return Number(this.totalDuration / 1_000_000n);
  }
}

async function main() {
  log('--- Stream Started ---');

  // A simple Readable stream as the data source
  const sourceStream = Readable.from(['1\n', '2\n', '3\n', '4\n', '5\n']);

  const timedStream = new TimedStream();

  // The consumer just writes the data to stdout
  timedStream.on('data', (chunk) => {
    process.stdout.write(chunk.toString());
  });

  // Use the 'pipeline' utility to connect the streams and handle errors/completion
  await pipeline(sourceStream, timedStream);

  // This code runs after the pipeline is complete
  log('--- Stream Finished ---');
  const totalMilliseconds = timedStream.getTotalDurationMs();
  log(`\nTotal time spent processing rows: ${totalMilliseconds} ms.`);
}

main();
