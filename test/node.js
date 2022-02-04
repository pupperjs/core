const pupper = require("../");
const fs = require("fs");
const beautify = require("js-beautify");

const result = beautify(
    pupper.compileToStringSync(fs.readFileSync(__dirname + "/templates/template.pupper"), {
        debug: true,
        pug: {
            filename: __dirname + "/templates/template.pupper"
        }
    })
);

fs.writeFileSync(__dirname + "/out/node.js", result);