import { Pug } from "../../typings/pug";
import { PupperCompiler } from "../Compiler";
import { PugAST, PugNodes } from "../Plugin";

export class PugToVirtualDOM {
    public static virtualize(compiler: PupperCompiler, ast: PugAST) {
        return new PugToVirtualDOM(compiler).virtualize(ast);
    }

    protected identation: string;
    protected identLevel: number = 0;

    constructor(
        protected compiler: PupperCompiler
    ) {
        this.identation = compiler.plugin.detectIdentation();
    }

    /**
     * Idents a string with the current identation level.
     * @param string The string to be idented.
     * @returns 
     */
    protected ident(string: string = "") {
        return this.identation.repeat(this.identLevel) + string;
    }

    /**
     * Virtualizes a single node.
     * @param node The node to be virtualized.
     * @returns 
     */
    public virtualizeNode(node: Partial<PugNodes>) {
        let content = this.ident("h(");

        switch(node.type) {
            case "Tag":
                content += `"${node.name}"`;

                // If the node has attributes
                if (node.attrs.length) {
                    content += `, {\n`;
                    this.identLevel++;

                        content += this.ident(`attrs: {\n`);
                        this.identLevel++;

                            content += node.attrs
                            .reduce((arr: Pug.Nodes.TagNode["attrs"], attr) => {
                                const existing = arr.find((at) => at.name === attr.name);

                                if (typeof attr.val === "string") {
                                    if (attr.val.match(/^['"]/)) {
                                        attr.val = attr.val.substring(1, attr.val.length - 1);
                                    }
                                }

                                if (existing) {
                                    existing.val += " " + attr.val;
                                } else {
                                    arr.push(attr);
                                }

                                return arr;
                            }, [])
                            .map((attr) => {
                                return this.ident(
                                    `"${attr.name}": ${typeof attr.val === "string" ? '"' + attr.val.trim() + '"' : attr.val}`
                                )
                            })
                            .join(",\n")

                        this.identLevel--;
                        content += "\n";
                        content += this.ident(`}\n`);

                    this.identLevel--;
                    content += this.ident(`}`);
                }

                if (node.block?.nodes?.length) {
                    this.identLevel++;

                    content += `, [\n`;
                        content += node.block.nodes.map((node) => {
                            return this.virtualizeNode(node);
                        })
                        .filter((res) => !!res)
                        .join(",\n");

                        this.identLevel--;

                    content += "\n" + this.ident(`]`);
                }
            break;

            case "Text":
                // If it's empty
                if (node.val.trim().length === 0) {
                    // Ignore it
                    return null;
                }

                return this.ident("\"" + node.val.replace(/"/g, '\\"').trim() + "\"");

            case "Code":
                if (node.val.trim().length === 0) {
                    // Ignore it
                    return null;
                }

                if (node.val.match(/^["']/)) {
                    node.val = node.val.substring(1, node.val.length - 1);
                }

                return `h("span", { attrs: { "x-${node.mustEscape ? "text": "html"}": "${node.val.replace(/"/g, '\"')}" } })`;

            // Ignore comments
            case "Comment":
                return null;

            default:
                this.compiler.debugger.log("unknown node type", node);
        }

        return content + ")";
    }

    /**
     * Converts a string into a virtual DOM string.
     * @param ast The AST to be virtualized.
     * @returns
     */
    public virtualize(ast: PugAST) {
        let final = "";

        if (ast.nodes.length > 1) {
            final = this.virtualizeNode({
                type: "Tag",
                name: "div",
                block: {
                    type: "Block",
                    nodes: ast.nodes
                }
            });
        } else {
            final = this.virtualizeNode(ast.nodes[0]);
        }

        return final;
    }
}