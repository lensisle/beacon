// cases: [{ val, result }, ...]
const switchAssign = (defaultValue, switchTarget, cases) => `
    var after = ${defaultValue};
    switch (${switchTarget}) {
        ${cases.map(({ val, result }) => {
            return `case ${val}: 
                        after = ${result};
                        break
                    `;
        })}
        default:
            after = ${defaultValue};
            break;
    }
`;

module.exports = {
    switchAssign
};