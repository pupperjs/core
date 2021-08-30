const pupper = require("../");
const fs = require("fs");
const beautify = require("js-beautify");

const result = beautify(
    pupper.compileToStringSync(fs.readFileSync(__dirname + "/template.pupper"))
);

fs.writeFileSync(__dirname + "/out/node.js", result);