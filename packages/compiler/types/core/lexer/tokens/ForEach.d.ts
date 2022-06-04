import { PugNode } from "../../Plugin";
import Token from "../Token";
export default class ForEach extends Token {
    parse(nodes: PugNode[]): PugNode[];
}
