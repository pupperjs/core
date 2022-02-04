import { Compiler } from "./core/Compiler";
import PupperCompiler from "./core/Compiler";
import { Renderer } from "./core/Renderer";
import type { compileTemplate } from "pug";
import { Reactive } from "./core/renderer/Reactive";

class PupperStatic {
    static readonly Compiler = PupperCompiler;
    static readonly Renderer = Renderer;
    static readonly Pupper = import("./pupper");

    /**
     * Creates a renderer instance
     * @param template The compiled template function
     * @param data The reactive data, optional
     * @returns 
     */
    static createRenderer(template: compileTemplate, data?: Reactive.ReactiveData) {
        return new Renderer(template, data);
    }

    /**
     * Compiles a string
     * @param file The string to be compiled
     * @returns 
     */
    static compileSync(str: string, options?: Compiler.Options) {
        return new PupperCompiler().compile(str, options);
    }

    /**
     * Compiles a string
     * @param file The string to be compiled
     * @returns 
     */
    static compileToStringSync(str: string, options?: Compiler.Options) {
        return new PupperCompiler().compileToString(str, options);
    }

    /**
     * Compiles a single file
     * @param file The file to be compiled
     * @returns 
     */
    static compileFileSync(file: string, options?: Compiler.Options) {
        return new PupperCompiler().compileFile(file, options);
    }
}

export = PupperStatic;