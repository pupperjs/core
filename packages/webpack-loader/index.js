/**
 * pupper.js - Webpack Loader
 * @author Matheus Giovani <matheus@ad3com.com.br>
 * @license AGPL-3.0
 */

const Compiler = require("@pupperjs/compiler");

/**
 * @param {string} source The source file content
 * @param {CompilerOptions} options Any options to be passed to the pupper compiler
 * @returns {String}
 */
module.exports = function(source, options) {
    const contents = Compiler.createCompiler().compileToString(
        source,
        {
            ...options,
            pug: {
                filename: this.resourcePath
            }
        }
    );

    return contents;
};