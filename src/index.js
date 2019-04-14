const {
    transform,
    createVariant,
    generateCommonScript,
    generateVariantParams
} = require("./gen/generator");
const reader = require("./reader/jsonReader");
const loader = require("./loader/fileLoader").readFileAsPromise;

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
        const file = await loader(filePath);
        if (!file) {
            console.error("Error! file loaded doesn't have data or could be readed");
            return;
        }

        const parsedFile = reader.tryJSONparse(file);
        const descriptors = transform(parsedFile);

        descriptors.forEach(async (descriptor) => {
            await createVariant(descriptor);
            await generateCommonScript(descriptor);
            await generateVariantParams(descriptor);
        });

    } catch (e) {
        console.log(e);
    }
}

execute().then((res) => console.log("done!"));
