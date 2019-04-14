const concat = (a, b) => `${a} + ${b}`;

const concatAssign = (varName, a, b) => `var ${varName} = ${a} + ${b};`;

module.exports = {
    concat,
    concatAssign
};