const ifCondition = (condition, outcome) => `
if (${condition}) {
    ${outcome} 
}
`;

module.exports = {
    ifCondition
};