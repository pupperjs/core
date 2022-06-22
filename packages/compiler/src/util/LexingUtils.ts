type UpperCaseCharacter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";
type SpecialCharacters = "$" | "{" | "}" | "[" | "]" | "," | "." | ";" | "\"" | "'" | "(" | ")" | "`" | "´" | "~" | "^";
type Character = UpperCaseCharacter | Lowercase<UpperCaseCharacter> | SpecialCharacters;

interface ITokenState {
    levels: number;
    line: number;
    column: number;
    content: string;
    index: number;
    token: string;
    lastOpenLevel: string | null;
    escaping: boolean;
}

class UnexpectedTokenError extends Error {
    constructor(public state: ITokenState) {
        super(`Unexpected token "${state.token}" @ ${state.line}:${state.column}`);
    }
}

const CharsToEscape = ["'", '"', '`'];

/**
 * Reads between two tokens.
 * @param string The content to be read.
 * @param start The starting token.
 * @param end The ending token.
 * @returns The contents between the tokens, or null if the starting token couldn't be found.
 */
export function readBetweenTokens(string: string, start: Character, end: Character, options?: {
    allowNewLines?: boolean
}) {
    const startIndex = string.indexOf(start);

    if (startIndex === -1) {
        return null;
    }

    const state: ITokenState = {
        levels: 0,
        line: 1,
        column: 1,
        content: "",
        index: startIndex + 1,
        lastOpenLevel: "",
        escaping: false,
        token: ""
    };

    while(state.index < string.length) {
        state.token = string[state.index++];
        state.column++;

        // If a new line was found
        if ((state.token === "\n")) {
            // If doesn't allow new lines
            if (options?.allowNewLines === false) {
                throw new UnexpectedTokenError(state);
            }

            state.line++;
            state.column = 1;
        }

        // If it's inside a string and it's escaping something
        if (state.lastOpenLevel && state.token === "\\" && CharsToEscape.includes(string[state.index])) {
            state.escaping = true;
        } else
        // If it's opening a string and hasn't opened a level or it's possibly closing a level
        if (CharsToEscape.includes(state.token) && (!state.lastOpenLevel || state.lastOpenLevel === state.token)) {
            // If was escaping
            if (state.escaping) {
                // Ignore the following check
                state.escaping = false;
            } else
            // If has an open level
            if (state.lastOpenLevel) {
                // Decrease a level
                state.levels--;
                state.lastOpenLevel = null;
            } else {
                // Increase one level
                state.levels++;
                state.lastOpenLevel = state.token;
            }
        } else
        // If reached the ending token
        if (state.levels === 0 && state.token === end) {
            break;
        }

        // Add the token to the contents
        state.content += state.token;
    }

    return state.content;
}

/**
 * Reads an array of strings until an outdent is found.
 * @param lines A string array containing the lines to be read.
 * @param ident The detected identation.
 * @returns 
 */
export function readLinesUntilOutdent(lines: string[], ident: string) {
    let index = 0;
    let line = "";

    let content = "";

    do {
        line = lines[index];

        if (line === undefined) {
            break;
        }

        content += line + "\n";

        index++;
    } while (line.length === 0 || line.startsWith(ident));

    return content;
}

/**
 * Reads an array of strings until a new identation level is found.
 * @param lines A string array containing the lines to be read.
 * @param ident The detected identation.
 * @returns 
 */
export function readLinesUntilIdent(lines: string[], ident: string) {
    let index = 0;
    let line = "";

    let content = "";

    do {
        line = lines[index];

        if (line === undefined) {
            break;
        }

        content += line + "\n";

        index++;
    } while (line.length === 0 || line.startsWith(ident + ident) || !line.startsWith(ident));

    return content;
}

/**
 * Reads the next tag with their attributes inside.
 * @param contents The lines to be read.
 * @returns 
 */
export function readTagWithAttributes(contents: string[]|string) {
    const state = {
        index: 0,
        column: 0,
        line: 1,
        content: "",
        token: "",

        tag: "",
        attributes: ""
    };

    contents = Array.isArray(contents) ? contents.join("\n") : contents;

    while(state.index < contents.length) {
        state.token = contents[state.index];
        state.column++;

        // If it's a line break
        if (state.token === "\n") {
            state.line++;
            state.column = 0;
        } else
        // If has found a "start-attribute" token
        if (state.token === "(") {
            // Read the attributes
            state.attributes = "(" + readBetweenTokens(contents.substring(state.index), "(", ")") + ")";
            state.content += state.attributes;

            // Skip the read attributes lines
            state.index += state.attributes.length;
            state.line += state.attributes.split("\n").length - 1;

            // Skip the current token
            continue;
        }

        // If got into a new line
        if (state.token === "\n") {
            // No possible attributes here
            break;
        }

        // If no attribute has been read yet
        if (!state.attributes) {
            // Read it as the tag
            state.tag += state.token;
        }

        state.content += state.token;
        state.index++;
    }

    return {
        content: state.content,
        tag: state.tag.trimStart(),
        attributes: state.attributes,
        line: state.line,
        column: state.column
    };
}