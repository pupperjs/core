import {
    Project,
    ScriptTarget,
    SourceFile,
    SyntaxKind,
    ObjectLiteralExpression,
    CallExpression,
    PropertyAccessExpression
} from "ts-morph";

import Plugin from "../../../Plugin";

import { IComponent } from "../../phases/PrepareComponentsHook";

export class ScriptParser {
    protected sourceFile: SourceFile;
    protected project: Project;

    constructor(
        protected component: IComponent,
        protected fileName: string,
        protected availableComponents: Record<string, IComponent>,
        protected plugin: Plugin
    ) {
        
    }

    /**
     * Parses a script contents
     * @returns 
     */
    public parse() {
        // Load it in ts-morph
        this.project = new Project({
            useInMemoryFileSystem: true,
            compilerOptions: {
                allowJs: true,
                noImplicitAny: false,
                target: ScriptTarget.ESNext
            }
        });

        // Create a new source file
        this.sourceFile = this.project.createSourceFile(this.fileName, this.component.script);

        this.processDefaultComponent();
        this.processImportedComponents();
        
        if (this.component.data?.length) {
            this.processComponentData();
        }

        if (this.component.methods?.length) {
            this.processComponentMethods();
        }

        return this.sourceFile.getText();
    }

    private processComponentData() {
        // Create the data parser
        const data = this.project.createSourceFile("data.js", this.component.data);
        const componentData = this.findOrCreateComponentObj("data");

        // Retrieve all expressions
        data.getChildrenOfKind(SyntaxKind.ExpressionStatement).forEach((declaration) => {
            // Try finding the first binary expression
            const binaryExp = declaration.getExpressionIfKind(SyntaxKind.BinaryExpression);

            // If not found, it's not a variable declaration
            if (!binaryExp) {
                return;
            }


            // Left = identifier, Right = initializer
            const left = binaryExp.getLeft().getText();
            const right = binaryExp.getRight().getText();

            // Add it to the component data
            componentData.addPropertyAssignment({
                name: left,
                initializer: right
            });
        });
    }

    /**
     * Processes the component methods.
     */
    private processComponentMethods() {
        const identation = this.component.methods.match(/^(\t| )+/gm)[0];

        let currentMethod = {
            name: "",
            body: ""
        };

        const parsedMethods: {
            name: string;
            body: string;
        }[] = [];

        this.component.methods.split(/[\r\n]/).forEach((line) => {
            // If the line isn't idented
            if (!line.startsWith(identation)) {
                currentMethod = {
                    name: line.trim(),
                    body: ""
                };

                parsedMethods.push(currentMethod);
            } else {
                currentMethod.body += line + "\n";
            }
        });

        // Create the data parser
        const data = this.project.createSourceFile(
            "methods.js",
            parsedMethods.map((method) =>
                `function ${method.name} {\n${method.body.trimEnd()}\n}`
            ).join("\n\n")
        );

        const componentData = this.findOrCreateComponentObj("methods");

        // Retrieve all function declaration expressions
        data.getChildrenOfKind(SyntaxKind.FunctionDeclaration).forEach((declaration) => {
            // Add it to the component
            const method = componentData.addMethod({
                name: declaration.getName(),
                parameters: declaration.getParameters().map((param) => ({
                    name: param.getName()
                }))
            });

            method.setBodyText(declaration.getBodyText());
        });
    }

    /**
     * Processes the components imported by this component.
     * @returns 
     */
    private processImportedComponents() {
        // Ignore if has no imports
        if (!("imports" in this.plugin.sharedData)) {
            return;
        }

        // Find the imported components object inside the default export
        const componentPropsComponents = this.findOrCreateComponentObj("components");

        // Iterate over all imported components
        for(let alias in this.plugin.sharedData.imports) {
            // Add the import to the beginning
            this.sourceFile.addImportDeclaration({
                defaultImport: alias,
                moduleSpecifier: this.plugin.sharedData.imports[alias]
            });

            // Add it to the component components
            componentPropsComponents.addPropertyAssignment({
                name: alias,
                initializer: alias
            });
        }
    }

    /**
     * Finds or creates an object inside the component object with a given key.
     * @param key The key to be find or created.
     * @returns 
     */
    private findOrCreateComponentObj(key: string) {
        const componentProps = this.findComponentPropsObj();

        // Try finding an existing property with the given key
        let exportedComponents = componentProps.getProperty(key);

        if (exportedComponents) {
            return exportedComponents.getFirstChildByKindOrThrow(SyntaxKind.ObjectLiteralExpression);
        }

        return componentProps.addPropertyAssignment({
            name: key,
            initializer: "{}"
        }).getInitializer() as ObjectLiteralExpression;
    }

    /**
     * Processes the exported component.
     */
    private processDefaultComponent() {
        const componentProps = this.findComponentPropsObj();

        let fun = "";

        if (this.component.template?.startsWith("function") || this.component.template?.startsWith("()")) {
            fun = this.component.template;
        } else {
            fun = `() => ${JSON.stringify(this.component.template)}`;
        }

        // Add the "render" function to it
        componentProps.addPropertyAssignment({
            name: "render",
            initializer: fun
        });

        // Filter components that are not the current one
        const remainingComponents = Object.keys(this.availableComponents)
                .map((k) => this.availableComponents[k])
                .filter((c) => c.name !== this.component.name);

        // If has any other exported components
        if (remainingComponents.length) {
            const importedComponents = this.findOrCreateComponentObj("components");

            // Add them to the components
            remainingComponents.forEach((component) => {
                importedComponents.addPropertyAssignment({
                    name: String(component.name),
                    initializer: component.name as string
                });
            });
        }
    }

    /**
     * Finds the exported component properties object.
     * @returns 
     */
    private findComponentPropsObj() {
        // Find the default export
        let defaultExport = this.findOrCreateDefaultExport();

        // If it's not a defineComponent()
        const callExp = defaultExport.getFirstChildByKindOrThrow(SyntaxKind.CallExpression);

        // If it's calling like "Pupper."
        const propAccessExp = callExp.getFirstChildByKind(SyntaxKind.PropertyAccessExpression);

        let parent: CallExpression | PropertyAccessExpression = callExp;

        if (propAccessExp) {
            parent = propAccessExp;
        }

        // If the last identifier is not "defineComponent"
        if (parent.getLastChildByKindOrThrow(SyntaxKind.Identifier).getText() !== "defineComponent") {
            throw new Error("Pupper components needs to export a call to defineComponent()");
        }

        // Find the object
        return callExp.getFirstChildByKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    }

    /**
     * Finds or creates an "export default" expression (ExportAssignment).
     * @returns 
     */
    private findOrCreateDefaultExport() {
        // Export assignment is "export = " or "export default"
        const defaultExport = this.sourceFile.getFirstChildByKind(SyntaxKind.ExportAssignment);

        // If found
        if (defaultExport) {
            return defaultExport;
        }

        // Try finding a ExpressionStatement that contains a BinaryExpression with PropertyAccessExpression
        // (module.exports)
        //const module = this.sourceFile.getFirstChildByKindOrThrow(SyntaxKind.ExpressionStatement);

        // Add an import to "defineComponent"
        this.sourceFile.addImportDeclaration({
            namedImports: ["defineComponent"],
            moduleSpecifier: "@pupperjs/renderer"
        })

        // Create it
        return this.sourceFile.addExportAssignment({
            expression: "defineComponent({})",
            isExportEquals: false
        });
    }
}