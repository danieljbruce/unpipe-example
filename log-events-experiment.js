// Accessing fs module
const fs = require('fs');
const readline = require('readline');
const Stream = require('stream');
const dataEvents = [];

const startTime = Date.now();

function log(message) {
  const milliseconds = Date.now();
  console.log(`${message} at ${milliseconds - startTime} milliseconds.`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Constructing readable stream and then for each line from the input data we
// push a row onto the dataEvents array which will be sent to the stream
// pipeline at a specific time. ie. The next row gets sent to the stream
// pipeline every 5 seconds.
const readableStream = fs.createReadStream('./read.txt');
const rl = readline.createInterface({
  input: readableStream,
  crlfDelay: Infinity // This option allows handling '\r\n' and '\n' line endings equally
});
rl.on('line', (row) => {
  log(`${row.toString()} Pushing line`);
  dataEvents.push(row);
});

// In the first second we push 20 rows onto the stream pipeline to create
// backpressure. This creates a realistic situation we see in our stream
// pipelines so that we can see how streams behave.
setTimeout(() => {
  for (let i = 0; i < 20; i++) {
    pushDataEvent();
  }
}, 500);

// This class provides logging for the user stream so that we can log
// behavior when a read happens.
class TransformWithReadHook extends Stream.PassThrough {
  lastTransformRow = '';
  readHook;
  constructor(opts) {
    super(opts);
    this.readHook = () => {
      log(`${this.lastTransformRow.toString()} In read hook`);
    };
  }

  read(size) {
    if (this.readHook) {
      this.readHook();
    }
    return super.read(size);
  }
}

// This is what a user stream looks like in our client libraries. This is the
// stream that the user will iterate through.
const userStream = new TransformWithReadHook({
  readableHighWaterMark: 0,
  writableHighWaterMark: 0,
  transform(
      row,
      _encoding,
      callback
  ) {
    log(`${row.toString()} In user stream transform`);
    this.lastTransformRow = row.toString();
    callback(null, row);
  }
});

// This function simulates what happens when a new data event arrives from the
// server. Basically we push the event onto the transform that feeds into the
// user stream to simulate a common pattern in our client libraries.
function pushDataEvent() {
  log('pushing data event');
  log(`data events length: ${dataEvents.length}`);
  if (dataEvents.length > 0) {
    const dataEvent = dataEvents.shift();
    secondDuplex.write(dataEvent);
  }
}

// To create a realistic situation where the edge cases can be analyzed easily
// we emit a data event every 5 seconds so we can see the behavior of the loop
// when there is a delay.
setInterval(() => {
  pushDataEvent();
}, 5000)

// Create the transform that feeds directly into the user stream.
const secondDuplex = new Stream.Transform({
  transform(
      row,
      _encoding,
      callback
  ) {
    log(`${row.toString()} In second Duplex transform`);
    callback(null, row);
  }
});
secondDuplex.pipe(userStream, {end: false});

// After 12 seconds the user's code hits the for loop that iterates through
// the stream. We log events as it iterates through the stream and look at the
// timestamps it produces.
setTimeout(async () => {
  log('running set timeout');
  for await (const row of userStream) {
    log(`in loop ${row}`);
    // Pretend the loop takes a full second to run
    // This simulates a realistic situation that could happen with a for loop
    // and also lets us see where this time is consumed in the logging.
    await sleep(1000);
  }
  log(`finished loop`);
}, 12000); // Suppose we encounter the loop when 2 events are queued
