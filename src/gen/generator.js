const {
    variable,
    objectExist,
    textReplace,
    addText,
    addSsml,
    dateSsmlTag,
    ifCondition,
    assignVariable,
    fn
} = require("../gen/templates/javascript/all");
const writeFile = require("../writer/fileWriter").writeFileAsPromise;
const reader = require("../reader/fileReader");
const EOL = require('os').EOL;

async function createVariants(schemaProps) {
    const { id, variant } = schemaProps;
    let result = '//L10N_START' + EOL;
    variant.forEach((text, i) => {
        result += variable(`text_${i}`, `"${text}"`) + EOL;
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
        accum += objectExist(curr, "return;") + EOL;
        return accum;
    }, '') + EOL;
}

function generateSsmlTag(fields) {
    const result = fields.some(field => field.isDate) ? dateSsmlTag('DATE_SSML') : '';
    return result + (result.length ? EOL : '');
}

async function generatePartials(fields, resultOverrides = []) {
    const partials = fields.reduce((accum, curr) => {
        if (curr.partials) {
            accum.push(...curr.partials);
        }
        return accum;
    }, []);

    if (!partials.length) {
        return '';
    }

    // This prevents repeated partial declaration.
    const partialsUsed = new Set();

    let result = '';
    for (const partial of partials) {
        if (partialsUsed.has(partial)) {
            continue;
        }

        const path = "_" + partial + ".js";
        const file = await reader.readFileAsPromise(path);
        result += file + EOL;

        partialsUsed.add(partial);
    }

    if (resultOverrides.length) {
        result += fn("exist", "input", "return typeof input !== 'undefined' && input !== null;");
    }

    result += EOL;

    return result;
}

function createPartialsCall(inputSource, fieldKey, partials) {
    let callString = `${inputSource}.${fieldKey}`;
    for (const partial of partials) {
        callString = `${partial}(${callString})`;
    }
    return callString;
}

function createAccessors(fields) {
    if (fields.length === 0) { return []; }
    return fields.map(({ inputSource, key, partials = [] }) => createPartialsCall(inputSource, key, partials));
}

function shouldOverride(targetField, referenceFieldKey) {
    if (targetField === referenceFieldKey) {
        return true;
    }

    const targetArr = targetField.split(".");
    const referenceArr = referenceFieldKey.split(".");
    if (targetArr.length < referenceArr.length) {
        return false;
    }
    
    for (let i = 0, max = referenceArr.length; i < max; i++) {
        if (referenceArr[i] !== targetArr[i]) {
            return false;
        }
    }

    return true;
}

function createReplaceTarget(fields, resultOverrides) {
    let target = variable("variantTarget", "text_0");
    if (!resultOverrides) {
        return target;
    }

    target += EOL;

    for (let i = 0, max = resultOverrides.length; i < max; i++) {
        const resultOverride = resultOverrides[i];
        const { if: _if, is, use, join } = resultOverride;
        const isValidField = fields.some(({ key }) => shouldOverride(_if, key));
        if (!isValidField) {
            continue;
        }
        const shouldJoin = join && resultOverrides[i + 1];
        const isValue = typeof is === "string" ? `'${is}'` : is;
        const condition = ifCondition(`exist(${_if}) && ` + _if + " === " + isValue, assignVariable("variantTarget", use));
        target += condition;
        target += shouldJoin ? " else " : EOL;
    }
    
    target += EOL;

    return target;
}

function generateBody(fields, resultOverrides) {
    if (!fields.length) {
        return addText("text_0");
    }

    const replaceTarget = createReplaceTarget(fields, resultOverrides);
    const accessors = createAccessors(fields);
    const resultValue =  textReplace("variantTarget", "MessageFormat", "format", ...accessors);
    const resultAssign = variable("result", resultValue);

    let accumulator = "";
    accumulator += replaceTarget;
    accumulator += resultAssign;
    accumulator += accumulator.length ? EOL : '';

    const addCall = fields.some(field => field.isDate) ? addSsml : addText;
    accumulator += accumulator.length ? EOL : '';
    accumulator += addCall("result");

    return accumulator;
}

async function generateCommonScript(schemaProps, resultOverrides) {
    const { id, fields } = schemaProps;
    const inputSources = Array.from(new Set(fields.map(({ inputSource }) => inputSource)));
    const header = generateHeader(inputSources);
    const SsmlTag = generateSsmlTag(fields);
    const partials = await generatePartials(fields, resultOverrides);
    const body = generateBody(fields, resultOverrides);

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