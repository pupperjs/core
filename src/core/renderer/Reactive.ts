import type { Renderer } from "../../pupper";
import type { NodeOptions } from "../Renderer";
import type Reactor from "./Reactor";

export namespace Reactive {
    type K = keyof HTMLElementEventMap;

    export type HTMLEventCallback = (this: HTMLElement, ev: HTMLElementEventMap[K]) => any;

    export type ReactiveData = Record<string, any>;
    export type ReactiveTarget = "text" | "html" | "attribute" | "foreach" | "if";
    export type ReactiveCommand = "escape" | "literal" | null;
    export type ReactiveMethods = Record<string, HTMLEventCallback>;

    export type Context = (ProxyHandler<Reactive.ReactiveData> | Record<any, any>);

    export interface ReactiveNodeOptions extends Record<string, any> {
        /**
         * The reactive command for this item
         */
        command?: Reactive.ReactiveCommand,

        /**
         * The initial item value
         */
        initialValue?: any,
        
        /**
         * Any node options to be passed to the reactive node
         */
        nodeOptions?: NodeOptions
    }

    export class AbstractReactor {
        public static readonly Type: string;

        protected readonly reactor: Reactor;

        constructor(
            public readonly renderer: Renderer,
            public readonly path: string,
            public readonly element: HTMLElement | Element | Node,
            public readonly options: Reactive.ReactiveNodeOptions,
        ) {
            this.reactor = renderer.reactor;
        }

        /**
         * Retrieves the reactor path
         * @returns 
         */
        public getPath(): string | RegExp {
            return this.path;
        }

        /**
         * Tests if the path can be handled by the reactor
         * @param path The path to be tested
         */
        public test(path: string): boolean {
            return this.path === path;
        }

        /**
         * Handles a new reacted value
         * @param path The path to be handled
         * @param newValue The value to be handled
         */
        public handle(path: string, newValue?: any): any {
            throw new Error("Abstract class not implemented.");
        }
    }
}