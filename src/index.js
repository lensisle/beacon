const {
    createVariants,
    generateCommonScript,
    generateVariantParams
} = require("./gen/generator");
const {
    dataToSchemaProps
} = require("./gen/transformer");
const parser = require("./parser/jsonParser");
const reader = require("./reader/fileReader").readFileAsPromise;

const filePath = process.argv[2];

if (!filePath) {
    console.error("Error! a filepath must be provided to run this script.");
    return;
}

if (!filePath.endsWith(".json")) {
    console.log("Error! a json file is required for now as entry input");
}

async function execute() {
    try {
        const file = await reader(filePath);
        if (!file) {
            console.error("Error! file loaded doesn't have data or it couldn't   be readed");
            return;
        }

        const parsedFile = parser.tryJSONparse(file);
        const schemaProps = dataToSchemaProps(parsedFile);
        const { resultOverrides } = parsedFile;

        schemaProps.forEach(async (prop) => {
            await createVariants(prop);
            await generateVariantParams(prop);
            await generateCommonScript(prop, resultOverrides);
        });
    } catch (e) {
        console.log(e);
    }
}

execute().then((res) => console.log("done!"));
