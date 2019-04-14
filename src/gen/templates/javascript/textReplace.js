// example: MessageFormat.format(target, str1, str2, ...);
const textReplace = (target, replaceObj, replaceFn, ...args) => `${replaceObj}.${replaceFn}(${target}, ${args.join(", ")})`;

module.exports = {
    textReplace
};