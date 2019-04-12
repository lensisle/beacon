const filterField = (expectation, arr) => key => arr[key].expect === expectation;
const mapField = arr => key => ({ expect: arr[key].expect, pointer: arr[key].pointer, key });

function translate(payload) {
    const { content, fields } = payload;

    const filterRequired = filterField("required", fields);
    const filterOptional = filterField("optional", fields);

    const createField = mapField(fields);

    const required = Object.keys(fields)
        .filter(filterRequired)
        .map(createField);

    const optional = Object.keys(fields)
        .filter(filterOptional)
        .map(createField);

    return {
        required,
        optional,
        content
    };
}

function generateVariant(content) {

}

function generateCommonScript() {

}

function generatePrompt() {

}


module.exports = {  
    translate
};