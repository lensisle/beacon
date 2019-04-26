const fs = require('fs');
const path = require('path');

function readFileAsPromise(filepath) {
    return new Promise((res, rej) => {
        fs.readFile(path.resolve(filepath), 'utf8', function(err, contents) {
            if (err) {
                rej(err);
            }
            res(contents);
        });
    });
}

module.exports = {
    readFileAsPromise
};