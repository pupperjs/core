import { ICompilerOptions, PupperCompiler } from "./core/Compiler";

export = class Pupper {
    public static createCompiler() {
        return new Pupper();
    }

    public compileToString(template: string, options: ICompilerOptions) {
        return new PupperCompiler(options).compileComponent(template);
    }  
}