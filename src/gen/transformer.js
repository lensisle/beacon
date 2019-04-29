
function uppercaseFirst(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function formateFieldName(field) {
    if (field.includes(".")) {
        const parts = field.split(".");
        return uppercaseFirst(parts[parts.length - 1]);
    }
    return uppercaseFirst(field);
}

function generateId(prefix, ignored, fields) {
    if (!ignored.length) {
        return prefix + "All";
    }

    if (ignored.length === fields.length) { return prefix + "Flat"; }

    const present = fields.filter(field => !ignored.includes(field));
    const targetArr = ignored.length > present.length ? present : ignored;
    const result = [prefix, targetArr === ignored ? "Without" : "WithOnly"];

    targetArr.forEach((key, i) => {
        const block = formateFieldName(key);
        result.push(i === targetArr.length - 1 && targetArr.length > 1
            ? "And" + block
            : block);
    });

    return result.join("");
}

function getTextPointers(text) {
    const matches = text.match(new RegExp(`@[0-9]`, 'gmi'));
    return matches ? matches.map(match => match.replace('@', '')) : [];
}

function strMapToObj(strMap) {
    let obj = Object.create(null);
    for (let [k,v] of strMap) {
        obj[k] = v;
    }
    return obj;
}

function cleanVariantText(text) {
    return text.replace(new RegExp(`@[0-9]`, 'gmi'), str => `{${str.replace('@', '')}}`);
}

function dataToSchemaProps({ prefix, fields, variants }) {
    const fieldsMap = new Map();
    let flatCount = 65;

    for(const content of variants) {
        const isContentArray = content instanceof Array;
        const pointers = new Set(getTextPointers(isContentArray ? '' : content));
        const fieldMatches = [];
        const ignored = [];
        const exposed = [];

        for (const key in fields) {
            if (pointers.has(fields[key].pointer + '')) {
                fieldMatches.push({ key, ...fields[key] });
            } else {
                ignored.push(key);
            }

            if (fields[key].expose) {
                exposed.push({ key, ...fields[key] });
            }
        }

        const key = fieldMatches.map(({ key }) => key).join(' ');
        if (key.length === 0) {
            fieldsMap.set("flat_" + flatCount, { 
                id: prefix + "Flat" + String.fromCharCode(flatCount),
                variant: isContentArray ? content.map(v => cleanVariantText(v)) : [cleanVariantText(content)],
                fields: fieldMatches,
                exposed
            });
            flatCount += 1;
        } else {
            if (!fieldsMap.has(key)) {
                fieldsMap.set(key, { 
                    id: generateId(prefix, ignored, Object.keys(fields)),
                    variant: [],
                    fields: fieldMatches,
                    exposed
                });
            }
            fieldsMap.get(key).variant.push(cleanVariantText(content));
        }
    }
    
    return Object.values(strMapToObj(fieldsMap));
}

module.exports = {
    dataToSchemaProps
};