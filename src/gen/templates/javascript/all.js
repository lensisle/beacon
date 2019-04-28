const addSsml = require("./addSsml").addSsml;
const addText = require("./addText").addText;
const concat = require("./concat").concat;
const concatAssign = require("./concat").concatAssign;
const fn = require("./function").fn;
const objectExist = require("./objectExist").objectExist;
const textReplace = require("./textReplace").textReplace;
const variable = require("./variable").variable;
const assignVariable = require("./variable").assignVariable;
const dateSsmlTag = require("./dateSsmlTag").dateSsmlTag;
const ifCondition = require("./ifCondition").ifCondition;

module.exports = {
    addSsml,
    addText,
    concat,
    concatAssign,
    fn,
    objectExist,
    textReplace,
    variable,
    dateSsmlTag,
    ifCondition,
    assignVariable
};