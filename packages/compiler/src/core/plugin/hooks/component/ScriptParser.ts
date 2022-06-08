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

import { IComponent } from "../ComponentHook";

export class ScriptParser {
    protected sourceFile: SourceFile;

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
        const project = new Project({
            useInMemoryFileSystem: true,
            compilerOptions: {
                allowJs: true,
                noImplicitAny: false,
                target: ScriptTarget.ESNext
            }
        });

        // Create a new source file
        this.sourceFile = project.createSourceFile(this.fileName, this.component.script);

        this.processDefaultComponent();
        this.processImportedComponents();

        return this.sourceFile.getText();
    }

    private processImportedComponents() {
        if (!("imports" in this.plugin.sharedData)) {
            return;
        }

        const componentPropsComponents = this.findComponentImportedComponentsObj();

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

    private findComponentImportedComponentsObj() {
        const componentProps = this.findComponentPropsObj();

        // Try finding an existing "components" expression
        let exportedComponents = componentProps.getProperty("components");

        if (exportedComponents) {
            return exportedComponents.getFirstChildByKindOrThrow(SyntaxKind.ObjectLiteralExpression);
        }

        return componentProps.addPropertyAssignment({
            name: "components",
            initializer: "{}"
        }).getInitializer() as ObjectLiteralExpression;
    }

    private processDefaultComponent() {
        const componentProps = this.findComponentPropsObj();

        // Add the "render" function to it
        componentProps.addPropertyAssignment({
            name: "render",
            initializer: `() => ${JSON.stringify(this.component.template)}`
        });

        // Filter components that are not the current one
        const remainingComponents = Object.keys(this.availableComponents)
                .map((k) => this.availableComponents[k])
                .filter((c) => c.name !== this.component.name);

        // If has any other exported components
        if (remainingComponents.length) {
            const importedComponents = this.findComponentImportedComponentsObj();

            // Add them to the components
            remainingComponents.forEach((component) => {
                importedComponents.addPropertyAssignment({
                    name: String(component.name),
                    initializer: component.name as string
                });
            });
        }
    }

    private findComponentPropsObj() {
        // Find the default export
        let defaultExport = this.findDefaultExport();

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

    private findDefaultExport() {
        // Export assignment is "export = " or "export default"
        const defaultExport = this.sourceFile.getFirstChildByKind(SyntaxKind.ExportAssignment);

        // If found
        if (defaultExport) {
            return defaultExport;
        }

        // Try finding a ExpressionStatement that contains a BinaryExpression with PropertyAccessExpression
        // (module.exports)
        const module = this.sourceFile.getFirstChildByKindOrThrow(SyntaxKind.ExpressionStatement);
    }
}