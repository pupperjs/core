import { Pug } from "../../typings/pug";
import { PupperCompiler } from "../Compiler";
import { PugAST, PugNodes } from "../Plugin";

export class PugToVirtualDOM {
    public static virtualize(compiler: PupperCompiler, ast: PugAST) {
        return new PugToVirtualDOM(compiler).virtualize(ast);
    }

    protected identation: string;
    protected identLevel: number = 0;

    protected content: string;

    constructor(
        protected compiler: PupperCompiler
    ) {
        this.identation = compiler.plugin.detectIdentation();
    }

    /**
     * Writes a raw string to the contents.
     * @param string The string to be written.
     */
    protected write(string: string) {
        this.content += string;
    }

    /**
     * Writes a string and appends a new line to the contents.
     * @param string The string to be written.
     */
    protected writeLn(string: string = "") {
        this.content += string + "\n";
    }

    /**
     * Writes a string applying identation before it.
     * @param string The string to be written.
     * @returns 
     */
    protected applyIdent(string: string = "") {
        this.content += this.identation.repeat(this.identLevel) + string;
    }

    /**
     * Increases the identation level and writes a string after it.
     * @param string The string to be idented.
     * @returns 
     */
    protected ident(string: string = "") {
        this.identLevel++;
        return this.applyIdent(string);
    }

    /**
     * Decreases the identation level and writes a string after it.
     * @param string The string to be idented.
     * @returns 
     */
    protected outdent(string: string = "") {
        this.identLevel--;
        return this.applyIdent(string);
    }

    /**
     * Retrieves a string applying identation before it.
     * @param string The string to be written.
     * @returns 
     */
    protected getIdentation(string: string = "") {
        return this.identation.repeat(this.identLevel) + string;
    }

    protected rollbackIdent(times = 1) {
        this.content = this.content.substring(0, this.content.length - (this.ident.length * times));
    }

    /**
     * Converts a string into a virtual DOM string.
     * @param ast The AST to be virtualized.
     * @returns
     */
    public virtualize(ast: PugAST) {
        this.identLevel = 0;
        this.content = "";

        if (ast.nodes.length > 1) {
            this.virtualizeNode({
                type: "Tag",
                name: "div",
                block: {
                    type: "Block",
                    nodes: ast.nodes
                }
            } as any);
        } else {
            this.virtualizeNode(ast.nodes[0]);
        }

        return this.content;
    }

    /**
     * Virtualizes a single node.
     * @param node The node to be virtualized.
     * @returns 
     */
    public virtualizeNode(node: PugNodes) {
        switch(node.type) {
            case "Tag":
                return this.virtualizeTag(node);

            case "Text":
                return this.virtualizeText(node);

            case "Code":
                return this.virtualizeCode(node);

            // Ignore comments
            case "Comment":
                return false;

            default:
                this.compiler.debugger.log("unhandled node type", node);
        }

        return false;
    }

    /**
     * Virtualizes a text node.
     * @param node The node to be virtualized.
     * @returns 
     */
    protected virtualizeText(node: Pug.Nodes.TextNode) {
        // If it's empty
        if (node.val.trim().length === 0) {
            // Ignore it
            return false;
        }

        this.write("\"" + node.val.replace(/"/g, '\\"').trim() + "\"");
    }

    /**
     * Virtualizes a code node.
     * @param node The node to be virtualized.
     * @returns 
     */
    protected virtualizeCode(node: Pug.Nodes.CodeNode) {
        if (node.val.trim().length === 0) {
            // Ignore it
            return false;
        }

        this.writeLn(`h("span", {`);
            this.ident(`attrs: {\n`);
                this.ident(`"x-${node.mustEscape ? "text": "html"}": "${node.val.replace(/"/g, '\\"')}"\n`);
            this.outdent(`}\n`);
        this.outdent(`})`);
    }

    /**
     * Virtualizes a tag node.
     * @param node The tag node to be virtualized.
     * @returns 
     */
    protected virtualizeTag(node: Pug.Nodes.TagNode) {
        this.write(`h("${node.name}"`);

        // If the node has attributes
        if (node.attrs.length) {
            this.writeLn(", {");
            this.ident();

                this.virtualizeTagAttributes(node.attrs);

            this.outdent();
            this.write("}");
        }

        if (node.block?.nodes?.length) {
            this.writeLn(`, [`);

            node.block.nodes.forEach((node, index, arr) => {
                this.ident();
                const result = this.virtualizeNode(node);

                if (result === false) {
                    // Revert identation
                    this.rollbackIdent();
                } else {
                    this.write(index < arr.length - 1 ? ",\n" : "");
                }

                this.identLevel--;
            });

            // End with a new line
            this.writeLn();
            this.applyIdent(`]`);
        }

        this.write(")");
    }

    protected virtualizeTagAttributes(attrs: Pug.Nodes.TagNode["attrs"]) {
        this.writeLn(`attrs: {`);
        this.ident();

            this.write(
                attrs
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
                    return (
                        `"${attr.name}": ${typeof attr.val === "string" ? '"' + attr.val.trim() + '"' : attr.val}`
                    )
                })
                .join(",\n" + this.getIdentation())
            );

        this.outdent("\n");
        this.applyIdent(`}\n`);
    }
}