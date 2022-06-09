declare module "pug-parser" {
    import type pug from "pug";

    declare interface IParserOptions {
        filename?: string;
        plugins?: pug.PugPlugin[];
        src?: string;
    }

    export default function Parse(ast: pug.PugToken[], options: IParserOptions): pug.PugAST;
}