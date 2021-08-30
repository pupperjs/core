declare module "deep-get-set" {
    export default function(object: object, key: any, value?: any);
}

declare module "*.pupper" {
    export default function(data: object): string;
}

declare module "observable-slim" {
    declare type ObservableChange = {
        type: "add" | "delete" | "update",
        target: any[] | Record<any, any>,
        property: string,
        newValue: any,
        currentPath: string,
        jsonPointer: string,
        proxy: Record<any, any>
    };

    /**
     * 
     * @param target Plain javascript object that we want to observe for changes
     * @param domDelay If true, then observable slim will batch up observed changes to `target` on a 10ms delay (via setTimeout).
     *                 If false, then `observer` will be immediately invoked after each individual change made to `target`. It is helpful to
     *                 set `domDelay` to `true` when your `observer` function makes DOM manipulations.
     * @param observer Will be invoked when a change is made to the proxy of `target`.
     */
    export function create(target: Record<any, any>, domDelay: boolean, observer: (changes: ObservableChange[]) => any | void);
}