import { PugToken } from "../../Plugin";
import Token from "../Token";
export default class PupperToAlpine extends Token {
    static Directives: Record<string, string>;
    lex(tokens: PugToken[]): PugToken[];
}
