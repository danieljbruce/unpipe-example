const Stream = require('stream');
const fs = require('fs');

class UserStream extends Stream.Transform {
  constructor() {
    super({
      transform(
          row,
          _encoding,
          callback
      ) {
        console.log('In User Stream transform');
        console.log(row.toString().split('\n'));
        callback(null, row);
      }
      /*
      write(chunk, encoding, cb) {
        const message = `userstream.write ${chunk.toString()}`;
        console.log(message);
        cb();
      }
       */
    })
  }
  write(chunk, encoding, cb) {
    const message = `userStream.write ${chunk.key}`;
    setImmediate(() => {
      console.log(`Event over: ${message}`);
    });
    console.log(message);
    return super.write(chunk, encoding, cb);
  }
  emit(event, ...args) {
    const message = event === 'data' ? args[0].id : null;
    if (event === 'data') {
      this.lastEmitKey = args[0].id;
    }
    console.log('> userStream.emit', event, message);
    return super.emit(event, ...args);
  }
}

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
    if (event === 'data' && args[0].toString() === '2') {
      firstDuplex.unpipe(userStream2);
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
const userStream = new UserStream();
const userStream2 = new Stream.Transform({
  transform(
      row,
      _encoding,
      callback
  ) {
    console.log('In User Stream 2 transform');
    console.log(row.toString().split('\n'));
    callback(null, row);
  },
  construct(callback) {
    console.log('constructing')
    callback();
  },
  /*
  write(chunk, encoding, cb) {
    const message = `userstream2.write ${chunk.toString()}`;
    console.log(message);
    // cb(null, chunk);
  },
   */
  writev(chunks, callback) {
    const message = `userstream2.writev ${chunks.toString()}`;
    console.log(message);
    callback(null, chunks);
  }
});
/*
write(chunk, encoding, cb) {
  const message = `userstream.write ${chunk.toString()}`;
  console.log(message);
  cb();
}
 */
firstDuplex.pipe(userStream2);
