import { IComponent } from "../Component";
export declare class StyleParser {
    protected content: string;
    protected availableComponents: Record<string, IComponent>;
    constructor(content: string, availableComponents: Record<string, IComponent>);
    /**
     * Parses a script contents
     * @returns
     */
    parse(): string;
}
