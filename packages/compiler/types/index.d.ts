import pug from "pug";
interface ICompilerOptions {
    /**
     * If set to true, the function source will be included in the compiled template
     * for better error messages. It is not enabled by default.
     */
    debug?: boolean;
    /**
     * Any configurations to be passed to pug
     */
    pug?: pug.Options;
}
declare const _default: {
    new (): {
        /**
         * Compiles a pupper template to a Javascript module
         * @param template The template to be compiled
         * @param options
         * @returns
         */
        compileToString(template: string, options?: ICompilerOptions): string;
        /**
         * Compiles a pupper template into HTML.
         * @param template The template to be compiled
         * @param options
         * @returns
         */
        compileTemplate(template: string, options?: ICompilerOptions): string;
        /**
         * Parses the compiler options into pug options
         * and put our plugins into it
         * @param options The compiler options
         * @returns
         */
        getPugOptions(options?: ICompilerOptions): pug.Options & {
            contents?: string;
        };
    };
    /**
     * Creates a new pupper.js compiler
     * @returns
     */
    createCompiler(): {
        /**
         * Compiles a pupper template to a Javascript module
         * @param template The template to be compiled
         * @param options
         * @returns
         */
        compileToString(template: string, options?: ICompilerOptions): string;
        /**
         * Compiles a pupper template into HTML.
         * @param template The template to be compiled
         * @param options
         * @returns
         */
        compileTemplate(template: string, options?: ICompilerOptions): string;
        /**
         * Parses the compiler options into pug options
         * and put our plugins into it
         * @param options The compiler options
         * @returns
         */
        getPugOptions(options?: ICompilerOptions): pug.Options & {
            contents?: string;
        };
    };
};
export = _default;
