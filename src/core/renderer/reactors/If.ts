import { Reactive } from "../Reactive";

const debug = require("debug")("pupperjs:renderer:reactors:if");

export default class IfReactor extends Reactive.AbstractReactor {
    public static readonly Type: "if";

    public test(path: string) {
        console.log(this.path, path);
        return super.test(path);
    }

    public handle(path: string, newValue: any) {
        if (newValue) {
            
        }

        console.log(path, newValue);
    }
}