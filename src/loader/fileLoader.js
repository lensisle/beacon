const fs = require('fs');
const path = require('path');

function readFileAsPromise(filepath) {
    return new Promise((res, rej) => {
        fs.readFile(filepath, 'utf8', function(err, contents) {
            if (err) {
                rej(err);
            }
            res(contents);
        });
    });
}

function readFolderAsPromise(_path) {
  let absolutePath = path.resolve(_path);
  return new Promise((res, rej) => {
    fs.readdir(absolutePath, (err, files) => {
      if (err) {
        rej(err);
        return;
      }
      Promise.all(
        files.map(file => readFileAsPromise(`${absolutePath}/${file}`))
      )
      .then(res)
      .catch(rej);
    });
  });
}

module.exports = {
    readFileAsPromise,
    readFolderAsPromise
};