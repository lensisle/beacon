const variable = (varName, value) => `var ${varName} = ${value};`;
const assignVariable = (varName, value) => `${varName} = ${value};`;

module.exports = { 
    variable,
    assignVariable
};