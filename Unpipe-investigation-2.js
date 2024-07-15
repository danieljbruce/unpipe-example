// Here we

// Accessing fs module
const fs = require('fs');
const Stream = require('stream');

// Task: Emit a data event and then have an error get emitted

// Constructing readable stream
// const readable = fs.createReadStream("input.text");
const readableStream = fs.createReadStream('./read.txt');
readableStream.on('readable', () => {
  let chunk;
  // Using while loop and calling
  // read method with parameter
  while (null !== (chunk = readableStream.read(1))) {
    console.log(`read: ${chunk}`);
    const chunkName = chunk;
    setImmediate(() => {
      console.log(`event added before chunk write ${chunkName}`);
    });
    firstDuplex.write(chunk);
    /*
    if (chunk.toString() === '2') {
      firstDuplex.emit('error', new Error('Error occurred'));
    }
     */
    // Displaying the chunk
  }
})
const userStream = new Stream.Transform({
  readableHighWaterMark: 0,
  writableHighWaterMark: 0,
  transform(
      row,
      _encoding,
      callback
  ) {
    console.log('In User Stream transform');
    console.log(row.toString().split('\n'));

    callback(null, row);
  }
});
const firstDuplex = new Stream.Transform({
  transform(
      row,
      _encoding,
      callback
  ) {
    console.log('In first Duplex transform');
    console.log(row.toString().split('\n'));
    /*
    console.log(process._getActiveRequests())
    process._getActiveRequests().forEach((req) => {
      req.oncomplete(() => {
        console.log('Request completed');
      })
    })
     */
    callback(null, row);
  }
});
const secondDuplex = new Stream.Transform({
  transform(
      row,
      _encoding,
      callback
  ) {
    console.log('In second Duplex transform');
    console.log(row.toString().split('\n'));
    callback(null, row);
  }
})
// readableStream.pipe(firstDuplex);
firstDuplex.pipe(secondDuplex);
secondDuplex.pipe(userStream, {end: false});
secondDuplex.on('data', function (chunk) {
  // chunk.toString() // data1\ndata2\ndata3\n
  console.log('Getting data in handler');
  console.log(chunk.toString().split('\n'));
});
secondDuplex.on('error', (error) => {
  console.log('Error occurred');
  console.log(error)
})
console.log("done");
setImmediate(() => {
  console.log('ending program');
})
