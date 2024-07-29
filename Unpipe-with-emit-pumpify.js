const Stream = require('stream');
const fs = require('fs');
const pumpify = require('pumpify');

let rowStream;

class FirstDuplex extends Stream.Transform {
  constructor() {
    super({
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
  }

  emit(event, ...args) {
    const message = event === 'data' ? args[0].toString() : null;
    if (event === 'data') {
      this.lastEmitKey = args[0].toString();
    }
    console.log('> FirstDuplex.emit', event, message);
    return super.emit(event, ...args);
  }
  write(chunk, encoding, cb) {
    const message = `firstDuplex.write ${chunk.toString()}`;
    console.log(message);
    super.write(chunk, encoding, cb);
    // cb(null, chunk);
  }
}
class SecondDuplex extends Stream.Transform {
  constructor() {
    super({
      transform(
          row,
          _encoding,
          callback
      ) {
        console.log('In second Duplex transform');
        console.log(row.toString().split('\n'));
        callback(null, row);
      }
    });
  }
  write(chunk, encoding, cb) {
    const message = `SecondDuplex.write ${chunk.toString()}`;
    console.log(message);
    super.write(chunk, encoding, cb);
    // cb(null, chunk);
  }
  emit(event, ...args) {
    const message = event === 'data' ? args[0].toString() : null;
    if (event === 'data') {
      this.lastEmitKey = args[0].toString();
    }
    console.log('> SecondDuplex.emit', event, message);
    if (event === 'data' && args[0].toString() === 'j') {
      rowStream.unpipe(userStream2);
    }
    return super.emit(event, ...args);
  }
}

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
    // Displaying the chunk
  }
})
const firstDuplex = new FirstDuplex();
const secondDuplex = new SecondDuplex();
rowStream = pumpify.obj([firstDuplex, secondDuplex]);
const rowStreamEmitFn = rowStream.emit.bind(rowStream);
// const oldEmitFn = rowStream.emit;
rowStream.emit = (event, ...args) => {
  const message = event === 'data' ? args[0].toString() : null;
  setImmediate(() => {
    console.log('Event over > rowStream.emit', event, message);
  });
  console.log('> rowStream.emit', event, message);
  return rowStreamEmitFn(event, ...args);
  // return true;
};
const rowStreamWriteFn = rowStream.write.bind(rowStream);
rowStream.write = (chunk, encoding, cb) => {
  rowStreamWrite = chunk.id;
  const message = `rowStream.write ${chunk.id}`;
  setImmediate(() => {
    console.log(`Event over: ${message}`);
  });
  console.log(message);
  return rowStreamWriteFn(chunk, encoding, cb);
};
// readableStream.pipe(firstDuplex);
rowStream.on('data', function (chunk) {
  // chunk.toString() // data1\ndata2\ndata3\n
  console.log('Getting data in handler');
  console.log(chunk.toString().split('\n'));
});
rowStream.on('error', (error) => {
  console.log('Error occurred');
  console.log(error);
})
console.log("done");
class UserStream2 extends Stream.Transform {
  constructor() {
    super({
      transform(
          row,
          _encoding,
          callback
      ) {
        console.log('In User Stream 2 transform');
        console.log(row.toString().split('\n'));
        callback(null, row);
      }
    })
  }
  write(chunk, encoding, cb) {
    const message = `userstream2.write ${chunk.toString()}`;
    console.log(message);
    super.write(chunk, encoding, cb);
    // cb(null, chunk);
  }
  emit(event, ...args) {
    const message = event === 'data' ? args[0].toString() : null;
    console.log('> userstream2.emit', event, message);
    return super.emit(event, ...args);
  }
}
const userStream2 = new UserStream2();
rowStream.pipe(userStream2, {end: false});
async function doRead() {
  const rowsRead = []
  for await (const row of userStream2) {
    rowsRead.push(row);
  }
  console.log('rows read');
  console.log(rowsRead);
}
//doRead();

/*
write(chunk, encoding, cb) {
  const message = `userstream.write ${chunk.toString()}`;
  console.log(message);
  cb();
}
 */
// firstDuplex.pipe(userStream2);
