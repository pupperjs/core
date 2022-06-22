import { Hook } from "../Hook";

export class PrepareImportsPhase extends Hook {
    /**
     * Inline imports needs to be at root level.
     * Needs to have an identifier and a filename.
     * Identifiers can't start with numbers.
     */
    public static INLINE_IMPORT_REGEX = /^(?<match>import\s*(?<identifier>[^0-9][a-zA-Z0-9_]+?)\((?:from=)?(['"])(?<filename>.+?)\3\))\s*/gm;

    public beforeStart(template: string) {
        // Create the handler for the imports
        this.plugin.sharedData.imports = this.plugin.sharedData.imports || {};

        const matches = template.matchAll(PrepareImportsPhase.INLINE_IMPORT_REGEX);

        for(let match of matches) {
            // Prepare the import
            this.plugin.sharedData.imports[match.groups.identifier] = match.groups.filename;

            template = template.replace(match.groups.match, "");
        }
        
        return template;
    }
};