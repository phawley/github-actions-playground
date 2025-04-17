const fs = require("fs");
const path = require("path");

function openFilesInDirectory(changedFiles) {
  changedFiles.forEach((changedFile) => {
    const [fileName, fileStatus] = changedFile.split(" ");
    if (path.extname(fileName) !== ".json") {
      return;
    }
    fs.readFile(fileName, "utf8", (err, jsonString) => {
      if (err) {
        console.log("Error reading file: ", fileName, err);
        return;
      }
      try {
        let knapsackJSON = JSON.parse(jsonString);
        console.log("JSON data parsed for: ", fileName);
        if (!knapsackJSON.templates[0].length) {
          return;
        }
        const amplienceJSON = convertJSON(knapsackJSON);
        const componentName = fileName.match(
          /^knapsack\.pattern\.(.*)\.json$/
        )[1];
        fs.writeFile(
          `../amplience-json/${componentName}.json`,
          JSON.stringify(amplienceJSON, null, 2),
          (err) => {
            if (err) {
              console.log("Error writing file", jsonFile, err);
            } else {
              console.log("Successfully wrote file", jsonFile);
            }
          }
        );
      } catch (err) {
        console.log("Error parsing JSON string for: ", fileName, err);
      }
    });
  });
}

function convertJSON(knapsackJSON) {
  let propertiesObject = {};
  let amplienceJSON = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: `https://columbia.com/test-patrick/${knapsackJSON.id}.json`,
    title: knapsackJSON.title,
    description: knapsackJSON.description,
    allOf: [
      {
        $ref: "http://bigcontent.io/cms/schema/v1/core#/definitions/content",
      },
    ],
    type: "object",
  };

  for (const [key, value] of Object.entries(
    knapsackJSON.templates[0].spec.props.properties
  )) {
    let tempProps = {
      title: value["title"],
      type: value["type"],
    };

    let enumArray = [];
    value["enum"].map((entry) => {
      enumArray.push({ title: entry, const: entry });
    });
    tempProps["oneOf"] = enumArray;

    propertiesObject[key] = tempProps;
  }

  amplienceJSON["properties"] = propertiesObject;
  amplienceJSON["propertyOrder"] = knapsackJSON.templates[0].spec.propOrder;
}

function main() {
  return "Hello from knapsack2amplience!";
}

const result = main();
fs.writeFileSync(process.env.GITHUB_OUTPUT, `my_output=${result}\n`, { flag: 'a' });

// on: pull_request
// jobs:
//   process-last-commit-changes:
//     runs-on: ubuntu-latest
//     steps:
// - name: Checkout (fetch last two commits) of the PR
//   uses: actions/checkout@v4
//   with:
//     ref: ${{ github.event.pull_request.head.sha }}
//     fetch-depth: 2
//       - name: Process files changed in the current commit
//         run: |
//           changedFiles=$(git diff-tree --no-commit-id --name-status HEAD^ -r)
