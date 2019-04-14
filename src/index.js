const { transform, createVariant, generateCommonScript } = require("./gen/generator");
const reader = require("./reader/jsonReader");
const loader = require("./loader/fileLoader");

let { argv } = process;
argv = argv.slice(2, argv.length);

function printHelp() {
    console.log(`Usage: beacon [INPUT_FOLDER | OUTPUT_FOLDER]
       beacon help`);
}

(async function execute() {
    try {
        const [input, output] = argv;

        if (input == "help" || argv.length != 2) {
          printHelp();
          return;
        }

        const files = await loader.readFolderAsPromise(input);

        for (let file of files) {
            const parsedFile = reader.tryJSONparse(file);
            const descriptors = transform(parsedFile);

            for (let descriptor of descriptors) {
                await createVariant(output, descriptor);
                await generateCommonScript(output, descriptor);
            }
        }
        console.log("Done!");
    } catch (e) {
        console.error(e);
    }
})()
