// Node.js program to demonstrate the
// readable.unpipe() method

// Accessing fs module
const fs = require('fs');
const Stream = require('stream');

// Constructing readable stream
// const readable = fs.createReadStream("input.text");
const readableStream = fs.createReadStream('./read.txt');
const userStream = new Stream.Transform({
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
readableStream.pipe(firstDuplex);
firstDuplex.pipe(secondDuplex);
secondDuplex.pipe(userStream, {end: false});
secondDuplex.on('data', function (chunk) {
  // chunk.toString() // data1\ndata2\ndata3\n
  console.log('Getting data in handler');
  console.log(chunk.toString().split('\n'));
});
console.log("done");
