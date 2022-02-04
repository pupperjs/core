import pug from "pug";
import fs from "fs";
import path from "path";

import { Renderer } from "./Renderer";
import Plugin from "./compiler/Plugin";

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
     * Compiles a single template file into a renderer instance
     * @param file The file to be compiled
     * @returns
     */
    public compileFile(file: string, options: Compiler.Options = {}): Renderer {
        return this.compile(fs.readFileSync(file, "utf8"), {
            ...options,
            pug: {
                basedir: path.dirname(file),
                filename: file,
            }
        });
    }

    /**
     * Parses the compiler options into pug options
     * and put our plugins into it
     * @param options The compiler options
     * @returns 
     */
    private getPugOptions(options: Compiler.Options = {}): pug.Options {
        // Create a new parser for this pug instance
        const parser = new Plugin();

        return {
            name: "pupper",
            filename: "pupper.pug",
            compileDebug: options.debug || false,
            // Always use self to prevent conflicts with other compilers
            self: true,
            // @ts-ignore
            plugins: [parser],
            ...options.pug || {}
        };
    }

    /**
     * Compiles a template string into a renderer instance
     * @param template The template string to be compiled
     * @param options The compiler options
     * @returns 
     */
    public compile(template: string, options: Compiler.Options = {}): Renderer {
        

        try {
            return new Renderer(
                pug.compile(template, this.getPugOptions(options))
            );
        } catch(e) {
            throw (options.debug ? e : new Error("Failed to compile template:" + e.message));
        }
    }

    /**
     * Compiles a template string to a string
     * @param template The template to be compiled
     * @param options 
     * @returns 
     */
    public compileToString(template: string, options: Compiler.Options = {}): string {
        const parser = new Plugin();

        try {
            const rendered =  pug.compileClient(template, this.getPugOptions(options));

            return /*javascript*/`
                ${rendered}
                module.exports = pupper;
            `;
        } catch(e) {
            throw (options.debug ? e : new Error("Failed to compile template:" + e.message));
        }
    }
}