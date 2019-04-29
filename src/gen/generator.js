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
    const { key, testValue = '', inputSource } = curr;
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

function isValidPartialCode(file, partial) {
    try {
        eval(file);
        return true;
    } catch (e) {
        if (e instanceof SyntaxError) {
            console.error(`Partial ${partial} has invalid javascript!`);
        }
        return false;
    }
}

async function generatePartials(fields, variant, resultOverrides = []) {
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
        if (!isValidPartialCode(file, partial)) {
            continue;
        }
        result += file + EOL;

        partialsUsed.add(partial);
    }

    // if only 1 variant text exist there's no need for 
    // result overrides.
    if (variant.length < 2) {
        result += EOL;
        return result;
    }

    if (resultOverrides.length) {
        const condition = "return typeof input !== 'undefined' && input !== null;";
        result += fn("exist", "input", condition);
    }

    if (resultOverrides.length && resultOverrides.some(ro => ro.vehicle)) {
        const condition = "return typeof inVehicleMode !== 'undefined' && inVehicleMode === true;";
        result += fn("isInVehicleMode", null, condition);
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

function getInputSourceForField(target, fields, exposed) {
    const inputSourceFields = fields.filter(({ key }) => key === target);
    const inputSourceExposed = exposed.filter(({ key }) => key === target);
    let inputSource;
    if (inputSourceFields.length > 0) {
        inputSource = inputSourceFields[0].inputSource;
    }
    if (!inputSource && inputSourceExposed.length > 0) {
        inputSource = inputSourceExposed[0].inputSource;
    }

    if (!inputSource) {
        console.error("Error trying to evaluate a condition using an unknown field:", 
            target, "(Maybe you forgot to define and expose it?)");
    }

    return inputSource;
}

function createReplaceTarget(fields, variant, resultOverrides, exposed) {
    let target = variable("variantTarget", "text_0");
    if (!resultOverrides || variant.length < 2) {
        target += EOL;
        return target;
    }

    target += EOL;

    for (let i = 0, max = resultOverrides.length; i < max; i++) {
        const resultOverride = resultOverrides[i];
        const { if: _if, is, use, join, vehicle } = resultOverride;
        if (!_if && !is && !vehicle && !join && use) {
            target += `{ ${assignVariable("variantTarget", use)} }`;
            continue;
        }
        const isValidField = fields.some(({ key }) => shouldOverride(_if, key));
        if (!isValidField && !vehicle) {
            continue;
        }
        
        const inputSource = getInputSourceForField(_if, fields, exposed);
        const ifAccessor = `${inputSource}.${_if}`;
        const shouldJoin = join && resultOverrides[i + 1];
        const isValue = typeof is === "string" ? `'${is}'` : is;
        const nonNullCheck = _if ? `exist(${ifAccessor})` : '';
        const vehicleCheck = vehicle ? `isInVehicleMode()` : '';
        const valueCheck = _if && is ? `${ifAccessor} === ${isValue}` : '';
        const condStr = [nonNullCheck, vehicleCheck, valueCheck].filter(c => c !== '').join(' && ');
        const condition = ifCondition(`${condStr}`, assignVariable("variantTarget", use));
        target += condition;
        target += shouldJoin ? EOL + " else " : EOL;
    }
    
    target += EOL;

    return target;
}

function generateBody(fields, variant, resultOverrides, exposed) {
    if (variant.length < 2) {
        return addText("text_0");
    }

    const replaceTarget = createReplaceTarget(fields, variant, resultOverrides, exposed);
    const accessors = createAccessors(fields);
    const resultValue = accessors.length 
        ? textReplace("variantTarget", "MessageFormat", "format", ...accessors)
        : "variantTarget";
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

function getInputSources(fields = [], exposed = []) {
    return Array.from(new Set((fields.concat(exposed)).map(({ inputSource }) => inputSource)));
}

async function generateCommonScript(schemaProps, resultOverrides) {
    const { id, fields, variant, exposed } = schemaProps;
    const inputSources = getInputSources(fields, exposed);
    const header = generateHeader(inputSources);
    const SsmlTag = generateSsmlTag(fields);
    const partials = await generatePartials(fields, variant, resultOverrides);
    const body = generateBody(fields, variant, resultOverrides, exposed);

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