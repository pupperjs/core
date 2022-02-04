/**
 * pupper.js - Webpack Loader
 * @author Matheus Giovani <matheus@ad3com.com.br>
 * @license AGPL-3.0
 */

const pupper = require("../..");

/**
 * @param {string} source The source filename
 * @param {import("../../types/pupper").Compiler.Options} options Any options to be passed to the pupper compiler
 * @returns {String}
 */
module.exports = function(source, options) {
    const contents = pupper.compileToStringSync(source, {
        ...options,
        pug: {
            filename: this.resourcePath
        }
    });

    return contents;
};