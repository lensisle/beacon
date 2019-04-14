const objectExist = sourceObject => `
    if (typeof ${sourceObject} !== 'undefined') {
        return;
    }
`;

module.exports = {
    objectExist
};