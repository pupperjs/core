declare module "pug-code-gen" {
    import type pug from "./pug";
    
    declare interface ICodeGenOptions {
        compileDebug?: boolean;
        pretty?: boolean;
        inlineRuntimeFunctions?: boolean;
        templateName?: string;
        self?: boolean;
        globals?: string[],
        doctype?: string
    }

    export default function CodeGen(ast: pug.Pug.PugAST, options: ICodeGenOptions): string;
}