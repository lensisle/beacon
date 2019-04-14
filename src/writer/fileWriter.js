const fs = require('fs');
const path = require('path');

function ensureDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

function writeFileAsPromise(targetPath, filename, text) {
    ensureDirectoryExistence(path.join(targetPath));
    const writePath = path.join(targetPath, filename);
    return new Promise((res, rej) => {
        fs.writeFile(writePath, text, function(err) {
            if(err) {
                rej(err);
            }

            res();
        }); 
    });
}

module.exports = {
    writeFileAsPromise
};