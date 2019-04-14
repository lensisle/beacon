const objectReplace = (target, replaceFn, ...args) => `
    ${replaceFn}(${target}, ${args.join()});
`;

module.exports = {
    objectReplace
};