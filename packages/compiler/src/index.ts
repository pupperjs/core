import pug from "pug";
import Plugin from "./core/Plugin";

interface ICompilerOptions {
    /**
     * If set to true, the function source will be included in the compiled template
     * for better error messages. It is not enabled by default.
     */
    debug?: boolean,

    /**
     * Any configurations to be passed to pug
     */
    pug?: pug.Options
}

export = class PupperCompiler {
    /**
     * Creates a new pupper.js compiler
     * @returns 
     */
    public static createCompiler() {
        return new PupperCompiler();
    }

    /**
     * Compiles a pupper template to a Javascript module
     * @param template The template to be compiled
     * @param options 
     * @returns 
     */
    public compileToString(template: string, options: ICompilerOptions = {}): string {
        try {
            const pugOptions = this.getPugOptions(options);
            pugOptions.contents = template;

            let rendered = pug.compileClient(template, pugOptions);

            // If nothing has been exported
            if (!rendered.includes("export default") && !rendered.includes("module.exports = ")) {
                // Export the render function as the default
                rendered += "\n";
                rendered += /*js*/`module.exports = ${pugOptions.name};`;
            }

            return rendered;
        } catch(e) {
            throw (options.debug ? e : new Error("Failed to compile template: " + e.message));
        }
    }

    /**
     * Compiles a pupper template into HTML.
     * @param template The template to be compiled
     * @param options 
     * @returns 
     */
    public compileTemplate(template: string, options: ICompilerOptions = {}): string {
        try {
            const pugOptions = this.getPugOptions(options);
            pugOptions.contents = template;

            const fn = pug.compile(template, pugOptions);
            const rendered = fn();

            return rendered;///*js*/`function $h(h) { return ${htmlToHs({ syntax: "h" })(rendered)}; }`;
        } catch(e) {
            throw (options.debug ? e : new Error("Failed to compile template:" + e.message));
        }
    }

    /**
     * Parses the compiler options into pug options
     * and put our plugins into it
     * @param options The compiler options
     * @returns 
     */
    public getPugOptions(options: ICompilerOptions = {}): pug.Options & {
        contents?: string
    } {
        const pugOptions: pug.Options = {
            // We use "template" as the function name
            name: "template",
            // The default filename (when no filename is given) is template.pupper
            filename: "template.pupper",
            compileDebug: options.debug || false,
            // Always use self to prevent conflicts with other compilers
            self: true,
            plugins: [],
            ...options.pug
        };

        // Create a new parser for this pug instance
        pugOptions.plugins.push(
            new Plugin(this, pugOptions)
        );

        return pugOptions;
    }
}