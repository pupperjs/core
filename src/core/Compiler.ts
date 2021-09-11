import pug from "pug";
import fs from "fs";
import path from "path";
import Renderer from "./Renderer";
import Lexer from "./compiler/Lexer";
import Parser from "./compiler/Parser";

export namespace Compiler {
    export interface Options {
        /**
         * If set to true, the function source will be included in the compiled template
         * for better error messages. It is not enabled by default.
         */
        debug?: boolean,

        /**
         * Any configurations to be passed to pug
         */
        pug?: pug.Options
    }
}

export default class PupperCompiler {
    /**
     * Compiles a single template file
     * @param file The file to be compiled
     * @returns
     */
    public compileSync(file: string, options: Compiler.Options = {}): Renderer {
        return this.compile(fs.readFileSync(file, "utf8"), {
            pug: {
                basedir: path.dirname(file),
                filename: file,
            }
        });
    }

    public compile(template: string, options: Compiler.Options = {}): Renderer {
        const parser = new Parser();

        try {
            return new Renderer(
                pug.compile(template, {
                    name: "pupper",
                    compileDebug: options.debug || false,
                    // Always use self to prevent conflicts with other compilers
                    self: true,
                    // @ts-ignore
                    plugins: [{
                        lex: new Lexer(),
                        preParse: parser.preParse.bind(this),
                        postParse: parser.postParse.bind(this)
                    }],
                    ...options.pug || {}
                })
            );
        } catch(e) {
            throw (options.debug ? e : new Error("Failed to compile template:" + e.message));
        }
    }

    /**
     * Compiles to a string
     * @param template The template to be compiled
     * @param options 
     * @returns 
     */
    public compileToString(template: string, options: Compiler.Options = {}): string {
        const parser = new Parser();

        try {
            const rendered =  pug.compileClient(template, {
                name: "pupper",
                compileDebug: options.debug || false,
                // Always use self to prevent conflicts with other compilers
                self: true,
                // @ts-ignore
                plugins: [{
                    lex: new Lexer(),
                    preParse: parser.preParse.bind(this),
                    preLoad: parser.postParse.bind(this)
                }],
                ...options.pug || {}
            });

            return /*javascript*/`
                ${rendered}
                module.exports = pupper;
            `;
        } catch(e) {
            throw (options.debug ? e : new Error("Failed to compile template:" + e.message));
        }
    }
}