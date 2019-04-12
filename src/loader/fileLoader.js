const fs = require('fs');

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

module.exports = {
    readFileAsPromise
};