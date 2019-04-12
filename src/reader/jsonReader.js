function tryJSONparse(json) {
    try {
        const data = JSON.parse(json);
        return data;
    } catch (e) {
        console.error("Unable to parse json file", json);
    }
}

module.exports = {
    tryJSONparse
};