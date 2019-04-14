const variable = require("../gen/templates/javascript/variable").variable;
const objectExist = require("../gen/templates/javascript/objectExist").objectExist;
const replace = require("./replacer").replace;
const writeFile = require("../writer/fileWriter").writeFileAsPromise;
const EOL = require('os').EOL;
/**
 * input:
 * "prefix": "OrderUseCase",
 * "fields": {
        "charges.amount.formattedAmount": {
            "pointer": 1
        },
        "friendlyTitle": {
            "pointer": 0
        }
    },
    "contents": [
        {
            "text": "your order for {0} is {1}",
            "ignores": []
        },
        {
            "text": "your order for {0}",
            "ignores": ["charges.amount.formattedAmount"]
        }
    ]

    return:
    [
        {
            id: "OrderUseCase",
            text: "your order for {0} is {1}",
            fields: [{ key: friendlyTitle, pointer: 0 }, { key: charges.amount.formattedAmount, pointer: 1 }]
        },
        {
            id: "OrderUseCaseWithoutFriendlyTitle",
            text: "your order for {0}",
            fields: [{ key: friendlyTitle, pointer: 0 }]
        }
    ]
 */

function uppercaseFirst(text) {
    return text.charAt(0).toUpperCase() + text.slice(1)
}

function formateFieldName(field) {
    if (field.includes(".")) {
        const parts = field.split(".");
        return uppercaseFirst(parts[parts.length - 1]);
    }
    return uppercaseFirst(field);
}

function generateId(prefix, ignores) {
    if (!ignores.length) {
        return prefix;
    }
    
    if (ignores.length === 2) {
        return prefix + "Without" + formateFieldName(ignores[0]) + "And" + formateFieldName(ignores[1]);
    }
    const result = [prefix, "Without"];
    ignores.forEach(key => {
        result.push(formateFieldName(key));
    });

    return result.join("");
}

function formatVariableContent(content) {
    return `"${content}"`;
}

function transform({ prefix, contents, fields }) {
    let result = [];
    const fieldKeys = Object.keys(fields);

    contents.forEach(({ text, ignores }) => {
        const fieldsResult = [];
        fieldKeys.forEach(key => {
            if (!ignores.includes(key)) {
                fieldsResult.push({
                    key,
                    pointer: fields[key].pointer,
                    inputSource: fields[key].inputSource
                });
            }
        });
        result.push({ id: generateId(prefix, ignores), text, fields: fieldsResult });
    });

    return result;
}

async function createVariant(descriptor) {
    const { id, text } = descriptor;
    const variant = replace(variable, "text", formatVariableContent(text));
    try {
        await writeFile(`output/${id}`, `variant.js`, variant);
    } catch (e) {
        console.error("Error found while creating a variant", e);
    }
}

function generateHeader(inputSources) {
    let result = ``;
    inputSources.forEach(inputSource => {
        result += objectExist(inputSource) + EOL;
    });
    return result;
}

async function generateCommonScript(descriptor) {
    const { id, text, fields } = descriptor;
    const inputSources = new Set(fields.map(({ inputSource }) => inputSource));
    const header = generateHeader(inputSources);
    try {
        await writeFile(`output/${id}`, `commonScript.js`, header);
    } catch (e) {
        console.error("Error found while creating a common script", e);
    }
    return descriptor;
}

function generatePrompt() {

}


module.exports = {  
    transform,
    createVariant,
    generateCommonScript
};