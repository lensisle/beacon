const {
    variable,
    objectExist,
    textReplace,
    addText,
    addSsml,
    dateSsmlTag
} = require("../gen/templates/javascript/all");
const { replace, replaceAt } = require("./replacer");
const writeFile = require("../writer/fileWriter").writeFileAsPromise;
const reader = require("../reader/fileReader");
const EOL = require('os').EOL;

function formatVariableContent(content) {
    return `"${content}"`;
}

async function createVariants(schemaProps) {
    const { id, variant } = schemaProps;
    let result = '//L10N_START' + EOL;
    variant.forEach((text, i) => {
        result += replace(variable, `text_${i}`, formatVariableContent(text)) + EOL;
    });
    result += '//L10N_END' + EOL;
    try {
        await writeFile(`output/${id}/en-US`, `${id}-variant.js`, result);
    } catch (e) {
        console.error("Error found while creating a variant", e);
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

async function generateVariantParams(schemaProps) {
    const { id, fields } = schemaProps;
    const variantParams = fields.reduce(variantParamsReducer, {});
    try {
        await writeFile(`output/${id}/en-US`, `${id}.params.json`, JSON.stringify(variantParams, null, 2));
    } catch (e) {
        console.error("Error found while creating a variant params", e);
    }
}

function generateHeader(inputSources) {
    return inputSources.reduce((accum, curr) => {
        accum += objectExist(curr) + EOL;
        return accum;
    }, '') + EOL;
}

function generateSsmlTag(fields) {
    const result = fields.some(field => field.isDate) ? dateSsmlTag('DATE_SSML') : '';
    return result + EOL;
}

async function generatePartials(fields) {
    const partials = fields.reduce((accum, curr) => {
        if (curr.applyPartials) {
            accum.push(...curr.applyPartials);
        }
        return accum;
    }, []);

    if (!partials.length) {
        return '';
    }

    let result = '';
    for (const partial of partials) {
        const path = "_" + partial + ".js";
        const file = await reader.readFileAsPromise(path);
        result += file + EOL + EOL;
    }

    return result;
}

// TODO: FIX Assignation bugs and apply partial overriding
function generateBody(fields) {
    let accumulator = replaceAt(variable, "{0}", "result");
    const accessors = fields.map(({ inputSource, key, override }) => override ? override : inputSource + "." + key);
    accumulator = accessors.length
        ? replaceAt(accumulator, "{1}", textReplace("text", "MessageFormat", "format", ...accessors))
        : '';
    accumulator += EOL;
    const hasDates = fields.some(field => field.isDate);
    accumulator += hasDates ? addSsml("result") : addText("result");
    return accumulator;
}

async function generateCommonScript(schemaProps) {
    const { id, fields } = schemaProps;
    const inputSources = Array.from(new Set(fields.map(({ inputSource }) => inputSource)));
    const header = generateHeader(inputSources);
    const SsmlTag = generateSsmlTag(fields);
    const partials = await generatePartials(fields);
    const body = generateBody(fields);

    const result = header + SsmlTag + partials + body;

    try {
        await writeFile(`output/${id}`, `commonScript.js`, result);
    } catch (e) {
        console.error("Error found while creating a common script", e);
    }
}

module.exports = {
    createVariants,
    generateCommonScript,
    generateVariantParams
};