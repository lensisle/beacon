const objectExist = (sourceObject, outcome) => `if (typeof ${sourceObject} === 'undefined') { ${outcome} }`;

module.exports = {
    objectExist
};