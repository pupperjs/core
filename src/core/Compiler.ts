import pug from "pug";
import fs from "fs";
import path from "path";

import { CompiledTemplate, Renderer } from "./Renderer";
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
     * Compiles a template string into a renderer instance
     * @param template The template string to be compiled
     * @param options The compiler options
     * @returns 
     */
    public compile(template: string, options: Compiler.Options = {}): Renderer {
        try {
            return new Renderer(
                pug.compile(template, this.getPugOptions(options)) as CompiledTemplate
            );
        } catch(e) {
            throw (options.debug ? e : new Error("Failed to compile template:" + e.message));
        }
    }

    /**
     * Compiles a single template file into a renderer instance
     * @param file The file to be compiled
     * @returns
     */
    public compileFile(file: string, options: Compiler.Options = {}): Renderer {
        const pugOptions = this.getPugOptions(options);
        pugOptions.basedir = path.dirname(file);
        pugOptions.filename = file;

        return this.compile(fs.readFileSync(file, "utf8"), pugOptions);
    }

    /**
     * Compiles a pupper template to a Javascript module
     * @param template The template to be compiled
     * @param options 
     * @returns 
     */
    public compileToString(template: string, options: Compiler.Options = {}): string {
        try {
            const pugOptions = this.getPugOptions(options);
            const rendered = pug.compileClient(template, pugOptions);

            return /*javascript*/`
                ${rendered}
                module.exports = ${pugOptions.name};
            `;
        } catch(e) {
            throw (options.debug ? e : new Error("Failed to compile template:" + e.message));
        }
    }

    /**
     * Parses the compiler options into pug options
     * and put our plugins into it
     * @param options The compiler options
     * @returns 
     */
    private getPugOptions(options: Compiler.Options = {}): pug.Options {
        const pugOptions: pug.Options = {
            // We use "render" as the function name
            name: "render",
            // The default filename (when no filename is given) is template.pupper
            filename: "template.pupper",
            compileDebug: options.debug || false,
            // Always use self to prevent conflicts with other compilers
            self: true,
            plugins: [],
            ...options.pug
        };

        // Create a new parser for this pug instance
        pugOptions.plugins.push(
            new Plugin(pugOptions)
        );

        return pugOptions;
    }
}