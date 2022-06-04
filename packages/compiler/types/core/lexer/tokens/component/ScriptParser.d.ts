import { SourceFile } from "ts-morph";
import Plugin from "../../../Plugin";
import { IComponent } from "../Component";
export declare class ScriptParser {
    protected component: IComponent;
    protected fileName: string;
    protected availableComponents: Record<string, IComponent>;
    protected plugin: Plugin;
    protected sourceFile: SourceFile;
    constructor(component: IComponent, fileName: string, availableComponents: Record<string, IComponent>, plugin: Plugin);
    /**
     * Parses a script contents
     * @returns
     */
    parse(): string;
    private processImportedComponents;
    private findComponentImportedComponentsObj;
    private processDefaultComponent;
    private findComponentPropsObj;
    private findDefaultExport;
}
