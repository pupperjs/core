import pug from "./pug";

export declare module "pug-parser" {
    declare interface IParserOptions {
        filename?: string;
        plugins?: pug.Pug.PugPlugin[];
        src?: string;
    }

    declare export default function Parse(ast: pug.Pug.PugToken[], options: IParserOptions): pug.Pug.PugAST;
}