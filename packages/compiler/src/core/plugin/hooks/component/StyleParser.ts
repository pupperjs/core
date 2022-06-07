import { IComponent } from "../ComponentHook";

export class StyleParser {
    constructor(
        protected content: string,
        protected availableComponents: Record<string, IComponent>
    ) {
        
    }

    /**
     * Parses a script contents
     * @returns 
     */
    public parse() {
        return this.content;
    }
}