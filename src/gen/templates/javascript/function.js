const fn = (name, args, body) => `
function ${name}(${args}) {
    ${body}
}
`;

module.exports = {
    fn
};