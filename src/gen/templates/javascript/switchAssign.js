// cases: [{ val, result }, ...]
const switchAssign = (afterName, defaultValue, switchTarget, cases) => `
    var ${afterName} = ${defaultValue};
    switch (${switchTarget}) {
        ${cases.map(({ val, result }) => {
            return `case ${val}: 
                        ${afterName} = ${result};
                        break
                    `;
        })}
        default:
            ${afterName} = ${defaultValue};
            break;
    }
`;

module.exports = {
    switchAssign
};