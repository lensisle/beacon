const {
    variable,
    objectExist,
    textReplace,
    addText
} = require("../gen/templates/javascript/all");
const { replace, replaceAt } = require("./replacer");
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

    returns:
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

function formatFieldName(field) {
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
        return prefix + "Without" + formatFieldName(ignores[0]) + "And" + formatFieldName(ignores[1]);
    }
    const result = [prefix, "Without"];
    ignores.forEach(key => {
        result.push(formatFieldName(key));
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
        result.push({ id: generateId(prefix, ignores), prefix, text, fields: fieldsResult });
    });

    return result;
}

async function createVariant(output, descriptor) {
    const { id, prefix, text } = descriptor;
    const variant = replace(variable, "text", formatVariableContent(text));
    try {
        await writeFile(`${output}/${prefix}/${id}`, `variant.js`, variant);
    } catch (e) {
        console.error("Error found while creating a variant", e);
    }
}

function generateHeader(inputSources) {
    return inputSources.reduce((accum, curr) => {
        accum += objectExist(curr) + EOL;
        return accum;
    }, '') + EOL;
}

/**
 * fields: [
 *      {
 *          key,
 *          pointer,
 *          inputSource
 *      }
 * ]
 */
function generateBody(fields) {
    let accumulator = replaceAt(variable, "{0}", "result");
    const accessors = fields.map(({ inputSource, key }) => inputSource + "." + key);
    accumulator = replaceAt(accumulator, "{1}", textReplace("text", "MessageFormat", "format", ...accessors));
    accumulator += EOL;
    accumulator += addText("result");
    return accumulator;
}

async function generateCommonScript(output, descriptor) {
    const { id, prefix, text, fields } = descriptor;
    const inputSources = Array.from(new Set(fields.map(({ inputSource }) => inputSource)));
    const header = generateHeader(inputSources);
    const body = generateBody(fields);

    const result = header + body;

    try {
        await writeFile(`${output}/${prefix}/${id}`, `commonScript.js`, result);
    } catch (e) {
        console.error("Error found while creating a common script", e);
    }
    return descriptor;
}

module.exports = {  
    transform,
    createVariant,
    generateCommonScript
};