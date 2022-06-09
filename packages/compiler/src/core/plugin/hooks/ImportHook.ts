import {  PugToken } from "../../Plugin";
import { Hook } from "../Hook";
import { TagNode } from "../nodes/TagNode";

export class ImportHook extends Hook {
    /**
     * Inline imports needs to be at root level.
     * Needs to have an identifier and a filename.
     * Identifiers can't start with numbers.
     */
    public static INLINE_IMPORT_REGEX = /^(?<match>import\s*(?<identifier>[^0-9][a-zA-Z0-9_]+?)\((?:from=)?(['"])(?<filename>.+?)\3\))\s*/m;

    /**
     * The imports that will later be putted into the template header
     */
    protected imports: Record<string, string> = {};

    public beforeStart(template: string) {
        let match;

        while(match = ImportHook.INLINE_IMPORT_REGEX.exec(template)) {
            template = template.replace(match.groups.match, `import(identifier="${match.groups.identifier}", from="${match.groups.filename}")`);
        }
        
        return template;
    }

    public lex(tokens: PugToken[]) {
        for(let i = 0; i < tokens.length; i++) {
            const currentToken = tokens[i];
            const nextToken = tokens[i + 1];

            if (!nextToken) {
                continue;
            }

            if (currentToken.type === "tag" && currentToken.val === "import" && nextToken.type === "text") {
                const fullImport = ("import " + nextToken.val);

                let match = fullImport.match(ImportHook.INLINE_IMPORT_REGEX);

                if (!match) {
                    throw this.compiler.makeParseError("Invalid import expression.", {
                        line: currentToken.loc.line,
                        column: currentToken.loc.column
                    });
                }

                tokens = tokens.splice(i + 1, 1, 
                    {
                        type: "start-attributes",
                        loc: currentToken.loc
                    },
                    {
                        type: "attribute",
                        loc: currentToken.loc,
                        name: "identifier",
                        val: match.groups.identifier
                    },
                    {
                        type: "attribute",
                        loc: currentToken.loc,
                        name: "filename",
                        val: match.groups.filename
                    },
                    {
                        type: "end-attributes",
                        loc: currentToken.loc
                    }
                );
            }
        }

        return tokens;
    }

    public parse(nodes: TagNode[]) {
        for(let node of nodes) {
            // Check if it's a tag node
            if (node.isType("Tag")) {
                // If it's an import tag
                if (node.isName("import")) {                    
                    this.plugin.sharedData.imports = this.plugin.sharedData.imports || {};
                    this.plugin.sharedData.imports[node.getAttribute("identifier").replace(/["']/g, "")] = node.getAttribute("filename") || node.getAttribute("from").replace(/["']/g, "");

                    // Remove the node from the template
                    node.delete();

                    continue;
                } else
                // If it's trying to import a previously imported template
                if (this.plugin.sharedData.imports?.[node.getProp("name")] !== undefined) {
                    // If has a body
                    if (node.hasChildren()) {
                        throw this.compiler.makeParseError("Imported tags can't have a body.", {
                            line: node.getLine(),
                            column: node.getColumn()
                        });
                    }

                    node.replaceWith({
                        type: "Tag",
                        name: "div",
                        selfClosing: true,
                        isInline: false,
                        attributes: {
                            "x-data": node.getAttribute("data")?.trim(),
                            "x-template": node.getProp("name")
                        }
                    });
                }
            }
        }

        return nodes;
    }
};