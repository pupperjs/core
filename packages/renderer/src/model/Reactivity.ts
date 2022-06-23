type TEffect = () => any | Promise<any>;
export type TReactiveObj = Record<string | number | symbol, any>;

const effects = new Map<TReactiveObj, Record<string | symbol, TEffect[]>>();
let currentEffect: TEffect = null;

import { Component } from "../core/Component";
import Debugger from "../util/Debugger";

const debug = Debugger.extend("reactivity");

const ProxySymbol = Symbol("$Proxy");

/**
 * Merges multiple proxies / objects into one.
 * @param objects All proxies / objects to be merged
 * @returns 
 */
export function mergeProxies(objects: Record<string, any>[]) {
    return reactive(
        objects.reduce((carrier, obj) => {
            for(let key in obj) {
                carrier[key] = obj[key];
            }

            return carrier;
        }, {})
    );
}

export async function effect(effect: TEffect) {
    currentEffect = effect;

    // Calling the effect immediately will make it
    // be detected and registered at the effects handler.
    await effect();

    currentEffect = null;

    return () => {
        effects.forEach((val, key) => {
            for(let prop in val) {
                if (val[prop].includes(effect)) {
                    val[prop].splice(val[prop].indexOf(effect), 1);
                    effects.set(key, val);
                }
            }
        });
    };
}

let recursion: any[] = [];

export function reactive(obj: TReactiveObj) {
    // Ignore if it's not a valid object
    if (!obj) {
        return obj;
    }

    for(let property in obj) {
        // Proxy subobjects
        if (
            // Do not proxy non-objects
            (typeof obj[property] === "object" || Array.isArray(obj[property])) && 
            // Do not proxy components
            !(obj[property] instanceof Component) &&
            // Do not proxy already proxied objects
            obj[ProxySymbol] === undefined
        ) {
            if (recursion.includes(obj)) {
                console.warn("reactive recursion detected:", recursion, obj);
                continue;
            }

            recursion.push(obj);
            obj[property] = reactive(obj[property]);
        }
    }

    recursion = [];

    obj[ProxySymbol] = true;

    return new Proxy(obj, {
        get(target, property) {
            // If detected no current effect
            // or this property is somehow undefined
            if (currentEffect === null || target[property] === undefined) {
                // Ignore
                return target[property];
            }

            // Ignore functions and proxies
            if (typeof target[property] === "function" || property === ProxySymbol) {
                return target[property];
            }

            // If this target has no effects yet
            if (!effects.has(target)) {
                // Add a new effect handler to it
                effects.set(target, {} as any);
            }

            // Retrieves the effects for the current target
            const targetEffects = effects.get(target);

            // If has no effect handler for this property yet
            if (!targetEffects[property]) {
                // Create a new one
                targetEffects[property] = [
                    currentEffect
                ];
            } else {
                // Add the bubble to it
                targetEffects[property].push(currentEffect);
            }

            debug("effect access property %s from %O", property, target);

            return target[property];
        },

        set(target, property, value) {
            // JavaScript, for some reason, treats "null" as an object
            if (typeof value === null) {
                target[property] = null;
            } else
            // Only objects / arrays can be reactive
            if (typeof value === "object") {
                // If it's not proxied yet
                if (value[ProxySymbol] === undefined) {
                    target[property] = reactive(value);
                }
            } else {
                target[property] = value;
            }

            // If has any effects for the given target
            if (effects.has(target)) {
                const targetEffects = effects.get(target);
                let propEffects = targetEffects[property];

                // If it's a valid array
                if (Array.isArray(propEffects)) {
                    (async () => {
                        for(let effect of propEffects) {
                            await effect();
                        }
                    })();
                }
            }

            return true;
        }
    })
}