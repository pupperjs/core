import { Pug } from "../typings/pug";
import pug from "pug";
import Plugin, { PugAST } from "./Plugin";

import pugError from "pug-error";
import lex from "pug-lexer";
import parse from "pug-parser";
import link from "pug-linker";
import codeGen from "pug-code-gen";

export enum CompilationType {
    TEMPLATE
}

export interface ICompilerOptions {
    /**
     * If set to true, the function source will be included in the compiled template
     * for better error messages. It is not enabled by default.
     */
    debug?: boolean;

    /**
     * The compilation file name.
     */
    fileName: string;

    /**
     * Any configurations to be passed to pug.
     * @internal Not meant to be used externally.
     */
    pug?: pug.Options;
}

export class PupperCompiler {
    /**
     * The contents of the current template being rendered.
     */
    public contents: string;

    public plugin = new Plugin(this);

    public compilationType: CompilationType;

    constructor(
        /**
         * Any options to be passed to the compiler.
         */
        public options: ICompilerOptions
    ) {
        
    }

    /**
     * Makes a compilation error.
     * @param code The error code.
     * @param message The error message.
     * @param data The error data.
     * @returns 
     */
    public makeError(code: string, message: string, data: {
        line?: number;
        column?: number;
    } = {}) {
        return pugError(code, message, {
            ...data,
            filename: this.getFileName(),
            src: this.contents
        } as any);
    }

    /**
     * Makes an error with "PARSE_ERROR" code.
     * @param message The error message.
     * @param data The error data.
     * @returns 
     */
    public makeParseError(message: string, data: {
        line?: number;
        column?: number;
    } = {}) {
        return this.makeError("PARSE_ERROR", message, data);
    }

    /**
     * Makes an error with "LEX_ERROR" code.
     * @param message The error message.
     * @param data The error data.
     * @returns 
     */
    public makeLexError(message: string, data: {
        line?: number;
        column?: number;
    } = {}) {
        return this.makeError("LEX_ERROR", "Lexer error: " + message, data);
    }

    protected lexAndParseString(template: string) {
        let carrier: any;

        const options = this.makePugOptions();

        this.plugin.prepareHooks();

        try {
            this.contents = this.plugin.preLex(template);

            carrier = lex(this.contents, {
                ...options,
                plugins: [this.plugin.lex as any as lex.LexerFunction]
            });

            carrier = this.plugin.preParse(carrier);
        } catch(e) {
            throw this.makeLexError(e.message, e);
        }

        try {
            carrier = parse(carrier, this.makePugOptions() as any);
            carrier = link(carrier);

            carrier = this.plugin.postParse(carrier);
        } catch(e) {
            throw e instanceof pugError ? e : this.makeParseError(e.message, e);
        }

        return carrier as PugAST;
    }

    protected generateJavaScript(ast: Pug.PugAST): string {
        ast = this.plugin.preCodeGen(ast);

        let code = codeGen(ast, this.makePugOptions());

        code = this.plugin.postCodeGen(code);

        return code;
    }

    /**
     * Compiles a pupper component into a JavaScript component.
     * @param template The template to be compiled.
     * @returns 
     */
    public compileComponent(template: string): string {
        this.contents = template;

        const ast = this.lexAndParseString(template);
        let rendered = this.generateJavaScript(ast);

        return rendered;
    }

    /**
     * Compiles a pupper template tag into HTML.
     * @param template The template to be compiled.
     * @returns 
     */
    public compileTemplate(template: string): string {
        const pugOptions = this.makePugOptions();
        this.contents = template;

        this.compilationType = CompilationType.TEMPLATE;

        this.plugin.prepareHooks();

        const fn = pug.compile(template, pugOptions);
        const rendered = fn();

        return rendered;///*js*/`function $h(h) { return ${htmlToHs({ syntax: "h" })(rendered)}; }`;
    }

    public getFileName() {
        return this.options.fileName || this.options.pug.filename || "template.pupper";
    }

    /**
     * Sets the internal compiler file name.
     * @param fileName The new file name.
     * @returns 
     */
    public setFileName(fileName: string) {
        this.options.fileName = fileName;
        return this;
    }

    /**
     * Make the options for the pug compiler.
     */
    protected makePugOptions() {
        const pugOptions: pug.Options & { filename: string } = {
            // We use "$render" as the internal function name.
            name: "$render",
            filename: this.getFileName(),
            compileDebug: this.options.debug || false,
            // Always use self to prevent conflicts with other compilers.
            self: true,
            plugins: []
        };

        pugOptions.plugins.push(this.plugin);

        return pugOptions;
    }
}