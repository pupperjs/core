import { writeFileSync } from "fs";
import { Compiler } from "./Compiler";

import * as Tokens from "./lexer/Tokens";

interface LineResult {
    content: string,
    identationLevel: number
}

/**
 * The identation type used in this code
 */
export enum IdentationType {
    TABS,
    SPACES
}

export default class Lexer {
    private static readonly TABS_IDENTATION_REGEXP = /^\n(\t*) */g;
    private static readonly SPACES_IDENTATION_REGEXP = /^\n( *) */g;

    private identationType: IdentationType;

    private template: string;
    private options: Compiler.Options = {
        debug: false
    };

    /**
     * Current lexer position
     */
    private position: number = 0;

    /**
     * The current identation level
     */
    private identationLevel: number = 0;

    /**
     * Current lexer line
     */
    private line: number = -1;

    private lines: string[];

    private parsed: Tokens.Token[] = [];

    constructor(template: string|Buffer, options?: Compiler.Options) {
        this.template = Buffer.isBuffer(template) ? template.toString("utf8") : template;
        this.options = options || this.options;
    }

    /**
     * Starts the lexing process
     */
    public start() {
        // Find all lines
        this.lines = this.template.split(/(\r\n|\n)/)
            // Ignore empty ones
            .filter((line) =>
                line !== "\r" &&
                line !== "\r\n" &&
                line.length > 0
            )

        this.scanIdentation();
        this.nextLine();

        writeFileSync(__dirname + "/../../test/out/ast.json", JSON.stringify(this.parsed, null, "\t"));
    }

    /**
     * Scans for the identation type
     * @throws TypeError
     */
    private scanIdentation() {
        // Check if it's tab-idented
        if (this.template.match(Lexer.TABS_IDENTATION_REGEXP)) {
            // Check if space-based identation can also be found
            if (this.template.match(Lexer.SPACES_IDENTATION_REGEXP)) {
                throw new TypeError("You can only ident using spaces OR tabs, not both of them.");
            }

            this.identationType = IdentationType.TABS;
        } else {
            this.identationType = IdentationType.SPACES;
        }
    }

    /**
     * Retrieves the current line contents
     * @returns 
     */
    private getLine(num: number) {
        let line = this.lines[num];

        if (!line) {
            return null;
        }

        let start = 0;
        let identationLevel = 0;

        const level = line.match(
            this.identationType === IdentationType.SPACES ?
            /^(?<i> +)(?:.+?)/ :
            /(?<i>\t+?)/
        );

        if (level) {
            start = level.groups.i.length;

            // Set the current identation level
            identationLevel = IdentationType.SPACES ? level.groups.i.length / 4 : (level.groups.i.length - 1);
        }

        return {
            content: line.substring(start, line.length),
            identationLevel
        };
    }

    /**
     * Retrieves the current line contents
     * @returns 
     */
    private getCurrentLine(newLine = this.line) {
        const line = this.getLine(newLine);

        if (!line) {
            return null;
        }

        this.identationLevel = line.identationLevel;
        return line.content;
    }

    /**
     * Parses the next line
     */
    private nextLine() {
        this.line++;

        // Check if reached the end
        if (this.line >= this.lines.length) {
            return true;
        }

        const line = this.getCurrentLine();

        // Ignore empty lines
        if (line.replace(/([ \t\r\n]+)/g, "").length === 0) {
            this.nextLine();
            return;
        }

        this.parsed.push(
            ...this.parseLine(this.line)
        );

        // Advance to the next line
        this.nextLine();
    }

    /**
     * Parses a single line
     * @param line The line number to be parsed
     */
    private parseLine(line: number|LineResult) {
        const tokens: Tokens.Token[] = [];

        let currentToken: Tokens.Token;

        // Count all spaces for this line
        const spaces = typeof line === "number" ? this.getCurrentLine(line).split(" ") : line.content.split(" ");

        // Iterate over all of them
        for(let i = 0; i < spaces.length; i++) {
            this.position = i;

            const token = spaces[i];

            // Check if it's the first token
            if (i === 0) {
                // Check if starts with a class or ID
                if (token.startsWith("#") || token.startsWith(".")) {
                    // Set it as a tag
                    currentToken = new Tokens.TagToken({
                        tag: "div",
                        start: this.position,
                        end: this.position + token.length,
                        content: token,
                        properties: []
                    });
                } else {
                    switch(token) {
                        case "foreach":

                        break;

                        case "if":

                        break;

                        default:
                            // Assume it's starting with a tag
                            currentToken = new Tokens.TagToken({
                                tag: token.split(/[\.\#\(]/)[0],
                                content: token,
                                start: this.position,
                                end: this.position + token.length,
                                properties: []
                            });
                        break;
                    }
                }

                // Check if a token was found
                if (currentToken) {
                    // Parse it
                    this.parse(currentToken);

                    tokens.push(currentToken);

                    currentToken = null;

                    continue;
                }
            }
        }

        return tokens;
    }

    private parse(token: Tokens.Token) {
        switch(token.type) {
            // If it's parsing a tag
            case Tokens.Types.TAG:
                const length = token.end - token.start;

                // Reset the position
                this.position = 0;

                // Increase the position until a non-identifier is found
                do {
                    this.position++;
                } while(this.position < length && !token.getContentAt(this.position).includes("("));

                const identifier = this.getCurrentLine().substring(0, this.position);
                const classesAndIds = identifier.match(/([\.#].+?(?=\.|\#|\(|\=))/g);

                if (classesAndIds !== null) {
                    // Extract classes and IDs
                    const classIdentifiers = classesAndIds.filter((cid) => cid.startsWith(".")).join(" ");
                    const idIdentifiers = classesAndIds.filter((cid) => cid.startsWith("#")).join(" ");

                    // If has any ID, set it
                    if (idIdentifiers.length) {
                        token.properties.push({
                            name: "id",
                            value: idIdentifiers.replace(/\#/g, "")
                        });
                    }

                    // If has any class, set it
                    if (classIdentifiers) {
                        token.properties.push({
                            name: "class",
                            value: classIdentifiers.replace(/\./g, "")
                        })
                    }
                }

                const content = this.getCurrentLine();

                // Check if has any property
                if (content.includes("(")) {
                    // Extract all properties
                    const properties = content.match(/\((.*)\)/);

                    if (properties) {
                        properties.shift();

                        properties.forEach((property) => {
                            // Parse the property
                            let parsed;
                            const reg = /(?<key>[A-Za-z0-9\-\_]*)(?: *=? *)(?<value>.*)(?<=[,;])/y;

                            console.log(property.match(reg));

                            /*while((parsed = reg.exec(property)) !== null) {
                                token.properties.push({
                                    name: parsed.groups.key,
                                    value: parsed.groups.value
                                });
                            }*/
                        });
                    }
                }

                const currentLine = this.line;
                const nextLine = this.getLine(currentLine + 1);

                // If the next line identation is major than the current line identation,
                // then parse the identation
                if (nextLine && nextLine.identationLevel > this.identationLevel) {
                    const identationLevel = this.identationLevel;

                    let parsingLine = null;

                    // Initialize the token body
                    token.body = [];

                    // Iterate until a closing identation is found
                    // or EOF is reached
                    do {
                        this.line++;

                        // Check if it's EOF
                        if (this.lines[this.line] === undefined) {
                            break;
                        }

                        parsingLine = this.getCurrentLine();

                        token.body = token.body.concat(
                            this.parseLine(this.line)
                        );
                    } while (this.identationLevel > identationLevel);

                    // Decrease one line
                    this.line--;
                }
            break;
        }
    }

    public toString() {
        return "";
    }
}