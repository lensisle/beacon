function replace(text, ...replacements) {
    if (replacements.length < 1) {
        return text;
    }
    let result = text;
    replacements.forEach(replacement => {
        result = result.replace(/\{[0-9]}/, replacement);
    });
    return result;
}

function replaceAt(text, target) {
    return result.replace(target, text);
}

module.exports = {
    replace,
    replaceAt
};