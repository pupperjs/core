import pug from "./pug";

export declare module "pug-code-gen" {
    export declare interface ICodeGenOptions {
        compileDebug?: boolean;
        pretty?: boolean;
        inlineRuntimeFunctions?: boolean;
        templateName?: string;
        self?: boolean;
        globals?: string[],
        doctype?: string
    }

    declare export default function CodeGen(ast: pug.Pug.PugAST, options: ICodeGenOptions): string;
}