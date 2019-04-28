const fn = (name, args, body) => `
function ${name}(${args ? args : ''}) {
    ${body}
}
`;

module.exports = {
    fn
};