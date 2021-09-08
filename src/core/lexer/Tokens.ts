/**
 * All valid token types
 */
export enum Types {
    TAG,
    COMMAND
}

/**
 * The model used for a pupper token property
 */
export interface Property extends Record<string, any> {
    name: string,
    value: string,
}

interface TokenConstructor {
    type?: Types,
    properties?: Property[],
    body?: Token[],
    start?: number,
    end?: number,
    content: string
};

export class Token {
    public type: Types;
    public properties?: Property[];

    public body?: Token[];

    public start?: number;
    public end?: number;

    public content: string;

    constructor(data: TokenConstructor) {
        for(let index in data) {
            // @ts-ignore
            this[index] = data[index];
        }
    }

    public getContent() {
        return this.content;
    }

    public getContentAt(position: number) {
        return this.content[position];
    }

    public toJSON() {
        return {
            type: Types[this.type],
            properties: this.properties,
            body: this.body
        };
    }
}

export class TagToken extends Token {
    public type = Types.TAG;
    public tag?: string;

    constructor(data: TokenConstructor & { tag?: string }) {
        super(data);
    }

    public toJSON() {
        return {
            tag: this.tag,
            ...super.toJSON(),
        };
    }
}

/**
 * All valid token types
 */
export type PupperTokens = Token & TagToken;