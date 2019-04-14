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

function replaceAt(source, target, replacement) {
    return source.replace(target, replacement);
}

module.exports = {
    replace,
    replaceAt
};