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
                fieldsResult.push({ ...fields[key], key });
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
 *          inputSource,
 *          isDate,
 *          testValue
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

async function generateCommonScript(descriptor) {
    const { id, fields } = descriptor;
    const inputSources = Array.from(new Set(fields.map(({ inputSource }) => inputSource)));
    const header = generateHeader(inputSources);
    const body = generateBody(fields);

    const result = header + body;

    try {
        await writeFile(`output/${id}`, `commonScript.js`, result);
    } catch (e) {
        console.error("Error found while creating a common script", e);
    }
}

function variantParamsReducer(accum, curr) {
    const { key, testValue, inputSource } = curr;
    if (!accum[inputSource]) {
        accum[inputSource] = {};
    }
    const levels = key.split(".");
    let last = accum[inputSource];
    levels.forEach((level, i) => {
        if (!last[level]) {
            last[level] = i === levels.length - 1 ? testValue : {};
        }
        last = last[level];
    });
    return accum;
}

async function generateVariantParams(descriptor) {
    const { id, fields } = descriptor;
    const variantParams = fields.reduce(variantParamsReducer, {});
    try {
        await writeFile(`output/${id}`, `variant.params.json`, JSON.stringify(variantParams, null, 2));
    } catch (e) {
        console.error("Error found while creating a variant params", e);
    }
}

module.exports = {  
    transform,
    createVariant,
    generateCommonScript,
    generateVariantParams
};