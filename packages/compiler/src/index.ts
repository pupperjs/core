import { ICompilerOptions, PupperCompiler } from "./core/Compiler";

export = class Pupper {
    public static createCompiler() {
        return new Pupper();
    }

    /**
     * Compiles a component to a string.
     * @param template The component to be rendered.
     * @param options The compilation options.
     * @returns 
     */
    public compileToString(template: string, options: ICompilerOptions) {
        return new PupperCompiler(options).compileComponent(template);
    }  
}