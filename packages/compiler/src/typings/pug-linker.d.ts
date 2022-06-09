declare module "pug-linker" {
    import type pug from "pug";
    
    export default function Link(ast: pug.PugAST): pug.PugAST;
}